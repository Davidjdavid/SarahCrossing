// Save states for the optional content and the other paths (the QA kit; tools/qa_record.mjs records the main path).
// Each segment starts from a save of the main path's catalogue (its code loaded into a fresh headless game) and plays on
// through the game's own rules, as tests/legs.mjs does: walking, pushing, lifting, talking, the tools; hops between
// places to save the walk. The game is tools/qa_legs.mjs's (loadQA: nothing can hurt Wren, so her hearts are the game's
// own count; a beaten boss's Heartstitch picked up before the next walk). Nothing is set up by hand: every flag and
// thing comes from the game's own logic. mark(id, what) takes a save once
// Wren is free to move and has held still for half a second (as tools/qa_record.mjs does).
//   node tools/qa_tour.mjs SAVES_JSON OUTDIR [--only E1,E2]   writes OUTDIR/caps_tour.jsonl (one line per mark)
import fs from 'node:fs';
import path from 'node:path';
import { loadQA, climbWatching, LEG9 } from './qa_legs.mjs';

/* ---------------- small helpers (as the legs have them) ---------------- */
const here = HW => `${HW.G.map && HW.G.map.id} ${HW.player() && HW.player().tx},${HW.player() && HW.player().ty}`;
const fail = (HW, m) => { throw new Error(m + ' (at ' + here(HW) + ')'); };
const ok = (HW, c, m) => { if (!c) fail(HW, m); };
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
/* walk there (a line said on the way stops a walk: talked through, it carries on) */
const walk = (HW, x, y, max = 60000) => {
    let r = HW.walkTo(x, y, max);
    for (let i = 0; i < 4 && !r; i++) { HW.skipTalk(); HW.step(5); r = HW.walkTo(x, y, max); }
    ok(HW, r, `walk to ${x},${y}`);
};
const act = (HW, d) => { HW.face(d); HW.press('act', 1); HW.step(3); HW.skipTalk(); HW.step(5); };
const step = (HW, d) => { HW.hold(d); HW.step(16); HW.release(); HW.step(4); };
/* through a doorway: hold the way until the place changes */
const through = (HW, d, area) => {
    const from = HW.G.map.id; HW.hold(d);
    until(HW, () => HW.G.map.id !== from && (!area || HW.G.map.id === area), 240); HW.release();
    HW.step(40); HW.skipTalk(); HW.step(5);
    ok(HW, !area || HW.G.map.id === area, 'through to ' + area);
};
const tool = (HW, t, d) => { if (d) HW.face(d); HW.Inv.equipped = t; HW.press('tool', 1); HW.step(3); HW.skipTalk(); };
const settle = HW => { for (let i = 0; i < 12; i++) { HW.step(5); HW.skipTalk(); } };
const pushAt = (HW, x, y, d, n) => { walk(HW, x, y, 3000); HW.push(d, n); HW.step(10); };
const strike = (HW, d) => { HW.face(d); HW.press('atk', 1); HW.step(12); };
const ring = HW => { HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(4); HW.skipTalk(); };
/* the Crossbar's strings, a step at a time (as tests/larkspur.test.mjs works them) */
const strings = (HW, moves) => {
    const names = { U: 'up', D: 'down', L: 'left', R: 'right' };
    for (const m of moves) { const ps = HW.global('Crossbar').ctl.puppets; HW.hold(names[m]); until(HW, () => ps.some(e => e.mv), 12); until(HW, () => !ps.some(e => e.mv), 30); HW.release(); HW.step(3); }
};
/* the Needle at what's in front (tests/unfinished.test.mjs): sews the nearest chalk; at a sewn one, choice 0 unpicks it,
   1 sews the next along; the Needle on a thing: pick it, steer its new place, set it (tests/strayhouse.test.mjs) */
const sew = (HW, d, choice) => { HW.face(d); HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(3); if (choice !== undefined) HW.skipTalk(choice); HW.step(5); };
const stitch = (HW, moves) => {
    const names = { U: 'up', D: 'down', L: 'left', R: 'right' };
    HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(2);
    for (const m of moves) { HW.hold(names[m]); HW.step(2); HW.release(); HW.step(8); }
    HW.press('tool', 1); HW.step(30);
};
/* out of a House (or anywhere with a door out) by its way out: walk to the tile, then on through it */
const leave = (HW, x, y, d) => { walk(HW, x, y, 20000); through(HW, d, 'hollow'); };
/* the Paddle, held, toward a tile (the legs' paddleTo) */
const paddleTo = (HW, x, y) => {
    const p = HW.player(); HW.Inv.equipped = 'paddle';
    for (let i = 0; i < 2000 && (p.tx !== x || p.ty !== y); i++) { HW.hold(['tool', p.tx < x ? 'right' : p.tx > x ? 'left' : p.ty < y ? 'down' : 'up']); HW.step(1); }
    HW.release(); HW.step(20);
};

/* ---------------- Linnet's Trail: the seven notes out in the valley (from a save after the Loom: every tool) ---------------- */
export function linnetTrail(HW) {
    const note = n => ok(HW, HW.Progress.flag('linnet' + n), "Linnet's note " + n);
    /* 1: Gran's house, the picture turned to the wall: turned round with the Gloves */
    walk(HW, 76, 51); through(HW, 'up', 'gran_house');
    walk(HW, 9, 2, 3000); act(HW, 'up'); note(1);
    leave(HW, 6, 7, 'down');
    /* 2: Meadowfold, the stray hay bale: pushed, it stays pushed; the note was under it */
    walk(HW, 99, 110); HW.push('right', 1); HW.step(10);
    walk(HW, 99, 110); act(HW, 'right'); note(2);
    /* 3: Kilnridge, the urn at the end of the crevice: a pot thrown at it from afar (tests/kilnridge.test.mjs) */
    HW.warp('hollow', 17, 98); HW.step(10); HW.skipTalk();
    walk(HW, 17, 98); HW.face('down'); HW.press('act', 1); HW.step(10); ok(HW, HW.player().carry, 'a pot lifted');
    walk(HW, 7, 111); HW.face('left'); HW.press('act', 1); HW.step(50);
    walk(HW, 4, 111); act(HW, 'left'); note(3);
    /* 7: Larkspur, the carousel's wooden horse walked off its spot with the Crossbar (tests/larkspur.test.mjs) */
    HW.warp('hollow', 31, 64); HW.step(10); HW.skipTalk();
    HW.Inv.equipped = 'crossbar'; HW.face('up'); HW.press('tool', 1); HW.step(2); strings(HW, 'RR'); HW.press('tool', 1); HW.step(3);
    walk(HW, 31, 63); act(HW, 'up'); note(7);
    /* 6: Hushwood, the giant's hollow: the Bedroll laid up top, down the hollow, the note, Homeward back up; rolled up */
    HW.warp('hollow', 138, 59); HW.step(10); HW.skipTalk();
    walk(HW, 134, 58); HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(2); HW.skipTalk();
    ok(HW, HW.Inv.bedroll && HW.Inv.bedroll.area === 'hollow', 'the Bedroll laid by the hollow');
    walk(HW, 132, 59); HW.face('left'); HW.press('act', 1); HW.skipTalk(0); HW.step(70); HW.skipTalk();
    ok(HW, HW.G.map.id === 'hummock_hollow', 'down the hollow');
    walk(HW, 13, 5, 3000);
    const p = HW.player();
    for (const x of [14, 15, 16, 17, 18]) for (let i = 0; i < 40 && p.tx < x; i++) { HW.hold('right'); HW.step(1); }
    for (let i = 0; i < 8; i++) { HW.hold('right'); HW.step(1); } HW.release();
    act(HW, 'right'); note(6);
    HW.Inv.equipped = 'bedroll'; HW.hold('tool'); HW.step(24); HW.release(); HW.step(80); HW.skipTalk();
    ok(HW, HW.G.map.id === 'hollow', 'Homeward, back up top');
    HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(5); HW.skipTalk();
    ok(HW, !HW.Inv.bedroll, 'the Bedroll rolled up again');
    /* 4: the Belfry's Echo Room, behind the sleeping slab in Clangor's Loft (rung awake): the stones in Gran's lullaby,
       low, high, middle, high, low (tests/belfry.test.mjs); the chest. The note is there the next time the Belfry's built
       (its `if` is read when the place is built), so out of the tower and in again */
    HW.warp('hollow', 158, 10); HW.step(10); HW.skipTalk();
    walk(HW, 158, 8); through(HW, 'up', 'belfry');
    walk(HW, 35, 27, 6000); ring(HW);
    ok(HW, until(HW, () => HW.Return.isHome(HW.G.map.find('clWall')), 200), 'the slab gone home');
    HW.step(30); HW.skipTalk();
    for (const x of [45, 53, 49, 53, 45]) { walk(HW, x, 27, 3000); strike(HW, 'up'); HW.step(25); }
    ok(HW, HW.Progress.flag('belfry_echo'), 'the lullaby sung'); HW.step(30); HW.skipTalk();
    walk(HW, 49, 25, 3000); act(HW, 'up');
    leave(HW, 29, 53, 'down');
    walk(HW, 158, 8); through(HW, 'up', 'belfry');
    walk(HW, 55, 30, 6000); act(HW, 'right'); note(4);
    leave(HW, 29, 53, 'down');
    /* 5: below the falls: the ferry ridden down over the falls into the pool below, stepped off onto the beach. The beach
       is shut in; a fall into the river takes Wren home to where she was before the ride (until fix round I it brought her
       back to the beach: finding 82). The tour lays the Bedroll at the landing first and goes Homeward to it after, as it
       did when the saves were made */
    HW.warp('hollow', 165, 106); HW.step(10); HW.skipTalk(); walk(HW, 166, 106);
    HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(5); HW.skipTalk();
    ok(HW, HW.Inv.bedroll && HW.Inv.bedroll.tx === 166 && HW.Inv.bedroll.ty === 106, 'the Bedroll laid at the ferry landing');
    const f = HW.G.map.find('mwFerry');
    ok(HW, until(HW, () => f.tx === 167 && f.ty === 106 && !f.mv, 1500), 'the ferry in');
    step(HW, 'right');
    HW.Inv.equipped = 'paddle';
    for (let i = 0; i < 600 && p.ty < 113; i++) { HW.hold(['tool', 'down']); HW.step(1); } HW.release(); HW.step(60);
    for (let i = 0; i < 600 && p.tx < 169; i++) { HW.hold(['tool', 'right']); HW.step(1); } HW.release(); HW.step(4);
    step(HW, 'right'); HW.step(10);
    ok(HW, p.tx === 170 && p.state === 'normal', 'off onto the beach below the falls');
    walk(HW, 172, 115, 2000); act(HW, 'left'); note(5);
    walk(HW, 172, 113, 2000); act(HW, 'down');
    HW.Inv.equipped = 'bedroll'; HW.hold('tool'); HW.step(24); HW.release(); HW.step(80); HW.skipTalk();
    ok(HW, p.tx === 166 && p.ty === 106, 'Homeward, back to the landing');
    HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(5); HW.skipTalk();
    ok(HW, !HW.Inv.bedroll, 'the Bedroll rolled up again');
}

/* ---------------- the Stray House (src/77_strayhouse.js; the steps of tests/strayhouse.test.mjs) ---------------- */
const SR = { po: [20, 33], pa: [20, 22], pt: [0, 22], bg: [40, 22], sh: [20, 11], wh: [0, 11], md: [40, 11], pl: [20, 0], lr: [0, 0] };
const sr = (r, x, y) => [SR[r][0] + x, SR[r][1] + y];
export function strayHouseRooms(HW) {
    const thing = id => HW.G.map.find(id);
    const go = (r, x, y) => walk(HW, ...sr(r, x, y), 4000);
    const pa = (r, x, y, d, n) => pushAt(HW, ...sr(r, x, y), d, n);
    /* the Porch: the eighth note by the door; the stray pushed up into the row of holes, filling one */
    go('po', 13, 9); act(HW, 'up'); ok(HW, HW.Progress.flag('linnet8'), "Linnet's eighth note");
    pa('po', 9, 6, 'up', 2);
    ok(HW, !HW.G.map.kind(...sr('po', 9, 3)).pit, 'a hole in the Porch filled');
    /* the Pantry (west of the Parlour): three strays onto three plates, in the order the shelves allow; the key */
    go('pa', 1, 5); go('pt', 18, 5);
    pa('pt', 12, 5, 'left', 9); pa('pt', 2, 6, 'up', 3);
    pa('pt', 8, 1, 'down', 3); pa('pt', 9, 5, 'left', 6); pa('pt', 2, 4, 'down', 3);
    pa('pt', 8, 8, 'right', 1); pa('pt', 10, 9, 'up', 3); pa('pt', 9, 5, 'right', 6); pa('pt', 16, 6, 'up', 3);
    HW.step(5); go('pt', 16, 7); act(HW, 'down');
    /* the Bridge Garden (east): three into the trench, the fourth over it onto the plate; the key */
    go('bg', 1, 5);
    pa('bg', 6, 3, 'down', 1); pa('bg', 5, 5, 'right', 3);
    pa('bg', 3, 1, 'down', 3); pa('bg', 2, 5, 'right', 7);
    pa('bg', 3, 8, 'up', 2); pa('bg', 2, 5, 'right', 8);
    pa('bg', 5, 9, 'up', 3); pa('bg', 4, 5, 'right', 11); pa('bg', 16, 4, 'down', 2);
    HW.step(5); go('bg', 16, 3); act(HW, 'up');
    ok(HW, HW.Inv.keys('strayhouse') === 2, 'both keys');
    /* the Parlour's north lock: walked into with a key; the Stair Hall: two strays up the column of holes, the Heart Patch */
    go('pa', 9, 1); HW.hold('up'); HW.step(40); HW.release(); HW.step(20);
    go('sh', 9, 9);
    pa('sh', 16, 7, 'left', 2); pa('sh', 13, 8, 'up', 4);
    pa('sh', 5, 7, 'right', 7); pa('sh', 13, 8, 'up', 5);
    go('sh', 13, 2); act(HW, 'up');
    ok(HW, HW.Progress.areaFlag('strayhouse', 'chest:shPatch'), "the Stair Hall's Heart Patch");
    /* the Mending Room (east, through the lock): two strays needled straight onto plates; the third needled out, unpicked
       (a stray again), pushed onto the last; the lever lights the east lamp */
    go('sh', 18, 5); HW.hold('right'); HW.step(40); HW.release(); HW.step(30);
    go('md', 1, 4); HW.face('right'); stitch(HW, 'LLL');
    go('md', 16, 4); HW.face('left'); stitch(HW, 'RRR');
    go('md', 9, 9); HW.face('up'); stitch(HW, 'DRDR');
    go('md', 10, 9); HW.face('right'); HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(3); HW.skipTalk(1); HW.step(5);
    ok(HW, !thing('mdS3').ret, 'unpicked: a stray again');
    HW.push('right', 5); HW.step(10);
    HW.step(5); go('md', 17, 3); go('md', 17, 2); act(HW, 'up');
    ok(HW, thing('mdLever').on, "the Mending Room's lever");
    /* the Washhouse (west of the Stair Hall): two stones in, the tub hooked over, paddled across; the lever */
    go('wh', 18, 5);
    pa('wh', 15, 2, 'down', 2); pa('wh', 16, 5, 'left', 3);
    pa('wh', 15, 8, 'up', 2); pa('wh', 16, 5, 'left', 4);
    go('wh', 11, 5); HW.face('left'); HW.Inv.equipped = 'hook'; HW.press('tool', 1); HW.step(60);
    const tub = thing('whTub'); ok(HW, tub.tx === sr('wh', 10, 5)[0], 'the tub hooked over');
    step(HW, 'left');
    const p = HW.player(); HW.Inv.equipped = 'paddle';
    for (let i = 0; i < 1000 && p.tx > sr('wh', 6, 5)[0]; i++) { HW.hold(['tool', 'left']); HW.step(1); } HW.release(); HW.step(20);
    step(HW, 'left');
    go('wh', 2, 4); act(HW, 'up');
    ok(HW, thing('whLever').on, "the Washhouse's lever");
    /* and back over on the tub (a stray: it stays where it was left) */
    go('wh', 5, 5); step(HW, 'right');
    for (let i = 0; i < 1000 && p.tx < sr('wh', 10, 5)[0]; i++) { HW.hold(['tool', 'right']); HW.step(1); } HW.release(); HW.step(20);
    step(HW, 'right');
    go('sh', 9, 3); HW.step(10);
    ok(HW, thing('shStairs').open, 'the stairs up to the Pile, open');
}
/* the Pile (as tests/strayhouse.test.mjs's first round, a person's way): lured up to the north-west corner nook, slipped
   out of by the nook's slit; while it strains after you in there, a stray pushed up across the nook's open side boxes it
   in. It bursts where it stands, flinging the strays near it about, and stays in the nook: standing anywhere west of its
   middle (x 1) it can go neither way it wants and strains again (150 frames; being boxed is checked even then), so each
   later round is a strain spot first, then the nearest stray pushed straight into the open side (x 3, rows 1-2). God mode
   (nothing can hurt Wren in this game: loadQA) */
/* the four corner nooks (the Pile's 2x2 in the nook at `into`; Wren waits at `wait`, the Pile comes up to `come`, she slips
   out of the slit to `out`, and pushes the nook's own stray from `from` across its open side) */
const NOOKS = [
    { wait: [1, 1], come: [2, 1], out: [1, 4], into: [1, 1], stray: [3, 4], from: [3, 5], d: 'up' },
    { wait: [1, 9], come: [2, 8], out: [1, 6], into: [1, 8], stray: [3, 6], from: [3, 5], d: 'down' },
    { wait: [18, 9], come: [16, 8], out: [18, 6], into: [17, 8], stray: [16, 6], from: [16, 5], d: 'down' },
    { wait: [18, 1], come: [16, 1], out: [18, 4], into: [17, 1], stray: [16, 4], from: [16, 5], d: 'up' },
];
export function thePile(HW) {
    const a = () => HW.G.map, ox = SR.pl[0], oy = SR.pl[1];
    const free = (x, y) => { const k = a().kind(ox + x, oy + y), o = a().at(ox + x, oy + y); return !k.solid && !k.pit && !o; };
    const blk = (x, y) => { const o = a().at(ox + x, oy + y); return o && o.kind === 'block' && !o.removed; };
    const at = (x, y, max = 3000) => walk(HW, ox + x, oy + y, max);
    const dbg = m => { if (process.env.TOUR_DEBUG) console.log(m, 'pile', pile.tx - ox, pile.ty - oy, pile.state, 'hp', pile.hp, 'wren', HW.player().tx - ox, HW.player().ty - oy, 'strays', a().ents.filter(e => e.kind === 'block' && !e.removed && e.tx >= ox && e.tx < ox + 20 && e.ty < 11).map(e => (e.tx - ox) + ',' + (e.ty - oy)).join(' ')); };
    at(9, 9); HW.skipTalk(); HW.step(5); HW.skipTalk();
    const pile = a().ents.find(e => e.kind === 'pile');
    ok(HW, pile && pile.state === 'go', 'the Pile awake');
    const settled = () => until(HW, () => !pile.mv && pile.state !== 'heave' && pile.state !== 'rest', 400);
    const usable = q => blk(...q.stray) && free(...q.wait) && free(...q.out) && free(...q.from)
        && free(q.stray[0], q.stray[1] + (q.d === 'up' ? -1 : 1)) && free(q.stray[0], q.stray[1] + (q.d === 'up' ? -2 : 2))
        && [q.into, q.come].every(([x, y]) => [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dy]) => (x + dx === q.wait[0] && y + dy === q.wait[1]) || free(x + dx, y + dy) || (pile.tx === ox + x + dx || pile.tx + 1 === ox + x + dx) && (pile.ty === oy + y + dy || pile.ty + 1 === oy + y + dy)));
    /* a nook, as round 1 goes (from the middle of the room, if the Pile's somewhere it can't come straight from) */
    const nook = (q, viaMiddle) => {
        if (viaMiddle) { at(9, 6); until(HW, () => Math.abs(pile.tx + 0.5 - (ox + 9)) + Math.abs(pile.ty + 0.5 - (oy + 6)) <= 4, 900); }
        at(...q.wait);
        if (!until(HW, () => pile.tx === ox + q.come[0] && pile.ty === oy + q.come[1] && !pile.mv, 1500)) return false;
        at(...q.out, 600);
        if (!until(HW, () => pile.tx === ox + q.into[0] && pile.ty === oy + q.into[1] && pile.state === 'strain', 300)) return false;
        at(...q.from, 600); HW.push(q.d, 2); HW.step(5);
        return true;
    };
    /* in the north-west nook already (where it bursts), straining while Wren stands west of its middle: a stray close by
       pushed into its open side (3,1)/(3,2) within the strain */
    const inNW = () => pile.tx === ox + 1 && pile.ty === oy + 1;
    const quick = () => {
        const plans = [];
        for (let y = 3; y <= 5; y++) if (blk(3, y)) { let clear = true; for (let k = y - 1; k >= 2; k--) if (!free(3, k)) clear = false; if (clear && free(3, y + 1)) plans.push({ from: [3, y + 1], d: 'up', n: y - 2 }); }
        for (const row of [1, 2]) for (let x = 4; x <= 6; x++) if (blk(x, row)) { let clear = true; for (let k = x - 1; k >= 3; k--) if (!free(k, row)) clear = false; if (clear && free(x + 1, row)) plans.push({ from: [x + 1, row], d: 'left', n: x - 3 }); break; }
        return plans.sort((u, v) => u.n - v.n)[0];
    };
    for (let round = 1; round <= 3 && pile.alive; round++) {
        const hp = pile.hp;
        for (let tries = 0; pile.alive && pile.hp === hp; tries++) {
            ok(HW, tries < 8, 'boxed in at last, round ' + round);
            settled(); dbg('round ' + round + ' try ' + tries);
            const qp = round > 1 && inNW() && quick();
            if (qp) {
                at(1, 4, 600);
                if (!until(HW, () => pile.state === 'strain' && pile.st < 10, 600)) continue;
                at(qp.from[0], qp.from[1], 600); HW.push(qp.d, qp.n); HW.step(5);
            } else {
                /* a nook it will really come to: its own rule played forward (toward Wren, the longer way first, else the
                   other; stuck when neither is open), from where it stands to Wren waiting in the nook, or by way of a
                   spot in the open first */
                const sim = (sx, sy, w) => {
                    let x = sx, y = sy;
                    const open = (nx, ny) => [[nx, ny], [nx + 1, ny], [nx, ny + 1], [nx + 1, ny + 1]].every(([u, v]) => (u >= x && u <= x + 1 && v >= y && v <= y + 1) || free(u, v));
                    for (let k = 0; k < 80; k++) {
                        const dx = w[0] - (x + 0.5), dy = w[1] - (y + 0.5), H = dx < 0 ? [-1, 0] : [1, 0], V = dy < 0 ? [0, -1] : [0, 1];
                        let moved = false;
                        for (const [ux, uy] of Math.abs(dx) >= Math.abs(dy) ? [H, V] : [V, H]) {
                            const nx = x + ux, ny = y + uy;
                            const onW = [[nx, ny], [nx + 1, ny], [nx, ny + 1], [nx + 1, ny + 1]].some(([u, v]) => u === w[0] && v === w[1]);
                            if (onW) { if (open(nx, ny)) return [x, y]; continue; }
                            if (open(nx, ny)) { x = nx; y = ny; moved = true; break; }
                        }
                        if (!moved) return [x, y];
                    }
                    return [x, y];
                };
                const px = pile.tx - ox, py = pile.ty - oy;
                const reaches = (q, from) => { const [x, y] = sim(from[0], from[1], q.wait); return x === q.come[0] && y === q.come[1]; };
                let plan = null;
                for (const i of [0, 1, 2, 3]) { const q = NOOKS[i]; if (usable(q) && reaches(q, [px, py])) { plan = { q }; break; } }
                if (!plan) for (const w of [[9, 6], [9, 4], [5, 5], [14, 5], [9, 8], [9, 2], [5, 8], [14, 8], [5, 2], [14, 2]]) {
                    if (!free(...w)) continue;
                    const [x, y] = sim(px, py, w);
                    if (Math.abs(x + 0.5 - w[0]) + Math.abs(y + 0.5 - w[1]) > 3) continue;
                    const i = [0, 1, 2, 3].find(j => usable(NOOKS[j]) && reaches(NOOKS[j], [x, y]));
                    if (i !== undefined) { plan = { q: NOOKS[i], via: w, at: [x, y] }; break; }
                }
                ok(HW, plan, 'a nook it can be led into, round ' + round);
                dbg('  plan ' + JSON.stringify(plan));
                try {
                    if (plan.via) { at(...plan.via); until(HW, () => pile.tx === ox + plan.at[0] && pile.ty === oy + plan.at[1] && !pile.mv, 1500); }
                    nook(plan.q, false);
                } catch (e) { if (process.env.TOUR_DEBUG) console.log('  (' + e.message + ')'); }
            }
            until(HW, () => pile.hp < hp || !pile.alive, 200);
        }
    }
    ok(HW, !pile.alive && HW.Progress.flag('sh_pile'), 'the Pile comes apart');
    for (let i = 0; i < 10; i++) { HW.skipTalk(); HW.step(20); }
    /* the Heartstitch where it came apart: beaten in a corner nook, the two strays it drops can wall it in (then it waits
       in the middle of the room the next time the House is built: out through the Porch and in again) */
    const h = a().ents.find(e => e.id === 'pileHeart');
    ok(HW, h, 'the Heartstitch');
    const hx = Math.floor((h.x + 8) / 16), hy = Math.floor((h.y + 8) / 16), p = HW.player();
    const reach = !!HW.global('playerPath')(a(), p.tx, p.ty, hx, hy);
    if (reach) { walk(HW, hx, hy, 3000); HW.step(10); HW.skipTalk(); }
    /* Linnet's Room, west: her bracelet */
    walk(HW, ...sr('pl', 1, 5), 3000); walk(HW, ...sr('lr', 9, 6), 3000); act(HW, 'down');
    ok(HW, HW.Inv.items.bracelet, "Linnet's bracelet");
    if (!reach) {
        leave(HW, ...sr('po', 9, 9), 'down');
        walk(HW, 72, 7); HW.face('up'); HW.press('act', 1); HW.step(3); HW.skipTalk(); HW.step(60); HW.skipTalk();
        ok(HW, HW.G.map.id === 'strayhouse', 'in again');
        const h2 = a().ents.find(e => e.id === 'pileHeart');
        ok(HW, h2, 'the Heartstitch, waiting');
        walk(HW, Math.floor((h2.x + 8) / 16), Math.floor((h2.y + 8) / 16), 6000); HW.step(10); HW.skipTalk();
    }
    ok(HW, HW.Progress.areaFlag('strayhouse', 'got:pileHeart'), 'the Heartstitch picked up');
    return reach;
}

/* ---------------- the Unfinished House (src/78_unfinished.js; the steps of tests/unfinished.test.mjs) ---------------- */
const UR = { fr: [20, 33], ha: [20, 22], lg: [0, 22], fs: [0, 11], lb: [40, 22], ga: [20, 11] };
const ur = (r, x, y) => [UR[r][0] + x, UR[r][1] + y];
export function unfinishedRooms(HW) {
    const go = (r, x, y) => walk(HW, ...ur(r, x, y), 4000);
    const piece = id => HW.G.map.ents.find(e => e.kind === 'chalk' && e.id === id);
    /* the Front Room: the chalk plank sewn real, and over */
    go('fr', 9, 6); sew(HW, 'up'); ok(HW, piece('frBridge').sewn, 'the first plank sewn');
    go('fr', 9, 2);
    /* the Long Gap (west of the Drafting Hall): two sewn from the bank, the third from between, the fourth from between
       (the oldest undone behind you); the lever lights the west lamp */
    go('lg', 18, 5);
    go('lg', 14, 5); sew(HW, 'left'); sew(HW, 'left', 1);
    go('lg', 11, 5); sew(HW, 'left', 1);
    go('lg', 8, 5); sew(HW, 'left', 1);
    ok(HW, piece('lgD').sewn && !piece('lgA').sewn, 'the fourth undoes the first');
    go('lg', 2, 7); act(HW, 'down');
    ok(HW, HW.G.map.find('lgLever').on, "the Long Gap's lever");
    /* the Far Shelf (north of it): four planks side by side; stand on the second when the fourth undoes the first; the
       Heart Patch; back by unpicking the second and sewing it again, so the third is the one that goes, behind you */
    go('fs', 2, 9);
    go('fs', 9, 5); sew(HW, 'right'); sew(HW, 'right', 1); sew(HW, 'right', 1);
    go('fs', 11, 5); sew(HW, 'right', 1);
    go('fs', 17, 4); act(HW, 'up');
    ok(HW, HW.Progress.areaFlag('unfinished', 'chest:fsPatch'), "the Far Shelf's Heart Patch");
    go('fs', 12, 5); sew(HW, 'left', 0); sew(HW, 'left');
    go('fs', 11, 5); sew(HW, 'left');
    go('fs', 9, 5);
    /* back east over the Long Gap: its planks went as others were sewn; sewn again from the west bank the same way */
    go('lg', 3, 5); sew(HW, 'right'); sew(HW, 'right', 1);
    go('lg', 6, 5); sew(HW, 'right', 1);
    go('lg', 9, 5); sew(HW, 'right', 1);
    go('lg', 18, 5);
    /* the Loading Bay (east): one gap filled for good with a stray, the other three sewn, the other stray pushed over onto
       the plate (the east lamp) */
    go('lb', 1, 5);
    pushAt(HW, ...ur('lb', 5, 2), 'down', 2); pushAt(HW, ...ur('lb', 4, 5), 'right', 3);
    ok(HW, !HW.G.map.kind(...ur('lb', 8, 5)).pit, 'one gap filled for good');
    go('lb', 8, 5); sew(HW, 'right'); sew(HW, 'right', 1); sew(HW, 'right', 1);
    pushAt(HW, ...ur('lb', 5, 8), 'up', 2); pushAt(HW, ...ur('lb', 4, 5), 'right', 10);
    HW.step(5);
    ok(HW, HW.global('Signals').eval(HW.G.map, 'ufW&ufE'), 'both lamps lit');
    go('ha', 9, 2); HW.step(10);
    ok(HW, HW.G.map.find('ufStairs').open, 'the stairs up to the Gallery, open');
}
/* the Gallery: Mr Ives walks to his chair; each plank sewn from the walkway below as he reaches its gap */
export function ivesWalk(HW) {
    const go = (r, x, y) => walk(HW, ...ur(r, x, y), 4000);
    go('ga', 9, 8);
    const w = HW.G.map.find('ivesWalk');
    for (const x of [3, 6, 9, 12, 15]) {
        ok(HW, until(HW, () => w.tx === ur('ga', x - 1, 0)[0] && !w.mv, 900), `Mr Ives at the gap at ${x}`);
        go('ga', x, 7); sew(HW, 'up');
        ok(HW, until(HW, () => w.tx > ur('ga', x, 0)[0], 300), `Mr Ives over the plank at ${x}`);
    }
    ok(HW, until(HW, () => HW.Progress.flag('ives_done'), 400), 'Mr Ives at his chair');
    for (let i = 0; i < 10; i++) { HW.skipTalk(); HW.step(20); }
    ok(HW, HW.Inv.items.longhook, 'the Long Hook');
}

/* ---------------- the segments ---------------- */
export const SEGMENTS = [
    {
        id: 'E1', from: 'T08', what: 'After House 1: home to tell Gran (as the goal line says), then the two town activities the first Knot opens',
        run(HW, mark) {
            /* up the road from Meadowfold into the square, to Gran by the Well */
            walk(HW, 93, 61); act(HW, 'up');
            ok(HW, (HW.Progress.get('granTalk') || 0) >= 1, 'Gran told');
            mark('T59', 'After House 1, home: Gran told, in the town square (her after-the-first-Knot lines).');
            /* the kids' game: Otto on his chalk X, the two crates; Wren beside the first crate, nothing touched */
            walk(HW, 97, 57); HW.face('right'); HW.step(5);
            ok(HW, HW.G.map.ents.some(e => e.kind === 'npc' && e.who === 'otto' && e.constructor.name === 'KidKeeper'), 'Otto playing Housekeeper');
            mark('T60', "The kids' game in the square (Housekeeper, secret S12): Otto on his X, both crates home; Wren beside the north-west crate.");
            /* the Inn, and up its attic stairs: the Tidiness Trials' first room */
            walk(HW, 108, 53); through(HW, 'up', 'inn');
            walk(HW, 1, 3); through(HW, 'up', 'inn_attic');
            mark('T61', "The Tidiness Trials (secret S28), the Inn's attic: at the top of the stairs, none tried.");
        },
    },
    {
        id: 'E2', from: 'T28', what: 'After House 5: the clinic visit the goal line suggests',
        run(HW, mark) {
            /* back over the stream (the way LEG6 goes), along the road into town, to the clinic */
            walk(HW, 139, 51); HW.hold('left'); until(HW, () => HW.player().ty >= 54 && HW.player().state === 'normal', 150); HW.release();
            walk(HW, 121, 53); through(HW, 'up', 'clinic');
            walk(HW, 6, 4); act(HW, 'up');
            ok(HW, HW.Progress.flag('mallow_d5'), 'Doctor Mallow heard about the Slumberhouse');
            mark('T62', "After House 5: the clinic visited, Doctor Mallow's after-the-Slumberhouse lines heard (mallow_d5).");
        },
    },
    {
        id: 'E3', from: 'T23', what: "After House 4: the Knotting Festival, then the festival's ball game (Returnball)",
        run(HW, mark) {
            /* home from the Belfry (the way down from the Heights is the way up: LEG5 hops it too), into the square: the
               festival plays (it ends pointing at Returnball, by the bakery) */
            HW.warp('hollow', 94, 74); HW.step(10); HW.skipTalk();
            walk(HW, 95, 64); HW.step(5);
            until(HW, () => { HW.skipTalk(); return HW.Progress.flag('festival') && !HW.Script.blocking() && !HW.G.hideHud; }, 4000);
            ok(HW, HW.Progress.flag('festival'), 'the festival');
            settle(HW);
            /* to the court east of the south road: beside the ball, nothing thrown */
            walk(HW, 99, 74); HW.face('right'); HW.step(5);
            mark('T63', "Returnball (secret S29), after the festival: Wren beside the ball on the court east of the south road, nothing thrown yet.");
        },
    },
    {
        id: 'E4', from: 'T49', what: "After House 8: Linnet's Trail, the Stray House, the Unfinished House, then on to the end along LEG9's route",
        run(HW, mark) {
            linnetTrail(HW);
            /* the Stray House's door, at the Frayed Edge: seven notes, nothing posted yet */
            HW.warp('hollow', 72, 9); HW.step(10); HW.skipTalk();
            walk(HW, 72, 7); HW.face('up');
            ok(HW, [1, 2, 3, 4, 5, 6, 7].every(n => HW.Progress.flag('linnet' + n)) && !HW.Progress.flag('strayhouse_open'), 'seven notes, the door still shut');
            mark('T64', "Linnet's Trail done (notes 1-7) after House 8: at the Stray House's door at the Frayed Edge, nothing posted yet.");
            HW.press('act', 1); HW.step(3); HW.skipTalk(0); HW.step(60); HW.skipTalk();
            ok(HW, HW.G.map.id === 'strayhouse' && HW.Progress.flag('strayhouse_open'), 'posted through: in');
            mark('T65', 'The Stray House: just inside, on the Porch (the notes posted, the door open for good).');
            strayHouseRooms(HW);
            mark('T66', 'The Stray House: both lamps lit, in the Stair Hall with the stairs up to the Pile open (its Heart Patch taken).');
            const nearIt = thePile(HW);
            mark('T67', `The Stray House done: the Pile beaten, Linnet's bracelet and the Pile's Heartstitch taken (${nearIt ? 'in the Pile\'s room' : 'walled in where it came apart, so fetched after going out and in again: in the Pile\'s room'}).`);
            /* out through the Porch; to Mr Ives's door in town (the Needle and the Loom done: he lets you in) */
            leave(HW, 29, 42, 'down');
            HW.warp('hollow', 120, 48); HW.step(10); HW.skipTalk();
            walk(HW, 120, 46); HW.face('up');
            ok(HW, !HW.Progress.flag('ives_in'), 'not in yet');
            mark('T68', "The Unfinished House: at Mr Ives's door in town (up the bank east of the river), the Stray House done, not yet in.");
            HW.press('act', 1); HW.step(3); HW.skipTalk(); HW.step(60); HW.skipTalk();
            ok(HW, HW.G.map.id === 'unfinished', 'in');
            mark('T69', 'The Unfinished House: just inside, in the Front Room (Mr Ives there; nothing sewn).');
            unfinishedRooms(HW);
            ivesWalk(HW);
            mark('T70', "The Unfinished House done: Mr Ives at his chair in the Gallery, the Long Hook given (its Far Shelf's Heart Patch taken).");
            /* out: down through the Drafting Hall; the Front Room's plank sewn again from the far side, and over */
            walk(HW, ...ur('fr', 9, 3), 6000); sew(HW, 'down');
            leave(HW, ...ur('fr', 9, 9), 'down');
            /* on to the end along LEG9's route, from where it starts (the Loom's door): the Frayed Edge, the Drift, Linnet, the
               Great Pull, the seed, the Well, the Great Spool, the Top. (LEG9 clears the Needle's stitches as it starts, as the
               main path's recording did) */
            const said = [], D = HW.global('Dialog'), open0 = D.open;
            D.open = function (who, text, opts) { said.push(String(text)); return open0.call(this, who, text, opts); };
            HW.warp('hollow', 95, 10); HW.step(10); HW.skipTalk();
            LEG9(HW, () => { });
            D.open = open0;
            ok(HW, said.some(l => /bracelet/.test(l)), 'the ending with the bracelet');
            HW.step(120);
            mark('T71', "After the ending with everything optional done on the way (all of Linnet's notes, both optional Houses, the bracelet ending): the free valley.");
        },
    },
    /* the three saves before a boss that load beside a Bedroll a room or more away: the Bedroll rolled up and laid again by
       the boss's door, as a careful player would before going in */
    {
        id: 'E5', from: 'T27', what: "House 5: the Bedroll fetched from the Long Ward and laid by Mother Sloth's door",
        run(HW, mark) { bedrollToDoor(HW, 'slumber', [29, 12]); mark('T72', 'House 5 (the Slumberhouse): the Bedroll laid by the boss\'s door, in the Landing (the big door still shut; the Pattern in hand).'); },
    },
    {
        id: 'E6', from: 'T32', what: 'House 6: the Bedroll fetched from the Rehearsal Room and laid by the Great Stage\'s door',
        run(HW, mark) { bedrollToDoor(HW, 'marionette', [29, 12]); mark('T73', "House 6 (the Marionette Hall): the Bedroll laid by the boss's door, in the Wings (the big door still shut; the Pattern in hand)."); },
    },
    {
        id: 'E7', from: 'T57', what: 'The Great Spool: the Bedroll fetched from the Night Ferry, up the Climb, laid by the door to the Top',
        run(HW, mark) {
            bedrollToDoor(HW, 'greatspool', null);
            /* up the Climb as a person who watches the lanes (tests/legs.mjs) */
            walk(HW, 29, 16, 6000); climbWatching(HW, [20, 11]);
            ok(HW, HW.player().ty === 12 && !(HW.Stats.c['climb:hit'] > 0), 'up the Climb, never caught');
            walk(HW, 29, 12, 600); HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(5); HW.skipTalk();
            ok(HW, HW.Inv.bedroll && HW.Inv.bedroll.tx === 29 && HW.Inv.bedroll.ty === 12, 'laid at the top of the Climb');
            mark('T74', 'The Great Spool: the Bedroll laid by the boss\'s door, at the top of the Climb (the way to the Top open).');
        },
    },
];
/* roll the Bedroll up where Wren loads beside it, then (with a tile given) walk to that tile and lay it there */
function bedrollToDoor(HW, area, tile) {
    ok(HW, HW.G.map.id === area && HW.global('Bedroll').near(HW.player()), 'beside the Bedroll');
    HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(5); HW.skipTalk();
    ok(HW, !HW.Inv.bedroll, 'the Bedroll rolled up');
    if (!tile) return;
    walk(HW, tile[0], tile[1], 8000); HW.face('up');
    HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(5); HW.skipTalk();
    ok(HW, HW.Inv.bedroll && HW.Inv.bedroll.area === area && HW.Inv.bedroll.tx === tile[0] && HW.Inv.bedroll.ty === tile[1], 'laid by the door');
}

/* ---------------- the command line ---------------- */
const QUIET = HW => {
    const G = HW.G, UI = HW.global('UI'), Cam = HW.global('Cam'), p = G.player;
    return G.scene === 'play' && !UI.menu && !HW.Script.blocking() && !HW.Dialog.active && !Cam.busy && p && p.state === 'normal'
        && !p.carry && !p.grip && !G.winch && !G.credits && !G.hideHud;
};
const SETTLE = 30;
export function runSegment(seg, code, onMark) {
    const HW = loadQA(), G = HW.G, Cam = HW.global('Cam'), Progress = HW.Progress, Inv = HW.Inv;
    HW.global('Game').load(HW.Save.fromCode(code)); HW.step(5); HW.skipTalk();
    let lastFlags = [];
    const set0 = Progress.set.bind(Progress), sa0 = Progress.setAreaFlag.bind(Progress);
    Progress.set = function (f, v) { if (!Progress.flags[f]) lastFlags.push(f); return set0(f, v); };
    Progress.setAreaFlag = function (a, f, v) { if (!Progress.areaFlag(a, f)) lastFlags.push(a + '/' + f); return sa0(a, f, v); };
    const mark = (label, what) => {
        /* free to move, and held still for half a second */
        let still = 0;
        for (let t = 0; t < 3000 && still < SETTLE; t++) {
            if (HW.Dialog.active) HW.skipTalk();
            HW.step(1);
            still = QUIET(HW) ? still + 1 : 0;
        }
        ok(HW, still >= SETTLE, 'never free to move for ' + label);
        const room = Cam.room, key = room && room.key !== undefined ? room.key : null;
        const s = HW.Save.snapshot();
        const cap = {
            label, what, segment: seg.id, from: seg.from, leg: null, t: G.t, area: G.map.id, key, roomName: room && room.name || null,
            region: G.regionName || null, house: !!G.map.def.house, tx: G.player.tx, ty: G.player.ty, flags: lastFlags.slice(),
            knots: Inv.knots.length, tools: Inv.tools.slice(), hp: Inv.hp, maxHp: Inv.maxHp, goal: Progress.goal, lastOk: '',
            save: JSON.parse(JSON.stringify(s)),
        };
        lastFlags = [];
        onMark(cap, HW);
    };
    seg.run(HW, mark);
    return HW;
}

if (import.meta.url === new URL('file://' + path.resolve(process.argv[1] || '')).href) {
    const [savesFile, outDir] = process.argv.slice(2);
    if (!savesFile || !outDir) { console.error('usage: node tools/qa_tour.mjs SAVES_JSON OUTDIR [--only E1,E2]'); process.exit(1); }
    const k = process.argv.indexOf('--only'), only = k > 0 ? process.argv[k + 1].split(',') : null;
    const saves = JSON.parse(fs.readFileSync(savesFile, 'utf8'));
    fs.mkdirSync(outDir, { recursive: true });
    const file = fs.openSync(path.join(outDir, 'caps_tour.jsonl'), 'w');
    let n = 0, bad = 0;
    const t0 = Date.now();
    for (const seg of SEGMENTS) {
        if (only && !only.includes(seg.id)) continue;
        const from = saves.find(s => s.id === seg.from);
        if (!from) { console.error(`${seg.id}: no save ${seg.from}`); bad++; continue; }
        try {
            const HW = runSegment(seg, from.code, (cap, H) => {
                fs.writeSync(file, JSON.stringify(cap) + '\n'); n++;
                console.log(`  ${cap.label} ${cap.area}${cap.key ? '/' + cap.key : ''} ${cap.roomName || cap.region || ''} (${cap.tx},${cap.ty}): ${cap.what}`);
            });
            if (HW.ERRORS.length) { bad++; console.error(`${seg.id}: game errors:\n${HW.ERRORS.join('\n')}`); }
            else console.log(`${seg.id} (from ${seg.from}) done, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
        } catch (e) { bad++; console.error(`${seg.id} (from ${seg.from}) failed: ${e.stack || e}`); }
    }
    fs.closeSync(file);
    console.log(`${n} saves recorded; ${bad ? bad + ' segment(s) failed' : 'every segment played through with no errors'}`);
    process.exit(bad ? 1 : 0);
}
