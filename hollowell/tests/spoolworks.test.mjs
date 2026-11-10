// The Spoolworks (House 7): every room's solution, played through the real game code, up top and underneath.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const R = {
    gate: [20, 22], wind: [20, 11], store: [0, 11], kennel: [40, 11], practice: [40, 22], rope: [0, 22], loft: [0, 0], heart: [20, 0], bench: [40, 0],
    ugate: [20, 55], uwind: [20, 44], ustore: [0, 44], ukennel: [40, 44], upractice: [40, 55], urope: [0, 55], uloft: [0, 33], uheart: [20, 33], ubench: [40, 33],
};
const at = (room, x, y) => [R[room][0] + x, R[room][1] + y];
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const go = (HW, room, x, y) => assert.ok(HW.walkTo(...at(room, x, y)), `walk to ${room} ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const here = (HW, room) => { const p = HW.player(); return [p.tx - R[room][0], p.ty - R[room][1]]; };
const thing = (HW, id) => HW.G.map.find(id);
const where = (HW, id) => { const e = thing(HW, id); return [e.tx, e.ty]; };
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
/* the Crossbar on whatever's in front (a rack), then steps (each a tap of an arrow), then let go */
function rack(HW, moves) {
    const names = { U: 'up', D: 'down', L: 'left', R: 'right' };
    HW.Inv.equipped = 'crossbar'; HW.press('tool', 1); HW.step(2);
    for (const m of moves) { HW.hold(names[m]); HW.step(4); HW.release(); HW.step(14); }
    HW.press('tool', 1); HW.step(2);
}
const strike = (HW, dir) => { HW.face(dir); HW.press('atk', 1); HW.step(14); };
const hook = (HW, dir) => { HW.face(dir); HW.Inv.equipped = 'hook'; HW.press('tool', 1); until(HW, () => HW.player().state === 'normal' && !HW.global('TOOLS').hook.h, 120); HW.step(2); };

test('the Gatehouse: the crate at the passage mouth is tied off from underneath; undo the knot and it goes home', () => {
    const HW = game();
    enter(HW, 'gate', 9, 9);
    const b = thing(HW, 'gaBlock');
    assert.ok(b.knotted, 'held fast');
    assert.deepEqual(where(HW, 'gaBlock'), at('gate', 9, 3), 'in the mouth of the passage (below where the House is named as you come in)');
    go(HW, 'gate', 9, 4); HW.push('up', 1); HW.step(20);
    assert.deepEqual(where(HW, 'gaBlock'), at('gate', 9, 3), "it won't budge");
    hatch(HW, 'gate', 16, 7, 'down');
    assert.deepEqual(here(HW, 'ugate'), [16, 7], 'down below');
    go(HW, 'ugate', 13, 4); HW.face('up'); HW.press('act', 1); HW.step(3);
    assert.ok(!b.knotted, 'untied');
    until(HW, () => HW.Return.isHome(b), 400);
    hatch(HW, 'ugate', 16, 7, 'down');
    go(HW, 'gate', 9, 1); HW.hold('up'); HW.step(40); HW.release(); HW.step(40);
    assert.equal(HW.global('Cam').room.name, 'The Winding Hall');
    noErrors(HW);
});

test('under the Winding Hall: the counterweight pushed off its plate past the sleeping boulder\'s place; the boulder rung awake from across the room, out of the weight\'s hearing: home in a flash, it stands in the weight\'s way home; the Spool Store gate opens', () => {
    const HW = game();
    enter(HW, 'uwind', 9, 8);
    const w = thing(HW, 'hwWeight'), r = thing(HW, 'hwRock'), g = thing(HW, 'swGateW');
    HW.step(3);
    assert.ok(!g.open, 'shut');
    go(HW, 'uwind', 11, 5); HW.push('right', 2); HW.step(25);
    assert.deepEqual([w.tx, w.ty], at('uwind', 14, 5));
    go(HW, 'uwind', 4, 2); HW.Inv.equipped = 'bell'; HW.press('tool', 1);
    assert.ok(until(HW, () => HW.Return.isHome(r), 120), 'the boulder home in a flash');
    assert.ok(w.ret.state !== 'home' && !w.ret.snap, 'the weight never heard it');
    HW.step(400);
    assert.deepEqual([w.tx, w.ty], at('uwind', 14, 5), 'the weight waits behind it');
    assert.ok(g.open, 'the gate up above is open');
    hatch(HW, 'uwind', 17, 7, 'down');
    go(HW, 'wind', 1, 5); HW.hold('left'); HW.step(30); HW.release(); HW.step(30);
    assert.equal(HW.global('Cam').room.name, 'The Spool Store');
    assert.ok(HW.Progress.areaFlag('spoolworks', 'door:swGateW'), 'latched once passed');
    noErrors(HW);
});

test('under the Winding Hall: rung awake first, the boulder lies home beside the weight and stands in no way of it; up and back down, it sleeps again', () => {
    const HW = game();
    enter(HW, 'uwind', 9, 8);
    const w = thing(HW, 'hwWeight'), r = thing(HW, 'hwRock');
    go(HW, 'uwind', 4, 2); HW.Inv.equipped = 'bell'; HW.press('tool', 1);
    assert.ok(until(HW, () => HW.Return.isHome(r), 120));
    go(HW, 'uwind', 11, 5); HW.push('right', 1); HW.step(25);
    assert.deepEqual([w.tx, w.ty], at('uwind', 12, 5), 'no way past it');
    go(HW, 'uwind', 13, 6); HW.push('up', 1); HW.step(10);
    assert.deepEqual([r.tx, r.ty], at('uwind', 13, 5), 'and no shifting it');
    hatch(HW, 'uwind', 17, 7, 'down'); HW.step(10); hatch(HW, 'wind', 17, 7, 'down'); HW.step(10);
    assert.ok(HW.Return.asleep(r) && r.tx === at('uwind', 3, 1)[0], 'asleep again across the room');
    noErrors(HW);
});

test('the Spool Store: push the block onto the plate, then tie it off from underneath before it goes home (key); the Plan below', () => {
    const HW = game();
    enter(HW, 'store', 17, 5);
    const b = thing(HW, 'ssBlock'), g = thing(HW, 'ssGate');
    go(HW, 'store', 15, 2); HW.push('down', 3); HW.step(25);
    assert.deepEqual([b.tx, b.ty], at('store', 15, 6), 'on the plate');
    hatch(HW, 'store', 15, 5, 'right');
    go(HW, 'ustore', 15, 4); HW.face('up'); knot(HW);
    assert.ok(b.knotted, 'tied off');
    go(HW, 'ustore', 5, 7); HW.face('down'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.plans.includes('spoolworks'), 'the Plan');
    HW.step(400);
    assert.deepEqual([b.tx, b.ty], at('store', 15, 6), 'still on the plate');
    hatch(HW, 'ustore', 15, 5, 'right');
    assert.ok(g.open, 'gate open');
    go(HW, 'store', 2, 3); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.keys('spoolworks'), 1, 'a key');
    /* the far door to the Ropewalk stays shut from this side */
    HW.step(5);
    assert.ok(!thing(HW, 'ssGateS').open, "the Ropewalk's far door is shut from here");
    noErrors(HW);
});

/* into the Kennel: well inside before Cog wakes (so the door that slams has nobody in it) */
function wakeCog(HW) {
    HW.Inv.keyCount.spoolworks = 1;
    enter(HW, 'wind', 17, 5);
    go(HW, 'wind', 18, 5); HW.hold('right'); HW.step(40); HW.release(); HW.step(5);
    const c = HW.G.map.ents.find(e => e.type === 'cog');
    HW.walkTo(...at('kennel', 3, 5)); HW.step(2); HW.skipTalk(); HW.step(5);
    return c;
}

test('the Kennel: Cog chases; down the hatch, tie off his cord, and he is held; two knocks (the Needle)', () => {
    const HW = game();
    HW.G.cheats.god = true;
    const c = wakeCog(HW);
    assert.notEqual(c.state, 'sleep', 'awake');
    assert.equal(c.hp, 2, 'two knocks in him');
    let knocks = 0;
    for (let round = 0; round < 3 && c.alive && !c.down; round++) {
        hatch(HW, 'kennel', 9, 7, 'down');
        until(HW, () => c.state === 'sit', 400);
        go(HW, 'ukennel', 9, 5); HW.face('up'); knot(HW);
        assert.ok(c.knotted, `round ${round + 1}: held`);
        hatch(HW, 'ukennel', 9, 7, 'down');
        go(HW, 'kennel', 9, 5); strike(HW, 'up'); knocks++;
        HW.step(10);
    }
    assert.equal(knocks, 2, 'two knocks');
    HW.skipTalk(); HW.step(10);
    assert.ok(!c.alive, 'Cog runs down');
    go(HW, 'kennel', 5, 3); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.has('needle'), 'the Needle');
    noErrors(HW);
});

test("Cog wakes only once you're inside, and the door that slams behind you is shut; he runs down as it's told: sits, topples, unravels, then the chest", () => {
    const HW = game();
    HW.G.cheats.god = true;
    HW.Inv.keyCount.spoolworks = 1;
    enter(HW, 'wind', 17, 5);
    go(HW, 'wind', 18, 5); HW.hold('right'); HW.step(30); HW.release(); HW.step(3);
    const c = HW.G.map.ents.find(e => e.type === 'cog'), door = HW.G.map.ents.find(e => e.kind === 'door' && e.group === 'cog' && e.dir === 'v');
    assert.equal(HW.global('Cam').room.name, 'The Kennel');
    assert.ok(here(HW, 'kennel')[0] < 2, 'just in the doorway');
    assert.equal(c.state, 'sleep', 'asleep while Wren stands in the door');
    HW.walkTo(...at('kennel', 3, 5)); HW.step(25);
    assert.notEqual(c.state, 'sleep', 'awake once she is in');
    assert.ok(!door.open, 'and the door behind her is shut when it says it slams');
    HW.skipTalk();
    /* the last knock: each line waits on what it tells */
    const Dialog = HW.global('Dialog');
    const nextLine = () => { until(HW, () => Dialog.active && Dialog.shown >= Dialog.pageLen(), 400); HW.press('act', 1); until(HW, () => !Dialog.active, 50); until(HW, () => Dialog.active, 300); };
    c.hp = 1;
    hatch(HW, 'kennel', 9, 7, 'down'); until(HW, () => c.state === 'sit', 400);
    go(HW, 'ukennel', 9, 5); HW.face('up'); knot(HW); hatch(HW, 'ukennel', 9, 7, 'down');
    go(HW, 'kennel', 9, 5); strike(HW, 'up');
    assert.ok(c.alive && c.down, 'run down where he stands, not gone');
    const chest = thing(HW, 'kNeedle');
    until(HW, () => Dialog.active, 200);
    assert.equal(c.state, 'toppled', 'toppled over when it says so');
    assert.ok(chest.hidden, 'no chest yet');
    nextLine();
    assert.ok(!c.alive, 'unravelled as his thread runs off');
    assert.ok(chest.hidden, 'still no chest');
    nextLine();
    assert.ok(!chest.hidden, 'the chest has come up as the line says');
    HW.skipTalk();
    noErrors(HW);
});

test("the Kennel's south door: nobody can push the weight in the way; the Needle gives it a new place, and the way's open", () => {
    const HW = game(['needle']);
    HW.Progress.set('spool_cog');
    enter(HW, 'kennel', 9, 8);
    const w = thing(HW, 'paWeight');
    go(HW, 'practice', 9, 0); HW.push('down', 1); HW.step(20);
    assert.deepEqual([w.tx, w.ty], at('practice', 9, 1), 'not budged');
    HW.face('down'); stitch(HW, 'R');
    until(HW, () => HW.Return.isHome(w), 60);
    assert.deepEqual([w.tx, w.ty], at('practice', 10, 1), 'in its nook');
    go(HW, 'practice', 9, 3);
    noErrors(HW);
});

/* the Practice Floor, from below: the rack walks both puppets; one held fast (knotted) stays put while the rack walks
   the other; both on their plates, the door to the Gatehouse is open while they stay */
function practice(HW) {
    enter(HW, 'practice', 9, 3);
    /* the boy's cord hangs over a hole below, out of reach: his plate is made his place (the Needle, from up here) */
    go(HW, 'practice', 13, 2); HW.face('down'); stitch(HW, 'DDD');
    until(HW, () => HW.Return.isHome(thing(HW, 'paBoy')), 120);
    assert.deepEqual(where(HW, 'paBoy'), at('practice', 13, 6), 'the boy on his plate, his place now');
    hatch(HW, 'practice', 3, 7, 'down');
    assert.deepEqual(here(HW, 'upractice'), [3, 7], 'under the Practice Floor');
    assert.equal(HW.walkTo(...at('upractice', 13, 4)), false, "nowhere to stand by the boy's cord");
    go(HW, 'upractice', 12, 4); HW.face('up');
    rack(HW, 'DDDDD');
    assert.deepEqual(where(HW, 'paWren'), at('practice', 11, 8), 'the little Wren on hers');
    assert.notDeepEqual(where(HW, 'paBoy'), at('practice', 13, 6), 'the rack took the boy on past his');
    go(HW, 'upractice', 11, 4); HW.face('up'); knot(HW);
    assert.ok(thing(HW, 'paWren').knotted);
    assert.ok(until(HW, () => HW.Return.isHome(thing(HW, 'paBoy')), 600), 'let go, the boy walks home');
    assert.deepEqual(where(HW, 'paBoy'), at('practice', 13, 6), 'home: his plate');
}

test('the Practice Floor: the boy\'s cord is out of reach below, so his plate is made his place (the Needle); the little Wren walked onto hers from the rack and tied; let go, he walks home onto his; up and out through the Gatehouse door', () => {
    const HW = game(['needle']);
    HW.step(1);
    practice(HW);
    HW.step(200);
    const g = thing(HW, 'gaGateE');
    assert.ok(g.open, 'the door is open, and stays open while they stay');
    hatch(HW, 'upractice', 3, 7, 'down');
    go(HW, 'practice', 1, 5); HW.hold('left'); HW.step(40); HW.release(); HW.step(10);
    assert.equal(HW.global('Cam').room.name, 'The Gatehouse');
    go(HW, 'gate', 17, 5);
    assert.ok(HW.Progress.areaFlag('spoolworks', 'door:gaGateE'), 'latched once through');
    HW.step(5);
    assert.ok(thing(HW, 'gaGateW').open, "and the Ropewalk's door across the hall opens");
    noErrors(HW);
});

test("the Practice Floor's puppets let go just walk home: the door shuts before anyone could get round to it", () => {
    const HW = game();
    enter(HW, 'practice', 9, 3);
    hatch(HW, 'practice', 3, 7, 'down');
    go(HW, 'upractice', 12, 4); HW.face('up');
    rack(HW, 'DDD');
    go(HW, 'upractice', 12, 4); HW.face('up'); HW.Inv.equipped = 'crossbar'; HW.press('tool', 1); HW.step(2);
    HW.hold('left'); HW.step(4); HW.release(); HW.step(14);
    /* (both stepped left? the walls of their runs hold them: no) */
    assert.deepEqual(where(HW, 'paBoy'), at('practice', 13, 6));
    HW.press('tool', 1); HW.step(2);
    until(HW, () => HW.Return.isHome(thing(HW, 'paBoy')) && HW.Return.isHome(thing(HW, 'paWren')), 900);
    HW.step(5);
    assert.ok(!thing(HW, 'gaGateE').open, 'home on their stands, the door shut');
    noErrors(HW);
});

/* the Ropewalk: from below, the Needle through the crate's cord moves it into line (and its cord with it) */
function ropewalkLineUp(HW) {
    HW.Progress.setAreaFlag('spoolworks', 'door:gaGateE');
    enter(HW, 'rope', 17, 5);
    hatch(HW, 'rope', 15, 7, 'down');
    assert.deepEqual(here(HW, 'urope'), [15, 7], 'under the Ropewalk');
    go(HW, 'urope', 2, 3); HW.face('up');
    stitch(HW, 'RRRR');
    const c = thing(HW, 'rwCrate');
    until(HW, () => HW.Return.isHome(c), 120);
    assert.deepEqual([c.tx, c.ty], at('rope', 6, 2), 'moved into line, up above');
    HW.step(2);
    const cord = HW.G.map.ents.find(e => e.kind === 'cord' && e.thing === c);
    assert.deepEqual([cord.tx, cord.ty], at('urope', 6, 2), 'its cord with it');
    return c;
}

test('the Ropewalk: the crate moved into line through its cord, tied off below: the Hookline bites into it like a post; the key; out by the far door', () => {
    const HW = game(['needle']);
    const c = ropewalkLineUp(HW);
    go(HW, 'urope', 6, 3); HW.face('up'); knot(HW);
    assert.ok(c.knotted, 'held fast');
    hatch(HW, 'urope', 15, 7, 'down');
    go(HW, 'rope', 11, 2); hook(HW, 'left');
    assert.deepEqual(here(HW, 'rope'), [7, 2], 'reeled across the gap, to the crate');
    go(HW, 'rope', 2, 7); HW.face('down'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.keys('spoolworks'), 1, 'the key');
    HW.step(5);
    assert.ok(thing(HW, 'ssGateS').open, 'the far door to the Spool Store opens');
    go(HW, 'rope', 4, 1); HW.hold('up'); HW.step(30); HW.release(); HW.step(20);
    assert.equal(HW.global('Cam').room.name, 'The Spool Store');
    noErrors(HW);
});

test("the Ropewalk, another way: hook the crate over, push it aside, and hook the empty place where it belongs", () => {
    const HW = game(['needle']);
    const c = ropewalkLineUp(HW);
    hatch(HW, 'urope', 15, 7, 'down');
    go(HW, 'rope', 12, 2); hook(HW, 'left');
    assert.deepEqual([c.tx, c.ty], at('rope', 11, 2), 'reeled over the gap to this side');
    go(HW, 'rope', 11, 1); HW.push('down', 1); HW.step(5);
    assert.deepEqual([c.tx, c.ty], at('rope', 11, 3), 'out of the line');
    go(HW, 'rope', 12, 2); hook(HW, 'left');
    assert.deepEqual(here(HW, 'rope'), [6, 2], 'reeled onto its empty mark');
    noErrors(HW);
});

test('under the Spool Store: the way north is locked; the key from the Ropewalk opens it', () => {
    const HW = game(['needle']);
    enter(HW, 'ustore', 2, 5);
    go(HW, 'ustore', 2, 2); HW.hold('up'); HW.step(30); HW.release(); HW.step(5);
    assert.deepEqual(here(HW, 'ustore'), [2, 2], 'locked');
    HW.Inv.keyCount.spoolworks = 1;
    HW.hold('up'); HW.step(60); HW.release(); HW.step(5);
    assert.equal(HW.Inv.keys('spoolworks'), 0, 'the key used');
    go(HW, 'uloft', 2, 9);
    noErrors(HW);
});

test('the Bobbin Loft: no bobbin shifts by hand; one stitched onto its plate and tied off below, then the other three stitched: the fourth stitch lets go of the first, but its knot holds it (the Pattern)', () => {
    const HW = game(['needle']);
    enter(HW, 'loft', 9, 9);
    const B = id => thing(HW, id);
    go(HW, 'loft', 11, 7); HW.push('right', 1); HW.step(10);
    assert.deepEqual([B('blB4').tx, B('blB4').ty], at('loft', 12, 7), 'a bobbin will not be pushed');
    go(HW, 'loft', 6, 5); HW.face('up'); stitch(HW, 'LLLU'); until(HW, () => HW.Return.isHome(B('blB1')), 120);
    assert.deepEqual([B('blB1').tx, B('blB1').ty], at('loft', 3, 3));
    hatch(HW, 'loft', 9, 7, 'down');
    go(HW, 'uloft', 3, 4); HW.face('up'); knot(HW);
    assert.ok(B('blB1').knotted, 'the first tied off below, on its plate');
    hatch(HW, 'uloft', 9, 7, 'down');
    go(HW, 'loft', 12, 5); HW.face('up'); stitch(HW, 'RRRU'); until(HW, () => HW.Return.isHome(B('blB2')), 120);
    go(HW, 'loft', 6, 6); HW.face('down'); stitch(HW, 'LLLD'); until(HW, () => HW.Return.isHome(B('blB3')), 120);
    /* the fourth: Wren can't stand in for it, a bobbin must */
    go(HW, 'loft', 15, 8); HW.step(10);
    assert.ok(B('blPattern').hidden, 'Wren is no bobbin');
    go(HW, 'loft', 12, 6); HW.face('down'); stitch(HW, 'RRRD'); until(HW, () => HW.Return.isHome(B('blB4')), 120);
    assert.equal(HW.Inv.stitches.length, 3, 'the first stitch let go');
    HW.step(60);
    assert.deepEqual([B('blB1').tx, B('blB1').ty], at('loft', 3, 3), 'but the knot holds the first where it is');
    HW.step(310);
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

/* Cog's pounce: a few strides off he crouches, tail whirring, and the spot Wren stands on darkens; off it before he lands */
test("Cog's pounce: he crouches a few strides off, its shadow on Wren; a step aside and he lands on nothing (a heart and a half if not)", () => {
    for (const dodge of [true, false]) {
        const HW = game();
        const c = wakeCog(HW), p = HW.player();
        c.state = 'chase'; c.st = 100; c.x = p.x + 36; c.y = p.y; HW.step(1);
        assert.ok(until(HW, () => c.state === 'crouch', 10), 'he crouches');
        const sh = HW.G.map.ents.find(e => e.kind === 'hazard' && e.owner === c);
        assert.ok(sh && sh.covers(p.x, p.y) && sh.tell >= 30, "the shadow on her, with time to move");
        const hp = HW.Inv.hp;
        if (dodge) { HW.hold('up'); HW.step(22); HW.release(); }
        assert.ok(until(HW, () => c.state === 'recover', 80), 'he lands');
        if (dodge) assert.equal(HW.Inv.hp, hp, 'on nothing');
        else assert.ok(HW.Inv.hp <= hp - 3, 'on her');
        noErrors(HW);
    }
});

/* ---------------- the Tangle ---------------- */
function tangleGame() {
    const HW = game(['needle']);
    HW.G.cheats.god = true;
    enter(HW, 'heart', 9, 9);
    HW.walkTo(...at('heart', 6, 7)); HW.step(5); HW.skipTalk(); HW.step(5);
    const t = HW.G.map.ents.find(e => e.kind === 'tangle');
    assert.equal(t.state, 'whole');
    return [HW, t];
}
const B = (HW, id) => thing(HW, id);
/* (the Tangle takes three knocks to undo: between them its loose cords lash about) */
const knockCore = HW => { const t = HW.G.map.ents.find(e => e.kind === 'tangle'), hp = t.hp; for (let k = 0; k < 8 && t.alive && t.hp === hp; k++) { strike(HW, 'up'); HW.step(6); } };
/* phase 1: three stitched away, the fourth pushed off and tied below */
function phase1(HW, t) {
    until(HW, () => ['tbN', 'tbW', 'tbE', 'tbS'].every(id => HW.Return.isHome(B(HW, id)) && !B(HW, id).mv), 300);
    HW.walkTo(...at('heart', 8, 2)); HW.face('right'); stitch(HW, 'UL'); until(HW, () => HW.Return.isHome(B(HW, 'tbN')), 60);
    go(HW, 'heart', 6, 4); HW.face('down'); stitch(HW, 'LL'); until(HW, () => HW.Return.isHome(B(HW, 'tbW')), 60);
    go(HW, 'heart', 12, 4); HW.face('down'); stitch(HW, 'RR'); until(HW, () => HW.Return.isHome(B(HW, 'tbE')), 60);
    go(HW, 'heart', 8, 8); HW.push('right', 2); HW.step(25);
    assert.deepEqual(where(HW, 'tbS'), at('heart', 11, 8), 'the fourth pushed off');
    hatch(HW, 'heart', 2, 7, 'down');
    go(HW, 'uheart', 9, 7); HW.face('down'); knot(HW);
    assert.ok(B(HW, 'tbS').knotted);
    hatch(HW, 'uheart', 2, 7, 'down');
    assert.ok(until(HW, () => t.state === 'open', 300), 'it comes apart');
    go(HW, 'heart', 9, 6); knockCore(HW);
    assert.equal(t.hp, 2, 'knocked once');
    HW.skipTalk(); HW.step(5);
}
/* phase 2: up on the hoist; below, its counterweight pushed off its plate: down it comes */
function phase2(HW, t) {
    assert.equal(t.state, 'up', 'up on the hoist');
    assert.ok(!B(HW, 'tbS').knotted, 'the knot below slipped');
    assert.ok(['tbN', 'tbW', 'tbE'].every(id => B(HW, id).stitched && HW.Return.isHome(B(HW, id))), 'the stitched ones stay where they were put');
    hatch(HW, 'heart', 2, 7, 'down');
    go(HW, 'uheart', 1, 7); HW.push('up', 1); HW.step(5);
    assert.deepEqual(where(HW, 'hhWeight'), at('uheart', 1, 5), 'the weight off its plate');
    assert.ok(until(HW, () => t.state === 'down', 120), 'down it comes');
    hatch(HW, 'uheart', 2, 7, 'down');
    go(HW, 'heart', 9, 6); knockCore(HW);
    assert.equal(t.hp, 1, 'knocked twice');
    HW.skipTalk(); HW.step(5);
}

test('the Tangle: three phases. Four threads held out at once; then up on the hoist (its counterweight below); then it hauls, and only a hand and a bell beat it', () => {
    const [HW, t] = tangleGame();
    phase1(HW, t);
    phase2(HW, t);
    /* phase 3: the trapdoor wound shut; it hauls the stitched ones in. Grip the fourth and hold it out, ring with the
       other hand: everything goes home at once, and home is where the Needle put it */
    assert.equal(t.state, 'haul');
    until(HW, () => t.haulT === 0 && B(HW, 'tbN').ret.state !== 'home', 400);
    go(HW, 'heart', 10, 8); HW.face('left');
    HW.hold('act'); HW.step(3);
    assert.equal(HW.player().grip, B(HW, 'tbS'), 'a grip on the south bobbin');
    HW.hold(['act', 'right']); until(HW, () => HW.player().tx === at('heart', 11, 8)[0] && !B(HW, 'tbS').mv, 60); HW.hold('act'); HW.step(2);
    assert.deepEqual(where(HW, 'tbS'), at('heart', 10, 8), 'pulled off its place, and held');
    until(HW, () => t.haulT === 2, 200);
    HW.Inv.equipped = 'bell'; HW.hold(['act', 'tool']); HW.step(1); HW.hold('act');
    assert.ok(until(HW, () => t.state === 'open', 90), 'every thread out at once: it comes apart');
    HW.release(); HW.step(2);
    go(HW, 'heart', 9, 6); knockCore(HW);
    assert.ok(!t.alive, 'undone');
    for (let i = 0; i < 20 && !HW.Progress.flag('d7'); i++) { HW.skipTalk(); HW.step(20); }
    assert.ok(HW.Progress.flag('d7'));
    noErrors(HW);
});

/* its blows, each with its tell, each dodged (or not): the beats reached with them harmless, then real */
const tgBlows = (HW, t) => HW.G.map.ents.filter(e => e.kind === 'hazard' && e.owner === t);
test("the Tangle's cord: whipped right across the hall along its row or column, the line lit first; off the line and it cracks past (a heart and a half if not)", () => {
    for (const dodge of [true, false]) {
        const [HW, t] = tangleGame(); HW.G.cheats.god = false;
        const p = HW.player();
        go(HW, 'heart', 15, 5); t.sweepT = 1; t.ballT = 999; t.st = 1;
        assert.ok(until(HW, () => tgBlows(HW, t).some(h => h.dmg === 3 && h.shape === 'tiles'), 10), 'a line lit');
        const h = tgBlows(HW, t).find(q => q.dmg === 3 && q.shape === 'tiles');
        assert.ok(h.tiles.some(([x, y]) => x === p.tx && y === p.ty), "along Wren's row");
        const hp = HW.Inv.hp;
        if (dodge) { HW.hold('down'); HW.step(16); HW.release(); }
        assert.ok(until(HW, () => h.removed, 80), 'it cracked');
        if (dodge) assert.equal(HW.Inv.hp, hp, 'past her');
        else assert.equal(HW.Inv.hp, hp - 3, 'lashed');
        noErrors(HW);
    }
});
test("the Tangle's lash: too close, and its reach is drawn on the floor round it before the cords come out; back out of it", () => {
    for (const dodge of [true, false]) {
        const [HW, t] = tangleGame(); HW.G.cheats.god = false;
        const p = HW.player();
        go(HW, 'heart', 11, 5); HW.step(10); t.sweepT = 999; t.ballT = 999;
        assert.ok(until(HW, () => tgBlows(HW, t).some(h => h.shape === 'ring'), 60), 'its reach drawn');
        const ring = tgBlows(HW, t).find(h => h.shape === 'ring');
        assert.ok(ring.covers(p.x, p.y), 'Wren inside it');
        const hp = HW.Inv.hp;
        if (dodge) { HW.hold(['down', 'right']); HW.step(22); HW.release(); assert.ok(!ring.covers(p.x, p.y), 'out of it'); }
        assert.ok(until(HW, () => ring.removed, 80), 'it lashed');
        if (dodge) assert.equal(HW.Inv.hp, hp, 'out of reach');
        else assert.equal(HW.Inv.hp, hp - 3, 'lashed');
        noErrors(HW);
    }
});
test("the Tangle's yarn balls: it swells and glows first; a step aside as they come (three fanned in its last beat, one always at her)", () => {
    for (const dodge of [true, false]) {
        const [HW, t] = tangleGame(); HW.G.cheats.god = false;
        const p = HW.player();
        go(HW, 'heart', 3, 2); t.sweepT = 999; t.ballT = 1;
        assert.ok(until(HW, () => t.swell > 0, 10), 'it swells');
        assert.ok(until(HW, () => t.balls.length > 0, 40), 'and throws');
        const hp = HW.Inv.hp;
        if (dodge) { HW.hold('down'); HW.step(40); HW.release(); }
        else HW.step(40);
        HW.step(40);
        if (dodge) assert.equal(HW.Inv.hp, hp, 'past her');
        else assert.ok(HW.Inv.hp < hp, 'hit');
        noErrors(HW);
    }
});
test("the Tangle up in the rafters lets spoolmites down; they're beaten like any (and come back no more)", () => {
    const [HW, t] = tangleGame();
    phase1(HW, t);
    assert.equal(t.state, 'up');
    t.miteT = 1;
    assert.ok(until(HW, () => HW.G.map.ents.some(e => e.tangleMite), 400), 'spoolmites let down');
    const m = HW.G.map.ents.find(e => e.tangleMite);
    for (let k = 0; k < 4 && m.alive; k++) { m.flash = 0; m.struck(HW.player(), 1, 0); HW.step(2); }
    assert.ok(!m.alive, 'beaten');
    HW.step(80);
    assert.ok(!HW.G.map.ents.includes(m), "gone: its yarn ran off");
    noErrors(HW);
});
test("the Tangle's second phase: up on the hoist it can't be reached, Wren walks under it; let the weight home and it's hauled up again", () => {
    const [HW, t] = tangleGame();
    phase1(HW, t);
    assert.equal(t.state, 'up');
    HW.step(60);
    assert.equal(t.hurtBox(), null, 'out of reach');
    go(HW, 'heart', 9, 5);
    assert.deepEqual(here(HW, 'heart'), [9, 5], 'right under it');
    hatch(HW, 'heart', 2, 7, 'down');
    go(HW, 'uheart', 1, 7); HW.push('up', 1);
    assert.ok(until(HW, () => t.state === 'down', 120), 'down');
    assert.ok(until(HW, () => t.state === 'up', 900), 'the weight home on its plate, up it goes again');
    noErrors(HW);
});

test("the Tangle's last phase: the trapdoor won't lift; it hauls stitched bobbins off their new places; a ring alone, with the fourth at home, isn't enough", () => {
    const [HW, t] = tangleGame();
    phase1(HW, t);
    phase2(HW, t);
    assert.equal(t.state, 'haul');
    go(HW, 'heart', 2, 7); HW.face('down'); HW.press('act', 1); HW.step(40);
    assert.deepEqual(here(HW, 'heart'), [2, 7], "the trapdoor's wound shut");
    const w = B(HW, 'tbW'), home = [w.ret.mx, w.ret.my];
    assert.notDeepEqual(home, at('heart', 6, 5), 'its place is where it was stitched');
    until(HW, () => w.tx !== home[0] || w.ty !== home[1], 300);
    assert.notDeepEqual([w.tx, w.ty], home, 'hauled off its stitched place');
    assert.deepEqual([w.ret.mx, w.ret.my], home, 'though that is still its place');
    go(HW, 'heart', 10, 9);
    until(HW, () => t.haulT === 2, 200);
    HW.Inv.equipped = 'bell'; HW.press('tool', 1);
    until(HW, () => ['tbN', 'tbW', 'tbE'].every(id => HW.Return.isHome(B(HW, id))), 40);
    HW.step(40);
    assert.equal(t.state, 'haul', 'three home and out, the fourth at its first place: still whole');
    noErrors(HW);
});

test('old saves: one saved under the Spool Store with a stitch for the weight that stood there (gone now) loads, the stitch let go of', () => {
    const HW = game(['needle']);
    enter(HW, 'ustore', 4, 6);
    HW.Inv.stitches = [{ area: 'spoolworks', key: 'usWeight', from: at('ustore', 2, 2), to: at('ustore', 3, 2), trace: [at('ustore', 2, 2), at('ustore', 3, 2)], stray: false, color0: '#a8784a' }];
    const save = JSON.parse(JSON.stringify(HW.global('Save').snapshot()));
    const H2 = loadGame();
    H2.global('Game').load(H2.global('Save').migrate(save)); H2.step(10); H2.skipTalk();
    assert.equal(H2.G.map.id, 'spoolworks');
    assert.equal(H2.Inv.stitches.length, 0, 'no stitch for a thing that is gone');
    assert.ok(!H2.G.map.kind(H2.player().tx, H2.player().ty).solid, 'standing on the floor');
    assert.ok(H2.walkTo(...at('ustore', 2, 3)), 'and about');
    noErrors(H2);
});
