// Cut free (src/73_freed.js): townsfolk whose threads are cut walk a round of their own; Old Arlo's walk (S24).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const npc = (HW, who) => HW.G.map.ents.find(e => e.kind === 'npc' && e.who === who);
function afterD8() { const HW = loadGame(); HW.preset('afterD8'); HW.step(10); HW.skipTalk(); return HW; }
function cut(HW, who) {
    const n = npc(HW, who);
    for (const [dx, dy, f] of [[0, 1, 'up'], [1, 0, 'left'], [-1, 0, 'right'], [0, -1, 'down']]) if (HW.walkTo(n.tx + dx, n.ty + dy, 20000)) { HW.face(f); break; }
    HW.Inv.equipped = 'shears'; HW.press('tool', 1); HW.step(3); HW.skipTalk(0);
}

test('a townsperson cut free walks a round of their own, and still does after the place is built again', () => {
    const HW = afterD8();
    cut(HW, 'quill');
    assert.ok(HW.Progress.flag('cut:quill'));
    const q = npc(HW, 'quill'), x0 = [q.tx, q.ty];
    HW.step(900);
    assert.notDeepEqual([q.tx, q.ty], x0, 'she has gone walking');
    HW.warp('gran_room', 4, 3); HW.step(5); HW.warp('hollow', 90, 64); HW.step(10);
    assert.ok(npc(HW, 'quill').route, 'still free');
    noErrors(HW);
});

test("S24: Old Arlo, cut free, walks down to the river; follow him", () => {
    const HW = afterD8();
    cut(HW, 'arlo');
    const a = npc(HW, 'arlo');
    for (let i = 0; i < 60 && !HW.Progress.flag('s24'); i++) { HW.walkTo(a.tx - 1, a.ty, 400); HW.step(20); HW.skipTalk(); }
    assert.ok(HW.Progress.flag('s24'));
    assert.ok(HW.Inv.patches >= 1);
    noErrors(HW);
});
