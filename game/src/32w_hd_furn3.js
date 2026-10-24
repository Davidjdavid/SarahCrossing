/* ---- 32w_hd_furn3.js ---- */
/* HD furniture, part three: the salon's fittings, the shop signs and shelves, tables and desks, the pink sofa, the
   restaurant and takeout kitchens, the sushi bar and the rest of the last part of the furniture list, each today's
   sprite at three times the size (same box and anchor) with the wood grain, fabric, glass, metal and paper the extra
   pixels allow. Wall things are drawn flat, facing us; rugs lie flat. Lamps keep their bright parts where they are. */

/* ---------------------------------------------------------------- shared helpers */
/* a small seeded hash in [0, 1) and smooth value noise (scatter and grain that never change) */
function hdF3_h(x, y, k) { let n = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul((k | 0) + 11, 1442695041); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }
function hdF3_vn(x, y, k) {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hdF3_h(ix, iy, k), b = hdF3_h(ix + 1, iy, k), c = hdF3_h(ix, iy + 1, k), d = hdF3_h(ix + 1, iy + 1, k);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
/* a frame registered by today's size and anchor (in today's pixels; the HD box is three times that) */
function hdF3_def(name, w, h, ax, ay, fn) { HD_SPR[name] = { w: w * 3, h: h * 3, ax: ax * 3, ay: ay * 3, draw(s) { fn(s); hdF3_fin(s); } }; }
/* texture passes wait until every shape is drawn and touch only pixels still of their part (a shade nudged early would
   otherwise stick to whatever is drawn over that pixel later) */
function hdF3_m(s, id, x, y, d) { (s.f3m || (s.f3m = [])).push(id, Math.round(x), Math.round(y), d); }
function hdF3_rc(s, id, x, y, mat) { (s.f3r || (s.f3r = [])).push([id, Math.round(x), Math.round(y), typeof mat === 'string' ? hdRamp(mat) : mat]); }
function hdF3_later(s, fn) { (s.f3q || (s.f3q = [])).push(fn); }
function hdF3_fin(s) {
    const m = s.f3m || [], r = s.f3r || [], q = s.f3q || [];
    s.f3m = s.f3r = s.f3q = null;
    for (let i = 0; i < m.length; i += 4) if (s.at(m[i + 1], m[i + 2]) === m[i]) s.mod(m[i + 1], m[i + 2], m[i + 3]);
    for (const [id, x, y, mat] of r) if (s.at(x, y) === id) s.recolor(x, y, mat);
    for (const f of q) f();
}
function hdF3_each(s, id, fn) { const W = s.w; for (let i = 0, n = W * s.h; i < n; i++) if (s.part[i] === id) fn(i % W, (i / W) | 0, i); }
function hdF3_mix(a, b, t) { a = hdRgb(a); b = hdRgb(b); return a.map((v, i) => Math.round(v + (b[i] - v) * t)); }
/* a ramp with gentler steps for big flat faces (tops, fronts, panels): seams and grain read without banding */
function hdF3_soft(hex) { const r = hdRamp(hex); return [r[0], hdF3_mix(r[1], r[2], 0.45), r[2], hdF3_mix(r[3], r[2], 0.35), r[3]]; }
/* one exact color in every shade (lettering, glints) */
function hdF3_one(c) { const r = hdRgb(c); return [r, r, r, r, r]; }
/* a rounded rectangle, and a part filled with one */
function hdF3_rr(s, id, x, y, w, h, r) {
    r = r || 0;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const cx = i < r ? r - i - 0.5 : i >= w - r ? i - (w - r) + 0.5 : 0, cy = j < r ? r - j - 0.5 : j >= h - r ? j - (h - r) + 0.5 : 0;
        if (cx * cx + cy * cy <= r * r + 0.3) s.plot(id, x + i, y + j);
    }
}
function hdF3_box(s, mat, x, y, w, h, o, r) { const id = s.add(mat, o); hdF3_rr(s, id, x, y, w, h, r); return id; }
/* a shade line along a row or a column of a part */
function hdF3_hl(s, id, x0, x1, y, d) { for (let x = x0; x <= x1; x++) hdF3_m(s, id, x, y, d); }
function hdF3_vl(s, id, x, y0, y1, d) { for (let y = y0; y <= y1; y++) hdF3_m(s, id, x, y, d); }
/* wood grain: darker streaks that run with the grain (vertical for posts and legs), a few lighter ones */
function hdF3_wood(s, id, seed, vert, amt) {
    amt = amt == null ? 1 : amt;
    hdF3_later(s, () => hdF3_each(s, id, (x, y, i) => {
        const a = vert ? y : x, b = vert ? x : y, g = hdF3_vn(a * 0.07 + b * 0.03, b * 0.7, seed);
        if (g < 0.22 * amt) s.mods[i] -= 1; else if (g > 1 - 0.06 * amt) s.mods[i] += 1;
    }));
}
/* specks of a lighter (d > 0) or darker shade: stone, cloth, soil */
function hdF3_speck(s, id, seed, p, d) { hdF3_later(s, () => hdF3_each(s, id, (x, y, i) => { if (hdF3_h(x, y, seed) < p) s.mods[i] += d; })); }
/* the glint on glass and gloss: a broad and a thin diagonal streak across the upper left of a box */
function hdF3_glint(s, id, x0, y0, w, h, at, d) {
    at = at == null ? 0.3 : at;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = i + j * 0.8 - w * at; if ((q >= 0 && q < 2.2) || (q >= 4 && q < 5)) hdF3_m(s, id, x0 + i, y0 + j, d || 1); }
}
/* parts drawn in a sprite of their own and laid over this one as finished pixels (bottles on a shelf, a face on a
   plush): what's under them keeps its whole form */
function hdF3_over(s, fn) {
    const o = new HDSprite(s.w, s.h); fn(o); hdF3_fin(o);
    const buf = o.render(), W = s.w;
    for (let i = 0; i < W * s.h; i++) if (buf[i * 4 + 3]) s.px(i % W, (i / W) | 0, [buf[i * 4], buf[i * 4 + 1], buf[i * 4 + 2]]);
}
/* a shadow dropped onto what's under a thing laid over (the shelf under a bottle): n rows below its lowest pixels */
function hdF3_under(s, x0, x1, y, n) { for (let x = x0; x <= x1; x++) for (let k = 0; k < (n || 1); k++) s.mod(x, y + k, -1); }
/* exact pixels: a list of [x, y] in one color */
function hdF3_dots(s, pts, col) { for (const [x, y] of pts) s.px(x, y, col); }

/* shared materials */
const HDF3_CHROME = hdPal('#4e5468', '#8a90a6', '#b4b9c9', '#d8dce6', '#f6f8fc');
const HDF3_GOLD = hdPal('#6a4a14', '#b08428', '#e0bc52', '#f0d47a', '#fff0b8');
const HDF3_GLASS = hdPal('#6f9cb4', '#a9d4e6', '#cfe8f5', '#e6f5fb', '#ffffff');

/* ---------------------------------------------------------------- the cash register (sits on a counter) */
hdF3_def('f_register', 16, 16, 8, 15, s => {
    /* the display on its back, its green screen showing the total */
    hdF3_box(s, hdRamp('#3b3f52'), 21, 0, 24, 16, { layer: 1, R: 3, k: 1.3 }, 3);
    const lcd = hdF3_box(s, hdPal('#2f4a20', '#6a9a3c', '#8cc152', '#a4d468', '#c8eca0'), 25, 4, 16, 6, { layer: 2, flat: 1, grad: 0.4 }, 1);
    hdF3_glint(s, lcd, 25, 4, 16, 6, 0.1, 1);
    /* the body: a steel case with the key deck sloping up at the back, the cash drawer under it */
    const body = hdF3_box(s, hdF3_soft('#8a96a8'), 3, 21, 42, 17, { layer: 2, R: 3, grad: 0.2 }, 3);
    const deck = s.add(hdF3_soft('#dcd4c4'), { layer: 3, R: 2, grad: 0.3, cast: 2 });
    s.poly(deck, [[10, 13], [42, 13], [45, 25], [3, 25]]);
    const drw = hdF3_box(s, hdF3_soft('#6b7385'), 3, 37, 42, 11, { layer: 3, R: 2, grad: 0.1 }, 2);
    hdF3_hl(s, body, 5, 42, 23, 1);
    /* the keys: two rows of caps, the last one red */
    for (const [y, sh] of [[16, 1], [20, 0]]) for (let k = 0; k < 5; k++) {
        const key = s.add(k === 4 && !sh ? '#d9584a' : '#8a8070', { layer: 4, R: 1, grad: 0.3 });
        s.rect(key, 12 + k * 6 - sh, y, 4, 3);
    }
    /* the drawer's handle and its lock */
    const knob = s.add(HDF3_GOLD, { layer: 4, R: 2 }); s.ellipse(knob, 24.5, 41.5, 2.6, 2.2);
    hdF3_hl(s, drw, 6, 41, 38, 1);
    s.px(26, 3, '#222833'); hdF3_dots(s, [[29, 6], [30, 6], [32, 6], [33, 6], [35, 6], [36, 6], [37, 6]], '#3d5a26');
} );

/* ---------------------------------------------------------------- the salon */
/* the styling chair: a deep pink tufted back, a plump seat, chrome arms, on a pump stem and a domed foot */
hdF3_def('f_salon_chair', 16, 28, 8, 27, s => {
    const PINK = hdRamp('#e05599');
    hdF3_box(s, HDF3_CHROME, 21, 58, 6, 13, { layer: 0, R: 2, k: 1.8 });
    const foot = s.add(hdRamp('#6b6f88'), { layer: 1, R: 4, grad: 0.4 }); s.ellipse(foot, 24, 75, 18, 4); s.rect(foot, 13, 70, 22, 5); s.ellipse(foot, 24, 70.5, 11, 3);
    const back = hdF3_box(s, PINK, 6, 9, 36, 34, { layer: 1, R: 7, grad: 0.15 }, 10);
    const pad = hdF3_box(s, hdRamp('#ff8ac2'), 14, 17, 20, 21, { layer: 2, R: 5, grad: 0.2, bias: -0.04 }, 5);
    const seat = hdF3_box(s, PINK, 3, 36, 42, 24, { layer: 3, R: 6, grad: 0.3, cast: 2 }, 8);
    /* the seat's top seen from above, lit; a welt where it turns down to the front */
    hdF3_hl(s, seat, 9, 38, 38, 1); hdF3_hl(s, seat, 6, 41, 45, -1);
    /* buttons tufting the pad */
    for (const [x, y] of [[20, 23], [27, 23], [20, 31], [27, 31]]) { hdF3_m(s, pad, x, y, -2); hdF3_m(s, pad, x + 1, y + 1, 1); }
    for (const x of [0, 39]) { const arm = s.add(HDF3_CHROME, { layer: 4, R: 3, k: 1.6, cast: 1 }); hdF3_rr(s, arm, x, 37, 9, 14, 4); }
    hdF3_vl(s, back, 9, 14, 34, 1);
});
/* the reception desk: a lilac top, a pale front of raised panels, a deep lilac plinth */
hdF3_def('f_salon_desk', 32, 28, 16, 27, s => {
    const front = hdF3_box(s, hdF3_soft('#f6e8fa'), 2, 38, 92, 36, { layer: 1, R: 2, grad: 0.12 });
    const plinth = hdF3_box(s, hdF3_soft('#8a5ab8'), 2, 72, 92, 8, { layer: 2, R: 2, grad: 0.1 }, 2);
    const top = hdF3_box(s, hdF3_soft('#c8a0f8'), 0, 27, 96, 8, { layer: 3, R: 2, grad: 0.2, bias: 0.04 }, 3);
    const edge = hdF3_box(s, hdF3_soft('#b37cf0'), 0, 33, 96, 7, { layer: 4, R: 2, grad: 0.2, cast: 2 }, 2);
    /* the fluted front: a groove between panels, its right lip catching the light */
    for (const x of [13, 31, 49, 67, 85]) { hdF3_vl(s, front, x, 41, 71, -2); hdF3_vl(s, front, x + 1, 41, 71, -1); hdF3_vl(s, front, x + 2, 41, 71, 1); }
    hdF3_hl(s, top, 3, 92, 28, 1); hdF3_hl(s, edge, 2, 93, 34, 1); hdF3_hl(s, plinth, 4, 91, 73, 1);
    hdF3_glint(s, top, 10, 28, 30, 5, 0.2, 1);
});
/* the hood dryer: a glossy lilac bell, its dark mouth, on a chrome stem and a round foot */
hdF3_def('f_salon_dryer', 16, 28, 8, 27, s => {
    hdF3_box(s, HDF3_CHROME, 21, 36, 6, 35, { layer: 0, R: 2, k: 1.8 });
    const foot = s.add(hdRamp('#8a8ea8'), { layer: 1, R: 4, grad: 0.4 }); s.ellipse(foot, 24, 75, 12.5, 3.5); s.rect(foot, 15, 71, 18, 4); s.ellipse(foot, 24, 71, 6, 2.5);
    const bell = s.add(hdRamp('#b37cf0'), { layer: 2, R: 9, grad: 0.25, cast: 2, k: 1.1 });
    s.ellipse(bell, 24, 23.5, 24, 14.5); s.ellipse(bell, 24, 15.5, 15, 10);
    const mouth = s.add(hdRamp('#6a3a90'), { layer: 1, R: 6, grad: -0.3, bias: -0.06 });
    s.ellipse(mouth, 24, 32, 16.5, 6.5);
    /* the gloss on the bell */
    hdF3_later(s, () => hdF3_each(s, bell, (x, y, i) => { const u = (x - 16) / 7, v = (y - 13) / 3.2; if (u * u + v * v < 1) s.mods[i] += 1; }));
});
/* the gilt oval mirror with a pearl at each point */
hdF3_def('f_salon_mirror', 16, 26, 8, 25, s => {
    const frame = s.add(hdRamp('#e8c860'), { layer: 1, R: 6, k: 1.5, grad: 0.15 }); s.ellipse(frame, 24, 36, 24, 36);
    const lip = s.add(hdRamp('#c9a240'), { layer: 2, R: 2, k: 1.4 }); s.ellipse(lip, 24, 36, 17.5, 29.5);
    const glass = s.add(HDF3_GLASS, { layer: 3, R: 8, grad: 0.35, k: 0.7 }); s.ellipse(glass, 24, 36, 15.5, 27.5);
    /* two streaks of light across the glass, down to the left */
    hdF3_later(s, () => hdF3_each(s, glass, (x, y, i) => { const q = x + y * 0.55; if ((q > 33 && q < 36) || (q > 38.5 && q < 40)) { if (y < 40) s.mods[i] += 2; } else if (q > 28 && q < 42 && y < 30) s.mods[i] += 1; }));
    hdF3_later(s, () => hdF3_each(s, frame, (x, y, i) => { if (hdF3_h(x >> 1, y >> 1, 7) > 0.93) s.mods[i] += 1; }));
    hdF3_over(s, o => { const P = hdPal('#9a8a9a', '#d8d0e0', '#f4f0f8', '#fcfaff', '#ffffff'); for (const [x, y] of [[24, 3.5], [3.5, 37], [44.5, 37], [24, 69]]) { const p = o.add(P, { R: 2, k: 1.5 }); o.ellipse(p, x, y, 2.8, 2.8); } });
});
/* the hair product shelf: a lilac case, three shelves of bottles in today's colors */
function hdF3_bottle(o, x, y, w, h, col, kind, seed) {
    const B = hdRamp(col), cx = x + w / 2;
    if (kind === 0) {           // a pump bottle: round shoulders, a white pump
        const b = o.add(B, { R: 3, k: 1.2, layer: 1, grad: 0.25 }); hdF3_rr(o, b, x, y + 3, w, h - 3, 3);
        const p = o.add('#e8e8f0', { R: 1, layer: 2 }); o.rect(p, Math.round(cx) - 1, y, 3, 4); o.rect(p, Math.round(cx) + 1, y, 3, 1);
        const lab = o.add('#ffffff', { R: 1, layer: 2, flat: 1, bias: 0.05 }); o.rect(lab, x + 1, y + 7, w - 2, 4);
        o.px(x + 1, y + 5, '#ffffff');
    } else if (kind === 1) {    // a tall bottle with a cap
        const b = o.add(B, { R: 3, k: 1.2, layer: 1, grad: 0.25 }); hdF3_rr(o, b, x + 1, y + 4, w - 2, h - 4, 2); o.rect(b, Math.round(cx) - 1, y + 2, 3, 3);
        const c = o.add('#e8e8f0', { R: 1, layer: 2 }); o.rect(c, Math.round(cx) - 2, y, 5, 3);
        o.px(x + 2, y + 6, '#ffffff'); o.px(x + 2, y + 7, '#ffffff');
    } else {                    // a tub with a lid
        const b = o.add(B, { R: 3, k: 1.2, layer: 1, grad: 0.25 }); hdF3_rr(o, b, x, y + 7, w, h - 7, 2);
        const c = o.add('#e8e8f0', { R: 2, layer: 2 }); hdF3_rr(o, c, x - 1 < 0 ? 0 : x, y + 4, w, 4, 1);
        o.px(x + 1, y + 9, '#ffffff');
    }
}
hdF3_def('f_salon_shelf', 32, 28, 16, 27, s => {
    const frame = hdF3_box(s, hdF3_soft('#b37cf0'), 0, 0, 96, 81, { layer: 2, R: 2, grad: 0.1 }, 3);
    const backs = [];
    for (const y of [6, 30, 54]) { const b = hdF3_box(s, hdF3_soft('#f6e8fa'), 6, y, 84, 21, { layer: 1, R: 2, grad: -0.25, bias: -0.06 }); backs.push(b); }
    /* the shelves' lit front edges */
    for (const y of [27, 51, 75]) hdF3_hl(s, frame, 4, 91, y, 1);
    hdF3_vl(s, frame, 2, 2, 77, 1);
    const COL = ['#ff9ec0', '#4ec3d9', '#ffd84a', '#8cc152', '#b37cf0', '#ffffff', '#e0405a'];
    hdF3_over(s, o => {
        for (let r = 0; r < 3; r++) for (let k = 0; k < 7; k++) {
            const kind = (k * 2 + r) % 3, y0 = 6 + r * 24;
            hdF3_bottle(o, 9 + k * 12, y0 + 3 + (kind === 2 ? 3 : 0), 9, 18 - (kind === 2 ? 3 : 0), COL[k], kind, r * 7 + k);
        }
    });
    for (let r = 0; r < 3; r++) for (let k = 0; k < 7; k++) hdF3_under(s, 18 + k * 12, 19 + k * 12, 18 + r * 24, 6);
});
/* the shampoo sink: a white basin with a chrome gooseneck, the wash chair beside it, all on a white cabinet */
hdF3_def('f_salon_sink', 32, 28, 16, 27, s => {
    const cab = hdF3_box(s, hdF3_soft('#ffffff'), 3, 42, 90, 34, { layer: 1, R: 2, grad: 0.15 }, 2);
    const kick = hdF3_box(s, hdF3_soft('#d8d8e0'), 3, 72, 90, 6, { layer: 2, R: 1, grad: 0 }, 2);
    /* doors on the cabinet: two panels under the basin, two under the chair */
    for (const [x, w] of [[8, 19], [29, 19], [52, 17], [72, 17]]) { hdF3_hl(s, cab, x, x + w, 48, -1); hdF3_hl(s, cab, x, x + w, 68, -1); hdF3_vl(s, cab, x, 48, 68, -1); hdF3_vl(s, cab, x + w, 48, 68, -1); hdF3_vl(s, cab, x + 1, 49, 67, 1); }
    for (const x of [24, 32, 66, 75]) { s.px(x, 57, '#9a9ab0'); s.px(x, 58, '#9a9ab0'); }
    const back = hdF3_box(s, hdRamp('#e05599'), 51, 15, 39, 23, { layer: 2, R: 7, grad: 0.2 }, 8);
    const seat = hdF3_box(s, hdRamp('#b83d7c'), 51, 36, 39, 9, { layer: 3, R: 3, grad: 0.15, cast: 2 }, 3);
    hdF3_hl(s, seat, 54, 86, 37, 1);
    const bowl = s.add(hdF3_soft('#e8e8f0'), { layer: 3, R: 4, grad: 0.3, cast: 1 });
    hdF3_rr(s, bowl, 6, 31, 42, 14, 5);
    const water = s.add(hdPal('#5f9ab8', '#86c4de', '#9fd8ef', '#c4ecf8', '#ffffff'), { layer: 4, R: 3, grad: -0.3, k: 0.8 });
    s.ellipse(water, 27, 37.5, 16, 3.6);
    hdF3_hl(s, water, 18, 23, 36, 2);
    const tap = s.add(HDF3_CHROME, { layer: 5, R: 2, k: 1.8 });
    s.line(tap, 28.5, 35, 28.5, 22, 1.6); s.line(tap, 29, 20, 36, 19.5, 1.6); s.line(tap, 37.5, 20.5, 38, 24, 1.3);
    s.ellipse(tap, 28.5, 35.5, 3, 1.6);
});
/* the waiting sofa: a soft pink back, rolled arms, a long seat cushion with a piped edge */
hdF3_def('f_salon_sofa', 32, 28, 16, 27, s => {
    const back = hdF3_box(s, hdF3_soft('#ff9ec0'), 3, 21, 90, 22, { layer: 1, R: 7, grad: 0.15 }, 7);
    const base = hdF3_box(s, hdF3_soft('#f07ab4'), 6, 62, 84, 10, { layer: 2, R: 3, grad: 0 }, 3);
    const seat = hdF3_box(s, hdF3_soft('#ff86c0'), 13, 41, 70, 27, { layer: 3, R: 6, grad: 0.15, cast: 2, bias: 0.03 }, 5);
    for (const x of [0, 81]) { const arm = s.add(hdF3_soft('#e0559a'), { layer: 4, R: 6, grad: 0.2, cast: 1 }); hdF3_rr(s, arm, x, 36, 15, 34, 6); hdF3_hl(s, arm, x + 3, x + 11, 39, 1); }
    /* the piping where the cushion turns down to the front */
    hdF3_hl(s, seat, 15, 80, 48, 1); hdF3_hl(s, seat, 15, 80, 49, 1); hdF3_hl(s, seat, 15, 80, 50, -1);
});

/* ---------------------------------------------------------------- shelves */
/* a wooden case: the top seen from above, its front edge, the frame and the dark back of the shelves */
function hdF3_case(s, o) {
    const top = hdF3_box(s, hdF3_soft('#9a6b3a'), 0, 0, 96, 10, { layer: 3, R: 2, grad: 0.3, bias: 0.04 }, 2);
    const lip = hdF3_box(s, hdF3_soft('#a9794e'), 0, 9, 96, 4, { layer: 4, R: 1, grad: 0, cast: 2 });
    const frame = hdF3_box(s, hdF3_soft('#b98552'), 0, 12, 96, 72, { layer: 2, R: 2, grad: 0.1 });
    const backs = [];
    for (const [y, h] of o.bays) backs.push(hdF3_box(s, hdF3_soft('#6b4a2a'), 9, y, 78, h, { layer: 1, R: 3, grad: -0.4, bias: -0.04 }));
    hdF3_wood(s, top, 3, false, 0.9); hdF3_wood(s, frame, 4, true, 0.6); hdF3_wood(s, lip, 5, false, 0.6);
    for (const b of backs) hdF3_wood(s, b, 6, true, 0.5);
    hdF3_hl(s, top, 2, 93, 1, 1);
    if (o.base) { const base = hdF3_box(s, hdF3_soft(o.base), 0, 69, 96, 15, { layer: 3, R: 2, grad: 0.1 }); hdF3_wood(s, base, 8, false, 0.8); hdF3_hl(s, base, 2, 93, 69, 1); }
    return frame;
}
/* a book standing on a shelf: its spine with bands near the head and foot */
function hdF3_book(o, x, y, w, h, col, seed) {
    const b = o.add(hdRamp(col), { R: 2, k: 1.2, layer: 1, grad: 0.2 }); o.rect(b, x, y, w, h);
    const band = hdRamp(hdF3_mix(col, '#ffe08a', 0.55));
    const t = hdF3_h(x, y, seed);
    for (let i = x + 1; i < x + w - 1; i++) { o.recolor(i, y + 2, band); o.recolor(i, y + h - 3, band); if (t > 0.5) o.recolor(i, y + 4, band); }
    if (w >= 6 && t < 0.5) for (let j = y + 6; j < y + 9 && j < y + h - 4; j++) o.recolor(x + (w >> 1), j, band);
}
hdF3_def('f_shelf_book', 32, 28, 16, 27, s => {
    hdF3_case(s, { bays: [[15, 25], [42, 25]] });
    hdF3_over(s, o => {
        const top = [[12, 6, '#4f86c6', 24], [21, 9, '#6a3a8a', 21], [33, 6, '#ffcf57', 21], [42, 9, '#4f86c6', 21], [54, 9, '#ffcf57', 24], [66, 9, '#4f86c6', 21], [78, 6, '#6a3a8a', 21]];
        for (const [x, w, c, y] of top) hdF3_book(o, x, y, w, 41 - y, c, 1);
        const low = [[12, 6, '#6a3a8a', 45], [21, 9, '#b3263a', 45], [33, 6, '#f2896b', 42], [42, 9, '#f2896b', 42], [54, 9, '#b3263a', 45], [66, 9, '#6a3a8a', 42], [78, 9, '#4f86c6', 45]];
        for (const [x, w, c, y] of low) hdF3_book(o, x, y, w, 68 - y, c, 2);
    });
    /* the shelf boards in front of the books' feet */
    hdF3_over(s, o => { for (const y of [39, 66]) { const b = o.add(hdF3_soft('#b98552'), { R: 1, grad: 0, layer: 2 }); o.rect(b, 9, y, 78, 3); } });
});
/* the grocery shelf: the same case, packets, cans, cartons and bottles in today's colors */
function hdF3_can(o, x, y, w, h, label) {
    const c = o.add(hdRamp('#fff7f1'), { R: 2, k: 1.3, layer: 1 }); hdF3_rr(o, c, x, y, w, h, 1);
    const l = o.add(hdRamp(label), { R: 2, k: 1.3, layer: 2 }); o.rect(l, x, y + 3, w, h - 6);
    o.px(x + 1, y + 1, '#ffffff'); o.px(x + 1, y + 4, hdF3_mix(label, '#ffffff', 0.5));
}
function hdF3_pack(o, x, y, w, h, col, top, band) {
    const b = o.add(hdRamp(col), { R: 2, k: 1.1, layer: 1, grad: 0.15 }); o.rect(b, x, y, w, h);
    if (top) { const t = o.add(hdRamp(top), { R: 1, layer: 2 }); o.rect(t, x, y, w, 3); }
    if (band) { const t = o.add(hdRamp(band), { R: 1, layer: 2, flat: 1, bias: 0.05 }); o.rect(t, x + 1, y + Math.round(h * 0.4), w - 2, 3); }
}
hdF3_def('f_shelf_grocery', 32, 28, 16, 27, s => {
    hdF3_case(s, { bays: [[15, 24], [42, 24]], base: '#9a6b3a' });
    hdF3_over(s, o => {
        /* the top shelf: a can, a red box, an orange packet, a milk carton, another packet, a dark bottle */
        hdF3_can(o, 12, 26, 9, 12, '#f28a6b');
        hdF3_pack(o, 24, 21, 9, 18, '#e0405a', '#dcd4c4');
        hdF3_pack(o, 36, 21, 12, 18, '#d9674a', null, '#fff7f1');
        const milk = o.add(hdRamp('#f7f3ea'), { R: 2, k: 1.1, layer: 1, grad: 0.2 }); o.rect(milk, 51, 24, 9, 15); o.poly(milk, [[51, 24], [55.5, 20], [60, 24]]);
        const cap = o.add(hdRamp('#4ea8f0'), { R: 1, layer: 2 }); o.rect(cap, 54, 19, 3, 2);
        const lab = o.add(hdRamp('#4ea8f0'), { R: 1, layer: 2, flat: 1 }); o.rect(lab, 51, 30, 9, 3);
        hdF3_pack(o, 63, 21, 12, 18, '#d9674a', null, '#fff7f1');
        const bot = o.add(hdRamp('#6e3f25'), { R: 3, k: 1.3, layer: 1, grad: 0.2 }); hdF3_rr(o, bot, 78, 26, 9, 13, 2); o.rect(bot, 81, 21, 3, 6);
        const bc = o.add(hdRamp('#dcd4c4'), { R: 1, layer: 2 }); o.rect(bc, 80, 20, 5, 2);
        o.px(79, 28, '#a8735a'); o.px(79, 29, '#a8735a');
        /* the bottom shelf: a can, a carton, a green box, two red packets, a can */
        hdF3_can(o, 12, 54, 9, 12, '#b37cf0');
        hdF3_pack(o, 24, 48, 9, 18, '#f7f3ea', '#dcd4c4');
        hdF3_pack(o, 36, 48, 12, 18, '#3f8f45', null, '#fff7f1');
        hdF3_pack(o, 51, 48, 9, 18, '#e0405a', '#dcd4c4');
        hdF3_pack(o, 63, 48, 9, 18, '#e0405a', '#dcd4c4');
        hdF3_can(o, 75, 54, 9, 12, '#4f86c6');
    });
    for (const [x0, x1] of [[18, 20], [30, 32], [45, 47], [57, 59], [72, 74], [84, 86]]) { hdF3_under(s, x0, x1, 39, 1); hdF3_under(s, x0, x1, 66, 1); }
});
/* the wall shelf: a plank on two brackets, a row of books and boxes (the last one hangs over the end, as today) */
function hdF3_tome(o, x, y, w, h, col, top) {
    const b = o.add(hdRamp(col), { R: 2, k: 1.2, layer: 1, grad: 0.15 }); o.rect(b, x, y + 3, w, h - 3);
    const t = o.add(hdRamp(top), { R: 1, layer: 2, grad: 0, bias: 0.05 }); o.rect(t, x, y, w, 3);
    const band = hdRamp(hdF3_mix(col, '#fff2c0', 0.5));
    for (let i = x + 1; i < x + w - 1; i++) { o.recolor(i, y + 5, band); o.recolor(i, y + h - 4, band); }
}
hdF3_def('f_shelf_wall', 32, 16, 16, 15, s => {
    hdF3_over(s, o => {
        for (const x of [11, 80]) { const b = o.add(hdRamp('#7a5234'), { R: 1, layer: 0 }); o.poly(b, [[x, 38], [x + 5, 38], [x + 5, 44], [x + 3, 44]]); }
        hdF3_tome(o, 9, 18, 12, 15, '#f2c262', '#f6d491');
        hdF3_tome(o, 24, 9, 12, 24, '#e0405a', '#e9798c');
        hdF3_tome(o, 39, 12, 12, 21, '#4f86c6', '#84aad7');
        hdF3_tome(o, 54, 15, 12, 18, '#8cc152', '#aed486');
        hdF3_tome(o, 69, 18, 12, 15, '#ffd84a', '#ffe480');
        hdF3_tome(o, 84, 9, 12, 24, '#b37cf0', '#caa3f4');
        const top = o.add(hdF3_soft('#b08050'), { R: 1, layer: 3, grad: 0, bias: 0.05 }); o.rect(top, 3, 32, 90, 3);
        const pl = o.add(hdF3_soft('#9a6b3a'), { R: 2, layer: 4, grad: 0.1 }); o.rect(pl, 3, 34, 90, 5);
        hdF3_wood(o, pl, 12, false, 0.8);
    });
});
/* a wall rack of six spice jars between two rails */
hdF3_def('f_spice_rack', 32, 16, 16, 15, s => {
    hdF3_over(s, o => {
        const SP = ['#e2382b', '#ffc53a', '#8a5a33', '#5aa844', '#f28a2a', '#6a3a8a'];
        for (let k = 0; k < 6; k++) {
            const x = 9 + k * 15;
            const g = o.add(HDF3_GLASS, { R: 3, k: 0.9, layer: 1, grad: 0.2 }); hdF3_rr(o, g, x, 19, 9, 17, 2);
            const sp = o.add(hdRamp(SP[k]), { R: 3, k: 1, layer: 2, grad: 0.1 }); hdF3_rr(o, sp, x + 1, 25, 7, 10, 1);
            hdF3_speck(o, sp, k, 0.12, 1);
            const lid = o.add(hdRamp('#c8a070'), { R: 1, layer: 3 }); o.rect(lid, x, 17, 9, 3);
            o.px(x + 1, 21, '#ffffff'); o.px(x + 1, 22, '#ffffff'); o.px(x + 1, 26, hdF3_mix(SP[k], '#ffffff', 0.6));
        }
        for (const y of [8, 35]) {
            const r = o.add(hdF3_soft('#9a6b3a'), { R: 2, layer: 4, grad: 0.15 }); hdF3_rr(o, r, 0, y, 96, 7, 2);
            hdF3_wood(o, r, y, false, 0.8); hdF3_hl(o, r, 2, 93, y + 1, 1);
        }
    });
});

/* ---------------------------------------------------------------- signs on the wall */
/* a framed sign: the molding with today's cut corners, a flat painted panel set into it */
function hdF3_sign(s, x, y, w, h, r, frame, panel, ins, wood) {
    const fr = s.add(hdF3_soft(frame), { layer: 2, R: 3, k: 1.5, grad: 0.15, cast: 2 }); hdF3_rr(s, fr, x, y, w, h, r);
    if (wood) hdF3_wood(s, fr, wood, false, 0.8);
    const pn = s.add(hdF3_soft(panel), { layer: 1, R: 3, flat: 1, grad: 0.1 }); hdF3_rr(s, pn, x + ins, y + ins, w - ins * 2, h - ins * 2, 3);
    hdF3_hl(s, fr, x + r, x + w - r, y + 1, 1);
    return [fr, pn];
}
/* painted lettering: short upright strokes with a rounded end (today's bars stand for the words) */
function hdF3_strokes(o, x, y, n, step, h, col) {
    for (let k = 0; k < n; k++) { const p = o.add(hdRamp(col), { R: 1, layer: 3, grad: 0.2 }); hdF3_rr(o, p, x + k * step, y, 3, h, 1); }
}
hdF3_def('f_sign_boutique', 32, 16, 16, 15, s => {
    const fr = s.add(hdPal('#8a7a80', '#e2dade', '#f8f4f4', '#ffffff', '#ffffff'), { layer: 2, R: 4, k: 1.5, grad: 0.2, cast: 2 }); s.ellipse(fr, 48, 24, 47.5, 24);
    const pn = s.add(hdF3_soft('#fff4ee'), { layer: 1, R: 3, flat: 1, grad: 0.1 }); s.ellipse(pn, 48, 24, 41.5, 18.5);
    hdF3_over(s, o => {
        /* the clementine with its leaf */
        const fruit = o.add(hdRamp('#f7962d'), { R: 7, k: 1.1, layer: 1 }); o.ellipse(fruit, 29.5, 25.5, 11.5, 11);
        hdF3_speck(o, fruit, 4, 0.08, -1);
        const leaf = o.add(hdRamp('#3f8f45'), { R: 2, layer: 2 }); o.poly(leaf, [[32, 16], [36, 11], [40, 12], [37, 16]]);
        o.px(26, 20, '#ffd9a8'); o.px(25, 21, '#ffd9a8'); o.px(26, 21, '#ffc27a');
        hdF3_strokes(o, 48, 18, 4, 6, 15, '#f28a1a');
    });
});
hdF3_def('f_sign_builder', 32, 16, 16, 15, s => {
    hdF3_sign(s, 0, 0, 96, 48, 9, '#8a5a2b', '#f7d9a8', 9, 21);
    hdF3_over(s, o => {
        /* the hammer */
        const hd = o.add(hdRamp('#8a96a8'), { R: 2, k: 1.5, layer: 2 }); hdF3_rr(o, hd, 18, 12, 15, 6, 1);
        const hl = o.add(hdRamp('#b07a4a'), { R: 1, layer: 1 }); o.rect(hl, 24, 17, 3, 13);
        /* the little house: a roof, white eaves, the walls and a red door */
        const roof = o.add(hdRamp('#b8733d'), { R: 3, layer: 1 }); o.poly(roof, [[59.5, 10.5], [72.5, 24], [46.5, 24]]);
        const eave = o.add(hdRamp('#ffffff'), { R: 1, layer: 2 }); o.rect(eave, 47, 24, 25, 3);
        const wall = o.add(hdRamp('#d9a46a'), { R: 2, layer: 1 }); o.rect(wall, 48, 27, 23, 9);
        const door = o.add(hdRamp('#e0405a'), { R: 1, layer: 2 }); o.rect(door, 57, 28, 6, 8);
    });
});
hdF3_def('f_sign_museum', 32, 16, 16, 15, s => {
    hdF3_sign(s, 0, 0, 96, 48, 9, '#6b5a7a', '#f7f0e4', 9);
    hdF3_over(s, o => {
        const M = hdRamp('#b8a888');
        const ped = o.add(M, { R: 2, layer: 2 }); o.poly(ped, [[48, 11], [75, 21], [21, 21]]);
        const ent = o.add(M, { R: 1, layer: 2 }); o.rect(ent, 22, 20, 52, 3);
        for (const x of [25, 36, 47, 58, 68]) { const c = o.add(M, { R: 2, k: 1.4, layer: 1 }); o.rect(c, x, 23, 4, 10); }
        const base = o.add(hdRamp('#9a8a6a'), { R: 1, layer: 2 }); o.rect(base, 21, 33, 54, 3); o.rect(base, 19, 35, 58, 2);
    });
});
hdF3_def('f_sign_restaurant', 32, 16, 16, 15, s => {
    hdF3_sign(s, 0, 0, 96, 48, 9, '#2f6b4a', '#fbf2e2', 9);
    hdF3_over(s, o => {
        /* a steaming bowl, a red dot either side */
        const st = o.add(hdRamp('#ffffff'), { R: 1, layer: 1, flat: 1 });
        for (const x0 of [41, 47]) for (let y = 11; y < 18; y++) o.plot(st, x0 + Math.round(Math.sin(y * 0.9) * 1.2), y);
        const soup = o.add(hdRamp('#c98a4a'), { R: 2, layer: 1 }); o.ellipse(soup, 46.5, 21, 11, 2.2);
        const bowl = o.add(hdRamp('#e0405a'), { R: 4, k: 1.2, layer: 2 }); o.poly(bowl, [[35, 21], [58, 21], [56, 25], [51, 29], [42, 29], [37, 25]]);
        const foot = o.add(hdRamp('#b02a40'), { R: 1, layer: 1 }); o.rect(foot, 42, 29, 9, 2);
        const egg = o.add(hdRamp('#ffd84a'), { R: 1, layer: 3 }); o.ellipse(egg, 46.5, 24.5, 2, 1.6);
        for (const x of [22, 73]) { const d = o.add(hdRamp('#e0405a'), { R: 1, layer: 1 }); o.ellipse(d, x, 25.5, 1.7, 1.7); }
    });
});
hdF3_def('f_sign_salon', 32, 22, 16, 21, s => {
    hdF3_sign(s, 0, 3, 96, 57, 9, '#b37cf0', '#fff4fa', 9);
    hdF3_over(s, o => {
        /* the scissors (the blades crossed, two finger rings) */
        const sc = o.add(hdRamp('#8a5ab8'), { R: 1, layer: 2 });
        o.line(sc, 22, 22, 33, 34, 1.3); o.line(sc, 40, 22, 29, 34, 1.3);
        for (const x of [26, 36]) { o.ellipse(sc, x, 39, 3.6, 3.2); }
        for (const x of [26, 36]) o.ellipse(-1, x, 39, 1.6, 1.3);
        o.px(31, 30, '#d8b8f8');
        /* the puff of fresh hair: pink with a blue curl */
        const pink = o.add(hdRamp('#ffb3d9'), { R: 5, layer: 1 }); o.ellipse(pink, 65, 31.5, 11.5, 7.5); o.ellipse(pink, 59, 28, 5, 5);
        const blue = o.add(hdRamp('#aee0ff'), { R: 4, layer: 2 }); o.ellipse(blue, 70, 26, 7.5, 6);
    });
});
hdF3_def('f_sign_displays', 32, 22, 16, 21, s => {
    hdF3_sign(s, 0, 3, 96, 57, 9, '#3f8f45', '#fff4dc', 9);
    hdF3_over(s, o => {
        /* a gold cup on its stem */
        const cup = o.add(hdRamp('#3f3a4a'), { R: 2, layer: 1 }); o.poly(cup, [[21, 21], [36, 21], [36, 27], [31, 32], [26, 32], [21, 27]]); o.rect(cup, 27, 32, 3, 7); o.rect(cup, 24, 38, 9, 3);
        const gold = o.add(HDF3_GOLD, { R: 2, layer: 2 }); o.poly(gold, [[24, 24], [33, 24], [33, 27], [30, 29], [27, 29], [24, 27]]);
        /* a slatted crate */
        const crate = o.add(hdRamp('#eab45a'), { R: 2, layer: 1 }); o.rect(crate, 51, 21, 30, 21);
        for (const x of [57, 66, 75]) for (let y = 22; y < 41; y++) { o.recolor(x, y, '#c98a2e'); o.recolor(x + 1, y, '#c98a2e'); }
        hdF3_wood(o, crate, 9, true, 0.7);
    });
});
hdF3_def('f_sign_shop', 32, 16, 16, 15, s => {
    const [fr] = hdF3_sign(s, 0, 0, 96, 48, 9, '#8a5a2b', '#8a5a2b', 9, 27);
    hdF3_over(s, o => {
        const rim = o.add(hdRamp('#f2c262'), { R: 4, k: 1.3, layer: 1 }); o.ellipse(rim, 48, 24, 33, 15);
        const fill = o.add(hdRamp('#d49a3a'), { R: 4, layer: 2, grad: -0.2 }); o.ellipse(fill, 48, 24, 27, 11);
        const st = o.add(hdF3_one('#ffffff'), { R: 1, layer: 3 }); o.line(st, 27, 27, 72, 25, 0.8);
        o.px(73, 23, '#ffffff'); o.px(74, 22, '#ffffff');
    });
});
hdF3_def('f_studio_sign', 32, 16, 16, 15, s => {
    hdF3_sign(s, 0, 0, 96, 48, 9, '#7a4a2e', '#fff4e6', 9, 33);
    hdF3_over(s, o => {
        const clay = o.add(hdRamp('#d98a5a'), { R: 6, k: 1.1, layer: 1 }); o.ellipse(clay, 27, 25.5, 9.5, 10.5);
        hdF3_speck(o, clay, 6, 0.06, -1);
        hdF3_strokes(o, 42, 18, 7, 6, 15, '#7a4a2e');
    });
});

/* ---------------------------------------------------------------- tables and desks */
/* a plank top seen from above: boards running across with seams between them, the back edge catching the light */
function hdF3_planks(s, id, x0, x1, ys, seed) {
    for (const y of ys) { hdF3_hl(s, id, x0, x1, y, -1); hdF3_hl(s, id, x0, x1, y + 1, 1); }
    for (let k = 0; k < ys.length; k++) { const x = x0 + 8 + Math.floor(hdF3_h(k, seed, 3) * (x1 - x0 - 16)); if (k % 2) for (let y = ys[k] + 2; y < (ys[k + 1] || ys[k] + 8); y++) hdF3_m(s, id, x, y, -1); }
    hdF3_wood(s, id, seed, false, 0.9);
}
/* a square leg with the grain running down it */
function hdF3_leg(s, col, x, y, w, h, layer) { const l = hdF3_box(s, hdF3_soft(col), x, y, w, h, { layer: layer || 0, R: 2, k: 1.5, grad: 0.1 }, 1); hdF3_wood(s, l, x, true, 0.6); return l; }
hdF3_def('f_table_wood', 32, 28, 16, 27, s => {
    for (const x of [6, 75]) hdF3_leg(s, '#8a5a33', x, 60, 9, 21);
    const apron = hdF3_box(s, hdF3_soft('#9a6b3a'), 2, 52, 92, 11, { layer: 1, R: 2, grad: 0.15 }, 2);
    const top = hdF3_box(s, hdF3_soft('#c98a55'), 0, 22, 96, 32, { layer: 2, R: 2, grad: 0.12, cast: 2 }, 3);
    hdF3_planks(s, top, 2, 93, [30, 39, 48], 7);
    hdF3_hl(s, top, 3, 92, 23, 1); hdF3_hl(s, top, 2, 93, 24, 1);
    hdF3_wood(s, apron, 8, false, 0.7); hdF3_hl(s, apron, 3, 92, 53, -1);
});
hdF3_def('f_study_desk', 32, 28, 16, 27, s => {
    const body = hdF3_box(s, hdF3_soft('#6b4a2a'), 0, 47, 96, 37, { layer: 1, R: 2, grad: 0.15 });
    const top = hdF3_box(s, hdF3_soft('#8a5a33'), 0, 22, 96, 26, { layer: 2, R: 2, grad: 0.12, cast: 2 }, 2);
    hdF3_planks(s, top, 2, 93, [30, 39], 11);
    hdF3_hl(s, top, 2, 93, 23, 2); hdF3_hl(s, top, 2, 93, 24, 1); hdF3_hl(s, top, 2, 93, 25, 1);
    hdF3_wood(s, body, 12, true, 0.5);
    /* the drawer and its brass knob */
    const drw = hdF3_box(s, hdF3_soft('#7a5234'), 60, 54, 27, 27, { layer: 2, R: 2, grad: 0.15 }, 1);
    hdF3_wood(s, drw, 13, false, 0.6); hdF3_hl(s, drw, 61, 85, 55, 1);
    const knob = s.add(HDF3_GOLD, { layer: 3, R: 2 }); s.ellipse(knob, 73.5, 67.5, 2.4, 2.4);
    /* the laptop: its lid up, a pale blue screen with a glint; the base and its grey front edge */
    const lid = hdF3_box(s, hdRamp('#3b3f52'), 9, 6, 36, 20, { layer: 3, R: 2, k: 1.3 }, 2);
    const scr = hdF3_box(s, hdPal('#3c7f96', '#5cb4cc', '#7fd3e8', '#a4e2f0', '#d6f4fa'), 14, 10, 26, 13, { layer: 4, flat: 1, grad: 0.5 });
    hdF3_glint(s, scr, 14, 10, 26, 13, 0.35, 1);
    const base = hdF3_box(s, hdRamp('#3b3f52'), 9, 24, 36, 3, { layer: 5, R: 1, bias: 0.06 });
    const lip = hdF3_box(s, HDF3_CHROME, 8, 27, 38, 3, { layer: 5, R: 1, cast: 2 });
    /* two sheets of paper */
    const p1 = s.add(hdF3_soft('#fff7f1'), { layer: 3, R: 1, flat: 1, bias: 0.03 }); s.rect(p1, 51, 13, 18, 11);
    const p2 = s.add(hdF3_soft('#ffffff'), { layer: 4, R: 1, flat: 1, bias: 0.05, cast: 1 }); s.rect(p2, 54, 17, 18, 10);
    for (const y of [20, 23]) for (let x = 57; x < 69; x++) if (hdF3_h(x, y, 5) > 0.2) s.px(x, y, '#b8b0c0');
});
hdF3_def('f_work_table', 32, 28, 16, 27, s => {
    for (const x of [6, 75]) hdF3_leg(s, '#7a5234', x, 52, 9, 26);
    const apron = hdF3_box(s, hdF3_soft('#8a5a33'), 2, 47, 92, 7, { layer: 1, R: 2, grad: 0.15 }, 1);
    const top = hdF3_box(s, hdF3_soft('#b98552'), 0, 29, 96, 19, { layer: 2, R: 2, grad: 0.1, cast: 2 }, 2);
    hdF3_planks(s, top, 2, 93, [38], 15);
    hdF3_hl(s, top, 2, 93, 30, 2); hdF3_hl(s, top, 2, 93, 31, 1);
    hdF3_wood(s, apron, 16, false, 0.6);
    hdF3_over(s, o => {
        /* a mound of clay, a cut slab, and a wire tool lying across */
        const mound = o.add(hdF3_soft('#b07a5c'), { R: 6, k: 0.9, layer: 1, bias: 0.04 }); o.ellipse(mound, 23.5, 29, 12, 7); o.ellipse(mound, 21, 25.5, 6.5, 4.5); o.rect(mound, 12, 29, 24, 3);
        hdF3_speck(o, mound, 17, 0.04, -1);
        const slab = o.add(hdRamp('#c98f6b'), { R: 2, k: 1.3, layer: 1 }); hdF3_rr(o, slab, 42, 22, 18, 10, 1);
        hdF3_hl(o, slab, 43, 58, 23, 1); hdF3_hl(o, slab, 43, 58, 24, 1);
        const tool = o.add(HDF3_CHROME, { R: 1, k: 1.5, layer: 2 }); o.line(tool, 79, 20, 68, 31, 1.1);
        const grip = o.add(hdRamp('#b07a4a'), { R: 1, layer: 3 }); o.line(grip, 80, 19, 76.5, 22.5, 1.4);
    });
    hdF3_dots(s, [[20, 22], [21, 22], [19, 23]], '#d9a383');
    for (let x = 13; x < 36; x++) s.mod(x, 32, -1);
    for (let x = 43; x < 61; x++) s.mod(x, 32, -1);
    for (let x = 66; x < 72; x++) s.mod(x, 33, -1);
});
hdF3_def('f_workbench', 32, 28, 16, 27, s => {
    for (const x of [6, 78]) hdF3_leg(s, '#6b4225', x, 72, 9, 9);
    const front = hdF3_box(s, hdF3_soft('#a8733f'), 0, 42, 96, 33, { layer: 1, R: 2, grad: 0.12 });
    hdF3_wood(s, front, 21, false, 0.5);
    const top = hdF3_box(s, hdF3_soft('#d9a46a'), 0, 22, 96, 20, { layer: 2, R: 2, grad: 0.1, cast: 2 }, 2);
    hdF3_planks(s, top, 2, 93, [30], 22);
    hdF3_hl(s, top, 2, 93, 23, 2); hdF3_hl(s, top, 2, 93, 24, 1);
    const lip = hdF3_box(s, hdF3_soft('#93643b'), 0, 39, 96, 5, { layer: 3, R: 1, grad: 0, cast: 2 });
    hdF3_hl(s, lip, 1, 94, 39, 1);
    /* two drawers with brass pulls */
    for (const [x, w] of [[12, 33], [54, 18]]) {
        const d = hdF3_box(s, hdF3_soft('#8a5a33'), x, 48, w, 15, { layer: 2, R: 2, grad: 0.15 }, 1);
        hdF3_wood(s, d, x, false, 0.6); hdF3_hl(s, d, x + 1, x + w - 2, 49, 1);
        const p = s.add(HDF3_GOLD, { layer: 3, R: 1 }); s.rect(p, x + (w >> 1) - 2, 54, 5, 2);
    }
    hdF3_over(s, o => {
        /* the vise at the right end, its screw bar sticking out past the bench */
        const vb = o.add(hdRamp('#6b7385'), { R: 2, k: 1.4, layer: 1 }); hdF3_rr(o, vb, 75, 28, 18, 16, 1);
        const vj = o.add(HDF3_CHROME, { R: 2, k: 1.4, layer: 2 }); o.rect(vj, 78, 23, 12, 6);
        const bar = o.add(hdRamp('#4a5060'), { R: 1, k: 1.6, layer: 3 }); o.rect(bar, 72, 36, 24, 3);
        const knob = o.add(hdRamp('#4a5060'), { R: 1, layer: 3 }); o.rect(knob, 72, 34, 2, 7);
        /* a plank offcut, a steel square standing up and a pencil */
        const off = o.add(hdRamp('#8a5a33'), { R: 1, layer: 1 }); o.rect(off, 15, 30, 21, 6); hdF3_wood(o, off, 23, false, 0.8);
        const sq = o.add(HDF3_CHROME, { R: 1, k: 1.5, layer: 2 }); o.rect(sq, 36, 26, 9, 12); o.rect(sq, 36, 25, 3, 1);
        const pen = o.add(hdRamp('#ffd35a'), { R: 1, layer: 2 }); o.line(pen, 49, 36, 59, 31, 0.9);
        const er = o.add(hdRamp('#f2a6a6'), { R: 1, layer: 2 }); o.line(er, 60, 30.5, 62, 29.5, 0.9);
    });
    hdF3_dots(s, [[38, 27], [38, 28], [38, 29]], '#eef2f8');
    for (let x = 15; x < 36; x++) s.mod(x, 36, -1);
});
hdF3_def('f_sewing_table', 32, 30, 16, 29, s => {
    for (const x of [6, 84]) hdF3_leg(s, '#8a5a33', x, 54, 6, 25);
    const apron = hdF3_box(s, hdF3_soft('#a8733f'), 6, 52, 84, 9, { layer: 1, R: 2, grad: 0.15 }, 1);
    hdF3_wood(s, apron, 31, false, 0.6);
    const top = hdF3_box(s, hdF3_soft('#c98a55'), 0, 41, 96, 13, { layer: 2, R: 2, grad: 0.1, cast: 2 }, 2);
    hdF3_wood(s, top, 32, false, 0.8); hdF3_hl(s, top, 2, 93, 42, 2); hdF3_hl(s, top, 2, 93, 43, 1);
    const edge = hdF3_box(s, hdF3_soft('#8a5a33'), 0, 51, 96, 3, { layer: 3, R: 1, grad: 0, cast: 2 });
    /* the machine: the cream arm, the needle head at the left, the column with its wheel at the right, on a base */
    const CR = hdF3_soft('#f4efe6');
    const base = hdF3_box(s, CR, 15, 32, 57, 8, { layer: 3, R: 2, grad: 0.2 }, 2);
    const plate = hdF3_box(s, hdF3_soft('#d8d0c0'), 15, 38, 63, 4, { layer: 4, R: 1, grad: 0, cast: 1 });
    const col = hdF3_box(s, CR, 60, 5, 18, 31, { layer: 2, R: 4, grad: 0.1 }, 4);
    const arm = hdF3_box(s, CR, 18, 4, 50, 15, { layer: 3, R: 5, grad: 0.25, cast: 2 }, 5);
    const head = hdF3_box(s, CR, 18, 15, 15, 15, { layer: 3, R: 4, grad: 0.1 }, 2);
    hdF3_hl(s, arm, 24, 62, 6, 2); hdF3_hl(s, arm, 22, 64, 7, 1);
    /* the gold decal along the arm */
    for (let x = 36; x < 63; x++) { hdF3_rc(s, arm, x, 12, HDF3_GOLD); hdF3_rc(s, arm, x, 13, HDF3_GOLD); }
    /* the hand wheel */
    const wheel = s.add(HDF3_CHROME, { layer: 4, R: 3, k: 1.4 }); s.ellipse(wheel, 71.5, 17.5, 4.5, 8.5);
    const hub = s.add(hdRamp('#c8d0dc'), { layer: 5, R: 1 }); s.rect(hub, 71, 15, 3, 6);
    /* the needle, a spool of pink thread on top, purple cloth under the foot and over the table's edge */
    const nd = s.add(HDF3_CHROME, { layer: 4, R: 1 }); s.rect(nd, 24, 30, 2, 7);
    const spool = s.add(hdRamp('#ff8aa8'), { layer: 4, R: 2, k: 1.3 }); hdF3_rr(s, spool, 45, 0, 9, 5, 1);
    const sc = s.add(hdRamp('#ffc9d9'), { layer: 5, R: 1 }); s.rect(sc, 45, 0, 9, 2);
    const cloth = s.add(hdF3_soft('#b37cf0'), { layer: 5, R: 2, grad: 0.2 }); s.poly(cloth, [[28, 35], [48, 35], [47, 41], [46, 46], [31, 46], [30, 41]]);
    for (let y = 36; y < 46; y++) { hdF3_m(s, cloth, 35 + (y > 41 ? 1 : 0), y, -1); hdF3_m(s, cloth, 41, y, 1); }
    s.px(25, 37, '#ff8aa8');
});
/* a place setting: a white plate with a pale well, the fork at the left and the knife at the right */
hdF3_def('f_table_setting', 16, 16, 8, 15, s => {
    const plate = s.add(hdF3_soft('#ffffff'), { layer: 1, R: 4, k: 1.2, grad: 0.15 }); s.ellipse(plate, 24, 32.5, 15.5, 8.5);
    const well = s.add(hdF3_soft('#e8eef6'), { layer: 0, R: 3, k: 0.8, grad: -0.4 }); s.ellipse(well, 24, 32.5, 9.5, 4.8);
    hdF3_over(s, o => {
        const M = HDF3_CHROME;
        const fork = o.add(M, { R: 1, k: 1.5 }); o.rect(fork, 4, 31, 3, 13); o.rect(fork, 3, 25, 5, 6);
        for (let y = 22; y < 27; y++) { o.plot(fork, 3, y); o.plot(fork, 5, y); o.plot(fork, 7, y); }
        const knife = o.add(M, { R: 1, k: 1.5 }); o.rect(knife, 41, 32, 3, 12); hdF3_rr(o, knife, 41, 22, 4, 11, 1);
        o.px(42, 24, '#ffffff'); o.px(42, 25, '#ffffff');
    });
});

/* ---------------------------------------------------------------- the pink sofa and the silk cushion */
hdF3_def('f_sofa_pink', 32, 28, 16, 27, s => {
    for (const x of [6, 84]) { const l = hdF3_box(s, hdRamp('#6b4a3a'), x, 66, 6, 15, { layer: 0, R: 2, k: 1.4 }, 1); }
    const back = hdF3_box(s, hdF3_soft('#f2a0b8'), 3, 3, 90, 36, { layer: 1, R: 7, grad: 0.15 }, 8);
    const under = hdF3_box(s, hdF3_soft('#c96585'), 9, 62, 78, 7, { layer: 1, R: 2, grad: 0 });
    const cush = [];
    for (const x of [14, 48]) { const c = hdF3_box(s, hdF3_soft('#e0849f'), x, 36, 34, 30, { layer: 2, R: 5, grad: 0.15, cast: 2 }, 4); cush.push(c); hdF3_hl(s, c, x + 3, x + 30, 37, 2); hdF3_hl(s, c, x + 2, x + 31, 38, 2); hdF3_hl(s, c, x + 2, x + 31, 39, 1); }
    for (const x of [0, 81]) { const arm = s.add(hdF3_soft('#d97393'), { layer: 3, R: 6, grad: 0.2, cast: 1 }); hdF3_rr(s, arm, x, 24, 15, 47, 6); hdF3_hl(s, arm, x + 3, x + 11, 26, 1); }
    /* the back's seams behind the two cushions */
    hdF3_vl(s, back, 48, 10, 34, -1); hdF3_vl(s, back, 49, 10, 34, 1);
    hdF3_hl(s, back, 10, 85, 5, 1);
});
hdF3_def('f_silk_cushion', 16, 28, 8, 27, s => {
    const c = s.add(hdF3_soft('#e8a030'), { layer: 1, R: 9, k: 1.1, grad: 0.15 }); hdF3_rr(s, c, 0, 33, 48, 42, 10);
    const top = s.add(hdF3_soft('#f2c050'), { layer: 2, R: 10, k: 0.9, grad: 0.15 }); hdF3_rr(s, top, 7, 40, 34, 26, 8);
    /* creases running out from the button to the corners */
    hdF3_later(s, () => hdF3_each(s, top, (x, y, i) => {
        const dx = x - 24.5, dy = (y - 52.5) * 1.3, a = Math.atan2(dy, dx), r = Math.hypot(dx, dy);
        if (r > 3 && r < 16 && Math.abs(Math.cos(a * 2)) < 0.1) s.mods[i] -= 1;
    }));
    hdF3_over(s, o => { const b = o.add(hdRamp('#e0405a'), { R: 2, k: 1.4 }); o.ellipse(b, 24.5, 52.5, 2.8, 2.5); });
});

/* ---------------------------------------------------------------- kitchens */
/* the restaurant stove: a steel range with a dark cooktop, a pot steaming on the left, a pan on the right, two ovens */
hdF3_def('f_stove_pro', 32, 28, 16, 27, s => {
    const STEEL = hdF3_soft('#c8d0dc');
    const front = hdF3_box(s, STEEL, 0, 40, 96, 38, { layer: 1, R: 2, grad: 0.12 }, 1);
    const cook = hdF3_box(s, hdF3_soft('#3b3f52'), 0, 17, 96, 24, { layer: 2, R: 2, grad: 0.1, cast: 2 }, 2);
    const lip = hdF3_box(s, hdF3_soft('#6b7385'), 0, 17, 96, 4, { layer: 3, R: 1, grad: 0, bias: 0.06 }, 1);
    const edge = hdF3_box(s, hdF3_soft('#8a96a8'), 0, 38, 96, 4, { layer: 3, R: 1, grad: 0, cast: 2 });
    hdF3_hl(s, edge, 1, 94, 38, 1);
    /* burner rings on the cooktop under the pot and pan, and at the back */
    hdF3_later(s, () => hdF3_each(s, cook, (x, y, i) => { for (const [cx, cy] of [[24, 31], [66, 31]]) { const r = Math.hypot((x - cx) / 2.6, y - cy); if (r > 4.2 && r < 5.2) s.mods[i] += 1; } }));
    /* the oven doors: steel frames, a handle bar, a dark window */
    for (const x of [12, 51]) {
        const door = hdF3_box(s, hdF3_soft('#8a96a8'), x, 48, 33, 21, { layer: 2, R: 2, grad: 0.15 }, 1);
        const win = hdF3_box(s, hdPal('#2a2e3c', '#3b4152', '#4a5164', '#5c6478', '#8a94a8'), x + 4, 56, 25, 10, { layer: 3, flat: 1, grad: 0.3 }, 1);
        hdF3_glint(s, win, x + 4, 56, 25, 10, 0.2, 1);
        const bar = s.add(hdF3_soft('#e8eef6'), { layer: 4, R: 1, k: 1.5, cast: 1 }); hdF3_rr(s, bar, x + 2, 51, 29, 3, 1);
    }
    for (const x of [12, 27, 60, 75]) { const k = s.add(hdRamp('#e0405a'), { layer: 3, R: 2, k: 1.4 }); s.ellipse(k, x + 1.5, 44.5, 2.4, 2.2); }
    hdF3_hl(s, front, 2, 93, 41, 1); hdF3_vl(s, front, 48, 46, 72, -1); hdF3_vl(s, front, 49, 46, 72, 1);
    hdF3_over(s, o => {
        /* the stock pot with its handles, a little steam */
        const pot = o.add(hdF3_soft('#b8c4d0'), { R: 5, k: 1.3, layer: 1, grad: 0.15 }); o.rect(pot, 13, 8, 22, 15); o.ellipse(pot, 24, 22, 11, 2);
        const rim = o.add(hdRamp('#e8eef6'), { R: 2, k: 1.2, layer: 2 }); o.ellipse(rim, 24, 8.5, 11.5, 2.5);
        const inside = o.add(hdRamp('#6b7385'), { R: 2, layer: 3, flat: 1, bias: -0.1 }); o.ellipse(inside, 24, 8.5, 9, 1.4);
        for (const x of [7, 35]) { const h = o.add(hdRamp('#8a96a8'), { R: 1, layer: 2 }); hdF3_rr(o, h, x, 12, 6, 3, 1); }
        const st = o.add(hdF3_one('#f4f6fa'), { R: 1, layer: 4 });
        for (const [x0, y0] of [[22, 0], [27, 1]]) for (let y = y0; y < y0 + 5; y++) o.plot(st, x0 + Math.round(Math.sin(y * 1.1) * 1.2), y);
        /* the pan with a golden omelette */
        const pan = o.add(hdRamp('#4a4450'), { R: 2, k: 1.3, layer: 1 }); o.ellipse(pan, 63, 21, 12, 3.5); o.rect(pan, 75, 19, 9, 3);
        const egg = o.add(hdRamp('#ffd84a'), { R: 2, layer: 2 }); o.ellipse(egg, 62, 20, 7.5, 2);
        o.px(59, 19, '#fff4b0'); o.px(60, 19, '#fff4b0');
    });
});
/* the wok stove: a steel top with the wok and its wooden handle, a burner beside it, cream doors below */
hdF3_def('f_wok_stove', 32, 28, 16, 27, s => {
    const front = hdF3_box(s, hdF3_soft('#8a96a8'), 0, 44, 96, 40, { layer: 1, R: 2, grad: 0.12 });
    const top = hdF3_box(s, hdF3_soft('#b8c4d0'), 0, 21, 96, 24, { layer: 2, R: 2, grad: 0.1, cast: 2 }, 2);
    const edge = hdF3_box(s, hdF3_soft('#7f899b'), 0, 44, 96, 4, { layer: 3, R: 1, grad: 0, cast: 2 });
    hdF3_hl(s, top, 3, 92, 22, 2); hdF3_hl(s, top, 2, 93, 23, 1); hdF3_hl(s, edge, 1, 94, 44, 1);
    hdF3_glint(s, top, 50, 22, 40, 22, 0.75, 1);
    for (const x of [12, 54]) {
        const d = hdF3_box(s, hdF3_soft('#dcd4c4'), x, 51, 30, 24, { layer: 2, R: 2, grad: 0.15 }, 1);
        hdF3_hl(s, d, x + 1, x + 28, 52, 1);
        const h = s.add(hdF3_soft('#6b7385'), { layer: 3, R: 1 }); s.rect(h, x + 12, 55, 6, 2);
    }
    hdF3_over(s, o => {
        /* the wok: its dark rim, the seasoned steel inside, a wooden handle */
        const rim = o.add(hdRamp('#2d2a33'), { R: 3, k: 1.2, layer: 1 }); o.ellipse(rim, 26.5, 29.5, 18, 6.5);
        const bowl = o.add(hdRamp('#5a5660'), { R: 4, layer: 2, grad: -0.5, k: 1 }); o.ellipse(bowl, 26.5, 29, 15, 4.5);
        const veg = [['#8cc152', 22, 29], ['#e0405a', 28, 28], ['#ffd84a', 31, 30], ['#8cc152', 25, 31]];
        for (const [c, x, y] of veg) { const v = o.add(hdRamp(c), { R: 1, layer: 3 }); o.ellipse(v, x, y, 1.8, 1.2); }
        const hd = o.add(hdRamp('#6b4a35'), { R: 1, k: 1.4, layer: 2 }); hdF3_rr(o, hd, 44, 27, 16, 4, 2);
        /* the burner: a dark ring with a grate across it */
        const br = o.add(hdRamp('#3b3f52'), { R: 3, k: 1.3, layer: 1 }); o.ellipse(br, 72, 32.5, 9.5, 6);
        const ring = o.add(hdRamp('#2a2c38'), { R: 2, layer: 2, grad: -0.3 }); o.ellipse(ring, 72, 32.5, 6, 3.6);
        const gr = o.add(hdRamp('#4a5060'), { R: 1, layer: 3 }); o.rect(gr, 63, 32, 19, 1); o.rect(gr, 71, 27, 2, 12);
    });
});
/* the rice cooker: a domed lid with a grey knob, a cream body, a red panel and a little green light */
hdF3_def('f_rice_cooker', 16, 16, 8, 15, s => {
    const body = s.add(hdF3_soft('#f7f3ea'), { layer: 1, R: 7, k: 1, grad: 0.15 }); hdF3_rr(s, body, 9, 16, 30, 26, 6); s.rect(body, 12, 38, 24, 4);
    const lid = s.add(hdF3_soft('#e8eef6'), { layer: 2, R: 6, k: 1.1, grad: 0.2, cast: 2 }); s.ellipse(lid, 24, 18, 15, 9); s.rect(lid, 9, 17, 30, 3);
    const knob = s.add(hdRamp('#8a96a8'), { layer: 3, R: 2, k: 1.4 }); hdF3_rr(s, knob, 21, 3, 6, 6, 2);
    const panel = s.add(hdRamp('#e0405a'), { layer: 3, R: 2, k: 1.2 }); hdF3_rr(s, panel, 13, 27, 21, 6, 2);
    hdF3_hl(s, panel, 15, 31, 28, 1);
    hdF3_hl(s, body, 11, 36, 22, -1);
    s.px(13, 37, '#8cc152'); s.px(14, 37, '#8cc152'); s.px(13, 36, '#c8f0a0');
});
/* the bamboo steamer stack: a woven lid, three tiers with pale rims and dark bands */
hdF3_def('f_steamer_stack', 16, 16, 8, 15, s => {
    for (let k = 0; k < 3; k++) {
        const y = 9 + k * 12;
        const body = hdF3_box(s, hdF3_soft('#d9b070'), 3, y, 42, 9, { layer: 1 + k, R: 2, grad: 0.1 }, 2);
        for (let x = 6; x < 43; x += 4) hdF3_vl(s, body, x, y + 1, y + 7, -1);
        hdF3_box(s, hdF3_soft('#a8803a'), 3, y + 7, 42, 4, { layer: 1 + k, R: 1, grad: 0 }, 1);
        hdF3_box(s, hdF3_soft('#f2d098'), 3, y - 1, 42, 3, { layer: 2 + k, R: 1, grad: 0, cast: 1 }, 1);
    }
    /* the lid: a low woven dome */
    const lid = s.add(hdF3_soft('#c9a060'), { layer: 5, R: 4, k: 1, grad: 0.25, cast: 2 }); s.ellipse(lid, 24, 7, 19, 7); s.rect(lid, 5, 5, 38, 4);
    hdF3_later(s, () => hdF3_each(s, lid, (x, y, i) => { if (y > 1 && (((x + y * 2) % 6 === 0) || ((x - y * 2 + 60) % 6 === 0))) s.mods[i] -= 1; }));
    hdF3_box(s, hdF3_soft('#f2d098'), 3, 7, 42, 3, { layer: 6, R: 1, grad: 0 }, 1);
});
/* the sushi conveyor: a steel frame round a slatted belt carrying salmon nigiri (the belt's moving plates are drawn
   over it by code, along the same rows), a steel front */
hdF3_def('f_sushi_conveyor', 48, 28, 24, 27, s => {
    const front = hdF3_box(s, hdF3_soft('#8a96a8'), 0, 48, 144, 36, { layer: 1, R: 2, grad: 0.12 });
    for (const x of [36, 72, 108]) { hdF3_vl(s, front, x, 51, 81, -1); hdF3_vl(s, front, x + 1, 51, 81, 1); }
    const frame = hdF3_box(s, hdF3_soft('#b8c4d0'), 0, 21, 144, 28, { layer: 2, R: 2, grad: 0.15, cast: 2 }, 2);
    const belt = hdF3_box(s, hdF3_soft('#dce4ec'), 6, 28, 132, 14, { layer: 1, R: 2, grad: -0.2, flat: 1 });
    for (let x = 9; x < 138; x += 4) hdF3_vl(s, belt, x, 29, 40, -1);
    const edge = hdF3_box(s, hdF3_soft('#7f899b'), 0, 47, 144, 3, { layer: 3, R: 1, grad: 0 });
    hdF3_hl(s, frame, 3, 140, 22, 2); hdF3_hl(s, frame, 2, 141, 23, 1); hdF3_hl(s, frame, 2, 141, 44, 1);
    hdF3_over(s, o => {
        for (let k = 0; k < 5; k++) {
            const x = 12 + k * 24;
            const plate = o.add(hdRamp('#ffffff'), { R: 2, layer: 1 }); o.ellipse(plate, x + 6, 37.5, 7.5, 2.5);
            const rice = o.add(hdRamp('#fbf8f2'), { R: 3, k: 1.1, layer: 2 }); hdF3_rr(o, rice, x + 1, 31, 11, 6, 3);
            const fish = o.add(hdRamp('#f28a6b'), { R: 2, k: 1.2, layer: 3 }); hdF3_rr(o, fish, x, 28, 13, 5, 2);
            for (let j = 0; j < 3; j++) o.px(x + 3 + j * 3, 30, '#ffc8b0');
        }
    });
});
/* the sushi counter: a dark green back ledge, a pale hinoki top, a slatted dark wood front */
hdF3_def('f_sushi_counter', 48, 28, 24, 27, s => {
    const front = hdF3_box(s, hdF3_soft('#6b4a35'), 0, 45, 144, 39, { layer: 1, R: 2, grad: 0.1 });
    for (let x = 12; x < 130; x += 18) { hdF3_vl(s, front, x, 48, 80, -2); hdF3_vl(s, front, x + 1, 48, 80, -1); hdF3_vl(s, front, x + 2, 48, 80, 1); }
    hdF3_wood(s, front, 41, true, 0.45);
    const ledge = hdF3_box(s, hdF3_soft('#34473e'), 12, 3, 120, 19, { layer: 2, R: 3, grad: 0.15 }, 3);
    const lt = hdF3_box(s, hdF3_soft('#4a6a5a'), 12, 3, 120, 4, { layer: 3, R: 1, grad: 0, bias: 0.05 }, 2);
    const top = hdF3_box(s, hdF3_soft('#e8d4b0'), 0, 21, 144, 25, { layer: 3, R: 2, grad: 0.1, cast: 2 }, 2);
    hdF3_wood(s, top, 42, false, 0.7);
    const rim = hdF3_box(s, hdF3_soft('#fff0d0'), 0, 21, 144, 4, { layer: 4, R: 1, grad: 0 }, 2);
    const edge = hdF3_box(s, hdF3_soft('#634434'), 0, 44, 144, 4, { layer: 4, R: 1, grad: 0, cast: 2 });
    hdF3_hl(s, edge, 1, 142, 44, 1);
});

/* ---------------------------------------------------------------- shop and arcade displays */
/* a little plush face: two dark eyes with a glint, pink cheeks, a small mouth (brows when cross) */
function hdF3_face(s, cx, cy, gap, o) {
    o = o || {};
    for (const d of [-1, 1]) {
        const x = Math.round(cx + d * gap);
        s.px(x, cy, o.eye || '#231418'); s.px(x, cy + 1, o.eye || '#231418'); s.px(x - 1, cy, o.eye || '#231418'); s.px(x - 1, cy + 1, o.eye || '#231418');
        s.px(x - 1, cy, '#ffffff');
        if (o.brow) { s.px(x - d, cy - 2, o.brow); s.px(x, cy - 2 + (d < 0 ? 0 : 0), o.brow); s.px(x + d, cy - 1, o.brow); }
        if (o.blush) { s.px(x + d * 2, cy + 3, o.blush); s.px(x + d * 2 + d, cy + 3, o.blush); }
    }
    if (o.mouth) { s.px(Math.round(cx) - 1, cy + 4, o.mouth); s.px(Math.round(cx), cy + 4, o.mouth); }
}
hdF3_def('f_prize_shelf', 32, 16, 16, 15, s => {
    hdF3_over(s, o => {
        /* Maki: a seaweed roll with rice and salmon on top */
        const nori = o.add(hdRamp('#34473e'), { R: 5, k: 1.1, layer: 1, grad: 0.2 }); hdF3_rr(o, nori, 4, 14, 24, 21, 5);
        const rice = o.add(hdRamp('#fbfaf2'), { R: 3, layer: 2, grad: 0.1 }); o.ellipse(rice, 16, 15, 11.5, 4);
        const fish = o.add(hdRamp('#f2896b'), { R: 2, layer: 3 }); o.ellipse(fish, 16, 15, 5, 2);
        const cuke = o.add(hdRamp('#9dc45f'), { R: 1, layer: 4 }); o.ellipse(cuke, 16.5, 15, 1.6, 1.2);
        /* Wonton: a pleated dumpling */
        const dump = o.add(hdRamp('#f8e8b8'), { R: 7, k: 1, layer: 1, grad: 0.15 }); o.ellipse(dump, 39.5, 27, 11, 8.5); o.ellipse(dump, 39.5, 19.5, 5, 5);
        const tip = o.add(hdRamp('#e3c888'), { R: 1, layer: 2 }); o.poly(tip, [[37, 18], [42, 18], [40, 14]]);
        for (const x of [35, 44]) o.recolor(x, 21, '#e3c888');
        /* Chili: a red pepper with a green stem and cross brows */
        const pep = o.add(hdRamp('#e2382b'), { R: 6, k: 1.1, layer: 1, grad: 0.15 }); o.ellipse(pep, 62, 21, 10, 11); o.poly(pep, [[54, 26], [70, 26], [63, 35], [61, 35]]);
        const stem = o.add(hdRamp('#5aa844'), { R: 2, layer: 2 }); o.poly(stem, [[56, 10], [68, 10], [64, 13], [60, 13]]); o.rect(stem, 61, 4, 3, 7);
        /* Coco: a round chocolate with a pink bow */
        const choc = o.add(hdRamp('#6e3f25'), { R: 6, k: 1.1, layer: 1, grad: 0.2 }); hdF3_rr(o, choc, 77, 14, 19, 20, 6);
        hdF3_speck(o, choc, 3, 0.06, 1);
        const bow = o.add(hdRamp('#ff7fb0'), { R: 2, layer: 2 }); o.ellipse(bow, 82, 13, 3.5, 2.5); o.ellipse(bow, 90, 13, 3.5, 2.5);
        const knot = o.add(hdRamp('#ffc4db'), { R: 1, layer: 3 }); o.ellipse(knot, 86, 13, 1.8, 1.8);
        /* feet peeking under each plush */
        const ft = o.add(hdRamp('#3a2a2e'), { R: 1, layer: 0 });
        for (const x of [9, 20, 34, 43, 58, 65, 81, 90]) o.rect(ft, x, 34, 3, 2);
        /* the shelf */
        const top = o.add(hdF3_soft('#8a6ae0'), { R: 1, layer: 5, grad: 0, bias: 0.05 }); o.rect(top, 3, 35, 90, 2);
        const board = o.add(hdF3_soft('#6b4ac9'), { R: 2, layer: 6, grad: 0.1 }); hdF3_rr(o, board, 3, 36, 90, 6, 1);
    });
    hdF3_face(s, 16, 23, 4, { blush: '#ff9aa8', mouth: '#e05a6a' });
    hdF3_face(s, 40, 25, 4, { blush: '#ff9aa8', mouth: '#5a1f28' });
    hdF3_face(s, 62, 22, 4, { eye: '#3b0d0b', brow: '#3b0d0b', mouth: '#5a1f28' });
    hdF3_face(s, 86.5, 23, 4, { eye: '#140a06', blush: '#ff9aa8', mouth: '#ff9aa8' });
});
/* Sully's pots on a plank: a blue vase, a tall orange bottle, a sage jar, a white jug and a little lilac pot */
hdF3_def('f_pottery_shelf', 32, 16, 16, 15, s => {
    hdF3_over(s, o => {
        const V = (col, pts, seed) => { const p = o.add(hdRamp(col), { R: 4, k: 1.2, layer: 1, grad: 0.12 }); o.poly(p, pts); hdF3_speck(o, p, seed, 0.04, -1); return p; };
        V('#2f5da8', [[12, 12], [17, 12], [17, 15], [21, 20], [21, 33], [19, 36], [10, 36], [8, 33], [8, 20], [12, 15]], 1);
        V('#e0784a', [[32, 3], [37, 3], [37, 10], [41, 14], [41, 34], [39, 36], [30, 36], [28, 34], [28, 14], [32, 10]], 2);
        V('#8fc4a1', [[45, 15], [51, 15], [54, 19], [54, 33], [52, 36], [44, 36], [42, 33], [42, 19]], 3);
        V('#f4efe6', [[62, 9], [68, 9], [71, 13], [72, 33], [70, 36], [61, 36], [59, 33], [59, 13]], 4);
        V('#b39ae0', [[80, 18], [87, 18], [90, 22], [90, 33], [88, 36], [79, 36], [77, 33], [77, 22]], 5);
        /* glaze bands and lips */
        for (const [x0, x1, y, c] of [[9, 20, 24, '#a8c4f0'], [29, 40, 22, '#f8b088'], [43, 53, 26, '#d0ecd8'], [60, 71, 20, '#c8a070'], [78, 89, 27, '#e4d8f8']]) for (let x = x0; x <= x1; x++) { o.recolor(x, y, c); o.recolor(x, y + 1, c); }
        const top = o.add(hdF3_soft('#b08050'), { R: 1, layer: 5, grad: 0, bias: 0.05 }); o.rect(top, 3, 35, 90, 2);
        const board = o.add(hdF3_soft('#9a6b3a'), { R: 2, layer: 6, grad: 0.1 }); hdF3_rr(o, board, 3, 36, 90, 6, 1);
        hdF3_wood(o, board, 14, false, 0.8);
    });
    for (const [x, y] of [[13, 12], [33, 3], [46, 15], [63, 9], [81, 18]]) { s.px(x, y, '#3a2a30'); s.px(x + 1, y, '#3a2a30'); s.px(x + 2, y, '#3a2a30'); }
});
/* the running shoe rack: two shelves of sneakers in today's colors */
function hdF3_shoe(o, x, y, col) {
    const up = o.add(hdRamp(col), { R: 3, k: 1.2, layer: 1, grad: 0.2 }); o.poly(up, [[x, y + 1], [x + 5, y], [x + 7, y + 3], [x + 12, y + 4], [x + 13, y + 8], [x, y + 8]]);
    const sole = o.add(hdRamp('#ffffff'), { R: 1, layer: 2, grad: 0 }); o.rect(sole, x, y + 7, 14, 2);
    o.px(x + 6, y + 3, '#ffffff'); o.px(x + 8, y + 4, '#ffffff');
}
hdF3_def('f_shoe_rack', 16, 28, 8, 27, s => {
    const fr = hdF3_box(s, hdF3_soft('#9a6b3a'), 0, 33, 48, 45, { layer: 2, R: 2, grad: 0.12 }, 2);
    hdF3_wood(s, fr, 51, true, 0.6);
    for (const y of [39, 60]) { const b = hdF3_box(s, hdF3_soft('#6b4a2a'), 6, y, 36, 15, { layer: 1, R: 3, grad: -0.4 }); }
    hdF3_hl(s, fr, 2, 45, 34, 1); hdF3_hl(s, fr, 3, 44, 55, 1); hdF3_hl(s, fr, 3, 44, 76, 1);
    hdF3_over(s, o => { hdF3_shoe(o, 7, 44, '#e84a5a'); hdF3_shoe(o, 24, 44, '#4ec3d9'); hdF3_shoe(o, 7, 65, '#8cc152'); hdF3_shoe(o, 24, 65, '#ffd84a'); });
});
/* the roller skate stand: two white skates with rainbow wheels on a wooden block */
hdF3_def('f_skates_display', 16, 28, 8, 27, s => {
    const block = hdF3_box(s, hdF3_soft('#8a5a33'), 3, 59, 42, 19, { layer: 1, R: 2, grad: 0.15 }, 2);
    hdF3_wood(s, block, 61, false, 0.7); hdF3_hl(s, block, 5, 42, 60, 1); hdF3_hl(s, block, 5, 42, 61, 1);
    hdF3_over(s, o => {
        const W = hdPal('#7a7088', '#d8d4e4', '#f6f4fa', '#ffffff', '#ffffff');
        for (const [dx, L] of [[18, 1], [0, 2]]) {
            const boot = o.add(W, { R: 4, k: 1.2, layer: L, grad: 0.15 }); hdF3_rr(o, boot, 9 + dx, 21, 13, 27, 3); hdF3_rr(o, boot, 9 + dx, 41, 22 + (dx ? 4 : 0), 13, 5);
            const cuff = o.add(hdRamp('#ff5a6a'), { R: 1, layer: L }); o.rect(cuff, 9 + dx, 21, 13, 3);
            for (let y = 28; y < 42; y += 4) { o.px(14 + dx, y, '#c8c4d4'); o.px(17 + dx, y, '#c8c4d4'); }
            const plate = o.add(HDF3_CHROME, { R: 1, layer: L }); o.rect(plate, 9 + dx, 54, 22, 2);
        }
    });
    hdF3_over(s, o => { for (const [x, c] of [[10.5, '#ff5a6a'], [16.5, '#ffd84a'], [22.5, '#4ea8f0'], [28.5, '#ff5a6a'], [34.5, '#ffd84a'], [40.5, '#4ea8f0']]) { const w = o.add(hdRamp(c), { R: 2, k: 1.3 }); o.ellipse(w, x, 57.5, 2.8, 2.6); } });
});
/* the snack machine: a red cabinet, a glass front with rows of snacks, the keypad and the pick-up flap */
hdF3_def('f_snack_machine', 16, 30, 8, 29, s => {
    const body = hdF3_box(s, hdF3_soft('#e0405a'), 0, 0, 48, 87, { layer: 1, R: 3, grad: 0.12 }, 3);
    hdF3_hl(s, body, 3, 44, 1, 1); hdF3_vl(s, body, 1, 3, 84, 1);
    const glass = hdF3_box(s, hdPal('#7aa0b4', '#b8dcea', '#dff2fa', '#eef8fc', '#ffffff'), 8, 8, 23, 56, { layer: 2, flat: 1, grad: 0.15 }, 1);
    const pad = hdF3_box(s, hdRamp('#1c1a24'), 33, 14, 10, 25, { layer: 2, R: 2, k: 1.2 }, 1);
    const bin = hdF3_box(s, hdRamp('#1c1a24'), 8, 68, 32, 10, { layer: 2, R: 2, k: 1.2 }, 2);
    const flap = hdF3_box(s, hdF3_soft('#3b3a48'), 10, 69, 28, 4, { layer: 3, R: 1, grad: 0, bias: 0.08 });
    hdF3_over(s, o => {
        /* three shelves of snacks: green bags, yellow bars, orange packs */
        for (const [y, c, h] of [[17, '#8cc152', 9], [32, '#ffd84a', 7], [47, '#f28a6b', 9]]) {
            for (const x of [11, 20]) { const p = o.add(hdRamp(c), { R: 2, k: 1.2 }); hdF3_rr(o, p, x, y, 7, h, 2); o.px(x + 1, y + 1, '#ffffff'); }
            const coil = o.add(HDF3_CHROME, { R: 1 }); o.rect(coil, 9, y + h + 1, 21, 2);
        }
    });
    hdF3_glint(s, glass, 8, 8, 23, 56, 0.05, 1);
    s.px(37, 21, '#8cc152'); s.px(38, 21, '#8cc152'); s.px(37, 22, '#c8f0a0');
    for (let k = 0; k < 6; k++) { s.px(36 + (k % 2) * 3, 26 + (k >> 1) * 3, '#8a8898'); s.px(37 + (k % 2) * 3, 26 + (k >> 1) * 3, '#8a8898'); }
    for (let y = 16; y < 19; y++) s.px(40, y, '#5a5868');
});
/* the shell display case: a cream lid, a glass front with four shells inside, a wooden base */
hdF3_def('f_shell_display', 32, 28, 16, 27, s => {
    const base = hdF3_box(s, hdF3_soft('#c7a57c'), 0, 27, 96, 57, { layer: 1, R: 2, grad: 0.1 });
    hdF3_wood(s, base, 71, false, 0.6);
    const panel = hdF3_box(s, hdF3_soft('#b69673'), 8, 59, 80, 20, { layer: 2, R: 2, grad: 0.15 }, 1);
    hdF3_hl(s, panel, 9, 86, 59, 1);
    const glass = hdF3_box(s, hdPal('#86b4c8', '#c4e6f2', '#dff2fa', '#eef8fc', '#ffffff'), 7, 27, 82, 27, { layer: 2, flat: 1, grad: -0.1 });
    const lid = hdF3_box(s, hdF3_soft('#f7f3ea'), 0, 15, 96, 12, { layer: 3, R: 2, grad: 0.15, cast: 2 }, 2);
    hdF3_hl(s, lid, 2, 93, 16, 1);
    hdF3_over(s, o => {
        /* a peach scallop, a cream conch, a pink scallop, a mint cowrie */
        const sc = (cx, c) => { const p = o.add(hdRamp(c), { R: 3, k: 1.2 }); o.poly(p, [[cx - 6, 41], [cx, 36], [cx + 6, 41], [cx + 4, 47], [cx - 4, 47]]); o.rect(p, cx - 2, 47, 5, 2); for (let y = 38; y < 47; y++) for (const d of [-3, 0, 3]) o.recolor(cx + Math.round(d * (y - 36) / 10), y, hdRamp(hdF3_mix(c, '#000000', 0.15))); };
        sc(17, '#ffb08a'); sc(63, '#ff7a8a');
        const conch = o.add(hdRamp('#f2dcc0'), { R: 3, k: 1.2 }); o.ellipse(conch, 39, 43, 6, 5); o.poly(conch, [[37, 38], [45, 36], [43, 40]]);
        o.recolor(38, 42, '#d8b898'); o.recolor(39, 43, '#d8b898'); o.recolor(40, 42, '#d8b898'); o.recolor(40, 44, '#ffc8a8');
        const cow = o.add(hdRamp('#9fe0c8'), { R: 4, k: 1.2 }); o.ellipse(cow, 79, 43, 6, 4.5);
        for (let x = 75; x < 84; x++) o.recolor(x, 44, '#6ab89c');
    });
    hdF3_glint(s, glass, 7, 28, 82, 25, 0.62, 1);
    for (const [x0, x1] of [[12, 23], [33, 45], [58, 69], [73, 85]]) for (let x = x0; x <= x1; x++) s.mod(x, 50, -1);
});
/* the velvet rope: two brass posts with ball tops and the red rope sagging between them */
hdF3_def('f_velvet_rope', 32, 28, 16, 27, s => {
    const B = hdPal('#7a5a18', '#c09a38', '#f2d880', '#fae8a8', '#fff8dc');
    for (const cx of [10.5, 85.5]) {
        const post = s.add(B, { layer: 1, R: 3, k: 1.6, grad: 0.05 }); s.rect(post, cx - 4.5, 24, 9, 48);
        const ball = s.add(B, { layer: 2, R: 6, k: 1.3 }); s.ellipse(ball, cx, 17, 8, 8.5); s.rect(ball, cx - 1.5, 9, 3, 2);
        const base = s.add(hdPal('#5a4010', '#9a7820', '#b8942a', '#d8b850', '#f0d878'), { layer: 2, R: 3, k: 1.3, grad: 0.3 }); hdF3_rr(s, base, cx - 7.5, 72, 15, 9, 3);
        const ring = s.add(B, { layer: 2, R: 2, k: 1.4 }); s.rect(ring, cx - 5.5, 29, 11, 4);
    }
    const rope = s.add(hdPal('#4a0c1c', '#8a1f34', '#c0304a', '#d85068', '#f08098'), { layer: 3, R: 3, k: 1.3 });
    for (let i = 0; i <= 80; i++) { const t = i / 80, x = 16 + t * 64, y = 32 + 11.5 * Math.sin(Math.PI * t); s.ellipse(rope, x, y, 3.3, 3.3); }
    /* the twist of the rope */
    hdF3_later(s, () => hdF3_each(s, rope, (x, y, i) => { if ((x + y * 1.4) % 5 < 1.2) s.mods[i] -= 1; }));
    for (const cx of [17, 79]) { const h = s.add(B, { layer: 4, R: 1 }); hdF3_rr(s, h, cx - 2, 29, 5, 5, 1); }
});

/* ---------------------------------------------------------------- little things on tables and walls */
/* a vase of roses: three red blooms over green stems in a glass of water */
hdF3_def('f_rose_vase', 16, 16, 8, 15, s => {
    const glass = s.add(HDF3_GLASS, { layer: 1, R: 4, k: 0.9, grad: 0.2 }); hdF3_rr(s, glass, 13, 26, 22, 19, 4);
    const water = s.add(hdPal('#4f8cb0', '#7cbcd8', '#9fd8ef', '#c0e8f6', '#e8f8ff'), { layer: 2, R: 3, k: 0.8, grad: 0.1 }); hdF3_rr(s, water, 15, 31, 18, 12, 3);
    hdF3_hl(s, glass, 15, 32, 27, 1);
    hdF3_over(s, o => {
        const st = o.add(hdRamp('#4f9a3f'), { R: 1, layer: 1 });
        for (const [x0, x1] of [[19, 21], [24, 24], [29, 27]]) o.line(st, x0, 17, x1, 38, 0.8);
        const leaf = o.add(hdRamp('#4f9a3f'), { R: 2, layer: 2 }); o.ellipse(leaf, 16.5, 21, 3, 1.6); o.ellipse(leaf, 31, 19, 3, 1.6);
        for (const [x, y, r] of [[21, 9, 6], [31, 8, 5.5], [26, 15, 5.5]]) {
            const b = o.add(hdRamp('#e0333f'), { R: 3, k: 1.2, layer: 3 }); o.ellipse(b, x, y, r, r * 0.9);
            hdF3_later(o, () => hdF3_each(o, b, (px, py, i) => { const a = Math.atan2(py - y, px - x), d = Math.hypot(px - x, py - y); if (Math.abs(((d * 1.3 + a * 1.2) % 3.1)) < 0.7 && d < r - 1) o.mods[i] -= 1; }));
        }
    });
    hdF3_dots(s, [[16, 29], [16, 30], [16, 33]], '#ffffff');
});
/* the shell lamp: a fluted shell shade in two peaches over a driftwood stem and base */
hdF3_def('f_shell_lamp', 16, 16, 8, 15, s => {
    const stem = hdF3_box(s, hdF3_soft('#d9b88a'), 21, 22, 6, 16, { layer: 1, R: 2, k: 1.4 });
    const base = s.add(hdF3_soft('#c9a47a'), { layer: 2, R: 3, k: 1.2, grad: 0.3 }); hdF3_rr(s, base, 12, 37, 24, 8, 3);
    const shade = s.add(hdPal('#c07850', '#ffb89a', '#ffd0b0', '#ffe2cc', '#fff4e8'), { layer: 3, R: 4, k: 1, grad: 0.15, cast: 2 });
    s.poly(shade, [[22, 1], [26, 1], [47, 21], [46, 24], [2, 24], [1, 21]]);
    /* the shell's ribs fanning out from the top, and its scalloped hem */
    hdF3_later(s, () => hdF3_each(s, shade, (x, y, i) => { const a = (x - 24) / (y + 2); if (Math.abs(((a * 6 + 60) % 1) - 0.5) > 0.42 && y > 4) s.mods[i] -= 1; if ((y % 6) === 2) s.mods[i] -= 1; }));
    for (let x = 4; x < 46; x += 6) { s.erase(x, 24); s.erase(x + 1, 24); }
});
/* the shell mirror: a scalloped peach frame with eight pearls round a round glass */
hdF3_def('f_shell_mirror', 16, 16, 8, 15, s => {
    const fr = s.add(hdPal('#a8604a', '#f08c6c', '#ffb08a', '#ffc8a8', '#ffe2cc'), { layer: 1, R: 5, k: 1.3, grad: 0.15 });
    for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) { const dx = x + 0.5 - 24, dy = y + 0.5 - 24, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx); if (r < 22.6 + 1.4 * Math.cos(a * 12)) s.plot(fr, x, y); }
    const glass = s.add(HDF3_GLASS, { layer: 2, R: 6, k: 0.7, grad: 0.35 }); s.ellipse(glass, 24, 24, 12.5, 12.5);
    hdF3_later(s, () => hdF3_each(s, glass, (x, y, i) => { const q = x + y; if (q > 34 && q < 38) s.mods[i] += 2; else if (q > 39 && q < 41) s.mods[i] += 1; }));
    hdF3_later(s, () => hdF3_each(s, fr, (x, y, i) => { const a = Math.atan2(y - 24, x - 24), r = Math.hypot(x - 24, y - 24); if (r > 15 && Math.abs(Math.sin(a * 6)) < 0.12) s.mods[i] -= 1; }));
    hdF3_over(s, o => { const P = hdPal('#a08878', '#e0d0c4', '#fff0e0', '#fffaf2', '#ffffff'); for (let k = 0; k < 8; k++) { const a = -Math.PI / 2 + k * Math.PI / 4, p = o.add(P, { R: 2, k: 1.5 }); o.ellipse(p, 24 + Math.cos(a) * 17.5, 24 + Math.sin(a) * 17.5, 2.5, 2.5); } });
});
/* the snow globe: a glass ball with a little fir in the snow, flakes, on a wooden base */
hdF3_def('f_snow_globe', 16, 16, 8, 15, s => {
    const ball = s.add(hdPal('#86aebf', '#c2e2ee', '#dff2fa', '#eef9fd', '#ffffff'), { layer: 1, R: 9, k: 0.7, grad: 0.25 }); s.ellipse(ball, 24, 19, 17.5, 17);
    const base = s.add(hdF3_soft('#8a5a33'), { layer: 3, R: 3, k: 1.2, grad: 0.2, cast: 1 }); hdF3_rr(s, base, 9, 35, 30, 10, 3);
    hdF3_wood(s, base, 81, false, 0.7); hdF3_hl(s, base, 11, 36, 36, 1);
    hdF3_over(s, o => {
        const snow = o.add(hdRamp('#ffffff'), { R: 3, layer: 1, grad: 0.1 }); o.ellipse(snow, 24, 33, 13, 3.5);
        const fir = o.add(hdRamp('#3f8a5a'), { R: 2, k: 1.2, layer: 2 });
        o.poly(fir, [[17, 12], [24, 31], [10, 31]]); o.poly(fir, [[17, 9], [22, 22], [12, 22]]);
        const tr = o.add(hdRamp('#6b4a2a'), { R: 1, layer: 1 }); o.rect(tr, 16, 30, 3, 3);
        const hut = o.add(hdRamp('#e0405a'), { R: 1, layer: 2 }); o.rect(hut, 27, 26, 7, 6);
        const roof = o.add(hdRamp('#ffffff'), { R: 1, layer: 3 }); o.poly(roof, [[25.5, 26.5], [30.5, 22], [35.5, 26.5]]);
    });
    for (const [x, y] of [[13, 10], [31, 9], [35, 17], [21, 6], [11, 20], [28, 15], [36, 25]]) s.px(x, y, '#ffffff');
    hdF3_glint(s, ball, 10, 5, 12, 14, 0.2, 1);
    hdF3_dots(s, [[14, 8], [13, 9], [12, 10], [12, 11]], '#ffffff');
});
/* a stack of poems: loose sheets and bundles in creams, a red ribbon marking the top one */
hdF3_def('f_sonnet_stack', 16, 16, 8, 15, s => {
    const L = [[8, 3, 36, 12, '#e8dcc8'], [5, 15, 36, 9, '#fff7f1'], [8, 24, 36, 9, '#f2e8d8'], [5, 33, 36, 9, '#fff7f1']];
    L.forEach(([x, y, w, h, c], k) => {
        const p = hdF3_box(s, hdF3_soft(c), x, y, w, h, { layer: 1 + k, R: 2, grad: 0.15, cast: 1 }, 1);
        for (let yy = y + 3; yy < y + h - 2; yy += 3) for (let xx = x + 3; xx < x + w - 4; xx++) if (hdF3_h(xx >> 1, yy, k) > 0.25) hdF3_rc(s, p, xx, yy, '#c9b8a8');
        hdF3_hl(s, p, x + 1, x + w - 2, y + h - 2, -1);
    });
    const rib = s.add(hdRamp('#e0405a'), { layer: 6, R: 1 }); s.rect(rib, 37, 3, 3, 15); s.poly(rib, [[37, 18], [40, 18], [40, 21], [38.5, 19.5], [37, 21]]);
});
/* a jar of star fragments: glowing yellow stars in a glass jar under a cork lid */
function hdF3_star(o, id, cx, cy, r) { const pts = []; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } o.poly(id, pts); }
hdF3_def('f_star_jar', 16, 16, 8, 15, s => {
    const glass = s.add(hdPal('#7aa8bc', '#bce0ee', '#dff2fa', '#eef9fd', '#ffffff'), { layer: 1, R: 5, k: 0.8, grad: 0.2 }); hdF3_rr(s, glass, 12, 11, 30, 32, 5);
    const lid = s.add(hdF3_soft('#c9a462'), { layer: 2, R: 2, k: 1.2, grad: 0.3, cast: 2 }); hdF3_rr(s, lid, 14, 3, 26, 10, 2);
    hdF3_hl(s, lid, 16, 37, 4, 1); hdF3_hl(s, lid, 15, 38, 9, -1);
    hdF3_over(s, o => {
        const S = hdPal('#c08a20', '#f0c040', '#ffd84a', '#ffec90', '#fffbe0');
        for (const [x, y, r] of [[34, 19, 3.6], [22, 23, 3.6], [31, 29, 3.4], [25, 35, 3.6], [17, 31, 2.6], [36, 37, 2.6], [20, 16, 2.4]]) { const p = o.add(S, { R: 2, k: 1.1 }); hdF3_star(o, p, x, y, r); }
    });
    hdF3_glint(s, glass, 13, 12, 10, 28, 0.15, 1);
});
/* the star projector: a navy dome pricked with star holes, on a short dark foot */
hdF3_def('f_star_projector', 16, 16, 8, 15, s => {
    const foot = s.add(hdRamp('#2e2a4a'), { layer: 1, R: 3, k: 1.2, grad: 0.3 }); hdF3_rr(s, foot, 17, 37, 14, 8, 2);
    const dome = s.add(hdPal('#1e1a38', '#3e3a62', '#5a5690', '#7470b0', '#9a96d0'), { layer: 2, R: 8, k: 1.1, grad: 0.2, cast: 2 }); s.ellipse(dome, 24, 25, 18, 13); s.rect(dome, 7, 25, 34, 7);
    const band = s.add(hdRamp('#2e2a4a'), { layer: 3, R: 1, grad: 0 }); s.rect(band, 7, 32, 34, 4);
    hdF3_hl(s, band, 8, 39, 32, 1);
    for (const [x, y, big] of [[28, 19, 1], [19, 22, 1], [31, 27, 1], [22, 31, 0], [14, 27, 0], [35, 22, 0], [24, 15, 0], [12, 20, 0]]) {
        s.px(x, y, '#fff6b0'); s.px(x + 1, y, '#fff6b0'); s.px(x, y + 1, '#fff6b0'); s.px(x + 1, y + 1, '#ffe880');
        if (big) { s.px(x, y - 1, '#c8c090'); s.px(x - 1, y, '#c8c090'); s.px(x + 2, y + 1, '#c8c090'); s.px(x + 1, y + 2, '#c8c090'); }
    }
});
/* the toolbox: a red steel box with its lid line, a gold latch and a grey handle */
hdF3_def('f_toolbox', 16, 16, 8, 15, s => {
    const hd = s.add(hdRamp('#6b7385'), { layer: 0, R: 1, k: 1.5 }); s.rect(hd, 17, 14, 14, 3); s.rect(hd, 17, 14, 3, 11); s.rect(hd, 28, 14, 3, 11);
    const body = hdF3_box(s, hdF3_soft('#d9364a'), 3, 29, 42, 16, { layer: 1, R: 2, grad: 0.15 }, 2);
    const lid = hdF3_box(s, hdF3_soft('#f05a6a'), 3, 22, 42, 9, { layer: 2, R: 2, grad: 0.2, cast: 2 }, 2);
    const seam = hdF3_box(s, hdF3_soft('#a82838'), 3, 31, 42, 3, { layer: 3, R: 1, grad: 0 });
    hdF3_hl(s, lid, 5, 42, 23, 1); hdF3_hl(s, body, 5, 42, 34, 1);
    const latch = s.add(HDF3_GOLD, { layer: 4, R: 1, k: 1.4 }); hdF3_rr(s, latch, 21, 34, 6, 6, 1);
    s.px(23, 37, '#8a6a20'); s.px(24, 37, '#8a6a20');
});
/* the trophies: a gold (or silver) cup on a stem and a wooden base, each with its own emblem */
function hdF3_cup(s, metal, base) {
    const B = hdF3_box(s, hdF3_soft(base), 15, 36, 18, 9, { layer: 1, R: 2, grad: 0.2 }, 2);
    hdF3_hl(s, B, 16, 31, 37, 1);
    const st = s.add(metal, { layer: 2, R: 2, k: 1.6 }); s.rect(st, 21, 26, 6, 11); s.ellipse(st, 24, 35.5, 6, 2); s.ellipse(st, 24, 28, 5, 2);
    const cup = s.add(metal, { layer: 3, R: 7, k: 1.2, grad: 0.15, cast: 2 }); s.ellipse(cup, 24, 15.5, 14.5, 12); s.rect(cup, 14, 3, 20, 4);
    hdF3_later(s, () => hdF3_each(s, cup, (x, y, i) => { if (x > 13 && x < 18 && y > 6 && y < 22) s.mods[i] += 1; }));
    return cup;
}
const HDF3_CUPGOLD = hdPal('#7a5212', '#c8902a', '#ffcf40', '#ffe27a', '#fff6c8');
hdF3_def('f_trophy_arcade', 16, 16, 8, 15, s => {
    hdF3_cup(s, HDF3_CUPGOLD, '#6b4a2a');
    const stick = s.add(hdRamp('#e0405a'), { layer: 4, R: 1 }); s.rect(stick, 22, 9, 4, 10);
    const ball = s.add(hdRamp('#ff7a8a'), { layer: 5, R: 2, k: 1.4 }); s.ellipse(ball, 24, 8, 3.6, 3.2);
    const pad = s.add(hdRamp('#b8862d'), { layer: 4, R: 1 }); hdF3_rr(s, pad, 15, 18, 18, 3, 1);
});
hdF3_def('f_trophy_hot', 16, 16, 8, 15, s => {
    hdF3_cup(s, HDF3_CUPGOLD, '#6b4a2a');
    const pep = s.add(hdRamp('#e2382b'), { layer: 4, R: 4, k: 1.2 }); s.ellipse(pep, 24, 13, 6.5, 6); s.poly(pep, [[18, 14], [30, 14], [25, 25], [23, 25]]);
    const stem = s.add(hdRamp('#5aa844'), { layer: 5, R: 1 }); s.rect(stem, 22, 1, 3, 7); s.poly(stem, [[19, 7], [29, 7], [27, 9], [21, 9]]);
    s.px(21, 10, '#ffb0a0'); s.px(21, 11, '#ffb0a0');
});
hdF3_def('f_trophy_karaoke', 16, 16, 8, 15, s => {
    hdF3_cup(s, HDF3_CUPGOLD, '#6b4a2a');
    for (const x of [18, 28]) { s.px(x, 12, '#3a3340'); s.px(x + 1, 12, '#3a3340'); s.px(x, 13, '#3a3340'); s.px(x + 1, 13, '#3a3340'); s.px(x, 14, '#3a3340'); s.px(x + 1, 14, '#3a3340'); s.px(x, 12, '#fff6c8'); }
    for (let x = 19; x < 30; x++) s.px(x, x === 19 || x === 29 ? 20 : 21, '#e0405a');
    for (let x = 21; x < 28; x++) s.px(x, 22, '#b02a40');
    s.px(16, 18, '#ffb070'); s.px(17, 18, '#ffb070'); s.px(31, 18, '#ffb070'); s.px(32, 18, '#ffb070');
});
hdF3_def('f_trophy_rope', 16, 16, 8, 15, s => {
    const cup = hdF3_cup(s, hdPal('#5a6278', '#98a2b8', '#c8d0e0', '#e2e8f2', '#ffffff'), '#6b4a2a');
    const rib = s.add(hdRamp('#e0405a'), { layer: 4, R: 1, grad: 0.3 }); s.rect(rib, 10, 12, 28, 3);
    for (const x of [9, 36]) { const t = s.add(hdRamp('#e0405a'), { layer: 4, R: 1 }); s.rect(t, x, 13, 3, 5); }
});
/* the typewriter: a sheet in the roller, a green body, a keyboard of round cream keys */
hdF3_def('f_typewriter', 16, 16, 8, 15, s => {
    const paper = hdF3_box(s, hdF3_soft('#fff7f1'), 10, 5, 28, 15, { layer: 1, R: 1, flat: 1, grad: 0.2 });
    for (const y of [9, 12, 15]) for (let x = 13; x < (y === 15 ? 26 : 35); x++) if (hdF3_h(x, y, 2) > 0.2) hdF3_rc(s, paper, x, y, '#8a8090');
    const body = s.add(hdF3_soft('#3f6a5a'), { layer: 2, R: 3, k: 1.2, grad: 0.2 }); s.poly(body, [[6, 21], [42, 21], [45, 42], [3, 42]]);
    const roll = hdF3_box(s, hdRamp('#2d2a33'), 4, 17, 40, 5, { layer: 3, R: 2, k: 1.4, cast: 2 }, 2);
    for (const x of [2, 43]) { const k = s.add(hdRamp('#dcd4c4'), { layer: 4, R: 1 }); hdF3_rr(s, k, x, 16, 4, 7, 1); }
    const kb = hdF3_box(s, hdRamp('#2d2a33'), 7, 29, 34, 9, { layer: 3, R: 1, k: 1.1 }, 1);
    hdF3_over(s, o => { const K = hdRamp('#dcd4c4'); for (const [y, n, x0] of [[30, 6, 10], [34, 5, 13]]) for (let k = 0; k < n; k++) { const p = o.add(K, { R: 1, k: 1.4 }); o.ellipse(p, x0 + k * 5.2, y + 1.5, 1.7, 1.5); } });
    hdF3_hl(s, body, 8, 40, 23, 1);
});
/* the watering can: a turquoise can with a loop handle and a long spout ending in a rose */
hdF3_def('f_watering_can', 16, 16, 8, 15, s => {
    const B = hdRamp('#4ec3d9');
    const hd = s.add(hdRamp('#3aa0b8'), { layer: 0, R: 2, k: 1.4 }); for (let i = 0; i <= 20; i++) { const a = Math.PI * i / 20; s.ellipse(hd, 20.5 - Math.cos(a) * 7, 15 - Math.sin(a) * 7.5, 1.8, 1.8); }
    const sp = s.add(B, { layer: 0, R: 2, k: 1.4 }); s.line(sp, 30, 30, 41, 14, 2, 1.4);
    const rose = s.add(hdRamp('#3aa0b8'), { layer: 1, R: 2 }); hdF3_rr(s, rose, 39, 10, 6, 5, 2);
    const body = s.add(B, { layer: 2, R: 6, k: 1.2, grad: 0.2 }); hdF3_rr(s, body, 9, 16, 24, 26, 4);
    const band = hdF3_box(s, hdRamp('#3aa0b8'), 9, 38, 24, 4, { layer: 3, R: 1, grad: 0 }, 1);
    const top = hdF3_box(s, hdRamp('#3aa0b8'), 9, 15, 24, 3, { layer: 3, R: 1, grad: 0 }, 1);
    hdF3_glint(s, body, 11, 18, 8, 18, 0.1, 1);
});
/* the window: a white frame and cross bars, four panes of sky with a glint */
hdF3_def('f_window_wall', 16, 16, 8, 15, s => {
    const fr = hdF3_box(s, hdPal('#7a8090', '#d4d8e2', '#f4f6fa', '#ffffff', '#ffffff'), 0, 0, 48, 48, { layer: 2, R: 3, k: 1.4, grad: 0.15, cast: 2 }, 2);
    for (const [x, y] of [[6, 6], [27, 6], [6, 27], [27, 27]]) {
        const p = hdF3_box(s, hdPal('#5a9ab8', '#86c4de', '#9fd8ef', '#bfe6f6', '#e8f8ff'), x, y, 15, 15, { layer: 1, flat: 1, grad: 0.5 });
        hdF3_glint(s, p, x, y, 15, 15, 0.12, 1);
    }
    hdF3_dots(s, [[12, 12], [13, 12], [12, 13]], '#ffffff');
});
/* the rainbow flag on its pole: six stripes of cloth with a soft wave */
hdF3_def('f_pride_flag', 16, 16, 8, 15, s => {
    const pole = s.add(hdRamp('#8a8070'), { layer: 2, R: 2, k: 1.5 }); s.rect(pole, 3, 2, 3, 46);
    const knob = s.add(HDF3_GOLD, { layer: 3, R: 1 }); s.ellipse(knob, 4.5, 1.5, 2.4, 1.8);
    const C = ['#ff5a6a', '#ffa24a', '#ffd84a', '#5ed17a', '#4ea8f0', '#b37cf0'];
    const cloth = s.add(hdRamp(C[0]), { layer: 1, R: 3, k: 0.9, grad: 0 });
    const wave = x => Math.round(Math.sin((x - 6) * 0.22) * 1.5);
    for (let x = 6; x < 45; x++) for (let y = 3; y < 39; y++) { const yy = y + wave(x); if (yy >= 3 && yy < 48) s.plot(cloth, x, yy); }
    hdF3_later(s, () => hdF3_each(s, cloth, (x, y, i) => {
        const k = Math.max(0, Math.min(5, Math.floor((y - wave(x) - 3) / 6)));
        if (k) s.recolor(x, y, C[k]);
        const f = Math.sin((x - 6) * 0.22 + 0.9); if (f > 0.75) s.mods[i] += 1; else if (f < -0.75) s.mods[i] -= 1;
    }));
});

/* ---------------------------------------------------------------- standing things */
/* a pumpkin: a squat ball with curved ribs, a stem (in a sprite of its own when lay is given) */
function hdF3_pumpkin(o, cx, cy, rx, ry, col, layer, stem, seed) {
    const p = o.add(hdRamp(col), { R: Math.min(rx, ry) * 0.7, k: 1.1, layer: layer || 1, grad: 0.15 }); o.ellipse(p, cx, cy, rx, ry);
    hdF3_later(o, () => hdF3_each(o, p, (x, y, i) => { const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry, w = Math.sqrt(Math.max(0.05, 1 - v * v)), q = u / w * 2.4; if (Math.abs(q - Math.round(q)) < 0.1 && Math.abs(u) < 0.92) o.mods[i] -= 1; }));
    if (stem) { const st = o.add(hdRamp(stem), { R: 1, layer: (layer || 1) + 1 }); o.poly(st, [[cx - 1.5, cy - ry + 2], [cx + 2, cy - ry + 2], [cx + 3.5, cy - ry - 3], [cx + 0.5, cy - ry - 3]]); }
    return p;
}
hdF3_def('f_pumpkin_lantern', 16, 28, 8, 27, s => {
    hdF3_pumpkin(s, 24, 53.5, 23.5, 17, '#f28a2a', 1);
    const st = s.add(hdRamp('#5a7a2a'), { layer: 2, R: 2 }); s.poly(st, [[21, 37], [27, 37], [28, 30], [25, 27], [22, 28]]);
    /* the carved face, lit from inside */
    const G = hdPal('#c05010', '#f0a020', '#ffd84a', '#ffec90', '#fff8d0');
    hdF3_over(s, o => {
        for (const x of [15, 33]) { const e = o.add(G, { R: 2, k: 0.6, grad: -0.6 }); o.poly(e, [[x - 4, 54], [x + 4, 54], [x, 47]]); }
        const m = o.add(G, { R: 2, k: 0.6, grad: -0.6 }); o.poly(m, [[13, 61], [35, 61], [32, 67], [16, 67]]);
        for (const x of [19, 28]) o.rect(-1, x, 61, 2, 2);
        o.rect(-1, 23, 65, 3, 2);
    });
});
hdF3_def('f_pumpkin_pile', 16, 20, 8, 19, s => {
    hdF3_over(s, o => {
        hdF3_pumpkin(o, 23, 25, 13, 10, '#f7a040', 1, '#5a9e3c');
        hdF3_pumpkin(o, 11.5, 41.5, 11.5, 9.5, '#f28a2a', 2);
        hdF3_pumpkin(o, 35.5, 41.5, 12, 9.5, '#e87a20', 2);
        const st = o.add(hdRamp('#5a9e3c'), { R: 1, layer: 3 }); o.rect(st, 10, 32, 3, 3); o.rect(st, 34, 32, 3, 3);
    });
});
/* the tool rack: a wooden frame round a pegboard, a shovel, a rake and a hoe hung up, a tin pail at the foot */
hdF3_def('f_rack_tools', 16, 28, 8, 27, s => {
    const fr = hdF3_box(s, hdF3_soft('#9a6b45'), 0, 0, 48, 81, { layer: 2, R: 2, grad: 0.1 }, 1);
    hdF3_wood(s, fr, 91, true, 0.6);
    const board = hdF3_box(s, hdF3_soft('#c9a47a'), 6, 3, 36, 66, { layer: 1, R: 2, flat: 1, grad: 0.15 });
    for (let y = 9; y < 66; y += 6) for (let x = 10; x < 40; x += 6) { hdF3_m(s, board, x, y, -2); hdF3_m(s, board, x + 1, y + 1, 1); }
    hdF3_hl(s, fr, 2, 45, 1, 1); hdF3_hl(s, fr, 3, 44, 69, 1);
    hdF3_over(s, o => {
        const H = hdRamp('#7a5234'), M = HDF3_CHROME;
        /* the rake at the left: a long handle, a row of tines at its foot */
        const rh = o.add(H, { R: 1, k: 1.4, layer: 1 }); o.line(rh, 16, 14, 13, 58, 1.1);
        const rt = o.add(M, { R: 1, layer: 2 }); o.rect(rt, 7, 58, 13, 2); for (let x = 7; x < 20; x += 3) o.rect(rt, x, 60, 1, 4);
        /* the shovel hung blade up in the middle */
        const sh = o.add(hdRamp('#8a5a33'), { R: 1, k: 1.4, layer: 1 }); o.line(sh, 22, 16, 19, 34, 1.1);
        const bl = o.add(hdRamp('#b8c4d0'), { R: 3, k: 1.3, layer: 2 }); o.poly(bl, [[21, 5], [33, 5], [32, 14], [27, 17], [22, 14]]);
        o.px(31, 6, '#e8eef6'); o.px(31, 7, '#e8eef6');
        /* the hoe at the right */
        const hh = o.add(hdRamp('#8a5a33'), { R: 1, k: 1.4, layer: 1 }); o.line(hh, 37, 8, 37, 46, 1.1);
        const hb = o.add(M, { R: 1, layer: 2 }); o.poly(hb, [[34, 6], [41, 6], [41, 10], [34, 9]]);
        /* the pail */
        const pail = o.add(hdRamp('#b8c4d0'), { R: 3, k: 1.3, layer: 3 }); o.poly(pail, [[29, 50], [45, 50], [43, 63], [31, 63]]);
        const rim = o.add(hdRamp('#e8eef6'), { R: 1, layer: 4 }); o.rect(rim, 29, 49, 16, 2);
        const hd = o.add(M, { R: 1, layer: 2 }); for (let i = 0; i <= 12; i++) { const a = Math.PI * i / 12; o.plot(hd, Math.round(37 - Math.cos(a) * 7), Math.round(49 - Math.sin(a) * 5)); }
    });
    /* pegs holding the tools */
    hdF3_dots(s, [[15, 12], [22, 15], [36, 7], [38, 7]], '#5a4030');
});
/* the red lantern: a paper globe with ribs and a pale band, gold caps, on a wooden stand */
hdF3_def('f_red_lantern', 16, 28, 8, 27, s => {
    const pole = hdF3_box(s, hdF3_soft('#6b4a35'), 21, 54, 6, 20, { layer: 0, R: 2, k: 1.5 });
    const foot = s.add(hdF3_soft('#6b4a35'), { layer: 1, R: 3, k: 1.2, grad: 0.3 }); hdF3_rr(s, foot, 12, 73, 24, 8, 3);
    const G = hdPal('#7a5212', '#c8902a', '#ffcf40', '#ffe27a', '#fff6c8');
    const body = s.add(hdPal('#801828', '#c02838', '#e0333f', '#f05058', '#ff8080'), { layer: 2, R: 12, k: 0.9, grad: 0.15 }); s.ellipse(body, 24, 30, 22.5, 19.5); s.rect(body, 9, 12, 30, 4); s.rect(body, 12, 45, 24, 4);
    hdF3_later(s, () => hdF3_each(s, body, (x, y, i) => { const u = (x + 0.5 - 24) / 22.5, v = (y + 0.5 - 30) / 19.5, w = Math.sqrt(Math.max(0.05, 1 - v * v)), q = u / w * 2.5; if (Math.abs(q - Math.round(q)) < 0.09 && Math.abs(u) < 0.95) s.mods[i] -= 1; if (y >= 29 && y <= 31) s.recolor(x, y, '#ff7878'); }));
    const top = s.add(G, { layer: 3, R: 2, k: 1.3, cast: 1 }); hdF3_rr(s, top, 15, 6, 18, 6, 2);
    const bot = s.add(G, { layer: 3, R: 2, k: 1.3 }); hdF3_rr(s, bot, 15, 48, 18, 6, 2);
    s.px(16, 7, '#fff6c8'); s.px(17, 7, '#fff6c8'); s.px(16, 49, '#fff6c8');
});
/* the sack cart: a dark hand truck carrying a sack of flour with a blue stripe */
hdF3_def('f_sack_cart', 16, 28, 8, 27, s => {
    const F = hdRamp('#4a4450');
    const bar = s.add(F, { layer: 1, R: 2, k: 1.5 }); hdF3_rr(s, bar, 4, 1, 40, 7, 3);
    for (const x of [9, 36]) { const u = s.add(F, { layer: 1, R: 2, k: 1.6 }); s.rect(u, x, 6, 4, 64); }
    const toe = s.add(F, { layer: 3, R: 1, k: 1.4 }); s.rect(toe, 9, 66, 31, 4);
    const sack = s.add(hdF3_soft('#f4efe6'), { layer: 2, R: 7, k: 1, grad: 0.15 }); s.poly(sack, [[16, 30], [32, 30], [36, 36], [36, 64], [12, 64], [12, 36]]); hdF3_rr(s, sack, 12, 40, 24, 26, 5);
    const tie = s.add(hdF3_soft('#e8dcc8'), { layer: 3, R: 2 }); s.poly(tie, [[18, 30], [30, 30], [27, 27], [21, 27]]); s.rect(tie, 15, 26, 18, 2);
    const stripe = s.add(hdRamp('#4f86c6'), { layer: 3, R: 1, grad: 0 }); s.rect(stripe, 12, 54, 24, 3);
    hdF3_speck(s, sack, 7, 0.05, -1);
    const axle = s.add(F, { layer: 2, R: 1 }); s.rect(axle, 13, 72, 22, 3);
    for (const cx of [7.5, 39.5]) { const w = s.add(hdRamp('#2d2a30'), { layer: 4, R: 4, k: 1.3 }); s.ellipse(w, cx, 74.5, 7.5, 6.5); const hub = s.add(hdRamp('#8a8898'), { layer: 5, R: 1 }); s.ellipse(hub, cx, 74.5, 2, 2); }
});
/* the sawhorse: a beam on splayed legs with an offcut block lying on top */
hdF3_def('f_sawhorse', 16, 28, 8, 27, s => {
    const L = hdF3_soft('#8a5a33'), Lf = hdF3_soft('#a8733f');
    for (const [x0, x1] of [[16, 9], [30, 37]]) { const l = s.add(L, { layer: 0, R: 2, k: 1.5 }); s.line(l, x0, 44, x1, 80, 2); }
    const beam = hdF3_box(s, hdF3_soft('#d9a46a'), 3, 36, 42, 9, { layer: 1, R: 2, grad: 0.2 }, 1);
    const btop = hdF3_box(s, hdF3_soft('#f0c890'), 3, 35, 42, 3, { layer: 2, R: 1, grad: 0 }, 1);
    hdF3_wood(s, beam, 101, false, 0.8);
    for (const [x0, x1] of [[10, 2], [37, 45]]) { const l = s.add(Lf, { layer: 3, R: 2, k: 1.5 }); s.line(l, x0, 43, x1, 80, 2); hdF3_wood(s, l, x0, true, 0.6); }
    const blk = hdF3_box(s, hdF3_soft('#c98a55'), 12, 24, 24, 12, { layer: 3, R: 2, grad: 0.15, cast: 2 }, 1);
    const bt = hdF3_box(s, hdF3_soft('#e0a870'), 12, 21, 24, 4, { layer: 4, R: 1, grad: 0 }, 1);
    hdF3_wood(s, blk, 102, false, 0.8);
});
/* the big speaker: a dark cabinet with a woofer and a smaller cone, rings and dust caps catching the light */
function hdF3_cone(s, cx, cy, r) {
    const sur = s.add(hdRamp('#3a3640'), { layer: 2, R: 3, k: 1.4 }); s.ellipse(sur, cx, cy, r, r);
    const cone = s.add(hdRamp('#5a5660'), { layer: 3, R: r * 0.5, k: 0.8, grad: -0.3 }); s.ellipse(cone, cx, cy, r - 3, r - 3);
    const cap = s.add(hdRamp('#1c1a20'), { layer: 4, R: 2, k: 1.5 }); s.ellipse(cap, cx, cy, r * 0.28, r * 0.28);
    s.px(cx - r * 0.2, cy - r * 0.2, '#6a6670');
}
hdF3_def('f_speaker', 16, 28, 8, 27, s => {
    const box = hdF3_box(s, hdF3_soft('#2d2a33'), 3, 3, 42, 78, { layer: 1, R: 2, grad: 0.1 }, 3);
    hdF3_hl(s, box, 6, 41, 4, 1); hdF3_vl(s, box, 4, 6, 77, 1);
    hdF3_cone(s, 24, 27, 13.5); hdF3_cone(s, 23.5, 56.5, 9.5);
    for (const [x, y] of [[7, 7], [39, 7], [7, 75], [39, 75]]) { s.px(x, y, '#6a6670'); s.px(x + 1, y + 1, '#16141a'); }
});
/* the star telescope: a brass tube with a dark hood on a wooden tripod, starlight glinting at its end */
hdF3_def('f_star_telescope', 16, 30, 8, 29, s => {
    const W = hdF3_soft('#6b4a2a');
    for (const [x1, y1] of [[8, 89], [43, 89]]) { const l = s.add(W, { layer: 0, R: 2, k: 1.5 }); s.line(l, 26, 47, x1, y1, 1.8, 2.3); }
    const mid = s.add(hdF3_soft('#5a3a24'), { layer: 1, R: 2, k: 1.5 }); s.line(mid, 26, 47, 26, 88, 1.6, 1.9);
    const head = s.add(hdRamp('#3a3340'), { layer: 2, R: 2 }); hdF3_rr(s, head, 21, 43, 10, 6, 2); s.line(head, 26, 44, 23.5, 24, 1.6); hdF3_rr(s, head, 19, 21, 10, 5, 2);
    const tube = s.add(hdPal('#5a3a12', '#a8783a', '#c9953a', '#e0b860', '#f6dc90'), { layer: 3, R: 4, k: 1.3 });
    s.line(tube, 7, 39, 34, 12, 3.2, 4.4);
    const ep = s.add(hdRamp('#8a6a3a'), { layer: 4, R: 2 }); s.line(ep, 3, 43, 7, 39, 2.2);
    const hood = s.add(hdRamp('#3a3340'), { layer: 4, R: 3, k: 1.4 }); s.line(hood, 34, 13, 41, 6, 5);
    /* brass bands round the tube */
    hdF3_later(s, () => hdF3_each(s, tube, (x, y, i) => { const t = (x - y + 32) ; if (Math.abs(t - 14) < 1.1 || Math.abs(t - 44) < 1.1) s.mods[i] -= 1; }));
    const lens = s.add(hdPal('#2a2840', '#4a4870', '#7a78a8', '#a8a6d0', '#e0e0ff'), { layer: 5, R: 2 }); s.ellipse(lens, 43, 4.5, 3, 3);
    hdF3_dots(s, [[36, 0], [37, 1], [35, 1], [36, 2], [46, 0], [47, 1]], '#fff6b0');
    s.px(44, 3, '#ffffff');
});
/* the sunflower pot: a ring of petals round a seed head, a stem with a leaf, a terracotta pot */
hdF3_def('f_sunflower', 16, 28, 8, 27, s => {
    const pot = s.add(hdF3_soft('#e0784a'), { layer: 1, R: 4, k: 1.2, grad: 0.15 }); s.poly(pot, [[12, 57], [36, 57], [34, 78], [14, 78]]);
    const rim = hdF3_box(s, hdF3_soft('#e88a5a'), 11, 55, 26, 6, { layer: 2, R: 2, grad: 0.2, cast: 2 }, 2);
    const soil = s.add(hdRamp('#6b4a2a'), { layer: 3, R: 1, flat: 1, bias: -0.1 }); s.rect(soil, 14, 55, 20, 2);
    hdF3_over(s, o => {
        const st = o.add(hdRamp('#4f9a3f'), { R: 1, k: 1.4, layer: 1 }); o.line(st, 25, 26, 25, 56, 1.6);
        const lf = o.add(hdRamp('#5aa844'), { R: 2, layer: 2 }); o.poly(lf, [[26, 44], [31, 38], [36, 38], [35, 42], [30, 45]]);
        const pet = o.add(hdRamp('#ffcf40'), { R: 3, k: 1.1, layer: 3 });
        for (let k = 0; k < 16; k++) { const a = k * Math.PI * 2 / 16; o.ellipse(pet, 24 + Math.cos(a) * 10.5, 15 + Math.sin(a) * 10, 4.6, 4.6); }
        o.ellipse(pet, 24, 15, 12, 11.5);
        const seeds = o.add(hdRamp('#8a5a33'), { R: 4, k: 1.2, layer: 4, grad: 0.2 }); o.ellipse(seeds, 24, 15, 7, 6.8);
        hdF3_later(o, () => hdF3_each(o, seeds, (x, y, i) => { if ((x + y) % 2 === 0 && hdF3_h(x, y, 3) > 0.4) o.mods[i] -= 1; }));
        hdF3_later(o, () => hdF3_each(o, pet, (x, y, i) => { const a = Math.atan2(y - 15, x - 24); if (Math.abs(Math.sin(a * 7)) < 0.18 && Math.hypot(x - 24, y - 15) > 8) o.mods[i] -= 1; }));
    });
});
/* the surfboard: a glossy turquoise board on its tail, a white stringer, a yellow band */
hdF3_def('f_surfboard', 16, 28, 8, 27, s => {
    const B = s.add(hdPal('#1e6f86', '#36a8c4', '#4ec3d9', '#7ad8e8', '#c4f0f8'), { layer: 1, R: 9, k: 1, grad: 0.1 });
    for (let y = 0; y < 81; y++) { const t = y / 80, hw = y < 30 ? 15 * Math.sqrt(Math.sin(Math.min(1, (y + 1.5) / 30) * Math.PI / 2)) : y > 60 ? 15 * Math.sqrt(Math.max(0, Math.cos((y - 60) / 21 * Math.PI / 2))) : 15; for (let x = Math.round(27 - hw); x < Math.round(27 + hw); x++) s.plot(B, x - 0.5, y); }
    hdF3_later(s, () => hdF3_each(s, B, (x, y, i) => { if (x === 26 || x === 27) s.recolor(x, y, '#ffffff'); if (y >= 36 && y <= 41) s.recolor(x, y, '#ffcf57'); if (x > 15 && x < 19 && y > 8 && y < 66) s.mods[i] += 1; }));
});
/* the takeout-box lamp: a white folded box for a shade with its red print, on a slim stem */
hdF3_def('f_takeout_lamp', 16, 28, 8, 27, s => {
    const stem = hdF3_box(s, hdF3_soft('#6b5a4a'), 21, 37, 6, 37, { layer: 0, R: 2, k: 1.5 });
    const foot = s.add(hdF3_soft('#6b5a4a'), { layer: 1, R: 3, k: 1.2, grad: 0.3 }); hdF3_rr(s, foot, 12, 73, 24, 8, 3);
    const shade = s.add(hdPal('#a89a88', '#ece2d2', '#fbf6ee', '#fffcf6', '#ffffff'), { layer: 2, R: 5, k: 0.9, grad: 0.1 }); s.poly(shade, [[3, 0], [45, 0], [33, 39], [15, 39]]);
    /* the folds of the box and its wire handle */
    hdF3_later(s, () => hdF3_each(s, shade, (x, y, i) => { if (Math.abs(x - 24) < 1 && y > 18) s.mods[i] -= 1; if (y === 4) s.mods[i] -= 1; }));
    const red = hdF3_one('#e0405a');
    const w = s.add(red, { layer: 3, R: 1 }); s.line(w, 12, 3, 23, 16, 0.8); s.line(w, 35, 3, 25, 16, 0.8);
    const dot = s.add(hdRamp('#e0405a'), { layer: 3, R: 1 }); s.ellipse(dot, 24.5, 25.5, 2.4, 2.2);
});
/* the potter's wheel: a slate housing, the splash pan round a pale wheel head with a pot being thrown, a wooden seat */
hdF3_def('f_potters_wheel', 32, 28, 16, 27, s => {
    const seatF = hdF3_box(s, hdF3_soft('#8a5a33'), 60, 62, 24, 17, { layer: 1, R: 2, grad: 0.15 }, 1);
    const seatT = s.add(hdF3_soft('#b07a4a'), { layer: 2, R: 2, grad: 0.1, cast: 2 }); s.poly(seatT, [[66, 53], [81, 53], [84, 63], [60, 63]]);
    hdF3_wood(s, seatF, 111, false, 0.7); hdF3_wood(s, seatT, 112, false, 0.7);
    const body = hdF3_box(s, hdF3_soft('#5a6070'), 12, 58, 48, 21, { layer: 1, R: 2, grad: 0.15 }, 2);
    hdF3_vl(s, body, 36, 62, 76, -1); hdF3_vl(s, body, 37, 62, 76, 1);
    const pan = s.add(hdF3_soft('#8a96a8'), { layer: 2, R: 5, k: 1.2, grad: 0.2, cast: 2 }); s.ellipse(pan, 36, 48, 33, 11.5);
    const lip = s.add(hdF3_soft('#6b7385'), { layer: 3, R: 2, grad: 0.2 }); s.ellipse(lip, 36, 46.5, 27, 8);
    const head = s.add(hdPal('#6a7488', '#a8b2c4', '#c8d0e0', '#dfe5ef', '#f4f7fb'), { layer: 4, R: 4, k: 0.9, grad: 0.3 }); s.ellipse(head, 36, 46, 19, 5.5);
    hdF3_over(s, o => {
        const clay = o.add(hdRamp('#b07a5c'), { R: 6, k: 1.1, grad: 0.15 }); o.poly(clay, [[31, 25], [42, 25], [41, 29], [46, 36], [47, 44], [44, 48], [29, 48], [26, 44], [27, 36], [32, 29]]);
        const mouth = o.add(hdRamp('#8a5a40'), { R: 1, layer: 2 }); o.ellipse(mouth, 36.5, 25.5, 4.5, 1.2);
        hdF3_later(o, () => hdF3_each(o, clay, (x, y, i) => { if (y % 4 === 1 && y > 30) o.mods[i] -= 1; }));
    });
    hdF3_dots(s, [[33, 31], [32, 32], [32, 33]], '#e0b090');
});
/* the DJ turntables: two black records with red labels and tone arms either side of a mixer, on a dark table */
hdF3_def('f_turntables', 32, 28, 16, 27, s => {
    const front = hdF3_box(s, hdF3_soft('#2d2a33'), 0, 54, 96, 30, { layer: 1, R: 2, grad: 0.1 });
    const deck = hdF3_box(s, hdF3_soft('#3b3f52'), 0, 21, 96, 34, { layer: 2, R: 3, grad: 0.15, cast: 2 }, 3);
    const edge = hdF3_box(s, hdF3_soft('#2b2732'), 0, 53, 96, 3, { layer: 3, R: 1, grad: 0 });
    hdF3_hl(s, deck, 3, 92, 22, 1); hdF3_hl(s, deck, 2, 93, 23, 1); hdF3_hl(s, front, 2, 93, 57, 1);
    for (const [x, y] of [[8, 70], [86, 70]]) { s.px(x, y, '#e0405a'); s.px(x + 1, y, '#ff7080'); }
    hdF3_over(s, o => {
        for (const cx of [24, 69]) {
            const rec = o.add(hdPal('#0c0a10', '#141218', '#1c1a20', '#2c2a34', '#4a4856'), { R: 4, k: 1 }); o.ellipse(rec, cx, 38, 15.5, 9.5);
            hdF3_later(o, () => hdF3_each(o, rec, (x, y, i) => { const r = Math.hypot((x + 0.5 - cx) / 1.6, y + 0.5 - 38); if (r > 4 && Math.round(r) % 2 === 0) o.mods[i] += (x < cx && y < 38) ? 1 : 0; }));
            const lab = o.add(hdRamp('#e0405a'), { R: 1, layer: 2 }); o.ellipse(lab, cx, 38, 3.5, 2.2);
            const arm = o.add(HDF3_CHROME, { R: 1, layer: 3 }); o.line(arm, cx + 15, 27, cx + 9, 36, 0.7); o.ellipse(arm, cx + 15, 27, 1.8, 1.8);
        }
        const mix = o.add(hdRamp('#8a96a8'), { R: 2, k: 1.3 }); hdF3_rr(o, mix, 42, 29, 9, 19, 1);
        for (const y of [33, 39]) { const k = o.add(hdRamp('#3b3f52'), { R: 1, layer: 2 }); o.rect(k, 44, y, 5, 2); }
        const fd = o.add(hdRamp('#e0405a'), { R: 1, layer: 2 }); o.rect(fd, 45, 44, 3, 2);
    });
});
/* the treasure chest: a wooden chest with gold bands, its lid lifted on gold, gems and a sparkle */
hdF3_def('f_treasure_chest', 16, 20, 8, 19, s => {
    const G = HDF3_GOLD;
    const body = hdF3_box(s, hdF3_soft('#8a5a3a'), 0, 30, 48, 27, { layer: 1, R: 2, grad: 0.15 }, 2);
    hdF3_wood(s, body, 121, false, 0.8);
    const gold = s.add(hdPal('#9a6a10', '#d8a830', '#ffd84a', '#ffe888', '#fff8d0'), { layer: 2, R: 3, k: 1.2 }); hdF3_rr(s, gold, 4, 20, 40, 12, 4);
    const lid = s.add(hdF3_soft('#a8703f'), { layer: 3, R: 5, k: 1.1, grad: 0.2 }); hdF3_rr(s, lid, 2, 6, 44, 16, 6); s.rect(lid, 2, 14, 44, 7);
    hdF3_wood(s, lid, 122, false, 0.8);
    for (const x of [9, 36]) { const b = s.add(G, { layer: 4, R: 1, k: 1.4 }); s.rect(b, x, 7, 4, 14); const b2 = s.add(G, { layer: 4, R: 1, k: 1.4 }); s.rect(b2, x, 30, 4, 27); }
    const rim = s.add(G, { layer: 4, R: 1, k: 1.3 }); s.rect(rim, 0, 30, 48, 3);
    const lock = s.add(hdRamp('#ffcf40'), { layer: 5, R: 2, k: 1.4 }); hdF3_rr(s, lock, 20, 32, 8, 9, 2);
    s.px(23, 36, '#6a4a14'); s.px(24, 36, '#6a4a14'); s.px(23, 37, '#6a4a14');
    hdF3_over(s, o => {
        const gem = (x, y, c) => { const g = o.add(hdRamp(c), { R: 2, k: 1.4 }); o.poly(g, [[x - 3, y], [x, y - 3], [x + 3, y], [x, y + 3]]); };
        gem(19, 24, '#3fc47a'); gem(32, 25, '#e0304a');
        o.px(11, 22, '#ffffff'); o.px(12, 21, '#ffffff'); o.px(12, 23, '#ffffff'); o.px(13, 22, '#ffffff'); o.px(12, 22, '#fffbe0');
    });
    for (let x = 4; x < 44; x++) s.mod(x, 33, -1);
});
/* the veggie planter: a wooden box of dark soil, five leafy heads with their vegetables peeking out */
hdF3_def('f_veggie_planter', 32, 28, 16, 27, s => {
    const box = hdF3_box(s, hdF3_soft('#b98552'), 0, 54, 96, 30, { layer: 1, R: 2, grad: 0.1 });
    for (const y of [64, 74]) { hdF3_hl(s, box, 2, 93, y, -1); hdF3_hl(s, box, 2, 93, y + 1, 1); }
    hdF3_wood(s, box, 131, false, 0.8);
    const rim = hdF3_box(s, hdF3_soft('#a9794e'), 0, 52, 96, 4, { layer: 2, R: 1, grad: 0, bias: 0.06 });
    const soil = hdF3_box(s, hdF3_soft('#7a5234'), 3, 40, 90, 13, { layer: 0, R: 2, grad: 0.1 }, 2);
    hdF3_speck(s, soil, 9, 0.12, -1); hdF3_speck(s, soil, 10, 0.05, 1);
    hdF3_over(s, o => {
        const G = ['#5aa844', '#3f8f3a', '#6cc063', '#4f9a3f', '#5aa844'], V = ['#e2382b', '#f28a2a', '#e8403a', '#6a3a8a', '#e2382b'];
        for (let k = 0; k < 5; k++) {
            const cx = 12 + k * 18;
            const lf = o.add(hdRamp(G[k]), { R: 4, k: 1.1, layer: 1, grad: 0.15 });
            o.ellipse(lf, cx, 30, 10, 7.5); o.ellipse(lf, cx - 3, 23, 4.5, 4.5); o.ellipse(lf, cx + 3, 21, 4, 4.5);
            hdF3_later(o, () => hdF3_each(o, lf, (x, y, i) => { const a = Math.atan2(y - 32, x - cx); if (Math.abs(Math.sin(a * 4)) < 0.15) o.mods[i] -= 1; }));
            const v = o.add(hdRamp(V[k]), { R: 2, k: 1.3, layer: 2 }); o.ellipse(v, cx + (k % 2 ? 3 : -3), 39, 3, 2.6);
        }
    });
});
/* the wheelbarrow: a red tray of pumpkins, wooden handles reaching back to the left, the wheel at the front */
hdF3_def('f_wheelbarrow', 32, 24, 16, 23, s => {
    const H = hdF3_soft('#8a5a33');
    const h1 = s.add(H, { layer: 0, R: 2, k: 1.5 }); s.line(h1, 24, 40, 7, 57, 1.5); s.ellipse(h1, 7, 57, 2, 2);
    const legs = s.add(hdRamp('#4a4450'), { layer: 0, R: 1, k: 1.4 }); s.rect(legs, 27, 46, 3, 16); s.rect(legs, 51, 46, 3, 16);
    const wheel = s.add(hdRamp('#2d2a30'), { layer: 1, R: 4, k: 1.3 }); s.ellipse(wheel, 73.5, 52.5, 11, 10.5);
    const tire = s.add(hdRamp('#4a4652'), { layer: 2, R: 2 }); s.ellipse(tire, 73.5, 52.5, 6.5, 6.2);
    const hub = s.add(hdRamp('#8a96a8'), { layer: 3, R: 2, k: 1.4 }); s.ellipse(hub, 73.5, 52.5, 3.5, 3.2);
    const fork = s.add(hdRamp('#2d2a30'), { layer: 3, R: 1 }); s.line(fork, 62, 42, 72, 52, 1.2);
    const under = s.add(hdF3_soft('#962c21'), { layer: 2, R: 2, grad: 0.1 }); s.poly(under, [[16, 42], [68, 42], [62, 48], [22, 48]]);
    const tray = s.add(hdF3_soft('#c0392b'), { layer: 3, R: 4, grad: 0.2, cast: 2 }); s.poly(tray, [[9, 24], [78, 24], [69, 44], [16, 44]]);
    const lip = s.add(hdF3_soft('#e0584a'), { layer: 4, R: 2, grad: 0 }); s.rect(lip, 8, 23, 71, 4);
    const h2 = s.add(H, { layer: 5, R: 2, k: 1.5 }); s.line(h2, 18, 44, 0, 60, 1.5); s.ellipse(h2, 0.5, 60, 2, 2);
    hdF3_over(s, o => {
        hdF3_pumpkin(o, 25, 18, 9, 7.5, '#f28a2a', 1, '#5a9e3c');
        hdF3_pumpkin(o, 42, 17, 9, 8, '#f7a040', 1, '#5a9e3c');
        hdF3_pumpkin(o, 59, 18, 9, 7.5, '#e87a20', 1, '#5a9e3c');
    });
    for (let x = 12; x < 74; x++) s.mod(x, 27, -1);
});
