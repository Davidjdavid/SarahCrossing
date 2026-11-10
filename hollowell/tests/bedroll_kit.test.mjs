// Wren's own mark (src/58_bedroll_kit.js): beds, the Bedroll and Homeward, crumbling boards, dreamcatchers,
// bouncy moss, sleep puffs and Snorelings, in the lab (lab5: room A x 0-23, room B x 24-39).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

function lab(tools = ['bedroll']) {
    const HW = loadGame();
    HW.newGame('Test', { area: 'lab5', x: 5, y: 5, noAutosave: true });
    HW.Inv.items.staff = 1;
    for (const t of ['gloves', 'hook', 'paddle', ...tools]) HW.Inv.giveTool(t);
    HW.Inv.equipped = tools[0] || null;
    HW.Inv.maxHp = HW.Inv.hp = 24;
    HW.step(5);
    return HW;
}
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const go = (HW, x, y) => assert.ok(HW.walkTo(x, y), `walk to ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const lay = HW => { HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(2); };
const homeward = HW => { HW.Inv.equipped = 'bedroll'; HW.hold('tool'); HW.step(24); HW.release(); HW.step(1); };
const landed = HW => until(HW, () => HW.player().state === 'normal', 400);
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));

test('lay the Bedroll; walk off; hold C: Homeward, back along the trace to it', () => {
    const HW = lab();
    go(HW, 3, 6); lay(HW);
    assert.deepEqual(HW.Inv.bedroll && [HW.Inv.bedroll.tx, HW.Inv.bedroll.ty], [3, 6], 'laid');
    go(HW, 9, 8); go(HW, 21, 2);
    homeward(HW);
    assert.equal(HW.player().state, 'flight', 'away home');
    assert.ok(landed(HW), 'came down');
    assert.deepEqual([HW.player().tx, HW.player().ty], [3, 6], 'at the Bedroll');
    noErrors(HW);
});

test('a bed is your mark through doorways; the boards fall behind you; falling home onto a bed is free, the flight lights the dreamcatcher, the boards mend', () => {
    const HW = lab([]);
    go(HW, 3, 2); HW.face('left'); HW.press('act', 1); HW.skipTalk();
    const p = HW.player();
    assert.ok(p.mark.bed, 'the bed is the mark');
    const hp = HW.Inv.hp;
    go(HW, 9, 4); HW.hold('right'); until(HW, () => p.tx >= 19, 300); HW.release();
    HW.step(30);
    for (let x = 10; x <= 17; x++) assert.ok(HW.G.map.kind(x, 4).pit, `board ${x} gave way`);
    /* back over the edge where the bridge was */
    HW.hold('left'); until(HW, () => p.state === 'fall', 120); HW.release();
    const ring = HW.G.map.find('ring1');
    assert.ok(landed(HW), 'flew home');
    assert.deepEqual([p.tx, p.ty], [3, 2], 'at the bed');
    assert.equal(HW.Inv.hp, hp, 'no heart lost');
    assert.ok(ring.lit > 0, 'the dreamcatcher lit as she flew through');
    for (let x = 10; x <= 17; x++) assert.ok(!HW.G.map.kind(x, 4).pit, `board ${x} mended`);
    /* through the doorway into the other room and back: the bed is still the mark */
    go(HW, 27, 8); HW.step(10);
    assert.deepEqual([p.mark.tx, p.mark.ty], [3, 2], 'still the bed');
    noErrors(HW);
});

test('the boards mend once Wren has left the room', () => {
    const HW = lab([]);
    go(HW, 9, 4); go(HW, 19, 4); HW.step(30);
    assert.ok(HW.G.map.kind(12, 4).pit, 'gone');
    go(HW, 27, 4); HW.step(5);
    assert.ok(!HW.G.map.kind(12, 4).pit, 'mended behind her');
});

test('without a bed, the same fall costs a heart', () => {
    const HW = lab([]);
    const hp = HW.Inv.hp, p = HW.player();
    go(HW, 9, 4); go(HW, 12, 4); HW.step(30);
    HW.hold('left'); until(HW, () => p.state === 'fall', 120); HW.release();
    landed(HW);
    assert.equal(HW.Inv.hp, hp - 1);
});

test('Homeward carries what Wren carries; a fall drops it', () => {
    const HW = lab();
    go(HW, 3, 6); lay(HW);
    go(HW, 7, 8); HW.face('left'); HW.press('act', 1); HW.step(10);
    const c = HW.player().carry;
    assert.ok(c, 'holding the crate');
    go(HW, 20, 3);
    homeward(HW); landed(HW);
    assert.equal(HW.player().carry, c, 'still holding it at home');
    noErrors(HW);
});

test("what Wren carries goes the way she goes, a flight home too: its trace runs along the flight, tile by tile", () => {
    const HW = lab(['bedroll']);
    HW.Return.mark(HW.G.map.find('crate'));      /* (the lab's crate is a stray: give it a place, so it has a trace) */
    go(HW, 3, 6); lay(HW);
    go(HW, 7, 8); HW.face('left'); HW.press('act', 1); HW.step(10);
    const c = HW.player().carry;
    assert.ok(c && c.ret, 'carrying a marked crate');
    go(HW, 20, 3);
    homeward(HW); landed(HW);
    const tr = Array.from(c.ret.trace, q => [q[0], q[1]]);
    assert.deepEqual(tr[tr.length - 1], [3, 6], 'its trace ends at the Bedroll');
    assert.ok(tr.every((q, i) => !i || Math.abs(q[0] - tr[i - 1][0]) + Math.abs(q[1] - tr[i - 1][1]) === 1), 'one tile at a time all the way: ' + tr.map(q => q.join(',')).join(' '));
    noErrors(HW);
});

test('bouncy moss hops Wren on two tiles', () => {
    const HW = lab([]);
    go(HW, 1, 8); HW.hold('right'); HW.step(50); HW.release(); HW.step(10);
    assert.ok(HW.player().tx >= 4, `hopped (at ${HW.player().tx})`);
});

test('a sleep puff bursts as Wren comes close; breathe it and doze off, home to your mark, unhurt', () => {
    const HW = lab([]);
    const p = HW.player(), hp = HW.Inv.hp;
    go(HW, 20, 5);
    HW.hold('down'); HW.step(30); HW.release();
    const puff = HW.G.map.find('puff');
    assert.equal(puff.state, 'burst', 'it burst');
    assert.ok(until(HW, () => p.state === 'fall', 200), 'dozed off');
    landed(HW);
    assert.equal(HW.Inv.hp, hp, 'no heart lost');
    assert.deepEqual([p.tx, p.ty], [p.mark.tx, p.mark.ty], 'woke at the mark');
    noErrors(HW);
});

test('a Snoreling woken shuffles after you, then goes to the nearest bed: a Bedroll on a plate', () => {
    const HW = lab();
    HW.G.cheats.god = true;
    go(HW, 34, 2); lay(HW);
    const s = HW.G.map.find('snore');
    for (let i = 0; i < 4 && s.mode !== 'chase'; i++) { go(HW, 35, 8); go(HW, 38, 8); }
    assert.equal(s.mode, 'chase', 'awake');
    go(HW, 27, 3);
    assert.ok(until(HW, () => s.mode === 'sleep', 1500), 'asleep again');
    assert.equal(HW.global('Bedroll').sleeper, s, 'on the Bedroll');
    const plate = HW.G.map.ents.find(e => e.kind === 'plate');
    assert.ok(plate.weighed(), 'pressing the plate');
    /* you can't roll it up from under it */
    go(HW, 34, 3); HW.press('tool', 1); HW.step(3);
    assert.ok(HW.Inv.bedroll, 'still laid');
    noErrors(HW);
});

test('laid on a raft, the Bedroll goes where the raft goes, and so does Homeward', () => {
    const HW = lab();
    const r = HW.G.map.find('raft'), p = HW.player();
    go(HW, 35, 5); HW.hold('down'); HW.step(16); HW.release(); HW.step(4);
    assert.equal(p.ty, 6, 'aboard');
    /* paddle it over to the far bank */
    HW.Inv.equipped = 'paddle';
    for (let i = 0; i < 600 && (p.tx !== 31 || p.ty !== 7); i++) { HW.hold(['tool', p.tx > 31 ? 'left' : 'down']); HW.step(1); }
    HW.release(); until(HW, () => !r.mv, 60); HW.step(2);
    assert.deepEqual([p.tx, p.ty], [31, 7], 'paddled');
    lay(HW);
    assert.ok(HW.global('Bedroll').float === r, 'on the raft');
    HW.hold('down'); HW.step(16); HW.release(); HW.step(4);
    assert.equal(p.ty, 8, 'stepped off');
    go(HW, 27, 9);
    assert.ok(until(HW, () => HW.Return.isHome(r), 900), 'the raft went home');
    assert.deepEqual([HW.Inv.bedroll.tx, HW.Inv.bedroll.ty], [35, 6], 'and the Bedroll with it');
    homeward(HW); landed(HW);
    assert.deepEqual([p.tx, p.ty], [35, 6], 'landed on the raft');
    HW.step(30);
    assert.equal(p.state, 'normal', 'standing, not sinking');
    noErrors(HW);
});

test('from another place, Homeward takes Wren straight back to the Bedroll', () => {
    const HW = lab();
    go(HW, 3, 6); lay(HW);
    HW.warp('lab', 2, 8); HW.step(10);
    homeward(HW); HW.step(80);
    assert.equal(HW.G.map.id, 'lab5');
    assert.deepEqual([HW.player().tx, HW.player().ty], [3, 6]);
    assert.ok(HW.player().mark.bed, 'and it is her mark again');
    noErrors(HW);
});

test('ring the Recall Bell in mid-flight and Wren snaps home at once (S18)', () => {
    const HW = lab(['bedroll', 'bell']);
    go(HW, 3, 6); lay(HW);
    go(HW, 21, 9);
    homeward(HW);
    HW.step(4);
    assert.equal(HW.player().state, 'flight');
    HW.Inv.equipped = 'bell'; HW.press('tool', 1);
    assert.equal(HW.player().state, 'normal', 'home already');
    assert.deepEqual([HW.player().tx, HW.player().ty], [3, 6]);
    assert.ok(HW.Progress.flag('s18'));
    noErrors(HW);
});

test('the Bedroll keeps through a save and a load; tapped beside it, it rolls up', () => {
    const HW = lab();
    go(HW, 3, 6); lay(HW);
    go(HW, 12, 8);
    HW.Save.write(1);
    HW.Save.apply(HW.Save.read(1)); HW.step(10);
    assert.deepEqual([HW.Inv.bedroll.tx, HW.Inv.bedroll.ty], [3, 6], 'still laid');
    go(HW, 14, 8);
    homeward(HW); landed(HW);
    assert.deepEqual([HW.player().tx, HW.player().ty], [3, 6], 'home to it');
    HW.press('tool', 1); HW.step(2);
    assert.equal(HW.Inv.bedroll, null, 'rolled up');
    assert.ok(!HW.player().mark.bed, 'an ordinary mark again');
    noErrors(HW);
});
