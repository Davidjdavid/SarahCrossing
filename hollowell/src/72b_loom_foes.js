/* The Loom's two guardians. The Shuttle: a great wooden shuttle that flies to and fro along its lane, through anything
   soft; put an offcut (a stray block) in its way and it jams on it, and while it's jammed it can be knocked; it shakes
   the offcut out of the lane and starts again. The Weaver: hung in its web over its own loom by four anchor threads,
   spitting silk that binds you (the Shears snip you free); cut all four anchors and down it comes into the loom, where
   it can be knocked; it climbs back and spins new anchors. Three times. */

/* ---------------- the Shuttle ---------------- */
class Shuttle extends Ent {
    constructor(tx, ty, p = {}) {
        super('shuttle', p);
        this.x = tx * T + 8; this.y = ty * T + 8; this.lane = ty; this.hx = tx;
        this.hp = 3; this.state = 'sleep'; this.st = 0; this.t = 0; this.dir = 1; this.flash = 0; this.alive = true;
    }
    get sortY() { return this.y + 8; }
    get arena() { return this.area.roomAt(this.hx, this.lane); }
    shutters(shut) { for (const s of this.area.ents) if (s.kind === 'door' && s.group === 'shuttle') s.shut = shut; }
    hurtBox() { return this.alive && this.state === 'stuck' ? { x0: this.x - 14, x1: this.x + 14, y0: this.y - 10, y1: this.y + 6 } : (this.alive && this.state !== 'sleep' ? { x0: this.x - 14, x1: this.x + 14, y0: this.y - 10, y1: this.y + 6 } : null); }
    update() {
        if (!this.alive) return;
        this.t++; if (this.flash > 0) this.flash--;
        const p = G.player, a = this.area, r = this.arena;
        if (this.state === 'sleep') {
            if (p.area === a && Cam.room === r && !Cam.busy && p.state === 'normal') { this.state = 'wait'; this.st = 0; this.shutters(true); Music.play('boss'); Script.run(LoomFoes.shuttleIntro(this)); }
            return;
        }
        if (Script.blocking()) return;
        this.st++;
        const sp = 2.6 + (3 - this.hp) * 0.5;
        if (this.state === 'wait') { if (this.st > 50) { this.state = 'fly'; this.st = 0; } return; }
        if (this.state === 'fly') {
            const nx = this.x + this.dir * sp, tx = tileOf(nx + this.dir * 8), o = a.at(tx, this.lane);
            /* an offcut in the lane: it jams */
            if (o && o.isGrid && !o.fixed) { this.state = 'stuck'; this.st = 0; this.jam = o; G.shake = 6; Sfx.play('hitthing'); Fx.dust(this.x + this.dir * 10, this.y); if (!Progress.flag('shuttle_jam')) { Progress.set('shuttle_jam'); G.pendingToast = 'The Shuttle jams on the offcut and sticks there, quivering.'; } return; }
            const end = this.dir > 0 ? (r.x + r.w - 2) * T + 8 : (r.x + 1) * T + 8;
            if ((this.dir > 0 && nx >= end) || (this.dir < 0 && nx <= end)) { this.x = end; this.dir = -this.dir; this.state = 'wait'; this.st = 0; return; }
            this.x = nx;
            if (p.state === 'normal' && Math.abs(p.x - this.x) < 14 && Math.abs(p.y - 4 - this.y) < 9) p.hurt(1, this.x, this.y);
        } else if (this.state === 'stuck') {
            if (this.st > 240) this.unjam();
        }
    }
    /* it shakes the offcut out of its lane and goes back to its end */
    unjam() {
        const o = this.jam, a = this.area;
        if (o && !o.removed && o.tx !== undefined) {
            for (const dy of [1, -1]) if (a.freeForThing(o.tx, o.ty + dy, o) && !a.kind(o.tx, o.ty + dy).pit) { o.startMove(o.tx, o.ty + dy, 10); break; }
        }
        this.jam = null; this.dir = -this.dir; this.state = 'fly'; this.st = 0;
    }
    struck(by, dmg, dir) {
        if (!this.alive || this.flash > 0) return;
        if (this.state !== 'stuck') { Sfx.play('hitthing'); Fx.ring(this.x, this.y - 4); return; }
        this.hp--; this.flash = 30; G.hitstop = 6; G.shake = 6; Sfx.play('enemyhit');
        if (this.hp <= 0) return this.defeat();
        this.unjam();
    }
    defeat() {
        this.alive = false; Sfx.play('unravel'); Fx.yarn(this.x, this.y, THREAD.loom);
        Progress.set('loom_shuttle'); this.shutters(false); Music.play('loom');
        Script.run(LoomFoes.shuttleDown(this));
    }
    draw(cx, cy) {
        if (!this.alive) return;
        const r = this.arena, x = this.x - cx, y = this.y - cy;
        /* its lane's thread, glowing while it waits to go */
        Gfx.line((r.x + 1) * T - cx, y, (r.x + r.w - 1) * T - cx, y, this.state === 'wait' && (this.t >> 2) % 2 ? '#ffffff' : '#aab7c8');
        const im = spr('shuttle');
        if (im) Gfx.img(this.flash > 0 && (this.flash >> 1) % 2 ? tinted(im, '#ffffff') : im, x - 16, y - 10, this.dir < 0);
        if (this.state === 'stuck' && (this.t >> 3) % 2) Font.draw('*', x - 4, y - 18, '#f7d64a');
    }
}
SPAWN.shuttle = (x, y, p) => Progress.flag('loom_shuttle') ? new Ent('none') : new Shuttle(x, y, p);

/* ---------------- the Weaver ---------------- */
class Anchor extends GridThing {
    constructor(tx, ty, p = {}) { super('anchor', tx, ty, Object.assign({ weight: WEIGHT.fixed, fixed: true, marked: false, hookable: false }, p)); this.cuttable = true; this.cut = false; }
    onCut() { if (this.cut) return; this.cut = true; Fx.ring(this.tx * T + 8, this.ty * T, '#e4ecf5'); }
    draw(cx, cy) {
        const x = this.tx * T - cx, y = this.ty * T - cy;
        Gfx.rect(x + 5, y - 8, 6, 22, '#5a6070'); Gfx.rect(x + 6, y - 8, 4, 22, '#7a8496'); Gfx.rect(x + 3, y - 10, 10, 3, '#4a5060');
        Gfx.rect(x + 5, y - 4, 6, 2, this.cut ? '#5a6070' : '#e4ecf5');
    }
}
SPAWN.anchor = (x, y, p) => new Anchor(x, y, p);

class Weaver extends Ent {
    constructor(tx, ty, p = {}) {
        super('weaver', p);
        this.tx = tx; this.ty = ty; this.x = tx * T + 8; this.y = ty * T + 8; this.hy = this.y;
        this.hp = 3; this.state = 'sleep'; this.st = 0; this.t = 0; this.flash = 0; this.alive = true; this.shots = []; this.z = 40;
    }
    get sortY() { return this.state === 'down' ? this.y + 20 : this.y + 200; }
    get arena() { return this.area.roomAt(this.tx, this.ty); }
    anchors() { return this.area.ents.filter(e => e.kind === 'anchor'); }
    shutters(shut) { for (const s of this.area.ents) if (s.kind === 'door' && s.group === 'weaver') s.shut = shut; }
    hurtBox() { return this.alive && this.state === 'down' ? { x0: this.x - 14, x1: this.x + 14, y0: this.y - 12, y1: this.y + 8 } : null; }
    update() {
        if (!this.alive) return;
        this.t++; if (this.flash > 0) this.flash--;
        const p = G.player, a = this.area, r = this.arena;
        if (this.state === 'sleep') {
            if (p.area === a && Cam.room === r && !Cam.busy && p.state === 'normal') { this.state = 'aloft'; this.st = 0; this.shutters(true); Music.play('boss'); Script.run(LoomFoes.weaverIntro(this)); }
            return;
        }
        /* silk on Wren wears off in time (or the Shears snip it) */
        if (p.pinned === 'silk' && --this.bindT <= 0) { p.pinned = null; }
        if (Script.blocking()) return;
        this.st++;
        this.updateShots(p, r);
        if (this.state === 'aloft') {
            this.z = 40 + Math.sin(this.t / 30) * 3;
            const period = [0, 70, 95, 120][this.hp];
            if (this.st % period === 0 && p.state === 'normal') {
                const dx = p.x - this.x, dy = p.y - 6 - (this.y - this.z), d = Math.hypot(dx, dy) || 1, sp = 1.6 + (3 - this.hp) * 0.4;
                this.shots.push({ x: this.x, y: this.y - this.z, vx: dx / d * sp, vy: dy / d * sp, life: 240 });
                Sfx.play('throw');
            }
            if (this.anchors().every(n => n.cut)) { this.state = 'fall'; this.st = 0; Sfx.play('fall'); }
        } else if (this.state === 'fall') {
            this.z = Math.max(0, 40 - this.st * 2);
            if (this.z <= 0) { this.state = 'down'; this.st = 0; G.shake = 10; Sfx.play('land'); Fx.dust(this.x, this.y); if (p.area === a && Math.abs(p.x - this.x) < 20 && Math.abs(p.y - this.y) < 18) p.hurt(2, this.x, this.y); if (!Progress.flag('weaver_down')) { Progress.set('weaver_down'); G.pendingToast = 'Its last anchor gone, the Weaver drops into the well of its own loom, tangled.'; } }
        } else if (this.state === 'down') {
            if (this.st > 420) this.climb();
        } else if (this.state === 'climb') {
            this.z = Math.min(40, this.st * 1.5);
            if (this.z >= 40) { this.state = 'aloft'; this.st = 0; }
        }
    }
    climb() {
        this.state = 'climb'; this.st = 0;
        for (const n of this.anchors()) n.cut = false;
        Sfx.play('twang'); Fx.text(this.x, this.y - 30, 'it spins new anchors!', '#e4ecf5');
    }
    updateShots(p, r) {
        const a = this.area;
        for (const s of this.shots) {
            s.x += s.vx; s.y += s.vy; s.life--;
            if (a.kind(tileOf(s.x), tileOf(s.y)).solid || a.roomAt(tileOf(s.x), tileOf(s.y)) !== r) s.life = 0;
            if (p.area === a && p.state === 'normal' && Math.abs(p.x - s.x) < 7 && Math.abs(p.y - 6 - s.y) < 8) {
                s.life = 0; if (p.pinned === 'silk') p.hurt(1, s.x, s.y); p.pinned = 'silk'; this.bindT = 150; Sfx.play('hook'); Fx.text(p.x, p.y - 22, 'bound!', '#e4ecf5');
                if (!Progress.flag('silk_bound')) { Progress.set('silk_bound'); G.pendingToast = 'Silk, wound tight round you. The Shears would make short work of it. (C)'; }
            }
        }
        this.shots = this.shots.filter(s => s.life > 0);
    }
    struck(by, dmg, dir) {
        if (!this.alive || this.flash > 0 || this.state !== 'down') return;
        this.hp--; this.flash = 30; G.hitstop = 8; G.shake = 8; Sfx.play('enemyhit');
        if (this.hp <= 0) return this.defeat();
        this.climb();
    }
    defeat() {
        this.alive = false; this.shots = [];
        const p = G.player; if (p.pinned === 'silk') p.pinned = null;
        Sfx.play('unravel'); Fx.yarn(this.x, this.y, THREAD.loom);
        this.shutters(false);
        Script.run(LoomHouse.afterWeaver(this));
    }
    draw(cx, cy) {
        if (!this.alive) return;
        const x = this.x - cx, y = this.y - cy - this.z;
        /* anchor threads and the web between them */
        const ans = this.anchors();
        for (const n of ans) if (!n.cut && this.state !== 'down') Gfx.line(x, y, n.tx * T + 8 - cx, n.ty * T - 6 - cy, '#e4ecf5');
        if (this.state !== 'down') for (let i = 0; i < ans.length; i++) { const m = ans[i], n = ans[(i + 1) % ans.length]; if (!m.cut && !n.cut) { Gfx.alpha(0.3); Gfx.line(m.tx * T + 8 - cx, m.ty * T - 6 - cy, n.tx * T + 8 - cx, n.ty * T - 6 - cy, '#e4ecf5'); Gfx.alpha(1); } }
        Gfx.alpha(0.25); Gfx.circle(x, this.y - cy + 6, 10, PAL.ink); Gfx.alpha(1);
        const im = spr(this.state === 'down' ? 'weaver_down' : 'weaver');
        if (im) Gfx.img(this.flash > 0 && (this.flash >> 1) % 2 ? tinted(im, '#ffffff') : im, x - im.width / 2, y - im.height + 8);
        for (const s of this.shots) { Gfx.circle(s.x - cx, s.y - cy, 3, '#e4ecf5'); Gfx.rect(s.x - cx - 1, s.y - cy - 1, 2, 2, '#ffffff'); }
        const p = G.player;
        if (p && p.pinned === 'silk') for (let i = 0; i < 4; i++) Gfx.line(p.x - cx - 7, p.y - cy - 14 + i * 4, p.x - cx + 7, p.y - cy - 12 + i * 4, '#e4ecf5');
    }
}
SPAWN.weaver = (x, y, p) => Progress.flag('loom_boss') ? new Ent('none') : new Weaver(x, y, p);

/* bound in silk: the Shears snip you free */
{
    const use0 = Shears.use;
    Shears.use = function (p) {
        if (p.pinned === 'silk') { p.pinned = null; Sfx.play('snip'); Fx.ring(p.x, p.y - 8, '#e4ecf5'); Stats.count('silk:snipped'); return; }
        return use0.call(this, p);
    };
}

const LoomFoes = {
    *shuttleIntro(s) {
        yield 20;
        yield* say(null, "Something long and smooth and wooden lifts itself off the floor and hangs at the end of a silver thread stretched wall to wall: the loom's lost shuttle, big as a boat.");
        yield* say(null, "It flies. Back and forth, back and forth, the way it was made to, through anything soft enough to let it.");
    },
    *shuttleDown(s) {
        yield 30;
        yield* say(null, 'The Shuttle splits along its grain, and all the silver thread wound in it unspools across the floor. In the middle of the room, a lid lifts.');
    },
    *weaverIntro(w) {
        yield 20;
        yield* say(null, "Over the old loom, in a web strung to four great posts, hangs the Weaver: grey, many-legged, very old, spinning. It has been keeping this loom for the First Spinner since she stopped coming.");
        yield* say(null, 'It does not want the cloth finished. It does not want anything to change at all.');
    },
};

function initLoomFoes() {
    defSprite('shuttle', ['................................', '................................', '......kkkkkkkkkkkkkkkkkkkk......', '....kkbbbbbbbbbbbbbbbbbbbbkk....', '..kkbbBBBBBBBBkkkkBBBBBBBBbbkk..', 'kkbbBBBBBBBBBBkwwkBBBBBBBBBBbbkk', 'kbbbBBBBBBBBBBkwwkBBBBBBBBBBbbbk', 'kkbbBBBBBBBBBBkkkkBBBBBBBBBBbbkk', '..kkbbBBBBBBBBBBBBBBBBBBBBbbkk..', '....kkbbbbbbbbbbbbbbbbbbbbkk....', '......kkkkkkkkkkkkkkkkkkkk......', '................................', '................................', '................................', '................................', '................................'], { b: '#a8784a', B: '#c9925a', w: '#e4ecf5' });
    const wv = { g: '#8a94a4', G: '#6a7484', w: '#e4ecf5', e: '#d6304e', k: '#2a2e38' };
    defSprite('weaver', ['..k......kk......k..', '...k....kggk....k...', 'k...k..kggggk..k...k', '.k...kkgGGGGgkk...k.', '..k..kgGeGGeGgk..k..', '...kkgGGGGGGGGgkk...', '....kgGGwGGwGGGk....', 'kkkkgGGGGGGGGGGGkkkk', '....kgGGGGGGGGGk....', '...kkgGGGwwGGGgkk...', '..k..kgGGGGGGgk..k..', '.k...kkgGGGGgkk...k.', 'k...k..kggggk..k...k', '...k....kggk....k...', '..k......kk......k..', '....................'], wv);
    defSprite('weaver_down', ['....................', '....................', '....................', '....................', '....................', '....................', '..kk.kkkkkkkkkk.kk..', '.kwgkgGGGGGGGGgkgwk.', 'kwgGgGGkGGGkGGgGgGwk', 'kgGGGGGGGGGGGGGGGGgk', '.kkgGGGwwwwwwGGGgkk.', '..kkkkkkkkkkkkkkkk..', '....................', '....................', '....................', '....................'], wv);
}
CONTENT_INIT.push(initLoomFoes);
