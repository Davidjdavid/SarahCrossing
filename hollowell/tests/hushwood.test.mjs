// Hushwood (overworld block 2,1): the sleeping giant on the road, the moss over the stream, the weir and the
// channel down to the lake, the far bank's plateau, and the giant's hollow (S16).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const hw = (x, y) => [128 + x, 40 + y];
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const go = (HW, x, y) => assert.ok(HW.walkTo(x, y), `walk to ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const homeward = HW => { HW.Inv.equipped = 'bedroll'; HW.hold('tool'); HW.step(24); HW.release(); HW.step(1); };
const lay = HW => { HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(2); };
function afterD4() {
    const HW = loadGame();
    HW.preset('afterD4'); HW.step(10); HW.skipTalk();
    HW.Progress.set('festival');
    HW.Inv.maxHp = HW.Inv.hp = 24;
    return HW;
}
function inWood(tools = []) {
    const HW = afterD4();
    HW.Progress.set('giant_awake'); HW.Progress.set('giant_home');
    for (const t of tools) HW.Inv.giveTool(t);
    HW.warp('hollow', ...hw(10, 19)); HW.step(10);
    return HW;
}

test('the sleeping giant blocks the road until the Recall Bell wakes him; he goes home to his own bed', () => {
    const HW = afterD4();
    HW.warp('hollow', 125, 60); HW.step(30); HW.skipTalk();
    assert.equal(HW.walkTo(...hw(8, 20)), false, 'no way past him');
    const g = HW.G.map.find('giant');
    HW.Inv.equipped = 'bell'; HW.press('tool', 1);
    assert.ok(until(HW, () => HW.Progress.flag('giant_awake'), 30), 'he heard');
    for (let i = 0; i < 20 && !HW.Progress.flag('giant_home'); i++) { HW.skipTalk(); HW.step(20); }
    HW.skipTalk(); HW.step(10);
    assert.ok(HW.Progress.flag('giant_home'), 'home to bed');
    assert.deepEqual([g.tx, g.ty], hw(3, 4), 'in his own bed');
    go(HW, ...hw(8, 20));
    assert.ok(HW.G.map.ents.some(e => e.interact && e.tx === hw(3, 16)[0] && e.ty === hw(3, 16)[1]), 'the hollow where he lay');
    noErrors(HW);
});

test('bouncy moss hops Wren over the stream to the Slumberhouse and back', () => {
    const HW = inWood();
    const p = HW.player();
    go(HW, ...hw(12, 15)); HW.hold('up'); until(HW, () => p.ty <= hw(0, 11)[1] && p.state === 'normal', 120); HW.release(); HW.step(5);
    assert.equal(p.ty, hw(0, 11)[1], 'over the stream');
    go(HW, ...hw(19, 9)); HW.hold('up'); HW.step(30); HW.release(); HW.step(30);
    assert.equal(HW.G.map.id, 'slumber', 'in at the Slumberhouse door');
    HW.warp('hollow', ...hw(10, 10)); HW.step(10);
    HW.hold('down'); until(HW, () => p.ty >= hw(0, 14)[1] && p.state === 'normal', 120); HW.release();
    assert.equal(p.ty, hw(0, 14)[1], 'back over');
    noErrors(HW);
});

test('Lantern Pond: wind the weir, and the raft runs down the channel into the lake at Millwater', () => {
    const HW = inWood();
    const p = HW.player();
    go(HW, ...hw(25, 30)); HW.face('down'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Progress.flag('hush_weir'), 'the weir wound up');
    go(HW, ...hw(25, 29)); HW.hold('right'); HW.step(16); HW.release(); HW.step(4);
    assert.deepEqual([p.tx, p.ty], hw(26, 29), 'on the raft');
    HW.Inv.equipped = 'paddle';
    for (let i = 0; i < 900 && p.ty < hw(0, 32)[1]; i++) { HW.hold(['tool', p.tx < hw(29, 0)[0] ? 'right' : 'down']); HW.step(1); }
    HW.release();
    assert.ok(until(HW, () => p.ty >= 83, 1500), `carried down to the lake (at ${p.tx},${p.ty})`);
    noErrors(HW);
});

test('from the lake, the channel up to Hushwood is shut by the weir until it is wound from above', () => {
    const HW = loadGame();
    HW.preset('afterD3'); HW.step(10); HW.skipTalk();
    const p = HW.player();
    HW.warp('hollow', 128 + 18, 80 + 17); HW.step(10);
    HW.Inv.equipped = 'paddle';
    HW.walkTo(128 + 18, 80 + 16); HW.hold('up'); HW.step(12); HW.release(); HW.step(2);
    for (let i = 0; i < 2500 && !(p.tx === 128 + 29 && p.ty <= 80 + 3); i++) { HW.hold(['tool', p.ty > 80 + 6 ? 'up' : p.tx < 128 + 29 ? 'right' : 'up']); HW.step(1); }
    for (let i = 0; i < 1500; i++) { HW.hold(['tool', 'up']); HW.step(1); }
    HW.release();
    assert.ok(p.ty > hw(0, 32)[1], `stopped below the weir (at ${p.ty})`);
});

test('the far bank: over the log bridge; the moss hops you up onto the plateau (Heart Patch); the ledge lets you down', () => {
    const HW = inWood();
    const p = HW.player();
    go(HW, ...hw(34, 13)); HW.hold('up'); until(HW, () => p.ty <= hw(0, 9)[1] && p.state === 'normal', 200); HW.release(); HW.step(5);
    assert.equal(p.ty, hw(0, 9)[1], 'up on the plateau');
    go(HW, ...hw(36, 5)); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.patches >= 1, 'a Heart Patch');
    go(HW, ...hw(33, 9)); HW.hold('down'); HW.step(50); HW.release();
    assert.ok(p.ty >= hw(0, 11)[1], 'down off the ledge');
    noErrors(HW);
});

test("the giant's hollow (S16): only with the Bedroll laid up top; down there, Linnet's note; Homeward brings you back up", () => {
    const HW = inWood();
    go(HW, ...hw(4, 16)); HW.face('left'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.G.map.id, 'hollow', 'no Bedroll: not going down there');
    HW.Inv.giveTool('bedroll');
    HW.face('left'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.G.map.id, 'hollow', 'not laid: still not');
    go(HW, ...hw(6, 18)); lay(HW);
    go(HW, ...hw(4, 16)); HW.face('left'); HW.press('act', 1); HW.skipTalk(0);
    HW.step(70); HW.skipTalk();
    assert.equal(HW.G.map.id, 'hummock_hollow', 'down the hollow');
    HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(5);
    assert.equal(HW.Inv.bedroll.area, 'hollow', "the Bedroll can't be laid down here");
    go(HW, 13, 5);
    const p = HW.player();
    for (const x of [14, 15, 16, 17, 18]) { for (let i = 0; i < 40 && p.tx < x; i++) { HW.hold('right'); HW.step(1); } }
    for (let i = 0; i < 8; i++) { HW.hold('right'); HW.step(1); }
    HW.release();
    HW.face('right'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Progress.flag('linnet6'), "Linnet's sixth note");
    homeward(HW); HW.step(80);
    assert.equal(HW.G.map.id, 'hollow', 'Homeward, back up top');
    assert.deepEqual([p.tx, p.ty], hw(6, 18));
    noErrors(HW);
});

test("the giant's hollow: the roots can be climbed, the hard way, if there's no other way home", () => {
    const HW = inWood(['bedroll']);
    go(HW, ...hw(6, 18)); lay(HW);
    HW.warp('hummock_hollow', 9, 2); HW.step(10);
    HW.Inv.bedroll = null;
    HW.face('up'); HW.press('act', 1); HW.skipTalk(0); HW.step(80); HW.skipTalk();
    assert.equal(HW.G.map.id, 'hollow', 'out, scraped and filthy');
});
