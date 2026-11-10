// The Kiln, room by room: each room's intended solution, played by the real game code.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const R = { entrance: [20, 33], lwr: [0, 33], hall: [20, 22], crocks: [40, 33], sms: [40, 22], doubling: [0, 22], glazer: [40, 11], gallery: [60, 11], bridge: [60, 22], furnace: [20, 11], racks: [0, 11], sig: [0, 0], vats: [40, 0], boss: [20, 0] };
const at = (room, x, y) => [R[room][0] + x, R[room][1] + y];
function game(tools = []) {
    const HW = loadGame();
    HW.newGame('Test', { area: 'kiln', x: 29, y: 42, noAutosave: true });
    HW.Inv.items.staff = 1;
    for (const t of tools) HW.Inv.giveTool(t);
    HW.step(5);
    return HW;
}
function go(HW, room, x, y) {
    let ok = HW.walkTo(...at(room, x, y));
    for (let i = 0; i < 3 && !ok; i++) { HW.skipTalk(); HW.step(5); ok = HW.walkTo(...at(room, x, y)); }
    assert.ok(ok, `walk to ${room} ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
}
const thing = (HW, id) => HW.G.map.find(id);
const lift = (HW, d) => { HW.face(d); HW.press('act', 1); assert.ok(HW.player().carry, 'lifted'); };
const toss = (HW, d) => { HW.face(d); HW.press('act', 1); };
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const flag = (HW, f) => HW.Progress.flag(f);

test('entrance: a throw through the charm over the pit opens the key nook; a throw at the seal opens the way north', () => {
    const HW = game();
    go(HW, 'entrance', 2, 7); lift(HW, 'down');
    go(HW, 'entrance', 9, 8); toss(HW, 'up'); HW.step(40);
    assert.ok(thing(HW, 'eCharm').on, 'charm rung');
    go(HW, 'entrance', 17, 2); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.keys('kiln'), 1);
    go(HW, 'entrance', 16, 7); lift(HW, 'down');
    go(HW, 'entrance', 9, 2); toss(HW, 'up'); HW.step(30);
    assert.equal(thing(HW, 'eSeal'), undefined, 'seal broken');
    noErrors(HW);
});

test('long way round: carry the pot under the charm, through the door, to the gate; throw it there', () => {
    const HW = game();
    go(HW, 'entrance', 2, 7); lift(HW, 'down');
    go(HW, 'entrance', 1, 7);                      // under the charm by the west door
    go(HW, 'lwr', 18, 7); go(HW, 'lwr', 3, 5);
    toss(HW, 'down');
    for (let i = 0; i < 300 && !thing(HW, 'lwrGate').open; i++) HW.step(1);
    assert.ok(thing(HW, 'lwrGate').open, 'gate open while Wren is beside it');
    go(HW, 'lwr', 3, 3); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.patches >= 1);
    noErrors(HW);
});

test('charm hall: one flight rings all three', () => {
    const HW = game();
    HW.warp('kiln', ...at('hall', 2, 7)); HW.step(2);
    lift(HW, 'down');
    go(HW, 'hall', 2, 2); go(HW, 'hall', 5, 2); go(HW, 'hall', 14, 2); go(HW, 'hall', 17, 2); go(HW, 'hall', 17, 7); go(HW, 'hall', 16, 8); go(HW, 'hall', 9, 8); go(HW, 'hall', 8, 8);
    toss(HW, 'left');
    for (let i = 0; i < 300 && !thing(HW, 'hN').open; i++) HW.step(1);
    assert.ok(thing(HW, 'hN').open, 'north gate open');
    noErrors(HW);
});

test('charm hall: ringing them one throw at a time does not open it', () => {
    const HW = game();
    HW.warp('kiln', ...at('hall', 2, 7)); HW.step(2);
    lift(HW, 'down'); go(HW, 'hall', 5, 6); toss(HW, 'up'); HW.step(200);
    go(HW, 'hall', 17, 7); lift(HW, 'down'); go(HW, 'hall', 14, 6); toss(HW, 'up'); HW.step(20);
    assert.equal(thing(HW, 'hN').open, false);
});

test('sun, moon, star: walk them star-moon-sun so the pieces ring sun-moon-star', () => {
    const HW = game();
    HW.Inv.keyCount.kiln = 1;
    HW.warp('kiln', ...at('hall', 18, 5)); HW.hold('right'); HW.step(50); HW.release();
    go(HW, 'sms', 1, 7); lift(HW, 'down');
    go(HW, 'sms', 1, 1); go(HW, 'sms', 17, 1); go(HW, 'sms', 17, 9); go(HW, 'sms', 4, 9);
    toss(HW, 'left');
    for (let i = 0; i < 400 && !thing(HW, 'smsN').open; i++) HW.step(1);
    assert.ok(thing(HW, 'smsN').open, 'gate open');
    noErrors(HW);
});

test('sun, moon, star: the other way round rings them backwards', () => {
    const HW = game();
    HW.warp('kiln', ...at('sms', 1, 6)); HW.step(2);
    go(HW, 'sms', 1, 7); lift(HW, 'down');
    go(HW, 'sms', 1, 9); go(HW, 'sms', 17, 9); go(HW, 'sms', 17, 1); go(HW, 'sms', 4, 1);
    toss(HW, 'left'); HW.step(400);
    assert.equal(thing(HW, 'smsN').open, false);
});

test('sun, moon, star: rung one at a time, each has died away before the next, and they fall silent', () => {
    const HW = game();
    HW.warp('kiln', ...at('sms', 1, 6)); HW.step(2);
    const lit = () => ['smsSun', 'smsMoon', 'smsStar'].map(id => thing(HW, id).on ? 1 : 0).join('');
    go(HW, 'sms', 1, 7); lift(HW, 'down'); go(HW, 'sms', 1, 9); go(HW, 'sms', 10, 9); toss(HW, 'right');
    let sun = false; for (let i = 0; i < 120 && !sun; i++) { HW.step(1); sun = thing(HW, 'smsSun').on; }
    assert.ok(sun, 'the sun rings by itself');
    HW.step(200);
    assert.equal(lit(), '000', 'and dies away');
    go(HW, 'sms', 1, 7); lift(HW, 'down'); go(HW, 'sms', 2, 8); go(HW, 'sms', 17, 8); go(HW, 'sms', 17, 4); toss(HW, 'up'); HW.step(300);
    go(HW, 'sms', 1, 7); lift(HW, 'down'); go(HW, 'sms', 1, 1); go(HW, 'sms', 10, 1); toss(HW, 'right'); HW.step(300);
    assert.equal(thing(HW, 'smsN').open, false, 'one at a time never opens it');
});

test('doubling back: round the ring and finish in the spur', () => {
    const HW = game();
    HW.warp('kiln', ...at('doubling', 16, 8)); HW.step(2);
    lift(HW, 'right');
    go(HW, 'doubling', 1, 8); go(HW, 'doubling', 1, 5); go(HW, 'doubling', 12, 5); go(HW, 'doubling', 12, 3);
    toss(HW, 'up');
    for (let i = 0; i < 300 && thing(HW, 'dKey').hidden; i++) HW.step(1);
    assert.equal(thing(HW, 'dKey').hidden, false, 'chest appeared');
    noErrors(HW);
});

test('doubling back: along the corridor and back loses a charm', () => {
    const HW = game();
    HW.warp('kiln', ...at('doubling', 16, 8)); HW.step(2);
    lift(HW, 'right');
    go(HW, 'doubling', 18, 5); go(HW, 'doubling', 4, 5); go(HW, 'doubling', 12, 5); go(HW, 'doubling', 12, 3);
    toss(HW, 'up'); HW.step(300);
    assert.equal(thing(HW, 'dKey').hidden, true);
});

test('the Glazer: its own shot comes home through it', () => {
    const HW = game();
    HW.warp('kiln', ...at('glazer', 16, 9)); HW.step(60); HW.skipTalk();
    const g = HW.ents('enemy').find(e => e.type === 'glazer');
    assert.ok(g);
    for (let n = 0; n < 2000 && g.alive; n++) {
        // stand in line with it a little way off; when it throws, step aside
        if (g.state === 'walk' || g.state === 'hold') { const p = HW.player(); HW.hold(p.tx < g.tx ? 'right' : 'left'); HW.step(1); HW.release(); }
        else if (g.state === 'aim') { HW.hold('down'); HW.step(12); HW.release(); }
        else HW.step(1);
        if (HW.Inv.hp < 3) HW.Inv.hp = 6;
    }
    HW.step(60); HW.skipTalk();
    assert.ok(flag(HW, 'kiln_glazer'), 'Glazer broken');
    go(HW, 'glazer', 9, 7); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.has('hook'), 'Hookline');
    noErrors(HW);
});

test('chasm gallery: hook across both chasms to the heart patch', () => {
    const HW = game(['hook']);
    HW.warp('kiln', ...at('gallery', 1, 5)); HW.step(2);
    go(HW, 'gallery', 3, 2); HW.face('right'); HW.press('tool', 1); HW.step(60);
    assert.equal(HW.player().tx, R.gallery[0] + 7);
    go(HW, 'gallery', 10, 7); HW.face('right'); HW.press('tool', 1); HW.step(60);
    assert.equal(HW.player().tx, R.gallery[0] + 14);
    go(HW, 'gallery', 17, 8); HW.face('down'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.patches >= 1);
    noErrors(HW);
});

test('bridge of cords: carry a pot while reeling over the drop; the pieces come back across it', () => {
    const HW = game(['hook']);
    HW.warp('kiln', ...at('bridge', 14, 2)); HW.step(2);
    go(HW, 'bridge', 14, 3); HW.face('down'); HW.press('tool', 1); HW.step(60);
    assert.equal(HW.player().ty, R.bridge[1] + 8, 'over to the south side');
    go(HW, 'bridge', 3, 7); lift(HW, 'down');
    go(HW, 'bridge', 6, 7); HW.face('up'); HW.press('tool', 1); HW.step(60);
    assert.equal(HW.player().ty, R.bridge[1] + 2, 'back north, carrying');
    go(HW, 'bridge', 9, 2); toss(HW, 'right');
    for (let i = 0; i < 300 && thing(HW, 'bKey').hidden; i++) HW.step(1);
    assert.equal(thing(HW, 'bKey').hidden, false);
    noErrors(HW);
});

test('furnace hall: throw to knock the crate off its mark, hook the empty mark, reel over', () => {
    const HW = game(['hook']);
    HW.warp('kiln', ...at('furnace', 9, 9)); HW.step(2);
    go(HW, 'furnace', 16, 3); lift(HW, 'up');
    go(HW, 'furnace', 7, 5); toss(HW, 'left'); HW.step(22);
    assert.equal(thing(HW, 'fCrate').tx, R.furnace[0] + 2, 'crate knocked off its mark');
    HW.face('left'); HW.press('tool', 1); HW.step(50);
    assert.equal(HW.player().tx, R.furnace[0] + 3, 'reeled onto the empty mark');
    noErrors(HW);
});

test('drying racks: four charms in one flight, with a reel over the pit in the middle', () => {
    const HW = game(['hook']);
    HW.warp('kiln', ...at('racks', 17, 6)); HW.step(2);
    lift(HW, 'right');
    go(HW, 'racks', 18, 2); go(HW, 'racks', 16, 2); go(HW, 'racks', 13, 2); go(HW, 'racks', 13, 8); go(HW, 'racks', 16, 8); go(HW, 'racks', 16, 9); go(HW, 'racks', 12, 9); go(HW, 'racks', 12, 5);
    HW.face('left'); HW.press('tool', 1); HW.step(60);
    assert.equal(HW.player().tx, R.racks[0] + 6, 'over the pit');
    go(HW, 'racks', 2, 8); go(HW, 'racks', 2, 9);
    toss(HW, 'right');
    for (let i = 0; i < 400 && thing(HW, 'kPattern').hidden; i++) HW.step(1);
    assert.equal(thing(HW, 'kPattern').hidden, false, 'the Pattern appears');
    go(HW, 'racks', 2, 3); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.hasPattern('kiln'));
    noErrors(HW);
});

test('drying racks: a thrown pot breaks the hollow wall into the potting shed (signature)', () => {
    const HW = game();
    HW.warp('kiln', ...at('racks', 17, 6)); HW.step(2);
    lift(HW, 'right'); go(HW, 'racks', 14, 2); go(HW, 'racks', 9, 2); toss(HW, 'up'); HW.step(30);
    assert.equal(thing(HW, 'sigSeal'), undefined, 'wall broken');
    go(HW, 'sig', 9, 6); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(flag(HW, 'sig:kiln'));
    noErrors(HW);
});

test('the Kilnwyrm, three ways, its moves going all the while: shards along its trail; shards across its rim as it comes round; shards reeled over its pit', () => {
    const HW = game(['hook']);
    HW.G.cheats.god = true;                      /* (its blows land but don't hurt here: the dodging is checked below) */
    HW.Inv.patterns.push('kiln'); HW.Inv.maxHp = HW.Inv.hp = 20;
    HW.warp('kiln', ...at('vats', 1, 5)); HW.hold('left'); HW.step(50); HW.release();
    HW.hold('left'); HW.step(60); HW.release(); HW.step(40); HW.skipTalk();
    const w = HW.ents('enemy').find(e => e.type === 'kilnwyrm');
    assert.ok(w, 'the wyrm');
    const R0 = R.boss, settle = () => { for (let i = 0; i < 220 && w.state !== 'hurt' && w.alive; i++) HW.step(1); HW.Inv.hp = 20; for (let i = 0; i < 70; i++) HW.step(1); HW.skipTalk(); };
    /* 1: it follows your footprints, and the urn's pieces come home along them */
    go(HW, 'boss', 17, 3); lift(HW, 'up');         /* urn at (17,2) */
    go(HW, 'boss', 12, 3); go(HW, 'boss', 12, 7); go(HW, 'boss', 5, 7);
    toss(HW, 'left'); settle();
    assert.equal(w.hp, 2, 'one');
    assert.equal(w.state, 'rim', 'off round the rim');
    /* 2: carry an urn out across the rim and back in another way (no loop), and throw as it comes round */
    go(HW, 'boss', 2, 7); lift(HW, 'down');          /* urn at (2,8) */
    go(HW, 'boss', 1, 7); go(HW, 'boss', 1, 6); go(HW, 'boss', 2, 6); go(HW, 'boss', 4, 6);
    /* wait till it's coming up the left side, just short of where the urn's way home crosses the rim */
    const near = () => Math.abs(w.x - ((R0[0] + 1) * 16 + 8)) < 2 && w.y > (R0[1] + 8) * 16 && w.y < (R0[1] + 9) * 16 + 12;
    for (let i = 0; i < 1200 && !near(); i++) { HW.step(1); HW.Inv.hp = 20; }
    toss(HW, 'right'); settle();
    assert.equal(w.hp, 1, 'two');
    assert.equal(w.state, 'pit', 'down in the pit');
    /* 3: an urn carried over the pit on the Hookline: its pieces fly home back over the pit, and through the coils */
    go(HW, 'boss', 2, 3); lift(HW, 'up');            /* urn at (2,2) */
    go(HW, 'boss', 6, 5); HW.face('right'); HW.Inv.equipped = 'hook'; HW.press('tool', 1);
    for (let i = 0; i < 120 && (HW.player().state !== 'normal' || HW.player().tx < R0[0] + 12); i++) HW.step(1);
    assert.equal(HW.player().tx, R0[0] + 12, 'reeled over the pit');
    toss(HW, 'right'); settle();
    HW.step(120); HW.skipTalk();
    assert.ok(flag(HW, 'kiln_boss'), 'the Kilnwyrm is broken');
    assert.ok(!HW.G.map.kind(R0[0] + 9, R0[1] + 4).pit, 'the pit closed over');
    const c = HW.Stats.c;
    assert.ok(c['boss:kiln:dart'] >= 1 && c['boss:kiln:glob'] >= 1 && c['boss:kiln:shed'] >= 1, 'it darted, spat glaze and shed pieces of itself');
    noErrors(HW);
});

/* into the Kiln's Heart, the wyrm awake (and, for a later beat, knocked straight into it) */
function wyrm(HW, beat = 1) {
    HW.Inv.patterns.push('kiln'); HW.Inv.maxHp = HW.Inv.hp = 12;
    HW.warp('kiln', ...at('vats', 1, 5)); HW.hold('left'); HW.step(50); HW.release();
    HW.hold('left'); HW.step(60); HW.release(); HW.step(40); HW.skipTalk();
    const w = HW.ents('enemy').find(e => e.type === 'kilnwyrm');
    if (beat > 1) { w.hp = 4 - beat; w.state = 'hurt'; w.st = 60; w.cool = 0; HW.step(2); HW.skipTalk(); }
    return w;
}
const blows = (HW, o) => HW.G.map.ents.filter(e => e.kind === 'hazard' && e.owner === o);
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
test("the Kilnwyrm's dart: close behind Wren it rears up hissing, its mouth aglow; keep walking and it falls short, stand still and it bites (a full heart)", () => {
    for (const dodge of [true, false]) {
        const HW = game(['hook']);
        const w = wyrm(HW);
        assert.ok(until(HW, () => w.state === 'rear', 900), 'it rears');
        assert.ok(w.tellN >= 30, 'a fair tell');
        const hp = HW.Inv.hp, d = HW.global('dirOf')(HW.player().x - w.x, HW.player().y - w.y);
        if (dodge) { HW.hold(['down', 'left', 'right', 'up'][d]); HW.step(60); HW.release(); }
        assert.ok(until(HW, () => w.state === 'follow', 200), 'it darted');
        if (dodge) assert.equal(HW.Inv.hp, hp, 'walked on: it fell short');
        else assert.equal(HW.Inv.hp, hp - 2, 'stood still: bitten');
        noErrors(HW);
    }
});
test("the Kilnwyrm's glaze (round the rim): its mouth aglow, a shadow where Wren stands; out from under it, and the puddle it leaves still burns", () => {
    for (const dodge of [true, false]) {
        const HW = game(['hook']);
        const w = wyrm(HW, 2);
        assert.equal(w.state, 'rim');
        go(HW, 'boss', 9, 5);
        assert.ok(until(HW, () => blows(HW, w).some(h => h.covers(HW.player().x, HW.player().y)), 600), 'a shadow on Wren');
        const g = blows(HW, w).find(h => h.covers(HW.player().x, HW.player().y)), hp = HW.Inv.hp;
        if (dodge) { HW.hold('down'); HW.step(28); HW.release(); }
        assert.ok(until(HW, () => g.landed, 100)); HW.step(2);
        if (dodge) {
            assert.equal(HW.Inv.hp, hp, 'out from under it');
            HW.player().inv = 0; HW.hold('up'); HW.step(28); HW.release(); HW.step(4);
            assert.ok(HW.Inv.hp < hp, 'back into the puddle: it burns');
        } else assert.ok(HW.Inv.hp < hp, 'under it: hit');
        noErrors(HW);
    }
});
test("the Kilnwyrm's shedding (in its pit): pieces come down round the edge (shadows first) and lie on their threads to the pit; off the threads when they shiver home", () => {
    for (const dodge of [true, false]) {
        const HW = game(['hook']);
        const w = wyrm(HW, 3);
        assert.equal(w.state, 'pit');
        go(HW, 'boss', 13, 8); w.cool = 0; w.shedLast = false;
        assert.ok(until(HW, () => blows(HW, w).length >= 3, 600), 'it rattles: shadows round the pit');
        const flung = () => HW.G.map.ents.filter(e => e.kind === 'flung' && e.owner === w);
        assert.ok(until(HW, () => flung().length >= 3, 120), 'pieces lying on their threads');
        const lines = flung().map(f => f.path), p = HW.player(), R0 = R.boss;
        const on = (x, y) => lines.some(l => l.some(([a, b]) => a === x && b === y));
        if (dodge) {
            /* somewhere close that no thread runs over */
            let best = null;
            for (let y = 1; y <= 9; y++) for (let x = 1; x <= 18; x++) { const [tx, ty] = [R0[0] + x, R0[1] + y], k = HW.G.map.kind(tx, ty); if (!k.solid && !k.pit && !on(tx, ty) && !HW.G.map.at(tx, ty) && (!best || Math.abs(tx - p.tx) + Math.abs(ty - p.ty) < best[2])) best = [tx, ty, Math.abs(tx - p.tx) + Math.abs(ty - p.ty)]; }
            assert.ok(HW.walkTo(best[0], best[1]), 'off every thread');
        } else {
            /* onto a thread, a tile out from where its piece lies */
            const l = lines.find(q => q.length > 3), [x, y] = l[l.length - 2];
            assert.ok(HW.walkTo(x, y), 'on a thread');
        }
        const hp = HW.Inv.hp; HW.player().inv = 0;
        assert.ok(until(HW, () => !flung().length, 200), 'home along their threads');
        if (dodge) assert.equal(HW.Inv.hp, hp, 'none struck her');
        else assert.ok(HW.Inv.hp < hp, 'struck on its way home');
        noErrors(HW);
    }
});
test('the Glazer: too close and it braces behind its shield (its "!", the tiles ahead lit); step out of them, or be barged (a full heart)', () => {
    for (const dodge of [true, false]) {
        const HW = game();
        HW.Inv.maxHp = HW.Inv.hp = 10;
        HW.warp('kiln', ...at('glazer', 16, 9)); HW.step(60); HW.skipTalk();
        const g = HW.ents('enemy').find(e => e.type === 'glazer');
        go(HW, 'glazer', 6, 6);
        g.x = HW.player().x + 22; g.y = HW.player().y; g.setState('walk'); g.st = 40;
        assert.ok(until(HW, () => g.state === 'brace', 10), 'it braces');
        const lit = blows(HW, g).find(h => h.dmg > 0);
        assert.ok(lit && lit.covers(HW.player().x, HW.player().y), 'Wren on the lit tiles');
        const hp = HW.Inv.hp;
        if (dodge) { HW.hold('up'); HW.step(24); HW.release(); }
        assert.ok(until(HW, () => g.state === 'hold', 100), 'it barged');
        if (dodge) assert.equal(HW.Inv.hp, hp, 'stepped out of its way');
        else assert.equal(HW.Inv.hp, hp - 2, 'barged');
        noErrors(HW);
    }
});
