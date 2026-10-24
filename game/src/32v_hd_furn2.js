/* ---- 32v_hd_furn2.js ---- */
/* HD furniture, part two: the lamps and lanterns, the kitchen things, shelves and boards, the old lighthouse keeper's
   room, the neighbors' photos and plushies, the arcade posters and the rest of the second half of the furniture list,
   each today's sprite at three times the size (same box and anchor) with the wood grain, fabric, paper, glass and metal
   the extra pixels allow. Wall things are drawn flat, facing us; rugs lie flat. Lamps, lanterns and neon keep their bright
   parts where they were (they glow at night). Photos and plushies show the neighbors' own HD drawings, made small. */

/* ---------------------------------------------------------------- shared helpers */
/* a small seeded hash in [0, 1) for scatter that is the same every time */
function hdF2_h(x, y, k) { let n = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul((k | 0) + 11, 1442695041); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }
/* smooth value noise (grain, mottling) */
function hdF2_vn(x, y, k) {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hdF2_h(ix, iy, k), b = hdF2_h(ix + 1, iy, k), c = hdF2_h(ix, iy + 1, k), d = hdF2_h(ix + 1, iy + 1, k);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function hdF2_mix(a, b, t) { a = hdRgb(a); b = hdRgb(b); return a.map((v, i) => Math.round(v + (b[i] - v) * t)); }
/* a ramp that is one exact color (lettering, glints, light) */
function hdF2_one(c) { const r = hdRgb(c); return [r, r, r, r, r]; }
/* a ramp with small steps for big flat surfaces (fronts, panels, boards): grain and seams read without getting noisy */
function hdF2_soft(hex) { const r = hdRamp(hex); return [r[0], hdF2_mix(r[1], r[2], 0.45), hdRgb(hex), hdF2_mix(r[3], r[2], 0.35), r[3]]; }

/* a rounded rectangle into part id */
function hdF2_rr(s, id, x, y, w, h, r) {
    r = r || 0;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const cx = i < r ? r - i - 0.5 : i >= w - r ? i - (w - r) + 0.5 : 0, cy = j < r ? r - j - 0.5 : j >= h - r ? j - (h - r) + 0.5 : 0;
        if (cx * cx + cy * cy <= r * r + 0.3) s.plot(id, x + i, y + j);
    }
}
/* a new part filled with a (rounded) rectangle */
function hdF2_box(s, mat, x, y, w, h, o, r) { const id = s.add(mat, o); hdF2_rr(s, id, x, y, w, h, r); return id; }
/* texture passes wait until every shape is drawn (hdF2_fin) and touch only pixels still of their part: a mod made early
   would stick to whatever is drawn over that pixel later */
function hdF2_m(s, id, x, y, d) { (s.f2m || (s.f2m = [])).push(id, Math.round(x), Math.round(y), d); }
function hdF2_rc(s, id, x, y, mat) { (s.f2r || (s.f2r = [])).push([id, Math.round(x), Math.round(y), typeof mat === 'string' ? hdRamp(mat) : mat]); }
function hdF2_later(s, fn) { (s.f2q || (s.f2q = [])).push(fn); }
/* a shade line along a row or a column of a part */
function hdF2_hl(s, id, x0, x1, y, d) { for (let x = x0; x <= x1; x++) hdF2_m(s, id, x, y, d); }
function hdF2_vl(s, id, x, y0, y1, d) { for (let y = y0; y <= y1; y++) hdF2_m(s, id, x, y, d); }
/* every pixel of a part as it stands at the end (texture passes inside hdF2_later) */
function hdF2_each(s, id, fn) { const W = s.w; for (let y = 0; y < s.h; y++) for (let x = 0; x < W; x++) if (s.part[y * W + x] === id) fn(x, y); }
/* finish: the queued mods and recolors, the late passes, then a firmer edge where the silhouette faces the light (today's
   sprites have a dark outline all round; this keeps a pale thing from melting into a pale floor) */
function hdF2_fin(s, soft) {
    const m = s.f2m || [];
    for (let i = 0; i < m.length; i += 4) if (s.at(m[i + 1], m[i + 2]) === m[i]) s.mod(m[i + 1], m[i + 2], m[i + 3]);
    for (const [id, x, y, mat] of s.f2r || []) if (s.at(x, y) === id) s.recolor(x, y, mat);
    for (const f of s.f2q || []) f();
    s.f2m = s.f2r = s.f2q = null;
    if (!soft && !s.f2soft) for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) if (s.at(x, y) >= 0 && (s.at(x - 1, y) < 0 || s.at(x, y - 1) < 0)) s.mod(x, y, -1);
}
/* a shadow cast straight down by part id onto the parts behind it, depth rows under its lower edge */
function hdF2_drop(s, id, depth) { hdF2_later(s, () => {
    const W = s.w, L = s.parts[id].layer;
    for (let y = 0; y < s.h; y++) for (let x = 0; x < W; x++) {
        if (s.part[y * W + x] !== id || s.at(x, y + 1) === id) continue;
        for (let d = 1; d <= depth; d++) { const p = s.at(x, y + d); if (p < 0 || p === id || s.parts[p].layer >= L) break; s.mod(x, y + d, -1); }
    }
}); }
/* wood grain over part id: long wavy lines every sp rows (columns when vert), broken here and there, a knot or two */
function hdF2_grain(s, id, seed, sp, vert, x0, y0, x1, y1) {
    sp = sp || 4; x0 = x0 == null ? 0 : x0; y0 = y0 == null ? 0 : y0; x1 = x1 == null ? s.w - 1 : x1; y1 = y1 == null ? s.h - 1 : y1;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const u = vert ? y : x, v = vert ? x : y, t = v + 1.3 * Math.sin(u * 0.06 + seed) + 0.6 * Math.sin(u * 0.19 + seed * 2.3), row = Math.floor(t / sp);
        if (t - row * sp >= 1) { if (hdF2_h(x, y, seed + 5) > 0.985) hdF2_m(s, id, x, y, 1); continue; }
        if (hdF2_h(Math.floor((u + row * 7) / 9), row, seed) < 0.3) continue;
        hdF2_m(s, id, x, y, -1);
    }
}
/* specks of a lighter (d > 0) or darker shade: stone, felt, paper */
function hdF2_speck(s, id, seed, p, d, x0, y0, x1, y1) {
    x0 = x0 == null ? 0 : x0; y0 = y0 == null ? 0 : y0; x1 = x1 == null ? s.w - 1 : x1; y1 = y1 == null ? s.h - 1 : y1;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (hdF2_h(x, y, seed) < p) hdF2_m(s, id, x, y, d);
}
/* the glint on glass: a broad and a thin diagonal streak over the upper left of a box */
function hdF2_glint(s, id, x0, y0, w, h, at, d) {
    at = at == null ? 0.3 : at;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = i + j * 0.8 - w * at; if ((q >= 0 && q < 2.2) || (q >= 4 && q < 5)) hdF2_m(s, id, x0 + i, y0 + j, d || 1); }
}
/* exact pixels in one color */
function hdF2_dots(s, pts, col) { for (const [x, y] of pts) s.px(x, y, col); }
/* parts drawn in a sprite of their own and laid over this one as finished pixels (a pin on paper, a flame in glass):
   what's under them keeps its whole form */
function hdF2_over(s, fn) {
    const o = new HDSprite(s.w, s.h); fn(o); hdF2_fin(o, true);
    const buf = o.render(), W = s.w;
    for (let i = 0; i < W * s.h; i++) if (buf[i * 4 + 3]) s.px(i % W, (i / W) | 0, [buf[i * 4], buf[i * 4 + 1], buf[i * 4 + 2]]);
}
/* light drawn as exact pixels (neon, lit glass): a set of [x, y] cores in color c, a pale center line where it's two
   wide, and a glow that fades out over the pixels around it (onto whatever is drawn there, taken as 'under') */
function hdF2_glow(s, pts, c, under, rad, core) {
    const W = s.w, H = s.h, on = new Uint8Array(W * H), d = new Float32Array(W * H).fill(99);
    for (const [x, y] of pts) if (x >= 0 && y >= 0 && x < W && y < H) on[y * W + x] = 1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (on[y * W + x]) continue;
        let m = 99;
        for (let j = -rad; j <= rad; j++) for (let i = -rad; i <= rad; i++) { const xx = x + i, yy = y + j; if (xx >= 0 && yy >= 0 && xx < W && yy < H && on[yy * W + xx]) m = Math.min(m, Math.hypot(i, j)); }
        d[y * W + x] = m;
    }
    const C = hdRgb(c), hot = hdF2_mix(C, '#ffffff', core == null ? 0.62 : core);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (on[i]) { const inner = on[i - 1] && on[i + 1] && (y === 0 || on[i - W]) && on[i + W]; const mid = (on[i - 1] && on[i + 1]) || (on[i - W] && on[i + W]); s.px(x, y, inner || mid ? hot : C); }
        else if (d[i] <= rad) s.px(x, y, hdF2_mix(under, C, 0.55 * Math.pow(1 - (d[i] - 1) / rad, 1.6)));
    }
}
/* tiny handwriting (chalk, pen): lowercase letters and digits six rows tall, the top row at y; each pixel a little
   uneven, as chalk is (blended toward 'under' now and then) */
const HDF2_FONT = {
    a: '......##.#.#.##...', b: '#..#..##.#.###....', c: '......##.#...##...', e: '.......#.###.##...', h: '#..#..##.#.##.#...',
    k: '#..#..#.###.#.#...', l: '#..#..#..#...#....', o: '.......#.#.#.#....', p: '......##.#.###.#..', i: '...#.....#..#.....',
    s: '......##..#.##....', t: '.#..#.###.#...##..', r: '......#.###.#.....', n: '......##.#.##.#...', m: '......#####.#.#...',
    g: '......##.#.#.##.##', d: '..#..#.###.#.##...', u: '......#.##.#.##...', w: '......#.##.####.#.', y: '......#.##.#.##..#',
    '1': '.#.##..#..#.###...', '2': '##...#.#.#..###...', '3': '##...#.#...###....', '4': '#.##.####..#..#...', '5': '####..##...###....',
    '0': '.#.#.##.##.#.#....', '9': '.#.#.#.##..#.#....', '8': '.#.#.#.#.#.#.#....', '7': '###..#.#..#..#....', '6': '.#.#..##.#.#.#....',
};
function hdF2_write(s, x, y, str, col, under, seed) {
    const dim = under ? hdF2_mix(col, under, 0.35) : col;
    for (const ch of str) {
        const g = HDF2_FONT[ch];
        if (!g) { x += 3; continue; }
        let w = 0;
        for (let j = 0; j < 6; j++) for (let i = 0; i < 3; i++) if (g[j * 3 + i] === '#') { w = Math.max(w, i + 1); s.px(x + i, y + j, hdF2_h(x + i, y + j, seed) < 0.22 ? dim : col); }
        x += w + 1;
    }
    return x;
}
/* a soft shadow that things hung on a board throw onto it, down and to the right */
function hdF2_hang(s, ids, board, dx, dy) { hdF2_later(s, () => {
    const set = new Set(ids), W = s.w, hit = [];
    for (let y = 0; y < s.h; y++) for (let x = 0; x < W; x++) if (set.has(s.part[y * W + x])) for (let k = 1; k <= dy; k++) { const xx = x + Math.round(dx * k / dy), yy = y + k; if (s.at(xx, yy) === board) hit.push(yy * W + xx); }
    for (const i of new Set(hit)) s.mod(i % W, (i / W) | 0, -1);
}); }
/* register a frame by today's size and anchor (the HD one is three times each) */
function hdF2_reg(name, w, h, ax, ay, fn) { HD_SPR[name] = { w: w * 3, h: h * 3, ax: ax * 3, ay: ay * 3, draw(s) { fn(s); hdF2_fin(s); } }; }

/* shared colors */
const HDF2_INK = '#2d2230';                                                            /* today's outline, kept for seams */
const HDF2_BRASS = hdPal('#5e3e16', '#9a6a26', '#c9953a', '#e2b45a', '#f6dc96');
const HDF2_GOLD = hdPal('#6a4a14', '#b48a26', '#ffcf40', '#ffe27a', '#fff3c0');
const HDF2_IRON = hdPal('#141218', '#221f2a', '#2f2b38', '#3f3a4a', '#545064');
const HDF2_STEEL = hdPal('#4e5868', '#7c889a', '#a7b2c2', '#c8d0dc', '#eef3f8');
const HDF2_WALNUT = hdPal('#2e1d14', '#4c3122', '#6b4a35', '#82603f', '#9a774c');

/* ---------------------------------------------------------------- lamps and lanterns */
/* a pole lamp's stand: a round pole from y0 down to the base, a collar, a domed foot */
function hdF2_stand(s, cx, y0, col, footW) {
    const M = hdRamp(col);
    const pole = s.add(M, { layer: 1, R: 3, k: 1.8, grad: 0.1 }); s.rect(pole, cx - 4, y0, 8, 76 - y0);
    const foot = s.add(M, { layer: 2, R: 4, k: 1.4, grad: 0.25 });
    hdF2_rr(s, foot, cx - footW / 2, 75, footW, 8, 4); hdF2_rr(s, foot, cx - footW / 2 + 4, 72, footW - 8, 6, 3);
    const col2 = s.add(M, { layer: 2, R: 2, k: 1.6 }); hdF2_rr(s, col2, cx - 5, 69, 10, 4, 1);
    /* a light streak down the pole */
    hdF2_vl(s, pole, cx - 2, y0 + 2, 68, 1); hdF2_vl(s, pole, cx - 1, y0 + 2, 68, 1);
    return { pole, foot };
}

/* the floor lamp: a pale pleated shade (lit), a brown pole and a round foot */
hdF2_reg('f_lamp_floor', 16, 28, 8, 27, s => {
    hdF2_stand(s, 24, 26, '#6b5a4a', 30);
    const SH = hdPal('#b08a48', '#e8c878', '#ffe7a8', '#fff1c8', '#fffae8');
    /* the shade: a cone seen a little from above (its rims curve down at the front); the rim band at the bottom */
    const sh = s.add(SH, { layer: 3, R: 9, k: 0.9, grad: 0.16, bias: 0.06 });
    const top = (x) => 1.2 + 1.4 * Math.sqrt(Math.max(0, 1 - ((x - 24) / 12) ** 2)), bot = (x) => 24 + 3 * Math.sqrt(Math.max(0, 1 - ((x - 24) / 24) ** 2));
    for (let y = 0; y < 28; y++) { const t = y / 26, l = 12 - 12 * t, r = 36 + 12 * t; for (let x = Math.floor(l); x < Math.ceil(r); x++) if (y >= top(x) - 1.2 && y < bot(x) - 0.5) s.plot(sh, x, y); }
    const rim = s.add(hdPal('#9a7638', '#d8b464', '#e8c878', '#f2d898', '#fae8b8'), { layer: 4, R: 2, grad: 0.1, bias: 0.04 });
    for (let x = 0; x < 48; x++) for (let y = 22; y < 29; y++) if (s.at(x, y) === sh && y >= bot(x) - 3.6) s.plot(rim, x, y);
    /* pleats running down to the rim, the lit inside showing at the top */
    hdF2_later(s, () => { for (let k = 1; k < 12; k++) { const xt = 12 + k * 2, xb = k * 4; for (let y = 2; y < 25; y++) { const x = Math.round(xt + (xb - xt) * y / 26); if (s.at(x, y) === sh) s.mod(x, y, k % 2 ? -1 : 0); } } });
    for (let x = 14; x < 34; x++) s.px(x, 1, x < 16 || x > 31 ? '#e8c878' : '#fff8dc');
    for (let x = 16; x < 32; x++) s.px(x, 2, '#f2d898');
});

/* the lunar lantern: a red silk lantern with gold caps and a gold square, on a dark wood pole */
hdF2_reg('f_lunar_lantern', 16, 28, 8, 27, s => {
    hdF2_stand(s, 24, 54, '#6b4a35', 30);
    const RED = hdPal('#6e1420', '#b0222f', '#e0333f', '#f05a5a', '#ff8c80');
    const body = s.add(RED, { layer: 3, R: 12, k: 1.15, grad: 0.12 });
    hdF2_blob(s, body, 24, 31, 21, 20, 2.3, 9, 52);
    /* the ribs: darker seams curving round the body, a sheen between them */
    hdF2_later(s, () => hdF2_each(s, body, (x, y) => {
        const u = (x + 0.5 - 24) / 21, v = (y + 0.5 - 31) / 20, w = Math.sqrt(Math.max(0.0001, 1 - v * v)), a = Math.asin(Math.max(-1, Math.min(1, u / w)));
        const f = (a / Math.PI * 7 + 7.5) % 1;
        if (f < 0.13) s.mod(x, y, -1); else if (f > 0.42 && f < 0.56 && u < 0.2 && v < 0.3) s.mod(x, y, 1);
    }));
    const G = HDF2_GOLD;
    const capT = s.add(G, { layer: 4, R: 3, k: 1.6, grad: 0.3, cast: 2 }); hdF2_rr(s, capT, 15, 3, 18, 8, 2); hdF2_rr(s, capT, 18, 1, 12, 4, 1);
    const capB = s.add(G, { layer: 4, R: 3, k: 1.6, grad: 0.3 }); hdF2_rr(s, capB, 15, 48, 18, 9, 2);
    const mark = s.add(G, { layer: 4, R: 2, k: 1.2, grad: 0.2, bias: 0.04 }); hdF2_rr(s, mark, 17, 24, 14, 12, 1);
    /* a red diamond and four dots on the gold square (a lucky charm) */
    for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) if (Math.abs(i) + Math.abs(j) <= 4 && Math.abs(i) + Math.abs(j) >= 3) hdF2_rc(s, mark, 23.5 + i + (i > 0 ? 1 : 0), 29.5 + j + (j > 0 ? 1 : 0), RED);
    hdF2_hl(s, capT, 19, 29, 5, -1); hdF2_hl(s, capB, 16, 31, 52, -1);
    hdF2_drop(s, capT, 2);
});

/* the paper lantern: a tall cream paper lantern with two bands, a dark cap, on a wood pole */
hdF2_reg('f_paper_lantern', 16, 28, 8, 27, s => {
    hdF2_stand(s, 24, 48, '#6b4a35', 30);
    const P = hdPal('#a8875a', '#e8cf9c', '#fff2d0', '#fff8e4', '#fffdf6');
    const body = s.add(P, { layer: 3, R: 12, k: 0.85, grad: 0.1, bias: 0.05 });
    hdF2_blob(s, body, 24, 27.5, 20.5, 22.5, 3.2, 4, 49);
    /* thin bamboo hoops all down (the paper bulges a little between them), two brown bands */
    hdF2_later(s, () => hdF2_each(s, body, (x, y) => { if (y % 6 === 2 && y > 6 && y < 47) s.mod(x, y, -1); }));
    const BAND = hdPal('#6e5530', '#c8a468', '#e8c890', '#f2d8aa', '#faeacc');
    for (const y of [17, 35]) for (let x = 0; x < 48; x++) for (let j = 0; j < 3; j++) hdF2_rc(s, body, x, y + j, BAND);
    const cap = s.add(HDF2_IRON, { layer: 5, R: 2, k: 1.4, grad: 0.3, cast: 2 }); hdF2_rr(s, cap, 18, 0, 12, 6, 2);
    const bot = s.add(HDF2_IRON, { layer: 5, R: 2, k: 1.4 }); hdF2_rr(s, bot, 18, 46, 12, 4, 1);
    hdF2_drop(s, cap, 2);
});
/* a squarish-round blob (a superellipse: p 2 is an ellipse, higher is boxier), cut to rows y0..y1 */
function hdF2_blob(s, id, cx, cy, rx, ry, p, y0, y1) {
    for (let y = Math.max(Math.floor(cy - ry), y0); y <= Math.min(Math.ceil(cy + ry), y1); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const u = Math.abs((x + 0.5 - cx) / rx), v = Math.abs((y + 0.5 - cy) / ry); if (u ** p + v ** p <= 1) s.plot(id, x, y);
    }
}

/* the keeper's lantern: a brass hurricane lantern, a wire handle, glass in a frame round a small flame */
hdF2_reg('f_keeper_lantern', 16, 20, 8, 19, s => {
    const B = HDF2_BRASS;
    /* the handle: a dark wire loop over the top */
    const wire = s.add(HDF2_IRON, { layer: 0, R: 1, k: 1.2 });
    for (let a = 0; a <= 40; a++) { const t = Math.PI * a / 40; s.ellipse(wire, 24 + Math.cos(t) * 8, 8 - Math.sin(t) * 7, 1.4, 1.4); }
    const knob = s.add(HDF2_IRON, { layer: 1, R: 2, k: 1.4 }); hdF2_rr(s, knob, 19, 3, 10, 6, 2);
    /* the vented cap */
    const cap = s.add(B, { layer: 3, R: 3, k: 1.5, grad: 0.3, cast: 2 }); hdF2_rr(s, cap, 13, 8, 22, 8, 3); hdF2_rr(s, cap, 16, 6, 16, 4, 2);
    for (const x of [18, 23, 28]) { hdF2_m(s, cap, x, 11, -2); hdF2_m(s, cap, x + 1, 11, -2); hdF2_m(s, cap, x, 12, -1); hdF2_m(s, cap, x + 1, 12, -1); }
    /* the glass with its light, the brass frame posts on each side */
    const GL = hdPal('#c9a95a', '#f2d888', '#fff2b0', '#fff8d2', '#fffdf0');
    const glass = s.add(GL, { layer: 2, R: 6, k: 0.7, grad: 0.05, bias: 0.06 }); hdF2_rr(s, glass, 14, 15, 20, 28, 2);
    const post = s.add(hdPal('#4a3214', '#6e5028', '#8a6a3a', '#a4824e', '#bc9a62'), { layer: 3, R: 2, k: 1.6 });
    s.rect(post, 12, 15, 4, 28); s.rect(post, 32, 15, 4, 28); s.rect(post, 23, 15, 2, 4); s.rect(post, 23, 40, 2, 3);
    /* the base: a brass band, then the wider fount */
    const band = s.add(B, { layer: 4, R: 2, k: 1.4, grad: 0.25, cast: 2 }); hdF2_rr(s, band, 12, 42, 24, 9, 2);
    const fount = s.add(hdPal('#4a3214', '#6e5028', '#8a6a3a', '#a4824e', '#c0a066'), { layer: 5, R: 3, k: 1.4, grad: 0.3 }); hdF2_rr(s, fount, 9, 50, 30, 8, 3);
    hdF2_rr(s, fount, 12, 57, 24, 3, 1);
    hdF2_hl(s, band, 14, 33, 44, 1);
    hdF2_drop(s, cap, 2);
    /* the flame: a warm glow, a bright heart, a white tip (where today's sprite has it) */
    hdF2_over(s, o => {
        const fl = o.add(hdPal('#c86a18', '#ff9a28', '#ffb030', '#ffd060', '#fff0b0'), { layer: 1, R: 3, k: 0.8, grad: 0.5, bias: 0.12 });
        o.ellipse(fl, 24, 30.5, 4.2, 6.5); o.poly(fl, [[21, 28], [27, 28], [24.5, 21], [23.5, 21]]);
        const hot = o.add(hdPal('#ffd060', '#ffe08a', '#fff0b0', '#fff8d8', '#ffffff'), { layer: 2, R: 2, flat: 1, bias: 0.2 }); o.ellipse(hot, 24, 30, 2.2, 3.6);
        const wick = o.add(HDF2_IRON, { layer: 3, R: 1 }); o.rect(wick, 23, 36, 2, 3);
    });
    hdF2_dots(s, [[16, 17], [17, 17], [16, 18], [16, 19], [16, 20], [17, 21]], '#ffffff');
});

/* the moon lamp: a pale round moon with soft craters on a little dark stand */
hdF2_reg('f_moon_lamp', 16, 16, 8, 15, s => {
    const st = s.add(hdRamp('#6b5a4a'), { layer: 1, R: 3, k: 1.6, grad: 0.2 }); hdF2_rr(s, st, 17, 33, 14, 9, 1); hdF2_rr(s, st, 15, 40, 18, 8, 2);
    const MOON = hdPal('#b8a46a', '#e4d6a2', '#fff6d0', '#fffae6', '#fffef6');
    const moon = s.add(MOON, { layer: 3, R: 13, k: 1.0, grad: 0.1, bias: 0.04, cast: 2 }); s.ellipse(moon, 24, 19.5, 17.2, 16.8);
    /* craters where today's sprite has them: a shaded bowl with its lower right rim catching the light */
    const CR = hdPal('#a8945c', '#d8c690', '#efe0aa', '#f8eec8', '#fffaea');
    for (const [cx, cy, r] of [[14.5, 17, 4.6], [29.5, 27, 4.6], [30.5, 10.5, 2.6], [18.5, 30, 2], [35, 18.5, 1.7], [20.5, 7.5, 1.6]]) hdF2_later(s, () => {
        for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
            const dx = x + 0.5 - cx, dy = (y + 0.5 - cy) / 0.9, d = Math.hypot(dx, dy);
            if (d > r || s.at(x, y) !== moon) continue;
            s.recolor(x, y, CR);
            /* the bowl: its upper left wall in shade, the lower right rim lit */
            if (dx + dy < -r * 0.5 && d > r * 0.45) s.mod(x, y, -1); else if (dx + dy > r * 0.75 && d > r * 0.6) s.mod(x, y, 1);
        }
    });
});

/* the mirror-ball lamp: a faceted silver ball scattering pink, yellow and blue, on a dark stand */
hdF2_reg('f_mirror_lamp', 16, 16, 8, 15, s => {
    const st = s.add(hdRamp('#3b3f52'), { layer: 1, R: 3, k: 1.6, grad: 0.2 }); hdF2_rr(s, st, 17, 30, 14, 14, 1); hdF2_rr(s, st, 15, 41, 18, 6, 2);
    const ball = s.add(hdPal('#4e5868', '#98a2b6', '#c8d0e0', '#e2e8f2', '#ffffff'), { layer: 3, R: 13, k: 1.1, grad: 0.1, cast: 2 });
    s.ellipse(ball, 24, 16.5, 17.5, 16.5);
    /* the facets: a grid bent round the ball, every tile its own shade, some lit in the three colors */
    const COL = [hdRamp('#ff5aa8'), hdRamp('#ffd84a'), hdRamp('#4ec3d9')];
    hdF2_later(s, () => hdF2_each(s, ball, (x, y) => {
        const u = (x + 0.5 - 24) / 17.5, v = (y + 0.5 - 16.5) / 16.5, w = Math.sqrt(Math.max(0.01, 1 - v * v));
        const a = Math.asin(Math.max(-1, Math.min(1, u / w))) / (Math.PI / 2), b = Math.asin(Math.max(-1, Math.min(1, v))) / (Math.PI / 2);
        const fu = a * 6.5 + 6.5, fv = b * 6.5 + 6.5, cu = Math.floor(fu), cv = Math.floor(fv);
        if (fu - cu < 0.25 || fv - cv < 0.25) { s.mod(x, y, -1); return; }
        /* colored facets in a diagonal run, as today's dots are; the rest silver, each tile catching the light its own way */
        if ((cu + cv) % 2 === 0 && hdF2_h(cu, cv, 3) < 0.45) { s.recolor(x, y, COL[((cu - cv) / 2 % 3 + 3) % 3]); return; }
        const r = hdF2_h(cu, cv, 7);
        if (r > 0.78) s.mod(x, y, 1); else if (r < 0.25) s.mod(x, y, -1);
    }));
    hdF2_dots(s, [[15, 7], [16, 7], [15, 8], [14, 9], [26, 4], [33, 24]], '#ffffff');
});

/* ---------------------------------------------------------------- neon signs and the light-up floor */
/* neon letters as strokes on a 7 x 16 grid (scaled to the cell), drawn with a two-pixel tube */
const HDF2_NEON = {
    G: [[1, 0, 7, 0], [0, 1, 0, 15], [1, 16, 7, 16], [7, 9, 7, 15], [4, 9, 7, 9], [7, 1, 7, 3]],
    A: [[0, 2, 0, 16], [7, 2, 7, 16], [1, 0, 6, 0], [1, 1, 1, 1], [6, 1, 6, 1], [1, 9, 6, 9]],
    M: [[0, 0, 0, 16], [7, 0, 7, 16], [1, 1, 3.5, 8], [6, 1, 3.5, 8]],
    E: [[0, 0, 0, 16], [0, 0, 7, 0], [0, 8, 5, 8], [0, 16, 7, 16]],
    O: [[0, 2, 0, 14], [7, 2, 7, 14], [2, 0, 5, 0], [2, 16, 5, 16], [1, 1, 1, 1], [6, 1, 6, 1], [1, 15, 1, 15], [6, 15, 6, 15]],
    N: [[0, 0, 0, 16], [7, 0, 7, 16], [1, 1, 6, 15]],
    D: [[0, 0, 0, 16], [0, 0, 5, 0], [0, 16, 5, 16], [7, 2, 7, 14], [6, 1, 6, 1], [6, 15, 6, 15]],
    C: [[2, 0, 7, 0], [2, 16, 7, 16], [0, 2, 0, 14], [1, 1, 1, 1], [1, 15, 1, 15]],
    '!': [[3.5, 0, 3.5, 10], [3.5, 14, 3.5, 16]],
};
function hdF2_neonPts(ch, x0, y0, w) {
    const pts = [], k = (w - 2) / 7;
    for (const [a, b, c, d] of HDF2_NEON[ch]) {
        const n = Math.max(1, Math.ceil(Math.hypot((c - a) * k, d - b) * 2));
        for (let i = 0; i <= n; i++) { const x = Math.round(x0 + (a + (c - a) * i / n) * k), y = Math.round(y0 + b + (d - b) * i / n); pts.push([x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]); }
    }
    return pts;
}
/* the dark backing board of a neon sign (rows y0..y1 of today's sprite x3), with a bevel and four screws */
function hdF2_neonBoard(s, y0, y1) {
    const B = hdPal('#0c0b10', '#16141c', '#1c1a24', '#26232f', '#322e3c');
    const bd = s.add(B, { layer: 1, R: 3, k: 1.2, grad: 0.1 }); hdF2_rr(s, bd, 0, y0, 96, y1 - y0, 4);
    const inner = s.add(B, { layer: 2, R: 2, k: -0.8, grad: 0.05, bias: -0.02 }); hdF2_rr(s, inner, 4, y0 + 4, 88, y1 - y0 - 8, 2);
    for (const [x, y] of [[3, y0 + 3], [91, y0 + 3], [3, y1 - 5], [91, y1 - 5]]) { s.px(x, y, '#5a5468'); s.px(x + 1, y, '#3a3546'); s.px(x, y + 1, '#3a3546'); s.px(x + 1, y + 1, '#24212c'); }
    return '#1c1a24';
}
hdF2_reg('f_neon_game', 32, 16, 16, 15, s => {
    const under = hdF2_neonBoard(s, 3, 45);
    /* GAME ON! in the seven colored rings' places, the word gap opened up a little */
    const word = [['G', '#ff5aa8', -2], ['A', '#4ec3d9', -2], ['M', '#ffd84a', -2], ['E', '#8cc152', -2], ['O', '#ff5aa8', 2], ['N', '#4ec3d9', 2], ['!', '#ffd84a', 2]];
    hdF2_later(s, () => word.forEach(([ch, c, dx], k) => hdF2_glow(s, hdF2_neonPts(ch, 9 + 12 * k + dx, 15, 9), c, under, 3)));
});
hdF2_reg('f_neon_sign', 32, 16, 16, 15, s => {
    const under = hdF2_neonBoard(s, 0, 48);
    const word = [['D', '#4ec3d9'], ['A', '#ff5aa8'], ['N', '#4ec3d9'], ['C', '#ff5aa8'], ['E', '#4ec3d9']];
    hdF2_later(s, () => word.forEach(([ch, c], k) => hdF2_glow(s, hdF2_neonPts(ch, 9 + 18 * k, 15, 12), c, under, 3)));
});

/* the light-up dance floor: sixteen glass tiles in a dark frame (the game lights them in turn over this) */
hdF2_reg('f_light_floor', 32, 32, 16, 31, s => {
    const fr = s.add(hdPal('#120e16', '#1e1824', '#2d2230', '#3a2e40', '#4a3c52'), { layer: 0, R: 2, k: 1, grad: 0.05 });
    hdF2_rr(s, fr, 0, 0, 96, 96, 2);
    const cols = ['#ff5aa8', '#4ec3d9', '#ffd84a', '#8cc152'];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
        const col = cols[(c + r) % 4], x = 3 + 24 * c, y = 3 + 24 * r;
        const t = s.add(hdRamp(col), { layer: 1, R: 3, k: 1.1, grad: 0.22 }); hdF2_rr(s, t, x, y, 18, 18, 1);
        /* a sheen across each tile's upper left, a lit edge where the frame meets it */
        hdF2_glint(s, t, x + 2, y + 2, 14, 14, 0.18, 1);
        hdF2_hl(s, fr, x, x + 17, y - 1, 1); hdF2_vl(s, fr, x - 1, y, y + 17, 1);
    }
    /* the frame's grid lines catch a little light along their middles */
    for (let k = 1; k < 4; k++) { hdF2_hl(s, fr, 2, 93, 24 * k, 1); hdF2_vl(s, fr, 24 * k, 2, 93, 1); }
});

/* ---------------------------------------------------------------- the kitchen and the workshop */
/* the kitchenette: a counter seen a little from above with a two-ring stove and a sink, a tall tap, two cupboard doors */
hdF2_reg('f_kitchenette', 32, 28, 16, 27, s => {
    const top = s.add(hdF2_soft('#e8eef6'), { layer: 1, R: 2, k: 1, grad: 0.08, bias: 0.04 }); hdF2_rr(s, top, 0, 9, 96, 25, 2);
    const lip = s.add(hdRamp('#e1dcd6'), { layer: 3, R: 1.5, k: 1.2, grad: 0.1, cast: 2 }); hdF2_rr(s, lip, 0, 32, 96, 4, 1);
    const front = s.add(hdF2_soft('#f7f3ea'), { layer: 2, R: 2, k: 1, grad: 0.1 }); hdF2_rr(s, front, 0, 35, 96, 49, 2);
    /* the stove: a dark glass plate with two coiled rings */
    const plate = s.add(hdPal('#1a1c26', '#2a2d3c', '#3b3f52', '#4a4f66', '#5c627c'), { layer: 2, R: 2, k: 1.2, grad: 0.12 }); hdF2_rr(s, plate, 7, 13, 33, 17, 2);
    for (const cx of [15.5, 31.5]) {
        const ring = s.add(hdPal('#3a3c4a', '#555868', '#6b6f82', '#8a8ea0', '#a8acbc'), { layer: 3, R: 1.5, k: 1.4, grad: 0.2 });
        for (let y = 15; y < 29; y++) for (let x = cx - 8; x < cx + 8; x++) { const d = Math.hypot((x + 0.5 - cx) / 1.25, y + 0.5 - 21.5); if (d < 5.6 && (d > 4.2 || (d > 1.6 && d < 2.9))) s.plot(ring, x, y); }
    }
    hdF2_glint(s, plate, 8, 14, 31, 15, 0.62, 1);
    /* the sink: a steel rim, the basin sunk in it (its far wall in shade), the drain */
    const rim = s.add(HDF2_STEEL, { layer: 2, R: 2, k: 1.3, grad: 0.15 }); hdF2_rr(s, rim, 50, 13, 35, 15, 3);
    const basin = s.add(hdPal('#5c6878', '#8a96a8', '#b8c4d0', '#d0d8e2', '#eef3f8'), { layer: 3, R: 4, k: -1.1, grad: -0.25 }); hdF2_rr(s, basin, 53, 15, 29, 11, 3);
    s.px(67, 22, '#4e5868'); s.px(68, 22, '#4e5868'); s.px(67, 23, '#6a7486'); s.px(68, 23, '#6a7486');
    /* the tap: a tall swan neck from the back of the counter */
    const tap = s.add(hdPal('#4e5868', '#6e7a8e', '#8a96a8', '#b8c4d0', '#eef3f8'), { layer: 4, R: 3, k: 1.7, grad: 0.15, cast: 2 });
    hdF2_rr(s, tap, 63, 3, 6, 13, 3);
    const spout = s.add(hdPal('#4e5868', '#6e7a8e', '#8a96a8', '#b8c4d0', '#eef3f8'), { layer: 5, R: 2, k: 1.4, grad: 0.3 }); hdF2_rr(s, spout, 64, 13, 4, 5, 2);
    const knob = s.add(HDF2_STEEL, { layer: 4, R: 1.5, k: 1.4 }); hdF2_rr(s, knob, 58, 11, 4, 4, 1); hdF2_rr(s, knob, 70, 11, 4, 4, 1);
    s.px(64, 5, '#ffffff'); s.px(64, 6, '#ffffff'); s.px(64, 7, '#eef3f8');
    /* the cupboard doors: a raised panel each, a long steel handle */
    for (const x0 of [9, 51]) {
        const d = s.add(hdF2_soft('#dcd4c4'), { layer: 3, R: 2, k: 1.2, grad: 0.12 }); hdF2_rr(s, d, x0, 39, 36, 36, 1);
        const pnl = s.add(hdF2_soft('#e6dfd0'), { layer: 4, R: 3, k: 0.9, grad: 0.1 }); hdF2_rr(s, pnl, x0 + 4, 52, 28, 20, 1);
        const h = s.add(hdPal('#4a4238', '#6e6656', '#8a8070', '#a89e8c', '#c8bfae'), { layer: 5, R: 1.5, k: 1.4, cast: 1 }); hdF2_rr(s, h, x0 + 9, 45, 18, 3, 1);
        hdF2_hl(s, d, x0 + 1, x0 + 34, 39, 1);
    }
    /* a darker kick plate along the floor, a seam where the counter meets the front */
    hdF2_hl(s, front, 1, 94, 79, -1); hdF2_hl(s, front, 1, 94, 80, -1); hdF2_hl(s, top, 1, 94, 10, 1);
});

/* the herb pot: a bushy basil plant in a terracotta pot with a rolled rim */
hdF2_reg('f_herb_pot', 16, 16, 8, 15, s => {
    const pot = s.add(hdPal('#7a3418', '#b85a32', '#e0784a', '#ec9468', '#f6b48a'), { layer: 1, R: 6, k: 1.3, grad: 0.15 });
    s.poly(pot, [[12, 30], [36, 30], [34, 46], [14, 46]]); hdF2_rr(s, pot, 15, 44, 18, 3, 1);
    const rim = s.add(hdPal('#8a3e1c', '#cc6c40', '#f29a6a', '#f8b48a', '#fcd0ac'), { layer: 2, R: 2.5, k: 1.3, grad: 0.25, cast: 2 }); hdF2_rr(s, rim, 11, 26, 26, 7, 2);
    const soil = s.add(hdPal('#24160e', '#3a2618', '#4c3322', '#5e4230', '#70523c'), { layer: 1.5, R: 1, flat: 1, bias: -0.1 }); hdF2_rr(s, soil, 14, 25, 20, 3, 1);
    hdF2_speck(s, pot, 4, 0.05, -1, 13, 33, 35, 46);
    hdF2_drop(s, rim, 2);
    /* the leaves: rounded basil leaves in clusters, the back ones darker, a few veins */
    /* the leaves: a low mound of round, cupped basil leaves (the back ones in shade), each with its middle vein */
    const L1 = hdPal('#1e4a1c', '#2f7a2c', '#459838', '#56a442', '#74be56'), L2 = hdPal('#245a20', '#3a8a32', '#5aa844', '#74c056', '#98d874');
    const leaves = [[17, 10, 0], [30, 9, 0], [24, 7, 0], [10, 15, 0], [38, 15, 0], [13, 20, 1], [35, 20, 1], [21, 14, 1], [29, 15, 1], [24, 21, 2], [16, 24, 2], [32, 24, 2], [8, 21, 1], [40, 21, 1]];
    for (const [cx, cy, f] of leaves) {
        const id = s.add(f ? L2 : L1, { layer: 3 + f, R: 3.5, k: 1.2, grad: 0.25, cast: 1, bias: f === 2 ? 0.04 : 0 });
        const tilt = (cx - 24) * 0.05;
        for (let y = cy - 6; y <= cy + 6; y++) for (let x = cx - 8; x <= cx + 8; x++) { const u = (x + 0.5 - cx), v = (y + 0.5 - cy), uu = u * Math.cos(tilt) + v * Math.sin(tilt), vv = -u * Math.sin(tilt) + v * Math.cos(tilt); if ((uu / 6.8) ** 2 + (vv / (4.6 + (vv > 0 ? 0.6 : 0))) ** 2 <= 1) s.plot(id, x, y); }
        for (let i = -4; i <= 3; i++) hdF2_m(s, id, cx + i * Math.cos(tilt), cy + 0.5 + i * Math.sin(tilt), -1);
        hdF2_m(s, id, cx - 3, cy - 2, 1); hdF2_m(s, id, cx - 2, cy - 2, 1);
    }
});

/* the milk can: a steel churn with a lid, a waist band, side handles and a long highlight */
hdF2_reg('f_milk_can', 16, 26, 8, 25, s => {
    const M = hdPal('#545e70', '#8a94a6', '#c8d0dc', '#dfe5ee', '#f4f8fc');
    /* today's can stood three pixels above its anchor over a painted shadow: it stands on the floor now */
    s.dy = 9;
    const hand = s.add(hdPal('#4e5868', '#6e7a8e', '#9aa4b4', '#b8c4d0', '#dce4ee'), { layer: 1, R: 2, k: 1.6 });
    hdF2_rr(s, hand, 2, 35, 8, 10, 3); hdF2_rr(s, hand, 38, 35, 8, 10, 3);
    const body = s.add(M, { layer: 2, R: 9, k: 1.5, grad: 0.08 });
    s.rect(body, 15, 14, 18, 16); s.poly(body, [[15, 27], [33, 27], [41, 33], [41, 69], [7, 69], [7, 33]]);
    const lid = s.add(hdPal('#6a7486', '#b0bac8', '#e8eef6', '#f4f8fc', '#ffffff'), { layer: 4, R: 3, k: 1.3, grad: 0.3, cast: 2 }); hdF2_rr(s, lid, 12, 8, 24, 5, 2);
    const lid2 = s.add(hdPal('#4e5868', '#7c8698', '#9aa4b4', '#b8c2d0', '#d4dce6'), { layer: 3, R: 2, k: 1.3, cast: 2 }); hdF2_rr(s, lid2, 13, 12, 22, 4, 1);
    /* the waist band and the neck ring: darker steel on the can's own form, a lit lip along each */
    const BD = hdPal('#4e5868', '#7c8698', '#9aa4b4', '#b8c2d0', '#d4dce6');
    for (let x = 0; x < 48; x++) { for (let y = 48; y < 52; y++) hdF2_rc(s, body, x, y, BD); for (let y = 27; y < 30; y++) hdF2_rc(s, body, x, y, BD); hdF2_m(s, body, x, 48, 1); hdF2_m(s, body, x, 52, -1); hdF2_m(s, body, x, 30, -1); }
    /* a long highlight down the left, a dent or two */
    hdF2_vl(s, body, 13, 31, 66, 1); hdF2_vl(s, body, 14, 31, 66, 1); hdF2_vl(s, body, 18, 15, 26, 1);
    hdF2_m(s, body, 30, 58, -1); hdF2_m(s, body, 31, 58, -1); hdF2_m(s, body, 30, 59, 1);
    s.dy = 0;
});

/* the menu board: a chalkboard in a wood frame, chalk lines with yellow prices, a pink cake drawn small */
hdF2_reg('f_menu_board', 32, 20, 16, 19, s => {
    const fr = s.add(hdPal('#3a2214', '#5e3a22', '#8a5a33', '#a4723f', '#bc8a52'), { layer: 1, R: 3, k: 1.3, grad: 0.15 }); hdF2_rr(s, fr, 0, 1, 96, 58, 3);
    const bd = s.add(hdPal('#1a2220', '#26302d', '#2f3a36', '#384540', '#43514b'), { layer: 2, R: 3, k: -0.9, grad: 0.06 }); hdF2_rr(s, bd, 6, 6, 84, 48, 1);
    hdF2_grain(s, fr, 3, 3, false, 0, 0, 95, 6); hdF2_grain(s, fr, 4, 3, false, 0, 53, 95, 59); hdF2_grain(s, fr, 5, 3, true, 0, 6, 6, 54); hdF2_grain(s, fr, 6, 3, true, 89, 6, 95, 54);
    /* chalk dust: faint smudges where things were wiped off */
    hdF2_later(s, () => hdF2_each(s, bd, (x, y) => { const v = hdF2_vn(x * 0.09, y * 0.16, 21); if (v > 0.8) s.mod(x, y, 1); }));
    /* the menu in chalk where today's lines are, a yellow price on each */
    const B = '#2f3a36';
    hdF2_write(s, 12, 12, 'hot cocoa', '#f4efe6', B, 1); hdF2_write(s, 12, 24, 'cheesecake', '#f4efe6', B, 2); hdF2_write(s, 12, 36, 'apple pie', '#f4efe6', B, 3);
    hdF2_write(s, 69, 12, '3', '#ffd84a', B, 4); hdF2_write(s, 69, 24, '5', '#ffd84a', B, 5); hdF2_write(s, 69, 36, '4', '#ffd84a', B, 6);
    for (const y of [16, 28, 40]) for (let x = 56; x < 66; x += 2) s.px(x, y, hdF2_mix('#f4efe6', B, 0.5));
    /* a slice of cake drawn in pink chalk with a cherry, a blue wavy underline */
    const pink = (x, y) => s.px(x, y, hdF2_h(x, y, 8) < 0.25 ? hdF2_mix('#ff9ec0', B, 0.35) : '#ff9ec0');
    for (let i = 0; i <= 12; i++) { pink(18 + i, 50); pink(18 + i, Math.round(50 - i * 0.42)); }
    for (let y = 45; y <= 50; y++) pink(30, y);
    for (let i = 3; i <= 12; i++) pink(18 + i, 48);
    s.px(29, 43, '#e0405a'); s.px(30, 43, '#e0405a'); s.px(29, 42, '#ff7a8a'); s.px(30, 42, '#e0405a');
    for (let x = 36; x < 63; x++) s.px(x, 49 + Math.round(Math.sin(x * 0.7) * 0.6), hdF2_h(x, 49, 9) < 0.25 ? hdF2_mix('#9fd8ef', B, 0.35) : '#9fd8ef');
    /* a stick of chalk on the frame's ledge */
    for (let i = 0; i < 6; i++) { s.px(74 + i, 54, '#fbf8f0'); s.px(74 + i, 55, '#d8d2c4'); }
});

/* bricks over part id in a box: courses h tall with a mortar line, joints staggered, every brick its own shade */
function hdF2_bricks(s, id, x0, y0, x1, y1, bw, bh, seed) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const row = Math.floor((y - y0) / bh), off = row % 2 ? bw / 2 : 0, col = Math.floor((x - x0 + off) / bw), fx = (x - x0 + off) - col * bw, fy = (y - y0) - row * bh;
        if (fy === bh - 1 || fx === bw - 1) { hdF2_m(s, id, x, y, -2); continue; }
        const r = hdF2_h(col, row, seed);
        if (fy === 0 && fx < bw - 2) hdF2_m(s, id, x, y, 1);
        else if (r < 0.25) hdF2_m(s, id, x, y, -1); else if (r > 0.85 && fy < 2) hdF2_m(s, id, x, y, 1);
        if (hdF2_h(x, y, seed + 2) < 0.03) hdF2_m(s, id, x, y, -1);
    }
}
/* the kiln: a brick oven with a stove pipe, a heavy capstone, an iron door with rivets and a steel latch */
hdF2_reg('f_kiln', 32, 44, 16, 43, s => {
    const pipe = s.add(hdPal('#2c2830', '#4a4552', '#6b6570', '#857f8a', '#a29ca6'), { layer: 0, R: 4, k: 1.7, grad: 0.1 }); s.rect(pipe, 64, 2, 16, 18);
    const ring = s.add(hdPal('#2c2830', '#4a4552', '#6b6570', '#857f8a', '#a29ca6'), { layer: 1, R: 2, k: 1.5, grad: 0.2 }); hdF2_rr(s, ring, 62, 0, 20, 5, 2); hdF2_rr(s, ring, 63, 10, 18, 3, 1);
    hdF2_vl(s, pipe, 67, 4, 18, 1); hdF2_vl(s, pipe, 68, 4, 18, 1);
    const CAP = hdPal('#3e1810', '#6a2c1e', '#8f3f2a', '#a65038', '#bc6648');
    const cap = s.add(CAP, { layer: 2, R: 3, k: 1.3, grad: 0.3, cast: 3 }); hdF2_rr(s, cap, 0, 16, 96, 11, 3);
    hdF2_hl(s, cap, 2, 93, 17, 1); hdF2_hl(s, cap, 2, 93, 18, 1);
    const body = s.add(hdPal('#4a1c12', '#8a3a28', '#b8553a', '#c86a4c', '#d88262'), { layer: 1, R: 4, k: 1, grad: 0.12 }); hdF2_rr(s, body, 3, 26, 90, 90, 1);
    hdF2_bricks(s, body, 3, 27, 92, 115, 15, 7, 3);
    const plinth = s.add(CAP, { layer: 2, R: 3, k: 1.2, grad: 0.2 }); hdF2_rr(s, plinth, 3, 114, 90, 15, 2);
    hdF2_bricks(s, plinth, 3, 116, 92, 128, 23, 7, 9);
    /* the door: an iron frame, the door in it with rivets round the edge and a latch */
    const DK = hdPal('#141218', '#2a2832', '#4a4450', '#5a5462', '#6e687a');
    const fr = s.add(DK, { layer: 3, R: 3, k: 1.3, grad: 0.15, cast: 2 }); hdF2_rr(s, fr, 15, 48, 60, 54, 3);
    const door = s.add(hdPal('#2c2830', '#4e4956', '#6b6570', '#827c88', '#9a94a0'), { layer: 4, R: 4, k: 1.2, grad: 0.2 }); hdF2_rr(s, door, 21, 54, 48, 42, 2);
    for (let x = 25; x <= 65; x += 8) for (const y of [57, 92]) { s.px(x, y, '#a29ca6'); s.px(x + 1, y + 1, '#2c2830'); }
    for (let y = 63; y <= 87; y += 8) for (const x of [24, 65]) { s.px(x, y, '#a29ca6'); s.px(x + 1, y + 1, '#2c2830'); }
    const latch = s.add(HDF2_STEEL, { layer: 5, R: 2, k: 1.5, cast: 1 }); hdF2_rr(s, latch, 62, 71, 6, 10, 2);
    const bar = s.add(DK, { layer: 5, R: 1, k: 1.5 }); hdF2_rr(s, bar, 70, 74, 8, 4, 1);
    /* a little peephole with the fire's glow in it */
    const peep = s.add(hdPal('#6a1c08', '#c84a18', '#f07a28', '#ffa848', '#ffd890'), { layer: 5, R: 2, k: -1, grad: -0.4 }); s.ellipse(peep, 45, 66, 5, 3);
    hdF2_drop(s, cap, 3);
});

/* the millstone: a round grinding stone on a wooden tub, the turning shaft up through it, flour dusting the planks */
hdF2_reg('f_millstone', 32, 44, 16, 43, s => {
    s.dy = 3;
    const W = hdPal('#3a2414', '#6e4a2a', '#a8733f', '#bc8650', '#cc9a62');
    const tub = s.add(W, { layer: 1, R: 6, k: 1.1, grad: 0.1 }); hdF2_rr(s, tub, 0, 82, 96, 44, 3);
    for (const x of [24, 48, 72]) { hdF2_vl(s, tub, x, 86, 124, -2); hdF2_vl(s, tub, x + 1, 86, 124, 1); }
    hdF2_grain(s, tub, 13, 5, true, 0, 86, 95, 125);
    /* the stone: its round top seen from above with the furrows cut from the middle, the rough edge below */
    const SIDE = hdPal('#4a4650', '#76727c', '#8a8690', '#9c98a2', '#b0acb6'), TOP = hdPal('#5a5662', '#98949e', '#b8b4bc', '#cac6ce', '#dedae2');
    const side = s.add(SIDE, { layer: 3, R: 5, k: 1.1, grad: 0.1, cast: 3 });
    s.rect(side, 0, 58, 96, 17); s.ellipse(side, 48, 75, 48, 11);
    const top = s.add(TOP, { layer: 4, R: 9, k: 0.7, grad: 0.15, bias: 0.04 }); s.ellipse(top, 48, 59, 48, 13.5);
    hdF2_later(s, () => {
        hdF2_each(s, top, (x, y) => {
            const u = (x + 0.5 - 48) / 48, v = (y + 0.5 - 59) / 13.5, a = Math.atan2(v, u), r = Math.hypot(u, v);
            const f = ((a / (Math.PI * 2) * 12 + 12) % 1 + r * 0.35) % 1;
            if (r > 0.18 && f < 0.12) s.mod(x, y, -1); else if (r > 0.18 && f > 0.12 && f < 0.2) s.mod(x, y, 1);
            if (hdF2_h(x, y, 31) < 0.05) s.mod(x, y, -1);
        });
        hdF2_each(s, side, (x, y) => { const v = hdF2_vn(x * 0.5, y * 0.15, 33); if (v < 0.3) s.mod(x, y, -1); else if (v > 0.8) s.mod(x, y, 1); });
    });
    /* the shaft and its iron bands */
    const shaft = s.add(hdPal('#4a2c16', '#6e4626', '#8a5a33', '#a8763f', '#b98552'), { layer: 5, R: 4, k: 1.6, grad: 0.05 }); s.rect(shaft, 45, 3, 14, 57);
    hdF2_grain(s, shaft, 17, 3, true, 45, 3, 58, 60);
    const band = s.add(HDF2_IRON, { layer: 6, R: 2, k: 1.5, cast: 1 });
    hdF2_rr(s, band, 42, 21, 20, 7, 2); hdF2_rr(s, band, 42, 42, 20, 6, 2); hdF2_rr(s, band, 41, 56, 22, 6, 2);
    hdF2_vl(s, shaft, 48, 4, 58, 1);
    s.dy = 0;
    /* flour: white specks on the tub and in the furrows */
    for (const [x, y] of [[9, 90], [10, 90], [19, 102], [36, 96], [37, 97], [80, 92], [81, 92], [66, 108], [88, 121], [14, 119], [30, 66], [62, 54], [70, 66], [22, 58]]) s.px(x, y, '#fbf6ee');
});

/* a can of paint seen a little from above: a steel lid, paint run down the side, one drip lower than the rest */
function hdF2_can(s, x, y, w, h, col, seed, layer) {
    const body = s.add(HDF2_STEEL, { layer, R: Math.min(5, w / 2.5), k: 1.5, grad: 0.1 }); hdF2_rr(s, body, x, y + 2, w, h - 2, 1);
    const P = hdRamp(col), drip = x + 2 + Math.floor(hdF2_h(seed, 1, 3) * (w - 5)), lvl = y + 2 + Math.round((h - 2) * 0.55);
    hdF2_later(s, () => hdF2_each(s, body, (xx, yy) => { if (yy < lvl + (Math.abs(xx - drip - 0.5) < 1.6 ? 4 : xx % 5 === 2 ? 1 : 0)) s.recolor(xx, yy, P); }));
    const lid = s.add(hdPal('#6a7486', '#b0bac8', '#e8eef6', '#f4f8fc', '#ffffff'), { layer: layer + 0.5, R: 2, k: 1.2, grad: 0.3, cast: 1 }); hdF2_rr(s, lid, x, y, w, 4, 2);
    hdF2_hl(s, lid, x + 2, x + w - 3, y + 2, -1);
    return body;
}
/* the paint shelf: a wooden shelf of ten paint cans, every color of the rainbow */
hdF2_reg('f_paint_shelf', 32, 28, 16, 27, s => {
    const WD = hdPal('#3a2414', '#6e4a2a', '#b98552', '#c99a64', '#d6ac78');
    const back = s.add(hdPal('#1e120a', '#36220f', '#4a3018', '#5a3c20', '#6b4a2a'), { layer: 0, R: 3, k: -0.6, grad: -0.2 }); s.rect(back, 6, 10, 84, 64);
    hdF2_grain(s, back, 41, 6, true, 6, 10, 89, 73);
    const frame = s.add(WD, { layer: 1, R: 2, k: 1.2, grad: 0.08 }); s.rect(frame, 0, 9, 7, 66); s.rect(frame, 89, 9, 7, 66);
    hdF2_grain(s, frame, 42, 3, true, 0, 9, 6, 74); hdF2_grain(s, frame, 43, 3, true, 89, 9, 95, 74);
    const top = s.add(hdPal('#4a3018', '#7a5530', '#9a6b3a', '#a9794e', '#ba8a5c'), { layer: 3, R: 2, k: 1, grad: 0.2, bias: 0.04, cast: 2 }); hdF2_rr(s, top, 0, 0, 96, 9, 2);
    const edge = s.add(WD, { layer: 3, R: 1.5, k: 1.2, cast: 2 }); s.rect(edge, 0, 9, 96, 4);
    hdF2_grain(s, top, 44, 3, false, 0, 0, 95, 8);
    const shelf = s.add(WD, { layer: 3, R: 1.5, k: 1.2, cast: 2 }); s.rect(shelf, 6, 41, 84, 5);
    const base = s.add(hdPal('#3a2414', '#6e4a2a', '#9a6b3a', '#a9794e', '#ba8a5c'), { layer: 3, R: 2, k: 1.2, grad: 0.15 }); hdF2_rr(s, base, 0, 72, 96, 12, 2);
    hdF2_grain(s, base, 45, 4, false, 0, 72, 95, 83);
    const rows = [[22, ['#e0405a', '#4f86c6', '#ffd84a', '#8cc152', '#ff9ec0']], [52, ['#b37cf0', '#f7962d', '#4ec3d9', '#ffffff', '#6e3f25']]];
    rows.forEach(([y, cols], r) => cols.forEach((c, i) => hdF2_can(s, 12 + 15 * i, y, 12, 20, c, r * 5 + i, 2)));
    hdF2_drop(s, top, 3); hdF2_drop(s, edge, 2); hdF2_drop(s, shelf, 2);
});

/* paint cans: a brush left in the yellow can on top of a blue one and a red one */
hdF2_reg('f_paint_cans', 16, 28, 8, 27, s => {
    const brush = s.add(hdPal('#3a2414', '#5e3e22', '#8a5a33', '#a8763f', '#c08e54'), { layer: 4, R: 1.5, k: 1.4 }); s.line(brush, 31, 17, 17, 37, 2.4);
    const fer = s.add(HDF2_STEEL, { layer: 4.5, R: 1.5, k: 1.4 }); s.line(fer, 32.5, 15, 29.5, 20, 2.8);
    const tuft = s.add(hdPal('#8a7a5a', '#cfc0a0', '#f2e6d4', '#faf2e6', '#ffffff'), { layer: 5, R: 3, k: 1.2, grad: 0.3 }); s.ellipse(tuft, 34.5, 11, 6.5, 6); s.ellipse(tuft, 33, 15, 4.5, 3.5);
    for (let i = 0; i < 5; i++) hdF2_m(s, tuft, 32 + i * 1.5, 7 + i, -1);
    hdF2_can(s, 13, 35, 24, 20, '#ffd84a', 1, 3);
    hdF2_can(s, 2, 55, 22, 23, '#4f86c6', 2, 1);
    hdF2_can(s, 24, 55, 22, 23, '#e0405a', 3, 1.2);
});

/* the tool pegboard: a framed board full of holes, a hammer, a wrench, a saw, a screwdriver and a tape measure */
hdF2_reg('f_pegboard', 32, 20, 16, 19, s => {
    const fr = s.add(hdPal('#4a3420', '#7e6040', '#a8865c', '#bc9a70', '#ccac84'), { layer: 1, R: 3, k: 1.3, grad: 0.15 }); hdF2_rr(s, fr, 0, 1, 96, 58, 3);
    const bd = s.add(hdF2_soft('#d8b88a'), { layer: 2, R: 3, k: -0.6, grad: 0.06 }); hdF2_rr(s, bd, 6, 6, 84, 48, 1);
    hdF2_grain(s, fr, 51, 3, false, 0, 0, 95, 6); hdF2_grain(s, fr, 52, 3, false, 0, 53, 95, 59);
    /* the holes: dark dots on a grid, the lower lip of each catching the light */
    hdF2_later(s, () => { for (let y = 9; y < 54; y += 6) for (let x = 9; x < 90; x += 6) if (s.at(x, y) === bd && s.at(x + 1, y + 1) === bd) { s.px(x, y, '#8a6a44'); s.px(x + 1, y, '#9c7a52'); s.px(x, y + 1, '#ead0a6'); s.px(x + 1, y + 1, '#e6c99c'); } });
    const tools = [];
    const T = (mat, o) => { const id = s.add(mat, o); tools.push(id); return id; };
    const STEEL = hdPal('#4e5868', '#6e7a8e', '#8a96a8', '#b0bccc', '#dce4ee');
    /* the hammer */
    const hh = T(hdPal('#3a2414', '#5e3e22', '#8a5a33', '#a8763f', '#c08e54'), { layer: 3, R: 1.5, k: 1.4 }); hdF2_rr(s, hh, 14, 17, 5, 31, 2);
    const hd = T(STEEL, { layer: 4, R: 2, k: 1.4, grad: 0.3, cast: 1 }); hdF2_rr(s, hd, 9, 9, 15, 8, 2); hdF2_rr(s, hd, 20, 8, 5, 10, 1);
    /* the wrench: an open jaw at the top, a ring at the bottom */
    const wr = T(STEEL, { layer: 3, R: 1.5, k: 1.5 }); s.rect(wr, 29, 16, 5, 28); hdF2_rr(s, wr, 26, 9, 11, 9, 3); s.ellipse(wr, 31.5, 46, 5, 4.5);
    for (let y = 9; y < 14; y++) for (let x = 30; x < 33; x++) s.plot(-1, x, y);
    for (let y = 44; y < 48; y++) for (let x = 30; x < 33; x++) s.plot(-1, x, y);
    for (let y = 9; y < 14; y++) for (let x = 30; x < 33; x++) s.plot(bd, x, y);
    for (let y = 45; y < 47; y++) for (let x = 30; x < 33; x++) s.plot(bd, x, y);
    /* the saw: a steel blade with teeth under it, a red handle with a grip hole */
    const bl = T(hdPal('#6a7486', '#9aa6b6', '#c8d0dc', '#dfe5ee', '#f4f8fc'), { layer: 3, R: 2, k: 1, grad: 0.25 }); s.poly(bl, [[42, 17], [64, 14], [64, 37], [42, 37]]);
    for (let x = 42; x < 64; x += 2) { s.plot(bl, x, 38); }
    const sh = T(hdRamp('#c0392b'), { layer: 4, R: 2.5, k: 1.4, grad: 0.2 }); hdF2_rr(s, sh, 62, 12, 10, 27, 3);
    for (let y = 18; y < 27; y++) for (let x = 65; x < 69; x++) s.plot(bd, x, y);
    hdF2_glint(s, bl, 43, 15, 20, 21, 0.25, 1);
    /* the screwdriver and the tape measure */
    const sd = T(hdRamp('#4ea8f0'), { layer: 3, R: 2, k: 1.5, grad: 0.2 }); hdF2_rr(s, sd, 77, 9, 6, 21, 2);
    const shf = T(hdPal('#4e5868', '#7c889a', '#b8c4d0', '#d4dce6', '#eef3f8'), { layer: 3, R: 1, k: 1.4 }); s.rect(shf, 79, 29, 2, 18);
    for (let y = 12; y < 28; y += 3) hdF2_m(s, sd, 79, y, -1);
    const tp = T(hdRamp('#ffd84a'), { layer: 4, R: 3, k: 1.3, grad: 0.25 }); hdF2_rr(s, tp, 81, 36, 12, 12, 3);
    const tc = T(hdRamp('#3a3340'), { layer: 5, R: 1.5, k: 1 }); s.ellipse(tc, 87.5, 42, 2.4, 2.4);
    const tape = T(hdRamp('#ffd84a'), { layer: 4, R: 1, k: 1 }); s.rect(tape, 81, 46, 3, 5);
    hdF2_hang(s, tools, bd, 2, 3);
});

/* ---------------------------------------------------------------- the old lighthouse keeper's room */
/* the barometer: a brass case round a cream dial, ticks, the needle and the red set hand under glass */
hdF2_reg('f_lh_barometer', 16, 16, 8, 15, s => {
    const ring = s.add(HDF2_BRASS, { layer: 1, R: 4, k: 1.5, grad: 0.25 }); s.ellipse(ring, 24, 24, 19.5, 19.5);
    const face = s.add(hdPal('#a89a7a', '#e6dcc4', '#fbf3e0', '#fdf8ec', '#ffffff'), { layer: 2, R: 6, k: -0.7, grad: 0.1 }); s.ellipse(face, 24, 24, 14.5, 14.5);
    hdF2_later(s, () => {
        /* the inner bezel's shadow on the dial, ticks round the edge, a bigger one every quarter */
        for (let k = 0; k < 24; k++) {
            const a = k / 24 * Math.PI * 2, big = k % 6 === 0, r0 = big ? 9.5 : 11, r1 = 13;
            for (let r = r0; r <= r1; r += 0.5) s.px(Math.round(24 + Math.cos(a) * r - 0.5), Math.round(24 + Math.sin(a) * r - 0.5), big ? '#5e4420' : '#8a6a3a');
        }
        /* the needle (dark, to fair weather), the red set hand, the brass pin */
        for (let t = -2; t <= 10; t += 0.5) s.px(Math.round(24 + t * 0.35 - 0.5), Math.round(24 - t), '#2d2230');
        for (let t = 0; t <= 8; t += 0.5) s.px(Math.round(24 - t * 0.85 - 0.5), Math.round(24 + t * 0.25 - 0.5), '#e0304a');
        s.px(23, 23, '#e2b45a'); s.px(24, 23, '#c9953a'); s.px(23, 24, '#9a6a26'); s.px(24, 24, '#5e3e16');
        /* the glass: a curved glint across the upper left */
        for (let a = 3.5; a < 4.6; a += 0.04) { s.px(Math.round(24 + Math.cos(a) * 11.5), Math.round(24 + Math.sin(a) * 11.5), '#ffffff'); }
        for (let a = 3.8; a < 4.3; a += 0.05) s.px(Math.round(24 + Math.cos(a) * 9.5), Math.round(24 + Math.sin(a) * 9.5), '#ffffff');
    });
});

/* the keeper's cot: a plain wooden cot, a white pillow, the sheet turned down over a blue wool blanket */
hdF2_reg('f_lh_cot', 32, 24, 16, 23, s => {
    const WD = hdPal('#2a180c', '#4a301a', '#6b4a2a', '#82603a', '#96744a'), LEG = hdPal('#24140a', '#3c2614', '#5a3a24', '#6e4c30', '#82603c');
    const legs = s.add(LEG, { layer: 0, R: 2, k: 1.4, grad: 0.1 }); s.rect(legs, 4, 46, 11, 23); s.rect(legs, 81, 46, 11, 23);
    const post = s.add(WD, { layer: 1, R: 2, k: 1.4 }); hdF2_rr(s, post, 3, 22, 7, 14, 2); hdF2_rr(s, post, 87, 22, 7, 14, 2);
    const sheet = s.add(hdPal('#9a9080', '#d4cab6', '#e8e0d0', '#f2ece0', '#faf6ee'), { layer: 2, R: 4, k: 1.1, grad: 0.2 }); hdF2_rr(s, sheet, 6, 20, 30, 15, 3);
    const BL = hdPal('#1c2a48', '#2e4570', '#3f5a8a', '#4f6c9c', '#6482b0');
    const blanket = s.add(BL, { layer: 3, R: 5, k: 1.1, grad: 0.25 }); hdF2_rr(s, blanket, 29, 17, 63, 19, 3);
    const turn = s.add(hdPal('#2e4570', '#46649a', '#5a7aa8', '#6e8ebc', '#88a6d0'), { layer: 4, R: 2, k: 1.2, grad: 0.2, cast: 2 }); hdF2_rr(s, turn, 29, 16, 63, 5, 2);
    /* the wool: soft folds running across, a stitched edge */
    hdF2_later(s, () => hdF2_each(s, blanket, (x, y) => { const v = Math.sin(x * 0.2 + y * 0.12 + Math.sin(x * 0.07) * 2); if (v > 0.86) s.mod(x, y, 1); else if (v < -0.9) s.mod(x, y, -1); }));
    for (let x = 32; x < 90; x += 3) hdF2_m(s, blanket, x, 33, -1);
    const pillow = s.add(hdPal('#9aa0b0', '#d8dce6', '#f6f6f8', '#ffffff', '#ffffff'), { layer: 5, R: 6, k: 1.2, grad: 0.25, cast: 1 }); hdF2_rr(s, pillow, 6, 12, 27, 15, 6);
    hdF2_m(s, pillow, 18, 19, -1); hdF2_m(s, pillow, 19, 20, -1); hdF2_m(s, pillow, 20, 20, -1);
    /* the frame: a long front rail of planks with pegs at the corners */
    const rail = s.add(WD, { layer: 6, R: 3, k: 1.2, grad: 0.15 }); hdF2_rr(s, rail, 0, 33, 96, 15, 2);
    hdF2_grain(s, rail, 61, 4, false, 0, 33, 95, 47);
    hdF2_hl(s, rail, 2, 93, 34, 1); hdF2_hl(s, rail, 2, 93, 40, -1);
    for (const x of [8, 87]) { s.px(x, 37, '#3a2414'); s.px(x + 1, 37, '#96744a'); s.px(x, 43, '#3a2414'); s.px(x + 1, 43, '#96744a'); }
    hdF2_drop(s, rail, 3);
});

/* the keeper's desk: a heavy desk with a drawer, two blue log books and a little brass lamp alight */
hdF2_reg('f_lh_desk', 32, 28, 16, 27, s => {
    const LEG = hdPal('#24140a', '#45301c', '#6b4a2a', '#7e5a36', '#926c44');
    const legs = s.add(LEG, { layer: 0, R: 2, k: 1.3, grad: 0.1 }); s.rect(legs, 4, 46, 13, 35); s.rect(legs, 79, 46, 13, 35);
    hdF2_grain(s, legs, 71, 3, true, 4, 46, 16, 80); hdF2_grain(s, legs, 72, 3, true, 79, 46, 91, 80);
    const apron = s.add(hdPal('#2e1a0e', '#56361e', '#7a4e30', '#8c6040', '#a07450'), { layer: 1, R: 2, k: 1.1, grad: 0.1 }); s.rect(apron, 15, 46, 66, 17);
    const drawer = s.add(hdPal('#3a2414', '#65412a', '#86583a', '#9a6c4a', '#ae805a'), { layer: 2, R: 2, k: 1.2, grad: 0.15 }); hdF2_rr(s, drawer, 31, 49, 34, 11, 1);
    const knob = s.add(HDF2_BRASS, { layer: 3, R: 1.5, k: 1.4 }); hdF2_rr(s, knob, 45, 53, 6, 3, 1);
    const top = s.add(hdPal('#4a2c16', '#8a5a34', '#b07a4a', '#c08c5a', '#d0a06c'), { layer: 3, R: 1.5, k: 1, grad: 0.1, bias: 0.04 }); hdF2_rr(s, top, 0, 35, 96, 4, 1);
    const edge = s.add(hdPal('#2e1a0e', '#64402a', '#8a5a3a', '#9c6c48', '#b08058'), { layer: 3, R: 2, k: 1.2, grad: 0.15, cast: 2 }); hdF2_rr(s, edge, 0, 38, 96, 10, 1);
    hdF2_grain(s, edge, 73, 3, false, 0, 38, 95, 47); hdF2_grain(s, top, 74, 2, false, 0, 35, 95, 38);
    hdF2_drop(s, edge, 3);
    /* the log books: two thick blue volumes standing, their pages showing on top */
    const BK = hdPal('#141c30', '#28385e', '#3f5a8a', '#4e6c9e', '#6482b0');
    for (const [x, w] of [[27, 13], [41, 13]]) {
        const b = s.add(BK, { layer: 4, R: 3, k: 1.3, grad: 0.15 }); hdF2_rr(s, b, x, 20, w, 16, 1);
        const pg = s.add(hdPal('#b8ae96', '#e8dcc4', '#fff7e6', '#fffbf2', '#ffffff'), { layer: 5, R: 1, k: 1, grad: 0 }); hdF2_rr(s, pg, x + 1, 20, w - 2, 3, 1);
        hdF2_hl(s, b, x + 1, x + w - 2, 26, 1); hdF2_hl(s, b, x + 1, x + w - 2, 31, 1);
    }
    s.px(38, 17, '#e0304a'); s.px(38, 18, '#e0304a'); s.px(38, 19, '#e0304a');
    /* the lamp: a brass cap, glass with the flame's light, a brass foot */
    const capL = s.add(hdPal('#4a3214', '#6e5028', '#8a6a3a', '#a4824e', '#bc9a62'), { layer: 4, R: 3, k: 1.4, grad: 0.3, cast: 2 }); hdF2_rr(s, capL, 66, 6, 18, 9, 3); hdF2_rr(s, capL, 70, 4, 10, 4, 2);
    const gl = s.add(hdPal('#c9a43a', '#f2c84a', '#ffd84a', '#ffe680', '#fff4c0'), { layer: 3, R: 4, k: 0.6, bias: 0.08 }); hdF2_rr(s, gl, 69, 15, 12, 13, 2);
    const fr = s.add(HDF2_BRASS, { layer: 4, R: 2, k: 1.5 }); s.rect(fr, 66, 15, 4, 13); s.rect(fr, 80, 15, 4, 13);
    const foot = s.add(HDF2_BRASS, { layer: 4, R: 2, k: 1.4, grad: 0.3 }); hdF2_rr(s, foot, 64, 27, 22, 9, 2);
    hdF2_dots(s, [[74, 19], [75, 19], [74, 20], [75, 20], [75, 21]], '#fffbe8'); hdF2_dots(s, [[71, 17], [71, 18]], '#ffffff');
    hdF2_drop(s, capL, 2);
});

/* the hatch: an opening in the floor with a dark iron frame and the ladder going down into the dark */
hdF2_reg('f_lh_hatch', 16, 16, 8, 15, s => {
    const fr = s.add(hdPal('#16141c', '#2a2632', '#3a3340', '#4a4452', '#5a5464'), { layer: 1, R: 3, k: 1.2, grad: 0.1 }); hdF2_rr(s, fr, 0, 6, 48, 42, 2);
    const lip = s.add(hdPal('#4e5268', '#6e7288', '#8a8ea8', '#a4a8c0', '#c0c4d8'), { layer: 2, R: 2, k: 1.3, grad: 0.3 }); hdF2_rr(s, lip, 0, 6, 48, 5, 2);
    const hole = s.add(hdPal('#08070c', '#100e16', '#1c1a24', '#24212e', '#2c2838'), { layer: 3, R: 2, flat: 1, grad: -0.3, bias: 0.05 }); s.rect(hole, 6, 12, 36, 30);
    /* the rungs, fainter the deeper they go, the rails either side */
    const rails = s.add(hdPal('#16141c', '#24212c', '#3a3446', '#4a4456', '#5a5468'), { layer: 4, R: 1, k: 1.2, grad: 0.4 }); s.rect(rails, 11, 12, 3, 30); s.rect(rails, 34, 12, 3, 30);
    [[16, '#6e6678', '#8a8296'], [25, '#56505e', '#6a6274'], [34, '#403a48', '#4e4858']].forEach(([y, c, l]) => { for (let x = 12; x < 36; x++) { s.px(x, y, l); s.px(x, y + 1, c); } });
    /* the far rim's shadow falls into the hole, the near rim catches the light */
    for (let x = 6; x < 42; x++) { s.px(x, 12, '#08070c'); s.px(x, 13, '#100e16'); }
    hdF2_hl(s, fr, 2, 45, 43, 1); hdF2_hl(s, fr, 2, 45, 44, 1);
});

/* the great lamp: the lighthouse's Fresnel lens, rings of prism glass round the lamp, on an iron column and base */
hdF2_reg('f_lh_lens', 32, 46, 16, 45, s => {
    const IR = hdPal('#141218', '#24202c', '#3a3340', '#4a4452', '#5c566a'), COL = hdPal('#24202c', '#3c3644', '#5a5260', '#6c6474', '#80788a');
    const base = s.add(IR, { layer: 1, R: 6, k: 1.1, grad: 0.3 }); s.ellipse(base, 48, 125, 40.5, 10); s.rect(base, 9, 117, 78, 8);
    const baseTop = s.add(hdPal('#24202c', '#3a3446', '#4a4452', '#5a5464', '#6c6678'), { layer: 2, R: 6, k: 0.8, grad: 0.1, bias: 0.04 }); s.ellipse(baseTop, 48, 120, 39, 8.5);
    const col = s.add(COL, { layer: 3, R: 8, k: 1.5, grad: 0.05 }); s.rect(col, 30, 90, 36, 34);
    hdF2_vl(s, col, 36, 93, 122, 1); hdF2_vl(s, col, 37, 93, 122, 1);
    const rim = s.add(hdPal('#4e5268', '#6e7288', '#8a8ea8', '#a4a8c0', '#c0c4d8'), { layer: 4, R: 2, k: 1.4, grad: 0.3, cast: 2 }); hdF2_rr(s, rim, 27, 88, 42, 6, 2);
    /* the lens: a beehive of glass rings, each a prism lit at its top edge, darker underneath */
    const G1 = hdPal('#4a7a9c', '#8ab8d8', '#b8dcf0', '#dff2ff', '#ffffff');
    const lens = s.add(G1, { layer: 3, R: 14, k: 0.9, grad: 0.05 });
    const halfW = y => { const t = (y - 10) / 80; return y < 10 ? 0 : 19 + Math.sin(Math.min(1, t) * Math.PI) * 11; };
    for (let y = 10; y < 90; y++) { const w = halfW(y); s.rect(lens, Math.round(48 - w), y, Math.round(w * 2), 1); }
    hdF2_later(s, () => hdF2_each(s, lens, (x, y) => { const f = (y - 12) % 9; if (f < 0) return; if (f <= 1) s.mod(x, y, 1); else if (f >= 6) s.mod(x, y, -1); if (f === 8) s.mod(x, y, -1); }));
    hdF2_later(s, () => hdF2_each(s, lens, (x, y) => { if (Math.abs(x - 30 + (y - 50) * 0.05) < 1.2 || Math.abs(x - 34 + (y - 50) * 0.05) < 0.6) s.mod(x, y, 1); }));
    const cap = s.add(IR, { layer: 4, R: 4, k: 1.3, grad: 0.3, cast: 2 }); hdF2_rr(s, cap, 36, 0, 24, 12, 4); hdF2_rr(s, cap, 33, 8, 30, 5, 2);
    /* the lamp in the middle, lit, and its light through the rings round it (where today's sprite has it) */
    hdF2_later(s, () => {
        for (let y = 34; y < 68; y++) for (let x = 34; x < 66; x++) {
            if (s.at(x, y) !== lens) continue;
            const d = Math.hypot((x + 0.5 - 49) / 6.5, (y + 0.5 - 50.5) / 9.5), band = (y - 12) % 9;
            if (d < 0.5) s.px(x, y, '#ffffff');
            else if (d < 1) s.px(x, y, band >= 7 ? '#ffe690' : band <= 1 ? '#fffbe0' : '#fff2b0');
            else if (d < 1.9) s.px(x, y, hdF2_mix(G1[band <= 1 ? 4 : band >= 6 ? 2 : 3], '#fff2b0', 0.8 * Math.pow((1.9 - d) / 0.9, 1.3)));
        }
    });
    hdF2_drop(s, cap, 2);
});

/* the life ring: a red and white ring, round in section, hanging on the wall */
hdF2_reg('f_lh_lifering', 16, 16, 8, 15, s => {
    const R = hdPal('#6e1420', '#b01e34', '#e0304a', '#f05a6a', '#ff8a90'), Wt = hdPal('#9aa0b0', '#d8dce6', '#f8f8fa', '#ffffff', '#ffffff');
    const ring = s.add(R, { layer: 1, R: 6, k: 1.6, grad: 0.15 });
    for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) { const d = Math.hypot(x + 0.5 - 24, (y + 0.5 - 24) * 1.03); if (d <= 19.5 && d >= 8.6) s.plot(ring, x, y); }
    /* the white quarters at the diagonals, as today's ring has them */
    hdF2_later(s, () => hdF2_each(s, ring, (x, y) => { const a = Math.atan2(y + 0.5 - 24, x + 0.5 - 24) / Math.PI * 4; const q = ((a % 2) + 2) % 2; if (q > 0.58 && q < 1.42) s.recolor(x, y, Wt); }));
});

/* the sea chart: a framed map with the sea, an island, depth soundings and a compass rose with its lines */
hdF2_reg('f_lh_map', 32, 16, 16, 15, s => {
    const fr = s.add(hdPal('#3a2814', '#634a28', '#8a6a3a', '#a4824e', '#b89a62'), { layer: 1, R: 3, k: 1.3, grad: 0.15 }); hdF2_rr(s, fr, 0, 0, 96, 48, 3);
    hdF2_grain(s, fr, 81, 3, false, 0, 0, 95, 6); hdF2_grain(s, fr, 82, 3, false, 0, 41, 95, 47);
    const pap = s.add(hdPal('#9a8a64', '#d4c49a', '#e8d8b0', '#f0e4c4', '#f8f0dc'), { layer: 2, R: 3, k: -0.6, grad: 0.08 }); s.rect(pap, 6, 6, 84, 36);
    hdF2_later(s, () => hdF2_each(s, pap, (x, y) => { const v = hdF2_vn(x * 0.12, y * 0.12, 83); if (v < 0.22) s.mod(x, y, -1); }));
    const sea = s.add(hdPal('#4a7a98', '#86b4d2', '#a8d0e8', '#bcdcee', '#d4ecf8'), { layer: 3, R: 2, flat: 1, grad: 0.1 }); s.rect(sea, 9, 9, 36, 30);
    /* the island with its beach, the shallows round it, little wave marks and soundings */
    const shal = s.add(hdPal('#6a9ab8', '#a4cce2', '#c4e2f2', '#d4ecf8', '#e8f6fc'), { layer: 4, R: 2, flat: 1 }); s.ellipse(shal, 27, 23.5, 12, 8);
    const isl = s.add(hdPal('#8a7848', '#c4b47c', '#d8c890', '#e4d8a8', '#f0e8c4'), { layer: 5, R: 3, k: 1, grad: 0.2 }); s.ellipse(isl, 26, 23, 8.5, 6); s.ellipse(isl, 31, 21, 4, 3.5);
    const hill = s.add(hdPal('#4a6a2c', '#6e8a44', '#8aa858', '#a0bc6c', '#b8d084'), { layer: 6, R: 2.5, k: 1.2, grad: 0.3 }); s.ellipse(hill, 26, 22, 4, 3);
    s.px(32, 20, '#e0304a'); s.px(32, 19, '#e0304a'); s.px(32, 18, '#5e4a2a');
    for (const [x, y] of [[13, 13], [38, 12], [14, 33], [40, 32], [36, 36], [12, 24]]) { s.px(x, y, '#6a9ab8'); s.px(x + 1, y - 1, '#6a9ab8'); s.px(x + 2, y, '#6a9ab8'); }
    for (const [x, y] of [[19, 14], [41, 22], [20, 35], [33, 34]]) s.px(x, y, '#4a7a98');
    /* the compass rose: rhumb lines from its middle, the four points, north in red */
    const cx = 69, cy = 24;
    for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; for (let r = 4; r < 22; r += 1) { const x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r * 0.85); if (x > 47 && x < 89 && y > 7 && y < 40 && (k % 4 === 0 || r % 2 === 0)) s.px(x, y, k % 4 === 0 ? '#8a6a3a' : '#c8b890'); } }
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) for (let r = 0; r < 12; r++) { const w = Math.max(0, Math.floor((12 - r) / 5)); for (let i = -w; i <= w; i++) { const x = cx + dx * r + (dy ? i : 0), y = cy + dy * r + (dx ? i : 0); s.px(x, y, i < 0 || (i === 0 && (dx > 0 || dy > 0)) ? '#5e4420' : '#8a6a3a'); } }
    for (let r = 6; r < 12; r++) { s.px(cx, cy - r, '#e0304a'); s.px(cx - 1, cy - r, r < 9 ? '#b01e34' : '#e0304a'); }
    s.px(cx, cy, '#e8d8b0');
    /* a dashed course from the island to the rose */
    for (let x = 36; x < 60; x += 3) s.px(x, Math.round(21 + (x - 36) * 0.08), '#5e4a2a');
});

/* the keeper's shelf: a ship in a bottle and a coil of rope above, three jars and a blue book below */
hdF2_reg('f_lh_shelf', 32, 30, 16, 29, s => {
    const WD = hdPal('#2a180c', '#5e3a22', '#8a5a3a', '#9c6c48', '#ae7e56');
    const back = s.add(hdPal('#1a0e06', '#2e1c10', '#3e2818', '#4a3020', '#5a3a24'), { layer: 0, R: 3, k: -0.6, grad: -0.15 }); s.rect(back, 6, 9, 84, 66);
    hdF2_grain(s, back, 91, 7, true, 6, 9, 89, 74);
    const frame = s.add(WD, { layer: 1, R: 2.5, k: 1.2, grad: 0.1 }); hdF2_rr(s, frame, 0, 3, 96, 82, 3);
    for (let y = 9; y < 75; y++) for (let x = 6; x < 90; x++) s.plot(back, x, y);
    hdF2_grain(s, frame, 92, 3, true, 0, 9, 5, 74); hdF2_grain(s, frame, 93, 3, true, 90, 9, 95, 74); hdF2_grain(s, frame, 94, 3, false, 0, 3, 95, 8);
    const SH = hdPal('#3a2414', '#86583a', '#b07a4a', '#c08c5a', '#d0a06c');
    const sh1 = s.add(SH, { layer: 3, R: 2, k: 1.2, grad: 0.3, cast: 2 }); s.rect(sh1, 3, 42, 90, 6);
    const sh2 = s.add(SH, { layer: 3, R: 2, k: 1.2, grad: 0.3, cast: 2 }); s.rect(sh2, 3, 72, 90, 6);
    hdF2_grain(s, sh1, 95, 3, false, 3, 42, 92, 47); hdF2_grain(s, sh2, 96, 3, false, 3, 72, 92, 77);
    /* the ship in a bottle: glass with a glint, a little hull and white sails inside, a cork */
    const gl = s.add(hdPal('#6aa0b0', '#9cd0dc', '#bfe8f0', '#d8f4f8', '#ffffff'), { layer: 2, R: 5, k: 0.9, grad: 0.1 }); hdF2_rr(s, gl, 12, 24, 27, 13, 6); hdF2_rr(s, gl, 36, 27, 6, 7, 2);
    const cork = s.add(hdPal('#4a3018', '#76502e', '#9a6b45', '#ae805a', '#c09470'), { layer: 3, R: 1.5, k: 1.2 }); hdF2_rr(s, cork, 41, 27, 4, 7, 1);
    hdF2_over(s, o => {
        const hull = o.add(hdPal('#2a180c', '#4a3018', '#6b4a2a', '#82603a', '#96744a'), { layer: 1, R: 1.5, k: 1 }); o.poly(hull, [[18, 32], [33, 32], [31, 35], [20, 35]]);
        const sail = o.add(hdPal('#a8acb8', '#e0e2e8', '#ffffff', '#ffffff', '#ffffff'), { layer: 2, R: 2, k: 1, grad: 0.3 }); o.poly(sail, [[21, 31], [25, 26], [25, 31]]); o.poly(sail, [[26, 31], [26, 25], [31, 31]]);
        const mast = o.add(hdPal('#2a180c', '#4a3018', '#6b4a2a', '#82603a', '#96744a'), { layer: 3, R: 1 }); o.rect(mast, 25, 24, 1, 8);
    });
    hdF2_dots(s, [[15, 26], [16, 26], [14, 27], [14, 28]], '#ffffff'); hdF2_dots(s, [[13, 35], [37, 28]], '#eafcff');
    /* the coil of rope, wound round and round */
    const rope = s.add(hdPal('#5e4a2a', '#9a8458', '#d8c090', '#e4d0a4', '#f0e2bc'), { layer: 2, R: 4, k: 1.2, grad: 0.2 }); s.ellipse(rope, 64.5, 32, 12.5, 7);
    const hole = s.add(hdPal('#3a2a14', '#6e5a36', '#b8a070', '#c8b080', '#d8c094'), { layer: 3, R: 2, k: -1 }); s.ellipse(hole, 64.5, 31.5, 6, 3);
    hdF2_later(s, () => hdF2_each(s, rope, (x, y) => { const d = Math.hypot((x + 0.5 - 64.5) / 12.5, (y + 0.5 - 32) / 7); if (Math.floor(d * 6) % 2 === 0 && (x + y) % 3 === 0) s.mod(x, y, -1); else if ((x * 2 + y) % 5 === 0) s.mod(x, y, 1); }));
    /* three jars with lids, a blue book lying flat */
    [[15, '#6aa0c8'], [30, '#e0a050'], [45, '#8cc152']].forEach(([x, c]) => {
        const j = s.add(hdRamp(c), { layer: 2, R: 4, k: 1.2, grad: 0.15 }); hdF2_rr(s, j, x, 53, 12, 19, 2);
        const lid = s.add(hdPal('#6e6a64', '#a8a29a', '#c8c2ba', '#dcd6ce', '#f0ece6'), { layer: 3, R: 1.5, k: 1.3, cast: 1 }); hdF2_rr(s, lid, x + 1, 50, 10, 5, 1);
        const lab = s.add(hdPal('#9a9080', '#d8d0bc', '#f4ecd8', '#faf4e6', '#ffffff'), { layer: 3, R: 1, k: 0.8 }); hdF2_rr(s, lab, x + 2, 60, 8, 6, 1);
        s.px(x + 2, 55, '#ffffff'); s.px(x + 2, 56, '#ffffff');
    });
    const book = s.add(hdPal('#141c30', '#28385e', '#3f5a8a', '#4e6c9e', '#6482b0'), { layer: 2, R: 2, k: 1.2, grad: 0.15 }); hdF2_rr(s, book, 63, 60, 24, 12, 1);
    const pages = s.add(hdPal('#b8ae96', '#e8dcc4', '#fff7e6', '#fffbf2', '#ffffff'), { layer: 3, R: 1, k: 0.8, grad: 0.1 }); hdF2_rr(s, pages, 64, 57, 22, 4, 1);
    hdF2_hl(s, book, 65, 85, 66, 1);
    hdF2_drop(s, sh1, 2);
});

/* the spiral stairs: iron steps fanning round a central post, up to the hole in the ceiling, from a round iron plate */
hdF2_reg('f_lh_stairs', 32, 44, 16, 43, s => {
    const IR = hdPal('#141218', '#24202c', '#3a3340', '#4a4452', '#5a5468');
    const plate = s.add(hdPal('#24202c', '#3c3644', '#5a5260', '#6a6272', '#7c7486'), { layer: 0, R: 8, k: 0.9, grad: 0.2 });
    s.ellipse(plate, 48, 114, 40, 14.5);
    hdF2_later(s, () => hdF2_each(s, plate, (x, y) => { const d = Math.hypot((x + 0.5 - 48) / 40, (y + 0.5 - 114) / 14.5); if (Math.abs(d - 0.82) < 0.04 || Math.abs(d - 0.5) < 0.05) s.mod(x, y, -1); if (hdF2_h(x >> 1, y, 3) < 0.03) s.mod(x, y, 1); }));
    const ceil = s.add(IR, { layer: 6, R: 3, k: 1.2, grad: 0.25, cast: 3 }); hdF2_rr(s, ceil, 3, 0, 84, 9, 2);
    const ceilRim = s.add(hdPal('#24202c', '#3c3644', '#5a5260', '#6b6f84', '#8a8ea8'), { layer: 6, R: 1.5, k: 1.2 }); hdF2_rr(s, ceilRim, 6, 8, 78, 4, 1);
    hdF2_hl(s, ceil, 5, 84, 1, 1);
    /* the post */
    const post = s.add(IR, { layer: 2, R: 4, k: 1.6, grad: 0.05 }); s.rect(post, 39, 9, 9, 108);
    hdF2_vl(s, post, 41, 10, 114, 1);
    /* the steps where today's are: [y, from x, to x, in front of the post?]: each a wedge, its tread lit on top (wider at the
       outer end), the edge under it, and the dark underside of the step above showing near the post */
    const steps = [[17, 48, 84, 0], [29, 48, 75, 0], [41, 37, 52, 1], [53, 21, 52, 1], [65, 18, 52, 1], [77, 37, 52, 1], [89, 48, 75, 0], [101, 48, 84, 0]];
    for (const [y, x0, x1, fr] of steps) {
        const lyr = fr ? 3 : 1, outerL = x0 < 40, xo = outerL ? x0 : x1, xp = outerL ? x1 : x0;
        const und = s.add(IR, { layer: lyr - 0.1, R: 1.5, k: 1, grad: 0, bias: -0.1 });
        s.poly(und, [[xp, y - 4], [xp + (xo - xp) * 0.7, y - 2], [xp + (xo - xp) * 0.7, y], [xp, y]]);
        const tr = s.add(hdPal('#4e5268', '#8a8ea8', '#a8acc0', '#bcc0d2', '#d4d8e6'), { layer: lyr + 0.2, R: 2, k: 1, grad: 0.25, cast: 2 });
        s.poly(tr, [[xp, y], [xo + (outerL ? 1 : -1), y - 3], [xo, y + 4], [xp, y + 4]]);
        const nose = s.add(hdPal('#24202c', '#4a4c5e', '#6b6f84', '#7c8096', '#8e92a8'), { layer: lyr, R: 1.5, k: 1.2, grad: 0.1 });
        s.rect(nose, Math.min(xo, xp), y + 4, Math.abs(xo - xp), 4);
        for (let x = Math.min(xo, xp) + 4; x < Math.max(xo, xp) - 3; x += 4) hdF2_m(s, tr, x, y + 2, -1);
        hdF2_drop(s, nose, 2);
    }
});

/* the pot-bellied stove: cast iron with a sheen, a stove pipe up out of the frame, the fire glowing in its window */
hdF2_reg('f_lh_stove', 16, 30, 8, 29, s => {
    const CI = hdPal('#0e0c12', '#1c1922', '#2e2a36', '#3e3948', '#55505e'), PIPE = hdPal('#141218', '#24202c', '#3a3340', '#4a4452', '#5e586c');
    const pipe = s.add(PIPE, { layer: 0, R: 4, k: 1.8, grad: 0.05 }); s.rect(pipe, 22, 0, 12, 36);
    hdF2_vl(s, pipe, 25, 0, 33, 1); hdF2_hl(s, pipe, 22, 33, 14, -1); hdF2_hl(s, pipe, 22, 33, 15, 1);
    const legs = s.add(CI, { layer: 1, R: 2, k: 1.4, grad: 0.2 }); s.poly(legs, [[10, 80], [17, 80], [16, 90], [11, 90]]); s.poly(legs, [[31, 80], [38, 80], [37, 90], [32, 90]]);
    const belly = s.add(CI, { layer: 2, R: 12, k: 1.5, grad: 0.15 });
    hdF2_blob(s, belly, 24, 55, 19.5, 18, 2.3, 41, 73); s.poly(belly, [[12, 70], [36, 70], [33, 83], [15, 83]]);
    const collar = s.add(CI, { layer: 3, R: 3, k: 1.4, grad: 0.2 }); hdF2_rr(s, collar, 15, 33, 18, 6, 2); hdF2_rr(s, collar, 12, 37, 24, 5, 2);
    const band = s.add(hdPal('#24202c', '#3c3644', '#5a5260', '#6c6474', '#80788a'), { layer: 4, R: 2, k: 1.4, cast: 2 }); hdF2_rr(s, band, 9, 39, 30, 5, 2);
    const foot = s.add(hdPal('#24202c', '#3c3644', '#5a5260', '#6c6474', '#80788a'), { layer: 4, R: 2, k: 1.4 }); hdF2_rr(s, foot, 10, 79, 28, 4, 1);
    /* the iron's sheen: a soft highlight down the belly's left */
    hdF2_later(s, () => hdF2_each(s, belly, (x, y) => { const u = (x - 15) / 4, v = (y - 52) / 10; if (u * u + v * v < 1) s.mod(x, y, 1); }));
    /* the fire window: a frame, the glow behind three bars, the light spilling onto the iron round it */
    const win = s.add(hdPal('#8a2a08', '#e85a14', '#ff8a2a', '#ffb048', '#ffd870'), { layer: 4, R: 3, k: -0.9, grad: -0.5, bias: 0.1 }); hdF2_rr(s, win, 18, 51, 12, 12, 2);
    hdF2_later(s, () => {
        for (let y = 46; y < 69; y++) for (let x = 12; x < 37; x++) { const d = Math.max(Math.abs(x - 23.5) - 6, Math.abs(y - 56.5) - 6); if (d > 0 && d < 4 && s.at(x, y) === belly) s.mod(x, y, d < 2 ? 1 : 0); }
        for (const x of [21, 24, 27]) for (let y = 51; y < 63; y++) if (s.at(x, y) === win) s.px(x, y, y < 53 ? '#3e3948' : '#1c1922');
        hdF2_dots(s, [[22, 57], [23, 58], [25, 56], [26, 58], [23, 60], [26, 61]], '#ffd84a');
        hdF2_dots(s, [[22, 59], [25, 59]], '#fff4c0');
    });
});

/* a wooden chest: a domed lid of planks, brass straps with rivets, a lock plate with its keyhole */
function hdF2_chest(s, o) {
    const lid = s.add(hdRamp(o.lid), { layer: 1, R: 6, k: 1.2, grad: 0.2 }); hdF2_rr(s, lid, 3, 3, 42, 19, 8); s.rect(lid, 3, 12, 42, 10);
    const body = s.add(hdRamp(o.body), { layer: 1, R: 4, k: 1.1, grad: 0.1 }); hdF2_rr(s, body, 3, 22, 42, 29, 2);
    hdF2_grain(s, body, o.seed, 4, false, 3, 22, 44, 50); hdF2_grain(s, lid, o.seed + 1, 4, false, 3, 3, 44, 21);
    for (const y of [8, 14, 29, 36, 43]) hdF2_hl(s, y < 22 ? lid : body, 4, 43, y, -1);
    const B = o.brass;
    const lipB = s.add(B, { layer: 3, R: 1.5, k: 1.3, cast: 2 }); hdF2_rr(s, lipB, 3, 21, 42, 4, 1);
    for (const x of [12, 33]) { const st = s.add(B, { layer: 2, R: 1.5, k: 1.4, grad: 0.15 }); hdF2_rr(s, st, x, 3, 4, 48, 1); for (let y = 8; y < 50; y += 7) { s.px(x + 1, y, o.rivet[0]); s.px(x + 2, y + 1, o.rivet[1]); } }
    /* an old one: worn patches and scratches */
    if (o.worn) for (const [x, y] of [[8, 13], [9, 13], [38, 10], [27, 42], [28, 42], [7, 37], [40, 30], [21, 33]]) { hdF2_m(s, y < 22 ? lid : body, x, y, 1); hdF2_m(s, y < 22 ? lid : body, x + 1, y + 1, -1); }
    const lock = s.add(o.lock, { layer: 4, R: 2, k: 1.3, grad: 0.2 }); hdF2_rr(s, lock, 20, 20, 8, 10, 2);
    s.px(23, 24, '#2d2230'); s.px(24, 24, '#2d2230'); s.px(23, 25, '#2d2230'); s.px(24, 25, '#3a2a20'); s.px(24, 26, '#2d2230');
    hdF2_drop(s, lipB, 2);
}
hdF2_reg('f_lh_trunk', 16, 18, 8, 17, s => hdF2_chest(s, { lid: '#8a5a3a', body: '#6b4a2a', brass: HDF2_BRASS, lock: HDF2_GOLD, rivet: ['#fff3c0', '#6a4a14'], seed: 101 }));
/* the old trunk: the same chest gone grey with age, dark iron straps, a dull brass lock */
hdF2_reg('f_old_trunk', 16, 18, 8, 17, s => hdF2_chest(s, { lid: '#8a7a68', body: '#7a6a5a', brass: hdPal('#241c14', '#3e3228', '#5a4a3a', '#6c5c4a', '#7e6e5c'), lock: hdPal('#5e4e24', '#8a7838', '#b8a060', '#ccb87a', '#e0d09a'), rivet: ['#9a8a78', '#2d2230'], seed: 111, worn: 1 }));

/* ---------------------------------------------------------------- games, prizes and things on the shelf */
/* capitals and digits three wide and five tall (score boards, plaques) */
const HDF2_CAPS = {
    A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['.##', '#..', '#..', '#..', '.##'], E: ['###', '#..', '##.', '#..', '###'],
    H: ['#.#', '#.#', '###', '#.#', '#.#'], I: ['###', '.#.', '.#.', '.#.', '###'], J: ['..#', '..#', '..#', '#.#', '.#.'], K: ['#.#', '#.#', '##.', '#.#', '#.#'],
    L: ['#..', '#..', '#..', '#..', '###'], M: ['#.#', '###', '###', '#.#', '#.#'], O: ['.#.', '#.#', '#.#', '#.#', '.#.'], R: ['##.', '#.#', '##.', '#.#', '#.#'],
    S: ['.##', '#..', '.#.', '..#', '##.'], Y: ['#.#', '#.#', '.#.', '.#.', '.#.'],
    0: ['.#.', '#.#', '#.#', '#.#', '.#.'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['##.', '..#', '.#.', '#..', '###'], 3: ['##.', '..#', '.#.', '..#', '##.'],
    4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '##.', '..#', '##.'], 6: ['.##', '#..', '##.', '#.#', '.#.'], 7: ['###', '..#', '.#.', '.#.', '.#.'],
    8: ['.#.', '#.#', '.#.', '#.#', '.#.'], 9: ['.#.', '#.#', '.##', '..#', '##.'],
};
function hdF2_capsPts(str, x, y) {
    const pts = [];
    for (const ch of str) {
        const g = HDF2_CAPS[ch];
        if (!g) { x += 3; continue; }
        for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (g[j][i] === '#') pts.push([x + i, y + j]);
        x += 4;
    }
    return pts;
}

/* the high score board: a dark board, a pink heading, yellow names and blue scores lit up */
hdF2_reg('f_hiscore_board', 32, 16, 16, 15, s => {
    const under = hdF2_neonBoard(s, 0, 48);
    hdF2_later(s, () => {
        hdF2_glow(s, hdF2_capsPts('HI SCORES', 30, 5), '#ff5aa8', under, 1, 0.3);
        for (let x = 9; x < 87; x++) if (x < 27 || x > 67) s.px(x, 7, (x % 3) ? '#ff5aa8' : '#c8407e');
        [['SARAH', '12400'], ['JOE', '9850'], ['KAI', '7300']].forEach(([n, sc], k) => {
            const y = 15 + k * 9;
            hdF2_glow(s, hdF2_capsPts(n, 10, y), '#ffd84a', under, 1, 0.3);
            hdF2_glow(s, hdF2_capsPts(sc, 86 - sc.length * 4, y), '#4ec3d9', under, 1, 0.3);
            for (let x = 33; x < 84 - sc.length * 4; x += 3) s.px(x, y + 4, '#3a3546');
        });
    });
});

/* the model house: a little red-roofed house of card and paint on a wooden base */
hdF2_reg('f_house_model', 16, 16, 8, 15, s => {
    const base = s.add(hdPal('#3a2414', '#6a4426', '#8a5a33', '#a4723f', '#bc8a52'), { layer: 1, R: 2, k: 1.3, grad: 0.3 }); hdF2_rr(s, base, 3, 44, 42, 4, 1);
    const wall = s.add(hdPal('#a08870', '#e8d0b4', '#fbe7d0', '#fdf2e4', '#fffaf2'), { layer: 1, R: 3, k: 1, grad: 0.12 }); s.rect(wall, 8, 29, 32, 16);
    const side = s.add(hdPal('#8a7058', '#ccae92', '#e8cbb0', '#f0dac4', '#f8e8d8'), { layer: 1.5, R: 1, k: 1, bias: -0.1 }); s.rect(side, 34, 29, 6, 16);
    const roof = s.add(hdPal('#5a1820', '#9a3a44', '#c8505a', '#d86a72', '#e8888e'), { layer: 3, R: 5, k: 1.2, grad: 0.2, cast: 2 }); s.poly(roof, [[24, 9], [44, 28], [4, 28]]);
    const eave = s.add(hdPal('#4a1218', '#7a2a32', '#9a3a44', '#ac4a54', '#bc5c64'), { layer: 4, R: 1.5, k: 1.2, cast: 2 }); hdF2_rr(s, eave, 3, 27, 42, 4, 1);
    /* shingle rows on the roof */
    hdF2_later(s, () => hdF2_each(s, roof, (x, y) => { const r = (y - 9) % 4; if (r === 3) s.mod(x, y, -1); else if (r === 0 && (x + Math.floor((y - 9) / 4) * 2) % 5 === 0) s.mod(x, y, -1); }));
    const chim = s.add(hdPal('#3a2a28', '#6a5250', '#8a6e6a', '#9e8480', '#b49a96'), { layer: 2, R: 1.5, k: 1.3 }); s.rect(chim, 31, 12, 5, 9);
    /* windows with white frames and a glint, the red door with its knob */
    for (const x of [10, 28]) {
        const fr = s.add(hdPal('#9a9a9a', '#e0e0e0', '#ffffff', '#ffffff', '#ffffff'), { layer: 2, R: 1, k: 1 }); s.rect(fr, x, 31, 8, 7);
        const gl = s.add(hdPal('#4a8aa8', '#7cbcd8', '#9fd8ef', '#bfe6f6', '#e4f6fc'), { layer: 3, R: 1.5, k: 0.8, grad: 0.3 }); s.rect(gl, x + 1, 32, 6, 5);
        s.px(x + 1, 32, '#ffffff'); s.px(x + 2, 32, '#ffffff'); s.px(x + 1, 33, '#ffffff');
        for (let y = 32; y < 37; y++) s.px(x + 4, y, '#ffffff');
    }
    const door = s.add(hdPal('#5a0e1a', '#8a1a2a', '#b3263a', '#c8404e', '#da5a66'), { layer: 2, R: 2, k: 1.2, grad: 0.15 }); hdF2_rr(s, door, 19, 33, 8, 12, 1);
    s.px(25, 39, '#ffd84a');
    hdF2_drop(s, eave, 2);
});

/* the game night trophy: a gold cup with two handles on a wooden plinth */
hdF2_reg('f_jackbox_trophy', 16, 16, 8, 15, s => {
    const G = HDF2_GOLD;
    const hand = s.add(G, { layer: 1, R: 2, k: 1.5 });
    for (const sx of [-1, 1]) for (let a = 0; a <= 24; a++) { const t = -Math.PI / 2 + Math.PI * a / 24; s.ellipse(hand, 24 + sx * (13.5 + Math.cos(t) * 6), 12 + Math.sin(t) * 5, 1.6, 1.6); }
    const cup = s.add(G, { layer: 2, R: 10, k: 1.5, grad: 0.15 });
    s.poly(cup, [[8, 6], [40, 6], [39, 13], [35, 21], [28, 26], [20, 26], [13, 21], [9, 13]]);
    const lip = s.add(hdPal('#6a4a14', '#9a7020', '#d0a030', '#ffcf40', '#ffe27a'), { layer: 3, R: 2, k: 1, grad: 0.2 }); s.ellipse(lip, 24, 6.5, 16, 3);
    const inside = s.add(hdPal('#4a3008', '#7a5414', '#a87a20', '#c8962c', '#e0b040'), { layer: 4, R: 2, k: -1, grad: -0.3 }); s.ellipse(inside, 24, 6.8, 13.5, 1.8);
    const stem = s.add(G, { layer: 2, R: 2, k: 1.6 }); s.rect(stem, 21, 25, 6, 10);
    const knot = s.add(G, { layer: 3, R: 2, k: 1.5 }); s.ellipse(knot, 24, 30, 4.5, 2.2); hdF2_rr(s, knot, 17, 33, 14, 3, 1);
    const plinth = s.add(hdPal('#2e1a0e', '#5e3a22', '#8a5a33', '#a4723f', '#bc8a52'), { layer: 3, R: 3, k: 1.2, grad: 0.25 }); hdF2_rr(s, plinth, 15, 35, 18, 11, 2);
    const plate = s.add(G, { layer: 4, R: 1, k: 1, grad: 0.3 }); hdF2_rr(s, plate, 19, 39, 10, 4, 1);
    hdF2_grain(s, plinth, 121, 3, false, 15, 35, 32, 45);
    /* the shine: a long highlight down the cup's left, a star glint */
    hdF2_later(s, () => hdF2_each(s, cup, (x, y) => { if (Math.abs(x - 15 - (y - 8) * 0.4) < 1.3 && y > 8 && y < 21) s.mod(x, y, 1); }));
    hdF2_dots(s, [[21, 12], [20, 13], [21, 13], [22, 13], [21, 14]], '#fff6b0'); s.px(21, 13, '#ffffff');
});

/* the laptop: an open lid, the pink screen with a white window, the keyboard and trackpad */
hdF2_reg('f_laptop', 16, 16, 8, 15, s => {
    const lid = s.add(hdPal('#8a8494', '#c8c2d2', '#e8e4ee', '#f2f0f6', '#ffffff'), { layer: 1, R: 3, k: 1.2, grad: 0.15 }); hdF2_rr(s, lid, 9, 6, 30, 26, 2);
    const scr = s.add(hdPal('#c86a88', '#f096b0', '#ffb3c8', '#ffc8d8', '#ffe0ea'), { layer: 2, R: 3, k: -0.5, grad: 0.15 }); s.rect(scr, 12, 9, 24, 20);
    const win = s.add(hdPal('#c8c0d0', '#ece8f2', '#ffffff', '#ffffff', '#ffffff'), { layer: 3, R: 1, k: 0.6, flat: 1 }); s.rect(win, 15, 13, 11, 8);
    for (let x = 15; x < 26; x++) { s.px(x, 13, '#ff8aa8'); s.px(x, 14, '#ff8aa8'); }
    for (const x of [24, 22]) s.px(x, 13, '#ffffff');
    for (let x = 17; x < 24; x++) if (x !== 20) s.px(x, 17, '#e8d0dc');
    for (let x = 15; x < 33; x++) s.px(x, 24, '#ff8aa8'), s.px(x, 25, '#ff8aa8');
    hdF2_dots(s, [[31, 11], [33, 11], [32, 11]], '#ffe0ea');
    const base = s.add(hdPal('#8a8494', '#b8b0c8', '#cfc8d8', '#e4dfea', '#f4f1f8'), { layer: 4, R: 2, k: 1.2, grad: 0.2 }); hdF2_rr(s, base, 3, 32, 42, 10, 2);
    const deck = s.add(hdPal('#a8a0b8', '#dcd6e4', '#f4f1f8', '#faf8fc', '#ffffff'), { layer: 5, R: 2, k: 0.8, grad: 0.1 }); hdF2_rr(s, deck, 4, 32, 40, 5, 2);
    /* the keys: rows of small grey squares, the trackpad below */
    hdF2_later(s, () => { for (let y = 33; y < 36; y += 2) for (let x = 7; x < 42; x += 2) s.px(x, y, '#cfc8d8'); });
    const pad = s.add(hdPal('#8a8494', '#a8a0b8', '#b8b0c8', '#c8c2d4', '#d8d2e2'), { layer: 6, R: 1, k: -0.8 }); hdF2_rr(s, pad, 18, 37, 12, 4, 1);
    hdF2_hl(s, base, 5, 42, 41, -1);
});

/* the lucky cat: a white china cat waving one paw, pink ears, a red collar and a gold bell */
hdF2_reg('f_lucky_cat', 16, 16, 8, 15, s => {
    const W = hdPal('#9a98a8', '#d4d4de', '#f6f6f8', '#ffffff', '#ffffff');
    const body = s.add(W, { layer: 2, R: 9, k: 1, grad: 0.12, bias: 0.07 }); hdF2_rr(s, body, 9, 10, 33, 36, 10);
    s.poly(body, [[11, 15], [13, 5], [21, 11]]);
    /* the glaze: a long soft highlight */
    hdF2_later(s, () => hdF2_each(s, body, (x, y) => { if (Math.hypot((x - 14) / 2.5, (y - 30) / 8) < 1) s.mod(x, y, 1); }));
    for (const [x, y] of [[14, 9], [14, 10], [15, 10], [15, 11]]) s.px(x, y, '#ffb3c8');
    /* the face: round dark eyes with a glint, a pink nose, whiskers, blush */
    for (const ex of [20, 30]) { for (let j = 0; j < 3; j++) { s.px(ex, 20 + j, '#2d2230'); s.px(ex + 1, 20 + j, '#2d2230'); } s.px(ex, 20, '#ffffff'); }
    s.px(25, 25, '#ff8aa8'); s.px(26, 25, '#ff8aa8'); s.px(24, 26, '#2d2230'); s.px(27, 26, '#2d2230');
    for (const [x, y] of [[13, 24], [14, 24], [15, 24], [13, 27], [14, 26], [36, 24], [37, 24], [38, 24], [38, 27], [37, 26]]) s.px(x, y, '#c8c8d4');
    s.px(17, 25, '#ffd0dc'); s.px(18, 25, '#ffd0dc'); s.px(33, 25, '#ffd0dc'); s.px(34, 25, '#ffd0dc');
    /* laid on as finished pixels so the round body keeps its form: the raised paw, the collar and bell, the front paws */
    hdF2_over(s, o => {
        const paw = o.add(W, { layer: 1, R: 3, k: 1.3, grad: 0.2 }); hdF2_rr(o, paw, 33, 1, 9, 16, 4);
        const col = o.add(hdPal('#6e1420', '#b0283a', '#e0405a', '#ee6676', '#f88a96'), { layer: 1, R: 1.5, k: 1.2 }); hdF2_rr(o, col, 15, 32, 20, 4, 2);
        const bell = o.add(hdPal('#6a4a14', '#c8962c', '#ffd35a', '#ffe48a', '#fff4c0'), { layer: 2, R: 2.5, k: 1.3, grad: 0.3 }); o.ellipse(bell, 25.5, 37.5, 3.6, 3.4);
        const fp = o.add(W, { layer: 1, R: 2, k: 1.2, bias: 0.05 }); hdF2_rr(o, fp, 17, 40, 7, 5, 2); hdF2_rr(o, fp, 28, 40, 7, 5, 2);
    });
    hdF2_dots(s, [[36, 6], [37, 6], [38, 6], [35, 4], [39, 4]], '#ffb3c8');
    s.px(24, 36, '#ffffff'); s.px(25, 39, '#6a4a14');
    /* the collar's shadow on the chest */
    for (let x = 17; x < 34; x++) if (x < 23 || x > 28) hdF2_m(s, body, x, 36, -1);
});

/* the stack of lumber: three planks with knots on a dark board, the middle one pushed back a little */
hdF2_reg('f_lumber_stack', 32, 28, 16, 27, s => {
    const PL = hdPal('#5e3e1e', '#b88452', '#d9a46a', '#e6b67e', '#f0c890'), TOP = hdPal('#7a5430', '#d8ae76', '#f0c890', '#f6d6a6', '#fbe4bc');
    const base = s.add(hdPal('#2e1a0e', '#5e3a22', '#8a5a33', '#a4723f', '#bc8a52'), { layer: 0, R: 2, k: 1.2, grad: 0.1 }); hdF2_rr(s, base, 6, 74, 84, 7, 1);
    [[30, 3, 90, 1], [45, 6, 87, 2], [60, 3, 90, 3]].forEach(([y, x0, w, k]) => {
        const lyr = k;
        const top = s.add(TOP, { layer: lyr + 0.1, R: 1.5, k: 1, grad: 0.1, bias: 0.04 }); hdF2_rr(s, top, x0, y, w, 4, 1);
        const face = s.add(PL, { layer: lyr, R: 3, k: 1, grad: 0.12 }); hdF2_rr(s, face, x0, y + 3, w, 9, 1);
        const under = s.add(hdPal('#4a2c14', '#8a5a33', '#b98552', '#c8965e', '#d6a66e'), { layer: lyr, R: 1, k: 1, bias: -0.04 }); hdF2_rr(s, under, x0, y + 12, w, 3, 1);
        hdF2_grain(s, face, 131 + k, 3, false, x0, y + 3, x0 + w - 1, y + 11); hdF2_grain(s, top, 141 + k, 2, false, x0, y, x0 + w - 1, y + 3);
        /* the knots where today's are: a dark eye in a few rings */
        for (let i = 0; i < 4; i++) {
            const kx = x0 + 9 + i * 24 - (k === 2 ? 3 : 0), ky = y + 7;
            hdF2_later(s, () => { for (let j = -3; j <= 3; j++) for (let ii = -5; ii <= 5; ii++) { const d = Math.hypot(ii / 1.6, j); if (s.at(kx + ii, ky + j) !== face) continue; if (d < 1.1) s.mod(kx + ii, ky + j, -2); else if (d < 2.2) s.mod(kx + ii, ky + j, 1); else if (d < 3) s.mod(kx + ii, ky + j, -1); } });
        }
        hdF2_drop(s, under, 2);
    });
});

/* ---------------------------------------------------------------- seats, mirrors and the museum */
/* the macaron stool: two pink shells with ruffled feet round a cream filling (it stands on the floor now; today's
   floated three pixels above its anchor) */
hdF2_reg('f_macaron_stool', 16, 28, 8, 27, s => {
    const SH = hdPal('#9a3a62', '#e486aa', '#f7a8c4', '#fcc0d4', '#ffdce8');
    s.dy = 9;
    const bot = s.add(SH, { layer: 1, R: 7, k: 1.2, grad: 0.15 }); hdF2_rr(s, bot, 3, 57, 42, 15, 7);
    const fill = s.add(hdPal('#a8946a', '#e8d6b0', '#fff4dc', '#fffaee', '#ffffff'), { layer: 2, R: 2.5, k: 1.2, grad: 0.2, cast: 1 }); hdF2_rr(s, fill, 2, 53, 44, 7, 3);
    const top = s.add(SH, { layer: 3, R: 9, k: 1.2, grad: 0.22, cast: 2 }); hdF2_rr(s, top, 3, 39, 42, 16, 8);
    /* the ruffled feet along each shell's edge */
    const FT = hdPal('#9a3a62', '#d87aa0', '#f0a0be', '#f8b8ce', '#fcd0e0');
    for (const y of [52, 57]) { const f = s.add(FT, { layer: y === 52 ? 3.5 : 1.5, R: 1, k: 1.2 }); for (let x = 4; x < 44; x++) { const h = 2 + ((x * 7) % 3 === 0 ? 1 : 0); for (let j = 0; j < h; j++) s.plot(f, x, y === 52 ? y + j : y + j); } hdF2_later(s, () => { for (let x = 5; x < 44; x += 3) hdF2_m(s, f, x, y + 1, -1); }); }
    hdF2_later(s, () => hdF2_each(s, top, (x, y) => { if (hdF2_h(x, y, 151) < 0.06) s.mod(x, y, 1); }));
    for (const [x, y] of [[13, 44], [14, 44], [15, 44], [12, 45], [13, 45]]) s.px(x, y, '#ffe8f0');
    s.dy = 0;
});

/* the tiny windmill: a cream tower with a red cap, latticed sails, a little door, on a wooden base */
hdF2_reg('f_mini_windmill', 16, 22, 8, 21, s => {
    const WD = hdPal('#3a2414', '#5e3e26', '#8a5a3a', '#a4724a', '#bc8a5c');
    const base = s.add(hdPal('#3a2a18', '#6a5034', '#8a6a4a', '#a0805e', '#b89674'), { layer: 1, R: 2, k: 1.3, grad: 0.3 }); hdF2_rr(s, base, 5, 60, 37, 5, 2);
    const tw = s.add(hdPal('#9a9282', '#dcd4c4', '#f4efe6', '#faf6ee', '#ffffff'), { layer: 1, R: 7, k: 1.2, grad: 0.12 }); s.poly(tw, [[18, 24], [30, 24], [41, 61], [7, 61]]);
    hdF2_later(s, () => hdF2_each(s, tw, (x, y) => { if (y % 6 === 0 && (x + y) % 9) s.mod(x, y, -1); }));
    const door = s.add(WD, { layer: 2, R: 2, k: 1.2, grad: 0.1 }); hdF2_rr(s, door, 21, 47, 6, 14, 3);
    const win = s.add(hdPal('#2a3a48', '#3a5468', '#4a6a84', '#6a8aa4', '#8aaac0'), { layer: 2, R: 1, k: 0.8 }); hdF2_rr(s, win, 22, 33, 4, 5, 1);
    const cap = s.add(hdPal('#5e1410', '#9a2a20', '#c0392b', '#d4543e', '#e47456'), { layer: 3, R: 5, k: 1.3, grad: 0.3, cast: 2 }); hdF2_rr(s, cap, 18, 14, 12, 12, 4); s.poly(cap, [[17, 25], [31, 25], [30, 19], [18, 19]]);
    /* the sails: four latticed blades in an X (where today's are), a spar down each with an open frame of slats beside it */
    const SL = hdPal('#2e1a0e', '#5e3e26', '#8a5a3a', '#a4724a', '#bc8a5c'), LAT = hdPal('#3a2414', '#7a5634', '#a87c50', '#bc9064', '#d0a678');
    for (const [x1, y1] of [[5, 2], [43, 2], [7, 35], [41, 35]]) {
        const dx = x1 - 24, dy = y1 - 14, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = (uy > 0 ? 1 : -1) * -uy, ny = (uy > 0 ? 1 : -1) * ux;
        const lat = s.add(LAT, { layer: 3.5, R: 1, k: 1, grad: 0.1 });
        const P = (t, k) => [24 + dx * t + nx * k, 14 + dy * t + ny * k];
        /* the frame: two rails and slats across, open between */
        for (const k of [1.5, 6]) s.line(lat, ...P(0.32, k), ...P(1, k), 0.6);
        for (let t = 0.32; t <= 1.001; t += 0.136) s.line(lat, ...P(t, 0), ...P(t, 6), 0.6);
        const sp = s.add(SL, { layer: 4, R: 1, k: 1.2 }); s.line(sp, 24, 14, x1, y1, 1.1);
    }
    const hub = s.add(WD, { layer: 5, R: 2, k: 1.3, grad: 0.3 }); s.ellipse(hub, 24, 14, 2.6, 2.6);
});

/* the standing mirror: an oval of glass in a wooden frame on two legs */
hdF2_reg('f_mirror_stand', 16, 28, 8, 27, s => {
    const WD = hdPal('#4a2e18', '#8a5e34', '#b98552', '#c99a66', '#d8ae7a'), LEG = hdPal('#2e1a0e', '#5e3a22', '#8a5a33', '#a4723f', '#bc8a52');
    const legs = s.add(LEG, { layer: 0, R: 2, k: 1.4, grad: 0.1 }); s.rect(legs, 13, 56, 8, 26); s.rect(legs, 31, 56, 8, 26);
    hdF2_grain(s, legs, 161, 3, true, 13, 56, 38, 81);
    const fr = s.add(WD, { layer: 1, R: 3, k: 1.3, grad: 0.15 }); hdF2_rr(s, fr, 7, 0, 34, 59, 12);
    hdF2_grain(s, fr, 162, 3, true, 7, 0, 40, 58);
    const gl = s.add(hdPal('#6a9cb4', '#a4d0e4', '#c8e8f5', '#def2fa', '#f4fcff'), { layer: 2, R: 4, k: -0.5, grad: -0.25 }); hdF2_rr(s, gl, 11, 4, 26, 51, 9);
    /* the reflection: the room's floor dimly at the bottom, two bright streaks across the top left */
    hdF2_later(s, () => hdF2_each(s, gl, (x, y) => { const q = x + y * 0.55 - 17; if ((q >= 0 && q < 3) || (q >= 6 && q < 7.5)) s.px(x, y, q < 1 || q >= 6 ? '#ffffff' : '#eefaff'); else if (y > 42) s.mod(x, y, -1); }));
});

/* the gallery bench: a tufted velvet cushion with buttons on a dark wooden seat */
hdF2_reg('f_museum_bench', 32, 28, 16, 27, s => {
    const WD = hdPal('#24140a', '#3e2614', '#5a3a24', '#6e4c30', '#82603c'), LEG = hdPal('#1c0e06', '#33200f', '#4a2e1c', '#5c3c28', '#704e36');
    const legs = s.add(LEG, { layer: 0, R: 2, k: 1.4, grad: 0.1 }); s.rect(legs, 7, 62, 10, 16); s.rect(legs, 79, 62, 10, 16);
    const seat = s.add(WD, { layer: 1, R: 3, k: 1.2, grad: 0.15, cast: 2 }); hdF2_rr(s, seat, 0, 53, 96, 11, 2);
    hdF2_grain(s, seat, 171, 3, false, 0, 53, 95, 63);
    const VEL = hdPal('#3e0e1e', '#6b2238', '#8a2f4a', '#a2405c', '#b8506e');
    const cush = s.add(VEL, { layer: 2, R: 6, k: 1.2, grad: 0.3, cast: 2 }); hdF2_rr(s, cush, 3, 34, 90, 20, 5);
    /* the tufting: buttons with soft dimples round them and creases running between */
    hdF2_later(s, () => {
        const btn = [12, 30, 48, 66, 84];
        hdF2_each(s, cush, (x, y) => {
            let m = 99; for (const bx of btn) m = Math.min(m, Math.hypot((x - bx) / 1.3, y - 42));
            if (m < 4) s.mod(x, y, -1); else if (m < 6 && y < 42) s.mod(x, y, 1);
            for (const bx of btn) { const t = (x - bx) / 9; if (Math.abs(t) <= 1 && Math.abs(y - 42 + Math.abs(t) * 5) < 0.6 && Math.abs(t) > 0.35) s.mod(x, y, -1); }
        });
        for (const bx of btn) { s.px(bx, 41, '#4a1428'); s.px(bx + 1, 41, '#4a1428'); s.px(bx, 42, '#3e0e1e'); s.px(bx + 1, 42, '#5a1a30'); s.px(bx, 40, '#c46a84'); }
    });
    hdF2_drop(s, seat, 2);
});

/* the museum desk: a long reception desk with three gold-framed panels and a little sign on top */
hdF2_reg('f_museum_desk', 48, 28, 24, 27, s => {
    const WD = hdPal('#2e180c', '#64402a', '#8a5a3c', '#9c6c4a', '#b0805c'), DK = hdPal('#1c0e06', '#33200f', '#4a2a1c', '#5c3826', '#704832');
    const body = s.add(WD, { layer: 1, R: 3, k: 1.1, grad: 0.12 }); hdF2_rr(s, body, 0, 44, 144, 37, 2);
    hdF2_grain(s, body, 181, 4, false, 0, 44, 143, 80);
    const top = s.add(hdPal('#4a2c16', '#7a4e32', '#8a5a3c', '#a06c4a', '#b4805a'), { layer: 3, R: 1.5, k: 1, grad: 0.1, bias: 0.05 }); hdF2_rr(s, top, 0, 23, 144, 5, 1);
    const front = s.add(hdPal('#2e180c', '#55341f', '#6b3f2a', '#7c4e36', '#905e44'), { layer: 3, R: 3, k: 1.1, grad: 0.12, cast: 2 }); hdF2_rr(s, front, 0, 27, 144, 13, 1);
    hdF2_grain(s, front, 182, 4, false, 0, 27, 143, 39);
    const band = s.add(DK, { layer: 3, R: 1.5, k: 1.2, cast: 2 }); hdF2_rr(s, band, 0, 39, 144, 6, 1);
    const skirt = s.add(DK, { layer: 3, R: 2, k: 1.2, grad: 0.1 }); hdF2_rr(s, skirt, 0, 72, 144, 9, 1);
    /* the panels: a gold molding round a sunk walnut panel */
    for (const x of [12, 54, 96]) {
        const g = s.add(hdPal('#6a4a14', '#a8822a', '#d9b44a', '#ecd078', '#fbeeb0'), { layer: 2, R: 2, k: 1.4, grad: 0.2 }); hdF2_rr(s, g, x, 48, 36, 24, 1);
        const p = s.add(hdPal('#2e180c', '#5a3622', '#7a4a2e', '#8c5a3c', '#a06c4a'), { layer: 3, R: 3, k: -0.8, grad: 0.1 }); hdF2_rr(s, p, x + 3, 51, 30, 18, 1);
        hdF2_grain(s, p, 183 + x, 3, false, x + 3, 51, x + 32, 68);
    }
    hdF2_hl(s, top, 1, 142, 23, 1);
    hdF2_drop(s, front, 2); hdF2_drop(s, band, 2);
    /* the sign: a white card in a little stand, a line of writing */
    const sg = s.add(hdPal('#a49c8a', '#e4ded0', '#fbf8f2', '#ffffff', '#ffffff'), { layer: 4, R: 2, k: 1, grad: 0.15 }); hdF2_rr(s, sg, 117, 13, 24, 11, 2);
    const st = s.add(hdPal('#6a4a14', '#a8822a', '#d9b44a', '#ecd078', '#fbeeb0'), { layer: 5, R: 1, k: 1.3 }); hdF2_rr(s, st, 115, 21, 28, 4, 1);
    for (let x = 121; x < 137; x++) if (x !== 126 && x !== 131) s.px(x, 17, '#b8a888'); for (let x = 123; x < 135; x++) if (x !== 128) s.px(x, 20, '#d0c4a8');
});

/* ---------------------------------------------------------------- desk things */
/* the desk nameplate: a brass plate with SARAH engraved, in a wooden holder */
hdF2_reg('f_nameplate', 16, 16, 8, 15, s => {
    const WD = hdPal('#2a180c', '#4c3220', '#6b4a2a', '#82603a', '#96744a');
    const hold = s.add(WD, { layer: 1, R: 2, k: 1.3, grad: 0.25 }); hdF2_rr(s, hold, 0, 21, 48, 21, 2);
    hdF2_grain(s, hold, 191, 3, false, 0, 21, 47, 41);
    const plate = s.add(hdPal('#8a6418', '#c89a2c', '#ffcf57', '#ffe08a', '#fff2c4'), { layer: 2, R: 2, k: 1.1, grad: 0.3 }); hdF2_rr(s, plate, 4, 26, 40, 11, 1);
    hdF2_later(s, () => { for (const [x, y] of hdF2_capsPts('SARAH', 15, 29)) { s.px(x, y, '#6b4a2a'); if (s.at(x, y + 1) === plate) s.px(x, y + 1, '#fff2c4'); } for (const [x, y] of hdF2_capsPts('SARAH', 15, 29)) s.px(x, y, '#6b4a2a'); });
    hdF2_glint(s, plate, 5, 27, 38, 9, 0.62, 1);
});

/* the noren: a navy split curtain on a wooden rod, a white crest with a red sun in the middle */
hdF2_reg('f_noren', 32, 16, 16, 15, s => {
    const NV = hdPal('#121a30', '#1e2c4e', '#2c3e66', '#3a4e7a', '#4c6290');
    for (let k = 0; k < 4; k++) {
        const p = s.add(NV, { layer: 1, R: 3, k: 1, grad: 0.2 }), x0 = k * 24 + 2;
        s.rect(p, x0, 5, 21, 38); s.rect(p, x0 + 1, 43, 19, 1);
        /* soft folds hanging down each panel, the hem a little darker */
        hdF2_later(s, () => hdF2_each(s, p, (x, y) => { const f = Math.sin((x - x0) * 0.62 + 0.5); if (f > 0.75) s.mod(x, y, 1); else if (f < -0.8) s.mod(x, y, -1); if (y >= 39) s.mod(x, y, -1); }));
    }
    const rod = s.add(hdPal('#2e1c10', '#4e3422', '#6b4a35', '#82603f', '#9a7650'), { layer: 3, R: 2.5, k: 1.6, grad: 0.3, cast: 2 }); hdF2_rr(s, rod, 0, 0, 96, 6, 3);
    hdF2_grain(s, rod, 201, 2, false, 0, 0, 95, 5);
    for (let k = 0; k < 4; k++) hdF2_drop(s, rod, 2);
    /* the crest across the middle slit, cut by it as the cloth is */
    hdF2_later(s, () => {
        for (let y = 14; y < 33; y++) for (let x = 36; x < 60; x++) {
            const id = s.at(x, y); if (id < 0 || s.parts[id].mat !== NV) continue;
            const d = Math.hypot(x + 0.5 - 48, y + 0.5 - 23.5);
            if (d < 9.5) s.recolor(x, y, d < 4.6 ? hdPal('#7a1424', '#b82838', '#e0405a', '#ec6474', '#f68a96') : hdPal('#a8acb8', '#e4e6ec', '#ffffff', '#ffffff', '#ffffff'));
        }
    });
});

/* the orange vase: a round orange glaze with a pitted peel, a green sprig and a white bud in its neck */
hdF2_reg('f_orange_vase', 16, 16, 8, 15, s => {
    const OR = hdPal('#8a3a08', '#d0701c', '#f7962d', '#ffae50', '#ffc27a');
    const body = s.add(OR, { layer: 1, R: 10, k: 1.3, grad: 0.12 }); s.ellipse(body, 24, 32, 14, 12.5); s.rect(body, 18, 14, 12, 12);
    hdF2_later(s, () => hdF2_each(s, body, (x, y) => { if (hdF2_h(x, y, 211) < 0.06) s.mod(x, y, -1); if (Math.hypot((x - 17) / 2.5, (y - 28) / 3.5) < 1) s.mod(x, y, 1); }));
    const lip = s.add(OR, { layer: 2, R: 2, k: 1.3, grad: 0.3 }); hdF2_rr(s, lip, 17, 13, 14, 4, 2);
    hdF2_over(s, o => {
        const st = o.add(hdPal('#1c4a20', '#2c6a30', '#3f8f45', '#55a85a', '#6cc063'), { layer: 1, R: 1, k: 1.2 }); o.line(st, 25, 14, 31, 3, 1.1); o.line(st, 24, 14, 22, 6, 1);
        const lf = o.add(hdPal('#1c4a20', '#3f8f45', '#6cc063', '#86d27c', '#a4e294'), { layer: 2, R: 2, k: 1.2, grad: 0.3 });
        o.poly(lf, [[31, 4], [36, 0], [40, 2], [36, 6]]); o.poly(lf, [[30, 8], [34, 9], [33, 12], [29, 11]]);
        const bud = o.add(hdPal('#a8a4b0', '#e2e0e8', '#ffffff', '#ffffff', '#ffffff'), { layer: 3, R: 2, k: 1.2, grad: 0.3 }); o.ellipse(bud, 21.5, 6, 3, 3.4);
    });
    s.px(37, 2, '#c8f0b8'); s.px(21, 4, '#ffffff'); s.px(22, 7, '#ffd84a');
});

/* the pile of drafts: loose sheets thrown on top of a neat stack, scribbled on */
hdF2_reg('f_paper_pile', 16, 16, 8, 15, s => {
    const stack = s.add(hdPal('#8a7a68', '#c9b8a8', '#fff7e6', '#fffbf2', '#ffffff'), { layer: 1, R: 2, k: 1, grad: 0.2 }); hdF2_rr(s, stack, 9, 36, 33, 9, 1);
    for (let y = 38; y < 45; y += 2) hdF2_hl(s, stack, 10, 40, y, -2);
    const PP = hdPal('#9a948a', '#d8d2c4', '#fbfaf2', '#ffffff', '#ffffff');
    const sheets = [[[6, 27], [29, 24], [33, 36], [8, 38]], [[12, 14], [34, 12], [38, 25], [14, 27]], [[10, 23], [21, 9], [31, 17], [21, 30]], [[25, 19], [43, 14], [45, 25], [28, 31]]];
    sheets.forEach((pts, k) => {
        const p = s.add(PP, { layer: 2 + k, R: 2, k: 1, grad: 0.15, cast: 2 }); s.poly(p, pts);
        /* lines of scribble along each sheet */
        const [a, b, , d] = pts, ux = (b[0] - a[0]), uy = (b[1] - a[1]), vx = (d[0] - a[0]), vy = (d[1] - a[1]);
        for (let r = 0.25; r < 0.85; r += 0.2) for (let t = 0.12; t < 0.85; t += 0.03) if (hdF2_h(Math.floor(t * 9), Math.floor(r * 10), k) > 0.18) hdF2_m(s, p, a[0] + ux * t + vx * r, a[1] + uy * t + vy * r, -1);
    });
    /* a crossed-out line in red on the top sheet */
    for (let i = 0; i < 9; i++) s.px(30 + i, 22 - Math.round(i * 0.3), '#e0405a');
});

/* the party game console: the dark base with its lit strip, a white cartridge in the top, red and yellow pads */
hdF2_reg('f_party_console', 16, 16, 8, 15, s => {
    const cart = s.add(hdPal('#a8a098', '#e4dcd6', '#fff7f1', '#ffffff', '#ffffff'), { layer: 1, R: 2, k: 1.2, grad: 0.2 }); hdF2_rr(s, cart, 18, 6, 12, 18, 2);
    const lab = s.add(hdRamp('#e0405a'), { layer: 2, R: 1.5, k: 1.2 }); hdF2_rr(s, lab, 21, 12, 5, 5, 1);
    for (let y = 8; y < 11; y++) hdF2_hl(s, cart, 20, 27, y, y === 9 ? -1 : 0);
    const DK = hdPal('#14161e', '#262a38', '#3b3f52', '#4c5068', '#60657e');
    const base = s.add(DK, { layer: 3, R: 4, k: 1.2, grad: 0.2, cast: 2 }); hdF2_rr(s, base, 3, 23, 42, 19, 3);
    const strip = s.add(hdPal('#2a7a90', '#56b8d0', '#7fd3e8', '#a4e2f0', '#d0f2fa'), { layer: 4, R: 1.5, k: 0.8, grad: 0.3, bias: 0.06 }); hdF2_rr(s, strip, 6, 27, 36, 6, 1);
    for (let x = 8; x < 40; x += 4) s.px(x, 29, '#d0f2fa');
    const p1 = s.add(hdRamp('#e0405a'), { layer: 4, R: 2.5, k: 1.3, grad: 0.3 }); hdF2_rr(s, p1, 7, 35, 8, 6, 2);
    const p2 = s.add(hdRamp('#ffd84a'), { layer: 4, R: 2.5, k: 1.3, grad: 0.3 }); hdF2_rr(s, p2, 33, 35, 8, 6, 2);
    s.px(10, 37, '#ffb0b8'); s.px(36, 37, '#fff4c0'); s.px(23, 37, '#7fd3e8'); s.px(24, 37, '#7fd3e8');
});
