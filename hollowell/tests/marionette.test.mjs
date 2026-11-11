// The Marionette Hall (House 6): every room's solution, played through the real game code.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';
import { hearMakers } from './legs.mjs';

const R = { foyer: [20, 33], box: [40, 33], aud: [20, 22], pit: [0, 22], reh: [40, 22], wings: [20, 11], dress: [0, 11], props: [40, 11], shop: [40, 0], stage: [20, 0], fly: [60, 11], traps: [60, 22] };
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
/* (it takes two knocks: between them it flails its arms about) */
const knock = (HW, g) => { const hp = g.hp; for (let k = 0; k < 6 && g.alive && g.hp === hp; k++) { strike(HW, 'up'); HW.step(6); } };
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

test('the wings: Captain Tin marches between the flats; knock one as he comes and he marches on into the trap; two knocks (the Crossbar)', () => {
    const HW = game();
    HW.G.cheats.god = true;
    enter(HW, 'wings', 9, 9);
    HW.hold('up'); HW.step(10); HW.release(); HW.skipTalk(); HW.step(5);
    const c = thing(HW, 'tin');
    assert.notEqual(c.state, 'sleep', 'he marches');
    let rounds = 0;
    for (let round = 0; round < 3 && c.alive; round++) {
        rounds++;
        go(HW, 'wings', 4, 5);
        assert.ok(until(HW, () => c.state === 'march' && c.march === 1 && c.x < at('wings', 8, 0)[0] * 16, 1200), 'coming left');
        strike(HW, 'down');
        assert.ok(until(HW, () => c.state === 'dazed', 200), `round ${round + 1}: into the trap`);
        go(HW, 'wings', 2, 5); strike(HW, 'down');
        HW.step(330);
    }
    assert.ok(!c.alive, 'Captain Tin unravels');
    assert.equal(rounds, 2, 'two knocks see him off');
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

test('the prop store: three puppets on one rack; the shelves stop the ones in front; all three on the plates open the way east', () => {
    const HW = game(['crossbar']);
    enter(HW, 'props', 1, 5);
    go(HW, 'props', 9, 9); HW.Inv.equipped = 'crossbar'; HW.face('up'); HW.press('tool', 1); HW.step(2);
    strings(HW, 'RRRRRRRR');
    assert.deepEqual(['psA', 'psB', 'psC'].map(id => thing(HW, id).tx - 40), [7, 9, 13], 'each stopped by its shelf (or the wall)');
    strings(HW, 'DDDD');
    HW.step(5);
    assert.ok(thing(HW, 'psGateE').open, 'all three plates down: the gate east');
    HW.press('tool', 1); HW.step(300);
    assert.ok(thing(HW, 'psGateE').open, 'and it stays open');
    assert.ok(HW.walkTo(...at('fly', 1, 5)), 'into the fly tower');
    noErrors(HW);
});

test('the fly tower: walked round the catwalk, or let walk home, the puppet lights the plates one at a time; rung home with the Bell it lights all three at once', () => {
    const HW = game(['crossbar']);
    enter(HW, 'fly', 1, 5);
    const gate = thing(HW, 'faGate'), pup = thing(HW, 'faPuppet');
    const out = () => { go(HW, 'fly', 2, 5); HW.Inv.equipped = 'crossbar'; HW.face('right'); HW.press('tool', 1); HW.step(2); strings(HW, 'UURRRRDDDDLLLLU'); };
    out();
    assert.deepEqual(here(HW, 'fly'), [2, 5], 'Wren stood still');
    assert.deepEqual([pup.tx - 60, pup.ty - 11], [5, 6], 'right round the catwalk, one short of its stand');
    assert.ok(!gate.open, 'walked over them one at a time: shut');
    HW.press('tool', 1);
    assert.ok(until(HW, () => HW.Return.isHome(pup), 900), 'let go, it walks home');
    assert.ok(!gate.open, 'walking home over them at its own pace: still shut');
    out();
    HW.Inv.equipped = 'bell'; HW.step(2); HW.press('tool', 1);
    assert.ok(until(HW, () => gate.open, 120), 'rung home along its trace: all three at once, the fly door opens');
    HW.step(200);
    assert.ok(gate.open, 'for good');
    assert.ok(HW.walkTo(...at('traps', 14, 1)), 'down to the trap room');
    noErrors(HW);
});

test("the fly tower's rule: a ring sends it home along its trace, so a plate the trace has skipped stays up", () => {
    const HW = game(['crossbar']);
    enter(HW, 'fly', 1, 5);
    const gate = thing(HW, 'faGate'), pup = thing(HW, 'faPuppet');
    go(HW, 'fly', 2, 5); HW.Inv.equipped = 'crossbar'; HW.face('right'); HW.press('tool', 1); HW.step(2);
    /* out to the far plate one way and back the same way: the loop's erased, the trace runs over one plate */
    strings(HW, 'UURRRRDD' + 'UULLLLD');
    assert.deepEqual([pup.tx - 60, pup.ty - 11], [5, 4], 'back near its stand');
    HW.Inv.equipped = 'bell'; HW.step(2); HW.press('tool', 1); HW.step(120);
    assert.ok(HW.Return.isHome(pup), 'home');
    assert.ok(!gate.open, 'only what the trace ran over lit up: shut');
    noErrors(HW);
});

test("the trap room: step the understudies off their stands, then hook the empty stands, island and far side, before they're home (the Pattern)", () => {
    const HW = game(['crossbar']);
    enter(HW, 'traps', 14, 1);
    const p = HW.player(), hookDone = () => p.state === 'normal' && !HW.global('TOOLS').hook.h;
    /* the hook just bounces off a puppet on its stand */
    go(HW, 'traps', 9, 2); HW.Inv.equipped = 'hook'; HW.face('down'); HW.press('tool', 1); until(HW, hookDone, 120);
    assert.deepEqual(here(HW, 'traps'), [9, 2], 'only strings move a puppet');
    HW.Inv.equipped = 'crossbar'; HW.face('right'); HW.press('tool', 1); HW.step(2);
    strings(HW, 'LLL');
    assert.deepEqual([thing(HW, 'trP1').tx - 60, thing(HW, 'trP2').tx - 60], [8, 7], 'both off their stands');
    HW.Inv.equipped = 'hook'; HW.step(2); HW.face('down'); HW.press('tool', 1); until(HW, hookDone, 120);
    assert.deepEqual(here(HW, 'traps'), [9, 5], 'reeled over the traps onto the island stand');
    go(HW, 'traps', 10, 5); HW.face('down'); HW.press('tool', 1); until(HW, hookDone, 120);
    assert.deepEqual(here(HW, 'traps'), [10, 8], 'and on to the far one');
    go(HW, 'traps', 14, 8); HW.face('down'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.hasPattern('marionette'), 'the Pattern');
    HW.step(5);
    assert.ok(thing(HW, 'rhGateE').open, 'the way west, into the rehearsal room, unbolted');
    assert.ok(HW.walkTo(...at('reh', 1, 5)), 'and through it');
    noErrors(HW);
});

/* (the blind solver's findings, round B: a person needs time to let go, change hands and aim; and a thing coming home
   never lands on Wren as she's reeled onto its stand) */
test('the trap room at a person\'s pace: let go, a few seconds to change to the Hookline and aim, and both stands are still empty to catch', () => {
    const HW = game(['crossbar']);
    enter(HW, 'traps', 14, 1);
    const p = HW.player(), hookDone = () => p.state === 'normal' && !HW.global('TOOLS').hook.h;
    go(HW, 'traps', 9, 2); HW.Inv.equipped = 'crossbar'; HW.face('right'); HW.press('tool', 1); HW.step(2);
    strings(HW, 'LLL');
    HW.press('tool', 1); HW.step(2);
    assert.ok(!HW.global('Crossbar').ctl, 'let go');
    /* two and a half seconds to think, change hands, face the island (an understudy used to wait two) */
    HW.step(150); HW.Inv.equipped = 'hook'; HW.face('down'); HW.press('tool', 1); until(HW, hookDone, 120);
    assert.deepEqual(here(HW, 'traps'), [9, 5], 'the island stand was still empty');
    HW.step(60); go(HW, 'traps', 10, 5); HW.step(40); HW.face('down'); HW.press('tool', 1); until(HW, hookDone, 120);
    assert.deepEqual(here(HW, 'traps'), [10, 8], 'and so was the far one');
    go(HW, 'traps', 14, 8); HW.face('down'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.hasPattern('marionette'), 'the Pattern');
    noErrors(HW);
});

test('the trap room: an understudy starting home as Wren is reeled onto its stand waits behind her (whatever the timing, never on her tile)', () => {
    for (let left = 0; left <= 40; left += 2) {
        const HW = game(['crossbar']);
        enter(HW, 'traps', 14, 1);
        const a = HW.G.map, p = HW.player(), u = thing(HW, 'trP2'), hookDone = () => p.state === 'normal' && !HW.global('TOOLS').hook.h;
        /* Wren on the island (put there); the far understudy a step off its stand with `left` frames of patience to go */
        [p.x, p.y] = [at('traps', 10, 5)[0] * 16 + 8, at('traps', 10, 5)[1] * 16 + 10]; HW.step(2);
        a.unplace(u, u.tx, u.ty); [u.tx, u.ty] = at('traps', 9, 8); u.x = u.tx * 16; u.y = u.ty * 16; a.place(u, u.tx, u.ty);
        u.ret.trace = [at('traps', 10, 8), at('traps', 9, 8)]; u.ret.state = 'away'; u.ret.timer = left;
        HW.face('down'); HW.Inv.equipped = 'hook'; HW.press('tool', 1); until(HW, hookDone, 120); HW.step(20);
        const [wx, wy] = here(HW, 'traps');
        assert.ok(!(u.tx === p.tx && u.ty === p.ty), `${left}: never on one tile (Wren ${wx},${wy})`);
        if (wy === 8) {
            assert.ok(HW.walkTo(...at('traps', 12, 8)), `${left}: she walks off the stand`);
            assert.ok(until(HW, () => HW.Return.isHome(u), 200), `${left}: and it goes home behind her`);
        } else assert.ok(HW.Return.isHome(u) || u.ret.state === 'returning', `${left}: home first, so the hook bounced off it`);
        noErrors(HW);
    }
});

test('the trap room, stepped the wrong way: the far stand is out of line from the island; a fall home, and try again', () => {
    const HW = game(['crossbar']);
    enter(HW, 'traps', 14, 1);
    const p = HW.player(), hookDone = () => p.state === 'normal' && !HW.global('TOOLS').hook.h;
    go(HW, 'traps', 9, 2); HW.Inv.equipped = 'crossbar'; HW.face('right'); HW.press('tool', 1); HW.step(2);
    strings(HW, 'R');
    HW.Inv.equipped = 'hook'; HW.step(2); HW.face('down'); HW.press('tool', 1); until(HW, hookDone, 120);
    assert.deepEqual(here(HW, 'traps'), [9, 5], 'on the island');
    assert.ok(!HW.walkTo(...at('traps', 10, 5)), 'the first understudy is in the way');
    HW.face('down'); HW.press('tool', 1); until(HW, hookDone, 120);
    assert.deepEqual(here(HW, 'traps'), [9, 5], 'nothing to catch on straight below');
    HW.hold('left'); until(HW, () => p.state === 'normal' && here(HW, 'traps')[1] < 3, 400); HW.release();
    assert.ok(here(HW, 'traps')[1] < 3, 'into a trap, and home to the doorway');
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

/* the Great Marionette's three acts, played straight */
function actOne(HW, g) {
    go(HW, 'stage', 9, 9); HW.face('up'); HW.Inv.equipped = 'crossbar'; HW.press('tool', 1); HW.step(2);
    assert.equal(HW.player().pinned, 'crossbar', 'holding the rack');
    strings(HW, 'URRR' + 'URRDDLLU');
    assert.ok(until(HW, () => g.state === 'down', 60), 'act I: both strings tangled, it falls');
    HW.press('tool', 1); HW.step(3);
    go(HW, 'stage', 8, 8); knock(HW, g);
}
const talkThrough = HW => until(HW, () => { if (HW.global('Dialog').active) HW.skipTalk(); return !HW.global('Dialog').active && !HW.global('Script').blocking(); }, 900);
function actTwo(HW, g) {
    talkThrough(HW);
    assert.equal(g.state, 'march', 'act II: it marches');
    const c = thing(HW, 'gsWrenC'); assert.ok(c, 'a third little Wren, on its own string');
    go(HW, 'stage', 16, 9); HW.Inv.equipped = 'crossbar'; HW.face('up'); HW.press('tool', 1); HW.step(2);
    strings(HW, 'RUUU');
    assert.deepEqual([c.tx - 20, c.ty], [17, 5], 'in its way, a foot to the right of where the trap lines up with its left foot');
    assert.ok(until(HW, () => g.state === 'trapped', 2400), 'it turns at the little Wren, down onto the trap, and in');
    assert.deepEqual([g.inTrap[0] - 20, g.inTrap[1]], [11, 6], 'down the stage trap');
    HW.press('tool', 1); HW.step(3);
    go(HW, 'stage', 11, 7); knock(HW, g);
}
function actThree(HW, g) {
    talkThrough(HW);
    assert.equal(g.state, 'dance', 'act III: back on its marks');
    assert.ok(!thing(HW, 'gsWrenC'), 'the third little Wren hauled back up');
    HW.step(60);
    go(HW, 'stage', 11, 7); HW.face('up'); HW.Inv.equipped = 'hook'; HW.press('tool', 1);
    assert.ok(until(HW, () => !!g.bar, 60), 'the Hookline catches its bar and brings it down');
    HW.step(20);
    HW.Inv.equipped = 'crossbar'; HW.step(2); HW.face('up'); HW.press('tool', 1); HW.step(2);
    assert.ok(HW.global('Crossbar').ctl && HW.global('Crossbar').ctl.giant, 'its strings taken up');
    strings(HW, 'LD');
    assert.ok(until(HW, () => g.state === 'trapped', 60), 'walked onto the trap: down it goes');
    assert.equal(HW.player().pinned, null, 'the strings jerk out of your hands');
    go(HW, 'stage', 11, 7); knock(HW, g);
}

test('the great stage, in three acts: its feet tangled; turned onto the trap; walked onto it on its own strings; the curtain (Reveal 1)', () => {
    const HW = game(['crossbar']);
    HW.G.cheats.god = true;
    HW.Progress.set('marionette_gmAwake');
    enter(HW, 'stage', 9, 9);
    const g = HW.G.map.ents.find(e => e.type === 'greatmarionette');
    actOne(HW, g);
    assert.equal(g.hp, 2, 'one knock');
    actTwo(HW, g);
    assert.equal(g.hp, 1, 'two');
    actThree(HW, g);
    assert.ok(!g.alive, 'down for good');
    /* the curtain, Jory, the Makers lined up on the stage, each heard out in turn; then the end of it */
    HW.skipTalk(); HW.step(20);
    assert.equal(HW.G.map.ents.filter(e => e.r1).length, 6, 'six Makers on the stage');
    assert.ok(!HW.Progress.flag('reveal1'), 'not till they have all been heard');
    hearMakers(HW);
    for (let i = 0; i < 40 && !HW.Progress.flag('reveal1'); i++) { HW.skipTalk(); HW.step(20); }
    assert.ok(HW.Progress.flag('reveal1'), 'Reveal 1');
    HW.skipTalk(); HW.step(20);
    const hoop = HW.ents('hoop')[0]; assert.ok(hoop, 'the hoop');
    HW.walkTo(hoop.tx - 1, hoop.ty); HW.face('right'); HW.press('act', 1); HW.skipTalk(0); HW.step(300); HW.skipTalk(); HW.step(10); HW.skipTalk();
    assert.ok(HW.Progress.flag('d6') && HW.Inv.knots.includes('marionette'), 'the Dancing Knot');
    noErrors(HW);
});

/* its blows, each with its tell, each dodged (or not) */
const gmBlows = (HW, g) => HW.G.map.ents.filter(e => e.kind === 'hazard' && e.owner === g);
test("the Great Marionette's stick (act I): close in front of its feet, its stick hand drawn back and the boards there lit; back off them and it sweeps the air (a full heart if not)", () => {
    for (const dodge of [true, false]) {
        const HW = game(['crossbar']);
        HW.Progress.set('marionette_gmAwake');
        enter(HW, 'stage', 9, 9);
        const g = HW.G.map.ents.find(e => e.type === 'greatmarionette');
        talkThrough(HW);
        go(HW, 'stage', 9, 7); g.sweepCool = 999;
        assert.ok(until(HW, () => g.sweepT > 0, 30), 'its stick drawn back');
        const z = gmBlows(HW, g).find(h => h.dmg === 2);
        assert.ok(z && z.covers(HW.player().x, HW.player().y), 'the boards in front of its feet lit, Wren on them');
        g.bags = []; g.st = 1;                       /* (no sandbags just now) */
        const hp = HW.Inv.hp;
        if (dodge) { HW.hold(['down', 'left']); HW.step(20); HW.release(); assert.ok(!z.covers(HW.player().x, HW.player().y), 'off the lit boards (round the rack)'); }
        assert.ok(until(HW, () => z.removed, 80), 'swept');
        if (dodge) assert.equal(HW.Inv.hp, hp, 'swept the air');
        else assert.equal(HW.Inv.hp, hp - 2, 'swept off her feet');
        noErrors(HW);
    }
});
test("the Great Marionette's sandbags (two at once in act II): their shadows first, where Wren stands and beside her; out from under them", () => {
    for (const dodge of [true, false]) {
        const [HW, g] = atAct(2);
        HW.G.cheats.god = false;
        go(HW, 'stage', 15, 9); g.st = 2 * 260 + 99;
        assert.ok(until(HW, () => g.bags.length === 2, 10), 'two shadows');
        const hp = HW.Inv.hp, p = HW.player(), b0 = g.bags[0];
        if (dodge) { const away = g.bags[1].x > p.x ? 'left' : 'right'; HW.hold('up'); HW.step(14); HW.hold(away); HW.step(24); HW.release(); }
        assert.ok(until(HW, () => g.bags.every(b => b.t >= 60), 80)); HW.step(2);
        if (dodge) assert.equal(HW.Inv.hp, hp, 'out from under them');
        else assert.equal(HW.Inv.hp, hp - 2, 'a sandbag');
        noErrors(HW);
    }
});
test("the Great Marionette's battens (act III): a whole row of the stage lit, then a batten crashes down along it; off the row and it misses", () => {
    for (const dodge of [true, false]) {
        const [HW, g] = atAct(3);
        HW.G.cheats.god = false;
        go(HW, 'stage', 4, 8); g.battenT = 9999; g.bags = []; g.st = 1;
        assert.ok(until(HW, () => gmBlows(HW, g).some(h => h.look), 10), 'a row lit');
        const h = gmBlows(HW, g).find(q => q.look), p = HW.player();
        assert.ok(h.tiles.some(([x, y]) => y === p.ty), "Wren's row");
        const hp = HW.Inv.hp;
        if (dodge) { HW.hold('down'); HW.step(18); HW.release(); assert.ok(!h.tiles.some(([x, y]) => y === p.ty), 'off the row'); }
        assert.ok(until(HW, () => h.removed, 80), 'it came down');
        if (dodge) assert.equal(HW.Inv.hp, hp, 'missed');
        else assert.equal(HW.Inv.hp, hp - 2, 'a batten');
        noErrors(HW);
    }
});
test("Captain Tin's baton: he twirls it overhead, its line lit, and flings it; off the line, and off its thread when it comes home", () => {
    for (const dodge of [true, false]) {
        const HW = game();
        enter(HW, 'wings', 9, 9);
        HW.hold('up'); HW.step(10); HW.release(); HW.skipTalk(); HW.step(5);
        const c = thing(HW, 'tin'), p = HW.player();
        go(HW, 'wings', 9, 3); c.batonT = 999;
        assert.ok(until(HW, () => c.twirl > 0, 30), 'he twirls his baton');
        const aim = c.aim, on = () => aim.some(([x, y]) => x === p.tx && y === p.ty);
        assert.ok(on(), 'Wren on the lit line');
        const hp = HW.Inv.hp;
        if (dodge) { HW.hold('right'); HW.step(22); HW.release(); assert.ok(!on(), 'off it'); }
        const fl = () => HW.G.map.ents.filter(e => e.kind === 'flung' && e.owner === c);
        assert.ok(until(HW, () => fl().length > 0, 60), 'flung');
        assert.ok(until(HW, () => !fl().length, 300), 'home along its thread');
        if (dodge) assert.equal(HW.Inv.hp, hp, 'missed both ways');
        else assert.ok(HW.Inv.hp <= hp - 2, 'struck');
        noErrors(HW);
    }
});

/* each act's rule, on its own */
function atAct(n) {
    const HW = game(['crossbar']);
    HW.G.cheats.god = true;
    HW.Progress.set('marionette_gmAwake');
    enter(HW, 'stage', 9, 9);
    const g = HW.G.map.ents.find(e => e.type === 'greatmarionette');
    if (n >= 2) actOne(HW, g);
    if (n >= 3) actTwo(HW, g);
    if (n >= 2) talkThrough(HW);
    return [HW, g];
}

test('the stage trap holds Wren and a puppet; anything heavy (a sandbag) drops through it, and it shuts again', () => {
    const [HW, g] = atAct(1);
    const t = HW.G.map.find('gsTrap');
    go(HW, 'stage', 11, 6); HW.step(30);
    assert.ok(!t.open && HW.player().state === 'normal', 'Wren stands on it');
    go(HW, 'stage', 11, 7);
    g.bags.push({ x: t.tx * 16 + 8, y: t.ty * 16 + 10, t: 0 });
    assert.ok(until(HW, () => t.open, 80), 'a sandbag drops it open');
    assert.ok(HW.G.map.kind(t.tx, t.ty).pit, 'a hole in the stage');
    assert.ok(until(HW, () => !t.open, 120), 'and it swings shut');
    noErrors(HW);
});

test('act II: it marches, turning right at whatever is in its way (the wall, a puppet)', () => {
    const [HW, g] = atAct(2);
    assert.equal(g.state, 'march');
    /* west along the back first, round at the wall (up is off its stage, so right round), back east */
    const seen = new Set();
    until(HW, () => { seen.add(g.march); return g.feet[1][0] === 38; }, 900);
    assert.ok(seen.has(1) && seen.has(2), 'west, then back east');
    assert.ok(until(HW, () => g.march === 0, 200), 'at the east wall, turned right: south');
    /* a little Wren on its beat along the back: it turns there instead of at the wall */
    const c = thing(HW, 'gsWrenC');
    go(HW, 'stage', 16, 9); HW.Inv.equipped = 'crossbar'; HW.face('up'); HW.press('tool', 1); HW.step(2);
    strings(HW, 'LLLLUUU');
    assert.deepEqual([c.tx - 20, c.ty], [12, 5], 'the little Wren on the back row');
    assert.ok(until(HW, () => g.march === 2 && g.feet[1][0] < 30, 900), 'coming east along the back again');
    assert.ok(until(HW, () => g.march === 0, 400), 'turned right at the little Wren');
    assert.equal(g.feet[1][0] - 20, 11, 'right in front of it');
    assert.ok(until(HW, () => g.state === 'trapped', 120), 'and that turn takes its right foot onto the trap');
    HW.press('tool', 1); HW.step(3);
    noErrors(HW);
});

test('act II: Wren on its beat gets stamped on (it turns at things, not people)', () => {
    const [HW, g] = atAct(2);
    HW.G.cheats.god = false;
    const hp = HW.Inv.hp;
    until(HW, () => g.march === 2, 400);
    go(HW, 'stage', 14, 5);
    assert.ok(until(HW, () => HW.Inv.hp < hp, 600), 'stamped on');
    assert.ok(g.state === 'march', 'and on it goes');
    noErrors(HW);
});

test("act III: slack strings slip off its feet; its strings can't be taken from the boards; hooked down, its bar's hauled back up if not taken; let go, it walks home to its marks", () => {
    const [HW, g] = atAct(3);
    assert.equal(g.state, 'dance');
    /* the rack's two round its feet again: they slip off */
    go(HW, 'stage', 9, 9); HW.face('up'); HW.Inv.equipped = 'crossbar'; HW.press('tool', 1); HW.step(2);
    strings(HW, 'URRR' + 'URRDDLLU');
    HW.step(30);
    assert.ok(g.state === 'dance' && !g.tangled[0] && !g.tangled[1], 'no tangle: it dances on');
    HW.press('tool', 1); HW.step(3);
    until(HW, () => ['gsWrenA', 'gsWrenB'].every(id => HW.Return.isHome(thing(HW, id))), 600);
    /* reaching for its strings from the boards */
    go(HW, 'stage', 11, 7); HW.face('up'); HW.press('tool', 1); HW.step(2);
    assert.equal(HW.player().pinned, null, 'out of reach');
    /* hooked down and left: back up it goes */
    HW.Inv.equipped = 'hook'; HW.press('tool', 1);
    assert.ok(until(HW, () => !!g.bar, 60), 'down');
    assert.ok(until(HW, () => !g.bar, 400), 'and hauled back up');
    /* hooked, taken, walked away from the trap and let go: home it walks, the way it came */
    HW.step(30); HW.press('tool', 1); until(HW, () => !!g.bar, 60); HW.step(20);
    HW.Inv.equipped = 'crossbar'; HW.step(2); HW.face('up'); HW.press('tool', 1); HW.step(2);
    strings(HW, 'LL');
    assert.deepEqual([g.feet[0][0] - 20, g.feet[1][0] - 20], [5, 10], 'walked');
    HW.press('tool', 1);
    assert.ok(until(HW, () => g.feet[0][0] === 27 && !g.mv, 600), 'let go: home to its marks');
    noErrors(HW);
});

test('act III: on its strings it will not step off an edge (the trap open), but onto the trap shut it goes, and down', () => {
    const [HW, g] = atAct(3);
    const t = HW.G.map.find('gsTrap');
    go(HW, 'stage', 11, 7); HW.face('up'); HW.Inv.equipped = 'hook'; HW.press('tool', 1); until(HW, () => !!g.bar, 60); HW.step(20);
    HW.Inv.equipped = 'crossbar'; HW.step(2); HW.face('up'); HW.press('tool', 1); HW.step(2);
    strings(HW, 'L');
    t.drop('bag'); HW.step(2);
    strings(HW, 'D');
    assert.deepEqual([g.feet[0][1], g.feet[1][1]], [5, 5], 'it will not step into the open trap');
    until(HW, () => !t.open, 120);
    strings(HW, 'D');
    assert.ok(until(HW, () => g.state === 'trapped', 60), 'shut, onto it, and down');
    noErrors(HW);
});

test('leaving mid-fight (Homeward to the Bedroll in the wings): back on the stage, it takes up the same act again', () => {
    const HW = game(['crossbar']);
    HW.G.cheats.god = true; HW.Progress.set('marionette_gmAwake');
    HW.Inv.patterns.push('marionette');
    enter(HW, 'wings', 9, 2);
    HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(2);
    HW.hold('up'); until(HW, () => Math.floor(HW.player().ty / 11) === 0 && !HW.Cam.busy, 200); HW.release(); HW.step(20);
    const g = HW.G.map.ents.find(e => e.type === 'greatmarionette');
    actOne(HW, g); talkThrough(HW);
    assert.equal(g.act, 2);
    const away = () => { HW.Inv.equipped = 'bedroll'; HW.hold('tool'); HW.step(24); HW.release(); until(HW, () => HW.player().state === 'normal', 300); HW.step(10); };
    away();
    assert.deepEqual(here(HW, 'wings'), [9, 2], 'home to the Bedroll in the wings');
    assert.equal(g.state, 'sleep', 'out of the room: it waits');
    assert.ok(!thing(HW, 'gsWrenC'), 'no third Wren left on the stage');
    go(HW, 'stage', 9, 9); HW.step(10);
    assert.equal(g.state, 'march', 'back: act II again');
    assert.ok(thing(HW, 'gsWrenC'), 'its third Wren let down again');
    actTwo(HW, g); talkThrough(HW);
    away();
    go(HW, 'stage', 9, 9); HW.step(10);
    assert.equal(g.state, 'dance', 'and act III');
    HW.step(80);
    go(HW, 'stage', 11, 7); HW.face('up'); HW.Inv.equipped = 'hook'; HW.press('tool', 1);
    assert.ok(until(HW, () => !!g.bar, 60), 'its bar low enough to hook again');
    noErrors(HW);
});

test("the trap room's way west is bolted on the far side till the Pattern's found; a game that found the Pattern in the old prop store finds buttons there", () => {
    const HW = game(['crossbar']);
    enter(HW, 'reh', 17, 8);
    assert.ok(!thing(HW, 'rhGateE').open, 'shut from the rehearsal room');
    /* (a game saved with the Pattern from the old prop store: the House is built with it held) */
    HW.Inv.patterns.push('marionette');
    enter(HW, 'reh', 17, 8);
    HW.step(3);
    assert.ok(thing(HW, 'rhGateE').open, 'open once the Pattern is had');
    const b0 = HW.Inv.buttons;
    assert.ok(HW.walkTo(...at('traps', 14, 8)), 'through to the far side');
    HW.face('down'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.buttons, b0 + 20, 'buttons, not a second Pattern');
    assert.equal(HW.Inv.patterns.filter(h => h === 'marionette').length, 1);
    noErrors(HW);
});
