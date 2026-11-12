// Save states for the optional content and the other paths (the QA kit; tools/qa_record.mjs records the main path).
// Each segment starts from a save of the main path's catalogue (its code loaded into a fresh headless game) and plays on
// through the game's own rules, as tests/legs.mjs does: walking, pushing, lifting, talking, the tools; fights with
// HW.hitEnemy (the stand-in for aiming) and god mode only while a fight lasts; hops between places to save the walk.
// Nothing is set up by hand: every flag and thing comes from the game's own logic. mark(id, what) takes a save once
// Wren is free to move and has held still for half a second (as tools/qa_record.mjs does).
//   node tools/qa_tour.mjs SAVES_JSON OUTDIR [--only T1,T2]   writes OUTDIR/caps_tour.jsonl (one line per mark)
import fs from 'node:fs';
import path from 'node:path';
import { loadGame } from '../tests/harness.mjs';
import { climbWatching, spoolTop } from '../tests/legs.mjs';

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
    /* 5: below the falls: the ferry ridden down over the falls into the pool below, stepped off onto the beach */
    HW.warp('hollow', 165, 106); HW.step(10); HW.skipTalk(); walk(HW, 166, 106);
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
/* the Pile: lured into a corner nook, slipped out of by the nook's slit, and boxed in with the stray beside it while it
   strains after you (three times; the strays fly about when it bursts, so each round takes a nook whose stray is still
   where it began). God mode for the fight only */
const PILE_ORDER = [0, 1, 2, 3];
const NOOKS = [
    { wait: [1, 1], come: [2, 1], out: [1, 4], into: [1, 1], stray: [3, 4], from: [3, 5], d: 'up' },
    { wait: [18, 1], come: [16, 1], out: [18, 4], into: [17, 1], stray: [16, 4], from: [16, 5], d: 'up' },
    { wait: [1, 9], come: [2, 8], out: [1, 6], into: [1, 8], stray: [3, 6], from: [3, 5], d: 'down' },
    { wait: [18, 9], come: [16, 8], out: [18, 6], into: [17, 8], stray: [16, 6], from: [16, 5], d: 'down' },
];
export function thePile(HW, order = PILE_ORDER) {
    const a = () => HW.G.map, ox = SR.pl[0], oy = SR.pl[1];
    HW.G.cheats.god = true;
    walk(HW, ...sr('pl', 9, 9), 3000); HW.skipTalk(); HW.step(5); HW.skipTalk();
    const pile = a().ents.find(e => e.kind === 'pile');
    ok(HW, pile && pile.state === 'go', 'the Pile awake');
    const used = new Set();
    for (let round = 0; round < 3 && pile.alive; round++) {
        until(HW, () => !pile.mv && pile.state !== 'heave' && pile.state !== 'rest', 300);
        const free = (x, y) => { const k = a().kind(ox + x, oy + y), o = a().at(ox + x, oy + y); return !k.solid && !k.pit && !o; };
        const blk = (x, y) => { const o = a().at(ox + x, oy + y); return o && o.kind === 'block'; };
        const n = order.find(i => !used.has(i) && (q => blk(...q.stray) && free(...q.wait) && free(...q.out) && free(...q.from)
            && free(q.stray[0], q.stray[1] + (q.d === 'up' ? -1 : 1)) && free(q.stray[0], q.stray[1] + (q.d === 'up' ? -2 : 2))
            && !(pile.tx - ox <= q.wait[0] && pile.tx - ox + 1 >= q.wait[0] - 1 && Math.abs(pile.ty - oy - q.wait[1]) <= 2))(NOOKS[i]));
        ok(HW, n !== undefined, 'a nook to lure the Pile into, round ' + (round + 1));
        const q = NOOKS[n]; used.add(n);
        if (process.env.TOUR_DEBUG) console.log('round', round + 1, 'nook', n, 'pile', pile.tx - ox, pile.ty - oy, pile.state, 'hp', pile.hp, 'strays', a().ents.filter(e => e.kind === 'block' && !e.removed).map(e => (e.tx - ox) + ',' + (e.ty - oy)).join(' '));
        walk(HW, ox + q.wait[0], oy + q.wait[1], 3000);
        ok(HW, until(HW, () => pile.tx === ox + q.come[0] && pile.ty === oy + q.come[1] && !pile.mv, 1500), 'it comes after you, up to the nook');
        walk(HW, ox + q.out[0], oy + q.out[1], 600);
        ok(HW, until(HW, () => pile.tx === ox + q.into[0] && pile.ty === oy + q.into[1] && pile.state === 'strain', 300), 'into the nook after you, and stuck');
        const hp = pile.hp;
        walk(HW, ox + q.from[0], oy + q.from[1], 600); HW.push(q.d, 2); HW.step(5);
        ok(HW, until(HW, () => pile.hp < hp || !pile.alive, 300), 'boxed in: it bursts');
        HW.step(80);
    }
    ok(HW, !pile.alive && HW.Progress.flag('sh_pile'), 'the Pile comes apart');
    for (let i = 0; i < 10; i++) { HW.skipTalk(); HW.step(20); }
    HW.G.cheats.god = false;
    /* the Heartstitch where it came apart */
    const h = a().ents.find(e => e.id === 'pileHeart');
    ok(HW, h, 'the Heartstitch');
    walk(HW, Math.floor((h.x + 8) / 16), Math.floor((h.y + 8) / 16), 3000); HW.step(10); HW.skipTalk();
    ok(HW, HW.Progress.areaFlag('strayhouse', 'got:pileHeart'), 'the Heartstitch picked up');
    /* Linnet's Room, west: her bracelet */
    walk(HW, ...sr('pl', 1, 5), 3000); walk(HW, ...sr('lr', 9, 6), 3000); act(HW, 'down');
    ok(HW, HW.Inv.items.bracelet, "Linnet's bracelet");
}

/* ---------------- the segments ---------------- */
export const SEGMENTS = [
    {
        id: 'T1', from: 'S08', what: 'After House 1: home to tell Gran (as the goal line says), then the two town activities the first Knot opens',
        run(HW, mark) {
            /* up the road from Meadowfold into the square, to Gran by the Well */
            walk(HW, 93, 61); act(HW, 'up');
            ok(HW, (HW.Progress.get('granTalk') || 0) >= 1, 'Gran told');
            mark('S59', 'After House 1, home: Gran told, in the town square (her after-the-first-Knot lines).');
            /* the kids' game: Otto on his chalk X, the two crates; Wren beside the first crate, nothing touched */
            walk(HW, 97, 57); HW.face('right'); HW.step(5);
            ok(HW, HW.G.map.ents.some(e => e.kind === 'npc' && e.who === 'otto' && e.constructor.name === 'KidKeeper'), 'Otto playing Housekeeper');
            mark('S60', "The kids' game in the square (Housekeeper, S12): Otto on his X, both crates home; Wren beside the north-west crate.");
            /* the Inn, and up its attic stairs: the Tidiness Trials' first room */
            walk(HW, 108, 53); through(HW, 'up', 'inn');
            walk(HW, 1, 3); through(HW, 'up', 'inn_attic');
            mark('S61', "The Tidiness Trials (S28), the Inn's attic: at the top of the stairs, none tried.");
        },
    },
    {
        id: 'T2', from: 'S28', what: 'After House 5: the clinic visit the goal line suggests',
        run(HW, mark) {
            /* back over the stream (the way LEG6 goes), along the road into town, to the clinic */
            walk(HW, 139, 51); HW.hold('left'); until(HW, () => HW.player().ty >= 54 && HW.player().state === 'normal', 150); HW.release();
            walk(HW, 121, 53); through(HW, 'up', 'clinic');
            walk(HW, 6, 4); act(HW, 'up');
            ok(HW, HW.Progress.flag('mallow_d5'), 'Doctor Mallow heard about the Slumberhouse');
            mark('S62', "After House 5: the clinic visited, Doctor Mallow's after-the-Slumberhouse lines heard (mallow_d5).");
        },
    },
    {
        id: 'T3', from: 'S23', what: "After House 4: the Knotting Festival, then the festival's ball game (Returnball)",
        run(HW, mark) {
            /* into the square: the festival plays (it ends pointing at Returnball, by the bakery) */
            walk(HW, 95, 64); HW.step(5);
            until(HW, () => { HW.skipTalk(); return HW.Progress.flag('festival') && !HW.Script.blocking() && !HW.G.hideHud; }, 4000);
            ok(HW, HW.Progress.flag('festival'), 'the festival');
            settle(HW);
            /* to the court east of the south road: beside the ball, nothing thrown */
            walk(HW, 99, 74); HW.face('right'); HW.step(5);
            mark('S63', "Returnball (S29), after the festival: Wren beside the ball on the court east of the south road, nothing thrown yet.");
        },
    },
    {
        id: 'T4', from: 'S49', what: "After House 8: Linnet's Trail, the Stray House, the Unfinished House, then on to the end along LEG9's route",
        run(HW, mark) {
            linnetTrail(HW);
            /* the Stray House's door, at the Frayed Edge: seven notes, nothing posted yet */
            HW.warp('hollow', 72, 9); HW.step(10); HW.skipTalk();
            walk(HW, 72, 7); HW.face('up');
            ok(HW, [1, 2, 3, 4, 5, 6, 7].every(n => HW.Progress.flag('linnet' + n)) && !HW.Progress.flag('strayhouse_open'), 'seven notes, the door still shut');
            mark('S64', "Linnet's Trail done (notes 1-7) after House 8: at the Stray House's door at the Frayed Edge, nothing posted yet.");
            HW.press('act', 1); HW.step(3); HW.skipTalk(0); HW.step(60); HW.skipTalk();
            ok(HW, HW.G.map.id === 'strayhouse' && HW.Progress.flag('strayhouse_open'), 'posted through: in');
            mark('S65', 'The Stray House: just inside, on the Porch (the notes posted, the door open for good).');
            strayHouseRooms(HW);
            mark('S66', 'The Stray House: both lamps lit, in the Stair Hall with the stairs up to the Pile open (its Heart Patch taken).');
            thePile(HW);
            mark('S67', "The Stray House done: the Pile beaten, its Heartstitch taken; in Linnet's Room with her bracelet.");
        },
    },
];

/* ---------------- the command line ---------------- */
const QUIET = HW => {
    const G = HW.G, UI = HW.global('UI'), Cam = HW.global('Cam'), p = G.player;
    return G.scene === 'play' && !UI.menu && !HW.Script.blocking() && !HW.Dialog.active && !Cam.busy && p && p.state === 'normal'
        && !p.carry && !p.grip && !G.winch && !G.credits && !G.hideHud;
};
const SETTLE = 30;
export function runSegment(seg, code, onMark) {
    const HW = loadGame(), G = HW.G, Cam = HW.global('Cam'), Progress = HW.Progress, Inv = HW.Inv;
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
    G.cheats.god = false;
    return HW;
}

if (import.meta.url === new URL('file://' + path.resolve(process.argv[1] || '')).href) {
    const [savesFile, outDir] = process.argv.slice(2);
    if (!savesFile || !outDir) { console.error('usage: node tools/qa_tour.mjs SAVES_JSON OUTDIR [--only T1,T2]'); process.exit(1); }
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
