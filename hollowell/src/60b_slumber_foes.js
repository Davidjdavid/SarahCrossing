/* The Slumberhouse's own things: the grate floats slip through (but nobody riding one), Matron Hush (the
   mini-boss: she follows your footsteps exactly, so lead her over boards that have just given way; twice), and
   Mother Sloth (the boss: her long arms catch you and reel you to her bed; fly from her grip further than she can
   reach and the arm snaps; both snapped, she slumps and her nightcap is there to be knocked; three rounds, each
   taking away the way the last one was won). */

/* the grate under the Study: water and a float with nobody on it go through */
class Grate extends Ent {
    constructor(tx, ty, p = {}) { super('grate', p); this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T; }
    blocks(x, y, who) {
        if (x !== this.tx || y !== this.ty) return false;
        const p = G.player;
        if (who && who.floats && who.isGrid) return !!(p && p.area === this.area && (p.ride === who || (p.tx === who.tx && p.ty === who.ty && !p.flying)));
        return true;
    }
    get sortY() { return this.y + 16; }
    draw(cx, cy) { const x = this.x - cx, y = this.y - cy; for (let i = 1; i < 16; i += 4) Gfx.rect(x + i, y - 6, 2, 20, '#4b3a8a'); Gfx.rect(x, y - 6, 16, 2, '#3e2e6a'); }
}
SPAWN.grate = (x, y, p) => new Grate(x, y, p);

/* ---------------- Matron Hush ---------------- */
class Matron extends Enemy {
    constructor(tx, ty, p = {}) {
        super(tx, ty, Object.assign({ type: 'matron', hp: 2 }, p));
        this.state = 'sleep'; this.st = 0; this.i = 0; this.weightN = 3; this.z = 0;
    }
    get arena() { return this.area.roomAt(this.hx, this.hy); }
    hurtBox() { return this.alive && this.state === 'dazed' ? { x0: this.x - 8, x1: this.x + 8, y0: this.y - 20, y1: this.y + 3 } : (this.alive && this.state === 'follow' ? { x0: this.x - 6, x1: this.x + 6, y0: this.y - 22, y1: this.y + 2 } : null); }
    onTile() { return false; }
    feetOn(x, y) { return this.alive && (this.state === 'follow') && this.tx === x && this.ty === y; }
    shutters(shut) { for (const s of this.area.ents) if (s.kind === 'door' && s.group === 'matron') s.shut = shut; }
    update() {
        if (!this.alive) return this.updateYarn();
        this.t++; if (this.flash > 0) this.flash--;
        const p = G.player, a = this.area, r = this.arena;
        if (this.state === 'sleep') {
            if (p.area === a && Cam.room === r && !Cam.busy && p.state === 'normal' && p.ty < r.y + r.h - 2) {
                this.state = 'follow'; this.st = 0; this.i = 0;
                this.shutters(true);
                Music.play('boss');
                Script.run(SlumberFoes.matronIntro(this));
            }
            return;
        }
        /* Wren gone from the room mid-fight (flown home to a bed elsewhere): Matron goes back to bed, the doors open */
        if ((p.area !== a || (Cam.room !== r && !p.flying && !Cam.busy)) && this.state !== 'fly') { this.toBed(); this.state = 'sleep'; this.shutters(false); Music.play('slumber'); return; }
        if (Script.blocking()) return;
        this.st++;
        switch (this.state) {
            case 'follow': {
                /* step along Wren's footsteps, one by one */
                const tr = p.trace;
                if (!tr || !tr.length) break;
                if (this.i >= tr.length || this.st === 1) this.i = this.nearest(tr);
                const [gx, gy] = tr[Math.min(this.i, tr.length - 1)];
                const tx = gx * T + 8, ty = gy * T + 10;
                /* her one dangerous move: now and then she stops dead, puffs herself up (her "!"), and then comes on along
                   the footsteps twice as fast for a second (a full heart if she reaches Wren) */
                this.lt = (this.lt || 0) + 1;
                if (this.lt === 240) { this.brace = tellFor(5); Sfx.play('warn'); Stats.count('boss:matron:lunge'); }
                if (this.brace > 0) { if (--this.brace === 0) this.lunge = 60; this.anim = 0; break; }
                const lunge = this.lunge > 0 && this.lunge--;
                if (this.lt > 320) this.lt = 0;
                const sp = (0.95 + (2 - this.hp) * 0.15) * (lunge ? 2 : 1);
                const dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy);
                if (d <= sp) { this.x = tx; this.y = ty; if (this.i < tr.length - 1) this.i++; else { this.x += (p.x - this.x) * 0.05; this.y += (p.y - this.y) * 0.05; } }
                else { this.x += dx / d * sp; this.y += dy / d * sp; this.dir = dirOf(dx, dy); }
                this.anim++;
                /* her footing gone: down she goes */
                if (a.kind(this.tx, this.ty).pit) { this.state = 'fall'; this.st = 0; this.brace = this.lunge = 0; Sfx.play('fall'); Stats.count('boss:matron:fall'); break; }
                if (p.state === 'normal' && Math.abs(p.x - this.x) < 9 && Math.abs(p.y - this.y) < 8) { p.hurt(lunge ? 2 : 1, this.x, this.y); Fx.text(p.x, p.y - 20, 'tucked in!', '#d8c8f8'); }
                break;
            }
            case 'fall':
                if (this.st >= 30) { this.state = 'fly'; this.st = 0; this.fx = this.x; this.fy = this.y; Sfx.play('flight'); }
                break;
            case 'fly': {
                const k = Math.min(1, this.st / 50);
                this.x = lerp(this.fx, this.hx * T + 8, k); this.y = lerp(this.fy, this.hy * T + 10, k); this.z = Math.sin(k * Math.PI) * 24;
                if (k >= 1) { this.z = 0; this.state = 'dazed'; this.st = 0; Sfx.play('land'); Fx.dust(this.x, this.y); G.shake = 6; Crumble.mendAll(a, r); }
                break;
            }
            case 'dazed':
                if (this.st > 260) { this.state = 'follow'; this.st = 0; this.i = 0; Fx.text(this.x, this.y - 26, '!', '#f7d64a'); }
                break;
        }
    }
    nearest(tr) { let b = 0, bd = Infinity; for (let i = 0; i < tr.length; i++) { const d = Math.hypot(tr[i][0] * T + 8 - this.x, tr[i][1] * T + 10 - this.y); if (d < bd) { bd = d; b = i; } } return b; }
    toBed() { this.x = this.hx * T + 8; this.y = this.hy * T + 10; this.z = 0; this.st = 0; this.lt = this.brace = this.lunge = 0; Crumble.mendAll(this.area, this.arena); }
    struck(by, dmg, dir) {
        if (!this.alive || this.flash > 0) return;
        if (this.state !== 'dazed') { Sfx.play('hitthing'); Fx.ring(this.x, this.y - 10); if (by === G.player) Fx.text(this.x, this.y - 28, 'too starchy!', '#fbf6ea'); return; }
        this.hp--; this.flash = 30; G.hitstop = 8; G.shake = 6; Sfx.play('enemyhit');
        if (this.hp <= 0) return this.defeat();
        this.state = 'follow'; this.st = 0; this.i = 0;
    }
    shoved() { }
    hooked(h) { Sfx.play('hookhit'); Fx.ring(this.x, this.y - 10); }
    defeat() {
        this.alive = false; this.yarnT = 0; this.trace = [[this.hx, this.hy]];
        Sfx.play('unravel'); Fx.yarn(this.x, this.y - 10, THREAD.mallow);
        Progress.set('slumber_matron');
        Script.run(SlumberFoes.matronDown(this));
    }
    draw(cx, cy) {
        if (!this.alive) { if ((this.yarnT || 0) < 120) { const k = 1 - this.yarnT / 120; Gfx.circle(this.x - cx, this.y - cy - 4, Math.round(8 * k), THREAD.mallow); } return; }
        const x = this.x - cx, y = this.y - cy;
        if (this.state === 'fall') {
            const k = 1 - this.st / 30, im = spr('matron_0');
            if (!HEADLESS && im && k > 0) { Gfx.alpha(k); Gfx.ctx.drawImage(im, Math.round(x - 8 * k), Math.round(y - 26 * k), Math.round(16 * k), Math.round(28 * k)); Gfx.alpha(1); }
            return;
        }
        Gfx.alpha(0.25); Gfx.rect(x - 6, y + 1, 12, 3, PAL.ink); Gfx.alpha(1);
        const im = spr(this.state === 'dazed' ? 'matron_daze' : this.state === 'sleep' ? 'matron_sleep' : 'matron_' + ((this.anim >> 4) % 2));
        const img = this.flash > 0 && (this.flash >> 1) % 2 ? tinted(im, '#ffffff') : im;
        /* puffed up, about to come on fast: she shivers, her "!" up */
        const sh = this.brace > 0 ? ((this.t >> 1) % 2 ? 1 : -1) : 0;
        Gfx.img(img, x - 8 + sh, y - 26 - Math.round(this.z || 0) - (this.brace > 0 ? 1 : 0));
        if (this.brace > 0) Tells.bang(x, y - 40);
        if (this.state === 'dazed' && (this.t >> 3) % 2) Font.draw('z', x + 6, y - 30, '#e8e0ff');
    }
}
SPAWN.matron = (x, y, p) => Progress.flag('slumber_matron') ? new Ent('none') : new Matron(x, y, p);

/* ---------------- Mother Sloth ---------------- */
/* One rule all fight: her long arms catch Wren and reel her in to be tucked into bed, and an arm stretched further than
   it reaches (the ring of stars in the carpet) snaps. Fly from her grip far enough and it goes; both gone, she slumps,
   and her nightcap is there to be knocked. Each knock takes away the way that round was won:
   1. the floor runs out to the walls: lay the Bedroll out past the stars, let her catch you, fly Homeward;
   2. past the stars the floor drops into the dark (a Bedroll lying out there tumbles back into Wren's pack), all but a
      row of old boards along the bottom that give way behind you: nowhere to lay it out of reach now, but a flight home
      goes back the way you came, so walk out over the boards and back in before she catches you;
   3. the boards drop away too, and the old bedposts they were laid across stand out in the dark, ringed with brass:
      caught, turn and hook one, and the reel drags you out of her grip; you drop into the dark and fly home.
   (POSTS are in the room's own tiles: from each, the reel ends out past the stars, over the drop.) */
const SLOTH = { REACH: 5.25, SNAP: 5.75, POSTS: [[1, 7], [3, 9], [15, 9], [17, 7]], SHEEP: 250 };
/* Her blows (TELL[5]): an arm's hand rises and spreads its fingers before it reaches (being caught is half the trick;
   reeled all the way in and tucked up costs a full heart); out of reach, she lifts pillows over her head and lobs them
   (one, then two, then three); and in the last round she counts sheep: a row of the floor glows, and a flock of dream
   sheep bounds along it, over the dark and all (a full heart). Each round she's knocked into, a heart falls off the
   bed. Nothing is thrown at Wren while she's held fast, but the sheep. */
class MotherSloth extends Enemy {
    constructor(tx, ty, p = {}) {
        super(tx, ty, Object.assign({ type: 'mothersloth', hp: 3 }, p));
        this.state = 'sleep'; this.st = 0; this.weightN = 9; this.hidden = false; this.pillows = []; this.lift = 0; this.sheepT = 0;
        const sx = tx * T + 8, sy = ty * T + 18;
        this.arms = [{ side: -1, sx: sx - 34, sy, hx: sx - 34, hy: sy + 6, state: 'rest', t: 0, cool: 30 }, { side: 1, sx: sx + 34, sy, hx: sx + 34, hy: sy + 6, state: 'rest', t: 0, cool: 90 }];
        this.capX = tx * T + 8; this.capY = (ty + 3) * T;
    }
    get arena() { return this.area.roomAt(this.hx, this.hy); }
    get phase() { return 4 - Math.max(1, Math.min(3, this.hp)); }
    /* out past the stars: further from both shoulders than an arm will stretch (the ring is the one line that counts) */
    outside(x, y) { return this.arms.every(o => Math.hypot(x - o.sx, y - o.sy) > SLOTH.SNAP * T); }
    /* the floor out past the stars (standing there, Wren would be outside), from the map as it's built */
    onAdd(area) {
        const r = area.roomAt(this.hx, this.hy);
        this.far = [];
        for (let y = r.y + 1; y < r.y + r.h - 1; y++) for (let x = r.x + 1; x < r.x + r.w - 1; x++) if (!area.kind(x, y).solid && this.outside(x * T + 8, y * T + 4)) this.far.push([x, y, area.chars[y * area.w + x]]);
    }
    isFar(x, y) { return this.far.some(q => q[0] === x && q[1] === y); }
    /* the room as the round has it: 1 floor to the walls; 2 the floor past the stars gone but for the old boards along the
       bottom; 3 the boards gone too, and the old bedposts left standing out there */
    setArena(phase, fx) {
        const a = this.area, r = this.arena, bottom = r.y + r.h - 2;
        for (const e of a.ents.slice()) if (e.slothBit) a.remove(e);
        const posts = phase === 3 ? SLOTH.POSTS.map(([x, y]) => [r.x + x, r.y + y]) : [];
        for (const [x, y, ch] of this.far) {
            const board = phase === 2 && y === bottom && !this.isFar(x, y - 1), post = posts.some(q => q[0] === x && q[1] === y);
            a.setCell(x, y, phase === 1 ? ch : board ? 'c' : post ? ',' : 'o');
            if (board) a.add(new Crumble(x, y)).slothBit = true;
            if (!fx) continue;
            if (phase === 1) Fx.sparkle(x * T + 8, y * T + 8, '#d8c8f8');
            else if (!board) Fx.burst(x * T + 8, y * T + 10, '#4a4e84');
        }
        for (const [x, y] of posts) { const e = a.add(SPAWN.eyelet(x, y, {})); e.slothBit = true; if (fx) Fx.poof(x * T + 8, y * T + 6); }
        /* nobody left standing on nothing */
        const p = G.player;
        if (p && p.area === a && p.state === 'normal' && a.kind(p.tx, p.ty).pit) { const [lx, ly] = p.landingSpot(p.tx, p.ty); p.x = lx * T + 8; p.y = ly * T + 10; Fx.dust(p.x, p.y); }
        /* a Bedroll lying out past the stars goes with the floor (said after she's had her say) */
        const b = Inv.bedroll;
        if (phase > 1 && b && b.area === a.id && !Bedroll.float && this.isFar(b.tx, b.ty)) { Bedroll.lost(); G.pendingToast = null; this.rollLost = true; }
    }
    /* (the Bedroll gone with the floor: told once she's done talking) */
    tellRollLost() { if (this.rollLost) { this.rollLost = false; UI.toast('The floor went out from under your Bedroll. It turned up, rolled, in your pack.', 180); } }
    onTile() { return false; }
    feetOn() { return false; }
    blocks(x, y) { return this.alive && x >= this.hx - 2 && x <= this.hx + 3 && y >= this.hy - 1 && y <= this.hy; }
    hurtBox() { return this.alive && this.state === 'slump' ? { x0: this.capX - 12, x1: this.capX + 12, y0: this.capY - 14, y1: this.capY + 6 } : null; }
    shutters(shut) { for (const s of this.area.ents) if (s.kind === 'door' && s.group === 'boss') s.shut = shut; }
    update() {
        if (!this.alive) return this.updateYarn();
        this.t++; if (this.flash > 0) this.flash--;
        const p = G.player, a = this.area, r = this.arena;
        if (!Script.blocking()) this.updatePillows(p);
        const inRoom = p.area === a && Cam.room === r && !Cam.busy;
        if (this.state === 'sleep') {
            if (inRoom && p.state === 'normal' && p.ty < r.y + r.h - 2) {
                this.state = 'fight'; this.st = 0; this.shutters(true); Music.play(bossSong('slumber'));
                /* (back in mid-fight: the room goes back the way the round left it) */
                if (this.phase > 1) { this.setArena(this.phase, true); G.shake = 6; Sfx.play('rumble'); this.tellRollLost(); }
                if (!Progress.flag('slumber_slothAwake')) { Progress.set('slumber_slothAwake'); Script.run(SlumberFoes.slothIntro(this)); }
            }
            return;
        }
        /* Wren flew home out of the room: the arms let go (a snapped one grows back), the doors open, the floor's as it was;
           back in, the round starts again */
        if (!inRoom && !p.flying) {
            if (p.pinned && this.arms.includes(p.pinned)) p.pinned = null;
            for (const arm of this.arms) { arm.state = 'rest'; arm.t = 0; arm.cool = 60; arm.hx = arm.sx; arm.hy = arm.sy + 6; }
            this.state = 'sleep'; this.shutters(false); Music.play('slumber'); this.lift = 0; this.sheepT = 0; this.pillows = [];
            if (this.phase > 1) this.setArena(1);
            return;
        }
        if (Script.blocking() || this.state === 'turn') return;
        this.st++;
        if (this.state === 'fight') {
            for (const arm of this.arms) this.updateArm(arm, p);
            /* she lobs pillows at anyone keeping out of reach: up over her head first (the tell), then thrown */
            const out = this.arms.every(arm => Math.hypot(p.x - arm.sx, p.y - arm.sy) > SLOTH.REACH * T);
            if (this.lift > 0) { if (--this.lift === 0) this.throwPillow(p); }
            else if (out && p.state === 'normal' && this.st % (this.hp === 1 ? 110 : 170) === 90) { this.lift = tellFor(5, this.phase); Sfx.play('warn'); }
            /* (3) counting sheep */
            if (this.phase === 3 && p.state !== 'faint' && ++this.sheepT > SLOTH.SHEEP) { this.sheepT = 0; this.sheep(p); }
            if (this.arms.every(arm => arm.state === 'snapped')) { this.state = 'slump'; this.st = 0; G.shake = 10; Sfx.play('rumble'); Fx.text(this.capX, this.capY - 30, 'z Z z', '#e8e0ff'); }
        } else if (this.state === 'slump') {
            if (this.st > 330) this.rise();
        }
    }
    updateArm(arm, p) {
        arm.t++;
        const reachPx = SLOTH.REACH * T, dWren = Math.hypot(p.x - arm.sx, p.y - 6 - arm.sy);
        const sp = 1.0 + (3 - this.hp) * 0.35;
        switch (arm.state) {
            case 'rest':
                this.toward(arm, arm.sx, arm.sy + 6, 2);
                if (arm.cool > 0) { arm.cool--; break; }
                /* only one arm out at a time to begin with */
                if (this.hp === 3 && this.arms.some(o => o !== arm && o.state !== 'rest' && o.state !== 'snapped')) break;
                /* her hand rises and spreads its fingers (the tell), then reaches */
                if (dWren < reachPx && p.state === 'normal' && !p.pinned) { arm.state = 'wind'; arm.t = 0; arm.tell = tellFor(5, this.phase); Sfx.play('warn'); }
                break;
            case 'wind':
                this.toward(arm, arm.sx, arm.sy - 6, 1);
                if (arm.t >= arm.tell) { arm.state = 'reach'; arm.t = 0; Sfx.play('twang'); }
                break;
            case 'reach':
                if (dWren > reachPx + 8 || p.state !== 'normal' || (p.pinned && p.pinned !== arm)) { arm.state = 'rest'; arm.cool = 40; break; }
                this.toward(arm, p.x, p.y - 6, sp);
                if (Math.hypot(p.x - arm.hx, p.y - 6 - arm.hy) < 7 && p.inv <= 0) { arm.state = 'hold'; arm.t = 0; p.pinned = arm; Sfx.play('hook'); Fx.text(p.x, p.y - 22, 'caught!', '#d8c8f8'); }
                break;
            case 'hold':
            case 'reel': {
                /* flown off (Homeward, a fall), or reeled off on the Hookline: the arm holds on and stretches after her */
                if (p.state === 'flight' || p.state === 'reel') { arm.state = 'drag'; p.pinned = null; break; }
                if (p.state === 'fall') break;
                if (p.pinned !== arm) { this.letGo(arm); break; }
                arm.hx = p.x; arm.hy = p.y - 6;
                /* held by the wrist, she can still turn about */
                if (!Script.blocking()) { const ax = Input.axis(); if (ax.x || ax.y) p.dir = ax.x < 0 ? LEFT : ax.x > 0 ? RIGHT : ax.y < 0 ? UP : DOWN; }
                if (arm.state === 'hold' && arm.t > 45) { arm.state = 'reel'; arm.t = 0; }
                if (arm.state === 'reel') {
                    /* reeled in to her bed */
                    const bx = this.capX, by = this.capY + 6, dx = bx - p.x, dy = by - p.y, d = Math.hypot(dx, dy);
                    if (d < 10) { this.tuckIn(arm, p); break; }
                    p.x += dx / d * 1.1; p.y += dy / d * 1.1;
                }
                break;
            }
            case 'drag':
                /* holding on while she flies off: pulled out past the stars, it snaps */
                arm.hx = p.x; arm.hy = p.y - 6;
                if (this.outside(p.x, p.y - 6)) { this.snap(arm); break; }
                if (p.state !== 'flight' && p.state !== 'reel') { if (p.state === 'normal') { arm.state = 'hold'; arm.t = 0; p.pinned = arm; } else this.letGo(arm); }
                break;
            case 'snapped':
                if (arm.t > 900) { arm.state = 'rest'; arm.cool = 60; Fx.sparkle(arm.sx, arm.sy, THREAD.mallow); }
                break;
        }
    }
    toward(arm, x, y, sp) { const dx = x - arm.hx, dy = y - arm.hy, d = Math.hypot(dx, dy); if (d <= sp) { arm.hx = x; arm.hy = y; } else { arm.hx += dx / d * sp; arm.hy += dy / d * sp; } }
    letGo(arm, quiet) { const p = G.player; if (p && p.pinned === arm) p.pinned = null; if (arm.state !== 'snapped') { arm.state = 'rest'; arm.cool = 60; } }
    snap(arm) {
        arm.state = 'snapped'; arm.t = 0; arm.dropX = arm.hx; arm.dropY = arm.hy + 6;
        const p = G.player; if (p && p.pinned === arm) p.pinned = null;
        Sfx.play('unravel'); Sfx.play('hitthing'); G.shake = 8; G.hitstop = 6;
        Fx.yarn(arm.hx, arm.hy, THREAD.mallow); Fx.text(arm.hx, arm.hy - 14, 'snap!', '#f7e08a');
        Stats.count('boss:sloth:snap');
    }
    tuckIn(arm, p) {
        p.pinned = null; this.letGo(arm);
        p.inv = 0; p.hurt(2, this.capX, this.capY - 20);
        Fx.text(p.x, p.y - 22, 'tucked in!', '#d8c8f8');
        arm.cool = 120;
    }
    /* one pillow, then two, then three, fanned out at her */
    throwPillow(p) {
        if (p.state !== 'normal' || p.pinned) return;
        const sx = this.capX, sy = this.capY - 10, sp = 1.6 + (3 - this.hp) * 0.3, n = this.phase, a0 = Math.atan2(p.y - 6 - sy, p.x - sx);
        /* (one always straight at her; the others either side of it) */
        for (const o of [0, 0.3, -0.3].slice(0, n)) { const a = a0 + o; this.pillows.push({ x: sx, y: sy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0 }); }
        Sfx.play('throw'); Stats.count('boss:sloth:pillow');
    }
    /* (3) she counts sheep: a row of the floor glows, and a flock of dream sheep bounds along it from one wall to the other,
       over the dark and all; it's Wren's row (unless she's held fast: then one she isn't on) */
    sheep(p) {
        const a = this.area, r = this.arena, rows = [];
        for (let y = r.y + 3; y < r.y + r.h - 1; y++) if (!(p.pinned && y === p.ty)) rows.push(y);
        const y = p.pinned ? rows[Math.floor(G.rng() * rows.length)] : clamp(p.ty, r.y + 3, r.y + r.h - 2);
        const tiles = []; for (let x = r.x + 1; x < r.x + r.w - 1; x++) { const k = a.kind(x, y); if (!k.solid && !k.pit) tiles.push([x, y]); }
        const fromLeft = G.rng() < 0.5, x0 = (fromLeft ? r.x : r.x + r.w) * T, x1 = (fromLeft ? r.x + r.w : r.x) * T;
        const live = 48, h = Hazard.tiles(this, tiles, { tell: tellFor(5, 3) + 14, live, dmg: 2, fx: 'dust', sound: 'snort', lookLanded: SlumberFoes.drawSheep });
        if (!h) return;
        h.flock = { y: y * T + 10, x0, x1 };
        /* (what hurts is the flock itself, where it's got to along the row) */
        h.coverAt = (x, yy, hz) => { const f = hz.flock, k = (hz.t - hz.tell) / live, lead = lerp(f.x0, f.x1, k), back = lead - Math.sign(f.x1 - f.x0) * 44; return tileOf(yy) === tileOf(f.y) && x >= Math.min(lead, back) - 6 && x <= Math.max(lead, back) + 6; };
        Stats.count('boss:sloth:sheep');
    }
    updatePillows(p) {
        for (const s of this.pillows) {
            s.t++; s.x += s.vx; s.y += s.vy;
            if (p.state === 'normal' && Math.abs(p.x - s.x) < 7 && Math.abs(p.y - 4 - s.y) < 8) { p.hurt(1, s.x - s.vx * 4, s.y - s.vy * 4); s.done = true; Fx.poof(s.x, s.y); }
            if (s.t > 220 || this.area.kind(tileOf(s.x), tileOf(s.y)).solid) { s.done = true; Fx.poof(s.x, s.y); }
        }
        this.pillows = this.pillows.filter(s => !s.done);
    }
    rise() {
        this.state = 'fight'; this.st = 0;
        for (const arm of this.arms) { arm.state = 'rest'; arm.t = 0; arm.cool = 30 + (arm.side > 0 ? 30 : 0); arm.hx = arm.sx; arm.hy = arm.sy + 6; }
        Sfx.play('rumble'); G.shake = 6;
    }
    struck(by, dmg, dir) {
        if (!this.alive || this.state !== 'slump' || this.flash > 0) return;
        this.hp--; this.flash = 30; G.hitstop = 8; G.shake = 8; Sfx.play('enemyhit');
        Fx.poof(this.capX, this.capY - 8);
        Stats.count('boss:sloth:knock');
        calmBlows(this); this.lift = 0; this.sheepT = 0;
        if (this.hp <= 0) return this.defeat();
        bossHeart(this.area, this.capX, this.capY + 36);       /* (a heart falls off the bed) */
        /* the next round: she wakes, and the room changes under her */
        this.state = 'turn'; this.st = 0; this.pillows = [];
        Script.run(SlumberFoes.slothTurn(this));
    }
    shoved() { }
    hooked(h) { Sfx.play('hookhit'); Fx.ring(this.x, this.y - 10); }
    defeat() {
        this.alive = false; this.yarnT = 0; this.trace = [[this.hx, this.hy]]; this.pillows = [];
        const p = G.player; if (p && p.pinned) p.pinned = null;
        Sfx.play('unravel'); Fx.yarn(this.capX, this.capY - 20, THREAD.mallow);
        Progress.set('slumber_boss');
        Script.run(SlumberFoes.slothDown(this));
    }
    draw(cx, cy) {
        for (const s of this.pillows) { Gfx.rect(s.x - cx - 4, s.y - cy - 3, 8, 6, '#fbf6ea'); Gfx.rect(s.x - cx - 4, s.y - cy + 2, 8, 1, '#d8c8f8'); }
        const bx = this.hx * T - cx - 40, by = this.hy * T - cy - 30;
        if (ART.sloth_bed) Gfx.img(ART.sloth_bed, bx, by);
        if (!this.alive) { if ((this.yarnT || 0) < 160) this.drawFeather(cx, cy, this.yarnT || 0); return; }
        /* where her arms can reach: a ring of little stars in the carpet */
        if (this.state !== 'sleep') {
            Gfx.alpha(0.6);
            for (const arm of this.arms) for (let i = 0; i < 48; i++) {
                const t = i / 48 * Math.PI * 2, x = arm.sx + Math.cos(t) * SLOTH.SNAP * T, y = arm.sy + Math.sin(t) * SLOTH.SNAP * T;
                if (this.arms.some(o => o !== arm && Math.hypot(x - o.sx, y - o.sy) < SLOTH.SNAP * T)) continue;
                Gfx.rect(x - cx, y - cy, 2, 2, '#f7e08a');
            }
            Gfx.alpha(1);
        }
        const body = spr(this.state === 'slump' ? 'sloth_slump' : this.state === 'sleep' ? 'sloth_sleep' : 'sloth_awake');
        const img = this.flash > 0 && (this.flash >> 1) % 2 ? tinted(body, '#ffffff') : body;
        if (img) Gfx.img(img, this.hx * T - cx + 8 - img.width / 2, this.hy * T - cy - 30 + (this.state === 'slump' ? 22 : 0) + Math.round(Math.sin(this.t / 40) * 1.5));
        /* pillows held up over her nightcap, about to be lobbed */
        if (this.lift > 0) for (let i = 0; i < this.phase; i++) { const px = this.capX - cx - 4 + (i - (this.phase - 1) / 2) * 10, py = this.capY - cy - 46 - ((this.t >> 3) % 2); Gfx.rect(px - 1, py - 1, 10, 8, PAL.ink); Gfx.rect(px, py, 8, 6, '#fbf6ea'); Gfx.rect(px, py + 5, 8, 1, '#d8c8f8'); }
        for (const arm of this.arms) this.drawArm(arm, cx, cy);
    }
    drawArm(arm, cx, cy) {
        if (this.state === 'sleep') return;
        if (arm.state === 'snapped') {
            Gfx.line(arm.sx - cx, arm.sy - cy, arm.sx - cx + arm.side * 4, arm.sy - cy + 10, '#8a6a4a');
            if (arm.t < 200) { Gfx.alpha(1 - arm.t / 200); this.drawHand(arm.dropX - cx, arm.dropY - cy, arm.side); Gfx.alpha(1); }
            return;
        }
        const x0 = arm.sx - cx, y0 = arm.sy - cy, x1 = arm.hx - cx, y1 = arm.hy - cy;
        /* a long furry arm: a thick line with a lavender thread through it */
        for (let o = -2; o <= 2; o++) Gfx.line(x0 + o * 0.5, y0 + o, x1 + o * 0.5, y1 + o, o === 0 ? '#a8845e' : '#7a5a3e');
        Gfx.line(x0, y0, x1, y1, THREAD.mallow);
        this.drawHand(x1, y1, arm.side, arm.state === 'wind');
        if (arm.state === 'wind' && (arm.t >> 2) % 2) Tells.bang(x1, y1 - 20);
    }
    /* what's left of her: a soft lavender feather that rocks to and fro as it drifts down off the bed, and sinks into
       the floor (drawn pixel by pixel at its tilt: a quill, a vane wider on one side, a notch or two in it) */
    drawFeather(cx, cy, t) {
        const k = Math.min(1, t / 130), fall = 1 - (1 - k) * (1 - k), sw = Math.sin(t / 16) * 9;
        const fx = Math.round(this.capX - cx + sw), fy = Math.round(this.capY - cy - 46 + fall * 50);
        const th = -0.35 + Math.cos(t / 16) * 0.5, ux = Math.cos(th), uy = Math.sin(th), L = 17;
        const a = t < 130 ? 1 : Math.max(0, 1 - (t - 130) / 30);
        if (a <= 0) return;
        Gfx.alpha((0.06 + 0.2 * fall) * a); Gfx.rect(fx - 6, Math.round(this.capY - cy + 5), 12, 2, PAL.ink);
        Gfx.alpha(a);
        /* 0 outside, 1/2 the vane above/below the shaft (in light and dark barbs), 3 the shaft, 4 the bare quill */
        const inside = (lx, ly) => {
            if (lx < 0 || lx > L) return 0;
            const s = lx / L, al = Math.abs(ly);
            if (s < 0.16) return al < 0.6 ? 4 : 0;
            const w = Math.pow(Math.sin(Math.min(1, (s - 0.16) / 0.82) * Math.PI), 0.7) * (ly < 0 ? 3 : 4.2);
            if ((ly < -1.4 && Math.abs(s - 0.5) < 0.04) || (ly > 1.6 && Math.abs(s - 0.7) < 0.04)) return 0;
            if (al < 0.55) return 3;
            return al <= w ? (ly < 0 ? 1 : 2) : 0;
        };
        const cols = { 1: ['#e6dafc', '#c9b3f0'], 2: ['#b49ae6', '#9a7ad8'], 3: ['#f8f4fe', '#f8f4fe'], 4: ['#d8c8f8', '#d8c8f8'] };
        for (let j = -11; j <= 11; j++) for (let i = -11; i <= 11; i++) {
            const lx = i * ux + j * uy + L / 2, ly = -i * uy + j * ux, v = inside(lx, ly);
            let col = v ? cols[v][Math.floor(lx - Math.abs(ly) * 0.9 + 20) % 3 === 0 ? 1 : 0] : null;
            if (!col && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([di, dj]) => inside((i + di) * ux + (j + dj) * uy + L / 2, -(i + di) * uy + (j + dj) * ux))) col = '#4b3a8a';
            if (col) Gfx.rect(fx + i, fy + j, 1, 1, col);
        }
        Gfx.alpha(1);
    }
    /* (spread: about to reach, its fingers splayed wide) */
    drawHand(x, y, side, spread) {
        Gfx.circle(x, y, 4, '#7a5a3e'); Gfx.circle(x, y, 3, '#a8845e');
        if (spread) { for (let i = -2; i <= 2; i++) Gfx.line(x + i * 2, y - 1, x + i * 4, y - 6, '#3e2e22'); return; }
        for (let i = -1; i <= 1; i++) Gfx.line(x + i * 2, y + 2, x + i * 3 + side, y + 6, '#3e2e22');
    }
}
SPAWN.mothersloth = (x, y, p) => Progress.flag('slumber_boss') ? new Ent('none') : new MotherSloth(x, y, p);

const SlumberFoes = {
    /* the dream sheep: three woolly sheep bounding along their row (over the dark too), where they've got to */
    drawSheep(x, y, h) {
        const f = h.flock, k = (h.t - h.tell) / h.live, cx = x - h.x, cy = y - h.y, dir = Math.sign(f.x1 - f.x0) || 1;
        for (let i = 0; i < 3; i++) {
            const sx = Math.round(lerp(f.x0, f.x1, k) - dir * i * 18 + cx), sy = Math.round(f.y + cy - 6 - Math.abs(Math.sin((h.t + i * 7) / 5)) * 5);
            Gfx.alpha(0.25); Gfx.rect(sx - 5, Math.round(f.y + cy), 10, 2, PAL.ink); Gfx.alpha(1);
            Gfx.circle(sx, sy, 6, PAL.ink); Gfx.circle(sx, sy, 5, '#fbf6ea'); Gfx.circle(sx - 2 * dir, sy - 2, 2, '#ffffff');
            Gfx.rect(sx + dir * 4 - 1, sy - 2, 4, 4, '#4a3a5a'); Gfx.rect(sx + dir * 5, sy - 1, 1, 1, '#ffffff');
            Gfx.rect(sx - 3, sy + 4, 1, 3, '#4a3a5a'); Gfx.rect(sx + 2, sy + 4, 1, 3, '#4a3a5a');
        }
    },
    *matronIntro(m) {
        yield 20;
        if (Progress.flag('matron_met')) { yield* say(null, '"LIGHTS OUT," says Matron Hush, bolt upright again. "I SAID. BACK. TO. BED."'); return; }
        Progress.set('matron_met');
        yield* say(null, 'Beside the starched bed by the wall, somebody stands bolt upright: a tall nurse in a cap, her eyes tight shut. "LIGHTS OUT," she says. "Back to bed. NOW."');
        yield* say(null, 'She gets up, still asleep, and comes after you, putting her feet exactly where you put yours. The doors swing shut.');
    },
    *matronDown(m) {
        const a = m.area;
        Music.play('silence');
        yield 40;
        yield* say(null, 'Matron Hush sighs, "Lights... out...", and unravels into a heap of lavender yarn that rolls under her own bed and stays there.');
        m.shutters(false);
        Sfx.play('appear');
        Music.play('slumber');
    },
    *slothIntro(s) {
        yield 20;
        yield* say(null, 'Something enormous hangs over the four-poster: a sloth as big as a haycart, upside down, in a nightcap, fast asleep. Its arms are very, very long.');
        yield* say(null, '"Mmmmh," it says, without opening its eyes. "Another one up past bedtime. Come here, dear. Come to bed. Nothing ever gets away from Mother."');
        yield* say(null, '"...Nothing except what\'s going home, anyway. Mmh."');
    },
    /* a round lost: she wakes with a start, thumps the mattress, and the room changes under her */
    *slothTurn(s) {
        yield 40;
        G.shake = 14; Sfx.play('rumble'); Sfx.play('crumble');
        s.setArena(s.phase, true);
        yield 40;
        if (s.phase === 2) yield* say(null, 'Mother Sloth yawns, enormously, and thumps the mattress. Out past the stars the floor drops away into the dark, all of it but a row of old boards along the bottom. "There," she murmurs. "Nowhere left to wander off to. Nowhere but bed."', { focus: s });
        else yield* say(null, 'She thumps the mattress again, harder, and the old boards drop into the dark after the rest. Only the bedposts they were laid across are left standing out there, ringed with brass. "Now then," she murmurs, and stretches. "No more of that."', { focus: s });
        s.tellRollLost();
        s.rise();
    },
    *slothDown(s) {
        const a = s.area;
        Music.play('silence');
        yield 50;
        /* the floor comes back up out of the dark, board by board */
        if (a.ents.some(e => e.slothBit) || s.far.some(([x, y]) => a.kind(x, y).pit)) { s.setArena(1, true); Sfx.play('appear'); yield 24; }
        yield* say(null, 'Mother Sloth lets go of everything at once with a long, long sigh, and unravels into soft lavender yarn that drifts down, slowly, like a feather, into the floor. Board by board, the floor comes back up out of the dark.');
        s.shutters(false);
        const br = a.rooms.find(r => r.key === '1,0');
        a.add(new Hoop(br.x + 15, br.y + 6));
        a.add(new Pickup((br.x + 4) * T, (br.y + 6) * T, { what: 'heartstitch', id: 'slumberHeart' }));
        Sfx.play('appear');
        Music.play('slumber');
    },
};

function initSlumberFoes() {
    ENEMY.matron = { hp: 2, r: 7, tall: 26, yarn: THREAD.mallow, harmless: true };
    ENEMY.mothersloth = { hp: 3, r: 10, tall: 30, yarn: THREAD.mallow, harmless: true, flies: true, swims: true };
    const mt = { g: '#b48ce8', G: '#8a64c4', w: '#fbf6ea', W: '#d8d0e8', s: '#f0c8a8', e: '#2a1f2d', h: '#8a8a8a' };
    const matron = (arms, eyes) => [
        '.....kkkkkk.....', '....kwwwwwwk....', '...kwwWwwWwwk...', '...kkkkkkkkkk...', '....khhhhhhk....', '....kssssssk....', '....k' + eyes + 'k....', '....kssssssk....', '.....kssssk.....',
        arms[0], arms[1], '..kgwwwwwwwwgk..', '..kgwwWwwWwwgk..', '..kgwwwwwwwwgk..', '..kggwwwwwwggk..', '..kgggwwwwgggk..', '..kggggggggggk..', '.kgggggggggggGk.', '.kggggggggggGGk.', '.kgggggggggGGGk.', '.kggggggggGGGGk.',
        '.kgggggggGGGGGk.', '.kGGGGGGGGGGGGk.', '..kkkkkkkkkkkk..', '...kWk....kWk...', '...kkk....kkk...', '................', '................'];
    defSprite('matron_0', matron(['kkkgggggggggkkkk', 'ksssgggggggsssk.'], 'eessee'), mt);
    defSprite('matron_1', matron(['.kkkgggggggkkkk.', '.ksssgggggsssk..'], 'eessee'), mt);
    defSprite('matron_sleep', matron(['...kgggggggk....', '...kgggggggk....'], 'eessee'), mt);
    defSprite('matron_daze', matron(['..kgggggggggk...', '.ksgggggggggsk..'], 'ssesse'), mt);
    ENEMY_DRAW.matron = () => null;
    /* her four-poster: turned posts, a canopy with a scalloped valance and a gold fringe, a long pillow and a patched quilt
       (she hangs over it, upside down), and velvet curtains down each side, tied back to the posts with gold cord */
    ART.sloth_bed = paintSprite(96, 60, x => {
        const R = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
        R('#5a3a2a', 4, 0, 5, 60); R('#5a3a2a', 87, 0, 5, 60); R('#7a4e32', 5, 0, 2, 60); R('#7a4e32', 88, 0, 2, 60);
        for (const px of [4, 87]) for (let y = 12; y < 54; y += 7) { R('#7a4e32', px, y, 5, 1); R('#3e2818', px, y + 1, 5, 1); }
        /* the drape at the back, behind the pillow (seen when she slumps) */
        R('#4b3a8a', 9, 9, 78, 22); for (let i = 11; i < 86; i += 6) { R('#5a46a0', i, 9, 2, 22); R('#3e2e6a', i + 3, 9, 1, 22); }
        R('#fbf6ea', 14, 30, 68, 10); R('#d8d0e8', 14, 38, 68, 2);
        R('#b48ce8', 9, 38, 78, 18); R('#9a76d8', 9, 44, 78, 1); R('#9a76d8', 9, 50, 78, 1); R('#d8c8f8', 9, 38, 78, 1);
        for (const [qx, qc] of [[12, '#f0b0c8'], [30, '#d8c8f8'], [62, '#f0b0c8'], [76, '#d8c8f8']]) { R(qc, qx, 46, 7, 4); R('#7d5bc4', qx, 50, 7, 1); }
        R('#5a3a2a', 4, 55, 88, 5); R('#7a4e32', 4, 55, 88, 1);
        R('#4b3a8a', 0, 0, 96, 6); R('#6a52b0', 0, 1, 96, 1); R('#7d5bc4', 1, 6, 94, 3);
        for (let i = 0; i < 9; i++) {
            const sx0 = 3 + i * 10;
            for (let k = 0; k < 10; k++) { const d = Math.round(Math.sqrt(Math.max(0, 22 - (k - 4.5) * (k - 4.5)))); R(i % 2 ? '#b48ce8' : '#9a76d8', sx0 + k, 9, 1, 1 + d); R(i % 2 ? '#8a64c4' : '#7d5bc4', sx0 + k, 9 + d, 1, 1); }
            R('#f7d64a', sx0 + 4, 15, 2, 2); R('#c8903a', sx0 + 4, 17, 2, 1);
        }
        R('#e8b04a', 1, 9, 94, 1);
        /* the curtains: folds of velvet from the canopy, gathered to the post by a gold cord, falling loose below it */
        for (const flip of [false, true]) {
            const X = v => flip ? 95 - v : v;
            for (let y = 7; y < 55; y++) {
                const inner = y < 27 ? Math.round(12 - (y - 7) * 5 / 20) : Math.round(7 + (y - 27) * 4 / 27);
                for (let v = 0; v <= inner; v++) {
                    const u = v / Math.max(1, inner), band = Math.min(3, Math.floor(u * 4));
                    const lit = flip ? 3 - band : band;
                    R(['#c4a0f0', '#9a76d8', '#b48ce8', '#6a4aa8'][lit], X(v), y, 1, 1);
                }
                R('#4b3a8a', X(inner), y, 1, 1);
            }
            for (let v = 0; v <= 8; v++) R(v % 2 ? '#c8903a' : '#f7d64a', X(v), 26, 1, 2);
            R('#f7d64a', X(flip ? 9 : 8), 28, 1, 5); R('#e8b04a', X(flip ? 8 : 9), 28, 1, 5); R('#c8903a', X(flip ? 9 : 8), 33, 2, 1);
        }
    });
    /* a nightstand beside the bed, a night-light on it */
    ART.nightstand = paintSprite(16, 22, x => {
        const R = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
        R('#7a4e32', 1, 9, 14, 13); R('#9a6438', 1, 9, 14, 2); R('#5a3a2a', 1, 20, 14, 2); R('#5a3a2a', 2, 14, 12, 1); R('#e8b04a', 7, 16, 2, 1);
        R('#5a3a2a', 2, 21, 2, 1); R('#5a3a2a', 12, 21, 2, 1);
        R('#c8903a', 6, 7, 4, 2); R('#e8b04a', 6, 7, 2, 1);
        R('#f7e08a', 5, 1, 6, 6); R('#fff4c0', 6, 2, 2, 2); R('#e8b04a', 5, 6, 6, 1);
    });
    const slothBody = (eyes, slump) => paintSprite(80, 56, x => {
        const R = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
        for (let j = 0; j < 56; j++) for (let i = 0; i < 80; i++) {
            const dx = (i - 40) / 32, dy = (j - 30) / 24, d = dx * dx + dy * dy;
            if (d > 1) continue;
            R(d > 0.85 ? '#5a4232' : hash2(i, j, 4) < 0.15 ? '#a8845e' : '#8a6a4a', i, j, 1, 1);
        }
        /* the face mask, and the nightcap */
        R('#d8c0a0', 26, 22, 28, 18); R('#3e2e22', 26, 26, 8, 5); R('#3e2e22', 46, 26, 8, 5);
        if (eyes) { R('#f7e08a', 29, 27, 2, 2); R('#f7e08a', 49, 27, 2, 2); } else { R('#d8c0a0', 28, 28, 5, 1); R('#d8c0a0', 47, 28, 5, 1); }
        R('#3e2e22', 37, 32, 6, 3); R('#7a5a3e', 36, 37, 8, 1);
        for (let j = 0; j < 16; j++) R(j % 4 === 3 ? '#7d5bc4' : '#b48ce8', 26 + Math.floor(j / 2), 8 + j - (slump ? 0 : 0), 28 - j, 1);
        R('#fbf6ea', 24, 22, 32, 3); R('#fbf6ea', 54, 4, 5, 5);
    });
    SPR.sloth_sleep = slothBody(false); SPR.sloth_awake = slothBody(true); SPR.sloth_slump = slothBody(false, true);
    ART.bed_big = paintSprite(32, 32, x => {
        const R = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
        R('#5a3a2a', 0, 0, 32, 32); R('#fbf6ea', 2, 2, 28, 28); R('#e0d8ec', 2, 12, 28, 1); R('#d8d0e8', 4, 4, 24, 6);
        R('#fbf6ea', 2, 14, 28, 15); for (let i = 0; i < 4; i++) R('#e8e0f0', 2, 16 + i * 4, 28, 1); R('#5a3a2a', 0, 29, 32, 3);
    });
    ART.crib = paintSprite(32, 22, x => {
        const R = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
        R('#c8a07a', 0, 6, 32, 2); R('#c8a07a', 0, 18, 32, 2); for (let i = 0; i < 32; i += 4) R('#c8a07a', i, 6, 2, 14);
        R('#d8c8f8', 2, 10, 28, 8); R('#7a4e32', 15, 0, 2, 6); R('#f7e08a', 8, 2, 3, 3); R('#f7e08a', 21, 2, 3, 3); R('#7a4e32', 9, 1, 14, 1);
    });
    ART.pillowpile = paintSprite(32, 20, x => {
        const R = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
        R('#fbf6ea', 1, 10, 16, 9); R('#d8c8f8', 15, 9, 16, 10); R('#f0d0e0', 7, 3, 16, 9);
        R('#d8d0e8', 1, 18, 16, 1); R('#b48ce8', 15, 18, 16, 1); R('#e0b0c8', 7, 11, 16, 1); R('#e8463c', 22, 0, 1, 4); R('#fbf6ea', 23, 0, 4, 2);
    });
    defSprite('toyblock', ['................', '..kkkkkkkkkkkk..', '.kyyyyyyyyyyyyk.', '.kyyrryyyybbyyk.', '.kyyrryyyybbyyk.', '.kyyyyyyyyyyyyk.', '.kyyyykkkkyyyyk.', '.kyyykYYYYkyyyk.', '.kyyykYYYYkyyyk.', '.kyyyykkkkyyyyk.', '.kyyyyyyyyyyyyk.', '.kyyggyyyyrryyk.', '.kyyggyyyyrryyk.', '.kYYYYYYYYYYYYk.', '..kkkkkkkkkkkk..', '................'],
        { y: '#f7d64a', Y: '#d9a33a', r: '#e8463c', b: '#4f9be0', g: '#5ac06a' });
    defSprite('basket', ['................', '................', '..kkkkkkkkkkkk..', '.kbBbBbBbBbBbBk.', '.kBwwwwwwwwwwbk.', '.kbwwddwwwwwwBk.', '.kBwwwwwwddwwbk.', '.kbwwwwwwwwwwBk.', '.kBbBbBbBbBbBbk.', '.kbBbBbBbBbBbBk.', '..kkkkkkkkkkkk..', '................', '................', '................', '................', '................'],
        { b: '#c8a068', B: '#9a7448', w: '#fbf6ea', d: '#d8c8f8' });
    ART.monogram_slumber = paintSprite(16, 10, x => { x.fillStyle = '#b48ce8'; x.beginPath(); x.arc(4, 5, 4, 0, Math.PI * 2); x.fill(); x.fillStyle = '#4b3a8a'; x.beginPath(); x.arc(6, 4, 3.5, 0, Math.PI * 2); x.fill(); x.fillStyle = '#7d5bc4'; x.fillRect(9, 2, 1, 6); x.fillRect(10, 2, 1, 1); x.fillRect(11, 3, 1, 4); x.fillRect(10, 7, 1, 1); x.fillRect(13, 2, 1, 6); x.fillRect(14, 3, 1, 1); x.fillRect(15, 2, 1, 6); }, false);
}
CONTENT_INIT.push(initSlumberFoes);
