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
    let bx0 = W, bx1 = 0, by0 = H, by1 = 0;
    rows.split('|').forEach((row, j) => {
        for (const sp of row.split(',')) {
            if (!sp) continue;
            const [a, b] = sp.split('-').map(Number);
            for (let y = (y0 + j) * 3 + dy; y < (y0 + j) * 3 + 3 + dy; y++) for (let x = a * 3 + dx; x < b * 3 + 3 + dx; x++) if (x >= 0 && y >= 0 && x < W && y < H) {
                F[y * W + x] = 1; bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y);
            }
        }
    });
    /* a 5-wide box blur each way (close to a gaussian), only around the shape: the stair steps come out round */
    const X0 = Math.max(0, bx0 - 3), X1 = Math.min(W - 1, bx1 + 3), Y0 = Math.max(0, by0 - 3), Y1 = Math.min(H - 1, by1 + 3);
    for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) { let t = 0; for (let k = Math.max(0, x - 2); k <= Math.min(W - 1, x + 2); k++) t += F[y * W + k]; G[y * W + x] = t / 5; }
    for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) { let t = 0; for (let k = Math.max(0, y - 2); k <= Math.min(H - 1, y + 2); k++) t += G[k * W + x]; F[y * W + x] = t / 5; }
    F.box = [X0, Y0, X1, Y1];
    return F;
}

/* the shade of a point on a ball (u, v from its center in radii) under the light: -1..1 */
const hdT_ball = (u, v) => { const d = u * u + v * v, z = Math.sqrt(Math.max(0, 1 - Math.min(1, d))); return u * HD_LIGHT[0] + v * HD_LIGHT[1] + z * HD_LIGHT[2]; };
/* small leaf clusters: a jittered cell pattern (each cell's point picked once, G = hdT_grid), returns how lit the point
   is in its cell (-0.5..0.5), whether it is on a gap between cells, and how far it is from the cell's middle */
function hdT_grid(W, H, cell, seed) {
    const nx = Math.ceil(W / cell) + 3, ny = Math.ceil(H / (cell * 0.85)) + 3, px = new Float32Array(nx * ny), py = new Float32Array(nx * ny);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { px[j * nx + i] = i - 1 + 0.1 + hdT_h(i - 1, j - 1, seed) * 0.8; py[j * nx + i] = j - 1 + 0.1 + hdT_h(i - 1, j - 1, seed + 1) * 0.8; }
    return { cell, nx, px, py };
}
const hdT_CELL = [0, false, 0, 0];
function hdT_cells(x, y, G) {
    const gx = x / G.cell, gy = y / (G.cell * 0.85), ix = Math.floor(gx), iy = Math.floor(gy), PX = G.px, PY = G.py;
    let d1 = 81, d2 = 81, fx = 0, fy = 0, fk = 0;
    for (let b = 0; b <= 2; b++) for (let a = 0; a <= 2; a++) {
        const k = (iy + b) * G.nx + ix + a, ex = gx - PX[k], ey = gy - PY[k], d = ex * ex + ey * ey;
        if (d < d1) { d2 = d1; d1 = d; fx = ex; fy = ey; fk = k; } else if (d < d2) d2 = d;
    }
    d1 = Math.sqrt(d1);
    hdT_CELL[0] = -(fx * 0.8 + fy) * 0.7; hdT_CELL[1] = Math.sqrt(d2) - d1 < 0.12; hdT_CELL[2] = d1; hdT_CELL[3] = fk;
    return hdT_CELL;
}

/* shades in today's proportions: V holds a light value per pixel (-9 for none), cut where the shares of deep, shadow,
   base and light (mix, cumulative) come out right, then the texture steps T (-1, 0, +1) on a share lw of the pixels.
   The parts are flat (they sit at shade 2), so the mods steer every pixel to its own shade. Returns the shades. */
function hdT_tone(s, V, mix, T, lw, seed) {
    const n = s.w * s.h, sh = new Int8Array(n), NB = 512;
    mix = mix || [0.05, 0.27, 0.74];
    /* the cuts from a histogram of the values (as good as sorting them, and quicker) */
    let lo = 1e9, hi = -1e9, cnt = 0;
    for (let i = 0; i < n; i++) { const v = V[i]; if (v > -9) { if (v < lo) lo = v; if (v > hi) hi = v; cnt++; } }
    const hist = new Int32Array(NB), sc = (NB - 1) / Math.max(1e-6, hi - lo);
    for (let i = 0; i < n; i++) if (V[i] > -9) hist[Math.floor((V[i] - lo) * sc)]++;
    const cut = mix.map(m => { let acc = 0, b = 0; const want = m * cnt; while (b < NB && acc + hist[b] <= want) acc += hist[b++]; return lo + b / sc; });
    for (let i = 0; i < n; i++) if (V[i] > -9) {
        const v = V[i]; let k = v < cut[0] ? 1 : v < cut[1] ? 2 : v < cut[2] ? 3 : 4;
        if (T && T[i] && (lw >= 1 || hdT_h(i, 3, seed) < lw)) k = Math.max(1, Math.min(4, k + T[i]));
        sh[i] = k; s.mods[i] += k - 2;
    }
    return sh;
}

/* a leafy crown on today's silhouette: clump centers on a jittered grid (spacing sp), each clump a part (lower ones in
   front, so a clump behind gets a dark seam), shaded per pixel as its own ball and as part of the whole crown's ball,
   with small leaf clusters on top. The edge bulges where a clump sits and dips between them. o: { mat, sp, cell, seed,
   layer, lift (lighter/darker), crown (how much the whole crown's ball counts), cut: [deep, shadow, base, light] limits }
   returns { ids, cl, box, sh (the shade 1..4 per pixel) } */
function hdT_crown(s, spec, o) {
    const W = s.w, H = s.h, seed = o.seed || 1, sp = o.sp || 18, cell = o.cell || 4.5, F = hdT_field(W, H, spec, o.dx, o.dy);
    let x0 = W, x1 = 0, y0 = H, y1 = 0;
    for (let y = F.box[1]; y <= F.box[3]; y++) for (let x = F.box[0]; x <= F.box[2]; x++) if (F[y * W + x] >= 0.5) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
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
    const V = new Float32Array(W * H).fill(-9), T = new Int8Array(W * H), ow = o.crown == null ? 0.5 : o.crown, lw = o.leaf == null ? 1 : o.leaf;
    /* each pixel to the front-most clump that reaches it (its edge lobed): the clumps painted back to front */
    const own = new Int16Array(W * H).fill(-1), U = new Float32Array(W * H), Vb = new Float32Array(W * H), G = hdT_grid(W, H, cell, seed + 9);
    /* the leaf clusters first: a clump's edge follows them, bulging over a cluster's middle, so clumps meet along leafy edges */
    const LC = new Float32Array(W * H), GP = new Uint8Array(W * H), D1 = new Float32Array(W * H), bx0 = Math.max(0, x0 - 3), bx1 = Math.min(W - 1, x1 + 3), by0 = Math.max(0, y0 - 3), by1 = Math.min(H - 1, y1 + 3);
    for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) { const k = y * W + x; if (F[k] < 0.25) continue; const C = hdT_cells(x, y, G); LC[k] = C[0]; GP[k] = C[1] ? 1 : 0; D1[k] = C[2]; }
    cl.forEach((c, i) => {
        const R = c.r * 1.07 + cell * 0.25; c.pc = Math.cos(i * 1.7); c.ps = Math.sin(i * 1.7);
        for (let y = Math.max(0, Math.floor(c.y - R)); y <= Math.min(H - 1, Math.ceil(c.y + R)); y++) for (let x = Math.max(0, Math.floor(c.x - R)); x <= Math.min(W - 1, Math.ceil(c.x + R)); x++) {
            const ddx = x + 0.5 - c.x, ddy = y + 0.5 - c.y, dd = ddx * ddx + ddy * ddy;
            if (dd > R * R) continue;
            const d = Math.sqrt(dd) || 1, u = ddx / d, v = ddy / d, u2 = u * u, v2 = v * v;
            const s5 = v * (5 * u2 * u2 - 10 * u2 * v2 + v2 * v2), c5 = u * (u2 * u2 - 10 * u2 * v2 + 5 * v2 * v2), r = c.r * (1 + 0.06 * (s5 * c.pc + c5 * c.ps));
            const k = y * W + x, re = r + (0.45 - D1[k]) * cell * 0.45;
            if (dd < re * re) { own[k] = i; U[k] = ddx / r; Vb[k] = ddy / r; }
        }
    });
    for (let y = Math.max(0, y0 - 3); y <= Math.min(H - 1, y1 + 3); y++) for (let x = Math.max(0, x0 - 3); x <= Math.min(W - 1, x1 + 3); x++) {
        const k = y * W + x, f = F[k];
        if (f < 0.25) continue;
        let best = own[k], bu = U[k], bv = Vb[k];
        if (best < 0) {
            /* between clumps: the nearest one's rim */
            let bd = 1e9;
            for (let i = 0; i < cl.length; i++) { const c = cl[i], ddx = x + 0.5 - c.x, ddy = y + 0.5 - c.y, d = Math.sqrt(ddx * ddx + ddy * ddy); if (d - c.r < bd) { bd = d - c.r; best = i; bu = ddx / (d || 1); bv = ddy / (d || 1); } }
        }
        /* the edge: out a little over a clump, in a little between clumps */
        const lc = LC[k], gap = GP[k], d1 = D1[k];
        if (f < (own[k] >= 0 ? 0.32 : 0.62) + (gap ? 0.14 : 0) - lc * 0.12) continue;
        s.part[k] = ids[best];
        const c = cl[best];
        V[k] = hdT_ball(bu, bv) + (c.g * 0.75 + hdT_ball((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry) * 0.25) * ow * 2 + lc * 0.15;
        T[k] = gap ? (hdT_h(x >> 2, y >> 2, seed + 4) < (bu + bv > 0 ? 0.7 : 0.35) ? -1 : 0) : lc > 0.2 && d1 < 0.48 && bu + bv < 0.2 ? 1 : 0;
    }
    /* the underside of a clump, where it tucks behind the one in front, falls into shade */
    const L = new Float32Array(W * H), pi = ids[0], sd = o.seam == null ? 3 : o.seam;
    const P = s.part, pe = pi + ids.length;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const i = y * W + x, p = P[i]; if (V[i] <= -9) continue;
        let m = 0;
        for (let dy = 1; dy <= sd && y + dy < H; dy++) for (let dx = -1; dx <= 2; dx++) {
            if (x + dx < 0 || x + dx >= W) continue;
            const q = P[i + dy * W + dx]; if (q > p && q < pe) m = Math.max(m, 1 - (dy - 1 + Math.max(0, dx - 1)) / sd);
        }
        L[i] = m;
    }
    for (let i = 0; i < W * H; i++) if (V[i] > -9) V[i] -= L[i] * (o.seamK == null ? 0.35 : o.seamK);
    const sh = hdT_tone(s, V, o.mix, T, lw, seed);
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
        const dd = d * (0.8 + hdT_h(x >> 2, 1, 9) * 0.4);
        for (let k = 1; k <= dd; k++) { const p = s.part[(y + k) * W + x]; if (p >= 0 && !set.has(p)) s.mod(x, y + k, k <= dd * 0.45 ? -2 : -1); }
    }
}

/* winter: snow lying on the crown's top (thick where it's flat, none where it's steep), thin caps on the clumps' upper
   rims, a few flakes caught in the leaves. o: { th (thickness), reach (how far down, 0..1 of the crown), rim, flakes } */
function hdT_snow(s, c, o) {
    o = o || {};
    const W = s.w, set = new Set(c.ids), snow = s.add(hdT_SNOW, { layer: 9, R: 2, grad: 0.05, bias: 0.16, cast: 1 });
    const [x0, y0, x1, y1] = c.box, reach = y0 + (y1 - y0) * (o.reach || 0.55), rim = y0 + (y1 - y0) * (o.rim || 0.5), TH = o.th || 8;
    const cells = [];
    for (let y = y0; y < reach; y++) for (let x = x0; x <= x1; x++) {
        const p = s.at(x, y); if (!set.has(p)) continue;
        /* lying on top: open sky within th pixels straight up or up a slope (so the sides get less) */
        const th = TH * (1 - 0.55 * (y - y0) / (reach - y0)) + (hdT_h(x >> 1, 2, 5) - 0.5) * 2;
        let on = false;
        for (let k = 1; k <= th && !on; k++) { const dk = Math.round(0.6 * k); if (s.at(x, y - k) < 0 || s.at(x - dk, y - k) < 0 || s.at(x + dk, y - k) < 0) on = true; }
        /* a cap where a clump's top rim shows against the clump behind (the rim flat enough to hold it) */
        if (!on && y < rim && hdT_h(x >> 3, y >> 2, 6) > 0.35) for (let k = 1; k <= (y < (y0 + rim) / 2 ? 3 : 2) && !on; k++) {
            const q = s.at(x, y - k), ql = s.at(x - 3, y - k), qr = s.at(x + 3, y - k);
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

/* ---------------------------------------------------------------- pines: four tiers of needles (today's three are one tree) */
const hdT_PINE = hdPal('#10362a', '#185238', '#23704a', '#2f8a5a', '#4aa874');
const hdT_PINE_W = hdPal('#132f27', '#1f4a3a', '#2f604e', '#3f7a62', '#548f74');
/* tiers: [top of the part (hidden under the tier above), visible top, half width there, bottom, half width at the bottom] */
const hdT_TIERS = [[0, 0, 4.5, 20, 16.5], [14, 21, 13.5, 38, 25.5], [32, 39, 15, 59, 34.5], [53, 60, 18, 80, 40.5]];
/* a tiered pine: cx the middle, tiers as above (scaled by k about the top), each tier a part in front of the one below;
   needles in drooping rows like a fishbone, lit from the left, shaded under the tier above; snow on the shoulders */
function hdT_pine(s, cx, tiers, o) {
    o = o || {};
    const W = s.w, seed = o.seed || 3, mat = o.mat || hdT_PINE, dy = o.dy || 0;
    const ids = tiers.map((t, i) => s.add(mat, { layer: 10 - i, flat: 1, grad: 0, bias: 0 }));
    const V = new Float32Array(W * s.h).fill(-9), T = new Int8Array(W * s.h);
    tiers.forEach(([ya, yt, wt, yb, wb], i) => {
        ya += dy; yt += dy; yb += dy;
        for (let y = Math.floor(ya); y <= yb + 3; y++) {
            const f = Math.max(0, (y - yt) / (yb - yt)), hw0 = y < yt ? wt * Math.max(0.15, (y - ya + 1) / (yt - ya + 1)) : wt + (wb - wt) * Math.min(1, f);
            /* needle bunches jut out along the sides */
            const tooth = ((y - yt + 600 + i * 2) % 6) / 6, hw = hw0 + (tooth < 0.5 ? tooth * 3.4 : (1 - tooth) * 3.4) - 0.8 + (hdT_h(y, i, seed) - 0.5) * 0.8;
            for (let x = Math.floor(cx - hw - 1); x <= Math.ceil(cx + hw + 1); x++) {
                const u = (x + 0.5 - cx) / hw0;
                if (Math.abs(x + 0.5 - cx) > hw) continue;
                /* the bottom: a row of needle tips, drooping toward the ends */
                const tip = yb + Math.abs(u) * 1.6 + (((x + i) % 4 + 4) % 4 < 2 ? 1.5 : 0) + (hdT_h(x >> 1, i, seed + 1) - 0.5);
                if (y > tip) continue;
                if (s.at(x, y) >= 0 && s.at(x, y) < ids[0] + tiers.length && s.at(x, y) >= ids[0] && s.at(x, y) < ids[i]) continue;
                s.plot(ids[i], x, y);
                /* needle rows: lines sloping down and out from the middle, a gap every 4 */
                const w = y - Math.abs(x + 0.5 - cx) * 0.5 + hdT_h(Math.floor((y - Math.abs(x - cx) * 0.5) / 5), x >> 3, seed + 2) * 1.5, m = ((w % 5) + 5) % 5;
                V[y * W + x] = -u * 0.8 + (y < yt ? 0.1 : 0.2 - f * 0.25) + (m < 1 ? -0.12 : 0) + (tip - y < 2 ? -0.6 : tip - y < 4 ? -0.25 : 0);
                T[y * W + x] = m < 1 && hdT_h(x, y, seed + 3) < 0.75 ? (u > -0.4 ? -1 : 0) : m > 1.2 && m < 2.4 && u < 0.2 && hdT_h(x, y, seed + 4) < 0.6 ? 1 : 0;
            }
        }
    });
    /* each tier in the shade of the one above it, just under its needle tips */
    for (let y = 0; y < s.h; y++) for (let x = 0; x < W; x++) {
        const p = s.at(x, y), i = p - ids[0]; if (i <= 0 || i >= tiers.length) continue;
        for (let k = 1; k <= 6; k++) { const q = s.at(x, y - k); if (q === ids[i - 1]) { V[y * W + x] -= k <= 2 ? 1.4 : 0.55; break; } if (q !== p) break; }
    }
    hdT_tone(s, V, o.mix || [0.12, 0.4, 0.8], T, 1, seed);
    return { ids, tops: tiers.map(t => t[1] + dy), bots: tiers.map(t => t[3] + dy), box: [Math.round(cx - tiers[tiers.length - 1][4] - 3), Math.round(tiers[0][0] + dy), Math.round(cx + tiers[tiers.length - 1][4] + 3), Math.round(tiers[tiers.length - 1][3] + dy + 3)] };
}
/* snow on a pine: on each tier's shoulders and its top, open sky (or the tier above) just over it */
function hdT_pineSnow(s, c, o) {
    o = o || {};
    const W = s.w, ids = c.ids, set = new Set(ids), snow = s.add(hdT_SNOW, { layer: 20, R: 2, grad: 0.05, bias: 0.16, cast: 1 }), cells = [];
    for (let y = c.box[1]; y <= c.box[3]; y++) for (let x = c.box[0]; x <= c.box[2]; x++) {
        const p = s.at(x, y); if (!set.has(p)) continue;
        const i = p - ids[0], top = c.tops[i], th = o.th || 3.5;
        /* a cap on the top; a band on each tier's shoulders, just under the tier above and out to its tips */
        let on = i === 0 && y < top + 7 - Math.abs(x - 48) * 0.6;
        if (i > 0 && y >= c.bots[i - 1] && y <= c.bots[i - 1] + th + 1 + Math.abs(x - 48) * 0.04) on = true;
        for (let k = 1; k <= th + 1 && !on; k++) { const q = s.at(x, y - k); if ((set.has(q) && q < p && k <= th) || (q < 0 && y < top + 7 && k <= 2)) on = true; }
        if (on && hdT_h(x >> 1, y >> 2, 4) > 0.08) cells.push(x, y);
    }
    for (let i = 0; i < cells.length; i += 2) s.plot(snow, cells[i], cells[i + 1]);
}
function hdT_pineTree(s, season, v) {
    hdT_trunk(s, hdT_BARK, 48, 80, 112, 13, { flare: 2, streaks: 2 });
    const k = [1, 0.97, 1.03][v], tiers = hdT_TIERS.map(([ya, yt, wt, yb, wb]) => [ya, yt, wt * k, yb, wb * k]);
    const c = hdT_pine(s, 48.5, tiers, { seed: 5 + v * 3, mat: season === 'winter' ? hdT_PINE_W : hdT_PINE });
    hdT_under(s, c, 6);
    if (season === 'winter') hdT_pineSnow(s, c);
}
for (const se of ['spring', 'summer', 'fall', 'winter']) for (let v = 0; v < 3; v++) HD_SPR[`tree_pine_${se}_${v}`] = { w: 96, h: 120, ax: 48, ay: 111, draw(s) { hdT_pineTree(s, se, v); } };

/* ---------------------------------------------------------------- the big tree by the plaza */
const hdT_BIG = '1:36-38|31-40|26-41|18-42|17-42|16-43|15-43|14-50|14-52|14-53|14-54|14-54|13-54|11-54|8-54|7-53|6-53|5-53|5-53|5-54|6-55|6-56|7-57|7-58|8-58|8-59|8-58|7-58|7-58|6-57|6-57|6-56|5-56|5-55|6-56|6-56|7-57|8-56|9-56|9-55|9-53|10-53|10-52|11-52|14-51|15-51|16-50|16-48|17-41|18-41|19-26,30-40|20-24,32-39';
/* a root reaching out over the ground from the trunk's foot: a tapering line, lit on top */
function hdT_root(s, id, x0, y0, x1, y1, r) { s.line(id, x0, y0, x1, y1, r, Math.max(0.6, r * 0.35)); }
function hdT_bigTree(s, season) {
    const bark = s.add(hdT_BARK, { layer: 0, R: 3, grad: 0.05, k: 1.6 });
    hdT_root(s, bark, 86, 199, 70, 205, 3.5); hdT_root(s, bark, 106, 200, 118, 205, 3);
    const t = hdT_trunk(s, hdT_BARK, 96, 150, 204, 28, { flare: 4, streaks: 5, flareAt: 0.75, layer: 1 });
    /* the old crack that runs down the trunk into the root on the left */
    for (let i = 0; i <= 30; i++) { const x = 104 - i * 0.62, y = 177 + i * 0.75 + Math.sin(i * 0.5) * 0.8; s.mod(x, y, -2); if (i % 3) s.mod(x + 1, y, 1); }
    const c = hdT_crown(s, hdT_BIG, { mat: hdT_LEAF[season], sp: 44, cell: 7.5, seed: 41, layer: 2, crown: 0.7 });
    hdT_under(s, c, 14);
    if (season === 'winter') hdT_snow(s, c, { th: 10, flakes: 40 });
}
for (const se of ['spring', 'summer', 'fall', 'winter']) HD_SPR[`tree_big_${se}`] = { w: 192, h: 216, ax: 96, ay: 204, draw(s) { hdT_bigTree(s, se); } };

/* ---------------------------------------------------------------- fruit trees, blossom trees and the money tree (the fruit
   hangs on at fixed spots, 20_world.js makeFruitTree: the crown stays where today's is) */
const hdT_FRUIT = '2:17-21|9-22|8-22|7-23|6-23|6-26|6-27|6-28|4-28|3-28|2-28|2-28|2-27|3-27|4-27|4-27|4-27|4-27|4-27|5-27|5-26|6-25|7-24|8-20|10-13,15-20|16-19|18-18';
const hdT_BLOSSOM = '1:17-19|15-20|10-21|8-21|7-22|6-25|5-26|5-27|5-27|5-27|5-27|4-27|3-27|2-28|2-28|2-28|3-28|4-28|5-28|5-28|5-27|5-26|6-24|7-22|8-22|10-13,16-21|18-20|19-19';
const hdT_MONEY = '2:15-20|8-21|7-22|7-23|7-24|6-24|6-26|5-27|4-28|3-29|2-28|2-28|3-27|3-27|3-27|4-27|4-28|4-28|5-27|5-27|5-26|6-25|6-23|7-22|13-19|15-18';
const hdT_PINK = hdPal('#9a4f6c', '#c7708f', '#e894b3', '#f7b8cf', '#ffdbe8');
const hdT_GOLD = hdPal('#7e5512', '#b8861f', '#d9a830', '#f2c94c', '#ffe68a');
/* a round tree on a silhouette: trunk, crown, the crown's shade on the trunk, snow in winter */
function hdT_round(s, spec, mat, season, seed, o) {
    o = o || {};
    hdT_trunk(s, hdT_BARK, 47.5, 72, 112, o.tw || 14, { flare: 2.5 });
    const c = hdT_crown(s, spec, Object.assign({ mat, sp: 22, cell: 6.5, seed, layer: 2 }, o.crown || {}));
    hdT_under(s, c);
    if (season === 'winter') hdT_snow(s, c);
    return c;
}
/* blossoms: small five-petal flowers dotted over the lit side of a crown */
function hdT_flowers(s, c, n, petal, eye, seed, lit) {
    const set = new Set(c.ids), [x0, y0, x1, y1] = c.box;
    for (let i = 0; i < n; i++) {
        const x = Math.round(x0 + 5 + hdT_h(i, 1, seed) * (x1 - x0 - 10)), y = Math.round(y0 + 5 + hdT_h(i, 2, seed) * (y1 - y0 - 12));
        if (!set.has(s.at(x, y)) || !set.has(s.at(x - 2, y)) || !set.has(s.at(x + 2, y)) || !set.has(s.at(x, y + 2)) || c.sh[y * s.w + x] < (lit == null ? 3 : lit)) continue;
        for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) s.px(x + dx, y + dy, petal);
        s.px(x, y, eye);
    }
}
for (const se of ['spring', 'summer', 'fall', 'winter']) {
    HD_SPR[`tree_fruit_${se}`] = { w: 96, h: 120, ax: 48, ay: 111, draw(s) { hdT_round(s, hdT_FRUIT, hdT_LEAF[se], se, 23); } };
    HD_SPR[`tree_blossom_${se}`] = { w: 96, h: 120, ax: 48, ay: 111, draw(s) {
        const c = hdT_round(s, hdT_BLOSSOM, se === 'spring' ? hdT_PINK : hdT_LEAF[se], se, 31);
        if (se === 'spring') hdT_flowers(s, c, 26, '#fff4f8', '#f2a0bd', 5);
    } };
}
HD_SPR.tree_money = { w: 96, h: 120, ax: 48, ay: 111, draw(s) {
    const c = hdT_round(s, hdT_MONEY, hdT_GOLD, 'summer', 37);
    /* a few glints: it is a money tree */
    for (let i = 0; i < 9; i++) {
        const x = Math.round(c.box[0] + 8 + hdT_h(i, 4, 3) * (c.box[2] - c.box[0] - 16)), y = Math.round(c.box[1] + 6 + hdT_h(i, 5, 3) * (c.box[3] - c.box[1] - 14));
        if (c.sh[y * s.w + x] >= 3 && c.ids.includes(s.at(x, y - 1)) && c.ids.includes(s.at(x, y + 1))) { s.px(x, y, '#ffffff'); s.px(x - 1, y, '#fff6c8'); s.px(x + 1, y, '#fff6c8'); s.px(x, y - 1, '#fff6c8'); s.px(x, y + 1, '#fff6c8'); }
    }
} };

/* the fruit hung on the trees (18x18, the middle on the anchor): small, a stem and a leaf where the fruit has them */
const hdT_LEAFLET = hdPal('#2c5a2a', '#3f8a48', '#53a855', '#6cc563', '#9be083');
const hdT_STEM = hdPal('#3a2618', '#5a3c24', '#7a5234', '#9a6b45', '#b8845a');
function hdT_fruit(s, kind) {
    const P = {
        apple: hdPal('#7a1420', '#b8202e', '#e0333f', '#ee5a5f', '#f7a0a4'),
        cherry: hdPal('#6e0e22', '#a81a32', '#d8283f', '#ea5262', '#f6a2ac'),
        coconut: hdPal('#2e1c10', '#553820', '#7a5230', '#94683f', '#af8a63'),
        lychee: hdPal('#741526', '#ab2236', '#d9364a', '#e8606e', '#f4a2aa'),
        mango: hdPal('#a0581a', '#e89a2a', '#ffc53a', '#ffd768', '#ffeaa8'),
        peach: hdPal('#a8503e', '#e8826a', '#ffa98a', '#ffc0a6', '#ffdccc'),
    }[kind];
    if (kind === 'cherry') {
        /* a pair on stems that meet at the top */
        const st = s.add(hdT_STEM, { layer: 1, R: 1 }), a = s.add(P, { layer: 2, R: 3, grad: 0.2 }), b = s.add(P, { layer: 3, R: 3, grad: 0.2 });
        s.line(st, 9, 2, 5.5, 9, 0.6); s.line(st, 9, 2, 12, 10, 0.6);
        s.ellipse(a, 5.3, 12.4, 4.6, 4.6); s.ellipse(b, 12.4, 12.8, 4.6, 4.6);
        const lf = s.add(hdT_LEAFLET, { layer: 4, R: 1.5 }); s.ellipse(lf, 11.5, 2.5, 2.6, 1.4);
        s.px(4, 10, '#ffd0d6'); s.px(10.5, 10.5, '#ffd0d6');
        return;
    }
    const body = s.add(P, { layer: 2, R: 4, grad: 0.22, k: 1.4 });
    if (kind === 'mango') { s.ellipse(body, 9, 9.6, 7, 7.8); s.ellipse(body, 10.4, 11, 6.4, 6.2); }
    else s.ellipse(body, 9, 10, 7.8, 7.4);
    if (kind === 'apple' || kind === 'peach') {
        /* the dimple on top, a stem and a leaf */
        s.erase(9, 4); s.mod(9, 5, -1); s.mod(8, 5, -1);
        const st = s.add(hdT_STEM, { layer: 3, R: 1 }); s.line(st, 9, 5, 10, 1.5, 0.6);
        const lf = s.add(hdT_LEAFLET, { layer: 4, R: 1.5 }); s.ellipse(lf, 12.5, 3, 2.6, 1.3);
        if (kind === 'peach') s.each(body, (x, y) => { if (Math.abs(x - 7.5 - (y - 5) * 0.15) < 0.6 && y > 5 && y < 14) s.mod(x, y, -1); });
        s.px(6, 7, kind === 'apple' ? '#ffd6d8' : '#fff0e8'); s.px(7, 7, kind === 'apple' ? '#f7a0a4' : '#ffdccc');
    }
    if (kind === 'lychee') { s.each(body, (x, y) => { if ((x + (y % 2) * 1) % 2 === 0 && y % 2 === 0) s.mod(x, y, -1); }); s.px(6, 7, '#f8c4ca'); }
    if (kind === 'coconut') { s.each(body, (x, y) => { if (hdT_h(x, y >> 1, 4) < 0.3) s.mod(x, y, -1); }); for (const [x, y] of [[7, 6], [11, 6], [9, 8.5]]) s.px(x, y, '#2e1c10'); s.px(6, 5, '#c9a582'); }
    if (kind === 'mango') { s.each(body, (x, y) => { if (x + y * 1.2 > 25) s.recolor(x, y, hdPal('#7a3012', '#c8502a', '#ec7a3a', '#f7964e', '#ffc08a')); }); s.px(7, 6, '#fff4cc'); }
}
for (const k of ['apple', 'cherry', 'coconut', 'lychee', 'mango', 'peach']) HD_SPR[`tfruit_${k}`] = { w: 18, h: 18, ax: 9, ay: 9, draw(s) { hdT_fruit(s, k); } };

/* money bags: a tied cloth sack with a coin mark (the big one dug up, the small one shaken from the money tree) */
const hdT_SACK = hdPal('#7a5a36', '#c9a47a', '#d9b88a', '#e8cc9e', '#f6e2bc');
const hdT_ROPE = hdPal('#3e2614', '#6a4628', '#8a6038', '#a87a4c', '#c49564');
function hdT_bag(s, big) {
    /* g: [middle x, body middle y, body half width, half height, rope y, rope half width, knob top, knob half width] */
    const g = big ? [24, 31, 14.5, 10.2, 18, 8.5, 9, 5.5] : [12, 16, 9, 6, 6.5, 5.5, 1, 3], [cx, cy, rx, ry, ty, tw, kt, kw] = g;
    const sack = s.add(hdT_SACK, { layer: 1, R: big ? 8 : 4, grad: 0.3, k: 1.2 }), knob = s.add(hdT_SACK, { layer: 2, R: big ? 3 : 1.5, grad: 0.2, bias: -0.04, cast: 1 }), rope = s.add(hdT_ROPE, { layer: 3, R: 1.2, grad: 0.1, cast: 1 });
    /* a sack: boxy below (it sits on the ground), narrowing up to the tie */
    for (let y = Math.floor(ty); y <= cy + ry; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
        const v = (y + 0.5 - cy) / ry, w = v < 0 ? rx - (rx - tw) * Math.pow(-v * ry / (cy - ty), 1.6) : rx * Math.pow(1 - Math.pow(v, 3.2), 1 / 3.2);
        if (Math.abs(x + 0.5 - cx) <= w) s.plot(sack, x, y);
    }
    /* the gathered cloth above the tie, flaring a little at the top */
    s.poly(knob, [[cx - kw * 0.75, ty + 1], [cx - kw * 1.05, kt + 2], [cx - kw * 0.55, kt], [cx, kt + 1], [cx + kw * 0.55, kt], [cx + kw * 1.05, kt + 2], [cx + kw * 0.75, ty + 1]]);
    s.rect(rope, Math.round(cx - tw * 0.85), Math.round(ty), Math.round(tw * 1.7), big ? 3 : 2);
    if (big) {
        /* folds running up to the tie, the knot's loose end */
        s.each(sack, (x, y) => { const u = (x + 0.5 - cx) / rx, v = (cy - y) / ry; if (v > -0.2 && (Math.abs(u + 0.36 - v * 0.1) < 0.035 || Math.abs(u - 0.4 + v * 0.12) < 0.035)) s.mod(x, y, -1); });
        s.line(rope, cx + 7, ty + 2.5, cx + 9, ty + 6, 0.8, 0.5);
        /* the coin mark: a pale rounded cross, as today */
        const mk = s.add(hdPal('#b8946a', '#efdcb0', '#f8ead0', '#fbeec7', '#fffaf0'), { layer: 4, R: 2, grad: 0.15, bias: 0.12 });
        s.rect(mk, cx - 3, cy - 7, 6, 13); s.rect(mk, cx - 6, cy - 3.5, 12, 6); s.ellipse(mk, cx, cy - 0.5, 4.6, 4.6);
    } else { s.px(cx + 1, cy, '#fbeec7'); s.px(cx + 2, cy, '#fbeec7'); s.px(cx + 1, cy + 1, '#efdcb0'); s.px(cx + 2, cy + 1, '#efdcb0'); }
}
HD_SPR.money_bag = { w: 48, h: 48, ax: 24, ay: 39, draw(s) { hdT_bag(s, true); } };
HD_SPR.money_bag_s = { w: 24, h: 24, ax: 12, ay: 21, draw(s) { hdT_bag(s, false); } };

/* ---------------------------------------------------------------- palms: a ringed, gently bent trunk under drooping fronds */
const hdT_PALMLEAF = hdPal('#1f5a30', '#3e8e4a', '#4fae55', '#7fcf6e', '#a8e28c');
const hdT_PALMBARK = hdPal('#4a3220', '#7d5634', '#9c7043', '#b98a57', '#d0a46e');
/* a point on a quadratic curve */
const hdT_q = (p, t) => [(1 - t) * (1 - t) * p[0][0] + 2 * (1 - t) * t * p[1][0] + t * t * p[2][0], (1 - t) * (1 - t) * p[0][1] + 2 * (1 - t) * t * p[1][1] + t * t * p[2][1]];
/* a frond along curve p (base, bend, tip), w at its widest: a band narrow at the stem and the tip, leaflets hanging from
   its lower edge, the midrib a dark line */
function hdT_frond(s, id, p, w, seed, plain) {
    const n = 60, pts = [];
    for (let i = 0; i <= n; i++) pts.push(hdT_q(p, i / n));
    for (let i = 0; i <= n; i++) {
        const t = i / n, [x, y] = pts[i], [x2, y2] = pts[Math.min(n, i + 1)], [x1, y1] = pts[Math.max(0, i - 1)];
        let dx = x2 - x1, dy = y2 - y1; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
        let nx = -dy, ny = dx; if (ny < 0 || (ny === 0 && nx < 0)) { nx = -nx; ny = -ny; }      /* the normal pointing down */
        const ww = w * Math.min(1, Math.sin(Math.PI * Math.min(0.98, Math.pow(t, 0.75))) * 1.25) * (t < 0.1 ? 0.45 + t * 5.5 : 1);
        /* the upper edge smooth, the lower one cut into short leaflets slanting back toward the tip */
        const tooth = plain ? 0 : (((i + seed) % 5) < 3 ? ww * 0.38 : 0) * (t > 0.08 ? 1 : 0);
        for (let k = -ww * 0.5; k <= ww * 0.5 + tooth; k += 0.5) { const b = Math.max(0, k - ww * 0.3); s.plot(id, x + nx * k + dx * b * 0.6, y + ny * k + dy * b * 0.6); }
    }
    /* the midrib, and the cuts between leaflets */
    for (let i = 3; i < n - 3; i++) { const [x, y] = pts[i]; s.mod(x, y - 1, -1); }
}
function hdT_palm(s, nuts) {
    /* the trunk: rings every 9 px, bending a little toward the top right */
    const tr = s.add(hdT_PALMBARK, { layer: 1, R: 4, grad: 0.05, k: 1.6 });
    for (let y = 50; y <= 134; y++) {
        const t = (134 - y) / 84, xc = 65 + Math.pow(t, 1.5) * 8.5, hw = 7.4 - t * 1.4 + (y > 129 ? (y - 129) * 0.35 : 0);
        for (let x = Math.floor(xc - hw); x <= Math.ceil(xc + hw); x++) if (Math.abs(x + 0.5 - xc) <= hw) {
            s.plot(tr, x, y);
            /* each ring: a lighter lip on top, a dark seam under it, the band bulging a little */
            const r = ((y - 50) % 9 + 9) % 9;
            if (r === 0) s.mod(x, y, -1); else if (r <= 2) s.mod(x, y, 1); else if (r === 8 && Math.abs(x + 0.5 - xc) > hw - 1.5) s.mod(x, y, -1);
        }
    }
    const L = (layer, bias) => s.add(hdT_PALMLEAF, { layer, R: 3, grad: 0.2, k: 1.4, bias: bias || 0, cast: 1 });
    /* a young frond hanging down the trunk's right side */
    hdT_frond(s, L(2, -0.04), [[73, 52], [76, 72], [73, 92]], 3.4, 0, true);
    /* back fronds (darker), the hanging ones, then the two big ones on top, their tips curling down */
    hdT_frond(s, L(3, -0.14), [[66, 50], [44, 34], [22, 48]], 10, 1);
    hdT_frond(s, L(3, -0.14), [[74, 50], [96, 34], [118, 48]], 10, 2);
    if (nuts) {
        const nut = s.add(hdPal('#2e1c10', '#5a3c22', '#7a5230', '#9c7043', '#b48a5c'), { layer: 4, R: 3.5, grad: 0.2, k: 1.4 });
        for (const [x, y, r] of [[66, 57, 5.4], [80, 57, 5.2], [73, 62, 5.6], [72, 53, 5]]) s.ellipse(nut, x, y, r, r * 0.95);
        s.px(63, 54, '#c9a582'); s.px(78, 54, '#c9a582'); s.px(70, 59, '#c9a582'); s.px(70, 50, '#c9a582');
    }
    hdT_frond(s, L(5), [[68, 54], [46, 58], [32, 80]], 11, 0);
    hdT_frond(s, L(5), [[74, 54], [96, 58], [109, 80]], 11, 1);
    hdT_frond(s, L(4, -0.06), [[70, 52], [60, 34], [48, 36]], 9, 1);
    hdT_frond(s, L(4, -0.06), [[72, 52], [82, 34], [94, 36]], 9, 3);
    /* where the fronds spring from: a knot of frond bases */
    const crown = L(5, -0.02); s.ellipse(crown, 71, 47, 9, 6); s.ellipse(crown, 64, 44, 6, 5); s.ellipse(crown, 78, 44, 6, 5);
    hdT_frond(s, L(6, 0.05), [[70, 50], [44, 27], [25, 57]], 13, 2);
    hdT_frond(s, L(6, 0.05), [[72, 50], [98, 27], [116, 57]], 13, 0);
}
HD_SPR.palm_0 = { w: 120, h: 144, ax: 66, ay: 135, draw(s) { hdT_palm(s, false); } };
HD_SPR.palm_1 = { w: 120, h: 144, ax: 66, ay: 135, draw(s) { hdT_palm(s, true); } };

/* ---------------------------------------------------------------- bushes, saplings and young trees (the forest's growing ones) */
const hdT_BUSH = '1:6-8,11-13|5-14|5-14|4-15|3-15|2-17|2-18|2-18|2-17|3-16|3-16|3-16|3-16|4-15|7-13';
const hdT_SAPLING = '2:9-9|8-10|7-14|5-15|4-15|3-15|3-16|4-16|3-16|3-16|3-15|4-14|5-14|6-14';
const hdT_YOUNG = '2:12-13|11-15|10-17|6-20|5-21|5-22|5-22|5-22|5-22|5-22|4-23|4-24|4-24|4-23|4-22|5-21|6-21|8-20|8-19|8-11,15-18';
for (const se of ['spring', 'summer', 'fall', 'winter']) {
    HD_SPR[`bush_${se}`] = { w: 60, h: 48, ax: 30, ay: 42, draw(s) {
        const c = hdT_crown(s, hdT_BUSH, { mat: hdT_LEAF[se], sp: 15, cell: 5, seed: 51, layer: 2 });
        if (se === 'spring') hdT_flowers(s, c, 16, '#ff9ec0', '#ffe4ef', 8, 2);
        if (se === 'winter') hdT_snow(s, c, { th: 6, flakes: 6, reach: 0.6 });
    } };
    HD_SPR[`sapling_${se}`] = { w: 60, h: 78, ax: 30, ay: 72, draw(s) {
        hdT_trunk(s, hdT_BARK, 30, 40, 73, 8, { flare: 1, streaks: 1 });
        const c = hdT_crown(s, hdT_SAPLING, { mat: hdT_LEAF[se], sp: 14, cell: 5, seed: 61, layer: 2 });
        hdT_under(s, c, 5);
        if (se === 'winter') hdT_snow(s, c, { th: 5, flakes: 5 });
    } };
    HD_SPR[`young_${se}`] = { w: 84, h: 102, ax: 42, ay: 96, draw(s) {
        hdT_trunk(s, hdT_BARK, 40.5, 56, 97, 11, { flare: 1.5, streaks: 2 });
        const c = hdT_crown(s, hdT_YOUNG, { mat: hdT_LEAF[se], sp: 18, cell: 5.5, seed: 71, layer: 2 });
        hdT_under(s, c, 7);
        if (se === 'winter') hdT_snow(s, c, { th: 6, flakes: 9 });
    } };
}

/* ---------------------------------------------------------------- stumps: what the axe leaves (an oak's rings, a palm's fibres) */
function hdT_stump(s, palm) {
    const bark = s.add(palm ? hdPal('#4a3220', '#7a5234', '#9a6b45', '#b8845a', '#c99a68') : hdT_BARK, { layer: 1, R: 7, grad: 0.05, k: 1.5 });
    const top = s.add(palm ? hdPal('#7a5a3a', '#a8865c', '#c9a46a', '#d9b87e', '#ead096') : hdPal('#7a5634', '#b8845a', '#d9a86a', '#e8bf82', '#f4d6a0'), { layer: 2, R: 3, grad: 0.1, flat: 1, bias: 0.06 });
    const cx = 24, ty = 13, rx = 16.5, ry = 6.5, by = 33;
    /* roots flaring at the foot, the side, then the cut face on top */
    s.poly(bark, [[cx - rx, ty], [cx + rx, ty], [cx + rx + 0.5, by - 2], [cx + rx + 3, by + 1.5], [cx + rx - 3, by + 2.5], [cx, by + 3], [cx - rx + 3, by + 2.5], [cx - rx - 3, by + 1.5], [cx - rx - 0.5, by - 2]]);
    s.ellipse(bark, cx, by - 1, rx + 0.5, 3.5);
    s.ellipse(top, cx, ty, rx - 0.5, ry);
    if (palm) {
        /* a palm's trunk is rings of fibre: bands round the side, a stippled face */
        s.each(bark, (x, y) => { if (y > ty + 3 && (y - ty) % 6 === 0) s.mod(x, y, -1); else if (y > ty + 3 && (y - ty) % 6 === 1) s.mod(x, y, 1); });
        s.each(top, (x, y) => { if (hdT_h(x, y, 5) < 0.16) s.mod(x, y, -1); else if (hdT_h(x, y, 6) < 0.08) s.mod(x, y, 1); });
    } else {
        /* bark: wavy grooves down the side */
        for (let k = 0; k < 5; k++) { const bx = cx - rx + 4 + k * 6.4; for (let y = ty + 4; y < by + 2; y++) if (hdT_h(k, y >> 2, 3) > 0.2) s.mod(bx + Math.sin(y * 0.5 + k) * 0.7, y, -1); }
        /* growth rings on the face, and a crack from the heart */
        s.each(top, (x, y) => { const d = Math.hypot(x + 0.5 - cx, (y + 0.5 - ty) * rx / ry); if (Math.abs(d - 5.2) < 0.75 || Math.abs(d - 10.4) < 0.75 || d < 1.2) s.mod(x, y, -1); else if (d > rx - 2.2) s.mod(x, y, 1); });
        for (let i = 0; i < 7; i++) s.mod(cx + 2 + i, ty + 0.5 + i * 0.4, -1);
    }
}
HD_SPR.stump = { w: 48, h: 42, ax: 24, ay: 36, draw(s) { hdT_stump(s, false); } };
HD_SPR.stump_palm = { w: 48, h: 42, ax: 24, ay: 36, draw(s) { hdT_stump(s, true); } };

/* ---------------------------------------------------------------- the old giants of the forest: two great broadleaves (one
   with a hollow) and a tall pine, standing on spreading roots, moss at their feet */
const hdT_OLD = [
    '0:27-38|20-40|19-42|15-44|13-45|12-49|12-51|11-52|11-53|11-54|11-54|11-54|11-54|11-54|10-54|8-54|6-54|5-54|4-56|4-58|3-59|3-60|3-61|3-61|4-61|4-61|4-60|4-60|1-61|0-61|0-61|0-62|0-62|0-62|1-63|2-63|1-63|1-63|0-63|0-63|0-63|0-62|1-60|2-59|3-59|5-59|6-59|7-59|9-58|10-14,17-49,56-56|11-13,17-46|17-44|18-43|18-27,33-42|19-25,34-41|20-23,36-40|22-23',
    '0:23-41|23-42|23-43|22-43|13-44|12-50|11-51|11-52|11-53|11-53|11-53|11-53|11-53|11-53|10-53|9-53|7-54|6-55|5-57|4-59|3-60|3-60|3-61|3-61|3-61|4-60|4-60|3-61|2-62|1-62|0-62|0-62|1-62|1-61|1-61|1-62|1-63|0-63|0-63|0-63|0-63|0-62|1-60|3-60|4-59|5-59|5-58|6-57|7-56|9-13,17-47,51-54|17-45|18-44|18-44|19-28,34-43|20-26,35-42|21-24,37-41|22-23',
];
const hdT_OLDLEAF = {
    spring: hdPal('#28603a', '#357a42', '#46984b', '#58b85a', '#8fd57a'),
    summer: hdPal('#1a4628', '#245c34', '#317c40', '#3f9a4c', '#62b865'),
    fall: hdPal('#5e2a14', '#8a4222', '#b8602a', '#d9822f', '#f0b24a'),
    winter: hdPal('#24402f', '#33543f', '#436b56', '#56836a', '#77a088'),
};
const hdT_OLDBARK = hdPal('#33200f', '#5e3f28', '#8a6040', '#a87a52', '#c09068');
const hdT_OLDPINE = { spring: hdT_PINE, summer: hdT_PINE, fall: hdPal('#15362a', '#1f4a32', '#2f6242', '#3f7a52', '#5a9a6a'), winter: hdT_PINE_W };
/* roots spreading over the ground from a trunk's foot (x the middle, w its width, y the ground) */
function hdT_roots(s, id, x, w, y) {
    for (const [dx, ex, ey, r] of [[-0.4, -1.45, 3, 4.2], [-0.2, -0.95, 6, 3.6], [0.06, -0.15, 6.5, 3.2], [0.3, 0.8, 6, 3.6], [0.42, 1.4, 3.5, 4.2], [-0.32, -1.7, -0.5, 3], [0.38, 1.7, -0.5, 3]]) hdT_root(s, id, x + dx * w, y - 6, x + ex * w * 0.62, y + ey * 0.55, r);
}
function hdT_oldBroad(s, season, v) {
    const tx = 97.5, tw = 50, gy = 252;
    /* roots and the trunk: deep vertical furrows every few pixels */
    const root = s.add(hdT_OLDBARK, { layer: 0, R: 2.5, grad: 0.05, k: 1.5 });
    hdT_roots(s, root, tx, tw, gy);
    const tr = s.add(hdT_OLDBARK, { layer: 1, R: 14, grad: 0.04, k: 1.5 });
    for (let y = 150; y <= gy; y++) {
        const t = (y - 150) / (gy - 150), fl = Math.pow(Math.max(0, t - 0.82) / 0.18, 2) * 9;
        s.rect(tr, Math.round(tx - tw / 2 - fl), y, Math.round(tw + fl * 2), 1);
    }
    s.each(tr, (x, y) => {
        const u = x - tx + Math.sin(y * 0.11 + x * 0.05) * 1.4, f = ((u % 9) + 9) % 9;
        if (f < 1.3 && hdT_h(Math.floor(u / 9), y >> 3, 3) > 0.12) s.mod(x, y, -1);
        else if (f > 2 && f < 3.2 && hdT_h(Math.floor(u / 9), y >> 2, 4) > 0.5) s.mod(x, y, 1);
    });
    if (v === 1) {
        /* the hollow: a dark oval with a lit lower lip and a shaded upper one */
        const holl = s.add(hdPal('#0e0805', '#1a100a', '#2a1a12', '#3a2618', '#4a3222'), { layer: 2, R: 4, flat: 1, bias: -0.15 });
        s.ellipse(holl, 98.5, 190, 8, 13);
        s.each(holl, (x, y) => { if (Math.hypot((x + 0.5 - 98.5) / 6, (y + 0.5 - 192) / 10) < 1) s.mod(x, y, -1); });
        for (let x = 91; x <= 106; x++) { s.mod(x, 204 - Math.abs(x - 98.5) * 0.12, 1); s.mod(x, 175 + Math.abs(x - 98.5) * 0.25, -1); }
    }
    /* moss on the trunk's foot (snow in winter) */
    const moss = season === 'winter' ? '#f4f8fc' : '#6a9a4a', moss2 = season === 'winter' ? '#c8d5e4' : '#557d3a';
    for (let i = 0; i < 70; i++) {
        const x = Math.round(tx - tw / 2 + 2 + hdT_h(i, 1, 21) * (tw - 4)), y = Math.round(gy - 4 - Math.pow(hdT_h(i, 2, 21), 1.6) * 40);
        if (s.at(x, y) === tr && s.at(x + 1, y) === tr) { s.px(x, y, moss); if (i % 2) s.px(x + 1, y, moss2); }
    }
    const c = hdT_crown(s, hdT_OLD[v], { mat: hdT_OLDLEAF[season], sp: 46, cell: 7.5, seed: 81 + v, layer: 3, crown: 0.75 });
    hdT_under(s, c, 16);
    if (season === 'spring') { hdT_flowers(s, c, 60, '#ffe0ec', '#ffffff', 13 + v); hdT_flowers(s, c, 25, '#ffffff', '#ffd0e0', 17 + v); }
    if (season === 'winter') {
        hdT_snow(s, c, { th: 10, flakes: 0 });
        /* snow caught all over the crown, as today */
        for (let i = 0; i < 160; i++) {
            const x = Math.round(c.box[0] + 4 + hdT_h(i, 6, 23) * (c.box[2] - c.box[0] - 8)), y = Math.round(c.box[1] + 6 + hdT_h(i, 7, 23) * (c.box[3] - c.box[1] - 10));
            if (c.ids.includes(s.at(x, y)) && c.ids.includes(s.at(x, y + 1))) { s.px(x, y, '#ffffff'); s.px(x, y + 1, '#c8d5e4'); }
        }
    }
}
function hdT_oldPine(s, season) {
    const root = s.add(hdT_OLDBARK, { layer: 0, R: 2.5, grad: 0.05, k: 1.5 });
    hdT_roots(s, root, 96, 34, 252);
    const tr = hdT_trunk(s, hdT_OLDBARK, 96, 140, 252, 34, { flare: 6, streaks: 6, layer: 1 });
    const c = hdT_pine(s, 96.5, [[0, 0, 6, 29, 27], [22, 31, 15, 56, 43.5], [48, 60, 18, 86, 55.5], [78, 90, 21, 116, 67.5], [108, 120, 24, 146, 76.5]], { seed: 91, mat: hdT_OLDPINE[season] });
    hdT_under(s, c, 10);
    if (season === 'winter') hdT_pineSnow(s, c, { th: 4.5 });
}
for (const se of ['spring', 'summer', 'fall', 'winter']) for (let v = 0; v < 3; v++) HD_SPR[`tree_old_${se}_${v}`] = { w: 192, h: 270, ax: 96, ay: 255, draw(s) { if (v < 2) hdT_oldBroad(s, se, v); else hdT_oldPine(s, se); } };
