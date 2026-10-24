/* ---- 32n_hd_npc_b.js ---- */
/* HD neighbors (the food folks), part two: Clementine, Cuke, Sully, Ginger, Brulee, Mac and Fortune. Each is traced
   from today's 16px sprite at three times the size (an old pixel x, y of a sprite h tall covers 3x..3x+2,
   72-3h+3y..+2), so silhouettes and faces land where they always were. Drawn facing the front into 48x72, standing on
   rows 69 to 71 (anchor 24,69); f.squash is the hop frame, f.blink the eyes shut. */

/* shared bits of the faces: the old sprites' 2x2 eyes with a white glint become 4x6 eyes with a 2px glint */
const hdB_kit = {
    ink: '#231418',
    /* an eye whose top-left pixel is x, y (4 wide, h tall, 6 if not given); glint on the side gx (-1 left, 1 right) */
    eye(s, x, y, gx, h, ink) {
        ink = ink || hdB_kit.ink; h = h || 6;
        for (let j = 0; j < h; j++) for (let i = 0; i < 4; i++) if (!((j === 0 || j === h - 1) && (i === 0 || i === 3))) s.px(x + i, y + j, ink);
        s.px(x + 1, y + h - 1, '#4a2c2a'); s.px(x + 2, y + h - 1, '#4a2c2a');
        const g = gx < 0 ? x : x + 2;
        s.px(g, y + 1, '#ffffff'); s.px(g + 1, y + 1, '#ffffff'); s.px(g + (gx < 0 ? 0 : 1), y + 2, '#ffffff');
    },
    /* eyes shut: a soft downward curve as wide as the eye */
    shut(s, x, y, ink) {
        ink = ink || hdB_kit.ink;
        s.px(x - 1, y + 2, ink); s.px(x, y + 3, ink); s.px(x + 1, y + 3, ink); s.px(x + 2, y + 3, ink); s.px(x + 3, y + 3, ink); s.px(x + 4, y + 2, ink);
    },
    /* a blush: a small soft oval, the middle a touch stronger */
    blush(s, x, y, c, c2) {
        for (let i = 1; i < 5; i++) s.px(x + i, y, c2);
        for (let i = 0; i < 6; i++) s.px(x + i, y + 1, i === 0 || i === 5 ? c2 : c);
    },
    /* a pointed leaf from (x0, y0) to (x1, y1), w wide at the middle */
    leaf(s, id, x0, y0, x1, y1, w) {
        const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l, a = [], b = [];
        for (let i = 0; i <= 8; i++) { const t = i / 8, h = Math.sin(Math.PI * t) * w / 2; a.push([x0 + dx * t + nx * h, y0 + dy * t + ny * h]); b.unshift([x0 + dx * t - nx * h, y0 + dy * t - ny * h]); }
        s.poly(id, a.concat(b));
    },
    /* parts drawn and shaded on their own sprite, then laid on s as exact pixels: things lying flat on a body (shades,
       a strap) that would otherwise cut the body's rounded form in two; sh: they shade the row just below them */
    over(s, build, sh) {
        const o = new HDSprite(s.w, s.h), dy = s.dy; o.dy = dy; build(o); const b = o.render(); s.dy = 0;
        for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
            const i = (y * s.w + x) * 4; if (!b[i + 3]) continue;
            s.px(x, y, [b[i], b[i + 1], b[i + 2]]); if (sh && y + 1 < s.h && !b[i + s.w * 4 + 3]) s.mod(x, y + 1, -sh);
        }
        s.dy = dy;
    },
    /* smooth light on a big part (made with flat: 1): the shade of each pixel from the normal of a rounded box from x0, y0
       to x1, y1 whose sides round over rx and ry (rx = half the width, ry = half the height: an ellipsoid; rx = half
       the width, small ry: a cylinder). Big parts shaded from their outline alone get streaky. o: k deepens (> 1) or
       flattens the form, lift moves the shade bands, z squeezes the depth */
    form(s, id, x0, y0, x1, y1, rx, ry, o) {
        o = o || {}; const k = o.k || 1, lift = o.lift || 0, z = o.z || 1;
        x0 += s.dx; x1 += s.dx; y0 += s.dy; y1 += s.dy;
        const ix0 = x0 + rx, ix1 = x1 - rx, iy0 = y0 + ry, iy1 = y1 - ry;
        for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(s.h - 1, Math.ceil(y1)); y++) for (let x = Math.max(0, Math.floor(x0)); x <= Math.min(s.w - 1, Math.ceil(x1)); x++) {
            const i = y * s.w + x; if (s.part[i] !== id) continue;
            const px = x + 0.5, py = y + 0.5;
            let u = px < ix0 ? (px - ix0) / rx : px > ix1 ? (px - ix1) / rx : 0, v = py < iy0 ? (py - iy0) / ry : py > iy1 ? (py - iy1) / ry : 0;
            const d = u * u + v * v; if (d > 1) { u /= Math.sqrt(d); v /= Math.sqrt(d); }
            const nz = Math.sqrt(Math.max(0, 1 - u * u - v * v)) / z, l = Math.hypot(u * k, v * k, nz);
            const c = (u * k * HD_LIGHT[0] + v * k * HD_LIGHT[1] + nz * HD_LIGHT[2]) / l + lift;
            s.mods[i] += (c < 0.42 ? 1 : c < 0.72 ? 2 : c < 0.9 ? 3 : 4) - 2;
        }
    },
    /* the light of an ellipsoid on a round part */
    ball(s, id, cx, cy, rx, ry, o) { hdB_kit.form(s, id, cx - rx, cy - ry, cx + rx, cy + ry, rx, ry, o); },
    /* fill a box from x0, y0 to x1, y1 with corners rounded over rx, ry */
    rr(s, id, x0, y0, x1, y1, rx, ry) {
        const ix0 = x0 + rx, ix1 = x1 - rx, iy0 = y0 + ry, iy1 = y1 - ry;
        for (let y = Math.floor(y0); y < Math.ceil(y1); y++) for (let x = Math.floor(x0); x < Math.ceil(x1); x++) {
            const px = x + 0.5, py = y + 0.5, u = px < ix0 ? (px - ix0) / rx : px > ix1 ? (px - ix1) / rx : 0, v = py < iy0 ? (py - iy0) / ry : py > iy1 ? (py - iy1) / ry : 0;
            if (px > x0 && px < x1 && py > y0 && py < y1 && u * u + v * v <= 1) s.plot(id, x, y);
        }
    },
    /* a fixed scatter of points (texture without Math.random) */
    dots(n, seed, x0, y0, w, h) { const r = []; let v = seed; for (let i = 0; i < n; i++) { v = (v * 16807) % 2147483647; const x = x0 + v % w; v = (v * 16807) % 2147483647; r.push([x, y0 + v % h]); } return r; },
};

/* ---- Clementine: a round little orange in big dark sunglasses, a leafy stem on top */
HD_NPC.clementine = {
    hat: [24, 31, 32], eye: [24, 49, 12], squashDy: 3,
    draw(s, f) {
        const by = f.squash ? 3 : 0;
        const peel = hdPal('#9a4508', '#dc7416', '#f7962d', '#fbab45', '#fdc068');
        const leafC = hdPal('#2a6a2e', '#46a04a', '#62b85a', '#7ccb6c', '#a6e28e');
        const shade = hdPal('#110b16', '#1a1322', '#241b2e', '#3a2d4a', '#5c4c7a');
        const feet = s.add(hdPal('#1f1518', '#2e2124', '#3a2a2e', '#4f3a3f', '#66505a'), { layer: 0, R: 2 });
        const body = s.add(peel, { layer: 1, flat: 1, grad: 0 });
        const stem = s.add(hdPal('#2a4a1e', '#3d6a2a', '#4f7f34', '#6a9a45', '#86b45c'), { layer: 2, R: 1.5 });
        const lf = s.add(leafC, { layer: 3, R: 2, grad: 0.3 });
        const lf2 = s.add(leafC, { layer: 2, R: 2, grad: 0.3, bias: -0.08 });
        s.ellipse(feet, 17.5, 70, 3.4, 2); s.ellipse(feet, 30.5, 70, 3.4, 2);
        s.ellipse(body, 24, 49.5 + by / 2, 23.7, 19.5 - by / 2);
        hdB_kit.ball(s, body, 24, 49.5 + by / 2, 23.7, 19.5 - by / 2, { lift: 0.05 });
        s.dy = by;
        s.line(stem, 24, 32.5, 24.6, 28, 1.4, 1.1);
        hdB_kit.leaf(s, lf2, 23.5, 29.2, 17, 25, 4.8);
        hdB_kit.leaf(s, lf, 24.5, 28.8, 31.2, 24, 5.6);
        // the dimple the stem sits in, and the peel's pores (pits with a lit lip above them)
        for (const x of [20, 21, 27, 28]) s.mod(x, 31, -1);
        for (const [x, y] of hdB_kit.dots(22, 7, 3, 32, 42, 34)) { const u = (x + 0.5 - 24) / 22.5, v = (y + 0.5 - 49.5) / 18; if (u * u + v * v < 0.8 && !(y > 43 && y < 59 && x > 4 && x < 43)) s.mod(x, y, -1); }
        for (const [x, y] of [[13, 36], [34, 36], [13, 61], [34, 61]]) { s.mod(x, y, -1); s.mod(x + 1, y, -1); s.mod(x, y - 1, 1); }
        // the shades: two lenses on a heavy brow bar, arms running back round the sides
        const lens = [[6, 45], [18.5, 45], [18.5, 50.5], [16.5, 54], [10, 54], [7, 51.5]];
        hdB_kit.over(s, o => {
            const glass = o.add(shade, { R: 2.2, k: 1.4, grad: 0.3 });
            o.poly(glass, lens); o.poly(glass, lens.map(([x, y]) => [48 - x, y]));
            o.rect(glass, 18, 45, 12, 3); o.rect(glass, 2, 45, 5, 2); o.rect(glass, 41, 45, 5, 2);
        }, 1);
        // the glint on each lens
        for (const ox of [0, 24]) {
            for (const [x, y] of [[9, 50], [10, 49], [11, 48], [12, 47]]) { s.px(x + ox, y, '#6b5a8f'); s.px(x + ox + 1, y, '#6b5a8f'); }
            s.px(11 + ox, 48, '#a596c8'); s.px(12 + ox, 47, '#a596c8'); s.px(14 + ox, 50, '#6b5a8f'); s.px(15 + ox, 49, '#6b5a8f');
        }
        hdB_kit.blush(s, 8, 55, '#ff8a70', '#fb9a5c'); hdB_kit.blush(s, 34, 55, '#ff8a70', '#fb9a5c');
        // a small, knowing smile
        for (let x = 21; x <= 26; x++) s.px(x, 55, '#7a2810');
        for (const x of [21, 22, 25, 26]) s.px(x, 56, x === 21 || x === 26 ? '#c05a1a' : '#7a2810'); s.px(23, 56, '#d0524a'); s.px(24, 56, '#d0524a'); s.px(23, 57, '#7a2810'); s.px(24, 57, '#7a2810');
        s.dy = 0;
    },
};

/* ---- Cuke: a tall cucumber in a red sweatband and white sneakers, up since 4 AM and thrilled about it */
HD_NPC.cuke = {
    hat: [24, 12, 26], eye: [24, 32, 6], squashDy: 3,
    draw(s, f) {
        const by = f.squash ? 3 : 0, wd = f.squash ? 1 : 0;
        const skin = hdPal('#1f4a22', '#3a7d31', '#4f9a3f', '#66b04f', '#8cc96c');
        const band = hdPal('#7a1a2a', '#c43446', '#e84a5a', '#f2626e', '#fa8a92');
        const shoe = s.add(hdPal('#8a8f99', '#d4d8de', '#f2f4f6', '#ffffff', '#ffffff'), { layer: 0, flat: 1, grad: 0.5 });
        const sole = s.add(hdPal('#6a6f78', '#9aa0aa', '#b8bec6', '#cfd4da', '#e4e7eb'), { layer: 1, flat: 1, grad: 0 });
        const body = s.add(skin, { layer: 2, flat: 1, grad: 0 });
        const hb = s.add(band, { layer: 3, flat: 1, grad: 0 });
        // sneakers, a little apart under the round bottom
        for (const sx of [13.5, 34.5]) {
            s.poly(shoe, [[sx - 3, 65.5], [sx + 3, 65.5], [sx + 4.5, 67.5], [sx + 6, 69.5], [sx + 6, 71], [sx - 6, 71], [sx - 6, 69.5], [sx - 4.5, 67.5]]);
            s.rect(sole, sx - 6, 71, 12, 1);
        }
        const x0 = 9 - wd, x1 = 39 + wd, y0 = 12 + by, y1 = 66;
        hdB_kit.rr(s, body, x0, y0, x1, y1, 8, 8.5);
        hdB_kit.form(s, body, x0, y0, x1, y1, 15 + wd, 8.5, { lift: 0.04 });
        s.dy = by;
        // the sweatband wraps round, dipping a pixel in front
        s.poly(hb, [[x0 - 1, 21], [24, 22], [x1 + 1, 21], [x1 + 1, 26.5], [24, 27.5], [x0 - 1, 26.5]]);
        hdB_kit.form(s, hb, x0 - 1, 21, x1 + 1, 27.5, 16 + wd, 3, { lift: 0.04 });
        s.dy = 0;
        // the cucumber's skin: faint paler stripes down its length, and little bumps lit from the top left
        for (let y = 30 + by; y < 62; y++) { if (y % 7 < 4) s.mod(14, y, 1); if ((y + 3) % 7 < 4) s.mod(33, y, 1); }
        for (const [x, y] of [[13, 18], [22, 16], [31, 18], [12, 38], [35, 37], [13, 47], [23, 49], [34, 46], [17, 55], [29, 54], [12, 58], [35, 58], [21, 61], [27, 30]]) {
            const yy = y < 30 ? y + by : y; s.mod(x, yy, 1); s.mod(x + 1, yy + 1, -1);
        }
        s.dy = by;
        // a big open grin and bright eyes
        if (f.blink) { hdB_kit.shut(s, 16, 30); hdB_kit.shut(s, 28, 30); }
        else { hdB_kit.eye(s, 16, 30, -1); hdB_kit.eye(s, 28, 30, 1); }
        const m = '#1d2e19';
        for (let x = 18; x <= 29; x++) s.px(x, 39, m);
        for (let x = 19; x <= 28; x++) s.px(x, 40, m);
        for (let x = 20; x <= 27; x++) s.px(x, 41, x > 21 && x < 26 ? '#c84854' : m);
        for (let x = 21; x <= 26; x++) s.px(x, 42, x > 21 && x < 26 ? '#e2646e' : m);
        for (let x = 22; x <= 25; x++) s.px(x, 43, m);
        s.px(16, 38, '#8fd08a'); s.px(17, 39, '#8fd08a'); s.px(31, 38, '#8fd08a'); s.px(30, 39, '#8fd08a');
        s.dy = 0;
        // laces and a red stripe on each sneaker, to match the sweatband
        for (const sx of [13.5, 34.5]) {
            s.px(sx - 1, 66, '#c8ccd2'); s.px(sx, 66, '#c8ccd2'); s.px(sx - 1, 67, '#b0b6be'); s.px(sx, 67, '#b0b6be');
            for (let i = -4; i <= 3; i++) s.px(sx + i, 69, i < -2 || i > 1 ? '#c43446' : '#e84a5a');
        }
    },
};

/* ---- Sully: a slice of Boston cream pie in a tweed flat cap: chocolate glaze dripping over the sponge, a band of
   cream, heavy brows */
HD_NPC.sully = {
    hat: [22, 18, 30], eye: [24, 47, 12], squashDy: 3,
    draw(s, f) {
        const by = f.squash ? 3 : 0, bc = f.squash ? 2 : 0;
        const sponge = hdPal('#8a5a24', '#ddae52', '#f2c86a', '#f7d686', '#fbe4a6');
        const choc = hdPal('#1e0e08', '#361a0e', '#4a2718', '#653824', '#8a5438');
        const cream = hdPal('#a08850', '#efd28a', '#fdecb2', '#fff2c4', '#fff6d6');
        const tweed = hdPal('#3a362f', '#6b665c', '#8f887a', '#a7a092', '#bfb9ab');
        const feet = s.add(hdPal('#1f1518', '#2e2124', '#3a2a2e', '#4f3a3f', '#66505a'), { layer: 0, R: 2 });
        const cake = s.add(sponge, { layer: 1, flat: 1, grad: 0 });
        const fill = s.add(cream, { layer: 2, flat: 1, grad: 0 });
        const glaze = s.add(choc, { layer: 3, flat: 1, grad: 0, cast: 1 });
        const cap = s.add(tweed, { layer: 4, flat: 1, grad: 0 });
        const brim = s.add(tweed, { layer: 5, flat: 1, grad: 0, cast: 1 });
        s.ellipse(feet, 14.5, 70, 3.3, 2); s.ellipse(feet, 33.5, 70, 3.3, 2);
        const top = 30 + by;
        hdB_kit.rr(s, cake, 0, top, 48, 69, 6, 5);
        hdB_kit.form(s, cake, 0, top, 48, 69, 8, 6);
        // the cream: smooth, glossy along its top, a wavy lower edge where it was spread
        hdB_kit.rr(s, fill, 0, 54 + bc, 48, 60 + bc, 1, 1);
        for (const x of [4, 5, 6, 13, 14, 22, 23, 24, 31, 32, 40, 41, 42]) s.plot(fill, x, 60 + bc);
        hdB_kit.form(s, fill, 0, 54 + bc, 48, 61 + bc, 8, 3, { lift: -0.1 });
        for (const x of [9, 18, 27, 36, 44]) { s.mod(x, 58 + bc, -1); s.mod(x, 59 + bc, -1); }
        // air holes in the sponge
        for (const [x, y] of [[4, 64], [9, 62], [17, 65], [26, 63], [34, 66], [40, 63], [44, 65], [21, 67], [3, 50], [44, 48], [41, 52], [6, 44]]) s.mod(x, y > 55 ? y : y + by, -1);
        s.dy = by;
        // the glaze: a rounded top and drips hanging over the sponge
        hdB_kit.rr(s, glaze, 0, 30, 48, 37, 6, 5);
        for (const [x, l, r] of [[4, 38.5, 1.4], [12, 39.5, 2.6], [14, 41.2, 1.3], [27, 39.5, 3], [29.5, 41.5, 1.3], [38.5, 39, 2.2], [45, 38.3, 1.4]]) s.line(glaze, x, 35, x, l, r);
        hdB_kit.form(s, glaze, 0, 30, 48, 42, 8, 5, { lift: 0.04 });
        for (const [x, y] of [[8, 32], [9, 32], [10, 32], [11, 32], [7, 33], [8, 33], [12, 40], [28, 39], [38, 38]]) s.mod(x, y, 2);
        // the flat cap: a soft crown with a button, the peak cocked to one side; tweed flecks and panel seams
        s.poly(cap, [[11, 19], [20, 17.5], [28, 18], [34, 20], [38, 23], [39.5, 27.5], [6, 28], [6.5, 24]]);
        s.ellipse(cap, 22, 18.4, 1.6, 1.3);
        hdB_kit.form(s, cap, 6, 17, 40, 29, 17, 8, { lift: 0.06 });
        s.poly(brim, [[6, 27], [30, 26.5], [38, 26], [43, 26.6], [46, 28], [45.5, 30], [41, 30.6], [6, 30.6]]);
        hdB_kit.form(s, brim, 6, 26, 47, 31, 20, 2.6, { lift: -0.06 });
        for (let x = 30; x < 45; x++) s.mod(x, 27, 1);
        // panel seams from the button, and a herringbone weave
        for (let i = 1; i < 9; i++) { s.mod(21 - i * 1.1, 18.5 + i, -1); s.mod(23 + i * 1.1, 18.5 + i, -1); }
        for (let y = 20; y < 27; y += 2) for (let x = 8; x < 38; x++) if ((x + (Math.floor(x / 3) % 2 ? y : -y)) % 3 === 0 && (x * 7 + y) % 5 < 2) s.mod(x, y, -1);
        // the face: heavy flat brows, wide-set eyes, a lopsided smile
        const br = '#3a2418';
        for (let x = 9; x <= 17; x++) { s.px(x, 42, br); s.px(48 - 1 - x, 42, br); if (x > 9) { s.px(x, 43, br); s.px(47 - x, 43, br); } }
        if (f.blink) { hdB_kit.shut(s, 10, 45); hdB_kit.shut(s, 34, 45); }
        else { hdB_kit.eye(s, 10, 45, -1); hdB_kit.eye(s, 34, 45, 1); }
        hdB_kit.blush(s, 5, 51, '#ff9aa8', '#f8b088'); hdB_kit.blush(s, 37, 51, '#ff9aa8', '#f8b088');
        const m = '#7a2f2a';
        for (const [x, y] of [[21, 51], [22, 52], [23, 52], [24, 52], [25, 52], [26, 51], [27, 50]]) s.px(x, y, m);
        s.dy = 0;
    },
};

/* ---- Ginger: a gingerbread builder in a yellow hard hat: icing at the wrists and feet, candy buttons */
HD_NPC.ginger = {
    hat: [24, 18, 32], eye: [24, 38, 6], squashDy: 3,
    draw(s, f) {
        const by = f.squash ? 3 : 0, ba = f.squash ? 2 : 0, wd = f.squash ? 0.6 : 0;
        const dough = hdPal('#5a2e14', '#a35f2a', '#c0773a', '#d08b4c', '#dea062');
        const cookie = s.add(dough, { layer: 1, R: 4, grad: 0.12, k: 1.3 });
        const hat = s.add(hdPal('#7a4a0c', '#e0a520', '#ffcf3a', '#ffde6a', '#fff0a8'), { layer: 3, flat: 1, grad: 0 });
        const brim = s.add(hdPal('#6a3e08', '#c48a14', '#e0a520', '#f0b832', '#ffd458'), { layer: 4, flat: 1, grad: 0, cast: 2 });
        const red = s.add(hdPal('#7a1020', '#c02a40', '#e0405a', '#f0687c', '#ff9aaa'), { layer: 2, R: 1.6, grad: 0.3 });
        const green = s.add(hdPal('#1f5a1a', '#3f8f34', '#5aad4a', '#78c464', '#a2de86'), { layer: 2, R: 1.6, grad: 0.3 });
        // the cookie: legs, body, arms out to the sides, a round head
        s.line(cookie, 19.5, 60, 15.6, 67.6, 4.4, 4.4); s.line(cookie, 28.5, 60, 32.4, 67.6, 4.4, 4.4);
        s.poly(cookie, [[12 - wd, 48 + ba], [36 + wd, 48 + ba], [33.5, 63], [14.5, 63]]);
        s.line(cookie, 4.2 - wd, 53.6 + ba, 43.8 + wd, 53.6 + ba, 4.1);
        hdB_kit.rr(s, cookie, 6 - wd, 28 + by, 42 + wd, 49 + by, 9, 8);
        // the hard hat: a dome with a raised rib down the middle, on a wide brim
        s.dy = by;
        s.poly(hat, [[14, 18], [34, 18], [38, 19.5], [41.5, 22], [44, 25], [45.5, 28], [46, 31], [2, 31], [2.5, 28], [4, 25], [6.5, 22], [10, 19.5]]);
        hdB_kit.form(s, hat, 2, 17, 46, 33, 22, 13, { lift: 0.03 });
        for (let y = 18; y < 30; y++) { s.mod(22, y, 1); s.mod(23, y, 1); s.mod(25, y, -1); }
        hdB_kit.rr(s, brim, -0.5, 29.6, 48.5, 33.2, 2, 1.6);
        hdB_kit.form(s, brim, -0.5, 29.6, 48.5, 33.2, 24, 1.8, { lift: 0.08 });
        s.dy = 0;
        // candy buttons
        s.ellipse(red, 24, 52.5 + ba, 2.2, 2); s.ellipse(green, 24, 58.5 + ba / 2, 2.2, 2);
        // icing: squiggles at the wrists and across the feet
        for (const x0 of [10, 37]) for (let j = 0; j < 7; j++) s.px(x0 + [0, -1, 0, 1, 0, -1, 0][j], 50.5 + ba + j, '#fff8f0');
        for (const x0 of [12, 30]) for (let i = 0; i < 7; i++) s.px(x0 + i, 67 + (i % 2), '#fff8f0');
        s.dy = by;
        if (f.blink) { hdB_kit.shut(s, 16, 36); hdB_kit.shut(s, 28, 36); }
        else { hdB_kit.eye(s, 16, 36, -1); hdB_kit.eye(s, 28, 36, 1); }
        hdB_kit.blush(s, 11, 42, '#e89a8a', '#d89070'); hdB_kit.blush(s, 31, 42, '#e89a8a', '#d89070');
        // a piped icing smile
        for (const [x, y] of [[19, 44], [20, 45], [21, 46], [22, 46], [23, 46], [24, 46], [25, 46], [26, 46], [27, 45], [28, 44], [21, 45], [26, 45]]) s.px(x, y, '#fff8f0');
        s.dy = 0;
    },
};

/* ---- Brulee: a creme brulee in a fluted ramekin and a burgundy beret: a torched, glassy sugar top */
HD_NPC.brulee = {
    hat: [23, 24, 30], eye: [24, 47, 12], squashDy: 3,
    draw(s, f) {
        const by = f.squash ? 3 : 0, br = f.squash ? 2.5 : 0;
        const custard = hdPal('#9a7a48', '#ecd398', '#fbe9b8', '#fdf0cc', '#fff8e4');
        const crust = hdPal('#5a2e0e', '#a05e1a', '#c47c2a', '#d8943c', '#ecb460');
        const dish = hdPal('#8f8a84', '#dcd7cf', '#f0ede6', '#fbf9f4', '#ffffff');
        const beretC = hdPal('#4a1426', '#6e2238', '#8a2f4a', '#a6405e', '#c25a7a');
        const feet = s.add(hdPal('#1f1518', '#2e2124', '#3a2a2e', '#4f3a3f', '#66505a'), { layer: 0, R: 2 });
        const cus = s.add(custard, { layer: 1, flat: 1, grad: 0 });
        const ram = s.add(dish, { layer: 2, flat: 1, grad: 0 });
        const rim = s.add(dish, { layer: 3, flat: 1, grad: 0 });
        const top = s.add(crust, { layer: 3, flat: 1, grad: 0, cast: 1 });
        const beret = s.add(beretC, { layer: 4, flat: 1, grad: 0, cast: 1 });
        s.ellipse(feet, 14.5, 70, 3.3, 2); s.ellipse(feet, 33.5, 70, 3.3, 2);
        hdB_kit.rr(s, cus, 0, 33 + by, 48, 57, 6, 4);
        hdB_kit.form(s, cus, 0, 33 + by, 48, 57, 8, 5);
        // the ramekin: a fluted dish narrowing a little to its foot, a rounded lip at the top
        s.poly(ram, [[0, 55 + br], [48, 55 + br], [48, 62 + br / 2], [45, 65.5], [42, 68.6], [6, 68.6], [3, 65.5], [0, 62 + br / 2]]);
        hdB_kit.form(s, ram, 0, 50 + br, 48, 69, 24, 14 - br, { lift: 0.08 });
        hdB_kit.rr(s, rim, 0, 53.4 + br, 48, 57 + br, 1.5, 1.5);
        hdB_kit.form(s, rim, 0, 53.4 + br, 48, 57 + br, 24, 1.8, { lift: 0.1 });
        for (const x of [6, 15, 24, 33, 42]) for (let y = 58 + Math.ceil(br); y < 67; y++) { s.mod(x - 1, y, -1); s.mod(x, y, -1); s.mod(x + 1, y, 1); }
        s.dy = by;
        // the sugar top: torched darker in patches, glassy glints
        s.poly(top, [[6, 33], [42, 33], [46, 35], [48, 37], [48, 41], [40, 41.6], [30, 41], [20, 41.7], [10, 41], [0, 41.4], [0, 37], [2, 35]]);
        hdB_kit.form(s, top, 0, 33, 48, 42, 8, 4, { lift: -0.06 });
        for (const [x, y] of [[5, 38], [6, 38], [6, 39], [19, 36], [20, 36], [20, 37], [33, 39], [34, 39], [41, 36], [42, 37], [27, 37]]) s.mod(x, y, -1);
        for (const [x, y] of [[10, 36], [11, 36], [12, 37], [28, 34], [29, 34], [34, 36], [35, 36], [16, 39], [25, 39], [43, 39]]) s.px(x, y, '#f8d896');
        // the beret, worn at a tilt, with its little stalk
        s.poly(beret, [[13, 24], [26, 23.6], [32.5, 25], [37.5, 27.5], [41.5, 30.5], [41, 33], [3.5, 33], [4, 30.5], [7.5, 27]]);
        s.line(beret, 23, 24, 24.2, 21.8, 0.9, 0.8);
        hdB_kit.form(s, beret, 3, 22, 42, 34, 19.5, 6, { lift: 0.03 });
        for (let x = 6; x < 40; x++) s.mod(x, 31, x % 3 ? 0 : -1);
        // the face
        if (f.blink) { hdB_kit.shut(s, 10, 45); hdB_kit.shut(s, 34, 45); }
        else { hdB_kit.eye(s, 10, 45, -1); hdB_kit.eye(s, 34, 45, 1); }
        hdB_kit.blush(s, 5, 51, '#ff9aa8', '#fdbcb0'); hdB_kit.blush(s, 37, 51, '#ff9aa8', '#fdbcb0');
        const m = '#8a4a2a';
        for (const [x, y] of [[21, 51], [22, 52], [23, 52], [24, 52], [25, 52], [26, 51]]) s.px(x, y, m);
        s.dy = 0;
    },
};

/* ---- Mac: macaroni and cheese in a blue bowl, in a chef's toque (Mac runs the restaurant's kitchen) */
HD_NPC.mac = {
    hat: [24, 21, 24], eye: [24, 47, 12], squashDy: 3,
    draw(s, f) {
        const by = f.squash ? 3 : 0, br = f.squash ? 2.5 : 0;
        const cheese = hdPal('#9a6a10', '#ecb434', '#ffd04a', '#ffdd6c', '#ffeb9a');
        const blue = hdPal('#1f3a66', '#3a6aa8', '#4f86c6', '#6a9cd6', '#9fc3e6');
        const white = hdPal('#8a8498', '#d8d4e2', '#f2f0f6', '#ffffff', '#ffffff');
        const feet = s.add(hdPal('#1f1518', '#2e2124', '#3a2a2e', '#4f3a3f', '#66505a'), { layer: 0, R: 2 });
        const mound = s.add(cheese, { layer: 1, flat: 1, grad: 0 });
        const bowl = s.add(blue, { layer: 3, flat: 1, grad: 0 });
        const rim = s.add(blue, { layer: 4, flat: 1, grad: 0 });
        s.ellipse(feet, 17.5, 70, 3.3, 2); s.ellipse(feet, 30.5, 70, 3.3, 2);
        hdB_kit.rr(s, mound, 0, 36 + by, 48, 56, 10, 6);
        hdB_kit.form(s, mound, 0, 36 + by, 48, 60, 24, 12, { lift: 0.06 });
        // the bowl: a deep rounded bowl with a lip, glossy on the lit side
        s.poly(bowl, [[0, 55 + br], [48, 55 + br], [48, 59 + br / 2], [46.5, 62], [44, 65], [40, 68.6], [8, 68.6], [4, 65], [1.5, 62], [0, 59 + br / 2]]);
        hdB_kit.form(s, bowl, 0, 40 + br, 48, 69, 24, 15 - br);
        hdB_kit.rr(s, rim, 0, 53.5 + br, 48, 57 + br, 1.5, 1.5);
        hdB_kit.form(s, rim, 0, 53.5 + br, 48, 57 + br, 24, 1.8, { lift: 0.08 });
        const hb = Math.round(br);
        for (const [x, y] of [[5, 58], [5, 59], [6, 60], [6, 61], [7, 62]]) s.px(x, y + (y < 61 ? hb : 0), '#9fc3e6');
        s.px(42, 59 + hb, '#6a9cd6'); s.px(42, 60 + hb, '#6a9cd6');
        for (let x = 2; x < 30; x++) if (x % 7 !== 3) s.mod(x, 54 + hb, 1);
        s.dy = by;
        // elbow macaroni in the cheese: little arches, darker gold with a lit top, the hollow showing through
        for (const [x, y, fl] of [[5, 40, 0], [14, 38.5, 1], [24, 39.5, 0], [33, 38.5, 1], [41, 40, 0], [2, 47, 1], [43, 47, 0]]) {
            const e = fl ? -1 : 1, X = (i) => Math.round(x + i * e);
            for (const i of [-1, 0, 1]) s.px(X(i), y, '#eca22a'); s.px(X(-2), y + 1, '#eca22a'); s.px(X(2), y + 1, '#d88a1e'); s.px(X(-2), y + 2, '#e09624'); s.px(X(2), y + 2, '#c87a18');
            s.px(X(-1), y, '#fcd27a'); s.px(X(-2), y + 1, '#f8be50');
        }
        // the toque: three puffs (the middle one in front, so the pleats show) on a band
        const pl = s.add(white, { layer: 5, flat: 1, grad: 0 }), pr = s.add(white, { layer: 5, flat: 1, grad: 0 }), pc = s.add(white, { layer: 6, flat: 1, grad: 0 });
        const band = s.add(hdPal('#7a7490', '#c6c0d6', '#dcd6e8', '#ebe7f2', '#f8f6fc'), { layer: 7, flat: 1, grad: 0 });
        s.ellipse(pl, 15.5, 29.5, 7.6, 6); hdB_kit.ball(s, pl, 15.5, 29.5, 7.6, 6, { lift: 0.08 });
        s.ellipse(pr, 32.5, 29.5, 7.6, 6); hdB_kit.ball(s, pr, 32.5, 29.5, 7.6, 6, { lift: 0.08 });
        s.ellipse(pc, 24, 27.5, 9, 7); s.rect(pc, 16, 30, 16, 5); hdB_kit.ball(s, pc, 24, 27.5, 9, 8, { lift: 0.1 });
        hdB_kit.rr(s, band, 12, 34, 36, 39.2, 2, 1.5);
        hdB_kit.form(s, band, 12, 34, 36, 39.2, 12, 2, { lift: 0.05 });
        // the face
        if (f.blink) { hdB_kit.shut(s, 10, 45); hdB_kit.shut(s, 34, 45); }
        else { hdB_kit.eye(s, 10, 45, -1); hdB_kit.eye(s, 34, 45, 1); }
        hdB_kit.blush(s, 5, 51, '#ff9aa8', '#ffb07a'); hdB_kit.blush(s, 37, 51, '#ff9aa8', '#ffb07a');
        const m = '#b05a1a';
        for (const [x, y] of [[21, 51], [22, 52], [23, 52], [24, 52], [25, 52], [26, 51]]) s.px(x, y, m);
        s.dy = 0;
    },
};

/* ---- Fortune: a fortune cookie (she keeps Fortune's Goods), folded in the middle, the slip peeking out */
HD_NPC.fortune = {
    hat: [24, 33, 30], eye: [24, 50, 12], squashDy: 3,
    draw(s, f) {
        const by = f.squash ? 3 : 0;
        const dough = hdPal('#9c6a22', '#d4983a', '#f0be5c', '#f6cc74', '#fadc98');
        const feet = s.add(hdPal('#1f1518', '#2e2124', '#3a2a2e', '#4f3a3f', '#66505a'), { layer: 0, R: 2 });
        const body = s.add(dough, { layer: 1, flat: 1, grad: 0 });
        const paper = s.add(hdPal('#9a948a', '#e4e0d8', '#fbfaf6', '#ffffff', '#ffffff'), { layer: 2, R: 1.5, grad: 0.1 });
        s.ellipse(feet, 17.5, 70, 3.3, 2); s.ellipse(feet, 30.5, 70, 3.3, 2);
        const top = 33 + by;
        s.poly(body, [[12, top], [36, top], [41, top + 1.8], [44.5, top + 4.5], [47, top + 8], [48, top + 11], [48, 59], [46.5, 62.5], [42.5, 66], [36, 68.6], [12, 68.6], [5.5, 66], [1.5, 62.5], [0, 59], [0, top + 11], [1, top + 8], [3.5, top + 4.5], [7, top + 1.8]]);
        hdB_kit.form(s, body, 0, top, 48, 69, 20, 14, { lift: 0 });
        // the fold: a crease in a V from the top corners to the middle, the cookie inside it a shade deeper
        s.dy = by;
        for (let y = 33; y < 50; y++) for (let x = 11; x < 38; x++) { const vy = 49.5 - Math.abs(x + 0.5 - 24) * 0.95; if (y + 0.5 < vy - 1.2 && s.at(x, y + by) === body) s.mod(x, y, -1); }
        for (let x = 12; x < 37; x++) { const vy = Math.round(49.5 - Math.abs(x + 0.5 - 24) * 0.95); s.mod(x, vy - 1, -2); s.mod(x, vy, 1); if (x !== 24 && x !== 23) s.mod(x, vy - 2, -1); }
        s.dy = 0;
        // a few darker baked flecks
        for (const [x, y] of [[8, 45], [40, 44], [5, 58], [43, 52], [17, 63], [31, 64], [28, 37], [19, 38]]) s.mod(x, y + (y < 50 ? by : 0), -1);
        s.poly(paper, [[42.2, 56.6], [46.8, 57.6], [44.6, 66.6], [40, 65.6]]);
        s.dy = by;
        for (const [x, y] of [[44, 59], [43, 61], [43, 62]]) s.px(x, y - by, '#d0584a');
        if (f.blink) { hdB_kit.shut(s, 10, 48); hdB_kit.shut(s, 34, 48); }
        else { hdB_kit.eye(s, 10, 48, -1); hdB_kit.eye(s, 34, 48, -1); }
        hdB_kit.blush(s, 5, 54, '#ff9aa8', '#f8b080'); hdB_kit.blush(s, 37, 54, '#ff9aa8', '#f8b080');
        const m = '#5a1f28';
        for (const [x, y] of [[21, 54], [22, 55], [23, 55], [24, 55], [25, 55], [26, 54]]) s.px(x, y, m);
        s.dy = 0;
    },
};
