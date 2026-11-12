// Creatures hold still while a line is up or a scene runs (live run 3's picture review: a nibbler three tiles off bit
// Wren twice in six seconds of a chest's line, and the first mini-boss could faint her during its own introduction).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

test('a line left up while a creature is near: it holds still and never bites; once the line is read it moves again', () => {
    const HW = loadGame(); HW.preset('afterD1'); HW.step(10); HW.skipTalk();
    HW.warp('tidy', 29, 38); HW.step(30); HW.skipTalk();
    const a = HW.G.map, p = HW.player(), Enemy = HW.global('Enemy'), Dialog = HW.global('Dialog'), say = HW.global('say');
    for (const e of HW.ents('enemy')) e.alive = false;
    for (const type of ['nibbler', 'dustbunny']) {
        HW.Inv.hp = HW.Inv.maxHp;
        const e = a.add(new Enemy(p.tx + 3, p.ty, { type }));
        const at = [e.x, e.y];
        HW.Script.run(function* () { yield* say(null, 'A line left up while the player reads it, slowly.'); });
        for (let i = 0; i < 420; i++) HW.step(1);
        assert.ok(Dialog.active, 'the line is still up');
        assert.equal(HW.Inv.hp, HW.Inv.maxHp, `${type}: no hearts lost while reading`);
        assert.deepEqual([e.x, e.y], at, `${type}: it held still`);
        HW.skipTalk();
        for (let i = 0; i < 120; i++) HW.step(1);
        assert.ok(e.x !== at[0] || e.y !== at[1] || !e.alive || e.mode === 'sleep', `${type}: it carries on once the line is read`);
        e.alive = false;
    }
});
