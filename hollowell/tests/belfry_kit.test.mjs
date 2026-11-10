// Wind and bells: gusts, ringing, snapping home, sleepers, bats, the Recall Bell.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

function lab() {
    const HW = loadGame();
    HW.newGame('Test', { area: 'lab4', x: 15, y: 8, noAutosave: true });
    HW.Inv.items.staff = 1; HW.step(5);
    return HW;
}
const go = (HW, x, y) => assert.ok(HW.walkTo(x, y), `walk to ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };

test('a gust blows a crate down its stretch; later it comes home the long way', () => {
    const HW = lab();
    const c = HW.G.map.find('crate');
    assert.ok(until(HW, () => c.tx >= 12, 600), 'blown along');
    assert.ok(c.ret.trace.length >= 10);
    assert.ok(until(HW, () => HW.Return.isHome(c), 2000), 'home again');
});

test('a bell, struck, snaps everything out of place nearby home at once', () => {
    const HW = lab();
    const s = HW.G.map.find('stone');
    go(HW, 3, 5); HW.push('right', 5);                // (4,5) -> (9,5)
    assert.equal(s.tx, 9);
    go(HW, 14, 5); HW.face('right'); HW.press('atk', 1); HW.step(4);
    assert.equal(s.ret.state, 'returning', 'snapping home');
    assert.ok(s.ret.snap);
    assert.ok(until(HW, () => HW.Return.isHome(s), 60), 'home fast');
});

test('a ring wakes a sleeper, which goes straight home', () => {
    const HW = lab();
    const z = HW.G.map.find('sleeper');
    HW.step(400);
    assert.ok(z.tiedOff && z.tx === 10, 'asleep where it lies');
    go(HW, 14, 6); HW.face('up'); HW.step(1);
    go(HW, 14, 5); HW.face('right'); HW.press('atk', 1);
    assert.ok(until(HW, () => HW.Return.isHome(z), 120), 'woke and went home');
});

test('a ring wakes the bats', () => {
    const HW = lab();
    const b = HW.ents('enemy').find(e => e.type === 'bat');
    HW.step(30);
    assert.equal(b.mode, 'sleep');
    go(HW, 14, 5); HW.face('right'); HW.press('atk', 1); HW.step(12);
    assert.equal(b.mode, 'fly');
});

test('the Recall Bell rings wherever Wren is', () => {
    const HW = lab();
    HW.Inv.giveTool('bell'); HW.Inv.equipped = 'bell';
    const s = HW.G.map.find('stone');
    go(HW, 3, 5); HW.push('right', 3);
    HW.press('tool', 1); HW.step(2);
    assert.ok(s.ret.snap, 'snapped');
    assert.ok(until(HW, () => HW.Return.isHome(s), 60));
    assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
});

test('a thing on the Hookline is held by the line: the wind does not blow it (it blows it once let go)', () => {
    const HW = lab();
    const c = HW.G.map.find('crate'), g = HW.G.map.find('gust');
    assert.ok(until(HW, () => !g.on && g.soon, 900), 'a gust about to blow');
    /* (the Hookline marks what it holds as it reels it in, all the way to the end of the pull) */
    c.hookPulled = true;
    assert.ok(until(HW, () => g.on, 120)); HW.step(60);
    assert.equal(c.tx, 2, 'on the line: not blown');
    c.hookPulled = false;
    assert.ok(until(HW, () => c.tx > 2, 60), 'let go: blown along');
});

test('a gust that is switched off shows no sign of coming', () => {
    const HW = lab();
    const g = HW.G.map.find('gust');
    g.off = true;
    let soon = false; for (let i = 0; i < 500; i++) { HW.step(1); if (g.soon || g.on) soon = true; }
    assert.ok(!soon);
});
