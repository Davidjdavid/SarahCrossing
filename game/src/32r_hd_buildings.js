/* ---- 32r_hd_buildings.js ---- */
/* HD buildings and landmarks: the shops, the museum, the barn, the windmill, the lighthouse, David's statue, the boat at
   the pier and the well, each today's sprite at three times the size (same box, anchor and door spot) with the shingles,
   boards, glass and signs the extra pixels allow. Coordinates are HD pixels; old ones show as 3 * n where it helps to
   see today's sprite under the new one. No ground shadows: the HD-2D view casts its own. */

/* ---------------------------------------------------------------- shared helpers */
/* a small seeded hash in [0, 1) for scatter that is the same every time */
function hdP_hash(x, y, k) { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul((k | 0) + 1, 1442695041); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function hdP_each(s, id, fn) { for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) if (s.part[y * s.w + x] === id) fn(x, y); }
function hdP_mix(c1, c2, t) { const a = hdRgb(c1), b = hdRgb(c2); return a.map((v, i) => Math.round(v + (b[i] - v) * t)); }
/* a five-shade palette for big flat surfaces (walls): small steps, so boards and seams read without getting noisy */
function hdP_soft(hex, out) { const r = hdRamp(hex); return [out ? hdRgb(out) : r[0], hdP_mix(r[1], r[2], 0.45), hdRgb(hex), hdP_mix(r[3], r[2], 0.35), r[3]]; }

/* texture passes are kept until the shapes are all drawn (hdP_finish), and touch only pixels still of their part:
   a mod or recolor made early would otherwise stick to whatever is drawn over that pixel later */
function hdP_mod(s, id, x, y, d) { (s.hdPm || (s.hdPm = [])).push(id, Math.round(x), Math.round(y), d); }
function hdP_rec(s, id, x, y, mat) { (s.hdPr || (s.hdPr = [])).push([id, Math.round(x), Math.round(y), typeof mat === 'string' ? hdRamp(mat) : mat]); }
function hdP_later(s, fn) { (s.hdPq || (s.hdPq = [])).push(fn); }
/* a darker version of a material, for cast shadows painted onto a part (same shading, cooler and dimmer) */
const HDP_DARK = new Map();
function hdP_dark(mat, t) {
    const key = mat; let d = HDP_DARK.get(key);
    if (!d) { d = mat.map((c, i) => hdP_mix(c, [74, 50, 84], i === 0 ? 0.1 : 0.24)); HDP_DARK.set(key, d); }
    return d;
}
/* a shadow cast straight down by part id onto lower layers, depth rows under its lower edge */
function hdP_drop(s, id, depth, slant) { hdP_later(s, () => {
    const W = s.w, L = s.parts[id].layer, done = new Uint8Array(W * s.h);
    for (let y = 0; y < s.h; y++) for (let x = 0; x < W; x++) {
        if (s.part[y * W + x] !== id || s.at(x, y + 1) === id) continue;
        for (let d = 1; d <= depth; d++) {
            const xx = x + Math.floor(d * (slant || 0)), yy = y + d, p = s.at(xx, yy);
            if (p < 0 || p === id) break;
            if (s.parts[p].layer >= L || done[yy * W + xx]) continue;
            done[yy * W + xx] = 1;
            const a = s.alt && s.alt[yy * W + xx] >= 0 ? s.alts[s.alt[yy * W + xx]] : s.parts[p].mat;
            s.recolor(xx, yy, hdP_dark(a));
        }
    }
}); }
/* finish a sprite: the texture passes, then shadows, then a firm outline on the lit (top and left) sides too */
function hdP_finish(s) {
    const m = s.hdPm || [];
    for (let i = 0; i < m.length; i += 4) if (s.at(m[i + 1], m[i + 2]) === m[i]) s.mod(m[i + 1], m[i + 2], m[i + 3]);
    for (const [id, x, y, mat] of s.hdPr || []) if (s.at(x, y) === id) s.recolor(x, y, mat);
    for (const f of s.hdPq || []) f();
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) if (s.at(x, y) >= 0 && (s.at(x - 1, y) < 0 || s.at(x, y - 1) < 0)) s.mod(x, y, -1);
    s.hdPm = s.hdPr = s.hdPq = null;
}

/* horizontal boards (siding): a shadow line under each board and a lit line on top of the next */
function hdP_boards(s, id, x0, y0, x1, y1, n, seed) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const r = (y - y0) % n, row = Math.floor((y - y0) / n);
        if (r === n - 1) hdP_mod(s, id, x, y, -1);
        else if (r === 0 && hdP_hash(x >> 3, row, seed) > 0.3) hdP_mod(s, id, x, y, 1);
        else if (r > 0 && hdP_hash((x + row * 13) >> 4, row, seed + 1) > 0.9 && (x + row * 5) % 16 === 0) hdP_mod(s, id, x, y, -1);
    }
}
/* vertical planks: a dark seam every n columns, a lit edge right of it, a knot here and there */
function hdP_planks(s, id, x0, y0, x1, y1, n, seed) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const r = (x - x0) % n, col = Math.floor((x - x0) / n);
        if (r === n - 1) hdP_mod(s, id, x, y, -1);
        else if (r === 0) hdP_mod(s, id, x, y, 1);
        else if (hdP_hash(col, (y + col * 7) >> 2, seed) > 0.96) hdP_mod(s, id, x, y, -1);
    }
}
/* roof shingles over a part: rows of rounded tiles, each row shading the top of the one below */
function hdP_shingles(s, id, x0, y0, x1, y1, rowH, tileW, seed, o) {
    o = o || {};
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const row = Math.floor((y - y0) / rowH), ry = (y - y0) % rowH, off = (row % 2) * (tileW >> 1), tx = Math.floor((x - x0 + off) / tileW), rx = (x - x0 + off) % tileW;
        const v = hdP_hash(tx, row, seed), corner = o.round ? (rx === 0 || rx === tileW - 1 ? 2 : rx === 1 || rx === tileW - 2 ? 1 : 0) : 0;
        let d = 0;
        if (ry >= rowH - 1 - corner) d = -1;                                  /* the gap under the tile's rounded lip */
        else if (rx === 0) d = -1;                                            /* the joint between two tiles */
        else if (ry === rowH - 2 - corner && rx > 1) d = 1;                   /* the lip catches the light */
        else if (ry === 0 && !o.flatTop) d = -1;                              /* in the shade of the row above */
        else if (v > 0.82 && ry < rowH - 2) d = v > 0.94 ? -1 : 1;            /* a few tiles a little off */
        if (d) hdP_mod(s, id, x, y, d);
    }
}
/* barrel tiles (half pipes running down the roof): each column lit on its left, shaded on its right, a course line
   every rowH rows */
function hdP_barrel(s, id, x0, y0, x1, y1, colW, rowH) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const r = (x - x0) % colW, ry = (y - y0) % rowH;
        let d = r === 0 ? -1 : r === 1 ? 1 : r >= colW - 2 ? -1 : 0;
        if (ry === rowH - 1) d = Math.min(d, 0) - 1; else if (ry === 0 && r > 0 && r < colW - 2) d += 1;
        if (d) hdP_mod(s, id, x, y, Math.max(-2, Math.min(2, d)));
    }
}
/* a window: a frame, glass catching the sky (a gradient and two glints), the cross bars and a sill; o.inside(gl, x, y,
   w, h) can paint what's behind the glass (recolors of the glass, so the glints stay on top) */
function hdP_window(s, x, y, w, h, o) {
    o = o || {};
    const L = o.layer || 3, fr = s.add(o.frame || '#8a5a2b', { layer: L + 1, R: 1.5, grad: 0.1, cast: 1 });
    const gl = s.add(o.glass || hdPal('#3c6a86', '#6fb2d4', '#9fd8ef', '#c4ecf8', '#f2fcff'), { layer: L, flat: 1, grad: 0.5, bias: 0.04 });
    const t = o.t || 3;
    s.rect(fr, x, y, w, h);
    s.rect(gl, x + t, y + t, w - 2 * t, h - 2 * t);
    if (o.inside) o.inside(gl, x + t, y + t, w - 2 * t, h - 2 * t);
    if (o.bars !== false) {
        const bx = x + Math.floor(w / 2) - 1, by = y + Math.floor(h / 2) - 1;
        if (o.bars !== 'h') s.rect(fr, bx, y, 2, h);
        if (o.bars !== 'v') s.rect(fr, x, by, w, 2);
    }
    /* glints: two diagonal streaks across the upper left of each pane */
    for (let j = y + t; j < y + h - t; j++) for (let i = x + t; i < x + w - t; i++) {
        const d = (i - x) + (j - y) * 0.9;
        if (Math.abs(d - w * 0.32) < 1.3 || Math.abs(d - w * 0.32 - 4) < 0.6) hdP_mod(s, gl, i, j, 2);
    }
    if (o.sill !== false) { const sl = s.add(o.sillMat || o.frame || '#8a5a2b', { layer: L + 2, R: 1, grad: 0.3, cast: 2 }); s.rect(sl, x - 2, y + h - 1, w + 4, 3); }
    return { fr, gl };
}
/* a door: frame, recessed panels, a brass knob */
function hdP_door(s, x, y, w, h, mat, o) {
    o = o || {};
    const L = o.layer || 3, fr = s.add(o.frame || '#8a5a2b', { layer: L + 1, R: 1.5, grad: 0.1, cast: 2 }), d = s.add(mat, { layer: L, R: 2, grad: 0.15 });
    const t = o.t || 6;
    s.rect(fr, x, y, w, h);
    s.rect(d, x + t, y + t, w - 2 * t, h - t);
    const ix = x + t, iw = w - 2 * t, iy = y + t, ih = h - t;
    /* two tall panels: a shadow on their top and left, light on the bottom and right */
    const pw = Math.floor((iw - 6) / 2), ph = Math.floor((ih - 10) / 2);
    if (o.panels !== false) for (const px of [ix + 2, ix + iw - 2 - pw]) for (const py of [iy + 3, iy + 6 + ph]) {
        for (let i = 0; i < pw; i++) { hdP_mod(s, d, px + i, py, -1); hdP_mod(s, d, px + i, py + ph - 1, 1); }
        for (let j = 1; j < ph - 1; j++) { hdP_mod(s, d, px, py + j, -1); hdP_mod(s, d, px + pw - 1, py + j, 1); }
    }
    const kx = o.knobLeft ? ix + 3 : ix + iw - 4, ky = iy + Math.round(ih * 0.55);
    s.px(kx, ky, '#fff3b0'); s.px(kx + 1, ky, '#ffd35a'); s.px(kx, ky + 1, '#e0a838'); s.px(kx + 1, ky + 1, '#a8741e');
    return { fr, d };
}
/* a striped awning: a sloped canopy (darker where the roof shades it) and a valance with one scallop per stripe */
function hdP_awning(s, x0, y0, x1, y1, a, b, sw, o) {
    o = o || {};
    const L = o.layer || 5, aw = s.add(a, { layer: L, R: 2, grad: 0.35, cast: 2 }), bm = typeof b === 'string' ? hdRamp(b) : b;
    const val = o.val || 6, sc = o.sc == null ? 3 : o.sc;
    s.rect(aw, x0, y0, x1 - x0 + 1, y1 - y0 + 1 - sc);
    for (let x = x0; x <= x1; x++) {
        const k = Math.floor((x - x0 + (o.off || 0)) / sw), r = (x - x0 + (o.off || 0)) % sw, c = (r + 0.5 - sw / 2) / (sw / 2);
        const depth = Math.round(Math.sqrt(Math.max(0, 1 - c * c)) * sc);
        for (let j = 0; j < depth; j++) s.plot(aw, x, y1 - sc + 1 + j);
    }
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        if (s.at(x, y) !== aw) continue;
        const k = Math.floor((x - x0 + (o.off || 0)) / sw), r = (x - x0 + (o.off || 0)) % sw;
        if (k % 2) hdP_rec(s, aw, x, y, bm);
        if (y === y1 - sc - val) hdP_mod(s, aw, x, y, -1);              /* the fold between canopy and valance */
        else if (y === y1 - sc - val + 1) hdP_mod(s, aw, x, y, 1);
        else if (y < y1 - sc - val && r === 0) hdP_mod(s, aw, x, y, -1); /* stitched seams down the canopy */
        if (s.at(x, y + 1) !== aw) hdP_mod(s, aw, x, y, -1);            /* the scalloped hem */
    }
    return aw;
}
/* a 3x5 pixel font for the lettering on signs */
const HDP_FONT = {
    A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100',
    G: '011100101101011', H: '101101111101101', I: '111010010010111', K: '101101110101101', L: '100100100100111', M: '101111111101101',
    N: '111101101101101', O: '010101101101010', P: '110101110100100', R: '110101110101101', S: '011100010001110', T: '111010010010010',
    U: '101101101101111', W: '101101111111101', Y: '101101010010010', "'": '010010000000000',
};
function hdP_text(s, txt, x, y, col, shadow) {
    let cx = x;
    for (const ch of txt) {
        const g = HDP_FONT[ch];
        if (g) for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (g[j * 3 + i] === '1') { if (shadow) s.px(cx + i + 1, y + j + 1, shadow); s.px(cx + i, y + j, col); }
        cx += ch === "'" ? 2 : 4;
    }
    return cx - x - 1;
}
function hdP_textW(txt) { let w = 0; for (const ch of txt) w += ch === "'" ? 2 : 4; return w - 1; }
/* a sign hanging from an iron bracket: a round board with a rim, the shop's picture drawn by fn(cx, cy) */
function hdP_hangSign(s, cx, top, r, rim, face, fn) {
    const br = s.add(hdPal('#1c1820', '#2e2a36', '#3f3a4a', '#5a5466', '#77708a'), { layer: 7, R: 1, grad: 0 });
    const hw = Math.round(r * 0.6);
    s.rect(br, cx - hw - 1, top, hw * 2 + 3, 2);
    s.rect(br, cx - hw - 1, top, 2, 6); s.rect(br, cx + hw, top, 2, 6);
    const cy = top + 6 + r, rm = s.add(rim, { layer: 8, R: 2, grad: 0.2, cast: 2 }), fc = s.add(face, { layer: 9, R: 3, grad: 0.25 });
    s.ellipse(rm, cx + 0.5, cy, r, r);
    s.ellipse(fc, cx + 0.5, cy, r - 2.5, r - 2.5);
    if (fn) fn(cx, cy);
    return cy;
}
/* a stone or brick plinth along the bottom of a wall */
function hdP_plinth(s, id, x0, y0, x1, y1, bw, seed) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const row = Math.floor((y - y0) / 4), ry = (y - y0) % 4, off = (row % 2) * (bw >> 1), rx = (x - x0 + off) % bw;
        if (ry === 3 || rx === bw - 1) hdP_mod(s, id, x, y, -1);
        else if ((ry === 0 || rx === 0) && hdP_hash(Math.floor((x - x0 + off) / bw), row, seed) > 0.5) hdP_mod(s, id, x, y, 1);
    }
}

/* shared colors */
const HDP_BROWN = hdPal('#3e2410', '#6a421e', '#8a5a2b', '#a8743e', '#c08a50');           /* window and door frames */
const HDP_IRON = hdPal('#1c1820', '#2e2a36', '#3f3a4a', '#5a5466', '#77708a');            /* brackets, posts */
const HDP_LID = hdPal('#8a7a5a', '#d8ccb0', '#f4ecd8', '#fbf6ea', '#ffffff');
/* goods on a shelf seen through a shop window (recolors of the glass): jars, tins and bottles */
function hdP_shelfGoods(s, gl, x, y, w, h, seed, cols) {
    const sy = y + h - 4, wood = hdPal('#3e2410', '#6a421e', '#8a5a2b', '#a8743e', '#c08a50');
    for (let i = 0; i < w; i++) { hdP_rec(s, gl, x + i, sy, wood); hdP_rec(s, gl, x + i, sy + 1, wood); }
    for (let i = 1, k = 0; i < w - 3; k++) {
        const c = hdRamp(cols[(k + seed) % cols.length]), ht = 4 + Math.floor(hdP_hash(k, 1, seed) * 4), jw = 3 + (hdP_hash(k, 2, seed) > 0.6 ? 1 : 0);
        for (let j = 1; j <= ht; j++) for (let q = 0; q < jw; q++) hdP_rec(s, gl, x + i + q, sy - j, j === ht ? HDP_LID : c);
        i += jw + 1 + (hdP_hash(k, 3, seed) > 0.7 ? 1 : 0);
    }
}

/* ---------------------------------------------------------------- Fortune's general store */
/* cream boards under an orange shingle roof, an orange-and-cream awning, the oval sign on the roof, a round sign with a
   gold coin, a chalkboard and a crate of fruit by the door */
HD_SPR.shop = {
    w: 240, h: 180, ax: 120, ay: 171,
    draw(s) {
        const wall = s.add(hdP_soft('#f7ecd6', '#8a7356'), { layer: 1, R: 2, grad: 0.12 });
        const base = s.add(hdP_soft('#cfc4b6', '#6e6252'), { layer: 2, R: 1, grad: 0.1 });
        s.rect(wall, 3, 93, 234, 78);
        s.rect(base, 3, 159, 234, 12);
        hdP_boards(s, wall, 3, 93, 236, 158, 6, 3);
        hdP_plinth(s, base, 3, 159, 236, 170, 14, 4);
        /* the roof: orange shingles tilting back, the eave over the awning */
        const roof = s.add(hdPal('#5a3416', '#b36f2a', '#d9913a', '#e8a850', '#f4c26a'), { layer: 6, R: 2, grad: 0.3, bias: 0.03, cast: 2 });
        s.rect(roof, 0, 48, 240, 30);
        hdP_shingles(s, roof, 0, 49, 239, 75, 6, 10, 5, { round: 1 });
        for (let x = 0; x < 240; x++) { hdP_mod(s, roof, x, 76, -1); hdP_mod(s, roof, x, 77, -2); }
        /* the striped awning, and the shade it throws on the wall */
        const aw = hdP_awning(s, 0, 78, 239, 95, hdPal('#7a4a14', '#c98a2a', '#e9a93b', '#f4c25a', '#fbd98a'), hdPal('#8a6a4a', '#e6d2b0', '#fff4dc', '#fffaee', '#ffffff'), 12, { val: 7, sc: 3 });
        hdP_drop(s, roof, 2);
        hdP_drop(s, aw, 6, 0.34);
        /* windows either side, jars and tins on the shelves inside */
        const goods = ['#e0405a', '#f2c262', '#8cc152', '#f28a2a', '#c27ad8', '#4f86c6'];
        for (const [wx, k] of [[15, 0], [189, 3]]) hdP_window(s, wx, 96, 36, 27, { frame: HDP_BROWN, inside: (gl, x, y, w, h) => hdP_shelfGoods(s, gl, x, y, w, h, k, goods) });
        /* the door, a worn step in front */
        hdP_door(s, 102, 123, 36, 48, hdPal('#4a321c', '#7a5634', '#986e44', '#b08458', '#c69c6c'), { frame: HDP_BROWN });
        const step = s.add(hdP_soft('#bdb2a2', '#5e5446'), { layer: 6, R: 1, grad: 0.2 });
        s.rect(step, 104, 168, 32, 3);
        /* the round sign: a gold coin on cream */
        hdP_hangSign(s, 160, 87, 16, HDP_BROWN, hdPal('#a8906a', '#eadcc0', '#fff4dc', '#fffaf0', '#ffffff'), (cx, cy) => {
            const c = s.add(hdPal('#6a4a14', '#b8862d', '#e0aa40', '#f2c262', '#fde39a'), { layer: 10, R: 3, grad: 0.3 });
            s.ellipse(c, cx + 0.5, cy, 8.5, 8.5);
            for (let a = 0; a < 28; a++) { const t = a / 28 * Math.PI * 2; hdP_mod(s, c, cx + 0.5 + Math.cos(t) * 6.2, cy + Math.sin(t) * 6.2, -1); }
            hdP_text(s, 'F', cx - 1, cy - 2, '#9a6420');
        });
        /* the oval sign on the roof, on its post */
        const post = s.add(HDP_BROWN, { layer: 7, R: 1 });
        s.rect(post, 117, 54, 6, 15);
        const ov = s.add(hdPal('#6a4214', '#b07a2a', '#d49a3a', '#e8b250', '#f6cc70'), { layer: 8, R: 3, grad: 0.25, cast: 2 });
        const of = s.add(hdPal('#8a5a1e', '#d8a448', '#f2c262', '#f8d888', '#fde8a8'), { layer: 9, R: 3, grad: 0.3 });
        s.ellipse(ov, 120, 39, 30, 15);
        s.ellipse(of, 120, 39, 26, 11.5);
        hdP_drop(s, ov, 3, 0.3);
        hdP_text(s, 'SHOP', 120 - (hdP_textW('SHOP') >> 1), 37, '#ffffff', '#b07a2a');
        /* the chalkboard by the door: a fruit and a few lines of prices in chalk */
        const bf = s.add(hdPal('#2a1e14', '#463424', '#5a4633', '#74593f', '#8a6c4c'), { layer: 8, R: 1, grad: 0.1 });
        const bd = s.add(hdPal('#141c1a', '#232c29', '#2f3a36', '#3a4843', '#4a5a54'), { layer: 9, flat: 1, grad: 0.2 });
        s.line(bf, 73.5, 172, 77, 140, 1); s.line(bf, 102.5, 172, 99, 140, 1);
        s.rect(bf, 75, 138, 27, 29);
        s.rect(bd, 78, 141, 21, 23);
        for (const [i, j] of [[-1, 0], [0, -1], [1, -1], [2, 0], [-1, 1], [2, 1], [0, 2], [1, 2]]) s.px(82 + i, 147 + j, '#f08a8a');
        s.px(83, 145, '#9cc45a'); s.px(84, 144, '#9cc45a');
        for (const [lx, ly, lw] of [[88, 145, 7], [88, 148, 6], [81, 153, 14], [81, 156, 10], [81, 159, 12]]) for (let i = 0; i < lw; i++) if ((i + ly) % 4 !== 3) s.px(lx + i, ly, i % 3 ? '#e8e4da' : '#c8c8c0');
        /* the fruit crate: apples, pears and oranges heaped on top */
        const cr = s.add(hdPal('#5a3416', '#8e5c32', '#b07a4a', '#c69462', '#d8aa78'), { layer: 8, R: 1, grad: 0.15 });
        s.rect(cr, 174, 155, 45, 16);
        hdP_planks(s, cr, 174, 155, 218, 170, 15, 9);
        for (let x = 174; x <= 218; x++) { hdP_mod(s, cr, x, 162, -1); hdP_mod(s, cr, x, 163, 1); }
        /* each fruit its own part, the back row tucked behind the front */
        const fruit = [['#e0405a', 179, '#5a3a20'], ['#a8c84a', 194, '#5a3a20'], ['#f28a2a', 209, '#4f8a3c']];
        for (const [col, fx, stem] of fruit) for (const [dx, dy, l] of [[-3.5, -3, 9], [3.5, -3, 9], [-6, 1, 10], [0, 1, 10], [6, 1, 10]]) {
            const f = s.add(col, { layer: l, R: 2.5, grad: 0.3 });
            s.ellipse(f, fx + dx + 0.5, 152 + dy, 3.4, 3.2);
            s.px(fx + dx - 1, 150 + dy, '#ffffff');
            if (l === 9) s.px(fx + dx + 1, 148 + dy, stem);
        }
        hdP_finish(s);
    },
};

/* ---------------------------------------------------------------- Clementine's (clothes) */
/* pink-white walls under an orange tiled roof with a clementine sitting on top, an orange-and-cream awning, white window
   frames with a dress on a mannequin in each, a dress on the round sign and a green door */
HD_SPR.boutique = {
    w: 192, h: 180, ax: 96, ay: 171,
    draw(s) {
        const white = hdPal('#9a8a96', '#e2dae0', '#f8f4f6', '#ffffff', '#ffffff');
        const wall = s.add(hdPal('#9a8088', '#f4e2e8', '#fff2f4', '#fff8fa', '#ffffff'), { layer: 1, R: 2, grad: 0.12 });
        const base = s.add(hdP_soft('#d6c9cf', '#6e6068'), { layer: 2, R: 1, grad: 0.1 });
        s.rect(wall, 3, 93, 186, 78);
        s.rect(base, 3, 159, 186, 12);
        hdP_boards(s, wall, 3, 93, 188, 158, 6, 13);
        hdP_plinth(s, base, 3, 159, 188, 170, 14, 14);
        const orange = hdPal('#6a3410', '#c86a1c', '#f7962d', '#fbae4e', '#ffc878');
        /* the clementine on the roof: dimpled peel, a shine, a stem and a leaf */
        /* sitting just behind the roof's top edge, as today */
        const fr = s.add(hdPal('#7a3a0c', '#d86c18', '#f7962d', '#ffb04a', '#ffd08a'), { layer: 5, R: 9, grad: 0.15, k: 1.4 });
        s.ellipse(fr, 96, 50, 22.5, 22);
        for (let y = 28; y < 52; y++) for (let x = 73; x < 120; x++) { const v = hdP_hash(x, y, 21); if (v > 0.93) hdP_mod(s, fr, x, y, -1); else if (v < 0.03) hdP_mod(s, fr, x, y, 1); }
        const leaf = s.add(hdPal('#1e4a22', '#2e7034', '#3f8f45', '#5aa85a', '#7cc070'), { layer: 9, R: 2, grad: 0.2 });
        const stem = s.add(hdPal('#2a1c10', '#4a3420', '#6a4a2c', '#86603a', '#9a7448'), { layer: 10, R: 1 });
        s.rect(stem, 100, 24, 3, 5);
        s.poly(leaf, [[102, 28], [108, 22], [115, 21], [112, 26], [106, 30]]);
        hdP_later(s, () => { for (let i = 0; i < 9; i++) if (s.at(104 + i, 27 - i * 0.6) === leaf) s.mod(104 + i, 27 - i * 0.6, -1); });
        for (const [i, j] of [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1], [-1, 1], [-1, 2], [0, 2]]) s.px(84 + i, 36 + j, j === 0 && i === 1 ? '#fff4dc' : '#ffcc8a');
        /* the roof: orange barrel tiles, the eave over the awning */
        const roof = s.add(orange, { layer: 6, R: 2, grad: 0.3, bias: 0.02, cast: 2 });
        s.rect(roof, 0, 48, 192, 30);
        hdP_barrel(s, roof, 0, 49, 191, 75, 8, 14);
        for (let x = 0; x < 192; x++) { hdP_mod(s, roof, x, 76, -1); hdP_mod(s, roof, x, 77, -2); }
        /* the striped awning, and the shade it throws */
        const aw = hdP_awning(s, 0, 78, 191, 95, orange, hdPal('#8a6a5a', '#eadcd0', '#fff6ea', '#fffbf4', '#ffffff'), 12, { val: 7, sc: 3, off: 9 });
        hdP_drop(s, roof, 2);
        hdP_drop(s, aw, 6, 0.34);
        /* windows: a dress on a mannequin behind each */
        const skin = hdRamp('#f0d9c8'), dress = hdRamp('#e0607a'), stand = hdRamp('#8a8ea8');
        const mannequin = (gl, x, y, w, h) => {
            const cx = x + (w >> 1) + 2;
            for (let j = 0; j < 5; j++) for (let i = -2; i <= 2; i++) if (i * i + (j - 2) * (j - 2) <= 5) hdP_rec(s, gl, cx + i, y + 4 + j, skin);
            for (let j = 0; j < 12; j++) { const hw = j < 4 ? 2 + (j >> 1) : 2 + Math.round((j - 2) * 0.5); for (let i = -hw; i <= hw; i++) hdP_rec(s, gl, cx + i, y + 10 + j, dress); }
            for (let j = 22; j < h; j++) hdP_rec(s, gl, cx, y + j, stand);
        };
        for (const wx of [15, 141]) {
            hdP_window(s, wx, 93, 36, 30, { frame: white, sillMat: white, bars: 'v', inside: mannequin });
            /* a window box of pink and white flowers */
            const bx = s.add(hdPal('#4a2a1a', '#7a4a2e', '#9a623c', '#b47a50', '#c89064'), { layer: 7, R: 1, grad: 0.2 });
            s.rect(bx, wx + 1, 125, 34, 7);
            const lv = s.add(hdPal('#1e4a22', '#2e7034', '#4a9a4a', '#66b25a', '#86c870'), { layer: 6, R: 1.5, grad: 0.2 });
            for (let i = 0; i < 9; i++) s.ellipse(lv, wx + 3 + i * 3.8, 124, 2.6, 2.2);
            for (let i = 0; i < 7; i++) { const fx = wx + 5 + i * 4.6, fc = i % 2 ? '#ffffff' : '#ff8fb0'; s.px(fx, 121, fc); s.px(fx - 1, 122, fc); s.px(fx + 1, 122, fc); s.px(fx, 123, fc); s.px(fx, 122, '#ffd35a'); }
        }
        /* the green door in its white frame */
        hdP_door(s, 102, 123, 36, 48, hdPal('#1e4a26', '#2f7038', '#3f8f45', '#569c5b', '#6cb070'), { frame: white });
        const step = s.add(hdP_soft('#c8bcc2', '#5e5258'), { layer: 6, R: 1, grad: 0.2 });
        s.rect(step, 104, 168, 32, 3);
        /* the round sign with a dress on it */
        hdP_hangSign(s, 82, 87, 16, orange, hdPal('#a8906a', '#eadcc0', '#fff4dc', '#fffaf0', '#ffffff'), (cx, cy) => {
            const d = s.add(orange, { layer: 10, R: 2, grad: 0.3 });
            s.poly(d, [[cx - 3, cy - 9], [cx + 4, cy - 9], [cx + 6, cy - 5], [cx + 3.5, cy - 4], [cx + 8, cy + 8], [cx - 7, cy + 8], [cx - 2.5, cy - 4], [cx - 5, cy - 5]]);
            for (let i = -6; i <= 7; i++) hdP_mod(s, d, cx + i, cy + 7, -1);
            for (let i = -2; i <= 3; i++) hdP_mod(s, d, cx + i, cy - 3, -1);
            s.px(cx, cy - 1, '#ffd8a0'); s.px(cx + 1, cy - 1, '#ffd8a0');
        });
        hdP_finish(s);
    },
};
