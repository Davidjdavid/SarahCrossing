// The Belfry (House 4): every room's solution, played through the real game code.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const R = { porch: [20, 44], draught: [0, 44], windward: [40, 44], stair: [20, 33], weather: [0, 33], rafters: [40, 33], loft: [20, 22], reach: [0, 22], echo: [40, 22], ropes: [20, 11], workshop: [0, 11], bell: [20, 0], frame: [40, 11], cistern: [40, 0] };
const at = (room, x, y) => [R[room][0] + x, R[room][1] + y];
function game(tools = []) {
    const HW = loadGame();
    HW.newGame('Test', { area: 'belfry', x: 29, y: 53, noAutosave: true });
    HW.Inv.items.staff = 1;
    for (const t of ['gloves', 'hook', 'paddle', ...tools]) HW.Inv.giveTool(t);
    HW.Inv.maxHp = HW.Inv.hp = 40;
    HW.step(5);
    return HW;
}
const enter = (HW, room, x, y) => { HW.warp('belfry', ...at(room, x, y)); HW.step(30); HW.skipTalk(); HW.step(5); };
const go = (HW, room, x, y) => assert.ok(HW.walkTo(...at(room, x, y)), `walk to ${room} ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const thing = (HW, id) => HW.G.map.find(id);
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const strike = (HW, dir) => { HW.face(dir); HW.press('atk', 1); HW.step(12); };
const ring = HW => { HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(4); };
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const gustOn = g => g.on;

test('porch: strike the bell; the boulder asleep in the doorway wakes and goes home', () => {
    const HW = game();
    const b = thing(HW, 'bpBoulder');
    assert.ok(b.tiedOff, 'asleep');
    go(HW, 'porch', 6, 5); strike(HW, 'up');
    assert.ok(until(HW, () => HW.Return.isHome(b), 120), 'gone home');
    go(HW, 'porch', 9, 1); go(HW, 'stair', 9, 9);
    noErrors(HW);
});

test('the draught: line the pale crates up in the lane; the gust blows them into the pits by the key', () => {
    const HW = game();
    enter(HW, 'draught', 18, 5);
    go(HW, 'draught', 10, 8); HW.push('up', 2);
    assert.ok(until(HW, () => !HW.G.map.kind(...at('draught', 5, 5)).pit, 600), 'first pit filled');
    go(HW, 'draught', 13, 2); HW.push('down', 2);
    assert.ok(until(HW, () => !HW.G.map.kind(...at('draught', 4, 5)).pit, 600), 'second pit filled');
    const g = thing(HW, 'drGust');
    until(HW, () => !g.on, 300);
    go(HW, 'draught', 3, 5); HW.face('left'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.keys('belfry'), 1, 'the key');
    noErrors(HW);
});

test('windward: left alone the crate never makes it home between gusts; rung home in a lull, the gate opens', () => {
    const HW = game();
    enter(HW, 'windward', 1, 4);
    const c = thing(HW, 'wwCrate'), g = thing(HW, 'wwGust'), gate = thing(HW, 'wwGate');
    /* waiting by the gate for the crate to come home by itself: the wind never lets it, over many gusts */
    go(HW, 'windward', 15, 5);
    let open = 0;
    for (let i = 0; i < 2400; i++) { if (gate.open) open++; HW.hold('right'); HW.step(1); }
    HW.release();
    assert.equal(open, 0, 'the gate never opens by itself');
    assert.ok(HW.player().tx < at('windward', 16, 5)[0], 'and nobody slips through');
    go(HW, 'windward', 11, 3);
    until(HW, () => g.on, 600); until(HW, () => !g.on, 600);
    strike(HW, 'up');
    assert.ok(until(HW, () => HW.Return.isHome(c), 80), 'snapped home');
    go(HW, 'windward', 17, 5);
    HW.face('right'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.plans.includes('belfry'), 'the plan');
    noErrors(HW);
});

test('weathercock walk: hold on to the busts while it blows', () => {
    const HW = game();
    enter(HW, 'weather', 18, 5);
    const g = thing(HW, 'wcGust');
    for (const x of [13, 9, 5]) {
        until(HW, () => !g.on, 400);
        go(HW, 'weather', x, 5);
        HW.face('up'); HW.hold(['act']);
        until(HW, () => g.on, 400); until(HW, () => !g.on, 400);
        HW.release(); HW.step(2);
        assert.equal(HW.player().ty, at('weather', x, 5)[1], 'still on the walk');
    }
    go(HW, 'weather', 2, 5); HW.face('left'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.keys('belfry'), 1, 'the key');
    noErrors(HW);
});

test('weathercock walk: caught in the open, the gust blows Wren off into the pits and home', () => {
    const HW = game();
    enter(HW, 'weather', 18, 5);
    const g = thing(HW, 'wcGust');
    until(HW, () => g.on, 400);
    HW.hold('left'); HW.step(120); HW.release();
    assert.ok(until(HW, () => HW.player().state === 'normal' && HW.player().tx >= at('weather', 17, 5)[0], 400), 'blown off and flew home');
});

test('the rafters: ring, and the sleeping slab of wall goes home (and the bats wake)', () => {
    const HW = game();
    enter(HW, 'rafters', 1, 5);
    go(HW, 'rafters', 13, 5); strike(HW, 'up');
    assert.ok(until(HW, () => HW.Return.isHome(thing(HW, 'raWall')), 120));
    assert.ok(HW.ents('enemy').some(e => e.type === 'bat' && e.mode === 'fly'), 'bats awake');
    HW.G.cheats.god = true;
    go(HW, 'rafters', 17, 1); HW.face('right'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.patches, 1);
});

test("clangor's ring: its reach drawn round it on the floor while it winds up; out of the ring, nothing (in it, a full heart)", () => {
    for (const dodge of [true, false]) {
        const HW = game();
        enter(HW, 'loft', 9, 8);
        const c = HW.ents('enemy').find(e => e.type === 'clangor');
        go(HW, 'loft', 9, 6);
        c.x = HW.player().x + 20; c.y = HW.player().y; c.st = 300;
        assert.ok(until(HW, () => c.state === 'windup', 10), 'it winds up');
        const ring = HW.G.map.ents.find(e => e.kind === 'hazard' && e.owner === c);
        assert.ok(ring && ring.covers(HW.player().x, HW.player().y), 'Wren inside the ring');
        const hp = HW.Inv.hp;
        if (dodge) { HW.hold('left'); HW.step(24); HW.release(); assert.ok(!ring.covers(HW.player().x, HW.player().y), 'out of it'); }
        assert.ok(until(HW, () => c.state === 'ring', 60), 'it rings');
        HW.step(2);
        if (dodge) assert.equal(HW.Inv.hp, hp, 'out of reach');
        else assert.equal(HW.Inv.hp, hp - 2, 'rung off her feet');
        noErrors(HW);
    }
});
test("clangor: the stick bounces off; a bust out of place snaps home through it when it rings (two knocks)", () => {
    const HW = game();
    HW.G.cheats.god = true;
    enter(HW, 'loft', 9, 8);
    const c = HW.ents('enemy').find(e => e.type === 'clangor');
    assert.ok(c && c.state !== 'sleep', 'awake');
    let knocks = 0;
    for (let round = 0; round < 3 && c.alive; round++, knocks++) {
        const b = thing(HW, 'clB1');
        until(HW, () => HW.Return.isHome(b), 600);
        c.state = 'ring'; c.st = -100000; c.x = at('loft', 16, 8)[0] * 16 + 8; c.y = at('loft', 16, 8)[1] * 16 + 10;   /* (held still while the test sets up) */
        go(HW, 'loft', 3, 3); HW.push('right', 3);           // bust (4,3) -> (7,3)
        assert.equal(b.tx, at('loft', 7, 3)[0], 'bust pushed out');
        go(HW, 'loft', 7, 6);
        /* (a person lures it there; the test puts it on the bust's way home) */
        c.x = at('loft', 5, 3)[0] * 16 + 8; c.y = at('loft', 5, 3)[1] * 16 + 10; c.state = 'windup'; c.st = 39; c.kx = c.ky = 0;
        assert.ok(until(HW, () => c.state === 'stunned', 120), 'slammed by the bust');
        HW.step(30);                              /* it skids to a stop */
        const p = HW.player(); p.x = c.x + 16; p.y = c.y; HW.face('left'); HW.press('atk', 1); HW.step(30);
    }
    assert.ok(!c.alive, 'down');
    assert.equal(knocks, 2, 'two knocks, not three');
    HW.step(100); HW.skipTalk();
    go(HW, 'loft', 9, 7); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.has('bell'), 'the Recall Bell');
    noErrors(HW);
});

test('the reach: ring close to the far sleeper only; it goes home onto the plate and the gate opens', () => {
    const HW = game(['bell']);
    enter(HW, 'reach', 18, 5);
    go(HW, 'reach', 16, 1); ring(HW);
    assert.ok(until(HW, () => HW.Return.isHome(thing(HW, 'reS1')), 120), 'S1 home');
    assert.ok(thing(HW, 'reS2').tiedOff, 'S2 still asleep');
    HW.step(5);
    assert.ok(thing(HW, 'reGate').open, 'gate open');
    go(HW, 'reach', 2, 8); HW.face('left'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.keys('belfry'), 1);
    noErrors(HW);
});

test('the reach: ring where both hear, and the near one shuts the gate again', () => {
    const HW = game(['bell']);
    enter(HW, 'reach', 18, 5);
    go(HW, 'reach', 17, 5); ring(HW);
    HW.step(120);
    assert.ok(!thing(HW, 'reS2').tiedOff, 'both woke');
    assert.equal(thing(HW, 'reGate').open, false);
});

test('echo room (S15): the stones rung low, high, middle, high, low', () => {
    const HW = game();
    enter(HW, 'echo', 1, 5);
    const order = [['esLow', 5], ['esHigh', 13], ['esMid', 9], ['esHigh', 13], ['esLow', 5]];
    for (const [id, x] of order) { go(HW, 'echo', x, 5); strike(HW, 'up'); HW.step(25); }
    assert.ok(HW.Progress.flag('belfry_echo'), 'sung');
    HW.step(30);
    go(HW, 'echo', 9, 3); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.patches, 1);
    noErrors(HW);
});

test('bell ropes: pick up the right-hand crate (holding it) and ring; the sleeper comes home to the left plate (Pattern)', () => {
    const HW = game(['bell']);
    enter(HW, 'ropes', 9, 9);
    HW.Inv.equipped = 'bell';
    go(HW, 'ropes', 16, 3); HW.face('right'); HW.press('act', 1); HW.step(10);
    assert.ok(HW.player().carry, 'holding it');
    go(HW, 'ropes', 14, 3);
    HW.press('tool', 1); HW.step(80);
    assert.ok(HW.Progress.flag('belfry_ropes'), 'left pressed, right not');
    HW.face('right'); HW.press('act', 1); HW.step(30);
    go(HW, 'ropes', 9, 8); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.hasPattern('belfry'));
    noErrors(HW);
});

test('bell ropes: ringing without holding just brings both crates home', () => {
    const HW = game(['bell']);
    enter(HW, 'ropes', 9, 9);
    go(HW, 'ropes', 16, 3); HW.face('right'); HW.press('act', 1); HW.step(10);
    go(HW, 'ropes', 10, 5); HW.face('down'); HW.press('act', 1); HW.step(30);   /* set it down out in the room */
    go(HW, 'ropes', 4, 8);                                       /* out of everything's way home */
    ring(HW); HW.step(100);
    assert.equal(HW.Progress.flag('belfry_ropes'), false);
});

test('the workshop (signature), behind the sleeping wall', () => {
    const HW = game(['bell']);
    enter(HW, 'ropes', 9, 9);
    go(HW, 'ropes', 2, 5); ring(HW); HW.step(30);
    go(HW, 'workshop', 17, 5);
    go(HW, 'workshop', 9, 6); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Progress.flag('sig:belfry'));
    noErrors(HW);
});

/* ---------------- the Great Bell: Tollgrim in three beats ---------------- */
/* into the hall the way the House goes: through the big door from the Cistern */
function bellGame() {
    const HW = game(['bell']);
    HW.Inv.patterns.push('belfry');
    HW.G.cheats.god = true;
    HW.warp('belfry', ...at('cistern', 1, 5)); HW.step(20);
    HW.hold('left'); HW.step(50); HW.release(); HW.step(20);
    HW.walkTo(...at('bell', 17, 5)); HW.step(30); HW.skipTalk(); HW.step(5);
    return HW;
}
const toll = HW => HW.G.map.find('tollgrim');
/* walk up beside him where he lies dazed and strike */
function strikeToll(HW) {
    const t = toll(HW), hp = t.hp;
    go(HW, 'bell', t.tx - R.bell[0] - 1, t.ty - R.bell[1]); HW.face('right');
    /* (two knocks: between them he flails about) */
    for (let k = 0; k < 6 && t.alive && t.hp === hp; k++) { HW.press('atk', 1); HW.step(18); }
    HW.step(12);
    assert.equal(t.hp, hp - 1, 'struck while he was dazed');
    HW.skipTalk(); HW.step(5);
}
/* 1: the draught blows the clapper out; he leans out; ring from anywhere it reaches: it slams home into him */
function beat1(HW) {
    const t = toll(HW);
    go(HW, 'bell', 6, 7);
    assert.ok(until(HW, () => t.state === 'peek', 900), 'he leans out');
    assert.equal(thing(HW, 'clapper').tx, at('bell', 9, 0)[0], 'the draught blew the clapper straight down out of the mouth');
    ring(HW);
    assert.ok(until(HW, () => t.state === 'stunned', 60), 'slammed by the clapper');
    strikeToll(HW);
    assert.equal(t.phase, 2);
}
/* 2: the wind turned; ring for the clapper from beyond his hearing (the west wall, by the clapper) */
function beat2(HW) {
    const t = toll(HW);
    go(HW, 'bell', 1, 6);
    assert.ok(until(HW, () => t.state === 'peek', 900), 'he leans out');
    ring(HW);
    assert.ok(until(HW, () => t.state === 'stunned', 60), 'slammed: he never heard it');
    strikeToll(HW);
    assert.equal(t.phase, 3);
}
test('the great bell, beat 1: the draught down through the bell blows the clapper out; Tollgrim leans out; ring, and it slams home into him', () => {
    const HW = bellGame();
    const t = toll(HW);
    assert.ok(t && t.state !== 'sleep' && t.phase === 1, 'awake');
    assert.ok(thing(HW, 'gbGale').off, 'no gale yet');
    /* the stick only clangs off him while he leans out */
    go(HW, 'bell', 8, 4);
    assert.ok(until(HW, () => t.state === 'peek', 900));
    HW.face('right'); HW.press('atk', 1); HW.step(20);
    assert.equal(t.hp, 3, 'stone: it clangs');
    beat1(HW);
    noErrors(HW);
});
test('the great bell, beat 2: the wind turns (the shutters open, the vanes swing, the clapper lies by the west wall); a ring he can hear and he ducks before it is home', () => {
    const HW = bellGame();
    beat1(HW);
    const t = toll(HW), clap = thing(HW, 'clapper');
    assert.ok(thing(HW, 'gbGust').off && !thing(HW, 'gbGale').off, 'the gale along under the bell now');
    const hall = HW.G.map.roomAt(t.hx, t.hy);
    assert.ok(HW.ents('vane').filter(v => HW.G.map.roomAt(v.tx, v.ty) === hall).every(v => v.gust === 'gbGale'), "the hall's vanes swing round");
    assert.ok(HW.ents('vane').filter(v => HW.G.map.roomAt(v.tx, v.ty) !== hall).every(v => v.gust !== 'gbGale'), "(and nobody else's)");
    assert.ok(until(HW, () => t.state === 'peek', 900), 'he leans out');
    assert.deepEqual([clap.tx, clap.ty], at('bell', 1, 4), 'the gale laid the clapper against the west wall');
    /* rung from beside the bell, as before: he hears it and is back inside before it's home */
    go(HW, 'bell', 6, 7);
    assert.ok(until(HW, () => t.state === 'peek', 900));
    ring(HW);
    assert.equal(t.state, 'hide', 'ducked at the first note');
    HW.step(60);
    assert.notEqual(t.state, 'stunned', 'the clapper came home to an empty mouth');
    assert.equal(t.hp, 2);
    HW.skipTalk();
    beat2(HW);
    noErrors(HW);
});
test('the great bell, beat 2: the old bell in the west bay, struck, is out of his hearing and in reach of the clapper', () => {
    const HW = bellGame();
    beat1(HW);
    const t = toll(HW);
    go(HW, 'bell', 2, 9);
    assert.ok(until(HW, () => t.state === 'peek', 900));
    HW.face('up'); HW.press('atk', 1);
    assert.ok(until(HW, () => t.state === 'stunned', 60), 'slammed');
    noErrors(HW);
});
test('the great bell, beat 3: he watches Wren, and while she is in reach of the clapper he keeps his head in; a pot carried under the old bell and smashed far off rings it from afar', () => {
    const HW = bellGame();
    beat1(HW); beat2(HW);
    const t = toll(HW), clap = thing(HW, 'clapper');
    HW.step(120);
    /* near the clapper, nothing brings him out: not the old bell struck, nor the Recall Bell */
    go(HW, 'bell', 2, 9);
    let out = false;
    for (let i = 0; i < 300; i++) { HW.step(1); if (t.state === 'peek') out = true; }
    assert.ok(!out, 'never leans out while she is by the clapper');
    HW.face('up'); HW.press('atk', 1); HW.step(30); ring(HW); HW.step(60);
    assert.equal(t.hp, 1, 'nothing to slam');
    /* and if she walks into reach of the clapper while he is out, he ducks */
    go(HW, 'bell', 12, 8);
    assert.ok(until(HW, () => t.state === 'peek', 900), 'out once she is far off');
    go(HW, 'bell', 4, 6);
    assert.equal(t.state, 'hide', 'back in as she comes near');
    /* a pot thrown at the old bell from as far as a throw reaches: he is in */
    go(HW, 'bell', 1, 8); HW.face('down'); HW.press('act', 1); HW.step(10);
    assert.ok(HW.player().carry, 'a pot');
    go(HW, 'bell', 6, 8); HW.face('left'); HW.press('act', 1); HW.step(120);
    assert.equal(t.hp, 1, 'the throw rang it, but he was in');
    /* the pot, carried under the old bell and off to the far side, smashed: its pieces fly home under the bell and ring it */
    until(HW, () => HW.Return.isHome(thing(HW, 'gbPot1')), 300);
    go(HW, 'bell', 1, 8); HW.face('down'); HW.press('act', 1); HW.step(10);
    go(HW, 'bell', 2, 8); go(HW, 'bell', 10, 8);
    assert.ok(until(HW, () => t.state === 'peek' && HW.Return.away(clap), 900), 'he leans out');
    HW.face('right'); HW.press('act', 1);
    assert.ok(until(HW, () => t.state === 'stunned', 200), 'slammed by a ring from afar');
    strikeToll(HW);
    assert.ok(!t.alive, 'down');
    HW.step(100); HW.skipTalk();
    assert.ok(HW.ents('hoop')[0], 'the hoop');
    assert.ok(thing(HW, 'gbGust').off && thing(HW, 'gbGale').off, 'the hall falls still');
    assert.ok(HW.Stats.c['boss:tollgrim:toll'] >= 1, 'he pounded the bell (its blows landed but, here, did not hurt)');
    noErrors(HW);
});
/* his blows, each with its tell, each dodged (or not): the beats reached with them harmless, then real */
const hz = (HW, o) => HW.G.map.ents.filter(e => e.kind === 'hazard' && e.owner === o);
const freeTile = (HW, bad, near) => {
    let best = null;
    for (let y = 4; y <= 9; y++) for (let x = 1; x <= 18; x++) {
        const [tx, ty] = at('bell', x, y), k = HW.G.map.kind(tx, ty);
        if (k.solid || HW.G.map.at(tx, ty) || bad(tx, ty)) continue;
        const d = Math.abs(tx - near.tx) + Math.abs(ty - near.ty);
        if (!best || d < best[2]) best = [tx, ty, d];
    }
    return best;
};
test("Tollgrim's spit: leaning out, his cheeks puff (the gravel aglow in his mouth); a step aside as it comes and it flies past", () => {
    for (const dodge of [true, false]) {
        const HW = bellGame(); HW.G.cheats.god = false;
        const t = toll(HW);
        go(HW, 'bell', 4, 8);
        assert.ok(until(HW, () => t.puff > 0, 900), 'his cheeks puff');
        const hp = HW.Inv.hp;
        assert.ok(until(HW, () => t.spits.length > 0, 60), 'he spits');
        if (dodge) { HW.hold('down'); HW.step(8); HW.hold('right'); HW.step(50); HW.release(); }
        else HW.step(60);
        if (dodge) assert.equal(HW.Inv.hp, hp, 'flew past');
        else assert.ok(HW.Inv.hp < hp, 'hit');
        noErrors(HW);
    }
});
test('Tollgrim pounds the bell (beat 2 on): mortar shakes down from the rafters, its shadows first; out from under them (a full heart if not)', () => {
    for (const dodge of [true, false]) {
        const HW = bellGame();
        beat1(HW); HW.G.cheats.god = false;
        const t = toll(HW);
        go(HW, 'bell', 14, 7);
        assert.ok(until(HW, () => hz(HW, t).length >= 4, 900), 'shadows on the floor');
        const sh = hz(HW, t), p = HW.player();
        let hp = HW.Inv.hp;
        assert.ok(sh.every(h => h.tell >= 30), 'a fair tell');
        if (dodge) {
            const spot = freeTile(HW, (x, y) => sh.some(h => h.covers(x * 16 + 8, y * 16 + 10) || Math.hypot(h.x - (x * 16 + 8), h.y - (y * 16 + 10)) < 20), p);
            assert.ok(HW.walkTo(spot[0], spot[1]), 'out from under every shadow');
        } else {
            t.spits = []; t.duck(); t.st = -100000;      /* (held in the bell: nothing else comes at her just then) */
            const h = sh.slice().sort((m, n) => Math.hypot(m.x - p.x, m.y - p.y) - Math.hypot(n.x - p.x, n.y - p.y))[0];
            assert.ok(HW.walkTo(Math.floor(h.x / 16), Math.floor(h.y / 16)), 'under a shadow');
            p.inv = 0; hp = HW.Inv.hp;
        }
        assert.ok(until(HW, () => hz(HW, t).every(h => h.landed), 100)); HW.step(4);
        if (dodge) assert.equal(HW.Inv.hp, hp, 'all of it missed');
        else assert.equal(HW.Inv.hp, hp - 2, 'a lump of mortar');
        noErrors(HW);
    }
});
test("Tollgrim's lunge (beat 3): up close under the bell's mouth, his red eyes flare and the floor there lights; back off it and he snaps at the air", () => {
    for (const dodge of [true, false]) {
        const HW = bellGame();
        beat1(HW); beat2(HW); HW.G.cheats.god = false;
        const t = toll(HW);
        HW.step(60); HW.skipTalk();
        go(HW, 'bell', 9, 5);
        assert.ok(until(HW, () => t.state === 'pounce', 300), 'his eyes flare');
        const z = hz(HW, t).find(h => h.dmg === 2 && h.shape === 'tiles');
        assert.ok(z && z.covers(HW.player().x, HW.player().y), 'the floor under the mouth lit, Wren on it');
        const hp = HW.Inv.hp;
        if (dodge) { HW.hold('down'); HW.step(20); HW.release(); }
        assert.ok(until(HW, () => t.state === 'hide', 100), 'back in');
        if (dodge) assert.equal(HW.Inv.hp, hp, 'backed off: missed');
        else assert.ok(HW.Inv.hp <= hp - 2, 'caught: a full heart');
        noErrors(HW);
    }
});
test('the great bell, beat 1: a ring he hears does not make him duck yet (he learns that after)', () => {
    const HW = bellGame();
    const t = toll(HW);
    go(HW, 'bell', 7, 6);
    assert.ok(until(HW, () => t.state === 'peek', 900));
    ring(HW);
    assert.ok(until(HW, () => t.state === 'stunned', 60), 'slammed though he was right by her');
});

/* ---------------- the Bell Frame: the boulder home first, the crate behind it ---------------- */
function frameGame() {
    const HW = game(['bell']);
    HW.Progress.set('belfry_ropes');     /* (the way in from Bell Ropes is open) */
    HW.warp('belfry', ...at('frame', 1, 5)); HW.step(20);
    return HW;
}
const liftCrate = HW => { go(HW, 'frame', 9, 9); HW.face('up'); HW.press('act', 1); HW.step(10); assert.ok(HW.player().carry, 'the crate'); };
const frameIs = (HW, id, x, y) => { const o = thing(HW, id); return o.tx === at('frame', x, y)[0] && o.ty === at('frame', x, y)[1]; };
test('the bell frame: the crate the long way round and down through the boulder\'s empty place onto the plate; ring: the boulder is home first and holds it there', () => {
    const HW = frameGame();
    liftCrate(HW);
    go(HW, 'frame', 12, 9); go(HW, 'frame', 12, 4); go(HW, 'frame', 5, 3);
    HW.face('down'); HW.press('act', 1); HW.step(40);
    assert.ok(frameIs(HW, 'fbCrate', 5, 7), 'thrown down the gap onto the plate');
    ring(HW); HW.step(60);
    assert.ok(HW.Return.isHome(thing(HW, 'fbRock')), 'the boulder woke and went home');
    HW.step(600);
    assert.ok(frameIs(HW, 'fbCrate', 5, 7), 'the crate waits on the plate behind it');
    assert.ok(thing(HW, 'fbGate').open, 'the gate');
    go(HW, 'frame', 14, 1); HW.hold('up'); HW.step(70); HW.release(); HW.step(10);
    assert.equal(HW.G.map.roomAt(HW.player().tx, HW.player().ty).name, 'The Cistern');
    assert.ok(HW.Progress.flag('belfry_frame'), 'the boulder stays awake now');
    noErrors(HW);
});
test('the bell frame: or thrown from the gap\'s mouth, it lands below; the ring brings it back up onto the plate', () => {
    const HW = frameGame();
    liftCrate(HW);
    go(HW, 'frame', 12, 9); go(HW, 'frame', 12, 4); go(HW, 'frame', 5, 5);
    HW.face('down'); HW.press('act', 1); HW.step(40);
    assert.ok(frameIs(HW, 'fbCrate', 5, 9), 'below the gap');
    ring(HW); HW.step(80);
    assert.ok(frameIs(HW, 'fbCrate', 5, 7) && thing(HW, 'fbGate').open, 'stopped on the plate');
    assert.ok(!frameIs(HW, 'fbRock', 4, 5) && HW.player().ty === at('frame', 0, 5)[1], 'Wren, in the way, was shoved aside');
    noErrors(HW);
});
test('the bell frame: carried up the gap and thrown back down, the thread undoes itself and the crate goes home', () => {
    const HW = frameGame();
    liftCrate(HW);
    go(HW, 'frame', 5, 9); go(HW, 'frame', 5, 3);
    HW.face('down'); HW.press('act', 1); HW.step(40);
    ring(HW); HW.step(400);
    assert.ok(HW.Return.isHome(thing(HW, 'fbCrate')) && !thing(HW, 'fbGate').open, 'home, gate shut');
    noErrors(HW);
});
test('the bell frame: rung first, the crate thrown up onto the plate from below lands there, then goes home long before Wren is at the gate', () => {
    const HW = frameGame();
    go(HW, 'frame', 5, 3); ring(HW); HW.step(30);
    liftCrate(HW);
    go(HW, 'frame', 5, 8); HW.face('up'); HW.press('act', 1); HW.step(20);
    assert.ok(frameIs(HW, 'fbCrate', 5, 7) && thing(HW, 'fbGate').open, 'on the plate a moment');
    go(HW, 'frame', 5, 9); go(HW, 'frame', 12, 9); go(HW, 'frame', 14, 1);
    assert.ok(!thing(HW, 'fbGate').open, 'shut again by the time she gets there');
    /* and leaving the room, the boulder lies down again for another go */
    go(HW, 'frame', 1, 5); go(HW, 'ropes', 17, 5); HW.step(10); go(HW, 'frame', 1, 5); HW.step(10);
    assert.ok(thing(HW, 'fbRock').tiedOff, 'asleep again');
    noErrors(HW);
});
test('the bell frame: rung while standing in the gap, Wren is shoved down onto the plate under the crate coming home: she can lift it and go', () => {
    const HW = frameGame();
    liftCrate(HW);
    go(HW, 'frame', 12, 9); go(HW, 'frame', 12, 4); go(HW, 'frame', 5, 5);
    HW.face('down'); HW.press('act', 1); HW.step(40);
    go(HW, 'frame', 5, 6); ring(HW); HW.step(120);
    const p = HW.player();
    assert.equal(`${p.tx},${p.ty}`, at('frame', 5, 7).join(','), 'shoved onto the plate');
    assert.ok(frameIs(HW, 'fbCrate', 5, 8), 'the crate waits below her (never on top of her)');
    HW.face('down'); HW.press('act', 1); HW.step(10);
    assert.ok(p.carry, 'lifted it');
    go(HW, 'frame', 5, 9);
    noErrors(HW);
});

/* ---------------- the Cistern: ride the raft home across the shaft ---------------- */
function cisternGame() {
    const HW = game(['bell']);
    HW.warp('belfry', ...at('cistern', 14, 9)); HW.step(20);
    return HW;
}
function hookRaft(HW) {
    const raft = thing(HW, 'csRaft');
    go(HW, 'cistern', 11, 1); HW.Inv.equipped = 'hook'; HW.face('left'); HW.press('tool', 1);
    assert.ok(until(HW, () => raft.tx >= at('cistern', 9, 0)[0], 120), 'hooked over the shaft');
    assert.ok(until(HW, () => !raft.mv && raft.ty === at('cistern', 0, 7)[1], 600), 'the gale blows it down the pool');
    assert.equal(raft.tx, at('cistern', 10, 0)[0], 'still in the pool');
    go(HW, 'cistern', 11, 7); HW.hold('left'); HW.step(12); HW.release(); HW.step(2);
    assert.equal(`${HW.player().tx},${HW.player().ty}`, at('cistern', 10, 7).join(','), 'aboard');
    return raft;
}
test('the cistern: hook the raft over the shaft, step aboard where the gale leaves it, ring: it snaps home across with Wren aboard; the drawbridge; the big door', () => {
    const HW = cisternGame();
    const raft = hookRaft(HW), p = HW.player();
    ring(HW);
    assert.ok(until(HW, () => HW.Return.isHome(raft), 120), 'home');
    assert.equal(`${p.tx},${p.ty}`, at('cistern', 5, 1).join(','), 'carried across');
    HW.hold('left'); HW.step(14); HW.release(); HW.step(4);
    assert.equal(`${p.tx},${p.ty}`, at('cistern', 4, 1).join(','), 'on the far side');
    assert.equal(HW.Inv.hp, 40, 'not a scratch');
    /* the lever lets the drawbridge down: the way back */
    go(HW, 'cistern', 2, 8); HW.face('down'); HW.press('act', 1); HW.step(20);
    go(HW, 'cistern', 12, 9);
    go(HW, 'cistern', 1, 5);
    HW.hold('left'); HW.step(40); HW.release();
    assert.equal(HW.player().tx, at('cistern', 1, 0)[0], 'the big door wants the Pattern');
    HW.Inv.patterns.push('belfry');
    HW.hold('left'); HW.step(60); HW.release(); HW.step(10);
    assert.equal(HW.G.map.roomAt(HW.player().tx, HW.player().ty).name, 'The Great Bell');
    noErrors(HW);
});
test('the cistern: aboard, waiting, the gale never lets the raft go home; paddled to the edge of the shaft and let go, it is caught again', () => {
    const HW = cisternGame();
    const raft = hookRaft(HW), p = HW.player();
    let crossed = false;
    for (let i = 0; i < 2400; i++) { HW.step(1); if (raft.tx < at('cistern', 9, 0)[0]) crossed = true; }
    assert.ok(!crossed && p.tx === raft.tx, 'still in the pool, Wren aboard');
    HW.Inv.equipped = 'paddle';
    for (let i = 0; i < 600 && (p.tx !== at('cistern', 9, 0)[0] || p.ty !== 1); i++) { HW.hold(['tool', p.ty > 1 ? 'up' : 'left']); HW.step(1); }
    HW.release(); HW.step(2);
    assert.equal(`${p.tx},${p.ty}`, at('cistern', 9, 1).join(','), 'at the shaft\'s edge');
    for (let i = 0; i < 2400; i++) { HW.step(1); if (raft.tx < at('cistern', 9, 0)[0]) crossed = true; }
    assert.ok(!crossed, 'never crossed by itself');
    noErrors(HW);
});
test("the cistern: the raft's empty mark hooked from the bank: down in the water, and home along the thread", () => {
    const HW = cisternGame();
    const raft = thing(HW, 'csRaft');
    go(HW, 'cistern', 11, 1); HW.Inv.equipped = 'hook'; HW.face('left'); HW.press('tool', 1);
    assert.ok(until(HW, () => raft.ty >= 3, 600), 'the gale took it off the hook row');
    const hp = HW.Inv.hp;
    HW.face('left'); HW.press('tool', 1); HW.step(200);
    assert.equal(HW.Inv.hp, hp - 1, 'a ducking');
    assert.ok(HW.player().tx > at('cistern', 10, 0)[0], 'back on the near side');
    noErrors(HW);
});
test('the way up: the east gate in Bell Ropes opens with its Pattern; the bell stair is barred from above until Tollgrim is beaten, and then everything up there is open', () => {
    const HW = game(['bell']);
    enter(HW, 'ropes', 17, 5);
    assert.equal(thing(HW, 'brEast').open, false, 'shut');
    assert.equal(thing(HW, 'brStair').open, false, 'barred');
    HW.Progress.set('belfry_ropes'); HW.step(5);
    assert.ok(thing(HW, 'brEast').open, 'open with the Pattern');
    go(HW, 'frame', 3, 5);
    /* after Tollgrim: the stair, the Bell Frame's gate and the drawbridge (a game that beat him before these rooms were built
       walks home from the hall either way) */
    HW.Progress.set('belfry_boss'); HW.Progress.setAreaFlag('belfry', 'door:brBig');
    HW.warp('belfry', ...at('bell', 9, 9)); HW.step(20);
    assert.ok(thing(HW, 'brStair').open, 'the stair down');
    go(HW, 'ropes', 9, 5);
    HW.warp('belfry', ...at('bell', 17, 5)); HW.step(20);
    go(HW, 'cistern', 2, 5); go(HW, 'cistern', 14, 9); go(HW, 'frame', 14, 2); go(HW, 'frame', 1, 5);
    noErrors(HW);
});
test('old saves: a game that had opened the big door (it was in Bell Ropes) finds the big door open at the top of the Cistern', () => {
    const HW = game(['bell']);
    HW.Progress.setAreaFlag('belfry', 'door:brBig');
    HW.warp('belfry', ...at('cistern', 2, 5)); HW.step(20);
    assert.ok(thing(HW, 'brBig').open);
    noErrors(HW);
});
test('saving and loading: the drawbridge stays down; a game saved mid-fight starts the fight over from the hall\'s doorway', () => {
    const HW = cisternGame();
    const raft = hookRaft(HW);
    ring(HW); until(HW, () => HW.Return.isHome(raft), 120);
    HW.hold('left'); HW.step(14); HW.release(); HW.step(4);
    go(HW, 'cistern', 2, 8); HW.face('down'); HW.press('act', 1); HW.step(20);
    HW.Save.write(1); HW.Save.apply(HW.Save.read(1)); HW.step(20);
    go(HW, 'cistern', 4, 9); go(HW, 'cistern', 12, 9);
    /* and in the hall, a beat into the fight */
    HW.Inv.patterns.push('belfry');
    go(HW, 'cistern', 1, 5); HW.hold('left'); HW.step(60); HW.release(); HW.step(20);
    HW.walkTo(...at('bell', 17, 5)); HW.step(30); HW.skipTalk();
    HW.Save.write(1); HW.Save.apply(HW.Save.read(1)); HW.step(30); HW.skipTalk(); HW.step(5);
    const t = toll(HW);
    assert.ok(t && t.alive && t.hp === 3 && t.state !== 'sleep', 'the fight from its first beat');
    assert.equal(HW.G.map.roomAt(HW.player().tx, HW.player().ty).name, 'The Great Bell');
    noErrors(HW);
});
test('the Bell Frame and the Cistern nudge after a long while stuck, and not once they are solved', () => {
    for (const [room, x, y, solve] of [['frame', 1, 5, H => H.Progress.setAreaFlag('belfry', 'door:fbGate')], ['cistern', 14, 9, H => H.Progress.setAreaFlag('belfry', 'cs:over')]]) {
        for (const solved of [false, true]) {
            const HW = game(['bell']);
            HW.Progress.set('belfry_ropes'); HW.Progress.set('hintsAsked'); HW.global('Settings').hints = true;
            if (solved) solve(HW);
            HW.warp('belfry', ...at(room, x, y)); HW.step(10);
            const r = HW.Cam.room;
            assert.ok(r.nudge, room + ' has a nudge');
            HW.Stats.rooms['belfry:' + r.i].t = r.nudge.after; HW.step(5);
            assert.equal(!!HW.Progress.areaFlag('belfry', 'nudged:' + r.key), !solved, `${room}: ${solved ? 'no nudge once solved' : 'nudged'}`);
            noErrors(HW);
        }
    }
});
