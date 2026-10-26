// The dialogue spreadsheet for David: every line in the game (who says it, to whom, when, where it is) and the new
// lines written for the features to come, as an .xlsx he can edit and send back (scripts/dialogue/apply.mjs puts his
// changes into the code). Needs python3 with openpyxl.
//
//   node scripts/dialogue/export.mjs docs/dialogue/dialogue.xlsx
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { extract, NPCS } from './extract.mjs';
import { describe } from './describe.mjs';
import { NEW_LINES } from './new-civic.mjs';

const out = path.resolve(process.argv[2] || 'docs/dialogue/dialogue.xlsx');
const stem = f => f.replace(/\.js$/, '').replace(/^[0-9a-z]{2}_/, '');
const per = {};
const rows = extract().map(r => {
    const d = describe(r), s = stem(r.file);
    per[s] = (per[s] || 0) + 1;
    return { id: `${s}-${String(per[s]).padStart(4, '0')}`, who: d.who, to: d.to, line: r.text, when: d.when, area: d.area, kind: d.kind, src: `${r.file}:${r.line}`, file: r.file, raw: r.raw, occ: r.occ };
});
const json = path.join(os.tmpdir(), 'dialogue-lines.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(json, JSON.stringify({ made: new Date().toISOString().slice(0, 10), people: NPCS, rows, fresh: NEW_LINES }, null, 1));
execFileSync('python3', [path.join(import.meta.dirname, 'make-sheet.py'), json, out], { stdio: 'inherit' });
console.log(`${rows.length} lines in the game, ${NEW_LINES.length} new ones: ${path.relative(process.cwd(), out)}`);
