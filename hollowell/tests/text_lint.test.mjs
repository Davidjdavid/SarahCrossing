// The words on screen, linted (the dialogue pass, 12 November): every string in the built script that reads as words a
// player sees (lines, signs, notices, notes, item names, menus) checked for the slips a dialogue pass looks for: a word
// said twice, two spaces, a space before punctuation, an unbalanced quote or bracket, "the house" where it means one
// of the Houses, and the slips that pass fixed (one spelling, British, throughout; the names one way). And every line
// fits three pages of the dialogue box, as narrow as it gets, with the longest name a player can type.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadGame } from './harness.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const FILE = process.env.HW_LINT_FILE || path.join(ROOT, 'dist', 'hollowell.js');
/* (the debug panel and the probe talk to developers, not players) */
const NOT_PLAYED = new Set(['25_debug.js', '26_probe.js']);

/* every string literal in the script, with the source file it came from (tools/build.mjs marks each "// ---- f ----"):
   quotes, template literals (each ${...} read as code, its text a placeholder), comments and regex literals skipped */
function strings(src) {
    const out = [];
    let i = 0, file = '', last = '';
    const words = /(?:^|[^\w$])(return|typeof|case|in|of|delete|void|throw|new|else|do|yield|await)$/;
    const regexOk = () => !last || /[(,=:[!&|?{};+\-*%<>~^]/.test(last) || words.test(src.slice(Math.max(0, i - 8), i).trimEnd());
    function quoted(q) {
        let s = ''; i++;
        while (i < src.length && src[i] !== q) {
            if (src[i] === '\\') { const c = src[i + 1]; s += c === 'n' ? '\n' : c === 'x' ? String.fromCharCode(parseInt(src.slice(i + 2, i + 4), 16)) : c === 'u' ? String.fromCharCode(parseInt(src.slice(i + 2, i + 6), 16)) : c; i += c === 'x' ? 4 : c === 'u' ? 6 : 2; continue; }
            s += src[i++];
        }
        i++; return s;
    }
    function template() {
        let s = ''; i++;
        while (i < src.length && src[i] !== '`') {
            if (src[i] === '\\') { s += src[i + 1]; i += 2; continue; }
            if (src[i] === '$' && src[i + 1] === '{') { i += 2; code(true); s += '•'; continue; }
            s += src[i++];
        }
        i++; return s;
    }
    function regex() {
        i++; let cls = false;
        while (i < src.length) {
            const c = src[i];
            if (c === '\\') { i += 2; continue; }
            if (c === '[') cls = true; else if (c === ']') cls = false;
            else if (c === '/' && !cls) break;
            else if (c === '\n') break;
            i++;
        }
        i++; while (/[a-z]/.test(src[i] || '')) i++;
    }
    /* code: to the end, or (inside a template's ${...}) to the brace that closes it */
    function code(inner) {
        let depth = 0;
        while (i < src.length) {
            const c = src[i], d = src[i + 1];
            if (c === '/' && d === '/') {
                const e = src.indexOf('\n', i); const line = src.slice(i, e < 0 ? src.length : e);
                const m = line.match(/^\/\/ ---- (\S+) ----$/); if (m) file = m[1];
                i = e < 0 ? src.length : e; continue;
            }
            if (c === '/' && d === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? src.length : e + 2; continue; }
            if (c === '"' || c === "'") { out.push({ s: quoted(c), file }); last = 'x'; continue; }
            if (c === '`') { const f = file; out.push({ s: template(), file: f }); last = 'x'; continue; }
            if (c === '/' && regexOk()) { regex(); last = 'x'; continue; }
            if (c === '{') depth++;
            if (c === '}') { if (inner && depth === 0) { i++; return; } depth--; }
            if (!/\s/.test(c)) last = c;
            i++;
        }
    }
    code(false);
    return out;
}

/* what a player reads: the markup taken out ({happy}, {blue}...{/}), the name and the buttons filled in */
const plain = s => s.replace(/\{name\}/g, 'Wren').replace(/\{[a-z]*\/?\}/g, '').replace(/\[(up|down|left|right|act|atk|tool|prev|next|menu|map)\]/g, '‣');
/* words, not data: two words or more of small letters, and mostly letters (not map rows, pixel art, tunes, colours) */
const prose = s => { const t = plain(s); return / /.test(t) && (t.match(/\b[a-z]{2,}\b/g) || []).length >= 2 && (t.match(/[a-z]/g) || []).length / t.length > 0.45; };

const ALL = strings(fs.readFileSync(FILE, 'utf8')).filter(x => !NOT_PLAYED.has(x.file));
const LINES = ALL.filter(x => prose(x.s));
/* and the names on screen: rooms, places, things ("The Bell Frame", "Gran's house"), read for spelling */
const NAMES = ALL.filter(x => /^(?:The |the )?[A-Z][a-z]+(?:[ '-][A-Za-z]+){0,4}$/.test(x.s) && !prose(x.s));

/* each check: what it finds in a line's plain words (or null); words doubled on purpose are the snores and the tsks */
const DOUBLED_OK = new Set(['tsk', 'z', 'yan', 'ha', 'tick']);
const HOUSE_OK = /on the house|house lights|under the house|the house is very quiet/i;
const CHECKS = {
    'a word twice': t => { const m = t.match(/\b([A-Za-z']+)\s+\1\b/i); return m && !DOUBLED_OK.has(m[1].toLowerCase()) ? m[0] : null; },
    'two spaces': t => (t.match(/\S {2}(?! )\S/) || [null])[0],
    'a space before punctuation': t => (t.match(/\w [,!?;:]|\w \.(?!\.)/) || [null])[0],
    'an odd number of double quotes': t => (t.match(/"/g) || []).length % 2 ? '"' : null,
    'brackets that don\'t pair': t => ((t.match(/\(/g) || []).length !== (t.match(/\)/g) || []).length || (t.match(/\[/g) || []).length !== (t.match(/\]/g) || []).length) ? '()[]' : null,
    '"house" for one of the Houses': t => { const m = t.match(/\b(the|old|oldest|this|that) house\b/); return m && !HOUSE_OK.test(t) ? m[0] : null; },
    /* (slips the dialogue pass fixed: kept fixed) */
    'an American spelling': t => (t.match(/\b(toward|Parlor|parlor|color|colors|favorite|gray|center|theater|traveling|practicing|dreamed)\b/) || [null])[0],
    'a hyphen for a broken-off word (the game uses —)': t => (t.match(/[a-z]- [a-z]/) || [null])[0],
    'a signature with a space (" -L.", as on every other note)': t => (t.match(/[.!?)] - [A-Z]\.$|[.!?)] - [A-Z]\.["']/) || [null])[0],
    'an action in asterisks': t => (t.match(/\*[A-Za-z][^*]*\*/) || [null])[0],
    '"your Gran" (a gran; Gran is her name)': t => (t.match(/\b[Yy]our Gran\b/) || [null])[0],
    'a tool named in lower case': t => (t.match(/\bthe needle\b|\bthe bedroll\b|\bthe hookline\b|\bthe shears\b/) || [null])[0],
    'a name with an article': t => (t.match(/\bthe Tollgrim\b|\bThe Tollgrim\b|\bthe Cog\b/) || [null])[0],
    'a key named outright (the game names the bound one: [act])': t => (t.match(/\((?:Z|X|C) on the|press (?:Z|X|C)\b/) || [null])[0],
};
/* (files another helper had open during the pass, their slips handed over in its report: src/67b, 70, 72b, 75) */
const PENDING = [
    ['a tool named in lower case', '67b_spool_foes.js', /walk the needle with the arrows/],
    ['an American spelling', '75_greatspool.js', /toward the drum|Toward the town, toward the Well/],
];
const pending = (name, x) => PENDING.some(([n, f, re]) => n === name && f === x.file && re.test(x.s));

for (const [name, find] of Object.entries(CHECKS)) {
    test('the words on screen: never ' + name, () => {
        const bad = [];
        for (const x of name === 'an American spelling' ? LINES.concat(NAMES) : LINES) { const t = plain(x.s), hit = find(t); if (hit && !pending(name, x)) bad.push(`${x.file}: [${hit}] ${t.slice(0, 110)}`); }
        assert.equal(bad.length, 0, bad.slice(0, 20).join('\n'));
    });
}

test('the words on screen: every line fits three pages of the box beside a portrait, with the longest name', () => {
    const HW = loadGame(); HW.G.wanderer = 'WWWWWWWWWW';
    const PG = HW.global('paginate'), FONT = HW.global('FONT'), bad = [];
    for (const x of LINES) {
        if (x.s.includes('•')) continue;          /* (a line built at run time: its parts are measured where it's said) */
        const s = HW.Story.fill(x.s.replace(/^\{[a-z]+\}/, ''));
        const n = PG(s, 246, 3).length;
        if (n > 3) bad.push(`${x.file}: ${n} pages: ${s.slice(0, 80)}`);
        for (const ch of s.replace(/\{[^}]*\}/g, '')) if (!FONT[ch] && ch !== '\n') { bad.push(`${x.file}: no glyph for ${JSON.stringify(ch)}: ${s.slice(0, 60)}`); break; }
    }
    assert.equal(bad.length, 0, bad.slice(0, 20).join('\n'));
});

test('the lint reads the script: it finds the lines, and a planted slip of each kind would be caught', () => {
    assert.ok(LINES.length > 1500 && NAMES.length > 300, LINES.length + ' lines and ' + NAMES.length + ' names read');
    assert.ok(LINES.some(x => x.file === '50_prologue.js' && /Up you get, love/.test(x.s)), 'a line of the prologue, from its file');
    const planted = { 'a word twice': 'It went the the long way.', 'two spaces': 'It went  home.', 'a space before punctuation': 'It went home .',
        'an odd number of double quotes': 'He said "home.', 'brackets that don\'t pair': 'Home (or not.', '"house" for one of the Houses': 'Lucky old house.',
        'an American spelling': 'It went toward home.', 'a hyphen for a broken-off word (the game uses —)': "Oh, that's- that's home.",
        'a signature with a space (" -L.", as on every other note)': 'Home, at last. - L.', 'an action in asterisks': 'Watch. *pushes* Home.',
        '"your Gran" (a gran; Gran is her name)': 'Your Gran says home.', 'a tool named in lower case': 'Walk the needle home.',
        'a name with an article': 'The Tollgrim went home.', 'a key named outright (the game names the bound one: [act])': '(Z on the knot to undo it.)' };
    for (const [name, find] of Object.entries(CHECKS)) assert.ok(find(plain(planted[name])), 'planted: ' + name);
});
