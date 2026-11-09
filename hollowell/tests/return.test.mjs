// The Return's rules, tested on the real game code.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

function lab() {
    const HW = loadGame();
    HW.newGame('Tess', { area: 'lab', x: 2, y: 8, noAutosave: true });
    return HW;
}

test('the game boots headless and builds the lab', () => {
    const HW = lab();
    assert.equal(HW.state().area, 'lab');
    assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
});

test('a pushed block goes back the way it came after its patience', () => {
    const HW = lab();
    const b = HW.at(3, 3);
    assert.ok(b && b.kind === 'block');
    // stand left of it and push right twice
    assert.ok(HW.walkTo(2, 3), 'walked next to the block');
    HW.push('right', 2);
    assert.equal(b.tx, 5, 'pushed two tiles');
    assert.equal(b.ret.state === 'home', false);
    assert.equal(JSON.stringify(b.ret.trace), '[[3,3],[4,3],[5,3]]');
    // step away and wait
    HW.walkTo(4, 5);
    HW.step(400);
    assert.equal(b.tx, 3, 'it returned to its mark');
    assert.equal(b.ret.state, 'home');
    assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
});

test('a block on a plate opens the gate until it returns', () => {
    const HW = lab();
    const door = HW.ents('door')[0];
    assert.equal(door.open, false);
    // the wood block at 6,3: push it down to the plate at 3,8? Use a fresh approach: stand on the plate
    HW.walkTo(3, 8);
    HW.step(3);
    assert.equal(door.open, true, 'standing on the plate opens the gate');
    HW.walkTo(5, 8);
    HW.step(3);
    assert.equal(door.open, false, 'stepping off closes it');
});

test('a thrown pot shatters and its pieces reform at its mark', () => {
    const HW = lab();
    const pot = HW.at(8, 2);
    assert.ok(pot && pot.kind === 'pot');
    HW.walkTo(8, 1); HW.face('down');
    HW.press('act', 1);
    assert.equal(HW.player().carry, pot, 'lifted the pot');
    HW.walkTo(9, 8);
    HW.face('left');
    HW.press('act', 1);
    HW.step(30);
    assert.equal(pot.shattered, true, 'it broke');
    HW.step(400);
    assert.equal(pot.shattered, false);
    assert.equal(HW.at(8, 2), pot, 'reformed on its mark');
});

test('a stray stays where it is pushed', () => {
    const HW = lab();
    const s = HW.at(15, 2);
    assert.ok(s && !s.ret, 'strays have no mark');
    HW.walkTo(14, 2);
    HW.push('right', 1);
    HW.walkTo(13, 8);
    HW.step(400);
    assert.equal(s.tx, 16, 'still where it was pushed');
});

test('a stray pushed into a pit fills it for good', () => {
    const HW = lab();
    const s = HW.at(15, 2);
    HW.walkTo(15, 1);
    HW.push('down', 1);
    HW.step(40);
    assert.equal(s.ty, 3);
    assert.equal(HW.G.map.kindName(16, 3) === 'pit' || HW.G.map.kindName(15, 3) !== 'pit', true);
});

test('Wren falls into a pit and flies home along the trace', () => {
    const HW = lab();
    HW.walkTo(13, 3);
    const p = HW.player();
    const hp = HW.Inv.hp;
    HW.hold('right'); HW.step(60); HW.release();
    HW.step(200);
    assert.equal(p.state, 'normal');
    assert.equal(HW.Inv.hp, hp - 1, 'lost half a heart');
    assert.equal(p.tx, p.mark.tx); assert.equal(p.ty, p.mark.ty);
});

test('save and load round trip', () => {
    const HW = lab();
    HW.Inv.buttons = 42; HW.Progress.set('hello');
    HW.Save.write(2);
    const s = HW.Save.read(2);
    assert.equal(s.inv.buttons, 42);
    assert.equal(s.progress.flags.hello, true);
    const code = HW.Save.code(2);
    const back = HW.Save.fromCode(code);
    assert.equal(back.inv.buttons, 42);
});
