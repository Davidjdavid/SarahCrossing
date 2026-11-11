/* The overworld's art kit (src/32_overworld.js's blocks opt in; drawing only, nothing here changes what can be walked on).
   - Ground painted per region: OWA.ground[theme][painter] = (x, th, v) => paints a tile (grass, path, forest...).
   - Painters that look at their neighbours: OWA.paint[painter] = { mask(a, tx, ty), draw(x, th, v, mask, tn, f), frames }.
   - Cliffs drawn by the lie of the land (OWA.cliffs[theme] = { top, face }): a block's `levels` ([[x, y, level]...], seeds
     flooded over open ground) says which ground is higher; a cliff is a face where it drops to lower ground south of it
     (one or two tiles of face), the top of its plateau everywhere else, with a rim where it falls away to the sides or
     behind. The valley's rim (the map's edge) counts as high.
   - Soft seams: a block with `soft: n` frays into each neighbour with another palette over its own n tiles nearest the
     seam (the seam itself in the neighbour's colours; ground by a wandering edge, rock and water by shading across), and
     the trees there mix. Of two soft blocks only one does it (the softer... the larger `soft`, then the earlier id).
   - A tile's own theme: b.themeAt(lx, ly) (block coordinates) may name another (a canyon's mouth in its canyon's rock).
   - Each block's drawGround(a, cx, cy) and drawOver(a, cx, cy), and ripples round Wren's feet in shallow water. */

const OWA = {
    ground: {}, paint: {}, cliffs: {},
    blockAt(tx, ty) { return OW.blocks[Math.floor(tx / OW.bw) + ',' + Math.floor(ty / OW.bh)] || null; },
    /* the theme a tile is drawn in */
    themeOf(a, tx, ty) {
        const b = this.blockAt(tx, ty);
        if (!b) return 'town';
        const t = b.themeAt && b.themeAt(tx - b.bx * OW.bw, ty - b.by * OW.bh);
        return t || b.theme;
    },
    /* ---------- smooth noise, the same everywhere every time ---------- */
    n1(x, s) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash2(i, 7, s), hash2(i + 1, 7, s), u); },
    n2(x, y, s) {
        const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), w = fy * fy * (3 - 2 * fy);
        return lerp(lerp(hash2(i, j, s), hash2(i + 1, j, s), u), lerp(hash2(i, j + 1, s), hash2(i + 1, j + 1, s), u), w);
    },
    /* ---------- levels of the ground (for cliffs) ---------- */
    RIM: 9,
    levels(a) {
        if (a._owLv) return a._owLv;
        const lv = new Int8Array(a.w * a.h).fill(-1);
        const wall = (x, y) => { const k = a.cell(x, y).k; return k === 'cliff' || k === 'rock' || k === 'stairs' || k === 'ledge' || k === 'void' || k === 'fog'; };
        for (const b of Object.values(OW.blocks)) for (const [sx, sy, L] of b.levels || []) {
            const x0 = b.bx * OW.bw + sx, y0 = b.by * OW.bh + sy;
            if (!a.inside(x0, y0) || wall(x0, y0) || lv[y0 * a.w + x0] >= 0) continue;
            const q = [[x0, y0]]; lv[y0 * a.w + x0] = L;
            /* (each block's levels are its own: a flood stops at its edge) */
            const inB = (x, y) => x >= b.bx * OW.bw && y >= b.by * OW.bh && x < (b.bx + 1) * OW.bw && y < (b.by + 1) * OW.bh;
            while (q.length) {
                const [x, y] = q.pop();
                for (let d = 0; d < 4; d++) {
                    const nx = x + DX[d], ny = y + DY[d];
                    if (!a.inside(nx, ny) || !inB(nx, ny) || lv[ny * a.w + nx] >= 0 || wall(nx, ny)) continue;
                    lv[ny * a.w + nx] = L; q.push([nx, ny]);
                }
            }
        }
        return (a._owLv = lv);
    },
    /* the level of open ground at a tile (through stairs and ledges, the way the scan was going); the rim is high */
    lvAt(a, x, y, dy = 0) {
        for (let n = 0; n < 6; n++) {
            if (!a.inside(x, y)) return this.RIM;
            const k = a.cell(x, y).k;
            if (k === 'fog' || k === 'void') return this.RIM;
            if ((k === 'stairs' || k === 'ledge') && dy) { y += dy; continue; }
            if (k === 'cliff' || k === 'rock') return null;
            const L = this.levels(a)[y * a.w + x];
            return L < 0 ? 0 : L;
        }
        return 0;
    },
    /* a smooth field 0..3 over the land (patches that fade in and out across tiles) */
    field(tx, ty, s, sx = 7, sy = 5, bias = 0) { return Math.floor(clamp(this.n2(tx / sx, ty / sy, s) * 1.7 - 0.45 + bias, 0, 0.999) * 4); },
    isCliff(a, x, y) { const k = a.cell(x, y).k; return (k === 'cliff' || k === 'rock') && a.cell(x, y).p === 'cliff'; },
    /* what a cliff tile is: the face (and how far up it) or the plateau's top, and which of its sides fall away */
    cliffMask(a, tx, ty) {
        const cl = (x, y) => a.inside(x, y) && this.isCliff(a, x, y);
        const info = (x, y) => {
            let ya = y; while (ya > 0 && cl(x, ya - 1)) ya--; ya--;
            let yb = y; while (yb < a.h - 1 && cl(x, yb + 1)) yb++; yb++;
            const La = this.lvAt(a, x, ya, -1), Lb = this.lvAt(a, x, yb, 1);
            const run = yb - ya - 1, up = yb - y;
            const bk = this.blockAt(x, y), faceH = Math.min(run, (bk && bk.faceH) || (run >= 3 ? 2 : 1));
            /* (a wall between ground of one level is a ridge, higher than both) */
            const hi = La === null || Lb === null ? this.RIM : La === Lb ? La + 1 : Math.max(La, Lb);
            const face = La !== null && Lb !== null && La > Lb && up <= faceH;
            return { face, up, hi, La, Lb };
        };
        const rimOf = (x, y) => { const b = this.blockAt(x, y); return !!(b && b.rim && b.rim.some(([x0, y0, x1, y1]) => x - b.bx * OW.bw >= x0 && x - b.bx * OW.bw <= x1 && y - b.by * OW.bh >= y0 && y - b.by * OW.bh <= y1)); };
        const me = rimOf(tx, ty) ? { face: false, hi: this.RIM } : info(tx, ty);
        const side = dx => {
            const x = tx + dx;
            if (!a.inside(x, ty)) return 's';                         /* (off the map: the same) */
            if (cl(x, ty)) { const o = rimOf(x, ty) ? { face: false } : info(x, ty); return o.face === me.face ? 's' : o.face ? 'f' : 't'; }
            const L = this.lvAt(a, x, ty); return L === null || L >= me.hi ? 's' : 'o';
        };
        const l = side(-1), r = side(1);
        if (me.face) {
            const above = cl(tx, ty - 1) ? (!rimOf(tx, ty - 1) && info(tx, ty - 1).face ? 'f' : 't') : 'o';
            const below = cl(tx, ty + 1) ? 'f' : 'o';
            return 'F' + me.up + above + below + l + r;
        }
        const aboveOpen = !cl(tx, ty - 1) && (() => { const L = this.lvAt(a, tx, ty - 1, -1); return L !== null && L < me.hi; })();
        const belowOpen = !cl(tx, ty + 1) && (() => { const L = this.lvAt(a, tx, ty + 1, 1); return L !== null && L < me.hi; })();
        return 'T' + (aboveOpen ? 'u' : '-') + (belowOpen ? 'd' : '-') + l + r;
    },
    /* ---------- soft seams ---------- */
    owns(b, n) {
        if (!b.soft) return false;
        if (!n.soft) return true;
        return b.soft !== n.soft ? b.soft > n.soft : b.id < n.id;
    },
    seamOf(a, tx, ty) {
        const b = this.blockAt(tx, ty); if (!b || !b.soft) return null;
        const lx = tx - b.bx * OW.bw, ly = ty - b.by * OW.bh, band = b.soft;
        const me = this.themeOf(a, tx, ty);
        let best = null;
        const tryS = (side, d, nbx, nby) => {
            if (d >= band) return;
            const n = OW.blocks[nbx + ',' + nby]; if (!n || !this.owns(b, n)) return;
            const ax = side === 'l' ? b.bx * OW.bw - 1 : side === 'r' ? (b.bx + 1) * OW.bw : tx, ay = side === 'u' ? b.by * OW.bh - 1 : side === 'd' ? (b.by + 1) * OW.bh : ty;
            const tn = this.themeOf(a, ax, ay);
            if (tn === me || !THEMES[tn]) return;
            if (!best || d < best.d) best = { side, d, tn, band };
        };
        tryS('l', lx, b.bx - 1, b.by); tryS('r', OW.bw - 1 - lx, b.bx + 1, b.by);
        tryS('u', ly, b.bx, b.by - 1); tryS('d', OW.bh - 1 - ly, b.bx, b.by + 1);
        /* (ground only frays into ground: not across a cliff between it and the seam) */
        if (best && !this.isCliff(a, tx, ty)) {
            const [ddx, ddy] = { l: [-1, 0], r: [1, 0], u: [0, -1], d: [0, 1] }[best.side];
            for (let i = 1; i <= best.d; i++) if (this.isCliff(a, tx + ddx * i, ty + ddy * i)) return null;
        }
        return best;
    },
    /* a palette between two themes */
    mixTheme(ta, tb, w) {
        const name = 'ow~' + ta + '~' + tb + '~' + w.toFixed(2);
        if (!THEMES[name]) {
            const A = THEMES[ta], B = THEMES[tb], o = {};
            for (const k of Object.keys(A)) {
                if (Array.isArray(A[k]) && Array.isArray(B[k])) o[k] = A[k].map((c, i) => B[k][i] ? mix(c, B[k][i], w) : c);
                else if (typeof A[k] === 'string' && typeof B[k] === 'string') o[k] = mix(A[k], B[k], w);
                else o[k] = A[k];
            }
            THEMES[name] = o; this.styleOf[name] = ta;       /* (drawn as this side draws it, in colours between the two) */
        }
        return name;
    },
    styleOf: {},
    /* ---------- painting a tile ---------- */
    BLEND_BY_SHADE: { cliff: 1, stairs: 1, ledge: 1, water: 1, deep: 1, current: 1, bridgeH: 1, bridgeV: 1, pit: 1 },
    canvasIn(a, tx, ty, tn) {
        const L = a.cell(tx, ty), p = L.p, th = THEMES[tn], v = Math.floor(hash2(tx, ty, 99) * 4);
        const style = this.styleOf[tn] || tn;
        const P = this.paint[p];
        if (P && (!P.themes || P.themes.includes(style))) {
            const m = P.mask ? P.mask(a, tx, ty) : '', f = P.frames ? Math.floor(TileDraw.frame / (P.rate || 20)) % P.frames : 0;
            return tileCanvas(`ow:${tn}:${p}:${v}:${m}:${f}`, x => P.draw(x, th, v, m, style, f, tx, ty));
        }
        if (p === 'cliff' && this.cliffs[style]) {
            const m = this.cliffMask(a, tx, ty);
            return tileCanvas(`ow:${tn}:cliff:${v}:${m}`, x => (m[0] === 'F' ? this.cliffs[style].face : this.cliffs[style].top)(x, th, v, m));
        }
        /* (a painter can read a field laid over the land, a level 0..3 from the tile's place: heather thicker here, thinner there) */
        const g = this.ground[style] && this.ground[style][p];
        if (g) { const fl = g.field ? g.field(tx, ty) : 0, fn = g.draw || g; return tileCanvas(`ow:${tn}:${p}:${v}:${fl}`, x => fn(x, th, v, fl)); }
        return this.capture(a, tx, ty, tn);
    },
    /* the game's own painter, in a given theme (what it would have drawn there) */
    capture(a, tx, ty, tn) {
        const d = a.def, ta = d.themeAt, img = Gfx.img; let got = null;
        d.themeAt = () => tn; Gfx.img = c => { got = c; };
        try { OWA.draw0.call(TileDraw, this.wet(a, tx, ty), tx, ty, 0, 0); } finally { d.themeAt = ta; Gfx.img = img; }
        return got;
    },
    /* a low rock standing in the water is water to the water round it (no ring of foam round each stone, as if each
       stood in a pool of its own): in the blocks that ask (b.lowRocks), the water's painter sees water there */
    WET: { k: 'water', p: 'deep' },
    wet(a, tx, ty) {
        const b = this.blockAt(tx, ty), p = a.cell(tx, ty).p;
        if (!b || !b.lowRocks || !(p === 'deep' || p === 'water' || p === 'current')) return a;
        const lo = (x, y) => { const q = a.cell(x, y); return q.k === 'low' && q.p === 'deep'; };
        if (!(lo(tx, ty) || lo(tx - 1, ty) || lo(tx + 1, ty) || lo(tx, ty - 1) || lo(tx, ty + 1))) return a;
        const px = Object.create(a);
        px.cell = (x, y) => lo(x, y) ? this.WET : a.cell(x, y);
        return px;
    },
    _ids: new WeakMap(), _n: 0,
    idOf(c) { let i = this._ids.get(c); if (!i) { i = ++this._n; this._ids.set(c, i); } return i; },
    tile(a, tx, ty) {
        const b = this.blockAt(tx, ty);
        if (!b || !b.owArt) return null;
        const tn = this.themeOf(a, tx, ty);
        const s = this.seamOf(a, tx, ty);
        if (!s) return this.canvasIn(a, tx, ty, tn);
        const p = a.cell(tx, ty).p;
        if (this.BLEND_BY_SHADE[p] || (this.paint[p] && this.paint[p].shade)) {
            /* rock and water: shaded across, tile by tile */
            const w = 1 - (s.d + 0.5) / s.band;
            return this.canvasIn(a, tx, ty, this.mixTheme(tn, s.tn, Math.round(w * 6) / 6));
        }
        const c0 = this.canvasIn(a, tx, ty, tn), c1 = this.canvasIn(a, tx, ty, s.tn);
        if (!c0 || !c1 || HEADLESS) return c0;
        const k = `seam:${tx},${ty}:${this.idOf(c0)}:${this.idOf(c1)}`;
        return tileCanvas(k, x => {
            const A = c0.getContext('2d').getImageData(0, 0, T, T), B = c1.getContext('2d').getImageData(0, 0, T, T), o = A.data, q = B.data;
            const bp = s.band * T;
            for (let py = 0; py < T; py++) for (let px = 0; px < T; px++) {
                const gx = tx * T + px, gy = ty * T + py;
                const along = s.side === 'l' || s.side === 'r' ? gy : gx;
                const dist = s.side === 'l' ? gx - b.bx * OW.bw * T : s.side === 'r' ? (b.bx + 1) * OW.bw * T - 1 - gx : s.side === 'u' ? gy - b.by * OW.bh * T : (b.by + 1) * OW.bh * T - 1 - gy;
                const lim = bp * (0.22 + 0.58 * this.n1(along / 41, 3) * 0.6 + 0.58 * 0.4 * this.n1(along / 13, 9)) + (this.n2(gx / 4, gy / 4, 5) - 0.5) * 9;
                if (dist < lim) { const i = (py * T + px) * 4; o[i] = q[i]; o[i + 1] = q[i + 1]; o[i + 2] = q[i + 2]; o[i + 3] = q[i + 3]; }
            }
            x.putImageData(A, 0, 0);
        });
    },
};

/* every tile of a block that opts in goes through the kit; the rest as before */
{
    OWA.draw0 = TileDraw.draw;
    TileDraw.draw = function (area, tx, ty, sx, sy) {
        if (area.id === 'hollow') {
            const c = OWA.tile(area, tx, ty);
            if (c) { Gfx.img(c, sx, sy); return; }
        }
        return OWA.draw0.call(this, area, tx, ty, sx, sy);
    };
}

/* the trees along a soft seam are a mixture of both sides' trees */
CONTENT_INIT.push(() => {
    const d = AREAS.hollow; if (!d) return;
    for (const e of d.ents) {
        if (e.k !== 'tree' || !e.deco) continue;
        const b = OWA.blockAt(e.x, e.y); if (!b || !b.soft || !b.owArt) continue;
        const lx = e.x - b.bx * OW.bw, ly = e.y - b.by * OW.bh;
        const near = [['l', lx, b.bx - 1, b.by], ['r', OW.bw - 2 - lx, b.bx + 1, b.by], ['u', ly, b.bx, b.by - 1], ['d', OW.bh - 2 - ly, b.bx, b.by + 1]]
            .filter(([s, dd, nx, ny]) => dd < b.soft + 1 && OW.blocks[nx + ',' + ny] && OWA.owns(b, OW.blocks[nx + ',' + ny]))
            .sort((m, n) => m[1] - n[1])[0];
        if (!near) continue;
        const n = OW.blocks[near[2] + ',' + near[3]], looks = n.forest || ['tree', 'tree2'];
        if (hash2(e.x, e.y, 41) < 0.75 - near[1] / (b.soft + 1) * 0.6) e.look = looks[Math.floor(hash2(e.x, e.y, 43) * looks.length)];
    }
    /* each block's own ground and overlays */
    const g0 = d.drawGround, o0 = d.drawOver;
    d.drawGround = (a, cx, cy) => { if (g0) g0(a, cx, cy); for (const b of Object.values(OW.blocks)) if (b.drawGround) b.drawGround(a, cx, cy); };
    d.drawOver = (a, cx, cy) => { if (o0) o0(a, cx, cy); for (const b of Object.values(OW.blocks)) if (b.drawOver) b.drawOver(a, cx, cy); };
});

/* ---------- wading: rings round Wren's feet in shallow water, her ankles in it ---------- */
{
    const draw0 = Player.prototype.draw;
    Player.prototype.draw = function (cx, cy) {
        draw0.call(this, cx, cy);
        const a = this.area;
        if (!a || this.hidden || this.state === 'fall' || this.z > 0 || this.flying || this.ride) return;
        const k = a.kind(this.tx, this.ty);
        if (!(k.water && k.slow)) return;
        if (this.blink && this.inv > 0 && this.state === 'normal' && (this.inv >> 2) % 2 && this.inv < 69) return;
        const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
        const tn = a.def.themeAt ? a.def.themeAt(this.tx, this.ty) : a.themeName, th = THEMES[OWA.styleOf[tn] || tn] || a.theme;
        const wcol = (th.water || THEMES.town.water);
        /* the water over her feet */
        Gfx.alpha(0.55); Gfx.rect(x - 6, y - 1, 12, 3, wcol[0]); Gfx.alpha(1);
        Gfx.rect(x - 5, y - 1, 10, 1, wcol[2]);
        /* rings spreading as she moves (still, a slow one) */
        const t = this.walking ? (G.t % 24) / 24 : (G.t % 60) / 60;
        const r = 5 + t * (this.walking ? 6 : 4);
        Gfx.alpha(0.75 * (1 - t));
        for (let i = 0; i < 16; i++) { const an = i / 16 * Math.PI * 2; Gfx.rect(x + Math.cos(an) * r, y + 1 + Math.sin(an) * r * 0.45, 1, 1, '#eaf8ff'); }
        Gfx.alpha(1);
        if (this.walking && (G.t >> 3) % 2) { Gfx.rect(x - 7 + ((G.t >> 2) % 3), y - 2, 1, 1, '#ffffff'); Gfx.rect(x + 6 - ((G.t >> 2) % 3), y - 3, 1, 1, '#ffffff'); }
    };
}

/* ---------- rock, drawn by the kit's cliffs: o = { band: [heights...], tint: colours, joint, lip, moss, blocks, seed } ---------- */
OWA.rockFace = function (x, th, v, m, o = {}) {
    const [s0, s1, s2, s3] = th.stone;
    const up = +m[1], above = m[2], below = m[3], l = m[4], r = m[5];
    const sd = o.seed || 1;
    /* bands of rock across the face: the same heights all along a row of face, so they run on tile to tile */
    const bands = (up === 2 ? o.band2 : o.band1) || (up === 2 ? [0, 5, 10] : [0, 4, 8, 12]);
    const tint = o.tint || [s0, mix(s0, s1, 0.5), s1];
    for (let bi = 0; bi < bands.length; bi++) {
        const y0 = bands[bi], y1 = bi + 1 < bands.length ? bands[bi + 1] : 16, c = tint[(bi + up) % tint.length];
        fill(x, c, 0, y0, 16, y1 - y0);
        speckle(x, [mix(c, s2, 0.35)], sd * 7 + v * 3 + bi, 0.08, 0, y0, 16, y1 - y0);
        speckle(x, [mix(c, s1, 0.5)], sd * 5 + v + bi * 9, 0.10, 0, y0, 16, y1 - y0);
        fill(x, mix(c, s2, 0.55), 0, y0, 16, 1);                                  /* each layer's lit top */
        if (y1 - y0 > 2) fill(x, mix(c, s3, 0.55), 0, y1 - 1, 16, 1);           /* and its shadowed foot */
        /* joints: vertical cracks, a few per band (blocks: more of them) */
        const n = o.blocks ? 2 : 1;
        for (let j = 0; j < n; j++) {
            const jx = Math.floor(hash2(v * 5 + j, bi + up * 7, sd) * 15) + (o.blocks ? j * 8 : 0);
            if (jx > 15 || hash2(v, bi * 3 + j, sd + 2) < (o.blocks ? 0.1 : 0.35)) continue;
            fill(x, o.joint || s3, jx % 16, y0 + 1, 1, Math.max(1, y1 - y0 - 1));
            px(x, (jx + 1) % 16, y0 + 1, mix(c, s2, 0.5));
        }
    }
    if (o.moss) for (let i = 0; i < 6; i++) { const mx = Math.floor(hash2(v, i, sd + 11) * 16), my = bands[Math.floor(hash2(i, v, sd + 12) * bands.length)]; if (hash2(mx, my, sd) < 0.6) { px(x, mx, my, o.moss[0]); px(x, (mx + 1) % 16, my, o.moss[1] || o.moss[0]); } }
    if (o.lichen) for (let i = 0; i < 3; i++) { const lx = Math.floor(hash2(v + 3, i, sd + 13) * 14) + 1, ly = Math.floor(hash2(i, v + 3, sd + 14) * 12) + 2; px(x, lx, ly, o.lichen[i % o.lichen.length]); if (i % 2) px(x, lx + 1, ly, o.lichen[0]); }
    /* the top: the ground above hanging over the face (grass, or the plateau's rock), its edge a little ragged */
    if (above !== 'f') {
        const lip = above === 'o' ? (o.lip || th.grass) : (o.rimTop || [s2, s0, s1]);
        for (let i = 0; i < 16; i++) {
            const h = 2 + (hash2(i, v, sd + 21) < 0.3 ? 1 : 0);
            fill(x, lip[0], i, 0, 1, h); px(x, i, h, mix(lip[0], s3, 0.6));
            if (hash2(i, v, sd + 22) < 0.35) px(x, i, h + 1, mix(s1, s3, 0.4));
        }
        fill(x, lip[2] || shade(lip[0], 0.3), 0, 0, 16, 1);
    }
    /* the foot: shadow, and a little scree */
    if (below === 'o') {
        fill(x, mix(s1, s3, 0.6), 0, 14, 16, 1); fill(x, shade(s3, -0.25), 0, 15, 16, 1);
        for (let i = 0; i < 3; i++) { const sx = Math.floor(hash2(v, i, sd + 31) * 14); px(x, sx, 13, s0); px(x, sx + 1, 13, s2); px(x, sx, 14, s1); }
    }
    /* corners where the face ends (lit on the left, shadowed on the right) */
    if (l === 'o' || l === 't') { fill(x, shade(s3, -0.3), 0, 0, 1, 16); fill(x, mix(s2, s0, 0.4), 1, 0, 1, 16); }
    if (r === 'o' || r === 't') { fill(x, mix(s1, s3, 0.5), 13, 0, 2, 16); fill(x, shade(s3, -0.3), 15, 0, 1, 16); }
};
/* the top of a plateau's edge: rock with tufts in its cracks (o.surface paints something else), rimmed where it falls away */
OWA.rockTop = function (x, th, v, m, o = {}) {
    const [s0, s1, s2, s3] = th.stone;
    const u = m[1] === 'u', d = m[2] === 'd', l = m[3], r = m[4];
    const sd = o.seed || 1;
    if (o.surface) o.surface(x, th, v);
    else {
        const base = o.topCol || mix(s0, s2, 0.25);
        fill(x, base);
        speckle(x, [mix(base, s1, 0.5)], sd * 3 + v, 0.18);
        speckle(x, [mix(base, s2, 0.6)], sd * 4 + v, 0.08);
        /* slabs: a few cracks */
        for (let i = 0; i < 3; i++) {
            const cx = Math.floor(hash2(v, i, sd + 41) * 13) + 1, cy = Math.floor(hash2(i, v, sd + 42) * 13) + 1, len = 2 + Math.floor(hash2(v + i, 3, sd) * 4);
            for (let k = 0; k < len; k++) px(x, Math.min(15, cx + k), Math.min(15, cy + (k > 1 && i % 2 ? 1 : 0)), mix(base, s3, 0.55));
        }
        if (o.tuft) for (let i = 0; i < 2; i++) { const tx = 2 + Math.floor(hash2(v, i, sd + 51) * 12), ty = 3 + Math.floor(hash2(i, v, sd + 52) * 10); px(x, tx, ty, o.tuft[0]); px(x, tx + 1, ty - 1, o.tuft[1] || o.tuft[0]); px(x, tx - 1, ty - 1, o.tuft[0]); }
    }
    /* behind: a drop to lower ground (a dark edge and a glimpse of the back of the rock) */
    if (u) { fill(x, shade(s3, -0.3), 0, 0, 16, 1); fill(x, mix(s1, s3, 0.4), 0, 1, 16, 1); }
    if (d) { fill(x, mix(s1, s3, 0.5), 0, 14, 16, 1); fill(x, shade(s3, -0.3), 0, 15, 16, 1); }
    /* sides: a lit rim falling away to the west, a shadowed one to the east */
    if (l === 'o') { fill(x, shade(s3, -0.3), 0, 0, 1, 16); fill(x, mix(s2, '#ffffff', 0.2), 1, 0, 1, 16); fill(x, mix(s0, s2, 0.5), 2, 0, 1, 16); }
    if (r === 'o') { fill(x, mix(s1, s3, 0.35), 12, 0, 2, 16); fill(x, mix(s1, s3, 0.7), 14, 0, 1, 16); fill(x, shade(s3, -0.3), 15, 0, 1, 16); }
    if (l === 'f') fill(x, mix(s1, s3, 0.5), 0, 0, 1, 16);
    if (r === 'f') fill(x, mix(s1, s3, 0.5), 15, 0, 1, 16);
};
