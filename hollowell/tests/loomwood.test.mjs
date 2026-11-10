// The Loomwood (overworld block 1,0): the warp across the Loom's door (four sockets, four weights, the Needle's three
// stitches and the Return's patience), the old weight from Lantern Pond's isle, Homeward, and the Shears.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const lw = (x, y) => [64 + x, y];
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const go = (HW, x, y) => assert.ok(HW.walkTo(x, y, 20000), `walk to ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const stitch = (HW, moves) => { const names = { U: 'up', D: 'down', L: 'left', R: 'right' }; HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(2); for (const m of moves) { HW.hold(names[m]); HW.step(2); HW.release(); HW.step(8); } HW.press('tool', 1); HW.step(40); };
const held = HW => ['lgS1', 'lgS2', 'lgS3', 'lgS4'].filter(s => HW.global('Signals').get(HW.G.map, s));
function inWood(preset = 'afterD7') {
    const HW = loadGame();
    HW.preset(preset); HW.step(10); HW.skipTalk();
    HW.Inv.stitches = []; HW.Progress.set('north_gate'); HW.Progress.set('gundry_r2'); HW.Inv.maxHp = HW.Inv.hp = 40;
    HW.warp('hollow', ...lw(31, 20)); HW.step(10);
    return HW;
}
const intoLoom = HW => { go(HW, ...lw(31, 10)); HW.hold('up'); until(HW, () => HW.G.map.id === 'loom', 120); HW.release(); HW.step(10); };

test("the warp: four sockets, three stitches (the far one among them); the last weight pushed on by the door, and through before it goes home", () => {
    const HW = inWood();
    assert.equal(HW.walkTo(...lw(31, 9), 20000), false, 'the warp is down');
    go(HW, ...lw(54, 17)); HW.face('right'); stitch(HW, 'RR');
    go(HW, ...lw(39, 11)); HW.face('left'); stitch(HW, 'LL');
    go(HW, ...lw(24, 20)); HW.face('up'); stitch(HW, 'UU');
    HW.step(60);
    assert.deepEqual(held(HW), ['lgS2', 'lgS3', 'lgS4'], 'three for good');
    go(HW, ...lw(26, 15)); HW.push('up', 2); HW.step(26);
    assert.ok(HW.G.map.find('lgWarp').lifted, 'lifted');
    intoLoom(HW);
    assert.equal(HW.G.map.id, 'loom', 'in');
    assert.ok(HW.Progress.flag('loom_open'), 'and lifted for her from now on');
    noErrors(HW);
});
test('the warp: the far weight pushed on by hand, it is home again long before you are back at the door', () => {
    const HW = inWood();
    go(HW, ...lw(39, 11)); HW.face('left'); stitch(HW, 'LL');
    go(HW, ...lw(24, 20)); HW.face('up'); stitch(HW, 'UU');
    go(HW, ...lw(26, 15)); HW.face('up'); stitch(HW, 'UU');
    go(HW, ...lw(54, 17)); HW.push('right', 2);
    assert.equal(held(HW).length, 4, 'all four, for a moment');
    assert.equal(HW.walkTo(...lw(31, 10), 20000), false, 'down again before she gets there');
    noErrors(HW);
});
test('the warp, planned ahead: the Bedroll laid by the door, the far weight pushed on, Homeward, and through', () => {
    const HW = inWood();
    go(HW, ...lw(39, 11)); HW.face('left'); stitch(HW, 'LL');
    go(HW, ...lw(24, 20)); HW.face('up'); stitch(HW, 'UU');
    go(HW, ...lw(26, 15)); HW.face('up'); stitch(HW, 'UU');
    go(HW, ...lw(31, 11)); HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(3);
    go(HW, ...lw(54, 17)); HW.push('right', 2);
    HW.Inv.equipped = 'bedroll'; HW.hold('tool'); HW.step(24); HW.release();
    until(HW, () => HW.player().state === 'normal', 600); HW.step(5);
    assert.ok(HW.G.map.find('lgWarp').lifted, 'still lifted');
    intoLoom(HW);
    assert.equal(HW.G.map.id, 'loom');
    noErrors(HW);
});
test("the old weight from the isle in Hushwood fits a socket for good; with it, the Needle's three are enough", () => {
    const HW = inWood();
    HW.Inv.items.oldweight = 1;
    go(HW, ...lw(56, 17)); HW.face('right'); HW.press('act', 1); HW.step(3); HW.skipTalk(0); HW.step(5); HW.skipTalk();
    assert.ok(!HW.Inv.items.oldweight && HW.Progress.get('oldweight_at') === 'lgS4', 'set in the far socket');
    go(HW, ...lw(39, 11)); HW.face('left'); stitch(HW, 'LL');
    go(HW, ...lw(24, 20)); HW.face('up'); stitch(HW, 'UU');
    go(HW, ...lw(26, 15)); HW.face('up'); stitch(HW, 'UU');
    HW.step(80);
    assert.equal(held(HW).length, 4, 'all four, for good');
    intoLoom(HW);
    assert.equal(HW.G.map.id, 'loom');
    HW.warp('hollow', ...lw(31, 20)); HW.step(10);
    assert.ok(HW.G.map.ents.some(e => e.look === 'oldweight_block'), 'still there after');
    noErrors(HW);
});
test('the warp is silk: the Shears cut it for good', () => {
    const HW = inWood('afterReveal2');
    HW.Inv.giveTool('shears');
    go(HW, ...lw(31, 11)); HW.face('up'); HW.Inv.equipped = 'shears'; HW.press('tool', 1); HW.step(5); HW.skipTalk();
    assert.ok(HW.G.map.find('lgWarp').gone, 'cut');
    go(HW, ...lw(31, 10));
    noErrors(HW);
});
