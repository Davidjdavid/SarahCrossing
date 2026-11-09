/* Water, for the Millrace and Millwater. Currents carry floating things away (the trace grows as they go,
   so they come back the long way, slower against the flow); rafts carry Wren; a waterwheel on a bank turns
   while something floats past it; and the Paddle: stand on anything floating and steer it. Paddling counts
   as holding, so a paddled thing neither drifts nor goes home. */

const Water = {
    DRIFT_WAIT: 14, HOME_WAIT: 100, DRIFT_PACE: 20,
    /* can Wren stand on this? rafts always; anything else floating once she has the Paddle */
    rideable(o) {
        if (!o || !o.floats || o.carried || o.shattered) return false;
        if (!o.area.kind(o.tx, o.ty).water) return false;
        return !!o.rideable || Inv.has('paddle');
    },
    /* a floating thing on a current drifts a tile at a time, unless something holds it */
    drift(e) {
        const a = e.area;
        const d = a.flow.get(key2(e.tx, e.ty));
        if (d === undefined || e.mv) { e.driftT = 0; return; }
        if (e.carried || e.heldBy || e.tiedOff || e.shattered || e.flying || e.paddled) { e.driftT = 0; return; }
        if (e.ret && e.ret.state === 'returning') return;         /* the Return outpulls the river */
        /* at its own mark it bobs a while before the river takes it (a ferry waits at its landing) */
        const wait = e.ret && e.ret.state === 'home' ? this.HOME_WAIT : this.DRIFT_WAIT;
        if ((e.driftT = (e.driftT || 0) + 1) < wait) return;
        e.driftT = 0;
        const nx = e.tx + DX[d], ny = e.ty + DY[d];
        if (!a.kind(nx, ny).water) return;                                  /* the bank */
        if (!a.freeForThing(nx, ny, e)) {
            /* something swimming in the way gets bumped */
            for (const m of a.walkers) if (m.bonk && m.alive !== false && m.onTile && m.onTile(nx, ny)) m.bonk(e, d);
            return;
        }
        e.driftMove = true;
        e.startMove(nx, ny, this.DRIFT_PACE);
        Stats.count('drifts');
    },
    /* a returning thing going against the flow goes at half speed */
    pace(e, d, pace) {
        if (!e.floats) return pace;
        const fl = e.area.flow.get(key2(e.tx, e.ty));
        return fl !== undefined && fl === OPP[d] ? pace * 2 : pace;
    },
    /* whoever stands on a float as it sets off goes with it */
    board(e) {
        /* moved by anything but the current (a push, the hook, a paddle): it settles a moment before drifting */
        if (!e.driftMove) e.driftT = -36;
        e.driftMove = false;
        const p = G.player;
        if (!p || p.area !== e.area || p.state !== 'normal' || p.ride === e) return;
        if (!this.rideable(e) || p.tx !== e.tx || p.ty !== e.ty) return;
        /* aboard: stand in the middle of it */
        p.ride = e; p.rideOx = 8; p.rideOy = 10;
    },
    /* Wren on a moving float: carried along. True while it's moving (Wren can't walk) */
    rider(p) {
        const r = p.ride;
        if (!r || r.removed || r.area !== p.area || r.carried) { p.ride = null; return false; }
        if (r.mv) {
            p.x = r.px + p.rideOx; p.y = r.py + p.rideOy;
            p.walking = false; p.anim = 0;
            p.traceStep();
            if (p.carry) { p.carry.cx = p.x; p.carry.cy = p.y - 14; }
            return true;
        }
        p.x = r.tx * T + p.rideOx; p.y = r.ty * T + p.rideOy;     /* where it stopped, exactly */
        p.ride = null; p.traceStep();
        return false;
    },
    /* foam streaks running along the currents */
    drawFlow(a, cx, cy) {
        if (!a.flow.size) return;
        const x0 = Math.floor(cx / T) - 1, y0 = Math.floor(cy / T) - 1;
        for (let ty = y0; ty <= y0 + Math.ceil(H / T) + 1; ty++) for (let tx = x0; tx <= x0 + Math.ceil(W / T) + 1; tx++) {
            const d = a.flow.get(key2(tx, ty)); if (d === undefined) continue;
            const sx = tx * T - cx, sy = ty * T - cy;
            /* flowing water is a shade darker than still water, with white streaks running along it */
            Gfx.alpha(0.14); Gfx.rect(sx, sy, T, T, '#123a7a'); Gfx.alpha(1);
            for (let n = 0; n < 3; n++) {
                const ph = Math.floor(G.t * 0.7 + hash2(tx, ty, n) * 16 + n * 6) % 16;
                const off = 2 + Math.floor(hash2(ty * 3 + n, tx, 5) * 12);
                Gfx.alpha(n === 2 ? 0.5 : 0.85);
                const len = n === 2 ? 3 : 5;
                if (d === RIGHT) Gfx.rect(sx + ph - 2, sy + off, len, 1, '#ffffff');
                else if (d === LEFT) Gfx.rect(sx + 16 - ph - 3, sy + off, len, 1, '#ffffff');
                else if (d === DOWN) Gfx.rect(sx + off, sy + ph - 2, 1, len, '#ffffff');
                else Gfx.rect(sx + off, sy + 16 - ph - 3, 1, len, '#ffffff');
                Gfx.alpha(1);
            }
        }
    },
};

/* a raft: rideable, light, floats; moored on still water or set to run a current like a ferry */
class Raft extends GridThing {
    constructor(tx, ty, props = {}) {
        super('raft', tx, ty, Object.assign({ weight: WEIGHT.light }, props));
        this.floats = true; this.rideable = true; this.walkOn = true; this.noPush = true;
    }
    sprite() { return spr(this.look || 'raft'); }
    get sortY() { return this.py - 4; }   /* under whoever's standing on it */
}
SPAWN.raft = (x, y, p) => new Raft(x, y, p);

/* a barrel: floats, liftable, rideable with the Paddle */
class Barrel extends Liftable {
    constructor(tx, ty, props = {}) { super('barrel', tx, ty, props); this.floats = true; }
    sprite() { return spr('barrel_g'); }
}
SPAWN.barrel = (x, y, p) => new Barrel(x, y, p);

/* a waterwheel on the bank: turns while something floats on the water tile in front of it.
   mode 'hold': on while it turns; 'pulse': on for a while after (time) */
class Wheel extends GridThing {
    constructor(tx, ty, props = {}) {
        super('wheel', tx, ty, Object.assign({ weight: WEIGHT.fixed, fixed: true, marked: false }, props));
        this.sig = props.sig || 'wheel'; this.mode = props.mode || 'pulse'; this.time = props.time || 300;
        this.face = props.face !== undefined ? dirByName(props.face) : DOWN;
        this.timer = 0; this.ang = 0; this.on = false;
    }
    get watch() { return this.at || [this.tx + DX[this.face], this.ty + DY[this.face]]; }
    tick() {
        const [wx, wy] = this.watch;
        const o = this.area.at(wx, wy);
        const p = G.player;
        const turning = (o && o.floats) || (p && p.area === this.area && p.ride && p.tx === wx && p.ty === wy);
        if (turning) { if (!this.turning) Sfx.play('click'); this.timer = this.time; this.ang += 0.12; }
        else if (this.timer > 0) { this.timer--; this.ang += 0.04 * this.timer / this.time; }
        this.turning = !!turning;
        this.on = this.mode === 'hold' ? this.turning : this.timer > 0;
        if (this.on) Signals.set(this.area, this.sig);
    }
    draw(cx, cy) {
        const x = this.tx * T - cx + 8, y = this.ty * T - cy + 6;
        Gfx.circle(x, y, 9, '#6b4128'); Gfx.circle(x, y, 7, '#9a6438'); Gfx.circle(x, y, 2, '#3a2418');
        for (let i = 0; i < 6; i++) {
            const t = this.ang + i * Math.PI / 3;
            Gfx.line(x, y, x + Math.cos(t) * 9, y + Math.sin(t) * 9, '#e6c08a');
            Gfx.rect(Math.round(x + Math.cos(t) * 9) - 1, Math.round(y + Math.sin(t) * 9) - 1, 3, 3, '#c9925a');
        }
        if (this.on && this.mode === 'pulse') {
            const n = Math.ceil(this.timer / 60);
            for (let i = 0; i < n && i < 8; i++) Gfx.rect(this.tx * T - cx + 3 + i * 2, this.ty * T - cy + 15, 1, 2, PAL.yellow);
        }
    }
}
SPAWN.wheel = (x, y, p) => new Wheel(x, y, p);

/* the Paddle: hold C on anything floating to steer it a tile at a time; C on the bank pokes a float away */
TOOLS.paddle = {
    float(p) { const o = p.area.at(p.tx, p.ty); return Water.rideable(o) ? o : null; },
    use(p) {
        if (this.float(p)) return;
        const f = p.front(), o = p.area.at(f.tx, f.ty);
        if (o && o.floats && !o.mv && p.area.kind(o.tx, o.ty).water) {
            const nx = o.tx + DX[p.dir], ny = o.ty + DY[p.dir];
            if (p.area.kind(nx, ny).water && p.area.freeForThing(nx, ny, o)) { o.startMove(nx, ny, 16); Sfx.play('splash'); return; }
        }
        UI.toast('Stand on something floating and hold C to paddle.');
    },
    hold(p) {
        const o = this.float(p);
        if (this.held && this.held !== o) this.unhold(p);
        if (!o) return;
        this.held = o; o.paddled = true;
        if (this.cool > 0) { this.cool--; return; }
        if (o.mv) return;
        const ax = Input.axis();
        if (!ax.x && !ax.y) return;
        const d = ax.x < 0 ? LEFT : ax.x > 0 ? RIGHT : ax.y < 0 ? UP : DOWN;
        p.dir = d;
        const nx = o.tx + DX[d], ny = o.ty + DY[d];
        if (!p.area.kind(nx, ny).water || !p.area.freeForThing(nx, ny, o)) return;
        o.startMove(nx, ny, 18);
        this.cool = 4;
        Sfx.play('splash', 0.4); Stats.count('paddles');
    },
    unhold(p) { if (this.held) { this.held.paddled = false; if (this.held.ret && !this.held.mv) Return.disturb(this.held); this.held = null; } },
};

/* reed snappers: wait under the water by their reeds; come close and one pops up and nips. A whack while
   it's up sends it under for good (until next time) */
AI.snap = (e, p) => {
    e.modeT++;
    const near = p && p.area === e.area && p.state === 'normal' && Math.abs(p.x - e.x) < 28 && Math.abs(p.y - e.y) < 24;
    if (e.mode !== 'up') {
        e.hidden = true;
        if (near && e.modeT > 50) { e.mode = 'up'; e.modeT = 0; e.hidden = false; Sfx.play('splash'); Fx.splash(e.x, e.y - 2); }
        return;
    }
    e.hidden = false;
    if (p) e.dir = p.x < e.x ? LEFT : RIGHT;
    if (e.modeT > 80) { e.mode = 'idle'; e.modeT = 0; e.hidden = true; }
};

function initWaterKit() {
    ENEMY.snapper = { hp: 1, ai: 'snap', swims: true, flies: true, r: 6, tall: 12, yarn: '#6ab07a', drop: 0.5 };
    defSprite('snapper', ['................', '................', '....kkkk........', '...kggggk.......', '..kgwkgggk......', '..kggggggGk.....', '..krrrrrrrkk....', '..kwkwkwkk......',
        '..krrrrrrrkk....', '..kggggggGGk....', '...kgggGGGk.....', '..kbbbbbbbbk....', '.kbBbBbBbBbBk...', 'kbbbbbbbbbbbbk..', '................', '................'],
        { g: '#6ab07a', G: '#3f7a52', r: '#c42b4a', w: '#ffffff', b: '#4fb0e0', B: '#a5dcf7' });
    defSprite('snap_ripple', ['................', '................', '................', '................', '................', '................', '................', '................',
        '................', '................', '................', '...BBB...BBB....', '..B...B.B...B...', '................', '................', '................'], { B: '#d8f2fc' });
    ENEMY_DRAW.snapper = e => e.hidden ? ((e.t >> 4) % 3 ? spr('snap_ripple') : null) : spr('snapper');
    defSprite('raft', ['................', '................', 'kkkkkkkkkkkkkkkk', 'kbbbkbbbkbbbkbbk', 'kbubkbubkbubkbuk', 'kbubkbubkbubkbuk', 'kbbbkbbbkbbbkbbk', 'kBBBkBBBkBBBkBBk',
        'kbbbkbbbkbbbkbbk', 'kbubkbubkbubkbuk', 'kbbbkbbbkbbbkbbk', 'kBBBkBBBkBBBkBBk', 'kkkkkkkkkkkkkkkk', '.wwwwwwwwwwwwww.', '................', '................'],
        { b: '#c9925a', B: '#9a6438', u: '#e6c08a', w: '#a5dcf7' });
    defSprite('barrel_g', ['....kkkkkkkk....', '...kbbbbbbbbk...', '..kuuuuuuuuuuk..', '..kbbbbbbbbbbk..', '..kXXXXXXXXXXk..', '..kbubbbbbbbbk..', '..kbubbbbbbbbk..', '..kbubbbbbbbbk..',
        '..kXXXXXXXXXXk..', '..kbubbbbbbbbk..', '..kbubbbbbbbbk..', '..kXXXXXXXXXXk..', '..kBBBBBBBBBBk..', '...kkkkkkkkkk...', '................', '................'],
        { b: '#b8743c', B: '#7a4420', u: '#e0a060', X: '#6a635e' });
}
CONTENT_INIT.push(initWaterKit);
