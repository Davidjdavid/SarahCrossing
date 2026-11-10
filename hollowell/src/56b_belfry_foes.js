/* The Belfry's big ones, and its stones. Clangor: a suit of armour with a bell for a head; nothing Wren
   swings dents it, but every so often it rings itself, and anything out of place nearby snaps home through
   it (two knocks). Tollgrim: a gargoyle living in the great bell; only the clapper coming home hard knocks
   him out of its mouth, and he learns: see the Tollgrim below. */

/* the Echo Room's singing stones: a ring that only sings (no snapping) */
class Stone extends Bell {
    ring() {
        if (this.cool > 0) return;
        this.cool = 20; this.swing = 30;
        const f = { low: 196, mid: 247, high: 294 }[this.pitch] || 247;
        Sfx.tone && Sfx.tone(f, 0.5);
        Sfx.play('bell');
        Fx.ring(this.x + 8, this.y + 2, this.pitch === 'low' ? '#7d5bc4' : this.pitch === 'mid' ? '#4f9be0' : '#5ad1c5');
        Belfry.stone(this);
    }
    draw(cx, cy) {
        const x = this.x - cx, y = this.y - cy;
        const sz = { low: 7, mid: 5, high: 3 }[this.pitch] || 5;
        const sh = this.swing > 0 ? Math.round(Math.sin(this.swing) * 1) : 0;
        Gfx.alpha(0.3); Gfx.rect(x + 8 - sz - 1, y + 13, sz * 2 + 2, 2, PAL.ink); Gfx.alpha(1);
        Gfx.circle(x + 8 + sh, y + 12 - sz, sz + 1, PAL.ink);
        Gfx.circle(x + 8 + sh, y + 12 - sz, sz, this.pitch === 'low' ? '#9a8ab8' : this.pitch === 'mid' ? '#8ab0d8' : '#8ad8cc');
        Gfx.rect(x + 6 + sh, y + 10 - sz * 2 + 2, 2, 1, '#ffffff');
    }
}
SPAWN.stone = (x, y, p) => new Stone(x, y, p);

class Clangor extends Enemy {
    constructor(tx, ty, p = {}) {
        super(tx, ty, Object.assign({ type: 'clangor', hp: 2 }, p));     /* (two knocks: a mini-boss shouldn't outstay its idea) */
        this.state = 'sleep'; this.st = 0; this.weightN = 3.5;
        this.noThread = true;     /* (it keeps its own way home, like the big ones) */
    }
    feetOn() { return false; }
    hurtBox() { return this.alive ? { x0: this.x - 7, x1: this.x + 7, y0: this.y - 22, y1: this.y + 2 } : null; }
    update() {
        if (!this.alive) return this.updateYarn();
        this.t++; if (this.flash > 0) this.flash--;
        const p = G.player, a = this.area;
        if (this.state === 'sleep') {
            const r = a.roomAt(this.hx, this.hy);
            if (p.area === a && Cam.room === r && !Cam.busy && p.ty < r.y + r.h - 1 && p.tx > r.x) {
                this.state = 'walk'; this.st = 0;
                for (const s of a.ents) if (s.kind === 'door' && s.group === 'cl') s.shut = true;
                Music.play('boss');
                Script.run(BelfryFoes.clangorIntro(this));
            }
            return;
        }
        if (Script.blocking()) return;
        this.st++;
        if (this.kx || this.ky) { this.move(this.kx, this.ky); this.kx *= 0.8; this.ky *= 0.8; if (Math.abs(this.kx) + Math.abs(this.ky) < 0.3) this.kx = this.ky = 0; this.traceStep(); }
        const near = p.state === 'normal' && dist(p.x, p.y, this.x, this.y) < 40;
        switch (this.state) {
            case 'walk': {
                const dx = p.x - this.x, dy = p.y - this.y, d = Math.hypot(dx, dy) || 1;
                if (d > 18) { this.move(dx / d * 0.45, dy / d * 0.45); this.dir = dirOf(dx, dy); this.anim++; this.traceStep(); }
                if ((this.st > 200 || (near && this.st > 90))) {
                    this.state = 'windup'; this.st = 0; Sfx.play('twang');
                    /* its one dangerous move: the ring's reach drawn round it on the floor while it winds up (a full heart) */
                    Hazard.ring(this, this.x, this.y, 30, { tell: 41, dmg: 2, fx: 'sparks', shake: 6, sound: 'bell' });
                }
                break;
            }
            case 'windup':
                if (this.st > 40) {
                    this.state = 'ring'; this.st = 0;
                    Bells.ring(a, this.x, this.y - 8, 6);
                    G.shake = 6;
                }
                break;
            case 'ring': if (this.st > 30) { this.state = 'walk'; this.st = 0; } break;
            case 'stunned': if (this.st > 170) { this.state = 'walk'; this.st = 0; } break;
        }
        if (this.state === 'walk' && p.state === 'normal' && Math.abs(p.x - this.x) < 10 && Math.abs(p.y - this.y) < 8) p.hurt(1, this.x, this.y);
    }
    /* something coming home slammed into it */
    shoved(d, pace, by) {
        if (!this.alive || this.state === 'stunned') return;
        this.kx = DX[d] * 3; this.ky = DY[d] * 3;
        this.state = 'stunned'; this.st = 0; calmBlows(this);
        G.shake = 10; G.hitstop = 6; Sfx.play('hitthing'); Sfx.play('boss');
        Stats.count('boss:clangor:slam');
        if (!Progress.flag('cl_tip')) { Progress.set('cl_tip'); UI.toast("Its bell-helm's knocked crooked! Quick!", 140); }
    }
    struck(by, dmg, dir) {
        if (!this.alive) return;
        if (this.state !== 'stunned') { Sfx.play('hitthing'); Fx.ring(this.x, this.y - 14); return; }
        if (this.flash > 0) return;
        this.hp--; this.flash = 30; G.hitstop = 8; G.shake = 6; Sfx.play('enemyhit');
        this.state = 'walk'; this.st = 0;
        if (this.hp <= 0) this.defeat();
    }
    defeat() {
        this.alive = false; this.yarnT = 0; this.trace = [[this.hx, this.hy]];
        Sfx.play('unravel'); Fx.yarn(this.x, this.y - 12, THREAD.tess);
        Progress.set('belfry_clangor');
        for (const s of this.area.ents) if (s.kind === 'door' && s.group === 'cl') s.shut = false;
        Script.run(BelfryFoes.clangorDown(this));
    }
    draw(cx, cy) {
        if (!this.alive) {
            if ((this.yarnT || 0) < 120) { const k = 1 - this.yarnT / 120; Gfx.circle(this.x - cx, this.y - cy - 4, Math.round(9 * k), THREAD.tess); }
            return;
        }
        const x = this.x - cx, y = this.y - cy;
        Gfx.alpha(0.25); Gfx.rect(x - 8, y + 1, 16, 3, PAL.ink); Gfx.alpha(1);
        const im = spr(this.state === 'stunned' ? 'clangor_off' : 'clangor');
        const img = this.flash > 0 && (this.flash >> 1) % 2 ? tinted(im, '#ffffff') : im;
        const sh = this.state === 'windup' ? ((this.st >> 1) % 2 ? 1 : -1) : 0;
        Gfx.img(img, x - 12 + sh, y - 30 - (this.state === 'windup' ? 2 : 0));
    }
}
SPAWN.clangor = (x, y, p) => Progress.flag('belfry_clangor') ? new Ent('none') : new Clangor(x, y, p);

/* the great bell itself: a big fixed thing at the top of the hall */
SPAWN.greatbell = (tx, ty) => {
    const pr = new Prop(tx, ty, { im: ART.greatbell, solid: [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1], [0, 2], [3, 2]], ox: -2, oy: -8 });
    pr.baseY = ART.greatbell ? ART.greatbell.height - 6 : 50;
    return pr;
};
/* its clapper: an iron weight that hangs in the bell's mouth; the gust blows it out */
class Clapper extends GridThing {
    constructor(tx, ty, p = {}) { super('clapper', tx, ty, Object.assign({ weight: WEIGHT.medium }, p)); }
    sprite() { return spr('clapper'); }
}
SPAWN.clapper = (x, y, p) => new Clapper(x, y, p);

/* Tollgrim lives in the great bell and leans out of its mouth to spit gravel whenever the clapper is out of it. Only
   the clapper coming home hard (a bell's snap: it shoves harder) knocks him out onto the floor, dazed, to be struck.
   He learns, in three beats:
   1. the draught blows down through the bell's mouth and carries the clapper out; ring, and it slams home into him.
   2. he heaves the bell round: shutters bang open in the east wall and a gale blows along under the bell without a
      let-up, laying the clapper against the west wall; and he listens: a ring within a bell's reach of him (seven
      strides, as anywhere) and he's back inside before anything comes home. So the ring has to come from beyond his
      hearing and still reach the clapper (the far end of the hall; or the old bell in the west bay, struck).
   3. he watches Wren: while she's near enough to ring the clapper home, he keeps his head in (his eyes in the bell's
      mouth go red). Something else has to ring near the clapper while she's far off: a pot carried under the old
      bell and smashed out of his sight sends its pieces home past it (the Kiln's way), and the old bell rings. */
/* His blows (TELL[4]): leaning out, he spits gravel, his cheeks puffing first (one stone; then a burst of three; then a
   fan of three); from the second beat, hidden in the bell, he pounds on it and mortar shakes down from the rafters
   (shadows first: a full heart); in the third, red-eyed, he lunges out at Wren if she comes up under the bell's mouth
   (the floor there lit first: a full heart). Each beat he's knocked into, a heart drops from the rafters. */
const TOLL = { lean: [0, 30, 20, 20], spit: [0, 75, 70, 70], spitSp: [0, 1.7, 1.9, 2.0], peek: [0, 330, 600, 600], daze: 200, wary: 8, toll: [0, 0, 220, 190], rubble: 5 };
class Tollgrim extends Enemy {
    constructor(tx, ty, p = {}) {
        super(tx, ty, Object.assign({ type: 'tollgrim', hp: 3 }, p));
        this.state = 'sleep'; this.st = 0; this.weightN = 2.5; this.hidden = true;
        this.mouth = [tx - 1, ty + 1];       /* where he leans out (the clapper's own place) */
        this.spits = []; this.told = 1; this.wary = 0; this.puff = 0; this.burst = 0; this.tollCool = 120; this.pounceCool = 60;
    }
    get phase() { return 4 - Math.max(1, Math.min(3, this.hp)); }
    onTile(x, y) { return this.alive && this.state === 'peek' && x === this.mouth[0] && y === this.mouth[1]; }
    feetOn() { return false; }
    /* dazed on the floor he can be struck; leaning out, he's stone, and whatever hits him clangs off */
    hurtBox() {
        if (!this.alive) return null;
        if (this.state === 'stunned') return { x0: this.x - 8, x1: this.x + 8, y0: this.y - 16, y1: this.y + 2 };
        if (this.state === 'peek') return { x0: this.x - 7, x1: this.x + 7, y0: this.y - 18, y1: this.y - 2 };
        return null;
    }
    /* is Wren near enough to the clapper to ring it home (a bell's reach, measured as a ring measures it)? */
    nearClapper(p, c) { return !!(p && c && p.area === this.area && Math.hypot(c.px + 8 - p.x, c.py + 8 - (p.y - 4)) <= Bells.REACH * T + 4); }
    /* the hall's weather is his: the draught down through the bell, then the gale along under it */
    weather() {
        const a = this.area, on = this.alive && this.state !== 'sleep', ph = this.phase;
        const g1 = a.find('gbGust'), g2 = a.find('gbGale');
        if (g1) g1.off = !(on && ph === 1);
        if (g2) g2.off = !(on && ph >= 2);
    }
    update() {
        if (!this.alive) return this.updateYarn();
        this.t++; if (this.flash > 0) this.flash--;
        const p = G.player, a = this.area;
        if (!Script.blocking()) this.updateSpits();
        this.weather();
        if (this.state === 'sleep') {
            const r = a.roomAt(this.hx, this.hy);
            /* (in off the doorstep first, so the shutter doesn't close on Wren) */
            if (p.area === a && Cam.room === r && !Cam.busy && p.ty < r.y + r.h - 1 && p.tx < r.x + r.w - 1) {
                this.state = 'hide'; this.st = 0;
                for (const s of a.ents) if (s.kind === 'door' && s.group === 'boss') s.shut = true;
                const g1 = a.find('gbGust'); if (g1) { g1.t = 0; g1.phase = g1.period - 40; }    /* (the first draught soon) */
                Progress.set('belfry_tollAwake');
                Music.play(bossSong('belfry'));
                Script.run(BelfryFoes.tollIntro(this));
            }
            return;
        }
        if (Script.blocking()) return;
        this.st++;
        const clap = a.find('clapper');
        const out = clap && clap.ret && clap.ret.state === 'away';     /* (not while it's on its way home: he isn't daft) */
        const [mx, my] = this.mouth, ph = this.phase;
        const here = p.area === a && p.state === 'normal' && a.roomAt(p.tx, p.ty) === a.roomAt(this.hx, this.hy);
        /* (2, 3) he pounds on the bell, in it or leaning out, and mortar shakes down from the rafters */
        if (ph >= 2 && (this.state === 'hide' || this.state === 'peek') && here && --this.tollCool <= 0) this.toll(p, ph);
        /* (3) red-eyed, watching her: up close under the bell's mouth, and he lunges out at her (from in it or leaning out) */
        if (this.pounceCool > 0) this.pounceCool--;
        else if (ph === 3 && here && (this.state === 'hide' || this.state === 'peek') && this.pounceZone().some(([x, y]) => p.tx === x && p.ty === y)) {
            if (this.state === 'peek') this.duck();
            this.state = 'pounce'; this.st = 0; this.tellN = tellFor(4, 3) + 4;
            Hazard.tiles(this, this.pounceZone(), { tell: this.tellN, dmg: 2, live: 10, fx: 'dust', shake: 6, sound: 'boss' });
            Stats.count('boss:tollgrim:pounce');
        }
        switch (this.state) {
            case 'hide':
                this.hidden = true; this.x = this.hx * T + 8; this.y = this.hy * T + 10;
                /* the clapper's out of the way: lean out of the mouth (in the third beat, only while Wren's too far off to
                   ring it home) */
                if (out && this.st > TOLL.lean[ph] && !a.at(mx, my) && !(p.tx === mx && p.ty === my) && !(ph === 3 && this.nearClapper(p, clap))) {
                    this.state = 'peek'; this.st = 0; this.wary = 0; this.x = mx * T + 8; this.y = my * T + 10; this.hidden = false; Sfx.play('blip');
                    break;
                }
                break;
            case 'pounce':
                /* the tell (his eyes flaring in the dark), then out at her and straight back in */
                if (this.st >= this.tellN + 16) { this.state = 'hide'; this.st = 0; this.pounceCool = 150; }
                break;
            case 'peek':
                this.hidden = false;
                /* (3) she's come within ringing distance of the clapper: back in */
                if (ph === 3 && out && this.nearClapper(p, clap)) { if (++this.wary > TOLL.wary) { this.duck(); break; } } else this.wary = 0;
                /* he comes out spitting: cheeks puffed (the tell), then the gravel; again every so often */
                if (this.st === 2 || (this.st > 2 && this.st % TOLL.spit[ph] === 2)) this.puff = tellFor(4, ph);
                if (this.puff > 0 && --this.puff === 0) { this.spit(p); if (ph === 2) this.burst = 2; }
                if (this.burst > 0 && (this.st % 8) === 0) { this.burst--; this.spit(p); }
                if (this.st > TOLL.peek[ph]) { this.state = 'hide'; this.st = 0; this.puff = this.burst = 0; }
                break;
            case 'stunned':
                this.hidden = false;
                if (this.kx || this.ky) { this.move(this.kx, this.ky); this.kx *= 0.85; this.ky *= 0.85; if (Math.abs(this.kx) + Math.abs(this.ky) < 0.3) this.kx = this.ky = 0; }
                if (this.st > TOLL.daze) { this.state = 'hide'; this.st = 0; Fx.dust(this.x, this.y); }
                break;
        }
    }
    duck() { this.state = 'hide'; this.st = 0; this.wary = 0; this.puff = this.burst = 0; this.hidden = true; this.x = this.hx * T + 8; this.y = this.hy * T + 10; Sfx.play('blip'); }
    /* the floor up under the bell's mouth: what he can reach, lunging out */
    pounceZone() { const [mx, my] = this.mouth, a = this.area, z = []; for (let y = my; y <= my + 1; y++) for (let x = mx - 1; x <= mx + 2; x++) if (!a.kind(x, y).solid) z.push([x, y]); return z; }
    /* he pounds on the bell from inside: dust and mortar shake down from the rafters, two lumps near Wren and the rest
       anywhere in the hall (their shadows first) */
    toll(p, ph) {
        const a = this.area, r = a.roomAt(this.hx, this.hy), tell = tellFor(4, ph) + 10, cand = [];
        for (let y = r.y + 4; y < r.y + r.h - 1; y++) for (let x = r.x + 1; x < r.x + r.w - 1; x++) if (!a.kind(x, y).solid && !a.at(x, y)) cand.push([x, y]);
        cand.sort((m, n) => dist(m[0], m[1], p.tx, p.ty) - dist(n[0], n[1], p.tx, p.ty));
        const near = cand.splice(0, 5), picks = [];
        const take = (from, n) => { for (let i = 0; i < n && from.length; i++) picks.push(from.splice(Math.floor(G.rng() * from.length), 1)[0]); };
        take(near, 2); take(cand, TOLL.rubble - 2);
        for (const [x, y] of picks) Hazard.drop(this, x * T + 8, y * T + 10, { r: 11, dmg: 2, tell, fx: 'dust', quiet: true, look: BelfryFoes.drawRubble });
        this.tollCool = TOLL.toll[ph]; this.pounding = tell;
        Sfx.play('warn'); Sfx.play('boss'); G.shake = 4;
        Stats.count('boss:tollgrim:toll');
    }
    /* (2, 3) he hears a ring as anything hears one: within a bell's reach. Heard, he's back inside before the clapper
       is home (the snap still takes it home: there's just no one in its way) */
    hear(x, y) {
        if (!this.alive || this.phase < 2 || this.state !== 'peek') return;
        if (Math.hypot(this.x - x, this.y - 6 - y) > Bells.REACH * T + 4) return;
        this.duck(); Fx.text(this.hx * T + 8, this.hy * T - 6, '!', '#f7d64a');
        Stats.count('boss:tollgrim:heard');
        if (!Progress.flag('toll_heard')) { Progress.set('toll_heard'); UI.toast('At the first note he ducks back into the bell, and the clapper comes home to an empty mouth.', 200); }
    }
    spit(p) {
        if (!p || p.state !== 'normal') return;
        const d = Math.hypot(p.x - this.x, p.y - this.y) || 1, sp = TOLL.spitSp[this.phase];
        this.spits.push({ x: this.x, y: this.y - 6, vx: (p.x - this.x) / d * sp, vy: (p.y - this.y) / d * sp, t: 0 });
        Sfx.play('throw');
    }
    updateSpits() {
        const p = G.player;
        for (const s of this.spits) {
            s.t++; s.x += s.vx; s.y += s.vy;
            if (p.state === 'normal' && Math.abs(p.x - s.x) < 6 && Math.abs(p.y - 4 - s.y) < 7) { p.hurt(1, s.x - s.vx * 4, s.y - s.vy * 4); s.done = true; }
            if (s.t > 200 || this.area.kind(tileOf(s.x), tileOf(s.y)).solid) s.done = true;
        }
        this.spits = this.spits.filter(s => !s.done);
    }
    /* the clapper slammed home into him */
    shoved(d, pace, by) {
        if (!this.alive || this.state !== 'peek') return;
        this.state = 'stunned'; this.st = 0; this.wary = 0;
        /* knocked clean out of the bell: he lands dazed on the floor below it */
        const [mx, my] = this.mouth, a = this.area;
        const spot = [[mx, my + 2], [mx + 1, my + 2], [mx - 1, my + 2], [mx, my + 3]].find(([x, y]) => !a.at(x, y) && !a.kind(x, y).solid) || [mx, my + 2];
        this.x = spot[0] * T + 8; this.y = spot[1] * T + 10; this.kx = this.ky = 0;
        Fx.dust(this.x, this.y);
        G.shake = 12; G.hitstop = 8; Sfx.play('bell'); Sfx.play('hitthing');
        Stats.count('boss:tollgrim:slam');
    }
    clang() { if (this.flash > 0) return; Sfx.play('hitthing'); Fx.ring(this.x, this.y - 10); }
    hooked(h) { this.clang(); }
    struck(by, dmg, dir) {
        if (!this.alive) return;
        if (this.state !== 'stunned') { if (this.state === 'peek') this.clang(); return; }
        if (this.flash > 0) return;
        /* (two knocks to put him back in his bell; between them he flails about on the floor) */
        if (!knockCounts(this, 4, this.x, this.y + 2, 28)) { this.st = Math.max(0, this.st - 40); return; }
        this.hp--; this.flash = 30; G.hitstop = 8; G.shake = 6; Sfx.play('enemyhit');
        Stats.count('boss:tollgrim:hit');
        calmBlows(this);
        if (this.hp <= 0) return this.defeat();
        bossHeart(this.area, this.x, this.y + 16);        /* (a heart drops from the rafters) */
        this.duck(); this.tollCool = 150;
        this.beginPhase(this.phase);
    }
    /* a new beat: the hall changes with it (the bell heaved round, the wind turned), and a line says how he's changed */
    beginPhase(n) {
        if (n <= this.told) return;
        this.told = n;
        const a = this.area;
        const room = a.roomAt(this.hx, this.hy);
        if (n === 2) for (const v of a.ents) if (v.kind === 'vane' && a.roomAt(v.tx, v.ty) === room) v.gust = 'gbGale';
        this.weather();
        G.shake = 10; Sfx.play('rumble');
        Stats.count('boss:tollgrim:beat' + n);
        Script.run(BelfryFoes.tollBeat(this, n));
    }
    defeat() {
        this.alive = false; this.yarnT = 0; this.trace = [[this.hx, this.hy]]; this.spits = [];
        this.weather();
        Sfx.play('unravel'); Fx.yarn(this.x, this.y - 8, THREAD.tess);
        Progress.set('belfry_boss');
        Script.run(BelfryFoes.tollDown(this));
    }
    draw(cx, cy) {
        for (const s of this.spits) { Gfx.circle(s.x - cx, s.y - cy, 2, '#7f7688'); Gfx.rect(s.x - cx - 1, s.y - cy - 1, 1, 1, '#c4bccb'); }
        if (!this.alive) {
            if ((this.yarnT || 0) < 120) { const k = 1 - this.yarnT / 120; Gfx.circle(this.x - cx, this.y - cy - 4, Math.round(8 * k), THREAD.tess); }
            return;
        }
        /* pounding on the bell from inside: dust sifting down round its rim, his eyes showing */
        if (this.pounding > 0) {
            this.pounding--;
            if ((this.t >> 2) % 2) for (const ox of [-18, 0, 18]) Gfx.rect(this.hx * T - cx + 4 + ox + ((this.t >> 3) % 3), this.hy * T - cy - 18 + ((this.t * 3) % 22), 1, 2, '#cfc6b8');
        }
        /* about to lunge: his eyes flaring wide in the mouth of the bell, then out he comes and back */
        if (this.state === 'pounce') {
            const ex = this.hx * T - cx + 1, ey = this.hy * T - cy + 5;
            if (this.st < this.tellN) { const big = (this.t >> 2) % 2 ? 3 : 2; Gfx.rect(ex, ey, big, big, '#ff5a4a'); Gfx.rect(ex + 6, ey, big, big, '#ff5a4a'); Tells.bang(ex + 4, ey - 34); return; }
            const im = spr('toll'), [mx, my] = this.mouth, k = Math.sin(Math.min(1, (this.st - this.tellN) / 16) * Math.PI);
            Gfx.img(im, mx * T + 8 - cx - 10, my * T + 10 - cy - 20 + Math.round(k * 14));
            return;
        }
        if (this.state === 'hide' || this.state === 'sleep') {
            /* his eyes in the dark of the bell's mouth: now and then early on; in the third beat always, following Wren,
               and red while she's near enough to ring the clapper home */
            const watch = this.state === 'hide' && this.phase === 3, p = G.player;
            if (!watch && !this.pounding && (this.t >> 4) % 4 !== 0) return;
            const near = watch && this.nearClapper(p, this.area.find('clapper'));
            const lx = watch && p ? clamp(Math.round((p.x - this.x) / 40), -1, 1) : 0, ly = watch && p && p.y > this.y + 20 ? 1 : 0;
            /* (in the dark band of the bell's mouth) */
            const ex = this.hx * T - cx + 1 + lx, ey = this.hy * T - cy + 6 + ly, col = near ? '#ff5a4a' : '#f7d64a';
            Gfx.rect(ex, ey, 2, 2, col); Gfx.rect(ex + 6, ey, 2, 2, col);
            return;
        }
        const im = spr(this.state === 'stunned' ? 'toll_daze' : 'toll');
        const img = this.flash > 0 && (this.flash >> 1) % 2 ? tinted(im, '#ffffff') : im;
        /* cheeks puffed: about to spit (he swells a little, and the gravel glows in his mouth) */
        const sw = this.puff > 0 ? ((this.t >> 1) % 2 ? 1 : 0) : 0;
        Gfx.img(img, this.x - cx - 10 - sw, this.y - cy - 20 - sw);
        if (this.puff > 0) Tells.glow(this.x - cx, this.y - cy - 8, 1 - this.puff / tellFor(4, this.phase), '#c4bccb');
    }
}
SPAWN.tollgrim = (x, y, p) => Progress.flag('belfry_boss') ? new Ent('none') : new Tollgrim(x, y, p);

/* the shutters in the great bell's east wall: shut while the draught comes down through the bell, banging open when
   Tollgrim heaves the bell round and the gale comes in sideways */
class Louvre extends Ent {
    constructor(tx, ty, p = {}) { super('louvre', p); this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T; this.k = 0; }
    get sortY() { return this.y + 15; }
    update() { const g = this.area.find(this.gust || 'gbGale'), want = g && g.on ? 1 : 0; this.k = approach(this.k, want, 0.08); }
    draw(cx, cy) {
        const x = this.x - cx, y = this.y - cy, k = this.k;
        /* the opening in the wall, dark, with sky in it once it's open */
        Gfx.rect(x + 3, y + 1, 11, 13, PAL.ink); Gfx.rect(x + 4, y + 2, 9, 11, k > 0.5 ? '#9fd4f0' : '#2a2438');
        if (k > 0.5) { Gfx.rect(x + 4, y + 9, 9, 4, '#c4dcef'); Gfx.rect(x + 6, y + 4, 3, 1, '#ffffff'); }
        /* two wooden leaves on brass hinges: flat across the opening, or swung back against the wall */
        const lw = Math.round(5 * (1 - k)) + 1;
        Gfx.rect(x + 3, y + 1, lw, 13, PAL.ink); Gfx.rect(x + 4, y + 2, Math.max(1, lw - 1), 11, '#9a6438');
        Gfx.rect(x + 14 - lw, y + 1, lw, 13, PAL.ink); Gfx.rect(x + 14 - lw, y + 2, Math.max(1, lw - 1), 11, '#9a6438');
        for (const hy of [y + 3, y + 10]) { Gfx.rect(x + 3, hy, 1, 2, '#e8b04a'); Gfx.rect(x + 13, hy, 1, 2, '#e8b04a'); }
        if (lw > 2) for (let i = 0; i < 4; i++) { Gfx.rect(x + 4, y + 3 + i * 3, lw - 1, 1, '#6b4128'); Gfx.rect(x + 14 - lw, y + 3 + i * 3, lw - 1, 1, '#6b4128'); }
    }
}
SPAWN.louvre = (x, y, p) => new Louvre(x, y, p);

const BelfryFoes = {
    /* a lump of old mortar, coming down from the rafters */
    drawRubble(x, y) { Gfx.rect(x - 4, y - 7, 8, 6, PAL.ink); Gfx.rect(x - 3, y - 6, 6, 4, '#a89fb0'); Gfx.rect(x - 3, y - 6, 3, 1, '#d8d0de'); },
    *clangorIntro(c) {
        yield 20;
        yield* say(null, "A suit of armour clanks to life. Where its head should be there's a bell, upside down, and inside the bell a clapper swinging like a tongue. CLANG, it says. The doors grind shut.");
    },
    *clangorDown(c) {
        Music.play('silence');
        yield 40;
        yield* say(null, 'Clangor falls to pieces with a noise like a dropped cutlery drawer. Somewhere in the room, something goes clunk.');
        Music.play('belfry'); Sfx.play('appear');
    },
    *tollIntro(t) {
        const bell = [t.hx, t.hy, 48];
        yield 20;
        yield* say(null, 'Something moves inside the great bell: two yellow eyes, and a voice like gravel in a bucket. "MINE. MY BELL. MY TOWER. GO AWAY OR I\'LL TOLL YOU."', { focus: bell });
        yield* say(null, 'A cold draught blows down through the tower, and the great clapper sways.', { focus: bell });
    },
    /* a new beat of the fight: what's changed in the hall, and in him */
    *tollBeat(t, n) {
        const bell = [t.hx, t.hy, 48];
        yield 30;
        if (n === 2) {
            yield* say(null, 'Tollgrim scrambles back up into the great bell and heaves on it. The bell swings round on its beam, the shutters in the east wall bang open, and the wind comes in sideways now, without a let-up.', { focus: bell });
            yield* say(null, '"I HEARD YOUR LITTLE BELL," he grates, from the dark inside. "I\'LL HEAR IT NEXT TIME, TOO."', { focus: bell });
        } else yield* say(null, "Tollgrim drags himself back into the bell, and this time his yellow eyes don't watch the clapper. They watch you. While you're near enough to ring it home, he won't show so much as a horn.", { focus: bell });
    },
    *tollDown(t) {
        const a = t.area;
        Music.play('silence');
        yield 40;
        yield* say(null, 'Tollgrim unravels into a ball of brass-coloured yarn and rolls, ringing faintly, into the dark under the great bell.');
        for (const s of a.ents) if (s.kind === 'door' && s.group === 'boss') s.shut = false;
        const br = a.rooms.find(r => r.key === '1,0');
        a.add(new Hoop(br.x + 15, br.y + 6));
        a.add(new Pickup((br.x + 4) * T, (br.y + 6) * T, { what: 'heartstitch', id: 'belfryHeart' }));
        Sfx.play('appear');
        Music.play('belfry');
    },
};

function initBelfryFoes() {
    ENEMY.clangor = { hp: 2, r: 8, tall: 24, yarn: THREAD.tess };
    ENEMY.tollgrim = { hp: 3, r: 7, tall: 16, yarn: THREAD.tess, flies: true, swims: true };
    const armour = (off) => paintSprite(24, 32, x => {
        const R = (c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
        /* the bell-helm (or the bare neck, knocked off) */
        if (!off) { x.fillStyle = '#b88a2a'; x.beginPath(); x.moveTo(5, 12); x.quadraticCurveTo(6, 1, 12, 0); x.quadraticCurveTo(18, 1, 19, 12); x.closePath(); x.fill(); R('#e8b04a', 7, 3, 3, 6); R('#f7d64a', 4, 11, 16, 2); R('#3e3a52', 11, 13, 2, 3); }
        else { R('#5a5264', 10, 8, 4, 5); R('#e8b04a', 2, 7, 7, 4); R('#b88a2a', 2, 10, 7, 1); }
        /* the armour */
        R('#8f96a0', 6, 15, 12, 10); R('#c4cbd4', 7, 16, 4, 6); R('#5a6270', 6, 24, 12, 2);
        R('#8f96a0', 2, 15, 4, 8); R('#8f96a0', 18, 15, 4, 8); R('#5a6270', 2, 22, 4, 2); R('#5a6270', 18, 22, 4, 2);
        R('#6a7280', 7, 26, 4, 6); R('#6a7280', 13, 26, 4, 6); R('#3e4852', 6, 30, 5, 2); R('#3e4852', 13, 30, 5, 2);
        R('#e8b04a', 11, 17, 2, 2);
    });
    ART.clangor = armour(false); ART.clangor_off = armour(true); SPR.clangor = ART.clangor; SPR.clangor_off = ART.clangor_off;
    const gar = (daze) => paintSprite(20, 20, x => {
        const R = (c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
        R('#7f7688', 4, 6, 12, 10); R('#a39aa8', 5, 7, 6, 4); R('#5a5264', 4, 15, 12, 2);
        R('#7f7688', 1, 3, 4, 6); R('#7f7688', 15, 3, 4, 6); R('#5a5264', 0, 2, 2, 3); R('#5a5264', 18, 2, 2, 3);   /* wings */
        R('#7f7688', 6, 2, 2, 4); R('#7f7688', 12, 2, 2, 4);   /* horns */
        if (daze) { R('#ffffff', 6, 9, 2, 1); R('#ffffff', 12, 9, 2, 1); R('#f7d64a', 3, 0, 1, 1); R('#f7d64a', 16, 1, 1, 1); R('#f7d64a', 9, 0, 1, 1); }
        else { R('#f7d64a', 6, 8, 2, 2); R('#f7d64a', 12, 8, 2, 2); }
        R('#3e3a52', 8, 12, 4, 2); R('#ffffff', 8, 12, 1, 1); R('#ffffff', 11, 12, 1, 1);
        R('#5a5264', 6, 16, 2, 3); R('#5a5264', 12, 16, 2, 3);
    });
    ART.toll = gar(false); ART.toll_daze = gar(true); SPR.toll = ART.toll; SPR.toll_daze = ART.toll_daze;
    ART.greatbell = paintSprite(68, 58, x => {
        x.fillStyle = '#6b4128'; x.fillRect(6, 0, 56, 6); x.fillStyle = '#9a6438'; x.fillRect(6, 0, 56, 2);
        x.fillStyle = '#8a6420'; x.fillRect(30, 4, 8, 6);
        x.fillStyle = '#b88a2a'; x.beginPath(); x.moveTo(6, 54); x.quadraticCurveTo(10, 10, 34, 8); x.quadraticCurveTo(58, 10, 62, 54); x.closePath(); x.fill();
        x.fillStyle = '#e8b04a'; x.beginPath(); x.moveTo(12, 50); x.quadraticCurveTo(16, 16, 34, 12); x.quadraticCurveTo(40, 13, 42, 16); x.lineTo(24, 50); x.closePath(); x.fill();
        x.fillStyle = '#f7d64a'; x.fillRect(2, 50, 64, 5); x.fillStyle = '#8a6420'; x.fillRect(2, 54, 64, 2);
        x.fillStyle = '#3e3a52'; x.fillRect(18, 46, 32, 6);
        x.fillStyle = '#8a6420'; for (let i = 0; i < 5; i++) x.fillRect(16 + i * 8, 30, 4, 2);
    });
    defSprite('clapper', ['................', '.......kk.......', '.......kgk......', '.......kgk......', '.......kgk......', '......kkgkk.....', '....kkGGGGGkk...', '...kGGgggggGGk..',
        '...kGgwwgggGGk..', '..kGGgwggggGGGk.', '..kGGggggggGGGk.', '..kGGGgggggGGGk.', '...kGGGGGGGGGk..', '....kkGGGGGkk...', '......kkkkk.....', '................'], { g: '#8f96a0', G: '#5a6270', w: '#c4cbd4' });
    ART.wallblock = paintSprite(16, 16, x => { x.fillStyle = '#a39aa8'; x.fillRect(0, 0, 16, 16); x.fillStyle = '#7f7688'; x.fillRect(0, 7, 16, 1); x.fillRect(7, 0, 1, 7); x.fillRect(11, 8, 1, 8); x.fillStyle = '#c4bccb'; x.fillRect(0, 0, 16, 1); x.fillStyle = '#e8b04a'; x.fillRect(0, 12, 16, 1); }, false);
    SPR.wallblock = ART.wallblock;
    ART.bellrope = paintSprite(10, 30, x => { x.fillStyle = '#c9925a'; x.fillRect(4, 0, 2, 22); x.fillStyle = '#c42b4a'; x.fillRect(2, 18, 6, 9); x.fillStyle = '#e8463c'; x.fillRect(3, 19, 2, 7); x.fillStyle = '#9a6438'; x.fillRect(4, 27, 2, 3); });
    ART.bellmould = paintSprite(32, 20, x => { x.fillStyle = '#6b4128'; x.fillRect(0, 12, 32, 8); x.fillStyle = '#9a6438'; x.fillRect(0, 12, 32, 2); x.fillStyle = '#b88a2a'; x.beginPath(); x.arc(9, 12, 7, Math.PI, 0); x.fill(); x.beginPath(); x.arc(23, 12, 5, Math.PI, 0); x.fill(); x.fillStyle = '#e8b04a'; x.fillRect(5, 7, 2, 4); });
    ART.sampler_tess = paintSprite(26, 20, x => { x.fillStyle = '#9a6438'; x.fillRect(0, 0, 26, 20); x.fillStyle = '#fbf3df'; x.fillRect(2, 2, 22, 16); x.fillStyle = '#e8b04a'; x.beginPath(); x.moveTo(5, 14); x.quadraticCurveTo(6, 5, 9, 5); x.quadraticCurveTo(12, 5, 13, 14); x.closePath(); x.fill(); x.fillRect(16, 5, 6, 2); x.fillRect(18, 5, 2, 9); });
    ART.tuningforks = paintSprite(16, 24, x => { x.fillStyle = '#6b4128'; x.fillRect(0, 18, 16, 6); for (let i = 0; i < 3; i++) { x.fillStyle = '#c4cbd4'; x.fillRect(2 + i * 5, 4 + i * 2, 1, 14 - i * 2); x.fillRect(4 + i * 5, 4 + i * 2, 1, 14 - i * 2); x.fillRect(2 + i * 5, 17, 3, 1); } });
    ART.note_paper = ART.note_paper || paintSprite(12, 12, x => { x.fillStyle = '#fbf3df'; x.fillRect(1, 1, 10, 10); x.fillStyle = '#9a8a6a'; for (let i = 3; i < 10; i += 2) x.fillRect(3, i, 6, 1); });
    ART.monogram_belfry = paintSprite(16, 10, x => { x.fillStyle = '#e8b04a'; x.fillRect(2, 2, 7, 1); x.fillRect(5, 2, 1, 6); x.fillStyle = '#b88a2a'; x.beginPath(); x.moveTo(10, 8); x.quadraticCurveTo(11, 2, 12.5, 2); x.quadraticCurveTo(14, 2, 15, 8); x.closePath(); x.fill(); }, false);
}
CONTENT_INIT.push(initBelfryFoes);
