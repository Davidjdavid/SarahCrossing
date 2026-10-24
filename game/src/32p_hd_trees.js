/* ---- 32p_hd_trees.js ---- */
/* HD trees and plants for the HD-2D view: every tree, bush, sapling and stump at three times the detail, in every
   season. A broadleaf crown keeps today's silhouette exactly (stored as row spans of the 16px sprite, smoothed round
   at three times the size) and is split into leaf clumps, each its own rounded part lit from the top left, with small
   leaf clusters on top; pines are tiers of needles, palms fronds on a ringed trunk. Seasons keep today's colors. */

/* a small seeded hash in [0, 1) (scatter without Math.random) */
const hdT_h = (x, y, k) => { let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(k | 0, 1442695041); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

/* today's silhouette, blurred at three times the size: spans 'y0:a-b,c-d|a-b|...' in old pixels; 0.5 is the edge;
   dx, dy shift it (HD pixels) */
function hdT_field(W, H, spec, dx, dy) {
    const [y0s, rows] = spec.split(':'), y0 = +y0s, F = new Float32Array(W * H), G = new Float32Array(W * H);
    dx = dx || 0; dy = dy || 0;
    rows.split('|').forEach((row, j) => {
        for (const sp of row.split(',')) {
            if (!sp) continue;
            const [a, b] = sp.split('-').map(Number);
            for (let y = (y0 + j) * 3 + dy; y < (y0 + j) * 3 + 3 + dy; y++) for (let x = a * 3 + dx; x < b * 3 + 3 + dx; x++) if (x >= 0 && y >= 0 && x < W && y < H) F[y * W + x] = 1;
        }
    });
    /* a 5-wide box blur each way, twice (close to a gaussian): the stair steps come out round */
    const blur = (src, dst, sx, sy) => {
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            let t = 0;
            for (let k = -2; k <= 2; k++) { const xx = x + k * sx, yy = y + k * sy; if (xx >= 0 && yy >= 0 && xx < W && yy < H) t += src[yy * W + xx]; }
            dst[y * W + x] = t / 5;
        }
    };
    blur(F, G, 1, 0); blur(G, F, 0, 1);
    return F;
}

/* the shade of a point on a ball (u, v from its center in radii) under the light: -1..1 */
const hdT_ball = (u, v) => { const d = u * u + v * v, z = Math.sqrt(Math.max(0, 1 - Math.min(1, d))); return u * HD_LIGHT[0] + v * HD_LIGHT[1] + z * HD_LIGHT[2]; };
/* small leaf clusters: a jittered cell pattern; returns how lit the point is in its cell (-0.5..0.5) and the gap */
function hdT_cells(x, y, cell, seed) {
    const gx = x / cell, gy = y / (cell * 0.8), ix = Math.floor(gx), iy = Math.floor(gy);
    let d1 = 9, d2 = 9, fx = 0, fy = 0;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
        const qx = ix + a, qy = iy + b, px = qx + 0.1 + hdT_h(qx, qy, seed) * 0.8, py = qy + 0.1 + hdT_h(qx, qy, seed + 1) * 0.8, d = Math.hypot(gx - px, gy - py);
        if (d < d1) { d2 = d1; d1 = d; fx = gx - px; fy = gy - py; } else if (d < d2) d2 = d;
    }
    return [-(fx * 0.8 + fy) * 0.7, d2 - d1 < 0.12];
}

/* a leafy crown on today's silhouette: clump centers on a jittered grid (spacing sp), each clump a part (lower ones in
   front, so a clump behind gets a dark seam), shaded per pixel as its own ball and as part of the whole crown's ball,
   with small leaf clusters on top. The edge bulges where a clump sits and dips between them. o: { mat, sp, cell, seed,
   layer, lift (lighter/darker), crown (how much the whole crown's ball counts), cut: [deep, shadow, base, light] limits }
   returns { ids, cl, box, sh (the shade 1..4 per pixel) } */
function hdT_crown(s, spec, o) {
    const W = s.w, H = s.h, seed = o.seed || 1, sp = o.sp || 18, cell = o.cell || 4.5, F = hdT_field(W, H, spec, o.dx, o.dy);
    let x0 = W, x1 = 0, y0 = H, y1 = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (F[y * W + x] >= 0.5) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const cx = (x0 + x1 + 1) / 2, cy = (y0 + y1 + 1) / 2, rx = (x1 - x0 + 1) / 2, ry = (y1 - y0 + 1) / 2;
    /* clump centers: rows of a jittered hex grid, kept where they land well inside */
    const cl = o.clumps ? o.clumps.map(([x, y, r]) => ({ x, y, r })) : [];
    if (!o.clumps) for (let j = 0, y = y0 + sp * 0.42; y < y1; j++, y += sp * 0.8) for (let x = x0 + (j % 2 ? sp * 0.5 : 0) + sp * 0.25; x < x1; x += sp) {
        const px = x + (hdT_h(j, x, seed) - 0.5) * sp * 0.45, py = y + (hdT_h(x, j, seed + 1) - 0.5) * sp * 0.35;
        if (F[Math.round(py) * W + Math.round(px)] > 0.8) cl.push({ x: px, y: py, r: sp * (0.74 + hdT_h(j, x, seed + 2) * 0.2) });
    }
    cl.sort((a, b) => a.y - b.y);
    for (const c of cl) c.g = hdT_ball((c.x - cx) / rx, (c.y - cy) / ry);
    const ids = cl.map((c, i) => s.add(o.mat, { layer: (o.layer || 1) + i * 0.01, flat: 1, grad: 0, bias: 0 }));
    const V = new Float32Array(W * H).fill(-9), T = new Int8Array(W * H), ow = o.crown == null ? 0.75 : o.crown, lw = o.leaf == null ? 1 : o.leaf;
    for (let y = Math.max(0, y0 - 3); y <= Math.min(H - 1, y1 + 3); y++) for (let x = Math.max(0, x0 - 3); x <= Math.min(W - 1, x1 + 3); x++) {
        const f = F[y * W + x];
        if (f < 0.25) continue;
        /* the clump in front that reaches this pixel (its edge lobed), else the nearest */
        let best = -1, bd = 1e9, bu = 0, bv = 0;
        for (let i = cl.length - 1; i >= 0; i--) {
            const c = cl[i], ddx = x + 0.5 - c.x, ddy = y + 0.5 - c.y, d = Math.hypot(ddx, ddy), a = Math.atan2(ddy, ddx);
            const r = c.r * (1 + 0.06 * Math.sin(a * 5 + i * 1.7));
            if (d < r) { best = i; bu = ddx / r; bv = ddy / r; bd = -1; break; }
            if (d - r < bd) { bd = d - r; best = i; bu = ddx / (d || 1); bv = ddy / (d || 1); }
        }
        /* the edge: out a little over a clump, in a little between clumps */
        const [lc, gap] = hdT_cells(x, y, cell, seed + 9);
        if (f < (bd < 0 ? 0.32 : 0.62) + (gap ? 0.14 : 0) - lc * 0.12) continue;
        s.plot(ids[best], x, y);
        const c = cl[best];
        V[y * W + x] = hdT_ball(bu, bv) + (c.g * 0.75 + hdT_ball((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry) * 0.25) * ow * 2 + lc * 0.15;
        T[y * W + x] = gap ? (bu + bv > 0 && hdT_h(x, y, seed + 4) < 0.6 ? -1 : 0) : lc > 0.24 && bu + bv < 0.2 ? 1 : 0;
    }
    /* the underside of a clump, where it tucks behind the one in front, falls into shade */
    const L = new Float32Array(W * H), pi = ids[0], sd = o.seam == null ? 3 : o.seam;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const i = y * W + x, p = s.part[i]; if (V[i] <= -9) continue;
        let m = 0;
        for (let dy = 1; dy <= sd; dy++) for (let dx = -1; dx <= 2; dx++) { const q = s.at(x + dx, y + dy); if (q > p && q - pi < ids.length) m = Math.max(m, 1 - (dy - 1 + Math.max(0, dx - 1)) / sd); }
        L[i] = m;
    }
    for (let i = 0; i < W * H; i++) if (V[i] > -9) V[i] -= L[i] * (o.seamK == null ? 0.35 : o.seamK);
    /* shades in today's proportions: cut the values where the share of deep, shadow, base and light comes out right */
    const mix = o.mix || [0.05, 0.27, 0.74], all = Array.from(V.filter(v => v > -9)).sort((a, b) => a - b);
    const cut = mix.map(m => all[Math.min(all.length - 1, Math.floor(m * all.length))]), sh = new Int8Array(W * H);
    /* flat parts sit at shade 2: steer every pixel to its own shade */
    for (let i = 0; i < W * H; i++) if (V[i] > -9) { const v = V[i]; sh[i] = v < cut[0] ? 1 : v < cut[1] ? 2 : v < cut[2] ? 3 : 4; sh[i] = Math.max(1, Math.min(4, sh[i] + (hdT_h(i, 3, seed) < lw ? T[i] : 0))); s.mods[i] += sh[i] - 2; }
    return { ids, cl, box: [x0, y0, x1, y1], sh };
}

/* a trunk from (x, top) down to the ground at y bot, w wide (wider at the roots), with bark streaks */
function hdT_trunk(s, mat, x, top, bot, w, o) {
    o = o || {};
    const id = s.add(mat, { layer: o.layer || 0, R: w * 0.45, grad: 0.05, k: 1.6 });
    for (let y = top; y <= bot; y++) {
        const t = (y - top) / Math.max(1, bot - top), fl = Math.pow(Math.max(0, t - (o.flareAt || 0.8)) / (1 - (o.flareAt || 0.8)), 2) * (o.flare || 3);
        const sw = (o.lean || 0) * (1 - t);
        s.rect(id, Math.round(x - w / 2 - fl + sw), y, Math.round(w + fl * 2), 1);
    }
    /* bark: a few wavy dark lines running down, broken here and there */
    for (let k = 0; k < (o.streaks || 3); k++) {
        const bx = x - w / 2 + (k + 0.7) * w / ((o.streaks || 3) + 0.4);
        for (let y = top; y <= bot; y++) if (hdT_h(k, y >> 2, 7) > 0.25) s.mod(bx + Math.sin(y * 0.45 + k * 2) * 0.8, y, -1);
    }
    return id;
}

/* the crown's shade on whatever is below it (the top of the trunk): two steps darker right under it, one step a bit lower */
function hdT_under(s, c, d) {
    const W = s.w, set = new Set(c.ids); d = d || 9;
    for (let x = c.box[0]; x <= c.box[2]; x++) {
        let y = c.box[3];
        while (y > c.box[1] && !set.has(s.part[y * W + x])) y--;
        if (y <= c.box[1]) continue;
        for (let k = 1; k <= d; k++) { const p = s.part[(y + k) * W + x]; if (p >= 0 && !set.has(p)) s.mod(x, y + k, k <= d * 0.45 ? -2 : -1); }
    }
}

/* winter: snow lying on the crown's top (thick where it's flat, none where it's steep), thin caps on the clumps' upper
   rims, a few flakes caught in the leaves. o: { th (thickness), reach (how far down, 0..1 of the crown), rim, flakes } */
function hdT_snow(s, c, o) {
    o = o || {};
    const W = s.w, set = new Set(c.ids), snow = s.add(hdT_SNOW, { layer: 9, R: 2, grad: 0.05, bias: 0.16, cast: 1 });
    const [x0, y0, x1, y1] = c.box, reach = y0 + (y1 - y0) * (o.reach || 0.55), rim = y0 + (y1 - y0) * (o.rim || 0.6), TH = o.th || 6;
    const cells = [];
    for (let y = y0; y < reach; y++) for (let x = x0; x <= x1; x++) {
        const p = s.at(x, y); if (!set.has(p)) continue;
        /* lying on top: open sky within th pixels straight up or up a slope (so the sides get less) */
        const th = TH * (1 - 0.55 * (y - y0) / (reach - y0)) + (hdT_h(x >> 1, 2, 5) - 0.5) * 2;
        let on = false;
        for (const dx of [-0.6, 0, 0.6]) for (let k = 1; k <= th && !on; k++) if (s.at(Math.round(x + dx * k), y - k) < 0) on = true;
        /* a cap where a clump's top rim shows against the clump behind (the rim flat enough to hold it) */
        if (!on && y < rim && hdT_h(x >> 2, y >> 2, 6) > 0.3) for (let k = 1; k <= (y < (y0 + rim) / 2 ? 3 : 2) && !on; k++) {
            const q = s.at(x, y - k), ql = s.at(x - 2, y - k), qr = s.at(x + 2, y - k);
            if (set.has(q) && q < p && set.has(ql) && ql < p && set.has(qr) && qr < p) on = true;
        }
        if (on) cells.push(x, y);
    }
    for (let i = 0; i < cells.length; i += 2) s.plot(snow, cells[i], cells[i + 1]);
    /* flakes: a white pixel with a cool one under it */
    for (let i = 0; i < (o.flakes == null ? 18 : o.flakes); i++) {
        const x = Math.round(x0 + 4 + hdT_h(i, 8, 9) * (x1 - x0 - 8)), y = Math.round(y0 + 6 + hdT_h(i, 9, 9) * (y1 - y0) * 0.75);
        if (set.has(s.at(x, y)) && set.has(s.at(x, y + 1)) && set.has(s.at(x + 1, y))) { s.px(x, y, '#ffffff'); s.px(x, y + 1, '#c8d5e4'); }
    }
    return snow;
}

/* ---------------------------------------------------------------- the season colors (today's, plus an outline and a sparkle) */
const hdT_LEAF = {
    spring: hdPal('#2b5e33', '#3f8a48', '#53a855', '#6cc563', '#9be083'),
    summer: hdPal('#21512f', '#2f7040', '#3e8e4a', '#4fae55', '#7fcf6e'),
    fall: hdPal('#6e3418', '#9e4f26', '#c8702d', '#e39a3b', '#f5c05a'),
    winter: hdPal('#2a4a3a', '#39604a', '#4a7556', '#5f8f6a', '#7ea888'),
};
const hdT_SNOW = hdPal('#8b9bb2', '#c8d5e4', '#dfe8f2', '#f2f6fb', '#ffffff');
const hdT_BARK = hdPal('#4a3020', '#7a5234', '#9a6b45', '#b8845a', '#cf9d70');

/* ---------------------------------------------------------------- the round trees (three oaks, every season) */
const hdT_OAK = [
    '1:13-16|12-17|12-18,21-22|10-24|7-25|6-25|5-26|4-26|4-26|3-27|3-27|3-27|4-28|4-28|4-29|3-29|3-29|3-28|3-27|3-26|4-25|6-25|8-25|8-25|8-24|9-16,18-23|11-13',
    '2:10-12,16-18|9-22|8-23|7-24|7-24|7-24|5-25|4-27|3-28|2-29|3-29|3-29|3-28|4-27|4-27|4-27|4-27|4-27|4-27|5-27|5-26|6-25|7-24|8-23|12-18|13-16',
    '1:14-16|13-18|12-20|7-22|6-23|5-25|5-26|5-27|5-28|5-27|4-27|4-27|3-27|3-27|3-28|3-29|3-29|3-29|3-28|4-27|6-25|7-25|7-24|7-23|8-22|8-13,16-21|9-11,18-20',
];
function hdT_oak(s, season, v) {
    hdT_trunk(s, hdT_BARK, 47.5, 70, 112, 15, { flare: 2.5 });
    const c = hdT_crown(s, hdT_OAK[v], { mat: hdT_LEAF[season], sp: 22, cell: 6.5, seed: 11 + v * 7, layer: 2 });
    hdT_under(s, c);
    if (season === 'winter') hdT_snow(s, c);
}
for (const se of ['spring', 'summer', 'fall', 'winter']) for (let v = 0; v < 3; v++) HD_SPR[`tree_oak_${se}_${v}`] = { w: 96, h: 120, ax: 48, ay: 111, draw(s) { hdT_oak(s, se, v); } };
