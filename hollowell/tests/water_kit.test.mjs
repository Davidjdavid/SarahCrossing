// Water: currents, rafts, wheels, the Paddle.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

function lab() {
    const HW = loadGame();
    HW.newGame('Test', { area: 'lab3', x: 15, y: 3, noAutosave: true });
    HW.Inv.items.staff = 1; HW.step(5);
    return HW;
}
const go = (HW, x, y) => assert.ok(HW.walkTo(x, y), `walk to ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };

test('a crate pushed into a current drifts to the end, then comes home the long way, slower upstream', () => {
    const HW = lab();
    const c = HW.G.map.find('crate');
    go(HW, 2, 4); HW.push('up', 1);
    go(HW, 15, 4);
    assert.ok(until(HW, () => c.tx === 9 && c.ty === 2 && !c.mv, 400), 'drifted to the end of the current');
    assert.ok(c.ret.trace.length >= 8, 'its way home grew as it drifted');
    const t0 = HW.G.t;
    assert.ok(until(HW, () => HW.Return.isHome(c), 800), 'home');
    assert.ok(HW.G.t - t0 > 90 + 7 * 18, 'upstream is slow');
    HW.step(200);
    assert.ok(HW.Return.isHome(c), 'stays home off the current');
});

test('a raft whose mark is on a current runs like a ferry, and carries Wren both ways', () => {
    const HW = lab();
    const f = HW.G.map.find('ferry'), p = HW.player();
    go(HW, 1, 5);
    assert.ok(until(HW, () => HW.Return.isHome(f) && !f.mv, 1500));
    HW.hold('right'); HW.step(12); HW.release();
    assert.equal(p.tx, 2, 'aboard');
    assert.ok(until(HW, () => f.tx === 12 && !f.mv, 600), 'down the current');
    assert.equal(p.tx, 12, 'Wren went too');
    assert.ok(until(HW, () => HW.Return.isHome(f), 900), 'and home again');
    assert.equal(p.tx, 2, 'with Wren aboard');
    assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
});

test('a waterwheel turns while a float passes it', () => {
    const HW = lab();
    const w = HW.G.map.find('wheel');
    assert.ok(until(HW, () => w.on, 600), 'turned as the ferry passed');
});

test('the Paddle: hold C on a raft to steer it; paddling holds it, letting go it goes home with you', () => {
    const HW = lab();
    HW.Inv.giveTool('paddle');
    const r = HW.G.map.find('raft'), p = HW.player();
    go(HW, 8, 8); HW.hold('left'); HW.step(14); HW.release();
    assert.equal(p.tx, 7, 'on the raft');
    HW.hold(['tool', 'left']);
    assert.ok(until(HW, () => r.tx === 4 && !r.mv, 200), 'paddled across');
    HW.hold(['tool']); HW.step(300);
    assert.equal(r.tx, 4, 'held while paddling');
    assert.equal(p.tx, 4);
    HW.release();
    assert.ok(until(HW, () => HW.Return.isHome(r), 600), 'let go: home');
    assert.equal(p.tx, 7, 'with Wren');
});

test('a floating crate: pushed along the water from the bank; with the Paddle, stood on; or poked away', () => {
    let HW = lab();
    let c = HW.G.map.find('floater'), p = HW.player();
    go(HW, 8, 9); HW.push('left', 1);
    assert.equal(c.tx, 6, 'no Paddle: a push sends it along the water');
    assert.equal(p.tx, 8, 'and Wren stays on the bank');
    HW = lab(); c = HW.G.map.find('floater'); p = HW.player();
    HW.Inv.giveTool('paddle');
    go(HW, 8, 9); HW.hold('left'); HW.step(10); HW.release(); HW.step(2);
    assert.equal(p.tx, 7, 'with the Paddle: standing on it');
    HW.hold('right'); HW.step(10); HW.release(); HW.step(2);
    assert.equal(p.tx, 8, 'back on the bank');
    HW.face('left'); HW.press('tool', 1); HW.step(20);
    assert.equal(c.tx, 6, 'poked away');
    assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
});

test('a stone block pushed into deep water sinks and goes home; a stray fills it in', () => {
    const HW = lab();
    const s = HW.G.map.find('stone');
    go(HW, 11, 7); HW.push('left', 3);               // (10,7) -> (7,7): water
    HW.step(30);
    assert.ok(HW.Return.isHome(s) || s.ret.state === 'returning', 'sank and went home');
    go(HW, 11, 6); HW.push('left', 3);               // the stray: (10,6) -> (7,6)
    HW.step(10);
    assert.ok(!HW.G.map.kind(7, 6).water, 'filled in');
    assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
});
