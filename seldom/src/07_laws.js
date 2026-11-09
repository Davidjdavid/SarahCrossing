/* the laws of Seldom. Each step: what's seen, what comes back, what's pushed, what wraps, what flickers.
   Only seen things are updated at all (Still) - that one rule does most of the work. */
const CROWD_BANDS = 9, CROWD_MAX = 4;
const SEAM_REACH = 9;   /* how near the seam (in pixels) a thing pressing toward it has to be to go through */

/* the box a thing's picture fills: what has to be in view for it to count as seen */
function visBox(e) {
    const K = KINDS[e.kind], ph = K.ph || 16;
    return { x: e.x - 1, y: e.y + e.h - ph - (e.z || 0), w: e.w + 2, h: ph + (e.z || 0) };
}
function originBox(e) { const K = KINDS[e.kind], ph = K.ph || 16; return { x: e.ox, y: e.oy + e.h - ph, w: e.w, h: ph }; }

const Laws = {
    frames: [],
    seenBox(b) { for (const f of this.frames) if (overlap(b, f)) return true; return false; },
    frameOf(e) { const cx = ecx(e), cy = ecy(e); for (let i = 0; i < this.frames.length; i++) if (inRect(cx, cy, this.frames[i])) return i; return -1; },
    /* everything in a map leaves the view at once (a door, the end of a scene) */
    leaveMap(map) {
        for (const e of map.ents) {
            if (e.wild && e.seen && !e.held && exists(e)) this.vanish(e);
            e.seen = false; e.originSeen = false;
        }
    },
    vanish(e) { e.gone = true; e.seen = false; },
    respawn(e) {
        const K = KINDS[e.kind];
        e.gone = false; e.x = e.ox; e.y = e.oy; e.dir = e.odir; e.z = 0; e.vz = 0; e.vx = 0; e.vy = 0; e.t = 0;
        e.st = JSON.parse(e.init0); e.flick = false;
        if (K.respawn) K.respawn(e);
        Fx.puff(ecx(e), e.y + e.h - 4, 'return');
        e.justBack = 0.6;
        Notebook.saw('return', e);
    },
    /* which things are seen; wild things leaving go, wild things whose place comes back return */
    see() {
        const map = World.map;
        this.frames = Cam.frames();
        for (const e of map.ents) {
            if (e.removed) continue;
            const was = e.seen, ex = exists(e);
            e.seen = ex && this.seenBox(visBox(e));
            if (e.seen && !was) { e.unseenFor = e.lastSeen != null ? G.t - e.lastSeen : 0; KINDS[e.kind].onSeen && KINDS[e.kind].onSeen(e); if (e.tiny) Notebook.saw('tiny', e); }
            if (e.seen) e.lastSeen = G.t;
            if (e.wild) {
                if (was && !e.seen && ex && !e.held) this.vanish(e);
                const os = this.seenBox(originBox(e));
                if (os && !e.originSeen && e.gone && !e.taken) this.respawn(e), e.seen = exists(e) && this.seenBox(visBox(e));
                e.originSeen = os;
            }
        }
    },
    /* Bound things can't leave the view: its edges push them, and squeezed against a wall they pop through */
    bound() {
        const map = World.map;
        for (const e of map.ents) {
            if (!e.bound || !e.seen || e.held || !exists(e) || e.unbound) continue;
            if (inZone(map, e, 'wrap') && !Cam.split) continue;
            let i = this.frameOf(e); if (i < 0) i = nearestFrame(e, this.frames);
            const r = this.frames[i], m = 1;
            let nx = clamp(e.x, r.x + m, r.x + r.w - e.w - m), ny = clamp(e.y, r.y + m + (KINDS[e.kind].ph || 12) - e.h, r.y + r.h - e.h - m);
            if (Cam.split && i === 0 && e.x > r.x + r.w - e.w - m) nx = e.x;   /* the seam lets them through */
            if (Cam.split && i === 1 && e.x < r.x + m) nx = e.x;
            if (nx === e.x && ny === e.y) continue;
            const dx = nx - e.x, dy = ny - e.y;
            const [hx, hy] = moveEnt(e, dx, dy);
            if (hx || hy) {
                /* squeezed: pop to the nearest open spot inside the view */
                const spot = freeSpotIn(map, e, r, nx, ny);
                if (spot) { Fx.puff(ecx(e), ecy(e), 'pop'); e.x = spot[0]; e.y = spot[1]; Sfx.play('pop'); Notebook.saw('squeeze', e); }
            }
            e.pushed = 0.3;
            if (Math.hypot(dx, dy) < 8) e.pushDist = (e.pushDist || 0) + Math.hypot(dx, dy);
            if (e.pushDist > 64) Notebook.saw('bound', e);
        }
    },
    /* the Turnabout Woods: the view's edges meet */
    wrap() {
        if (Cam.split) return;
        const map = World.map, r = this.frames[0];
        for (const e of map.ents) {
            if (!e.seen || e.fixed || e.held || !exists(e) || !inZone(map, e, 'wrap')) continue;
            const cx = ecx(e), cy = ecy(e);
            let dx = 0, dy = 0;
            if (cx < r.x) dx = r.w; else if (cx >= r.x + r.w) dx = -r.w;
            if (cy < r.y) dy = r.h; else if (cy >= r.y + r.h) dy = -r.h;
            if (!dx && !dy) continue;
            /* only what just now went over the edge (not what a jump of the view left far behind) */
            if (Math.max(r.x - cx, cx - r.x - r.w, r.y - cy, cy - r.y - r.h) > 20) continue;
            const nb = { x: e.x + dx, y: e.y + dy, w: e.w, h: e.h };
            if (!inZone(map, nb, 'wrap')) continue;   /* the edges only meet inside the woods */
            if (!boxBlocked(map, nb, e) && inRect(nb.x + nb.w / 2, nb.y + nb.h / 2, r) || e === World.dot && !boxBlocked(map, nb, e)) {
                e.x += dx; e.y += dy; e.wrapped = 0.4; if (e.carrying) { e.carrying.x += dx; e.carrying.y += dy; }
                Sfx.play('wrap'); Notebook.saw('wrap', e);
            } else if (e === World.dot) {
                /* the other side is blocked: Dot stays at the edge */
                e.x = clamp(e.x, r.x - e.w / 2 + 0.5, r.x + r.w - e.w / 2 - 0.5); e.y = clamp(e.y, r.y - e.h / 2 + 0.5, r.y + r.h - e.h / 2 - 0.5);
                Cam.bump[dx > 0 ? 'l' : dx < 0 ? 'r' : dy > 0 ? 't' : 'b'] = 1;
            }
        }
    },
    /* the Prism: where the two halves meet, two places are one */
    seam() {
        if (!Cam.split) return;
        const map = World.map, [L, R] = this.frames;
        for (const e of map.ents) {
            if (!e.seen || e.fixed || e.held || !exists(e)) continue;
            const cy = ecy(e);
            const east = e.vx > 0 || (e.moving && e.dir === 'right'), west = e.vx < 0 || (e.moving && e.dir === 'left');
            let to = -1, nx = 0, ny = 0;
            if (e.lastFrame === 0 && east && e.x + e.w > L.x + L.w - SEAM_REACH && cy >= L.y && cy < L.y + L.h) { to = 1; nx = R.x + 1; ny = R.y + (e.y - L.y); }
            else if (e.lastFrame === 1 && west && e.x < R.x + SEAM_REACH && cy >= R.y && cy < R.y + R.h) { to = 0; nx = L.x + L.w - e.w - 1; ny = L.y + (e.y - R.y); }
            if (to < 0) continue;
            let nb = { x: nx, y: ny, w: e.w, h: e.h };
            /* land where there's room: a little further in, or a little up or down */
            if (boxBlocked(map, nb, e)) for (const [ox, oy] of [[6, 0], [0, -6], [0, 6], [12, 0], [6, -8], [6, 8], [0, -12], [0, 12], [18, 0]]) {
                const t = { x: nx + (to === 1 ? ox : -ox), y: ny + oy, w: e.w, h: e.h };
                if (!boxBlocked(map, t, e)) { nb = t; break; }
            }
            if (boxBlocked(map, nb, e)) {
                /* nowhere to land: stay this side of the seam */
                if (to === 1) e.x = Math.min(e.x, L.x + L.w - e.w + SEAM_REACH - 1); else e.x = Math.max(e.x, R.x - SEAM_REACH + 1);
                continue;
            }
            const far = Math.abs(nb.x - e.x) + Math.abs(nb.y - e.y) > 40;
            if (e.carrying) { e.carrying.x += nb.x - e.x; e.carrying.y += nb.y - e.y; }
            e.x = nb.x; e.y = nb.y; e.lastFrame = to;
            if (e === World.dot) Cam.home = to;
            if (far) { Sfx.play('seam'); Notebook.saw('seam', e); KINDS[e.kind].onSeam && KINDS[e.kind].onSeam(e); }
        }
        for (const e of map.ents) if (e.seen) {
            /* stay in the half you were in while you're still inside it (the halves can overlap) */
            const lf = this.frames[e.lastFrame];
            if (lf && inRect(ecx(e), ecy(e), lf)) continue;
            const f = this.frameOf(e); if (f >= 0) e.lastFrame = f;
        }
    },
    /* the view can only hold so many figures in a line: the farthest from the middle flicker */
    crowd() {
        const map = World.map;
        for (const e of map.ents) e.flick = false;
        for (const r of this.frames) {
            const bh = r.h / CROWD_BANDS, mid = r.x + r.w / 2;
            const bands = [];
            for (const e of map.ents) {
                if (!e.figure || !e.seen || !exists(e)) continue;
                const fy = e.y + e.h;
                if (fy < r.y || fy >= r.y + r.h || ecx(e) < r.x || ecx(e) >= r.x + r.w) continue;
                const b = Math.floor((fy - r.y) / bh);
                (bands[b] || (bands[b] = [])).push(e);
            }
            for (const list of bands) {
                if (!list || list.length <= CROWD_MAX) continue;
                list.sort((a, b) => Math.abs(ecx(a) - mid) - Math.abs(ecx(b) - mid));
                for (let i = CROWD_MAX; i < list.length; i++) { list[i].flick = true; }
                Notebook.saw('crowd-see');
            }
        }
    },
};
function nearestFrame(e, frames) {
    let best = 0, bd = 1e9;
    frames.forEach((r, i) => { const d = Math.abs(clamp(ecx(e), r.x, r.x + r.w) - ecx(e)) + Math.abs(clamp(ecy(e), r.y, r.y + r.h) - ecy(e)); if (d < bd) { bd = d; best = i; } });
    return best;
}
function inZone(map, e, law) {
    const cx = ecx(e), cy = ecy(e);
    for (const z of map.zones) if (z.law === law && inRect(cx / TILE, cy / TILE, z)) return true;
    return false;
}
/* the nearest spot (tile steps outward from where it was pushed to) that's open and inside the view */
function freeSpotIn(map, e, r, x0, y0) {
    for (let rad = 1; rad < 10; rad++) {
        let best = null, bd = 1e9;
        for (let j = -rad; j <= rad; j++) for (let i = -rad; i <= rad; i++) {
            if (Math.max(Math.abs(i), Math.abs(j)) !== rad) continue;
            const x = x0 + i * 6, y = y0 + j * 6;
            const b = { x, y, w: e.w, h: e.h };
            if (b.x < r.x || b.y < r.y || b.x + b.w > r.x + r.w || b.y + b.h > r.y + r.h) continue;
            if (boxBlocked(map, b, e)) continue;
            const d = i * i + j * j; if (d < bd) { bd = d; best = [x, y]; }
        }
        if (best) return best;
    }
    return null;
}
