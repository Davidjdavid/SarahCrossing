/* the ground: each tile drawn in code, varied by a hash so it never looks stamped */

const isW = ch => ch === '~' || ch === '%';
const FLOORS = '_-rMv';
function drawTile(g, ch, x, y, id, tx, ty) {
    const h = (s = 0) => hash2(tx, ty, s + id.length * 7);
    const at = (dx, dy) => tileAt(tx + dx, ty + dy, id);
    switch (ch) {
        case '.': case ',': case '"': grass(g, x, y, h); if (ch === ',') flowers(g, x, y, h); if (ch === '"') tallGrass(g, x, y, h); break;
        case ':': dirt(g, x, y, h, at); break;
        case ';': cobble(g, x, y, h); break;
        case 's': sand(g, x, y, h); break;
        case '=': planks(g, x, y, h, true); break;
        case '_': planks(g, x, y, h, false); break;
        case '-': stoneFloor(g, x, y, h); break;
        case 'r': R(g, C.R, x, y, 16, 16); R(g, C.r, x + 1, y + 1, 14, 14); for (let i = 0; i < 16; i += 4) R(g, C.y, x + i + ((ty % 2) * 2), y + 7, 2, 2); break;
        case 'M': planks(g, x, y, h, false); R(g, C.R, x + 1, y + 2, 14, 11); for (let i = 3; i < 13; i += 3) R(g, C.r, x + 2, y + i, 12, 1); break;
        case 'v': planks(g, x, y, h, false); R(g, C.d, x, y + 11, 16, 2); R(g, C.k, x, y + 13, 16, 3); break;
        case 'W': case 'w': case 'b': wall(g, ch, x, y, h, at); break;
        case 'k': fortWall(g, x, y, h, at); break;
        case 'h': R(g, C.u, x, y, 16, 16); for (let i = 0; i < 16; i += 3) R(g, i % 2 ? C.d : C.t, x + i, y, 1, 16); break;
        case 'o': if (id === 'cellar') { stoneFloor(g, x, y, h); R(g, C.G, x, y, 16, 16); for (let i = 0; i < 5; i++) R(g, C.K, x + Math.floor(h(i) * 13), y + Math.floor(h(i + 9) * 13), 3, 3); } else { grass(g, x, y, h); rock(g, x, y); } break;
        case '#': forest(g, x, y, h, at); break;
        case '^': cliff(g, x, y, h, at); break;
        case 'C': R(g, C.u, x, y, 16, 16); R(g, C.t, x, y, 16, 6); R(g, C.T, x, y, 16, 2); R(g, C.d, x, y + 15, 16, 1); R(g, C.d, x + 7, y + 7, 2, 7); break;
        case 'n': stoneFloor(g, x, y, h); R(g, C.G, x, y, 16, 16); R(g, C.c, x + 1, y + 1, 14, 14); R(g, C.w, x + 3, y + 2, 2, 8); R(g, C.b, x + 1, y + 12, 14, 3); break;
        case 'x': R(g, C.z, x, y, 16, 16); if (!'x'.includes(at(0, -1))) R(g, C.K, x, y, 16, 3); break;
        case 'f': grass(g, x, y, h); R(g, C.u, x, y + 6, 16, 2); R(g, C.u, x, y + 10, 16, 2); R(g, C.t, x + 2, y + 3, 2, 11); R(g, C.t, x + 12, y + 3, 2, 11); break;
        case '~': case '%': R(g, ch === '%' ? C.B : C.b, x, y, 16, 16); break;
        default: R(g, C.z, x, y, 16, 16);
    }
}
function grass(g, x, y, h) {
    R(g, C.n, x, y, 16, 16);
    for (let i = 0; i < 7; i++) { const a = Math.floor(h(i) * 15), b = Math.floor(h(i + 20) * 14); R(g, C.N, x + a, y + b, 1, 2); P1(g, C.N, x + a + 1, y + b + 1); }
    for (let i = 0; i < 3; i++) P1(g, C.l, x + Math.floor(h(i + 40) * 16), y + Math.floor(h(i + 60) * 16));
}
function flowers(g, x, y, h) {
    const cols = [C.r, C.y, C.w, C.p, C.v];
    for (let i = 0; i < 3; i++) {
        const a = 2 + Math.floor(h(i + 70) * 11), b = 2 + Math.floor(h(i + 80) * 11), c = cols[Math.floor(h(i + 90) * cols.length)];
        R(g, C.N, x + a, y + b + 1, 1, 2);
        R(g, c, x + a - 1, y + b, 3, 1); R(g, c, x + a, y + b - 1, 1, 3); P1(g, C.Y, x + a, y + b);
    }
}
function tallGrass(g, x, y, h) {
    for (let i = 0; i < 6; i++) { const a = 1 + Math.floor(h(i + 5) * 14); R(g, C.D, x + a, y + 6 + Math.floor(h(i + 3) * 6), 1, 5); R(g, C.l, x + a, y + 6 + Math.floor(h(i + 3) * 6), 1, 1); }
}
function dirt(g, x, y, h, at) {
    R(g, C.t, x, y, 16, 16);
    for (let i = 0; i < 6; i++) P1(g, C.T, x + Math.floor(h(i) * 16), y + Math.floor(h(i + 7) * 16));
    for (let i = 0; i < 3; i++) R(g, C.u, x + Math.floor(h(i + 30) * 14), y + Math.floor(h(i + 31) * 14), 2, 1);
    const grassy = c => '.,"'.includes(c);
    for (let i = 0; i < 16; i += 2) {
        if (grassy(at(0, -1))) R(g, C.n, x + i, y, 2, 1 + Math.floor(h(i + 100) * 2));
        if (grassy(at(0, 1))) R(g, C.n, x + i, y + 15 - Math.floor(h(i + 110) * 2), 2, 2);
        if (grassy(at(-1, 0))) R(g, C.n, x, y + i, 1 + Math.floor(h(i + 120) * 2), 2);
        if (grassy(at(1, 0))) R(g, C.n, x + 15 - Math.floor(h(i + 130) * 2), y + i, 2, 2);
    }
}
function cobble(g, x, y, h) {
    R(g, C.g, x, y, 16, 16);
    const off = (Math.floor(y / 16) % 2) * 4;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
        const sx = x + ((c * 6 + off + r * 3) % 18) - 1, sy = y + r * 4;
        R(g, h(r * 5 + c) > 0.5 ? C.W : C.T, sx + 1, sy + 1, 4, 2);
    }
}
function sand(g, x, y, h) {
    R(g, C.T, x, y, 16, 16);
    for (let i = 0; i < 6; i++) P1(g, h(i + 50) > 0.5 ? C.Y : C.t, x + Math.floor(h(i) * 16), y + Math.floor(h(i + 9) * 16));
}
function planks(g, x, y, h, dock) {
    R(g, dock ? C.u : C.t, x, y, 16, 16);
    for (let i = 0; i < 16; i += 4) { R(g, dock ? C.d : C.u, x, y + i + 3, 16, 1); }
    for (let i = 0; i < 4; i++) P1(g, dock ? C.d : C.u, x + Math.floor(h(i) * 16), y + i * 4 + 1);
    if (!dock) for (let i = 0; i < 2; i++) R(g, C.T, x + Math.floor(h(i + 9) * 12), y + Math.floor(h(i + 3) * 4) * 4, 4, 1);
}
function stoneFloor(g, x, y, h) {
    R(g, C.g, x, y, 16, 16);
    R(g, C.G, x, y + 7, 16, 1); R(g, C.G, x + (h(1) > 0.5 ? 5 : 10), y, 1, 7); R(g, C.G, x + (h(2) > 0.5 ? 3 : 12), y + 8, 1, 8);
    for (let i = 0; i < 3; i++) P1(g, C.W, x + Math.floor(h(i + 4) * 16), y + Math.floor(h(i + 8) * 16));
}
function wall(g, ch, x, y, h, at) {
    const below = at(0, 1);
    const face = FLOORS.includes(below) || 'Cn'.includes(below);
    if (!face) {
        R(g, C.K, x, y, 16, 16); R(g, C.G, x, y, 16, 1);
        if (FLOORS.includes(at(1, 0))) R(g, C.k, x + 15, y, 1, 16);
        if (FLOORS.includes(at(-1, 0))) R(g, C.k, x, y, 1, 16);
        return;
    }
    R(g, C.v, x, y, 16, 13); R(g, C.K, x, y, 16, 2);
    for (let i = 2; i < 13; i += 4) for (let j = (i % 8 ? 2 : 6); j < 16; j += 8) P1(g, C.p, x + j, y + i + 1);
    R(g, C.u, x, y + 12, 16, 4); R(g, C.d, x, y + 15, 16, 1); R(g, C.t, x, y + 12, 16, 1);
    if (ch === 'w') { R(g, C.w, x + 3, y + 3, 10, 8); R(g, C.c, x + 4, y + 4, 8, 6); R(g, C.w, x + 7, y + 4, 2, 6); R(g, C.w, x + 4, y + 6, 8, 1); P1(g, C.w, x + 5, y + 5); }
    if (ch === 'b') { R(g, C.d, x + 1, y + 2, 14, 11); const bc = [C.r, C.b, C.y, C.N, C.P, C.o]; for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) R(g, bc[Math.floor(h(i + r * 6) * bc.length)], x + 2 + i * 2, y + 3 + r * 5, 2, 4); R(g, C.u, x + 1, y + 7, 14, 1); }
}
function fortWall(g, x, y, h, at) {
    R(g, C.G, x, y, 16, 16);
    for (let r = 0; r < 4; r++) { R(g, C.K, x, y + r * 4 + 3, 16, 1); const o = r % 2 ? 4 : 0; R(g, C.K, x + o + 7, y + r * 4, 1, 3); }
    for (let i = 0; i < 4; i++) P1(g, C.g, x + Math.floor(h(i) * 16), y + Math.floor(h(i + 5) * 16));
    if (!'k'.includes(at(0, 1)) && at(0, 1) !== ' ') R(g, C.k, x, y + 15, 16, 1);
    if (!'k '.includes(at(0, -1))) R(g, C.g, x, y, 16, 2);
}
function rock(g, x, y) { blob(g, x + 2, y + 4, 12, 10, C.g, C.k, ellipse(6, 5, 6, 5)); R(g, C.W, x + 5, y + 6, 3, 1); R(g, C.G, x + 4, y + 11, 8, 1); }
function forest(g, x, y, h, at) {
    R(g, C.D, x, y, 16, 16);
    const lobes = [[3, 4, 5], [11, 5, 5], [7, 11, 5], [1, 13, 4], [14, 13, 4]];
    for (const [cx, cy, r] of lobes) {
        const j = Math.floor(h(cx + cy) * 3) - 1;
        for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) {
            if (xx * xx + yy * yy > r * r) continue;
            const px = cx + xx + j, py = cy + yy;
            if (px < 0 || py < 0 || px > 15 || py > 15) continue;
            P1(g, xx + yy < -r / 2 ? C.n : C.N, x + px, y + py);
        }
    }
    if (at(0, 1) !== '#' && at(0, 1) !== ' ') { R(g, C.D, x, y + 13, 16, 3); R(g, C.d, x + 4, y + 13, 2, 3); R(g, C.d, x + 11, y + 13, 2, 3); R(g, C.k, x, y + 15, 16, 1); }
}
function cliff(g, x, y, h, at) {
    R(g, C.u, x, y, 16, 16);
    for (let i = 0; i < 5; i++) R(g, C.d, x + Math.floor(h(i) * 14), y + Math.floor(h(i + 5) * 14), 3, 1);
    for (let i = 0; i < 3; i++) R(g, C.t, x + Math.floor(h(i + 10) * 14), y + Math.floor(h(i + 15) * 14), 2, 1);
    if (at(0, -1) !== '^' && !isW(at(0, -1))) { R(g, C.n, x, y, 16, 3); R(g, C.N, x, y + 3, 16, 1); }
    if (isW(at(0, 1))) R(g, C.k, x, y + 15, 16, 1);
}
/* the static layer for a room: every tile, then foam where water meets land */
let groundCache = { key: null, cv: null };
function groundKey(id) {
    const R0 = ROOMS[id];
    if (!R0.tile) return id;
    let k = id;
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) k += tileAt(x, y, id);
    return k;
}
function ground(id) {
    const key = groundKey(id);
    if (groundCache.key === key) return groundCache.cv;
    const cv = mkCanvas(VW, MH * TS), g = cv.getContext('2d');
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) drawTile(g, tileAt(x, y, id), x * TS, y * TS, id, x, y);
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
        const ch = tileAt(x, y, id);
        if (!isW(ch)) continue;
        const land = (dx, dy) => { const c = tileAt(x + dx, y + dy, id); return c !== ' ' && !isW(c) && (x + dx >= 0 && x + dx < MW && y + dy >= 0 && y + dy < MH); };
        const px = x * TS, py = y * TS;
        g.fillStyle = C.c;
        if (land(0, -1)) { g.fillRect(px, py, 16, 2); g.fillStyle = C.w; for (let i = 0; i < 16; i += 5) g.fillRect(px + i, py, 2, 1); g.fillStyle = C.c; }
        if (land(0, 1)) g.fillRect(px, py + 14, 16, 2);
        if (land(-1, 0)) g.fillRect(px, py, 2, 16);
        if (land(1, 0)) g.fillRect(px + 14, py, 2, 16);
    }
    groundCache = { key, cv };
    return cv;
}
/* water moves: little highlights drift across it every frame */
function drawWaterFx(g, id, t, oy) {
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
        const ch = tileAt(x, y, id);
        if (!isW(ch)) continue;
        const px = x * TS, py = y * TS + oy;
        for (let i = 0; i < 2; i++) {
            const ph = hash2(x, y, i + 3);
            const lx = Math.floor((ph * 16 + t * (ch === '%' ? 4 : 6) + i * 8) % 16);
            const ly = 3 + i * 7 + Math.floor(ph * 3);
            const a = (Math.sin(t * 2 + ph * 6) + 1) / 2;
            if (a < 0.25) continue;
            g.fillStyle = a > 0.75 ? C.w : C.c;
            g.fillRect(px + lx, py + ly, Math.min(4, 16 - lx), 1);
        }
    }
}
