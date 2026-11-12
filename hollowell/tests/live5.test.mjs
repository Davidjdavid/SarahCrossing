// Live run 5's picture reviews (fix round H, the last cosmetic touches): Tollgrim's eyes in his bell while he talks from
// it; Old Grindle's second gulp told shorter; no heart dropped on a bust's head; nothing of a beaten foe left lying where
// something out of place goes home; the Glazer's ball of clay; a find's glow soft at its edge over the dark; notices
// clear of whoever's seen up through the boards in the Makings; the giant sat up on a flat shadow.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const T = 16, W = 320;
const noErrors = HW => assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
const ov = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
/* in a boss's room, the boss not yet beaten (as tests/told_seen.test.mjs) */
function foeAt(area, is, flags) {
    const HW = loadGame();
    HW.preset('afterD7'); HW.step(10); HW.skipTalk();
    HW.Inv.maxHp = HW.Inv.hp = 40; HW.G.cheats.god = true;
    for (const t of ['gloves', 'hook', 'paddle', 'bell', 'bedroll', 'crossbar']) HW.Inv.giveTool(t);
    for (const f of flags) delete HW.Progress.flags[f];
    HW.warp(area, 1, 1);
    let e = [...HW.G.map.ents, ...HW.G.map.walkers].find(is);
    const r = HW.G.map.roomAt(e.hx !== undefined ? e.hx : e.tx, e.hy !== undefined ? e.hy : e.ty);
    HW.warp(area, r.x + 9, r.y + r.h - 3); HW.step(60); HW.skipTalk(); HW.step(5); HW.skipTalk();
    e = [...HW.G.map.ents, ...HW.G.map.walkers].find(is);
    return [HW, e];
}

test('Tollgrim, back up in his bell for his second beat, shows his eyes in its mouth all through what he says from in there', () => {
    const [HW, t] = foeAt('belfry', e => e.type === 'tollgrim', ['belfry_boss']);
    t.hp = 3; t.told = 1; t.state = 'stunned'; t.st = 0; t.hidden = false; t.knocks = 0;
    t.x = t.mouth[0] * T + 8; t.y = (t.mouth[1] + 2) * T + 10;
    const hit = () => { t.flash = 0; t.struck(HW.player(), 1, 0); };
    hit(); hit();
    /* (his eyes: two little squares in the bell's mouth) */
    const Gfx = HW.global('Gfx'), Cam = HW.global('Cam'), D = HW.Dialog, rect0 = Gfx.rect;
    const eyes = () => { let n = 0; Gfx.rect = function (x, y, w, h, c) { if (w === 2 && h === 2 && (c === '#f7d64a' || c === '#ff5a4a')) n++; return rect0.apply(this, arguments); }; try { t.draw(Cam.x, Cam.y); } finally { Gfx.rect = rect0; } return n; };
    const seen = { scramble: [0, 0], heard: [0, 0] };
    for (let i = 0; i < 3000 && (D.active || HW.Script.blocking()); i++) {
        const words = D.active ? D.pages.flat().join(' ') : '', k = /scrambles back up/.test(words) ? 'scramble' : /I HEARD YOUR LITTLE BELL/.test(words) ? 'heard' : null;
        if (k) { seen[k][0]++; if (eyes() >= 2) seen[k][1]++; }
        if (D.active && D.shown >= D.pageLen() && D.t > 30) HW.press('act', 1); else HW.step(1);
    }
    for (const k of ['scramble', 'heard']) {
        assert.ok(seen[k][0] > 30, `${k}: said`);
        assert.equal(seen[k][1], seen[k][0], `${k}: his eyes in the bell's mouth on every frame of it`);
    }
    assert.ok(!t.peer, 'and only now and then again once the fight is back on');
    noErrors(HW);
});

test("Old Grindle's gulp is told in full the first time in a fight, and shorter after (not the same words twice)", () => {
    const [HW, g] = foeAt('millrace', e => e.kind === 'grindle', ['millrace_boss']);
    const UI = HW.global('UI'), said = [];
    for (let i = 0; i < 3; i++) {
        UI.toasts = [];
        g.gulp({ tx: 0, ty: 0 });
        said.push(UI.toasts.map(q => q.s).join(' | '));
    }
    assert.match(said[0], /^Old Grindle gulps it down, shudders, and settles low in the water/);
    assert.ok(said[1] && said[1] !== said[0] && said[1].length < said[0].length, `shorter: "${said[1]}"`);
    assert.equal(said[2], said[1]);
    noErrors(HW);
});

test("in the Grand Hall, no heart lands on a bust's head: not those dropped in the fight, nor the Heartstitch after it", () => {
    const HW = loadGame();
    HW.newGame('Test', { area: 'tidy', x: 29, y: 42, noAutosave: true });
    HW.Inv.items.staff = 1; HW.Inv.giveTool('gloves'); HW.Inv.patterns.push('tidy'); HW.step(5);
    HW.Inv.maxHp = HW.Inv.hp = 40; HW.G.cheats.god = true;
    const a = HW.G.map, r = a.rooms.find(q => q.key === '1,0');
    HW.warp('tidy', r.x + 21, r.y + 5); HW.step(5);
    HW.hold('left'); HW.step(50); HW.release(); HW.hold('left'); HW.step(60); HW.release(); HW.step(40); HW.skipTalk();
    const k = HW.ents('enemy').find(e => e.type === 'housekeeper');
    /* (a bust, or anything as tall, on the tile below: its head stands up into this one) */
    const onHead = h => { const o = HW.G.map.at(Math.floor(h.x / T), Math.floor(h.y / T) + 1); return !!o && o.kind === 'bust'; };
    const hearts = new Set();
    for (let n = 0; k.alive && n < 12; n++) {
        HW.hitEnemy(k); HW.step(2);
        for (const h of HW.G.map.ents) if (h.kind === 'pickup' && (h.what === 'heart' || h.what === 'heartstitch') && !h.removed) hearts.add(h);
        HW.step(38);
    }
    assert.ok(!k.alive, 'the Housekeeper down');
    HW.step(300); HW.skipTalk(); HW.step(10);
    const stitch = HW.G.map.ents.find(e => e.id === 'tidyHeart');
    assert.ok(stitch, 'its Heartstitch');
    hearts.add(stitch);
    assert.ok(hearts.size >= 2, 'hearts dropped in the fight');
    for (const h of hearts) assert.ok(!onHead(h), `a ${h.what} at ${Math.floor(h.x / T) - r.x},${Math.floor(h.y / T) - r.y}: on a bust's head`);
    /* (and where it is whenever the House is built again) */
    const [hx, hy] = HW.global('HOUSE_AFTER').tidy.heart;
    assert.deepEqual([Math.floor(stitch.x / T) - r.x, Math.floor(stitch.y / T) - r.y], [hx, hy]);
    noErrors(HW);
});

test("a beaten foe's pieces don't come down on, or stand up over, the spot something out of place goes home to (it came home onto them)", () => {
    const [HW, c] = foeAt('belfry', e => e.type === 'clangor', ['belfry_clangor']);
    const a = HW.G.map, Return = HW.global('Return'), Cam = HW.global('Cam'), Gfx = HW.global('Gfx'), r = a.roomAt(c.hx, c.hy);
    /* (as in the scripted game: the bust by him knocked two steps off its place, on its way back when he falls) */
    const b = a.ents.filter(e => e.kind === 'bust' && a.roomAt(e.tx, e.ty) === r).sort((m, n) => m.tx + m.ty - n.tx - n.ty)[0];
    const [hx, hy] = [b.tx, b.ty];
    for (const x of [hx + 1, hx + 2]) { a.unplace(b, b.tx, b.ty); b.tx = x; b.x = x * T; a.place(b, b.tx, b.ty); Return.moved(b, b.tx, b.ty); }
    assert.ok(Return.away(b), 'out of its place');
    assert.ok(!HW.global('RemainsKit').open(a, hx, hy), 'its place is not somewhere for a piece to lie');
    c.x = hx * T + 10; c.y = hy * T + 10; c.hp = 1; c.flash = 0; c.state = 'stunned'; c.struck(HW.player(), 1, 0);
    assert.ok(c.pieces, 'in pieces');
    c.pieces.t = 1000;
    /* (every piece as it's drawn, lying where it came down, against the bust's place on the screen) */
    const sub0 = Gfx.sub, drawn = [];
    Gfx.sub = function (im, sx, sy, w, h, X, Y) { drawn.push([X, Y, X + w, Y + h]); return sub0.apply(this, arguments); };
    try { c.pieces.draw(Cam.x, Cam.y); } finally { Gfx.sub = sub0; }
    const home = [hx * T - Cam.x, hy * T - Cam.y, hx * T + 16 - Cam.x, hy * T + 16 - Cam.y];
    assert.ok(drawn.length >= 6, 'its pieces drawn');
    for (const q of drawn) assert.equal(ov(q, home), 0, `a piece at ${q} over the bust's place ${home}`);
    noErrors(HW);
});

test('the Glazer is seen rolling its ball of clay while that is said, and not after', () => {
    const HW2 = loadGame();
    HW2.preset('afterD1'); HW2.step(10); HW2.skipTalk();
    HW2.Inv.maxHp = HW2.Inv.hp = 30; HW2.G.cheats.god = true;
    delete HW2.Progress.flags.kiln_glazer;
    HW2.warp('kiln', 1, 1);
    let g = HW2.G.map.ents.find(e => e.type === 'glazer');
    const r = HW2.G.map.roomAt(g.hx, g.hy);
    HW2.warp('kiln', r.x + 9, r.y + 8); HW2.step(40);
    g = HW2.G.map.ents.find(e => e.type === 'glazer');
    const D = HW2.Dialog, Gfx = HW2.global('Gfx'), Cam = HW2.global('Cam'), rect0 = Gfx.rect;
    const clay = () => { let n = 0; Gfx.rect = function (x, y, w, h, c) { if (c === '#c4623a' && x > g.x - Cam.x + 4) n++; return rect0.apply(this, arguments); }; try { g.draw(Cam.x, Cam.y); } finally { Gfx.rect = rect0; } return n > 0; };
    for (let i = 0; i < 600 && !(D.active && D.shown >= D.pageLen()); i++) HW2.step(1);
    assert.match(D.pages.flat().join(' '), /rolling a ball of clay between its hands/);
    assert.ok(clay(), 'the ball of clay in its hands, beside the shield');
    HW2.skipTalk(); HW2.step(5);
    assert.ok(!D.active && !clay(), 'gone once the fight is on (it throws it)');
    noErrors(HW2);
});

test("a find's glow, over the dark of a chasm, fades out at its edge a ring at a time: no rim", () => {
    const HW = loadGame();
    HW.newGame('Wren', { area: 'tidy', x: 10, y: 38, noAutosave: true, skipIntro: true }); HW.step(5);
    const p = HW.player(), Gfx = HW.global('Gfx'), hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    HW.G.holdUp = { id: 'key', t: 0 }; p.state = 'hold';
    const circles = [], c0 = Gfx.circle, a0 = Gfx.alpha; let alpha = 1;
    Gfx.alpha = function (a) { alpha = a; return a0.apply(this, arguments); };
    Gfx.circle = function (x, y, r, col) { circles.push({ r, col, a: alpha }); return c0.apply(this, arguments); };
    try { p.draw(HW.global('Cam').x, HW.global('Cam').y); } finally { Gfx.circle = c0; Gfx.alpha = a0; HW.G.holdUp = null; p.state = 'normal'; }
    /* (how bright it is over black at each distance from its middle, out to its edge) */
    const lum = d => { const c = circles.filter(q => q.r >= d).reduce((c, q) => c.map((v, i) => q.a * hex(q.col)[i] + (1 - q.a) * v), [0, 0, 0]); return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; };
    const edge = Math.max(...circles.map(q => q.r));
    assert.ok(lum(edge) <= 0.1, `faint at its very edge (${lum(edge).toFixed(2)})`);
    for (let d = edge; d > 0; d--) assert.ok(lum(d - 1) - lum(d) <= 0.2 && lum(d - 1) >= lum(d), `no step at ${d} (${lum(d).toFixed(2)} to ${lum(d - 1).toFixed(2)})`);
    assert.ok(lum(0) >= 0.75, 'pale in the middle');
});

test('in the Makings, a notice keeps clear of whoever is seen up through the boards and of what it names up there', () => {
    const house = () => {
        const HW = loadGame();
        HW.preset('afterD7'); HW.step(10); HW.skipTalk();
        HW.Inv.stitches = [];
        for (let n = 1; n <= 8; n++) HW.Progress.set('making' + n);
        HW.Progress.set('cap_given');
        HW.warp('making9', 9, 16); HW.step(10); HW.skipTalk();
        return HW;
    };
    /* (a thing up above, as it's drawn on the screen from underneath) */
    const drawn = (HW, e) => { const [x0, y0] = HW.global('Fx').view(HW.global('Cam').x, HW.global('Cam').y)(e.px, e.py - 10); return [x0, y0, x0 + 16, y0 + 26]; };
    const notice = (HW, re) => { const UI = HW.global('UI'); let t = null; for (let i = 0; i < 120 && !(t = UI.toasts.find(q => re.test(q.s) && !q.wait)); i++) HW.step(1); HW.step(12); return t && UI.noticeRect(t, !!t.low); };
    {
        const HW = house();
        assert.ok(HW.walkTo(3, 19)); HW.face('down'); HW.press('act', 1); HW.step(3); HW.skipTalk(0); HW.step(1);
        const e = HW.G.map.find(HW.global('Capstone').button());
        const r = notice(HW, /it's under the wooden block now/), b = drawn(HW, e);
        assert.ok(r, 'the notice');
        assert.ok(ov(r, b) <= 0.1 * 16 * 26, `the wooden block up there clear of it (${r} over ${b})`);
        noErrors(HW);
    }
    {
        const HW = house();
        assert.ok(HW.walkTo(7, 19)); HW.face('down'); HW.press('act', 1); HW.step(1);
        const tk = HW.G.map.find('tuck');
        /* (whoever's up there counts where they're drawn, as anyone down here does) */
        const items = HW.Dialog.items({}, true), b = drawn(HW, tk), C = HW.global('Cam');
        assert.ok(items.some(i => Math.abs(i[0] - C.x - b[0]) <= 1 && Math.abs(i[3] - C.y - b[3]) <= 1), 'Tuck weighed where he is seen');
        const r = notice(HW, /in comes Tuck/);
        assert.ok(r && ov(r, drawn(HW, tk)) <= 0.1 * 16 * 26, 'Tuck clear of it');
        noErrors(HW);
    }
});

test('the giant sat up has a flat shadow under him, not a round one showing below his feet', () => {
    const HW = loadGame();
    HW.preset('afterD4'); HW.step(10); HW.skipTalk();
    HW.warp('hollow', 1, 1); HW.step(2);
    const g = HW.G.map.ents.find(e => e.kind === 'giant');
    assert.ok(g, 'the giant');
    const Gfx = HW.global('Gfx'), c0 = Gfx.circle, r0 = Gfx.rect, Cam = HW.global('Cam');
    const shade = () => { const out = { disc: 0, low: 0 }; Gfx.circle = function (x, y, r) { if (r >= 20) out.disc++; return c0.apply(this, arguments); }; Gfx.rect = function (x, y, w, h) { if (w >= 40 && h === 1 && y + Cam.y > g.y + 64) out.low++; return r0.apply(this, arguments); }; try { g.draw(Cam.x, Cam.y); } finally { Gfx.circle = c0; Gfx.rect = r0; } return out; };
    g.state = 'asleep'; g.up = false;
    assert.equal(shade().disc, 1, 'lying down: the pool of shade under all of him');
    g.state = 'waking'; g.up = true;
    const s = shade();
    assert.equal(s.disc, 0, 'sat up: no disc');
    assert.ok(s.low <= 2, 'only a sliver of it below his seat');
    noErrors(HW);
});
