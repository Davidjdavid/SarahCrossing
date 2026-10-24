/* ---- 32yb_hd_items.js ---- */
/* HD items for the HD-2D view: the things that lie about in the world (shells on the beach, fallen fruit, gems from
   rocks, a caught fish held up, crops ready to pick), each today's 16x16 icon at three times the detail: the same
   frame, anchor, silhouette and colors, with a clear form, a highlight and glints on the shiny ones (shells, gems, wet
   fish) so they read at a glance. Menus keep today's icons. Families share a helper with parameters (the fish body,
   the cut gem); things lie on the ground and cast their own shadows in 3D, so none draws one. */

/* ---------------------------------------------------------------- helpers */
/* a small seeded hash in [0, 1) (scatter that never changes) */
const hdI_h = (x, y, k) => { let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(k | 0, 1442695041); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
/* every pixel of a part */
function hdI_each(s, id, fn) { const W = s.w; for (let y = 0; y < s.h; y++) for (let x = 0; x < W; x++) if (s.part[y * W + x] === id) fn(x, y); }
/* light a part by hand (it must be made { flat: 1, grad: 0 }): n(x, y) gives the surface's direction there as
   [nx, ny, nz]; a big smooth body then gets one clean highlight and shadow instead of the distance field's blotches */
function hdI_lit(s, id, n, bias, th) {
    const W = s.w, L = HD_LIGHT, [t1, t2, t3] = th || [0.3, 0.66, 0.86]; bias = bias || 0;
    for (let y = 0; y < s.h; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x; if (s.part[i] !== id) continue;
        const v = n(x + 0.5, y + 0.5), l = Math.hypot(v[0], v[1], v[2]) || 1, d = (v[0] * L[0] + v[1] * L[1] + v[2] * L[2]) / l + bias;
        /* never the highlight right on the silhouette: its outline there would be too pale to see on sand */
        const edge = x === 0 || y === 0 || s.part[i - 1] < 0 || s.part[i - W] < 0;
        hdI_md(s, i, Math.min(edge ? 3 : 4, d < t1 ? 1 : d < t2 ? 2 : d < t3 ? 3 : 4) - 2);
    }
}
/* the direction on an egg or ball (center cx, cy, radii rx, ry); f > 1 flattens it toward us */
const hdI_egg = (cx, cy, rx, ry, f) => (x, y) => { const u = (x - cx) / rx, v = (y - cy) / ry, d = u * u + v * v; return d >= 1 ? [u, v, 0.12] : [u, v, Math.sqrt(1 - d) * (f || 1)]; };
const hdI_LITP = { flat: 1, grad: 0 };
/* the direction on a tube along a path (a chili, a carrot, an eel), its radius eased from r0 to r1: round across and
   round at the ends */
function hdI_tube(pts, r0, r1, pw) {
    const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const T = L[L.length - 1] || 1; r1 = r1 == null ? r0 : r1;
    return (x, y) => {
        let best = 1e9, bx = 0, by = 0, bt = 0;
        for (let i = 1; i < pts.length; i++) {
            const a = pts[i - 1], b = pts[i], dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / l2));
            const qx = a[0] + dx * t, qy = a[1] + dy * t, d = (x - qx) * (x - qx) + (y - qy) * (y - qy);
            if (d < best) { best = d; bx = x - qx; by = y - qy; bt = (L[i - 1] + (L[i] - L[i - 1]) * t) / T; }
        }
        const r = r0 + (r1 - r0) * Math.pow(bt, pw || 1), u = bx / r, v = by / r, d = u * u + v * v;
        return d >= 1 ? [u, v, 0.12] : [u, v, Math.sqrt(1 - d)];
    };
}
/* a gentler ramp than hdRamp's for small bright things, mixed in RGB: its deep saturated shadow would swamp a shape
   this small, and a pale color's HSL saturation is so high that its shadow would turn a vivid pink or blue */
const hdI_SOFT = new Map();
const hdI_mix = (a, b, t) => [0, 1, 2].map(k => Math.round(a[k] + (b[k] - a[k]) * t));
function hdI_soft(hex) {
    let r = hdI_SOFT.get(hex);
    if (r) return r;
    const c = hdRgb(hex), mul = k => c.map(v => v * k);
    const l = (Math.max(...c) + Math.min(...c)) / 510;
    r = [hdI_mix(mul(0.42), [40, 28, 46], 0.3), hdI_mix(mul(l > 0.8 ? 0.86 : 0.8), [72, 60, 120], 0.12), c, hdI_mix(c, [255, 250, 232], 0.32), hdI_mix(c, [255, 255, 246], 0.64)];
    hdI_SOFT.set(hex, r);
    return r;
}
/* white things (a koi, a pearl, a fish's belly) get a cool grey ramp: hdRamp would leave them flat */
const hdI_WHITE = hdPal('#77708a', '#cdc8dc', '#efedf5', '#fbfaff', '#ffffff');
/* a lens (leaf, fin, petal) from (x0, y0) to the tip (x1, y1), w at its widest (share m of the way), bent sideways */
function hdI_leaf(s, id, x0, y0, x1, y1, w, m, bend) {
    m = m == null ? 0.45 : m; bend = bend || 0;
    const L = Math.hypot(x1 - x0, y1 - y0) || 1, ux = (x1 - x0) / L, uy = (y1 - y0) / L, A = [], B = [], n = 12;
    for (let i = 0; i <= n; i++) {
        const t = i / n, hw = w * (t < m ? Math.pow(Math.sin(t / m * Math.PI / 2), 0.8) : Math.sqrt(Math.max(0, 1 - Math.pow((t - m) / (1 - m), 2.2))));
        const b = bend * Math.sin(t * Math.PI), cx = x0 + (x1 - x0) * t - uy * b, cy = y0 + (y1 - y0) * t + ux * b;
        A.push([cx - uy * hw, cy + ux * hw]); B.push([cx + uy * hw, cy - ux * hw]);
    }
    s.poly(id, A.concat(B.reverse()));
}
/* a thick stroke along a path of points, its radius eased from r0 to r1 (tentacles, stems, a chili, an eel) */
function hdI_path(s, id, pts, r0, r1, pw) {
    let L = 0; const seg = [], R = t => r0 + (r1 - r0) * Math.pow(t, pw || 1);
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
    let at = 0;
    for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i], t0 = at / L, t1 = (at + seg[i - 1]) / L;
        s.line(id, a[0], a[1], b[0], b[1], R(t0), R(t1));
        at += seg[i - 1];
    }
}
/* a smooth path through control points (Catmull-Rom), n points per span */
function hdI_spline(P, n) {
    const out = [];
    for (let i = 0; i < P.length - 1; i++) {
        const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
        for (let j = 0; j < n; j++) {
            const t = j / n, t2 = t * t, t3 = t2 * t;
            out.push([0, 1].map(k => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
        }
    }
    out.push(P[P.length - 1]);
    return out;
}
/* a little four-point sparkle: a white core and arms of length r that fade into the tint */
function hdI_glint(s, x, y, r, tint) {
    s.px(x, y, '#ffffff');
    for (let i = 1; i <= r; i++) { const c = i < r ? '#ffffff' : (tint || '#fff6dc'); s.px(x - i, y, c); s.px(x + i, y, c); s.px(x, y - i, c); s.px(x, y + i, c); }
}
/* a pixel's shade nudge, owned by the part that's there now: a part drawn later over it starts afresh instead of
   taking on the light of what it covers */
function hdI_md(s, i, d) { const o = s.hdIo; if (o) { const p = s.part[i]; if (o.m[i] !== p) { s.mods[i] = 0; o.m[i] = p; } } s.mods[i] += d; }
/* draw with that ownership kept for nudges and recolors (both are stored per pixel, not per part), then drop what a
   later part covered: an eye over a recolored fish, a pearl over the nacre, one cherry over the other */
function hdI_draw(s, fn) {
    const n = s.w * s.h, o = s.hdIo = { m: new Int16Array(n).fill(-1), a: new Int16Array(n).fill(-1) }, rc = HDSprite.prototype.recolor;
    s.mod = (x, y, d) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < s.w && y < s.h) hdI_md(s, y * s.w + x, d); };
    s.recolor = (x, y, mat) => { rc.call(s, x, y, mat); x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < s.w && y < s.h) o.a[y * s.w + x] = s.part[y * s.w + x]; };
    fn(s);
    for (let i = 0; i < n; i++) { if (o.m[i] !== s.part[i]) s.mods[i] = 0; if (s.alt && o.a[i] !== s.part[i]) s.alt[i] = -1; }
}
/* register a drawing under a frame name: 16x16 items anchored at (8, 13) today, so 48x48 at (24, 39) */
function hdI_reg(name, fn) { HD_SPR[name] = { w: 48, h: 48, ax: 24, ay: 39, draw(s) { hdI_draw(s, fn); } }; }

/* ---------------------------------------------------------------- fish */
/* the common fish (today's: a round body facing left, a dorsal fin, a forked tail on the right, the eye a white glint
   over black): the back in c, a band in b along the side, the belly in f, fins and tail in b; extras per kind */
const hdI_FISH = {
    mackerel: { b: '#3f6a8f', c: '#6f9fc2', f: '#dce9f2', stripe: '#223e5a' },
    seabream: { b: '#d9656f', c: '#f29aa0', f: '#ffe0e2' },
    seabass: { b: '#6f7a88', c: '#9aa4b0', f: '#e6eaf0' },
    yellowtail: { b: '#e8c43a', c: '#9ab8d8', f: '#eef4fa' },
    tuna: { b: '#2a3c5c', c: '#40587f', f: '#c8d4e6' },
    salmon: { b: '#f28a6b', c: '#c9a0a0', f: '#f2e4e0' },
    moonfish: { b: '#8f9ae8', c: '#c8d0ff', f: '#ffffff' },
    sunrise: { b: '#ff6a5a', c: '#ffb05a', f: '#ffe8a0' },
    trout: { b: '#7a8f68', c: '#a8b890', f: '#f2c8c8', spots: '#4e5e40' },
    ayu: { b: '#8f9f6a', c: '#b8c89a', f: '#f2f2dc', spot: '#f0cc48' },
    catfish: { b: '#5a4a3a', c: '#7a6a58', f: '#c8b8a0', whiskers: '#3a2a1a' },
    koi: { b: '#ff7a3a', c: '#ffffff', f: '#ffffff', koi: 1 },
    goldfish: { b: '#e06a1a', c: '#ff9a3a', f: '#ffd08a' },
};
const hdI_ramp = c => c === '#ffffff' ? hdI_WHITE : hdI_soft(c);
/* the body's outline (the top and the bottom at x): an oval head at the left, tapering behind the middle to the tail's
   root at x = 39, the belly a little fuller than the back */
const hdI_FTOP = x => x < 21 ? 25.5 - 12.6 * Math.sqrt(Math.max(0, 1 - Math.pow((21 - x) / 18, 2))) : 25.5 - 12.6 + 8 * Math.pow(Math.min(1, (x - 21) / 18), 1.6);
const hdI_FBOT = x => x < 19 ? 26 + 12.2 * Math.sqrt(Math.max(0, 1 - Math.pow((19 - x) / 16, 2))) : 26 + 12.2 - 7.4 * Math.pow(Math.min(1, (x - 19) / 20), 1.5);
function hdI_fish(s, o) {
    const B = hdI_ramp(o.b), C = hdI_ramp(o.c), F = hdI_ramp(o.f);
    /* the tail: a forked fin with its lobes reaching the frame's edge, rays fanning from the root */
    const tail = s.add(B, { layer: 1, flat: 1, grad: 0.28, bias: -0.02 });
    s.poly(tail, [[35, 20.5], [39, 16], [43, 11.5], [47.6, 9.6], [47.6, 16.5], [44.8, 21.5], [43.4, 26.5], [44.8, 31.5], [47.6, 36.5], [47.6, 43.6], [43, 41.5], [39, 37], [35, 31.5]]);
    for (const a of [-0.95, -0.5, 0.5, 0.95]) for (let r = 5; r < 11; r++) s.mod(38 + Math.cos(a) * r, 26.3 + Math.sin(a) * r * 1.55, -1);
    /* the dorsal fin, tucked behind the back */
    const fin = s.add(B, { layer: 1, flat: 1, grad: 0.3, bias: 0.04 });
    s.poly(fin, [[21, 15.5], [23.5, 11.5], [26.5, 9.2], [30, 8.8], [31.2, 10.5], [32, 16.5]]);
    for (let i = 0; i < 2; i++) for (let t = 0; t < 4; t++) s.mod(26 + i * 2.6 + t * 0.3, 11 + t, -1);
    /* the body: one rounded part, recolored by zone so the shading stays whole */
    const body = s.add(C, { layer: 2, flat: 1, grad: 0 });
    const top = [], bot = [];
    for (let x = 3; x <= 39.01; x += 1) { top.push([x, hdI_FTOP(x)]); bot.push([x, hdI_FBOT(x)]); }
    s.poly(body, top.concat(bot.reverse()));
    const V = (x, y) => { const t = hdI_FTOP(x + 0.5), b = hdI_FBOT(x + 0.5); return (y + 0.5 - t) / (b - t); };
    /* round across (top to belly), the head turning toward the light, the rear away from it */
    hdI_lit(s, body, (x, y) => { const v = Math.max(-1, Math.min(1, (V(x - 0.5, y - 0.5) - 0.5) * 2)); return [x < 13 ? -Math.pow((13 - x) / 10, 1.5) : x > 27 ? (x - 27) / 22 : 0, v, Math.sqrt(1 - v * v) * 1.6 + 0.05]; }, 0, [0.22, 0.73, 0.9]);
    const S = o.stripe && hdI_ramp(o.stripe);
    hdI_each(s, body, (x, y) => {
        const v = V(x, y);
        let z = v < 0.13 ? C : v < 0.5 ? B : F;
        if (z === F && (x < 6 || (x > 31 && v < 0.6))) z = C;
        if (o.koi) {
            /* koi: big orange patches over the back and the crown of the head, white between and below */
            const head = (x - 10) ** 2 / 26 + (v - 0.08) ** 2 / 0.04 < 1, back = x > 15.5 + Math.sin(y * 0.7) && x < 35 && v < 0.52 + Math.sin(x * 0.45) * 0.07;
            z = head || back ? B : C;
        }
        if (S && v < 0.5 && x > 9 && x < 37 && (x + Math.sin(y * 0.75) * 1.4 - v * 5 + 20) % 5 < 2.2) z = S;
        if (z !== C) s.recolor(x, y, z);
    });
    /* the lateral line: a lighter streak where the band meets the belly */
    for (let x = 14; x < 36; x++) { const t = hdI_FTOP(x + 0.5), b = hdI_FBOT(x + 0.5); s.mod(x, Math.floor(t + (b - t) * 0.47), 1); }
    /* the gill: a curved line behind the head */
    for (let y = 18; y <= 33; y++) s.mod(19.5 - Math.pow((y - 26) / 7.5, 2) * 3.2, y, -1);
    /* a pectoral fin on the side, pointing back */
    /* (see-through, so between the band and the belly in color) */
    const pec = s.add(o.koi ? C : hdI_soft(hdI_mix(hdRgb(o.b), hdRgb(o.f), 0.55)), { layer: 3, flat: 1, grad: 0.4, bias: 0.04 });
    hdI_leaf(s, pec, 19.5, 28.5, 26.5, 31.5, 2, 0.3, 0.5);
    for (let t = 0.35; t < 0.9; t += 0.27) s.mod(19.5 + 7 * t, 28.5 + 3 * t + 0.6, -1);
    /* the mouth: a small dark notch at the snout */
    for (const [x, y] of [[3, 27], [4, 27], [5, 27], [6, 28]]) s.mod(x, y, -2);
    if (o.spots) for (let i = 0; i < 9; i++) { const x = 15 + Math.floor(hdI_h(i, 1, 11) * 20), y = Math.floor(hdI_FTOP(x) + 2 + hdI_h(i, 2, 11) * 8); s.recolor(x, y, hdI_soft(o.spots)); if (i & 1) s.recolor(x + 1, y, hdI_soft(o.spots)); }
    if (o.spot) { const sp = hdI_soft(o.spot); for (let y = 20; y <= 24; y++) for (let x = 20; x <= 24; x++) if ((x - 22) ** 2 + (y - 22) ** 2 < 4.5) s.recolor(x, y, sp); }
    /* the eye: dark and round with a white glint at the top (today's white-over-black); the koi's is bigger */
    const big = o.koi ? 0.7 : 0, ex = 12.5, ey = 24;
    const eye = s.add(hdPal('#120c14', '#1a1418', '#2a2026', '#3c2e36', '#5a4652'), { layer: 5, R: 1, flat: 1, bias: -0.1 });
    s.ellipse(eye, ex, ey, 3 + big, 3.2 + big);
    for (const [dx, dy] of [[-2, -2], [-1, -2], [-2, -1], [-1, -1]]) s.px(ex + dx - big, ey + dy - big, '#ffffff');
    s.px(ex + 1, ey + 1, '#5a4a56');
    if (o.whiskers) {
        /* catfish: two dark barbels hanging from the mouth, as today's */
        const wk = s.add(hdI_soft(o.whiskers), { layer: 6, R: 1, k: 1.3 });
        hdI_path(s, wk, hdI_spline([[5.5, 28.5], [2.5, 30.5], [1, 34], [1.6, 37.5]], 5), 1.4, 0.8);
        hdI_path(s, wk, hdI_spline([[8, 30.5], [5.5, 33.5], [4.2, 37.5], [5, 40.5]], 5), 1.4, 0.8);
    }
    /* wet glints along the back */
    s.px(15, 16, '#ffffff'); s.px(16, 16, '#ffffff'); s.px(17, 15, '#ffffff'); s.px(18, 15, '#ffffff'); s.px(25, 15, '#fffaf0');
    hdI_glint(s, 9, 18, 1, '#e8f6ff');
}
for (const k in hdI_FISH) hdI_reg('fish_' + k, s => hdI_fish(s, hdI_FISH[k]));

/* ---------------------------------------------------------------- gems */
/* a brilliant cut seen from the side, as today's: a table on top, the crown sloping out to the girdle (the widest
   band), the pavilion down to a point. Every facet is a flat part with its own shade, lit from the top left; colors
   are today's (base, light, lighter table, mid and dark facets), a white sparkle on the crown */
const hdI_GEM = {
    quartz: ['#f8f6fb', '#fbfafd', '#f2eef8', '#bcb6c4', '#918a9a'],
    amethyst: ['#cfadee', '#e5d2f6', '#a86ae0', '#8454b2', '#68428c'],
    topaz: ['#ffd89b', '#ffeac9', '#ffb84a', '#c68e41', '#986c3a'],
    emerald: ['#95dfb6', '#c5edd7', '#3fc47a', '#369765', '#2e7354'],
    sapphire: ['#95b6ee', '#c5d7f6', '#3f7ae0', '#3660b2', '#2e4a8c'],
    ruby: ['#ee8d9b', '#f6c1c9', '#e0304a', '#ae2841', '#87223a'],
    diamond: ['#eaf9ff', '#f3fcff', '#d8f4ff', '#a8bbc9', '#828d9d'],
};
const hdI_dk = (hex, k) => hdRgb(hex).map(v => Math.round(v * k));
function hdI_gem(s, g) {
    const [lt, lt2, base, mid, dark] = g, out = hdI_dk(dark, 0.55);
    const crown = hdPal(out, mid, base, lt, lt2), pav = hdPal(out, dark, mid, base, lt);
    /* shade 1 shadow, 2 base, 3 light, 4 highlight (flat parts: the bias picks it) */
    const SH = [0, -0.25, 0.02, 0.16, 0.3];
    const facet = (ramp, sh, pts) => { const id = s.add(ramp, { layer: 1, flat: 1, grad: 0, bias: SH[sh] }); s.poly(id, pts); return id; };
    /* the pavilion: triangles from the girdle to the point, lit on the left with a bright reflection near the middle */
    const P = [0.4, 6, 12, 18, 24, 30, 36, 42, 47.6], tip = [24, 45], pshade = [3, 4, 2, 3, 2, 1, 2, 1];
    for (let i = 0; i < 8; i++) facet(pav, pshade[i], [[P[i], 20.5], [P[i + 1], 20.5], tip]);
    /* the girdle, lit on the left */
    facet(crown, 3, [[0.4, 17], [16, 17], [16, 20.6], [0.4, 20.6]]);
    facet(crown, 2, [[16, 17], [32, 17], [32, 20.6], [16, 20.6]]);
    facet(crown, 1, [[32, 17], [47.6, 17], [47.6, 20.6], [32, 20.6]]);
    /* the crown */
    facet(crown, 3, [[18, 5.4], [15, 9.4], [8, 17.2], [1.5, 17.2]]);
    facet(crown, 2, [[15, 9.4], [21, 9.4], [16, 17.2], [8, 17.2]]);
    facet(crown, 3, [[21, 9.4], [27, 9.4], [32, 17.2], [16, 17.2]]);
    facet(crown, 4, [[21, 9.4], [27, 9.4], [24, 16.5]]);
    facet(crown, 2, [[27, 9.4], [33, 9.4], [40, 17.2], [32, 17.2]]);
    facet(crown, 1, [[33, 9.4], [30, 5.4], [46.5, 17.2], [40, 17.2]]);
    /* the table: the lightest, seen nearly edge on */
    facet(crown, 4, [[18, 5.4], [30, 5.4], [33, 9.4], [15, 9.4]]);
    /* sparkles: a four-point star on the crown, a fleck on the table and one low on the pavilion */
    hdI_glint(s, 14, 12, 2, lt2);
    s.px(20, 6, '#ffffff'); s.px(21, 6, '#ffffff'); s.px(19, 7, '#ffffff');
    s.px(16, 26, '#ffffff'); s.px(17, 27, lt2);
}
for (const k in hdI_GEM) hdI_reg('gem_' + k, s => hdI_gem(s, hdI_GEM[k]));
/* the glint shown over a buried gem: a crisp four-point sparkle, long thin arms, a pale blue halo at the core */
HD_SPR.gem_glint = { w: 27, h: 27, ax: 12, ay: 12, draw(s) {
    const c = 13, A = '#ffffff', T = '#dff6ff', T2 = '#b0e2ff';
    /* the arms: three pixels wide near the core (today's are one old pixel), thinning to one, fading to blue at the tips */
    for (let i = -12; i <= 12; i++) {
        const d = Math.abs(i), col = d < 9 ? A : d < 11 ? T : T2;
        s.px(c + i, c, col); s.px(c, c + i, col);
        if (d > 0 && d <= 7) { const e = d <= 3 ? A : d <= 5 ? T : T2; s.px(c + i, c - 1, e); s.px(c + i, c + 1, e); s.px(c - 1, c + i, e); s.px(c + 1, c + i, e); }
    }
    /* a soft halo in the corners of the core, short diagonal rays */
    for (const [dx, dy] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) s.px(c + dx, c + dy, T);
    for (const [dx, dy] of [[-3, -3], [3, 3]]) s.px(c + dx, c + dy, T2);
} };

/* ---------------------------------------------------------------- shells */
/* the fan shells (clam, scallop): a fan opening upward from a small hinge tab at the bottom, ribs radiating from the
   hinge (each rib a ridge lit on its left, the grooves in today's darker color, which fills the fan near the hinge),
   a scalloped rim at the rib ends, faint growth lines, a glint */
function hdI_fan(s, light, rib, deep) {
    const L = hdI_soft(light), R = hdI_soft(rib), N = 9, hx = 24, hy = 46;
    const ph = (x, y) => (Math.PI - Math.atan2(hy - y, x - hx)) / Math.PI * N;      // 0..N across the fan, ribs at the halves
    const fan = s.add(L, hdI_LITP), pts = [];
    for (let i = 0; i <= 72; i++) {
        const a = Math.PI - i / 72 * Math.PI, ex = 24 + 23.5 * Math.cos(a), ey = 38.5 - 32 * Math.sin(a), p = ph(ex, ey);
        const bump = (deep ? 1.5 : 0.9) * (0.5 + 0.5 * Math.cos((p - 0.5) * Math.PI * 2)), d = Math.hypot(ex - 24, ey - 40) || 1;
        pts.push([ex + (ex - 24) / d * bump, ey + (ey - 40) / d * bump]);
    }
    s.poly(fan, pts.concat([[47.6, 39.5], [30.5, 39.5], [29.5, 46.6], [18.5, 46.6], [17.5, 39.5], [0.4, 39.5]]));
    hdI_lit(s, fan, (x, y) => {
        const rx = x - hx, ry = y - hy, rr = Math.hypot(rx, ry) || 1, p = ph(x, y), sl = -Math.sin((p - 0.5) * Math.PI * 2) * Math.min(1, rr / 14) * 0.55;
        const u = (x - 24) / 27, v = (y - 30) / 30, w = Math.sqrt(Math.max(0.05, 1 - u * u - v * v)) * 1.3;
        return [u + (-ry / rr) * sl, v + (rx / rr) * sl, w];
    }, 0.04);
    hdI_each(s, fan, (x, y) => {
        const rr = Math.hypot(x + 0.5 - hx, y + 0.5 - hy), p = ph(x + 0.5, y + 0.5), c = Math.cos(p * Math.PI * 2);
        if (rr < 13 || (c > 0.4 && rr < 40) || (y > 38 && Math.abs(x - 24) > 6)) s.recolor(x, y, R);
        if (Math.abs(((rr + 2) % 7) - 3.5) < 0.5 && rr > 14 && rr < 34) hdI_md(s, y * s.w + x, -1);
    });
    /* the hinge tab: a crease across it */
    for (let x = 19; x <= 29; x++) s.mod(x, 42, -1);
    hdI_glint(s, 13, 15, 2, '#fff6e0'); s.px(17, 12, '#ffffff'); s.px(18, 11, '#ffffff');
}
hdI_reg('shell_clam', s => hdI_fan(s, '#f2dcc0', '#c9a47a', 0));
hdI_reg('shell_scallop', s => hdI_fan(s, '#ffb08a', '#e0785a', 1));

/* the turban: today's squat rounded cone (a blunt cream tip, tan below with dark spiral bands), the whorls marked by
   seams that curve round the front (shadowed above each, lit below), small knobs along each whorl's shoulder */
function hdI_turban(s) {
    const id = s.add(hdI_soft('#b88a5a'), hdI_LITP);
    s.poly(id, [[19, 6.2], [29, 6.2], [32.5, 9], [34.5, 14], [37.5, 18.5], [40.5, 23], [42.4, 28], [42.4, 34], [40, 39], [35, 42.6], [29, 44.5], [19, 44.5], [13, 42.6], [8, 39], [5.6, 34], [5.6, 28], [7.5, 23], [10.5, 18.5], [13.5, 14], [15.5, 9]]);
    hdI_lit(s, id, hdI_egg(22, 24, 21, 24, 1.15), 0.06);
    /* the seams (rising a little to the right, as today's bands do) and what lies between them */
    const seam = (k, x) => [12.5, 19.5, 27.5][k] + 2.2 * (1 - Math.pow((x - 24) / 19, 2)) - (x - 24) * 0.12;
    const cream = hdI_soft('#f2dcc0'), tan = hdI_soft('#d9b38a'), E = hdI_soft('#8a6038');
    hdI_each(s, id, (x, y) => {
        const yc = y + 0.5, xc = x + 0.5;
        if (yc < seam(0, xc)) s.recolor(x, y, cream);
        else if (yc < seam(1, xc)) s.recolor(x, y, tan);
        else { const d = yc - seam(2, xc); if ((d > -4.6 && d < -2.6) || (d > 3.4 && d < 5.8) || (d > 11 && d < 12.6)) s.recolor(x, y, E); }
    });
    for (let k = 0; k < 3; k++) for (let x = 6; x < 43; x++) {
        const y = Math.floor(seam(k, x + 0.5));
        if (s.at(x, y) !== id || s.at(x, y - 1) !== id) continue;
        s.mod(x, y - 1, -1); s.mod(x, y, -1); s.mod(x, y + 1, 1);
        /* knobs: a lit bump every few pixels just under the seam */
        if ((x + k * 2) % 5 === 0) { s.mod(x, y + 2, 1); s.mod(x + 1, y + 3, -1); }
    }
    hdI_glint(s, 18, 10, 1, '#fff6e0'); s.px(12, 30, '#fff0dc'); s.px(13, 29, '#fff0dc');
}
hdI_reg('shell_turban', hdI_turban);

/* the cowrie: a glossy dome with brown speckles, the toothed slit across its underside, a big shine and a glint */
function hdI_cowrie(s) {
    const top = hdPal('#7a5a36', '#d8b884', '#f2d7a8', '#f8e4c0', '#fdf2dc'), spot = hdPal('#4a2a12', '#7e4e2a', '#a86c3e', '#b87a4a', '#c88c5c');
    const base = s.add(top, { layer: 1, flat: 1, grad: 0, bias: -0.05 });
    s.ellipse(base, 24, 26, 21.5, 15.5);
    hdI_lit(s, base, hdI_egg(24, 22, 22, 18, 1.7), 0.04);
    const dome = s.add(top, { layer: 2, flat: 1, grad: 0 });
    s.poly(dome, (() => { const p = []; for (let i = 0; i <= 40; i++) { const a = Math.PI + i / 40 * Math.PI; p.push([24 + 21.5 * Math.cos(a), 26 + 15.5 * Math.sin(a)]); } p.push([42, 27.5], [33, 28.4], [24, 28.8], [15, 28.4], [6, 27.5]); return p; })());
    hdI_lit(s, dome, hdI_egg(24, 28, 23, 20, 1.25), -0.06, [0.3, 0.72, 0.95]);
    /* speckles: small round dots, bigger toward the middle */
    for (let i = 0; i < 14; i++) {
        const x = 9 + hdI_h(i, 3, 5) * 30, y = 13 + hdI_h(i, 4, 5) * 12, r = 0.9 + hdI_h(i, 5, 5) * 0.9;
        for (let yy = Math.floor(y - r); yy <= y + r; yy++) for (let xx = Math.floor(x - r); xx <= x + r; xx++) if ((xx + 0.5 - x) ** 2 + (yy + 0.5 - y) ** 2 <= r * r && s.at(xx, yy) === dome && s.at(xx + 1, yy) === dome && s.at(xx, yy + 1) === dome) s.recolor(xx, yy, spot);
    }
    /* the slit: dark, with pale teeth across it */
    const sl = s.add(hdPal('#2e180c', '#4a2a16', '#6a3e22', '#7e4e2c', '#9a6440'), { layer: 3, flat: 1, bias: -0.1 });
    s.poly(sl, [[8.5, 28.2], [24, 29.5], [39.5, 28.2], [39.5, 30.2], [24, 31.5], [8.5, 30.2]]);
    /* fine ridges across the slit's lips */
    for (let x = 11; x < 38; x += 3) { s.mod(x, 31 + (Math.abs(x - 24) < 9 ? 1 : 0), -1); s.mod(x, 27 + (Math.abs(x - 24) < 9 ? 1 : 0), -1); }
    /* the shine: a curved streak of reflected light over the top left and a crisp glint at its end */
    for (let a = 3.5; a < 4.45; a += 0.04) s.px(24 + 16.5 * Math.cos(a), 26 + 11.5 * Math.sin(a), a > 3.7 && a < 4.3 ? '#ffffff' : '#fffaf0');
    hdI_glint(s, 19, 14, 2, '#fff8e8');
}
hdI_reg('shell_cowrie', hdI_cowrie);

/* the coral: a pink branching sprig (a trunk, two arms, a twig between), round tubes with little polyp pores */
function hdI_coral(s) {
    const id = s.add(hdPal('#8a2a3e', '#d8506a', '#ff7a8a', '#ffa8b4', '#ffd2d8'), { layer: 1, R: 3, k: 1.5, grad: 0.12 });
    hdI_path(s, id, [[26.6, 46.6], [26.6, 34], [26.2, 27]], 4.2, 3.6);
    hdI_path(s, id, hdI_spline([[25.5, 27], [19, 22], [14, 17], [10.4, 11], [10, 5.2]], 4), 3.6, 3.1);
    hdI_path(s, id, hdI_spline([[13, 16.5], [8, 13], [5.4, 9.6]], 4), 2.9, 2.6);
    hdI_path(s, id, hdI_spline([[27, 27], [32, 21], [36, 15], [39.4, 9], [39.8, 3.4]], 4), 3.6, 3.1);
    hdI_path(s, id, hdI_spline([[38, 11], [42, 8], [44.2, 6.2]], 4), 2.9, 2.5);
    hdI_path(s, id, [[25.6, 25], [25.6, 18], [25.2, 13.6]], 2.9, 2.6);
    /* polyp pores: tiny dimples with a lit rim, never on the outline */
    for (let i = 0; i < 26; i++) {
        const x = Math.round(4 + hdI_h(i, 1, 9) * 40), y = Math.round(3 + hdI_h(i, 2, 9) * 42);
        if (s.at(x, y) === id && s.at(x - 1, y) === id && s.at(x + 1, y) === id && s.at(x, y + 1) === id && s.at(x, y - 1) === id) { s.mod(x, y, -1); s.mod(x, y - 1, 1); }
    }
    s.px(23, 14, '#fff0f2'); s.px(8, 7, '#fff0f2'); s.px(37, 6, '#fff0f2');
}
hdI_reg('shell_coral', hdI_coral);

/* the conch: a peach spiral with its spire leaning up at the top left, a little horn of the lip at the top right, the
   glossy pink mouth filling the lower right (lit inside at the bottom right, as a hollow is), knobs on the shoulder */
function hdI_conch(s) {
    const body = hdI_soft('#f7c8b0'), lip = hdI_soft('#e8a07a');
    const wing = s.add(lip, { layer: 1, flat: 1, grad: 0.3, bias: 0.04 });
    s.poly(wing, [[30, 14.5], [32.6, 10.4], [35.8, 7.8], [38.4, 8.2], [38, 11.6], [36.8, 15.5], [36, 19], [31, 18]]);
    const spire = s.add(lip, { layer: 1, flat: 1, grad: 0 });
    s.poly(spire, [[9.5, 15.5], [11, 12.4], [14.5, 11], [15.6, 8.6], [18.4, 7.2], [19.6, 4.6], [22.2, 2.8], [24.2, 4.4], [24.8, 7.4], [26, 10.6], [27, 14.5]]);
    hdI_lit(s, spire, hdI_egg(19, 10, 10, 9, 1.1), 0.05);
    /* the whorls' seams across the spire, stepping up to the tip */
    for (const [y, x0, x1] of [[7.4, 18.5, 24.6], [11.2, 14.5, 25.8]]) for (let x = x0; x <= x1; x++) { s.mod(x, y + (x - x0) * 0.22, -1); s.mod(x, y + (x - x0) * 0.22 + 1, 1); }
    const sh = s.add(body, { layer: 2, flat: 1, grad: 0 });
    s.poly(sh, [[8.5, 15], [15.5, 12.4], [25, 12], [31.5, 13], [35.6, 16], [37, 22], [36.6, 32.5], [34, 37.6], [28.6, 40.2], [26.6, 44.4], [17, 44.6], [14.6, 41], [8.4, 37], [4.6, 30], [4.4, 22], [6, 17.5]]);
    hdI_lit(s, sh, hdI_egg(18, 23, 19, 22, 1.15), 0.06);
    /* the shoulder: a band of the darker peach with knobs (their shadowed side today's dark spots) */
    hdI_each(s, sh, (x, y) => { if (y < 15.8 + Math.abs(x - 20) * 0.04) s.recolor(x, y, lip); });
    for (const x of [9.5, 16, 22.5, 29]) { const y = 14.4; s.mod(x, y, 1); s.mod(x + 1, y, 1); s.mod(x + 1, y + 1.5, -1); s.mod(x + 2, y + 1.5, -1); s.mod(x + 2, y + 0.5, -1); }
    /* a faint growth line curving down the body */
    for (let y = 18; y < 40; y++) s.mod(11 + Math.pow((y - 29) / 10, 2) * 3, y, -1);
    const mouth = s.add(hdPal('#9a3a50', '#e0687e', '#ff9aa8', '#ffbcc4', '#ffe0e4'), { layer: 3, flat: 1, grad: 0 });
    s.poly(mouth, [[20, 20.6], [26, 18.6], [33, 18.6], [35.6, 22], [35.6, 32], [32.6, 37], [27.6, 39.6], [22, 39], [19.8, 33], [18.6, 26]]);
    hdI_lit(s, mouth, (x, y) => { const u = (x - 27.5) / 10, v = (y - 29) / 12, d = u * u + v * v; return d >= 1 ? [-u * 0.6, -v * 0.6, 0.5] : [-u * 0.7, -v * 0.7, Math.sqrt(1 - d)]; }, 0.04);
    /* the inner lip's edge, a shine inside, a glint on the shoulder */
    for (let y = 22; y < 38; y++) s.mod(20.5 + Math.pow((y - 30) / 8, 2) * 1.4, y, -1);
    hdI_glint(s, 30, 33, 1, '#ffeef0'); s.px(31, 23, '#ffffff'); s.px(32, 23, '#fff2f4');
    hdI_glint(s, 12, 21, 1, '#fff6ec');
}
hdI_reg('shell_conch', hdI_conch);

/* sea glass: a frosted green pebble of glass, its rim paler (frosted), brighter inside the far edge where the light
   comes through, a soft glint */
function hdI_seaglass(s) {
    const G = hdPal('#2e6a52', '#5fb48c', '#8fdcb0', '#b4ecc8', '#e2fff0');
    const id = s.add(G, hdI_LITP);
    s.poly(id, [[16, 9.4], [22, 9], [24.5, 12.4], [31, 12.6], [34.8, 15.5], [37.2, 21], [37.4, 28], [34, 33.4], [29, 37.6], [25.6, 40.6], [22.4, 40.6], [18, 36.6], [12.5, 31], [10, 26], [10, 20], [12, 15]]);
    hdI_lit(s, id, hdI_egg(23.5, 23.5, 15, 17, 1.6), 0.02);
    /* the light coming through: brighter just inside the lower right edge; frost speckles */
    hdI_each(s, id, (x, y) => {
        const i = y * s.w + x, inner = s.at(x + 2, y + 2) !== id && s.at(x + 1, y + 1) === id && x > 20 && y > 22;
        if (inner) hdI_md(s, i, 1);
        if (hdI_h(x >> 1, y >> 1, 21) > 0.9 && hdI_h(x, y, 22) > 0.4) hdI_md(s, i, 1);
    });
    hdI_glint(s, 18, 17, 2, '#e8fff4'); s.px(21, 15, '#ffffff'); s.px(22, 15, '#ffffff');
}
hdI_reg('shell_seaglass', hdI_seaglass);

/* the pearl: a lustrous white ball in an open oyster seen from a little above: the rough grey-lilac shell with an
   uneven, layered rim, the smooth lilac nacre inside with a sheen of pink and blue */
const hdI_oyster = (a, k) => 1 + k * (0.05 * Math.sin(3 * a + 1) + 0.035 * Math.sin(7 * a + 0.5) + 0.025 * Math.sin(12 * a + 2));
function hdI_pearl(s) {
    const outer = s.add(hdPal('#463c58', '#6e6082', '#8e7ea0', '#a898ba', '#c4b8d4'), { layer: 1, flat: 1, grad: 0 });
    const op = [], np = [];
    for (let i = 0; i < 96; i++) {
        const a = i / 96 * Math.PI * 2, r = hdI_oyster(a, 1), q = hdI_oyster(a, 0.6);
        op.push([24 + Math.cos(a) * 21.4 * r, 32.6 + Math.sin(a) * 8.8 * r]); np.push([24 + Math.cos(a) * 18.2 * q, 30.6 + Math.sin(a) * 6.2 * q]);
    }
    s.poly(outer, op);
    hdI_lit(s, outer, hdI_egg(24, 27, 24, 17, 1), 0.02);
    /* rough layers: uneven growth lines following the rim, pale flecks */
    hdI_each(s, outer, (x, y) => {
        const u = (x + 0.5 - 24) / 21.4, v = (y + 0.5 - 32.6) / 8.8, a = Math.atan2(v, u), r = Math.hypot(u, v) / hdI_oyster(a, 1), i = y * s.w + x;
        if (Math.abs(r - 0.9 - Math.sin(a * 5) * 0.02) < 0.035 || Math.abs(r - 0.78 - Math.sin(a * 4 + 1) * 0.03) < 0.035) hdI_md(s, i, -1);
        else if (hdI_h(x, y, 31) > 0.9) hdI_md(s, i, 1);
    });
    const nacre = s.add(hdPal('#6e6084', '#c0b2d2', '#e2d8ec', '#f2ecf8', '#fcfaff'), { layer: 2, flat: 1, grad: 0 });
    s.poly(nacre, np);
    /* a hollow: shaded at the top left, lit low on the right */
    hdI_lit(s, nacre, (x, y) => { const u = (x - 24) / 18.2, v = (y - 30.6) / 6.2, d = u * u + v * v; return [-u * 0.7, -v * 0.7, Math.sqrt(Math.max(0, 1 - d)) + 0.25]; }, 0.1);
    const blue = hdPal('#6e6084', '#c4c8e8', '#dde4f8', '#eef2ff', '#ffffff'), pink = hdPal('#6e6084', '#dcc0d8', '#f4dcec', '#fcecf6', '#ffffff');
    /* the nacre's rainbow sheen: soft bands of pink and blue across it */
    hdI_each(s, nacre, (x, y) => { const k = (x * 0.55 + y * 1.3 + Math.sin(x * 0.3) * 1.5) % 10; if (k < 3) s.recolor(x, y, pink); else if (k > 6.5) s.recolor(x, y, blue); });
    const pearl = s.add(hdPal('#6a6080', '#c8c4dc', '#f2eef6', '#fffaf2', '#ffffff'), { layer: 3, flat: 1, grad: 0, cast: 2 });
    s.ellipse(pearl, 24, 21.5, 9.8, 9.8);
    hdI_lit(s, pearl, hdI_egg(24, 21.5, 9.8, 9.8, 1), 0.02);
    /* a warm reflection low on the pearl, the glint up top */
    for (const [x, y] of [[26, 28], [27, 28], [28, 27], [25, 29]]) s.px(x, y, '#f6e6ee');
    hdI_glint(s, 20, 16, 2, '#fff8ec'); s.px(22, 15, '#ffffff');
}
hdI_reg('shell_pearl', hdI_pearl);

/* the starfish: five round-ended arms ridged along the middle, the middle paler, rows of little bumps, a sparkle */
function hdI_star(s) {
    const id = s.add(hdPal('#8a5a10', '#e0a828', '#ffd84a', '#ffe680', '#fff4bc'), { layer: 1, R: 5, k: 1.35, grad: 0.15 });
    const cx = 24, cy = 25.5, tips = [[24, 3.4], [3, 20], [45, 20], [13.2, 43.5], [34.8, 43.5]];
    s.ellipse(id, cx, cy, 10, 9.4);
    for (const [tx, ty] of tips) hdI_leaf(s, id, cx, cy, tx, ty, 6.6, 0.12, 0);
    hdI_each(s, id, (x, y) => { if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 < 26) s.recolor(x, y, hdPal('#8a5a10', '#f0c850', '#fff0a0', '#fff6c4', '#fffbe4')); });
    /* bumps along each arm's ridge */
    for (const [tx, ty] of tips) for (let t = 0.38; t < 0.9; t += 0.13) { const x = cx + (tx - cx) * t, y = cy + (ty - cy) * t; s.mod(x, y, 1); s.mod(x + 1, y + 1, -1); }
    hdI_glint(s, 39, 6, 3, '#fff6c0');
}
hdI_reg('shell_star', hdI_star);

/* the message in a bottle: aqua glass lying on its side (bright rims, a long highlight along the top), a rolled
   letter inside seen through the glass, the cork in the neck */
function hdI_bottle(s) {
    const G = hdPal('#2f6e60', '#6cbca4', '#9fe0c8', '#c4f0e0', '#f0fffa');
    const glass = s.add(G, hdI_LITP);
    s.poly(glass, [[13, 12.6], [33, 12.6], [37.5, 15], [39.5, 18.5], [42.2, 19.5], [42.2, 32.5], [39.5, 33.5], [37.5, 37.6], [33, 40.4], [13, 40.4], [8.5, 38.5], [6.4, 33.5], [6.4, 19.5], [8.5, 14.5]]);
    /* glass: the rims bright, the middle a little deeper (you see through to the ground) */
    hdI_lit(s, glass, (x, y) => { const v = (y - 26.5) / 14; return [x > 37 ? 0.4 : x < 10 ? -0.5 : 0, v < -0.7 ? -1 : v > 0.75 ? 0.2 : v * 0.5, v < -0.7 ? 0.8 : v > 0.75 ? 1.6 : 1.1]; }, 0.04);
    /* the letter: a cream roll with curled ends and a tan string, tinted by the glass */
    const paper = s.add(hdPal('#6e8a70', '#c8dcc4', '#e4f2dc', '#f2fbec', '#fbfff8'), { layer: 2, flat: 1, grad: 0.35, bias: 0.04 });
    s.poly(paper, [[15, 20.5], [32, 20.5], [33.4, 23], [33.4, 30], [32, 32.5], [15, 32.5], [13.6, 30], [13.6, 23]]);
    const str = s.add(hdPal('#5a4a30', '#9a8058', '#b8a074', '#ccb68c', '#ddcaa4'), { layer: 3, flat: 1, grad: 0.3 });
    s.rect(str, 22, 20.5, 3, 12);
    for (let y = 23; y <= 30; y++) { s.mod(15, y, -1); s.mod(32, y, -1); }
    s.mod(16, 26, -1); s.mod(31, 27, -1);
    /* the neck's lip and the cork */
    const cork = s.add(hdPal('#4a2e16', '#8a5e34', '#b8864f', '#cc9e68', '#e0bc8a'), { layer: 1, flat: 1, grad: 0.4 });
    s.poly(cork, [[42, 21.4], [46.6, 21.6], [47.6, 23], [47.6, 30], [46.6, 31.4], [42, 31.6]]);
    for (const [x, y] of [[44, 24], [45, 27], [44, 29], [46, 25]]) s.mod(x, y, -1);
    /* glass highlights over everything */
    for (let x = 12; x <= 34; x++) s.px(x, 15, x < 31 ? '#ffffff' : '#e4fff6');
    for (let x = 16; x <= 26; x++) s.px(x, 37, '#d8fff0');
    hdI_glint(s, 10, 19, 2, '#e4fff6');
}
hdI_reg('shell_bottle', hdI_bottle);

/* ---------------------------------------------------------------- fruit */
/* fallen fruit: the same colors as the fruit hanging on the HD trees (32p_hd_trees.js), at the size of today's icon */
const hdI_FRUIT = {
    apple: hdPal('#7a1420', '#b8202e', '#e0333f', '#ee5a5f', '#f7a0a4'),
    cherry: hdPal('#6e0e22', '#a81a32', '#d8283f', '#ea5262', '#f6a2ac'),
    coconut: hdPal('#2e1c10', '#553820', '#7a5230', '#94683f', '#af8a63'),
    lychee: hdPal('#741526', '#ab2236', '#d9364a', '#e8606e', '#f4a2aa'),
    mango: hdPal('#a0581a', '#e89a2a', '#ffc53a', '#ffd768', '#ffeaa8'),
    peach: hdPal('#a8503e', '#e8826a', '#ffa98a', '#ffc0a6', '#ffdccc'),
};
const hdI_LEAFLET = hdPal('#2c5a2a', '#3f8a48', '#53a855', '#6cc563', '#9be083');
const hdI_STEM = hdPal('#3a2618', '#5a3c24', '#7a5234', '#9a6b45', '#b8845a');
/* a round body (narrower toward the bottom by pinch, a dimple at the top by dip), lit as a ball */
function hdI_ball(s, mat, cx, cy, rx, ry, o) {
    o = o || {};
    const id = s.add(mat, Object.assign({ layer: 2 }, hdI_LITP)), pts = [], pinch = o.pinch || 0, top = o.top || 0, dip = o.dip || 0;
    for (let i = 0; i < 60; i++) {
        const a = i / 60 * Math.PI * 2, sn = Math.sin(a), c = Math.cos(a);
        let x = cx + rx * c * (1 - pinch * Math.max(0, sn) - top * Math.max(0, -sn)), y = cy + ry * sn;
        if (sn < 0) y += dip * Math.exp(-Math.pow(c / 0.22, 2)) * -sn;
        pts.push([x, y]);
    }
    s.poly(id, pts);
    hdI_lit(s, id, hdI_egg(cx, cy + 1, rx * 1.05, ry * 1.08, o.flat || 1.05), o.bias || 0);
    return id;
}
/* a stem from (x0, y0) up to (x1, y1) and a leaf out to the right */
function hdI_stemleaf(s, x0, y0, x1, y1, leaf) {
    const st = s.add(hdI_STEM, { layer: 4, R: 1, k: 1.4, grad: 0.1 });
    hdI_path(s, st, [[x0, y0], [(x0 + x1) / 2 - 0.3, (y0 + y1) / 2], [x1, y1]], 1.4, 1.1);
    if (leaf) {
        const lf = s.add(hdI_LEAFLET, { layer: 5, R: 2, k: 1.4, grad: 0.15 });
        hdI_leaf(s, lf, leaf[0], leaf[1], leaf[2], leaf[3], leaf[4], 0.42, leaf[5] || 0);
        /* the midrib */
        for (let t = 0.15; t < 0.85; t += 0.08) s.mod(leaf[0] + (leaf[2] - leaf[0]) * t, leaf[1] + (leaf[3] - leaf[1]) * t + 0.5, -1);
    }
}
function hdI_apple(s) {
    const id = hdI_ball(s, hdI_FRUIT.apple, 24, 29, 21, 16.6, { pinch: 0.1, dip: 2.6 });
    /* a few pale flecks */
    for (const [x, y] of [[30, 22], [35, 27], [28, 33], [20, 36]]) s.px(x, y, '#ee6a72');
    hdI_stemleaf(s, 24.5, 16, 25.5, 6.5, [26.5, 10, 36.5, 5.5, 3.3, -0.6]);
    hdI_glint(s, 13, 20, 1, '#ffd0d4'); s.px(15, 18, '#ffe4e6'); s.px(16, 18, '#ffd0d4');
}
hdI_reg('fruit_apple', hdI_apple);
function hdI_peach(s) {
    const id = hdI_ball(s, hdI_FRUIT.peach, 24, 28, 20.4, 17.6, { pinch: 0.08, dip: 2 });
    /* the blush low on the right, and the crease down the middle (shadowed with its left lip lit) */
    const blush = hdPal('#9a3a30', '#d8604e', '#f2826b', '#f8a08a', '#ffc4b4');
    hdI_each(s, id, (x, y) => { const d = Math.hypot(x - 33, y - 36); if (d < 12 + hdI_h(x >> 1, y >> 1, 6) * 2) s.recolor(x, y, blush); });
    for (let y = 13; y < 33; y++) { const x = 24.5 + (y - 13) * 0.08 + Math.sin((y - 13) / 20 * Math.PI) * 1.6; s.mod(x, y, -1); s.mod(x + 1, y, -1); s.mod(x - 1, y, 1); }
    /* the fuzz: a soft light speckle on the lit side */
    hdI_each(s, id, (x, y) => { if (x < 22 && y < 28 && hdI_h(x, y, 8) > 0.92) s.mod(x, y, 1); });
    hdI_stemleaf(s, 25, 14, 25.6, 4.5, [27, 8.5, 36.5, 5, 3.2, -0.5]);
    hdI_glint(s, 13, 19, 1, '#fff0e8'); s.px(15, 17, '#ffece2');
}
hdI_reg('fruit_peach', hdI_peach);
function hdI_lychee(s) {
    const M = hdI_FRUIT.lychee, id = hdI_ball(s, M, 24, 27, 19.6, 18.4, { dip: 1.2 });
    /* the bumpy skin: little domes on a staggered grid, each lit on its upper left, notches in the outline between them */
    hdI_each(s, id, (x, y) => {
        const row = Math.floor(y / 4), ox = (row & 1) * 2, cxp = Math.floor((x - ox) / 4) * 4 + ox + 2, cyp = row * 4 + 2, dx = x + 0.5 - cxp, dy = y + 0.5 - cyp;
        const i = y * s.w + x;
        if (dx + dy < -1.6) hdI_md(s, i, 1); else if (dx + dy > 1.6) hdI_md(s, i, -1);
    });
    for (let a = 0; a < Math.PI * 2; a += Math.PI * 2 / 26) { const x = 24 + Math.cos(a) * 19.4, y = 27 + Math.sin(a) * 18.2; if (s.at(Math.round(x), Math.round(y)) === id) s.erase(x, y); }
    for (let i = 0; i < 9; i++) { const x = 10 + hdI_h(i, 1, 7) * 26, y = 15 + hdI_h(i, 2, 7) * 22; if (s.at(Math.round(x), Math.round(y)) === id) s.px(x, y, '#ff8a98'); }
    hdI_stemleaf(s, 24.5, 10.5, 25.2, 5);
    hdI_glint(s, 14, 17, 1, '#ffc8d0');
}
hdI_reg('fruit_lychee', hdI_lychee);
function hdI_coconut(s) {
    const id = hdI_ball(s, hdI_FRUIT.coconut, 24, 26.5, 19.4, 18, { bias: 0.04 });
    /* the husk: fibers running from top to bottom round the ball */
    hdI_each(s, id, (x, y) => { const u = (x + 0.5 - 24) / 19.4, v = (y + 0.5 - 26.5) / 18, w = Math.asin(Math.max(-1, Math.min(1, u / Math.sqrt(Math.max(0.05, 1 - v * v))))), col = Math.floor((w + 2) * 11); const f = hdI_h(col, Math.floor((y + hdI_h(col, 0, 3) * 7) / 7), 12); if (f < 0.16) s.mod(x, y, -1); else if (f > 0.93) s.mod(x, y, 1); });
    /* the three eyes: dark dents with a lit lower rim */
    const eye = s.add(hdPal('#1c100a', '#2a1810', '#3a2416', '#4a301e', '#5a3c26'), { layer: 3, flat: 1, bias: -0.1 });
    for (const [x, y] of [[19.5, 28.5], [28.5, 28.5], [24, 34.5]]) { s.ellipse(eye, x, y, 2.3, 1.9); s.mod(x - 1, y + 2.4, 1); s.mod(x, y + 2.4, 1); s.mod(x + 1, y + 2.4, 1); }
    hdI_glint(s, 15, 15, 1, '#d8b48c'); s.px(17, 13, '#c9a582');
}
hdI_reg('fruit_coconut', hdI_coconut);
function hdI_mango(s) {
    const id = hdI_ball(s, hdI_FRUIT.mango, 24.5, 28, 16.8, 18.6, { dip: 1, top: 0.2 });
    /* the orange blush over the lower right, as today's */
    const blush = hdPal('#7a3012', '#c8502a', '#ec7a3a', '#f7964e', '#ffc08a');
    hdI_each(s, id, (x, y) => { if (Math.hypot(x - 40, y - 44) < 23 + Math.sin(x * 0.5) * 0.8) s.recolor(x, y, blush); });
    /* a few faint freckles */
    for (let i = 0; i < 8; i++) { const x = 12 + hdI_h(i, 1, 13) * 24, y = 16 + hdI_h(i, 2, 13) * 24; if (s.at(Math.round(x), Math.round(y)) === id) s.mod(x, y, -1); }
    /* the stem with two small leaves, as today's green tuft */
    const lf = s.add(hdI_LEAFLET, { layer: 5, R: 2, k: 1.4, grad: 0.15 });
    hdI_leaf(s, lf, 24, 11.5, 17.5, 4.5, 2.8, 0.45, 0.6);
    hdI_leaf(s, lf, 24.5, 11.5, 30.5, 4, 2.8, 0.45, -0.6);
    const st = s.add(hdI_STEM, { layer: 6, R: 1, k: 1.4 }); s.line(st, 24.2, 12.5, 24.2, 9, 1.2);
    hdI_glint(s, 14, 18, 1, '#fff4cc'); s.px(16, 16, '#fff8dc'); s.px(17, 16, '#fff4cc');
}
hdI_reg('fruit_mango', hdI_mango);
/* cherries: a pair on stems that meet under a leaf, the left one a little bigger and lower, as today's */
function hdI_cherry(s) {
    const M = hdI_FRUIT.cherry;
    const st = s.add(hdPal('#2a3410', '#46581e', '#5a7a2a', '#6e9036', '#86a848'), { layer: 1, R: 1, k: 1.4, grad: 0.1 });
    hdI_path(s, st, hdI_spline([[25, 7], [21, 15], [16.5, 24.5]], 4), 1.2, 1.1);
    hdI_path(s, st, hdI_spline([[25, 7], [28.5, 15], [31, 23.5]], 4), 1.2, 1.1);
    const b = s.add(M, Object.assign({ layer: 2 }, hdI_LITP)); s.ellipse(b, 31, 32.5, 10, 9.6); hdI_lit(s, b, hdI_egg(31, 33, 10.5, 10.4, 1), -0.02);
    const a = s.add(M, Object.assign({ layer: 3 }, hdI_LITP)); s.ellipse(a, 15.5, 35, 11.2, 10.6); hdI_lit(s, a, hdI_egg(15.5, 35.5, 11.6, 11.4, 1));
    /* the dimples where the stems go in */
    s.mod(16, 25.5, -1); s.mod(17, 25.5, -1); s.mod(31, 23.6, -1);
    const lf = s.add(hdI_LEAFLET, { layer: 4, R: 2, k: 1.4, grad: 0.15 });
    hdI_leaf(s, lf, 24, 5.5, 35, 3.6, 3.6, 0.42, -0.4);
    for (let t = 0.15; t < 0.85; t += 0.1) s.mod(24 + 11 * t, 5.5 - 1.9 * t + 0.4, -1);
    hdI_glint(s, 10, 30, 1, '#ffd0d6'); s.px(12, 28, '#ffe0e4'); s.px(26, 28, '#ffd0d6'); s.px(27, 27, '#ffe0e4');
}
hdI_reg('fruit_cherry', hdI_cherry);

/* ---------------------------------------------------------------- vegetables (crops ready to pick, and picked) */
const hdI_GREEN = hdPal('#244a20', '#3a7a34', '#4f9a3f', '#6cbc56', '#9ad880');
const hdI_LGREEN = hdPal('#2e5a24', '#4a9038', '#5aa844', '#7acc5e', '#a8e48a');
/* bok choy: three broad leaves fanned over each other (the front left one lit), white midribs running down into a
   bundle of pale stalks */
function hdI_bokchoy(s) {
    const stalk = hdPal('#7a8a60', '#cfdcb4', '#f2f2dc', '#fafaee', '#ffffff'), rib = hdPal('#6a7a50', '#c0d4a0', '#d8e8c0', '#e8f2d6', '#f6fbec');
    const st = s.add(stalk, { layer: 4, flat: 1, grad: 0 });
    s.poly(st, [[16.5, 26], [31.5, 26], [30.4, 40], [29, 43.6], [19, 43.6], [17.6, 40]]);
    hdI_lit(s, st, hdI_tube([[24, 20], [24, 44]], 8.5), 0.08);
    for (const x of [20.5, 24.5, 28]) for (let y = 27; y < 43; y++) s.recolor(x + (y - 27) * (24 - x) * 0.012, y, rib);
    const leaf = (mat, layer, cx, cy, rx, ry, tilt, bias) => {
        const id = s.add(mat, { layer, flat: 1, grad: 0 }), pts = [];
        for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2, w = 1 + Math.sin(i * 1.9) * 0.025, x = Math.cos(a) * rx * w, y = Math.sin(a) * ry * w; pts.push([cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt)]); }
        s.poly(id, pts);
        hdI_lit(s, id, hdI_egg(cx - 1, cy - 1, rx + 3, ry + 3, 1.3), bias);
        /* the white midrib up the middle, side veins off it */
        for (let t = 0; t < 1; t += 0.04) { const yy = cy + ry * 0.95 - t * ry * 1.5, xx = cx - Math.sin(tilt) * (yy - cy); s.recolor(xx, yy, rib); if (t < 0.6) s.recolor(xx + 0.6, yy, rib); }
        for (let k = 0; k < 4; k++) for (let j = 1; j < 6; j++) { const yy = cy + ry * 0.5 - k * ry * 0.38, xx = cx - Math.sin(tilt) * (yy - cy); s.mod(xx - j, yy - j * 0.6, -1); s.mod(xx + j + 1, yy - j * 0.6, -1); }
        return id;
    };
    leaf(hdI_LGREEN, 1, 24, 13.5, 10, 12.5, 0, -0.04);
    leaf(hdI_LGREEN, 2, 33, 16.5, 9.4, 12.4, 0.22, -0.02);
    leaf(hdPal('#2e5a24', '#5aa844', '#7acc5e', '#98dc78', '#c4f0a4'), 3, 15, 16.5, 9.6, 12.4, -0.22, 0.04);
    hdI_glint(s, 10, 10, 1, '#e8ffd8');
}
hdI_reg('veg_bokchoy', hdI_bokchoy);
/* a chili: a glossy red crescent, thick at the green cap on the left, curling up to its tip on the right */
function hdI_chili(s) {
    const path = hdI_spline([[12, 19.6], [19, 22.6], [28, 22.6], [36, 19.6], [41.2, 15], [43.6, 11.6]], 6);
    const id = s.add(hdPal('#6e1410', '#b42418', '#e2382b', '#f2604c', '#ff9a80'), Object.assign({ layer: 1 }, hdI_LITP));
    hdI_path(s, id, path, 6.8, 1.8, 2.2);
    hdI_lit(s, id, hdI_tube(path, 6.8, 1.8, 2.2), 0.04);
    /* a long shine along the top */
    for (let i = 3; i < path.length - 7; i++) { const [x, y] = path[i], r = 6.8 + (1.8 - 6.8) * Math.pow(i / (path.length - 1), 2.2); s.px(x - 1, y - r * 0.55, i % 7 === 3 ? '#fff4ee' : '#ffb8a4'); }
    const cap = s.add(hdI_LGREEN, { layer: 2, flat: 1, grad: 0 });
    /* the cap hugs the thick end: sepals reaching down over the red */
    s.poly(cap, [[5.6, 15.6], [7.4, 12], [11, 10.6], [15, 12], [17.6, 15.4], [17.4, 19.4], [15.4, 17.6], [13.6, 21], [11.4, 18.2], [9, 21.4], [7.8, 18.6], [5.4, 19.6]]);
    hdI_lit(s, cap, hdI_egg(11, 14, 7.5, 6.5, 1.1), 0.04);
    const st = s.add(hdI_LGREEN, { layer: 3, R: 1, k: 1.4 }); hdI_path(s, st, hdI_spline([[10, 12], [8, 9], [7.4, 6.6], [8.2, 5.2]], 3), 1.5, 1.1);
    hdI_glint(s, 17, 17, 1, '#ffe0d8');
}
hdI_reg('veg_chili', hdI_chili);
/* a cucumber lying on the diagonal: a dark green tube with faint lighter stripes and little pale bumps */
function hdI_cucumber(s) {
    const path = [[8.6, 38.6], [40, 7.6]];
    const id = s.add(hdPal('#1e4418', '#356e2c', '#4f9a3f', '#6cb858', '#9ad882'), Object.assign({ layer: 1 }, hdI_LITP));
    hdI_path(s, id, path, 7.6, 7.6);
    hdI_lit(s, id, hdI_tube(path, 7.6), 0.04);
    hdI_each(s, id, (x, y) => { const d = ((x + 0.5 - 8.6) * 0.707 + (y + 0.5 - 38.6) * 0.707); if (Math.abs(d % 4.5) < 0.7 && hdI_h(x + y, y >> 3, 3) > 0.3) s.mod(x, y, 1); });
    const B = hdPal('#356e2c', '#6cb858', '#8fd08a', '#b0e4a8', '#d8f6d0');
    for (let i = 0; i < 9; i++) { const t = 0.08 + i * 0.105, side = (i % 3) - 1, x = 8.6 + 31.4 * t + side * 3.2, y = 38.6 - 31 * t + side * 3.2; s.recolor(x, y, B); s.recolor(x + 1, y, B); s.mod(x + 1, y + 1, -1); }
    /* the stem end, a small pale scar */
    s.px(41, 7, '#c8e8a0'); s.px(42, 6, '#a8d080');
    hdI_glint(s, 14, 29, 1, '#e8ffe0'); s.px(18, 25, '#d0f4c4'); s.px(22, 21, '#d0f4c4');
}
hdI_reg('veg_cucumber', hdI_cucumber);
/* a carrot: an orange cone from its shoulder to the tip at the lower right, rings across it, leafy fronds on top */
function hdI_carrot(s) {
    const path = [[14.6, 15.6], [24, 30], [34.6, 45.4]];
    const id = s.add(hdPal('#7a3a0a', '#d06a18', '#f28a2a', '#f8a850', '#ffd090'), Object.assign({ layer: 2 }, hdI_LITP));
    hdI_path(s, id, path, 8.6, 1.2);
    hdI_lit(s, id, hdI_tube(path, 8.6, 1.2), 0.06);
    /* the rings: short grooves across the cone, a lit lip under each */
    for (const [t, w] of [[0.18, 5], [0.32, 4], [0.47, 3.5], [0.62, 2.5], [0.76, 1.5]]) {
        const cx = 14.6 + 20 * t, cy = 15.6 + 29.8 * t, ox = (hdI_h(t * 100, 1, 2) - 0.5) * 3;
        for (let k = -w; k <= w; k++) { s.mod(cx + ox + k * 0.83, cy - k * 0.56, -1); s.mod(cx + ox + k * 0.83, cy - k * 0.56 + 1, 1); }
    }
    const fr = (x0, y0, x1, y1, mat, layer) => {
        const id2 = s.add(mat, { layer, R: 1.5, k: 1.4, grad: 0.15 });
        hdI_path(s, id2, [[x0, y0], [x1, y1]], 1.3, 1);
        /* little leaflets along the frond */
        for (let t = 0.35; t <= 1; t += 0.22) { const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; s.ellipse(id2, x - 1.6, y, 2, 1.3); s.ellipse(id2, x + 1.6, y + 0.4, 2, 1.3); }
    };
    fr(12.5, 12, 6.5, 2, hdI_LGREEN, 1);
    fr(17, 11.5, 19.5, 1.5, hdI_LGREEN, 1);
    fr(14.5, 12, 12.5, 4, hdPal('#2e5a24', '#5aa844', '#7acc5e', '#98dc78', '#c4f0a4'), 3);
    hdI_glint(s, 12, 18, 1, '#fff0d8');
}
hdI_reg('veg_carrot', hdI_carrot);
/* broccoli: a crown of rounded florets (each its own clump, the back ones darker where the front ones overlap), tiny
   buds over them, on a pale stalk */
function hdI_broccoli(s) {
    const D = hdPal('#1e4a1c', '#2e7230', '#3f8f3a', '#5aae4c', '#86cc6c');
    const st = s.add(hdPal('#4a6a30', '#7aae5a', '#9cd07a', '#b8e098', '#d8f2bc'), { layer: 0, flat: 1, grad: 0 });
    s.poly(st, [[18.5, 24], [29.5, 24], [29, 41], [28, 43.6], [20, 43.6], [19, 41]]);
    s.line(st, 21, 27, 14, 22, 2); s.line(st, 27, 27, 34, 22, 2);
    hdI_lit(s, st, hdI_tube([[24, 18], [24, 44]], 6), 0.06);
    const F = [[10.5, 21, 6.6, 1], [37.5, 21, 6.6, 1], [17, 9.5, 7.4, 2], [31, 9.5, 7.4, 2], [13.5, 17, 8.4, 3], [34.5, 17, 8.4, 3], [24, 13.5, 10, 4]];
    for (const [cx, cy, r, layer] of F) {
        const id = s.add(D, { layer, flat: 1, grad: 0 });
        s.ellipse(id, cx, cy, r, r * 0.92);
        hdI_lit(s, id, hdI_egg(cx - 1, cy - 1, r + 1.5, r + 1.5, 1.1), 0.02);
        /* the buds: little domes on a staggered grid, lit on their upper left */
        hdI_each(s, id, (x, y) => { const row = Math.floor(y / 3), ox = (row & 1) * 1.5, dx = ((x - ox) % 3 + 3) % 3 - 1, dy = y % 3 - 1; const i = y * s.w + x; if (dx + dy < -1) hdI_md(s, i, 1); else if (dx + dy > 1) hdI_md(s, i, -1); });
    }
    hdI_glint(s, 19, 6, 1, '#d8f6c0');
}
hdI_reg('veg_broccoli', hdI_broccoli);
/* an eggplant: a glossy purple body, narrower at the top, under a green cap of pointed sepals on a curved stem */
function hdI_eggplant(s) {
    const P = hdPal('#2a1238', '#4e2868', '#6a3a8a', '#8a5aaa', '#b88ad6');
    const id = hdI_ball(s, P, 24, 29.6, 16.6, 14, { top: 0.24 });
    /* the long shine on the upper left */
    for (let y = 19; y < 30; y++) { const x = 13.4 - (y - 19) * 0.22 + Math.pow((y - 24) / 6, 2) * 1.2; s.px(x, y, y === 21 || y === 22 ? '#ffffff' : '#c8a8e0'); if (y > 20 && y < 27) s.px(x + 1, y, '#a888c4'); }
    const cap = s.add(hdI_GREEN, { layer: 3, flat: 1, grad: 0 });
    s.poly(cap, [[15, 13.5], [18.5, 9.6], [24, 8.6], [29.5, 9.6], [33, 13.5], [36.5, 18], [31.5, 16.6], [29.5, 21], [26.6, 16.8], [24, 20.4], [21.4, 16.8], [18.5, 21], [16.5, 16.6], [11.6, 18]]);
    hdI_lit(s, cap, hdI_egg(23, 11, 13, 9, 1.1), 0.04);
    const st = s.add(hdI_GREEN, { layer: 4, R: 1, k: 1.4, grad: 0.1 }); hdI_path(s, st, hdI_spline([[24, 10], [24.4, 5], [26, 1.4]], 3), 2, 1.5);
    hdI_glint(s, 31, 13, 1, '#e0ffd0');
}
hdI_reg('veg_eggplant', hdI_eggplant);
/* thai basil: a purple stem with pairs of dark green leaves held out to each side (purple veins), a small bud on top */
function hdI_thaibasil(s) {
    const V = hdI_soft('#7a4a8a'), G = hdI_GREEN;
    const st = s.add(hdPal('#341c40', '#5a3468', '#7a4a8a', '#9a6aaa', '#bc90cc'), { layer: 1, R: 1.4, k: 1.4, grad: 0.1 });
    s.line(st, 25.5, 8, 25.5, 46.5, 1.6, 1.3);
    const lf = (x0, y0, x1, y1, bend, layer, w) => {
        const id = s.add(G, { layer, flat: 1, grad: 0 });
        hdI_leaf(s, id, x0, y0, x1, y1, w || 5, 0.5, bend);
        const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
        hdI_lit(s, id, (x, y) => [(x - mx) * 0.03, (y - my - bend * 0.5) / 5.5, 1], 0.06);
        /* the midrib: purple near the stem, a fine groove beyond */
        for (let t = 0.05; t < 0.85; t += 0.04) { const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + bend * Math.sin(t * Math.PI) * (x1 > x0 ? 1 : -1) * 0.7; if (t < 0.35) s.recolor(x, y, V); else s.mod(x, y, -1); }
    };
    lf(24.5, 15.5, 6.5, 13.5, -1.2, 2); lf(26.5, 18, 43, 16.5, 1.2, 2);
    lf(24.5, 27.5, 6.5, 25.5, -1.2, 2); lf(26.5, 30, 43, 28.5, 1.2, 2);
    /* the bud: two small leaves cupped round the tip */
    lf(25, 9, 19.5, 2.5, -0.8, 3, 3.4); lf(26, 9, 31.5, 2.5, 0.8, 3, 3.4);
    const tip = s.add(hdPal('#244a20', '#4f9a3f', '#6cbc56', '#8ad470', '#b8ec98'), { layer: 4, R: 1.5, k: 1.4 }); s.ellipse(tip, 25.5, 5, 2.2, 3.4);
    hdI_glint(s, 11, 12, 1, '#e0ffd0');
}
hdI_reg('veg_thaibasil', hdI_thaibasil);
/* green onions: three stalks side by side, green tops turning pale then white at the bulbs, wisps of root */
function hdI_greenonion(s) {
    const W = hdPal('#7a7a60', '#d6d6bc', '#f2f2dc', '#fafaee', '#ffffff'), Pale = hdPal('#4a6a30', '#9cc078', '#c4e0a0', '#dcefc0', '#f0fadf');
    [[19.5, 4, 2], [31.5, 4.5, 2], [25.5, 3.5, 3]].forEach(([x, top, layer], k) => {
        const id = s.add(k === 0 ? hdI_LGREEN : hdPal('#2e5a24', '#4a9038', '#5aa844', '#76c45a', '#a0dc84'), { layer, flat: 1, grad: 0 });
        s.line(id, x, top + 2, x, 41.5, 2.4);
        hdI_lit(s, id, hdI_tube([[x, top], [x, 44]], 2.6), 0.06);
        hdI_each(s, id, (px, py) => { if (Math.abs(px + 0.5 - x) < 3) { if (py >= 31) s.recolor(px, py, W); else if (py >= 28) s.recolor(px, py, Pale); } });
        for (let y = top + 6; y < 27; y += 7) s.mod(x + 0.5, y, 1);
        /* the roots */
        const r = s.add(hdPal('#6a5a40', '#a89878', '#c8b896', '#dccdb0', '#eee2ca'), { layer: 0, R: 1, k: 1.2 });
        s.line(r, x - 1, 43, x - 2.4, 46.4, 0.6); s.line(r, x + 0.5, 43, x + 0.8, 47, 0.6); s.line(r, x + 1.5, 43, x + 3, 46, 0.6);
    });
    hdI_glint(s, 18, 8, 1, '#e8ffd8');
}
hdI_reg('veg_greenonion', hdI_greenonion);
/* a tomato: a round glossy red body, faint lobes from the top, a green star of sepals and a short stem */
function hdI_tomato(s) {
    const id = hdI_ball(s, hdPal('#701410', '#b8281e', '#e8403a', '#f4685c', '#ffa898'), 24, 29, 20.4, 14.4, { dip: 2 });
    for (const k of [-1, 1]) for (let y = 17; y < 25; y++) s.mod(24 + k * (3.5 + (y - 17) * 0.7), y, -1);
    const cap = s.add(hdI_GREEN, { layer: 3, flat: 1, grad: 0 });
    for (const [x1, y1] of [[13, 16.5], [18.5, 20.6], [29.5, 20.6], [35, 16.5], [24, 11.5]]) hdI_leaf(s, cap, 24, 15.4, x1, y1, 2.2, 0.35, 0);
    hdI_lit(s, cap, hdI_egg(23, 14, 10, 6, 1.2), 0.04);
    const st = s.add(hdI_GREEN, { layer: 4, R: 1, k: 1.4 }); hdI_path(s, st, [[24.4, 15], [24.8, 10], [26, 7]], 1.5, 1.2);
    hdI_glint(s, 12, 21, 2, '#ffd8d0'); s.px(15, 19, '#ffe4de'); s.px(16, 19, '#ffd0c8');
}
hdI_reg('veg_tomato', hdI_tomato);
/* edamame: a fuzzy green pod on the diagonal, bulging over its three beans, a little stem at the top end */
function hdI_edamame(s) {
    const id = s.add(hdPal('#2e5a24', '#4e9c3e', '#7acc5e', '#9ade7c', '#c4f0a6'), Object.assign({ layer: 1 }, hdI_LITP));
    const path = [[7.5, 38.5], [38.5, 6.5]];
    hdI_path(s, id, path, 4.6, 4.6);
    const B = [[14.6, 31.6], [24.4, 22.2], [34, 12.6]];
    for (const [x, y] of B) s.ellipse(id, x, y, 7.2, 7.2);
    hdI_lit(s, id, (x, y) => { let best = 1e9, n = [0, 0, 1]; for (const [bx, by] of B) { const d = Math.hypot(x - bx, y - by); if (d < best) { best = d; n = hdI_egg(bx, by, 8.2, 8.2, 1.1)(x, y); } } const t = hdI_tube(path, 6.4)(x, y); return [n[0] * 0.6 + t[0] * 0.4, n[1] * 0.6 + t[1] * 0.4, n[2] * 0.6 + t[2] * 0.4]; }, 0.06);
    /* the seam along the lower edge, the fuzz */
    for (let t = 0.05; t < 0.95; t += 0.02) s.mod(7.5 + 31 * t + 3.4, 38.5 - 32 * t + 3.4, -1);
    hdI_each(s, id, (x, y) => { if (hdI_h(x, y, 15) > 0.93) s.mod(x, y, 1); });
    const st = s.add(hdI_STEM, { layer: 2, R: 1, k: 1.4 }); hdI_path(s, st, [[38, 7], [41, 4], [42.5, 2]], 1.3, 1);
    for (const [x, y] of B) { s.px(x - 3, y - 3, '#d8f8c4'); s.px(x - 2, y - 3, '#c4f0a6'); }
    hdI_glint(s, 10, 30, 1, '#e8ffd8');
}
hdI_reg('veg_edamame', hdI_edamame);

/* ---------------------------------------------------------------- the other catches */
/* a black eye with a white glint (squid, octopus, pufferfish, shrimp) */
function hdI_eye(s, x, y, r, layer) {
    const e = s.add(hdPal('#120c14', '#1a1418', '#2a2026', '#3c2e36', '#5a4652'), { layer: layer || 6, R: 1, flat: 1, bias: -0.1 });
    s.ellipse(e, x, y, r, r * 1.1);
    const gx = Math.round(x - r * 0.5), gy = Math.round(y - r * 0.55);
    s.px(gx, gy, '#ffffff'); if (r > 1.8) { s.px(gx + 1, gy, '#ffffff'); s.px(gx, gy + 1, '#ffffff'); } if (r > 2.4) s.px(gx + 2, gy + 2, '#5a4652');
}
/* the squid: a pale pink mantle with fins near its tip and freckles, big dark eyes, short arms and one long one */
function hdI_squid(s) {
    const B = hdPal('#8a4a62', '#e0a4bc', '#f2c8d8', '#f8dce6', '#fff0f6'), C = hdPal('#7a3a54', '#c87896', '#e8a0b8', '#f0bccc', '#f8dce6');
    const arm = s.add(C, { layer: 1, R: 2, k: 1.4, grad: 0.1 });
    /* three short arms gathering into a bundle, as today's, and the long one on the right */
    for (const [x0, x1, x2] of [[16.6, 19.6, 19.8], [21.6, 22, 22.2], [26.4, 24.4, 24.6]]) hdI_path(s, arm, hdI_spline([[x0, 27], [x1, 35], [x2, 43.6]], 4), 2.5, 1.9);
    hdI_path(s, arm, hdI_spline([[31.6, 27], [33.8, 34], [34.8, 40.5], [36.2, 46]], 4), 2.4, 1.6);
    hdI_each(s, arm, (x, y) => { if (y > 30 && (y % 3 === 0) && s.at(x + 1, y) === arm && s.at(x - 1, y) === arm) s.mod(x, y, 1); });
    const fin = s.add(C, { layer: 2, flat: 1, grad: 0.3, bias: 0.04 });
    s.poly(fin, [[16, 5], [10.4, 12.2], [11.6, 13.6], [16, 13.4]]); s.poly(fin, [[32, 5], [37.6, 12.2], [36.4, 13.6], [32, 13.4]]);
    const m = s.add(B, { layer: 3, flat: 1, grad: 0 });
    s.poly(m, [[24, 0.4], [28.6, 1.6], [32, 5.5], [33.6, 11], [34.6, 15.5], [36.4, 17], [34.6, 19.5], [34.4, 27], [31, 29], [17, 29], [13.6, 27], [13.4, 19.5], [11.6, 17], [13.4, 15.5], [14.4, 11], [16, 5.5], [19.4, 1.6]]);
    hdI_lit(s, m, (x, y) => { const u = (x - 23) / 13, v = y < 18 ? (y - 18) / 22 : (y - 18) / 14, d = Math.min(0.95, u * u); return [u, v * 0.6, Math.sqrt(1 - d) * 1.1]; }, 0.04);
    /* the band where the fins cross, freckles on the mantle */
    hdI_each(s, m, (x, y) => { if (y >= 10 && y <= 11) s.recolor(x, y, C); if (y < 26 && hdI_h(x >> 1, y >> 1, 17) > 0.86 && hdI_h(x, y, 18) > 0.5) s.recolor(x, y, C); });
    hdI_eye(s, 20.5, 21.5, 2.2); hdI_eye(s, 28.5, 21.5, 2.2);
    hdI_glint(s, 19, 6, 1, '#fff4f8'); s.px(17, 9, '#ffffff');
}
hdI_reg('fish_squid', hdI_squid);
/* the octopus: a round coral-red head with pale freckles, white eyes looking up, six arms curling at the tips with
   pale suckers */
function hdI_octopus(s) {
    const B = hdPal('#7a2228', '#c2464e', '#e8646a', '#f2888a', '#ffb4b2');
    const arms = s.add(B, { layer: 1, R: 2, k: 1.4, grad: 0.12, bias: -0.04 });
    const A = [[[11, 24], [8.5, 33], [10.5, 40], [14, 42]], [[17.5, 26], [16, 35], [17, 42], [20.5, 44]], [[22.5, 27], [22, 36], [21.6, 45]], [[26.5, 27], [27, 36], [27.4, 45]], [[31, 26], [32.5, 35], [31.6, 42], [28.4, 44]], [[37, 24], [39.5, 33], [37.6, 40], [34, 42]]];
    for (const p of A) hdI_path(s, arms, hdI_spline(p, 4), 2.9, 1.5);
    /* suckers: pale dots down the arms */
    for (const p of A) { const q = hdI_spline(p, 4); for (let i = 3; i < q.length - 1; i += 2) { const [x, y] = q[i]; if (s.at(Math.round(x), Math.round(y)) === arms) s.px(x + (x < 24 ? 1 : -1), y, '#ffc8c4'); } }
    const head = s.add(B, Object.assign({ layer: 2 }, hdI_LITP));
    s.ellipse(head, 24, 15, 18.4, 12.6);
    s.poly(head, [[8, 18], [40, 18], [37, 27], [11, 27]]);
    hdI_lit(s, head, hdI_egg(23, 15, 19, 15, 1.1), 0.04);
    for (const [x, y] of [[15, 9], [31, 8], [35, 13], [12, 15], [27, 6]]) { s.recolor(x, y, hdPal('#7a2228', '#e07a7c', '#f29a98', '#f8b8b4', '#ffd4d0')); s.recolor(x + 1, y, hdPal('#7a2228', '#e07a7c', '#f29a98', '#f8b8b4', '#ffd4d0')); }
    for (const x of [19, 29]) {
        const w = s.add(hdI_WHITE, { layer: 3, flat: 1, bias: 0.1 }); s.ellipse(w, x + 0.5, 20.5, 2.9, 3.4);
        const p = s.add(hdPal('#120c14', '#1a1418', '#2a2026', '#3c2e36', '#5a4652'), { layer: 4, flat: 1, bias: -0.1 }); s.ellipse(p, x + 0.5, 22.4, 2, 1.7);
    }
    hdI_glint(s, 14, 7, 1, '#ffe8e6'); s.px(17, 5, '#ffffff');
}
hdI_reg('fish_octopus', hdI_octopus);
/* the pufferfish: a round pale-yellow ball, cream belly, little dark spines all round, dark eyes, faint spots */
function hdI_puffer(s) {
    const sp = s.add(hdPal('#2a240e', '#4a4218', '#6e6230', '#8a7a3a', '#a8964e'), { layer: 1, R: 1, k: 1.3, grad: 0.1 });
    for (const [x0, y0] of [[13.5, 8.6], [28.5, 4.6], [38, 10], [4, 19.5], [44, 25.5], [4, 31.5], [38, 39.5], [13.5, 42.6], [28.5, 45.2]]) {
        const dx = x0 - 23.5, dy = y0 - 25.5, l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l, x = 23.5 + ux * (l + 1.2), y = 25.5 + uy * (l + 1.2);
        s.poly(sp, [[x, y], [23.5 + ux * (l - 7) - uy * 2.4, 25.5 + uy * (l - 7) + ux * 2.4], [23.5 + ux * (l - 7) + uy * 2.4, 25.5 + uy * (l - 7) - ux * 2.4]]);
    }
    const body = s.add(hdPal('#6e5e22', '#c8b060', '#e8d48a', '#f2e2a8', '#fff2cc'), Object.assign({ layer: 2 }, hdI_LITP));
    s.ellipse(body, 23.5, 25.5, 17.6, 16);
    hdI_lit(s, body, hdI_egg(23, 24.5, 18.5, 17, 1.1), 0.04);
    const belly = hdPal('#7a6e3a', '#e6dcb0', '#fff6d0', '#fffae4', '#ffffff');
    hdI_each(s, body, (x, y) => { if ((x + 0.5 - 23.5) ** 2 / 196 + (y + 0.5 - 35) ** 2 / 64 < 1) s.recolor(x, y, belly); });
    for (let i = 0; i < 10; i++) { const x = 11 + hdI_h(i, 1, 19) * 26, y = 13 + hdI_h(i, 2, 19) * 12; if (Math.abs(y - 22) > 3 || Math.abs(x - 25.5) > 9) s.recolor(x, y, hdPal('#5e5424', '#a89448', '#c4ae5e', '#d4c070', '#e4d088')); }
    hdI_eye(s, 19.5, 22, 2.7); hdI_eye(s, 31.5, 22, 2.7);
    hdI_glint(s, 13, 15, 2, '#fffbe8');
}
hdI_reg('fish_pufferfish', hdI_puffer);
/* the shrimp: a coral body curled from the head at the top left down and round to the tail fan at the right, its
   shell in segments, legs tucked inside the curl, a black eye and two thin feelers */
function hdI_shrimp(s) {
    const C = hdPal('#8a3426', '#e0705a', '#ff9a7a', '#ffb89c', '#ffdac8'), B = hdPal('#6e2418', '#b8503c', '#e0705a', '#ec8c74', '#f8b4a0');
    const leg = s.add(B, { layer: 1, R: 1, k: 1.3 });
    for (let i = 0; i < 4; i++) { const x = 16 + i * 4, y = 31 - i * 0.3; s.line(leg, x, y, x + 2.4, y - 3.6, 0.7); }
    const ant = s.add(B, { layer: 1, R: 1, k: 1.3 });
    hdI_path(s, ant, hdI_spline([[8, 13], [5, 8], [4, 3.6], [5, 1]], 4), 0.9, 0.6);
    hdI_path(s, ant, hdI_spline([[10, 12.6], [9.5, 7], [11, 3]], 4), 0.8, 0.6);
    const fan = s.add(B, { layer: 2, flat: 1, grad: 0.3, bias: 0.04 });
    s.poly(fan, [[31.5, 33], [33, 27.6], [36.5, 26.4], [39.5, 27.4], [40.4, 30.2], [37.6, 33.4], [34, 35]]);
    for (let t = 0.2; t < 1; t += 0.25) s.mod(33 + 6.5 * t, 31.5 - 3 * t, -1);
    const path = hdI_spline([[9.5, 15.5], [10, 24], [13.6, 32], [20.5, 37], [28.5, 36.6], [33.6, 32.6]], 5);
    const body = s.add(C, Object.assign({ layer: 3 }, hdI_LITP));
    hdI_path(s, body, path, 5.6, 4.6);
    s.ellipse(body, 15, 34, 6.6, 6.2); s.ellipse(body, 22.5, 37.4, 6.4, 5.6); s.ellipse(body, 29, 36, 5.2, 4.8);
    hdI_lit(s, body, hdI_tube(path, 6.6, 5.6), 0.06);
    /* the shell's segments: grooves across the body, a lit edge behind each */
    for (let i = 8; i < path.length - 2; i += 4) {
        const [x0, y0] = path[i - 1], [x1, y1] = path[i + 1], dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, [cx, cy] = path[i];
        for (let k = -7; k <= 7; k++) { const x = cx + nx * k, y = cy + ny * k; if (s.at(Math.round(x), Math.round(y)) === body) { s.mod(x, y, -1); s.mod(x + dx / l, y + dy / l, 1); } }
    }
    /* the head: darker, as today's */
    hdI_each(s, body, (x, y) => { if (y < 21) s.recolor(x, y, B); });
    hdI_eye(s, 12.5, 21.5, 1.6);
    hdI_glint(s, 7, 26, 1, '#fff0e8'); s.px(9, 18, '#ffe0d4');
}
hdI_reg('fish_shrimp', hdI_shrimp);
/* the eel: a long dark-olive body waving from the head at the lower left over a hump and down and up to the tail at the
   top right, a paler belly, a fin along its back, a white eye */
function hdI_eel(s) {
    const path = hdI_spline([[3.6, 30], [11.5, 25], [20, 18.6], [27.5, 20.5], [33, 29.5], [39.5, 28.6], [44, 20], [46.4, 13.6]], 6);
    const fin = s.add(hdPal('#2a3420', '#4a5a38', '#6a7a52', '#829266', '#9cac7c'), { layer: 1, R: 1, k: 1.2, grad: 0.1 });
    hdI_path(s, fin, path.slice(4).map(([x, y]) => [x + 0.3, y - 1.6]), 6.6, 3.4);
    const id = s.add(hdPal('#1e2618', '#3a4630', '#5a6a4a', '#74865e', '#98aa7e'), Object.assign({ layer: 2 }, hdI_LITP));
    hdI_path(s, id, path, 6.2, 2.6);
    hdI_lit(s, id, hdI_tube(path, 6.4, 2.8), 0.05);
    /* the belly: a paler olive along the lower side */
    const belly = hdPal('#3a4228', '#6e7a4a', '#8a9660', '#a0ac74', '#bcc690');
    const N = hdI_tube(path, 6.4, 2.8);
    hdI_each(s, id, (x, y) => { const n = N(x + 0.5, y + 0.5); if (n[1] > 0.45 * Math.hypot(n[0], n[1], n[2])) s.recolor(x, y, belly); });
    /* the mouth, the gill slit, the white eye with its pupil */
    for (let x = 1; x < 6; x++) s.mod(x, 31 - (x - 1) * 0.2, -2);
    for (let y = 25; y < 31; y++) s.mod(12.5, y, -1);
    const ew = s.add(hdI_WHITE, { layer: 3, flat: 1, bias: 0.1 }); s.ellipse(ew, 7, 26.5, 2.2, 2);
    s.px(7.5, 26.5, '#1a1418'); s.px(6, 25.5, '#ffffff');
    hdI_glint(s, 19, 14.5, 1, '#e8f4d8'); s.px(22, 15, '#d8e8c4');
}
hdI_reg('fish_eel', hdI_eel);
/* the crawfish: two big red claws up top on short arms, a body narrowing down in shell segments to a tail fan */
function hdI_crawfish(s) {
    const B = hdPal('#6e1a12', '#c03a2c', '#e8584a', '#f2786a', '#ffa496'), C = hdPal('#5a160e', '#8e2a1e', '#b8382a', '#cc4c3c', '#de6a58'), D = hdPal('#621a12', '#a8342a', '#d8483a', '#e8665a', '#f48e80');
    const arm = s.add(C, { layer: 1, R: 1.5, k: 1.4, grad: 0.1 });
    s.line(arm, 19, 18.5, 14, 13, 2.2); s.line(arm, 29, 18.5, 34, 13, 2.2);
    const claw = (cx, flip) => {
        const id = s.add(B, Object.assign({ layer: 2 }, hdI_LITP));
        s.ellipse(id, cx, 10.4, 8, 5.6);
        /* the pincer's notch, cut in from the outer end */
        for (let k = 0; k < 6; k++) s.erase(cx + flip * (8 - k), 10.4 + (k > 4 ? 1 : 0));
        hdI_lit(s, id, hdI_egg(cx - 1, 9.6, 8.6, 6.4, 1.05), 0.04);
        s.px(cx - 3, 8, '#ffd8d0');
    };
    claw(10, -1); claw(38, 1);
    const body = s.add(D, Object.assign({ layer: 3 }, hdI_LITP));
    s.poly(body, [[17.4, 16.2], [24, 14.8], [30.6, 16.2], [32.2, 19.5], [30.8, 23], [30.6, 28.5], [29.6, 30], [18.4, 30], [17.4, 28.5], [17.2, 23], [15.8, 19.5]]);
    hdI_lit(s, body, hdI_egg(23.5, 21, 9.5, 10, 1.1), 0.04);
    const seg = (y0, y1, x0, x1, mat, layer) => { const id = s.add(mat, Object.assign({ layer }, hdI_LITP)); s.poly(id, [[x0 + 1.4, y0], [x1 - 1.4, y0], [x1, y0 + 1.2], [x1, y1 - 1], [x1 - 1.6, y1], [x0 + 1.6, y1], [x0, y1 - 1], [x0, y0 + 1.2]]); hdI_lit(s, id, hdI_tube([[24, y0 - 4], [24, y1 + 4]], (x1 - x0) / 2 + 1), 0.04); };
    seg(29, 33.4, 15.2, 33.2, C, 4); seg(32.6, 36.6, 17.6, 30.4, D, 5); seg(35.8, 40.4, 15.2, 33.2, C, 6);
    for (let x = 18; x <= 30; x += 4) for (let y = 37; y <= 39; y++) s.mod(x, y, -1);
    hdI_eye(s, 21, 18, 1.2, 7); hdI_eye(s, 27, 18, 1.2, 7);
    hdI_glint(s, 8, 8, 1, '#ffe4de');
}
hdI_reg('fish_crawfish', hdI_crawfish);
/* the lobster: big claws at the top corners (a pale shine on each), arms down to its head with black eyes, a body
   in alternating segments narrowing to a wide tail fan */
function hdI_lobster(s) {
    const B = hdPal('#6e1a12', '#c03a2c', '#e8584a', '#f2786a', '#ffa496'), D = hdPal('#4a0e0a', '#7a1812', '#a8231c', '#c03428', '#d8503e'), E = hdPal('#5e140e', '#a82418', '#d8352a', '#e85646', '#f47c6c');
    const arm = s.add(D, { layer: 1, R: 1.5, k: 1.4, grad: 0.1 });
    hdI_path(s, arm, [[20, 20], [16, 15], [14, 11]], 2, 1.8); hdI_path(s, arm, [[28, 20], [32, 15], [34, 11]], 2, 1.8);
    const claw = (cx, flip) => {
        const id = s.add(B, Object.assign({ layer: 2 }, hdI_LITP));
        s.poly(id, [[cx - 8 * flip, 1.4], [cx + 2 * flip, 0.6], [cx + 6.6 * flip, 3], [cx + 7.4 * flip, 8], [cx + 5 * flip, 11.6], [cx - 1 * flip, 12], [cx - 6.6 * flip, 10.6], [cx - 8.4 * flip, 6]].map(([x, y]) => [x, y + 0.6]));
        /* the gap between the pincers, a dark inner edge */
        for (let k = 0; k < 6; k++) s.erase(cx + flip * (2 + k * 0.4), 6.4 - k * 0.9);
        hdI_lit(s, id, hdI_egg(cx - 1, 5.4, 9, 7, 1.05), 0.04);
        s.px(cx - 4, 3.6, '#fff0e8'); s.px(cx - 3, 3.6, '#fff0e8'); s.px(cx - 4, 4.6, '#ffd0c4');
    };
    claw(8.4, 1); claw(39.6, -1);
    const segs = [[17.6, 21.6, 17.6, 30.4, E], [21.4, 25.6, 14.4, 33.6, D], [25.4, 29, 14.6, 33.4, E], [28.8, 32.6, 14.6, 33.4, D], [32.4, 35.8, 16.6, 31.4, E], [35.6, 38.8, 17.6, 30.4, D]];
    segs.forEach(([y0, y1, x0, x1, mat], k) => { const id = s.add(mat, Object.assign({ layer: 3 + k }, hdI_LITP)); s.poly(id, [[x0 + 1.6, y0], [x1 - 1.6, y0], [x1, y0 + 1.3], [x1, y1 - 1], [x1 - 1.8, y1], [x0 + 1.8, y1], [x0, y1 - 1], [x0, y0 + 1.3]]); hdI_lit(s, id, hdI_tube([[24, y0 - 5], [24, y1 + 5]], (x1 - x0) / 2 + 1), 0.04); });
    const head = s.add(E, Object.assign({ layer: 9 }, hdI_LITP));
    s.poly(head, [[19.6, 13.6], [28.4, 13.6], [30.4, 17], [29.6, 21.6], [18.4, 21.6], [17.6, 17]]);
    hdI_lit(s, head, hdI_egg(23.5, 16, 7.5, 6.5, 1.1), 0.04);
    hdI_eye(s, 21.5, 18, 1.5, 10); hdI_eye(s, 26.5, 18, 1.5, 10);
    const fan = s.add(B, Object.assign({ layer: 2 }, hdI_LITP));
    s.poly(fan, [[18, 38], [30, 38], [35.6, 44], [35, 46.6], [13, 46.6], [12.4, 44]]);
    hdI_lit(s, fan, (x, y) => [(x - 24) / 30, (y - 44) / 8, 1], 0.06);
    for (const x of [19, 24, 29]) for (let y = 40; y < 46; y++) s.mod(x + (x - 24) * (y - 40) * 0.05, y, -1);
    hdI_glint(s, 31, 26, 1, '#ffe4de');
}
hdI_reg('fish_lobster', hdI_lobster);
/* an old boot fished out of the water: wet brown leather (a long shine down the shaft), the dark opening at the top,
   a crease at the ankle, a rounded toe, a dark stitched sole */
function hdI_boot(s) {
    const L = hdPal('#2e1e12', '#5e4430', '#7a5a3a', '#94744e', '#b49068');
    const sole = s.add(hdPal('#1a120c', '#2e2216', '#4a3422', '#5c4430', '#6e5440'), { layer: 1, flat: 1, grad: 0.3 });
    s.poly(sole, [[12.4, 37], [44.6, 37], [45.6, 39], [45, 41.4], [43, 42.6], [13.4, 42.6], [12, 41]]);
    for (let x = 15; x < 44; x += 3) s.mod(x, 39.5, 1);
    const id = s.add(L, Object.assign({ layer: 2 }, hdI_LITP));
    s.poly(id, [[13, 4.6], [31.4, 4.6], [32, 9], [31.6, 26.5], [36, 28.4], [42, 29.6], [45, 32], [45.4, 36], [44.4, 39], [13, 39], [12.4, 30]]);
    hdI_lit(s, id, (x, y) => y < 28 ? [(x - 22) / 12, -0.1, 1] : [(x - 30) / 30, (y - 33) / 8, 1], 0.04);
    /* the opening: dark inside, the rim lit */
    const hole = s.add(hdPal('#120a06', '#1e140c', '#2a1c12', '#38261a', '#463222'), { layer: 3, flat: 1, bias: -0.1 });
    s.ellipse(hole, 22.2, 6.6, 8.4, 2.2);
    for (let x = 14; x <= 30; x++) s.mod(x, 4.6, 1);
    /* the ankle crease, the heel's seam, the toe cap's stitching */
    for (let x = 14; x < 31; x++) s.mod(x, 27 + Math.sin((x - 14) / 17 * Math.PI) * 1.6, -1);
    for (let y = 30; y < 38; y++) s.mod(20, y, -1);
    for (let k = 0; k < 6; k++) s.mod(33 + k * 2, 30.6 + k * 0.5, 1);
    /* the wet shine down the shaft and on the toe */
    for (let y = 9; y < 25; y++) s.px(17.4, y, y % 6 === 2 ? '#e8d0b0' : '#c4a27a');
    hdI_glint(s, 17, 12, 1, '#f4e4cc'); s.px(39, 31, '#d8bc94'); s.px(40, 31, '#c8a880');
}
hdI_reg('fish_boot', hdI_boot);
