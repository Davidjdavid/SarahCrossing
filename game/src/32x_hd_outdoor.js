/* ---- 32x_hd_outdoor.js ---- */
/* HD things out on the island for the HD-2D view: wild and planted flowers, farm plots, holes and the dig spot, rocks,
   the props (logs, crates, fires, the ice cream stand, the volleyball net...), the critters (birds, butterflies,
   squirrels and the rest) and the small things found on the ground (shells, gems, fallen fruit), each today's sprite at
   three times the detail: the same frame, anchor, silhouette and colors, with the form, light and texture the extra
   pixels allow. Things cast their own shadows in 3D, so none draws one; the fish shadows and the dig spot stay
   see-through like today's. */

/* ---------------------------------------------------------------- helpers */
/* a small seeded hash in 0..1 (scatter that never changes) */
function hdE_h(x, y, k) { let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(k | 0, 1442695041); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }
/* smooth value noise (grain, mottling) */
function hdE_vn(x, y, k) {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hdE_h(ix, iy, k), b = hdE_h(ix + 1, iy, k), c = hdE_h(ix, iy + 1, k), d = hdE_h(ix + 1, iy + 1, k);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
/* every pixel of a part (x, y in the sprite's coordinates, i its index: texture passes write s.mods[i]) */
function hdE_each(s, id, fn) { const W = s.w; for (let y = 0; y < s.h; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (s.part[i] === id) fn(x - s.dx, y - s.dy, i); } }
/* a rounded rectangle */
function hdE_rr(s, id, x, y, w, h, r) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const cx = i < r ? r - i - 0.5 : i >= w - r ? i - (w - r) + 0.5 : 0, cy = j < r ? r - j - 0.5 : j >= h - r ? j - (h - r) + 0.5 : 0;
        if (cx * cx + cy * cy <= r * r + 0.5) s.plot(id, x + i, y + j);
    }
}
/* parts drawn in a sprite of their own and laid over this one as finished pixels (blooms over leaves, a plant over
   soil): what's under them keeps its whole form and outline */
function hdE_over(s, fn) {
    const o = new HDSprite(s.w, s.h); fn(o);
    const buf = o.render(), W = s.w;
    for (let i = 0; i < W * s.h; i++) if (buf[i * 4 + 3]) s.px(i % W - s.dx, ((i / W) | 0) - s.dy, [buf[i * 4], buf[i * 4 + 1], buf[i * 4 + 2]]);
}
/* a leaf or petal: a lens from (x0, y0) to the tip (x1, y1), w at its widest (at share m of the way), bent sideways by
   bend; notch cuts a V into a broad tip (cosmos) */
function hdE_leaf(s, id, x0, y0, x1, y1, w, m, bend, notch) {
    m = m == null ? 0.45 : m; bend = bend || 0;
    const L = Math.hypot(x1 - x0, y1 - y0) || 1, ux = (x1 - x0) / L, uy = (y1 - y0) / L, L1 = [], L2 = [], n = 12;
    for (let i = 0; i <= n; i++) {
        const t = i / n, hw = w * (t < m ? Math.pow(Math.sin(t / m * Math.PI / 2), 0.8) : Math.sqrt(Math.max(0, 1 - Math.pow((t - m) / (1 - m), 2.2))));
        const b = bend * Math.sin(t * Math.PI), cx = x0 + (x1 - x0) * t - uy * b, cy = y0 + (y1 - y0) * t + ux * b;
        L1.push([cx - uy * hw, cy + ux * hw]); L2.push([cx + uy * hw, cy - ux * hw]);
    }
    if (notch) { L1[n] = [x1 - uy * w * 0.55, y1 + ux * w * 0.55]; L2[n] = [x1 + uy * w * 0.55, y1 - ux * w * 0.55]; L1.push([x1 - ux * notch, y1 - uy * notch]); }
    s.poly(id, L1.concat(L2.reverse()));
}
/* a petal by angle around a center (y squashed by sy: a flower tipped a little toward us) */
function hdE_petal(s, id, cx, cy, a, r0, r1, w, sy, m, notch) {
    const c = Math.cos(a), sn = Math.sin(a) * (sy || 1);
    hdE_leaf(s, id, cx + c * r0, cy + sn * r0, cx + c * r1, cy + sn * r1, w, m, 0, notch);
}
/* light and dark specks in little clusters (soil, sand, stone), never single-pixel noise everywhere */
function hdE_speck(s, id, seed, dark, light, cell) {
    cell = cell || 2;
    hdE_each(s, id, (x, y, i) => { const r = hdE_h(Math.floor(x / cell), Math.floor(y / cell), seed), q = hdE_h(x, y, seed + 1); if (r < dark && q < 0.75) s.mods[i] -= 1; else if (r > 1 - light && q < 0.6) s.mods[i] += 1; });
}
/* wood grain along a plank (vertical for posts): streaks that run with the grain, a few lighter ones */
function hdE_wood(s, id, seed, vert, amt) {
    amt = amt == null ? 1 : amt;
    hdE_each(s, id, (x, y, i) => {
        const a = vert ? y : x, b = vert ? x : y, g = hdE_vn(a * 0.08 + b * 0.03, b * 0.8, seed);
        if (g < 0.24 * amt) s.mods[i] -= 1; else if (g > 1 - 0.07 * amt) s.mods[i] += 1;
    });
}
/* the finished picture made see-through (fish shadows in the water, the dig spot on the sand): alpha 0..255 */
function hdE_alpha(s, a) {
    const r0 = s.render.bind(s);
    s.render = (out, ox, OW) => {
        out = r0(out, ox, OW); OW = OW || s.w; ox = ox || 0;
        for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) { const o = (y * OW + ox + x) * 4 + 3; if (out[o] === 255) out[o] = a; }
        return out;
    };
}
/* register one drawing under several frame names: [name, w, h, ax, ay, args...] in today's pixels */
function hdE_reg(list, fn) { for (const [n, w, h, ax, ay, ...args] of list) HD_SPR[n] = { w: w * 3, h: h * 3, ax: ax * 3, ay: ay * 3, draw(s) { fn(s, ...args); } }; }

/* ---------------------------------------------------------------- shared colors */
const hdE_GREEN = '#4f9a3f', hdE_LEAFC = '#6cc063';
const hdE_WHITE = hdPal('#7c7490', '#cfcade', '#eeecf4', '#fbfaff', '#ffffff');
/* a ramp for a petal color: white gets a cool grey one (hdRamp would leave it flat) */
const hdE_pet = c => c === '#ffffff' ? hdE_WHITE : hdRamp(c);

/* ---------------------------------------------------------------- planted flowers (fl_*: the bloom on a stem with two leaves) */
/* the stem from the bloom down to the ground, a leaf out to each side as today's */
function hdE_stem(s, top) {
    const st = s.add(hdE_GREEN, { layer: 0, R: 1, k: 1.5, grad: 0.1 });
    s.line(st, 19.5, top, 19.5, 46.5, 1.3);
    const l1 = s.add(hdE_LEAFC, { layer: 1, R: 2, k: 1.4, grad: 0.1 }), l2 = s.add(hdE_LEAFC, { layer: 1, R: 2, k: 1.4, grad: 0.1 });
    hdE_leaf(s, l1, 19, 40.5, 10.5, 33, 3.4, 0.45, -1.2);
    hdE_leaf(s, l2, 20, 43, 28.5, 36.5, 3.1, 0.45, 1.1);
    /* the midribs */
    for (let t = 0.2; t < 0.85; t += 0.1) { s.mod(19 - 8.5 * t, 40.5 - 7.5 * t + 0.5, -1); s.mod(20 + 8.5 * t, 43 - 6.5 * t + 0.5, -1); }
}
/* a daisy: a ring of slim petals (every other one over its neighbors) round a domed middle */
function hdE_daisy(s, pet, eye) {
    hdE_stem(s, 26);
    const P = hdE_pet(pet), cx = 19.5, cy = 18.5;
    for (let i = 0; i < 14; i++) {
        const a = i / 14 * Math.PI * 2 - Math.PI / 2, p = s.add(P, { layer: 1 + (i % 2), R: 2, k: 1.3, grad: 0.05 });
        hdE_petal(s, p, cx, cy, a, 2, 11.3, 2.5, 0.92, 0.55);
    }
    const e = s.add(hdRamp(eye), { layer: 4, R: 3, k: 1.8, cast: 1 });
    s.ellipse(e, cx, cy, 4.6, 4.3);
    /* the florets: a few dimples, a spark of light */
    for (const [x, y] of [[18, 18], [21, 17], [20, 20], [17, 20], [22, 19]]) s.mod(x, y, -1);
    s.mod(17, 16, 1); s.mod(18, 16, 1);
}
/* a tulip: the back petal's tip between the two front ones, the cup darker toward its base */
function hdE_tulip(s, col, deep) {
    hdE_stem(s, 27);
    const P = hdRamp(col);
    const back = s.add(P, { layer: 0, R: 3, k: 1.2, bias: -0.1 });
    s.poly(back, [[11, 14], [15, 7], [19.5, 3.2], [24, 7], [28, 14], [28, 22], [11, 22]]);
    const left = s.add(P, { layer: 1, R: 4, k: 1.3, grad: 0.35 });
    s.poly(left, [[20.5, 29], [15, 28.5], [10.5, 25], [8, 18], [7.6, 10], [9.8, 3.4], [13, 7.5], [17, 11], [20.5, 15]]);
    const right = s.add(P, { layer: 2, R: 4, k: 1.3, grad: 0.35, bias: -0.04 });
    s.poly(right, [[18.5, 29], [24, 28.5], [28.5, 25], [31, 18], [31.4, 10], [29.2, 3.4], [26, 7.5], [22, 11], [18.5, 15], [17.5, 22]]);
    /* the deeper color low on the cup, as today's */
    const D = hdRamp(deep);
    for (const id of [left, right]) hdE_each(s, id, (x, y) => { if (y >= 24 - (Math.abs(x - 19.5) > 8 ? 2 : 0)) s.recolor(x, y, D); });
    for (let y = 9; y < 23; y++) s.recolor(19, y, D);
    /* the sheen on each front petal */
    for (const [x, y] of [[11, 9], [11, 10], [12, 12], [23, 11], [23, 12], [24, 14]]) s.mod(x, y, 1);
}
/* a cosmos: eight broad petals with notched tips round a small middle */
function hdE_cosmos(s, pet, eye) {
    hdE_stem(s, 26);
    const P = hdE_pet(pet), cx = 19.5, cy = 18.5;
    for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2 - Math.PI / 2 + 0.2, p = s.add(P, { layer: 1 + (i % 2), R: 3, k: 1.3, grad: 0.05 });
        hdE_petal(s, p, cx, cy, a, 1.5, 13, 4.6, 0.86, 0.62, 1.8);
        /* a crease down the middle of each petal */
        for (let r = 5; r < 11; r++) s.mod(cx + Math.cos(a) * r, cy + Math.sin(a) * 0.86 * r, -1);
    }
    const e = s.add(hdRamp(eye), { layer: 4, R: 2, k: 1.8, cast: 1 });
    s.ellipse(e, cx, cy, 3.4, 3.2);
    s.mod(18, 17, 1); s.mod(20, 20, -1);
}
/* a lily: three petals curling up and out, the cup in front with its stamens */
function hdE_lily(s, pet, dot) {
    hdE_stem(s, 27);
    const P = hdE_pet(pet);
    const mid = s.add(P, { layer: 0, R: 3, k: 1.3, bias: -0.06 });
    hdE_leaf(s, mid, 19.5, 22, 19.5, 3.3, 4.2, 0.55);
    const l = s.add(P, { layer: 1, R: 3, k: 1.3 }), r = s.add(P, { layer: 1, R: 3, k: 1.3, bias: -0.03 });
    hdE_leaf(s, l, 17, 24, 9.2, 3.5, 4.2, 0.5, -1.6);
    hdE_leaf(s, r, 22, 24, 29.8, 3.5, 4.2, 0.5, 1.6);
    const cup = s.add(P, { layer: 2, R: 5, k: 1.2, grad: 0.3, cast: 1 });
    s.poly(cup, [[8, 15], [12, 17], [19.5, 18], [27, 17], [31, 15], [30.5, 21], [27.5, 25.5], [23, 28.5], [16, 28.5], [11.5, 25.5], [8.5, 21]]);
    /* the throat in shadow, the stamens: thin stalks with the colored tips */
    for (let x = 14; x < 26; x++) s.mod(x, 18 + (Math.abs(x - 19.5) < 4 ? 1 : 0), -1);
    const D = hdRamp(dot);
    for (const [x0, y0, x1, y1] of [[19.5, 18.5, 19.5, 11.5], [18, 19, 15.5, 16], [21, 19, 23.5, 16]]) {
        for (let t = 0; t <= 1; t += 0.2) s.recolor(Math.round(x0 + (x1 - x0) * t - 0.5), Math.round(y0 + (y1 - y0) * t - 0.5), hdE_GREEN);
    }
    hdE_over(s, o => { for (const [x, y] of [[19.5, 11.5], [15.3, 15.6], [23.7, 15.6]]) { const a = o.add(D, { R: 1, k: 1.6 }); o.ellipse(a, x, y, 1.9, 1.7); } });
    /* freckles low on the cup, as today's two dots */
    for (const [x, y] of [[16, 23], [23, 23]]) { s.recolor(x, y, D); s.recolor(x + 1, y, D); s.recolor(x, y + 1, D); }
}
hdE_reg([
    ['fl_daisy_0', 12, 16, 6, 15, '#ffffff', '#ffd84a'], ['fl_daisy_1', 12, 16, 6, 15, '#fff27a', '#b8862d'], ['fl_daisy_2', 12, 16, 6, 15, '#ffb8d6', '#ffd84a'],
], hdE_daisy);
hdE_reg([
    ['fl_tulip_0', 12, 16, 6, 15, '#e0405a', '#b3263a'], ['fl_tulip_1', 12, 16, 6, 15, '#ffd84a', '#e0a030'], ['fl_tulip_2', 12, 16, 6, 15, '#ff9ec0', '#e0607a'],
], hdE_tulip);
hdE_reg([
    ['fl_cosmos_0', 12, 16, 6, 15, '#ff8ac0', '#ffd84a'], ['fl_cosmos_1', 12, 16, 6, 15, '#b37cf0', '#ffd84a'], ['fl_cosmos_2', 12, 16, 6, 15, '#f7962d', '#8a3a1a'],
], hdE_cosmos);
hdE_reg([
    ['fl_lily_0', 12, 16, 6, 15, '#ffffff', '#ffd84a'], ['fl_lily_1', 12, 16, 6, 15, '#f7962d', '#8a3a1a'], ['fl_lily_2', 12, 16, 6, 15, '#ffb8d6', '#e0607a'],
], hdE_lily);

/* ---------------------------------------------------------------- wild flowers (three little blooms on a tile) */
/* where today's three blooms are (their middles, HD pixels) */
const hdE_TRIO = [[31.5, 16.5], [13.5, 22.5], [25.5, 34.5]];
function hdE_trio(s, kind, col, eye) {
    const stem = s.add(hdE_GREEN, { layer: 0, R: 1, k: 1.4 }), leaf = s.add(hdE_LEAFC, { layer: 1, R: 1.5, k: 1.3 });
    for (const [x, y] of hdE_TRIO) {
        s.line(stem, x, y + 2, x, y + 8.6, 0.9);
        const d = x < 20 ? -1 : 1;
        hdE_leaf(s, leaf, x, y + 8, x + d * 4.5, y + 5, 1.6, 0.45);
    }
    hdE_over(s, o => {
        for (const [x, y] of hdE_TRIO) {
            const P = hdRamp(col);
            if (kind === 'tulip') {
                const b = o.add(P, { layer: 0, R: 2, bias: -0.1 }), l = o.add(P, { layer: 1, R: 2, grad: 0.3 }), r = o.add(P, { layer: 2, R: 2, grad: 0.3, bias: -0.04 });
                o.poly(b, [[x - 2.5, y - 1], [x, y - 4.6], [x + 2.5, y - 1], [x + 2.5, y + 2], [x - 2.5, y + 2]]);
                o.poly(l, [[x + 0.5, y + 3.6], [x - 3, y + 2.6], [x - 4, y - 1], [x - 3.6, y - 4.4], [x - 1, y - 1.5], [x + 0.5, y]]);
                o.poly(r, [[x - 0.5, y + 3.6], [x + 3, y + 2.6], [x + 4, y - 1], [x + 3.6, y - 4.4], [x + 1, y - 1.5], [x - 0.5, y]]);
                continue;
            }
            /* five round petals (a violet's two above, three below), the eye */
            const n = 5, rot = kind === 'violet' ? Math.PI / 2 : -Math.PI / 2;
            for (let i = 0; i < n; i++) {
                const a = rot + i / n * Math.PI * 2, p = o.add(kind === 'daisy' ? hdE_WHITE : P, { layer: 1 + (i % 2), R: 2, k: 1.3 });
                o.ellipse(p, x + Math.cos(a) * 2.6, y + Math.sin(a) * 2.4, kind === 'poppy' ? 2.9 : 2.4, kind === 'poppy' ? 2.7 : 2.2);
            }
            const e = o.add(hdRamp(eye), { layer: 3, R: 1, k: 1.5 });
            o.ellipse(e, x, y, 1.5, 1.4);
        }
    });
}
hdE_reg([
    ['flower_daisy', 16, 16, 8, 13, 'daisy', '#ffffff', '#ffd84a'], ['flower_violet', 16, 16, 8, 13, 'violet', '#b37cf0', '#fff27a'],
    ['flower_poppy', 16, 16, 8, 13, 'poppy', '#ff8a4a', '#3a2a36'], ['flower_tulip', 16, 16, 8, 13, 'tulip', '#ff6a7a', '#ff6a7a'],
], hdE_trio);

/* ---------------------------------------------------------------- the sprout (a planted flower, before it blooms) */
HD_SPR.sprout = { w: 48, h: 48, ax: 24, ay: 39, draw(s) {
    const st = s.add(hdE_GREEN, { layer: 0, R: 1, k: 1.5, grad: 0.1 });
    s.line(st, 25.5, 21, 25.5, 42.5, 1.4);
    const l = s.add(hdE_LEAFC, { layer: 1, R: 3, k: 1.3, grad: 0.15 }), r = s.add('#5aa844', { layer: 1, R: 3, k: 1.3, grad: 0.15 });
    hdE_leaf(s, l, 25, 22, 11, 19.5, 4.6, 0.5, -1.5);
    hdE_leaf(s, r, 26, 20, 35.5, 14.5, 3.8, 0.5, 1.2);
    for (let t = 0.15; t < 0.85; t += 0.08) { s.mod(25 - 14 * t, 22 - 2.5 * t + 0.4 - Math.sin(t * Math.PI) * 1.2, -1); s.mod(26 + 9.5 * t, 20 - 5.5 * t + Math.sin(t * Math.PI) * 0.8, -1); }
    s.mod(15, 18, 1); s.mod(16, 18, 1); s.mod(31, 15, 1);
} };

/* ---------------------------------------------------------------- farm plots */
/* the bed: a lip of packed earth round soft soil hoed into four rows */
function hdE_plot(s, st) {
    const rim = s.add(hdPal('#3a2418', '#6e4630', '#8a5a3a', '#9c6a46', '#ac7a52'), { layer: 1, R: 3, k: 1.3, cast: 2, grad: 0.12 });
    hdE_rr(s, rim, 0, 3, 48, 45, 8);
    hdE_speck(s, rim, 3, 0.1, 0.05);
    const base = s.add(hdRamp('#7d5436'), { layer: 0, R: 2, k: 1, bias: -0.04 });
    hdE_rr(s, base, 5, 8, 38, 35, 5);
    const SOIL = hdRamp('#9a6a45');
    for (let i = 0; i < 4; i++) {
        const r = s.add(SOIL, { layer: 1, R: 3, k: 1.4, grad: 0.2 });
        hdE_rr(s, r, 7, 9 + i * 9, 34, 7, 3);
        hdE_speck(s, r, 10 + i, 0.12, 0.08);
    }
    /* a few pebbles in the soil */
    for (const [x, y] of [[12, 13], [33, 22], [20, 31], [37, 39], [9, 30]]) { s.px(x, y, '#b48a64'); s.px(x + 1, y + 1, '#6a4630'); }
    if (st === 1) {
        /* seeds just in: the first shoots */
        hdE_over(s, o => { for (const [x, y] of [[16.5, 22], [31.5, 22], [16.5, 31], [31.5, 31]]) { const a = o.add(hdE_LEAFC, { R: 1, k: 1.4 }); o.ellipse(a, x - 1, y - 0.5, 1.6, 1.2); o.ellipse(a, x + 1.2, y - 1, 1.5, 1.1); o.rect(a, Math.round(x - 0.5), Math.round(y), 1, 2); } });
    }
    if (st === 2) {
        /* seedlings: two leaves on a short stem */
        hdE_over(s, o => {
            for (const [x, y] of [[16.5, 20], [31.5, 20], [16.5, 32], [31.5, 32]]) {
                const stem = o.add(hdE_GREEN, { layer: 0, R: 1 }); o.rect(stem, Math.round(x - 0.5), Math.round(y), 1, 6);
                const a = o.add(hdE_LEAFC, { layer: 1, R: 2, k: 1.3 }), b = o.add('#4f9a3f', { layer: 1, R: 2, k: 1.3 });
                hdE_leaf(o, a, x, y + 0.5, x - 5.5, y - 2, 2.2, 0.5, -0.6); hdE_leaf(o, b, x, y + 0.5, x + 5.5, y - 2.5, 2.2, 0.5, 0.6);
            }
        });
    }
    if (st === 3) {
        /* grown: a leafy crop over most of the bed (the vegetable or flower is drawn on it by the game) */
        hdE_over(s, o => {
            const G = ['#3a7f46', '#499b4f', '#4fae55', '#64b869', '#73b865', '#7fcf6e'];
            const L = [[24, 30, 9, 31, 5.5, 3], [24, 30, 36, 33, 5.5, 2], [24, 29, 13, 17, 5.8, 4], [24, 29, 37, 18, 5.5, 3], [24, 30, 24, 10, 5.5, 5],
                [24, 31, 17, 40, 4.5, 1], [24, 31, 32, 40, 4.5, 0], [24, 29, 30, 13, 4.6, 4], [24, 29, 18, 12, 4.6, 5]];
            L.forEach(([x0, y0, x1, y1, w, c], i) => {
                const p = o.add(G[c], { layer: i < 7 ? 1 : 2, R: 3, k: 1.3, grad: 0.15 });
                hdE_leaf(o, p, x0, y0, x1, y1, w, 0.5, (i % 2 ? 1 : -1) * 1.2);
                const n = Math.hypot(x1 - x0, y1 - y0);
                for (let t = 0.15; t < 0.85; t += 0.6 / n) o.mod(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, -1);
            });
        });
    }
}
hdE_reg([['plot_0', 16, 16, 8, 14, 0], ['plot_1', 16, 16, 8, 14, 1], ['plot_2', 16, 16, 8, 14, 2], ['plot_3', 16, 16, 8, 14, 3]], hdE_plot);

/* ---------------------------------------------------------------- holes, the filled mound, the dig spot */
/* a dug hole: the earth heaped round its lip, the far wall in light, the bottom dark, a few clods thrown out */
function hdE_hole(s, a, b, c) {
    const lip = s.add(hdRamp(a), { layer: 1, R: 4, k: 1.2, cast: 2 });
    s.ellipse(lip, 24, 18, 18.5, 11.5);
    hdE_speck(s, lip, 21, 0.14, 0.1);
    const wall = s.add(hdRamp(b), { layer: 0, R: 2, k: 1, flat: 1, grad: 0.5, bias: 0.04 });
    s.ellipse(wall, 24, 18.5, 14.5, 8.3);
    const deep = s.add(hdRamp(c), { layer: 0, R: 3, k: 1, flat: 1, grad: 0.2, bias: -0.04 });
    s.ellipse(deep, 24, 21.5, 11.2, 5.4);
    hdE_speck(s, wall, 22, 0.12, 0.06);
    const clod = s.add(hdRamp(a), { layer: 2, R: 1, k: 1.5 });
    for (const [x, y, r] of [[43.5, 10.5, 1.8], [4.5, 28.5, 1.8], [40.5, 31.5, 1.5], [7, 25, 1.1]]) s.ellipse(clod, x, y, r * 1.2, r);
}
hdE_reg([['hole', 16, 12, 8, 9, '#8a5a3a', '#5a3a26', '#3a2518'], ['hole_sand', 16, 12, 8, 9, '#d9b877', '#b8955e', '#77603c']], hdE_hole);
HD_SPR.mound = { w: 48, h: 36, ax: 24, ay: 27, draw(s) {
    /* the hole filled back in: loose earth heaped up, a few clods on top */
    const base = s.add(hdRamp('#6b4a2a'), { layer: 0, R: 3, k: 1.1 });
    s.ellipse(base, 24, 23, 19.5, 6.5);
    const heap = s.add(hdRamp('#8a5a3a'), { layer: 1, R: 6, k: 1.3, grad: 0.25, cast: 1 });
    s.ellipse(heap, 24, 18.5, 16.5, 7.5);
    hdE_speck(s, heap, 31, 0.14, 0.12);
    const clod = s.add(hdRamp('#a8733f'), { layer: 2, R: 1.5, k: 1.5 });
    for (const [x, y, r] of [[17, 15, 2], [29, 14, 1.6], [33, 19, 1.8], [22, 19, 1.2]]) s.ellipse(clod, x, y, r * 1.25, r);
} };
HD_SPR.digspot = { w: 48, h: 30, ax: 24, ay: 15, draw(s) {
    /* sand turned dark where something is buried: a patch with a ragged edge and a few grains, see-through like today's */
    const P = hdPal('#82663c', '#8e7044', '#9c7c4c', '#a88856', '#b4945e');
    const sand = s.add(P, { layer: 0, R: 4, k: 0.8, flat: 1, grad: 0 });
    for (let y = 0; y < 30; y++) for (let x = 0; x < 48; x++) {
        const u = (x + 0.5 - 24) / 22, v = (y + 0.5 - 15) / 11.5, n = hdE_vn(x * 0.25, y * 0.35, 5) * 0.28;
        if (u * u + v * v < 0.86 + n) s.plot(sand, x, y);
    }
    const mid = s.add(hdPal('#7a5e36', '#866840', '#927246', '#9e7e50', '#aa8a58'), { layer: 1, R: 4, flat: 1, grad: 0 });
    for (let y = 0; y < 30; y++) for (let x = 0; x < 48; x++) {
        const u = (x + 0.5 - 24) / 16, v = (y + 0.5 - 15.5) / 7.5, n = hdE_vn(x * 0.3, y * 0.4, 9) * 0.35;
        if (u * u + v * v < 0.75 + n) s.plot(mid, x, y);
    }
    hdE_speck(s, sand, 41, 0.1, 0.08); hdE_speck(s, mid, 42, 0.14, 0.06);
    hdE_alpha(s, 185);
} };

/* ---------------------------------------------------------------- rocks */
const hdE_STONE = hdPal('#3e3a4a', '#7e7c8c', '#9a98a6', '#b9b7c4', '#d0cedb');
/* a few cracks: short dark runs that wander, a lit edge under each */
function hdE_crack(s, x, y, dx, dy, n, seed) {
    for (let i = 0; i < n; i++) {
        s.mod(x, y, -1); s.mod(x + 1, y + 1, 1);
        const r = hdE_h(i, seed, 7);
        x += dx + (r < 0.3 ? -1 : r > 0.7 ? 1 : 0) * (dy ? 1 : 0); y += dy + (r < 0.3 ? 1 : 0) * (dx ? 1 : 0);
    }
}
HD_SPR.rock = { w: 54, h: 42, ax: 27, ay: 36, draw(s) {
    /* the body, rounded on top; the shaded face on the right; the darker facet low on the right */
    const body = s.add(hdE_STONE, { layer: 0, R: 9, k: 1.3, grad: 0.25 });
    s.poly(body, [[12, 6.5], [42, 6.5], [50, 11], [54, 18.5], [54, 30], [48, 36], [39, 41.5], [12, 41.5], [5, 36], [0, 30], [0, 18], [5, 11]]);
    const face = s.add(hdE_STONE, { layer: 1, R: 6, k: 1.2, bias: -0.14, grad: 0.2 });
    s.poly(face, [[33, 9], [42, 8], [50, 12], [53.5, 19], [53.5, 30], [47.5, 35.5], [40, 40], [24, 40], [27, 33], [33.5, 28], [36, 20]]);
    const low = s.add(hdE_STONE, { layer: 2, R: 4, k: 1.2, bias: -0.24 });
    s.poly(low, [[25, 24.5], [46, 24.5], [48, 28.5], [45, 33], [38, 36], [26, 36], [23, 31]]);
    hdE_speck(s, body, 51, 0.08, 0.05); hdE_speck(s, face, 52, 0.09, 0.04); hdE_speck(s, low, 53, 0.08, 0.03);
    hdE_crack(s, 19, 13, 1, 1, 5, 3);
    /* the light catching the top */
    for (const [x, y] of [[11, 11], [12, 11], [13, 10], [14, 10], [15, 10], [10, 12]]) s.mod(x, y, 1);
} };
HD_SPR.boulder = { w: 102, h: 78, ax: 51, ay: 72, draw(s) {
    const body = s.add(hdE_STONE, { layer: 0, R: 14, k: 1.25, grad: 0.25 });
    s.poly(body, [[19, 9.5], [66, 9.5], [76, 13], [85, 20], [92, 26], [97, 33], [99, 44], [96, 54], [90, 60], [80, 65], [70, 68.5], [26, 68.5], [16, 64], [8, 58], [3, 48], [3, 34], [8, 24], [11, 16]]);
    /* the big shaded face down the right, split from the lit top by a crack */
    const face = s.add(hdE_STONE, { layer: 1, R: 10, k: 1.2, bias: -0.14, grad: 0.2 });
    s.poly(face, [[56, 12], [66, 11], [77, 14], [86, 21], [93, 28], [97.5, 35], [98.5, 45], [95.5, 53], [89, 59], [80, 64], [70, 67], [45, 67], [44, 58], [52, 50], [64, 46], [69, 40], [66, 28], [62, 21]]);
    const low = s.add(hdE_STONE, { layer: 2, R: 8, k: 1.2, bias: -0.22 });
    s.poly(low, [[42, 46], [62, 43], [76, 42], [86, 45], [90, 51], [86, 58], [76, 63], [62, 66], [46, 66], [40, 60], [38, 52]]);
    const side = s.add(hdE_STONE, { layer: 1, R: 8, k: 1.2, bias: -0.1 });
    s.poly(side, [[4, 33], [10, 31], [16, 38], [20, 48], [28, 56], [40, 60], [44, 67], [26, 67], [16, 63], [9, 57], [4, 48]]);
    hdE_speck(s, body, 61, 0.08, 0.05); hdE_speck(s, face, 62, 0.09, 0.04); hdE_speck(s, low, 63, 0.08, 0.03); hdE_speck(s, side, 64, 0.08, 0.03);
    hdE_crack(s, 61, 24, 1, 2, 8, 5); hdE_crack(s, 69, 40, 2, 1, 6, 8);
    /* moss on the lit top: a soft cushion with tufts round its edge */
    hdE_over(s, o => {
        const moss = o.add(hdPal('#3c5a2c', '#5e8c40', '#7cb05a', '#94c466', '#b0d878'), { R: 4, k: 1.3, grad: 0.3 });
        for (let y = 0; y < 30; y++) for (let x = 0; x < 70; x++) {
            const u = (x + 0.5 - 27) / 19, v = (y + 0.5 - 16.5) / 6.5, n = hdE_vn(x * 0.4, y * 0.5, 11) * 0.4;
            if (u * u + v * v < 0.8 + n && s.at(x, y) >= 0 && s.at(x, y - 2) >= 0 && s.at(x - 2, y) >= 0) o.plot(moss, x, y);
        }
        hdE_each(o, moss, (x, y, i) => { const r = hdE_h(x >> 1, y >> 1, 12); if (r < 0.14) o.mods[i] -= 1; else if (r > 0.82) o.mods[i] += 1; });
    });
} };
