/* ---- 32n_hd_npc_c.js ---- */
/* HD neighbors, part three: the goat, Floss, Waffle, DJ Wasabi, the Cozy Council (Sir Floret, Dame Stalk, Little
   Sprout) and the old keeper's ghost. Same format as 32n_hd_npc_a.js: each is drawn into a 48x72 sprite standing on
   row 71 (the anchor is 24,69), facing the front (the goat side-on, head at the right) and flipped for walking left.
   f.squash is the hop frame (a little shorter and wider; Sprout's reaction face and the ghost's second frame), f.blink
   the eyes shut. hat: where a hat sits [x, y of the top of the head, width]; eye: the eye line [x, y, half the eye gap];
   squashDy: how far the head (and the eye line) drops in the squash frame. */
const hdC_kit = {
    DARK: '#231418',
    FEET: hdPal('#2a1c20', '#3a2a2e', '#4c3a3e', '#5e4a4e', '#705c60'),
    /* a rounded box: [x0, x1) by [y0, y1) with corners of radius r */
    rrect(s, id, x0, y0, x1, y1, r) {
        for (let y = Math.floor(y0); y < Math.ceil(y1); y++) for (let x = Math.floor(x0); x < Math.ceil(x1); x++) {
            const px = x + 0.5, py = y + 0.5; if (px < x0 || px > x1 || py < y0 || py > y1) continue;
            const dx = Math.max(x0 + r - px, 0, px - x1 + r), dy = Math.max(y0 + r - py, 0, py - y1 + r); if (dx * dx + dy * dy <= r * r) s.plot(id, x, y);
        }
    },
    /* a rounded blob between an ellipse (p 2) and a box (p large) */
    blob(s, id, cx, cy, rx, ry, p) {
        for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
            const u = Math.abs((x + 0.5 - cx) / rx), v = Math.abs((y + 0.5 - cy) / ry); if (Math.pow(u, p) + Math.pow(v, p) <= 1) s.plot(id, x, y);
        }
    },
    /* a little foot: a dark rounded nub on rows 68 to 71 */
    foot(s, id, cx, w) { s.rect(id, Math.round(cx - w / 2) + 1, 68, w - 2, 1); s.rect(id, Math.round(cx - w / 2), 69, w, 3); },
    /* the old sprites' look-at-you eye: a white with the pupil low and toward the middle (side -1 = our left eye) */
    eye(s, x0, y0, side, blink) {
        const P = hdC_kit.DARK;
        if (blink) { for (let i = 0; i < 5; i++) s.px(x0 + i, y0 + 3 + (i === 0 || i === 4 ? -1 : 0), P); return; }
        for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) {
            if ((i === 0 || i === 4) && (j === 0 || j === 4)) continue;
            s.px(x0 + i, y0 + j, j === 4 || (j === 3 && (i === 0 || i === 4)) ? '#ded6e2' : '#ffffff');
        }
        // the pupil: 3 across, low, toward the nose, with a glint
        const c = side < 0 ? [2, 3, 4] : [0, 1, 2];
        for (const [i, j] of [[c[1], 2], [c[0], 3], [c[1], 3], [c[2], 3], [c[0], 4], [c[1], 4], [c[2], 4], [side < 0 ? c[2] : c[0], 2]]) if (!((i === 0 || i === 4) && j === 4)) s.px(x0 + i, y0 + j, P);
        s.px(x0 + c[1], y0 + 2, '#6a5060');
    },
    /* a soft oval of blush, w wide */
    cheek(s, cx, cy, c, c2, w) { w = w || 3; for (let i = 0; i < w; i++) { s.px(cx - (w >> 1) + i, cy, c); s.px(cx - (w >> 1) + i, cy + 1, c); } if (c2) { s.px(cx - (w >> 1) - 1, cy + 1, c2); s.px(cx + w - (w >> 1), cy, c2); } },
    /* a broccoli top: round florets, each lit as its own little dome; the last few (over the stem) cast a shadow on it */
    crown(s, mat, bumps, layer, cast) {
        const ids = [];
        bumps.forEach(([x, y, r], i) => { const front = i >= bumps.length - (cast || 0); const id = s.add(mat, { layer: layer + (front ? 1 : 0), R: r * 0.75, grad: 0.15, k: 1.4, cast: front ? 2 : 0 }); s.ellipse(id, x, y, r, r * 0.9); ids.push(id); });
        return ids;
    },
    /* the tiny buds of a floret: a few darker and lighter specks over the crown parts */
    buds(s, ids, x0, y0, x1, y1, seed) {
        const set = new Set(ids);
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
            if (!set.has(s.at(x, y))) continue;
            const h = (x * 73 + y * 151 + seed * 37) % 23;
            if (h === 0) s.mod(x, y, -1); else if (h === 7 && set.has(s.at(x, y - 1))) s.mod(x, y, 1);
        }
    },
    /* faint grooves low on a broccoli stem */
    grooves(s, xs, y0, y1) { for (const x of xs) for (let y = y0; y < y1; y++) s.mod(x, y, y === y0 ? 0 : -1); },
    /* mirror x about the middle for the squash frame's spread (a touch wider) */
    wide(bumps, wd) { return bumps.map(([x, y, r]) => [x < 24 ? x - wd : x > 24 ? x + wd : x, y, r]); },
};

/* the goat: side-on, head at the right, Sarah's goat on the farm. Shaggy white coat, tan horns, a little beard. */
HD_NPC.goat = {
    side: true, hat: [33, 42, 13], eye: [32, 46, 2], faceX: 44, squashDy: 3,
    draw(s, f) {
        const by = f.squash ? 3 : 0, wd = f.squash ? 1 : 0;
        const fur = hdPal('#6b6570', '#cfc8c8', '#f2eee6', '#f9f7f1', '#ffffff');
        const hoof = hdPal('#1c181a', '#2c2729', '#3a3336', '#4b4447', '#5c5458');
        const horn = hdPal('#5a4c38', '#837256', '#9a8a70', '#b3a387', '#c9bb9f');
        const legF = s.add(hdPal('#5a5560', '#aaa3a6', '#d2ccc6', '#e2ddd6', '#ece8e1'), { layer: 0, R: 2, grad: 0.1 });
        const hoofF = s.add(hoof, { layer: 0, R: 1.5, bias: -0.1 });
        const legN = s.add(fur, { layer: 1, R: 2, grad: 0.1 });
        const hoofN = s.add(hoof, { layer: 1, R: 1.5 });
        const tail = s.add(fur, { layer: 1, R: 2 });
        const body = s.add(fur, { layer: 2, R: 8, grad: 0.12, cast: 2 });
        const hornB = s.add(horn, { layer: 2, R: 1.5 });
        const hornF = s.add(horn, { layer: 3, R: 1.5 });
        const head = s.add(fur, { layer: 4, R: 5, grad: 0.15, cast: 1 });
        const ear = s.add(fur, { layer: 5, R: 1.5, bias: -0.08 });
        const beard = s.add(hdPal('#6e6862', '#b2aa9e', '#cdc6b8', '#ddd7cb', '#ebe7de'), { layer: 5, R: 2, grad: 0.25 });
        const nose = s.add(hdPal('#a0605e', '#e08e8e', '#f2a6a6', '#f8c0bc', '#fcd8d4'), { layer: 6, R: 1.5 });
        // legs: the far pair a little darker and a step higher, the near pair in front
        for (const x of [12, 26]) { s.rect(legF, x - 1.5, 59, 4, 9); s.rect(hoofF, x - 1.5, 67, 4, 3); }
        for (const x of [7, 31]) { s.rect(legN, x - 2, 60, 5, 9); s.rect(hoofN, x - 2, 69, 5, 3); }
        s.line(tail, 4.6, 55.5 + by, 6.6, 50 + by, 2.4, 1.6); s.line(tail, 6.6, 50 + by, 8.6, 47.6 + by, 1.5, 1);
        hdC_kit.rrect(s, body, 1.5 - wd, 52.5 + by, 38.5 + wd, 65.5, 6);
        s.poly(body, [[21, 55 + by], [25, 47 + by], [31, 45.5 + by], [37, 50 + by], [38.5 + wd, 58], [32, 61]]);
        // a shaggy fringe along the belly
        for (const x of [9, 10, 15, 16, 21, 22, 27, 34]) s.plot(body, x, 65);
        s.line(hornB, 30.5, 43 + by, 28.6, 37 + by, 1.7, 0.9);
        s.line(hornF, 36, 43 + by, 35.4, 36.6 + by, 1.8, 0.9);
        s.ellipse(head, 33.5, 47 + by, 8.5, 5.6);
        s.ellipse(head, 40.8, 50.6 + by, 5.6, 3.7);
        s.line(ear, 28, 45 + by, 23, 47.4 + by, 1.8, 1.1);
        s.poly(beard, [[35.5, 53 + by], [42, 53 + by], [41.4, 57 + by], [39.6, 62.6 + by], [38.4, 62.6 + by], [36.6, 58 + by]]);
        s.ellipse(nose, 44.2, 50.4 + by, 2.4, 1.9);
        // horn rings, fur tufts on the haunch and shoulder, strands in the beard
        for (const [x, y] of [[29.6, 40], [28.9, 38], [35.8, 40], [35.6, 38]]) s.mod(x, y + by, -1);
        for (const [x, y] of [[6, 57], [7, 56], [8, 55], [12, 61], [13, 62], [30, 57], [31, 58], [18, 63], [24, 63]]) s.mod(x, y + (y < 60 ? by : 0), -1);
        for (const [x, y] of [[5, 55], [6, 54], [16, 55], [17, 55], [23, 54]]) s.mod(x, y + by, 1);
        for (const [x, y] of [[38, 55], [38, 56], [39, 58], [39, 59], [40, 55]]) s.mod(x, y + by, -1);
        // the face: one eye, a nostril, the mouth line, the pink inside of the ear
        const ey = 45 + by;
        if (f.blink) { s.px(30, ey + 2, hdC_kit.DARK); s.px(31, ey + 2, hdC_kit.DARK); s.px(32, ey + 2, hdC_kit.DARK); }
        else { for (const [x, y] of [[31, 0], [32, 0], [31, 1], [32, 1], [31, 2], [32, 2]]) s.px(x, ey + y, hdC_kit.DARK); s.px(31, ey, '#7a6870'); }
        s.px(45, ey + 5, '#b06a6a');
        for (const x of [41, 42, 43]) s.px(x, ey + 8, '#a89e9a');
        s.px(25, 46 + by, '#e7b0aa'); s.px(26, 46 + by, '#e7b0aa');
    },
};

/* Floss: a cloud of cotton candy (pink, with a blue puff) on a paper cone; blue cheeks */
HD_NPC.floss = {
    hat: [24, 25, 34], eye: [24, 45, 9], squashDy: 3,
    draw(s, f) {
        const by = f.squash ? 3 : 0, wd = f.squash ? 1 : 0;
        const pink = hdPal('#9a4a7a', '#f293c6', '#ffb3d9', '#ffcbe5', '#ffe4f1');
        const blue = hdPal('#6a5a96', '#88c6ef', '#aee0ff', '#c8ebff', '#e4f6ff');
        const feet = s.add(hdC_kit.FEET, { layer: 0, R: 2 });
        const cone = s.add(hdPal('#8a6a4a', '#e2c49a', '#fff2dc', '#fff8ec', '#ffffff'), { layer: 0, R: 4, grad: 0.1 });
        hdC_kit.foot(s, feet, 21, 5); hdC_kit.foot(s, feet, 27, 5);
        s.poly(cone, [[13.5, 54], [34.5, 54], [28.6, 68.6], [19.4, 68.6]]);
        // the cone's spiral stripe and rolled rim
        for (let y = 56; y < 68; y++) for (let x = 14; x < 35; x++) if (((x - y + 400) % 7) < 2) s.mod(x, y, -1);
        for (let x = 15; x < 33; x++) s.mod(x, 56, 1);
        // the cloud: one soft pink mass and a blue puff behind it, lumpy at the edge; spun sugar swirls inside
        const blueP = s.add(blue, { layer: 1, R: 6, grad: 0.12, k: 1.1, cast: 2 }), pinkP = s.add(pink, { layer: 2, R: 6, grad: 0.12, k: 1.1, cast: 2 });
        for (const [x, y, rx, ry] of [[31, 31.5 + by, 7, 7], [39.5 + wd, 41 + by * 0.6, 8, 8.5 - by * 0.3], [36.5, 50 + by * 0.3, 7, 5]]) s.ellipse(blueP, x, y, rx, ry);
        for (const [x, y, rx, ry] of [[17, 31.5 + by, 7.5, 7], [8 - wd, 41 + by * 0.6, 8, 8.5 - by * 0.3], [10.5, 49.5 + by * 0.3, 6.5, 5], [23, 43.5 + by * 0.7, 15, 10 - by * 0.3], [23.5, 50 + by * 0.3, 11.5, 5.6]]) s.ellipse(pinkP, x, y, rx, ry);
        const swirl = (cx, cy, r, a0, a1, d) => { for (let a = a0; a <= a1; a += 0.18) s.mod(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.8, d); };
        swirl(15, 33 + by, 4, 3.4, 5.6, -1); swirl(15, 34 + by, 4, 3.6, 5.4, 0); swirl(9, 43 + by, 4.5, 3.2, 5.0, -1); swirl(12, 52 + by * 0.3, 3.5, 3.6, 5.6, -1);
        swirl(33, 31 + by, 4, 3.6, 5.8, -1); swirl(41, 42 + by * 0.6, 4.5, 3.4, 5.4, -1); swirl(36, 51 + by * 0.3, 3, 3.6, 5.6, -1);
        swirl(31, 52 + by * 0.3, 3.5, 3.6, 5.2, -1); swirl(17, 38 + by * 0.7, 3, 3.8, 5.4, 1);
        const ey = 42 + by;
        hdC_kit.eye(s, 12, ey, -1, f.blink); hdC_kit.eye(s, 30, ey, 1, f.blink);
        hdC_kit.cheek(s, 11, ey + 6, '#8ccaf4', '#b4def9', 4); hdC_kit.cheek(s, 35, ey + 6, '#8ccaf4', '#b4def9', 4);
        for (const [x, y] of [[21, 6], [22, 7], [23, 7], [24, 7], [25, 7], [26, 6]]) s.px(x, ey + y, '#8a2a5a');
        s.px(23, ey + 8, '#d0608e'); s.px(24, ey + 8, '#d0608e');
    },
};

/* Waffle: a square waffle with a pat of butter melting on top */
HD_NPC.waffle = {
    hat: [24, 40, 38], eye: [24, 54, 9], squashDy: 3,
    draw(s, f) {
        const by = f.squash ? 3 : 0, wd = f.squash ? 1 : 0;
        const feet = s.add(hdC_kit.FEET, { layer: 0, R: 2 });
        const pock = s.add(hdPal('#9a6420', '#ad7424', '#c98a2e', '#d69a40', '#e0aa55'), { layer: 1, flat: 1, grad: 0 });
        const grid = s.add(hdPal('#7a4a1a', '#c98a2e', '#e8b25a', '#f2c878', '#fadc9a'), { layer: 2, R: 2, grad: 0.15, cast: 1 });
        const bmat = hdPal('#b08a2a', '#e8c860', '#fff0a0', '#fff6c4', '#fffbe2');
        const melt = s.add(bmat, { layer: 3, R: 1.5, grad: 0.2, bias: 0.05 });
        const butter = s.add(bmat, { layer: 4, R: 2.5, grad: 0.3, cast: 1 });
        hdC_kit.foot(s, feet, 15, 6); hdC_kit.foot(s, feet, 33, 6);
        const top = 40.5 + by, bot = 67.5;
        hdC_kit.rrect(s, grid, 4.5 - wd, top, 43.5 + wd, bot, 4);
        // the pockets: six across, four down, shaded as dips (dark under the ridge above, lit low and right)
        const p = (bot - top - 3) / 4;
        for (let j = 0; j < 4; j++) {
            const y0 = Math.round(top + 2.5 + j * p), y1 = Math.round(top + 2.5 + (j + 1) * p) - 2;
            for (let i = 0; i < 6; i++) {
                const x0 = 7 + i * 6;
                s.rect(pock, x0, y0, 4, y1 - y0);
                for (let x = x0; x < x0 + 4; x++) s.mod(x, y1 - 1, 1);
                for (let y = y0; y < y1; y++) s.mod(x0 + 3, y, 1);
            }
        }
        // the butter, a glossy puddle round its foot and one drip
        s.ellipse(melt, 24, 41.6 + by, 11, 2); s.rect(melt, 30, 42 + by, 2, 4); s.ellipse(melt, 31, 46 + by, 1.3, 1.3);
        s.poly(butter, [[18, 33.5 + by], [30, 33.5 + by], [32.5, 36 + by], [33, 41 + by], [15, 41 + by], [15.5, 36 + by]]);
        s.px(19, 35 + by, '#ffffff'); s.px(20, 35 + by, '#ffffff'); s.px(31, 45 + by, '#fffbe2');
        const ey = 51 + by;
        hdC_kit.eye(s, 12, ey, -1, f.blink); hdC_kit.eye(s, 31, ey, 1, f.blink);
        hdC_kit.cheek(s, 10, ey + 6, '#ff9aa8', '#ffc0c8', 4); hdC_kit.cheek(s, 37, ey + 6, '#ff9aa8', '#ffc0c8', 4);
        for (const [x, y] of [[21, 6], [22, 7], [23, 7], [24, 7], [25, 7], [26, 6]]) s.px(x, ey + y, '#6a3a14');
        s.px(23, ey + 8, '#a0522a'); s.px(24, ey + 8, '#a0522a');
    },
};

/* DJ Wasabi: a swirl of wasabi with black shades and red headphones, and a smirk */
HD_NPC.wasabi = {
    hat: [25, 30, 22], eye: [25, 49, 7], squashDy: 3,
    draw(s, f) {
        const by = f.squash ? 3 : 0, wd = f.squash ? 1 : 0;
        const paste = hdPal('#2f5a1c', '#7aa832', '#9ccc4a', '#b2da64', '#c8e87a');
        const black = hdPal('#0a090d', '#15131a', '#1f1c26', '#2e2a38', '#403b4c');
        const feet = s.add(black, { layer: 0, R: 2 });
        const base = s.add(paste, { layer: 1, R: 10, grad: 0.08, k: 1.1 });
        const tip = s.add(paste, { layer: 3, R: 3.5, grad: 0.12, cast: 1, k: 1.3 });
        const cupL = s.add(black, { layer: 4, R: 2 }), cupR = s.add(black, { layer: 4, R: 2 });
        const red = hdPal('#7a1a2a', '#c43048', '#e0405a', '#ec5c72', '#f48a9a');
        const padL = s.add(red, { layer: 5, flat: 1, grad: 0.5, bias: -0.02 }), padR = s.add(red, { layer: 5, flat: 1, grad: 0.5, bias: -0.06 });
        const shades = s.add(black, { layer: 6, R: 2, grad: 0.3 });
        hdC_kit.foot(s, feet, 15, 6); hdC_kit.foot(s, feet, 33, 6);
        // a soft mound of paste with the tip swirled on top, curling over to the right
        hdC_kit.blob(s, base, 24, 58 + by * 0.3, 23.8 + wd, 10.5 - by * 0.3, 2.3);
        s.ellipse(base, 24.5, 44.4 + by, 14.5, 6.8);
        s.ellipse(tip, 25.5, 36.6 + by, 8.5, 4.8);
        s.ellipse(tip, 29, 31.6 + by, 3.8, 3.2);
        s.line(tip, 29.5, 30 + by, 31.4, 28.4 + by, 1.6, 1.1);
        // the headphones: black cups with red pads, joined to the shades
        const gy = 45 + by;
        hdC_kit.blob(s, cupL, 8, gy + 0.3, 5.6, 6.1, 2.8); hdC_kit.blob(s, cupR, 41, gy + 0.3, 5.6, 6.1, 2.8);
        hdC_kit.blob(s, padL, 7.4, gy + 0.1, 3.1, 3.8, 3); hdC_kit.blob(s, padR, 41.6, gy + 0.1, 3.1, 3.8, 3);
        // the shades: a bar and two lenses
        s.rect(shades, 12, gy, 25, 3); s.rect(shades, 23, gy, 5, 5);
        hdC_kit.rrect(s, shades, 13, gy, 24.5, gy + 8.5, 3.5); hdC_kit.rrect(s, shades, 26.5, gy, 38, gy + 8.5, 3.5);
        // a swirl line round the base and a few grains in the paste
        for (const [x, y] of [[21, 39], [13, 64], [14, 64], [34, 64], [35, 65], [41, 59], [7, 58]]) s.mod(x, y + (y < 50 ? by : 0), -1);
        // glints on the lenses
        for (const [x, y] of [[16, 2], [17, 2], [18, 2], [17, 3], [29, 2], [30, 2], [31, 2], [30, 3]]) s.px(x, gy + y, '#4ec3d9');
        s.px(15, gy + 2, '#a8ecf7'); s.px(28, gy + 2, '#a8ecf7');
        // cheeks and the smirk
        const my = 58 + Math.round(by * 0.3);
        hdC_kit.cheek(s, 12, my, '#d6f08e', '#c4e67c', 4); hdC_kit.cheek(s, 37, my, '#d6f08e', '#c4e67c', 4);
        for (const [x, y] of [[20, 1], [21, 2], [22, 2], [23, 2], [24, 2], [25, 1], [26, 1], [27, 0], [28, -1], [22, 3], [23, 3], [24, 3]]) s.px(x, my + y, y === 3 ? '#4e7a2a' : '#24461a');
    },
};

/* the Cozy Council: three very serious heads of broccoli. The squash frame narrows the eyes, as the old one did. */
HD_NPC.floret = {
    hat: [24, 25, 32], eye: [25, 50, 5], squashDy: 3,
    draw(s, f) {
        const by = f.squash ? 3 : 0, wd = f.squash ? 1 : 0;
        const head = hdPal('#1e4a1c', '#2b6e2a', '#3f8f3a', '#52a446', '#6cba55');
        const feet = s.add(hdC_kit.FEET, { layer: 0, R: 2 });
        const stem = s.add(hdPal('#2a5424', '#86bd6a', '#a9d98a', '#bfe6a2', '#d6f2be'), { layer: 1, R: 7, grad: 0.1, k: 1.3 });
        hdC_kit.foot(s, feet, 17, 4); hdC_kit.foot(s, feet, 31, 4);
        hdC_kit.rrect(s, stem, 13.5 - wd * 0.5, 40 + by, 34.5 + wd * 0.5, 67.5, 3.5);
        const ids = hdC_kit.crown(s, head, hdC_kit.wide([[14, 30 + by, 6], [24, 28.6 + by, 6.6], [34, 30 + by, 6], [6, 36 + by, 6], [42, 36 + by, 6], [17, 34.5 + by, 6.6], [31, 34.5 + by, 6.6],
            [10.5, 39.5 + by, 5.5], [37.5, 39.5 + by, 5.5], [21, 39 + by, 6], [28.5, 39.5 + by, 5.8]], wd), 2, 4);
        hdC_kit.buds(s, ids, 0, 22, 47, 46, 1);
        hdC_kit.grooves(s, [19, 29], 61, 66);
        // the face: eyes peering down (the squash frame narrows them to slits), one behind a monocle
        const ey = 48 + by;
        if (f.blink) { for (const x of [18, 19, 20, 21, 22, 27, 28, 29, 30, 31]) s.px(x, ey + 3, hdC_kit.DARK); }
        else for (const [x0, w] of [[18, '#f2e6a0'], [27, '#ffffff']]) {
            for (let j = f.squash ? 2 : 0; j < 5; j++) for (let i = 0; i < 5; i++) {
                if ((i === 0 || i === 4) && (j === 0 || j === 4)) continue;
                s.px(x0 + i, ey + j, j < 2 ? w : hdC_kit.DARK);
            }
            if (!f.squash) s.px(x0 + 1, ey + 2, '#5a4048');
        }
        // the monocle: a thin gold ring, a glint, a fine chain down the side
        for (let a = 0; a < 40; a++) {
            const t = a / 40 * Math.PI * 2, x = Math.round(20 + Math.cos(t) * 3.9), y = Math.round(ey + 2 + Math.sin(t) * 3.9);
            s.px(x, y, t > Math.PI * 1.05 && t < Math.PI * 1.6 ? '#f6dc80' : t > Math.PI * 0.2 && t < Math.PI * 0.9 ? '#a8822e' : '#d0a642');
        }
        for (const [x, y] of [[16, 6], [16, 8], [15, 10], [15, 12]]) s.px(x, ey + y, '#c09a40');
        for (const x of [22, 23, 24, 25, 26]) { s.px(x, ey + 9, '#2a5424'); s.px(x, ey + 10, '#3e6e34'); }
        s.px(21, ey + 10, '#2a5424'); s.px(27, ey + 10, '#2a5424');
    },
};

HD_NPC.stalk = {
    hat: [24, 31, 30], eye: [24, 50, 6], squashDy: 3,
    draw(s, f) {
        const by = f.squash ? 3 : 0, wd = f.squash ? 1 : 0;
        const head = hdPal('#1e4a1c', '#2f742c', '#4a9a42', '#5eae50', '#7cc466');
        const feet = s.add(hdC_kit.FEET, { layer: 0, R: 2 });
        const stem = s.add(hdPal('#2a5424', '#8fc272', '#b5e096', '#c8eaad', '#dcf4c6'), { layer: 1, R: 7, grad: 0.1, k: 1.3 });
        hdC_kit.foot(s, feet, 17, 4); hdC_kit.foot(s, feet, 31, 4);
        hdC_kit.rrect(s, stem, 13.5 - wd * 0.5, 42 + by, 34.5 + wd * 0.5, 67.5, 3.5);
        const ids = hdC_kit.crown(s, head, hdC_kit.wide([[16.5, 36 + by, 5.4], [24.5, 35 + by, 5.8], [32, 36 + by, 5.4], [10.5, 40 + by, 4.8], [37.5, 40 + by, 4.8],
            [19.5, 40.2 + by, 5.4], [29, 40.2 + by, 5.4]], wd), 2, 3);
        hdC_kit.buds(s, ids, 0, 28, 47, 47, 2);
        hdC_kit.grooves(s, [19, 29], 63, 66);
        // the face: heavy-lidded eyes glancing sideways (half shut in the squash frame), and a wide toothy grimace
        const ey = 48 + by, LID = '#3a3340';
        if (f.blink) { for (const x of [15, 16, 17, 18, 19, 28, 29, 30, 31, 32]) s.px(x, ey + 3, LID); }
        else {
            for (let i = 0; i < 5; i++) { s.px(15 + i, ey + (i === 0 ? 1 : 0), LID); s.px(28 + i, ey + (i === 4 ? 1 : 0), LID); s.px(15 + i, ey + 1, LID); s.px(28 + i, ey + 1, LID); }
            s.px(14, ey, LID); s.px(33, ey, LID);
            if (!f.squash) {
                for (const [x, y] of [[16, 2], [17, 2], [18, 2], [19, 2], [17, 3], [18, 3], [19, 3]]) s.px(x, ey + y, x >= 18 ? hdC_kit.DARK : LID);
                for (const [x, y] of [[28, 2], [29, 2], [30, 2], [31, 2], [28, 3], [29, 3], [30, 3]]) s.px(x, ey + y, x <= 29 ? hdC_kit.DARK : LID);
            } else { for (const x of [17, 18, 19, 28, 29, 30]) s.px(x, ey + 2, x === 19 || x === 28 ? hdC_kit.DARK : LID); }
        }
        const my = 57 + by, LIP = '#2a5424', TOOTH = '#fff6e0';
        for (let x = 18; x <= 29; x++) { s.px(x, my, LIP); s.px(x, my + 4, LIP); }
        for (let y = 1; y < 4; y++) { s.px(17, my + y, LIP); s.px(30, my + y, LIP); for (let x = 18; x <= 29; x++) s.px(x, my + y, (x === 21 || x === 25) ? '#8a7a6a' : y === 3 ? '#e6dcc4' : TOOTH); }
    },
};

HD_NPC.sprout = {
    hat: [24, 43, 24], eye: [24, 55, 5], squashDy: 3,
    draw(s, f) {
        const by = f.squash ? 3 : 0, wd = f.squash ? 1 : 0;
        const head = hdPal('#1e4a1c', '#3a7d31', '#5aad4a', '#70c05c', '#8ed476');
        const feet = s.add(hdC_kit.FEET, { layer: 0, R: 2 });
        const stem = s.add(hdPal('#2a5424', '#9ccc7e', '#c2e8a2', '#d2efb8', '#e4f7d2'), { layer: 1, R: 6, grad: 0.1, k: 1.3 });
        hdC_kit.foot(s, feet, 19.5, 4); hdC_kit.foot(s, feet, 28.5, 4);
        hdC_kit.rrect(s, stem, 16.5 - wd * 0.5, 51 + by, 31.5 + wd * 0.5, 67.5, 3);
        const ids = hdC_kit.crown(s, head, hdC_kit.wide([[19.5, 46.5 + by, 4.4], [28.5, 46.5 + by, 4.4], [24, 45.6 + by, 4.4], [13.5, 50 + by, 4], [34.5, 50 + by, 4], [21, 50.2 + by, 4.4], [27.5, 50.2 + by, 4.4]], wd), 2, 3);
        hdC_kit.buds(s, ids, 0, 38, 47, 56, 3);
        const ey = 54 + by, RED = '#e65468', PINK = '#ff8a9a', MOUTH = '#7a1a2a';
        if (f.squash) {
            // the reaction: wide eyes, a little round gasp, cheeks flushed right up under the eyes
            for (const cx of [18, 28]) {
                for (const [x, y] of [[0, 0], [1, 0], [-1, 1], [0, 1], [1, 1], [2, 1], [-1, 2], [0, 2], [1, 2], [2, 2], [0, 3], [1, 3]]) s.px(cx + x, ey + y - 2, hdC_kit.DARK);
                s.px(cx, ey - 1, '#ffffff'); s.px(cx + 1, ey + 1, '#5a4048');
            }
            hdC_kit.cheek(s, 19, ey + 3, RED, null, 3); hdC_kit.cheek(s, 29, ey + 3, RED, null, 3);
            for (const [x, y] of [[23, 3], [24, 3], [22, 4], [25, 4], [22, 5], [25, 5], [23, 6], [24, 6]]) s.px(x, ey + y, MOUTH);
            for (const [x, y] of [[23, 4], [24, 4], [23, 5], [24, 5]]) s.px(x, ey + y, PINK);
        } else {
            if (f.blink) { for (const x of [18, 19, 20, 27, 28, 29]) s.px(x, ey + 2, hdC_kit.DARK); }
            else { for (const [x, y] of [[18, 0], [19, 0], [18, 1], [19, 1], [18, 2], [19, 2], [28, 0], [29, 0], [28, 1], [29, 1], [28, 2], [29, 2]]) s.px(x, ey + y, hdC_kit.DARK); s.px(18, ey, '#ffffff'); s.px(28, ey, '#ffffff'); }
            hdC_kit.cheek(s, 19, ey + 5, RED, null, 3); hdC_kit.cheek(s, 29, ey + 5, RED, null, 3);
            for (const x of [22, 23, 24, 25]) s.px(x, ey + 4, MOUTH);
            s.px(22, ey + 5, MOUTH); s.px(25, ey + 5, MOUTH); s.px(23, ey + 5, PINK); s.px(24, ey + 5, PINK);
            s.px(23, ey + 6, MOUTH); s.px(24, ey + 6, MOUTH);
        }
    },
};

/* the old keeper: the friendly ghost of the lighthouse keeper, in his cap, with a great white beard. He floats; the
   squash frame is his second frame (a little lower, the hem waving the other way). */
HD_NPC.ghost = {
    hat: [24, 2, 32], eye: [24, 22, 7], squashDy: 2,
    draw(s, f) {
        const y0 = f.squash ? 2 : 0;
        const glow = hdPal('#6e82c4', '#aec2ee', '#d0e1fc', '#e0ebfe', '#eef4ff');
        const white = hdPal('#9aacd8', '#dae4f7', '#eef4fe', '#f8fbff', '#ffffff');
        const navy = hdPal('#1a2656', '#2a3a71', '#3c508c', '#4d63a3', '#6478b8');
        // a ghost glows evenly: a smooth top-lit fade, the far side and the hem a shade cooler (as the old one)
        const body = s.add(glow, { layer: 1, flat: 1, grad: 0.5, bias: 0.02 });
        const beard = s.add(white, { layer: 1, flat: 1, grad: 0.3, bias: 0.16 });
        const mus = [s.add(white, { layer: 1, R: 2, grad: 0.1, bias: 0.1 }), s.add(white, { layer: 1, R: 2, grad: 0.1, bias: 0.1 })];
        const arm = s.add(glow, { layer: 2, R: 2 });
        const cap = s.add(navy, { layer: 4, R: 4, grad: 0.25 });
        const brim = s.add(hdPal('#121c44', '#1e2a5c', '#28386e', '#34477f', '#425690'), { layer: 5, R: 2, cast: 2 });
        // the body: a round head widening to a sheet, a hem of four waving lobes
        s.ellipse(body, 24, 19 + y0, 16.5, 11);
        for (let y = 19; y < 62; y++) { const t = Math.min(1, (y - 19) / 30), w = 16.5 + 6 * t * t * (3 - 2 * t); s.poly(body, [[24 - w, y + y0], [24 + w, y + y0], [24 + w, y + 1 + y0], [24 - w, y + 1 + y0]]); }
        const ph = f.squash ? -3 : 0;
        for (let i = 0; i < 4; i++) {
            const cx = 7.5 + i * 11.2 + ph, len = (i % 2 ? 7.5 : 9) - y0 * 0.5;
            s.poly(body, [[cx - 5, 60 + y0], [cx + 5, 60 + y0], [cx + 4, 62 + y0 + len * 0.6], [cx + 1.5, 62 + y0 + len], [cx - 1.5, 62 + y0 + len], [cx - 4, 62 + y0 + len * 0.6]]);
        }
        for (let x = 0; x < 48; x++) for (let y = 59; y < 72; y++) if (s.at(x, y) === body && (x < 1 || x > 46)) s.erase(x, y);
        s.ellipse(arm, 3.4, 37 + y0, 3.2, 2.6); s.ellipse(arm, 44.6, 37 + y0, 3.2, 2.6);
        for (let y = 10; y < 72; y++) for (let x = 30; x < 48; x++) if (s.at(x, y) === body && x > 37 + Math.max(0, y - 30) * 0.12) s.mod(x, y, -1);
        for (let y = 14; y < 40; y++) for (let x = 7; x < 12; x++) if (s.at(x, y) === body && s.at(x - 1, y) === body) s.mod(x, y, 1);
        // the beard: a mustache in two curls over a great soft beard
        s.poly(beard, [[15, 29.5 + y0], [33, 29.5 + y0], [35.6, 33 + y0], [35.8, 37 + y0], [34, 40.4 + y0], [30.6, 42.8 + y0], [26.4, 44 + y0], [24, 44.6 + y0],
            [21.6, 44 + y0], [17.4, 42.8 + y0], [14, 40.4 + y0], [12.2, 37 + y0], [12.4, 33 + y0]]);
        for (const d of [-1, 1]) { const m = mus[d < 0 ? 0 : 1]; s.line(m, 24 + d * 0.6, 28.6 + y0, 24 + d * 7.4, 30.4 + y0, 2.5, 1.5); s.line(m, 24 + d * 7.4, 30.4 + y0, 24 + d * 9.8, 32.6 + y0, 1.5, 0.8); }
        for (const [x, y] of [[16, 35], [17, 36], [31, 35], [30, 36]]) s.mod(x, y + y0, -1);
        // a soft shadow under the beard where it lies on the sheet
        for (let x = 12; x < 37; x++) for (let y = 46 + y0; y > 36; y--) if (s.at(x, y) === beard) { s.mod(x, y + 1, -1); break; }
        // the keeper's cap with its gold badge
        s.poly(cap, [[8.5, 3.5 + y0], [10.5, 1.5 + y0], [37.5, 1.5 + y0], [39.5, 3.5 + y0], [40, 10 + y0], [8, 10 + y0]]);
        for (let x = 14; x < 34; x++) { s.mod(x, 6 + y0, 1); s.mod(x, 7 + y0, 1); }
        hdC_kit.rrect(s, brim, 4.5, 9 + y0, 43.5, 12.5 + y0, 1.5);
        for (const [x, y, c] of [[24, 3, '#ebca50'], [25, 3, '#f6e08a'], [23, 4, '#ebca50'], [24, 4, '#ebca50'], [25, 4, '#ebca50'], [26, 4, '#b8962e'], [24, 5, '#b8962e'], [25, 5, '#b8962e']]) s.px(x, y + y0, c);
        // sleepy, contented eyes
        const ey = 21 + y0, EY = '#4c4d6f';
        if (f.blink) { for (const x of [15, 16, 17, 18, 19, 28, 29, 30, 31, 32]) s.px(x, ey + 2, EY); }
        else {
            for (const x of [16, 17, 18, 29, 30, 31]) { s.px(x, ey + 1, EY); s.px(x, ey + 2, '#9aa6d0'); }
            for (const x of [15, 19, 28, 32]) s.px(x, ey + 2, EY);
        }
        s.px(12, ey + 4, '#c8d4f4'); s.px(13, ey + 4, '#c8d4f4'); s.px(34, ey + 4, '#c8d4f4'); s.px(35, ey + 4, '#c8d4f4');
    },
};
