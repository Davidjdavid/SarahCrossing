// The Marionette Hall (House 6): every room's solution, played through the real game code.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const R = { foyer: [20, 33], box: [40, 33], aud: [20, 22], pit: [0, 22], reh: [40, 22], wings: [20, 11], dress: [0, 11], props: [40, 11], shop: [40, 0], stage: [20, 0] };
const at = (room, x, y) => [R[room][0] + x, R[room][1] + y];
function game(tools = []) {
    const HW = loadGame();
    HW.newGame('Test', { area: 'marionette', x: 29, y: 42, noAutosave: true });
    HW.Inv.items.staff = 1;
    for (const t of ['gloves', 'hook', 'paddle', 'bell', 'bedroll', ...tools]) HW.Inv.giveTool(t);
    HW.Inv.maxHp = HW.Inv.hp = 40;
    HW.step(5);
    return HW;
}
const enter = (HW, room, x, y) => { HW.warp('marionette', ...at(room, x, y)); HW.step(30); HW.skipTalk(); HW.step(5); };
const go = (HW, room, x, y) => assert.ok(HW.walkTo(...at(room, x, y)), `walk to ${room} ${x},${y} (at ${HW.player().tx - R[room][0]},${HW.player().ty - R[room][1]})`);
const thing = (HW, id) => HW.G.map.find(id);
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const strike = (HW, dir) => { HW.face(dir); HW.press('atk', 1); HW.step(14); };
const here = (HW, room) => { const p = HW.player(); return [p.tx - R[room][0], p.ty - R[room][1]]; };
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
/* walk the puppets on the strings Wren holds: one step per letter */
function strings(HW, moves) {
    const names = { U: 'up', D: 'down', L: 'left', R: 'right' };
    for (const m of moves) {
        const ps = HW.global('Crossbar').ctl.puppets;
        HW.hold(names[m]); until(HW, () => ps.some(e => e.mv), 12); until(HW, () => !ps.some(e => e.mv), 30); HW.release(); HW.step(3);
    }
}

test('the foyer: the east wall is a painted flat; knock it down; the Plan in the box office', () => {
    const HW = game();
    go(HW, 'foyer', 18, 5); strike(HW, 'right');
    assert.ok(thing(HW, 'foFlat').down, 'cardboard');
    go(HW, 'box', 10, 4); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.plans.includes('marionette'), 'the Plan');
    noErrors(HW);
});

test('the orchestra pit: the drummer goes round the edge; put the stray block in his way and his new beat crosses the plate (key A)', () => {
    const HW = game();
    HW.G.cheats.god = true;
    enter(HW, 'pit', 18, 5);
    const g = thing(HW, 'opGate');
    HW.step(1500);
    assert.ok(!g.open, 'round the edge he never touches the plate');
    go(HW, 'pit', 10, 1); HW.push('down', 2);
    assert.deepEqual([thing(HW, 'opBlock').tx, thing(HW, 'opBlock').ty], at('pit', 10, 4), 'in his beat');
    go(HW, 'pit', 3, 6);
    assert.ok(until(HW, () => g.open, 2500), 'he marched over the plate');
    go(HW, 'pit', 2, 2); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.keys('marionette'), 1, 'key A');
    noErrors(HW);
});

test('the rehearsal room: lay the Bedroll, drop through the trapdoor for the key, Homeward back up (key B)', () => {
    const HW = game();
    enter(HW, 'reh', 1, 5);
    const p = HW.player();
    go(HW, 'reh', 5, 4); HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(2);
    go(HW, 'reh', 5, 5); HW.hold('down'); until(HW, () => p.ty === at('reh', 0, 7)[1] && p.state === 'normal', 120); HW.release();
    HW.face('down'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.keys('marionette'), 1, 'key B');
    HW.Inv.equipped = 'bedroll'; HW.hold('tool'); HW.step(24); HW.release(); until(HW, () => p.state === 'normal', 300);
    assert.deepEqual(here(HW, 'reh'), [5, 4], 'home, up top');
    noErrors(HW);
});

test('the wings: Captain Tin marches between the flats; knock one as he comes and he marches on into the trap (the Crossbar)', () => {
    const HW = game();
    HW.G.cheats.god = true;
    enter(HW, 'wings', 9, 9);
    HW.hold('up'); HW.step(10); HW.release(); HW.skipTalk(); HW.step(5);
    const c = thing(HW, 'tin');
    assert.notEqual(c.state, 'sleep', 'he marches');
    for (let round = 0; round < 3 && c.alive; round++) {
        go(HW, 'wings', 4, 5);
        assert.ok(until(HW, () => c.state === 'march' && c.march === 1 && c.x < at('wings', 8, 0)[0] * 16, 1200), 'coming left');
        strike(HW, 'down');
        assert.ok(until(HW, () => c.state === 'dazed', 200), `round ${round + 1}: into the trap`);
        go(HW, 'wings', 2, 5); strike(HW, 'down');
        HW.step(330);
    }
    assert.ok(!c.alive, 'Captain Tin unravels');
    HW.step(60); HW.skipTalk(); HW.step(10);
    go(HW, 'wings', 9, 4); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.has('crossbar'), 'the Crossbar');
    noErrors(HW);
});

test('the dressing rooms: take the puppet, walk it through the little doors and over the nails onto the plate (key C)', () => {
    const HW = game(['crossbar']);
    enter(HW, 'dress', 18, 5);
    go(HW, 'dress', 2, 9); HW.Inv.equipped = 'crossbar'; HW.face('up'); HW.press('tool', 1); HW.step(2);
    strings(HW, 'UUUUURR' + 'RRRRRRRRRRRRR');
    const pp = thing(HW, 'drPuppet');
    assert.deepEqual([pp.tx, pp.ty], at('dress', 17, 2), 'on the plate');
    HW.step(5);
    HW.press('tool', 1); HW.step(5);
    go(HW, 'dress', 9, 7); HW.face('right'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.keys('marionette'), 1, 'key C');
    noErrors(HW);
});

test('the prop store: three puppets on one rack; the walls hold some back; all three on the plates (the Pattern)', () => {
    const HW = game(['crossbar']);
    enter(HW, 'props', 1, 5);
    go(HW, 'props', 9, 9); HW.Inv.equipped = 'crossbar'; HW.face('up'); HW.press('tool', 1); HW.step(2);
    strings(HW, 'DRDRDRRDRURUR');
    HW.step(5);
    assert.ok(!thing(HW, 'psPattern').hidden, 'all three plates down: the chest');
    HW.press('tool', 1); HW.step(5);
    go(HW, 'props', 16, 9); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.hasPattern('marionette'), 'the Pattern');
    noErrors(HW);
});

test("jory's workshop (signature): a puppet through the little door in the wall opens the big one", () => {
    const HW = game(['crossbar']);
    enter(HW, 'props', 1, 5);
    go(HW, 'props', 2, 5); HW.Inv.equipped = 'crossbar'; HW.face('up'); HW.press('tool', 1); HW.step(2);
    strings(HW, 'UUUUUU');
    HW.step(5);
    assert.ok(thing(HW, 'psWorkshop').open, 'the door opened');
    HW.press('tool', 1); HW.step(80);
    assert.ok(thing(HW, 'psWorkshop').open, 'and stays open');
    go(HW, 'props', 17, 1); go(HW, 'shop', 10, 6); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Progress.flag('sig:marionette'), "the Maker's mark");
    noErrors(HW);
});

test('S13: the little wooden Wren walked onto the mark on the stage set', () => {
    const HW = game(['crossbar']);
    enter(HW, 'reh', 15, 8);
    go(HW, 'reh', 15, 8); HW.Inv.equipped = 'crossbar'; HW.face('down'); HW.press('tool', 1); HW.step(2);
    strings(HW, 'UUURRR');
    HW.step(10);
    assert.ok(HW.Progress.flag('s13'), 'a bow');
    HW.press('tool', 1); HW.step(5);
    go(HW, 'reh', 17, 7); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.patches >= 1, 'a Heart Patch');
});

test('the great stage: line your two little Wrens up against its feet, walk them round, the strings tangle, it falls; three knocks; the curtain (Reveal 1)', () => {
    const HW = game(['crossbar']);
    HW.G.cheats.god = true;
    HW.Progress.set('marionette_gmAwake');
    enter(HW, 'stage', 9, 9);
    const g = HW.G.map.ents.find(e => e.type === 'greatmarionette');
    HW.Inv.equipped = 'crossbar';
    for (let round = 0; round < 3 && g.alive; round++) {
        go(HW, 'stage', 9, 9); HW.face('up'); HW.press('tool', 1); HW.step(2);
        assert.equal(HW.player().pinned, 'crossbar', 'holding the rack');
        strings(HW, 'URRR' + 'URRDDLLU');
        assert.ok(until(HW, () => g.state === 'down', 60), `round ${round + 1}: both strings tangled, it falls`);
        HW.press('tool', 1); HW.step(3);
        go(HW, 'stage', 8, 8); strike(HW, 'up');
        HW.step(10);
        if (g.alive) until(HW, () => thing(HW, 'gsWrenA').ret.state === 'home' && thing(HW, 'gsWrenB').ret.state === 'home', 600);
    }
    assert.ok(!g.alive, 'down for good');
    for (let i = 0; i < 40 && !HW.Progress.flag('reveal1'); i++) { HW.skipTalk(); HW.step(20); }
    assert.ok(HW.Progress.flag('reveal1'), 'Reveal 1');
    HW.skipTalk(); HW.step(20);
    const hoop = HW.ents('hoop')[0]; assert.ok(hoop, 'the hoop');
    HW.walkTo(hoop.tx - 1, hoop.ty); HW.face('right'); HW.press('act', 1); HW.skipTalk(0); HW.step(300); HW.skipTalk(); HW.step(10); HW.skipTalk();
    assert.ok(HW.Progress.flag('d6') && HW.Inv.knots.includes('marionette'), 'the Dancing Knot');
    noErrors(HW);
});
