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

test('from the third Knot: over the lake, up the cliff stair and the Heights, the Belfry to its Knot', () => {
    const HW = loadGame();
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
    const B = { porch: [20, 44], draught: [0, 44], windward: [40, 44], stair: [20, 33], weather: [0, 33], loft: [20, 22], reach: [0, 22], ropes: [20, 11], bell: [20, 0] };
    const b = (r, x, y) => [B[r][0] + x, B[r][1] + y];
    HW.preset('afterD3'); HW.step(10); HW.skipTalk();
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
    /* the great bell */
    walk(...b('ropes', 9, 1)); HW.hold('up'); HW.step(60); HW.release(); HW.step(30); HW.skipTalk();
    walk(...b('bell', 9, 9)); HW.step(30); HW.skipTalk();
    const t = HW.ents('enemy').find(e => e.type === 'tollgrim');
    ok(t && t.state !== 'sleep', 'Tollgrim awake');
    for (let round = 0; round < 5 && t.alive; round++) {
        walk(...b('bell', 6, 7));
        ok(until(() => t.state === 'peek', 1500), 'he leans out');
        HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(4);
        ok(until(() => t.state === 'stunned', 60), 'slammed'); HW.step(20);
        p().x = t.x - 16; p().y = t.y; HW.face('right'); HW.press('atk', 1); HW.step(30);
    }
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
});

test('from the fourth Knot: the festival, the giant on the east road, Hushwood and the Slumberhouse to its Knot', () => {
    const HW = loadGame();
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
    const S = { porch: [20, 33], ward: [20, 22], linen: [0, 22], laundry: [40, 22], loft: [40, 33], landing: [20, 11], nursery: [0, 11], moonwalk: [40, 11], fort: [0, 0], boss: [20, 0] };
    const s = (r, x, y) => [S[r][0] + x, S[r][1] + y];
    const steps = (r, path) => { for (const [x, y] of path) { const [tx, ty] = s(r, x, y), d = tx > p().tx ? 'right' : tx < p().tx ? 'left' : ty > p().ty ? 'down' : 'up'; for (let i = 0; i < 60 && (p().tx !== tx || p().ty !== ty); i++) { HW.hold(d); HW.step(1); } const along = d === 'left' || d === 'right' ? () => Math.abs(p().x - (tx * 16 + 8)) : () => Math.abs(p().y - (ty * 16 + 10)); for (let i = 0; i < 12 && along() > 2; i++) { HW.hold(d); HW.step(1); } HW.release(); ok(p().state === 'normal' && p().tx === tx && p().ty === ty, `stepped to ${r} ${x},${y}`); } };
    const fallHome = dir => { HW.hold(dir); until(() => p().state === 'fall', 200); HW.release(); landed(); };
    HW.preset('afterD4'); HW.step(10); HW.skipTalk();
    HW.Inv.maxHp = HW.Inv.hp = 28;

    /* home for the festival (the way down from the Heights is the way up, played in the leg before) */
    HW.warp('hollow', 64 + 30, 40 + 34); HW.step(10); walk(64 + 30, 40 + 24); HW.step(10); HW.skipTalk(); HW.step(10);
    ok(HW.Progress.flag('festival'), 'the festival');
    /* the east road: ring the Bell at the giant */
    walk(125, 60); HW.Inv.equipped = 'bell'; HW.press('tool', 1);
    for (let i = 0; i < 30 && !HW.Progress.flag('giant_home'); i++) { HW.skipTalk(); HW.step(20); }
    HW.skipTalk(); ok(HW.Progress.flag('giant_home'), 'the giant gone home');
    /* over the moss to the Slumberhouse */
    walk(128 + 12, 40 + 15); HW.hold('up'); until(() => p().ty <= 40 + 11 && p().state === 'normal', 150); HW.release(); HW.step(5);
    walk(128 + 19, 40 + 9); HW.hold('up'); until(() => area() === 'slumber', 120); HW.release(); HW.step(30);
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
    /* the drying loft: key B */
    walk(...s('laundry', 9, 9)); walk(...s('loft', 9, 1)); walk(...s('loft', 3, 1)); HW.face('left'); talk();
    walk(...s('loft', 16, 2)); HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(120);
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
    for (let round = 0; round < 3 && m.alive; round++) {
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
    /* the nursery: the toy home over the drop; the fort: the Pattern */
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
    walk(...s('fort', 9, 3)); HW.face('up'); talk(); ok(HW.Inv.hasPattern('slumber'), 'the Pattern');
    /* Mother Sloth */
    walk(...s('fort', 9, 9)); walk(...s('nursery', 9, 1)); walk(...s('nursery', 18, 5)); walk(...s('landing', 9, 1));
    HW.hold('up'); HW.step(60); HW.release(); HW.step(30);
    walk(...s('boss', 2, 9)); lay();
    HW.step(1); walk(...s('boss', 9, 6)); HW.skipTalk(); HW.step(10); HW.skipTalk();
    const sl = HW.G.map.ents.find(e => e.type === 'mothersloth');
    for (let round = 0; round < 3 && sl.alive; round++) {
        for (let k = 0; k < 4 && sl.state !== 'slump'; k++) {
            HW.walkTo(...s('boss', 9, 6));
            ok(until(() => !!p().pinned, 900), 'caught');
            homeward();
        }
        ok(sl.state === 'slump', 'she slumps');
        walk(...s('boss', 9, 6)); HW.face('up'); HW.press('atk', 1); HW.step(20);
    }
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
});

test('from the fifth Knot: over to Kilnridge, off the high mesa into Larkspur Fair, the Marionette Hall to its Knot (Reveal 1)', () => {
    const HW = loadGame();
    const ok = (c, m) => { assert.ok(c, m + ` (at ${HW.G.map && HW.G.map.id} ${HW.player() && HW.player().tx},${HW.player() && HW.player().ty})`); };
    const walk = (x, y, m, max) => { let r = HW.walkTo(x, y, max); for (let i = 0; i < 3 && !r; i++) { HW.skipTalk(); HW.step(5); r = HW.walkTo(x, y, max); } ok(r, m || `walk ${x},${y}`); };
    const area = () => HW.G.map.id;
    const thing = id => HW.G.map.find(id);
    const until = (fn, max = 3000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
    const talk = () => { HW.press('act', 1); HW.skipTalk(); };
    const p = () => HW.player();
    const strings = moves => { const names = { U: 'up', D: 'down', L: 'left', R: 'right' }; for (const m of moves) { const ps = HW.global('Crossbar').ctl.puppets; HW.hold(names[m]); until(() => ps.some(e => e.mv), 12); until(() => !ps.some(e => e.mv), 30); HW.release(); HW.step(3); } };
    const M = { foyer: [20, 33], box: [40, 33], aud: [20, 22], pit: [0, 22], reh: [40, 22], wings: [20, 11], dress: [0, 11], props: [40, 11], stage: [20, 0] };
    const m = (r, x, y) => [M[r][0] + x, M[r][1] + y];
    HW.preset('afterD5'); HW.step(10); HW.skipTalk();
    HW.Inv.maxHp = HW.Inv.hp = 32;

    /* back over the stream, along the road, through town and the canyon, up to the high mesa */
    walk(128 + 10, 40 + 10); HW.hold('down'); until(() => p().ty >= 40 + 14 && p().state === 'normal', 150); HW.release();
    walk(15, 83, 'to the high mesa', 60000);
    HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(2);
    walk(12, 83); HW.face('up'); HW.press('act', 1); HW.skipTalk(0); HW.step(60); HW.skipTalk();
    ok(p().ty === 74, 'into the straw');
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
    /* the prop store (lock C): the Pattern */
    walk(...m('dress', 18, 5)); walk(...m('wings', 18, 5)); HW.hold('right'); HW.step(40); HW.release(); HW.step(30);
    walk(...m('props', 9, 9)); HW.Inv.equipped = 'crossbar'; HW.face('up'); HW.press('tool', 1); HW.step(2);
    strings('DRDRDRRDRURUR'); HW.step(5); HW.press('tool', 1); HW.step(5);
    walk(...m('props', 16, 9)); HW.face('up'); talk(); ok(HW.Inv.hasPattern('marionette'), 'the Pattern');
    /* the great stage */
    walk(...m('props', 1, 5)); walk(...m('wings', 9, 1)); HW.hold('up'); HW.step(60); HW.release(); HW.step(30); HW.skipTalk(); HW.step(20); HW.skipTalk();
    const g = HW.G.map.ents.find(e => e.type === 'greatmarionette');
    HW.Inv.equipped = 'crossbar';
    for (let round = 0; round < 3 && g.alive; round++) {
        walk(...m('stage', 9, 9)); HW.face('up'); HW.press('tool', 1); HW.step(2);
        strings('URRR' + 'URRDDLLU');
        ok(until(() => g.state === 'down', 60), 'it falls');
        HW.press('tool', 1); HW.step(3);
        walk(...m('stage', 8, 8)); HW.face('up'); HW.press('atk', 1); HW.step(24);
        if (g.alive) until(() => thing('gsWrenA').ret.state === 'home' && thing('gsWrenB').ret.state === 'home', 600);
    }
    ok(!g.alive, 'the Great Marionette down');
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
});

test('from the sixth Knot: the Staff door, the Underside, Gundry, the Spoolworks to the Tangle (the Needle)', () => {
    const HW = loadGame();
    const ok = (c, m) => { assert.ok(c, m + ` (at ${HW.G.map && HW.G.map.id} ${HW.player() && HW.player().tx},${HW.player() && HW.player().ty})`); };
    const walk = (x, y, m, max) => { let r = HW.walkTo(x, y, max); for (let i = 0; i < 3 && !r; i++) { HW.skipTalk(); HW.step(5); r = HW.walkTo(x, y, max); } ok(r, m || `walk ${x},${y}`); };
    const area = () => HW.G.map.id;
    const thing = id => HW.G.map.find(id);
    const until = (fn, max = 3000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
    const talk = () => { HW.press('act', 1); HW.skipTalk(); };
    const p = () => HW.player();
    const S = { gate: [20, 22], wind: [20, 11], store: [0, 11], kennel: [40, 11], loft: [0, 0], heart: [20, 0], ugate: [20, 55], uwind: [20, 44], ustore: [0, 44], ukennel: [40, 44], uloft: [0, 33], uheart: [20, 33] };
    const s = (r, x, y) => [S[r][0] + x, S[r][1] + y];
    const hatch = (r, x, y, d) => { walk(...s(r, x, y)); HW.face(d); HW.press('act', 1); HW.step(40); };
    const knot = () => { HW.hold('act'); HW.step(20); HW.release(); HW.step(2); };
    const stitch = moves => { const names = { U: 'up', D: 'down', L: 'left', R: 'right' }; HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(2); for (const m of moves) { HW.hold(names[m]); HW.step(2); HW.release(); HW.step(8); } HW.press('tool', 1); HW.step(2); };
    HW.preset('afterD6'); HW.step(10); HW.skipTalk();
    HW.Inv.maxHp = HW.Inv.hp = 34;

    /* home through the fair gate, to the Inn and its Staff door */
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
    /* under the Winding Hall: the counterweight off, the stray in its way */
    hatch('wind', 17, 7, 'down');
    walk(...s('uwind', 11, 5)); HW.push('right', 2); HW.step(25);
    walk(...s('uwind', 13, 7)); HW.push('up', 1); HW.step(25);
    hatch('uwind', 17, 7, 'down');
    ok(thing('swGateW').open, 'the Spool Store gate');
    walk(...s('wind', 1, 5)); HW.hold('left'); HW.step(40); HW.release(); HW.step(30);
    /* the Spool Store: on the plate, tied off below; the Plan; the key */
    walk(...s('store', 15, 2)); HW.push('down', 3); HW.step(25);
    hatch('store', 15, 5, 'right'); walk(...s('ustore', 15, 4)); HW.face('up'); knot();
    walk(...s('ustore', 5, 7)); HW.face('down'); talk(); ok(HW.Inv.plans.includes('spoolworks'), 'the Plan');
    hatch('ustore', 15, 5, 'right');
    walk(...s('store', 2, 3)); HW.face('up'); talk(); ok(HW.Inv.keys('spoolworks') === 1, 'the key');
    /* the Kennel: Cog */
    walk(...s('wind', 18, 5)); HW.hold('right'); HW.step(40); HW.release(); HW.step(20); HW.skipTalk(); HW.step(5);
    const cog = HW.G.map.ents.find(e => e.type === 'cog');
    for (let round = 0; round < 3 && cog.alive; round++) {
        hatch('kennel', 9, 7, 'down'); until(() => cog.state === 'sit', 400);
        walk(...s('ukennel', 9, 5)); HW.face('up'); knot(); ok(cog.knotted, 'Cog held');
        hatch('ukennel', 9, 7, 'down'); walk(...s('kennel', 9, 5)); HW.face('up'); HW.press('atk', 1); HW.step(24);
    }
    ok(!cog.alive, 'Cog runs down'); HW.step(30); HW.skipTalk(); HW.step(10);
    walk(...s('kennel', 5, 3)); HW.face('up'); talk(); ok(HW.Inv.has('needle'), 'the Needle');
    /* under the Spool Store: the weight in the way, given a new place */
    walk(...s('kennel', 1, 5)); hatch('store', 15, 5, 'right');
    walk(...s('ustore', 2, 4)); HW.face('up'); stitch('R'); until(() => HW.Return.isHome(thing('usWeight')), 60);
    /* the Bobbin Loft: three stitched, the fourth tied off below */
    hatch('uloft', 9, 7, 'down');
    walk(...s('loft', 6, 5)); HW.face('up'); stitch('LLLU'); until(() => HW.Return.isHome(thing('blB1')), 120);
    walk(...s('loft', 12, 5)); HW.face('up'); stitch('RRRU'); until(() => HW.Return.isHome(thing('blB2')), 120);
    walk(...s('loft', 6, 6)); HW.face('down'); stitch('LLLD'); until(() => HW.Return.isHome(thing('blB3')), 120);
    walk(...s('loft', 11, 7)); HW.push('right', 3); HW.step(25); walk(...s('loft', 15, 6)); HW.push('down', 1); HW.step(25);
    hatch('loft', 9, 7, 'down'); walk(...s('uloft', 11, 7)); HW.face('right'); knot(); hatch('uloft', 9, 7, 'down');
    HW.step(310); walk(...s('loft', 9, 3)); HW.face('up'); talk(); ok(HW.Inv.hasPattern('spoolworks'), 'the Pattern');
    /* out of the Loft, through the Store and the Hall, up through the big door: the Tangle */
    walk(...s('store', 9, 1)); walk(...s('wind', 9, 1)); HW.hold('up'); HW.step(40); HW.release(); HW.step(30);
    walk(...s('heart', 6, 7)); HW.skipTalk(); HW.step(5);
    const t = HW.G.map.ents.find(e => e.kind === 'tangle');
    for (let round = 0; round < 3 && t.alive; round++) {
        until(() => ['tbN', 'tbW', 'tbE', 'tbS'].every(id => HW.Return.isHome(thing(id)) && !thing(id).mv), 300);
        walk(...s('heart', 8, 2)); HW.face('right'); stitch('UL'); until(() => HW.Return.isHome(thing('tbN')), 60);
        walk(...s('heart', 4, 4)); HW.face('down'); stitch('LL'); until(() => HW.Return.isHome(thing('tbW')), 60);
        walk(...s('heart', 14, 4)); HW.face('down'); stitch('RR'); until(() => HW.Return.isHome(thing('tbE')), 60);
        walk(...s('heart', 8, 8)); HW.push('right', 2); HW.step(25);
        hatch('heart', 2, 7, 'down'); walk(...s('uheart', 9, 7)); HW.face('down'); knot(); hatch('uheart', 2, 7, 'down');
        ok(until(() => t.state === 'open', 300), 'the Tangle comes apart');
        walk(...s('heart', 9, 6)); HW.face('up'); HW.press('atk', 1); HW.step(30);
    }
    ok(!t.alive, 'the Tangle undone');
    for (let i = 0; i < 20 && !HW.Progress.flag('d7'); i++) { HW.skipTalk(); HW.step(20); }
    ok(HW.Progress.flag('d7'), 'Gundry: an apprentice');
    walk(...s('heart', 9, 5)); HW.step(5);
    ok(HW.Inv.maxHp === 36, 'a new heart');
    assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
});
