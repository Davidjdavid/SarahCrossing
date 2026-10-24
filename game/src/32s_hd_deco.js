/* ---- 32s_hd_deco.js ---- */
/* HD outdoor decorations and street furniture for the HD-2D view: the benches, street lamps, notice board, planters,
   fences (the pieces still join up tile to tile), Waffle's island displays, the signs and the rest, each today's sprite
   at three times the detail (same frame, anchor, outline and colors) with the form, light and material the extra pixels
   allow: wood grain, stone, leaves, metal with a glint, glass. Things stand on the ground (row ay + 2) and cast their
   own shadows in 3D, so none of them draws one. */

/* ---------------------------------------------------------------- helpers */
/* a small seeded hash in 0..1 (texture scatter that never changes) */
function hdD_h(x, y, k) { let n = (x * 374761393 + y * 668265263 + (k || 0) * 1442695041) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }
/* smooth value noise (grain, mottling) */
function hdD_vn(x, y, k) {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hdD_h(ix, iy, k), b = hdD_h(ix + 1, iy, k), c = hdD_h(ix, iy + 1, k), d = hdD_h(ix + 1, iy + 1, k);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
/* every pixel of a part, in the sprite's own coordinates (x, y) with its index i (texture passes write s.mods[i]) */
function hdD_each(s, id, fn) { const W = s.w; for (let y = 0; y < s.h; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (s.part[i] === id) fn(x - s.dx, y - s.dy, i); } }
/* a rounded rectangle */
function hdD_rr(s, id, x, y, w, h, r) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const cx = i < r ? r - i - 0.5 : i >= w - r ? i - (w - r) + 0.5 : 0, cy = j < r ? r - j - 0.5 : j >= h - r ? j - (h - r) + 0.5 : 0;
        if (cx * cx + cy * cy <= r * r + 0.5) s.plot(id, x + i, y + j);
    }
}
/* wood grain along a plank (vertical for posts): darker streaks that run with the grain, a few lighter ones, knots */
function hdD_wood(s, id, seed, vert, amt) {
    amt = amt == null ? 1 : amt;
    hdD_each(s, id, (x, y, i) => {
        const a = vert ? y : x, b = vert ? x : y, g = hdD_vn(a * 0.08 + b * 0.03, b * 0.8, seed);
        if (g < 0.24 * amt) s.mods[i] -= 1; else if (g > 1 - 0.07 * amt) s.mods[i] += 1;
        if (hdD_h(a >> 2, b >> 1, seed + 3) > 0.99) s.mods[i] -= 1;
    });
}
/* leaves: small clusters (a jittered cell pattern), each lit on its upper left with a dark gap between them */
function hdD_leafy(s, id, cell, seed, lit) {
    lit = lit == null ? 1 : lit;
    hdD_each(s, id, (x, y, i) => {
        const gx = x / cell, gy = y / (cell * 0.8), ix = Math.floor(gx), iy = Math.floor(gy);
        let d1 = 9, d2 = 9, fx = 0, fy = 0;
        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
            const qx = ix + a, qy = iy + b, px = qx + 0.15 + hdD_h(qx, qy, seed) * 0.7, py = qy + 0.15 + hdD_h(qx, qy, seed + 1) * 0.7, d = Math.hypot(gx - px, gy - py);
            if (d < d1) { d2 = d1; d1 = d; fx = gx - px; fy = gy - py; } else if (d < d2) d2 = d;
        }
        const v = -(fx + fy) * 0.9 * lit - (d2 - d1 < 0.13 ? 0.5 : 0);
        if (v > 0.32) s.mods[i] += 1; else if (v < -0.3) s.mods[i] -= 1;
    });
}
/* stone: a few pits and lighter flecks */
function hdD_stone(s, id, seed, n) {
    n = n == null ? 0.05 : n;
    hdD_each(s, id, (x, y, i) => { const r = hdD_h(x, y, seed); if (r < n) s.mods[i] -= 1; else if (r > 1 - n * 0.6) s.mods[i] += 1; });
}
/* parts drawn in a sprite of their own and laid over this one as finished pixels (flowers on soil, a pin on paper):
   what's under them keeps its whole form */
function hdD_over(s, fn) {
    const o = new HDSprite(s.w, s.h); fn(o);
    const buf = o.render(), W = s.w;
    for (let i = 0; i < W * s.h; i++) if (buf[i * 4 + 3]) s.px(i % W - s.dx, ((i / W) | 0) - s.dy, [buf[i * 4], buf[i * 4 + 1], buf[i * 4 + 2]]);
}
/* a piece that joins its neighbors (fences): drawn in a bigger sprite (px more on each side, py above) and cut to the
   frame, so rails running off the sides get no outline where one tile meets the next and shade the same on both */
function hdD_win(s, px, py, fn) {
    const o = new HDSprite(s.w + px * 2, s.h + py); o.dx = px; o.dy = py; fn(o);
    const buf = o.render(), W = o.w;
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) { const j = ((y + py) * W + x + px) * 4; if (buf[j + 3]) s.px(x, y, [buf[j], buf[j + 1], buf[j + 2]]); }
}
/* a colour ramp that is one exact colour (lettering, glints) */
function hdD_one(c) { const r = hdRgb(c); return [r, r, r, r, r]; }

/* ---------------------------------------------------------------- the park bench (and the island's benches) */
HD_SPR.bench = { w: 96, h: 60, ax: 48, ay: 51, draw(s) {
    const IRON = hdRamp('#4a4450'), iron = s.add(IRON, { layer: 0, R: 3, k: 1.6 }), ironF = s.add(IRON, { layer: 3, R: 3, k: 1.6 });
    /* the iron frame at each end: the back upright behind the slats, the front leg with a foot */
    for (const x of [12, 78]) { s.rect(iron, x, 8, 6, 30); s.rect(ironF, x - 1, 40, 8, 12); s.rect(ironF, x - 3, 50, 12, 3); }
    /* the backrest: two slats, the gap between them see-through */
    for (const [y, seed] of [[9, 5], [17, 6]]) { const p = s.add(hdRamp('#b07a4a'), { layer: 1, R: 2, cast: 2, bias: -0.03 }); hdD_rr(s, p, 4, y, 88, 7, 2); hdD_wood(s, p, seed, false, 0.8); }
    /* behind the seat, in the backrest's shade */
    const dark = s.add(hdRamp('#6a4430'), { layer: 0, R: 1, flat: 1, bias: -0.12 }); s.rect(dark, 6, 24, 84, 5);
    /* the seat: its top seen from above (lit), then the front edge of the plank (the lighter wood) */
    const top = s.add(hdRamp('#b98250'), { layer: 1, R: 1, bias: 0.06, grad: 0 }); hdD_rr(s, top, 4, 28, 88, 5, 2); hdD_wood(s, top, 8, false, 0.7);
    const seat = s.add(hdRamp('#c98a55'), { layer: 2, R: 2, bias: -0.06 }); hdD_rr(s, seat, 3, 33, 90, 8, 2); hdD_wood(s, seat, 11, false, 0.8);
    /* the underside in shadow between the legs */
    const under = s.add(hdRamp('#8a5a33'), { layer: 1, R: 1, flat: 1, bias: -0.25 }); s.rect(under, 6, 41, 84, 2);
    /* bolt heads where the slats meet the frame */
    for (const x of [14, 80]) for (const y of [12, 20, 36]) { s.px(x, y, '#3a3040'); s.px(x + 1, y, '#7a6656'); }
} };

/* ---------------------------------------------------------------- the street lamp */
HD_SPR.lamp = { w: 36, h: 96, ax: 18, ay: 90, draw(s) {
    const IRON = hdRamp('#3f3a4a');
    /* the base, the post (a collar under the head) */
    const base = s.add(IRON, { layer: 1, R: 3, k: 1.5 }); hdD_rr(s, base, 10, 84, 16, 8, 2); s.rect(base, 12, 81, 12, 4);
    const post = s.add(IRON, { layer: 0, R: 4, k: 1.8 }); s.rect(post, 13, 28, 10, 55);
    const ring = s.add(IRON, { layer: 1, R: 2, k: 1.5 }); hdD_rr(s, ring, 11, 31, 14, 4, 1);
    /* the head: a rounded hood, one big pane of warm glass, a taper down to the post */
    const head = s.add(IRON, { layer: 2, R: 5, k: 1.3 }); hdD_rr(s, head, 3, 0, 30, 26, 7); s.rect(head, 3, 12, 30, 14);
    const bot = s.add(IRON, { layer: 2, R: 3, k: 1.4 }); s.poly(bot, [[5, 25], [31, 25], [24, 31], [12, 31]]);
    const glass = s.add(hdPal('#c9a95a', '#f2d888', '#fff2b0', '#fff8d2', '#fffdf0'), { layer: 3, R: 5, k: 0.8, bias: 0.06 });
    hdD_rr(s, glass, 8, 8, 20, 15, 2);
    /* the frame bars across the glass, glints at its top left */
    for (let y = 8; y < 23; y++) s.recolor(17, y, IRON), s.recolor(18, y, IRON);
    for (const [x, y] of [[10, 10], [11, 10], [10, 11], [20, 10], [21, 10], [20, 11]]) s.px(x, y, '#ffffff');
} };
