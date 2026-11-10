// Regression tests for the bug hunt over the optional Houses, the late secrets and the Great Spool's rooms.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const SR = { pl: [20, 0] };
const UR = { lb: [40, 22], ga: [20, 11], dh: [20, 22] };
const GS = { slumber: [0, 11] };
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

test('1: the Night Ferry\'s raft sent under the arch with nobody and nothing aboard: the room\'s brake brings it back, and so does a reload', () => {
    const at = rel(GS), HW = game('afterDrift');
    HW.warp('greatspool', ...at('slumber', 18, 5)); HW.step(30); HW.skipTalk();
    HW.walkTo(...at('slumber', 13, 7)); step(HW, 'left');
    HW.Inv.equipped = 'paddle'; paddleTo(HW, ...at('slumber', 5, 7)); paddleTo(HW, ...at('slumber', 5, 5)); step(HW, 'right');
    HW.step(300);
    const f = HW.G.map.find('gsSRaft');
    assert.deepEqual([f.tx, f.ty], at('slumber', 5, 2), 'gone under the arch alone');
    const H2 = reload(HW), f2 = H2.G.map.find('gsSRaft');
    assert.deepEqual([f2.tx, f2.ty], at('slumber', 12, 7), 'a reload: back on its place');
    assert.ok(HW.walkTo(...at('slumber', 17, 6)), 'to the brake'); HW.face('right'); HW.press('act', 1); HW.step(30);
    assert.deepEqual([f.tx, f.ty], at('slumber', 12, 7), 'the brake: back on its place');
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

/* ---------- the second look, at the newest pieces ---------- */
test('new 1/2: a thread cut mid-step lets go of the tile it was leaving; the drum never trips on a thing cut in flight', () => {
    const HW = loadGame(); HW.preset('afterReveal2'); HW.step(10); HW.skipTalk();
    HW.Progress.set('north_gate'); HW.Progress.set('gundry_r2'); HW.Inv.giveTool('shears'); HW.Inv.keyCount.loom = 1;
    const at = (x, y) => [40 + x, 11 + y];
    HW.warp('loom', ...at(6, 5)); HW.step(30); HW.skipTalk();
    const a = HW.G.map, w = a.find('brW1');
    HW.walkTo(...at(4, 4)); HW.push('up', 1); HW.step(5);
    HW.walkTo(...at(5, 2)); HW.push('left', 1); HW.step(5);
    HW.walkTo(...at(3, 3)); HW.push('up', 1); HW.step(5);
    HW.walkTo(...at(5, 2)); HW.face('left');
    until(HW, () => w.ret.state === 'returning' && w.mv && w.mv.fx === at(3, 0)[0] && w.mv.fy === at(0, 2)[1], 900);
    HW.Inv.equipped = 'shears'; HW.press('tool', 1); HW.step(3); HW.skipTalk();
    assert.ok(!w.ret, 'cut');
    assert.ok(a.at(...at(3, 2)) !== w, 'no ghost on the tile it left');
    noErrors(HW);
    /* a thing in the drum's flight is out of sight: the Shears don't find it */
    const S = HW.global('Shears');
    w.hiddenYank = true; w.inert = true;
    assert.ok(!S.taut(a, w.tx, w.ty + 1, false), 'not while hidden');
});

test('new 3: no raft gets alongside the far isle', () => {
    const HW = game();
    HW.warp('hollow', 128 + 4, 80 + 10); HW.step(10); HW.skipTalk();
    const a = HW.G.map;
    for (let x = 12; x <= 15; x++) for (const y of [8, 11]) assert.ok(a.kind(128 + x, 80 + y).low, 'rocks round it');
    assert.ok(!a.freeForThing(128 + 13, 80 + 11, a.find('mwLakeRaft')), 'not for a raft');
    noErrors(HW);
});

test('new 4: the fourth Making starts with its gates shut every time', () => {
    const HW = loadGame(); HW.preset('afterD7'); HW.step(10); HW.skipTalk();
    for (const n of [1, 2, 3]) HW.Progress.set('making' + n);
    HW.warp('making4', 3, 16); HW.step(10); HW.skipTalk();
    const doors = () => HW.G.map.ents.filter(e => e.kind === 'door');
    for (const d of doors()) { d.open = true; d.openedOnce = true; }
    HW.step(5);
    HW.warp('making4', 3, 16); HW.step(10); HW.skipTalk();
    assert.ok(doors().every(d => !d.open), 'shut again');
    noErrors(HW);
});

test('new 5/6/7: tied things are slack; a thread drawn tight is tight to the Shears; cut over deep water, it sinks', () => {
    const HW = loadGame(); HW.preset('afterReveal2'); HW.step(10); HW.skipTalk();
    HW.Progress.set('north_gate'); HW.Progress.set('gundry_r2'); HW.Inv.giveTool('shears');
    const at = (x, y) => [40 + x, 33 + y];
    HW.warp('loom', ...at(14, 1)); HW.step(20); HW.skipTalk();
    const S = HW.global('Shears'), a = HW.G.map, w1 = a.find('hgW1');
    assert.ok(!S.taut(a, ...at(10, 4), true), 'tied out: slack');
    HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(10);
    assert.ok(!S.taut(a, ...at(10, 4), true), 'rung, but still tied: slack');
    HW.walkTo(...at(16, 2)); HW.face('right'); HW.press('act', 1); HW.step(2);
    until(HW, () => w1.ret.state === 'away' && w1.ret.timer < 30, 60);
    assert.ok(S.taut(a, ...at(10, 4), true) === w1, 'about to go: drawn tight, and tight to the Shears');
    /* the trench turned to deep water under it: cut there, it sinks (and fills it) */
    until(HW, () => w1.tx >= at(6, 0)[0], 300);
    const x = w1.tx; a.setCell(x, at(0, 4)[1], '~');
    S.cut(w1);
    assert.ok(w1.removed && !a.kind(x, at(0, 4)[1]).deep, 'sank, and filled it');
    noErrors(HW);
});
