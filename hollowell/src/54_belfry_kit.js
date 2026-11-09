/* Wind and bells, for Belfry Heights and the Belfry (Mum's House, brass threads).
   Gusts blow through a stretch of ground every so often: anything light or medium and loose in it is blown
   along a tile at a time (displaced: it will come home later, the long way), and Wren is pushed.
   A bell, struck by the stick, a throw or flying shards, rings: every marked thing out of place within its
   reach snaps home at once (fast, and shoving harder, as when the Housekeeper yanked). A ring also wakes
   sleepers: bats in the rafters, and sleeping things (tied off where they lie) that go home when woken.
   The Recall Bell is the same, in Wren's hand. */

const Bells = {
    REACH: 7,
    /* a ring at (x, y) pixels: everything out of place within reach goes home now */
    ring(area, x, y, reach = this.REACH, opts = {}) {
        Sfx.play('bell');
        Fx.ring(x, y - 6, '#f7d64a'); Fx.ring(x, y - 6, '#fff4c0');
        G.ringFx = { x, y, t: 0, r: reach * T, area };
        /* a ring fills the room it's rung in, and no further: walls stop it */
        const room = area.rooms && area.rooms.length > 1 ? area.roomAt(tileOf(x), tileOf(y)) : null;
        const here = (tx, ty) => !room || area.roomAt(tx, ty) === room;
        let n = 0;
        for (const e of area.ents) {
            if (!e.isGrid || !e.ret || e.removed) continue;
            if (Math.hypot(e.tx * T + 8 - x, e.ty * T + 8 - y) > reach * T + 4 || !here(e.tx, e.ty)) continue;
            if (e.sleeper && e.tiedOff) {
                e.tiedOff = false; e.sleeper = false;
                if (e.id && !e.resetSleep) Progress.setAreaFlag(area.id, 'woke:' + e.id);
                if (e.onWake) e.onWake();
            }
            if (e.ret.state === 'home' || e.carried || e.shattered) continue;
            if (Return.held(e)) continue;                  /* holding beats the Return, even a ring */
            if (Return.snap(e)) n++;
        }
        for (const m of area.walkers) if (m.wake && m.alive !== false && Math.hypot(m.x - x, m.y - y) < (reach + 3) * T && here(tileOf(m.x), tileOf(m.y))) m.wake();
        for (const e of area.ents) if (e.hear && e !== opts.from && (e.tx === undefined || here(e.tx, e.ty))) e.hear(x, y);
        Stats.count('rings'); if (n) Stats.count('snapped', n);
        return n;
    },
    drawFx(cx, cy) {
        const f = G.ringFx; if (!f || f.area !== G.map) return;
        f.t++;
        const r = f.r * Math.min(1, f.t / 18);
        Gfx.alpha(Math.max(0, 0.6 - f.t / 40));
        for (let i = 0; i < 40; i++) { const t = i / 40 * Math.PI * 2; Gfx.rect(f.x - cx + Math.cos(t) * r, f.y - cy - 6 + Math.sin(t) * r, 2, 2, '#fff4c0'); }
        Gfx.alpha(1);
        if (f.t > 30) G.ringFx = null;
    },
    /* sleepers show it: a slow z drifting up */
    drawSleep(a, cx, cy) {
        for (const e of a.ents) {
            if (!Return.asleep(e) || e.removed || e.hidden) continue;
            const ph = ((G.t + e.uid * 37) % 90) / 90;
            const x = e.px - cx + 10 + Math.round(ph * 4), y = e.py - cy - 2 - Math.round(ph * 10);
            Gfx.alpha(Math.min(1, (1 - ph) * 2)); Font.draw('z', x, y, '#e8e0ff'); Gfx.alpha(1);
        }
    },
    /* puzzle sleepers (resetSleep) lie down again where they were once Wren has left their room */
    lastRoom: null,
    keepSleeping(area) {
        const r = Cam.room;
        if (r !== this.lastRoom) { const left = this.lastRoom; this.lastRoom = r; if (left) for (const e of area.ents) if (e.resetSleep && e._sleep0 && area.roomAt(e._sleep0.at[0], e._sleep0.at[1]) === left) e._sleepAgain = true; }
        for (const e of area.ents) {
            if (!e._sleepAgain || e.mv || e.carried || e.heldBy) continue;
            if (typeof e.resetSleep === 'string' && Progress.flag(e.resetSleep)) { e._sleepAgain = false; continue; }
            if (area.roomAt(e._sleep0.at[0], e._sleep0.at[1]) === Cam.room) continue;
            e._sleepAgain = false;
            if (Return.asleep(e)) continue;
            const [sx, sy] = e._sleep0.at;
            if (area.at(sx, sy) && area.at(sx, sy) !== e) continue;
            area.unplace(e, e.tx, e.ty);
            e.tx = sx; e.ty = sy; e.x = sx * T; e.y = sy * T;
            area.place(e, sx, sy);
            e.sleeper = true; e.tiedOff = true;
            if (e.ret) { e.ret.trace = (e._sleep0.trace || [[e.ret.mx, e.ret.my], [sx, sy]]).map(q => q.slice()); e.ret.state = 'away'; e.ret.timer = e.ret.patience; }
        }
    },
};

/* a hanging bell: rings when struck (stick, throw, shards) */
class Bell extends Ent {
    constructor(tx, ty, props = {}) {
        super('bell', props);
        this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T;
        this.swing = 0; this.cool = 0; this.reach = props.reach || Bells.REACH;
    }
    get sortY() { return this.y + 40; }
    hurtBox() { return { x0: this.x + 2, x1: this.x + 14, y0: this.y - 10, y1: this.y + 12 }; }
    strike(by) { this.ring(); }
    struck(by) { this.ring(); }
    ring() {
        if (this.cool > 0) return;
        this.cool = 30; this.swing = 50;
        Bells.ring(this.area, this.x + 8, this.y + 8, this.reach, { from: this });
        if (this.sig) this.pulse = this.time || 120;
        if (this.onRing) this.onRing(this);
    }
    update() {
        if (this.swing > 0) this.swing--; if (this.cool > 0) this.cool--;
        if (this.pulse > 0) { this.pulse--; Signals.set(this.area, this.sig); }
    }
    draw(cx, cy) {
        const x = this.x - cx + 8, y = this.y - cy;
        const a = Math.sin(this.swing / 4) * (this.swing / 50) * 0.5;
        Gfx.rect(x - 1, y - 14, 2, 6, '#6b4128');
        const im = spr('bell_hang');
        Gfx.img(im, Math.round(x - 8 + Math.sin(a) * 4), y - 8);
        if (this.reachShow) { Gfx.alpha(0.12); Gfx.circle(x, y + 8, this.reach * T, '#f7d64a'); Gfx.alpha(1); }
    }
}
SPAWN.bell = (x, y, p) => new Bell(x, y, p);

/* a gust zone: blows every `period` frames for `len` frames, toward `dir` */
class Gust extends Ent {
    constructor(tx, ty, p = {}) {
        super('gust', p);
        this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T;
        this.w = p.w || 4; this.h = p.h || 4;
        this.d = dirByName(p.dir || 'right');
        this.period = p.period || 360; this.len = p.len || 150; this.phase = p.phase || 0;
        this.t = 0; this.floor = true; this.force = p.force || 0.7;     /* how hard it pushes Wren, pixels a frame (she walks at 1.3) */
    }
    get on() { return !this.off && ((this.t + this.phase) % this.period) < this.len; }
    get soon() { const k = (this.t + this.phase) % this.period; return k > this.period - 60; }
    inside(tx, ty) { return tx >= this.tx && ty >= this.ty && tx < this.tx + this.w && ty < this.ty + this.h; }
    update() {
        this.t++;
        if (this.when) this.off = !Signals.eval(this.area, this.when);
        if (!this.on) return;
        const a = this.area, d = this.d;
        /* a strong wind: nothing walks home through it (only a bell's snap gets through) */
        if (this.beats) for (const e of a.ents) if (e.isGrid && e.ret && e.ret.state === 'returning' && !e.ret.snap && e.weight <= WEIGHT.medium && this.inside(e.tx, e.ty)) Return.disturb(e);
        if (this.t % 10 === 0) {
            /* blow loose things one tile downwind, the downwind ones first so a row moves together */
            const things = a.ents.filter(e => e.isGrid && !e.fixed && !e.mv && e.weight <= WEIGHT.medium && !e.carried && !Return.held(e) && !e.noWind && this.inside(e.tx, e.ty))
                .sort((m, n) => (DX[d] * (n.tx - m.tx) + DY[d] * (n.ty - m.ty)));
            for (const e of things) {
                /* going home, it leans into the wind; a strong wind (beats) blows back anything but a bell's snap */
                if (e.ret && e.ret.state === 'returning') continue;   /* going home, it leans into the wind */
                const nx = e.tx + DX[d], ny = e.ty + DY[d];
                if (a.freeForThing(nx, ny, e)) { e.startMove(nx, ny, 10); Stats.count('blown'); }
            }
        }
        /* Wren leans into it */
        const p = G.player;
        if (p && p.area === a && p.state === 'normal' && !p.ride && this.inside(p.tx, p.ty) && !(p.grip)) {
            p.moveAxis(DX[d] * this.force, 0); p.moveAxis(0, DY[d] * this.force);
            p.traceStep();
        }
        for (const m of a.walkers) if (m.alive && m.D && m.D.light && this.inside(m.tx, m.ty)) { m.kx = DX[d] * 1.5; m.ky = DY[d] * 1.5; }
    }
    draw(cx, cy) {
        const x0 = this.tx * T - cx, y0 = this.ty * T - cy, w = this.w * T, h = this.h * T;
        const d = this.d, on = this.on;
        if (!on && !this.soon) {
            /* still air: a few stray motes */
            for (let i = 0; i < 3; i++) { const k = hash2(i, this.tx, 3); Gfx.rect(x0 + k * w, y0 + hash2(this.ty, i, 5) * h + Math.sin(G.t / 20 + i) * 2, 1, 1, '#ffffff'); }
            return;
        }
        Gfx.alpha(on ? 0.6 : 0.3);
        const n = on ? Math.max(6, this.w * this.h / 2) : 4;
        for (let i = 0; i < n; i++) {
            const along = ((G.t * (on ? 3 : 1)) + hash2(i, 7, this.tx) * 400) % (d === LEFT || d === RIGHT ? w : h);
            const across = hash2(i, this.ty, 11) * (d === LEFT || d === RIGHT ? h : w);
            const len = on ? 7 : 3;
            if (d === RIGHT) Gfx.rect(x0 + along, y0 + across, len, 1, '#ffffff');
            else if (d === LEFT) Gfx.rect(x0 + w - along - len, y0 + across, len, 1, '#ffffff');
            else if (d === DOWN) Gfx.rect(x0 + across, y0 + along, 1, len, '#ffffff');
            else Gfx.rect(x0 + across, y0 + h - along - len, 1, len, '#ffffff');
        }
        Gfx.alpha(1);
    }
}
SPAWN.gust = (x, y, p) => new Gust(x, y, p);

/* a weathervane: shows which way the next gust blows, and spins up as it comes */
class Vane extends GridThing {
    constructor(tx, ty, p = {}) { super('vane', tx, ty, Object.assign({ weight: WEIGHT.fixed, fixed: true, marked: false }, p)); this.ang = 0; }
    tick() {
        const g = this.area.ents.find(e => e.kind === 'gust' && (!this.gust || e.id === this.gust));
        this.g = g; if (!g) return;
        this.ang += g.on ? 0.3 : g.soon ? 0.12 : 0.01;
    }
    draw(cx, cy) {
        const x = this.tx * T - cx + 8, y = this.ty * T - cy;
        Gfx.rect(x - 1, y - 10, 2, 22, '#6a635e'); Gfx.rect(x - 4, y + 10, 8, 3, '#4a4a5a');
        const d = this.g ? this.g.d : RIGHT;
        const s = Math.sin(this.ang) * 2;
        const ax = DX[d] * 7, ay = DY[d] * 4;
        Gfx.line(x - ax, y - 10 - ay + s, x + ax, y - 10 + ay + s, '#e8b04a');
        Gfx.rect(Math.round(x + ax) - 1, Math.round(y - 10 + ay + s) - 1, 3, 3, '#f7d64a');
        Gfx.rect(Math.round(x - ax) - 2, Math.round(y - 10 - ay + s) - 2, 3, 4, '#c42b4a');
    }
}
SPAWN.vane = (x, y, p) => new Vane(x, y, p);

/* the Recall Bell */
TOOLS.bell = {
    use(p) {
        if (this.cool > 0) return;
        this.cool = 40; p.ringT = 12;
        Bells.ring(p.area, p.x, p.y - 4, Bells.REACH);
    },
    update(area) { if (this.cool > 0) this.cool--; const p = G.player; if (p && p.ringT > 0) p.ringT--; Bells.keepSleeping(area); },
    busy(p) { return p.ringT > 0; },
};

/* belfry bats: hang asleep until a bell rings near them; then flap about after Wren; then roost again */
AI.roost = (e, p) => {
    e.modeT++;
    if (e.mode === 'idle' || e.mode === 'sleep') { e.mode = 'sleep'; return; }
    if (e.mode === 'fly') {
        const sp = e.D.speed || 1.0;
        if (p && p.area === e.area && p.state === 'normal') {
            const dx = p.x - e.x + Math.sin(e.t / 9) * 18, dy = p.y - 10 - e.y + Math.cos(e.t / 7) * 10, d = Math.hypot(dx, dy) || 1;
            e.x += dx / d * sp; e.y += dy / d * sp; e.dir = dx < 0 ? LEFT : RIGHT;
        }
        if (e.modeT > 420) { e.mode = 'home'; e.modeT = 0; }
        return;
    }
    if (e.mode === 'home') { if (e.goHome(1.4)) e.mode = 'sleep'; }
};

function initBelfryKit() {
    ENEMY.bat = { hp: 1, ai: 'roost', flies: true, swims: true, r: 5, tall: 10, yarn: '#7d5bc4', speed: 1.0, light: true, drop: 0.4 };
    defSprite('bat_sleep', ['......kk......', '.....kmmk.....', '....kmmmmk....', '....kmwwmk....', '....kmmmmk....', '.....kmmk.....', '......kk......'], { m: '#7d5bc4', w: '#2a1f2d' });
    defSprite('bat_0', ['k............k', 'km..........mk', 'kmm..kkkk..mmk', '.kmmkmmmmkmmk.', '..kmmwmmwmmk..', '...kmmmmmmk...', '....kk..kk....'], { m: '#7d5bc4', w: '#f7d64a' });
    defSprite('bat_1', ['..............', '.....kkkk.....', 'kkkkkmmmmkkkkk', 'kmmmmwmmwmmmmk', '.kkmmmmmmmmkk.', '...kk....kk...', '..............'], { m: '#7d5bc4', w: '#f7d64a' });
    ENEMY_DRAW.bat = e => e.mode === 'sleep' ? spr('bat_sleep') : spr('bat_' + ((e.t >> 3) % 2));
    defSprite('boulder_b', ['....kkkkkkkk....', '..kkggggggggkk..', '.kgggwwggggggGk.', 'kggwwgggggggGGGk', 'kgggggggggggGGGk', 'kggggggggggGGGGk', 'kgggggggggGGGGGk', 'kGgggggggGGGGGGk',
        'kGGgggggGGGGGGGk', 'kGGGGGGGGGGGGGGk', '.kGGGGGGGGGGGGk.', '..kkkkkkkkkkkk..', '................', '................', '................', '................'].slice(0, 12).concat(['................', '................', '................', '................']),
        { g: '#a39aa8', G: '#7f7688', w: '#c4bccb' });
    defSprite('bell_hang', ['......kkkk......', '.....kyyyyk.....', '....kyywyyyk....', '....kyywyyyk....', '...kyyyyyyyyk...', '...kyyyyyyyyk...', '..kyyyyyyyyyyk..', '..kYYYYYYYYYYk..',
        '.kkkkkkkkkkkkkk.', '.......kk.......', '......kYYk......', '.......kk.......'], { y: '#e8b04a', Y: '#b88a2a', w: '#fff4c0' });
    ART.shrine_post = paintSprite(10, 16, x => { x.fillStyle = '#7a4e32'; x.fillRect(3, 0, 4, 16); x.fillStyle = '#9a6438'; x.fillRect(3, 0, 2, 16); x.fillStyle = '#a39aa8'; x.fillRect(0, 12, 10, 4); });
}
CONTENT_INIT.push(initBelfryKit);

/* bats wake at a ring */
{
    const proto = Enemy.prototype;
    proto.wake = function () { if (this.D && this.D.ai === 'roost' && this.mode === 'sleep') { this.mode = 'fly'; this.modeT = 0; Sfx.play('blip'); } };
}
