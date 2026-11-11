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
    for (const k of ['crate', 'pot', 'wood', 'block', 'puppet', 'raft']) {
        const [mx, my] = gs('foot', 12, 6);
        const e = a.add(SPAWN[k](mx, my, { id: 'test_' + k })); e.skey = 'test_' + k;
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
    /* and on the way in, the Return's rule 4 as everywhere: a heavy thing shoves Wren a tile on; anything lighter waits
       behind her */
    for (const [k, shoves] of [['block', true], ['crate', false], ['wood', false]]) {
        const [mx, my] = gs('foot', 14, 6);
        const e = a.add(SPAWN[k](mx, my, { id: 'way_' + k })); e.skey = 'way_' + k;
        a.unplace(e, e.tx, e.ty); e.tx = mx + 1; e.x = e.tx * 16; a.place(e, e.tx, e.ty); HW.global('Return').moved(e, e.tx, e.ty);
        standOn(HW, mx + 1, my - 2);
        const p = HW.player();
        until(HW, () => e.ret.state === 'returning' && !e.mv, 400); HW.step(40);
        if (shoves) assert.ok(p.ty < my - 2 && e.ty <= my - 2, k + ': heavy, it shoves her on up the room');
        else assert.ok(p.ty === my - 2 && e.ty === my - 1 && e.ret.strain > 0, k + ': it waits behind her');
        standOn(HW, mx - 3, my + 2); until(HW, () => e.ret.state === 'home' && !e.pendingHome, 600);
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
    const Cam = HW.global('Cam'), [gx, gy] = sw('gate', 19, 5), atGate = () => Math.abs(Cam.x + 160 - (gx * 16 + 8)) <= 2 && Math.abs(Cam.y + 90 - (gy * 16 + 8)) <= 2;
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

/* ---------------- 5: a reload in the Night Ferry's bedroom ---------------- */
const step1 = (HW, d) => { HW.hold(d); HW.step(16); HW.release(); HW.step(4); };
const paddleTo = (HW, x, y) => { const p = HW.player(); HW.Inv.equipped = 'paddle'; for (let i = 0; i < 3000 && (p.tx !== x || p.ty !== y); i++) { HW.hold(['tool', p.tx < x ? 'right' : p.tx > x ? 'left' : p.ty < y ? 'down' : 'up']); HW.step(1); } HW.release(); HW.step(4); };
/* up into the bedroom the Knot's way: the Bedroll laid on the ferry, the ferry sent under the arch, Homeward to it; then
   west off the ferry into the bedroom's far half (the channel between) */
function toFarBedroom(HW) {
    inSpool(HW, 'slumber', 18, 5);
    assert.ok(HW.walkTo(...gs('slumber', 13, 7))); step1(HW, 'left');
    paddleTo(HW, ...gs('slumber', 5, 7)); paddleTo(HW, ...gs('slumber', 5, 5)); HW.step(20);
    HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(3); step1(HW, 'right'); HW.step(300);
    HW.Inv.equipped = 'bedroll'; HW.hold('tool'); HW.step(24); HW.release(); HW.step(150); HW.skipTalk();
    assert.deepEqual([HW.player().tx, HW.player().ty], gs('slumber', 5, 2), 'home on the ferry, up in the bedroom');
    step1(HW, 'left');
    assert.deepEqual([HW.player().tx, HW.player().ty], gs('slumber', 4, 2), 'west of the channel');
}
function reload(HW) {
    const s = JSON.parse(JSON.stringify(HW.Save.snapshot()));
    const H2 = loadGame(); H2.newGame('Wren', { skipIntro: true, noAutosave: true });
    H2.Save.apply(H2.Save.migrate(s)); H2.step(10); H2.skipTalk(); H2.step(5);
    return H2;
}
const outOfFerry = (HW) => { const ok = HW.walkTo(...gs('slumber', 18, 5), 3000); return ok; };

test('the Night Ferry: saved west of the channel with the Bedroll on the ferry, a reload starts Wren on the ferry where it is now (at its landing), not cut off', () => {
    const HW = spool(); toFarBedroom(HW);
    const H2 = reload(HW), p = H2.player(), raft = H2.find('gsSRaft');
    assert.deepEqual([raft.tx, raft.ty], gs('slumber', 12, 7), 'the ferry back at its landing');
    assert.ok(p.tx === raft.tx && p.ty === raft.ty && p.onRaft(), 'and Wren on it, with her Bedroll');
    step1(H2, 'right');
    assert.ok(outOfFerry(H2), 'ashore and out, no Homeward needed');
    noErrors(H2);
});

test('the Night Ferry: saved west of the channel with the Bedroll laid there, a reload starts Wren east of the channel, by the lever (the way out)', () => {
    const HW = spool(); toFarBedroom(HW);
    step1(HW, 'left');                                        /* (a step away from the ferry: a tap beside it would roll it up) */
    HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(5);
    assert.ok(HW.Inv.bedroll && HW.Inv.bedroll.tx === gs('slumber', 3, 2)[0] && !HW.Inv.bedroll.fid, 'the Bedroll laid in the far half');
    const H2 = reload(HW), p = H2.player();
    assert.ok(p.tx - GS.slumber[0] >= 6 && p.ty - GS.slumber[1] <= 3, 'east of the channel, in the bedroom');
    assert.ok(H2.walkTo(...gs('slumber', 8, 3))); H2.face('right'); H2.press('act', 1); H2.step(30); H2.skipTalk();
    assert.ok(H2.find('gsSLever').on, 'the lever');
    assert.ok(outOfFerry(H2), 'and out');
    noErrors(H2);
});

/* ---------------- 6: the Climb, a test of hands ---------------- */
import { climbWatching } from './legs.mjs';
function climbAt(delay) {
    const HW = spool(); inSpool(HW, 'climb', 9, 9);
    for (const h of ['tidy', 'kiln', 'mill', 'belfry', 'slumber', 'marionette']) HW.Progress.set('untie:' + h);
    HW.Progress.set('spool_all'); HW.step(delay);
    return HW;
}
test('the Climb: every throw is told first (its lane lit at least half a second before); holding Up no longer gets through clean, watching does', () => {
    /* the tell: lit for its whole length before every train */
    {
        const HW = climbAt(10), lanes = HW.G.map.ents.filter(e => e.kind === 'junklane');
        assert.equal(lanes.length, 4);
        for (const l of lanes) {
            let lit = 0, trains = 0, ok = true;
            for (let i = 0; i < 400; i++) {
                const before = l.flying.length; HW.step(1);
                if (i > 40 && l.flying.length > before && l.t % l.period === 0) { trains++; ok = ok && lit >= 30; }
                lit = l.tellK > 0 ? lit + 1 : 0;
            }
            assert.ok(ok && trains >= 3, 'every train in row ' + l.ty + ' told first');
        }
    }
    /* holding Up, at twenty start times: never clean, knocked back again and again; watching: clean every time */
    const mash = [], watch = [];
    for (let s = 0; s < 20; s++) {
        const HW = climbAt(5 + 23 * s), p = HW.player();
        HW.hold('up'); until(HW, () => p.ty <= GS.climb[1] + 1, 3000); HW.release();
        mash.push(HW.Stats.c['climb:hit'] || 0);
        const H2 = climbAt(5 + 23 * s);
        climbWatching(H2, GS.climb);
        assert.equal(H2.player().ty, GS.climb[1] + 1, 'up');
        watch.push(H2.Stats.c['climb:hit'] || 0);
        noErrors(HW); noErrors(H2);
    }
    assert.ok(mash.every(n => n >= 1), 'holding Up is caught every time: ' + mash.join(' '));
    assert.ok(mash.reduce((a, n) => a + n, 0) / mash.length >= 2.5, 'two or three times a climb: ' + mash.join(' '));
    assert.ok(watch.every(n => n === 0), 'watching the lanes, never: ' + watch.join(' '));
});

/* ---------------- 7: the Needle's reach, shown ---------------- */
test('the Needle: while a new place is chosen, every tile it could go to is known (four steps, round walls, never over a hole or onto Wren); too far off, it says so', () => {
    const HW = loadGame(); HW.newGame('Wren', { area: 'lab', x: 3, y: 5, noAutosave: true }); HW.step(5);
    HW.Inv.tools.push('needle'); HW.Inv.items.needle = 1; HW.Inv.stitches = [];
    const a = HW.G.map, N = HW.global('Needle');
    a.setCell(5, 3, 'o');                                     /* (a hole two east of the block) */
    HW.face('up'); HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(3);
    assert.ok(N.st && N.st.thing.tx === 3 && N.st.thing.ty === 3, 'the block taken up');
    const R = N.reach(N.st), has = (x, y) => R.has(x + ',' + y);
    assert.ok(has(3, 1) && has(1, 2) && has(4, 3) && has(2, 4), 'near tiles');
    assert.ok(!has(3, 5), 'not where Wren stands');
    assert.ok(!has(5, 3), 'not over the hole');
    assert.ok(!has(1, 1) && !has(6, 3), 'nor where something stands (the sign, the wooden block)');
    assert.ok(has(6, 2) && has(6, 4) && !has(7, 2), 'round the hole, four steps and no further');
    assert.ok([...R.values()].every(d => d >= 1 && d <= 4), 'all within four');
    HW.press('act', 1); HW.step(3);
    assert.ok(!N.st, 'let go');
    /* a pot six tiles off along the line faced: not "nothing there", but too far */
    const pot = a.add(HW.global('SPAWN').pot(2, 5, {})); pot.skey = 'farpot';
    HW.player().x = 8 * 16 + 8; HW.player().y = 5 * 16 + 10; HW.step(1);
    clearToasts(HW); HW.face('left'); HW.press('tool', 1); HW.step(3);
    assert.ok(!N.st && toasts(HW).some(t => /Too far/.test(t)), 'too far off, it says');
    noErrors(HW);
});

/* ---------------- 8: refusals, said ---------------- */
test('refusals are said: a block tied off below won\'t be pushed or gripped; a wedged weight won\'t be pulled; the practice rack isn\'t worked by hand; the Needle and a knot', () => {
    const HW = works(); HW.Inv.tools.push('needle'); HW.Inv.items.needle = 1;
    inWorks(HW, 'gate', 11, 3);
    const b = HW.find('gaBlock');
    assert.ok(b.knotted, 'tied off below');
    const [bx, by] = [b.tx, b.ty];
    assert.ok(HW.walkTo(bx + 1, by)); clearToasts(HW);
    HW.hold('left'); HW.step(40); HW.release(); HW.step(2);
    assert.ok(b.tx === bx && toasts(HW).some(t => /holding it fast from underneath/.test(t)), 'pushed: it says it\'s held from underneath');
    HW.step(100); clearToasts(HW); HW.face('left'); HW.press('act', 1); HW.step(5);
    assert.ok(toasts(HW).some(t => /holding it fast/.test(t)), 'gripped: the same');
    /* from below, the Needle on its cord */
    const c = HW.G.map.ents.find(e => e.kind === 'cord' && e.thing === b);
    HW.warp('spoolworks', c.tx, c.ty + 1); HW.step(30); HW.skipTalk();
    clearToasts(HW); HW.face('up'); HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(3);
    assert.ok(toasts(HW).some(t => /tied off/.test(t)), 'the Needle on a knotted cord says so');
    /* the practice rack, by hand */
    inWorks(HW, 'upractice', 12, 4); clearToasts(HW); HW.face('up'); HW.press('act', 1); HW.step(5);
    assert.ok(toasts(HW).some(t => /crossbar/i.test(t)), 'the rack says how it\'s worked');
    noErrors(HW);
    /* the Loom's wedged weight, pulled (from the silk in front of its nook) */
    const H2 = loadGame(); H2.preset('afterD7'); H2.step(10); H2.skipTalk();
    H2.warp('loom', 49, 13); H2.step(30); H2.skipTalk(); H2.step(5);
    clearToasts(H2); H2.face('left'); H2.hold('act'); H2.step(15);
    assert.ok(H2.player().grip, 'gripped');
    H2.hold(['act', 'right']); H2.step(40); H2.release(); H2.step(5);
    assert.ok(H2.G.map.at(48, 13) && toasts(H2).some(t => /Wedged/.test(t)), 'pulled: it says it\'s wedged');
    noErrors(H2);
});

/* ---------------- 9: small lines ---------------- */
test('lines: the top\'s failed snip says what happens, not what to do; the Bell says its snap shoves harder', () => {
    const HW = spool(); inSpool(HW, 'top', 9, 9);
    for (let i = 0; i < 20 && !HW.Progress.flag('spool_met'); i++) { HW.skipTalk(); HW.step(20); }
    const post = HW.G.map.ents.find(e => e.kind === 'greatpost' && e.house === 'slumber');
    assert.ok(HW.walkTo(post.tx + 1, post.ty)); clearToasts(HW);
    HW.face('left'); HW.Inv.equipped = 'shears'; HW.press('tool', 1); HW.step(5);
    const t = toasts(HW).find(s => /Too taut/.test(s));
    assert.ok(t && !/dragged|drag|slack/i.test(t), 'what happens: ' + t);
    assert.match(HW.global('ITEMS').bell.desc, /shov\w* harder/);
    noErrors(HW);
});
