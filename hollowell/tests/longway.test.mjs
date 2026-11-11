// The Slumberhouse's Long Way Home (its Pattern): three rooms' good dreams on one flight home, none of their bad ones, which
// only a way right round the House that never crosses itself can give. Played through the real game code.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const R = { porch: [20, 33], ward: [20, 22], linen: [0, 22], laundry: [40, 22], study: [60, 22], loft: [40, 33], landing: [20, 11], nursery: [0, 11], moonwalk: [40, 11], fort: [0, 0], boss: [20, 0], kitchen: [40, 0], dream: [60, 0] };
const at = (room, x, y) => [R[room][0] + x, R[room][1] + y];
const ROOMS = ['linen', 'kitchen', 'laundry'];
const CATCHERS = { lcDream: 'linen', mkDream: 'kitchen', ldDream: 'laundry', lcNightmare: 'linen bad', mkNightmare: 'kitchen bad', ldNightmare: 'laundry bad' };
/* a game in the House as it is once the way round is open: the Matron beaten, the ward's doors and the Moonwalk's north door
   unlocked, the laundry chute's lever pulled (each test says what it leaves out) */
function game({ tools = ['bedroll'], open = ['lwLockE', 'lwLockN', 'mwLockN'], chute = true, god = true } = {}) {
    const HW = loadGame();
    HW.newGame('Test', { area: 'slumber', x: 29, y: 42, noAutosave: true });
    HW.Inv.items.staff = 1;
    for (const t of ['gloves', 'hook', 'paddle', 'bell', ...tools]) HW.Inv.giveTool(t);
    HW.Inv.maxHp = HW.Inv.hp = 40;
    HW.G.cheats.god = god;
    HW.Progress.set('slumber_matron');
    for (const d of open) HW.Progress.setAreaFlag('slumber', 'door:' + d);
    if (chute) HW.Progress.setAreaFlag('slumber', 'lever:mwChuteLever');
    HW.step(5);
    return HW;
}
const enter = (HW, room, x, y) => { HW.warp('slumber', ...at(room, x, y)); HW.step(30); HW.skipTalk(); HW.step(5); };
const thing = (HW, id) => HW.G.map.find(id);
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const here = (HW, room) => { const p = HW.player(); return [p.tx - R[room][0], p.ty - R[room][1]]; };
const roomName = HW => { const p = HW.player(), r = HW.G.map.roomAt(p.tx, p.ty); return r && r.name; };
const lay = HW => { HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(2); };
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const latched = (HW, r) => !!HW.Progress.areaFlag('slumber', 'dream:' + r);
const said = HW => (HW.G.pendingToast || '') + ' ' + HW.global('UI').toasts.map(t => t.s).join(' ');
const rollUp = HW => { HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(3); assert.ok(!HW.global('Inv').bedroll, 'rolled up'); };
/* step tile by tile (orthogonal moves), as a careful player does when it matters where her feet go */
function steps(HW, room, path) {
    const p = HW.player();
    for (const [x, y] of path) {
        const [tx, ty] = at(room, x, y);
        const d = tx > p.tx ? 'right' : tx < p.tx ? 'left' : ty > p.ty ? 'down' : 'up';
        for (let i = 0; i < 80 && (p.tx !== tx || p.ty !== ty); i++) { HW.hold(d); HW.step(1); }
        HW.release(); until(HW, () => !HW.Cam.busy, 60);
        const horiz = d === 'left' || d === 'right';
        for (let i = 0; i < 16; i++) {
            const off = horiz ? p.x - (tx * 16 + 8) : p.y - (ty * 16 + 10);
            if (Math.abs(off) <= 2) break;
            HW.hold(horiz ? (off > 0 ? 'left' : 'right') : (off > 0 ? 'up' : 'down')); HW.step(1);
        }
        HW.release();
        assert.deepEqual([p.tx, p.ty], [tx, ty], `stepped onto ${room} ${x},${y}`);
        assert.equal(p.state, 'normal', `standing at ${room} ${x},${y}`);
    }
}
/* fly home (Homeward, or a fall when there's no Bedroll laid) and watch: which dreamcatchers light, in what order, and which
   rooms the flight passes through */
function flyAndWatch(HW, start) {
    const p = HW.player(), order = [], rooms = [];
    start();
    for (let i = 0; i < 1500 && p.state !== 'normal'; i++) {
        HW.step(1);
        for (const id of Object.keys(CATCHERS)) if (thing(HW, id).lit > 0 && !order.includes(CATCHERS[id])) order.push(CATCHERS[id]);
        const n = roomName(HW); if (p.state === 'flight' && n && rooms[rooms.length - 1] !== n) rooms.push(n);
    }
    assert.equal(p.state, 'normal', 'came down');
    return { order, rooms };
}
const homeward = HW => flyAndWatch(HW, () => { HW.Inv.equipped = 'bedroll'; HW.hold('tool'); HW.step(24); HW.release(); });
const fallFrom = (HW, dir) => flyAndWatch(HW, () => { HW.hold(dir); until(HW, () => HW.player().state === 'fall', 200); HW.release(); });

/* ---------------- the pieces of the way round ---------------- */
/* the laundry: in at the west door, onto the basket, paddled UP the near side against the current (hard going) and east along
   the top to the wash's good dream; ashore there, under the chute */
function laundryUpstream(HW, from = [[0, 5], [1, 5], [1, 6], [1, 7], [1, 8], [2, 8]]) {
    const b = thing(HW, 'ldBasket'), p = HW.player();
    steps(HW, 'laundry', [...from, [3, 8]]);
    assert.ok(p.ride || p.onRaft(), 'on the basket');
    HW.Inv.equipped = 'paddle';
    HW.hold(['tool', 'up']); assert.ok(until(HW, () => b.tx === at('laundry', 3, 0)[0] && b.ty === at('laundry', 0, 2)[1] && !b.mv, 600), 'paddled up the near side, against the current');
    HW.hold(['tool', 'right']); assert.ok(until(HW, () => b.tx === at('laundry', 6, 0)[0] && !b.mv, 400), 'and along the top, under the good dream'); HW.release();
    HW.hold('up'); until(HW, () => p.ty === at('laundry', 0, 1)[1] && !p.ride && p.state === 'normal', 120); HW.step(8); HW.release();
    assert.deepEqual(here(HW, 'laundry'), [6, 1], 'ashore at the top');
}
/* up the chute to the Moonwalk, across it on its east side to the north door, into the milk kitchen; across the gap on the
   LOWER springs; over the far bank to the hole in its floor, and down it into the Moonwalk */
function chuteAndKitchen(HW) {
    const p = HW.player();
    steps(HW, 'laundry', [[7, 1], [7, 0]]);
    steps(HW, 'moonwalk', [[7, 10], [7, 9], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], [15, 8], [15, 7], [15, 6], [15, 5], [15, 4], [15, 3], [15, 2], [15, 1], [15, 0]]);
    steps(HW, 'kitchen', [[15, 10], [15, 9], [15, 8], [15, 7]]);
    HW.hold('left'); until(HW, () => p.state === 'normal' && p.tx <= at('kitchen', 4, 0)[0], 400); HW.release(); HW.step(5);
    assert.deepEqual(here(HW, 'kitchen'), [2, 7], 'sprung across the gap on the lower springs');
    steps(HW, 'kitchen', [[3, 7], [4, 7], [4, 8], [4, 9]]);
    HW.hold('down'); until(HW, () => p.state === 'normal' && p.ty >= at('moonwalk', 0, 4)[1], 300); HW.release(); until(HW, () => !HW.Cam.busy, 60); HW.step(2);
    assert.equal(roomName(HW), 'The Moonwalk', 'down the hole into the Moonwalk');
    assert.deepEqual(here(HW, 'moonwalk'), [4, 4], 'landed on its floor, by the gated corner (not in it)');
}
/* back round: the Moonwalk's west side to its west door (its east side is already walked), the Landing round its old boards
   and the Bedroll's chest, down into the Long Ward */
function backRound(HW) {
    steps(HW, 'moonwalk', [[3, 4], [2, 4], [1, 4], [1, 5], [0, 5]]);
    steps(HW, 'landing', [[19, 5], [18, 5], [18, 6], [18, 7], [18, 8], [17, 8], [16, 8], [15, 8], [14, 8], [13, 8], [12, 8], [11, 8], [10, 8], [10, 9], [9, 9], [9, 10]]);
    steps(HW, 'ward', [[9, 0], [9, 1]]);
}
/* the ward's north door to its west door, keeping to the top of the ward (the walk out kept to the bottom) */
const wardAcrossTop = HW => steps(HW, 'ward', [[9, 2], [9, 3], [9, 4], [8, 4], [7, 4], [6, 4], [5, 4], [4, 4], [3, 4], [2, 4], [1, 4], [1, 5], [0, 5]]);
/* the linen's boards, north of the cupboard's middle (its good dream), to the lamp on the near corner */
const linenNorth = HW => steps(HW, 'linen', [[19, 5], [18, 5], [17, 5], [16, 5], [15, 5], [14, 5], [14, 6], [13, 6], [12, 6], [11, 6], [11, 5], [11, 4], [11, 3], [10, 3], [9, 3], [8, 3]]);
/* and south of it, the way the cupboard's lamps are usually lit (its bad dream) */
const linenSouth = HW => steps(HW, 'linen', [[19, 5], [18, 5], [17, 5], [16, 5], [15, 5], [14, 5], [14, 6], [13, 6], [12, 6], [12, 5], [11, 5], [10, 5], [9, 5], [9, 4], [9, 3], [8, 3]]);

/* the whole way round, from the Bedroll laid in the Long Ward's south-east corner */
function longWay(HW) {
    enter(HW, 'ward', 17, 6); lay(HW);
    steps(HW, 'ward', [[18, 6], [18, 5], [19, 5]]);
    laundryUpstream(HW); chuteAndKitchen(HW); backRound(HW); wardAcrossTop(HW); linenNorth(HW);
}

test('the long way home: from the Bedroll in the Long Ward round the whole House and back, one flight lights the linen\'s good dream, the milk\'s and the wash\'s, in that order, and none of the bad: the Pattern', () => {
    const HW = game();
    longWay(HW);
    assert.ok(!thing(HW, 'lwPattern').opened && thing(HW, 'lwPattern').hidden, 'no Pattern yet');
    const { order, rooms } = homeward(HW);
    assert.deepEqual(order, ['linen', 'kitchen', 'laundry'], 'the good dreams lit as the flight passed them, last room walked first');
    for (const r of ['The Linen Cupboard', 'The Long Ward', 'The Landing', 'The Moonwalk', 'The Milk Kitchen', 'The Laundry']) assert.ok(rooms.includes(r), 'flown through ' + r);
    assert.deepEqual(here(HW, 'ward'), [17, 6], 'down on the Bedroll');
    for (const r of ROOMS) assert.ok(latched(HW, r), r + "'s night-light on, and staying on");
    assert.ok(HW.Progress.flag('slumber_longway'), 'all three on one way home');
    const ch = thing(HW, 'lwPattern');
    assert.ok(until(HW, () => !ch.hidden, 60), "the Pattern's chest comes down in the Long Ward");
    HW.walkTo(ch.tx, ch.ty + 1); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.hasPattern('slumber'), 'the Pattern');
    /* and it opens the big door */
    enter(HW, 'landing', 9, 1); HW.hold('up'); HW.step(40); HW.release(); HW.step(30);
    assert.ok(thing(HW, 'laBig').open, 'the big door');
    noErrors(HW);
});

test('the long way home, timed: a flight through one room is as quick as ever; one round the House takes a moment in each room, and misses nothing on the way', () => {
    const HW = game();
    enter(HW, 'ward', 2, 5); lay(HW);
    const p = HW.player();
    steps(HW, 'ward', [[1, 5], [0, 5]]); linenNorth(HW);
    HW.Inv.equipped = 'bedroll'; HW.hold('tool'); HW.step(24); HW.release(); HW.step(1);
    const short = p.flight && p.flight.dur;
    until(HW, () => p.state === 'normal', 600);
    assert.ok(short && short <= 220, `ward and cupboard: ${short} frames`);
    /* the whole way round */
    const H2 = game();
    longWay(H2);
    const p2 = H2.player();
    H2.Inv.equipped = 'bedroll'; H2.hold('tool'); H2.step(24); H2.release(); H2.step(1);
    const f = p2.flight;
    assert.ok(f && f.dur > 300, `round the House: ${f && f.dur} frames, not squeezed into ${110}`);
    assert.ok(f.len / f.dur <= 6, 'never faster than a few pixels a step (so nothing it passes is skipped)');
    until(H2, () => p2.state === 'normal', 1500);
    assert.ok(H2.Progress.flag('slumber_longway'));
    noErrors(HW); noErrors(H2);
});

test('each room dreamt on its own: its night-light comes on and stays on (in the room, over the ward\'s door and the big door), but three separate flights are not one way home', () => {
    const HW = game();
    /* the linen, the Bedroll laid in the ward by its west door */
    enter(HW, 'ward', 2, 5); lay(HW);
    steps(HW, 'ward', [[1, 5], [0, 5]]); linenNorth(HW);
    let w = homeward(HW);
    assert.deepEqual(w.order, ['linen'], 'its good dream, not its bad');
    assert.ok(latched(HW, 'linen') && !latched(HW, 'kitchen') && !latched(HW, 'laundry'), 'the linen dreamt');
    assert.match(said(HW), /night-light comes on/, 'said where it can be seen');
    const D = HW.global('Dreams');
    assert.equal(D.lastOf('linen'), 'good', 'its lamp over the ward door flares');
    /* the wash, with the laundry's own place (the Bedroll rolled up) and a dive off the top */
    rollUp(HW);
    enter(HW, 'laundry', 1, 5);
    laundryUpstream(HW, [[1, 6], [1, 7], [1, 8], [2, 8]]);
    steps(HW, 'laundry', [[7, 1]]);
    w = fallFrom(HW, 'down');
    assert.deepEqual(w.order, ['laundry'], "the wash's good dream on the way down the near side");
    assert.ok(latched(HW, 'laundry'), 'the wash dreamt');
    /* the milk: the Bedroll on the near bank, across on the lower springs, down the hole, Homeward back up through it */
    enter(HW, 'kitchen', 15, 9); lay(HW);
    const p = HW.player();
    steps(HW, 'kitchen', [[15, 8], [15, 7]]);
    HW.hold('left'); until(HW, () => p.state === 'normal' && p.tx <= at('kitchen', 4, 0)[0], 400); HW.release(); HW.step(5);
    steps(HW, 'kitchen', [[3, 7], [4, 7], [4, 8], [4, 9]]);
    HW.hold('down'); until(HW, () => p.state === 'normal' && p.ty >= at('moonwalk', 0, 4)[1], 300); HW.release(); until(HW, () => !HW.Cam.busy, 60);
    w = homeward(HW);
    assert.deepEqual(w.order, ['kitchen'], 'up through the hole: the good dream over it');
    assert.deepEqual(here(HW, 'kitchen'), [15, 9], 'home on the Bedroll');
    assert.ok(ROOMS.every(r => latched(HW, r)), 'all three night-lights on');
    assert.ok(!HW.Progress.flag('slumber_longway') && thing(HW, 'lwPattern').hidden, 'but no Pattern: three dreams, three ways home');
    /* the latches are kept: built again (a warp out and back) they're still on */
    HW.warp('hollow', 147, 49); HW.step(5); enter(HW, 'ward', 9, 5);
    assert.ok(ROOMS.every(r => latched(HW, r)), 'still on');
    noErrors(HW);
});

test("the old ways are bad dreams: the cupboard's lamps lit the usual way, the wash ridden round with the current, the milk's gap crossed by the springs the bell hangs by: the bad one lights, the room isn't dreamt", () => {
    const HW = game();
    enter(HW, 'ward', 2, 5); lay(HW);
    steps(HW, 'ward', [[1, 5], [0, 5]]); linenSouth(HW);
    let w = homeward(HW);
    assert.deepEqual(w.order, ['linen bad'], "the linen's bad dream");
    assert.ok(!latched(HW, 'linen'));
    assert.equal(HW.global('Dreams').lastOf('linen'), 'bad', 'its lamp gutters red');
    /* the wash with the current: round the bottom first, under its bad dream, then up the far side and along the top */
    rollUp(HW);
    enter(HW, 'laundry', 1, 5);
    const b = thing(HW, 'ldBasket'), p = HW.player();
    steps(HW, 'laundry', [[1, 6], [1, 7], [1, 8], [2, 8], [3, 8]]);
    HW.Inv.equipped = 'paddle'; HW.hold(['tool', 'up']); HW.step(20); HW.release();
    assert.ok(until(HW, () => b.ty === at('laundry', 0, 2)[1] && b.tx <= at('laundry', 5, 0)[0] && !b.mv, 4000), 'carried round to the top, past the good dream');
    HW.hold('up'); until(HW, () => p.ty === at('laundry', 0, 1)[1] && !p.ride, 120); HW.step(8); HW.release();
    w = fallFrom(HW, 'down');
    assert.ok(w.order.includes('laundry') && w.order.includes('laundry bad'), 'both: ' + w.order);
    assert.ok(w.order.indexOf('laundry') < w.order.indexOf('laundry bad'), 'the good one first, then the bad (the last ridden is the first flown)');
    assert.ok(!latched(HW, 'laundry'));
    /* the milk: the upper springs, under the bad dream, and down the hole */
    enter(HW, 'kitchen', 15, 9); lay(HW);
    steps(HW, 'kitchen', [[15, 8], [15, 7], [15, 6], [15, 5], [15, 4]]);
    HW.hold('left'); until(HW, () => p.state === 'normal' && p.tx <= at('kitchen', 4, 0)[0], 400); HW.release(); HW.step(5);
    assert.deepEqual(here(HW, 'kitchen'), [2, 4], 'across on the upper springs');
    steps(HW, 'kitchen', [[2, 5], [2, 6], [3, 6], [4, 6], [4, 7], [4, 8], [4, 9]]);
    HW.hold('down'); until(HW, () => p.state === 'normal' && p.ty >= at('moonwalk', 0, 4)[1], 300); HW.release(); until(HW, () => !HW.Cam.busy, 60);
    w = homeward(HW);
    assert.deepEqual(w.order, ['kitchen', 'kitchen bad'], 'up the hole (good), then back over the bell\'s springs (bad)');
    assert.ok(!latched(HW, 'kitchen'));
    noErrors(HW);
});

test('a folded route: the Bedroll laid by the ward\'s west door, out along the ward to the laundry, round the House, and back down across the first path: the flight comes straight home from the fold, and only what\'s after it lights', () => {
    const HW = game();
    enter(HW, 'ward', 4, 4); lay(HW);
    steps(HW, 'ward', [[5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], [13, 4], [14, 4], [15, 4], [16, 4], [17, 4], [18, 4], [18, 5], [19, 5]]);
    laundryUpstream(HW); chuteAndKitchen(HW); backRound(HW);
    const p = HW.player(), before = p.trace.length;
    steps(HW, 'ward', [[9, 2], [9, 3], [9, 4]]);
    assert.ok(p.trace.length < before / 2, `stepping back onto the way out cut the thread back to it (${before} tiles to ${p.trace.length})`);
    steps(HW, 'ward', [[9, 5], [8, 5], [7, 5], [6, 5], [5, 5], [4, 5], [3, 5], [2, 5], [1, 5], [0, 5]]);
    linenNorth(HW);
    const { order, rooms } = homeward(HW);
    assert.deepEqual(order, ['linen'], 'only the linen, which came after the fold');
    assert.ok(!rooms.includes('The Laundry') && !rooms.includes('The Moonwalk') && !rooms.includes('The Milk Kitchen'), 'the flight never went round: ' + rooms.join(', '));
    assert.ok(!HW.Progress.flag('slumber_longway') && thing(HW, 'lwPattern').hidden, 'no Pattern');
    const D = HW.global('Dreams');
    assert.deepEqual(['linen', 'kitchen', 'laundry'].map(r => D.lastOf(r)), ['good', null, null], 'over the ward door: one lamp flares, two stay dark');
    noErrors(HW);
});

test('nothing special-cased: a bed is as good a place as the Bedroll (from the drying loft\'s bed, up through the laundry, round, and down the linen: a fall flies her home to the bed, and it is the long way home)', () => {
    const HW = game({ tools: [] });
    enter(HW, 'loft', 9, 1);
    steps(HW, 'loft', [[8, 1], [7, 1], [6, 1], [5, 1], [4, 1], [3, 1]]); HW.face('left'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.player().mark.bed, 'bed', "the loft's bed is her place");
    steps(HW, 'loft', [[4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [9, 0]]);
    laundryUpstream(HW, [[9, 10], [9, 9], [8, 9], [7, 9], [6, 9], [5, 9], [4, 9], [3, 9], [2, 9], [2, 8]]);
    chuteAndKitchen(HW); backRound(HW); wardAcrossTop(HW);
    steps(HW, 'linen', [[19, 5], [18, 5], [17, 5], [16, 5], [15, 5], [14, 5], [14, 6], [13, 6], [12, 6], [11, 6], [11, 5], [11, 4], [11, 3], [10, 3], [9, 3]]);
    const { order } = fallFrom(HW, 'up');
    assert.deepEqual(order, ['linen', 'kitchen', 'laundry']);
    assert.ok(HW.Progress.flag('slumber_longway'), 'the long way home');
    assert.deepEqual(here(HW, 'loft'), [3, 1], 'woke by the bed in the loft, unhurt');
    noErrors(HW);
});

test('rolled up, the Bedroll is no way round: each room\'s own door is home again, the thread starts afresh in every room, and a fall comes home only through the room it\'s in', () => {
    const HW = game();
    /* walked the whole way round with no Bedroll laid (rolled up in the pack) */
    enter(HW, 'ward', 18, 6);
    steps(HW, 'ward', [[18, 5], [19, 5]]);
    laundryUpstream(HW); chuteAndKitchen(HW); backRound(HW); wardAcrossTop(HW); linenNorth(HW);
    const p = HW.player();
    assert.ok(!p.mark.bed, "no bed: the cupboard's door is her place");
    assert.ok(p.trace.length < 20, 'the thread only goes back to the cupboard door');
    const { order, rooms } = fallFrom(HW, 'up');
    assert.deepEqual(order, ['linen']);
    assert.deepEqual(rooms, ['The Linen Cupboard'], 'home to the cupboard door, and no further');
    assert.ok(!HW.Progress.flag('slumber_longway'));
    /* laid and rolled up again out on the boards: the thread drawn straight to the door, past nothing */
    enter(HW, 'linen', 18, 5); steps(HW, 'linen', [[17, 5], [16, 5], [15, 5], [14, 5], [14, 6], [13, 6], [12, 6], [11, 6], [11, 5], [11, 4]]);
    lay(HW); rollUp(HW);
    steps(HW, 'linen', [[11, 3], [10, 3], [9, 3]]);
    const w = fallFrom(HW, 'up');
    assert.deepEqual(w.order, ['linen'], "the good dream, then straight to the door");
    noErrors(HW);
});

test('the laundry chute: bolted on the laundry side; the lever in the Moonwalk opens it for good (and the camera goes to look); so the laundry can always be reached once the Moonwalk can, whatever key went where', () => {
    /* the bad order for keys: the first key on the ward's north door, the Moonwalk's on its own north door, the ward's east door
       still locked and no key left */
    const HW = game({ open: ['lwLockN', 'mwLockN'], chute: false });
    enter(HW, 'laundry', 7, 1);
    const gate = thing(HW, 'ldChute');
    assert.ok(!gate.open, 'the chute is shut');
    HW.hold('up'); HW.step(50); HW.release(); HW.step(2);
    assert.equal(roomName(HW), 'The Laundry', 'and stays shut from this side');
    assert.match(said(HW), /Bolted, from the other side/, 'it says so');
    enter(HW, 'ward', 18, 5);
    HW.hold('right'); HW.step(40); HW.release(); HW.step(10);
    assert.equal(roomName(HW), 'The Long Ward', "the ward's east door still locked");
    assert.equal(HW.Inv.keys('slumber'), 0, 'and no key');
    enter(HW, 'moonwalk', 8, 8);
    HW.face('down'); HW.press('act', 1);
    assert.ok(thing(HW, 'mwChuteLever').on, 'the lever pulled');
    assert.ok(until(HW, () => HW.global('Cam').look, 60), 'the camera goes to look at the chute');
    assert.ok(until(HW, () => thing(HW, 'ldChute').open, 120), 'the chute opens');
    until(HW, () => !HW.global('Script').blocking(), 400);
    steps(HW, 'moonwalk', [[7, 8], [7, 9], [7, 10]]);
    steps(HW, 'laundry', [[7, 0], [7, 1]]);
    assert.equal(roomName(HW), 'The Laundry', 'down the chute into the laundry');
    /* and it stays open */
    HW.warp('hollow', 147, 49); HW.step(5); enter(HW, 'laundry', 7, 1);
    assert.ok(thing(HW, 'ldChute').open, 'open for good');
    noErrors(HW);
});

test('saves: the night-lights and the long way home are kept; a save that already holds the Pattern keeps it, and the Long Ward\'s chest gives buttons; one that took the Pattern from the Dreaming Door has it still', () => {
    const HW = game();
    enter(HW, 'ward', 2, 5); lay(HW);
    steps(HW, 'ward', [[1, 5], [0, 5]]); linenNorth(HW); homeward(HW);
    assert.ok(latched(HW, 'linen'));
    HW.Save.write(1);
    /* (another game entirely, then the save loaded into it) */
    const H2 = loadGame();
    H2.newGame('Other', { area: 'slumber', x: 29, y: 42, noAutosave: true }); H2.step(5);
    H2.global('Game').load(H2.Save.migrate(JSON.parse(JSON.stringify(HW.Save.read(1))))); H2.step(20);
    assert.equal(H2.G.map.id, 'slumber');
    assert.ok(H2.Progress.areaFlag('slumber', 'dream:linen'), 'the linen still dreamt after a load');
    assert.ok(!H2.Progress.areaFlag('slumber', 'dream:laundry'));
    H2.warp('slumber', ...at('ward', 9, 5)); H2.step(5);
    assert.ok(H2.global('Dreams').latched('linen'), 'its night-light over the ward door lit');
    /* an old game that took the Pattern before the long way home */
    const H3 = game();
    H3.Inv.patterns.push('slumber'); H3.Progress.setAreaFlag('slumber', 'chest:dgPattern');
    enter(H3, 'dream', 1, 5);
    assert.ok(thing(H3, 'dgPattern').opened, "the Dreaming Door's chest already open");
    longWay(H3); homeward(H3);
    const ch = thing(H3, 'lwPattern');
    assert.ok(until(H3, () => !ch.hidden, 60));
    assert.equal(ch.item, 'b20', 'buttons, not a second Pattern');
    assert.ok(H3.Inv.hasPattern('slumber'));
    /* and a new game finds buttons in the Dreaming Door */
    const H4 = game();
    enter(H4, 'dream', 1, 5);
    assert.equal(thing(H4, 'dgPattern').item, 'b50', 'a purse of buttons now');
    noErrors(HW); noErrors(H2); noErrors(H3); noErrors(H4);
});
