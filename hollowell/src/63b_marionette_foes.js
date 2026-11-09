/* The Marionette Hall's performers. Captain Tin, the drum major (mini-boss): marches back and forth between two
   painted flats, about-turning at each; knock one down as he comes and he marches on, into the trapdoor behind it;
   dazed in the trap, his tin hat is off: hit him (3x). The Great Marionette (boss): dances on its strings over two
   great feet; walk your two little wooden Wrens (one rack) all the way round its feet and the strings tangle; it
   falls, and its head is there to knock (3x). Then the curtain. */

/* ---------------- Captain Tin ---------------- */
class Captain extends Enemy {
    constructor(tx, ty, p = {}) { super(tx, ty, Object.assign({ type: 'captain', hp: 3 }, p)); this.state = 'sleep'; this.st = 0; this.march = RIGHT; this.weightN = 3.5; }
    get arena() { return this.area.roomAt(this.hx, this.hy); }
    onTile() { return false; }
    feetOn(x, y) { return this.alive && this.state === 'march' && this.tx === x && this.ty === y; }
    hurtBox() { return this.alive && (this.state === 'dazed' || this.state === 'march') ? { x0: this.x - 8, x1: this.x + 8, y0: this.y - 22, y1: this.y + 3 } : null; }
    shutters(shut) { for (const s of this.area.ents) if (s.kind === 'door' && s.group === 'tin') s.shut = shut; }
    update() {
        if (!this.alive) return this.updateYarn();
        this.t++; if (this.flash > 0) this.flash--;
        const p = G.player, a = this.area, r = this.arena;
        if (this.state === 'sleep') {
            if (p.area === a && Cam.room === r && !Cam.busy && p.state === 'normal' && p.ty < r.y + r.h - 2) {
                this.state = 'march'; this.st = 0; this.shutters(true); Music.play('boss');
                if (!Progress.flag('marionette_tinAwake')) { Progress.set('marionette_tinAwake'); Script.run(MarionetteFoes.tinIntro(this)); }
            }
            return;
        }
        if (p.area !== a || (Cam.room !== r && !p.flying && !Cam.busy)) { this.reset(); return; }
        if (Script.blocking()) return;
        this.st++;
        if (this.state === 'march') {
            /* tile by tile: on to the next tile's middle, or about turn at anything standing there */
            const sp = 0.7 + (3 - this.hp) * 0.2;
            const gx = (this.tx + DX[this.march]) * T + 8, gy = this.ty * T + 10;
            const nx = this.tx + DX[this.march], k = a.kind(nx, this.ty);
            const blocked = k.solid || a.at(nx, this.ty) || a.blockers.some(b => b !== this && b.blocks(nx, this.ty, this));
            if (blocked && Math.abs(this.x - (this.tx * T + 8)) < sp + 0.5) { this.x = this.tx * T + 8; this.march = OPP[this.march]; Sfx.play('hitthing', 0.4); }
            else { this.x += DX[this.march] * sp; this.dir = this.march; this.anim++; }
            if (a.kind(this.tx, this.ty).pit && Math.abs(this.x - (this.tx * T + 8)) < 3) { this.state = 'fall'; this.st = 0; Sfx.play('fall'); G.shake = 6; Stats.count('boss:tin:fall'); }
            if (p.state === 'normal' && Math.abs(p.x - this.x) < 11 && Math.abs(p.y - this.y) < 8) p.hurt(1, this.x, this.y);
        } else if (this.state === 'fall') {
            if (this.st > 20) { this.state = 'dazed'; this.st = 0; }
        } else if (this.state === 'dazed') {
            if (this.st > 240) this.climbOut();
        }
    }
    climbOut() {
        this.state = 'march'; this.st = 0;
        this.x = this.hx * T + 8; this.y = this.hy * T + 10; this.march = this.march === RIGHT ? LEFT : RIGHT;
        Fx.dust(this.x, this.y); Sfx.play('land');
    }
    reset() {
        this.state = 'sleep'; this.st = 0; this.x = this.hx * T + 8; this.y = this.hy * T + 10;
        this.shutters(false); Music.play('marionette');
        for (const f of this.area.ents) if (f.kind === 'flat' && f.respring && f.down) { f.springT = 1; }
    }
    struck(by, dmg, dir) {
        if (!this.alive || this.flash > 0) return;
        if (this.state !== 'dazed') { Sfx.play('hitthing'); Fx.ring(this.x, this.y - 12); return; }
        this.hp--; this.flash = 30; G.hitstop = 8; G.shake = 6; Sfx.play('enemyhit');
        if (this.hp <= 0) return this.defeat();
        this.climbOut();
    }
    shoved() { }
    defeat() {
        this.alive = false; this.yarnT = 0; this.trace = [[this.hx, this.hy]];
        Sfx.play('unravel'); Fx.yarn(this.x, this.y - 10, THREAD.jory);
        Progress.set('marionette_tin');
        Script.run(MarionetteFoes.tinDown(this));
    }
    draw(cx, cy) {
        if (!this.alive) { if ((this.yarnT || 0) < 120) { const k = 1 - this.yarnT / 120; Gfx.circle(this.x - cx, this.y - cy - 4, Math.round(9 * k), THREAD.jory); } return; }
        const x = this.x - cx, y = this.y - cy;
        if (this.state === 'dazed' || this.state === 'fall') {
            const im = spr('captain_trap'); if (im) Gfx.img(this.flash > 0 && (this.flash >> 1) % 2 ? tinted(im, '#ffffff') : im, x - 10, y - 14);
            if ((this.t >> 3) % 2) Font.draw('*', x + 6, y - 22, '#f7d64a');
            return;
        }
        Gfx.alpha(0.25); Gfx.rect(x - 7, y + 1, 14, 3, PAL.ink); Gfx.alpha(1);
        const im = spr('captain_' + ((this.anim >> 4) % 2));
        if (im) Gfx.img(im, x - 10, y - 30, this.march === LEFT);
    }
}
SPAWN.captain = (x, y, p) => Progress.flag('marionette_tin') ? new Ent('none') : new Captain(x, y, p);

/* ---------------- The Great Marionette ---------------- */
class GreatMarionette extends Enemy {
    constructor(tx, ty, p = {}) {
        super(tx, ty, Object.assign({ type: 'greatmarionette', hp: 3 }, p));
        this.state = 'sleep'; this.st = 0; this.weightN = 9;
        /* its two great feet, on the stage below it */
        this.feet = [[tx - 2, ty + 2], [tx + 3, ty + 2]];
        this.tangled = [false, false];
        this.wind = new Map();      /* puppet uid -> [winding round foot 0, foot 1] */
        this.bags = [];
    }
    get arena() { return this.area.roomAt(this.hx, this.hy); }
    onTile() { return false; }
    feetOn() { return false; }
    blocks(x, y) { return this.alive && this.state !== 'down' && this.feet.some(([fx, fy]) => fx === x && fy === y); }
    hurtBox() { if (!this.alive || this.state !== 'down') return null; const hx = (this.hx + 0.5) * T, hy = (this.hy + 4) * T; return { x0: hx - 14, x1: hx + 14, y0: hy - 12, y1: hy + 8 }; }
    shutters(shut) { for (const s of this.area.ents) if (s.kind === 'door' && s.group === 'boss') s.shut = shut; }
    puppets() { return this.area.ents.filter(e => e.kind === 'puppet' && e.group === 'boss' && !e.removed); }
    update() {
        if (!this.alive) return this.updateYarn();
        this.t++; if (this.flash > 0) this.flash--;
        const p = G.player, a = this.area, r = this.arena;
        if (this.state === 'sleep') {
            if (p.area === a && Cam.room === r && !Cam.busy && p.state === 'normal' && p.ty < r.y + r.h - 1) {
                this.state = 'dance'; this.st = 0; this.shutters(true); Music.play('boss');
                if (!Progress.flag('marionette_gmAwake')) { Progress.set('marionette_gmAwake'); Script.run(MarionetteFoes.gmIntro(this)); }
            }
            return;
        }
        if (p.area !== a || (Cam.room !== r && !p.flying && !Cam.busy)) { this.state = 'sleep'; this.shutters(false); this.untangle(); Music.play('marionette'); return; }
        if (Script.blocking()) return;
        this.st++;
        this.updateBags(p);
        if (this.state === 'dance') {
            this.windUp();
            /* sandbags drop where Wren stands, now and then (a shadow first) */
            if (this.st > 360 && this.st % (this.hp === 1 ? 180 : this.hp === 2 ? 240 : 300) === 100 && p.state === 'normal') this.bags.push({ x: p.x, y: p.y, t: 0 });
            if (this.tangled[0] && this.tangled[1]) { this.state = 'down'; this.st = 0; G.shake = 14; Sfx.play('rumble'); Sfx.play('hitthing'); Stats.count('boss:gm:fall'); }
        } else if (this.state === 'down') {
            if (this.st > 420) this.rise();
        }
    }
    /* how far each puppet has gone round each foot: a full lap ties that foot's string */
    windUp() {
        for (const e of this.puppets()) {
            const cx = e.px + 8, cy = e.py + 8;
            let w = this.wind.get(e.uid);
            if (!w) { w = { last: this.feet.map(([fx, fy]) => Math.atan2(cy - (fy * T + 8), cx - (fx * T + 8))), sum: [0, 0] }; this.wind.set(e.uid, w); }
            if (e.ret && e.ret.state === 'home') { w.sum = [0, 0]; }
            this.feet.forEach(([fx, fy], i) => {
                const ang = Math.atan2(cy - (fy * T + 8), cx - (fx * T + 8));
                let d = ang - w.last[i]; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
                w.sum[i] += d; w.last[i] = ang;
                if (!this.tangled[i] && Math.abs(w.sum[i]) > Math.PI * 2 - 0.2) {
                    this.tangled[i] = true; Sfx.play('twang'); G.shake = 4;
                    Fx.text(fx * T + 8, fy * T - 10, 'tangled!', '#f7d64a');
                }
            });
        }
    }
    untangle() { this.tangled = [false, false]; this.wind.clear(); }
    updateBags(p) {
        for (const b of this.bags) {
            b.t++;
            if (b.t === 60) { Sfx.play('land'); Fx.dust(b.x, b.y); if (p.state === 'normal' && Math.abs(p.x - b.x) < 10 && Math.abs(p.y - b.y) < 9) { const hp = Inv.hp; p.hurt(1, b.x, b.y - 4); if (Inv.hp < hp && Crossbar.ctl) Crossbar.release(p); } }
        }
        this.bags = this.bags.filter(b => b.t < 80);
    }
    rise() {
        this.state = 'dance'; this.st = 0; this.untangle();
        for (const e of this.puppets()) if (!e.heldBy && e.ret && e.ret.state !== 'home') { e.ret.state = 'returning'; e.ret.timer = 0; }
        Sfx.play('rumble'); G.shake = 6;
    }
    struck(by, dmg, dir) {
        if (!this.alive || this.state !== 'down' || this.flash > 0) return;
        this.hp--; this.flash = 30; G.hitstop = 10; G.shake = 10; Sfx.play('enemyhit');
        if (this.hp <= 0) return this.defeat();
        this.rise();
    }
    shoved() { }
    defeat() {
        this.alive = false; this.yarnT = 0; this.trace = [[this.hx, this.hy]]; this.bags = [];
        if (Crossbar.ctl) Crossbar.release(G.player);
        Sfx.play('unravel');
        Script.run(MarionetteFoes.curtain(this));
    }
    draw(cx, cy) { this.drawBody(cx, cy); }
    /* the sandbags: drawn over everything (src: TOOLS._gmBags), so their shadows show where they'll land */
    drawBags(cx, cy) {
        for (const b of this.bags) {
            const k = Math.min(1, b.t / 60);
            Gfx.alpha(0.2 + 0.3 * k); Gfx.circle(b.x - cx, b.y - cy + 2, Math.round(4 + 4 * k), PAL.ink); Gfx.alpha(1);
            if (b.t < 60) { const y = b.y - cy - 120 * (1 - k); Gfx.line(b.x - cx, y - 40, b.x - cx, y - 6, '#cfc6b8'); Gfx.rect(b.x - cx - 4, y - 8, 8, 9, '#a88a5a'); }
            else Gfx.rect(b.x - cx - 4, b.y - cy - 6, 8, 7, '#a88a5a');
        }
    }
    drawBody(cx, cy) {
        if (!this.alive) return;
        const bx = this.hx * T - cx, by = this.hy * T - cy, sway = this.state === 'dance' ? Math.round(Math.sin(this.t / 20) * 3) : 0;
        if (this.state === 'down') {
            const im = ART.gm_down; if (im) Gfx.img(this.flash > 0 && (this.flash >> 1) % 2 ? tinted(im, '#ffffff') : im, Math.round((this.hx + 0.5) * T - cx - im.width / 2), (this.hy + 2) * T - cy);
            return;
        }
        /* a great wooden you, hanging over its two feet: legs down to them, strings up into the dark */
        const [[f0x, f0y], [f1x, f1y]] = this.feet;
        const mx = ((f0x + f1x) / 2 + 0.5) * T - cx + sway, top = f0y * T - cy - 74;
        const im = ART.gm_body;
        for (const [i, [fx, fy]] of this.feet.entries()) {
            const sx = fx * T - cx + 8, sy = fy * T - cy + 6;
            const hip = mx + (i ? 10 : -10);
            for (let o = -1; o <= 1; o++) Gfx.line(hip + o, top + 56, sx + o, sy - 6, o ? '#8a6040' : '#c49a62');
            Gfx.line(sx, sy - 8, sx + sway, -10, this.tangled[i] ? '#f7d64a' : '#cfc6b8');
            Gfx.img(spr('gm_foot'), sx - 8, sy - 10);
        }
        if (im) Gfx.img(this.flash > 0 && (this.flash >> 1) % 2 ? tinted(im, '#ffffff') : im, Math.round(mx - im.width / 2), top);
        Gfx.line(mx - 20, top + 24, mx - 20 + sway, -10, '#cfc6b8'); Gfx.line(mx + 20, top + 24, mx + 20 + sway, -10, '#cfc6b8'); Gfx.line(mx, top, mx, -10, '#cfc6b8');
        /* the puppets' strings round its feet: where each little Wren has been, faintly */
        for (const e of this.puppets()) {
            const w = this.wind.get(e.uid); if (!w) continue;
            this.feet.forEach(([fx, fy], i) => { const f = Math.min(1, Math.abs(w.sum[i]) / (Math.PI * 2)); if (f > 0.2) { Gfx.alpha(0.6); Gfx.circle(fx * T - cx + 8, fy * T - cy + 8, Math.round(6 + 6 * f), THREAD.jory); Gfx.alpha(1); } });
        }
    }
}
TOOLS._gmBags = { draw(cx, cy) { const a = G.map; if (!a || a.id !== 'marionette') return; for (const e of a.ents) if (e instanceof GreatMarionette) e.drawBags(cx, cy); } };
SPAWN.marionette = (x, y, p) => Progress.flag('marionette_boss') ? new Ent('none') : new GreatMarionette(x, y, p);

const MarionetteFoes = {
    *tinIntro(c) {
        yield 20;
        yield* say(null, 'A drum roll from nowhere. A toy soldier taller than your dad marches out of the wings, a drum on his chest and a feather in his hat. "LEFT! RIGHT! LEFT! RIGHT!" He marches between two painted flats, and about-turns at each.');
    },
    *tinDown(c) {
        Music.play('silence');
        yield 30;
        yield* say(null, 'Captain Tin salutes, very stiffly, falls over backwards, and unravels into a coil of crimson yarn that drains away through a crack in the boards.');
        c.shutters(false); Sfx.play('appear'); Music.play('marionette');
    },
    *gmIntro(g) {
        yield 20;
        yield* say(null, 'The curtain rises on its own. Centre stage, on strings that go up and up into the dark, a marionette three times your height begins to dance. It has your scarf. It has your stick. It has your face.');
        yield* say(null, 'At the front of the stage, a crossbar on a stand, and two little wooden Wrens on its strings.');
    },
    *curtain(g) {
        const a = g.area;
        Music.play('silence');
        yield 40;
        yield* say(null, 'The Great Marionette folds up, joint by joint, and crashes to the boards. Then the curtain comes down on it, WHUMP, in a great red heap.');
        yield 40;
        yield* say(null, 'Silence. Then, from somewhere above, a small cross voice: "Oh, BOTHER."');
        yield* say(null, "You look up. Up in the flies, at the end of a dozen strings, hanging from a bosun's chair with a crossbar the size of a door in his hands, is Jory. Jory the toymaker. Jory who sold you a spinning top for your sixth birthday.");
        yield* say('jory', "Ah. Hello, {name}. This is... awkward. I'd prepared a much better ending. There were going to be fireworks.");
        yield* Reveal1.run(g);
    },
};

function initMarionetteFoes() {
    ENEMY.captain = { hp: 3, r: 8, tall: 30, yarn: THREAD.jory, harmless: true };
    ENEMY.greatmarionette = { hp: 3, r: 12, tall: 40, yarn: THREAD.jory, harmless: true, flies: true, swims: true };
    const cp = { r: '#d6304e', R: '#9a1e36', b: '#2e3a7a', B: '#1e2a5a', g: '#f7d64a', G: '#c8a83a', s: '#f0c8a0', w: '#fbf6ea', f: '#fbf6ea' };
    const capt = leg => ['.........ff.........', '........fwwf........', '.......kbbbbk.......', '......kbbbbbbk......', '......kbbbbbbk......', '......kbbbbbbk......', '.....kkggggggkk.....', '......kssssssk......', '......kswsswsk......', '......kssssssk......', '.......kssssk.......', '.....kkrrrrrrkk.....', '....krRrggggrRrk....', '...ksrrrggggrrrsk...', '...kskrrggggrrksk...', '...kk.krrrrrrk.kk...', '.....kwwwwwwwwk.....', '.....kwgwgwgwgk.....', '.....kwwwwwwwwk.....', '......kbbbbbbk......', '......kbBkkbBk......', '......kbBk' + leg + 'Bk......'.slice(0, 20), '......kkkk.kkkk.....', '....................'];
    defSprite('captain_0', capt('kbB'), cp); defSprite('captain_1', capt('.bB'), cp);
    defSprite('captain_trap', ['....................', '....................', '.......kbbbbk.......', '......kbbbbbbk......', '.....kkggggggkk.....', '......kssssssk......', '......ksxssxsk......', '......kssssssk......', '....kkrrrrrrrrkk....', '...krrrrggggrrrrk...', '..kkkkkkkkkkkkkkkk..', '..k..............k..', '..kkkkkkkkkkkkkkkk..', '....................'], Object.assign({ x: '#2a1f2d' }, cp));
    const gm = { w: '#e6c08a', W: '#c49a62', d: '#8a6040', r: '#e8463c', R: '#a82a26', e: '#2a1f2d', h: '#8a5a3a', s: '#9a6438' };
    ART.gm_body = paintSprite(64, 60, x => {
        const R = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
        /* a jointed wooden girl in a red scarf: you, three times over */
        R('#8a5a3a', 18, 0, 28, 8); R('#6b4128', 16, 6, 32, 6);
        R('#e6c08a', 20, 6, 24, 20); R('#c49a62', 20, 24, 24, 2); R('#2a1f2d', 25, 13, 3, 4); R('#2a1f2d', 36, 13, 3, 4); R('#fbf6ea', 26, 13, 1, 1); R('#fbf6ea', 37, 13, 1, 1); R('#a8442a', 29, 21, 6, 2);
        R('#e8463c', 14, 26, 36, 6); R('#a82a26', 14, 31, 36, 2); R('#e8463c', 42, 30, 6, 12);
        R('#e8b04a', 16, 32, 32, 18); R('#c8903a', 16, 46, 32, 4); R('#6b4128', 30, 34, 4, 14);
        R('#e6c08a', 6, 30, 8, 6); R('#e6c08a', 50, 30, 8, 6); R('#c49a62', 4, 36, 6, 12); R('#c49a62', 54, 36, 6, 12);
        R('#9a6438', 57, 18, 3, 34); R('#6b4128', 57, 18, 3, 2);
        R('#4f6aa8', 18, 50, 28, 8); R('#2e3a7a', 18, 56, 28, 2);
        for (const [a, b] of [[12, 34], [52, 34], [32, 52]]) { R('#2a1f2d', a, b, 2, 2); }
    });
    ART.gm_down = paintSprite(96, 40, x => {
        const R = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
        R('#8a5a3a', 4, 8, 20, 6); R('#e6c08a', 6, 12, 20, 18); R('#2a1f2d', 10, 18, 4, 1); R('#2a1f2d', 18, 18, 4, 1); R('#a8442a', 12, 25, 6, 2);
        R('#e8463c', 26, 14, 20, 8); R('#e8b04a', 44, 12, 26, 16); R('#4f6aa8', 68, 14, 18, 12); R('#c49a62', 84, 16, 10, 6); R('#c49a62', 40, 28, 14, 6);
        R('#9a6438', 20, 34, 60, 3); R('#cfc6b8', 30, 0, 1, 14); R('#cfc6b8', 60, 0, 1, 12);
    });
    defSprite('gm_body_old', ['..........kkkkkkkkkkkk..........', '.........khhhhhhhhhhhhk.........', '........khhhhhhhhhhhhhhk........', '........khwwwwwwwwwwwwhk........', '........kwwwwwwwwwwwwwwk........', '........kwwekwwwwwwkewwk........', '........kwwwwwwwwwwwwwwk........', '........kwwwwwwRRwwwwwwk........', '.........kwwwwwwwwwwwwk.........', '..........kkkkwwwwkkkkk.........', '......kkkkrrrrrrrrrrrrkkkk......', '.....krrrrrrrrrrrrrrrrrrrrk.....', '....krRrrrrrrrrrrrrrrrrrrRrk....', '...kwkrrrrrrrrrrrrrrrrrrrrkwk...', '...kwkrrrrrrrrrrrrrrrrrrrrkwk...', '...kwk.krrrrrrrrrrrrrrrrk.kwk...', '...kk..kRRRRRRRRRRRRRRRRk..kk...', '.......kddddddddddddddddk.......', '.......kd..............dk.......', '.......kd..............dk.......', '.......kd..............dk.......', '.......kd..............dk.......', '.......kW..............Wk.......', '.......kk..............kk.......'], gm);
    defSprite('gm_foot', ['................', '................', '................', '................', '................', '................', '................', '...kkkkkkkkkk...', '..kddddddddddk..', '..kdWWWWWWWWdk..', '..kdddddddddddk.'.slice(0, 16), '..kkkkkkkkkkkk..', '................', '................', '................', '................'], gm);
    defSprite('gm_down', ['................................................................', '..........kkkkkkkkkkkk..........................................', '.........khhhhhhhhhhhhk...kkkkkkkkkkkkkkkkkkkkkkkkkkkk...........', '........khwwwwwwwwwwwwhk.krrrrrrrrrrrrrrrrrrrrrrrrrrrrk...........', '........kwwxwwwwwwxwwwwkkrrrrrrrrrrrrrrrrrrrrrrrrrrrrrk..kkkkkk...', '........kwwwwwwwwwwwwwwkrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrkkkddddddk..', '.........kwwwwwRRwwwwwk.kRRRRRRRRRRRRRRRRRRRRRRRRRRRRk.kddddddk..', '..........kkkkkkkkkkkk...kkkkkkkkkkkkkkkkkkkkkkkkkkkkk..kkkkkkk..', '................................................................'], Object.assign({ x: '#2a1f2d' }, gm));
    ART.flat_red = null;
    defSprite('flat_red', ['kkkkkkkkkkkkkkkk', 'krrrrrrrrrrrrrrk', 'krRrrrrrrrrrrRrk', 'krrrrrrrrrrrrrrk', 'krrrrRrrrrrRrrrk', 'krrrrrrrrrrrrrrk', 'kRrrrrrrrrrrrrrk', 'krrrrrrRrrrrrrrk', 'krrrrrrrrrrrrrrk', 'krrRrrrrrrrrrRrk', 'krrrrrrrrrrrrrrk', 'kggggggggggggggk', 'kccccccccccccccc', 'kccccccccccccccc', 'kkkkkkkkkkkkkkkk', '................'], { r: '#9a1e36', R: '#7a1428', g: '#f7d64a', c: '#c8a070' });
    const furn = (w, h, fn) => paintSprite(w, h, x => fn((c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); }));
    ART.poster = furn(16, 30, R => { R('#c8a070', 2, 0, 12, 22); R('#fbf6ea', 3, 1, 10, 20); R('#e8463c', 5, 6, 6, 10); R('#8a5a3a', 6, 3, 4, 4); R('#9a6438', 11, 5, 1, 12); R('#5a3a2a', 7, 22, 2, 8); });
    ART.booth = furn(32, 28, R => { R('#9a1e36', 0, 6, 32, 22); R('#f7d64a', 0, 6, 32, 2); R('#3a0a16', 6, 10, 20, 10); R('#fbf6ea', 8, 12, 16, 6); R('#c8a070', 0, 24, 32, 4); R('#f7d64a', 10, 0, 12, 6); R('#9a1e36', 11, 1, 10, 4); });
    ART.seats = furn(96, 18, R => { for (let i = 0; i < 6; i++) { R('#5a1428', i * 16 + 1, 2, 14, 14); R('#c42b4a', i * 16 + 2, 3, 12, 8); R('#9a1e36', i * 16 + 2, 11, 12, 4); } R('#3a0a16', 0, 16, 96, 2); });
    ART.drum = furn(16, 18, R => { R('#d6304e', 1, 4, 14, 12); R('#fbf6ea', 1, 2, 14, 4); R('#f7d64a', 1, 8, 14, 1); R('#f7d64a', 1, 12, 14, 1); R('#9a6438', 3, 0, 1, 4); R('#9a6438', 12, 0, 1, 4); });
    ART.prompter = furn(16, 22, R => { R('#3a2a30', 0, 6, 16, 16); R('#c8a070', 0, 4, 16, 3); R('#fff4c0', 4, 10, 8, 4); });
    ART.set_tidy = furn(64, 24, R => { R('#efe4cc', 0, 4, 64, 20); R('#5fb7a8', 0, 0, 64, 6); R('#3c8a80', 0, 6, 64, 1); for (let i = 4; i < 64; i += 16) { R('#9a3a4a', i, 10, 8, 10); } R('#c8a070', 28, 8, 8, 16); R('#f7d64a', 31, 2, 2, 4); });
    ART.mirror = furn(16, 26, R => { R('#c8a070', 0, 0, 16, 22); R('#cfe6f4', 2, 2, 12, 16); R('#fff4c0', 0, 0, 2, 2); R('#fff4c0', 14, 0, 2, 2); R('#fff4c0', 0, 20, 2, 2); R('#fff4c0', 14, 20, 2, 2); R('#5a3a2a', 6, 22, 4, 4); });
    ART.bench = furn(32, 22, R => { R('#9a6438', 0, 6, 32, 6); R('#6b4128', 2, 12, 3, 10); R('#6b4128', 27, 12, 3, 10); R('#c8c0b8', 6, 2, 5, 4); R('#e6c08a', 18, 1, 8, 5); R('#2a1f2d', 20, 3, 1, 1); R('#2a1f2d', 23, 3, 1, 1); });
    ART.puppets_hung = furn(48, 30, R => { R('#6b4128', 0, 0, 48, 2); const c = ['#5fb7a8', '#e0913a', '#4f9be0', '#7f7688', '#8a6a4a']; for (let i = 0; i < 5; i++) { R('#cfc6b8', 4 + i * 9, 2, 1, 6); R(c[i], 1 + i * 9, 8, 7, 12); R('#e6c08a', 2 + i * 9, 5, 5, 4); } });
    ART.monogram_marionette = paintSprite(16, 10, x => { x.fillStyle = '#d6304e'; x.fillRect(8, 1, 2, 6); x.fillRect(4, 6, 5, 2); x.fillRect(3, 4, 2, 3); x.fillStyle = '#f7d64a'; x.fillRect(6, 0, 6, 1); x.fillRect(11, 0, 1, 3); }, false);
}
CONTENT_INIT.push(initMarionetteFoes);
