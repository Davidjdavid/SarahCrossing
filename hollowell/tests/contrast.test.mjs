// Threads read on every House's floors (POLISH.md findings 47 and 53): every House's thread, its empty marks and its
// patience rings, measured against that House's own floor as the game paints it, tile by tile, and the dark
// under-stroke that every stitch is drawn over checked in the drawing itself. The pictures are painted headless into
// a little software canvas (fillRect with alpha is all the floor painters and thread strokes use).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

/* ---------- a software canvas: fillStyle, globalAlpha, fillRect (and drawImage of another one) ---------- */
function parseCol(s) {
    if (typeof s !== 'string') return null;
    let m = /^#([0-9a-f]{3})$/i.exec(s);
    if (m) return [...m[1]].map(c => parseInt(c + c, 16)).concat(1);
    m = /^#([0-9a-f]{6})$/i.exec(s);
    if (m) return [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16)).concat(1);
    m = /^rgba?\(([^)]*)\)$/i.exec(s);
    if (m) { const v = m[1].split(',').map(Number); return [v[0], v[1], v[2], v.length > 3 ? v[3] : 1]; }
    return null;
}
class Soft {
    constructor(w, h) { this.width = w; this.height = h; this.px = new Float64Array(w * h * 3); this.set = new Uint8Array(w * h); this.fillStyle = '#000000'; this.globalAlpha = 1; this.log = null; this.unknown = new Set(); }
    getContext() { return this; }
    fillRect(x, y, w, h) {
        const c = parseCol(this.fillStyle);
        if (!c) { this.unknown.add(String(this.fillStyle)); return; }
        const a = c[3] * this.globalAlpha;
        x = Math.round(x); y = Math.round(y);
        for (let j = Math.max(0, y); j < Math.min(this.height, y + h); j++) for (let i = Math.max(0, x); i < Math.min(this.width, x + w); i++) {
            const k = j * this.width + i;
            for (let n = 0; n < 3; n++) this.px[k * 3 + n] = this.set[k] ? c[n] * a + this.px[k * 3 + n] * (1 - a) : c[n];
            this.set[k] = 1;
            if (this.log) this.log.push([i, j, this.fillStyle, a]);
        }
    }
    drawImage(src, ...a) {
        if (!(src instanceof Soft)) return;
        const [dx, dy] = a.length >= 8 ? [a[4], a[5]] : [a[0], a[1]];
        for (let j = 0; j < src.height; j++) for (let i = 0; i < src.width; i++) {
            const k = j * src.width + i, X = Math.round(dx) + i, Y = Math.round(dy) + j;
            if (!src.set[k] || X < 0 || Y < 0 || X >= this.width || Y >= this.height) continue;
            const q = Y * this.width + X; for (let n = 0; n < 3; n++) this.px[q * 3 + n] = src.px[k * 3 + n]; this.set[q] = 1;
        }
    }
    at(i, j) { const k = j * this.width + i; return this.set[k] ? [0, 1, 2].map(n => Math.round(this.px[k * 3 + n])) : null; }
    clearRect() { this.set.fill(0); }
    save() { } restore() { } translate() { } scale() { } beginPath() { } closePath() { } moveTo() { } lineTo() { } arc() { } fill() { } stroke() { } rect() { } quadraticCurveTo() { }
}

/* ---------- colour difference: CIE76 in CIELAB (D65) ---------- */
function lab([r, g, b]) {
    const f = c => { c /= 255; return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92; };
    const R = f(r), G = f(g), B = f(b);
    const X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047, Y = R * 0.2126 + G * 0.7152 + B * 0.0722, Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
    const h = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
    return [116 * h(Y) - 16, 500 * (h(X) - h(Y)), 200 * (h(Y) - h(Z))];
}
const dE = (p, q) => { const A = lab(p), B = lab(q); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };
const over = ([r, g, b, a], base) => [r, g, b].map((c, i) => c * a + base[i] * (1 - a));

/* The bar, and why: a stitch is 1 px; the first fix round set CIE76 40 as what a 1 px line needs to read (its audit of
   Houses 1-2), and the picture reviews bear it out: on the tenth of their floors where they fared worst, the threads
   reported unreadable measured 5 (the Spoolworks), 17 (the Loom) and 21 (the Slumberhouse), the marginal-looking
   Unfinished House's 23, and the ones nobody flagged 40 and up (the Belfry 40, the Tidyhouse 45, the Kiln 51). With
   the dark under-stroke a stitch reads if its colour stands out from the floor, or if the dark does and the colour
   stands out from the dark (a light cord on a dark one). On nine-tenths of every House's floor, and of every floor it
   lays in more than a few rooms, every stitch must reach the bar. */
const BAR = 40, SHARE = 0.9;
function reads(col, under, base) {
    const c = over(col, base), u = over(under, base);
    return Math.max(dE(c, base), Math.min(dE(u, base), dE(c, u)));
}
const SPECIAL = new Set(['flowers', 'tallgrass', 'water', 'deep', 'current', 'pit', 'cliff', 'ledge', 'bridgeH', 'bridgeV', 'stairs', 'fog', 'void', 'forest', 'spikes', 'wall']);

/* each threaded area's floor tiles, painted by its own painters as the game paints them: { 'tn:p': { n, pixels } } */
function floorsOf(HW, id) {
    const Area = HW.global('Area'), AREAS = HW.global('AREAS'), TileDraw = HW.global('TileDraw'), THEMES = HW.global('THEMES'), Paint = HW.global('Paint'), hash2 = HW.global('hash2');
    const a = new Area(AREAS[id]), kinds = new Map(), cache = new Map(), bad = new Set();
    for (let ty = 0; ty < a.h; ty++) for (let tx = 0; tx < a.w; tx++) {
        const L = a.cell(tx, ty);
        if (L.k !== 'floor' || SPECIAL.has(L.p)) continue;
        const tn = a.def.themeAt ? a.def.themeAt(tx, ty) : a.themeName, v = Math.floor(hash2(tx, ty, 99) * 4), key = tn + ':' + L.p + ':' + v;
        let t = cache.get(key);
        if (!t) {
            t = new Soft(16, 16);
            const th = THEMES[tn] || a.theme;
            /* (as TileDraw.draw: the ground painters by name, everything else the theme's floor painters) */
            if (['grass', 'path', 'cobble', 'sand'].includes(L.p)) Paint[L.p](t, th, v); else TileDraw.floor(t, a, L.p, v, tn);
            if (t.unknown.size) bad.add([...t.unknown].join(' '));
            assert.ok(t.set.every(Boolean), `${id} ${key}: the floor painter left pixels unpainted (or drew what this canvas can't)`);
            cache.set(key, t);
        }
        const k = tn + ':' + L.p, e = kinds.get(k) || { n: 0, tiles: [] };
        e.n++; e.tiles.push(t); kinds.set(k, e);
    }
    assert.equal(bad.size, 0, `${id}: colours this canvas can't read: ${[...bad]}`);
    return kinds;
}
/* how a set of stitches fares on a floor: the share of its pixels where they read, and the worst tenth's score */
function score(tiles, strokes) {
    const vals = [];
    for (const t of tiles) for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
        const base = t.at(i, j);
        vals.push(Math.min(...strokes.map(([col, under]) => reads(col, under, base))));
    }
    vals.sort((p, q) => p - q);
    return { share: vals.filter(v => v >= BAR).length / vals.length, p10: vals[Math.floor(vals.length * 0.1)] };
}

test('every House\'s threads, empty marks and patience rings read on its own floors', () => {
    const HW = loadGame();
    const AREAS = HW.global('AREAS'), Threads = HW.global('Threads'), shade = HW.global('shade'), hexRGB = HW.global('hexRGB');
    const under = parseCol(Threads.UNDER);
    const ids = Object.keys(AREAS).filter(id => AREAS[id].thread && !id.startsWith('lab'));
    assert.ok(ids.length >= 20, 'the Houses and every other place with its own thread');
    const report = [];
    for (const id of ids) {
        const thread = AREAS[id].thread, rgb = h => hexRGB(h).concat(1);
        /* the thread (and drawn tight, about to go home), an empty mark's stitches, a patience ring's (at 0.85, its
           under-stroke with it); a creature's trail is the same cord at full strength, every other stitch */
        const strokes = [[rgb(thread), under], [rgb(shade(thread, 0.4)), under], [hexRGB(thread).concat(0.85), [under[0], under[1], under[2], under[3] * 0.85]]];
        const kinds = floorsOf(HW, id), all = [...kinds.values()], total = all.reduce((s, k) => s + k.n, 0);
        assert.ok(total > 0, id + ' has floor');
        const whole = score(all.flatMap(k => k.tiles), strokes);
        report.push(`${id} ${whole.p10.toFixed(1)}`);
        assert.ok(whole.share >= SHARE, `${id}: its thread reads on only ${(whole.share * 100).toFixed(0)}% of its floor (the worst tenth scores ${whole.p10.toFixed(1)}, under ${BAR})`);
        for (const [k, e] of kinds) {
            if (e.n < Math.max(12, total * 0.05)) continue;
            const s = score(e.tiles, strokes);
            assert.ok(s.share >= SHARE, `${id}, floor ${k} (${e.n} tiles): its thread reads on only ${(s.share * 100).toFixed(0)}% of it (worst tenth ${s.p10.toFixed(1)})`);
        }
    }
    if (process.env.CONTRAST_REPORT) console.log(report.join('\n'));
});

test('every stitch is drawn over its dark under-stroke: threads every way they run, marks, rings and creatures\' trails', () => {
    const HW = loadGame();
    const Gfx = HW.global('Gfx'), Threads = HW.global('Threads'), Marks = HW.global('Marks');
    const col = '#3fc1b5', ink = Threads.UNDER;
    const draw = fn => {
        const s = new Soft(96, 96); s.fillStyle = '#808080'; s.fillRect(0, 0, 96, 96); s.log = [];
        const c0 = Gfx.ctx; Gfx.ctx = s; try { fn(); } finally { Gfx.ctx = c0; }
        const top = new Map(); for (const [i, j, f] of s.log) top.set(i + ',' + j, f);   /* (what's left on top at each pixel) */
        return top;
    };
    const check = (what, top) => {
        let n = 0;
        for (const [k, f] of top) {
            if (f !== col) continue;
            n++;
            const [i, j] = k.split(',').map(Number);
            /* (below it or to its right; where a thread turns, the corner's dark is a pixel down and right) */
            assert.ok([[0, 1], [1, 0], [1, 1]].some(([di, dj]) => top.get((i + di) + ',' + (j + dj)) === ink), `${what}: the stitch at ${i},${j} has no dark under it or to its right`);
        }
        assert.ok(n > 4, what + ' drawn');
    };
    /* straight, steep, shallow, diagonal both ways, and bent back on itself (no stretch's shadow over the line) */
    for (const pts of [[[10, 10], [80, 10]], [[10, 10], [10, 80]], [[10, 10], [80, 30]], [[10, 10], [30, 80]], [[10, 10], [60, 60]], [[60, 10], [10, 60]],
        [[10, 40], [70, 40], [70, 80], [20, 80], [20, 50]], [[70, 10], [10, 10], [10, 70], [80, 70], [40, 20]]]) check('a thread ' + JSON.stringify(pts), draw(() => Threads.path(pts, col)));
    check('an empty mark', draw(() => Marks.draw(40, 40, col, true)));
    check('a patience ring', draw(() => Threads.ring(48, 48, 1, col, false)));
    check('a creature\'s trail', draw(() => Threads.dotted([[10, 10], [70, 10], [70, 60], [20, 80]], col)));
});
