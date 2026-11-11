// The Slumberhouse (House 5): every room's solution, played through the real game code.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const R = { porch: [20, 33], ward: [20, 22], linen: [0, 22], laundry: [40, 22], study: [60, 22], loft: [40, 33], landing: [20, 11], nursery: [0, 11], moonwalk: [40, 11], fort: [0, 0], boss: [20, 0], kitchen: [40, 0], dream: [60, 0] };
const at = (room, x, y) => [R[room][0] + x, R[room][1] + y];
function game(tools = []) {
    const HW = loadGame();
    HW.newGame('Test', { area: 'slumber', x: 29, y: 42, noAutosave: true });
    HW.Inv.items.staff = 1;
    for (const t of ['gloves', 'hook', 'paddle', 'bell', ...tools]) HW.Inv.giveTool(t);
    HW.Inv.maxHp = HW.Inv.hp = 40;
    HW.step(5);
    return HW;
}
const enter = (HW, room, x, y) => { HW.warp('slumber', ...at(room, x, y)); HW.step(30); HW.skipTalk(); HW.step(5); };
const go = (HW, room, x, y) => assert.ok(HW.walkTo(...at(room, x, y)), `walk to ${room} ${x},${y} (at ${HW.player().tx - R[room][0]},${HW.player().ty - R[room][1]})`);
const thing = (HW, id) => HW.G.map.find(id);
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const strike = (HW, dir) => { HW.face(dir); HW.press('atk', 1); HW.step(12); };
const ring = HW => { HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(4); };
const lay = HW => { HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(2); };
const homeward = HW => { HW.Inv.equipped = 'bedroll'; HW.hold('tool'); HW.step(24); HW.release(); HW.step(1); };
const landed = HW => until(HW, () => HW.player().state === 'normal', 600);
const here = (HW, room) => { const p = HW.player(); return [p.tx - R[room][0], p.ty - R[room][1]]; };
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
/* step tile by tile (orthogonal moves only), the way a careful player crosses old boards */
function stepPath(HW, room, path) {
    const p = HW.player();
    for (const [x, y] of path) {
        const [tx, ty] = at(room, x, y);
        const d = tx > p.tx ? 'right' : tx < p.tx ? 'left' : ty > p.ty ? 'down' : 'up';
        for (let i = 0; i < 60 && (p.tx !== tx || p.ty !== ty); i++) { HW.hold(d); HW.step(1); }
        /* on to the middle of the tile */
        const along = d === 'left' || d === 'right' ? () => Math.abs(p.x - (tx * 16 + 8)) : () => Math.abs(p.y - (ty * 16 + 10));
        for (let i = 0; i < 12 && along() > 2; i++) { HW.hold(d); HW.step(1); }
        HW.release();
        assert.deepEqual([p.tx, p.ty], [tx, ty], `stepped onto ${x},${y}`);
        assert.equal(p.state, 'normal', `still standing at ${x},${y}`);
    }
}

test('the night porch: lie in the bed; over the boards to the lever; the boards are gone, so fall home onto the bed', () => {
    const HW = game();
    const p = HW.player();
    go(HW, 'porch', 4, 6); HW.face('left'); HW.press('act', 1); HW.skipTalk();
    assert.ok(p.mark.bed, 'the bed is the mark');
    const hp = HW.Inv.hp;
    go(HW, 'porch', 9, 5);
    stepPath(HW, 'porch', [[10, 5], [11, 5], [12, 5], [13, 5], [14, 5], [15, 5]]);
    HW.step(30);
    assert.ok(HW.G.map.kind(...at('porch', 12, 5)).pit, 'the boards gave way behind');
    HW.face('right'); HW.press('act', 1); HW.step(10);
    assert.ok(thing(HW, 'npGate').open, 'the gate opened');
    HW.hold('left'); until(HW, () => p.state === 'fall', 120); HW.release();
    landed(HW);
    assert.deepEqual(here(HW, 'porch'), [4, 6], 'woke by the bed');
    assert.equal(HW.Inv.hp, hp, 'no harm done');
    go(HW, 'porch', 9, 1); go(HW, 'ward', 9, 9);
    noErrors(HW);
});

test('the linen cupboard: one walk over the boards lights all three lamps; fall home; the key', () => {
    const HW = game();
    enter(HW, 'ward', 1, 5);
    go(HW, 'linen', 16, 3); HW.face('left'); HW.press('act', 1); HW.skipTalk();
    go(HW, 'linen', 13, 6);
    stepPath(HW, 'linen', [[12, 6], [12, 5], [11, 5], [10, 5], [9, 5], [9, 4], [9, 3], [8, 3], [8, 4], [8, 5], [8, 6], [8, 7], [7, 7]]);
    HW.step(20);
    assert.ok(thing(HW, 'lcGate').open, 'all three lit: the cupboard opens');
    const p = HW.player();
    HW.hold('left'); until(HW, () => p.state === 'fall', 120); HW.release();
    landed(HW);
    assert.ok(!HW.G.map.kind(...at('linen', 9, 4)).pit, 'boards mended');
    go(HW, 'linen', 3, 5); HW.face('left'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.keys('slumber'), 1, 'key A');
    noErrors(HW);
});

test('the linen cupboard: a wrong walk strands you; falling home mends the boards for another go', () => {
    const HW = game();
    enter(HW, 'linen', 18, 5);
    go(HW, 'linen', 13, 6);
    stepPath(HW, 'linen', [[12, 6], [11, 6], [11, 5]]);
    HW.step(20);
    const p = HW.player();
    assert.ok(HW.G.map.kind(...at('linen', 12, 6)).pit, 'the way back is gone');
    HW.hold('down'); until(HW, () => p.state === 'fall', 120); HW.release();
    landed(HW);
    assert.ok(!HW.G.map.kind(...at('linen', 12, 6)).pit, 'mended');
});

test('the laundry: ride the current under all three dreamcatchers, jump in before it comes round; flying home lights them (the Plan)', () => {
    const HW = game();
    enter(HW, 'laundry', 1, 5);
    const p = HW.player(), b = thing(HW, 'ldBasket');
    go(HW, 'laundry', 2, 8); HW.hold('right'); HW.step(16); HW.release(); HW.step(4);
    assert.deepEqual(here(HW, 'laundry'), [3, 8], 'in the basket');
    HW.Inv.equipped = 'paddle'; HW.hold(['tool', 'up']); HW.step(20); HW.release();
    /* round it goes: east, north, west along the top */
    assert.ok(until(HW, () => b.ty === at('laundry', 0, 2)[1] && b.tx <= at('laundry', 7, 0)[0] && !b.mv, 3000), 'carried round to the top');
    HW.hold('up'); until(HW, () => p.ty === at('laundry', 0, 1)[1] && !p.ride, 120); HW.step(10); HW.release();
    assert.equal(here(HW, 'laundry')[1], 1, 'ashore at the top');
    HW.hold('down'); until(HW, () => p.state === 'fall', 200); HW.release();
    landed(HW);
    for (const id of ['ldRing1', 'ldRing2', 'ldRing3']) assert.ok(thing(HW, id).lit > 0, id + ' lit on the way home');
    HW.step(5);
    go(HW, 'laundry', 2, 1); HW.face('left'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.plans.includes('slumber'), 'the Plan');
    noErrors(HW);
});

test('the laundry: ride all the way round and the trace folds back on itself: the dreamcatchers stay dark', () => {
    const HW = game();
    enter(HW, 'laundry', 1, 5);
    const p = HW.player(), b = thing(HW, 'ldBasket');
    go(HW, 'laundry', 2, 8); HW.hold('right'); HW.step(16); HW.release(); HW.step(4);
    HW.Inv.equipped = 'paddle'; HW.hold(['tool', 'up']); HW.step(20); HW.release();
    assert.ok(until(HW, () => b.tx === at('laundry', 3, 0)[0] && b.ty === at('laundry', 0, 6)[1], 4000), 'all the way round');
    assert.ok(until(HW, () => b.ty === at('laundry', 0, 7)[1] && b.tx >= at('laundry', 4, 0)[0] && !b.mv, 600), 'starting the loop again');
    HW.hold('down'); until(HW, () => p.ty === at('laundry', 0, 8)[1] && !p.ride, 120); HW.step(10); HW.release();
    HW.hold('up'); until(HW, () => p.state === 'fall', 200); HW.release();
    landed(HW);
    assert.ok(!(thing(HW, 'ldRing1').lit && thing(HW, 'ldRing2').lit && thing(HW, 'ldRing3').lit), 'not all three');
});

test('the drying loft: the sleeping boulder\'s own place is out on the island, empty: the hook catches on it; take the key; fall home (key B)', () => {
    const HW = game();
    enter(HW, 'loft', 9, 1);
    HW.G.cheats.god = true;
    const p = HW.player(), bo = thing(HW, 'dlBoulder');
    go(HW, 'loft', 3, 1); HW.face('left'); HW.press('act', 1); HW.skipTalk();
    go(HW, 'loft', 13, 3); HW.Inv.equipped = 'hook'; HW.face('down'); HW.press('tool', 1); HW.step(80);
    assert.deepEqual(here(HW, 'loft'), [13, 8], 'reeled over onto its empty place');
    go(HW, 'loft', 14, 8); HW.face('right'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.keys('slumber'), 1, 'key B');
    HW.hold('left'); until(HW, () => p.state === 'fall', 200); HW.release();
    landed(HW);
    assert.deepEqual(here(HW, 'loft'), [3, 1], 'home by the bed');
    noErrors(HW);
});

test('the drying loft: rung awake, the boulder fills its own place on the island, and the hook only drops you in the drop; leave, and it lies down again', () => {
    const HW = game();
    enter(HW, 'loft', 9, 1);
    HW.G.cheats.god = true;
    const p = HW.player(), bo = thing(HW, 'dlBoulder');
    go(HW, 'loft', 8, 2); ring(HW);
    assert.ok(until(HW, () => HW.Return.isHome(bo), 200), 'home over the drop, onto the island');
    /* (the ring woke the Snorelings too: let them shuffle off to a bed) */
    until(HW, () => !HW.G.map.ents.some(e => e.type === 'snoreling' && e.mode === 'chase'), 1500);
    go(HW, 'loft', 13, 3); HW.Inv.equipped = 'hook'; HW.face('down'); HW.press('tool', 1);
    assert.ok(until(HW, () => p.state === 'fall', 120), 'set down in front of it: in the drop');
    landed(HW);
    go(HW, 'loft', 9, 1); HW.hold('up'); HW.step(30); HW.release(); HW.step(10);
    HW.hold('down'); HW.step(30); HW.release(); HW.step(10);
    assert.ok(HW.Return.asleep(bo) && bo.tx === at('loft', 6, 2)[0], 'asleep again, its place empty');
    noErrors(HW);
});

test('the landing: Matron Hush follows your footsteps over the boards, which give way under her; two knocks while she is dazed (the Bedroll)', () => {
    const HW = game();
    HW.G.cheats.god = true;
    enter(HW, 'landing', 9, 9);
    const m = thing(HW, 'matron');
    HW.hold('up'); HW.step(10); HW.release(); HW.skipTalk(); HW.step(5);
    assert.notEqual(m.state, 'sleep', 'she is up');
    assert.ok(!thing(HW, 'laBedroll') || thing(HW, 'laBedroll').hidden, 'no prize yet');
    for (let round = 0; round < 2; round++) {
        go(HW, 'landing', 9, 8); HW.step(round ? 0 : 30);
        stepPath(HW, 'landing', [[9, 7], [9, 6], [9, 5], [9, 4], [9, 3], [9, 2], [9, 1]]);
        assert.ok(until(HW, () => m.state === 'dazed' || !m.alive, 900), `round ${round + 1}: she fell through and flew home, dazed`);
        /* round the edge of the boards (not over them) to her bed */
        go(HW, 'landing', 2, 2); go(HW, 'landing', 4, 7); go(HW, 'landing', 4, 9); strike(HW, 'left');
        if (!round) assert.ok(m.alive && m.hp === 1, 'one knock: she is up again');
    }
    assert.ok(!m.alive, 'Matron Hush unravels after two');
    HW.step(60); HW.skipTalk(); HW.step(10);
    go(HW, 'landing', 9, 9); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.has('bedroll'), 'the Bedroll');
    noErrors(HW);
});

test('the nursery: lay the Bedroll above, drop into the playpen, pick up the toy, Homeward with it; it fills the pit under the door', () => {
    const HW = game(['bedroll']);
    enter(HW, 'nursery', 18, 5);
    const p = HW.player();
    go(HW, 'nursery', 8, 3); lay(HW);
    go(HW, 'nursery', 4, 5); HW.hold('down'); until(HW, () => p.ty === at('nursery', 0, 7)[1] && p.state === 'normal', 120); HW.release();
    assert.equal(here(HW, 'nursery')[1], 7, 'down in the playpen');
    HW.face('down'); HW.press('act', 1); HW.step(10);
    assert.ok(p.carry, 'holding the toy');
    homeward(HW); landed(HW);
    assert.deepEqual(here(HW, 'nursery'), [8, 3], 'home, toy and all');
    assert.ok(p.carry, 'still holding it');
    HW.face('up'); HW.press('act', 1); HW.step(30);
    assert.ok(!HW.G.map.kind(...at('nursery', 8, 2)).pit, 'the stray toy filled the pit');
    HW.Inv.keyCount.slumber = 1;
    go(HW, 'nursery', 8, 1); go(HW, 'nursery', 9, 1); HW.hold('up'); HW.step(40); HW.release(); HW.step(20);
    assert.ok(HW.player().ty <= at('fort', 0, 10)[1], 'through the door to the fort');
    noErrors(HW);
});

test('the nursery: dropped in without a way home, the hole in the playpen floor lets you out (and the toy is lost down it)', () => {
    const HW = game(['bedroll']);
    enter(HW, 'nursery', 18, 5);
    const p = HW.player();
    go(HW, 'nursery', 4, 5); HW.hold('down'); until(HW, () => p.ty === at('nursery', 0, 7)[1] && p.state === 'normal', 120); HW.release();
    go(HW, 'nursery', 7, 9); HW.hold('right'); until(HW, () => p.state === 'fall', 120); HW.release();
    landed(HW);
    assert.ok(here(HW, 'nursery')[1] <= 5, 'back up top');
});

test('the moonwalk: lay the Bedroll by the gate, push the block onto the far plate, Homeward, and through before it goes back (key C)', () => {
    const HW = game(['bedroll']);
    enter(HW, 'moonwalk', 1, 5);
    const p = HW.player(), g = thing(HW, 'mwGate');
    go(HW, 'moonwalk', 2, 4); lay(HW);
    go(HW, 'moonwalk', 15, 9); HW.push('right', 1);
    assert.ok(g.open, 'the gate is open while the block sits on the plate');
    homeward(HW); landed(HW);
    go(HW, 'moonwalk', 2, 2);
    assert.ok(g.keep, 'through, and it stays open');
    go(HW, 'moonwalk', 2, 2); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.keys('slumber'), 1, 'key C');
    noErrors(HW);
});

test('the moonwalk: walking back from the plate, the gate shuts before you get there', () => {
    const HW = game(['bedroll']);
    enter(HW, 'moonwalk', 1, 5);
    const g = thing(HW, 'mwGate');
    go(HW, 'moonwalk', 15, 9); HW.push('right', 1);
    HW.walkTo(...at('moonwalk', 2, 2));
    assert.ok(!g.keep && here(HW, 'moonwalk')[1] > 3, 'too slow on foot');
});

test('pillow fort: lay the Bedroll on the plate; wake a Snoreling; it shuffles after you, then goes to bed on the Bedroll and holds the plate (key D)', () => {
    const HW = game(['bedroll']);
    HW.G.cheats.god = true;
    enter(HW, 'fort', 9, 9);
    const s = thing(HW, 'pfSnore2');
    go(HW, 'fort', 16, 8); lay(HW);
    for (let i = 0; i < 6 && s.mode !== 'chase'; i++) { go(HW, 'fort', 15, 3); go(HW, 'fort', 18, 3); }
    assert.equal(s.mode, 'chase', 'awake');
    go(HW, 'fort', 14, 9);
    assert.ok(until(HW, () => s.mode === 'sleep', 1500), 'back to sleep');
    assert.equal(HW.global('Bedroll').sleeper, s, 'on the Bedroll, on the plate');
    assert.ok(thing(HW, 'pfGate').open, 'the keep is open');
    go(HW, 'fort', 9, 3); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.keys('slumber'), 1, 'key D');
    assert.ok(!HW.Inv.hasPattern('slumber'), 'the Pattern is further on now');
    noErrors(HW);
});

/* the study: the Bedroll sent home on the sleeping barrel, through the grate, and Wren after it by Homeward */
function intoStudy(HW) {
    enter(HW, 'laundry', 1, 5); go(HW, 'laundry', 17, 9);
    const br = thing(HW, 'ldBarrel');
    go(HW, 'laundry', 17, 6); HW.hold('up'); HW.step(16); HW.release(); HW.step(4);
    assert.deepEqual(here(HW, 'laundry'), [17, 5], 'standing on the barrel');
    lay(HW);
    HW.hold('down'); HW.step(16); HW.release(); HW.step(4);
    go(HW, 'laundry', 15, 9); ring(HW);
    assert.ok(until(HW, () => HW.Return.isHome(br), 300), 'the barrel went home through the grate');
    homeward(HW); landed(HW);
    assert.deepEqual(here(HW, 'study'), [2, 5], 'in the study, on the barrel');
}
test("mallow's study (signature): the Bedroll on the sleeping barrel, the Bell, and Homeward through the grate", () => {
    const HW = game(['bedroll']);
    intoStudy(HW);
    HW.hold('right'); HW.step(30); HW.release();
    go(HW, 'study', 10, 6); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Progress.flag('sig:slumber'), "the Maker's mark");
    go(HW, 'study', 16, 3); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Progress.areaFlag('slumber', 'chest:stPatch'), 'the Heart Patch');
    noErrors(HW);
});
/* (the blind solver's findings, round B: rolled up, the Bedroll's straight flight to the doorway is the rule, seen and
   met by play before the Dreaming Door) */
test("mallow's study has no door out: the Bedroll's your place, so roll it up, and your thread runs straight back to the door you came into the laundry by; a drop in the water, and you fly there", () => {
    const HW = game(['bedroll']);
    intoStudy(HW);
    const p = HW.player(), a = HW.G.map;
    assert.ok(a.kind(...at('laundry', 19, 3)).solid && a.kind(...at('study', 0, 3)).solid, 'no door between the study and the laundry');
    /* a fall now only brings her back to the Bedroll */
    go(HW, 'study', 1, 4); HW.hold('down'); until(HW, () => p.state !== 'normal', 120); HW.release(); landed(HW);
    assert.deepEqual(here(HW, 'study'), [2, 5], 'home is the Bedroll, here');
    /* rolled up: home is the doorway she came into the laundry by, her thread drawn straight to it */
    HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(3);
    assert.ok(!HW.Inv.bedroll, 'rolled up');
    assert.deepEqual([p.mark.tx, p.mark.ty], at('laundry', 1, 5), 'her place is the laundry\'s doorway again');
    const G = HW.global('Gfx'), C = HW.global('Cam'), red = HW.global('THREAD').wren, ends = [], l0 = G.line;
    G.line = function (x0, y0, x1, y1, col) { if (col === red) ends.push([x0, y0], [x1, y1]); return l0.apply(this, arguments); };
    try { HW.global('Game').render(); } finally { G.line = l0; }
    const mx = p.mark.tx * 16 + 8 - C.x, my = p.mark.ty * 16 + 9 - C.y;
    assert.ok(ends.some(([x, y]) => Math.abs(x - mx) < 1 && Math.abs(y - my) < 1), 'the red thread drawn back to the doorway');
    go(HW, 'study', 1, 4); HW.hold('down'); until(HW, () => p.state !== 'normal', 120); HW.release();
    assert.equal(p.state === 'fall' || p.state === 'flight', true, 'into the water');
    landed(HW);
    assert.deepEqual(here(HW, 'laundry'), [1, 5], 'flown home, straight, to the doorway');
    noErrors(HW);
});

test('the grate: a float with Wren aboard will not go through', () => {
    const HW = game(['bedroll']);
    enter(HW, 'laundry', 17, 9);
    const br = thing(HW, 'ldBarrel');
    go(HW, 'laundry', 17, 6); HW.hold('up'); HW.step(16); HW.release(); HW.step(4);
    ring(HW); HW.step(200);
    assert.ok(!HW.Return.isHome(br) && HW.player().tx <= at('laundry', 18, 0)[0], 'stuck at the grate with her aboard');
});


/* ---------------- Mother Sloth: three rounds ---------------- */
const sloth = HW => HW.G.map.ents.find(e => e.type === 'mothersloth');
function bossRoom(HW) { HW.Progress.set('slumber_slothAwake'); enter(HW, 'boss', 9, 9); return sloth(HW); }
function caught(HW, max = 900) { const p = HW.player(); assert.ok(until(HW, () => !!p.pinned, max), `caught (at ${here(HW, 'boss')})`); return p.pinned; }
/* fly Homeward from her grip and come down */
function homeFromGrip(HW) { const arm = caught(HW); homeward(HW); until(HW, () => HW.player().state === 'normal', 300); return arm; }
/* she's slumped: knock the nightcap, and the round's line */
function knock(HW, s) { assert.equal(s.state, 'slump', 'she slumps'); go(HW, 'boss', 9, 6); const hp = s.hp; for (let k = 0; k < 6 && s.alive && s.hp === hp; k++) { strike(HW, 'up'); HW.step(6); } HW.step(10); HW.skipTalk(); HW.step(10); }
const pitAt = (HW, x, y) => HW.G.map.kind(...at('boss', x, y)).pit;
/* round 1 played the way it's meant (the Bedroll out past the stars) */
function roundOne(HW, s) {
    go(HW, 'boss', 2, 9); lay(HW);
    for (let k = 0; k < 4 && s.state !== 'slump'; k++) { go(HW, 'boss', 9, 6); homeFromGrip(HW); }
    knock(HW, s);
}
/* round 2: the Bedroll by the boards, out over them and back in, then let her catch you */
function roundTwo(HW, s) {
    go(HW, 'boss', 5, 8); lay(HW);
    stepPath(HW, 'boss', [[5, 9], [6, 9], [7, 9], [8, 9], [8, 8], [8, 7]]);
    assert.equal(homeFromGrip(HW).state, 'snapped', 'round 2: the first arm snaps');
    HW.step(45);
    stepPath(HW, 'boss', [[5, 9], [6, 9], [7, 9], [8, 9], [9, 9], [10, 9], [11, 9], [12, 9], [13, 9], [13, 8], [12, 8], [12, 7]]);
    assert.equal(homeFromGrip(HW).state, 'snapped', 'round 2: the second arm snaps');
    knock(HW, s);
}
/* round 3: caught in line with a bedpost, face it and hook it */
function hookOut(HW, x, y) {
    const p = HW.player();
    go(HW, 'boss', x, y); const arm = caught(HW, 300);
    HW.hold('down'); HW.step(2); HW.release();
    HW.Inv.equipped = 'hook'; HW.press('tool', 1);
    assert.ok(until(HW, () => arm.state === 'snapped' || p.state === 'fall', 120), 'reeled out');
    until(HW, () => p.state === 'normal', 400);
    return arm;
}

test('mother sloth, round 1: the Bedroll out past the stars; caught, fly Homeward: the arm stretches too far and snaps; both, she slumps; knocked, the floor past the stars drops away (the Bedroll with it), all but the old boards along the bottom', () => {
    const HW = game(['bedroll']);
    HW.G.cheats.god = true;
    const s = bossRoom(HW);
    go(HW, 'boss', 2, 9); lay(HW);
    for (let k = 0; k < 4 && s.state !== 'slump'; k++) { go(HW, 'boss', 9, 6); assert.equal(homeFromGrip(HW).state, 'snapped', 'the arm snapped'); }
    assert.equal(s.state, 'slump');
    knock(HW, s);
    assert.equal(s.hp, 2); assert.equal(s.phase, 2); assert.equal(s.state, 'fight', 'up again');
    for (const [x, y] of [[1, 3], [2, 7], [4, 8], [2, 9], [15, 9], [16, 7], [17, 2]]) assert.ok(pitAt(HW, x, y), `${x},${y} gone`);
    for (const x of [5, 7, 9, 11, 13]) assert.equal(HW.G.map.kindName(...at('boss', x, 9)), 'floor', `the old board at ${x},9`);
    for (const [x, y] of [[3, 7], [5, 8], [2, 5], [9, 8], [3, 3]]) assert.ok(!pitAt(HW, x, y), `${x},${y} (inside the stars) still floor`);
    assert.equal(HW.Inv.bedroll, null, 'the Bedroll went with the floor, back into the pack');
    noErrors(HW);
});

test('mother sloth, round 2: Homeward to a Bedroll in reach does nothing now; out over the old boards and back in first, and the flight home goes back over them: snap; the boards mend when you land; knocked, the boards drop and the old bedposts stand', () => {
    const HW = game(['bedroll']);
    HW.G.cheats.god = true;
    const s = bossRoom(HW), p = HW.player();
    roundOne(HW, s);
    assert.equal(s.phase, 2);
    /* the Bedroll anywhere left is inside her reach: flying home from her grip, she holds on */
    go(HW, 'boss', 5, 8); lay(HW);
    stepPath(HW, 'boss', [[6, 8]]);
    const arm = homeFromGrip(HW);
    assert.notEqual(arm.state, 'snapped', 'in reach: no snap');
    assert.ok(p.pinned === arm || until(HW, () => p.pinned === arm, 60), 'still in her hand at home');
    /* (let her tuck Wren in and let go; then home to the Bedroll by the boards) */
    until(HW, () => !p.pinned, 600);
    homeward(HW); landed(HW);
    assert.deepEqual(here(HW, 'boss'), [5, 8], 'back by the boards');
    stepPath(HW, 'boss', [[5, 9], [6, 9], [7, 9], [8, 9], [8, 8], [8, 7]]);
    assert.ok(pitAt(HW, 6, 9), 'the boards gave way behind');
    assert.equal(homeFromGrip(HW).state, 'snapped', 'flown back over the boards that are gone: snapped');
    assert.ok(!pitAt(HW, 6, 9), 'landed: the boards are back');
    HW.step(45);
    stepPath(HW, 'boss', [[5, 9], [6, 9], [7, 9], [8, 9], [9, 9], [10, 9], [11, 9], [12, 9], [13, 9], [13, 8], [12, 8], [12, 7]]);
    assert.equal(homeFromGrip(HW).state, 'snapped');
    knock(HW, s);
    assert.equal(s.phase, 3);
    for (const x of [5, 9, 13]) assert.ok(pitAt(HW, x, 9), `the board at ${x},9 is gone`);
    const posts = Array.from(HW.G.map.ents.filter(e => e.slothBit && e.eyelet), e => (e.tx - 20) + ',' + e.ty).sort();
    assert.deepEqual(posts, ['1,7', '3,9', '15,9', '17,7'].sort(), 'the bedposts');
    noErrors(HW);
});

test('mother sloth, round 3: Homeward does nothing; caught, turn about in her grip and hook a bedpost: the reel drags you out of her hand (snap) and you drop into the dark, home unhurt; both: the last knock, and the floor comes back', () => {
    const HW = game(['bedroll']);
    HW.G.cheats.god = true;
    const s = bossRoom(HW), p = HW.player();
    roundOne(HW, s); roundTwo(HW, s);
    assert.equal(s.phase, 3);
    go(HW, 'boss', 9, 6); lay(HW);
    go(HW, 'boss', 9, 5);
    const arm0 = homeFromGrip(HW);
    assert.notEqual(arm0.state, 'snapped', 'Homeward: no snap');
    until(HW, () => !p.pinned, 600); HW.step(130);
    /* caught facing the bed, she turns to the post below (she can turn about in a grip) and hooks it */
    go(HW, 'boss', 3, 4); go(HW, 'boss', 3, 5); HW.face('up');
    const arm = caught(HW, 300);
    HW.G.cheats.god = false; const hp = HW.Inv.hp;
    HW.hold('down'); HW.step(2); HW.release();
    assert.equal(p.dir, HW.global('DOWN'), 'turned about in her grip');
    HW.Inv.equipped = 'hook'; HW.press('tool', 1);
    assert.ok(until(HW, () => arm.state === 'snapped', 120), 'the hook dragged her out of the grip: snapped');
    until(HW, () => p.state === 'normal', 400);
    assert.deepEqual(here(HW, 'boss'), [9, 6], 'and down into the dark, and home onto the Bedroll');
    assert.equal(HW.Inv.hp, hp, 'a fall onto your own Bedroll costs nothing');
    HW.G.cheats.god = true;
    assert.equal(hookOut(HW, 15, 5).state, 'snapped', 'the other arm, the other post');
    knock(HW, s); HW.step(80); HW.skipTalk(); HW.step(30);
    assert.ok(!s.alive, 'Mother Sloth unravels');
    for (const [x, y] of [[2, 9], [9, 9], [1, 3], [3, 9]]) assert.ok(!pitAt(HW, x, y), `${x},${y} floor again`);
    assert.equal(HW.G.map.ents.filter(e => e.slothBit).length, 0, 'the bedposts gone');
    assert.ok(HW.ents('hoop').length, 'the Knot');
    noErrors(HW);
});

test('mother sloth: the whole fight, played straight through, is quick', () => {
    const HW = game(['bedroll']);
    HW.G.cheats.god = true;
    const s = bossRoom(HW), t0 = HW.G.t;
    roundOne(HW, s); roundTwo(HW, s);
    go(HW, 'boss', 9, 6); lay(HW);
    hookOut(HW, 3, 5); hookOut(HW, 15, 5);
    knock(HW, s);
    assert.ok(!s.alive);
    const secs = (HW.G.t - t0) / 60;
    console.log(`# Mother Sloth, three rounds: ${secs.toFixed(0)} s of game time`);
    assert.ok(secs < 90, `${secs.toFixed(0)} s`);
});

test('mother sloth: with the Bedroll inside her reach, flying home from her grip does nothing; she reels you in and tucks you in', () => {
    const HW = game(['bedroll']);
    const p = HW.player(), s = bossRoom(HW);
    go(HW, 'boss', 9, 7); lay(HW);
    const hp = HW.Inv.hp;
    go(HW, 'boss', 7, 5);
    const arm = caught(HW);
    homeward(HW); until(HW, () => p.state === 'normal', 300);
    assert.notEqual(arm.state, 'snapped', 'not far enough to snap');
    assert.ok(until(HW, () => HW.Inv.hp < hp, 900), 'tucked in');
});

test('mother sloth: fly home to a Bedroll outside her room and the fight waits (the doors open, her arms grow back, the floor comes back); back in, the round starts again on its own floor', () => {
    const HW = game(['bedroll']);
    HW.G.cheats.god = true;
    HW.Progress.set('slumber_slothAwake');
    HW.Progress.setAreaFlag('slumber', 'door:laBig'); HW.Progress.set('slumber_matron');
    enter(HW, 'landing', 9, 2);
    lay(HW);
    go(HW, 'landing', 9, 1); go(HW, 'boss', 9, 8);
    const s = sloth(HW), p = HW.player();
    assert.equal(s.state, 'fight');
    /* (round 2, as if the first had gone: the Bedroll still out in the Landing) */
    s.hp = 2; s.setArena(2);
    go(HW, 'boss', 9, 6);
    const arm = caught(HW);
    homeward(HW); until(HW, () => p.state === 'normal', 300); HW.step(10);
    assert.equal(here(HW, 'landing')[1], 2, 'home in the landing');
    assert.equal(s.state, 'sleep', 'the fight waits');
    assert.ok(s.arms.every(a => a.state === 'rest'), 'the arm she lost on the way out grows back: no getting round her by the door');
    assert.ok(!pitAt(HW, 2, 9) && !pitAt(HW, 9, 9), 'the floor is back while she waits');
    go(HW, 'landing', 9, 1); go(HW, 'boss', 9, 8); HW.step(5);
    assert.equal(s.state, 'fight'); assert.equal(s.phase, 2, 'still round 2');
    assert.ok(pitAt(HW, 2, 9) && HW.G.map.kindName(...at('boss', 9, 9)) === 'floor', 'and its floor: the boards along the bottom, and nothing past the stars');
    noErrors(HW);
});

test('mother sloth: an arm snaps only out past the stars (caught by one arm, flown across to the far side of the other, it holds)', () => {
    const HW = game(['bedroll']);
    HW.G.cheats.god = true;
    const s = bossRoom(HW), p = HW.player();
    go(HW, 'boss', 15, 4); lay(HW);
    /* (over on the far side in a moment, where only the left arm reaches) */
    const [tx, ty] = at('boss', 3, 4); p.x = tx * 16 + 8; p.y = ty * 16 + 10; HW.step(1);
    const arm = caught(HW);
    assert.equal(arm.side, -1, 'the left arm has her');
    assert.ok(Math.hypot(at('boss', 15, 4)[0] * 16 + 8 - arm.sx, at('boss', 15, 4)[1] * 16 + 4 - arm.sy) > 5.75 * 16, '(the Bedroll is further from her left shoulder than that arm stretches)');
    homeward(HW); until(HW, () => p.state === 'normal', 300);
    assert.notEqual(arm.state, 'snapped', 'flown right across the room, but never past the stars: it holds');
    noErrors(HW);
});

/* her blows, each with its tell, each dodged (or not) */
const slothBlows = (HW, s) => HW.G.map.ents.filter(e => e.kind === 'hazard' && e.owner === s);
test("mother sloth's reach: her hand rises and spreads its fingers first; back out of her reach then and it gives up (stay, and it catches)", () => {
    for (const dodge of [true, false]) {
        const HW = game(['bedroll']);
        const s = bossRoom(HW), p = HW.player();
        go(HW, 'boss', 9, 7);
        assert.ok(until(HW, () => s.arms.some(a => a.state === 'wind'), 300), 'a hand rises');
        const arm = s.arms.find(a => a.state === 'wind');
        assert.ok(arm.tell >= 24, 'a fair tell');
        if (dodge) { HW.hold('down'); HW.step(8); HW.release(); go(HW, 'boss', 9, 9); HW.hold('down'); HW.step(30); HW.release(); }
        HW.step(160);
        if (dodge) assert.ok(!p.pinned, 'out of reach: not caught');
        else assert.ok(p.pinned === arm, 'caught');
        noErrors(HW);
    }
});
test("mother sloth's pillows: out of reach she lifts them over her head first (one, then two, then three); a step aside as they come", () => {
    for (const dodge of [true, false]) {
        const HW = game(['bedroll']);
        const s = bossRoom(HW), p = HW.player();
        s.hp = 2; s.state = 'fight';                 // (round 2: two at once)
        p.x = at('boss', 1, 9)[0] * 16 + 8; p.y = at('boss', 1, 9)[1] * 16 + 10; HW.step(1);
        assert.ok(until(HW, () => s.lift > 0, 400), 'pillows lifted');
        assert.ok(until(HW, () => s.pillows.length === 2, 60), 'two thrown');
        const hp = HW.Inv.hp;
        if (dodge) { HW.hold('right'); HW.step(50); HW.release(); }
        else HW.step(50);
        HW.step(30);
        if (dodge) assert.equal(HW.Inv.hp, hp, 'past her');
        else assert.ok(HW.Inv.hp < hp, 'a pillow in the face');
        noErrors(HW);
    }
});
test("mother sloth counts sheep (round 3): a row of the floor glows, then the flock bounds along it; off the row and they pass (on it, a full heart)", () => {
    for (const dodge of [true, false]) {
        const HW = game(['bedroll']);
        HW.G.cheats.god = true;
        const s = bossRoom(HW), p = HW.player();
        roundOne(HW, s); roundTwo(HW, s);
        HW.G.cheats.god = false;
        assert.equal(s.phase, 3);
        go(HW, 'boss', 9, 7);
        s.arms.forEach(a => { a.cool = 9999; if (a.state !== 'snapped') { a.state = 'rest'; a.hx = a.sx; a.hy = a.sy + 6; } }); p.pinned = null;   /* (her arms kept to themselves meanwhile) */
        s.sheepT = 9999;
        assert.ok(until(HW, () => slothBlows(HW, s).some(h => h.flock), 60), 'a row glows');
        const h = slothBlows(HW, s).find(q => q.flock);
        assert.ok(h.tiles.some(([x, y]) => y === p.ty), "it's Wren's row");
        if (p.pinned) { HW.Inv.equipped = 'hook'; }
        const hp = HW.Inv.hp;
        if (dodge) { HW.hold('down'); HW.step(18); HW.release(); assert.ok(!h.tiles.some(([x, y]) => y === p.ty), 'off the row'); }
        assert.ok(until(HW, () => h.removed, 200), 'the flock went by');
        if (dodge) assert.equal(HW.Inv.hp, hp, 'they passed her by');
        else assert.equal(HW.Inv.hp, hp - 2, 'bowled over');
        noErrors(HW);
    }
});
test("Matron Hush: now and then she stops dead and puffs up (her \"!\"), then comes on twice as fast along the footsteps; keep walking and stay ahead", () => {
    for (const dodge of [true, false]) {
        const HW = game();
        enter(HW, 'landing', 9, 9);
        const m = thing(HW, 'matron'), p = HW.player();
        HW.hold('up'); HW.step(10); HW.release(); HW.skipTalk(); HW.step(5);
        go(HW, 'landing', 13, 9); go(HW, 'landing', 16, 9); go(HW, 'landing', 16, 8);
        /* (she's caught up to two steps behind) */
        const [bx, by] = at('landing', 14, 9); m.x = bx * 16 + 8; m.y = by * 16 + 10; m.i = m.nearest(p.trace); m.lt = 239;
        assert.ok(until(HW, () => m.brace > 0, 10), 'she puffs up');
        const hp = HW.Inv.hp;
        if (dodge) { for (const [x, y] of [[17, 8], [17, 2], [12, 2]]) go(HW, 'landing', x, y); }
        else HW.step(120);
        if (dodge) assert.equal(HW.Inv.hp, hp, 'kept ahead of her');
        else assert.ok(HW.Inv.hp <= hp - 2, 'caught: a full heart');
        noErrors(HW);
    }
});

/* ---------------- the Milk Kitchen and the Dreaming Door (the way to the Pattern) ---------------- */
/* across on the bedsprings (one way: west) to the far bank */
function springAcross(HW) {
    const p = HW.player();
    go(HW, 'kitchen', 15, 4);
    HW.hold('left'); until(HW, () => p.state === 'normal' && p.tx <= at('kitchen', 4, 0)[0], 400); HW.release(); HW.step(5);
    assert.deepEqual(here(HW, 'kitchen'), [2, 4], 'sprung across the gap');
}

test('the milk kitchen: the Bedroll this side; across on the springs; the jug, Homeward with it; smashed, its pieces fly home the way it came, back over the gap, and ring the bell (the gate)', () => {
    const HW = game(['bedroll']);
    enter(HW, 'kitchen', 15, 9);
    const p = HW.player(), jug = thing(HW, 'mkJug');
    go(HW, 'kitchen', 15, 6); lay(HW);
    springAcross(HW);
    go(HW, 'kitchen', 2, 3); HW.face('up'); HW.press('act', 1); HW.step(10);
    assert.equal(p.carry, jug, 'the jug');
    homeward(HW); landed(HW);
    assert.deepEqual(here(HW, 'kitchen'), [15, 6], 'home, jug and all');
    assert.ok(jug.ret.trace.some(([x, y]) => x === at('kitchen', 9, 0)[0] && y === at('kitchen', 0, 4)[1]), 'its trace runs back over the gap, under the bell');
    HW.face('down'); HW.press('act', 1);
    assert.ok(until(HW, () => thing(HW, 'mkBell').on, 400), 'its pieces rang the bell on their way home');
    assert.ok(until(HW, () => thing(HW, 'mkGate').open, 60), 'the gate');
    until(HW, () => HW.Return.isHome(jug) && !jug.shattered, 400);
    assert.deepEqual([jug.tx, jug.ty], at('kitchen', 2, 2), 'the jug back on its shelf');
    go(HW, 'kitchen', 18, 5); HW.hold('right'); HW.step(40); HW.release(); HW.step(30);
    assert.equal(HW.G.map.roomAt(p.tx, p.ty).name, 'The Dreaming Door', 'on to the Dreaming Door');
    noErrors(HW);
});

test('the milk kitchen: the springs only go one way; the jug thrown from the far side, or smashed there, never reaches the bell; a fall drops it home', () => {
    const HW = game(['bedroll']);
    enter(HW, 'kitchen', 15, 9);
    const p = HW.player(), jug = thing(HW, 'mkJug'), bell = thing(HW, 'mkBell');
    go(HW, 'kitchen', 15, 6); lay(HW);
    springAcross(HW);
    assert.ok(!HW.walkTo(...at('kitchen', 15, 6)), 'no way back on foot');
    /* thrown east from the edge: it falls short of the bell, and its pieces fly back west */
    go(HW, 'kitchen', 2, 3); HW.face('up'); HW.press('act', 1); HW.step(10);
    go(HW, 'kitchen', 4, 4); HW.face('right'); HW.press('act', 1);
    until(HW, () => HW.Return.isHome(jug) && !jug.shattered && !jug.pendingHome, 500); HW.step(5);
    assert.ok(!bell.on, 'thrown from the far side: short of the bell');
    /* smashed against the wall on the far side */
    go(HW, 'kitchen', 2, 3); HW.face('up'); HW.press('act', 1); HW.step(10);
    go(HW, 'kitchen', 1, 6); HW.face('left'); HW.press('act', 1);
    until(HW, () => HW.Return.isHome(jug) && !jug.shattered && !jug.pendingHome, 500); HW.step(5);
    assert.ok(!bell.on, 'smashed on the far side: its way home never crossed the gap');
    /* carried, and a fall: it drops and goes home; Wren goes to the Bedroll */
    go(HW, 'kitchen', 2, 3); HW.face('up'); HW.press('act', 1); HW.step(10);
    go(HW, 'kitchen', 4, 6); HW.hold('right'); until(HW, () => p.state === 'fall', 120); HW.release(); landed(HW);
    assert.ok(!p.carry, 'dropped'); assert.deepEqual(here(HW, 'kitchen'), [15, 6], 'home at the Bedroll');
    until(HW, () => HW.Return.isHome(jug), 300);
    assert.ok(!bell.on && !thing(HW, 'mkGate').open);
    noErrors(HW);
});

/* out along the old boards to the island at the far end (they give way behind) */
function dreamWalk(HW) {
    const path = [[5, 8]]; for (let x = 6; x <= 17; x++) path.push([x, 8]); for (let y = 7; y >= 2; y--) path.push([17, y]); for (let x = 16; x >= 7; x--) path.push([x, 2]); path.push([6, 2]);
    go(HW, 'dream', 4, 8); stepPath(HW, 'dream', path);
}

test('the dreaming door: out along the old boards; flown home plain, the good dream lights and then the bad one: shut; ring the Bell between the two and you snap home before the bad one: the door; the Pattern', () => {
    const HW = game(['bedroll']);
    enter(HW, 'dream', 1, 5);
    const p = HW.player(), good = thing(HW, 'dgGood'), bad = thing(HW, 'dgBad'), door = thing(HW, 'dgDoor');
    go(HW, 'dream', 2, 4); lay(HW);
    dreamWalk(HW);
    assert.ok(HW.G.map.kind(...at('dream', 10, 8)).pit, 'the boards gone behind');
    homeward(HW); landed(HW); HW.step(2);
    assert.ok(good.lit > 0 && bad.lit > 0, 'flown home through both');
    assert.ok(!door.open, 'a bad dream: shut');
    until(HW, () => !good.lit && !bad.lit, 400);
    dreamWalk(HW);
    homeward(HW);
    assert.ok(until(HW, () => good.lit > 0, 200), 'the good dream lit');
    assert.equal(p.state, 'flight', 'still flying');
    HW.Inv.equipped = 'bell'; HW.press('tool', 1);
    landed(HW); HW.step(3);
    assert.deepEqual(here(HW, 'dream'), [2, 4], 'snapped straight home');
    assert.ok(good.lit > 0 && !bad.lit, 'the good one lit, the bad one dark');
    assert.ok(door.open, 'the door');
    assert.ok(HW.Progress.flag('s18'), 'the Bell rung in flight');
    go(HW, 'dream', 2, 2); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.hasPattern('slumber'), 'the Pattern');
    noErrors(HW);
});

test('the dreaming door: rung too soon, nothing is lit; the boards mend under you when you land', () => {
    const HW = game(['bedroll']);
    enter(HW, 'dream', 1, 5);
    const p = HW.player(), good = thing(HW, 'dgGood'), bad = thing(HW, 'dgBad');
    go(HW, 'dream', 2, 4); lay(HW);
    dreamWalk(HW);
    HW.Inv.equipped = 'bell';
    HW.hold('down'); until(HW, () => p.state === 'flight', 200); HW.release();
    HW.press('tool', 1); landed(HW);
    assert.ok(!good.lit && !bad.lit, 'snapped home before either');
    assert.ok(!HW.G.map.kind(...at('dream', 10, 8)).pit, 'the boards back');
    assert.ok(!thing(HW, 'dgDoor').open);
    noErrors(HW);
});

test("the way on: key C opens the Nursery's lock, the Fort's key D the Moonwalk's north door; the Milk Kitchen, the Dreaming Door", () => {
    const HW = game(['bedroll']);
    enter(HW, 'moonwalk', 15, 2);
    const p = HW.player();
    HW.hold('up'); HW.step(30); HW.release();
    assert.equal(HW.G.map.roomAt(p.tx, p.ty).name, 'The Moonwalk', 'locked');
    HW.Inv.keyCount.slumber = 1;
    go(HW, 'moonwalk', 15, 1); HW.hold('up'); HW.step(50); HW.release(); HW.step(30);
    assert.equal(HW.G.map.roomAt(p.tx, p.ty).name, 'The Milk Kitchen');
    noErrors(HW);
});

test('an old game that found the Pattern in Pillow Fort: the Fort holds key D now, and the Dreaming Door buttons', () => {
    const HW = game(['bedroll']);
    HW.Progress.setAreaFlag('slumber', 'chest:pfPattern'); HW.Inv.patterns.push('slumber');
    enter(HW, 'fort', 9, 3);
    assert.ok(!thing(HW, 'pfKey').opened, 'a chest to open');
    enter(HW, 'dream', 1, 5);
    assert.equal(thing(HW, 'dgPattern').item, 'b20', 'buttons, not a second Pattern');
    noErrors(HW);
});
