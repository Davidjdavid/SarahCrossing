// Puts David's edits from the dialogue spreadsheet (export.mjs) back into the game: every row of the Dialogue sheet
// with something in "Your new line" (other than the original itself) replaces its original in the code, found by its exact original text nearest the
// line it was on (so the code can have moved a little since the sheet was made). Quotes and escapes are written to
// suit the original; in a template, {code} parts that were in the original go back as ${code}. Rows whose original
// can't be found are listed and left alone. The New sheet's edits are written to a JSON file for when those features
// are built. Needs python3 with openpyxl.
//
//   node scripts/dialogue/apply.mjs dialogue.xlsx [--src game/src] [--dry]
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

/* the new line written as a string like its original */
export function requote(raw, text) {
    const q = raw[0];
    if (q === '`') {
        const exprs = new Map();
        // (the original's ${...} parts, as the sheet showed them: {...})
        let i = 0;
        while ((i = raw.indexOf('${', i)) >= 0) {
            let depth = 1, j = i + 2;
            while (j < raw.length && depth) { if (raw[j] === '{') depth++; else if (raw[j] === '}') depth--; if (depth) j++; }
            const code = raw.slice(i + 2, j);
            exprs.set('{' + code.trim().replace(/\s+/g, ' ') + '}', '${' + code + '}');
            i = j + 1;
        }
        let out = '', k = 0;
        while (k < text.length) {
            if (text[k] === '{') {
                const hit = [...exprs.keys()].find(e => text.startsWith(e, k));
                if (hit) { out += exprs.get(hit); k += hit.length; continue; }
            }
            const c = text[k];
            out += c === '`' ? '\\`' : c === '\\' ? '\\\\' : c === '$' && text[k + 1] === '{' ? '\\$' : c;
            k++;
        }
        return '`' + out + '`';
    }
    return q + text.replace(/\\/g, '\\\\').replace(new RegExp(q, 'g'), '\\' + q).replace(/\n/g, '\\n') + q;
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    const xlsx = args.find(a => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--src');
    const src = path.resolve(args.includes('--src') ? args[args.indexOf('--src') + 1] : 'game/src');
    const dry = args.includes('--dry');
    if (!xlsx) { console.log('usage: node scripts/dialogue/apply.mjs dialogue.xlsx [--src game/src] [--dry]'); process.exit(1); }

    const tmp = path.join(os.tmpdir(), 'dialogue-edits.json');
    execFileSync('python3', [path.join(import.meta.dirname, 'read-sheet.py'), xlsx, tmp]);
    const edits = JSON.parse(fs.readFileSync(tmp, 'utf8'));

    const files = new Map(), missing = [], done = [];
    for (const e of edits.lines) {
        // (a "new line" the same as the original is a row kept as it was: nothing to write)
        if (e.new == null || String(e.new).replace(/\r\n/g, '\n').trim() === String(e.line).trim()) continue;
        const [file, ln] = String(e.src).split(':');
        const p = path.join(src, file);
        if (!fs.existsSync(p)) { missing.push(e); continue; }
        if (!files.has(p)) files.set(p, fs.readFileSync(p, 'utf8'));
        const text = files.get(p), want = +ln;
        // the occurrence of the original nearest its old line
        let best = -1, bestD = Infinity, i = -1;
        while ((i = text.indexOf(e.raw, i + 1)) >= 0) {
            const at = text.slice(0, i).split('\n').length, d = Math.abs(at - want);
            if (d < bestD) { best = i; bestD = d; }
        }
        if (best < 0) { missing.push(e); continue; }
        files.set(p, text.slice(0, best) + requote(e.raw, e.new.replace(/\r\n/g, '\n')) + text.slice(best + e.raw.length));
        done.push(e);
    }
    if (!dry) for (const [p, t] of files) fs.writeFileSync(p, t);
    const notes = edits.lines.filter(e => e.notes).map(e => ({ id: e.id, line: e.line, new: e.new, notes: e.notes }));
    const keep = path.resolve('docs/dialogue/notes-from-david.json');
    if (!dry && (notes.length || edits.fresh.length)) { fs.mkdirSync(path.dirname(keep), { recursive: true }); fs.writeFileSync(keep, JSON.stringify({ notes, fresh: edits.fresh }, null, 1)); }
    console.log(`${done.length} lines changed${dry ? ' (dry run: nothing written)' : ''}, ${missing.length} not found, ${notes.length} notes, ${edits.fresh.length} edits to new lines`);
    for (const e of missing) console.log('  not found:', e.id, e.src, String(e.line).slice(0, 60));
}
