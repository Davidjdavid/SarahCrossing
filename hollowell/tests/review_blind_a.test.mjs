// The second round of AI blind solving, Houses 7 and 8 and the Great Spool: each finding fixed, each with its test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const toasts = HW => HW.global('UI').toasts.map(t => t.s);
const clearToasts = HW => { HW.global('UI').toasts.length = 0; };

/* the Great Spool's rooms (cells of 20 x 11) */
const GS = { top: [20, 0], slumber: [0, 11], climb: [20, 11], mario: [40, 11], mill: [0, 22], hub: [20, 22], belfry: [40, 22], tidy: [0, 33], foot: [20, 33], kiln: [40, 33] };
const gs = (r, x, y) => [GS[r][0] + x, GS[r][1] + y];
function spool() { const HW = loadGame(); HW.preset('afterDrift'); HW.step(10); HW.skipTalk(); HW.Inv.maxHp = HW.Inv.hp = 36; HW.Inv.stitches = []; return HW; }
function inSpool(HW, r, x, y) { HW.warp('greatspool', ...gs(r, x, y)); HW.step(60); HW.skipTalk(); HW.step(5); }
/* stand Wren on a tile, exactly */
function standOn(HW, x, y) { const p = HW.player(); p.x = x * 16 + 8; p.y = y * 16 + 10; p.kx = p.ky = 0; HW.step(1); }

/* ---------------- 2: nothing coming home lands on Wren ---------------- */
test('anywhere: a float that pops home (a crate thrown into a pit) never lands on Wren standing on its place; it waits over it', () => {
    const HW = loadGame(); HW.newGame('Wren', { area: 'lab', x: 8, y: 5, noAutosave: true }); HW.step(5);
    const a = HW.G.map, p = HW.player(), c = a.ents.find(e => e.kind === 'crate');
    assert.deepEqual([c.tx, c.ty], [8, 4]);
    a.setCell(4, 4, 'o');                                     /* (a hole four tiles west: where a throw lands) */
    HW.face('up'); HW.press('act', 1); HW.step(12);
    assert.ok(p.carry === c, 'lifted');
    HW.hold('up'); HW.step(14); HW.release(); HW.step(2);
    standOn(HW, 8, 4); HW.face('left');
    HW.press('act', 1);
    assert.ok(until(HW, () => c.pendingHome, 120), 'thrown into the hole: it goes home, and its place is under Wren');
    HW.step(90);
    assert.ok(c.pendingHome && a.at(8, 4) !== c, 'it waits; it is not put down under her');
    HW.hold('right'); HW.step(20); HW.release(); HW.step(3);
    assert.ok(!c.pendingHome && a.at(8, 4) === c, 'she steps off: down it comes');
    noErrors(HW);
});

test('the Great Spool: every kind of thing wound in hangs over its place while Wren stands there, then comes down', () => {
    const HW = spool(); inSpool(HW, 'foot', 9, 8);
    const a = HW.G.map, SPAWN = HW.global('SPAWN');
    for (const [k, extra] of [['crate', {}], ['pot', {}], ['wood', {}], ['block', {}], ['puppet', {}], ['raft', {}]]) {
        const [mx, my] = gs('foot', 12, 6);
        const e = a.add(SPAWN[k](mx, my, Object.assign({ id: 'test_' + k }, extra)));
        e.skey = 'test_' + k;
        /* off its place a tile east, then left alone: its patience out, it's wound north into the face and dropped back */
        a.unplace(e, e.tx, e.ty); e.tx = mx + 1; e.x = e.tx * 16; a.place(e, e.tx, e.ty); HW.global('Return').moved(e, e.tx, e.ty);
        standOn(HW, mx, my);
        assert.ok(until(HW, () => e.pendingHome, 900), k + ': wound in, its place under Wren');
        HW.step(60);
        assert.ok(e.pendingHome && a.at(mx, my) !== e, k + ': hangs over its place, waiting');
        standOn(HW, mx - 2, my + 1);
        assert.ok(until(HW, () => !e.pendingHome, 30) && a.at(mx, my) === e, k + ': comes down once she steps off');
        a.remove(e);
    }
    noErrors(HW);
});

test('the top of the Spool: a crate the Pull dragged into the drum is spat back onto its shelf only once the shelf is clear', () => {
    const HW = spool(); inSpool(HW, 'top', 9, 9); HW.skipTalk(); HW.step(30); HW.skipTalk();
    for (let i = 0; i < 20 && !HW.Progress.flag('spool_met'); i++) { HW.skipTalk(); HW.step(20); }
    assert.ok(HW.Progress.flag('spool_met'), 'Gran at the Spool');
    const a = HW.G.map, c = HW.find('gsCrateA'), post = a.ents.find(e => e.kind === 'greatpost' && e.house === 'slumber');
    const [mx, my] = [c.ret.mx, c.ret.my];
    /* lying under a great thread, out of its place: dragged along it into the drum */
    const [tx, ty] = post.tiles[2];
    a.unplace(c, c.tx, c.ty); c.tx = tx; c.ty = ty; c.x = tx * 16; c.y = ty * 16; a.place(c, tx, ty); HW.global('Return').moved(c, tx, ty);
    assert.ok(until(HW, () => c.hiddenYank, 200), 'dragged into the drum');
    standOn(HW, mx, my);
    const p = HW.player();
    assert.ok(until(HW, () => !c.hiddenYank, 600), 'spat back out');
    HW.step(30);
    assert.ok(a.at(mx, my) !== c && p.onTile(mx, my), 'not onto Wren: it waits over its shelf');
    standOn(HW, mx + 1, my - 2);
    assert.ok(until(HW, () => a.at(mx, my) === c, 30), 'down onto its shelf once she steps off');
    noErrors(HW);
});

/* ---------------- 1: the Spoolworks' two locks ---------------- */
const SW = { gate: [20, 22], wind: [20, 11], store: [0, 11], kennel: [40, 11], practice: [40, 22], rope: [0, 22], loft: [0, 0], ugate: [20, 55], uwind: [20, 44], ustore: [0, 44], upractice: [40, 55], urope: [0, 55], uloft: [0, 33] };
const sw = (r, x, y) => [SW[r][0] + x, SW[r][1] + y];
function works() { const HW = loadGame(); HW.preset('afterD6'); HW.step(10); HW.skipTalk(); return HW; }
function inWorks(HW, r, x, y) { HW.warp('spoolworks', ...sw(r, x, y)); HW.step(40); HW.skipTalk(); HW.step(5); }

test('the Spoolworks: the Loft\'s lock takes only its own spare key (from the Ropewalk, past the Needle); the first key can only go to the Kennel', () => {
    const HW = works(); inWorks(HW, 'ustore', 2, 3);
    const lock = HW.find('usLock');
    HW.Inv.keyCount.spoolworks = 1;                           /* the Spool Store's key */
    clearToasts(HW); HW.hold('up'); HW.step(80); HW.release(); HW.step(2);
    assert.ok(!lock.open && HW.Inv.keys('spoolworks') === 1, 'the Loft\'s lock won\'t take it');
    assert.ok(toasts(HW).some(t => /won't turn/.test(t)), 'and says so');
    inWorks(HW, 'wind', 17, 5); HW.hold('right'); HW.step(80); HW.release(); HW.step(2);
    assert.ok(HW.find('swLockE').open && HW.Inv.keys('spoolworks') === 0, 'the Kennel\'s does');
    /* the spare, from the Ropewalk */
    HW.Progress.setAreaFlag('spoolworks', 'chest:rwKey'); HW.Inv.keyCount.spoolworks = 1;
    inWorks(HW, 'ustore', 2, 3); HW.hold('up'); HW.step(80); HW.release(); HW.step(2);
    assert.ok(HW.find('usLock').open && HW.Inv.keys('spoolworks') === 0, 'the spare opens it');
    noErrors(HW);
});

test('the Spoolworks: an old save that spent the first key on the Loft\'s lock gets the Kennel\'s lock let go instead, and can finish', () => {
    const HW = works(); inWorks(HW, 'uloft', 2, 8);
    HW.Progress.setAreaFlag('spoolworks', 'door:usLock'); HW.Progress.setAreaFlag('spoolworks', 'chest:ssKey'); HW.Inv.keyCount.spoolworks = 0;
    const s = HW.Save.snapshot();
    const H2 = loadGame(); H2.newGame('Wren', { skipIntro: true, noAutosave: true });
    H2.Save.apply(H2.Save.migrate(JSON.parse(JSON.stringify(s)))); H2.step(10); H2.skipTalk();
    assert.equal(H2.G.map.id, 'spoolworks');
    assert.ok(H2.find('swLockE').open && H2.Progress.areaFlag('spoolworks', 'door:swLockE'), 'the Kennel open');
    /* down out of Under the Loft, through the Spool Store and the Winding Hall, into the Kennel */
    assert.ok(H2.walkTo(...sw('ustore', 2, 5), 2000), 'back out under the Spool Store');
    H2.warp('spoolworks', ...sw('wind', 17, 5)); H2.step(30); H2.skipTalk();
    H2.hold('right'); H2.step(60); H2.release(); H2.step(5);
    assert.ok(H2.G.map.roomAt(H2.player().tx, H2.player().ty).name === 'The Kennel', 'in the Kennel');
    noErrors(H2);
});

/* ---------------- 3: the Practice Floor's door, shown when it opens ---------------- */
const names = { U: 'up', D: 'down', L: 'left', R: 'right' };
const stitch = (HW, moves) => { HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(2); for (const m of moves) { HW.hold(names[m]); HW.step(2); HW.release(); HW.step(8); } HW.press('tool', 1); HW.step(2); };
const rack = (HW, moves) => { HW.Inv.equipped = 'crossbar'; HW.press('tool', 1); HW.step(2); for (const m of moves) { HW.hold(names[m]); HW.step(4); HW.release(); HW.step(14); } };
const knot = HW => { HW.hold('act'); HW.step(20); HW.release(); HW.step(2); };
const hatch = (HW, r, x, y, d) => { assert.ok(HW.walkTo(...sw(r, x, y)), 'to the hatch'); HW.face(d); HW.press('act', 1); HW.step(40); };

test('the Practice Floor: its plates open a door out of sight, in the Gatehouse; when it opens, the camera goes and looks', () => {
    const HW = works(); HW.Inv.tools.push('needle'); HW.Inv.items.needle = 1;
    inWorks(HW, 'practice', 13, 2);
    const Cam = HW.global('Cam'), atGate = () => Cam.x === 20 * 16 && Cam.y === 22 * 16 - 2;
    HW.face('down'); stitch(HW, 'DDD'); until(HW, () => HW.Return.isHome(HW.find('paBoy')), 120);
    hatch(HW, 'practice', 3, 7, 'down');
    assert.ok(HW.walkTo(...sw('upractice', 12, 4))); HW.face('up'); rack(HW, 'DDDDD');
    assert.ok(!atGate(), 'not yet');
    /* her cord tied, the rack let go: the boy walks home onto his plate, and both are down with nobody at the rack */
    HW.press('tool', 1); HW.step(2);
    assert.ok(HW.walkTo(...sw('upractice', 11, 4))); HW.face('up'); knot(HW);
    let looked = false;
    for (let i = 0; i < 600 && !looked; i++) { HW.step(1); looked = atGate(); }
    assert.ok(looked, 'the camera goes to the door in the Gatehouse');
    assert.ok(HW.find('gaGateE').open, 'open');
    assert.ok(until(HW, () => !HW.Script.blocking() && Cam.x === 40 * 16, 300), 'and comes back');
    /* through it: the Ropewalk's door across the Gatehouse, with a chime */
    hatch(HW, 'upractice', 3, 7, 'down');
    assert.ok(HW.walkTo(...sw('practice', 1, 5)));
    HW.hold('left'); until(HW, () => HW.Cam.room && HW.Cam.room.name === 'The Gatehouse' && !HW.Cam.busy, 240); HW.release(); HW.step(2);
    assert.ok(HW.walkTo(...sw('gate', 15, 5))); HW.step(10);
    assert.ok(HW.find('gaGateW').open && HW.Progress.areaFlag('spoolworks', 'paLookW'), 'the Ropewalk\'s door opens, heard and seen');
    noErrors(HW);
});

/* ---------------- 4: the Airing Cupboard's timing; the Bell's reach, drawn ---------------- */
test('the Airing Cupboard: rung from across the room, out of the block\'s hearing, at a person\'s pace (a second to spare and more)', () => {
    const HW = spool(); inSpool(HW, 'tidy', 17, 5);
    const A = HW.find('gsTBlock'), B = HW.find('gsTMangle');
    assert.ok(HW.walkTo(...gs('tidy', 17, 3))); HW.push('left', 2); HW.step(5);
    assert.ok(HW.walkTo(...gs('tidy', 14, 2))); HW.push('down', 4); HW.step(5);
    assert.deepEqual([A.tx, A.ty], gs('tidy', 14, 7), 'the block in the slot, on the plate');
    assert.ok(HW.walkTo(...gs('tidy', 6, 5)), 'across the room');
    HW.step(60);                                              /* (a second's dither) */
    HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(240);
    assert.deepEqual([B.tx, B.ty], gs('tidy', 14, 6), 'the mangle home on top of the slot');
    assert.deepEqual([A.tx, A.ty], gs('tidy', 14, 7), 'the block waits under it');
    assert.ok(HW.find('gsTGate').open, 'the gate');
    noErrors(HW);
});

test('the Bell: a ring shows its reach, a ring at exactly its range that holds a moment (and stops at the room\'s walls)', () => {
    const HW = spool(); inSpool(HW, 'tidy', 6, 5);
    const Bells = HW.global('Bells'), G = HW.G;
    HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(2);
    const f = G.ringFx;
    assert.ok(f && f.r === Bells.REACH * 16 + 4, 'drawn at its reach');
    assert.ok(f.room && f.room.name === 'The Airing Cupboard', 'within its room');
    for (let i = 0; i < 40; i++) Bells.drawFx(0, 0);
    assert.ok(G.ringFx === f, 'still there to be read after two thirds of a second');
    noErrors(HW);
});
