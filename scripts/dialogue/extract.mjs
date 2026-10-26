// Every line of text in the game that someone reads: what the neighbors say (and to whom), the narration, messages and
// the rest, found in game/src by reading its JavaScript, each with where it is (file, line, the tables and functions
// round it), who says it when that can be told, and its exact original text in the source (so an edited line can be
// put back: scripts/dialogue/apply.mjs). Writes JSON rows for make-sheet.py to turn into a spreadsheet.
//
//   node scripts/dialogue/extract.mjs out.json
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const SRC = path.join(ROOT, 'game/src');

// who's who: the neighbors (22_npc.js), and the people who visit Sarah's island
const npcSrc = fs.readFileSync(path.join(SRC, '22_npc.js'), 'utf8');
const defs = npcSrc.slice(npcSrc.indexOf('const NPC_DEFS'), npcSrc.indexOf('\n};', npcSrc.indexOf('const NPC_DEFS')));
export const NPCS = Object.fromEntries([...defs.matchAll(/^\s{4}(\w+):\s+\{\s*name: '([^']+)'/gm)].map(m => [m[1], m[2]]));
NPCS.sarah = 'Sarah';
const VISITORS = new Set(['david', 'james', 'john', 'joe', 'elizabeth', 'sarah']);

// files that are pictures, the 3D view or plumbing: no one reads their strings
const SKIP = /^(00_|01_|1[0-3]_|3[0-3]|6x_|9)/;

/* ---------------------------------------------------------------- reading JavaScript */
function unescape1(e) {
    const c = e[1];
    if (c === 'u' && e[2] === '{') return String.fromCodePoint(parseInt(e.slice(3, -1), 16));
    if (c === 'u' || c === 'x') return String.fromCharCode(parseInt(e.slice(2), 16));
    return { n: '\n', t: '\t', r: '', b: '', '0': '' }[c] ?? c;
}
// a small reader: strings, template literals (with their ${...} code), comments, regular expressions, and the nesting of
// braces, brackets and parentheses, with the key or name each one opened under and the call each argument is in
function scan(file, text, base) {
    const out = [];
    const stack = base ? base.map(f => Object.assign({}, f, { args: f.args ? f.args.slice() : f.args })) : [{ ch: 'top', name: path.basename(file), key: null, fn: null }];
    let i = 0, line = 1, prev = null;                        // prev: the last token { t: 'id'|'str'|'num'|'p', v }
    let lastId = null, assignName = null, pendingFn = null;
    const top = () => stack[stack.length - 1];
    let prev2 = null;
    const tok = (t, v) => { prev2 = prev; prev = { t, v }; };
    const regexOk = () => !prev || (prev.t === 'p' && /^[(,=:[!&|?{};+\-*%<>~^]$|^(=>|&&|\|\||\?\?)$/.test(prev.v)) || (prev.t === 'id' && /^(return|typeof|case|in|of|new|delete|void|throw|else|do)$/.test(prev.v));
    const emit = (raw, value, kind, startLine) => {
        const named = prev && prev.t === 'p' && prev.v === '=' && assignName ? assignName : null;
        const ctx = stack.slice(1).map(f => ({ ch: f.ch, name: f.name, key: f.key, fn: f.fn, call: f.call, arg: f.arg, args: f.args ? f.args.slice() : null, idx: f.idx, idv: f.idv }));
        out.push({ file: path.basename(file), line: startLine, raw, value, kind, ctx, key: top().key, named });
    };
    while (i < text.length) {
        const c = text[i], d = text[i + 1];
        if (c === '\n') { line++; i++; continue; }
        if (c === '/' && d === '/') { while (i < text.length && text[i] !== '\n') i++; continue; }
        if (c === '/' && d === '*') { const e = text.indexOf('*/', i + 2); for (let k = i; k < e; k++) if (text[k] === '\n') line++; i = e + 2; continue; }
        if (c === '"' || c === "'") {
            const s = i, l0 = line; i++;
            while (i < text.length && text[i] !== c) { if (text[i] === '\\') i++; else if (text[i] === '\n') line++; i++; }
            i++;
            const raw = text.slice(s, i);
            const value = raw.slice(1, -1).replace(/\\(u\{[0-9a-f]+\}|u[0-9a-f]{4}|x[0-9a-f]{2}|[^])/gi, unescape1);
            if (top().ch === '{' && top().key === 'id' && !top().idv) top().idv = value;
            emit(raw, value, 'str', l0);
            tok('str', value);
            continue;
        }
        if (c === '`') {
            // a template: its text with each ${...} shown as {...}; the code inside is read too (it can hold strings)
            const s = i, l0 = line; i++;
            let shown = '';
            while (i < text.length && text[i] !== '`') {
                if (text[i] === '\\') { const m = /^\\(u\{[0-9a-f]+\}|u[0-9a-f]{4}|x[0-9a-f]{2}|[^])/i.exec(text.slice(i, i + 12)); shown += unescape1(m[0]); i += m[0].length; continue; }
                if (text[i] === '$' && text[i + 1] === '{') {
                    let depth = 1, j = i + 2;
                    while (j < text.length && depth) { const ch = text[j]; if (ch === '{') depth++; else if (ch === '}') depth--; else if (ch === "'" || ch === '"' || ch === '`') { const q = ch; j++; while (j < text.length && text[j] !== q) { if (text[j] === '\\') j++; j++; } } if (depth) j++; }
                    const code = text.slice(i + 2, j);
                    shown += '{' + code.trim().replace(/\s+/g, ' ') + '}';
                    // (the strings inside: a template within a template's code is read as its own line)
                    for (const r of scan(file, code, stack)) { r.line += line - 1; out.push(r); }
                    for (let k = i; k < j; k++) if (text[k] === '\n') line++;
                    i = j + 1; continue;
                }
                if (text[i] === '\n') line++;
                shown += text[i]; i++;
            }
            i++;
            emit(text.slice(s, i), shown, 'tpl', l0);
            tok('str', shown);
            continue;
        }
        if (c === '/' && regexOk()) {
            i++; let cls = false;
            while (i < text.length && (text[i] !== '/' || cls)) { if (text[i] === '\\') i++; else if (text[i] === '[') cls = true; else if (text[i] === ']') cls = false; i++; }
            i++; while (/[a-z]/.test(text[i] || '')) i++;
            tok('re', ''); continue;
        }
        if (/[A-Za-z_$]/.test(c)) {
            let j = i; while (/[\w$]/.test(text[j] || '')) j++;
            const w = text.slice(i, j); i = j;
            if (prev && prev.t === 'id' && prev.v === 'function') pendingFn = w;
            if (/^(const|let|var)$/.test(prev && prev.v)) assignName = w;
            lastId = w; tok('id', w); continue;
        }
        if (/[0-9]/.test(c)) { let j = i; while (/[\w.]/.test(text[j] || '')) j++; i = j; tok('num', ''); continue; }
        if (c === '=' && d === '>') { tok('p', '=>'); i += 2; continue; }
        if (c === ':' && top().ch === '{' && prev && (prev.t === 'id' || prev.t === 'str' || prev.t === 'num') && (!prev2 || (prev2.t === 'p' && (prev2.v === '{' || prev2.v === ',')))) { top().key = prev.v; tok('p', ':'); i++; continue; }
        if (c === '(') {
            // a call (the name before it, a dotted one too) or a function's parameters
            let callee = null;
            if (prev && prev.t === 'id') { let j = i - 1; while (j >= 0 && /[\w$.]/.test(text[j])) j--; callee = text.slice(j + 1, i); }
            stack.push({ ch: '(', name: null, key: null, call: callee, arg: 0, fnName: pendingFn || (top().ch === '{' && callee && !callee.includes('.') ? callee : null), args: [], from: i + 1 });
            pendingFn = null; tok('p', '('); i++; continue;
        }
        if (c === '{' || c === '[') {
            const t = top();
            let name = null, fn = null;
            if (c === '{' && prev && prev.t === 'p' && prev.v === ')' && t.lastParen) fn = t.lastParen;
            else if (c === '{' && prev && prev.t === 'p' && prev.v === '=>') fn = t.key || assignName;
            if (t.ch === '{' && t.key != null) name = t.key; else if (prev && prev.t === 'p' && prev.v === '=' && assignName) name = assignName;
            else if (t.ch === '[') name = '#';
            stack.push({ ch: c, name, key: null, fn, idx: 0 });
            tok('p', c); i++; continue;
        }
        if (c === ')' || c === '}' || c === ']') {
            const f = stack.length > 1 ? stack.pop() : null;
            if (f && f.ch === '(') top().lastParen = f.fnName || null; else top().lastParen = null;
            if (f && f.ch === '{' && top().ch === '{') top().key = top().key;          // (keeps the key until the next one)
            tok('p', c); i++; continue;
        }
        if (c === ',') { const t = top(); if (t.ch === '(') { t.args.push(text.slice(t.from, i).trim()); t.from = i + 1; t.arg++; } if (t.ch === '[') t.idx++; if (t.ch === '{') t.key = null; tok('p', ','); i++; continue; }
        if (c === ';') { assignName = null; tok('p', ';'); i++; continue; }
        if (c === '=' && d !== '=' && !'=!<>+-*/%&|^'.includes(text[i - 1]) && prev && prev.t === 'id') {
            let j = i - 1; while (j >= 0 && /\s/.test(text[j])) j--;
            let k = j; while (k >= 0 && /[\w$.]/.test(text[k])) k--;
            assignName = text.slice(k + 1, j + 1);
            tok('p', '='); i++; continue;
        }
        if (!/\s/.test(c)) tok('p', c);
        i++;
    }
    return out;
}

/* ---------------------------------------------------------------- which strings are lines people read */
const CODEY = /(^|[^a-z])(vec[234]|gl_|float |uniform |void main|px;|\d+px\b|rgba?\(|#[0-9a-f]{3,8}\b|:not\(|=>|&&|\|\||===|\.js\b|\.png\b|\.glb\b|https?:|application\/)/i;
function readable(r) {
    const v = r.value.replace(/\{[^}]*\}/g, 'X').trim();
    if (!/[a-z]/i.test(v)) return false;
    if (CODEY.test(r.value) || /:not\(|\[hidden\]|^#[a-z]/.test(r.value)) return false;
    if (/^[\w\-./#: ]*$/.test(v) && !/\s/.test(v)) return false;           // an id, a class name, a key
    if (/^<[a-z]/i.test(v)) return false;
    const words = v.split(/\s+/).filter(w => /[a-z]/i.test(w)).length;
    const call = callOf(r);
    if (call && /^(console\.|Error|addEventListener|querySelector|\$|getElementById|classList|setAttribute|lsGet|lsSet|fetch|import|require|postMessage|getItem|setItem|createElement|replace|match|split|test|startsWith|endsWith|includes|indexOf|toggle|hash32|mulberry|spr|sfx|Sfx|play|Audio2)/.test(call.call || '')) return false;
    if (r.ctx.some(f => f.ch === '(' && /^(console\.|new Error|Error)$/.test(f.call || ''))) return false;
    if (call && /^(UI\.say|UI\.ask|UI\.toast|toast|say|ask|textNpc|sendText|addMail|mail)/.test(call.call || '')) return words >= 1 && !(/UI\.(say|ask)$/.test(call.call) && call.arg === 0);
    if (r.ctx.some(f => f.name && NPCS[f.name]) || NPCS[r.key]) return words >= 2;
    return words >= 3 && v.length >= 12;
}
function callOf(r) { for (let k = r.ctx.length - 1; k >= 0; k--) if (r.ctx[k].ch === '(' && r.ctx[k].call) return r.ctx[k]; return null; }

/* ---------------------------------------------------------------- all of it */
export function extract() {
    const rows = [];
    for (const f of fs.readdirSync(SRC).filter(f => f.endsWith('.js')).sort()) {
        if (SKIP.test(f)) continue;
        const text = fs.readFileSync(path.join(SRC, f), 'utf8');
        const seen = new Map();
        for (const r of scan(f, text)) {
            if (!readable(r)) continue;
            const n = (seen.get(r.raw) || 0) + 1; seen.set(r.raw, n);
            const chain = r.ctx.filter(x => x.ch !== '(').flatMap(x => [...(x.name && x.name !== '#' ? String(x.name).split('.') : []), x.ch === '[' ? '[' + x.idx + ']' : null, x.idv ? '@' + x.idv : null]).filter(Boolean);
            if (r.named) chain.push(...r.named.split('.'));
            if (r.key != null) chain.push(String(r.key));
            const fns = r.ctx.map(x => x.fn).filter(Boolean), call = callOf(r);
            rows.push({ file: f, line: r.line, raw: r.raw, occ: n, text: r.value, chain, fn: fns[fns.length - 1] || null, fns, call: call ? call.call : null, arg: call ? call.arg : null, arg0: call && call.args && call.args.length ? call.args[0] : null });
        }
    }
    return rows;
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const rows = extract();
    fs.writeFileSync(process.argv[2] || 'dialogue.json', JSON.stringify({ npcs: NPCS, rows }, null, 0));
    console.log(rows.length, 'lines');
}
