/* Tiles: what each kind of ground is (solid? water? a pit?) and how it is painted. Tiles are painted
   in code per theme with a seeded texture, so a theme is a palette plus a painter, and the same tile
   always looks the same. Walls, water edges and cliffs pick their look from their neighbours. */

/* behaviour of each tile kind */
const TK = {
    floor: { solid: false },
    grass: { solid: false },
    path: { solid: false },
    sand: { solid: false },
    wall: { solid: true, wall: true },
    cliff: { solid: true, wall: true },
    rock: { solid: true },
    water: { solid: false, water: true, deep: true },      /* deep: you'd sink */
    shallow: { solid: false, water: true, slow: true },
    pit: { solid: false, pit: true },
    ledge: { solid: false, ledge: true },                   /* hop down (south) only */
    bridge: { solid: false },
    bridgew: { solid: false, water: true, over: true },    /* a bridge over moving water: floats go under it */
    stairs: { solid: false },
    tree: { solid: true },
    bush: { solid: true, cut: true },
    fence: { solid: true },
    fog: { solid: false, fog: true },
    void: { solid: true },
    current: { solid: false, water: true, deep: true },     /* flowing water; dir in the map's flow layer */
    spikes: { solid: false, hurt: true },
    ice: { solid: false, ice: true },
    roof: { solid: true },
    prop: { solid: true },
    low: { solid: true, low: true },          /* a counter: blocks walking, things fly over it */
    crawl: { solid: true, crawl: true },      /* a little hole in a wall: puppets and small things through */
};

/* Themes: the palette each painter uses */
const THEMES = {
    town:   { grass: ['#8fd46a', '#7cc35c', '#a9e07f', '#5fa84c'], path: ['#e2c28c', '#cfab74', '#f0d7a6'], stone: ['#b8aa98', '#968878', '#d6cab6', '#6e6458'], wall: ['#c9925a', '#9a6438', '#e6c08a', '#6b4128'], water: ['#5fb5e8', '#3f8fd8', '#a5dcf7', '#2b5aa8'], dark: '#3a5a2a' },
    meadow: { grass: ['#9adb6c', '#84c95a', '#b6e887', '#62ad4c'], path: ['#e6c48e', '#d1ad76', '#f2dcab'], stone: ['#bdb19f', '#9a8e7c', '#dbd0bd', '#70675a'], wall: ['#d8c39a', '#b09868', '#efe0bd', '#7c6a48'], water: ['#62b9ea', '#4190d6', '#a8def7', '#2b5aa8'], dark: '#3a5a2a' },
    kiln:   { grass: ['#d9a067', '#c78a52', '#e8b884', '#a86e3e'], path: ['#e8c69a', '#d3ab7c', '#f3dcb8'], stone: ['#c4623a', '#93432c', '#e08a5e', '#6a2e22'], wall: ['#b8583a', '#8a3c28', '#d67a54', '#5e261c'], water: ['#5fa6c8', '#3f80b0', '#9cd0e8', '#2b5a88'], dark: '#5e261c' },
    water:  { grass: ['#86d07a', '#6fbd68', '#a3e095', '#4e9a56'], path: ['#dfc79a', '#c8ad7e', '#eedcb8'], stone: ['#a8b0a8', '#848c86', '#c8d0c8', '#5c645e'], wall: ['#a8885a', '#7c6240', '#c8a878', '#54402a'], water: ['#4fb0e0', '#3586c8', '#9ad8f2', '#22508e'], dark: '#2e5a3a' },
    heights:{ grass: ['#a3c47a', '#8cb064', '#bcd894', '#6a8e4e'], path: ['#cfc0a4', '#b5a68a', '#e2d6bf'], stone: ['#a39aa8', '#7f7688', '#c4bccb', '#5a5264'], wall: ['#968ea0', '#6e6680', '#b8b0c4', '#4a4258'], water: ['#78c4ea', '#4e9ad4', '#b4e4f8', '#2e5a9a'], dark: '#3e3a52' },
    hush:   { grass: ['#6fa86c', '#5c9460', '#86bf80', '#447a4e'], path: ['#b8a27e', '#9e8866', '#cdb994'], stone: ['#8f8aa6', '#6e6a88', '#aca8c2', '#4c4866'], wall: ['#7a6a9a', '#5a4c7a', '#9a8aba', '#3e3258'], water: ['#5aa0c8', '#3a7aaa', '#90c8e4', '#24507a'], dark: '#2a3a40' },
    fair:   { grass: ['#9fd472', '#88c25e', '#b8e490', '#68a650'], path: ['#e9cfa0', '#d4b582', '#f5e2bf'], stone: ['#c8b4a0', '#a48e7a', '#e2d2c0', '#7a6656'], wall: ['#d84a5a', '#a83040', '#f07080', '#702030'], water: ['#62b8e8', '#4090d6', '#a8dcf6', '#2b5aa8'], dark: '#3a5a2a' },
    loom:   { grass: ['#c4dcc4', '#aac8ae', '#dcecdc', '#88a890'], path: ['#e4e0d4', '#ccc6b6', '#f2efe6'], stone: ['#c8d0dc', '#a4aebe', '#e4e8ef', '#7a8496'], wall: ['#dfe6ef', '#aab7c8', '#f4f7fb', '#7a889c'], water: ['#8ac8e4', '#64a4cc', '#c0e4f4', '#3a6a96'], dark: '#5a6a7a' },
    drift:  { grass: ['#b8e07a', '#a2d06a', '#d0ec98', '#7eb058'], path: ['#ecd6a6', '#d8bc88', '#f6e8c4'], stone: ['#c8beb0', '#a89c8c', '#e4dacb', '#7c7264'], wall: ['#c8beb0', '#a89c8c', '#e4dacb', '#7c7264'], water: ['#6cc4ee', '#48a0dc', '#b0e4f8', '#2e66b0'], dark: '#3a5a2a' },
    under:  { grass: ['#6a5040', '#5a4234', '#7c604c', '#46322a'], path: ['#8a6a4e', '#74583e', '#a0805e'], stone: ['#6e5a4a', '#56463a', '#88725e', '#3e3028'], wall: ['#5a4434', '#423226', '#76604a', '#2c2018'], water: ['#3a6a8a', '#2a5070', '#5a8aa8', '#1a3450'], dark: '#1e1612' },
    /* House interiors */
    tidy:   { floor: ['#efe4cc', '#2f3a48', '#d8ccb0', '#c8b898'], wall: ['#5fb7a8', '#3c8a80', '#8fd6c8', '#245a54'], trim: ['#9a3a4a', '#6e2232', '#c45a6a'], stone: ['#b8aa98', '#968878', '#d6cab6', '#6e6458'], water: ['#5fb5e8', '#3f8fd8', '#a5dcf7', '#2b5aa8'], dark: '#1c2a2a' },
};

/* the painted tile canvases: key -> canvas; painted on first use */
const TILE_CACHE = {};

function tileCanvas(key, paint) {
    let c = TILE_CACHE[key];
    if (!c) { c = Gfx.makeCanvas(T, T); if (!HEADLESS) paint(c.getContext('2d'), c); TILE_CACHE[key] = c; }
    return c;
}

/* tiny pixel helpers for painters */
function px(x, X, Y, col) { x.fillStyle = col; x.fillRect(X, Y, 1, 1); }
function fill(x, col, X = 0, Y = 0, w = T, h = T) { x.fillStyle = col; x.fillRect(X, Y, w, h); }
function speckle(x, cols, seed, density, X = 0, Y = 0, w = T, h = T) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const r = hash2(X + i, Y + j, seed);
        if (r < density) px(x, X + i, Y + j, cols[Math.floor(hash2(i, j, seed + 7) * cols.length)]);
    }
}

/* ---------- painters ---------- */
const Paint = {
    grass(x, th, v) {
        const [g0, g1, g2, g3] = th.grass;
        fill(x, g0);
        speckle(x, [g1], 11 + v * 13, 0.10);
        speckle(x, [g2], 23 + v * 7, 0.035);
        /* a few blades */
        for (let n = 0; n < 3; n++) {
            const bx = Math.floor(hash2(v, n, 3) * 14) + 1, by = Math.floor(hash2(n, v, 5) * 13) + 2;
            px(x, bx, by, g3); px(x, bx, by - 1, g1); px(x, bx + 1, by - 1, g3);
        }
    },
    flowers(x, th, v) {
        Paint.grass(x, th, v);
        const cols = [['#fbf6ea', '#f7d64a'], ['#f59ac0', '#fbf6ea'], ['#f7d64a', '#e8463c'], ['#b48ce8', '#fbf6ea']];
        for (let n = 0; n < 2; n++) {
            const [petal, mid] = cols[Math.floor(hash2(v, n, 9) * cols.length)];
            const fx = 3 + Math.floor(hash2(n, v, 1) * 9), fy = 3 + Math.floor(hash2(v + 3, n, 2) * 9);
            px(x, fx, fy - 1, petal); px(x, fx - 1, fy, petal); px(x, fx + 1, fy, petal); px(x, fx, fy + 1, petal);
            px(x, fx, fy, mid); px(x, fx, fy + 2, th.grass[3]);
        }
    },
    tallgrass(x, th, v) {
        const [g0, g1, g2, g3] = th.grass;
        fill(x, g0);
        for (let i = 0; i < 6; i++) {
            const bx = 1 + i * 2 + (i % 2), h = 6 + Math.floor(hash2(i, v, 4) * 5);
            for (let j = 0; j < h; j++) px(x, bx + (j > h - 3 ? 1 : 0), 15 - j, j > h - 3 ? g2 : g1);
            px(x, bx, 15, g3);
        }
    },
    path(x, th, v) {
        const [p0, p1, p2] = th.path;
        fill(x, p0);
        speckle(x, [p1], 31 + v, 0.14);
        speckle(x, [p2], 41 + v, 0.06);
        for (let n = 0; n < 2; n++) {
            const sx = Math.floor(hash2(v, n, 12) * 13) + 1, sy = Math.floor(hash2(n, v, 13) * 13) + 1;
            px(x, sx, sy, p1); px(x, sx + 1, sy, p1); px(x, sx, sy + 1, p2);
        }
    },
    cobble(x, th, v) {
        const [s0, s1, s2, s3] = th.stone;
        fill(x, s1);
        /* stones in a loose grid */
        const rows = [[0, 5], [5, 5], [10, 6]];
        rows.forEach(([y0, hh], ri) => {
            let xx = (ri % 2) * -3;
            while (xx < 16) {
                const ww = 5 + Math.floor(hash2(xx + 20, ri + v * 3, 8) * 3);
                const tone = hash2(xx, ri, v + 5) < 0.5 ? s0 : mix(s0, s2, 0.4);
                fill(x, tone, Math.max(0, xx + 1), y0 + 1, Math.min(ww - 1, 16 - Math.max(0, xx + 1)), hh - 1);
                px(x, Math.max(0, xx + 1), y0 + 1, s2);
                if (xx + ww - 1 < 16) fill(x, s3, Math.max(0, xx + 1), y0 + hh - 1, Math.min(ww - 1, 16 - Math.max(0, xx + 1)), 1);
                xx += ww;
            }
        });
    },
    sand(x, th, v) {
        const [p0, p1, p2] = th.path;
        fill(x, p2); speckle(x, [p0], 51 + v, 0.18); speckle(x, [p1], 61 + v, 0.05);
    },
    water(x, th, v, f) {
        const [w0, w1, w2, w3] = th.water;
        fill(x, w0);
        speckle(x, [w1], 71 + v, 0.12);
        /* moving glints */
        for (let n = 0; n < 2; n++) {
            const gx = (Math.floor(hash2(v, n, 17) * 16) + f * 2) % 16, gy = Math.floor(hash2(n, v, 19) * 14) + 1;
            px(x, gx, gy, w2); px(x, (gx + 1) % 16, gy, w2); px(x, (gx + 2) % 16, gy, w2);
            px(x, (gx + 1) % 16, gy + 1, w1);
        }
    },
    deep(x, th, v, f) {
        Paint.water(x, th, v, f);
        x.globalAlpha = 0.25; fill(x, th.water[3]); x.globalAlpha = 1;
    },
    pit(x, th) {
        fill(x, '#120c14');
        speckle(x, ['#21162a'], 81, 0.08);
    },
    bricks(x, cols, v) {
        const [b0, b1, b2, b3] = cols;
        fill(x, b1);
        for (let row = 0; row < 4; row++) {
            const y0 = row * 4, off = (row % 2) * 4;
            for (let bx = -off; bx < 16; bx += 8) {
                const tone = hash2(bx + 30, row + v * 5, 2) < 0.5 ? b0 : mix(b0, b2, 0.3);
                fill(x, tone, Math.max(0, bx), y0, Math.min(7, 16 - Math.max(0, bx), bx + 7), 3);
                px(x, Math.max(0, bx), y0, b2);
            }
            fill(x, b3, 0, y0 + 3, 16, 1);
        }
    },
    planks(x, cols, v, vertical) {
        const [p0, p1, p2, p3] = cols;
        fill(x, p0);
        for (let i = 0; i < 4; i++) {
            const o = i * 4;
            if (vertical) { fill(x, p3, o + 3, 0, 1, 16); fill(x, p2, o, 0, 1, 16); }
            else { fill(x, p3, 0, o + 3, 16, 1); fill(x, p2, 0, o, 16, 1); }
            const knot = Math.floor(hash2(i, v, 33) * 12) + 2;
            if (vertical) px(x, o + 1, knot, p1); else px(x, knot, o + 1, p1);
        }
        speckle(x, [p1], 90 + v, 0.05);
    },
    checker(x, a, b) {
        for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) fill(x, (i + j) % 2 ? b : a, i * 8, j * 8, 8, 8);
        x.globalAlpha = 0.15; fill(x, '#ffffff', 0, 0, 16, 1); fill(x, '#ffffff', 0, 8, 16, 1); x.globalAlpha = 1;
    },
    carpet(x, a, b, c) {
        fill(x, a);
        for (let j = 0; j < 16; j += 4) for (let i = (j / 4) % 2 * 2; i < 16; i += 4) px(x, i + 1, j + 1, b);
        speckle(x, [c], 5, 0.03);
    },
};

/* tile kinds by map character, per map family. The map code (10_map.js) uses these legends. */
