/* ---- 32c_hd_acc.js ---- */
/* HD accessories: what Sarah wears on her eyes and her head (and gives her neighbors), each drawn in a sprite of its
   own over the finished character. a says where the head is (hdAccAt in 32a_hd_people.js, hdNpcFrame in 32_hd.js):
   dir, cx and top (the middle of the head and the top of the hair, where a hat rests), w (the head's width), eyeY,
   eyeDx, eyeX and faceX. Everything is drawn for a person's head (24 wide) and scaled to a neighbor's; the light, the
   form and the outlines are worked out per pixel like the rest, so only the shapes and the material are drawn here.
   rise: how far a hat reaches above a.top on a person (up to 15, the wizard's hat and the toque; a third more on the
   biggest neighbors), which is how much room the frame needs above the head. */

/* a pen for drawing around a head: x from the middle of the head, y down from where a hat rests, both as on a person's
   head; on other heads they scale, and a hat widens more than it grows taller. wide: the accessory's width on a
   person (so it never outgrows the frame), most: the largest scale (a crown stays small) */
function hdAccPen(s, a, wide, most) {
    let k = a.w / 24;
    if (wide) k = Math.min(k, 46 / wide);
    if (most) k = Math.min(k, most);
    const ky = k > 1 ? 1 + (k - 1) * 0.5 : k, kr = Math.sqrt(k * ky), cx = a.cx, top = a.top;
    const X = x => cx + x * k, Y = y => top + y * ky;
    return { k, ky, cx, top, X, Y,
        el: (id, x, y, rx, ry) => s.ellipse(id, X(x), Y(y), rx * k, (ry == null ? rx : ry) * ky),
        poly: (id, pts) => s.poly(id, pts.map(p => [X(p[0]), Y(p[1])])),
        line: (id, x0, y0, x1, y1, r, r1) => s.line(id, X(x0), Y(y0), X(x1), Y(y1), r * kr, (r1 == null ? r : r1) * kr),
        px: (x, y, c) => s.px(Math.floor(X(x)), Math.floor(Y(y)), c),
        mod: (x, y, d) => s.mod(Math.floor(X(x)), Math.floor(Y(y)), d),
    };
}
/* a texture over one part (after it's drawn): fn(x, y, nudge) for each of its pixels, x and y as the pen gives them */
function hdAccTex(s, P, id, fn) {
    s.each(id, (x, y) => { const fx = x - s.dx, fy = y - s.dy; fn((fx + 0.5 - P.cx) / P.k, (fy + 0.5 - P.top) / P.ky, d => s.mod(fx, fy, d)); });
}
/* points along a curve y = f(x) from x0 to x1 (for bands that follow the round of a hat) */
function hdAccCurve(x0, x1, f, n) { const o = []; n = n || 12; for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; o.push([x, f(x)]); } return o; }
/* a band along part of an ellipse, th thick: angles in degrees, 0 = right, 90 = down */
function hdAccArc(P, id, x, y, rx, ry, a0, a1, th) {
    const n = Math.max(8, Math.ceil(Math.abs(a1 - a0) / 6)), out = [], inn = [];
    for (let i = 0; i <= n; i++) {
        const t = (a0 + (a1 - a0) * i / n) * Math.PI / 180, c = Math.cos(t), sn = Math.sin(t);
        out.push([x + c * (rx + th / 2), y + sn * (ry + th / 2)]); inn.unshift([x + c * (rx - th / 2), y + sn * (ry - th / 2)]);
    }
    P.poly(id, out.concat(inn));
}
/* a little five-petal flower: the petals one part (notched apart), the middle a bead on top */
function hdAccFlower(s, P, x, y, r, petal, mid, layer, turn) {
    const pt = s.add(petal, { layer, R: 1.6, grad: 0.25 }), md = s.add(mid, { layer: layer + 1, R: 1, grad: 0.3, bias: 0.12 });
    const t0 = (turn || 0) - 90;
    for (let i = 0; i < 5; i++) { const t = (t0 + i * 72) * Math.PI / 180; P.el(pt, x + Math.cos(t) * r * 0.52, y + Math.sin(t) * r * 0.52, r * 0.5, r * 0.5); }
    P.el(md, x, y, r * 0.3, r * 0.3);
    // the creases between the petals
    for (let i = 0; i < 5; i++) { const t = (t0 + 36 + i * 72) * Math.PI / 180; P.mod(x + Math.cos(t) * r * 0.55, y + Math.sin(t) * r * 0.55, -1); }
    return pt;
}
/* a frame drawn pixel by pixel (glasses, a monocle): the pixels on the edge of a shape, lit on the top left */
function hdAccRim(s, P, inside, x0, y0, x1, y1, cols, fill) {
    const X0 = Math.floor(P.X(x0)) - 1, X1 = Math.ceil(P.X(x1)) + 1, Y0 = Math.floor(P.Y(y0)) - 1, Y1 = Math.ceil(P.Y(y1)) + 1;
    const mx = (P.X(x0) + P.X(x1)) / 2, my = (P.Y(y0) + P.Y(y1)) / 2, hw = (P.X(x1) - P.X(x0)) / 2, hh = (P.Y(y1) - P.Y(y0)) / 2;
    const In = (px, py) => inside((px + 0.5 - P.cx) / P.k, (py + 0.5 - P.top) / P.ky);
    for (let py = Y0; py <= Y1; py++) for (let px = X0; px <= X1; px++) {
        if (!In(px, py)) continue;
        const u = (px + 0.5 - mx) / hw, v = (py + 0.5 - my) / hh;
        if (In(px - 1, py) && In(px + 1, py) && In(px, py - 1) && In(px, py + 1)) { if (fill) s.px(px, py, fill(u, v, px, py)); continue; }
        const lit = u * 0.8 + v;
        s.px(px, py, lit < -0.75 ? cols[0] : lit > 0.55 ? cols[2] : cols[1]);
    }
}
/* small jewelry drawn pixel by pixel: rows of letters looked up in pal ('.' is empty), the top left at pen point x, y */
function hdAccArt(s, P, rows, x, y, pal) {
    const X0 = Math.floor(P.X(x)), Y0 = Math.floor(P.Y(y));
    rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (pal[r[i]]) s.px(X0 + i, Y0 + j, pal[r[i]]); });
}
/* inside a rounded box (for lenses) */
function hdAccBox(x0, y0, x1, y1, r) {
    return (x, y) => {
        if (x < x0 || x > x1 || y < y0 || y > y1) return false;
        const dx = x < x0 + r ? x0 + r - x : x > x1 - r ? x - (x1 - r) : 0, dy = y < y0 + r ? y0 + r - y : y > y1 - r ? y - (y1 - r) : 0;
        return dx * dx + dy * dy <= r * r;
    };
}
/* where the eyes are: from the front the two eye centers, side-on the near one */
function hdAccEyes(a) {
    const y = a.eyeY + 0.5;
    if (a.dir === 'side') return { side: true, x: a.person ? a.faceX - 2.5 : a.eyeX + a.eyeDx + 0.5, y, face: a.faceX };
    const c = (a.eyeX != null ? a.eyeX : a.cx) + 0.5;
    return { l: c - a.eyeDx, r: c + a.eyeDx, c, y };
}
/* an eye accessory's pen: centered between the eyes (or on the near eye), y from the eye line; on a neighbor it grows
   a little with the eye gap (big faces have big eyes). half: half the eye gap in the pen's units */
function hdAccEyePen(s, a) {
    const E = hdAccEyes(a), k = a.person ? 1 : Math.max(0.9, Math.min(1.35, a.eyeDx / 7));
    return Object.assign(hdAccPen(s, { w: 24 * k, cx: E.side ? E.x : E.c, top: E.y }), { E, half: E.side ? 0 : (E.r - E.l) / 2 / k });
}

/* ---------------------------------------------------------------- on the eyes */
/* round-cornered glasses with dark frames: a glint on each lens */
function hdAccSpecs(s, a, dark) {
    const P = hdAccEyePen(s, a), E = P.E;
    const frame = dark ? ['#3c3548', '#1e1b24', '#0f0d13'] : ['#6c6278', '#3a3340', '#211c26'];
    const lens = dark ? (u, v) => (u + v < -0.6 && u + v > -1.15 ? '#8a80a8' : v < -0.2 ? '#3a3448' : v < 0.45 ? '#2a2634' : '#1e1b24') : null;
    const hw = dark ? 4 : 3.5, t = dark ? -2.6 : -2.5, b = dark ? 2.6 : 3, r = dark ? 1.4 : 1.6;
    if (E.side) {
        // the near lens, a little narrower side-on, and the arm back to the ear
        hdAccRim(s, P, hdAccBox(-2.2, t, 2.4, b, r), -2.2, t, 2.4, b, frame, lens);
        const ear = a.person ? 22.5 : P.cx - 6 * P.k;
        for (let x = Math.floor(ear); x < Math.floor(P.X(-2.2)); x++) s.px(x, Math.floor(P.Y(-1.2)), x < P.X(-4) ? frame[1] : frame[0]);
        s.px(Math.floor(ear) - 1, Math.floor(P.Y(-0.2)), frame[2]);
        if (!dark) { P.px(0.6, -1.3, '#f4fbff'); P.px(1.4, -0.4, '#d8ecf6'); }
        return;
    }
    const half = P.half;
    for (const sx of [-1, 1]) {
        const cx = sx * half;
        hdAccRim(s, P, hdAccBox(cx - hw, t, cx + hw, b, r), cx - hw, t, cx + hw, b, frame, lens);
        // the arm to the ear, mostly hidden by the head
        P.px(cx + sx * (hw + 0.5), -1.6, frame[sx < 0 ? 0 : 2]);
        if (!dark) { P.px(cx + 1.4, -1.5, '#f4fbff'); P.px(cx + 2.1, -0.6, '#d8ecf6'); }
    }
    // the bridge over the nose, a little high
    for (let x = -half + hw; x < half - hw; x += 1) { P.px(x + 0.5, dark ? -1.6 : -0.9, frame[1]); if (dark) P.px(x + 0.5, -0.6, frame[2]); }
    if (dark) { P.px(-0.5, -2.5, frame[0]); P.px(0.5, -2.5, frame[0]); }
}
HD_ACC.glasses = { eye: true, draw(s, a) { hdAccSpecs(s, a, false); } };
HD_ACC.sunglasses = { eye: true, draw(s, a) { hdAccSpecs(s, a, true); } };

/* a gold monocle on the right eye (her left), its chain down to the collar */
HD_ACC.monocle = {
    eye: true,
    draw(s, a) {
        const P = hdAccEyePen(s, a), E = P.E, gold = ['#ffe58a', '#d49a24', '#7a520e'];
        const x = E.side ? 0.2 : P.half, rx = E.side ? 2.3 : 3.5, ry = 3.5;
        const ring = (u, v) => ((u - x) / rx) ** 2 + (v / ry) ** 2 <= 1;
        hdAccRim(s, P, ring, x - rx, -ry, x + rx, ry, gold, (u, v) => (u < -0.3 && u > -0.8 && v < -0.3 && v > -0.85 ? '#ffffff' : null));
        // the chain: links in two shades, falling in a soft curve
        const ch = E.side ? [[0.4, 4.2], [0, 5.2], [-0.6, 6.2], [-1.4, 7.1], [-2.3, 7.9], [-3.3, 8.6], [-4.4, 9.2]]
            : [[x + 2.6, 3.6], [x + 3.1, 4.6], [x + 3.4, 5.6], [x + 3.4, 6.6], [x + 3.2, 7.6], [x + 2.8, 8.6], [x + 2.2, 9.5]];
        ch.forEach(([u, v], i) => P.px(u, v, i % 2 ? gold[2] : '#ecb83c'));
    },
};

/* a curly handlebar mustache under the nose */
HD_ACC.mustache = {
    eye: true,
    draw(s, a) {
        const P = hdAccEyePen(s, a), E = P.E, dy = a.person ? 4.6 : 3.9 / P.k;
        const m = s.add(hdPal('#1c0f09', '#2c1a10', '#3a2418', '#553624', '#6e4a30'), { layer: 1, R: 1.6, grad: 0.35 });
        if (E.side) {
            // under the nose, curling up at the back of the cheek
            const x = (a.person ? 33 : E.face) - P.cx;
            P.poly(m, [[x + 0.6, dy - 0.6], [x - 2, dy - 0.8], [x - 4, dy - 0.2], [x - 5.4, dy - 1.6], [x - 5.8, dy - 2.8], [x - 6.6, dy - 1.4], [x - 5.6, dy + 0.8], [x - 3, dy + 1.6], [x - 0.4, dy + 1.2]]);
            return;
        }
        const side = sx => [[0, dy - 0.7], [sx * 2.4, dy - 0.9], [sx * 4.3, dy - 0.2], [sx * 5.4, dy - 1.2], [sx * 5.6, dy - 2.6], [sx * 6.5, dy - 1.6],
            [sx * 6.2, dy + 0.4], [sx * 4.7, dy + 1.5], [sx * 2.5, dy + 1.6], [0, dy + 0.9]];
        P.poly(m, side(-1)); P.poly(m, side(1));
        // combed strands and a parting in the middle
        P.mod(-0.5, dy - 0.2, -1); P.mod(0.5, dy - 0.2, -1);
        for (const sx of [-1, 1]) { P.mod(sx * 2.5, dy, 1); P.mod(sx * 3.5, dy - 0.1, 1); P.mod(sx * 4.5, dy + 0.4, -1); }
    },
};

/* ---------------------------------------------------------------- on the head */
/* the straw sunhat with a pink band: a woven crown, a wide brim, the band tied in a bow at the back */
HD_ACC.sunhat = {
    rise: 5,
    draw(s, a) {
        const P = hdAccPen(s, a, 35), side = a.dir === 'side', up = a.dir === 'up';
        const straw = hdPal('#8a6a3a', '#d0aa60', '#f2d58a', '#f8e4a8', '#fff2c4'), pink = hdPal('#8a2a44', '#c84a66', '#e0607a', '#f08498', '#ffb4c4');
        const brim = s.add(straw, { layer: 1, R: 3, grad: 0.3 }), crown = s.add(straw, { layer: 2, R: 6, grad: 0.32 }), band = s.add(pink, { layer: 3, R: 1.5, grad: 0.15 });
        const ox = side ? -0.8 : 0, c = x => Math.max(0, 1 - ((x - ox) / 9.8) ** 2);
        P.el(brim, 0, 6.8, 17, 3.9);
        // the crown: a soft dome with steep sides
        const prof = [[9.9, 6], [9.6, 2], [8.8, -0.8], [7, -2.9], [4.2, -4], [1.4, -4.4]];
        P.poly(crown, prof.map(([x, y]) => [ox - x, y]).concat(prof.slice().reverse().map(([x, y]) => [ox + x, y])).concat([[ox + 5, 6.9], [ox, 7.2], [ox - 5, 6.9]]));
        P.poly(band, hdAccCurve(ox - 9.7, ox + 9.7, x => 3 + 0.8 * c(x)).concat(hdAccCurve(ox + 9.9, ox - 9.9, x => 5.7 + 1 * c(x))));
        // the weave: rows of plaits round the crown, rings round the brim and its rolled edge catching the light
        hdAccTex(s, P, crown, (x, y, d) => { const row = Math.floor(y + 10); if (row % 3 === 0 && (Math.floor(x + 20) + row) % 3 !== 0) d(1); });
        hdAccTex(s, P, brim, (x, y, d) => {
            const t = Math.hypot(x / 17, (y - 6.8) / 3.9);
            if (Math.abs(t - 0.72) < 0.06) d(-1);
            else if (t > 0.84 && y > 7.8) d(1);
            else if (Math.abs(t - 0.86) < 0.05 && Math.floor(x + 30) % 3 === 0) d(-1);
        });
        if (up || side) {
            // the bow at the back, its tails down over the brim
            const bx = up ? 0 : ox - 9.4, by = up ? 5.6 : 4.8, sx = up ? 1 : 0.5;
            const bow = s.add(pink, { layer: 4, R: 1.5, grad: 0.2 });
            P.poly(bow, [[bx, by], [bx - 3.4 * sx, by - 1.6], [bx - 3.6 * sx, by + 1.6]]); P.poly(bow, [[bx, by], [bx + 3.4 * sx, by - 1.6], [bx + 3.6 * sx, by + 1.6]]);
            P.line(bow, bx - 0.4, by + 0.6, bx - 1.6, by + 7.6, 0.75, 0.6); P.line(bow, bx + 0.4, by + 0.6, bx + 1.4, by + 8.6, 0.75, 0.6);
            P.el(s.add(pink, { layer: 5, R: 1, bias: 0.1 }), bx, by, 0.9, 1);
        } else {
            // a little sprig of flowers tucked in the band
            P.px(6.5, 3.6, '#ffffff'); P.px(7.5, 3.6, '#fff6d0'); P.px(7, 2.6, '#ffffff'); P.px(7, 4.6, '#fff0f4'); P.px(7, 3.6, '#ffd84a');
        }
    },
};

/* the lilac knit beanie: ribbed cuff, a knit crown and a pom on top */
HD_ACC.beanie = {
    rise: 10,
    draw(s, a) {
        const P = hdAccPen(s, a, 27), side = a.dir === 'side';
        const lilac = hdPal('#3a2d52', '#5f4aa6', '#7a63c4', '#9d8be0', '#b9adee'), cuffC = hdPal('#5c4f84', '#c3b8e2', '#e2dcf4', '#f2eefc', '#ffffff');
        const pomC = hdPal('#4a3c74', '#8a78d4', '#ab9cea', '#c6bbf4', '#e2dcfc');
        const dome = s.add(lilac, { layer: 1, R: 7, grad: 0.3 }), cuff = s.add(cuffC, { layer: 2, R: 2.5, grad: 0.2 }), pom = s.add(pomC, { layer: 3, R: 3.5, grad: 0.3 });
        const ox = side ? -0.6 : 0, c = x => Math.max(0, 1 - ((x - ox) / 13) ** 2);
        const arc = [];
        for (let i = 0; i <= 16; i++) { const t = Math.PI + Math.PI * i / 16; arc.push([ox + Math.cos(t) * 12.4, 5.2 + Math.sin(t) * 9]); }
        P.poly(dome, arc.concat([[ox + 12.4, 7], [ox - 12.4, 7]]));
        P.poly(cuff, hdAccCurve(ox - 12.9, ox + 12.9, x => 4.6 + 0.9 * c(x)).concat(hdAccCurve(ox + 13, ox - 13, x => 8.8 + 1.1 * c(x))));
        P.el(cuff, ox - 12.6, 6.9, 0.9, 2.2); P.el(cuff, ox + 12.6, 6.9, 0.9, 2.2);
        // the pom: a ball of fluffy yarn
        P.el(pom, ox, -6.3, 4.4, 3.45);
        // knit: the crown's ribs gather towards the top, a row of stitches under them; the cuff's ribs stand straight
        hdAccTex(s, P, dome, (x, y, d) => {
            const sq = (y - 7) / (7 + 3.8), rib = (x - ox) / (1 - sq * 0.55);
            const f = ((rib / 2.2) % 1 + 1) % 1;
            if (f < 0.3) d(-1); else if (f > 0.55 && f < 0.75 && y > -1) d(1);
        });
        hdAccTex(s, P, cuff, (x, y, d) => { const f = Math.floor(x - ox + 40); if (f % 2 === 0) d(-1); });
        hdAccTex(s, P, pom, (x, y, d) => { const h = (Math.floor(x + 20) * 7 + Math.floor(y + 20) * 13) % 5; if (h === 0) d(-1); else if (h === 3 && x + y < -5) d(1); });
    },
};

/* a pink flower tucked over her left ear (from behind, on the other side; side-on, behind the ear) */
HD_ACC.flower = {
    rise: 0,
    draw(s, a) {
        const P = hdAccPen(s, a, 12, 1.4), d = a.dir;
        const x = d === 'down' ? 9.6 : d === 'up' ? -9.6 : -4.6, y = d === 'side' ? 8.4 : 7.8;
        const leaf = s.add(hdPal('#244a24', '#3d7a34', '#5aa04a', '#78bc5e', '#9ed47a'), { layer: 0, R: 1.5, grad: 0.2 });
        const sx = d === 'up' ? -1 : 1;
        P.line(leaf, x, y, x - sx * 4.6, y + 3, 1.3, 0.4); P.line(leaf, x, y, x + sx * 3.6, y + 4.2, 1.2, 0.4);
        hdAccFlower(s, P, x, y, 4.8, hdPal('#a8486a', '#e07c9c', '#f59ab5', '#ffb8cc', '#ffd6e2'), hdPal('#a06a10', '#e0a820', '#ffd84a', '#ffe680', '#fff4c0'), 2, 8);
        P.mod(x - 1.6, y - 2, 1); P.mod(x - 2.5, y - 1, 1);
    },
};

/* headphones: a padded band over the top, pink cups over the ears */
HD_ACC.headphones = {
    rise: 3,
    draw(s, a) {
        const P = hdAccPen(s, a, 30), side = a.dir === 'side';
        const dark = hdPal('#141218', '#24212a', '#2e2a33', '#45404d', '#5e5868'), pink = hdPal('#7a2438', '#c24660', '#e0607a', '#f08498', '#ffb0c0');
        const steel = hdPal('#4a4c58', '#8a8e9e', '#b8bcc8', '#d8dce6', '#f4f6fa');
        if (side) {
            // the near cup over the ear, the band straight up over the crown
            const band = s.add(dark, { layer: 1, R: 2, grad: 0.2 }), slide = s.add(steel, { layer: 2, R: 1 }), pad = s.add(dark, { layer: 3, R: 2 }), cup = s.add(pink, { layer: 4, R: 3, grad: 0.25 });
            // the band goes over the head edge-on, so from the side it's a strip up to the top of the hair
            const ex = a.person ? 21.5 - P.cx : -2;
            P.line(band, ex - 0.2, 10.6, ex + 0.1, 3, 1.2); P.line(band, ex + 0.1, 3, ex + 0.6, -0.4, 1.2, 1.1);
            P.line(slide, ex - 0.2, 8.2, ex - 0.2, 10.4, 0.9);
            P.el(pad, ex - 0.6, 15.6, 3.3, 4.6);
            P.el(cup, ex + 0.3, 15.6, 3.1, 4.3);
            P.mod(ex - 0.6, 13.6, 1); P.mod(ex - 0.6, 14.6, 1); P.mod(ex + 0.4, 12.6, 1);
            return;
        }
        const band = s.add(dark, { layer: 1, R: 2, grad: 0.2 }), top = s.add(pink, { layer: 2, R: 1.5, grad: 0.2 });
        hdAccArc(P, band, 0, 13, 12.6, 14.6, 186, 354, 2.4);
        // a pink cushion under the top of the band
        hdAccArc(P, top, 0, 13, 12.6, 14.6, 240, 300, 2);
        for (const sx of [-1, 1]) {
            const slide = s.add(steel, { layer: 3, R: 1 }), pad = s.add(dark, { layer: 4, R: 2 }), cup = s.add(pink, { layer: 5, R: 2.5, grad: 0.25 });
            P.line(slide, sx * 12.6, 9.6, sx * 12.7, 11.6, 0.9);
            P.el(pad, sx * 11.9, 15.4, 2, 4.2);
            P.el(cup, sx * 13.4, 15.4, 1.9, 4);
        }
        P.mod(-13.2, 13.4, 1); P.mod(-13.2, 14.4, 1); P.mod(12.6, 13.4, 1);
    },
};

/* a striped party hat, a little askew, with a pom on top */
HD_ACC.partyhat = {
    rise: 14,
    draw(s, a) {
        const P = hdAccPen(s, a, 15, 1.3), d = a.dir;
        const pink = hdPal('#9a4060', '#e07a9a', '#f59ab5', '#ffbcd0', '#ffdce6'), blue = hdPal('#1e6a80', '#36a2bc', '#4ec3d9', '#7ad6e6', '#b0ecf4');
        const gold = hdPal('#a06a10', '#e0a820', '#ffd84a', '#ffe680', '#fff4c0');
        const cone = s.add(pink, { layer: 1, R: 3.5, grad: 0.2 }), pom = s.add(gold, { layer: 2, R: 2, grad: 0.25, bias: 0.08 });
        const tip = d === 'down' ? 2.4 : d === 'up' ? -2.4 : 1.4, bx = d === 'side' ? -0.6 : 0;
        P.poly(cone, [[bx - 6.6, 2], [tip - 0.6, -9.8], [tip + 0.6, -9.8], [bx + 6.6, 2]]);
        P.el(cone, bx, 2, 6.6, 1.6);
        // spiral stripes in blue
        hdAccTex(s, P, cone, (x, y) => { const u = (x - bx) - (y - 2) * (tip - bx) / -11.8; if ((((y * 0.9 + u * 0.75) / 2.6) % 2 + 2) % 2 < 1) s.recolor(Math.floor(P.X(x)), Math.floor(P.Y(y)), blue); });
        // the pom: a fluffy ball
        P.el(pom, tip, -11.2, 2.7, 2.5);
        P.mod(tip + 0.6, -10.2, -1); P.mod(tip - 0.4, -11.6, 1);
    },
};

/* a little gold crown with rubies, sitting on top; drawn pixel by pixel, as small jewelry reads best that way */
HD_ACC.crown = {
    rise: 6,
    draw(s, a) {
        const P = hdAccPen(s, a, 15, 1), up = a.dir === 'up';
        const pal = { o: '#a8701c', O: '#6e420c', D: '#d09a2c', G: '#ffcf40', L: '#ffe27a', W: '#fff6c8', R: '#e0405a', r: '#a01c34', p: '#ff9aa8' };
        if (up) Object.assign(pal, { R: pal.G, r: pal.D, p: pal.L });
        hdAccArt(s, P, ['.o.....o.....o.', 'oWO...oWO...oLO', '.G.....G.....G.', 'oLO...oLO...oGO', 'oLGO.oLLGO.oGGO', 'oWLLLLLLLLLLLDO',
            'oLGGGGGGGGGGGDO', 'oLpRGGpRRGGpRDO', 'oGrrGGRrrGGRrDO', '.OOOOOOOOOOOOO.'], a.dir === 'side' ? -7.5 : -6.5, -4.6, pal);
    },
};

/* a red bow on the back of her head (it peeks out on the side from the front) */
HD_ACC.bow = {
    rise: 0,
    draw(s, a) {
        const P = hdAccPen(s, a, 15, 1.3), d = a.dir;
        const red = hdPal('#7a1428', '#b82840', '#e0405a', '#f06878', '#ff8fa3');
        const x = d === 'down' ? -9.4 : d === 'up' ? -1.6 : -9.6, y = d === 'up' ? 7.4 : 6.6;
        const tails = s.add(red, { layer: 0, R: 1, grad: 0.2, bias: -0.06 }), knot = s.add(red, { layer: 3, R: 1.5, grad: 0.3, bias: 0.14 });
        // two tails hanging under the knot, cut in a notch
        for (const sx of [-1, 1]) P.poly(tails, [[x + sx * 0.2, y + 0.6], [x + sx * 2, y + 1.2], [x + sx * 3.8, y + 6.8], [x + sx * 2.8, y + 6], [x + sx * 1.8, y + 7.4], [x + sx * 0.6, y + 2.2]]);
        // the loops: a bow-tie, flared at the ends with a notch, pinched at the knot, the inside of each loop in shadow
        for (const sx of [-1, 1]) {
            const lp = s.add(red, { layer: 2, R: 2.4, grad: 0.3 });
            P.poly(lp, [[0.9, -1], [3, -2.5], [5.6, -3.7], [7.1, -3.3], [6.4, -0.2], [7.1, 2.8], [5.4, 3.3], [3, 2.3], [0.9, 1]].map(([u, v]) => [x + sx * u, y + v]));
            for (const [u, v] of [[1.8, 0.6], [2.8, 0.8], [2.8, 1.6], [3.8, 1.2], [1.8, -0.4]]) P.mod(x + sx * u, y + v, -1);
            P.mod(x + sx * 4.4, y - 2.4, 1); P.mod(x + sx * 5.4, y - 2.6, 1); P.mod(x + sx * 3.4, y - 1.6, 1);
        }
        P.el(knot, x, y, 1.5, 1.9);
    },
};

/* a silver tiara with a pink jewel, on the front of the head */
HD_ACC.tiara = {
    rise: 4,
    draw(s, a) {
        const P = hdAccPen(s, a, 17, 1.1), up = a.dir === 'up', side = a.dir === 'side';
        const silver = hdPal('#5e6684', '#a4aec6', '#dfe6f2', '#eef2f8', '#ffffff'), gem = hdPal('#8a1a50', '#d63a80', '#ff5a9e', '#ff8cbc', '#ffc0dc');
        const tia = s.add(silver, { layer: 1, R: 1.5, grad: 0.3 });
        if (side) {
            // side-on: the band over the head, the tall middle point at the front seen edge-on, the jewel's side
            P.line(tia, -5.4, 1.6, -1, 0.4, 0.8); P.line(tia, -1, 0.4, 3.4, 0.8, 0.8); P.line(tia, 3.4, 0.8, 6.6, 2.8, 0.8);
            P.poly(tia, [[4.6, 2.4], [5.2, -1.2], [5.8, -3.2], [6.6, -1], [7, 2.8]]);
            P.poly(tia, [[0.6, 1], [1.4, -1.4], [2.4, 1]]); P.poly(tia, [[-3.6, 1.4], [-3, -0.4], [-2.2, 1]]);
            P.px(5.8, -2.6, '#ffffff');
            const g = s.add(gem, { layer: 2, R: 1, bias: 0.1 }); P.el(g, 6.2, 0.2, 0.7, 1.3);
            return;
        }
        const ox = 0.5, c = x => Math.max(0, 1 - ((x - ox) / 8.6) ** 2);
        P.poly(tia, hdAccCurve(ox - 8.6, ox + 8.6, x => 3.4 - 1.6 * c(x)).concat(hdAccCurve(ox + 8.6, ox - 8.6, x => 5.2 - 1.4 * c(x))));
        // the middle point holds the jewel, smaller points beside it, beads at the tips
        P.poly(tia, [[ox - 2.6, 2.4], [ox - 2.2, -0.6], [ox, -4], [ox + 2.2, -0.6], [ox + 2.6, 2.4]]);
        for (const sx of [-1, 1]) { P.poly(tia, [[ox + sx * 3.6, 2.2], [ox + sx * 4.8, -0.8], [ox + sx * 6, 2.6]]); P.poly(tia, [[ox + sx * 6.6, 3], [ox + sx * 7.4, 1.2], [ox + sx * 8.2, 3.6]]); }
        P.px(ox, -3.2, '#ffffff');
        if (up) return;
        const g = s.add(gem, { layer: 2, R: 1.2, grad: 0.3, bias: 0.08 });
        P.el(g, ox, 0.2, 1.2, 1.7);
        P.px(ox - 0.5, -0.6, '#ffe0ee');
        for (const sx of [-1, 1]) P.px(ox + sx * 4.8, 0.6, '#ff8cbc');
    },
};

/* a crown of pink and yellow flowers with leaves */
HD_ACC.flowercrown = {
    rise: 4,
    draw(s, a) {
        const P = hdAccPen(s, a, 26, 1.3), side = a.dir === 'side';
        const leafC = hdPal('#244a24', '#3d7a34', '#5aa04a', '#78bc5e', '#9ed47a');
        const pink = hdPal('#a8486a', '#e8789e', '#ff8fb6', '#ffb4cc', '#ffd6e4'), yellow = hdPal('#a0700e', '#e8b828', '#ffd84a', '#ffe680', '#fff3b0');
        const midP = hdPal('#a06a10', '#e0a820', '#ffd84a', '#ffe680', '#fff4c0'), midY = hdPal('#a06030', '#e09040', '#f8b860', '#ffd890', '#fff0c8');
        const ox = side ? -0.8 : 0, y = x => 0.9 + 0.036 * (x - ox) * (x - ox);
        const fl = side ? [[-8.4, 0, 3.4], [-3.4, 1, 3.6], [1.8, 0, 3.8], [6.8, 1, 3.4]] : [[-10.4, 0, 3.4], [-5.3, 1, 3.5], [0, 0, 3.9], [5.3, 1, 3.5], [10.4, 0, 3.4]];
        // leaves between the flowers and at the ends, all along the ring
        const lv = [];
        for (let i = 0; i + 1 < fl.length; i++) lv.push([(fl[i][0] + fl[i + 1][0]) / 2, i % 2 ? 1 : -1]);
        lv.push([fl[0][0] - 2.6, -1]); lv.push([fl[fl.length - 1][0] + 2.6, 1]);
        for (const [x, sx] of lv) {
            const lf = s.add(leafC, { layer: 1, R: 1.2, grad: 0.2 }), mx = ox + x;
            P.line(lf, mx - sx * 1.4, y(mx) + 0.4, mx + sx * 1.8, y(mx) - 0.6, 1.2, 0.35);
            P.mod(mx - sx * 0.4, y(mx) - 0.4, 1);
        }
        fl.forEach(([x, k, r], i) => hdAccFlower(s, P, ox + x, y(ox + x) - 0.6, r, k ? yellow : pink, k ? midY : midP, 2, i * 23));
    },
};

/* the black pirate hat: gold trim, a skull and crossbones in front */
HD_ACC.piratehat = {
    rise: 5,
    draw(s, a) {
        const P = hdAccPen(s, a, 33), d = a.dir, side = d === 'side';
        const felt = hdPal('#08060c', '#1a1422', '#2e2536', '#433853', '#5a4c6e'), gold = hdPal('#6e5014', '#b08a2c', '#d8b040', '#ecc860', '#fff0a0');
        const hat = s.add(felt, { layer: 1, R: 5, grad: 0.25 }), trim = s.add(gold, { layer: 2, R: 1, grad: 0.3 });
        const w = side ? 14.2 : 15.6, ox = side ? -1 : 0;
        P.poly(hat, [[ox - w, 8.4], [ox - w + 0.6, 5.2], [ox - w + 2.6, 1.6], [ox - w * 0.66, -1.6], [ox - w * 0.34, -3.6], [ox, -4.4], [ox + w * 0.34, -3.6],
            [ox + w * 0.66, -1.6], [ox + w - 2.6, 1.6], [ox + w - 0.6, 5.2], [ox + w, 8.4], [ox + w - 2, 10], [ox, 10.4], [ox - w + 2, 10]]);
        // the turned-down corners at the ends
        P.poly(hat, [[ox - w, 8], [ox - w + 3.2, 9.6], [ox - w + 1.4, 12.2], [ox - w - 0.6, 11]]);
        P.poly(hat, [[ox + w, 8], [ox + w - 3.2, 9.6], [ox + w - 1.4, 12.2], [ox + w + 0.6, 11]]);
        P.poly(trim, hdAccCurve(ox - w + 0.4, ox + w - 0.4, x => 7.4 + 0.9 * (1 - ((x - ox) / w) ** 2)).concat(hdAccCurve(ox + w - 1.4, ox - w + 1.4, x => 9.2 + 1 * (1 - ((x - ox) / w) ** 2))));
        // felt: a faint nap
        hdAccTex(s, P, hat, (x, y, dd) => { if ((Math.floor(x + 40) * 7 + Math.floor(y + 20) * 3) % 11 === 0) dd(1); });
        if (d !== 'down') return;
        // the skull and crossbones, pixel by pixel (centered on the face, which is half a pixel right of the hat)
        const C = { B: '#f2eee6', W: '#ffffff', b: '#bdb6aa', h: '#15101c', o: '#d8d0c4' }, art = ['o.WBBB.o', '.BBBBBB.', '.BhBBhB.', '.BBBBBb.', 'o.BbbB.o'];
        art.forEach((row, j) => { for (let i = 0; i < 8; i++) if (row[i] !== '.') P.px(i - 3, -0.6 + j, C[row[i]]); });
    },
};

/* the purple wizard hat: a tall cone with a bent tip, gold stars and a moon, a wide brim */
HD_ACC.wizardhat = {
    rise: 15,
    draw(s, a) {
        const P = hdAccPen(s, a, 36), d = a.dir, side = d === 'side';
        const felt = hdPal('#231a40', '#46328a', '#5a3fa8', '#7d62d4', '#9a84e4'), brimC = hdPal('#1a1230', '#382870', '#46328a', '#5f48b0', '#7a64cc');
        const brim = s.add(brimC, { layer: 1, R: 3, grad: 0.3 }), cone = s.add(felt, { layer: 2, R: 5, grad: 0.15 });
        const bx = side ? -0.8 : 0, tx = side ? -6.4 : d === 'down' ? 3.6 : -3.6;
        P.el(brim, 0, 5.2, 17.6, 3.4);
        // the cone, its tip flopping over
        const L = [], R = [];
        for (let i = 0; i <= 12; i++) {
            const t = i / 12, w = 9.4 * (1 - t) ** 0.9 + 0.5, cx = bx + (tx - bx) * t * t * t, y = 5.6 - t * 20;
            L.push([cx - w, y]); R.unshift([cx + w, y]);
        }
        P.poly(cone, L.concat(R));
        P.el(cone, bx, 5.4, 9.6, 2);
        // a band where the cone meets the brim, then stars and a moon
        const band = s.add(hdPal('#6e5014', '#b08a2c', '#e0b84a', '#f2d070', '#fff0a8'), { layer: 3, R: 1, grad: 0.3 });
        P.poly(band, hdAccCurve(bx - 9.2, bx + 9.2, x => 2.4 + 0.9 * (1 - ((x - bx) / 9.2) ** 2)).concat(hdAccCurve(bx + 9.5, bx - 9.5, x => 4.2 + 1.1 * (1 - ((x - bx) / 9.5) ** 2))));
        const star = (x, y, big) => {
            P.px(x, y, '#fff4b0'); P.px(x - 1, y, '#ffd84a'); P.px(x + 1, y, '#ffd84a'); P.px(x, y - 1, '#ffd84a'); P.px(x, y + 1, '#e0a820');
            if (big) { P.px(x - 2, y, '#e0a820'); P.px(x + 2, y, '#e0a820'); P.px(x, y - 2, '#ffd84a'); P.px(x, y + 2, '#c08818'); }
        };
        if (side) { star(-3.4, -3.2, 1); star(1.6, -7.6); star(4.6, 0); }
        else { star(-4.2, -1.4, 1); star(3.6, -6.2); star(4.8, 0.2); star(-0.4, -9.8); }
        // a crescent moon on the front
        if (d === 'down') { P.px(-1.4, -5, '#ffe680'); P.px(-2.2, -4.2, '#ffd84a'); P.px(-2.4, -3.2, '#ffd84a'); P.px(-1.8, -2.4, '#e0a820'); }
        // a soft fold down the cone
        hdAccTex(s, P, cone, (x, y, dd) => { const t = (5.6 - y) / 20, cx = bx + (tx - bx) * t * t * t; if (Math.abs(x - cx - 2.4 * (1 - t)) < 0.5) dd(1); });
    },
};

/* black cat ears with pink insides */
HD_ACC.catears = {
    rise: 6,
    draw(s, a) {
        const P = hdAccPen(s, a, 22, 1.4), d = a.dir;
        const fur = hdPal('#120e16', '#1f1925', '#2a2230', '#3c3346', '#52475e'), pink = hdPal('#a04a6a', '#e07a9e', '#ff9ec0', '#ffbcd4', '#ffdce8');
        /* one ear at x: k is its side (-1 her right, 1 her left), w how wide it shows (narrow side-on) */
        const ear = (x, k, w, far, inner) => {
            const e = s.add(fur, { layer: far ? 1 : 2, R: 2.5, grad: 0.25, bias: far ? -0.12 : 0 }), lean = -k * 1.1;
            P.poly(e, [[x - 4 * k * w, 3.8], [x - 2.2 * k * w + lean, -3.8], [x - 0.8 * k * w + lean, -5.8], [x + 0.6 * k * w + lean, -5.3], [x + 3.8 * k * w, 3]]);
            if (!inner) return;
            const ins = s.add(pink, { layer: 3, R: 1.5, grad: 0.3 });
            P.poly(ins, [[x - 2.4 * k * w, 3], [x - 0.8 * k * w + lean, -3.6], [x + 2 * k * w, 2.2]]);
            // a tuft of white fur inside
            P.px(x - 0.4 * k * w, 1.4, '#fff4f8'); P.px(x - 0.2 * k * w + lean * 0.4, 0.4, '#ffe4ee');
        };
        if (d === 'side') { ear(-4.4, 1, 0.75, true, false); ear(0.8, 1, 0.8, false, true); return; }
        for (const k of [-1, 1]) ear(k * 7.4, k, 1, false, d !== 'up');
    },
};

/* a glowing gold halo floating over the head */
HD_ACC.halo = {
    rise: 12,
    draw(s, a) {
        const P = hdAccPen(s, a, 19, 1.2), side = a.dir === 'side';
        const glow = hdPal('#e0a828', '#f6c840', '#ffdc58', '#ffee98', '#fffce6');
        const ring = s.add(glow, { layer: 1, R: 1.4, grad: 0.4, bias: 0.1 });
        const ox = side ? -0.6 : 0;
        hdAccArc(P, ring, ox, -7.6, 8.4, 2.6, 0, 360, 2.2);
        // a gleam on the near rim and sparkles around it
        P.px(ox - 4.5, -9.8, '#ffffff'); P.px(ox - 3.5, -9.9, '#ffffff'); P.px(ox + 2.5, -4.6, '#fffce6');
        const spark = (x, y) => { P.px(ox + x, y, '#ffffff'); P.px(ox + x - 1, y, '#ffe680'); P.px(ox + x + 1, y, '#ffe680'); P.px(ox + x, y - 1, '#ffe680'); P.px(ox + x, y + 1, '#ffe680'); };
        spark(-11.2, -10.4); spark(11, -6.2); P.px(ox + 8.6, -11.4, '#fff6c0'); P.px(ox - 9.4, -5.2, '#fff6c0');
    },
};

/* little ridged goat horns, curving up and out from the top of the head */
HD_ACC.goathorns = {
    rise: 6,
    draw(s, a) {
        const P = hdAccPen(s, a, 28, 1.4), d = a.dir;
        const horn = hdPal('#7a6a4c', '#b8a888', '#eadfc6', '#f4ecda', '#fffaf0');
        const one = (pts, far) => {
            const id = s.add(horn, { layer: far ? 1 : 2, R: 1.8, grad: 0.15, bias: far ? -0.12 : 0 }), n = pts.length - 1;
            for (let i = 0; i < n; i++) P.line(id, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 2.3 - i * 1.7 / n, 2.3 - (i + 1) * 1.7 / n);
            // ridges across the horn, close together near the head
            for (let i = 0; i < n; i++) for (const t of [0.35, 0.85]) {
                const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, l = Math.hypot(x1 - x0, y1 - y0), nx = -(y1 - y0) / l, ny = (x1 - x0) / l, r = 2.1 - (i + t) * 1.7 / n;
                for (let u = -r + 0.6; u <= r - 0.6; u += 0.9) P.mod(x + nx * u, y + ny * u, -1);
            }
        };
        if (d === 'side') {
            one([[-0.6, 3.2], [-2.2, 0.4], [-4.4, -1.8], [-7, -3], [-9.6, -2.6], [-11.2, -1.2]], true);
            one([[1.4, 3.4], [-0.2, 0.4], [-2.4, -2], [-5.2, -3.4], [-8, -3.2], [-9.8, -1.8]], false);
            return;
        }
        for (const k of [-1, 1]) one([[k * 4.4, 3.6], [k * 5.4, 0.4], [k * 7, -2.4], [k * 9.2, -4.2], [k * 11.4, -4.6], [k * 12.8, -3.6]], false);
    },
};

/* the white chef's toque: a pleated band and three puffs on top */
HD_ACC.chefhat = {
    rise: 15,
    draw(s, a) {
        const P = hdAccPen(s, a, 27), side = a.dir === 'side';
        const white = hdPal('#8a86a0', '#cfcfdc', '#ececf4', '#f8f8fc', '#ffffff'), bandC = hdPal('#86829c', '#c8c8d6', '#e2e2ec', '#f2f2f8', '#ffffff');
        const ox = side ? -0.8 : 0, c = x => Math.max(0, 1 - ((x - ox) / 10) ** 2);
        const sideP = s.add(white, { layer: 1, R: 4.5, grad: 0.25 }), mid = s.add(white, { layer: 2, R: 5, grad: 0.25 }), band = s.add(bandC, { layer: 3, R: 3, grad: 0.15 });
        // the puffs at the sides, the middle one in front of them and taller
        P.el(sideP, ox - 6.6, -5.6, 5.8, 5.4); P.el(sideP, ox + 6.6, -5.6, 5.8, 5.4); P.el(sideP, ox, -3.6, 10.6, 3.4);
        P.el(mid, ox, -8.2, 6.4, 6.4); P.poly(mid, [[ox - 6, -6], [ox + 6, -6], [ox + 5.6, -1], [ox - 5.6, -1]]);
        P.poly(band, hdAccCurve(ox - 9.6, ox + 9.6, x => -1.4 + 0.8 * c(x)).concat(hdAccCurve(ox + 9.8, ox - 9.8, x => 5.6 + 1.1 * c(x))));
        // the pleats: soft creases fanning down each puff, straight ones down the band
        hdAccTex(s, P, sideP, (x, y, d) => { const f = (((x - ox) / 2.8) % 1 + 1) % 1; if (f < 0.2 && y > -9) d(-1); });
        hdAccTex(s, P, mid, (x, y, d) => { const f = (((x - ox) * (1 + (y + 2) * 0.03) / 3) % 1 + 1) % 1; if (f < 0.2 && y > -12) d(-1); else if (f > 0.5 && f < 0.7 && y > -13) d(1); });
        hdAccTex(s, P, band, (x, y, d) => { const f = Math.floor(x - ox + 40); if (f % 3 === 0) d(-1); });
    },
};
