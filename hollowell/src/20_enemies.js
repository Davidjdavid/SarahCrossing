/* Creatures. Each has a nest (its mark) and keeps a trace like everything else: knocked or lured away it
   goes back along it; beaten, it unravels into a ball of yarn that rolls home and is a creature again
   next time Wren comes by. */

const ENEMY = {};      /* kind -> { hp, speed, leash, sprite, ai, dmg, weight, ... } */

class Enemy extends Ent {
    constructor(tx, ty, props = {}) {
        super('enemy', props);
        const D = ENEMY[props.type] || {};
        this.type = props.type;
        this.D = D;
        this.x = tx * T + 8; this.y = ty * T + 10;
        this.hx = tx; this.hy = ty;           /* the nest */
        this.hp = props.hp || D.hp || 1;
        this.dir = DOWN; this.t = 0; this.anim = 0;
        this.kx = 0; this.ky = 0; this.flash = 0; this.stun = 0;
        this.isWalker = true; this.weightN = D.weight || WEIGHT.medium;
        this.trace = [[tx, ty]];
        this.mode = 'idle'; this.modeT = 0;
        this.alive = true;
        this.thread = props.thread;
        this.vx = 0; this.vy = 0;
    }
    get sortY() { return this.y + 2; }
    get tx() { return tileOf(this.x); }
    get ty() { return tileOf(this.y); }
    onTile(x, y) {
        if (!this.alive) return false;
        const r = this.D.r || 5;
        return x * T < this.x + r && (x + 1) * T > this.x - r && y * T < this.y + 4 && (y + 1) * T > this.y - 4;
    }
    feetOn(x, y) { return this.alive && this.tx === x && this.ty === y && !this.D.flies; }
    hurtBox() { if (!this.alive) return null; const r = this.D.r || 6; return { x0: this.x - r, x1: this.x + r, y0: this.y - (this.D.tall || 12), y1: this.y + 3 }; }
    solidAt(tx, ty) {
        const a = this.area, k = a.kind(tx, ty);
        if (k.solid || k.ledge || (k.deep && !this.D.swims) || k.fog) return true;
        if (k.pit && !this.D.flies) return true;
        if (a.at(tx, ty)) return true;
        for (const b of a.blockers) if (b.blocks(tx, ty, this)) return true;
        return false;
    }
    move(dx, dy) {
        const r = (this.D.r || 5) - 1;
        const free = (x, y) => !this.solidAt(tileOf(x - r), tileOf(y - 3)) && !this.solidAt(tileOf(x + r), tileOf(y - 3)) && !this.solidAt(tileOf(x - r), tileOf(y + 3)) && !this.solidAt(tileOf(x + r), tileOf(y + 3));
        let moved = false;
        if (dx && free(this.x + dx, this.y)) { this.x += dx; moved = true; }
        if (dy && free(this.x, this.y + dy)) { this.y += dy; moved = true; }
        return moved;
    }
    traceStep() {
        const tx = this.tx, ty = this.ty, tr = this.trace, last = tr[tr.length - 1];
        if (last[0] === tx && last[1] === ty) return;
        let cut = -1; for (let i = tr.length - 1; i >= 0; i--) if (tr[i][0] === tx && tr[i][1] === ty) { cut = i; break; }
        if (cut >= 0) tr.length = cut + 1; else tr.push([tx, ty]);
    }
    /* walk back along the trace toward the nest */
    goHome(sp) {
        const tr = this.trace;
        if (tr.length < 2) { this.mode = 'idle'; return true; }
        const [nx, ny] = tr[tr.length - 2];
        const gx = nx * T + 8, gy = ny * T + 10;
        const dx = gx - this.x, dy = gy - this.y, d = Math.hypot(dx, dy);
        if (d < sp + 0.5) { this.x = gx; this.y = gy; tr.pop(); return false; }
        this.dir = dirOf(dx, dy);
        if (!this.move(dx / d * sp, dy / d * sp)) { this.x += dx / d * sp; this.y += dy / d * sp; }
        return false;
    }
    update() {
        if (!this.alive) return this.updateYarn();
        this.t++;
        if (this.flash > 0) this.flash--;
        if (this.kx || this.ky) {
            this.move(this.kx, this.ky); this.kx *= 0.8; this.ky *= 0.8;
            if (Math.abs(this.kx) + Math.abs(this.ky) < 0.2) { this.kx = this.ky = 0; }
            this.traceStep();
            return;
        }
        if (this.stun > 0) { this.stun--; return; }
        const p = G.player;
        const ai = this.D.ai || 'wander';
        AI[ai](this, p);
        this.traceStep();
        /* touching Wren */
        if (p && p.area === this.area && p.state === 'normal' && !this.D.harmless && this.mode !== 'home' && this.mode !== 'sleep' && !this.hidden) {
            if (Math.abs(p.x - this.x) < (this.D.r || 5) + 4 && Math.abs(p.y - this.y) < 7) p.hurt(this.D.dmg || 1, this.x, this.y);
        }
        /* pits and water */
        const k = this.area.kind(this.tx, this.ty);
        if ((k.pit && !this.D.flies) || (k.deep && !this.D.swims)) this.die(true);
    }
    /* a returning thing heavier than it slams into it */
    shoved(d, pace, by) {
        if (!this.alive) return;
        this.kx = DX[d] * 4; this.ky = DY[d] * 4;
        this.struck(by, by.weight >= WEIGHT.heavy ? 2 : 1, d, true);
        G.shake = 6;
    }
    struck(by, dmg, dir, shard) {
        if (!this.alive || this.flash > 0 || this.hidden) return;
        if (this.D.armored && !shard && !(by && by.isGrid)) { Sfx.play('hitthing'); Fx.ring(this.x, this.y - 6); if (dir >= 0) { this.kx = DX[dir] * 1.5; this.ky = DY[dir] * 1.5; } return; }
        this.hp -= dmg; this.flash = 18;
        Sfx.play('enemyhit'); G.hitstop = 3;
        const p = G.player;
        let ddx = dir >= 0 ? DX[dir] : sign(this.x - p.x), ddy = dir >= 0 ? DY[dir] : sign(this.y - p.y);
        this.kx = ddx * 3.5; this.ky = ddy * 3.5;
        if (this.hp <= 0) this.die();
    }
    /* unravel: a yarn ball rolls home along the trace */
    die(quiet) {
        this.alive = false; this.yarnT = 0;
        if (!quiet) { Sfx.play('unravel'); Fx.yarn(this.x, this.y - 6, this.D.yarn || '#e8463c'); }
        Stats.count('defeated:' + this.type);
        if (!quiet && G.rng() < (this.D.drop || 0.35)) {
            const r = G.rng(), what = r < 0.45 ? 'heart' : r < 0.85 ? 'b1' : 'b5';
            this.area.add(new Pickup(this.x - 8, this.y - 12, { what, vz: 2.5, life: 480 }));
        }
        if (this.onDie) this.onDie();
    }
    updateYarn() {
        this.yarnT++;
        if (this.trace.length > 1) this.goHome(2.2);
        else if (this.yarnT > 60) this.yarnHome = true;
    }
    draw(cx, cy) {
        if (!this.alive) {
            /* the yarn ball */
            const x = this.x - cx, y = this.y - cy;
            if (!this.yarnHome || (G.t % 40 < 30)) {
                Gfx.circle(x, y - 3, 3, this.D.yarn || '#e8463c'); Gfx.rect(x - 2, y - 4, 3, 1, shade(this.D.yarn || '#e8463c', 0.4));
                Gfx.rect(x - 1, y - 2, 3, 1, shade(this.D.yarn || '#e8463c', -0.3));
            }
            return;
        }
        const im = ENEMY_DRAW[this.type] ? ENEMY_DRAW[this.type](this) : null;
        if (!im) return;
        Gfx.alpha(0.25); Gfx.rect(this.x - cx - 5, this.y - cy + 2, 10, 2, PAL.ink); Gfx.alpha(1);
        const img = this.flash > 0 && (this.flash >> 1) % 2 ? tinted(im, '#ffffff') : im;
        Gfx.img(img, this.x - cx - im.width / 2, this.y - cy - im.height + 4 - (this.z || 0), this.dir === LEFT && !this.D.noFlip);
    }
}
const ENEMY_DRAW = {};

/* behaviours */
const AI = {
    /* potter about near the nest; come after Wren within reach, but never past the end of the leash */
    wander(e, p) {
        const D = e.D, sp = D.speed || 0.5, leash = (D.leash || 5) * T;
        const nx = e.hx * T + 8, ny = e.hy * T + 10;
        const pd = p && p.area === e.area && p.state === 'normal' ? dist(p.x, p.y, e.x, e.y) : 999;
        const far = dist(e.x, e.y, nx, ny);
        if (e.mode === 'home') { if (e.goHome(sp * 1.4)) e.mode = 'idle'; return; }
        if (far > leash) { e.mode = 'home'; return; }
        if (D.chase && pd < (D.sight || 4) * T && dist(p.x, p.y, nx, ny) < leash) {
            e.mode = 'chase';
            const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
            e.dir = dirOf(dx, dy); e.move(dx / d * sp * (D.chaseMul || 1.3), dy / d * sp * (D.chaseMul || 1.3));
            e.anim++;
            return;
        }
        if (e.mode === 'chase') { e.mode = 'home'; return; }
        if (--e.modeT <= 0) { e.modeT = 40 + Math.floor(G.rng() * 60); e.wdir = Math.floor(G.rng() * 5); }
        if (e.wdir < 4) { e.dir = e.wdir; if (!e.move(DX[e.wdir] * sp, DY[e.wdir] * sp)) e.modeT = 0; e.anim++; }
    },
    /* hop toward Wren in little jumps */
    hop(e, p) {
        const D = e.D;
        e.z = Math.max(0, e.z || 0);
        if (e.hopT > 0) {
            e.hopT--; const k = 1 - e.hopT / 20; e.z = Math.sin(k * Math.PI) * 6;
            e.move(e.vx, e.vy);
            return;
        }
        if (--e.modeT > 0) return;
        e.modeT = 30 + Math.floor(G.rng() * 30);
        const nx = e.hx * T + 8, ny = e.hy * T + 10;
        let tx, ty;
        if (p && p.area === e.area && dist(p.x, p.y, e.x, e.y) < (D.sight || 5) * T && dist(p.x, p.y, nx, ny) < (D.leash || 6) * T) { tx = p.x; ty = p.y; }
        else if (dist(e.x, e.y, nx, ny) > 2 * T) { tx = nx; ty = ny; }
        else { tx = e.x + (G.rng() - 0.5) * 48; ty = e.y + (G.rng() - 0.5) * 48; }
        const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy) || 1;
        e.vx = dx / d * (D.speed || 1); e.vy = dy / d * (D.speed || 1); e.hopT = 20; e.dir = dirOf(dx, dy);
    },
    still() { },
};

function initEnemySprites() {
    /* Nibbler: a fuzzy moth larva */
    defSprite('nib_0', ['................', '................', '................', '................', '.....kk..kk.....', '......k..k......', '....kkkkkkkk....', '...kgggggggGk...',
        '..kgwekgggekGk..', '..kgggggggggGk..', '..kgggggggggGk..', '..kGgGgGgGgGGk..', '...kGGGGGGGGk...', '....kk.kk.kk....', '................', '................'],
        { g: '#b8e07a', G: '#7eb050', w: '#ffffff' });
    defSprite('nib_1', ['................', '................', '................', '................', '................', '.....kk..kk.....', '....kkkkkkkk....', '...kgggggggGk...',
        '..kgwekgggekGk..', '..kgggggggggGk..', '.kgggggggggggGk.', '.kGgGgGgGgGgGGk.', '..kGGGGGGGGGGk..', '...kk.kk.kk.k...', '................', '................'],
        { g: '#b8e07a', G: '#7eb050', w: '#ffffff' });
    ENEMY.nibbler = { hp: 1, speed: 0.4, leash: 4, ai: 'wander', chase: true, sight: 3, yarn: '#a8d870', r: 6, tall: 10 };
    ENEMY_DRAW.nibbler = e => spr('nib_' + (Math.floor(e.anim / 10) % 2));
    /* Dust bunny: hops */
    defSprite('dust_0', ['................', '................', '.....k....k.....', '....kgk..kgk....', '....kgk..kgk....', '....kgkkkkgk....', '...kgggggggGk...', '..kggwkgggwkGk..',
        '..kggkkgggkkGk..', '..kgggggiggggk..', '..kggggggggGGk..', '..kGggggggGGGk..', '...kGGGGGGGGk...', '....kk....kk....', '................', '................'],
        { g: '#e4dcd0', G: '#b0a698', w: '#ffffff', i: '#f59ac0' });
    ENEMY.dustbunny = { hp: 2, speed: 1.1, leash: 5, sight: 5, ai: 'hop', yarn: '#e4dcd0', r: 6, tall: 12 };
    ENEMY_DRAW.dustbunny = e => spr('dust_0');
}
SPAWN.enemy = (x, y, p) => new Enemy(x, y, p);
