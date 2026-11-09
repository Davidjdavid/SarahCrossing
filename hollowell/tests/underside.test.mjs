// The Underside (src/66_underside.js): the Staff door from the Inn, Gundry, the logbooks (S22), the peepholes (S23).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const go = (HW, x, y) => assert.ok(HW.walkTo(x, y), `walk to ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
function afterD6() { const HW = loadGame(); HW.preset('afterD6'); HW.step(10); HW.skipTalk(); return HW; }

test("the Inn's Staff door: shut before the reveal, the way down after it; Gundry sends you to the Spoolworks", () => {
    const H0 = loadGame(); H0.preset('afterD5'); H0.step(10); H0.skipTalk();
    H0.warp('inn', 13, 3); H0.step(5); H0.face('up'); H0.press('act', 1); H0.skipTalk(); H0.step(40);
    assert.equal(H0.G.map.id, 'inn', 'locked before');
    const HW = afterD6();
    HW.warp('inn', 13, 3); HW.step(5); HW.face('up'); HW.press('act', 1); HW.step(60); HW.skipTalk();
    assert.equal(HW.G.map.id, 'underside');
    go(HW, 31, 4); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(/Spoolworks/.test(HW.Progress.goal), 'the goal');
    go(HW, 29, 9); go(HW, 29, 18); HW.hold('down'); HW.step(30); HW.release(); HW.step(40);
    assert.equal(HW.G.map.id, 'inn', 'and back up the stairs');
    noErrors(HW);
});

test('S22: the six logbooks, each from what really happened in that House', () => {
    const HW = afterD6();
    HW.Stats.rooms['tidy:0'] = { t: 3600 * 5, visits: 2, nudges: 0 };
    HW.Stats.rooms['tidy:3'] = { t: 3600 * 9, visits: 1, nudges: 2 };
    const lines = HW.global('Logbook').lines('tidy');
    assert.ok(lines[0].includes('14 minutes'), lines[0]);
    assert.ok(lines.some(l => /Nudges: 2/.test(l)), 'the nudges, counted');
    HW.warp('underside', 2, 3); HW.step(10); HW.skipTalk();
    for (const x of [1, 4, 7, 10, 13, 16]) { go(HW, x, 2); HW.face('up'); HW.press('act', 1); HW.skipTalk(); }
    assert.ok(HW.Progress.flag('s22'), 'all six read');
    noErrors(HW);
});

test('S23: eight peepholes along the Seams; all eight, and a lid clicks open (a Heart Patch)', () => {
    const HW = afterD6();
    HW.warp('underside', 2, 16); HW.step(10); HW.skipTalk();
    for (const [x, y, d] of [[8, 12, 'up'], [15, 12, 'up'], [6, 20, 'down'], [13, 20, 'down'], [46, 12, 'up'], [54, 12, 'up'], [45, 20, 'down'], [53, 20, 'down']]) {
        go(HW, x, y); HW.face(d); HW.press('act', 1); HW.skipTalk();
    }
    assert.ok(HW.Progress.flag('s23'));
    HW.step(5);
    go(HW, 58, 13); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.patches >= 1, 'a Heart Patch');
    noErrors(HW);
});

test('after the Spoolworks: an apprentice cot in the Guild Hall, and the Making Floor open', () => {
    const HW = loadGame(); HW.preset('afterD7'); HW.step(10); HW.skipTalk();
    assert.equal(HW.G.map.id, 'underside');
    assert.ok(HW.G.map.ents.some(e => e.isBed), 'a cot');
    HW.step(5);
    assert.ok(HW.G.map.find('ghMaking').open, 'the east door');
    noErrors(HW);
});
