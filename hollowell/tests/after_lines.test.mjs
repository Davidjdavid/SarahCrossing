// The free valley's lines and the end's words (the restraint pass, 11 November): after the end, one line each about
// what people are up to, never what they said when they were cut free; the theme left to what's seen (none of the old
// summing-up lines anywhere); the re-carved Well drawn inside its stone; every line in the font and in its box.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadGame } from './harness.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const plain = l => l.replace(/^\{[a-z]+\}/, '');

test('after the end: one line each for the valley\'s people (Gran and Linnet two, for the bench), none a line they said when cut free', () => {
    const HW = loadGame();
    const A = HW.global('AFTER_LINES'), F = HW.global('FREE_LINES'), C = HW.global('CUT_LINES');
    assert.ok(Object.keys(A).length >= 30, Object.keys(A).length + ' people');
    for (const [who, L] of Object.entries(A)) {
        assert.equal(L.length, who === 'gran' || who === 'linnet' ? 2 : 1, who);
        for (const l of L) for (const f of [...(F[who] || []), C[who] || '']) assert.ok(!f.includes(plain(l).slice(0, 24)), `${who} says it twice: ${l}`);
    }
    for (const [who, L] of Object.entries(F)) assert.equal(L.length, 1, who + ', cut free');
});

test('the theme is left to what\'s seen: none of the old summing-up lines is anywhere in the game', () => {
    const src = fs.readdirSync(path.join(ROOT, 'src')).filter(f => f.endsWith('.js')).map(f => fs.readFileSync(path.join(ROOT, 'src', f), 'utf8')).join('\n');
    const gone = ["That's the difference", 'WHEREVER THAT IS', 'AND EVERYONE IN THEIRS', 'who only meant to keep things safe', 'Hesper, who let go',
        'Linnet, who came home', 'People choose theirs', 'Some things get lost.', '1971', "That's how houses are", "That's the whole trick of it",
        "That's the job.", "A thread's only a thread", 'nobody, nobody', 'I held on so tight', 'Nothing can, now, unless you let it',
        'the lightest thing in the world', "That's the price", "and that's all right too", 'I wanted her to let go', 'SHE MEANT TO UNPICK',
        'Nobody pulled it', "and doesn't need to", 'Nothing needs to.', 'You saw to that.', 'Turns out so do I', "That's the beauty of it",
        "Who knew it'd taste better", "I'd forgotten mending", "That's what strings are FOR", 'Best morning of my life', "I've never been happier",
        "I've never been so happy", 'It was wonderful.', 'Because I can.', "I'm not. Funny, that.", 'Most things are, it turns out',
        'Everybody can run now', "Nothing's told it to go anywhere", 'the best thing this town knows how to make', 'For fun, now.', 'For play.'];
    for (const g of gone) assert.ok(!src.includes(g), `still in the game: "${g}"`);
});

test('the re-carved Well, close up: the old words, and under them one new word, inside the stone', () => {
    const HW = loadGame(); HW.preset('afterEnding'); HW.step(5); HW.skipTalk();
    const Font = HW.global('Font'), out = [], d0 = Font.draw;
    HW.G.card = 'motto';
    Font.draw = function (s, x, y, ...r) { out.push([s, x, y, Font.width(s)]); return d0.call(this, s, x, y, ...r); };
    try { HW.global('Ending').overlay(); } finally { Font.draw = d0; HW.G.card = null; }
    const said = out.map(r => r[0]);
    assert.ok(said.includes('EVERYTHING IN ITS PLACE') && said.includes('AND'), said.join(' | '));
    /* (the stone: 172 x 62, centred, 16 down; the new word starts the line under the old words, where they start) */
    const W = 320, x0 = (W - 172) >> 1, y0 = 16;
    for (const [s, x, y, w] of out) assert.ok(x >= x0 + 2 && x + w <= x0 + 172 - 3 && y >= y0 + 2 && y + 8 <= y0 + 62, `"${s}" at ${x},${y}`);
    const old = out.find(r => r[0] === 'EVERYTHING IN ITS PLACE'), and = out.find(r => r[0] === 'AND');
    assert.ok(and[1] === old[1] && and[2] > old[2], 'AND, under the start of the old words');
    assert.match(HW.global('MOTTO')[3][2], /EVERYTHING IN ITS PLACE\. Under it, one new word, freshly cut: AND\./);
});

test('every line after the end, every cut-free moment, the Well and the Makers\' words: in the font, three pages or fewer', () => {
    const HW = loadGame(); HW.G.wanderer = 'WWWWWWWWWW';
    const FONT = HW.global('FONT'), PG = HW.global('paginate'), lines = [];
    for (const L of Object.values(HW.global('AFTER_LINES'))) lines.push(...L);
    lines.push(...Object.values(HW.global('CUT_LINES')), ...HW.global('MOTTO').map(m => m[2]), ...HW.global('MAKINGS').filter(m => m.after).map(m => m.after));
    for (const t of lines) {
        const s = HW.Story.fill(t);
        for (const ch of s.replace(/\{[^}]*\}/g, '')) assert.ok(FONT[ch], `a character the font hasn't got (${JSON.stringify(ch)}) in "${t}"`);
        const pages = PG(s, 246, 3);          /* (as narrow as it gets: the box with a portrait in it) */
        assert.ok(pages.length <= 3, `${pages.length} pages: "${t}"`);
        for (let i = 1; i < pages.length; i++) if (!/[.!?]["')]*$/.test(pages[i - 1].join(' '))) assert.ok(pages[i].length >= 2, `a stub page: "${pages[i].join(' ')}"`);
    }
});
