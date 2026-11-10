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
    /* come down from a leap onto open floor: the nearest tile it can stand on */
    settle() {
        if (!this.solidAt(this.tx, this.ty)) return;
        for (let r = 1; r <= 4; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || this.solidAt(this.tx + dx, this.ty + dy)) continue;
            this.x = (this.tx + dx) * T + 8; this.y = (this.ty + dy) * T + 10; return;
        }
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
        /* touching Wren (not while it's leapt up in the air over her: fliers are at home up there) */
        if (p && p.area === this.area && p.state === 'normal' && !this.D.harmless && this.mode !== 'home' && this.mode !== 'sleep' && !this.hidden && !((this.z || 0) > 4 && !this.D.flies)) {
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
        if (this.D.armored && !shard && !(by && by.isGrid)) { Sfx.play('hitthing'); Fx.ring(this.x, this.y - 6); if (dir >= 0) { this.kx = DX[dir] * 1.5; this.ky = DY[dir] * 1.5; } if (this.onArmor) this.onArmor(dir); return; }
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
        const sh = this.shake ? ((this.t >> 1) % 2 ? 1 : -1) : 0;     /* (shivering: about to do something) */
        Gfx.img(img, this.x - cx - im.width / 2 + sh, this.y - cy - im.height + 4 - (this.z || 0), this.dir === LEFT && !this.D.noFlip);
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
            if (e.mode !== 'chase') Fx.text(e.x, e.y - (D.tall || 12) - 6, '!', '#f7d64a');     /* (it's seen her: the tell) */
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
        /* (crouched, about to spring: it shivers a moment first) */
        e.shake = e.modeT > 1 && e.modeT <= 10;
        if (--e.modeT > 0) return;
        e.shake = false;
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

/* ---------- the blows: every attack shows itself before it lands ----------
   A blow has a tell first (a pose, a flash, a sound and, for anything that lands somewhere, a mark on the floor where it
   will land): longer early in the game, shorter later (TELL, by House), and a little shorter again in a boss's later
   beats. It lands only through Wren's own hurt(), so stepping out of the marked place is always enough, and her blinking
   spell after a hit covers whatever comes straight after it. Nothing lands while anyone is talking. */
const TELL = [36, 40, 36, 32, 28, 26, 24, 22, 20];
function tellFor(house, beat = 1) { return Math.max(16, Math.round((TELL[house] || TELL[0]) * (beat >= 3 ? 0.8 : beat === 2 ? 0.9 : 1))); }
SFX.warn = (o, t) => { Audio.tone(o, t, 494, 0.05, 'p25', 0.07); Audio.tone(o, t + 0.06, 740, 0.08, 'p25', 0.07); };
/* a boss's blows go when it does: beaten, gone back to sleep (Wren left), or gone from the place */
const ownerGone = (o, area) => !o || o.removed || o.alive === false || o.area !== area || o.state === 'sleep';

/* a blow that lands on the floor: tiles that light up and then are struck (a lane, a sweep, a row), a shadow that grows
   where something will drop (r px round), or a ring of stitches round a spot (r px out; the blow fills it). It hurts
   whoever's feet are inside when it lands, and for `live` frames after. */
class Hazard extends Ent {
    constructor(owner, o) {
        super('hazard');
        Object.assign(this, { shape: 'tiles', tell: 30, live: 4, dmg: 1, col: '#e8463c', fx: 'dust', r: 12, t: 0, shake: 3 }, o);
        this.owner = owner;
        if (this.tiles) { this.x = this.tiles.reduce((s, q) => s + q[0], 0) / this.tiles.length * T + 8; this.y = this.tiles.reduce((s, q) => s + q[1], 0) / this.tiles.length * T + 8; }
    }
    static tiles(owner, tiles, o = {}) { return tiles.length ? owner.area.add(new Hazard(owner, Object.assign({ shape: 'tiles', tiles }, o))) : null; }
    static drop(owner, x, y, o = {}) { return owner.area.add(new Hazard(owner, Object.assign({ shape: 'drop', x, y }, o))); }
    static ring(owner, x, y, r, o = {}) { return owner.area.add(new Hazard(owner, Object.assign({ shape: 'ring', x, y, r }, o))); }
    /* (under everyone while it warns; whatever drops is drawn over them as it comes down) */
    get sortY() { return this.look && this.t > this.tell - 30 ? this.y + 200 : -900 + this.y; }
    get landed() { return this.t >= this.tell; }
    covers(x, y) {
        if (this.coverAt && this.landed) return this.coverAt(x, y, this);
        if (this.shape === 'tiles') return this.tiles.some(([tx, ty]) => tileOf(x) === tx && tileOf(y) === ty);
        const dx = x - this.x, dy = (y - this.y) / 0.7;
        return dx * dx + dy * dy < this.r * this.r;
    }
    update() {
        if (ownerGone(this.owner, this.area)) { this.area.remove(this); return; }
        if (Script.blocking()) return;
        this.t++;
        if (this.t === 1 && !this.quiet) Sfx.play('warn');
        if (this.t === this.tell) this.land();
        if (this.landed && this.dmg > 0 && this.t < this.tell + this.live) {
            const p = G.player;
            if (p && p.area === this.area && p.state === 'normal' && this.covers(p.x, p.y)) {
                const [fx, fy] = this.from || [this.x, this.y + 4];
                p.hurt(this.dmg, fx, fy);
            }
        }
        if (this.t >= this.tell + this.live + 10) this.area.remove(this);
    }
    land() {
        /* (a warning only, for a blow the thing itself delivers: a charge down its lane) */
        if (this.dmg <= 0) { if (this.onLand) this.onLand(this); return; }
        G.shake = Math.max(G.shake, this.shake);
        Sfx.play(this.sound || (this.fx === 'splash' ? 'splash' : this.fx === 'yarn' || this.fx === 'silk' ? 'twang' : 'land'));
        const pts = this.shape === 'tiles' ? this.tiles.map(([x, y]) => [x * T + 8, y * T + 9]) : [[this.x, this.y]];
        for (const [x, y] of pts) {
            if (this.fx === 'splash') Fx.splash(x, y);
            else if (this.fx === 'sparks' || this.fx === 'clay') Fx.burst(x, y - 3, this.fx === 'clay' ? '#c4623a' : '#f7d64a');
            else if (this.fx === 'yarn' || this.fx === 'silk') Fx.yarn(x, y - 3, this.fxCol || '#e4ecf5');
            else Fx.dust(x, y);
        }
        if (this.shape !== 'tiles') Fx.ring(this.x, this.y, this.shape === 'ring' ? shade(this.col, 0.4) : '#ffffff');
        if (this.onLand) this.onLand(this);
    }
    draw(cx, cy) {
        const t = this.t, k = Math.min(1, t / this.tell), col = this.col;
        /* faster and brighter as it comes */
        const blink = !this.landed && ((t / Math.max(3, Math.round(10 - 7 * k))) | 0) % 2 === 0;
        if (this.shape === 'tiles') {
            if (this.landed && this.lookLanded) { this.lookLanded(this.x - cx, this.y - cy, this); return; }
            for (const [tx, ty] of this.tiles) {
                const x = tx * T - cx, y = ty * T - cy;
                Gfx.alpha(this.landed ? 0.45 : 0.14 + 0.3 * k + (blink ? 0.08 : 0)); Gfx.rect(x + 1, y + 1, 14, 14, this.landed ? '#ffffff' : col); Gfx.alpha(1);
                if (!this.landed) Tells.stitchTile(x, y, blink ? shade(col, 0.45) : col);
            }
            return;
        }
        const x = this.x - cx, y = this.y - cy;
        /* what's left lying once it's landed (a puddle that still burns, while it lasts) */
        if (this.landed && this.lookLanded) { this.lookLanded(x, y, this); return; }
        if (this.shape === 'drop') {
            if (!this.landed) {
                const r = Math.round(3 + (this.r - 3) * k);
                Gfx.alpha(0.18 + 0.4 * k); Tells.ellipse(x, y, r, PAL.ink); Gfx.alpha(1);
                if (blink) Tells.stitchRing(x, y, r + 2, col, 14);
            }
        } else if (!this.landed) {
            Gfx.alpha(0.1 + 0.18 * k); Tells.ellipse(x, y, this.r, col); Gfx.alpha(1);
            Tells.stitchRing(x, y, this.r, blink ? shade(col, 0.45) : col, Math.max(16, Math.round(this.r / 2.5)));
        }
        /* what's coming down, from up out of sight */
        if (this.look && !this.landed && t > this.tell - 30) this.look(x, y - (this.tell - t) * 5, this);
    }
}
/* the tells' own marks: stitches, as everything in this valley is sewn */
const Tells = {
    stitchTile(x, y, col) { for (let i = 1; i < 15; i += 4) { Gfx.rect(x + i, y + 1, 2, 1, col); Gfx.rect(x + i, y + 14, 2, 1, col); Gfx.rect(x + 1, y + i, 1, 2, col); Gfx.rect(x + 14, y + i, 1, 2, col); } },
    stitchRing(x, y, r, col, n = 16) { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; Gfx.rect(Math.round(x + Math.cos(a) * r) - 1, Math.round(y + Math.sin(a) * r * 0.7), 2, 1, col); } },
    ellipse(x, y, r, col) { for (let dy = -Math.round(r * 0.7); dy <= Math.round(r * 0.7); dy++) { const w = Math.round(Math.sqrt(Math.max(0, 1 - (dy / (r * 0.7 || 1)) ** 2)) * r); Gfx.rect(x - w, y + dy, w * 2 + 1, 1, col); } },
    /* the "!" over a thing about to strike */
    bang(x, y) { const im = spr('bubble_bang'); if (im) Gfx.img(im, Math.round(x) - 4, Math.round(y)); },
    /* a glow gathering at a spot (a mouth, a hand) before something's spat or thrown */
    glow(x, y, k, col) { const r = Math.round(1 + 3 * k); Gfx.alpha(0.35 + 0.4 * k); Gfx.circle(x, y, r + 1, col); Gfx.alpha(1); Gfx.circle(x, y, Math.max(1, r - 1), '#ffffff'); },
};

/* something a boss flings: it flies out in a line and lands; and being marked, like everything, it lies there with its
   thread running back the way it came. When its patience runs out it shivers and its thread pulls tight (the Return's own
   tell), and home it flies along it, striking whatever's on the way: Wren, any creature, and its own thrower too if
   that's wandered onto its way home (by the thrower's own rules: most just clang), unless it's part of it (`kin`: a
   piece shed rejoins the whole). (Dropped into a pit or deep water it's home at once, as anything is.) path: tiles,
   its place first */
class Flung extends Ent {
    constructor(owner, path, o = {}) {
        super('flung');
        Object.assign(this, { pace: 3, back: 3, wait: 80, tell: 24, dmg: 1, col: '#e8b04a', hurtOut: true }, o);
        this.owner = owner; this.path = path.map(q => q.slice()); this.state = 'out'; this.t = 0; this.i = 0;
        /* (shed where it lies: it starts out lying there, on its thread) */
        if (this.lying) { this.state = 'lie'; this.i = this.path.length - 1; }
        this.x = this.path[this.i][0] * T + 8; this.y = this.path[this.i][1] * T + 8;
    }
    /* the tiles from a spot toward another, in a straight line, on past it as far as `max` or the first wall (a throw) */
    static line(area, from, to, max = 8) {
        const out = [from.slice()];
        const dx = to[0] - from[0], dy = to[1] - from[1], n = Math.max(Math.abs(dx), Math.abs(dy));
        if (!n) return out;
        for (let i = 1; i <= Math.max(n, max) && out.length <= max; i++) {
            const x = Math.round(from[0] + dx * i / n), y = Math.round(from[1] + dy * i / n), last = out[out.length - 1];
            if (x === last[0] && y === last[1]) continue;
            const k = area.kind(x, y);
            if (!area.inside(x, y) || (k.solid && !k.low && !k.pit && !k.deep) || area.at(x, y)) break;
            out.push([x, y]);
        }
        return out;
    }
    /* every tile on the straight line from one tile to another, ends included (a thing flown high over all of it) */
    static between(from, to) {
        const out = [], dx = to[0] - from[0], dy = to[1] - from[1], n = Math.max(Math.abs(dx), Math.abs(dy), 1);
        for (let i = 0; i <= n; i++) { const x = Math.round(from[0] + dx * i / n), y = Math.round(from[1] + dy * i / n), l = out[out.length - 1]; if (!l || l[0] !== x || l[1] !== y) out.push([x, y]); }
        return out;
    }
    get sortY() { return this.state === 'lie' ? this.y + 4 : this.y + 60; }
    get tight() { return this.state === 'home' || (this.state === 'lie' && this.t > this.wait - this.tell); }
    update() {
        if (ownerGone(this.owner, this.area)) { this.area.remove(this); return; }
        if (Script.blocking()) return;
        this.t++;
        const pace = this.state === 'home' ? this.back : this.pace;
        if (this.state === 'out') {
            if (this.t % pace === 0 && this.i < this.path.length - 1) {
                this.i++;
                if (this.strike(this.path[this.i], this.hurtOut)) this.path.length = this.i + 1;   /* (it stops where it struck) */
            }
            if (this.i >= this.path.length - 1) {
                this.state = 'lie'; this.t = 0;
                const [tx, ty] = this.path[this.i], k = this.area.kind(tx, ty);
                Sfx.play('land'); Fx.dust(tx * T + 8, ty * T + 10);
                if (k.pit || k.deep) { this.state = 'home'; this.i = 0; this.home(true); return; }
            }
        } else if (this.state === 'lie') {
            if (this.t === this.wait - this.tell) Sfx.play('twang');
            if (this.t >= this.wait) { this.state = 'home'; this.t = 0; }
        } else if (this.state === 'home') {
            if (this.t % pace === 0) { this.i--; if (this.i > 0) this.strike(this.path[this.i], true); }
            if (this.i <= 0) this.home();
        }
        /* where it is now, between the tile it left and the next */
        const j = this.state === 'out' ? Math.min(this.path.length - 1, this.i + 1) : Math.max(0, this.i - 1);
        const u = this.state === 'lie' ? 0 : Math.min(1, (this.t % pace) / pace);
        const [ax, ay] = this.path[this.i], [bx, by] = this.path[j];
        this.x = lerp(ax, bx, u) * T + 8; this.y = lerp(ay, by, u) * T + 8;
    }
    home(snap) {
        const [hx, hy] = this.path[0];
        if (snap) Fx.poof(hx * T + 8, hy * T + 6); else Sfx.play('hitthing', 0.4);
        this.area.remove(this);
        if (this.onHome) this.onHome(this);
    }
    /* what's standing on a tile it flies into: Wren, or a creature (not its own) */
    strike([tx, ty], hurts) {
        const p = G.player, a = this.area;
        let hit = false;
        /* (knocked on the way it was going: from the tile it came from) */
        const [fx, fy] = this.path[this.state === 'home' ? Math.min(this.path.length - 1, this.i + 1) : Math.max(0, this.i - 1)];
        if (hurts && p && p.area === a && p.state === 'normal' && p.feetOn(tx, ty)) { p.hurt(this.dmg, fx * T + 8, fy * T + 10); hit = true; }
        for (const e of a.ents.slice()) {
            if (e === this || e.removed || e.kind !== 'enemy' || !e.hurtBox) continue;
            /* (its thrower: only on its way home, and clear of where it was thrown from) */
            if (e === this.owner && (this.kin || this.state !== 'home' || this.i < 2)) continue;
            const h = e.hurtBox(), cx = tx * T + 8, cy = ty * T + 8;
            if (h && cx + 6 > h.x0 && cx - 6 < h.x1 && cy + 6 > h.y0 && cy - 6 < h.y1) e.struck(this, 1, -1, true);
        }
        return hit;
    }
    draw(cx, cy) {
        /* its thread, back along the way it came to its place; bright and straight once it's about to go */
        const pts = this.path.slice(0, this.i + 1).map(([x, y]) => [x * T + 8 - cx, y * T + 9 - cy]);
        pts.push([this.x - cx, this.y + 1 - cy]);
        const col = this.tight ? shade(this.col, 0.45) : this.col;
        for (let i = 0; i + 1 < pts.length; i++) {
            Gfx.line(pts[i][0], pts[i][1] + 1, pts[i + 1][0], pts[i + 1][1] + 1, 'rgba(20,10,20,0.35)');
            Gfx.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], col);
        }
        const sh = this.state === 'lie' && this.tight ? ((this.t >> 1) % 2 ? 1 : -1) : 0;
        const x = Math.round(this.x - cx) + sh, y = Math.round(this.y - cy) - (this.state === 'lie' ? 0 : 5);
        if (this.state !== 'lie') { Gfx.alpha(0.25); Gfx.rect(x - 3, Math.round(this.y - cy) + 4, 6, 2, PAL.ink); Gfx.alpha(1); }
        if (this.look) this.look(x, y, this);
        else { Gfx.circle(x, y, 3, PAL.ink); Gfx.circle(x, y, 2, this.col); Gfx.rect(x - 1, y - 1, 1, 1, '#ffffff'); }
    }
}
/* knocks on a downed boss: from the fourth House on it takes more than one to topple it (KNOCKS, by House), and between
   knocks it thrashes about, the reach of it drawn round it first (step back out, then in again). Knocks count for the
   whole beat, so a window cut short loses nothing. True when this knock is the one that topples it. */
const KNOCKS = [1, 1, 1, 1, 2, 2, 2, 3, 3];
function knockCounts(boss, house, x, y, r = 30, dmg = 2) {
    const need = KNOCKS[house] || 1;
    boss.knocks = (boss.knocks || 0) + 1;
    if (boss.knocks >= need) { boss.knocks = 0; return true; }
    boss.flash = 16; G.hitstop = 5; G.shake = 4; Sfx.play('enemyhit'); Fx.spark(x, y - 10);
    Hazard.ring(boss, x, y, r, { tell: Math.max(18, tellFor(house) - 2), dmg, shake: 4 });
    Fx.text(x, y - 34, need - boss.knocks === 1 ? 'one more!' : 'again!', '#f7d64a');
    Stats.count('boss:knock');
    return false;
}
/* a boss knocked off its feet (stunned, struck): whatever it was about to do doesn't come */
function calmBlows(owner) { const a = owner.area; if (a) for (const e of a.ents.slice()) if (e.kind === 'hazard' && e.owner === owner && !e.landed) a.remove(e); }
/* a heart shaken loose in a long fight (a boss knocked into its next beat drops one), on floor Wren can reach */
function bossHeart(area, x, y) {
    let tx = tileOf(x), ty = tileOf(y);
    const ok = (a, b) => { const k = area.kind(a, b); return area.inside(a, b) && !k.solid && !k.pit && !k.deep && !k.ledge && !area.at(a, b); };
    for (let r = 0; r <= 4 && !ok(tx, ty); r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r && ok(tileOf(x) + dx, tileOf(y) + dy)) { tx = tileOf(x) + dx; ty = tileOf(y) + dy; dx = dy = r + 1; }
    return area.add(new Pickup(tx * T, ty * T, { what: 'heart', vz: 2.5, life: 900 }));
}
