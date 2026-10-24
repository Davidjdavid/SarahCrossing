/* ---- 32q_hd_houses.js ---- */
/* HD houses: drawHouse (2b_exterior.js) remastered at three times the detail for the HD-2D view. A house is drawn from
   its look (wall, roof, door and trim colors, roof style, wall pattern, add-ons, the owner's own touch, the storeys), so
   every paint job Ginger can do has an HD version: hdHouseFrame(key) for houses drawn from a look ('hx_<id>', Sarah's
   always), and HD_SPR for the atlas houses nobody repainted (the same recipe, from HOUSE_BASE). Each old pixel is a
   3x3 block and every shape keeps its old place; where the old sprite had flat colors there are shingles, boards,
   bricks, glass and cloth now. Also the mailbox and the campsite tents. Coordinates are HD pixels (old ones as 3 * n). */

/* ---------------------------------------------------------------- helpers */
/* a small seeded hash in [0, 1): shingle tones, straw, leaves, the same every time */
function hdH_rnd(x, y, k) {
    let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul((k | 0) + 7, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
}
function hdH_hex(c) { c = pxHex(c); return '#' + ((1 << 24) | (c[0] << 16) | (c[1] << 8) | c[2]).toString(16).slice(1); }
/* a color a little darker (f > 0: toward a dusky mauve, as shade looks on a sunny day) or lighter (f < 0: warm light) */
function hdH_shade(c, f) { return hdH_hex(f > 0 ? pxMix(c, '#5e4458', Math.min(1, f * 1.5)) : pxMix(c, '#fff6e0', Math.min(1, -f * 1.5))); }
/* five shades with small steps, for big flat surfaces (walls, roofs, cloth): boards and seams read without noise */
const HDH_SOFT = new Map();
function hdH_soft(hex) {
    let r = HDH_SOFT.get(hex);
    if (!r) { const q = hdRamp(hex), m = (a, b, t) => [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * t)); r = [m(q[0], [45, 34, 48], 0.35), m(q[1], q[2], 0.45), q[2], m(q[3], q[2], 0.4), q[3]]; HDH_SOFT.set(hex, r); }
    return r;
}
/* a drawing in progress: parts remember their color, and texture passes wait until every shape is down, then touch only
   the pixels still theirs (a shade nudged early would stick to whatever is drawn over that pixel later). A pixel can be
   painted another color and tinted darker or lighter (the tints add up); both keep the part's shading. */
function hdH_new(s) {
    const W = s.w, n = W * s.h, g = { s, W, base: [], soft: [], texBy: [], dots: [], tn: new Float32Array(n), pc: new Int16Array(n).fill(-1), pal: [], palAt: new Map() };
    g.part = (hex, o, soft) => { hex = hdH_hex(hex); const id = s.add(soft ? hdH_soft(hex) : hdRamp(hex), o); g.base[id] = hex; g.soft[id] = !!soft; return id; };
    g.tx = (id, fn) => { (g.texBy[id] || (g.texBy[id] = [])).push(fn); };
    g.color = hex => { let k = g.palAt.get(hex); if (k === undefined) { k = g.pal.length; g.pal.push(hex); g.palAt.set(hex, k); } return k; };
    g.paint = (x, y, hex) => { g.pc[y * W + x] = g.color(hex); };
    g.tint = (x, y, f) => { g.tn[y * W + x] += f; };
    g.dot = (id, x, y, c) => g.dots.push([id, Math.round(x), Math.round(y), c]);
    return g;
}
function hdH_finish(g) {
    const s = g.s, W = s.w, H = s.h, P = s.part, tn = g.tn, pc = g.pc;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const t = g.texBy[P[y * W + x]]; if (t) for (const f of t) f(x, y); }
    /* each (color, tint step, kind of ramp) once; the sprite's alternate materials set directly, the way recolor does */
    const ramps = new Map(), base = g.base.map(h => g.color(h));
    for (let i = 0; i < W * H; i++) {
        const p = P[i];
        if (p < 0 || (pc[i] < 0 && Math.abs(tn[i]) < 0.01)) continue;
        const c = pc[i] >= 0 ? pc[i] : base[p], q = Math.round(tn[i] * 50), key = (c * 512 + q + 256) * 2 + (g.soft[p] ? 1 : 0);
        let k = ramps.get(key);
        if (k === undefined) {
            const hex = q ? hdH_shade(g.pal[c], q / 50) : g.pal[c];
            k = s.alts.length; s.alts.push(g.soft[p] ? hdH_soft(hex) : hdRamp(hex)); ramps.set(key, k);
        }
        if (!s.alt) s.alt = new Int16Array(W * H).fill(-1);
        s.alt[i] = k;
    }
    for (const [id, x, y, c] of g.dots) if (id < 0 || s.at(x, y) === id) s.px(x, y, c);
}

/* ---------------------------------------------------------------- a house from its look */
/* the HD frame for a look (key = JSON.stringify(look)), anchored like exteriorFrame's: the middle, three old pixels up */
function hdHouseFrame(key) {
    return hdCached('h|' + key, () => {
        const L = JSON.parse(key), s = new HDSprite(L.w * 3, L.h * 3);
        hdH_house(s, L);
        return { c: s.canvas(), w: L.w * 3, h: L.h * 3, ax: 3 * Math.floor(L.w / 2), ay: 3 * (L.h - 3) };
    });
}
function hdH_house(s, L) {
    const w = L.w, h = L.h, wt = Math.floor(h * 0.42), g = hdH_new(s);
    Object.assign(g, { L, w, h, wt, WT: wt * 3, GY: (h - 3) * 3, st: L.style || 'gable', rainbow: L.roof === 'rainbow', wins: [] });
    g.roof = g.rainbow ? '#ff5a6a' : L.roof;
    hdH_wall(g);
    hdH_roof(g);
    if (L.chimney) hdH_chimney(g);
    if (L.level === 1 || L.level >= 3) hdH_dormer(g);
    const dw = 10, dh = 15, dx = (L.doorX != null ? L.doorX : Math.floor(w / 2)) - 5;
    hdH_door(g, dx);
    const win = (wx, wy) => { if (wy + 10 > h - 4 - dh && wx + 10 > dx - 1 && wx < dx + dw + 1) return; hdH_window(g, wx, wy); g.wins.push([wx, wy]); };
    if (L.level >= 2) {
        for (const wx of [6, Math.floor(w / 2) - 5, w - 16]) win(wx, wt + 5);
        hdH_floorBand(g);
        for (const wx of [6, w - 16]) win(wx, h - 21);
    } else for (const wx of [6, w - 16]) win(wx, wt + 6);
    if (L.level >= 4) hdH_porch(g, dx);
    if (L.sig && hdH_sig[L.sig]) hdH_sig[L.sig](g);
    if (L.band) hdH_band(g, L.trim, 0);
    if (L.awning) hdH_awning(g, g.roof === '#fbf6ee' ? '#e0405a' : g.roof, '#fff4dc');
    if (L.shutters) for (const [wx, wy] of g.wins) hdH_shutters(g, wx, wy);
    if (L.boxes) for (const [wx, wy] of g.wins) hdH_flowerBox(g, wx, wy);
    if (L.lamps) for (const lx of [dx - 5, dx + dw + 2]) hdH_lamp(g, lx);
    if (L.plants) for (const px of [dx - 8, dx + dw + 3]) hdH_plant(g, px);
    if (L.wreath) hdH_wreath(g, dx);
    hdH_finish(g);
}

/* where a house's window glass is, in HD pixels (keep in step with the windows hdH_house draws): lit at night in the
   HD-2D view */
function hdH_winRects(L) {
    const w = L.w, h = L.h, wt = Math.floor(h * 0.42), dw = 10, dh = 15, dx = (L.doorX != null ? L.doorX : Math.floor(w / 2)) - 5, out = [];
    const win = (wx, wy) => { if (wy + 10 > h - 4 - dh && wx + 10 > dx - 1 && wx < dx + dw + 1) return; out.push([3 * wx, 3 * wy + 3, 30, 24]); };
    if (L.level >= 2) { for (const wx of [6, Math.floor(w / 2) - 5, w - 16]) win(wx, wt + 5); for (const wx of [6, w - 16]) win(wx, h - 21); }
    else for (const wx of [6, w - 16]) win(wx, wt + 6);
    return out;
}

/* ---------------------------------------------------------------- walls */
function hdH_wall(g) {
    const { s, L, w, h, wt, WT, GY } = g, W = g.W, wall = L.wall, p = L.pattern || 'plain', top = 3 * (h - 7);
    const id = g.wallId = g.part(wall, { flat: 1 }, true);
    s.rect(id, 4, WT, W - 8, GY - WT);
    if (p === 'siding') g.tx(id, (x, y) => {
        if (y >= top) return;
        const r = ((y - 3 * (wt + 3) - 1) % 9 + 9) % 9;
        if (r === 0) { s.mod(x, y, -1); g.tint(x, y, 0.1); } else if (r === 1) s.mod(x, y, 1); else if (r === 8 && hdH_rnd(x >> 4, y, 2) < 0.5) s.mod(x, y, -1);
    });
    else if (p === 'brick') g.tx(id, (x, y) => {
        if (y >= top) return;
        const r = Math.floor((y - WT) / 6), ry = (y - WT) % 6, xx = x + (r % 2) * 6, rx = xx % 12;
        if (ry === 5 || rx === 0) { s.mod(x, y, -1); g.tint(x, y, 0.12); return; }
        const t = hdH_rnd(Math.floor(xx / 12), r, 5);
        if (t < 0.25) g.tint(x, y, 0.07); else if (t > 0.84) g.tint(x, y, -0.08);
        if (ry === 0 && rx < 11) s.mod(x, y, 1);
    });
    else if (p === 'shingle') g.tx(id, (x, y) => {
        if (y >= top) return;
        const rel = y - 3 * (wt + 3), b = Math.floor(rel / 12), r = rel - b * 12, u = (((x + (b & 1) * 6) % 12) + 0.5) / 12, e = Math.round(3 * Math.sin(Math.PI * u));
        if (r === e) { s.mod(x, y, -1); g.tint(x, y, 0.1); } else if (r === e + 1) s.mod(x, y, -1); else if (r === (e + 11) % 12) s.mod(x, y, 1);
    });
    else if (p === 'stripes') {
        const st = hdH_hex(pxLight(wall, 0.3));
        g.tx(id, (x, y) => { const ox = Math.floor(x / 3); if (y < top && ox >= 4 && (ox - 4) % 5 < 2 && ox - (ox - 4) % 5 < w - 3) { g.paint(x, y, st); if ((ox - 4) % 5 === 0 && x % 3 === 0) s.mod(x, y, -1); } });
    } else if (p === 'timber') {
        const b = g.part(pxDark(wall, 0.5), { flat: 1, layer: 1 }, true), mid = wt + Math.floor((h - 7 - wt) / 2);
        for (const x of [2, Math.floor(w / 3), Math.floor(2 * w / 3), w - 4]) { const x0 = x === 2 ? 4 : 3 * x, x1 = x === w - 4 ? W - 5 : 3 * x + 5; s.rect(b, x0, WT, x1 - x0 + 1, top - WT); }
        s.rect(b, 4, 3 * mid, W - 8, 6);
        s.line(b, 10.5, 3 * mid - 1.5, 3 * Math.floor(w / 3) - 1.5, 3 * (wt + 3) + 1.5, 2.1);
        s.line(b, 3 * (w - 4) + 1.5, 3 * mid - 1.5, 3 * (Math.floor(2 * w / 3) + 2) + 1.5, 3 * (wt + 3) + 1.5, 2.1);
        /* wood grain along each beam */
        g.tx(b, (x, y) => { const hz = y >= 3 * mid && y < 3 * mid + 6, q = hz ? hdH_rnd(y, x >> 3, 11) : hdH_rnd(x, y >> 3, 11); if (q < 0.14) s.mod(x, y, -1); else if (q > 0.9) s.mod(x, y, 1); });
    }
    /* the plinth: a darker band of stone blocks with a lit ledge */
    const pl = g.part(pxDark(wall, 0.18), { flat: 1, layer: 1 }, true);
    s.rect(pl, 3, GY - 12, W - 6, 12);
    g.tx(pl, (x, y) => {
        const r = y - (GY - 12);
        if (r === 0) s.mod(x, y, 1);
        else if (r === 6 || ((x + (r > 6 ? 11 : 0)) % 22 === 0 && r > 1)) s.mod(x, y, -1);
        else if (r === 1 || r === 7) { if (hdH_rnd(x >> 3, r, 4) < 0.5) s.mod(x, y, 1); }
    });
    /* the right edge turns away from the light */
    g.tx(id, (x, y) => { if (x >= W - 7) g.tint(x, y, 0.1); });
}
/* the trim between two storeys */
function hdH_floorBand(g) {
    const { s, L, WT } = g, W = g.W, b = g.part(L.trim, { flat: 1, layer: 3 }, true);
    s.rect(b, 3, WT + 54, W - 6, 6);
    g.tx(b, (x, y) => { if (y === WT + 54) s.mod(x, y, 1); });
    g.tx(g.wallId, (x, y) => { if (y >= WT + 60 && y < WT + 63) g.tint(x, y, 0.15); });
}

/* ---------------------------------------------------------------- roofs */
function hdH_roof(g) {
    const { s, L, w, wt, WT, st, roof } = g, W = g.W, id = g.roofId = g.part(roof, { flat: 1, layer: 4 }, true);
    let eave = -1, y1;
    const band = y => RAINBOW[Math.floor(y / 9) % RAINBOW.length], rbDark = RAINBOW.map(c => hdH_hex(pxDark(c, 0.18)));
    if (st === 'flat') {
        /* a slab seen a little from above: the top lit, the front edge, the dark underside */
        s.rect(id, 0, WT - 24, W, 27);
        eave = g.part(pxDark(roof, 0.22), { flat: 1, layer: 4 }, true);
        s.rect(eave, 0, WT + 3, W, 6);
        y1 = WT + 9;
        g.tx(id, (x, y) => {
            const r = y - (WT - 24);
            if (g.rainbow) g.paint(x, y, band(y));
            if (r < 11) { s.mod(x, y, 1); if (r === 1 || (r > 2 && x % 24 === 11 && r < 10)) s.mod(x, y, -1); if (r >= 9) s.mod(x, y, -1); }
            else if (r === 11) s.mod(x, y, -1);
            else if (r === 12) s.mod(x, y, 1);
        });
    } else if (st === 'thatch') {
        for (let Y = 0; Y < WT + 12; Y++) {
            let ins = 3 * Math.max(0, (wt + 4 - (Y - 1) / 3) / 2 - 4.5);
            if (Y < 6) ins += 6 - Math.sqrt(36 - (6 - Y) ** 2);
            for (let X = Math.round(ins); X < W - Math.round(ins); X++) s.plot(id, X, Y);
        }
        /* the ragged straw ends under the eave */
        const fr = g.part(pxDark(roof, 0.25), { flat: 1, layer: 4 }, true);
        for (let X = 0; X < W; X++) { const n = Math.round(2.5 + 1.5 * Math.sin(X * 1.3) + hdH_rnd(X >> 1, 3, 9) * 1.6); for (let j = 0; j < n; j++) s.plot(fr, X, WT + 12 + j); }
        g.tx(fr, (x, y) => { if (y === WT + 12) s.mod(x, y, 1); });
        y1 = WT + 14;
        g.tx(id, (x, y) => {
            /* tiers of straw, each tucked under the ragged lit ends of the one above, with a few short strands (with the
               rainbow, tiers as tall as its bands, each tier one color) */
            const n = g.rainbow ? 9 : 13, t = y + Math.round(2.5 + 2.5 * Math.sin(x * 0.45 + Math.floor(y / n)) * hdH_rnd(x >> 2, y / n | 0, 7)), r = t % n;
            if (g.rainbow && y < WT + 9) g.paint(x, y, RAINBOW[Math.floor(t / n) % RAINBOW.length]);
            if (y < 3) { s.mod(x, y, 1); return; }
            if (r === 0) { s.mod(x, y, -1); g.tint(x, y, 0.1); } else if (r === 1) s.mod(x, y, -1); else if (r === n - 1) s.mod(x, y, 1);
            else {
                const col = x >> 1, q = hdH_rnd(col, Math.floor(t / n), 3), o = 2 + Math.floor(q * 37) % (n - 7);
                if (r >= o && r < o + 4) { if (q < 0.3 && x % 2 === 0) s.mod(x, y, 1); else if (q > 0.78 && x % 2 === 1) s.mod(x, y, -1); }
            }
        });
    } else {
        const peaked = st === 'peaked';
        for (let Y = 0; Y < WT; Y++) {
            const y = (Y - 1) / 3;
            let ins = peaked ? Math.max(0, 3 * (wt - y) * (w / 2 - 3) / wt) : Y < 18 ? 3 * (wt + 3 - y) * 0.35 : 0;
            if (peaked && Y < 5) ins += 5 - Math.sqrt(25 - (5 - Y) ** 2);
            for (let X = Math.round(ins); X < W - Math.round(ins); X++) s.plot(id, X, Y);
        }
        eave = g.part(pxDark(roof, 0.22), { flat: 1, layer: 4 }, true);
        s.rect(eave, 0, WT, W, 9);
        y1 = WT + 9;
        if (st === 'tiled') g.tx(id, (x, y) => {
            /* scalloped tiles in staggered rows: each rounded end catches the light over a dark gap, the top of each row in
               the shade of the row above (with the rainbow, rows as tall as its bands, so each tile is one color) */
            const th = g.rainbow ? 9 : 12, b = Math.floor(y / th), ry = y % th, rx = (x + (b % 2) * 6) % 12, c = rx === 0 || rx === 11 ? 3 : rx === 1 || rx === 10 ? 1 : 0, bot = th - 1 - c;
            if (g.rainbow) g.paint(x, y, RAINBOW[(b + (ry > bot ? 1 : 0)) % RAINBOW.length]);
            g.tint(x, y, 0.06 * y / WT - 0.05);
            if (y < 3) { s.mod(x, y, 1); return; }
            if (ry > bot) { s.mod(x, y, -1); g.tint(x, y, 0.14); }
            else if (ry < 2) { s.mod(x, y, -1); if (ry === 0) g.tint(x, y, 0.08); }
            else if (ry === bot || (ry === bot - 1 && c === 0 && rx > 3 && rx < 8)) s.mod(x, y, 1);
            else if (rx === 0 || rx === 11) s.mod(x, y, -1);
            else if (hdH_rnd(Math.floor((x + (b % 2) * 6) / 12), b, 4) < 0.2) g.tint(x, y, 0.05);
        });
        else g.tx(id, (x, y) => {
            /* shingle courses (the old sprite's bands of three rows): a crisp shadow under each course, its top in shade,
               a lit lip at the bottom, tabs of uneven width (a dark gap, then the next tab's lit edge); lighter up the slope */
            const b = Math.floor(y / 9), ry = y % 9, cell = Math.floor((x + b * 5) / 13), nx = cell * 13 - b * 5 + 4 + Math.floor(hdH_rnd(cell, b, 8) * 6);
            if (g.rainbow) g.paint(x, y, band(y)); else if (b % 2) g.tint(x, y, 0.05);
            g.tint(x, y, 0.06 * y / WT - 0.05);
            if (y < 3) { s.mod(x, y, 1); return; }
            if (ry === 0) { s.mod(x, y, -1); g.tint(x, y, 0.1); }
            else if (ry === 1) s.mod(x, y, -1);
            else if (ry === 8) s.mod(x, y, 1);
            else if (x === nx) { s.mod(x, y, -1); if (ry > 2) g.tint(x, y, 0.08); }
            else if (x === nx + 1 && ry > 2) s.mod(x, y, 1);
            else if (ry > 2 && hdH_rnd(cell + (x > nx ? 1 : 0), b, 9) < 0.18) g.tint(x, y, 0.04);
        });
    }
    if (eave >= 0) g.tx(eave, (x, y) => {
        const r = y - (st === 'flat' ? WT + 3 : WT);
        if (g.rainbow && y < WT + 9) g.paint(x, y, rbDark[Math.floor(y / 9) % RAINBOW.length]);
        if (r === 0) s.mod(x, y, 1);
    });
    g.roofBottom = y1;
    /* the shadow under the eave, fading down the wall */
    g.tx(g.wallId, (x, y) => { const d = y - y1; if (d >= 0 && d < 14) g.tint(x, y, 0.2 * (1 - d / 14) ** 1.5); });
}
function hdH_chimney(g) {
    const { s, L, wt, st } = g, cx = g.w - 15, top = st === 'flat' ? wt - 15 : 1, bot = st === 'flat' ? wt - 8 : Math.max(8, wt - 12);
    const b = g.part(pxDark(L.wall, 0.25), { flat: 1, layer: 5 }, true), cap = g.part(pxDark(L.wall, 0.4), { flat: 1, layer: 6, cast: 2 }, true);
    s.rect(b, 3 * cx, 3 * top, 18, 3 * (bot - top));
    s.rect(cap, 3 * cx - 3, 3 * top, 24, 6);
    g.tx(cap, (x, y) => { if (y === 3 * top) s.mod(x, y, 1); });
    g.tx(b, (x, y) => {
        const r = y - 3 * top - 6, c = Math.floor(r / 5), xx = x - 3 * cx + (c % 2) * 4;
        if (r % 5 === 4 || xx % 9 === 0) s.mod(x, y, -1); else if (r % 5 === 0 && hdH_rnd(xx >> 3, c, 6) < 0.6) s.mod(x, y, 1);
        if (x < 3 * cx + 2) s.mod(x, y, 1); else if (x > 3 * cx + 14) s.mod(x, y, -1);
    });
    /* its shadow on the roof, to the right */
    g.tx(g.roofId, (x, y) => { if (x >= 3 * cx + 18 && x < 3 * cx + 23 && y >= 3 * top + 6 && y < 3 * bot + 2) s.mod(x, y, -1); else if (y >= 3 * bot && y < 3 * bot + 2 && x >= 3 * cx && x < 3 * cx + 18) s.mod(x, y, -1); });
}
function hdH_dormer(g) {
    const { s, L, wt } = g, cx = Math.floor(g.w / 2) - (L.chimney ? 6 : 0), y0 = Math.max(2, wt - 16), X = 3 * cx, Y = 3 * y0;
    const wl = g.part(L.wall, { flat: 1, layer: 5 }, true), rf = g.part(pxDark(g.roof, 0.28), { flat: 1, layer: 6, cast: 2 }, true);
    s.rect(wl, X - 18, Y + 15, 36, 27);
    s.poly(rf, [[X - 5, Y], [X + 5, Y], [X + 20, Y + 16], [X - 20, Y + 16]]);
    g.tx(rf, (x, y) => { const r = y - Y; if (r % 4 === 3) s.mod(x, y, -1); else if (r % 4 === 0) s.mod(x, y, 1); });
    g.tx(wl, (x, y) => { if (x < X - 15 || x > X + 14) g.tint(x, y, 0.25); });
    hdH_glass(g, X - 9, Y + 21, 18, 15, 0, [X - 12, Y + 18, 24, 21]);
}

/* ---------------------------------------------------------------- doors and windows */
function hdH_door(g, dx) {
    const { s, L, h } = g, X = 3 * dx, Y = 3 * (h - 18);
    const fr = g.part(L.trim, { flat: 1, layer: 2 }, true), d = g.part(pxLight(L.door, 0.12), { flat: 1, layer: 1 }, true);
    s.rect(fr, X - 3, Y - 3, 36, 48);
    s.rect(fr, X - 5, Y - 5, 40, 3);
    s.rect(fr, X - 5, g.GY - 3, 40, 3);
    s.rect(d, X, Y, 30, 42);
    g.tx(fr, (x, y) => { if (y === Y - 5 || y === g.GY - 3) s.mod(x, y, 1); else if (x === X - 1 || x === X + 30) s.mod(x, y, -1); });
    /* four sunk panels: shadow on their top and left insides, light on the bottom and right */
    g.tx(d, (x, y) => {
        const i = x - X, j = y - Y;
        for (const [a, b, c, e] of [[4, 4, 13, 16], [17, 4, 26, 16], [4, 20, 13, 38], [17, 20, 26, 38]]) {
            if (i < a || i > c || j < b || j > e) continue;
            if (j === b || i === a) s.mod(x, y, -1); else if (j === e || i === c) s.mod(x, y, 1);
            return;
        }
    });
    const kx = X + 22, ky = 3 * (h - 10) + 1, K = hdRamp('#ffd35a');
    g.dot(d, kx, ky, K[4]); g.dot(d, kx + 1, ky, K[2]); g.dot(d, kx, ky + 1, K[2]); g.dot(d, kx + 1, ky + 1, K[1]);
    g.doorId = d;
}
/* a pane of glass with its frame: fr = [x, y, w, h] of the trim around it, mull: a middle bar */
function hdH_glass(g, x0, y0, gw, gh, mull, fr) {
    const s = g.s, f = g.part(g.L.trim, { flat: 1, layer: 2 }, true), gl = g.part(g.L.win, { flat: 1, layer: 1 }, true);
    s.rect(f, fr[0], fr[1], fr[2], fr[3]);
    s.rect(gl, x0, y0, gw, gh);
    if (mull) s.rect(f, x0 + Math.floor(gw / 2) - 1, y0, 3, gh);
    hdH_glassTex(g, gl, x0, y0, gw, gh, mull ? Math.floor(gw / 2) + 2 : gw);
    g.tx(f, (x, y) => { if (y === fr[1]) s.mod(x, y, 1); });
    return [f, gl];
}
/* glass: in the shade of its frame at the top, two streaks of reflected sky, a little darker low down, a glint */
function hdH_glassTex(g, gl, x0, y0, gw, gh, half) {
    const s = g.s;
    g.tx(gl, (x, y) => {
        const j = y - y0, i = (x - x0) % half, d = i - j * 0.6;
        if (j < 2) { s.mod(x, y, -1); return; }
        if (Math.abs(d - gw * 0.16) < 1.4 || Math.abs(d - gw * 0.34) < 0.6) s.mod(x, y, 1);
        else if (j + i * 0.35 > gh * 0.72) g.tint(x, y, 0.08);
    });
    g.dot(gl, x0 + 2, y0 + 3, '#ffffff'); g.dot(gl, x0 + 3, y0 + 3, '#ffffff'); g.dot(gl, x0 + 2, y0 + 4, '#ffffff');
}
function hdH_window(g, wx, wy) {
    const s = g.s, X = 3 * wx, Y = 3 * wy, [f] = hdH_glass(g, X, Y + 3, 30, 24, 1, [X - 3, Y, 36, 30]);
    /* the sill sticks out a little */
    s.rect(f, X - 5, Y + 26, 40, 4);
    g.tx(f, (x, y) => { if (y === Y + 26) s.mod(x, y, 1); });
}

/* ---------------------------------------------------------------- add-ons */
function hdH_band(g, col, layer) {
    const s = g.s, b = g.part(col, { flat: 1, layer: 5 + layer, cast: 1 }, true);
    s.rect(b, 3, g.WT + 3, g.W - 6, 6);
    g.tx(b, (x, y) => { if (y === g.WT + 3) s.mod(x, y, 1); });
    return b;
}
/* a striped cloth awning along the top of the wall, with a scalloped edge */
function hdH_awning(g, a, b) {
    const s = g.s, WT = g.WT, W = g.W, cl = g.part(b, { flat: 1, layer: 6 }, true), va = g.part(b, { flat: 1, layer: 6, cast: 2 }, true);
    s.rect(cl, 3, WT + 3, W - 6, 15);
    for (let x = 0; x < W; x += 12) s.ellipse(va, x + 6, WT + 16, 6, 5);
    s.rect(va, 3, WT + 15, W - 6, 3);
    for (let x = 0; x < 3; x++) for (let y = WT + 3; y < WT + 23; y++) { if (s.at(x, y) === va) s.erase(x, y); if (s.at(W - 1 - x, y) === va) s.erase(W - 1 - x, y); }
    const ah = hdH_hex(a), stripe = (x, y) => { if (Math.floor(x / 12) % 2) g.paint(x, y, ah); };
    g.tx(cl, (x, y) => { stripe(x, y); const r = y - WT - 3; if (r > 3 && r < 9) s.mod(x, y, 1); if (x % 12 === 0 && r > 2) s.mod(x, y, -1); });
    g.tx(va, (x, y) => { stripe(x, y); if (y === WT + 18) s.mod(x, y, -1); });
}
function hdH_shutters(g, wx, wy) {
    const s = g.s, X = 3 * wx, Y = 3 * wy, d = g.part(g.L.door, { flat: 1, layer: 3 }, true);
    for (const x0 of [X - 12, X + 33]) {
        s.rect(d, x0, Y, 9, 30);
        g.tx(d, (x, y) => {
            if (x < x0 || x > x0 + 8) return;
            const i = x - x0, j = y - Y;
            if (j >= 12 && j < 15) { g.tint(x, y, 0.2); if (j === 12) s.mod(x, y, 1); return; }
            if (i === 0) s.mod(x, y, 1);
            else if (i > 1 && i < 7 && j > 1 && j < 28) { if (j % 3 === 2) s.mod(x, y, -1); else if (j % 3 === 0) s.mod(x, y, 1); }
        });
    }
}
function hdH_flowerBox(g, wx, wy) {
    const s = g.s, X = 3 * wx, Y = 3 * wy, bx = g.part('#9a6b45', { flat: 1, layer: 4 }, true);
    s.rect(bx, X - 3, Y + 30, 36, 6);
    g.tx(bx, (x, y) => { if (y === Y + 30) s.mod(x, y, 1); else if (y === Y + 33 || (x - X + 3) % 12 === 11) s.mod(x, y, -1); });
    /* leaves along the box, pink flowers above them */
    const lf = g.part('#6cc063', { layer: 5, R: 2 }), fl = g.part('#ff9ec0', { layer: 6, R: 1.5 });
    for (let i = 0; i < 7; i++) s.ellipse(lf, X + 1 + i * 4.7, Y + 29.5 - (i % 2) * 0.8, 2.6, 2);
    g.tx(lf, (x, y) => { if (hdH_rnd(x, y, 22) < 0.2) s.mod(x, y, 1); });
    for (let i = 0; i < 5; i++) {
        const cx = X + 2 + i * 6.5 + (i % 2), cy = Y + 26 + (i % 2);
        s.rect(fl, cx - 1, cy - 2, 3, 5); s.rect(fl, cx - 2, cy - 1, 5, 3);
        g.dot(fl, cx, cy, '#fff2a8');
    }
}
function hdH_lamp(g, lx) {
    const s = g.s, X = 3 * lx, Y = 3 * (g.h - 18), m = g.part('#3f3a4a', { flat: 1, layer: 6 }), gl = g.part('#ffe7a8', { flat: 1, layer: 7, bias: 0.1 });
    /* a little lantern: a cap with a ring on top, glass glowing between thin bars, a base */
    s.poly(m, [[X + 1, Y - 1], [X + 8, Y - 1], [X + 12, Y + 4], [X - 3, Y + 4]]);
    s.rect(m, X + 3, Y - 5, 3, 4);
    s.rect(m, X - 2, Y + 4, 13, 12);
    s.rect(m, X - 1, Y + 16, 11, 2);
    s.rect(gl, X, Y + 5, 9, 10);
    g.tx(gl, (x, y) => { const i = x - X, j = y - Y - 5; if (i === 4) s.mod(x, y, -1); else if (j > 2 && j < 8 && i > 1 && i < 7) s.mod(x, y, 1); });
    g.tx(m, (x, y) => { if (y === Y - 1 || (x === X - 2 && y > Y + 4)) s.mod(x, y, 1); });
    g.dot(gl, X + 2, Y + 6, '#ffffff');
    /* a warm glow on the wall around it */
    g.tx(g.wallId, (x, y) => { const d = Math.hypot(x - X - 4.5, y - Y - 9); if (d < 16) g.tint(x, y, d < 11 ? -0.12 : -0.06); });
}
/* a terracotta pot (pot, rim colors) at old x, y (its top-left), w old pixels wide */
function hdH_pot(g, x0, y0, w, pot, rim) {
    const s = g.s, X = 3 * x0, Y = 3 * y0, p = g.part(pot, { layer: 5, R: 3, k: 0.9 }), r = g.part(rim, { flat: 1, layer: 6, cast: 1 });
    const bot = g.GY - 1;
    s.poly(p, [[X, Y + 3], [X + 3 * w, Y + 3], [X + 3 * w - 2, bot + 1], [X + 2, bot + 1]]);
    s.rect(r, X - 3, Y - 3, 3 * w + 6, 6);
    g.tx(r, (x, y) => { if (y === Y - 3) s.mod(x, y, 1); });
    return [p, r];
}
function hdH_plant(g, px) {
    const s = g.s, h = g.h, X = 3 * px;
    hdH_pot(g, px, h - 9, 5, '#c9703f', '#a85a30');
    /* leaves fanning out of the pot, each catching the light along its middle, and a pink flower on top */
    const Y = 3 * h, cx = X + 7.5, cy = Y - 32, F = hdRamp('#ff9ec0');
    [[-160, 9], [-20, 9], [-125, 11], [-55, 11], [-95, 9], [-75, 10]].forEach(([a, l], k) => {
        const lf = g.part(k % 2 ? '#5aa844' : '#4f9a3f', { layer: 7 + (k >> 1), R: 2 }), r = a * Math.PI / 180;
        hdH_leaf(s, lf, cx, cy, cx + Math.cos(r) * l, cy + Math.sin(r) * l * 0.85, 3.2);
        g.tx(lf, (x, y) => { if (Math.abs((x - cx) * Math.sin(r) - (y - cy) * Math.cos(r)) < 0.6 && Math.hypot(x - cx, y - cy) > 2) s.mod(x, y, 1); });
    });
    const fl = g.part('#ff9ec0', { layer: 11, R: 1.5 }), fx = X + 9, fy = Y - 44;
    s.rect(fl, fx - 1, fy - 2, 3, 5); s.rect(fl, fx - 2, fy - 1, 5, 3);
    g.dot(fl, fx, fy, '#fff2a8'); g.dot(fl, fx - 1, fy - 1, F[4]);
}
/* a leaf (an almond) from its base to its tip, w = half its width */
function hdH_leaf(s, id, x0, y0, x1, y1, w) {
    const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l, a = [], b = [];
    for (let i = 0; i <= 8; i++) { const t = i / 8, ww = w * Math.sin(Math.PI * Math.pow(t, 0.7)); a.push([x0 + dx * t + nx * ww, y0 + dy * t + ny * ww]); b.unshift([x0 + dx * t - nx * ww, y0 + dy * t - ny * ww]); }
    s.poly(id, a.concat(b));
}
function hdH_wreath(g, dx) {
    const s = g.s, cx = 3 * (dx + 5), cy = 3 * (g.h - 13), rg = g.part('#3f8a3a', { layer: 5, R: 3 }), bw = g.part('#e0405a', { layer: 6, R: 2 });
    s.ellipse(rg, cx, cy, 10.5, 10.5);
    g.tx(rg, (x, y) => { const q = hdH_rnd(x >> 1, y >> 1, 31); if (q < 0.2) s.mod(x, y, -1); else if (q > 0.82) s.mod(x, y, 1); });
    for (let y = cy - 5; y < cy + 5; y++) for (let x = cx - 5; x < cx + 5; x++) if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) < 4.8) s.plot(g.doorId, x, y);
    /* a bow at the bottom: two loops and the tails */
    s.ellipse(bw, cx - 3.5, cy + 9.5, 3.2, 2.4); s.ellipse(bw, cx + 3.5, cy + 9.5, 3.2, 2.4);
    s.poly(bw, [[cx - 2, cy + 10], [cx, cy + 10], [cx - 3, cy + 16], [cx - 5, cy + 15]]); s.poly(bw, [[cx, cy + 10], [cx + 2, cy + 10], [cx + 5, cy + 15], [cx + 3, cy + 16]]);
    const B = hdRamp('#e0405a');
    for (const [bx, by] of [[-6, -6], [6, 3], [-8, 2], [3, -8], [7, -4]]) { g.dot(rg, cx + bx, cy + by, B[3]); g.dot(rg, cx + bx + 1, cy + by, B[2]); g.dot(rg, cx + bx, cy + by + 1, B[1]); }
    g.dot(bw, cx - 1, cy + 9, B[0]); g.dot(bw, cx, cy + 9, B[1]);
}
function hdH_porch(g, dx) {
    const { s, L, h } = g, y = h - 23, pc = g.rainbow ? '#b37cf0' : L.roof, X = 3 * dx;
    const sl = g.part(pc, { flat: 1, layer: 7 }, true), ed = g.part(pxDark(pc, 0.3), { flat: 1, layer: 7, cast: 2 }, true), po = g.part(L.trim, { layer: 6, R: 2, k: 0.8 });
    s.rect(sl, X - 15, 3 * y, 60, 9);
    s.rect(ed, X - 15, 3 * y + 9, 60, 3);
    g.tx(sl, (x, yy) => { const r = yy - 3 * y; if (r === 0 || r === 4) s.mod(x, yy, 1); else if (r === 3 || r === 8 || (x + (r > 3 ? 7 : 0)) % 14 === 0) s.mod(x, yy, -1); });
    for (const x0 of [X - 12, X + 36]) s.rect(po, x0, 3 * y + 12, 6, g.GY - 3 * y - 12);
}

/* ---------------------------------------------------------------- each neighbor's own touch, whatever the paint job */
const hdH_sig = {
    noren(g) {
        const s = g.s, X = 3 * (Math.floor(g.w / 2) - 7), Y = 3 * (g.wt + 12);
        /* what hangs behind it shows through the slits and under the rounded ends of its three panels */
        const under = [];
        for (let y = Y; y < Y + 15; y++) for (let x = X; x < X + 42; x++) under.push(s.at(x, y));
        const c = g.part('#2c3e66', { flat: 1, layer: 6, cast: 2 }, true), rod = g.part('#6b4a35', { layer: 7, R: 1 });
        s.rect(c, X, Y, 42, 15);
        const back = (x, y) => s.plot(under[(y - Y) * 42 + x - X], x, y);
        for (const sx of [X + 14, X + 28]) for (let y = Y + 4; y < Y + 15; y++) back(sx, y);
        for (const px of [X, X + 15, X + 29]) { const r = px === X ? X + 13 : px === X + 15 ? X + 27 : X + 41; back(px, Y + 14); back(r, Y + 14); }
        s.rect(rod, X - 3, Y - 2, 48, 3);
        g.tx(c, (x, y) => {
            const i = x - X, j = y - Y;
            if (j > 2 && (i - 3) % 9 < 2 && i > 1 && i < 41) g.paint(x, y, '#f4f1e8');
            if (j === 0) s.mod(x, y, -1); else if (i === 13 || i === 27) s.mod(x, y, -1); else if (i === 15 || i === 29 || i === 0) s.mod(x, y, 1);
        });
        const R = hdRamp('#e05a5a');
        for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (i * i + j * j <= 5) g.dot(c, X + 19.5 + i, Y + 7.5 + j, R[i + j < -1 ? 3 : i + j > 1 ? 1 : 2]);
    },
    lights(g) {
        const s = g.s, wire = g.part('#2f4a2a', { flat: 1, layer: 7 }), bulb = g.part('#e2382b', { layer: 8, R: 2 }), cap = g.part('#5aa844', { flat: 1, layer: 9 });
        const pts = [];
        for (let x = 3, i = 0; x < g.w - 3; x += 4, i++) pts.push([3 * x + 1, 3 * (g.wt + 2 + Math.trunc(1.5 * Math.sin(i * 0.9)))]);
        /* the wire sags a little between the bulbs */
        for (let i = 0; i + 1 < pts.length; i++) {
            const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
            for (let x = x0; x <= x1; x++) { const t = (x - x0) / (x1 - x0); s.plot(wire, x, Math.round(y0 - 1 + (y1 - y0) * t + 2 * Math.sin(Math.PI * t))); }
        }
        for (const [x, y] of pts) {
            s.ellipse(bulb, x + 0.5, y + 3.5, 2, 3);
            s.rect(cap, x - 1, y - 1, 3, 2);
            g.dot(bulb, x, y + 2, '#ffb0a0');
        }
    },
    bakery(g) { hdH_awning(g, '#ff8aa8', '#fff4dc'); },
    lantern(g) {
        const s = g.s;
        for (const x of [6, g.w - 8]) {
            const X = 3 * x, Y = 3 * (g.wt + 3), b = g.part('#e0405a', { layer: 7, R: 4, k: 1 }), k = g.part('#2d2230', { flat: 1, layer: 8, bias: 0.1 });
            s.ellipse(b, X + 4.5, Y + 6, 5.5, 6.5);
            s.rect(k, X + 1, Y - 1, 7, 2); s.rect(k, X + 1, Y + 12, 7, 2); s.rect(k, X + 4, Y - 4, 1, 3);
            g.tx(b, (xx, yy) => { if (Math.abs(xx - X - 4.5) > 6) return; if ((yy - Y) % 3 === 2) s.mod(xx, yy, -1); if (Math.abs(xx - X - 4) <= 1 && yy > Y + 3 && yy < Y + 9) g.paint(xx, yy, '#ffb347'); });
        }
    },
    surfboard(g) {
        const s = g.s, X = 3 * (g.w - 7), Y = 3 * (g.wt + 2), b = g.part('#4ec3d9', { flat: 1, layer: 6 }, true);
        s.poly(b, [[X + 6, Y], [X + 9, Y + 3], [X + 11.5, Y + 12], [X + 12, Y + 50], [X + 11, Y + 57], [X + 6, Y + 60], [X + 1, Y + 57], [X, Y + 50], [X + 0.5, Y + 12], [X + 3, Y + 3]]);
        /* rounded across: lit on the left, a white stripe down the middle, in shade on the right */
        g.tx(b, (x, y) => { const i = x - X; if (i === 5 || i === 6) { if (y > Y + 3 && y < Y + 57) g.paint(x, y, '#ffffff'); } else if (i < 3) s.mod(x, y, 1); else if (i > 9) s.mod(x, y, -1); });
        for (let k = 0; k < 4; k++) g.dot(b, X + 2, Y + 8 + k * 2, '#e8fbff');
        g.tx(g.wallId, (x, y) => { if (x >= X + 12 && x < X + 15 && y > Y + 4 && y < Y + 60) g.tint(x, y, 0.12); });
    },
    sweatband(g) {
        const s = g.s, b = hdH_band(g, '#e84a5a', 0);
        g.tx(b, (x, y) => { if (y > g.WT + 3 && x % 3 === 0) s.mod(x, y, -1); });
    },
    joe(g) {
        const s = g.s, w = g.w, h = g.h, wt = g.wt, cx = 3 * Math.floor(w / 2), Y = 3 * wt;
        /* a sign over the door */
        const fr = g.part('#5a4633', { flat: 1, layer: 8, cast: 2 }), bd = g.part('#fff7e6', { flat: 1, layer: 7 }, true);
        s.rect(fr, cx - 18, Y, 36, 21);
        s.rect(bd, cx - 15, Y + 3, 30, 15);
        g.tx(fr, (x, y) => { if (y === Y || x === cx - 18) s.mod(x, y, 1); else if (hdH_rnd(x, y >> 2, 41) < 0.15) s.mod(x, y, -1); });
        /* a pen across the sign: dark barrel, a grey nib */
        const pen = g.part('#3a3340', { layer: 9, R: 1 }), nib = g.part('#8a8ea8', { layer: 9, R: 1 });
        s.line(pen, cx - 8, Y + 15, cx + 5, Y + 6, 1.4);
        s.line(nib, cx + 5, Y + 6, cx + 10, Y + 3, 1.2, 0.5);
        g.tx(bd, (x, y) => { if ((y - Y - 6) % 4 === 0 && y < Y + 15 && x > cx - 13 && x < cx + 12 && hdH_rnd(x >> 2, y, 42) < 0.4) g.tint(x, y, 0.12); });
        /* notes stuck in the windows */
        for (const wx of [6, w - 16]) {
            const X = 3 * wx;
            for (const [px, py, col] of [[X + 3, 3 * (wt + 8), '#ffffff'], [X + 18, 3 * (wt + 9), '#fff7e6']]) {
                const p = g.part(col, { flat: 1, layer: 2 }, true);
                s.rect(p, px, py, 9, 12);
                g.tx(p, (x, y) => { const j = y - py; if (j > 1 && j % 3 === 0 && x > px && x < px + 8 - (j % 2)) g.paint(x, y, '#b8b0c8'); });
            }
        }
        /* crumpled papers at the foot of the wall */
        for (const [x, y] of [[4, h - 6], [w - 8, h - 5], [w - 6, h - 6]]) {
            const p = g.part('#fbfaf2', { layer: 7, R: 2 });
            s.ellipse(p, 3 * x + 3, 3 * y + 3, 3.4, 3);
            g.tx(p, (xx, yy) => { if (hdH_rnd(xx, yy, 43) < 0.25) s.mod(xx, yy, -1); });
        }
    },
    sully(g) {
        const s = g.s, w = g.w, h = g.h, X = 3 * (w - 11), Y = 3 * (h - 12);
        hdH_pot(g, w - 11, h - 9, 6, '#c9703f', '#a85a30');
        const sp = g.part('#6cc063', { layer: 7, R: 2 });
        s.line(sp, X + 8, Y + 8, X + 9, Y + 1, 0.7);
        s.ellipse(sp, X + 6, Y + 3, 2.6, 1.5); s.ellipse(sp, X + 12, Y + 1, 2.8, 1.6);
    },
    ginger(g) {
        const s = g.s, w = g.w, h = g.h, wt = g.wt, WT = g.WT, ic = g.part('#ffffff', { layer: 7, R: 2, k: 0.8 });
        /* icing dripping off the eave */
        s.rect(ic, 0, WT + 5, g.W, 4);
        for (let x = 0; x < g.W; x += 3) s.ellipse(ic, x + 1.5, WT + 8.5, 2.2, 1.6);
        for (let ox = 1; ox < w; ox += 3) { const cx = 3 * ox + 1.5, n = 3 + Math.floor(hdH_rnd(ox, 0, 51) * 5); s.line(ic, cx, WT + 8, cx, WT + 8 + n, 1.6, 1.5); }
        g.tx(ic, (x, y) => { if (y === WT + 5) s.mod(x, y, 1); });
        /* gumdrops on the roof */
        for (const [x, y, c] of [[23, 21, '#8cc152'], [31, 18, '#e0405a'], [8, 18, '#ffd84a'], [22, 9, '#4ec3d9'], [38, 15, '#8cc152'], [22, 7, '#4ec3d9'], [8, 5, '#8cc152']]) {
            if (s.at(3 * x + 4, 3 * y + 2) !== g.roofId) continue;
            const d = g.part(c, { layer: 6, R: 3, k: 1 });
            s.ellipse(d, 3 * x + 4.5, 3 * y + 3, 5, 4.5);
            for (let i = 0; i < 9; i++) s.plot(d, 3 * x + i, 3 * y + 5);
            g.dot(d, 3 * x + 2, 3 * y, '#ffffff'); g.dot(d, 3 * x + 5, 3 * y + 3, '#ffffff');
        }
        /* icing on the window heads */
        for (const wx of [6, w - 16]) for (let x = 3 * wx - 3; x < 3 * wx + 33; x++) { const u = (x - 3 * wx + 3) % 6; for (let j = (u === 0 || u === 5 ? 1 : 0); j < (u === 2 || u === 3 ? 4 : 3); j++) s.plot(ic, x, 3 * (wt + 6) - 1 + j); }
        /* candy canes by the door */
        for (const c of [Math.floor(w / 2) - 9, Math.floor(w / 2) + 8]) {
            const X = 3 * c, cn = g.part('#ffffff', { layer: 7, R: 2, k: 0.8 });
            s.rect(cn, X, 3 * (h - 15), 3, 3 * (h - 4) - 3 * (h - 15));
            for (let a = 0; a <= 12; a++) { const t = Math.PI - a / 12 * Math.PI * 1.25; s.ellipse(cn, X + 4.5 + 3.2 * Math.cos(t), 3 * (h - 15) + 1 - 3.2 * Math.sin(t), 1.5, 1.5); }
            g.tx(cn, (x, y) => { if (Math.floor((y + x * 0.7) / 3) % 2 === 0) g.paint(x, y, '#e0405a'); });
        }
    },
    mac(g) {
        const s = g.s, w = g.w, h = g.h, top = g.wt;
        /* gingham valances in the windows */
        for (const wx of [6, w - 16]) {
            const X = 3 * wx, Y = 3 * (top + 8), v = g.part('#ffffff', { flat: 1, layer: 1.5, cast: 1 }, true);
            for (let x = X; x < X + 30; x++) { const u = (x - X) % 10, n = 6 + (u > 2 && u < 8 ? 1 : 0); for (let j = 0; j < n; j++) s.plot(v, x, Y + j); }
            g.tx(v, (x, y) => { const a = Math.floor((x - X) / 3) % 2, b = Math.floor((y - Y) / 3) % 2; if (a !== b) g.paint(x, y, '#e0405a'); });
        }
        /* the chimney, a puff of steam on top */
        const cx = 3 * (w - 13), ch = g.part('#8a5a3c', { flat: 1, layer: 6 }, true), cp = g.part('#6b4225', { flat: 1, layer: 7, cast: 2 }, true);
        const pf = g.part('#ffffff', { layer: 8, R: 3, k: 0.7 });
        s.rect(ch, cx, 6, 18, 3 * (top - 6));
        s.rect(cp, cx - 3, 3, 24, 6);
        g.tx(ch, (x, y) => { const r = y - 9, c = Math.floor(r / 5), xx = x - cx + (c % 2) * 4; if (r % 5 === 4 || xx % 9 === 0) s.mod(x, y, -1); if (x < cx + 2) s.mod(x, y, 1); });
        s.ellipse(pf, cx + 9, 2.5, 9, 4.5); s.ellipse(pf, cx + 4, 4, 4.5, 3.5); s.ellipse(pf, cx + 14, 4, 4.5, 3.5);
        g.tx(g.roofId, (x, y) => { if (x >= cx + 18 && x < cx + 23 && y > 8 && y < 3 * (top - 1)) s.mod(x, y, -1); });
        /* a big pot of mac and cheese, steaming */
        const p = g.part('#8a96a8', { layer: 6, R: 3, k: 0.9 }), rim = g.part('#b8c4d0', { flat: 1, layer: 7, bias: 0.05 });
        s.rect(p, 9, 3 * (h - 10), 21, g.GY - 3 * (h - 10));
        s.rect(rim, 6, 3 * (h - 10) - 1, 27, 3);
        s.rect(p, 3, 3 * (h - 8), 6, 3); s.rect(p, 30, 3 * (h - 8), 6, 3);
        const wall = g.L.wall, st = hdH_hex(pxMix(wall, '#ffffff', 0.55)), st2 = hdH_hex(pxMix(wall, '#ffffff', 0.35));
        for (const [x, y, c] of [[16, -12, st], [15, -13, st], [16, -14, st2], [17, -15, st2], [22, -13, st], [23, -14, st], [22, -15, st2], [21, -16, st2], [22, -17, st2]]) g.dot(g.wallId, x, 3 * (h - 10) + y + 9, c);
    },
    brulee(g) {
        const s = g.s, w = g.w, h = g.h, top = g.wt, roof = g.roofId;
        /* caramel speckles on the sugar-crust roof */
        g.tx(roof, (x, y) => { const ox = Math.floor(x / 3), oy = Math.floor(y / 3); if (ox >= 4 && (ox - 4) % 5 === 0 && ox < w - 4 && oy >= 2 && (ox + oy) % 7 === 0 && x % 3 < 2 && y % 3 === 1) g.paint(x, y, '#f2c27a'); });
        /* a round window up in the roof */
        const cx = 3 * Math.floor(w / 2), cy = 3 * (top - 4), f = g.part(g.L.trim, { layer: 6, R: 2, k: 0.8 }), gl = g.part(g.L.win, { flat: 1, layer: 5 }, true);
        s.ellipse(f, cx, cy, 12, 12); s.ellipse(gl, cx, cy, 9.5, 9.5);
        hdH_glassTex(g, gl, cx - 9, cy - 9, 18, 18, 18);
        /* the easel, a little painting on it */
        const ex = 3 * (w - 9), leg = g.part('#8a5a2b', { layer: 7, R: 1 }), cv = g.part('#ffffff', { flat: 1, layer: 8, cast: 1 }, true);
        s.line(leg, ex + 1.5, g.GY - 1, ex + 10.5, 3 * (h - 16) + 1, 1.1); s.line(leg, ex + 19.5, g.GY - 1, ex + 10.5, 3 * (h - 16) + 1, 1.1);
        s.line(leg, ex + 10.5, g.GY - 4, ex + 10.5, 3 * (h - 9), 0.9);
        s.rect(cv, ex, 3 * (h - 15), 21, 18);
        s.rect(leg, ex - 1, 3 * (h - 9), 23, 2);
        const cy0 = 3 * (h - 15);
        for (const [x, y, c] of [[6, 6, '#e0405a'], [12, 9, '#4ea8f0'], [9, 12, '#8cc152']]) {
            const R = hdRamp(c);
            for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) if (i + j < 4) g.dot(cv, ex + x + i, cy0 + y + j, R[i + j < 1 ? 3 : i + j > 2 ? 1 : 2]);
        }
        g.tx(cv, (x, y) => { if (y === cy0 + 15) g.tint(x, y, 0.08); });
    },
};

/* ---------------------------------------------------------------- the atlas houses nobody repainted: the same recipe */
for (const id of HOUSE_IDS) {
    const B = HOUSE_BASE[id], w = B.w || 48, h = B.h || 56;
    HD_SPR[id === 'home' ? 'house_sarah' : 'house_' + id.slice(2)] = { w: 3 * w, h: 3 * h, ax: 3 * Math.floor(w / 2), ay: 3 * (h - 3),
        draw(s) { hdH_house(s, Object.assign({ w: 48, h: 56, win: '#9fd8ef', style: 'gable', pattern: 'plain' }, B, id === 'home' ? { level: 0 } : {})); } };
}

/* ---------------------------------------------------------------- the mailbox (Sarah's, and the neighbors' for looks) */
/* a rounded box on a post: the dark band is its door's seam; with mail, the red flag is up */
function hdH_mailbox(s, flag) {
    const g = hdH_new(s), post = g.part('#7a5234', { flat: 1, layer: 1 }, true), b = g.part('#4ea8f0', { flat: 1, layer: 2 }, true);
    s.rect(post, 18, 33, 6, 27);
    s.rect(post, 14, 32, 14, 3);
    for (let y = 4; y < 34; y++) for (let x = 4; x < 38; x++) {
        const dx = Math.max(10 - x, x - 31, 0), dy = Math.max(10 - y, y - 27, 0), r = y < 20 ? 6.5 : 5;
        if (dx * dx + dy * dy <= r * r + 0.5 || (dx <= 6 - r && dy <= 6 - r)) s.plot(b, x, y);
    }
    g.tx(post, (x, y) => { if (y >= 32 && y < 35) { if (y === 32) s.mod(x, y, 1); return; } if (x === 18) s.mod(x, y, 1); else if (x === 23 || hdH_rnd(x, y >> 2, 61) < 0.18) s.mod(x, y, -1); });
    /* rounded over the top: lit there and on the left, in shade low down and on the right */
    g.tx(b, (x, y) => {
        if (y >= 21 && y < 24 && x > 4 && x < 37) { g.paint(x, y, '#2f7ab8'); if (y === 21) s.mod(x, y, -1); return; }
        if (y === 24) { s.mod(x, y, 1); return; }
        if (y < 8 || x < 8) s.mod(x, y, 1); else if (x > 33 || y > 30) s.mod(x, y, -1);
        if (y < 6 && x > 8 && x < 30) s.mod(x, y, 1);
    });
    for (const [x, y] of [[9, 8], [10, 8], [9, 9]]) g.dot(b, x, y, '#d8f0ff');
    if (flag) {
        const f = g.part('#e0405a', { flat: 1, layer: 3 }, true);
        s.rect(f, 34, 0, 8, 6);
        s.rect(f, 34, 6, 4, 13);
        g.tx(f, (x, y) => { if (y === 0 || x === 34) s.mod(x, y, 1); else if (y > 5 && x === 37) s.mod(x, y, -1); });
    }
    hdH_finish(g);
}
HD_SPR.mailbox = { w: 42, h: 66, ax: 21, ay: 60, draw(s) { hdH_mailbox(s, false); } };
HD_SPR.mailbox_flag = { w: 42, h: 66, ax: 21, ay: 60, draw(s) { hdH_mailbox(s, true); } };

/* ---------------------------------------------------------------- the campsite tents */
/* each tent's cloth: the lit face, the shaded face, the hem, the light seam at the ridge, the dark one */
const HDH_TENTS = {
    blue: { g: '#4f86c6', f: '#3a6aa0', c: '#42689e', d: '#8fb8e6', e: '#3f6396' },
    coral: { g: '#f27a5a', f: '#d05a42', c: '#bc604d', d: '#ffb49a', e: '#b15a4a' },
    green: { g: '#5aa85a', f: '#3f8a45', c: '#4a824d', d: '#8fd07a', e: '#477a4a' },
};
/* a ridge tent seen from the front: open (someone is staying in it, the flap tied back) or zipped shut */
function hdH_tent(s, C, open) {
    const g = hdH_new(s), lf = g.part(C.g, { flat: 1, layer: 1 }, true), rf = g.part(C.f, { flat: 1, layer: 1 }, true);
    s.poly(lf, [[64, 12], [73, 11], [73, 117], [0, 117], [0, 112]]);
    s.poly(rf, [[73, 11], [82, 12], [144, 112], [144, 117], [73, 117]]);
    const edge = y => 62 - (y - 12) * 62 / 100, ch = hdH_hex(C.c), dh = hdH_hex(C.d), eh = hdH_hex(C.e);
    const face = (x, y, left) => {
        const d = left ? x - edge(y) : (144 - edge(y)) - x;
        g.tint(x, y, 0.1 * (y - 12) / 105 - 0.05);
        if (d < 4) g.paint(x, y, ch); else if (d < 5) s.mod(x, y, -1);
        /* seams fanning down from the ridge */
        for (const k of [1 / 3, 2 / 3]) { const sx = 73 + (left ? -1 : 1) * (73 - edge(y)) * k; if (Math.abs(x - sx) < 0.5) s.mod(x, y, -1); else if (Math.abs(x - sx - (left ? 1 : -1)) < 0.5) g.tint(x, y, -0.06); }
        if (y > 112) g.tint(x, y, 0.08);
    };
    g.tx(lf, (x, y) => { face(x, y, true); if (x >= 70 && y < 64) { g.paint(x, y, dh); if (x === 72) s.mod(x, y, 1); } });
    g.tx(rf, (x, y) => { face(x, y, false); if (x <= 74 && y < 64) g.paint(x, y, eh); });
    if (open) {
        /* the doorway: dark inside, a groundsheet catching a little light, the flap's light edge tied back */
        const dk = g.part('#2a1e2a', { flat: 1, layer: 2 }), fl = g.part(C.d, { flat: 1, layer: 3 }, true);
        s.poly(dk, [[70, 62], [75, 62], [98, 117], [45, 117]]);
        g.tx(dk, (x, y) => { g.tint(x, y, y > 113 ? -0.2 : -0.1 * Math.max(0, y - 70) / 45); });
        s.line(fl, 70.5, 63, 46, 116, 1.1);
        g.tx(fl, (x, y) => { if (y % 5 === 0) s.mod(x, y, -1); });
    } else {
        /* zipped: the zip down the middle with its toggles */
        const z = g.part('#fff4dc', { flat: 1, layer: 3 }, true);
        s.rect(z, 72, 54, 2, 63);
        for (let k = 0; k < 6; k++) s.rect(z, 69, 60 + k * 9, 8, 2);
        g.tx(z, (x, y) => { if (x === 72 && (y - 54) % 3 === 2) s.mod(x, y, -1); });
        g.tx(rf, (x, y) => { if (x === 75 && y > 54) s.mod(x, y, -1); });
    }
    /* the pole's cap, guy ropes, pegs */
    const cap = g.part('#8a8ea8', { layer: 4, R: 3 }), rope = g.part('#d8d0c0', { flat: 1, layer: 3 }), peg = g.part('#7a5234', { flat: 1, layer: 4 });
    s.ellipse(cap, 73, 6.5, 6.5, 6); s.rect(cap, 71, 10, 5, 4);
    s.line(rope, 25, 97, 5, 113, 0.75); s.line(rope, 120, 97, 139, 113, 0.75);
    s.rect(peg, 2, 111, 4, 6); s.rect(peg, 138, 111, 4, 6);
    g.tx(peg, (x, y) => { if (y === 111) s.mod(x, y, 1); });
    hdH_finish(g);
}
for (const [col, C] of Object.entries(HDH_TENTS)) {
    HD_SPR['tent_' + col] = { w: 144, h: 126, ax: 72, ay: 117, draw(s) { hdH_tent(s, C, true); } };
    HD_SPR['tent_' + col + '_closed'] = { w: 144, h: 126, ax: 72, ay: 117, draw(s) { hdH_tent(s, C, false); } };
}
