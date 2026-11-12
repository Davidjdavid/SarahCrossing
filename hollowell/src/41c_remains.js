/* What a beaten foe leaves while its end is told (the words follow what's seen, fix round F): its pieces, a ball of its
   yarn, its thread running off down the cracks, each going its own way at its own pace, so whatever the line says is
   happening is still on screen when it's said. One Remains in the room draws all its bits, and goes when the last has
   (pieces left lying stay till the room is built again). */
class Remains extends Ent {
    /* bits: { from: [x, y], to: [x, y] (world pixels, at the bit's foot), delay (frames before it sets off), speed (pixels
       a frame), hop (pixels between hops, 0 for none) and lift (their height), rattle (jitters along), end: 'gone' (drawn
       till it gets there, and linger frames more), 'lie' (left lying there) or 'fade' (fades where it ends, over fade
       frames), look(x, y, bit, k) (draws it at that spot on the screen; k: how far along, 0 to 1), shadow }.
       opts: x, y (where it is, for what's on screen), floor (lying on the floor, under everyone), top (over everything
       standing: a ball of yarn bobbing down a race among the crates) */
    constructor(bits, opts = {}) {
        super('remains', { x: opts.x || 0, y: opts.y || 0, floor: !!opts.floor, top: !!opts.top });
        this.bits = bits.map(b => Object.assign({ delay: 0, speed: 1, hop: 0, lift: 0, end: 'gone', linger: 0, fade: 20 }, b));
        for (const b of this.bits) b.len = Math.hypot(b.to[0] - b.from[0], b.to[1] - b.from[1]);
        this.t = 0;
    }
    get sortY() { return this.floor ? -1000 : this.top ? 1e6 : this.y + 4; }
    /* how long a bit takes from the start to be done with (Infinity: left lying) */
    endOf(b) { return b.end === 'lie' ? Infinity : b.delay + b.len / b.speed + (b.end === 'fade' ? b.fade : b.linger); }
    get done() { return this.bits.every(b => this.t >= this.endOf(b)); }
    /* any bit still to be seen (for the scenes' tests: what the line tells of is still there) */
    showing() { return this.bits.some(b => this.t < this.endOf(b)); }
    /* the box round what's still to be seen of it (what words on the screen keep clear of, as a line's focus) */
    box() {
        let r = null;
        for (const b of this.bits) {
            if (this.t >= this.endOf(b)) continue;
            const [x, y, z] = this.at(b), q = [x - 8, y - z - (b.tall || 14), x + 8, y + 2];
            r = r ? [Math.min(r[0], q[0]), Math.min(r[1], q[1]), Math.max(r[2], q[2]), Math.max(r[3], q[3])] : q;
        }
        return r || [this.x - 8, this.y - 14, this.x + 8, this.y + 2];
    }
    get x0() { return this.box()[0]; }
    get y0() { return this.box()[1]; }
    get x1() { return this.box()[2]; }
    get y1() { return this.box()[3]; }
    update() {
        this.t++;
        if (this.done) { this.area.remove(this); return; }
        /* (all that's left of it come to rest, lying on the floor: under anyone walking over it) */
        if (!this.floor && this.bits.every(b => this.t >= this.endOf(b) || (b.end === 'lie' && this.t - b.delay >= b.len / b.speed))) this.floor = true;
    }
    /* where a bit is now: [x, y, its lift off the floor, how far along, its strength] */
    at(b) {
        const t = this.t - b.delay, s = Math.max(0, Math.min(b.len, t * b.speed)), k = b.len ? s / b.len : t >= 0 ? 1 : 0;
        let x = lerp(b.from[0], b.to[0], k), y = lerp(b.from[1], b.to[1], k);
        const z = b.hop && k < 1 ? Math.abs(Math.sin(s / b.hop * Math.PI)) * b.lift : 0;
        if (b.rattle && t > 0 && k < 1) { x += ((t >> 1) % 2 ? 1 : -1); y += ((t >> 2) % 2 ? 1 : 0); }
        const over = t - b.len / b.speed, a = b.end === 'fade' && over > 0 ? Math.max(0, 1 - over / b.fade) : 1;
        return [x, y, z, k, a];
    }
    draw(cx, cy) {
        for (const b of this.bits) {
            if (this.t >= this.endOf(b)) continue;
            const [x, y, z, k, a] = this.at(b);
            if (a <= 0) continue;
            if (b.shadow !== false && z > 0.5) { Gfx.alpha(0.25 * a); Gfx.rect(Math.round(x - cx) - 3, Math.round(y - cy), 7, 2, PAL.ink); }
            Gfx.alpha(a);
            b.look(Math.round(x - cx), Math.round(y - cy - z), b, k);
            Gfx.alpha(1);
        }
    }
}
const RemainsKit = {
    /* a picture upside down (a fish rolled belly up) */
    flipV(im) {
        if (!im || HEADLESS) return im;
        if (im._flipV) return im._flipV;
        const c = Gfx.makeCanvas(im.width, im.height), x = c.getContext('2d');
        x.translate(0, im.height); x.scale(1, -1); x.drawImage(im, 0, 0);
        return (im._flipV = c);
    },
    /* a ball of yarn, rolling (its stripe turning as it goes) */
    yarn(col, r = 3) {
        return (x, y, b, k) => {
            Gfx.circle(x, y - r, r + 1, PAL.ink); Gfx.circle(x, y - r, r, col);
            const s = Math.floor(k * b.len / 3) % 3;
            Gfx.rect(x - r + 1, y - r - 1 + s - 1, r * 2 - 1, 1, shade(col, 0.4)); Gfx.rect(x - r + 1, y - r + 1 + s - 1, r * 2 - 1, 1, shade(col, -0.3));
        };
    },
    /* a piece of a picture (sx, sy, w, h of it), stood on its foot, inked round where it broke off */
    part(im, sx, sy, w, h) {
        return (x, y) => {
            if (!im) return;
            const ink = tinted(im, PAL.ink), X = x - Math.round(w / 2), Y = y - h;
            for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) Gfx.sub(ink, sx, sy, w, h, X + dx, Y + dy);
            Gfx.sub(im, sx, sy, w, h, X, Y);
        };
    },
    /* thread running off along the cracks between the boards, like water, from x, y (the same runs every time for the same
       seed: each turning along the grain now and then, stopping at a wall) */
    runs(area, x, y, n, seed, cols) {
        const out = [];
        for (let i = 0; i < n; i++) {
            const pts = [[0, -2]];
            let d = [RIGHT, LEFT, UP, DOWN][(i + seed) % 4], px = 0, py = -2;
            for (let k = 0, m = 3 + Math.floor(hash2(i, seed, 41) * 2); k < m; k++) {
                let len = 8 + Math.floor(hash2(i, k + seed, 42) * 16);
                for (; len > 0; len--) { if (area.kind(tileOf(x + px + DX[d] * 4), tileOf(y + py + DY[d] * 4)).solid) break; px += DX[d]; py += DY[d]; }
                pts.push([px, py]);
                d = d === UP || d === DOWN ? (hash2(i, k, seed + 43) < 0.5 ? LEFT : RIGHT) : (hash2(i, k, seed + 43) < 0.5 ? UP : DOWN);
            }
            out.push({ pts, len: pts.reduce((m, q, j) => j ? m + Math.abs(q[0] - pts[j - 1][0]) + Math.abs(q[1] - pts[j - 1][1]) : 0, 0), late: i * 5, col: cols[i % cols.length] });
        }
        return out;
    },
    /* the stretch of a run from a to b pixels along it, at ox, oy on the screen */
    runPart(run, a, b, ox, oy) {
        const out = []; let s = 0;
        for (let j = 0; j + 1 < run.pts.length; j++) {
            const [x0, y0] = run.pts[j], [x1, y1] = run.pts[j + 1], L = Math.abs(x1 - x0) + Math.abs(y1 - y0);
            const u0 = clamp((a - s) / (L || 1), 0, 1), u1 = clamp((b - s) / (L || 1), 0, 1);
            if (u1 > u0) { const p0 = [ox + lerp(x0, x1, u0), oy + lerp(y0, y1, u0)], p1 = [ox + lerp(x0, x1, u1), oy + lerp(y0, y1, u1)]; if (!out.length) out.push(p0); out.push(p1); }
            s += L;
        }
        return out;
    },
};
/* threads running off down the cracks from a spot: their heads run out, and their tails follow them down (a thing on the
   floor; done once the last tail's gone) */
class CrackRuns extends Ent {
    constructor(area, x, y, n, seed, cols, pace = 0.45, tail = 80) {
        super('crackruns', { x, y, floor: true });
        this.runs = RemainsKit.runs(area, x, y, n, seed, cols); this.t = 0; this.pace = pace; this.tail = tail;
    }
    get sortY() { return -1000; }
    tailAt(r) { return clamp((this.t - r.late - this.tail) * this.pace, 0, r.len); }
    showing() { return this.runs.some(r => this.tailAt(r) < r.len); }
    /* (as a line's focus: round where they all run) */
    get x0() { return this.x + Math.min(...this.runs.flatMap(r => r.pts.map(q => q[0]))) - 2; }
    get y0() { return this.y + Math.min(...this.runs.flatMap(r => r.pts.map(q => q[1]))) - 2; }
    get x1() { return this.x + Math.max(...this.runs.flatMap(r => r.pts.map(q => q[0]))) + 2; }
    get y1() { return this.y + Math.max(...this.runs.flatMap(r => r.pts.map(q => q[1]))) + 2; }
    update() { this.t++; if (!this.showing()) this.area.remove(this); }
    draw(cx, cy) {
        for (const r of this.runs) {
            const head = clamp((this.t - r.late) * this.pace, 0, r.len), tail = this.tailAt(r);
            if (head > tail + 0.5) { const pts = RemainsKit.runPart(r, tail, head, this.x - cx, this.y - cy); if (pts.length > 1) Threads.path(pts, r.col); }
        }
    }
}
