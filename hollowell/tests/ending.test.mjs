// The last act's end: the fog and the Drift, the Great Pull, the Great Spool (six Knots, six great threads), the
// Unwinding and after (src/74_drift.js, 75_greatspool.js, 76_ending.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const R = { foot: [40, 33], nursery: [20, 33], slumber: [0, 33], gallery: [60, 33], mario: [80, 33], hub: [40, 22], parlour: [20, 22], tidy: [0, 22], crossing: [60, 22], kiln: [80, 22], climb: [40, 11], ferry: [20, 11], mill: [0, 11], loft: [60, 11], belfry: [80, 11], top: [40, 0] };
const at = (r, x, y) => [R[r][0] + x, R[r][1] + y];
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const pos = HW => `${HW.G.map.id} ${HW.player().tx},${HW.player().ty}`;
const walk = (HW, x, y, max) => assert.ok(HW.walkTo(x, y, max), `walk to ${x},${y} (at ${pos(HW)})`);
const go = (HW, r, x, y) => walk(HW, ...at(r, x, y));
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const act = (HW, d) => { HW.face(d); HW.press('act', 1); HW.step(3); HW.skipTalk(); HW.step(5); };
const HOUSES = ['tidy', 'kiln', 'mill', 'belfry', 'slumber', 'marionette'];
function game(preset) { const HW = loadGame(); HW.preset(preset); HW.step(10); HW.skipTalk(); HW.Inv.maxHp = HW.Inv.hp = 36; return HW; }
const paddleTo = (HW, x, y) => { const p = HW.player(); for (let i = 0; i < 2000 && (p.tx !== x || p.ty !== y); i++) { HW.hold(['tool', p.tx < x ? 'right' : p.tx > x ? 'left' : p.ty < y ? 'down' : 'up']); HW.step(1); } HW.release(); HW.step(20); };
const step = (HW, d) => { HW.hold(d); HW.step(16); HW.release(); HW.step(4); };

test('the fog: your own thread cut, through into the Drift; Linnet; and home on foot, into the Great Pull', () => {
    const HW = game('afterD8');
    HW.warp('hollow', 67, 19); HW.step(10);
    HW.face('left'); HW.Inv.equipped = 'shears'; HW.press('tool', 1); HW.step(3); HW.skipTalk(); HW.step(5);
    assert.ok(HW.Progress.flag('cut_self'), 'cut');
    const hp = HW.Inv.hp; HW.player().hurt(2, 0, 0); HW.step(30);
    assert.equal(HW.Inv.hp, hp, 'nothing left to unravel');
    HW.hold('left'); until(HW, () => HW.G.map.id === 'drift', 200); HW.release(); HW.step(40); HW.skipTalk();
    assert.equal(HW.G.map.id, 'drift', 'out the other side');
    /* the stream: a stray boulder pushed into it, and over */
    walk(HW, 44, 16, 30000); HW.push('left', 3); HW.step(20);
    assert.ok(!HW.G.map.kind(40, 16).water, 'the stream filled');
    walk(HW, 18, 22, 30000); act(HW, 'up'); HW.skipTalk();
    assert.ok(HW.Progress.flag('met_linnet') && HW.Progress.flag('great_pull'), 'Linnet, and the Pull');
    walk(HW, 59, 19, 30000);
    HW.hold('right'); until(HW, () => HW.G.map.id === 'hollow', 200); HW.release(); HW.step(40);
    assert.equal(HW.G.map.id, 'hollow', 'home, on foot');
    noErrors(HW);
});

test('the Great Pull: the town dragged round the Well, its south side open; down the Well', () => {
    const HW = game('afterDrift');
    HW.walkTo(95, 60, 40000); HW.step(10); HW.skipTalk(); HW.step(5);
    walk(HW, 95, 60, 40000);
    const dragged = HW.G.map.ents.filter(e => e.dragged);
    assert.ok(dragged.length >= 8, 'the townsfolk, pulled');
    assert.ok(dragged.every(e => e.tx >= 64 && e.tx < 128 && e.ty >= 40 && e.ty < 80), 'only those in town');
    act(HW, 'up'); HW.step(60); HW.skipTalk();
    assert.equal(HW.G.map.id, 'greatspool', 'down the Well');
    noErrors(HW);
});

test('the Great Spool: six Knots, each through a room that pairs its House with a later tool; the way up opens', () => {
    const HW = game('afterDrift');
    HW.warp('greatspool', ...at('foot', 9, 8)); HW.step(30); HW.skipTalk();
    const stitch = moves => { const names = { U: 'up', D: 'down', L: 'left', R: 'right' }; HW.Inv.equipped = 'needle'; HW.press('tool', 1); HW.step(2); for (const m of moves) { HW.hold(names[m]); HW.step(2); HW.release(); HW.step(8); } HW.press('tool', 1); HW.step(40); };
    /* the Nursery Stair: the Bedroll laid on this side, hooked over; the Slumberhouse's Knot: drop, untie, and Homeward
       flies you all the way back along your trace, over the ledge and the gap, to the Bedroll */
    go(HW, 'nursery', 14, 5); HW.Inv.equipped = 'bedroll'; HW.press('tool', 1); HW.step(3); HW.skipTalk();
    go(HW, 'nursery', 11, 5); HW.face('left'); HW.Inv.equipped = 'hook'; HW.press('tool', 1); HW.step(60);
    assert.ok(HW.player().tx <= at('nursery', 5, 0)[0], 'hooked over');
    go(HW, 'slumber', 9, 5); HW.hold('down'); HW.step(40); HW.release(); HW.step(10);
    go(HW, 'slumber', 9, 7); act(HW, 'down');
    assert.ok(HW.Progress.flag('untie:slumber'));
    HW.Inv.equipped = 'bedroll'; HW.hold('tool'); HW.step(24); HW.release(); HW.step(200); HW.skipTalk();
    assert.deepEqual([HW.player().tx, HW.player().ty], at('nursery', 14, 5), 'home to the Bedroll');
    /* the Puppet Gallery: walk the puppet near its plate, let go, and give it the plate for a home */
    go(HW, 'gallery', 3, 4); HW.face('up'); HW.Inv.equipped = 'crossbar'; HW.press('tool', 1); HW.step(2);
    const pup = HW.G.map.find('gsGPuppet');
    for (let i = 0; i < 6; i++) { HW.hold('left'); until(HW, () => pup.mv, 20); until(HW, () => !pup.mv, 30); HW.release(); HW.step(1); }
    assert.deepEqual([pup.tx, pup.ty], at('gallery', 3, 1));
    HW.press('tool', 1); HW.step(2);
    stitch('L');
    assert.ok(until(HW, () => HW.G.map.find('gsPgGate').open, 120), 'the gate, for good');
    HW.step(300); assert.ok(HW.G.map.find('gsPgGate').open, 'still open');
    /* the Marionette Hall's Knot */
    go(HW, 'mario', 7, 2); HW.face('down'); HW.Inv.equipped = 'crossbar'; HW.press('tool', 1); HW.step(2);
    const mp = HW.G.map.find('gsPuppet');
    const walkP = (d, k) => { for (let i = 0; i < k; i++) { HW.hold(d); until(HW, () => mp.mv, 20); until(HW, () => !mp.mv, 30); HW.release(); HW.step(1); } };
    walkP('right', 6); walkP('up', 2); walkP('right', 1);
    HW.press('tool', 1); HW.step(2);
    go(HW, 'mario', 5, 8); act(HW, 'down');
    assert.ok(HW.Progress.flag('untie:marionette'));
    go(HW, 'mario', 5, 6);
    /* the Tidy Parlour: the block onto its plate, then cut: it stays */
    go(HW, 'hub', 1, 5); go(HW, 'parlour', 17, 4); HW.push('down', 3); HW.step(5);
    go(HW, 'parlour', 17, 7); HW.face('down'); HW.Inv.equipped = 'shears'; HW.press('tool', 1); HW.step(3); HW.skipTalk();
    HW.step(400);
    assert.ok(HW.G.map.find('gsTaGate').open, 'held open for good');
    /* the Tidyhouse's Knot */
    go(HW, 'tidy', 18, 5); go(HW, 'tidy', 15, 7); HW.push('left', 2); HW.step(10);
    go(HW, 'tidy', 12, 8); HW.push('up', 5); HW.step(5);
    go(HW, 'tidy', 3, 5); act(HW, 'left');
    assert.ok(HW.Progress.flag('untie:tidy'));
    /* the Kiln Crossing: carry the pot over the water on the raft; break it: its shards fly home over the water, past the charm */
    go(HW, 'tidy', 18, 5); go(HW, 'parlour', 18, 5); go(HW, 'hub', 18, 5);
    go(HW, 'crossing', 3, 4); HW.face('up'); HW.press('act', 1); HW.step(20);
    assert.ok(HW.player().carry, 'the pot, carried');
    go(HW, 'crossing', 5, 5); step(HW, 'right');
    HW.Inv.equipped = 'paddle'; paddleTo(HW, ...at('crossing', 13, 5)); step(HW, 'right');
    HW.face('right'); HW.press('act', 1); HW.step(120);
    assert.ok(HW.global('Signals').eval(HW.G.map, 'gsKc'), 'the charm struck');
    /* the Kiln's Knot */
    go(HW, 'kiln', 9, 5); HW.face('right'); HW.Inv.equipped = 'hook'; HW.press('tool', 1); HW.step(60);
    go(HW, 'kiln', 15, 5); act(HW, 'right');
    assert.ok(HW.Progress.flag('untie:kiln'));
    go(HW, 'kiln', 13, 8); HW.face('left'); HW.Inv.equipped = 'hook'; HW.press('tool', 1); HW.step(60);
    /* back over the crossing on the raft */
    go(HW, 'crossing', 14, 5); step(HW, 'left'); HW.Inv.equipped = 'paddle'; paddleTo(HW, ...at('crossing', 6, 5)); step(HW, 'left');
    /* the Ferry Landing: over, and the ferry cut (or it goes home without you) */
    go(HW, 'hub', 9, 1); go(HW, 'climb', 1, 5); go(HW, 'ferry', 14, 5);
    step(HW, 'left'); HW.Inv.equipped = 'paddle'; paddleTo(HW, ...at('ferry', 6, 5)); step(HW, 'left'); go(HW, 'ferry', 5, 5);
    HW.face('right'); HW.Inv.equipped = 'shears'; HW.press('tool', 1); HW.step(3); HW.skipTalk();
    HW.step(400);
    const ferry = HW.G.map.find('gsFerry');
    assert.deepEqual([ferry.tx, ferry.ty], at('ferry', 6, 5), 'the ferry stays');
    /* the Millrace's Knot */
    go(HW, 'mill', 14, 5);
    step(HW, 'left'); HW.Inv.equipped = 'paddle'; paddleTo(HW, ...at('mill', 6, 5)); step(HW, 'left');
    go(HW, 'mill', 3, 5); act(HW, 'left');
    assert.ok(HW.Progress.flag('untie:mill'));
    go(HW, 'mill', 5, 5); step(HW, 'right'); paddleTo(HW, ...at('mill', 13, 5)); step(HW, 'right');
    go(HW, 'ferry', 5, 5); step(HW, 'right'); paddleTo(HW, ...at('ferry', 13, 5)); step(HW, 'right');
    /* the Bell Loft: ring the sleeper awake (it goes home), then needle it onto the plate */
    go(HW, 'climb', 18, 5); go(HW, 'loft', 9, 4); HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(120);
    const sl = HW.G.map.find('gsBlSleeper');
    assert.deepEqual([sl.tx, sl.ty], at('loft', 12, 1), 'awake, and home');
    go(HW, 'loft', 12, 4); HW.face('up'); stitch('RRR');
    assert.ok(until(HW, () => HW.G.map.find('gsBlGate').open, 200), 'on the plate');
    /* the Belfry's Knot */
    go(HW, 'belfry', 6, 5); HW.Inv.equipped = 'bell'; HW.press('tool', 1); HW.step(120);
    go(HW, 'belfry', 16, 4); act(HW, 'up');
    assert.ok(HW.Progress.flag('spool_all'), 'all six');
    /* the Climb, now the Pull throws things across it: up by the pillars' lee */
    for (const [x, y] of [[15, 9], [15, 8], [15, 7], [3, 7], [3, 6], [3, 5], [15, 5], [15, 4], [15, 3], [3, 3], [3, 2], [3, 1], [9, 1]]) go(HW, 'climb', x, y);
    HW.hold('up'); HW.step(60); HW.release(); HW.step(40); HW.skipTalk();
    assert.ok(HW.Progress.flag('spool_met'), 'up to Gran');
    noErrors(HW);
});

test('the Climb: something flying knocks you back down to its foot', () => {
    const HW = game('afterDrift');
    for (const h of HOUSES) HW.Progress.set('untie:' + h);
    HW.Progress.set('spool_all');
    HW.warp('greatspool', ...at('climb', 9, 9)); HW.step(20); HW.skipTalk();
    const p = HW.player();
    let knocked = false;
    for (let i = 0; i < 40 && !knocked; i++) { HW.walkTo(...at('climb', 9, 8)); HW.walkTo(...at('climb', 9, 7)); if (HW.Progress.flag('junk_hit')) knocked = true; HW.walkTo(...at('climb', 9, 9)); }
    assert.ok(knocked, 'knocked back');
    noErrors(HW);
});

function atTop() {
    const HW = game('afterDrift');
    for (const h of HOUSES) HW.Progress.set('untie:' + h);
    HW.Progress.set('spool_all');
    HW.warp('greatspool', ...at('climb', 9, 2)); HW.step(30); HW.skipTalk();
    HW.walkTo(...at('climb', 9, 1)); HW.hold('up'); HW.step(60); HW.release(); HW.step(40); HW.skipTalk(); HW.step(20); HW.skipTalk();
    return HW;
}

/* at the top: carry a crate under a great thread near its post, let the Pull drag it along (slack), and cut */
function slackAndCut(HW, post, origin) {
    const a = HW.G.map, p = HW.player();
    const crate = a.ents.find(e => e.kind === 'crate' && !e.removed && !e.hiddenYank && e.ret && e.tx === e.ret.mx && e.ty === e.ret.my);
    assert.ok(crate, 'a crate on its shelf');
    for (let k = 0; k < 4 && !HW.walkTo(crate.tx, crate.ty - 1); k++) HW.step(20);
    HW.face('down'); HW.press('act', 1); HW.step(20);
    assert.ok(p.carry, 'carrying a crate');
    /* a tile under the thread, two along from the post, with a free tile beside it to stand on */
    const t = post.tiles[1] || post.tiles[0];
    const spots = [[t[0], t[1] + 1, 'up'], [t[0], t[1] - 1, 'down'], [t[0] - 1, t[1], 'right'], [t[0] + 1, t[1], 'left']];
    let placed = false;
    for (const [x, y, d] of spots) {
        if (a.kind(x, y).solid || a.at(x, y) || post.under(x, y)) continue;
        if (!HW.walkTo(x, y)) continue;
        HW.face(d); HW.press('act', 1); HW.step(10); placed = !p.carry; if (placed) break;
    }
    assert.ok(placed, 'crate set down under the thread');
    for (let i = 0; i < 200 && post.slack <= 0; i++) HW.step(1);
    assert.ok(post.slack > 0, 'dragged along it: slack');
    const sx = post.tx + (post.tx < origin[0] + 10 ? 1 : -1), d = post.tx < origin[0] + 10 ? 'left' : 'right';
    assert.ok(HW.walkTo(sx, post.ty), 'beside the post');
    HW.face(d); HW.Inv.equipped = 'shears'; HW.press('tool', 1); HW.step(10); HW.skipTalk();
}
const finish = HW => { for (let i = 0; i < 120 && !HW.Progress.flag('unwound'); i++) { HW.skipTalk(); HW.step(20); } for (let i = 0; i < 400 && (HW.G.hideHud || HW.G.credits); i++) { HW.skipTalk(); HW.step(20); } };

test('the top: six great threads cut, Gran lets go; the Unwinding, the credits, and the free valley after', () => {
    const HW = atTop();
    assert.ok(HW.Progress.flag('spool_met'));
    HW.G.cheats.god = true;
    /* too taut to cut, at first */
    const posts = HW.G.map.ents.filter(e => e.kind === 'greatpost');
    go(HW, 'top', 2, 2); HW.face('left'); HW.Inv.equipped = 'shears'; HW.press('tool', 1); HW.step(5); HW.skipTalk();
    assert.ok(!HW.Progress.flag('great:tidy'), 'taut');
    for (const post of posts) slackAndCut(HW, post, R.top);
    assert.ok(HOUSES.every(h => HW.Progress.flag('great:' + h)), 'all six');
    finish(HW);
    assert.ok(HW.Progress.flag('unwound'), 'the Unwinding');
    assert.equal(HW.G.map.id, 'hollow');
    assert.ok(!HW.G.hideHud && !HW.G.credits, 'back to play after the credits');
    assert.equal(HW.Progress.goal, 'The valley is yours. Carry on.');
    noErrors(HW);
});

test('a save in the middle of the end: the top room takes it up again', () => {
    const HW = game('afterDrift');
    for (const h of HOUSES) { HW.Progress.set('untie:' + h); HW.Progress.set('great:' + h); }
    for (const f of ['spool_all', 'spool_met', 'pull_seen']) HW.Progress.set(f);
    const s = HW.Save.snapshot();
    const H2 = loadGame(); H2.global('Game').load(H2.Save.migrate(JSON.parse(JSON.stringify(s)))); H2.step(5);
    H2.warp('greatspool', ...at('top', 9, 9)); H2.step(30);
    assert.ok(H2.G.map.ents.some(e => e.who === 'gran'), 'Gran is there');
    finish(H2);
    assert.ok(H2.Progress.flag('unwound'), 'and the end goes on');
    noErrors(H2);
});

test('after: everyone walks where they like; Gran and Linnet in the garden; Linnet gone from the Drift; saves and loads', () => {
    const HW = game('afterEnding');
    HW.step(600);
    const npcs = HW.G.map.ents.filter(e => e.kind === 'npc');
    const gran = npcs.find(e => e.who === 'gran'), lin = npcs.find(e => e.who === 'linnet');
    assert.deepEqual([gran.tx, gran.ty], [78, 51], 'Gran by her house');
    assert.deepEqual([lin.tx, lin.ty], [79, 51], 'and Linnet');
    assert.ok(npcs.filter(e => e.who !== 'gran' && e.who !== 'linnet').every(e => e.route && !e.ret), 'everyone else free, on a round of their own');
    assert.ok(!npcs.some(e => e.dragged), 'nobody dragged');
    /* what they say now */
    /* (folk walk about now: they can be in the way a moment) */
    for (let i = 0; i < 5 && !HW.walkTo(77, 51, 3000); i++) HW.step(30);
    walk(HW, 77, 51); HW.face('right'); HW.press('act', 1); HW.step(3);
    const D = HW.global('Dialog');
    assert.ok(D.active && D.who === 'gran' && HW.global('AFTER_LINES').gran.some(l => l.startsWith(D.pages[0][0].slice(0, 12))), 'Gran says something new');
    HW.skipTalk();
    const s = HW.Save.snapshot();
    const H2 = loadGame(); H2.global('Game').load(H2.Save.migrate(JSON.parse(JSON.stringify(s)))); H2.step(10);
    assert.equal(H2.G.map.id, 'hollow');
    assert.ok(H2.G.map.ents.some(e => e.who === 'linnet'), 'loads with Linnet home');
    H2.warp('drift', 30, 20); H2.step(10);
    assert.ok(!H2.G.map.ents.some(e => e.who === 'linnet'), 'not in the Drift any more');
    noErrors(HW); noErrors(H2);
});

test('S35: the Well says something different in each act; S11: the seed in Gran\'s garden', () => {
    const HW = game('afterD1');
    const read = () => { walk(HW, 95, 60, 40000); act(HW, 'up'); HW.skipTalk(); };
    read(); assert.ok(HW.Progress.flag('motto:act1'));
    HW.Progress.set('reveal1'); read(); assert.ok(HW.Progress.flag('motto:act2'));
    HW.Progress.set('reveal2'); read(); assert.ok(HW.Progress.flag('motto:act3'));
    HW.Progress.set('unwound'); read(); assert.ok(HW.Progress.flag('motto:act4'));
    assert.ok(HW.Progress.flag('s35'), 'all four read');
    HW.Inv.items.driftseed = 1;
    walk(HW, 74, 51, 40000); act(HW, 'left'); HW.skipTalk();
    assert.ok(HW.Progress.flag('seed_planted') && !HW.Inv.items.driftseed, 'planted');
    noErrors(HW);
});

test('the Drift: no falling home (you climb out where you fell); its map is drawn as you walk it', () => {
    const HW = game('afterDrift');
    HW.warp('drift', 38, 16); HW.step(10);
    HW.hold('right'); HW.step(60); HW.release(); HW.step(60);
    assert.equal(HW.G.map.id, 'drift', 'still in the Drift');
    assert.equal(HW.player().state, 'normal');
    noErrors(HW);
});

test('Linnet\'s bracelet shown to Gran at the Spool: she lets three great threads go herself', () => {
    const HW = atTop();
    HW.Inv.items.bracelet = 1;
    const gran = HW.G.map.ents.find(e => e.who === 'gran');
    HW.global('Script').run(HW.global('Story').talk(gran), { name: 'talk' }); HW.step(3); HW.skipTalk(0);
    assert.equal(HOUSES.filter(h => HW.Progress.flag('great:' + h)).length, 3, 'three let go');
    noErrors(HW);
});
