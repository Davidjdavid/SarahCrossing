/* The Millrace's two big ones. The Snapjaw swims up and down its race; only what the water brings down on
   it hurts it (a crate drifting into it, or one going home into it). Old Grindle, the mill automaton bolted
   to the millpond's intake, gulps barrels that float to its mouth; full, it settles and its gear-heart
   shows, and Wren rides the raft up to strike it. */

class Snapjaw extends Enemy {
    constructor(tx, ty, p = {}) {
        super(tx, ty, Object.assign({ type: 'snapjaw', hp: 3 }, p));
        this.hx = tx; this.top = ty - 4; this.bot = ty + 2;
        this.state = 'sleep'; this.st = 0; this.vy = 0.55;
        this.weightN = 0.5;          /* anything floating that comes home into it bumps it */
    }
    onTile(x, y) { return this.alive && !this.hidden && x === this.hx && y === this.ty; }
    feetOn() { return false; }
    hurtBox() { return this.alive && !this.hidden ? { x0: this.x - 8, x1: this.x + 8, y0: this.y - 14, y1: this.y + 2 } : null; }
    update() {
        if (!this.alive) return this.updateYarn();
        this.t++; if (this.flash > 0) this.flash--;
        const p = G.player, a = this.area;
        if (this.state === 'sleep') {
            const r = a.roomAt(this.hx, this.hy);
            if (p.area === a && Cam.room === r && !Cam.busy && p.tx > r.x) {
                this.state = 'swim'; this.st = 0;
                for (const s of a.ents) if (s.kind === 'door' && s.group === 'sj') s.shut = true;
                Music.play('boss');
                Script.run(MillFoes.snapIntro(this));
            }
            return;
        }
        if (Script.blocking()) return;
        this.st++;
        switch (this.state) {
            case 'swim': {
                this.hidden = false;
                /* Wren on the bank of the race: it comes for her */
                const onBank = p.state === 'normal' && p.tx === this.hx - 1;
                if (onBank && Math.abs(p.y - this.y) > 4) this.vy = sign(p.y - this.y) * 0.8;
                else if (!onBank) this.vy = sign(this.vy || 1) * 0.55;
                const ny = this.y + this.vy;
                if (tileOf(ny) < this.top || tileOf(ny) > this.bot || this.blockedAt(tileOf(ny + sign(this.vy) * 6))) this.vy = -this.vy;
                else this.y = ny;
                this.dir = this.vy < 0 ? UP : DOWN;
                /* Wren on the bank right beside it: it rears up to bite */
                if (p.state === 'normal' && p.tx === this.hx - 1 && Math.abs(p.y - this.y) < 14 && this.st > 20) { this.state = 'rear'; this.st = 0; break; }
                /* something floating close in the race: it ducks under (unless it's busy biting) */
                if (this.floatNear()) { this.state = 'duck'; this.st = 0; this.hidden = true; Fx.splash(this.x, this.y - 2); }
                break;
            }
            case 'duck':
                this.hidden = true;
                if (this.st > 50 && !this.floatNear()) { this.state = 'swim'; this.st = 0; this.hidden = false; }
                break;
            case 'rear':
                if (this.st === 30) {
                    Sfx.play('splash'); Fx.splash(this.x - 10, this.y - 4);
                    if (p.state === 'normal' && p.tx === this.hx - 1 && Math.abs(p.y - this.y) < 16) p.hurt(1, this.x, this.y);
                }
                if (this.st > 70) {
                    /* still there? it goes for her again (and keeps its eyes on her, not the water) */
                    if (p.state === 'normal' && p.tx === this.hx - 1 && Math.abs(p.y - this.y) < 14) this.st = 0;
                    else { this.state = 'swim'; this.st = 0; }
                }
                break;
            case 'dive':
                this.hidden = true;
                if (this.st > 100) { this.state = 'swim'; this.st = 0; this.hidden = false; }
                break;
        }
    }
    floatNear() {
        for (let k = -2; k <= 2; k++) { if (!k) continue; const o = this.area.at(this.hx, this.ty + k); if (o && o.floats) return true; }
        return false;
    }
    /* is a floating thing sitting in the race just there? */
    blockedAt(ty) { const o = this.area.at(this.hx, ty); return o && o.floats; }
    /* a crate brought down the race into it (drifting or going home) */
    bonk(by, d) {
        if (!this.alive || this.hidden || this.state === 'dive') return;
        this.hp--; this.flash = 30; G.hitstop = 6; G.shake = 6;
        Sfx.play('enemyhit'); Sfx.play('hitthing');
        Stats.count('boss:snapjaw:bonk');
        if (this.hp <= 0) return this.defeat();
        this.state = 'dive'; this.st = 0; this.hidden = true;
        UI.toast(['Bonk! The Snapjaw goes under, rattled.', 'Bonk! It thrashes and dives.', ''][2 - this.hp] || 'Bonk!', 90);
    }
    shoved(d, pace, by) { this.bonk(by, d); }
    struck(by, dmg, dir, shard) {
        if (!this.alive || this.hidden) return;
        Sfx.play('hitthing'); Fx.ring(this.x, this.y - 8);
        if (!Progress.flag('sj_hint')) { Progress.set('sj_hint'); UI.toast("It's all scales. Whatever comes down the race at it would hit harder.", 200); }
    }
    defeat() {
        this.alive = false; this.yarnT = 0; this.trace = [[this.hx, this.hy]];
        Sfx.play('unravel'); Fx.yarn(this.x, this.y - 8, THREAD.ambrose);
        Progress.set('millrace_snapjaw');
        for (const s of this.area.ents) if (s.kind === 'door' && s.group === 'sj') s.shut = false;
        Script.run(MillFoes.snapDown(this));
    }
    draw(cx, cy) {
        if (!this.alive) {
            if ((this.yarnT || 0) < 120) { this.yarnT = (this.yarnT || 0) + 1; const k = 1 - this.yarnT / 120; Gfx.circle(this.x - cx, this.y - cy - 4, Math.round(8 * k), THREAD.ambrose); }
            return;
        }
        const x = this.x - cx, y = this.y - cy;
        if (this.hidden) { if ((this.t >> 3) % 2) Gfx.img(spr('snap_ripple'), x - 8, y - 12); return; }
        const im = spr(this.state === 'rear' && this.st > 10 ? 'snapjaw_open' : 'snapjaw');
        const img = this.flash > 0 && (this.flash >> 1) % 2 ? tinted(im, '#ffffff') : im;
        Gfx.img(img, x - 12, y - 22 - (this.state === 'rear' ? Math.min(6, this.st >> 2) : 0), this.dir === DOWN);
        if (this.state === 'rear' && !Progress.flag('sj_rear')) { Progress.set('sj_rear'); UI.toast("It rears up out of the race to bite, and forgets to watch the water.", 200); }
        Gfx.alpha(0.5); Gfx.rect(x - 10, y - 2, 20, 2, '#ffffff'); Gfx.alpha(1);
    }
}
SPAWN.snapjaw = (x, y, p) => Progress.flag('millrace_snapjaw') ? new Ent('none') : new Snapjaw(x, y, p);

/* Old Grindle: two tiles wide at its intake; barrels that float to the mouth tiles under it get gulped */
class Grindle extends GridThing {
    constructor(tx, ty, p = {}) {
        super('grindle', tx, ty, Object.assign({ weight: WEIGHT.fixed, fixed: true, marked: false }, p));
        this.hp = 3; this.state = 'sleep'; this.st = 0; this.full = 0; this.need = 2; this.flash = 0;
        this.spits = []; this.alive = true;
    }
    onAdd(area) { area.place(this, this.tx, this.ty); area.place(this, this.tx + 1, this.ty); }
    get mouths() { return [[this.tx, this.ty + 1], [this.tx + 1, this.ty + 1]]; }
    hurtBox() { return this.alive ? { x0: this.tx * T, x1: this.tx * T + 32, y0: this.ty * T - 12, y1: this.ty * T + 16 } : null; }
    tick() {
        const p = G.player, a = this.area;
        if (!this.alive) return;
        if (this.flash > 0) this.flash--;
        if (this.state === 'sleep') {
            const r = a.roomAt(this.tx, this.ty);
            if (p.area === a && Cam.room === r && !Cam.busy && p.ty < r.y + r.h - 1) {     /* (in off the doorstep, so the shutter doesn't close on Wren) */
                this.state = 'home'; this.st = 0;
                for (const s of a.ents) if (s.kind === 'door' && s.group === 'boss') s.shut = true;
                Music.play('boss');
                Script.run(MillFoes.grindleIntro(this));
            }
            return;
        }
        this.updateSpits();
        if (Script.blocking()) return;
        this.st++;
        const angry = this.hp === 1;
        switch (this.state) {
            case 'home': {
                /* gulp whatever floated to its mouth */
                for (const [mx, my] of this.mouths) {
                    const o = a.at(mx, my);
                    if (o && o.kind === 'barrel' && !o.mv) this.gulp(o);
                }
                if (this.state !== 'home') break;
                /* Wren on the water at its mouth: it snaps */
                if (p.state === 'normal' && p.ride && this.mouths.some(([mx, my]) => p.tx === mx && p.ty === my)) { this.state = 'chomp'; this.st = 0; break; }
                /* otherwise it spits at her */
                if (this.st > (angry ? 80 : 130) && p.state === 'normal') { this.spit(p); this.st = 0; }
                break;
            }
            case 'chomp':
                if (this.st === 26) {
                    Sfx.play('boss'); G.shake = 6;
                    if (p.state === 'normal' && this.mouths.some(([mx, my]) => p.tx === mx && p.ty === my)) { p.hurt(1, this.tx * T + 16, this.ty * T); p.ride = null; p.startFall('water'); }
                }
                if (this.st > 50) { this.state = 'home'; this.st = 0; }
                break;
            case 'full':
                /* settled at its mark, gear-heart showing */
                if (this.st > 1200) this.spitOut();
                break;
            case 'hurt':
                if (this.st > 50) this.spitOut();
                break;
        }
    }
    gulp(o) {
        this.area.unplace(o, o.tx, o.ty);
        o.swallowed = true; o.tiedOff = true; o.hidden = true;
        this.full++; Sfx.play('pop'); Sfx.play('splash'); G.shake = 3;
        Stats.count('boss:grindle:gulp');
        if (this.full >= this.need) {
            this.state = 'full'; this.st = 0; Sfx.play('rumble');
            UI.toast('Old Grindle gulps, shudders, and settles low in the water. Something glints on its back.', 160);
        }
    }
    /* everything it swallowed goes home */
    spitOut() {
        for (const o of this.area.ents) if (o.swallowed) {
            o.swallowed = false; o.tiedOff = false; o.hidden = false;
            Return.sendHome(o);
        }
        this.full = 0; this.state = 'home'; this.st = 0;
    }
    spit(p) {
        const sx = this.tx * T + 16, sy = this.ty * T + 6;
        const d = Math.hypot(p.x - sx, p.y - sy) || 1, sp = this.hp === 1 ? 2.2 : 1.7;
        this.spits.push({ x: sx, y: sy, vx: (p.x - sx) / d * sp, vy: (p.y - sy) / d * sp, t: 0 });
        Sfx.play('splash');
    }
    updateSpits() {
        const p = G.player;
        for (const s of this.spits) {
            s.t++; s.x += s.vx; s.y += s.vy;
            if (p.state === 'normal' && Math.abs(p.x - s.x) < 6 && Math.abs(p.y - 4 - s.y) < 7) { p.hurt(1, s.x - s.vx * 4, s.y - s.vy * 4); s.done = true; Fx.splash(s.x, s.y); }
            const k = this.area.kind(tileOf(s.x), tileOf(s.y));
            if (s.t > 200 || k.solid) { s.done = true; Fx.splash(s.x, s.y); }
        }
        this.spits = this.spits.filter(s => !s.done);
    }
    hit(p, d) { this.struck(p, 1, d); }
    struck(by, dmg, dir) {
        if (!this.alive) return;
        if (this.state !== 'full') { Sfx.play('hitthing'); Fx.ring(this.tx * T + 16, this.ty * T); return; }
        this.hp--; this.flash = 40; G.hitstop = 8; G.shake = 8; Sfx.play('enemyhit');
        Stats.count('boss:grindle:hit');
        if (this.hp <= 0) return this.defeat();
        this.state = 'hurt'; this.st = 0; this.need = 2;
    }
    defeat() {
        this.alive = false; this.spits = [];
        Sfx.play('unravel'); Fx.yarn(this.tx * T + 16, this.ty * T, THREAD.ambrose);
        for (const o of this.area.ents) if (o.swallowed) { o.swallowed = false; o.tiedOff = false; o.hidden = false; Return.sendHome(o); }
        this.area.unplace(this, this.tx, this.ty); this.area.unplace(this, this.tx + 1, this.ty);
        Progress.set('millrace_boss');
        Script.run(MillFoes.grindleDown(this));
    }
    draw(cx, cy) {
        for (const s of this.spits) { Gfx.circle(s.x - cx, s.y - cy, 3, '#a5dcf7'); Gfx.rect(s.x - cx - 1, s.y - cy - 2, 2, 2, '#ffffff'); }
        if (!this.alive) return;
        const x = this.tx * T - cx, y = this.ty * T - cy;
        const sink = this.state === 'full' || this.state === 'hurt' ? 5 : 0;
        const bob = Math.round(Math.sin(G.t / 20) * 1);
        const im = spr(this.state === 'chomp' && this.st > 12 ? 'grindle_open' : 'grindle');
        const img = this.flash > 0 && (this.flash >> 1) % 2 ? tinted(im, '#ffffff') : im;
        Gfx.img(img, x, y - 18 + sink + bob);
        if (this.state === 'full') Gfx.img(spr('grindle_heart'), x + 12, y - 16 + sink + bob);
        Gfx.alpha(0.55); Gfx.rect(x - 2, y + 12, 36, 2, '#ffffff'); Gfx.alpha(1);
    }
}
SPAWN.grindle = (x, y, p) => Progress.flag('millrace_boss') ? new Ent('none') : new Grindle(x, y, p);

/* a barrel swallowed is out of play: not drawn, can't be touched */
{
    const sprite0 = Barrel.prototype.sprite;
    Barrel.prototype.sprite = function () { return this.hidden ? null : sprite0.call(this); };
}

const MillFoes = {
    *snapIntro(s) {
        yield 20;
        yield* say(null, 'Something long and green surfaces in the race, all teeth and scales, and slaps the water. The door grinds shut behind you.');
    },
    *snapDown(s) {
        Music.play('silence');
        yield 40;
        yield* say(null, 'The Snapjaw rolls over, unravels into a ball of blue yarn and bobs away down the race.');
        Music.play('millrace');
        Sfx.play('appear');
    },
    *grindleIntro(g) {
        yield 20;
        yield* say(null, "In the middle of the millpond, bolted to the intake, a great iron pike lifts its head and opens a mouth like a mill hopper. OLD GRINDLE, says the brass plate on its nose. It's hungry.");
    },
    *grindleDown(g) {
        const a = g.area;
        Music.play('silence');
        yield 40;
        yield* say(null, "Old Grindle's gears spin loose. Its plates fold up like a fan, and the whole fish sinks with a sigh into the intake, gone back wherever it came from.");
        for (const s of a.ents) if (s.kind === 'door' && s.group === 'boss') s.shut = false;
        const br = a.rooms.find(r => r.key === '1,0');
        a.add(new Hoop(br.x + 17, br.y + 9));       /* at the east end of the bank, clear of the raft's landing and the way out */
        a.add(new Pickup((br.x + 4) * T, (br.y + 9) * T, { what: 'heartstitch', id: 'millHeart' }));
        Sfx.play('appear');
        Music.play('millrace');
    },
};
SIGNATURE_TEXT.mill = "Painted on a floorboard in blue, very small: a mill wheel and the letters A.R. Someone signed this House the way a miller stamps a flour sack.";

function initMillraceArt() {
    ENEMY.snapjaw = { hp: 3, swims: true, r: 8, tall: 16, yarn: THREAD.ambrose };
    defSprite('snapjaw', ['........................', '........................', '.........kkkkkk.........', '.......kkggggggkk.......', '......kgggwkkgggGk......', '.....kggggkkkgggGGk.....', '.....kgggggggggGGGk.....', '....kgGgGgGgGgGgGGGk....',
        '....kggggggggggggGGk....', '....krrrrrrrrrrrrrrk....', '....kwkwkwkwkwkwkwkk....', '....krrrrrrrrrrrrrrk....', '.....kggggggggggGGk.....', '......kgGgGgGgGGGk......', '.....kkggggggggGGkk.....', '....kbbkkkkkkkkkkbbk....',
        '...kbBbbBbbBbbBbbBbk....', '..kbbbbbbbbbbbbbbbbbk...', '........................', '........................', '........................', '........................', '........................', '........................'],
        { g: '#4f9a5a', G: '#2e6a3e', r: '#c42b4a', w: '#ffffff', b: '#4fb0e0', B: '#a5dcf7' });
    defSprite('snapjaw_open', ['........................', '.........kkkkkk.........', '.......kkggggggkk.......', '......kgggwkkgggGk......', '.....kggggkkkgggGGk.....', '....kgGgGgGgGgGgGGGk....', '....krrrrrrrrrrrrrrk....', '....kwkwkwkwkwkwkwkk....',
        '....kr..............k...', '....kr..............k...', '....kwkwkwkwkwkwkwkk....', '....krrrrrrrrrrrrrrk....', '.....kggggggggggGGk.....', '......kgGgGgGgGGGk......', '.....kkggggggggGGkk.....', '....kbbkkkkkkkkkkbbk....',
        '...kbBbbBbbBbbBbbBbk....', '..kbbbbbbbbbbbbbbbbbk...', '........................', '........................', '........................', '........................', '........................', '........................'],
        { g: '#4f9a5a', G: '#2e6a3e', r: '#c42b4a', w: '#ffffff', b: '#4fb0e0', B: '#a5dcf7' });
    const grind = (open) => paintSprite(32, 32, x => {
        const R = (c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
        /* an iron pike: riveted plates, a hopper mouth, a brass nameplate */
        R('#5c645e', 2, 8, 28, 18); R('#848c86', 3, 9, 26, 6); R('#3e4852', 2, 24, 28, 2);
        for (let i = 4; i < 30; i += 5) { R('#c8d0c8', i, 10, 1, 1); R('#c8d0c8', i, 21, 1, 1); }
        R('#5c645e', 26, 4, 5, 6); R('#848c86', 27, 5, 3, 3);      /* dorsal fin */
        R('#3e4852', 0, 12, 3, 8);                                  /* tail */
        R('#f7d64a', 12, 14, 8, 3); R('#b88a2a', 12, 16, 8, 1);    /* nameplate */
        R('#fbf3df', 22, 11, 4, 4); R('#1c2630', 23, 12, 2, 2);    /* eye */
        if (open) { R('#1c2630', 6, 20, 20, 8); R('#fbf3df', 7, 20, 2, 2); R('#fbf3df', 11, 20, 2, 2); R('#fbf3df', 15, 20, 2, 2); R('#fbf3df', 19, 20, 2, 2); R('#fbf3df', 23, 20, 2, 2); }
        else { R('#1c2630', 6, 22, 20, 3); }
    });
    ART.grindle = grind(false); ART.grindle_open = grind(true);
    SPR.grindle = ART.grindle; SPR.grindle_open = ART.grindle_open;
    defSprite('grindle_heart', ['...kkkkk..', '..kyyyyyk.', '.kyrRRryyk', 'kyrRwRRryk', 'kyRRRRRRyk', 'kyrRRRRryk', '.kyrRRryk.', '..kyyyyk..', '...kkkk...'], { y: '#f7d64a', r: '#e8463c', R: '#c42b4a', w: '#ffffff' });
    ART.drafting = paintSprite(32, 20, x => { x.fillStyle = '#9a6438'; x.fillRect(2, 8, 28, 3); x.fillRect(4, 11, 2, 9); x.fillRect(26, 11, 2, 9); x.fillStyle = '#fbf3df'; x.fillRect(4, 1, 24, 8); x.fillStyle = '#4f9be0'; x.fillRect(7, 3, 6, 4); x.fillRect(16, 4, 9, 1); x.fillRect(16, 6, 7, 1); x.fillStyle = '#2e6ab0'; x.fillRect(9, 4, 2, 2); });
    ART.sampler_ambrose = paintSprite(26, 20, x => { x.fillStyle = '#9a6438'; x.fillRect(0, 0, 26, 20); x.fillStyle = '#fbf3df'; x.fillRect(2, 2, 22, 16); x.fillStyle = '#4f9be0'; x.beginPath(); x.arc(8, 10, 5, 0, Math.PI * 2); x.fill(); x.fillStyle = '#fbf3df'; x.fillRect(7, 9, 2, 2); x.fillStyle = '#2e6ab0'; x.fillRect(15, 6, 1, 8); x.fillRect(16, 6, 2, 1); x.fillRect(18, 7, 1, 2); x.fillRect(16, 9, 2, 1); x.fillRect(20, 6, 1, 8); x.fillRect(21, 6, 2, 1); x.fillRect(22, 7, 1, 2); x.fillRect(21, 9, 1, 1); x.fillRect(22, 10, 1, 4); });
    ART.spoolrack = paintSprite(32, 26, x => { x.fillStyle = '#7a4e32'; x.fillRect(0, 0, 32, 26); x.fillStyle = '#3a2418'; x.fillRect(2, 2, 28, 22); for (let r = 0; r < 2; r++) { x.fillStyle = '#9a6438'; x.fillRect(2, 12 + r * 11, 28, 2); for (let i = 0; i < 5; i++) { x.fillStyle = '#e6c08a'; x.fillRect(4 + i * 5, 4 + r * 11, 4, 8); x.fillStyle = '#4f9be0'; x.fillRect(4 + i * 5, 6 + r * 11, 4, 4); } } });
    ART.model_mill = paintSprite(32, 20, x => { x.fillStyle = '#9a6438'; x.fillRect(0, 10, 32, 4); x.fillRect(2, 14, 2, 6); x.fillRect(28, 14, 2, 6); x.fillStyle = '#4fb0e0'; x.fillRect(3, 6, 26, 4); x.fillStyle = '#c9925a'; x.fillRect(18, 1, 8, 6); x.fillStyle = '#62506a'; x.fillRect(17, 0, 10, 2); x.fillStyle = '#e6c08a'; x.fillRect(7, 5, 6, 2); x.fillStyle = '#e8463c'; x.fillRect(10, 2, 1, 4); });
    ART.flourbag = paintSprite(14, 16, x => { x.fillStyle = '#efe4cc'; x.fillRect(1, 3, 12, 12); x.fillRect(3, 1, 8, 3); x.fillStyle = '#c8b898'; x.fillRect(1, 13, 12, 2); x.fillStyle = '#4f9be0'; x.beginPath(); x.arc(7, 9, 3, 0, Math.PI * 2); x.fill(); });
    ART.monogram_mill = paintSprite(16, 10, x => { x.fillStyle = '#4f9be0'; x.fillRect(1, 2, 1, 6); x.fillRect(2, 2, 2, 1); x.fillRect(4, 3, 1, 5); x.fillRect(2, 5, 2, 1); x.fillRect(7, 2, 1, 6); x.fillRect(8, 2, 2, 1); x.fillRect(10, 3, 1, 1); x.fillRect(8, 4, 2, 1); x.fillRect(10, 5, 1, 3); x.fillStyle = '#2e6ab0'; x.beginPath(); x.arc(13, 5, 2, 0, Math.PI * 2); x.fill(); }, false);
}
CONTENT_INIT.push(initMillraceArt);
