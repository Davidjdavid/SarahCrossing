// The Great Spool's rooms (src/75_greatspool.js, its look src/75b_spool_art.js): the Pull, shown at the Foot; each
// Knot's room solved, and what goes wrong without its turn of thought; the Climb's lanes; the rooms' brakes; nudges.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const R = { top: [20, 0], slumber: [0, 11], climb: [20, 11], mario: [40, 11], mill: [0, 22], hub: [20, 22], belfry: [40, 22], tidy: [0, 33], foot: [20, 33], kiln: [40, 33] };
const HOUSES = ['tidy', 'kiln', 'mill', 'belfry', 'slumber', 'marionette'];
const at = (r, x, y) => [R[r][0] + x, R[r][1] + y];
const loc = (r, e) => [e.tx - R[r][0], e.ty - R[r][1]];
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const go = (HW, r, x, y) => assert.ok(HW.walkTo(...at(r, x, y)), `walk to ${r} ${x},${y} (at ${loc(r, HW.player())})`);
const act = (HW, d) => { HW.face(d); HW.press('act', 1); HW.step(3); HW.skipTalk(); HW.step(5); };
const tool = (HW, t, d) => { if (d) HW.face(d); HW.Inv.equipped = t; HW.press('tool', 1); HW.step(3); HW.skipTalk(); };
const step = (HW, d) => { HW.hold(d); HW.step(16); HW.release(); HW.step(4); };
const paddleTo = (HW, x, y) => { const p = HW.player(); HW.Inv.equipped = 'paddle'; for (let i = 0; i < 3000 && (p.tx !== x || p.ty !== y); i++) { HW.hold(['tool', p.tx < x ? 'right' : p.tx > x ? 'left' : p.ty < y ? 'down' : 'up']); HW.step(1); } HW.release(); HW.step(4); };
/* a puppet on the Crossbar, a tile at a time */
const walkP = (HW, pup, d, k) => { for (let i = 0; i < k; i++) { HW.hold(d); until(HW, () => pup.mv, 20); until(HW, () => !pup.mv, 30); HW.release(); HW.step(1); } };
function game() { const HW = loadGame(); HW.preset('afterDrift'); HW.step(10); HW.skipTalk(); HW.Inv.maxHp = HW.Inv.hp = 36; HW.Inv.stitches = []; return HW; }
function inRoom(HW, r, x, y) { HW.warp('greatspool', ...at(r, x, y)); HW.step(60); HW.skipTalk(); HW.step(5); }
const untied = (HW, h) => HW.Progress.flag('untie:' + h);

test('the foot of the Well: out of its place, a thing is wound north into the drum, not home; it drops back on its place once it\'s clear; a pillar holds it on the plate', () => {
    const HW = game(); inRoom(HW, 'foot', 9, 8);
    assert.ok(HW.Progress.flag('gs_foot_told'), 'the first look, told');
    const c = HW.find('gsFCrate'), gate = HW.find('gsFGate');
    /* one west: when its patience runs out it goes north, not back east to its place */
    go(HW, 'foot', 9, 7); HW.push('left', 1); HW.step(5);
    assert.deepEqual(loc('foot', c), [7, 7]);
    assert.ok(until(HW, () => c.mv && c.ret.state === 'returning', 400), 'wound in');
    assert.deepEqual([c.mv.tx - c.mv.fx, c.mv.ty - c.mv.fy], [0, -1], 'north, toward the drum');
    /* into the face; Wren is standing on its place, so it hangs over it, waiting */
    go(HW, 'foot', 8, 7);
    assert.ok(until(HW, () => c.pendingHome, 600), 'held over its place');
    HW.step(90);
    assert.ok(c.pendingHome, 'still waiting while Wren stands there');
    assert.ok(HW.Progress.flag('wound_first'), 'and the first time, she is told so');
    go(HW, 'foot', 9, 8); HW.step(5);
    assert.ok(!c.pendingHome && c.ret.state === 'home', 'dropped onto its place');
    assert.deepEqual(loc('foot', c), [8, 7]);
    /* three west: it goes north up the plate's column and the pillar stops it there */
    go(HW, 'foot', 9, 7); HW.push('left', 3); HW.step(5);
    go(HW, 'foot', 9, 8);
    assert.ok(until(HW, () => gate.open, 900), 'on the plate: the gate');
    HW.step(600);
    assert.deepEqual(loc('foot', c), [5, 3], 'held there, under the pillar');
    assert.ok(gate.open, 'and the gate with it');
    go(HW, 'foot', 9, 1); go(HW, 'hub', 9, 9);
    assert.ok(HW.Progress.areaFlag('greatspool', 'door:gsFGate'), 'latched once passed');
    noErrors(HW);
});

test('the Airing Cupboard (the Tidyhouse\'s Knot): the block in the slot, held while the mangle is rung awake; it drops onto its place over the block', () => {
    const HW = game(); inRoom(HW, 'tidy', 17, 5);
    const A = HW.find('gsTBlock'), B = HW.find('gsTMangle'), gate = HW.find('gsTGate');
    go(HW, 'tidy', 17, 3); HW.push('left', 2); HW.step(5);
    go(HW, 'tidy', 14, 2); HW.push('down', 4); HW.step(5);
    assert.deepEqual(loc('tidy', A), [14, 7], 'the block on the plate, at the foot of the slot');
    /* stand on the mangle's place (the block can't shift Wren), grip the block and ring with the other hand */
    go(HW, 'tidy', 14, 6); HW.face('down');
    HW.hold('act'); HW.step(5);
    assert.ok(HW.player().grip, 'gripped');
    HW.Inv.equipped = 'bell'; HW.hold(['act', 'tool']); HW.step(2); HW.hold('act'); HW.step(60);
    assert.ok(B.pendingHome, 'the mangle wound into the drum, hanging over its place: Wren is on it');
    assert.deepEqual(loc('tidy', A), [14, 7], 'the block, gripped, not rung out');
    HW.release(); HW.step(2);
    go(HW, 'tidy', 14, 5); HW.step(10);
    assert.ok(!B.pendingHome && B.ret.state === 'home', 'down onto its place');
    HW.step(300);
    assert.deepEqual(loc('tidy', A), [14, 7], 'the block waits under it');
    assert.ok(gate.open, 'the gate');
    go(HW, 'tidy', 3, 2); go(HW, 'tidy', 2, 2); act(HW, 'up');
    assert.ok(untied(HW, 'tidy'), 'untied');
    assert.match(HW.Progress.goal, /1 of 6/);
    noErrors(HW);
});

test('the Airing Cupboard: rung without a grip, the block snaps out and shoves Wren aside; the brake lays the room back as it was', () => {
    const HW = game(); inRoom(HW, 'tidy', 17, 5);
    const A = HW.find('gsTBlock'), B = HW.find('gsTMangle');
    go(HW, 'tidy', 17, 3); HW.push('left', 2); HW.step(5);
    go(HW, 'tidy', 14, 2); HW.push('down', 4); HW.step(5);
    go(HW, 'tidy', 14, 6); tool(HW, 'bell', 'down'); HW.step(300);
    assert.notDeepEqual(loc('tidy', A), [14, 7], 'rung, the block is out of the slot');
    assert.deepEqual(loc('tidy', B), [14, 6], 'and the mangle home on top of the slot');
    assert.ok(!HW.find('gsTGate').open, 'shut');
    go(HW, 'tidy', 17, 4); act(HW, 'right'); HW.step(30);
    assert.deepEqual(loc('tidy', A), [16, 3], 'the block home');
    assert.deepEqual(loc('tidy', B), [9, 3], 'the mangle back where it lay');
    assert.ok(B.sleeper && B.tiedOff, 'asleep again');
    noErrors(HW);
});

test('the Glazing Gallery (the Kiln\'s Knot): the clay understudy wound out over the drop till the post stops it; a pot thrown past the sun breaks on it and its pieces fly north through moon and star', () => {
    const HW = game(); inRoom(HW, 'kiln', 1, 5);
    const pup = HW.find('gsKPuppet');
    const lit = () => ['gsKSun', 'gsKMoon', 'gsKStar'].map(id => HW.find(id).on ? 1 : 0).join('');
    /* without the puppet: the sun, and nothing more */
    go(HW, 'kiln', 2, 7); HW.face('down'); HW.press('act', 1); HW.step(20);
    assert.ok(HW.player().carry, 'the pot');
    go(HW, 'kiln', 4, 4); HW.face('right'); HW.press('act', 1); HW.step(140);
    assert.equal(lit(), '100', 'only the sun');
    assert.ok(!HW.find('gsKGate').open, 'shut');
    /* the puppet to the drop's edge under the post, let go: the Pull winds it out over the drop and it hangs there */
    go(HW, 'kiln', 9, 9); tool(HW, 'crossbar', 'right');
    walkP(HW, pup, 'left', 4); walkP(HW, pup, 'up', 1);
    assert.deepEqual(loc('kiln', pup), [7, 7]);
    HW.press('tool', 1); HW.step(2);
    until(HW, () => pup.ret.state === 'returning', 300); HW.step(80);
    assert.deepEqual(loc('kiln', pup), [7, 4], 'hanging over the drop, under the post');
    go(HW, 'kiln', 2, 7); HW.face('down'); HW.press('act', 1); HW.step(20);
    go(HW, 'kiln', 4, 4); HW.face('right'); HW.press('act', 1); HW.step(140);
    assert.equal(lit(), '111', 'sun, moon, star');
    assert.ok(HW.find('gsKGate').open, 'the gate');
    go(HW, 'kiln', 16, 8); act(HW, 'right');
    assert.ok(untied(HW, 'kiln'), 'untied');
    noErrors(HW);
});

test('the Mill-Leat (the Millrace\'s Knot): a loose raft on the leat is the river\'s till it runs out at the post\'s column; there the Pull takes it north onto the wheel\'s water, and the post holds it', () => {
    const HW = game(); inRoom(HW, 'mill', 18, 5);
    const raft = HW.find('gsMRaft'), wheel = HW.find('gsMWheel'), p = HW.player();
    /* hooked over and left in the pool: wound north, it catches on its own place on the way */
    go(HW, 'mill', 13, 8); tool(HW, 'hook', 'up'); HW.step(60);
    assert.deepEqual(loc('mill', raft), [13, 7], 'hooked over');
    let top = 99; for (let i = 0; i < 600; i++) { HW.step(1); top = Math.min(top, raft.ty - R.mill[1]); }
    assert.deepEqual(loc('mill', raft), [13, 5], 'back on its place');
    assert.equal(top, 5, 'caught there, never past it');
    /* again; aboard, to the head of the leat, and down onto the jetty: the raft goes on without her */
    tool(HW, 'hook', 'up'); HW.step(60);
    step(HW, 'up');
    paddleTo(HW, ...at('mill', 11, 7)); paddleTo(HW, ...at('mill', 11, 6)); paddleTo(HW, ...at('mill', 10, 6));
    HW.hold('down'); until(HW, () => p.ty === at('mill', 0, 8)[1], 150); HW.release(); HW.step(4);
    assert.ok(p.ty === at('mill', 0, 8)[1] && !p.ride, 'ashore');
    assert.ok(until(HW, () => raft.tx === at('mill', 5, 0)[0] && raft.ret.state === 'away' && !raft.mv, 400), 'down the leat to its end, still loose');
    assert.ok(until(HW, () => wheel.on, 400), 'then up onto the wheel\'s water');
    assert.deepEqual(loc('mill', raft), [5, 3], 'under the post');
    HW.step(300);
    assert.ok(wheel.on && HW.find('gsMGate').open, 'the wheel turning, the gate open, and staying so');
    go(HW, 'mill', 3, 8); act(HW, 'left');
    assert.ok(untied(HW, 'mill'), 'untied');
    noErrors(HW);
});

test('the Gale Loft (the Belfry\'s Knot): over the gale on the Hookline; rung from the far end, the boulder goes north onto the iron plate and stops under the old bell, still asleep', () => {
    const HW = game(); inRoom(HW, 'belfry', 1, 5);
    const H = HW.find('gsBBoulder'), D = HW.find('gsBBell');
    HW.hold('right'); HW.step(200); HW.release(); HW.step(5);
    assert.ok(HW.player().tx < at('belfry', 6, 0)[0], 'nobody walks through the gale');
    go(HW, 'belfry', 5, 6); tool(HW, 'hook', 'right'); HW.step(60);
    assert.ok(HW.player().tx > at('belfry', 9, 0)[0], 'hooked over, to the boulder\'s empty place');
    go(HW, 'belfry', 14, 9); tool(HW, 'bell'); HW.step(120);
    assert.deepEqual(loc('belfry', H), [14, 2], 'the boulder on the plate');
    assert.ok(D.sleeper && D.tiedOff, 'the old bell out of reach, asleep');
    assert.ok(HW.find('gsBGate').open, 'the gate');
    go(HW, 'belfry', 16, 3); go(HW, 'belfry', 17, 3); act(HW, 'up');
    assert.ok(untied(HW, 'belfry'), 'untied');
    go(HW, 'belfry', 10, 5); HW.hold('left'); HW.step(60); HW.release(); HW.step(30);
    assert.ok(HW.player().tx < at('belfry', 6, 0)[0], 'back west with the gale behind you');
    noErrors(HW);
});

test('the Gale Loft: rung within reach of the old bell, both wake and both go round into the drum and home; the brake lays them down asleep again', () => {
    const HW = game(); inRoom(HW, 'belfry', 1, 5);
    const H = HW.find('gsBBoulder'), D = HW.find('gsBBell');
    go(HW, 'belfry', 5, 6); tool(HW, 'hook', 'right'); HW.step(60);
    go(HW, 'belfry', 13, 5); tool(HW, 'bell'); HW.step(300);
    assert.deepEqual(loc('belfry', H), [12, 6], 'the boulder home');
    assert.deepEqual(loc('belfry', D), [11, 1], 'the bell home');
    assert.ok(!HW.find('gsBGate').open, 'shut');
    go(HW, 'belfry', 10, 7); go(HW, 'belfry', 2, 7); act(HW, 'left'); HW.step(30);
    assert.deepEqual(loc('belfry', H), [14, 8]); assert.deepEqual(loc('belfry', D), [14, 1]);
    assert.ok(H.sleeper && D.sleeper, 'asleep where they lay');
    noErrors(HW);
});

test('the Night Ferry (the Slumberhouse\'s Knot): the arch is too low to ride under; the raft goes under it alone with the Bedroll aboard, and Homeward follows', () => {
    const HW = game(); inRoom(HW, 'slumber', 18, 5);
    const raft = HW.find('gsSRaft'), p = HW.player();
    go(HW, 'slumber', 13, 7); step(HW, 'left');
    paddleTo(HW, ...at('slumber', 5, 7)); paddleTo(HW, ...at('slumber', 5, 5));
    HW.Inv.equipped = 'paddle'; HW.hold(['tool', 'up']); HW.step(30); HW.release(); HW.step(4);
    assert.deepEqual(loc('slumber', raft), [5, 5], 'refused at the arch');
    HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(5); HW.skipTalk();
    assert.ok(HW.Inv.bedroll && HW.Inv.bedroll.fid === 'gsSRaft', 'the Bedroll laid on the raft');
    step(HW, 'right');
    assert.deepEqual(loc('slumber', p), [6, 5], 'ashore');
    HW.step(300);
    assert.deepEqual(loc('slumber', raft), [5, 2], 'the raft wound under the arch into the bedroom');
    HW.Inv.equipped = 'bedroll'; HW.hold('tool'); HW.step(24); HW.release(); HW.step(150); HW.skipTalk();
    assert.deepEqual(loc('slumber', p), [5, 2], 'Homeward, to the Bedroll');
    step(HW, 'right'); go(HW, 'slumber', 6, 2); act(HW, 'down');
    assert.ok(untied(HW, 'slumber'), 'untied');
    go(HW, 'slumber', 8, 3); act(HW, 'right');
    assert.ok(HW.find('gsSLever').on, 'the lever');
    HW.step(20); go(HW, 'slumber', 12, 2);
    noErrors(HW);
});

test('the Night Ferry: aboard, the arch scrapes Wren off into the water (she climbs out); the brake brings the raft back from the bedroom', () => {
    const HW = game(); inRoom(HW, 'slumber', 18, 5);
    const raft = HW.find('gsSRaft'), p = HW.player();
    go(HW, 'slumber', 13, 7); step(HW, 'left');
    paddleTo(HW, ...at('slumber', 5, 7)); paddleTo(HW, ...at('slumber', 5, 5));
    HW.Inv.equipped = 'hook'; HW.step(400); HW.skipTalk();
    assert.ok(HW.Progress.flag('arch_scraped'), 'scraped off');
    assert.deepEqual(loc('slumber', p), [6, 5], 'out on the bank');
    assert.deepEqual(loc('slumber', raft), [5, 2], 'the raft went on alone');
    go(HW, 'slumber', 17, 6); act(HW, 'right'); HW.step(30);
    assert.deepEqual(loc('slumber', raft), [12, 7], 'back on its place');
    noErrors(HW);
});

test('the Prompt Box (the Marionette Hall\'s Knot): the understudy through the little door can\'t shift the painted rock; rung, it shoves it onto the plate', () => {
    const HW = game(); inRoom(HW, 'mario', 1, 5);
    const pup = HW.find('gsPuppet'), K = HW.find('gsMRock');
    go(HW, 'mario', 4, 6); tool(HW, 'crossbar', 'down');
    walkP(HW, pup, 'right', 6); walkP(HW, pup, 'up', 3);
    HW.press('tool', 1); HW.step(2);
    go(HW, 'mario', 9, 5); tool(HW, 'crossbar', 'right');
    walkP(HW, pup, 'right', 3);
    assert.deepEqual(loc('mario', pup), [13, 5], 'in through the little door, under the rock');
    HW.press('tool', 1); HW.step(2);
    HW.step(600);
    assert.deepEqual(loc('mario', K), [13, 4], 'as heavy: it waits under it');
    assert.ok(!HW.find('gsMaGate').open, 'shut');
    tool(HW, 'bell'); HW.step(80);
    assert.deepEqual(loc('mario', K), [13, 3], 'rung, it shoves the rock onto the plate');
    HW.step(300);
    assert.deepEqual(loc('mario', K), [13, 3], 'which the box\'s roof holds there');
    assert.ok(HW.find('gsMaGate').open, 'the gate');
    go(HW, 'mario', 16, 6); go(HW, 'mario', 18, 6); go(HW, 'mario', 18, 3); act(HW, 'up');
    assert.ok(untied(HW, 'marionette'), 'untied');
    noErrors(HW);
});

test('the Climb: shut till every Knot is undone; then a hit sends Wren back to the start of that lane, not the foot', () => {
    const HW = game(); inRoom(HW, 'climb', 9, 9);
    assert.ok(!HW.walkTo(...at('climb', 9, 0), 600), 'the way up shut');
    for (const h of HOUSES) HW.Progress.set('untie:' + h);
    HW.Progress.set('spool_all'); HW.step(30);
    /* over the first lane behind a train, then straight on into the next without looking */
    const p = HW.player(), l8 = HW.G.map.ents.find(e => e.kind === 'junklane' && e.ty === at('climb', 0, 8)[1]);
    until(HW, () => !l8.passing(p.x, 22), 400);
    HW.hold('up'); until(HW, () => p.ty === at('climb', 0, 7)[1] && p.y <= at('climb', 0, 7)[1] * 16 + 10, 120);
    assert.ok(!HW.Progress.flag('junk_hit'), 'over the first, behind a train');
    let hit = false;
    for (let i = 0; i < 600 && !hit; i++) { HW.step(1); hit = HW.Progress.flag('junk_hit'); if (p.ty <= at('climb', 0, 5)[1]) { HW.release(); go(HW, 'climb', 9, 7); HW.hold('up'); } }
    HW.release(); HW.step(5); HW.skipTalk();
    assert.ok(hit, 'knocked');
    assert.equal(HW.player().ty, at('climb', 0, 7)[1], 'back to the start of that lane');
    noErrors(HW);
});

test('down here every thread is too taut for the Shears or the Needle', () => {
    const HW = game(); inRoom(HW, 'tidy', 17, 5);
    go(HW, 'tidy', 16, 4); tool(HW, 'shears', 'up');
    const A = HW.find('gsTBlock');
    assert.ok(A.ret && !A.removed, 'the block keeps its thread');
    assert.ok(HW.global('UI').toasts.some(t => /Too taut/.test(t.s)), 'too taut');
    HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(3);
    assert.ok(!HW.global('Needle').st, 'no stitch begun');
    assert.ok(HW.global('UI').toasts.some(t => /won't take a stitch/.test(t.s)), 'and the Needle won\'t either');
    noErrors(HW);
});

test('every room round the Spool\'s foot has a nudge after a long while stuck, and none once it\'s solved', () => {
    const rooms = [['foot', 9, 8, H => H.Progress.setAreaFlag('greatspool', 'door:gsFGate')]].concat(
        [['tidy', 17, 5], ['kiln', 1, 5], ['mill', 18, 5], ['belfry', 1, 5], ['slumber', 18, 5], ['mario', 1, 5]].map(([r, x, y], i) => [r, x, y, H => H.Progress.set('untie:' + HOUSES[i])]));
    for (const [room, x, y, solve] of rooms) for (const solved of [false, true]) {
        const HW = game();
        HW.Progress.set('gs_foot_told'); HW.Progress.set('hintsAsked'); HW.global('Settings').hints = true;
        if (solved) solve(HW);
        inRoom(HW, room, x, y);
        const r = HW.Cam.room;
        assert.ok(r.nudge && r.nudge.say, room + ' has a nudge');
        HW.Stats.rooms['greatspool:' + r.i].t = r.nudge.after; HW.step(5);
        assert.equal(!!HW.Progress.areaFlag('greatspool', 'nudged:' + r.key), !solved, `${room}: ${solved ? 'no nudge once solved' : 'nudged'}`);
        noErrors(HW);
    }
});

test('a save from the Great Spool as it was first built starts again at the foot of the Well, the Knots it had untied still untied', () => {
    const HW = game(); inRoom(HW, 'hub', 9, 8);
    HW.Progress.set('untie:kiln'); HW.Progress.set('untie:mill');
    const s = JSON.parse(JSON.stringify(HW.Save.snapshot()));
    /* as the first Spool saved it: no mark of this one, a place in one of its old rooms, flags of its old rooms */
    delete s.progress.flags.gs2; delete s.progress.flags.gs_foot_told;
    s.pos = { area: 'greatspool', x: 49 * 16 + 8, y: 27 * 16 + 10, dir: 0, mark: { area: 'greatspool', tx: 49, ty: 27 } };
    s.progress.areaFlags.greatspool = { 'door:gsTaGate': true };
    const H2 = loadGame(); H2.global('Game').load(H2.Save.migrate(s)); H2.step(90); H2.skipTalk();
    assert.ok(H2.Progress.flag('gs_foot_told'), 'told again how things are down here');
    assert.equal(H2.G.map.id, 'greatspool');
    assert.deepEqual(loc('foot', H2.player()), [9, 8], 'at the foot of the Well');
    assert.ok(H2.Progress.flag('untie:kiln') && H2.Progress.flag('untie:mill'), 'its Knots still untied');
    assert.ok(!H2.Progress.areaFlag('greatspool', 'door:gsTaGate'), 'the old rooms\' flags gone');
    assert.deepEqual(loc('foot', H2.find('gsFCrate')), [8, 7], 'the Foot as it is now');
    noErrors(H2);
});
