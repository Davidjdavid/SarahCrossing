/* The Spoolworks' creatures: spoolmites (little bobbin-bugs), Cog the Guild hound (the mini-boss: brass hide, but his
   cord hangs under his kennel; tied off from below he's held wherever he is, struggling, and a knock makes him bolt),
   and the Tangle (the boss: a knot of the Works' old threads, held together by its four bobbins' threads; pull all four
   bobbins off their places at once and it comes apart round its core; knock the core and it yanks everything back). */

/* ---------------- Cog ---------------- */
class Cog extends Enemy {
    constructor(tx, ty, p = {}) {
        super(tx, ty, Object.assign({ type: 'cog', hp: 3 }, p));
        this.state = 'sleep'; this.st = 0; this.cordable = true; this.weightN = 3;
        /* his place, for his cord: the kennel's mark */
        this.ret = { mx: tx, my: ty, area: null, color: THREAD.guild, state: 'home', trace: [[tx, ty]], timer: 99, patience: 99, snap: false, strain: 0, pace: 10 };
    }
    get px() { return this.x - 8; }
    get py() { return this.y - 10; }
    get arena() { return this.area.roomAt(this.hx, this.hy); }
    hurtBox() { return this.alive && this.state !== 'sleep' ? { x0: this.x - 8, x1: this.x + 8, y0: this.y - 14, y1: this.y + 3 } : null; }
    shutters(shut) { for (const s of this.area.ents) if (s.kind === 'door' && s.group === 'cog') s.shut = shut; }
    onKnot() { this.state = 'held'; this.st = 0; Fx.text(this.x, this.y - 22, 'yip!', '#f7d64a'); }
    onUntie() { if (this.state === 'held') { this.state = 'bolt'; this.st = 0; } }
    update() {
        if (!this.alive) return this.updateYarn();
        this.t++; if (this.flash > 0) this.flash--;
        const p = G.player, a = this.area, r = this.arena;
        const home = this.tx === this.hx && this.ty === this.hy;
        if (!this.ret.snap) this.ret.state = home ? 'home' : 'away';
        if (this.state === 'sleep') {
            if (p.area === a && Cam.room === r && !Cam.busy && p.state === 'normal') {
                this.state = 'chase'; this.st = 0; this.shutters(true); Music.play('boss');
                Script.run(SpoolFoes.cogIntro(this));
            }
            return;
        }
        if (Script.blocking()) return;
        this.st++;
        if (this.knotted) { this.state = 'held'; this.anim++; return; }
        const up = p.area === a && Cam.room === r && p.state === 'normal';
        const sp = 0.85 + (3 - this.hp) * 0.22;
        /* tugged home from below: off he goes, fast */
        if (this.ret.snap && this.state !== 'bolt') { this.state = 'bolt'; this.st = 0; }
        switch (this.state) {
            case 'chase': {
                if (!up) { this.state = 'sniff'; this.st = 0; break; }
                const dx = p.x - this.x, dy = p.y - this.y, d = Math.hypot(dx, dy) || 1;
                this.dir = dirOf(dx, dy);
                this.move(dx / d * sp, dy / d * sp); this.anim++;
                if (Math.abs(dx) < 10 && Math.abs(dy) < 8) p.hurt(1, this.x, this.y);
                break;
            }
            case 'sniff':
                /* where did she go? nose to the floor a while, then home */
                if (up && this.st > 20) { this.state = 'chase'; this.st = 0; break; }
                if (this.st > 120) { this.state = 'home'; this.st = 0; }
                break;
            case 'home': case 'bolt': {
                const gx = this.hx * T + 8, gy = this.hy * T + 10, dx = gx - this.x, dy = gy - this.y, d = Math.hypot(dx, dy);
                const s = this.state === 'bolt' ? (this.ret.snap ? 3.2 : 2.2) : 1.0;
                if (d <= s) { this.x = gx; this.y = gy; this.ret.snap = false; this.state = 'sit'; this.st = 0; break; }
                this.dir = dirOf(dx, dy);
                if (!this.move(dx / d * s, dy / d * s)) { this.x += dx / d * s; this.y += dy / d * s; }
                this.anim += 2;
                break;
            }
            case 'sit':
                if (up && this.st > 40) { this.state = 'chase'; this.st = 0; Fx.text(this.x, this.y - 22, '!', '#f7d64a'); Sfx.play('snort'); }
                break;
            case 'held':
                this.state = 'bolt'; this.st = 0;
                break;
        }
        this.traceStep();
    }
    struck(by, dmg, dir) {
        if (!this.alive || this.flash > 0) return;
        if (this.state !== 'held') {
            Sfx.play('hitthing'); Fx.ring(this.x, this.y - 8);
            if (by === G.player) Fx.text(this.x, this.y - 24, 'clang!', '#f7d64a');
            if (dir >= 0) { this.x += DX[dir] * 3; this.y += DY[dir] * 3; }
            return;
        }
        this.hp--; this.flash = 30; G.hitstop = 6; G.shake = 6; Sfx.play('enemyhit');
        Stats.count('boss:cog:hit');
        if (this.hp <= 0) return this.defeat();
        /* he shakes the knot loose and bolts for his kennel */
        Spool.untie(this);
        this.state = 'bolt'; this.st = 0;
        Fx.text(this.x, this.y - 24, 'yelp!', '#fbf6ea');
    }
    shoved() { }
    defeat() {
        this.alive = false; this.yarnT = 0; this.trace = [[this.hx, this.hy]];
        if (this.knotted) { this.knotted = false; }
        this.ret = null; this.cordable = false;
        Sfx.play('unravel'); Fx.yarn(this.x, this.y - 8, THREAD.guild);
        Progress.set('spool_cog');
        this.shutters(false);
        Script.run(SpoolFoes.cogDown(this));
    }
    draw(cx, cy) {
        if (!this.alive) { if ((this.yarnT || 0) < 90) { const k = 1 - this.yarnT / 90; Gfx.circle(this.x - cx, this.y - cy - 4, Math.round(7 * k), THREAD.guild); } return; }
        const x = this.x - cx, y = this.y - cy;
        Gfx.alpha(0.25); Gfx.rect(x - 7, y + 1, 14, 3, PAL.ink); Gfx.alpha(1);
        let im = spr(this.state === 'held' ? 'cog_held' : this.state === 'sit' || this.state === 'sleep' ? 'cog_sit' : 'cog_' + ((this.anim >> 3) % 2));
        if (this.flash > 0 && (this.flash >> 1) % 2) im = tinted(im, '#ffffff');
        const shake = this.state === 'held' ? ((this.t >> 1) % 2 ? 1 : -1) : 0;
        Gfx.img(im, x - 10 + shake, y - 18, this.dir === LEFT);
        if (this.state === 'held') {
            /* his cord, taut, straight down through the floor */
            Gfx.line(x, y - 6, x, y + 4, THREAD.guild); Gfx.rect(x - 1, y + 3, 3, 2, '#c9a24a');
        }
        if (this.state === 'sniff' && (this.t >> 4) % 2) Font.draw('?', x + 8, y - 26, '#fbf6ea');
    }
}
SPAWN.cog = (x, y, p) => Progress.flag('spool_cog') ? new Ent('none') : new Cog(x, y, p);

/* ---------------- the Tangle ---------------- */
class Tangle extends Ent {
    constructor(tx, ty, p = {}) {
        super('tangle', p);
        this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T;
        this.hp = 3; this.state = 'sleep'; this.st = 0; this.t = 0; this.flash = 0; this.alive = true;
        this.balls = []; this.outT = 0; this.openT = 0; this.lashT = 0; this.pulled = 0;
    }
    get sortY() { return this.y + 22; }
    blocks(x, y) { return this.alive && this.state !== 'open' && Math.abs(x - this.tx) <= 1 && Math.abs(y - this.ty) <= 1; }
    onTile(x, y) { return this.blocks(x, y); }
    get isWalker() { return false; }
    bobbins() { return this.area.ents.filter(e => e.tbobbin && !e.removed); }
    out(b) { return b.tx !== b.first[0] || b.ty !== b.first[1]; }
    shutters(shut) { for (const s of this.area.ents) if (s.kind === 'door' && s.group === 'tangle') s.shut = shut; }
    update() {
        if (!this.alive) return;
        this.t++; if (this.flash > 0) this.flash--;
        const p = G.player, a = this.area, r = a.roomAt(this.tx, this.ty);
        if (this.state === 'sleep') {
            if (p.area === a && Cam.room === r && !Cam.busy && p.state === 'normal' && p.ty < r.y + r.h - 2) {
                this.rethread(false, true);
                this.state = 'whole'; this.st = 0; this.shutters(true); Music.play('boss');
                Script.run(SpoolFoes.tangleIntro(this));
            }
            return;
        }
        if (Script.blocking()) return;
        this.updateBalls(r);
        this.st++;
        const bs = this.bobbins(), n = bs.filter(b => this.out(b)).length;
        this.pulled = n;
        for (const b of bs) {
            if (this.out(b) && !b.knotted && !b.stitched && !b.heldBy && !b.mv && b.ret && b.ret.state !== 'returning') {
                if (++b.tangleT > (this.state === 'open' ? 3 : 360)) { b.tangleT = 0; Return.snap(b); Sfx.play('twang'); Fx.text(b.px + 8, b.py - 8, 'yanked!', THREAD.guild); }
            } else b.tangleT = 0;
        }
        if (this.state === 'whole') {
            /* all four threads drawn out of it and held out (stitched or tied off), a moment: it comes apart */
            if (n >= 4 && bs.every(b => b.knotted || b.stitched)) {
                if (++this.outT > 90) { this.state = 'open'; this.openT = 0; this.st = 0; Sfx.play('unravel'); G.shake = 8; Fx.yarn(this.x + 8, this.y + 4, THREAD.guild); if (!Progress.flag('tangle_open')) { Progress.set('tangle_open'); G.pendingToast = 'Every thread pulled out of it at once, the Tangle falls apart round a little hard knot at its heart.'; } }
            } else this.outT = 0;
            if (Cam.room === r && p.state === 'normal') this.attack(p);
        } else if (this.state === 'open') {
            this.openT++;
            /* a bobbin back on its place, and it ties itself up again */
            if (n < 4 || this.openT > 600) this.rethread(false);
        }
    }
    attack(p) {
        const period = [0, 70, 95, 120][this.hp];
        if (this.st % period === 0) {
            const cx = this.x + 8, cy = this.y + 4, dx = p.x - cx, dy = p.y - 6 - cy, d = Math.hypot(dx, dy) || 1, sp = 1.3 + (3 - this.hp) * 0.35;
            this.balls.push({ x: cx, y: cy, vx: dx / d * sp, vy: dy / d * sp, life: 300 });
            Sfx.play('throw');
        }
        /* too close: its cords lash out (a shiver first) */
        const near = Math.hypot(p.x - (this.x + 8), p.y - (this.y + 10)) < 34;
        if (this.lashT > 0) { if (--this.lashT === 0 && near) { p.hurt(1, this.x + 8, this.y + 8); Fx.ring(this.x + 8, this.y + 6, THREAD.guild); Sfx.play('twang'); } }
        else if (near && this.st % 40 === 0) this.lashT = 26;
    }
    updateBalls(r) {
        const a = this.area, p = G.player;
        for (const b of this.balls) {
            b.x += b.vx; b.y += b.vy; b.life--;
            if (a.kind(tileOf(b.x), tileOf(b.y)).solid || a.roomAt(tileOf(b.x), tileOf(b.y)) !== r) b.life = 0;
            const o = a.at(tileOf(b.x), tileOf(b.y)); if (o && o.tbobbin) b.life = 0;
            if (p.area === a && p.state === 'normal' && Math.abs(p.x - b.x) < 6 && Math.abs(p.y - 6 - b.y) < 7) { p.hurt(1, b.x, b.y); b.life = 0; }
        }
        this.balls = this.balls.filter(b => b.life > 0);
    }
    hurtBox() { return this.alive && this.state === 'open' ? { x0: this.x - 2, x1: this.x + 18, y0: this.y - 8, y1: this.y + 16 } : null; }
    struck(by, dmg, dir) {
        if (!this.alive || this.flash > 0) return;
        if (this.state !== 'open') { Sfx.play('hitthing'); return; }
        this.hp--; this.flash = 30; G.hitstop = 8; G.shake = 8; Sfx.play('enemyhit');
        Stats.count('boss:tangle:hit');
        if (this.hp <= 0) return this.defeat();
        this.rethread(true);
    }
    /* it yanks every thread back into itself: stitches undone, knots slipped, bobbins snapped home */
    rethread(hit, quiet) {
        for (const b of this.bobbins()) {
            const rec = Inv.stitches.find(s => s.area === this.area.id && s.key === Needle.key(b));
            if (rec) Needle.unpick(rec);
            if (b.knotted) Spool.untie(b);
            if (b.ret && b.ret.state !== 'home') Return.snap(b);
        }
        this.state = 'whole'; this.st = 0; this.outT = 0; this.openT = 0;
        if (quiet) return;
        Sfx.play('twang'); G.shake = 6;
        if (hit) Fx.text(this.x + 8, this.y - 20, 'it re-knots!', '#f7d64a');
        const p = G.player;
        if (p.area === this.area && this.blocks(p.tx, p.ty)) { p.hurt(1, this.x + 8, this.y + 8); p.unstick(); }
    }
    defeat() {
        this.alive = false; this.balls = [];
        Sfx.play('unravel'); Fx.yarn(this.x + 8, this.y, THREAD.guild);
        Script.run(SpoolFoes.tangleDown(this));
    }
    draw(cx, cy) {
        if (!this.alive) return;
        const x = this.x + 8 - cx, y = this.y + 4 - cy;
        /* threads from it to each bobbin: taut when pulled out */
        for (const b of this.bobbins()) {
            const bx = b.px + 8 - cx, by = b.py + 6 - cy, o = this.out(b);
            Gfx.line(x, y, bx, by, o ? '#f7d64a' : THREAD.guild);
        }
        if (this.state === 'open' || this.state === 'sleep' && false) { }
        if (this.state === 'open') {
            /* the core: a small hard knot, dazed, threads lying loose */
            for (let i = 0; i < 10; i++) { const t = i / 10 * Math.PI * 2; Gfx.line(x, y + 4, x + Math.cos(t) * 20, y + 4 + Math.sin(t) * 12, shade(THREAD.guild, -0.2)); }
            const im = spr('tangle_core');
            if (im) Gfx.img(this.flash > 0 && (this.flash >> 1) % 2 ? tinted(im, '#ffffff') : im, x - 8, y - 6);
            if ((this.t >> 3) % 2) Font.draw('*', x + 8, y - 12, '#f7d64a');
        } else {
            /* the Tangle itself: a ball of knotted cord, smaller for every thread drawn out of it */
            const R = 22 - this.pulled * 3, wob = this.state === 'sleep' ? 0 : Math.sin(this.t / 10) * 1.5;
            Gfx.alpha(0.3); Gfx.circle(x, y + 16, R - 4, PAL.ink); Gfx.alpha(1);
            Gfx.circle(x, y + 2, R + wob, '#4a3020');
            const cols = [THREAD.guild, '#c9925a', '#7a5233', THREAD.ives, THREAD.bram, THREAD.ambrose, THREAD.tess, THREAD.mallow, THREAD.jory];
            for (let i = 0; i < 26; i++) {
                const a0 = i * 2.39 + this.t / 120, rr = (R - 3) * (0.35 + 0.65 * ((i * 37) % 10) / 10);
                const x0 = x + Math.cos(a0) * rr, y0 = y + 2 + Math.sin(a0) * rr * 0.9, x1 = x + Math.cos(a0 + 2.1) * rr, y1 = y + 2 + Math.sin(a0 + 2.1) * rr * 0.9;
                Gfx.line(x0, y0, x1, y1, cols[i % cols.length]);
            }
            if (this.state !== 'sleep') { Gfx.rect(x - 6, y - 2, 3, 3, '#fbf6ea'); Gfx.rect(x + 3, y - 2, 3, 3, '#fbf6ea'); Gfx.rect(x - 5, y - 1, 1, 1, PAL.ink); Gfx.rect(x + 4, y - 1, 1, 1, PAL.ink); }
            if (this.lashT > 0 && (this.t >> 1) % 2) Gfx.circle(x, y + 2, R + 4, THREAD.guild);
            if (this.flash > 0 && (this.flash >> 1) % 2) { Gfx.alpha(0.5); Gfx.circle(x, y + 2, R, '#ffffff'); Gfx.alpha(1); }
        }
        for (const b of this.balls) { Gfx.circle(b.x - cx, b.y - cy, 3, THREAD.guild); Gfx.rect(b.x - cx - 2, b.y - cy - 1, 3, 1, '#e6c08a'); }
    }
}
SPAWN.tangle = (x, y, p) => Progress.flag('spool_boss') ? new Ent('none') : new Tangle(x, y, p);
/* the Tangle's bobbins: wooden, patient; their first places are what the Tangle's threads are measured from */
SPAWN.tbobbin = (x, y, p) => { const b = new Block(x, y, Object.assign({ style: 'wood', look: 'bobbin_t', patience: 360 }, p)); b.tbobbin = true; b.first = [x, y]; return b; };

/* ---------------- spoolmites ---------------- */
SPAWN.spoolmite = (x, y, p) => new Enemy(x, y, Object.assign({ type: 'spoolmite' }, p));

const SpoolFoes = {
    *cogIntro(c) {
        yield 20;
        yield* say(null, 'In the kennel something whirs, clanks and unfolds: a hound of brass and springs and a great deal of thread, wound so tight it hums. COG, says the plate on its collar.');
        yield* say(null, 'It sees you. Its tail begins to spin. The door behind you slams.');
    },
    *cogDown(c) {
        yield 30;
        yield* say(null, 'Cog runs down with a long, sad whirr, sits, and topples over. All the thread wound in him comes loose and runs away down the cracks in the floor like water.');
        yield* say(null, 'By the kennel, a lid springs open with a little ping.');
        Music.play('spoolworks');
    },
    *tangleIntro(t) {
        yield 20;
        yield* say(null, 'In the heart of the Works, held in the middle of the floor by four threads to four bobbins, sits a great knot of old cord: every colour, every House, every Wander there has ever been, all wound into one.');
        yield* say(null, 'It opens two eyes made of buttons. It has been here a very long time, and it does not want to be undone.');
    },
    *tangleDown(t) {
        const a = t.area, r = a.roomAt(t.tx, t.ty);
        Music.play('silence');
        yield 40;
        yield* say(null, 'The little knot at the heart of the Tangle gives, and all of it, forty years of loose ends, slithers apart and away down every crack in the floor, back to wherever each thread belongs.');
        t.shutters(false);
        const g = a.add(new NPC(r.x + 9, r.y + 9, { who: 'gundry', face: 'up' }));
        Fx.poof(g.x + 8, g.y + 8);
        yield 20;
        yield* say('gundry', "Well. I'll be. Forty years I've been meaning to do that. Forty years.");
        yield* say('gundry', "You did it the right way, too. Not by pushing. By knowing what each thing was tied to, and where it ought to be.");
        yield* say('gundry', "That's all a Maker is, Wanderer. Somebody who knows where the threads go.");
        a.add(new Pickup((r.x + 9) * T, (r.y + 5) * T, { what: 'heartstitch', id: 'spoolHeart' }));
        Sfx.play('appear');
        yield* say('gundry', "Here. Take this, and come up to the Guild Hall when you're ready. I've got a cot for you, and a job.");
        Fx.poof(g.x + 8, g.y + 8); a.remove(g);
        Progress.set('spool_boss'); Progress.set('d7');
        Progress.setGoal('Up to the Guild Hall, under the Inn: Gundry has a job for you.');
        Music.play('spoolworks');
        Save.autosave();
    },
};

function initSpoolFoes() {
    ENEMY.spoolmite = { hp: 2, ai: 'wander', chase: true, sight: 4, leash: 5, r: 5, tall: 10, speed: 0.55, yarn: THREAD.guild, drop: 0.4 };
    const sm = { b: '#a8784a', B: '#7a5233', w: '#e6c08a', e: '#2a1f2d', l: '#4a3020' };
    const mite = legs => ['................', '................', '................', '................', '.....kkkkkk.....', '....kwwwwwwk....', '...kbbbbbbbbk...', '...kBeBBBBeBk...', '...kbbbbbbbbk...', '...kBBBBBBBBk...', '....kwwwwwwk....', '.....kkkkkk.....', legs, '................', '................', '................'];
    defSprite('spoolmite_0', mite('....kl.kl.kl....'), sm); defSprite('spoolmite_1', mite('...kl.kl.kl.....'), sm);
    ENEMY_DRAW.spoolmite = e => spr('spoolmite_' + ((e.anim >> 3) % 2));
    ENEMY.cog = { hp: 3, r: 7, tall: 14, yarn: THREAD.guild, weight: WEIGHT.heavy };
    const cg = { b: '#c9a24a', B: '#8a6a2a', w: '#f7e8b8', e: '#2a1f2d', t: THREAD.guild, r: '#d6304e' };
    const dog = (legs, tail) => ['....................', '..............kk....', '.............kbbk...', '............kbbbbk..', '............kbebbkk.', '...' + tail + '.....kbbbbbbk', '..kk..kkkkkkkbbbbkk.', '..kbkkbbbbbbbbbkk...', '...kbbbbbbbbbbbk....', '...kbBbBbBbBbBbk....', '...kbbbbbbbbbbbk....', '....kttttttttttk....', '....' + legs + '....', '....kk..kk..kk..kk..'.slice(0, 20), '....................', '....................', '....................', '....................'];
    defSprite('cog_0', dog('kbk.kbk..kbk.kbk', 'kk'), cg); defSprite('cog_1', dog('.kbkkbk...kbkkbk', 'k.'), cg);
    defSprite('cog_sit', dog('kbbk......kbbk..', '..'), cg);
    defSprite('cog_held', dog('kbk.kbk..kbk.kbk', 'kk').map((r, i) => i === 11 ? '....krrrrrrrrrrk....' : r), cg);
    defSprite('tangle_core', ['................', '.....kkkkkk.....', '....kttTTttk....', '...ktTkkkkTtk...', '...kTk.ww.kTk...', '..ktk.wwww.ktk..', '..kTk.wkkw.kTk..', '..ktk.wwww.ktk..', '...kTk.ww.kTk...', '...ktTkkkkTtk...', '....kttTTttk....', '.....kkkkkk.....', '................', '................', '................', '................'], { t: THREAD.guild, T: '#7a5233', w: '#fbf6ea' });
    defSprite('bobbin', ['................', '..kkkkkkkkkkkk..', '..kiiiiiiiiiik..', '..kkkkkkkkkkkk..', '....kccccccck...', '....kCcCcCcCk...', '....kccccccck...', '....kCcCcCcCk...', '....kccccccck...', '....kCcCcCcCk...', '....kccccccck...', '..kkkkkkkkkkkk..', '..kiiiiiiiiiik..', '..kIIIIIIIIIIk..', '..kkkkkkkkkkkk..', '................'], { i: '#6a6e78', I: '#484c56', c: '#a8784a', C: '#7a5233' });
    defSprite('bobbin_t', ['................', '..kkkkkkkkkkkk..', '..kwwwwwwwwwwk..', '..kkkkkkkkkkkk..', '....kccccccck...', '....kCcCcCcCk...', '....kccccccck...', '....kCcCcCcCk...', '....kccccccck...', '....kCcCcCcCk...', '....kccccccck...', '..kkkkkkkkkkkk..', '..kwwwwwwwwwwk..', '..kWWWWWWWWWWk..', '..kkkkkkkkkkkk..', '................'], { w: '#c9925a', W: '#9a6438', c: THREAD.guild, C: '#7a5233' });
    ART.monogram_spoolworks = paintSprite(16, 16, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#3a2618', 4, 4, 8, 8); R('#a8784a', 5, 5, 6, 2); R('#a8784a', 5, 9, 6, 2); R('#c9a24a', 7, 6, 2, 4); });
    ART.winder = paintSprite(64, 30, x => {
        const R = (c, a, b, w, h) => sq(c, a, b, w, h, x);
        R('#3a2618', 4, 24, 56, 6); R('#6a4630', 8, 20, 4, 6); R('#6a4630', 52, 20, 4, 6);
        x.strokeStyle = '#a8784a'; x.lineWidth = 3; x.beginPath(); x.arc(32, 14, 12, 0, Math.PI * 2); x.stroke();
        x.strokeStyle = '#c9a24a'; x.lineWidth = 1; for (let i = 0; i < 8; i++) { const t = i / 8 * Math.PI * 2; x.beginPath(); x.moveTo(32, 14); x.lineTo(32 + Math.cos(t) * 12, 14 + Math.sin(t) * 12); x.stroke(); }
        const cols = [THREAD.ives, THREAD.bram, THREAD.ambrose, THREAD.tess, THREAD.mallow, THREAD.jory];
        for (let i = 0; i < 6; i++) { x.strokeStyle = cols[i]; x.beginPath(); x.moveTo(20 + i * 4, 24); x.lineTo(32, 14); x.stroke(); }
    });
    ART.kennel = paintSprite(32, 26, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); R('#6a4630', 2, 8, 28, 18); R('#a8784a', 4, 10, 24, 16); R('#3a2618', 11, 14, 10, 12); R('#c9a24a', 0, 4, 32, 6); R('#8a6a2a', 2, 0, 28, 5); R('#fbf6ea', 12, 11, 8, 2); });
}
CONTENT_INIT.push(initSpoolFoes);

ITEM_LINES.needle = () => "You found the {red}Needle{/}! Face a thing (or, from underneath, its cord) and press C; walk the needle with the arrows, up to four tiles, and press C again: that's its place now, for good. It holds three stitches at a time: a fourth undoes the oldest.";
ITEM_AFTER.needle = function* () { Inv.equipped = 'needle'; };
