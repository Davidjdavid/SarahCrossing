// The Kiln, room by room: each room's intended solution, played by the real game code.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const R = { entrance: [20, 33], lwr: [0, 33], hall: [20, 22], crocks: [40, 33], sms: [40, 22], doubling: [0, 22], glazer: [40, 11], gallery: [60, 11], bridge: [60, 22], furnace: [20, 11], racks: [0, 11], sig: [0, 0], vats: [40, 0], boss: [20, 0] };
const at = (room, x, y) => [R[room][0] + x, R[room][1] + y];
function game(tools = []) {
    const HW = loadGame();
    HW.newGame('Test', { area: 'kiln', x: 29, y: 42, noAutosave: true });
    HW.Inv.items.staff = 1;
    for (const t of tools) HW.Inv.giveTool(t);
    HW.step(5);
    return HW;
}
function go(HW, room, x, y) {
    let ok = HW.walkTo(...at(room, x, y));
    for (let i = 0; i < 3 && !ok; i++) { HW.skipTalk(); HW.step(5); ok = HW.walkTo(...at(room, x, y)); }
    assert.ok(ok, `walk to ${room} ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
}
const thing = (HW, id) => HW.G.map.find(id);
const lift = (HW, d) => { HW.face(d); HW.press('act', 1); assert.ok(HW.player().carry, 'lifted'); };
const toss = (HW, d) => { HW.face(d); HW.press('act', 1); };
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const flag = (HW, f) => HW.Progress.flag(f);

test('entrance: a throw through the charm over the pit opens the key nook; a throw at the seal opens the way north', () => {
    const HW = game();
    go(HW, 'entrance', 2, 7); lift(HW, 'down');
    go(HW, 'entrance', 9, 8); toss(HW, 'up'); HW.step(40);
    assert.ok(thing(HW, 'eCharm').on, 'charm rung');
    go(HW, 'entrance', 17, 2); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.keys('kiln'), 1);
    go(HW, 'entrance', 16, 7); lift(HW, 'down');
    go(HW, 'entrance', 9, 2); toss(HW, 'up'); HW.step(30);
    assert.equal(thing(HW, 'eSeal'), undefined, 'seal broken');
    noErrors(HW);
});

test('long way round: carry the pot under the charm, through the door, to the gate; throw it there', () => {
    const HW = game();
    go(HW, 'entrance', 2, 7); lift(HW, 'down');
    go(HW, 'entrance', 1, 7);                      // under the charm by the west door
    go(HW, 'lwr', 18, 7); go(HW, 'lwr', 3, 5);
    toss(HW, 'down');
    for (let i = 0; i < 300 && !thing(HW, 'lwrGate').open; i++) HW.step(1);
    assert.ok(thing(HW, 'lwrGate').open, 'gate open while Wren is beside it');
    go(HW, 'lwr', 3, 3); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.patches >= 1);
    noErrors(HW);
});

test('charm hall: one flight rings all three', () => {
    const HW = game();
    HW.warp('kiln', ...at('hall', 2, 7)); HW.step(2);
    lift(HW, 'down');
    go(HW, 'hall', 2, 2); go(HW, 'hall', 5, 2); go(HW, 'hall', 14, 2); go(HW, 'hall', 17, 2); go(HW, 'hall', 17, 7); go(HW, 'hall', 16, 8); go(HW, 'hall', 9, 8); go(HW, 'hall', 8, 8);
    toss(HW, 'left');
    for (let i = 0; i < 300 && !thing(HW, 'hN').open; i++) HW.step(1);
    assert.ok(thing(HW, 'hN').open, 'north gate open');
    noErrors(HW);
});

test('charm hall: ringing them one throw at a time does not open it', () => {
    const HW = game();
    HW.warp('kiln', ...at('hall', 2, 7)); HW.step(2);
    lift(HW, 'down'); go(HW, 'hall', 5, 6); toss(HW, 'up'); HW.step(200);
    go(HW, 'hall', 17, 7); lift(HW, 'down'); go(HW, 'hall', 14, 6); toss(HW, 'up'); HW.step(20);
    assert.equal(thing(HW, 'hN').open, false);
});

test('sun, moon, star: walk them star-moon-sun so the pieces ring sun-moon-star', () => {
    const HW = game();
    HW.Inv.keyCount.kiln = 1;
    HW.warp('kiln', ...at('hall', 18, 5)); HW.hold('right'); HW.step(50); HW.release();
    go(HW, 'sms', 1, 7); lift(HW, 'down');
    go(HW, 'sms', 1, 1); go(HW, 'sms', 17, 1); go(HW, 'sms', 17, 9); go(HW, 'sms', 4, 9);
    toss(HW, 'left');
    for (let i = 0; i < 400 && !thing(HW, 'smsN').open; i++) HW.step(1);
    assert.ok(thing(HW, 'smsN').open, 'gate open');
    noErrors(HW);
});

test('sun, moon, star: the other way round rings them backwards', () => {
    const HW = game();
    HW.warp('kiln', ...at('sms', 1, 6)); HW.step(2);
    go(HW, 'sms', 1, 7); lift(HW, 'down');
    go(HW, 'sms', 1, 9); go(HW, 'sms', 17, 9); go(HW, 'sms', 17, 1); go(HW, 'sms', 4, 1);
    toss(HW, 'left'); HW.step(400);
    assert.equal(thing(HW, 'smsN').open, false);
});

test('doubling back: round the ring and finish in the spur', () => {
    const HW = game();
    HW.warp('kiln', ...at('doubling', 16, 8)); HW.step(2);
    lift(HW, 'right');
    go(HW, 'doubling', 1, 8); go(HW, 'doubling', 1, 5); go(HW, 'doubling', 12, 5); go(HW, 'doubling', 12, 3);
    toss(HW, 'up');
    for (let i = 0; i < 300 && thing(HW, 'dKey').hidden; i++) HW.step(1);
    assert.equal(thing(HW, 'dKey').hidden, false, 'chest appeared');
    noErrors(HW);
});

test('doubling back: along the corridor and back loses a charm', () => {
    const HW = game();
    HW.warp('kiln', ...at('doubling', 16, 8)); HW.step(2);
    lift(HW, 'right');
    go(HW, 'doubling', 18, 5); go(HW, 'doubling', 4, 5); go(HW, 'doubling', 12, 5); go(HW, 'doubling', 12, 3);
    toss(HW, 'up'); HW.step(300);
    assert.equal(thing(HW, 'dKey').hidden, true);
});

test('the Glazer: its own shot comes home through it', () => {
    const HW = game();
    HW.warp('kiln', ...at('glazer', 16, 9)); HW.step(60); HW.skipTalk();
    const g = HW.ents('enemy').find(e => e.type === 'glazer');
    assert.ok(g);
    for (let n = 0; n < 2000 && g.alive; n++) {
        // stand in line with it a little way off; when it throws, step aside
        if (g.state === 'walk' || g.state === 'hold') { const p = HW.player(); HW.hold(p.tx < g.tx ? 'right' : 'left'); HW.step(1); HW.release(); }
        else if (g.state === 'aim') { HW.hold('down'); HW.step(12); HW.release(); }
        else HW.step(1);
        if (HW.Inv.hp < 3) HW.Inv.hp = 6;
    }
    HW.step(60); HW.skipTalk();
    assert.ok(flag(HW, 'kiln_glazer'), 'Glazer broken');
    go(HW, 'glazer', 9, 7); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.has('hook'), 'Hookline');
    noErrors(HW);
});

test('chasm gallery: hook across both chasms to the heart patch', () => {
    const HW = game(['hook']);
    HW.warp('kiln', ...at('gallery', 1, 5)); HW.step(2);
    go(HW, 'gallery', 3, 2); HW.face('right'); HW.press('tool', 1); HW.step(60);
    assert.equal(HW.player().tx, R.gallery[0] + 7);
    go(HW, 'gallery', 10, 7); HW.face('right'); HW.press('tool', 1); HW.step(60);
    assert.equal(HW.player().tx, R.gallery[0] + 14);
    go(HW, 'gallery', 17, 8); HW.face('down'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.patches >= 1);
    noErrors(HW);
});

test('bridge of cords: carry a pot while reeling over the drop; the pieces come back across it', () => {
    const HW = game(['hook']);
    HW.warp('kiln', ...at('bridge', 14, 2)); HW.step(2);
    go(HW, 'bridge', 14, 3); HW.face('down'); HW.press('tool', 1); HW.step(60);
    assert.equal(HW.player().ty, R.bridge[1] + 8, 'over to the south side');
    go(HW, 'bridge', 3, 7); lift(HW, 'down');
    go(HW, 'bridge', 6, 7); HW.face('up'); HW.press('tool', 1); HW.step(60);
    assert.equal(HW.player().ty, R.bridge[1] + 2, 'back north, carrying');
    go(HW, 'bridge', 9, 2); toss(HW, 'right');
    for (let i = 0; i < 300 && thing(HW, 'bKey').hidden; i++) HW.step(1);
    assert.equal(thing(HW, 'bKey').hidden, false);
    noErrors(HW);
});

test('furnace hall: throw to knock the crate off its mark, hook the empty mark, reel over', () => {
    const HW = game(['hook']);
    HW.warp('kiln', ...at('furnace', 9, 9)); HW.step(2);
    go(HW, 'furnace', 16, 3); lift(HW, 'up');
    go(HW, 'furnace', 7, 5); toss(HW, 'left'); HW.step(22);
    assert.equal(thing(HW, 'fCrate').tx, R.furnace[0] + 2, 'crate knocked off its mark');
    HW.face('left'); HW.press('tool', 1); HW.step(50);
    assert.equal(HW.player().tx, R.furnace[0] + 3, 'reeled onto the empty mark');
    noErrors(HW);
});

test('drying racks: four charms in one flight, with a reel over the pit in the middle', () => {
    const HW = game(['hook']);
    HW.warp('kiln', ...at('racks', 17, 6)); HW.step(2);
    lift(HW, 'right');
    go(HW, 'racks', 18, 2); go(HW, 'racks', 16, 2); go(HW, 'racks', 13, 2); go(HW, 'racks', 13, 8); go(HW, 'racks', 16, 8); go(HW, 'racks', 16, 9); go(HW, 'racks', 12, 9); go(HW, 'racks', 12, 5);
    HW.face('left'); HW.press('tool', 1); HW.step(60);
    assert.equal(HW.player().tx, R.racks[0] + 6, 'over the pit');
    go(HW, 'racks', 2, 8); go(HW, 'racks', 2, 9);
    toss(HW, 'right');
    for (let i = 0; i < 400 && thing(HW, 'kPattern').hidden; i++) HW.step(1);
    assert.equal(thing(HW, 'kPattern').hidden, false, 'the Pattern appears');
    go(HW, 'racks', 2, 3); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.hasPattern('kiln'));
    noErrors(HW);
});

test('drying racks: a thrown pot breaks the hollow wall into the potting shed (signature)', () => {
    const HW = game();
    HW.warp('kiln', ...at('racks', 17, 6)); HW.step(2);
    lift(HW, 'right'); go(HW, 'racks', 14, 2); go(HW, 'racks', 9, 2); toss(HW, 'up'); HW.step(30);
    assert.equal(thing(HW, 'sigSeal'), undefined, 'wall broken');
    go(HW, 'sig', 9, 6); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(flag(HW, 'sig:kiln'));
    noErrors(HW);
});

test('the Kilnwyrm: it follows your footsteps, and so do the pieces', () => {
    const HW = game();
    HW.Inv.patterns.push('kiln'); HW.Inv.maxHp = HW.Inv.hp = 20;
    HW.warp('kiln', ...at('vats', 1, 5)); HW.hold('left'); HW.step(50); HW.release();
    HW.hold('left'); HW.step(60); HW.release(); HW.step(40); HW.skipTalk();
    const w = HW.ents('enemy').find(e => e.type === 'kilnwyrm');
    assert.ok(w, 'the wyrm');
    for (let round = 0; round < 6 && w.alive; round++) {
        go(HW, 'boss', 17, 3); lift(HW, 'up');         /* urn at (17,2) */
        go(HW, 'boss', 12, 3); go(HW, 'boss', 12, 7); go(HW, 'boss', 5, 7);
        toss(HW, 'left');
        for (let i = 0; i < 200 && w.state !== 'hurt' && w.alive; i++) HW.step(1);
        HW.Inv.hp = 20;
        for (let i = 0; i < 60; i++) HW.step(1);
    }
    HW.step(120); HW.skipTalk();
    assert.ok(flag(HW, 'kiln_boss'), 'the Kilnwyrm is broken');
    noErrors(HW);
});
