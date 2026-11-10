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
