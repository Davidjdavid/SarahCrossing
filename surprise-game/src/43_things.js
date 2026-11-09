/* things: objects, buildings, furniture. made(name, w, h, fn) caches each look */

function dotted(g, x, y, w, h, col = C.w) {
    for (let i = 0; i < w; i += 2) { P1(g, col, x + i, y); P1(g, col, x + i, y + h - 1); }
    for (let i = 0; i < h; i += 2) { P1(g, col, x, y + i); P1(g, col, x + w - 1, y + i); }
}
function crateImg(wt, float) {
    const tier = wt === Infinity ? 4 : wt === 0 ? 0 : wt <= 3 ? 1 : wt <= 6 ? 2 : 3;
    return made('crate' + tier + float, 16, 16, g => {
        const wood = [C.Y, C.t, C.t, C.u, C.K][tier], dark = [C.T, C.u, C.u, C.d, C.k][tier];
        blob(g, 1, 2, 14, 13, wood, C.k, roundRect(14, 13, 1));
        R(g, dark, 2, 3, 12, 1); R(g, dark, 2, 13, 12, 1); R(g, dark, 2, 8, 12, 1);
        for (let i = 0; i < 10; i++) { P1(g, dark, 3 + i, 4 + i * 0.9 | 0); }
        if (tier >= 2) { R(g, C.G, 1, 5, 14, 2); R(g, C.G, 1, 11, 14, 2); R(g, C.W, 3, 5, 1, 1); R(g, C.W, 12, 11, 1, 1); }
        if (tier === 3) { R(g, C.K, 6, 2, 4, 13); }
        if (tier === 0) { R(g, C.w, 3, 4, 2, 2); }
    });
}
function boulderImg(wt) {
    const big = wt >= 5;
    return made('boulder' + big + (wt === 0), 16, 16, g => {
        const r = big ? 7 : 6;
        blob(g, 8 - r, 15 - r * 2 + (big ? 1 : 2), r * 2, r * 2 - (big ? 1 : 2), (x, y) => y < 4 ? C.W : (x + y) % 7 === 0 ? C.G : C.g, C.k, ellipse(r, r - 1, r, r - 1));
        R(g, C.G, 6, 12, 5, 1); R(g, C.w, 5, big ? 4 : 6, 2, 1);
    });
}
function anchorImg() {
    return made('anchor', 16, 16, g => {
        R(g, C.k, 7, 2, 2, 12); R(g, C.G, 7, 3, 1, 10);
        blob(g, 5, 0, 6, 5, C.K, C.k, ellipse(3, 2.5, 3, 2.5)); R(g, C.z, 7, 2, 2, 1);
        R(g, C.k, 3, 5, 10, 2); R(g, C.G, 4, 5, 8, 1);
        R(g, C.k, 2, 10, 2, 4); R(g, C.k, 12, 10, 2, 4); R(g, C.k, 3, 13, 10, 2); R(g, C.G, 4, 13, 8, 1);
        R(g, C.k, 1, 9, 2, 2); R(g, C.k, 13, 9, 2, 2);
    });
}
function parcelImg() {
    return made('parcel', 16, 16, g => {
        blob(g, 1, 3, 14, 12, C.T, C.k, roundRect(14, 12, 1));
        R(g, C.t, 2, 4, 12, 3); R(g, C.w, 7, 3, 2, 12); R(g, C.w, 1, 8, 14, 1);
        R(g, C.w, 5, 1, 2, 3); R(g, C.w, 9, 1, 2, 3); R(g, C.k, 5, 0, 6, 1);
    });
}
function treeImg(stage, big, hollow) {
    return made(`tree${stage}${big}${hollow}`, big ? 32 : 16, big ? 40 : 28, (g, W, H) => {
        if (stage === 'seed') { dotted(g, 5, H - 9, 6, 8); R(g, C.w, 7, H - 4, 2, 2); return; }
        if (stage === 'sprout') { R(g, C.N, 7, H - 6, 2, 5); blob(g, 3, H - 9, 5, 4, C.l, C.k, ellipse(2.5, 2, 2.5, 2)); blob(g, 8, H - 10, 5, 4, C.l, C.k, ellipse(2.5, 2, 2.5, 2)); return; }
        const s = { young: 0.6, tree: 1, old: 1.1, ancient: 1.15 }[stage];
        const cw = Math.round((big ? 30 : 15) * s), ch = Math.round((big ? 26 : 16) * s);
        const leaf = stage === 'ancient' ? C.x : stage === 'old' ? C.N : C.n, light = stage === 'ancient' ? C.N : C.l;
        const tw = big ? 8 : 4, th = big ? 14 : 8;
        const tx = Math.floor(W / 2 - tw / 2);
        blob(g, tx, H - th - 1, tw, th, C.u, C.k, (x, y) => true);
        R(g, C.d, tx + 1, H - th, 1, th - 2);
        if (stage === 'ancient') { R(g, C.k, tx - 2, H - 2, tw + 4, 1); R(g, C.d, tx - 1, H - 3, 2, 2); R(g, C.d, tx + tw - 1, H - 3, 2, 2); }
        if (hollow && stage === 'ancient') { blob(g, tx + 1, H - th + 2, tw - 2, th - 4, C.z, C.k, ellipse((tw - 2) / 2, (th - 4) / 2, (tw - 2) / 2, (th - 4) / 2)); }
        const cx0 = Math.floor(W / 2 - cw / 2), cy0 = H - th - ch + (big ? 6 : 3);
        blob(g, cx0, Math.max(0, cy0), cw, ch, (x, y) => { const nx = x / cw - 0.35, ny = y / ch - 0.3; const r = nx * nx + ny * ny; if (r < 0.03) return light; if (r < 0.07 && (x + y) % 2) return light; if (x / cw + y / ch > 1.35) return stage === 'ancient' ? C.D : C.N; if (x / cw + y / ch > 1.2 && (x + y) % 2) return stage === 'ancient' ? C.D : C.N; return (x * 7 + y * 5) % 13 === 0 ? C.D : leaf; }, C.k, (x, y) => {
            const nx = (x + 0.5) / cw * 2 - 1, ny = (y + 0.5) / ch * 2 - 1;
            const wob = 1 + 0.12 * Math.sin(Math.atan2(ny, nx) * 5);
            return nx * nx + ny * ny <= wob * wob * 0.98;
        });
        if (stage === 'old' || stage === 'ancient') for (let i = 0; i < 4; i++) P1(g, C.r, cx0 + 3 + i * Math.floor(cw / 5), Math.max(0, cy0) + 5 + (i % 2) * 3);
    });
}
function wallImg(stage, look) {
    return made(`wall${stage}${look}`, 16, 16, g => {
        if (stage === 'none') { dotted(g, 1, 1, 14, 14); return; }
        if (stage === 'rubble') { blob(g, 1, 9, 6, 6, C.g, C.k, ellipse(3, 3, 3, 3)); blob(g, 8, 10, 7, 5, C.G, C.k, ellipse(3.5, 2.5, 3.5, 2.5)); blob(g, 5, 7, 5, 4, C.W, C.k, ellipse(2.5, 2, 2.5, 2)); return; }
        if (look === 'partition') { R(g, C.k, 0, 0, 16, 16); for (let i = 0; i < 4; i++) { R(g, C.T, 1 + i * 4, 1, 3, 14); R(g, C.t, 1 + i * 4, 12, 3, 3); } return; }
        R(g, C.k, 0, 1, 16, 15);
        const st = [[1, 2, 7, 4], [9, 2, 6, 4], [1, 7, 4, 4], [6, 7, 9, 4], [1, 12, 8, 3], [10, 12, 5, 3]];
        for (const [x, y, w, h] of st) { R(g, C.g, x, y, w, h); R(g, C.W, x, y, w, 1); }
        R(g, C.N, 2, 1, 4, 1); R(g, C.n, 10, 6, 3, 1);
    });
}
function bridgeImg(stage, w) {
    return made(`bridge${stage}${w}`, w * 16, 16, (g, W) => {
        if (stage === 'none') { dotted(g, 0, 2, W, 12); for (let x = 3; x < W; x += 5) for (let y = 4; y < 12; y += 2) P1(g, C.w, x, y); return; }
        const plank = stage === 'new' ? C.T : stage === 'sound' ? C.t : C.d, dark = stage === 'rotten' ? C.k : C.u;
        R(g, C.k, 0, 1, W, 14);
        for (let x = 1; x < W - 1; x += 4) {
            if (stage === 'rotten' && (x === 9 || x === 21)) continue;
            R(g, plank, x, 2, 3, 12); R(g, dark, x, 13, 3, 1);
            if (stage === 'rotten') { P1(g, C.G, x + 1, 5); P1(g, C.k, x + 2, 9); }
        }
        R(g, stage === 'rotten' ? C.d : C.u, 0, 1, W, 1); R(g, stage === 'rotten' ? C.d : C.u, 0, 14, W, 1);
    });
}
const HOUSE_COL = { home: ['r', 'R', 'T'], post: ['b', 'B', 'w'], shop: ['N', 'D', 'Y'], tock: ['P', 'K', 'v'], five: ['p', 'R', 'w'], seven: ['G', 'K', 'W'], fisher: ['E', 'k', 'c'], mill: ['u', 'd', 'T'], new: ['o', 'u', 'Y'] };
function houseImg(look) {
    return made('house' + look, 48, 52, g => {
        const [roof, roofD, wallC] = (HOUSE_COL[look] || HOUSE_COL.home).map(k => C[k]);
        /* walls */
        blob(g, 3, 24, 42, 28, wallC, C.k, (x, y) => true);
        for (let y = 28; y < 51; y += 4) R(g, look === 'seven' ? C.g : C.T, 4, y, 40, 1);
        /* roof */
        blob(g, 0, 2, 48, 26, (x, y) => (y % 4 === 0) ? roofD : roof, C.k, (x, y) => y >= 0 && x >= 22 - y * 1.0 - 2 && x <= 25 + y * 1.0 + 2 || y > 12);
        R(g, roofD, 1, 26, 46, 2);
        /* windows */
        for (const wx of [7, 33]) { R(g, C.k, wx, 32, 9, 8); R(g, C.c, wx + 1, 33, 7, 6); R(g, C.w, wx + 4, 33, 1, 6); R(g, C.w, wx + 1, 35, 7, 1); R(g, C.w, wx + 2, 33, 1, 1); }
        /* door (bottom middle tile: x16..31, y36..52) */
        blob(g, 18, 37, 12, 15, look === 'seven' ? C.K : C.u, C.k, roundRect(12, 15, 3)); R(g, C.d, 19, 44, 10, 1); P1(g, C.y, 27, 45);
        /* address plaque sits above the door: drawn by the tag */
        if (look === 'post') { R(g, C.w, 20, 6, 8, 6); R(g, C.k, 20, 6, 8, 1); R(g, C.k, 20, 11, 8, 1); R(g, C.k, 20, 6, 1, 6); R(g, C.k, 27, 6, 1, 6); P1(g, C.k, 22, 8); P1(g, C.k, 25, 8); R(g, C.k, 23, 9, 2, 1); }
        if (look === 'shop') { for (let i = 0; i < 6; i++) R(g, i % 2 ? C.w : C.r, 4 + i * 7, 26, 7, 4); R(g, C.k, 4, 30, 40, 1); }
        if (look === 'tock') { blob(g, 19, 6, 10, 10, C.w, C.k, ellipse(5, 5, 5, 5)); R(g, C.k, 23, 8, 1, 4); R(g, C.k, 23, 11, 3, 1); }
        if (look === 'fisher') { for (let i = 0; i < 5; i++) R(g, C.W, 36 + (i % 2), 42 + i, 6, 1); }
        if (look === 'home') { R(g, C.d, 36, 6, 5, 8); R(g, C.k, 35, 5, 7, 2); }
        if (look === 'mill') { R(g, C.W, 6, 18, 4, 3); R(g, C.W, 38, 16, 3, 3); }
    });
}
function lotImg(stage) {
    if (stage === 'house') return houseImg('new');
    return made('lot' + stage, 48, 52, g => {
        if (stage === 'none') {
            dotted(g, 3, 24, 42, 28); for (let x = 0; x < 24; x += 2) { P1(g, C.w, 23 - x, 2 + x); P1(g, C.w, 24 + x, 2 + x); }
            dotted(g, 18, 37, 12, 15);
            return;
        }
        for (let i = 0; i < 9; i++) blob(g, 4 + (i * 13) % 38, 32 + (i * 7) % 16, 8, 6, i % 2 ? C.g : C.u, C.k, ellipse(4, 3, 4, 3));
    });
}
function lighthouseImg(lit) {
    return made('lighthouse' + lit, 48, 128, g => {
        const top = 2;
        /* lamp room */
        blob(g, 12, top, 24, 8, C.R, C.k, (x, y) => x >= 6 - y && x <= 17 + y);
        blob(g, 13, top + 8, 22, 14, lit ? C.Y : C.G, C.k, (x, y) => true);
        if (lit) { R(g, C.w, 18, top + 11, 12, 8); }
        for (let i = 0; i < 4; i++) R(g, C.k, 14 + i * 6, top + 8, 1, 14);
        R(g, C.k, 9, top + 22, 30, 3); R(g, C.G, 10, top + 22, 28, 1);
        /* tower: wider at the base, red and white bands */
        blob(g, 0, top + 25, 48, 100, (x, y) => Math.floor(y / 20) % 2 ? C.R : C.w, C.k, (x, y) => { const half = 13 + y * 0.09; return Math.abs(x + 0.5 - 24) <= half; });
        /* door */
        blob(g, 18, 109, 12, 19, C.u, C.k, roundRect(12, 19, 4)); R(g, C.d, 19, 118, 10, 1);
    });
}
function doorImg(look, open) {
    return made('door' + look, 16, 16, g => {
        if (look === 'cell') { R(g, C.k, 1, 0, 14, 16); R(g, C.K, 2, 1, 12, 15); for (let i = 3; i < 14; i += 3) R(g, C.G, i, 2, 1, 13); R(g, C.G, 2, 6, 12, 1); return; }
        if (look === 'towerdoor') { blob(g, 2, 0, 12, 16, (x, y) => (x + y) % 3 ? C.m : C.v, C.k, roundRect(12, 16, 5)); R(g, C.w, 7, 6, 2, 4); return; }
        R(g, C.k, 2, 0, 12, 16); R(g, C.u, 3, 1, 10, 15); R(g, C.d, 3, 8, 10, 1); P1(g, C.y, 11, 9);
    });
}
function plateImg(on) {
    return made('plate' + on, 16, 16, g => {
        blob(g, 1, on ? 3 : 2, 14, on ? 12 : 13, on ? C.G : C.g, C.k, roundRect(14, on ? 12 : 13, 2));
        R(g, on ? C.K : C.W, 3, on ? 5 : 4, 10, 1);
    });
}
function gateImg(look, open) {
    return made('gate' + look + open, 16, 20, g => {
        if (look === 'sluice') { if (open) { R(g, C.u, 0, 0, 16, 3); R(g, C.k, 0, 3, 16, 1); } else { R(g, C.k, 0, 2, 16, 18); R(g, C.u, 1, 3, 14, 16); for (let i = 6; i < 18; i += 4) R(g, C.d, 1, i, 14, 1); } return; }
        if (look === 'sungate' || look === 'moongate') {
            const m = look === 'sungate' ? C.y : C.v, d = look === 'sungate' ? C.o : C.P;
            if (open) { R(g, C.k, 0, 0, 16, 5); R(g, m, 1, 1, 14, 3); }
            else { R(g, C.k, 0, 0, 16, 20); R(g, d, 1, 1, 14, 18); for (let i = 3; i < 14; i += 4) R(g, m, i, 2, 2, 16); }
            blob(g, 4, open ? -2 : 4, 8, 8, look === 'sungate' ? C.Y : C.w, C.k, ellipse(4, 4, 4, 4));
            if (look === 'moongate') R(g, d, 8, open ? -1 : 5, 3, 4);
            return;
        }
        if (open) { R(g, C.k, 0, 0, 16, 4); R(g, C.G, 1, 1, 14, 2); }
        else { R(g, C.k, 0, 0, 16, 20); R(g, C.K, 1, 1, 14, 18); for (let i = 2; i < 15; i += 3) R(g, C.g, i, 1, 1, 18); R(g, C.G, 1, 9, 14, 2); }
    });
}
function crackImg(broken) {
    return made('crack' + broken, 16, 16, g => {
        if (broken) { blob(g, 1, 2, 14, 13, C.z, C.k, ellipse(7, 6.5, 7, 6.5)); R(g, C.K, 3, 3, 10, 2); return; }
        const path = [[8, 1], [7, 4], [9, 7], [6, 9], [7, 12], [5, 15]], br = [[9, 7], [12, 9], [14, 8]], br2 = [[7, 4], [3, 5], [1, 4]];
        for (const p of [path, br, br2]) for (let i = 0; i < p.length - 1; i++) {
            const [x0, y0] = p[i], [x1, y1] = p[i + 1], n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
            for (let s = 0; s <= n; s++) P1(g, C.k, Math.round(x0 + (x1 - x0) * s / n), Math.round(y0 + (y1 - y0) * s / n));
        }
    });
}
function looseImg(v) {
    return made('loose' + v, 12, 12, g => {
        blob(g, 0, 7, 12, 4, 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.25)', ellipse(6, 2, 6, 2));
    });
}
function stampImg(id) {
    const cols = { hatch: 'y', hollow: 'N', mirror: 'c', hour: 'm', nowhere: 'v', house: 'o', cellar: 'G', shore: 'b', walk: 'r' };
    return made('stamp' + id, 12, 14, g => {
        R(g, C.w, 0, 0, 12, 14);
        for (let i = 0; i < 12; i += 2) { P1(g, C.k, i, 0); P1(g, C.k, i, 13); }
        for (let i = 0; i < 14; i += 2) { P1(g, C.k, 0, i); P1(g, C.k, 11, i); }
        R(g, C[cols[id] || 'r'], 2, 2, 8, 10);
        stampArt(g, id, 2, 2);
    });
}
function stampArt(g, id, x, y) {
    const d = C.k;
    const pts = {
        hatch: [[3, 3], [4, 3], [2, 4], [5, 4], [2, 5], [5, 5], [3, 6], [4, 6], [6, 4]],
        hollow: [[3, 1], [4, 1], [2, 2], [5, 2], [3, 3], [4, 3], [3, 4], [4, 4], [3, 5], [4, 5], [3, 6], [4, 6], [3, 7], [4, 7]],
        mirror: [[2, 2], [3, 2], [4, 2], [5, 2], [2, 7], [3, 7], [4, 7], [5, 7], [1, 4], [6, 4], [1, 5], [6, 5]],
        hour: [[3, 1], [4, 1], [2, 2], [5, 2], [1, 3], [3, 3], [6, 3], [1, 4], [3, 4], [4, 4], [6, 4], [2, 5], [5, 5], [3, 6], [4, 6]],
        nowhere: [[2, 2], [5, 2], [3, 3], [4, 3], [3, 4], [4, 4], [2, 5], [5, 5]],
        house: [[3, 1], [4, 1], [2, 2], [5, 2], [1, 3], [6, 3], [1, 4], [6, 4], [1, 5], [3, 5], [6, 5], [1, 6], [3, 6], [6, 6], [1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
        cellar: [[1, 2], [6, 2], [1, 3], [2, 3], [5, 3], [6, 3], [1, 4], [3, 4], [4, 4], [6, 4], [1, 5], [6, 5], [1, 6], [6, 6]],
        shore: [[1, 3], [2, 2], [3, 3], [4, 2], [5, 3], [6, 2], [1, 6], [2, 5], [3, 6], [4, 5], [5, 6], [6, 5]],
        walk: [[2, 1], [3, 1], [2, 2], [3, 2], [2, 3], [5, 4], [4, 5], [5, 5], [4, 6], [5, 6]],
    }[id] || [];
    for (const [a, b] of pts) P1(g, d, x + a, y + b);
}

/* furniture and fittings */
function decoImg(look, t) {
    return made('deco' + look, 16, 32, (g) => {
        const Y = 16; /* the tile's top in this 16x32 canvas: tall things rise above it */
        switch (look) {
            case 'bed': blob(g, 1, 1, 14, 30, C.u, C.k, roundRect(14, 30, 2)); R(g, C.w, 2, 2, 12, 9); blob(g, 3, 3, 10, 6, C.W, C.k, roundRect(10, 6, 2)); R(g, C.b, 2, 11, 12, 18); R(g, C.B, 2, 11, 12, 2); for (let i = 15; i < 28; i += 4) R(g, C.c, 3, i, 10, 1); break;
            case 'table': blob(g, 1, Y + 3, 14, 9, C.t, C.k, roundRect(14, 9, 1)); R(g, C.T, 2, Y + 4, 12, 2); R(g, C.k, 2, Y + 12, 2, 4); R(g, C.k, 12, Y + 12, 2, 4); break;
            case 'desk': blob(g, 0, Y + 2, 16, 10, C.u, C.k, roundRect(16, 10, 1)); R(g, C.t, 1, Y + 3, 14, 2); R(g, C.w, 4, Y + 1, 6, 3); R(g, C.k, 1, Y + 12, 2, 4); R(g, C.k, 13, Y + 12, 2, 4); break;
            case 'chair': R(g, C.k, 4, Y + 1, 8, 13); R(g, C.u, 5, Y + 2, 6, 6); R(g, C.t, 5, Y + 8, 6, 3); R(g, C.k, 4, Y + 14, 1, 2); R(g, C.k, 11, Y + 14, 1, 2); break;
            case 'rocker': R(g, C.k, 3, Y, 10, 12); R(g, C.u, 4, Y + 1, 8, 6); R(g, C.r, 4, Y + 7, 8, 3); R(g, C.k, 1, Y + 13, 14, 2); R(g, C.u, 2, Y + 13, 12, 1); break;
            case 'plant': blob(g, 4, Y + 9, 8, 7, C.o, C.k, roundRect(8, 7, 1)); R(g, C.u, 5, Y + 10, 6, 1); blob(g, 2, Y - 2, 12, 12, C.n, C.k, ellipse(6, 6, 6, 6)); R(g, C.l, 5, Y + 1, 3, 2); break;
            case 'shelf': R(g, C.k, 1, Y - 6, 14, 22); R(g, C.u, 2, Y - 5, 12, 20); for (let i = 0; i < 3; i++) { R(g, C.d, 2, Y + i * 7 - 1, 12, 1); for (let j = 0; j < 5; j++) R(g, [C.r, C.b, C.y, C.N, C.P][(i + j) % 5], 3 + j * 2, Y + i * 7 - 5, 2, 4); } break;
            case 'mirror': R(g, C.y, 3, Y + 1, 10, 12); R(g, C.c, 4, Y + 2, 8, 10); R(g, C.w, 5, Y + 3, 2, 5); break;
            case 'frame': R(g, C.u, 3, Y + 2, 10, 10); R(g, C.T, 4, Y + 3, 8, 8); R(g, C.b, 4, Y + 8, 8, 3); R(g, C.k, 7, Y + 5, 2, 3); break;
            case 'bench': R(g, C.k, 0, Y + 4, 16, 9); R(g, C.u, 1, Y + 5, 14, 3); R(g, C.t, 1, Y + 8, 14, 2); R(g, C.k, 2, Y + 12, 2, 4); R(g, C.k, 12, Y + 12, 2, 4); break;
            case 'well': blob(g, 1, Y + 4, 14, 12, C.g, C.k, roundRect(14, 12, 3)); R(g, C.z, 3, Y + 5, 10, 4); R(g, C.k, 2, Y - 6, 2, 11); R(g, C.k, 12, Y - 6, 2, 11); blob(g, 0, Y - 9, 16, 5, C.R, C.k, roundRect(16, 5, 1)); break;
            case 'flowerpot': blob(g, 3, Y + 8, 10, 8, C.o, C.k, roundRect(10, 8, 1)); for (let i = 0; i < 3; i++) { R(g, C.N, 4 + i * 3, Y + 3, 1, 5); blob(g, 3 + i * 3, Y + 1, 3, 3, [C.r, C.y, C.p][i], C.k, () => true); } break;
            case 'sign': R(g, C.k, 7, Y + 6, 2, 10); blob(g, 1, Y, 14, 9, C.t, C.k, roundRect(14, 9, 1)); R(g, C.u, 3, Y + 3, 10, 1); R(g, C.u, 3, Y + 5, 7, 1); break;
            case 'fence': R(g, C.k, 0, Y + 5, 16, 8); R(g, C.T, 0, Y + 6, 16, 2); R(g, C.T, 0, Y + 10, 16, 2); R(g, C.k, 2, Y + 2, 3, 14); R(g, C.t, 3, Y + 3, 1, 12); R(g, C.k, 11, Y + 2, 3, 14); R(g, C.t, 12, Y + 3, 1, 12); break;
            case 'sacks': for (const [x, y] of [[1, 6], [7, 4], [4, 0]]) { blob(g, x, Y + y, 9, 10, C.T, C.k, ellipse(4.5, 5, 4.5, 5)); R(g, C.t, x + 3, Y + y + 1, 3, 1); } break;
            case 'album': R(g, C.k, 6, Y + 8, 4, 8); blob(g, 1, Y, 14, 9, C.R, C.k, roundRect(14, 9, 1)); R(g, C.w, 2, Y + 1, 5, 7); R(g, C.w, 9, Y + 1, 5, 7); R(g, C.y, 3, Y + 3, 2, 2); break;
            case 'scale': R(g, C.k, 7, Y + 4, 2, 10); blob(g, 2, Y + 12, 12, 4, C.g, C.k, roundRect(12, 4, 1)); blob(g, 1, Y + 1, 14, 5, C.y, C.k, roundRect(14, 5, 2)); break;
            case 'barrel': blob(g, 2, Y + 1, 12, 15, C.u, C.k, roundRect(12, 15, 4)); R(g, C.G, 2, Y + 4, 12, 1); R(g, C.G, 2, Y + 11, 12, 1); R(g, C.t, 5, Y + 2, 2, 12); break;
            case 'workbench': blob(g, 0, Y + 3, 16, 9, C.u, C.k, roundRect(16, 9, 1)); R(g, C.G, 3, Y + 1, 4, 3); blob(g, 9, Y, 5, 5, C.w, C.k, ellipse(2.5, 2.5, 2.5, 2.5)); R(g, C.k, 1, Y + 12, 2, 4); R(g, C.k, 13, Y + 12, 2, 4); break;
            case 'wallclock': blob(g, 3, Y + 2, 10, 10, C.w, C.k, ellipse(5, 5, 5, 5)); R(g, C.k, 7, Y + 4, 1, 4); R(g, C.k, 7, Y + 7, 3, 1); break;
            case 'grandfather': blob(g, 3, Y - 12, 10, 28, C.u, C.k, roundRect(10, 28, 2)); blob(g, 4, Y - 10, 8, 8, C.w, C.k, ellipse(4, 4, 4, 4)); R(g, C.y, 7, Y + 2, 2, 8); blob(g, 6, Y + 8, 4, 4, C.y, C.k, ellipse(2, 2, 2, 2)); break;
            case 'box': blob(g, 1, Y + 4, 14, 11, C.T, C.k, roundRect(14, 11, 1)); R(g, C.t, 2, Y + 5, 12, 2); R(g, C.y, 6, Y + 4, 4, 11); break;
            case 'shipwheel': blob(g, 1, Y + 1, 14, 14, C.u, C.k, ellipse(7, 7, 7, 7)); blob(g, 4, Y + 4, 8, 8, C.z, C.u, ellipse(4, 4, 4, 4)); R(g, C.u, 7, Y + 1, 2, 14); R(g, C.u, 1, Y + 7, 14, 2); R(g, C.y, 7, Y + 7, 2, 2); break;
            case 'nets': for (let i = 0; i < 14; i += 3) { R(g, C.W, 1 + i, Y, 1, 15); R(g, C.W, 1, Y + i, 14, 1); } R(g, C.u, 0, Y, 16, 2); break;
            case 'bottle': blob(g, 4, Y + 6, 9, 8, C.c, C.k, roundRect(9, 8, 3)); R(g, C.u, 2, Y + 9, 3, 2); R(g, C.w, 7, Y + 8, 3, 3); break;
            case 'cot': blob(g, 1, Y + 3, 14, 12, C.G, C.k, roundRect(14, 12, 1)); R(g, C.W, 2, Y + 4, 12, 3); break;
            case 'rack': R(g, C.k, 1, Y - 2, 14, 17); R(g, C.u, 2, Y - 1, 12, 15); for (let i = 3; i < 14; i += 4) { R(g, C.W, i, Y - 4, 1, 14); R(g, C.G, i - 1, Y + 6, 3, 1); } break;
            case 'yarn': for (const [x, y, c] of [[1, 8, 'p'], [6, 5, 'b'], [9, 9, 'y']]) blob(g, x, Y + y, 6, 6, C[c], C.k, ellipse(3, 3, 3, 3)); break;
            case 'millstone': blob(g, 0, Y + 2, 16, 14, C.g, C.k, ellipse(8, 7, 8, 7)); blob(g, 6, Y + 7, 4, 4, C.k, C.k, ellipse(2, 2, 2, 2)); R(g, C.W, 3, Y + 5, 3, 1); break;
            case 'cart': blob(g, 0, Y + 3, 16, 9, C.G, C.k, roundRect(16, 9, 1)); blob(g, 1, Y + 1, 14, 4, C.g, C.k, ellipse(7, 2, 7, 2)); blob(g, 1, Y + 11, 5, 5, C.K, C.k, ellipse(2.5, 2.5, 2.5, 2.5)); blob(g, 10, Y + 11, 5, 5, C.K, C.k, ellipse(2.5, 2.5, 2.5, 2.5)); break;
            case 'reeds': for (let i = 0; i < 5; i++) { R(g, C.N, 2 + i * 3, Y + 4 + (i % 2) * 2, 1, 10); R(g, C.u, 2 + i * 3, Y + 2 + (i % 2) * 2, 1, 3); } break;
            case 'arch': blob(g, 1, Y, 14, 16, C.K, C.k, roundRect(14, 16, 6)); for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) R(g, C.R, 2 + c * 4 + (r % 2) * 2, Y + 3 + r * 3, 3, 2); break;
            case 'nest': blob(g, 1, Y + 8, 14, 7, C.u, C.k, ellipse(7, 3.5, 7, 3.5)); for (let i = 2; i < 14; i += 2) P1(g, C.T, i, Y + 9 + (i % 4 ? 1 : 0)); break;
            case 'acorns': for (let i = 0; i < 6; i++) { const x = 1 + (i * 5) % 12, y = 6 + Math.floor(i / 3) * 4; blob(g, x, Y + y, 4, 5, C.u, C.k, ellipse(2, 2.5, 2, 2.5)); R(g, C.d, x, Y + y, 4, 1); } break;
            case 'gear': blob(g, 1, Y + 1, 14, 14, C.y, C.k, (x, y) => { const a = Math.atan2(y - 6.5, x - 6.5), r = Math.hypot(x - 6.5, y - 6.5); return r < 5 + (Math.cos(a * 8) > 0 ? 2 : 0); }); blob(g, 6, Y + 6, 4, 4, C.k, C.k, () => true); break;
            case 'stove': blob(g, 1, Y + 2, 14, 14, C.K, C.k, roundRect(14, 14, 2)); R(g, C.o, 4, Y + 9, 8, 4); R(g, C.y, 6, Y + 10, 4, 2); R(g, C.k, 11, Y - 6, 3, 9); break;
            case 'catbed': blob(g, 1, Y + 6, 14, 9, C.R, C.k, ellipse(7, 4.5, 7, 4.5)); blob(g, 3, Y + 8, 10, 5, C.p, C.R, ellipse(5, 2.5, 5, 2.5)); break;
            case 'rope': blob(g, 2, Y + 4, 12, 11, C.T, C.k, ellipse(6, 5.5, 6, 5.5)); blob(g, 5, Y + 7, 6, 5, C.t, C.u, ellipse(3, 2.5, 3, 2.5)); break;
            case 'sunwindow': R(g, C.k, 2, Y + 1, 12, 13); R(g, C.c, 3, Y + 2, 10, 11); blob(g, 5, Y + 4, 6, 6, C.y, C.o, ellipse(3, 3, 3, 3)); break;
            case 'moonwindow': R(g, C.k, 2, Y + 1, 12, 13); R(g, C.B, 3, Y + 2, 10, 11); blob(g, 5, Y + 4, 6, 6, C.w, C.W, ellipse(3, 3, 3, 3)); R(g, C.B, 8, Y + 4, 3, 4); P1(g, C.w, 4, Y + 11); P1(g, C.w, 11, Y + 3); break;
            case 'torch': R(g, C.k, 6, Y + 4, 4, 12); R(g, C.u, 7, Y + 5, 2, 10); break;
            case 'tower': break;
            case 'wheel': break;
            default: blob(g, 2, Y + 2, 12, 12, C.t, C.k, roundRect(12, 12, 2));
        }
    });
}
function towerImg(t) {
    return made('tower', 48, 80, g => {
        blob(g, 2, 14, 44, 66, (x, y) => (y % 6 === 0 || (x + Math.floor(y / 6) * 3) % 9 === 0) ? C.G : C.g, C.k, (x, y) => true);
        blob(g, 0, 0, 48, 18, C.K, C.k, (x, y) => x >= 22 - y * 1.4 && x <= 25 + y * 1.4);
        blob(g, 12, 20, 24, 24, C.W, C.k, ellipse(12, 12, 12, 12));
        for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; P1(g, C.k, 24 + Math.round(Math.cos(a) * 9), 32 + Math.round(Math.sin(a) * 9)); }
        R(g, C.G, 6, 56, 8, 10); R(g, C.G, 34, 56, 8, 10);
    });
}
function wheelImg(frame) {
    return made('wheel' + frame, 24, 32, g => {
        blob(g, 0, 4, 24, 24, C.u, C.k, ellipse(12, 12, 12, 12));
        blob(g, 4, 8, 16, 16, C.d, C.u, ellipse(8, 8, 8, 8));
        for (let i = 0; i < 8; i++) {
            const a = i / 8 * Math.PI * 2 + frame * Math.PI / 16;
            for (let r = 2; r < 12; r++) P1(g, C.t, 12 + Math.round(Math.cos(a) * r), 16 + Math.round(Math.sin(a) * r));
            R(g, C.T, 12 + Math.round(Math.cos(a) * 11) - 1, 16 + Math.round(Math.sin(a) * 11) - 1, 3, 3);
        }
        blob(g, 9, 13, 6, 6, C.G, C.k, ellipse(3, 3, 3, 3));
    });
}
function fixtureImg(look, state) {
    return made('fx' + look + state, 16, 32, g => {
        const Y = 16;
        switch (look) {
            case 'clock': R(g, C.k, 6, Y - 4, 4, 20); R(g, C.G, 7, Y - 3, 2, 18); blob(g, 0, Y - 16, 16, 14, C.w, C.k, ellipse(8, 7, 8, 7)); R(g, C.y, 1, Y - 16, 14, 1); blob(g, 3, Y + 12, 10, 4, C.G, C.k, roundRect(10, 4, 1)); break;
            case 'milestone': blob(g, 1, Y - 4, 14, 20, C.W, C.k, (x, y) => y > 4 || roundRect(14, 20, 6)(x, y)); R(g, C.g, 2, Y + 14, 12, 1); R(g, C.G, 3, Y - 1, 10, 1); break;
            case 'shelf_satchel': blob(g, 3, Y + 1, 10, 9, C.t, C.k, roundRect(10, 9, 2)); R(g, C.u, 4, Y + 1, 8, 3); R(g, C.u, 5, Y - 2, 1, 3); R(g, C.u, 10, Y - 2, 1, 3); R(g, C.u, 5, Y - 3, 6, 1); P1(g, C.y, 8, Y + 4); break;
            case 'shelf_map': blob(g, 2, Y + 2, 12, 8, C.Y, C.k, roundRect(12, 8, 1)); R(g, C.b, 4, Y + 4, 3, 3); R(g, C.n, 8, Y + 3, 4, 4); R(g, C.r, 6, Y + 6, 2, 1); break;
            case 'shelf_digit': blob(g, 3, Y + 1, 10, 10, C.y, C.k, ellipse(5, 5, 5, 5)); R(g, C.o, 5, Y + 3, 6, 6); break;
            case 'shelf_sold': R(g, C.d, 3, Y + 8, 10, 2); break;
            case 'drum': blob(g, 1, Y + 1, 14, 14, C.y, C.k, ellipse(7, 7, 7, 7)); blob(g, 3, Y + 3, 10, 10, C.B, C.k, ellipse(5, 5, 5, 5)); break;
            case 'counter': blob(g, 0, Y - 14, 16, 30, C.y, C.k, roundRect(16, 30, 2)); R(g, C.o, 1, Y - 13, 14, 1); R(g, C.k, 2, Y - 11, 12, 10); R(g, C.k, 2, Y + 2, 12, 12); R(g, C.K, 3, Y + 3, 10, 10); break;
            case 'chest': blob(g, 1, Y + 3, 14, 12, state ? C.d : C.u, C.k, roundRect(14, 12, 2)); R(g, C.y, 1, Y + 7, 14, 1); if (state) { R(g, C.k, 2, Y, 12, 4); R(g, C.u, 3, Y, 10, 2); } else { blob(g, 1, Y, 14, 6, C.t, C.k, roundRect(14, 6, 2)); } R(g, C.y, 7, Y + 6, 2, 3); break;
            case 'strongbox': blob(g, 1, Y + 2, 14, 13, state ? C.K : C.G, C.k, roundRect(14, 13, 1)); R(g, C.g, 2, Y + 3, 12, 2); blob(g, 5, Y + 7, 6, 5, state ? C.k : C.y, C.k, ellipse(3, 2.5, 3, 2.5)); break;
            case 'stand': R(g, C.k, 5, Y + 4, 6, 12); R(g, C.g, 6, Y + 5, 4, 11); blob(g, 2, Y + 1, 12, 4, C.R, C.k, roundRect(12, 4, 1)); if (!state) { R(g, C.k, 3, Y - 2, 10, 1); blob(g, 3, Y - 4, 4, 4, C.c, C.k, ellipse(2, 2, 2, 2)); blob(g, 9, Y - 4, 4, 4, C.c, C.k, ellipse(2, 2, 2, 2)); } break;
            case 'bell': R(g, C.k, 7, Y - 14, 2, 4); blob(g, 2, Y - 11, 12, 14, C.y, C.k, (x, y) => Math.abs(x - 5.5) <= 2 + y * 0.32); R(g, C.Y, 4, Y - 7, 2, 6); blob(g, 6, Y + 2, 4, 3, C.o, C.k, ellipse(2, 1.5, 2, 1.5)); R(g, C.k, 2, Y + 8, 12, 2); R(g, C.u, 3, Y + 6, 2, 8); R(g, C.u, 11, Y + 6, 2, 8); break;
            case 'jar': blob(g, 3, Y + 1, 10, 14, C.c, C.k, roundRect(10, 14, 3)); R(g, C.u, 4, Y - 1, 8, 3); for (let i = 0; i < Math.min(state, 6); i++) blob(g, 4 + (i % 2) * 4, Y + 10 - Math.floor(i / 2) * 3, 4, 3, C.t, C.u, () => true); R(g, C.w, 4, Y + 3, 1, 5); break;
            case 'scope': R(g, C.k, 4, Y + 6, 2, 10); R(g, C.k, 10, Y + 6, 2, 10); R(g, C.k, 7, Y + 6, 2, 10); blob(g, 1, Y - 2, 14, 7, C.y, C.k, (x, y) => true); R(g, C.k, 13, Y - 3, 3, 9); R(g, C.o, 2, Y - 1, 10, 1); break;
            case 'bigscope': R(g, C.k, 3, Y + 4, 2, 12); R(g, C.k, 11, Y + 4, 2, 12); R(g, C.k, 7, Y + 4, 2, 12); blob(g, 0, Y - 6, 16, 10, C.y, C.k, () => true); R(g, C.k, 12, Y - 8, 4, 14); R(g, C.o, 1, Y - 4, 11, 2); break;
            case 'lamp': blob(g, 0, Y - 12, 32, 28, state ? C.Y : C.G, C.k, ellipse(16, 14, 16, 14)); break;
            case 'mirror': blob(g, 1, Y + 3, 14, 11, C.c, C.k, ellipse(7, 5.5, 7, 5.5)); R(g, C.w, 4, Y + 5, 4, 1); R(g, C.w, 9, Y + 9, 2, 1); break;
            case 'stairsup': R(g, C.k, 0, Y, 16, 16); for (let i = 0; i < 4; i++) { R(g, C.t, 1, Y + 1 + i * 4, 14, 3); R(g, C.T, 1, Y + 1 + i * 4, 14, 1); } R(g, C.k, 0, Y, 16, 1 + 0); break;
            case 'stairsdown': R(g, C.z, 0, Y, 16, 16); for (let i = 0; i < 4; i++) R(g, [C.u, C.d, C.K, C.k][i], 1 + i, Y + 1 + i * 4, 14 - i * 2, 3); break;
            case 'ladder': R(g, C.k, 3, Y - 8, 2, 24); R(g, C.k, 11, Y - 8, 2, 24); R(g, C.u, 3, Y - 8, 1, 24); R(g, C.u, 11, Y - 8, 1, 24); for (let i = -6; i < 16; i += 4) R(g, C.t, 4, Y + i, 7, 2); break;
            case 'readout': R(g, C.k, 0, Y, 16, 16); R(g, C.K, 1, Y + 1, 14, 14); break;
            case 'door': R(g, C.k, 2, Y, 12, 16); R(g, C.u, 3, Y + 1, 10, 15); R(g, C.d, 3, Y + 8, 10, 1); P1(g, C.y, 11, Y + 9); break;
        }
    });
}
function shipImg() {
    return made('ship', 48, 54, g => {
        blob(g, 2, 38, 44, 14, (x, y) => y < 4 ? C.R : C.u, C.k, (x, y) => x >= y * 0.6 && x <= 43 - y * 0.6);
        R(g, C.k, 23, 4, 2, 36); R(g, C.u, 23, 5, 1, 34);
        blob(g, 25, 6, 16, 28, C.w, C.k, (x, y) => x <= y * 0.6 + 1);
        blob(g, 8, 10, 15, 24, C.W, C.k, (x, y) => x >= 14 - y * 0.6);
        R(g, C.r, 24, 2, 8, 4); R(g, C.k, 24, 1, 8, 1);
        R(g, C.Y, 10, 41, 3, 2); R(g, C.Y, 34, 41, 3, 2);
    });
}
