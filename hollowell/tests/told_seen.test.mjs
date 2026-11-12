// Words that follow what's seen (fix round F, live run 3's picture reviews): a beaten foe's end still on screen while it's
// told (its pieces, its yarn, its thread down the cracks); a line about something said with it clear of the box; what a
// line says is there, there (a trap under a chest, a spool on its stand, a squirrel); the Great Marionette off on its march
// before that's said; at the Spool's top, Wren turned to Gran; the stick favour's thread a thread, gone once the Spool
// stops; the fair gate standing open; a touch of grey on Gundry.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const T = 16, W = 320, H = 180;
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const until = (HW, fn, max = 2000) => { for (let i = 0; i < max && !fn(); i++) HW.step(1); return fn(); };
/* talk through whatever's said, calling back once each page is shown in full (the first choice when asked) */
function lines(HW, onLine, max = 6000) {
    const D = HW.Dialog; let last = '';
    for (let n = 0; n < max && (D.active || HW.Script.blocking()); n++) {
        if (D.active && D.shown >= D.pageLen()) {
            const k = D.page + '|' + (D.pages[D.page] || []).join(' ');
            if (k !== last) { last = k; onLine((D.pages[D.page] || []).join(' ')); }
            if (D.choices && D.page === D.pages.length - 1) D.sel = 0;
            HW.press('act', 1);
        } else HW.step(1);
    }
}
/* a box in the world [x0, y0, x1, y1]: on the screen and clear of the box and its name tag, all but a sliver (most of
   it: the camera may still be easing the last pixel or two) */
function clearOnScreen(HW, [x0, y0, x1, y1]) {
    const Cam = HW.global('Cam'), rs = HW.Dialog.rects();
    let n = 0, ok = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const X = x - Cam.x, Y = y - Cam.y; n++;
        if (X >= 0 && Y >= 0 && X < W && Y < H && !rs.some(([a, b, c, d]) => X >= a && X < c && Y >= b && Y < d)) ok++;
    }
    return ok >= n * 0.85;
}
const tileBox = ([x, y], tall = 16) => [x * T, y * T + 16 - tall, x * T + 16, y * T + 16];

/* ---------------- each foe's end, while it's told ---------------- */
const FOES = {
    monger: ['tidy', e => e.type === 'monger', (HW, e) => e.die(), (HW, e) => HW.G.map.ents.some(q => q.kind === 'remains' && !q.removed && q.showing())],
    glazer: ['kiln', e => e.type === 'glazer', (HW, e) => { e.hp = 1; e.flash = 0; e.struck(null, 1, -1, true); }, (HW, e) => !e.alive && e.deadT < 200],
    kilnwyrm: ['kiln', e => e.type === 'kilnwyrm' || e.kind === 'kilnwyrm', (HW, e) => { e.hp = 1; e.flash = 0; e.struck(null, 1, -1, true); }, (HW, e) => e.pieces.showing() && !e.pieces.removed],
    snapjaw: ['millrace', e => e.type === 'snapjaw', (HW, e) => { e.hp = 1; e.hidden = false; e.state = 'swim'; e.bonk(null, 0); }, (HW, e) => e.remains.showing() && !e.remains.removed],
    grindle: ['millrace', e => e.kind === 'grindle', (HW, e) => { e.hp = 1; e.hurt(); }, (HW, e) => e.deadT < 240 && e.gears.showing()],
    clangor: ['belfry', e => e.type === 'clangor', (HW, e) => { e.hp = 1; e.flash = 0; e.state = 'stunned'; e.struck(HW.player(), 1, 0); }, (HW, e) => e.pieces.showing() && !e.pieces.removed],
    tollgrim: ['belfry', e => e.type === 'tollgrim', (HW, e) => { e.x = (e.hx - 1) * T + 8; e.y = (e.hy + 4) * T + 10; e.defeat(); }, (HW, e) => e.ball.showing() && !e.ball.removed],
    sloth: ['slumber', e => e.type === 'mothersloth', (HW, e) => { e.hp = 1; e.setArena(3, true); e.defeat(); }, (HW, e, l) => /^Board by board/.test(l) ? HW.Script.running('slothFloor') && e.far.some(([x, y]) => HW.G.map.kind(x, y).pit) && e.far.some(([x, y]) => !HW.G.map.kind(x, y).pit) : (e.yarnT || 0) < 220],
    tangle: ['spoolworks', e => e.kind === 'tangle', (HW, e) => e.defeat(), (HW, e) => e.runs.showing() && !e.runs.removed],
};
const SAID = { monger: /^The Dust Monger bursts/, glazer: /^The Glazer cracks/, kilnwyrm: /^The Kilnwyrm comes apart/, snapjaw: /^The Snapjaw rolls over/, grindle: /^Old Grindle's gears/, clangor: /^Clangor falls to pieces/, tollgrim: /^Tollgrim unravels/, sloth: /^Mother Sloth lets go|^Board by board/, tangle: /^The little knot|^slithers apart/ };
function foeAt(name) {
    const [area, is] = FOES[name];
    const HW = loadGame();
    HW.preset('afterD7'); HW.step(10); HW.skipTalk();
    HW.Inv.maxHp = HW.Inv.hp = 40; HW.G.cheats.god = true;
    for (const t of ['gloves', 'hook', 'paddle', 'bell', 'bedroll', 'crossbar']) HW.Inv.giveTool(t);
    for (const f of ['tidy_boss', 'kiln_boss', 'millrace_boss', 'belfry_boss', 'slumber_boss', 'spool_boss', 'tidy_monger', 'kiln_glazer', 'millrace_snapjaw', 'belfry_clangor', 'spool_cog']) delete HW.Progress.flags[f];
    HW.warp(area, 1, 1);
    let e = [...HW.G.map.ents, ...HW.G.map.walkers].find(is);
    const r = HW.G.map.roomAt(e.hx !== undefined ? e.hx : e.tx, e.hy !== undefined ? e.hy : e.ty);
    HW.warp(area, r.x + 9, r.y + r.h - 3); HW.step(60); HW.skipTalk(); HW.step(5); HW.skipTalk();
    e = [...HW.G.map.ents, ...HW.G.map.walkers].find(is);
    return [HW, e];
}
test('a beaten foe goes while its end is told: dust bunnies, a crumbling Glazer, pots down a crack, a ball of yarn down the race or under the bell, a sinking fish, pieces of armour, a feather and a floor coming back, thread down the cracks', () => {
    for (const name of Object.keys(FOES)) {
        const [HW, e] = foeAt(name), [, , beat, shown] = FOES[name];
        assert.ok(e, name + ' there');
        beat(HW, e);
        const seen = [];
        lines(HW, l => { if (SAID[name].test(l)) seen.push([l.slice(0, 24), !!shown(HW, e, l)]); });
        assert.ok(seen.length, name + ': its end told');
        for (const [l, ok] of seen) assert.ok(ok, `${name}: still to be seen as it's told: "${l}..."`);
        noErrors(HW);
    }
});

test('Mother Sloth: what each sentence of a new round tells of is clear of the box as it is said (the old boards along the bottom, the bedposts)', () => {
    const [HW, s] = foeAt('sloth');
    const SlumberFoes = HW.global('SlumberFoes'), seen = {};
    for (const hp of [2, 1]) {
        s.hp = hp; s.state = 'turn';
        HW.Script.run(SlumberFoes.slothTurn(s));
        lines(HW, l => {
            const b = s.boardsBox(), box = b.x0 !== undefined ? [b.x0, b.y0, b.x1, b.y1] : tileBox(b);
            if (/^Out past the stars/.test(l)) seen.boards = clearOnScreen(HW, box);
            if (/^She thumps the mattress again/.test(l)) seen.gone = clearOnScreen(HW, box);
            if (/^Only the bedposts/.test(l)) seen.posts = HW.G.map.ents.filter(e => e.slothBit && e.kind === 'eyelet').some(e => clearOnScreen(HW, tileBox([e.tx, e.ty])));
        });
    }
    assert.deepEqual(seen, { boards: true, gone: true, posts: true });
    noErrors(HW);
});

test('the Great Marionette is off on its march, steps from where it stood, before that is said', () => {
    const HW = loadGame();
    HW.preset('afterD5'); HW.step(10); HW.skipTalk();
    HW.Inv.maxHp = HW.Inv.hp = 40; HW.G.cheats.god = true; HW.Inv.giveTool('crossbar');
    HW.Progress.set('marionette_gmAwake');
    HW.warp('marionette', 1, 1);
    const g0 = HW.G.map.ents.find(e => e.type === 'greatmarionette'), r = HW.G.map.roomAt(g0.hx, g0.hy);
    HW.warp('marionette', r.x + 9, r.y + 8); HW.step(40); HW.skipTalk();
    const g = HW.G.map.ents.find(e => e.type === 'greatmarionette');
    g.hp = 2; HW.Script.run(HW.global('MarionetteFoes').toAct2(g));
    let seen = null;
    lines(HW, l => { if (/marches off round the stage/.test(l) && !seen) seen = { march: g.state === 'march', moved: Math.abs(g.feet[0][0] - g.home[0][0]) + Math.abs(g.feet[0][1] - g.home[0][1]) }; });
    assert.ok(seen && seen.march && seen.moved >= 2, JSON.stringify(seen));
    noErrors(HW);
});

test("what's told is there: the trap under the Kennel's chest; Tuck's spool on its stand while it's looked at; the squirrel off the giant's shoulders; the ninth Making's three things clear of the box", () => {
    /* the Kennel: Cog run down; the chest up out of a trap in the floor */
    {
        const HW = loadGame();
        HW.preset('afterD6'); HW.step(10); HW.skipTalk();
        HW.Inv.maxHp = HW.Inv.hp = 30; HW.G.cheats.god = true; HW.Inv.keyCount.spoolworks = 1;
        HW.warp('spoolworks', 40 + 3, 11 + 5); HW.step(40); HW.skipTalk(); HW.step(5); HW.skipTalk();
        const c = HW.G.map.ents.find(e => e.type === 'cog');
        c.hp = 1; c.state = 'held'; c.flash = 0; c.struck(HW.player(), 1, 0);
        let seen = null;
        lines(HW, l => {
            if (!/^A little trap in the floor/.test(l)) return;
            const ch = HW.G.map.find('kNeedle'), hatch = HW.G.map.ents.find(e => e.kind === 'remains' && e.floor && Math.abs(e.x - (ch.tx * T + 8)) < 2);
            seen = { chest: !ch.hidden, trap: !!hatch, clear: clearOnScreen(HW, tileBox([ch.tx, ch.ty], 18)) };
        });
        assert.deepEqual(seen, { chest: true, trap: true, clear: true });
        noErrors(HW);
    }
    /* the Deep Store: the spool's on its stand while it's described, and only then in the satchel */
    {
        const HW = loadGame();
        HW.preset('afterMakings'); HW.step(5); HW.skipTalk();
        HW.warp('deep', 9, 7); HW.step(40); HW.skipTalk();
        const pr = HW.G.map.ents.find(e => e.kind === 'prop' && e.tx === 9 && e.ty === 6 && e.interact), ART = HW.ART;
        pr.interact();
        const seen = {};
        lines(HW, l => { if (/^A fresh spool on a little stand/.test(l)) seen.on = pr.im === ART.freshspool; if (/^You tuck it in your satchel/.test(l)) seen.off = pr.im === ART.freshspool_gone; });
        assert.deepEqual(seen, { on: true, off: true });
        assert.ok(HW.Inv.items.tuckspool);
        noErrors(HW);
    }
    /* the giant sits up: moss and leaves and one surprised squirrel slide off his shoulders */
    {
        const HW = loadGame();
        HW.preset('afterD4'); HW.step(10); HW.skipTalk();
        HW.warp('hollow', 125, 60); HW.step(20); HW.skipTalk();
        const g = HW.G.map.find('giant');
        g.hear(g.x + 40, g.y + 32);
        let seen = null;
        lines(HW, l => { if (/one surprised squirrel/.test(l)) { const r = HW.G.map.ents.find(e => e.kind === 'remains' && !e.removed); seen = !!r && r.bits.some(b => b.bang !== undefined && r.t < r.endOf(b)) && r.bits.filter(b => b.end === 'lie').length >= 4; } });
        assert.ok(seen, 'moss, leaves and the squirrel, while that is said');
        noErrors(HW);
    }
    /* the ninth Making: three things by the wall, a hoop at the far end: all clear of the box */
    {
        const HW = loadGame();
        HW.preset('afterD7'); HW.step(10); HW.skipTalk();
        for (let n = 1; n <= 8; n++) HW.Progress.set('making' + n);
        HW.Progress.set('cap_given');
        HW.warp('making9', 9, 16); HW.step(5);
        let seen = null;
        lines(HW, l => { if (/^Up through the boards/.test(l)) seen = [...HW.global('Capstone').seen(HW.G.map, true)].map(([x, y, tall]) => clearOnScreen(HW, tileBox([x, y], tall))); });
        assert.deepEqual(seen, [true, true, true, true]);
        noErrors(HW);
    }
});

test('at the top of the Spool, the last thread cut, Wren turns from the post to Gran, a few steps in, before Gran speaks', async () => {
    const { slackAndCut, junkAndCut, darkAndCut } = await import('./legs.mjs');
    const TOP = [20, 0];
    const HW = loadGame(); HW.preset('afterDrift'); HW.step(10); HW.skipTalk(); HW.Inv.maxHp = HW.Inv.hp = 36;
    for (const h of ['tidy', 'kiln', 'mill', 'belfry', 'slumber', 'marionette']) HW.Progress.set('untie:' + h);
    HW.Progress.set('spool_all');
    let seen = null;
    const D = HW.Dialog, open0 = D.open, p = () => HW.player();
    D.open = function (who, t, o) {
        if (who === 'gran' && /Don't, love/.test(t)) {
            const g = HW.G.map.ents.find(e => e.who === 'gran');
            seen = { faces: p().dir === HW.global('dirOf')(g.tx - p().tx, g.ty - p().ty), near: Math.abs(g.tx - p().tx) + Math.abs(g.ty - p().ty) <= 4 };
        }
        return open0.call(this, who, t, o);
    };
    HW.warp('greatspool', 29, 11); HW.step(30); HW.skipTalk();
    HW.walkTo(29, 10); HW.hold('up'); HW.step(60); HW.release(); HW.step(10);
    const settle = () => { for (let i = 0; i < 12; i++) { HW.step(5); HW.skipTalk(); } };
    settle();
    const post = h => HW.G.map.ents.find(e => e.kind === 'greatpost' && e.house === h);
    for (const h of ['slumber', 'marionette']) slackAndCut(HW, post(h), TOP); settle();
    for (const h of ['mill', 'belfry']) junkAndCut(HW, post(h)); settle();
    for (const h of ['tidy', 'kiln']) darkAndCut(HW, post(h));
    for (let i = 0; i < 4000 && !HW.G.map.climax; i++) { HW.skipTalk(); HW.step(1); }
    assert.deepEqual(seen, { faces: true, near: true });
    noErrors(HW);
});

test("the stick favour's thread runs through the square as a thread (over its dark under-stroke), and is gone once the Spool stops", () => {
    const HW = loadGame();
    HW.preset('afterD6'); HW.step(10); HW.skipTalk();
    HW.warp('hollow', 88, 60); HW.step(10);
    const st = HW.G.map.ents.find(e => e.kind === 'stickthread'), Threads = HW.global('Threads');
    assert.ok(st, 'the thread in town');
    let n = 0; const path0 = Threads.path;
    Threads.path = function (...q) { n++; return path0.apply(this, q); };
    try {
        st.draw(HW.global('Cam').x, HW.global('Cam').y);
        assert.ok(n > 0, 'drawn as a thread');
        n = 0; HW.Progress.set('spool_cut'); st.draw(0, 0);
        assert.equal(n, 0, 'slack and gone once the Spool stops');
    } finally { Threads.path = path0; }
    noErrors(HW);
});

test('the fair gate, its bolt drawn, stands open (each leaf swung back along the road) and its bolt runs out to it; the town side too, after', () => {
    const HW = loadGame();
    HW.preset('afterD5'); HW.step(10); HW.skipTalk();
    delete HW.Progress.flags.fair_gate;
    HW.warp('hollow', 58, 59); HW.step(20); HW.skipTalk();
    const a = HW.G.map, L = HW.global('Larkspur'), leaves = [];
    const draw0 = L.drawLeaf; L.drawLeaf = function (...q) { leaves.push(q[3]); return draw0.apply(this, q); };
    try {
        const bolt = a.ents.find(e => e.kind === 'prop' && e.tx === 59 && e.ty === 58);
        bolt.interact(); HW.skipTalk(); HW.step(40);
        const gates = a.ents.filter(e => e.kind === 'door' && /^fairGate/.test(e.id)), fence = a.ents.filter(e => e.skey === 'westGateA' || e.skey === 'westGateB');
        assert.ok(gates.length === 2 && gates.every(g => g.open), 'open');
        for (const e of [...gates, ...fence]) e.draw(HW.global('Cam').x, HW.global('Cam').y);
        assert.deepEqual(leaves.sort(), ['gate', 'gate', 'rail', 'rail'], 'every leaf drawn standing open');
        /* built again (a save, the area entered afresh): the town side's leaves stand open too */
        leaves.length = 0;
        HW.warp('hollow', 70, 59); HW.step(5);
        for (const e of HW.G.map.ents.filter(e => e.kind === 'prop' && e.draw && e.tx === 67 && (e.ty === 59 || e.ty === 60))) e.draw(0, 0);
        assert.deepEqual(leaves, ['rail', 'rail']);
    } finally { L.drawLeaf = draw0; }
    noErrors(HW);
});

test('Gundry, forty years in the Guild, has a touch of grey at the temples, in his picture and on his face in the box', () => {
    const HW = loadGame();
    const look = HW.global('PEOPLE_DEF').gundry.look, rows = HW.global('portraitRows')(look);
    assert.ok(look.extra.includes('greying'));
    assert.ok(rows.join('').includes('v') && rows.join('').includes('V'), 'his portrait');
    assert.ok(!HW.global('portraitRows')(HW.global('PEOPLE_DEF').bram.look).join('').includes('v'), "(and nobody else's)");
    noErrors(HW);
});
