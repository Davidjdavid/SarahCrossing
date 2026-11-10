// The Tidyhouse, room by room: each room's intended solution, played by the real game code.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const R = { foyer: [20, 33], kitchen: [0, 33], gallery: [40, 33], hall: [20, 22], pantry: [0, 22], parlor: [40, 22], cons: [60, 22], linen: [40, 11], laundry: [60, 11], ball: [20, 11], library: [0, 11], attic: [0, 0], ante: [40, 0], boss: [20, 0] };
function at(room, x, y) { const [ox, oy] = R[room]; return [ox + x, oy + y]; }
function game() {
    const HW = loadGame();
    HW.newGame('Test', { area: 'tidy', x: 29, y: 42, noAutosave: true });
    HW.Inv.items.staff = 1;
    HW.step(5);
    return HW;
}
function go(HW, room, x, y) { const [tx, ty] = at(room, x, y); const ok = HW.walkTo(tx, ty); assert.ok(ok, `walk to ${room} ${x},${y} (at ${HW.player().tx},${HW.player().ty})`); }
function thing(HW, id) { return HW.G.map.find(id); }
function noErrors(HW) { assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n')); }

test('foyer: push the block onto the plate and get through the gate before it goes home', () => {
    const HW = game();
    go(HW, 'foyer', 3, 5);
    HW.push('right', 2);
    assert.ok(HW.G.map.find('fN').open, 'gate open while the block is on the plate');
    go(HW, 'foyer', 9, 1);
    HW.step(10);
    go(HW, 'hall', 9, 9);
    HW.step(300);
    assert.ok(thing(HW, 'fN').open, 'the gate stays open once you are through');
    noErrors(HW);
});

test('foyer: dawdling lets the gate close', () => {
    const HW = game();
    go(HW, 'foyer', 3, 5);
    HW.push('right', 2);
    go(HW, 'foyer', 4, 3);
    HW.step(260);
    assert.equal(thing(HW, 'fN').open, false);
});

test('kitchen: a thrown pot flips the crystal over the counter and the key chest appears', () => {
    const HW = game();
    go(HW, 'kitchen', 12, 6);
    HW.face('up'); HW.press('act', 1);
    assert.ok(HW.player().carry, 'carrying a pot');
    go(HW, 'kitchen', 4, 4);
    HW.face('up'); HW.press('act', 1);
    HW.step(30);
    assert.ok(thing(HW, 'kCrystal').on, 'crystal flipped');
    const chest = thing(HW, 'kKey');
    assert.equal(chest.hidden, false, 'chest appeared');
    go(HW, 'kitchen', 13, 3);
    HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.keys('tidy'), 1);
    noErrors(HW);
});

test('gallery: the bust comes home behind the block and keeps it on the plate', () => {
    const HW = game();
    HW.Inv.keyCount.tidy = 1;
    go(HW, 'foyer', 18, 5);
    HW.hold('right'); HW.step(40); HW.release();
    go(HW, 'gallery', 9, 6);
    HW.push('up', 2);                       // bust into the pocket
    go(HW, 'gallery', 7, 5);
    HW.push('right', 2);                    // block through the bust's home onto the plate
    HW.step(300);
    assert.equal(thing(HW, 'galBust').tx, 40 + 9, 'bust home');
    assert.equal(thing(HW, 'galBlock').tx, 40 + 10, 'block still on the plate');
    assert.ok(thing(HW, 'gG').open, 'gate open');
    go(HW, 'gallery', 16, 2);
    HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.plans.includes('tidy'), 'got the plan');
    noErrors(HW);
});

test('hall of busts: the bust coming home shoves the block onto the plate and holds it there', () => {
    const HW = game();
    HW.Progress.setAreaFlag('tidy', 'door:fN');
    HW.warp('tidy', ...at('hall', 9, 8));
    go(HW, 'hall', 9, 7);
    HW.push('up', 3);
    go(HW, 'hall', 7, 4);
    HW.push('right', 1);
    go(HW, 'hall', 6, 6);
    HW.step(400);
    assert.equal(thing(HW, 'hallBlock').ty, 22 + 7, 'block shoved onto the plate');
    assert.ok(thing(HW, 'hN').open, 'north door open');
    go(HW, 'hall', 3, 1);
    HW.step(5);
    go(HW, 'ball', 3, 9);
    noErrors(HW);
});

test('hall of busts: just pushing the block onto the plate is not enough', () => {
    const HW = game();
    HW.warp('tidy', ...at('hall', 8, 2));
    HW.push('down', 3);                      // block (8,4) -> (8,7)
    go(HW, 'hall', 7, 7);
    HW.push('right', 1);                     // onto the plate
    assert.ok(thing(HW, 'hN').open);
    const ok = HW.walkTo(...at('hall', 3, 1));
    HW.step(2);
    assert.equal(thing(HW, 'hN').open, false, 'closed before you could get there');
});

test('pantry: a crate thrown onto the island plate opens the key nook', () => {
    const HW = game();
    HW.warp('tidy', ...at('pantry', 10, 3));
    HW.face('up'); HW.press('act', 1);
    assert.ok(HW.player().carry);
    go(HW, 'pantry', 8, 5);
    HW.face('left'); HW.press('act', 1);
    HW.step(28);
    assert.ok(thing(HW, 'pG').open, 'nook open while the crate sits on the plate');
    go(HW, 'pantry', 14, 7);
    go(HW, 'pantry', 15, 8);
    HW.face('right'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.keys('tidy'), 1);
    noErrors(HW);
});

test('pantry: stand where the cupboard lives and the Staff door is there (S04)', () => {
    const HW = game();
    HW.warp('tidy', ...at('pantry', 15, 1));
    HW.push('right', 1);
    go(HW, 'pantry', 16, 2);
    go(HW, 'pantry', 16, 1);
    HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Progress.flag('staffonly'));
    noErrors(HW);
});

test('parlor: the block going home over the pulse plate opens the far door', () => {
    const HW = game();
    HW.warp('tidy', ...at('parlor', 1, 9));
    go(HW, 'parlor', 1, 7);
    HW.push('right', 6);                       // past the plate to x=8
    go(HW, 'parlor', 7, 8);
    go(HW, 'parlor', 16, 1);
    for (let i = 0; i < 300 && !thing(HW, 'pN').open; i++) HW.step(1);
    assert.ok(thing(HW, 'pN').open, 'door opened when the block went home over the plate');
    HW.hold('up'); HW.step(60); HW.release(); HW.skipTalk();
    assert.equal(HW.G.map.roomAt(HW.player().tx, HW.player().ty).key, '2,1', 'through into the linen closets');
    noErrors(HW);
});

test('conservatory: a crate going home makes the odd click', () => {
    const HW = game();
    HW.warp('tidy', ...at('cons', 5, 8));
    HW.face('up'); HW.press('act', 1);
    assert.ok(HW.player().carry);
    go(HW, 'cons', 1, 3);
    go(HW, 'cons', 12, 3);                     // over A (on), onto B (on)
    HW.face('left'); HW.press('act', 1);      // throw back up the corridor
    go(HW, 'cons', 1, 4);                      // back out over A (off)
    HW.step(400);                              // the crate goes home over A (on)
    assert.ok(thing(HW, 'cG').open, 'gate open: both plates on');
    noErrors(HW);
});

test('linen: the Dust Monger, beaten by a bust coming home, and the Gloves', () => {
    const HW = game();
    HW.warp('tidy', ...at('linen', 16, 9));
    HW.step(60); HW.skipTalk();
    const m = HW.ents('enemy').find(e => e.type === 'monger');
    assert.ok(m && m.awake);
    // three thrown pots and a slam: drive it down by hand for the test (hit it with things)
    for (let i = 0; i < 6 && m.alive; i++) { m.flash = 0; m.struck(HW.at(...at('linen', 6, 3)) || { isGrid: true, weight: 3 }, 1, 0, true); HW.step(2); }
    HW.step(120); HW.skipTalk();
    assert.ok(HW.Progress.flag('tidy_monger'));
    go(HW, 'linen', 9, 6);
    HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.has('gloves'));
    noErrors(HW);
});

test('laundry: pull the block out of the cubby and slip in for the key', () => {
    const HW = game();
    HW.Inv.giveTool('gloves');
    HW.warp('tidy', ...at('laundry', 14, 4));
    HW.face('left');
    HW.hold(['act']); HW.step(3);
    const lb = thing(HW, 'laundryBlock');
    HW.hold(['act', 'right']);
    for (let i = 0; i < 200 && lb.tx < 60 + 15; i++) HW.step(1);
    HW.release(); HW.step(20);
    assert.ok(lb.tx >= 60 + 15, 'pulled out of the cubby');
    go(HW, 'laundry', 13, 4);
    HW.face('left'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.keys('tidy'), 1);
    noErrors(HW);
});

test('ballroom: grip one at the corridor\'s mouth so the other gets through, and they tidy up', () => {
    const HW = game();
    HW.Inv.giveTool('gloves');
    HW.warp('tidy', ...at('ball', 6, 8));
    HW.face('down'); HW.press('act', 1);      // the lever at (6,9)
    const A = thing(HW, 'ballA'), B = thing(HW, 'ballB');
    go(HW, 'ball', 5, 7);                     // beside B's way up over the pits
    HW.face('left');
    let held = false;
    for (let i = 0; i < 600 && !held; i++) {
        HW.step(1);
        if (B.tx === 20 + 4 && B.ty === 11 + 7) { HW.hold(['act']); HW.step(2); held = !!HW.player().grip; }
    }
    assert.ok(held, 'gripped B over the pit');
    for (let i = 0; i < 900 && !HW.Return.isHome(A); i++) HW.step(1);
    assert.ok(HW.Return.isHome(A), 'A got home while Wren held B');
    HW.release(); HW.step(2);
    go(HW, 'ball', 6, 8);
    for (let i = 0; i < 1200 && !HW.Return.isHome(B); i++) HW.step(1);
    assert.ok(HW.Return.isHome(B), 'B got home');
    HW.step(5);
    assert.ok(HW.Progress.flag('tidy_ballDone'));
    go(HW, 'ball', 9, 3);
    HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.hasPattern('tidy'), 'the Pattern');
    noErrors(HW);
});

test('ballroom: standing in a bust\'s way only gets Wren shoved', () => {
    const HW = game();
    HW.warp('tidy', ...at('ball', 6, 8));
    HW.face('down'); HW.press('act', 1);
    go(HW, 'ball', 17, 6);                    // in A's way
    HW.step(1200);
    assert.equal(HW.Progress.flag('tidy_ballDone'), false);
});

test('ballroom: jammed in the corridor, pull one back out with the Gloves and out of the line', () => {
    const HW = game();
    HW.Inv.giveTool('gloves');
    HW.warp('tidy', ...at('ball', 6, 8));
    HW.face('down'); HW.press('act', 1);
    const A = thing(HW, 'ballA'), B = thing(HW, 'ballB');
    HW.step(500);
    assert.ok(!HW.Return.isHome(A) && !HW.Return.isHome(B), 'jammed');
    // B is in the corridor with its back to the west end: pull it out to the corridor's mouth
    go(HW, 'ball', B.tx - 20 - 1, 5);
    HW.face('right'); HW.hold(['act']); HW.step(3);
    HW.hold(['act', 'left']);
    for (let i = 0; i < 600 && B.tx > 20 + 4; i++) HW.step(1);
    HW.release(); HW.step(20);
    // then up out of the line, so A can pass beneath it
    go(HW, 'ball', 4, 4);
    HW.face('down'); HW.hold(['act']); HW.step(3);
    HW.hold(['act', 'up']);
    for (let i = 0; i < 200 && B.ty > 11 + 4; i++) HW.step(1);
    HW.release(); HW.step(2);
    go(HW, 'ball', 1, 2);
    for (let i = 0; i < 1500 && !(HW.Return.isHome(A) && HW.Return.isHome(B)); i++) HW.step(1);
    assert.ok(HW.Return.isHome(A) && HW.Return.isHome(B), 'both home');
    noErrors(HW);
});

test('ballroom: let go together, they deadlock in the corridor; the lever sets them out again', () => {
    const HW = game();
    HW.warp('tidy', ...at('ball', 6, 8));
    HW.face('down'); HW.press('act', 1);
    HW.step(1200);
    assert.equal(HW.Progress.flag('tidy_ballDone'), false);
    HW.face('down'); HW.press('act', 1);
    const A = thing(HW, 'ballA'), B = thing(HW, 'ballB');
    assert.deepEqual([A.tx, A.ty, B.tx, B.ty], [20 + 17, 11 + 8, 20 + 1, 11 + 8], 'set out again');
    assert.ok(A.tiedOff && B.tiedOff);
});

test('library: pull the bookshelf and the passage to the attic opens (S06)', () => {
    const HW = game();
    HW.Inv.giveTool('gloves');
    HW.warp('tidy', ...at('library', 9, 2));
    HW.face('up'); HW.hold(['act']); HW.step(3);
    HW.hold(['act', 'down']); HW.step(30);
    HW.release(); HW.step(2);
    go(HW, 'library', 10, 2);
    go(HW, 'library', 9, 1);
    HW.hold('up'); HW.step(40); HW.release();
    HW.step(40);
    assert.equal(HW.G.map.roomAt(HW.player().tx, HW.player().ty).key, '0,0', 'in the attic');
    noErrors(HW);
});

test('the Housekeeper: slammed by a bust coming home, then struck while its doors hang open', () => {
    const HW = game();
    HW.Inv.patterns.push('tidy');
    HW.warp('tidy', ...at('ante', 1, 5));
    HW.hold('left'); HW.step(50); HW.release();
    HW.hold('left'); HW.step(60); HW.release(); HW.step(40); HW.skipTalk();
    const k = HW.ents('enemy').find(e => e.type === 'housekeeper');
    assert.ok(k, 'boss present');
    for (let round = 0; round < 3 && k.alive; round++) {
        k.shoved(0, 10, { weight: 3 }); HW.step(12);
        HW.player().x = k.x; HW.player().y = k.y + 20; HW.face('up');
        HW.press('atk', 1); HW.step(45);
    }
    HW.step(120); HW.skipTalk();
    assert.ok(HW.Progress.flag('tidy_boss'), 'boss down');
    const hoop = HW.ents('hoop')[0];
    assert.ok(hoop);
    HW.player().x = hoop.tx * 16 + 8; HW.player().y = (hoop.ty + 1) * 16 + 10; HW.face('up');
    HW.press('act', 1); HW.skipTalk(0); HW.step(400); HW.skipTalk();
    assert.ok(HW.Inv.knots.includes('tidy'), 'knot tied');
    assert.ok(HW.Progress.flag('d1'));
    noErrors(HW);
});

const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
test('the Housekeeper, for real, three different ways, its moves going all the while: its own yank; a way home through its cross; a held bust drags it', () => {
    const HW = game();
    HW.G.cheats.god = true;                     /* (its blows land but don't hurt here: the dodging is checked below) */
    HW.Inv.giveTool('gloves');                  /* (found mid-House, before the boss) */
    HW.Inv.patterns.push('tidy');
    HW.warp('tidy', ...at('ante', 1, 5));
    HW.hold('left'); HW.step(50); HW.release();
    HW.hold('left'); HW.step(60); HW.release(); HW.step(40); HW.skipTalk();
    const k = HW.ents('enemy').find(e => e.type === 'housekeeper');
    const strike = () => {
        for (let i = 0; i < 12; i++) HW.step(1);
        const p = HW.player(); p.x = k.x + 18; p.y = k.y; HW.face('left');
        HW.press('atk', 1); HW.step(40);
        for (let i = 0; i < 600 && k.alive && !(k.state === 'home' && k.atHome()); i++) HW.step(1);
    };
    /* 1: push a bust out toward the wall; it comes over to tidy it, stands in the way, and its own yank slams it */
    go(HW, 'boss', 4, 3);
    for (let i = 0; i < 900 && k.state !== 'home'; i++) HW.step(1);
    go(HW, 'boss', 4, 4);
    k.setState('home');
    HW.push('left', 1);                         // the left bust (3,4) -> (2,4), out toward the wall
    go(HW, 'boss', 3, 8);                       // out of the way
    for (let i = 0; i < 600 && k.state !== 'stunned' && k.alive; i++) HW.step(1);
    assert.equal(k.state, 'stunned', 'slammed by the bust it yanked home');
    strike();
    assert.equal(k.hp, 2, 'one down');
    /* 2: it won't go over any more. Bait a charge (stand in line with it), and while it's off its cross, push the top
       bust down across the cross: home again, it yanks the bust back the way it came, through itself */
    HW.skipTalk(); HW.step(30);
    go(HW, 'boss', 13, 4); HW.face('left');
    assert.ok(until(HW, () => k.state === 'charge' || k.state === 'recoil', 400), 'it charges');
    go(HW, 'boss', 9, 1);
    HW.push('down', 3);                         // (9,2) -> (9,5): across its cross
    go(HW, 'boss', 6, 6);                       // out of the way
    assert.ok(until(HW, () => k.state === 'stunned' || !k.alive, 900), 'slammed by the bust coming home through its cross');
    strike();
    assert.equal(k.hp, 1, 'two down');
    /* 3: it never leaves its cross and yanks at once: grip a bust and pull it out, and hold on: it's dragged into it */
    HW.skipTalk(); HW.step(30);
    go(HW, 'boss', 3, 3); HW.face('down');
    HW.hold(['act']); HW.step(4);
    assert.ok(HW.player().grip, 'gripping the bust');
    HW.hold(['act', 'up']); HW.step(22); HW.hold(['act']);
    assert.ok(until(HW, () => k.state === 'stunned' || !k.alive, 400), 'dragged into the bust it was yanking');
    HW.release(); HW.step(4);
    strike();
    HW.step(100); HW.skipTalk();
    assert.ok(HW.Progress.flag('tidy_boss'), 'down for good');
    assert.ok(HW.Stats.c['boss:tidy:charge'] >= 1, 'it charged');
    noErrors(HW);
});

/* into the Grand Hall and through its introduction: the Housekeeper on its cross, awake */
function hall(HW) {
    HW.Inv.patterns.push('tidy');
    HW.warp('tidy', ...at('ante', 1, 5));
    HW.hold('left'); HW.step(50); HW.release();
    HW.hold('left'); HW.step(60); HW.release(); HW.step(40); HW.skipTalk();
    const k = HW.ents('enemy').find(e => e.type === 'housekeeper');
    until(HW, () => k.state === 'home', 300);
    return k;
}
const hazards = HW => HW.G.map.ents.filter(e => e.kind === 'hazard');
test("the Housekeeper's charge: its lane lit to the wall for the whole tell; out of the lane it thunders by, in it it costs a heart", () => {
    for (const dodge of [true, false]) {
        const HW = game();
        HW.Inv.maxHp = HW.Inv.hp = 10;
        const k = hall(HW);
        go(HW, 'boss', 14, 4); HW.face('left');
        assert.ok(until(HW, () => k.state === 'windup', 400), 'it winds up');
        const lane = hazards(HW).find(h => h.owner === k);
        assert.ok(lane && lane.tiles.some(([x, y]) => x === at('boss', 14, 4)[0] && y === at('boss', 14, 4)[1]), 'its lane lit, Wren in it');
        assert.ok(lane.tell >= 36, 'a long first-House tell');
        const hp = HW.Inv.hp;
        if (dodge) { HW.hold('up'); HW.step(26); HW.release(); }
        assert.ok(until(HW, () => k.state === 'recoil', 200), 'it charged');
        HW.step(20);
        if (dodge) assert.equal(HW.Inv.hp, hp, 'stepped out of its lane: missed');
        else assert.equal(HW.Inv.hp, hp - 2, 'stood in its lane: a full heart');
        noErrors(HW);
    }
});
test("the Housekeeper's stamp: up on its toes, a ring on the floor round it; out of the ring, nothing", () => {
    for (const dodge of [true, false]) {
        const HW = game();
        HW.Inv.maxHp = HW.Inv.hp = 10;
        const k = hall(HW);
        go(HW, 'boss', 10, 5);                   // close by, but not in line with it
        assert.ok(until(HW, () => k.state === 'rear', 300), 'it rears');
        const ring = hazards(HW).find(h => h.owner === k && h.shape === 'ring');
        assert.ok(ring && ring.covers(HW.player().x, HW.player().y), 'Wren inside the ring');
        const hp = HW.Inv.hp;
        if (dodge) { HW.hold('down'); HW.step(30); HW.release(); assert.ok(!ring.covers(HW.player().x, HW.player().y), 'out of it'); }
        assert.ok(until(HW, () => k.state === 'stamped', 100), 'it stamps');
        HW.step(10);
        if (dodge) assert.equal(HW.Inv.hp, hp, 'out of the ring: missed');
        else assert.ok(HW.Inv.hp < hp, 'in the ring: shaken off her feet');
        noErrors(HW);
    }
});
test("the Housekeeper's hanger (once it won't leave its cross): its line shown; off the line, and off it again as it comes home", () => {
    for (const dodge of [true, false]) {
        const HW = game();
        HW.Inv.maxHp = HW.Inv.hp = 10;
        const k = hall(HW);
        k.hp = 1; k.told = 3;                    // (its third beat)
        go(HW, 'boss', 15, 8);
        assert.ok(until(HW, () => k.state === 'aimH', 400), 'it aims a hanger');
        const line = hazards(HW).find(h => h.owner === k);
        assert.ok(line && line.tiles.some(([x, y]) => x === HW.player().tx && y === HW.player().ty), 'Wren on its line');
        const hp = HW.Inv.hp;
        if (dodge) { HW.hold('left'); HW.step(20); HW.release(); }
        const f = () => HW.G.map.ents.find(e => e.kind === 'flung');
        assert.ok(until(HW, () => !!f(), 100), 'flung');
        assert.ok(until(HW, () => !f() || f().state === 'lie', 100), 'it lands');
        if (dodge) {
            assert.equal(HW.Inv.hp, hp, 'missed');
            const h = f();
            assert.ok(!h.path.some(([x, y]) => x === HW.player().tx && y === HW.player().ty), 'off its thread');
            assert.ok(until(HW, () => !f(), 300), 'home along its thread');
            assert.equal(HW.Inv.hp, hp, 'and missed again');
        } else assert.ok(HW.Inv.hp < hp, 'stood on its line: hit');
        noErrors(HW);
    }
});
test('the Dust Monger: it crouches, and comes down where Wren stood (its shadow first): out from under it', () => {
    for (const dodge of [true, false]) {
        const HW = game();
        HW.Inv.maxHp = HW.Inv.hp = 10;
        HW.warp('tidy', ...at('linen', 16, 9));
        HW.step(60); HW.skipTalk();
        const m = HW.ents('enemy').find(e => e.type === 'monger');
        go(HW, 'linen', 14, 5);
        m.flopT = 400;
        assert.ok(until(HW, () => !!m.flop, 200), 'it crouches');
        const sh = hazards(HW).find(h => h.owner === m);
        assert.ok(sh && sh.covers(HW.player().x, HW.player().y), 'its shadow on Wren');
        const hp = HW.Inv.hp;
        if (dodge) { HW.hold('up'); HW.step(24); HW.release(); }
        else HW.G.player.inv = 0;
        assert.ok(until(HW, () => !m.flop, 200), 'it lands');
        if (dodge) assert.equal(HW.Inv.hp, hp, 'out from under it');
        else assert.ok(HW.Inv.hp <= hp - 2, 'under it: a full heart');
        noErrors(HW);
    }
});
