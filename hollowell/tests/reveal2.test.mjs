// Reveal 2 (src/69_reveal2.js): the Way Down, Tuck's spool, the Hall of Names, Gran's ledger, Gran pulls you home;
// after: Gundry and the north gate's counterweight (S32 if early), a faint on purpose (S33).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const go = (HW, x, y) => assert.ok(HW.walkTo(x, y), `walk to ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
function stitch(HW, moves) {
    const names = { U: 'up', D: 'down', L: 'left', R: 'right' };
    HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(2);
    for (const m of moves) { HW.hold(names[m]); HW.step(2); HW.release(); HW.step(8); }
    HW.press('tool', 1); HW.step(2);
}

test('the Way Down: the deep store and Tuck\'s spool; the Hall of Names; the ledger; Gran pulls you home', () => {
    const HW = loadGame(); HW.preset('afterMakings'); HW.step(10); HW.skipTalk();
    go(HW, 57, 8); HW.hold('down'); HW.step(30); HW.release(); HW.step(40); HW.skipTalk();
    assert.equal(HW.G.map.id, 'deep', 'down the Way Down');
    go(HW, 9, 7); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.items.tuckspool, "Tuck's spool");
    go(HW, 21, 5); HW.step(20);
    const wren = HW.G.map.ents.find(e => e.kind === 'namespool' && e.spec[1] === 'wren');
    assert.ok(wren, "Wren's own spool is here");
    go(HW, wren.tx, wren.ty + 1); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    go(HW, 37, 4); HW.face('up'); HW.press('act', 1);
    for (let i = 0; i < 40 && !HW.Progress.flag('reveal2'); i++) { HW.skipTalk(); HW.step(10); }
    for (let i = 0; i < 20; i++) { HW.skipTalk(); HW.step(10); }
    assert.ok(HW.Progress.flag('reveal2'));
    assert.equal(HW.G.map.id, 'gran_room', 'home in bed');
    assert.ok(/Gundry/.test(HW.Progress.goal), HW.Progress.goal);
    noErrors(HW);
});

test('after it: Gundry tells of the Shears and the north gate; the Needle on its counterweight opens the gate', () => {
    const HW = loadGame(); HW.preset('afterReveal2'); HW.step(10); HW.skipTalk();
    HW.warp('underside', 31, 4); HW.step(20); HW.skipTalk();
    HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(/north gate/.test(HW.Progress.goal), HW.Progress.goal);
    HW.warp('underside', 55, 16); HW.step(20); HW.skipTalk();
    go(HW, 56, 16); HW.face('right'); HW.Inv.stitches = [];
    stitch(HW, 'D'); HW.step(30);
    assert.ok(HW.Progress.flag('north_gate'), 'the gate is open');
    assert.ok(!HW.Progress.flag('s32'), '(not early)');
    noErrors(HW);
});

test('S32: the north gate re-threaded before Gran finds out', () => {
    const HW = loadGame(); HW.preset('afterD7'); HW.step(10); HW.skipTalk();
    HW.warp('underside', 55, 16); HW.step(20); HW.skipTalk();
    go(HW, 56, 16); HW.face('right');
    stitch(HW, 'D'); HW.step(30);
    assert.ok(HW.Progress.flag('north_gate') && HW.Progress.flag('s32'));
    noErrors(HW);
});

test('S33: a faint after Reveal 2 wakes you knowing who pulled', () => {
    const HW = loadGame(); HW.preset('afterReveal2'); HW.step(10); HW.skipTalk();
    HW.warp('hollow', 100, 60); HW.step(10);
    HW.Inv.hp = 1; HW.player().hurt(2, HW.player().x + 5, HW.player().y);
    for (let i = 0; i < 40 && !HW.Progress.flag('s33'); i++) { HW.skipTalk(); HW.step(10); }
    assert.ok(HW.Progress.flag('s33'));
    noErrors(HW);
});
