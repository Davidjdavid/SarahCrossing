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
function hdD_leafy(s, id, cell, seed, lit, gap) {
    lit = lit == null ? 1 : lit; gap = gap == null ? 0.1 : gap;
    hdD_each(s, id, (x, y, i) => {
        const gx = x / cell, gy = y / (cell * 0.8), ix = Math.floor(gx), iy = Math.floor(gy);
        let d1 = 9, d2 = 9, fx = 0, fy = 0;
        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
            const qx = ix + a, qy = iy + b, px = qx + 0.15 + hdD_h(qx, qy, seed) * 0.7, py = qy + 0.15 + hdD_h(qx, qy, seed + 1) * 0.7, d = Math.hypot(gx - px, gy - py);
            if (d < d1) { d2 = d1; d1 = d; fx = gx - px; fy = gy - py; } else if (d < d2) d2 = d;
        }
        const v = -(fx + fy) * 0.9 * lit - (d2 - d1 < gap ? 0.5 : 0);
        if (v > 0.32) s.mods[i] += 1; else if (v < -0.3) s.mods[i] -= 1;
    });
}
/* stone: a few pits (in little clusters, not single-pixel noise) and fewer lighter flecks */
function hdD_stone(s, id, seed, n) {
    n = n == null ? 0.05 : n;
    hdD_each(s, id, (x, y, i) => { const r = hdD_h(x >> 1, y >> 1, seed), q = hdD_h(x, y, seed + 1); if (r < n * 0.6 && q < 0.7) s.mods[i] -= 1; else if (r > 1 - n * 0.2 && q < 0.5) s.mods[i] += 1; });
}
/* parts drawn in a sprite of their own and laid over this one as finished pixels (flowers on soil, a pin on paper):
   what's under them keeps its whole form */
function hdD_over(s, fn) {
    const o = new HDSprite(s.w, s.h); fn(o);
    const buf = o.render(), W = s.w;
    for (let i = 0; i < W * s.h; i++) if (buf[i * 4 + 3]) s.px(i % W - s.dx, ((i / W) | 0) - s.dy, [buf[i * 4], buf[i * 4 + 1], buf[i * 4 + 2]]);
}
/* a piece that joins its neighbors (fences): drawn in a bigger sprite (px more on each side, py above) and cut to the
   frame, so rails running off the sides get no outline where one tile meets the next and shade the same on both. Each
   function is a pass of its own laid over the ones before (rails keep their whole form behind the pickets), and a
   pass's pixels shade the ones just to their right and below in the passes under them (light from the top left). */
function hdD_win(s, px, py, ...fns) {
    const W = s.w + px * 2, H = s.h + py, out = new Uint8ClampedArray(W * H * 4);
    for (const fn of fns) {
        const o = new HDSprite(W, H); o.dx = px; o.dy = py; fn(o);
        const buf = o.render();
        if (fn !== fns[0]) for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
            const j = (y * W + x) * 4; if (!out[j + 3] || buf[j + 3]) continue;
            if ((x > 0 && buf[j - 1]) || (x > 1 && buf[j - 5] && y > 0 && buf[j - W * 4 - 5]) || (y > 0 && buf[j - W * 4 + 3] && x > 0 && buf[j - W * 4 - 1])) for (let c = 0; c < 3; c++) out[j + c] = out[j + c] * 0.8;
        }
        for (let i = 0; i < W * H; i++) if (buf[i * 4 + 3]) for (let c = 0; c < 4; c++) out[i * 4 + c] = buf[i * 4 + c];
    }
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) { const j = ((y + py) * W + x + px) * 4; if (out[j + 3]) s.px(x, y, [out[j], out[j + 1], out[j + 2]]); }
}

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
    for (let y = 8; y < 23; y++) { s.recolor(17, y, IRON); s.recolor(18, y, IRON); }
    for (const [x, y] of [[10, 10], [11, 10], [10, 11], [20, 10], [21, 10], [20, 11]]) s.px(x, y, '#ffffff');
} };

/* ---------------------------------------------------------------- the notice board */
/* a scribble of handwriting: short strokes with gaps between the words */
function hdD_write(s, x, y, w, c, seed) {
    for (let i = 0; i < w; i++) { const h = hdD_h(x + i, y, seed); if ((i + 1) % 7 === 0 || (h < 0.12 && i > 1 && i < w - 2)) continue; s.px(x + i, y, c); if (h > 0.8) s.px(x + i, y - 1, c); }
}
HD_SPR.board = { w: 72, h: 78, ax: 36, ay: 72, draw(s) {
    /* two posts behind the board */
    for (const x of [11, 53]) { const p = s.add(hdRamp('#7a5234'), { layer: 0, R: 3, k: 1.5 }); s.rect(p, x, 40, 8, 35); hdD_wood(s, p, x, true, 0.7); }
    /* the frame, and the cork set back inside it */
    const frame = s.add(hdRamp('#9a6b45'), { layer: 2, R: 3, cast: 2, k: 1.4 }); hdD_rr(s, frame, 0, 0, 72, 46, 3); hdD_wood(s, frame, 21, false, 0.6);
    const cork = s.add(hdRamp('#d9b98c'), { layer: 1, R: 2, flat: 1, grad: 0.1 }); s.rect(cork, 7, 7, 58, 32);
    hdD_each(s, cork, (x, y, i) => { const r = hdD_h(x, y, 31); if (r < 0.1) s.mods[i] -= 1; else if (r > 0.97) s.mods[i] += 1; });
    /* the notes: a white one with a red pin, a yellow one with a blue pin, both with a few lines on them */
    const white = s.add(hdRamp('#f4f1ea'), { layer: 3, R: 2, cast: 2, flat: 1, bias: 0.1, grad: 0.15 }); s.poly(white, [[14, 11], [32, 12], [31, 28], [13, 27]]);
    const yellow = s.add(hdRamp('#ffe28a'), { layer: 3, R: 2, cast: 2, flat: 1, bias: 0.05, grad: 0.15 }); s.rect(yellow, 36, 15, 21, 18);
    for (const y of [17, 20, 23]) hdD_write(s, 16, y, 13 - (y === 23 ? 5 : 0), '#8a8a9a', y);
    for (const y of [20, 23, 26, 29]) hdD_write(s, 39, y, 15 - (y === 29 ? 6 : 0), '#b08a3a', y + 5);
    hdD_over(s, o => {
        const red = o.add(hdRamp('#e0405a'), { R: 2, k: 1.6 }); o.ellipse(red, 23, 13, 2.6, 2.6);
        const blue = o.add(hdRamp('#4ea8f0'), { R: 2, k: 1.6 }); o.ellipse(blue, 46.5, 16.5, 2.6, 2.6);
    });
    s.px(22, 12, '#ffd0d8'); s.px(45, 15, '#d8f0ff');
} };

/* ---------------------------------------------------------------- the flower planter */
/* one little bloom: five petals round a center, lit from the top left */
function hdD_bloom(o, x, y, col, eye) {
    const p = o.add(hdRamp(col), { R: 2, k: 1.2, layer: 2 });
    o.ellipse(p, x, y, 2.6, 2.4); o.plot(p, Math.round(x) - 3, Math.round(y) - 1); o.plot(p, Math.round(x) + 2, Math.round(y) - 1);
    o.px(x - 0.5, y - 0.5, eye || '#f0c040');
}
/* a stem with a leaf or two */
function hdD_stem(o, id, x, y0, y1, seed) {
    for (let y = y0; y <= y1; y++) o.plot(id, x, y);
    const d = hdD_h(x, y0, seed) < 0.5 ? -1 : 1, ly = Math.round((y0 + y1) / 2) + 1;
    o.plot(id, x + d, ly); o.plot(id, x + d * 2, ly - 1); o.plot(id, x + d, ly - 1);
}
HD_SPR.flowerbed = { w: 96, h: 48, ax: 48, ay: 42, draw(s) {
    /* the wooden box: the rim all round, its front face, the soil inside */
    const rim = s.add(hdRamp('#9a6b45'), { layer: 1, R: 3, k: 1.3, bias: 0.04 }); hdD_rr(s, rim, 0, 6, 96, 36, 7);
    const front = s.add(hdRamp('#8a5c3a'), { layer: 2, R: 2, k: 1.2 }); hdD_rr(s, front, 1, 34, 94, 13, 5); s.rect(front, 1, 34, 94, 4);
    hdD_wood(s, rim, 41, false, 0.7); hdD_wood(s, front, 42, false, 0.8);
    const soil = s.add(hdRamp('#7a5234'), { layer: 0, R: 3, k: 1.1, bias: -0.06 }); hdD_rr(s, soil, 8, 12, 80, 23, 4);
    hdD_each(s, soil, (x, y, i) => { const r = hdD_h(x >> 1, y, 51); if (r < 0.18) s.mods[i] -= 1; else if (r > 0.86) s.mods[i] += 1; });
    /* planks on the front face */
    for (const x of [24, 48, 72]) for (let y = 36; y < 46; y++) s.mod(x, y, -1);
    /* the plants: leafy tufts, stems, and blooms in today's colors where today's are */
    hdD_over(s, o => {
        const leaf = o.add(hdRamp('#4f9a3f'), { R: 2, k: 1.3, layer: 1 }), stem = o.add(hdRamp('#4f9a3f'), { R: 1, layer: 1 });
        for (const [x, y, rx] of [[14, 31, 5], [22, 26, 4], [38, 30, 6], [52, 25, 4], [66, 30, 5], [80, 27, 4], [30, 21, 3], [61, 20, 3], [44, 19, 3], [74, 33, 4]]) o.ellipse(leaf, x, y, rx, rx * 0.65);
        hdD_leafy(o, leaf, 3, 61);
        const B = [[25, 12, '#ff9ec0', 7], [40, 12, '#ffffff', 6], [36, 16, '#ffd84a', 8], [61, 16, '#ff6a7a', 9], [22, 19, '#ffd84a', 6], [33, 20, '#ffffff', 6],
            [46, 20, '#ffd84a', 7], [13, 22, '#b37cf0', 7], [52, 22, '#ffd84a', 6], [82, 22, '#ff6a7a', 8], [43, 28, '#ff6a7a', 5], [67, 28, '#ffffff', 6],
            [13, 31, '#ffffff', 4], [20, 31, '#b37cf0', 4], [40, 31, '#ff9ec0', 4], [75, 15, '#ffffff', 5]];
        for (const [x, y, , h] of B) hdD_stem(o, stem, x, y + 2, y + h, x);
        for (const [x, y, c] of B) hdD_bloom(o, x, y, c, c === '#ffd84a' ? '#c07020' : '#f0c040');
    });
} };

/* ---------------------------------------------------------------- fences */
/* the island's picket fence comes in pieces that join: l (a post, rails off to the right), m (pickets, rails both
   ways), r (rails from the left to a post), n (a post on its own); the 1 frames have a fence tile behind them (above),
   and a strip runs up to meet it. Pickets sit every 16 pixels (8, 24, 40), the posts in the middle; the rails run off
   the sides (drawn wider and cut, so they meet the next tile's without a seam). */
const hdD_FENCEW = hdPal('#4c3c36', '#baa680', '#e6d6b8', '#f2e8d2', '#fbf6ea');
const hdD_PICKET = hdPal('#4c3c36', '#cbbb9a', '#f3eadb', '#fbf6ec', '#ffffff');
function hdD_fence(s, kind, up) {
    /* the rails (behind the pickets) */
    const rails = o => {
        const x0 = kind === 'l' ? 24 : -10, x1 = kind === 'r' ? 24 : 58;
        if (kind !== 'n') for (const y of [17, 29]) { const r = o.add(hdD_FENCEW, { layer: 1, R: 3, k: 1.3, grad: 0.6, bias: -0.05 }); o.rect(r, x0, y, x1 - x0, 9); hdD_wood(o, r, y, false, 0.5); }
    };
    /* a picket: a pointed top (or running on up to the tile behind) */
    const picket = (o, cx, tall) => {
        const p = o.add(hdD_PICKET, { layer: 2, R: 3, k: 1.5, grad: 0.12 });
        if (tall) o.rect(p, cx - 4, -8, 9, 54);
        else { o.rect(p, cx - 4, 8, 9, 38); o.poly(p, [[cx - 4.5, 9], [cx + 0.5, 3], [cx + 5.5, 9]]); }
        hdD_wood(o, p, cx * 7, true, 0.25);
    };
    /* the post: a pointed cap over a band; with a fence behind it, a strip runs on up instead and the post is lower */
    const post = o => {
        const top = !up ? 0 : kind === 'n' ? 16 : 6;
        if (up) { const c = o.add(hdD_FENCEW, { layer: 1, R: 4, k: 1.6, grad: 0 }); o.rect(c, 19, -8, 10, top + 12); hdD_wood(o, c, 77, true, 0.4); }
        const p = o.add(hdD_PICKET, { layer: 3, R: 4, k: 1.7, grad: 0.1 });
        if (up) hdD_rr(o, p, 16, top, 16, 47 - top, 2); else { o.rect(p, 16, 7, 16, 40); o.poly(p, [[15.5, 8], [24, 0], [32.5, 8]]); }
        hdD_wood(o, p, 91, true, 0.25);
        const band = o.add(hdD_FENCEW, { layer: 4, R: 2, k: 1.4, grad: 0 }); o.rect(band, 16, top + (up ? 6 : 11), 16, 3);
    };
    hdD_win(s, 10, 8, rails, o => {
        if (kind === 'm') { picket(o, 8); picket(o, 24, up); picket(o, 40); }
        if (kind === 'l') { post(o); picket(o, 40); }
        if (kind === 'r') { picket(o, 8); post(o); }
        if (kind === 'n') post(o);
    });
}
for (const k of ['l', 'm', 'n', 'r']) for (const u of [0, 1]) HD_SPR['fence_' + k + u] = { w: 48, h: 48, ax: 24, ay: 42, draw: s => hdD_fence(s, k, u) };
/* the plain fence: two posts and two rails (the right post runs off the side, as today) */
HD_SPR.fence = { w: 48, h: 48, ax: 24, ay: 42, draw(s) {
    const W = hdPal('#4c3c36', '#cdbb98', '#e9d8b8', '#f5ecd8', '#fffbf2');
    hdD_win(s, 8, 0, o => {
        for (const y of [13, 28]) { const r = o.add(W, { layer: 1, R: 3, k: 1.3, grad: 0.6 }); o.rect(r, 6, y, 36, 9); hdD_wood(o, r, y, false, 0.5); }
    }, o => {
        for (const x of [0, 37]) {
            const p = o.add(hdPal('#4c3c36', '#d8c8a8', '#f7ecd6', '#fcf6e8', '#ffffff'), { layer: 2, R: 4, k: 1.6, grad: 0.12 });
            o.rect(p, x, 7, 12, 37); o.poly(p, [[x - 0.5, 8], [x + 6, 1], [x + 12.5, 8]]); hdD_wood(o, p, x + 5, true, 0.35);
        }
    });
} };
/* the picket fence from Waffle's: three round-topped pickets, two rails across the front (they meet the next one's) */
HD_SPR.d_fence = { w: 48, h: 60, ax: 24, ay: 54, draw(s) {
    hdD_win(s, 8, 0, o => {
        for (const x of [1, 17, 33]) {
            const p = o.add(hdPal('#4a4248', '#d8d0c0', '#fbf6ee', '#fdfaf4', '#ffffff'), { layer: 1, R: 3, k: 1.5, grad: 0.15 });
            o.rect(p, x, 16, 14, 39); o.ellipse(p, x + 7, 16, 7, 6.5); hdD_wood(o, p, x, true, 0.3);
        }
    }, o => {
        for (const y of [27, 42]) { const r = o.add(hdPal('#4a4248', '#c8c0b0', '#e8e2d4', '#f4f0e6', '#fcfaf4'), { layer: 2, R: 2, k: 1.3, grad: 0.4 }); o.rect(r, -8, y, 64, 6); }
    });
} };

/* ---------------------------------------------------------------- Waffle's displays */
const hdD_STONE = hdRamp('#b8b4c4'), hdD_STONEL = hdRamp('#c8c4d4');
const hdD_WATER = hdPal('#3d7cae', '#6fb8e0', '#8fd0f0', '#b4e2f6', '#e6f8ff');
const hdD_LEAF = hdPal('#1f4a2a', '#2f7038', '#3f8a45', '#4fa655', '#6cc063');
/* a leafy mass: an ellipse with clumps round its top and sides (not the bottom), leaf clusters on it */
function hdD_bush(s, id, cx, cy, rx, ry, seed, n) {
    s.ellipse(id, cx, cy, rx, ry);
    n = n || 10;
    for (let i = 0; i < n; i++) {
        const a = (i + hdD_h(i, 1, seed) * 0.6) / n * Math.PI * 2, sy = Math.sin(a);
        if (sy > 0.55) continue;
        const r = Math.min(rx, ry) * (0.24 + hdD_h(i, 2, seed) * 0.12);
        s.ellipse(id, cx + Math.cos(a) * (rx - r * 0.7), cy + sy * (ry - r * 0.7), r, r);
    }
}
/* water: a few ripple glints */
function hdD_ripples(s, id, seed, n) {
    hdD_each(s, id, (x, y, i) => { const r = hdD_h(x >> 2, y, seed); if (r > 1 - n && hdD_h(x, y, seed + 1) > 0.3) s.mods[i] += 1; });
}

/* the bird bath: a basin of water on a turned stone stem */
HD_SPR.d_birdbath = { w: 48, h: 66, ax: 24, ay: 60, draw(s) {
    const base = s.add(hdD_STONE, { layer: 1, R: 3, k: 1.4 }); hdD_rr(s, base, 12, 54, 24, 8, 2); hdD_rr(s, base, 15, 49, 18, 6, 2);
    const stem = s.add(hdD_STONE, { layer: 0, R: 5, k: 1.8 }); s.poly(stem, [[18, 32], [30, 32], [28, 40], [30, 50], [18, 50], [20, 40]]);
    const bowl = s.add(hdD_STONEL, { layer: 2, R: 5, k: 1.4 }); s.ellipse(bowl, 24, 22, 23.5, 8); s.poly(bowl, [[2, 23], [46, 23], [33, 33], [15, 33]]);
    const water = s.add(hdD_WATER, { layer: 1, R: 3, k: 0.8, grad: 0.3 }); s.ellipse(water, 24, 21, 17, 4.6);
    hdD_ripples(s, water, 5, 0.12); hdD_stone(s, bowl, 6, 0.04); hdD_stone(s, base, 7, 0.05); hdD_stone(s, stem, 8, 0.04);
    for (const [x, y] of [[16, 19], [17, 19], [18, 19], [17, 20], [29, 21], [30, 21]]) s.px(x, y, '#ffffff');
} };

/* the island flag: a gold ball on a metal pole, white over blue with the little sun, a stone foot */
HD_SPR.d_flag = { w: 66, h: 120, ax: 15, ay: 111, draw(s) {
    const foot = s.add(hdRamp('#8a8ea8'), { layer: 2, R: 3, k: 1.4 }); hdD_rr(s, foot, 6, 101, 20, 12, 2); hdD_rr(s, foot, 10, 97, 12, 6, 1);
    const pole = s.add(hdPal('#4a4c5c', '#a8a8b8', '#d8d8e0', '#ececf2', '#ffffff'), { layer: 1, R: 3, k: 2 }); s.rect(pole, 13, 8, 7, 92);
    const ball = s.add(hdPal('#8a5a10', '#d9a62e', '#ffd84a', '#ffe88a', '#fff8d0'), { layer: 2, R: 4, k: 1.6 }); s.ellipse(ball, 16.5, 5, 5, 5);
    /* the cloth, rippling: each column sits a little higher or lower, lighter where it bulges toward the light */
    const wave = x => Math.sin((x - 21) * 0.28) * 1.4 * Math.min(1, (x - 20) / 14);
    const white = s.add(hdPal('#6a7088', '#d4dae6', '#f4f6fa', '#fbfcfe', '#ffffff'), { layer: 0, R: 2, k: 1.1, grad: 0 });
    const blue = s.add(hdRamp('#4ec3d9'), { layer: 0, R: 2, k: 1.1, grad: 0.2 });
    for (let x = 20; x <= 62; x++) { const d = Math.round(wave(x)); for (let y = 10; y <= 39; y++) s.plot(y + d < 21 ? white : blue, x, y + d); }
    for (let x = 20; x <= 62; x++) { const sl = Math.cos((x - 21) * 0.28), d = Math.round(wave(x)); for (let y = 10; y <= 39; y++) s.mod(x, y + d, sl > 0.75 ? 1 : sl < -0.75 ? -1 : 0); }
    /* the sun, and a wave line along the bottom */
    hdD_over(s, o => {
        const sun = o.add(hdPal('#a8781a', '#e8b030', '#ffd84a', '#ffe680', '#fff4c0'), { R: 3, k: 1.2 });
        const cx = 40, cy = 28 + Math.round(wave(40)); o.ellipse(sun, cx, cy, 4.6, 4.6);
        for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + 0.39; o.line(sun, cx + Math.cos(a) * 6, cy + Math.sin(a) * 6, cx + Math.cos(a) * 7.6, cy + Math.sin(a) * 7.6, 1); }
    });
    for (let x = 23; x <= 60; x++) s.px(x, 36 + Math.round(wave(x)) - (Math.floor((x - 23) / 3) % 2), '#2c8aa8');
} };

/* the lawn flamingo: plastic pink, an S of a neck, a dark beak, thin dark legs */
HD_SPR.d_flamingo = { w: 42, h: 78, ax: 21, ay: 72, draw(s) {
    const PINK = hdPal('#9a3466', '#e86aa6', '#ff8ac2', '#ffa8d2', '#ffcce6');
    const legs = s.add(hdRamp('#2a1e2a'), { layer: 0, R: 1 });
    s.line(legs, 19, 47, 19.5, 58, 1.3); s.line(legs, 19.5, 58, 19, 70, 1.1); s.line(legs, 25, 47, 24.5, 58, 1.3); s.line(legs, 24.5, 58, 25, 70, 1.1);
    s.ellipse(legs, 19.5, 58, 1.8, 1.6); s.ellipse(legs, 24.5, 58, 1.8, 1.6); s.rect(legs, 16, 71, 5, 2); s.rect(legs, 24, 71, 5, 2);
    const body = s.add(PINK, { layer: 1, R: 7, k: 1.5 }); s.ellipse(body, 21, 39, 15, 8.6); s.poly(body, [[30, 33], [37, 30], [36, 38]]);
    const neck = s.add(PINK, { layer: 2, R: 3, k: 1.5 });
    s.line(neck, 26, 31, 26, 25, 3); s.line(neck, 26, 25, 29, 19, 3); s.line(neck, 29, 19, 31, 14, 2.8);
    const head = s.add(PINK, { layer: 3, R: 4, k: 1.4 }); s.ellipse(head, 28, 8, 6, 5.2);
    const wing = s.add(hdRamp('#ffb3d9'), { layer: 2, R: 3, k: 1.3, cast: 1 }); s.poly(wing, [[8, 36], [14, 32], [24, 34], [27, 39], [18, 42], [10, 41]]);
    for (let x = 12; x < 25; x += 4) for (let y = 37; y < 41; y++) s.mod(x + (y - 37), y, -1);
    const beak = s.add(hdPal('#1a1218', '#2a1e2a', '#3a2c38', '#5a4a58', '#7a6a78'), { layer: 4, R: 2 });
    s.poly(beak, [[32, 6], [38, 8], [40, 13], [38, 16], [36, 12], [32, 11]]);
    const tip = s.add(hdRamp('#f4dce8'), { layer: 5, R: 2 }); s.poly(tip, [[32, 6], [35, 7], [35, 11], [32, 11]]);
    s.px(27, 6, '#2a1e2a'); s.px(28, 6, '#2a1e2a'); s.px(27, 7, '#2a1e2a'); s.px(28, 7, '#4a3a48'); s.px(27, 5, '#ffffff');
} };

/* the fountain: a round stone basin, a column, a bowl and a spout (the game adds the drops) */
HD_SPR.d_fountain = { w: 96, h: 102, ax: 48, ay: 93, draw(s) {
    const wall = s.add(hdD_STONE, { layer: 1, R: 4, k: 1.3 }); s.ellipse(wall, 48, 78, 47.5, 15); s.rect(wall, 1, 70, 94, 9);
    const rim = s.add(hdD_STONEL, { layer: 2, R: 4, k: 1.3, bias: 0.04 }); s.ellipse(rim, 48, 70, 47.5, 15);
    const water = s.add(hdD_WATER, { layer: 1, R: 5, k: 0.7, grad: 0.35 }); s.ellipse(water, 48, 69, 41, 10.5);
    hdD_ripples(s, water, 11, 0.1);
    /* blocks in the basin wall, pits in the stone */
    for (const x of [14, 32, 48, 64, 82]) for (let y = 80; y < 93; y++) s.mod(x + Math.round((x - 48) * (y - 80) / 140), y, -1);
    hdD_stone(s, wall, 12, 0.05); hdD_stone(s, rim, 13, 0.04);
    hdD_over(s, o => {
        const col = o.add(hdD_STONE, { layer: 1, R: 5, k: 1.7 }); o.rect(col, 41, 40, 13, 32); hdD_rr(o, col, 38, 66, 19, 8, 3);
        const bowl = o.add(hdD_STONEL, { layer: 2, R: 4, k: 1.4 }); o.ellipse(bowl, 48, 33, 20, 6); o.poly(bowl, [[29, 34], [67, 34], [56, 43], [40, 43]]);
        const w2 = o.add(hdD_WATER, { layer: 3, R: 3, k: 0.8, grad: 0.3 }); o.ellipse(w2, 48, 32.5, 15, 3.6);
        const spout = o.add(hdD_STONE, { layer: 4, R: 4, k: 1.7 }); o.rect(spout, 43, 15, 10, 16); o.ellipse(spout, 48, 15, 5, 3.5); hdD_rr(o, spout, 41, 27, 14, 5, 2);
        hdD_stone(o, col, 14, 0.05); hdD_stone(o, bowl, 15, 0.04);
        for (const [x, y] of [[38, 31], [39, 31], [40, 31], [55, 33], [56, 33]]) o.px(x, y, '#ffffff');
        /* water spilling from the bowl's lip */
        for (const x of [31, 64]) for (let y = 35; y < 50; y++) if (hdD_h(x, y >> 1, 3) > 0.25) o.px(x + (x < 48 ? -1 : 1) * Math.round((y - 35) * 0.15), y, y % 3 ? '#b4e2f6' : '#e6f8ff');
    });
    for (const [x, y] of [[22, 64], [23, 64], [24, 64], [23, 65], [70, 72], [71, 72], [60, 63], [61, 63]]) s.px(x, y, '#ffffff');
} };

/* the frog statue: a green frog with big eye bumps and a smile, on a stone slab */
HD_SPR.d_frog = { w: 48, h: 48, ax: 24, ay: 42, draw(s) {
    const slab = s.add(hdRamp('#a8a4b4'), { layer: 0, R: 3, k: 1.3 }); hdD_rr(s, slab, 5, 33, 38, 11, 3); hdD_stone(s, slab, 21, 0.06);
    const G = hdPal('#1f4a26', '#4f9a4a', '#6cc063', '#86d27a', '#a8e496');
    const body = s.add(G, { layer: 1, R: 10, k: 1.4 }); s.ellipse(body, 24, 24, 18, 12.5); hdD_rr(s, body, 7, 20, 34, 15, 6);
    const eyeL = s.add(G, { layer: 2, R: 5, k: 1.4 }), eyeR = s.add(G, { layer: 2, R: 5, k: 1.4 });
    s.ellipse(eyeL, 14.5, 12, 6.5, 6); s.ellipse(eyeR, 33.5, 12, 6.5, 6);
    const belly = s.add(hdPal('#3f7a3a', '#86c870', '#9be083', '#aee896', '#c0f0aa'), { layer: 2, R: 3, k: 0.9, bias: -0.06, grad: 0.3 }); s.ellipse(belly, 24, 29.5, 12, 6);
    const feetL = s.add(G, { layer: 3, R: 2, k: 1.3 }), feetR = s.add(G, { layer: 3, R: 2, k: 1.3 });
    s.ellipse(feetL, 11, 35, 5, 2.8); s.ellipse(feetR, 37, 35, 5, 2.8);
    hdD_stone(s, body, 22, 0.03);
    /* pupils with a glint, the smile, nostrils */
    for (const x of [13, 32]) { for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) if (!((j === 0 || j === 3) && (i === 0 || i === 3))) s.px(x + i, 11 + j, '#2a1e2a'); s.px(x + 1, 12, '#ffffff'); }
    for (let x = 15; x <= 33; x++) s.px(x, 27 + (x < 18 || x > 30 ? 0 : 1), '#3f8a45');
    s.px(22, 21, '#3f8a45'); s.px(26, 21, '#3f8a45');
    for (const x of [9, 12, 15, 33, 36, 39]) s.px(x, 37, '#3f8a45');
} };

/* the garden gnome: a tall red hat, a white beard, a rosy nose, a blue coat, brown boots */
HD_SPR.d_gnome = { w: 42, h: 66, ax: 21, ay: 60, draw(s) {
    const boots = s.add(hdRamp('#6b4a2a'), { layer: 0, R: 3, k: 1.4 }); hdD_rr(s, boots, 9, 54, 10, 8, 3); hdD_rr(s, boots, 23, 54, 10, 8, 3);
    const coat = s.add(hdRamp('#4f86c6'), { layer: 1, R: 5, k: 1.4 }); hdD_rr(s, coat, 10, 38, 22, 18, 5);
    const belt = s.add(hdRamp('#3a2a20'), { layer: 2, R: 1, k: 1 }); s.rect(belt, 10, 49, 22, 3);
    s.px(20, 50, '#e8c050'); s.px(21, 50, '#ffd84a'); s.px(22, 50, '#e8c050');
    const hands = s.add(hdRamp('#f8d0b8'), { layer: 3, R: 2 }); s.ellipse(hands, 10, 46, 2.6, 2.6); s.ellipse(hands, 32, 46, 2.6, 2.6);
    const face = s.add(hdRamp('#f8d0b8'), { layer: 2, R: 4, k: 1.2 }); s.ellipse(face, 21, 30, 9, 5.5);
    const beard = s.add(hdPal('#8a8a96', '#d6d6de', '#f2f2f2', '#fafafa', '#ffffff'), { layer: 3, R: 5, k: 1.3 });
    s.poly(beard, [[10, 30], [32, 30], [31, 39], [26, 46], [21, 49], [16, 46], [11, 39]]); s.ellipse(beard, 12, 29, 3, 3.5); s.ellipse(beard, 30, 29, 3, 3.5);
    for (const [x, y] of [[16, 36], [19, 39], [24, 37], [21, 43], [26, 42], [15, 41]]) { s.mod(x, y, -1); s.mod(x, y + 1, -1); }
    const hat = s.add(hdRamp('#e0405a'), { layer: 4, R: 6, k: 1.4, cast: 2 });
    s.poly(hat, [[23, 0], [26, 6], [31, 14], [36, 22], [39, 27], [3, 27], [8, 19], [13, 11], [18, 4]]);
    for (let y = 8; y < 26; y++) s.mod(26 + (y - 8) * 0.3, y, -1);
    const nose = s.add(hdRamp('#e8907a'), { layer: 5, R: 2, k: 1.3 }); s.ellipse(nose, 21, 32, 2.8, 2.4);
    s.px(16, 29, '#2a1e2a'); s.px(16, 30, '#2a1e2a'); s.px(25, 29, '#2a1e2a'); s.px(25, 30, '#2a1e2a'); s.px(20, 31, '#fff0e8');
} };

/* hedges: a clipped box (the top lit, the front in its own shade) or a round ball, all leaves */
function hdD_hedge(s, w, t) {
    const front = s.add(hdD_LEAF, { layer: 1, R: 5, k: 1.2, grad: 0.3, bias: -0.04 }); hdD_rr(s, front, 0, 24 + t, w, 32 - t, 5);
    const top = s.add(hdPal('#1f4a2a', '#3f8a45', '#4fa655', '#5ab85e', '#6cc063'), { layer: 2, R: 5, k: 1.1, cast: 2, bias: 0.1, grad: 0.1 }); hdD_rr(s, top, 1, 9 + t, w - 2, 20 - t / 2, 6);
    /* a few clumps standing proud of the clipped edge */
    for (let x = 6; x < w - 6; x += 9) {
        const r = 2 + hdD_h(x, 0, w) * 2; s.ellipse(top, x + hdD_h(x, 1, w) * 4, 10 + t, r, r * 0.8);
        s.ellipse(front, 1 + hdD_h(x, 2, w) * 0.5, 30 + (x % 20), 2, 2); s.ellipse(front, w - 2, 34 + (x % 16), 2, 2);
    }
    hdD_leafy(s, top, 5, w + 3, 1, 0.07); hdD_leafy(s, front, 5, w + 4, 0.8, 0.07);
}
HD_SPR.d_hedge = { w: 48, h: 60, ax: 24, ay: 54, draw: s => hdD_hedge(s, 48, 0) };
HD_SPR.d_hedge_long = { w: 96, h: 60, ax: 48, ay: 54, draw: s => hdD_hedge(s, 96, 3) };
HD_SPR.d_hedge_round = { w: 48, h: 60, ax: 24, ay: 54, draw(s) {
    const b = s.add(hdD_LEAF, { layer: 1, R: 16, k: 1.4, bias: 0.05 }); hdD_bush(s, b, 24, 32, 22.5, 21.5, 9, 12);
    hdD_leafy(s, b, 8, 17, 0.8);
} };

/* the stone lantern: a curved roof, a firebox with two lit windows, a ledge, a shaft, a base */
HD_SPR.d_lantern = { w: 48, h: 90, ax: 24, ay: 84, draw(s) {
    const base = s.add(hdRamp('#a8a4b4'), { layer: 1, R: 3, k: 1.4 }); hdD_rr(s, base, 9, 67, 30, 18, 3); hdD_rr(s, base, 12, 63, 24, 6, 2);
    const shaft = s.add(hdRamp('#a8a4b4'), { layer: 0, R: 5, k: 1.7 }); s.rect(shaft, 15, 44, 18, 20);
    const ledge = s.add(hdD_STONEL, { layer: 2, R: 3, k: 1.3, cast: 1 }); hdD_rr(s, ledge, 3, 36, 42, 9, 2);
    const box = s.add(hdRamp('#9a96a6'), { layer: 1, R: 3, k: 1.3 }); s.rect(box, 8, 17, 32, 20);
    const glow = s.add(hdPal('#c08a30', '#f0c860', '#ffe89a', '#fff2c4', '#fffbe8'), { layer: 2, R: 4, k: 0.7, bias: 0.05, grad: -0.3 });
    hdD_rr(s, glow, 13, 21, 9, 12, 1); hdD_rr(s, glow, 26, 21, 9, 12, 1);
    const roof = s.add(hdD_STONEL, { layer: 3, R: 5, k: 1.3, cast: 2 });
    s.poly(roof, [[19, 6], [29, 6], [38, 11], [46, 15], [46, 19], [2, 19], [2, 15], [10, 11]]);
    const knob = s.add(hdD_STONEL, { layer: 4, R: 2, k: 1.4 }); s.ellipse(knob, 24, 4, 3.2, 3); s.rect(knob, 22, 5, 5, 3);
    hdD_stone(s, base, 31, 0.05); hdD_stone(s, shaft, 32, 0.05); hdD_stone(s, roof, 33, 0.04); hdD_stone(s, ledge, 34, 0.04);
    for (const [x, y] of [[14, 22], [15, 22], [27, 22], [28, 22]]) s.px(x, y, '#ffffff');
} };

/* the beach lounger: a white frame, a striped cushion, the backrest raised */
HD_SPR.d_lounger = { w: 96, h: 54, ax: 48, ay: 48, draw(s) {
    const METAL = hdPal('#4a4c5c', '#8a8ea8', '#b8bccc', '#d8dae4', '#f2f4f8');
    const legs = s.add(METAL, { layer: 0, R: 1 }); s.rect(legs, 9, 37, 3, 12); s.rect(legs, 60, 37, 3, 12); s.rect(legs, 8, 47, 5, 2); s.rect(legs, 59, 47, 5, 2);
    const frame = s.add(METAL, { layer: 1, R: 2, k: 1.5 }); s.rect(frame, 3, 36, 64, 3); s.line(frame, 66, 37, 92, 4, 1.4);
    const CL = hdPal('#5c6a78', '#c8d2dc', '#f2f2f2', '#fafafa', '#ffffff');
    const seat = s.add(CL, { layer: 2, R: 3, k: 1.3, grad: 0.4 }); hdD_rr(s, seat, 3, 25, 64, 12, 3);
    const back = s.add(CL, { layer: 3, R: 3, k: 1.3, grad: 0.1 }); s.poly(back, [[60, 26], [88, 1], [95, 7], [68, 34], [62, 34]]);
    /* stripes across the cushion and the backrest */
    for (let x = 9; x < 64; x += 12) for (let y = 24; y < 38; y++) for (let k = 0; k < 4; k++) s.recolor(x + k, y, '#4ec3d9');
    hdD_each(s, back, (x, y) => { const t = (x - 62) * 0.73 - (y - 34) * 0.68; if (t > 4 && t % 12 < 4) s.recolor(x, y, '#4ec3d9'); });
} };

/* lettering: a line of words (runs with clean gaps) cut into wood (a dark groove with a lit lower lip) or painted on
   (lip null), three pixels tall like today's one-pixel lines, so it reads */
function hdD_letters(s, x, y, w, c, lip, seed) {
    let i = 0;
    while (i < w - 2) {
        let n = Math.min(w - i, 9 + Math.floor(hdD_h(i, y, seed) * 10));
        if (w - i - n < 8) n = w - i;
        for (let k = 0; k < n; k++) { s.px(x + i + k, y, c); s.px(x + i + k, y + 1, c); s.px(x + i + k, y + 2, lip || c); }
        i += n + 3;
    }
}
/* a ramp for painted or sanded wood: like hdRamp but its shadow and outline not so orange */
function hdD_tan(hex) {
    const r = hdRamp(hex), g = c => { const l = (c[0] * 0.3 + c[1] * 0.55 + c[2] * 0.15); return c.map(v => Math.round(v + (l - v) * 0.3)); };
    return [g(r[0]), g(r[1]), r[2], r[3], r[4]];
}
/* a sign board: the lighter face inside a bevelled rim of darker wood, grain along it */
function hdD_board(s, x, y, w, h, rim, face, seed, r) {
    const b = s.add(hdD_tan(face), { layer: 1, R: 4, k: 1.3 }); hdD_rr(s, b, x, y, w, h, r == null ? 4 : r); hdD_wood(s, b, seed, false, 0.3);
    const R = hdD_tan(rim);
    hdD_each(s, b, (px, py) => { if (px < x + 4 || px > x + w - 5 || py < y + 4 || py > y + h - 5) s.recolor(px, py, R); });
    return b;
}
/* the wooden sign Sarah can write on */
HD_SPR.d_sign = { w: 54, h: 72, ax: 27, ay: 69, draw(s) {
    const post = s.add(hdRamp('#7a5234'), { layer: 0, R: 3, k: 1.5 }); s.rect(post, 22, 34, 10, 37); hdD_wood(s, post, 3, true, 0.8);
    hdD_board(s, 0, 3, 54, 33, '#c99a62', '#e0b47a', 4);
    hdD_letters(s, 12, 15, 30, '#8a5a33', '#f0cc98', 7); hdD_letters(s, 12, 24, 30, '#8a5a33', '#f0cc98', 8);
    for (const [x, y] of [[5, 8], [48, 8], [5, 30], [48, 30]]) { s.px(x, y, '#6a4428'); s.px(x, y - 1, '#f0d0a0'); }
} };

/* the stone bench: a slab on two blocks */
HD_SPR.d_stonebench = { w: 96, h: 54, ax: 48, ay: 51, draw(s) {
    const legs = s.add(hdRamp('#a8a4b4'), { layer: 0, R: 3, k: 1.4, bias: -0.04 }); hdD_rr(s, legs, 10, 30, 17, 23, 2); hdD_rr(s, legs, 69, 30, 17, 23, 2);
    const front = s.add(hdD_STONE, { layer: 1, R: 3, k: 1.3, grad: 0.3, cast: 2, bias: -0.1 }); hdD_rr(s, front, 0, 20, 96, 13, 3);
    const top = s.add(hdRamp('#d8d4e4'), { layer: 2, R: 3, k: 1.2, bias: 0.04, grad: 0 }); hdD_rr(s, top, 1, 15, 94, 7, 3);
    hdD_stone(s, front, 41, 0.06); hdD_stone(s, top, 42, 0.04); hdD_stone(s, legs, 43, 0.06);
    /* two old chips in the front, as today */
    for (const [x, y] of [[61, 23], [62, 23], [61, 24], [28, 26], [29, 26], [29, 27]]) s.mod(x, y, -2);
} };

/* the bunny topiary: leafy ears, head and body over a terracotta pot */
HD_SPR.d_topiary = { w: 54, h: 90, ax: 27, ay: 84, draw(s) {
    const POT = hdRamp('#c8704a');
    const pot = s.add(POT, { layer: 1, R: 5, k: 1.4 }); s.poly(pot, [[14, 68], [40, 68], [38, 82], [16, 82]]);
    const foot = s.add(hdRamp('#a85a3a'), { layer: 2, R: 2, k: 1.2 }); hdD_rr(s, foot, 13, 80, 28, 6, 2);
    const rim = s.add(hdRamp('#e08a5a'), { layer: 3, R: 3, k: 1.3, cast: 2 }); hdD_rr(s, rim, 12, 64, 30, 7, 2);
    const LEAF = hdD_LEAF, body = s.add(LEAF, { layer: 1, R: 12, k: 1.4 }); hdD_bush(s, body, 27, 48, 20.5, 15.5, 31, 11);
    const head = s.add(LEAF, { layer: 2, R: 9, k: 1.4, cast: 1 }); hdD_bush(s, head, 27, 22, 14, 11, 32, 9);
    const earL = s.add(LEAF, { layer: 1, R: 3, k: 1.4 }), earR = s.add(LEAF, { layer: 1, R: 3, k: 1.4 });
    s.ellipse(earL, 21, 7, 4.3, 8); s.ellipse(earR, 33, 7, 4.3, 8);
    for (const p of [body, head, earL, earR]) hdD_leafy(s, p, 6, 33 + p, 0.9);
    /* eyes: two dark hollows in the leaves */
    for (const x of [22, 30]) for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) if (!((j === 0 || j === 3) && i === 2)) s.px(x + i, 21 + j, j < 2 ? '#14241a' : '#1e3424');
} };

/* the tiki torch: a woven cup on a bamboo pole (the game adds the flames at night) */
HD_SPR.d_torch = { w: 36, h: 90, ax: 18, ay: 84, draw(s) {
    const pole = s.add(hdRamp('#a8733f'), { layer: 0, R: 3, k: 1.7 }); s.rect(pole, 14, 33, 8, 53);
    for (const y of [42, 51, 60, 69, 78]) for (let x = 13; x < 23; x++) { s.recolor(x, y, '#7a4a28'); s.recolor(x, y + 1, '#7a4a28'); s.plot(pole, 13, y); s.plot(pole, 22, y); }
    hdD_wood(s, pole, 5, true, 0.6);
    const cup = s.add(hdRamp('#caa55f'), { layer: 1, R: 4, k: 1.4 }); s.poly(cup, [[6, 16], [30, 16], [29, 28], [24, 34], [12, 34], [7, 28]]);
    const band = s.add(hdRamp('#8a6a3a'), { layer: 2, R: 2, k: 1.2 }); s.rect(band, 7, 24, 23, 3);
    const mouth = s.add(hdRamp('#5a3e22'), { layer: 2, R: 2, flat: 1, bias: -0.15 }); s.ellipse(mouth, 18, 16, 11, 2.2);
    /* the weave: a little cross-hatch */
    hdD_each(s, cup, (x, y, i) => { const a = (x + y) % 6, b = (x - y + 60) % 6; if (a === 0 || b === 0) s.mods[i] -= 1; else if (a === 2 && b === 3) s.mods[i] += 1; });
} };

/* the beach umbrella: a dome of red and white panels, a scalloped hem, a white pole */
HD_SPR.d_umbrella = { w: 84, h: 102, ax: 42, ay: 96, draw(s) {
    const pole = s.add(hdPal('#5a5c6a', '#c8c8d4', '#f2f2f6', '#fafafc', '#ffffff'), { layer: 0, R: 3, k: 1.8 }); s.rect(pole, 40, 30, 7, 63);
    const foot = s.add(hdRamp('#d8d8e0'), { layer: 1, R: 2, k: 1.3 }); hdD_rr(s, foot, 37, 91, 13, 5, 2);
    const RED = hdRamp('#e0405a'), WHITE = hdPal('#7a6a74', '#d8d2d8', '#f6f4f4', '#fcfbfb', '#ffffff');
    /* the canopy as eight panels fanning out from the top, each a part (so each gets its own fold of light) */
    const ax = 43, ay = 2, edge = x => 30 - Math.pow(Math.abs(x - 42) / 42, 2);
    const shape = (x, y) => { const t = (y - ay) / 28; if (t < 0 || t > 1.05) return false; const hw = 10 + 33 * Math.pow(Math.min(1, t), 0.8); return Math.abs(x + 0.5 - 42.5) <= hw && y <= edge(x); };
    const panels = []; for (let k = 0; k < 8; k++) panels.push(s.add(k % 2 ? WHITE : RED, { layer: 1, R: 5, k: 1.2, grad: 0.3, bias: (3.5 - k) * 0.025 }));
    for (let y = 0; y < 34; y++) for (let x = 0; x < 84; x++) if (shape(x, y)) {
        const a = Math.atan2(x + 0.5 - ax, (y + 0.5 - ay) * 1.6 + 6), k = Math.max(0, Math.min(7, Math.floor((a / 1.05 + 1) * 4)));
        s.plot(panels[k], x, y);
    }
    /* the hem: darker red scallops under the edge */
    const hem = s.add(hdRamp('#b3263a'), { layer: 2, R: 2, k: 1.2 });
    for (let x = 0; x < 84; x++) { const d = Math.abs(((x + 3) % 10.5) - 5.25) / 5.25; const h = 2 + Math.round((1 - d * d) * 2); for (let j = 0; j < h; j++) s.plot(hem, x, 30 + j); }
    const tip = s.add(hdRamp('#d8d8e0'), { layer: 3, R: 2, k: 1.4 }); s.ellipse(tip, 43, 2.5, 2.5, 2.5);
} };

/* ---------------------------------------------------------------- the island's signs */
/* the campsite and bonfire signs: a board with a picture on a post */
function hdD_picSign(s, pic) {
    const post = s.add(hdRamp('#7a5234'), { layer: 0, R: 3, k: 1.5 }); s.rect(post, 28, 36, 10, 43); hdD_wood(s, post, 9, true, 0.8);
    hdD_board(s, 0, 3, 66, 36, '#c99a62', '#dcb07a', 10, 5);
    hdD_over(s, pic);
}
HD_SPR.sign_bonfire = { w: 66, h: 84, ax: 33, ay: 78, draw: s => hdD_picSign(s, o => {
    const logs = o.add(hdRamp('#7a5234'), { layer: 0, R: 2, k: 1.4 }); o.line(logs, 20, 34, 46, 30, 2); o.line(logs, 20, 30, 46, 34, 2);
    const red = o.add(hdRamp('#e2442a'), { layer: 1, R: 4, k: 1.1 }); o.poly(red, [[33, 12], [37, 18], [42, 22], [43, 28], [39, 32], [27, 32], [23, 28], [24, 22], [28, 18]]);
    const orange = o.add(hdRamp('#f7962d'), { layer: 2, R: 3, k: 1 }); o.poly(orange, [[33, 17], [37, 22], [39, 27], [37, 31], [29, 31], [27, 27], [29, 22]]);
    const yellow = o.add(hdRamp('#ffd84a'), { layer: 3, R: 2, k: 0.9, bias: 0.1 }); o.poly(yellow, [[33, 22], [36, 27], [35, 31], [31, 31], [30, 27]]);
}) };
HD_SPR.sign_camp = { w: 66, h: 84, ax: 33, ay: 78, draw: s => hdD_picSign(s, o => {
    const tent = o.add(hdRamp('#3f8a45'), { layer: 1, R: 4, k: 1.3 }); o.poly(tent, [[33, 11], [48, 32], [18, 32]]);
    const door = o.add(hdRamp('#2a1e2a'), { layer: 2, R: 1, flat: 1 }); o.poly(door, [[33, 20], [37.5, 32], [28.5, 32]]);
    const flap = o.add(hdRamp('#5aa55e'), { layer: 3, R: 1, k: 1 }); o.poly(flap, [[33, 20], [30, 32], [28.5, 32]]);
    o.px(33, 10, '#7a5234'); o.px(33, 9, '#7a5234');
}) };
/* the club's sign: two lines of pink neon on black; the island's: two lines painted cream on wood */
function hdD_lineSign(s, black) {
    const post = s.add(hdRamp('#7a5234'), { layer: 0, R: 3, k: 1.5 }); s.rect(post, 25, 34, 10, 29); hdD_wood(s, post, 12, true, 0.8);
    if (black) {
        const b = s.add(hdPal('#0c0a10', '#14121a', '#1c1a24', '#2a2734', '#3a3646'), { layer: 1, R: 3, k: 1.3 }); hdD_rr(s, b, 0, 0, 60, 36, 4);
        hdD_each(s, b, (x, y) => { if (x < 3 || x > 56 || y < 3 || y > 32) s.recolor(x, y, '#2e2a38'); });
        /* the tubes: a hot core, pink round it, a soft glow on the black */
        for (const [y, w] of [[15, 36], [24, 27]]) {
            for (let x = 10; x < 14 + w; x++) for (let j = -2; j <= 4; j++) { const d = j < 0 ? -j : j > 2 ? j - 2 : 0; if (d && hdD_h(x, y + j, 3) < 0.9 - d * 0.3) s.px(x, y + j, d === 1 ? '#5a1e44' : '#3a1630'); }
            for (let x = 12; x < 12 + w; x++) { s.px(x, y, '#ff7ab8'); s.px(x, y + 1, '#ffd0e8'); s.px(x, y + 2, '#ff5aa8'); }
            s.px(11, y + 1, '#ff5aa8'); s.px(12 + w, y + 1, '#ff5aa8');
        }
    } else {
        hdD_board(s, 0, 0, 60, 36, '#b88a52', '#c99a62', 13);
        hdD_letters(s, 12, 15, 36, '#fff4dc', null, 13); hdD_letters(s, 12, 24, 27, '#fff4dc', null, 14);
    }
    for (const [x, y] of [[5, 5], [54, 5], [5, 30], [54, 30]]) s.px(x, y, black ? '#4a4656' : '#6a4428');
}
HD_SPR.sign_club = { w: 60, h: 66, ax: 30, ay: 60, draw: s => hdD_lineSign(s, true) };
HD_SPR.sign_island = { w: 60, h: 66, ax: 30, ay: 60, draw: s => hdD_lineSign(s, false) };
/* the farm signpost: three arrows (the farm's wheat to the right, the forest's tree to the left, the mountain right) */
HD_SPR.sign_farm = { w: 72, h: 90, ax: 36, ay: 84, draw(s) {
    const post = s.add(hdRamp('#7a5234'), { layer: 0, R: 4, k: 1.6 }); s.rect(post, 31, 26, 10, 61); hdD_wood(s, post, 21, true, 0.8);
    const arrow = (x0, x1, y, h, right, seed) => {
        const b = s.add(hdRamp('#c99a62'), { layer: 1, R: 3, k: 1.3, cast: 1 }), m = y + h / 2;
        s.poly(b, right ? [[x0, y], [x1 - 9, y], [x1, m], [x1 - 9, y + h], [x0, y + h]] : [[x0 + 9, y], [x1, y], [x1, y + h], [x0 + 9, y + h], [x0, m]]);
        hdD_wood(s, b, seed, false, 0.7);
        for (const yy of [y + Math.round(h / 3), y + Math.round(h * 2 / 3)]) for (let x = x0 + 10; x < x1 - 10; x++) if (hdD_h(x >> 3, yy, seed) < 0.6) s.mod(x, yy, -1);
    };
    arrow(22, 72, 10, 19, true, 22); arrow(0, 50, 31, 21, false, 23); arrow(22, 72, 53, 20, true, 24);
    hdD_over(s, o => {
        /* wheat: a stalk with grains */
        const stalk = o.add(hdRamp('#b8862d'), { R: 1 }); o.line(stalk, 46, 26, 46, 17, 0.6);
        const grain = o.add(hdRamp('#e8c050'), { R: 2, k: 1.2 });
        for (let k = 0; k < 4; k++) { o.ellipse(grain, 44, 14 + k * 3, 1.6, 1.3); o.ellipse(grain, 48, 14 + k * 3, 1.6, 1.3); }
        o.ellipse(grain, 46, 12.5, 1.5, 1.8);
        /* a round tree */
        const trunk = o.add(hdRamp('#6b4a2a'), { R: 1 }); o.rect(trunk, 25, 43, 3, 6);
        const crown = o.add(hdRamp('#4f9a3a'), { R: 4, k: 1.3 }); o.ellipse(crown, 26.5, 39, 6, 5);
        /* the mountain with snow on top */
        const mtn = o.add(hdRamp('#8a96a8'), { R: 4, k: 1.2 }); o.poly(mtn, [[47, 57], [59, 69], [35, 69]]);
        const snow = o.add(hdRamp('#ffffff'), { R: 2, k: 1, layer: 1 }); o.poly(snow, [[47, 57], [51, 61.5], [48.5, 60.5], [46.5, 62], [44.5, 60.5], [43, 61.5]]);
    });
} };
/* the brass plaque on a short metal post */
HD_SPR.plaque = { w: 48, h: 54, ax: 24, ay: 48, draw(s) {
    const post = s.add(hdRamp('#5a5460'), { layer: 0, R: 3, k: 1.7 }); s.rect(post, 20, 31, 8, 19);
    const plate = s.add(hdPal('#5a4210', '#a8832e', '#d9b04a', '#ecc866', '#fff0a0'), { layer: 1, R: 4, k: 1.3 }); hdD_rr(s, plate, 0, 3, 48, 30, 3);
    hdD_each(s, plate, (x, y, i) => { if (x < 5 || x > 42 || y < 8 || y > 27) s.recolor(x, y, '#a8832e'); else if (Math.abs(x - y * 0.8 - 8) < 2.5) s.mods[i] += 1; });
    hdD_letters(s, 11, 14, 26, '#8a6a22', '#f4d878', 3); hdD_letters(s, 11, 20, 26, '#8a6a22', '#f4d878', 4);
    for (const [x, y] of [[3, 6], [44, 6], [3, 29], [44, 29]]) { s.px(x, y, '#6a5018'); s.px(x - 1, y - 1, '#fff0a0'); }
    s.px(9, 11, '#fffbe0'); s.px(10, 11, '#fff0a0'); s.px(9, 12, '#fff0a0');
} };

/* ---------------------------------------------------------------- street furniture */
/* the green trash can: a domed lid with a knob, a ribbed body, a label */
HD_SPR.trashcan = { w: 42, h: 66, ax: 21, ay: 60, draw(s) {
    const body = s.add(hdRamp('#4f8a5e'), { layer: 1, R: 6, k: 1.6 }); hdD_rr(s, body, 3, 21, 36, 40, 3);
    for (const x of [12, 21, 30]) hdD_each(s, body, (px, py, i) => { if (px === x && py > 23) s.mods[i] -= 1; if (px === x + 1 && py > 23) s.mods[i] += 1; });
    const lid = s.add(hdRamp('#3a6a47'), { layer: 2, R: 5, k: 1.4, cast: 2 }); s.ellipse(lid, 21, 14, 17.5, 8); s.rect(lid, 3, 14, 36, 4);
    const lip = s.add(hdRamp('#6fae7c'), { layer: 3, R: 2, k: 1.3, cast: 2 }); hdD_rr(s, lip, 0, 17, 42, 5, 2);
    const knob = s.add(hdRamp('#2f503a'), { layer: 3, R: 3, k: 1.4 }); hdD_rr(s, knob, 14, 1, 14, 7, 3);
    const label = s.add(hdRamp('#fff7e6'), { layer: 2, R: 2, k: 1, flat: 1, bias: 0.05 }); s.rect(label, 13, 33, 12, 12);
    /* a little green leaf on the label */
    for (const [x, y] of [[17, 41], [18, 40], [19, 39], [20, 38], [21, 37], [18, 39], [19, 38], [20, 37], [19, 37], [18, 38], [17, 40]]) s.px(x, y, '#4f8a5e');
} };
/* the drinking fountain: a stone bowl with a spout at the back, on a column */
HD_SPR.drinkfountain = { w: 42, h: 78, ax: 21, ay: 72, draw(s) {
    const base = s.add(hdD_STONE, { layer: 1, R: 3, k: 1.4 }); hdD_rr(s, base, 6, 63, 30, 11, 2);
    const col = s.add(hdRamp('#c8c4d4'), { layer: 0, R: 5, k: 1.8 }); s.rect(col, 13, 28, 16, 37);
    const bowl = s.add(hdD_STONEL, { layer: 2, R: 4, k: 1.3 }); s.ellipse(bowl, 21, 20, 20.5, 8); s.poly(bowl, [[2, 21], [40, 21], [32, 30], [10, 30]]);
    const water = s.add(hdD_WATER, { layer: 1, R: 3, k: 0.8, grad: 0.3 }); s.ellipse(water, 21, 19.5, 13.5, 4);
    const spout = s.add(hdRamp('#9a96a6'), { layer: 3, R: 3, k: 1.5 }); hdD_rr(s, spout, 25, 9, 9, 9, 3); s.rect(spout, 22, 11, 5, 3);
    hdD_stone(s, bowl, 51, 0.04); hdD_stone(s, col, 52, 0.04); hdD_stone(s, base, 53, 0.05);
    /* the jet of water arcing from the spout */
    for (let t = 0; t <= 8; t++) { const x = 22 - t * 0.9, y = 12 - Math.sin(t / 8 * 2.4) * 3 + t * 0.5; s.px(x, y, t % 3 ? '#bfe8ff' : '#ffffff'); }
    for (const [x, y] of [[13, 18], [14, 18], [15, 18], [14, 19]]) s.px(x, y, '#ffffff');
} };
/* the bird house: a red shingled roof, a little yellow house with a round door and a perch, on a post */
HD_SPR.birdhouse = { w: 42, h: 102, ax: 21, ay: 96, draw(s) {
    const post = s.add(hdRamp('#7a4e2c'), { layer: 0, R: 3, k: 1.6 }); s.rect(post, 17, 43, 8, 54); hdD_wood(s, post, 31, true, 0.8);
    const house = s.add(hdPal('#7a5a30', '#d9b86a', '#f2d58a', '#f8e4aa', '#fbeec7'), { layer: 1, R: 4, k: 1.4 }); s.rect(house, 4, 20, 34, 25);
    for (const x of [12, 21, 30]) for (let y = 23; y < 45; y++) s.mod(x, y, -1);
    const hole = s.add(hdPal('#1a100c', '#2a1810', '#2a1810', '#2a1810', '#2a1810'), { layer: 2, R: 1, flat: 1 }); s.ellipse(hole, 21, 29, 5.5, 5.5);
    /* the hole's lit inner wall at the bottom right, the house's edge shading it at the top */
    for (let a = 0.1; a < 1.6; a += 0.12) s.px(21 + Math.cos(a) * 4.6 - 0.5, 29 + Math.sin(a) * 4.6 - 0.5, '#6a4426');
    for (let a = 3.4; a < 5.9; a += 0.12) s.mod(21 + Math.cos(a) * 6.4 - 0.5, 29 + Math.sin(a) * 6.4 - 0.5, -1);
    const perch = s.add(hdRamp('#8a5a32'), { layer: 3, R: 1, k: 1.4 }); s.rect(perch, 17, 39, 8, 3);
    const roof = s.add(hdRamp('#c0392b'), { layer: 3, R: 5, k: 1.3, cast: 2 }); s.poly(roof, [[20, 1], [40, 20], [40, 23], [0, 23], [0, 20]]);
    /* shingles: rows of little scallops */
    hdD_each(s, roof, (x, y, i) => { const row = Math.floor((y - 2) / 4), u = (x + (row % 2) * 3) % 6; if ((y - 2) % 4 === 3 || (u === 0 && (y - 2) % 4 > 0)) s.mods[i] -= 1; });
    const eave = s.add(hdRamp('#8a2a22'), { layer: 4, R: 1, k: 1.2 }); s.rect(eave, 0, 22, 40, 2);
} };
/* the coin telescope: a blue head with two eyepieces and a coin slot, on a post */
HD_SPR.telescope = { w: 48, h: 84, ax: 24, ay: 78, draw(s) {
    const base = s.add(hdRamp('#4a5a70'), { layer: 1, R: 3, k: 1.4 }); hdD_rr(s, base, 12, 69, 24, 11, 3);
    const post = s.add(hdRamp('#4a5a70'), { layer: 0, R: 4, k: 1.8 }); s.rect(post, 19, 34, 10, 37);
    const head = s.add(hdRamp('#6b8aa8'), { layer: 2, R: 6, k: 1.4 }); hdD_rr(s, head, 3, 9, 42, 27, 7);
    const plate = s.add(hdRamp('#ffd84a'), { layer: 3, R: 2, k: 1.3 }); hdD_rr(s, plate, 18, 27, 12, 6, 1);
    s.px(23, 29, '#5a4010'); s.px(24, 29, '#5a4010'); s.px(25, 29, '#5a4010');
    hdD_over(s, o => {
        for (const x of [14.5, 33.5]) {
            const rim = o.add(hdRamp('#3e5470'), { layer: 0, R: 2, k: 1.3 }); o.ellipse(rim, x, 19, 7, 6);
            const glass = o.add(hdRamp('#9fd8ef'), { layer: 1, R: 3, k: 1.1 }); o.ellipse(glass, x, 19, 5, 4.2);
            o.px(x - 2, 17, '#ffffff'); o.px(x - 1, 17, '#ffffff'); o.px(x - 2, 18, '#ffffff');
        }
    });
} };
/* the coin sea viewer: a teal body under a hood, two big chrome-rimmed eyepieces, the coin slot between, on a post */
HD_SPR.viewer = { w: 54, h: 102, ax: 27, ay: 96, draw(s) {
    const base = s.add(hdRamp('#7a8290'), { layer: 1, R: 3, k: 1.4 }); hdD_rr(s, base, 12, 87, 30, 10, 3); hdD_rr(s, base, 15, 84, 24, 5, 2);
    const post = s.add(hdRamp('#8a92a0'), { layer: 0, R: 4, k: 1.8 }); s.rect(post, 22, 46, 10, 40);
    const body = s.add(hdRamp('#3f8f9a'), { layer: 2, R: 6, k: 1.4 }); hdD_rr(s, body, 0, 20, 54, 28, 6);
    const hood = s.add(hdRamp('#2c6a74'), { layer: 3, R: 4, k: 1.3, cast: 2 }); hdD_rr(s, hood, 6, 9, 42, 14, 5);
    const slot = s.add(hdRamp('#ffd84a'), { layer: 3, R: 2, k: 1.3 }); hdD_rr(s, slot, 24, 27, 6, 7, 1);
    s.px(26, 29, '#5a4010'); s.px(27, 29, '#5a4010'); s.px(26, 30, '#5a4010'); s.px(27, 30, '#5a4010');
    hdD_over(s, o => {
        for (const x of [14, 40]) {
            const rim = o.add(hdPal('#4a5260', '#9aa4b4', '#c8d0dc', '#e4e8f0', '#ffffff'), { layer: 0, R: 3, k: 1.5 }); o.ellipse(rim, x, 32, 9, 8.5);
            const glass = o.add(hdPal('#0c141a', '#141e26', '#1e2a34', '#2c4050', '#3e5a6e'), { layer: 1, R: 4, k: 1 }); o.ellipse(glass, x, 32, 6, 5.6);
            for (const [dx, dy] of [[-3, -3], [-2, -3], [-3, -2], [-1, -3]]) o.px(x + dx, 32 + dy, '#8fd0f0');
            o.px(x + 2, 34, '#4a7a90');
        }
    });
} };
/* bunting on two poles: a string sagging between them, eight little flags */
function hdD_bunting(s, cols) {
    hdD_win(s, 0, 0, o => {
        for (const x of [5, 131]) {
            const p = o.add(hdRamp('#8a5a33'), { layer: 1, R: 4, k: 1.6 }); o.rect(p, x - 1, 11, 10, 74); hdD_wood(o, p, x, true, 0.7);
            const b = o.add(hdRamp('#d9b44a'), { layer: 2, R: 3, k: 1.4 }); o.ellipse(b, x + 4, 10, 5, 4.2);
            const f = o.add(hdRamp('#6e4829'), { layer: 2, R: 2, k: 1.2 }); o.rect(f, x - 2, 82, 12, 3);
        }
    }, o => {
        const sag = x => 16 + 15 * (1 - Math.pow((x - 72) / 60, 2));
        const str = o.add(hdRamp('#5a4633'), { R: 1 });
        for (let x = 12; x <= 132; x++) { o.plot(str, x, Math.round(sag(x))); o.plot(str, x, Math.round(sag(x)) + 1); }
        cols.forEach((c, k) => {
            const cx = 22 + k * 14.3, y = sag(cx) + 1.5, sl = (sag(cx + 1) - sag(cx - 1)) / 2;
            const f = o.add(hdRamp(c), { R: 3, k: 1.2, layer: 1 });
            o.poly(f, [[cx - 6.5, y - sl * 6.5], [cx + 6.5, y + sl * 6.5], [cx + sl * 4, y + 13]]);
            o.px(cx - 4, y - sl * 4 + 1.5, '#ffffff'); o.px(cx - 3, y - sl * 3 + 1.5, '#ffffff');
        });
    });
}
HD_SPR.bunting = { w: 144, h: 90, ax: 72, ay: 84, draw: s => hdD_bunting(s, ['#e0405a', '#ffd84a', '#4ec3d9', '#8cc152', '#b37cf0', '#f7962d', '#e0405a', '#ffd84a']) };
HD_SPR.bunting_green = { w: 144, h: 90, ax: 72, ay: 84, draw: s => hdD_bunting(s, ['#3f8f45', '#8cc152', '#f4f4f0', '#5aad4a', '#3f8f45', '#8cc152', '#f4f4f0', '#5aad4a']) };
HD_SPR.bunting_orange = { w: 144, h: 90, ax: 72, ay: 84, draw: s => hdD_bunting(s, ['#f7962d', '#ffd84a', '#e0405a', '#fff1b8', '#f7962d', '#ffd84a', '#e0405a', '#fff1b8']) };
