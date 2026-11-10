// Millwater: Heron Rock (the Hookline: a barrel reeled ashore leaves its mark empty on the rock; out of the line, the mark
// is a thing to hook onto), and the lake's shore (one band of shallows, no lone squares).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';
const mw = (x, y) => [128 + x, 80 + y];
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const go = (HW, x, y) => assert.ok(HW.walkTo(x, y), `walk to ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
function game(pre) { const HW = loadGame(); HW.preset(pre); HW.step(10); HW.skipTalk(); HW.Inv.maxHp = HW.Inv.hp = 24; return HW; }
const noErr = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
function ashore(HW) {
    HW.warp('hollow', ...mw(53, 19)); HW.step(5);
    for (const e of HW.G.map.ents.slice()) if (e.kind === 'enemy') HW.G.map.remove(e);
    return HW.G.map.find('heronBarrel');
}

test('Heron Rock: reel the barrel ashore, set it out of the line, hook its empty mark: over to the rock; the post on the shore brings you back', () => {
    const HW = game('afterD2');
    const b = ashore(HW), p = HW.player();
    go(HW, ...mw(51, 18)); HW.Inv.equipped = 'hook'; HW.face('up'); HW.press('tool', 1);
    assert.ok(until(HW, () => b.ty === mw(0, 17)[1] && !b.mv && !b.hookPulled, 200), `reeled ashore (at ${b.tx - 128},${b.ty - 80})`);
    /* it's in the way of its own mark: lift it out of the water and set it down on the bank */
    HW.face('up'); HW.press('act', 1); HW.step(20);
    assert.ok(p.carry === b, 'lifted');
    HW.face('left'); HW.press('act', 1); HW.step(40);
    assert.ok(!p.carry && b.tx < mw(51, 0)[0], 'set aside');
    HW.face('up'); HW.press('tool', 1);
    assert.ok(until(HW, () => p.tx === mw(51, 0)[0] && p.ty === mw(0, 14)[1] && p.state === 'normal', 120), `onto its mark on the rock (at ${p.tx - 128},${p.ty - 80})`);
    HW.face('up'); const p0 = HW.Inv.patches; HW.press('act', 1); HW.step(3); HW.skipTalk();
    assert.ok(HW.Inv.patches === p0 + 1 || HW.Inv.maxHp > 24, 'the Heart Patch');
    /* off its mark, and the barrel comes home; then back to the shore by the eel-catcher's post */
    go(HW, ...mw(50, 14));
    assert.ok(until(HW, () => HW.Return.isHome(b) && !b.mv, 900), 'the barrel home on its rock');
    HW.face('down'); HW.press('tool', 1);
    assert.ok(until(HW, () => p.ty === mw(0, 18)[1] && p.state === 'normal', 120), 'back ashore');
    noErr(HW);
});

test('Heron Rock: the barrel reeled ashore and left in the water is in the line; the hook just catches it again', () => {
    const HW = game('afterD2');
    const b = ashore(HW), p = HW.player();
    go(HW, ...mw(51, 18)); HW.Inv.equipped = 'hook'; HW.face('up'); HW.press('tool', 1);
    until(HW, () => b.ty === mw(0, 17)[1] && !b.mv && !b.hookPulled, 200);
    HW.step(10); HW.press('tool', 1); HW.step(60);
    assert.ok(p.ty === mw(0, 18)[1], 'still on the shore');
    assert.equal(HW.walkTo(...mw(51, 14)), false, 'no way over on foot');
    noErr(HW);
});

test("the lake's shore: its shallows run in bands; no square of shallow water stands alone among grass", () => {
    const HW = game('afterD2');
    HW.warp('hollow', ...mw(9, 24)); HW.step(5);
    const a = HW.G.map, wet = (x, y) => a.kind(...mw(x, y)).water;
    const lone = [];
    for (let y = 2; y <= 18; y++) for (let x = 3; x <= 60; x++) {
        if (!a.kind(...mw(x, y)).shallow && a.cell(...mw(x, y)).k !== 'shallow') continue;
        if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => wet(x + dx, y + dy))) lone.push([x, y]);
    }
    assert.deepEqual(lone, []);
    noErr(HW);
});
