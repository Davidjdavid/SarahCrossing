/* ---- 32y_hd_life.js ---- */
/* HD wildlife, and what goes by on the sea and in the sky, for the HD-2D view: the birds, squirrels, rabbits, the deer,
   the owl, gulls, crabs, ducks, frogs and butterflies (6k_wildlife.js), the boats, dolphins and their splash, the plane
   and the balloon, the fishing bobber, fish shadows and the twinkle. Each is today's sprite at three times the detail:
   the same frame, anchor, pose, silhouette and colors, so every animation frame still lines up with the next. Things
   cast their own shadows in 3D, so none draws one; the fish and plane shadows and the wakes stay see-through like
   today's. */

/* ---------------------------------------------------------------- helpers */
/* a small seeded hash in 0..1 (scatter that never changes) */
function hdL_h(x, y, k) { let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(k | 0, 1442695041); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }
/* register one drawing under several frame names: [name, w, h, ax, ay, args...] in today's pixels */
function hdL_reg(list, fn) { for (const [n, w, h, ax, ay, ...args] of list) HD_SPR[n] = { w: w * 3, h: h * 3, ax: ax * 3, ay: ay * 3, draw(s) { fn(s, ...args); } }; }
/* is a pixel inside an ellipse */
function hdL_in(x, y, cx, cy, rx, ry) { const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry; return u * u + v * v <= 1; }
/* repaint the pixels of some parts in another material where test(x, y) holds: a patch that keeps the form it sits on
   (a robin's breast, a squirrel's belly) instead of a pillow of its own */
function hdL_patch(s, ids, mat, test) {
    const set = new Set([].concat(ids));
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) if (set.has(s.part[y * s.w + x]) && test(x, y)) s.recolor(x, y, mat);
}
/* nudge the shade of the pixels of some parts where test(x, y) gives +1 / -1 (feather rows, fur, planks) */
function hdL_tex(s, ids, fn) {
    const set = new Set([].concat(ids));
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) { const i = y * s.w + x; if (set.has(s.part[i])) { const d = fn(x, y); if (d) s.mods[i] += d; } }
}
/* a lens from (x0, y0) to (x1, y1), w at its widest (at share m of the way): wings, ears, leaves of a tail */
function hdL_lens(s, id, x0, y0, x1, y1, w, m, bend) {
    m = m == null ? 0.45 : m; bend = bend || 0;
    const L = Math.hypot(x1 - x0, y1 - y0) || 1, ux = (x1 - x0) / L, uy = (y1 - y0) / L, A = [], B = [], n = 14;
    for (let i = 0; i <= n; i++) {
        const t = i / n, hw = w * (t < m ? Math.sqrt(Math.sin(t / m * Math.PI / 2)) : Math.sqrt(Math.max(0, 1 - Math.pow((t - m) / (1 - m), 2))));
        const b = bend * Math.sin(t * Math.PI), cx = x0 + (x1 - x0) * t - uy * b, cy = y0 + (y1 - y0) * t + ux * b;
        A.push([cx - uy * hw, cy + ux * hw]); B.push([cx + uy * hw, cy - ux * hw]);
    }
    s.poly(id, A.concat(B.reverse()));
}
/* a picture made pixel by pixel (sparkles, spray, shadows): fn(x, y) gives [r, g, b, a] or nothing */
function hdL_raw(s, fn) {
    s.render = (out, ox, OW) => {
        OW = OW || s.w; ox = ox || 0;
        if (!out) out = new Uint8ClampedArray(s.w * s.h * 4);
        for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) { const c = fn(x, y); if (!c) continue; const o = (y * OW + ox + x) * 4; out[o] = c[0]; out[o + 1] = c[1]; out[o + 2] = c[2]; out[o + 3] = c[3] == null ? 255 : c[3]; }
        return out;
    };
}
/* a little eye: w x h of dark, the top corner toward the light a glint (the neighbors' look-at-you sparkle) */
function hdL_eye(s, x, y, w, h, col, glint) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (!(w > 2 && h > 2 && (i === 0 || i === w - 1) && (j === 0 || j === h - 1))) s.px(x + i, y + j, col);
    s.px(x + (w > 2 ? 1 : 0), y + (h > 2 ? 1 : 0), glint || '#ffffff');
}

/* ---------------------------------------------------------------- shared colors */
const hdL_WHITE = hdPal('#6f7890', '#c9d1df', '#eef2f8', '#fbfcff', '#ffffff');
/* a gentler ramp than hdRamp's for small bright things (its deep saturated shadow swamps a little shape) */
const hdL_SOFT = new Map();
function hdL_soft(hex, dk) {
    const key = hex + (dk || '');
    let r = hdL_SOFT.get(key);
    if (r) return r;
    const [h, sat, l] = hdHsl(hdRgb(hex)), d = dk || 1;
    r = [hdFromHsl(h - 10, sat * 0.85, l * 0.5 * d), hdFromHsl(h - 5, sat * 0.95, l * (1 - 0.17 * d)), hdRgb(hex), hdFromHsl(h + 4, sat, l + (1 - l) * 0.3), hdFromHsl(h + 8, sat, l + (1 - l) * 0.6)];
    hdL_SOFT.set(key, r);
    return r;
}

/* ---------------------------------------------------------------- songbirds: robin, bluebird, sparrow */
const hdL_BIRD = {
    robin:    { body: '#9a7458', dark: '#7a5a44', breast: ['#7a2414', '#c8442a', '#e8603a', '#f07a50', '#f49466'], beak: '#f2b43a', eye: '#2a1e1a' },
    bluebird: { body: '#6a98d8', dark: '#3f6fb8', breast: ['#8a4a20', '#d88446', '#f2a060', '#f6b47a', '#f8c690'], beak: '#f2b43a', eye: '#1a1e2a' },
    sparrow:  { body: '#b89470', dark: '#8a6a4a', breast: ['#7a6a56', '#cfc2ac', '#e8dcc8', '#f0e6d6', '#f6f0e4'], beak: '#e8b44a', eye: '#2a1e1a', streak: '#6a4a30' },
};
/* a plump little bird facing right (24x18, feet on rows 15-17): standing, pecking (head down to the ground), or flying
   seen from the front with the wings up (fly0) and level (fly1) */
function hdL_bird(s, kind, pose) {
    const c = hdL_BIRD[kind], B = hdRamp(c.body), D = hdRamp(c.dark), BR = hdPal(...c.breast), K = hdL_soft(c.beak, 0.8);
    const leg = (x) => { s.px(x, 14, K[1]); s.px(x, 15, K[1]); s.px(x, 16, K[1]); s.px(x - 1, 17, K[1]); s.px(x, 17, K[2]); s.px(x + 1, 17, K[2]); };
    if (pose === 'stand' || pose === 'peck') {
        const pk = pose === 'peck';
        const tail = s.add(D, { layer: 0, R: 1.5, grad: 0.1 });
        const body = s.add(B, { layer: 1, R: 5, grad: 0.22, k: 1.3 });
        const head = s.add(B, { layer: 2, R: 4, grad: 0.2, k: 1.25 });
        const wing = s.add(B, { layer: 3, R: 2, grad: 0.2, bias: -0.06 });
        const beak = s.add(K, { layer: 4, R: 1, grad: 0 });
        if (pk) {
            s.poly(tail, [[7, 9], [2.5, 6.8], [0, 7], [0.2, 9.4], [2.5, 10.8], [7, 12.4]]);
            s.ellipse(body, 10.8, 10.4, 7.6, 5);
            s.ellipse(head, 16.8, 8.2, 4.6, 4.4);
            hdL_lens(s, wing, 13.2, 7.2, 4.8, 8.2, 1.9, 0.35, -0.5);
            s.poly(beak, [[19.8, 10.2], [21.6, 10.4], [23.2, 13.4], [22.6, 14.4], [19.8, 12.8]]);
        } else {
            s.poly(tail, [[7.5, 8.6], [3, 8.2], [0, 8.8], [0.2, 11.4], [2.5, 12], [7.5, 12.8]]);
            s.ellipse(body, 11, 10.2, 7.6, 5.2);
            s.ellipse(head, 14.7, 5.1, 4.7, 4.6);
            hdL_lens(s, wing, 13, 7, 5, 8.4, 1.9, 0.35, -0.5);
            s.poly(beak, [[18.8, 3.6], [20.6, 3.8], [22.8, 5], [20.6, 5.9], [18.8, 6.4]]);
        }
        /* the breast low on the body, like today's: big and bright, under the wing */
        const inBr = (x, y) => hdL_in(x, y, pk ? 9.8 : 10.2, pk ? 12.8 : 12.6, pk ? 6 : 6.2, pk ? 3.3 : 3.5);
        hdL_patch(s, [body], BR, inBr);
        /* a few flight feathers at the wing's tip and a line between the tail feathers; a sparrow's dark streaks */
        hdL_tex(s, [wing], (x, y) => (x < 10 && (x + y) % 3 === 0 && !inBr(x, y + 1) ? -1 : 0));
        hdL_tex(s, [tail], (x, y) => (y === (pk ? 8 : 10) && x < 6 ? -1 : 0));
        if (c.streak) for (const [x, y] of pk ? [[6, 8], [9, 7], [11, 8], [8, 9]] : [[6, 8], [9, 7], [11, 7], [8, 9], [12, 8]]) s.recolor(x, y, hdRamp(c.streak));
        hdL_eye(s, pk ? 18 : 16, pk ? 7 : 3, 2, 2, c.eye);
        leg(7); leg(16);
        return;
    }
    /* flying: the body seen from the front, head low with the beak to the right, the wings up (0) or level (1) */
    const up = pose === 'fly0';
    const wl = s.add(B, { layer: 0, R: 2, grad: 0.25 }), wr = s.add(B, { layer: 0, R: 2, grad: 0.25 });
    const body = s.add(D, { layer: 1, R: 3, grad: 0.2 });
    const head = s.add(B, { layer: 2, R: 2.2, grad: 0.2, cast: 1 });
    const beak = s.add(K, { layer: 3, R: 1, grad: 0 });
    if (up) {
        s.poly(wl, [[10.5, 6.5], [6.5, 3.4], [1.2, 0], [0, 0.8], [0, 3.2], [1.6, 5.6], [4.6, 8.2], [8.2, 10], [10.5, 10]]);
        s.poly(wr, [[13.5, 6.5], [17.5, 3.4], [22.8, 0], [24, 0.8], [24, 3.2], [22.4, 5.6], [19.4, 8.2], [15.8, 10], [13.5, 10]]);
    } else {
        s.poly(wl, [[10.5, 6.6], [5.5, 6.2], [0.4, 6.4], [0, 7.4], [0.6, 9], [2.2, 11.6], [3.6, 11.2], [4.8, 9.8], [7.6, 10.2], [10.5, 10.4]]);
        s.poly(wr, [[13.5, 6.6], [18.5, 6.2], [23.6, 6.4], [24, 7.4], [23.4, 9], [21.8, 11.6], [20.4, 11.2], [19.2, 9.8], [16.4, 10.2], [13.5, 10.4]]);
    }
    s.ellipse(body, 12, 9.6, up ? 4.4 : 3.8, up ? 3.9 : 3.4);
    s.ellipse(head, 13.2, 13.1, 2.9, 2.6);
    s.poly(beak, [[15.4, 12.2], [18.6, 13.3], [15.4, 14.6]]);
    hdL_patch(s, [body], BR, (x, y) => hdL_in(x, y, 12, 11, 2.8, 2.4));
    /* the flight feathers: darker tips and a row between them */
    const tips = up ? [[1, 1], [0, 2], [1, 3], [0, 3], [22, 1], [23, 2], [22, 3], [23, 3]] : [[1, 7], [0, 7], [1, 8], [2, 10], [22, 7], [23, 7], [22, 8], [21, 10]];
    for (const [x, y] of tips) s.recolor(x, y, D);
    hdL_tex(s, [wl, wr], (x, y) => (up ? (Math.abs(x - 12) + y) % 3 === 0 && Math.abs(x - 12) > 4 : (Math.abs(x - 12) % 3 === 0 && y > 7 && Math.abs(x - 12) > 3)) ? -1 : 0);
    hdL_eye(s, 13, 12, 2, 2, c.eye);
}
hdL_reg(['robin', 'bluebird', 'sparrow'].flatMap(k => ['stand', 'peck', 'fly0', 'fly1'].map(p => ['cr_' + k + '_' + p, 8, 6, 4, 5, k, p])), hdL_bird);

/* ---------------------------------------------------------------- the gull: standing on the beach, wheeling overhead */
/* standing (24x18, facing right, a grey wing folded on the white body), or flying (24x15) seen from the front with the
   wings up (fly0) or level (fly1), grey at the tips */
function hdL_gull(s, pose) {
    const W = hdL_WHITE, GR = hdPal('#4c5468', '#6f7a8e', '#8a96a8', '#a3aebe', '#bcc5d2'), K = hdL_soft('#f2b43a', 0.8);
    if (pose === 'stand') {
        const tail = s.add(W, { layer: 0, R: 1.5, grad: 0.1, bias: 0.06 });
        const body = s.add(W, { layer: 1, R: 4.5, grad: 0.16, k: 1.2, bias: 0.07 });
        const head = s.add(W, { layer: 2, R: 3.5, grad: 0.16, k: 1.2, bias: 0.07 });
        const wing = s.add(GR, { layer: 3, R: 2, grad: 0.2 });
        const beak = s.add(K, { layer: 4, R: 1, grad: 0 });
        s.poly(tail, [[6, 9], [1.5, 9.2], [0, 10], [0.4, 12.2], [6, 13]]);
        s.ellipse(body, 9.8, 10.6, 7.6, 4.4);
        s.ellipse(head, 12.6, 4.4, 4.5, 4.1);
        hdL_lens(s, wing, 13.2, 9.4, 3.6, 11.2, 2.1, 0.4, -0.4);
        s.poly(beak, [[16.2, 5.4], [18.6, 5.6], [21.6, 6.8], [18.6, 8.2], [16.2, 8]]);
        /* the darker tip of the folded wing, the feather edges, the red spot on the beak */
        hdL_patch(s, [wing], hdPal('#2c3040', '#3e4456', '#525a6e', '#687286', '#7e889c'), (x) => x < 5.5);
        hdL_tex(s, [wing], (x, y) => (x > 6 && x < 12 && (x + y) % 3 === 0 && y > 9 ? -1 : 0));
        s.px(19, 7, '#d8505a');
        hdL_eye(s, 14, 3, 2, 2, '#1a1e2a');
        for (const x of [7, 13]) { s.px(x, 15, K[1]); s.px(x, 16, K[1]); s.px(x - 1, 17, K[1]); s.px(x, 17, K[2]); s.px(x + 1, 17, K[2]); }
        return;
    }
    const up = pose === 'fly0';
    const wl = s.add(W, { layer: 0, R: 2, grad: 0.25 }), wr = s.add(W, { layer: 0, R: 2, grad: 0.25 });
    const body = s.add(W, { layer: 1, R: 2.6, grad: 0.2 });
    const head = s.add(W, { layer: 2, R: 2, grad: 0.15, cast: 1 });
    const beak = s.add(K, { layer: 3, R: 1, grad: 0 });
    if (up) {
        s.poly(wl, [[10.5, 6.6], [6.5, 3.6], [1.2, 0], [0, 0.8], [0, 3], [1.8, 5.4], [5, 8], [8.6, 9.6], [10.5, 9.8]]);
        s.poly(wr, [[13.5, 6.6], [17.5, 3.6], [22.8, 0], [24, 0.8], [24, 3], [22.2, 5.4], [19, 8], [15.4, 9.6], [13.5, 9.8]]);
    } else {
        s.poly(wl, [[10.5, 6.6], [5.5, 6.3], [0.4, 6.4], [0, 7.6], [0.8, 9], [2.4, 11.2], [3.8, 10.8], [5, 9.6], [8, 9.8], [10.5, 10]]);
        s.poly(wr, [[13.5, 6.6], [18.5, 6.3], [23.6, 6.4], [24, 7.6], [23.2, 9], [21.6, 11.2], [20.2, 10.8], [19, 9.6], [16, 9.8], [13.5, 10]]);
    }
    s.ellipse(body, 12, 9.2, 4.4, 2.7);
    s.ellipse(head, 14.2, 9.7, 2.4, 2.2);
    s.poly(beak, [[16, 9], [18.8, 10], [16, 11]]);
    /* grey along the wings, darker at the tips (today's grey edges) */
    hdL_patch(s, [wl, wr], GR, (x, y) => up ? Math.abs(x - 11.5) > 7.5 - y * 0.2 && y < 6 + (Math.abs(x - 11.5) > 9 ? 3 : 0) : Math.abs(x - 11.5) > 8.5);
    hdL_patch(s, [wl, wr], hdPal('#2c3040', '#3e4456', '#525a6e', '#687286', '#7e889c'), (x, y) => up ? Math.abs(x - 11.5) > 9.5 && y < 3 : Math.abs(x - 11.5) > 10);
    s.px(15, 9, '#1a1e2a');
}
hdL_reg([['cr_gull_stand', 8, 6, 4, 5, 'stand'], ['cr_gull_fly0', 8, 5, 4, 4, 'fly0'], ['cr_gull_fly1', 8, 5, 4, 4, 'fly1']], hdL_gull);

/* ---------------------------------------------------------------- the duck on the pond */
/* a duck with a green head and a fawn body, facing right, sitting in a ring of ripples; frame 1 bobs: the tail dips and
   the ripple spreads */
function hdL_duck(s, f) {
    const BODY = hdPal('#6e604c', '#b8a890', '#d8c8b0', '#e6d9c4', '#f2e9d8'), WING = hdPal('#5e5240', '#9e8e74', '#b8a890', '#ccbea6', '#ddd1bc');
    const HEAD = hdPal('#173d26', '#2f7a4a', '#3f9a5a', '#55b06c', '#78c888'), K = hdL_soft('#f2b43a', 0.8);
    const WAT = hdPal('#4f9cc4', '#72b8de', '#8fd0f0', '#b4e2f8', '#e2f6ff');
    const body = s.add(BODY, { layer: 1, R: 4, grad: 0.22, k: 1.3 });
    const wing = s.add(WING, { layer: 2, R: 2, grad: 0.2 });
    const head = s.add(HEAD, { layer: 3, R: 3, grad: 0.15, k: 1.3 });
    const bill = s.add(K, { layer: 4, R: 1, grad: 0 });
    const rip = s.add(WAT, { layer: 5, R: 1.5, flat: 1, grad: 0.3 });
    s.ellipse(body, 10.6, 12.4, 9.4, 3.9);
    s.poly(body, f ? [[5, 10.6], [1.6, 10.4], [0.4, 11.6], [2, 13.6], [5, 14]] : [[5, 10], [1.2, 8.4], [0, 9.4], [1.6, 12.6], [5, 13.6]]);
    hdL_lens(s, wing, 16.4, 11.2, 3.4, 11.4, 2.1, 0.4, -0.6);
    s.line(head, 11.2, 10, 11.6, 6.4, 2.8, 3);
    s.ellipse(head, 11.8, 4.2, 4.7, 4);
    s.poly(bill, [[15, 4.8], [18.2, 5.4], [19.6, 6.6], [18.6, 7.8], [15, 7.8]]);
    /* the ripple the duck sits in: a band at the waterline with a bright crest, wider when she bobs */
    const x0 = f ? 0.5 : 3, x1 = 21.5;
    s.poly(rip, [[x0, 16], [x0 + 2, 14.8], [(x0 + x1) / 2, 14.4], [x1 - 2, 14.8], [x1, 16], [x1 - 2, 17.6], [x0 + 2, 17.6]]);
    hdL_tex(s, [rip], (x, y) => (y === 15 && (x + (f ? 1 : 0)) % 4 !== 0 ? 1 : y === 17 && (x + (f ? 2 : 0)) % 5 === 0 ? -1 : 0));
    /* a white collar, the blue band on the wing, the green head's sheen, the nail of the bill */
    for (let x = 9; x <= 14; x++) if (s.at(x, 9) === head) s.recolor(x, 9, hdL_WHITE);
    for (const [x, y] of [[6, 12], [7, 12]]) s.recolor(x, y, hdPal('#2e3a66', '#4a5c9e', '#6a80c0', '#8498d0', '#a0b2e0'));
    hdL_tex(s, [wing], (x, y) => (x < 9 && (x + y) % 3 === 0 && y > 11 ? -1 : 0));
    hdL_eye(s, 14, 3, 2, 2, '#1a1210');
    s.px(19, 7, K[1]);
}
hdL_reg([['cr_duck_0', 8, 6, 4, 5, 0], ['cr_duck_1', 8, 6, 4, 5, 1]], hdL_duck);

/* ---------------------------------------------------------------- the squirrel */
const hdL_SQ = {
    stand: { tail: [[15, 17.5, 11.6, 11.5, 2.6, 3.6], [11, 11, 9.4, 6.4, 3.6, 5.4]], top: [9.8, 4.9, 6.8, 4.5], body: [22.4, 17.4, 7.2, 4.8], head: [24.8, 11.6], ears: [[21.8, 8.8, 21.2, 4.6], [24.8, 8.4, 25.4, 4.4]], feet: [[17.4, 21.6, 3, 1.3], [25.4, 21.8, 2, 1.1]], legs: [], up: 1 },
    run0: { tail: [[13, 11.5, 9, 6, 2.8, 4]], top: [5.6, 3, 6.2, 3.2], body: [17.4, 13.4, 8.6, 4.4], head: [27, 11.4], ears: [[22.6, 8.6, 22.2, 5], [25, 8.2, 25.4, 4.8]], feet: [[12.4, 19.4, 2.2, 1.2], [28.6, 19.4, 2.2, 1.2]], legs: [[12.6, 15, 12.6, 18.6, 1.8], [24.6, 15, 28, 18.6, 1.6]] },
    run1: { tail: [[11.6, 12, 8, 8.4, 2.8, 3.8]], top: [6, 6.2, 6.6, 3], body: [16, 13.6, 9.8, 4.4], head: [27, 11.4], ears: [[22, 8.8, 20.6, 5.6], [24.4, 8.4, 23.4, 5.2]], feet: [[9.8, 19.4, 2.2, 1.2], [30.8, 19.4, 2.2, 1.2]], legs: [[11.4, 15.4, 10, 18.6, 1.8], [25, 15, 30.4, 18.6, 1.6]] },
};
/* a red squirrel facing right (36x24): sitting up with its tail curled over its back, or bounding with the tail
   streaming behind (run0, run1: same head, the body and legs stretched in turn) */
function hdL_squirrel(s, pose) {
    const P = hdL_SQ[pose];
    const FUR = hdPal('#5a2a12', '#a8582a', '#c8703a', '#d98a4e', '#e8a262'), DK = hdPal('#3e1c0c', '#6e3818', '#8a4a22', '#a25e30', '#b8723e');
    const TAILIN = hdPal('#4e240e', '#904a22', '#a8582a', '#bc6c38', '#cc7e46'), CREAM = hdPal('#8a6a4e', '#dcc0a0', '#f2dcc0', '#f8e8d4', '#fff4e6');
    const tail = s.add(FUR, { layer: 0, R: 4, grad: 0.25, k: 1.1 });
    const legs = s.add(DK, { layer: 1, R: 1, grad: 0 });
    const body = s.add(FUR, { layer: 2, R: 4, grad: 0.22, k: 1.3 });
    const head = s.add(FUR, { layer: 3, R: 3.5, grad: 0.2, k: 1.3, cast: 1 });
    const ears = s.add(DK, { layer: 4, R: 1, grad: 0.2, bias: 0.1 });
    const feet = s.add(DK, { layer: 4, R: 1, grad: 0.1 });
    /* the tail: a fluffy plume, its edge tufted, the inner side (toward the body) darker */
    for (const [x0, y0, x1, y1, r0, r1] of P.tail) s.line(tail, x0, y0, x1, y1, r0, r1);
    const [tx, ty, trx, try_] = P.top;
    for (let y = 0; y < 24; y++) for (let x = 0; x < 36; x++) {
        const u = (x + 0.5 - tx) / trx, v = (y + 0.5 - ty) / try_, n = (hdL_h(Math.floor(x / 2), Math.floor(y / 2), 7) - 0.5) * 0.35;
        if (u * u + v * v < 1 + n) s.plot(tail, x, y);
    }
    for (const [x0, y0, x1, y1, w] of P.legs) s.line(legs, x0, y0, x1, y1, w, w * 0.8);
    const [bx, by, brx, bry] = P.body;
    s.ellipse(body, bx, by, brx, bry);
    if (P.up) s.ellipse(body, 18.6, 18.6, 4, 3.2);
    const [hx, hy] = P.head;
    s.ellipse(head, hx, hy, 5.2, 4.3);
    s.ellipse(head, hx + 3.9, hy + 1, 3.1, 2.5);
    for (const [x0, y0, x1, y1] of P.ears) hdL_lens(s, ears, x0, y0, x1, y1, 1.7, 0.35);
    for (const [x, y, rx, ry] of P.feet) s.ellipse(feet, x, y, rx, ry);
    if (P.up) { const paw = s.add(DK, { layer: 4, R: 1, bias: 0.15 }); s.ellipse(paw, 27.6, 16.8, 1.6, 1.3); }
    /* the inner side of the tail, fur strands along it */
    hdL_patch(s, [tail], TAILIN, (x, y) => P.up ? (x > 11 && y < 9 && x - 11 > (9 - y) * 0.3) || (y >= 9 && x > 10.5 + (y - 9) * 0.3) : y > ty + 1.5 + (tx - x) * 0.25);
    hdL_tex(s, [tail], (x, y) => ((x * 2 + y * (P.up ? 1 : 3)) % 6 === 0 && hdL_h(x, y, 3) < 0.6 ? -1 : 0));
    /* the cream belly and chin, the face: eye, pink nose, mouth, pink inside the ears */
    hdL_patch(s, [body], CREAM, (x, y) => P.up ? hdL_in(x, y, 23.4, 18.8, 3, 3.6) : hdL_in(x, y, bx + 2, by + 3, brx * 0.55, 1.8));
    hdL_patch(s, [head], CREAM, (x, y) => hdL_in(x, y, hx + 3.4, hy + 3, 2.8, 1.4));
    hdL_eye(s, hx, hy - 0.6, 2, 3, '#1a1210');
    s.px(hx + 6.6, hy - 0.4, '#e8a080'); s.px(hx + 6.6, hy + 0.6, '#c8806a'); s.px(hx + 5.6, hy + 2, '#8a4a30');
    for (const [x0, y0, x1, y1] of P.ears) s.px(Math.round((x0 * 0.6 + x1 * 0.4)), Math.round((y0 * 0.6 + y1 * 0.4)), '#e89a7a');
}
hdL_reg([['cr_squirrel_stand', 12, 8, 6, 7, 'stand'], ['cr_squirrel_run0', 12, 8, 6, 7, 'run0'], ['cr_squirrel_run1', 12, 8, 6, 7, 'run1']], hdL_squirrel);

/* ---------------------------------------------------------------- the rabbit */
const hdL_RB = {
    sit:  { head: [9.4, 9.4], ears: [[8.6, 6.4, 7.4, 0.4, 2], [13, 6.6, 13.6, 0.6, 1.8]], body: [[15.6, 13.4, 7.6, 4.8], [17.8, 14.6, 5, 3.6]], tail: [22.4, 12.2], paws: [[8.8, 18.6, 2.4, 1.3], [11.6, 18.8, 2.2, 1.2]], hind: [17.6, 19, 3.6, 1.4], bib: [12.6, 15.4], legs: [] },
    hop0: { head: [12.4, 9.2], ears: [[11.6, 6.2, 10.4, 0.4, 2], [16, 6.4, 16.6, 0.6, 1.8]], body: [[12.6, 13.6, 9.6, 3.8], [17, 13.4, 5.2, 3.6]], tail: [22.6, 11.6], paws: [[1.6, 19.2, 1.6, 1.1]], hind: [19.2, 19.2, 1.8, 1.2], bib: [7.4, 15.6], legs: [[5.6, 14.6, 1.8, 18.6, 1.5], [17.6, 15.6, 19, 18.6, 1.5]] },
    hop1: { head: [8.4, 10.4], ears: [[10.4, 7.4, 13.6, 2, 1.9], [13, 7.8, 18.6, 3.8, 1.8]], body: [[12.4, 13.2, 11, 3.8], [18, 13.2, 4.4, 3]], tail: [22.8, 11], paws: [], hind: null, bib: [4.6, 15.4], legs: [[4, 15.4, 1.6, 17, 1.4], [19, 15, 22, 16, 1.4]] },
};
/* a pale rabbit facing left (24x21): sitting, then a hop in two frames (landing with the forepaws out, then in the air
   with the ears laid back) */
function hdL_rabbit(s, pose) {
    const P = hdL_RB[pose];
    const FUR = hdPal('#5e5246', '#aea090', '#d8ccbc', '#e6dccf', '#f3ece2'), DK = hdPal('#3e342c', '#6e6254', '#8a7a6a', '#a09080', '#b4a696');
    const WW = hdPal('#7a7064', '#d6cec4', '#f2eee8', '#faf8f4', '#ffffff');
    const tail = s.add(WW, { layer: 0, R: 1.5, grad: 0.1 });
    const legs = s.add(FUR, { layer: 1, R: 1, grad: 0 });
    const body = s.add(FUR, { layer: 2, R: 4.5, grad: 0.2, k: 1.25, bias: 0.05 });
    const haunch = s.add(FUR, { layer: 3, R: 3, grad: 0.2, k: 1.15, bias: 0.04 });
    const feet = s.add(FUR, { layer: 3, R: 1, grad: 0.1 });
    const head = s.add(FUR, { layer: 4, R: 3.5, grad: 0.2, k: 1.25, cast: 1 });
    const earB = s.add(FUR, { layer: 1, R: 1.5, grad: 0.15, bias: -0.06 }), earF = s.add(FUR, { layer: 5, R: 1.5, grad: 0.15 });
    s.ellipse(tail, P.tail[0], P.tail[1], 2.2, 2);
    for (const [x0, y0, x1, y1, w] of P.legs) s.line(legs, x0, y0, x1, y1, w, w * 0.8);
    s.ellipse(body, ...P.body[0]);
    s.ellipse(haunch, ...P.body[1]);
    for (const p of P.paws) s.ellipse(feet, ...p);
    if (P.hind) s.ellipse(feet, ...P.hind);
    const [hx, hy] = P.head;
    s.ellipse(head, hx, hy, 5.6, 4.5);
    s.ellipse(head, hx - 3.4, hy + 1.4, 2.8, 2.6);
    P.ears.forEach(([x0, y0, x1, y1, w], i) => hdL_lens(s, i ? earB : earF, x0, y0, x1, y1, w, 0.45));
    /* dark tips on the ears (today's), pink inside the near one, the white bib and paws, a pale muzzle */
    for (const [x0, y0, x1, y1] of P.ears) hdL_patch(s, [earB, earF], DK, (x, y) => Math.hypot(x + 0.5 - x1, y + 0.5 - y1) < 1.8);
    const [e0x, e0y, e1x, e1y] = P.ears[0];
    for (let t = 0.3; t <= 0.72; t += 0.1) s.px(Math.round(e0x + (e1x - e0x) * t - 0.2), Math.round(e0y + (e1y - e0y) * t), '#e8b4aa');
    hdL_patch(s, [body, legs, feet, head], WW, (x, y) => hdL_in(x, y, P.bib[0], P.bib[1], 2.4, 2.6));
    hdL_patch(s, [head], hdPal('#6e6458', '#c8bcae', '#ebe3d8', '#f5f0e8', '#ffffff'), (x, y) => hdL_in(x, y, hx - 3.6, hy + 2.4, 2.6, 1.8));
    hdL_tex(s, [haunch], (x, y) => (Math.abs(Math.hypot(x - P.body[1][0], (y - P.body[1][1]) * 1.3) - 3.4) < 0.5 && x < P.body[1][0] && y > P.body[1][1] ? -1 : 0));
    hdL_eye(s, hx - 3, hy - 1, 2, 3, '#1a1210');
    s.px(hx - 6.4, hy + 1.4, '#e89a9a');
}
hdL_reg([['cr_rabbit_sit', 8, 7, 4, 6, 'sit'], ['cr_rabbit_hop0', 8, 7, 4, 6, 'hop0'], ['cr_rabbit_hop1', 8, 7, 4, 6, 'hop1']], hdL_rabbit);

/* ---------------------------------------------------------------- the owl */
/* a round brown owl facing us (24x24) with ear tufts, big yellow eyes in pale facial discs, a cream breast; blinking */
function hdL_owl(s, blink) {
    const F = hdPal('#3a2a20', '#76583c', '#9a7450', '#b08a62', '#c4a078'), DK = hdPal('#2a1c14', '#4a3426', '#5a4030', '#6e5038', '#826244');
    const DISC = hdPal('#5a4632', '#a08868', '#bea27e', '#cfb692', '#dcc6a4'), CH = hdPal('#7a6a52', '#cdbda2', '#e8d8c0', '#f2e6d4', '#faf2e6');
    const body = s.add(F, { layer: 1, R: 7, grad: 0.22, k: 1.2 });
    const tufts = s.add(F, { layer: 0, R: 1.5, grad: 0.1 });
    const wl = s.add(DK, { layer: 2, R: 2.5, grad: 0.2, bias: 0.06 }), wr = s.add(DK, { layer: 2, R: 2.5, grad: 0.2, bias: 0.06 });
    const beak = s.add(hdL_soft('#e8a040', 0.8), { layer: 3, R: 1, grad: 0 });
    for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) { const u = Math.abs((x + 0.5 - 12) / 11.8), v = Math.abs((y + 0.5 - 12.2) / 9.4); if (Math.pow(u, 2.6) + Math.pow(v, 2.4) <= 1) s.plot(body, x, y); }
    hdL_lens(s, tufts, 6.4, 5.6, 4, 0.3, 1.9, 0.3);
    hdL_lens(s, tufts, 17.6, 5.6, 20, 0.3, 1.9, 0.3);
    hdL_lens(s, wl, 2.4, 8.6, 5.4, 20.6, 2.6, 0.45, 0.6);
    hdL_lens(s, wr, 21.6, 8.6, 18.6, 20.6, 2.6, 0.45, -0.6);
    s.poly(beak, [[10.4, 12.2], [13.6, 12.2], [12.6, 14.6], [12, 15.6], [11.4, 14.6]]);
    /* the facial discs, the cream breast with little dark chevrons, feather scallops on the wings */
    hdL_patch(s, [body], DISC, (x, y) => hdL_in(x, y, 7.6, 9, 4.6, 4.2) || hdL_in(x, y, 16.4, 9, 4.6, 4.2));
    hdL_patch(s, [body], CH, (x, y) => hdL_in(x, y, 12, 18.6, 4.6, 4.6) && y > 14);
    for (const [x, y] of [[10, 17], [11, 18], [13, 17], [14, 18], [11, 20], [12, 21], [13, 20]]) s.mod(x, y, -1);
    hdL_tex(s, [wl, wr], (x, y) => (y % 3 === 0 && y > 10 ? -1 : 0));
    if (blink) {
        /* shut: a soft dark lid line curving down, lashes at the ends */
        for (const cx of [7.5, 16.5]) for (const [dx, dy] of [[-2, -0.4], [-1, 0.4], [0, 0.6], [1, 0.4], [2, -0.4]]) s.px(Math.round(cx + dx - 0.5), Math.round(9.6 + dy), '#2a1810');
    } else {
        for (const cx of [7.5, 16.5]) {
            for (let y = 5; y < 13; y++) for (let x = 3; x < 21; x++) {
                const d = Math.hypot(x + 0.5 - cx, (y + 0.5 - 9) * 1.05);
                if (d < 2.9) s.px(x, y, d > 2.2 ? '#c89a2a' : y < 8 ? '#ffe680' : '#ffd84a');
                if (Math.hypot(x + 0.5 - cx, y + 0.5 - 9.7) < 1.75) s.px(x, y, '#1a1210');
            }
            s.px(Math.round(cx - 1.5), 8, '#ffffff');
        }
    }
    /* the feet: three little toes each */
    for (const x of [6, 15]) { s.px(x, 21, '#c8862e'); s.px(x + 1, 21, '#e8a040'); s.px(x + 2, 21, '#c8862e'); s.px(x, 22, '#9a6020'); s.px(x + 1, 22, '#c8862e'); s.px(x + 2, 22, '#9a6020'); }
}
hdL_reg([['cr_owl_sit', 8, 8, 4, 7, 0], ['cr_owl_blink', 8, 8, 4, 7, 1]], hdL_owl);

/* ---------------------------------------------------------------- the deer */
/* a stag facing left (48x36): standing, or the running stride (51 wide: the back hoof reaches past the frame) with the
   head a step lower; the body stays put, so stand and run0 make the gallop. Legs: [x0, y0, x1, y1, x2, y2] hip to knee
   (or hock) to hoof, the far ones darker */
const hdL_DEER = {
    stand: { dy: 0, far: [[22, 24, 22.4, 29, 22, 33], [43.4, 22, 44.6, 28.4, 43.6, 33]], near: [[16, 24, 16.4, 29, 16, 33], [37.4, 22, 38.6, 28.4, 37.6, 33]] },
    run0:  { dy: 3, far: [[22, 24, 25, 30, 28.6, 33.4], [37, 22, 34.4, 29.6, 31.4, 33.4]], near: [[15.4, 24, 12.6, 29.6, 10, 33.4], [43.6, 22, 46.4, 29, 49.4, 33.4]] },
};
function hdL_deer(s, pose) {
    const P = hdL_DEER[pose], dy = P.dy;
    const FUR = hdPal('#4a2e18', '#9a6a3e', '#b88450', '#c99a64', '#d8ae7a'), BACK = hdPal('#3e2614', '#74492a', '#8a5a32', '#a06c40', '#b07c4c');
    const BELLY = hdPal('#6a4a2e', '#c09468', '#d8b088', '#e2c09c', '#ecd0b0'), CREAM = hdPal('#8a7a60', '#dccab0', '#f2e2c8', '#f8eedc', '#fff8ec');
    const ANT = hdPal('#3e2e20', '#6e5238', '#8a6a4a', '#a8865e', '#c4a47a'), HOOF = hdPal('#141010', '#221a18', '#2a1e1a', '#3e302a', '#52423a');
    const farL = s.add(FUR, { layer: 0, R: 1.2, grad: 0.1, bias: -0.12 }), nearL = s.add(FUR, { layer: 1, R: 1.4, grad: 0.1 });
    const hoofF = s.add(HOOF, { layer: 0, R: 1 }), hoofN = s.add(HOOF, { layer: 1, R: 1 });
    const body = s.add(FUR, { layer: 2, R: 7, grad: 0.24, k: 1.05 });
    const tail = s.add(FUR, { layer: 3, R: 1, grad: 0.1 });
    const antB = s.add(ANT, { layer: 3, R: 1, grad: 0.1, bias: -0.1 }), antF = s.add(ANT, { layer: 4, R: 1, grad: 0.1 });
    const neck = s.add(FUR, { layer: 4, R: 3.5, grad: 0.15, k: 1.2 });
    const head = s.add(FUR, { layer: 5, R: 3.2, grad: 0.2, k: 1.25 });
    const ear = s.add(FUR, { layer: 6, R: 1.2, grad: 0.1, bias: -0.04 });
    const leg = (id, hf, [x0, y0, x1, y1, x2, y2], back) => {
        s.line(id, x0, y0, x1, y1, back ? 2.6 : 1.8, 1.25); s.line(id, x1, y1, x2, y2, 1.2, 1);
        s.poly(hf, [[x2 - 1.6, y2 - 0.2], [x2 + 1.6, y2 - 0.2], [x2 + 1.9, y2 + 2.8], [x2 - 1.9, y2 + 2.8]]);
    };
    P.far.forEach((l, i) => leg(farL, hoofF, l, i === 1));
    P.near.forEach((l, i) => leg(nearL, hoofN, l, i === 1));
    /* the body: one rounded barrel, a little deeper at the chest and the rump */
    for (let y = 14; y < 28; y++) for (let x = 12; x < 48; x++) {
        const t = (x + 0.5 - 12.4) / 35.2, top = 15.6 - Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 0.72) / 0.28))) * 0.6, bot = 26.6 - Math.sin(Math.PI * t) * 0.4 + (t < 0.25 ? 0.4 : 0);
        const ex = Math.max(0, 5.4 - (x + 0.5 - 12.4), (x + 0.5 - 12.4) - 35.2 + 5.4), cy = (top + bot) / 2, hh = (bot - top) / 2;
        if (t >= 0 && t <= 1 && Math.abs(y + 0.5 - cy) <= hh * Math.sqrt(Math.max(0, 1 - Math.pow(ex / 5.4, 2)))) s.plot(body, x, y);
    }
    hdL_lens(s, tail, 45, 19.4, 47.6, 16.4, 1.4, 0.4);
    s.line(neck, 20.6, 19.4, 15.8, 12.6 + dy, 4.6, 3.4);
    s.line(antB, 19.4, 7.6 + dy, 16.2, 0.6 + dy, 1, 0.8); s.line(antB, 17.8, 4.2 + dy, 20.2, 2.2 + dy, 0.8, 0.7);
    s.line(antF, 10.8, 7.6 + dy, 7.2, 0.6 + dy, 1, 0.8); s.line(antF, 9, 4.2 + dy, 11.4, 2.2 + dy, 0.8, 0.7);
    s.ellipse(head, 14.6, 10.4 + dy, 4.5, 3.8);
    s.ellipse(head, 9.8, 12.7 + dy, 3.5, 2.4);
    hdL_lens(s, ear, 17.6, 8.6 + dy, 22.8, 6 + dy, 1.7, 0.45);
    /* the darker back, the paler belly, the white throat and rump (today's two light spots), the tail's white under */
    const top = (x, y) => { for (let d = 1; d <= 3; d++) if (s.at(x, y - d) < 0) return true; return false; };
    const under = (x, y) => { for (let d = 1; d <= 2; d++) if (s.at(x, y + d) !== body) return true; return false; };
    hdL_patch(s, [body], BACK, (x, y) => top(x, y) && s.at(x, y - 2) < 0 && x > 21);
    hdL_patch(s, [body], BELLY, (x, y) => under(x, y) && s.at(x, y + 1) === body && x > 24 && x < 38 && y > 24);
    hdL_patch(s, [body, neck], CREAM, (x, y) => hdL_in(x, y, 18.6, 22.4, 1.9, 2.1));
    hdL_patch(s, [body], CREAM, (x, y) => hdL_in(x, y, 45.6, 21.4, 2.2, 2.5));
    hdL_patch(s, [tail], CREAM, (x, y) => x < 46 && y > 17);
    /* the face: a dark wet nose, the mouth, the eye with its glint, pink inside the ear */
    hdL_patch(s, [head], hdPal('#3a2a1e', '#6e5038', '#8a6a4a', '#9e7c58', '#b08e68'), (x, y) => x < 8);
    s.px(6, 12 + dy, '#2a1e1a'); s.px(6, 13 + dy, '#2a1e1a'); s.px(7, 12 + dy, '#3e2c22');
    s.px(8, 14 + dy, '#6a4a30'); s.px(9, 14 + dy, '#6a4a30');
    hdL_eye(s, 12, 9 + dy, 2, 3, '#2a1e1a');
    s.px(19, 8 + dy, '#d8a08a'); s.px(20, 7 + dy, '#d8a08a');
}
hdL_reg([['cr_deer_stand', 16, 12, 8, 11, 'stand'], ['cr_deer_run0', 17, 12, 8, 11, 'run0']], hdL_deer);

/* ---------------------------------------------------------------- the crab */
/* a red beach crab facing us (24x15): claws up and open (0), then out to the sides and shut (1), legs scuttling */
function hdL_crab(s, f) {
    const SHELL = hdPal('#5a1a14', '#b0362a', '#e8604a', '#f07e64', '#f8a086'), CL = hdPal('#4a1410', '#8a2a20', '#c0392b', '#d8543e', '#e87058');
    const legs = s.add(CL, { layer: 0, R: 1, grad: 0 });
    const arms = s.add(CL, { layer: 1, R: 1, grad: 0.1 });
    const claws = s.add(CL, { layer: 2, R: 1.5, grad: 0.15, bias: 0.06 });
    const shell = s.add(SHELL, { layer: 3, R: 4, grad: 0.25, k: 1.3 });
    for (const m of [1, -1]) {
        const X = x => m > 0 ? x : 24 - x;
        if (!f) {
            s.line(legs, X(5.6), 10, X(2.6), 10.6, 0.8); s.line(legs, X(2.6), 10.6, X(1.2), 14, 0.8, 0.6);
            s.line(legs, X(8.4), 11, X(7.2), 14, 0.8, 0.6);
            s.line(arms, X(5), 7.6, X(4), 4.6, 1.1);
            s.ellipse(claws, X(4.1), 4, 3, 1.7);
            hdL_lens(s, claws, X(2.2), 4.2, X(1.2), 0.2, 1.2, 0.4);
            hdL_lens(s, claws, X(6), 4.2, X(7.2), 0.2, 1.1, 0.4);
        } else {
            s.line(legs, X(6), 10.6, X(4), 14, 0.8, 0.6);
            s.line(legs, X(9.6), 11.4, X(10.4), 14, 0.8, 0.6);
            s.line(arms, X(4.6), 7.8, X(1.4), 5.4, 1.1);
            s.ellipse(claws, X(2.6), 3.4, 2.2, 2.9);
            hdL_lens(s, claws, X(3.4), 2.6, X(4.4), 0.2, 1.1, 0.4);
        }
    }
    s.ellipse(shell, 12, 7.8, 8.4, 4.4);
    /* the pincers' gap, the shell's rim and a few bumps, the eyes and a little smile */
    if (f) for (const x of [2, 21]) { s.mod(x, 1, -1); s.mod(x, 2, -1); }
    hdL_tex(s, [shell], (x, y) => ((x === 6 && y === 5) || (x === 17 && y === 5) || (x === 12 && y === 4) ? 1 : y === 11 && x > 6 && x < 18 ? -1 : 0));
    hdL_eye(s, 7, 6, 2, 2, '#1a1210');
    hdL_eye(s, 15, 6, 2, 2, '#1a1210');
    s.px(11, 9, '#7a2018'); s.px(12, 9, '#7a2018'); s.px(10, 8, '#9a2c22'); s.px(13, 8, '#9a2c22');
}
hdL_reg([['cr_crab_0', 8, 5, 4, 4, 0], ['cr_crab_1', 8, 5, 4, 4, 1]], hdL_crab);

/* ---------------------------------------------------------------- the frog */
/* a green pond frog facing us (24x15): sitting with its eyes up on top, or mid-jump with its arms up and legs out */
function hdL_frog(s, jump) {
    const GR = hdPal('#1e4a1c', '#3e8a38', '#6cc063', '#86d27a', '#a6e294'), BE = hdPal('#4a7a3a', '#86c870', '#9be083', '#b4eca0', '#d0f6c0');
    const DG = hdPal('#173a16', '#2f6a2a', '#3e7e36', '#529446', '#66a858');
    const limbs = s.add(GR, { layer: 0, R: 1.2, grad: 0.1, bias: -0.08 });
    const body = s.add(GR, { layer: 1, R: 4.5, grad: 0.25, k: 1.3 });
    const bumps = s.add(GR, { layer: 2, R: 2.6, grad: 0.2, k: 1.3 });
    const hands = s.add(GR, { layer: 3, R: 1, grad: 0.05 });
    for (const m of [1, -1]) {
        const X = x => m > 0 ? x : 24 - x;
        if (jump) {
            s.line(limbs, X(5.6), 6.6, X(1.8), 1.8, 1.5, 1.1); s.ellipse(hands, X(1.4), 1.3, 1.5, 1.2);
            s.line(limbs, X(5.6), 10.4, X(1.8), 13.2, 1.8, 1.2); s.ellipse(hands, X(1.5), 13.6, 1.7, 1.1);
        } else {
            s.ellipse(limbs, X(3.6), 10.6, 3.4, 2.6);
            s.ellipse(hands, X(3.8), 13.4, 2.6, 1.1);
            s.ellipse(hands, X(10), 13.2, 1.7, 1.1);
        }
        s.ellipse(bumps, X(7.5), 3.8, 3.3, 3.3);
    }
    s.ellipse(body, 12, jump ? 8.4 : 8.6, jump ? 9.4 : 10.4, jump ? 4.4 : 4.8);
    /* the pale belly, darker spots on the back, the wide smile */
    hdL_patch(s, [body], BE, (x, y) => hdL_in(x, y, 12, jump ? 11.4 : 11.6, jump ? 5 : 6.4, 2.8));
    for (const [x, y] of [[4, 7], [5, 7], [4, 8], [19, 7], [18, 7], [19, 8]]) s.recolor(x, y, DG);
    s.px(11, 6, '#2f5a26'); s.px(13, 6, '#2f5a26');
    for (let x = 8; x <= 15; x++) s.px(x, x === 8 || x === 15 ? 8 : 9, '#2f5a26');
    /* the eyes: dark, round, a glint each, on top of the bumps */
    for (const cx of [6, 15]) for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) if (!((i === 0 || i === 3) && (j === 0 || j === 3))) s.px(cx + i, 2 + j, i === 1 && j === 1 ? '#ffffff' : '#14200f');
}
hdL_reg([['cr_frog_sit', 8, 5, 4, 4, 0], ['cr_frog_jump', 8, 5, 4, 4, 1]], hdL_frog);

/* ---------------------------------------------------------------- butterflies */
/* tiny (15x12): wings open (0) and edge-on (1), flapped in turn; yellow, pink, blue and a cabbage white */
const hdL_BF = [['#ffd84a', '#ffe480'], ['#ff9ec0', '#ffbbd3'], ['#9fd8ef', '#bce4f4'], ['#ffffff', '#ffffff']];
function hdL_butterfly(s, k, f) {
    const [c0, c1] = hdL_BF[k], W = k === 3 ? hdPal('#8a8496', '#d8d4e0', '#f4f2f8', '#ffffff', '#ffffff') : hdL_soft(c0, 0.8);
    const fore = [s.add(W, { layer: 1, R: 1.5, grad: 0.25 }), s.add(W, { layer: 1, R: 1.5, grad: 0.25 })];
    const hind = [s.add(W, { layer: 0, R: 1.5, grad: 0.2, bias: -0.04 }), s.add(W, { layer: 0, R: 1.5, grad: 0.2, bias: -0.04 })];
    const mir = (pts, m) => pts.map(([x, y]) => [m ? 15 - x : x, y]);
    for (const m of [0, 1]) {
        if (!f) {
            s.poly(fore[m], mir([[7, 3.6], [3.4, 0.3], [1, 0], [0, 1.4], [0.4, 4.4], [2.4, 6.2], [7, 6.4]], m));
            s.poly(hind[m], mir([[7, 6], [3.6, 6.4], [1.8, 8.2], [0.2, 9.6], [0.6, 11.8], [3.4, 11.8], [5.4, 10.4], [7, 8.8]], m));
        } else {
            s.poly(fore[m], mir([[7, 3.2], [0.6, 3.4], [0, 4.4], [1, 5.8], [7, 6]], m));
            s.poly(hind[m], mir([[7, 5.6], [3.4, 6], [3.6, 7.8], [7, 8.6]], m));
        }
    }
    /* the light patch near the body (today's), a spot or tips by kind */
    if (!f) {
        const L = k === 3 ? W : hdL_soft(c1);
        hdL_patch(s, fore, L, (x, y) => hdL_in(x, y, 4.4, 3.8, 2.2, 1.6) || hdL_in(x, y, 10.6, 3.8, 2.2, 1.6));
        if (k === 3) hdL_patch(s, fore, hdPal('#3a3640', '#5a5664', '#7a7686', '#8e8a98', '#a29eac'), (x, y) => y < 2 && (x < 3 || x > 11));
        const spot = k === 0 ? '#e88a2a' : k === 1 ? '#ffffff' : k === 2 ? '#4a8ac0' : '#5a5664';
        s.px(3, 2, spot); s.px(11, 2, spot);
        if (k !== 3) { s.px(2, 10, spot); s.px(12, 10, spot); }
    }
    /* the body and the antennae */
    for (let y = 3; y <= (f ? 8 : 9); y++) s.px(7, y, y === 3 ? '#4a3a4a' : '#2a1e2a');
    s.px(6, 2, '#2a1e2a'); s.px(8, 2, '#2a1e2a'); s.px(5, 1, '#2a1e2a'); s.px(9, 1, '#2a1e2a');
}
hdL_reg([0, 1, 2, 3].flatMap(k => [0, 1].map(f => ['cr_butterfly' + k + '_' + f, 5, 4, 2, 3, k, f])), hdL_butterfly);

/* ---------------------------------------------------------------- out on the sea: the boats */
/* see-through pixels laid under the finished picture where it drew nothing (a wake round a hull): fn(x, y) gives
   [r, g, b, a] or nothing */
function hdL_under(s, fn) {
    const r0 = s.render.bind(s);
    s.render = (out, ox, OW) => {
        out = r0(out, ox, OW); OW = OW || s.w; ox = ox || 0;
        for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
            const o = (y * OW + ox + x) * 4; if (out[o + 3]) continue;
            const c = fn(x, y); if (c) { out[o] = c[0]; out[o + 1] = c[1]; out[o + 2] = c[2]; out[o + 3] = c[3]; }
        }
        return out;
    };
}
/* the wake a boat sits in (today's see-through white ring): foam broken along its rim, a softer fill, a fringe of
   bright foam where the hull meets the water and a faint darker edge below; hull = the part whose foot gets the foam */
function hdL_wake(s, cx, cy, rx, ry, hull, seed) {
    hdL_under(s, (x, y) => {
        const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry, d = Math.sqrt(u * u + v * v);
        if (d > 1.08) return null;
        if (d > 1) return v > 0.2 ? [40, 58, 92, 110] : null;
        for (let k = 1; k <= 3; k++) if (s.at(x, y - k) === hull) return k < 3 || hdL_h(x, y, seed) < 0.6 ? [255, 255, 255, 235] : [236, 248, 255, 170];
        if (d > 1 - 1.8 / ry) return hdL_h(x >> 1, y, seed) < 0.78 ? [250, 253, 255, 205] : [230, 244, 252, 120];
        if (Math.abs(d - 0.72) < 0.05 && hdL_h(x >> 2, y, seed + 1) < 0.55) return [236, 248, 255, 140];
        return [226, 242, 252, 90];
    });
}
const hdL_WOOD = { lite: hdPal('#5a3a20', '#9a6a3e', '#b98552', '#cc9a68', '#dcae7e'), mid: hdPal('#3e2414', '#6e4424', '#8a5a33', '#a06c40', '#b07c4c'),
    dark: hdPal('#2e1a0e', '#54341a', '#6b4424', '#7e5230', '#8e603a'), spar: hdPal('#2a1c14', '#46301f', '#5a4030', '#705038', '#846044') };
const hdL_SAIL = hdPal('#7a7488', '#d4d0dc', '#f2f0f4', '#fcfbfd', '#ffffff');
/* a sailboat (84x90): a wooden hull, the mast with a colored jib in front and a white mainsail with three stripes of the
   same color; frame 1 rides a step lower in its wake */
function hdL_sail(s, col, f) {
    const C = hdRamp(col), dy = f ? 3 : 0, W = hdL_WOOD;
    const jib = s.add(C, { layer: 1, R: 9, grad: 0.3, k: 0.9 });
    const main = s.add(hdL_SAIL, { layer: 1, R: 10, grad: 0.3, k: 0.9 });
    const hull = s.add(W.mid, { layer: 2, R: 4, grad: 0.2, k: 1.1 });
    const mast = s.add(W.spar, { layer: 3, R: 1.5, grad: 0.05 });
    const boom = s.add(W.spar, { layer: 4, R: 1, grad: 0 });
    s.poly(jib, [[41.4, 21.6 + dy], [41.4, 56.6 + dy], [22.4, 56.6 + dy], [27, 46 + dy], [32.6, 36 + dy], [37.6, 28 + dy]]);
    s.poly(main, [[45, 7.6 + dy], [48, 9 + dy], [56, 22 + dy], [64, 36 + dy], [70.6, 48 + dy], [74, 56.6 + dy], [45, 56.6 + dy]]);
    s.poly(hull, [[10.6, 59 + dy], [26, 60.4 + dy], [42, 60.8 + dy], [58, 60.4 + dy], [75.4, 59 + dy], [77.6, 63.6 + dy], [77.4, 67.4 + dy], [73.6, 71.6 + dy], [66, 77.4 + dy], [18, 77.4 + dy], [10.4, 71.6 + dy], [8.6, 67.4 + dy], [8.4, 63.6 + dy]]);
    s.rect(mast, 42, 4 + dy, 3, 57);
    s.ellipse(mast, 43.5, 4 + dy, 2, 1.6);
    s.line(boom, 45, 57.6 + dy, 73, 57.6 + dy, 1.1, 0.9);
    /* the stripes across the mainsail (today's three), panel seams, the jib's seam toward its corner */
    hdL_patch(s, [main], C, (x, y) => { const r = y - dy; return (r >= 15 && r <= 17) || (r >= 30 && r <= 32) || (r >= 45 && r <= 47); });
    hdL_tex(s, [main], (x, y) => ((y - dy) % 15 === 8 && x > 47 ? -1 : 0));
    hdL_tex(s, [jib], (x, y) => (Math.abs((x - 41) * 1.75 + (y - dy - 56.6)) < 0.6 && x < 40 ? -1 : 0));
    /* the hull: a light rail, planks, the dark wood at the water */
    hdL_patch(s, [hull], W.lite, (x, y) => y - dy <= 62.4);
    hdL_patch(s, [hull], W.dark, (x, y) => y - dy >= 72);
    hdL_tex(s, [hull], (x, y) => { const r = y - dy; return r === 65 || r === 68 || r === 75 ? -1 : r === 63 && x % 7 === 3 ? -1 : 0; });
    hdL_tex(s, [mast], (x, y) => (x === 42 && (y % 9 === 4) ? 1 : 0));
    hdL_wake(s, 42, 80, 39.6, 8.8, hull, 11);
}
hdL_reg([['sea_sail_0', 28, 30, 14, 26, '#e0405a', 0], ['sea_sail_1', 28, 30, 14, 26, '#e0405a', 1], ['sea_sailb_0', 28, 30, 14, 26, '#4f86c6', 0], ['sea_sailb_1', 28, 30, 14, 26, '#4f86c6', 1]], hdL_sail);

/* the fishing boat (108x78): a red and navy hull with a white rail, the cream wheelhouse with two windows and its dark
   stack, the mast and the grey derrick over the deck; frame 1 rides a step lower */
function hdL_fishboat(s, f) {
    const dy = f ? 3 : 0;
    const RED = hdPal('#5e1424', '#b02c42', '#e0405a', '#ea6072', '#f2848e'), NAVY = hdPal('#121a30', '#212f52', '#2c3e66', '#3a5080', '#4a6496');
    const CREAM = hdPal('#7e7464', '#dcd4c4', '#fbf6ee', '#fdfaf4', '#ffffff'), STACK = hdPal('#141018', '#2a2430', '#3a3340', '#4c4454', '#5e5668');
    const MET = hdPal('#3a3c4e', '#6a6e86', '#8a8ea8', '#a4a8c0', '#bec2d6');
    const derrick = s.add(MET, { layer: 0, R: 1, grad: 0 });
    const mast = s.add(hdL_WOOD.spar, { layer: 1, R: 1.5, grad: 0.05 });
    const stack = s.add(STACK, { layer: 1, R: 2, grad: 0.15 });
    const hull = s.add(RED, { layer: 2, R: 4, grad: 0.15, k: 1.1 });
    const cabin = s.add(CREAM, { layer: 3, R: 4, grad: 0.2, k: 1.1 });
    s.line(derrick, 28.4, 9.6 + dy, 8.6, 33.4 + dy, 1.9, 1.5);
    s.line(derrick, 31, 5 + dy, 9.4, 32.6 + dy, 0.6, 0.6);
    s.rect(mast, 30, 4 + dy, 3, 36);
    s.ellipse(mast, 31.5, 4 + dy, 2, 1.6);
    s.rect(stack, 80, 2 + dy, 7, 15);
    s.ellipse(stack, 83.5, 2.4 + dy, 3.5, 1.5);
    s.poly(hull, [[8.6, 38.6 + dy], [102.4, 38.6 + dy], [102.6, 54 + dy], [99, 58.6 + dy], [91, 61.4 + dy], [18, 61.4 + dy], [11, 58.6 + dy], [8.4, 54 + dy]]);
    s.poly(cabin, [[58.6, 16.4 + dy], [60, 15 + dy], [87, 15 + dy], [88.4, 16.4 + dy], [88.4, 39 + dy], [58.6, 39 + dy]]);
    /* the hull's white rail and navy bottom, a seam, portholes; the stack's band; lattice marks on the derrick */
    hdL_patch(s, [hull], CREAM, (x, y) => y - dy <= 41.4);
    hdL_patch(s, [hull], NAVY, (x, y) => y - dy >= 51);
    hdL_tex(s, [hull], (x, y) => (y - dy === 46 && x % 12 === 0 ? -1 : 0));
    for (const px of [20, 30, 40]) { s.px(px, 45 + dy, '#5e1424'); s.px(px + 1, 45 + dy, '#5e1424'); s.px(px, 46 + dy, '#3a5080'); s.px(px + 1, 46 + dy, '#9fd8ef'); }
    hdL_patch(s, [stack], hdPal('#5e1424', '#b02c42', '#e0405a', '#ea6072', '#f2848e'), (x, y) => y - dy >= 6 && y - dy <= 8);
    hdL_tex(s, [derrick], (x, y) => ((x - y + 400) % 5 === 0 ? -1 : (x - y + 400) % 5 === 2 ? 1 : 0));
    /* the wheelhouse: a darker roof edge, two windows with glints */
    hdL_tex(s, [cabin], (x, y) => (y - dy === 17 ? -1 : 0));
    for (const wx of [63, 75]) for (let j = 0; j < 9; j++) for (let i = 0; i < 9; i++) {
        const edge = i === 0 || j === 0 || i === 8 || j === 8;
        s.px(wx + i, 19 + dy + j, edge ? '#6a7a8a' : (i + j === 4 || i + j === 5) ? '#e8f8ff' : j > 5 ? '#7ab8d8' : '#9fd8ef');
    }
    hdL_wake(s, 54, 66.6, 51.4, 8.8, hull, 23);
}
hdL_reg([['sea_fish_0', 36, 26, 18, 22, 0], ['sea_fish_1', 36, 26, 18, 22, 1]], hdL_fishboat);

/* the ferry (168x78): a cream hull with a blue band at the water, the white upper deck with its row of eight windows,
   the red funnel with a black top, rails along the open decks; frame 1 rides a step lower */
function hdL_ferry(s, f) {
    const dy = f ? 3 : 0;
    const CREAM = hdPal('#7e7464', '#d8d0c0', '#fbf6ee', '#fdfaf4', '#ffffff'), WH = hdPal('#7c7a90', '#d6d6e2', '#f6f6fa', '#ffffff', '#ffffff');
    const BLUE = hdPal('#1c3456', '#36649a', '#4f86c6', '#6a9cd4', '#8ab4e2'), RED = hdPal('#5e1424', '#b02c42', '#e0405a', '#ea6072', '#f2848e');
    const rail = s.add(hdPal('#6a6e80', '#9a9eb0', '#c8ccd8', '#dcdfe8', '#eceef4'), { layer: 0, R: 1, grad: 0, flat: 1 });
    const funnel = s.add(RED, { layer: 1, R: 3, grad: 0.2 });
    const hull = s.add(CREAM, { layer: 2, R: 5, grad: 0.15, k: 1.05 });
    const deck = s.add(WH, { layer: 3, R: 5, grad: 0.15, k: 1.05 });
    for (const [x0, x1] of [[10, 29], [133, 160]]) { s.rect(rail, x0, 32 + dy, x1 - x0, 1); for (let x = x0; x < x1; x += 4) s.rect(rail, x, 33 + dy, 1, 3); }
    s.poly(funnel, [[99.6, 4 + dy], [113.4, 4 + dy], [113.4, 16 + dy], [99.6, 16 + dy]]);
    s.ellipse(funnel, 106.5, 4.2 + dy, 7, 1.6);
    s.poly(hull, [[8.6, 35.6 + dy], [161.4, 35.6 + dy], [161.6, 55 + dy], [156, 59.6 + dy], [141, 62 + dy], [30, 62 + dy], [14, 59.6 + dy], [8.4, 55 + dy]]);
    s.poly(deck, [[29.6, 15.4 + dy], [31, 14 + dy], [130, 14 + dy], [131.4, 15.4 + dy], [131.4, 36 + dy], [29.6, 36 + dy]]);
    /* the funnel's black top, the blue band, a seam along the hull and a row of portholes, the deck's roof line */
    hdL_patch(s, [funnel], hdPal('#0e0a10', '#1c141e', '#2a1e2a', '#3a2c3a', '#4a3a4a'), (x, y) => y - dy <= 6.4);
    hdL_patch(s, [hull], BLUE, (x, y) => y - dy >= 51);
    hdL_tex(s, [hull], (x, y) => (y - dy === 37 ? -1 : 0));
    for (let x = 17; x < 160; x += 9) if (x < 26 || x > 134) { s.px(x, 43 + dy, '#8a9aac'); s.px(x + 1, 43 + dy, '#8a9aac'); s.px(x, 44 + dy, '#6a7a8e'); s.px(x + 1, 44 + dy, '#b8d0e4'); }
    hdL_tex(s, [deck], (x, y) => (y - dy === 16 ? -1 : 0));
    /* the eight windows, each with a frame and a glint */
    for (let i = 0; i < 8; i++) {
        const wx = 36 + i * 12;
        for (let j = 0; j < 7; j++) for (let k = 0; k < 7; k++) {
            const edge = k === 0 || j === 0 || k === 6 || j === 6;
            s.px(wx + k, 20 + dy + j, edge ? '#3a5a86' : (k + j === 3 || k + j === 4) ? '#cfe6fa' : j > 3 ? '#3e72b0' : '#4f86c6');
        }
    }
    hdL_wake(s, 84, 66.6, 81.4, 8.8, hull, 37);
}
hdL_reg([['sea_ferry_0', 56, 26, 28, 22, 0], ['sea_ferry_1', 56, 26, 28, 22, 1]], hdL_ferry);

/* ---------------------------------------------------------------- dolphins and their splash */
/* a dolphin's leap in three frames (60x48), heading right: rising with the tail still low (0), the top of the arc (1),
   diving head first (2). The body follows a curve from the tail [x, y] past [cx, cy] to the beak [x, y], with flukes at
   the tail, a fin on its back, a pale belly on the inside of the arc and an eye near the beak */
const hdL_DOLPH = [[[5.6, 41.6], [24, 13], [53.6, 31.6]], [[4.6, 31.4], [29.4, -8], [55, 30.6]], [[5.4, 28.6], [32, 6], [50.6, 44.6]]];
function hdL_dolphin(s, f) {
    const [[x0, y0], [cx, cy], [x2, y2]] = hdL_DOLPH[f];
    const B = hdPal('#2a3654', '#4e6a96', '#6a8ab8', '#82a0cc', '#a0bce0'), PALE = hdPal('#5a6a8a', '#a8b8d4', '#c8d8f0', '#dce8f8', '#eef4ff');
    const fin = s.add(B, { layer: 0, R: 1.5, grad: 0.1, bias: -0.04 });
    const fluke = s.add(B, { layer: 0, R: 1, grad: 0.1 });
    const body = s.add(B, { layer: 1, R: 4.5, grad: 0.2, k: 1.2 });
    const P = t => [(1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x2, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y2];
    const T = t => { const [ax, ay] = P(Math.max(0, t - 0.01)), [bx, by] = P(Math.min(1, t + 0.01)), l = Math.hypot(bx - ax, by - ay) || 1; return [(bx - ax) / l, (by - ay) / l]; };
    /* the normal toward the outside of the arc (up, mostly) */
    const N = t => { const [tx, ty] = T(t); return ty > 0 ? [ty, -tx] : [-ty, tx]; };
    const R = t => t < 0.1 ? 2.2 + t * 18 : t < 0.5 ? 4 + (t - 0.1) / 0.4 * 3 : t < 0.84 ? 7 - (t - 0.5) / 0.34 * 1.6 : 5.4 - (t - 0.84) / 0.16 * 3.4;
    const n = 40, pts = [];
    for (let i = 0; i <= n; i++) pts.push([...P(i / n), R(i / n)]);
    for (let i = 0; i < n; i++) s.line(body, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], pts[i][2], pts[i + 1][2]);
    /* the fin, swept back toward the tail */
    const [fx, fy] = P(0.5), [nx, ny] = N(0.5), [tx, ty] = T(0.5);
    s.poly(fin, [[fx - tx * 5 + nx * 4, fy - ty * 5 + ny * 4], [fx - tx * 7.4 + nx * 10, fy - ty * 7.4 + ny * 10], [fx - tx * 3.4 + nx * 9, fy - ty * 3.4 + ny * 9], [fx + tx * 3 + nx * 4, fy + ty * 3 + ny * 4]]);
    /* the flukes: a crescent across the tail's end */
    const [ex, ey] = P(0), [ux, uy] = T(0), [vx, vy] = [-uy, ux];
    s.poly(fluke, [[ex + ux * 3, ey + uy * 3], [ex + vx * 6.4 - ux * 2, ey + vy * 6.4 - uy * 2], [ex + vx * 4.6 - ux * 0.2, ey + vy * 4.6 - uy * 0.2], [ex - ux * 0.8, ey - uy * 0.8], [ex - vx * 4.6 - ux * 0.2, ey - vy * 4.6 - uy * 0.2], [ex - vx * 6.4 - ux * 2, ey - vy * 6.4 - uy * 2]]);
    /* the pale belly: the inside of the arc, from behind the flippers to the beak */
    hdL_patch(s, [body], PALE, (x, y) => {
        let bi = 0, bd = 1e9; for (let i = 0; i <= n; i++) { const d = Math.hypot(x + 0.5 - pts[i][0], y + 0.5 - pts[i][1]); if (d < bd) { bd = d; bi = i; } }
        const t = bi / n; if (t < 0.3) return false;
        const [mx, my] = N(t); return ((x + 0.5 - pts[bi][0]) * mx + (y + 0.5 - pts[bi][1]) * my) < -pts[bi][2] * 0.32;
    });
    /* the eye (a glint) and the mouth line */
    const [hx, hy] = P(0.82), [hnx, hny] = N(0.82), [htx, hty] = T(0.82);
    hdL_eye(s, Math.round(hx + hnx * 1.4 - 0.5), Math.round(hy + hny * 1.4 - 0.5), 2, 2, '#1a2238');
    for (let k = 0; k < 4; k++) s.px(Math.round(hx + htx * (3.4 + k) - hnx * 1.4 - 0.5), Math.round(hy + hty * (3.4 + k) - hny * 1.4 - 0.5), '#3a4a6a');
}
hdL_reg([['sea_dolphin_0', 20, 16, 10, 14, 0], ['sea_dolphin_1', 20, 16, 10, 14, 1], ['sea_dolphin_2', 20, 16, 10, 14, 2]], hdL_dolphin);

/* the splash (48x24): today's seven drops, each a little bead of water lit white on top and blue below, with a few
   specks of spray */
function hdL_splash(s) {
    const px = new Map();
    const put = (x, y, c) => px.set(y * 48 + x, c);
    const W = [255, 255, 255], L = [207, 238, 250], M = [160, 214, 240];
    for (const [c, r] of [[8, 2], [5, 3], [11, 3], [3, 5], [13, 5], [7, 6], [9, 6]]) {
        const x = c * 3 + 1, y = r * 3;
        put(x, y, W); put(x, y + 1, W); put(x - 1, y + 2, W); put(x, y + 2, W); put(x + 1, y + 2, L);
        put(x - 1, y + 3, L); put(x, y + 3, L); put(x + 1, y + 3, M); put(x, y + 4, M);
    }
    for (const [x, y] of [[20, 2], [28, 4], [12, 8], [36, 8], [17, 12], [31, 12], [24, 15], [6, 13], [42, 13]]) put(x, y, W);
    hdL_raw(s, (x, y) => px.get(y * 48 + x));
}
hdL_reg([['sea_splash', 16, 8, 8, 7]], hdL_splash);

/* ---------------------------------------------------------------- fishing: the bobber, the fish's shadow */
/* the red and white float (18x21): today's upright block with its corners rounded, the bottom more, a glint on the red */
function hdL_bobber(s) {
    const RED = hdPal('#5e1424', '#b02c42', '#e0405a', '#ea6072', '#f2909c');
    const b = s.add(hdL_SAIL, { layer: 1, R: 4, grad: 0.15, k: 1.2 });
    for (let y = 0; y < 21; y++) for (let x = 0; x < 18; x++) {
        const r = y < 10 ? 3.5 : 6.5, cx = Math.max(r, Math.min(18 - r, x + 0.5)), cy = y < 10 ? Math.max(r, y + 0.5) : Math.min(21 - r, y + 0.5);
        if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r) s.plot(b, x, y);
    }
    hdL_patch(s, [b], RED, (x, y) => y < 9);
    for (const [x, y] of [[3, 2], [4, 2], [5, 2], [3, 3], [3, 4]]) s.px(x, y, '#ffc4ca');
    s.px(3, 11, '#ffffff'); s.px(3, 12, '#ffffff');
}
hdL_reg([['bobber', 6, 7, 3, 5]], hdL_bobber);

/* a fish's shadow under the water (today's four sizes): a soft dark oval, its edge fading out; the two that had them
   keep little soft bumps top and bottom. Nothing in it should read as a thing, only as a shape down there */
function hdL_fishShadow(s, cx, cy, rx, ry, p, nub) {
    hdL_raw(s, (x, y) => {
        const u = Math.abs((x + 0.5 - cx) / rx), v = Math.abs((y + 0.5 - cy) / ry);
        let d = Math.pow(Math.pow(u, p) + Math.pow(v, p), 1 / p);
        if (nub) { const k = Math.hypot((x + 0.5 - cx) / 2.2, (Math.abs(y + 0.5 - cy) - ry) / 2.6); d = Math.min(d, 0.75 + k * 0.3); }
        const e = 1.6 / Math.min(rx, ry), a = d < 1 - e ? 1 : d < 1 + e * 0.5 ? (1 + e * 0.5 - d) / (e * 1.5) : 0;
        return a > 0.02 ? [20, 40, 70, Math.round(a * (d < 0.55 ? 122 : 112))] : null;
    });
}
hdL_reg([['fishshadow_1', 9, 5, 4, 2, 13.5, 7.5, 13.2, 4.6, 2, 1], ['fishshadow_2', 12, 6, 6, 3, 18, 9, 15.2, 6.2, 2.2, 0],
    ['fishshadow_3', 15, 7, 7, 3, 22.5, 10.5, 22.2, 7.4, 2.1, 1], ['fishshadow_4', 18, 8, 9, 4, 27, 12, 24.4, 9.2, 3, 0]], hdL_fishShadow);

/* ---------------------------------------------------------------- the twinkle: a crisp four-point sparkle (15x15) */
function hdL_twinkle(s) {
    const W = [255, 255, 255], Y = [255, 246, 176], Y2 = [255, 236, 140], G = [255, 250, 214];
    hdL_raw(s, (x, y) => {
        const dx = Math.abs(x - 7), dy = Math.abs(y - 7), d = dx + dy;
        if (dx === 0 || dy === 0) return d <= 2 ? W : d <= 4 ? Y : d <= 6 ? Y2 : [255, 226, 120, 200];
        if (dx === 1 && dy === 1) return G;
        return null;
    });
}
hdL_reg([['twinkle', 5, 5, 2, 2]], hdL_twinkle);

/* ---------------------------------------------------------------- up in the sky: the plane and the balloon */
/* a little white plane seen from above (102x90), nose up (the game turns it the way it flies): wings tapering to round
   tips with the red and green lights, the tailplane, the blue windshield; the shadow is the same shape, see-through */
function hdL_planeParts(s) {
    const W = hdPal('#5a5f78', '#c8ccda', '#eef0f6', '#fafbfd', '#ffffff');
    const wings = s.add(W, { layer: 1, R: 4, grad: 0.1, k: 1.1 }), tail = s.add(W, { layer: 1, R: 3, grad: 0.1 });
    const fus = s.add(W, { layer: 2, R: 6, grad: 0.08, k: 1.2 });
    const mir = pts => pts.concat(pts.slice().reverse().map(([x, y]) => [102 - x, y]));
    s.poly(wings, mir([[46, 32], [24, 32.4], [12, 34.2], [5, 36.2], [2.6, 38.4], [2.4, 43], [3.6, 45.6], [46, 45.6]]));
    s.poly(tail, mir([[46, 69.4], [36, 69.8], [31.8, 71.6], [31.4, 77.8], [33.2, 79.8], [46, 80]]));
    s.line(fus, 51, 7, 51, 81, 7.3, 6.2);
    return { wings, tail, fus };
}
function hdL_plane(s) {
    const { wings, tail, fus } = hdL_planeParts(s);
    /* panel lines: the ailerons and flaps along the trailing edge, where the wings meet the body */
    hdL_tex(s, [wings], (x, y) => ((y === 42 && (x < 30 || x > 72) && x > 6 && x < 96) || ((x === 30 || x === 72 || x === 18 || x === 84) && y > 41) ? -1 : 0));
    hdL_tex(s, [tail], (x, y) => (y === 77 && x > 34 && x < 68 ? -1 : 0));
    hdL_tex(s, [fus], (x, y) => (y === 25 || y === 52 ? -1 : 0));
    /* the windshield: blue glass with a glint, and a small spinner at the nose */
    for (let y = 7; y < 15; y++) for (let x = 45; x < 58; x++) { const u = (x + 0.5 - 51) / 4.6, v = (y + 0.5 - 11) / 3.2; if (u * u + v * v <= 1) s.px(x, y, u * u + v * v > 0.6 && v > 0 ? '#2e7ac8' : v < -0.1 && u < -0.1 ? '#a8dcff' : '#4ea8f0'); }
    s.px(48, 9, '#ffffff'); s.px(49, 9, '#ffffff'); s.px(48, 10, '#ffffff');
    /* the fin along the tail, seen from above: a light ridge with its shaded side */
    for (let y = 68; y < 86; y++) { s.px(50, y, '#ffffff'); s.px(51, y, '#c8ccda'); }
    for (const [x, y, c] of [[50, 1, '#8a8ea8'], [51, 1, '#a4a8c0'], [50, 2, '#6a6e86'], [51, 2, '#8a8ea8']]) s.px(x, y, c);
    /* the wingtip lights */
    for (const [x, c, c2] of [[5, '#e0405a', '#ff8a96'], [95, '#5ab04a', '#a0e890']]) { for (let j = 0; j < 3; j++) for (let i = 0; i < 2; i++) s.px(x + i, 40 + j, c); s.px(x, 40, c2); }
}
function hdL_planeShadow(s) {
    hdL_planeParts(s);
    hdL_raw(s, (x, y) => {
        if (s.at(x, y) < 0) return null;
        const edge = s.at(x + 1, y) < 0 || s.at(x - 1, y) < 0 || s.at(x, y + 1) < 0 || s.at(x, y - 1) < 0;
        return [20, 20, 40, edge ? 36 : 60];
    });
}
hdL_reg([['sky_plane', 34, 30, 17, 15]], hdL_plane);
hdL_reg([['sky_plane_shadow', 34, 30, 17, 15]], hdL_planeShadow);

/* the hot air balloon (66x102): a round envelope in today's five rainbow gores (they curve round it, narrowing to the
   top and the mouth), the load ring, four ropes and the wicker basket */
function hdL_balloon(s) {
    const env = s.add(hdL_soft('#e0405a', 0.85), { layer: 1, R: 14, grad: 0.12, k: 1 });
    const ring = s.add(hdL_WOOD.spar, { layer: 2, R: 1, grad: 0 });
    const ropes = s.add(hdL_WOOD.spar, { layer: 0, R: 1, grad: 0, flat: 1 });
    const basket = s.add(hdL_WOOD.lite, { layer: 2, R: 3, grad: 0.15 });
    const rim = s.add(hdPal('#6a4a2a', '#b8885a', '#d9a46a', '#e6b882', '#f0cc9a'), { layer: 3, R: 1.2, grad: 0.1 });
    const hw = y => y < 29.5 ? 33 * Math.pow(Math.max(0, 1 - Math.pow((29.5 - y) / 30, 3.5)), 1 / 3.5) : 33 - 15 * Math.pow((y - 29.5) / 30, 3);
    for (let y = 0; y < 60; y++) { const w = hw(y + 0.5); for (let x = 0; x < 66; x++) if (Math.abs(x + 0.5 - 33) <= w) s.plot(env, x, y); }
    const G = [['#e0405a', -1], ['#ffd84a', -0.4545], ['#4ec3d9', -0.0909], ['#8cc152', 0.1818], ['#b37cf0', 0.5455]];
    for (let y = 0; y < 60; y++) { const w = hw(y + 0.5); for (let x = 0; x < 66; x++) { if (s.at(x, y) !== env) continue; const u = (x + 0.5 - 33) / w; let k = 0; for (let i = 0; i < G.length; i++) if (u >= G[i][1]) k = i; if (k) s.recolor(x, y, hdL_soft(G[k][0], 0.85)); } }
    /* a fine seam down the middle of each gore */
    hdL_tex(s, [env], (x, y) => { const u = (x + 0.5 - 33) / hw(y + 0.5); for (const c of [-0.73, -0.27, 0.045, 0.364, 0.77]) if (Math.abs(u - c) < 0.5 / hw(y + 0.5)) return -1; return 0; });
    s.rect(ring, 18, 59, 31, 3);
    for (const [xa, xb] of [[20, 25], [24, 28], [46, 41], [42, 38]]) s.line(ropes, xa, 61.5, xb, 77.5, 0.6, 0.6);
    s.poly(basket, [[22, 79], [46, 79], [46, 93.4], [44.6, 95], [23.4, 95], [22, 93.4]]);
    s.rect(rim, 21, 77, 26, 4);
    /* the wicker: a basket weave of little offset blocks */
    hdL_tex(s, [basket], (x, y) => { const r = Math.floor((y - 81) / 3), q = Math.floor((x - 22 + (r % 2) * 2) / 4); return (y - 81) % 3 === 2 ? -1 : (q % 2 === 0 && (x - 22 + (r % 2) * 2) % 4 === 0) ? -1 : 0; });
    hdL_tex(s, [rim], (x, y) => (x % 3 === 0 && y === 78 ? -1 : 0));
}
hdL_reg([['sky_balloon', 22, 34, 11, 33]], hdL_balloon);
