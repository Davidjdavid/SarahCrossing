/* ---- 32r_hd_buildings.js ---- */
/* HD buildings and landmarks: the shops, the museum, the barn, the windmill, the lighthouse, David's statue, the boat at
   the pier and the well, each today's sprite at three times the size (same box, anchor and door spot) with the shingles,
   boards, glass and signs the extra pixels allow. Coordinates are HD pixels; old ones show as 3 * n where it helps to
   see today's sprite under the new one. No ground shadows: the HD-2D view casts its own. */

/* ---------------------------------------------------------------- shared helpers */
/* a small seeded hash in [0, 1) for scatter that is the same every time */
function hdP_hash(x, y, k) { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul((k | 0) + 1, 1442695041); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function hdP_mix(c1, c2, t) { const a = hdRgb(c1), b = hdRgb(c2); return a.map((v, i) => Math.round(v + (b[i] - v) * t)); }
/* a five-shade palette for big flat surfaces (walls): small steps, so boards and seams read without getting noisy */
function hdP_soft(hex, out) { const r = hdRamp(hex); return [out ? hdRgb(out) : r[0], hdP_mix(r[1], r[2], 0.45), hdRgb(hex), hdP_mix(r[3], r[2], 0.35), r[3]]; }

/* shared colors */
const hdP_BROWN = hdPal('#3e2410', '#6a421e', '#8a5a2b', '#a8743e', '#c08a50');           /* window and door frames */
const hdP_IRON = hdPal('#1c1820', '#2e2a36', '#3f3a4a', '#5a5466', '#77708a');            /* brackets, posts */
const hdP_LID = hdPal('#8a7a5a', '#d8ccb0', '#f4ecd8', '#fbf6ea', '#ffffff');               /* jar lids */
/* texture passes are kept until the shapes are all drawn (hdP_finish), and touch only pixels still of their part:
   a mod or recolor made early would otherwise stick to whatever is drawn over that pixel later */
function hdP_mod(s, id, x, y, d) { (s.hdPm || (s.hdPm = [])).push(id, Math.round(x), Math.round(y), d); }
function hdP_rec(s, id, x, y, mat) { if (typeof mat === 'string') mat = hdRamp(mat); (s.hdPr || (s.hdPr = [])).push(id, Math.round(x), Math.round(y), mat); }
function hdP_later(s, fn) { (s.hdPq || (s.hdPq = [])).push(fn); }
/* paint pixel i in material mat (the same as s.recolor, by index, for the big passes) */
function hdP_alt(s, i, mat) {
    let k = s.alts.indexOf(mat);
    if (k < 0) { k = s.alts.length; s.alts.push(mat); }
    if (!s.alt) s.alt = new Int16Array(s.w * s.h).fill(-1);
    s.alt[i] = k;
}
/* a darker version of a material, for cast shadows painted onto a part (same shading, cooler and dimmer) */
const hdP_DARKS = new Map();
function hdP_dark(mat) {
    let d = hdP_DARKS.get(mat);
    if (!d) { d = mat.map((c, i) => hdP_mix(c, [74, 50, 84], i === 0 ? 0.1 : 0.24)); hdP_DARKS.set(mat, d); }
    return d;
}
/* the material a pixel shows now (its recolor, or its part's) */
function hdP_matAt(s, i) { return s.alt && s.alt[i] >= 0 ? s.alts[s.alt[i]] : s.parts[s.part[i]].mat; }
/* a shadow cast straight down by part id onto lower layers, depth rows under its lower edge */
function hdP_drop(s, id, depth, slant) { hdP_later(s, () => {
    const W = s.w, H = s.h, P = s.part, L = s.parts[id].layer, done = new Uint8Array(W * H);
    for (let y = 0; y < H - 1; y++) for (let x = 0; x < W; x++) {
        if (P[y * W + x] !== id || P[(y + 1) * W + x] === id) continue;
        for (let d = 1; d <= depth; d++) {
            const xx = x + Math.floor(d * (slant || 0)), yy = y + d;
            if (xx >= W || yy >= H) break;
            const j = yy * W + xx, p = P[j];
            if (p < 0 || p === id) break;
            if (s.parts[p].layer >= L || done[j]) continue;
            done[j] = 1;
            hdP_alt(s, j, hdP_dark(hdP_matAt(s, j)));
        }
    }
}); }
/* finish a sprite: the texture passes, then shadows, then a firm outline on the lit (top and left) sides too */
function hdP_finish(s) {
    const W = s.w, H = s.h, P = s.part, M = s.mods, m = s.hdPm || [], r = s.hdPr || [];
    for (let i = 0; i < m.length; i += 4) { const x = m[i + 1], y = m[i + 2]; if (x >= 0 && y >= 0 && x < W && y < H && P[y * W + x] === m[i]) M[y * W + x] += m[i + 3]; }
    for (let i = 0; i < r.length; i += 4) { const x = r[i + 1], y = r[i + 2]; if (x >= 0 && y >= 0 && x < W && y < H && P[y * W + x] === r[i]) hdP_alt(s, y * W + x, r[i + 3]); }
    for (const f of s.hdPq || []) f();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (P[i] >= 0 && (x === 0 || y === 0 || P[i - 1] < 0 || P[i - W] < 0)) M[i] -= 1; }
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
        let d = r === colW - 1 ? -1 : r === 1 || r === 2 ? 1 : 0;
        if (ry === rowH - 1) d = -1; else if (ry === rowH - 2 && r > 2 && r < colW - 1) d = 0;
        if (d) hdP_mod(s, id, x, y, Math.max(-2, Math.min(2, d)));
    }
}
/* a window: a frame, glass catching the sky (a gradient and two glints), the cross bars and a sill; o.inside(gl, x, y,
   w, h) can paint what's behind the glass (recolors of the glass, so the glints stay on top) */
function hdP_window(s, x, y, w, h, o) {
    o = o || {};
    const L = o.layer || 3, fr = s.add(o.frame || '#8a5a2b', { layer: L + 1, R: 1.5, grad: 0.1, cast: 1 });
    const gl = s.add(o.glass || hdPal('#3c6a86', '#6fb2d4', '#9fd8ef', '#c4ecf8', '#f2fcff'), { layer: L, flat: 1, grad: o.grad == null ? 0.5 : o.grad, bias: 0.04 });
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
        const r = (x - x0 + (o.off || 0)) % sw, c = (r + 0.5 - sw / 2) / (sw / 2);
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
const hdP_FONT = {
    A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100',
    G: '011100101101011', H: '101101111101101', I: '111010010010111', K: '101101110101101', L: '100100100100111', M: '101111111101101',
    N: '111101101101101', O: '010101101101010', P: '110101110100100', R: '110101110101101', S: '011100010001110', T: '111010010010010',
    U: '101101101101111', W: '101101111111101', Y: '101101010010010', "'": '010010000000000',
};
function hdP_text(s, txt, x, y, col, shadow) {
    let cx = x;
    for (const ch of txt) {
        const g = hdP_FONT[ch];
        if (g) for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (g[j * 3 + i] === '1') { if (shadow) s.px(cx + i + 1, y + j + 1, shadow); s.px(cx + i, y + j, col); }
        cx += ch === "'" ? 2 : 4;
    }
    return cx - x - 1;
}
function hdP_textW(txt) { let w = 0; for (const ch of txt) w += ch === "'" ? 2 : 4; return w - 1; }
/* a sign hanging from an iron bracket: a round board with a rim, the shop's picture drawn by fn(cx, cy) */
function hdP_hangSign(s, cx, top, r, rim, face, fn) {
    const br = s.add(hdP_IRON, { layer: 7, R: 1, grad: 0 });
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

/* round shading for a tower drawn flat: a lit band on the left, shade on the right, worked out per row from the part's
   own edges (a big R would also round the wall off round every window and door) */
function hdP_cyl(s, id) { hdP_later(s, () => {
    const W = s.w, P = s.part;
    for (let y = 0; y < s.h; y++) {
        let xl = -1, xr = -1;
        for (let x = 0; x < W; x++) if (P[y * W + x] === id) { if (xl < 0) xl = x; xr = x; }
        if (xl < 0 || xr - xl < 6) continue;
        for (let x = xl; x <= xr; x++) {
            if (P[y * W + x] !== id) continue;
            const u = (x + 0.5 - xl) / (xr - xl + 1);
            s.mods[y * W + x] += u < 0.06 ? 0 : u < 0.3 ? 1 : u < 0.68 ? 0 : u < 0.88 ? -1 : -2;
        }
    }
}); }
/* goods on a shelf seen through a shop window (recolors of the glass): jars, tins and bottles */
function hdP_shelfGoods(s, gl, x, y, w, h, seed, cols) {
    const sy = y + h - 4;
    for (let i = 0; i < w; i++) { hdP_rec(s, gl, x + i, sy, hdP_BROWN); hdP_rec(s, gl, x + i, sy + 1, hdP_BROWN); }
    for (let i = 1, k = 0; i < w - 3; k++) {
        const c = hdRamp(cols[(k + seed) % cols.length]), ht = 4 + Math.floor(hdP_hash(k, 1, seed) * 4), jw = 3 + (hdP_hash(k, 2, seed) > 0.6 ? 1 : 0);
        for (let j = 1; j <= ht; j++) for (let q = 0; q < jw; q++) hdP_rec(s, gl, x + i + q, sy - j, j === ht ? hdP_LID : c);
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
        for (const [wx, k] of [[15, 0], [189, 3]]) hdP_window(s, wx, 96, 36, 27, { frame: hdP_BROWN, inside: (gl, x, y, w, h) => hdP_shelfGoods(s, gl, x, y, w, h, k, goods) });
        /* the door, a worn step in front */
        hdP_door(s, 102, 123, 36, 48, hdPal('#4a321c', '#7a5634', '#986e44', '#b08458', '#c69c6c'), { frame: hdP_BROWN });
        const step = s.add(hdP_soft('#bdb2a2', '#5e5446'), { layer: 6, R: 1, grad: 0.2 });
        s.rect(step, 104, 168, 32, 3);
        /* the round sign: a gold coin on cream */
        hdP_hangSign(s, 160, 87, 16, hdP_BROWN, hdPal('#a8906a', '#eadcc0', '#fff4dc', '#fffaf0', '#ffffff'), (cx, cy) => {
            const c = s.add(hdPal('#6a4a14', '#b8862d', '#e0aa40', '#f2c262', '#fde39a'), { layer: 10, R: 3, grad: 0.3 });
            s.ellipse(c, cx + 0.5, cy, 8.5, 8.5);
            for (let a = 0; a < 28; a++) { const t = a / 28 * Math.PI * 2; hdP_mod(s, c, cx + 0.5 + Math.cos(t) * 6.2, cy + Math.sin(t) * 6.2, -1); }
            hdP_text(s, 'F', cx - 1, cy - 2, '#9a6420');
        });
        /* the oval sign on the roof, on its post */
        const post = s.add(hdP_BROWN, { layer: 7, R: 1 });
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
        /* the clementine on the roof, just behind its top edge as today: dimpled peel, a shine, a stem and a leaf */
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

/* ---------------------------------------------------------------- the museum (Brulee's) */
/* white stone: a portico of four fluted columns under a pediment with a painting in it, slate-roofed wings with arched
   windows, a red banner (a vase) and a blue one (a painting), gold-framed double doors up two steps */
function hdP_column(s, x, top, bot, stone, shaft) {
    const c = s.add(shaft, { layer: 5, R: 8, grad: 0.06, k: 1.6 });
    s.rect(c, x + 3, top + 6, 18, bot - top - 12);
    /* flutes: shallow grooves down the shaft */
    for (let y = top + 7; y < bot - 6; y++) for (const i of [6, 10, 14, 18]) { hdP_mod(s, c, x + i, y, -1); if (i < 14) hdP_mod(s, c, x + i + 1, y, 1); }
    const cap = s.add(stone, { layer: 6, R: 1.5, grad: 0.2, cast: 2 }), bs = s.add(stone, { layer: 6, R: 1.5, grad: 0.2 });
    s.rect(cap, x, top, 24, 3); s.rect(cap, x + 2, top + 3, 20, 3);
    s.rect(bs, x + 2, bot - 6, 20, 3); s.rect(bs, x, bot - 3, 24, 3);
    return c;
}
HD_SPR.museum = {
    w: 336, h: 252, ax: 168, ay: 243,
    draw(s) {
        const stone = hdPal('#8a7e6c', '#e2d9c6', '#fbf7ee', '#fffdf7', '#ffffff');
        const tan = hdPal('#6e604c', '#b8aa90', '#d4c7b0', '#e2d8c4', '#efe8d8');
        const gold = hdPal('#6a5014', '#b08a2a', '#d9b44a', '#ecd070', '#f8e8a0');
        /* the wings: cut stone blocks, a plinth course at the foot */
        const wall = s.add(hdPal('#86786a', '#e2d6c2', '#efe6d6', '#f6efe2', '#fbf7ee'), { layer: 1, R: 2, grad: 0.1 });
        s.rect(wall, 9, 90, 318, 144);
        for (let y = 93; y < 228; y++) for (let x = 9; x < 327; x++) {
            const row = Math.floor((y - 93) / 9), ry = (y - 93) % 9, rx = (x - 9 + (row % 2) * 12) % 24;
            if (ry === 8 || rx === 23) hdP_mod(s, wall, x, y, -1); else if ((ry === 0 || rx === 0) && hdP_hash(Math.floor((x - 9 + (row % 2) * 12) / 24), row, 31) > 0.4) hdP_mod(s, wall, x, y, 1);
        }
        const plinth = s.add(tan, { layer: 2, R: 1, grad: 0.2 });
        s.rect(plinth, 9, 226, 318, 8);
        for (let x = 9; x < 327; x++) { hdP_mod(s, plinth, x, 226, 1); if ((x - 9) % 30 === 29) for (let y = 227; y < 234; y++) hdP_mod(s, plinth, x, y, -1); }
        /* the wings' slate roof, seen from the front and a little above, and the cornice under it */
        const slate = s.add(hdPal('#3e4656', '#7a889c', '#9aa8b8', '#b2bece', '#c8d2de'), { layer: 3, R: 1.5, grad: 0.35, bias: 0.04, cast: 2 });
        s.rect(slate, 9, 75, 318, 15);
        hdP_shingles(s, slate, 9, 76, 326, 88, 4, 9, 33);
        const corn = s.add(tan, { layer: 4, R: 1, grad: 0.2, cast: 2 });
        s.rect(corn, 9, 89, 318, 4);
        for (let x = 12; x < 324; x += 6) for (let j = 0; j < 2; j++) { hdP_mod(s, corn, x, 91 + j, 1); hdP_mod(s, corn, x + 3, 91 + j, -1); }
        hdP_drop(s, corn, 4, 0.3);
        /* arched windows with a keystone, either side */
        for (const wx of [24, 270]) {
            const sur = s.add(tan, { layer: 3, R: 1.5, grad: 0.15, cast: 1 }), gl = s.add(hdPal('#3c6a86', '#6fb2d4', '#9fd8ef', '#c4ecf8', '#f2fcff'), { layer: 2, flat: 1, grad: 0.3, bias: -0.02 });
            s.rect(sur, wx, 120, 42, 75);
            s.ellipse(sur, wx + 21, 122, 21, 10);
            s.rect(gl, wx + 3, 123, 36, 69);
            s.ellipse(gl, wx + 21, 123.5, 18, 7.5);
            s.rect(sur, wx + 20, 112, 2, 80);
            s.rect(sur, wx, 120, 42, 3);
            for (let j = 123; j < 192; j++) for (let i = wx + 3; i < wx + 39; i++) { const d = (i - wx) + (j - 123) * 0.8; if (Math.abs(d - 12) < 1.3 || Math.abs(d - 17) < 0.6) hdP_mod(s, gl, i, j, 2); }
            const key = s.add(stone, { layer: 4, R: 1, grad: 0.2 });
            s.poly(key, [[wx + 17, 109], [wx + 25, 109], [wx + 24, 117], [wx + 18, 117]]);
            const sill = s.add(stone, { layer: 4, R: 1, grad: 0.3, cast: 2 });
            s.rect(sill, wx - 3, 192, 48, 4);
        }
        /* the portico: the back wall between the columns is the wings' wall; the steps */
        const st1 = s.add(stone, { layer: 7, R: 1.5, grad: 0.25 }), st2 = s.add(stone, { layer: 8, R: 1.5, grad: 0.25 });
        s.rect(st1, 90, 219, 156, 9);
        for (let x = 90; x < 246; x++) { hdP_mod(s, st1, x, 219, 1); hdP_mod(s, st1, x, 220, 1); hdP_mod(s, st1, x, 226, -1); }
        s.rect(st2, 96, 234, 144, 3); s.rect(st2, 100, 237, 136, 9);
        for (let x = 96; x < 240; x++) { hdP_mod(s, st2, x, 234, 1); hdP_mod(s, st2, x, 235, 1); hdP_mod(s, st2, x, 236, -1); }
        const under = s.add(tan, { layer: 6, R: 1, grad: 0 });
        s.rect(under, 96, 228, 144, 6);
        /* four fluted columns */
        const shaft = hdPal('#8a7e6c', '#ddd4c2', '#f6f1e6', '#fdfaf3', '#ffffff');
        const cols = [108, 141, 177, 210].map(x => hdP_column(s, x, 87, 219, stone, shaft));
        /* each column throws a shadow to its right on the wall behind */
        hdP_later(s, () => { const W = s.w, P = s.part, dk = hdP_dark(s.parts[wall].mat); cols.forEach((c, k) => { const x1 = [108, 141, 177, 210][k] + 24; for (let y = 93; y < 219; y++) for (let x = x1 - 26; x < x1; x++) {
            if (P[y * W + x] !== c || P[y * W + x + 1] === c) continue;
            for (let d = 1; d <= 6; d++) { if (P[y * W + x + d] !== wall) break; hdP_alt(s, y * W + x + d, dk); }
        } }); });
        /* the gold-framed double doors, in front of the two middle columns as today */
        const df = s.add(gold, { layer: 7, R: 1.5, grad: 0.15, cast: 1 }), dr = s.add(hdPal('#2e180e', '#4e2c1c', '#6b3f2a', '#82523a', '#986448'), { layer: 6, R: 1.5, grad: 0.15 });
        s.rect(df, 141, 159, 54, 60);
        s.rect(dr, 144, 162, 48, 57);
        for (let y = 162; y < 219; y++) { hdP_mod(s, dr, 168, y, -2); hdP_mod(s, dr, 169, y, -1); }
        for (const px of [148, 173]) for (const [py, ph] of [[166, 22], [192, 22]]) {
            for (let i = 0; i < 15; i++) { hdP_mod(s, dr, px + i, py, -1); hdP_mod(s, dr, px + i, py + ph - 1, 1); }
            for (let j = 1; j < ph - 1; j++) { hdP_mod(s, dr, px, py + j, -1); hdP_mod(s, dr, px + 14, py + j, 1); }
        }
        for (const kx of [164, 172]) { s.px(kx, 193, '#fff3b0'); s.px(kx + 1, 193, '#ffd35a'); s.px(kx, 194, '#e0a838'); s.px(kx + 1, 194, '#a8741e'); }
        /* the entablature with MUSEUM cut in the frieze, its shadow on the wall */
        const ent = s.add(stone, { layer: 7, R: 1.5, grad: 0.2, cast: 2 }), arch = s.add(tan, { layer: 7, R: 1, grad: 0.1 });
        s.rect(ent, 96, 72, 144, 12);
        s.rect(arch, 96, 84, 144, 3);
        hdP_drop(s, arch, 7, 0.4);
        for (let x = 96; x < 240; x++) { hdP_mod(s, ent, x, 72, 1); hdP_mod(s, ent, x, 74, -1); }
        hdP_text(s, 'MUSEUM', 168 - (hdP_textW('MUSEUM') >> 1), 77, '#b0a48c');
        /* the pediment: a raking cornice round a recessed tympanum, the painting in the middle, the cornice below */
        const pc = s.add(tan, { layer: 8, R: 1, grad: 0.15, cast: 2 });
        s.rect(pc, 102, 66, 132, 3); s.rect(pc, 96, 69, 144, 3);
        const rk = s.add(stone, { layer: 7, R: 2, grad: 0.15 }), ty = s.add(hdPal('#7a6c56', '#c8b99e', '#e3d6bf', '#ece2ce', '#f4ecdc'), { layer: 6, R: 1, grad: 0.1 });
        s.poly(rk, [[108, 66], [228, 66], [168, 36]]);
        s.poly(ty, [[121, 66], [215, 66], [168, 42.5]]);
        hdP_later(s, () => { for (let x = 105; x < 232; x++) for (let y = 34; y < 66; y++) if (s.at(x, y) === rk && s.at(x, y + 1) === ty) s.recolor(x, y, hdP_dark(stone)); });
        const pf = s.add(gold, { layer: 8, R: 1, grad: 0.2 }), pic = s.add(hdPal('#3c6a86', '#6fb2d4', '#9fd8ef', '#c4ecf8', '#f2fcff'), { layer: 9, flat: 1, grad: 0.3 });
        s.rect(pf, 159, 39, 21, 18);
        s.rect(pic, 162, 42, 15, 12);
        for (let i = 0; i < 15; i++) { const hgt = 4 + Math.round(2.2 * Math.sin((i + 2) / 15 * Math.PI)); for (let j = 0; j < hgt; j++) hdP_rec(s, pic, 162 + i, 53 - j, '#5aa83a'); }
        for (const [i, j] of [[3, 2], [4, 2], [5, 2], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3]]) s.px(162 + i, 42 + j, '#ffffff');
        s.px(173, 44, '#ffd35a'); s.px(174, 44, '#ffd35a'); s.px(173, 45, '#ffd35a'); s.px(174, 45, '#ffe890');
        /* the flared ornament on the apex */
        const ap = s.add(stone, { layer: 9, R: 2, grad: 0.3 }), apb = s.add(tan, { layer: 8, R: 1, grad: 0.1 });
        s.poly(ap, [[138, 21], [200, 21], [182, 36], [156, 36]]);
        s.rect(apb, 150, 36, 36, 3);
        for (let x = 140; x < 199; x++) hdP_mod(s, ap, x, 24, -1);
        /* the banners: a vase in a cream panel on the red one, a painting on the blue one; tassels below */
        const rod = s.add(gold, { layer: 9, R: 1, grad: 0.3 });
        for (const [bx, col] of [[75, '#b3263a'], [234, '#2f5da8']]) {
            const b = s.add(col, { layer: 8, R: 2, grad: 0.2, cast: 1 });
            s.rect(b, bx, 108, 27, 60);
            s.poly(b, [[bx, 167], [bx + 27, 167], [bx + 25, 171], [bx + 19, 168], [bx + 13.5, 174], [bx + 8, 168], [bx + 2, 171]]);
            for (let y = 110; y < 167; y++) { hdP_mod(s, b, bx + 7, y, -1); hdP_mod(s, b, bx + 19, y, -1); hdP_mod(s, b, bx + 8, y, 1); }
            s.rect(rod, bx - 3, 105, 33, 3);
            for (const [tx, ty_] of [[bx + 2, 172], [bx + 13, 175], [bx + 24, 172]]) { s.px(tx, ty_, '#ffd35a'); s.px(tx + 1, ty_, '#e0a838'); s.px(tx, ty_ + 1, '#e0a838'); s.px(tx + 1, ty_ + 1, '#b08a2a'); }
        }
        /* the red banner's vase */
        const pan = s.add(hdPal('#a8906a', '#eadcc0', '#fff4dc', '#fffaf0', '#ffffff'), { layer: 9, R: 1, grad: 0.2 });
        s.rect(pan, 78, 126, 21, 21);
        const vase = s.add(hdPal('#1e3a6e', '#2f5596', '#3f6fb8', '#6f98d0', '#9fc3e6'), { layer: 10, R: 3, grad: 0.3 });
        s.ellipse(vase, 88.5, 139, 6, 5); s.rect(vase, 86, 130, 6, 5); s.rect(vase, 84, 129, 10, 2);
        for (let x = 83; x < 95; x++) hdP_mod(s, vase, x, 138, 1);
        /* the blue banner's painting */
        const bpf = s.add(gold, { layer: 9, R: 1, grad: 0.2 }), bp = s.add(hdPal('#3c6a86', '#6fb2d4', '#9fd8ef', '#c4ecf8', '#f2fcff'), { layer: 10, flat: 1, grad: 0.3 });
        s.rect(bpf, 237, 126, 21, 18);
        s.rect(bp, 240, 129, 15, 12);
        for (let i = 0; i < 15; i++) { const hgt = 3 + Math.round(3 * Math.sin((i + 4) / 13 * Math.PI)); for (let j = 0; j < hgt; j++) hdP_rec(s, bp, 240 + i, 140 - j, '#5aa83a'); }
        for (const [i, j] of [[8, 2], [9, 2], [10, 2], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3]]) s.px(240 + i, 129 + j, '#ffffff');
        hdP_finish(s);
    },
};

/* ---------------------------------------------------------------- the arcade */
/* a dark purple box with a dotted wall, cyan neon round the windows and door, a marquee with chaser lights and a big
   joystick on the roof, a neon strip under the eave and a joystick on the round sign */
/* a soft neon glow on the wall: wall pixels within r of a lit part get a lighter material */
function hdP_glow(s, src, onto, r, mat) { hdP_later(s, () => {
    const W = s.w, H = s.h, P = s.part, hit = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (P[y * W + x] === src)
        for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
            const xx = x + i, yy = y + j;
            if (i * i + j * j > r * r + 1 || xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
            const k = yy * W + xx; if (P[k] === onto && !hit[k]) { hit[k] = 1; hdP_alt(s, k, mat); }
        }
}); }
/* a little light bulb (3x3 with a hot center) */
function hdP_bulb(s, x, y, c) { const r = hdRamp(c); for (const [i, j] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) s.px(x + i, y + j, r[2]); s.px(x, y, r[4]); s.px(x - 1, y - 1, r[3]); s.px(x + 1, y + 1, r[1]); }
HD_SPR.arcade = {
    w: 240, h: 180, ax: 120, ay: 171,
    draw(s) {
        const purple = hdPal('#120c26', '#221a4a', '#2e2458', '#3a2e6c', '#4a3a86'), neon = hdPal('#1a5a6a', '#2e98b0', '#4ec3d9', '#8ae0ee', '#d8fbff');
        const wall = s.add(purple, { layer: 1, R: 2, grad: 0.1 });
        s.rect(wall, 3, 84, 234, 87);
        /* the dotted wall: a lit dot every few pixels, rows offset */
        for (let y = 90; y < 171; y += 9) for (let x = 6 + ((y / 9) % 2) * 4; x < 236; x += 9) { hdP_mod(s, wall, x, y, 2); hdP_mod(s, wall, x + 1, y, 1); hdP_mod(s, wall, x, y + 1, 1); }
        const base = s.add(hdPal('#0e0a20', '#1a1440', '#2a204f', '#342a62', '#40347a'), { layer: 2, R: 1, grad: 0.1 });
        s.rect(base, 3, 159, 234, 12);
        hdP_plinth(s, base, 3, 159, 236, 170, 16, 41);
        /* the flat roof band and the neon strip under its eave */
        const roof = s.add(hdPal('#08060e', '#12101e', '#1c1a2e', '#26243e', '#323050'), { layer: 4, R: 1.5, grad: 0.3, cast: 2 });
        s.rect(roof, 0, 48, 240, 30);
        for (let x = 0; x < 240; x++) { hdP_mod(s, roof, x, 69, 1); hdP_mod(s, roof, x, 70, -1); if (x % 30 === 0) for (let y = 49; y < 69; y++) hdP_mod(s, roof, x, y, -1); }
        const tube = s.add(neon, { layer: 5, R: 1, grad: 0.3 });
        s.rect(tube, 6, 78, 228, 3);
        for (let x = 8; x < 232; x += 2) s.px(x, 78, '#e8feff');
        const shade = s.add(hdPal('#06040c', '#0e0a1c', '#1c182c', '#2a2440', '#3a3058'), { layer: 3, flat: 1, grad: 0 });
        s.rect(shade, 0, 81, 240, 3);
        for (let x = 9; x < 236; x += 9) hdP_mod(s, shade, x, 82, 2);
        hdP_glow(s, tube, wall, 4, hdPal('#2a2050', '#3c3274', '#4a3e86', '#5a4e9c', '#6a5eb0'));
        /* windows: cyan neon frames, arcade machines glowing inside */
        const cab = hdRamp('#241a44'), scr = [hdRamp('#ff5aa8'), hdRamp('#8cc152'), hdRamp('#ffd84a')];
        const machines = (gl, x, y, w, h) => {
            for (let k = 0; k < 4; k++) {
                const cx = x + [1, 8, 16, 23][k];
                for (let j = 9; j < h; j++) for (let i = 0; i < 6; i++) if (j > 9 || (i > 0 && i < 5)) hdP_rec(s, gl, cx + i, y + j, cab);
                for (let j = 11; j < 15; j++) for (let i = 1; i < 5; i++) hdP_rec(s, gl, cx + i, y + j, scr[k % 3]);
            }
        };
        for (const wx of [15, 189]) {
            const w = hdP_window(s, wx, 93, 36, 30, { frame: neon, sill: false, bars: 'v', inside: machines });
            hdP_glow(s, w.fr, wall, 3, hdPal('#2a2050', '#3c3274', '#4a3e86', '#5a4e9c', '#6a5eb0'));
        }
        /* the door: dark, dotted, a black inner frame, all in cyan neon */
        const df = s.add(neon, { layer: 4, R: 1, grad: 0.2 }), din = s.add(hdPal('#06040e', '#0e0a1c', '#141024', '#1e1834', '#2a2244'), { layer: 3, R: 1 });
        const door = s.add(hdPal('#121020', '#22202e', '#302d3e', '#3e3a50', '#4a3a86'), { layer: 3, R: 1.5, grad: 0.15 });
        s.rect(df, 102, 123, 36, 48); s.rect(din, 105, 126, 30, 45); s.rect(door, 108, 129, 24, 42);
        for (let y = 132; y < 170; y += 9) for (let x = 111 + ((y / 3) % 2) * 4; x < 131; x += 9) hdP_mod(s, door, x, y, 2);
        for (let y = 134; y < 146; y++) for (let x = 112; x < 128; x++) hdP_rec(s, door, x, y, hdPal('#3a1a3a', '#8a2a6a', '#ff5aa8', '#ff8ac4', '#ffc4e0'));
        for (let x = 112; x < 128; x++) hdP_mod(s, door, x, 134, -1);
        for (let i = 0; i < 4; i++) hdP_mod(s, door, 114 + i, 136 + i, 2);
        s.px(127, 152, '#fff3b0'); s.px(128, 152, '#ffd35a'); s.px(127, 153, '#e0a838'); s.px(128, 153, '#a8741e');
        hdP_glow(s, df, wall, 3, hdPal('#2a2050', '#3c3274', '#4a3e86', '#5a4e9c', '#6a5eb0'));
        /* the round sign: a little joystick on navy */
        hdP_hangSign(s, 160, 87, 16, neon, hdPal('#0e0a22', '#1a1438', '#241a44', '#2e2458', '#3a2e6c'), (cx, cy) => {
            const bs = s.add(hdPal('#2a1a5a', '#4a3496', '#6b4ac9', '#8a6ad8', '#a88ae8'), { layer: 10, R: 2, grad: 0.3 });
            s.rect(bs, cx - 7, cy + 2, 16, 6);
            const stk = s.add(hdPal('#1a1820', '#2a2830', '#3a3340', '#5a5466', '#77708a'), { layer: 10, R: 1 });
            s.rect(stk, cx - 3, cy - 4, 2, 7);
            const ball = s.add('#e0405a', { layer: 11, R: 2.5, grad: 0.3 });
            s.ellipse(ball, cx - 1.5, cy - 5, 3.2, 3.2);
            s.px(cx - 3, cy - 6, '#ffb0b8');
            hdP_bulb(s, cx + 3, cy + 4, '#ffd84a'); hdP_bulb(s, cx + 6, cy + 4, '#8cc152');
        });
        /* the marquee on the roof: chaser bulbs round a big joystick */
        const box = s.add(hdPal('#0e0822', '#1a1238', '#241a44', '#2e2256', '#3a2c6a'), { layer: 6, R: 2, grad: 0.2, cast: 2 });
        s.rect(box, 33, 33, 174, 36); s.rect(box, 30, 36, 180, 30); s.rect(box, 27, 39, 186, 24);
        const rim = s.add(hdPal('#2a1e5a', '#3e2e7e', '#4a3a86', '#5e4e9e', '#7262b6'), { layer: 7, R: 1 });
        for (let x = 35; x < 205; x++) { s.plot(rim, x, 35); s.plot(rim, x, 66); }
        for (let y = 38; y < 64; y++) { s.plot(rim, 30, y); s.plot(rim, 209, y); }
        const bulbs = ['#ffd84a', '#ff5aa8', '#4ec3d9'];
        for (let i = 0; i < 20; i++) { hdP_bulb(s, 37 + i * 9, 39, bulbs[i % 3]); hdP_bulb(s, 37 + i * 9, 63, bulbs[(i + 1) % 3]); }
        const jb = s.add(hdPal('#6a1a4a', '#c23a84', '#ff5aa8', '#ff8ac4', '#ffbedc'), { layer: 8, R: 2, grad: 0.3 });
        s.rect(jb, 102, 54, 36, 6); s.rect(jb, 104, 52, 32, 2);
        const js = s.add(hdPal('#6a6a7a', '#b8b8c8', '#e8e8f0', '#f4f4fa', '#ffffff'), { layer: 8, R: 1 });
        s.rect(js, 111, 46, 3, 7);
        const jball = s.add('#e0405a', { layer: 9, R: 3.5, grad: 0.3 });
        s.ellipse(jball, 112, 43.5, 4.5, 4.5);
        s.px(110, 41, '#ffffff'); s.px(111, 41, '#ffc0c8'); s.px(110, 42, '#ffc0c8');
        const bt1 = s.add('#4ec3d9', { layer: 9, R: 1.5, grad: 0.3 }), bt2 = s.add('#ffd84a', { layer: 9, R: 1.5, grad: 0.3 });
        s.ellipse(bt1, 127.5, 51, 2.5, 2); s.ellipse(bt2, 133.5, 51, 2.5, 2);
        hdP_finish(s);
    },
};

/* ---------------------------------------------------------------- Mac's (the restaurant) */
/* cream walls under a dark green tiled roof, a green-and-cream awning, big windows lit warm with little tables inside,
   a red door, a steaming bowl on the hanging board, a potted plant and the menu chalkboard */
HD_SPR.restaurant = {
    w: 240, h: 180, ax: 120, ay: 171,
    draw(s) {
        const green = hdPal('#12301e', '#22553a', '#2f6b4a', '#3c8058', '#4e9668'), white = hdPal('#9a8a80', '#e4dcd2', '#fbf6ee', '#ffffff', '#ffffff');
        const wall = s.add(hdP_soft('#fbf2e2', '#8a7a62'), { layer: 1, R: 2, grad: 0.12 });
        const base = s.add(hdP_soft('#d2c9c0', '#6e6458'), { layer: 2, R: 1, grad: 0.1 });
        s.rect(wall, 3, 93, 234, 78);
        s.rect(base, 3, 159, 234, 12);
        hdP_boards(s, wall, 3, 93, 236, 158, 6, 51);
        hdP_plinth(s, base, 3, 159, 236, 170, 14, 52);
        /* the roof: dark green shingles */
        const roof = s.add(green, { layer: 6, R: 2, grad: 0.3, bias: 0.06, cast: 2 });
        s.rect(roof, 0, 48, 240, 30);
        hdP_shingles(s, roof, 0, 49, 239, 75, 6, 10, 53, { round: 1 });
        for (let x = 0; x < 240; x++) { hdP_mod(s, roof, x, 76, -1); hdP_mod(s, roof, x, 77, -2); }
        /* the awning */
        const aw = hdP_awning(s, 0, 78, 239, 95, hdPal('#1e4a30', '#2f7048', '#3f8f5a', '#58a870', '#78c088'), hdPal('#8a7a5a', '#eadcc0', '#fff4dc', '#fffaee', '#ffffff'), 12, { val: 7, sc: 3, off: 9 });
        hdP_drop(s, roof, 2);
        hdP_drop(s, aw, 6, 0.34);
        /* big windows lit warm, a little table with a red flower in each half, the sky's transom above */
        const warm = hdPal('#8a6a3a', '#f4d48e', '#ffe6a8', '#fff0c4', '#fffae6'), wood = hdRamp('#b07a4a'), leg = hdRamp('#8a5a2b'), red = hdRamp('#e0405a'), panel = hdPal('#7a5a30', '#d8a868', '#e8bc7c', '#f2cc90', '#f8dca8');
        const tables = (gl, x, y, w, h) => {
            for (let j = h - 10; j < h; j++) for (let i = 0; i < w; i++) hdP_rec(s, gl, x + i, y + j, panel);
            for (const tx of [x + 3, x + 30]) {
                for (let j = 0; j < 4; j++) for (let i = 0; i < 18; i++) hdP_rec(s, gl, tx + i, y + 21 + j, j === 0 ? hdRamp('#d09a64') : wood);
                for (let j = 25; j < h; j++) { hdP_rec(s, gl, tx + 7, y + j, leg); hdP_rec(s, gl, tx + 8, y + j, leg); }
                for (const [i, j] of [[8, 17], [7, 18], [9, 18], [8, 19]]) hdP_rec(s, gl, tx + i, y + j, red);
                hdP_rec(s, gl, tx + 8, y + 20, hdRamp('#5aa83a'));
            }
        };
        for (const wx of [12, 162]) {
            const tr = s.add(white, { layer: 3, R: 1 }), tg = s.add(hdPal('#3c6a86', '#6fb2d4', '#9fd8ef', '#c4ecf8', '#f2fcff'), { layer: 2, flat: 1, grad: 0.2 });
            s.rect(tr, wx + 3, 93, 36, 6); s.rect(tg, wx + 6, 93, 13, 4); s.rect(tg, wx + 21, 93, 15, 4);
            hdP_window(s, wx, 99, 66, 45, { frame: green, glass: warm, bars: false, inside: tables, t: 3, grad: 0.16 });
        }
        /* the red door in a white frame, a step */
        hdP_door(s, 102, 123, 36, 48, hdPal('#5a1018', '#8e1e2c', '#b3263a', '#bc4052', '#d0606e'), { frame: white, t: 3 });
        const step = s.add(hdP_soft('#c8bfb4', '#5e564c'), { layer: 6, R: 1, grad: 0.2 });
        s.rect(step, 104, 168, 32, 3);
        /* the hanging board: a red bowl with an egg and noodles, steam rising */
        const br = s.add(hdP_IRON, { layer: 7, R: 1, grad: 0 });
        s.rect(br, 93, 63, 21, 2); s.rect(br, 93, 63, 2, 12); s.rect(br, 112, 63, 2, 12);
        const bd = s.add(green, { layer: 8, R: 1.5, grad: 0.2, cast: 2 }), face = s.add(hdPal('#a8906a', '#eadcc0', '#fff4dc', '#fffaf0', '#ffffff'), { layer: 9, R: 2, grad: 0.25 });
        s.rect(bd, 87, 75, 33, 27); s.rect(face, 90, 78, 27, 21);
        const bowl = s.add('#e0405a', { layer: 10, R: 2, grad: 0.3 });
        s.poly(bowl, [[93, 88], [114, 88], [111, 94], [108, 96], [99, 96], [96, 94]]);
        s.rect(bowl, 100, 96, 7, 2);
        for (let x = 94; x < 114; x++) hdP_mod(s, bowl, x, 88, 1);
        for (let x = 95; x < 113; x += 2) s.px(x, 87, '#f8e0a0');
        s.px(103, 86, '#ffffff'); s.px(104, 86, '#ffffff'); s.px(102, 87, '#ffffff'); s.px(103, 87, '#ffd84a'); s.px(104, 87, '#ffd84a'); s.px(105, 87, '#ffffff');
        s.line(br, 109, 80, 113, 87, 0.5);
        for (const [i, j] of [[99, 81], [100, 82], [99, 83], [104, 80], [105, 81], [104, 82], [108, 82], [107, 83]]) s.px(i, j, '#d8d0c4');
        /* the potted plant left of the door */
        const pot = s.add(hdPal('#5a2a14', '#9a5028', '#c9703f', '#d88a58', '#e8a474'), { layer: 8, R: 2, grad: 0.2 });
        s.poly(pot, [[60, 154], [78, 154], [76, 171], [62, 171]]); s.rect(pot, 59, 152, 21, 3);
        for (const [dx, dy, r, l] of [[-6, -2, 4.5, 7], [6, -2, 4.5, 7], [0, -5, 5, 8], [-3, 0, 4, 9], [4, 0, 4, 9]]) {
            const lv = s.add(hdPal('#1e4a1e', '#3a7a30', '#5aa83a', '#6cc063', '#8cd47a'), { layer: l, R: 2.5, grad: 0.3 });
            s.ellipse(lv, 69.5 + dx, 150 + dy, r, r * 0.85);
            for (let k = 0; k < 4; k++) { const a = k * 1.7 + dx; hdP_mod(s, lv, 69.5 + dx + Math.cos(a) * r * 0.5, 150 + dy + Math.sin(a) * r * 0.4, k % 2 ? 1 : -1); }
        }
        /* the menu chalkboard: a bowl in chalk */
        const bf = s.add(hdPal('#2a1e14', '#463424', '#5a4633', '#74593f', '#8a6c4c'), { layer: 8, R: 1, grad: 0.1 });
        const cb = s.add(hdPal('#141c1a', '#232c29', '#2f3a36', '#3a4843', '#4a5a54'), { layer: 9, flat: 1, grad: 0.2 });
        s.line(bf, 154.5, 173, 158, 141, 1); s.line(bf, 183.5, 173, 180, 141, 1);
        s.rect(bf, 156, 138, 27, 29);
        s.rect(cb, 159, 141, 21, 23);
        for (let j = 0; j < 5; j++) { const hw = Math.round(6.5 - j * j * 0.25); for (let i = -hw; i <= hw; i++) s.px(169 + i, 150 + j, j === 0 ? '#ffffff' : '#e8e4da'); }
        for (let i = 0; i < 6; i++) s.px(173 + i, 148 - i, '#c8b48a');
        for (const [i, j] of [[166, 145], [167, 146], [166, 147], [170, 144], [171, 145], [170, 146]]) s.px(i, j, '#e8e4da');
        for (let i = 0; i < 11; i++) if (i % 4 !== 3) s.px(164 + i, 159, '#d8d4ca');
        hdP_finish(s);
    },
};

/* ---------------------------------------------------------------- Floss & Gloss (the salon) */
/* lilac walls under a purple roof with a giant pink comb on top, a purple-and-white awning, scissors on the round sign,
   a barber's pole by the window and a purple door */
HD_SPR.salon = {
    w: 192, h: 180, ax: 96, ay: 171,
    draw(s) {
        const purple = hdPal('#4a2a7a', '#8a5ad0', '#b37cf0', '#c69af4', '#d8b8f8'), deep = hdPal('#2e1a4a', '#6a4296', '#8a5ab8', '#a078cc', '#b896dc');
        const white = hdPal('#9a8aa6', '#e4dcea', '#fbf8fc', '#ffffff', '#ffffff'), pink = hdPal('#8a3a5e', '#e07aa0', '#ff9ec0', '#ffbcd6', '#ffd8e8');
        const wall = s.add(hdPal('#8a7896', '#ecdaf2', '#f6e8fa', '#faf2fc', '#ffffff'), { layer: 1, R: 2, grad: 0.12 });
        const base = s.add(hdP_soft('#cec1d4', '#685c70'), { layer: 2, R: 1, grad: 0.1 });
        s.rect(wall, 3, 93, 186, 78);
        s.rect(base, 3, 159, 186, 12);
        hdP_boards(s, wall, 3, 93, 188, 158, 6, 61);
        hdP_plinth(s, base, 3, 159, 188, 170, 14, 62);
        /* the comb on the roof: its back above the roof line, the teeth over the tiles */
        const comb = s.add(pink, { layer: 8, R: 4, grad: 0.3, cast: 2 });
        s.rect(comb, 66, 33, 60, 18); s.rect(comb, 63, 36, 66, 12);
        for (let x = 66; x < 126; x++) { hdP_mod(s, comb, x, 38, 1); hdP_mod(s, comb, x, 39, 1); }
        const roof = s.add(purple, { layer: 6, R: 2, grad: 0.3, bias: 0.04, cast: 2 });
        s.rect(roof, 0, 48, 192, 30);
        s.rect(comb, 66, 48, 60, 3);
        for (let x = 66; x < 126; x += 6) s.rect(comb, x, 51, 3, 12);
        hdP_shingles(s, roof, 0, 49, 191, 75, 6, 10, 63, { round: 1 });
        for (let x = 0; x < 192; x++) { hdP_mod(s, roof, x, 76, -1); hdP_mod(s, roof, x, 77, -2); }
        hdP_drop(s, comb, 3, 0.4);
        /* the awning */
        const aw = hdP_awning(s, 0, 78, 191, 95, purple, white, 12, { val: 7, sc: 3, off: 9 });
        hdP_drop(s, roof, 2);
        hdP_drop(s, aw, 6, 0.34);
        /* the window (a mirror and a chair inside), the barber's pole in front of its right side */
        const chairInside = (gl, x, y, w, h) => {
            for (let j = 2; j < 14; j++) for (let i = 2; i < 11; i++) if ((i - 6.5) ** 2 / 20 + (j - 8) ** 2 / 36 <= 1) hdP_rec(s, gl, x + i, y + j, hdRamp('#e4f4fa'));
            for (let j = 15; j < h; j++) for (let i = 1; i < 12; i++) if (j < 19 || i < 3 || i > 9) hdP_rec(s, gl, x + i, y + j, deep);
        };
        hdP_window(s, 141, 93, 36, 30, { frame: white, sillMat: white, bars: 'v', inside: chairInside });
        const cap = s.add(hdPal('#3a3c4a', '#6a6e84', '#8a8ea8', '#a8acc2', '#c8cad8'), { layer: 8, R: 1.5, grad: 0.3 });
        const pole = s.add(white, { layer: 7, R: 5, grad: 0.05, k: 1.6 });
        s.rect(cap, 159, 95, 12, 4); s.rect(cap, 161, 93, 8, 2);
        s.rect(pole, 161, 99, 8, 41);
        s.rect(cap, 159, 140, 12, 4); s.ellipse(cap, 165, 145, 2.5, 1.5);
        for (let y = 99; y < 140; y++) for (let x = 161; x < 169; x++) { const k = ((y - x * 0.9) % 10 + 10) % 10; if (k < 3) hdP_rec(s, pole, x, y, '#e0405a'); else if (k >= 5 && k < 8) hdP_rec(s, pole, x, y, '#4f86c6'); }
        /* the purple door */
        hdP_door(s, 78, 123, 36, 48, hdPal('#3e2460', '#6e4a9e', '#986ec1', '#aa86cc', '#bc9ed8'), { frame: white, t: 3 });
        const step = s.add(hdP_soft('#c8bccc', '#5e5264'), { layer: 6, R: 1, grad: 0.2 });
        s.rect(step, 80, 168, 32, 3);
        /* a pot of pink flowers by the door */
        const pot = s.add(hdPal('#5a2a14', '#9a5028', '#c9703f', '#d88a58', '#e8a474'), { layer: 8, R: 2, grad: 0.2 });
        s.poly(pot, [[56, 157], [72, 157], [70, 171], [58, 171]]); s.rect(pot, 55, 155, 19, 3);
        for (const [dx, dy, r, l] of [[-5, -3, 4.5, 7], [5, -3, 4.5, 7], [0, -6, 5, 8], [0, -1, 4.5, 9]]) {
            const lv = s.add(hdPal('#1e4a1e', '#3a7a30', '#5aa83a', '#6cc063', '#8cd47a'), { layer: l, R: 2.5, grad: 0.3 });
            s.ellipse(lv, 64.5 + dx, 152 + dy, r, r * 0.85);
        }
        for (const [fx, fy] of [[59, 147], [64, 144], [69, 148], [62, 151], [67, 152]]) { for (const [i, j] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) s.px(fx + i, fy + j, '#ff8fb0'); s.px(fx, fy, '#fff0a0'); }
        /* the round sign: a pair of scissors */
        hdP_hangSign(s, 34, 87, 16, deep, hdPal('#a8906a', '#eadcc0', '#fff4dc', '#fffaf0', '#ffffff'), (cx, cy) => {
            const bl = s.add(hdPal('#4a4c5a', '#8a8ea8', '#b8bccc', '#d8dae4', '#f4f4fa'), { layer: 10, R: 1, grad: 0.2 });
            s.line(bl, cx - 6, cy - 8, cx + 5, cy + 4, 1); s.line(bl, cx + 7, cy - 8, cx - 4, cy + 4, 1);
            const hd = s.add(deep, { layer: 11, R: 1.5, grad: 0.3 });
            for (const sx of [-5, 6]) { s.ellipse(hd, cx + sx + 0.5, cy + 6, 3.2, 3.2); }
            hdP_later(s, () => { for (const sx of [-5, 6]) for (const [i, j] of [[0, 0], [1, 0], [0, 1], [1, 1]]) if (s.at(cx + sx + i, cy + 5 + j) === hd) s.erase(cx + sx + i, cy + 5 + j); });
            s.px(cx + 1, cy - 2, '#ffd35a');
        });
        hdP_finish(s);
    },
};

/* the tall roof of the studio, the workshop and Waffle's: tile courses in two tones, the top running off the frame */
function hdP_bigRoof(s, mat, odd, tileW, seed, o) {
    o = o || {};
    const roof = s.add(mat, { layer: 4, R: 2, grad: 0.25, bias: 0.04 });
    s.poly(roof, [[24, 0], [216, 0], [219, 9], [219, 15], [240, 15], [240, 75], [0, 75], [0, 15], [21, 15], [21, 9]]);
    hdP_shingles(s, roof, 0, 0, 239, 74, 9, tileW, seed, { round: o.round !== false });
    for (let y = 0; y < 75; y++) if (Math.floor(y / 9) % 2) for (let x = 0; x < 240; x++) hdP_rec(s, roof, x, y, odd);
    return roof;
}
/* ---------------------------------------------------------------- the pottery studio */
/* peach plaster under a big terracotta roof with a chimney, a plaque with a pot on the roof, brown frames, a blue vase on
   the round sign and the studio's glazed pots on shelves under the windows */
HD_SPR.studio = {
    w: 240, h: 180, ax: 120, ay: 171,
    draw(s) {
        const brown = hdPal('#2e1a0e', '#5a3620', '#7a4a2e', '#946040', '#a87452'), terra = hdPal('#4a1a10', '#8a3a26', '#b8553a', '#c86c4c', '#d88462');
        const wall = s.add(hdPal('#7a5034', '#d8a078', '#e8b48a', '#f0c49c', '#f6d4b0'), { layer: 1, R: 2, grad: 0.12 });
        const base = s.add(hdP_soft('#c39678', '#5e4232'), { layer: 2, R: 1, grad: 0.1 });
        s.rect(wall, 3, 84, 234, 87);
        s.rect(base, 3, 159, 234, 12);
        /* plaster: a light speckle and a hairline crack or two */
        for (let y = 86; y < 159; y++) for (let x = 4; x < 236; x++) { const v = hdP_hash(x, y, 71); if (v > 0.985) hdP_mod(s, wall, x, y, -1); else if (v < 0.012) hdP_mod(s, wall, x, y, 1); }
        for (let i = 0; i < 7; i++) { hdP_mod(s, wall, 70 + i, 140 + (i >> 1), -1); hdP_mod(s, wall, 200 - i, 100 + i, -1); }
        hdP_plinth(s, base, 3, 159, 236, 170, 14, 72);
        /* the roof: courses of terracotta tiles, the eave board */
        hdP_bigRoof(s, terra, hdPal('#40160e', '#7c3422', '#ab4f38', '#ba6246', '#ca7a5a'), 14, 73);
        const eave = s.add(hdPal('#3a140c', '#6e2c20', '#954636', '#a85a48', '#ba6e5a'), { layer: 5, R: 1, grad: 0.2, cast: 2 });
        s.rect(eave, 0, 75, 240, 9);
        for (let x = 0; x < 240; x++) { hdP_mod(s, eave, x, 76, 1); if (x % 12 === 0) for (let y = 79; y < 83; y++) hdP_mod(s, eave, x, y, -1); }
        hdP_drop(s, eave, 4, 0.3);
        /* the chimney: bricks, a cap, a wisp of smoke */
        const ch = s.add(terra, { layer: 5, R: 1.5, grad: 0.15 });
        s.rect(ch, 192, 12, 18, 42);
        for (let y = 12; y < 54; y++) for (let x = 192; x < 210; x++) { const row = Math.floor((y - 12) / 4), rx = (x - 192 + (row % 2) * 3) % 6; if ((y - 12) % 4 === 3 || rx === 5) hdP_mod(s, ch, x, y, -1); }
        const cc = s.add(hdPal('#30100a', '#5e2a1c', '#8f3f2a', '#a45038', '#b66448'), { layer: 6, R: 1, grad: 0.3, cast: 2 });
        s.rect(cc, 189, 3, 24, 9);
        for (let x = 189; x < 213; x++) hdP_mod(s, cc, x, 4, 1);
        hdP_drop(s, cc, 3, 0.3);
        for (const [i, j] of [[201, 1], [202, 1], [203, 0], [204, 0], [200, 2]]) s.px(i, j, '#e0ccc4');
        /* the plaque on the roof: a terracotta pot */
        const pf = s.add(brown, { layer: 6, R: 1.5, grad: 0.2, cast: 2 }), pface = s.add(hdPal('#a8906a', '#ecdcc8', '#fff4e6', '#fffaf2', '#ffffff'), { layer: 7, R: 2, grad: 0.2 });
        s.rect(pf, 30, 45, 27, 30); s.rect(pface, 33, 48, 21, 24);
        const pot = s.add(hdPal('#6a2e14', '#b06a3e', '#d98a5a', '#e6a070', '#f0b888'), { layer: 8, R: 3, grad: 0.3 });
        s.ellipse(pot, 43.5, 62, 7, 6.5); s.rect(pot, 39, 53, 10, 4); s.rect(pot, 37, 52, 14, 2);
        for (let x = 37; x < 51; x++) hdP_mod(s, pot, x, 61, 1);
        hdP_drop(s, pf, 3, 0.3);
        /* windows */
        for (const wx of [15, 189]) hdP_window(s, wx, 93, 36, 30, { frame: brown });
        /* shelves under the windows with glazed pots in today's colors */
        const shelf = s.add(brown, { layer: 6, R: 1, grad: 0.3, cast: 2 });
        s.rect(shelf, 12, 131, 87, 3); s.rect(shelf, 160, 131, 65, 3);
        const pots = [[18, '#6fb3c9', 0], [39, '#d98a5a', 1], [60, '#9dc45f', 2], [81, '#e0607a', 0], [165, '#e0607a', 1], [186, '#6fb3c9', 2], [207, '#d98a5a', 0]];
        for (const [px, col, kind] of pots) {
            const p = s.add(col, { layer: 7, R: 3, grad: 0.3 }), cx = px + 6;
            if (kind === 0) { s.ellipse(p, cx, 126, 5.5, 5); s.rect(p, cx - 2, 119, 4, 3); s.rect(p, cx - 3, 118, 6, 1); }
            else if (kind === 1) { s.poly(p, [[cx - 6, 122], [cx + 6, 122], [cx + 4, 131], [cx - 4, 131]]); s.rect(p, cx - 7, 121, 14, 2); }
            else { s.ellipse(p, cx, 125, 4, 6); s.rect(p, cx - 1.5, 116, 3, 4); }
            for (let x = px; x < px + 12; x++) hdP_mod(s, p, x, 124, 1);
            s.px(cx - 3, 123, '#ffffff');
        }
        /* the door */
        hdP_door(s, 102, 123, 36, 48, hdPal('#3a2214', '#6a4630', '#8a6047', '#a0745a', '#b4886c'), { frame: brown });
        const step = s.add(hdP_soft('#c8a890', '#5e4232'), { layer: 6, R: 1, grad: 0.2 });
        s.rect(step, 104, 168, 32, 3);
        /* the round sign: a blue vase */
        hdP_hangSign(s, 160, 82, 15, brown, hdPal('#a8906a', '#eadcc0', '#fff4dc', '#fffaf0', '#ffffff'), (cx, cy) => {
            const v = s.add(hdPal('#1e3a6e', '#2f5596', '#3f6fb8', '#6f98d0', '#9fc3e6'), { layer: 10, R: 3, grad: 0.3 });
            s.ellipse(v, cx + 0.5, cy + 3, 6, 5.5); s.rect(v, cx - 2, cy - 7, 5, 6); s.rect(v, cx - 4, cy - 8, 9, 2);
            for (let x = cx - 6; x < cx + 7; x++) hdP_mod(s, v, x, cy + 2, 1);
        });
        hdP_finish(s);
    },
};

/* ---------------------------------------------------------------- Club Wasabi */
/* a dark purple club with diagonal stripes, pink neon round the windows and door, a marquee of pink and green chaser
   lights on the roof and a music note on the round sign */
HD_SPR.club = {
    w: 288, h: 180, ax: 144, ay: 171,
    draw(s) {
        const pinkN = hdPal('#7a1a4a', '#d03a84', '#ff5aa8', '#ff8cc4', '#ffd0e8'), glowM = hdPal('#2a1e3e', '#3e2e58', '#4a3866', '#5a4678', '#6a568a');
        const wall = s.add(hdPal('#120e1e', '#221c34', '#2e2742', '#3a3152', '#463c62'), { layer: 1, R: 2, grad: 0.1 });
        s.rect(wall, 3, 84, 282, 87);
        const base = s.add(hdPal('#0e0a18', '#1c1630', '#2a233d', '#342c4a', '#3e3658'), { layer: 2, R: 1, grad: 0.1 });
        s.rect(base, 3, 159, 282, 12);
        /* the diagonal stripes, as today */
        for (let y = 75; y < 171; y++) for (let x = 0; x < 288; x++) { const k = ((x + y) % 21 + 21) % 21; if (k < 3) { hdP_mod(s, wall, x, y, 1); hdP_mod(s, base, x, y, 1); } }
        hdP_plinth(s, base, 3, 159, 284, 170, 16, 81);
        /* the roof band and the striped strip under its eave */
        const roof = s.add(hdPal('#06040a', '#100e16', '#1c1a24', '#26232f', '#302c3c'), { layer: 4, R: 1.5, grad: 0.3, cast: 2 });
        s.rect(roof, 0, 48, 288, 27);
        const band = s.add(hdPal('#06040a', '#120e1c', '#1c1824', '#2a2238', '#3a2d52'), { layer: 3, flat: 1, grad: 0 });
        s.rect(band, 0, 75, 288, 9);
        for (let y = 75; y < 84; y++) for (let x = 0; x < 288; x++) if (((x + y) % 21 + 21) % 21 < 3) hdP_mod(s, band, x, y, 2);
        /* windows: pink neon, the stripes running across the glass */
        const stripes = (gl, x, y, w, h) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if ((((x + i) + (y + j)) % 21 + 21) % 21 < 3) hdP_mod(s, gl, x + i, y + j, -1); };
        for (const wx of [15, 237]) {
            const w = hdP_window(s, wx, 93, 36, 30, { frame: pinkN, sill: false, inside: stripes });
            hdP_glow(s, w.fr, wall, 3, glowM);
            for (let i = wx + 1; i < wx + 35; i += 1) s.px(i, 94, '#ffd0e8');
        }
        /* the door: black inner frame, dark door, pink neon */
        const df = s.add(pinkN, { layer: 4, R: 1, grad: 0.2 }), din = s.add(hdPal('#06040e', '#0e0a1a', '#141220', '#1e1a2e', '#2a243c'), { layer: 3, R: 1 });
        const door = s.add(hdPal('#121018', '#22202c', '#302e3b', '#3c3a4a', '#4a4658'), { layer: 3, R: 1.5, grad: 0.15 });
        s.rect(df, 150, 123, 36, 48); s.rect(din, 153, 126, 30, 45); s.rect(door, 156, 129, 24, 42);
        for (let y = 132; y < 168; y += 6) for (let x = 158; x < 178; x++) hdP_mod(s, door, x, y, -1);
        for (let x = 152; x < 184; x++) s.px(x, 124, '#ffd0e8');
        s.px(175, 152, '#fff3b0'); s.px(176, 152, '#ffd35a'); s.px(175, 153, '#e0a838'); s.px(176, 153, '#a8741e');
        hdP_glow(s, df, wall, 3, glowM);
        /* the round sign: a pink music note on black */
        hdP_hangSign(s, 213, 87, 16, pinkN, hdPal('#06040a', '#100e16', '#1c1a24', '#26232f', '#302c3c'), (cx, cy) => {
            const n = s.add(pinkN, { layer: 10, R: 1.5, grad: 0.3 });
            s.ellipse(n, cx - 4, cy + 5, 3.5, 2.8); s.ellipse(n, cx + 5, cy + 3, 3.5, 2.8);
            s.rect(n, cx - 2, cy - 7, 2, 12); s.rect(n, cx + 7, cy - 9, 2, 12);
            s.poly(n, [[cx - 2, cy - 7], [cx + 9, cy - 9], [cx + 9, cy - 5], [cx - 2, cy - 3]]);
        });
        /* the marquee: two rows of chaser lights, pink and green */
        const box = s.add(hdPal('#06040a', '#100e16', '#1c1a24', '#26232f', '#322e40'), { layer: 6, R: 2, grad: 0.25, cast: 2 });
        s.rect(box, 39, 36, 210, 36); s.rect(box, 36, 39, 216, 33); s.rect(box, 33, 42, 222, 30);
        const rim = s.add(hdPal('#1e1a2a', '#2a2438', '#3a3346', '#4a4258', '#5a526a'), { layer: 7, R: 1 });
        for (let x = 42; x < 246; x++) s.plot(rim, x, 39);
        for (let i = 0; i < 34; i++) { hdP_bulb(s, 46 + i * 6, 51, i % 2 ? '#9ccc4a' : '#ff5aa8'); hdP_bulb(s, 46 + i * 6, 58, '#9ccc4a'); }
        hdP_finish(s);
    },
};

/* ---------------------------------------------------------------- Ginger's workshop (the builder) */
/* plank walls under a red-brown roof with rafter ends at the eave, big braced barn doors, a hammer on the round sign, a
   pile of logs and a sawhorse */
HD_SPR.builder = {
    w: 240, h: 180, ax: 120, ay: 171,
    draw(s) {
        const dark = hdPal('#1e100a', '#3e2214', '#5a3522', '#704430', '#84543c'), wood = hdPal('#3a1e10', '#6a3e22', '#7a4a2e', '#8e5c3a', '#a06c46');
        const wall = s.add(hdPal('#5a3416', '#b07640', '#c98a55', '#d69c68', '#e2b07e'), { layer: 1, R: 2, grad: 0.1 });
        s.rect(wall, 3, 84, 234, 87);
        hdP_planks(s, wall, 3, 84, 236, 170, 15, 91);
        for (let y = 159; y < 171; y++) for (let x = 3; x < 237; x++) hdP_rec(s, wall, x, y, hdPal('#4e2c14', '#946038', '#aa744d', '#b8865e', '#c69a72'));
        hdP_bigRoof(s, hdPal('#3a120c', '#782a22', '#9a3a2e', '#ac4c3c', '#be6050'), hdPal('#36100c', '#702620', '#90372d', '#a2483a', '#b45c4c'), 24, 92, { round: false });
        /* the eave: a dark fascia and the rafter ends under it */
        const fas = s.add(hdPal('#2a0e0a', '#5a2420', '#7e312c', '#90403a', '#a2504a'), { layer: 5, R: 1, grad: 0.2, cast: 2 });
        s.rect(fas, 0, 75, 240, 3);
        const raft = s.add(hdPal('#4a2a14', '#86542c', '#a86a3a', '#ba7e4c', '#cc9460'), { layer: 4, R: 1, grad: 0.3, cast: 2 });
        for (let x = 12; x < 236; x += 15) s.rect(raft, x, 78, 3, 6);
        const soff = s.add(hdPal('#1e0c08', '#3e1a14', '#5a2a22', '#6a3a30', '#7a4a40'), { layer: 3, flat: 1, grad: 0 });
        s.rect(soff, 0, 78, 240, 6);
        s.rect(raft, 12, 78, 3, 6);
        hdP_drop(s, soff, 4, 0.3);
        /* windows */
        for (const wx of [15, 189]) hdP_window(s, wx, 93, 36, 30, { frame: dark });
        /* the barn doors: braced with an X, two knobs */
        const fr = s.add(dark, { layer: 3, R: 1.5, grad: 0.1, cast: 2 }), dl = s.add(wood, { layer: 2, R: 1.5, grad: 0.15 }), dr = s.add(wood, { layer: 2, R: 1.5, grad: 0.15 });
        s.rect(fr, 90, 96, 60, 75);
        s.rect(dl, 93, 99, 26, 72); s.rect(dr, 121, 99, 26, 72);
        hdP_planks(s, dl, 93, 99, 118, 170, 6, 93); hdP_planks(s, dr, 121, 99, 146, 170, 6, 94);
        const brace = s.add(dark, { layer: 4, R: 1, grad: 0.15 });
        for (const x0 of [93, 121]) { s.rect(brace, x0, 99, 26, 3); s.rect(brace, x0, 132, 26, 3); s.rect(brace, x0, 165, 26, 3); s.line(brace, x0 + 1.5, 103, x0 + 24.5, 130, 1.1); s.line(brace, x0 + 24.5, 103, x0 + 1.5, 130, 1.1); s.line(brace, x0 + 1.5, 136, x0 + 24.5, 163, 1.1); s.line(brace, x0 + 24.5, 136, x0 + 1.5, 163, 1.1); }
        for (const kx of [114, 125]) { s.px(kx, 135, '#fff3b0'); s.px(kx + 1, 135, '#ffd35a'); s.px(kx, 136, '#e0a838'); s.px(kx + 1, 136, '#a8741e'); }
        /* the round sign: a hammer */
        hdP_hangSign(s, 172, 79, 16, wood, hdPal('#a8906a', '#eadcc0', '#fff4dc', '#fffaf0', '#ffffff'), (cx, cy) => {
            const hd = s.add(hdPal('#3a3e4a', '#6a7486', '#8a96a8', '#a8b2c2', '#c8d0dc'), { layer: 11, R: 1.5, grad: 0.3 }), hl = s.add(hdPal('#4a2a14', '#8a5a2e', '#b07a4a', '#c69062', '#d8a878'), { layer: 10, R: 1, grad: 0.2 });
            s.rect(hl, cx - 1, cy - 4, 3, 14);
            s.rect(hd, cx - 7, cy - 8, 15, 5); s.rect(hd, cx + 6, cy - 9, 3, 7);
        });
        /* the log pile: rings on the cut ends, bark round them */
        const ends = [[28.5, 141], [40.5, 141], [22.5, 150.5], [34.5, 150.5], [46.5, 150.5], [16.5, 160.5], [28.5, 160.5], [40.5, 160.5], [52.5, 160.5]];
        ends.forEach(([lx, ly], i) => {
            const bark = s.add(hdPal('#2e1a0e', '#5a3420', '#7a4a2e', '#8a5a3a', '#9a6a48'), { layer: 6 + (ly > 155 ? 2 : ly > 145 ? 1 : 0), R: 1, grad: 0.2 });
            const cut = s.add(hdPal('#8a5a2b', '#c08a52', '#d9a46a', '#e6b880', '#f0cc98'), { layer: 9, R: 2, grad: 0.25 });
            s.ellipse(bark, lx, ly, 5.8, 5.5); s.ellipse(cut, lx, ly - 0.3, 4.3, 4);
            for (let a = 0; a < 16; a++) { const t = a / 16 * Math.PI * 2; hdP_mod(s, cut, lx + Math.cos(t) * 2.4, ly - 0.3 + Math.sin(t) * 2.2, -1); }
            s.px(Math.floor(lx), Math.floor(ly), '#8a5a2b');
        });
        /* the sawhorse */
        const sh = s.add(hdPal('#2e1a0e', '#5a3820', '#8a5a2b', '#a06e3c', '#b4824e'), { layer: 8, R: 1, grad: 0.2 });
        s.rect(sh, 184, 152, 42, 4);
        s.line(sh, 193, 156, 187, 170, 1.1); s.line(sh, 217, 156, 223, 170, 1.1);
        const shb = s.add(hdPal('#2e1a0e', '#4a2e18', '#6a4424', '#7e5430', '#92643c'), { layer: 7, R: 1 });
        s.line(shb, 196, 156, 200, 168, 0.8); s.line(shb, 214, 156, 210, 168, 0.8);
        hdP_finish(s);
    },
};

/* ---------------------------------------------------------------- Waffle's island displays shop */
/* pale green walls under a green roof with a waffle on a post, a green-and-cream awning, a street lamp, a trophy on the
   round sign, a green door and a potted bush */
HD_SPR.displays = {
    w: 240, h: 180, ax: 120, ay: 171,
    draw(s) {
        const cream = hdPal('#9a8a6a', '#eadcc0', '#fff4dc', '#fffaee', '#ffffff'), green = hdPal('#1e4a26', '#2f7038', '#3f8f45', '#58a85a', '#78c070');
        const wall = s.add(hdPal('#7a8466', '#dce6cc', '#eef4e0', '#f6faee', '#ffffff'), { layer: 1, R: 2, grad: 0.12 });
        const base = s.add(hdP_soft('#c8cbbf', '#62665a'), { layer: 2, R: 1, grad: 0.1 });
        s.rect(wall, 3, 84, 234, 87);
        s.rect(base, 3, 159, 234, 12);
        hdP_boards(s, wall, 3, 93, 236, 158, 6, 101);
        hdP_plinth(s, base, 3, 159, 236, 170, 14, 102);
        hdP_bigRoof(s, hdPal('#183a1e', '#346a36', '#4a8a4a', '#5e9e5a', '#76b46c'), hdPal('#163a1c', '#306234', '#468047', '#5a9658', '#70aa68'), 14, 103);
        /* the waffle sign on its post */
        const post = s.add(hdP_BROWN, { layer: 5, R: 1 });
        s.rect(post, 117, 57, 6, 18);
        const waf = s.add(hdPal('#6a4410', '#b07a26', '#e8b050', '#f2c46a', '#f8d888'), { layer: 6, R: 3, grad: 0.25, cast: 2 });
        s.rect(waf, 99, 30, 42, 27); s.rect(waf, 96, 33, 48, 21);
        for (let y = 31; y < 56; y++) for (let x = 97; x < 143; x++) { const gx = (x - 99) % 12, gy = (y - 31) % 9; if (gx >= 9 || gy >= 7) hdP_mod(s, waf, x, y, -1); else if (gx === 0 || gy === 0) hdP_mod(s, waf, x, y, 1); }
        hdP_drop(s, waf, 3, 0.3);
        /* the awning */
        const aw = hdP_awning(s, 0, 75, 239, 95, green, cream, 12, { val: 7, sc: 3, off: 9 });
        hdP_drop(s, aw, 6, 0.34);
        /* windows (the right one partly behind the sign, the left one behind the lamp) */
        hdP_window(s, 21, 93, 30, 30, { frame: cream, sillMat: cream });
        hdP_window(s, 189, 93, 36, 30, { frame: cream, sillMat: cream });
        /* the street lamp */
        const iron = s.add(hdP_IRON, { layer: 8, R: 1, grad: 0.1 });
        s.rect(iron, 15, 108, 6, 63); s.rect(iron, 13, 165, 10, 6);
        s.rect(iron, 9, 96, 18, 3); s.rect(iron, 11, 108, 14, 3); s.rect(iron, 9, 99, 3, 9); s.rect(iron, 24, 99, 3, 9);
        s.rect(iron, 15, 93, 6, 3);
        const lamp = s.add(hdPal('#c8a840', '#f0d880', '#fff2b0', '#fff8d8', '#ffffff'), { layer: 9, flat: 1, grad: 0.4 });
        s.rect(lamp, 12, 99, 12, 9);
        /* the green door in its cream frame */
        hdP_door(s, 102, 123, 36, 48, hdPal('#2a4a2a', '#3f6a3f', '#567c56', '#6a906a', '#80a480'), { frame: cream, t: 3 });
        const step = s.add(hdP_soft('#c0c4b6', '#5a5e52'), { layer: 6, R: 1, grad: 0.2 });
        s.rect(step, 104, 168, 32, 3);
        /* the round sign: a trophy */
        hdP_hangSign(s, 189, 87, 16, green, hdPal('#a8906a', '#eadcc0', '#fff4dc', '#fffaf0', '#ffffff'), (cx, cy) => {
            const cup = s.add(hdPal('#7a5410', '#c89a26', '#ffd84a', '#ffe680', '#fff4c0'), { layer: 10, R: 2, grad: 0.3 });
            s.poly(cup, [[cx - 6, cy - 8], [cx + 7, cy - 8], [cx + 5, cy - 1], [cx + 2, cy + 1], [cx + 2, cy + 4], [cx + 5, cy + 6], [cx + 5, cy + 8], [cx - 4, cy + 8], [cx - 4, cy + 6], [cx - 1, cy + 4], [cx - 1, cy + 1], [cx - 4, cy - 1]]);
            for (const sx of [-8, 8]) for (let j = 0; j < 5; j++) s.plot(cup, cx + 0.5 + sx * (1 - Math.abs(j - 2) * 0.1) - (sx > 0 ? 1 : 0), cy - 7 + j);
            s.px(cx - 3, cy - 6, '#ffffff'); s.px(cx - 3, cy - 5, '#fff4c0');
        });
        /* the potted bush */
        const pot = s.add(hdPal('#4a2a14', '#8a5a2e', '#b07a4a', '#c69062', '#d8a878'), { layer: 8, R: 1.5, grad: 0.2 });
        s.poly(pot, [[201, 153], [225, 153], [223, 171], [203, 171]]); s.rect(pot, 200, 151, 27, 3);
        for (const [dx, dy, r, l] of [[-6, -4, 6, 6], [6, -4, 6, 6], [0, -9, 6.5, 7], [-3, 0, 5.5, 9], [4, 0, 5.5, 9]]) {
            const lv = s.add(hdPal('#1e4a1e', '#3a7a30', '#4f9a3a', '#66b04a', '#86c868'), { layer: l, R: 3, grad: 0.3 });
            s.ellipse(lv, 213.5 + dx, 146 + dy, r, r * 0.9);
            for (let k = 0; k < 6; k++) { const a = k * 1.9 + dx; hdP_mod(s, lv, 213.5 + dx + Math.cos(a) * r * 0.55, 146 + dy + Math.sin(a) * r * 0.5, k % 2 ? 1 : -1); }
        }
        hdP_finish(s);
    },
};

/* ---------------------------------------------------------------- the barn */
/* red boards under a gambrel roof with a weathervane, a hayloft full of hay, big doors braced with white X's */
HD_SPR.barn = {
    w: 240, h: 192, ax: 120, ay: 183,
    draw(s) {
        const white = hdPal('#8a8070', '#e2dccc', '#fbf6ee', '#ffffff', '#ffffff'), red = hdPal('#4a120c', '#94281e', '#c0392b', '#cc5040', '#d86858');
        const wall = s.add(red, { layer: 1, R: 2, grad: 0.1 });
        s.rect(wall, 9, 84, 222, 99);
        hdP_planks(s, wall, 9, 84, 230, 182, 15, 111);
        /* the gambrel roof: shallow above, steep below, boards in two tones */
        const L = [[75, 0], [57, 12], [33, 27], [21, 36], [15, 45], [9, 57], [3, 69], [0, 75], [0, 81]];
        const pts = L.concat(L.slice().reverse().map(([x, y]) => [240 - x, y]));
        const roof = s.add(hdPal('#2e0e0a', '#5a1e18', '#7a3228', '#8a4034', '#9a5040'), { layer: 4, R: 2, grad: 0.2, bias: 0.04 });
        s.poly(roof, pts);
        hdP_shingles(s, roof, 0, 0, 239, 80, 9, 18, 112, { round: 1 });
        const odd = hdPal('#280c08', '#4e1a14', '#6a2a22', '#7a362c', '#8a4438');
        for (let y = 0; y < 81; y++) if (Math.floor(y / 9) % 2) for (let x = 0; x < 240; x++) hdP_rec(s, roof, x, y, odd);
        const eave = s.add(hdPal('#1a0806', '#320f0c', '#4a1e18', '#5a2a22', '#6a362e'), { layer: 5, R: 1, grad: 0.2, cast: 2 });
        s.rect(eave, 0, 81, 240, 3);
        hdP_drop(s, eave, 4, 0.3);
        /* the weathervane */
        const vane = s.add(hdP_IRON, { layer: 6, R: 1, grad: 0 });
        s.rect(vane, 119, 0, 3, 12); s.rect(vane, 111, 4, 19, 2);
        s.poly(vane, [[129, 2], [133, 5], [129, 8]]); s.rect(vane, 108, 3, 3, 4);
        /* the hayloft: a white frame, the dark loft, hay spilling at the sill, a beam for the hoist */
        const hf = s.add(white, { layer: 5, R: 1.5, grad: 0.15, cast: 2 }), hole = s.add(hdPal('#120804', '#22140c', '#3a2418', '#4a3020', '#5a3c28'), { layer: 4, flat: 1, grad: 0.4, bias: -0.1 });
        s.rect(hf, 99, 33, 42, 36); s.rect(hole, 102, 36, 36, 30);
        const hay = s.add(hdPal('#7a5a14', '#c09a30', '#e8c050', '#f2d06a', '#fae498'), { layer: 6, R: 2, grad: 0.3 });
        for (let i = 0; i < 12; i++) s.ellipse(hay, 104 + i * 3, 63 - (i % 3 === 1 ? 2 : 0), 2.6, 2.6);
        s.rect(hay, 102, 62, 36, 4);
        for (let i = 0; i < 14; i++) { const x = 103 + i * 2.5; s.px(x, 58 + (i % 4), '#fae498'); s.px(x + 1, 59 + (i % 3), '#c09a30'); }
        const beam = s.add(hdPal('#2e1a0e', '#4e3420', '#6a4a2e', '#7e5c3a', '#926e48'), { layer: 6, R: 1, grad: 0.2, cast: 2 });
        s.rect(beam, 116, 27, 9, 6);
        /* the doors: white frame, white X braces on dark red boards */
        const df = s.add(white, { layer: 3, R: 1.5, grad: 0.1, cast: 1 });
        const dfill = s.add(hdPal('#3a0e0a', '#6e1e16', '#962c21', '#a43a2e', '#b2483a'), { layer: 2, R: 1.5, grad: 0.15 });
        s.rect(df, 78, 105, 84, 78);
        s.rect(dfill, 81, 108, 36, 75); s.rect(dfill, 123, 108, 36, 75);
        hdP_planks(s, dfill, 81, 108, 158, 182, 6, 113);
        for (const x0 of [81, 123]) { s.line(df, x0 + 1.5, 109.5, x0 + 34.5, 181.5, 1.2); s.line(df, x0 + 34.5, 109.5, x0 + 1.5, 181.5, 1.2); }
        s.rect(df, 117, 105, 6, 78);
        for (let y = 108; y < 183; y++) hdP_mod(s, df, 119, y, -1);
        hdP_finish(s);
    },
};

/* ---------------------------------------------------------------- the windmill and its sails */
/* a tapering white tower of stone courses under a brown shingled cap, a window, an arched door; the sails turn over it
   (four frames, 22.5 degrees apart, the hub at the top of the tower) */
HD_SPR.windmill = {
    w: 144, h: 288, ax: 72, ay: 279,
    draw(s) {
        const tw = s.add(hdPal('#8a7e6c', '#d8cebc', '#efe8dc', '#f8f3ea', '#fffdf7'), { layer: 1, flat: 1, grad: 0.06, bias: 0.02 });
        hdP_cyl(s, tw);
        s.poly(tw, [[42, 78], [102, 78], [129, 279], [15, 279]]);
        /* stone courses: a line under each, the joints staggered */
        for (let y = 80; y < 279; y++) for (let x = 15; x < 129; x++) {
            const row = Math.floor((y - 78) / 12), ry = (y - 78) % 12, rx = (x + (row % 2) * 9) % 18;
            if (ry === 11) hdP_mod(s, tw, x, y, -1); else if (rx === 0 && ry > 1 && ry < 10) hdP_mod(s, tw, x, y, -1);
            else if (ry === 0 && hdP_hash(Math.floor((x + (row % 2) * 9) / 18), row, 121) > 0.4) hdP_mod(s, tw, x, y, 1);
        }
        /* the cap: a cone of brown shingles on a finial post */
        const post = s.add(hdPal('#1e100a', '#3e2214', '#5a3522', '#6e4430', '#82543e'), { layer: 3, R: 1 });
        s.rect(post, 66, 9, 12, 18); s.ellipse(post, 72, 9, 6, 3);
        const cap = s.add(hdPal('#3a2214', '#664028', '#8a5a38', '#9c6c48', '#ae805a'), { layer: 2, R: 14, grad: 0.15, k: 1.4, cast: 3 });
        s.poly(cap, [[64, 25], [80, 25], [117, 76], [27, 76]]);
        s.ellipse(cap, 72, 74, 45, 5);
        hdP_shingles(s, cap, 27, 27, 117, 79, 9, 10, 122, { round: 1 });
        hdP_drop(s, cap, 5, 0.2);
        /* the axle stub the sails turn on */
        const ax = s.add(hdPal('#1e100a', '#3e2214', '#5a3522', '#6e4430', '#82543e'), { layer: 4, R: 2, grad: 0.3 });
        s.ellipse(ax, 72, 87, 7, 7);
        /* the window: brown frame, a little glass */
        hdP_window(s, 60, 129, 24, 27, { frame: hdPal('#3a2214', '#664028', '#8a5a38', '#9c6c48', '#ae805a'), bars: 'v' });
        /* the arched door */
        const df = s.add(hdPal('#2e180c', '#4e2c1a', '#6a3e24', '#7e5032', '#926040'), { layer: 3, R: 1.5, grad: 0.1, cast: 1 }), dd = s.add(hdPal('#3a2214', '#5e3a22', '#7a4a2e', '#8e5c3a', '#a06e48'), { layer: 2, R: 2, grad: 0.15 });
        s.rect(df, 57, 237, 30, 42); s.ellipse(df, 72, 238, 15, 10);
        s.rect(dd, 60, 239, 24, 40); s.ellipse(dd, 72, 240, 12, 8);
        hdP_planks(s, dd, 60, 230, 83, 278, 6, 123);
        s.px(78, 259, '#fff3b0'); s.px(79, 259, '#ffd35a'); s.px(78, 260, '#e0a838'); s.px(79, 260, '#a8741e');
        const st = s.add(hdP_soft('#bdb2a2', '#5e5446'), { layer: 4, R: 1, grad: 0.2 });
        s.rect(st, 55, 276, 34, 3);
        hdP_finish(s);
    },
};
/* one frame of the sails: four lattice sails on spars at a0 + 90 k degrees (counterclockwise, y up) */
function hdP_sails(s, a0) {
    const cx = 96, cy = 96, spar = hdPal('#2e1c10', '#4e3220', '#6b4a2e', '#80603e', '#94724c');
    const canvas = hdPal('#8a7e6a', '#d9cbb4', '#fbf6ee', '#fffcf6', '#ffffff'), lath = hdPal('#5a4028', '#9a7a56', '#b8986e', '#c8aa80', '#d8bc94');
    for (let k = 0; k < 4; k++) {
        const a = (a0 + k * 90) * Math.PI / 180, ux = Math.cos(a), uy = -Math.sin(a), vx = -uy, vy = ux;   /* v: clockwise of u on screen */
        const sail = s.add(canvas, { layer: 1, R: 2, grad: 0.1, k: 1.2 });
        const P = (r, w) => [cx + ux * r + vx * w, cy + uy * r + vy * w];
        s.poly(sail, [P(16, 2), P(91, 2), P(91, 25), P(16, 25)]);
        /* the lattice: bars across every 9 px along the sail, one down the middle */
        for (let y = 0; y < 192; y++) for (let x = 0; x < 192; x++) {
            const dx = x + 0.5 - cx, dy = y + 0.5 - cy, r = dx * ux + dy * uy, w = dx * vx + dy * vy;
            if (r < 16 || r > 91 || w < 2 || w > 25) continue;
            if (((r - 16) % 9) < 1.2 || Math.abs(w - 13.5) < 0.7) hdP_rec(s, sail, x, y, lath);
        }
        const sp = s.add(spar, { layer: 2, R: 1, grad: 0.1 });
        s.line(sp, cx + ux * 6, cy + uy * 6, cx + ux * 93, cy + uy * 93, 1.6, 1.1);
    }
    const hub = s.add(hdPal('#1e100a', '#3e2214', '#5a3522', '#6e4430', '#82543e'), { layer: 3, R: 3, grad: 0.3 });
    s.ellipse(hub, cx, cy, 10, 10);
    const pin = s.add(hdPal('#6a5014', '#b08a2a', '#d9b44a', '#ecd070', '#f8e8a0'), { layer: 4, R: 2, grad: 0.3 });
    s.ellipse(pin, cx, cy, 3.5, 3.5);
    hdP_finish(s);
}
for (let f = 0; f < 4; f++) HD_SPR['windmill_blades_' + f] = { w: 192, h: 192, ax: 96, ay: 96, draw(s) { hdP_sails(s, 78 - 22.5 * f); } };

/* ---------------------------------------------------------------- the lighthouse and its light */
/* a white tower with two red bands on a stone base: a red cap, the lantern room lit gold inside, the iron gallery, two
   little windows and an arched blue door */
HD_SPR.lighthouse = {
    w: 144, h: 372, ax: 72, ay: 363,
    draw(s) {
        const iron = hdPal('#141018', '#24202c', '#3a3340', '#4e4656', '#625a6c'), redM = hdPal('#5a0e1a', '#b0202e', '#e0304a', '#f04a5e', '#ff6a7a');
        /* the stone base: courses of blocks, a lit top */
        const base = s.add(hdPal('#5e584e', '#9a9288', '#b8b0a4', '#c8c0b4', '#d8d0c4'), { layer: 1, R: 2, grad: 0.15 });
        s.rect(base, 6, 321, 132, 39);
        for (let y = 321; y < 360; y++) for (let x = 6; x < 138; x++) {
            const row = Math.floor((y - 324) / 12), ry = (y - 324) % 12, rx = (x - 6 + (row % 2 ? 9 : 0)) % 21;
            if (y < 324) hdP_mod(s, base, x, y, 1); else if (ry === 11 || rx === 20) hdP_mod(s, base, x, y, -1); else if (ry === 0) hdP_mod(s, base, x, y, 1);
        }
        /* the tower: white, two red bands, round in the light */
        const tw = s.add(hdPal('#8a8478', '#d4cec6', '#f4f0e8', '#fdfbf6', '#ffffff'), { layer: 2, flat: 1, grad: 0.06, bias: 0.02 });
        hdP_cyl(s, tw);
        s.poly(tw, [[36, 105], [108, 105], [123, 322], [21, 322]]);
        for (const [y0, y1] of [[144, 179], [231, 266]]) for (let y = y0; y <= y1; y++) for (let x = 15; x < 130; x++) hdP_rec(s, tw, x, y, redM);
        for (let y = 108; y < 320; y += 18) for (let x = 15; x < 130; x++) hdP_mod(s, tw, x, y, -1);
        /* two small windows */
        for (const [wx, wy] of [[66, 150], [69, 222]]) {
            const fr = s.add(iron, { layer: 3, R: 1, grad: 0.1, cast: 1 }), gl = s.add(hdPal('#141c2c', '#1c2438', '#2e3a5a', '#4a5c86', '#8ab8e8'), { layer: 3, flat: 1, grad: 0.5 });
            s.rect(fr, wx - 1, wy - 1, 14, 20); s.rect(gl, wx + 1, wy + 1, 10, 16); s.ellipse(fr, wx + 6, wy, 7, 4); s.ellipse(gl, wx + 6, wy + 1.5, 5, 3);
            for (let j = 0; j < 6; j++) hdP_mod(s, gl, wx + 3 + (j >> 1), wy + 3 + j, 2);
            const sill = s.add(hdPal('#8a8478', '#d8d4ce', '#fbf8f2', '#fffdf8', '#ffffff'), { layer: 4, R: 1, grad: 0.3, cast: 2 });
            s.rect(sill, wx - 2, wy + 18, 16, 3);
        }
        /* the arched door and its step */
        const df = s.add(hdPal('#8a8478', '#d8d4ce', '#fbf8f2', '#fffdf8', '#ffffff'), { layer: 3, R: 1.5, grad: 0.1, cast: 1 }), dd = s.add(hdPal('#101c34', '#1f3458', '#2e4a7a', '#3e5e90', '#5274a6'), { layer: 3, R: 2, grad: 0.15 });
        s.rect(df, 54, 285, 36, 37); s.ellipse(df, 72, 286, 18, 11);
        s.rect(dd, 57, 287, 30, 35); s.ellipse(dd, 72, 288, 15, 9);
        for (let y = 280; y < 322; y++) { hdP_mod(s, dd, 72, y, -2); hdP_mod(s, dd, 73, y, -1); }
        s.px(79, 304, '#fff3b0'); s.px(80, 304, '#ffd84a'); s.px(79, 305, '#e0a838'); s.px(80, 305, '#a8741e');
        const step = s.add(hdPal('#5e584e', '#9a9288', '#b0a89c', '#c8c0b4', '#d8d0c4'), { layer: 4, R: 1, grad: 0.3 });
        s.rect(step, 51, 321, 42, 6);
        /* the gallery deck */
        const deck = s.add(iron, { layer: 4, R: 1.5, grad: 0.3, cast: 3 });
        s.rect(deck, 24, 90, 96, 15);
        for (let x = 24; x < 120; x++) { hdP_mod(s, deck, x, 90, 2); hdP_mod(s, deck, x, 91, 1); }
        hdP_drop(s, deck, 5, 0.2);
        /* the lantern room: gold light inside, the lamp at its heart, iron mullions */
        const glass = s.add(hdPal('#c8a840', '#f0d880', '#fff2b0', '#fff8d4', '#ffffff'), { layer: 3, flat: 1, grad: 0.3 });
        s.rect(glass, 45, 45, 54, 45);
        /* the lamp: a white-hot heart in rings of gold (exact pixels: it gives light, it isn't lit) */
        for (let y = 47; y < 66; y++) for (let x = 63; x < 82; x++) { const d = Math.hypot(x + 0.5 - 72.5, y + 0.5 - 56.5); if (d < 8.6) s.px(x, y, d < 2.2 ? '#ffffff' : d < 4.2 ? '#fff6c0' : d < 6.4 ? '#ffe070' : '#f4b830'); }
        for (let x = 64; x < 81; x += 2) s.px(x, 56, '#fff0a0');
        const mul = s.add(iron, { layer: 5, R: 1, grad: 0 });
        s.rect(mul, 45, 45, 3, 45); s.rect(mul, 96, 45, 3, 45); s.rect(mul, 63, 45, 3, 45); s.rect(mul, 81, 45, 3, 45); s.rect(mul, 45, 66, 54, 3);
        /* the railing either side of the lantern */
        const rail = s.add(iron, { layer: 5, R: 1, grad: 0 });
        for (const x0 of [24, 99]) { s.rect(rail, x0, 72, 21, 3); for (let x = x0 + 3; x < x0 + 21; x += 6) s.rect(rail, x, 75, 2, 15); }
        /* the red cap, its dark underside, the finial */
        const cap = s.add(hdPal('#3a0a14', '#6a1622', '#8a2030', '#a02838', '#b83a48'), { layer: 6, R: 10, grad: 0.2, k: 1.3, cast: 3 });
        s.poly(cap, [[66, 14], [78, 14], [114, 41], [30, 41]]);
        s.rect(cap, 30, 39, 84, 3);
        for (let y = 18; y < 42; y += 6) for (let x = 30; x < 115; x++) hdP_mod(s, cap, x, y, -1);
        const und = s.add(hdPal('#1a0408', '#30080e', '#5a1420', '#6a1e2a', '#7a2834'), { layer: 6, R: 1, grad: 0 });
        s.rect(und, 33, 42, 78, 3);
        hdP_drop(s, und, 4, 0.2);
        const fin = s.add(iron, { layer: 7, R: 2.5, grad: 0.3 });
        s.ellipse(fin, 72, 7, 5.5, 5.5); s.rect(fin, 70, 11, 4, 4);
        s.px(70, 5, '#8a8ea8'); s.px(71, 5, '#b8bccc');
        hdP_finish(s);
    },
};
/* the lamp's glow at night, drawn added over the scene: soft rings of light in HD pixel steps (alpha, so its own canvas) */
HD_SPR.lighthouse_glow = {
    w: 120, h: 120, ax: 60, ay: 60,
    draw(s) {
        s.canvas = () => {
            const c = document.createElement('canvas'); c.width = 120; c.height = 120;
            const g = c.getContext('2d'), img = g.createImageData(120, 120), d = img.data;
            for (let y = 0; y < 120; y++) for (let x = 0; x < 120; x++) {
                const r = Math.hypot(x + 0.5 - 60, y + 0.5 - 60) / 60;
                if (r >= 1) continue;
                const a = Math.round(Math.pow(1 - r, 1.8) * 10) / 10, o = (y * 120 + x) * 4;   /* stepped: rings, not a smooth blur */
                d[o] = 255; d[o + 1] = 236 + Math.round((1 - r) * 16); d[o + 2] = 150 + Math.round((1 - r) * 80); d[o + 3] = Math.round(a * 200);
            }
            g.putImageData(img, 0, 0);
            return c;
        };
    },
};

/* ---------------------------------------------------------------- David's statue on the plaza */
/* a marble David waving from his pedestal, curls, sunglasses and golden shoes; the pedestal has a gold band and a gold
   star, on a wide base */
HD_SPR.statue_david = {
    w: 144, h: 300, ax: 72, ay: 291,
    draw(s) {
        const marble = hdPal('#5a5470', '#b4aec4', '#dcd8e4', '#eeecf2', '#fbfaff'), stone = hdPal('#5a5470', '#a8a2b6', '#cfcad8', '#e2dfea', '#f2f0f6');
        const gold = hdPal('#5a3e0e', '#a8781a', '#d9a42a', '#ffd24a', '#fff0a0');
        /* the base and the pedestal: a column with a gold band and a star, a slab on top */
        const base = s.add(hdPal('#4a4460', '#9a94aa', '#b8b2c4', '#ccc6d6', '#dcd8e4'), { layer: 1, R: 2, grad: 0.2 });
        s.rect(base, 0, 264, 144, 27); s.rect(base, 3, 261, 138, 3);
        for (let x = 0; x < 144; x++) { hdP_mod(s, base, x, 264, 1); hdP_mod(s, base, x, 265, 1); }
        for (let y = 268; y < 291; y++) for (let x = 0; x < 144; x++) if ((x + (Math.floor((y - 268) / 12) % 2) * 18) % 36 === 0 || (y - 268) % 12 === 11) hdP_mod(s, base, x, y, -1);
        const col = s.add(stone, { layer: 2, R: 8, grad: 0.08, k: 1.3 });
        s.rect(col, 12, 195, 120, 69);
        for (let x = 12; x < 132; x++) for (let y = 195; y < 201; y++) hdP_mod(s, col, x, y, 1);
        const band = s.add(gold, { layer: 3, R: 1.5, grad: 0.4 });
        s.rect(band, 12, 222, 120, 12);
        for (let x = 24; x < 132; x += 18) for (let y = 227; y < 233; y++) hdP_mod(s, band, x, y, -2);
        /* the star is painted on (a recolor), so the column keeps its shading round it */
        for (let y = 238; y < 263; y++) for (let x = 60; x < 88; x++) {
            const dx = Math.abs(x + 0.5 - 73.5), dy = Math.abs(y + 0.5 - 250.5);
            if (dx * dy * 2 + (dx + dy) * 1.1 < 12.5 || (dx < 1.6 && dy < 12) || (dy < 1.6 && dx < 11)) hdP_rec(s, col, x, y, gold);
        }
        s.px(73, 246, '#fff8c8'); s.px(73, 247, '#fff0a0'); s.px(72, 250, '#fff0a0');
        const slab = s.add(stone, { layer: 4, R: 2, grad: 0.2, cast: 3 });
        s.rect(slab, 3, 177, 138, 18);
        for (let x = 3; x < 141; x++) { hdP_mod(s, slab, x, 178, 1); hdP_mod(s, slab, x, 179, 1); hdP_mod(s, slab, x, 182, -1); }
        hdP_drop(s, slab, 4, 0.2);
        /* golden shoes */
        for (const [x0, l] of [[42, 6], [81, 6]]) {
            const sh = s.add(gold, { layer: l, R: 3, grad: 0.35 });
            s.rect(sh, x0 + 3, 165, 18, 14); s.ellipse(sh, x0 + 12, 172, 12, 7);
            for (let y = 172; y < 180; y++) hdP_mod(s, sh, x0 + 12, y, -1);
            s.px(x0 + 6, 167, '#fff8c8'); s.px(x0 + 7, 167, '#fff0a0');
        }
        /* legs and hips */
        const legL = s.add(marble, { layer: 5, R: 5, grad: 0.1 }), legR = s.add(marble, { layer: 5, R: 5, grad: 0.1 });
        s.line(legL, 61, 124, 58, 163, 8, 8.5); s.line(legR, 85, 124, 89, 163, 7.5, 8.5);
        const hips = s.add(marble, { layer: 6, R: 5, grad: 0.15 });
        s.poly(hips, [[56, 116], [91, 116], [92, 128], [80, 132], [67, 132], [55, 128]]);
        for (let x = 57; x < 90; x++) hdP_mod(s, hips, x, 121, -1);
        /* the torso, the hand on the hip, the arm raised to wave */
        const torso = s.add(marble, { layer: 7, R: 9, grad: 0.15, k: 1.4 });
        s.poly(torso, [[46, 72], [98, 72], [95, 96], [91, 118], [56, 118], [51, 96]]);
        hdP_later(s, () => { for (let y = 84; y < 116; y++) if (s.at(73, y) === torso) s.mod(73, y, -1); for (let x = 58; x < 88; x++) if (s.at(x, 92 + Math.round(Math.abs(x - 73) * 0.25)) === torso) s.mod(x, 92 + Math.round(Math.abs(x - 73) * 0.25), -1); });
        const armR = s.add(marble, { layer: 8, R: 5, grad: 0.1 });
        s.line(armR, 94, 78, 107, 95, 6.5, 6); s.line(armR, 107, 95, 92, 111, 6, 5.5);
        const armL = s.add(marble, { layer: 8, R: 5, grad: 0.1 });
        s.line(armL, 55, 77, 40, 40, 8, 6.5);
        const hand = s.add(marble, { layer: 9, R: 4, grad: 0.2 });
        s.ellipse(hand, 38.5, 33, 7, 8);
        for (let j = 0; j < 3; j++) hdP_mod(s, hand, 34 + j * 3, 27, -1);
        /* the head: curls on top, sunglasses, a smile */
        const neck = s.add(marble, { layer: 8, R: 3, grad: 0.1 });
        s.rect(neck, 65, 64, 15, 12);
        const face = s.add(marble, { layer: 9, R: 8, grad: 0.15 });
        s.ellipse(face, 73.5, 54, 17, 16);
        const hair = s.add(hdPal('#5a5470', '#bab4ca', '#e2dee8', '#f2f0f6', '#ffffff'), { layer: 10, R: 4, grad: 0.3, cast: 2 });
        s.ellipse(hair, 73.5, 39, 20, 12);
        for (let i = 0; i < 11; i++) s.ellipse(hair, 56 + i * 3.5, 45 + (i % 2) * 2, 3, 3);
        for (let i = 0; i < 18; i++) { const cx = 57 + (i % 6) * 6.5 + (Math.floor(i / 6) % 2) * 3, cy = 31 + Math.floor(i / 6) * 5; hdP_mod(s, hair, cx, cy, 1); hdP_mod(s, hair, cx + 1, cy + 1, -1); hdP_mod(s, hair, cx + 2, cy + 1, -1); }
        const shades = s.add(hdPal('#2e2a3e', '#5a5470', '#7c7690', '#9c97ae', '#c8c4d8'), { layer: 11, R: 1.5, grad: 0.3 });
        s.rect(shades, 59, 51, 12, 6); s.rect(shades, 76, 51, 12, 6); s.rect(shades, 70, 52, 7, 2);
        s.px(61, 52, '#e8e8f0'); s.px(62, 52, '#e8e8f0'); s.px(78, 52, '#e8e8f0'); s.px(79, 52, '#e8e8f0');
        for (let i = 0; i < 9; i++) s.px(69 + i, 63 + (i === 0 || i === 8 ? 0 : 1), '#a8a2b6');
        hdP_finish(s);
    },
};

/* ---------------------------------------------------------------- the boat at the pier */
/* a wooden sailboat: planked hull with a white band and teal trim, a plank deck rising to the stern, a white cabin with
   portholes and a life ring, the mast with its red pennant and stays, the sail furled on the boom; foam at the waterline */
function hdP_stern(x) { const t = Math.max(0, Math.min(1, (x - 140) / 145)); return 9 * t * t * (3 - 2 * t); }   /* how far the sheer rises */
HD_SPR.boat_docked = {
    w: 312, h: 288, ax: 0, ay: 258,
    draw(s) {
        /* the hull: wood in courses that follow the sheer, a white band under the deck rim, the teal waterline */
        const hull = s.add(hdPal('#2a1208', '#6a3e26', '#8a5434', '#9a603c', '#b07448'), { layer: 2, R: 3, grad: 0.15 });
        const top = x => 195 - hdP_stern(x);
        const pts = [[15, 207], [21, 195]];
        for (let x = 24; x <= 288; x += 6) pts.push([x, top(x)]);
        pts.push([291, top(291)], [285, 207], [261, 261], [36, 261], [18, 222]);
        s.poly(hull, pts);
        const rim = hdPal('#5a3416', '#b07e50', '#d8a070', '#e4b484', '#eec89a'), dline = hdRamp('#8a5a3c'), white = hdPal('#7a7888', '#c8c6d0', '#f4f2f0', '#fbfaf8', '#ffffff');
        const deck = hdPal('#5a3a20', '#b08458', '#d8b088', '#e4c49e', '#eed4b0'), seam = hdRamp('#5a3220'), teal = hdPal('#123e44', '#2a7c86', '#3aa0aa', '#58b8c0', '#7cd0d6');
        for (let y = 180; y < 262; y++) for (let x = 0; x < 312; x++) {
            const r = y - top(x);                          /* rows below the deck's top edge here */
            if (y >= 252) { hdP_rec(s, hull, x, y, teal); if (y >= 255) hdP_mod(s, hull, x, y, -1); continue; }
            if (r < 12) { hdP_rec(s, hull, x, y, deck); const row = Math.floor(r / 3), joint = (x + row * 9) % 21; if (r % 3 === 2 || joint === 0) hdP_mod(s, hull, x, y, -1); else if (r % 3 === 0) hdP_mod(s, hull, x, y, 1); }
            else if (r < 15) hdP_rec(s, hull, x, y, rim);
            else if (r < 18) hdP_rec(s, hull, x, y, dline);
            else if (r < 27) hdP_rec(s, hull, x, y, white);
            else if (r === 27 || r === 28 || r === 39 || r === 40 || r === 48 || r === 49) hdP_rec(s, hull, x, y, seam);
            else if (r > 40) hdP_mod(s, hull, x, y, -1);
        }
        /* teal trim up the bow and the stern */
        hdP_later(s, () => { for (let y = 210; y < 252; y++) for (let x = 0; x < 312; x++) if (s.at(x, y) === hull && (s.at(x - 4, y) < 0 || s.at(x + 4, y) < 0)) s.recolor(x, y, teal); });
        /* the cabin: white, a raised aft part, portholes, a life ring */
        const cab = s.add(hdPal('#6a6a7a', '#c8ccd8', '#e6e8ee', '#f4f5f8', '#ffffff'), { layer: 4, R: 2, grad: 0.25, cast: 2 });
        s.rect(cab, 102, 171, 99, 25); s.rect(cab, 159, 165, 39, 6);
        for (let x = 102; x < 201; x++) { hdP_mod(s, cab, x, 171, 1); hdP_mod(s, cab, x, 172, 1); }
        for (let x = 159; x < 198; x++) { hdP_mod(s, cab, x, 165, 1); hdP_mod(s, cab, x, 166, 1); }
        for (const px of [118.5, 142.5, 166.5]) {
            const ph = s.add(hdPal('#4a4c5a', '#8a8ea8', '#b8bccc', '#d8dae4', '#f4f4fa'), { layer: 5, R: 1.5, grad: 0.3 }), pg = s.add(hdPal('#1e2e44', '#3a5a7a', '#6a90b8', '#8ab0d4', '#c8e0f4'), { layer: 6, flat: 1, grad: 0.4 });
            s.ellipse(ph, px, 184, 4.6, 4.6); s.ellipse(pg, px, 184, 2.8, 2.8);
            s.px(px - 1.5, 182.5, '#ffffff');
        }
        const ring = s.add(hdPal('#7a2a08', '#d85a1a', '#ff7a3a', '#ff9a5e', '#ffc090'), { layer: 5, R: 2, grad: 0.3 });
        s.ellipse(ring, 184.5, 180, 6, 6);
        hdP_later(s, () => { for (let y = 175; y < 186; y++) for (let x = 179; x < 191; x++) { const d = Math.hypot(x + 0.5 - 184.5, y + 0.5 - 180); if (d < 2.6 && s.at(x, y) === ring) s.part[y * s.w + x] = cab; else if (s.at(x, y) === ring && (Math.abs(x + 0.5 - 184.5) < 1.2 || Math.abs(y + 0.5 - 180) < 1.2)) s.recolor(x, y, hdRamp('#ffffff')); } });
        /* the mast, the pennant, the stays */
        const mast = s.add(hdPal('#24142a', '#5a3a28', '#8a6040', '#9e7452', '#b28864'), { layer: 5, R: 2, grad: 0.05 });
        s.rect(mast, 131, 9, 7, 162); s.ellipse(mast, 134.5, 9, 4.5, 3);
        const flag = s.add(hdPal('#4a0c18', '#a82038', '#d8304a', '#e84a60', '#f87080'), { layer: 4, R: 1.5, grad: 0.2 });
        const fp = [];
        for (let i = 0; i <= 10; i++) fp.push([138 + i * 3, 11 + Math.sin(i * 0.8) * 1.6 + i * 0.25]);
        for (let i = 10; i >= 0; i--) fp.push([138 + i * 3, 11 + Math.sin(i * 0.8) * 1.6 + 12 - i * 0.6 + (i === 10 ? -2 : 0)]);
        s.poly(flag, fp);
        hdP_later(s, () => { for (let i = 0; i < 9; i++) { const x = 160 + (i % 3), y = 15 + Math.floor(i / 3); if (s.at(x, y) === flag && i % 2) s.erase(x, y); } });
        /* two pixels wide, a darker strand under a light one, so the stays read against sky and water */
        const rope = (x0, y0, x1, y1) => { const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))); for (let i = 0; i <= n; i++) { const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n); if (s.at(x, y) < 0 || s.at(x, y) === hull) s.px(x, y, i % 9 === 0 ? '#c8bca4' : '#e8e0d0'); if (s.at(x, y + 1) < 0 || s.at(x, y + 1) === hull) s.px(x, y + 1, '#a89a84'); } };
        rope(130, 14, 1, 222); rope(139, 14, 291, 188);
        /* the furled sail on its boom, tied in red */
        const boom = s.add(hdPal('#24142a', '#4a2e20', '#6a4430', '#7e5640', '#926850'), { layer: 6, R: 1.5, grad: 0.2 });
        s.poly(boom, [[33, 153], [134, 150], [134, 156], [33, 159]]);
        const sail = s.add(hdPal('#8a7e6a', '#d8ccb4', '#f6eedc', '#fffaf0', '#ffffff'), { layer: 7, R: 4, grad: 0.3, cast: 2 });
        s.poly(sail, [[42, 140], [131, 137], [134, 150], [36, 154], [36, 146]]);
        s.ellipse(sail, 42, 147, 6, 7);
        const tie = hdPal('#5a0c18', '#a82038', '#c8304a', '#d84a60', '#e86a7a');
        for (const tx of [42, 63, 84, 105, 126]) for (let y = 135; y < 156; y++) { hdP_rec(s, sail, tx, y, tie); hdP_rec(s, sail, tx + 1, y, tie); }
        for (let x = 40; x < 132; x += 5) hdP_mod(s, sail, x, 144 - (x - 40) * 0.033, -1);
        /* foam where the hull meets the water */
        for (let x = 36; x < 262; x++) { const k = (x * 7) % 12; if (k < 7) s.px(x, 263 + ((x >> 3) % 2), k < 2 ? '#ffffff' : '#d8f0fa'); }
        hdP_finish(s);
    },
};

/* ---------------------------------------------------------------- the well */
/* a stone well: a tiled roof on two posts, the windlass with its rope and bucket, dark water inside, courses of stone */
HD_SPR.well = {
    w: 72, h: 102, ax: 36, ay: 96,
    draw(s) {
        const wood = hdPal('#2e1a0e', '#5a3820', '#8a5a2b', '#a06e3c', '#b4824e'), stone = hdPal('#3e3c4a', '#7e7c8c', '#9a98a6', '#b0aebc', '#c8c6d2');
        /* the posts and the windlass, the rope and the bucket */
        const post = s.add(wood, { layer: 2, R: 1.5, grad: 0.1 });
        s.rect(post, 12, 22, 6, 42); s.rect(post, 54, 22, 6, 42);
        const shade = s.add(hdPal('#120c14', '#1e1622', '#2d2230', '#3a2e3e', '#4a3c4e'), { layer: 1, flat: 1, grad: 0 });
        s.rect(shade, 18, 24, 36, 9);
        const axle = s.add(hdPal('#24142a', '#4a3020', '#6b4a2e', '#80603e', '#94724c'), { layer: 3, R: 2, grad: 0.2 });
        s.rect(axle, 18, 29, 36, 5);
        const rp = s.add(hdPal('#6a6e80', '#a8b0c4', '#c8d0e0', '#dce2ee', '#f0f4fa'), { layer: 4, R: 1 });
        s.rect(rp, 36, 29, 2, 16);
        for (let i = 0; i < 4; i++) hdP_mod(s, rp, 36, 31 + i * 4, -1);
        const bucket = s.add(hdPal('#3a2a1c', '#6a5038', '#8a6a4a', '#a0805e', '#b49472'), { layer: 4, R: 2, grad: 0.25 });
        s.poly(bucket, [[30, 45], [44, 45], [42, 56], [32, 56]]);
        for (let x = 30; x < 44; x++) { hdP_mod(s, bucket, x, 48, -1); hdP_mod(s, bucket, x, 53, -1); }
        s.rect(rp, 31, 42, 12, 1);
        /* the roof: two tones of tiles, wider at the eaves */
        const roof = s.add(hdPal('#4a1a10', '#8a3a26', '#b8553a', '#c86c4c', '#d88462'), { layer: 5, R: 2, grad: 0.25, cast: 3 });
        s.poly(roof, [[24, 0], [48, 0], [69, 21], [69, 24], [3, 24], [3, 21]]);
        hdP_shingles(s, roof, 0, 1, 71, 23, 6, 8, 141, { round: 1 });
        for (let y = 0; y < 24; y++) if (Math.floor(y / 6) % 2) for (let x = 0; x < 72; x++) hdP_rec(s, roof, x, y, hdPal('#40160e', '#7c3422', '#9a3a2e', '#ac4c3c', '#be6050'));
        hdP_drop(s, roof, 3, 0.2);
        /* the stone ring: the far rim, the dark water, the near wall in courses */
        const rim = s.add(stone, { layer: 6, R: 2, grad: 0.3 });
        s.ellipse(rim, 36, 57, 30, 7);
        const water = s.add(hdPal('#0e1424', '#1c2438', '#2f3a56', '#46587a', '#6a80a4'), { layer: 7, flat: 1, grad: -0.3 });
        s.ellipse(water, 36, 57, 24, 4.5);
        s.px(26, 56, '#6a80a4'); s.px(27, 56, '#8aa0c4'); s.px(44, 58, '#46587a');
        const wall = s.add(stone, { layer: 8, R: 4, grad: 0.15, k: 1.4 });
        s.rect(wall, 6, 63, 60, 33);
        s.ellipse(wall, 36, 92, 30, 4.5);
        for (let y = 63; y < 97; y++) for (let x = 6; x < 66; x++) {
            const row = Math.floor((y - 63) / 9), ry = (y - 63) % 9, rx = (x - 6 + (row % 2) * 9) % 18;
            if (ry === 8 || rx === 17) hdP_mod(s, wall, x, y, -1); else if (ry === 0 && hdP_hash(Math.floor((x - 6 + (row % 2) * 9) / 18), row, 142) > 0.4) hdP_mod(s, wall, x, y, 1);
        }
        for (let x = 6; x < 66; x++) hdP_mod(s, wall, x, 63, 1);
        /* the crank handle on the right */
        const crank = s.add(hdP_IRON, { layer: 9, R: 1 });
        s.rect(crank, 60, 30, 9, 3); s.rect(crank, 66, 30, 3, 12); s.rect(crank, 66, 40, 6, 3);
        hdP_finish(s);
    },
};
