// Regression tests for the bug hunt over the optional Houses, the late secrets and the Great Spool's antechambers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const SR = { pl: [20, 0] };
const UR = { lb: [40, 22], ga: [20, 11], dh: [20, 22] };
const GS = { climb: [40, 11], ferry: [20, 11], mill: [0, 11] };
const rel = R => (r, x, y) => [R[r][0] + x, R[r][1] + y];
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
function game(preset = 'afterD8') {
    const HW = loadGame(); HW.preset(preset); HW.step(10); HW.skipTalk();
    HW.Inv.maxHp = HW.Inv.hp = 36; HW.Inv.stitches = []; HW.Progress.set('strayhouse_open');
    return HW;
}
const reload = HW => { const s = HW.Save.snapshot(); const H2 = loadGame(); H2.global('Game').load(H2.Save.migrate(JSON.parse(JSON.stringify(s)))); H2.step(40); return H2; };
const sew = (HW, d, choice) => { HW.face(d); HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(3); if (choice !== undefined) HW.skipTalk(choice); HW.step(5); };
const pushAt = (HW, x, y, d, n) => { assert.ok(HW.walkTo(x, y), `walk to ${x},${y}`); HW.push(d, n); HW.step(10); };
const step = (HW, d) => { HW.hold(d); HW.step(16); HW.release(); HW.step(4); };
const paddleTo = (HW, x, y) => { const p = HW.player(); for (let i = 0; i < 2000 && (p.tx !== x || p.ty !== y); i++) { HW.hold(['tool', p.tx < x ? 'right' : p.tx > x ? 'left' : p.ty < y ? 'down' : 'up']); HW.step(1); } HW.release(); HW.step(20); };

test('1: the ferry cut on the far side, and Wren back on the near side without it: the Hookline brings it over', () => {
    const at = rel(GS), HW = game('afterDrift');
    HW.warp('greatspool', ...at('climb', 1, 5)); HW.step(30); HW.skipTalk();
    HW.walkTo(...at('ferry', 14, 5)); step(HW, 'left'); HW.Inv.equipped = 'paddle'; paddleTo(HW, ...at('ferry', 7, 5)); step(HW, 'left');
    HW.walkTo(...at('ferry', 6, 5)); HW.face('right'); HW.Inv.equipped = 'shears'; HW.press('tool', 1); HW.step(3); HW.skipTalk(); HW.step(30);
    const H2 = reload(HW), f = H2.G.map.find('gsFerry');
    assert.deepEqual([f.tx, f.ty], at('ferry', 7, 5), 'left on the far side');
    assert.ok(H2.player().tx > at('ferry', 13, 0)[0], 'and Wren on the near side');
    H2.walkTo(...at('ferry', 14, 5)); H2.face('left'); H2.Inv.equipped = 'hook'; H2.press('tool', 1); H2.step(120);
    assert.ok(f.tx >= at('ferry', 12, 0)[0], 'pulled over');
    step(H2, 'left'); H2.Inv.equipped = 'paddle'; paddleTo(H2, ...at('ferry', 7, 5)); step(H2, 'left');
    assert.ok(H2.walkTo(...at('mill', 16, 5)), 'on to the Knot');
    noErrors(HW); noErrors(H2);
});

test('3: the Hookline bounces off Mr Ives; moved off his walk, he goes back to the start', () => {
    const at = rel(UR), HW = game();
    HW.Progress.setAreaFlag('unfinished', 'lever:lgLever', true);
    HW.warp('unfinished', ...at('ga', 9, 8)); HW.step(20); HW.skipTalk(); HW.step(5);
    const w = HW.G.map.find('ivesWalk');
    until(HW, () => w.tx === at('ga', 2, 0)[0] && !w.mv, 900);
    HW.walkTo(...at('ga', 2, 8)); HW.face('up'); HW.Inv.equipped = 'hook'; HW.press('tool', 1); HW.step(60);
    assert.equal(w.ty, w.home[1], 'still on his walk');
    w.warpTo(w.tx, w.ty + 2); HW.step(5);
    assert.deepEqual([w.tx, w.ty], [w.home[0], w.home[1]], 'back to the start');
    until(HW, () => HW.Progress.flag('ives_done'), 1500);
    assert.ok(!HW.Progress.flag('ives_done'), 'no planks, no chair');
    noErrors(HW);
});

test('4/10: the Pile never shuts a tile round Wren slipping out of a nook; its Heartstitch lands on the floor', () => {
    const at = rel(SR);
    for (let d = 16; d <= 32; d += 2) {
        const HW = game();
        HW.warp('strayhouse', ...at('pl', 9, 9)); HW.step(20); HW.skipTalk(); HW.step(5);
        const pile = HW.G.map.ents.find(e => e.kind === 'pile'), p = HW.player();
        HW.walkTo(...at('pl', 1, 1));
        until(HW, () => pile.tx === SR.pl[0] + 2 && pile.ty === 1 && !pile.mv, 900);
        HW.step(d); HW.hold('down'); HW.step(40); HW.release(); HW.step(200);
        const y0 = p.y; HW.hold('down'); HW.step(60); HW.release();
        assert.ok(!(p.y === y0 && p.ty < 5), 'not frozen after ' + d);
        noErrors(HW);
    }
    const HW = game(), a0 = (() => { HW.warp('strayhouse', ...at('pl', 9, 9)); HW.step(20); HW.skipTalk(); return HW.G.map; })();
    const pile = a0.ents.find(e => e.kind === 'pile');
    pile.claim(false); pile.tx = SR.pl[0] + 1; pile.ty = SR.pl[1] + 1; pile.claim(true);
    HW.global('Script').run(HW.global('StrayHouse').pileDown(pile)); HW.step(60); HW.skipTalk(); HW.step(10);
    const h = a0.ents.find(e => e.id === 'pileHeart');
    assert.ok(h && !a0.kind(h.x >> 4, h.y >> 4).solid, 'on the floor');
    noErrors(HW);
});

test('5/11: a fourth stitch pushing out a chalk one is fine; a stray given its place on a plank drops when the plank goes', () => {
    const at = rel(UR), HW = game();
    HW.warp('unfinished', ...at('lb', 1, 5)); HW.step(20); HW.skipTalk(); HW.step(5);
    HW.walkTo(...at('lb', 7, 5)); sew(HW, 'right'); sew(HW, 'right', 1); sew(HW, 'right', 1);
    HW.walkTo(...at('lb', 5, 4)); HW.face('up'); HW.Inv.equipped = 'needle';
    HW.press('tool', 1); HW.step(3); HW.hold('left'); HW.step(2); HW.release(); HW.step(8); HW.press('tool', 1); HW.step(30);
    noErrors(HW);
    const H2 = game();
    H2.warp('unfinished', ...at('lb', 1, 5)); H2.step(20); H2.skipTalk(); H2.step(5);
    const a = H2.G.map, s1 = a.find('lbS1');
    H2.walkTo(s1.tx, s1.ty - 1); H2.push('down', 2); H2.step(10);
    H2.walkTo(...at('lb', 7, 5)); sew(H2, 'right');
    H2.walkTo(...at('lb', 4, 5)); H2.face('right'); H2.Inv.equipped = 'needle';
    H2.press('tool', 1); H2.step(3); for (let i = 0; i < 3; i++) { H2.hold('right'); H2.step(2); H2.release(); H2.step(8); } H2.press('tool', 1); H2.step(60);
    assert.deepEqual([s1.tx, s1.ty], at('lb', 8, 5), 'on the plank');
    H2.walkTo(...at('lb', 7, 5)); sew(H2, 'right', 0); H2.step(200);
    assert.ok(s1.removed && !a.kind(...at('lb', 8, 5)).pit, 'dropped in, and filled it');
    noErrors(H2);
});

test('7: things in the valley go where their routes say (Biscuit comes by the crawlspace)', () => {
    const HW = game();
    HW.warp('hollow', 106, 67); HW.step(5); HW.skipTalk();
    const cat = HW.G.map.ents.find(e => e.kind === 'critter' && e.who === 'biscuit');
    assert.ok(cat.route.every(([x, y]) => x >= 64 && x < 128 && y >= 40 && y < 80), 'in the town');
    noErrors(HW);
});

test('8: the Drafting Hall stairs stay open once both lamps were lit', () => {
    const at = rel(UR), HW = game();
    HW.Progress.setAreaFlag('unfinished', 'lever:lgLever', true);
    HW.warp('unfinished', ...at('lb', 1, 5)); HW.step(20); HW.skipTalk(); HW.step(5);
    pushAt(HW, ...at('lb', 5, 2), 'down', 2); pushAt(HW, ...at('lb', 4, 5), 'right', 3);
    HW.walkTo(...at('lb', 8, 5)); sew(HW, 'right'); sew(HW, 'right', 1); sew(HW, 'right', 1);
    pushAt(HW, ...at('lb', 5, 8), 'up', 2); pushAt(HW, ...at('lb', 4, 5), 'right', 10);
    HW.step(5);
    assert.ok(HW.global('Signals').eval(HW.G.map, 'ufW&ufE'), 'both lamps');
    HW.walkTo(...at('dh', 9, 3)); HW.step(30);
    const H2 = reload(HW);
    assert.ok(H2.G.map.find('ufStairs').open, 'still open after a load');
    noErrors(HW); noErrors(H2);
});
