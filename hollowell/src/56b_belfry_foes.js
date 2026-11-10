/* The Belfry's big ones, and its stones. Clangor: a suit of armour with a bell for a head; nothing Wren
   swings dents it, but every so often it rings itself, and anything out of place nearby snaps home through
   it. Tollgrim: a gargoyle living in the great bell; when the gust blows the clapper out, he leans out of
   the bell's mouth to spit gravel; ring the Recall Bell then, and the clapper slams home into him. */

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
        super(tx, ty, Object.assign({ type: 'clangor', hp: 3 }, p));
        this.state = 'sleep'; this.st = 0; this.weightN = 3.5;
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
                if ((this.st > 200 || (near && this.st > 90))) { this.state = 'windup'; this.st = 0; Sfx.play('twang'); }
                break;
            }
            case 'windup':
                if (this.st > 40) {
                    this.state = 'ring'; this.st = 0;
                    Bells.ring(a, this.x, this.y - 8, 6);
                    G.shake = 6;
                    if (p.state === 'normal' && dist(p.x, p.y, this.x, this.y) < 26) p.hurt(1, this.x, this.y);
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
        this.state = 'stunned'; this.st = 0;
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

class Tollgrim extends Enemy {
    constructor(tx, ty, p = {}) {
        super(tx, ty, Object.assign({ type: 'tollgrim', hp: 3 }, p));
        this.state = 'sleep'; this.st = 0; this.weightN = 2.5; this.hidden = true;
        this.mouth = [tx - 1, ty + 1];       /* where he leans out */
        this.spits = [];
    }
    onTile(x, y) { return this.alive && this.state === 'peek' && x === this.mouth[0] && y === this.mouth[1]; }
    feetOn() { return false; }
    hurtBox() { return this.alive && (this.state === 'stunned') ? { x0: this.x - 8, x1: this.x + 8, y0: this.y - 16, y1: this.y + 2 } : null; }
    update() {
        if (!this.alive) return this.updateYarn();
        this.t++; if (this.flash > 0) this.flash--;
        const p = G.player, a = this.area;
        this.updateSpits();
        if (this.state === 'sleep') {
            const r = a.roomAt(this.hx, this.hy);
            if (p.area === a && Cam.room === r && !Cam.busy && p.ty < r.y + r.h - 1) {
                this.state = 'hide'; this.st = 0;
                for (const s of a.ents) if (s.kind === 'door' && s.group === 'boss') s.shut = true;
                Progress.set('belfry_tollAwake');
                Music.play(bossSong('belfry'));
                Script.run(BelfryFoes.tollIntro(this));
            }
            return;
        }
        if (Script.blocking()) return;
        this.st++;
        const clap = a.find('clapper');
        const out = clap && clap.ret && clap.ret.state !== 'home';
        const [mx, my] = this.mouth;
        switch (this.state) {
            case 'hide':
                this.hidden = true; this.x = this.hx * T + 8; this.y = this.hy * T + 10;
                /* the clapper's out of the way: lean out of the mouth */
                if (out && this.st > 30 && !a.at(mx, my) && !(p.tx === mx && p.ty === my)) { this.state = 'peek'; this.st = 0; this.x = mx * T + 8; this.y = my * T + 10; this.hidden = false; Sfx.play('blip'); }
                break;
            case 'peek':
                this.hidden = false;
                /* he comes out spitting: the first one straight away */
                if (this.st === 8 || this.st % (this.hp === 1 ? 50 : 75) === 30) this.spit(p);
                if (this.st > 330) { this.state = 'hide'; this.st = 0; }
                break;
            case 'stunned':
                this.hidden = false;
                if (this.kx || this.ky) { this.move(this.kx, this.ky); this.kx *= 0.85; this.ky *= 0.85; if (Math.abs(this.kx) + Math.abs(this.ky) < 0.3) this.kx = this.ky = 0; }
                if (this.st > 200) { this.state = 'hide'; this.st = 0; Fx.dust(this.x, this.y); }
                break;
        }
    }
    spit(p) {
        if (!p || p.state !== 'normal') return;
        const d = Math.hypot(p.x - this.x, p.y - this.y) || 1, sp = this.hp === 1 ? 2.2 : 1.7;
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
        this.state = 'stunned'; this.st = 0;
        /* knocked clean out of the bell: he lands dazed on the floor below it */
        const [mx, my] = this.mouth, a = this.area;
        const spot = [[mx, my + 2], [mx + 1, my + 2], [mx - 1, my + 2], [mx, my + 3]].find(([x, y]) => !a.at(x, y) && !a.kind(x, y).solid) || [mx, my + 2];
        this.x = spot[0] * T + 8; this.y = spot[1] * T + 10; this.kx = this.ky = 0;
        Fx.dust(this.x, this.y);
        G.shake = 12; G.hitstop = 8; Sfx.play('bell'); Sfx.play('hitthing');
        Stats.count('boss:tollgrim:slam');
    }
    struck(by, dmg, dir) {
        if (!this.alive || this.state !== 'stunned' || this.flash > 0) return;
        this.hp--; this.flash = 30; G.hitstop = 8; G.shake = 6; Sfx.play('enemyhit');
        if (this.hp <= 0) return this.defeat();
        this.state = 'hide'; this.st = 0;
    }
    defeat() {
        this.alive = false; this.yarnT = 0; this.trace = [[this.hx, this.hy]]; this.spits = [];
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
        if (this.state === 'hide' || this.state === 'sleep') { if ((this.t >> 4) % 4 === 0) { Gfx.rect(this.hx * T - cx + 2, this.hy * T - cy + 12, 2, 2, '#f7d64a'); Gfx.rect(this.hx * T - cx + 7, this.hy * T - cy + 12, 2, 2, '#f7d64a'); } return; }
        const im = spr(this.state === 'stunned' ? 'toll_daze' : 'toll');
        const img = this.flash > 0 && (this.flash >> 1) % 2 ? tinted(im, '#ffffff') : im;
        Gfx.img(img, this.x - cx - 10, this.y - cy - 20);
    }
}
SPAWN.tollgrim = (x, y, p) => Progress.flag('belfry_boss') ? new Ent('none') : new Tollgrim(x, y, p);

const BelfryFoes = {
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
        yield 20;
        yield* say(null, 'Something moves inside the great bell: two yellow eyes, and a voice like gravel in a bucket. "MINE. MY BELL. MY TOWER. GO AWAY OR I\'LL TOLL YOU."');
        yield* say(null, 'A cold draught blows down through the tower, and the great clapper sways.');
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
    ENEMY.clangor = { hp: 3, r: 8, tall: 24, yarn: THREAD.tess };
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
