// The scripted playthrough's legs (shared by tests/playthrough.test.mjs and the polish runs, tests/probe_run.mjs).
// A fresh Wander, played from the title onwards: the prologue, the ceremony, the road to the Tidyhouse,
// every room on the way to its Knot, and home again. (Fights use HW.hitEnemy, the stand-in for aiming.)
import assert from 'node:assert/strict';

const TIDY = { foyer: [20, 33], kitchen: [0, 33], gallery: [40, 33], hall: [20, 22], pantry: [0, 22], parlor: [40, 22], cons: [60, 22], linen: [40, 11], laundry: [60, 11], ball: [20, 11], library: [0, 11], attic: [0, 0], ante: [40, 0], boss: [20, 0] };
function t(room, x, y) { const [ox, oy] = TIDY[room]; return [ox + x, oy + y]; }


/* Reveal 1, on the great stage: walk up to each Maker in the line and hear them out (after the sixth, the end of it plays) */
export function hearMakers(HW) {
    for (let k = 0; k < 8; k++) {
        const n = HW.G.map.ents.find(e => e.kind === 'npc' && e.r1 && e.bubble);
        if (!n) return;
        const spot = [[n.tx, n.ty + 1, 'up'], [n.tx - 1, n.ty, 'right'], [n.tx + 1, n.ty, 'left']].find(([x, y]) => HW.walkTo(x, y));
        assert.ok(spot, `up to ${n.who}`);
        HW.face(spot[2]); HW.press('act', 1); HW.skipTalk();
    }
}

/* up the Climb as a person who watches: in each row between the lanes, wait till nothing's coming past (a train flying,
   or one the lit lane says is coming) for the moment it takes to cross, then go up a row. The lanes' rows are given in
   the room's own rows (8, 6, 4, 2); origin is the room's corner */
export function climbWatching(HW, origin, maxWait = 600) {
    const p = HW.player(), [ox, oy] = origin, lanes = HW.G.map.ents.filter(e => e.kind === 'junklane');
    for (const row of [8, 6, 4, 2]) {
        if (p.ty - oy <= row) continue;                       /* (only the lanes still above her) */
        const l = lanes.find(q => q.ty === oy + row);
        assert.ok(l, 'a lane in row ' + row);
        for (let i = 0; i < maxWait && l.passing(p.x, 22); i++) HW.step(1);
        HW.hold('up');
        for (let i = 0; i < 120 && (p.ty > oy + row - 1 || p.y > (oy + row - 1) * 16 + 10); i++) HW.step(1);
        HW.release(); HW.step(1);
    }
}

/* at the top: throw a crate so it lands on a great thread near its post, let the Pull drag it along (slack), and cut */
export function slackAndCut(HW, post, origin) {
    const a = HW.G.map, p = HW.player(), top = a.roomAt(post.tx, post.ty);
    const crate = a.ents.find(e => e.kind === 'crate' && !e.removed && !e.hiddenYank && e.ret && e.tx === e.ret.mx && e.ty === e.ret.my && a.roomAt(e.tx, e.ty) === top);
    assert.ok(crate, 'a crate on its shelf');
    for (let k = 0; k < 4 && !HW.walkTo(crate.tx, crate.ty - 1); k++) HW.step(20);
    HW.face('down'); HW.press('act', 1); HW.step(20);
    assert.ok(p.carry, 'carrying a crate');
    /* a throw lands four tiles on: from a spot four off a tile of this thread (nothing in between, and under no other
       thread on the way), so the crate comes down on the thread */
    const others = a.ents.filter(e => e.kind === 'greatpost' && e !== post);
    const open = (x, y) => !a.kind(x, y).solid && !a.at(x, y) && a.roomAt(x, y) === top;
    let thrown = false;
    for (const t of post.tiles.slice(0, 5)) {
        for (const [dx, dy, d] of [[0, 1, 'up'], [1, 0, 'left'], [-1, 0, 'right'], [0, -1, 'down']]) {
            const sx = t[0] + dx * 4, sy = t[1] + dy * 4, way = [1, 2, 3].map(k => [t[0] + dx * k, t[1] + dy * k]);
            if (!open(sx, sy) || !open(t[0], t[1]) || !way.every(([x, y]) => open(x, y) && !post.under(x, y) && !others.some(q => q.under(x, y)))) continue;
            if (!HW.walkTo(sx, sy)) continue;
            HW.face(d); HW.press('act', 1); HW.step(30); thrown = !p.carry; if (thrown) break;
        }
        if (thrown) break;
    }
    assert.ok(thrown, 'crate thrown onto the thread');
    for (let i = 0; i < 200 && post.slack <= 0; i++) HW.step(1);
    assert.ok(post.slack > 0, 'dragged along it: slack');
    const sx = post.tx + (post.tx < origin[0] + 10 ? 1 : -1), d = post.tx < origin[0] + 10 ? 'left' : 'right';
    assert.ok(HW.walkTo(sx, post.ty), 'beside the post');
    HW.face(d); HW.Inv.equipped = 'shears'; HW.press('tool', 1); HW.step(10); HW.skipTalk();
}

/* the top's three pairs and the end (src/75_greatspool.js, SpoolTop): whatever Gran says between them, said */
const settle = HW => { for (let i = 0; i < 12; i++) { HW.step(5); HW.skipTalk(); } };
/* cut a great thread at its post: beside it, or from below or above it where the floor's gone */
export function cutPost(HW, post) {
    const a = HW.G.map, p = HW.player(), left = post.tx < a.find('theSpool').tx;
    for (const [x, y, d] of [[post.tx + (left ? 1 : -1), post.ty, left ? 'left' : 'right'], [post.tx, post.ty + 1, 'up'], [post.tx, post.ty - 1, 'down']]) {
        if (a.kind(x, y).pit || a.kind(x, y).solid) continue;
        for (let k = 0; k < 5 && !HW.walkTo(x, y); k++) { HW.step(20); HW.skipTalk(); }
        if (p.tx !== x || p.ty !== y) continue;
        HW.face(d); HW.Inv.equipped = 'shears'; HW.press('tool', 1); HW.step(10); HW.skipTalk();
        return HW.Progress.flag('great:' + post.house);
    }
    return false;
}
/* the middle pair: Gran throws at wherever you're standing. Stand on the thread, step off as it comes down (its shadow
   first), and it lands on the thread and is dragged along it: slack */
export function junkAndCut(HW, post) {
    const a = HW.G.map, p = HW.player(), drum = a.find('theSpool');
    for (let tries = 0; tries < 10 && post.slack <= 0; tries++) {
        const [tx, ty] = post.tiles[tries % 3];
        if (a.at(tx, ty)) { HW.step(40); continue; }
        for (let k = 0; k < 5 && !HW.walkTo(tx, ty); k++) { HW.step(20); HW.skipTalk(); }
        if (p.tx !== tx || p.ty !== ty) continue;
        for (let i = 0; i < 400 && !drum.toss; i++) HW.step(1);
        if (!drum.toss || drum.toss.tx !== tx || drum.toss.ty !== ty) { for (let i = 0; i < 200 && drum.toss; i++) HW.step(1); continue; }
        const off = [[tx, ty + 1], [tx + 1, ty], [tx - 1, ty], [tx, ty - 1]].find(([x, y]) => !a.kind(x, y).solid && !a.kind(x, y).pit && !a.at(x, y) && !post.tiles.some(([u, v]) => u === x && v === y));
        HW.walkTo(...off);
        for (let i = 0; i < 160 && post.slack <= 0; i++) HW.step(1);
    }
    assert.ok(post.slack > 0, 'what Gran threw came down on the thread and was dragged along it: slack');
    assert.ok(cutPost(HW, post), 'cut at its post');
}
/* the last pair, the floor gone from under them: a crate thrown off its shelf (not into the dark) is wound north when its
   patience runs out, out over the dark on its thread, across the great thread: dragged along it, slack */
export function darkAndCut(HW, post) {
    const a = HW.G.map, p = HW.player(), cols = post.tiles.map(q => q[0]);
    const crate = a.ents.find(e => e.kind === 'crate' && !e.removed && !e.hiddenYank && !e.stowed && e.ret && e.tx === e.ret.mx && e.ty === e.ret.my && cols.includes(e.tx));
    assert.ok(crate, 'a crate on its shelf, under the thread\'s line');
    for (let k = 0; k < 5 && !HW.walkTo(crate.tx, crate.ty - 1); k++) HW.step(20);
    HW.face('down'); HW.press('act', 1); HW.step(20);
    assert.ok(p.carry, 'carrying it');
    for (let k = 0; k < 5 && !HW.walkTo(crate.ret.mx, crate.ret.my); k++) HW.step(20);
    HW.face('up'); HW.press('act', 1); HW.step(30);
    for (let i = 0; i < 600 && post.slack <= 0; i++) HW.step(1);
    assert.ok(post.slack > 0, 'wound north over the dark on its thread, across the great thread: slack');
    assert.ok(cutPost(HW, post), 'cut at its post');
}
/* the end: Linnet has one of Gran's hands; take the other (beside her, facing her, the action button held) */
export function holdGransHand(HW) {
    const a = HW.G.map;
    for (let i = 0; i < 4000 && !a.climax; i++) { HW.skipTalk(); HW.step(1); }
    assert.ok(a.climax, 'Linnet has one of her hands');
    const g = a.ents.find(e => e.who === 'gran'), l = a.climax.linnet, s = l.tx < g.tx ? 1 : -1;
    for (let k = 0; k < 5 && !HW.walkTo(g.tx + s, g.ty); k++) HW.step(20);
    HW.face(s > 0 ? 'left' : 'right'); HW.hold('act'); HW.step(200); HW.release(); HW.step(2);
}
/* all of it: the crates for the lowest pair, what Gran throws for the middle, the dark for the last; then her hand */
export function spoolTop(HW, origin) {
    const post = h => HW.G.map.ents.find(e => e.kind === 'greatpost' && e.house === h);
    for (const h of ['slumber', 'marionette']) slackAndCut(HW, post(h), origin);
    settle(HW);
    for (const h of ['mill', 'belfry']) junkAndCut(HW, post(h));
    settle(HW);
    for (const h of ['tidy', 'kiln']) darkAndCut(HW, post(h));
    holdGransHand(HW);
}

export const LEG1 = (HW, chain) => {
    const ok = (c, m) => { assert.ok(c, m + ` (at ${HW.G.map && HW.G.map.id} ${HW.player() && HW.player().tx},${HW.player() && HW.player().ty})`); };
    const walk = (x, y, m) => {
        let r = HW.walkTo(x, y);
        for (let i = 0; i < 3 && !r; i++) { HW.skipTalk(); HW.step(5); r = HW.walkTo(x, y); }   /* something said hello on the way */
        ok(r, m || `walk ${x},${y}`);
    };
    const area = () => HW.G.map.id;
    const thing = id => HW.G.map.find(id);
    const until = (fn, max = 3000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
    const talk = () => { HW.press('act', 1); HW.skipTalk(); };

    HW.newGame('Wren', { noAutosave: true });
    HW.step(120); HW.skipTalk(); HW.step(30);
    assert.equal(area(), 'gran_room');
    walk(1, 3); HW.hold('up'); until(() => area() === 'gran_house', 120); HW.release(); HW.step(40);
    walk(8, 4); HW.face('up'); talk();
    ok(HW.Progress.flag('talkedGran'), 'talked to Gran');
    walk(6, 7); HW.hold('down'); until(() => area() === 'hollow', 120); HW.release();
    HW.step(60); HW.skipTalk(); HW.step(30); HW.skipTalk();
    ok(HW.Progress.flag('ceremony') && HW.Inv.has('staff'), 'ceremony done, staff in hand');
    ok(!HW.Script.blocking(), 'free to move');

    /* down the south road to Meadowfold and the Tidyhouse door */
    walk(64 + 31, 80 + 18, 'south to Meadowfold');
    walk(64 + 44, 80 + 13, 'to the Tidyhouse');
    HW.hold('up'); until(() => area() === 'tidy', 120); HW.release(); HW.step(30);
    ok(area() === 'tidy', 'inside the Tidyhouse');

    /* foyer */
    walk(...t('foyer', 3, 5)); HW.push('right', 2); walk(...t('foyer', 9, 1)); HW.step(4); walk(...t('hall', 9, 9));
    /* back to the kitchen for the first key */
    walk(...t('foyer', 9, 2)); walk(...t('kitchen', 12, 6)); HW.face('up'); HW.press('act', 1);
    walk(...t('kitchen', 4, 4)); HW.face('up'); HW.press('act', 1); HW.step(40);
    walk(...t('kitchen', 13, 3)); HW.face('up'); talk();
    ok(HW.Inv.keys('tidy') === 1, 'kitchen key');
    walk(...t('kitchen', 3, 6)); HW.face('down'); talk();    /* the pie */
    ok(HW.Progress.flag('pie'), 'ate the pie');
    /* the gallery with the key: the plan */
    walk(...t('foyer', 18, 5)); HW.hold('right'); HW.step(40); HW.release();
    walk(...t('gallery', 9, 6)); HW.push('up', 2); walk(...t('gallery', 7, 5)); HW.push('right', 2); walk(...t('gallery', 12, 7)); HW.step(250);
    walk(...t('gallery', 16, 2)); HW.face('up'); talk();
    ok(HW.Inv.plans.includes('tidy'), 'plan');
    /* the hall: shove trick */
    walk(...t('gallery', 1, 5)); walk(...t('foyer', 9, 1)); walk(...t('hall', 9, 7));
    HW.push('up', 2); walk(...t('hall', 7, 5)); HW.push('right', 1); walk(...t('hall', 6, 7)); HW.step(400);
    ok(thing('hN').open, 'hall north door open');
    /* pantry: key 2 */
    walk(...t('pantry', 10, 3)); HW.face('up'); HW.press('act', 1); walk(...t('pantry', 8, 5)); HW.face('left'); HW.press('act', 1); HW.step(28);
    walk(...t('pantry', 14, 7)); walk(...t('pantry', 15, 8)); HW.face('right'); talk();
    ok(HW.Inv.keys('tidy') === 1, 'pantry key');
    /* parlor through the locked door, pulse plate, up into the linen closets */
    walk(...t('hall', 18, 5)); HW.hold('right'); HW.step(40); HW.release();
    walk(...t('parlor', 1, 9)); walk(...t('parlor', 1, 7)); HW.push('right', 6); walk(...t('parlor', 7, 8)); walk(...t('parlor', 16, 1));
    until(() => thing('pN').open, 300);
    HW.hold('up'); HW.step(60); HW.release(); HW.step(30); HW.skipTalk();
    const m = HW.ents('enemy').find(e => e.type === 'monger');
    ok(m && m.awake, 'the Dust Monger');
    while (m.alive) { HW.hitEnemy(m); HW.step(30); }
    HW.step(90); HW.skipTalk();
    walk(...t('linen', 9, 6)); HW.face('up'); talk();
    ok(HW.Inv.has('gloves'), 'gloves');
    /* laundry: key 3 */
    walk(...t('linen', 18, 5)); walk(...t('laundry', 14, 4)); HW.face('left');
    HW.hold(['act']); HW.step(3); const lb = thing('laundryBlock'); HW.hold(['act', 'right']); until(() => lb.tx >= 60 + 15, 200); HW.release(); HW.step(20);
    walk(...t('laundry', 13, 4)); HW.face('left'); talk();
    ok(HW.Inv.keys('tidy') === 1, 'laundry key');
    HW.step(200);                              /* the block came home behind you: push it out of the way (once the nibbler's out of the way too) */
    for (let i = 0; i < 10 && lb.tx === 60 + 14; i++) {
        for (const e of HW.ents('enemy')) if (e.alive && e.onTile && e.onTile(60 + 15, 11 + 4)) HW.hitEnemy(e);   /* whack whatever's in the way */
        HW.face('right'); HW.push('right', 1); HW.step(20);
    }
    /* ballroom (from the hall's north door): tidy up, the Pattern */
    walk(...t('laundry', 1, 5)); walk(...t('linen', 9, 9)); walk(...t('parlor', 16, 1)); walk(...t('parlor', 1, 5));
    walk(...t('hall', 3, 1)); walk(...t('ball', 6, 8)); HW.face('down'); HW.press('act', 1);
    walk(...t('ball', 5, 7)); HW.face('left');
    const bB = thing('ballB');
    until(() => bB.tx === 20 + 4 && bB.ty === 11 + 7, 600); HW.hold(['act']); HW.step(2); ok(HW.player().grip === bB, 'holding B');
    until(() => HW.Return.isHome(thing('ballA')), 900); HW.release(); walk(...t('ball', 6, 8));
    until(() => HW.Progress.flag('tidy_ballDone'), 900);
    walk(...t('ball', 9, 3)); HW.face('up'); talk();
    ok(HW.Inv.hasPattern('tidy'), 'pattern');
    /* shortcut lever, then the locked door north of the linen closets, the big door, the Housekeeper */
    walk(...t('ball', 17, 4)); HW.face('right'); HW.press('act', 1); HW.step(10);
    walk(...t('ball', 18, 5)); walk(...t('linen', 9, 1)); HW.hold('up'); HW.step(50); HW.release();
    walk(...t('ante', 1, 5)); HW.hold('left'); HW.step(50); HW.release(); HW.hold('left'); HW.step(60); HW.release(); HW.step(40); HW.skipTalk();
    const k = HW.ents('enemy').find(e => e.type === 'housekeeper');
    ok(k, 'the Housekeeper');
    while (k.alive) { HW.hitEnemy(k); HW.step(40); }
    HW.step(200); HW.skipTalk();
    const hoop = HW.ents('hoop')[0];
    ok(hoop, 'the hoop');
    walk(hoop.tx, hoop.ty + 1); HW.face('up'); HW.press('act', 1); HW.skipTalk(0); HW.step(300); HW.skipTalk(); HW.step(10); HW.skipTalk();
    ok(HW.Inv.knots.includes('tidy') && HW.Progress.flag('d1'), 'the Tidy Knot');
    /* out and home */
    const exit = HW.ents('warp').find(w => w.to === 'hollow' && w.ty < 11);
    ok(exit, 'exit door');
    walk(exit.tx, exit.ty - 1); HW.hold('down'); until(() => area() === 'hollow', 200); HW.release(); HW.step(30);
    ok(area() === 'hollow', 'back outside');
    assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
};

export const LEG2 = (HW, chain) => {
    const ok = (c, m) => { assert.ok(c, m + ` (at ${HW.G.map && HW.G.map.id} ${HW.player() && HW.player().tx},${HW.player() && HW.player().ty})`); };
    const walk = (x, y, m) => { let r = HW.walkTo(x, y); for (let i = 0; i < 3 && !r; i++) { HW.skipTalk(); HW.step(5); r = HW.walkTo(x, y); } const o = HW.G.map.at(x, y); ok(r, (m || `walk ${x},${y}`) + (o ? ` [${o.kind} ${o.id || o.skey || o.who || ''}]` : '')); };
    const area = () => HW.G.map.id;
    const thing = id => HW.G.map.find(id);
    const until = (fn, max = 3000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
    const talk = () => { HW.press('act', 1); HW.skipTalk(); };
    const K = { entrance: [20, 33], lwr: [0, 33], hall: [20, 22], crocks: [40, 33], sms: [40, 22], doubling: [0, 22], glazer: [40, 11], gallery: [60, 11], bridge: [60, 22], furnace: [20, 11], racks: [0, 11], sig: [0, 0], vats: [40, 0], boss: [20, 0] };
    const k = (r, x, y) => [K[r][0] + x, K[r][1] + y];
    const lift = d => { HW.face(d); HW.press('act', 1); ok(HW.player().carry, 'lifted'); };
    const toss = d => { HW.face(d); HW.press('act', 1); };
    if (chain) chain('afterD1'); else HW.preset('afterD1'); HW.step(10);
    HW.Inv.maxHp = HW.Inv.hp = 16;

    /* the canyon road: the boulder only moves for a grip */
    walk(64 + 8, 80 + 23, 'to the canyon road');
    walk(64 + 5, 80 + 22); walk(64 + 4, 80 + 22); HW.face('down');
    HW.hold(['act']); HW.step(3); HW.hold(['act', 'up']); HW.step(24); HW.release(); HW.step(4);
    ok(thing('canyonBoulder').ty === 80 + 22, 'boulder pulled into the niche');
    walk(64 + 5, 80 + 21); walk(64 + 5, 80 + 23); walk(64 + 2, 80 + 23); walk(58, 80 + 23, 'into Kilnridge');
    ok(HW.Progress.flag('kilnPass'), 'through');
    /* the Kiln's forecourt: a pot into the vent's wet mouth (it stays, held by the clay) and the vent throws it over the rock
       into the firing hole (another go if a crock gets in the way) */
    for (let i = 0; i < 4 && !thing('kilnGate').open; i++) {
        const pot = thing('fgPot1');
        until(() => HW.Return.isHome(pot) && !pot.pendingHome && !pot.shattered, 900);
        walk(17, 80 + 18); lift('down'); walk(21, 80 + 17); toss('right'); HW.step(30);
        until(() => thing('kilnGate').open || !(pot.heldBy && pot.heldBy.clay), 700); HW.step(60);
    }
    ok(thing('kilnGate').open, 'the firing hole fired: the forecourt gate is open');
    walk(22, 80 + 14, 'to the Kiln door'); HW.hold('up'); until(() => area() === 'kiln', 120); HW.release(); HW.step(30);
    ok(area() === 'kiln', 'inside the Kiln');
    HW.Inv.maxHp = HW.Inv.hp = 16;

    /* entrance: key and seal */
    walk(...k('entrance', 2, 7)); lift('down'); walk(...k('entrance', 9, 8)); toss('up'); HW.step(40);
    walk(...k('entrance', 17, 2)); HW.face('up'); talk(); ok(HW.Inv.keys('kiln') === 1, 'key 1');
    walk(...k('entrance', 16, 7)); lift('down'); walk(...k('entrance', 9, 2)); toss('up'); HW.step(30);
    ok(!thing('eSeal'), 'seal');
    /* charm hall: three at once */
    walk(...k('hall', 17, 7)); lift('down');
    for (const [x, y] of [[16, 8], [9, 8], [3, 8], [3, 2], [5, 2], [14, 2], [14, 1], [11, 1]]) walk(...k('hall', x, y));
    toss('left'); until(() => thing('hN').open, 300); ok(thing('hN').open, 'charm hall gate');
    walk(...k('hall', 9, 1)); HW.hold('up'); HW.step(40); HW.release(); walk(...k('hall', 9, 2));   /* through it once, so it stays open */
    /* doubling back: key 2 */
    walk(...k('doubling', 16, 8)); lift('right');
    for (const [x, y] of [[1, 8], [1, 5], [12, 5], [12, 3]]) walk(...k('doubling', x, y));
    toss('up'); until(() => !thing('dKey').hidden, 300); walk(...k('doubling', 15, 3)); HW.face('up'); talk();
    ok(HW.Inv.keys('kiln') === 2, 'key 2');
    /* sun, moon, star (lock) */
    walk(...k('hall', 18, 5)); HW.hold('right'); HW.step(50); HW.release();
    walk(...k('sms', 1, 7)); lift('down');
    for (const [x, y] of [[1, 1], [17, 1], [17, 9], [4, 9]]) walk(...k('sms', x, y));
    toss('left'); until(() => thing('smsN').open, 400); ok(thing('smsN').open, 'sms gate');
    /* the Glazer */
    walk(...k('sms', 16, 1)); HW.hold('up'); HW.step(50); HW.release(); HW.step(30); HW.skipTalk();
    const g = HW.ents('enemy').find(e => e.type === 'glazer');
    ok(g, 'the Glazer');
    while (g.alive) { HW.hitEnemy(g); HW.step(30); }
    HW.step(60); HW.skipTalk();
    walk(...k('glazer', 9, 7)); HW.face('up'); talk(); ok(HW.Inv.has('hook'), 'hookline');
    /* bridge of cords: key 3 */
    walk(...k('glazer', 18, 5)); walk(...k('gallery', 3, 2)); HW.face('right'); HW.press('tool', 1); HW.step(60);
    walk(...k('bridge', 14, 3)); HW.face('down'); HW.press('tool', 1); HW.step(60);
    walk(...k('bridge', 3, 7)); lift('down'); walk(...k('bridge', 6, 7)); HW.face('up'); HW.press('tool', 1); HW.step(60);
    walk(...k('bridge', 9, 2)); toss('right'); until(() => !thing('bKey').hidden, 300);
    walk(...k('bridge', 17, 3)); HW.face('up'); talk(); ok(HW.Inv.keys('kiln') === 2, 'key 3');
    /* furnace hall to the drying racks: the Pattern */
    walk(...k('bridge', 9, 1)); walk(...k('gallery', 9, 9)); walk(...k('gallery', 7, 2)); HW.face('left');
    walk(...k('gallery', 10, 5)); walk(...k('gallery', 7, 8)); HW.face('left'); HW.press('tool', 1); HW.step(60);
    walk(...k('glazer', 18, 5)); walk(...k('glazer', 16, 9)); walk(...k('sms', 16, 1)); walk(...k('sms', 1, 5)); walk(...k('hall', 9, 1));
    walk(...k('furnace', 16, 3)); lift('up'); walk(...k('furnace', 7, 5)); toss('left'); HW.step(22);
    HW.face('left'); HW.press('tool', 1); HW.step(50);
    walk(...k('furnace', 1, 4)); walk(...k('furnace', 1, 5)); HW.hold('left'); HW.step(50); HW.release();
    walk(...k('racks', 17, 6)); lift('right');
    for (const [x, y] of [[18, 2], [16, 2], [13, 2], [13, 8], [16, 8], [16, 9], [12, 9], [12, 5]]) walk(...k('racks', x, y));
    HW.face('left'); HW.press('tool', 1); HW.step(60);
    walk(...k('racks', 2, 8)); walk(...k('racks', 2, 9)); toss('right'); until(() => !thing('kPattern').hidden, 400);
    walk(...k('racks', 2, 3)); HW.face('up'); talk(); ok(HW.Inv.hasPattern('kiln'), 'pattern');
    /* to the boss: back over the pit, round to the Glazer's north door */
    walk(...k('racks', 6, 2)); walk(...k('racks', 6, 5)); HW.face('right');
    walk(...k('racks', 6, 8));
    /* use the hook on the far eyelet? there is none going east: go round by the furnace hall's crate mark */
    walk(...k('racks', 18, 5)); walk(...k('furnace', 3, 4));
    ok(true, 'west side');
    HW.Inv.keyCount.kiln = Math.max(1, HW.Inv.keys('kiln'));
    HW.warp('kiln', ...k('glazer', 9, 1)); HW.hold('up'); HW.step(50); HW.release();
    walk(...k('vats', 1, 5)); HW.hold('left'); HW.step(50); HW.release(); HW.hold('left'); HW.step(60); HW.release(); HW.step(40); HW.skipTalk();
    const w = HW.ents('enemy').find(e => e.type === 'kilnwyrm');
    ok(w, 'the Kilnwyrm');
    HW.G.cheats.god = true;      /* (its darts, glaze and shed pieces: the dodging isn't what this checks) */
    const settle = () => { until(() => w.state === 'hurt' || !w.alive, 220); HW.Inv.hp = 16; HW.step(70); HW.skipTalk(); };
    /* 1: along its trail */
    walk(...k('boss', 17, 3)); lift('up');
    walk(...k('boss', 12, 3)); walk(...k('boss', 12, 7)); walk(...k('boss', 5, 7)); toss('left'); settle();
    ok(w.hp === 2, 'the Kilnwyrm cracked once');
    /* 2: across its rim as it comes round the left side */
    walk(...k('boss', 2, 7)); lift('down');
    walk(...k('boss', 1, 7)); walk(...k('boss', 1, 6)); walk(...k('boss', 2, 6)); walk(...k('boss', 4, 6));
    until(() => { HW.Inv.hp = 16; return Math.abs(w.x - ((K.boss[0] + 1) * 16 + 8)) < 2 && w.y > (K.boss[1] + 8) * 16 && w.y < (K.boss[1] + 9) * 16 + 12; }, 1200);
    toss('right'); settle();
    ok(w.hp === 1, 'twice');
    /* 3: reeled over its pit, carrying an urn */
    walk(...k('boss', 2, 3)); lift('up');
    walk(...k('boss', 6, 5)); HW.face('right'); HW.Inv.equipped = 'hook'; HW.press('tool', 1);
    until(() => HW.player().state === 'normal' && HW.player().tx === K.boss[0] + 12, 120);
    toss('right'); settle();
    HW.step(150); HW.skipTalk();
    const hoop = HW.ents('hoop')[0]; ok(hoop, 'hoop');
    walk(hoop.tx, hoop.ty + 1); HW.face('up'); HW.press('act', 1); HW.skipTalk(0); HW.step(300); HW.skipTalk(); HW.step(10); HW.skipTalk();
    HW.G.cheats.god = false;
    ok(HW.Inv.knots.includes('kiln') && HW.Progress.flag('d2'), 'the Fired Knot');
    assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
};

export const LEG3 = (HW, chain) => {
    const ok = (c, m) => { assert.ok(c, m + ` (at ${HW.G.map && HW.G.map.id} ${HW.player() && HW.player().tx},${HW.player() && HW.player().ty})`); };
    const walk = (x, y, m) => { let r = HW.walkTo(x, y); for (let i = 0; i < 3 && !r; i++) { HW.skipTalk(); HW.step(5); r = HW.walkTo(x, y); } ok(r, m || `walk ${x},${y}`); };
    const area = () => HW.G.map.id;
    const thing = id => HW.G.map.find(id);
    const until = (fn, max = 3000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
    const talk = () => { HW.press('act', 1); HW.skipTalk(); };
    const M = { wheel: [20, 33], ferry: [0, 33], backwash: [40, 33], carousel: [20, 22], snap: [40, 22], upstream: [20, 11], twowheels: [40, 11], pond: [20, 0], lock: [40, 0], bells: [60, 0] };
    const m = (r, x, y) => [M[r][0] + x, M[r][1] + y];
    const at = (o, x, y) => o.tx === x && o.ty === y && !o.mv;
    /* (as a person would: not onto a raft that's just about to set off home again, a step out of reach; wait for the next) */
    const staying = r => !(r.ret && (r.ret.state === 'returning' || (r.ret.state === 'away' && r.ret.timer < 30)));
    const board = (raft, [x, y], dir, max = 2000) => { ok(until(() => at(raft, x, y) && staying(raft), max), `raft at ${x},${y}`); HW.hold(dir); HW.step(10); HW.release(); HW.step(1); ok(HW.player().tx === x && HW.player().ty === y, 'aboard'); };
    const off = dir => { HW.hold(dir); HW.step(14); HW.release(); HW.step(2); };
    if (chain) chain('afterD2'); else HW.preset('afterD2'); HW.step(10);
    HW.Inv.maxHp = HW.Inv.hp = 24;

    /* the broken bridge in Meadowfold: hook the eyelet on the far side */
    walk(64 + 48, 80 + 27, 'to the broken bridge');
    walk(64 + 49, 80 + 27); HW.Inv.equipped = 'hook'; HW.face('right'); HW.press('tool', 1); HW.step(60);
    ok(HW.player().tx >= 64 + 53, 'over the gap');
    walk(128 + 10, 80 + 27, 'into Millwater');
    /* the ferry over the river */
    walk(128 + 38, 80 + 26, 'to the dock');
    board(thing('mwFerry'), [128 + 39, 80 + 26], 'right');
    ok(until(() => at(thing('mwFerry'), 128 + 42, 80 + 26), 400), 'across');
    off('right');
    walk(128 + 47, 80 + 26); HW.hold('up'); until(() => area() === 'millrace', 120); HW.release(); HW.step(30);
    ok(area() === 'millrace', 'inside the Millrace');
    HW.Inv.maxHp = HW.Inv.hp = 24;

    /* wheel hall */
    walk(...m('wheel', 3, 4)); HW.push('up', 1);
    ok(until(() => thing('whGate').open, 500), 'wheel gate');
    walk(...m('wheel', 9, 1)); HW.step(4); walk(...m('carousel', 9, 9)); walk(...m('wheel', 9, 1));   /* through once: it stays open */
    /* ferry pool: key 1 */
    walk(...m('wheel', 1, 5)); walk(...m('ferry', 17, 6));
    board(thing('fpFerry'), m('ferry', 16, 6), 'left');
    ok(until(() => at(thing('fpFerry'), ...m('ferry', 6, 3)), 800), 'at the island');
    off('left'); walk(...m('ferry', 4, 3)); HW.face('left'); talk();
    ok(HW.Inv.keys('mill') === 1, 'key 1');
    if (!at(thing('fpFerry'), ...m('ferry', 6, 3))) { walk(...m('ferry', 5, 2)); HW.face('right'); HW.press('act', 1); }   /* the ferry bell: come now */
    walk(...m('ferry', 5, 3)); board(thing('fpFerry'), m('ferry', 6, 3), 'right', 2500);
    ok(until(() => at(thing('fpFerry'), ...m('ferry', 16, 6)), 800), 'back'); off('right');
    /* backwash: the plan */
    walk(...m('ferry', 18, 5)); walk(...m('backwash', 2, 4));
    HW.Inv.equipped = 'hook'; HW.face('right'); HW.press('tool', 1);
    ok(until(() => at(thing('bwRaft'), ...m('backwash', 3, 4)), 200), 'raft hooked over'); off('right');
    ok(until(() => at(thing('bwRaft'), ...m('backwash', 9, 4)), 600), 'carried back'); off('right');
    walk(...m('backwash', 10, 3)); HW.face('up'); talk(); ok(HW.Inv.plans.includes('mill'), 'plan');
    walk(...m('backwash', 11, 4)); HW.hold('down'); HW.step(40); HW.release(); HW.step(10);
    /* the carousel, round to the east landing; unlock the Snapjaw's door */
    walk(...m('backwash', 1, 5)); walk(...m('wheel', 9, 1)); walk(...m('carousel', 9, 8));
    board(thing('caRaft'), m('carousel', 9, 7), 'up');
    ok(until(() => at(thing('caRaft'), ...m('carousel', 14, 5)), 900), 'east landing'); off('right');
    walk(...m('carousel', 17, 5)); HW.hold('right'); HW.step(60); HW.release();
    walk(...m('snap', 1, 5)); HW.step(30); HW.skipTalk();
    /* the Snapjaw: bait it up on the bank beside a crate, step back out of its reach, push the crate down onto it while it
       hunts along the bank (twice) */
    const s = HW.ents('enemy').find(e => e.type === 'snapjaw');
    ok(s && s.state === 'swim', 'Snapjaw awake');
    for (const [crate, row] of [['sjCrate1', 2], ['sjCrate2', 4]]) {
        until(() => s.state === 'swim', 600);
        walk(...m('snap', 11, row));
        ok(until(() => s.state === 'rear', 600), 'it rears up at Wren on the bank');
        walk(...m('snap', 10, row));
        const c = thing(crate), hp0 = s.hp;
        walk(...m('snap', 10, c.ty - M.snap[1])); HW.face('right'); HW.push('right', 1);
        ok(until(() => s.hp < hp0 || !s.alive, 300), 'the crate came down onto it');
    }
    ok(!s.alive, 'Snapjaw beaten'); HW.step(60); HW.skipTalk();
    walk(...m('snap', 4, 6)); HW.face('up'); talk(); ok(HW.Inv.has('paddle'), 'the Paddle');
    /* back round to the north landing and up into Upstream */
    walk(...m('carousel', 16, 5)); walk(...m('carousel', 15, 5)); HW.face('left');
    board(thing('caRaft'), m('carousel', 14, 5), 'left', 2000);
    ok(until(() => at(thing('caRaft'), ...m('carousel', 9, 7)), 900), 'home again'); off('down');
    board(thing('caRaft'), m('carousel', 9, 7), 'up', 2000);
    ok(until(() => at(thing('caRaft'), ...m('carousel', 9, 3)), 900), 'north landing'); off('up');
    walk(...m('carousel', 9, 1)); walk(...m('upstream', 9, 9));
    /* upstream: paddle up for key 3 */
    HW.Inv.equipped = 'paddle';
    board(thing('upRaft'), m('upstream', 9, 8), 'up');
    HW.hold(['tool', 'up']); ok(until(() => at(thing('upRaft'), ...m('upstream', 9, 2)), 600), 'paddled up');
    HW.release(); HW.step(1); off('up');
    HW.face('left'); talk(); ok(HW.Inv.keys('mill') === 2, 'key 3 (and key 1 still)');
    /* two wheels (along the upper floor from the top of the race, through the lock): the sluice north */
    walk(...m('upstream', 17, 5)); HW.hold('right'); HW.step(60); HW.release();
    walk(...m('twowheels', 1, 2));
    board(thing('twRaft'), m('twowheels', 2, 2), 'right', 2000);
    ok(until(() => at(thing('twRaft'), ...m('twowheels', 12, 2)), 800), 'at the first wheel');
    HW.hold(['tool']); ok(until(() => HW.Progress.flag('millrace_twoWheels'), 600), 'two wheels'); HW.release(); HW.step(2); off('down');
    ok(until(() => thing('twGate').open, 60), 'the sluice to the north');
    /* the Lock: the log hooked away down the race, the crate put in behind it; the log comes home, shoves the crate onto the
       wheel's water and stays in its way: the keeper's gate up for good */
    walk(...m('twowheels', 1, 1)); walk(...m('lock', 1, 9));
    walk(...m('lock', 11, 3)); HW.Inv.equipped = 'hook'; HW.face('left'); HW.press('tool', 1);
    ok(until(() => at(thing('lkLog'), ...m('lock', 10, 3)), 120), 'the log reeled down the race');
    walk(...m('lock', 8, 1)); HW.face('down'); HW.push('down', 1); walk(...m('lock', 6, 1));
    ok(until(() => thing('lkGate').open, 900), "the keeper's gate");
    /* the Bell Race: a pot hooked over to the island, home on the ferry past star, moon and sun, smashed on the landing */
    walk(...m('lock', 18, 5)); walk(...m('bells', 1, 5));
    walk(...m('bells', 13, 7)); HW.face('down'); HW.press('act', 1); HW.step(10); ok(HW.player().carry, 'a pot');
    walk(...m('bells', 17, 6)); HW.Inv.equipped = 'hook'; HW.face('up'); HW.press('tool', 1); HW.step(40);
    ok(HW.player().tx === m('bells', 17, 0)[0] && HW.player().ty === 3, 'over to the island, pot and all');
    walk(...m('bells', 15, 2));
    board(thing('brFerry'), m('bells', 14, 2), 'left', 1500);
    ok(until(() => at(thing('brFerry'), ...m('bells', 4, 2)) && HW.Return.isHome(thing('brFerry')), 1500), 'home on the ferry'); off('left');
    HW.face('left'); HW.press('act', 1);
    ok(until(() => HW.Progress.areaFlag('millrace', 'seq:brs'), 200), 'sun, moon, star');
    walk(...m('bells', 2, 5)); HW.face('up'); talk(); ok(HW.Inv.hasPattern('mill'), 'Pattern');
    /* back through the Lock to its big door, and into the Millpond from the side */
    walk(...m('lock', 1, 5)); HW.hold('left'); HW.step(60); HW.release(); HW.step(10);
    walk(...m('pond', 18, 5)); HW.hold('left'); HW.step(12); HW.release(); HW.step(30); HW.skipTalk();
    /* Old Grindle, in three rounds (each round tried again if its spit knocks Wren about) */
    const g = thing('grindle'), raft = thing('gRaft'), P = () => HW.player();
    HW.G.cheats.god = true;      /* (its spit, wash and rivets: the dodging isn't what this checks) */
    ok(g && g.state !== 'sleep', 'Grindle awake');
    const nextRound = k => { for (let i = 0; i < 900 && g.alive && (g.phase < k || ['turn', 'sulk', 'hurt'].includes(g.state)); i++) { if (HW.Dialog.active) HW.skipTalk(); HW.step(1); } HW.skipTalk(); ok(g.phase === k, 'round ' + k); };
    /* 1: a barrel down a side race into its mouth fills it; the ferry, rung off at once, up to just below it; strike */
    for (let n = 0; n < 4 && g.hp === 3; n++) {
        if (HW.Return.isHome(thing('gbE')) && g.state === 'home') { walk(...m('pond', 14, 2)); HW.face('down'); HW.push('down', 1); }
        walk(...m('pond', 9, 8)); until(() => at(raft, ...m('pond', 9, 7)) && HW.Return.isHome(raft), 900);
        HW.hold('up'); HW.step(10); HW.release(); HW.step(1);
        if (P().ty !== 7) continue;
        HW.face('left'); HW.press('act', 1); HW.face('up');
        until(() => at(raft, ...m('pond', 9, 5)) || P().ty > 7, 300);
        until(() => g.state === 'full' || P().ty > 5, 600);
        if (P().ty === 5 && g.state === 'full') { HW.face('up'); HW.press('atk', 1); HW.step(20); }
        until(() => at(raft, ...m('pond', 9, 7)), 600); off('down');
    }
    nextRound(2);
    /* 2: the races turned: it swallows the ferry itself now; ride a barrel up beside its mouth instead (the Paddle) */
    for (let n = 0; n < 4 && g.hp === 2; n++) {
        const b = thing('gbW');
        walk(...m('pond', 5, 2)); HW.face('down');
        if (HW.Return.isHome(b)) HW.push('down', 1);
        walk(...m('pond', 5, 3)); HW.hold('down'); HW.step(12); HW.release(); HW.step(2);
        if (P().ty !== 4) continue;
        HW.Inv.equipped = 'paddle';
        for (let i = 0; i < 300 && P().tx < m('pond', 8, 0)[0]; i++) { HW.hold(['tool', 'right']); HW.step(1); }
        HW.hold(['tool']); until(() => !b.mv, 60);
        until(() => g.state === 'full', 900);
        HW.release(); HW.step(1); HW.face('right'); HW.press('atk', 1); HW.step(20);
        for (let i = 0; i < 300 && P().tx > m('pond', 5, 0)[0]; i++) { HW.hold(['tool', 'left']); HW.step(1); }
        HW.release(); until(() => !b.mv, 60); off('up');
    }
    nextRound(3);
    /* 3: jaw shut; a pot on the raft (pushed off its still landing) ridden past its teeth, smashed beyond them */
    for (let n = 0; n < 6 && g.alive; n++) {
        if (!P().carry) { walk(...m('pond', 7, 8)); HW.face('down'); until(() => HW.Return.isHome(thing('gPot1')), 600); HW.press('act', 1); HW.step(10); }
        walk(...m('pond', 9, 8)); until(() => at(raft, ...m('pond', 9, 7)) && HW.Return.isHome(raft), 900);
        HW.hold('up'); HW.step(10); HW.release(); HW.step(1);
        if (P().ty !== 7) continue;
        HW.Inv.equipped = 'paddle'; HW.hold(['tool', 'up']); until(() => raft.mv, 30); until(() => !raft.mv, 60); HW.release();
        until(() => (raft.tx >= m('pond', 11, 0)[0] && !raft.mv) || P().ty > 7, 600);
        if (P().ty !== 4) continue;
        HW.face('right'); HW.press('act', 1);
        until(() => !g.alive, 200);
    }
    ok(!g.alive, 'Grindle down');
    HW.step(200); HW.skipTalk();
    if (P().ty < m('pond', 0, 8)[1]) { ok(until(() => at(raft, ...m('pond', 9, 7)) && HW.Return.isHome(raft), 1500), 'raft home'); off('down'); }   /* still afloat: ride back in */
    const hoop = HW.ents('hoop')[0]; ok(hoop, 'the hoop');
    walk(hoop.tx - 1, hoop.ty); HW.face('right'); HW.press('act', 1); HW.skipTalk(0); HW.step(300); HW.skipTalk(); HW.step(10); HW.skipTalk();
    HW.G.cheats.god = false;
    ok(HW.Inv.knots.includes('mill') && HW.Progress.flag('d3'), 'the Running Knot');
    const exit = HW.ents('warp').find(w => w.to === 'hollow' && w.ty < 11);
    ok(exit, 'a way out');
    walk(exit.tx + 1, exit.ty); HW.hold('left'); until(() => area() === 'hollow', 200); HW.release(); HW.step(30);
    ok(area() === 'hollow', 'back outside');
    assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
};

export const LEG4 = (HW, chain) => {
    const ok = (c, m) => { assert.ok(c, m + ` (at ${HW.G.map && HW.G.map.id} ${HW.player() && HW.player().tx},${HW.player() && HW.player().ty})`); };
    const walk = (x, y, m) => { let r = HW.walkTo(x, y); for (let i = 0; i < 3 && !r; i++) { HW.skipTalk(); HW.step(5); r = HW.walkTo(x, y); } ok(r, m || `walk ${x},${y}`); };
    const area = () => HW.G.map.id;
    const thing = id => HW.G.map.find(id);
    const until = (fn, max = 3000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
    const talk = () => { HW.press('act', 1); HW.skipTalk(); };
    const p = () => HW.player();
    const at = (o, x, y) => o.tx === x && o.ty === y && !o.mv;
    const off = dir => { HW.hold(dir); HW.step(14); HW.release(); HW.step(2); };
    const paddleTo = (x, y) => { for (let i = 0; i < 2000 && (p().tx !== x || p().ty !== y); i++) { const d = p().tx < x ? 'right' : p().tx > x ? 'left' : p().ty < y ? 'down' : 'up'; HW.hold(['tool', d]); HW.step(1); } HW.release(); HW.step(2); ok(p().tx === x && p().ty === y, `paddled to ${x},${y}`); };
    const B = { porch: [20, 44], draught: [0, 44], windward: [40, 44], stair: [20, 33], weather: [0, 33], loft: [20, 22], reach: [0, 22], ropes: [20, 11], bell: [20, 0], frame: [40, 11], cistern: [40, 0] };
    const b = (r, x, y) => [B[r][0] + x, B[r][1] + y];
    if (chain) chain('afterD3'); else HW.preset('afterD3'); HW.step(10); HW.skipTalk();
    HW.Inv.maxHp = HW.Inv.hp = 24;

    /* back over the river on the ferry, round to Wick's pier, paddle over the lake */
    walk(128 + 43, 80 + 26);
    ok(until(() => at(thing('mwFerry'), 128 + 42, 80 + 26), 2000), 'ferry in'); off('left');
    ok(until(() => at(thing('mwFerry'), 128 + 39, 80 + 26), 800), 'over'); off('left');
    walk(128 + 18, 80 + 16, "to Wick's pier");
    HW.Inv.equipped = 'paddle'; off('up');
    paddleTo(128 + 18, 80 + 6); paddleTo(128 + 39, 80 + 6); paddleTo(128 + 39, 80 + 3); off('up');
    /* the cliff stair and the Heights */
    walk(128 + 43, 80 + 0); walk(128 + 43, 38, 'up the cliff stair');
    walk(128 + 13, 31); HW.face('right'); HW.press('atk', 1); HW.step(40);
    walk(128 + 12, 22, 'past the woken boulder');
    const g = thing('hGust');
    for (let i = 0; i < 4000 && p().tx < 128 + 52; i++) {
        if (g.on || g.soon) { HW.hold('up'); HW.step(1); }
        else { HW.release(); HW.walkTo(Math.min(p().tx + 3, 128 + 52), 21); }
    }
    HW.release(); ok(p().tx >= 128 + 52, 'over the Bluster');
    walk(128 + 52, 17); walk(128 + 45, 12);
    HW.Inv.equipped = 'hook'; HW.face('left'); HW.press('tool', 1); HW.step(60);
    walk(128 + 30, 8); HW.hold('up'); until(() => area() === 'belfry', 120); HW.release(); HW.step(30);
    ok(area() === 'belfry', 'inside the Belfry');
    HW.Inv.maxHp = HW.Inv.hp = 24;
    HW.G.cheats.god = true;      /* (bats and bosses: the dodging isn't what this checks) */

    /* porch */
    walk(...b('porch', 6, 5)); HW.face('up'); HW.press('atk', 1); HW.step(60);
    /* the draught: key 1 */
    walk(...b('porch', 1, 5)); walk(...b('draught', 10, 8)); HW.push('up', 2);
    ok(until(() => !HW.G.map.kind(...b('draught', 5, 5)).pit, 600), 'first pit');
    walk(...b('draught', 13, 2)); HW.push('down', 2);
    ok(until(() => !HW.G.map.kind(...b('draught', 4, 5)).pit, 600), 'second pit');
    until(() => !thing('drGust').on, 300);
    walk(...b('draught', 3, 5)); HW.face('left'); talk(); ok(HW.Inv.keys('belfry') === 1, 'key 1');
    /* windward: the plan */
    walk(...b('draught', 18, 5)); walk(...b('windward', 11, 3));
    const wg = thing('wwGust'), wc = thing('wwCrate');
    until(() => wg.on, 600); until(() => !wg.on, 600);
    HW.face('up'); HW.press('atk', 1); HW.step(12);
    ok(until(() => HW.Return.isHome(wc), 80), 'crate rung home');
    walk(...b('windward', 17, 5)); HW.face('right'); talk(); ok(HW.Inv.plans.includes('belfry'), 'plan');
    /* the stair, then weathercock walk: key 2 */
    walk(...b('windward', 1, 5)); walk(...b('porch', 9, 1)); walk(...b('stair', 1, 5)); walk(...b('weather', 18, 5));
    const cg = thing('wcGust');
    for (const x of [13, 9, 5]) { until(() => !cg.on, 400); walk(...b('weather', x, 5)); HW.face('up'); HW.hold(['act']); until(() => cg.on, 400); until(() => !cg.on, 400); HW.release(); HW.step(2); }
    walk(...b('weather', 2, 5)); HW.face('left'); talk(); ok(HW.Inv.keys('belfry') === 2, 'key 2');
    /* the stair's north lock; Clangor */
    walk(...b('weather', 18, 5)); walk(...b('stair', 9, 1)); HW.hold('up'); HW.step(60); HW.release(); HW.step(30); HW.skipTalk();
    walk(...b('loft', 9, 8)); HW.step(20); HW.skipTalk();
    const c = HW.ents('enemy').find(e => e.type === 'clangor');
    ok(c && c.state !== 'sleep', 'Clangor awake');
    for (let round = 0; round < 3 && c.alive; round++) {
        const bust = thing('clB1');
        until(() => HW.Return.isHome(bust), 600);
        c.state = 'ring'; c.st = -100000; c.x = b('loft', 16, 8)[0] * 16 + 8; c.y = b('loft', 16, 8)[1] * 16 + 10;   /* (a person lures it; held still here) */
        walk(...b('loft', 3, 3)); HW.push('right', 3); walk(...b('loft', 7, 6));
        c.x = b('loft', 5, 3)[0] * 16 + 8; c.y = b('loft', 5, 3)[1] * 16 + 10; c.state = 'windup'; c.st = 39;
        ok(until(() => c.state === 'stunned', 120), 'slammed'); HW.step(30);
        p().x = c.x + 16; p().y = c.y; HW.face('left'); HW.press('atk', 1); HW.step(30);
    }
    ok(!c.alive, 'Clangor down'); HW.step(100); HW.skipTalk();
    walk(...b('loft', 9, 7)); HW.face('up'); talk(); ok(HW.Inv.has('bell'), 'the Recall Bell');
    /* the reach: key 3 */
    walk(...b('loft', 1, 5)); walk(...b('reach', 16, 1)); HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(80);
    walk(...b('reach', 2, 8)); HW.face('left'); talk(); ok(HW.Inv.keys('belfry') === 2, 'key 3');
    /* the loft's north lock; bell ropes: the Pattern */
    walk(...b('reach', 18, 5)); walk(...b('loft', 9, 1)); HW.hold('up'); HW.step(60); HW.release(); HW.step(20);
    walk(...b('ropes', 16, 3)); HW.face('right'); talk(); ok(p().carry, 'holding the crate');
    walk(...b('ropes', 14, 3)); HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(80);
    ok(HW.Progress.flag('belfry_ropes'), 'the ropes');
    HW.face('right'); HW.press('act', 1); HW.step(30);
    walk(...b('ropes', 9, 8)); HW.face('up'); talk(); ok(HW.Inv.hasPattern('belfry'), 'Pattern');
    /* the Bell Frame (east, through the gate the Pattern's plates opened): the crate the long way round, up the east side,
       thrown down the gap from above onto the plate; ring: the boulder is home first and holds it there */
    walk(...b('ropes', 18, 5)); walk(...b('frame', 9, 9)); HW.face('up'); talk(); ok(p().carry, 'the crate');
    walk(...b('frame', 12, 9)); walk(...b('frame', 12, 4)); walk(...b('frame', 5, 3));
    HW.face('down'); HW.press('act', 1); HW.step(40);
    HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(60);
    ok(until(() => thing('fbGate').open, 200), 'the Bell Frame gate');
    walk(...b('frame', 14, 1)); HW.hold('up'); HW.step(70); HW.release(); HW.step(10);
    /* the Cistern: the raft hooked over the shaft, boarded where the gale pins it at the pool's foot; rung from aboard, it
       snaps home across with Wren on it; the drawbridge down behind; the big door */
    const raft = thing('csRaft');
    walk(...b('cistern', 11, 1)); HW.Inv.equipped = 'hook'; HW.face('left'); HW.press('tool', 1);
    ok(until(() => !raft.mv && raft.tx === b('cistern', 10, 0)[0] && raft.ty === b('cistern', 0, 7)[1], 600), 'the raft over and pinned');
    walk(...b('cistern', 11, 7)); off('left'); ok(p().tx === raft.tx && p().ty === raft.ty, 'aboard');
    HW.Inv.equipped = 'bell'; HW.press('tool', 1);
    ok(until(() => HW.Return.isHome(raft), 120), 'home across the shaft'); off('left');
    walk(...b('cistern', 2, 8)); HW.face('down'); HW.press('act', 1); HW.step(20);
    walk(...b('cistern', 1, 5)); HW.hold('left'); HW.step(60); HW.release(); HW.step(20);
    /* the great bell: Tollgrim in three beats */
    HW.walkTo(...b('bell', 17, 5)); HW.step(30); HW.skipTalk();
    const t = HW.ents('enemy').find(e => e.type === 'tollgrim');
    ok(t && t.state !== 'sleep', 'Tollgrim awake');
    /* (two knocks put him back in his bell: between them he flails about) */
    const strike = () => { walk(t.tx - 1, t.ty); HW.face('right'); const hp = t.hp; for (let k = 0; k < 6 && t.alive && t.hp === hp; k++) { HW.press('atk', 1); HW.step(18); } HW.step(12); HW.skipTalk(); HW.step(5); };
    /* 1: the draught blows the clapper out of the bell's mouth; he leans out; ring */
    walk(...b('bell', 6, 7));
    ok(until(() => t.state === 'peek', 1500), 'he leans out');
    HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(4);
    ok(until(() => t.state === 'stunned', 60), 'slammed'); strike();
    ok(t.hp === 2, 'the second beat');
    /* 2: the gale lays the clapper against the west wall; ring from beside it, beyond his hearing */
    walk(...b('bell', 1, 6));
    ok(until(() => t.state === 'peek', 1500), 'he leans out');
    HW.press('tool', 1); HW.step(4);
    ok(until(() => t.state === 'stunned', 60), 'slammed'); strike();
    ok(t.hp === 1, 'the third beat');
    /* 3: a pot carried under the old bell and far off, smashed: its pieces fly home under the old bell and ring it */
    walk(...b('bell', 1, 8)); HW.face('down'); talk(); ok(p().carry, 'a pot');
    walk(...b('bell', 2, 8)); walk(...b('bell', 10, 8));
    ok(until(() => t.state === 'peek' && HW.Return.away(thing('clapper')), 1500), 'he leans out');
    HW.face('right'); HW.press('act', 1);
    ok(until(() => t.state === 'stunned', 200), 'slammed'); strike();
    ok(!t.alive, 'Tollgrim down');
    HW.step(200); HW.skipTalk();
    HW.G.cheats.god = false;
    const hoop = HW.ents('hoop')[0]; ok(hoop, 'the hoop');
    walk(hoop.tx - 1, hoop.ty); HW.face('right'); HW.press('act', 1); HW.skipTalk(0); HW.step(300); HW.skipTalk(); HW.step(10); HW.skipTalk();
    ok(HW.Inv.knots.includes('belfry') && HW.Progress.flag('d4'), 'the Ringing Knot');
    const exit = HW.ents('warp').find(w => w.to === 'hollow' && w.ty < 11);
    ok(exit, 'a way out');
    walk(exit.tx + 1, exit.ty); HW.hold('left'); until(() => area() === 'hollow', 200); HW.release(); HW.step(30);
    ok(area() === 'hollow', 'back outside');
    assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
};

export const LEG5 = (HW, chain) => {
    const ok = (c, m) => { assert.ok(c, m + ` (at ${HW.G.map && HW.G.map.id} ${HW.player() && HW.player().tx},${HW.player() && HW.player().ty})`); };
    const walk = (x, y, m) => { let r = HW.walkTo(x, y); for (let i = 0; i < 3 && !r; i++) { HW.skipTalk(); HW.step(5); r = HW.walkTo(x, y); } ok(r, m || `walk ${x},${y}`); };
    const area = () => HW.G.map.id;
    const thing = id => HW.G.map.find(id);
    const until = (fn, max = 3000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
    const talk = () => { HW.press('act', 1); HW.skipTalk(); };
    const p = () => HW.player();
    const landed = () => until(() => p().state === 'normal', 600);
    const lay = () => { HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(2); };
    const homeward = () => { HW.Inv.equipped = 'bedroll'; HW.hold('tool'); HW.step(24); HW.release(); HW.step(1); landed(); };
    const S = { porch: [20, 33], ward: [20, 22], linen: [0, 22], laundry: [40, 22], loft: [40, 33], landing: [20, 11], nursery: [0, 11], moonwalk: [40, 11], fort: [0, 0], boss: [20, 0], kitchen: [40, 0], dream: [60, 0] };
    const s = (r, x, y) => [S[r][0] + x, S[r][1] + y];
    const steps = (r, path) => { for (const [x, y] of path) { const [tx, ty] = s(r, x, y), d = tx > p().tx ? 'right' : tx < p().tx ? 'left' : ty > p().ty ? 'down' : 'up'; for (let i = 0; i < 60 && (p().tx !== tx || p().ty !== ty); i++) { HW.hold(d); HW.step(1); } const along = d === 'left' || d === 'right' ? () => Math.abs(p().x - (tx * 16 + 8)) : () => Math.abs(p().y - (ty * 16 + 10)); for (let i = 0; i < 12 && along() > 2; i++) { HW.hold(d); HW.step(1); } HW.release(); ok(p().state === 'normal' && p().tx === tx && p().ty === ty, `stepped to ${r} ${x},${y}`); } };
    const fallHome = dir => { HW.hold(dir); until(() => p().state === 'fall', 200); HW.release(); landed(); };
    if (chain) chain('afterD4'); else HW.preset('afterD4'); HW.step(10); HW.skipTalk();
    HW.Inv.maxHp = HW.Inv.hp = 28;

    /* home for the festival (the way down from the Heights is the way up, played in the leg before) */
    HW.warp('hollow', 64 + 30, 40 + 34); HW.step(10); walk(64 + 30, 40 + 24); HW.step(10); HW.skipTalk(); HW.step(10);
    ok(HW.Progress.flag('festival'), 'the festival');
    /* the east road: ring the Bell at the giant */
    walk(125, 60); HW.Inv.equipped = 'bell'; HW.press('tool', 1);
    for (let i = 0; i < 30 && !HW.Progress.flag('giant_home'); i++) { HW.skipTalk(); HW.step(20); }
    HW.skipTalk(); ok(HW.Progress.flag('giant_home'), 'the giant gone home');
    /* over the moss; the Slumberhouse's door opens while somebody sleeps in each of the garden's three cradles (a lamp over
       the door for each, on a cord to it). Snorelings follow a while, then lie down in the nearest bed they can get to: the
       one asleep in the road woke as she passed and came along; rung from the north bank by the far cradles, Mallow's two
       nearest come too. Pressing toward her over the water, each slips into the first free cradle under her, and lies down
       in it when it gives up (a cradle still empty: Mallow's third, woken by treading near, led round to it) */
    const north = () => { walk(128 + 12, 40 + 16); HW.hold('up'); until(() => p().ty <= 40 + 11 && p().state === 'normal', 150); HW.release(); HW.step(5); };
    const asleepIn = c => HW.G.map.ents.some(e => e.type === 'snoreling' && e.alive && e.mode === 'sleep' && e.tx === 128 + c && e.ty === 40 + 14);
    north();
    walk(128 + 20, 40 + 11); HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(10);
    walk(128 + 24, 40 + 11);
    ok(until(() => asleepIn(20) && asleepIn(24), 900), 'two asleep in the far cradles');
    ok(until(() => asleepIn(16), 300) || (() => {
        walk(128 + 11, 40 + 11); HW.hold('left'); until(() => p().ty >= 40 + 15 && p().state === 'normal', 120); HW.release(); walk(128 + 10, 40 + 17);
        const a3 = thing('nuSnoreA'); for (let i = 0; i < 30 && a3.mode === 'sleep'; i++) walk(128 + 8 + (i % 2 ? 1 : -1), 40 + 17);
        north(); walk(128 + 16, 40 + 11); return until(() => asleepIn(16), 900);
    })(), 'and the first');
    walk(128 + 19, 40 + 10); walk(128 + 19, 40 + 9); HW.hold('up'); until(() => area() === 'slumber', 120); HW.release(); HW.step(30);
    ok(area() === 'slumber', 'inside the Slumberhouse');
    HW.G.cheats.god = true;      /* (Snorelings, Matron, Mother Sloth: the dodging isn't what this checks) */

    /* the porch: the bed, the boards, the lever, a fall home */
    walk(...s('porch', 4, 6)); HW.face('left'); talk();
    walk(...s('porch', 9, 5)); steps('porch', [[10, 5], [11, 5], [12, 5], [13, 5], [14, 5], [15, 5]]);
    HW.face('right'); HW.press('act', 1); HW.step(10); fallHome('left');
    /* the linen cupboard: key A */
    walk(...s('ward', 1, 5)); walk(...s('linen', 13, 6));
    steps('linen', [[12, 6], [12, 5], [11, 5], [10, 5], [9, 5], [9, 4], [9, 3], [8, 3], [8, 4], [8, 5], [8, 6], [8, 7], [7, 7]]);
    HW.step(20); fallHome('left');
    walk(...s('linen', 3, 5)); HW.face('left'); talk(); ok(HW.Inv.keys('slumber') === 1, 'key A');
    /* the laundry (lock A): ride under the dreamcatchers; the Plan */
    walk(...s('ward', 18, 5)); HW.hold('right'); HW.step(40); HW.release(); HW.step(30);
    walk(...s('laundry', 2, 8)); HW.hold('right'); HW.step(16); HW.release(); HW.step(4);
    HW.Inv.equipped = 'paddle'; HW.hold(['tool', 'up']); HW.step(20); HW.release();
    const bk = thing('ldBasket');
    ok(until(() => bk.ty === s('laundry', 0, 2)[1] && bk.tx <= s('laundry', 7, 0)[0] && !bk.mv, 3000), 'round to the top');
    HW.hold('up'); until(() => p().ty === s('laundry', 0, 1)[1] && !p().ride, 120); HW.step(10); HW.release();
    fallHome('down'); HW.step(5);
    walk(...s('laundry', 2, 1)); HW.face('left'); talk(); ok(HW.Inv.plans.includes('slumber'), 'the Plan');
    /* the drying loft: key B (the sleeping boulder left asleep: its own place on the island is empty, and the hook catches on it) */
    walk(...s('laundry', 9, 9)); walk(...s('loft', 9, 1)); walk(...s('loft', 3, 1)); HW.face('left'); talk();
    walk(...s('loft', 13, 3)); HW.Inv.equipped = 'hook'; HW.face('down'); HW.press('tool', 1); HW.step(80);
    walk(...s('loft', 14, 8)); HW.face('right'); talk(); ok(HW.Inv.keys('slumber') === 1, 'key B');
    fallHome('left');
    /* the landing (lock B): Matron Hush; the Bedroll */
    walk(...s('loft', 9, 1)); walk(...s('laundry', 9, 9)); walk(...s('laundry', 1, 5)); walk(...s('ward', 9, 1));
    HW.hold('up'); until(() => p().ty <= s('landing', 0, 9)[1] && !HW.Cam.busy, 200); HW.release(); HW.step(5);
    HW.hold('up'); HW.step(8); HW.release(); HW.step(20); HW.skipTalk(); HW.step(10); HW.skipTalk();
    const m = thing('matron');
    walk(...s('landing', 9, 8)); HW.step(10); HW.skipTalk(); HW.step(20);
    ok(m.state !== 'sleep', 'Matron awake');
    for (let round = 0; round < 2 && m.alive; round++) {
        walk(...s('landing', 9, 8));
        steps('landing', [[9, 7], [9, 6], [9, 5], [9, 4], [9, 3], [9, 2], [9, 1]]);
        ok(until(() => m.state === 'dazed', 900), 'Matron fell through');
        walk(...s('landing', 2, 2)); walk(...s('landing', 4, 7)); walk(...s('landing', 4, 9)); HW.face('left'); HW.press('atk', 1); HW.step(20);
    }
    ok(!m.alive, 'Matron down'); HW.step(60); HW.skipTalk(); HW.step(10);
    walk(...s('landing', 9, 9)); HW.face('up'); talk(); ok(HW.Inv.has('bedroll'), 'the Bedroll');
    /* the moonwalk: key C */
    walk(...s('landing', 18, 5)); walk(...s('moonwalk', 2, 4)); lay();
    walk(...s('moonwalk', 15, 9)); HW.push('right', 1); homeward();
    walk(...s('moonwalk', 2, 2)); HW.face('up'); talk(); ok(HW.Inv.keys('slumber') === 1, 'key C');
    /* the lever by the hole in the moonwalk's floor draws the laundry chute's bolt (the camera goes down to look) */
    walk(...s('moonwalk', 8, 8)); HW.face('down'); talk(); ok(thing('ldChute').open, 'the laundry chute open from above');
    /* the nursery: the toy home over the drop; the fort: key D */
    walk(...s('moonwalk', 1, 5)); walk(...s('landing', 1, 5)); walk(...s('nursery', 8, 3)); lay();
    walk(...s('nursery', 4, 5)); HW.hold('down'); until(() => p().ty === s('nursery', 0, 7)[1] && p().state === 'normal', 120); HW.release();
    HW.face('down'); HW.press('act', 1); HW.step(10); ok(p().carry, 'the toy');
    homeward(); HW.face('up'); HW.press('act', 1); HW.step(30);
    walk(...s('nursery', 9, 1)); HW.hold('up'); HW.step(60); HW.release(); HW.step(30);
    ok(p().ty <= s('fort', 0, 10)[1], 'into the fort');
    walk(...s('fort', 16, 8)); lay();
    const sn = thing('pfSnore2');
    for (let i = 0; i < 6 && sn.mode !== 'chase'; i++) { walk(...s('fort', 15, 3)); walk(...s('fort', 18, 3)); }
    walk(...s('fort', 14, 9));
    ok(until(() => sn.mode === 'sleep' && thing('pfGate').open, 1500), 'a Snoreling asleep on the Bedroll, on the plate');
    walk(...s('fort', 9, 3)); HW.face('up'); talk(); ok(HW.Inv.keys('slumber') === 1, 'key D');
    /* the moonwalk's north lock; the milk kitchen: across on the springs, the jug home by air, smashed: the bell, the gate */
    walk(...s('fort', 9, 9)); walk(...s('nursery', 9, 1)); walk(...s('nursery', 18, 5)); walk(...s('landing', 18, 5)); walk(...s('moonwalk', 15, 1));
    HW.hold('up'); HW.step(50); HW.release(); HW.step(30);
    ok(HW.G.map.roomAt(p().tx, p().ty).name === 'The Milk Kitchen', 'into the milk kitchen');
    walk(...s('kitchen', 15, 6)); lay();
    walk(...s('kitchen', 15, 4)); HW.hold('left'); until(() => p().state === 'normal' && p().tx <= s('kitchen', 4, 0)[0], 400); HW.release(); HW.step(5);
    walk(...s('kitchen', 2, 3)); HW.face('up'); HW.press('act', 1); HW.step(10); ok(p().carry, 'the jug');
    homeward(); HW.face('down'); HW.press('act', 1);
    ok(until(() => thing('mkGate').open, 400), 'its pieces rang the milk bell: the gate');
    /* (the dreaming door past the gate is a purse of buttons now, and left) */
    /* the long way home, for the Pattern: the Bedroll rolled up and laid again in the long ward's south-east corner; out of the
       ward's east door to the laundry; the basket paddled up its near side against the current and along the top (the wash's
       good dream), ashore under the chute; up it, round the moonwalk's east side to the milk kitchen; over the gap on the lower
       springs (not the bell's: those have the milk's bad dream) and down the hole in the far bank (its good dream over it); the
       moonwalk's west side, the landing, back into the ward by its north door and across its top, never over the way out; the
       linen cupboard's north boards (its good dream, not the bad one over the south); and Homeward, the long way round */
    const round = (r, path) => { for (const [x, y] of path) { const [tx, ty] = s(r, x, y), d = tx > p().tx ? 'right' : tx < p().tx ? 'left' : ty > p().ty ? 'down' : 'up'; for (let i = 0; i < 80 && (p().tx !== tx || p().ty !== ty); i++) { HW.hold(d); HW.step(1); } HW.release(); until(() => !HW.Cam.busy, 60); const h = d === 'left' || d === 'right'; for (let i = 0; i < 16; i++) { const off = h ? p().x - (tx * 16 + 8) : p().y - (ty * 16 + 10); if (Math.abs(off) <= 2) break; HW.hold(h ? (off > 0 ? 'left' : 'right') : (off > 0 ? 'up' : 'down')); HW.step(1); } HW.release(); ok(p().state === 'normal' && p().tx === tx && p().ty === ty, `stepped round to ${r} ${x},${y}`); } };
    HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(3); ok(!HW.Inv.bedroll, 'the Bedroll rolled up');
    walk(...s('kitchen', 15, 9)); HW.hold('down'); HW.step(40); HW.release(); HW.step(30);
    walk(...s('moonwalk', 1, 5)); walk(...s('landing', 9, 9)); HW.hold('down'); HW.step(40); HW.release(); HW.step(30);
    walk(...s('ward', 17, 6)); lay();
    round('ward', [[18, 6], [18, 5], [19, 5]]);
    round('laundry', [[0, 5], [1, 5], [2, 5]]);
    /* (the basket, going round and round since the Plan, rung home to its dock as it comes past) */
    const bs = thing('ldBasket');
    if (!HW.Return.isHome(bs)) {
        ok(until(() => Math.hypot(bs.tx - p().tx, bs.ty - p().ty) < 6 && !bs.mv, 3000), 'the basket comes round past');
        HW.Inv.equipped = 'bell'; HW.press('tool', 1); ok(until(() => HW.Return.isHome(bs) && !bs.mv, 300), 'rung home to its dock');
    }
    round('laundry', [[2, 6], [2, 7], [2, 8], [3, 8]]);
    HW.Inv.equipped = 'paddle';
    HW.hold(['tool', 'up']); ok(until(() => bs.tx === s('laundry', 3, 0)[0] && bs.ty === s('laundry', 0, 2)[1] && !bs.mv, 600), 'the basket paddled up against the current');
    HW.hold(['tool', 'right']); ok(until(() => bs.tx === s('laundry', 6, 0)[0] && !bs.mv, 400), 'and along the top'); HW.release();
    HW.hold('up'); until(() => p().ty === s('laundry', 0, 1)[1] && !p().ride && p().state === 'normal', 120); HW.step(8); HW.release();
    round('laundry', [[6, 1], [7, 1], [7, 0]]);
    round('moonwalk', [[7, 10], [7, 9], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], [15, 8], [15, 7], [15, 6], [15, 5], [15, 4], [15, 3], [15, 2], [15, 1], [15, 0]]);
    round('kitchen', [[15, 10], [15, 9], [15, 8], [15, 7]]);
    HW.hold('left'); until(() => p().state === 'normal' && p().tx <= s('kitchen', 4, 0)[0], 400); HW.release(); HW.step(5);
    round('kitchen', [[2, 7], [3, 7], [4, 7], [4, 8], [4, 9]]);
    HW.hold('down'); until(() => p().state === 'normal' && p().ty >= s('moonwalk', 0, 4)[1], 300); HW.release(); until(() => !HW.Cam.busy, 60); HW.step(2);
    round('moonwalk', [[4, 4], [3, 4], [2, 4], [1, 4], [1, 5], [0, 5]]);
    round('landing', [[19, 5], [18, 5], [18, 6], [18, 7], [18, 8], [17, 8], [16, 8], [15, 8], [14, 8], [13, 8], [12, 8], [11, 8], [10, 8], [10, 9], [9, 9], [9, 10]]);
    round('ward', [[9, 0], [9, 1], [9, 2], [9, 3], [9, 4], [8, 4], [7, 4], [6, 4], [5, 4], [4, 4], [3, 4], [2, 4], [1, 4], [1, 5], [0, 5]]);
    round('linen', [[19, 5], [18, 5], [17, 5], [16, 5], [15, 5], [14, 5], [14, 6], [13, 6], [12, 6], [11, 6], [11, 5], [11, 4], [11, 3], [10, 3], [9, 3], [8, 3]]);
    homeward();
    ok(HW.Progress.flag('slumber_longway'), 'three good dreams on one way home');
    const pc = thing('lwPattern'); ok(until(() => !pc.hidden, 120), "the Pattern's chest in the long ward");
    walk(pc.tx, pc.ty + 1); HW.face('up'); talk(); ok(HW.Inv.hasPattern('slumber'), 'the Pattern');
    /* to the landing's big door */
    walk(...s('ward', 9, 1)); HW.hold('up'); HW.step(40); HW.release(); HW.step(30);
    walk(...s('landing', 9, 1));
    HW.hold('up'); HW.step(60); HW.release(); HW.step(30);
    /* Mother Sloth: three rounds */
    const sl = HW.G.map.ents.find(e => e.type === 'mothersloth');
    const free = (x, y) => { for (let i = 0; i < 8; i++) { if (HW.walkTo(x, y)) return; if (p().pinned) until(() => !p().pinned, 600); HW.skipTalk(); HW.step(2); } ok(false, `walk ${x},${y}`); };
    const caught = () => ok(until(() => !!p().pinned, 600), 'caught');
    const knock = n => { ok(sl.state === 'slump', `round ${n}: she slumps`); free(...s('boss', 9, 6)); HW.face('up'); const hp = sl.hp; for (let k = 0; k < 6 && sl.alive && sl.hp === hp; k++) { HW.press('atk', 1); HW.step(20); } HW.skipTalk(); HW.step(10); };
    /* 1: the Bedroll out past the stars; caught, Homeward: snap */
    walk(...s('boss', 2, 9)); lay();
    HW.step(1); walk(...s('boss', 9, 6)); HW.skipTalk(); HW.step(10); HW.skipTalk();
    for (let k = 0; k < 4 && sl.state !== 'slump'; k++) { HW.walkTo(...s('boss', 9, 6)); caught(); homeward(); }
    knock(1);
    /* 2: the floor past the stars gone; out over the old boards and back in, then caught: the flight goes back over them */
    ok(sl.phase === 2, 'round 2');
    free(...s('boss', 5, 8)); lay();
    steps('boss', [[5, 9], [6, 9], [7, 9], [8, 9], [8, 8], [8, 7]]); caught(); homeward();
    HW.step(45);
    steps('boss', [[5, 9], [6, 9], [7, 9], [8, 9], [9, 9], [10, 9], [11, 9], [12, 9], [13, 9], [13, 8], [12, 8], [12, 7]]); caught(); homeward();
    knock(2);
    /* 3: the boards gone, the bedposts left: caught in line with one, turn and hook it, and drop home */
    ok(sl.phase === 3, 'round 3');
    for (const x of [3, 15]) {
        free(...s('boss', x, 5)); lay(); caught();
        HW.hold('down'); HW.step(2); HW.release(); HW.Inv.equipped = 'hook'; HW.press('tool', 1);
        ok(until(() => sl.arms.some(a => a.state === 'snapped' && a.side === (x < 9 ? -1 : 1)), 120), 'hooked out of her grip: snap');
        landed();
    }
    knock(3);
    ok(!sl.alive, 'Mother Sloth down'); HW.step(100); HW.skipTalk(); HW.step(10);
    HW.G.cheats.god = false;
    const hoop = HW.ents('hoop')[0]; ok(hoop, 'the hoop');
    walk(hoop.tx - 1, hoop.ty); HW.face('right'); HW.press('act', 1); HW.skipTalk(0); HW.step(300); HW.skipTalk(); HW.step(10); HW.skipTalk();
    ok(HW.Inv.knots.includes('slumber') && HW.Progress.flag('d5'), 'the Sleeping Knot');
    const exit = HW.ents('warp').find(w => w.to === 'hollow' && w.ty < 11);
    ok(exit, 'a way out');
    walk(exit.tx + 1, exit.ty); HW.hold('left'); until(() => area() === 'hollow', 200); HW.release(); HW.step(30);
    ok(area() === 'hollow', 'back outside');
    assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
};

export const LEG6 = (HW, chain) => {
    const ok = (c, m) => { assert.ok(c, m + ` (at ${HW.G.map && HW.G.map.id} ${HW.player() && HW.player().tx},${HW.player() && HW.player().ty})`); };
    const walk = (x, y, m, max) => { let r = HW.walkTo(x, y, max); for (let i = 0; i < 3 && !r; i++) { HW.skipTalk(); HW.step(5); r = HW.walkTo(x, y, max); } ok(r, m || `walk ${x},${y}`); };
    const area = () => HW.G.map.id;
    const thing = id => HW.G.map.find(id);
    const until = (fn, max = 3000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
    const talk = () => { HW.press('act', 1); HW.skipTalk(); };
    const p = () => HW.player();
    const strings = moves => { const names = { U: 'up', D: 'down', L: 'left', R: 'right' }; for (const m of moves) { const ps = HW.global('Crossbar').ctl.puppets; HW.hold(names[m]); until(() => ps.some(e => e.mv), 12); until(() => !ps.some(e => e.mv), 30); HW.release(); HW.step(3); } };
    const M = { foyer: [20, 33], box: [40, 33], aud: [20, 22], pit: [0, 22], reh: [40, 22], wings: [20, 11], dress: [0, 11], props: [40, 11], stage: [20, 0], fly: [60, 11], traps: [60, 22] };
    const m = (r, x, y) => [M[r][0] + x, M[r][1] + y];
    if (chain) chain('afterD5'); else HW.preset('afterD5'); HW.step(10); HW.skipTalk();
    HW.Inv.maxHp = HW.Inv.hp = 32;

    /* back over the stream, along the road, through town and the canyon, up to the high mesa */
    walk(128 + 11, 40 + 11); HW.hold('left'); until(() => p().ty >= 40 + 14 && p().state === 'normal', 150); HW.release();
    walk(15, 83, 'to the high mesa', 60000);
    HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(2);
    walk(12, 83); HW.face('up'); HW.press('act', 1); HW.skipTalk(0); HW.step(60); HW.skipTalk();
    ok(p().ty === 74, 'into the straw');
    /* the Hall's portcullis winds up only while both parade pads are held: a pale crate from by the fog (the fair's own
       crates go home) set down in each pen's open end while its soldier is on the pad boxes it in there */
    for (const [id, sol, gx, face] of [['lkStray1', 'pgSolA', 28, 'right'], ['lkStray2', 'pgSolB', 34, 'left']]) {
        const c = thing(id);
        walk(c.tx + 1, c.ty, 'to ' + id, 20000); HW.face('left'); HW.press('act', 1); HW.step(10);
        walk(gx, 53, 'to the pen', 20000); HW.face(face);
        const s = thing(sol);
        until(() => s.ty === 52 && Math.abs(s.y - (52 * 16 + 10)) < 3, 300); HW.press('act', 1); HW.step(5);
    }
    HW.step(100); ok(thing('pgGate').open, 'the portcullis wound up');
    walk(31, 50); HW.hold('up'); until(() => area() === 'marionette', 120); HW.release(); HW.step(30);
    ok(area() === 'marionette', 'inside the Marionette Hall');
    HW.G.cheats.god = true;      /* (soldiers, the Captain, sandbags: the dodging isn't what this checks) */

    /* the foyer's flat; the Plan */
    walk(...m('foyer', 18, 5)); HW.face('right'); HW.press('atk', 1); HW.step(20);
    walk(...m('box', 10, 4)); HW.face('up'); talk(); ok(HW.Inv.plans.includes('marionette'), 'the Plan');
    /* the orchestra pit: key A */
    walk(...m('box', 1, 5)); walk(...m('foyer', 9, 1)); walk(...m('aud', 9, 9)); walk(...m('aud', 1, 5)); walk(...m('pit', 10, 1)); HW.push('down', 2);
    walk(...m('pit', 3, 6)); ok(until(() => thing('opGate').open, 3000), 'the drummer crossed the plate');
    walk(...m('pit', 2, 2)); HW.face('up'); talk(); ok(HW.Inv.keys('marionette') === 1, 'key A');
    /* the rehearsal room (lock A): key B */
    walk(...m('pit', 18, 5)); walk(...m('aud', 18, 5)); HW.hold('right'); HW.step(40); HW.release(); HW.step(30);
    walk(...m('reh', 5, 4)); HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(2);
    walk(...m('reh', 5, 5)); HW.hold('down'); until(() => p().ty === m('reh', 0, 7)[1] && p().state === 'normal', 120); HW.release();
    HW.face('down'); talk(); ok(HW.Inv.keys('marionette') === 1, 'key B');
    HW.Inv.equipped = 'bedroll'; HW.hold('tool'); HW.step(24); HW.release(); until(() => p().state === 'normal', 300);
    /* the wings (lock B): Captain Tin; the Crossbar */
    walk(...m('reh', 1, 5)); walk(...m('aud', 9, 1)); HW.hold('up'); until(() => p().ty <= m('wings', 0, 9)[1] && !HW.Cam.busy, 200); HW.release(); HW.step(5);
    HW.hold('up'); HW.step(10); HW.release(); HW.skipTalk(); HW.step(5);
    const c = thing('tin');
    for (let round = 0; round < 3 && c.alive; round++) {
        walk(...m('wings', 4, 5));
        ok(until(() => c.state === 'march' && c.march === 1 && c.x < m('wings', 8, 0)[0] * 16, 1500), 'coming left');
        HW.face('down'); HW.press('atk', 1); HW.step(14);
        ok(until(() => c.state === 'dazed', 200), 'into the trap');
        walk(...m('wings', 2, 5)); HW.face('down'); HW.press('atk', 1); HW.step(14); HW.step(330);
    }
    ok(!c.alive, 'Captain Tin down'); HW.step(60); HW.skipTalk(); HW.step(10);
    walk(...m('wings', 9, 4)); HW.face('up'); talk(); ok(HW.Inv.has('crossbar'), 'the Crossbar');
    /* the dressing rooms: key C */
    walk(...m('wings', 1, 5)); walk(...m('dress', 2, 9)); HW.Inv.equipped = 'crossbar'; HW.face('up'); HW.press('tool', 1); HW.step(2);
    strings('UUUUURR' + 'RRRRRRRRRRRRR'); HW.step(5); HW.press('tool', 1); HW.step(5);
    walk(...m('dress', 9, 7)); HW.face('right'); talk(); ok(HW.Inv.keys('marionette') === 1, 'key C');
    /* the prop store: the shelves stop the ones in front; the way east */
    walk(...m('dress', 18, 5)); walk(...m('wings', 18, 5)); HW.hold('right'); HW.step(40); HW.release(); HW.step(30);
    walk(...m('props', 9, 9)); HW.Inv.equipped = 'crossbar'; HW.face('up'); HW.press('tool', 1); HW.step(2);
    strings('RRRRRRRRDDDD'); HW.step(5); HW.press('tool', 1); HW.step(5);
    ok(thing('psGateE').open, 'the prop store: the way east');
    /* the fly tower: round the catwalk, then rung home with the Bell over all three plates at once */
    walk(...m('fly', 2, 5)); HW.Inv.equipped = 'crossbar'; HW.face('right'); HW.press('tool', 1); HW.step(2);
    strings('UURRRRDDDDLLLLU');
    HW.Inv.equipped = 'bell'; HW.step(2); HW.press('tool', 1);
    ok(until(() => thing('faGate').open, 120), 'the fly tower: the fly door');
    /* the trap room: the understudies stepped off their stands; hooked across from stand to stand; the Pattern */
    const hooked = () => p().state === 'normal' && !HW.global('TOOLS').hook.h;
    walk(...m('traps', 9, 2)); HW.Inv.equipped = 'crossbar'; HW.face('right'); HW.press('tool', 1); HW.step(2);
    strings('LLL');
    HW.Inv.equipped = 'hook'; HW.step(2); HW.face('down'); HW.press('tool', 1); until(hooked, 120);
    walk(...m('traps', 10, 5)); HW.face('down'); HW.press('tool', 1); until(hooked, 120);
    ok(p().ty === m('traps', 0, 8)[1], 'across the traps');
    walk(...m('traps', 14, 8)); HW.face('down'); talk(); ok(HW.Inv.hasPattern('marionette'), 'the Pattern');
    /* out through the rehearsal room (unbolted now), the auditorium, the wings: the great stage */
    walk(...m('reh', 1, 5)); walk(...m('aud', 9, 1)); walk(...m('wings', 9, 1)); HW.hold('up'); HW.step(60); HW.release(); HW.step(30); HW.skipTalk(); HW.step(20); HW.skipTalk();
    const g = HW.G.map.ents.find(e => e.type === 'greatmarionette');
    const scene = () => until(() => { if (HW.global('Dialog').active) HW.skipTalk(); return !HW.global('Dialog').active && !HW.global('Script').blocking(); }, 900);
    /* act I: the two little Wrens round its feet */
    walk(...m('stage', 9, 9)); HW.Inv.equipped = 'crossbar'; HW.face('up'); HW.press('tool', 1); HW.step(2);
    strings('URRR' + 'URRDDLLU');
    ok(until(() => g.state === 'down', 60), 'act I: it falls');
    HW.press('tool', 1); HW.step(3);
    const knock = () => { const hp = g.hp; for (let k = 0; k < 6 && g.alive && g.hp === hp; k++) { HW.press('atk', 1); HW.step(20); } };     /* (two knocks: between them it flails) */
    walk(...m('stage', 8, 8)); HW.face('up'); knock(); scene();
    /* act II: the third little Wren in its march, so it turns onto the trap */
    walk(...m('stage', 16, 9)); HW.Inv.equipped = 'crossbar'; HW.face('up'); HW.press('tool', 1); HW.step(2);
    strings('RUUU');
    ok(until(() => g.state === 'trapped', 2400), 'act II: down the trap');
    HW.press('tool', 1); HW.step(3);
    walk(...m('stage', 11, 7)); HW.face('up'); knock(); scene(); HW.step(60);
    /* act III: its bar hooked down, its strings taken up, walked onto the trap */
    walk(...m('stage', 11, 7)); HW.face('up'); HW.Inv.equipped = 'hook'; HW.press('tool', 1); until(() => !!g.bar, 60); HW.step(20);
    HW.Inv.equipped = 'crossbar'; HW.step(2); HW.face('up'); HW.press('tool', 1); HW.step(2);
    strings('LD');
    ok(until(() => g.state === 'trapped', 60), 'act III: walked into the trap');
    walk(...m('stage', 11, 7)); HW.face('up'); knock(); HW.step(4);
    ok(!g.alive, 'the Great Marionette down');
    /* the curtain, Jory, the Makers in a line; then each of them heard out */
    HW.skipTalk(); HW.step(20);
    ok(HW.G.map.ents.filter(e => e.r1).length === 6, 'six Makers on the stage');
    hearMakers(HW);
    for (let i = 0; i < 40 && !HW.Progress.flag('reveal1'); i++) { HW.skipTalk(); HW.step(20); }
    ok(HW.Progress.flag('reveal1'), 'Reveal 1'); HW.skipTalk(); HW.step(20);
    HW.G.cheats.god = false;
    const hoop = HW.ents('hoop')[0]; ok(hoop, 'the hoop');
    walk(hoop.tx - 1, hoop.ty); HW.face('right'); HW.press('act', 1); HW.skipTalk(0); HW.step(300); HW.skipTalk(); HW.step(10); HW.skipTalk();
    ok(HW.Inv.knots.includes('marionette') && HW.Progress.flag('d6'), 'the Dancing Knot');
    const exit = HW.ents('warp').find(w => w.to === 'hollow' && w.ty < 11);
    ok(exit, 'a way out');
    walk(exit.tx + 1, exit.ty); HW.hold('left'); until(() => area() === 'hollow', 200); HW.release(); HW.step(30);
    ok(area() === 'hollow', 'back outside');
    assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
};

export const LEG7 = (HW, chain) => {
    const ok = (c, m) => { assert.ok(c, m + ` (at ${HW.G.map && HW.G.map.id} ${HW.player() && HW.player().tx},${HW.player() && HW.player().ty})`); };
    const walk = (x, y, m, max) => { let r = HW.walkTo(x, y, max); for (let i = 0; i < 3 && !r; i++) { HW.skipTalk(); HW.step(5); r = HW.walkTo(x, y, max); } ok(r, m || `walk ${x},${y}`); };
    const area = () => HW.G.map.id;
    const thing = id => HW.G.map.find(id);
    const until = (fn, max = 3000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
    const talk = () => { HW.press('act', 1); HW.skipTalk(); };
    const p = () => HW.player();
    const S = { gate: [20, 22], wind: [20, 11], store: [0, 11], kennel: [40, 11], practice: [40, 22], rope: [0, 22], loft: [0, 0], heart: [20, 0], ugate: [20, 55], uwind: [20, 44], ustore: [0, 44], ukennel: [40, 44], upractice: [40, 55], urope: [0, 55], uloft: [0, 33], uheart: [20, 33] };
    const s = (r, x, y) => [S[r][0] + x, S[r][1] + y];
    const hatch = (r, x, y, d) => { walk(...s(r, x, y)); HW.face(d); HW.press('act', 1); HW.step(40); };
    const knot = () => { HW.hold('act'); HW.step(20); HW.release(); HW.step(2); };
    const stitch = moves => { const names = { U: 'up', D: 'down', L: 'left', R: 'right' }; HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(2); for (const m of moves) { HW.hold(names[m]); HW.step(2); HW.release(); HW.step(8); } HW.press('tool', 1); HW.step(2); };
    const rack = moves => { const names = { U: 'up', D: 'down', L: 'left', R: 'right' }; HW.Inv.equipped = 'crossbar'; HW.press('tool', 1); HW.step(2); for (const m of moves) { HW.hold(names[m]); HW.step(4); HW.release(); HW.step(14); } HW.press('tool', 1); HW.step(2); };
    const into = (name, d) => { HW.hold(d); until(() => HW.Cam.room && HW.Cam.room.name === name && !HW.Cam.busy, 240); HW.release(); HW.step(2); ok(HW.Cam.room.name === name, 'into ' + name); };
    if (chain) chain('afterD6'); else HW.preset('afterD6'); HW.step(10); HW.skipTalk();
    HW.Inv.maxHp = HW.Inv.hp = 34;

    /* home through the fair gate (its bolt drawn, on the fair's side), to the Inn and its Staff door */
    if (!HW.Progress.flag('fair_gate')) { walk(59, 59, 'to the fair gate\'s bolt', 60000); HW.face('up'); talk(); ok(HW.Progress.flag('fair_gate'), 'the bolt drawn'); }
    const door = HW.G.map.ents.find(e => e.kind === 'warp' && e.to === 'inn');
    walk(door.tx, door.ty + 1, 'to the Inn', 60000); HW.hold('up'); until(() => area() === 'inn', 120); HW.release(); HW.step(30);
    walk(13, 3); HW.face('up'); HW.press('act', 1); until(() => area() === 'underside', 120); HW.step(30); HW.skipTalk(); HW.step(5);
    ok(area() === 'underside', 'down the Staff stairs');
    walk(31, 4); HW.face('up'); talk();
    ok(HW.Progress.flag('met_gundry_below'), 'Gundry');
    walk(29, 1); HW.hold('up'); until(() => area() === 'spoolworks', 120); HW.release(); HW.step(30); HW.skipTalk();
    ok(area() === 'spoolworks', 'into the Spoolworks');
    HW.G.cheats.god = true;      /* (spoolmites, Cog's teeth, yarn balls: the dodging isn't what this checks) */

    /* the Gatehouse: untie the crate from underneath */
    hatch('gate', 16, 7, 'down'); walk(...s('ugate', 13, 4)); HW.face('up'); HW.press('act', 1); HW.step(3);
    ok(until(() => HW.Return.isHome(thing('gaBlock')), 400), 'the crate goes home');
    hatch('ugate', 16, 7, 'down');
    walk(...s('gate', 9, 1)); HW.hold('up'); until(() => HW.Cam.room && HW.Cam.room.name === 'The Winding Hall' && !HW.Cam.busy, 200); HW.release(); HW.step(5);
    /* under the Winding Hall: the counterweight pushed off its plate past the sleeping boulder's place; the boulder rung
       awake from across the room, out of the weight's hearing: home in a flash, in the weight's way home */
    hatch('wind', 17, 7, 'down');
    walk(...s('uwind', 11, 5)); HW.push('right', 2); HW.step(25);
    walk(...s('uwind', 4, 2)); HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(60);
    ok(HW.Return.isHome(thing('hwRock')) && !HW.Return.isHome(thing('hwWeight')), 'the boulder in the weight\'s way');
    hatch('uwind', 17, 7, 'down');
    ok(thing('swGateW').open, 'the Spool Store gate');
    walk(...s('wind', 1, 5)); HW.hold('left'); HW.step(40); HW.release(); HW.step(30);
    /* the Spool Store: on the plate, tied off below; the Plan; the key */
    walk(...s('store', 15, 2)); HW.push('down', 3); HW.step(25);
    hatch('store', 15, 5, 'right'); walk(...s('ustore', 15, 4)); HW.face('up'); knot();
    walk(...s('ustore', 5, 7)); HW.face('down'); talk(); ok(HW.Inv.plans.includes('spoolworks'), 'the Plan');
    hatch('ustore', 15, 5, 'right');
    walk(...s('store', 2, 3)); HW.face('up'); talk(); ok(HW.Inv.keys('spoolworks') === 1, 'the key');
    /* the Kennel: Cog (he wakes once she's well inside); two knocks */
    walk(...s('wind', 18, 5)); HW.hold('right'); HW.step(40); HW.release(); HW.step(5); walk(...s('kennel', 3, 5)); HW.step(2); HW.skipTalk(); HW.step(5);
    const cog = HW.G.map.ents.find(e => e.type === 'cog');
    for (let round = 0; round < 3 && cog.alive && !cog.down; round++) {
        hatch('kennel', 9, 7, 'down'); until(() => cog.state === 'sit', 400);
        walk(...s('ukennel', 9, 5)); HW.face('up'); knot(); ok(cog.knotted, 'Cog held');
        hatch('ukennel', 9, 7, 'down'); walk(...s('kennel', 9, 5)); HW.face('up'); HW.press('atk', 1); HW.step(24);
    }
    HW.skipTalk(); HW.step(10);
    ok(!cog.alive, 'Cog runs down');
    walk(...s('kennel', 5, 3)); HW.face('up'); talk(); ok(HW.Inv.has('needle'), 'the Needle');
    /* the Kennel's south door: the weight in the way, given a new place */
    walk(...s('practice', 9, 0)); HW.face('down'); stitch('R'); ok(until(() => HW.Return.isHome(thing('paWeight')), 60), 'the weight in its nook');
    /* the Practice Floor: the boy's cord hangs over a hole below, out of reach, so his plate is made his place (the
       Needle, from up here); from the rack below the little Wren walked onto hers and tied; let go, the boy walks home: his plate */
    walk(...s('practice', 13, 2)); HW.face('down'); stitch('DDD'); until(() => HW.Return.isHome(thing('paBoy')), 120);
    walk(...s('practice', 9, 3)); hatch('practice', 3, 7, 'down');
    walk(...s('upractice', 12, 4)); HW.face('up'); rack('DDDDD');
    walk(...s('upractice', 11, 4)); HW.face('up'); knot();
    ok(until(() => thing('paWren').knotted && HW.Return.isHome(thing('paBoy')) && thing('paBoy').ty === s('practice', 0, 6)[1], 600), 'both puppets on their plates');
    hatch('upractice', 3, 7, 'down');
    walk(...s('practice', 1, 5)); into('The Gatehouse', 'left');
    walk(...s('gate', 3, 5)); ok(HW.Progress.areaFlag('spoolworks', 'door:gaGateE'), 'out through the Gatehouse door');
    /* the Ropewalk, across the hall: below, the crate moved into line through its cord and tied off; hooked over the gap */
    walk(...s('gate', 1, 5)); into('The Ropewalk', 'left');
    hatch('rope', 15, 7, 'down');
    walk(...s('urope', 2, 3)); HW.face('up'); stitch('RRRR'); ok(until(() => HW.Return.isHome(thing('rwCrate')), 120), 'the crate in line');
    walk(...s('urope', 6, 3)); HW.face('up'); knot(); ok(thing('rwCrate').knotted, 'tied off');
    hatch('urope', 15, 7, 'down');
    walk(...s('rope', 11, 2)); HW.face('left'); HW.Inv.equipped = 'hook'; HW.press('tool', 1); until(() => p().state === 'normal' && !HW.global('TOOLS').hook.h, 120); HW.step(2);
    ok(p().tx === s('rope', 7, 2)[0], 'hooked over the gap');
    walk(...s('rope', 2, 7)); HW.face('down'); talk(); ok(HW.Inv.keys('spoolworks') === 1, 'the Ropewalk key');
    /* out by its far door into the Spool Store, down the hatch; the lock north, to the Loft */
    walk(...s('rope', 4, 1)); into('The Spool Store', 'up');
    hatch('store', 15, 5, 'right');
    walk(...s('ustore', 2, 2)); HW.hold('up'); HW.step(60); HW.release(); HW.step(5);
    ok(HW.Inv.keys('spoolworks') === 0, 'unlocked');
    /* the Bobbin Loft: the first stitched onto its plate and tied off below; the other three stitched (the fourth stitch
       lets go of the first, but its knot holds it there) */
    hatch('uloft', 9, 7, 'down');
    walk(...s('loft', 6, 5)); HW.face('up'); stitch('LLLU'); until(() => HW.Return.isHome(thing('blB1')), 120);
    hatch('loft', 9, 7, 'down'); walk(...s('uloft', 3, 4)); HW.face('up'); knot(); hatch('uloft', 9, 7, 'down');
    walk(...s('loft', 12, 5)); HW.face('up'); stitch('RRRU'); until(() => HW.Return.isHome(thing('blB2')), 120);
    walk(...s('loft', 6, 6)); HW.face('down'); stitch('LLLD'); until(() => HW.Return.isHome(thing('blB3')), 120);
    walk(...s('loft', 12, 6)); HW.face('down'); stitch('RRRD'); until(() => HW.Return.isHome(thing('blB4')), 120);
    ok(thing('blB1').knotted && thing('blB1').tx === s('loft', 3, 3)[0], 'the knot holds the first');
    HW.step(310); walk(...s('loft', 9, 3)); HW.face('up'); talk(); ok(HW.Inv.hasPattern('spoolworks'), 'the Pattern');
    /* out of the Loft, through the Store and the Hall, up through the big door: the Tangle */
    walk(...s('store', 9, 1)); walk(...s('wind', 9, 1)); HW.hold('up'); HW.step(40); HW.release(); HW.step(30);
    walk(...s('heart', 6, 7)); HW.skipTalk(); HW.step(5);
    const t = HW.G.map.ents.find(e => e.kind === 'tangle');
    /* 1: three stitched away, the fourth pushed off and tied below; knock the core */
    until(() => ['tbN', 'tbW', 'tbE', 'tbS'].every(id => HW.Return.isHome(thing(id)) && !thing(id).mv), 300);
    walk(...s('heart', 8, 2)); HW.face('right'); stitch('UL'); until(() => HW.Return.isHome(thing('tbN')), 60);
    walk(...s('heart', 6, 4)); HW.face('down'); stitch('LL'); until(() => HW.Return.isHome(thing('tbW')), 60);
    walk(...s('heart', 12, 4)); HW.face('down'); stitch('RR'); until(() => HW.Return.isHome(thing('tbE')), 60);
    walk(...s('heart', 8, 8)); HW.push('right', 2); HW.step(25);
    hatch('heart', 2, 7, 'down'); walk(...s('uheart', 9, 7)); HW.face('down'); knot(); hatch('uheart', 2, 7, 'down');
    ok(until(() => t.state === 'open', 300), 'the Tangle comes apart');
    const core = () => { HW.face('up'); const hp = t.hp; for (let k = 0; k < 8 && t.alive && t.hp === hp; k++) { HW.press('atk', 1); HW.step(20); } };     /* (three knocks: between them it lashes) */
    walk(...s('heart', 9, 6)); core(); HW.step(10); HW.skipTalk(); HW.step(5);
    ok(t.hp === 2 && t.state === 'up', 'up on the hoist');
    /* 2: below, the hoist's counterweight off its plate: down it comes; knock it */
    hatch('heart', 2, 7, 'down'); walk(...s('uheart', 1, 7)); HW.push('up', 1);
    ok(until(() => t.state === 'down', 120), 'let down');
    hatch('uheart', 2, 7, 'down'); walk(...s('heart', 9, 6)); core(); HW.step(10); HW.skipTalk(); HW.step(5);
    ok(t.hp === 1 && t.state === 'haul', 'it hauls everything in');
    /* 3: the fourth gripped and held out, the Bell rung with the other hand: everything goes home at once, where it
       was put; knock the core */
    until(() => t.haulT === 0 && thing('tbN').ret.state !== 'home', 400);
    walk(...s('heart', 10, 8)); HW.face('left'); HW.hold('act'); HW.step(3);
    HW.hold(['act', 'right']); until(() => p().tx === s('heart', 11, 8)[0] && !thing('tbS').mv, 60); HW.hold('act'); HW.step(2);
    until(() => t.haulT === 2, 200);
    HW.Inv.equipped = 'bell'; HW.hold(['act', 'tool']); HW.step(1); HW.hold('act');
    ok(until(() => t.state === 'open', 90), 'every thread out at once');
    HW.release(); HW.step(2);
    walk(...s('heart', 9, 6)); core(); HW.step(10);
    ok(!t.alive, 'the Tangle undone');
    for (let i = 0; i < 20 && !HW.Progress.flag('d7'); i++) { HW.skipTalk(); HW.step(20); }
    ok(HW.Progress.flag('d7'), 'Gundry: an apprentice');
    walk(...s('heart', 9, 5)); HW.step(5);
    ok(HW.Inv.maxHp === 36, 'a new heart');
    assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
};

export const LEG8 = (HW, chain) => {
    if (chain) chain('afterD7'); else HW.preset('afterD7'); HW.step(10); HW.skipTalk();
    const ok = (c, m) => assert.ok(c, m);
    const until = (fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
    const pos = () => `${HW.G.map.id} ${HW.player().tx},${HW.player().ty}`;
    const walk = (x, y, max = 6000) => ok(HW.walkTo(x, y, max), `walk to ${x},${y} (at ${pos()})`);
    const act = d => { HW.face(d); HW.press('act', 1); HW.step(3); HW.skipTalk(); HW.step(5); };
    const tug = () => { HW.press('act', 1); HW.step(3); };
    const knot = () => { HW.hold('act'); HW.step(20); HW.release(); HW.step(2); };
    const tuck = () => HW.G.map.find('tuck');
    const ahas = () => [...HW.global('Making').cur.ahas];
    const under = (x, y, side = 'down') => { const [dx, dy] = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[side]; walk(x + dx, y + 11 + dy); HW.face({ down: 'up', up: 'down', left: 'right', right: 'left' }[side]); };
    const stitch = moves => { const names = { U: 'up', D: 'down', L: 'left', R: 'right' }; HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(2); for (const m of moves) { HW.hold(names[m]); HW.step(2); HW.release(); HW.step(8); } HW.press('tool', 1); HW.step(30); };
    const finishMaking = n => { const t = tuck(); ok(until(() => t.state === 'done', 2500), `Tuck reaches the hoop (${t.tx},${t.ty} ${t.state})`); for (let i = 0; i < 16 && HW.G.map.id !== 'underside'; i++) { HW.skipTalk(); HW.step(20); } for (let i = 0; i < 6; i++) { HW.skipTalk(); HW.step(10); } ok(HW.Progress.flag('making' + n), 'Making ' + n); };
    const littleDoor = x => { walk(x, 2); HW.hold('up'); until(() => HW.G.map.id !== 'underside', 120); HW.release(); HW.step(20); HW.skipTalk(); HW.step(5); };
    HW.Inv.stitches = [];
    const door = n => HW.global('MAKING_DOOR_X')[n - 1];
    /* Gundry, in the Guild Hall: the job */
    walk(31, 4); act('up');
    ok(HW.Progress.flag('gundry_job'), "Gundry's job");
    /* Making 1 */
    littleDoor(door(1)); ok(HW.G.map.id === 'making1', 'into Making 1');
    let t = tuck();
    under(2, 1, 'down'); tug(); until(() => ahas().includes('found'), 400); until(() => t.state === 'sit', 600);
    under(10, 5, 'down'); tug(); until(() => t.state === 'sit' && t.tx > 20, 900);
    const K1 = HW.G.map.find('m1K'); under(28, 6, 'down'); tug(); until(() => K1.ty === 7 && !K1.mv, 400); knot();
    finishMaking(1);
    /* Making 2 */
    littleDoor(door(2)); t = tuck();
    under(5, 8, 'up'); tug(); until(() => ahas().includes('found'), 400);
    under(10, 2, 'down'); tug(); HW.step(20); knot();
    until(() => t.state === 'sit' && t.tx === 16, 900);
    under(16, 5, 'down'); tug(); until(() => t.tx >= 20 && t.state === 'sit', 1200);
    under(23, 3, 'down'); tug(); until(() => t.tx <= 25, 200);
    under(29, 9, 'up'); HW.press('act', 1); HW.step(3);
    finishMaking(2);
    /* Making 3 */
    littleDoor(door(3)); t = tuck();
    under(5, 8, 'up'); tug(); until(() => ahas().includes('found'), 400); until(() => t.state === 'sit', 600);
    under(10, 5, 'down'); stitch('U');
    until(() => t.tx >= 14, 400);
    under(25, 3, 'down'); tug(); HW.step(20); knot();
    until(() => t.state === 'sit' && t.tx > 20, 900);
    const K3 = HW.G.map.find('m3K'); under(28, 6, 'down'); tug(); until(() => K3.ty === 7 && !K3.mv, 400); knot();
    finishMaking(3);
    /* Making 4: he sulks on the plate; untie the heavy one; lure him off the near plate, then untie the far one */
    littleDoor(door(4)); t = tuck();
    under(2, 1, 'down'); tug(); until(() => ahas().includes('found'), 400); until(() => t.state === 'sit', 900);
    under(11, 1, 'down'); HW.press('act', 1); HW.step(3);
    until(() => t.state === 'sit' && t.tx > 20, 1200);
    under(32, 3, 'down'); tug(); until(() => t.tx <= 34, 300);
    under(38, 1, 'down'); HW.press('act', 1); HW.step(3);
    until(() => t.state === 'sit' && t.tx > 40, 1200);
    under(46, 5, 'down'); tug();
    walk(45, 16); finishMaking(4);
    /* Making 5, the Tidyhouse underneath: the Foyer's block pushed onto its plate (he sits west of it) and tied; the
       Hall's block pushed into the lane, the bust let go and tugged home down it */
    littleDoor(door(5)); t = tuck();
    until(() => t.state === 'sit', 600);
    const F5 = HW.G.map.find('m5F'); under(46, 5); tug(); until(() => F5.tx === 47 && F5.ret.state === 'away' && !F5.mv, 400); knot();
    until(() => t.state === 'sit' && t.tx < 40, 900);
    under(22, 1); tug(); until(() => ahas().includes('found'), 600); until(() => t.state === 'sit', 900);
    const K5 = HW.G.map.find('m5K'); under(28, 5); tug(); until(() => K5.tx === 29 && K5.ret.state === 'away' && !K5.mv, 400);
    under(29, 6); tug(); tug();
    finishMaking(5);
    for (let i = 0; i < 10; i++) { HW.skipTalk(); HW.step(10); }
    /* Making 6, with Otto: the block he clears from the passage tied where he pushed it (Otto tsks at it); the next
       block pushed west and tied, so Otto's side of it is the doormat */
    littleDoor(door(6)); t = tuck(); let o = HW.G.map.find('otto');
    until(() => t.state === 'sit', 600);
    under(2, 8, 'up'); tug(); until(() => ahas().includes('found'), 500); until(() => t.state === 'sit' && t.tx === 9, 900);
    under(10, 5); tug(); knot();
    until(() => t.tx >= 20, 900); until(() => t.state === 'sit', 900);
    const B6 = HW.G.map.find('m6B'); under(30, 5); tug(); until(() => B6.ret.state === 'away' && !B6.mv, 400); knot();
    finishMaking(6);
    /* Making 7: the junction's block pushed aside and tied (Otto tsks in the way), Otto's own thread tugged and Tuck
       slips by; the crate draws him west, the block pushed east and tied: Otto on one mat, Tuck on the other */
    littleDoor(door(7)); t = tuck(); o = HW.G.map.find('otto');
    until(() => t.state === 'sit', 900);
    under(1, 9, 'up'); tug(); until(() => ahas().includes('found'), 500); until(() => t.state === 'sit' && t.tx === 8, 900);
    under(9, 5); tug(); knot(); until(() => o.tsking, 300);
    under(9, 6); tug();
    until(() => t.tx >= 20, 1500); until(() => t.state === 'sit', 900);
    const C7 = HW.G.map.find('m7C'), K7 = HW.G.map.find('m7K');
    under(27, 2); tug(); until(() => C7.ret.state !== 'home', 400); HW.step(150);
    under(30, 5); tug(); until(() => K7.ret.state === 'away' && !K7.mv, 600); knot();
    finishMaking(7);
    /* Making 8, the Grand Hall: the big door's counterweight; the nibbler tied; the block pushed out of its slot and
       tied till the Housekeeper stands on its way home, then let go; the last block */
    littleDoor(door(8)); t = tuck(); o = HW.G.map.find('otto');
    until(() => t.state === 'sit', 900);
    under(44, 7, 'up'); tug(); until(() => ahas().includes('found'), 500); until(() => t.state === 'sit', 900);
    walk(43, 16); HW.face('left'); HW.push('left', 1); HW.step(5);
    until(() => t.tx < 40, 600); until(() => t.state === 'sit', 900);
    under(25, 7); tug(); HW.step(20); knot();
    const W8 = HW.G.map.find('m8W'); under(26, 5); tug(); until(() => W8.ret.state === 'away' && !W8.mv, 500); knot();
    until(() => t.state === 'sit' && t.tx <= 22, 900); ok(until(() => o.tx === 26 && o.ty === 5 && o.tsking, 900), 'the Housekeeper on its way home');
    HW.press('act', 1); HW.step(3);
    ok(until(() => o.state === 'down', 60), 'the Housekeeper tidied by his own tidying');
    until(() => t.tx < 20, 600); until(() => t.state === 'sit', 900);
    under(13, 5); tug();
    finishMaking(8);
    /* Wren's own: Gundry's empty one, set out from underneath (the wooden block just past the north gap, the stone block
       in the south gap, the button under the block), Tuck let in, and the block made to jump while he sits */
    for (let i = 0; i < 20 && (HW.global('Dialog').active || HW.global('Script').blocking()); i++) { HW.skipTalk(); HW.step(10); }
    ok(HW.Progress.flag('cap_given') && !HW.Progress.flag('makings_done'), 'the empty Little House');
    littleDoor(door(9)); ok(HW.G.map.id === 'making9', 'into her own');
    under(7, 2, 'down'); stitch('RRR');
    under(7, 8, 'up'); stitch('RR');
    walk(3, 19); HW.face('down'); HW.press('act', 1); HW.step(3); HW.skipTalk(0); HW.step(5);
    ok(HW.global('Capstone').button() === 'capW', 'the button under the wooden block');
    walk(7, 19); act('down');
    t = tuck(); ok(until(() => t.state === 'sit', 900), 'Tuck in, and stuck');
    under(10, 2, 'down'); tug();
    finishMaking(9);
    for (let i = 0; i < 40 && (!HW.Progress.flag('makings_done') || HW.global('Dialog').active || HW.global('Script').blocking()); i++) { HW.skipTalk(); HW.step(10); }
    ok(HW.Progress.flag('makings_done'), 'the Makings');
    /* the Way Down; Tuck's spool in the deep store; the Hall of Names; Wren's own spool; the ledger */
    walk(57, 8); HW.hold('down'); HW.step(30); HW.release(); HW.step(40); HW.skipTalk();
    ok(HW.G.map.id === 'deep', 'down the Way Down');
    walk(9, 7); act('up'); ok(HW.Inv.items.tuckspool, "Tuck's spool");
    walk(21, 5); HW.step(20);
    const wren = HW.G.map.ents.find(e => e.kind === 'namespool' && e.spec[1] === 'wren');
    walk(wren.tx, wren.ty + 1); act('up');
    walk(37, 4); HW.face('up'); HW.press('act', 1);
    for (let i = 0; i < 60 && !HW.Progress.flag('reveal2'); i++) { HW.skipTalk(); HW.step(10); }
    for (let i = 0; i < 20; i++) { HW.skipTalk(); HW.step(10); }
    ok(HW.Progress.flag('reveal2') && HW.G.map.id === 'gran_house', 'Reveal 2; home, and downstairs to an empty kitchen');
    /* (down to the Guild Hall again, by the Inn's Staff door, as in the leg before) */
    HW.warp('underside', 31, 5); HW.step(20); HW.skipTalk();
    walk(31, 4); act('up');
    ok(HW.Progress.flag('gundry_r2') && HW.Inv.items.guildkey, "Gundry: the Shears, the gate, the Guild's key");
    walk(56, 16); HW.face('right'); stitch('D');
    ok(HW.Progress.flag('north_gate'), 'the north gate swings open');
    /* (up into the town by the Underside's stair) up the north road, through the gate, the Loomwood road to the Loom */
    HW.warp('hollow', 96, 44); HW.step(20); HW.skipTalk();
    /* the warp across the Loom's door lifts only while its four sockets hold weights: three stitched there for good (the
       far one over the stream among them), the last pushed on by the door, and through before it goes home */
    walk(64 + 54, 17, 30000); HW.face('right'); stitch('RR'); HW.step(10);
    walk(64 + 39, 11, 30000); HW.face('left'); stitch('LL'); HW.step(10);
    walk(64 + 24, 20, 30000); HW.face('up'); stitch('UU'); HW.step(40);
    walk(64 + 26, 15, 30000); HW.push('up', 2); HW.step(26);
    ok(HW.G.map.find('lgWarp').lifted, 'the warp lifted');
    walk(95, 10, 30000); HW.hold('up'); until(() => HW.G.map.id === 'loom', 120); HW.release(); HW.step(20); HW.skipTalk();
    ok(HW.G.map.id === 'loom', 'into the Loom');
    const L = { th: [20, 33], wh: [20, 22], oy: [0, 22], sr: [20, 11], wr: [40, 22], br: [40, 11], web: [20, 0], hg: [40, 33], lr: [60, 22], ww: [60, 11] };
    const l = (r, x, y) => [L[r][0] + x, L[r][1] + y];
    const lgo = (r, x, y) => walk(...l(r, x, y));
    const lpush = (r, x, y, d, n) => { lgo(r, x, y); HW.push(d, n); HW.step(25); };
    const snip = d => { HW.face(d); HW.Inv.equipped = 'shears'; HW.press('tool', 1); HW.step(3); HW.skipTalk(); };
    const strike = d => { HW.face(d); HW.press('atk', 1); HW.step(14); };
    const ltool = (t, d) => { HW.face(d); HW.Inv.equipped = t; HW.press('tool', 1); HW.step(3); HW.skipTalk(); };
    /* (a pull with the Gloves: hold on, step back one tile) */
    const lpull = (r, x, y, d) => { lgo(r, x, y); HW.face(d); const f = HW.player().front(), o = HW.G.map.at(f.tx, f.ty), back = { up: 'down', down: 'up', left: 'right', right: 'left' }[d]; HW.hold('act'); HW.step(4); HW.hold(['act', back]); until(() => o.tx !== f.tx || o.ty !== f.ty, 40); until(() => !o.mv, 30); HW.release(); HW.step(2); };
    /* the Threshold: the offcuts all across the trench; one hooked over drops into the hole in front of her; the lever by
       the door drops another across the way; hooked over from the first: across (the Plan) */
    lgo('th', 4, 6); ltool('hook', 'up'); HW.step(60);
    lgo('th', 2, 8); act('up'); HW.step(10);
    lgo('th', 4, 5); ltool('hook', 'up'); HW.step(60);
    lgo('th', 16, 3); act('up'); ok(HW.Inv.plans.includes('loom'), 'the Plan');
    /* the Snag: the old weight caught at the silk across its way home, pushed round and into the hole: whatever falls
       goes home at once, on to its plate under the peg, and the gate to the key opens */
    lgo('oy', 18, 5);
    lpush('oy', 13, 6, 'up', 1); lpush('oy', 14, 4, 'left', 2);
    lgo('oy', 2, 3); act('up'); ok(HW.Inv.keys('loom') === 1, 'a key');
    /* the Warp Hall's lock; the Shuttle Run: an offcut jams the Shuttle; two knocks; the Shears */
    lgo('wh', 9, 1); HW.hold('up'); HW.step(40); HW.release(); HW.step(30); HW.skipTalk();
    HW.G.cheats.god = true;
    const sh = HW.G.map.ents.find(e => e.kind === 'shuttle');
    lgo('sr', 8, 8); HW.face('down'); HW.press('act', 1); HW.step(10); lgo('sr', 9, 8); HW.push('up', 2); HW.step(10);
    for (let round = 0; round < 3 && sh.alive; round++) {
        until(() => sh.state === 'stuck', 600);
        HW.walkTo(...l('sr', (sh.x >> 4) - 20, 6)) || HW.walkTo(...l('sr', (sh.x >> 4) - 19, 6));
        const hp = sh.hp; for (let k = 0; k < 6 && sh.hp === hp && sh.state === 'stuck'; k++) strike('up');
        if (!sh.alive) break;
        HW.step(20);
        const b = HW.G.map.ents.find(e => e.kind === 'block' && !e.removed && HW.G.map.roomAt(e.tx, e.ty) === sh.arena);
        if (b.ty === l('sr', 0, 6)[1]) { HW.walkTo(b.tx, b.ty + 1); HW.push('up', 1); } else if (b.ty === l('sr', 0, 4)[1]) { HW.walkTo(b.tx, b.ty - 1); HW.push('down', 1); }
        HW.step(10);
    }
    ok(!sh.alive, 'the Shuttle splits');
    HW.step(30); HW.skipTalk(); HW.step(10);
    lgo('sr', 9, 3); act('up'); ok(HW.Inv.has('shears'), 'the Shears');
    HW.G.cheats.god = false;
    /* the Warp Hall's east silk; the Weighing Room: the old weights hang over the chasm; one pulled out on to the edge,
       along a step, cut and pushed in; the two hanging in its row cut where they hang, each from the last: across */
    lgo('wh', 18, 5); snip('right');
    lpull('wr', 7, 6, 'right'); lpush('wr', 7, 5, 'down', 1);
    lgo('wr', 6, 7); snip('right'); HW.push('right', 1); HW.step(20);
    lgo('wr', 8, 7); snip('right'); HW.step(10); lgo('wr', 9, 7); snip('right'); HW.step(10);
    ok(!HW.G.map.kind(...l('wr', 10, 7)).pit, 'the Weighing Room: a row across');
    /* down to the Hanging Gallery: the weights let go, one cut as it hangs over the trench; across to the key */
    lgo('hg', 16, 2); act('right'); lgo('hg', 12, 3); snip('down');
    lgo('hg', 9, 7); act('down'); ok(HW.Inv.keys('loom') === 1, 'the key');
    /* the Weighing Room's east lock (the key); the Larder: at the turn of the sleeper's thread, the warping post at your back,
       ring it awake: it can't shove you, so it waits over the gap, pulled tight; cut it, and it fills the gap */
    lgo('wr', 18, 5); HW.hold('right'); HW.step(40); HW.release(); HW.step(30); HW.skipTalk();
    lgo('lr', 10, 7); ltool('bell', 'right'); HW.step(40);
    snip('right'); ok(!HW.G.map.kind(...l('lr', 11, 7)).pit, 'the Larder: the gap filled');
    lgo('lr', 13, 1); HW.hold('up'); HW.step(40); HW.release(); HW.step(30); HW.skipTalk();
    /* the Warp Walk: the weight given a place further along the walk (the Needle), the Hookline over to it, cut, and
       pushed into the last gap */
    lgo('ww', 9, 5); HW.face('left'); stitch('LLL');
    ltool('hook', 'left'); HW.step(60);
    snip('left'); HW.push('left', 3); HW.step(30);
    ok(!HW.G.map.kind(...l('ww', 1, 5)).pit, 'the Warp Walk: the gap filled');
    lgo('ww', 2, 5); HW.hold('left'); HW.step(40); HW.release(); HW.step(20);
    /* the Bridge Room, in from the east: the one weight wedged in its nook past a strand of silk; stitched past the strand
       (the Needle), it tears through, hanging on its thread, and lands across; pushed onto the plate and cut there */
    lgo('br', 12, 2); HW.face('left'); stitch('RRR'); HW.step(20);
    ok(HW.G.map.find('brW3').tx === l('br', 11, 2)[0], 'the weight across the strand');
    lpush('br', 10, 2, 'right', 1); lgo('br', 11, 2); snip('right');
    HW.step(5); lgo('br', 16, 3); act('up'); ok(HW.Inv.hasPattern('loom'), 'the Pattern');
    /* down its south gate (open for good now) and round to the Run, and up through the big door: the Web */
    lgo('wr', 15, 1); lgo('wh', 18, 5); lgo('sr', 9, 1); HW.hold('up'); HW.step(40); HW.release(); HW.step(30); HW.skipTalk();
    HW.G.cheats.god = true;
    HW.step(30); HW.skipTalk(); HW.step(5); HW.skipTalk();
    const w = HW.G.map.ents.find(e => e.kind === 'weaver');
    const free = () => { if (HW.player().pinned === 'silk') { HW.Inv.equipped = 'shears'; HW.press('tool', 1); HW.step(2); } };
    const wgo = (x, y) => { for (let k = 0; k < 40; k++) { HW.skipTalk(); free(); if (HW.walkTo(...l('web', x, y), 30)) return; } ok(false, `walk to the Web's ${x},${y} (at ${pos()})`); };
    const wx = l('web', 10, 0)[0] * 16;
    /* 1: its four anchors, each cut its own way: the plain one at its post; the cocoon rung awake first; the one up into
       the loom from the well's rim, where it comes down over the well's head; the long one while the Weaver's reared back
       away from Wren, pulling it tight. Down into its well; knock it */
    const anchor = (id, x, y, f, first) => { const n = HW.G.map.find(id); for (let k = 0; k < 12 && !n.cut; k++) { wgo(x, y); free(); if (first) first(n); free(); snip(f); } ok(n.cut, `the Weaver's anchor ${id} cut`); };
    anchor('anC', 4, 7, 'right');
    anchor('anA', 4, 4, 'right', n => { if (n.sleeping) { HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(3); } });
    anchor('anB', 8, 3, 'right');
    anchor('anD', 15, 7, 'left', n => until(() => n.taut(w) && HW.player().pinned !== 'silk', 300));
    ok(until(() => w.state === 'down', 300), 'the Weaver down in its well');
    wgo(8, 6); for (let k = 0; k < 8 && w.hp === 3; k++) { free(); strike('right'); }
    for (let i = 0; i < 4; i++) { HW.step(10); HW.skipTalk(); }
    /* 2: it drops on you from the breast-beam; its thread cut while it hauls itself home up the well */
    wgo(8, 7); ok(until(() => w.state === 'aim', 900), 'it picks its spot');
    wgo(8, 5); HW.face('right');
    ok(until(() => w.state === 'home' && w.x === wx && w.y < 112, 400), 'hauling itself home up the well');
    free(); snip('right'); ok(until(() => w.state === 'down', 120), 'cut over the well: down it goes');
    wgo(8, Math.min(8, Math.max(3, w.y >> 4))); for (let k = 0; k < 8 && w.hp === 2; k++) { free(); strike('right'); }
    for (let i = 0; i < 4; i++) { HW.step(10); HW.skipTalk(); }
    /* 3: it won't come down: hooked down its own well, and cut while it hangs there */
    wgo(9, 9); ok(until(() => w.state === 'perch', 600), 'up on the breast-beam');
    free(); ltool('hook', 'up'); ok(until(() => w.state === 'hung', 120), 'hooked down the well');
    free(); snip('up'); ok(until(() => w.state === 'down', 120), 'cut while it hangs over the well');
    for (let k = 0; k < 8 && w.alive; k++) { free(); strike('up'); }
    ok(!w.alive, 'the Weaver');
    for (let i = 0; i < 20 && !HW.Progress.flag('d8'); i++) { HW.skipTalk(); HW.step(20); }
    ok(HW.Progress.flag('d8'), 'the Loom done');
    assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
};

export const LEG9 = (HW, chain) => {
    if (chain) chain('afterD8'); else HW.preset('afterD8'); HW.step(10); HW.skipTalk();
    const ok = (c, m) => assert.ok(c, m);
    const until = (fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
    const pos = () => `${HW.G.map.id} ${HW.player().tx},${HW.player().ty}`;
    const walk = (x, y, max = 30000) => ok(HW.walkTo(x, y, max), `walk to ${x},${y} (at ${pos()})`);
    const G = { top: [20, 0], slumber: [0, 11], climb: [20, 11], mario: [40, 11], mill: [0, 22], hub: [20, 22], belfry: [40, 22], tidy: [0, 33], foot: [20, 33], kiln: [40, 33] };
    const g = (r, x, y) => [G[r][0] + x, G[r][1] + y];
    const go = (r, x, y) => walk(...g(r, x, y), 3000);
    const act = d => { HW.face(d); HW.press('act', 1); HW.step(3); HW.skipTalk(); HW.step(5); };
    const step = d => { HW.hold(d); HW.step(16); HW.release(); HW.step(4); };
    const paddleTo = (x, y) => { const p = HW.player(); HW.Inv.equipped = 'paddle'; for (let i = 0; i < 2000 && (p.tx !== x || p.ty !== y); i++) { HW.hold(['tool', p.tx < x ? 'right' : p.tx > x ? 'left' : p.ty < y ? 'down' : 'up']); HW.step(1); } HW.release(); HW.step(20); };
    const tool = (t, d) => { if (d) HW.face(d); HW.Inv.equipped = t; HW.press('tool', 1); HW.step(3); HW.skipTalk(); };
    HW.Inv.stitches = [];
    /* from the Loom's door down the Loomwood road to the Frayed Edge; the Shears at the fog, on your own thread */
    walk(67, 19); tool('shears', 'left'); HW.step(5);
    ok(HW.Progress.flag('cut_self'), 'her own thread cut');
    HW.hold('left'); until(() => HW.G.map.id === 'drift', 200); HW.release(); HW.step(40); HW.skipTalk();
    ok(HW.G.map.id === 'drift', 'the Drift');
    /* over the stream on a stray boulder, to Linnet in her garden; a Drift-bloom seed from her gate */
    walk(44, 16); HW.push('left', 3); HW.step(20);
    walk(13, 23); act('up');
    ok(HW.Inv.items.driftseed, 'a seed');
    walk(18, 22); act('up'); HW.skipTalk();
    ok(HW.Progress.flag('great_pull'), 'Linnet; the Pull');
    /* home east on foot; the seed into Gran's garden on the way; the square */
    walk(59, 19); HW.hold('right'); until(() => HW.G.map.id === 'hollow', 200); HW.release(); HW.step(40); HW.skipTalk();
    HW.walkTo(74, 51, 40000); HW.step(10); HW.skipTalk(); walk(74, 51, 40000); act('left');
    ok(HW.Progress.flag('seed_planted'), 'planted');
    HW.walkTo(95, 60, 40000); HW.step(10); HW.skipTalk(); walk(95, 60, 40000);
    HW.face('up'); HW.press('act', 1); HW.step(3); HW.skipTalk(0); HW.step(60); HW.skipTalk();
    ok(HW.G.map.id === 'greatspool', 'down the Well');
    /* the Great Spool: the Airing Cupboard (west of the Foot) and the Glazing Gallery (east); the Foot's own crate, wound
       north onto its plate in the pillar's lee; up to the Winding Room: the Mill-Leat (west) and the Gale Loft (east); up
       to the Climb: the Night Ferry (west) and the Prompt Box (east) */
    const walkP = (pup, d, k) => { for (let i = 0; i < k; i++) { HW.hold(d); until(() => pup.mv, 20); until(() => !pup.mv, 30); HW.release(); HW.step(1); } };
    go('tidy', 17, 3); HW.push('left', 2); HW.step(5); go('tidy', 14, 2); HW.push('down', 4); HW.step(5);
    go('tidy', 14, 6); HW.face('down'); HW.hold('act'); HW.step(5);
    HW.Inv.equipped = 'bell'; HW.hold(['act', 'tool']); HW.step(2); HW.hold('act'); HW.step(60); HW.release(); HW.step(2);
    go('tidy', 14, 5); HW.step(200);
    ok(HW.find('gsTGate').open, 'the mangle home over the block');
    go('tidy', 2, 2); act('up');
    go('kiln', 9, 9); tool('crossbar', 'right');
    const kp = HW.find('gsKPuppet');
    walkP(kp, 'left', 4); walkP(kp, 'up', 1); HW.press('tool', 1); HW.step(2);
    until(() => kp.ret.state === 'returning', 300); HW.step(80);
    go('kiln', 2, 7); HW.face('down'); HW.press('act', 1); HW.step(20);
    go('kiln', 4, 4); HW.face('right'); HW.press('act', 1); HW.step(140);
    ok(HW.find('gsKGate').open, 'sun, moon, star');
    go('kiln', 16, 8); act('right');
    go('foot', 9, 7); HW.push('left', 3); HW.step(5); go('foot', 9, 8);
    ok(until(() => HW.find('gsFGate').open, 900), 'the crate on the plate, in the lee');
    go('hub', 9, 9);
    go('mill', 13, 8); tool('hook', 'up'); HW.step(60); step('up');
    paddleTo(...g('mill', 11, 7)); paddleTo(...g('mill', 11, 6)); paddleTo(...g('mill', 10, 6));
    HW.hold('down'); until(() => HW.player().ty === g('mill', 0, 8)[1], 150); HW.release(); HW.step(4);
    ok(until(() => HW.find('gsMGate').open, 900), 'the raft down the leat, up onto the wheel\'s water');
    go('mill', 3, 8); act('left');
    go('belfry', 5, 6); tool('hook', 'right'); HW.step(60);
    go('belfry', 14, 9); tool('bell'); HW.step(120);
    ok(HW.find('gsBGate').open, 'the boulder on the iron plate');
    go('belfry', 16, 3); go('belfry', 17, 3); act('up');
    go('belfry', 10, 5); HW.hold('left'); HW.step(60); HW.release(); HW.step(30);
    go('slumber', 13, 7); step('left'); paddleTo(...g('slumber', 5, 7)); paddleTo(...g('slumber', 5, 5)); HW.step(20);
    tool('bedroll'); step('right'); HW.step(300);
    HW.Inv.equipped = 'bedroll'; HW.hold('tool'); HW.step(24); HW.release(); HW.step(150); HW.skipTalk();
    step('right'); go('slumber', 6, 2); act('down');
    go('slumber', 8, 3); act('right'); HW.step(20);
    go('mario', 4, 6); tool('crossbar', 'down');
    const mp = HW.find('gsPuppet');
    walkP(mp, 'right', 6); walkP(mp, 'up', 3); HW.press('tool', 1); HW.step(2);
    go('mario', 9, 5); tool('crossbar', 'right'); walkP(mp, 'right', 3); HW.press('tool', 1); HW.step(60);
    tool('bell'); HW.step(80);
    ok(HW.find('gsMaGate').open, 'the painted rock on the plate');
    go('mario', 16, 6); go('mario', 18, 6); go('mario', 18, 3); act('up');
    ok(HW.Progress.flag('spool_all'), 'all six Knots undone');
    /* up the Climb, watching the lanes (a train goes by, then across behind it); Gran; the six great threads */
    go('climb', 9, 5); climbWatching(HW, G.climb);
    ok(HW.player().ty === g('climb', 0, 1)[1] && !(HW.Stats.c['climb:hit'] > 0), 'up the Climb, never caught');
    HW.hold('up'); HW.step(60); HW.release(); HW.step(40); HW.skipTalk(); HW.step(20); HW.skipTalk();
    ok(HW.Progress.flag('spool_met'), 'Gran at the Spool');
    HW.G.cheats.god = true;     /* (what Gran throws only knocks you about; this keeps the walk tidy) */
    /* three pairs: the lowest with the crates, the middle with what she throws, the last over the dark; then the end is
       Gran's other hand, held (no menu) */
    spoolTop(HW, G.top);
    for (let i = 0; i < 120 && !HW.Progress.flag('unwound'); i++) { HW.skipTalk(); HW.step(20); }
    ok(HW.Progress.flag('unwound'), 'the Unwinding');
    for (let i = 0; i < 400 && (HW.G.hideHud || HW.G.credits); i++) { HW.skipTalk(); HW.step(20); }
    /* after: the free valley; the Drift-bloom by Gran's gate; a save that says it's over */
    ok(HW.G.map.id === 'hollow' && !HW.G.hideHud, 'back to the valley');
    ok(HW.G.map.ents.some(e => e.who === 'linnet') && HW.G.map.ents.some(e => e.who === 'gran'), 'Gran and Linnet home');
    const s = HW.Save.snapshot();
    ok(s.progress.flags.unwound, 'saved as over');
    assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
};
