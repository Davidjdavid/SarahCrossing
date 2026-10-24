/* ---- 32b_hd_hair.js ---- */
/* HD hair styles. Each style has back(s, g) (hair behind the body: drawn first) and front(s, g) (drawn over the head
   and face). g: dir ('down', 'side' facing right, 'up' = seen from behind), fx, fy (the middle of the face: the eye
   line is about fy - 1.5, the chin fy + 8, the top of the skull about fy - 13), H (the hair's five shades), look, body.
   The coordinates below are drawn for a head at (24, 20.5) and moved with s.dy, so every pose (crouching, sitting)
   carries the hair along. */
function hdHairAt(s, g, fn) { const ox = s.dx, oy = s.dy; s.dx = g.fx - (g.side ? 25 : 24); s.dy = g.fy - 20.5; try { fn(); } finally { s.dx = ox; s.dy = oy; } }
/* a wavy lock: a ribbon around a wandering center line, tapering to a curled tip */
function hdLock(s, id, x0, y0, y1, w, amp, ph, curl) {
    const L = [], R = [];
    for (let y = y0; y <= y1; y += 0.5) {
        const t = (y - y0) / (y1 - y0), cx = x0 + Math.sin(y * 0.42 + ph) * amp * Math.min(1, t * 2.5) + curl * t * t * 2.2;
        const hw = w / 2 * (t < 0.85 ? 1 : 1 - (t - 0.85) / 0.15 * 0.75);
        L.push([cx - hw, y]); R.unshift([cx + hw, y]);
    }
    s.poly(id, L.concat(R));
}

/* Sarah's own: long soft waves past the shoulders, parted on her right, a long sweep across the forehead */
HD_HAIR.waves = {
    back(s, g) {
        const H = g.H;
        hdHairAt(s, g, () => {
            if (g.dir === 'down') {
                const back = [[-12.5, 46, 4.6, 1.3, 0.2, -1], [-9.5, 50, 4.6, 1.1, 1.4, -0.5], [12.5, 46, 4.6, 1.3, 2.2, 1], [9.5, 50, 4.6, 1.1, 3.1, 0.5], [-6, 48, 5, 0.9, 0.7, 0], [6, 48, 5, 0.9, 2.6, 0]];
                back.forEach(([dx, y1, w, amp, ph, curl], i) => hdLock(s, s.add(H, { layer: 0, R: 2.5, grad: 0.32, bias: -0.1 + (i % 2) * 0.04 }), 23.5 + dx, 9, y1, w, amp, ph, curl));
            } else if (g.dir === 'side') {
                // down her back, behind the shoulder
                const back = [[16, 46, 5, 1.2, 0.4, -0.8], [19.5, 44, 5, 1.0, 1.9, -0.3], [13.5, 41, 4.4, 1.1, 2.8, -1]];
                back.forEach(([x, y1, w, amp, ph, curl], i) => hdLock(s, s.add(H, { layer: 0, R: 2.5, grad: 0.3, bias: -0.08 + (i % 2) * 0.04 }), x, 10, y1, w, amp, ph, curl));
            }
        });
    },
    front(s, g) {
        const H = g.H;
        hdHairAt(s, g, () => {
            if (g.dir === 'up') {
                // seen from behind: one mass of waves from the crown down over the back
                const crown = s.add(H, { layer: 7, R: 5, grad: 0.3 });
                s.ellipse(crown, 24, 10.5, 12, 9);
                const locks = [[-11, 44, 5, 1.2, 0.2, -0.8], [-6.5, 47.5, 5.4, 1, 1.3, -0.3], [-2, 48.5, 5.4, 0.9, 2.5, 0], [2.5, 48.5, 5.4, 0.9, 0.8, 0], [7, 47.5, 5.4, 1, 1.9, 0.3], [11.5, 44, 5, 1.2, 2.9, 0.8]];
                locks.forEach(([dx, y1, w, amp, ph, curl], i) => hdLock(s, s.add(H, { layer: 8 + (i % 2), R: 2.6, grad: 0.3, bias: (i % 2) * 0.05 - 0.03 }), 24 + dx, 12, y1, w, amp, ph, curl));
                for (let x = 15; x <= 33; x++) { const y = 6.2 - Math.sin((x - 15) / 18 * Math.PI) * 2.4; s.mod(x, y, 1); if (x % 3 === 0) s.mod(x, y + 1, 1); }
                return;
            }
            if (g.dir === 'side') {
                const crown = s.add(H, { layer: 7, R: 4, cast: 1, grad: 0.3 });
                s.poly(crown, [[13, 13], [15, 6.5], [20, 3.2], [27, 3], [31.5, 5.5], [34, 9.5], [34.6, 14.5], [32.6, 12.6], [29.5, 11.8], [26, 12.4], [23.5, 14], [22.5, 19], [23, 25], [21, 28], [17, 27], [14, 22]]);
                const sweep = s.add(H, { layer: 9, R: 3, cast: 1, grad: 0.25 });
                s.poly(sweep, [[24, 5], [30, 5.2], [33.6, 8.5], [35.4, 13], [35.2, 18], [33.6, 15.5], [31.2, 13], [27.5, 12.4], [24, 13.4]]);
                hdLock(s, s.add(H, { layer: 10, R: 2.2, grad: 0.3 }), 20.5, 14, 38, 4.4, 1.0, 0.9, -0.6);
                for (let x = 17; x <= 30; x++) { const y = 6 - Math.sin((x - 15) / 17 * Math.PI) * 2.2; s.mod(x, y, 1); }
                s.mod(22, 8, 1); s.mod(23, 9, 1);
                return;
            }
            // from the front: the crown, a long sweep from the parting, a short fringe on the other side, locks in front
            const crown = s.add(H, { layer: 7, R: 4, cast: 1, grad: 0.3 });
            s.ellipse(crown, 24, 9.5, 11.6, 7.8);
            const sweep = s.add(H, { layer: 9, R: 3, cast: 1, grad: 0.25 });
            s.poly(sweep, [[20, 4.5], [27, 4.5], [32.5, 8], [35, 13], [35.2, 19], [33.6, 16.5], [31.5, 13.4], [28, 12.4], [24.5, 13.6], [21, 15.2], [19.4, 12]]);
            const short = s.add(H, { layer: 8, R: 2.5, cast: 1, grad: 0.25 });
            s.poly(short, [[19.6, 4.8], [14.4, 8.5], [12.8, 14], [13.2, 19], [15.4, 15.5], [17.4, 13.2], [19.6, 11.5]]);
            hdLock(s, s.add(H, { layer: 10, R: 2.2, grad: 0.3 }), 14.8, 13, 42, 4.2, 1.1, 0.4, -0.6);
            hdLock(s, s.add(H, { layer: 10, R: 2.2, grad: 0.3 }), 33.2, 15, 41, 4.2, 1.1, 2.0, 0.6);
            hdLock(s, s.add(H, { layer: 6, R: 2.2, grad: 0.3, bias: -0.04 }), 12.2, 14, 38, 3.6, 0.9, 1.1, -0.8);
            hdLock(s, s.add(H, { layer: 6, R: 2.2, grad: 0.3, bias: -0.04 }), 35.8, 15, 38, 3.6, 0.9, 2.9, 0.8);
            // a soft sheen across the crown and down the waves
            for (let x = 15; x <= 31; x++) { const y = 7.2 - Math.sin((x - 15) / 16 * Math.PI) * 2.6 + (x > 20 ? 0.6 : 0); s.mod(x, y, 1); if (x % 3 === 0) s.mod(x, y + 1, 1); }
            s.mod(20, 5, -1); s.mod(20, 6, -1); s.mod(20, 7, -1);
            for (let y = 17; y < 41; y++) { const w = Math.sin(y * 0.42 + 0.4) * 1.1; if (y % 5 < 2) s.mod(14.2 + w, y, 1); const w2 = Math.sin(y * 0.42 + 2.0) * 1.1; if (y % 5 < 2) s.mod(32.6 + w2, y, 1); }
        });
    },
};

/* ---------------------------------------------------------------- helpers shared by the styles */
/* the head's own skin part: the bald styles grow the top of the skull onto it, so the scalp shades as one with the face */
function hdHairScalp(s, g) {
    const id = s.at(Math.round(g.fx + (g.side ? 2 : 0)), Math.round(g.fy - 3));
    if (id < 0) return -1;
    // only into empty pixels, so the ears stay
    const [cx, cy, rx, ry] = g.side ? [24.4, 13.4, 9.2, 8.8] : [24, 13.6, 9.6, 9];
    for (let y = Math.floor(cy - ry); y <= cy; y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry;
        if (u * u + v * v <= 1 && s.at(Math.round(x + s.dx), Math.round(y + s.dy)) < 0) s.plot(id, x, y);
    }
    return id;
}
/* a color between two (stubble: the hair color over the skin) */
function hdHairMix(a, b, t) { return a.map((c, i) => Math.round(c + (b[i] - c) * t)); }
/* a band of light across the crown: lighter pixels along an arch from x0 to x1 (y at the ends, rising by up in the middle);
   every k-th column doubled so the band has some width */
function hdHairSheen(s, x0, x1, y, up, k, d) {
    for (let x = x0; x <= x1; x++) { const yy = y - Math.sin((x - x0) / (x1 - x0) * Math.PI) * up; s.mod(x, yy, d || 1); if (k && x % k === 0) s.mod(x, yy + 1, d || 1); }
}
/* a strand line (a parting, a comb line, the split between locks): pixels nudged along a line */
function hdHairLine(s, x0, y0, x1, y1, d) { const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))); for (let i = 0; i <= n; i++) s.mod(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, d); }
/* points along an ellipse from angle a0 to a1 (degrees: 0 is right, 90 is down) */
function hdHairArc(cx, cy, rx, ry, a0, a1, n) { const p = []; n = n || 12; for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return p; }
/* a tilted oval (a braid's plait, a bun's loop): ang in degrees */
function hdHairOval(s, id, cx, cy, rx, ry, ang) { const c = Math.cos(ang * Math.PI / 180), sn = Math.sin(ang * Math.PI / 180), p = []; for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2, x = Math.cos(a) * rx, y = Math.sin(a) * ry; p.push([cx + x * c - y * sn, cy + x * sn + y * c]); } s.poly(id, p); }
/* a curved ribbon of hair (a tail, a braid's path) along a quadratic curve from (x0, y0) through (cx, cy) to (x1, y1),
   w0 wide at the start, w1 at the end, fuller in the middle by b */
function hdHairRibbon(s, id, x0, y0, cx, cy, x1, y1, w0, w1, b) {
    const L = [], R = [], n = 18;
    for (let i = 0; i <= n; i++) {
        const t = i / n, u = 1 - t, x = u * u * x0 + 2 * u * t * cx + t * t * x1, y = u * u * y0 + 2 * u * t * cy + t * t * y1;
        let dx = 2 * u * (cx - x0) + 2 * t * (x1 - cx), dy = 2 * u * (cy - y0) + 2 * t * (y1 - cy); const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
        const w = (w0 + (w1 - w0) * t + (b || 0) * Math.sin(t * Math.PI)) / 2;
        L.push([x - dy * w, y + dx * w]); R.unshift([x + dy * w, y - dx * w]);
    }
    s.poly(id, L.concat(R));
}
/* a point on that curve */
function hdHairQ(x0, y0, cx, cy, x1, y1, t) { const u = 1 - t; return [u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1]; }
/* a hanging ringlet: round loops that swing from side to side as they fall, each a part in front of the one above */
function hdHairCoil(s, H, x, y0, y1, r, ph, o) {
    o = o || {};
    const n = Math.max(1, Math.round((y1 - y0) / (r * 1.25)));
    for (let i = 0; i <= n; i++) {
        const t = i / n, rr = r * (1 - t * 0.28), id = s.add(H, { layer: (o.layer || 7) + i, R: 2.2, grad: 0.25, k: 1.6, bias: o.bias || 0 });
        s.ellipse(id, x + Math.sin(i * 2.3 + ph) * r * 0.35 + (o.drift || 0) * t * t, y0 + (y1 - y0) * t, rr, rr * 0.84);
    }
}
/* a long ringlet: a ribbon that winds from side to side, with the turns of the spiral drawn across it (a dark line under
   a lit one, slanting the way the curl turns) */
function hdHairRinglet(s, H, x, y0, y1, w, ph, o) {
    o = o || {};
    const id = s.add(H, { layer: o.layer || 7, R: o.R || 2, grad: 0.26, k: 1.5, bias: o.bias || 0 }), L = [], R = [];
    const cx = y => { const t = (y - y0) / (y1 - y0); return x + Math.sin(y * 0.7 + ph) * (o.amp || 0.9) * Math.min(1, t * 3) + (o.drift || 0) * t * t; };
    for (let y = y0; y <= y1; y += 0.5) { const t = (y - y0) / (y1 - y0), hw = w / 2 * (t < 0.8 ? 1 : 1 - (t - 0.8) / 0.2 * 0.7); L.push([cx(y) - hw, y]); R.unshift([cx(y) + hw, y]); }
    s.poly(id, L.concat(R));
    for (let y = y0 + 2.4 + (ph % 1) * 2; y < y1 - 1.5; y += 2.9) {
        const c = cx(y), hw = w / 2 - 0.4;
        for (let k = -1; k <= 1; k += 0.5) { s.mod(c + k * hw, y + k * 0.9, -1); if (k < 0.5) s.mod(c + k * hw, y + k * 0.9 - 1, 1); }
    }
    return id;
}
/* a braid along a curve: plaits slanting in from each side in turn, then a tie and a little tuft */
function hdHairBraid(s, H, x0, y0, cx, cy, x1, y1, w, o) {
    o = o || {};
    const n = Math.round(Math.hypot(x1 - x0, y1 - y0) / 2.3);
    for (let i = 0; i < n; i++) {
        const t = i / n, [x, y] = hdHairQ(x0, y0, cx, cy, x1, y1, t), [xb, yb] = hdHairQ(x0, y0, cx, cy, x1, y1, Math.min(1, t + 0.02));
        const a = Math.atan2(yb - y, xb - x) * 180 / Math.PI, sd = i % 2 ? 1 : -1, ww = w * (1 - t * 0.25);
        const id = s.add(H, { layer: (o.layer || 8) + (i % 2), R: 1.8, grad: 0.2, k: 1.5, bias: o.bias || 0 });
        hdHairOval(s, id, x - Math.sin(a * Math.PI / 180) * sd * ww * 0.2, y + Math.cos(a * Math.PI / 180) * sd * ww * 0.2, ww * 0.42, 1.6, a - 90 + sd * 50);
    }
    const tie = s.add(hdRamp(hdHairMix(H[2], [30, 20, 24], 0.45)), { layer: (o.layer || 8) + 2, R: 1.2 }), tuft = s.add(H, { layer: (o.layer || 8) + 1, R: 1.6, grad: 0.2, bias: o.bias || 0 });
    hdHairRibbon(s, tuft, x1, y1, x1 + (x1 - cx) * 0.1, y1 + 2, x1 + (x1 - cx) * 0.15, y1 + 4.4, w * 0.5, 0.6, 1.6);
    s.ellipse(tie, x1, y1, w * 0.36, 0.9);
}
/* round tufts, each its own part a layer above the last, so the seams between them draw the curls (the sample's Joe) */
function hdHairTufts(s, H, list, o) {
    o = o || {};
    list.forEach(([x, y, r, ry], i) => { const id = s.add(H, { layer: (o.layer || 7) + i, R: o.R || 2.4, cast: o.cast && y > (o.castY || 9) ? 1 : 0, grad: o.grad || 0.25, k: o.k || 1.6, bias: o.bias || 0 }); s.ellipse(id, x, y, r, ry || r * 0.92); });
}

/* a glossy shine: a band of light pixels along an arch with a ragged lower edge (longer streaks every few columns) and
   a brighter core on the lit (left) side */
function hdHairGloss(s, x0, x1, y, up, len) {
    for (let x = x0; x <= x1; x++) {
        const t = (x - x0) / (x1 - x0), yy = y - Math.sin(t * Math.PI) * up, n = 1 + ((x * 7) % 5 === 0 ? len || 2 : (x * 3) % 4 === 0 ? 1 : 0);
        for (let k = 0; k < n; k++) s.mod(x, yy + k, 1);
        if (t > 0.18 && t < 0.42) s.mod(x, yy, 1);
    }
}
/* the straight fall of long hair seen from behind: one rounded mass from the crown to ragged, pointed ends */
function hdHairFall(s, H, x0, x1, y1, o) {
    o = o || {};
    const id = s.add(H, { layer: o.layer || 7, R: o.R || 6, grad: 0.3, bias: o.bias || 0 }), w = x1 - x0, ends = [];
    for (let i = 0; i <= 8; i++) ends.push([x1 - 1.6 - (w - 3.2) * i / 8, y1 - (i % 2 ? 1.4 : 0) - Math.pow(Math.abs(i - 4) / 4, 2) * (o.v || 2)]);
    s.poly(id, [[x0 + 1.4, 14], [x0 + 2.2, 9], [x0 + 4.8, 5.2], [x0 + w * 0.33, 3], [x0 + w / 2, 2.5], [x1 - w * 0.33, 3], [x1 - 4.8, 5.2], [x1 - 2.2, 9], [x1 - 1.4, 14],
        [x1 - 1.2, 20], [x1 - 1, 25], [x1, 31], [x1 + 0.2, 38], [x1 - 0.4, y1 - 3]].concat(ends, [[x0 + 0.4, y1 - 3], [x0 - 0.2, 38], [x0, 31], [x0 + 1, 25], [x0 + 1.2, 20]]));
    return id;
}
/* long, straight and glossy, past the shoulders, parted in the middle (Elizabeth's too) */
HD_HAIR.sleek = {
    back(s, g) {
        const H = g.H;
        hdHairAt(s, g, () => {
            if (g.dir === 'down') hdHairFall(s, H, 11.6, 36.4, 46.6, { layer: 0, bias: -0.12, R: 4 });
            else if (g.dir === 'side') {
                const id = s.add(H, { layer: 0, R: 4, grad: 0.3, bias: -0.08 });
                s.poly(id, [[14, 10], [22, 10], [23.6, 30], [23.8, 44], [22.4, 46], [20.6, 45], [18.6, 46.6], [16.4, 45.2], [14.4, 46], [12.4, 44.4], [11.8, 36], [12.2, 26], [12.8, 16]]);
                hdHairLine(s, 17, 26, 17.6, 45, -1); hdHairLine(s, 20.8, 28, 21.4, 44, -1);
            }
        });
    },
    front(s, g) {
        const H = g.H;
        hdHairAt(s, g, () => {
            if (g.dir === 'up') {
                hdHairFall(s, H, 12.4, 35.6, 47);
                // strands fanning down from the crown, and the gloss around the crown
                for (const xb of [16.4, 20.6, 27.4, 31.6]) { const xt = 24 + (xb - 24) * 0.75; hdHairLine(s, xt, 17, xb, 44, -1); }
                for (const xb of [18.6, 29.4]) { const xt = 24 + (xb - 24) * 0.75; hdHairLine(s, xt, 20, xb, 40, 1); }
                hdHairGloss(s, 14.2, 33.8, 15.2, 4, 3);
                return;
            }
            if (g.side) {
                const crown = s.add(H, { layer: 7, R: 4, cast: 1, grad: 0.3 });
                s.poly(crown, [[34, 14.4], [33.6, 9], [31, 5.4], [26, 3.2], [20.5, 3.4], [16.4, 5.8], [13.8, 9.6], [12.8, 15], [13, 24], [16, 27], [21.5, 26.5], [23.4, 22.5], [24.6, 17], [26.6, 13.6], [30.4, 12.4]]);
                // the hair behind the ear, down over the back of the neck and shoulder
                const fall = s.add(H, { layer: 8, R: 2.6, grad: 0.3 });
                s.poly(fall, [[18, 13], [24.4, 15], [24.2, 22], [23.6, 30], [23.6, 36], [22.2, 38.4], [20.6, 37], [18.8, 38.6], [17.4, 36], [17.2, 26]]);
                hdHairGloss(s, 16, 31, 7.6, 2.6, 2);
                hdHairLine(s, 20.6, 20, 20.8, 35, -1);
                return;
            }
            // from the front: the crown parted in the middle, straight curtains framing the face and resting on the shoulders
            const crown = s.add(H, { layer: 7, R: 4, cast: 1, grad: 0.3 });
            s.poly(crown, [[12.6, 22], [12.8, 10.5], [15.6, 5.6], [20, 3.1], [24, 2.6], [28, 3.1], [32.4, 5.6], [35.2, 10.5], [35.4, 22], [32, 22], [30.8, 14.8], [27.6, 13.1], [24, 12.6], [20.4, 13.1], [17.2, 14.8], [16, 22]]);
            const curtain = (sg) => {
                const X = x => 24 + sg * (x - 24), id = s.add(H, { layer: 8, R: 2.8, cast: 1, grad: 0.3 });
                s.poly(id, [[X(13), 14], [X(16.6), 14.6], [X(17), 20], [X(16.8), 27], [X(17.4), 31], [X(18.4), 36], [X(18.6), 41.6], [X(17.4), 44.6], [X(16), 43.4], [X(14.4), 45], [X(12.8), 43.6], [X(11.4), 44.2], [X(10.8), 38], [X(11), 31], [X(12), 24]]);
                hdHairLine(s, X(14.6), 22, X(15.4), 42, sg < 0 ? 1 : -1);
                hdHairLine(s, X(12.6), 26, X(12.8), 41, -1);
            };
            curtain(1); curtain(-1);
            hdHairLine(s, 24, 3, 24, 12, -1);
            hdHairGloss(s, 14, 22.5, 8.6, 2.6, 2); hdHairGloss(s, 25.5, 34, 8.6, 2.6, 2);
        });
    },
};

/* chin length and blunt, with a straight fringe; the ends turn under */
HD_HAIR.bob = {
    back(s, g) {
        hdHairAt(s, g, () => {
            // the back of the bob, seen behind the neck
            if (g.dir === 'down') { const id = s.add(g.H, { layer: 0, R: 3, grad: 0.2, bias: -0.14 }); s.poly(id, [[13, 14], [35, 14], [35.4, 29.6], [12.6, 29.6]]); }
        });
    },
    front(s, g) {
        const H = g.H;
        hdHairAt(s, g, () => {
            if (g.dir === 'up') {
                const id = s.add(H, { layer: 7, R: 5, grad: 0.3 });
                s.poly(id, [[12, 29], [11.8, 22], [12.2, 14], [13.8, 8.5], [17, 4.6], [21, 2.8], [24, 2.5], [27, 2.8], [31, 4.6], [34.2, 8.5], [35.8, 14], [36.2, 22], [36, 29], [33, 30], [24, 30.2], [15, 30]]);
                for (const xb of [15.6, 19.6, 24, 28.4, 32.4]) hdHairLine(s, 24 + (xb - 24) * 0.55, 13, xb, 27.4, -1);
                for (let x = 13; x <= 35; x++) s.mod(x, 27.6 + (Math.abs(x - 24) > 9 ? -0.6 : 0), 1);
                hdHairGloss(s, 14.5, 33.5, 12.4, 4.4, 2);
                return;
            }
            if (g.side) {
                const id = s.add(H, { layer: 7, R: 4, cast: 1, grad: 0.3 });
                s.poly(id, [[34.6, 15], [34.2, 9.4], [31.6, 5.4], [26.6, 3], [21, 3.2], [16.6, 5.4], [13.8, 9.2], [12.6, 15], [12.4, 22], [12.8, 27.2], [15, 28], [21, 28.2], [27.2, 28.8], [27.6, 26.6], [27, 21.5], [27.6, 17.4], [29.4, 15]]);
                // the fringe over the forehead, and the line where it meets the sides
                hdHairLine(s, 29.6, 14.4, 29, 8, -1);
                for (let x = 13; x <= 27; x++) s.mod(x, 26.4 + (x - 13) * 0.05, 1);
                for (const [x0, x1] of [[17, 18], [21, 23], [25, 26]]) hdHairLine(s, x0, 12, x1, 25.5, -1);
                hdHairGloss(s, 15.5, 32, 8.4, 2.8, 2);
                return;
            }
            // from the front: the sides fall straight to the jaw, a blunt fringe stops above the brows
            const sides = s.add(H, { layer: 7, R: 4, cast: 1, grad: 0.26 });
            s.poly(sides, [[12, 28.6], [11.8, 22], [12.2, 14], [13.8, 8.5], [17, 4.6], [21, 2.8], [24, 2.5], [27, 2.8], [31, 4.6], [34.2, 8.5], [35.8, 14], [36.2, 22], [36, 28.6], [34.4, 29.4], [32, 29.2], [31.4, 26], [31.8, 20], [31.6, 15.6], [16.4, 15.6], [16.2, 20], [16.6, 26], [16, 29.2], [13.6, 29.4]]);
            const fringe = s.add(H, { layer: 9, R: 3, cast: 1, grad: 0.3 });
            s.poly(fringe, [[16.4, 7.6], [31.6, 7.6], [32.4, 11], [32, 15], [29, 14.6], [26.6, 15.2], [24, 14.8], [21.4, 15.2], [19, 14.6], [16, 15], [15.6, 11]]);
            for (const x of [18.5, 21, 24, 27, 29.5]) hdHairLine(s, x - 0.3, 9.5, x, 14, x === 24 ? 1 : -1);
            for (const x of [13.8, 34.2]) hdHairLine(s, x, 16, x, 26, -1);
            for (let x = 12; x <= 16; x++) { s.mod(x, 27.4, 1); s.mod(48 - x, 27.4, 1); }
            hdHairGloss(s, 15, 33, 7.6, 2.8, 2);
        });
    },
};

/* bald and shiny: the scalp grows onto the head, with a soft highlight up on the lit side */
function hdHairShine(s, x, y) {
    for (const [dx, dy, d] of [[0, 0, 2], [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1], [-1, -1, 1], [2, 0, 1], [-2, 1, 1], [1, -1, 1], [-1, 1, 1]]) s.mod(x + dx, y + dy, d);
}
HD_HAIR.bald = {
    front(s, g) {
        hdHairAt(s, g, () => {
            hdHairScalp(s, g);
            if (g.dir === 'up') { hdHairShine(s, 20, 8.6); s.mod(23, 7, 1); return; }
            if (g.side) { hdHairShine(s, 23.5, 7.4); for (let y = 12; y < 21; y++) s.mod(15.6 + (y > 17 ? 0.6 : 0), y, -1); return; }
            hdHairShine(s, 19.6, 8.2);
            s.mod(22.6, 6.8, 1);
        });
    },
};

/* very short, close to the scalp: a darker cap of stubble that hugs the skull */
function hdHairStubble(s, g, t) { return hdRamp(hdHairMix(g.H[2], hdSkin(g.look.skin)[2], t)); }
HD_HAIR.buzz = {
    front(s, g) {
        hdHairAt(s, g, () => {
            hdHairScalp(s, g);
            const id = s.add(hdHairStubble(s, g, 0.35), { layer: 5, R: 4, grad: 0.24, k: 1 });
            if (g.dir === 'up') s.poly(id, [[16, 26], [15, 23], [15.4, 17], [14.4, 12], [15.4, 8.6], [18.2, 5.6], [24, 4.2], [29.8, 5.6], [32.6, 8.6], [33.6, 12], [32.6, 17], [33, 23], [32, 26], [28, 26.8], [24, 27], [20, 26.8]]);
            else if (g.side) s.poly(id, [[31.6, 12.8], [33, 10], [31.2, 7], [27, 4.6], [21, 4.8], [17.2, 7], [15.2, 10.4], [15, 15], [15.8, 20], [17.6, 24.4], [19.6, 25.2], [20.2, 21], [20.6, 17.4], [23.2, 17], [23.6, 20.6], [24.8, 20.6], [24.8, 15.6], [26.8, 13.2]]);
            else s.poly(id, [[15.2, 19.4], [14.8, 15], [14.6, 11.4], [16, 8], [19, 5.6], [24, 4.4], [29, 5.6], [32, 8], [33.4, 11.4], [33.2, 15], [32.8, 19.4], [32.2, 19.4], [31.8, 15.4], [30.4, 13.8], [27.4, 13], [24, 13.3], [20.6, 13], [17.6, 13.8], [16.2, 15.4], [15.8, 19.4]]);
        });
    },
};

/* John's: black, short and neat, combed over from a side part */
HD_HAIR.johncut = {
    front(s, g) {
        const H = g.H;
        hdHairAt(s, g, () => {
            if (g.dir === 'up') {
                const id = s.add(H, { layer: 7, R: 4, grad: 0.3 });
                s.poly(id, [[16.4, 25.6], [15.4, 22], [15.2, 17], [13.8, 13], [14.2, 9], [16.8, 5.4], [20.6, 3.4], [24, 3], [27.4, 3.4], [31.2, 5.4], [33.8, 9], [34.2, 13], [32.8, 17], [32.6, 22], [31.6, 25.6], [28, 26.4], [24, 26.6], [20, 26.4]]);
                for (const [x0, x1] of [[20, 17.4], [23, 21.6], [26, 26.4], [29, 30.6]]) hdHairLine(s, x0, 8, x1, 24, -1);
                for (let x = 17; x <= 31; x++) s.mod(x, 24.6, -1);
                hdHairGloss(s, 15.5, 32.5, 10.4, 3.4, 0);
                return;
            }
            if (g.side) {
                const id = s.add(H, { layer: 7, R: 4, cast: 1, grad: 0.3 });
                s.poly(id, [[32.2, 13.2], [33.8, 9.6], [32, 5.8], [27.4, 3.4], [21.4, 3.4], [17, 5.6], [14.4, 9.4], [14.2, 14.6], [15, 19.6], [17, 23.8], [19.6, 24.6], [20.2, 21], [20.4, 17.2], [23.4, 16.6], [23.8, 20.4], [25, 20.4], [25, 15.2], [27, 12.8]]);
                for (const y of [7.4, 10, 12.6]) hdHairLine(s, 31, y - 1.4, 17, y + 2.6, -1);
                hdHairGloss(s, 17, 31, 6.4, 2, 0);
                return;
            }
            // from the front: a neat cap, parted on his left, combed across in tidy lines; the corners of the hairline
            // sit back a little (the scalp shows there)
            hdHairScalp(s, g);
            const id = s.add(H, { layer: 7, R: 4, cast: 1, grad: 0.3 });
            s.poly(id, [[14.8, 19.4], [14, 15.6], [13.8, 11], [15.6, 6.8], [19.6, 4], [24, 3.4], [28.6, 3.8], [32.4, 6], [34.2, 10.4], [34.2, 15.6], [33.4, 19.4], [32.6, 19.4], [32.2, 15], [31, 13.4], [29.4, 12.6], [27, 12.2], [24, 12.1], [21, 12.2], [18.6, 12.6], [17, 13.4], [15.8, 15.2], [15.6, 19.4]]);
            hdHairLine(s, 29.6, 4.4, 29.8, 9.6, -1); hdHairLine(s, 28.6, 5, 28.8, 9.4, 1);
            hdHairLine(s, 27.6, 7, 17, 9.8, -1); hdHairLine(s, 27.6, 10, 17.6, 12.4, -1); hdHairLine(s, 27.4, 5.4, 18, 6.6, 1);
            hdHairLine(s, 30.8, 6, 33.2, 10.6, -1);
            hdHairGloss(s, 16, 28, 6.4, 1.6, 0);
        });
    },
};

/* short, soft and cropped: feathered layers, a side-swept fringe and little points at the edges */
HD_HAIR.pixie = {
    front(s, g) {
        const H = g.H;
        hdHairAt(s, g, () => {
            if (g.dir === 'up') {
                const id = s.add(H, { layer: 7, R: 4, grad: 0.3 });
                s.poly(id, [[16.8, 25.4], [15.2, 22.6], [14.8, 19], [13, 14], [13.4, 9], [16.2, 5], [20.4, 3], [24, 2.6], [27.6, 3], [31.8, 5], [34.6, 9], [35, 14], [33.2, 19], [32.8, 22.6], [31.2, 25.4], [28.6, 24.2], [26.4, 25.8], [24, 24.4], [21.6, 25.8], [19.4, 24.2]]);
                const lay = s.add(H, { layer: 8, R: 3.4, grad: 0.3 });
                s.poly(lay, [[13.6, 14.6], [14, 9.6], [17, 5.6], [24, 3.6], [31, 5.6], [34, 9.6], [34.4, 14.6], [32.2, 18], [28.6, 16.8], [24, 19], [19.4, 16.8], [15.8, 18]]);
                for (const [x0, x1] of [[19, 18.4], [24, 24], [29, 29.6]]) hdHairLine(s, x0, 19.6, x1, 23.6, -1);
                hdHairGloss(s, 15.5, 32.5, 9.4, 3.2, 0);
                return;
            }
            if (g.side) {
                const id = s.add(H, { layer: 7, R: 4, cast: 1, grad: 0.3 });
                s.poly(id, [[33.6, 14.6], [34.2, 9.6], [32, 5.4], [27, 2.8], [21, 3], [16.4, 5.4], [13.6, 9.4], [13.2, 14.6], [14, 19.6], [15, 23.6], [16.6, 26.2], [18, 24.4], [19.2, 26.4], [20.4, 21.6], [20.6, 17.4], [23.4, 16.6], [24, 20.6], [25.4, 19.6], [25.6, 15.2], [27.6, 13.4], [30, 14.8], [31.4, 13.6]]);
                const sweep = s.add(H, { layer: 9, R: 3, cast: 1, grad: 0.3 });
                s.poly(sweep, [[25, 5], [30.6, 5.4], [33.8, 9], [35, 13], [34.6, 16.2], [32.4, 13.4], [29.4, 11.6], [25.6, 11.8]]);
                for (const [x0, y0, x1, y1] of [[20, 9, 15, 15], [23, 11, 17, 19], [19, 15, 16.2, 22]]) hdHairLine(s, x0, y0, x1, y1, -1);
                hdHairGloss(s, 16, 30, 6.8, 2.4, 0);
                return;
            }
            // from the front: a soft cap, the fringe swept across from her right in a few pointed pieces
            const id = s.add(H, { layer: 7, R: 4, cast: 1, grad: 0.3 });
            s.poly(id, [[14.6, 21], [13.2, 16.6], [12.8, 11.4], [14.8, 6.6], [19, 3.4], [24, 2.6], [29, 3.4], [33.2, 6.6], [35.2, 11.4], [34.8, 16.6], [33.6, 21], [32.4, 18.4], [32.2, 14.6], [30, 13], [18, 13], [16.2, 15], [15.8, 18.4]]);
            const sweep = s.add(H, { layer: 9, R: 3, cast: 1, grad: 0.3 });
            s.poly(sweep, [[15.4, 9], [19, 5.4], [25, 4.4], [31, 6], [33.4, 9.6], [33, 14.4], [31.6, 12.8], [29.8, 14.6], [27.4, 13], [25, 14.8], [22.6, 13.2], [20, 14.6], [18, 13.2], [16.4, 14], [15.2, 12]]);
            for (const [x0, y0, x1, y1] of [[20, 7, 24.4, 13.6], [24.6, 6.4, 29.4, 13.8], [17, 8.6, 19.6, 13.6]]) hdHairLine(s, x0, y0, x1, y1, -1);
            hdHairGloss(s, 15, 32, 7.6, 2.6, 0);
        });
    },
};

/* Joe's: dark, curly and messy, a cloud of round tufts with a few tumbling over the forehead (the art sample's Joe) */
HD_HAIR.joecut = {
    front(s, g) {
        const H = g.H;
        hdHairAt(s, g, () => {
            if (g.dir === 'up') {
                hdHairTufts(s, H, [[20, 5, 3], [25, 4.4, 3.1], [29.6, 5.4, 2.7], [16.8, 6.4, 2.6], [16.4, 9, 3.2], [21.4, 9, 3.4], [26.6, 8.8, 3.4], [31.6, 8.2, 3.2],
                    [14.6, 13.4, 3], [19.2, 14.2, 3.2], [24.2, 14.4, 3.3], [29.2, 14, 3.2], [33.4, 12.8, 2.8], [15.6, 18.6, 2.8], [20.2, 19.6, 3], [24.8, 20, 3], [29.4, 19.4, 3], [33, 17.8, 2.6],
                    [18.2, 22.6, 2.4], [22.4, 23.4, 2.4], [26.6, 23.4, 2.4], [30.4, 22.2, 2.3]]);
                return;
            }
            if (g.side) {
                hdHairTufts(s, H, [[17.6, 22, 2.4], [15.2, 18.4, 2.8], [14.6, 13.4, 3], [16.2, 8.6, 3.2], [20.2, 5, 3.3], [25.6, 4, 3.4], [30.6, 5.6, 3], [19.4, 15.6, 2.6],
                    [19.8, 10.4, 3], [24.8, 8.8, 3.2], [29.6, 9.4, 2.8], [33.4, 9.8, 2.7], [23.4, 13.4, 2.4], [27.8, 12.6, 2.3], [31.4, 12.8, 2.1], [34, 13.4, 1.9]], { cast: 1, castY: 9 });
                return;
            }
            hdHairTufts(s, H, [[21, 3.4, 2.7], [27, 3, 2.7], [17.5, 5, 2.4], [31.5, 4.4, 2.4], [16, 9.2, 3.3], [20.5, 6.6, 3.4], [25.5, 5.6, 3.6], [30.5, 7.6, 3.3], [33.5, 11.2, 2.9],
                [14, 13, 2.8], [34.2, 15, 2.3], [13.8, 16.8, 2.1], [18.4, 11.4, 2.7], [23.4, 10.6, 2.8], [28.4, 11.2, 2.7], [31.6, 13.6, 2.2], [21, 13, 1.9]], { cast: 1, castY: 9 });
        });
    },
};

/* big and round: one soft ball of coils with a bumpy edge, the face set into it */
function hdHairBumps(s, id, cx, cy, rx, ry, a0, a1, r, n) { for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; s.ellipse(id, cx + Math.cos(a) * (rx - r * 0.4), cy + Math.sin(a) * (ry - r * 0.4), r, r); } }
function hdHairCoils(s, id, cx, cy, rx, ry) {
    // little c-shaped coils scattered over the ball (a dark arc under a lighter pixel), spaced out, none at the rim
    for (let j = 0, y = cy - ry; y <= cy + ry; y += 3.4, j++) for (let x = cx - rx + (j % 2) * 2.6; x <= cx + rx; x += 5.2) {
        const h = (Math.round(x) * 7 + Math.round(y) * 13) % 5, xx = x + h * 0.5 - 1, yy = y + (h % 2) * 0.8, u = (xx - cx) / rx, v = (yy - cy) / ry;
        if (u * u + v * v > 0.62 || s.at(Math.round(xx + s.dx), Math.round(yy + s.dy)) !== id) continue;
        s.mod(xx, yy, 1); s.mod(xx - 1, yy + 1, -1); s.mod(xx, yy + 1, -1); if (h > 2) s.mod(xx + 1, yy + 0.6, -1);
    }
}
HD_HAIR.afro = {
    front(s, g) {
        const H = g.H;
        hdHairAt(s, g, () => {
            const id = s.add(H, { layer: 7, R: 7, cast: 1, grad: 0.34, k: 1.1 });
            if (g.dir === 'up') {
                s.ellipse(id, 24, 12.9, 15, 12.2);
                hdHairBumps(s, id, 24, 12.9, 15, 12.2, -40, 220, 1.7, 18);
                hdHairCoils(s, id, 24, 12.9, 15, 12.2);
                return;
            }
            if (g.side) {
                s.poly(id, hdHairArc(22.4, 12.9, 14, 12.2, -28, -250, 22).concat([[20.4, 23.4], [24.2, 21.6], [25, 16.6], [27.6, 14.4], [31.4, 13.8]]));
                hdHairBumps(s, id, 22.4, 12.9, 14, 12.2, -235, -38, 1.7, 16);
                hdHairCoils(s, id, 22.4, 12.9, 14, 12.2);
                return;
            }
            s.poly(id, hdHairArc(24, 12.7, 15.2, 12.2, 150, 390, 24).concat([[33.8, 22.6], [32.6, 17.4], [31.6, 14.6], [28, 13.6], [24, 13.4], [20, 13.6], [16.4, 14.6], [15.4, 17.4], [14.2, 22.6]]));
            hdHairBumps(s, id, 24, 12.7, 15.2, 12.2, -200, 20, 1.7, 18);
            hdHairBumps(s, id, 24, 12.7, 15.2, 12.2, 160, 200, 1.7, 2); hdHairBumps(s, id, 24, 12.7, 15.2, 12.2, -20, 20, 1.7, 2);
            hdHairCoils(s, id, 24, 12.7, 15.2, 12.2);
        });
    },
};

/* bald on top, with a ring of hair around the sides and back */
HD_HAIR.friar = {
    front(s, g) {
        const H = g.H;
        hdHairAt(s, g, () => {
            hdHairScalp(s, g);
            const id = s.add(H, { layer: 7, R: 3, grad: 0.24, k: 1.4 });
            if (g.dir === 'up') {
                s.poly(id, [[14, 11], [18, 13.4], [24, 14.2], [30, 13.4], [34, 11], [34.8, 15], [33.6, 20], [31.6, 24], [28, 25.8], [24, 26.2], [20, 25.8], [16.4, 24], [14.4, 20], [13.2, 15]]);
                hdHairBumps(s, id, 24, 18.4, 10.6, 7.8, 10, 170, 1.6, 9);
                hdHairShine(s, 20, 7.4);
                for (const x of [17, 21, 25, 29, 32]) hdHairLine(s, x, 16, x + (x - 24) * 0.1, 23, -1);
                return;
            }
            if (g.side) {
                s.poly(id, [[26, 12.4], [23, 11], [19, 10.2], [15.6, 10.8], [13.6, 13.4], [13.6, 17], [14.6, 20.6], [16.8, 23.6], [19.2, 24.8], [20, 22], [19.6, 18.4], [21.6, 16.8], [23.4, 17.6], [24.4, 19.6], [25.6, 18.8], [25.6, 15.4]]);
                hdHairShine(s, 25, 6.6);
                for (let y = 13; y <= 22; y += 3) hdHairLine(s, 15, y, 18.6, y + 1.2, -1);
                return;
            }
            // from the front: a puff of hair over each ear
            for (const sg of [-1, 1]) {
                const X = x => 24 + sg * (x - 24);
                s.poly(id, [[X(16.4), 11.4], [X(14.4), 10.8], [X(12.8), 12.6], [X(12.2), 15.6], [X(12.8), 18.6], [X(13.8), 17.4], [X(15.4), 18.6], [X(16), 15.6]]);
                hdHairLine(s, X(13.6), 13, X(13.8), 16.6, -1);
            }
            hdHairShine(s, 19.6, 7.6);
            s.mod(22.6, 6.4, 1);
        });
    },
};

/* shaved sides and a tall crest of spikes from the forehead to the nape */
HD_HAIR.mohawk = {
    front(s, g) {
        const H = g.H;
        hdHairAt(s, g, () => {
            hdHairScalp(s, g);
            const sh = s.add(hdHairStubble(s, g, 0.48), { layer: 5, R: 4, grad: 0.24, k: 1, bias: -0.08 });
            const crest = s.add(H, { layer: 8, R: 2.6, grad: 0.36, k: 1.4 });
            if (g.dir === 'up') {
                s.poly(sh, [[16, 26], [15, 23], [15.4, 17], [14.4, 12], [15.4, 8.6], [18.2, 5.6], [24, 4.2], [29.8, 5.6], [32.6, 8.6], [33.6, 12], [32.6, 17], [33, 23], [32, 26], [28, 26.8], [24, 27], [20, 26.8]]);
                s.poly(crest, [[22, 22.4], [21.6, 14], [21, 6], [21.6, 1.6], [22.8, 3.4], [24, 0], [25.2, 3.4], [26.4, 1.6], [27, 6], [26.4, 14], [26, 22.4], [24, 23.4]]);
                for (let y = 7; y < 22; y += 3) { s.mod(23, y, -1); s.mod(24, y + 1, -1); s.mod(25, y + 2, -1); }
                return;
            }
            if (g.side) {
                s.poly(sh, [[31.6, 12.8], [33, 10], [31.2, 7], [27, 4.6], [21, 4.8], [17.2, 7], [15.2, 10.4], [15, 15], [15.8, 20], [17.6, 24.4], [19.6, 25.2], [20.2, 21], [20.6, 17.4], [23.2, 17], [23.6, 20.6], [24.8, 20.6], [24.8, 15.6], [26.8, 13.2]]);
                // side-on: a row of spikes along the middle of the scalp, each a part in front of the one behind it
                const base = s.add(H, { layer: 8, R: 2, grad: 0.3 });
                s.poly(base, [[14, 14.6], [15, 9.6], [18.6, 5.8], [24, 4.2], [29, 4.8], [32.4, 7.6], [33.6, 11.6], [31.4, 9.6], [28.4, 7.6], [24, 7], [19.6, 8.2], [16.6, 11.2], [15.6, 15]]);
                [[[13.8, 15], [17.6, 9], [10.4, 11.6]], [[15.4, 10.6], [20.8, 6], [13.6, 3.8]], [[18.6, 6.8], [25.2, 4.6], [19.2, 0.4]], [[23, 4.8], [29.6, 5.6], [26, 0]], [[27.6, 5.2], [32.8, 9.2], [32, 1.2]], [[31, 7.6], [33.6, 12], [35.8, 5.6]]]
                    .forEach(([b0, b1, t], i) => { const id = s.add(H, { layer: 9 + i, R: 1.8, grad: 0.3, k: 1.5 }); const m = [(b0[0] + b1[0]) / 2, (b0[1] + b1[1]) / 2]; s.poly(id, [b0, t, b1, [m[0] + (24.4 - m[0]) * 0.25, m[1] + (13.4 - m[1]) * 0.25]]); });
                return;
            }
            // from the front the crest is seen end-on: a tall narrow fin over the middle of the head
            s.poly(sh, [[15.2, 19.4], [14.8, 15], [14.6, 11.4], [16, 8], [19, 5.6], [24, 4.4], [29, 5.6], [32, 8], [33.4, 11.4], [33.2, 15], [32.8, 19.4], [32.2, 19.4], [31.8, 15.4], [30.4, 13.8], [27.4, 13], [24, 13.3], [20.6, 13], [17.6, 13.8], [16.2, 15.4], [15.8, 19.4]]);
            s.poly(crest, [[21, 13.4], [20.4, 7], [20.8, 2.4], [22.4, 3.6], [24, 0], [25.6, 3.6], [27.2, 2.4], [27.6, 7], [27, 13.4], [24, 13.8]]);
            hdHairLine(s, 23.4, 4, 23, 12, 1);
        });
    },
};

/* big long curls with lots of volume: a cloud of curls on top, ringlets falling past the shoulders */
HD_HAIR.curls = {
    back(s, g) {
        const H = g.H;
        hdHairAt(s, g, () => {
            if (g.dir === 'down') [[9.4, 40, 0], [13.4, 44, 1.2], [18, 45.4, 2.4], [24, 46, 0.6], [30, 45.4, 1.8], [34.6, 44, 3], [38.6, 40, 2]].forEach(([x, y1, ph], i) => hdHairRinglet(s, H, x, 10, y1, 5, ph, { layer: i % 2, bias: -0.12 }));
            else if (g.side) [[11.4, 42, 0.4], [15.2, 45, 1.6], [19, 44, 2.8], [22.4, 41, 1]].forEach(([x, y1, ph], i) => hdHairRinglet(s, H, x, 10, y1, 5, ph, { layer: i % 2, bias: -0.08 }));
        });
    },
    front(s, g) {
        const H = g.H;
        hdHairAt(s, g, () => {
            if (g.dir === 'up') {
                [[11, 40, 0], [15.4, 44, 1.2], [19.8, 45.6, 2.4], [24.2, 46.4, 0.6], [28.6, 45.6, 1.8], [33, 44, 3], [37.2, 40, 2]].forEach(([x, y1, ph], i) => hdHairRinglet(s, H, x, 12, y1, 5.2, ph, { layer: 7 + (i % 2) * 2, bias: (i % 2) * 0.04 }));
                hdHairTufts(s, H, [[16.4, 7.4, 3.4], [22, 5, 3.6], [27.6, 5.2, 3.5], [32.2, 7.6, 3.3], [13.6, 12.4, 3.2], [19.2, 10.8, 3.6], [24.6, 10.2, 3.7], [30, 11, 3.6], [34.8, 12.6, 3.1],
                    [16.6, 15.6, 3.2], [22.4, 15, 3.4], [28, 15.2, 3.4], [32.4, 16.2, 3]], { layer: 30, R: 2.6 });
                return;
            }
            if (g.side) {
                hdHairRinglet(s, H, 16.4, 14, 43, 5, 0.8, { layer: 6 });
                hdHairTufts(s, H, [[14.6, 16.4, 3.2], [13.8, 11.2, 3.3], [16.8, 6.4, 3.4], [22.2, 3.8, 3.5], [27.8, 3.8, 3.4], [32.2, 6.6, 3], [19.2, 10.6, 3.5], [25, 8.6, 3.6], [30, 10, 3], [33.8, 10.4, 2.6],
                    [19.8, 15.8, 3], [24.4, 13.4, 2.6], [28.6, 12.8, 2.3], [32, 12.8, 2.1], [34.4, 13.4, 1.8]], { layer: 20, cast: 1, castY: 9, R: 2.6 });
                hdHairRinglet(s, H, 20.8, 17, 39, 4.6, 2.2, { layer: 40, drift: 1.4 });
                return;
            }
            // from the front: ringlets down both sides (the inner ones start below the eyes), a cloud on top, curly bangs
            for (const sg of [-1, 1]) {
                const X = x => 24 + sg * (x - 24);
                hdHairRinglet(s, H, X(10.8), 12, 40, 5, sg < 0 ? 0.4 : 2.1, { layer: 6, bias: -0.04 });
                hdHairRinglet(s, H, X(14.4), 16, 43.6, 4.8, sg < 0 ? 1.7 : 3.2, { layer: 12, drift: sg * -1.8 });
            }
            hdHairTufts(s, H, [[12.4, 11.4, 3.2], [35.6, 11.4, 3.2], [16.2, 6.4, 3.2], [31.8, 6.4, 3.2], [21, 4, 3.4], [27, 3.8, 3.4], [19.6, 8.4, 3.4], [25, 7.6, 3.6], [30, 9, 3.3],
                [14.6, 11, 3], [33.6, 11.6, 2.9], [17.4, 12.2, 2.4], [21.6, 11.8, 2.5], [26, 11.6, 2.5], [30.2, 12.2, 2.4], [13.4, 15.8, 2.5], [34.6, 16, 2.4]], { layer: 30, cast: 1, castY: 9, R: 2.6 });
        });
    },
};

/* two long braids over the shoulders from a middle parting */
HD_HAIR.braids = {
    front(s, g) {
        const H = g.H;
        hdHairAt(s, g, () => {
            if (g.dir === 'up') {
                const cap = s.add(H, { layer: 7, R: 4, grad: 0.3 });
                s.poly(cap, [[17, 25], [15.4, 22], [14.8, 17], [13.6, 13], [14, 8.6], [16.8, 5], [20.6, 3.2], [24, 2.8], [27.4, 3.2], [31.2, 5], [34, 8.6], [34.4, 13], [33.2, 17], [32.6, 22], [31, 25], [27.6, 24], [24, 25.4], [20.4, 24]]);
                hdHairLine(s, 24, 3.4, 24, 24.6, -1);
                for (const x of [18.4, 29.6]) hdHairLine(s, x + (x < 24 ? -1.6 : 1.6), 8, x, 22, -1);
                hdHairGloss(s, 15, 33, 9.6, 3, 0);
                hdHairBraid(s, H, 20.4, 22, 19.4, 32, 18, 42, 5, { layer: 9 });
                hdHairBraid(s, H, 27.6, 22, 28.6, 32, 30, 42, 5, { layer: 9 });
                return;
            }
            if (g.side) {
                const cap = s.add(H, { layer: 7, R: 4, cast: 1, grad: 0.3 });
                s.poly(cap, [[33.6, 14], [34, 9.4], [32, 5.4], [27, 3], [21, 3.2], [16.4, 5.4], [13.8, 9.4], [13.6, 15], [14.6, 20.4], [17, 24], [19.4, 24.6], [20, 21], [19.8, 17.6], [22.4, 16.6], [25, 15.8], [28, 13.6], [31, 13.2]]);
                for (const y of [8, 11.4]) hdHairLine(s, 31.6, y - 2, 18, y + 4.6, -1);
                hdHairGloss(s, 16, 31, 6.6, 2.4, 0);
                hdHairBraid(s, H, 18.6, 22.4, 23, 29, 26.4, 42, 5, { layer: 9 });
                return;
            }
            const cap = s.add(H, { layer: 7, R: 4, cast: 1, grad: 0.3 });
            s.poly(cap, [[14.6, 24], [13, 19], [12.8, 11.4], [14.8, 6.6], [19, 3.4], [24, 2.6], [29, 3.4], [33.2, 6.6], [35.2, 11.4], [35, 19], [33.4, 24], [32.4, 19], [32.2, 15.4], [30.4, 14], [27, 13.4], [24, 13.6], [21, 13.4], [17.6, 14], [15.8, 15.4], [15.6, 19]]);
            hdHairLine(s, 24, 3.2, 24, 13, -1);
            for (const sg of [-1, 1]) { const X = x => 24 + sg * (x - 24); hdHairLine(s, X(22), 5, X(14.6), 18, -1); hdHairLine(s, X(19.6), 4.6, X(13.8), 13, -1); }
            hdHairGloss(s, 14.5, 22.6, 8.4, 2.4, 0); hdHairGloss(s, 25.4, 33.5, 8.4, 2.4, 0);
            hdHairBraid(s, H, 14.4, 21, 12.8, 32, 15.2, 43, 5.2, { layer: 9 });
            hdHairBraid(s, H, 33.6, 21, 35.2, 32, 32.8, 43, 5.2, { layer: 9 });
        });
    },
};

/* tied high at the back of the head, the tail swinging as she walks */
function hdHairTie(s, H, x, y, rx, ry, ang) { const id = s.add(hdRamp(hdHairMix(H[2], [30, 20, 24], 0.45)), { layer: 20, R: 1.2 }); hdHairOval(s, id, x, y, rx, ry, ang || 0); return id; }
HD_HAIR.ponytail = {
    back(s, g) {
        const H = g.H;
        hdHairAt(s, g, () => {
            if (g.dir === 'down') {
                // the tail shows above the crown and swings out behind one shoulder
                const id = s.add(H, { layer: 0, R: 2.6, grad: 0.3, bias: -0.06 });
                hdHairRibbon(s, id, 27, 3.2, 40.6, 1.4, 38.8, 32, 6.6, 1.2, 3.4);
                hdHairLine(s, 37, 7, 38.4, 27, -1);
            }
        });
    },
    front(s, g) {
        const H = g.H, sw = g.body === 'walkA' ? -2.4 : g.body === 'walkB' ? 1.6 : 0;
        hdHairAt(s, g, () => {
            if (g.dir === 'up') {
                const cap = s.add(H, { layer: 7, R: 4, grad: 0.3 });
                s.poly(cap, [[17, 25], [15.4, 22], [14.8, 17], [13.6, 13], [14, 8.6], [16.8, 5], [20.6, 3.2], [24, 2.8], [27.4, 3.2], [31.2, 5], [34, 8.6], [34.4, 13], [33.2, 17], [32.6, 22], [31, 25], [27.6, 24.6], [24, 25.4], [20.4, 24.6]]);
                for (const xb of [17.4, 20.6, 27.4, 30.6]) hdHairLine(s, xb, 23, 24 + (xb - 24) * 0.3, 9, -1);
                hdHairGloss(s, 15.5, 32.5, 13, 3, 0);
                const tail = s.add(H, { layer: 9, R: 2.8, grad: 0.3 });
                hdHairRibbon(s, tail, 24, 7, 25.4 + sw * 0.3, 22, 24.4 + sw, 38, 6.4, 1.4, 2.4);
                hdHairLine(s, 24.4, 10, 24.4 + sw * 0.6, 34, -1);
                hdHairTie(s, H, 24, 7.4, 2.8, 1.6);
                return;
            }
            if (g.side) {
                const tail = s.add(H, { layer: 6, R: 2.8, grad: 0.3 });
                hdHairRibbon(s, tail, 16.4, 6.4, 6.6 + sw * 0.4, 6, 10.4 + sw, 32, 5.6, 1.2, 3.4);
                const cap = s.add(H, { layer: 7, R: 4, cast: 1, grad: 0.3 });
                s.poly(cap, [[33.6, 14], [34, 9.4], [32, 5.4], [27, 3], [21, 3.2], [16.4, 5.4], [13.8, 9.4], [13.6, 15], [14.6, 20.4], [17, 24], [19.4, 24.6], [20, 21], [19.8, 17.6], [22.4, 16.6], [25, 15.8], [28, 13.6], [31, 13.2]]);
                for (const y of [9, 12.6, 16]) hdHairLine(s, 31.6, y - 3, 17, 7 + (y - 9) * 0.3, -1);
                hdHairGloss(s, 18, 31, 6.4, 2, 0);
                hdHairLine(s, 11, 12, 10.4 + sw * 0.7, 28, -1);
                hdHairTie(s, H, 16, 6.6, 1.4, 2.6, 20);
                return;
            }
            const cap = s.add(H, { layer: 7, R: 4, cast: 1, grad: 0.3 });
            s.poly(cap, [[14.6, 20], [13, 16], [12.8, 11.4], [14.8, 6.6], [19, 3.4], [24, 2.6], [29, 3.4], [33.2, 6.6], [35.2, 11.4], [35, 16], [33.4, 20], [32.6, 16.4], [31.8, 14.6], [29, 13.6], [24, 13.4], [19, 13.6], [16.2, 14.6], [15.4, 16.4]]);
            // combed back from the face towards the tie
            for (const x of [17, 20.4, 24, 27.6, 31]) hdHairLine(s, x + (x - 24) * 0.25, 13.4, 24 + (x - 24) * 0.5, 4, -1);
            hdHairGloss(s, 15, 33, 8.2, 2.6, 0);
        });
    },
};

/* everything up into a round top-knot */
HD_HAIR.bun = {
    front(s, g) {
        const H = g.H;
        hdHairAt(s, g, () => {
            const knot = (x, y) => {
                const b = s.add(H, { layer: 12, R: 3, grad: 0.3, k: 1.4 });
                s.ellipse(b, x, y, 5.4, 3.7);
                const l = s.add(H, { layer: 13, R: 2.2, grad: 0.3, k: 1.4 });
                hdHairOval(s, l, x - 1.2, y - 0.6, 3.2, 2.2, -12);
                hdHairLine(s, x + 1.6, y - 2.4, x + 3.6, y + 0.4, -1);
                hdHairTie(s, H, x, y + 3.2, 3.6, 0.9);
            };
            if (g.dir === 'up') {
                const cap = s.add(H, { layer: 7, R: 4, grad: 0.3 });
                s.poly(cap, [[17.2, 23], [15.4, 20.4], [14.8, 17], [13.6, 13], [14, 8.6], [16.8, 5.4], [20.6, 4], [24, 3.6], [27.4, 4], [31.2, 5.4], [34, 8.6], [34.4, 13], [33.2, 17], [32.6, 20.4], [30.8, 23], [27.6, 22.6], [24, 23.4], [20.4, 22.6]]);
                for (const xb of [17.4, 21, 24, 27, 30.6]) hdHairLine(s, xb, 22, 24 + (xb - 24) * 0.45, 7, -1);
                hdHairGloss(s, 15.5, 32.5, 13, 3, 0);
                knot(24, 3.6);
                return;
            }
            if (g.side) {
                const cap = s.add(H, { layer: 7, R: 4, cast: 1, grad: 0.3 });
                s.poly(cap, [[33.6, 14], [34, 9.4], [32, 5.8], [27, 3.8], [21, 4], [16.4, 6], [13.8, 9.6], [13.6, 15], [14.6, 20.4], [17, 24], [19.4, 24.6], [20, 21], [19.8, 17.6], [22.4, 16.6], [25, 15.8], [28, 13.6], [31, 13.2]]);
                for (const [x0, y0] of [[31, 11], [27, 13], [16, 19], [15, 14]]) hdHairLine(s, x0, y0, 23 + (x0 - 23) * 0.3, 6, -1);
                hdHairGloss(s, 17, 31, 7.2, 2, 0);
                knot(23, 3.6);
                return;
            }
            const cap = s.add(H, { layer: 7, R: 4, cast: 1, grad: 0.3 });
            s.poly(cap, [[14.6, 20], [13, 16], [12.8, 11.4], [14.8, 7], [19, 4.2], [24, 3.6], [29, 4.2], [33.2, 7], [35.2, 11.4], [35, 16], [33.4, 20], [32.6, 16.4], [31.8, 14.6], [29, 13.6], [24, 13.4], [19, 13.6], [16.2, 14.6], [15.4, 16.4]]);
            for (const x of [16.6, 20.2, 27.8, 31.4]) hdHairLine(s, x + (x - 24) * 0.25, 14, 24 + (x - 24) * 0.45, 5, -1);
            hdHairGloss(s, 15, 33, 8.6, 2.4, 0);
            // a wisp loose at each temple
            for (const sg of [-1, 1]) { const w = s.add(H, { layer: 9, R: 1.4, grad: 0.2 }); hdHairRibbon(s, w, 24 + sg * 8.6, 13.6, 24 + sg * 9.8, 17, 24 + sg * 9, 21.4, 1.8, 0.6, 0.4); }
            knot(24, 3.6);
        });
    },
};

/* two short tails tied high on the sides of the head */
HD_HAIR.pigtails = {
    back(s, g) {
        const H = g.H;
        // side-on, the far tail just shows behind the head
        hdHairAt(s, g, () => { if (g.side) { const id = s.add(H, { layer: 0, R: 2.4, grad: 0.3, bias: -0.1 }); hdHairRibbon(s, id, 21, 6.4, 13, 3.6, 12.6, 17, 4.6, 1, 2); } });
    },
    front(s, g) {
        const H = g.H;
        hdHairAt(s, g, () => {
            const tail = (x, y, sg, x1) => {
                const id = s.add(H, { layer: 9, R: 2.6, grad: 0.3 });
                hdHairRibbon(s, id, x, y, x - sg * 6.6, y - 0.4, x1, y + 14.6, 4.8, 1, 3.2);
                hdHairLine(s, x - sg * 3, y + 1.6, x1 + sg * 0.6, y + 12, -1);
                hdHairTie(s, H, x, y, 1.3, 2.4, sg * 14);
            };
            if (g.dir === 'up') {
                const cap = s.add(H, { layer: 7, R: 4, grad: 0.3 });
                s.poly(cap, [[17, 24], [15.4, 21.4], [14.8, 17], [13.6, 13], [14, 8.6], [16.8, 5], [20.6, 3.2], [24, 2.8], [27.4, 3.2], [31.2, 5], [34, 8.6], [34.4, 13], [33.2, 17], [32.6, 21.4], [31, 24], [27.6, 23.6], [24, 24.2], [20.4, 23.6]]);
                hdHairLine(s, 24, 3.4, 24, 23.6, -1);
                for (const sg of [-1, 1]) for (const y of [16, 20.4]) hdHairLine(s, 24 + sg * 1.6, y + 2, 24 + sg * 9, 11, -1);
                hdHairGloss(s, 15, 33, 9.4, 3, 0);
                tail(13.6, 10, 1, 9.2); tail(34.4, 10, -1, 38.8);
                return;
            }
            if (g.side) {
                const cap = s.add(H, { layer: 7, R: 4, cast: 1, grad: 0.3 });
                s.poly(cap, [[33.6, 14], [34, 9.4], [32, 5.4], [27, 3], [21, 3.2], [16.4, 5.4], [13.8, 9.4], [13.6, 15], [14.6, 20.4], [17, 23.6], [19.4, 24.2], [20, 21], [19.8, 17.6], [22.4, 16.6], [25, 15.8], [28, 13.6], [31, 13.2]]);
                for (const y of [6.4, 9.6, 13.4]) hdHairLine(s, 32, y + 1, 21, 9.4, -1);
                hdHairLine(s, 16, 19, 19.4, 10.6, -1);
                hdHairGloss(s, 16, 31, 6.6, 2.4, 0);
                tail(19.6, 9.6, 1, 14.4);
                return;
            }
            const cap = s.add(H, { layer: 7, R: 4, cast: 1, grad: 0.3 });
            s.poly(cap, [[14.6, 21], [13, 16], [12.8, 11.4], [14.8, 6.6], [19, 3.4], [24, 2.6], [29, 3.4], [33.2, 6.6], [35.2, 11.4], [35, 16], [33.4, 21], [32.4, 17], [32, 15], [29.4, 13.6], [24, 13.4], [18.6, 13.6], [16, 15], [15.6, 17]]);
            hdHairLine(s, 24, 3.2, 24, 13, -1);
            for (const sg of [-1, 1]) { const X = x => 24 + sg * (x - 24); hdHairLine(s, X(22.4), 4.6, X(14.6), 9.6, -1); hdHairLine(s, X(21.6), 9, X(15), 11.2, -1); }
            hdHairGloss(s, 14.5, 22.6, 8.2, 2.4, 0); hdHairGloss(s, 25.4, 33.5, 8.2, 2.4, 0);
            tail(13.4, 10, 1, 8.6); tail(34.6, 10, -1, 39.4);
        });
    },
};

/* two buns up on top, the rest of the hair down to the shoulders */
HD_HAIR.spacebuns = {
    back(s, g) {
        const H = g.H;
        hdHairAt(s, g, () => {
            if (g.dir === 'down') { const id = s.add(H, { layer: 0, R: 3, grad: 0.3, bias: -0.12 }); s.poly(id, [[13, 12], [35, 12], [36, 31.4], [33, 32.6], [28, 32], [24, 33], [20, 32], [15, 32.6], [12, 31.4]]); }
            else if (g.side) {
                const id = s.add(H, { layer: 0, R: 3, grad: 0.3, bias: -0.08 });
                s.poly(id, [[14, 10], [22, 12], [23, 31], [20, 33], [16.6, 32], [13.4, 33], [12, 30], [12.4, 18]]);
                // the far bun, peeking out behind the near one
                const b = s.add(H, { layer: 0, R: 3, grad: 0.3, bias: -0.12 }); s.ellipse(b, 18.6, 3.4, 4.2, 3.4);
            }
        });
    },
    front(s, g) {
        const H = g.H;
        hdHairAt(s, g, () => {
            const bun = (x, y, r) => {
                const b = s.add(H, { layer: 12, R: 2.8, grad: 0.3, k: 1.4 });
                s.ellipse(b, x, y, r, r * 0.86);
                const l = s.add(H, { layer: 13, R: 2, grad: 0.3, k: 1.4 });
                hdHairOval(s, l, x - r * 0.25, y - r * 0.18, r * 0.6, r * 0.42, -20);
                hdHairLine(s, x + r * 0.3, y - r * 0.6, x + r * 0.7, y + r * 0.2, -1);
            };
            if (g.dir === 'up') {
                const cap = s.add(H, { layer: 7, R: 4, grad: 0.3 });
                s.poly(cap, [[12.6, 31.4], [12.4, 22], [13.2, 13], [14, 8.6], [16.8, 5], [20.6, 3.2], [24, 2.8], [27.4, 3.2], [31.2, 5], [34, 8.6], [34.8, 13], [35.6, 22], [35.4, 31.4], [32.6, 32.6], [28, 32], [24, 33], [20, 32], [15.4, 32.6]]);
                hdHairLine(s, 24, 3.4, 24, 15, -1);
                for (const x of [16.4, 20.2, 27.8, 31.6]) hdHairLine(s, x + (x - 24) * 0.12, 17, x + (x - 24) * 0.2, 31, -1);
                hdHairGloss(s, 15, 33, 12.4, 3, 0);
                bun(16.4, 4.6, 4.4); bun(31.6, 4.6, 4.4);
                return;
            }
            if (g.side) {
                const cap = s.add(H, { layer: 7, R: 4, cast: 1, grad: 0.3 });
                s.poly(cap, [[33.6, 14], [34, 9.4], [32, 5.4], [27, 3], [21, 3.2], [16.4, 5.4], [13.8, 9.4], [13.2, 15], [13.4, 24], [16, 28], [21.4, 27.4], [23.4, 23], [24.6, 17], [26.8, 13.8], [30.6, 12.8]]);
                const fall = s.add(H, { layer: 8, R: 2.6, grad: 0.3 });
                s.poly(fall, [[18.6, 15], [24.2, 16], [24, 24], [23.4, 30], [21.6, 32.4], [19.4, 31], [17.6, 31.8], [17.4, 24]]);
                hdHairLine(s, 20.8, 19, 20.6, 30, -1);
                hdHairGloss(s, 16, 31, 7.4, 2.4, 0);
                bun(24, 3.6, 4.4);
                return;
            }
            const cap = s.add(H, { layer: 7, R: 4, cast: 1, grad: 0.3 });
            s.poly(cap, [[12.6, 22], [12.8, 10.5], [15.6, 5.6], [20, 3.1], [24, 2.6], [28, 3.1], [32.4, 5.6], [35.2, 10.5], [35.4, 22], [32, 22], [31, 15], [28, 13.4], [24, 13.2], [20, 13.4], [17, 15], [16, 22]]);
            for (const sg of [-1, 1]) {
                const X = x => 24 + sg * (x - 24), id = s.add(H, { layer: 8, R: 2.6, cast: 1, grad: 0.3 });
                s.poly(id, [[X(13), 14], [X(16.4), 14.6], [X(16.8), 20], [X(16.6), 25], [X(17.4), 29.4], [X(16.4), 32], [X(14.8), 29.6], [X(13), 31], [X(11.8), 26], [X(12.2), 19]]);
                hdHairLine(s, X(14.6), 19, X(14.6), 28, -1);
            }
            hdHairLine(s, 24, 3.2, 24, 13, -1);
            hdHairGloss(s, 14.5, 22.6, 9.2, 2.2, 0); hdHairGloss(s, 25.4, 33.5, 9.2, 2.2, 0);
            bun(16.4, 4.6, 4.4); bun(31.6, 4.6, 4.4);
        });
    },
};

/* short on top and at the sides, long at the back */
HD_HAIR.mullet = {
    back(s, g) {
        const H = g.H;
        hdHairAt(s, g, () => {
            if (g.dir === 'down') {
                const id = s.add(H, { layer: 0, R: 3, grad: 0.3, bias: -0.1 });
                s.poly(id, [[14, 15], [34, 15], [35.4, 22], [36.6, 28], [38.6, 34.6], [35.8, 34.2], [33.6, 36.6], [30.6, 34.6], [27, 36], [24, 34.8], [21, 36], [17.4, 34.6], [14.4, 36.6], [12.2, 34.2], [9.4, 34.6], [11.4, 28], [12.6, 22]]);
                for (const x of [12.4, 35.6]) hdHairLine(s, x, 24, x + (x < 24 ? -1.6 : 1.6), 33, -1);
            }
        });
    },
    front(s, g) {
        const H = g.H;
        hdHairAt(s, g, () => {
            if (g.dir === 'up') {
                const id = s.add(H, { layer: 7, R: 4, grad: 0.3 });
                s.poly(id, [[15, 22], [13.6, 13], [14, 8.6], [16.8, 5], [20.6, 3.2], [24, 2.8], [27.4, 3.2], [31.2, 5], [34, 8.6], [34.4, 13], [33, 22]]);
                const back = s.add(H, { layer: 8, R: 3, grad: 0.3 });
                s.poly(back, [[15, 15], [33, 15], [34, 24], [35.4, 30], [37.6, 35.4], [34.6, 34.6], [32.4, 36.8], [29.6, 34.8], [27, 36.4], [24, 35], [21, 36.4], [18.4, 34.8], [15.6, 36.8], [13.4, 34.6], [10.4, 35.4], [12.6, 30], [14, 24]]);
                for (const x of [18.4, 21.6, 26.4, 29.6]) hdHairLine(s, x, 19, x + (x - 24) * 0.2, 33, -1);
                hdHairGloss(s, 15.5, 32.5, 10, 3, 0);
                return;
            }
            if (g.side) {
                const back = s.add(H, { layer: 6, R: 3, grad: 0.3 });
                s.poly(back, [[13.2, 12], [20.6, 13.4], [21.6, 17], [21.4, 22], [22.6, 27], [23.6, 32], [22.8, 35.6], [20.6, 35], [18.8, 37.2], [16.4, 35.4], [13.8, 37], [10.8, 35], [12.2, 30], [12.2, 22]]);
                hdHairLine(s, 15.6, 22, 14.2, 34, -1); hdHairLine(s, 19, 22, 18.6, 34, -1); hdHairLine(s, 21.6, 26, 21.8, 33, 1);
                const id = s.add(H, { layer: 7, R: 4, cast: 1, grad: 0.3 });
                s.poly(id, [[34.2, 14.2], [34.4, 9.4], [32, 5.4], [27, 3], [21, 3.2], [16.4, 5.4], [13.8, 9.4], [13.6, 15], [15, 20], [18.4, 21], [20.2, 18.4], [22.4, 16.6], [24, 16.8], [24.6, 19.6], [25.6, 19], [25.6, 15.4], [27.6, 13.6], [29.6, 14.6], [31, 13.4], [32.6, 14.8]]);
                hdHairGloss(s, 16, 31, 6.4, 2.4, 0);
                return;
            }
            const id = s.add(H, { layer: 7, R: 4, cast: 1, grad: 0.3 });
            s.poly(id, [[14.4, 19.4], [13.2, 15.6], [13, 11], [15, 6.4], [19.2, 3.6], [24, 2.8], [28.8, 3.6], [33, 6.4], [35, 11], [34.8, 15.6], [33.6, 19.4], [32.6, 19.4], [32.2, 15.4], [31.2, 14.4], [29.6, 15], [28.4, 13.4], [26.4, 14.8], [24.4, 13.2], [22.2, 14.8], [20, 13.4], [18.6, 15], [16.8, 14.4], [15.8, 15.4], [15.4, 19.4]]);
            for (const x of [19.2, 23.4, 27.6]) hdHairLine(s, x + 0.6, 8, x + 0.8, 13, -1);
            hdHairGloss(s, 15, 33, 7.8, 2.6, 0);
        });
    },
};

/* David's: thick ginger hair in a big swoop up and over to one side, short at the back */
HD_HAIR.davidcut = {
    front(s, g) {
        const H = g.H;
        hdHairAt(s, g, () => {
            if (g.dir === 'up') {
                const id = s.add(H, { layer: 7, R: 5, grad: 0.3 });
                s.poly(id, [[16.6, 24.6], [15.2, 21], [14.6, 16], [13.2, 11.6], [13.6, 6.6], [16.6, 2.6], [21, 0.8], [26.4, 0.6], [31, 2], [34.2, 5.4], [35, 10.4], [34, 16], [32.8, 21], [31.4, 24.6], [27.6, 23.8], [24, 24.6], [20.4, 23.8]]);
                for (const [x0, x1] of [[18, 17.6], [22, 22], [26, 26.6], [30, 31]]) hdHairLine(s, x0 + 1, 7, x1, 22, -1);
                hdHairGloss(s, 15, 33, 8.6, 3.6, 2);
                return;
            }
            if (g.side) {
                const id = s.add(H, { layer: 7, R: 4, cast: 1, grad: 0.3 });
                s.poly(id, [[32.4, 13.2], [33, 9], [31.6, 6], [27, 3.6], [21, 3.4], [16.6, 5.6], [14, 9.4], [13.8, 14.6], [14.8, 19.6], [17, 23.6], [19.6, 24.2], [20.2, 21], [20.4, 17.2], [23.4, 16.6], [23.8, 20.4], [25, 20.4], [25, 15.2], [27.2, 13]]);
                // the swoop: up off the forehead and back over the top
                const sw = s.add(H, { layer: 9, R: 3.4, cast: 1, grad: 0.32 });
                s.poly(sw, [[30.6, 12.6], [33, 11], [35.8, 7.6], [35.2, 3.6], [32.4, 0.8], [27.4, 0.2], [22.4, 1.2], [18.8, 3.4], [17.6, 6.4], [21.6, 5.4], [26, 5.6], [29.4, 7.2]]);
                hdHairLine(s, 33.4, 4, 29, 9.4, -1); hdHairLine(s, 28, 2.4, 22, 4.4, -1);
                hdHairGloss(s, 21, 34, 3.4, 1.6, 0);
                return;
            }
            // from the front: short sides, and a big swoop rising from his right and curling over to his left
            const id = s.add(H, { layer: 7, R: 4, cast: 1, grad: 0.3 });
            s.poly(id, [[14.6, 19.4], [13.4, 15.6], [13.2, 11], [15, 6.6], [19, 4], [24, 3.4], [29, 4], [33, 6.6], [34.8, 11], [34.6, 15.6], [33.6, 19.4], [32.8, 19.4], [32.4, 15], [30.8, 13.6], [27, 13.2], [23, 13.2], [19.4, 13.4], [16.8, 14.2], [15.6, 15.6], [15.4, 19.4]]);
            const sw = s.add(H, { layer: 9, R: 3.6, cast: 1, grad: 0.32 });
            s.poly(sw, [[15.8, 15], [14.6, 10], [15.6, 5], [19.4, 1.4], [25, 0.3], [30.6, 1.2], [34.4, 4.4], [35.8, 8.4], [34, 10.4], [31.6, 12.6], [28, 13.2], [24, 13.2], [20, 13.4], [17.2, 14.4]]);
            const curl = s.add(H, { layer: 10, R: 2.4, cast: 1, grad: 0.3 });
            s.poly(curl, [[30.4, 8.4], [33.4, 6.4], [36.2, 8.4], [36.4, 12.6], [35, 15.6], [33.4, 14.2], [33.2, 11.4], [31.6, 10.6]]);
            // strands sweeping up from his right and over
            hdHairLine(s, 17.6, 12.4, 21, 4.4, -1); hdHairLine(s, 21, 12.4, 25.6, 4, -1); hdHairLine(s, 25, 12, 30.6, 5, -1); hdHairLine(s, 19.6, 4.2, 29, 2.4, 1);
            hdHairGloss(s, 16.6, 33, 4.6, 2.6, 0);
        });
    },
};

/* James's: brown and short, a soft side part with a bit of volume on top */
HD_HAIR.jamescut = {
    front(s, g) {
        const H = g.H;
        hdHairAt(s, g, () => {
            if (g.dir === 'up') {
                const id = s.add(H, { layer: 7, R: 4, grad: 0.3 });
                s.poly(id, [[16.4, 25], [15.2, 21.6], [14.8, 17], [13.4, 13], [13.8, 8.6], [16.6, 4.6], [20.6, 2.6], [24, 2.2], [27.4, 2.6], [31.4, 4.6], [34.2, 8.6], [34.6, 13], [33.2, 17], [32.8, 21.6], [31.6, 25], [28, 24.2], [24, 25], [20, 24.2]]);
                for (const [x0, x1] of [[19.6, 18], [23, 22.4], [26.4, 27], [29.6, 30.6]]) hdHairLine(s, x0, 8, x1, 23, -1);
                hdHairGloss(s, 15.5, 32.5, 9.8, 3.4, 0);
                return;
            }
            if (g.side) {
                const id = s.add(H, { layer: 7, R: 4, cast: 1, grad: 0.3 });
                s.poly(id, [[33.8, 14], [34.6, 9.6], [32.6, 5], [27.4, 2.4], [21.4, 2.8], [16.8, 5.2], [14.2, 9.2], [14, 14.6], [14.8, 19.6], [17, 23.6], [19.6, 24.4], [20.2, 21], [20.4, 17.2], [23.4, 16.6], [23.8, 20.4], [25, 20.4], [25, 15.2], [27.4, 13], [30.4, 13.4]]);
                for (const [x0, y0, x1, y1] of [[32, 6, 20, 6.6], [32.6, 9.6, 18, 11], [24, 13.6, 16.4, 16.6]]) hdHairLine(s, x0, y0, x1, y1, -1);
                hdHairGloss(s, 17, 31, 5.8, 2.2, 0);
                return;
            }
            // from the front: parted on his right, swept across with a soft fall over the far side of the forehead
            const id = s.add(H, { layer: 7, R: 4, cast: 1, grad: 0.3 });
            s.poly(id, [[14.6, 19.4], [13.4, 15.6], [13.2, 11], [15, 6.4], [19, 3.4], [24, 2.4], [29, 3], [33, 5.6], [35, 10], [34.8, 15.6], [33.6, 19.4], [32.8, 19.4], [32.4, 15.6], [30.6, 14.4], [27, 13.4], [23, 13.2], [19.6, 13.4], [17, 14.2], [15.6, 15.6], [15.4, 19.4]]);
            const sweep = s.add(H, { layer: 9, R: 3, cast: 1, grad: 0.3 });
            s.poly(sweep, [[19.2, 3.6], [25, 2.2], [30, 3.2], [33.6, 6.4], [35, 11], [34.4, 15.6], [32.8, 15.8], [31, 14.4], [28, 13.6], [24, 13.2], [20.4, 13.2], [19, 11.6], [18.6, 7.4]]);
            hdHairLine(s, 18.6, 4.4, 18.2, 11.6, -1);
            hdHairLine(s, 20.4, 9.6, 30.4, 13.6, -1); hdHairLine(s, 21, 5.6, 32.6, 9.4, -1); hdHairLine(s, 20, 7.4, 26, 7.6, 1);
            hdHairGloss(s, 15, 32, 6.8, 2.6, 0);
        });
    },
};
