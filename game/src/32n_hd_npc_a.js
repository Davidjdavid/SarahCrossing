/* ---- 32n_hd_npc_a.js ---- */
/* HD neighbors (the food folks), part one. Each is drawn into a 48x72 sprite standing on row 71 (the anchor is 24,69),
   facing the front, and flipped for walking left. f.squash is the hop frame (a little shorter and wider), f.blink the
   eyes shut. hat: where a hat sits [x, y of the top of the head, width]; eye: the eye line [x, y, half the eye gap];
   squashDy: how far the head (and the eye line) drops in the squash frame. Each is today's 16px sprite at three times
   the size: same outline, colors and face, with the form, light and texture the extra pixels allow. Faces are mirrored
   about x = 24 (pixel i pairs with 47 - i). */
const HD_EYE = hdPal('#1c1416', '#2b1b19', '#2b1b19', '#5a3a30', '#5a3a30');

/* helpers shared by this file's neighbors */
const hdA_kit = {
    /* a squarish-round blob (a superellipse: p 2 is an ellipse, higher is boxier), optionally only rows y0..y1 */
    blob(s, id, cx, cy, rx, ry, p, y0, y1) {
        y0 = y0 == null ? -1e9 : y0; y1 = y1 == null ? 1e9 : y1;
        for (let y = Math.max(Math.floor(cy - ry), y0); y <= Math.min(Math.ceil(cy + ry), y1); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
            const u = Math.abs((x + 0.5 - cx) / rx), v = Math.abs((y + 0.5 - cy) / ry); if (u ** p + v ** p <= 1) s.plot(id, x, y);
        }
    },
    /* a leaf (an almond) from its base to its tip, w = half its width at the widest */
    leaf(s, id, x0, y0, x1, y1, w) {
        const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l, a = [], b = [];
        for (let i = 0; i <= 8; i++) {
            const t = i / 8, ww = w * Math.sin(Math.PI * Math.pow(t, 0.75));
            a.push([x0 + dx * t + nx * ww, y0 + dy * t + ny * ww]); b.unshift([x0 + dx * t - nx * ww, y0 + dy * t - ny * ww]);
        }
        s.poly(id, a.concat(b));
    },
    /* every pixel of one part (texture passes) */
    each(s, id, fn) { for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) if (s.part[y * s.w + x] === id) fn(x, y); },
    mix(c1, c2, t) { const a = hdRgb(c1), b = hdRgb(c2); return a.map((v, i) => Math.round(v + (b[i] - v) * t)); },
    /* a dark eye: 5x6 with the corners rounded, warmer at the bottom, a glint at the top on side gl (-1 left, 1 right) */
    dot(s, x, y, gl, dark, low) {
        for (let j = 0; j < 6; j++) for (let i = 0; i < 5; i++) if (!((j === 0 || j === 5) && (i === 0 || i === 4))) s.px(x + i, y + j, j >= 4 ? low : dark);
        const gx = gl < 0 ? x + 1 : x + 2; s.px(gx, y + 1, '#ffffff'); s.px(gx + 1, y + 1, '#ffffff'); s.px(gx, y + 2, '#ffffff'); s.px(gx + 1, y + 2, '#e8dcd8');
    },
    /* a pair of dark eyes, the left one at x (the right one mirrored); gl: the glint side of the left eye (-1 or 1);
       mirror: the right eye's glint mirrored too (else both on the same side) */
    dots(s, x, y, gl, mirror, dark, low) { hdA_kit.dot(s, x, y, gl, dark, low); hdA_kit.dot(s, 43 - x, y, mirror ? -gl : gl, dark, low); },
    /* eyes shut: a soft curve, both eyes (the left one at x) */
    shut(s, x, y, w, c) { for (const x0 of [x, 48 - x - w]) for (let i = 0; i < w; i++) s.px(x0 + i, y + (i === 0 || i === w - 1 ? 0 : 1), c); },
    /* blush on both cheeks (the left one at x): w x h, the corners softened toward the face color */
    blush(s, x, y, w, h, c, under) {
        const soft = hdA_kit.mix(c, under, 0.55);
        for (const x0 of [x, 48 - x - w]) for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) s.px(x0 + i, y + j, (i === 0 || i === w - 1) && (j === 0 || j === h - 1) ? soft : c);
    },
    /* a small open smile (w even): a dark mouth, the tongue showing */
    smile(s, y, w, dark, tongue) {
        const x0 = 24 - w / 2;
        for (let i = 0; i < w; i++) s.px(x0 + i, y, dark);
        for (let i = 1; i < w - 1; i++) s.px(x0 + i, y + 1, i === 1 || i === w - 2 ? dark : tongue);
        if (w > 4) for (let i = 2; i < w - 2; i++) s.px(x0 + i, y + 2, dark);
    },
    /* parts drawn in a sprite of their own and laid over this one as finished pixels (a bow, a stem, a berry sitting on
       a body): the body under them keeps its whole form, where a part cut into it would dent its shading. The body
       just below gets a soft contact shadow. */
    over(s, fn) {
        const o = new HDSprite(s.w, s.h); fn(o);
        const buf = o.render(), W = s.w;
        for (let i = 0; i < W * s.h; i++) {
            if (!buf[i * 4 + 3]) continue;
            const x = i % W, y = (i / W) | 0;
            s.px(x, y, [buf[i * 4], buf[i * 4 + 1], buf[i * 4 + 2]]);
            if (y + 1 < s.h && !buf[(i + W) * 4 + 3]) s.mod(x, y + 1, -1);
        }
    },
    feet(s, id, xs, q) { for (const x of xs) s.ellipse(id, x + (x < 24 ? -q : q), 69.8, 3.6, 2.3); },
    footPal: hdPal('#1d1416', '#2c1f22', '#3a2a2e', '#4e3b3f', '#614c50'),
};

/* Maki: a maki roll. Seaweed sides, a rice top with the salmon and its green cucumber heart, white eyes. */
HD_NPC.maki = {
    hat: [24, 25, 40], eye: [24, 50, 9], squashDy: 3,
    draw(s, f) {
        const K = hdA_kit, q = f.squash ? 1 : 0, t = q * 3;
        const feet = s.add(K.footPal, { layer: 0, R: 2 });
        const body = s.add(hdPal('#121b17', '#273630', '#34473e', '#405a4d', '#527061'), { layer: 1, R: 12, grad: 0.2, k: 1.5 });
        const rice = s.add(hdPal('#8f8a7c', '#d6d2c4', '#efece1', '#fbfaf2', '#ffffff'), { layer: 2, R: 5, grad: 0.12, bias: 0.16 });
        const fish = s.add(hdPal('#9c3b28', '#dc6a4c', '#f2896b', '#f8a688', '#fcc8ac'), { layer: 3, R: 3, grad: 0.15 });
        const skin = s.add(hdPal('#2c5a2a', '#4f8a3c', '#6fb05a', '#86c068', '#9dd078'), { layer: 4, R: 1.2 });
        const cuke = s.add(hdPal('#4f8a3c', '#8cba52', '#9dc45f', '#b6d67a', '#d0e89a'), { layer: 5, R: 1.2, bias: 0.04 });
        const cx = 24, rx = 22.5 + q, ty = 35.5 + t;
        K.feet(s, feet, [15, 33], q);
        s.rect(body, cx - rx, ty, rx * 2, 62 - ty);
        s.ellipse(body, cx, 62.5, rx, 6);
        s.ellipse(body, cx, ty, rx, 11.5 - q);
        s.ellipse(rice, cx, ty - 1.4, rx - 1.6, 9.2 - q);
        s.ellipse(fish, cx, ty - 1.8, 11.5, 4.8 - q * 0.5);
        s.ellipse(skin, cx, ty - 1.9, 4.4, 2.7);
        s.ellipse(cuke, cx - 0.3, ty - 2.2, 3.2, 1.8);
        /* rice grains around the salmon: little dashes of shadow */
        for (let i = 0; i < 50; i++) {
            const a = i * 2.39996, r = 0.6 + 0.37 * ((i * 0.618) % 1);
            const x = Math.round(cx + Math.cos(a) * r * (rx - 2.5)), y = Math.round(ty - 1.4 + Math.sin(a) * r * 8.4);
            if (s.at(x, y) === rice && s.at(x + 1, y) === rice) { s.mod(x, y, -1); if (i % 3) s.mod(x + 1, y, -1); }
        }
        /* the fat lines of the salmon: two soft arcs around the cucumber */
        K.each(s, fish, (x, y) => {
            const u = (x + 0.5 - cx) / 11.5, v = (y + 0.5 - ty + 1.8) / 4.8, r = Math.hypot(u, v);
            if ((Math.abs(r - 0.62) < 0.07 || Math.abs(r - 0.86) < 0.06) && v < 0.5) s.mod(x, y, 1);
        });
        /* the seaweed: the rim's dark edge, a sheen on the lit side, faint fibres */
        for (let x = 0; x < 48; x++) {
            const u = (x + 0.5 - cx) / rx; if (Math.abs(u) >= 1) continue;
            const y = Math.round(ty + (11.5 - q) * Math.sqrt(1 - u * u)) - 1; if (s.at(x, y) === body) s.mod(x, y, -1);
        }
        for (let y = ty + 11; y < 64; y++) { s.mod(cx - 15, y, 1); s.mod(cx - 14, y, 1); s.mod(cx + 18, y, -1); }
        for (const [x, y] of [[8, 50], [30, 60], [39, 49], [19, 63], [11, 59], [36, 56]]) { s.mod(x, y + t, -1); s.mod(x + 1, y + t, -1); }
        /* face: white eyes looking in and down, pink cheeks, a little white smile */
        const ey = 47 + t;
        if (f.blink) K.shut(s, 13, ey + 3, 5, '#e8e4d8');
        else for (const [x, d] of [[13, 1], [30, -1]]) {
            for (let j = 0; j < 6; j++) for (let i = 0; i < 5; i++) if (!((j === 0 || j === 5) && (i === 0 || i === 4))) s.px(x + i, ey + j, '#f6f4ec');
            for (let j = 2; j < 6; j++) for (let i = 0; i < 2; i++) if (!(j === 5 && i === (d > 0 ? 1 : 0))) s.px(x + (d > 0 ? 3 : 0) + i, ey + j, '#1e1416');
        }
        K.blush(s, 8, ey + 7, 6, 2, '#f4929e', '#34473e');
        for (let i = 0; i < 6; i++) s.px(21 + i, ey + 7, '#f6f4ec');
        for (let i = 1; i < 5; i++) s.px(21 + i, ey + 8, i === 1 || i === 4 ? '#c9c4b6' : '#f6f4ec');
    },
};

/* Kai: a poke bowl. A blue bowl with a white rim and dots, piled with tuna, salmon, avocado, mango and seaweed. */
HD_NPC.kai = {
    hat: [24, 29, 34], eye: [24, 50, 12], squashDy: 3,
    draw(s, f) {
        const K = hdA_kit, q = f.squash ? 1 : 0, t = q * 3;
        const feet = s.add(K.footPal, { layer: 0, R: 2 });
        const bowl = s.add(hdPal('#1f2d48', '#3a6aa6', '#4f86c6', '#6a9fd6', '#8cbbe6'), { layer: 1, R: 10, grad: 0.22, k: 1.4 });
        const rim = s.add(hdPal('#6f7f96', '#d8d4ca', '#f2eee4', '#fbf9f3', '#ffffff'), { layer: 9, R: 1.5, grad: 0.1, cast: 1 });
        /* the food: a heap per topping (tuna, salmon, avocado), then the pieces over it, back to front; a piece tucks
           its neighbors behind it with a soft seam */
        const P = {
            tuna: hdPal('#5e1222', '#ad2e45', '#d9475a', '#ea6676', '#f5909a'), salm: hdPal('#8e3a22', '#dc7048', '#f59a6b', '#fbb589', '#ffd2ae'),
            avo: hdPal('#34582a', '#78a440', '#9dc45f', '#b9da7c', '#d6ec9e'), mango: hdPal('#9c5e16', '#f2b840', '#ffd35a', '#ffe388', '#fff2bc'),
            weed: hdPal('#132c1a', '#2f6038', '#3f7d4a', '#559658', '#70b06c'),
        };
        const part = (m, L, R) => s.add(P[m], { layer: L, R: R || 2.4, k: 1.5, grad: 0.1, cast: L > 2 ? 1 : 0 });
        const cx = 24, rx = 23.5 + q, top = 30 + t;
        K.feet(s, feet, [18, 30], q);
        K.blob(s, bowl, cx, 45 + t * 0.5, rx, 23.5 - t * 0.5, 3.1, 45 + t, 72);
        const bedT = part('tuna', 2, 4), bedS = part('salm', 2, 4), bedA = part('avo', 2, 4);
        K.blob(s, bedT, cx, 46 + t * 0.4, 21.5 + q, 46 - top - t * 0.4, 3, top, 46);
        K.each(s, bedT, (x, y) => { if (x >= 19 && x < 29) s.plot(bedS, x, y); else if (x >= 29) s.plot(bedA, x, y); });
        const cube = (L, m, x, y, r) => { const id = part(m, L); K.blob(s, id, x, y + t, r, r * 0.9, 3.2); return id; };
        /* a salmon slice with two pale fat lines across it */
        const slice = (L, x, y, rx_, ry_) => {
            const id = part('salm', L, 3); s.ellipse(id, x, y + t, rx_, ry_);
            K.each(s, id, (x2, y2) => { const d = (x2 - x) * 0.7 + (y2 - y - t) * 1.6; if (Math.abs(d) < 0.6 || Math.abs(d - 4.5) < 0.6) s.mod(x2, y2, 1); });
        };
        /* an avocado slice: a crescent, the dark skin along its lower edge (not under the rim) */
        const avo = (L, x0, y0, x1, y1, w) => {
            const id = part('avo', L, 2); K.leaf(s, id, x0, y0 + t, x1, y1 + t, w);
            K.each(s, id, (x, y) => { if (y >= 44 + t) return; if (s.at(x, y + 1) !== id) s.px(x, y, '#4a7a2c'); else if (s.at(x, y - 1) !== id) s.mod(x, y, 1); });
        };
        cube(3, 'tuna', 13.5, 32, 4); slice(3, 23.5, 30.5, 5.4, 3.5); avo(3, 28.5, 34.5, 38, 30.5, 3.3);
        cube(4, 'tuna', 7.5, 38, 3.8); cube(4, 'tuna', 16.5, 37.5, 3.8); slice(4, 24.5, 37, 5, 3.3); avo(4, 29, 40.5, 38.5, 36, 3.1); cube(4, 'mango', 41, 38.5, 3);
        const wl = part('weed', 5, 1.6), wr = part('weed', 5, 1.6);
        s.ellipse(wl, 6, 43 + t, 4.6, 3.2); s.ellipse(wr, 42, 43 + t, 4.6, 3.2);
        for (const [x, y] of [[4, 42], [6, 41], [8, 42], [39, 42], [41, 41], [43, 42]]) { s.mod(x, y + t, -1); s.mod(x, y + t + 1, -1); }
        cube(5, 'tuna', 15, 43, 3.4); cube(5, 'mango', 25.5, 42.8, 3.1); avo(5, 30.5, 45, 37, 40.8, 2.7);
        /* a glossy dot on the tuna, sesame seeds */
        for (const [x, y] of [[11, 30], [6, 36], [14, 36], [13, 41]]) s.px(x, y + t, '#f7a2aa');
        for (const [x, y] of [[15, 31], [9, 38], [22, 29], [18, 40], [34, 32], [27, 43]]) s.px(x, y + t, '#f6ecd2');
        /* the rim */
        K.blob(s, rim, cx, 46.3 + t, rx, 1.9, 4);
        /* the bowl's dots */
        const dot = [[0, 0, '#a2c6ee'], [1, 0, '#a2c6ee'], [2, 0, '#8fb8e6'], [0, 1, '#8fb8e6'], [1, 1, '#8fb8e6'], [2, 1, '#7aa6d8']];
        for (const x of [9, 18, 27, 36]) for (const [i, j, c] of dot) s.px(x + i, 60 + j, c);
        const ey = 48 + t;
        if (f.blink) K.shut(s, 9, ey + 3, 5, '#1f2d48');
        else for (const [x, d] of [[9, 1], [34, -1]]) {
            for (let j = 0; j < 6; j++) for (let i = 0; i < 5; i++) if (!((j === 0 || j === 5) && (i === 0 || i === 4))) s.px(x + i, ey + j, '#ffffff');
            for (let j = 2; j < 6; j++) for (let i = 0; i < 2; i++) if (!(j === 5 && i === (d > 0 ? 1 : 0))) s.px(x + (d > 0 ? 3 : 0) + i, ey + j, '#231418');
        }
        K.blush(s, 4, ey + 7, 6, 2, '#ff9aa8', '#4f86c6');
        for (let i = 0; i < 6; i++) s.px(21 + i, ey + 7 + (i === 0 || i === 5 ? 0 : 1), '#26364f');
    },
};

/* Basil: pad thai. A golden ball of rice noodles with peanut crumbs, a sprig of Thai basil and a lime wedge on top. */
HD_NPC.basil = {
    hat: [24, 36, 30], eye: [24, 50, 12], squashDy: 3,
    draw(s, f) {
        const K = hdA_kit, q = f.squash ? 1 : 0, t = q * 3;
        const feet = s.add(K.footPal, { layer: 0, R: 2 });
        const ball = s.add(hdPal('#8a5a2c', '#d39a4e', '#e9b86c', '#f3cf8c', '#fae2ac'), { layer: 1, R: 11, grad: 0.2, k: 1.5 });
        const green = hdPal('#1f4a24', '#3a8a40', '#5aae55', '#7cc66a', '#a2dc88');
        const cx = 24, cy = 52.3 + t * 0.5, rx = 23.5 + q, ry = 16.3 - t * 0.5, p = 2.4;
        K.feet(s, feet, [18, 30], q);
        K.blob(s, ball, cx, cy, rx, ry, p);
        /* the noodles: strands running over the ball like meridians, each with a groove and a lit edge */
        K.each(s, ball, (x, y) => {
            const v = (y + 0.5 - cy) / ry, hw = rx * Math.pow(Math.max(0.01, 1 - Math.abs(v) ** p), 1 / p), u = (x + 0.5 - cx) / (0.45 * rx + 0.55 * hw);
            const w = (u + 1) * 4 + 0.5, fr = w - Math.floor(w); if (fr < 0.16) s.mod(x, y, -1); else if (fr < 0.5) s.mod(x, y, 1);
        });
        /* crushed peanuts */
        for (const [x, y] of [[15, 42], [31, 43], [8, 57], [38, 58], [23, 64]]) {
            s.px(x, y + t, '#b07a42'); s.px(x + 1, y + t, '#8f5f32'); s.px(x, y + t - 1, '#e0b070'); s.px(x + 1, y + t - 1, '#c48c50');
        }
        /* the basil sprig and the lime wedge */
        K.over(s, (o) => {
            const leafA = o.add(green, { layer: 4, R: 1.6, k: 1.4, cast: 1 }), leafB = o.add(green, { layer: 3, R: 1.6, k: 1.4, bias: -0.1 });
            const rind = o.add(hdPal('#3f6012', '#6e9a22', '#8fbc30', '#a8d044', '#c4e468'), { layer: 2, R: 1.2 });
            const pulp = o.add(hdPal('#a8b84a', '#cfe170', '#e0f08e', '#eef8b4', '#f8fdd8'), { layer: 3, R: 1.5, bias: 0.04 });
            K.leaf(o, leafB, 21, 38 + t, 11, 31 + t, 3.1);
            K.leaf(o, leafA, 21.5, 38.5 + t, 18.5, 25 + t, 3.7);
            /* the veins down the middle of each leaf */
            for (let i = 2; i < 11; i++) o.mod(Math.round(21.3 - i * 0.24), Math.round(37.8 - i * 1.1) + t, 1);
            for (let i = 2; i < 8; i++) o.mod(Math.round(20.5 - i * 1.25), Math.round(37.4 - i * 0.82) + t, 1);
            /* the lime wedge: rind, a pale line of pith, the flesh in segments */
            K.blob(o, rind, 29.5, 37.5 + t, 6.6, 7, 2, 0, 36 + t);
            K.blob(o, pulp, 29.5, 37.5 + t, 5, 5.4, 2, 0, 36 + t);
            K.each(o, pulp, (x, y) => { if (o.at(x, y - 1) === rind || o.at(x - 1, y) === rind || o.at(x + 1, y) === rind) o.px(x, y, '#f7fbe2'); });
            for (const [x, y] of [[27, 35], [26, 34], [29, 34], [29, 33], [31, 35], [32, 34]]) o.px(x, y + t, '#bed468');
        });
        const ey = 48 + t;
        if (f.blink) K.shut(s, 10, ey + 3, 5, '#3a1c14');
        else K.dots(s, 10, ey, 1, false, '#231418', '#3a2420');
        K.blush(s, 9, ey + 7, 6, 2, '#ff9aa8', '#e9b86c');
        K.smile(s, ey + 7, 6, '#5a1f28', '#d9707a');
    },
};

/* Wonton: a dumpling. Soft pleated dough pinched at the top; sits right on the ground (no feet). */
HD_NPC.wonton = {
    hat: [24, 33, 24], eye: [24, 53, 12], squashDy: 3,
    draw(s, f) {
        const K = hdA_kit, q = f.squash ? 1 : 0, t = q * 3;
        const doughPal = hdPal('#b38a50', '#e6cc96', '#f8e8b8', '#fcf2d4', '#fffbee');
        const dough = s.add(doughPal, { layer: 1, R: 10, grad: 0.2, k: 1.5 });
        const knot = s.add(doughPal, { layer: 2, R: 2 });
        const cx = 24, w = q;
        /* the right half of the outline, top to bottom (the left is its mirror); the squash lowers the top, not the base */
        const R = [[24, 30.3], [26.4, 30.6], [28.2, 32.5], [30, 34.6], [32.5, 36.6], [36, 38.6], [40, 40.8], [43.2, 43.4], [45.6, 46.4], [47.2, 49.8],
            [47.7, 54], [47.6, 58.5], [46.6, 62], [44.6, 64.6], [41.2, 66.6], [36.5, 67.8], [33, 68.6], [31.2, 70.5], [28, 71.6]];
        const pts = R.map(([x, y]) => [x + (x > 24.5 ? w : 0), y < 66 ? y + t * (66 - y) / 36 : y]);
        s.poly(dough, pts.concat(pts.slice().reverse().map(([x, y]) => [48 - x, y])));
        s.ellipse(knot, cx, 32 + t, 3.4, 2.6);
        /* the pleats: creases fanning down from the knot, each with a lit ridge beside it */
        for (const [x1, y1] of [[22, 42.5], [15, 45], [32, 45], [8.5, 48], [39.5, 48]]) {
            const n = 16, side = x1 < cx ? 1 : -1;
            for (let i = 3; i <= n; i++) {
                const tt = i / n, x = Math.round(cx + (x1 - cx) * tt), y = Math.round(33 + t + (y1 - 33 - t * 0.3) * Math.pow(tt, 0.9));
                s.mod(x, y, -1); if (i < n - 2) s.mod(x + side, y, -1); s.mod(x - side, y, 1);
            }
        }
        const ey = 50 + t;
        if (f.blink) K.shut(s, 10, ey + 3, 5, '#5a3a2a');
        else K.dots(s, 10, ey, -1, false, '#231418', '#3a2420');
        K.blush(s, 6, ey + 7, 6, 2, '#ff9aa8', '#f8e8b8');
        K.smile(s, ey + 7, 6, '#5a1f28', '#d9707a');
    },
};

/* Chili: a red chili pepper with a green stem, the tip curling right, bold eyebrows. */
HD_NPC.chili = {
    hat: [24, 20, 28], eye: [24, 38, 8], squashDy: 3,
    draw(s, f) {
        const K = hdA_kit, q = f.squash ? 1 : 0, t = q * 3;
        const feet = s.add(K.footPal, { layer: 0, R: 2 });
        const body = s.add(hdPal('#6e1210', '#b8241c', '#e2382b', '#f05a40', '#ff8a6c'), { layer: 1, R: 16, grad: 0.22, k: 1.3 });
        const green = hdPal('#1d4a1c', '#3c8a34', '#5aa844', '#76c058', '#98d670');
        K.feet(s, feet, [16.5, 31.5], q);
        /* today's outline at three times the size, centered (today's is a pixel left of the middle) */
        const P = [[24, 20.5], [31, 20.8], [36, 22], [39.5, 24.5], [42, 27], [43.2, 32], [43.3, 40], [42.9, 46], [41.5, 50], [39.5, 53.5], [37, 57], [35, 60.5],
            [34.3, 63.5], [33.2, 66.2], [31, 68.4], [28, 69], [25.5, 68], [23, 65.5], [19, 62.5], [15.5, 59.5], [12, 56.5], [9, 53], [6.5, 49.5], [5, 45.5],
            [4.5, 40], [4.7, 31], [6, 27], [8.5, 24.5], [12, 22], [17, 20.8]];
        s.poly(body, P.map(([x, y]) => [x + (x - 24) * q * 0.06, y < 60 ? y + t * (60 - y) / 40 : y]));
        /* the calyx: leaves drooping over the shoulders, and a stout stem */
        K.over(s, (o) => {
            const cap = o.add(green, { layer: 3, R: 1.8 }), stem = o.add(green, { layer: 4, R: 1.8 });
            K.leaf(o, cap, 23, 21.5 + t, 10, 26 + t, 3); K.leaf(o, cap, 25, 21.5 + t, 38, 26 + t, 3);
            K.leaf(o, cap, 22, 22 + t, 16, 28.5 + t, 2.4); K.leaf(o, cap, 26, 22 + t, 32, 28.5 + t, 2.4);
            o.ellipse(cap, 24, 21.8 + t, 6, 3);
            o.line(stem, 24, 20 + t, 25.5, 13.5 + t, 2.4, 2);
        });
        /* the gloss on the shoulder */
        for (const [x, y, c] of [[13, 28, '#ffb8a0'], [12, 28, '#ff9c80'], [12, 29, '#ffb8a0'], [11, 30, '#ffb8a0'], [11, 31, '#ffa68c'], [10, 32, '#ff9c80'],
            [10, 33, '#ff9c80'], [9, 34, '#ff8a6c'], [9, 35, '#ff8a6c'], [13, 29, '#ff8a6c'], [12, 30, '#ff9c80'], [14, 28, '#ff9c80']]) s.px(x, y + t, c);
        const ey = 36 + t;
        /* the eyebrows: bold, a touch lower at the inner ends */
        for (const x0 of [11, 28]) for (let i = 0; i < 9; i++) {
            const x = x0 + i, inner = x0 < 24 ? i > 5 : i < 3, y = ey - 4 + (inner ? 1 : 0); s.px(x, y, '#3b0d0b'); s.px(x, y + 1, '#3b0d0b');
        }
        if (f.blink) K.shut(s, 14, ey + 3, 5, '#3b0d0b');
        else K.dots(s, 14, ey, -1, false, '#231418', '#3a1816');
        K.blush(s, 9, ey + 7, 6, 2, '#ff9a8a', '#e2382b');
        K.smile(s, ey + 7, 6, '#5a1f28', '#d9707a');
    },
};

/* Coco: a chocolate truffle dusted with cocoa, a pink bow on top, lashes. */
HD_NPC.coco = {
    hat: [24, 32, 34], eye: [24, 50, 11], squashDy: 3,
    draw(s, f) {
        const K = hdA_kit, q = f.squash ? 1 : 0, t = q * 3;
        const feet = s.add(K.footPal, { layer: 0, R: 2 });
        const choc = s.add(hdPal('#2e170c', '#57301b', '#6e3f25', '#87522f', '#a8693e'), { layer: 1, R: 18, grad: 0.22, k: 1.35 });
        const pink = hdPal('#a83a6a', '#ec5f98', '#ff7fb0', '#ffa6c8', '#ffc8dc');
        const cx = 24, cy = 50.8 + t * 0.5, rx = 23.5 + q, ry = 17.7 - t * 0.5;
        K.feet(s, feet, [18, 30], q);
        K.blob(s, choc, cx, cy, rx, ry, 2.35);
        /* cocoa dusting: lighter flecks, most on the top */
        for (let i = 0; i < 60; i++) {
            const x = Math.round(3 + ((i * 0.618) % 1) * 42), y = Math.round(35 + t + Math.pow((i * 0.414) % 1, 1.6) * 30);
            if (s.at(x, y) === choc) s.mod(x, y, y < 44 + t ? 2 : 1);
        }
        /* the bow: two loops, a knot and two short tails */
        K.over(s, (o) => {
            const loop = o.add(pink, { layer: 3, R: 2.4 }), knot = o.add(pink, { layer: 5, R: 1.8 }), tail = o.add(pink, { layer: 2, R: 1.2 });
            const inner = o.add(hdPal('#c85a8a', '#ff9cc2', '#ffc4db', '#ffd8e6', '#ffeaf2'), { layer: 4, R: 1.2 });
            const Y = (pts) => pts.map(([x, y]) => [x, y + t]), M = (pts) => pts.map(([x, y]) => [48 - x, y]);
            const tl = Y([[22, 31.5], [18.5, 37.5], [21, 38], [24, 32.5]]), ll = Y([[23, 29.5], [15.5, 24], [12.5, 24.8], [11.3, 28.5], [12.3, 32.8], [15, 34], [23, 32.5]]);
            o.poly(tail, tl); o.poly(tail, M(tl)); o.poly(loop, ll); o.poly(loop, M(ll));
            o.ellipse(inner, 15.5, 28 + t, 2.4, 2); o.ellipse(inner, 32.5, 28 + t, 2.4, 2);
            o.ellipse(knot, 24, 30.5 + t, 3.2, 2.8);
        });
        const ey = 48 + t;
        if (f.blink) { K.shut(s, 10, ey + 3, 7, '#140a06'); s.px(9, ey + 2, '#140a06'); s.px(38, ey + 2, '#140a06'); }
        else for (const [x0, d] of [[9, 1], [31, -1]]) {
            /* an almond eye: white toward the outside, the pupil on the inside, a lash at the outer corner */
            const X = (i) => d > 0 ? x0 + i : x0 + 7 - i;
            for (const [j, a, b] of [[0, 2, 4], [1, 1, 4], [2, 1, 4], [3, 2, 4], [4, 3, 4]]) for (let i = a; i <= b; i++) s.px(X(i), ey + j, '#ffffff');
            for (const [j, a, b] of [[0, 5, 6], [1, 5, 7], [2, 5, 7], [3, 5, 7], [4, 5, 7], [5, 5, 6]]) {
                for (let i = a; i <= b; i++) s.px(X(i), ey + j, j > 3 ? '#2e1a16' : '#1e1210');
            }
            s.px(X(5), ey + 1, '#ffffff'); s.px(X(6), ey + 1, '#e8dcd8');
            for (const [i, j] of [[0, 0], [0, -1], [-1, -1], [-1, -2]]) s.px(X(i), ey + j, '#140a06');
        }
        K.blush(s, 9, ey + 7, 6, 2, '#d9738a', '#6e3f25');
        for (let i = 0; i < 6; i++) s.px(21 + i, ey + 7, '#ffc4db');
        for (let i = 1; i < 5; i++) s.px(21 + i, ey + 8, i === 1 || i === 4 ? '#e89ab4' : '#ffc4db');
    },
};

/* Cece: a slice of strawberry cheesecake. A strawberry on top, sauce dripping, a graham crust, a nervous sweat drop. */
HD_NPC.cece = {
    hat: [24, 33, 40], eye: [24, 50, 12], squashDy: 3,
    draw(s, f) {
        const K = hdA_kit, q = f.squash ? 1 : 0, t = q * 3;
        const feet = s.add(K.footPal, { layer: 0, R: 2 });
        const cream = s.add(hdPal('#9a7043', '#f0dcb4', '#fff4dc', '#fffaee', '#ffffff'), { layer: 1, R: 2.5, grad: 0.22, k: 1.2 });
        const topS = s.add(hdPal('#9a7043', '#e2bc72', '#f5d68e', '#fae6b0', '#fff2d0'), { layer: 2, R: 2, grad: 0.1 });
        const crust = s.add(hdPal('#6e4422', '#a86d35', '#c98a4b', '#d9a466', '#e8bf86'), { layer: 2, R: 2, grad: 0.1 });
        const red = hdPal('#7a1428', '#b81e38', '#e0334a', '#ee5a6a', '#ff8a9a');
        const sauce = s.add(red, { layer: 3, R: 1.2, k: 1 });
        const drop = s.add(hdPal('#3d7fb8', '#6cb8ec', '#8fd3ff', '#c4ebff', '#ffffff'), { layer: 6, R: 1.5 });
        const x0 = 3.5 - q, x1 = 44.5 + q, ty = 34 + t;
        K.feet(s, feet, [15, 33], q);
        K.blob(s, cream, 24, (ty + 68.5) / 2, (x1 - x0) / 2, (68.5 - ty) / 2, 7);
        K.blob(s, topS, 24, ty + 2.6, (x1 - x0) / 2 - 0.5, 2.6, 6);
        K.blob(s, crust, 24, 63, (x1 - x0) / 2, 3.2, 6, 60, 68);
        K.each(s, crust, (x, y) => { if ((x + (y > 62 ? 4 : 0)) % 8 === 3 && y > 61) s.mod(x, y, -1); });
        /* two drips of strawberry sauce spilling over the front edge, each ending in a bead */
        const T = (pts) => pts.map(([x, y]) => [x, ty + y]);
        s.poly(sauce, T([[10.4, 4], [15.4, 4], [14.6, 5.6], [14.2, 8], [15, 9.6], [14.9, 11.2], [13.2, 12.2], [11.5, 11.3], [11.4, 9.6], [12.1, 8], [11.6, 5.6]]));
        s.poly(sauce, T([[29.4, 4], [33.8, 4], [33.1, 5.6], [32.9, 7], [33.4, 8.4], [32.5, 9.6], [30.9, 9.4], [30.3, 8.2], [30.8, 6.6], [30.2, 5.4]]));
        s.px(12, ty + 9, '#ff9aa6'); s.px(12, ty + 10, '#f27080'); s.px(31, ty + 7, '#ff9aa6');
        /* the strawberry: seeds, a shine, the leaves and stalk */
        K.over(s, (o) => {
            const berry = o.add(red, { layer: 4, R: 4, k: 1.5 });
            const cal = o.add(hdPal('#1d4a1c', '#3c8a34', '#5aa844', '#76c058', '#98d670'), { layer: 5, R: 1.4, cast: 1 });
            o.ellipse(berry, 22.5, 28.6 + t, 8.4, 6.9);
            for (const [x, y] of [[19, 27], [23, 25], [27, 28], [20, 31], [24, 30], [16, 30], [28, 32], [22, 33], [26, 25]]) o.px(x, y + t, '#ffe08a');
            o.mod(18, 25 + t, 2); o.mod(19, 25 + t, 2); o.mod(18, 26 + t, 1);
            for (const [x, y, w] of [[15.5, 23.5, 1.8], [29.5, 23.5, 1.8], [20, 25.5, 1.5], [25, 25.5, 1.5]]) K.leaf(o, cal, 22.5, 22 + t, x, y + t, w);
            o.line(cal, 22.5, 22 + t, 23.5, 18.5 + t, 1.2, 0.9);
        });
        const ey = 48 + t;
        /* a lash at each eye's outer corner */
        if (!f.blink) for (const [x, d] of [[10, -1], [37, 1]]) { s.px(x, ey + 1, '#3a2420'); s.px(x + d, ey, '#6b4a3a'); s.px(x + d * 2, ey - 1, '#6b4a3a'); }
        if (f.blink) { K.shut(s, 10, ey + 3, 5, '#5a3a2a'); s.px(9, ey + 2, '#6b4a3a'); s.px(38, ey + 2, '#6b4a3a'); }
        else K.dots(s, 10, ey, -1, true, '#231418', '#3a2420');
        K.blush(s, 9, ey + 7, 4, 2, '#ff9aa8', '#fff4dc');
        K.smile(s, ey + 7, 4, '#5a1f28', '#d9707a');
        /* the sweat drop on the side */
        s.ellipse(drop, 44.8, 52.8 + t, 2.3, 2.5); s.poly(drop, [[44.6, 47 + t], [47, 52 + t], [42.4, 52 + t]]);
    },
};
