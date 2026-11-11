/* Softer seams for the blocks that ask for them (b.blobSeam, with the art kit's `soft`): where the kit frays a block
   into its neighbour by a wandering edge, these fray in patches instead, as ground really changes: tongues and islands
   of the neighbour's ground over the band, thinning away from the seam, so the change never runs along a line. The kit
   decides which side frays, which neighbour, how far, and draws rock and water as before; only the patching is new. */
{
    const tile0 = OWA.tile;
    OWA.tile = function (a, tx, ty) {
        const b = this.blockAt(tx, ty);
        if (HEADLESS || !b || !b.owArt || !b.blobSeam) return tile0.call(this, a, tx, ty);
        const s = this.seamOf(a, tx, ty);
        if (!s) return tile0.call(this, a, tx, ty);
        const p = a.cell(tx, ty).p;
        if (this.BLEND_BY_SHADE[p] || (this.paint[p] && this.paint[p].shade)) return tile0.call(this, a, tx, ty);
        const tn = this.themeOf(a, tx, ty);
        const c0 = this.canvasIn(a, tx, ty, tn), c1 = this.canvasIn(a, tx, ty, s.tn);
        if (!c0 || !c1) return c0;
        return tileCanvas(`blob:${tx},${ty}:${this.idOf(c0)}:${this.idOf(c1)}`, x => {
            const A = c0.getContext('2d').getImageData(0, 0, T, T), B = c1.getContext('2d').getImageData(0, 0, T, T), o = A.data, q = B.data;
            const bp = s.band * T;
            for (let py = 0; py < T; py++) for (let px0 = 0; px0 < T; px0++) {
                const gx = tx * T + px0, gy = ty * T + py;
                const dist = s.side === 'l' ? gx - b.bx * OW.bw * T : s.side === 'r' ? (b.bx + 1) * OW.bw * T - 1 - gx : s.side === 'u' ? gy - b.by * OW.bh * T : (b.by + 1) * OW.bh * T - 1 - gy;
                /* patches: big soft ones and small ragged ones on top, in both directions, so islands form */
                const n = this.n2(gx / 26, gy / 26, 17) * 0.62 + this.n2(gx / 9, gy / 9, 19) * 0.28 + this.n2(gx / 3, gy / 3, 23) * 0.1;
                const lim = bp * (0.06 + 0.9 * n * n * 1.3);
                if (dist < lim) { const i = (py * T + px0) * 4; o[i] = q[i]; o[i + 1] = q[i + 1]; o[i + 2] = q[i + 2]; o[i + 3] = q[i + 3]; }
            }
            x.putImageData(A, 0, 0);
        });
    };
}

/* Inside a region too: where grass meets the forest floor, a dirt road or sand, the tiles' straight edges and square
   corners fray along a wandering line instead (both tiles agree where it runs: each boundary's own line, so a stretch of
   one ground pushes into the other here and is pushed back there). Paved roads keep their kerbs. Drawing only: every
   tile is what it was. Each frayed tile is made the first time it's drawn, a few a frame (never in one long frame:
   entering the valley paints every tile once), and drawn plain till then. */
const Fray = {
    FAM: { grass: 'g', flowers: 'g', tallgrass: 'g', path: 'p', sand: 's', forest: 'f' },
    AMP: 4.5, PER_FRAME: 12,
    made: 0, frame: -1,
    /* the line a boundary takes, px into the first tile (+) or the second (-): along it, from where it lies */
    off(at, along, vert) { return (OWA.n2(along / 7, at / T * 3.1, vert ? 31 : 37) * 0.75 + OWA.n2(along / 2.5, at / T * 1.7, vert ? 41 : 43) * 0.25 - 0.5) * 2 * this.AMP; },
};
{
    const draw1 = TileDraw.draw;
    const capture = (area, tx, ty) => { let got = null; const img = Gfx.img; Gfx.img = c => { got = c; }; try { draw1.call(TileDraw, area, tx, ty, 0, 0); } finally { Gfx.img = img; } return got; };
    const as = (a, tx, ty, L) => { const o = Object.create(a); o.cell = (x, y) => x === tx && y === ty ? L : a.cell(x, y); return o; };
    TileDraw.draw = function (area, tx, ty, sx, sy) {
        const L = area.id === 'hollow' && !HEADLESS && !this.warming ? area.cell(tx, ty) : null, f = L && Fray.FAM[L.p];
        if (!f) return draw1.call(this, area, tx, ty, sx, sy);
        /* (what this tile last came to, while it and its neighbours are what they were) */
        const memo = area._fray || (area._fray = new Map()), i = ty * area.w + tx, m = memo.get(i);
        const n0 = area.cell(tx - 1, ty), n1 = area.cell(tx + 1, ty), n2 = area.cell(tx, ty - 1), n3 = area.cell(tx, ty + 1);
        if (m && m.L === L && m.n0 === n0 && m.n1 === n1 && m.n2 === n2 && m.n3 === n3) { if (m.c) Gfx.img(m.c, sx, sy); else draw1.call(this, area, tx, ty, sx, sy); return; }
        const sides = [];
        for (let d = 0; d < 4; d++) {
            const M = area.cell(tx + DX[d], ty + DY[d]), g = Fray.FAM[M.p];
            if (g && g !== f && area.inside(tx + DX[d], ty + DY[d])) sides.push([DX[d], DY[d], M]);
        }
        const keep = c => memo.set(i, { L, n0, n1, n2, n3, c });
        if (!sides.length) { keep(null); return draw1.call(this, area, tx, ty, sx, sy); }
        /* (a few new ones a frame; the rest plain till a later one) */
        if (Fray.frame !== this.frame) { Fray.frame = this.frame; Fray.made = 0; }
        if (Fray.made >= Fray.PER_FRAME) return draw1.call(this, area, tx, ty, sx, sy);
        Fray.made++;
        const c0 = capture(area, tx, ty);
        if (!c0) { keep(null); return draw1.call(this, area, tx, ty, sx, sy); }
        const cs = sides.map(([dx, dy, M]) => capture(as(area, tx, ty, M), tx, ty));
        const c = tileCanvas(`fray:${tx},${ty}:${OWA.idOf(c0)}:${cs.map(q => q ? OWA.idOf(q) : 0).join(',')}`, x => {
            const A = c0.getContext('2d').getImageData(0, 0, T, T), o = A.data;
            sides.forEach(([dx, dy], k) => {
                if (!cs[k]) return;
                const q = cs[k].getContext('2d').getImageData(0, 0, T, T).data, vert = dx !== 0;
                /* the boundary's place (px), and which side of it this tile is (the first or the second) */
                const at = vert ? (dx > 0 ? tx + 1 : tx) * T : (dy > 0 ? ty + 1 : ty) * T, first = vert ? dx > 0 : dy > 0;
                for (let py = 0; py < T; py++) for (let px0 = 0; px0 < T; px0++) {
                    const gx = tx * T + px0, gy = ty * T + py, along = vert ? gy : gx;
                    const d = vert ? (dx > 0 ? at - 1 - gx : gx - at) : (dy > 0 ? at - 1 - gy : gy - at);
                    if (d >= Fray.AMP) continue;
                    const o2 = Fray.off(at, along, vert);
                    if (d < (first ? o2 : -o2)) { const j = (py * T + px0) * 4; o[j] = q[j]; o[j + 1] = q[j + 1]; o[j + 2] = q[j + 2]; o[j + 3] = q[j + 3]; }
                }
            });
            x.putImageData(A, 0, 0);
        });
        keep(c);
        Gfx.img(c, sx, sy);
    };
}
