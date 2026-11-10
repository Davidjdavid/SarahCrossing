// The Millrace (House 3): every room's solution, played through the real game code.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const R = { wheel: [20, 33], ferry: [0, 33], backwash: [40, 33], carousel: [20, 22], shard: [0, 22], snap: [40, 22], upstream: [20, 11], overflow: [0, 11], twowheels: [40, 11], workshop: [0, 0], pond: [20, 0], lock: [40, 0], bells: [60, 0] };
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
    assert.equal(HW.Inv.patches, 1, 'a Heart Patch');
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
test('snapjaw: a crate sent down while it just swims, it ducks under and lets float past', () => {
    const HW = snapGame();
    const s = HW.ents('enemy').find(e => e.type === 'snapjaw');
    assert.ok(s && s.state === 'swim', 'awake');
    go(HW, 'snap', 10, 1); HW.face('right'); HW.push('right', 1);
    go(HW, 'snap', 6, 5);
    assert.ok(until(HW, () => s.state === 'duck', 400), 'it ducked');
    HW.step(300);
    assert.equal(s.hp, 2, 'untouched');
});
/* bait it up beside a crate on the bank, step back out of its reach, and push the crate down onto it while it hunts */
function snapRound(HW, s, crate, row) {
    until(HW, () => s.state === 'swim', 600);
    go(HW, 'snap', 11, row);
    assert.ok(until(HW, () => s.state === 'rear', 600), 'it rears up at Wren on the bank');
    go(HW, 'snap', 10, row);                                  /* back from the edge: the snap misses */
    const c = thing(HW, crate), hp0 = s.hp;
    go(HW, 'snap', 10, c.ty - R.snap[1]); HW.face('right'); HW.push('right', 1);
    assert.ok(until(HW, () => s.hp < hp0 || !s.alive, 300), 'the crate came down onto it while it hunted along the bank');
}
test('snapjaw: reared up, it hunts along the bank and forgets the water: a crate pushed down then hits it. Two knocks (Paddle)', () => {
    const HW = snapGame();
    HW.Inv.maxHp = HW.Inv.hp = 6;
    const s = HW.ents('enemy').find(e => e.type === 'snapjaw');
    snapRound(HW, s, 'sjCrate1', 2);
    assert.equal(s.hp, 1);
    snapRound(HW, s, 'sjCrate2', 4);
    assert.ok(!s.alive, 'beaten in two');
    assert.equal(HW.Inv.hp, 6, 'never bitten: stepping back from the edge is enough');
    assert.ok(HW.Progress.flag('millrace_snapjaw'));
    HW.step(60); HW.skipTalk(); HW.step(10);
    go(HW, 'snap', 4, 6); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.has('paddle'), 'the Paddle');
    noErrors(HW);
});

test('snapjaw: staying on the edge beside it, Wren gets bitten', () => {
    const HW = snapGame();
    const s = HW.ents('enemy').find(e => e.type === 'snapjaw'), hp = HW.Inv.hp;
    go(HW, 'snap', 11, 6);
    assert.ok(until(HW, () => s.state === 'rear', 600));
    HW.step(60);
    assert.ok(HW.Inv.hp < hp, 'snapped');
});

test('keys: the way to the Paddle is never locked, so no order of unlocking strands you', () => {
    const HW = game();
    const locks = HW.G.map.ents.filter(e => e.kind === 'door' && e.type === 'lock');
    assert.equal(JSON.stringify(locks.map(d => d.id).sort()), JSON.stringify(['caLockW', 'upLockE']));
    const keys = HW.G.map.ents.filter(e => e.kind === 'chest' && e.item === 'key');
    assert.equal(JSON.stringify(keys.map(c => c.id).sort()), JSON.stringify(['fpKey', 'upKey']));
    HW.warp('millrace', ...at('carousel', 15, 5)); HW.step(5);
    go(HW, 'snap', 1, 5);
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
    HW.face('left'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.keys('mill'), 1, 'the key');
    HW.step(200);                                         /* the raft has drifted off home */
    HW.hold('down'); HW.step(90); HW.release();
    assert.ok(until(HW, () => HW.player().state === 'normal' && HW.player().ty >= at('upstream', 9, 8)[1], 400), 'leaned on the edge, stepped in, and flew home');
    noErrors(HW);
});

test("upstream: the lock east is on the upper floor, reached from the top of the race (so the House's end needs the Paddle)", () => {
    const HW = game(['paddle']);
    HW.warp('millrace', ...at('upstream', 9, 9)); HW.step(5);
    const path = (from, to) => HW.global('playerPath')(HW.G.map, ...at('upstream', ...from), ...at('upstream', ...to));
    assert.equal(path([9, 9], [17, 5]), null, 'no way round from the foot of the race');
    assert.ok(path([9, 1], [17, 5]), 'along from the top');
    HW.Inv.equipped = 'paddle';
    board(HW, thing(HW, 'upRaft'), 'upstream', 9, 8, 'up');
    HW.hold(['tool', 'up']); until(HW, () => isAt(thing(HW, 'upRaft'), 'upstream', 9, 2), 600); HW.release(); HW.step(1);
    stepOff(HW, 'up');
    go(HW, 'upstream', 17, 5);
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

test('two wheels: ride to the first wheel and hold the raft there with the Paddle while the crate reaches the second (the sluice north)', () => {
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
    assert.ok(until(HW, () => thing(HW, 'twGate').open, 60), 'the sluice to the north lifts');
    go(HW, 'twowheels', 1, 1); go(HW, 'lock', 1, 9);
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

/* the Millpond: Old Grindle in three rounds (the sluice turns the races between them) */
function pondGame() {
    const HW = game(['paddle']);
    HW.Inv.patterns.push('mill');
    HW.warp('millrace', ...at('pond', 9, 9)); HW.step(30); HW.skipTalk(); HW.step(5);
    return HW;
}
const grindle = HW => HW.G.map.find('grindle');
/* sit out the sluice turning (it waits for Wren to be ashore) and the words with it */
function nextRound(HW, k) {
    const g = grindle(HW);
    for (let i = 0; i < 900 && g.alive && (g.phase < k || ['turn', 'sulk', 'hurt'].includes(g.state)); i++) { if (HW.Dialog.active) HW.skipTalk(); HW.step(1); }
    HW.skipTalk();
    assert.equal(g.phase, k, 'round ' + k);
}
/* (with the Paddle: a stroke up off the landing, then let the current have it) */
function pushOff(HW, r) {
    HW.Inv.equipped = 'paddle'; HW.hold(['tool', 'up']);
    until(HW, () => r.mv, 30); until(HW, () => !r.mv, 60); HW.release(); HW.step(1);
}
/* round 1: a barrel down a side race into its mouth; the ferry (rung off at once) to just below it; strike */
function pondRound1(HW) {
    const g = grindle(HW), r = thing(HW, 'gRaft');
    go(HW, 'pond', 14, 2); HW.face('down'); HW.push('down', 1);
    assert.ok(until(HW, () => g.state === 'full', 400), 'it swallowed the barrel and settled');
    go(HW, 'pond', 9, 8);
    board(HW, r, 'pond', 9, 7, 'up', 600);
    HW.face('left'); HW.press('act', 1);                   /* the ferry bell: off it goes */
    assert.ok(until(HW, () => isAt(r, 'pond', 9, 5), 150), 'up the ferry race at once');
    HW.face('up'); HW.press('atk', 1); HW.step(20);
    assert.equal(g.hp, 2, 'struck');
    assert.ok(until(HW, () => isAt(r, 'pond', 9, 7) && HW.Return.isHome(r), 600));
    stepOff(HW, 'down');
    nextRound(HW, 2);
}
/* round 2: the ferry race runs into its mouth now, and it swallows the ferry: ride a barrel up beside it instead */
function pondRound2(HW) {
    const g = grindle(HW), b = thing(HW, 'gbW');
    go(HW, 'pond', 5, 2); HW.face('down'); HW.push('down', 1);
    go(HW, 'pond', 5, 3); HW.hold('down'); HW.step(12); HW.release(); HW.step(2);
    assert.equal(`${HW.player().tx},${HW.player().ty}`, at('pond', 5, 4).join(','), 'standing on the barrel (the Paddle)');
    HW.Inv.equipped = 'paddle';
    for (let i = 0; i < 300 && HW.player().tx < at('pond', 8, 0)[0]; i++) { HW.hold(['tool', 'right']); HW.step(1); }
    HW.hold(['tool']); until(HW, () => !b.mv, 60);
    assert.ok(until(HW, () => g.state === 'full', 900), 'the ferry ran into its mouth and filled it');
    assert.ok(thing(HW, 'gRaft').swallowed, 'swallowed raft and all');
    HW.release(); HW.step(1); HW.face('right'); HW.press('atk', 1); HW.step(20);
    assert.equal(g.hp, 1, 'struck from the barrel');
    for (let i = 0; i < 300 && HW.player().tx > at('pond', 5, 0)[0]; i++) { HW.hold(['tool', 'left']); HW.step(1); }
    HW.release(); until(HW, () => !b.mv, 60); stepOff(HW, 'up');
    nextRound(HW, 3);
}
test('the millpond: round 1, a barrel down its race fills it; the ferry takes Wren up to strike its gear-heart', () => {
    const HW = pondGame();
    const g = grindle(HW);
    assert.ok(g && g.state === 'home' && g.phase === 1, 'awake');
    pondRound1(HW);
    noErrors(HW);
});
test('the millpond: round 2, the races run the other way: a barrel pushed in drifts off home, and the ferry race runs into its mouth', () => {
    const HW = pondGame();
    pondRound1(HW);
    const g = grindle(HW), b = thing(HW, 'gbE'), r = thing(HW, 'gRaft');
    go(HW, 'pond', 14, 2); HW.face('down'); HW.push('down', 1);
    HW.step(200);
    assert.ok(!b.swallowed && b.tx === at('pond', 14, 0)[0], 'the barrel never reached its mouth');
    assert.ok(until(HW, () => r.swallowed, 600), 'the empty ferry ran up into its mouth and was swallowed');
    assert.equal(g.state, 'full');
    noErrors(HW);
});
test('the millpond: round 2, riding the ferry up, Wren is snapped off it into the pond (and it eats the raft)', () => {
    const HW = pondGame();
    pondRound1(HW);
    const g = grindle(HW), r = thing(HW, 'gRaft'), hp = HW.Inv.hp;
    go(HW, 'pond', 9, 8);
    board(HW, r, 'pond', 9, 7, 'up', 600);
    assert.ok(until(HW, () => g.state === 'chomp' && g.st > 27, 600), 'it snaps at the rider');
    assert.ok(HW.Inv.hp < hp, 'bitten');
    assert.ok(until(HW, () => r.swallowed && HW.player().state === 'normal', 600), 'the raft swallowed; Wren flown home');
    noErrors(HW);
});
test('the millpond: round 3, jaw shut: the stick and a thrown pot only clang; a pot ridden past its teeth and smashed beyond sends its pieces between them', () => {
    const HW = pondGame();
    pondRound1(HW); pondRound2(HW);
    const g = grindle(HW), r = thing(HW, 'gRaft');
    assert.equal(g.state, 'shut');
    /* the raft's landing is still water now; pushed off, the race takes it up and on past its teeth: the stick from it does nothing */
    go(HW, 'pond', 9, 8);
    board(HW, r, 'pond', 9, 7, 'up', 900);
    HW.step(200);
    assert.ok(isAt(r, 'pond', 9, 7), 'it waits at its landing');
    pushOff(HW, r);
    assert.ok(until(HW, () => isAt(r, 'pond', 9, 4), 400), 'up to its mouth');
    HW.face('up'); HW.press('atk', 1); HW.step(20);
    assert.equal(g.hp, 1, 'clang');
    assert.ok(until(HW, () => isAt(r, 'pond', 14, 4), 600), 'and on past its teeth to the end of the race');
    stepOff(HW, 'right');
    assert.ok(until(HW, () => isAt(r, 'pond', 9, 7) && HW.Return.isHome(r), 900), 'the ferry home again');
    /* a pot carried aboard, ridden past its teeth, smashed beyond: its pieces fly home between them */
    go(HW, 'pond', 7, 8); HW.face('down'); HW.press('act', 1); HW.step(10);
    assert.ok(HW.player().carry, 'a pot');
    go(HW, 'pond', 9, 8);
    board(HW, r, 'pond', 9, 7, 'up', 900);
    pushOff(HW, r);
    assert.ok(until(HW, () => isAt(r, 'pond', 12, 4), 600), 'past its teeth');
    HW.face('right'); HW.press('act', 1);
    assert.ok(until(HW, () => !g.alive, 200), 'down');
    HW.step(100); HW.skipTalk();
    assert.ok(HW.Progress.flag('millrace_boss'));
    assert.ok(HW.ents('hoop')[0], 'the hoop');
    noErrors(HW);
});
test('the millpond: round 3, a pot smashed below its mouth sends its pieces home down the race, away from it', () => {
    const HW = pondGame();
    pondRound1(HW); pondRound2(HW);
    const g = grindle(HW), r = thing(HW, 'gRaft');
    go(HW, 'pond', 7, 8); HW.face('down'); HW.press('act', 1); HW.step(10);
    go(HW, 'pond', 9, 8);
    board(HW, r, 'pond', 9, 7, 'up', 900);
    pushOff(HW, r);
    assert.ok(until(HW, () => isAt(r, 'pond', 9, 5), 400));
    HW.face('up'); HW.press('act', 1); HW.step(120);
    assert.equal(g.hp, 1, 'its pieces flew back down the race, away from it');
    noErrors(HW);
});
test('the millpond: the sluice only turns once Wren is wholly ashore (never with a float about to leave from under her)', () => {
    const HW = pondGame();
    const g = grindle(HW), r = thing(HW, 'gRaft');
    go(HW, 'pond', 14, 2); HW.face('down'); HW.push('down', 1);
    until(HW, () => g.state === 'full', 400);
    go(HW, 'pond', 9, 8); board(HW, r, 'pond', 9, 7, 'up', 600);
    HW.face('left'); HW.press('act', 1); HW.face('up');
    until(HW, () => isAt(r, 'pond', 9, 5), 150);
    HW.press('atk', 1); HW.step(20);
    HW.step(300);
    assert.equal(g.state, 'sulk', 'it sulks while she is on the water');
    assert.ok(until(HW, () => isAt(r, 'pond', 9, 7) && HW.Return.isHome(r), 600));
    HW.hold('down'); HW.step(5); HW.release(); HW.step(10);
    assert.equal(g.state, 'sulk', 'a toe over the water still counts as on it');
    HW.hold('down'); HW.step(10); HW.release();
    assert.ok(until(HW, () => g.state === 'turn', 60), 'ashore: it heaves the sluice round');
    noErrors(HW);
});
test('the millpond: it spits at Wren on the bank, never while she is out on the water', () => {
    const HW = pondGame();
    const g = grindle(HW), r = thing(HW, 'gRaft');
    go(HW, 'pond', 9, 8); board(HW, r, 'pond', 9, 7, 'up', 600);
    let spat = 0;
    for (let i = 0; i < 400; i++) { HW.step(1); spat += g.spits.length; }
    assert.equal(spat, 0, 'no spit at a rider');
    assert.ok(until(HW, () => isAt(r, 'pond', 9, 7) && HW.Return.isHome(r), 600));
    stepOff(HW, 'down'); go(HW, 'pond', 3, 8);
    assert.ok(until(HW, () => g.spits.length > 0, 400), 'spat at her on the bank');
});
test('the millpond: on a float at its mouth while it is hungry, it bites', () => {
    const HW = pondGame();
    const g = grindle(HW), r = thing(HW, 'gRaft'), hp = HW.Inv.hp;
    go(HW, 'pond', 9, 8); board(HW, r, 'pond', 9, 7, 'up', 600);
    until(HW, () => isAt(r, 'pond', 9, 5), 400);
    HW.Inv.equipped = 'paddle'; HW.hold(['tool', 'up']); HW.step(40); HW.release();
    assert.ok(until(HW, () => g.state === 'chomp' && g.st > 27, 300), 'it snaps at the raft in its mouth');
    assert.ok(HW.Inv.hp < hp, 'bitten');
});

/* ---------------- the Lock: a hold wheel kept turning with nobody holding ---------------- */
function lockGame() {
    const HW = game(['paddle']);
    HW.Progress.set('millrace_twoWheels');
    HW.warp('millrace', ...at('lock', 1, 9)); HW.step(10);
    return HW;
}
test("the lock: hook the log away down the race, put the crate in behind it: the log coming home shoves it onto the wheel's water and holds it there; the gate stays up", () => {
    const HW = lockGame();
    const log = thing(HW, 'lkLog'), crate = thing(HW, 'lkCrate'), gate = thing(HW, 'lkGate');
    go(HW, 'lock', 11, 3); HW.Inv.equipped = 'hook'; HW.face('left'); HW.press('tool', 1);
    assert.ok(until(HW, () => isAt(log, 'lock', 10, 3), 120), 'the log reeled down the race');
    go(HW, 'lock', 8, 1); HW.face('down'); HW.push('down', 1); go(HW, 'lock', 6, 1);
    assert.ok(until(HW, () => gate.open, 900), 'the gate lifts');
    assert.ok(until(HW, () => isAt(crate, 'lock', 3, 3) && HW.Return.isHome(log), 60), "the crate on the wheel's water, the log home in its way");
    HW.step(1200);
    assert.ok(gate.open && isAt(crate, 'lock', 3, 3), 'and it stays that way');
    go(HW, 'lock', 18, 5); go(HW, 'bells', 1, 5);
    noErrors(HW);
});
test("the lock: the crate put on the wheel's water any other way heads home, and the gate drops again", () => {
    const HW = lockGame();
    const crate = thing(HW, 'lkCrate'), gate = thing(HW, 'lkGate');
    go(HW, 'lock', 8, 1); HW.face('down'); HW.press('act', 1); HW.step(10);
    assert.ok(HW.player().carry === crate, 'carrying the crate');
    go(HW, 'lock', 3, 4); HW.face('up'); HW.press('act', 1);
    assert.ok(until(HW, () => gate.open, 60), "on the wheel's water: the gate lifts");
    go(HW, 'lock', 3, 6);
    assert.ok(until(HW, () => !gate.open, 400), 'and drops when it heads home');
    noErrors(HW);
});
test('the lock: the crate in the race with the log still home just floats down and back', () => {
    const HW = lockGame();
    const gate = thing(HW, 'lkGate');
    go(HW, 'lock', 8, 1); HW.face('down'); HW.push('down', 1); go(HW, 'lock', 6, 1);
    HW.step(1200);
    assert.ok(!gate.open && HW.Return.isHome(thing(HW, 'lkCrate')));
});

/* ---------------- the Bell Race: three bells in order, from a ferry that only passes them one way going out ---------------- */
function bellGame() {
    const HW = game(['paddle']);
    HW.warp('millrace', ...at('bells', 1, 5)); HW.step(10);
    return HW;
}
const potFromBank = HW => { go(HW, 'bells', 13, 7); HW.face('down'); HW.press('act', 1); HW.step(10); assert.ok(HW.player().carry, 'a pot'); };
test('the bell race: a pot hooked over to the island, ridden home on the ferry past star, moon and sun, smashed on the landing: the Pattern', () => {
    const HW = bellGame();
    const f = thing(HW, 'brFerry');
    potFromBank(HW);
    go(HW, 'bells', 17, 6); HW.Inv.equipped = 'hook'; HW.face('up'); HW.press('tool', 1); HW.step(40);
    assert.equal(`${HW.player().tx},${HW.player().ty}`, at('bells', 17, 3).join(','), 'reeled over to the island, pot and all');
    go(HW, 'bells', 15, 2);
    board(HW, f, 'bells', 14, 2, 'left', 1500);
    assert.ok(until(HW, () => isAt(f, 'bells', 4, 2) && HW.Return.isHome(f), 1500), 'home on the ferry');
    stepOff(HW, 'left');
    HW.face('left'); HW.press('act', 1);
    assert.ok(until(HW, () => HW.Progress.areaFlag('millrace', 'seq:brs'), 200), 'sun, moon, star');
    go(HW, 'bells', 2, 5); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.hasPattern('mill'), 'the Pattern');
    noErrors(HW);
});
test('the bell race: or hook the ferry over from the bank at the far end and ride its way home', () => {
    const HW = bellGame();
    const f = thing(HW, 'brFerry');
    potFromBank(HW);
    go(HW, 'bells', 14, 6);
    assert.ok(until(HW, () => isAt(f, 'bells', 14, 2), 1500));
    HW.Inv.equipped = 'hook'; HW.face('up'); HW.press('tool', 1); HW.step(60);
    board(HW, f, 'bells', 14, 5, 'up', 10);
    assert.ok(until(HW, () => isAt(f, 'bells', 4, 2) && HW.Return.isHome(f), 1500));
    stepOff(HW, 'left'); HW.face('left'); HW.press('act', 1);
    assert.ok(until(HW, () => HW.Progress.areaFlag('millrace', 'seq:brs'), 200));
});
test('the bell race: riding out with the pot rings them star, moon, sun: wrong, and they fall silent', () => {
    const HW = bellGame();
    const f = thing(HW, 'brFerry');
    potFromBank(HW);
    go(HW, 'bells', 3, 2); board(HW, f, 'bells', 4, 2, 'right', 900);
    assert.ok(until(HW, () => isAt(f, 'bells', 14, 2), 900));
    stepOff(HW, 'right'); HW.face('right'); HW.press('act', 1); HW.step(120);
    assert.ok(!HW.Progress.areaFlag('millrace', 'seq:brs'));
    assert.ok(!thing(HW, 'brMoon').on && !thing(HW, 'brStar').on, 'star and moon rang out of turn: dark again (only the sun, rung last, is right so far)');
});
test('the bell race: out and back on the ferry with the pot, the thread unpicks itself and nothing rings', () => {
    const HW = bellGame();
    const f = thing(HW, 'brFerry');
    potFromBank(HW);
    go(HW, 'bells', 3, 2); board(HW, f, 'bells', 4, 2, 'right', 900);
    assert.ok(until(HW, () => isAt(f, 'bells', 14, 2), 900));
    assert.ok(until(HW, () => isAt(f, 'bells', 4, 2) && HW.Return.isHome(f), 1500));
    stepOff(HW, 'left');
    assert.ok(!HW.player().carry.ret.trace.some(([x, y]) => y === 2 && x > at('bells', 4, 0)[0]), 'none of the ride left in its thread');
    HW.face('left'); HW.press('act', 1); HW.step(150);
    assert.ok(!HW.Progress.areaFlag('millrace', 'seq:brs'));
    assert.ok(HW.G.map.ents.filter(e => e.kind === 'charm').every(c => !c.on));
});
test('the bell race: pots thrown from the bank one bell at a time: each dies away before the next is struck', () => {
    const HW = bellGame();
    for (const bx of [6, 9, 12]) {
        potFromBank(HW); go(HW, 'bells', bx, 6); HW.face('up'); HW.press('act', 1); HW.step(200);
    }
    assert.ok(!HW.Progress.areaFlag('millrace', 'seq:brs'));
    assert.ok(HW.G.map.ents.filter(e => e.kind === 'charm').every(c => !c.on), 'all silent');
});
test('the bell race: a game that already held the Pattern (it used to be in the Two Wheels) finds buttons in its chest', () => {
    const HW = game();
    HW.Inv.patterns.push('mill');
    HW.warp('millrace', ...at('bells', 1, 5)); HW.step(5);
    assert.equal(thing(HW, 'brPattern').item, 'b20');
});

/* ---------------- the end of the House ---------------- */
test("the way to the boss: the Two Wheels' sluice, the Lock, the Bell Race's Pattern, back through the Lock to its big door, into the Millpond from the side", () => {
    const HW = game(['paddle']);
    HW.Inv.patterns.push('mill');
    HW.Progress.set('millrace_twoWheels');
    HW.Progress.setAreaFlag('millrace', 'door:lkGate', true);
    HW.warp('millrace', ...at('twowheels', 1, 3)); HW.step(5);
    go(HW, 'twowheels', 1, 1); go(HW, 'lock', 1, 9); go(HW, 'lock', 18, 5); go(HW, 'bells', 1, 5);
    go(HW, 'lock', 1, 5); HW.hold('left'); HW.step(60); HW.release(); HW.step(10);
    assert.ok(thing(HW, 'lkBig').open, 'the big door, with the Pattern');
    go(HW, 'pond', 18, 5); HW.hold('left'); HW.step(12); HW.release(); HW.step(30); HW.skipTalk();
    const g = grindle(HW);
    assert.ok(g && g.state !== 'sleep', 'Old Grindle wakes');
    assert.ok(HW.G.map.ents.filter(e => e.group === 'boss').every(d => d.shut), 'both doors shut behind');
    noErrors(HW);
});

/* ---------------- ferry bells ---------------- */
test('ferry bells: rung on the island, the ferry sets out now; rung from aboard at the island, it starts home now', () => {
    const HW = game();
    HW.warp('millrace', ...at('ferry', 4, 2)); HW.step(5);
    const f = thing(HW, 'fpFerry');
    until(HW, () => HW.Return.isHome(f) && !f.mv, 2500);
    HW.step(5);
    go(HW, 'ferry', 5, 2); HW.face('right'); HW.press('act', 1);
    assert.ok(until(HW, () => f.mv, 3), 'off at once');
    go(HW, 'ferry', 5, 3);
    board(HW, f, 'ferry', 6, 3, 'right', 800);
    HW.face('up'); HW.press('act', 1);
    assert.ok(until(HW, () => f.ret.state === 'returning', 5), 'home at once, Wren aboard');
    assert.ok(until(HW, () => isAt(f, 'ferry', 16, 6), 800));
    noErrors(HW);
});

test('review fixes: a dive into the river from the far bank costs one heart and lands on dry ground', () => {
    const HW = loadGame();
    HW.preset('afterD2'); HW.step(10); HW.skipTalk();
    HW.warp('hollow', 128 + 43, 80 + 28); HW.step(10);
    HW.walkTo(128 + 42, 80 + 28); HW.step(5);
    const hp = HW.Inv.hp;
    HW.hold('left'); HW.step(60); HW.release();
    assert.ok(until(HW, () => HW.player().state === 'normal', 400));
    HW.step(120);
    assert.ok(HW.Inv.hp >= hp - 1, `lost at most one (${hp} -> ${HW.Inv.hp})`);
    const p = HW.player(), k = HW.G.map.kind(p.tx, p.ty);
    assert.ok(!k.deep && !k.pit, 'on dry ground');
});

test('review fixes: the Hookline thrown from a raft leaves the raft alone', () => {
    const HW = game(['paddle']);
    HW.Inv.equipped = 'paddle';
    HW.warp('millrace', ...at('upstream', 9, 9)); HW.step(5);
    const r = thing(HW, 'upRaft');
    board(HW, r, 'upstream', 9, 8, 'up');
    HW.hold(['tool', 'up']); until(HW, () => isAt(r, 'upstream', 9, 4), 400); HW.release(); HW.step(2);
    HW.Inv.equipped = 'hook'; HW.face('up'); HW.press('tool', 1); HW.step(40);
    assert.ok(r.ty <= at('upstream', 9, 5)[1], `the raft stayed put (at ${r.tx},${r.ty})`);
});

test('review fixes: stepping at a raft as it pulls away does not drop Wren in the water', () => {
    const HW = game();
    HW.warp('millrace', ...at('carousel', 9, 8)); HW.step(5);
    const r = thing(HW, 'caRaft'), hp = HW.Inv.hp;
    until(HW, () => r.mv, 400);
    HW.hold('up'); HW.step(20); HW.release(); HW.step(30);
    assert.equal(HW.Inv.hp, hp, 'no sinking');
    assert.equal(HW.player().state, 'normal');
});
