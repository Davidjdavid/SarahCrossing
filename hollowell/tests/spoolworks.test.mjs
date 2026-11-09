// The Spoolworks (House 7): every room's solution, played through the real game code, up top and underneath.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const R = { gate: [20, 22], wind: [20, 11], store: [0, 11], kennel: [40, 11], loft: [0, 0], heart: [20, 0], bench: [40, 0], ugate: [20, 55], uwind: [20, 44], ustore: [0, 44], ukennel: [40, 44], uloft: [0, 33], uheart: [20, 33], ubench: [40, 33] };
const at = (room, x, y) => [R[room][0] + x, R[room][1] + y];
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const go = (HW, room, x, y) => assert.ok(HW.walkTo(...at(room, x, y)), `walk to ${room} ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const here = (HW, room) => { const p = HW.player(); return [p.tx - R[room][0], p.ty - R[room][1]]; };
const thing = (HW, id) => HW.G.map.find(id);
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
function game(tools = []) {
    const HW = loadGame();
    HW.preset('afterD6'); HW.step(10); HW.skipTalk();
    HW.Inv.maxHp = HW.Inv.hp = 30;
    for (const t of tools) HW.Inv.giveTool(t);
    return HW;
}
const enter = (HW, room, x, y) => { HW.warp('spoolworks', ...at(room, x, y)); HW.step(30); HW.skipTalk(); HW.step(5); };
/* through a hatch: stand on the tile, face it, Z */
function hatch(HW, room, x, y, dir) { go(HW, room, x, y); HW.face(dir); HW.press('act', 1); HW.step(40); }
const knot = HW => { HW.hold('act'); HW.step(20); HW.release(); HW.step(2); };
function stitch(HW, moves) {
    const names = { U: 'up', D: 'down', L: 'left', R: 'right' };
    HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(2);
    for (const m of moves) { HW.hold(names[m]); HW.step(2); HW.release(); HW.step(8); }
    HW.press('tool', 1); HW.step(2);
}
const strike = (HW, dir) => { HW.face(dir); HW.press('atk', 1); HW.step(14); };

test('the Gatehouse: the crate in the passage is tied off from underneath; undo the knot and it goes home', () => {
    const HW = game();
    enter(HW, 'gate', 9, 9);
    const b = thing(HW, 'gaBlock');
    assert.ok(b.knotted, 'held fast');
    go(HW, 'gate', 9, 3); HW.push('up', 1); HW.step(20);
    assert.deepEqual(here(HW, 'gate'), [9, 3], "it won't budge");
    hatch(HW, 'gate', 16, 7, 'down');
    assert.deepEqual(here(HW, 'ugate'), [16, 7], 'down below');
    go(HW, 'ugate', 13, 4); HW.face('up'); HW.press('act', 1); HW.step(3);
    assert.ok(!b.knotted, 'untied');
    until(HW, () => HW.Return.isHome(b), 400);
    hatch(HW, 'ugate', 16, 7, 'down');
    go(HW, 'gate', 9, 1); HW.hold('up'); HW.step(40); HW.release(); HW.step(40);
    assert.deepEqual(here(HW, 'wind').map(v => v > 0), [true, true], 'through to the Winding Hall');
    assert.equal(HW.global('Cam').room.name, 'The Winding Hall');
    noErrors(HW);
});

test('under the Winding Hall: push the counterweight off its plate and stand a stray in its way home; the Spool Store gate opens', () => {
    const HW = game();
    enter(HW, 'uwind', 9, 8);
    const w = thing(HW, 'hwWeight'), g = thing(HW, 'swGateW');
    HW.step(3);
    assert.ok(!g.open, 'shut');
    go(HW, 'uwind', 11, 5); HW.push('right', 2); HW.step(25);
    assert.deepEqual([w.tx, w.ty], at('uwind', 14, 5));
    go(HW, 'uwind', 13, 7); HW.push('up', 1); HW.step(25);
    assert.deepEqual([thing(HW, 'hwStray').tx, thing(HW, 'hwStray').ty], at('uwind', 13, 5), 'the stray in the way');
    HW.step(300);
    assert.deepEqual([w.tx, w.ty], at('uwind', 14, 5), 'the weight waits behind it');
    assert.ok(g.open, 'the gate up above is open');
    hatch(HW, 'uwind', 17, 7, 'down');
    go(HW, 'wind', 1, 5); HW.hold('left'); HW.step(30); HW.release(); HW.step(30);
    assert.equal(HW.global('Cam').room.name, 'The Spool Store');
    assert.ok(HW.Progress.areaFlag('spoolworks', 'door:swGateW'), 'latched once passed');
    noErrors(HW);
});

test('the Spool Store: push the block onto the plate, then tie it off from underneath before it goes home (key); the Plan below', () => {
    const HW = game();
    enter(HW, 'store', 17, 5);
    const b = thing(HW, 'ssBlock'), g = thing(HW, 'ssGate');
    go(HW, 'store', 11, 2); HW.push('down', 3); HW.step(25);
    assert.deepEqual([b.tx, b.ty], at('store', 11, 6), 'on the plate');
    hatch(HW, 'store', 15, 7, 'down');
    go(HW, 'ustore', 11, 4); HW.face('up'); knot(HW);
    assert.ok(b.knotted, 'tied off');
    go(HW, 'ustore', 5, 7); HW.face('down'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.plans.includes('spoolworks'), 'the Plan');
    HW.step(400);
    assert.deepEqual([b.tx, b.ty], at('store', 11, 6), 'still on the plate');
    hatch(HW, 'ustore', 15, 7, 'down');
    assert.ok(g.open, 'gate open');
    go(HW, 'store', 2, 3); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.keys('spoolworks'), 1, 'a key');
    noErrors(HW);
});

test('the Kennel: Cog chases; down the hatch, tie off his cord, and he is held; three knocks (the Needle)', () => {
    const HW = game();
    HW.G.cheats.god = true;
    HW.Inv.keyCount.spoolworks = 1;
    enter(HW, 'wind', 17, 5);
    go(HW, 'wind', 18, 5); HW.hold('right'); HW.step(40); HW.release(); HW.step(20); HW.skipTalk(); HW.step(5);
    const c = HW.G.map.ents.find(e => e.type === 'cog');
    assert.notEqual(c.state, 'sleep', 'awake');
    for (let round = 0; round < 3 && c.alive; round++) {
        hatch(HW, 'kennel', 9, 7, 'down');
        until(HW, () => c.state === 'sit', 400);
        go(HW, 'ukennel', 9, 5); HW.face('up'); knot(HW);
        assert.ok(c.knotted, `round ${round + 1}: held`);
        hatch(HW, 'ukennel', 9, 7, 'down');
        go(HW, 'kennel', 9, 5); strike(HW, 'up');
        HW.step(10);
    }
    assert.ok(!c.alive, 'Cog runs down');
    HW.step(30); HW.skipTalk(); HW.step(10);
    go(HW, 'kennel', 5, 3); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.has('needle'), 'the Needle');
    noErrors(HW);
});

test('under the Spool Store: nobody can push the weight in the way north; the Needle gives it a new place', () => {
    const HW = game(['needle']);
    enter(HW, 'ustore', 2, 5);
    go(HW, 'ustore', 2, 3); HW.push('up', 1); HW.step(20);
    const w = thing(HW, 'usWeight');
    assert.deepEqual([w.tx, w.ty], at('ustore', 2, 2), 'not budged');
    HW.face('up'); stitch(HW, 'R');
    until(HW, () => HW.Return.isHome(w), 60);
    assert.deepEqual([w.tx, w.ty], at('ustore', 3, 2), 'in the alcove');
    go(HW, 'uloft', 2, 9);
    noErrors(HW);
});

test('the Bobbin Loft: three bobbins stitched onto three plates, the fourth pushed on and tied off from underneath (the Pattern)', () => {
    const HW = game(['needle']);
    enter(HW, 'loft', 9, 9);
    const B = id => thing(HW, id);
    go(HW, 'loft', 6, 5); HW.face('up'); stitch(HW, 'LLLU'); until(HW, () => HW.Return.isHome(B('blB1')), 120);
    go(HW, 'loft', 12, 5); HW.face('up'); stitch(HW, 'RRRU'); until(HW, () => HW.Return.isHome(B('blB2')), 120);
    go(HW, 'loft', 6, 6); HW.face('down'); stitch(HW, 'LLLD'); until(HW, () => HW.Return.isHome(B('blB3')), 120);
    assert.deepEqual([B('blB1').tx, B('blB1').ty], at('loft', 3, 3));
    assert.deepEqual([B('blB3').tx, B('blB3').ty], at('loft', 3, 8));
    /* the fourth: Wren can't stand in for it, a bobbin must */
    go(HW, 'loft', 15, 8); HW.step(10);
    assert.ok(B('blPattern').hidden, 'Wren is no bobbin');
    go(HW, 'loft', 11, 7); HW.push('right', 3); HW.step(25);
    go(HW, 'loft', 15, 6); HW.push('down', 1); HW.step(25);
    assert.deepEqual([B('blB4').tx, B('blB4').ty], at('loft', 15, 8), 'pushed onto the last plate');
    hatch(HW, 'loft', 9, 7, 'down');
    go(HW, 'uloft', 11, 7); HW.face('right'); knot(HW);
    assert.ok(B('blB4').knotted);
    hatch(HW, 'uloft', 9, 7, 'down');
    HW.step(10);
    assert.ok(!B('blPattern').hidden, 'the Pattern chest');
    go(HW, 'loft', 9, 3); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.hasPattern('spoolworks'));
    go(HW, 'store', 9, 1);
    noErrors(HW);
});

test("Gundry's Bench: the trapdoor won't lift while the crate sits on it; the Needle, through its cord, moves it", () => {
    const HW = game(['needle']);
    enter(HW, 'ubench', 9, 8);
    hatch(HW, 'ubench', 9, 6, 'up');
    assert.deepEqual(here(HW, 'ubench'), [9, 6], 'still underneath');
    go(HW, 'ubench', 9, 7); HW.face('up');
    stitch(HW, 'RR');
    const cr = thing(HW, 'gbCrate');
    until(HW, () => HW.Return.isHome(cr), 60);
    assert.deepEqual([cr.tx, cr.ty], at('bench', 11, 6));
    hatch(HW, 'ubench', 9, 6, 'up');
    assert.deepEqual(here(HW, 'bench'), [9, 6], 'up at the bench');
    go(HW, 'bench', 4, 3); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Progress.flag('sig:spoolworks'));
    go(HW, 'bench', 15, 3); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.patches >= 1, 'a Heart Patch');
    noErrors(HW);
});

test('the Tangle: three bobbins stitched away, the fourth pushed off and tied underneath: it comes apart; knock the core (x3)', () => {
    const HW = game(['needle']);
    HW.G.cheats.god = true;
    enter(HW, 'heart', 9, 9);
    HW.walkTo(...at('heart', 6, 7)); HW.step(5); HW.skipTalk(); HW.step(5);
    const t = HW.G.map.ents.find(e => e.kind === 'tangle');
    assert.equal(t.state, 'whole');
    const B = id => thing(HW, id);
    for (let round = 0; round < 3 && t.alive; round++) {
        until(HW, () => ['tbN', 'tbW', 'tbE', 'tbS'].every(id => HW.Return.isHome(B(id)) && !B(id).mv), 300);
        go(HW, 'heart', 9, 1); HW.face('down');
        HW.walkTo(...at('heart', 8, 2)); HW.face('right'); stitch(HW, 'UL'); until(HW, () => HW.Return.isHome(B('tbN')), 60);
        go(HW, 'heart', 4, 4); HW.face('down'); stitch(HW, 'LL'); until(HW, () => HW.Return.isHome(B('tbW')), 60);
        go(HW, 'heart', 14, 4); HW.face('down'); stitch(HW, 'RR'); until(HW, () => HW.Return.isHome(B('tbE')), 60);
        go(HW, 'heart', 8, 8); HW.push('right', 2); HW.step(25);
        assert.deepEqual([B('tbS').tx, B('tbS').ty], at('heart', 11, 8), `round ${round + 1}: the fourth pushed off`);
        hatch(HW, 'heart', 2, 7, 'down');
        go(HW, 'uheart', 9, 7); HW.face('down'); knot(HW);
        assert.ok(B('tbS').knotted);
        hatch(HW, 'uheart', 2, 7, 'down');
        assert.ok(until(HW, () => t.state === 'open', 300), 'it comes apart');
        go(HW, 'heart', 9, 6); strike(HW, 'up');
        HW.step(20);
    }
    assert.ok(!t.alive, 'undone');
    for (let i = 0; i < 20 && !HW.Progress.flag('d7'); i++) { HW.skipTalk(); HW.step(20); }
    assert.ok(HW.Progress.flag('d7'));
    noErrors(HW);
});
