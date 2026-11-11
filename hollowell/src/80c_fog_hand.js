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
        /* (the words go below the picture: the scene's attention is up there) */
        yield* say(null, 'You put your hand into the fog.', { focus: [tileOf(Cam.x + W / 2), tileOf(Cam.y + 30), 40] });
        this.card = null;
    },
    draw() {
        const c = this.card;
        if (!Script.running('foghand')) { this.card = null; return; }     /* (a load in the middle: gone) */
        const t = G.t - c.t0, A = Math.min(1, t / 12), w = 150, h = 84, x = (W - w) >> 1, y = 14;
        const x0 = x + 3, x1 = x + w - 3, y0 = y + 3, y1 = y + h - 3, H2 = y1 - y0, k = 0.12, gap = 5;
        Gfx.alpha(A);
        stitchedBox(x - 2, y - 2, w + 4, h + 4, { fill: '#b4c0ce', stitch: '#8e9cb0', shadow: '#a6b2c2' });
        for (let j = y0; j < y1; j++) Gfx.rect(x0, j, x1 - x0, 1, mix('#c4ceda', '#97a6b8', (j - y0) / H2));
        /* every strand pulled the same way: up, the way the river comes down from the Well, leaning a touch toward it (or,
           slack, hanging and drifting); xAt is where strand i is, d pixels up from the bottom. A taut one hums now and then */
        const n = Math.ceil((x1 - x0 + k * H2) / gap);
        const xAt = (i, d) => c.slack ? x0 + 2 + i * gap - k * H2 / 2 + Math.sin(d / 11 + i * 1.7 + G.t / 90) * 3 : x0 + 2 + i * gap - k * d;
        const strand = (i, col, a) => {
            Gfx.alpha(A * a);
            if (!c.slack) {
                const hum = hash2(i, G.t >> 3, 85) < 0.04 ? 1 : 0, b = x0 + 2 + i * gap + hum;
                const d0 = Math.max(0, (b - x1 + 1) / k), d1 = Math.min(H2, (b - x0) / k);
                if (d0 < d1) Gfx.line(Math.round(b - k * d0), Math.round(y1 - d0), Math.round(b - k * d1), Math.round(y1 - d1), col);
                return;
            }
            let px = xAt(i, 0), py = y1;
            for (let d = 4; d <= H2 + 3; d += 4) {
                const dd = Math.min(d, H2), qx = xAt(i, dd), qy = y1 - dd;
                if (Math.min(px, qx) >= x0 && Math.max(px, qx) < x1) Gfx.line(Math.round(px), py, Math.round(qx), qy, col);
                px = qx; py = qy;
            }
        };
        for (let i = 0; i < n; i++) strand(i, '#ffffff', i % 2 ? 0.45 : 0.9);
        /* the hand, in among them: a yellow cuff, a palm, four fingers and a thumb (and some strands in front of it) */
        const mx = x + (w >> 1) - 8, hy = y1 - Math.round(Math.min(1, t / 16) * 26);
        Gfx.alpha(A);
        Gfx.rect(mx - 6, hy + 14, 13, y1 - hy - 14, PAL.ink); Gfx.rect(mx - 5, hy + 15, 11, y1 - hy - 15, '#e7ad3c'); Gfx.rect(mx - 5, hy + 15, 11, 1, '#b67d26');
        Gfx.rect(mx - 5, hy + 5, 11, 10, PAL.ink); Gfx.rect(mx - 4, hy + 6, 9, 9, PAL.skin);
        [[-4, 7], [-1, 8], [2, 8], [5, 6]].forEach(([dx, l]) => { Gfx.rect(mx + dx - 1, hy + 6 - l, 3, l + 1, PAL.ink); Gfx.rect(mx + dx, hy + 7 - l, 1, l, PAL.skin); });
        Gfx.rect(mx - 8, hy + 7, 4, 3, PAL.ink); Gfx.rect(mx - 7, hy + 8, 3, 1, PAL.skin);
        for (let i = 1; i < n; i += 4) strand(i, '#ffffff', 0.9);
        /* beads of the river's spray strung along them, thickest low down, glinting */
        for (let b = 0; b < 40; b++) {
            const i = Math.floor(hash2(b, 3, 83) * n), d = Math.floor(Math.pow(hash2(3, b, 84), 1.7) * (H2 - 4)), bx = Math.round(xAt(i, d)) - 1, by = y1 - d - 1;
            if (bx < x0 || bx > x1 - 3 || (i % 4 !== 1 && bx > mx - 11 && bx < mx + 8 && by > hy - 4)) continue;     /* (behind the hand) */
            Gfx.alpha(A * (0.7 + 0.3 * Math.abs(Math.sin(G.t / 23 + b))));
            Gfx.rect(bx, by, 3, 3, '#7f93aa'); Gfx.rect(bx, by, 3, 2, '#e8f2fc'); Gfx.rect(bx, by, 1, 1, '#ffffff');
        }
        /* her own red thread, up from below beside her hand: loose, then pulled taut the same way as all the rest */
        if (c.red) {
            const bx = mx + 14, taut = t >= FOG_TAUT, j = taut && t < FOG_TAUT + 8 ? Math.round((Math.random() - 0.5) * 2) : 0;
            Gfx.alpha(A);
            if (taut) Gfx.line(bx + j, y1, Math.round(bx - k * H2) + j, y0, THREAD.wren);
            else {
                let px = bx, py = y1;
                for (let d = 3; d <= H2; d += 3) {
                    const qx = bx - k * d * 0.5 + Math.sin(d / 9) * 4 * (1 - d / H2), qy = y1 - d;
                    if (Math.min(px, qx) >= x0 && Math.max(px, qx) < x1) Gfx.line(Math.round(px), py, Math.round(qx), qy, THREAD.wren);
                    px = qx; py = qy;
                }
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
