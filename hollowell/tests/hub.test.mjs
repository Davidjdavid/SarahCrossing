// The things to do in town: the kids' game (S12), the Inn's attic trials (S28).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const HX = 64, HY = 40;
function town(preset = 'afterD1') {
    const HW = loadGame();
    HW.preset(preset);
    HW.step(5); HW.skipTalk();
    HW.warp('hollow', HX + 36, HY + 21);
    HW.step(5);
    return HW;
}
const go = (HW, x, y) => assert.ok(HW.walkTo(HX + x, HY + y), `walk to ${x},${y} (at ${HW.player().tx - HX},${HW.player().ty - HY})`);
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));

test('the kids play tag before the first Knot and Housekeeper after it', () => {
    const HW = loadGame();
    HW.newGame('Test', { area: 'hollow', x: HX + 30, y: HY + 22, noAutosave: true });
    HW.Progress.set('ceremony'); HW.step(5);
    assert.equal(HW.ents('npc').filter(n => n.kind === 'npc' && n.who === 'otto').length, 1);
    assert.ok(!HW.G.map.find('kc1'), 'no crates yet');
    const T = town();
    assert.ok(T.ents('npc').some(n => n.state === 'home' && n.who === 'otto'), 'Otto the Housekeeper on his X');
    assert.ok(T.G.map.find('kc1') && T.G.map.find('kc2'));
    noErrors(T);
});

test('Housekeeper: push a crate sideways and Otto tidies it back without a scratch', () => {
    const HW = town();
    const otto = HW.ents('npc').find(n => n.who === 'otto'), c = HW.G.map.find('kc1');
    go(HW, 35, 18);
    HW.push('up', 1);                         // (35,17) -> (35,16): its way home is south; Otto comes at it from the east
    go(HW, 33, 19);
    for (let i = 0; i < 400 && !HW.Return.isHome(c); i++) HW.step(1);
    assert.ok(HW.Return.isHome(c), 'tidied home');
    assert.notEqual(otto.state, 'down');
    assert.equal(HW.Progress.flag('s12'), false);
    noErrors(HW);
});

test('Housekeeper: push it straight away from his X and step aside: his own yank bowls him over (S12)', () => {
    const HW = town();
    const otto = HW.ents('npc').find(n => n.who === 'otto'), c = HW.G.map.find('kc1');
    go(HW, 36, 17);
    HW.push('left', 1);                       // (35,17) -> (34,17): it came from his side
    go(HW, 35, 19);                           // out of the tile he wants
    for (let i = 0; i < 400 && otto.state !== 'down'; i++) HW.step(1);
    assert.equal(otto.state, 'down', 'bowled over');
    for (let i = 0; i < 20; i++) { HW.step(30); HW.skipTalk(); }
    assert.ok(HW.Progress.flag('s12'), 'won');
    assert.ok(HW.Inv.has('kidbadge'), 'the badge');
    noErrors(HW);
});

test('Housekeeper: standing on the spot he wants sends him round another side', () => {
    const HW = town();
    const otto = HW.ents('npc').find(n => n.who === 'otto'), c = HW.G.map.find('kc1');
    go(HW, 36, 17);
    HW.push('left', 1);                       // Wren now stands on (35,17), where he'd come at it
    for (let i = 0; i < 300 && !HW.Return.isHome(c); i++) HW.step(1);
    assert.notEqual(otto.state, 'down');
    noErrors(HW);
});

/* ---------------- the Tidiness Trials (S28) ---------------- */
function attic(flags = []) {
    const HW = loadGame();
    HW.preset('afterD1'); HW.step(5); HW.skipTalk();
    for (const f of flags) HW.Progress.set(f);
    HW.warp('inn_attic', 2, 9); HW.step(10);
    return HW;
}
const goA = (HW, x, y) => assert.ok(HW.walkTo(x, y), `walk to ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);

test('the attic stairs are roped off until the first Knot, then lead up', () => {
    const HW = loadGame();
    HW.newGame('Test', { area: 'inn', x: 7, y: 6, noAutosave: true }); HW.Progress.set('ceremony'); HW.step(5);
    assert.ok(!HW.ents('warp').some(w => w.to === 'inn_attic'));
    const T = loadGame(); T.preset('afterD1'); T.step(5); T.skipTalk(); T.warp('inn', 7, 6); T.step(5);
    assert.ok(T.ents('warp').some(w => w.to === 'inn_attic'));
    assert.ok(T.walkTo(2, 2)); T.hold('left');
    for (let i = 0; i < 200 && T.G.map.id !== 'inn_attic'; i++) T.step(1);
    T.release(); T.step(20);
    assert.equal(T.G.map.id, 'inn_attic');
});

test('trial one: the first block into the pocket, the second onto its mouth, before the bell', () => {
    const HW = attic();
    goA(HW, 3, 8); HW.step(3);
    assert.ok(HW.G.trial && HW.G.trial.n === 1, 'the clock is running');
    goA(HW, 8, 6); HW.push('up', 3);          // block into the pocket (8,2), through the mouth (8,3)
    goA(HW, 10, 3); HW.push('left', 1);       // the other onto the mouth: the first can't get home past it
    HW.step(3);
    assert.ok(HW.Progress.flag('trial1'), 'won');
    assert.equal(HW.G.trial, null);
    HW.step(5);
    assert.ok(HW.G.map.find('tg1').open, 'the way on');
    noErrors(HW);
});

test('trial one: too slow, and everything goes back', () => {
    const HW = attic();
    goA(HW, 3, 8); HW.step(3);
    HW.step(20 * 60 + 10);
    assert.equal(HW.G.trial, null);
    assert.equal(HW.Progress.flag('trial1'), false);
});

test('trial two: left to walk the long way it is too slow', () => {
    const HW = attic(['trial1']);
    goA(HW, 21, 9); HW.step(3);
    assert.ok(HW.G.trial && HW.G.trial.n === 2);
    goA(HW, 21, 1);
    HW.step(15 * 60 + 10);
    assert.equal(HW.Progress.flag('trial2'), false);
    const pot = HW.G.map.find('longPot');
    assert.ok(pot.tiedOff, 'set out again');
});

/* it sets off home along row 8 as soon as the clock starts: stand in its way (it waits for you), pick it up */
function liftPot(HW) {
    const pot = HW.G.map.find('longPot');
    goA(HW, 24, 8); HW.face('right');
    for (let i = 0; i < 300 && !(pot.tx === 25 && pot.ty === 8 && !pot.mv); i++) HW.step(1);
    HW.press('act', 1); HW.step(10);
}
test('trial two: smash it and the pieces fly home in time', () => {
    const HW = attic(['trial1']);
    goA(HW, 21, 9); HW.step(3);
    liftPot(HW);
    assert.ok(HW.player().carry, 'carrying it');
    HW.face('up'); HW.press('act', 1);        // throw: it breaks and the pieces go home
    for (let i = 0; i < 900 && !HW.Progress.flag('trial2'); i++) HW.step(1);
    assert.ok(HW.Progress.flag('trial2'), 'won');
    noErrors(HW);
});

test('trial two: or carry it back over its own path, which shortens it', () => {
    const HW = attic(['trial1']);
    goA(HW, 21, 9); HW.step(3);
    liftPot(HW);
    HW.hold('up'); HW.step(100); HW.release();             // up the column: each row walked over is cut off its path
    const pot = HW.G.map.find('longPot');
    assert.ok(pot.ret.trace.length < 30, `path cut short (${pot.ret.trace.length})`);
    HW.face('down'); HW.press('act', 1);
    for (let i = 0; i < 900 && !HW.Progress.flag('trial2'); i++) HW.step(1);
    assert.ok(HW.Progress.flag('trial2'), 'won');
    noErrors(HW);
});

test('trial three: ring the bell, fall in, fly home along the way you came onto the plate (S28)', () => {
    const HW = attic(['trial1', 'trial2']);
    goA(HW, 38, 5); goA(HW, 41, 5); HW.step(5);
    goA(HW, 43, 8); HW.face('left'); HW.press('atk', 1); HW.step(10);
    assert.ok(HW.G.trial && HW.G.trial.n === 3, 'the bell rang');
    goA(HW, 44, 8); HW.hold('right');
    for (let i = 0; i < 260 && !HW.Progress.flag('trial3'); i++) HW.step(1);
    HW.release();
    assert.ok(HW.Progress.flag('trial3') && HW.Progress.flag('s28'), 'won');
    HW.step(40); HW.skipTalk();
    goA(HW, 41, 8); HW.face('down'); HW.press('act', 1); HW.skipTalk();
    noErrors(HW);
});

test('trial three: walking back is too slow', () => {
    const HW = attic(['trial1', 'trial2']);
    goA(HW, 38, 5); goA(HW, 41, 5); HW.step(5);
    goA(HW, 43, 8); HW.face('left'); HW.press('atk', 1); HW.step(10);
    goA(HW, 41, 5); HW.step(5);
    assert.equal(HW.Progress.flag('trial3'), false);
});

test('all three done: Ives knits a scarf', () => {
    const HW = loadGame(); HW.preset('afterD1'); HW.step(5); HW.skipTalk();
    for (const f of ['trial1', 'trial2', 'trial3', 's28', 'met:trials']) HW.Progress.set(f);
    HW.warp('inn', 6, 3); HW.step(5); HW.face('up'); HW.press('act', 1); HW.skipTalk(); HW.step(40); HW.skipTalk();
    assert.ok(HW.Inv.has('tealscarf'));
});
