/* The Great Spool's look. Its walls are thread, wound tight; the wall at the head of every room is the drum's own face,
   turning; the floor is the Spool's dark boards, and over it the valley's threads run north into the face, always
   moving. Each Knot's room is wound with its own Maker's thread (Ives teal, Bram ochre, Dad blue, Mum brass, Mallow
   lavender, Jory crimson); the rooms between are every colour at once. */

const SPOOL_ALL = ['#e8463c', '#3fc1b5', '#e0913a', '#4f9be0', '#e8c04a', '#b48ce8', '#d6304e', '#8fd46a'];
/* each theme: its boards, the threads wound on its walls and running over its floor, its water */
const SPOOL_LOOKS = {
    spool: { boards: ['#3a2c30', '#2e2226', '#4a3a3a', '#1e1418'], wind: SPOOL_ALL, run: SPOOL_ALL, water: ['#3f6f98', '#2e5478', '#6f9fc8', '#1c3450'] },
    spool_tidy: { boards: ['#2e3436', '#24292b', '#3d4648', '#15191a'], wind: ['#3fc1b5', '#2e9e94', '#5fd6ca', '#efe4cc', '#3fc1b5', '#247a72'], run: ['#3fc1b5', '#8fe0d6', '#efe4cc'], water: ['#3f8f98', '#2e6e78', '#6fbfc8', '#1c4450'] },
    spool_kiln: { boards: ['#3e2a22', '#33221c', '#4e362a', '#1e140f'], wind: ['#e0913a', '#c4623a', '#f0b060', '#93432c', '#e0913a', '#f7d64a'], run: ['#e0913a', '#f0b060', '#c4623a'], water: ['#5f86a8', '#3f6688', '#8cb0d0', '#2b4a68'] },
    spool_mill: { boards: ['#2a3038', '#21262e', '#384049', '#13171c'], wind: ['#4f9be0', '#3a7ab8', '#7fbcf0', '#d8ecfa', '#4f9be0', '#2e5a98'], run: ['#4f9be0', '#a5dcf7', '#d8ecfa'], water: ['#3f86c0', '#2e66a0', '#7fb8e0', '#1c3a68'] },
    spool_belfry: { boards: ['#3a3024', '#2f271d', '#4a3e2e', '#1c1610'], wind: ['#e8c04a', '#c8903a', '#f7e08a', '#8a6420', '#e8c04a', '#fff4c0'], run: ['#e8c04a', '#f7e08a', '#fff4c0'], water: ['#5f8fb0', '#3f6f90', '#8fb8d8', '#2b4a68'] },
    spool_slumber: { boards: ['#2e2638', '#241e2e', '#3c3248', '#16111c'], wind: ['#b48ce8', '#8a64c4', '#d8c8f8', '#5a3e8a', '#b48ce8', '#f0e8ff'], run: ['#b48ce8', '#d8c8f8', '#f7e08a'], water: ['#4a5f98', '#364678', '#7a8fc8', '#1c2850'] },
    spool_marionette: { boards: ['#2c2224', '#231b1c', '#3a2c2e', '#140e10'], wind: ['#d6304e', '#9a1e36', '#f07080', '#f7d64a', '#d6304e', '#701428'], run: ['#d6304e', '#f07080', '#f7d64a'], water: ['#4f7aa8', '#3a5a88', '#7fa8d0', '#22385a'] },
};
for (const [name, L] of Object.entries(SPOOL_LOOKS)) {
    const [b0, b1, b2, b3] = L.boards;
    /* (a theme's wall colours [2] and [3] are what gates are painted with: brass bars, like the drum's flanges) */
    THEMES[name] = { floor: [b0, b1, b2, b3], wall: [shade(L.wind[0], -0.35), shade(L.wind[0], -0.55), '#e0b850', '#5a3a1e'], stone: ['#5a5068', '#463e54', '#7a7090', '#241e2e'], water: L.water, dark: '#0c0a12', look: L };
    FLOORS[name] = {
        /* the Spool's own boards, laid the way the threads run (north), a fibre of thread caught in the grain */
        floor: (x, th, v) => {
            fill(x, b0);
            for (const o of [0, 8]) { fill(x, b2, o, 0, 1, 16); fill(x, b3, o + 7, 0, 1, 16); }
            const e = (v * 5 + 3) % 16; fill(x, b3, 1, e, 6, 1); fill(x, b3, 9, (e + 9) % 16, 6, 1);
            speckle(x, [b1], 40 + v, 0.1);
            if (v === 0) { x.globalAlpha = 0.3; const c = L.run[1 % L.run.length]; px(x, 11, 4, c); px(x, 12, 5, c); px(x, 12, 6, c); px(x, 13, 7, c); x.globalAlpha = 1; }
        },
        floor2: (x, th, v) => { fill(x, b1); speckle(x, [b0, b3], 30 + v, 0.25); },
        floor3: (x, th, v) => { fill(x, b3); for (let i = 1; i < 16; i += 3) fill(x, b1, i, 0, 1, 16); },
        /* an arch in the wall of thread, too low to walk under: the water runs on beneath it */
        arch: (x, th, v) => {
            WALLS[name].face(x, th, v);
            const w = th.water;
            fill(x, '#0c0a12', 2, 6, 12, 10); fill(x, '#0c0a12', 4, 4, 8, 2);
            fill(x, w[3], 3, 9, 10, 7); fill(x, w[0], 3, 12, 10, 4); px(x, 5, 13, w[2]); px(x, 6, 13, w[2]); px(x, 10, 14, w[2]);
            fill(x, '#c9a24a', 2, 5, 1, 11); fill(x, '#c9a24a', 13, 5, 1, 11); fill(x, '#c9a24a', 3, 3, 10, 1);
        },
    };
    WALLS[name] = {
        edge: '#0a080e',
        /* the top of the wound thread, seen from above: rows of it, close as felt */
        top: (x, th, v) => { fill(x, '#1a1420'); for (let y = 1; y < 16; y += 3) { fill(x, shade(L.wind[(y + v) % L.wind.length], -0.62), 0, y, 16, 1); } speckle(x, ['#0a080e'], 12 + v, 0.08); },
        /* its face: thread wound round and round, band on band, each with a gleam and a shadow and its twist showing */
        face: (x, th, v) => {
            for (let y = 0; y < 14; y += 2) {
                const c = L.wind[(y / 2 + v) % L.wind.length];
                fill(x, shade(c, -0.12), 0, y, 16, 2); fill(x, shade(c, 0.22), 0, y, 16, 1);
                for (let i = (y + v) % 4; i < 16; i += 4) px(x, i, y + 1, shade(c, -0.42));
            }
            fill(x, '#c9a24a', 0, 14, 16, 1); fill(x, '#0a080e', 0, 15, 16, 1);
        },
    };
}

const SpoolArt = {
    junk: [],              /* the Foot: things tumbling down the shaft after you, and away north */
    tick(a) {
        const r = Cam.room;
        /* down the shaft at the foot: now and then, a marked thing of the valley's, and away it slides into the drum */
        if (r && r.key === '1,3' && !Progress.flag('unwound') && G.t % 150 === 40 && this.junk.length < 4) this.junk.push({ x: (r.x + 15) * T + 8, y: (r.y + 9) * T + 8, z: 40, k: Math.floor(hash2(G.t, 3, 7) * 4), t: 0 });
        for (const j of this.junk) {
            j.t++;
            if (j.z > 0) { j.z = Math.max(0, j.z - 2.4); if (!j.z) Fx.dust(j.x, j.y + 4); continue; }
            if (j.t > 50) j.y -= 1.6;
            if (r && j.y < (r.y + 1) * T + 6) { j.gone = true; Pull.fx.push({ im: spr(['pot', 'crate', 'block_wood', 'barrel_g'][j.k]), x: j.x - 8, y: j.y - 8, col: SPOOL_ALL[j.k * 2], t: 0 }); }
        }
        this.junk = this.junk.filter(j => !j.gone && r && r.key === '1,3');
        for (const f of Pull.fx) f.t++;
        Pull.fx = Pull.fx.filter(f => f.t < 24);
    },
    look(a, tx, ty) { const th = THEMES[a.def.themeAt ? a.def.themeAt(tx, ty) : 'spool']; return (th && th.look) || SPOOL_LOOKS.spool; },
    /* under everything standing: the threads running north over the floor, the drum's face turning, and whatever's
       being wound in, its thread drawn tight up to the face */
    ground(a, cx, cy) {
        const r = Cam.room; if (!r || !Pull.on(a)) return;
        const L = this.look(a, r.x + 1, r.y + 1), run = L.run, len = (r.h - 2) * T, bot = (r.y + r.h - 1) * T;
        /* the valley's threads: a few long lines running north over the floor into the face, a fibre now and then
           travelling up one (slowly: they're being wound, not falling) */
        const n = Math.max(3, Math.round((r.w - 2) / 2.5));
        for (let i = 0; i < n; i++) {
            const lx = r.x * T + T + Math.floor((i + 0.25 + hash2(i, r.x, r.y) * 0.5) * (r.w - 2) * T / n), tx = Math.floor(lx / T), sx = lx - cx, col = run[i % run.length];
            for (let ty = r.y + 1; ty < r.y + r.h - 1; ty++) {
                const k = a.kind(tx, ty); if ((k.solid && !k.arch) || k.pit) continue;
                Gfx.alpha(k.water ? 0.12 : 0.24); Gfx.rect(sx, ty * T - cy, 1, T, col);
            }
            for (let f = 0; f < 2; f++) {
                const y = bot - (G.t * 0.3 + hash2(i, f, r.x * 7 + r.y) * len) % len, k = a.kind(tx, Math.floor(y / T));
                if ((k.solid && !k.arch) || k.pit) continue;
                Gfx.alpha(k.water ? 0.3 : 0.6); Gfx.rect(sx, Math.round(y) - cy, 1, 3, shade(col, 0.45));
            }
        }
        Gfx.alpha(1);
        /* the drum's face, along the head of the room: turning */
        for (let tx = r.x; tx < r.x + r.w; tx++) {
            if (!a.kind(tx, r.y).wall || a.kind(tx, r.y + 1).solid) continue;
            const sx = tx * T - cx, sy = r.y * T - cy;
            for (let y = 0; y < 14; y += 2) {
                const ph = Math.floor(G.t * 0.4 + y * 5 + tx * 16) % 24;
                if (ph < 16) { Gfx.alpha(0.55); Gfx.rect(sx + ph, sy + y, 3, 1, '#ffffff'); Gfx.alpha(1); }
            }
            /* thread ends being drawn up into it */
            const k = (G.t + tx * 7) % 20;
            Gfx.rect(sx + 4 + (tx * 5) % 8, sy + 16 - Math.floor(k / 2), 1, 2, run[tx % run.length]);
        }
        /* the dark under the face, where the threads go in */
        Gfx.alpha(0.22); Gfx.rect(r.x * T - cx, (r.y + 1) * T - cy, r.w * T, 3, '#000000'); Gfx.alpha(1);
        /* whatever's being wound in: its thread pulled tight, straight up to the face */
        for (const e of a.ents) {
            if (!e.isGrid || !e.ret || e.removed || e.pendingHome || e.ret.state !== 'returning' || a.roomAt(e.tx, e.ty) !== r) continue;
            const x = e.px + 8 - cx, y0 = e.py + 6 - cy, y1 = r.y * T + 14 - cy;
            Gfx.alpha(0.7); Gfx.line(x, y1, x, y0, e.ret.color); Gfx.alpha(1);
            const k = (G.t * 2) % Math.max(1, y0 - y1); Gfx.rect(x - 1, y0 - k, 2, 2, shade(e.ret.color, 0.5));
        }
        /* at the top: where Gran's next throw will come down, the tile stitched round, blinking faster as it comes, and its
           shadow growing (as every blow in the valley shows itself first) */
        const d = a.find('theSpool'), t = d && d.toss;
        if (t && a.roomAt(t.tx, t.ty) === r) {
            const k = Math.min(1, t.t / t.tell), x = t.tx * T - cx, y = t.ty * T - cy, red = '#e8463c';
            const blink = ((t.t / Math.max(3, Math.round(10 - 7 * k))) | 0) % 2 === 0;
            Gfx.alpha(0.12 + 0.25 * k); Gfx.rect(x + 1, y + 1, 14, 14, red); Gfx.alpha(1);
            Tells.stitchTile(x, y, blink ? shade(red, 0.45) : red);
            Gfx.alpha(0.2 + 0.4 * k); Tells.ellipse(x + 8, y + 10, Math.round(2 + 5 * k), PAL.ink); Gfx.alpha(1);
        }
        /* (the very end) how far Wren's hold on Gran's other hand has got: on the floor under the hands they clasp */
        const c = a.climax, at = c && c.h > 0 && GreatSpool.holdSpot(a);
        if (at) this.holdRing(at[0] - cx, at[1] - cy, Math.min(1, c.h / GreatSpool.HOLD), !!c.held);
    },
    over(a, cx, cy) {
        /* the foot of the Well: things tumbling down after you */
        for (const j of this.junk) {
            const im = spr(['pot', 'crate', 'block_wood', 'barrel_g'][j.k]); if (!im) continue;
            if (j.z <= 0) { Gfx.alpha(0.25); Gfx.rect(j.x - cx - 5, j.y - cy + 4, 10, 2, PAL.ink); Gfx.alpha(1); }
            Gfx.alpha(0.85); Gfx.img(im, j.x - cx - 8, j.y - cy - 10 - j.z); Gfx.alpha(1);
        }
        /* (at the top) things on their way into the drum, up in the air: dragged along a great thread, or high over your
           head off the walls; and Gran's throw, up off the drum and down onto its shadow */
        const d = a.find('theSpool'), t = d && d.toss;
        if (d) for (const j of d.junk) {
            const im = (j.thing && j.thing.sprite()) || spr(j.look) || spr('crate');
            if (j.high) { Gfx.alpha(0.2); Gfx.rect(j.x - cx - 5, j.y - cy + 3, 10, 2, PAL.ink); Gfx.alpha(1); }
            if (im) Gfx.img(im, j.x - cx - 8, j.y - cy - 12 - (j.high ? 14 : 0));
        }
        if (t && t.t > t.tell - 22) {
            const im = spr(t.look), k = (t.t - (t.tell - 22)) / 22, x0 = d.x + 32, y0 = d.y + 30, x1 = t.tx * T + 8, y1 = t.ty * T + 8;
            const x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k - Math.sin(k * Math.PI) * 26;
            if (im) Gfx.img(im, Math.round(x - cx - 8), Math.round(y - cy - 12));
        }
        /* wound into the face: drawn up into it, shrinking */
        for (const f of Pull.fx) {
            const k = f.t / 24;
            if (f.im) { Gfx.alpha(Math.max(0, 1 - k)); Gfx.img(f.im, f.x - cx, f.y - cy - 4 - k * 14); Gfx.alpha(1); }
            if (f.t === 2) Fx.ring(f.x + 8, f.y + 2, f.col || '#ffffff');
            Gfx.line(f.x + 8 - cx, f.y - cy - 4 - k * 14, f.x + 8 - cx, f.y - cy - 30, f.col || '#ffffff');
        }
    },
    /* a ring of stitches on the floor under the clasped hands, sewn one by one as the hold goes on, the next one flickering
       in (the patience ring's look, wider, in cream: Wren's red would be lost on her own clothes); let go, it unpicks,
       slowly */
    holdRing(x, y, k, sewing) {
        const N = 16, n = Math.floor(k * N);
        for (let i = 0; i < N; i++) {
            const t = -Math.PI / 2 + i / N * Math.PI * 2, sx = Math.round(x + Math.cos(t) * 10) - 1, sy = Math.round(y + Math.sin(t) * 6);
            /* (the stitches still to come: faint, pricked round the ring) */
            if (i > n || (i === n && !(sewing && (G.t >> 2) % 2))) { Gfx.alpha(0.35); Gfx.rect(sx, sy, 2, 1, '#c8b890'); Gfx.alpha(1); continue; }
            Gfx.rect(sx, sy + 1, 2, 1, Threads.UNDER); Gfx.rect(sx, sy, 2, 1, i < n ? '#fff4c0' : '#c8b890');
        }
    },
    /* a thing the drum is holding over its place till the place is clear */
    hanging(e, cx, cy) {
        const im = e.sprite ? e.sprite() : null; if (!im) return;
        const r = e.area.roomAt(e.tx, e.ty), bob = Math.round(Math.sin(G.t / 10) * 1.5);
        const x = e.tx * T - cx, y = e.ty * T - cy - (im.height - T) - 12 + bob;
        const top = r ? r.y * T + 14 - cy : y - 40;
        Gfx.line(x + 8, top, x + 8, y + 2, e.ret ? e.ret.color : THREAD.hesper);
        Gfx.alpha(0.18); Gfx.rect(x + 3, e.ty * T - cy + 12, 10, 2, PAL.ink); Gfx.alpha(1);
        Gfx.alpha(0.6); Gfx.img(im, x, y); Gfx.alpha(1);
    },
    drum(d, cx, cy) {
        const x = d.x - cx, y = d.y - cy, turn = Progress.flag('spool_all') ? 0 : d.t;
        /* a drum of every thread in the valley, round, in brass flanges, turning */
        for (let i = 0; i < 28; i++) for (let s = 0; s < 8; s++) {
            const u = (s + 0.5) / 8 * 2 - 1, k = Math.sqrt(1 - u * u);
            Gfx.rect(x + s * 8, y + i, 8, 1, shade(SPOOL_ALL[(i + (turn >> 3)) % SPOOL_ALL.length], -0.55 + 0.6 * k));
        }
        if (turn) for (let i = 0; i < 28; i += 3) { const ph = (turn * 0.6 + i * 9) % 64; Gfx.alpha(0.5); Gfx.rect(x + ph, y + i, 4, 1, '#ffffff'); Gfx.alpha(1); }
        Gfx.rect(x - 5, y - 7, 74, 7, PAL.ink); Gfx.rect(x - 4, y - 6, 72, 5, '#c9a24a'); Gfx.rect(x - 4, y - 6, 72, 1, '#f7d64a');
        Gfx.rect(x - 5, y + 28, 74, 7, PAL.ink); Gfx.rect(x - 4, y + 29, 72, 5, '#c9a24a'); Gfx.rect(x - 4, y + 29, 72, 1, '#f7d64a');
        this.peg(x + 32, y + 9);
    },
    /* the seventh place, high on the front of the drum: a brass peg, end on, in a patch of bare wood where nothing's wound,
       a blank brass tag under it, as the Hall of Names labels its pegs: the Wanderer's own (the Foot's sign says so).
       Nothing is ever hung on it */
    peg(x, y) {
        Gfx.rect(x - 6, y - 6, 13, 17, '#6a4630'); Gfx.rect(x - 6, y - 6, 13, 1, '#8a5e3c');
        Gfx.rect(x - 6, y - 5, 1, 16, '#3a2416'); Gfx.rect(x + 6, y - 5, 1, 16, '#3a2416'); Gfx.rect(x - 6, y + 10, 13, 1, '#3a2416');
        Gfx.rect(x - 4, y + 3, 3, 1, '#5a3a24'); Gfx.rect(x + 2, y - 3, 3, 1, '#5a3a24');
        Gfx.circle(x + 1, y + 2, 3, '#2a1a10');
        Gfx.circle(x, y, 3, PAL.ink); Gfx.circle(x, y, 2, '#c9a24a'); Gfx.rect(x - 1, y - 1, 1, 1, '#f7d64a'); Gfx.rect(x - 1, y - 2, 1, 1, '#fff4c0');
        Gfx.rect(x - 3, y + 5, 7, 4, PAL.ink); Gfx.rect(x - 2, y + 6, 5, 2, '#c9a24a'); Gfx.rect(x - 2, y + 6, 5, 1, '#f7d64a');
    },
    /* a thing Gran threw, lying where it came down: her thread on it, up to the drum, pulled tight as she takes it back */
    thrown(e, cx, cy) {
        const im = e.sprite(); if (!im) return;
        const s = e.area.find('theSpool'), late = e.life < 30 && !e.heldBy && !e.mv, x = e.px - cx, y = e.py - cy;
        if (s) { Gfx.alpha(late ? 0.8 : 0.35); Gfx.line(x + 8, y + 4, s.x + 32 - cx, s.y + 30 - cy, late ? shade(THREAD.hesper, 0.4) : THREAD.hesper); Gfx.alpha(1); }
        Gfx.img(im, x + (late ? ((G.t >> 1) % 2 ? 1 : -1) : 0), y - (im.height - T));
    },
    post(e, cx, cy) {
        const x = e.tx * T - cx, y = e.ty * T - cy, col = KNOT_COL[e.house];
        /* a brass-bound post wound thick with its House's thread */
        Gfx.rect(x + 2, y - 12, 12, 28, PAL.ink); Gfx.rect(x + 3, y - 11, 10, 26, '#6a6488');
        for (let i = 0; i < 24; i += 2) Gfx.rect(x + 3, y - 10 + i, 10, 1, i % 4 ? shade(col, -0.2) : col);
        Gfx.rect(x + 1, y - 13, 14, 3, '#c9a24a'); Gfx.rect(x + 1, y + 13, 14, 3, '#c9a24a'); Gfx.rect(x + 2, y - 13, 12, 1, '#f7d64a');
        if (e.cut) { Gfx.line(x + 8, y - 6, x + 14, y + 4, shade(col, -0.4)); return; }
        const s = e.area.find('theSpool'); if (!s) return;
        /* still in Gran's hands: drawn with her (SpoolArt.hands), from the post to her fist */
        if (e.held && e.area.ents.some(n => n.who === 'gran' && !n.removed)) return;
        /* free: to the drum's near side, low */
        const x1 = s.x + (e.tx < s.tx ? 1 : 63) - cx, y1 = s.y + 22 - cy;
        if (e.slack > 0) {
            /* slack: it sags, wobbling */
            const sag = 10 + Math.sin(G.t / 4) * 3; let px0 = x + 8, py0 = y - 6;
            for (let i = 1; i <= 12; i++) { const k = i / 12, nx = x + 8 + (x1 - x - 8) * k, ny = y - 6 + (y1 - y + 6) * k + Math.sin(k * Math.PI) * sag; Gfx.line(px0, py0, nx, ny, shade(col, 0.3)); px0 = nx; py0 = ny; }
        } else {
            /* taut: it hums, a shimmer running along it into the drum */
            Gfx.line(x + 8, y - 6, x1, y1, col); Gfx.line(x + 8, y - 5, x1, y1 + 1, shade(col, -0.3));
            const k = ((G.t * 0.02) + e.tx * 0.13) % 1;
            Gfx.rect(Math.round(x + 8 + (x1 - x - 8) * k) - 1, Math.round(y - 6 + (y1 - y + 6) * k) - 1, 2, 2, shade(col, 0.6));
        }
    },
    /* Gran's hands on the Spool itself, once the last thread's cut (g.onRim): her back to you, both arms up to the drum's
       rim at her head; or, Linnet holding one, the other reached back up to it over her shoulder (arms as the clasped
       hands are drawn: a line of skin, inked either side, a hand at the end) */
    rimHands(g, cx, cy) {
        const im = g.sprite(), top = g.py + 14 - (im ? im.height : 24) - cy, x = g.px - cx;
        const held = Ending.hands && Ending.hands.includes(g) ? Ending.hands : null, i = held ? held.indexOf(g) : -1;
        /* (which of her hands are free: the one away from whoever holds the other) */
        const sides = !held ? [true, false] : i === 0 && held.length > 1 ? [true] : i === held.length - 1 && held.length > 1 ? [false] : [];
        for (const left of sides) {
            const up = g.dir === UP, sx = x + (left ? 3 : 13), sy = top + 11, hx = x + (left ? (up ? -1 : 2) : (up ? 17 : 14)), hy = top + (up ? 4 : 1);
            Gfx.line(sx, sy - 1, hx, hy - 1, PAL.ink); Gfx.line(sx, sy + 1, hx, hy + 1, PAL.ink); Gfx.line(sx, sy, hx, hy, PAL.skin);
            Gfx.rect(hx - 2, hy - 2, 4, 4, PAL.ink); Gfx.rect(hx - 1, hy - 1, 2, 2, PAL.skin); Gfx.rect(hx - 1, hy - 1, 1, 1, '#ffe0c4');
        }
    },
    /* the great threads still in Gran's hands: from each post to her fist, taut, a shimmer running in to her; each fist
       wound round thick with them (drawn over her, as she's drawn) */
    hands(g, cx, cy) {
        const held = g.area.ents.filter(e => e.kind === 'greatpost' && e.held);
        for (const side of [true, false]) {
            const mine = held.filter(e => (e.tx < g.tx) === side); if (!mine.length) continue;
            const hx = g.px + (side ? 2 : 14) - cx, hy = g.py + 4 - cy;
            for (const e of mine) {
                const col = KNOT_COL[e.house], x = e.tx * T + 8 - cx, y = e.ty * T - 6 - cy;
                Gfx.line(x, y, hx, hy, col); Gfx.line(x, y + 1, hx, hy + 1, shade(col, -0.3));
                const k = ((G.t * 0.02) + e.tx * 0.13 + e.ty * 0.07) % 1;
                Gfx.rect(Math.round(x + (hx - x) * k) - 1, Math.round(y + (hy - y) * k) - 1, 2, 2, shade(col, 0.6));
            }
            /* the fist: a ball of thread, a stripe of each colour round it */
            Gfx.rect(hx - 3, hy - 3, 7, 7, PAL.ink);
            for (let i = 0; i < 5; i++) Gfx.rect(hx - 2, hy - 2 + i, 5, 1, KNOT_COL[mine[i % mine.length].house]);
            Gfx.rect(hx - 1, hy - 2, 1, 1, '#ffffff');
        }
    },
    /* a Knot of the Wander, tied in its Maker's thread, the thread running up into the drum's face */
    knot(e, cx, cy) {
        const x = e.tx * T - cx, y = e.ty * T - cy, col = KNOT_COL[e.house];
        const r = e.area.roomAt(e.tx, e.ty), top = r ? r.y * T - cy + 14 : y - 30;
        if (e.undone) { Gfx.line(x + 8, top, x + 8, y + 2, shade(col, -0.4)); Gfx.line(x + 8, y + 2, x + 4, y + 12, shade(col, -0.4)); Gfx.line(x + 8, y + 2, x + 12, y + 11, shade(col, -0.5)); return; }
        const tw = Math.round(Math.sin(G.t / 9));
        Gfx.line(x + 8, top, x + 8 + tw, y - 2, col); Gfx.line(x + 9, top, x + 9 + tw, y - 2, shade(col, -0.35));
        Gfx.circle(x + 8, y + 6, 7, PAL.ink); Gfx.circle(x + 8, y + 6, 6, col); Gfx.circle(x + 8, y + 6, 3, shade(col, 0.35));
        Gfx.rect(x + 3, y + 5, 10, 2, shade(col, -0.45)); Gfx.rect(x + 7, y + 1, 2, 10, shade(col, -0.25));
        Gfx.rect(x + 2, y + 10, 3, 4, col); Gfx.rect(x + 11, y + 10, 3, 4, col); Gfx.rect(x + 2, y + 13, 3, 1, shade(col, -0.4)); Gfx.rect(x + 11, y + 13, 3, 1, shade(col, -0.4));
        if ((G.t >> 4) % 2) Gfx.rect(x + 6, y + 3, 2, 2, '#ffffff');
    },
    /* the Climb: what's flying, and once it's begun, a stitched line along the near side of each lane (a hit puts you back
       behind it). Before each throw the lane's tell: the whole lane lit, blinking faster as it comes (as a boss's charge
       lane is), and a glow gathering at the end it'll come from */
    lane(l, cx, cy) {
        if (!l.on) return;
        const r = l.area.roomAt(l.tx, l.ty), red = '#e8463c';
        if (r) for (let tx = r.x + 1; tx < r.x + r.w - 1; tx++) { if (l.area.kind(tx, l.ty + 1).solid) continue; const sx = tx * T - cx, sy = (l.ty + 1) * T - cy; Gfx.rect(sx + 2, sy, 4, 1, red); Gfx.rect(sx + 10, sy, 4, 1, red); }
        const k = l.tellK;
        if (r && k > 0) {
            const t = l.t % l.period, blink = ((t / Math.max(3, Math.round(10 - 7 * k))) | 0) % 2 === 0;
            for (let tx = r.x + 1; tx < r.x + r.w - 1; tx++) {
                if (l.area.kind(tx, l.ty).solid) continue;
                const x = tx * T - cx, y = l.ty * T - cy;
                Gfx.alpha(0.1 + 0.25 * k + (blink ? 0.08 : 0)); Gfx.rect(x + 1, y + 1, 14, 14, red); Gfx.alpha(1);
                Tells.stitchTile(x, y, blink ? shade(red, 0.45) : red);
            }
        }
        if (k > 0 || l.throwing) Tells.glow(l.tx * T + 8 - l.dir * 5 - cx, l.ty * T + 7 - cy, l.throwing ? 1 : k, '#f7d64a');
        for (const j of l.flying) Gfx.img(spr(['block_wood', 'pot', 'crate'][j.k]) || spr('block_wood'), j.x - cx - 8, l.ty * T - cy - 4 + Math.sin(j.x / 6) * 2);
    },
    /* the Kiln's cracked charm: a split down it */
    crack(c, cx, cy) {
        const x = c.x - cx + 8 + Math.round(Math.sin(c.swing / 3) * (c.swing / 30) * 3), y = c.y - cy - 6;
        Gfx.line(x - 1, y, x + 1, y + 2, PAL.ink); Gfx.line(x + 1, y + 2, x - 1, y + 5, PAL.ink);
    },
};
AREAS.greatspool.drawGround = (a, cx, cy) => SpoolArt.ground(a, cx, cy);
AREAS.greatspool.drawOver = (a, cx, cy) => SpoolArt.over(a, cx, cy);
/* the drum holds a thing over its place, waiting for the place to clear */
{
    const draw0 = GridThing.prototype.draw;
    GridThing.prototype.draw = function (cx, cy) {
        if (this.pendingHome && this.area && Pull.on(this.area)) return SpoolArt.hanging(this, cx, cy);
        return draw0.call(this, cx, cy);
    };
}

function initSpoolArt() {
    /* a board of the Spool's own floor, pulled up (the top room's last pair) */
    defSprite('gs_board', ['................', '................', '................', '................', '.kkkkkkkkkkkkkk.', 'kbbbbbbbbbbbbbbk', 'kBbbbbbbbbBbbbbk', 'kbbbbBbbbbbbbbbk', 'kkkkkkkkkkkkkkkk', '................', '................', '................', '................', '................', '................', '................'],
        { b: '#4a3a3a', B: '#2e2226' });
    /* the old mangle: two wooden rollers in an iron frame, a crank on its side */
    defSprite('gs_mangle', ['....kkkkkkkk....', '...kxxxxxxxxk...', '..kxkkkkkkkkxk..', '..kxkuuuuuukxkk.', '..kxkUUUUUUkxkyk', '..kxkkkkkkkkxkyk', '..kxkuuuuuukxk.k', '..kxkUUUUUUkxk..', '..kxkkkkkkkkxk..', '..kxxxxxxxxxxk..', '...kxk....kxk...', '...kxk....kxk...', '..kxxxk..kxxxk..', '..kkkkk..kkkkk..', '................', '................'],
        { x: '#5a5264', u: '#e6c08a', U: '#b48a52', y: '#c9a24a' });
    /* an old cracked bell, lying asleep on its side */
    defSprite('gs_oldbell', ['................', '................', '.....kkkkkk.....', '....kyyyyyyk....', '...kyywyyyyyk...', '..kyywyyyykyyk..', '..kyyyyyykyyyk..', '.kyyyyyyyykyyyk.', '.kYYYYYYYYYYYYk.', 'kkkkkkkkkkkkkkkk', '.kYk........kYk.', '..k..........k..', '................', '................', '................', '................'],
        { y: '#b88a2a', Y: '#8a6420', w: '#e8c870' });
    /* a painted rock for the stage: plywood, painted grey, a prop-maker's stencil on its side */
    defSprite('gs_rock', ['................', '.....kkkkkk.....', '...kkggggggkk...', '..kgggwgggggGk..', '.kggwwgggggggGk.', '.kgggggggggGGGk.', 'kggggggggGGGGGGk', 'kgggggggGGGGGGGk', 'kGgggggGGGGGrGGk', 'kGGgggGGGGGrGGGk', 'kGGGGGGGGGrrrGGk', '.kGGGGGGGGGGGGk.', '..kbbbbbbbbbbk..', '..kBBBBBBBBBBk..', '...kkkkkkkkkk...', '................'],
        { g: '#a39aa8', G: '#7f7688', w: '#c4bccb', r: '#d6304e', b: '#c9925a', B: '#8a5a2e' });
    /* Bram's clay understudy: a puppet fired in the kiln */
    const pp = SPR_SRC.puppet, ppu = SPR_SRC.puppet_up, clay = { w: '#e8a070', W: '#c4784a', d: '#6a2e22', r: '#c4623a', R: '#8a3c26', e: '#2a1f2d' };
    if (pp) defSprite('gs_clay', pp.rows, Object.assign({}, pp.legend, clay));
    if (ppu) defSprite('gs_clay_up', ppu.rows, Object.assign({}, ppu.legend, clay));
    /* the room's brake: a brass ratchet on a plate in the wall, its handle up (and hauled down) */
    defSprite('gs_ratchet', ['.......kk.......', '......kyyk......', '.......kyk......', '.......kyk......', '..kkkkkkykkkkk..', '..kxxxxkykxxxk..', '..kxkkkkkkkkxk..', '..kxkyYyYyYkxk..', '..kxkYkkkkYkxk..', '..kxkykbbkykxk..', '..kxkYkkkkYkxk..', '..kxkyYyYyYkxk..', '..kxkkkkkkkkxk..', '..kxxxxxxxxxxk..', '..kkkkkkkkkkkk..', '................'],
        { x: '#5a5264', y: '#f7d64a', Y: '#c9a24a', b: '#8a5a2e' });
    defSprite('gs_ratchet_on', ['................', '................', '................', '................', '..kkkkkkkkkkkk..', '..kxxxxxxxxxxk..', '..kxkkkkkkkkxk..', '..kxkYyYyYyk.k..', '..kxkykkkkYkykk.', '..kxkYkbbkyk.kyk', '..kxkykkkkYkxkyk', '..kxkYyYyYykxk.k', '..kxkkkkkkkkxk..', '..kxxxxxxxxxxk..', '..kkkkkkkkkkkk..', '................'],
        { x: '#5a5264', y: '#f7d64a', Y: '#c9a24a', b: '#8a5a2e' });
    /* Mother Ives's drying lines: linen pegged out on a line of teal thread */
    ART.gs_line = paintSprite(48, 16, x => {
        const R = (c, a, b, w, h) => sq(c, a, b, w, h, x);
        R('#3fc1b5', 0, 2, 48, 1);
        for (const [a, w, c] of [[3, 10, '#fbf6ea'], [17, 8, '#e8c8d0'], [29, 12, '#f4ecdc'], [44, 3, '#fbf6ea']]) { R(c, a, 3, w, 9); R(shade(c, -0.15), a, 10, w, 2); R('#c9925a', a + 1, 1, 1, 3); R('#c9925a', a + w - 2, 1, 1, 3); }
    });
    ART.gs_basket = paintSprite(16, 16, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#9a6438', 2, 6, 12, 8); R('#c9925a', 2, 6, 12, 2); for (let i = 3; i < 14; i += 3) R('#7a4e32', i, 8, 1, 6); R('#fbf6ea', 3, 3, 10, 4); R('#3fc1b5', 5, 4, 4, 2); });
    ART.gs_press = paintSprite(16, 24, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#6b4128', 3, 6, 10, 18); R('#9a6438', 4, 7, 8, 16); R('#3fc1b5', 4, 8, 8, 2); R('#efe4cc', 4, 12, 8, 6); R('#5a5264', 6, 2, 4, 5); R('#c9a24a', 7, 1, 2, 2); });
    ART.gs_kilnshelf = paintSprite(16, 24, x => {
        const R = (c, a, b, w, h) => sq(c, a, b, w, h, x);
        R('#6b4128', 1, 4, 14, 20); R('#9a6438', 2, 5, 12, 2); R('#9a6438', 2, 13, 12, 2); R('#3a2418', 2, 7, 12, 6); R('#3a2418', 2, 15, 12, 8);
        R('#d98f3a', 3, 8, 3, 5); R('#e8946a', 8, 9, 3, 4); R('#c4623a', 4, 17, 4, 6); R('#d98f3a', 10, 18, 3, 5);
    });
    /* the Prompt Box's stage dressing: a costume rail, the ghost light left burning on an empty stage, painted flats */
    ART.gs_rail = paintSprite(32, 24, x => {
        const R = (c, a, b, w, h) => sq(c, a, b, w, h, x);
        R('#2a1f2d', 2, 1, 28, 3); R('#c9a24a', 3, 2, 26, 1); R('#2a1f2d', 2, 1, 3, 21); R('#2a1f2d', 27, 1, 3, 21); R('#c9a24a', 3, 2, 1, 19); R('#c9a24a', 28, 2, 1, 19);
        R('#2a1f2d', 0, 20, 8, 2); R('#2a1f2d', 24, 20, 8, 2); R('#5a5264', 1, 22, 2, 2); R('#5a5264', 5, 22, 2, 2); R('#5a5264', 25, 22, 2, 2); R('#5a5264', 29, 22, 2, 2);
        for (const [a, w, h, c] of [[6, 7, 14, '#d6304e'], [14, 6, 10, '#e8c04a'], [21, 6, 16, '#4f6fb0']]) {
            R('#2a1f2d', a + (w >> 1), 3, 1, 2); R('#2a1f2d', a - 1, 5, w + 2, h + 1); R(c, a, 5, w, h); R(shade(c, 0.3), a, 5, 1, h); R(shade(c, -0.3), a + w - 2, 6, 2, h - 1);
        }
        R('#f7d64a', 9, 7, 1, 1); R('#f7d64a', 9, 10, 1, 1); R('#f7e08a', 16, 7, 2, 1);
    });
    ART.gs_ghostlight = paintSprite(16, 32, x => {
        const R = (c, a, b, w, h) => sq(c, a, b, w, h, x);
        x.globalAlpha = 0.18; R('#fff4c0', 1, 0, 14, 12); x.globalAlpha = 0.3; R('#fff4c0', 3, 1, 10, 9); x.globalAlpha = 1;
        R('#2a1f2d', 5, 2, 6, 7); R('#fff4c0', 6, 3, 4, 5); R('#ffffff', 7, 4, 1, 2); R('#5a5264', 5, 5, 6, 1); R('#5a5264', 7, 2, 1, 7);
        R('#2a1f2d', 7, 9, 2, 19); R('#7f7688', 7, 9, 1, 19);
        R('#2a1f2d', 3, 27, 10, 2); R('#2a1f2d', 2, 29, 3, 3); R('#2a1f2d', 11, 29, 3, 3); R('#2a1f2d', 7, 28, 2, 4); R('#5a5264', 3, 27, 10, 1);
    });
    ART.gs_flats = paintSprite(32, 24, x => {
        const R = (c, a, b, w, h) => sq(c, a, b, w, h, x);
        R('#2a1f2d', 1, 2, 18, 22); R('#c9925a', 2, 3, 16, 20); R('#9a6438', 2, 3, 16, 2); R('#9a6438', 9, 3, 2, 20); R('#9a6438', 2, 12, 16, 2);
        R('#2a1f2d', 12, 4, 19, 20); R('#7fb0d8', 13, 5, 17, 18); R('#a5dcf7', 13, 5, 17, 4); R('#f7f2e0', 24, 7, 3, 3);
        R('#5a5264', 15, 12, 6, 11); R('#7f7688', 15, 12, 6, 2); R('#5a5264', 14, 10, 2, 3); R('#5a5264', 17, 10, 2, 3); R('#5a5264', 20, 10, 2, 3); R('#2a1f2d', 17, 17, 2, 6);
        R('#3a8a4a', 22, 15, 8, 8); R('#5fb060', 23, 14, 6, 3); R('#6b4128', 25, 21, 2, 2);
    });
    /* the Gale Loft's practice table: handbells, mouths down on a cloth */
    ART.gs_handbells = paintSprite(32, 24, x => {
        const R = (c, a, b, w, h) => sq(c, a, b, w, h, x);
        R('#2a1f2d', 1, 13, 30, 3); R('#6b4128', 2, 14, 28, 2); R('#2a1f2d', 3, 16, 2, 8); R('#2a1f2d', 27, 16, 2, 8); R('#4a301e', 3, 16, 1, 7); R('#4a301e', 27, 16, 1, 7);
        R('#e8c04a', 2, 12, 28, 2); R('#fff4c0', 2, 12, 28, 1);
        for (const [a, h] of [[4, 6], [10, 5], [16, 7], [23, 5]]) { R('#2a1f2d', a, 12 - h, 6, h); R('#c8903a', a + 1, 13 - h, 4, h - 1); R('#f7e08a', a + 1, 13 - h, 1, h - 2); R('#6b4128', a + 2, 9 - h, 2, 3); R('#2a1f2d', a + 2, 9 - h, 2, 1); }
    });
    ART.gs_millhouse = paintSprite(16, 24, x => {
        const R = (c, a, b, w, h) => sq(c, a, b, w, h, x);
        R('#6b4128', 2, 10, 12, 14); R('#c9925a', 3, 11, 10, 12); R('#3a2418', 6, 16, 4, 7); R('#4f9be0', 1, 6, 14, 5); R('#2e5a98', 1, 10, 14, 1); R('#a5dcf7', 2, 6, 12, 1);
        R('#e6c08a', 10, 1, 2, 6); R('#e6c08a', 7, 3, 8, 2);
    });
}
CONTENT_INIT.push(initSpoolArt);
