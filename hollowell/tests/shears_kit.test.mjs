// The Shears (src/70_shears_kit.js) in its lab room: a thing cut free stays where it is (and fills a pit for good, and
// is still there after the place is built again); silk walls and bridges cut; a person cut free; your own thread.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const go = (HW, x, y) => assert.ok(HW.walkTo(x, y), `walk to ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
function lab() {
    const HW = loadGame();
    HW.newGame('Test', { area: 'lab8', x: 3, y: 2, noAutosave: true });
    HW.Inv.items.staff = 1;
    for (const t of ['gloves', 'hook', 'bell', 'needle', 'shears']) HW.Inv.giveTool(t);
    HW.Inv.maxHp = HW.Inv.hp = 20;
    HW.step(5);
    return HW;
}
const snip = HW => { HW.Inv.equipped = 'shears'; HW.press('tool', 1); HW.step(3); };

test('a block cut free is a stray: it stays where it is pushed, and it stays there when the place is built again', () => {
    const HW = lab();
    const b = HW.G.map.find('cB');
    go(HW, 4, 2); HW.face('right'); snip(HW);
    assert.equal(b.ret, null, 'no thread');
    HW.push('right', 2); HW.step(200);
    assert.deepEqual([b.tx, b.ty], [7, 2], 'stays put');
    HW.warp('lab7', 2, 2); HW.step(5); HW.warp('lab8', 3, 2); HW.step(5);
    const b2 = HW.G.map.find('cB');
    assert.deepEqual([b2.tx, b2.ty], [7, 2], 'still there after');
    assert.equal(b2.ret, null);
    noErrors(HW);
});

test('a cut block pushed into a pit fills it for good (and is gone for good)', () => {
    const HW = lab();
    go(HW, 5, 1); HW.face('down'); snip(HW);
    HW.push('down', 2); HW.step(30);
    assert.ok(!HW.G.map.kind(5, 4).pit, 'filled');
    HW.warp('lab7', 2, 2); HW.step(5); HW.warp('lab8', 3, 2); HW.step(5);
    assert.ok(!HW.G.map.find('cB'), 'gone');
    assert.ok(!HW.G.map.kind(5, 4).pit, 'still filled');
    noErrors(HW);
});

test('silk: a wall cut falls away; a bridge cut drops (with whoever is on it)', () => {
    const HW = lab();
    assert.equal(HW.walkTo(13, 8), false, 'the silk wall');
    go(HW, 10, 9); HW.face('right'); snip(HW);
    go(HW, 13, 8);
    go(HW, 3, 7); go(HW, 8, 7);
    go(HW, 6, 7); HW.face('right'); snip(HW);
    HW.step(60);
    assert.ok(HW.G.map.kind(7, 7).pit, 'the bridge is gone');
    noErrors(HW);
});

test('a person cut free; and at the fog, your own thread', () => {
    const HW = lab();
    go(HW, 8, 4); HW.face('up'); snip(HW); HW.skipTalk(0);
    assert.ok(HW.Progress.flag('cut:hob'));
    go(HW, 1, 5); HW.face('left'); snip(HW); HW.skipTalk(0);
    assert.ok(HW.Progress.flag('cut_self'));
    HW.hold('left'); HW.step(80); HW.release();
    assert.equal(HW.player().tx, 0, 'walks into the fog and is not pulled back');
    noErrors(HW);
});
