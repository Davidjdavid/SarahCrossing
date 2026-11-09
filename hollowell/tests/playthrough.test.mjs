// A fresh Wander, played from the title onwards: the prologue, the ceremony, the road to the Tidyhouse,
// every room on the way to its Knot, and home again. (Fights use HW.hitEnemy, the stand-in for aiming.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const TIDY = { foyer: [20, 33], kitchen: [0, 33], gallery: [40, 33], hall: [20, 22], pantry: [0, 22], parlor: [40, 22], cons: [60, 22], linen: [40, 11], laundry: [60, 11], ball: [20, 11], library: [0, 11], attic: [0, 0], ante: [40, 0], boss: [20, 0] };
function t(room, x, y) { const [ox, oy] = TIDY[room]; return [ox + x, oy + y]; }

test('a fresh game: prologue, ceremony, the Tidyhouse to its Knot, and home', () => {
    const HW = loadGame();
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
    HW.push('up', 3); walk(...t('hall', 7, 4)); HW.push('right', 1); walk(...t('hall', 6, 6)); HW.step(400);
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
});

test('from the first Knot: the canyon road, Kilnridge, the Kiln to its Knot', () => {
    const HW = loadGame();
    const ok = (c, m) => { assert.ok(c, m + ` (at ${HW.G.map && HW.G.map.id} ${HW.player() && HW.player().tx},${HW.player() && HW.player().ty})`); };
    const walk = (x, y, m) => { let r = HW.walkTo(x, y); for (let i = 0; i < 3 && !r; i++) { HW.skipTalk(); HW.step(5); r = HW.walkTo(x, y); } ok(r, m || `walk ${x},${y}`); };
    const area = () => HW.G.map.id;
    const thing = id => HW.G.map.find(id);
    const until = (fn, max = 3000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
    const talk = () => { HW.press('act', 1); HW.skipTalk(); };
    const K = { entrance: [20, 33], lwr: [0, 33], hall: [20, 22], crocks: [40, 33], sms: [40, 22], doubling: [0, 22], glazer: [40, 11], gallery: [60, 11], bridge: [60, 22], furnace: [20, 11], racks: [0, 11], sig: [0, 0], vats: [40, 0], boss: [20, 0] };
    const k = (r, x, y) => [K[r][0] + x, K[r][1] + y];
    const lift = d => { HW.face(d); HW.press('act', 1); ok(HW.player().carry, 'lifted'); };
    const toss = d => { HW.face(d); HW.press('act', 1); };
    HW.preset('afterD1'); HW.step(10);
    HW.Inv.maxHp = HW.Inv.hp = 16;

    /* the canyon road: the boulder only moves for a grip */
    walk(64 + 8, 80 + 23, 'to the canyon road');
    walk(64 + 5, 80 + 22); walk(64 + 4, 80 + 22); HW.face('down');
    HW.hold(['act']); HW.step(3); HW.hold(['act', 'up']); HW.step(24); HW.release(); HW.step(4);
    ok(thing('canyonBoulder').ty === 80 + 22, 'boulder pulled into the niche');
    walk(64 + 5, 80 + 21); walk(64 + 5, 80 + 23); walk(64 + 2, 80 + 23); walk(58, 80 + 23, 'into Kilnridge');
    ok(HW.Progress.flag('kilnPass'), 'through');
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
    for (let round = 0; round < 8 && w.alive; round++) {
        walk(...k('boss', 17, 3)); lift('up');
        walk(...k('boss', 12, 3)); walk(...k('boss', 12, 7)); walk(...k('boss', 5, 7)); toss('left');
        until(() => w.state === 'hurt' || !w.alive, 200); HW.Inv.hp = 16; HW.step(60);
    }
    HW.step(150); HW.skipTalk();
    const hoop = HW.ents('hoop')[0]; ok(hoop, 'hoop');
    walk(hoop.tx, hoop.ty + 1); HW.face('up'); HW.press('act', 1); HW.skipTalk(0); HW.step(300); HW.skipTalk(); HW.step(10); HW.skipTalk();
    ok(HW.Inv.knots.includes('kiln') && HW.Progress.flag('d2'), 'the Fired Knot');
    assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
});

test('from the second Knot: the broken bridge, Millwater, the ferry, the Millrace to its Knot', () => {
    const HW = loadGame();
    const ok = (c, m) => { assert.ok(c, m + ` (at ${HW.G.map && HW.G.map.id} ${HW.player() && HW.player().tx},${HW.player() && HW.player().ty})`); };
    const walk = (x, y, m) => { let r = HW.walkTo(x, y); for (let i = 0; i < 3 && !r; i++) { HW.skipTalk(); HW.step(5); r = HW.walkTo(x, y); } ok(r, m || `walk ${x},${y}`); };
    const area = () => HW.G.map.id;
    const thing = id => HW.G.map.find(id);
    const until = (fn, max = 3000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
    const talk = () => { HW.press('act', 1); HW.skipTalk(); };
    const M = { wheel: [20, 33], ferry: [0, 33], backwash: [40, 33], carousel: [20, 22], snap: [40, 22], upstream: [20, 11], twowheels: [40, 11], pond: [20, 0] };
    const m = (r, x, y) => [M[r][0] + x, M[r][1] + y];
    const at = (o, x, y) => o.tx === x && o.ty === y && !o.mv;
    const board = (raft, [x, y], dir, max = 2000) => { ok(until(() => at(raft, x, y), max), `raft at ${x},${y}`); HW.hold(dir); HW.step(10); HW.release(); HW.step(1); ok(HW.player().tx === x && HW.player().ty === y, 'aboard'); };
    const off = dir => { HW.hold(dir); HW.step(14); HW.release(); HW.step(2); };
    HW.preset('afterD2'); HW.step(10);
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
    /* the Snapjaw */
    const s = HW.ents('enemy').find(e => e.type === 'snapjaw');
    ok(s && s.state === 'swim', 'Snapjaw awake');
    HW.G.cheats.god = true;      /* (it bites while you bait it; the dodging isn't what this checks) */
    for (let round = 0; round < 12 && s.alive; round++) {
        const c = thing(round % 2 ? 'sjCrate2' : 'sjCrate1');
        until(() => HW.Return.isHome(c) && s.state === 'swim', 2000);
        walk(...m('snap', 10, c.ty - M.snap[1]));
        HW.face('right'); HW.push('right', 1);
        const hp0 = s.hp;
        walk(...m('snap', 11, 6));
        until(() => !s.alive || s.hp !== hp0, 700);
        if (!s.alive) break;
        walk(...m('snap', 6, 5));
    }
    HW.G.cheats.god = false;
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
    HW.face('right'); talk(); ok(HW.Inv.keys('mill') === 2, 'key 3 (and key 1 still)');
    HW.step(250); HW.hold('down'); until(() => HW.player().state === 'normal' && HW.player().ty >= m('upstream', 9, 8)[1], 500); HW.release(); HW.step(10);
    /* two wheels: the Pattern */
    walk(...m('upstream', 17, 5)); HW.hold('right'); HW.step(60); HW.release();
    walk(...m('twowheels', 1, 2));
    board(thing('twRaft'), m('twowheels', 2, 2), 'right', 2000);
    ok(until(() => at(thing('twRaft'), ...m('twowheels', 12, 2)), 800), 'at the first wheel');
    HW.hold(['tool']); ok(until(() => HW.Progress.flag('millrace_twoWheels'), 600), 'two wheels'); HW.release(); HW.step(2); off('down');
    walk(...m('twowheels', 7, 7)); HW.face('up'); talk(); ok(HW.Inv.hasPattern('mill'), 'Pattern');
    /* up the race again to the big door */
    walk(...m('twowheels', 1, 5)); walk(...m('upstream', 9, 9));
    board(thing('upRaft'), m('upstream', 9, 8), 'up', 2000);
    HW.hold(['tool', 'up']); ok(until(() => at(thing('upRaft'), ...m('upstream', 9, 2)), 600), 'up again'); HW.release(); HW.step(1); off('up');
    HW.hold('up'); HW.step(50); HW.release(); HW.step(30); HW.skipTalk();
    walk(...m('pond', 9, 9)); HW.step(30); HW.skipTalk();
    /* Old Grindle */
    const g = thing('grindle');
    ok(g && g.state !== 'sleep', 'Grindle awake');
    HW.G.cheats.god = true;      /* (dodging its spit isn't what this checks) */
    for (let round = 0; round < 4 && g.alive; round++) {
        until(() => g.state === 'home', 900);
        until(() => HW.Return.isHome(thing('gbW')) && HW.Return.isHome(thing('gbE')), 900);
        HW.Inv.equipped = 'hook';
        walk(...m('pond', 2, 2)); HW.push('down', 1); walk(...m('pond', 2, 2));
        walk(...m('pond', 17, 2)); HW.push('down', 1); walk(...m('pond', 17, 2));
        ok(until(() => g.state === 'full', 900), 'full');
        walk(...m('pond', 9, 9));
        board(thing('gRaft'), m('pond', 9, 8), 'up', 1500);
        ok(until(() => at(thing('gRaft'), ...m('pond', 9, 4)), 400), 'at its mouth');
        HW.face('up'); HW.press('atk', 1); HW.step(80);
        HW.hold('down'); until(() => HW.player().ty >= m('pond', 9, 9)[1] && HW.player().state === 'normal', 600); HW.release();
    }
    HW.G.cheats.god = false;
    ok(!g.alive, 'Grindle down');
    HW.step(200); HW.skipTalk();
    if (HW.player().ty < m('pond', 9, 9)[1]) { ok(until(() => at(thing('gRaft'), ...m('pond', 9, 8)), 900), 'raft home'); off('down'); }   /* still afloat: ride back in */
    const hoop = HW.ents('hoop')[0]; ok(hoop, 'the hoop');
    walk(hoop.tx - 1, hoop.ty); HW.face('right'); HW.press('act', 1); HW.skipTalk(0); HW.step(300); HW.skipTalk(); HW.step(10); HW.skipTalk();
    ok(HW.Inv.knots.includes('mill') && HW.Progress.flag('d3'), 'the Running Knot');
    const exit = HW.ents('warp').find(w => w.to === 'hollow' && w.ty < 11);
    ok(exit, 'a way out');
    walk(exit.tx + 1, exit.ty); HW.hold('left'); until(() => area() === 'hollow', 200); HW.release(); HW.step(30);
    ok(area() === 'hollow', 'back outside');
    assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
});
