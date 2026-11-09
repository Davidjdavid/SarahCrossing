// The Belfry (House 4): every room's solution, played through the real game code.
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
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const gustOn = g => g.on;

test('porch: strike the bell; the boulder asleep in the doorway wakes and goes home', () => {
    const HW = game();
    const b = thing(HW, 'bpBoulder');
    assert.ok(b.tiedOff, 'asleep');
    go(HW, 'porch', 6, 5); strike(HW, 'up');
    assert.ok(until(HW, () => HW.Return.isHome(b), 120), 'gone home');
    go(HW, 'porch', 9, 1); go(HW, 'stair', 9, 9);
    noErrors(HW);
});

test('the draught: line the pale crates up in the lane; the gust blows them into the pits by the key', () => {
    const HW = game();
    enter(HW, 'draught', 18, 5);
    go(HW, 'draught', 10, 8); HW.push('up', 2);
    assert.ok(until(HW, () => !HW.G.map.kind(...at('draught', 5, 5)).pit, 600), 'first pit filled');
    go(HW, 'draught', 13, 2); HW.push('down', 2);
    assert.ok(until(HW, () => !HW.G.map.kind(...at('draught', 4, 5)).pit, 600), 'second pit filled');
    const g = thing(HW, 'drGust');
    until(HW, () => !g.on, 300);
    go(HW, 'draught', 3, 5); HW.face('left'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.keys('belfry'), 1, 'the key');
    noErrors(HW);
});

test('windward: left alone the crate never makes it home between gusts; rung home in a lull, the gate opens', () => {
    const HW = game();
    enter(HW, 'windward', 1, 4);
    const c = thing(HW, 'wwCrate'), g = thing(HW, 'wwGust');
    go(HW, 'windward', 13, 3);
    HW.step(900);
    assert.ok(!thing(HW, 'wwGate').open || !HW.Return.isHome(c), 'not by itself');
    until(HW, () => c.tx >= at('windward', 14, 5)[0] && !c.mv, 600);
    until(HW, () => !g.on && !g.soon, 600);
    until(HW, () => g.on, 600); until(HW, () => !g.on, 600);
    strike(HW, 'up');
    assert.ok(until(HW, () => HW.Return.isHome(c), 80), 'snapped home');
    go(HW, 'windward', 17, 5);
    HW.face('right'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.plans.includes('belfry'), 'the plan');
    noErrors(HW);
});

test('weathercock walk: hold on to the busts while it blows', () => {
    const HW = game();
    enter(HW, 'weather', 18, 5);
    const g = thing(HW, 'wcGust');
    for (const x of [13, 9, 5]) {
        until(HW, () => !g.on, 400);
        go(HW, 'weather', x, 5);
        HW.face('up'); HW.hold(['act']);
        until(HW, () => g.on, 400); until(HW, () => !g.on, 400);
        HW.release(); HW.step(2);
        assert.equal(HW.player().ty, at('weather', x, 5)[1], 'still on the walk');
    }
    go(HW, 'weather', 2, 5); HW.face('left'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.keys('belfry'), 1, 'the key');
    noErrors(HW);
});

test('weathercock walk: caught in the open, the gust blows Wren off into the pits and home', () => {
    const HW = game();
    enter(HW, 'weather', 18, 5);
    const g = thing(HW, 'wcGust');
    until(HW, () => g.on, 400);
    HW.hold('left'); HW.step(120); HW.release();
    assert.ok(until(HW, () => HW.player().state === 'normal' && HW.player().tx >= at('weather', 17, 5)[0], 400), 'blown off and flew home');
});

test('the rafters: ring, and the sleeping slab of wall goes home (and the bats wake)', () => {
    const HW = game();
    enter(HW, 'rafters', 1, 5);
    go(HW, 'rafters', 13, 5); strike(HW, 'up');
    assert.ok(until(HW, () => HW.Return.isHome(thing(HW, 'raWall')), 120));
    assert.ok(HW.ents('enemy').some(e => e.type === 'bat' && e.mode === 'fly'), 'bats awake');
    HW.G.cheats.god = true;
    go(HW, 'rafters', 17, 1); HW.face('right'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.patches, 1);
});

test("clangor: the stick bounces off; a bust out of place snaps home through it when it rings", () => {
    const HW = game();
    HW.G.cheats.god = true;
    enter(HW, 'loft', 9, 8);
    const c = HW.ents('enemy').find(e => e.type === 'clangor');
    assert.ok(c && c.state !== 'sleep', 'awake');
    for (let round = 0; round < 3 && c.alive; round++) {
        const b = thing(HW, 'clB1');
        until(HW, () => HW.Return.isHome(b), 600);
        c.state = 'ring'; c.st = -100000; c.x = at('loft', 16, 8)[0] * 16 + 8; c.y = at('loft', 16, 8)[1] * 16 + 10;   /* (held still while the test sets up) */
        go(HW, 'loft', 3, 3); HW.push('right', 3);           // bust (4,3) -> (7,3)
        assert.equal(b.tx, at('loft', 7, 3)[0], 'bust pushed out');
        go(HW, 'loft', 7, 6);
        /* (a person lures it there; the test puts it on the bust's way home) */
        c.x = at('loft', 5, 3)[0] * 16 + 8; c.y = at('loft', 5, 3)[1] * 16 + 10; c.state = 'windup'; c.st = 39; c.kx = c.ky = 0;
        assert.ok(until(HW, () => c.state === 'stunned', 120), 'slammed by the bust');
        HW.step(30);                              /* it skids to a stop */
        const p = HW.player(); p.x = c.x + 16; p.y = c.y; HW.face('left'); HW.press('atk', 1); HW.step(30);
    }
    assert.ok(!c.alive, 'down');
    HW.step(100); HW.skipTalk();
    go(HW, 'loft', 9, 7); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.has('bell'), 'the Recall Bell');
    noErrors(HW);
});

test('the reach: ring close to the far sleeper only; it goes home onto the plate and the gate opens', () => {
    const HW = game(['bell']);
    enter(HW, 'reach', 18, 5);
    go(HW, 'reach', 16, 1); ring(HW);
    assert.ok(until(HW, () => HW.Return.isHome(thing(HW, 'reS1')), 120), 'S1 home');
    assert.ok(thing(HW, 'reS2').tiedOff, 'S2 still asleep');
    HW.step(5);
    assert.ok(thing(HW, 'reGate').open, 'gate open');
    go(HW, 'reach', 2, 8); HW.face('left'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.keys('belfry'), 1);
    noErrors(HW);
});

test('the reach: ring where both hear, and the near one shuts the gate again', () => {
    const HW = game(['bell']);
    enter(HW, 'reach', 18, 5);
    go(HW, 'reach', 17, 5); ring(HW);
    HW.step(120);
    assert.ok(!thing(HW, 'reS2').tiedOff, 'both woke');
    assert.equal(thing(HW, 'reGate').open, false);
});

test('echo room (S15): the stones rung low, high, middle, high, low', () => {
    const HW = game();
    enter(HW, 'echo', 1, 5);
    const order = [['esLow', 5], ['esHigh', 13], ['esMid', 9], ['esHigh', 13], ['esLow', 5]];
    for (const [id, x] of order) { go(HW, 'echo', x, 5); strike(HW, 'up'); HW.step(25); }
    assert.ok(HW.Progress.flag('belfry_echo'), 'sung');
    HW.step(30);
    go(HW, 'echo', 9, 3); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.patches, 1);
    noErrors(HW);
});

test('bell ropes: pick up the right-hand crate (holding it) and ring; the sleeper comes home to the left plate (Pattern)', () => {
    const HW = game(['bell']);
    enter(HW, 'ropes', 9, 9);
    HW.Inv.equipped = 'bell';
    go(HW, 'ropes', 16, 3); HW.face('right'); HW.press('act', 1); HW.step(10);
    assert.ok(HW.player().carry, 'holding it');
    go(HW, 'ropes', 14, 3);
    HW.press('tool', 1); HW.step(80);
    assert.ok(HW.Progress.flag('belfry_ropes'), 'left pressed, right not');
    HW.face('right'); HW.press('act', 1); HW.step(30);
    go(HW, 'ropes', 9, 8); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.hasPattern('belfry'));
    noErrors(HW);
});

test('bell ropes: ringing without holding just brings both crates home', () => {
    const HW = game(['bell']);
    enter(HW, 'ropes', 9, 9);
    go(HW, 'ropes', 16, 3); HW.face('right'); HW.press('act', 1); HW.step(10);
    go(HW, 'ropes', 10, 5); HW.face('down'); HW.press('act', 1); HW.step(30);   /* set it down out in the room */
    go(HW, 'ropes', 4, 8);                                       /* out of everything's way home */
    ring(HW); HW.step(100);
    assert.equal(HW.Progress.flag('belfry_ropes'), false);
});

test('the workshop (signature), behind the sleeping wall', () => {
    const HW = game(['bell']);
    enter(HW, 'ropes', 9, 9);
    go(HW, 'ropes', 2, 5); ring(HW); HW.step(30);
    go(HW, 'workshop', 17, 5);
    go(HW, 'workshop', 9, 6); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Progress.flag('sig:belfry'));
    noErrors(HW);
});

test('the great bell: the gust blows the clapper out, Tollgrim leans out; ring, and it slams home into him (x3)', () => {
    const HW = game(['bell']);
    HW.Inv.patterns.push('belfry');
    HW.G.cheats.god = true;
    enter(HW, 'bell', 9, 9);
    const t = HW.ents('enemy').find(e => e.type === 'tollgrim');
    assert.ok(t && t.state !== 'sleep', 'awake');
    for (let round = 0; round < 4 && t.alive; round++) {
        go(HW, 'bell', 6, 7);
        assert.ok(until(HW, () => t.state === 'peek', 1500), 'he leans out');
        ring(HW);
        assert.ok(until(HW, () => t.state === 'stunned', 60), 'slammed');
        HW.step(20);
        const p = HW.player(); p.x = t.x - 16; p.y = t.y; HW.face('right'); HW.press('atk', 1); HW.step(30);
    }
    assert.ok(!t.alive, 'down');
    HW.step(100); HW.skipTalk();
    assert.ok(HW.ents('hoop')[0], 'the hoop');
    noErrors(HW);
});
