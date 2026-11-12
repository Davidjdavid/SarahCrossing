// Words that follow what's seen (fix round F, live run 3's picture reviews): a beaten foe's end still on screen while it's
// told (its pieces, its yarn, its thread down the cracks); a line about something said with it clear of the box; what a
// line says is there, there (a trap under a chest, a spool on its stand, a squirrel); the Great Marionette off on its march
// before that's said; at the Spool's top, Wren turned to Gran; the stick favour's thread a thread, gone once the Spool
// stops; the fair gate standing open; a touch of grey on Gundry. And fix round G (live run 4's): the way out of a House
// clear of the box, door frame and all; Captain Tin's coil and Matron Hush's yarn; Tollgrim seen climbing back into his
// bell; the Housekeeper's stamp onto its cross; the Snapjaw's yarn under the crates; Grindle's wheel; Gran's hands on
// the Spool.
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
    housekeeper: ['tidy', e => e.type === 'housekeeper', (HW, e) => { e.hp = 1; e.state = 'stunned'; e.doors = 1; e.flash = 0; e.struck(HW.player(), 1, 0); }, (HW, e) => e.drain.showing() && !e.drain.removed && e.yarnT < 240],
    monger: ['tidy', e => e.type === 'monger', (HW, e) => e.die(), (HW, e) => HW.G.map.ents.some(q => q.kind === 'remains' && !q.removed && q.showing())],
    glazer: ['kiln', e => e.type === 'glazer', (HW, e) => { e.hp = 1; e.flash = 0; e.struck(null, 1, -1, true); }, (HW, e) => !e.alive && e.deadT < 200],
    kilnwyrm: ['kiln', e => e.type === 'kilnwyrm' || e.kind === 'kilnwyrm', (HW, e) => { e.hp = 1; e.flash = 0; e.struck(null, 1, -1, true); }, (HW, e) => e.pieces.showing() && !e.pieces.removed],
    snapjaw: ['millrace', e => e.type === 'snapjaw', (HW, e) => { e.hp = 1; e.hidden = false; e.state = 'swim'; e.bonk(null, 0); }, (HW, e) => e.remains.showing() && !e.remains.removed],
    grindle: ['millrace', e => e.kind === 'grindle', (HW, e) => { e.hp = 1; e.hurt(); }, (HW, e) => e.deadT < 240 && e.gears.showing()],
    clangor: ['belfry', e => e.type === 'clangor', (HW, e) => { e.hp = 1; e.flash = 0; e.state = 'stunned'; e.struck(HW.player(), 1, 0); }, (HW, e) => e.pieces.showing() && !e.pieces.removed],
    tollgrim: ['belfry', e => e.type === 'tollgrim', (HW, e) => { e.x = (e.hx - 1) * T + 8; e.y = (e.hy + 4) * T + 10; e.defeat(); }, (HW, e) => e.ball.showing() && !e.ball.removed],
    sloth: ['slumber', e => e.type === 'mothersloth', (HW, e) => { e.hp = 1; e.setArena(3, true); e.defeat(); }, (HW, e, l) => /^Board by board/.test(l) ? HW.Script.running('slothFloor') && e.far.some(([x, y]) => HW.G.map.kind(x, y).pit) && e.far.some(([x, y]) => !HW.G.map.kind(x, y).pit) : (e.yarnT || 0) < 220],
    tangle: ['spoolworks', e => e.kind === 'tangle', (HW, e) => e.defeat(), (HW, e) => e.runs.showing() && !e.runs.removed],
    /* (Captain Tin dazed in the left trap; Matron Hush dazed by her bed, her yarn not yet wholly under it) */
    captain: ['marionette', e => e.type === 'captain', (HW, e) => { e.x = (e.hx - 7) * T + 8; e.y = e.hy * T + 10; e.march = HW.global('LEFT'); e.hp = 1; e.state = 'dazed'; e.flash = 0; e.struck(HW.player(), 1, 0); }, (HW, e) => e.coil.showing() && !e.coil.removed && !e.crack.removed],
    matron: ['slumber', e => e.type === 'matron', (HW, e) => { e.x = e.hx * T + 8; e.y = e.hy * T + 10; e.hp = 1; e.state = 'dazed'; e.flash = 0; e.struck(HW.player(), 1, 0); }, (HW, e) => !e.heap.removed && !underBed(HW, e)],
};
/* Matron Hush's yarn, wholly under her bed (its picture over the ball, all of it) */
function underBed(HW, e) {
    const a = HW.G.map, bed = a.ents.find(q => q.kind === 'prop' && q.im === HW.ART.bed_big && a.roomAt(q.tx, q.ty) === e.arena), [x, y] = e.heap.at(e.heap.bits[0]);
    return x - 5 >= bed.x && x + 5 <= bed.x + 32 && y - 9 >= bed.y && y + 1 <= bed.y + 32;
}
const SAID = { housekeeper: /^The Housekeeper shudders/, monger: /^The Dust Monger bursts/, glazer: /^The Glazer cracks/, kilnwyrm: /^The Kilnwyrm comes apart/, snapjaw: /^The Snapjaw rolls over/, grindle: /^Old Grindle's gears/, clangor: /^Clangor falls to pieces/, tollgrim: /^Tollgrim unravels/, sloth: /^Mother Sloth lets go|^Board by board/, tangle: /^The little knot|^slithers apart/, captain: /^Captain Tin salutes/, matron: /^Matron Hush sighs/ };
function foeAt(name) {
    const [area, is] = FOES[name];
    const HW = loadGame();
    HW.preset('afterD7'); HW.step(10); HW.skipTalk();
    HW.Inv.maxHp = HW.Inv.hp = 40; HW.G.cheats.god = true;
    for (const t of ['gloves', 'hook', 'paddle', 'bell', 'bedroll', 'crossbar']) HW.Inv.giveTool(t);
    for (const f of ['tidy_boss', 'kiln_boss', 'millrace_boss', 'belfry_boss', 'slumber_boss', 'spool_boss', 'tidy_monger', 'kiln_glazer', 'millrace_snapjaw', 'belfry_clangor', 'spool_cog', 'marionette_tin', 'slumber_matron']) delete HW.Progress.flags[f];
    HW.warp(area, 1, 1);
    let e = [...HW.G.map.ents, ...HW.G.map.walkers].find(is);
    const r = HW.G.map.roomAt(e.hx !== undefined ? e.hx : e.tx, e.hy !== undefined ? e.hy : e.ty);
    HW.warp(area, r.x + 9, r.y + r.h - 3); HW.step(60); HW.skipTalk(); HW.step(5); HW.skipTalk();
    e = [...HW.G.map.ents, ...HW.G.map.walkers].find(is);
    return [HW, e];
}
test('a beaten foe goes while its end is told: teal yarn down a hole, dust bunnies, a crumbling Glazer, pots down a crack, a ball of yarn down the race or under the bell, a sinking fish, pieces of armour, a feather and a floor coming back, thread down the cracks, a coil down a crack in the boards, a heap of yarn rolling under a bed', () => {
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

test("Captain Tin's coil and Matron Hush's yarn wait for a slow reader, and go as told once the line's read (down the crack; under the bed, to stay)", () => {
    for (const name of ['captain', 'matron']) {
        const [HW, e] = foeAt(name), [, , beat, shown] = FOES[name], D = HW.Dialog;
        beat(HW, e);
        assert.ok(until(HW, () => D.active && SAID[name].test((D.pages[0] || []).join(' ')) && D.shown >= D.pageLen(), 3000), name + ': its end told');
        HW.step(900);
        assert.ok(D.active && shown(HW, e), name + ': still there fifteen seconds on, the line still up');
        HW.skipTalk(); HW.step(600); HW.skipTalk();
        if (name === 'captain') assert.ok(e.coil.removed && !e.crack.removed, 'the coil gone down the crack (the crack left)');
        else assert.ok(!e.heap.removed && underBed(HW, e), 'the yarn under the bed, staying there');
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

test("the way out of the Tidyhouse and the Kiln, told as it opens after the Knot: its doorway (the light on the floor and the frame in the wall under it) and Wren clear of the box", () => {
    for (const [id, beaten] of [['tidy', 'tidy_boss'], ['kiln', 'kiln_boss']]) {
        const HW = loadGame();
        HW.newGame('Test', { area: id, x: 29, y: 42, noAutosave: true });
        HW.Inv.items.staff = 1; for (const t of ['gloves', 'hook']) HW.Inv.giveTool(t);
        HW.Inv.maxHp = HW.Inv.hp = 40; HW.G.cheats.god = true; HW.step(5);
        HW.Progress.set(beaten);
        const r0 = HW.G.map.rooms.find(r => r.key === '1,0');
        HW.warp(id, r0.x + 9, r0.y + 8); HW.step(20); HW.skipTalk();
        /* (the Knot tied as a player ties it: from under the hoop, the box and its lean as they come after the Knot's own line) */
        const hoop = HW.G.map.ents.find(e => e.kind === 'hoop'), hall = HW.G.map.roomAt(hoop.tx, hoop.ty);
        HW.walkTo(hoop.tx, hoop.ty + 1); HW.player().dir = HW.global('UP'); HW.step(5);
        HW.Script.run(HW.global('Knots').tie(hoop));
        let seen = null;
        lines(HW, l => {
            if (!/^A door opens in the corner/.test(l)) return;
            const a = HW.G.map, d = a.ents.find(e => e.kind === 'warp' && e.to === 'hollow' && !e.removed && a.roomAt(e.tx, e.ty) === hall), p = HW.player();
            seen = { door: clearOnScreen(HW, [d.tx * T, d.ty * T, d.tx * T + 16, d.ty * T + 32]), wren: clearOnScreen(HW, [p.x - 6, p.y - 13, p.x + 6, p.y + 3]) };
        });
        assert.deepEqual(seen, { door: true, wren: true }, id);
        noErrors(HW);
    }
});

test('Tollgrim, knocked into his next beat, lies dazed on the floor and is then seen getting back up into his bell, before the line says he does; the fight resumes on the same frame as ever', () => {
    for (const n of [2, 3]) {
        const [HW, t] = foeAt('tollgrim');
        /* (dazed on the floor under the bell's mouth, one knock from his next beat) */
        t.hp = 5 - n; t.told = n - 1; t.state = 'stunned'; t.st = 0; t.hidden = false; t.knocks = 0;
        t.x = t.mouth[0] * T + 8; t.y = (t.mouth[1] + 2) * T + 10;
        const hit = () => { t.flash = 0; t.struck(HW.player(), 1, 0); };
        hit(); hit();
        assert.equal(t.phase, n, 'his next beat');
        const D = HW.Dialog, frames = [];
        let f = 0;
        for (; f < 200 && !D.active; f++) { frames.push({ shown: !t.hidden, lying: t.state === 'climb' && !t.hop, hop: !!t.hop, y: t.y }); HW.step(1); }
        assert.ok(D.active && (n === 2 ? /^Tollgrim scrambles back up/ : /^Tollgrim drags himself back/).test((D.pages[0] || []).join(' ')), `beat ${n}: the line`);
        assert.equal(f, 30, 'said half a second on, as ever');
        assert.ok(frames.filter(q => q.shown && q.lying).length >= 5, 'he lay there a moment, to be seen');
        const hop = frames.filter(q => q.hop);
        assert.ok(hop.length >= 12 && hop[hop.length - 1].y < hop[0].y, 'and was seen going back up to the bell');
        assert.ok(t.hidden && t.state === 'hide', 'in it, as it is said');
        HW.skipTalk();
        noErrors(HW);
    }
});

test("the Grand Hall: the Housekeeper steps off its spot, the teal cross under it shows, and it stamps back onto it before that's said; said with every bust, it and Wren clear of the box", () => {
    const HW = loadGame();
    HW.newGame('Test', { area: 'tidy', x: 29, y: 42, noAutosave: true });
    HW.Inv.items.staff = 1; HW.Inv.giveTool('gloves'); HW.Inv.patterns.push('tidy'); HW.step(5);
    const r = HW.G.map.rooms.find(q => q.key === '1,0');
    /* (in at its east door, as a player comes from the antechamber) */
    HW.warp('tidy', r.x + 21, r.y + 5); HW.step(5);
    HW.hold('left'); HW.step(50); HW.release(); HW.hold('left'); HW.step(60); HW.release();
    const k = HW.G.map.ents.find(e => e.type === 'housekeeper'), D = HW.Dialog;
    let cross = 0, seen = null;
    for (let i = 0; i < 3000 && !seen && (D.active || HW.Script.blocking()); i++) {
        const words = D.active ? (D.pages[D.page] || []).join(' ') : '';
        if (D.active && D.shown >= D.pageLen()) {
            if (/^It stamps back onto a little teal cross/.test(words)) {
                const p = HW.player(), busts = HW.G.map.ents.filter(e => e.kind === 'bust' && HW.G.map.roomAt(e.tx, e.ty) === HW.G.map.roomAt(k.homeX, k.homeY));
                seen = { home: k.atHome(), busts: busts.length === 4 && busts.every(b => clearOnScreen(HW, tileBox([b.tx, b.ty], 24))), it: clearOnScreen(HW, [k.x - 16, k.y - 34, k.x + 16, k.y + 2]), wren: clearOnScreen(HW, [p.x - 6, p.y - 13, p.x + 6, p.y + 3]) };
            } else HW.press('act', 1);
            continue;
        }
        /* (the cross wholly clear of the wardrobe, drawn because it's off its spot) */
        if (!D.active && !k.atHome() && (k.x + 16 <= k.homeX * T + 4 || k.x - 16 >= k.homeX * T + 12)) cross++;
        HW.step(1);
    }
    assert.ok(cross >= 15, `the cross shown a moment (${cross} frames)`);
    assert.deepEqual(seen, { home: true, busts: true, it: true, wren: true });
    HW.skipTalk();
    assert.ok(until(HW, () => k.state === 'home', 300) && k.atHome(), 'and the fight begins from its spot');
    noErrors(HW);
});

test("Grindle's turn: the great wheel in the wall is seen grinding round, in full, before \"The great wheel grinds over\" is said (the camera not left leaned down for Wren on the bank)", () => {
    for (const [px, py] of [[29, 9], [24, 9]]) {
        const HW = loadGame(); HW.preset('afterD2'); HW.step(5); HW.skipTalk(); HW.Inv.maxHp = HW.Inv.hp = 30; HW.G.cheats.god = true;
        HW.warp('millrace', px, py, 'up'); HW.step(30); HW.skipTalk();
        const g = HW.G.map.ents.find(e => e.type === 'grindle'), s = HW.G.map.ents.find(e => e.kind === 'sluice'), Cam = HW.global('Cam'), D = HW.Dialog;
        /* (a line said just before, the camera leaned down for her on the bank, as the fight's lines have it) */
        HW.Script.run(function* () { yield* HW.global('say')(null, 'A line before, said low on the bank.', { focus: g }); });
        HW.skipTalk();
        g.phase = 1; g.turn();
        let seen = 0;
        for (let i = 0; i < 400 && !(D.active && D.shown >= D.pageLen()); i++) {
            HW.step(1);
            if (!D.active && s.spin > 0 && clearOnScreen(HW, [s.x + 4, s.y - 3, s.x + 28, s.y + 21])) seen++;
        }
        assert.match((D.pages[0] || []).join(' '), /The great wheel grinds over/);
        assert.ok(seen >= 30, `${px},${py}: the wheel seen turning ${seen} frames`);
        noErrors(HW);
    }
});

test("the Snapjaw's ball of yarn bobs down the race in the water, under the crates afloat in it (not sat on them), and out from under them, clear of the box, as its line is read", () => {
    const HW = loadGame(), M = [40, 22], m = (x, y) => [M[0] + x, M[1] + y];
    HW.preset('afterD2'); HW.step(10); HW.skipTalk(); HW.Inv.maxHp = HW.Inv.hp = 30; HW.G.cheats.god = true;
    HW.warp('millrace', ...m(1, 5)); HW.step(30); HW.skipTalk();
    const s = HW.G.map.ents.find(e => e.type === 'snapjaw');
    /* (beaten as a player beats it: baited up on the bank, and a crate pushed down the race onto it, twice) */
    until(HW, () => s.state === 'swim', 600);
    for (const [crate, row] of [['sjCrate1', 2], ['sjCrate2', 4]]) {
        until(HW, () => s.state === 'swim', 600);
        HW.walkTo(...m(11, row)); until(HW, () => s.state === 'rear', 600); HW.walkTo(...m(10, row));
        const c = HW.G.map.find(crate), hp0 = s.hp;
        HW.walkTo(...m(10, c.ty - M[1])); HW.face('right'); HW.push('right', 1);
        until(HW, () => s.hp < hp0 || !s.alive, 300);
        if (!s.alive) break;
    }
    assert.ok(!s.alive, 'beaten');
    const D = HW.Dialog, R = s.remains;
    assert.ok(until(HW, () => D.active && D.shown >= D.pageLen() && /^The Snapjaw rolls over/.test((D.pages[0] || []).join(' ')), 600), 'its line');
    HW.step(60);
    const [x, y] = R.at(R.bits[0]), crates = HW.G.map.ents.filter(e => e.kind === 'crate' && Math.abs(e.px + 8 - x) < 12);
    assert.ok(R.sortY < Math.min(...crates.map(c => c.sortY), Infinity), 'drawn in the water, under the crates');
    assert.ok(!crates.some(c => y - 8 < c.py + 16 && y + 1 > c.py), `out from under them (the ball at ${Math.round(y)}; crates at ${crates.map(c => c.py)})`);
    assert.ok(R.showing() && clearOnScreen(HW, [x - 4, y - 8, x + 4, y + 1]), 'and clear of the box');
    HW.skipTalk(); HW.step(200);
    assert.ok(R.removed, 'gone into the pool once read');
    noErrors(HW);
});

test("the Spool's last thread cut: Gran is seen holding the Spool, her back to you and both hands up on the drum's rim, while that's told; one hand on it once Linnet has the other", async () => {
    const { slackAndCut, junkAndCut, darkAndCut } = await import('./legs.mjs');
    const TOP = [20, 0];
    const HW = loadGame(); HW.preset('afterDrift'); HW.step(10); HW.skipTalk(); HW.Inv.maxHp = HW.Inv.hp = 36;
    for (const h of ['tidy', 'kiln', 'mill', 'belfry', 'slumber', 'marionette']) HW.Progress.set('untie:' + h);
    HW.Progress.set('spool_all');
    const D = HW.Dialog, open0 = D.open, Gfx = HW.global('Gfx'), PAL = HW.global('PAL'), seen = {};
    /* (her arms as drawn with her: the skin-coloured lines out from her) */
    const arms = g => { let n = 0; const l0 = Gfx.line; Gfx.line = function (...q) { if (q[4] === PAL.skin) n++; return l0.apply(this, q); }; try { g.draw(0, 0); } finally { Gfx.line = l0; } return n; };
    D.open = function (who, t, o) {
        const g = HW.G.map && HW.G.map.ents.find(e => e.who === 'gran'), UP = HW.global('UP');
        if (g && /^She keeps hold of the Spool|^Gran's hands go still/.test(t)) (seen.both = seen.both || []).push(g.dir === UP && arms(g) === 2);
        if (g && /The other's still on it/.test(t)) seen.one = arms(g) === 1 && HW.global('Ending').hands.length === 2;
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
    assert.deepEqual(seen, { both: [true, true], one: true });
    noErrors(HW);
});
