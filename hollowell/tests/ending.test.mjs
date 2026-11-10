// The last act's end: the fog and the Drift, the Great Pull, the Great Spool (six Knots, six great threads), the
// Unwinding and after (src/74_drift.js, 75_greatspool.js, 76_ending.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';
import { slackAndCut } from './legs.mjs';

const R = { top: [20, 0], slumber: [0, 11], climb: [20, 11], mario: [40, 11], mill: [0, 22], hub: [20, 22], belfry: [40, 22], tidy: [0, 33], foot: [20, 33], kiln: [40, 33] };
const at = (r, x, y) => [R[r][0] + x, R[r][1] + y];
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
const pos = HW => `${HW.G.map.id} ${HW.player().tx},${HW.player().ty}`;
const walk = (HW, x, y, max) => assert.ok(HW.walkTo(x, y, max), `walk to ${x},${y} (at ${pos(HW)})`);
const go = (HW, r, x, y) => walk(HW, ...at(r, x, y));
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const act = (HW, d) => { HW.face(d); HW.press('act', 1); HW.step(3); HW.skipTalk(); HW.step(5); };
const HOUSES = ['tidy', 'kiln', 'mill', 'belfry', 'slumber', 'marionette'];
function game(preset) { const HW = loadGame(); HW.preset(preset); HW.step(10); HW.skipTalk(); HW.Inv.maxHp = HW.Inv.hp = 36; return HW; }

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

test('the Great Spool: six Knots in six rooms round its foot, each wound with its Maker\'s thread; untied in any order, the goal counting them; then the way up opens', () => {
    const HW = game('afterDrift');
    HW.warp('greatspool', ...at('foot', 9, 8)); HW.step(60); HW.skipTalk();
    const a = HW.G.map;
    assert.equal(HW.global('Music').playing, HW.global('SONGS').greatspool ? 'greatspool' : 'pull', 'its own music');
    assert.match(HW.Progress.goal, /0 of 6/);
    const knots = a.ents.filter(e => e.kind === 'knotlock');
    assert.deepEqual([...knots.map(k => k.house)].sort(), [...HOUSES].sort(), 'a Knot for each House');
    for (const k of knots) assert.equal(a.def.themeAt(k.tx, k.ty), 'spool_' + k.house, k.house + ': its room in its Maker\'s thread');
    /* untied where each is tied, in no particular order (the rooms themselves: tests/greatspool.test.mjs) */
    const spots = { marionette: ['mario', 18, 3, 'up'], slumber: ['slumber', 6, 2, 'down'], belfry: ['belfry', 17, 3, 'up'], mill: ['mill', 3, 8, 'left'], kiln: ['kiln', 16, 8, 'right'], tidy: ['tidy', 2, 2, 'up'] };
    let n = 0;
    for (const [h, [r, x, y, d]] of Object.entries(spots)) {
        assert.ok(!HW.find('gsTop').open, 'the way up shut');
        HW.warp('greatspool', ...at(r, x, y)); HW.step(20); act(HW, d);
        assert.ok(HW.Progress.flag('untie:' + h), h + ' untied');
        n++; if (n < 6) assert.match(HW.Progress.goal, new RegExp(n + ' of 6'));
    }
    assert.ok(HW.Progress.flag('spool_all'), 'all six');
    HW.warp('greatspool', ...at('climb', 9, 9)); HW.step(30);
    assert.ok(HW.find('gsTop').open, 'the way up open');
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

test('after: everyone walks where they like; Gran and Linnet on the bench by her gate; Linnet gone from the Drift; saves and loads', () => {
    const HW = game('afterEnding');
    HW.step(600);
    const npcs = HW.G.map.ents.filter(e => e.kind === 'npc');
    const gran = npcs.find(e => e.who === 'gran'), lin = npcs.find(e => e.who === 'linnet');
    assert.deepEqual([gran.tx, gran.ty, gran.seated], [78, 53, true], 'Gran on the bench by her gate');
    assert.deepEqual([lin.tx, lin.ty, lin.seated], [80, 53, true], 'and Linnet');
    assert.ok(HW.G.map.ents.some(e => e.solid && e.solid.length === 3 && e.tx === 78 && e.ty === 53), 'the bench');
    assert.ok(npcs.filter(e => e.who !== 'gran' && e.who !== 'linnet').every(e => e.route && !e.ret), 'everyone else free, on a round of their own');
    assert.ok(!npcs.some(e => e.dragged), 'nobody dragged');
    /* what they say now */
    /* (folk walk about now: they can be in the way a moment) */
    for (let i = 0; i < 5 && !HW.walkTo(78, 54, 3000); i++) HW.step(30);
    walk(HW, 78, 54); HW.face('up'); HW.press('act', 1); HW.step(3);
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
