/* The Return: everything with a mark goes back the way it came.
   A marked thing remembers its mark (where it belongs) and its trace (the tiles it went through since it
   left, loops erased: stepping back onto a tile cuts the trace back to it). Left alone for its patience it
   returns along the trace, one tile at a time, shoving lighter things aside and waiting behind heavier
   ones (a heavy thing shoves the player). Falling or sinking sends it home at once; breaking sends its
   pieces home along the trace. Strays (no mark) stay where they are. */

const WEIGHT = { light: 1, medium: 2, heavy: 3, fixed: 9 };
const RET = { patience: { 1: 90, 2: 120, 3: 150, 9: 150 }, pace: 10, snapPace: 3 };

const Return = {
    /* give a thing a mark at its tile */
    mark(e, opts = {}) {
        e.ret = {
            mx: e.tx, my: e.ty, area: e.area ? e.area.id : null,
            trace: [[e.tx, e.ty]],
            patience: opts.patience || RET.patience[e.weight] || 120,
            timer: 0,
            state: 'home',
            pace: opts.pace || RET.pace,
            color: opts.color || (e.area && e.area.def.thread) || THREAD.town,
            snap: false,
            strain: 0,
        };
    },
    isStray(e) { return !e.ret; },
    isHome(e) { return e.ret && e.ret.state === 'home'; },
    away(e) { return e.ret && e.ret.state !== 'home'; },

    /* the thing moved onto a tile: grow or cut its trace */
    moved(e, x, y) {
        const r = e.ret; if (!r) return;
        const tr = r.trace;
        const last = tr[tr.length - 1];
        if (last && last[0] === x && last[1] === y) return;
        let cut = -1;
        for (let i = tr.length - 1; i >= 0; i--) if (tr[i][0] === x && tr[i][1] === y) { cut = i; break; }
        if (cut >= 0) tr.length = cut + 1;
        else tr.push([x, y]);
        if (tr.length === 1 && x === r.mx && y === r.my) {
            if (r.state !== 'home') this.arrive(e);
        } else if (r.state === 'home') {
            r.state = 'away';
            r.timer = r.patience;
        }
    },
    /* something touched it: it waits its full patience again */
    disturb(e) {
        const r = e.ret; if (!r || r.state === 'home') return;
        if (r.state === 'returning' && !r.snap) r.state = 'away';
        if (!r.snap) r.timer = r.patience;
    },
    arrive(e) {
        const r = e.ret;
        r.state = 'home'; r.trace = [[r.mx, r.my]]; r.snap = false; r.strain = 0;
        if (e.area === G.map && e.onHome) e.onHome();
        if (e.area === G.map && !e.quietHome) { Fx.sparkle(e.tx * T + 8, e.ty * T + 8, r.color); Sfx.play('home'); }
        Stats.count('homecomings');
    },
    /* ring a bell / yank: go home now, fast */
    snap(e) {
        const r = e.ret; if (!r || r.state === 'home') return false;
        r.state = 'returning'; r.snap = true; r.timer = 0;
        return true;
    },
    /* fell into a pit or sank: reappear at the mark */
    sendHome(e) {
        const r = e.ret; if (!r) return;
        if (e.isGrid) { e.area.unplace(e, e.tx, e.ty); if (e.mv) e.area.unplace(e, e.mv.fx, e.mv.fy); }
        e.tx = r.mx; e.ty = r.my; e.mv = null;
        e.x = e.tx * T; e.y = e.ty * T;
        e.pendingHome = true;   /* placed when the mark is free */
        r.trace = [[r.mx, r.my]]; r.state = 'home'; r.snap = false;
    },
    /* a sleeper tied off where it lies: nothing moves it but a ring */
    asleep(e) { return !!(e && e.sleeper && e.tiedOff); },
    sleepLine(e) { return (e && e.pushLine) || "It's fast asleep. It won't budge for anything but a bell."; },
    held(e) {
        return !!(e.heldBy || e.carried || e.tiedOff || e.flying || e.shattered || e.paddled || (e.isHeld && e.isHeld()));
    },
    /* is Wren on the tile (or coming down onto it, mid-hop)? */
    wrenOn(a, x, y) {
        const p = G.player;
        if (!p || p.area !== a || p.dead) return false;
        return p.onTile(x, y) || !!(p.state === 'hop' && p.hop && tileOf(p.hop.tx) === x && tileOf(p.hop.ty) === y);
    },

    /* one step for a grid thing */
    update(e) {
        const r = e.ret; if (!r || e.removed) return;
        if (e.pendingHome) {
            /* nothing pops home onto Wren, whatever it is (a float too: she isn't riding it): while she's on its place it
               waits over it, and comes down the moment she steps off */
            if (!this.wrenOn(e.area, e.tx, e.ty) && (e.area.freeForThing(e.tx, e.ty, e) || e.area.at(e.tx, e.ty) === e)) {
                e.pendingHome = false; e.area.place(e, e.tx, e.ty);
                Fx.poof(e.tx * T + 8, e.ty * T + 8); if (e.area === G.map) Sfx.play('pop');
                if (e.onHome) e.onHome();
            }
            return;
        }
        if (r.state === 'home') return;
        if (this.held(e)) { if (!r.snap) r.timer = r.patience; return; }
        if (e.mv) return;
        if (r.state === 'away') {
            if (--r.timer <= 0) { r.state = 'returning'; }
            return;
        }
        /* returning: step to the previous tile of the trace */
        const tr = r.trace;
        if (tr.length < 2) { this.arrive(e); return; }
        const [nx, ny] = tr[tr.length - 2];
        const d = dirOf(nx - e.tx, ny - e.ty);
        const pace = r.snap ? RET.snapPace : Water.pace(e, d, r.pace);
        if (Math.abs(nx - e.tx) + Math.abs(ny - e.ty) !== 1) {
            /* the trace jumps (a throw, a flight): fly straight to it */
            e.startMove(nx, ny, pace * 2, true);
            return;
        }
        if (e.area.freeForThing(nx, ny, e)) { e.startMove(nx, ny, pace, true); r.strain = 0; return; }
        /* something's in the way */
        const o = e.area.at(nx, ny);
        const force = e.weight + (r.snap ? 1 : 0);
        if (o && o.isGrid && !o.fixed && o.weight < force && o.canBeShoved && o.canBeShoved(d)) {
            o.shove(d, pace, e);
            e.startMove(nx, ny, pace, true);
            return;
        }
        /* creatures in the way get knocked first (a boss on the way home takes the hit, not Wren) */
        let pushedOne = false;
        for (const m of e.area.walkers) {
            if (m.onTile && m.onTile(nx, ny) && m.weightN !== undefined && m.weightN < force && m.shoved) { m.shoved(d, pace, e); pushedOne = true; }
        }
        if (pushedOne) return;
        const p = G.player;
        if (p && p.area === e.area && p.onTile(nx, ny) && force >= WEIGHT.heavy && p.canBeShoved(d)) {
            p.shoved(d, pace);
            e.startMove(nx, ny, pace, true);
            return;
        }
        r.strain++;
    },
};

/* ---------- things on the grid ---------- */
let _entSeq = 0;
class Ent {
    constructor(kind, props = {}) {
        this.kind = kind;
        this.uid = ++_entSeq;
        Object.assign(this, props);
    }
    update() {}
    draw() {}
    get sortY() { return this.y + 16; }
}

/* a thing that stands on one tile and moves a tile at a time (blocks, pots, crates, chests, townsfolk) */
class GridThing extends Ent {
    constructor(kind, tx, ty, props = {}) {
        super(kind, props);
        this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T;
        this.isGrid = true;
        this.weight = this.weight || WEIGHT.medium;
        this.mv = null;
        this.z = 0;
    }
    onAdd(area) {
        /* a sleeper woken once stays awake (at home) when the place is built again; puzzle sleepers (resetSleep) don't */
        if (this.sleeper && this.id && !this.resetSleep && Progress.areaFlag(area.id, 'woke:' + this.id)) { this.sleeper = false; this.tiedOff = false; this.startAt = null; }
        if (this.sleeper && this.startAt) this._sleep0 = { at: this.startAt.slice(), trace: this.trace ? this.trace.map(q => q.slice()) : null };
        area.place(this, this.tx, this.ty);
        if (this.marked !== false && !this.ret) Return.mark(this, { color: this.thread, patience: this.patience });
        /* things that start away from home (already displaced along a given trace) */
        if (this.startAt && this.ret) {
            area.unplace(this, this.tx, this.ty);
            this.tx = this.startAt[0]; this.ty = this.startAt[1]; this.x = this.tx * T; this.y = this.ty * T;
            area.place(this, this.tx, this.ty);
            this.ret.trace = (this.trace || [[this.ret.mx, this.ret.my], this.startAt]).map(p => p.slice());
            this.ret.state = 'away'; this.ret.timer = this.ret.patience;
        }
    }
    get px() { return this.mv ? lerp(this.mv.fx, this.mv.tx, this.mv.t / this.mv.dur) * T : this.tx * T; }
    get py() { return this.mv ? lerp(this.mv.fy, this.mv.ty, this.mv.t / this.mv.dur) * T : this.ty * T; }
    get sortY() { return this.py + 15; }
    canBeShoved(d) { return !this.mv && !this.fixed && !Return.asleep(this) && this.area.freeForThing(this.tx + DX[d], this.ty + DY[d], this); }
    /* pushed by the player (or shoved by a returning thing) */
    canPush(d) { return !this.mv && !this.fixed && !this.noPush && !Return.asleep(this) && this.area.freeForThing(this.tx + DX[d], this.ty + DY[d], this); }
    push(d, dur = 16) {
        if (!this.canPush(d)) return false;
        this.startMove(this.tx + DX[d], this.ty + DY[d], dur);
        Sfx.play('push');
        Fx.dust(this.tx * T + 8 - DX[d] * 8, this.ty * T + 14);
        return true;
    }
    shove(d, dur, by) { this.startMove(this.tx + DX[d], this.ty + DY[d], dur); }
    startMove(nx, ny, dur, returning = false) {
        const a = this.area;
        if (this.floats) Water.board(this);
        /* the source tile stays held until the move ends */
        a.place(this, nx, ny);
        /* during the move it holds both tiles (so plates feel it in passing) */
        this.mv = { fx: this.tx, fy: this.ty, tx: nx, ty: ny, t: 0, dur, returning };
        this.tx = nx; this.ty = ny;
        if (!returning && this.ret) Return.disturb(this);
    }
    stepMove() {
        const m = this.mv; if (!m) return;
        m.t++;
        if (m.t >= m.dur) {
            this.mv = null;
            this.area.unplace(this, m.fx, m.fy);
            this.area.place(this, this.tx, this.ty);
            this.x = this.tx * T; this.y = this.ty * T;
            if (this.ret) {
                if (m.returning) {
                    const tr = this.ret.trace;
                    if (tr.length >= 2) tr.pop();
                    if (tr.length === 1) Return.arrive(this);
                } else Return.moved(this, this.tx, this.ty);
            }
            this.landed(m.returning);
        }
    }
    /* arrived on a tile: pits, water */
    landed(returning) {
        const k = this.area.kind(this.tx, this.ty);
        /* a returning thing hangs on its thread over pits and water */
        if (returning || this.hookPulled || (this.ret && this.ret.state === 'returning')) { if (this.onLanded) this.onLanded(); return; }
        if (k.pit) this.fall();
        else if (k.deep && !this.floats) this.sink();
        if (this.onLanded) this.onLanded();
    }
    fall() {
        Fx.fallAt(this.tx * T, this.ty * T, this.sprite());
        Sfx.play('fall');
        if (this.ret) Return.sendHome(this);
        else this.onLost ? this.onLost('pit') : this.fillPit();
    }
    /* a stray in a pit fills it for good */
    fillPit() {
        this.area.unplace(this, this.tx, this.ty);
        this.area.remove(this);
        this.area.setCell(this.tx, this.ty, this.area.family === 'outdoor' ? ':' : ',');
        this.area.flow.delete(key2(this.tx, this.ty));
        Progress.setAreaFlag(this.area.id, `fill:${this.tx},${this.ty}`);
    }
    sink() {
        Fx.splash(this.tx * T + 8, this.ty * T + 8);
        Sfx.play('splash');
        if (this.ret) Return.sendHome(this);
        else this.floats ? this.area.remove(this) : this.fillPit();     /* a stray stone fills the water in */
    }
    update() {
        this.stepMove();
        if (this.ret) Return.update(this);
        if (this.floats) Water.drift(this);
        if (this.tick) this.tick();
    }
    sprite() { return null; }
    draw(cx, cy) {
        if (this.carried) return;      /* (Wren draws what she carries, over her head: not here as well) */
        const im = this.sprite();
        if (!im) return;
        /* waiting to pop back onto its place (something's standing on it): not back yet, so not drawn; its place glints,
           its mark showing over whoever's feet are on it, motes of its thread rising off it */
        if (this.pendingHome) {
            const x = this.tx * T - cx, y = this.ty * T - cy, col = this.ret ? this.ret.color : PAL.white, k = (G.t + this.uid * 7) % 30;
            Gfx.alpha(k < 20 ? 0.8 : 0.35); Marks.draw(x, y + 2, col, true);
            for (let i = 0; i < 2; i++) { const m = (G.t + i * 20 + this.uid * 5) % 40; Gfx.alpha(Math.max(0, 0.8 - m / 40)); Gfx.rect(x + 5 + i * 5, y + 4 - m / 2, 1, 2, col); }
            Gfx.alpha(1);
            return;
        }
        const sx = this.px - cx, sy = this.py - cy - (im.height - T) - this.z;
        let shake = 0;
        const r = this.ret;
        if (r && r.state === 'away' && !Return.held(this) && r.timer < 30) shake = (G.t >> 1) % 2 ? 1 : -1;
        if (r && r.strain > 0 && G.t % 8 < 4) shake = 1;
        Gfx.img(im, sx + shake + (this.ox || 0), sy + (this.oy || 0));
    }
}

/* draw every displaced thing's trace and its empty mark (under the things) */
const Threads = {
    /* every thread is a 1 px line of its colour over a dark 1 px under-stroke (under a shallow stretch, right of a steep
       one: the light is from the top left), so it reads on any floor: a light floor by the dark, a dark one by the
       colour (tests/contrast.test.mjs measures each House's against its floors) */
    UNDER: 'rgba(20,10,20,0.85)',
    /* a polyline: every under-stroke first, so no stretch's shadow falls across the line where it turns */
    path(pts, col, under = this.UNDER) {
        for (let i = 0; i + 1 < pts.length; i++) {
            const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], st = Math.abs(y1 - y0) > Math.abs(x1 - x0) ? 1 : 0;
            Gfx.line(x0 + st, y0 + 1 - st, x1 + st, y1 + 1 - st, under);
        }
        for (let i = 0; i + 1 < pts.length; i++) Gfx.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], col);
    },
    stroke(x0, y0, x1, y1, col, under) { this.path([[x0, y0], [x1, y1]], col, under); },
    /* a creature's own way home, fainter than a thing's thread: the same cord, every other stitch */
    dotted(pts, col) {
        let n = 0;
        const dot = (x, y) => { if (n++ % 2 === 0) { Gfx.rect(x, y + 1, 1, 1, this.UNDER); Gfx.rect(x, y, 1, 1, col); } };
        for (let i = 0; i + 1 < pts.length; i++) {
            let [x0, y0] = pts[i].map(Math.round); const [x1, y1] = pts[i + 1].map(Math.round);
            const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
            let e = dx + dy;
            for (let k = 0; k < 4000 && (x0 !== x1 || y0 !== y1); k++) {
                dot(x0, y0);
                const e2 = 2 * e;
                if (e2 >= dy) { e += dy; x0 += sx; }
                if (e2 <= dx) { e += dx; y0 += sy; }
            }
        }
    },
    /* how long a thing will wait: a ring of stitches round its mark, unpicking as its patience runs down (k: what's left) */
    ring(mx, my, k, col, held) {
        const n = Math.ceil(k * 16);
        Gfx.alpha(held ? 0.45 : 0.85);
        for (let i = 0; i < n; i++) { const t = -Math.PI / 2 + i / 16 * Math.PI * 2; Gfx.rect(Math.round(mx + Math.cos(t) * 7) - 1, Math.round(my + Math.sin(t) * 6) + 1, 2, 1, this.UNDER); }
        for (let i = 0; i < n; i++) { const t = -Math.PI / 2 + i / 16 * Math.PI * 2; Gfx.rect(Math.round(mx + Math.cos(t) * 7) - 1, Math.round(my + Math.sin(t) * 6), 2, 1, col); }
        Gfx.alpha(1);
    },
    draw(area, cx, cy) {
        const c = Gfx.ctx;
        for (const e of area.ents) {
            const r = e.ret;
            /* (one waiting to come down on its place: its mark shows, under whoever's standing on it) */
            if (r && e.pendingHome && !e.removed && (!r.area || r.area === area.id)) { Marks.draw(r.mx * T - cx, r.my * T - cy, r.color, true); continue; }
            if (!r || r.state === 'home' || e.hideThread || e.hiddenYank) continue;
            if (r.area && r.area !== area.id) continue;
            const pts = r.trace.map(([x, y]) => [x * T + 8 - cx, y * T + 9 - cy]);
            /* to where the thing is now (mid-move) */
            const ex = (e.carried ? e.cx : e.px + 8) - cx, ey = (e.carried ? e.cy : e.py + 9) - cy;
            /* (a smashed thing's pieces are already flying its thread: the thread ends where its trace does, not at the
               spot the whole thing was last seen) */
            if (pts.length && !e.shattered) pts[pts.length - 1] = [ex, ey];
            const col = r.color;
            const tight = r.state === 'returning' || (r.timer < 30 && !Return.held(e));
            this.path(pts, tight ? shade(col, 0.4) : col);
            Marks.draw(r.mx * T - cx, r.my * T - cy, col, true);
            /* how long it'll wait (full and steady while something holds it) */
            if (r.state === 'away' && r.patience > 0 && !e.quietHome) {
                const held = Return.held(e);
                this.ring(r.mx * T + 8 - cx, r.my * T + 8 - cy, held ? 1 : Math.max(0, r.timer / r.patience), col, held);
            }
        }
        /* creatures keep the law too: each walks home along its own trail to its nest, so its thread shows, faintly
           (lure one away and its way home is plain to see, plates and all); not the big ones, who keep their own */
        for (const m of area.walkers || []) {
            if (m.alive === false || m.hidden || !m.trace || m.trace.length < 2 || m.hp >= 3 || m.noThread) continue;
            const col = m.thread || (m.D && m.D.yarn) || THREAD.none, tr = m.trace;
            this.dotted(tr.map(([x, y]) => [x * T + 8 - cx, y * T + 9 - cy]).concat([[m.x - cx, m.y - cy - 2]]), col);
            Marks.draw(tr[0][0] * T - cx, tr[0][1] * T - cy, col, true);
        }
    },
};
/* the little stitched cross that is a thing's place */
const Marks = {
    draw(sx, sy, col, empty) {
        /* (its stitches are thread too: each over the same dark under-stroke) */
        const x0 = sx + 4, y0 = sy + 4, dark = Threads.UNDER;
        for (let i = 0; i < 8; i++) {
            if (i === 3 || i === 4) continue;
            Gfx.rect(x0 + i, y0 + i + 1, 1, 1, dark); Gfx.rect(x0 + 7 - i, y0 + i + 1, 1, 1, dark);
            Gfx.rect(x0 + i, y0 + i, 1, 1, col); Gfx.rect(x0 + 7 - i, y0 + i, 1, 1, col);
        }
        Gfx.rect(x0 + 3, y0 + 3, 2, 2, empty ? '#1a1018' : col);
    },
};
