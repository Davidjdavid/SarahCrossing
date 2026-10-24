/* ---- 32u_hd_furn1.js ---- */
/* HD furniture, part one: the arcade cabinets and the claw machine, the shop counters, tables, chairs, beds, shelves and
   the rest of the first half of the furniture list, each today's sprite at three times the size (same box and anchor)
   with the wood grain, fabric, glass and metal the extra pixels allow. Wall things are drawn flat, facing us; the rug
   lies flat. The arcade screens stay plain and dark at today's spot, for drawCabinetScreen to play its game on. */

/* ---------------------------------------------------------------- shared helpers */
/* a small seeded hash in [0, 1) for scatter that is the same every time */
const hdF1_h = (x, y, k) => { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul((k | 0) + 7, 1442695041); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const hdF1_mix = (a, b, t) => { a = hdRgb(a); b = hdRgb(b); return a.map((v, i) => Math.round(v + (b[i] - v) * t)); };
/* a palette with small steps for big flat surfaces (tops, fronts, panels): grain and seams read without getting noisy */
function hdF1_soft(hex, out) { const r = hdF1_ramp(hex); return [out ? hdRgb(out) : r[0], hdF1_mix(r[1], r[2], 0.45), hdRgb(hex), hdF1_mix(r[3], r[2], 0.35), r[3]]; }
/* hdRamp, but near-white colors get a quiet grey-brown outline and shadow (not a saturated one) */
function hdF1_ramp(hex) {
    const r = hdRamp(hex), [, , l] = hdHsl(hdRgb(hex));
    return l < 0.84 ? r : [hdF1_mix(hex, '#4a3e48', 0.6), hdF1_mix(hex, '#8a7a80', 0.28), r[2], r[3], r[4]];
}
/* a color turned round the hue wheel by d degrees, greys left alone (the arcade cabinets repainted, as 6z_arcade2.js does) */
function hdF1_hue(hex, d) { if (!d) return hex; const [h, s, l] = hdHsl(hdRgb(hex)); return s < 0.25 ? hex : '#' + hdFromHsl(h + d, s, l).map(v => v.toString(16).padStart(2, '0')).join(''); }

/* texture passes wait until every shape is drawn (hdF1_fin) and touch only pixels still of their part: a mod made early
   would otherwise stick to whatever is drawn over that pixel later */
function hdF1_m(s, id, x, y, d) { (s.f1m || (s.f1m = [])).push(id, Math.round(x), Math.round(y), d); }
function hdF1_rc(s, id, x, y, mat) { (s.f1r || (s.f1r = [])).push([id, Math.round(x), Math.round(y), typeof mat === 'string' ? hdRamp(mat) : mat]); }
function hdF1_later(s, fn) { (s.f1q || (s.f1q = [])).push(fn); }
/* finish: the texture passes, then the late passes (cast shadows), then a firmer edge where the silhouette faces the light */
function hdF1_fin(s, soft) {
    const m = s.f1m || [];
    for (let i = 0; i < m.length; i += 4) if (s.at(m[i + 1], m[i + 2]) === m[i]) s.mod(m[i + 1], m[i + 2], m[i + 3]);
    for (const [id, x, y, mat] of s.f1r || []) if (s.at(x, y) === id) s.recolor(x, y, mat);
    for (const f of s.f1q || []) f();
    if (!soft) for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) if (s.at(x, y) >= 0 && (s.at(x - 1, y) < 0 || s.at(x, y - 1) < 0)) s.mod(x, y, -1);
    s.f1m = s.f1r = s.f1q = null;
}

/* a shadow cast straight down by part id onto lower parts, depth rows under its lower edge */
function hdF1_drop(s, id, depth) { hdF1_later(s, () => {
    const W = s.w, L = s.parts[id].layer, done = new Uint8Array(W * s.h);
    for (let y = 0; y < s.h; y++) for (let x = 0; x < W; x++) {
        if (s.part[y * W + x] !== id || s.at(x, y + 1) === id) continue;
        for (let d = 1; d <= depth; d++) {
            const p = s.at(x, y + d);
            if (p < 0 || p === id) break;
            if (s.parts[p].layer >= L || done[(y + d) * W + x]) continue;
            done[(y + d) * W + x] = 1;
            s.mod(x, y + d, -1);
        }
    }
}); }
/* a part filled with a rectangle (or a rounded one, r) */
function hdF1_box(s, mat, x, y, w, h, o, r) { const id = s.add(mat, o); hdF1_rr(s, id, x, y, w, h, r || 0); return id; }
function hdF1_rr(s, id, x, y, w, h, r) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const cx = i < r ? r - i - 0.5 : i >= w - r ? i - (w - r) + 0.5 : 0, cy = j < r ? r - j - 0.5 : j >= h - r ? j - (h - r) + 0.5 : 0;
        if (cx * cx + cy * cy <= r * r + 0.3) s.plot(id, x + i, y + j);
    }
}
/* a shade line along a row or a column of a part */
function hdF1_hl(s, id, x0, x1, y, d) { for (let x = x0; x <= x1; x++) hdF1_m(s, id, x, y, d); }
function hdF1_vl(s, id, x, y0, y1, d) { for (let y = y0; y <= y1; y++) hdF1_m(s, id, x, y, d); }
/* wood grain over a box of part id: long wavy lines every sp rows (columns when vert), broken here and there */
function hdF1_grain(s, id, x0, y0, w, h, seed, sp, vert) {
    sp = sp || 4;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const u = vert ? j : i, v = vert ? i : j, a = vert ? 0.35 : 1, t = v + a * (1.4 * Math.sin(u * 0.05 + seed) + 0.7 * Math.sin(u * 0.17 + seed * 2.3)), row = Math.floor(t / sp);
        if (t - row * sp >= 1) continue;
        if (hdF1_h(Math.floor((u + row * 7) / (vert ? 22 : 15)), row, seed) < (vert ? 0.55 : 0.42)) continue;
        hdF1_m(s, id, x0 + i, y0 + j, -1);
    }
}
/* raised panels between seams every step columns from x0: a dark seam, a lit edge right of it, a soft shade on the far
   side, lit along the top and shaded along the bottom */
function hdF1_panels(s, id, x0, y0, x1, y1, step, seed) {
    for (let x = x0; x <= x1; x++) {
        const r = ((x - x0) % step + step) % step, k = Math.floor((x - x0) / step);
        const d = r === 0 ? -2 : r === 1 || r === 2 ? 1 : r === step - 1 ? -1 : 0;
        if (d) for (let y = y0; y <= y1; y++) hdF1_m(s, id, x, y, d);
        if (r === 0) for (let i = 1; i < step - 1; i++) { hdF1_m(s, id, x + i, y0, 1); hdF1_m(s, id, x + i, y1, -1); }
    }
}
/* specks of a lighter (d > 0) or darker shade: stone, hay, felt */
function hdF1_speck(s, id, x0, y0, w, h, seed, p, d) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (hdF1_h(x0 + i, y0 + j, seed) < p) hdF1_m(s, id, x0 + i, y0 + j, d); }
/* the glint on glass: a broad and a thin diagonal streak over the upper left */
function hdF1_glint(s, id, x0, y0, w, h, at, d) {
    at = at == null ? 0.3 : at;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = i + j * 0.8 - w * at; if ((q >= 0 && q < 2.2) || (q >= 4 && q < 5)) hdF1_m(s, id, x0 + i, y0 + j, d || 1); }
}
/* exact pixels (lettering, tiny details): a list of [x, y] in one color */
function hdF1_dots(s, pts, col) { for (const [x, y] of pts) s.px(x, y, col); }
/* lines of writing on paper: broken dashes */
function hdF1_write(s, x, y, w, n, gap, col, seed) {
    for (let k = 0; k < n; k++) {
        const ww = k === n - 1 ? Math.round(w * 0.6) : w - Math.floor(hdF1_h(k, 3, seed) * 3);
        for (let i = 0; i < ww; i++) if (hdF1_h(x + i, k, seed) > 0.12) s.px(x + i, y + k * gap, col);
    }
}

/* shared colors */
const HDF1_DARK = hdPal('#100e16', '#16141e', '#1c1a24', '#2a2734', '#3a3646');         /* screen bezels, slots */
const HDF1_SCREEN = hdPal('#14111e', '#1b1729', '#221d33', '#28233b', '#2e2943');       /* a screen switched off */
const HDF1_STEEL = hdPal('#4e5868', '#7c889a', '#a2adbd', '#c6cfdb', '#eef3f8');
const HDF1_GOLD = hdPal('#6a4a14', '#b08428', '#d9b44a', '#ecd078', '#fbeeb0');
const HDF1_GLASS = hdPal('#7aa8c0', '#b4dcec', '#dff2fa', '#eef9fd', '#ffffff');

/* ---------------------------------------------------------------- arcade cabinets */
/* a cabinet: a marquee with a lit panel, the screen in its bezel (plain and dark: the game is drawn over it), the control
   deck with a joystick and two buttons, the coin door and a dark kick plate. c maps each color (the repainted ones) */
function hdF1_cab(s, k) {
    const c = hex => hdF1_hue(hex, k.hue || 0);
    const sd = hdF1_box(s, hdF1_soft(c(k.side)), 41, 7, 7, 80, { layer: 1, R: 1, grad: 0.05 });
    const fr = hdF1_box(s, hdF1_soft(c(k.body)), 0, 14, 42, 73, { layer: 2, R: 2, grad: 0.14 });
    const mq = s.add(hdF1_soft(c(k.marq)), { layer: 4, R: 2, grad: 0.2, cast: 2 });
    s.rect(mq, 0, 0, 48, 8); s.rect(mq, 0, 8, 42, 7);
    const bm = hdF1_soft(c(k.band)), band = hdF1_box(s, [bm[0], bm[1], bm[2], bm[3], hdF1_mix(bm[4], '#ffffff', 0.5)], 5, 3, 33, 5, { layer: 5, flat: 1, grad: 0.3 });
    hdF1_hl(s, band, 6, 36, 4, 1);
    /* the top of the cabinet, seen a little from above */
    hdF1_hl(s, mq, 1, 46, 1, 1);
    /* the screen sunk in its bezel */
    const bz = hdF1_box(s, HDF1_DARK, 9, 18, 30, 27, { layer: 4, R: 2, grad: 0.2 }, 2);
    const sc = hdF1_box(s, HDF1_SCREEN, 12, 21, 24, 21, { layer: 3, flat: 1, grad: 0.1 });
    /* the control deck sticking out, its top catching the light */
    const dk = hdF1_box(s, c(k.deck), 0, 50, 42, 10, { layer: 5, R: 1.5, grad: 0.2, cast: 2 });
    const dt = hdF1_box(s, c(k.deckTop), 0, 47, 42, 4, { layer: 6, R: 1, grad: 0.3, bias: 0.05 });
    const js = s.add(hdRamp(c(k.stick)), { layer: 8, R: 1.5, grad: 0.2 }), jb = s.add(hdRamp(c(k.ball)), { layer: 9, R: 3.5, grad: 0.2, bias: 0.05 });
    s.rect(js, 12, 47, 3, 5); s.ellipse(jb, 13.5, 45.5, 3.6, 3.4);
    for (const [bx, col] of [[28.5, k.b1], [34.5, k.b2]]) { const b = s.add(hdRamp(c(col)), { layer: 7, R: 2, grad: 0.3, bias: 0.06 }); s.ellipse(b, bx, 55, 2.4, 2.1); }
    /* the coin door: a recessed panel, two lit coin slots */
    const dr = hdF1_box(s, hdF1_soft(c(k.door)), 9, 66, 30, 15, { layer: 1.5, R: 1, grad: 0.1 });
    const sl = hdF1_box(s, HDF1_DARK, 18, 69, 12, 6, { layer: 3, R: 1, grad: 0 });
    for (const x of [20, 26]) for (let y = 70; y < 74; y++) s.px(x, y, y === 70 ? '#ffd27a' : '#e8803a');
    /* the kick plate */
    hdF1_box(s, hdPal('#16121c', '#211b29', '#2d2230', '#3a2e3e', '#463a4c'), 2, 85, 44, 5, { layer: 3, R: 1, grad: 0.1 });
    hdF1_vl(s, fr, 1, 15, 84, 1);
    hdF1_drop(s, dk, 3);
    hdF1_drop(s, mq, 2);
    hdF1_fin(s);
}
const HDF1_CABS = {
    fruit: { body: '#8cc152', side: '#709547', marq: '#ff9ec0', band: '#ffc0d6', deckTop: '#a3cd75', deck: '#7ba64b', door: '#81af4e', ball: '#ff7a8a', stick: '#e0405a', b1: '#ffd84a', b2: '#4ec3d9' },
    blocks: { body: '#4a74c9', side: '#3e5ba0', marq: '#ffd45a', band: '#ffe394', deckTop: '#6e90d4', deck: '#4365b1', door: '#456ab9', ball: '#ff7a8a', stick: '#e0405a', b1: '#ffd84a', b2: '#4ec3d9' },
    capsules: { body: '#e0405a', side: '#ae344d', marq: '#8cc152', band: '#b4d78f', deckTop: '#e6667b', deck: '#c23952', door: '#cc3b55', ball: '#ff7a8a', stick: '#e0405a', b1: '#ffd84a', b2: '#4ec3d9' },
    stack: { body: '#6b3fa0', side: '#573382', marq: '#ff9ec0', band: '#ffc0d6', deckTop: '#8965b3', deck: '#5f388e', door: '#633a94', ball: '#ff7a8a', stick: '#e0405a', b1: '#ffd84a', b2: '#4ec3d9' },
};
for (const id in HDF1_CABS) HD_SPR['f_cab_' + id] = { w: 48, h: 90, ax: 24, ay: 87, draw(s) { hdF1_cab(s, HDF1_CABS[id]); } };
/* the cabinets made in code from Fruit Catch's, turned round the hue wheel (CAB_HUE in 6z_arcade2.js, BACK_HUE in 6z_backroom.js) */
for (const [id, hue] of [['surf', 200], ['garden', 95], ['noodle', 45], ['dumpling', 320], ['sushi', 150], ['fortune', 25]])
    HD_SPR['f_cab_' + id] = { w: 48, h: 90, ax: 24, ay: 87, draw(s) { hdF1_cab(s, Object.assign({}, HDF1_CABS.fruit, { hue })); } };

/* the claw machine: a pink marquee, a lilac frame round the glass case (the claw on its rail, five plushies on the
   prize shelf), the control panel, the prize chute and a lower panel */
HD_SPR.f_claw_machine = {
    w: 96, h: 126, ax: 48, ay: 123,
    draw(s) {
        const fr = hdF1_box(s, hdF1_soft('#b37cf0'), 0, 12, 96, 108, { layer: 1, R: 2, grad: 0.12 });
        const mq = s.add(hdF1_soft('#ff5aa8'), { layer: 4, R: 2, grad: 0.2, cast: 2 });
        s.rect(mq, 0, 0, 96, 12);
        hdF1_box(s, hdRamp('#ffb3d9'), 6, 3, 84, 4, { layer: 5, flat: 1, grad: 0.4, bias: 0.04 });
        hdF1_hl(s, mq, 1, 94, 1, 1);
        /* the glass case: sky-pale glass, the claw on its rail behind it */
        const gl = hdF1_box(s, HDF1_GLASS, 9, 15, 78, 60, { layer: 2, flat: 1, grad: 0.3 });
        const rim = hdF1_box(s, hdPal('#a8b4c0', '#d8e0e8', '#ffffff', '#ffffff', '#ffffff'), 9, 15, 78, 3, { layer: 2.5, flat: 1, grad: 0 });
        const rail = hdF1_box(s, HDF1_STEEL, 47, 18, 4, 16, { layer: 3, R: 1, grad: 0 });
        const cl = s.add(HDF1_STEEL, { layer: 3.5, R: 1.5, grad: 0.2 });
        s.rect(cl, 39, 33, 21, 5); s.rect(cl, 39, 37, 3, 5); s.rect(cl, 57, 37, 3, 5); s.rect(cl, 40, 41, 2, 2); s.rect(cl, 57, 41, 2, 2);
        /* the plushies, each a little round neighbor-ish face with ears */
        const pl = [['#34473e', 12], ['#f8e8b8', 27], ['#e2382b', 42], ['#6e3f25', 57], ['#fff4dc', 70]];
        for (const [col, x] of pl) {
            const w = x === 57 ? 12 : 15, cx = x + w / 2, b = s.add(col, { layer: 4, R: 4, grad: 0.25 });
            s.ellipse(b, cx, 64, w / 2, 7.5);
            s.ellipse(b, cx - w / 2 + 2.5, 58, 2, 2); s.ellipse(b, cx + w / 2 - 2.5, 58, 2, 2);
            const ec = col === '#34473e' || col === '#6e3f25' ? '#ffffff' : '#2d2230';
            s.px(cx - 3, 63, ec); s.px(cx - 3, 64, ec); s.px(cx + 2, 63, ec); s.px(cx + 2, 64, ec);
            s.px(cx - 1, 66, ec === '#ffffff' ? '#e8a0a8' : '#c0606a');
        }
        hdF1_glint(s, gl, 9, 18, 78, 57, 0.18, 1);
        /* the control panel with a joystick and a button */
        const cp = hdF1_box(s, hdF1_soft('#8a5ad0'), 6, 77, 81, 17, { layer: 3, R: 1.5, grad: 0.2, cast: 2 });
        hdF1_hl(s, cp, 7, 85, 78, 1);
        const js = s.add('#e0405a', { layer: 5, R: 1, grad: 0.1 }), jb = s.add('#ff7a8a', { layer: 6, R: 3, grad: 0.3, bias: 0.06 });
        s.rect(js, 15, 80, 3, 7); s.ellipse(jb, 16.5, 80, 3.3, 3);
        const bt = s.add('#ffd84a', { layer: 5, R: 2, grad: 0.3, bias: 0.05 }); s.ellipse(bt, 34.5, 85, 2.6, 2.2);
        /* the lower panel and the prize chute */
        hdF1_box(s, hdF1_soft('#8a5ad0'), 9, 96, 30, 18, { layer: 0.5, R: 1, grad: 0.1 });
        const ch = hdF1_box(s, hdPal('#0e0a1c', '#160f2c', '#241a44', '#30245a', '#3c2e6c'), 66, 93, 15, 18, { layer: 0.5, R: 1, grad: 0.4 });
        const fl = hdF1_box(s, hdPal('#5a3a8a', '#8a5ad0', '#a070e0', '#b48af0', '#c8a8f8'), 65, 109, 17, 3, { layer: 2, R: 1, grad: 0 });
        hdF1_box(s, hdPal('#16121c', '#211b29', '#2d2230', '#3a2e3e', '#463a4c'), 3, 120, 90, 6, { layer: 2, R: 1, grad: 0.1 });
        hdF1_vl(s, fr, 1, 13, 118, 1);
        hdF1_drop(s, mq, 2);
        hdF1_drop(s, cp, 2);
        hdF1_fin(s);
    },
};

/* ---------------------------------------------------------------- counters */
/* the top of a counter seen a little from above (its far edge catching the light) over the front edge of the slab,
   which shades the front below it. returns [top, edge] */
function hdF1_top(s, mat, edge, x, y, w, h, eh, o) {
    o = o || {};
    const t = hdF1_box(s, hdF1_soft(mat), x, y, w, h, { layer: 4, R: 2, grad: 0.22, bias: 0.02 }, o.r || 0);
    hdF1_hl(s, t, x + 1, x + w - 2, y + 1, 1); hdF1_hl(s, t, x + 1, x + w - 2, y + 2, 1);
    const e = eh ? hdF1_box(s, hdF1_soft(edge), x, y + h, w, eh, { layer: 5, R: 1, grad: 0.1, cast: 2 }) : -1;
    return [t, e];
}
HD_SPR.f_counter_shop = {
    w: 144, h: 84, ax: 72, ay: 81,
    draw(s) {
        const fr = hdF1_box(s, hdF1_soft('#c98a55'), 0, 46, 144, 38, { layer: 2, R: 2, grad: 0.1 });
        const [t, e] = hdF1_top(s, '#ecd2a4', '#b87e50', 0, 21, 144, 24, 3);
        const bd = hdF1_box(s, hdPal('#7a4a14', '#c88a2a', '#e9a93b', '#f4c25a', '#fbd98a'), 0, 51, 144, 6, { layer: 3, R: 1.5, grad: 0.3, cast: 2 });
        hdF1_grain(s, t, 0, 25, 144, 19, 3, 4);
        hdF1_panels(s, fr, -6, 60, 142, 81, 24, 5);
        hdF1_hl(s, fr, 1, 142, 81, 1);
        hdF1_drop(s, bd, 2); hdF1_drop(s, e, 2);
        hdF1_fin(s);
    },
};
HD_SPR.f_counter_diner = {
    w: 144, h: 84, ax: 72, ay: 81,
    draw(s) {
        const fr = hdF1_box(s, hdF1_soft('#8fd4c4'), 0, 42, 144, 30, { layer: 2, R: 2, grad: 0.1 });
        const tr = hdF1_box(s, hdF1_soft('#6fb8a8'), 0, 42, 144, 3, { layer: 2.5, R: 1, grad: 0 });
        const [t, e] = hdF1_top(s, '#e8eef6', '#b8c4d0', 0, 21, 144, 18, 3);
        hdF1_speck(s, t, 2, 25, 140, 12, 11, 0.018, -1);
        hdF1_glint(s, e, 0, 39, 144, 3, 0.2, 2);
        /* the fluted front: a lit rib every six columns */
        for (let x = 0; x < 144; x++) { const r = x % 18; if (r === 12 || r === 13) hdF1_vl(s, fr, x, 46, 70, 1); else if (r === 14) hdF1_vl(s, fr, x, 46, 70, -1); }
        const kp = hdF1_box(s, HDF1_STEEL, 0, 72, 144, 9, { layer: 3, R: 1, grad: 0.25 }, 2);
        hdF1_hl(s, kp, 2, 141, 74, 1); hdF1_hl(s, kp, 2, 141, 77, -1);
        hdF1_drop(s, e, 3);
        hdF1_fin(s);
    },
};
HD_SPR.f_counter_boutique = {
    w: 144, h: 84, ax: 72, ay: 81,
    draw(s) {
        const fr = hdF1_box(s, hdF1_soft('#f7962d'), 0, 48, 144, 36, { layer: 2, R: 2, grad: 0.1 });
        const [t, e] = hdF1_top(s, '#fffaf4', '#ffd35a', 0, 21, 144, 24, 3);
        /* faint veins in the white marble */
        for (let i = 0; i < 4; i++) { let x = 10 + i * 36 + hdF1_h(i, 1, 4) * 12, y = 26 + hdF1_h(i, 2, 4) * 5; for (let k = 0; k < 26; k++) { if (k % 9 < 6) hdF1_m(s, t, x, y, -1); x += 1; y += hdF1_h(i, k, 5) < 0.35 ? 1 : hdF1_h(i, k, 6) < 0.2 ? -1 : 0; if (y > 41) break; } }
        hdF1_glint(s, e, 0, 45, 144, 3, 0.15, 2);
        for (let x = 0; x < 144; x++) { const r = x % 18; if (r === 12 || r === 13) hdF1_vl(s, fr, x, 50, 81, 1); else if (r === 14) hdF1_vl(s, fr, x, 50, 81, -1); }
        hdF1_hl(s, fr, 1, 142, 81, -1);
        hdF1_drop(s, e, 3);
        hdF1_fin(s);
    },
};
HD_SPR.f_counter_prize = {
    w: 144, h: 84, ax: 72, ay: 81,
    draw(s) {
        const fr = hdF1_box(s, hdF1_soft('#6b4ac9'), 0, 45, 144, 39, { layer: 2, R: 2, grad: 0.12 });
        const [t] = hdF1_top(s, '#ffd84a', null, 0, 21, 144, 24, 0);
        hdF1_hl(s, t, 1, 142, 43, -1);
        /* six lit panels, a bulb at each corner */
        for (let i = 0; i < 6; i++) {
            const x = 12 + i * 21, p = hdF1_box(s, hdF1_soft('#8a6ae0'), x, 54, 12, 18, { layer: 3, R: 1.5, grad: 0.25 });
            const b = s.add(hdPal('#a8781e', '#e8b830', '#ffd84a', '#ffec90', '#ffffff'), { layer: 4, R: 1.5, grad: 0.3 });
            s.ellipse(b, x + 4.5, 58.5, 2, 2);
            hdF1_m(s, p, x + 6, 66, 1);
        }
        hdF1_drop(s, t, 3);
        hdF1_fin(s);
    },
};
HD_SPR.f_disp_counter = {
    w: 144, h: 84, ax: 72, ay: 81,
    draw(s) {
        const fr = hdF1_box(s, hdF1_soft('#b98552'), 0, 39, 144, 33, { layer: 2, R: 2, grad: 0.1 });
        const t = hdF1_box(s, hdF1_soft('#8a5a33'), 0, 24, 144, 15, { layer: 4, R: 2, grad: 0.2, cast: 2 });
        const lip = hdF1_box(s, hdF1_soft('#a8733f'), 0, 24, 144, 4, { layer: 4.5, R: 1, grad: 0.2 });
        hdF1_grain(s, t, 0, 28, 144, 10, 8, 4);
        hdF1_panels(s, fr, -6, 41, 142, 71, 24, 9);
        hdF1_box(s, hdF1_soft('#6b4a2a'), 0, 72, 144, 9, { layer: 3, R: 1, grad: 0.15 });
        hdF1_drop(s, t, 2);
        hdF1_fin(s);
    },
};
HD_SPR.f_display_shelf = {
    w: 144, h: 84, ax: 72, ay: 81,
    draw(s) {
        const fr = hdF1_box(s, hdF1_soft('#d9b98c'), 0, 36, 144, 39, { layer: 2, R: 2, grad: 0.1 });
        const t = hdF1_box(s, hdF1_soft('#f2d8b0'), 0, 24, 144, 12, { layer: 4, R: 2, grad: 0.22, cast: 2 });
        const pn = hdF1_box(s, hdF1_soft('#c9a47a'), 9, 42, 126, 30, { layer: 1, R: 2, grad: 0.15 });
        hdF1_grain(s, t, 0, 26, 144, 9, 12, 4);
        hdF1_grain(s, pn, 9, 43, 126, 28, 13, 5);
        hdF1_box(s, hdF1_soft('#9a6b45'), 0, 75, 144, 9, { layer: 3, R: 1, grad: 0.15 });
        hdF1_drop(s, t, 2);
        hdF1_fin(s);
    },
};

/* ---------------------------------------------------------------- chairs and stools */
/* four legs, or two seen from the front: round wooden posts */
function hdF1_legs(s, mat, xs, y, w, h, layer) { const id = s.add(mat, { layer: layer || 1, R: 2, grad: 0.15 }); for (const x of xs) s.rect(id, x, y, w, h); return id; }
HD_SPR.f_chair_wood = {
    w: 48, h: 84, ax: 24, ay: 81,
    draw(s) {
        const lg = hdF1_legs(s, '#8a5a33', [8, 32], 48, 8, 33);
        const bk = hdF1_box(s, hdF1_soft('#b98552'), 6, 0, 36, 37, { layer: 2, R: 2, grad: 0.15 }, 2);
        const rl = hdF1_box(s, hdRamp('#d9a46a'), 9, 5, 30, 6, { layer: 3, R: 2, grad: 0.2, cast: 2 }, 1);
        hdF1_grain(s, bk, 7, 12, 34, 24, 2, 7, true);
        const st = hdF1_box(s, hdF1_soft('#d9a46a'), 3, 36, 42, 9, { layer: 4, R: 2, grad: 0.2 }, 1);
        const se = hdF1_box(s, hdF1_soft('#c98a55'), 3, 44, 42, 7, { layer: 5, R: 1.5, grad: 0.1, cast: 2 }, 1);
        hdF1_grain(s, st, 4, 38, 40, 6, 3, 3);
        hdF1_drop(s, se, 3); hdF1_drop(s, rl, 2);
        hdF1_fin(s);
    },
};
HD_SPR.f_dining_chair = {
    w: 48, h: 84, ax: 24, ay: 81,
    draw(s) {
        const lg = hdF1_legs(s, '#7a4a2a', [8, 32], 48, 8, 33);
        const fr = hdF1_box(s, hdRamp('#7a4a2a'), 6, 3, 36, 36, { layer: 2, R: 2, grad: 0.15 }, 4);
        const cu = hdF1_box(s, hdRamp('#d24434'), 11, 8, 26, 28, { layer: 3, R: 6, grad: 0.3, k: 1.4 }, 4);
        const st = hdF1_box(s, hdRamp('#e05a4a'), 3, 39, 42, 13, { layer: 5, R: 5, grad: 0.4, cast: 2, k: 1.3 }, 4);
        hdF1_drop(s, st, 3);
        hdF1_fin(s);
    },
};
HD_SPR.f_crimson_chair = {
    w: 48, h: 84, ax: 24, ay: 81,
    draw(s) {
        const lg = hdF1_legs(s, '#4a3238', [5, 35], 64, 8, 17);
        const bk = s.add('#b3263a', { layer: 2, R: 8, grad: 0.3, k: 1.3 });
        hdF1_rr(s, bk, 0, 3, 48, 62, 11);
        /* the seat cushion: its front edge lit, the front in the shade */
        const sf = hdF1_box(s, hdF1_soft('#8a1b2d'), 3, 38, 42, 28, { layer: 3, R: 1.5, grad: 0.15 }, 2);
        const sc = hdF1_box(s, hdRamp('#c43a4e'), 6, 34, 36, 7, { layer: 4, R: 3, grad: 0.3, cast: 2 }, 3);
        /* the arms, rolled at the top */
        for (const x of [0, 39]) { const a = hdF1_box(s, hdRamp('#a02234'), x, 27, 9, 36, { layer: 5, R: 4, grad: 0.3, k: 1.3 }, 4); hdF1_vl(s, a, x + 4, 33, 58, -1); }
        hdF1_drop(s, sc, 2);
        hdF1_fin(s);
    },
};
HD_SPR.f_arcade_stool = {
    w: 48, h: 84, ax: 24, ay: 81,
    draw(s) {
        const ps = hdF1_box(s, HDF1_STEEL, 19, 46, 6, 28, { layer: 1, R: 2, grad: 0 });
        const ft = s.add(hdPal('#3a3e4c', '#555c6c', '#6b7385', '#8a92a2', '#b0b8c4'), { layer: 2, R: 3, grad: 0.3 });
        s.ellipse(ft, 24, 77, 12.5, 4.5); s.rect(ft, 15, 72, 18, 3);
        const ring = hdF1_box(s, HDF1_STEEL, 15, 61, 18, 2, { layer: 1.5, R: 1, grad: 0 });
        const sd = s.add('#ff5aa8', { layer: 3, R: 3, grad: 0.2 });
        s.ellipse(sd, 24, 42, 19.5, 6.5); s.rect(sd, 5, 37, 39, 5);
        const tp = s.add('#ff8ac0', { layer: 4, R: 5, grad: 0.35, bias: 0.03 });
        s.ellipse(tp, 24, 37, 19.5, 5.5);
        hdF1_vl(s, ps, 20, 47, 72, 2);
        hdF1_drop(s, sd, 2);
        hdF1_fin(s);
    },
};

/* ---------------------------------------------------------------- tables */
HD_SPR.f_cafe_table = {
    w: 48, h: 84, ax: 24, ay: 81,
    draw(s) {
        const ps = hdF1_box(s, hdPal('#16181f', '#262935', '#3b3f52', '#545a70', '#70778e'), 19, 37, 7, 37, { layer: 1, R: 2.5, grad: 0 });
        const ft = s.add(hdPal('#16181f', '#262935', '#3b3f52', '#545a70', '#70778e'), { layer: 2, R: 3, grad: 0.3 });
        s.ellipse(ft, 24, 77, 12.5, 4.5); s.rect(ft, 15, 72, 18, 4);
        const ed = s.add(hdPal('#8a7c74', '#c8bfb8', '#e6dfd8', '#f6f2ee', '#ffffff'), { layer: 3, R: 1.5, grad: 0.1 });
        s.ellipse(ed, 24, 30.5, 24, 8);
        const tp = s.add(hdPal('#a89a90', '#ece4dc', '#fff7f1', '#ffffff', '#ffffff'), { layer: 4, R: 2.5, grad: 0.3 });
        s.ellipse(tp, 24, 27.5, 23.5, 7.5);
        hdF1_later(s, () => s.each(tp, (x, y) => { const u = (x + 0.5 - 24) / 23.5, v = (y + 0.5 - 27.5) / 7.5; if (u * u + v * v > 0.72 && v < 0 && u < 0.3) s.mod(x, y, 1); }));
        hdF1_vl(s, ps, 20, 40, 72, 1);
        hdF1_drop(s, ed, 3);
        hdF1_fin(s);
    },
};
HD_SPR.f_dining_table = {
    w: 96, h: 84, ax: 48, ay: 81,
    draw(s) {
        const lg = hdF1_legs(s, '#6b4225', [8, 80], 62, 8, 19);
        const tp = hdF1_box(s, hdPal('#a09888', '#e6e0d4', '#fbf8f2', '#ffffff', '#ffffff'), 0, 21, 96, 25, { layer: 3, R: 3, grad: 0.25 }, 1);
        /* the gingham cloth hanging over the edge: red where both stripes cross, pink where one does */
        const cl = s.add(hdPal('#9a8a84', '#e2dad4', '#fbf8f2', '#ffffff', '#ffffff'), { layer: 4, R: 1.5, grad: 0.15, cast: 1 });
        s.rect(cl, 0, 45, 96, 15);
        const red = hdRamp('#e0405a');
        hdF1_later(s, () => s.each(cl, (x, y) => { if ((Math.floor((x + 3) / 9) + Math.floor((y - 45) / 5)) % 2 === 0) s.recolor(x, y, red); }));
        const hem = s.add('#b8283a', { layer: 5, R: 1, grad: 0 });
        s.rect(hem, 0, 59, 96, 4);
        hdF1_hl(s, tp, 1, 94, 23, 1);
        hdF1_fin(s);
    },
};
HD_SPR.f_acc_table = {
    w: 96, h: 84, ax: 48, ay: 81,
    draw(s) {
        const lg = s.add(HDF1_GOLD, { layer: 1, R: 1.5, grad: 0.1 });
        s.rect(lg, 8, 45, 8, 29); s.rect(lg, 80, 45, 8, 29);
        const sh = hdF1_box(s, HDF1_GOLD, 0, 72, 96, 9, { layer: 2, R: 2, grad: 0.3 }, 1);
        hdF1_hl(s, sh, 2, 93, 74, 1);
        const gl = hdF1_box(s, HDF1_GLASS, 0, 28, 96, 17, { layer: 3, flat: 1, grad: 0.35 }, 1);
        const ed = hdF1_box(s, hdPal('#5a8aa0', '#8ab8d0', '#b8d8e8', '#d0e8f4', '#eef8fc'), 0, 42, 96, 3, { layer: 4, flat: 1, grad: 0 }, 1);
        hdF1_hl(s, gl, 1, 94, 30, 2);
        for (let i = 10; i < 22; i++) hdF1_m(s, gl, i, 33, 2);
        hdF1_glint(s, gl, 2, 31, 92, 11, 0.55, 1);
        hdF1_fin(s);
    },
};
HD_SPR.f_driftwood_table = {
    w: 96, h: 84, ax: 48, ay: 81,
    draw(s) {
        const wood = hdPal('#5e4a36', '#a8865c', '#c7a57c', '#d8bc94', '#e8d4b0');
        const lg = s.add(wood, { layer: 1, R: 3, grad: 0.1 });
        s.poly(lg, [[9, 50], [21, 50], [19, 81], [10, 81]]); s.poly(lg, [[75, 50], [87, 50], [86, 81], [77, 81]]);
        const tp = s.add(wood, { layer: 3, R: 6, grad: 0.35, k: 1.1 });
        hdF1_rr(s, tp, 0, 21, 96, 33, 7);
        /* the long, worn grain of wood the sea has had */
        hdF1_grain(s, tp, 2, 23, 92, 29, 21, 4);
        hdF1_hl(s, tp, 15, 62, 43, -1); hdF1_hl(s, tp, 16, 60, 44, -1); hdF1_hl(s, tp, 17, 58, 45, 1);
        for (let i = 0; i < 4; i++) { const x = 24 + i * 19 + hdF1_h(i, 2, 9) * 6, y = 28 + hdF1_h(i, 3, 9) * 16; hdF1_m(s, tp, x, y, -1); hdF1_m(s, tp, x + 1, y, -1); hdF1_m(s, tp, x, y - 1, 1); }
        hdF1_grain(s, lg, 9, 52, 78, 28, 22, 3, true);
        hdF1_fin(s);
    },
};

/* ---------------------------------------------------------------- beds */
/* a bed seen from the foot, a little from above: the headboard, two plump pillows on the sheet, the turned-down top of
   the blanket, the blanket over the mattress and its front hanging down to the floor. o: colors, stars, quilt */
function hdF1_bed(s, o) {
    const hb = hdF1_box(s, hdF1_soft(o.head), 0, 0, 96, 30, { layer: 1, R: 2, grad: 0.2 }, 1);
    const rl = hdF1_box(s, hdRamp(o.rail), 0, 0, 96, 6, { layer: 2, R: 2, grad: 0.3, cast: 2 }, 1);
    if (o.grain) hdF1_grain(s, hb, 2, 7, 92, 20, 31, 5);
    else hdF1_hl(s, hb, 2, 93, 7, 1);
    const sh = hdF1_box(s, hdF1_soft(o.sheet), 0, 27, 96, 30, { layer: 3, R: 2, grad: 0.15 });
    for (const x of [10, 49]) {
        const pm = hdF1_soft(o.pillow), p = s.add([pm[0], hdF1_mix(pm[1], pm[2], 0.4), pm[2], [255, 255, 255], [255, 255, 255]], { layer: 4, R: 5, grad: 0.2, cast: 2, k: 1 });
        hdF1_rr(s, p, x + 1, 27, 35, 21, 5);
        hdF1_m(s, p, x + 18, 33, -1); hdF1_m(s, p, x + 18, 34, -1); hdF1_m(s, p, x + 17, 40, -1);
    }
    const bl = hdF1_box(s, hdF1_soft(o.blanket), 0, 55, 96, 42, { layer: 5, R: 3, grad: 0.15 });
    const fold = hdF1_box(s, hdRamp(o.fold), 0, 53, 96, 6, { layer: 6, R: 2.5, grad: 0.3, cast: 2 });
    const fr = hdF1_box(s, hdF1_soft(o.front), 0, 96, 96, 36, { layer: 4.5, R: 2, grad: 0.12 });
    /* soft wrinkles where the blanket bends over the edge, and a couple across the top */
    for (let x = 1; x < 95; x++) hdF1_m(s, bl, x, 94, -1);
    for (const x of [30, 66]) for (let y = 104; y < 129; y++) { hdF1_m(s, fr, x, y, -1); hdF1_m(s, fr, x - 1, y, 1); }
    hdF1_hl(s, fr, 1, 94, 98, 1);
    /* the weighted blanket's pockets: dashed stitching in a grid */
    if (o.quilt) for (let y = 61; y < 95; y++) for (let x = 2; x < 95; x++) if ((((y - 61) % 11 === 0) && x % 3 !== 2) || ((x % 16 === 8) && y % 3 !== 2)) hdF1_m(s, bl, x, y, -1);
    if (o.stars) for (const [x, y, k] of o.stars) {
        s.px(x, y, o.star); if (k) { s.px(x - 1, y, o.star); s.px(x + 1, y, o.star); s.px(x, y - 1, o.star); s.px(x, y + 1, o.star); s.px(x - 1, y - 1, o.dim); s.px(x + 1, y + 1, o.dim); s.px(x + 1, y - 1, o.dim); s.px(x - 1, y + 1, o.dim); }
    }
    hdF1_drop(s, fold, 3); hdF1_drop(s, rl, 2); hdF1_drop(s, bl, 2);
    hdF1_fin(s);
}
HD_SPR.f_bed_simple = { w: 96, h: 132, ax: 48, ay: 129, draw(s) { hdF1_bed(s, { head: '#b98552', rail: '#d9a46a', grain: 1, sheet: '#fff7f1', pillow: '#fbf6f0', blanket: '#f2896b', fold: '#ffb3a0', front: '#d9674a' }); } };
HD_SPR.f_cloud_bed = {
    w: 96, h: 132, ax: 48, ay: 129,
    draw(s) {
        hdF1_bed(s, { head: '#8a96d8', rail: '#aab4ec', sheet: '#dfe6ff', pillow: '#f4f6ff', blanket: '#3e3a62', fold: '#5a5690', front: '#2e2a4a', quilt: 1, star: '#fff6b0', dim: '#8a86a8',
            stars: [[16, 64, 1], [61, 67, 0], [37, 76, 1], [79, 82, 1], [28, 88, 0], [86, 63, 0], [50, 91, 1], [8, 80, 0], [69, 72, 0], [20, 112, 0], [58, 118, 1], [84, 106, 0], [40, 104, 0]] });
    },
};

/* ---------------------------------------------------------------- dresser, rack and shelves */
HD_SPR.f_dresser = {
    w: 96, h: 84, ax: 48, ay: 81,
    draw(s) {
        const bd = hdF1_box(s, hdF1_soft('#b98552'), 0, 30, 96, 51, { layer: 2, R: 2, grad: 0.1 });
        const tp = hdF1_box(s, hdF1_soft('#d9a46a'), 0, 15, 96, 15, { layer: 4, R: 2, grad: 0.25, cast: 2 });
        hdF1_hl(s, tp, 1, 94, 17, 1);
        hdF1_grain(s, tp, 1, 19, 94, 9, 41, 4);
        hdF1_box(s, hdF1_soft('#a9794e'), 3, 30, 90, 3, { layer: 3, flat: 1, grad: 0 });
        for (const y of [33, 51]) {
            const d = hdF1_box(s, hdF1_soft('#c98a55'), 8, y, 80, 15, { layer: 3, R: 2, grad: 0.25, cast: 1 });
            hdF1_grain(s, d, 9, y + 2, 78, 11, 42 + y, 5);
            const k = s.add(HDF1_GOLD, { layer: 5, R: 2, grad: 0.3, bias: 0.05 });
            s.ellipse(k, 48, y + 7.5, 3, 2.6);
            hdF1_drop(s, d, 1);
        }
        hdF1_hl(s, bd, 1, 94, 79, -1);
        hdF1_drop(s, tp, 2);
        hdF1_fin(s);
    },
};
HD_SPR.f_clothes_rack = {
    w: 96, h: 84, ax: 48, ay: 81,
    draw(s) {
        const fr = s.add(HDF1_STEEL, { layer: 1, R: 2, grad: 0.1 });
        s.rect(fr, 6, 9, 84, 6); s.rect(fr, 6, 9, 6, 66); s.rect(fr, 84, 9, 6, 66);
        const ft = s.add(hdPal('#3a3e4c', '#555c6c', '#6b7385', '#8a92a2', '#b0b8c4'), { layer: 2, R: 2, grad: 0.3 });
        hdF1_rr(s, ft, 0, 73, 21, 8, 3); hdF1_rr(s, ft, 75, 73, 21, 8, 3);
        hdF1_vl(s, fr, 7, 10, 72, 1); hdF1_vl(s, fr, 85, 10, 72, 1); hdF1_hl(s, fr, 7, 88, 10, 2);
        /* six things hanging, short and long by turns: a shoulder line, a fold or two, a hem */
        const cl = [['#e05599', 15, 54], ['#4a6fb5', 27, 63], ['#ffd45a', 39, 54], ['#8fbf9f', 51, 63], ['#c97b4a', 63, 54], ['#f7962d', 75, 63]];
        for (const [col, x, bot] of cl) {
            const hk = s.add(hdPal('#16181f', '#262935', '#3b3f52', '#545a70', '#70778e'), { layer: 3, R: 1, grad: 0 });
            s.rect(hk, x + 4, 14, 2, 3); s.rect(hk, x + 1, 17, 8, 1);
            const g = s.add(col, { layer: 4, R: 3, grad: 0.25 });
            s.poly(g, [[x + 2, 17.5], [x + 8, 17.5], [x + 10.5, 21], [x + 10.5, bot], [x - 0.5, bot], [x - 0.5, 21]]);
            hdF1_vl(s, g, x + 3, 24, bot - 2, -1); hdF1_vl(s, g, x + 7, 28, bot - 3, -1); hdF1_vl(s, g, x + 6, 28, bot - 3, 1);
            hdF1_hl(s, g, x, x + 10, bot - 3, -1);
        }
        hdF1_fin(s);
    },
};
HD_SPR.f_fabric_shelf = {
    w: 96, h: 66, ax: 48, ay: 63,
    draw(s) {
        const fr = hdF1_box(s, hdF1_soft('#8a5a33'), 0, 3, 96, 60, { layer: 1, R: 2, grad: 0.15 }, 1);
        const bk = hdF1_box(s, hdF1_soft('#b98552'), 6, 9, 84, 48, { layer: 0.5, R: 1, grad: 0.1 });
        const sh = hdF1_box(s, hdF1_soft('#8a5a33'), 3, 30, 90, 4, { layer: 2, R: 1.5, grad: 0.2, cast: 2 });
        hdF1_grain(s, fr, 1, 4, 94, 58, 51, 6);
        /* bolts of fabric folded on the shelves: [color, top, bottom, dots] */
        const rows = [[12, [['#e0405a', '#e9798c', '#b83650', 1], ['#ffd84a', '#ffe480', '#d1b043', 0], ['#4ec3d9', '#83d5e4', '#449fb5', 1], ['#8cc152', '#aed486', '#759e49', 0]]],
            [36, [['#b37cf0', '#caa3f4', '#9466c8', 0], ['#f7962d', '#f9b66c', '#cb7b2c', 1], ['#ff9ec0', '#ffbbd3', '#d182a1', 0], ['#4f86c6', '#84aad7', '#446ea6', 1]]]];
        rows.forEach(([y, bolts], r) => bolts.forEach(([c, top, bot, dots], i) => {
            const x = 9 + i * 21, b = s.add(hdPal(hdRamp(c)[0], bot, c, top, hdRamp(top)[3]), { layer: 3, R: 2, grad: 0.35 });
            hdF1_rr(s, b, x, y, 18, 18, 2);
            for (const fy of [y + 6, y + 12]) { hdF1_hl(s, b, x + 1, x + 16, fy, -1); hdF1_hl(s, b, x + 1, x + 16, fy + 1, 1); }
            if (dots) for (let j = y + 2; j < y + 17; j += 3) for (let q = x + 2 + ((j - y) % 2) * 2; q < x + 17; q += 4) if ((j - y) % 6 !== 0) s.px(q, j, '#ffffff');
        }));
        hdF1_drop(s, sh, 2);
        hdF1_fin(s);
    },
};
HD_SPR.f_beanbag = {
    w: 48, h: 84, ax: 24, ay: 81,
    draw(s) {
        const b = s.add(hdPal('#1e1b36', '#2e2a4e', '#3e3a62', '#5a5690', '#6e6aa8'), { layer: 1, R: 14, grad: 0.3, k: 1.3 });
        s.ellipse(b, 24, 56, 24, 19.5); s.ellipse(b, 23, 44, 17, 13); s.rect(b, 8, 66, 32, 9);
        /* where you sit: a soft hollow, and a crease running round it */
        for (let a = 0.4; a < 2.9; a += 0.04) hdF1_m(s, b, 20 + Math.cos(a) * 14, 44 + Math.sin(a) * 8, -1);
        for (let a = 3.6; a < 5.6; a += 0.05) hdF1_m(s, b, 20 + Math.cos(a) * 10, 44 + Math.sin(a) * 5, 1);
        for (const [x, y, big] of [[34, 46, 1], [13, 55, 1], [28, 64, 1], [40, 58, 0], [9, 46, 0], [22, 70, 0], [19, 38, 0]]) {
            s.px(x, y, '#fff6b0');
            if (big) { for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) s.px(x + dx, y + dy, '#fff6b0'); for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) s.px(x + dx, y + dy, '#a8a4c8'); }
        }
        hdF1_fin(s);
    },
};
HD_SPR.f_hammock = {
    w: 96, h: 84, ax: 48, ay: 81,
    draw(s) {
        const pole = hdPal('#4a2e18', '#7a5434', '#9a6b45', '#b4855a', '#c89a6c');
        const p = s.add(pole, { layer: 1, R: 2.5, grad: 0.05 });
        s.rect(p, 5, 0, 9, 81); s.rect(p, 82, 0, 9, 81);
        hdF1_grain(s, p, 6, 0, 84, 81, 61, 3, true);
        /* the ropes, fanning from each pole to the end of the sling */
        const rp = s.add(hdPal('#8a7a58', '#b8a67e', '#d9c8a0', '#ebdcb8', '#f6ecd0'), { layer: 2, R: 1, grad: 0 });
        for (const [x0, y0, x1, y1] of [[12, 13, 22, 31], [12, 16, 19, 36], [12, 19, 16, 38], [84, 13, 74, 31], [84, 16, 77, 36], [84, 19, 80, 38]]) s.line(rp, x0, y0, x1, y1, 0.7);
        s.rect(rp, 12, 12, 2, 9); s.rect(rp, 82, 12, 2, 9);
        /* the sling: striped canvas sagging in a curve to a point under the weight */
        const sl = s.add(hdPal('#8a6a14', '#d4a832', '#f2c94c', '#f8dc80', '#fff0b0'), { layer: 3, R: 3, grad: 0.25 });
        for (let x = 14; x <= 82; x++) {
            const u = (x - 48) / 34, top = 27 + (1 - u * u) * 11, bot = 42 + (1 - Math.abs(u) ** 1.6) * 11;
            for (let y = Math.round(top); y <= Math.round(bot); y++) s.plot(sl, x, y);
        }
        const cy = hdRamp('#4ec3d9');
        hdF1_later(s, () => s.each(sl, (x, y) => { if (Math.floor((x - 15) / 9) % 2 === 0) s.recolor(x, y, cy); }));
        /* the near edge rolled over, shading the inside */
        for (let x = 15; x <= 81; x++) { const u = (x - 48) / 34, top = Math.round(27 + (1 - u * u) * 11); hdF1_m(s, sl, x, top, 1); hdF1_m(s, sl, x, top + 1, 1); hdF1_m(s, sl, x, top + 3, -1); }
        hdF1_fin(s);
    },
};
HD_SPR.f_cheesecake_case = {
    w: 96, h: 84, ax: 48, ay: 81,
    draw(s) {
        const fr = hdF1_box(s, hdF1_soft('#e8d4b0'), 0, 20, 96, 64, { layer: 2, R: 2, grad: 0.1 });
        const tp = hdF1_box(s, hdF1_soft('#f7f3ea'), 0, 9, 96, 12, { layer: 4, R: 2, grad: 0.25, cast: 2 });
        hdF1_hl(s, tp, 1, 94, 11, 1);
        /* the glass case, a shelf of cheesecake slices inside */
        const gl = hdF1_box(s, HDF1_GLASS, 9, 21, 78, 30, { layer: 1, flat: 1, grad: 0.3 });
        const sh = hdF1_box(s, hdPal('#a8a090', '#d8d2c6', '#f4f0e8', '#ffffff', '#ffffff'), 9, 47, 78, 3, { layer: 1.5, R: 1, grad: 0 });
        for (const x of [15, 39, 63]) {
            const cake = s.add(hdPal('#b89a6a', '#ecd8b0', '#fff4dc', '#fffaf0', '#ffffff'), { layer: 3, R: 2, grad: 0.2 });
            s.rect(cake, x, 38, 18, 9);
            const crust = s.add(hdPal('#6a4220', '#a8703a', '#c98a4a', '#dca060', '#e8b878'), { layer: 3.5, R: 1, grad: 0 });
            s.rect(crust, x, 45, 18, 2);
            const top = s.add(hdPal('#6a0c18', '#a81828', '#d8283f', '#f05060', '#ff9aa0'), { layer: 4, R: 2, grad: 0.4, bias: 0.04 });
            s.rect(top, x, 35, 18, 3);
            for (const d of [2, 7, 11, 15]) { s.plot(top, x + d, 38); if (d % 2) s.plot(top, x + d, 39); }
            s.px(x + 4, 35, '#ffffff'); s.px(x + 5, 35, '#ffd0d4');
        }
        hdF1_glint(s, gl, 9, 21, 78, 30, 0.15, 1);
        hdF1_box(s, hdF1_soft('#e8d4b0'), 9, 50, 78, 3, { layer: 2.5, R: 1, grad: 0 });
        const pn = hdF1_box(s, hdF1_soft('#c9a47a'), 9, 57, 78, 18, { layer: 1, R: 2, grad: 0.15 });
        hdF1_grain(s, pn, 10, 58, 76, 16, 71, 5);
        hdF1_drop(s, tp, 3);
        hdF1_fin(s);
    },
};
HD_SPR.f_blueprint_table = {
    w: 96, h: 84, ax: 48, ay: 81,
    draw(s) {
        const lg = s.add('#6b4225', { layer: 1, R: 1.5, grad: 0.05 });
        for (const [a, b] of [[13, 7], [27, 25], [69, 71], [83, 89]]) s.line(lg, a, 54, b, 79, 2.3);
        const ed = hdF1_box(s, hdF1_soft('#8a5a33'), 0, 48, 96, 6, { layer: 3, R: 1.5, grad: 0.2, cast: 2 }, 1);
        const fr = hdF1_box(s, hdF1_soft('#355a96'), 3, 15, 90, 33, { layer: 2, R: 2, grad: 0.15 }, 1);
        const bp = hdF1_box(s, hdPal('#22406e', '#3c66a8', '#4a78c0', '#5584ca', '#6894d6'), 6, 20, 84, 25, { layer: 2.5, flat: 1, grad: 0.15 });
        /* the grid, then the drawing of a house in white lines */
        for (let x = 9; x < 90; x += 12) hdF1_vl(s, bp, x, 20, 44, 1);
        for (let y = 23; y < 45; y += 8) hdF1_hl(s, bp, 6, 89, y, 1);
        const W = '#eaf2ff', lnz = (x0, y0, x1, y1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) s.px(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), W); };
        lnz(25, 29, 39, 22); lnz(40, 22, 54, 22); lnz(55, 22, 64, 29); lnz(25, 29, 64, 29);
        lnz(28, 29, 28, 40); lnz(61, 29, 61, 40); lnz(28, 40, 61, 40); lnz(43, 33, 43, 40); lnz(48, 33, 48, 40); lnz(43, 33, 48, 33);
        lnz(32, 32, 37, 32); lnz(32, 36, 37, 36); lnz(32, 32, 32, 36); lnz(37, 32, 37, 36); lnz(53, 32, 58, 32); lnz(53, 36, 58, 36); lnz(53, 32, 53, 36); lnz(58, 32, 58, 36);
        lnz(22, 43, 66, 43); for (const x of [22, 66]) lnz(x, 42, x, 44);
        const rl = hdF1_box(s, hdPal('#8a6a14', '#d4a832', '#ffd84a', '#ffe88a', '#fff6c0'), 70, 21, 8, 24, { layer: 4, R: 1.5, grad: 0.2, cast: 1 });
        for (let y = 23; y < 44; y += 3) { hdF1_m(s, rl, 70, y, -2); hdF1_m(s, rl, 71, y, -2); if (y % 2) hdF1_m(s, rl, 72, y, -2); }
        hdF1_drop(s, ed, 2);
        hdF1_fin(s);
    },
};
HD_SPR.f_glaze_table = {
    w: 96, h: 84, ax: 48, ay: 81,
    draw(s) {
        const lg = hdF1_legs(s, '#8a5a33', [8, 79], 51, 9, 30);
        const tp = hdF1_box(s, hdF1_soft('#c98a55'), 0, 30, 96, 15, { layer: 2, R: 2, grad: 0.25 }, 1);
        hdF1_box(s, hdRamp('#e0a870'), 0, 29, 96, 3, { layer: 2.5, R: 1, grad: 0.3 }, 1);
        const ap = hdF1_box(s, hdF1_soft('#9a6b3a'), 0, 45, 96, 6, { layer: 3, R: 1, grad: 0.1, cast: 2 }, 1);
        hdF1_grain(s, tp, 1, 33, 94, 11, 81, 4);
        /* five crocks of glaze: white stoneware, a grey rim, the glaze run down the outside */
        ['#2f5da8', '#e0405a', '#ffd45a', '#8fc4a1', '#f7a8c4'].forEach((g, i) => {
            const x = 10 + i * 15, b = s.add(hdPal('#8a8070', '#d8d0c2', '#f4efe6', '#fbf8f2', '#ffffff'), { layer: 4, R: 4, grad: 0.25 });
            hdF1_rr(s, b, x, 10, 15, 22, 3);
            const rim = s.add(hdPal('#4a443a', '#6e665a', '#8a8070', '#a89e8e', '#c4bcae'), { layer: 5, R: 1.5, grad: 0.3 });
            s.rect(rim, x + 1, 7, 13, 4);
            const gm = hdRamp(g);
            hdF1_later(s, () => s.each(b, (px, py) => { const run = 20 - ((px - x) % 4 === 1 ? 3 : (px - x) % 5 === 3 ? 5 : 0); if (py >= run || (py >= 21 - 8 && (px - x) % 7 === 2)) s.recolor(px, py, gm); }));
        });
        hdF1_drop(s, ap, 2);
        hdF1_fin(s);
    },
};

/* ---------------------------------------------------------------- garden things on display */
/* leaf clusters over a box of part id (hedges, topiaries, bonsai): each cluster lit on its upper left, gaps between */
function hdF1_leaves(s, id, x0, y0, w, h, seed, cell) {
    cell = cell || 5;
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
        const gx = x / cell, gy = y / (cell * 0.8), ix = Math.floor(gx), iy = Math.floor(gy);
        let d1 = 9, d2 = 9, fx = 0, fy = 0;
        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
            const qx = ix + a, qy = iy + b, px = qx + 0.15 + hdF1_h(qx, qy, seed) * 0.7, py = qy + 0.15 + hdF1_h(qx, qy, seed + 1) * 0.7, d = Math.hypot(gx - px, gy - py);
            if (d < d1) { d2 = d1; d1 = d; fx = gx - px; fy = gy - py; } else if (d < d2) d2 = d;
        }
        if (d2 - d1 < 0.12) hdF1_m(s, id, x, y, -1);
        else if (fx * 0.8 + fy < -0.3) hdF1_m(s, id, x, y, 1);
        else if (fx * 0.8 + fy > 0.42) hdF1_m(s, id, x, y, -1);
    }
}
const HDF1_STONE = hdPal('#5e5a6a', '#8e8a9c', '#b8b4c4', '#d0ccdc', '#e6e2f0');
const HDF1_LEAF = hdPal('#1e4a26', '#2f7038', '#3f8a45', '#56a856', '#78c46a');
HD_SPR.f_beach_umbrella = {
    w: 48, h: 84, ax: 24, ay: 81,
    draw(s) {
        const pl = hdF1_box(s, hdPal('#4a443a', '#6e665a', '#8a8070', '#a89e8e', '#c4bcae'), 23, 24, 3, 57, { layer: 1, R: 1, grad: 0 });
        /* the canopy: a low cone in red and white panels, each panel lit on its left, scalloped at the hem */
        const cn = s.add('#e0405a', { layer: 3, R: 4, grad: 0.3, cast: 2 });
        s.poly(cn, [[22, 0], [26, 0], [48, 21], [48, 24], [0, 24], [0, 21]]);
        const wh = hdF1_ramp('#ffffff');
        hdF1_later(s, () => s.each(cn, (x, y) => { const a = Math.atan2(x + 0.5 - 24, y + 4), k = Math.floor((a + 1.6) / 0.39); if (k % 2) s.recolor(x, y, wh); }));
        for (let x = 0; x < 48; x++) { const r = x % 6; if (r === 0 || r === 5) hdF1_m(s, cn, x, 23, -1); hdF1_m(s, cn, x, 22, 1); }
        const tip = s.add(hdPal('#4a443a', '#6e665a', '#8a8070', '#a89e8e', '#c4bcae'), { layer: 4, R: 1, grad: 0 }); s.rect(tip, 23, 0, 3, 2);
        hdF1_m(s, pl, 23, 30, 1); hdF1_vl(s, pl, 24, 26, 78, 1);
        hdF1_fin(s);
    },
};
HD_SPR.f_clay_bin = {
    w: 48, h: 84, ax: 24, ay: 81,
    draw(s) {
        const bd = hdF1_box(s, hdF1_soft('#6b7385'), 3, 39, 42, 42, { layer: 1, R: 3, grad: 0.15 }, 2);
        for (const x of [12, 24, 36]) { hdF1_vl(s, bd, x, 42, 77, -1); hdF1_vl(s, bd, x + 1, 42, 77, 1); }
        const hd = hdF1_box(s, hdF1_soft('#5a6070'), 12, 56, 24, 4, { layer: 2, R: 1, grad: 0.3 }, 1);
        hdF1_hl(s, hd, 13, 34, 59, -1);
        const rim = hdF1_box(s, HDF1_STEEL, 0, 30, 48, 11, { layer: 3, R: 2, grad: 0.3, cast: 2 }, 3);
        /* wet clay heaped in the bin, seen over the rim */
        const cl = s.add(hdPal('#5e3422', '#8e5a40', '#b07a5c', '#c89270', '#d9a383'), { layer: 4, R: 4, grad: 0.4 });
        s.ellipse(cl, 24, 35, 19, 4.5); s.ellipse(cl, 17, 33.5, 8, 3.5); s.ellipse(cl, 30, 34, 9, 3.5);
        hdF1_m(s, cl, 20, 33, 1); hdF1_m(s, cl, 21, 33, 1); hdF1_m(s, cl, 29, 36, -1);
        hdF1_drop(s, rim, 2);
        hdF1_fin(s);
    },
};
HD_SPR.f_disp_birdbath = {
    w: 48, h: 84, ax: 24, ay: 81,
    draw(s) {
        const ft = s.add(hdPal('#6e6a7a', '#9c98aa', '#b8b4c4', '#ccc8d8', '#e0dcea'), { layer: 1, R: 2, grad: 0.2 });
        hdF1_rr(s, ft, 15, 70, 18, 12, 2); s.rect(ft, 18, 66, 12, 5);
        const pd = s.add(hdPal('#5e5a6a', '#8a86a0', '#a8a4b4', '#c0bccc', '#d8d4e4'), { layer: 2, R: 3, grad: 0.1 });
        s.poly(pd, [[19, 47], [29, 47], [27, 56], [28, 67], [20, 67], [21, 56]]);
        const bw = s.add(hdPal('#6e6a7a', '#a4a0b2', '#c8c4d4', '#dcd8e6', '#eeeaf6'), { layer: 3, R: 3, grad: 0.3, cast: 2 });
        s.poly(bw, [[2, 37], [46, 37], [42, 44], [31, 48], [17, 48], [6, 44]]); s.ellipse(bw, 24, 37.5, 22.5, 5);
        const wt = s.add(hdPal('#3a7aa0', '#64aed4', '#8fd0f0', '#b4e2f8', '#ffffff'), { layer: 4, flat: 1, grad: 0.5 });
        s.ellipse(wt, 24, 37.5, 18.5, 3.5);
        hdF1_m(s, wt, 18, 36, 3); hdF1_m(s, wt, 19, 36, 3); hdF1_m(s, wt, 20, 37, 2); hdF1_m(s, wt, 30, 38, 1);
        hdF1_speck(s, bw, 2, 38, 44, 10, 3, 0.06, -1); hdF1_speck(s, pd, 19, 47, 10, 20, 4, 0.06, -1);
        hdF1_drop(s, bw, 2);
        hdF1_fin(s);
    },
};
HD_SPR.f_disp_flamingo = {
    w: 48, h: 84, ax: 24, ay: 81,
    draw(s) {
        const lg = s.add(hdPal('#120c14', '#1e1520', '#2a1e2a', '#40303e', '#584656'), { layer: 1, R: 1, grad: 0 });
        s.rect(lg, 24, 52, 3, 29); s.rect(lg, 30, 52, 3, 29); s.rect(lg, 24, 64, 4, 2); s.rect(lg, 21, 80, 7, 2); s.rect(lg, 30, 80, 6, 2);
        const pk = hdPal('#a03a6a', '#e8669e', '#ff8ac2', '#ffa8d2', '#ffcce4');
        const bd = s.add(pk, { layer: 2, R: 7, grad: 0.3, k: 1.2 });
        s.ellipse(bd, 26.5, 44, 14.5, 9.5);
        const nk = s.add(pk, { layer: 3, R: 2.5, grad: 0.15 });
        s.line(nk, 35, 38, 34.5, 26, 2.8, 2.4); s.line(nk, 34.5, 26, 33, 20, 2.4);
        const hd = s.add(pk, { layer: 4, R: 4, grad: 0.3 });
        s.ellipse(hd, 33, 15, 6, 5.5);
        const bk = s.add(hdPal('#120c14', '#1e1520', '#2a1e2a', '#40303e', '#584656'), { layer: 5, R: 1, grad: 0 });
        s.poly(bk, [[37, 13], [41, 15], [44, 20], [43, 22], [38, 18]]);
        const bkl = s.add(hdPal('#c09080', '#e8c0b0', '#f8e0d8', '#fff0e8', '#ffffff'), { layer: 5.5, R: 1, grad: 0 }); s.poly(bkl, [[36, 12], [40, 13], [39, 16], [36, 15]]);
        s.px(34, 13, '#2a1e2a'); s.px(34, 14, '#2a1e2a');
        /* the wing folded on her side, its feathers stepped */
        const wg = s.add(hdPal('#c0608a', '#f09cc4', '#ffb3d9', '#ffcce6', '#ffe4f2'), { layer: 3, R: 4, grad: 0.35, cast: 1 });
        s.poly(wg, [[15, 38], [28, 37], [32, 41], [27, 47], [14, 46]]);
        for (const x of [17, 21, 25]) { hdF1_m(s, wg, x, 44, -1); hdF1_m(s, wg, x + 1, 43, -1); }
        hdF1_fin(s);
    },
};
HD_SPR.f_disp_gnome = {
    w: 48, h: 84, ax: 24, ay: 81,
    draw(s) {
        const bt = s.add(hdPal('#2e1e10', '#4e341c', '#6b4a2a', '#8a6440', '#a07a52'), { layer: 1, R: 2.5, grad: 0.2 });
        hdF1_rr(s, bt, 13, 72, 10, 10, 3); hdF1_rr(s, bt, 26, 72, 10, 10, 3);
        const bd = s.add(hdPal('#1e3a6a', '#3a6aa8', '#4f86c6', '#6c9cd6', '#8cb4e2'), { layer: 2, R: 5, grad: 0.25 });
        hdF1_rr(s, bd, 15, 55, 19, 19, 4);
        const bl = hdF1_box(s, hdPal('#3e2414', '#5e3e22', '#7a5434', '#966c48', '#ac845c'), 15, 66, 19, 3, { layer: 2.5, R: 1, grad: 0 });
        s.px(24, 67, '#ffd84a'); s.px(25, 67, '#e8b830');
        /* the beard, fluffy and white, over the tunic */
        const br = s.add(hdPal('#8a8494', '#c8c4d0', '#f2f2f2', '#ffffff', '#ffffff'), { layer: 4, R: 4, grad: 0.3, cast: 2 });
        s.poly(br, [[13, 48], [36, 48], [33, 58], [27, 64], [22, 64], [16, 58]]);
        for (const [x, y] of [[19, 55], [23, 58], [28, 56], [25, 52], [31, 52], [17, 51]]) { hdF1_m(s, br, x, y, -1); hdF1_m(s, br, x + 1, y + 1, -1); }
        const fc = s.add(hdSkin('#f8d0b8'), { layer: 3, R: 4, grad: 0.2 });
        hdF1_rr(s, fc, 14, 43, 21, 9, 3);
        const ns = s.add(hdSkin('#f0a088'), { layer: 5, R: 2, grad: 0.3 }); s.ellipse(ns, 30, 51, 3, 2.5);
        for (const [x, y] of [[23, 47], [23, 48], [29, 47], [29, 48]]) s.px(x, y, '#2a1e2a');
        s.px(20, 50, '#f4a8a0'); s.px(34, 50, '#f4a8a0');
        /* the pointed red hat, its tip nodding over */
        const ht = s.add(hdPal('#701626', '#b02a40', '#e0405a', '#f06a7e', '#ff98a6'), { layer: 6, R: 5, grad: 0.3, cast: 2 });
        s.poly(ht, [[24, 16], [28, 20], [33, 30], [38, 38], [42, 44], [7, 44], [11, 38], [16, 30], [21, 21]]);
        s.ellipse(ht, 25, 18.5, 3, 3); s.ellipse(ht, 26, 21, 4, 3);
        hdF1_hl(s, ht, 8, 41, 43, -1);
        hdF1_fin(s);
    },
};
HD_SPR.f_disp_hedge = {
    w: 48, h: 84, ax: 24, ay: 81,
    draw(s) {
        /* a round hedge: a few leafy clumps, the lower ones in front */
        const b = s.add(HDF1_LEAF, { layer: 1, R: 14, grad: 0.3, k: 1.2 });
        s.ellipse(b, 24, 58, 24, 22);
        for (let a = 0; a < 6.28; a += 0.5) s.ellipse(b, 24 + Math.cos(a) * 20, 58 + Math.sin(a) * 18, 4.5, 4);
        hdF1_leaves(s, b, 0, 30, 48, 54, 5, 5);
        hdF1_fin(s);
    },
};
HD_SPR.f_disp_lantern = {
    w: 48, h: 90, ax: 24, ay: 87,
    draw(s) {
        const ped = s.add(HDF1_STONE, { layer: 1, R: 2, grad: 0.15 });
        hdF1_rr(s, ped, 12, 66, 24, 18, 1);
        const cap = hdF1_box(s, HDF1_STONE, 12, 64, 24, 4, { layer: 1.5, R: 1.5, grad: 0.3, cast: 2 });
        const post = hdF1_box(s, HDF1_STONE, 18, 46, 12, 19, { layer: 1, R: 3, grad: 0.05 });
        const pl = hdF1_box(s, HDF1_STONE, 3, 36, 42, 9, { layer: 3, R: 2, grad: 0.25, cast: 2 }, 1);
        hdF1_box(s, hdPal('#7a7686', '#b0acbc', '#d8d4e4', '#ece8f6', '#ffffff'), 3, 36, 42, 3, { layer: 3.5, R: 1, grad: 0.2 });
        /* the light box: the stone frame and its two glowing panes */
        const bx = hdF1_box(s, hdPal('#4e4a5a', '#7a7688', '#9a96a6', '#b2aebe', '#c8c4d4'), 12, 18, 24, 18, { layer: 2, R: 1.5, grad: 0.15 });
        const gl = hdPal('#e0a838', '#ffd060', '#ffe89a', '#fff4c4', '#fffbe6');
        hdF1_box(s, gl, 18, 21, 9, 12, { layer: 2.5, flat: 1, grad: -0.3 }); hdF1_box(s, gl, 30, 21, 6, 12, { layer: 2.5, flat: 1, grad: -0.3 });
        const rf = s.add(HDF1_STONE, { layer: 4, R: 3, grad: 0.35, cast: 2 });
        s.poly(rf, [[18, 6], [30, 6], [42, 13], [45, 18], [3, 18], [6, 13]]);
        s.rect(rf, 22, 4, 4, 3);
        const fn = s.add(hdPal('#4e4a5a', '#7a7688', '#9a96a6', '#b2aebe', '#c8c4d4'), { layer: 5, R: 1.5, grad: 0.2 }); s.ellipse(fn, 27.5, 3.5, 2.5, 2.5);
        hdF1_speck(s, ped, 12, 66, 24, 18, 21, 0.07, -1); hdF1_speck(s, post, 18, 46, 12, 18, 22, 0.07, -1); hdF1_speck(s, rf, 3, 6, 42, 12, 23, 0.05, -1);
        hdF1_drop(s, rf, 2); hdF1_drop(s, pl, 2); hdF1_drop(s, cap, 1);
        hdF1_fin(s);
    },
};
HD_SPR.f_disp_topiary = {
    w: 48, h: 90, ax: 24, ay: 87,
    draw(s) {
        const pot = s.add(hdPal('#6a2c18', '#a85a3a', '#c8704a', '#d88a62', '#e8a47c'), { layer: 1, R: 3, grad: 0.15 });
        s.poly(pot, [[14, 67], [34, 67], [33, 83], [15, 83]]);
        const rim = hdF1_box(s, hdPal('#7a3a1c', '#c06a40', '#e08a5a', '#eca478', '#f6c09a'), 12, 64, 24, 5, { layer: 2, R: 2, grad: 0.3, cast: 2 }, 1);
        /* the bunny: two ears, a head with two dark eyes, a round body */
        const parts = [[3, 24, 48, 21, 15], [4, 26.5, 24, 15, 9.5], [2, 20.5, 10, 5.5, 11], [2, 32.5, 10, 5.5, 11]];
        const ids = parts.map(([l, x, y, rx, ry]) => { const p = s.add(HDF1_LEAF, { layer: l, R: 7, grad: 0.3 }); s.ellipse(p, x, y, rx, ry); return p; });
        for (const p of ids) hdF1_leaves(s, p, 0, 0, 48, 64, p * 3, 4);
        for (const [x, y] of [[25, 25], [26, 25], [25, 26], [26, 26], [34, 25], [35, 25], [34, 26], [35, 26]]) s.px(x, y, '#1e1820');
        s.px(26, 25, '#5a6a5a'); s.px(35, 25, '#5a6a5a');
        hdF1_drop(s, rim, 2);
        hdF1_fin(s);
    },
};
HD_SPR.f_easel = {
    w: 48, h: 90, ax: 24, ay: 87,
    draw(s) {
        const wood = hdPal('#4e2e14', '#7e5228', '#a8733f', '#bf8a52', '#d4a068');
        const lg = s.add(wood, { layer: 1, R: 1.5, grad: 0.05 });
        s.line(lg, 14, 52, 10, 88, 2.4); s.line(lg, 34, 52, 38, 88, 2.4); s.line(lg, 24, 4, 24, 52, 2.4);
        const bl = s.add(hdPal('#3a2412', '#5e3e22', '#8a5a33', '#a0703e', '#b88650'), { layer: 0.5, R: 1.5, grad: 0 });
        s.line(bl, 23.5, 52, 25, 88, 2.4);
        const tr = hdF1_box(s, hdPal('#3a2412', '#5e3e22', '#8a5a33', '#a0703e', '#b88650'), 0, 48, 48, 6, { layer: 4, R: 1.5, grad: 0.3, cast: 2 }, 1);
        const fr = hdF1_box(s, hdPal('#6a4a1e', '#a88440', '#c9a462', '#dcbc80', '#ecd4a0'), 3, 15, 42, 33, { layer: 2, R: 1.5, grad: 0.15 });
        const cv = hdF1_box(s, hdF1_soft('#fbf8f2'), 6, 18, 36, 27, { layer: 3, flat: 1, grad: 0.15 });
        /* the painting: blue sky over a green hill, a yellow sun, in short brush strokes */
        const sky = hdRamp('#9fd8ef'), sun = hdRamp('#ffd84a'), hill = hdRamp('#8cc152');
        hdF1_later(s, () => s.each(cv, (x, y) => {
            if (x < 9 || x > 38 || y < 21 || y > 41) return;
            const hy = 36 + Math.round(Math.sin(x * 0.22 + 1) * 1.2), sx = 23 + Math.round(hdF1_h(1, y, 7) * 1.6);
            if (y >= hy && x <= 36) s.recolor(x, y, hill); else if (Math.hypot(x - 29.5, y - 24) < 3.2) s.recolor(x, y, sun); else if (x <= sx && y >= 23 + Math.round(hdF1_h(x, 2, 7)) && y < hy) s.recolor(x, y, sky);
        }));
        const mast = s.add(wood, { layer: 5, R: 1.5, grad: 0 }); s.rect(mast, 21, 3, 6, 10);
        hdF1_drop(s, tr, 2);
        hdF1_fin(s);
    },
};
HD_SPR.f_grain_hopper = {
    w: 48, h: 90, ax: 24, ay: 87,
    draw(s) {
        const fr = s.add(hdPal('#3e2410', '#62401e', '#8a5a33', '#a0703e', '#b88650'), { layer: 1, R: 1.5, grad: 0.05 });
        s.rect(fr, 9, 36, 6, 51); s.rect(fr, 33, 36, 6, 51); s.rect(fr, 9, 64, 30, 6);
        hdF1_grain(s, fr, 9, 36, 30, 48, 91, 3, true);
        /* a white sack catching the grain under the chute */
        const sk = s.add(hdF1_soft('#f4efe6'), { layer: 0.5, R: 4, grad: 0.2 });
        hdF1_rr(s, sk, 15, 68, 18, 19, 3);
        hdF1_box(s, hdF1_soft('#ffffff'), 15, 68, 18, 4, { layer: 0.6, R: 1.5, grad: 0.3 });
        const ch = hdF1_box(s, hdPal('#4e2e14', '#7e5228', '#a8733f', '#bf8a52', '#d4a068'), 18, 36, 12, 21, { layer: 2, R: 2, grad: 0.05 });
        /* the funnel: boards narrowing down, grain heaped in its mouth */
        const fn = s.add(hdF1_soft('#b98552'), { layer: 3, R: 2, grad: 0.2, cast: 2 });
        s.poly(fn, [[0, 12], [48, 12], [42, 21], [36, 30], [30, 37], [18, 37], [12, 30], [6, 21]]);
        for (const y of [19, 27]) for (let x = 0; x < 48; x++) { hdF1_m(s, fn, x, y, -1); hdF1_m(s, fn, x, y + 1, 1); }
        const rim = hdF1_box(s, hdF1_soft('#d9a46a'), 0, 6, 48, 7, { layer: 4, R: 2, grad: 0.3 }, 2);
        const gr = s.add(hdPal('#8a6a14', '#c49a38', '#e8c860', '#f4dc8a', '#fff0b8'), { layer: 5, R: 3, grad: 0.3 });
        s.ellipse(gr, 24, 9, 20, 3);
        hdF1_speck(s, gr, 4, 6, 40, 6, 92, 0.25, 1); hdF1_speck(s, gr, 4, 6, 40, 6, 93, 0.12, -1);
        hdF1_drop(s, fn, 2);
        hdF1_fin(s);
    },
};
HD_SPR.f_goat_bed = {
    w: 48, h: 84, ax: 24, ay: 81,
    draw(s) {
        const pm = hdPal('#5a3488', '#8e5ad0', '#b37cf0', '#c69af4', '#dabaf8');
        const rm = s.add(pm, { layer: 1, R: 5, grad: 0.3, k: 1.2 });
        s.ellipse(rm, 24, 62, 24, 13.5);
        /* the soft cushion inside the rim, and the rim's front with a row of yellow studs */
        const cu = s.add(hdPal('#8e6ab8', '#c4a2ec', '#d8b8f8', '#e6d0fa', '#f4e8fe'), { layer: 2, R: 6, grad: 0.1 });
        s.ellipse(cu, 24, 61, 18, 8);
        const fr = s.add(pm, { layer: 3, R: 4, grad: 0.1 });
        for (let y = 60; y < 76; y++) for (let x = 0; x < 48; x++) { const u = (x + 0.5 - 24) / 24, v = (y + 0.5 - 62) / 13.5, u2 = (x + 0.5 - 24) / 19, v2 = (y + 0.5 - 59.5) / 8.5; if (u * u + v * v <= 1 && u2 * u2 + v2 * v2 > 1) s.plot(fr, x, y); }
        for (const x of [10, 22, 34]) { const st = s.add(hdPal('#a8781e', '#e8b830', '#ffd84a', '#ffec90', '#fff8d0'), { layer: 4, R: 1.5, grad: 0.3 }); s.ellipse(st, x + 1.5, 70.5, 2, 2); }
        hdF1_fin(s);
    },
};
HD_SPR.f_goat_statue = {
    w: 48, h: 84, ax: 24, ay: 81,
    draw(s) {
        const st = hdPal('#5a544e', '#8e867e', '#c8c0b8', '#d8d2ca', '#ebe6e0');
        const pl = hdF1_box(s, hdF1_soft('#b8b0a8'), 3, 60, 42, 21, { layer: 1, R: 2, grad: 0.15 }, 1);
        const pt = hdF1_box(s, hdF1_soft('#d8d0c8'), 3, 58, 42, 4, { layer: 1.5, R: 1.5, grad: 0.3 }, 1);
        hdF1_speck(s, pl, 3, 62, 42, 16, 31, 0.06, -1);
        /* the goat, carved standing and looking right */
        const lg = s.add(st, { layer: 2, R: 2, grad: 0 });
        for (const x of [3, 12, 21, 30]) s.rect(lg, x, 48, 6, 9);
        const hv = s.add(hdPal('#16121a', '#262028', '#3a3336', '#504648', '#685c5c'), { layer: 2.5, R: 1, grad: 0 });
        for (const x of [3, 12, 21, 30]) s.rect(hv, x, 54, 6, 3);
        const bd = s.add(st, { layer: 3, R: 8, grad: 0.3, k: 1.2 });
        hdF1_rr(s, bd, 0, 33, 40, 18, 7);
        const tl = s.add(st, { layer: 2.8, R: 2, grad: 0.2 }); s.ellipse(tl, 5, 32, 3, 3.5);
        const hd = s.add(st, { layer: 4, R: 6, grad: 0.3 });
        s.poly(hd, [[24, 28], [30, 25], [39, 26], [44, 31], [47, 37], [47, 41], [42, 44], [33, 46], [26, 42]]);
        const bdd = s.add(hdPal('#4e4842', '#7e766e', '#a8a098', '#bab2aa', '#ccc6be'), { layer: 4.5, R: 1.5, grad: 0 }); s.poly(bdd, [[36, 44], [42, 44], [40, 49], [38, 49]]);
        const hn = s.add(hdPal('#4a3e2e', '#76664e', '#9a8a70', '#b0a088', '#c8b8a0'), { layer: 5, R: 1.5, grad: 0.2 });
        s.line(hn, 31, 27, 30, 21, 1.6, 1.1); s.line(hn, 30, 21, 32, 18, 1.1); s.line(hn, 37, 27, 37, 21, 1.6, 1.1); s.line(hn, 37, 21, 39, 18, 1.1);
        s.px(32, 31, '#231418'); s.px(33, 31, '#231418'); s.px(32, 32, '#231418'); s.px(33, 32, '#3a2a2e');
        for (const [x, y] of [[40, 37], [41, 37], [42, 37], [43, 37], [41, 38], [42, 38]]) s.px(x, y, '#f2a6a6'); s.px(44, 37, '#d88888');
        hdF1_speck(s, bd, 0, 33, 40, 18, 32, 0.05, -1); hdF1_speck(s, hd, 24, 25, 24, 21, 33, 0.04, -1);
        hdF1_fin(s);
    },
};
HD_SPR.f_golf_bag = {
    w: 48, h: 84, ax: 24, ay: 81,
    draw(s) {
        /* three clubs: steel shafts, the heads at the top */
        const sh = s.add(hdPal('#6e7a8a', '#98a4b4', '#b8c4d0', '#d4dce6', '#f2f6fa'), { layer: 1, R: 1, grad: 0 });
        for (const x of [17, 26, 35]) s.rect(sh, x, 6, 3, 22);
        const hd = s.add(HDF1_STEEL, { layer: 2, R: 2, grad: 0.3 });
        hdF1_rr(s, hd, 13, 0, 8, 7, 2); hdF1_rr(s, hd, 23, 0, 7, 7, 2); hdF1_rr(s, hd, 32, 0, 8, 7, 2);
        const bg = s.add(hdPal('#163e26', '#2a6a42', '#3b8254', '#4e9a68', '#68b280'), { layer: 3, R: 6, grad: 0.15 });
        hdF1_rr(s, bg, 12, 26, 24, 54, 4); s.rect(bg, 15, 77, 18, 4);
        const tp = hdF1_box(s, hdPal('#163e26', '#2a6a42', '#3b8254', '#4e9a68', '#68b280'), 12, 24, 24, 6, { layer: 4, R: 2, grad: 0.4, cast: 2 }, 2);
        const sp = s.add(hdF1_ramp('#ffffff'), { layer: 4, R: 2, grad: 0.2 }); s.rect(sp, 12, 36, 24, 6);
        const pk = hdF1_box(s, hdPal('#163e26', '#2a6a42', '#3b8254', '#4e9a68', '#68b280'), 15, 50, 18, 18, { layer: 4, R: 3, grad: 0.2, cast: 1 }, 3);
        hdF1_hl(s, pk, 16, 31, 54, -1); hdF1_vl(s, bg, 31, 44, 74, -1);
        hdF1_drop(s, tp, 2);
        hdF1_fin(s);
    },
};
HD_SPR.f_flour_bin = {
    w: 48, h: 72, ax: 24, ay: 69,
    draw(s) {
        const br = s.add(hdF1_soft('#b98552'), { layer: 1, R: 4, grad: 0.15, k: 1.2 });
        s.poly(br, [[3, 24], [45, 24], [46, 42], [45, 68], [3, 68], [2, 42]]);
        for (const x of [12, 21, 30, 39]) for (let y = 25; y < 68; y++) { hdF1_m(s, br, x, y, -1); hdF1_m(s, br, x + 1, y, 1); }
        hdF1_grain(s, br, 3, 26, 42, 41, 101, 7, true);
        for (const y of [34, 57]) { const h = s.add(hdPal('#2e2a32', '#4e4852', '#6b6570', '#8a8490', '#aaa4b0'), { layer: 2, R: 1.5, grad: 0.3 }); s.rect(h, 2, y, 44, 3); for (let x = 6; x < 44; x += 10) s.px(x, y + 1, '#c8c2cc'); }
        /* flour heaped over the top, the scoop stuck in it */
        const sc = s.add(HDF1_STEEL, { layer: 2.5, R: 1, grad: 0 });
        s.line(sc, 44, 4, 30, 18, 1.3);
        const fl = s.add(hdF1_soft('#fbf6ee'), { layer: 3, R: 6, grad: 0.35 });
        s.ellipse(fl, 24, 25, 22, 4.5); s.ellipse(fl, 18, 22, 12, 5); s.ellipse(fl, 26, 21, 9, 4);
        const sb = s.add(HDF1_STEEL, { layer: 4, R: 2, grad: 0.2 }); s.ellipse(sb, 29, 19, 4, 2.5);
        hdF1_speck(s, fl, 4, 16, 40, 13, 102, 0.08, -1);
        hdF1_fin(s);
    },
};
HD_SPR.f_hayloft_ladder = {
    w: 48, h: 78, ax: 24, ay: 75,
    draw(s) {
        /* the edge of the loft overhead, hay poking over it */
        const hy = s.add(hdPal('#7a5a14', '#c4a03a', '#e8c860', '#f4dc8a', '#fff0b8'), { layer: 3, R: 2, grad: 0.3, cast: 2 });
        s.rect(hy, 0, 0, 48, 6);
        for (let x = 0; x < 48; x += 2) { const d = Math.floor(hdF1_h(x, 1, 111) * 3); for (let j = 0; j < d; j++) s.plot(hy, x + (j % 2), 6 + j); }
        hdF1_speck(s, hy, 0, 0, 48, 9, 112, 0.25, 1);
        const rail = s.add(hdPal('#3e2410', '#62401e', '#8a5a33', '#b98552', '#cc9a68'), { layer: 2, R: 3, grad: 0.05 });
        s.rect(rail, 8, 6, 7, 72); s.rect(rail, 35, 6, 7, 72);
        hdF1_grain(s, rail, 8, 6, 34, 72, 113, 3, true);
        for (let y = 6; y < 72; y += 12) { const r = hdF1_box(s, hdPal('#5e3e1e', '#a07848', '#c99a62', '#dab07a', '#e8c494'), 12, y, 26, 5, { layer: 2.5, R: 1.5, grad: 0.3, cast: 2 }); hdF1_drop(s, r, 2); }
        hdF1_drop(s, hy, 2);
        hdF1_fin(s);
    },
};
HD_SPR.f_disp_flag = {
    w: 96, h: 120, ax: 48, ay: 117,
    draw(s) {
        const bs = s.add(hdPal('#4a4e64', '#6e7288', '#8a8ea8', '#a4a8c0', '#bcc0d6'), { layer: 1, R: 2, grad: 0.25 });
        hdF1_rr(s, bs, 24, 104, 21, 15, 2); s.rect(bs, 28, 100, 13, 5);
        const pl = s.add(hdPal('#6a6a80', '#a8a8b8', '#d8d8e0', '#ececf2', '#ffffff'), { layer: 2, R: 2.5, grad: 0 });
        s.rect(pl, 33, 8, 6, 93);
        const ball = s.add(HDF1_GOLD, { layer: 3, R: 3, grad: 0.3, bias: 0.05 }); s.ellipse(ball, 36, 5, 5, 4.5);
        /* the island flag, rippling: a white band over cyan, a yellow star in the middle, a darker ripple along the hem */
        const fl = s.add(hdPal('#1c6a88', '#3aa6c4', '#4ec3d9', '#7ad4e6', '#a8e6f2'), { layer: 2.5, R: 3, grad: 0.15 });
        const wv = x => Math.round(Math.sin((x - 39) / 44 * Math.PI * 1.6) * 1.6);
        for (let x = 39; x < 84; x++) for (let y = 10 + wv(x); y < 40 + wv(x); y++) s.plot(fl, x, y);
        const wh = hdF1_ramp('#ffffff');
        hdF1_later(s, () => s.each(fl, (x, y) => { if (y < 20 + wv(x)) s.recolor(x, y, wh); }));
        for (let x = 39; x < 84; x++) { const k = Math.sin((x - 39) / 44 * Math.PI * 1.6); if (k > 0.55) for (let y = 10; y < 40; y++) hdF1_m(s, fl, x, y + wv(x), -1); else if (k < -0.55) for (let y = 10; y < 40; y++) hdF1_m(s, fl, x, y + wv(x), 1); }
        const st = s.add(hdPal('#a8781e', '#e8b830', '#ffd84a', '#ffec90', '#fff8d0'), { layer: 3.5, R: 2, grad: 0.3 });
        const cx = 56.5, cy = 28 + wv(56);
        s.poly(st, [[cx, cy - 7], [cx + 2, cy - 2], [cx + 7, cy], [cx + 2, cy + 2], [cx, cy + 7], [cx - 2, cy + 2], [cx - 7, cy], [cx - 2, cy - 2]]);
        for (let x = 41; x < 83; x += 9) for (let i = 0; i < 3; i++) s.px(x + i, 37 + wv(x + i), '#2c8aa8');
        hdF1_vl(s, pl, 34, 9, 99, 1);
        hdF1_fin(s);
    },
};
HD_SPR.f_disp_fountain = {
    w: 96, h: 102, ax: 48, ay: 99,
    draw(s) {
        /* the basin: a stone ring seen from above, the pool inside it, a deeper ring of water round the middle */
        const bs = s.add(HDF1_STONE, { layer: 1, R: 4, grad: 0.3, k: 1.2 });
        s.ellipse(bs, 48, 77, 48, 20); s.rect(bs, 1, 77, 94, 4);
        const wt = s.add(hdPal('#2a6a98', '#4a9ad0', '#6fb8e0', '#8fd0f0', '#c4ecfc'), { layer: 2, flat: 1, grad: -0.4 });
        s.ellipse(wt, 48, 74, 42, 15);
        hdF1_later(s, () => s.each(wt, (x, y) => { const u = (x + 0.5 - 48) / 42, v = (y + 0.5 - 74) / 15, r = u * u + v * v; if (r < 0.62) s.recolor(x, y, hdPal('#3a7aa8', '#6aaed8', '#8fd0f0', '#b0e0f6', '#e0f6ff')); }));
        for (const [x, y, w] of [[20, 70, 8], [62, 67, 10], [36, 82, 9], [70, 80, 6]]) for (let i = 0; i < w; i++) hdF1_m(s, wt, x + i, y, 2);
        const rim = s.add(HDF1_STONE, { layer: 3, R: 2, grad: 0.2 });
        for (let y = 73; y < 100; y++) for (let x = 0; x < 96; x++) {
            const u = (x + 0.5 - 48) / 48, v = (y + 0.5 - 77) / 20, u2 = (x + 0.5 - 48) / 43, v2 = (y + 0.5 - 74) / 15.5;
            if ((u * u + v * v <= 1 || (y >= 77 && y <= 80 && x > 0 && x < 95)) && u2 * u2 + v2 * v2 > 1) s.plot(rim, x, y);
        }
        const rf = s.add(HDF1_STONE, { layer: 3.2, R: 3, grad: 0.15 });
        for (let y = 77; y < 99; y++) for (let x = 2; x < 94; x++) { const u = (x + 0.5 - 48) / 46, v = (y + 0.5 - 81) / 17; if (u * u + v * v <= 1 && y >= 84) s.plot(rf, x, y); }
        /* the pedestal and the upper bowl, water spilling from its lip */
        const pd = s.add(hdPal('#4e4a5a', '#7a7688', '#9a96a6', '#b2aebe', '#c8c4d4'), { layer: 4, R: 3, grad: 0.1 });
        s.poly(pd, [[42, 40], [54, 40], [53, 50], [56, 58], [40, 58], [43, 50]]);
        const ub = s.add(HDF1_STONE, { layer: 5, R: 3, grad: 0.3, cast: 2 });
        s.poly(ub, [[30, 31], [66, 31], [62, 37], [54, 41], [42, 41], [34, 37]]); s.ellipse(ub, 48, 32, 18, 4);
        const uw = s.add(hdPal('#3a7aa8', '#6aaed8', '#8fd0f0', '#b0e0f6', '#e0f6ff'), { layer: 6, flat: 1, grad: -0.3 });
        s.ellipse(uw, 48, 32, 14, 2.6);
        const sp = s.add(hdPal('#6e6a7a', '#a4a0b2', '#c8c4d4', '#dcd8e6', '#eeeaf6'), { layer: 7, R: 2.5, grad: 0.1 });
        s.rect(sp, 45, 13, 6, 18); s.ellipse(sp, 48, 13, 3.5, 3);
        const fw = s.add(hdPal('#4a9ad0', '#8fd0f0', '#c4ecfc', '#e6f8ff', '#ffffff'), { layer: 4.5, flat: 1, grad: 0 });
        for (const x of [33, 62]) for (let y = 36; y < 62; y++) { s.plot(fw, x + (y > 50 ? (x < 48 ? -1 : 1) : 0), y); if (y % 5 !== 0) s.plot(fw, x + (x < 48 ? -1 : 1), y + 1); }
        hdF1_speck(s, rf, 2, 84, 92, 15, 41, 0.05, -1); hdF1_speck(s, bs, 0, 56, 96, 20, 42, 0.04, -1);
        hdF1_drop(s, ub, 2);
        hdF1_fin(s);
    },
};
HD_SPR.f_disp_umbrella = {
    w: 96, h: 102, ax: 48, ay: 99,
    draw(s) {
        const ft = s.add(hdPal('#4a4e64', '#6e7288', '#8a8ea8', '#a4a8c0', '#bcc0d6'), { layer: 1, R: 2, grad: 0.3 });
        hdF1_rr(s, ft, 40, 94, 26, 6, 2);
        const pl = hdF1_box(s, hdPal('#6a6a80', '#a8a8b8', '#d8d8e0', '#ececf2', '#ffffff'), 50, 30, 6, 66, { layer: 2, R: 2.5, grad: 0 });
        hdF1_vl(s, pl, 51, 37, 94, 1);
        const cn = s.add('#e0405a', { layer: 3, R: 5, grad: 0.3, cast: 2 });
        s.poly(cn, [[42, 3], [62, 3], [76, 13], [88, 26], [90, 33], [8, 33], [10, 26], [22, 13]]);
        const wh = hdF1_ramp('#ffffff');
        hdF1_later(s, () => s.each(cn, (x, y) => { const a = Math.atan2(x + 0.5 - 50, y + 10), k = Math.floor((a + 1.6) / 0.27); if (k % 2) s.recolor(x, y, wh); }));
        const hem = s.add('#b3263a', { layer: 4, R: 1.5, grad: 0 });
        for (let x = 8; x < 90; x++) { const r = (x - 8) % 9, d = r === 0 || r === 8 ? 0 : r === 1 || r === 7 ? 1 : 2; for (let y = 33; y < 35 + d; y++) s.plot(hem, x, y); }
        hdF1_drop(s, hem, 2);
        hdF1_fin(s);
    },
};
HD_SPR.f_disp_stonebench = {
    w: 96, h: 84, ax: 48, ay: 81,
    draw(s) {
        const lg = s.add(hdPal('#4e4a5a', '#7a7688', '#a8a4b4', '#bcb8c8', '#d0ccdc'), { layer: 1, R: 2, grad: 0.1 });
        s.rect(lg, 12, 60, 12, 22); s.rect(lg, 69, 60, 12, 22);
        for (const x of [23, 80]) hdF1_vl(s, lg, x, 62, 80, -1);
        const sl = hdF1_box(s, HDF1_STONE, 0, 45, 96, 16, { layer: 2, R: 2, grad: 0.15, cast: 2 }, 1);
        hdF1_box(s, hdPal('#7a7686', '#b0acbc', '#d8d4e4', '#ece8f6', '#ffffff'), 0, 45, 96, 4, { layer: 2.5, R: 1.5, grad: 0.2 }, 1);
        const fr = hdF1_box(s, hdPal('#4e4a5a', '#7a7688', '#9a96a6', '#b2aebe', '#c8c4d4'), 0, 59, 96, 4, { layer: 3, R: 1, grad: 0, cast: 2 }, 1);
        hdF1_speck(s, sl, 1, 49, 94, 10, 51, 0.06, -1); hdF1_speck(s, lg, 12, 63, 69, 19, 52, 0.06, -1);
        for (const [x, y] of [[60, 51], [27, 54]]) { hdF1_m(s, sl, x, y, -1); hdF1_m(s, sl, x + 1, y, -1); hdF1_m(s, sl, x, y + 1, 1); }
        hdF1_drop(s, fr, 2);
        hdF1_fin(s);
    },
};

/* ---------------------------------------------------------------- small things on tables and walls */
/* a 3x5 pixel font for the few words on signs */
const HDF1_FONT = { B: '110101110101110', O: '010101101101010', S: '011100010001110', T: '111010010010010', N: '111101101101101', D: '110101101101110', I: '111010010010111', U: '101101101101111', R: '110101110101101', E: '111100110100111' };
function hdF1_text(s, txt, x, y, col, sh) {
    for (const ch of txt) {
        const g = HDF1_FONT[ch];
        if (g) for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (g[j * 3 + i] === '1') { if (sh) s.px(x + i + 1, y + j + 1, sh); s.px(x + i, y + j, col); }
        x += ch === ' ' ? 3 : 4;
    }
}
const hdF1_textW = txt => [...txt].reduce((w, ch) => w + (ch === ' ' ? 3 : 4), 0) - 1;
/* a picture frame: the moulding lit on its top and left, a lip inside; returns the inner box [x, y, w, h] */
function hdF1_frame(s, mat, x, y, w, h, t, o) {
    o = o || {};
    const f = hdF1_box(s, mat, x, y, w, h, { layer: 2, R: Math.min(3, t * 0.6), grad: 0.15, cast: 2 }, o.r || 0);
    for (let i = x + 1; i < x + w - 1; i++) { hdF1_m(s, f, i, y + 1, 1); hdF1_m(s, f, i, y + h - t, -1); }
    for (let j = y + 1; j < y + h - 1; j++) { hdF1_m(s, f, x + 1, j, 1); hdF1_m(s, f, x + w - t, j, -1); }
    return [x + t, y + t, w - 2 * t, h - 2 * t, f];
}
/* paper (or a canvas) in a frame, a soft shade under the frame's top edge */
function hdF1_paper(s, hex, x, y, w, h) { const p = hdF1_box(s, hdF1_soft(hex), x, y, w, h, { layer: 1, flat: 1, grad: 0.12 }); hdF1_hl(s, p, x, x + w - 1, y, -1); return p; }
HD_SPR.f_art_supplies = {
    w: 48, h: 48, ax: 24, ay: 45,
    draw(s) {
        /* a paint box: pans of green and pink, a grey lid edge */
        const bx = hdF1_box(s, hdPal('#5a6270', '#98a2b0', '#c8d0dc', '#dce2ea', '#f0f4f8'), 27, 30, 18, 15, { layer: 1, R: 1.5, grad: 0.2 }, 1);
        for (const [y, c] of [[33, '#8cc152'], [39, '#ff9ec0']]) { const p = hdF1_box(s, hdRamp(c), 29, y, 13, 4, { layer: 2, R: 1.5, grad: 0.35 }, 1); hdF1_vl(s, p, 35, y, y + 3, -1); }
        /* brushes standing in a jar of water */
        const hd = s.add(hdPal('#5e3a1e', '#8e5e34', '#b07a4a', '#c8925e', '#dcaa74'), { layer: 1, R: 1, grad: 0 });
        for (const x of [15, 21, 25]) s.rect(hd, x, 9, 3, 18);
        for (const [x, c] of [[15, '#e0405a'], [21, '#4f86c6'], [25, '#ffd84a']]) { const t = s.add(hdRamp(c), { layer: 1.5, R: 1.5, grad: 0.3 }); s.poly(t, [[x, 9], [x + 3, 9], [x + 3, 5], [x + 1.5, 2], [x, 5]]); }
        const jr = s.add(HDF1_GLASS, { layer: 3, flat: 1, grad: 0.2 });
        hdF1_rr(s, jr, 9, 24, 18, 21, 2);
        const wt = hdPal('#3a7898', '#6ab4d4', '#9fd8ef', '#c0e6f6', '#e6f8ff');
        hdF1_later(s, () => s.each(jr, (x, y) => { if (y >= 30) s.recolor(x, y, wt); }));
        hdF1_vl(s, jr, 11, 26, 42, 2); hdF1_vl(s, jr, 12, 26, 42, 1); hdF1_hl(s, jr, 10, 25, 30, 1);
        hdF1_box(s, hdPal('#3e7a90', '#5a9ab0', '#6fb3c9', '#8ac4d6', '#a8d6e4'), 9, 42, 18, 3, { layer: 3.5, R: 1, grad: 0 }, 1);
        hdF1_fin(s);
    },
};
HD_SPR.f_birthday_cake = {
    w: 48, h: 48, ax: 24, ay: 45,
    draw(s) {
        const pl = s.add(hdF1_soft('#f7f3ea'), { layer: 1, R: 2, grad: 0.2 });
        s.ellipse(pl, 24, 38, 21, 4.5);
        const ck = hdF1_box(s, hdF1_soft('#fff4dc'), 9, 18, 30, 19, { layer: 2, R: 3, grad: 0.2 }, 2);
        hdF1_hl(s, ck, 10, 37, 34, -1);
        /* pink frosting on top, running down in drips */
        const fr = s.add(hdPal('#b0507a', '#f07aa8', '#ff9ec0', '#ffbcd4', '#ffdce8'), { layer: 3, R: 3, grad: 0.35, cast: 2 });
        s.rect(fr, 9, 17, 30, 6); for (const [x, d] of [[11, 4], [16, 6], [21, 3], [26, 7], [31, 4], [35, 5]]) { s.rect(fr, x, 22, 3, d); s.ellipse(fr, x + 1.5, 22 + d, 1.5, 1.2); }
        for (const x of [18, 27, 36]) {
            const cd = s.add(hdPal('#1c6a88', '#3aa6c4', '#4ec3d9', '#7ad4e6', '#b0eaf4'), { layer: 4, R: 1, grad: 0 });
            s.rect(cd, x - 1, 6, 3, 12);
            for (let y = 7; y < 17; y += 3) s.px(x - 1, y, '#ffffff');
            const fl = s.add(hdPal('#c87a14', '#f2a830', '#ffd84a', '#ffec90', '#fffbe0'), { layer: 5, R: 1.5, grad: -0.4 });
            s.ellipse(fl, x + 0.5, 3, 1.6, 2.6);
        }
        hdF1_drop(s, fr, 2);
        hdF1_fin(s);
    },
};
HD_SPR.f_bonsai = {
    w: 48, h: 48, ax: 24, ay: 45,
    draw(s) {
        const pot = s.add(hdPal('#24365a', '#34508a', '#4a6aa0', '#6484b4', '#86a2c8'), { layer: 1, R: 2.5, grad: 0.2 });
        s.poly(pot, [[12, 33], [42, 33], [40, 44], [14, 44]]);
        const rim = hdF1_box(s, hdPal('#24365a', '#34508a', '#4a6aa0', '#6484b4', '#86a2c8'), 11, 30, 32, 4, { layer: 2, R: 1.5, grad: 0.4 }, 1);
        hdF1_hl(s, pot, 14, 39, 40, -1);
        /* a twisted trunk, then cloud-pruned pads of needles */
        const tr = s.add(hdPal('#3a2214', '#5e3c22', '#7a5234', '#946a48', '#aa825c'), { layer: 3, R: 2, grad: 0.1 });
        s.line(tr, 25, 31, 20, 26, 2.4, 1.8); s.line(tr, 20, 26, 23, 21, 1.8, 1.5); s.line(tr, 23, 21, 29, 17, 1.5, 1.2); s.line(tr, 21, 23, 14, 18, 1.2, 0.9);
        const pads = [[21, 11, 13, 7], [34, 8, 10, 6], [10, 14, 9, 6], [30, 15, 10, 5]];
        for (const [x, y, rx, ry] of pads) { const p = s.add(hdPal('#163e1a', '#2a6a2c', '#3f8f3a', '#5aa850', '#7cc46a'), { layer: 4 + y * 0.01, R: 5, grad: 0.4 }); s.ellipse(p, x, y, rx, ry); hdF1_leaves(s, p, x - rx, y - ry, rx * 2 + 1, ry * 2 + 1, x * 7 + y, 3); }
        hdF1_fin(s);
    },
};
HD_SPR.f_boston_sign = {
    w: 48, h: 48, ax: 24, ay: 45,
    draw(s) {
        const st = s.add(hdPal('#4a443a', '#6e665a', '#8a8070', '#a89e8e', '#c4bcae'), { layer: 1, R: 1.5, grad: 0 });
        s.rect(st, 3, 1, 6, 44); s.ellipse(st, 6, 1.5, 3, 2);
        /* the pennant: felt, a stitched band by the stick, BOSTON in white */
        const pn = s.add(hdPal('#5a0e1c', '#8a1a2c', '#b3263a', '#c8404e', '#da6068'), { layer: 2, R: 3, grad: 0.15 });
        s.poly(pn, [[9, 4], [48, 6.5], [48, 8.5], [9, 33]]);
        const band = hdF1_ramp('#ffffff');
        hdF1_later(s, () => s.each(pn, (x, y) => { if (x < 12) s.recolor(x, y, band); }));
        hdF1_text(s, 'BOSTON', 14, 11, '#ffffff', '#7a1424');
        for (let x = 14; x < 30; x++) s.px(x, 18, x % 2 ? '#ffffff' : '#f0c8cc');
        hdF1_vl(s, st, 4, 2, 43, 1);
        hdF1_fin(s);
    },
};
HD_SPR.f_cake_stand = {
    w: 48, h: 48, ax: 24, ay: 45,
    draw(s) {
        const por = hdF1_soft('#f0e8da');
        const ft = s.add(por, { layer: 1, R: 2, grad: 0.3 }); s.ellipse(ft, 24, 41.5, 12, 3.5); s.rect(ft, 13, 39, 22, 3);
        const sm = s.add(por, { layer: 1.5, R: 2, grad: 0 }); s.poly(sm, [[21, 30], [27, 30], [26, 39], [22, 39]]);
        const pl = s.add(por, { layer: 2, R: 2, grad: 0.2 }); s.ellipse(pl, 24, 27, 21, 4.5);
        const ck = hdF1_box(s, hdF1_soft('#fff4dc'), 12, 13, 24, 13, { layer: 3, R: 2.5, grad: 0.2 }, 2);
        for (let x = 13; x < 35; x++) { hdF1_m(s, ck, x, 19, -1); hdF1_m(s, ck, x, 20, 1); }
        const tp = s.add(hdPal('#b0507a', '#f07aa8', '#ff9ec0', '#ffbcd4', '#ffdce8'), { layer: 4, R: 3, grad: 0.35, cast: 2 });
        hdF1_rr(s, tp, 12, 10, 24, 7, 2); for (const x of [15, 22, 29]) s.ellipse(tp, x + 1, 17, 1.5, 1.5);
        const ch = s.add(hdPal('#6a0c18', '#a81828', '#d8283f', '#f05060', '#ff9aa0'), { layer: 5, R: 2.5, grad: 0.4, bias: 0.04 }); s.ellipse(ch, 27, 8, 3, 3);
        s.px(26, 6, '#ffd0d4'); s.line(s.add(hdPal('#2a4a1a', '#3e6a28', '#4e8a34', '#66a448', '#80bc5c'), { layer: 4.5, R: 1, grad: 0 }), 28, 6, 30, 2, 0.5);
        hdF1_drop(s, tp, 2);
        hdF1_fin(s);
    },
};
HD_SPR.f_choc_fountain = {
    w: 48, h: 48, ax: 24, ay: 45,
    draw(s) {
        const bs = s.add(HDF1_STEEL, { layer: 1, R: 3, grad: 0.3 }); s.poly(bs, [[3, 36], [46, 36], [42, 44], [7, 44]]); s.ellipse(bs, 24.5, 37, 21.5, 3);
        const pool = s.add(hdPal('#3a1c0e', '#4e2a16', '#6e3f25', '#8a5030', '#a8683e'), { layer: 2, flat: 1, grad: 0.2 }); s.ellipse(pool, 24.5, 37, 18, 2);
        const sp = s.add(HDF1_STEEL, { layer: 1.5, R: 2, grad: 0 }); s.rect(sp, 23, 6, 7, 30);
        hdF1_vl(s, sp, 24, 7, 34, 2);
        /* three tiers, chocolate running down between them in two streams, lighter where it catches the light */
        const choc = hdPal('#2e160a', '#4e2a16', '#6e3f25', '#8a5030', '#a8683e'), st = hdPal('#4e2a16', '#6e3f25', '#8a5030', '#a8683e', '#c4844e');
        const tiers = [[18, 30, 3, 9], [12, 41, 18, 6], [9, 44, 30, 6]];
        tiers.forEach(([x0, x1, y, h], i) => {
            const t = s.add(choc, { layer: 3 + i * 0.1, R: 3, grad: 0.35, cast: 1 });
            if (i === 0) { s.ellipse(t, 24.5, y + 5, 6.5, 5); s.rect(t, x0, y + 5, x1 - x0, 4); } else s.poly(t, [[x0 + 3, y], [x1 - 3, y], [x1, y + h], [x0, y + h]]);
            for (let x = x0 + 2; x < x1 - 1; x += 3) { s.plot(t, x, y + h); if (hdF1_h(x, y, 3) > 0.5) s.plot(t, x, y + h + 1); }
            hdF1_hl(s, t, x0 + 3, x1 - 4, y + 1, 1);
        });
        for (const x of [21, 33]) { const f = s.add(st, { layer: 2.5, R: 1, grad: 0 }); s.rect(f, x, 12, 3, 24); }
        hdF1_fin(s);
    },
};
HD_SPR.f_clock_wall = {
    w: 48, h: 48, ax: 24, ay: 45,
    draw(s) {
        const rim = s.add(hdPal('#4e2e14', '#8a5c34', '#b98552', '#d0a070', '#e2b888'), { layer: 1, R: 4, grad: 0.25, k: 1.2 });
        s.ellipse(rim, 24, 24, 21, 20.5);
        const fc = s.add(hdF1_soft('#fff7f1'), { layer: 2, R: 6, grad: 0.15, bias: 0.02 });
        s.ellipse(fc, 24, 24, 16.5, 16);
        hdF1_later(s, () => s.each(fc, (x, y) => { const d = Math.hypot(x + 0.5 - 24, y + 0.5 - 24); if (d > 15) s.mod(x, y, -1); }));
        /* the hour marks, longer at twelve, three, six and nine */
        const mark = (a, r) => s.px(Math.round(24 + Math.sin(a) * r - 0.5), Math.round(24 - Math.cos(a) * r - 0.5), '#8a7a7a');
        for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; mark(a, k % 3 ? 13.5 : 13); if (!(k % 3)) mark(a, 12); }
        /* the hands at three o'clock */
        for (let y = 12; y < 24; y++) { s.px(23, y, '#3b2a45'); if (y > 15) s.px(24, y, '#3b2a45'); }
        for (let x = 23; x < 33; x++) { s.px(x, 23, '#3b2a45'); s.px(x, 24, x < 31 ? '#3b2a45' : '#5a4a64'); }
        s.px(23, 23, '#e0405a'); s.px(24, 23, '#e0405a'); s.px(23, 24, '#a82838'); s.px(24, 24, '#e0405a');
        hdF1_fin(s);
    },
};
HD_SPR.f_coffee_maker = {
    w: 48, h: 48, ax: 24, ay: 45,
    draw(s) {
        const dk = hdPal('#16181f', '#262935', '#3b3f52', '#545a70', '#70778e');
        const bd = s.add(dk, { layer: 1, R: 3, grad: 0.2 });
        hdF1_rr(s, bd, 12, 3, 24, 40, 3);
        const lid = hdF1_box(s, dk, 12, 3, 24, 8, { layer: 2, R: 2.5, grad: 0.4, cast: 2 }, 3);
        hdF1_hl(s, lid, 14, 33, 5, 1);
        /* the red power light */
        s.px(32, 13, '#ff8a9a'); s.px(33, 13, '#e0405a'); s.px(32, 14, '#e0405a'); s.px(33, 14, '#a82838');
        /* the glass pot of coffee on its warming plate, under the drip */
        const nk = hdF1_box(s, HDF1_STEEL, 18, 23, 15, 4, { layer: 2, R: 1.5, grad: 0.3 }, 1);
        const pt = s.add(hdPal('#4e5a68', '#8a96a8', '#b4c0d0', '#d2dce8', '#f0f6fc'), { layer: 3, flat: 1, grad: 0.2 });
        hdF1_rr(s, pt, 18, 26, 15, 13, 3);
        const cf = hdPal('#2a160c', '#4a2a16', '#6b3f25', '#84522e', '#9e683c');
        hdF1_later(s, () => s.each(pt, (x, y) => { if (y >= 31) s.recolor(x, y, cf); }));
        hdF1_vl(s, pt, 20, 28, 37, 2);
        const hn = s.add(dk, { layer: 3.5, R: 1, grad: 0 }); s.rect(hn, 33, 28, 3, 2); s.rect(hn, 34, 28, 2, 8); s.rect(hn, 33, 34, 3, 2);
        const pl = hdF1_box(s, dk, 15, 39, 21, 4, { layer: 2.5, R: 1.5, grad: 0.3 }, 1);
        hdF1_drop(s, lid, 2);
        hdF1_fin(s);
    },
};
HD_SPR.f_contract_frame = {
    w: 48, h: 48, ax: 24, ay: 45,
    draw(s) {
        const [x, y, w, h] = hdF1_frame(s, hdPal('#0e0c12', '#1c1a22', '#2d2a33', '#46424e', '#5e5a68'), 0, 0, 48, 48, 5);
        hdF1_paper(s, '#fff7f1', x, y, w, h);
        for (let i = 12; i < 36; i++) { s.px(i, 12, '#3b2a45'); if (i % 4 !== 3) s.px(i, 13, '#5a4a64'); }
        hdF1_write(s, 11, 18, 26, 2, 6, '#c9b8a8', 3); hdF1_write(s, 11, 21, 24, 1, 6, '#d8cabc', 4);
        /* two signatures, one in blue ink and one in red */
        for (let i = 0; i < 11; i++) { s.px(10 + i, 34 - Math.round(Math.sin(i * 0.9) * 1.5 + (i > 6 ? 1 : 0)), '#3b4a8a'); s.px(25 + i, 32 + Math.round(Math.sin(i * 1.1 + 1) * 1.6), '#b3263a'); }
        for (let i = 0; i < 9; i++) { s.px(11 + i, 37, '#c9b8a8'); s.px(26 + i, 37, '#c9b8a8'); }
        hdF1_fin(s);
    },
};
HD_SPR.f_cookie_jar = {
    w: 48, h: 48, ax: 24, ay: 45,
    draw(s) {
        const jr = s.add(HDF1_GLASS, { layer: 1, flat: 1, grad: 0.25 });
        hdF1_rr(s, jr, 9, 15, 30, 30, 4);
        /* fortune cookies heaped inside: folded crescents, golden with a darker fold */
        const ck = hdPal('#8a5a1a', '#c48a30', '#f2c262', '#f8d68a', '#fde8b0');
        const cks = [[15, 38], [24, 39], [32, 37], [18, 31], [28, 31], [22, 25], [33, 27], [13, 26]];
        for (const [cx, cy] of cks) { const c = s.add(ck, { layer: 2, R: 2.5, grad: 0.35 }); s.ellipse(c, cx, cy, 4.5, 3); s.ellipse(c, cx + 1, cy + 2, 3.5, 1.5); hdF1_m(s, c, cx, cy + 1, -2); hdF1_m(s, c, cx + 1, cy + 1, -1); }
        hdF1_later(s, () => { for (const [cx, cy] of cks) s.mod(cx - 2, cy - 2, 1); });
        const gl = s.add(hdPal('#9ac0d0', '#dff2fa', '#eef9fd', '#ffffff', '#ffffff'), { layer: 3, flat: 1, grad: 0 });
        s.rect(gl, 12, 18, 2, 22); s.rect(gl, 15, 20, 1, 6);
        const lid = s.add(hdPal('#5a3a10', '#8a5a1e', '#b8782a', '#d49a3a', '#e8b860'), { layer: 4, R: 3, grad: 0.35, cast: 2 });
        hdF1_rr(s, lid, 10, 6, 28, 9, 3);
        const kn = s.add(hdPal('#5a3a10', '#8a5a1e', '#b8782a', '#d49a3a', '#e8b860'), { layer: 5, R: 2, grad: 0.4 }); s.ellipse(kn, 24, 4, 5, 2.8);
        hdF1_drop(s, lid, 2);
        hdF1_fin(s);
    },
};
HD_SPR.f_diploma = {
    w: 48, h: 48, ax: 24, ay: 45,
    draw(s) {
        const [x, y, w, h] = hdF1_frame(s, hdPal('#3e2410', '#62401e', '#8a5a33', '#a0703e', '#b88650'), 0, 3, 48, 39, 5);
        hdF1_paper(s, '#fff7f1', x, y, w, h);
        for (let i = 12; i < 36; i++) { s.px(i, 15, '#b3263a'); if (i > 13 && i < 34) s.px(i, 16, '#d0505e'); }
        hdF1_write(s, 12, 24, 18, 2, 3, '#c9a47a', 5);
        /* the red seal with its ribbon tails */
        const sl = s.add(hdPal('#701626', '#b02a40', '#e0405a', '#f06a7e', '#ff98a6'), { layer: 3, R: 2, grad: 0.3 });
        s.ellipse(sl, 34.5, 31.5, 3.5, 3.5); s.poly(sl, [[32, 33], [34, 33], [33, 37], [31, 36]]); s.poly(sl, [[35, 33], [37, 33], [38, 36], [36, 37]]);
        hdF1_fin(s);
    },
};
HD_SPR.f_disco_ball = {
    w: 48, h: 48, ax: 24, ay: 45,
    draw(s) {
        const ch = s.add(hdPal('#4a443a', '#6e665a', '#8a8070', '#a89e8e', '#c4bcae'), { layer: 1, R: 1, grad: 0 });
        for (let y = 0; y < 9; y++) s.rect(ch, 24 + (y % 3 === 1 ? 1 : 0), y, 2, 1);
        const cap = s.add(hdPal('#4a443a', '#6e665a', '#8a8070', '#a89e8e', '#c4bcae'), { layer: 3, R: 1.5, grad: 0.3 }); s.rect(cap, 21, 8, 6, 3);
        /* the ball: a grid of little mirrors, each its own shade, bright where they catch the light */
        const b = s.add(hdPal('#4e5868', '#8a96a8', '#c8d0e0', '#e4eaf4', '#ffffff'), { layer: 2, R: 12, grad: 0.3 });
        s.ellipse(b, 24, 28.5, 20, 18.5);
        hdF1_later(s, () => s.each(b, (x, y) => {
            const u = (x + 0.5 - 24) / 20, v = (y + 0.5 - 28.5) / 18.5, lon = Math.asin(Math.max(-1, Math.min(1, u / Math.sqrt(Math.max(0.05, 1 - v * v))))), lat = Math.asin(Math.max(-1, Math.min(1, v)));
            const i = Math.floor(lon / 0.26 + 20), j = Math.floor(lat / 0.24 + 20), fi = lon / 0.26 + 20 - i, fj = lat / 0.24 + 20 - j;
            if (fi < 0.16 || fj < 0.16) s.mod(x, y, -1);
            else { const r = hdF1_h(i, j, 9); if (r > 0.86) s.mod(x, y, 2); else if (r > 0.62) s.mod(x, y, 1); else if (r < 0.18) s.mod(x, y, -1); }
        }));
        for (const [x, y] of [[15, 20], [33, 34]]) { s.px(x, y, '#ffffff'); s.px(x - 1, y, '#e8f0ff'); s.px(x + 1, y, '#e8f0ff'); s.px(x, y - 1, '#e8f0ff'); s.px(x, y + 1, '#e8f0ff'); }
        hdF1_fin(s);
    },
};
HD_SPR.f_dnd_sign = {
    w: 48, h: 48, ax: 24, ay: 45,
    draw(s) {
        const cd = s.add(hdPal('#4a443a', '#6e665a', '#8a8070', '#a89e8e', '#c4bcae'), { layer: 1, R: 1, grad: 0 });
        s.line(cd, 24, 1, 12, 7, 0.8); s.line(cd, 24, 1, 36, 7, 0.8); s.ellipse(cd, 24, 1.5, 2.5, 2);
        const bd = s.add(hdPal('#701626', '#b02a40', '#e0405a', '#ea6276', '#f48a9a'), { layer: 2, R: 3, grad: 0.2 });
        hdF1_rr(s, bd, 0, 6, 48, 36, 5);
        hdF1_box(s, hdPal('#701626', '#b02a40', '#d03850', '#e05468', '#ea6a7c'), 4, 10, 40, 28, { layer: 1.5, flat: 1, grad: 0 }, 3);
        hdF1_later(s, () => { for (let x = 5; x < 43; x++) { s.mod(x, 11, -1); s.mod(x, 37, 1); } });
        hdF1_text(s, 'DO NOT', 24 - (hdF1_textW('DO NOT') >> 1), 16, '#ffffff', '#8a1a2c');
        hdF1_text(s, 'DISTURB', 24 - (hdF1_textW('DISTURB') >> 1), 25, '#ffffff', '#8a1a2c');
        hdF1_fin(s);
    },
};
HD_SPR.f_firework_poster = {
    w: 48, h: 48, ax: 24, ay: 45,
    draw(s) {
        const pp = hdF1_box(s, hdPal('#0c1028', '#141a38', '#1e2447', '#2a3058', '#363e6a'), 0, 0, 48, 48, { layer: 1, flat: 1, grad: 0 });
        hdF1_hl(s, pp, 1, 46, 1, 1); hdF1_hl(s, pp, 1, 46, 46, -1);
        /* a burst: streaks of sparks flying out from the middle, in cyan, pink, yellow and white */
        const cols = ['#4ec3d9', '#ff5aa8', '#ffd84a', '#ff5aa8', '#4ec3d9', '#ffd84a', '#ffffff', '#ff5aa8', '#4ec3d9', '#ffd84a', '#ff5aa8', '#4ec3d9'];
        for (let k = 0; k < 12; k++) {
            const a = k / 12 * Math.PI * 2 + 0.2, c = cols[k], dim = hdF1_mix(c, '#1e2447', 0.35);
            for (let r = 5; r < 17; r++) { const x = Math.round(24 + Math.cos(a) * r), y = Math.round(22 + Math.sin(a) * r * 0.95); if (r < 9) { if (r % 2) s.px(x, y, dim); } else s.px(x, y, r > 14 ? c : dim); }
            const x = Math.round(24 + Math.cos(a) * 17), y = Math.round(22 + Math.sin(a) * 16);
            s.px(x, y, c); s.px(x + 1, y, c); s.px(x, y + 1, c); s.px(x + 1, y + 1, c); s.px(x, y, hdF1_mix(c, '#ffffff', 0.5));
        }
        s.px(24, 22, '#ffffff'); s.px(23, 22, '#fff4c0'); s.px(25, 22, '#fff4c0'); s.px(24, 21, '#fff4c0'); s.px(24, 23, '#fff4c0');
        for (const [x, y] of [[6, 7], [41, 9], [8, 40], [40, 41], [33, 4], [4, 28]]) s.px(x, y, '#8a90b8');
        hdF1_fin(s);
    },
};
HD_SPR.f_framed_poem = {
    w: 48, h: 48, ax: 24, ay: 45,
    draw(s) {
        const [x, y, w, h] = hdF1_frame(s, hdPal('#6a4a1e', '#a88440', '#c9a462', '#dcbc80', '#ecd4a0'), 0, 0, 48, 48, 5);
        hdF1_paper(s, '#fff7f1', x, y, w, h);
        /* four lines of handwriting, the last a little short, and a small red heart */
        for (const [ly, lw, sd] of [[13, 21, 1], [19, 24, 2], [25, 18, 3], [31, 21, 4]]) for (let i = 0; i < lw; i++) {
            const dy = Math.round(Math.sin(i * 1.3 + sd) * 0.6);
            if (hdF1_h(i, ly, sd) > 0.15) s.px(12 + i, ly + dy, '#8a7a9a');
            if (hdF1_h(i, ly, sd + 9) > 0.7) s.px(12 + i, ly + dy - 1, '#b0a4bc');
        }
        hdF1_dots(s, [[33, 34], [35, 34], [32, 35], [33, 35], [34, 35], [35, 35], [36, 35], [33, 36], [34, 36], [35, 36], [34, 37]], '#e0405a');
        s.px(33, 35, '#ff8a9a');
        hdF1_fin(s);
    },
};
HD_SPR.f_globe = {
    w: 48, h: 48, ax: 24, ay: 45,
    draw(s) {
        const ft = s.add(hdPal('#3e2410', '#62401e', '#8a5a33', '#a0703e', '#b88650'), { layer: 1, R: 2, grad: 0.3 });
        hdF1_rr(s, ft, 12, 41, 24, 5, 2); s.rect(ft, 21, 35, 6, 7);
        /* the globe: blue seas, green land, lit from the upper left */
        const gb = s.add(hdPal('#1e3a6a', '#3a6aa8', '#4f86c6', '#72a2d6', '#a0c4e8'), { layer: 2, R: 14, grad: 0.2 });
        s.ellipse(gb, 24, 19.5, 18, 17);
        const land = hdPal('#2a5a1e', '#5a9a3a', '#8cc152', '#a8d474', '#c4e49a');
        const lands = [[15, 17, 7, 6], [12, 13, 4, 4], [19, 22, 3, 3], [30, 28, 6, 4.5], [33, 24, 3, 3], [27, 31, 3, 2.5], [33, 9, 4, 2.5]];
        hdF1_later(s, () => s.each(gb, (x, y) => { for (const [cx, cy, rx, ry] of lands) { const wob = 1 + (hdF1_h(x >> 1, y >> 1, 61) - 0.5) * 0.4, u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry; if (u * u + v * v < wob) { s.recolor(x, y, land); break; } } }));
        hdF1_fin(s);
    },
};
HD_SPR.f_gossip_phone = {
    w: 48, h: 48, ax: 24, ay: 45,
    draw(s) {
        const pk = hdPal('#b0507a', '#f07aa8', '#ff9ec0', '#ffbcd4', '#ffdce8');
        const bd = s.add(pk, { layer: 1, R: 5, grad: 0.25 });
        s.poly(bd, [[12, 15], [36, 15], [38, 24], [40, 40], [38, 42], [10, 42], [8, 40], [10, 24]]);
        /* the dial: three rows of white buttons */
        for (const y of [27, 33]) for (const x of [14, 22, 30]) { const b = s.add(hdF1_ramp('#ffffff'), { layer: 2, R: 1.5, grad: 0.3 }); hdF1_rr(s, b, x, y, 5, 4, 1); }
        const cr = s.add(hdPal('#9a4a6e', '#d86a98', '#f07aa8', '#f698c0', '#ffbcd4'), { layer: 1.5, R: 1, grad: 0 }); s.rect(cr, 16, 15, 16, 4);
        /* the handset resting on top: an earpiece and a mouthpiece joined by the grip */
        const hs = s.add(hdPal('#9a3e68', '#d0608e', '#f07aa8', '#f698c0', '#ffbcd4'), { layer: 3, R: 3, grad: 0.4, cast: 2 });
        hdF1_rr(s, hs, 3, 6, 42, 8, 3); hdF1_rr(s, hs, 3, 6, 11, 12, 4); hdF1_rr(s, hs, 34, 6, 11, 12, 4);
        hdF1_hl(s, hs, 8, 40, 8, 1);
        hdF1_drop(s, hs, 2);
        hdF1_fin(s);
    },
};
HD_SPR.f_heart_lamp = {
    w: 48, h: 48, ax: 24, ay: 45,
    draw(s) {
        const st = s.add(hdPal('#2a1c16', '#4a3428', '#6b4a3a', '#84604c', '#9c7660'), { layer: 1, R: 2, grad: 0.1 });
        s.rect(st, 21, 30, 6, 13); s.ellipse(st, 24, 43.5, 6, 2.5);
        /* the heart-shaped shade, glowing pink */
        const hs = s.add(hdPal('#b02a56', '#f0507a', '#ff6a8a', '#ff98b0', '#ffc8d6'), { layer: 2, R: 9, grad: 0.3, bias: 0.05 });
        s.ellipse(hs, 16, 13, 10.5, 10); s.ellipse(hs, 32, 13, 10.5, 10);
        s.poly(hs, [[6, 15], [42, 15], [36, 24], [27, 31], [21, 31], [12, 24]]);
        hdF1_m(s, hs, 24, 5, -1); hdF1_m(s, hs, 24, 6, -1);
        for (const [x, y] of [[12, 9], [13, 9], [11, 10], [12, 10]]) s.px(x, y, '#ffe4ec');
        hdF1_fin(s);
    },
};

/* ---------------------------------------------------------------- paintings and things on the back wall */
/* a carved frame (gilt or wood): a bright bead along the outside, a groove, a shaded lip round the picture */
function hdF1_gilt(s, mat, x, y, w, h) {
    const f = hdF1_box(s, mat, x, y, w, h, { layer: 2, R: 2, grad: 0.15 });
    const ring = (d, v) => { for (let i = x + d; i < x + w - d; i++) { hdF1_m(s, f, i, y + d, v); hdF1_m(s, f, i, y + h - 1 - d, v); } for (let j = y + d + 1; j < y + h - 1 - d; j++) { hdF1_m(s, f, x + d, j, v); hdF1_m(s, f, x + w - 1 - d, j, v); } };
    ring(1, 1); ring(2, 1); ring(4, -1); ring(7, 1); ring(9, -1); ring(10, -1);
    return f;
}
/* paint a picture onto a canvas part: fn(x, y) gives a color (or nothing), with a faint brush texture */
function hdF1_paint(s, id, fn, seed) {
    const cache = new Map();
    hdF1_later(s, () => s.each(id, (x, y) => {
        const c = fn(x, y);
        if (c) { let m = cache.get(c); if (!m) { m = hdF1_soft(c); cache.set(c, m); } s.recolor(x, y, m); }
        const r = hdF1_h(Math.floor((x + (y % 3) * 2) / 5), y, seed || 1);
        if (r > 0.95) s.mod(x, y, 1); else if (r < 0.03) s.mod(x, y, -1);
    }));
}
/* the canvas inside a frame, shaded along the frame's top and left */
function hdF1_canvas(s, x, y, w, h) {
    const c = hdF1_box(s, hdPal('#3a2e40', '#7a6e80', '#b0a8b0', '#c8c0c8', '#e0dce0'), x, y, w, h, { layer: 1, flat: 1, grad: 0 });
    hdF1_later(s, () => { for (let i = x; i < x + w; i++) { s.mod(i, y, -1); s.mod(i, y + 1, -1); } for (let j = y; j < y + h; j++) s.mod(x, j, -1); });
    return c;
}
HD_SPR.f_art_goat = {
    w: 96, h: 78, ax: 48, ay: 75,
    draw(s) {
        hdF1_gilt(s, HDF1_GOLD, 0, 0, 96, 78);
        const cv = hdF1_canvas(s, 12, 12, 72, 54);
        /* a white goat looking out of a lilac glow on purple, dark purple along the bottom */
        hdF1_paint(s, cv, (x, y) => {
            if (y >= 60) return '#6b3fa0';
            const fx = (x - 48.5) / 13, fy = (y - 42) / 15, face = fx * fx * (1 + Math.max(0, fy) * 0.6) + fy * fy < 1, glow = Math.hypot((x - 48) / 26, (y - 38) / 23);
            if ((Math.hypot((x - 33) / 6.5, (y - 34) / 3.4) < 1 || Math.hypot((x - 64) / 6.5, (y - 34) / 3.4) < 1)) return y > 35 ? '#d8d0c4' : '#ece6dc';
            if (face) return y > 50 && Math.abs(x - 48.5) < 5 && y < 54 ? '#f2a6a6' : x > 54 && y > 42 ? '#e6e0d6' : '#f4f1ea';
            if (glow < 1) return glow > 0.86 && hdF1_h(x >> 1, y >> 1, 5) > 0.5 ? '#9a6ac4' : '#a87ad0';
            return '#8a5ab8';
        }, 3);
        for (const [x, y] of [[42, 40], [43, 40], [42, 41], [43, 41], [54, 40], [55, 40], [54, 41], [55, 41]]) s.px(x, y, '#231418');
        s.px(43, 40, '#6a5a60'); s.px(55, 40, '#6a5a60');
        /* the horns, curling back */
        for (const sd of [-1, 1]) for (let i = 0; i < 9; i++) { const x = 48.5 + sd * (6 + i * 0.6), y = 28 - i * 0.9 + (i > 6 ? (i - 6) * 1.2 : 0); s.px(Math.round(x), Math.round(y), '#9a8a70'); s.px(Math.round(x + sd), Math.round(y), i < 5 ? '#b8a688' : '#9a8a70'); }
        hdF1_fin(s);
    },
};
HD_SPR.f_art_seaside = {
    w: 96, h: 78, ax: 48, ay: 75,
    draw(s) {
        hdF1_gilt(s, hdPal('#3e2410', '#6a421e', '#8a5a33', '#b07a4a', '#d9a46a'), 0, 0, 96, 78);
        const cv = hdF1_canvas(s, 12, 12, 72, 54);
        /* a sunset over the sea, a little red sailboat, the sun's path on the water, the sand */
        const sky = ['#ffd1a0', '#ffc090', '#ffb080', '#ff9ec0', '#e8a0c8', '#c8a8e0', '#a8c0f0'];
        hdF1_paint(s, cv, (x, y) => {
            const sun = Math.hypot(x - 63, y - 32) < 9;
            if (y < 33) { if (sun) return y < 26 ? '#fff6d0' : '#fff1b8'; const t = (y - 12) / 3, i = Math.floor(t), f = t - i; return sky[Math.min(6, i + (f > 0.67 && (x + y) % 2 ? 1 : 0))]; }
            if (y < 54) {
                if (y < 50 && (y % 2 === 0) && ((x + y) % 4 < 3) && Math.abs(x - 63) < 8 - (y - 33) * 0.25) return '#fff1b8';
                const band = Math.floor((y - 33) / 3), wave = (x + band * 7) % 13 < 2 && y % 3 === 0;
                return wave ? '#c4ecfc' : y < 39 ? '#9fd8ef' : band % 2 ? '#4ec3d9' : '#4f86c6';
            }
            if (y < 57) return (x + (y % 2) * 3) % 6 < 4 ? '#ffffff' : '#e8f6fc';
            return hdF1_h(x, y, 4) > 0.94 ? '#e0c890' : '#f3dea6';
        }, 5);
        /* the boat: a red hull, a white sail on a brown mast */
        const hl = hdPal('#6a1810', '#9a2a1e', '#c0392b', '#d85a48', '#e88070');
        for (let y = 42; y < 47; y++) for (let x = 24 + (y - 42) * 0.6; x < 42 - (y - 42) * 0.6; x++) s.px(Math.round(x), y, hl[y === 42 ? 3 : y > 45 ? 1 : 2]);
        for (let y = 30; y < 42; y++) s.px(31, y, '#6b4225');
        for (let y = 31; y < 41; y++) for (let x = 32; x < 32 + (y - 30) * 0.7; x++) s.px(x, y, x === 32 ? '#e8e8f0' : '#ffffff');
        for (let x = 22; x < 44; x++) if (x % 3) s.px(x, 47, '#c4ecfc');
        hdF1_fin(s);
    },
};
HD_SPR.f_art_stilllife = {
    w: 96, h: 78, ax: 48, ay: 75,
    draw(s) {
        hdF1_gilt(s, HDF1_GOLD, 0, 0, 96, 78);
        const cv = hdF1_canvas(s, 12, 12, 72, 54);
        /* a clementine, an apple and grapes in a blue bowl on a wooden table, cream wall behind */
        const ball = (x, y, cx, cy, r) => { const u = (x - cx) / r, v = (y - cy) / r, d = u * u + v * v; return d < 1 ? (u + v < -0.7 ? 3 : u + v > 0.55 ? 1 : 2) : 0; };
        hdF1_paint(s, cv, (x, y) => {
            if (y >= 51) return y < 54 ? '#b8855a' : '#9a6b45';
            if (y >= 45 && y < 51 && x >= 31 && x <= 69 - (y - 45)) return y < 47 ? '#9fc3e6' : '#4f86c6';
            if (y >= 43 && y < 51 && x >= 27 + (y - 43) && x <= 70) return y < 45 ? '#9fc3e6' : '#4f86c6';
            let k = ball(x, y, 41, 37, 8); if (k) return ['', '#d8781e', '#f7962d', '#ffc27a'][k];
            k = ball(x, y, 56, 37, 7.5); if (k) return ['', '#b8283a', '#e0405a', '#ff8a9a'][k];
            for (const [cx, cy] of [[66, 36], [69, 39], [66, 41], [71, 43], [68, 44], [63, 44]]) { k = ball(x, y, cx, cy, 2.6); if (k) return ['', '#5a2e80', '#8a5ab8', '#a87ad0'][k]; }
            if (x >= 39 && x <= 44 && y >= 27 && y <= 29) return '#3f8f45';
            if (x >= 56 && x <= 57 && y >= 27 && y <= 30) return '#6b4225';
            return y > 40 ? '#efd8b4' : '#f7e3c4';
        }, 7);
        hdF1_fin(s);
    },
};
HD_SPR.f_empty_frame = {
    w: 96, h: 78, ax: 48, ay: 75,
    draw(s) {
        hdF1_gilt(s, HDF1_GOLD, 3, 0, 90, 78);
        const m = hdF1_box(s, hdF1_soft('#f4efe6'), 15, 12, 66, 54, { layer: 1, flat: 1, grad: 0.1 });
        hdF1_hl(s, m, 15, 80, 12, -1); hdF1_hl(s, m, 15, 80, 13, -1); hdF1_vl(s, m, 15, 12, 65, -1);
        /* the hanging hooks' marks in the mat: a dotted border waiting for a picture */
        for (let x = 18; x < 79; x += 9) { s.px(x, 16, '#cfc6b8'); s.px(x + 1, 16, '#cfc6b8'); s.px(x, 61, '#cfc6b8'); s.px(x + 1, 61, '#cfc6b8'); }
        for (let y = 19; y < 60; y += 9) { s.px(18, y, '#cfc6b8'); s.px(18, y + 1, '#cfc6b8'); s.px(76, y, '#cfc6b8'); s.px(76, y + 1, '#cfc6b8'); }
        hdF1_fin(s);
    },
};
HD_SPR.f_gear_wall = {
    w: 96, h: 78, ax: 48, ay: 75,
    draw(s) {
        /* two wooden gears from the windmill: a big one and a small one meshed with it, spokes and an iron axle */
        const gear = (cx, cy, r, n, mat, L, seed) => {
            const g = s.add(mat, { layer: L, R: 3, grad: 0.25 });
            for (let y = Math.floor(cy - r - 4); y <= cy + r + 4; y++) for (let x = Math.floor(cx - r - 4); x <= cx + r + 4; x++) {
                const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy), a = Math.atan2(y + 0.5 - cy, x + 0.5 - cx) + seed, tooth = Math.cos(a * n) > -0.05;
                if (d < r - 1 || (tooth && d < r + 4.5)) s.plot(g, x, y);
            }
            for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
                const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy), a = Math.atan2(y + 0.5 - cy, x + 0.5 - cx) + seed;
                if (Math.abs(d - (r - 4)) < 0.7) hdF1_m(s, g, x, y, -1);
                else if (d < r - 5 && d > 4) { const sp = Math.abs(Math.sin(a * 2)) < 0.12; if (!sp && d > 6) hdF1_m(s, g, x, y, -1); if (!sp && d > 7 && d < r - 6) hdF1_m(s, g, x, y, -1); }
            }
            const ax = s.add(hdPal('#1e1a24', '#332e3a', '#4a4450', '#625c6a', '#7c7684'), { layer: L + 0.5, R: 2, grad: 0.3 });
            s.ellipse(ax, cx, cy, 3.5, 3.5);
            return g;
        };
        gear(76, 24, 16, 8, hdPal('#5a3a1a', '#9a7040', '#c99a62', '#d8ae7a', '#e8c494'), 1, 0.2);
        gear(33, 43, 28, 12, hdPal('#4e2e14', '#8a5c34', '#b98552', '#cc9a68', '#dcae7c'), 2, 0.1);
        hdF1_fin(s);
    },
};
HD_SPR.f_blackout_curtains = {
    w: 96, h: 48, ax: 48, ay: 45,
    draw(s) {
        /* two heavy navy curtains in deep folds, closed in the middle, on a wooden rod */
        const cu = hdPal('#141226', '#221e3a', '#2e2a4a', '#3a3660', '#48447a');
        for (const [x0, x1] of [[0, 47], [48, 96]]) {
            const c = s.add(cu, { layer: 1, flat: 1, grad: 0.15 });
            s.rect(c, x0, 5, x1 - x0, 43);
            hdF1_later(s, () => s.each(c, (x, y) => { const p = ((x - x0) % 12) / 12, v = Math.sin(p * Math.PI * 2); if (v > 0.55) s.mod(x, y, 1); else if (v < -0.6) s.mod(x, y, -1); if (Math.abs(p - 0.75) < 0.05) s.mod(x, y, -1); }));
            hdF1_vl(s, c, x0 === 0 ? 47 : 48, 5, 47, -1);
        }
        const rod = s.add(hdPal('#3a2a1c', '#56442e', '#6b5a4a', '#887460', '#a08c76'), { layer: 3, R: 2, grad: 0.3, cast: 2 });
        s.rect(rod, 0, 1, 96, 5);
        for (let x = 4; x < 96; x += 12) { const r = s.add(hdPal('#3a2a1c', '#56442e', '#6b5a4a', '#887460', '#a08c76'), { layer: 3.5, R: 1, grad: 0.3 }); s.rect(r, x, 0, 4, 7); }
        hdF1_drop(s, rod, 2);
        hdF1_fin(s);
    },
};
HD_SPR.f_chalkboard = {
    w: 96, h: 48, ax: 48, ay: 45,
    draw(s) {
        const fr = hdF1_box(s, hdPal('#3e2410', '#62401e', '#8a5a33', '#a0703e', '#b88650'), 0, 0, 96, 48, { layer: 2, R: 2, grad: 0.15 });
        hdF1_hl(s, fr, 1, 94, 1, 1); hdF1_vl(s, fr, 1, 1, 46, 1);
        const bd = hdF1_box(s, hdPal('#142218', '#1e3426', '#2f4a3a', '#3a5848', '#486858'), 6, 5, 84, 36, { layer: 1, flat: 1, grad: 0.1 });
        hdF1_hl(s, bd, 6, 89, 5, -1); hdF1_vl(s, bd, 6, 5, 40, -1);
        /* old chalk wiped round and round, then two lines of writing and a big chalk X */
        for (const [cx, cy, r] of [[30, 24, 14], [66, 20, 12]]) for (let a = 0; a < 6.28; a += 0.03) if (Math.sin(a * 3 + cx) > 0.2) hdF1_m(s, bd, cx + Math.cos(a) * r * 1.4, cy + Math.sin(a) * r * 0.5, 1);
        const ch = (x, y, c) => s.px(x, y, c || '#e8eef6');
        for (let x = 12; x < 33; x++) { if (hdF1_h(x, 1, 3) > 0.15) ch(x, 16); if (hdF1_h(x, 2, 3) > 0.6) ch(x, 17, '#a8b8b0'); }
        for (let x = 12; x < 45; x++) { if (hdF1_h(x, 3, 3) > 0.15) ch(x, 25); if (hdF1_h(x, 4, 3) > 0.6) ch(x, 26, '#a8b8b0'); }
        for (let i = 0; i <= 22; i++) {
            const t = i / 22, y = Math.round(15 + t * 16);
            ch(Math.round(55 + t * 24), y); ch(Math.round(79 - t * 24), y);
            if (i % 3) { ch(Math.round(56 + t * 24), y); ch(Math.round(78 - t * 24), y); }
        }
        /* the chalk tray with a stick of chalk */
        const tr = hdF1_box(s, hdPal('#3e2410', '#62401e', '#8a5a33', '#a0703e', '#b88650'), 3, 40, 90, 5, { layer: 3, R: 1.5, grad: 0.3, cast: 2 });
        const ck = hdF1_box(s, hdF1_soft('#f4f4f0'), 62, 38, 9, 3, { layer: 4, R: 1, grad: 0.3 });
        hdF1_drop(s, tr, 1);
        hdF1_fin(s);
    },
};
HD_SPR.f_chili_lights = {
    w: 96, h: 48, ax: 48, ay: 45,
    draw(s) {
        /* a green wire sagging between two hooks, red chili peppers hanging from it, glossy and lit */
        const wr = s.add(hdPal('#1a2a10', '#2e4220', '#3f5a2a', '#527236', '#668a44'), { layer: 1, R: 1, grad: 0 });
        const sag = x => 10 + Math.sin(Math.max(0, Math.min(1, (x - 15) / 66)) * Math.PI) * 2.5;
        for (let x = 0; x < 96; x++) { s.plot(wr, x, Math.round(sag(x))); s.plot(wr, x, Math.round(sag(x)) + 1); }
        s.rect(wr, 3, 7, 14, 3); s.rect(wr, 78, 7, 15, 3);
        for (let i = 0; i < 8; i++) {
            const x = 3 + i * 12, top = Math.round(sag(x + 4)) + 1, bend = i % 2 ? 1 : -1;
            const p = s.add(hdPal('#6a0e08', '#a81c14', '#e2382b', '#f2604a', '#ff9a84'), { layer: 2, R: 3, grad: 0.25 });
            s.poly(p, [[x, top + 2], [x + 8, top + 2], [x + 8, top + 8], [x + 6 + bend, top + 13], [x + 4 + bend * 2, top + 17], [x + 3 + bend, top + 15], [x + 1, top + 10]]);
            const cp = s.add(hdPal('#244a18', '#3a7a28', '#5aa844', '#76c058', '#94d470'), { layer: 3, R: 1.5, grad: 0.3 });
            hdF1_rr(s, cp, x, top, 9, 4, 1); s.rect(cp, x + 3, top - 2, 3, 3);
            s.px(x + 2, top + 5, '#ffd0c4'); s.px(x + 2, top + 6, '#ffb4a4'); s.px(x + 2, top + 7, '#ffb4a4');
        }
        hdF1_fin(s);
    },
};
HD_SPR.f_glaze_chart = {
    w: 96, h: 48, ax: 48, ay: 45,
    draw(s) {
        const pp = hdF1_box(s, hdF1_soft('#fff7f1'), 0, 0, 96, 48, { layer: 1, flat: 1, grad: 0.1 }, 1);
        hdF1_hl(s, pp, 1, 94, 1, 1);
        /* glazed test tiles in two rows: each a little glossy square with its name scribbled under it */
        const rows = [[9, ['#f4efe6', '#9fc3e6', '#2f5da8', '#8fc4a1', '#5c8a4a', '#e0784a']], [27, ['#f7a8c4', '#e0405a', '#ffd45a', '#b39ae0', '#3a3340', '#8a5a3a']]];
        for (const [y, cols] of rows) cols.forEach((c, i) => {
            const x = 6 + i * 15, t = s.add(hdF1_ramp(c), { layer: 2, R: 2, grad: 0.3, cast: 1 });
            hdF1_rr(s, t, x, y, 11, 12, 1);
            hdF1_m(s, t, x + 2, y + 2, 2); hdF1_m(s, t, x + 3, y + 2, 1); hdF1_m(s, t, x + 2, y + 3, 1);
            for (let k = 0; k < 7; k++) if (hdF1_h(k, i, y) > 0.25) s.px(x + 2 + k, y + 14, '#b8aaa0');
        });
        hdF1_dots(s, [[3, 3], [92, 3]], '#c9a47a');
        hdF1_fin(s);
    },
};

/* ---------------------------------------------------------------- sacks, hay and the rug */
/* a sack slumped on the floor: a round belly, the neck tied off at the top, a band of color across it */
function hdF1_sack(s, mat, x, y, w, h, o) {
    const sk = s.add(mat, { layer: o.layer, R: 9, grad: 0.3, k: 1.15 });
    s.poly(sk, [[x + w * 0.32, y + 4], [x + w * 0.68, y + 4], [x + w * 0.9, y + h * 0.3], [x + w, y + h * 0.55], [x + w, y + h - 3], [x + w - 3, y + h], [x + 3, y + h], [x, y + h - 3], [x, y + h * 0.55], [x + w * 0.1, y + h * 0.3]]);
    const cx = x + w / 2, nk = s.add(mat, { layer: o.layer + 0.2, R: 3, grad: 0.3 });
    s.poly(nk, [[cx - 6, y], [cx + 6, y], [cx + 4, y + 6], [cx - 4, y + 6]]); s.ellipse(nk, cx, y + 1, 6.5, 2.5);
    const tie = s.add(o.tie, { layer: o.layer + 0.3, R: 1, grad: 0.2 }); s.rect(tie, cx - 5, y + 5, 10, 3);
    /* creases running down from the tied neck */
    for (const [dx, len] of [[-7, 10], [6, 8], [-1, 6]]) for (let j = 0; j < len; j++) hdF1_m(s, sk, cx + dx + Math.round(dx * j * 0.06), y + 9 + j, -1);
    return sk;
}
HD_SPR.f_feed_sacks = {
    w: 96, h: 78, ax: 48, ay: 75,
    draw(s) {
        const bur = hdPal('#5e4628', '#a08458', '#c9a878', '#d8bc90', '#e6d0a8'), tie = hdPal('#3e2c18', '#6a5034', '#8a6a4a', '#a0805e', '#b89674');
        const band = hdPal('#244a18', '#3e7a28', '#5a9e3c', '#74b452', '#90c86c');
        const a = hdF1_sack(s, bur, 0, 27, 45, 48, { layer: 1, tie });
        const b = hdF1_sack(s, bur, 50, 27, 46, 48, { layer: 1.5, tie });
        const c = hdF1_sack(s, bur, 25, 3, 46, 45, { layer: 3, tie });
        /* burlap weave, and the green feed labels */
        for (const [id, x0, y0, w, h] of [[a, 0, 27, 45, 48], [b, 50, 27, 46, 48], [c, 25, 3, 46, 45]]) for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
            if ((x + y * 2) % 6 === 0 && y % 2 === 0 && hdF1_h(x, y, 7) > 0.5) hdF1_m(s, id, x, y, 1); else if (hdF1_h(x, y, 8) < 0.025) hdF1_m(s, id, x, y, -1);
        }
        for (const [id, x0, x1, y] of [[a, 6, 32, 51], [b, 59, 87, 51], [c, 31, 57, 30]]) for (let yy = y; yy < y + 6; yy++) for (let x = x0; x <= x1; x++) hdF1_rc(s, id, x, yy, band);
        hdF1_drop(s, c, 3);
        hdF1_fin(s);
    },
};
HD_SPR.f_flour_sacks = {
    w: 96, h: 78, ax: 48, ay: 75,
    draw(s) {
        const cl = hdPal('#8a8070', '#d8d0c0', '#f4efe6', '#fbf8f2', '#ffffff'), tie = hdPal('#5e5240', '#8a7c60', '#b8a888', '#ccbea0', '#ddd2b8');
        const blue = hdPal('#1e3a6a', '#3a6aa8', '#4f86c6', '#6c9cd6', '#8cb4e2');
        const a = hdF1_sack(s, cl, 0, 24, 45, 51, { layer: 1, tie });
        const b = hdF1_sack(s, cl, 50, 24, 46, 51, { layer: 1.5, tie });
        const c = hdF1_sack(s, cl, 24, 0, 48, 48, { layer: 3, tie });
        for (const [id, x0, x1, y] of [[a, 3, 40, 57], [b, 53, 92, 57], [c, 27, 69, 33]]) for (let x = x0; x <= x1; x++) { hdF1_rc(s, id, x, y, blue); hdF1_rc(s, id, x, y + 1, blue); }
        /* a sheaf of wheat stamped in gold on each */
        const wheat = (cx, cy) => {
            for (let j = 0; j < 14; j++) { s.px(cx, cy + j, '#c49a28'); s.px(cx + 1, cy + j, '#d4a52a'); }
            for (let k = 0; k < 4; k++) for (const sd of [-1, 1]) { const x = sd < 0 ? cx - 1 : cx + 2; s.px(x, cy + 1 + k * 2, '#d4a52a'); s.px(x + sd, cy + k * 2, '#e8c050'); s.px(x + sd, cy + 1 + k * 2, '#c49a28'); }
            s.px(cx, cy - 1, '#e8c050'); s.px(cx + 1, cy - 1, '#e8c050'); for (let i = -2; i < 4; i++) s.px(cx + i, cy + 9, '#a87e20');
        };
        wheat(48, 16); wheat(21, 39); wheat(73, 39);
        hdF1_drop(s, c, 3);
        hdF1_fin(s);
    },
};
HD_SPR.f_hay_stack = {
    w: 96, h: 84, ax: 48, ay: 81,
    draw(s) {
        const hay = hdPal('#7a5a14', '#c4a03a', '#e8c860', '#f2dc80', '#fff0b8');
        /* bales: the lit top, the cut straw of the front, two twine bands each */
        const bale = (x, y, w, h, L, twine) => {
            const b = hdF1_box(s, hay, x, y, w, h, { layer: L, R: 3, grad: 0.15, cast: 2 }, 2);
            const tp = hdF1_box(s, hdPal('#8a6a1e', '#d8b850', '#f7e7a0', '#fbf0c0', '#ffffff'), x, y, w, 4, { layer: L + 0.1, R: 1.5, grad: 0.2 }, 2);
            for (let j = y + 4; j < y + h; j++) for (let i = x; i < x + w; i++) { const r = hdF1_h(i, j >> 1, 5); if (r > 0.85) hdF1_m(s, b, i, j, 1); else if (r < 0.12) hdF1_m(s, b, i, j, -1); }
            for (const tx of twine) { for (let j = y; j < y + h; j++) { hdF1_m(s, b, tx, j, -2); hdF1_m(s, b, tx + 1, j, -1); hdF1_m(s, tp, tx, j, -2); } }
            return b;
        };
        bale(0, 42, 96, 39, 1, [18, 33, 63, 78]);
        const top = bale(24, 9, 54, 33, 2, [18 + 24, 33 + 24]);
        hdF1_drop(s, top, 3);
        for (let x = 0; x < 96; x++) if (hdF1_h(x, 3, 9) > 0.7) s.px(x, 81 + (x % 2), '#c4a03a');
        hdF1_fin(s);
    },
};
HD_SPR.f_hay_pile = {
    w: 96, h: 72, ax: 48, ay: 69,
    draw(s) {
        const hay = hdPal('#7a5a14', '#c4a03a', '#e8c860', '#f4dc8a', '#fff0b8');
        const p = s.add(hay, { layer: 1, R: 10, grad: 0.3, k: 1.1 });
        s.ellipse(p, 48, 46, 47, 21); s.ellipse(p, 40, 34, 30, 12); s.ellipse(p, 66, 36, 24, 11); hdF1_rr(s, p, 1, 44, 94, 23, 4);
        /* loose straws: short strokes all over, and some sticking out of the top */
        for (let k = 0; k < 170; k++) {
            const x = 4 + hdF1_h(k, 1, 11) * 88, y = 26 + hdF1_h(k, 2, 11) * 40, a = (hdF1_h(k, 3, 11) - 0.5) * 2.2, len = 3 + hdF1_h(k, 4, 11) * 4;
            for (let i = 0; i < len; i++) hdF1_m(s, p, x + Math.sin(a) * i, y - Math.cos(a) * i * 0.6, k % 4 ? 1 : -1);
        }
        for (const [x, y, dx, len] of [[12, 22, -2, 10], [42, 9, 0, 16], [45, 12, 2, 12], [80, 13, 2, 14], [86, 18, 3, 10], [28, 16, -1, 10], [64, 18, 1, 9], [6, 27, -2, 10], [92, 22, 2, 8]])
            for (let i = 0; i <= len; i++) { const px = Math.round(x + dx * (1 - i / len)), py = y + i; s.px(px, py, i < 2 ? '#fff0b8' : i % 3 === 2 ? '#c4a03a' : '#e8c860'); }
        hdF1_fin(s);
    },
};
HD_SPR.f_crimson_rug = {
    w: 96, h: 96, ax: 48, ay: 93,
    draw(s) {
        /* a woven crimson rug: a gold border, a rose line inside it and a gold square in the middle; a fine twill all over */
        const rg = s.add(hdPal('#5a0e1c', '#8a1a2c', '#b3263a', '#c23648', '#d04a5a'), { layer: 1, flat: 1, grad: 0 });
        s.rect(rg, 0, 0, 96, 96);
        const gold = hdPal('#8a6414', '#d8a83a', '#ffcf57', '#ffdc80', '#ffeaa8'), rose = hdPal('#7a1a2a', '#b03446', '#d44a5c', '#e06674', '#ea8490');
        const ring = (d, mat) => { for (let i = d; i < 96 - d; i++) for (let k = 0; k < 3; k++) { hdF1_rc(s, rg, i, d + k, mat); hdF1_rc(s, rg, i, 95 - d - k, mat); hdF1_rc(s, rg, d + k, i, mat); hdF1_rc(s, rg, 95 - d - k, i, mat); } };
        ring(6, gold); ring(15, rose);
        for (let y = 39; y < 57; y++) for (let x = 39; x < 57; x++) hdF1_rc(s, rg, x, y, gold);
        for (let i = 42; i < 54; i++) for (const [x, y] of [[i, 42], [i, 53], [42, i], [53, i]]) hdF1_m(s, rg, x, y, -1);
        for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) if ((x + y) % 4 === 0 && y % 2 === 0 && hdF1_h(x, y, 3) > 0.35) hdF1_m(s, rg, x, y, 1);
        hdF1_hl(s, rg, 1, 94, 1, 1); hdF1_hl(s, rg, 1, 94, 94, -1);
        hdF1_fin(s, true);
    },
};
