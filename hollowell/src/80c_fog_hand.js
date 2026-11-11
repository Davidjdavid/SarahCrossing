/* Linnet's note 5, tried: where the river runs into the fog at the bottom of Meadowfold (the only place the fog can be
   reached with the water's spray on it), Wren can put her hand into it, facing it from the river's end. A close look:
   thread, fine as hair, millions of strands beaded with the spray, every one pulled taut the same way (up the river,
   north, toward the Well); and among them her own red one, which pulls taut the same way for a moment. Once the
   Unwinding's come they hang slack; once her own thread's cut, it isn't there. Nothing to collect and nothing counted:
   only the flag fog_hand. (Linnet's note says where and what; this is what you find. The Frayed Edge, later, is where
   the threads part round you like a bead curtain.) */

const FOG_HAND = { block: '1,2', x: 51, y: 37, w: 2 };    /* the river's mouth: the five tiles of fog across its end */
SPAWN.foghand = (tx, ty) => {
    const pr = new Prop(tx, ty, { solid: [] });
    pr.draw = () => { };
    pr.interact = () => { Script.run(FogHand.reach(), { name: 'foghand' }); return true; };
    pr.talkBox = (pl, f) => f.ty === ty && Math.abs(f.tx - tx) <= FOG_HAND.w && pl.ty === ty - 1;
    return pr;
};
OW.blocks[FOG_HAND.block].ents.push({ k: 'foghand', x: FOG_HAND.x, y: FOG_HAND.y });

const FogHand = {
    card: null,
    *reach() {
        Progress.set('fog_hand'); Stats.count('foghand');
        this.card = { t0: G.t, slack: Progress.flag('unwound'), red: !Progress.flag('cut_self') };
        /* (her own thread snaps taut a moment after the picture comes up) */
        if (this.card.red) Script.run(function* () { yield FOG_TAUT; if (FogHand.card) Sfx.play('tug'); }, { blocking: false });
        yield 16;
        yield* say(null, 'You put your hand into the fog.');
        this.card = null;
    },
    draw() {
        const c = this.card;
        if (!Script.running('foghand')) { this.card = null; return; }     /* (a load in the middle: gone) */
        const t = G.t - c.t0, w = 150, h = 84, x = (W - w) >> 1, y = 14, x0 = x + 3, x1 = x + w - 3, y0 = y + 3, y1 = y + h - 3;
        Gfx.alpha(Math.min(1, t / 12));
        stitchedBox(x - 2, y - 2, w + 4, h + 4, { fill: '#dfe5ec', stitch: '#aab7c8', shadow: '#c8d0da' });
        for (let j = y0; j < y1; j += 2) for (let i = x0; i < x1; i += 6) Gfx.rect(i, j, 6, 2, hash2(i >> 3, j >> 2, 81) < 0.5 ? '#e4e9ef' : '#d8dfe7');
        /* the hand, in among them: a yellow cuff, a palm, four fingers and a thumb */
        const mx = x + (w >> 1) - 8, hy = y1 - Math.round(Math.min(1, t / 16) * 26);
        const hand = () => {
            Gfx.rect(mx - 6, hy + 14, 13, y1 - hy - 14, PAL.ink); Gfx.rect(mx - 5, hy + 15, 11, y1 - hy - 15, '#e7ad3c');
            Gfx.rect(mx - 5, hy + 5, 11, 10, PAL.ink); Gfx.rect(mx - 4, hy + 6, 9, 9, PAL.skin);
            [[-4, 7], [-1, 8], [2, 8], [5, 6]].forEach(([dx, l]) => { Gfx.rect(mx + dx - 1, hy + 6 - l, 3, l + 1, PAL.ink); Gfx.rect(mx + dx, hy + 7 - l, 1, l, PAL.skin); });
            Gfx.rect(mx - 8, hy + 7, 4, 3, PAL.ink); Gfx.rect(mx - 7, hy + 8, 3, 1, PAL.skin);
        };
        /* every strand leans the same way: up and a little to the left, the way the river comes down from the Well */
        const k = 0.32, H2 = y1 - y0;
        const strand = (bx, i, col, a) => {
            Gfx.alpha(Math.min(1, t / 12) * a);
            if (c.slack) {
                /* (slack: hanging loose, just drifting) */
                let px = bx, py = y1;
                for (let d = 4; d <= H2; d += 4) { const qx = bx + Math.sin(d / 11 + i * 1.7 + G.t / 90) * 3, qy = y1 - d; if (qx > x0 && qx < x1 && px > x0 && px < x1) Gfx.line(px, py, qx, qy, col); px = qx; py = qy; }
                return;
            }
            const d0 = Math.max(0, (bx - x1) / k), d1 = Math.min(H2, (bx - x0) / k);
            if (d0 < d1) Gfx.line(Math.round(bx - k * d0), y1 - d0, Math.round(bx - k * d1), y1 - d1, col);
        };
        for (let i = 0, bx = x0 + 1; bx < x1 + k * H2; i++, bx += 3) strand(bx, i, i % 5 ? '#f6f9fc' : '#ffffff', i % 3 ? 0.75 : 1);
        hand();
        for (let i = 0, bx = x0 + 2; bx < x1 + k * H2; i++, bx += 9) strand(bx, i, '#ffffff', 0.9);     /* (and some in front of it) */
        /* beads of the river's spray along them, thickest low down, glinting */
        for (let i = 0; i < 46; i++) {
            const by = y1 - 2 - Math.floor(Math.pow(hash2(i, 3, 83), 1.6) * (H2 - 4)), bx = x0 + 2 + Math.floor(hash2(3, i, 84) * (w - 10));
            Gfx.alpha(Math.min(1, t / 12) * (0.55 + 0.45 * Math.abs(Math.sin(G.t / 23 + i))));
            Gfx.rect(bx, by, 2, 2, '#b8d2ea'); Gfx.rect(bx, by, 1, 1, '#ffffff');
        }
        /* her own red thread, coming up from below beside her hand: loose, then pulled taut the same way as all the rest */
        if (c.red) {
            const bx = mx + 14, taut = t >= FOG_TAUT, j = taut && t < FOG_TAUT + 8 ? Math.round((Math.random() - 0.5) * 2) : 0;
            Gfx.alpha(Math.min(1, t / 12));
            let px = bx, py = y1;
            for (let d = 3; d <= H2; d += 3) {
                const qx = taut ? bx - k * d + j : bx - k * d * 0.6 + Math.sin(d / 9) * 4 * (1 - d / H2), qy = y1 - d;
                if (qx > x0 && qx < x1 && px > x0 && px < x1) Gfx.line(Math.round(px), py, Math.round(qx), qy, THREAD.wren);
                px = qx; py = qy;
            }
        }
        Gfx.alpha(1);
    },
};
const FOG_TAUT = 46;
{
    const draw0 = UI.draw;
    UI.draw = function () { if (FogHand.card && G.scene === 'play') FogHand.draw(); return draw0.call(this); };
}
