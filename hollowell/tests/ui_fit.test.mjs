// What's drawn over the world stays on the screen and inside its box (the polish pass's text checks).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

/* every Font.draw while fn runs: [text, x, y, width] */
function drawn(HW, fn) {
    const Font = HW.global('Font'), out = [], d0 = Font.draw;
    Font.draw = function (s, x, y, ...r) { out.push([s, x, y, Font.width(s)]); return d0.call(this, s, x, y, ...r); };
    try { fn(); } finally { Font.draw = d0; }
    return out;
}
const W = 320, H = 180;

test('a question asked with Wren low on the screen: the choices are on screen (below the box, not above the top)', () => {
    const HW = loadGame(); HW.preset('afterD1'); HW.step(5); HW.skipTalk();
    const Cam = HW.global('Cam'), p = HW.player(), D = HW.global('Dialog');
    for (const low of [true, false]) {
        p.y = Cam.y + (low ? 150 : 40);
        D.open(null, 'Which way?', { choices: ['Up the long stair', 'Down the well', 'Not yet'] });
        D.shown = D.pageLen();
        const t = drawn(HW, () => D.draw());
        for (const c of ['Up the long stair', 'Down the well', 'Not yet']) {
            const e = t.find(r => r[0] === c);
            assert.ok(e && e[2] >= 0 && e[2] + 8 <= H && e[1] >= 0 && e[1] + e[3] <= W, `${low ? 'low' : 'high'}: "${c}" at ${e && e.slice(1, 3)}`);
        }
        D.close();
    }
});

test('the longest name a player can type fits the speaker tag and the lines that use it', () => {
    const HW = loadGame(); HW.preset('afterD1'); HW.step(5); HW.skipTalk();
    HW.G.wanderer = 'WWWWWWWWWW';
    const D = HW.global('Dialog');
    D.open('wren', "{name}! Off to the Tidyhouse, {name}? You'll love it, {name}. Everyone does, {name}.");
    D.shown = 9999;
    const t = drawn(HW, () => D.draw());
    for (const [s, x, , w] of t) assert.ok(x >= 0 && x + w <= W - 8, `"${s}" runs to ${x + w}`);
    D.close();
});

/* ---------- the screen's words, round C (POLISH.md 43-46) ---------- */
/* how much of a box in the world is under a rect on the screen (0..1) */
const under = (Cam, b, r) => { const x0 = b[0] - Cam.x, y0 = b[1] - Cam.y, x1 = b[2] - Cam.x, y1 = b[3] - Cam.y; return Math.max(0, Math.min(x1, r[2]) - Math.max(x0, r[0])) * Math.max(0, Math.min(y1, r[3]) - Math.max(y0, r[1])) / Math.max(1, (x1 - x0) * (y1 - y0)); };
const overlaps = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

test('pages break where a phrase ends: at a colon or a comma rather than mid-phrase; no page of only a closing fragment', () => {
    const HW = loadGame(), pg = HW.global('paginate');
    const page = (s, i) => pg(s, 282, 3)[i].join(' ');
    /* "sits a great knot / of old cord" was split mid-phrase: now the page ends at the colon */
    const knot = 'In the heart of the Works, held in the middle of the floor by four threads to four bobbins, sits a great knot of old cord: every colour, every House, every Wander there has ever been, all wound into one.';
    assert.match(page(knot, 0), /[,:;]$/, 'the first page ends at a comma, colon or semicolon: ' + page(knot, 0));
    /* "whatever's in its / way;" */
    const march = "A sandbag drops onto the trap at centre stage and goes straight through. The Great Marionette clambers up and marches off round the stage like a toy soldier, turning at whatever's in its way; and down a string of its own comes a third little Wren.";
    for (const p of pg(march, 282, 3)) assert.ok(!/ its$/.test(p.join(' ')), 'no page ends "...in its": ' + p.join(' '));
    for (const p of pg(march, 282, 3).slice(0, -1)) assert.match(p.join(' '), /[.,:;!?]["')]*$/, 'every page but the last ends at punctuation');
    /* a page that was only 'Nowhere but bed."': the quotation kept together */
    const sloth = 'Mother Sloth yawns, enormously, and thumps the mattress. Out past the stars the floor drops away into the dark, all of it but a row of old boards along the bottom. "There," she murmurs. "Nowhere left to wander off to. Nowhere but bed."';
    const ps = pg(sloth, 282, 3);
    assert.ok(ps.every(p => p.join(' ') !== 'Nowhere but bed."'), 'no page of only the end of the quotation: ' + JSON.stringify(ps));
    assert.ok(ps.some(p => /^"There," she murmurs\. "Nowhere left to wander off to\. Nowhere but bed\."$/.test(p.join(' '))), 'the quotation on a page of its own');
    for (const s of [knot, march, sloth]) {
        const all = pg(s, 282, 3);
        assert.equal(all.flat().join(' '), s, 'nothing lost');
        assert.ok(all.every(p => p.length <= 3), 'three lines a page at most');
    }
});

test('a question whose words leave room keeps its choices inside the box, off the scene ("Tie it?")', () => {
    const HW = loadGame(); HW.preset('afterD1'); HW.step(5); HW.skipTalk();
    const D = HW.global('Dialog');
    D.open(null, "The House's Knot hangs in the hoop. Tie it?", { choices: ['Tie the Knot', 'Not yet'] });
    assert.equal(D.inside, true, 'inside');
    D.shown = D.pageLen();
    const t = drawn(HW, () => D.draw()), y = D.top ? 18 : H - 50;
    for (const c of ['Tie the Knot', 'Not yet']) { const e = t.find(r => r[0] === c); assert.ok(e && e[2] >= y && e[2] + 8 <= y + 44, `"${c}" inside the box`); }
    for (const l of D.pages[D.pages.length - 1]) { const e = t.find(r => r[0] === l); assert.ok(e[1] + e[3] < t.find(r => r[0] === 'Tie the Knot')[1] - 8, 'the words clear of the choices'); }
    D.close();
});

test('floating words stay a few pixels inside the screen, clear of the HUD, the panels, the pictures over heads and each other', () => {
    const HW = loadGame(); HW.preset('afterD1'); HW.step(5); HW.skipTalk();
    const Fx = HW.global('Fx'), Cam = HW.global('Cam'), p = HW.player();
    HW.Inv.equipped = HW.Inv.equipped || 'stick';
    const said = [[Cam.x + 2, Cam.y + 30, 'Ooh! A shiny button under it!'], [Cam.x + 318, Cam.y + 4, 'Ooh! It jumped!'], [Cam.x + 160, Cam.y + 176, 'clang!'],
        [Cam.x + 40, Cam.y + 8, 'yip!'], [Cam.x + 290, Cam.y + 20, 'tucked in!'], [Cam.x + 150, Cam.y + 90, 'one more!'], [Cam.x + 152, Cam.y + 92, 'again!']];
    Fx.list = said.map(([x, y, text]) => ({ x, y, text, col: '#ffffff', life: 40 }));
    /* a person with a heart over their head right where a line floats */
    const n = HW.G.map.ents.find(e => e.kind === 'npc') || p;
    const bub = { isGrid: true, bubble: 'heart', px: Cam.x + 140, py: Cam.y + 110 };
    HW.G.map.ents.push(bub);
    Fx.list.push({ x: bub.px + 8, y: bub.py - 18, text: 'Ooh! It jumped!!', col: '#ffffff', life: 40 });
    const panels = [[20, 22, 300, 61], [60, 141, 260, 174]];
    const spots = Fx.textSpots(Fx.list, Cam.x, Cam.y, panels), hud = Fx.hudBoxes(), bubbles = Fx.bubbles(Fx.view(Cam.x, Cam.y));
    HW.G.map.ents.pop();
    assert.equal(spots.length, Fx.list.length);
    spots.forEach((s, i) => {
        const r = [s.x - 3, s.y - 2, s.x + s.w + 3, s.y + 10];
        assert.ok(r[0] >= 3 && r[2] <= W - 3 && r[1] >= 3 && r[3] <= H - 3, `"${s.p.text}" inside the screen: ${r}`);
        for (const h of hud) assert.ok(!overlaps(r, h), `"${s.p.text}" clear of the HUD`);
        for (const q of panels) assert.ok(!overlaps(r, q), `"${s.p.text}" clear of the notices`);
        for (const b of bubbles) assert.ok(!overlaps(r, b), `"${s.p.text}" clear of the heart over a head`);
        spots.slice(0, i).forEach(o => assert.ok(!overlaps(r, [o.x - 3, o.y - 2, o.x + o.w + 3, o.y + 10]), `"${s.p.text}" clear of "${o.p.text}"`));
    });
    /* and they're drawn over the notices, on a backing */
    const t = drawn(HW, () => { HW.global('UI').draw(); });
    for (const [x, y, text] of said) assert.ok(t.some(r => r[0] === text), `"${text}" drawn`);
    Fx.list = [];
    void n;
});

test("floating words in a Little House keep clear of its Aha tally up top (the live run saw a 'Tsk!' run into it)", () => {
    const HW = loadGame(); HW.preset('afterD7'); HW.step(5); HW.skipTalk();
    for (let i = 1; i < 6; i++) HW.Progress.set('making' + i);
    HW.warp('making6', 3, 16); HW.step(30); HW.skipTalk(); HW.step(5);
    const a = HW.G.map, Making = HW.global('Making'), Fx = HW.global('Fx'), Cam = HW.global('Cam');
    const box = Making.tallyBox(a);
    assert.equal(box.length, 1, 'the tally is up while Tuck is in the House');
    const [bx0, by0, bx1, by1] = box[0];
    /* words said right where the tally sits, and either side of it */
    Fx.list = [];
    for (const [dx, s] of [[0, 'Tsk!'], [-24, 'It JUMPED!'], [26, 'Hmph.']]) Fx.text(Cam.x + W / 2 + dx, Cam.y + 6, s);
    for (const s of Fx.textSpots(Fx.list.filter(p => p.text), Cam.x, Cam.y)) {
        const clear = s.x + s.w + 3 <= bx0 || s.x - 3 >= bx1 || s.y + 10 <= by0 || s.y - 2 >= by1;
        assert.ok(clear, `"${s.p.text}" at ${s.x},${s.y} (w ${s.w}) is on the tally ${box[0]}`);
    }
});
