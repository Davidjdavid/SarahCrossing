/* buildings: drawn from a few numbers (size, colors, where the door and windows go) */
function buildingGrid(b) {
    const W = b.tw * TILE, wallH = b.wallH || 22, H = b.th * TILE + (b.over || 10);
    const g = grid(W, H);
    const wall = b.wall || P.cream, wallS = mixHex(wall, P.ink, 0.25);
    const roof = b.roof || P.red, roofS = mixHex(roof, P.ink, 0.3), roofL = mixHex(roof, P.white, 0.25);
    const wy = H - wallH;
    /* the front wall */
    rect(g, 1, wy, W - 2, wallH - 1, wall);
    rect(g, 1, H - 3, W - 2, 2, wallS);
    if (b.timber) for (let x = 1; x < W - 2; x += 12) rect(g, x, wy, 2, wallH - 1, P.brownS);
    if (b.brick) for (let y = wy + 2; y < H - 3; y += 4) for (let x = ((y / 4) % 2) * 4 + 1; x < W - 2; x += 8) rect(g, x, y, 1, 3, wallS), rect(g, 1, y + 3, W - 2, 0, wallS);
    /* the roof */
    if (b.flat) {
        rect(g, 0, 0, W, wy + 2, roof); rect(g, 0, wy, W, 3, roofS); rect(g, 2, 2, W - 4, 2, roofL);
    } else {
        for (let y = 0; y < wy + 3; y++) {
            const inset = Math.max(0, 3 - y);
            const c = y >= wy ? roofS : (y % 5 === 4 ? roofS : y < 3 ? roofL : roof);
            rect(g, inset, y, W - inset * 2, 1, c);
        }
        for (let y = 2; y < wy; y += 5) for (let x = ((y / 5) % 2) * 5 + 2; x < W - 2; x += 10) px(g, x, y + 2, roofS);
    }
    if (b.chimney) { rect(g, b.chimney, 0, 6, 8, P.stoneS); rect(g, b.chimney, 0, 6, 2, P.stoneD); }
    /* windows and door */
    for (const wx of b.windows || []) {
        const x = wx * TILE + 3;
        rect(g, x, wy + 5, 10, 9, P.brownS); rect(g, x + 1, wy + 6, 8, 7, '#8fd0f0'); rect(g, x + 1, wy + 9, 8, 1, P.brownS); rect(g, x + 4, wy + 6, 1, 7, P.brownS); px(g, x + 2, wy + 7, P.white);
        rect(g, x - 1, wy + 14, 12, 1, P.brownS);
    }
    if (b.door != null) {
        const x = b.door * TILE + 2;
        rect(g, x, H - 17, 12, 16, b.doorColor || P.brown); rect(g, x, H - 17, 12, 1, P.brownD); rect(g, x + 6, H - 16, 1, 15, P.brownS); px(g, x + 9, H - 9, P.gold);
        rect(g, x - 1, H - 18, 14, 1, P.brownD);
    }
    if (b.awning) { for (let x = 1; x < W - 1; x++) rect(g, x, wy - 1, 1, 5, Math.floor(x / 4) % 2 ? b.awning : P.white); }
    return outline(g);
}
function buildingCanvas(id, b) { return spr('bld:' + id, () => toCanvas(buildingGrid(b))); }

/* the Great Clock's tower; its face is drawn at run time with the hour's hands */
function towerCanvas() {
    return spr('tower', () => {
        const g = grid(36, 76);
        rect(g, 4, 20, 28, 55, P.stone); shade(g, P.stone, P.stoneS, x => x > 26);
        for (let y = 24; y < 75; y += 6) rect(g, 4, y, 28, 1, P.stoneS);
        for (let y = 0; y < 20; y++) { const w = Math.round(2 + y * 0.85); rect(g, 18 - w, y, w * 2, 1, y % 4 === 3 ? '#6b4a7a' : '#8a5f9e'); }
        rect(g, 2, 19, 32, 3, '#6b4a7a');
        rect(g, 13, 62, 10, 13, P.brownD); ell(g, 18, 62, 5, 4, P.brownD);
        ell(g, 18, 34, 9, 9, P.cream); ell(g, 18, 34, 7.6, 7.6, P.white);
        for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; px(g, Math.round(18 + Math.sin(a) * 6.4 - 0.5), Math.round(34 - Math.cos(a) * 6.4 - 0.5), P.greyD); }
        return toCanvas(outline(g));
    });
}
function lighthouseCanvas(lit) {
    return spr('lighthouse' + (lit ? 1 : 0), () => {
        const g = grid(40, 104);
        for (let y = 24; y < 102; y++) { const w = Math.round(10 + (y - 24) * 0.08); rect(g, 20 - w, y, w * 2, 1, Math.floor((y - 24) / 13) % 2 ? P.red : P.white); }
        shade(g, P.white, P.cream, x => x > 25); shade(g, P.red, P.redS, x => x > 25);
        rect(g, 8, 20, 24, 4, P.greyD); rect(g, 6, 18, 28, 2, P.greyS);
        rect(g, 11, 6, 18, 12, lit ? P.yellow : '#5a6a8a'); for (let x = 11; x < 29; x += 6) rect(g, x, 6, 1, 12, P.greyD);
        if (lit) rect(g, 13, 8, 4, 8, P.white);
        for (let y = 0; y < 6; y++) rect(g, 20 - (y + 3), y, (y + 3) * 2, 1, P.greyD);
        rect(g, 16, 88, 8, 14, P.brownD);
        return toCanvas(outline(g));
    });
}
function windmillBody() {
    return spr('windmill', () => {
        const g = grid(40, 60);
        for (let y = 14; y < 59; y++) { const w = Math.round(9 + (y - 14) * 0.18); rect(g, 20 - w, y, w * 2, 1, P.cream); }
        shade(g, P.cream, '#d9c7a0', x => x > 25);
        for (let y = 2; y < 16; y++) { const w = Math.round(3 + (y - 2) * 0.75); rect(g, 20 - w, y, w * 2, 1, P.brown); }
        rect(g, 16, 44, 8, 15, P.brownD); rect(g, 13, 26, 6, 6, '#8fd0f0'); rect(g, 22, 26, 6, 6, '#8fd0f0');
        return toCanvas(outline(g));
    });
}
function sailCanvas() {
    return spr('sail', () => {
        const g = grid(24, 4); rect(g, 0, 1, 24, 2, P.brownS); for (let x = 4; x < 24; x += 3) rect(g, x, 0, 2, 4, P.white);
        return toCanvas(outline(g));
    });
}
