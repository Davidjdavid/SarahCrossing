// The Stray House (O1, src/77_strayhouse.js): the door that wants Linnet's notes, every room's solution, the Pile,
// Linnet's room; and Linnet's Trail notes 4 and 5, now notes like the rest.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const R = { po: [20, 33], pa: [20, 22], pt: [0, 22], bg: [40, 22], sh: [20, 11], wh: [0, 11], md: [40, 11], pl: [20, 0], lr: [0, 0] };
const at = (r, x, y) => [R[r][0] + x, R[r][1] + y];
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const go = (HW, r, x, y) => assert.ok(HW.walkTo(...at(r, x, y)), `walk to ${r} ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const thing = (HW, id) => HW.G.map.find(id);
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const pushAt = (HW, r, x, y, d, n) => { go(HW, r, x, y); HW.push(d, n); HW.step(10); };
const pos = (HW, id) => { const e = thing(HW, id); return [e.tx, e.ty]; };
function game() {
    const HW = loadGame(); HW.preset('afterD8'); HW.step(10); HW.skipTalk();
    HW.Inv.maxHp = HW.Inv.hp = 36;
    HW.Progress.set('strayhouse_open');
    return HW;
}
const enter = (HW, r, x, y) => { HW.warp('strayhouse', ...at(r, x, y)); HW.step(20); HW.skipTalk(); HW.step(5); };

test('the door: only for someone with all seven of Linnet\'s notes; posted through, it opens; the eighth is inside', () => {
    const HW = loadGame(); HW.preset('afterD8'); HW.step(10); HW.skipTalk();
    for (const n of [1, 2, 3, 4, 5, 6]) HW.Progress.set('linnet' + n);
    HW.warp('hollow', 72, 7); HW.step(10); HW.face('up'); HW.press('act', 1); HW.step(3); HW.skipTalk(); HW.step(30);
    assert.equal(HW.G.map.id, 'hollow', 'six is not enough');
    HW.Progress.set('linnet7');
    HW.face('up'); HW.press('act', 1); HW.step(3); HW.skipTalk(); HW.step(60); HW.skipTalk();
    assert.equal(HW.G.map.id, 'strayhouse', 'in');
    assert.ok(HW.Progress.flag('strayhouse_open'));
    go(HW, 'po', 13, 9); HW.face('up'); HW.press('act', 1); HW.step(3); HW.skipTalk();
    assert.ok(HW.Progress.flag('linnet8'), 'the eighth note');
    noErrors(HW);
});

test('Linnet\'s notes 4 (the Echo Room) and 5 (below the falls) are notes on the Trail now', () => {
    const HW = loadGame(); HW.preset('afterD8'); HW.step(10); HW.skipTalk();
    HW.warp('hollow', 106, 75); HW.step(10);
    assert.ok(HW.G.map.ents.find(e => e.tx === 64 * 2 + 43 && e.ty === 80 + 35 && e.interact), 'the bottle below the falls');
    assert.ok(HW.AREAS.belfry.ents.some(e => e.k === 'linnetnote' && e.note === 4), 'the Echo Room');
    assert.ok(HW.global('NOTES').linnet4 && HW.global('NOTES').linnet5 && HW.global('NOTES').linnet8);
    noErrors(HW);
});

test('the Porch: a stray into the gap stays in it', () => {
    const HW = game();
    enter(HW, 'po', 9, 9);
    pushAt(HW, 'po', 9, 6, 'up', 2);
    assert.ok(!HW.G.map.kind(...at('po', 9, 3)).pit, 'filled');
    go(HW, 'po', 9, 1);
    noErrors(HW);
});

test('the Pantry: three strays onto three plates: the key', () => {
    const HW = game();
    enter(HW, 'pt', 18, 5);
    /* (from the door, the middle one can only go west; the north one comes out the shelf gap and goes west too; the
       south one comes out and goes east, everyone walking round by the other gaps) */
    pushAt(HW, 'pt', 12, 5, 'left', 9); pushAt(HW, 'pt', 2, 6, 'up', 3);
    assert.deepEqual(pos(HW, 'ptS2'), at('pt', 2, 2));
    pushAt(HW, 'pt', 8, 1, 'down', 3); pushAt(HW, 'pt', 9, 5, 'left', 6); pushAt(HW, 'pt', 2, 4, 'down', 3);
    assert.deepEqual(pos(HW, 'ptS1'), at('pt', 2, 8));
    pushAt(HW, 'pt', 8, 8, 'right', 1); pushAt(HW, 'pt', 10, 9, 'up', 3); pushAt(HW, 'pt', 9, 5, 'right', 6); pushAt(HW, 'pt', 16, 6, 'up', 3);
    assert.deepEqual(pos(HW, 'ptS3'), at('pt', 16, 2));
    HW.step(5);
    go(HW, 'pt', 16, 7); HW.face('down'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.keys('strayhouse'), 1, 'the key');
    noErrors(HW);
});

test('the Bridge Garden: three into the trench, the fourth over it onto the plate: the key', () => {
    const HW = game();
    enter(HW, 'bg', 1, 5);
    pushAt(HW, 'bg', 6, 3, 'down', 1); pushAt(HW, 'bg', 5, 5, 'right', 3);
    pushAt(HW, 'bg', 3, 1, 'down', 3); pushAt(HW, 'bg', 2, 5, 'right', 7);
    pushAt(HW, 'bg', 3, 8, 'up', 2); pushAt(HW, 'bg', 2, 5, 'right', 8);
    for (const x of [9, 10, 11]) assert.ok(!HW.G.map.kind(...at('bg', x, 5)).pit, 'filled ' + x);
    pushAt(HW, 'bg', 5, 9, 'up', 3); pushAt(HW, 'bg', 4, 5, 'right', 11); pushAt(HW, 'bg', 16, 4, 'down', 2);
    assert.deepEqual(pos(HW, 'bgS4'), at('bg', 16, 7), 'on the plate');
    HW.step(5);
    go(HW, 'bg', 16, 3); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.equal(HW.Inv.keys('strayhouse'), 1, 'the key');
    /* and the pile in the corner drops spares */
    go(HW, 'bg', 13, 5); go(HW, 'bg', 2, 1); HW.face('left'); HW.press('act', 1); HW.step(10);
    assert.ok(HW.G.map.at(...at('bg', 2, 2)), 'a spare');
    noErrors(HW);
});

test('a stray that filled a hole is gone for good: not back next time', () => {
    const HW = game();
    enter(HW, 'po', 9, 9);
    pushAt(HW, 'po', 9, 6, 'up', 2);
    enter(HW, 'po', 9, 9);
    assert.ok(!thing(HW, 'poStray'), 'gone');
    noErrors(HW);
});

test('the Washhouse: two stones in, the tub hooked over, paddled across: the lamp lit', () => {
    const HW = game();
    enter(HW, 'wh', 18, 5);
    pushAt(HW, 'wh', 15, 2, 'down', 2); pushAt(HW, 'wh', 16, 5, 'left', 3);
    pushAt(HW, 'wh', 15, 8, 'up', 2); pushAt(HW, 'wh', 16, 5, 'left', 4);
    assert.ok(!HW.G.map.kind(...at('wh', 11, 5)).water, 'two filled');
    go(HW, 'wh', 11, 5); HW.face('left'); HW.Inv.equipped = 'hook'; HW.press('tool', 1); HW.step(60);
    const tub = thing(HW, 'whTub');
    assert.deepEqual([tub.tx, tub.ty], at('wh', 10, 5), 'the tub, hooked over');
    HW.hold('left'); HW.step(16); HW.release(); HW.step(4);
    HW.Inv.equipped = 'paddle';
    const p = HW.player(); for (let i = 0; i < 1000 && p.tx > at('wh', 6, 5)[0]; i++) { HW.hold(['tool', 'left']); HW.step(1); } HW.release(); HW.step(20);
    HW.hold('left'); HW.step(16); HW.release(); HW.step(4);
    go(HW, 'wh', 2, 4); HW.face('up'); HW.press('act', 1); HW.step(5);
    assert.ok(thing(HW, 'whLever').on, 'the lever');
    noErrors(HW);
});

test('the Mending Room: two needled straight onto plates; the third needled out, unpicked, pushed: the lamp lit', () => {
    const HW = game();
    HW.Inv.keyCount.strayhouse = 2;
    HW.Inv.stitches = [];
    enter(HW, 'sh', 18, 5); HW.hold('right'); HW.step(40); HW.release(); HW.step(30);
    const stitch = moves => { const names = { U: 'up', D: 'down', L: 'left', R: 'right' }; HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(2); for (const m of moves) { HW.hold(names[m]); HW.step(2); HW.release(); HW.step(8); } HW.press('tool', 1); HW.step(30); };
    go(HW, 'md', 1, 4); HW.face('right'); stitch('LLL');
    assert.deepEqual(pos(HW, 'mdS1'), at('md', 2, 4));
    go(HW, 'md', 16, 4); HW.face('left'); stitch('RRR');
    assert.deepEqual(pos(HW, 'mdS2'), at('md', 15, 4));
    go(HW, 'md', 9, 9); HW.face('up'); stitch('DRDR');
    assert.deepEqual(pos(HW, 'mdS3'), at('md', 11, 9));
    /* pushed, it'd only come back: unpick it, then it's a stray again */
    go(HW, 'md', 10, 9); HW.face('right'); HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(3); HW.skipTalk(1); HW.step(5);
    assert.ok(!thing(HW, 'mdS3').ret, 'a stray again');
    HW.push('right', 5); HW.step(10);
    assert.deepEqual(pos(HW, 'mdS3'), at('md', 16, 9));
    HW.step(5);
    go(HW, 'md', 17, 3); go(HW, 'md', 17, 2); HW.face('up'); HW.press('act', 1); HW.step(5);
    assert.ok(thing(HW, 'mdLever').on, 'the lever');
    noErrors(HW);
});

test('the Stair Hall: two strays up the column of holes: a Heart Patch; the stairs open with both lamps lit', () => {
    const HW = game();
    enter(HW, 'sh', 9, 9);
    pushAt(HW, 'sh', 16, 7, 'left', 2); pushAt(HW, 'sh', 13, 8, 'up', 4);
    pushAt(HW, 'sh', 5, 7, 'right', 7); pushAt(HW, 'sh', 13, 8, 'up', 5);
    go(HW, 'sh', 13, 2); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.patches >= 1, 'a Heart Patch');
    assert.ok(!thing(HW, 'shStairs').open, 'shut');
    HW.Progress.setAreaFlag('strayhouse', 'lever:whLever', true); HW.Progress.setAreaFlag('strayhouse', 'lever:mdLever', true);
    enter(HW, 'sh', 9, 5); HW.step(5);
    assert.ok(thing(HW, 'shStairs').open, 'open');
    noErrors(HW);
});

test('the Pile: it shoves after you; boxed in on all four sides it bursts; three times and it comes apart; Linnet\'s room', () => {
    const HW = game();
    HW.G.cheats.god = true;
    enter(HW, 'pl', 9, 9); HW.skipTalk(); HW.step(5);
    const pile = HW.G.map.ents.find(e => e.kind === 'pile'), a = HW.G.map, Block = HW.global('Block');
    assert.equal(pile.state, 'go', 'awake');
    /* round 1, as a person would: wait in a corner nook, slip out of its slit as it comes, and while it strains after
       you in there, push a stray up across the nook's open side */
    go(HW, 'pl', 1, 1);
    assert.ok(until(HW, () => pile.tx === R.pl[0] + 2 && pile.ty === 1 && !pile.mv, 900), 'it comes after you, up to the nook');
    go(HW, 'pl', 1, 4);
    assert.ok(until(HW, () => pile.tx === R.pl[0] + 1 && pile.ty === 1 && pile.state === 'strain', 200), 'into the nook after you, and stuck');
    go(HW, 'pl', 3, 5); HW.push('up', 2); HW.step(5);
    assert.ok(until(HW, () => pile.hp === 2, 200), 'boxed in: it bursts');
    HW.step(80);
    for (let round = 1; round < 3 && pile.alive; round++) {
        /* (the other two rounds: the strays set round it) */
        until(HW, () => !pile.mv && pile.state !== 'heave', 200);
        const sides = [[pile.tx - 1, pile.ty], [pile.tx + 2, pile.ty], [pile.tx, pile.ty - 1], [pile.tx, pile.ty + 2]];
        for (const [x, y] of sides) if (!a.at(x, y) && !a.kind(x, y).solid && !(HW.player().tx === x && HW.player().ty === y)) a.add(new Block(x, y, { stray: true }));
        const hp = pile.hp;
        assert.ok(until(HW, () => pile.hp < hp || !pile.alive, 200), `round ${round + 1}: boxed, it bursts`);
        HW.step(80);
    }
    assert.ok(!pile.alive && HW.Progress.flag('sh_pile'), 'it comes apart');
    for (let i = 0; i < 10; i++) { HW.skipTalk(); HW.step(20); }
    go(HW, 'pl', 1, 5); go(HW, 'lr', 9, 6); HW.face('down'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.items.bracelet, "Linnet's bracelet");
    noErrors(HW);
});

test('with the bracelet, the end has Gran put it on', () => {
    const HW = loadGame(); HW.preset('afterDrift'); HW.step(10); HW.skipTalk();
    HW.Inv.items.bracelet = 1;
    const lines = [];
    const D = HW.global('Dialog'), open0 = D.open;
    D.open = function (who, text, opts) { lines.push(String(text)); return open0.call(this, who, text, opts); };
    HW.global('Script').run(HW.global('Ending').unwinding());
    for (let i = 0; i < 300 && !HW.Progress.flag('unwound'); i++) { HW.skipTalk(); HW.step(10); }
    assert.ok(lines.some(l => l.includes('bracelet')), 'the bracelet scene');
    noErrors(HW);
});
