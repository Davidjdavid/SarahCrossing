// Puppets and the Crossbar (src/61_crossbar_kit.js), in the lab (lab6).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

function lab() {
    const HW = loadGame();
    HW.newGame('Test', { area: 'lab6', x: 3, y: 3, noAutosave: true });
    HW.Inv.items.staff = 1;
    for (const t of ['gloves', 'hook', 'paddle', 'bell', 'bedroll', 'crossbar']) HW.Inv.giveTool(t);
    HW.Inv.equipped = 'crossbar';
    HW.Inv.maxHp = HW.Inv.hp = 24;
    HW.step(5);
    return HW;
}
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const go = (HW, x, y) => assert.ok(HW.walkTo(x, y), `walk to ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const walkPuppet = (HW, e, d, n) => { for (let i = 0; i < n; i++) { const x = e.tx, y = e.ty; HW.hold(d); until(HW, () => e.mv, 20); until(HW, () => !e.mv, 30); HW.release(); HW.step(1); if (e.tx === x && e.ty === y) break; } };
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));

test('take a puppet in sight; walk it through the little hole and over the spikes onto a plate; let go and it walks home', () => {
    const HW = lab();
    const p = HW.player(), a = HW.G.map.find('pA');
    go(HW, 3, 3); HW.face('right'); HW.press('tool', 1); HW.step(2);
    assert.equal(p.pinned, 'crossbar', 'holding its strings');
    const x0 = p.x;
    walkPuppet(HW, a, 'right', 11);
    assert.equal(p.x, x0, 'Wren stood still');
    assert.deepEqual([a.tx, a.ty], [17, 3], 'through the hole, over the spikes, onto the plate');
    HW.step(5);
    assert.ok(HW.G.map.find('labGate').open, 'the plate opened the gate');
    HW.press('tool', 1); HW.step(2);
    assert.equal(p.pinned, null, 'let go');
    assert.ok(until(HW, () => HW.Return.isHome(a), 900), 'it walked home');
    noErrors(HW);
});

test('Wren cannot go through the little hole herself; a puppet will not walk into a pit', () => {
    const HW = lab();
    go(HW, 8, 3); HW.hold('right'); HW.step(40); HW.release();
    assert.equal(HW.player().tx, 8, 'too small for Wren');
});

test('a rack: take it and its puppets step together, each that can', () => {
    const HW = lab();
    const b = HW.G.map.find('pB'), c = HW.G.map.find('pC');
    go(HW, 3, 8); HW.face('left'); HW.press('tool', 1); HW.step(2);
    assert.equal(HW.player().pinned, 'crossbar');
    walkPuppet(HW, b, 'right', 4);
    assert.equal(b.tx, 8, 'one stopped by the wall');
    assert.equal(c.tx, 8, 'the other by the shut gate');
    assert.equal(b.ty, 8); assert.equal(c.ty, 6);
    HW.press('act', 1); HW.step(2);
    assert.equal(HW.player().pinned, null, 'Z lets go too');
    noErrors(HW);
});

test('a toy soldier marches on and about-turns at the wall', () => {
    const HW = lab();
    const s = HW.G.map.ents.find(e => e.type === 'soldier');
    const x0 = s.x;
    HW.step(60);
    assert.ok(s.x > x0, 'marching right');
    until(HW, () => s.march !== 2, 600);
    HW.step(60);
    assert.ok(s.x < 18 * 16, 'turned back');
});

test('a painted flat falls over at a knock: cardboard', () => {
    const HW = lab();
    HW.warp('lab6', 13, 6); HW.step(5);
    const f = HW.G.map.find('flat');
    HW.G.map.find('sol').alive = false;
    HW.face('right'); HW.press('atk', 1); HW.step(20);
    assert.ok(f.down, 'down');
    go(HW, 15, 6);
    noErrors(HW);
});
