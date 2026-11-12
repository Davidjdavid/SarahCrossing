// Fix round E, part 1 (AI blind solver F, a heuristic evaluation, not a playtest): the eighth House's rooms and the
// Little Houses. The Loom's goal kept up with the way there; the HUD steps back from the Needle's reach; a hook on a
// sleeper, and the Bell rung under a Little House, say so; the Needle's let-go notice from another place; the Larder's
// sleepers show where a ring would send them; in the Makings the nibbler gives up on a cornered boy, Tuck peers at
// what a button's under (and it glints), and the signs and the last nudge say what really happens.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const toasts = HW => HW.global('UI').toasts.map(t => t.s).concat(HW.G.pendingToast ? [HW.G.pendingToast.s || HW.G.pendingToast] : []);
const said = (HW, s) => toasts(HW).some(t => t.includes(s));
const stitch = (HW, moves) => { const names = { U: 'up', D: 'down', L: 'left', R: 'right' }; HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(2); for (const m of moves) { HW.hold(names[m]); HW.step(2); HW.release(); HW.step(8); } HW.press('tool', 1); HW.step(30); };
const LR = { th: [20, 33], sr: [20, 11], lr: [60, 22], wr: [40, 22] };
const at = (r, x, y) => [LR[r][0] + x, LR[r][1] + y];
function afterR2() { const HW = loadGame(); HW.preset('afterReveal2'); HW.step(10); HW.skipTalk(); HW.Inv.maxHp = HW.Inv.hp = 36; return HW; }

/* ================= the Loom (finding 63) ================= */
test('the Loom\'s goal: the counterweight\'s line goes once the gate is open (an older save that kept it is put right), then "inside the Loom", then the Shears found', () => {
    const HW = afterR2();
    const G = HW.global('LOOM_GOALS');
    HW.warp('underside', 31, 5); HW.step(20); HW.skipTalk();
    HW.walkTo(31, 4); HW.face('up'); HW.press('act', 1); HW.step(3); HW.skipTalk();
    assert.equal(HW.Progress.goal, G.gate, "Gundry: the gate's counterweight");
    HW.walkTo(56, 16); HW.face('right'); stitch(HW, 'D');
    assert.ok(HW.Progress.flag('north_gate'), 'the gate open');
    assert.equal(HW.Progress.goal, G.road, 'up the road to the Loom, now');
    HW.Progress.set('loom_open');
    HW.warp('loom', 29, 42); HW.step(20); HW.skipTalk();
    assert.equal(HW.Progress.goal, G.inside, 'inside');
    HW.Progress.set('loom_shuttle');
    HW.warp('loom', ...at('sr', 9, 3)); HW.step(30); HW.skipTalk();
    HW.face('up'); HW.press('act', 1); HW.skipTalk();
    assert.ok(HW.Inv.has('shears'));
    assert.equal(HW.Progress.goal, G.shears, 'the Shears found');
    /* an older save, the gate long open and the counterweight's line still up: put right as it next goes anywhere */
    const H2 = afterR2();
    H2.Progress.set('north_gate'); H2.Progress.set('gundry_r2'); H2.Progress.setGoal(G.gate);
    H2.warp('hollow', 96, 44); H2.step(10);
    assert.equal(H2.Progress.goal, G.road);
    noErrors(HW); noErrors(H2);
});

test('the HUD steps back from the Needle\'s reach (the counterweight in the Seams, its reach up under the tool box), and from the Seams\' chest once it\'s there', () => {
    const HW = afterR2();
    HW.Progress.set('gundry_r2');
    HW.warp('underside', 55, 16); HW.step(20); HW.skipTalk();
    const UI = HW.global('UI'), Game = HW.global('Game'), covers = () => { Game.render(); HW.G.onScreen = [HW.player()]; UI._hc = undefined; return UI.hudCovers(); };
    assert.equal(covers(), false, 'nothing under it (the room\'s own things left out)');
    HW.walkTo(55, 16); HW.face('right'); HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(2);
    assert.ok(HW.global('Needle').st, 'aiming the Needle');
    assert.ok(covers(), 'its reach goes up under the tool box: the HUD steps back');
    HW.press('act', 1); HW.step(3);
    assert.equal(covers(), false, 'put away');
    /* the chest by the counterweight, once the peepholes have all been looked through */
    HW.Progress.set('s23'); HW.warp('underside', 55, 16); HW.step(20); HW.skipTalk();
    const ch = HW.G.map.find('seamsPatch');
    assert.ok(ch && !ch.hidden, 'the chest is there');
    Game.render(); HW.G.onScreen = [HW.player(), ch]; UI._hc = undefined;
    assert.ok(UI.hudCovers(), 'and the HUD steps back from it');
    noErrors(HW);
});

test('the HUD steps back, faded right down, from anything that matters under it, wherever it is: the Parlour\'s far gate, the Sun, Moon, Star gate, the Reach\'s top sleeper, the Bell Frame\'s gate (blind solver E)', () => {
    const spots = [
        ['afterD1', 'tidy', [40 + 2, 22 + 5], 'pN'],
        ['afterD2', 'kiln', [40 + 0, 22 + 5], 'smsN'],
        ['afterD3', 'belfry', [0 + 17, 22 + 5], 'reS1'],
        ['afterD3', 'belfry', [40 + 2, 11 + 5], 'fbGate'],
    ];
    for (const [preset, house, [x, y], id] of spots) {
        const HW = loadGame(); HW.preset(preset); HW.step(10); HW.skipTalk();
        HW.warp(house, x, y); HW.step(30); HW.skipTalk(); HW.step(5);
        const UI = HW.global('UI'), Game = HW.global('Game'), Cam = HW.global('Cam'), a = HW.G.map, e = a.find(id);
        assert.ok(e && !e.hidden, `${house} ${id} there`);
        Game.render();
        /* (it is under the panel: the test means something) */
        const [b0, , b2, b3] = UI.hudBoxes()[1], sx = e.tx * 16 - Cam.x, sy = e.ty * 16 - Cam.y;
        assert.ok(sx + 16 > b0 && sx < b2 && sy < b3, `${house} ${id} under the top-right panel (${sx},${sy})`);
        /* that thing alone steps it back */
        HW.G.onScreen = [HW.player(), e]; UI._hc = undefined;
        assert.ok(UI.hudCovers(), `${house} ${id}: the HUD steps back`);
        HW.G.onScreen = [HW.player()]; UI._hc = undefined;
        assert.ok(!UI.hudCovers(), `${house} ${id}: (nothing else here moves it)`);
        /* and in play it fades right down */
        for (let i = 0; i < 30; i++) { HW.step(1); Game.render(); }
        assert.ok(UI.hudA <= HW.global('HUD_BACK') + 0.01, `${house} ${id}: faded to ${UI.hudA}`);
        noErrors(HW);
    }
});

test('the Larder: the Hookline thrown at a sleeper says it\'s asleep; with the Bell in hand, the sleepers a ring would reach show the way it would send them; the note says so', () => {
    const HW = afterR2();
    HW.Progress.set('north_gate'); HW.Progress.set('gundry_r2'); HW.Inv.giveTool('shears');
    HW.warp('loom', ...at('lr', 2, 5)); HW.step(30); HW.skipTalk();
    const a = HW.G.map, L = HW.global('LoomHouse');
    assert.match(a.ents.find(e => e.kind === 'sign' && a.roomAt(e.tx, e.ty) === a.roomAt(...at('lr', 3, 5))).text, /GO HOME THE WAY THEY WERE DRAGGED/);
    HW.walkTo(...at('lr', 10, 7)); HW.face('right'); HW.Inv.equipped = 'hook'; HW.press('tool', 1); HW.step(40);
    assert.ok(said(HW, 'fast asleep'), 'a line, not just a z');
    HW.Inv.equipped = 'shears'; HW.step(2);
    assert.equal(L.wakePaths(a).length, 0, 'only with the Bell in hand');
    HW.Inv.equipped = 'bell'; HW.step(2);
    assert.deepEqual([...L.wakePaths(a).map(e => e.id)].sort(), ['lrW1', 'lrW2'], 'both, in reach');
    HW.walkTo(...at('lr', 1, 9)); HW.step(2);
    assert.ok(!L.wakePaths(a).some(e => e.id === 'lrW2'), 'out of reach, not shown');
    noErrors(HW);
});

test("the Needle's let-go notice says so when the stitch it undoes is somewhere else: the Seams' counterweight, let go by a fourth stitch in the Loomwood", () => {
    const HW = afterR2();
    HW.Inv.stitches = [];
    HW.warp('underside', 31, 5); HW.step(20); HW.skipTalk();
    HW.walkTo(31, 4); HW.face('up'); HW.press('act', 1); HW.step(3); HW.skipTalk();
    HW.walkTo(56, 16); HW.face('right'); stitch(HW, 'D');
    HW.warp('hollow', 96, 44); HW.step(20); HW.skipTalk();
    HW.walkTo(64 + 54, 17, 30000); HW.face('right'); stitch(HW, 'RR');
    HW.walkTo(64 + 39, 11, 30000); HW.face('left'); stitch(HW, 'LL');
    assert.ok(!said(HW, 'lets go'), 'three stitches: nothing let go yet');
    HW.walkTo(64 + 24, 20, 30000); HW.face('up'); stitch(HW, 'UU');
    assert.ok(said(HW, 'your oldest lets go: the iron weight in the Seams'), toasts(HW).join(' | '));
    assert.equal(HW.Inv.stitches.length, 3);
    assert.ok(HW.Progress.flag('north_gate'), 'the gate stays open');
    noErrors(HW);
});

/* ================= the Makings (finding 64) ================= */
function making(n) {
    const HW = loadGame();
    HW.preset('afterD7'); HW.step(10); HW.skipTalk();
    HW.Inv.stitches = [];
    for (let i = 1; i < n; i++) HW.Progress.set('making' + i);
    const e = HW.global('MAKINGS')[n - 1].entry || { x: 3, y: 16 };
    HW.warp('making' + n, e.x, e.y); HW.step(10); HW.skipTalk();
    return HW;
}
const under = (HW, x, y, side = 'down') => { const [dx, dy] = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[side]; assert.ok(HW.walkTo(x + dx, y + 11 + dy)); HW.face({ down: 'up', up: 'down', left: 'right', right: 'left' }[side]); };
const tug = HW => { HW.press('act', 1); HW.step(3); };
const knot = HW => { HW.hold('act'); HW.step(20); HW.release(); HW.step(2); };

test('the Makings: the Bell rung underneath does nothing up above, and says so, once', () => {
    const HW = making(4);
    const s = HW.G.map.find('m4H');
    HW.walkTo(5, 16); HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(50);
    assert.ok(said(HW, 'stops at the boards overhead'), 'said');
    assert.ok(s.knotted, 'nothing up there moved');
    HW.global('UI').toasts.length = 0;
    HW.press('tool', 1); HW.step(50);
    assert.ok(!said(HW, 'stops at the boards overhead'), 'once');
    noErrors(HW);
});

test('Making 3: the nibbler that has the boy cornered gives up after a few seconds and potters off, every time (not when the dice say)', () => {
    const HW = making(3);
    HW.G.rng = () => 0.9;                  /* (pottering, it would stand just where it is, for good) */
    const a = HW.G.map, t = a.find('tuck'), N = a.find('m3Nib');
    /* the boy in the plate room's top-left corner, the nibbler two steps off */
    const place = (e, x, y) => { a.unplace(e, e.tx, e.ty); e.tx = x; e.ty = y; e.x = x * 16; e.y = y * 16; a.place(e, x, y); };
    place(t, 21, 1); t.state = 'go'; t.wait = 0; t.cur = null;
    N.x = 23 * 16 + 8; N.y = 3 * 16 + 10; N.wdir = 4;
    assert.ok(until(HW, () => t.state === 'scared', 120), 'scared, in the corner');
    assert.ok(until(HW, () => t.tx !== 21 || t.ty !== 1, 60 * 10), `out of the corner within ten seconds (still at ${t.tx},${t.ty}, ${t.state})`);
    noErrors(HW);
});

test('the third Aha, found by looking: Tuck stops and peers at what a button is hidden under, the first time he is in its room, and it glints through the boards now and then; the button still only his if it jumps', () => {
    const HW = making(1);
    const a = HW.G.map, t = a.find('tuck'), tr = a.ents.find(e => e.kind === 'treasure');
    assert.ok(until(HW, () => t.bubble === 'q', 60), 'a question over his head');
    assert.match((t._said && t._said.text) || '', /shiny|glinting/i, 'he says so');
    assert.equal(t.dir, HW.global('dirOf')(tr.tx - t.tx, tr.ty - t.ty), 'turned to the pot');
    assert.ok(tr.showThrough, 'its glint is drawn over the boards, seen from below');
    HW.step(300);
    assert.ok(!HW.global('Making').cur.ahas.has('found'), 'not found by looking at it');
    under(HW, 2, 1, 'down'); tug(HW);
    assert.ok(until(HW, () => HW.global('Making').cur.ahas.has('found'), 500), 'made to jump, he finds it');
    noErrors(HW);
});

test('the Little Houses\' words say what happens: Making 3\'s and Making 7\'s first signs say how things behave, not what to do; Making 5\'s says a knot undone waits its while and a tug sends it home now; Making 8\'s nudge says undo the knot (and that works)', () => {
    const signs = n => { const HW = making(n); return HW.G.map.ents.filter(e => e.kind === 'sign').map(e => e.text); };
    assert.ok(!signs(3).some(s => /Needle/.test(s)), 'Making 3: no Needle named');
    assert.ok(signs(3).some(s => /can't shift/.test(s)), "Making 3: heavy things he can't shift");
    assert.ok(!signs(7).some(s => /STITCH|stitch/.test(s)), 'Making 7: no stitch named');
    assert.ok(signs(7).some(s => /in its place, he leaves be/.test(s)), 'Making 7: what Otto minds');
    /* Making 5: the tied bust, untied, waits its patience (it's away, let go); then a tug: home now */
    const HW = making(5);
    const B = HW.G.map.find('m5B');
    assert.ok(HW.G.map.ents.some(e => e.kind === 'sign' && /A knot undone, a thing waits its while/.test(e.text)));
    under(HW, 29, 6); tug(HW);
    assert.ok(!B.knotted, 'untied');
    HW.step(30);
    assert.equal(B.ret.state, 'away', 'it waits its while');
    tug(HW);
    assert.ok(until(HW, () => B.ret.state === 'home', 30), 'a tug: home now');
    /* Making 8's nudge */
    const H8 = making(8);
    const room = H8.G.map.rooms.find(r => r.name === 'Under the Grand Hall');
    assert.match(room.nudge.say, /Then undo the knot\./);
    noErrors(HW); noErrors(H8);
});
