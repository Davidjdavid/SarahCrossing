/* ---- 32_hd.js ---- */
/* HD-2D characters: people and neighbors drawn with three times the detail (48x72 for a person) for the HD-2D view.
   Every part is a filled shape with a material (five shades of one color); the light from the top left, the rounded
   form and the outlines are worked out per pixel (the art sample's method), so any color a player picks for hair, skin
   or clothes shades properly. The classic view, menus and the flat edit modes keep the 16x24 sprites. */
const HD_K = 3;                                   // HD pixels per world pixel
const HD_LIGHT = (() => { const v = [-0.55, -0.7, 0.62], l = Math.hypot(...v); return v.map(c => c / l); })();

/* ---------------------------------------------------------------- colors */
function hdRgb(h) {
    if (Array.isArray(h)) return h;
    if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
function hdHsl([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    if (mx === mn) return [0, 0, l];
    const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, s, l];
}
function hdFromHsl(h, s, l) {
    h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l));
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
    const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
function hdHue(h, toward, d) { let diff = ((toward - h + 540) % 360) - 180; return h + Math.sign(diff) * Math.min(Math.abs(diff), d); }
/* five shades of one color: [outline, shadow, base, light, highlight]; shadows lean cool, lights warm */
const HD_RAMPS = new Map();
function hdRamp(hex) {
    const key = Array.isArray(hex) ? hex.join(',') : hex;
    let r = HD_RAMPS.get(key);
    if (r) return r;
    const base = hdRgb(hex), [h, s, l] = hdHsl(base), grey = s < 0.08;
    const sh = (dh, ds, nl) => hdFromHsl(grey ? h : hdHue(h, dh > 0 ? 50 : 265, Math.abs(dh)), grey ? s + (dh < 0 ? 0.06 : 0) : s + ds, nl);
    r = [sh(-10, Math.min(0.04, 0.72 - s), l * 0.42), sh(-5, Math.min(0.05, 0.88 - s), l * (l > 0.8 ? 0.8 : 0.74)), base, sh(4, 0, l + Math.min(0.1, (1 - l) * 0.55)), sh(9, 0.06, l + Math.min(0.19, (1 - l) * 0.85))];
    HD_RAMPS.set(key, r);
    return r;
}
/* skin: the color picked at the salon is the lit side, so faces don't wash out to white */
function hdSkin(hex) {
    const key = 'skin' + hex;
    let r = HD_RAMPS.get(key);
    if (r) return r;
    const [h, s, l] = hdHsl(hdRgb(hex)), bl = l - 0.06 * Math.min(1, l / 0.5);
    // (light skin is very saturated in HSL terms: the dark shades get much less, or the outline turns red)
    r = [hdFromHsl(h - 6, Math.min(s, 0.42), bl * 0.46), hdFromHsl(h - 4, Math.min(s + 0.04, 0.62), bl * 0.86), hdFromHsl(h - 1, s + 0.04, bl), hdRgb(hex), hdFromHsl(h + 3, s, Math.min(0.95, l + 0.05))];
    HD_RAMPS.set(key, r);
    return r;
}
/* a ramp given as five hex colors (hand-picked palettes) */
function hdPal(...hs) { return hs.map(hdRgb); }

/* ---------------------------------------------------------------- the sprite: parts, then per-pixel shading */
class HDSprite {
    constructor(w, h) { this.w = w; this.h = h; const n = w * h; this.part = new Int16Array(n).fill(-1); this.parts = []; this.det = []; this.mods = new Int8Array(n); this.alt = null; this.alts = []; this.dy = 0; this.dx = 0; this.warp = null; }
    /* mat: a ramp (hdRamp/hdPal) or one hex color; o: layer (higher is in front), R (roundness radius), grad (top-to-bottom
       light), bias (lighter/darker), cast (shadow cast onto lower layers below it), flat, k (form strength) */
    add(mat, o) {
        o = o || {};
        if (typeof mat === 'string') mat = hdRamp(mat);
        this.parts.push({ mat, layer: o.layer || 0, R: o.R || 5, bias: o.bias || 0, cast: o.cast || 0, flat: o.flat || 0, grad: o.grad === undefined ? 0.18 : o.grad, k: o.k || 1.25 });
        return this.parts.length - 1;
    }
    /* a 3/4 view: everything drawn is squeezed on one side of x = c and moved by sh (warp = { c, kl, kr, sh } or null),
       so a front or back drawing turns a little to one side */
    X(x) { const w = this.warp; return w ? w.c + w.sh + (x - w.c) * (x < w.c ? w.kl : w.kr) : x; }
    K(x) { const w = this.warp; return w ? (x < w.c ? w.kl : w.kr) : 1; }
    _p(id, x, y) { x = Math.round(x + this.dx); y = Math.round(y + this.dy); if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; this.part[y * this.w + x] = id; }
    plot(id, x, y) { this._p(id, this.warp ? this.X(x + 0.5) - 0.5 : x, y); }
    at(x, y) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return -1; return this.part[y * this.w + x]; }
    _ellipse(id, cx, cy, rx, ry) {
        for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
            const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry; if (u * u + v * v <= 1) this._p(id, x, y);
        }
    }
    ellipse(id, cx, cy, rx, ry) {
        if (!this.warp) return this._ellipse(id, cx, cy, rx, ry);
        const pts = [];
        for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
        this.poly(id, pts);
    }
    poly(id, pts) {
        if (this.warp) pts = pts.map(p => [this.X(p[0]), p[1]]);
        let y0 = 1e9, y1 = -1e9; for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
        for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
            const yc = y + 0.5, xs = [];
            for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) xs.push(a[0] + (yc - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); }
            xs.sort((p, q) => p - q);
            for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) this._p(id, x, y);
        }
    }
    rect(id, x, y, w, h) { if (this.warp) return this.poly(id, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this._p(id, x + i, y + j); }
    /* a thick line between two points (limbs, strands); r may taper to r1 */
    line(id, x0, y0, x1, y1, r, r1) {
        r1 = r1 == null ? r : r1;
        const k0 = this.K(x0), k1 = this.K(x1);
        if (this.warp) { x0 = this.X(x0); x1 = this.X(x1); }
        const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2) + 1;
        for (let i = 0; i <= n; i++) { const t = i / n, rr = r + (r1 - r) * t, k = k0 + (k1 - k0) * t; this._ellipse(id, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, rr * (k < 1 ? 0.5 + k / 2 : 1), rr); }
    }
    erase(x, y) { this.plot(-1, x, y); }
    /* nudge the shade of one pixel (+1 lighter, -1 darker) */
    mod(x, y, d) { if (this.warp) x = this.X(x + 0.5) - 0.5; x = Math.round(x + this.dx); y = Math.round(y + this.dy); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.mods[y * this.w + x] += d; }
    /* paint a pixel of a part in another material with the same shading (patterns, prints, two-tone hair) */
    recolor(x, y, mat) {
        x = Math.round(x + this.dx); y = Math.round(y + this.dy);
        if (x < 0 || y < 0 || x >= this.w || y >= this.h || this.part[y * this.w + x] < 0) return;
        if (typeof mat === 'string') mat = hdRamp(mat);
        let k = this.alts.indexOf(mat);
        if (k < 0) { k = this.alts.length; this.alts.push(mat); }
        if (!this.alt) this.alt = new Int16Array(this.w * this.h).fill(-1);
        this.alt[y * this.w + x] = k;
    }
    /* which part a pixel belongs to, and the pixels of a part (for recoloring) */
    each(id, fn) { for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.part[y * this.w + x] === id) fn(x, y); }
    /* exact pixels drawn last (eyes, mouth, buttons): c is a hex color or [r,g,b] */
    px(x, y, c) { if (c) this.det.push([Math.round((this.warp ? this.X(x + 0.5) - 0.5 : x) + this.dx), Math.round(y + this.dy), hdRgb(c)]); }
    /* the shaded picture into an RGBA buffer (w*h*4) at column ox (or a fresh one) */
    render(out, ox, OW) {
        const W = this.w, H = this.h, P = this.part, n = W * H;
        OW = OW || W; ox = ox || 0;
        if (!out) out = new Uint8ClampedArray(W * H * 4);
        const dist = new Float32Array(n), q = [];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const i = y * W + x, p = P[i]; if (p < 0) continue;
            if (this.at(x - 1, y) !== p || this.at(x + 1, y) !== p || this.at(x, y - 1) !== p || this.at(x, y + 1) !== p) { dist[i] = 1; q.push(i); }
        }
        for (let qi = 0; qi < q.length; qi++) {
            const i = q[qi], x = i % W, y = (i / W) | 0, p = P[i];
            for (let k = 0; k < 4; k++) {
                const nx = x + (k === 0 ? 1 : k === 1 ? -1 : 0), ny = y + (k === 2 ? 1 : k === 3 ? -1 : 0);
                if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
                const j = ny * W + nx; if (P[j] === p && dist[j] === 0) { dist[j] = dist[i] + 1; q.push(j); }
            }
        }
        const bnd = this.parts.map(() => [1e9, -1e9]);
        for (let i = 0; i < n; i++) { const p = P[i]; if (p < 0) continue; const y = (i / W) | 0; if (y < bnd[p][0]) bnd[p][0] = y; if (y > bnd[p][1]) bnd[p][1] = y; }
        const hgt = new Float32Array(n);
        for (let i = 0; i < n; i++) { const p = P[i]; if (p < 0) continue; const t = Math.min(1, (dist[i] - 0.5) / this.parts[p].R); hgt[i] = 1 - (1 - t) * (1 - t); }
        const H_ = (x, y, p) => (x < 0 || y < 0 || x >= W || y >= H || P[y * W + x] !== p) ? 0 : hgt[y * W + x];
        const idx = new Int8Array(n);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const i = y * W + x, p = P[i]; if (p < 0) continue; const pt = this.parts[p];
            const gx = H_(x + 1, y, p) - H_(x - 1, y, p), gy = H_(x, y + 1, p) - H_(x, y - 1, p);
            let nx = -gx * pt.k, ny = -gy * pt.k, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
            let s = nx * HD_LIGHT[0] + ny * HD_LIGHT[1] + nz * HD_LIGHT[2];
            const b = bnd[p], yr = b[1] > b[0] ? (y - b[0]) / (b[1] - b[0]) : 0.5;
            s += (0.5 - yr) * pt.grad + pt.bias;
            if (pt.flat) s = 0.62 + pt.bias + (0.5 - yr) * pt.grad;
            let k = s < 0.5 ? 1 : s < 0.7 ? 2 : s < 0.86 ? 3 : 4;
            // a shadow cast by a part in front, just above (hair over the forehead, a chin over the neck)
            for (let d = 1; d <= 2; d++) { const a = this.at(x, y - d); if (a >= 0 && a !== p && this.parts[a].layer > pt.layer && this.parts[a].cast >= d) { k--; break; } }
            // a part tucked behind a neighbour darkens along the seam
            for (let kk = 0; kk < 4; kk++) { const a = this.at(x + (kk === 0 ? 1 : kk === 1 ? -1 : 0), y + (kk === 2 ? 1 : kk === 3 ? -1 : 0)); if (a >= 0 && a !== p && this.parts[a].layer > pt.layer) { k--; break; } }
            k += this.mods[i];
            idx[i] = k < 1 ? 1 : k > 4 ? 4 : k;
        }
        // the silhouette: the darkest shade on the shadowed sides, a softer one where it faces the light
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const i = y * W + x; if (P[i] < 0) continue;
            const r = this.at(x + 1, y) < 0, b = this.at(x, y + 1) < 0, l = this.at(x - 1, y) < 0, t = this.at(x, y - 1) < 0;
            if (r || b) idx[i] = 0; else if (l || t) idx[i] = Math.max(1, idx[i] - 1) === 1 ? 0 : Math.max(1, idx[i] - 2);
        }
        const put = (x, y, c) => { const o = (y * OW + ox + x) * 4; out[o] = c[0]; out[o + 1] = c[1]; out[o + 2] = c[2]; out[o + 3] = 255; };
        const A = this.alt;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x, p = P[i]; if (p >= 0) put(x, y, (A && A[i] >= 0 ? this.alts[A[i]] : this.parts[p].mat)[idx[i]]); }
        for (const [x, y, c] of this.det) if (x >= 0 && y >= 0 && x < W && y < H) put(x, y, c);
        return out;
    }
    canvas() {
        const c = document.createElement('canvas'); c.width = this.w; c.height = this.h;
        const g = c.getContext('2d'), img = g.createImageData(this.w, this.h);
        this.render(img.data);
        g.putImageData(img, 0, 0);
        return c;
    }
}
/* one sprite drawn over another (an accessory over a person): both the same size */
function hdStack(base, over) {
    const g = base.getContext('2d');
    g.drawImage(over, 0, 0);
    return base;
}

/* ---------------------------------------------------------------- what gets drawn (filled in by 32a..32z) */
const HD_NPC = {};       // neighbor sprite id -> { h (canvas height), ay, draw(s, f), hat: [x, y, w], eye: [x, y, dx] }
const HD_HAIR = {};      // hair style -> draw(s, g): adds hair parts around the head g (see 32a_hd_people.js)
const HD_ACC = {};       // accessory id -> { eye: true for glasses and the like, draw(s, a) }
const HD_SPR = {};       // atlas frame name -> { w, h, ax, ay, draw(s) } in HD pixels (three times the old frame, same anchor x3)

/* finished frames, kept a while: { c, w, h, ax, ay } */
const HD_CACHE = new Map();
const HD_CACHE_BYTES = { now: 0, max: 48e6 };
function hdCached(key, make) {
    if (HD_CACHE.has(key)) { const f = HD_CACHE.get(key); HD_CACHE.delete(key); HD_CACHE.set(key, f); return f; }
    let f;
    try { f = make(); if (f) { f.key = key; f.bytes = f.w * f.h * 4; } } catch (e) { console.error(e); f = null; }
    HD_CACHE.set(key, f);                    // a drawing that failed stays null (it isn't tried again every frame)
    HD_CACHE_BYTES.now += f ? f.bytes : 0;
    // the least recently used go first, once the pictures take more than a phone should hold
    while (HD_CACHE_BYTES.now > HD_CACHE_BYTES.max && HD_CACHE.size > 1) {
        const k = HD_CACHE.keys().next().value, old = HD_CACHE.get(k);
        HD_CACHE.delete(k);
        HD_CACHE_BYTES.now -= old ? old.bytes : 0;
    }
    return f;
}
/* draw a frame at a world spot (x, y = the anchor), into a canvas scaled HD_K to one (an R3 card) */
function hdDraw(ctx, f, x, y, flip) {
    if (!f) return;
    if (R3.sig) { R3.sig.push(f.key, x, y, flip ? 1 : 0); R3.sigN++; }
    const k = HD_K, dx = Math.round(x * k) / k - (flip ? f.w - 1 - f.ax : f.ax) / k, dy = Math.round(y * k) / k - f.ay / k;
    if (flip) { ctx.save(); ctx.translate(dx + f.w / k, dy); ctx.scale(-1, 1); ctx.drawImage(f.c, 0, 0, f.w / k, f.h / k); ctx.restore(); }
    else ctx.drawImage(f.c, dx, dy, f.w / k, f.h / k);
}
/* a sprite name as an HD frame, when there is one: a remastered prop (HD_SPR) or a neighbor ("floret_1") */
function hdNamed(name) {
    // a house drawn from its look (Sarah's, and any Ginger repainted): the HD house from the same look
    if (name.charCodeAt(0) === 104 && name.startsWith('hx_') && typeof hdHouseFrame === 'function') { const x = Assets.dyn[name]; return x && x.key ? hdHouseFrame(x.key) : null; }
    const d = HD_SPR[name];
    if (d) return hdCached('s|' + name, () => { const s = new HDSprite(d.w, d.h); d.draw(s); return { c: s.canvas(), w: d.w, h: d.h, ax: d.ax, ay: d.ay }; });
    const m = /^([a-z]+)_([01])$/.exec(name);
    return m && HD_NPC[m[1]] ? hdNpcFrame(m[1], m[2] === '1') : null;
}
/* is the HD art in use for the card being drawn right now? */
function hdOn() { return R3.drawingCard && R3.hdCard; }

/* a neighbor's frame (with an accessory they're wearing), cached: { c, w, h, ax, ay } */
function hdNpcFrame(id, squash, acc, blink, sway) {
    const def = HD_NPC[id];
    if (!def) return null;
    if (sway) return hdCached(`n|${id}|${squash ? 1 : 0}|${acc || ''}|${blink ? 1 : 0}|${sway}`, () => hdSway(hdNpcFrame(id, squash, acc, blink), sway));
    return hdCached(`n|${id}|${squash ? 1 : 0}|${acc || ''}|${blink ? 1 : 0}`, () => {
        const h0 = def.h || 72, ay0 = def.ay || 69;
        const s = new HDSprite(48, h0);
        def.draw(s, { squash: squash ? 1 : 0, blink: blink ? 1 : 0 });
        let c = s.canvas();
        const A = acc && HD_ACC[acc];
        // a hat on a head near the top of the frame (the ghost's) gets room above it
        const room = A && !A.eye && def.hat ? Math.max(0, Math.ceil((A.rise || 0) * 1.35) - def.hat[1] + 1) : 0, h = h0 + room;
        if (room) { const t = document.createElement('canvas'); t.width = 48; t.height = h; t.getContext('2d').drawImage(c, 0, room); c = t; }
        if (A && def.hat && def.eye) {
            const sq = squash ? (def.squashDy != null ? def.squashDy : 2) : 0;
            const a = { dir: def.side ? 'side' : 'down', cx: def.hat[0], top: def.hat[1] + sq, w: def.hat[2], eyeX: def.eye[0], eyeY: def.eye[1] + sq, eyeDx: def.eye[2], faceX: def.faceX || def.eye[0] + def.eye[2] + 4, person: false };
            const s2 = new HDSprite(48, h);
            s2.dy = room;
            A.draw(s2, a);
            hdStack(c, s2.canvas());
        }
        return { c, w: 48, h, ax: 24, ay: ay0 + room };
    });
}
/* a frame leaning a little to one side (an idle sway): the top shifts by up to two pixels, the feet stay put */
function hdSway(f, k) {
    if (!f) return null;
    const c = document.createElement('canvas'); c.width = f.w; c.height = f.h;
    const g = c.getContext('2d'), src = f.c.getContext('2d').getImageData(0, 0, f.w, f.h), out = g.createImageData(f.w, f.h);
    let top = 0;
    for (; top < f.h; top++) { let any = false; for (let x = 0; x < f.w; x++) if (src.data[(top * f.w + x) * 4 + 3]) { any = true; break; } if (any) break; }
    const base = f.ay - 3;
    for (let y = 0; y < f.h; y++) {
        const sh = Math.round(k * 2 * Math.max(0, Math.min(1, (base - y) / Math.max(1, base - top))));
        for (let x = 0; x < f.w; x++) {
            const sx = x - sh;
            if (sx < 0 || sx >= f.w) continue;
            const i = (y * f.w + x) * 4, j = (y * f.w + sx) * 4;
            out.data[i] = src.data[j]; out.data[i + 1] = src.data[j + 1]; out.data[i + 2] = src.data[j + 2]; out.data[i + 3] = src.data[j + 3];
        }
    }
    g.putImageData(out, 0, 0);
    return { c, w: f.w, h: f.h, ax: f.ax, ay: f.ay };
}
