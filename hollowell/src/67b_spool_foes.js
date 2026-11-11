/* The Spoolworks' creatures: spoolmites (little bobbin-bugs), Cog the Guild hound (the mini-boss: brass hide, but his
   cord hangs under his kennel; tied off from below he's held wherever he is, struggling, and a knock makes him bolt;
   two knocks and he runs down), and the Tangle (the boss: a knot of the Works' old threads, held together by its four
   bobbins' threads). Pull all four bobbins away from it at once and hold them there, and it comes apart round its core:
   knock the core. Knocked, it yanks every thread (knots slip; a stitched bobbin is at home, so it stays) and learns:
   first it hangs itself on the Heart's old hoist, up out of reach (the hoist answers to its counterweight below); then
   it winds the hoist line round the trapdoor and hauls every thread it can in, all the time, even a stitched one off
   its new place (holding beats it; and a ring sends everything home at once, wherever home now is). */

/* ---------------- Cog ---------------- */
class Cog extends Enemy {
    constructor(tx, ty, p = {}) {
        super(tx, ty, Object.assign({ type: 'cog', hp: 2 }, p));     /* (two knocks: a mini-boss shouldn't outstay its idea) */
        this.state = 'sleep'; this.st = 0; this.cordable = true; this.weightN = 3;
        this.noThread = true;     /* (his way home is his cord's, drawn from his mark) */
        /* his place, for his cord: the kennel's mark */
        this.ret = { mx: tx, my: ty, area: null, color: THREAD.guild, state: 'home', trace: [[tx, ty]], timer: 99, patience: 99, snap: false, strain: 0, pace: 10 };
    }
    get px() { return this.x - 8; }
    get py() { return this.y - 10; }
    get arena() { return this.area.roomAt(this.hx, this.hy); }
    get down() { return this.state === 'rundown' || this.state === 'toppled'; }
    hurtBox() { return this.alive && this.state !== 'sleep' && !this.down ? { x0: this.x - 8, x1: this.x + 8, y0: this.y - 14, y1: this.y + 3 } : null; }
    shutters(shut) { for (const s of this.area.ents) if (s.kind === 'door' && s.group === 'cog') s.shut = shut; }
    onKnot() { this.state = 'held'; this.st = 0; this.z = 0; calmBlows(this); Fx.text(this.x, this.y - 22, 'yip!', '#f7d64a'); }
    onUntie() { if (this.state === 'held') { this.state = 'bolt'; this.st = 0; } }
    update() {
        if (!this.alive) return this.updateYarn();
        this.t++; if (this.flash > 0) this.flash--;
        if (this.down) { this.st++; this.anim = 0; return; }
        const p = G.player, a = this.area, r = this.arena;
        const home = this.tx === this.hx && this.ty === this.hy;
        if (!this.ret.snap) this.ret.state = home ? 'home' : 'away';
        if (this.state === 'sleep') {
            /* (not till Wren's well inside: the door can't shut on her standing in it) */
            if (p.area === a && Cam.room === r && !Cam.busy && p.state === 'normal' && p.tx >= r.x + 2) {
                this.state = 'chase'; this.st = 0; this.shutters(true); Music.play('boss');
                Script.run(SpoolFoes.cogIntro(this));
            }
            return;
        }
        if (Script.blocking()) return;
        this.st++;
        if (this.knotted) { this.state = 'held'; this.anim++; return; }
        const up = p.area === a && Cam.room === r && p.state === 'normal';
        const sp = 0.85 + (2 - this.hp) * 0.3;
        /* tugged home from below: off he goes, fast */
        if (this.ret.snap && this.state !== 'bolt') { this.state = 'bolt'; this.st = 0; this.z = 0; calmBlows(this); }
        switch (this.state) {
            case 'chase': {
                if (!up) { this.state = 'sniff'; this.st = 0; break; }
                const dx = p.x - this.x, dy = p.y - this.y, d = Math.hypot(dx, dy) || 1;
                /* his one dangerous move: a few strides off he crouches, tail whirring, and pounces on the spot where Wren
                   stands (its shadow there first): a heart and a half if she's still on it */
                if (d < 56 && d > 20 && this.st > 90) { this.state = 'crouch'; this.st = 0; this.leap = { fx: this.x, fy: this.y, tx: p.x, ty: p.y, tell: tellFor(7) + 6 }; Hazard.drop(this, p.x, p.y, { r: 16, dmg: 3, tell: this.leap.tell + 16, shake: 6 }); Sfx.play('snort'); Stats.count('boss:cog:pounce'); break; }
                this.dir = dirOf(dx, dy);
                this.move(dx / d * sp, dy / d * sp); this.anim++;
                if (Math.abs(dx) < 10 && Math.abs(dy) < 8) p.hurt(1, this.x, this.y);
                break;
            }
            case 'crouch': {
                const l = this.leap;
                if (this.st <= l.tell) break;
                const k = Math.min(1, (this.st - l.tell) / 16);
                this.x = lerp(l.fx, l.tx, k); this.y = lerp(l.fy, l.ty, k); this.z = Math.sin(k * Math.PI) * 14; this.anim += 2;
                if (k >= 1) { this.z = 0; this.settle(); this.state = 'recover'; this.st = 0; Fx.dust(this.x, this.y); }
                break;
            }
            case 'recover': if (this.st > 30) { this.state = 'chase'; this.st = 0; } break;
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
        if (!this.alive || this.flash > 0 || this.down) return;
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
    /* he runs down where he stands: sits, topples over, and only then does the thread wound in him come loose (the
       words follow what's seen: src SpoolFoes.cogDown) */
    defeat() {
        if (this.knotted) { this.knotted = false; this.fixed = this._fixed0; }
        this.state = 'rundown'; this.st = 0;
        Script.run(SpoolFoes.cogDown(this));
    }
    unravel() {
        this.alive = false; this.yarnT = 0; this.trace = [[this.hx, this.hy]];
        this.ret = null; this.cordable = false;
        Sfx.play('unravel'); Fx.yarn(this.x, this.y - 6, THREAD.guild);
        /* the thread wound in him runs off from where he lies, along the cracks between the boards like water (each run
           turning along the grain now and then, stopping at a wall: the same runs every time), and away down them */
        this.runs = [];
        for (let i = 0; i < 6; i++) {
            const pts = [[0, -2]];
            let d = [RIGHT, LEFT, UP, DOWN, RIGHT, LEFT][i], x = 0, y = -2;
            for (let k = 0, n = 3 + Math.floor(hash2(i, 7, 41) * 2); k < n; k++) {
                let len = 8 + Math.floor(hash2(i, k, 42) * 14);
                for (; len > 0; len--) { const k2 = this.area.kind(tileOf(this.x + x + DX[d] * 4), tileOf(this.y + y + DY[d] * 4)); if (k2.solid) break; x += DX[d]; y += DY[d]; }
                pts.push([x, y]);
                d = d === UP || d === DOWN ? (hash2(i, k, 43) < 0.5 ? LEFT : RIGHT) : (hash2(i, k, 43) < 0.5 ? UP : DOWN);
            }
            this.runs.push({ pts, len: pts.reduce((m, q, j) => j ? m + Math.abs(q[0] - pts[j - 1][0]) + Math.abs(q[1] - pts[j - 1][1]) : 0, 0), late: i * 6 });
        }
    }
    /* the stretch of a run from a to b pixels along it */
    runPart(run, a, b, ox, oy) {
        const out = []; let s = 0;
        for (let j = 0; j + 1 < run.pts.length; j++) {
            const [x0, y0] = run.pts[j], [x1, y1] = run.pts[j + 1], L = Math.abs(x1 - x0) + Math.abs(y1 - y0);
            const u0 = clamp((a - s) / (L || 1), 0, 1), u1 = clamp((b - s) / (L || 1), 0, 1);
            if (u1 > u0) { const p0 = [ox + lerp(x0, x1, u0), oy + lerp(y0, y1, u0)], p1 = [ox + lerp(x0, x1, u1), oy + lerp(y0, y1, u1)]; if (!out.length) out.push(p0); out.push(p1); }
            s += L;
        }
        return out;
    }
    draw(cx, cy) {
        if (!this.alive) {
            /* what's left of him for a moment, and his thread running off down the cracks */
            const t = this.yarnT || 0, x = this.x - cx, y = this.y - cy;
            if (t < 50) { const im = spr('cog_down'); if (im) { Gfx.alpha(1 - t / 50); Gfx.img(im, x - 10, y - 13, this.dir === LEFT); Gfx.alpha(1); } }
            for (const r of this.runs || []) {
                const head = clamp((t - r.late) * 0.45, 0, r.len), tail = clamp((t - r.late - 70) * 0.45, 0, r.len);
                if (head > tail + 0.5) { const pts = this.runPart(r, tail, head, x, y); if (pts.length > 1) Threads.path(pts, THREAD.guild); }
            }
            return;
        }
        const x = this.x - cx, y = this.y - cy;
        Gfx.alpha(0.25); Gfx.rect(x - 7, y + 1, 14, 3, PAL.ink); Gfx.alpha(1);
        let im = spr(this.state === 'toppled' ? 'cog_down' : this.state === 'held' ? 'cog_held' : this.state === 'sit' || this.state === 'sleep' || this.state === 'rundown' ? 'cog_sit' : 'cog_' + ((this.anim >> 3) % 2));
        if (this.flash > 0 && (this.flash >> 1) % 2) im = tinted(im, '#ffffff');
        const shake = this.state === 'held' ? ((this.t >> 1) % 2 ? 1 : -1) : this.state === 'rundown' && this.st < 40 ? ((this.st >> 2) % 2) : 0;
        /* (his feet, on the sprite's row 13, on his shadow); crouched to pounce: low, his tail a blur, his "!" */
        const crouch = this.state === 'crouch' && this.st <= this.leap.tell;
        Gfx.img(im, x - 10 + shake + (crouch ? ((this.t >> 1) % 2 ? 1 : -1) : 0), y - 13 + (crouch ? 2 : 0) - Math.round(this.z || 0), this.dir === LEFT);
        if (crouch) Tells.bang(x, y - 30);
        if (this.state === 'held') {
            /* his cord, taut, straight down through the floor */
            Gfx.line(x, y - 2, x, y + 4, THREAD.guild); Gfx.rect(x - 1, y + 3, 3, 2, '#c9a24a');
        }
        if (this.state === 'sniff' && (this.t >> 4) % 2) Font.draw('?', x + 8, y - 21, '#fbf6ea');
    }
}
SPAWN.cog = (x, y, p) => Progress.flag('spool_cog') ? new Ent('none') : new Cog(x, y, p);

/* ---------------- the Tangle ----------------
   Its blows (TELL[7], the hardest so far): yarn balls, after it swells and glows (one; two at once from the rafters;
   three fanned); its cords lashing out round it when Wren's close, the reach drawn on the floor first (a heart and a
   half); and, on the floor, a long cord whipped along its row or its column, right across the hall, the line lit first
   (a heart and a half; in the last beat, row and column at once). Hung up in the rafters, it lets spoolmites down on
   their threads. While it gathers its threads to haul, it throws nothing. Each beat it's knocked into, a heart drops. */
const TG = { ball: [0, 130, 110, 100], sweep: [0, 190, 0, 170], mites: 230, maxMites: 3 };
class Tangle extends Ent {
    constructor(tx, ty, p = {}) {
        super('tangle', p);
        this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T;
        this.hp = 3; this.state = 'sleep'; this.st = 0; this.t = 0; this.flash = 0; this.alive = true;
        this.balls = []; this.outT = 0; this.dazeT = 0; this.lashT = 0; this.pulled = 0;
        this.lift = 0; this.eyes = false; this.haulT = 0; this.gone = false;     /* gone: the hoist torn down */
        this.rungT = 0; this.tight = 0;      /* (a ring heard, till what it sent home has settled; winding tight again after) */
        this.HAUL = 120; this.swell = 0; this.ballT = 60; this.sweepT = 90; this.miteT = 60; this.sweepN = 0;
    }
    /* (hung up in the rafters, it's in front of everything under it) */
    get sortY() { return this.y + 22 + (this.lift > 8 ? 400 : 0); }
    get hall() { return this.area.roomAt(this.tx, this.ty); }
    /* it fills the middle three by three, except pulled apart, or up in the rafters (Wren walks under it then) */
    blocks(x, y, who) { return this.alive && this.state !== 'open' && this.state !== 'down' && !(this.state === 'up' && who === G.player) && Math.abs(x - this.tx) <= 1 && Math.abs(y - this.ty) <= 1; }
    onTile(x, y) { return this.blocks(x, y); }
    get isWalker() { return false; }
    bobbins() { return this.area.ents.filter(e => e.tbobbin && !e.removed); }
    out(b) { return b.tx !== b.first[0] || b.ty !== b.first[1]; }
    /* a thread is held out while its bobbin is off its first place and stays there: held (tied off below, gripped...),
       or at home somewhere else (stitched) */
    keeps(b) { return Return.held(b) || (!!b.stitched && Return.isHome(b) && !b.mv); }
    heldOut(b) { return this.out(b) && this.keeps(b); }
    allOut(bs) { return bs.length >= 4 && bs.every(b => this.heldOut(b)); }
    hoisted() { return !this.gone && Signals.get(this.area, 'hoist'); }
    shutters(shut) { for (const s of this.area.ents) if (s.kind === 'door' && s.group === 'tangle') s.shut = shut; }
    trap() { const r = this.hall; return this.area.ents.find(e => e.kind === 'hatch' && !e.removed && this.area.roomAt(e.tx, e.ty) === r); }
    update() {
        if (!this.alive) return;
        this.t++; if (this.flash > 0) this.flash--;
        const p = G.player, a = this.area, r = this.hall;
        if (this.state === 'sleep') {
            if (p.area === a && Cam.room === r && !Cam.busy && p.state === 'normal' && p.ty < r.y + r.h - 2) {
                this.fresh();
                this.state = 'whole'; this.st = 0; this.shutters(true); Music.play(bossSong('spoolworks'));
                Script.run(SpoolFoes.tangleIntro(this));
            }
            return;
        }
        /* hauled up into the rafters, or let down (through the words too) */
        this.lift = approach(this.lift, this.state === 'up' ? 40 : 0, this.state === 'up' ? 1.5 : 5);
        if (Script.blocking()) return;
        this.updateBalls(r);
        this.st++;
        const bs = this.bobbins();
        this.pulled = bs.filter(b => this.out(b)).length;
        const here = p.area === a && Cam.room === r && p.state === 'normal';
        this.cleanMites();
        if (this.tight > 0) this.tight--;
        /* a ring sent everything not held home: once it's all settled, if a thread's home is in it (a bobbin at its first
           place, not held out), it winds tight again, and says so */
        if (this.rungT > 0 && (this.state === 'whole' || this.state === 'haul')) {
            if (++this.rungT > 60 || bs.every(b => !b.mv && !(b.ret && b.ret.snap))) {
                this.rungT = 0;
                if (!this.allOut(bs) && bs.some(b => !this.out(b)) && bs.every(b => !this.out(b) || this.heldOut(b))) this.windTight();
            }
        } else this.rungT = 0;
        switch (this.state) {
            case 'whole':
                this.reel(bs);
                if (this.allOut(bs)) { if (++this.outT > 30) this.apart(); } else this.outT = 0;
                if (here) { this.balls1(p, 1.4); this.lash(p); this.cordSweep(p); }
                break;
            case 'up':
                if (!this.hoisted() && this.lift > 30) this.drop();
                else if (here && this.lift > 30) { this.balls1(p, 1.7); this.mites(p); }
                break;
            case 'down':
                /* let down, it lies loose; hauled up again once the weight's been back on its plate a moment */
                if (this.hoisted()) { if (++this.dazeT > 120) { this.state = 'up'; this.st = 0; this.dazeT = 0; Sfx.play('twang'); } } else this.dazeT = 0;
                break;
            case 'haul':
                if (++this.haulT >= this.HAUL) { this.haulT = 0; this.haul(bs); }
                else if (this.haulT === this.HAUL - 30) Sfx.play('tug', 0.4);
                if (this.allOut(bs)) { if (++this.outT > 20) this.apart(); } else this.outT = 0;
                /* (gathering its threads to haul, it throws nothing: a breath of peace, every beat) */
                if (here && this.haulT < this.HAUL - 30) { this.lash(p); this.balls1(p, 1.9); this.cordSweep(p); }
                break;
            case 'open':
                /* pulled apart, it lies dazed while every thread's held out, and a moment after one comes back */
                if (this.allOut(bs)) this.dazeT = 0; else if (++this.dazeT > 120) this.rewind();
                break;
        }
    }
    /* phase 1: a bobbin left out and not held, it reels back in after a while */
    reel(bs) {
        for (const b of bs) {
            if (this.out(b) && !this.keeps(b) && !b.mv && b.ret && b.ret.state !== 'returning') {
                if (++b.tangleT > 360) { b.tangleT = 0; Return.snap(b); Sfx.play('twang'); Fx.text(b.px + 8, b.py - 8, 'yanked!', THREAD.guild); }
            } else b.tangleT = 0;
        }
    }
    /* phase 3: on its beat it hauls each thread it can in by a tile, toward the bobbin's first place. Held things (tied
       off, gripped) it can't shift; a stitched bobbin it drags off its new place all the same (it'll want to go home) */
    haul(bs) {
        let n = 0;
        for (const b of bs) {
            if (!this.out(b) || Return.held(b) || b.mv || (b.ret && b.ret.snap)) continue;
            const dx = b.first[0] - b.tx, dy = b.first[1] - b.ty;
            const tries = Math.abs(dx) >= Math.abs(dy) ? [[sign(dx), 0], [0, sign(dy)]] : [[0, sign(dy)], [sign(dx), 0]];
            for (const [sx, sy] of tries) if ((sx || sy) && this.area.freeForThing(b.tx + sx, b.ty + sy, b)) { b.startMove(b.tx + sx, b.ty + sy, 10); n++; break; }
        }
        if (n) { Sfx.play('twang'); G.shake = 2; }
    }
    apart() {
        this.state = 'open'; this.st = 0; this.dazeT = 0; this.outT = 0; this.balls = [];
        Sfx.play('unravel'); G.shake = 8; Fx.yarn(this.x + 8, this.y + 4, THREAD.guild);
        if (!Progress.flag('tangle_open')) { Progress.set('tangle_open'); G.pendingToast = 'Every thread pulled out of it at once, the Tangle falls apart round a little hard knot at its heart.'; }
    }
    /* phase 2: the hook let down, it drops in a loose heap */
    drop() {
        this.state = 'down'; this.st = 0; this.dazeT = 0; this.balls = [];
        Sfx.play('land'); Sfx.play('unravel'); G.shake = 10; Fx.yarn(this.x + 8, this.y + 4, THREAD.guild);
        if (!Progress.flag('tangle_drop')) { Progress.set('tangle_drop'); G.pendingToast = 'The hook comes down, and the Tangle with it, in a loose heap round its hard little heart.'; }
    }
    /* it hears a ring as anything does (in its hall): if the ring sent any of its bobbins home, what comes of it is seen
       once they're settled (above) */
    hear(x, y) {
        if (!this.alive || (this.state !== 'whole' && this.state !== 'haul')) return;
        if (this.bobbins().some(b => b.ret && b.ret.snap)) this.rungT = 1;
    }
    /* everything went home, and home for one of them is in the Tangle: it winds tight again (the wrong idea, told as the
       world went, never the step) */
    windTight() {
        this.tight = 30; Sfx.play('twang'); G.shake = Math.max(G.shake, 3);
        UI.toast('Everything goes home at once, and with nothing held out of it, the Tangle winds tight again.', 220);
        Stats.count('boss:tangle:wound');
    }
    /* a chance missed: it winds itself up again; bobbins left out unheld snap home (knots and stitches stay) */
    rewind() {
        for (const b of this.bobbins()) if (b.ret && b.ret.state !== 'home' && !Return.held(b)) Return.snap(b);
        this.state = this.hp === 1 ? 'haul' : 'whole'; this.st = 0; this.outT = 0; this.dazeT = 0; this.haulT = 0;
        Sfx.play('twang'); G.shake = 4;
        this.squeeze();
    }
    /* winding itself up where Wren stands: out she comes (with a knock, if it's caught her napping) */
    squeeze(hurt = true) { const p = G.player; if (p.area === this.area && this.blocks(p.tx, p.ty, null)) { if (hurt) p.hurt(1, this.x + 8, this.y + 8); p.unstick(); } }
    /* a knock: it yanks every thread; knots slip, anything out and not held snaps home (a stitched bobbin is home) */
    yank() {
        let slipped = false;
        for (const b of this.bobbins()) {
            if (b.knotted) { Spool.untie(b); slipped = true; }
            if (b.ret && b.ret.state !== 'home' && !Return.held(b)) Return.snap(b);
        }
        return slipped;
    }
    /* the fight starts clean, whatever was left from last time */
    fresh() {
        for (const b of this.bobbins()) {
            const rec = Inv.stitches.find(s => s.area === this.area.id && s.key === Needle.key(b));
            if (rec) Needle.unpick(rec);
            if (b.knotted) Spool.untie(b);
            if (b.ret && b.ret.state !== 'home') Return.snap(b);
        }
        this.hp = 3; this.knocks = 0; this.gone = false; this.lift = 0; this.eyes = false; this.rungT = 0; this.tight = 0; this.unseal();
    }
    seal() {
        const h = this.trap(); if (!h) return;
        h.sealed = true;
        if (!h.sealable) {
            h.sealable = true;
            h.interact = function (p) {
                if (!this.sealed) return Hatch.prototype.interact.call(this, p);
                UI.toast("The Tangle's threads are wound round and round the trapdoor. It won't lift."); Sfx.play('hitthing');
                return true;
            };
        }
    }
    unseal() { const h = this.trap(); if (h) h.sealed = false; }
    get beat() { return 4 - clamp(this.hp, 1, 3); }
    /* yarn balls: it swells and glows first (the tell), then one, two at once, or three fanned, at her */
    balls1(p, sp) {
        if (this.swell > 0) {
            if (--this.swell > 0) return;
            const cx = this.x + 8, cy = this.y + 4 - this.lift, a0 = Math.atan2(p.y - 6 - cy, p.x - cx), n = this.beat;
            for (const o of [0, 0.28, -0.28].slice(0, n)) this.balls.push({ x: cx, y: cy, vx: Math.cos(a0 + o) * sp, vy: Math.sin(a0 + o) * sp, life: 300 });
            Sfx.play('throw'); Stats.count('boss:tangle:balls');
            return;
        }
        if (--this.ballT > 0 || p.state !== 'normal') return;
        this.ballT = TG.ball[this.beat]; this.swell = tellFor(7, this.beat); Sfx.play('warn');
    }
    /* too close: its cords lash out all round it (the reach drawn on the floor first) */
    lash(p) {
        const dx = (p.x - (this.x + 8)) / 38, dy = (p.y - (this.y + 10)) / (38 * 0.7), near = dx * dx + dy * dy < 1;     /* (inside the ring it'd draw) */
        if (this.lashT > 0) { this.lashT--; return; }
        if (near && this.st % 40 === 0) {
            this.lashT = tellFor(7, this.beat) + 4;
            Hazard.ring(this, this.x + 8, this.y + 10, 38, { tell: this.lashT, dmg: 3, fxCol: THREAD.guild, fx: 'yarn', shake: 4 });
            Stats.count('boss:tangle:lash');
        }
    }
    /* (1, 3) a long cord whipped across the hall along its row or its column (in the last beat both at once), the line
       lit first: Wren's line if she's on one */
    cordSweep(p) {
        if (--this.sweepT > 0 || p.state !== 'normal') return;
        this.sweepT = TG.sweep[this.beat] || 200;
        const a = this.area, r = this.hall, lines = [];
        const row = () => { const t = []; for (let x = r.x + 1; x < r.x + r.w - 1; x++) if (Math.abs(x - this.tx) > 1 && !a.kind(x, this.ty).solid) t.push([x, this.ty]); return t; };
        const col = () => { const t = []; for (let y = r.y + 1; y < r.y + r.h - 1; y++) if (Math.abs(y - this.ty) > 1 && !a.kind(this.tx, y).solid) t.push([this.tx, y]); return t; };
        if (this.beat === 3) lines.push(row(), col());
        else lines.push(p.ty === this.ty ? row() : p.tx === this.tx ? col() : (this.sweepN++ % 2 ? row() : col()));
        for (const t of lines) Hazard.tiles(this, t, { tell: tellFor(7, this.beat) + 6, dmg: 3, live: 8, fxCol: '#e8b04a', fx: 'yarn', shake: 5 });
        Stats.count('boss:tangle:sweep');
    }
    /* (2) hung in the rafters, it lets spoolmites down on their threads (three about at most) */
    mites(p) {
        if (--this.miteT > 0) return;
        this.miteT = TG.mites;
        const a = this.area, r = this.hall, live = a.ents.filter(e => e.tangleMite && e.alive).length;
        if (live >= TG.maxMites) return;
        for (let i = 0; i < 2 && live + i < TG.maxMites; i++) {
            const x = clamp(p.tx + (i ? 3 : -3), r.x + 2, r.x + r.w - 3), y = clamp(p.ty + (i ? -2 : 2), r.y + 2, r.y + r.h - 3);
            if (a.kind(x, y).solid || a.at(x, y) || this.blocks(x, y, null)) continue;
            const m = a.add(new Enemy(x, y, { type: 'spoolmite' }));
            m.tangleMite = true; m.mode = 'chase'; Fx.poof(m.x, m.y - 6); Sfx.play('twang');
        }
        Stats.count('boss:tangle:mites');
    }
    /* its spoolmites, beaten, don't come back (their yarn runs off down the cracks) */
    cleanMites() { for (const e of this.area.ents.slice()) if (e.tangleMite && !e.alive && e.yarnT > 50) this.area.remove(e); }
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
    hurtBox() { return this.alive && (this.state === 'open' || this.state === 'down') ? { x0: this.x - 2, x1: this.x + 18, y0: this.y - 8, y1: this.y + 16 } : null; }
    struck(by, dmg, dir) {
        if (!this.alive || this.flash > 0) return;
        if (this.state !== 'open' && this.state !== 'down') { Sfx.play('hitthing'); return; }
        /* (three knocks; between them its loose cords lash about) */
        if (!knockCounts(this, 7, this.x + 8, this.y + 10, 36, 3)) { this.dazeT = 0; return; }
        this.hp--; this.flash = 30; G.hitstop = 8; G.shake = 8; Sfx.play('enemyhit');
        Stats.count('boss:tangle:hit');
        calmBlows(this); this.swell = 0; this.lashT = 0; this.ballT = 90; this.sweepT = 120; this.miteT = 60;
        if (this.hp <= 0) return this.defeat();
        { const p = G.player; bossHeart(this.area, p.x, p.y + 18); }
        this.balls = [];
        Script.run(this.hp === 2 ? SpoolFoes.tangleUp(this) : SpoolFoes.tangleHaul(this));
    }
    defeat() {
        this.alive = false; this.balls = []; this.gone = true; this.unseal();
        for (const e of this.area.ents.slice()) if (e.tangleMite) { if (e.alive) Fx.yarn(e.x, e.y - 6, THREAD.guild); this.area.remove(e); }
        Sfx.play('unravel'); Fx.yarn(this.x + 8, this.y, THREAD.guild);
        Script.run(SpoolFoes.tangleDown(this));
    }
    draw(cx, cy) {
        if (!this.alive) return;
        const x = this.x + 8 - cx, y = this.y + 4 - cy, L = Math.round(this.lift), hy = y - L;
        const gather = this.state === 'haul' && this.haulT > this.HAUL - 30;
        /* threads from it to each bobbin: taut and gold when drawn out; hung up in the rafters they droop to them; on
           its hauling beat they flicker, drawing tight */
        for (const b of this.bobbins()) {
            const bx = b.px + 8 - cx, by = b.py + 6 - cy, o = this.out(b);
            const col = (gather || (this.tight > 0 && !o)) && (G.t >> 1) % 2 ? '#fff4c0' : o ? '#f7d64a' : THREAD.guild;
            Threads.path(L > 4 ? [[x, hy], [(x + bx) / 2, Math.max(hy, by) + 4], [bx, by]] : [[x, hy], [bx, by]], col);
        }
        const R = 22 - this.pulled * 3 - Math.round(this.tight / 12);     /* (winding tight: a little smaller, a moment) */
        if (this.state === 'open' || this.state === 'down') {
            /* the core: a small hard knot, dazed, threads lying loose */
            Gfx.alpha(0.3); Gfx.circle(x, y + 16, 10, PAL.ink); Gfx.alpha(1);
            for (let i = 0; i < 10; i++) { const t = i / 10 * Math.PI * 2; Gfx.line(x, y + 4, x + Math.cos(t) * 20, y + 4 + Math.sin(t) * 12, shade(THREAD.guild, -0.2)); }
            const im = spr('tangle_core');
            if (im) Gfx.img(this.flash > 0 && (this.flash >> 1) % 2 ? tinted(im, '#ffffff') : im, x - 8, y - 6);
            if ((this.t >> 3) % 2) Font.draw('*', x + 8, y - 12, '#f7d64a');
        } else {
            /* its shadow on the floor, smaller the higher it hangs; then the Tangle: a ball of knotted cord, smaller for
               every thread drawn out of it */
            Gfx.alpha(0.3); Gfx.circle(x, y + 16, Math.max(5, R - 4 - Math.round(L / 4)), PAL.ink); Gfx.alpha(1);
            const wob = this.state === 'sleep' ? 0 : Math.sin(this.t / 10) * 1.5;
            Gfx.circle(x, hy + 2, R + wob, '#4a3020');
            const cols = [THREAD.guild, '#c9925a', '#7a5233', THREAD.ives, THREAD.bram, THREAD.ambrose, THREAD.tess, THREAD.mallow, THREAD.jory];
            for (let i = 0; i < 26; i++) {
                const a0 = i * 2.39 + this.t / 120, rr = (R - 3) * (0.35 + 0.65 * ((i * 37) % 10) / 10);
                const x0 = x + Math.cos(a0) * rr, y0 = hy + 2 + Math.sin(a0) * rr * 0.9, x1 = x + Math.cos(a0 + 2.1) * rr, y1 = hy + 2 + Math.sin(a0 + 2.1) * rr * 0.9;
                Gfx.line(x0, y0, x1, y1, cols[i % cols.length]);
            }
            /* its eyes: stitched shut, till it opens them (two buttons, two holes each) */
            if (this.eyes) for (const ex of [x - 6, x + 6]) {
                Gfx.circle(ex, hy, 4, PAL.ink); Gfx.circle(ex, hy, 3, '#e8b04a'); Gfx.rect(ex - 2, hy - 2, 2, 1, '#fff0b0');
                Gfx.rect(ex - 1, hy, 1, 1, '#5a3a1a'); Gfx.rect(ex + 1, hy, 1, 1, '#5a3a1a');
            } else for (const ex of [x - 6, x + 6]) { Gfx.rect(ex - 3, hy, 7, 1, PAL.ink); for (const d of [-2, 0, 2]) Gfx.rect(ex + d, hy - 1, 1, 3, PAL.ink); }
            /* about to lash: its cords bristle out all round it (a ring of them, flickering) */
            if (this.lashT > 0 && (this.t >> 1) % 2) for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + this.t / 9; Gfx.line(x + Math.cos(a) * (R - 2), hy + 2 + Math.sin(a) * (R - 2), x + Math.cos(a) * (R + 6), hy + 2 + Math.sin(a) * (R + 6), i % 2 ? THREAD.guild : '#f7d64a'); }
            /* swelling, about to throw: it puffs out and glows */
            if (this.swell > 0) { const k = 1 - this.swell / tellFor(7, this.beat); Gfx.alpha(0.25 + 0.35 * k); Gfx.circle(x, hy + 2, R + 2 + Math.round(k * 3), '#f7d64a'); Gfx.alpha(1); Tells.bang(x, hy - R - 16); }
            if (this.flash > 0 && (this.flash >> 1) % 2) { Gfx.alpha(0.5); Gfx.circle(x, hy + 2, R, '#ffffff'); Gfx.alpha(1); }
        }
        for (const b of this.balls) { Gfx.circle(b.x - cx, b.y - cy, 3, THREAD.guild); Gfx.rect(b.x - cx - 2, b.y - cy - 1, 3, 1, '#e6c08a'); }
    }
}
SPAWN.tangle = (x, y, p) => Progress.flag('spool_boss') ? new Ent('none') : new Tangle(x, y, p);
/* the Tangle's bobbins: wooden, patient; their first places are what the Tangle's threads are measured from */
SPAWN.tbobbin = (x, y, p) => { const b = new Block(x, y, Object.assign({ style: 'wood', look: 'bobbin_t', patience: 360 }, p)); b.tbobbin = true; b.first = [x, y]; b.tangleT = 0; return b; };

/* ---------------- spoolmites ---------------- */
SPAWN.spoolmite = (x, y, p) => new Enemy(x, y, Object.assign({ type: 'spoolmite' }, p));

const SpoolFoes = {
    *cogIntro(c) {
        yield 20;
        yield* say(null, 'In the kennel something whirs, clanks and unfolds: a hound of brass and springs and a great deal of thread, wound so tight it hums. COG, says the plate on its collar.', { focus: c });
        yield* say(null, 'It sees you. Its tail begins to spin. The door behind you slams.', { focus: c });
    },
    /* staged as it's told: he sits, he topples, his thread runs off, and then the chest comes up */
    *cogDown(c) {
        Sfx.play('unravel');
        /* (as he runs down he totters back a little from Wren, and topples away from her: so he lies clear of her, not
           across the top of her head) */
        const p = G.player, a = c.area, dx = c.x - p.x, dy = c.y - p.y;
        const d = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? LEFT : RIGHT) : (dy < 0 ? UP : DOWN);
        const back = (n) => { for (let i = 0; i < n; i++) { const k = a.kind(tileOf(c.x + DX[d] * 9), tileOf(c.y + DY[d] * 7 - 2)); if (k.solid || k.pit) return; c.x += DX[d]; c.y += DY[d]; } };
        const near = Math.abs(dx) < 22 && Math.abs(dy) < 26;
        for (let i = 0; i < 50; i++) { if (near && i % 7 === 6) back(1); yield 1; }
        c.state = 'toppled'; c.st = 0; G.shake = 4; Sfx.play('land'); if (near) back(4); Fx.dust(c.x, c.y);
        yield 30;
        yield* say(null, 'Cog runs down with a long, sad whirr, sits, and topples over.', { focus: c });
        c.unravel();
        yield 20;
        yield* say(null, 'All the thread wound in him comes loose and runs away down the cracks in the floor like water.', { focus: c });
        Progress.set('spool_cog');
        yield 25;
        yield* say(null, 'By the kennel, a little trap in the floor springs open with a ping, and up comes a chest.');
        c.shutters(false);
        Music.play('spoolworks');
    },
    *tangleIntro(t) {
        yield 20;
        yield* say(null, 'In the heart of the Works, held in the middle of the floor by four threads to four bobbins, sits a great knot of old cord: every colour, every House, every Wander there has ever been, all wound into one.', { focus: [t, ...t.bobbins()] });
        t.eyes = true; Sfx.play('click');
        yield 20;
        yield* say(null, 'It opens two eyes made of buttons. It has been here a very long time, and it does not want to be undone.', { focus: t });
    },
    /* knocked once: up on the hoist */
    *tangleUp(t) {
        const slipped = t.yank();
        t.state = 'up'; t.st = 0; G.shake = 6; Sfx.play('twang');
        yield 40;
        yield* say(null, (slipped ? 'It thrashes, and down below your knot gives with a crack. ' : 'It thrashes. ') + 'Then it flings a loose end over the old hoist hook, and the hoist hauls it up into the rafters, out of reach.', { focus: t });
        yield* say(null, "The hoist's line creaks, taut, over its pulley and away down through the floor.");
    },
    /* knocked twice: the hoist torn down and wound round the trapdoor, and then it hauls */
    *tangleHaul(t) {
        const slipped = t.yank();
        t.state = 'haul'; t.st = 0; t.haulT = 0; t.gone = true; t.seal(); t.squeeze(false);
        G.shake = 8; Sfx.play('rumble');
        yield 40;
        const h = t.trap();
        yield* say(null, (slipped ? 'Your knot below gives with a crack. ' : '') + 'The Tangle tears the hoist line down after it and winds it round and round the trapdoor.', { focus: h || t });
        yield* say(null, 'Then every thread it has goes taut, and it begins, slowly, to haul everything back in.', { focus: t });
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
        /* (in at the door and over to Wren, to say it to her face, not from behind a bobbin) */
        yield* Making.fetch(g, G.player);
        yield* say('gundry', "Well. I'll be. Forty years I've been meaning to do that. Forty years.");
        yield* say('gundry', "You did it the right way, too.");
        a.add(new Pickup((r.x + 9) * T, (r.y + 5) * T, { what: 'heartstitch', id: 'spoolHeart' }));
        Sfx.play('appear');
        yield* say('gundry', "Here. Take this, and come up to the Guild Hall when you're ready. I've got a cot for you, and a job.");
        Fx.poof(g.x + 8, g.y + 8); a.remove(g);
        Progress.set('spool_boss'); Progress.set('d7');
        Progress.setGoal('Up to the Guild Hall, under the Inn: Gundry has a job for you.');
        Music.play('spoolworks');
        Save.autosave();
    },
    hoistGone(a) { const t = a && a.ents.find(e => e.kind === 'tangle' && !e.removed); return !!(t && t.gone); },
    /* the Heart's old hoist, over the room: a pulley on the north wall, its hook over the middle, its line along the wall
       and down the west wall into the floor (to the counterweight below); torn down for good in the fight. And the
       hoist line wound round the trapdoor */
    drawHoist(a, cx, cy) {
        const r = a.rooms.find(q => q.key === '1,0');
        if (!r || Cam.room !== r) return;
        const t = a.ents.find(e => e.kind === 'tangle' && !e.removed), gone = Progress.flag('d7') || (t && t.gone);
        const ox = r.x * T - cx, oy = r.y * T - cy, px0 = ox + 9 * T + 8, py0 = oy + 12, wx = ox + 13, gy = oy + 6 * T + 8;
        if (!gone) {
            const up = Signals.get(a, 'hoist');
            /* (hooked into the top of the Tangle while it hangs there or lies let down; else empty, up or down) */
            const top = t ? oy + 5 * T + 6 - Math.round(t.lift) - (22 - t.pulled * 3) : 0;
            const hookY = t && (t.state === 'up' || t.state === 'down' || t.lift > 1) ? top - 2 : up ? oy + 17 : oy + 4 * T;
            Gfx.line(px0 + 3, py0, px0 + 3, hookY, '#d8c8a8'); Gfx.line(px0 + 4, py0, px0 + 4, hookY, '#8a7a5a');
            Gfx.line(wx, py0 + 2, px0 - 3, py0 + 2, '#d8c8a8'); Gfx.line(wx, py0 + 2, wx, gy, '#d8c8a8'); Gfx.line(wx + 1, py0 + 3, wx + 1, gy, '#8a7a5a');
            Gfx.rect(wx - 1, gy, 6, 2, '#c9a24a'); Gfx.rect(wx, gy - 1, 4, 1, '#f7d64a');
            /* the hook */
            Gfx.rect(px0 + 2, hookY, 3, 3, '#c9a24a'); Gfx.rect(px0 + 1, hookY + 3, 2, 3, '#c9a24a'); Gfx.rect(px0 + 2, hookY + 6, 4, 1, '#c9a24a'); Gfx.rect(px0 + 5, hookY + 4, 1, 2, '#c9a24a');
        }
        /* the pulley block, on its bracket (stays up, torn line or not) */
        Gfx.rect(px0 - 2, py0 - 6, 10, 3, PAL.ink); Gfx.rect(px0 - 1, py0 - 5, 8, 1, '#6a4630');
        Gfx.circle(px0 + 3, py0, 4, PAL.ink); Gfx.circle(px0 + 3, py0, 3, '#c9a24a'); Gfx.rect(px0 + 3, py0, 1, 1, PAL.ink);
        /* the trapdoor, wound shut */
        const h = t && t.trap();
        if (h && h.sealed) {
            const x = h.px - cx, y = h.py - cy;
            for (let i = 0; i < 7; i++) {
                const c = [THREAD.guild, '#d8c8a8', THREAD.bram, THREAD.ambrose, '#d8c8a8', THREAD.ives, THREAD.guild][i];
                Gfx.line(x - 1 + i * 3, y - 1, x + 17 - i * 2, y + 15, c); Gfx.line(x + 17 - i * 3, y, x - 1 + i * 2, y + 16, shade(c, -0.2));
            }
        }
    },
};

function initSpoolFoes() {
    ENEMY.spoolmite = { hp: 2, ai: 'wander', chase: true, sight: 4, leash: 5, r: 5, tall: 10, speed: 0.55, yarn: THREAD.guild, drop: 0.4 };
    const sm = { b: '#a8784a', B: '#7a5233', w: '#e6c08a', e: '#2a1f2d', l: '#4a3020' };
    const mite = legs => ['................', '................', '................', '................', '.....kkkkkk.....', '....kwwwwwwk....', '...kbbbbbbbbk...', '...kBeBBBBeBk...', '...kbbbbbbbbk...', '...kBBBBBBBBk...', '....kwwwwwwk....', '.....kkkkkk.....', legs, '................', '................', '................'];
    defSprite('spoolmite_0', mite('....kl.kl.kl....'), sm); defSprite('spoolmite_1', mite('...kl.kl.kl.....'), sm);
    ENEMY_DRAW.spoolmite = e => spr('spoolmite_' + ((e.anim >> 3) % 2));
    ENEMY.cog = { hp: 2, r: 7, tall: 14, yarn: THREAD.guild, weight: WEIGHT.heavy };
    const cg = { b: '#c9a24a', B: '#8a6a2a', w: '#f7e8b8', e: '#2a1f2d', t: THREAD.guild, r: '#d6304e' };
    const dog = (legs, tail) => ['....................', '..............kk....', '.............kbbk...', '............kbbbbk..', '............kbebbkk.', '...' + tail + '.....kbbbbbbk', '..kk..kkkkkkkbbbbkk.', '..kbkkbbbbbbbbbkk...', '...kbbbbbbbbbbbk....', '...kbBbBbBbBbBbk....', '...kbbbbbbbbbbbk....', '....kttttttttttk....', '....' + legs + '....', '....kk..kk..kk..kk..'.slice(0, 20), '....................', '....................', '....................', '....................'];
    defSprite('cog_0', dog('kbk.kbk..kbk.kbk', 'kk'), cg); defSprite('cog_1', dog('.kbkkbk...kbkkbk', 'k.'), cg);
    defSprite('cog_sit', dog('kbbk......kbbk..', '..'), cg);
    defSprite('cog_held', dog('kbk.kbk..kbk.kbk', 'kk').map((r, i) => i === 11 ? '....krrrrrrrrrrk....' : r), cg);
    /* run down: over on his side, legs out, his key still in his back */
    defSprite('cog_down', ['....................', '....................', '....................', '....................', '....................', '....................', '....................',
        '.......k............', '......kbk...........', '..kkkkkbkkkkkkk.....', '.kbbbbbbbbbbbbbkkk..', 'kbBbBbBbBbBbBbbbebk.', 'kbbbbbbbbbbbbbbbbbk.', '.kttttttttttttkkkk..', '..kbk.kbk.kbk.kbk...', '..kk..kk..kk..kk....', '....................', '....................'], cg);
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

ITEM_LINES.needle = () => "You found the {red}Needle{/}! Face a thing (or, from underneath, its cord) and press [tool]; walk the needle with the arrows, up to four tiles, and press [tool] again: that's its place now, for good. It holds three stitches at a time: a fourth undoes the oldest.";
ITEM_AFTER.needle = function* () { Inv.equipped = 'needle'; };
