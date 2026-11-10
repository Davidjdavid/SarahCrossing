/* The fog at the edge of the valley, drawn as what it is: a bank of fine threads pulled taut at the limit of their
   reach, white and lilac, billowing a little as it drifts, its edge soft and never on a tile line (it spills over the
   ground at its foot in rounded tongues that come and go). The threads glint now and then; after the Unwinding
   they're gone slack and it's only a mist. Only the picture: what a fog tile does is still 06_area.js's and
   11_player.js's business. Drawn in every outdoor place with fog in it (the Hollow, and the Drift from the far side). */

const Fog = {
    S: 128,                    /* the billows repeat every S pixels (drawn from a picture S + 16 square) */
    tex: null,
    BASE: '#d9d5df',
    /* each land tile's fog neighbours, and each fog tile's distance from the land and which way it lies */
    info(a) {
        if (a._fog && a._fog.n === a.cells.length) return a._fog;
        const w = a.w, h = a.h, near = new Uint8Array(w * h), depth = new Uint8Array(w * h), dir = new Uint8Array(w * h);
        const fog = (x, y) => a.inside(x, y) && a.cells[y * w + x].k === 'fog';
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
            const i = y * w + x;
            if (fog(x, y)) {
                let d = 9, hz = 0, vt = 0;
                for (let r = 1; r <= 4 && d === 9; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
                    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || !a.inside(x + dx, y + dy) || fog(x + dx, y + dy)) continue;
                    d = r;
                    if (Math.abs(dx) >= Math.abs(dy)) hz++; else vt++;
                }
                depth[i] = d; dir[i] = vt > hz ? 2 : 1;
            } else {
                let m = 0;
                [[0, -1], [1, 0], [0, 1], [-1, 0], [1, -1], [1, 1], [-1, 1], [-1, -1]].forEach(([dx, dy], b) => { if (fog(x + dx, y + dy)) m |= 1 << b; });
                near[i] = m;
            }
        }
        /* deep in, the threads keep to the way of the nearest edge */
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (depth[i] === 9) dir[i] = x > 0 && dir[i - 1] ? dir[i - 1] : y > 0 && dir[i - w] ? dir[i - w] : 1; }
        return (a._fog = { n: a.cells.length, near, depth, dir });
    },
    /* the billows: soft noise that wraps, lighter puffs and lilac hollows */
    makeTex() {
        const S = this.S, c = Gfx.makeCanvas(S + 16, S + 16), x = c.getContext('2d');
        const n2 = (px, py, sc, s) => {
            const P = S / sc, fx = px / sc, fy = py / sc, i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j, U = u * u * (3 - 2 * u), V = v * v * (3 - 2 * v);
            const g = (a, b) => hash2(((a % P) + P) % P, ((b % P) + P) % P, s);
            return lerp(lerp(g(i, j), g(i + 1, j), U), lerp(g(i, j + 1), g(i + 1, j + 1), U), V);
        };
        for (let py = 0; py < S + 16; py++) for (let px0 = 0; px0 < S + 16; px0++) {
            const X = px0 % S, Y = py % S;
            const v = n2(X, Y, 32, 3) * 0.6 + n2(X, Y, 16, 7) * 0.3 + n2(X, Y, 8, 11) * 0.1;
            /* in bands, as pixel art clouds are: a puff's body, its lit top, a hollow's shade */
            if (v > 0.66) x.fillStyle = 'rgba(255,253,255,0.62)';
            else if (v > 0.57) x.fillStyle = 'rgba(246,244,250,0.42)';
            else if (v < 0.33) x.fillStyle = 'rgba(150,140,180,0.30)';
            else if (v < 0.4) x.fillStyle = 'rgba(176,168,200,0.18)';
            else continue;
            x.fillRect(px0, py, 1, 1);
        }
        return c;
    },
    /* the fog's own tile, plain: the billows and threads are laid over it */
    tile(v) {
        return tileCanvas('fogbase:' + v, x => {
            fill(x, this.BASE);
            for (let j = 0; j < T; j++) for (let i = 0; i < T; i++) { const r = hash2(i, j, v + 140); if (r < 0.06) px(x, i, j, '#e6e2ec'); else if (r > 0.95) px(x, i, j, '#ccc6d4'); }
        });
    },
    /* how far a tongue of fog reaches over the ground at a point along the edge (pixels, 0 to 14), slowly changing */
    reach(u, t) {
        const n = (z, s) => { const i = Math.floor(z), f = z - i, k = f * f * (3 - 2 * f); return lerp(hash2(i, 5, s), hash2(i + 1, 5, s), k); };
        return 2 + n(u / 19 + t, 91) * 8 + n(u / 7 - t * 1.7, 92) * 4;
    },
    spill(sx, sy, gx, gy, m, t, al) {
        const body = '#dcd8e2', edge = '#ebe8f0';
        const run = (L, f) => { L = Math.round(L); if (L <= 0) return; f(0, L - 1, body); f(L - 1, 1, edge); };
        Gfx.alpha(al);
        if (m & 8) for (let j = 0; j < T; j++) run(this.reach(gy + j, t), (o, n, c) => Gfx.rect(sx + o, sy + j, n, 1, c));
        if (m & 2) for (let j = 0; j < T; j++) run(this.reach(gy + j + 999, t), (o, n, c) => Gfx.rect(sx + T - o - n, sy + j, n, 1, c));
        if (m & 1) for (let i = 0; i < T; i++) run(this.reach(gx + i + 333, t) * 0.8, (o, n, c) => Gfx.rect(sx + i, sy + o, 1, n, c));
        if (m & 4) for (let i = 0; i < T; i++) run(this.reach(gx + i + 666, t) * 0.8, (o, n, c) => Gfx.rect(sx + i, sy + T - o - n, 1, n, c));
        /* only a corner touches the fog: a little round wisp in it */
        const corner = (b, cx, cy) => {
            if (!(m & (1 << b))) return;
            const r = 3 + this.reach(gx * 3 + gy + b * 50, t) * 0.35;
            for (let j = 0; j < r; j++) { const w = Math.round(Math.sqrt(r * r - j * j)); Gfx.rect(cx < 8 ? sx : sx + T - w, cy < 8 ? sy + j : sy + T - 1 - j, w, 1, body); }
        };
        if (!(m & 9)) corner(7, 0, 0);
        if (!(m & 3)) corner(4, 15, 0);
        if (!(m & 6)) corner(5, 15, 15);
        if (!(m & 12)) corner(6, 0, 15);
        Gfx.alpha(1);
    },
    draw(a, cx, cy) {
        if (HEADLESS || !a) return;
        const F = this.info(a);
        if (!this.tex) this.tex = this.makeTex();
        const S = this.S, slack = Progress.flag('unwound'), pull = Progress.flag('great_pull') && !slack;
        const tx0 = Math.floor(cx / T), ty0 = Math.floor(cy / T);
        const d1 = Math.floor(G.t / 7), d2 = Math.floor(G.t / 13), t = G.t / 900;
        for (let ty = ty0; ty <= ty0 + Math.ceil(H / T); ty++) for (let tx = tx0; tx <= tx0 + Math.ceil(W / T); tx++) {
            if (!a.inside(tx, ty)) continue;
            const i = ty * a.w + tx, sx = tx * T - cx, sy = ty * T - cy, gx = tx * T, gy = ty * T;
            if (a.cells[i].k !== 'fog') {
                if (F.near[i]) this.spill(sx, sy, gx, gy, F.near[i], t, slack ? 0.55 : 1);
                continue;
            }
            const deep = F.depth[i];
            /* two layers of billows drifting their own ways (thicker at the front of the bank) */
            const ux = (((gx + d1) % S) + S) % S, uy = (((gy + (d1 >> 1)) % S) + S) % S;
            Gfx.ctx.drawImage(this.tex, ux, uy, T, T, sx, sy, T, T);
            const vx = (((gx - d2 + 37) % S) + S) % S, vy = (((gy + 61) % S) + S) % S;
            Gfx.alpha(deep <= 2 ? 0.9 : 0.5); Gfx.ctx.drawImage(this.tex, vx, vy, T, T, sx, sy, T, T); Gfx.alpha(1);
            if (slack) continue;
            /* the threads: long and straight, out from the valley into the bank, coming and going along their length */
            const hz = F.dir[i] !== 2, lane = hz ? ty : tx, along = hz ? gx : gy;
            for (let k = 0; k < 3; k++) {
                const off = 1 + Math.floor(hash2(lane, k, 81) * 13);
                const b = hash2(Math.floor((along + k * 41) / 64), lane * 3 + k, 82) * 0.6 + hash2(Math.floor((along + k * 13) / 32), lane + k * 5, 83) * 0.4;
                if (b < 0.28) continue;
                const al = Math.min(0.85, 0.25 + (b - 0.28) * 1.3) * (deep >= 5 ? 0.7 : 1);
                const tr = pull ? Math.round(Math.sin(G.t / 3 + lane + k)) : 0, o = off + tr;
                Gfx.alpha(al * 0.5);
                if (hz) Gfx.rect(sx, sy + o + 1, T, 1, '#a89ec0'); else Gfx.rect(sx + o + 1, sy, 1, T, '#a89ec0');
                Gfx.alpha(al);
                if (hz) Gfx.rect(sx, sy + o, T, 1, '#ffffff'); else Gfx.rect(sx + o, sy, 1, T, '#ffffff');
                /* a glint running along it, now and then */
                const P = 520 + Math.floor(hash2(lane, k, 84) * 600), g = Math.floor(along / P) * P + (G.t * 2 + Math.floor(hash2(k, lane, 85) * P)) % P, gl = g - along;
                if (gl >= 0 && gl < T) { Gfx.alpha(1); if (hz) Gfx.rect(sx + gl, sy + o, Math.min(5, T - gl), 1, '#fffbd8'); else Gfx.rect(sx + o, sy + gl, 1, Math.min(5, T - gl), '#fffbd8'); }
                Gfx.alpha(1);
            }
        }
    },
};
/* fog tiles drawn plain (the old tile's fine lines all ran one way, like a slab's grain), everything else as before */
{
    const draw0 = TileDraw.draw;
    TileDraw.draw = function (area, tx, ty, sx, sy) {
        if (area.cell(tx, ty).p === 'fog' && area.family === 'outdoor') { Gfx.img(Fog.tile(Math.floor(hash2(tx, ty, 99) * 4)), sx, sy); return; }
        return draw0.call(this, area, tx, ty, sx, sy);
    };
}
CONTENT_INIT.push(() => {
    const g0 = AREAS.hollow.drawGround;
    AREAS.hollow.drawGround = (a, cx, cy) => { if (g0) g0(a, cx, cy); Fog.draw(a, cx, cy); };
});
