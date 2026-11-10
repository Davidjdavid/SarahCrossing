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
