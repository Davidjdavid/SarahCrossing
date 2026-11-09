// Regressions from the fresh-eyes review of the Belfry and the Heights: sleepers stay put until rung and stay
// awake once woken; the Hookline stops at shut gates and won't swing on chests; rings stop at walls; the
// puzzles need their ideas; chests wait for a clear floor; Returnball keeps no half-scores.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const R = { porch: [20, 44], draught: [0, 44], windward: [40, 44], stair: [20, 33], weather: [0, 33], rafters: [40, 33], loft: [20, 22], reach: [0, 22], echo: [40, 22], ropes: [20, 11], workshop: [0, 11], bell: [20, 0] };
const at = (room, x, y) => [R[room][0] + x, R[room][1] + y];
function game(tools = []) {
    const HW = loadGame();
    HW.newGame('Test', { area: 'belfry', x: 29, y: 53, noAutosave: true });
    HW.Inv.items.staff = 1;
    for (const t of ['gloves', 'hook', 'paddle', ...tools]) HW.Inv.giveTool(t);
    HW.Inv.maxHp = HW.Inv.hp = 40;
    HW.step(5);
    return HW;
}
const enter = (HW, room, x, y) => { HW.warp('belfry', ...at(room, x, y)); HW.step(30); HW.skipTalk(); HW.step(5); };
const go = (HW, room, x, y) => assert.ok(HW.walkTo(...at(room, x, y)), `walk to ${room} ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const thing = (HW, id) => HW.G.map.find(id);
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const strike = (HW, dir) => { HW.face(dir); HW.press('atk', 1); HW.step(12); };
const ring = HW => { HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(4); };
const hook = (HW, dir) => { HW.Inv.equipped = 'hook'; HW.face(dir); HW.press('tool', 1); HW.step(60); };
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const here = (HW, room) => { const p = HW.player(); return [p.tx - R[room][0], p.ty - R[room][1]]; };

test('a sleeper can be neither pulled, gripped, lifted nor hooked: only a ring moves it', () => {
    const HW = game();
    const b = thing(HW, 'bpBoulder');
    const home = [b.tx, b.ty];
    go(HW, 'porch', 9, 3); HW.face('up');
    HW.hold(['act']); HW.step(5); HW.hold(['act', 'down']); HW.step(40); HW.release(); HW.step(5);
    assert.deepEqual([b.tx, b.ty], home, 'not pulled out of the doorway');
    assert.equal(HW.player().grip, null, 'no grip on it');
    /* the sleeping crate in Bell Ropes */
    enter(HW, 'ropes', 9, 9);
    const c = thing(HW, 'brC1');
    go(HW, 'ropes', 14, 6); HW.face('right'); HW.press('act', 1); HW.step(10);
    assert.equal(HW.player().carry, null, 'not lifted');
    go(HW, 'ropes', 12, 6); hook(HW, 'right');
    assert.equal(c.tx, at('ropes', 15, 6)[0], 'not hooked over');
    assert.ok(c.tiedOff, 'still asleep');
    noErrors(HW);
});

test('a woken sleeper stays awake: leaving, coming back, saving and loading', () => {
    const HW = game();
    const b = thing(HW, 'bpBoulder');
    go(HW, 'porch', 6, 5); strike(HW, 'up');
    assert.ok(until(HW, () => HW.Return.isHome(b), 120), 'woke and went home');
    go(HW, 'porch', 9, 1); go(HW, 'stair', 9, 9);
    /* out of the House and back in */
    HW.warp('hollow', 158, 9); HW.step(20);
    HW.warp('belfry', 29, 53); HW.step(20);
    const b2 = thing(HW, 'bpBoulder');
    assert.ok(!b2.tiedOff && HW.Return.isHome(b2), 'awake at home after the House is built again');
    /* a save and a load */
    go(HW, 'porch', 9, 1); go(HW, 'stair', 9, 8);
    HW.Save.write(1);
    HW.Save.apply(HW.Save.read(1)); HW.step(20);
    const b3 = thing(HW, 'bpBoulder');
    assert.ok(!b3.tiedOff && HW.Return.isHome(b3), 'awake at home after a load');
    go(HW, 'porch', 9, 5);
    noErrors(HW);
});

test('the Hookline stops at a shut gate and never swings Wren over to a chest', () => {
    const HW = game();
    enter(HW, 'draught', 18, 5);
    go(HW, 'draught', 7, 5); hook(HW, 'left');
    assert.deepEqual(here(HW, 'draught'), [7, 5], 'not reeled over the pits to the key chest');
    enter(HW, 'reach', 18, 5);
    go(HW, 'reach', 8, 8); hook(HW, 'left');
    assert.deepEqual(here(HW, 'reach'), [8, 8], 'not through the shut gate');
    noErrors(HW);
});

test('the Reach: ringing both awake and shoving the far one off its plate does not open the gate; leaving lets them sleep again', () => {
    const HW = game(['bell']);
    HW.Progress.set('belfry_clangor');
    enter(HW, 'reach', 18, 5);
    go(HW, 'reach', 17, 5); ring(HW);
    HW.step(150);
    const s2 = thing(HW, 'reS2');
    assert.ok(!s2.tiedOff, 'both woke');
    go(HW, 'reach', 11, 9); HW.push('left', 1); HW.step(20);
    assert.equal(thing(HW, 'reGate').open, false, 'still shut');
    /* out to the Loft and back: the two lie down again where they were */
    go(HW, 'reach', 18, 5); go(HW, 'loft', 2, 5); HW.step(10);
    go(HW, 'reach', 18, 5); HW.step(10);
    assert.ok(thing(HW, 'reS1').tiedOff && thing(HW, 'reS2').tiedOff, 'asleep again');
    assert.deepEqual([s2.tx, s2.ty], at('reach', 17, 9), 'back where it slept');
    /* and the puzzle can be done properly */
    go(HW, 'reach', 16, 1); ring(HW); HW.step(120);
    assert.ok(thing(HW, 'reGate').open, 'opens');
    noErrors(HW);
});

test('Bell Ropes: ring first and then lift the right-hand crate: no Pattern', () => {
    const HW = game(['bell']);
    HW.Progress.set('belfry_clangor'); HW.Progress.setAreaFlag('belfry', 'door:clLockN');
    enter(HW, 'ropes', 9, 9);
    go(HW, 'ropes', 14, 8); ring(HW); HW.step(120);
    const c1 = thing(HW, 'brC1');
    assert.ok(HW.Return.isHome(c1), 'the sleeper came home with the other on its plate');
    go(HW, 'ropes', 16, 3); HW.face('right'); HW.press('act', 1); HW.step(10);
    assert.ok(HW.player().carry, 'lifted it after');
    HW.step(60);
    assert.ok(!HW.Progress.flag('belfry_ropes'), 'no pattern for doing it backwards');
    /* leave and come back: the sleeper lies down again by the far wall */
    go(HW, 'ropes', 9, 9); go(HW, 'loft', 9, 1); HW.step(10); go(HW, 'ropes', 9, 9); HW.step(10);
    assert.ok(thing(HW, 'brC1').tiedOff, 'asleep again for another go');
    noErrors(HW);
});

test('a ring stops at the walls of the room it is rung in', () => {
    const HW = game(['bell']);
    enter(HW, 'loft', 2, 5);
    HW.G.map.find('clangor').alive = false;
    go(HW, 'loft', 2, 2); ring(HW); HW.step(30);
    assert.ok(thing(HW, 'reS2').tiedOff && thing(HW, 'reS1').tiedOff, 'the Reach slept through it');
    enter(HW, 'loft', 14, 1); ring(HW); HW.step(30);
    assert.ok(thing(HW, 'brC1').tiedOff, 'Bell Ropes slept through it');
    noErrors(HW);
});

test('a chest that appears waits for the floor to be clear', () => {
    const HW = game(['bell']);
    enter(HW, 'ropes', 9, 9);
    go(HW, 'ropes', 9, 7);
    HW.Progress.set('belfry_ropes');
    HW.step(20);
    const ch = thing(HW, 'brPattern');
    assert.ok(ch.hidden, 'not on top of Wren');
    go(HW, 'ropes', 9, 8); HW.step(5);
    assert.ok(!ch.hidden, 'there once she steps off');
    HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.hasPattern('belfry'));
    noErrors(HW);
});

test('Tollgrim spits as soon as he leans out', () => {
    const HW = game(['bell']);
    enter(HW, 'bell', 9, 9);
    HW.step(60); HW.skipTalk();
    const t = HW.G.map.ents.find(e => e.type === 'tollgrim');
    assert.ok(until(HW, () => t.state === 'peek', 900), 'leans out');
    HW.step(12);
    assert.ok(t.spits.length > 0, 'spat straight away');
});

test('Returnball: a throw cut short (leaving town) scores nothing next time', () => {
    const HW = loadGame();
    HW.preset('afterD4'); HW.step(10); HW.skipTalk(); HW.step(10);
    HW.Progress.set('festival');
    HW.warp('hollow', 64 + 36, 40 + 35); HW.step(10);
    const RB = HW.global('Returnball');
    /* three rings scored on a throw, and then Wren leaves before the ball is home */
    RB.score = 3;
    HW.warp('gran_room', 4, 3); HW.step(10);
    HW.warp('hollow', 64 + 36, 40 + 35); HW.step(10);
    assert.equal(RB.score, 0, 'the half-score is gone with the old ball');
    assert.ok(HW.Return.isHome(HW.G.map.find('rbBall')), 'a fresh ball at home');
    noErrors(HW);
});
