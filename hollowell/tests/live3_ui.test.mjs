// Live run 3's picture reviews (POLISH.md finding 74): the screen's words, the HUD and people's overlaps, kept fixed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const W = 320, H = 180;
const ov = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
/* Wren as she's drawn (her 16 px sprite, 12 wide), on the screen */
const wrenOnScreen = HW => { const C = HW.global('Cam'), p = HW.player(), z = Math.round(p.z || 0); return [p.x - 6 - C.x, p.y - 13 - z - C.y, p.x + 6 - C.x, p.y + 3 - z - C.y]; };
/* how much of her the box (and its name tag, its choices) hides, or the screen's edge: 0..1 */
const wrenHidden = HW => {
    const b = wrenOnScreen(HW), area = 12 * 16;
    let under = 0; for (const r of HW.global('Dialog').panels()) under += ov(b, r);
    return Math.min(1, (area - ov(b, [0, 0, W, H]) + under) / area);
};
/* a scene talked through a page at a time (each once it's all shown and the camera's settled): the worst share of
   Wren hidden, and the pages */
const through = (HW, max = 4000) => {
    const D = HW.global('Dialog'), Script = HW.global('Script'), pages = [];
    for (let i = 0; i < max && (D.active || Script.blocking() || i < 5); i++) {
        if (D.active && D.shown >= D.pageLen() && D.t > 40) { pages.push({ hid: wrenHidden(HW), words: (D.pages[D.page] || []).join(' ') }); HW.press('act', 1); }
        else HW.step(1);
    }
    return pages;
};
const start = preset => { const HW = loadGame(); if (preset) HW.preset(preset); else HW.newGame('Wren', { skipIntro: true, noAutosave: true }); HW.step(5); HW.skipTalk(); HW.Inv.maxHp = HW.Inv.hp = 30; HW.G.cheats.god = true; return HW; };
/* in at a room's door from the room below, walking up through it as a player does (the doors on the way open) */
const walkIn = (preset, area, x, y) => {
    const HW = start(preset);
    HW.warp(area, x, y + 2, 'up'); HW.step(5); HW.skipTalk();
    for (const e of HW.G.map.ents) if (e.kind === 'door' && e.tx === x && Math.abs(e.ty - y) <= 2) { e.open = true; e.anim = 8; e.keep = true; e.openedOnce = true; e.locked = false; }
    const D = HW.global('Dialog');
    HW.hold('up'); for (let i = 0; i < 240 && !D.active; i++) HW.step(1); HW.release();
    return HW;
};

/* ---------- 1. the box on Wren's shoulders ---------- */
test('the boss scenes and the talk at the Spool\'s top: no page hides over a quarter of Wren', () => {
    const scenes = {
        'the Dust Monger': () => walkIn(null, 'tidy', 56, 21),
        'the Glazer': () => walkIn('afterD1', 'kiln', 56, 21),
        "Grindle's turn": () => { const HW = start('afterD2'); HW.warp('millrace', 29, 8, 'up'); HW.step(30); HW.skipTalk(); const g = HW.G.map.ents.find(e => e.type === 'grindle'); g.phase = 2; HW.global('Script').run(HW.global('MillFoes').turn(g)); return HW; },
        'Clangor': () => walkIn('afterD3', 'belfry', 29, 32),
        'Mother Sloth': () => walkIn('afterD4', 'slumber', 29, 10),
        "the Great Marionette's second act": () => {
            const HW = start('afterD5'); HW.warp('marionette', 28, 8, 'up'); HW.step(40); through(HW);
            const g = HW.G.map.ents.find(e => e.type === 'greatmarionette'), p = HW.player(); p.x = 28 * 16 + 8; p.y = 8 * 16 + 10;
            HW.global('Script').run(HW.global('MarionetteFoes').toAct2(g)); return HW;
        },
        'the Tangle': () => walkIn('afterD6', 'spoolworks', 29, 10),
        'the Weaver': () => walkIn('afterD7', 'loom', 29, 10),
        'the Weaver, after': () => {
            const HW = start('afterD7'); HW.warp('loom', 29, 9, 'up'); HW.step(30); HW.skipTalk();
            const w = HW.G.map.ents.find(e => e.kind === 'weaver'), p = HW.player(); p.x = 29 * 16 + 8; p.y = 9 * 16 + 10; HW.step(5);
            w.alive = false; HW.global('Script').run(HW.global('LoomHouse').afterWeaver(w)); return HW;
        },
        "the Spool's top": () => walkIn('afterDrift', 'greatspool', 29, 10),
    };
    const bad = [];
    for (const [name, set] of Object.entries(scenes)) {
        const pages = through(set());
        assert.ok(pages.length, `${name}: its lines`);
        for (const q of pages) if (q.hid > 0.25) bad.push(`${name}: ${Math.round(q.hid * 100)}% of Wren hidden on "${q.words.slice(0, 40)}"`);
    }
    assert.deepEqual(bad, []);
});

test('a scene line keeps Wren all but clear of the box wherever a side and lean can (a big focus at the far end of a room-sized room)', () => {
    const HW = start('afterD1');
    HW.warp('kiln', 20 + 9, 33 + 9, 'up'); HW.step(30); HW.skipTalk();
    const D = HW.global('Dialog'), Cam = HW.global('Cam'), p = HW.player();
    /* Wren at the room's foot, the line about the whole far end (a tall focus, weighed three times) */
    const r = Cam.room, focus = { x0: (r.x + 2) * 16, y0: r.y * 16, x1: (r.x + 18) * 16, y1: (r.y + 4) * 16 };
    HW.global('Script').run(function* () { yield* HW.global('say')(null, 'Something enormous stirs at the far end of the room.', { focus }); });
    const pages = through(HW);
    assert.equal(pages.length, 1);
    assert.ok(pages[0].hid <= 0.15, `Wren ${Math.round(pages[0].hid * 100)}% hidden`);
    void p; void D;
});

/* ---------- 2. notices ---------- */
const bobbinLoft = () => { const HW = start('afterD6'); HW.warp('spoolworks', 9, 6, 'up'); HW.step(30); HW.skipTalk(); const UI = HW.global('UI'); UI.toasts = []; UI.banner = null; return HW; };
const upRects = HW => { const UI = HW.global('UI'); return UI.toasts.filter(t => !t.wait).map(t => UI.noticeRect(t, !!t.low)); };

test("the Bobbin Loft's payoff keeps clear of its four plates; a stitch let go in another room gives way to it", () => {
    const HW = bobbinLoft(), UI = HW.global('UI'), Cam = HW.global('Cam'), a = HW.G.map;
    UI.toast('Your oldest stitch lets go: the old crate in the Ropewalk would go back, but something is holding it.', 200, { minor: true });
    UI.toast('Your oldest stitch lets go: a bobbin here would go back, but something is holding it.', 200);
    HW.step(5);
    const plates = a.ents.filter(e => e.kind === 'plate' && /^bl\d$/.test(e.sig));
    assert.equal(plates.length, 4);
    HW.G.pendingToast = { s: 'All four plates down: somewhere in the wall, a winch begins, very slowly, to turn.', focus: plates.map(e => [e.tx, e.ty, 16]) };
    HW.step(20);
    assert.ok(!UI.toasts.some(t => /Ropewalk/.test(t.s)), 'the one about the Ropewalk gone');
    const pay = UI.toasts.find(t => /All four plates/.test(t.s));
    assert.ok(pay && !pay.wait, 'the payoff up');
    /* (every plate clear of the notices up, but for a pixel's sliver of its tile: in the live run two notices stacked at
       the bottom hid both bottom plates as the payoff said all four were down) */
    const plate = e => [e.tx * 16 - Cam.x, e.ty * 16 - Cam.y, e.tx * 16 + 16 - Cam.x, e.ty * 16 + 16 - Cam.y];
    for (const e of plates) assert.ok(upRects(HW).reduce((n, r) => n + ov(r, plate(e)), 0) <= 16, `a plate under the notices (${plate(e)})`);
});

test('a second notice goes to the free side rather than stacking on the first (reaching into the middle, the other edge bare)', () => {
    const HW = bobbinLoft(), UI = HW.global('UI'), p = HW.player(), Cam = HW.global('Cam');
    p.y = Cam.y + 90;
    UI.toast('One thing.', 200); HW.step(3);
    UI.toast('Another thing.', 200); HW.step(3);
    const [a, b] = UI.toasts;
    assert.ok(!a.wait && !b.wait && a.low !== b.low, 'one up top, one at the bottom');
});

test('a notice said in a fight goes when the boss goes down: not back up after its last words, over the Knot coming down', () => {
    const HW = start('afterD1');
    HW.warp('kiln', 20 + 9, 33 + 6, 'up'); HW.step(30); HW.skipTalk();
    const UI = HW.global('UI'), Enemy = HW.global('Enemy'), Cam = HW.global('Cam'), Script = HW.global('Script'), say = HW.global('say');
    UI.toasts = [];
    const b = HW.G.map.add(new Enemy(Math.floor((Cam.x + 160) / 16), Math.floor((Cam.y + 48) / 16), { type: 'housekeeper', hp: 3 }));
    UI.toast('The floor cracks open into a glowing pit, and it coils itself down into it, out of reach.', 300);
    HW.step(10);
    assert.ok(UI.toasts.length === 1 && !UI.toasts[0].wait, 'up');
    /* its last words held it back (a scene's talking); it goes down meanwhile */
    Script.run(function* () { yield* say(null, 'It comes apart, piece by piece.'); });
    HW.step(3);
    b.alive = false;
    HW.skipTalk(); HW.step(10);
    assert.equal(UI.toasts.length, 0, 'gone, not back up');
    /* and one said with nobody to fight is just a notice */
    UI.toast('A plain notice.', 120); HW.step(5);
    assert.ok(UI.toasts.some(t => t.s === 'A plain notice.' && !t.wait));
});

test('a second notice that would hide Wren or whoever is about wherever it went waits for the first to go', () => {
    const HW = start('afterD1');
    HW.warp('kiln', 20 + 9, 33 + 6, 'up'); HW.step(30); HW.skipTalk();
    const UI = HW.global('UI'), Cam = HW.global('Cam'), NPC = HW.global('NPC'), p = HW.player();
    UI.toasts = []; UI.banner = null;
    /* Wren low on the screen, somebody high up on it: a long notice at the bottom fits under neither's feet... */
    p.y = Cam.y + 128;
    HW.G.map.add(new NPC(p.tx, Math.round((Cam.y + 30) / 16), { who: 'gran' }));
    const long = 'A long notice, that runs on and on over two or three lines of the screen, the way the Pull did at the top of the Spool.';
    UI.toast(long, 200); HW.step(2);
    const first = UI.toasts[0];
    assert.ok(!first.wait, 'the first shows');
    UI.toast('A great thread parts with a sound like a bell cracking.', 120); HW.step(2);
    const second = UI.toasts[1];
    assert.ok(second.wait, 'the second waits while the first is up');
    for (let i = 0; i < 400 && second.wait; i++) HW.step(1);
    assert.ok(!second.wait, 'and then shows');
});

test('the Laundry: "Bolted, from the other side." with Wren at the top of the screen goes to the bottom', () => {
    const HW = start('afterD4');
    HW.warp('slumber', 47, 23, 'up'); HW.step(30); HW.skipTalk();
    const UI = HW.global('UI'); UI.toasts = []; UI.banner = null;
    HW.hold('up'); for (let i = 0; i < 40 && !UI.toasts.length; i++) HW.step(1); HW.release(); HW.step(3);
    const t = UI.toasts.find(q => /Bolted/.test(q.s));
    assert.ok(t && !t.wait, 'the refusal');
    assert.equal(t.low, true, 'at the bottom, off Wren');
    assert.equal(ov(wrenOnScreen(HW), UI.noticeRect(t, true)), 0);
});

/* ---------- 3. banners ---------- */
test('a new game: the first room\'s name waits for the room to come up out of the dark (none left up from a game before)', () => {
    for (const before of [false, true]) {
        const HW = loadGame();
        /* (a game going already, its room's name up, as the debug start or a game played before has it) */
        if (before) { HW.newGame('Wren', { skipIntro: true, noAutosave: true }); HW.warp('gran_room', 6, 3); HW.step(10); }
        HW.newGame('Wren', { noAutosave: true });
        const UI = HW.global('UI');
        for (let i = 0; i < 400; i++) {
            HW.step(1);
            assert.ok(!(UI.banner && !UI.banner.wait && !UI.held() && UI.fadeA > 0.5), `the name over a dark screen at ${i}${before ? ' (a game before)' : ''}`);
        }
    }
});

test('outdoors, back across a border into a region whose name was up a little while ago: not again', () => {
    const HW = start('afterD3');
    HW.warp('hollow', 96, 60); HW.step(5); HW.skipTalk();
    const UI = HW.global('UI'), named = [];
    const show0 = UI.showBanner;
    UI.showBanner = function (s, ...r) { show0.call(this, s, ...r); if (this.banner && this.banner.s === s) named.push(s); };
    /* (each a region's name, as World.checkRegion says it on a crossing) */
    UI.showBanner('Belfry Heights', null, true); HW.step(300);
    UI.showBanner('The Bluster', null, true); HW.step(300);
    UI.showBanner('Belfry Heights', null, true);
    assert.deepEqual(named, ['Belfry Heights', 'The Bluster'], 'the Heights not again, ten seconds on');
    HW.G.t += 90 * 60;
    UI.showBanner('Belfry Heights', null, true);
    assert.equal(named[named.length - 1], 'Belfry Heights', 'but again after a while');
});

/* ---------- 4. the HUD over things ---------- */
const covers = HW => { const UI = HW.global('UI'); HW.global('Game').render(); UI._hc = undefined; return UI.hudCovers() ? UI._hcSide.slice() : [false, false]; };

test("the HUD steps back from the Slumberhouse door's lamps (drawn by the place) under its hearts", () => {
    const HW = start('afterD4');
    HW.warp('hollow', 153, 51); HW.step(5); HW.skipTalk();
    const Cam = HW.global('Cam'), [lx, ly] = HW.global('Hushwood').lampAt(0);
    assert.ok(lx - Cam.x < 100 && ly - Cam.y < 20, 'a lamp up under the hearts');
    assert.equal(covers(HW)[0], true, 'the hearts step back');
});

test("the HUD steps back from a weathervane's arrow under the keys (Windward)", () => {
    const HW = start('afterD3'); HW.Inv.equipped = HW.Inv.equipped || 'stick';
    HW.warp('belfry', 40 + 8, 44 + 6); HW.step(10); HW.skipTalk();
    const v = HW.G.map.ents.find(e => e.kind === 'vane' && HW.global('Cam').room === HW.G.map.roomAt(e.tx, e.ty));
    assert.ok(v, 'the vane');
    assert.equal(covers(HW)[1], true, 'the keys step back');
});

test("a room's top wall, in the HUD's row, has no portholes or arrow slits to be taken for its gems", () => {
    const HW = start('afterD2');
    HW.warp('millrace', 29, 5); HW.step(5); HW.skipTalk();
    const a = HW.G.map, TD = HW.global('TileDraw'), cache = HW.global('TILE_CACHE'), r = a.rooms[0];
    /* (a stretch of a room's top wall with floor under it: a wall's face) */
    const x = [...Array(r.w).keys()].map(i => r.x + i).find(x => a.kindName(x, r.y) === 'wall' && a.kindName(x, r.y + 1) !== 'wall');
    TD.draw(a, x, r.y, 0, 0);
    assert.ok(Object.keys(cache).some(k => /:wall:\d+:\d+:hud$/.test(k)), 'drawn as a top wall');
    const cols = [], ctx = new Proxy({}, { get: (o, k) => k === 'fillRect' ? () => cols.push(o.fillStyle) : k in o ? o[k] : () => { }, set: (o, k, v) => { o[k] = v; return true; } });
    for (const [th, v, gem] of [['millhouse', 3, '#c8903a'], ['belfryhouse', 1, '#78c4ea']]) {
        cols.length = 0; HW.global('WALLS')[th].face(ctx, null, v, true);
        assert.ok(!cols.includes(gem), `${th}: none up top`);
        cols.length = 0; HW.global('WALLS')[th].face(ctx, null, v, false);
        assert.ok(cols.includes(gem), `${th}: still elsewhere`);
    }
});

test('a find held up in a room\'s top row is on the screen (beside her head, not off its top)', () => {
    const HW = start('afterD2');
    HW.warp('millrace', 29, 1); HW.step(5); HW.skipTalk();
    const p = HW.player(), Cam = HW.global('Cam'), spot = HW.global('holdUpSpot');
    HW.G.holdUp = { id: 'key', t: 0 }; p.state = 'hold';
    const [x, y] = spot(p, Cam.x, Cam.y);
    assert.ok(y - 8 >= 1 && y + 8 <= H && x - 8 >= 0 && x + 8 <= W, `the key at ${x},${y}`);
    p.y += 4 * 16; const [, y2] = spot(p, Cam.x, Cam.y);
    assert.equal(y2, p.y - Cam.y - 22, 'over her head where there is room');
    HW.G.holdUp = null; p.state = 'normal';
});

/* ---------- 5. floating words and people ---------- */
test("floating words keep off people's faces, and aren't pushed beside someone else's head (\"Hmph.\" read as Wren's)", () => {
    const HW = start('afterD1');
    HW.warp('hollow', 96, 60); HW.step(5); HW.skipTalk();
    const Fx = HW.global('Fx'), Cam = HW.global('Cam'), NPC = HW.global('NPC'), a = HW.G.map, p = HW.player();
    for (const e of a.ents.slice()) if (e.kind === 'npc') a.remove(e);
    /* somebody right where a line floats */
    const n = a.add(new NPC(p.tx + 3, p.ty, { who: 'rosa' })), top = n.py + 14 - n.sprite().height;
    const face = [n.px - Cam.x + 2, top - Cam.y, n.px - Cam.x + 14, top - Cam.y + 12];
    Fx.list = [{ x: n.px + 8, y: n.py - 6, text: 'Ooh... is that something shiny?', col: '#ffffff', life: 40 }];
    let [s] = Fx.textSpots(Fx.list, Cam.x, Cam.y);
    assert.equal(ov([s.x - 3, s.y - 2, s.x + s.w + 3, s.y + 10], face), 0, 'off the face');
    /* said by someone with a bubble over his head and Wren just above him: not pushed up beside her */
    a.remove(n);
    const t = a.add(new NPC(p.tx, p.ty + 1, { who: 'tuck' })); t.bubble = 'dots';
    for (const by of [null, t]) {
        Fx.list = [{ x: t.px + 8, y: t.py - 18, text: 'Hmph.', col: '#ffffff', life: 40, by }];
        [s] = Fx.textSpots(Fx.list, Cam.x, Cam.y);
        const mid = [s.x + s.w / 2, s.y + 4], d = (q, r) => Math.hypot(q[0] - r[0], q[1] - r[1]);
        assert.ok(d(mid, [t.px + 8 - Cam.x, t.py - 4 - Cam.y]) < d(mid, [p.x - Cam.x, p.y - 8 - Cam.y]), `nearer his head than hers (${s.x},${s.y}${by ? ', said by him' : ''})`);
    }
    Fx.list = [];
});

test('a long line said by somebody off the top of the screen, over a crowd of faces: it goes over a face, never the HUD', () => {
    const HW = start('afterD7');
    for (let i = 1; i < 8; i++) HW.Progress.set('making' + i);
    HW.warp('making8', 13, 17); HW.step(30); HW.skipTalk(); HW.step(5);
    const Fx = HW.global('Fx'), Cam = HW.global('Cam'), NPC = HW.global('NPC'), a = HW.G.map;
    /* (the boy under the hoop, with a bubble; the Makers in their rows; as the live run had them) */
    const t = a.add(new NPC(Math.floor((Cam.x + 224) / 16), Math.floor((Cam.y + 92) / 16), { who: 'tuck' })); t.bubble = 'dots';
    Fx.list = [{ x: t.px + 8, y: t.py - 18, text: 'Ooh! It jumped!', col: '#ffffff', life: 40, by: t },
        { x: Cam.x + 408, y: Cam.y - 112, text: '...Tidied. By my own tidying.', col: '#ffffff', life: 40 }];
    const hud = Fx.hudBoxes();
    for (const sp of Fx.textSpots(Fx.list, Cam.x, Cam.y, [])) {
        const r = [sp.x - 3, sp.y - 2, sp.x + sp.w + 3, sp.y + 10];
        for (const h of hud) assert.equal(ov(r, h), 0, `"${sp.p.text}" over the HUD (${r} on ${h})`);
    }
    Fx.list = [];
});

test('a Little House starts with the boy up above on Wren\'s very spot: she is drawn through him (her outline)', () => {
    const HW = start('afterD7');
    HW.warp('making1', 3, 16); HW.step(30); HW.skipTalk(); HW.step(5);
    const p = HW.player(), Cam = HW.global('Cam');
    assert.ok(p.behind(Cam.x, Cam.y, HW.G.map.ents.filter(e => !e.floor)) >= 0.25, 'behind him: her outline drawn');
    /* (and not for somebody behind her) */
    const H2 = start('afterD1'); H2.warp('hollow', 96, 60); H2.step(5); H2.skipTalk();
    const q = H2.player(), C2 = H2.global('Cam'), NPC = H2.global('NPC');
    for (const e of H2.G.map.ents.slice()) if (e.kind === 'npc') H2.G.map.remove(e);
    H2.G.map.add(new NPC(q.tx, q.ty - 1, { who: 'rosa' }));
    assert.equal(q.behind(C2.x, C2.y, H2.G.map.ents.filter(e => !e.floor)), 0, 'in front of her');
});

test("at a Little House's end, Wren steps aside from somebody standing over or under her", () => {
    const HW = start('afterD7');
    HW.warp('making7', 3, 16); HW.step(30); HW.skipTalk(); HW.step(5);
    const a = HW.G.map, p = HW.player(), NPC = HW.global('NPC'), Script = HW.global('Script');
    a.add(new NPC(p.tx, p.ty + 1, { who: 'otto' }));
    Script.run(function* () { yield* HW.global('stepAside')(); });
    for (let i = 0; i < 120 && Script.blocking(); i++) HW.step(1);
    assert.ok(!a.ents.some(e => e.kind === 'npc' && e.tx === p.tx && Math.abs(e.ty - p.ty) <= 1), `still on top of somebody at ${p.tx},${p.ty}`);
});

test('the Makers come out on the Great Stage: Bram not in file behind Mother Ives, and turned to you to say his line', () => {
    const HW = start('afterD5');
    HW.warp('marionette', 28, 8, 'up'); HW.step(40); through(HW);
    const g = HW.G.map.ents.find(e => e.type === 'greatmarionette'), D = HW.global('Dialog'), DOWN = HW.global('DOWN');
    HW.global('Script').run(HW.global('Reveal1').curtain(g));
    let seen = null;
    for (let i = 0; i < 3000 && !seen; i++) {
        HW.step(1);
        if (D.active && D.who === 'bram') { const b = HW.G.map.ents.find(e => e.who === 'bram'), iv = HW.G.map.ents.find(e => e.who === 'ives'); seen = { dir: b.dir, file: b.tx === iv.tx && Math.abs(b.ty - iv.ty) === 1 }; }
        if (D.active && D.who !== 'bram' && D.shown >= D.pageLen()) HW.press('act', 1);
    }
    assert.ok(seen, "Bram's line");
    assert.equal(seen.dir, DOWN, 'turned to you');
    assert.equal(seen.file, false, 'not in file with Ives');
});

test("the speaker's name tag slides along the box off a face it would sit on; a one-line tag has no end stitches (\":Mother Ives:\")", () => {
    const HW = start('afterD1');
    HW.warp('hollow', 96, 60); HW.step(5); HW.skipTalk();
    const D = HW.global('Dialog'), Cam = HW.global('Cam'), NPC = HW.global('NPC'), a = HW.G.map, p = HW.player(), Fx = HW.global('Fx');
    for (const e of a.ents.slice()) if (e.kind === 'npc') a.remove(e);
    /* somebody standing just over the bottom box's left end, where a left-hand tag goes; Wren well clear, up the screen */
    p.y -= 30; HW.step(60);
    a.add(new NPC(Math.floor((Cam.x + 22) / 16), Math.floor((Cam.y + 128) / 16), { who: 'rosa' }));
    D.open('ives', 'And wipe your feet!');
    const tag = D.rects()[1], faces = Fx.heads(Fx.view(Cam.x, Cam.y));
    assert.ok(!D.top, 'the box at the bottom');
    assert.ok(!faces.some(f => ov(f, tag) > 0), `the tag (${tag}) off every face`);
    D.close();
    /* a one-line tag: its cloth, edge and shading, but no stitches at its ends */
    const Gfx = HW.global('Gfx'), r0 = Gfx.rect, small = [];
    Gfx.rect = function (x, y, w, h, c) { if (w <= 2 && h <= 2) small.push([x, y, w, h, c]); return r0.apply(this, arguments); };
    try { HW.global('stitchedBox')(10, 10, 60, 15, { fill: '#7ccfc0', stitch: '#ffffff' }); } finally { Gfx.rect = r0; }
    assert.deepEqual(small.filter(q => q[4] === '#ffffff'), [], 'no white stitches');
});

test("Grindle's turn reads in sentences: no page starts in the middle of one", () => {
    const HW = start('afterD2');
    HW.warp('millrace', 29, 8, 'up'); HW.step(30); HW.skipTalk();
    const g = HW.G.map.ents.find(e => e.type === 'grindle'); g.phase = 2;
    HW.global('Script').run(HW.global('MillFoes').turn(g));
    const pages = through(HW);
    assert.ok(pages.length >= 2);
    for (const q of pages) assert.match(q.words, /^["A-Z]/, `"${q.words.slice(0, 30)}"`);
});
