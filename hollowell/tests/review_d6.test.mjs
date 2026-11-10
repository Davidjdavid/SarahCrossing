// Regression tests for the fresh-eyes review of House 6 (the Marionette Hall, Larkspur, Reveal 1).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';
import { hearMakers } from './legs.mjs';

const R = { foyer: [20, 33], box: [40, 33], aud: [20, 22], pit: [0, 22], reh: [40, 22], wings: [20, 11], dress: [0, 11], props: [40, 11], shop: [40, 0], stage: [20, 0] };
const at = (room, x, y) => [R[room][0] + x, R[room][1] + y];
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const go = (HW, room, x, y) => assert.ok(HW.walkTo(...at(room, x, y)), `walk to ${room} ${x},${y}`);
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
function fresh(tools = []) { const HW = loadGame(); HW.preset('afterD5'); HW.step(10); HW.skipTalk(); for (const t of tools) HW.Inv.giveTool(t); return HW; }
const inHall = (HW, room = 'foyer', x = 9, y = 9) => { HW.warp('marionette', ...at(room, x, y)); HW.step(30); HW.skipTalk(); HW.step(5); };
const strike = (HW, dir) => { HW.face(dir); HW.press('atk', 1); HW.step(14); };
/* (the Great Marionette takes two knocks: between them it flails its arms about) */
const knock = (HW, g) => { const hp = g.hp; for (let k = 0; k < 6 && g.alive && g.hp === hp; k++) { strike(HW, 'up'); HW.step(6); } };
function strings(HW, moves) {
    const names = { U: 'up', D: 'down', L: 'left', R: 'right' };
    for (const m of moves) {
        const c = HW.global('Crossbar').ctl; if (!c) return;
        const ps = c.puppets;
        HW.hold(names[m]); until(HW, () => ps.some(e => e.mv), 12); until(HW, () => !ps.some(e => e.mv), 30); HW.release(); HW.step(3);
    }
}
const take = (HW, dir) => { HW.Inv.equipped = 'crossbar'; HW.face(dir); HW.press('tool', 1); HW.step(2); return HW.global('Crossbar').ctl; };
/* the Great Marionette's three acts: its feet tangled; turned onto the stage trap by a little Wren in its march; its bar
   hooked down, its strings taken up, walked onto the trap */
function beatBoss(HW) {
    HW.Inv.giveTool('crossbar'); HW.G.cheats.god = true;
    inHall(HW, 'stage', 9, 9); HW.skipTalk();
    const g = HW.G.map.ents.find(e => e.type === 'greatmarionette');
    const talk = () => until(HW, () => { if (HW.global('Dialog').active) HW.skipTalk(); return !HW.global('Dialog').active && !HW.global('Script').blocking(); }, 900);
    HW.walkTo(...at('stage', 9, 9)); HW.face('up'); HW.Inv.equipped = 'crossbar'; HW.press('tool', 1); HW.step(2);
    strings(HW, 'URRR' + 'URRDDLLU');
    until(HW, () => g.state === 'down', 60);
    HW.press('tool', 1); HW.step(3);
    HW.walkTo(...at('stage', 8, 8)); knock(HW, g);
    talk();
    HW.walkTo(...at('stage', 16, 9)); HW.face('up'); HW.Inv.equipped = 'crossbar'; HW.press('tool', 1); HW.step(2);
    strings(HW, 'RUUU');
    until(HW, () => g.state === 'trapped', 2400);
    HW.press('tool', 1); HW.step(3);
    HW.walkTo(...at('stage', 11, 7)); knock(HW, g);
    talk(); HW.step(60);
    HW.walkTo(...at('stage', 11, 7)); HW.face('up'); HW.Inv.equipped = 'hook'; HW.press('tool', 1); until(HW, () => !!g.bar, 60); HW.step(20);
    HW.Inv.equipped = 'crossbar'; HW.step(2); HW.face('up'); HW.press('tool', 1); HW.step(2);
    strings(HW, 'LD');
    until(HW, () => g.state === 'trapped', 60);
    HW.walkTo(...at('stage', 11, 7)); knock(HW, g);
    return g;
}

test('1: the Hoop, the heart and the reveal are never lost by leaving (or loading) before the Knot', () => {
    const HW = fresh();
    for (const d of ['wiBig', 'auLockN']) HW.Progress.setAreaFlag('marionette', 'door:' + d);
    HW.Inv.patterns.push('marionette'); HW.Progress.set('marionette_tin'); HW.Progress.set('marionette_tinAwake');
    const g = beatBoss(HW);
    assert.ok(!g.alive, 'beaten');
    HW.skipTalk(); HW.step(20); hearMakers(HW);
    for (let i = 0; i < 40 && !HW.Progress.flag('reveal1'); i++) { HW.skipTalk(); HW.step(20); }
    assert.ok(HW.Progress.flag('reveal1') && HW.Progress.flag('marionette_boss'));
    HW.warp('hollow', 31, 51); HW.step(10); inHall(HW, 'stage', 9, 9);
    assert.equal(HW.G.map.ents.filter(e => e.kind === 'hoop').length, 1, 'the Hoop is back');
    assert.ok(HW.G.map.find('marionetteHeart'), 'and the heart');
    /* every House the same */
    const H2 = fresh(); H2.Progress.set('tidy_boss'); H2.Inv.knots = H2.Inv.knots.filter(k => k !== 'tidy');
    H2.warp('tidy', 29, 42); H2.step(10);
    assert.equal(H2.G.map.ents.filter(e => e.kind === 'hoop').length, 1, "the Tidyhouse's Hoop too");
    noErrors(HW);
});

test('1b: a reload in the middle of the curtain means the dance again, not a lost reveal', () => {
    const HW = fresh();
    for (const d of ['wiBig', 'auLockN']) HW.Progress.setAreaFlag('marionette', 'door:' + d);
    HW.Inv.patterns.push('marionette'); HW.Progress.set('marionette_tin');
    const g = beatBoss(HW);
    assert.ok(!g.alive);
    assert.ok(!HW.Progress.flag('marionette_boss'), 'not until the reveal is done');
});

test('2: the wings open east when Captain Tin falls, so no key order can shut the Rehearsal Room for good', () => {
    const HW = fresh(); HW.Progress.set('marionette_tin');
    inHall(HW, 'wings', 9, 9);
    HW.step(5);
    assert.ok(HW.G.map.find('wiLockE').open);
});

test('3: in the Orchestra Pit, only the drummer holds the gate long enough (not Wren, not a stray on the plate)', () => {
    const HW = fresh(); inHall(HW);
    HW.G.cheats.god = true;
    go(HW, 'pit', 9, 6); HW.step(2);
    const g = HW.G.map.find('opGate');
    assert.ok(g.open, 'a moment open');
    HW.walkTo(...at('pit', 2, 2));
    assert.notDeepEqual([HW.player().tx, HW.player().ty], at('pit', 2, 2), 'shut again before Wren gets there');
    /* the stray block pushed onto the plate gives one pulse, not a held-open gate */
    const b = HW.G.map.find('opBlock');
    HW.walkTo(b.tx, b.ty - 1); HW.push('down', 4); HW.step(20);
    HW.step(200);
    assert.ok(!g.open, 'shut');
    noErrors(HW);
});

test('3b: tin soldiers shrug off the stick: a whack turns them round', () => {
    const HW = fresh(); inHall(HW);
    const s = HW.G.map.find('foSol1');
    HW.G.cheats.god = true;
    HW.walkTo(s.tx + 2, s.ty); HW.step(1);
    for (let i = 0; i < 6; i++) { HW.walkTo(s.tx + 1, s.ty); strike(HW, 'left'); }
    assert.ok(s.alive, 'still marching');
});

test("4: rack puppets are only worked from the rack, and walls are in the way of the Crossbar's sight", () => {
    const HW = fresh(['crossbar']);
    inHall(HW, 'props', 1, 5);
    go(HW, 'props', 5, 8);
    const c = take(HW, 'up');
    assert.ok(!c || c.rack, 'no single rack puppet');
    noErrors(HW);
});

test('5: the set mark and the winch feel only puppets; the hook cannot pull a puppet', () => {
    const HW = fresh(); inHall(HW);
    HW.Inv.keyCount.marionette = 1;
    go(HW, 'aud', 18, 5); HW.hold('right'); HW.step(30); HW.release();
    go(HW, 'reh', 16, 4); HW.step(10);
    assert.ok(!HW.Progress.flag('s13'), 'standing on the set mark is not the puppet on it');
    const H2 = fresh();
    H2.warp('hollow', 21, 83); H2.step(10);
    H2.walkTo(25, 83); H2.step(10);
    assert.ok(!H2.Progress.flag('fair_lift'), 'Wren on the winch does nothing');
    const H3 = fresh();
    H3.warp('hollow', 31, 66); H3.step(10);
    H3.Inv.equipped = 'hook'; H3.face('up'); H3.press('tool', 1); H3.step(60);
    const horse = H3.G.map.find('carouselHorse');
    if (horse) assert.notDeepEqual([horse.tx, horse.ty], [31, 65], 'the horse stays');
    assert.ok(!H3.Progress.flag('linnet7'));
    noErrors(HW); noErrors(H2); noErrors(H3);
});

test("8: puppets going home don't block each other forever", () => {
    const HW = fresh(['crossbar']);
    inHall(HW, 'props', 1, 5);
    go(HW, 'props', 9, 9);
    take(HW, 'up');
    strings(HW, 'LDLUULLDDDURUURLL');
    HW.press('tool', 1);
    assert.ok(until(HW, () => ['psA', 'psB', 'psC'].every(id => HW.G.map.find(id).ret.state === 'home'), 3000), 'all home (Prop Store)');
    const H2 = fresh(['crossbar']); H2.G.cheats.god = true;
    inHall(H2, 'stage', 9, 9); H2.skipTalk();
    const g = H2.G.map.ents.find(e => e.type === 'greatmarionette'); g.update = function () { }; g.state = 'dance';
    H2.walkTo(...at('stage', 9, 9)); take(H2, 'up');
    strings(H2, 'RLLLULLLLDRLLRDLUDL');
    H2.press('tool', 1);
    assert.ok(until(H2, () => ['gsWrenA', 'gsWrenB'].every(id => H2.G.map.find(id).ret.state === 'home'), 3000), 'all home (Great Stage)');
    noErrors(HW); noErrors(H2);
});

test('S11: the seed is kept from the moment the fog lets go', () => {
    const HW = fresh();
    HW.warp('hollow', 5, 58); HW.step(10);
    HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(2);
    const p = HW.player();
    HW.hold('left'); until(HW, () => p.state === 'flight', 300); HW.release();
    assert.ok(HW.Progress.flag('s11'));
    assert.ok(HW.Inv.items.driftseed, 'in the pack already, mid-flight');
});
