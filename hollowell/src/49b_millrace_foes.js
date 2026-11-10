/* The Millrace's two big ones. The Snapjaw swims up and down its race; only what the water brings down on
   it hurts it (a crate drifting into it, or one going home into it). It ducks anything floating its way,
   except when it has reared up out of the race at Wren on the bank: then it hunts along the bank for her a
   good while, its back to the water. Two knocks see it off. Old Grindle, the mill automaton bolted to the
   millpond's intake, swallows whatever floats to rest in its open mouth; one mouthful fills it, it settles
   and its gear-heart shows. Struck, it turns the pond's sluice (the races run another way) and comes back
   another way: three rounds (below). */

const SJ = { bite: 36, hold: 170 };      /* the rear: the bite comes this long after it rises; it stays up hunting till hold */
class Snapjaw extends Enemy {
    constructor(tx, ty, p = {}) {
        super(tx, ty, Object.assign({ type: 'snapjaw', hp: 2 }, p));
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
            case 'rear': {
                /* up out of the race, jaws open (a clear moment to step back), then the snap */
                const beside = p.state === 'normal' && p.tx === this.hx - 1 && Math.abs(p.y - this.y) < 16;
                if (this.st === SJ.bite) {
                    Sfx.play('splash'); Fx.splash(this.x - 10, this.y - 4);
                    if (beside) p.hurt(1, this.x, this.y);
                }
                /* then it stays up, hunting along the bank for her with its back to the race (anything the water brings
                   down now hits it square); back within reach, she gets another snap */
                if (this.st > SJ.bite + 30 && beside) this.st = 0;
                else if (this.st > SJ.hold) { this.state = 'swim'; this.st = 0; }
                break;
            }
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
        UI.toast('Bonk! The Snapjaw goes under, rattled.', 90);
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
        /* rearing: jaws open till the snap; then hunting, it sways along the bank snapping at the air */
        const rear = this.state === 'rear', hunt = rear && this.st > SJ.bite;
        const open = rear && ((this.st > 10 && this.st <= SJ.bite) || (hunt && (this.st >> 3) % 3 === 0));
        const im = spr(open ? 'snapjaw_open' : 'snapjaw');
        const img = this.flash > 0 && (this.flash >> 1) % 2 ? tinted(im, '#ffffff') : im;
        const sway = hunt ? ((this.st >> 4) % 2 ? -1 : 1) : 0;
        Gfx.img(img, x - 12 + sway, y - 22 - (rear ? Math.min(6, this.st >> 2) : 0), this.dir === DOWN);
        if (this.state === 'rear' && !Progress.flag('sj_rear')) { Progress.set('sj_rear'); UI.toast("It rears up out of the race to bite, and forgets to watch the water.", 200); }
        Gfx.alpha(0.5); Gfx.rect(x - 10, y - 2, 20, 2, '#ffffff'); Gfx.alpha(1);
    }
}
SPAWN.snapjaw = (x, y, p) => Progress.flag('millrace_snapjaw') ? new Ent('none') : new Snapjaw(x, y, p);

/* Old Grindle, bolted to the millpond's intake (two tiles wide); its mouth is the two water tiles below it. While its
   mouth hangs open, anything floating that comes to rest in it is swallowed (whoever's riding it is snapped off into
   the pond first): one mouthful fills it, and it settles low with its gear-heart showing for a while. Each time it's
   struck it sulks till Wren is back on the bank, then heaves the pond's sluice round, and the races run another way
   (GRINDLE_FLOW: [x0, x1, y, way] in the room):
   1. the side races carry floats into its mouth; the ferry race runs up to just below it;
   2. the side races run away from its mouth, and the ferry race runs right into it (an empty ferry fills it too);
   3. it clamps its jaw for good, and one race runs straight past its teeth: only the pieces of a pot get in.
   It spits at Wren on the bank (out on the water, its jaws are the danger). */
const GRINDLE_FLOW = {
    1: [[5, 8, 4, RIGHT], [11, 14, 4, LEFT], [9, 9, 6, UP], [9, 9, 7, UP]],
    2: [[5, 7, 4, LEFT], [12, 14, 4, RIGHT], [9, 9, 5, UP], [9, 9, 6, UP], [9, 9, 7, UP]],
    3: [[5, 14, 4, RIGHT], [9, 9, 5, UP], [9, 9, 6, UP], [9, 9, 7, UP]],
};
const GR = { spit: { 1: 200, 2: 170, 3: 140 }, spitSpeed: { 1: 1.7, 2: 1.9, 3: 2.1 }, full: 900 };
class Grindle extends GridThing {
    constructor(tx, ty, p = {}) {
        super('grindle', tx, ty, Object.assign({ weight: WEIGHT.fixed, fixed: true, marked: false }, p));
        this.hp = 3; this.phase = 1; this.state = 'sleep'; this.st = 0; this.flash = 0;
        this.spits = []; this.alive = true; this.footW = 2;
    }
    onAdd(area) { area.place(this, this.tx, this.ty); area.place(this, this.tx + 1, this.ty); }
    get pond() { return this.area.roomAt(this.tx, this.ty); }
    get mouths() { return [[this.tx, this.ty + 1], [this.tx + 1, this.ty + 1]]; }
    get open() { return this.state === 'home' || this.state === 'chomp'; }
    /* settled low (full, smarting) or clamped shut at the waterline, its head comes down over its mouth */
    hurtBox() {
        if (!this.alive) return null;
        const low = this.state === 'full' || this.state === 'hurt' || this.state === 'shut';
        return { x0: this.tx * T, x1: this.tx * T + 32, y0: this.ty * T - 12, y1: this.ty * T + (low ? 24 : 16) };
    }
    /* the races as they run in a round */
    setFlow(phase) {
        const a = this.area, r = this.pond;
        for (let y = r.y + 1; y < r.y + r.h - 1; y++) for (let x = r.x + 1; x < r.x + r.w - 1; x++) a.flow.delete(key2(x, y));
        for (const [x0, x1, y, d] of GRINDLE_FLOW[phase]) for (let x = x0; x <= x1; x++) a.flow.set(key2(r.x + x, r.y + y), d);
    }
    /* (wholly on the bank: not a toe over the water, where a float might be about to leave) */
    ashore(p) {
        if (p.area !== this.area || p.state !== 'normal' || p.ride) return false;
        return [[-PBOX.hw, -PBOX.hh], [PBOX.hw - 0.01, -PBOX.hh], [-PBOX.hw, PBOX.hh - 0.01], [PBOX.hw - 0.01, PBOX.hh - 0.01]].every(([dx, dy]) => !this.area.kind(tileOf(p.x + dx), tileOf(p.y + dy)).water);
    }
    tick() {
        const p = G.player, a = this.area;
        if (!this.alive) return;
        if (this.flash > 0) this.flash--;
        if (this.state === 'sleep') {
            const r = this.pond;
            /* (in off a doorstep first, so the shutters don't close on Wren) */
            if (p.area === a && Cam.room === r && !Cam.busy && p.ty < r.y + r.h - 1 && p.tx < r.x + r.w - 1) {
                this.state = 'home'; this.st = 0;
                for (const s of a.ents) if (s.kind === 'door' && s.group === 'boss') s.shut = true;
                Music.play(bossSong('mill'));
                Script.run(MillFoes.grindleIntro(this));
            }
            return;
        }
        this.updateSpits();
        if (Script.blocking()) return;
        this.st++;
        switch (this.state) {
            case 'home': {
                /* whatever floats to rest in its open mouth, it swallows; whoever's riding it is snapped off first */
                for (const [mx, my] of this.mouths) {
                    const o = a.at(mx, my);
                    if (!o || !o.floats || o.mv || o.swallowed || o.carried) continue;
                    if (p.state === 'normal' && p.tx === mx && p.ty === my) { this.state = 'chomp'; this.st = 0; }
                    else this.gulp(o);
                    break;
                }
                if (this.state !== 'home') break;
                if (this.st > GR.spit[this.phase] && this.ashore(p)) { this.spit(p); this.st = 0; }
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
                /* settled low, gear-heart showing; given long enough it brings it all back up */
                if (this.st > GR.full) { this.spitOut(); this.state = 'home'; this.st = 0; }
                break;
            case 'hurt':
                if (this.st > 50) { this.spitOut(); this.state = 'sulk'; this.st = 0; }
                break;
            case 'sulk':
                /* sunk low and sulking till Wren is back on the bank; then it heaves at the sluice */
                if (this.st > 20 && this.ashore(p)) this.turn();
                break;
            case 'shut':
                if (this.st > GR.spit[3] && this.ashore(p)) { this.spit(p); this.st = 0; }
                break;
        }
    }
    gulp(o) {
        this.area.unplace(o, o.tx, o.ty);
        o.swallowed = true; o.tiedOff = true; o.hidden = true;
        Sfx.play('pop'); Sfx.play('splash'); Sfx.play('rumble'); G.shake = 3;
        Fx.splash(o.tx * T + 8, o.ty * T + 8);
        Stats.count('boss:grindle:gulp');
        this.state = 'full'; this.st = 0;
        UI.toast('Old Grindle gulps it down, shudders, and settles low in the water. Its gear-heart glints on its back.', 160);
    }
    /* everything it swallowed goes home */
    spitOut() {
        for (const o of this.area.ents) if (o.swallowed) {
            o.swallowed = false; o.tiedOff = false; o.hidden = false;
            Return.sendHome(o);
        }
    }
    turn() {
        this.state = 'turn'; this.st = 0; this.phase++;
        this.setFlow(this.phase);
        const s = this.area.ents.find(e => e.kind === 'sluice'); if (s) s.spin = 90;
        Sfx.play('rumble'); G.shake = 10;
        Stats.count('boss:grindle:turn');
        Script.run(MillFoes.turn(this));
    }
    spit(p) {
        const sx = this.tx * T + 16, sy = this.ty * T + 6;
        const d = Math.hypot(p.x - sx, p.y - sy) || 1, sp = GR.spitSpeed[this.phase];
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
    hit(by, d, shard) { this.struck(by, 1, d, shard); }
    /* full, anything that lands a blow on its gear-heart hurts it; clamped shut, only flying pieces get between its teeth */
    struck(by, dmg, dir, shard) {
        if (!this.alive || this.flash > 0) return;
        if (this.state === 'full' || (this.state === 'shut' && shard)) return this.hurt();
        Sfx.play('hitthing'); Fx.ring(this.tx * T + 16, this.ty * T);
        if (this.state === 'shut' && !Progress.flag('grindle_shut')) { Progress.set('grindle_shut'); UI.toast("Clang! Its jaw is shut fast. The gear-heart turns in there, behind its teeth.", 200); }
    }
    hurt() {
        this.hp--; this.flash = 40; G.hitstop = 8; G.shake = 8; Sfx.play('enemyhit');
        Stats.count('boss:grindle:hit');
        if (this.hp <= 0) return this.defeat();
        this.state = 'hurt'; this.st = 0;
    }
    defeat() {
        this.alive = false; this.spits = [];
        Sfx.play('unravel'); Fx.yarn(this.tx * T + 16, this.ty * T, THREAD.ambrose);
        this.spitOut();
        this.area.unplace(this, this.tx, this.ty); this.area.unplace(this, this.tx + 1, this.ty);
        Progress.set('millrace_boss');
        Script.run(MillFoes.grindleDown(this));
    }
    draw(cx, cy) {
        for (const s of this.spits) { Gfx.circle(s.x - cx, s.y - cy, 3, '#a5dcf7'); Gfx.rect(s.x - cx - 1, s.y - cy - 2, 2, 2, '#ffffff'); }
        if (!this.alive) return;
        const x = this.tx * T - cx, y = this.ty * T - cy;
        const low = this.state === 'full' || this.state === 'hurt' || this.state === 'sulk' ? 5 : this.state === 'turn' ? 3 : 0;
        const bob = this.state === 'sulk' ? 0 : Math.round(Math.sin(G.t / 20) * 1);
        const look = this.state === 'chomp' && this.st > 12 ? 'grindle_open' : this.state === 'shut' ? 'grindle_shut' : this.open ? 'grindle_hungry' : 'grindle';
        const im = spr(look);
        const img = this.flash > 0 && (this.flash >> 1) % 2 ? tinted(im, '#ffffff') : im;
        Gfx.img(img, x, y - 18 + low + bob);
        if (this.state === 'full' || this.state === 'hurt') Gfx.img(spr('grindle_heart'), x + 11, y - 16 + low + bob);
        if (this.state === 'shut') { Gfx.alpha(0.35 + 0.25 * Math.sin(G.t / 6)); Gfx.rect(x + 9, y + 3 + bob, 14, 3, '#e8463c'); Gfx.alpha(1); }
        Gfx.alpha(0.55); Gfx.rect(x - 2, y + 12, 36, 2, '#ffffff'); Gfx.alpha(1);
    }
}
SPAWN.grindle = (x, y, p) => Progress.flag('millrace_boss') ? new Ent('none') : new Grindle(x, y, p);

/* the millpond's sluice: a great iron wheel set in the wall over the intake; Grindle heaves it round each time it's hurt */
class Sluice extends Ent {
    constructor(tx, ty, p = {}) { super('sluice', p); this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T; this.ang = 0.3; this.spin = 0; }
    get sortY() { return this.y + 6; }
    update() { if (this.spin > 0) { this.spin--; this.ang += 0.075 * Math.min(1, this.spin / 25 + 0.15); } }
    draw(cx, cy) {
        const x = this.x - cx + 16, y = this.y - cy + 9;
        /* the gate frame in the wall under it, then the wheel: iron rim, spokes, brass hub, a red handle on the rim */
        Gfx.rect(x - 9, y + 4, 18, 14, PAL.ink); Gfx.rect(x - 8, y + 5, 16, 12, '#5c645e'); Gfx.rect(x - 6, y + 7, 12, 10, '#3e4852');
        for (let i = 0; i < 3; i++) Gfx.rect(x - 6, y + 8 + i * 3, 12, 1, '#7c847e');
        Gfx.circle(x, y, 12, PAL.ink); Gfx.circle(x, y, 11, '#6a635e'); Gfx.circle(x, y, 9, '#3e4852');
        for (let i = 0; i < 6; i++) {
            const t = this.ang + i * Math.PI / 3;
            Gfx.line(x, y, x + Math.cos(t) * 9, y + Math.sin(t) * 9, '#a8b0a8');
        }
        Gfx.circle(x, y, 3, PAL.ink); Gfx.circle(x, y, 2, '#e2b45a');
        const hx = x + Math.cos(this.ang) * 11, hy = y + Math.sin(this.ang) * 11;
        Gfx.circle(hx, hy, 2, PAL.ink); Gfx.rect(Math.round(hx) - 1, Math.round(hy) - 1, 2, 2, '#c42b4a');
    }
}
SPAWN.sluice = (x, y, p) => new Sluice(x, y, p);

/* a float swallowed is out of play: not drawn, can't be touched */
{
    const sprite0 = Barrel.prototype.sprite;
    Barrel.prototype.sprite = function () { return this.hidden ? null : sprite0.call(this); };
    const raft0 = Raft.prototype.sprite;
    Raft.prototype.sprite = function () { return this.hidden ? null : raft0.call(this); };
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
        yield* say(null, "At the head of the millpond, bolted to the intake, a great iron pike lifts its head and opens a mouth like a mill hopper. OLD GRINDLE, says the brass plate on its nose. It's hungry.");
    },
    /* the sluice turns: the races run another way, and Grindle with them */
    *turn(g) {
        yield 50;
        if (g.phase === 2) yield* say(null, "Old Grindle heaves its iron head against the sluice. The great wheel grinds over and the whole millpond turns about: the side races run away from its mouth now, and the ferry race runs straight into it. Its round eye swivels to the raft.");
        else yield* say(null, "Grindle wrenches the sluice round once more, then clamps its iron jaw shut with a clang. It won't be fed again. One race runs straight past its teeth now; between them, deep in its throat, the gear-heart spins.");
        g.state = g.phase === 3 ? 'shut' : 'home'; g.st = 0;
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
    ENEMY.snapjaw = { hp: 2, swims: true, r: 8, tall: 16, yarn: THREAD.ambrose };
    defSprite('snapjaw', ['........................', '........................', '.........kkkkkk.........', '.......kkggggggkk.......', '......kgggwkkgggGk......', '.....kggggkkkgggGGk.....', '.....kgggggggggGGGk.....', '....kgGgGgGgGgGgGGGk....',
        '....kggggggggggggGGk....', '....krrrrrrrrrrrrrrk....', '....kwkwkwkwkwkwkwkk....', '....krrrrrrrrrrrrrrk....', '.....kggggggggggGGk.....', '......kgGgGgGgGGGk......', '.....kkggggggggGGkk.....', '....kbbkkkkkkkkkkbbk....',
        '...kbBbbBbbBbbBbbBbk....', '..kbbbbbbbbbbbbbbbbbk...', '........................', '........................', '........................', '........................', '........................', '........................'],
        { g: '#4f9a5a', G: '#2e6a3e', r: '#c42b4a', w: '#ffffff', b: '#4fb0e0', B: '#a5dcf7' });
    defSprite('snapjaw_open', ['........................', '.........kkkkkk.........', '.......kkggggggkk.......', '......kgggwkkgggGk......', '.....kggggkkkgggGGk.....', '....kgGgGgGgGgGgGGGk....', '....krrrrrrrrrrrrrrk....', '....kwkwkwkwkwkwkwkk....',
        '....kr..............k...', '....kr..............k...', '....kwkwkwkwkwkwkwkk....', '....krrrrrrrrrrrrrrk....', '.....kggggggggggGGk.....', '......kgGgGgGgGGGk......', '.....kkggggggggGGkk.....', '....kbbkkkkkkkkkkbbk....',
        '...kbBbbBbbBbbBbbBbk....', '..kbbbbbbbbbbbbbbbbbk...', '........................', '........................', '........................', '........................', '........................', '........................'],
        { g: '#4f9a5a', G: '#2e6a3e', r: '#c42b4a', w: '#ffffff', b: '#4fb0e0', B: '#a5dcf7' });
    /* Old Grindle's head, front on: riveted iron plates lit from the upper left, a fin behind, round eyes in brass rings,
       its nameplate on the snout, and a hopper of a mouth: shut, hungry, wide for a bite, or clamped (teeth locked,
       side plates sprung, the gear-heart glowing between the teeth) */
    const grind = (mode) => paintSprite(32, 32, x => {
        const R = (c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
        const IRON = ['#c8d0c8', '#a8b0a8', '#848c86', '#5c645e', '#3e4852'];
        /* the fin behind the head */
        for (let j = 0; j < 8; j++) { const w = 2 + (j >> 1); R(j < 3 ? IRON[2] : IRON[3], 16 - w, j, w * 2, 1); }
        for (const fx of [13, 16, 19]) R(IRON[4], fx, 2, 1, 5);
        /* the head: one big rounded plate, shaded */
        const sprung = mode === 'shut' ? 1 : 0;
        for (let j = 3; j < 27; j++) for (let i = 1; i < 31; i++) {
            const u = (i - 15.5) / 14.5, v = (j - 14) / 12;
            if (u * u + v * v > 1) continue;
            const l = -u * 0.55 - v * 0.7 + (hash2(i, j, 31) - 0.5) * 0.25;
            R(IRON[l > 0.5 ? 0 : l > 0.15 ? 1 : l > -0.25 ? 2 : l > -0.65 ? 3 : 4], i, j, 1, 1);
        }
        /* gill plates at the sides (sprung open on a clamped jaw: dark gaps with the heart's glow behind) */
        for (const side of [-1, 1]) {
            const gx = side < 0 ? 5 - sprung : 26 + sprung;
            for (let j = 9; j < 21; j++) { const bow = Math.round(Math.sin((j - 9) / 12 * Math.PI) * 2); R(IRON[4], gx - side * bow, j, 1, 1); if (sprung) R(j % 3 ? '#1c2630' : '#c42b4a', gx - side * bow + side, j, 1, 1); }
        }
        /* rivets along the brow and the cheeks */
        for (let i = 6; i <= 25; i += 4) R(IRON[0], i, 6, 1, 1);
        for (const [rx, ry] of [[4, 13], [27, 13], [5, 18], [26, 18], [9, 20], [22, 20]]) R(IRON[0], rx, ry, 1, 1);
        /* eyes in brass rings */
        for (const ex of [8, 23]) {
            R('#b88a2a', ex - 3, 9, 6, 6); R('#f7d64a', ex - 3, 9, 6, 1); R('#f7d64a', ex - 3, 9, 1, 6);
            R('#fbf3df', ex - 2, 10, 4, 4);
            const look = mode === 'closed' ? 0 : 1;
            R('#1c2630', ex - 1 + (ex < 16 ? look : -look), 11, 2, 2 + (mode === 'open' ? 1 : 0));
            if (mode === 'closed') R(IRON[3], ex - 2, 10, 4, 2);      /* heavy-lidded, settled */
        }
        /* the nameplate on the snout */
        R('#b88a2a', 11, 15, 10, 4); R('#f7d64a', 11, 15, 10, 1);
        for (let i = 12; i < 20; i += 2) R('#6a4a1a', i, 17, 1, 1);
        /* the mouth */
        const mx0 = 7, mw = 18;
        if (mode === 'closed') {
            R(IRON[4], mx0, 22, mw, 1); R(IRON[3], mx0 + 1, 23, mw - 2, 2); R(IRON[2], mx0 + 2, 23, mw - 4, 1);
        } else if (mode === 'shut') {
            /* clamped: teeth locked in a zigzag, a red glow between them */
            R('#1c2630', mx0, 21, mw, 4); R('#e8463c', mx0 + 2, 22, mw - 4, 2);
            for (let i = 0; i < mw; i += 3) { R('#fbf3df', mx0 + i, 21, 2, 2); R('#fbf3df', mx0 + i + 1, 23, 2, 2); }
            R(IRON[4], mx0 - 1, 20, mw + 2, 1); R(IRON[3], mx0, 25, mw, 2);
        } else {
            /* a hopper: a dark funnel, teeth top and bottom (wider when it bites) */
            const h = mode === 'open' ? 10 : 6, y0 = mode === 'open' ? 19 : 20;
            for (let j = 0; j < h; j++) { const inset = Math.round(j * 0.6); R('#1c2630', mx0 + inset, y0 + j, mw - inset * 2, 1); }
            R('#3a1c22', mx0 + 4, y0 + 2, mw - 8, h - 3);
            for (let i = 0; i < mw - 1; i += 3) R('#fbf3df', mx0 + i, y0, 2, 2);
            for (let i = 3; i < mw - 4; i += 3) R('#fbf3df', mx0 + i, y0 + h - 2, 2, 2);
        }
    });
    ART.grindle = grind('closed'); ART.grindle_hungry = grind('hungry'); ART.grindle_open = grind('open'); ART.grindle_shut = grind('shut');
    for (const k of ['grindle', 'grindle_hungry', 'grindle_open', 'grindle_shut']) SPR[k] = ART[k];
    defSprite('grindle_heart', ['...kkkkk..', '..kyyyyyk.', '.kyrRRryyk', 'kyrRwRRryk', 'kyRRRRRRyk', 'kyrRRRRryk', '.kyrRRryk.', '..kyyyyk..', '...kkkk...'], { y: '#f7d64a', r: '#e8463c', R: '#c42b4a', w: '#ffffff' });
    ART.drafting = paintSprite(32, 20, x => { x.fillStyle = '#9a6438'; x.fillRect(2, 8, 28, 3); x.fillRect(4, 11, 2, 9); x.fillRect(26, 11, 2, 9); x.fillStyle = '#fbf3df'; x.fillRect(4, 1, 24, 8); x.fillStyle = '#4f9be0'; x.fillRect(7, 3, 6, 4); x.fillRect(16, 4, 9, 1); x.fillRect(16, 6, 7, 1); x.fillStyle = '#2e6ab0'; x.fillRect(9, 4, 2, 2); });
    ART.sampler_ambrose = paintSprite(26, 20, x => { x.fillStyle = '#9a6438'; x.fillRect(0, 0, 26, 20); x.fillStyle = '#fbf3df'; x.fillRect(2, 2, 22, 16); x.fillStyle = '#4f9be0'; x.beginPath(); x.arc(8, 10, 5, 0, Math.PI * 2); x.fill(); x.fillStyle = '#fbf3df'; x.fillRect(7, 9, 2, 2); x.fillStyle = '#2e6ab0'; x.fillRect(15, 6, 1, 8); x.fillRect(16, 6, 2, 1); x.fillRect(18, 7, 1, 2); x.fillRect(16, 9, 2, 1); x.fillRect(20, 6, 1, 8); x.fillRect(21, 6, 2, 1); x.fillRect(22, 7, 1, 2); x.fillRect(21, 9, 1, 1); x.fillRect(22, 10, 1, 4); });
    ART.spoolrack = paintSprite(32, 26, x => { x.fillStyle = '#7a4e32'; x.fillRect(0, 0, 32, 26); x.fillStyle = '#3a2418'; x.fillRect(2, 2, 28, 22); for (let r = 0; r < 2; r++) { x.fillStyle = '#9a6438'; x.fillRect(2, 12 + r * 11, 28, 2); for (let i = 0; i < 5; i++) { x.fillStyle = '#e6c08a'; x.fillRect(4 + i * 5, 4 + r * 11, 4, 8); x.fillStyle = '#4f9be0'; x.fillRect(4 + i * 5, 6 + r * 11, 4, 4); } } });
    ART.model_mill = paintSprite(32, 20, x => { x.fillStyle = '#9a6438'; x.fillRect(0, 10, 32, 4); x.fillRect(2, 14, 2, 6); x.fillRect(28, 14, 2, 6); x.fillStyle = '#4fb0e0'; x.fillRect(3, 6, 26, 4); x.fillStyle = '#c9925a'; x.fillRect(18, 1, 8, 6); x.fillStyle = '#62506a'; x.fillRect(17, 0, 10, 2); x.fillStyle = '#e6c08a'; x.fillRect(7, 5, 6, 2); x.fillStyle = '#e8463c'; x.fillRect(10, 2, 1, 4); });
    ART.flourbag = paintSprite(14, 16, x => { x.fillStyle = '#efe4cc'; x.fillRect(1, 3, 12, 12); x.fillRect(3, 1, 8, 3); x.fillStyle = '#c8b898'; x.fillRect(1, 13, 12, 2); x.fillStyle = '#4f9be0'; x.beginPath(); x.arc(7, 9, 3, 0, Math.PI * 2); x.fill(); });
    ART.monogram_mill = paintSprite(16, 10, x => { x.fillStyle = '#4f9be0'; x.fillRect(1, 2, 1, 6); x.fillRect(2, 2, 2, 1); x.fillRect(4, 3, 1, 5); x.fillRect(2, 5, 2, 1); x.fillRect(7, 2, 1, 6); x.fillRect(8, 2, 2, 1); x.fillRect(10, 3, 1, 1); x.fillRect(8, 4, 2, 1); x.fillRect(10, 5, 1, 3); x.fillStyle = '#2e6ab0'; x.beginPath(); x.arc(13, 5, 2, 0, Math.PI * 2); x.fill(); }, false);
}
CONTENT_INIT.push(initMillraceArt);
