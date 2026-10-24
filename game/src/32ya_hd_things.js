/* ---- 32ya_hd_things.js ---- */
/* HD things for the HD-2D view: the island's outdoor props (driftwood, the noodle cart, the picnic table, the fires,
   the farm things, the ice cream stand, the volleyball court...), the mannequins in the boutique window and the tools
   Sarah holds and swings, each today's sprite at three times the detail: the same frame, anchor, silhouette and
   colors, with the form, light and texture the extra pixels allow. Things cast their own shadows in 3D, so none draws
   one; the court and the blankets lie flat like a rug. */

/* ---------------------------------------------------------------- helpers */
/* a small seeded hash in 0..1 (scatter that never changes) */
function hdG_h(x, y, k) { let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(k | 0, 1442695041); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }
/* smooth value noise (grain, mottling) */
function hdG_vn(x, y, k) {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hdG_h(ix, iy, k), b = hdG_h(ix + 1, iy, k), c = hdG_h(ix, iy + 1, k), d = hdG_h(ix + 1, iy + 1, k);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
/* every pixel of a part (texture passes write s.mods[i], patterns recolor): run once the drawing is done, so a part
   laid over another later doesn't get the texture of the one under it */
function hdG_each(s, id, fn) { (s.hdG || (s.hdG = [])).push([id, fn]); }
function hdG_flush(s) {
    const q = s.hdG, W = s.w;
    if (!q) return;
    s.hdG = null;
    const by = new Map();
    for (const [id, fn] of q) { if (!by.has(id)) by.set(id, []); by.get(id).push(fn); }
    for (let y = 0; y < s.h; y++) for (let x = 0; x < W; x++) { const i = y * W + x, f = by.get(s.part[i]); if (f) for (const fn of f) fn(x, y, i); }
}
/* a rounded rectangle */
function hdG_rr(s, id, x, y, w, h, r) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const cx = i < r ? r - i - 0.5 : i >= w - r ? i - (w - r) + 0.5 : 0, cy = j < r ? r - j - 0.5 : j >= h - r ? j - (h - r) + 0.5 : 0;
        if (cx * cx + cy * cy <= r * r + 0.5) s.plot(id, x + i, y + j);
    }
}
/* wood grain: streaks that run with the grain (vert for posts), a few lighter ones */
function hdG_grain(s, id, seed, vert, amt) {
    amt = amt == null ? 1 : amt;
    hdG_each(s, id, (x, y, i) => {
        const a = vert ? y : x, b = vert ? x : y, g = hdG_vn(a * 0.07 + b * 0.05, b * 0.75, seed);
        if (g < 0.22 * amt) s.mods[i] -= 1; else if (g > 1 - 0.08 * amt) s.mods[i] += 1;
    });
}
/* light and dark specks in little clusters (sand, stone, straw), never single-pixel noise everywhere */
function hdG_speck(s, id, seed, dark, light, cell) {
    cell = cell || 2;
    hdG_each(s, id, (x, y, i) => { const r = hdG_h(Math.floor(x / cell), Math.floor(y / cell), seed), q = hdG_h(x, y, seed + 1); if (r < dark && q < 0.75) s.mods[i] -= 1; else if (r > 1 - light && q < 0.6) s.mods[i] += 1; });
}
/* an irregular blob (a stone, a heap): an ellipse whose edge wanders by amp */
function hdG_blob(s, id, cx, cy, rx, ry, amp, seed) {
    const pts = [];
    for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2, r = 1 + (hdG_vn(i * 0.7, 0, seed) - 0.5) * 2 * amp; pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]); }
    s.poly(id, pts);
}
/* see-through pixels laid over the finished picture (rope shadows in the sand, a net's holes): [x, y, hex, alpha] */
function hdG_glaze(s, list) {
    const r0 = s.render.bind(s);
    s.render = (out, ox, OW) => {
        out = r0(out, ox, OW); OW = OW || s.w; ox = ox || 0;
        for (const [x, y, c, a] of list) {
            if (x < 0 || y < 0 || x >= s.w || y >= s.h) continue;
            const o = (y * OW + ox + x) * 4, k = c ? hdRgb(c) : null;
            if (out[o + 3] === 255 && k) { const t = a / 255; out[o] = out[o] * (1 - t) + k[0] * t; out[o + 1] = out[o + 1] * (1 - t) + k[1] * t; out[o + 2] = out[o + 2] * (1 - t) + k[2] * t; continue; }
            if (k) { out[o] = k[0]; out[o + 1] = k[1]; out[o + 2] = k[2]; }
            out[o + 3] = a;
        }
        return out;
    };
}
/* parts drawn in a sprite of their own and laid over this one as finished pixels (small things on a table or a
   blanket keep their own outline) */
function hdG_over(s, fn) {
    const o = new HDSprite(s.w, s.h); fn(o); hdG_flush(o);
    const buf = o.render(), W = s.w;
    for (let i = 0; i < W * s.h; i++) if (buf[i * 4 + 3]) s.px(i % W, (i / W) | 0, [buf[i * 4], buf[i * 4 + 1], buf[i * 4 + 2]]);
}
/* register a drawing under a frame name, sizes in today's pixels (the HD frame is three times as big) */
function hdG_reg(n, w, h, ax, ay, fn) { HD_SPR[n] = { w: w * 3, h: h * 3, ax: ax * 3, ay: ay * 3, draw(s) { fn(s); hdG_flush(s); } }; }

/* ---------------------------------------------------------------- shared colors */
const hdG_WOOD = hdRamp('#9a6b45'), hdG_WOODDK = hdRamp('#7a5234'), hdG_WOODXD = hdRamp('#5e3f28');
const hdG_STONE = [hdRamp('#a8a6b4'), hdRamp('#9a98a6'), hdRamp('#b4b2c0'), hdRamp('#8e8c9c')];
const hdG_CHAR = hdPal('#140e0c', '#1e1614', '#2a1e1a', '#3a2a24', '#4a3830');
const hdG_WHITE = hdPal('#8a8496', '#cfcad8', '#eeebf2', '#fbfaff', '#ffffff');
const hdG_STEEL = hdPal('#4a5262', '#8a96a8', '#b8c4d0', '#d6dee8', '#f2f6fb');

/* ---------------------------------------------------------------- driftwood */
hdG_reg('driftwood', 24, 10, 12, 8, s => {
    const M = hdPal('#5e4b3e', '#a08566', '#c7a57c', '#dcc29b', '#eedbb8');
    /* the broken branch stub, tucked behind the trunk */
    const st = s.add(M, { layer: 0, R: 2, grad: 0.1 });
    s.line(st, 24, 11, 21, 2, 2.6, 1.7);
    const b = s.add(M, { layer: 1, R: 8, grad: 0.22, k: 1.1 });
    s.poly(b, [[2, 12], [8, 8.5], [18, 7.6], [30, 8], [44, 7.2], [56, 7.6], [64, 8.4], [69, 10.6], [71.6, 14.5], [71.2, 19.5], [68, 23.6], [60, 25.6], [44, 26.2], [28, 25.6], [14, 26.2], [5, 24.8], [0.4, 20], [0.4, 14.5]]);
    /* long silvery grain, worn smooth; a knot */
    hdG_each(s, b, (x, y, i) => { const g = hdG_vn(x * 0.05 + y * 0.02, y * 0.9, 7); if (g < 0.2) s.mods[i] -= 1; else if (g > 0.88 && y < 16) s.mods[i] += 1; });
    s.ellipse(s.add(hdPal('#4a382e', '#5e4b3e', '#7a6250', '#a08566', '#b89a76'), { layer: 2, R: 1.5, flat: 1, bias: -0.2 }), 47.5, 17.5, 2.2, 1.4);
    for (let x = 43; x <= 52; x++) { s.mod(x, 15, 1); s.mod(x, 20, -1); }
    for (let x = 22; x <= 34; x++) s.mod(x, 21 + (x > 28 ? 1 : 0), -1);
    /* the ends, rubbed round by the sea */
    for (let y = 12; y <= 22; y++) s.mod(70, y, -1);
});

/* ---------------------------------------------------------------- the log seat */
hdG_reg('log', 32, 14, 16, 13, s => {
    const bark = s.add(hdG_WOOD, { layer: 1, R: 10, grad: 0.3, k: 1.1 });
    hdG_rr(s, bark, 7, 9.5, 82, 27, 5);
    /* fissures along the bark, and the lighter ridges between */
    hdG_each(s, bark, (x, y, i) => {
        const g = hdG_vn(x * 0.09, y * 0.55 + Math.sin(x * 0.11) * 0.6, 3);
        if (g < 0.26) s.mods[i] -= 1; else if (g > 0.84) s.mods[i] += 1;
    });
    for (let k = 0; k < 9; k++) { const x = 16 + k * 8 + (k % 2) * 3, y = 20 + (k % 3) * 2; for (let d = 0; d < 4; d++) s.mod(x + d, y, -1); }
    /* the sawn ends, rings and all */
    for (const cx of [10.5, 85.5]) {
        const end = s.add(hdPal('#6b4a2c', '#b98c58', '#d8b07a', '#e6c592', '#f2d9ad'), { layer: 2, R: 3, grad: 0.15, flat: 1 });
        s.ellipse(end, cx, 22.5, 7.2, 13.2);
        hdG_each(s, end, (x, y, i) => { const r = Math.hypot((x + 0.5 - cx) / 7.2, (y + 0.5 - 22.5) / 13.2); if (Math.abs(r - 0.42) < 0.07 || Math.abs(r - 0.72) < 0.06) s.mods[i] -= 1; if (r < 0.13) s.mods[i] -= 1; });
        s.recolor(Math.floor(cx), 22, hdRamp('#a87a4a'));
    }
});

/* ---------------------------------------------------------------- the water trough */
hdG_reg('trough', 32, 14, 16, 13, s => {
    for (const x of [6, 82]) { const lg = s.add(hdG_WOODXD, { layer: 0, R: 2, grad: 0.2 }); s.rect(lg, x, 30, 8, 9); }
    const rim = s.add(hdG_WOOD, { layer: 1, R: 2, grad: 0.2 });
    hdG_rr(s, rim, 3, 6, 90, 20, 2);
    hdG_grain(s, rim, 11);
    /* the water: a pale band where the far side shows in it, ripples and a glint */
    const w = s.add(hdPal('#2f6f93', '#4f98be', '#6fb8d9', '#9ad4ea', '#d2f2fb'), { layer: 2, R: 2, flat: 1, grad: 0.6, bias: -0.02 });
    s.rect(w, 11, 12, 74, 12);
    for (let x = 12; x < 85; x++) { s.mod(x, 12, 1); s.mod(x, 13, x % 7 < 4 ? 1 : 0); }
    for (const [x, y, n] of [[20, 17, 6], [42, 19, 8], [64, 16, 7], [30, 21, 5], [72, 21, 5]]) for (let d = 0; d < n; d++) s.mod(x + d, y, d === 0 || d === n - 1 ? 0 : 1);
    s.px(25, 14, '#ffffff'); s.px(26, 14, '#ffffff'); s.px(27, 15, '#e8fbff');
    const fr = s.add(hdG_WOOD, { layer: 3, R: 2, grad: 0.25, bias: -0.04 });
    s.rect(fr, 3, 24, 90, 12);
    hdG_grain(s, fr, 12);
    /* the front's two planks, the dark lip where the rim meets it, and the corner boards */
    for (let x = 4; x < 92; x++) { s.mod(x, 24, -1); s.mod(x, 30, -1); s.mod(x, 31, 1); }
    for (let y = 25; y < 36; y++) { s.mod(9, y, -1); s.mod(86, y, -1); s.mod(10, y, 1); }
    for (const x of [6, 89]) for (const y of [27, 33]) s.px(x, y, '#5e3f28');
});

/* ---------------------------------------------------------------- the hay bale */
hdG_reg('hay', 18, 16, 9, 14, s => {
    const top = s.add(hdPal('#9a7424', '#d9b44a', '#f7dc7a', '#fbe89c', '#fff4c4'), { layer: 1, R: 2.5, grad: 0.12, k: 1 });
    hdG_rr(s, top, 2, 7, 50, 16, 4);
    const fr = s.add(hdPal('#8a6418', '#c9a23a', '#e8c050', '#f2d26c', '#f9e49a'), { layer: 2, R: 3, grad: 0.3, k: 1 });
    hdG_rr(s, fr, 0.5, 19, 53, 25, 4);
    /* straw: lying lengthwise on top, cut ends on the front */
    hdG_each(s, top, (x, y, i) => { const g = hdG_h(Math.floor((x + hdG_h(y, 0, 4) * 9) / 6), y, 21); if (g < 0.22) s.mods[i] -= 1; else if (g > 0.86) s.mods[i] += 1; });
    hdG_each(s, fr, (x, y, i) => { const g = hdG_h(x, Math.floor((y + hdG_h(x, 0, 5) * 7) / 4), 22); if (g < 0.2) s.mods[i] -= 1; else if (g > 0.84) s.mods[i] += 1; });
    /* stray straws poking out of the top edge */
    for (const [x, y, d] of [[8, 7, -1], [27, 6, 1], [43, 7, 1], [15, 6, 1]]) { s.plot(top, x, y); s.plot(top, x + d, y - 1); }
    /* the two loops of twine, pressed in (painted on the straw, so the bale stays one block) */
    const tw = hdRamp('#8a5a2b');
    for (const x of [18, 36]) for (const id of [top, fr]) hdG_each(s, id, (px, py, i) => {
        if (px === x || px === x + 1) s.recolor(px, py, tw);
        else if (px === x + 2 && id === fr) s.mods[i] -= 1;
        else if (px === x - 1 && id === fr && py % 3 === 0) s.mods[i] -= 1;
    });
});

/* ---------------------------------------------------------------- the crate of vegetables */
hdG_reg('crate', 18, 16, 9, 14, s => {
    /* what's in it, behind the front: tomatoes, a cabbage, oranges, lettuce */
    const red = hdRamp('#e0405a'), grn = hdRamp('#8cc152'), org = hdRamp('#f28a2a'), lgt = hdRamp('#a8d07a');
    for (const [x, y] of [[7, 15], [13, 13]]) { const t = s.add(red, { layer: 1, R: 4, grad: 0.1 }); s.ellipse(t, x, y, 5, 4.6); s.px(x - 2, y - 2, '#ffd0d8'); s.px(x - 1, y - 2, '#ff9aaa'); }
    for (const [x, y] of [[7, 10], [13, 8.5]]) { const c = s.add(hdRamp('#5a9a3a'), { layer: 2, R: 1 }); s.ellipse(c, x, y, 2, 1.2); }
    const cab = s.add(grn, { layer: 2, R: 5, grad: 0.15 });
    s.ellipse(cab, 22.5, 13, 6.6, 6.2);
    for (const [a, r] of [[0.6, 4], [2.2, 4.5], [3.9, 4]]) for (let t = 1; t < r; t++) s.mod(22.5 + Math.cos(a) * t, 13 + Math.sin(a) * t * 0.9, -1);
    for (const [x, y] of [[30.5, 15], [36, 12.5]]) { const o = s.add(org, { layer: 1 + (x > 33 ? 0 : 2), R: 4, grad: 0.1 }); s.ellipse(o, x, y, 4.8, 4.6); s.mod(x - 2, y - 2, 1); s.px(x, y - 4, '#5a8a32'); }
    const let1 = s.add(lgt, { layer: 2, R: 4, grad: 0.2 });
    s.poly(let1, [[40, 18], [41, 10], [44, 6], [47, 4.5], [50, 7], [51.5, 11], [51, 18]]);
    const let2 = s.add(grn, { layer: 3, R: 3, grad: 0.15 });
    s.poly(let2, [[42, 18], [43.5, 12], [46, 9], [48.5, 12], [50, 18]]);
    for (let y = 9; y < 18; y++) s.mod(46, y, 1);
    /* the crate: three slats with gaps, corner posts over them, the top board lit */
    const back = s.add(hdRamp('#6a4422'), { layer: 4, R: 1, flat: 1, bias: -0.1 });
    s.rect(back, 2, 17, 50, 27);
    for (const y of [17, 26, 35]) {
        const p = s.add(hdRamp('#c98a55'), { layer: 5, R: 2, grad: 0.3 });
        s.rect(p, 2, y, 50, 8);
        hdG_grain(s, p, 40 + y);
    }
    for (const x of [1, 46]) {
        const po = s.add(hdRamp('#9a6b3a'), { layer: 6, R: 2, grad: 0.15 });
        s.rect(po, x, 17, 7, 28);
        hdG_grain(s, po, 50 + x, true, 0.7);
        for (const y of [21, 30, 39]) s.px(x + 3, y, '#4e3018');
    }
    for (let x = 2; x < 52; x++) s.mod(x, 17, 1);
});

/* ---------------------------------------------------------------- fires: a ring of stones, logs laid inside */
/* a stone seen a little from above: a faceted lump, its top face catching the light */
function hdG_rock(s, cx, cy, r, seed, layer) {
    const M = hdG_STONE[seed % 4], st = s.add(M, { layer, R: 2.2, grad: 0.3, k: 1 }), pts = [], n = 7;
    for (let i = 0; i < n; i++) { const a = (i + hdG_h(i, 2, seed) * 0.6) / n * Math.PI * 2, rr = r * (0.8 + hdG_h(i, 3, seed) * 0.35); pts.push([cx + Math.cos(a) * rr * 1.15, cy + Math.sin(a) * rr * 0.72]); }
    s.poly(st, pts);
    hdG_each(s, st, (x, y, i) => { if (y < cy - r * 0.3 && x < cx + r * 0.5) s.mods[i] += 1; else if (y > cy + r * 0.35) s.mods[i] -= 1; });
    hdG_speck(s, st, seed, 0.1, 0.06, 2);
    return st;
}
/* a ring of stones round (cx, cy): the back ones smaller, the front ones bigger and in front of the logs */
function hdG_ring(s, cx, cy, rx, ry, n, k, seed, front) {
    for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2 + 0.2, sn = Math.sin(a), isFront = sn > 0.1;
        if (isFront !== front) continue;
        hdG_rock(s, cx + Math.cos(a) * rx, cy + sn * ry, k * (0.8 + 0.28 * (sn + 1) / 2) * (0.9 + hdG_h(i, 1, seed) * 0.22), seed + i, front ? 5 : 2);
    }
}
/* a short log lying from (x0, y0) to (x1, y1): bark along it, a pale sawn end outside, the inner end charred */
function hdG_firelog(s, x0, y0, x1, y1, r, light, layer) {
    const lg = s.add(light ? hdRamp('#8a5e3c') : hdRamp('#6e4a2e'), { layer, R: r * 0.7, grad: 0.1 });
    s.line(lg, x0, y0, x1, y1, r, r * 0.92);
    const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L;
    for (let t = 2; t < L - 2; t += 1) { if ((t * 7) % 5 < 3) s.mod(x0 + ux * t + uy * r * 0.35, y0 + uy * t - ux * r * 0.35, -1); }
    const c = s.add(hdG_CHAR, { layer, R: 2 });
    s.line(c, x1 - ux * Math.min(9, L * 0.4), y1 - uy * Math.min(9, L * 0.4), x1, y1, r * 0.98, r * 0.9);
    const e = s.add(hdPal('#6b4a2c', '#a87a4a', '#c99a62', '#dcb27a', '#ecc896'), { layer, R: 1.5, flat: 1 });
    s.ellipse(e, x0 + ux * 0.6, y0 + uy * 0.6, Math.max(1.6, r * (0.55 + Math.abs(ux) * 0.1)), r * 0.85);
    s.mod(x0 + ux * 0.6, y0 + uy * 0.6, -1);
}
hdG_reg('campfire', 18, 12, 9, 10, s => {
    const pit = s.add(hdG_CHAR, { layer: 0, R: 3, flat: 1 });
    s.ellipse(pit, 27, 20, 18, 7.5);
    hdG_speck(s, pit, 5, 0.08, 0.22, 2);
    hdG_ring(s, 27, 19.5, 22, 9.5, 10, 5.6, 3, false);
    /* the fire laid ready: logs crossing in the middle (where the flames are drawn) */
    hdG_firelog(s, 9, 21.5, 24, 18.5, 2.6, true, 3);
    hdG_firelog(s, 45, 21.5, 30, 18.5, 2.6, false, 3);
    hdG_firelog(s, 19, 13.5, 26, 18, 2.2, false, 3);
    hdG_firelog(s, 36, 13.5, 28.5, 18, 2.2, true, 3);
    hdG_ring(s, 27, 19.5, 22, 9.5, 10, 5.6, 3, true);
});
hdG_reg('bonfire', 34, 18, 17, 15, s => {
    const pit = s.add(hdPal('#120c0a', '#1e1614', '#2a201c', '#3a2e28', '#4e423a'), { layer: 0, R: 4, flat: 1 });
    s.ellipse(pit, 51, 32, 39, 14);
    hdG_speck(s, pit, 9, 0.08, 0.3, 2);
    hdG_ring(s, 51, 32, 44, 15.5, 15, 8.4, 7, false);
    /* logs laid in a star, leaning in to the middle where the flames go, their inner ends burnt black */
    const C = [51, 28.5];
    const logs = [[15, 33, 1], [87, 33, 0], [27, 21, 0], [75, 21, 1], [44, 15, 1], [60, 15, 0], [30, 43, 1], [72, 43, 0]];
    logs.sort((p, q) => p[1] - q[1]);
    for (const [x, y, l] of logs) {
        const ex = C[0] + (x - C[0]) * 0.1, ey = C[1] + (y - C[1]) * 0.1;
        hdG_firelog(s, x, y, ex, ey, 3.4, l, y > 30 ? 4 : 3);
    }
    /* embers glowing between the burnt ends (it's lit every evening) */
    for (const [x, y] of [[47, 29], [53, 27], [50, 31], [55, 30], [46, 27], [51, 25]]) { s.px(x, y, '#9a3018'); s.px(x + 1, y, '#d85a24'); }
    s.px(50, 28, '#f08a3a'); s.px(51, 28, '#ffb050');
    hdG_ring(s, 51, 32, 44, 15.5, 15, 8.4, 7, true);
});

/* ---------------------------------------------------------------- the noodle cart (out at night) */
hdG_reg('noodle_cart', 40, 36, 20, 34, s => {
    const red = hdRamp('#e0405a'), post = hdG_WOODDK;
    /* the wheels, under the body */
    for (const cx of [27, 93]) {
        const wh = s.add(hdPal('#1e1a24', '#2d2832', '#3f3a4a', '#544e60', '#6a6478'), { layer: 0, R: 3, grad: 0.15 });
        s.ellipse(wh, cx, 98.5, 9.5, 9.5);
        hdG_each(s, wh, (x, y, i) => { const r = Math.hypot(x + 0.5 - cx, y + 0.5 - 98.5); if (r > 6 && r < 7.2) s.mods[i] += 1; });
        const hub = s.add(hdRamp('#7a7686'), { layer: 1, R: 2 });
        s.ellipse(hub, cx, 98.5, 3.2, 3.2);
    }
    /* the posts holding up the awning */
    for (const x of [14, 101]) { const p = s.add(post, { layer: 1, R: 2, grad: 0.1 }); s.rect(p, x, 12, 6, 32); hdG_grain(s, p, x, true, 0.7); }
    /* the paper lantern, lit: ribs round it, dark caps, a word painted down it */
    const str = s.add(hdRamp('#3f3a4a'), { layer: 1, R: 1 });
    s.rect(str, 50, 16, 1, 4);
    const lan = s.add(hdPal('#b0602a', '#f0a43a', '#ffd35a', '#ffe68a', '#fff6c8'), { layer: 2, R: 5, grad: 0.15, k: 1.1 });
    s.poly(lan, [[45, 20], [56, 20], [58.5, 23], [59, 28], [58.5, 32], [56, 35], [45, 35], [42.5, 32], [42, 28], [42.5, 23]]);
    for (const y of [23, 26, 29, 32]) for (let x = 42; x < 59; x++) s.mod(x, y, -1);
    for (const y of [19, 35]) { const cap = s.add(hdRamp('#3a3340'), { layer: 3, R: 1.5, grad: 0.3 }); s.rect(cap, 45, y, 11, 2); }
    for (const [x, y] of [[50, 22], [50, 23], [49, 24], [51, 24], [50, 26], [50, 27], [50, 28], [49, 28], [51, 30], [50, 31], [50, 32], [49, 32]]) s.px(x, y, '#c0302a');
    /* the awning: the roof cloth sloping back, a scalloped valance in front */
    const roof = s.add(red, { layer: 4, R: 3, grad: 0.35, bias: 0.04 });
    s.poly(roof, [[7, 0.5], [113, 0.5], [116.5, 9], [3.5, 9]]);
    for (let x = 8; x < 114; x++) if (x % 12 === 0) for (let y = 1; y < 9; y++) s.mod(x + (y - 1) * 0.1, y, -1);
    const val = s.add(red, { layer: 5, R: 2.5, grad: 0.2, bias: -0.02 });
    s.rect(val, 4, 9, 112, 6);
    for (let k = 0; k < 9; k++) s.ellipse(val, 10.5 + k * 12.4, 14.5, 6.3, 4);
    for (let x = 5; x < 115; x++) { s.mod(x, 9, 1); s.mod(x, 10, 1); }
    for (let x = 5; x < 115; x++) s.mod(x, 13, -1);
    /* the counter and the cart's body: planks, the cream sign with its line of writing */
    const top = s.add(hdRamp('#e8763c'), { layer: 6, R: 2, grad: 0.4 });
    s.rect(top, 9, 41, 102, 10);
    hdG_grain(s, top, 71, false, 0.7);
    for (let x = 10; x < 110; x++) { s.mod(x, 41, 1); s.mod(x, 48, -1); }
    const body = s.add(hdRamp('#c9542e'), { layer: 6, R: 2, grad: 0.25 });
    s.rect(body, 10, 51, 100, 40);
    const sign = s.add(hdPal('#b8907a', '#ecd8c4', '#fff1e4', '#fff8f0', '#ffffff'), { layer: 7, R: 2, grad: 0.15 });
    s.rect(sign, 18, 57, 78, 27);
    for (let x = 19; x < 95; x++) s.mod(x, 57, 1);
    /* the shop's sign: a steaming bowl of noodles between two brushed words */
    const ink = '#c9542e', ink2 = '#a8401f';
    for (let x = 48; x <= 68; x++) s.px(x, 68, ink2);
    for (let y = 69; y <= 74; y++) { const hw = 10 - (y - 69) * (y - 69) * 0.22; for (let x = Math.round(58 - hw); x <= Math.round(58 + hw); x++) s.px(x, y, y === 69 ? ink2 : ink); }
    for (let x = 54; x <= 62; x++) s.px(x, 75, ink2);
    for (let k = 0; k < 9; k++) { s.px(58 + k, 66 - k * 0.6, '#7a3a20'); s.px(59 + k, 67 - k * 0.6, '#7a3a20'); }
    for (const [x, y] of [[52, 63], [53, 62], [52, 61], [57, 63], [58, 62], [57, 61], [57, 60]]) s.px(x, y, '#d8b8a8');
    for (const x0 of [25, 34, 75, 84]) {
        for (let d = 0; d < 6; d++) s.px(x0 + d, 69, ink);
        for (let y = 66; y < 75; y++) s.px(x0 + 2, y, y === 66 || y === 74 ? ink2 : ink);
        s.px(x0, 72, ink2); s.px(x0 + 1, 71, ink); s.px(x0 + 4, 71, ink); s.px(x0 + 5, 73, ink2);
    }
    /* the wheel wells */
    for (const x of [24, 90]) { const wl = s.add(hdRamp('#3f3a4a'), { layer: 7, R: 1.5, flat: 1 }); s.rect(wl, x, 84, 9, 6); }
    /* the body's planks (only where the body shows) */
    hdG_each(s, body, (x, y, i) => { if (x % 8 === 6) s.mods[i] -= 1; else if (x % 8 === 7 && y < 60) s.mods[i] += 1; if (y === 89) s.mods[i] -= 1; });
});

/* ---------------------------------------------------------------- the ice cream stand */
hdG_reg('icecream', 36, 38, 18, 36, s => {
    const pink = hdRamp('#ff8ac2'), wht = hdPal('#a08a96', '#e6d6dc', '#fff7f1', '#fffbf8', '#ffffff');
    /* wheels and the push handle */
    for (const cx of [27, 81]) {
        const wh = s.add(hdPal('#1e1a24', '#2d2832', '#3a3340', '#504a5c', '#666072'), { layer: 0, R: 3, grad: 0.15 });
        s.ellipse(wh, cx, 98, 11, 10);
        const hub = s.add(hdRamp('#9a96a6'), { layer: 1, R: 2 });
        s.ellipse(hub, cx, 98, 3.4, 3.2);
        s.px(cx - 1, 96, '#e8e6f0');
    }
    const hd = s.add(hdRamp('#9a96a6'), { layer: 1, R: 1.5 });
    s.rect(hd, 98, 63, 8, 3); s.rect(hd, 103, 63, 3, 8);
    /* the umbrella's pole */
    const pole = s.add(hdRamp('#9a96a6'), { layer: 1, R: 2, grad: 0.1 });
    s.rect(pole, 51, 30, 6, 26);
    /* the cart: a pale blue freezer lid, the striped body with a cone painted on it, the pink trim */
    const lid = s.add(hdRamp('#8fd0f0'), { layer: 2, R: 2, grad: 0.4 });
    s.rect(lid, 7, 53, 95, 10);
    for (let x = 8; x < 101; x++) { s.mod(x, 53, 2); s.mod(x, 54, 1); }
    for (const x of [30, 31, 70, 71]) for (let y = 56; y < 62; y++) s.mod(x + (y - 56) * 0.5, y, 1);
    const body = s.add(wht, { layer: 2, R: 3, grad: 0.2 });
    s.rect(body, 10, 63, 89, 27);
    hdG_each(s, body, (x, y) => { if (Math.floor((x - 10) / 6) % 2 === 0) s.recolor(x, y, hdRamp('#ffd1e3')); });
    const trim = s.add(hdRamp('#e0559a'), { layer: 3, R: 2, grad: 0.3 });
    s.rect(trim, 10, 89, 89, 6);
    for (let x = 11; x < 98; x++) s.mod(x, 89, 1);
    /* the cone: a pink scoop on a vanilla one, a waffle cone */
    hdG_over(s, o => {
        const cone = o.add(hdRamp('#d9a05a'), { layer: 1, R: 2, grad: 0.2 });
        o.poly(cone, [[46.5, 77], [62.5, 77], [55, 90]]);
        for (let y = 78; y < 89; y++) for (let x = 46; x < 63; x++) if ((x + y) % 4 === 0) o.mod(x, y, -1);
        const van = o.add(hdRamp('#ffe0a8'), { layer: 2, R: 3, grad: 0.1 });
        o.ellipse(van, 54.5, 74, 7.5, 5);
        const st = o.add(hdRamp('#ff9ec0'), { layer: 3, R: 3.5, grad: 0.1 });
        o.ellipse(st, 54.5, 68, 6.5, 5.5);
        o.px(52, 66, '#ffe0ee'); o.px(53, 66, '#ffffff');
        o.px(57, 70, '#e0407a'); o.px(51, 70, '#7ad0e8'); o.px(55, 72, '#ffd84a');
    });
    /* the umbrella: pink and white panels from the top to a scalloped edge */
    const dome = s.add(pink, { layer: 4, R: 6, grad: 0.3, k: 1.1 });
    s.poly(dome, [[45, 1.5], [63, 1.5], [78, 6], [94, 14], [104, 22], [107.5, 28], [0.5, 28], [4, 22], [14, 14], [30, 6]]);
    hdG_each(s, dome, (x, y) => { const u = (x + 0.5 - 54) / (8 + (y + 4) * 1.75); if (Math.floor(u * 3 + 100.5) % 2 === 0) s.recolor(x, y, wht); });
    const edge = s.add(hdRamp('#e0559a'), { layer: 5, R: 2, grad: 0.2 });
    s.rect(edge, 1, 28, 106, 3);
    for (let k = 0; k < 9; k++) s.ellipse(edge, 6.5 + k * 11.9, 31, 5.4, 2.6);
    for (let x = 2; x < 106; x++) s.mod(x, 28, 1);
    const knob = s.add(hdRamp('#e0559a'), { layer: 5, R: 1.5 });
    s.ellipse(knob, 54, 1.5, 2.4, 1.6);
});

/* ---------------------------------------------------------------- the picnic table */
hdG_reg('picnic', 48, 26, 24, 22, s => {
    for (const x of [18, 120]) { const lg = s.add(hdG_WOODXD, { layer: 0, R: 2, grad: 0.2 }); s.rect(lg, x, 58, 6, 14); }
    /* the far bench */
    const b1 = s.add(hdG_WOOD, { layer: 1, R: 2, grad: 0.3 });
    hdG_rr(s, b1, 9, 7, 126, 14, 2);
    hdG_grain(s, b1, 81);
    for (let x = 10; x < 134; x++) { s.mod(x, 7, 1); s.mod(x, 12, -1); s.mod(x, 18, -1); s.mod(x, 19, -1); s.mod(x, 20, -1); }
    /* the tablecloth, checked red and white, hanging a little over the front edge */
    const cl = s.add(hdPal('#8a2436', '#c0304a', '#e0405a', '#ec6878', '#f69aa6'), { layer: 2, R: 2, flat: 1, grad: 0.25 });
    s.poly(cl, [[5, 21], [139, 21], [141, 45], [3, 45]]);
    const cw = hdPal('#a89aa2', '#e4dcdc', '#ffffff', '#ffffff', '#ffffff');
    hdG_each(s, cl, (x, y) => { const u = Math.floor((x - 3 + (y - 21) * 0.08) / 6), v = Math.floor((y - 21) / 6); if ((u + v) % 2) s.recolor(x, y, cw); });
    const hem = s.add(hdPal('#6e6670', '#a8a0a8', '#c8c0c8', '#dcd6dc', '#ece8ec'), { layer: 3, R: 1.5, grad: 0.4 });
    s.poly(hem, [[3, 44], [141, 44], [141, 48], [3, 48]]);
    for (let x = 8; x < 140; x += 14) { s.mod(x, 46, -1); s.mod(x, 47, -1); s.mod(x + 1, 47, -1); }
    /* lunch: an orange and a blue cup, and a plate */
    hdG_over(s, o => {
        const or = o.add(hdRamp('#f7962d'), { layer: 2, R: 4, grad: 0.1 });
        o.ellipse(or, 66, 31, 6, 5.6);
        o.px(64, 28, '#ffd8a0'); o.px(65, 28, '#ffc070'); o.px(66, 26, '#4f9a3f'); o.px(67, 26, '#6cc063');
        const cup = o.add(hdRamp('#4ea8f0'), { layer: 2, R: 2, grad: 0.3 });
        o.poly(cup, [[83.5, 28.5], [93.5, 28.5], [92.5, 40], [84.5, 40]]);
        const top = o.add(hdRamp('#2c78c0'), { layer: 3, R: 1, flat: 1 });
        o.ellipse(top, 88.5, 29.5, 4.4, 1.6);
        o.px(86, 31, '#bfe4ff'); o.px(86, 32, '#bfe4ff'); o.px(86, 33, '#9ad0ff');
    });
    /* the near bench */
    const b2 = s.add(hdG_WOOD, { layer: 4, R: 2, grad: 0.3 });
    hdG_rr(s, b2, 9, 49, 126, 14, 2);
    hdG_grain(s, b2, 82);
    for (let x = 10; x < 134; x++) { s.mod(x, 49, 1); s.mod(x, 54, -1); s.mod(x, 60, -1); s.mod(x, 61, -1); s.mod(x, 62, -1); }
});

/* ---------------------------------------------------------------- picnic blankets (flat on the ground) */
/* red and white checks: u, v the check a pixel is in */
function hdG_checks(s, id, fn, cw) {
    cw = cw || hdPal('#c8a8a0', '#efdcd2', '#fff7f1', '#fffbf8', '#ffffff');
    hdG_each(s, id, (x, y, i) => {
        const [u, v] = fn(x, y);
        if ((Math.floor(u) + Math.floor(v)) % 2) s.recolor(x, y, cw);
        /* the weave: a faint cross-hatch, a soft fold or two */
        if ((x + y) % 3 === 0 && (x - y) % 2 === 0 && hdG_h(x, y, 5) < 0.6) s.mods[i] -= 1;
    });
}
hdG_reg('picnic_blanket', 44, 26, 22, 20, s => {
    const bl = s.add(hdPal('#8a2436', '#c0304a', '#e0405a', '#ec6878', '#f69aa6'), { layer: 0, R: 2, flat: 1, grad: 0.12 });
    s.poly(bl, [[24, 9], [131, 9], [115, 72], [3, 72]]);
    hdG_checks(s, bl, (x, y) => [(x - 3 + (72 - y) * 0.333) / 18, (y - 9) / 9]);
    /* a soft fold across it */
    hdG_each(s, bl, (x, y, i) => { const d = (x - 70) * 0.3 + (y - 40); if (d > 0 && d < 2) s.mods[i] -= 1; else if (d >= 2 && d < 4) s.mods[i] += 1; });
    hdG_over(s, o => {
        /* a glass of water */
        const gl = o.add(hdPal('#4a8aa0', '#8ccad8', '#bfe8f0', '#ddf6fa', '#ffffff'), { layer: 1, R: 2, grad: 0.3 });
        o.poly(gl, [[17, 15], [27, 15], [26, 29], [18, 29]]);
        o.px(19, 18, '#ffffff'); o.px(19, 19, '#ffffff'); o.px(19, 20, '#eefcff');
        const wt = o.add(hdRamp('#6fc0dc'), { layer: 2, R: 1, flat: 1 });
        o.ellipse(wt, 22, 19.5, 4, 1.4);
        /* the basket: woven sides, a lid and a handle */
        const hn = o.add(hdRamp('#a8783a'), { layer: 1, R: 1.5 });
        for (let a = 0; a <= 20; a++) { const t = a / 20 * Math.PI; o._ellipse(hn, 98 - Math.cos(t) * 13, 10 - Math.sin(t) * 8.5, 1.6, 1.6); }
        const bk = o.add(hdRamp('#c9955a'), { layer: 2, R: 3, grad: 0.2 });
        o.poly(bk, [[83, 9], [114, 9], [113, 30], [84, 30]]);
        for (let y = 10; y < 30; y++) for (let x = 84; x < 114; x++) if (((x - 84) % 6 < 3) !== (Math.floor((y - 10) / 3) % 2 === 0)) o.mod(x, y, -1);
        const lid = o.add(hdRamp('#b8844a'), { layer: 3, R: 2, grad: 0.4 });
        o.poly(lid, [[82, 8], [115, 8], [115, 13], [82, 13]]);
        for (let x = 83; x < 115; x++) o.mod(x, 8, 1);
    });
});
hdG_reg('blanket', 32, 16, 16, 12, s => {
    const bl = s.add(hdPal('#8a2436', '#c0304a', '#e0405a', '#ec6878', '#f69aa6'), { layer: 0, R: 2, flat: 1, grad: 0.12 });
    hdG_rr(s, bl, 3, 3, 90, 39, 2);
    hdG_checks(s, bl, (x, y) => [(x - 3 + 6) / 12, (y - 3 + 6) / 12], hdPal('#c8a888', '#efdcc0', '#fff4dc', '#fff9ec', '#ffffff'));
    hdG_each(s, bl, (x, y, i) => { const d = (x - 34) * 0.5 - (y - 10); if (d > -0.5 && d < 0.5 && (x + y) % 2) s.mods[i] -= 1; else if (d >= 0.5 && d < 2.5) s.mods[i] += 1; });
});

/* ---------------------------------------------------------------- the scarecrow */
hdG_reg('scarecrow', 22, 36, 11, 34, s => {
    const wood = hdRamp('#8a5a2b'), straw = hdPal('#9a7424', '#d0a83c', '#f2d06a', '#f8e08a', '#fff0b8');
    /* the post and the crossbar for the arms, straw sticking out of the ends */
    const post = s.add(wood, { layer: 0, R: 2, grad: 0.1 });
    s.rect(post, 29.5, 70, 7, 32);
    hdG_grain(s, post, 3, true, 0.8);
    const bar = s.add(wood, { layer: 1, R: 2, grad: 0.25 });
    s.rect(bar, 6, 47, 54, 7);
    hdG_grain(s, bar, 4, false, 0.8);
    for (const sd of [-1, 1]) {
        const st = s.add(straw, { layer: 2, R: 1.5, grad: 0.1 });
        const x0 = sd < 0 ? 7 : 59;
        for (let k = 0; k < 6; k++) s.line(st, x0, 50 + (k % 3) * 1.5, x0 + sd * (5 + (k % 3) * 1.5), 48 + k * 1.8, 0.9, 0.6);
    }
    /* the shirt: red plaid, hung from the bar */
    const sh = s.add(hdRamp('#d94a3a'), { layer: 3, R: 4, grad: 0.2 });
    s.poly(sh, [[18, 45], [48, 45], [53, 48], [52, 55], [48, 56], [49, 77], [17, 77], [18, 56], [14, 55], [13, 48]]);
    hdG_each(s, sh, (x, y, i) => { const u = (x - 16) % 6, v = (y - 45) % 6; if (u < 2 && v < 2) s.recolor(x, y, hdG_WHITE); else if (u < 2 || v < 2) s.recolor(x, y, hdRamp('#f08a7a')); });
    for (let y = 47; y < 77; y += 4) s.px(33, y, '#7a2a20');
    for (let y = 46; y < 76; y++) s.mod(32, y, -1);
    /* the burlap head: two button eyes and a stitched smile */
    const head = s.add(hdPal('#8a6a40', '#c8a86e', '#e8c890', '#f2d8aa', '#fbe8c8'), { layer: 4, R: 6, grad: 0.15 });
    s.poly(head, [[17, 23], [49, 23], [50, 32], [47, 38], [42, 43], [24, 43], [19, 38], [16, 32]]);
    hdG_each(s, head, (x, y, i) => { if ((x + y * 2) % 5 === 0 && hdG_h(x, y, 9) < 0.6) s.mods[i] -= 1; });
    const tie = s.add(hdRamp('#c9a060'), { layer: 5, R: 1.5, grad: 0.2 });
    s.rect(tie, 24, 41, 18, 3);
    for (const x of [25, 37]) { s.px(x, 28, '#3a3340'); s.px(x + 1, 28, '#3a3340'); s.px(x, 29, '#3a3340'); s.px(x + 1, 29, '#2a2430'); s.px(x, 27, '#6a6070'); }
    for (const [x, y] of [[27, 35], [29, 36], [31, 36], [33, 36], [35, 36], [37, 35], [39, 34]]) { s.px(x, y, '#8a5a2b'); s.px(x + 1, y, '#6a4020'); }
    for (const [x, y] of [[28, 34], [32, 35], [36, 34]]) s.px(x, y, '#8a5a2b');
    /* straw poking out under the hat */
    const fr = s.add(straw, { layer: 5, R: 1.5 });
    for (const [x, y, d] of [[17, 24, -1], [19, 25, -1], [47, 24, 1], [45, 25, 1], [16, 27, -1], [49, 27, 1]]) s.line(fr, x, y, x + d * 3, y + 4, 0.8, 0.5);
    /* the straw hat: a wide brim, the crown, a red band */
    const brim = s.add(hdPal('#9a7424', '#c8a038', '#e8c050', '#f2d26c', '#f9e49a'), { layer: 6, R: 3, grad: 0.3 });
    s.poly(brim, [[10, 13], [56, 13], [62, 17], [61, 21], [54, 23.5], [12, 23.5], [5, 21], [4, 17]]);
    const crown = s.add(hdPal('#9a7424', '#c8a038', '#e8c050', '#f2d26c', '#f9e49a'), { layer: 7, R: 5, grad: 0.25 });
    s.poly(crown, [[22, 4], [27, 2.5], [39, 2.5], [44, 4], [45, 17], [21, 17]]);
    for (const id of [brim, crown]) hdG_each(s, id, (x, y, i) => { if (((x + y) % 4 === 0) !== ((x - y + 400) % 4 === 0) && hdG_h(x, y, 2) < 0.4) s.mods[i] -= 1; });
    const band = s.add(hdRamp('#e0405a'), { layer: 8, R: 1.5, grad: 0.3 });
    s.rect(band, 21, 13, 24, 4);
});

/* ---------------------------------------------------------------- the easel (a wallpaper shown on its canvas) */
hdG_reg('easel', 16, 32, 8, 31, s => {
    const leg = hdRamp('#9a6b45');
    const back = s.add(hdG_WOODDK, { layer: 0, R: 1.5, grad: 0.1, bias: -0.06 });
    s.line(back, 27.5, 70, 28.5, 95, 2, 2);
    for (const [x0, x1] of [[13, 8.5], [35, 39.5]]) { const l = s.add(leg, { layer: 1, R: 2, grad: 0.1 }); s.line(l, x0, 72, x1, 94.5, 2.4, 2.2); }
    const mast = s.add(leg, { layer: 1, R: 2, grad: 0.1 });
    s.rect(mast, 21, 10, 6, 14);
    s.ellipse(mast, 24, 10.5, 3, 2.2);
    /* the canvas in its frame, the ledge it stands on */
    const fr = s.add(hdRamp('#8a5a33'), { layer: 2, R: 2, grad: 0.2 });
    s.rect(fr, 0.5, 20, 47, 52);
    hdG_grain(s, fr, 61, false, 0.6);
    const cv = s.add(hdPal('#b8a888', '#e6dac0', '#f7ecd6', '#fbf4e6', '#fffaf2'), { layer: 3, R: 2, flat: 1, grad: 0.2 });
    s.rect(cv, 5, 24, 38, 44);
    hdG_each(s, cv, (x, y, i) => { if (hdG_h(x, y, 3) < 0.02) s.mods[i] -= 1; });
    const ledge = s.add(hdRamp('#8a5a33'), { layer: 4, R: 1.5, grad: 0.35 });
    s.rect(ledge, 2, 68, 44, 4); s.rect(ledge, 4, 72, 40, 5);
    for (let x = 3; x < 45; x++) s.mod(x, 68, 1);
});

/* ---------------------------------------------------------------- the shop's display board (a thing for sale on it) */
hdG_reg('display_board', 40, 30, 20, 29, s => {
    const leg = s.add(hdRamp('#8a5a33'), { layer: 0, R: 2, grad: 0.1 });
    s.rect(leg, 12, 64, 6, 17); s.rect(leg, 102, 64, 6, 17);
    for (const x of [3, 90]) { const ft = s.add(hdRamp('#6b4a2a'), { layer: 1, R: 2, grad: 0.3 }); hdG_rr(s, ft, x, 79, 27, 8, 2); }
    const fr = s.add(hdRamp('#9a6b45'), { layer: 2, R: 3, grad: 0.25 });
    hdG_rr(s, fr, 0.5, 0.5, 119, 66, 3);
    hdG_grain(s, fr, 91);
    /* a bevel round the panel */
    for (let x = 8; x < 112; x++) { s.mod(x, 7, -1); s.mod(x, 60, 1); }
    for (let y = 7; y < 61; y++) { s.mod(7, y, -1); s.mod(111, y, 1); }
    const pn = s.add(hdPal('#b8a888', '#e2d6bc', '#f7ecd6', '#fbf2e2', '#fffaf2'), { layer: 3, R: 2, flat: 1, grad: 0.25 });
    s.rect(pn, 9, 9, 101, 51);
    for (let x = 9; x < 110; x++) { s.mod(x, 9, 2); s.mod(x, 10, 1); }
});

/* ---------------------------------------------------------------- the price tag */
hdG_reg('price_tag', 8, 7, 4, 6, s => {
    const str = s.add(hdPal('#9a2436', '#c03048', '#e0405a', '#ec6878', '#f69aa6'), { layer: 2, R: 1 });
    s.line(str, 4, 0.5, 4.5, 6, 1); s.line(str, 4.5, 6, 7.5, 10.5, 1);
    const tg = s.add(hdG_WHITE, { layer: 1, R: 2, grad: 0.2 });
    s.poly(tg, [[6, 6], [22.5, 6], [22.5, 18], [6, 18], [1, 12]]);
    s.px(7, 11, '#a8a0b0'); s.px(8, 11, '#c8c0cc');
    for (let x = 10; x < 19; x++) { s.px(x, 13, '#c9a47a'); s.px(x, 14, x % 3 === 0 ? '#f0e8f0' : '#b08a60'); }
});

/* ---------------------------------------------------------------- the sandcastle */
hdG_reg('sandcastle', 28, 22, 14, 19, s => {
    const sand = hdPal('#8a6a3a', '#c9a86a', '#e9cf8f', '#f4e0aa', '#fbeec7');
    /* the mound it stands on, and the moat round the towers */
    const mound = s.add(hdPal('#8a6a3a', '#bf9e62', '#d9bb7a', '#e6cc90', '#f0dcaa'), { layer: 0, R: 5, grad: 0.3 });
    s.poly(mound, [[8, 41], [76, 41], [82, 47], [83, 53], [76, 59], [60, 63.5], [24, 63.5], [8, 59], [1, 53], [2, 47]]);
    hdG_speck(s, mound, 3, 0.1, 0.07, 3);
    const moat = s.add(hdPal('#3a7a98', '#5fb0d0', '#8fd0f0', '#b4e2f6', '#e2f6ff'), { layer: 1, R: 2, flat: 1, grad: 0.4 });
    s.poly(moat, [[10, 45], [74, 45], [79, 49], [76, 54], [64, 56.5], [20, 56.5], [8, 54], [5, 49]]);
    for (const [x, y, n] of [[14, 50, 6], [34, 54, 8], [60, 52, 7], [70, 49, 4]]) for (let d = 0; d < n; d++) s.mod(x + d, y, 1);
    /* the island the castle sits on, inside the moat */
    const isl = s.add(sand, { layer: 2, R: 3, grad: 0.3 });
    s.poly(isl, [[14, 41], [70, 41], [72, 47], [66, 51], [18, 51], [12, 47]]);
    hdG_speck(s, isl, 4, 0.08, 0.06, 3);
    /* the wall between the towers: merlons on top, a walkway, an arched door */
    const wall = s.add(sand, { layer: 3, R: 3, grad: 0.2 });
    s.rect(wall, 29, 22, 28, 22);
    for (const x of [33, 42, 51]) s.rect(wall, x - 2, 16, 5, 7);
    hdG_speck(s, wall, 5, 0.07, 0.05, 3);
    for (let x = 30; x < 56; x++) { s.mod(x, 23, 1); s.mod(x, 24, 1); s.mod(x, 26, -1); }
    const door = s.add(hdPal('#6a4e2a', '#9a7c48', '#b8965a', '#c9a86a', '#d8b87a'), { layer: 4, R: 2, flat: 1, bias: -0.15 });
    s.rect(door, 39, 35, 7, 9); s.ellipse(door, 42.5, 35, 3.5, 3);
    /* the towers: round, lit from the left, crenellated */
    for (const [cx, top, seed] of [[23.5, 7, 6], [62.5, 5, 7]]) {
        const t = s.add(sand, { layer: 5, R: 6, grad: 0.15, k: 1.2 });
        s.rect(t, cx - 8, top + 4, 17, 41 - top - 3);
        s.ellipse(t, cx + 0.5, 44, 8.5, 2.5);
        for (const dx of [-7, -1.5, 4]) s.rect(t, cx + dx, top, 4, 5);
        hdG_speck(s, t, seed, 0.07, 0.05, 3);
        for (let x = cx - 7; x < cx + 9; x++) { s.mod(x, top + 6, -1); s.mod(x, top + 5, 1); }
        /* a window slit, and drips of wet sand down the side */
        for (let y = top + 12; y < top + 17; y++) s.px(Math.round(cx), y, '#9a7a48');
        for (const [dx, y0, n] of [[-5, top + 7, 6], [5, top + 9, 4]]) for (let d = 0; d < n; d++) s.mod(cx + dx, y0 + d, -1);
    }
    /* the little flag on the left tower */
    const pole = s.add(hdRamp('#6b4424'), { layer: 6, R: 1 });
    s.rect(pole, 21, 0, 2, 9);
    const fl = s.add(hdRamp('#e0405a'), { layer: 6, R: 2, grad: 0.2 });
    s.poly(fl, [[23, 0.5], [35.5, 1.5], [33, 3.5], [35.5, 5.5], [23, 6]]);
    /* a pink shell and a white pebble on the sand */
    const sh = s.add(hdRamp('#f7a8c4'), { layer: 3, R: 2 });
    s.ellipse(sh, 10.5, 55.5, 3, 2.4);
    s.mod(9, 55, -1); s.mod(11, 54, -1); s.mod(10, 57, -1);
    const pb = s.add(hdG_WHITE, { layer: 3, R: 2 });
    s.ellipse(pb, 73.5, 52, 2.4, 1.8);
});

/* ---------------------------------------------------------------- the wheelbarrow (full of soil and seedlings) */
hdG_reg('wheelbarrow', 28, 18, 14, 16, s => {
    const grn = hdRamp('#4f8a5e'), wood = hdRamp('#8a5a32');
    /* the legs and the wheel */
    for (const x of [33, 54]) { const l = s.add(hdRamp('#6b4424'), { layer: 0, R: 1.5, grad: 0.1 }); s.rect(l, x, 31, 3, 13); }
    const wh = s.add(hdPal('#1e1a24', '#2d2832', '#3a3340', '#504a5c', '#666072'), { layer: 1, R: 3, grad: 0.15 });
    s.ellipse(wh, 67.5, 38.5, 9.5, 9);
    hdG_each(s, wh, (x, y, i) => { const r = Math.hypot(x + 0.5 - 67.5, y + 0.5 - 38.5); if (r > 5.5 && r < 6.6) s.mods[i] += 1; });
    const hub = s.add(hdRamp('#9a96a6'), { layer: 2, R: 2 });
    s.ellipse(hub, 67.5, 38.5, 3.2, 3.2);
    /* the handle running back to a grip */
    const sh = s.add(wood, { layer: 2, R: 1.5, grad: 0.1 });
    s.line(sh, 9, 25, 30, 38, 2.2, 2);
    const gr = s.add(hdRamp('#6b4424'), { layer: 3, R: 2, grad: 0.15 });
    s.line(gr, 2.5, 22, 10, 26.5, 3.2, 3);
    /* the tub: soil and seedlings inside the green rim, tapering sides */
    const back = s.add(hdRamp('#6fae7c'), { layer: 3, R: 1, grad: 0.2, bias: -0.06 });
    hdG_rr(s, back, 17, 11, 51, 4, 1);
    const soil = s.add(hdRamp('#8a6038'), { layer: 4, R: 2, grad: 0.3 });
    s.rect(soil, 19, 13, 47, 6);
    hdG_speck(s, soil, 8, 0.25, 0.2, 2);
    for (const [x, h] of [[30, 6], [45, 5], [56, 4]]) {
        const sp = s.add(hdRamp('#5aa844'), { layer: 5, R: 1.5, grad: 0.1 });
        s.line(sp, x, 16, x, 16 - h, 0.7, 0.6);
        s.ellipse(sp, x - 2, 16 - h, 2.2, 1.3); s.ellipse(sp, x + 2, 16 - h - 0.5, 2.2, 1.3);
    }
    const tub = s.add(grn, { layer: 6, R: 4, grad: 0.3 });
    s.poly(tub, [[18, 20], [67, 20], [64, 33], [27, 33]]);
    const rim = s.add(hdRamp('#6fae7c'), { layer: 7, R: 1.5, grad: 0.35 });
    hdG_rr(s, rim, 16, 18, 53, 4, 1);
    for (let x = 17; x < 68; x++) s.mod(x, 18, 1);
    for (let x = 22; x < 64; x++) s.mod(x, 25, x % 2 ? -1 : 0);
});

/* ---------------------------------------------------------------- the tackle box, the bait bucket and a rod */
hdG_reg('tackle', 28, 22, 13, 20, s => {
    /* the rod leaning on the bucket: cork grip, a reel, the line hanging from the tip */
    const rod = s.add(hdRamp('#8a5a32'), { layer: 0, R: 1.5, grad: 0.1 });
    s.line(rod, 81.5, 1, 65, 54, 1.2, 2);
    const grip = s.add(hdRamp('#c9a06a'), { layer: 1, R: 1.5, grad: 0.2 });
    s.line(grip, 68, 44, 65, 54, 2.3, 2.4);
    const reel = s.add(hdG_STEEL, { layer: 2, R: 2, grad: 0.2 });
    s.ellipse(reel, 71.5, 40, 3, 3);
    s.px(71, 39, '#ffffff');
    const tip = s.add(hdRamp('#b6b0ac'), { layer: 1, R: 1 });
    s.line(tip, 82.5, 0, 80, 8, 0.8, 0.9);
    /* the bucket: a wire bail, water at the top, a bit of shine */
    const bail = s.add(hdRamp('#4f6f90'), { layer: 0, R: 1 });
    for (let a = 0; a <= 24; a++) { const t = a / 24 * Math.PI; s._ellipse(bail, 54 - Math.cos(t) * 9.5, 31 - Math.sin(t) * 8, 0.9, 0.9); }
    const bk = s.add(hdRamp('#6f8fb0'), { layer: 3, R: 4, grad: 0.25 });
    s.poly(bk, [[44, 32], [64, 32], [62.5, 56], [45.5, 56]]);
    for (let y = 36; y < 55; y++) { s.mod(48, y, 1); s.mod(49, y, 1); s.mod(61, y, -1); }
    for (let x = 45; x < 63; x++) { s.mod(x, 41, -1); s.mod(x, 50, -1); }
    const rm = s.add(hdRamp('#4f6f90'), { layer: 4, R: 1.5, grad: 0.3 });
    hdG_rr(s, rm, 43, 30, 22, 4, 1);
    const wt = s.add(hdPal('#3a7a98', '#5fb0d0', '#8fd0f0', '#b4e2f6', '#e2f6ff'), { layer: 5, R: 1.5, flat: 1, grad: 0.5 });
    s.ellipse(wt, 54, 34.5, 9, 1.8);
    /* the tackle box: a red lid, a handle, a yellow latch */
    const hn = s.add(hdRamp('#a8322a'), { layer: 3, R: 1.5, grad: 0.2 });
    s.rect(hn, 16, 19, 18, 3); s.rect(hn, 16, 19, 3, 11); s.rect(hn, 31, 19, 3, 11);
    const bx = s.add(hdRamp('#d9483b'), { layer: 4, R: 3, grad: 0.25 });
    hdG_rr(s, bx, 3, 29, 41, 27, 2);
    const lid = s.add(hdRamp('#ef6a5a'), { layer: 5, R: 2, grad: 0.4 });
    hdG_rr(s, lid, 3, 28, 41, 7, 2);
    for (let x = 4; x < 43; x++) { s.mod(x, 42, -1); s.mod(x, 43, -1); s.mod(x, 44, 1); }
    const la = s.add(hdRamp('#ffd84a'), { layer: 6, R: 1.5, grad: 0.3 });
    hdG_rr(s, la, 20, 38, 8, 8, 1);
    s.px(23, 41, '#8a6a1a'); s.px(24, 41, '#8a6a1a');
    /* the line from the rod's tip, see-through */
    const ln = [];
    for (let y = 2; y < 30; y++) ln.push([83, y, '#dce6f0', 150]);
    ln.push([82, 30, '#dce6f0', 150], [82, 31, '#e0405a', 255], [83, 31, '#e0405a', 255]);
    hdG_glaze(s, ln);
});

/* ---------------------------------------------------------------- beach volleyball: the ball, the net, the court */
hdG_reg('vb_ball', 10, 11, 5, 9, s => {
    const b = s.add(hdPal('#9a8a80', '#e2d8cc', '#fffaf0', '#fffdf8', '#ffffff'), { layer: 0, R: 9, grad: 0.15, k: 1.2 });
    s.ellipse(b, 15, 14.5, 14.2, 14.2);
    /* the seams as colored bands: yellow from the top left to the middle and down, blue from the top right */
    const Y = hdRamp('#ffcf40'), B = hdRamp('#4ea8f0'), C = [16.5, 15];
    const band = (pts, mat, w) => { for (let i = 0; i + 1 < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2); for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, y = y0 + (y1 - y0) * k / n; for (let dy = -w; dy <= w; dy++) for (let dx = -w; dx <= w; dx++) if (dx * dx + dy * dy <= w * w) s.recolor(Math.round(x + dx), Math.round(y + dy), mat); } } };
    band([[3, 9], [8, 10], [13, 12.5], C, [16, 22], [15.5, 28.5]], Y, 1.6);
    band([[26.5, 7.5], [22, 11], C], B, 1.6);
    s.px(7, 5, '#ffffff'); s.px(8, 5, '#ffffff'); s.px(7, 6, '#ffffff');
});
hdG_reg('vb_net', 112, 30, 56, 26, s => {
    const pole = hdPal('#7a7062', '#b8b0a0', '#e8e2d4', '#f4f0e6', '#ffffff');
    for (const x0 of [9, 312]) {
        const ft = s.add(hdRamp('#9a96a6'), { layer: 0, R: 2, grad: 0.3 });
        hdG_rr(s, ft, x0 - 3, 77, 21, 6, 2);
        const p = s.add(pole, { layer: 1, R: 4, grad: 0.1 });
        s.rect(p, x0, 7, 15, 72);
        const cap = s.add(hdRamp('#e0405a'), { layer: 2, R: 3, grad: 0.25 });
        hdG_rr(s, cap, x0 - 0.5, 1, 16, 9, 3);
    }
    /* the net: a white tape along the top, cords in a mesh (the holes see-through), a rope along the bottom */
    const cord = hdPal('#c4c0ca', '#d8d4dc', '#ece8e0', '#f8f5ef', '#ffffff');
    const mesh = s.add(cord, { layer: 1, R: 1, flat: 1, grad: 0.1 });
    const holes = [];
    for (let y = 21; y < 52; y++) for (let x = 24; x < 312; x++) {
        const hx = (x - 24) % 9, hy = (y - 21) % 9;
        if (hx < 2 || hy < 2) s.plot(mesh, x, y); else holes.push([x, y, '#2d2230', 105]);
    }
    const tape = s.add(hdPal('#9a94a2', '#dcd8e0', '#f8f6f2', '#ffffff', '#ffffff'), { layer: 2, R: 2, grad: 0.3 });
    s.rect(tape, 23, 13, 290, 8);
    for (let x = 24; x < 312; x += 3) { s.mod(x, 15, -1); s.mod(x, 19, -1); }
    const rope = s.add(cord, { layer: 2, R: 1.5, grad: 0.3 });
    s.rect(rope, 23, 50, 290, 4);
    for (let x = 24; x < 312; x++) if (x % 4 === 0) s.mod(x, 51, -1);
    hdG_glaze(s, holes);
});
hdG_reg('vb_court', 112, 80, 0, 0, s => {
    /* white rope lines pegged into the sand at the corners, a soft shadow beside each; a few footprints */
    const rope = hdPal('#d4ccbc', '#e6e0d4', '#fffaf0', '#ffffff', '#ffffff'), gl = [];
    const line = (x, y, w, h) => {
        const r = s.add(rope, { layer: 1, R: 1, grad: 0.2, flat: 1 });
        s.rect(r, x, y, w, h);
        /* the twist of the rope */
        hdG_each(s, r, (px, py, i) => { if ((w > h ? py === y + 1 : px === x + 1) && (px + py) % 4 === 0) s.mods[i] -= 1; });
        for (let j = 0; j < (w > h ? w : h); j++) for (const [d, a] of [[0, 64], [1, 44], [2, 22]]) gl.push(w > h ? [x + j + 1, y + h + d, '#78582a', a] : [x + w + d, y + j + 1, '#78582a', a]);
    };
    line(12, 9, 312, 3); line(12, 228, 312, 3); line(9, 12, 3, 216); line(324, 12, 3, 216);
    for (const [x, y] of [[10.5, 10.5], [325.5, 10.5], [10.5, 229.5], [325.5, 229.5]]) {
        const pg = s.add(hdPal('#6b4a2a', '#a8844e', '#c9a46a', '#dcbc84', '#ecd4a2'), { layer: 2, R: 2.5, grad: 0.2 });
        s.ellipse(pg, x, y, 4.6, 4.2);
        s.mod(x - 0.5, y - 0.5, -1); s.mod(x - 2, y - 2, 1);
        for (let d = 0; d < 3; d++) gl.push([Math.round(x + 4 + d), Math.round(y + 3), '#78582a', 60 - d * 15]);
    }
    for (const [x, y] of [[60, 16], [24, 18], [63, 18], [27, 20], [30, 24], [33, 26], [86, 54], [89, 56], [80, 60], [83, 62], [50, 64], [53, 66]]) {
        for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) if (!((i === 0 || i === 2) && (j === 0 || j === 3))) gl.push([x * 3 + i, y * 3 + j, '#96703c', 60]);
        gl.push([x * 3 + 1, y * 3 + 4, '#fff4dc', 50]);
    }
    hdG_glaze(s, gl);
});

/* ---------------------------------------------------------------- mannequins in the boutique window */
/* a dress form on a stand wearing one of the outfits, cut and colored as the outfit is on people (32a_hd_people.js:
   HD_STYLE, the gamedata colors), on a figure a little smaller than a person's */
const hdG_MQ_STYLE = { crimson: 'knit', sundress: 'sundress', pajamas: 'pajamas', overalls: 'overalls', beach: 'beach', party: 'party',
    yukata: 'yukata', raincoat: 'raincoat', hoodie: 'hoodie', sweaterdress: 'sweaterdress', chef: 'chef', cozy: 'cozy', goth: 'goth', tennis: 'tennis' };
function hdG_mannequin(s, id) {
    const o = (GD.sarahTpl && GD.sarahTpl.hair && GD.sarahTpl.hair.outfits[id]) || ['pants', '#b3263a', '#8a1b2d', '#d44a5c', '#4d6d9f', '#3a5584', '#f3f1ee', '#c9c6cf'];
    const sty = (typeof HD_STYLE !== 'undefined' && HD_STYLE[hdG_MQ_STYLE[id]]) || {};
    const top = hdRamp(o[1]), trim = hdRamp(o[3]), bot = hdRamp(o[4] || o[1]), shoe = hdRamp(o[6]);
    const form = hdPal('#8a7868', '#d8c8b4', '#e8dccb', '#f3e9dc', '#ffffff');
    const t = 42, b = 57, m = 49.5, w = 55, sk = sty.skirt, floor = sk === 'floor';
    /* the stand */
    const st = s.add(hdPal('#3a3540', '#55505c', '#6b6570', '#827c88', '#9a94a0'), { layer: 0, R: 2, grad: 0.4 });
    hdG_rr(s, st, 12.5, 71.5, 23, 6, 2);
    for (let x = 14; x < 35; x++) s.mod(x, 72, 1);
    /* legs and shoes (bare form legs under a skirt) */
    for (const [hx, fx] of [[20, 18.5], [28, 29.5]]) {
        const leg = s.add(sk ? form : bot, { layer: 1, R: 3, grad: 0.1 });
        s.line(leg, hx, b, fx + (hx < 24 ? 0.5 : -0.5), 66, 3.6, 3.1);
        if (floor) continue;
        const sh = s.add(shoe, { layer: 2, R: 2.5 });
        s.poly(sh, [[fx - 3.5, 66], [fx + 3.5, 66], [fx + 3.9, 69.5], [fx + 3.6, 71.5], [fx - 4.4, 71.5], [fx - 4.4, 69.5]]);
        for (let x = Math.round(fx - 4); x <= Math.round(fx + 3.5); x++) s.mod(x, 71, -1);
    }
    if (!sk) for (const x of [18, 30]) s.mod(x, 61, 1);
    /* the arms: sleeves (long, short, wide) or the bare form, hands at the hem */
    const long = sty.sleeves === 'long' || sty.sleeves === 'wide', wide = sty.sleeves === 'wide' ? 1 : 0;
    for (const sd of [-1, 1]) {
        const sh = [24 + sd * 8.5, 43.5], hd = [24 + sd * 11, 54.5], el = [24 + sd * 10.8, 49];
        const arm = s.add(long ? top : form, { layer: 4, R: 2.5, grad: 0.15, bias: -0.05 });
        s.line(arm, sh[0], sh[1], el[0], el[1], 2.5 + wide * 0.5, 2.2 + wide);
        s.line(arm, el[0], el[1], hd[0], hd[1] - 1.5, 2.2 + wide, 2 + wide * 1.5);
        if (sty.sleeves === 'short') { const sl = s.add(top, { layer: 4, R: 2.5, grad: 0.15 }); s.line(sl, sh[0], sh[1], (sh[0] + el[0]) / 2, (sh[1] + el[1]) / 2 - 1, 2.7, 2.6); }
        if (sty.cuffs || sty.wrap) { const cf = s.add(trim, { layer: 4, R: 1.5 }); s.line(cf, hd[0] - sd * 0.15, hd[1] - 3.6, hd[0], hd[1] - 2.6, 2.2 + wide, 2.5 + wide * 1.2); }
        const hand = s.add(form, { layer: 5, R: 2 });
        s.ellipse(hand, hd[0], hd[1] + 0.5, 2.1, 2.2);
    }
    /* the neck, the body, a skirt or a coat's tails */
    const neck = s.add(form, { layer: 2, R: 3, bias: -0.08 });
    s.poly(neck, [[21, 36], [27, 36], [27, t + 1], [25, t + 3], [23, t + 3], [21, t + 1]]);
    const torso = s.add(top, { layer: 3, R: 6, grad: 0.22 });
    s.poly(torso, [[17, t], [31, t], [33, t + 2], [32, m], [31, b - 3], [32, b], [16, b], [17, b - 3], [16, m], [15, t + 2]]);
    if (sk) {
        const skirt = s.add(sty.one ? top : bot, { layer: 3, R: 5, grad: 0.16 });
        const hem = floor ? 70.5 : 65, fl = floor ? 4 : 3.2;
        s.poly(skirt, [[16, w], [32, w], [32 + fl, hem], [31 + fl, hem + 1.2], [17 - fl, hem + 1.2], [16 - fl, hem]]);
        /* soft folds down the skirt */
        for (const x of [20, 28]) for (let y = w + 3; y < hem; y++) s.mod(x + (x < 24 ? -1 : 1) * (y - w) * 0.25, y, -1);
    }
    if (sty.coat || sty.chef) { const coat = s.add(top, { layer: 3, R: 5, grad: 0.18 }); s.poly(coat, [[16, w - 2], [32, w - 2], [33, b + 5], [15, b + 5]]); }
    /* the details, as on people */
    if (sty.knit) {
        for (let x = 17; x <= 31; x++) if (x % 2 === 0) s.mod(x, b - 2, -1);
        for (let y = t + 4; y < b - 3; y++) { if (y % 3 === 0) { s.mod(20, y, 1); s.mod(28, y, 1); } else if (y % 3 === 1) { s.mod(21, y, -1); s.mod(27, y, -1); } }
    }
    if (sty.cardigan) { for (let y = t + 2; y < b; y++) s.mod(24, y, -1); for (const y of [t + 5, t + 9, t + 13]) s.px(25, y, trim[1]); }
    if (sty.straps) {
        const bare = s.add(form, { layer: 3, R: 2, bias: -0.04 });
        s.poly(bare, [[17, t], [31, t], [33, t + 2], [29, t + 4], [24, t + 5], [19, t + 4], [15, t + 2]]);
        const sp = s.add(top, { layer: 4, R: 1 });
        s.line(sp, 19.5, t, 19.5, t + 3.5, 0.6); s.line(sp, 28.5, t, 28.5, t + 3.5, 0.6);
    }
    if (sty.bib) {
        const bib = s.add(bot, { layer: 4, R: 3, grad: 0.15 });
        s.poly(bib, [[18.5, t + 5], [29.5, t + 5], [29.5, b], [18.5, b]]);
        s.line(bib, 18.5, t + 5, 18.5, t + 0.5, 0.9); s.line(bib, 29.5, t + 5, 29.5, t + 0.5, 0.9);
        s.px(19, t + 5, '#e8c46a'); s.px(29, t + 5, '#e8c46a');
        s.rect(bib, 21, t + 8, 6, 3); s.mod(21, t + 8, -1); s.mod(26, t + 8, -1);
    }
    if (sty.hood) {
        const hood = s.add(top, { layer: 4, R: 3, grad: 0.1, bias: -0.04 });
        s.poly(hood, [[16.5, t - 0.5], [21, t - 1], [22.5, t + 2], [17.5, t + 3]]); s.poly(hood, [[31.5, t - 0.5], [27, t - 1], [25.5, t + 2], [30.5, t + 3]]);
        for (const x of [22, 26]) { s.px(x, t + 3, trim[2]); s.px(x, t + 4, trim[2]); s.px(x, t + 5, trim[1]); }
    }
    if (sty.pocket) { for (let x = 19; x <= 29; x++) s.mod(x, b - 6, -1); s.mod(19, b - 5, -1); s.mod(29, b - 5, -1); for (let x = 20; x <= 28; x++) s.mod(x, b - 5, 1); }
    if (sty.buttons) for (let y = t + 4; y < (sty.coat ? b + 4 : b - 1); y += 4) s.px(24, y, trim[2]);
    if (sty.piping) { for (let y = t + 1; y < b; y++) s.px(23, y, trim[3]); for (let x = 16; x <= 32; x++) s.px(x, b - 1, trim[3]); }
    if (sty.coat) for (let y = t + 2; y < b + 5; y++) s.mod(24, y, -1);
    if (sty.chef) {
        for (const y of [t + 4, t + 8, t + 12]) { s.px(21, y, '#c8ccd6'); s.px(27, y, '#c8ccd6'); }
        const nk = s.add(trim, { layer: 4, R: 1.5, grad: 0.3 });
        s.poly(nk, [[20.5, t - 0.5], [27.5, t - 0.5], [24, t + 3.5]]);
    }
    if (sty.obi || sty.sash) {
        const ob = s.add(trim, { layer: 4, R: 2, grad: 0.3 });
        s.rect(ob, 16, w - (sty.obi ? 3 : 1), 16, sty.obi ? 5 : 2.5);
        if (sty.obi) { s.mod(24, w - 1, 1); s.mod(23, w - 1, 1); }
    } else if (sk && sty.one) {
        /* a dress: the waist band in the trim color, as today's mannequins have it */
        const wb = s.add(trim, { layer: 4, R: 1.5, grad: 0.3 });
        s.rect(wb, 16, w - 1, 16, 2.5);
    }
    if (sk && !sty.one && sty.straps) {
        /* a top and a skirt: a sliver of the form between them */
        const mid = s.add(form, { layer: 4, R: 1.5, bias: -0.06 });
        s.rect(mid, 17, w - 2, 14, 2);
    }
    if (sty.wrap) { for (let y = t; y < w - 3; y++) s.mod(21 + (y - t) * 0.35, y, -1); for (let y = t; y < t + 6; y++) s.px(22 + (y - t) * 0.35, y, trim[3]); }
    if (sty.collar) { s.px(21, t, trim[3]); s.px(22, t + 1, trim[3]); s.px(27, t, trim[3]); s.px(26, t + 1, trim[3]); s.px(23, t + 1, trim[2]); s.px(25, t + 1, trim[2]); }
    if (sty.lace) for (let x = 14; x <= 34; x += 2) s.px(x, 65, trim[3]);
    if (sty.sparkle) for (const [x, y] of [[19, t + 6], [28, t + 10], [21, 59], [27, 62], [24, t + 13]]) s.px(x, y, '#fff6fb');
    /* the head: a smooth ball, no face */
    const head = s.add(form, { layer: 6, R: 9, grad: 0.15, k: 1.15 });
    s.ellipse(head, 24, 24, 14.4, 14.6);
    s.px(19, 15, '#ffffff'); s.px(20, 15, '#ffffff'); s.px(19, 16, '#ffffff');
}
for (const id of Object.keys(hdG_MQ_STYLE)) hdG_reg('mannequin_' + id, 16, 26, 8, 25, s => hdG_mannequin(s, id));

/* ---------------------------------------------------------------- tools: the icons, and the ones Sarah holds and swings */
/* (the anchors are where her hand is: kept exactly, or the tool won't sit in it) */
/* a wooden handle from (x0, y0) to (x1, y1), grain along it */
function hdG_handle(s, x0, y0, x1, y1, r0, r1, layer) {
    const h = s.add(hdG_WOOD, { layer: layer || 1, R: Math.max(1.2, r0 * 0.8), grad: 0.05 });
    s.line(h, x0, y0, x1, y1, r0, r1 == null ? r0 : r1);
    const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L;
    for (let t = 1; t < L - 1; t += 1) if (hdG_h(Math.round(t), 1, Math.round(x0 * 7 + y0)) < 0.35) s.mod(x0 + ux * t + uy * 0.6, y0 + uy * t - ux * 0.6, -1);
    return h;
}
/* a steel blade or head: a polygon, its edge (a run of points) bright */
function hdG_steel(s, pts, edge, layer) {
    const b = s.add(hdG_STEEL, { layer: layer || 2, R: 2.5, grad: 0.25 });
    s.poly(b, pts);
    if (edge) for (const [x, y] of edge) s.mod(x, y, 2);
    return b;
}
hdG_reg('tool_rod', 16, 16, 8, 8, s => {
    /* the rod: a cork-and-cord grip, the shaft tapering to the tip, a reel; the line down to a red bobber */
    hdG_handle(s, 9, 41, 38, 4.5, 3, 1.5);
    const grip = s.add(hdRamp('#3b2a45'), { layer: 2, R: 2.5, grad: 0.15 });
    s.line(grip, 6, 41.5, 15.5, 30.5, 4.6, 4);
    for (let k = 0; k < 4; k++) { const x = 8 + k * 2, y = 39 - k * 2.4; s.mod(x, y, 1); s.mod(x + 1, y - 1, 1); }
    const butt = s.add(hdG_WOODDK, { layer: 3, R: 1.5 });
    s.ellipse(butt, 5, 43.5, 2.6, 2.2);
    const reel = s.add(hdG_STEEL, { layer: 3, R: 2, grad: 0.3 });
    s.ellipse(reel, 20, 31, 3.2, 3.2);
    s.px(19, 30, '#ffffff');
    const tip = s.add(hdRamp('#dce9f2'), { layer: 2, R: 1 });
    s.line(tip, 35, 8, 38.5, 3.5, 1, 0.9);
    const line = s.add(hdPal('#8a9aa8', '#b8c8d6', '#dce9f2', '#eef6fb', '#ffffff'), { layer: 1, R: 1, flat: 1 });
    for (let y = 4; y < 30; y++) s.plot(line, Math.round(39 + (y - 4) * 0.08 + Math.sin((y - 4) / 26 * Math.PI) * 1.5), y);
    const bob = s.add(hdRamp('#e0405a'), { layer: 3, R: 2.5, grad: 0.2 });
    s.ellipse(bob, 41, 33, 3.4, 3.6);
    const bw = s.add(hdG_WHITE, { layer: 4, R: 1.5 });
    s.ellipse(bw, 41, 30.5, 3, 1.5);
});
hdG_reg('tool_axe', 16, 16, 8, 8, s => {
    hdG_handle(s, 9, 44, 29.5, 17, 3.4, 3.2);
    const knob = s.add(hdG_WOODDK, { layer: 2, R: 1.5 });
    s.ellipse(knob, 8, 45.5, 2.8, 2.2);
    /* the head: a steel block, the cutting edge bright on the right, the cheek darker below */
    const hd = hdG_steel(s, [[27, 1.5], [40, 1.5], [42.5, 1], [42.5, 17], [40, 16.5], [32, 16.5], [27, 19]], null, 3);
    for (let y = 2; y < 17; y++) { s.mod(41, y, 2); s.mod(40, y, 1); }
    for (let x = 28; x < 34; x++) s.mod(x, 16, -1);
    s.px(29, 4, '#ffffff'); s.px(30, 4, '#ffffff');
    const eye = s.add(hdG_WOODDK, { layer: 4, R: 1 });
    s.rect(eye, 27, 6, 4, 5);
});
hdG_reg('tool_shovel', 16, 16, 8, 8, s => {
    /* a T grip, the shaft, the blade with its socket */
    const tg = s.add(hdG_WOOD, { layer: 2, R: 2, grad: 0.3 });
    hdG_rr(s, tg, 3, 0.5, 20, 8, 3);
    hdG_handle(s, 15, 7, 33, 27, 3.2, 3.2);
    const sock = s.add(hdG_STEEL, { layer: 3, R: 1.5, grad: 0.2, bias: -0.08 });
    s.poly(sock, [[29, 23], [35, 23], [37, 28], [31, 28]]);
    const bl = hdG_steel(s, [[26.5, 27], [41.5, 27], [41.5, 37], [39, 41], [34, 43], [29, 41], [26.5, 37]], null, 4);
    for (let x = 28; x < 41; x++) { s.mod(x, 28, 2); s.mod(x, 29, 1); }
    for (let y = 31; y < 40; y++) s.mod(34, y, -1);
    s.px(39, 39, '#ffffff'); s.px(38, 40, '#f2f6fb');
});
hdG_reg('axe_up', 10, 16, 6, 15, s => {
    /* held up, head at the top: the edge on the left catches the light */
    hdG_handle(s, 18, 10, 18.5, 46.5, 3.4, 3.4);
    const hd = hdG_steel(s, [[1, 0.5], [17, 0.5], [17, 15.5], [4, 15.5], [1, 16]], null, 3);
    for (let y = 1; y < 15; y++) { s.mod(2, y, 2); s.mod(3, y, 1); }
    for (let x = 5; x < 16; x++) s.mod(x, 14, -1);
    s.px(6, 3, '#ffffff'); s.px(7, 3, '#ffffff');
    const eye = s.add(hdG_WOODDK, { layer: 4, R: 1 });
    s.rect(eye, 15, 5, 5, 6);
});
hdG_reg('axe_fwd', 16, 10, 1, 6, s => {
    /* swung forward: the handle level, the head at the far end with its edge up */
    hdG_handle(s, 1, 16.5, 34, 16.5, 3.6, 3.4);
    const hd = hdG_steel(s, [[33, 3], [47.5, 3], [47.5, 20.5], [36, 20.5], [33, 18]], null, 3);
    for (let x = 34; x < 48; x++) { s.mod(x, 4, 2); s.mod(x, 5, 1); }
    for (let y = 8; y < 20; y++) s.mod(46, y, -1);
    const eye = s.add(hdG_WOODDK, { layer: 4, R: 1 });
    s.rect(eye, 34, 13, 5, 6);
});
hdG_reg('shovel_up', 10, 16, 6, 12, s => {
    const tg = s.add(hdG_WOOD, { layer: 2, R: 2, grad: 0.3 });
    hdG_rr(s, tg, 6, 0.5, 23, 5, 2);
    hdG_handle(s, 18, 4, 18, 29, 3.4, 3.4);
    const sock = s.add(hdG_STEEL, { layer: 3, R: 1.5, grad: 0.2, bias: -0.08 });
    s.poly(sock, [[12, 27], [24, 27], [26, 31], [10, 31]]);
    const bl = hdG_steel(s, [[7, 30.5], [29, 30.5], [29, 42], [25, 45.5], [21, 47.5], [15, 47.5], [11, 45.5], [7, 42]], null, 4);
    for (let x = 8; x < 29; x++) { s.mod(x, 31, 2); s.mod(x, 32, 1); }
    for (let y = 35; y < 45; y++) s.mod(18, y, -1);
});
hdG_reg('shovel_dig', 16, 12, 2, 2, s => {
    /* pushed into the ground: the shaft from the hand down to the blade */
    hdG_handle(s, 1.5, 1.5, 27, 17, 3.4, 3.4);
    const sock = s.add(hdG_STEEL, { layer: 3, R: 1.5, grad: 0.2, bias: -0.08 });
    s.poly(sock, [[22, 13], [28, 14], [27, 19.5], [21, 18]]);
    const bl = hdG_steel(s, [[24, 16.5], [46, 16.5], [47.5, 19], [47.5, 33], [44.5, 35.5], [27, 35.5], [24, 33]], null, 4);
    for (let x = 25; x < 47; x++) { s.mod(x, 17, 2); s.mod(x, 18, 1); }
    s.px(44, 32, '#ffffff');
});
hdG_reg('carry_axe', 8, 12, 4, 10, s => {
    /* carried at her side, head up */
    hdG_handle(s, 13, 10, 13, 35.5, 3.2, 3.2);
    const hd = hdG_steel(s, [[1, 0.5], [16, 0.5], [16, 13.5], [4, 13.5], [1, 14]], null, 3);
    for (let y = 1; y < 13; y++) { s.mod(2, y, 2); s.mod(3, y, 1); }
    s.px(6, 3, '#ffffff');
    const eye = s.add(hdG_WOODDK, { layer: 4, R: 1 });
    s.rect(eye, 11, 4, 5, 6);
});
hdG_reg('carry_shovel', 8, 13, 4, 10, s => {
    const tg = s.add(hdG_WOOD, { layer: 2, R: 2, grad: 0.3 });
    hdG_rr(s, tg, 6, 0.5, 15, 5, 2);
    hdG_handle(s, 13.5, 4, 13.5, 25, 3.2, 3.2);
    const sock = s.add(hdG_STEEL, { layer: 3, R: 1.5, grad: 0.2, bias: -0.08 });
    s.poly(sock, [[9, 22], [18, 22], [20, 26], [7, 26]]);
    const bl = hdG_steel(s, [[3.5, 24.5], [23.5, 24.5], [23.5, 33], [20, 36.5], [7, 36.5], [3.5, 33]], null, 4);
    for (let x = 4; x < 23; x++) { s.mod(x, 25, 2); s.mod(x, 26, 1); }
});
