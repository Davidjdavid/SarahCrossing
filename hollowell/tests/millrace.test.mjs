// The Millrace (House 3): every room's solution, played through the real game code.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const R = { wheel: [20, 33], ferry: [0, 33], backwash: [40, 33], carousel: [20, 22], shard: [0, 22], snap: [40, 22], upstream: [20, 11], overflow: [0, 11], twowheels: [40, 11], workshop: [0, 0], pond: [20, 0] };
const at = (room, x, y) => [R[room][0] + x, R[room][1] + y];
function game(tools = []) {
    const HW = loadGame();
    HW.newGame('Test', { area: 'millrace', x: 29, y: 42, noAutosave: true });
    HW.Inv.items.staff = 1;
    for (const t of ['gloves', 'hook', ...tools]) HW.Inv.giveTool(t);
    HW.Inv.maxHp = HW.Inv.hp = 40;
    HW.step(5);
    return HW;
}
const go = (HW, room, x, y) => assert.ok(HW.walkTo(...at(room, x, y)), `walk to ${room} ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const thing = (HW, id) => HW.G.map.find(id);      /* (a warp builds the area afresh: look things up after it) */
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const isAt = (o, room, x, y) => { const [tx, ty] = at(room, x, y); return o.tx === tx && o.ty === ty && !o.mv; };
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
/* wait for a raft to sit at a spot, then step onto it */
function board(HW, raft, room, x, y, dir, max = 1500) {
    assert.ok(until(HW, () => isAt(raft, room, x, y), max), `raft at ${room} ${x},${y} (it's at ${raft.tx},${raft.ty})`);
    HW.hold(dir); HW.step(10); HW.release(); HW.step(1);
    const [tx, ty] = at(room, x, y);
    assert.equal(`${HW.player().tx},${HW.player().ty}`, `${tx},${ty}`, 'aboard');
}
function stepOff(HW, dir) { HW.hold(dir); HW.step(14); HW.release(); HW.step(2); }

test('wheel hall: the crate floats past the wheel and the gate opens a while', () => {
    const HW = game();
    go(HW, 'wheel', 3, 4); HW.push('up', 1);
    assert.ok(until(HW, () => thing(HW, 'whGate').open, 500), 'gate open as the crate passes the wheel');
    go(HW, 'wheel', 9, 1); HW.step(5); go(HW, 'carousel', 9, 9);
    HW.step(600);
    assert.ok(thing(HW, 'whGate').open, 'stays open once you went through');
    noErrors(HW);
});

test('ferry pool: ride out to the island for the key; the ferry comes back for you', () => {
    const HW = game();
    const f = thing(HW, 'fpFerry');
    go(HW, 'ferry', 17, 6);
    board(HW, f, 'ferry', 16, 6, 'left');
    assert.ok(until(HW, () => isAt(f, 'ferry', 6, 3), 800), 'out at the island');
    stepOff(HW, 'left');
    go(HW, 'ferry', 4, 3); HW.face('left'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.keys('mill'), 1, 'the key');
    go(HW, 'ferry', 5, 3);
    board(HW, f, 'ferry', 6, 3, 'right', 2500);
    assert.ok(until(HW, () => isAt(f, 'ferry', 16, 6), 800), 'home');
    stepOff(HW, 'right');
    assert.equal(HW.player().tx, at('ferry', 17, 6)[0]);
    noErrors(HW);
});

test('backwash: hook the raft over, ride the current back to it, the plan; hop down the ledge', () => {
    const HW = game();
    const r = thing(HW, 'bwRaft');
    HW.Inv.equipped = 'hook';
    go(HW, 'backwash', 2, 4); HW.face('right'); HW.press('tool', 1);
    assert.ok(until(HW, () => isAt(r, 'backwash', 3, 4), 200), 'reeled over');
    stepOff(HW, 'right');
    assert.equal(HW.player().tx, at('backwash', 3, 4)[0], 'aboard');
    assert.ok(until(HW, () => isAt(r, 'backwash', 9, 4), 600), 'the current took it home');
    stepOff(HW, 'right');
    go(HW, 'backwash', 10, 3); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.plans.includes('mill'), 'the plan');
    go(HW, 'backwash', 11, 4); HW.hold('down'); HW.step(40); HW.release(); HW.step(20);
    assert.ok(HW.player().ty >= at('backwash', 11, 6)[1], 'down the ledge');
    noErrors(HW);
});

test('carousel: ride round the millstone to the west landing; unlock the Shard Race', () => {
    const HW = game();
    HW.Inv.keyCount.mill = 1;
    HW.warp('millrace', ...at('carousel', 9, 8)); HW.step(5);
    const r = thing(HW, 'caRaft');
    board(HW, r, 'carousel', 9, 7, 'up');
    assert.ok(until(HW, () => isAt(r, 'carousel', 5, 5), 600), 'at the west landing');
    stepOff(HW, 'left');
    assert.equal(HW.player().tx, at('carousel', 4, 5)[0]);
    HW.hold('left'); HW.step(60); HW.release(); HW.step(10);
    go(HW, 'shard', 18, 5);
    noErrors(HW);
});

test('carousel: it goes all the way round and stops at home again', () => {
    const HW = game();
    HW.warp('millrace', ...at('carousel', 9, 9)); HW.step(5);
    const r = thing(HW, 'caRaft');
    assert.ok(until(HW, () => r.ret.state !== 'home', 400), 'set off');
    assert.ok(until(HW, () => isAt(r, 'carousel', 14, 5), 900), 'past the east landing');
    assert.ok(until(HW, () => HW.Return.isHome(r), 900), 'home again');
});

test('shard race: carry a pot on the ride, smash it at the end: the pieces ring all three charms on the way back', () => {
    const HW = game();
    HW.warp('millrace', ...at('shard', 18, 5)); HW.step(5);
    const f = thing(HW, 'srFerry');
    HW.face('up'); HW.press('act', 1); HW.step(10);
    assert.ok(HW.player().carry, 'carrying a pot');
    go(HW, 'shard', 17, 5);
    board(HW, f, 'shard', 16, 5, 'left');
    assert.ok(until(HW, () => isAt(f, 'shard', 14, 2), 1500), 'at the far landing');
    stepOff(HW, 'right');
    HW.face('right'); HW.press('act', 1);
    assert.ok(until(HW, () => thing(HW, 'srGate').open, 300), 'all three rang at once');
    go(HW, 'shard', 17, 2); HW.face('right'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.keys('mill'), 1, 'the key');
    noErrors(HW);
});

test('shard race: smashing a pot on the dock rings nothing', () => {
    const HW = game();
    HW.warp('millrace', ...at('shard', 18, 5)); HW.step(5);
    HW.face('up'); HW.press('act', 1); HW.step(10);
    HW.face('left'); HW.press('act', 1);
    HW.step(200);
    assert.equal(thing(HW, 'srGate').open, false);
});

function snapGame() {
    const HW = game();
    HW.warp('millrace', ...at('snap', 1, 5)); HW.step(30); HW.skipTalk(); HW.step(5);
    return HW;
}
test("snapjaw: the stick bounces off; crates floated down onto it beat it, and the Paddle", () => {
    const HW = snapGame();
    const s = HW.ents('enemy').find(e => e.type === 'snapjaw');
    assert.ok(s && s.state === 'swim', 'awake');
    for (let round = 0; round < 12 && s.alive; round++) {
        const id = round % 2 ? 'sjCrate2' : 'sjCrate1', c = thing(HW, id);
        until(HW, () => HW.Return.isHome(c), 1500);
        const row = c.ty - R.snap[1];
        go(HW, 'snap', 10, row);
        /* launch it when the Snapjaw is below and coming up toward it */
        until(HW, () => s.state === 'swim' && s.ty > c.ty + 1 && s.vy < 0, 900);
        HW.face('right'); HW.push('right', 1);
        HW.step(200);
    }
    assert.ok(!s.alive, 'beaten');
    assert.ok(HW.Progress.flag('millrace_snapjaw'));
    HW.step(60); HW.skipTalk(); HW.step(10);
    go(HW, 'snap', 4, 6); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.has('paddle'), 'the Paddle');
    noErrors(HW);
});

test('upstream: paddle up the race against the current to the key; jump in to go home', () => {
    const HW = game(['paddle']);
    HW.Inv.equipped = 'paddle';
    HW.warp('millrace', ...at('upstream', 9, 9)); HW.step(5);
    const r = thing(HW, 'upRaft');
    board(HW, r, 'upstream', 9, 8, 'up');
    HW.hold(['tool', 'up']);
    assert.ok(until(HW, () => isAt(r, 'upstream', 9, 2), 600), 'paddled up');
    HW.release(); HW.step(1);
    stepOff(HW, 'up');
    HW.face('right'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.keys('mill'), 1, 'the key');
    HW.step(200);                                         /* the raft has drifted off home */
    HW.hold('down'); HW.step(70); HW.release();
    assert.ok(until(HW, () => HW.player().state === 'normal' && HW.player().ty >= at('upstream', 9, 8)[1], 400), 'leaned on the edge, stepped in, and flew home');
    noErrors(HW);
});

test('upstream: without the Paddle the raft just sits', () => {
    const HW = game();
    HW.warp('millrace', ...at('upstream', 9, 9)); HW.step(5);
    const r = thing(HW, 'upRaft');
    board(HW, r, 'upstream', 9, 8, 'up');
    HW.hold('up'); HW.step(200); HW.release();
    assert.ok(isAt(r, 'upstream', 9, 8));
});

test('overflow: two strays pushed into the race fill it in; across to the workshop (signature)', () => {
    const HW = game();
    HW.warp('millrace', ...at('overflow', 18, 5)); HW.step(5);
    go(HW, 'overflow', 13, 2); HW.push('left', 4);            // stray 1: (12,2) -> (9,2): fills it
    assert.ok(!HW.G.map.kind(...at('overflow', 9, 2)).water, 'one filled');
    go(HW, 'overflow', 14, 8); HW.push('up', 5);              // stray 2 up to (14,2)
    go(HW, 'overflow', 15, 2); HW.push('left', 6);            // ... and over the first into (8,2)
    assert.ok(!HW.G.map.kind(...at('overflow', 8, 2)).water, 'both filled');
    go(HW, 'overflow', 4, 1); HW.hold('up'); HW.step(40); HW.release(); HW.step(20);
    go(HW, 'workshop', 10, 6); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Progress.flag('sig:mill'), 'the signature');
    go(HW, 'workshop', 16, 8); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    noErrors(HW);
});

test('two wheels: ride to the first wheel and hold the raft there with the Paddle while the crate reaches the second (Pattern)', () => {
    const HW = game(['paddle']);
    HW.Inv.equipped = 'paddle';
    HW.warp('millrace', ...at('twowheels', 1, 3)); HW.step(5);
    const r = thing(HW, 'twRaft');
    go(HW, 'twowheels', 1, 2);
    board(HW, r, 'twowheels', 2, 2, 'right');
    assert.ok(until(HW, () => isAt(r, 'twowheels', 12, 2), 800), 'at the first wheel');
    HW.hold(['tool']);
    assert.ok(until(HW, () => HW.Progress.flag('millrace_twoWheels'), 600), 'both wheels turned together');
    HW.release(); HW.step(2);
    stepOff(HW, 'down');
    go(HW, 'twowheels', 7, 7); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.hasPattern('mill'), 'the Pattern');
    noErrors(HW);
});

test('two wheels: or grip the raft on the wheel from the bank with the Gloves', () => {
    const HW = game();
    HW.warp('millrace', ...at('twowheels', 12, 3)); HW.step(5);
    const r = thing(HW, 'twRaft');
    HW.face('up');
    assert.ok(until(HW, () => isAt(r, 'twowheels', 12, 2), 900));
    HW.hold(['act']);
    assert.ok(until(HW, () => HW.Progress.flag('millrace_twoWheels'), 600), 'held it there');
    HW.release();
});

test('two wheels: left alone, the raft heads home before the crate gets there', () => {
    const HW = game();
    HW.warp('millrace', ...at('twowheels', 5, 5)); HW.step(5);
    HW.step(1500);
    assert.equal(HW.Progress.flag('millrace_twoWheels'), false);
});

test('the millpond: Old Grindle gulps the barrels, settles, and the raft takes Wren up to its gear-heart (x3)', () => {
    const HW = game();                          /* (no Paddle: with it, holding on after a push steps you onto the barrel) */
    HW.Inv.patterns.push('mill');
    HW.G.cheats.god = true;                     /* (its spit is for dodging; this is about beating it) */
    HW.warp('millrace', ...at('pond', 9, 9)); HW.step(30); HW.skipTalk(); HW.step(5);
    const g = HW.G.map.find('grindle');
    assert.ok(g && g.state === 'home', 'awake');
    const r = thing(HW, 'gRaft');
    for (let round = 0; round < 3 && g.alive; round++) {
        until(HW, () => g.state === 'home', 600);
        until(HW, () => HW.Return.isHome(thing(HW, 'gbW')) && HW.Return.isHome(thing(HW, 'gbE')), 600);
        go(HW, 'pond', 2, 2); HW.push('down', 1);
        go(HW, 'pond', 17, 2); HW.push('down', 1);
        assert.ok(until(HW, () => g.state === 'full', 900), 'full');
        go(HW, 'pond', 9, 9);
        board(HW, r, 'pond', 9, 8, 'up', 1200);
        assert.ok(until(HW, () => isAt(r, 'pond', 9, 4), 400), 'up to its mouth');
        HW.face('up'); HW.press('atk', 1); HW.step(20);
        HW.step(60);
        HW.hold('down'); until(HW, () => HW.player().ty >= at('pond', 9, 9)[1] && HW.player().state === 'normal', 600); HW.release();
    }
    assert.ok(!g.alive, 'down');
    HW.step(100); HW.skipTalk();
    assert.ok(HW.Progress.flag('millrace_boss'));
    const hoop = HW.ents('hoop')[0];
    assert.ok(hoop, 'the hoop');
    noErrors(HW);
});

test('the millpond: on the raft at its mouth while it is hungry, it bites', () => {
    const HW = game(['paddle']);
    HW.warp('millrace', ...at('pond', 9, 9)); HW.step(30); HW.skipTalk(); HW.step(5);
    const r = thing(HW, 'gRaft');
    HW.G.cheats.god = true;
    board(HW, r, 'pond', 9, 8, 'up', 1200);
    HW.G.cheats.god = false;
    const hp = HW.Inv.hp;
    until(HW, () => HW.Inv.hp < hp, 600);
    assert.notEqual(HW.player().ride, r, 'knocked off into the water');
    assert.ok(HW.Inv.hp < hp, 'bitten');
});
