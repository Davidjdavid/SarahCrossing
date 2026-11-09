// Larkspur Fair (overworld block 0,1): the jump off the mesa, the bolt on the east gate, the painted hedge, the
// pen, the carousel's horse (Linnet's note 7), the lift wound by the stagehand, the fog (S11).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const lk = (x, y) => [x, 40 + y];
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const go = (HW, x, y) => assert.ok(HW.walkTo(x, y), `walk to ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const lay = HW => { HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(2); };
function afterD5(tools = []) {
    const HW = loadGame();
    HW.preset('afterD5'); HW.step(10); HW.skipTalk();
    HW.Inv.maxHp = HW.Inv.hp = 28;
    for (const t of tools) HW.Inv.giveTool(t);
    return HW;
}
function strings(HW, moves) {
    const names = { U: 'up', D: 'down', L: 'left', R: 'right' };
    for (const m of moves) {
        const ps = HW.global('Crossbar').ctl.puppets;
        HW.hold(names[m]); until(HW, () => ps.some(e => e.mv), 12); until(HW, () => !ps.some(e => e.mv), 30); HW.release(); HW.step(3);
    }
}

test('off the high mesa into the straw: only with the Bedroll laid up top; then the bolt opens the gate to town', () => {
    const HW = afterD5();
    HW.warp('hollow', 12, 83); HW.step(10);
    HW.Inv.bedroll = null;
    HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.player().ty, 83, 'not without somewhere to come home to');
    go(HW, 15, 83); lay(HW);
    go(HW, 12, 83); HW.face('up'); HW.press('act', 1); HW.skipTalk(0); HW.step(60); HW.skipTalk();
    assert.deepEqual([HW.player().tx, HW.player().ty], lk(12, 34), 'down in the straw');
    assert.equal(HW.walkTo(66, 59), false, 'the gate to town is shut');
    go(HW, ...lk(58, 18)); HW.face('right'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Progress.flag('fair_gate'), 'bolt drawn');
    go(HW, 66, 59);
    noErrors(HW);
});

test('from town, the fair gate is bolted on the far side', () => {
    const HW = afterD5();
    HW.warp('hollow', 68, 59); HW.step(10);
    assert.equal(HW.walkTo(...lk(58, 19)), false);
});

test("the painted hedge by the fortune teller's: a knock, cardboard, and a nook behind it", () => {
    const HW = afterD5();
    HW.warp('hollow', ...lk(10, 9)); HW.step(10);
    go(HW, ...lk(10, 8)); HW.face('up'); HW.press('atk', 1); HW.step(20);
    go(HW, ...lk(10, 5)); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.buttons >= 50, '50 buttons');
    noErrors(HW);
});

test('the pen: with the Crossbar, walk the puppet fakir through the hole and over the nails onto the plate (Heart Patch)', () => {
    const HW = afterD5(['crossbar']);
    HW.warp('hollow', ...lk(56, 13)); HW.step(10);
    HW.Inv.equipped = 'crossbar'; HW.face('up'); HW.press('tool', 1); HW.step(2);
    strings(HW, 'LLUUUUUUU');
    const pp = HW.G.map.find('penPuppet');
    assert.deepEqual([pp.tx, pp.ty], lk(54, 4), 'on the plate');
    HW.step(5); HW.press('tool', 1); HW.step(5);
    go(HW, ...lk(52, 12)); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.patches >= 1, 'a Heart Patch');
    noErrors(HW);
});

test("the carousel's wooden horse walks off its spot, and there's Linnet's seventh note", () => {
    const HW = afterD5(['crossbar']);
    HW.warp('hollow', ...lk(31, 24)); HW.step(10);
    HW.Inv.equipped = 'crossbar'; HW.face('up'); HW.press('tool', 1); HW.step(2);
    strings(HW, 'RR');
    HW.press('tool', 1); HW.step(3);
    go(HW, ...lk(31, 23)); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Progress.flag('linnet7'), "Linnet's note 7");
    noErrors(HW);
});

test('the lift: from the foot of the cliff, work the stagehand up on the mesa onto the winch; then ride up and down', () => {
    const HW = afterD5(['crossbar']);
    HW.warp('hollow', ...lk(24, 35)); HW.step(10);
    HW.face('right'); HW.press('act', 1); HW.skipTalk();
    assert.ok(!HW.Progress.flag('fair_lift'), 'not wound yet');
    HW.Inv.equipped = 'crossbar'; HW.face('down'); HW.press('tool', 1); HW.step(2);
    assert.equal(HW.player().pinned, 'crossbar', 'the stagehand, far up the cliff');
    strings(HW, 'R');
    HW.step(5);
    assert.ok(HW.Progress.flag('fair_lift'), 'wound');
    HW.press('tool', 1); HW.step(3); HW.skipTalk();
    HW.face('right'); HW.press('act', 1); HW.skipTalk(0); HW.step(60);
    assert.deepEqual([HW.player().tx, HW.player().ty], [21, 83], 'up on the mesa, clear of the stagehand');
    HW.face('right'); HW.press('act', 1); HW.skipTalk(0); HW.step(60);
    assert.deepEqual([HW.player().tx, HW.player().ty], lk(24, 34), 'and down again');
    noErrors(HW);
});

test('S11: lay the Bedroll by the fog and walk in; it pulls you home to the Bedroll, and you come back holding a seed', () => {
    const HW = afterD5();
    HW.warp('hollow', ...lk(5, 18)); HW.step(10);
    lay(HW);
    const p = HW.player();
    HW.hold('left'); until(HW, () => p.state === 'flight', 300); HW.release();
    until(HW, () => p.state === 'normal', 300);
    for (let i = 0; i < 10; i++) { HW.skipTalk(); HW.step(10); }
    assert.ok(HW.Progress.flag('s11'), 'S11');
    assert.ok(HW.Inv.items.driftseed, 'a Drift-bloom seed');
    noErrors(HW);
});
