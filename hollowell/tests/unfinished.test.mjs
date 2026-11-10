// The Unfinished House (O2, src/78_unfinished.js): its door; chalk planks sewn real with the Needle (three at once, a
// fourth undoes the oldest); every room's solution; Mr Ives's walk; the Long Hook; the Guild pin.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const R = { fr: [20, 33], ha: [20, 22], lg: [0, 22], fs: [0, 11], lb: [40, 22], ga: [20, 11] };
const at = (r, x, y) => [R[r][0] + x, R[r][1] + y];
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const go = (HW, r, x, y) => assert.ok(HW.walkTo(...at(r, x, y)), `walk to ${r} ${x},${y} (at ${HW.player().tx},${HW.player().ty})`);
const piece = (HW, id) => HW.G.map.ents.find(e => e.kind === 'chalk' && e.id === id);
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const pushAt = (HW, r, x, y, d, n) => { go(HW, r, x, y); HW.push(d, n); HW.step(10); };
/* the Needle at what's in front: sews the nearest chalk; at a sewn one, choice (0 unpick, 1 sew the next along) */
const sew = (HW, d, choice) => { HW.face(d); HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(3); if (choice !== undefined) HW.skipTalk(choice); HW.step(5); };
function game(preset = 'afterD8') {
    const HW = loadGame(); HW.preset(preset); HW.step(10); HW.skipTalk();
    HW.Inv.maxHp = HW.Inv.hp = 36; HW.Inv.stitches = [];
    return HW;
}
const enter = (HW, r, x, y) => { HW.warp('unfinished', ...at(r, x, y)); HW.step(20); HW.skipTalk(); HW.step(5); };

test('the door: Mr Ives lets in a Maker (the Needle, and the Guild pin or the Loom done); Gundry gives the pin for all six marks', () => {
    const HW = game('afterD7');
    HW.warp('hollow', 120, 46); HW.step(10); HW.face('up'); HW.press('act', 1); HW.step(3); HW.skipTalk(); HW.step(30);
    assert.equal(HW.G.map.id, 'hollow', 'not yet');
    for (const h of ['tidy', 'kiln', 'mill', 'belfry', 'slumber', 'marionette']) HW.Progress.set('sig:' + h);
    HW.warp('underside', 9, 5); HW.step(10);
    const g = HW.G.map.ents.find(e => e.kind === 'npc' && e.who === 'gundry');
    HW.global('Script').run(HW.global('UNDER_TALK').gundry(g)); HW.step(3); HW.skipTalk();
    assert.ok(HW.Inv.items.guildpin && HW.Progress.flag('s06'), 'the Guild pin');
    HW.warp('hollow', 120, 46); HW.step(10); HW.face('up'); HW.press('act', 1); HW.step(3); HW.skipTalk(); HW.step(60); HW.skipTalk();
    assert.equal(HW.G.map.id, 'unfinished', 'in');
    noErrors(HW);
});

test('the Front Room: the chalk plank sewn with the Needle is a real bridge', () => {
    const HW = game();
    enter(HW, 'fr', 9, 9);
    go(HW, 'fr', 9, 6); sew(HW, 'up');
    assert.ok(piece(HW, 'frBridge').sewn, 'sewn');
    go(HW, 'fr', 9, 2);
    noErrors(HW);
});

test('the Long Gap: four planks, three stitches: the fourth undoes the oldest (behind you); the west lamp', () => {
    const HW = game();
    enter(HW, 'lg', 18, 5);
    go(HW, 'lg', 14, 5); sew(HW, 'left'); sew(HW, 'left', 1);
    assert.ok(piece(HW, 'lgA').sewn && piece(HW, 'lgB').sewn, 'two from the bank');
    go(HW, 'lg', 11, 5); sew(HW, 'left', 1);
    assert.ok(piece(HW, 'lgC').sewn);
    go(HW, 'lg', 8, 5); sew(HW, 'left', 1);
    assert.ok(piece(HW, 'lgD').sewn && !piece(HW, 'lgA').sewn, 'the fourth undoes the first');
    go(HW, 'lg', 2, 7); HW.face('down'); HW.press('act', 1); HW.step(5);
    assert.ok(HW.G.map.find('lgLever').on, 'the lever');
    noErrors(HW);
});

test('sewing a fourth while standing on the oldest drops you through it', () => {
    const HW = game();
    enter(HW, 'lg', 18, 5);
    go(HW, 'lg', 14, 5); sew(HW, 'left'); sew(HW, 'left', 1);
    go(HW, 'lg', 11, 5); sew(HW, 'left', 1);
    go(HW, 'lg', 13, 5); HW.face('left');
    /* (from on the first plank, the next unsewn in line is past the others: out of reach; so the far one, by hand) */
    HW.Inv.equipped = 'needle'; HW.global('Needle').sewChalk(HW.player(), piece(HW, 'lgD')); HW.step(5);
    assert.ok(HW.player().state !== 'normal' || HW.player().tx !== at('lg', 13, 5)[0], 'down it went');
    noErrors(HW);
});

test('the Far Shelf: over four planks side by side (stand on the second when the fourth undoes the first); back by re-sewing in order', () => {
    const HW = game();
    enter(HW, 'fs', 2, 9);
    go(HW, 'fs', 9, 5); sew(HW, 'right'); sew(HW, 'right', 1); sew(HW, 'right', 1);
    go(HW, 'fs', 11, 5); sew(HW, 'right', 1);
    assert.ok(piece(HW, 'fsD').sewn && !piece(HW, 'fsA').sewn);
    go(HW, 'fs', 17, 4); HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.patches >= 1, 'the Heart Patch');
    /* back: onto D and C; from C unpick B and sew it again (newest now); onto B; sew A (C comes undone, behind) */
    go(HW, 'fs', 12, 5); sew(HW, 'left', 0);
    assert.ok(!piece(HW, 'fsB').sewn, 'B unpicked');
    sew(HW, 'left'); assert.ok(piece(HW, 'fsB').sewn, 'and sewn again');
    go(HW, 'fs', 11, 5); sew(HW, 'left');
    assert.ok(piece(HW, 'fsA').sewn && !piece(HW, 'fsC').sewn);
    go(HW, 'fs', 9, 5);
    assert.equal(HW.player().state, 'normal');
    noErrors(HW);
});

test('the Loading Bay: one gap filled for good with a stray, three planks sewn, the other stray pushed over onto the plate: the east lamp', () => {
    const HW = game();
    enter(HW, 'lb', 1, 5);
    pushAt(HW, 'lb', 5, 2, 'down', 2); pushAt(HW, 'lb', 4, 5, 'right', 3);
    assert.ok(!HW.G.map.kind(...at('lb', 8, 5)).pit, 'one gap filled');
    go(HW, 'lb', 8, 5); sew(HW, 'right'); sew(HW, 'right', 1); sew(HW, 'right', 1);
    assert.ok(['lbB', 'lbC', 'lbD'].every(id => piece(HW, id).sewn));
    pushAt(HW, 'lb', 5, 8, 'up', 2); pushAt(HW, 'lb', 4, 5, 'right', 10);
    assert.deepEqual([HW.G.map.find('lbS2').tx, HW.G.map.find('lbS2').ty], at('lb', 15, 5), 'on the plate');
    HW.step(5);
    assert.ok(HW.global('Signals').eval(HW.G.map, 'ufE'), 'the east lamp');
    noErrors(HW);
});

test('the Gallery: both lamps lit, the stairs; Mr Ives walks to his chair over planks sewn ahead of him: the Long Hook', () => {
    const HW = game();
    HW.Progress.setAreaFlag('unfinished', 'lever:lgLever', true);
    enter(HW, 'ha', 9, 2);
    const B = HW.global('Block'); HW.G.map.add(new B(...at('lb', 15, 5), { stray: true })); HW.step(5);
    assert.ok(HW.G.map.find('ufStairs').open, 'the stairs open');
    go(HW, 'ga', 9, 8);
    const w = HW.G.map.find('ivesWalk');
    for (const x of [3, 6, 9, 12, 15]) {
        assert.ok(until(HW, () => w.tx === at('ga', x - 1, 0)[0] && !w.mv, 900), `Mr Ives at the gap at ${x}`);
        go(HW, 'ga', x, 7); sew(HW, 'up');
        assert.ok(until(HW, () => w.tx > at('ga', x, 0)[0], 300), `over the plank at ${x}`);
    }
    assert.ok(until(HW, () => HW.Progress.flag('ives_done'), 400), 'at his chair');
    for (let i = 0; i < 10; i++) { HW.skipTalk(); HW.step(20); }
    assert.ok(HW.Inv.items.longhook, 'the Long Hook');
    noErrors(HW);
});

test('a plank undone under Mr Ives drops him back to the start (no harm done)', () => {
    const HW = game();
    for (const k of ['lgLever']) HW.Progress.setAreaFlag('unfinished', 'lever:' + k, true);
    enter(HW, 'ga', 9, 8);
    const w = HW.G.map.find('ivesWalk');
    until(HW, () => w.tx === at('ga', 2, 0)[0] && !w.mv, 900);
    go(HW, 'ga', 3, 7); sew(HW, 'up');
    until(HW, () => w.tx === at('ga', 3, 0)[0] && !w.mv, 200);
    go(HW, 'ga', 3, 7); sew(HW, 'up', 0);
    assert.equal(w.tx, at('ga', 1, 0)[0], 'back at the start');
    noErrors(HW);
});

test('sewn planks stay sewn through a save and load; the Long Hook reaches ten tiles', () => {
    const HW = game();
    enter(HW, 'fr', 9, 9);
    go(HW, 'fr', 9, 6); sew(HW, 'up');
    const s = HW.Save.snapshot();
    const H2 = loadGame(); H2.global('Game').load(H2.Save.migrate(JSON.parse(JSON.stringify(s)))); H2.step(40);
    assert.ok(H2.G.map.ents.find(e => e.kind === 'chalk' && e.id === 'frBridge').sewn, 'still sewn');
    /* the Long Hook: an eyelet nine tiles off */
    const H3 = game(); H3.Inv.items.longhook = 1;
    H3.warp('lab2', 2, 2); H3.step(5);
    const E = H3.global('Eyelet'), a = H3.G.map, p = H3.player();
    const x0 = p.tx, y0 = p.ty;
    let ok = false;
    for (const d of ['right', 'down']) {
        const dx = d === 'right' ? 1 : 0, dy = d === 'down' ? 1 : 0, tx = x0 + dx * 9, ty = y0 + dy * 9;
        let clear = true; for (let i = 1; i <= 9; i++) { const k = a.kind(x0 + dx * i, y0 + dy * i); if (k.solid || a.at(x0 + dx * i, y0 + dy * i)) clear = false; }
        if (!clear) continue;
        a.add(new E(tx, ty, {}));
        H3.face(d); H3.Inv.equipped = 'hook'; H3.press('tool', 1); H3.step(80);
        ok = Math.abs(p.tx - tx) + Math.abs(p.ty - ty) === 1; break;
    }
    assert.ok(ok, 'reeled over nine tiles');
    noErrors(H2); noErrors(H3);
});
