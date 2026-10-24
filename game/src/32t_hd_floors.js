/* ---- 32t_hd_floors.js ---- */
/* HD room floors and wallpapers: every fl_floor_* tile (16x16 today, 48x48 here) and wp_wall_* strip (16x32, 48x96)
   for the HD-2D view's rooms, which repeat them (buildRoomBg: one wallpaper per column along the back wall, one floor
   tile per square). Each keeps today's colors, pattern and scale, with the planks, grout, weave, veins and prints the
   extra pixels allow. A tile has to meet its neighbours without a seam, and HDSprite outlines every silhouette against
   empty pixels, so each one is drawn on a bigger sprite whose drawing wraps around (a shape leaving one side comes in at
   the other), shaded there, and only the middle is copied into the frame: bevels and shading run on across the edges.
   A floor is seen from above at an angle, a wallpaper straight on; the light is the usual top left, kept gentle. */

const HDW_M = 12;                                  // margin around the tile in the wrapped drawing

/* ---------------------------------------------------------------- shared helpers */
/* a small seeded hash in [0, 1), the same every time (fully mixed: tiles show any pattern in it) */
function hdW_mix(h) { h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); return h ^ (h >>> 16); }
function hdW_hash(x, y, k) { return (hdW_mix(hdW_mix(hdW_mix((k | 0) + 0x9e3779b9) ^ (x | 0)) ^ (y | 0)) >>> 0) / 4294967296; }
/* smooth value noise in [0, 1) that repeats every 48 pixels both ways (cell divides 48): soft mottling for carpets,
   lawns and stone, where single random pixels would only look noisy */
function hdW_noise(x, y, cell, seed) {
    const n = 48 / cell, fx = x / cell, fy = y / cell, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
    const v = (i, j) => hdW_hash(((i % n) + n) % n, ((j % n) + n) % n, seed);
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const a = v(x0, y0) + (v(x0 + 1, y0) - v(x0, y0)) * sx, b = v(x0, y0 + 1) + (v(x0 + 1, y0 + 1) - v(x0, y0 + 1)) * sx;
    return a + (b - a) * sy;
}
/* a color with its lightness moved by dl (and hue by dh), as [r, g, b] */
function hdW_shift(hex, dl, dh) { const [h, s, l] = hdHsl(hdRgb(hex)); return hdFromHsl(h + (dh || 0), s, l + dl); }
/* five shades with small steps, for big surfaces: shadows a touch cooler, lights warmer (the first is never seen on a
   tile: outlines only show against empty pixels) */
function hdW_r(hex, d, dk) {
    d = d || 0.05;
    const c = hdRgb(hex), [h, s, l] = hdHsl(c), grey = s < 0.06;
    const f = (dl, dh, ds) => hdFromHsl(grey ? h : hdHue(h, dl > 0 ? 50 : 265, dh), grey ? s : s + ds, l + dl);
    return [f(-d * 5, 12, 0.05), f(-d * (dk || 1.1), 5, 0.04), c, f(d * 0.9, 4, 0), f(d * 1.8, 8, 0.02)];
}

/* the wrapped drawing: fn(T) draws in tile coordinates with T's calls (HDSprite's, plus at/mod/rec/px/each that wrap
   too); wrapY: floors wrap both ways, wallpapers only sideways (their top and bottom can run on into the margin) */
function hdW_tile(w, h, wrapY, fn) {
    return s => {
        const M = HDW_M, W = w + 2 * M, H = h + 2 * M, B = new HDSprite(W, H), P = HDSprite.prototype;
        const spots = (x, y, f) => {
            x = Math.round(x); y = Math.round(y);
            const bx0 = ((((x % w) + w) % w) + M) % w;
            if (wrapY) { for (let by = ((((y % h) + h) % h) + M) % h; by < H; by += h) for (let bx = bx0; bx < W; bx += w) f(bx, by); }
            else if (y + M >= 0 && y + M < H) for (let bx = bx0; bx < W; bx += w) f(bx, y + M);
        };
        /* every shape plots through _p (plot in older versions): both wrap */
        B._p = B.plot = (id, x, y) => spots(x, y, (bx, by) => { B.part[by * W + bx] = id; });
        const T = {
            w, h,
            add: (mat, o) => B.add(mat, Object.assign({ grad: 0 }, o)),
            rect: (id, x, y, rw, rh) => B.rect(id, x, y, rw, rh),
            ellipse: (id, cx, cy, rx, ry) => B.ellipse(id, cx, cy, rx, ry),
            poly: (id, pts) => B.poly(id, pts),
            line: (id, x0, y0, x1, y1, r, r1) => B.line(id, x0, y0, x1, y1, r, r1),
            at: (x, y) => {
                x = Math.round(x); y = Math.round(y);
                const bx = (((x % w) + w) % w) + M, by = wrapY ? (((y % h) + h) % h) + M : y + M;
                return by < 0 || by >= H ? -1 : B.part[by * W + bx];
            },
            /* shade nudges and recolors wait until every shape is drawn, and then touch a pixel only if it still
               belongs to the part they were meant for (a rail drawn over boards doesn't keep their grain) */
            mod: (x, y, d, id) => { if (id == null || T.at(x, y) === id) later.push([x, y, d, id == null ? -2 : id]); },
            rec: (x, y, mat, id) => { if (id == null || T.at(x, y) === id) later.push([x, y, mat, id == null ? -2 : id]); },
            px: (x, y, c) => spots(x, y, (bx, by) => B.det.push([bx, by, hdRgb(c)])),
            each: (id, f) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (T.at(x, y) === id) f(x, y); },
        };
        const later = [];
        fn(T);
        for (const [x, y, d, id] of later) {
            if (id !== -2 && T.at(x, y) !== id) continue;
            if (typeof d === 'number') spots(x, y, (bx, by) => { B.mods[by * W + bx] += d; });
            else spots(x, y, (bx, by) => P.recolor.call(B, bx, by, d));
        }
        const buf = B.render();
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = ((y + M) * W + x + M) * 4; if (buf[o + 3]) s.px(x, y, [buf[o], buf[o + 1], buf[o + 2]]); }
    };
}

/* crisp bevels on raised parts (tiles, boards, stones): lit top and left edges, shaded bottom and right ones; b2/r2
   shade a second row (a thicker front edge, as a floor seen from above at an angle shows) */
function hdW_bevel(T, ids, o) {
    o = Object.assign({ t: 1, l: 1, b: -1, r: -1, b2: 0, r2: 0, tl: null }, o);
    for (const id of [].concat(ids)) T.each(id, (x, y) => {
        const up = T.at(x, y - 1) !== id, lf = T.at(x - 1, y) !== id, dn = T.at(x, y + 1) !== id, rt = T.at(x + 1, y) !== id;
        let d = 0;
        if (up) d += o.t;
        if (lf) d += o.l;
        if (up && lf && o.tl != null) d = o.tl;
        if (dn) d += o.b; else if (o.b2 && T.at(x, y + 2) !== id) d += o.b2;
        if (rt) d += o.r; else if (o.r2 && T.at(x + 2, y) !== id) d += o.r2;
        if (d) T.mod(x, y, d, id);
    });
}
/* gaps (grout, the joints between boards) in the shade of a raised part just above or to the left of them */
function hdW_gaps(T, gap, raised, dy, dx) {
    const R = new Set([].concat(raised));
    const hit = (x, y) => R.has(T.at(x, y));
    T.each(gap, (x, y) => {
        let sh = false;
        for (let k = 1; k <= (dy == null ? 1 : dy) && !sh; k++) if (hit(x, y - k)) sh = true;
        for (let k = 1; k <= (dx == null ? 1 : dx) && !sh; k++) if (hit(x - k, y)) sh = true;
        if (sh) T.mod(x, y, -1, gap);
    });
}
/* wood grain along a board: a few long streaks broken into runs, each run a pixel to one side or the other (most
   darker, one in four lighter); vert: the board stands upright (wall paneling) */
function hdW_grain(T, id, x0, y0, len, ht, seed, per, vert) {
    const n = Math.max(1, Math.round(ht / (per || 3.5)));
    for (let i = 0; i < n; i++) {
        const g = (vert ? x0 : y0) + 1 + Math.floor((i + 0.3 + hdW_hash(i, seed, 1) * 0.4) * (ht - 2) / n), d = hdW_hash(i, seed, 5) < 0.25 ? 1 : -1;
        let on = hdW_hash(i, seed, 7) < 0.6, run = 1 + Math.floor(hdW_hash(i, seed, 9) * 8), w = 0;
        for (let t = vert ? y0 : x0, e = t + len; t < e; t++) {
            if (--run <= 0) {
                on = !on; run = on ? 8 + Math.floor(hdW_hash(t, g, seed) * 16) : 2 + Math.floor(hdW_hash(t, g, seed + 1) * 5);
                if (on) w = Math.floor(hdW_hash(t, g, seed + 2) * 3) - 1;
            }
            if (on && g + w >= (vert ? x0 : y0) && g + w < (vert ? x0 : y0) + ht) { if (vert) T.mod(g + w, t, d, id); else T.mod(t, g + w, d, id); }
        }
    }
}
/* a knot in a board: a dark eye (with a lit rim above it on a floor board) */
function hdW_knot(T, id, cx, cy, rx, ry, vert, mat) {
    if (id == null) id = T.at(cx, cy);
    if (mat) return T.each(id, (x, y) => { const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry; if (u * u + v * v <= 1) T.rec(x, y, mat, id); });
    for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) {
        const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry, q = u * u + v * v;
        if (q <= 0.35) T.mod(x, y, -2, id); else if (q <= 1) T.mod(x, y, -1, id); else if (q <= 1.9 && v < -0.3 && !vert) T.mod(x, y, 1, id);
    }
}
/* specks gathered in soft clumps (the noise sets how likely a speck is): carpet pile, a lawn, sand, today's flecks */
function hdW_speck(T, id, seed, dark, light, cell) {
    T.each(id, (x, y) => {
        const n = hdW_noise(x, y, cell || 6, seed), r = hdW_hash(x, y, seed + 3);
        if (r < dark * 2.2 * (1 - n) * (1 - n)) T.mod(x, y, -1, id); else if (1 - r < light * 2.2 * n * n) T.mod(x, y, 1, id);
    });
}

/* ---------------------------------------------------------------- floors */
/* a checkerboard of 24px tiles (8 today), each with a crisp bevel and a little sheen near its lit corner */
function hdW_checker(T, ca, cb, d) {
    const A = hdW_r(ca, d || 0.05), Bm = hdW_r(cb, d || 0.05), ids = [];
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const id = T.add((i + j) % 2 ? Bm : A, { flat: 1 }); T.rect(id, i * 24, j * 24, 24, 24); ids.push(id); }
    for (const id of ids) T.each(id, (x, y) => { const u = x % 24, v = y % 24; if (u > 2 && v > 2 && u < 9 && v < 9 && u + v === 10) T.mod(x, y, 1); });
    hdW_bevel(T, ids);
}
/* carpet: soft mottling like today's flecks, and the pile as tiny tufts (a lit pixel over a shaded one) */
function hdW_carpet(T, pal, o) {
    o = o || {};
    const id = T.add(pal, { flat: 1 });
    T.rect(id, 0, 0, 48, 48);
    hdW_speck(T, id, o.seed || 1, o.dark || 0.16, o.light || 0, 6);
    T.each(id, (x, y) => { const r = hdW_hash(x, y, (o.seed || 1) + 5); if (r < (o.tuft || 0.04)) { T.mod(x, y, 1); T.mod(x, y + 1, -1); } });
    return id;
}
/* horizontal boards: rows [y, height, joint x...] over a gap color; returns the gap and the boards */
function hdW_boards(T, gapCol, col, rows, o) {
    o = o || {};
    const gap = T.add(hdW_r(gapCol, o.gd || 0.05), { flat: 1 }), ids = [], jw = o.jw != null ? o.jw : 2;
    T.rect(gap, 0, 0, 48, 48);
    rows.forEach(([y, ht, ...js], r) => {
        for (let i = 0; i < js.length; i++) {
            const a = js[i] + jw, b = (i + 1 < js.length ? js[i + 1] : js[0] + 48), tint = (o.tints || [0, -0.02, 0.015, -0.01, 0.02, -0.015])[(r * 2 + i) % 6];
            const id = T.add(hdW_r(hdW_shift(col, tint), o.d || 0.045), { flat: 1 });
            T.rect(id, a, y, b - a, ht);
            hdW_grain(T, id, a, y, b - a, ht, r * 7 + i * 3 + (o.seed || 1), o.per);
            ids.push({ id, a, b, y, ht });
        }
    });
    hdW_bevel(T, ids.map(p => p.id), { b2: o.b2 || 0 });
    if (o.gapShade !== false) hdW_gaps(T, gap, ids.map(p => p.id));
    return { gap, ids };
}

const HDW_FLOORS = {
    /* light planks, a joint in each row where today's are */
    wood: T => {
        const B = hdW_boards(T, '#b98552', '#d9a46a', [[0, 10, 15], [12, 10, 36], [24, 10, 9], [36, 10, 30]], { gd: 0.035, gapShade: false, per: 5 });
        hdW_knot(T, B.ids[2].id, 33, 29, 2.4, 1.5);
    },
    /* wide rustic boards, rough grain, nailed at the ends */
    boards: T => {
        const B = hdW_boards(T, '#7e5630', '#a8763f', [[0, 21, 15], [24, 21, 36]], { per: 3.2, d: 0.05, seed: 4 });
        for (const p of B.ids) hdW_speck(T, p.id, 12 + p.y, 0.07, 0.06, 6);
        for (const p of B.ids) for (const nx of [p.a + 2, p.b - 4]) for (const ny of [p.y + 4, p.y + p.ht - 6]) {
            T.mod(nx, ny, -2); T.mod(nx + 1, ny, -2); T.mod(nx, ny + 1, -2); T.mod(nx + 1, ny + 1, -2); T.mod(nx, ny, 3);
        }
        hdW_knot(T, B.ids[0].id, 33, 11, 2.8, 1.8);
    },
    /* a basket weave of short slats in today's 12px rhythm, light and darker slats in turn as today's rows are */
    parquet: T => {
        const ids = [];
        for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) for (let k = 0; k < 2; k++) {
            const side = (i + j) % 2 === 0, dark = side ? k === 1 : k === 0, n = (j * 4 + i) * 2 + k;
            const id = T.add(hdW_r(hdW_shift(dark ? '#c98a55' : '#d9a46a', (hdW_hash(n, 1, 7) - 0.5) * 0.025), 0.036), { flat: 1 });
            if (side) { T.rect(id, i * 12, j * 12 + k * 6, 12, 6); hdW_grain(T, id, i * 12, j * 12 + k * 6, 12, 6, n, 6); }
            else { T.rect(id, i * 12 + k * 6, j * 12, 6, 12); hdW_grain(T, id, i * 12 + k * 6, j * 12, 12, 6, n, 6, true); }
            ids.push(id);
        }
        hdW_bevel(T, ids, { t: 1, l: 1, b: -1, r: -1, tl: 1 });
    },
    checker: T => hdW_checker(T, '#ffffff', '#f7a8c4'),
    salon: T => hdW_checker(T, '#ffffff', '#f7d6ea'),
    diner: T => hdW_checker(T, '#fbf8f2', '#3b3f52'),
    /* a dance floor: dark glass panels in a dark frame, catching the light at their top left with a glint across it */
    disco: T => {
        const fr = T.add(hdW_r('#1c1a24', 0.05), { flat: 1 });
        T.rect(fr, 0, 0, 48, 48);
        const pu = hdPal('#2a1636', '#3d2250', '#4a2a5a', '#583470', '#9a72b4'), bl = hdPal('#161f36', '#22304c', '#2a3a5a', '#33476c', '#7090bc'), ids = [];
        [[3, 3, pu], [27, 3, bl], [3, 27, bl], [27, 27, pu]].forEach(([x, y, m]) => {
            const id = T.add(m, { flat: 1 }); T.rect(id, x, y, 18, 18); ids.push(id);
            for (let v = 0; v < 18; v++) for (let u = 0; u < 18; u++) {
                const e = Math.min(u, v, 17 - u, 17 - v);
                if (e === 1 && (u === 1 || v === 1)) T.mod(x + u, y + v, -1, id);
                else if (e >= 2 && u + v <= 13) T.mod(x + u, y + v, (u + v === 5 || u + v === 6) ? 2 : 1, id);
            }
        });
        hdW_bevel(T, ids);
        hdW_gaps(T, fr, ids);
    },
    /* the lamp room's metal floor: raised square studs on a dark grid, lit at their top left corner */
    grate: T => {
        const g = T.add(hdW_r('#3a3340', 0.05), { flat: 1 });
        T.rect(g, 0, 0, 48, 48);
        const m = hdPal('#3e3846', '#48414f', '#5a5260', '#6c667a', '#8a8ea8'), ids = [];
        for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
            const id = T.add(m, { flat: 1 }), x = i * 12 + 2, y = j * 12 + 2;
            T.rect(id, x, y, 9, 9); ids.push(id);
            T.mod(x + 1, y + 1, 2); T.mod(x + 2, y + 1, 2); T.mod(x + 1, y + 2, 2); T.mod(x + 2, y + 2, 1); T.mod(x + 3, y + 1, 1); T.mod(x + 1, y + 3, 1);
        }
        hdW_bevel(T, ids, { tl: 2 });
        hdW_gaps(T, g, ids);
    },
    /* a tatami mat in its green cloth border; the rush runs sideways in today's light and dark rows */
    tatami: T => {
        const mat = T.add(hdPal('#9aa05c', '#b0b66c', '#c0c67a', '#d2d88f', '#e0e5a6'), { flat: 1 });
        T.rect(mat, 0, 0, 48, 48);
        T.each(mat, (x, y) => {
            const r = Math.floor(y / 3), k = y % 3;
            if (r % 2 === 0) T.mod(x, y, 1);
            if (k === 2 && (x + r * 5) % 8 === 0) T.mod(x, y, -1);
        });
        const bd = T.add(hdPal('#46602a', '#5a7731', '#6b8a3a', '#7a9a47', '#8eae58'), { flat: 1, layer: 1 });
        T.rect(bd, 0, 0, 48, 3); T.rect(bd, 0, 45, 48, 3); T.rect(bd, 0, 0, 3, 48); T.rect(bd, 45, 0, 3, 48);
        /* two mats' bindings meet along the middle of the band */
        T.each(bd, (x, y) => { const vert = (x < 3 || x > 44) && y > 2 && y < 45, c = vert ? x : y; if (c === 47) T.mod(x, y, -1, bd); });
        hdW_bevel(T, [bd]);
    },
    /* polished marble slabs with soft veins where today's run */
    marble: T => {
        const gr = T.add(hdPal('#c8c3d4', '#d4d0df', '#e0dce8', '#e8e5ef', '#efedf4'), { flat: 1 });
        T.rect(gr, 0, 0, 48, 48);
        const sl = T.add(hdPal('#d4d0e0', '#e7e4ef', '#f2f0f6', '#f8f7fb', '#ffffff'), { flat: 1 });
        T.rect(sl, 2, 2, 44, 44);
        /* veins: soft bands along a path, a darker thread in places, the side veins fading in and out */
        const vein = hdPal('#c4bfd3', '#d2cde0', '#dcd8e8', '#e4e0ee', '#ecebf3');
        const path = (pts, wide, core, seed) => {
            const segs = [];
            for (let i = 0; i + 1 < pts.length; i++) segs.push([pts[i], pts[i + 1]]);
            T.each(sl, (x, y) => {
                let d = 1e9, t = 0;
                for (const [[x0, y0], [x1, y1]] of segs) {
                    const dx = x1 - x0, dy = y1 - y0, u = Math.max(0, Math.min(1, ((x + 0.5 - x0) * dx + (y + 0.5 - y0) * dy) / (dx * dx + dy * dy)));
                    const e = Math.hypot(x + 0.5 - x0 - u * dx, y + 0.5 - y0 - u * dy); if (e < d) { d = e; t = x + y; }
                }
                const fade = hdW_noise(t, 0, 8, seed);
                if (d < wide * (0.5 + fade)) T.mod(x, y, -1, sl);
                if (core && d < 0.6 && fade > 1 - core) T.rec(x, y, vein, sl);
            });
        };
        path([[3, 31], [8, 25], [13, 20], [18, 14], [22, 11], [27, 12], [33, 17], [39, 20], [45, 22]], 1.3, 0.55, 1);
        path([[13, 20], [11, 27], [12, 33], [9, 40]], 0.7, 0, 2);
        path([[33, 17], [36, 24], [40, 31]], 0.7, 0, 3);
        hdW_bevel(T, [sl]);
        hdW_gaps(T, gr, [sl]);
    },
    /* terracotta quarry tiles, each a slightly different firing, with pits and lighter flecks */
    shop: T => {
        const g = T.add(hdPal('#a85a46', '#b8644f', '#c4705a', '#cc7c66', '#d68a74'), { flat: 1 });
        T.rect(g, 0, 0, 48, 48);
        const ids = [];
        [0, -0.015, 0.012, -0.006].forEach((t, k) => {
            const c = hdW_shift('#d9876a', t), id = T.add(hdPal(hdW_shift(c, -0.2), hdW_shift(c, -0.045), c, hdW_shift(c, 0.035), hdW_shift(c, 0.07)), { flat: 1 });
            T.rect(id, (k % 2) * 24 + 2, Math.floor(k / 2) * 24 + 2, 22, 22); ids.push(id);
            hdW_speck(T, id, 20 + k, 0.05, 0.05, 6);
        });
        hdW_bevel(T, ids);
        hdW_gaps(T, g, ids);
    },
    /* cut stone pavers in today's three courses, corners worn round */
    displays: T => {
        const g = T.add(hdPal('#9f9482', '#ada290', '#bfb4a2', '#c9bfae', '#d2c9b9'), { flat: 1 });
        T.rect(g, 0, 0, 48, 48);
        const st = [[1, 6, 1, 4], [9, 14, 1, 4], [1, 3, 7, 9], [6, 9, 7, 9], [12, 14, 7, 9], [1, 7, 12, 14], [10, 14, 12, 14]], ids = [];
        st.forEach(([x0, x1, y0, y1], k) => {
            const c = hdW_shift('#d8d0c0', [0, -0.012, 0.01, -0.006, 0.006, -0.01, 0.012][k]);
            const id = T.add(hdPal(hdW_shift(c, -0.2), hdW_shift(c, -0.05), c, hdW_shift(c, 0.035), hdW_shift(c, 0.065)), { flat: 1 });
            const X0 = 3 * x0 - 1, X1 = 3 * x1 + 3, Y0 = 3 * y0 - 1, Y1 = 3 * y1 + 3;
            T.rect(id, X0, Y0, X1 - X0 + 1, Y1 - Y0 + 1);
            for (const [cx, cy] of [[X0, Y0], [X1, Y0], [X0, Y1], [X1, Y1]]) T.rect(g, cx, cy, 1, 1);
            hdW_speck(T, id, 30 + k, 0.05, 0.04, 6);
            ids.push(id);
        });
        hdW_bevel(T, ids);
        hdW_gaps(T, g, ids);
    },
    /* a lawn indoors: short blades, darker and lighter ones leaning every way, as today's strokes are */
    grass: T => {
        const g = T.add(hdPal('#5ea648', '#7cc65f', '#8fd46f', '#a6e083', '#bdeb9c'), { flat: 1 });
        T.rect(g, 0, 0, 48, 48);
        for (let i = 0; i < 210; i++) {
            const x = Math.floor(hdW_hash(i, 1, 40) * 48), y = Math.floor(hdW_hash(i, 2, 40) * 48), len = 2 + Math.floor(hdW_hash(i, 3, 40) * 4), r = hdW_hash(i, 4, 40), lean = r < 0.4 ? -1 : r < 0.8 ? 1 : 0, d = i % 2 ? 1 : -1;
            for (let k = 0; k < len; k++) T.mod(x + Math.round(lean * k * 0.6), y - k, d, g);
        }
    },
    /* sand: fine grains and a couple of soft ripples */
    sand: T => {
        const g = T.add(hdPal('#d8b878', '#e7ca8b', '#f3dea6', '#fbeec7', '#fff8e4'), { flat: 1 });
        T.rect(g, 0, 0, 48, 48);
        for (const [y0, ph] of [[13, 0.5], [37, 2.6]]) for (let x = 0; x < 48; x++) {
            const y = y0 + Math.round(Math.sin(x / 48 * 6.283 + ph) * 2.2);
            if (hdW_hash(x >> 2, y0, 50) < 0.55) T.mod(x, y, 1, g);
        }
        hdW_speck(T, g, 51, 0.07, 0.07, 6);
    },
    /* the sky carpet: two puffy clouds where today's are, round and lit from the top left */
    cloud: T => {
        const g = T.add(hdPal('#a8bce8', '#bccdf6', '#c8d8ff', '#d3e0ff', '#dde7ff'), { flat: 1 });
        T.rect(g, 0, 0, 48, 48);
        const cm = hdPal('#a9bce6', '#d4e0fa', '#e8f0ff', '#f4f8ff', '#ffffff');
        const c1 = T.add(cm, { R: 4, k: 0.9, layer: 1 });
        T.ellipse(c1, 13.5, 18, 11, 7); T.ellipse(c1, 10, 14, 6, 5.5); T.ellipse(c1, 17.5, 13.5, 6.5, 6); T.ellipse(c1, 22, 18, 4.5, 4.5); T.ellipse(c1, 5.5, 19, 4, 3.5);
        const c2 = T.add(cm, { R: 3, k: 0.9, layer: 1 });
        T.ellipse(c2, 36, 37, 9, 5); T.ellipse(c2, 33, 33.5, 4.5, 4); T.ellipse(c2, 38.5, 33, 4, 4); T.ellipse(c2, 42, 37, 3.5, 3.2);
        hdW_gaps(T, g, [c1, c2], 1, 1);
    },
    /* the arcade's dark carpet and its confetti, each piece where today's is */
    arcade: T => {
        const id = hdW_carpet(T, hdPal('#16112e', '#221b44', '#2a2250', '#342b60', '#40377a'), { seed: 60, dark: 0.12 });
        [[10, 2, '#ffd84a'], [2, 3, '#ff5aa8'], [6, 9, '#4ec3d9'], [13, 12, '#8cc152'], [3, 13, '#ffd84a']].forEach(([x, y, c]) => {
            const p = T.add(hdRamp(c), { flat: 1, layer: 1 });
            T.poly(p, [[3 * x + 1, 3 * y], [3 * x + 3, 3 * y], [3 * x + 6, 3 * y + 3], [3 * x + 6, 3 * y + 5], [3 * x + 4, 3 * y + 5], [3 * x + 1, 3 * y + 2]]);
            hdW_bevel(T, [p], { tl: 1 });
            hdW_gaps(T, id, [p], 1, 1);
        });
    },
    /* pottery studio terrazzo: chips of grey and fired clay set in a pale grey ground */
    studio: T => {
        const g = T.add(hdPal('#9a968e', '#aaa69e', '#b8b4ac', '#c4c0b9', '#cfccc5'), { flat: 1 });
        T.rect(g, 0, 0, 48, 48);
        const cols = ['#a8a49c', '#a8a49c', '#a8a49c', '#9a8a7a', '#c8c4bc', '#c8c4bc', '#c8c4bc', '#c8c4bc', '#c98f6b'];
        for (let i = 0; i < 64; i++) {
            const x = hdW_hash(i, 1, 70) * 48, y = hdW_hash(i, 2, 70) * 48, c = cols[i % cols.length], sz = hdW_hash(i, 4, 70);
            const id = T.add(hdW_r(c, 0.05), { flat: 1 });
            if (sz < 0.7) { T.rect(id, x, y, 2, 2); if (sz < 0.25) T.rect(id, x + 2, y + 1, 1, 1); else if (sz < 0.45) T.rect(id, x + 1, y + 2, 1, 1); }
            else T.rect(id, x, y, 1, 1);
            T.mod(x, y, 1, id);
            if (sz < 0.45) T.mod(x + 1, y + 1, -1, id);
        }
        hdW_speck(T, g, 72, 0.03, 0.03, 6);
    },
    /* the workshop's concrete: specks of aggregate and a saw-cut joint along each row (today's bottom line) */
    workshop: T => {
        const g = T.add(hdPal('#a89880', '#b8a890', '#c8b8a0', '#d2c3ac', '#ddd0ba'), { flat: 1 });
        T.rect(g, 0, 0, 48, 48);
        hdW_speck(T, g, 82, 0.08, 0.06, 6);
        for (let i = 0; i < 26; i++) {
            const x = Math.floor(hdW_hash(i, 1, 81) * 48), y = Math.floor(hdW_hash(i, 2, 81) * 44), r = hdW_hash(i, 3, 81);
            if (r < 0.25) T.px(x, y, '#e0c080'); else if (r < 0.6) { T.mod(x, y, -1); T.mod(x + 1, y, -1); T.mod(x, y - 1, 1); } else T.mod(x, y, r < 0.8 ? 1 : -1);
        }
        const j = T.add(hdPal('#8a7a64', '#9c8c74', '#b0a088', '#c2b39c', '#d0c2ac'), { flat: 1 });
        T.rect(j, 0, 45, 48, 2);
        T.each(j, (x, y) => { if (y === 45) T.mod(x, y, -1); });
        T.each(g, (x, y) => { if (y === 47) T.mod(x, y, 1); });
    },
    /* the barn: wide boards strewn with straw: short bits lying mostly along the boards, a few long strands */
    hay: T => {
        const B = hdW_boards(T, '#9a6d3f', '#b98a5a', [[0, 21, 0], [24, 21, 0]], { jw: 0, per: 7, seed: 90 });
        const sm = [hdPal('#8a6a28', '#b8963a', '#d4b048', '#e2c25c', '#f0d878'), hdPal('#a8862f', '#d4b048', '#e8c860', '#f2dc80', '#fff2b4'), hdPal('#b8963a', '#e8c860', '#f2dc80', '#fff0a8', '#fff8d0')];
        const S = new Set();
        for (let i = 0; i < 100; i++) {
            const long = i < 10, x = hdW_hash(i, 1, 91) * 48, y = hdW_hash(i, 2, 91) * 48, a = (hdW_hash(i, 3, 91) - 0.5) * (long ? 1.3 : 0.7), l = long ? 6 + hdW_hash(i, 4, 91) * 4 : 2 + hdW_hash(i, 4, 91) * 3;
            const id = T.add(sm[i % 3], { flat: 1, layer: 1 });
            S.add(id);
            const x1 = x + Math.cos(a) * l, y1 = y + Math.sin(a) * l;
            const n = Math.ceil(Math.max(Math.abs(x1 - x), Math.abs(y1 - y)));
            for (let k = 0; k <= n; k++) T.rect(id, x + (x1 - x) * k / n, y + (y1 - y) * k / n, 1, 1);
            T.mod(x, y, 1, id);
            if (long) T.mod(x1, y1, -1, id);
        }
        /* each bit shades the board just under it */
        for (const p of B.ids) T.each(p.id, (x, y) => { if (S.has(T.at(x, y - 1))) T.mod(x, y, -1, p.id); });
    },
    blue: T => hdW_carpet(T, hdPal('#5578a8', '#6f98c8', '#7fa8d8', '#8cb4e0', '#9cc0e8'), { seed: 100, dark: 0.2 }),
    crimson: T => hdW_carpet(T, hdPal('#6a1222', '#8a1b2d', '#9a2032', '#aa3040', '#b8404e'), { seed: 110, dark: 0.12, light: 0.06, tuft: 0.05 }),
};
for (const k in HDW_FLOORS) HD_SPR['fl_floor_' + k] = { w: 48, h: 48, ax: 0, ay: 0, draw: hdW_tile(48, 48, true, HDW_FLOORS[k]) };

/* ---------------------------------------------------------------- wallpapers */
/* the baseboard along the bottom: a lit lip (today's light row 28) over the board (rows 29-31), a groove along it */
function hdW_skirt(T, lip, board, y, o) {
    y = y == null ? 84 : y; o = o || {};
    const B = T.add(hdW_r(board, o.bd || 0.05), { flat: 1 }), L = lip ? T.add(hdW_r(lip, o.ld || 0.05), { flat: 1 }) : -1, t = lip ? y + 3 : y;
    T.rect(B, 0, t, 48, 96 + HDW_M - t);
    if (lip) T.rect(L, 0, y, 48, 3);
    for (let x = 0; x < 48; x++) {
        if (lip) { T.mod(x, y, 1, L); T.mod(x, y + 2, -1, L); }
        else T.mod(x, y, 1, B);
        T.mod(x, t, -1, B); T.mod(x, t + 4, -1, B); T.mod(x, t + 5, 1, B);
        if (o.crease !== false) T.mod(x, y - 1, -1);
    }
    return { lip: L, board: B };
}
/* a wall part from above the top (so the ceiling edge has no outline) down to row y1 */
function hdW_body(T, col, y1, d) { const id = T.add(hdW_r(col, d || 0.035), { flat: 1 }); T.rect(id, 0, -HDW_M, 48, y1 + HDW_M); return id; }
/* boards standing side by side between rows y0 and y1, a gap at each joint x (jw wide) */
function hdW_vboards(T, col, gapCol, js, y0, y1, o) {
    o = o || {};
    const jw = o.jw || 2, gap = T.add(hdW_r(gapCol, 0.05), { flat: 1 }), ids = [];
    T.rect(gap, 0, y0, 48, y1 - y0);
    js.forEach((j, i) => {
        const a = j + jw, b = i + 1 < js.length ? js[i + 1] : js[0] + 48, tint = (o.tints || [0, -0.015, 0.012, -0.008, 0.015])[i % 5];
        const id = T.add(hdW_r(hdW_shift(col, tint), o.d || 0.03), { flat: 1 });
        T.rect(id, a, y0, b - a, y1 - y0);
        if (o.grain !== false) hdW_grain(T, id, a, y0, y1 - y0, b - a, i * 5 + (o.seed || 1), o.per || 5, true);
        ids.push({ id, a, b });
    });
    hdW_bevel(T, ids.map(p => p.id), Object.assign({ t: 0, b: 0, l: 1, r: -1 }, o.bevel));
    hdW_gaps(T, gap, ids.map(p => p.id), 0, 1);
    return { gap, ids };
}
/* a rounded rail across the wall (chair rail, trim): lit on top, shaded underneath, casting a shadow below */
function hdW_rail(T, mat, y, h, o) {
    o = o || {};
    const id = T.add(mat, { R: o.R || Math.max(1.5, h / 2.2), k: o.k || 1, grad: 0 });
    T.rect(id, 0, y, 48, h);
    if (o.cast !== false) for (let x = 0; x < 48; x++) for (let k = 1; k <= (o.cast || 2); k++) T.mod(x, y + h - 1 + k, -1);
    return id;
}
/* soft paper or plaster texture */
function hdW_paper(T, id, seed, amt) { hdW_speck(T, id, seed, 0, amt || 0.012, 6); }
/* a little four-point twinkle: a bright middle, arms in the color, a faint glow between them */
function hdW_twinkle(T, x, y, col, big) {
    const c = hdRgb(col), lit = hdW_mixC(c, [255, 255, 255], 0.6);
    T.px(x, y, lit);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) T.px(x + dx, y + dy, c);
    if (big) for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) T.px(x + dx, y + dy, hdW_mixC(c, [42, 34, 56], 0.45));
}
function hdW_mixC(a, b, t) { return a.map((v, i) => Math.round(v + (b[i] - v) * t)); }

const HDW_WALLS = {
    /* plain cream paint */
    cream: T => { const b = hdW_body(T, '#fbead6', 84); hdW_paper(T, b, 1); hdW_skirt(T, '#fceede', '#c3b4aa'); },
    /* pale mint with little leaves in today's two columns */
    mint: T => {
        hdW_body(T, '#dcf2e6', 84);
        const lf = hdPal('#5fa883', '#86c9a6', '#9cd8b8', '#b2e4ca', '#c8eed9');
        [12, 36].forEach((cx, c) => [10.5, 28.5, 46.5, 64.5].forEach((cy, r) => {
            /* a little leaf, tipped up or down in turn, its stem to the left */
            const id = T.add(lf, { flat: 1 }), f = (r + c) % 2 ? -1 : 1;
            T.poly(id, [[cx - 3, cy + 0.5 * f], [cx - 1, cy - 1.3], [cx + 1.5, cy - 1.5 - 0.5 * f], [cx + 3.5, cy - 0.8 * f], [cx + 1.5, cy + 1.3 - 0.4 * f], [cx - 1, cy + 1.4]]);
            hdW_bevel(T, [id], { t: 1, l: 0, b: -1, r: 0 });
            for (let k = -2; k <= 2; k++) T.mod(cx + k, Math.floor(cy) - (k > 0 && f > 0 ? 1 : 0), 1, id);
            T.px(Math.floor(cx) - 4, Math.floor(cy + 0.5 * f + 0.5), '#86c9a6');
        }));
        hdW_skirt(T, '#e3f5eb', '#acbab6');
    },
    /* pink stripes, each edged with a fine darker line */
    pinkstripe: T => {
        hdW_body(T, '#ffe0ea', 84);
        for (const x of [6, 30]) {
            const id = T.add(hdW_r('#ffc8d8', 0.035), { flat: 1 }); T.rect(id, x, -HDW_M, 6, 84 + HDW_M);
            for (let y = -HDW_M; y < 84; y++) { T.mod(x, y, -1, id); T.mod(x + 5, y, -1, id); T.mod(x + 2, y, 1, id); }
        }
        hdW_skirt(T, '#ffe6ee', '#c6acb9');
    },
    /* polka dots where today's are, each with a soft lit rim */
    polka: T => {
        hdW_body(T, '#fff0f6', 84);
        [[10.5, 10.5, '#bfe6ff'], [34.5, 22.5, '#bfe6ff'], [16.5, 37.5, '#fff0a0'], [40.5, 49.5, '#fff0a0'], [7.5, 61.5, '#ffd0e0'], [28.5, 73.5, '#bfe6ff']].forEach(([x, y, c]) => {
            const id = T.add(hdW_r(c, 0.05), { flat: 1 }); T.ellipse(id, x, y, 4.6, 4.6);
            T.each(id, (px, py) => { const u = px + 0.5 - x, v = py + 0.5 - y, r = Math.hypot(u, v); if (r > 3.2 && u + v < -2) T.mod(px, py, 1); else if (r > 3.4 && u + v > 3) T.mod(px, py, -1); });
        });
        hdW_skirt(T, '#fff3f8', '#c6b8c2');
    },
    /* the night sky: twinkling stars where today's are, the round one a moon with a soft glow */
    night: T => {
        const b = hdW_body(T, '#2e2a4a', 84, 0.05);
        for (let i = 0; i < 9; i++) T.mod(Math.floor(hdW_hash(i, 1, 5) * 48), Math.floor(hdW_hash(i, 2, 5) * 80), 2, b);
        T.each(b, (x, y) => { const r = Math.hypot(x + 0.5 - 36, y + 0.5 - 18); if (r < 9.5 && r >= 6) T.mod(x, y, 1); });
        const moon = T.add(hdPal('#b8ac7c', '#e6dcae', '#fff6d0', '#fffbe6', '#ffffff'), { R: 4, k: 1.1 });
        T.ellipse(moon, 36, 18, 6, 6);
        for (const [x, y] of [[37, 20], [38, 20], [34, 16], [38, 15]]) T.mod(x, y, -1, moon);
        [[28.5, 7.5, 1], [10.5, 13.5, 1], [34.5, 28.5, 0], [19.5, 46.5, 1], [40.5, 61.5, 0], [7.5, 70.5, 1]].forEach(([x, y, big]) => hdW_twinkle(T, Math.floor(x), Math.floor(y), '#fff6b0', big));
        hdW_skirt(T, '#58556e', '#1c1830');
    },
    /* bamboo canes in today's three columns, the nodes on today's rows */
    bamboo: T => {
        const b = hdW_body(T, '#e8e4c8', 84); hdW_paper(T, b, 6);
        const cane = hdPal('#7f7f44', '#adad6c', '#c8c88a', '#d9d9a2', '#e8e8bc'), node = hdPal('#6f6f38', '#8f8f4c', '#a8a860', '#bcbc76', '#d0d08e');
        const shade = [-1, 1, 2, 1, 0, 0, 0, -1, -1];      // round, lit from the left
        for (const x of [3, 18, 33]) {
            const id = T.add(cane, { flat: 1 });
            T.rect(id, x, -HDW_M, 9, 84 + HDW_M);
            for (let y = -HDW_M; y < 84; y++) for (let k = 0; k < 9; k++) if (shade[k]) T.mod(x + k, y, shade[k], id);
            for (const y of [21, 48, 72]) {
                const n = T.add(node, { flat: 1 });
                T.rect(n, x - 1, y, 11, 2);
                for (let k = 0; k < 11; k++) { T.mod(x - 1 + k, y, k < 4 ? 1 : 0, n); T.mod(x - 1 + k, y + 1, k < 2 ? 0 : -1, n); }
                for (let k = 0; k < 9; k++) { T.mod(x + k, y + 2, -1, id); T.mod(x + k, y - 1, 1, id); }
            }
            for (let y = -HDW_M; y < 84; y++) T.mod(x + 9, y, -1, b);
        }
        hdW_skirt(T, '#ede9d3', '#b4afa0');
    },
    /* red barn boards, a white rail across them */
    barn: T => {
        const V = hdW_vboards(T, '#b8433a', '#9f3b37', [0, 12, 24, 36], -HDW_M, 84, { seed: 7, per: 9, d: 0.02 });
        const kn = hdW_r('#903635', 0.05);   // today's knots: small dark ovals
        for (const [x, y] of [[44, 10], [8, 16], [32, 37], [20, 64]]) hdW_knot(T, null, x, y, 1.6, 2.2, true, kn);
        const rail = T.add(hdW_r('#fbf6ee', 0.04), { flat: 1 });
        T.rect(rail, 0, 51, 48, 6);
        for (let x = 0; x < 48; x++) { T.mod(x, 51, 1, rail); T.mod(x, 56, -1, rail); T.mod(x, 57, -1); T.mod(x, 58, -1); }
        for (const x of [5, 29]) { T.mod(x, 53, -1, rail); T.mod(x + 1, 53, -1, rail); T.mod(x, 52, 1, rail); }
        hdW_skirt(T, '#c66961', '#903635');
    },
    /* light wood paneling with a chair rail */
    shop: T => {
        hdW_vboards(T, '#e8c8a0', '#d4b08a', [0, 12, 24, 36], -HDW_M, 84, { seed: 9, d: 0.028, per: 6 });
        hdW_rail(T, hdPal('#a8794a', '#c99a62', '#e2bc88', '#f2d8b0', '#faeacc'), 42, 6, { cast: 2 });
        hdW_skirt(T, '#edd3b3', '#b49a82');
    },
    /* rough planks of today's widths, knots and nail heads */
    workshop: T => {
        const V = hdW_vboards(T, '#c9935a', '#b08153', [0, 15, 33], -HDW_M, 84, { seed: 11, per: 5, d: 0.035 });
        for (const [x, y] of [[7, 19], [40, 28], [25, 52], [10, 67]]) hdW_knot(T, null, x, y, 1.3, 2.2, true);
        for (const p of V.ids) for (const y of [6, 76]) { const x = Math.round((p.a + p.b) / 2); T.mod(x, y, -2); T.mod(x + 1, y, -2); T.mod(x, y + 1, -2); T.mod(x + 1, y + 1, -2); T.mod(x, y, 3); }
        hdW_skirt(T, '#d4a97b', '#9d724d');
    },
    /* painted shiplap: boards running sideways, a shadowed groove under each */
    shiplap: T => {
        const g = T.add(hdW_r('#a8d0e0', 0.05), { flat: 1 }); T.rect(g, 0, -HDW_M, 48, 84 + HDW_M);
        const ids = [];
        for (let k = -1; k < 7; k++) { const id = T.add(hdW_r(hdW_shift('#cfe8f2', [0, -0.008, 0.006][(k + 3) % 3]), 0.022), { flat: 1 }); T.rect(id, 0, 12 * k, 48, 10); hdW_grain(T, id, 0, 12 * k, 48, 10, k + 20, 10); ids.push(id); }
        hdW_bevel(T, ids, { t: 1, l: 0, b: -1, r: 0 });
        hdW_gaps(T, g, ids, 1, 0);
        hdW_skirt(T, '#d9edf5', '#a2b2bf');
    },
    /* bricks in today's bond, each a slightly different firing, in darker mortar */
    brick: T => {
        const m = T.add(hdW_r('#a86a52', 0.05), { flat: 1 }); T.rect(m, 0, -HDW_M, 48, 84 + HDW_M);
        const ids = [];
        for (let k = -1; k < 7; k++) for (let i = 0; i < 2; i++) {
            const x = (k % 2 === 0 ? 0 : 12) + i * 24 + 2, n = (k + 1) * 2 + i, c = hdW_shift('#c98a6b', (hdW_hash(n, 3, 12) - 0.5) * 0.06, (hdW_hash(n, 4, 12) - 0.5) * 6);
            const id = T.add(hdPal(hdW_shift(c, -0.2), hdW_shift(c, -0.055), c, hdW_shift(c, 0.04), hdW_shift(c, 0.075)), { flat: 1 });
            T.rect(id, x, 12 * k + 2, 22, 10); ids.push(id);
            hdW_speck(T, id, 13 + n, 0.06, 0.05, 6);
        }
        hdW_bevel(T, ids);
        hdW_gaps(T, m, ids);
        hdW_skirt(T, '#d4a189', '#9d6c5a');
    },
    /* pale cut stone in today's courses, edges softened */
    stone: T => {
        const m = T.add(hdW_r('#cfc4ae', 0.045), { flat: 1 }); T.rect(m, 0, -HDW_M, 48, 84 + HDW_M);
        const ids = [], rows = [[-HDW_M, 16 + HDW_M, 16], [18, 16, 0], [36, 16, 16], [54, 16, 0], [72, 10, 16]];
        rows.forEach(([y, h, j], r) => [0, 24].forEach((dx, i) => {
            const n = r * 2 + i, c = hdW_shift('#e8e0d0', (hdW_hash(n, 1, 14) - 0.5) * 0.03), id = T.add(hdPal(hdW_shift(c, -0.2), hdW_shift(c, -0.045), c, hdW_shift(c, 0.03), hdW_shift(c, 0.055)), { flat: 1 });
            const x0 = j + dx + 2, x1 = j + dx + 24 - 1;
            T.rect(id, x0, y, x1 - x0 + 1, h);
            if (y >= 0) { T.rect(m, x0, y, 1, 1); T.rect(m, x1, y, 1, 1); }
            T.rect(m, x0, y + h - 1, 1, 1); T.rect(m, x1, y + h - 1, 1, 1);
            hdW_speck(T, id, 15 + n, 0.05, 0.05, 6);
            ids.push(id);
        }));
        hdW_bevel(T, ids);
        hdW_gaps(T, m, ids);
        hdW_skirt(T, '#ede6d9', '#b4aca6');
    },
    /* the lighthouse: whitewashed blocks, the red band, a dark stone course at the foot */
    lighthouse: T => {
        const m = T.add(hdW_r('#e0dace', 0.04), { flat: 1 }); T.rect(m, 0, -HDW_M, 48, 78 + HDW_M);
        /* today's courses: blocks 9 and 5 pixels wide (27 and 15 here) between joints, the joints moving every course */
        const ids = [], course = (y, h, odd) => [[18, 28], [48, 16]].forEach(([x, len], i) => {
            const id = T.add(hdW_r(hdW_shift('#f4f0e8', (hdW_hash(y, i, 16) - 0.5) * 0.02), 0.035), { flat: 1 });
            T.rect(id, x - (odd ? 16 : 0), y, len, h); ids.push(id);
            hdW_speck(T, id, 17 + y + i, 0.03, 0.02, 6);
        });
        course(-HDW_M, HDW_M, true); course(2, 13, false); course(17, 13, true); course(32, 13, false); course(47, 13, true); course(72, 3, false);
        hdW_bevel(T, ids);
        hdW_gaps(T, m, ids);
        const band = T.add(hdPal('#9a1c30', '#c42840', '#e0304a', '#f0485e', '#ff6a7a'), { flat: 1 });
        T.rect(band, 0, 60, 48, 12);
        for (let x = 0; x < 48; x++) { T.mod(x, 60, 2, band); T.mod(x, 61, 2, band); T.mod(x, 62, 1, band); T.mod(x, 71, -1, band); T.mod(x, 72, -1); }
        const st = T.add(hdW_r('#8a8070', 0.05), { flat: 1 }); T.rect(st, 0, 78, 48, 6);
        for (let x = 0; x < 48; x++) { T.mod(x, 78, 1, st); T.mod(x, 83, -1, st); }
        hdW_speck(T, st, 18, 0.04, 0.03, 6);
        hdW_skirt(T, null, '#beb8b8', 84, { crease: false });
    },
    /* the arcade: dark wall, a neon stripe, little angles of confetti where today's are */
    arcade: T => {
        const b = hdW_body(T, '#241a44', 84, 0.05);
        for (let i = 0; i < 12; i++) T.mod(Math.floor(hdW_hash(i, 1, 30) * 48), Math.floor(hdW_hash(i, 2, 30) * 82), 1, b);
        const st = T.add(hdPal('#2c2258', '#3a2e70', '#4a3a86', '#6a58b0', '#8c7ad0'), { flat: 1 });
        T.rect(st, 0, 36, 48, 3);
        for (let x = 0; x < 48; x++) { T.mod(x, 37, 1, st); T.mod(x, 35, 1, b); T.mod(x, 39, 1, b); }
        [[3, 4, '#ff5aa8'], [11, 9, '#4ec3d9'], [6, 15, '#ffd84a'], [13, 21, '#8cc152'], [2, 24, '#4ec3d9']].forEach(([x, y, c]) => {
            const id = T.add(hdRamp(c), { flat: 1 });
            T.rect(id, 3 * x, 3 * y, 6, 3); T.rect(id, 3 * x, 3 * y, 3, 6);
            hdW_bevel(T, [id], { tl: 1 });
        });
        hdW_skirt(T, '#504869', '#1c1830');
    },
    /* little cherry blossoms where today's flowers are */
    blossom: T => {
        hdW_body(T, '#fff4f6', 84);
        const pet = hdPal('#e07a98', '#f39ab4', '#ffb3c8', '#ffc6d6', '#ffdbe5');
        [[10.5, 16.5], [34.5, 34.5], [16.5, 58.5], [37.5, 70.5]].forEach(([cx, cy], k) => {
            for (const [dx, dy] of [[0, -2.6], [2.6, 0], [0, 2.6], [-2.6, 0]]) { const id = T.add(pet, { R: 1.6, k: 0.8 }); T.ellipse(id, cx + dx, cy + dy, 1.9, 1.9); }
            const x = Math.floor(cx), y = Math.floor(cy);
            T.px(x - 1, y - 1, '#ffe680'); T.px(x, y - 1, '#ffd84a'); T.px(x - 1, y, '#ffd84a'); T.px(x, y, '#e8b432');
        });
        hdW_skirt(T, '#fff6f8', '#c6bbc2');
    },
    /* the boutique: fine double pinstripes and little orange dots */
    boutique: T => {
        hdW_body(T, '#fff4ee', 84);
        const st = T.add(hdW_r('#ffd8b8', 0.04), { flat: 1 });
        for (const x of [9, 11, 33, 35]) T.rect(st, x, -HDW_M, 1, 84 + HDW_M);
        [[22.5, 25.5], [46.5, 43.5], [22.5, 61.5]].forEach(([cx, cy]) => {
            const id = T.add(hdRamp('#f7962d'), { flat: 1 }), x = Math.floor(cx), y = Math.floor(cy);
            T.rect(id, x - 1, y - 2, 3, 5); T.rect(id, x - 2, y - 1, 5, 3);
            T.mod(x - 1, y - 1, 1, id); T.mod(x + 1, y + 1, -1, id);
        });
        hdW_skirt(T, '#fff6f1', '#c6bbbc');
    },
    /* the library: deep red damask above a built-in shelf of books in today's colors */
    crimson: T => {
        const b = hdW_body(T, '#7a1f2c', 42, 0.045);
        T.each(b, (x, y) => {
            const row = Math.floor((y + 14) / 14), u = Math.abs(((x + (row % 2) * 12) % 24) - 12), v = Math.abs(((y + 14) % 14) - 7), q = u / 5 + v / 6;
            if (q < 0.95 && q > 0.7 && (x + y) % 2 === 0) T.mod(x, y, 1); else if (q < 0.25) T.mod(x, y, 1);
        });
        const wood = hdPal('#2a180e', '#3a2418', '#5a3a2a', '#6e4a36', '#86604a');
        const back = T.add(hdPal('#1e120a', '#2c1a10', '#3a2418', '#4a2e20', '#5a3a2a'), { flat: 1 });
        T.rect(back, 0, 48, 48, 30);
        [['#4f86c6', 3, 3], ['#e0705a', 12, 1], ['#8cc152', 21, 4], ['#e8c878', 30, 2], ['#ffcf57', 39, 1]].forEach(([c, x, top], i) => {
            const id = T.add(hdRamp(c), { R: 2.2, k: 0.9 });
            T.rect(id, x, 48 + top, 6, 30 - top);
            for (let k = 0; k < 6; k++) { T.mod(x + k, 51 + top, -1, id); T.mod(x + k, 52 + top, 1, id); T.mod(x + k, 73, -1, id); T.mod(x + k, 74, 1, id); }
            if (i % 2 === 0) for (let yy = 59; yy < 65; yy++) for (let k = 1; k < 5; k++) T.mod(x + k, yy, 1, id);
        });
        const top = T.add(wood, { flat: 1 });
        T.rect(top, 0, 42, 48, 6);
        for (let x = 0; x < 48; x++) { T.mod(x, 42, -1, top); T.mod(x, 43, 1, top); T.mod(x, 47, -1, top); T.mod(x, 48, -1); T.mod(x, 49, -1); }
        const shelf = T.add(wood, { flat: 1 });
        T.rect(shelf, 0, 78, 48, 6);
        for (let x = 0; x < 48; x++) { T.mod(x, 78, 1, shelf); T.mod(x, 77, -1); T.mod(x, 83, -1, shelf); }
        hdW_skirt(T, '#954c56', '#1c1830', 84, { crease: false });
    },
    /* the diner: cream above a chrome strip and padded red ribs */
    diner: T => {
        hdW_body(T, '#fbf6ee', 42);
        const rib = hdPal('#8a1424', '#b8283a', '#d9364a', '#e5505f', '#f27482'), gap = T.add(hdW_r('#b8283a', 0.05), { flat: 1 });
        T.rect(gap, 0, 48, 48, 36);
        const shade = [0, 1, 1, 1, 0, 0, 0, -1, -1, -1];  // padded, lit from the left
        for (let i = 0; i < 4; i++) {
            const id = T.add(rib, { flat: 1 }), x = 12 * i + 2;
            T.rect(id, x, 48, 10, 36);
            for (let y = 48; y < 84; y++) for (let k = 0; k < 10; k++) T.mod(x + k, y, shade[k] + (y === 48 || y === 49 ? -1 : y === 83 ? -1 : 0), id);
        }
        hdW_rail(T, hdPal('#7a8496', '#b8c2d0', '#e8eef6', '#f4f7fb', '#ffffff'), 42, 6, { R: 2.4, cast: 2 });
        hdW_skirt(T, '#fcf8f1', '#c3bcbc');
    },
    /* the disco: dark velvet with little sparkles where today's dots are */
    disco: T => {
        const b = hdW_body(T, '#2a2238', 84, 0.05);
        for (let i = 0; i < 14; i++) T.mod(Math.floor(hdW_hash(i, 1, 35) * 48), Math.floor(hdW_hash(i, 2, 35) * 82), 1, b);
        [[28, 10, '#ff5aa8'], [10, 13, '#4ec3d9'], [34, 25, '#4ec3d9'], [19, 43, '#ffd84a'], [40, 58, '#ffd84a'], [7, 67, '#ff5aa8']].forEach(([x, y, c], i) => hdW_twinkle(T, x, y, c, i % 2 === 0));
        hdW_skirt(T, '#554e60', '#1c1830');
    },
    /* a garden trellis: pale green slats over paler cells, leaves growing where today's are */
    displays: T => {
        const b = hdW_body(T, '#e8f2da', 78);
        const sm = hdPal('#9cb488', '#bad0a4', '#cfe0bc', '#dcebcc', '#e8f3dc'), V = T.add(sm, { flat: 1, layer: 1 }), H = T.add(sm, { flat: 1, layer: 2 });
        for (const x of [0, 12, 24, 36]) T.rect(V, x, -HDW_M, 3, 78 + HDW_M);
        for (const y of [6, 24, 42, 60]) T.rect(H, 0, y, 48, 3);
        hdW_bevel(T, [V], { t: 0, b: 0 }); hdW_bevel(T, [H], { l: 0, r: 0 });
        hdW_gaps(T, b, [V, H], 1, 1);
        const lf = hdPal('#2f7a36', '#4fa655', '#6cc063', '#86d27a', '#a2e294'), dk = hdPal('#25642c', '#3f8f45', '#4fa655', '#62b866', '#7ccc7c');
        [[6, 12], [27, 33], [15, 57], [39, 66]].forEach(([x, y]) => {
            const id = T.add(lf, { flat: 1, layer: 3 });
            T.poly(id, [[x, y], [x + 4.5, y + 1], [x + 6.5, y + 6.5], [x + 1, y + 4.5]]);
            T.each(id, (px, py) => { if ((px - x) - (py - y) < 0) T.rec(px, py, dk); });
            for (let k = 1; k < 6; k++) T.mod(x + k, y + k, 1, id);
            T.px(x - 1, y - 1, '#3f8f45');
        });
        hdW_rail(T, hdPal('#22602a', '#2f7a36', '#3f8f45', '#55a85a', '#70c072'), 78, 6, { R: 2, cast: 1 });
        hdW_skirt(T, null, '#b4baad', 84, { crease: false });
    },
    /* the gallery: a gold picture rail, plain walls for the paintings, a chair rail over paneled wainscot */
    gallery: T => {
        hdW_body(T, '#f7f2ea', 60);
        const cove = T.add(hdPal('#8a6a20', '#b8922e', '#d9b44a', '#e8c868', '#f2d880'), { flat: 1 });
        T.rect(cove, 0, 9, 48, 3);
        const bead = T.add(hdPal('#a8862f', '#dcbc5a', '#f2d880', '#faeaa8', '#fff6d4'), { R: 1.6, k: 1 });
        T.rect(bead, 0, 12, 48, 3);
        for (let x = 0; x < 48; x++) { T.mod(x, 9, -1, cove); T.mod(x, 15, -1); if (x % 6 === 0) T.mod(x, 10, 1, cove); }
        const w = T.add(hdW_r('#ece4d6', 0.035), { flat: 1 });
        T.rect(w, 0, 63, 48, 21);
        for (let x = 5; x <= 42; x++) { T.mod(x, 67, -1, w); T.mod(x, 79, 1, w); }
        for (let y = 67; y <= 79; y++) { T.mod(5, y, -1, w); T.mod(42, y, 1, w); }
        hdW_rail(T, hdPal('#a89a80', '#c4b89e', '#d8cdb8', '#e6ddcc', '#f0e9dc'), 60, 3, { R: 1.4, cast: 1 });
        hdW_skirt(T, '#f9f5ee', '#c0bab9');
    },
    /* the lamp room's windows: sky and sea through the glass, a glint, the sill */
    lamp: T => {
        const fr = T.add(hdPal('#140e18', '#20182a', '#2d2230', '#463848', '#5e4e62'), { flat: 1 });
        T.rect(fr, 0, -HDW_M, 48, 78 + HDW_M);
        for (let y = -HDW_M; y < 78; y++) { T.mod(0, y, 1, fr); T.mod(47, y, -1, fr); }
        const sky = T.add(hdPal('#5e9ccc', '#86bee6', '#9ad0f0', '#b0dcf4', '#d4eefb'), { flat: 1 });
        T.rect(sky, 3, 3, 42, 39);
        const hz = T.add(hdPal('#a8c8e0', '#c8e2f4', '#dff2ff', '#eef8ff', '#ffffff'), { flat: 1 });
        T.rect(hz, 3, 42, 42, 3);
        const sea = T.add(hdPal('#24508a', '#3c74b0', '#4a8ac8', '#6aa8e0', '#a4d0f2'), { flat: 1 });
        T.rect(sea, 3, 45, 42, 33);
        T.each(sky, (x, y) => { if (y < 9 || (y < 12 && (x + y) % 2 === 0)) T.mod(x, y, -1); else if (y > 36 || (y > 33 && (x + y) % 2 === 0)) T.mod(x, y, 1); });
        const cl = T.add(hdPal('#8ab4d4', '#cfe6f6', '#f2f9ff', '#ffffff', '#ffffff'), { R: 2.5, k: 0.8, layer: 1 });
        T.ellipse(cl, 33, 27, 6, 2.6); T.ellipse(cl, 31, 25, 3.2, 2.6); T.ellipse(cl, 35.5, 25.5, 2.6, 2.2);
        for (const [x0, y0, len] of [[12, 52, 20], [6, 64, 26]]) for (let k = 0; k < len; k++) { const x = x0 + k, y = y0 + (Math.floor(k / 3) % 2); T.mod(x, y, 1, sea); if (k % 6 === 2) T.mod(x, y - 1, 1, sea); }
        T.each(sea, (x, y) => { if (y > 70 || (y > 67 && (x + y) % 2 === 0)) T.mod(x, y, -1); if (y < 48 && hdW_hash(x, y, 40) < 0.12) T.mod(x, y, 2); });
        for (let k = 0; k < 7; k++) { T.px(17 - k, 8 + k, '#ffffff'); T.px(18 - k, 8 + k, '#ffffff'); T.mod(19 - k, 8 + k, 2, sky); }
        for (let k = 0; k < 3; k++) T.px(21 - k, 8 + k, '#ffffff');
        for (let i = 3; i < 45; i++) { T.mod(i, 3, -1); T.mod(3, i, -1); }
        const sill = T.add(hdPal('#1c1822', '#2c2834', '#3a3340', '#524a5a', '#6a6274'), { flat: 1 });
        T.rect(sill, 0, 78, 48, 6);
        for (let x = 0; x < 48; x++) { T.mod(x, 78, 2, sill); T.mod(x, 79, 1, sill); T.mod(x, 83, -1, sill); }
        const sk = hdW_skirt(T, null, '#7aa0be', 84, { crease: false });
        for (let x = 0; x < 48; x++) { T.mod(x, 84, -2, sk.board); T.mod(x, 85, -1, sk.board); }
    },
    /* the salon: lilac stripes with little hearts, a purple trim along the foot */
    salon: T => {
        hdW_body(T, '#f6e8fa', 78);
        const st = T.add(hdW_r('#ecd6f6', 0.035), { flat: 1 });
        for (const x of [0, 24]) { T.rect(st, x, -HDW_M, 9, 78 + HDW_M); for (let y = -HDW_M; y < 78; y++) { T.mod(x, y, -1, st); T.mod(x + 8, y, -1, st); } }
        [[18, 21], [42, 51], [18, 75]].forEach(([cx, cy]) => {
            const id = T.add(hdPal('#d0708e', '#f096be', '#ffb3d9', '#ffc8e4', '#ffe0f0'), { R: 1.6, k: 0.8 });
            T.ellipse(id, cx - 1.5, cy - 1.2, 1.8, 1.8); T.ellipse(id, cx + 1.5, cy - 1.2, 1.8, 1.8); T.poly(id, [[cx - 3.3, cy - 0.8], [cx + 3.3, cy - 0.8], [cx, cy + 3]]);
            T.mod(cx - 2, cy - 2, 2, id);
        });
        hdW_rail(T, hdPal('#6e3fb0', '#9566d8', '#b37cf0', '#c69af5', '#dabdf9'), 78, 6, { R: 2, cast: 1 });
        hdW_skirt(T, null, '#bfb2c5', 84, { crease: false });
    },
};
for (const k in HDW_WALLS) HD_SPR['wp_wall_' + k] = { w: 48, h: 96, ax: 0, ay: 0, draw: hdW_tile(48, 96, false, HDW_WALLS[k]) };
