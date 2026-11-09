// The Slumberhouse (House 5): every room's solution, played through the real game code.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const R = { porch: [20, 33], ward: [20, 22], linen: [0, 22], laundry: [40, 22], study: [60, 22], loft: [40, 33], landing: [20, 11], nursery: [0, 11], moonwalk: [40, 11], fort: [0, 0], boss: [20, 0] };
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

test('the drying loft: the hook bounces off the sleeper on the pillar; ring it home; hook over; fall home (key B)', () => {
    const HW = game();
    enter(HW, 'loft', 9, 1);
    HW.G.cheats.god = true;
    const p = HW.player(), bo = thing(HW, 'dlBoulder');
    go(HW, 'loft', 3, 1); HW.face('left'); HW.press('act', 1); HW.skipTalk();
    go(HW, 'loft', 13, 3); HW.Inv.equipped = 'hook'; HW.face('down'); HW.press('tool', 1); HW.step(60);
    assert.deepEqual(here(HW, 'loft'), [13, 3], 'the hook comes back off the sleeping boulder');
    go(HW, 'loft', 16, 2); ring(HW);
    assert.ok(until(HW, () => HW.Return.isHome(bo), 200), 'the boulder rolled home over the drop');
    assert.ok(thing(HW, 'dlSnore1').mode === 'chase' || thing(HW, 'dlSnore2').mode === 'chase', 'and the ring woke the Snorelings');
    go(HW, 'loft', 13, 3); HW.Inv.equipped = 'hook'; HW.face('down'); HW.press('tool', 1); HW.step(80);
    assert.deepEqual(here(HW, 'loft'), [13, 8], 'reeled over to the island');
    go(HW, 'loft', 14, 8); HW.face('right'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.keys('slumber'), 1, 'key B');
    HW.hold('left'); until(HW, () => p.state === 'fall', 200); HW.release();
    landed(HW);
    assert.deepEqual(here(HW, 'loft'), [3, 1], 'home by the bed');
    noErrors(HW);
});

test('the landing: Matron Hush follows your footsteps over the boards, which give way under her; three knocks while she is dazed (the Bedroll)', () => {
    const HW = game();
    HW.G.cheats.god = true;
    enter(HW, 'landing', 9, 9);
    const m = thing(HW, 'matron');
    HW.hold('up'); HW.step(10); HW.release(); HW.skipTalk(); HW.step(5);
    assert.notEqual(m.state, 'sleep', 'she is up');
    assert.ok(!thing(HW, 'laBedroll') || thing(HW, 'laBedroll').hidden, 'no prize yet');
    for (let round = 0; round < 3; round++) {
        go(HW, 'landing', 9, 8); HW.step(round ? 0 : 30);
        stepPath(HW, 'landing', [[9, 7], [9, 6], [9, 5], [9, 4], [9, 3], [9, 2], [9, 1]]);
        assert.ok(until(HW, () => m.state === 'dazed' || !m.alive, 900), `round ${round + 1}: she fell through and flew home, dazed`);
        /* round the edge of the boards (not over them) to her bed */
        go(HW, 'landing', 2, 2); go(HW, 'landing', 4, 7); go(HW, 'landing', 4, 9); strike(HW, 'left');
    }
    assert.ok(!m.alive, 'Matron Hush unravels');
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

test('pillow fort: lay the Bedroll on the plate; wake a Snoreling; it shuffles after you, then goes to bed on the Bedroll and holds the plate (the Pattern)', () => {
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
    assert.ok(HW.Inv.hasPattern('slumber'), 'the Pattern');
    noErrors(HW);
});

test("mallow's study (signature): the Bedroll on the sleeping barrel, the Bell, and Homeward through the grate", () => {
    const HW = game(['bedroll']);
    enter(HW, 'laundry', 17, 9);
    const p = HW.player(), br = thing(HW, 'ldBarrel');
    go(HW, 'laundry', 17, 6); HW.hold('up'); HW.step(16); HW.release(); HW.step(4);
    assert.deepEqual(here(HW, 'laundry'), [17, 5], 'standing on the barrel');
    lay(HW);
    HW.hold('down'); HW.step(16); HW.release(); HW.step(4);
    go(HW, 'laundry', 15, 9); ring(HW);
    assert.ok(until(HW, () => HW.Return.isHome(br), 300), 'the barrel went home through the grate');
    homeward(HW); landed(HW);
    assert.deepEqual(here(HW, 'study'), [2, 5], 'in the study, on the barrel');
    HW.hold('right'); HW.step(30); HW.release();
    go(HW, 'study', 2, 2); HW.face('up'); HW.press('act', 1); HW.step(10);
    go(HW, 'study', 10, 6); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Progress.flag('sig:slumber'), "the Maker's mark");
    go(HW, 'study', 1, 3); go(HW, 'laundry', 17, 3);
    assert.ok(thing(HW, 'ldStudyDoor').open, 'the way out');
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

/* get caught by one of Mother Sloth's arms, then fly home from its grip */
function caughtThenHome(HW, s) {
    const p = HW.player();
    assert.ok(HW.walkTo(...at('boss', 9, 6)) || true);
    assert.ok(until(HW, () => !!p.pinned, 900), 'caught');
    const arm = p.pinned;
    homeward(HW);
    until(HW, () => p.state === 'normal', 300);
    return arm;
}

test("mother sloth: her arms reel you to her bed; from her grip, Homeward to a Bedroll out of reach snaps the arm; both snapped, she slumps; knock her nightcap (x3)", () => {
    const HW = game(['bedroll']);
    HW.G.cheats.god = true;
    HW.Progress.set('slumber_slothAwake');
    enter(HW, 'boss', 9, 9);
    const s = HW.G.map.ents.find(e => e.type === 'mothersloth');
    go(HW, 'boss', 2, 9); lay(HW);
    for (let round = 0; round < 3 && s.alive; round++) {
        for (let k = 0; k < 4 && s.state !== 'slump'; k++) {
            const arm = caughtThenHome(HW, s);
            assert.equal(arm.state, 'snapped', `round ${round + 1}: the arm snapped`);
        }
        assert.equal(s.state, 'slump', `round ${round + 1}: both arms gone, she slumps`);
        go(HW, 'boss', 9, 6); strike(HW, 'up');
        HW.step(10);
    }
    assert.ok(!s.alive, 'Mother Sloth unravels');
    HW.step(100); HW.skipTalk(); HW.step(20);
    noErrors(HW);
});

test('mother sloth: with the Bedroll inside her reach, flying home from her grip does nothing; she reels you in and tucks you in', () => {
    const HW = game(['bedroll']);
    HW.Progress.set('slumber_slothAwake');
    enter(HW, 'boss', 9, 9);
    const p = HW.player(), s = HW.G.map.ents.find(e => e.type === 'mothersloth');
    go(HW, 'boss', 9, 7); lay(HW);
    const hp = HW.Inv.hp;
    go(HW, 'boss', 7, 5);
    assert.ok(until(HW, () => !!p.pinned, 900), 'caught');
    const arm = p.pinned;
    homeward(HW); until(HW, () => p.state === 'normal', 300);
    assert.notEqual(arm.state, 'snapped', 'not far enough to snap');
    assert.ok(until(HW, () => HW.Inv.hp < hp, 900), 'tucked in');
});

test('mother sloth: fly home to a Bedroll outside her room and the fight waits; the doors open', () => {
    const HW = game(['bedroll']);
    HW.Progress.set('slumber_slothAwake');
    HW.Progress.setAreaFlag('slumber', 'door:laBig'); HW.Progress.set('slumber_matron');
    enter(HW, 'landing', 9, 2);
    lay(HW);
    go(HW, 'landing', 9, 1); go(HW, 'boss', 9, 9);
    const p = HW.player(), s = HW.G.map.ents.find(e => e.type === 'mothersloth');
    go(HW, 'boss', 9, 6);
    assert.ok(until(HW, () => !!p.pinned, 900), 'caught');
    homeward(HW); until(HW, () => p.state === 'normal', 300);
    HW.step(10);
    assert.equal(here(HW, 'landing')[1], 2, 'home in the landing');
    assert.equal(s.state, 'sleep', 'the fight waits');
    go(HW, 'landing', 9, 1); go(HW, 'boss', 9, 9);
    noErrors(HW);
});
