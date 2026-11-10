/* The Marionette Hall's performers. Captain Tin, the drum major (mini-boss): marches back and forth between two
   painted flats, about-turning at each; knock one down as he comes and he marches on, into the trapdoor behind it;
   dazed in the trap, his tin hat is off: hit him (two knocks see him off). The Great Marionette (boss), in three acts:
   it dances on its marks (walk your two little wooden Wrens, one rack, right round its feet and the strings tangle: it
   falls, its head on the boards); it marches round the stage like a toy soldier, turning at whatever's in its way (put a
   puppet in its way so it turns onto the stage trap, which gives under anything heavy); its strings let out slack, its
   bar swinging low over the stage (hook the bar down, take up its strings like any rack's and walk it onto the trap
   yourself). Then the curtain. */

/* ---------------- Captain Tin ---------------- */
class Captain extends Enemy {
    constructor(tx, ty, p = {}) { super(tx, ty, Object.assign({ type: 'captain', hp: 2 }, p)); this.state = 'sleep'; this.st = 0; this.march = RIGHT; this.weightN = 3.5; this.twirl = 0; this.batonT = 120; }     /* (two knocks: a mini-boss shouldn't outstay its idea) */
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
            /* his one dangerous move: now and then he twirls his baton overhead (the line it'll fly lit on the floor) and
               flings it at Wren; it lies on its thread, then comes home along it to where he threw it from (a full heart,
               out or back) */
            if (this.twirl > 0) { if (--this.twirl === 0) this.fling(); return; }
            if (++this.batonT > 240 && p.state === 'normal' && !a.ents.some(e => e.kind === 'flung' && e.owner === this)) {
                this.batonT = 0; this.twirl = tellFor(6) + 4; this.aim = Flung.line(a, [this.tx, this.ty], [p.tx, p.ty], 7);
                Hazard.tiles(this, this.aim.slice(1), { tell: this.twirl, dmg: 0, live: 0 });
                Sfx.play('warn'); Stats.count('boss:tin:baton');
                return;
            }
            /* tile by tile: on to the next tile's middle, or about turn at anything standing there */
            const sp = 0.7 + (2 - this.hp) * 0.25;
            const gx = (this.tx + DX[this.march]) * T + 8, gy = this.ty * T + 10;
            const nx = this.tx + DX[this.march], k = a.kind(nx, this.ty);
            const blocked = k.solid || a.at(nx, this.ty) || a.blockers.some(b => b !== this && b.blocks(nx, this.ty, this));
            if (blocked && Math.abs(this.x - (this.tx * T + 8)) < sp + 0.5) { this.x = this.tx * T + 8; this.march = OPP[this.march]; Sfx.play('hitthing', 0.4); }
            else { this.x += DX[this.march] * sp; this.dir = this.march; this.anim++; }
            if (a.kind(this.tx, this.ty).pit && Math.abs(this.x - (this.tx * T + 8)) < 3) { this.state = 'fall'; this.st = 0; this.twirl = 0; calmBlows(this); Sfx.play('fall'); G.shake = 6; Stats.count('boss:tin:fall'); }
            if (p.state === 'normal' && Math.abs(p.x - this.x) < 11 && Math.abs(p.y - this.y) < 8) p.hurt(1, this.x, this.y);
        } else if (this.state === 'fall') {
            if (this.st > 20) { this.state = 'dazed'; this.st = 0; }
        } else if (this.state === 'dazed') {
            if (this.st > 240) this.climbOut();
        }
    }
    fling() { if (this.aim && this.aim.length > 1) { this.area.add(new Flung(this, this.aim, { pace: 2, back: 2, wait: 80, tell: 26, dmg: 2, col: THREAD.jory, look: MarionetteFoes.drawBaton })); Sfx.play('throw'); } this.aim = null; }
    climbOut() {
        this.state = 'march'; this.st = 0;
        this.x = this.hx * T + 8; this.y = this.hy * T + 10; this.march = this.march === RIGHT ? LEFT : RIGHT;
        Fx.dust(this.x, this.y); Sfx.play('land');
    }
    reset() {
        this.state = 'sleep'; this.st = 0; this.x = this.hx * T + 8; this.y = this.hy * T + 10; this.twirl = 0; this.batonT = 0;
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
        if (im) Gfx.img(im, x - 10, y - 22, this.march === LEFT);     /* (his boots on his shadow) */
        /* twirling his baton overhead, about to fling it */
        if (this.twirl > 0) { const a = G.t * 0.5; Gfx.line(x - Math.cos(a) * 7, y - 30 - Math.sin(a) * 3, x + Math.cos(a) * 7, y - 30 + Math.sin(a) * 3, '#e8b04a'); Gfx.rect(x + Math.round(Math.cos(a) * 7) - 1, y - 31 + Math.round(Math.sin(a) * 3), 2, 2, '#ffffff'); Tells.bang(x, y - 44); }
    }
}
SPAWN.captain = (x, y, p) => Progress.flag('marionette_tin') ? new Ent('none') : new Captain(x, y, p);

/* ---------------- The Great Marionette ---------------- */
/* Three acts (its hp, 3 to 1):
   I.   it dances on its marks: two little Wrens walked (one rack) right round its feet wind their strings round them;
        both tangled, it falls in a heap, its head on the boards to knock.
   II.  it climbs up its strings and marches round its stage like a toy soldier, a step a beat, turning right at anything in
        its way (Wren it just stamps past; and it doesn't look down, so a trap is no obstacle). Its stage is the boards from
        row STAGE[0] to STAGE[1]: the apron in front is past the end of its strings. The stage trap at centre stage gives
        under anything heavy (a sandbag shows it as the act begins): turned onto it, it drops in to the chin.
   III. back on its marks, its strings let out long and slack: it sags, a string wound round its feet slips straight off,
        and its control bar swings low over the stage. The Hookline brings the bar down to Wren; a crossbar's a crossbar,
        and its strings take up like any rack's: walked onto the trap (on its strings it won't step off an edge, but the
        trap's shut till it's on it), down it goes. Let go, the bar's hauled back up and it walks home to its marks. */
const GM = { STAGE: [5, 7], MARCH: 12, STEP: 12, BAR_HI: 0, BAR_LO: 25, BAR_WAIT: 240, DOWN: 420, TRAPPED: 360, SAG: 19, AWAY: 120, BAGS: [0, 240, 260, 230], SWEEP: 170, BATTEN: 210 };
/* Its blows (TELL[6]): sandbags out of the flies where Wren stands, their shadows first (one; then two; then three); in
   act I, dancing on its marks, its stick drawn back and swept along the boards in front of its feet (the boards lit
   first); marching, it stamps on whoever's on its beat; and in act III, its strings slack, the stage itself comes down on
   Wren: a batten crashing along a whole row of the stage (the row lit first; never the row she's working its strings
   from). All a full heart. Each act it's knocked into, a heart falls out of the flies. */
const TURN_RIGHT = [LEFT, UP, DOWN, RIGHT];     /* (marching down its right is left; left, up; right, down; up, right) */
class GreatMarionette extends Enemy {
    constructor(tx, ty, p = {}) {
        super(tx, ty, Object.assign({ type: 'greatmarionette', hp: 3 }, p));
        this.state = 'sleep'; this.st = 0; this.weightN = 9; this.noThread = true;
        /* its marks on the stage, where its two great feet stand */
        this.home = [[tx - 2, ty + 2], [tx + 3, ty + 2]];
        this.feet = this.home.map(f => f.slice());
        this.tangled = [false, false];
        this.wind = new Map();      /* puppet uid -> [winding round foot 0, foot 1] */
        this.bags = [];
        this.march = RIGHT; this.mv = null; this.stepN = 0;
        this.walk = [this.home[0].slice()];     /* act III: where it's been walked (its left foot), loops erased: its way home */
        this.awayT = 0; this.strain = 0; this.sweepT = 0; this.sweepCool = 60; this.battenT = 0;
        this.bar = null;            /* act III: { tx, ty, t, k } while the Hookline has its bar down by Wren */
        this.sag = 0; this.lowT = 0; this.inTrap = null;
    }
    onAdd(area) { area.add(new GMBar(this)); }
    get arena() { return this.area.roomAt(this.hx, this.hy); }
    get act() { return 4 - Math.max(1, Math.min(3, this.hp)); }
    /* (the Crossbar's string, held, runs to its head) */
    get px() { return this.x - 8; }
    get py() { return this.feet[0][1] * T - 46 + Math.round(this.sag); }
    get standing() { return this.state === 'dance' || this.state === 'march' || this.state === 'interval' || this.state === 'sleep'; }
    onTile() { return false; }
    feetOn() { return false; }
    blocks(x, y) { return this.alive && this.standing && this.feet.some(([fx, fy]) => fx === x && fy === y); }
    hurtBox() {
        if (!this.alive) return null;
        if (this.state === 'down') { const hx = (this.hx + 0.5) * T, hy = (this.hy + 4) * T; return { x0: hx - 14, x1: hx + 14, y0: hy - 12, y1: hy + 8 }; }
        if (this.state === 'trapped' && this.inTrap) { const [x, y] = this.inTrap; return { x0: x * T - 6, x1: x * T + 22, y0: y * T - 20, y1: y * T + 10 }; }
        return null;
    }
    hooked() { Sfx.play('hookhit'); }
    shutters(shut) { for (const s of this.area.ents) if (s.kind === 'door' && s.group === 'boss') s.shut = shut; }
    puppets() { return this.area.ents.filter(e => e.kind === 'puppet' && e.group === 'boss' && !e.removed); }
    trap() { return this.area.ents.find(e => e.kind === 'stagetrap' && !e.removed && this.area.roomAt(e.tx, e.ty) === this.arena); }
    third() { return this.area.ents.find(e => e.id === 'gsWrenC' && !e.removed); }
    syncXY() { const [[a, b], [c]] = this.feet; this.x = ((a + c) / 2 + 0.5) * T; this.y = (b - 2) * T + 10; }
    /* is Wren facing it (reaching for its strings from the boards)? */
    faces(p) { const dx = this.x - p.x, dy = this.y - 20 - p.y; return DX[p.dir] * dx + DY[p.dir] * dy > 8 && Math.hypot(dx, dy) < 9 * T; }
    update() {
        if (!this.alive) return this.updateYarn();
        this.t++; if (this.flash > 0) this.flash--;
        const p = G.player, a = this.area, r = this.arena;
        this.animate();
        if (!Script.blocking()) this.updateBags(p);
        if (this.state === 'sleep') {
            if (p.area === a && Cam.room === r && !Cam.busy && p.state === 'normal' && p.ty < r.y + r.h - 1) this.begin();
            return;
        }
        if (p.area !== a || (Cam.room !== r && !p.flying && !Cam.busy)) { this.reset(); return; }
        if (Script.blocking()) return;
        this.st++;
        switch (this.state) {
            case 'dance':
                if (this.act === 1) {
                    this.windUp();
                    this.dropBags(p, GM.BAGS[1]);
                    this.sweep(p);
                    if (this.tangled[0] && this.tangled[1]) { this.state = 'down'; this.st = 0; this.sweepT = 0; calmBlows(this); G.shake = 14; Sfx.play('rumble'); Sfx.play('hitthing'); Stats.count('boss:gm:fall'); }
                } else { this.actThree(); this.dropBags(p, GM.BAGS[3]); this.batten(p); }
                break;
            case 'down': if (this.st > GM.DOWN) this.rise(); break;
            case 'march': this.marchOn(p); this.dropBags(p, GM.BAGS[2]); break;
            case 'trapped': if (this.st > GM.TRAPPED) this.climbOut(); break;
        }
    }
    /* (things that move whatever's going on: its step, its sag, the third Wren coming down or going up) */
    animate() {
        const m = this.mv;
        if (m && ++m.t >= m.dur) { this.mv = null; this.landed(); }
        const act3 = this.act === 3 && this.standing && this.state !== 'sleep';
        this.sag = approach(this.sag, act3 ? GM.SAG : 0, 0.5); this.lowT = approach(this.lowT, act3 ? 1 : 0, 0.02);
        if (this.bar) this.bar.k = Math.min(1, this.bar.k + 0.08);
        const c = this.third();
        if (c && c.dropY > 0) c.dropY = Math.max(0, c.dropY - 3);
        if (c && c.hauled) { c.hauled += 4; if (c.hauled > 110) { Fx.poof(c.px + 8, c.py - 60); this.area.remove(c); } }
    }
    /* the curtain goes up (or back up, on whichever act it had got to) */
    begin() {
        this.state = this.act === 2 ? 'march' : 'dance'; this.st = 0; this.march = LEFT;
        this.shutters(true); Music.play(bossSong('marionette'));
        if (!Progress.flag('marionette_gmAwake')) { Progress.set('marionette_gmAwake'); Script.run(MarionetteFoes.gmIntro(this)); }
        else if (this.act === 2) this.lowerThird(true);
    }
    reset() {
        this.state = 'sleep'; this.st = 0; this.shutters(false); this.untangle(); this.bags = [];
        this.feet = this.home.map(f => f.slice()); this.mv = null; this.walk = [this.home[0].slice()]; this.awayT = 0;
        this.bar = null; this.inTrap = null; this.heldBy = null; this.worked = false; this.sag = 0; this.lowT = 0; this.sweepT = 0; this.sweepCool = 60; this.battenT = 0;
        const t = this.trap(); if (t) t.shut(true);
        const c = this.third(); if (c) this.area.remove(c);
        this.syncXY();
        Music.play('marionette');
    }
    /* how far each puppet has gone round each foot: a full lap ties that foot's string (in act III, slack, it slips off) */
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
                    if (this.act === 3) { w.sum[i] = 0; Fx.text(fx * T + 8, fy * T - 10, 'slips off!', '#cfc6b8'); Sfx.play('unclick'); return; }
                    this.tangled[i] = true; Sfx.play('twang'); G.shake = 4;
                    Fx.text(fx * T + 8, fy * T - 10, 'tangled!', '#f7d64a');
                }
            });
        }
    }
    untangle() { this.tangled = [false, false]; this.wind.clear(); }
    /* sandbags drop out of the flies where Wren stands, now and then (a shadow first) */
    /* sandbags out of the flies where Wren stands (and, later on, either side of her): their shadows first */
    dropBags(p, every) {
        if (!(this.st > every && this.st % every === 100 && p.state === 'normal' && p.area === this.area)) return;
        const n = this.act, side = G.rng() < 0.5 ? -1 : 1;
        [[0, 0], [side * 24, -8], [-side * 20, 14]].slice(0, n).forEach(([dx, dy]) => this.bags.push({ x: p.x + dx, y: p.y + dy, t: 0 }));
        Sfx.play('warn'); Stats.count('boss:gm:bags');
    }
    /* (I) close in front of its feet: its stick drawn back, the boards there lit, then swept along them */
    sweep(p) {
        if (this.sweepT > 0) { this.sweepT--; return; }
        if (++this.sweepCool < GM.SWEEP || p.state !== 'normal' || p.area !== this.area) return;
        const z = this.sweepZone();
        if (!z.some(([x, y]) => p.tx === x && p.ty === y)) return;
        this.sweepCool = 0; this.sweepT = tellFor(6, 1) + 10;
        Hazard.tiles(this, z, { tell: tellFor(6, 1), dmg: 2, live: 10, fx: 'dust', shake: 5, sound: 'hitthing', from: [(this.feet[0][0] + this.feet[1][0] + 1) / 2 * T, this.feet[0][1] * T] });
        Stats.count('boss:gm:sweep');
    }
    sweepZone() {
        const a = this.area, [[lx, ly], [rx]] = this.feet, z = [];
        for (let y = ly + 1; y <= ly + 2; y++) for (let x = lx - 1; x <= rx + 1; x++) if (!a.kind(x, y).solid && !a.at(x, y)) z.push([x, y]);
        return z;
    }
    /* (III) the stage comes down: a batten crashes along a whole row of it (never the row she's working its strings from) */
    batten(p) {
        if (++this.battenT < GM.BATTEN || p.state !== 'normal' || p.area !== this.area) return;
        this.battenT = 0;
        const a = this.area, r = this.arena, rows = [];
        for (let y = r.y + 2; y < r.y + r.h - 1; y++) if (!(this.heldBy && y === p.ty)) rows.push(y);
        const y = this.heldBy || !rows.includes(p.ty) ? rows[Math.floor(G.rng() * rows.length)] : p.ty;
        const tiles = []; for (let x = r.x + 1; x < r.x + r.w - 1; x++) if (!a.kind(x, y).solid) tiles.push([x, y]);
        Hazard.tiles(this, tiles, { tell: tellFor(6, 3) + 12, dmg: 2, live: 8, fx: 'dust', shake: 8, sound: 'land', look: GMArt.batten });
        Stats.count('boss:gm:batten');
    }
    updateBags(p) {
        const t = this.trap();
        for (const b of this.bags) {
            b.t++;
            if (b.t !== 60) continue;
            Sfx.play('land'); Fx.dust(b.x, b.y);
            if (p.state === 'normal' && p.area === this.area && Math.abs(p.x - b.x) < 10 && Math.abs(p.y - b.y) < 9) { const hp = Inv.hp; p.hurt(2, b.x, b.y - 4); if (Inv.hp < hp && Crossbar.ctl) Crossbar.release(p); }
            /* (a sandbag's heavy: landing on the stage trap, it goes straight through) */
            else if (t && !t.open && tileOf(b.x) === t.tx && tileOf(b.y) === t.ty) { t.drop('bag'); b.gone = true; }
        }
        this.bags = this.bags.filter(b => b.t < 80 && !b.gone);
    }
    /* act I, missed: it pulls itself up again, and the little Wrens head home */
    rise() {
        this.state = 'dance'; this.st = 0; this.untangle();
        for (const e of this.puppets()) if (!e.heldBy && e.ret && e.ret.state !== 'home') { e.ret.state = 'returning'; e.ret.timer = 0; }
        Sfx.play('rumble'); G.shake = 6;
    }
    /* can its feet both step a tile that way? On its stage, nothing standing there; walked on its strings, not over an edge
       and not onto Wren (marching, it stamps past her and doesn't look down) */
    canStep(d, marching) {
        const a = this.area, r = this.arena, p = G.player;
        for (const [fx, fy] of this.feet) {
            const nx = fx + DX[d], ny = fy + DY[d];
            if (ny < r.y + GM.STAGE[0] || ny > r.y + GM.STAGE[1] || nx <= r.x || nx >= r.x + r.w - 1) return false;
            const k = a.kind(nx, ny);
            if (k.solid || (k.pit && !marching)) return false;
            if (a.at(nx, ny) || a.blockers.some(b => b !== this && b.blocks(nx, ny, this))) return false;
            if (!marching && p && p.area === a && p.onTile(nx, ny)) return false;
        }
        return true;
    }
    moveFeet(d, dur, home) {
        for (const f of this.feet) { f[0] += DX[d]; f[1] += DY[d]; }
        this.mv = { d, t: 0, dur }; this.stepN++;
        this.syncXY();
        if (!home) { const [x, y] = this.feet[0], w = this.walk, i = w.findIndex(q => q[0] === x && q[1] === y); if (i >= 0) w.length = i + 1; else w.push([x, y]); }
        Sfx.play('land', 0.4); G.shake = Math.max(G.shake, 2);
    }
    /* a foot come down on the stage trap: it gives */
    landed() {
        const t = this.trap();
        if (!t || !this.standing) return;
        if (this.feet.some(([fx, fy]) => fx === t.tx && fy === t.ty)) { t.drop(this); this.fallIn(t); }
    }
    /* act II: a step a beat, straight on; anything in the way and it turns right */
    marchOn(p) {
        if (this.mv || this.st % GM.MARCH) return;
        const d = this.march;
        if (!this.canStep(d, true)) { this.march = TURN_RIGHT[d]; Sfx.play('hitthing', 0.25); return; }
        this.moveFeet(d, GM.MARCH - 2);
        this.stomp(p);
    }
    stomp(p) {
        if (!p || p.area !== this.area || p.state !== 'normal') return;
        for (const [fx, fy] of this.feet) if (p.onTile(fx, fy)) { const hp = Inv.hp; p.hurt(2, fx * T + 8, fy * T + 8); p.unstick(); if (Inv.hp < hp && Crossbar.ctl) Crossbar.release(p); break; }
    }
    /* down the trap, to the chin: its head's on the boards */
    fallIn(t) {
        this.state = 'trapped'; this.st = 0; this.inTrap = [t.tx, t.ty]; this.bags = []; this.bar = null;
        if (Crossbar.ctl && Crossbar.ctl.giant) Crossbar.release(G.player);
        this.heldBy = null; this.worked = false;
        G.shake = 12; Sfx.play('fall'); Sfx.play('rumble'); Fx.dust(t.tx * T + 8, t.ty * T + 12);
        Stats.count('boss:gm:trap');
    }
    /* out of the trap and back on its marks (and on with its act) */
    climbOut(quiet) {
        const t = this.trap(); if (t) t.shut();
        this.inTrap = null; this.mv = null; this.feet = this.home.map(f => f.slice()); this.walk = [this.home[0].slice()]; this.awayT = 0; this.syncXY();
        const p = G.player;
        if (!quiet) { this.stomp(p); this.state = this.act === 2 ? 'march' : 'dance'; this.st = 0; this.march = LEFT; }
        else if (p && p.area === this.area) for (const [fx, fy] of this.feet) if (p.onTile(fx, fy)) p.unstick();
        for (const [fx, fy] of this.feet) Fx.dust(fx * T + 8, fy * T + 12);
        Sfx.play('land'); G.shake = 6;
    }
    /* act III: hooked, its bar comes down to hang in front of Wren a while; taken up, Wren walks it (step); let go, the bar
       goes back up and it walks home after a moment, the way it was walked */
    actThree() {
        this.windUp();
        const b = this.bar;
        if (b && !this.heldBy && --b.t <= 0) { this.bar = null; Sfx.play('twang'); Fx.ring(b.tx * T + 8, b.ty * T - 10, '#cfc6b8'); }
        if (this.heldBy || this.mv) { this.awayT = 0; return; }
        if (this.walk.length < 2 || ++this.awayT < GM.AWAY || this.awayT % GM.STEP) return;
        const [x, y] = this.walk[this.walk.length - 2], d = dirOf(x - this.feet[0][0], y - this.feet[0][1]);
        if (this.canStep(d, false)) { this.walk.pop(); this.moveFeet(d, GM.STEP, true); this.strain = 0; }
        /* (something's sat down in its way for good: the strings haul it straight back onto its marks) */
        else if (++this.strain > 10) { this.strain = 0; this.climbOut(true); }
    }
    pullBar(h) {
        const p = h.p, f = p.front();
        this.bar = { tx: f.tx, ty: f.ty, t: GM.BAR_WAIT, k: 0 };
        Sfx.play('tug'); G.shake = 3;
        Stats.count('boss:gm:bar');
    }
    /* taken up on the Crossbar: a step for every step (both feet, or not at all) */
    step(d) {
        if (this.mv || this.state !== 'dance' || this.act !== 3 || !this.bar) return false;
        if (!this.canStep(d, false)) return false;
        this.moveFeet(d, GM.STEP);
        return true;
    }
    letGo() { if (this.state === 'dance' && this.bar) this.bar.t = Math.min(this.bar.t, 40); this.awayT = 0; }
    /* the third little Wren, on a string of its own, let down onto the apron (or quickly, coming back to the fight) */
    lowerThird(quick) {
        if (this.third()) return;
        const a = this.area, r = this.arena, p = G.player;
        const spot = [[16, 8], [16, 9], [15, 8], [17, 8]].map(([x, y]) => [r.x + x, r.y + y]).find(([x, y]) => !a.at(x, y) && !(p && p.onTile(x, y))) || [r.x + 16, r.y + 8];
        const c = a.add(new Puppet(spot[0], spot[1], { id: 'gsWrenC', look: 'puppet_wren' }));
        c.dropY = quick ? 0 : 96;
        const d0 = c.draw;
        c.draw = function (cx, cy) {
            const k = (this.dropY || 0) + (this.hauled || 0);
            /* its own string, up into the flies */
            Gfx.alpha(0.85); Gfx.line(this.px - cx + 8, -2, this.px - cx + 8, this.py - cy - k - 13, '#cfc6b8'); Gfx.alpha(1);
            d0.call(this, cx, cy + k);
        };
        Sfx.play('twang');
    }
    struck(by, dmg, dir) {
        if (!this.alive || this.flash > 0 || (this.state !== 'down' && this.state !== 'trapped')) return;
        this.hp--; this.flash = 30; G.hitstop = 10; G.shake = 10; Sfx.play('enemyhit');
        Stats.count('boss:gm:hit');
        calmBlows(this); this.bags = []; this.sweepT = 0; this.sweepCool = 0; this.battenT = 0;
        if (this.hp <= 0) return this.defeat();
        { const p = G.player; bossHeart(this.area, p.x, p.y + 18); }      /* (a heart falls out of the flies) */
        Script.run(this.hp === 2 ? MarionetteFoes.toAct2(this) : MarionetteFoes.toAct3(this));
    }
    shoved() { }
    defeat() {
        this.alive = false; this.yarnT = 0; this.trace = [[this.hx, this.hy]]; this.bags = []; this.bar = null; this.inTrap = null;
        if (Crossbar.ctl) Crossbar.release(G.player);
        const t = this.trap(); if (t) t.shut(true);
        const c = this.third(); if (c) { Fx.poof(c.px + 8, c.py + 4); this.area.remove(c); }
        Sfx.play('unravel');
        Script.run(MarionetteFoes.curtain(this));
    }
    draw(cx, cy) { this.drawBody(cx, cy); }
    /* the sandbags, and its bar when it's down by Wren: drawn over everything (src: TOOLS._gmBags) */
    drawBags(cx, cy) {
        for (const b of this.bags) {
            const k = Math.min(1, b.t / 60);
            Gfx.alpha(0.2 + 0.3 * k); Gfx.circle(b.x - cx, b.y - cy + 2, Math.round(4 + 4 * k), PAL.ink); Gfx.alpha(1);
            if (b.t < 60) { const y = b.y - cy - 120 * (1 - k); Gfx.line(b.x - cx, y - 40, b.x - cx, y - 6, '#cfc6b8'); Gfx.rect(b.x - cx - 4, y - 8, 8, 9, '#a88a5a'); }
            else Gfx.rect(b.x - cx - 4, b.y - cy - 6, 8, 7, '#a88a5a');
        }
        if (this.alive && this.standing && (this.bar || this.heldBy)) this.drawStrings(cx, cy, true);
    }
    /* where its bar is drawn (on the screen): up over the stage, hooked down in front of Wren, or in her hands */
    barAt(cx, cy, mx) {
        const top = this.arena.y * T - cy + Math.round(lerp(GM.BAR_HI, GM.BAR_LO, this.lowT));
        const p = G.player;
        if (this.heldBy && p) return [Math.round(p.x - cx), Math.round(p.y - cy - 25), 0.45];
        const b = this.bar;
        if (b) { const k = b.k * b.k * (3 - 2 * b.k), tx = b.tx * T + 8 - cx, ty = b.ty * T - 4 - cy; return [Math.round(lerp(mx, tx, k)), Math.round(lerp(top, ty, k)), 1 - 0.5 * k]; }
        return [Math.round(mx), top, 1];
    }
    /* its strings: from the bar to its head, hands and knees; slack in act III (sagging between) */
    drawStrings(cx, cy, over) {
        const g = this.geom; if (!g) return;
        const [bar, barY, wide] = this.barAt(cx, cy, g.mx);
        const low = !!(this.bar || this.heldBy);
        if (low !== over) return;
        const SL = '#cfc6b8', slack = this.act === 3 && !this.heldBy, half = Math.round(36 * wide);
        const str = (x0, y0, x1, y1, col = SL) => {
            if (!slack) return Gfx.line(x0, y0, x1, y1, col);
            const mxx = (x0 + x1) / 2, myy = (y0 + y1) / 2 + 7;
            Gfx.line(x0, y0, mxx, myy, col); Gfx.line(mxx, myy, x1, y1, col);
        };
        g.knees.forEach(([sx, sy], i) => str(sx, sy, bar + (i ? 1 : -1) * Math.round(35 * wide), barY + 2, this.tangled[i] ? '#f7d64a' : SL));
        str(bar, barY + 7, g.headX, g.headY);
        g.hands.forEach(([hx, hy], i) => str(bar + (i ? 15 : -15) * wide, barY + 3, hx, hy - 2));
        const R = (c, x, y, w, h) => Gfx.rect(x, y, w, h, c);
        /* the rope it hangs from runs on up into the flies (held, it's in Wren's hands) */
        if (!this.heldBy) R(SL, bar, -12, 1, barY + 10);
        R(PAL.ink, bar - half - 1, barY - 1, half * 2 + 3, 5); R('#9a6438', bar - half, barY, half * 2 + 1, 3); R('#c9925a', bar - half, barY, half * 2 + 1, 1); R('#6b4128', bar - half, barY + 2, half * 2 + 1, 1);
        R(PAL.ink, bar - 2, barY - 4, 5, 13); R('#9a6438', bar - 1, barY - 3, 3, 11); R('#c9925a', bar - 1, barY - 3, 1, 11);
        for (const ex of [-half, half, -Math.round(15 * wide), Math.round(15 * wide)]) R('#e8b04a', bar + ex, barY + 1, 1, 1);
    }
    drawBody(cx, cy) {
        if (!this.alive) return;
        const flash = this.flash > 0 && (this.flash >> 1) % 2;
        if (this.state === 'trapped') return this.drawTrapped(cx, cy, flash);
        if (this.state === 'down') {
            const im = ART.gm_down; if (!im) return;
            const dx = Math.round((this.hx + 0.5) * T - cx - im.width / 2), dy = (this.hy + 2) * T - cy + 40 - im.height;
            /* its strings, gone slack, sagging down from the flies to its hands */
            for (const [hx, side] of [[25, -1], [72, 1]]) { const mid = Math.round(dy / 2); Gfx.line(dx + hx + side * 6, -10, dx + hx + side * 9, mid, '#cfc6b8'); Gfx.line(dx + hx + side * 9, mid, dx + hx, dy + 43, '#cfc6b8'); }
            Gfx.img(flash ? tinted(im, '#ffffff') : im, dx, dy);
            return;
        }
        /* a great wooden you on strings: a carved head with your hair and a painted face, your scarf, jointed arms and
           legs pegged at every joint, a stick in its hand; its feet stand on the stage, and every string runs up to the
           control bar overhead. Marching, it lifts a foot a step; in act III it sags on its slack strings, knees out */
        const t = this.t, act3 = this.act === 3, march = this.state === 'march';
        const dance = !march, sway = dance && !act3 ? Math.round(Math.sin(t / 20) * 3) : act3 ? Math.round(Math.sin(t / 34)) : 0;
        const R = (c, x, y, w, h) => Gfx.rect(x, y, w, h, c);
        const m = this.mv, k = m ? 1 - m.t / m.dur : 0;
        const F = this.feet.map(([fx, fy]) => [Math.round((fx - (m ? DX[m.d] * k : 0)) * T - cx), Math.round((fy - (m ? DY[m.d] * k : 0)) * T - cy)]);
        const sag = Math.round(this.sag);
        const mx = (F[0][0] + F[1][0]) / 2 + 8 + sway, top = F[0][1] - 74 + sag;
        const hop = dance && !act3 ? Math.round(Math.abs(Math.sin(t / 20)) * 2) : march && m ? Math.round(Math.sin((1 - k) * Math.PI) * 2) : 0;
        const sw = dance && !act3 ? Math.sin(t / 10) : march ? Math.sin(this.stepN * Math.PI / 2 + (m ? (1 - k) * Math.PI / 2 : 0)) : Math.sin(t / 30) * 0.4;
        const im = ART.gm_body, bx = Math.round(mx) - 18, by = top + 6 - hop;
        const knees = [];
        /* the legs: a hip peg, a thigh, a knee peg (the knees kick out as it dances), a shin down to the boot */
        F.forEach(([fx, fy], i) => {
            const lift = march && m && (this.stepN & 1) === i ? Math.round(Math.sin((1 - k) * Math.PI) * 5) : 0;
            const sx = fx + 8, sy = fy + 6 - lift, side = i ? 1 : -1;
            const hx = bx + (i ? 23 : 12), hy = by + 47, ax = sx, ay = sy - 5;
            const kick = 5 + (dance && !act3 ? Math.sin(t / 10 + i * Math.PI) * 3 : 0) + lift * 0.6;
            const kx = Math.round((hx + ax) / 2 + side * (kick * 0.4 + sag * 0.5)), ky = Math.round((hy + ay) / 2 - kick - sag * 0.4);
            knees.push([sx, sy - 7]);
            Gfx.img(spr('gm_foot'), sx - 8, sy - 10);
            GMArt.rod(R, kx, ky, ax, ay, 2, '#3a5fae', '#5a80c8');
            GMArt.rod(R, hx, hy, kx, ky, 2, '#3a5fae', '#5a80c8');
            GMArt.peg(R, kx, ky); GMArt.peg(R, hx, hy);
        });
        if (im) Gfx.img(flash ? tinted(im, '#ffffff') : im, bx, by);
        /* the arms: sleeves to the elbow pegs, wooden forearms and hands; the right hand holds the stick */
        /* (about to sweep: its stick hand drawn right back and up) */
        const wind = this.sweepT > 10 ? Math.min(1, (tellFor(6, 1) + 10 - this.sweepT) / 8) : 0;
        const arms = [[bx + 9, by + 29, -1, sw], [bx + 26, by + 29, 1, -sw - wind * 4]];
        if (wind) Tells.bang(bx + 18, by - 14);
        const hands = [];
        for (const [sx, sy, side, s] of arms) {
            const ex = sx + side * 6, ey = sy + 7 + Math.round(s * 2), hx = sx + side * (side > 0 ? 9 : 8), hy = sy + (side > 0 ? 12 : 15) + Math.round(s * 3);
            hands.push([hx, hy]);
            if (side > 0) GMArt.rod(R, hx + 3, hy - 17, hx - 2, hy + 12, 1, '#9a6438', '#c9925a');
            GMArt.rod(R, ex, ey, hx, hy, 1, '#ecc895', '#fff0d0');
            GMArt.rod(R, sx, sy, ex, ey, 2, '#e7ad3c', '#f4c860');
            GMArt.peg(R, ex, ey); GMArt.peg(R, sx, sy);
            GMArt.disc(R, hx, hy, 3, PAL.ink); GMArt.disc(R, hx, hy, 2, '#ecc895'); R('#fff0d0', hx - 1, hy - 1, 1, 1); R('#d4a46a', hx + 1, hy + 1, 1, 1);
        }
        this.geom = { mx, knees, hands, headX: bx + 18, headY: by + 1 };
        this.drawStrings(cx, cy, false);
        /* the puppets' strings round its feet: where each little Wren has been, faintly */
        for (const e of this.puppets()) {
            const w = this.wind.get(e.uid); if (!w) continue;
            this.feet.forEach(([fx, fy], i) => { const f = Math.min(1, Math.abs(w.sum[i]) / (Math.PI * 2)); if (f > 0.2) { Gfx.alpha(0.6); Gfx.circle(fx * T - cx + 8, fy * T - cy + 8, Math.round(6 + 6 * f), THREAD.jory); Gfx.alpha(1); } });
        }
    }
    /* down the stage trap to the chin: its head on the boards, its arms flung out either side, its strings slack */
    drawTrapped(cx, cy, flash) {
        const [tx, ty] = this.inTrap || this.home[0], im = ART.gm_body;
        const x = tx * T + 8 - cx, y = ty * T - cy, R = (c, a, b, w, h) => Gfx.rect(a, b, w, h, c);
        for (const s of [-1, 1]) { Gfx.line(x + s * 30, -10, x + s * 26, y - 6, '#cfc6b8'); Gfx.line(x + s * 26, y - 6, x + s * 22, y + 4, '#cfc6b8'); }
        Gfx.line(x + 1, -10, x, y - 18, '#cfc6b8');
        for (const side of [-1, 1]) {
            const sx = x + side * 7, sy = y + 3, ex = x + side * 15, ey = y + 4, hx = x + side * 22, hy = y + 6;
            GMArt.rod(R, sx, sy, ex, ey, 2, '#e7ad3c', '#f4c860'); GMArt.rod(R, ex, ey, hx, hy, 1, '#ecc895', '#fff0d0'); GMArt.peg(R, ex, ey);
            GMArt.disc(R, hx, hy, 3, PAL.ink); GMArt.disc(R, hx, hy, 2, '#ecc895'); R('#fff0d0', hx - 1, hy - 1, 1, 1);
        }
        GMArt.rod(R, x + 14, y + 9, x + 34, y + 2, 1, '#9a6438', '#c9925a');
        if (im) Gfx.sub(flash ? tinted(im, '#ffffff') : im, 0, 0, 36, 27, x - 18, y - 19);
        if ((this.t >> 3) % 2) { Font.draw('*', x - 14, y - 26, '#f7d64a'); Font.draw('*', x + 10, y - 22, '#f7d64a'); }
    }
}
/* the Great Marionette's control bar, for the Hookline to catch: only in its third act, low over the stage (before then
   it's up in the flies, out of anyone's reach) */
class GMBar extends Ent {
    constructor(g) { super('gmbar'); this.g = g; }
    get x() { return this.g.x; }
    get y() { return this.g.y; }
    hurtBox() {
        const g = this.g;
        if (!g.alive || g.state !== 'dance' || g.act !== 3 || g.lowT < 1 || g.bar || g.heldBy) return null;
        const bx = ((g.feet[0][0] + g.feet[1][0]) / 2 + 0.5) * T, by = g.arena.y * T + GM.BAR_LO;
        return { x0: bx - 34, x1: bx + 34, y0: by - 4, y1: by + 9 };
    }
    hooked(h) { this.g.pullBar(h); }
    struck() { Sfx.play('hitthing', 0.4); }
}

/* the stage trap: a hatch let into the boards at centre stage. It holds anyone standing on it (a person, a puppet); anything
   heavy (a sandbag, the Great Marionette's foot) and down it drops; it swings shut again once it's empty */
class StageTrap extends Ent {
    constructor(tx, ty, p = {}) { super('stagetrap', p); this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T; this.floor = true; this.openT = 0; this.holding = null; }
    get sortY() { return -1000 + this.y; }
    get open() { return this.openT > 0 || !!this.holding; }
    drop(what) {
        const a = this.area, p = G.player;
        if (!this.open) { a.setCell(this.tx, this.ty, 'T'); Sfx.play('door'); Fx.dust(this.tx * T + 8, this.ty * T + 12); }
        this.openT = 50; if (what && what !== 'bag') this.holding = what;
        /* whoever's standing on it goes down too (and home, as falls do) */
        if (p && p.area === a && p.state === 'normal' && p.feetOn(this.tx, this.ty)) p.startFall('pit');
        Stats.count('stagetrap');
    }
    shut(quiet) {
        this.holding = null; this.openT = 0;
        if (this.area.kind(this.tx, this.ty).pit) this.area.setCell(this.tx, this.ty, '.');
        if (!quiet) Sfx.play('doorshut');
    }
    update() { if (!this.holding && this.openT > 0 && --this.openT === 0) this.shut(); }
    draw(cx, cy) { if (!this.open) Gfx.img(spr('stagetrap'), this.x - cx, this.y - cy); }
}
SPAWN.stagetrap = (x, y, p) => new StageTrap(x, y, p);
/* drawing the Great Marionette's wooden parts: rods with an ink edge and a lit edge, round pegs at the joints. R is a
   rect function, so the same parts draw on the screen or into a picture as it's painted */
const GMArt = {
    /* a batten from the flies: a long painted bar the width of the row, on two ropes */
    batten(x, y, h) {
        const ox = h.x - x, x0 = h.tiles[0][0] * T - ox, x1 = (h.tiles[h.tiles.length - 1][0] + 1) * T - ox;
        Gfx.rect(x0, y - 9, x1 - x0, 7, PAL.ink); Gfx.rect(x0 + 1, y - 8, x1 - x0 - 2, 5, '#9a6438'); Gfx.rect(x0 + 1, y - 8, x1 - x0 - 2, 1, '#c9925a');
        for (const rx of [x0 + 12, x1 - 12]) Gfx.rect(rx, y - 60, 1, 52, '#cfc6b8');
    },
    line(R, x0, y0, x1, y1, c) {
        x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
        const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
        let e = dx + dy;
        for (let n = 0; n < 400; n++) {
            R(c, x0, y0, 1, 1);
            if (x0 === x1 && y0 === y1) break;
            const e2 = 2 * e;
            if (e2 >= dy) { e += dy; x0 += sx; }
            if (e2 <= dx) { e += dx; y0 += sy; }
        }
    },
    rod(R, x0, y0, x1, y1, h, col, hi) {
        const steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
        for (let o = -h - 1; o <= h + 1; o++) {
            const c = Math.abs(o) === h + 1 ? PAL.ink : o === -h ? hi : col;
            GMArt.line(R, x0 + (steep ? o : 0), y0 + (steep ? 0 : o), x1 + (steep ? o : 0), y1 + (steep ? 0 : o), c);
        }
    },
    disc(R, cx, cy, r, col) { for (let j = -r; j <= r; j++) { const w = Math.floor(Math.sqrt(r * r - j * j + r * 0.6)); R(col, cx - w, cy + j, w * 2 + 1, 1); } },
    peg(R, cx, cy) { GMArt.disc(R, cx, cy, 2, PAL.ink); GMArt.disc(R, cx, cy, 1, '#c49a62'); R('#ecc895', cx - 1, cy - 1, 1, 1); },
};
TOOLS._gmBags = { draw(cx, cy) { const a = G.map; if (!a || a.id !== 'marionette') return; for (const e of a.ents) if (e instanceof GreatMarionette) e.drawBags(cx, cy); } };
SPAWN.marionette = (x, y, p) => Progress.flag('marionette_boss') ? new Ent('none') : new GreatMarionette(x, y, p);

/* a crossbar's a crossbar: the Great Marionette's own bar, hooked down in front of Wren, takes up like any rack. (Reached
   for from the boards before then, its strings run up out of reach.) */
{
    const target0 = Crossbar.target, take0 = Crossbar.take, release0 = Crossbar.release;
    const giant = a => a && a.ents.find(e => e instanceof GreatMarionette && e.alive);
    Crossbar.target = function (p) {
        const g = giant(p.area);
        if (g && g.bar && g.state === 'dance') { const f = p.front(); if (f.tx === g.bar.tx && f.ty === g.bar.ty) return { puppets: [g], giant: true }; }
        return target0.call(this, p);
    };
    Crossbar.take = function (p) {
        const g = giant(p.area);
        if (g && g.standing && g.state !== 'sleep' && !this.target(p) && g.faces(p)) {
            UI.toast(g.act === 3 ? 'Its bar swings low over the stage now, but still well over your head.' : 'Its strings run up past the lights into the flies, far out of your reach.', 150);
            Sfx.play('hitthing', 0.3); return;
        }
        return take0.call(this, p);
    };
    Crossbar.release = function (p) {
        const c = this.ctl;
        release0.call(this, p);
        if (c && c.giant) for (const g of c.puppets) g.letGo();
    };
}

const MarionetteFoes = {
    /* Captain Tin's baton: a gilt stick with a white ball at each end, spinning as it flies */
    drawBaton(x, y, f) {
        const a = f.state === 'lie' ? 0 : G.t * 0.6, dx = Math.round(Math.cos(a) * 6), dy = Math.round(Math.sin(a) * 3);
        Gfx.line(x - dx, y - dy + 1, x + dx, y + dy + 1, PAL.ink); Gfx.line(x - dx, y - dy, x + dx, y + dy, '#e8b04a');
        Gfx.rect(x - dx - 1, y - dy - 1, 2, 2, '#fbf6ea'); Gfx.rect(x + dx - 1, y + dy - 1, 2, 2, '#fbf6ea');
    },
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
    /* the first knock: it climbs back up its strings, and the second act's a march */
    *toAct2(g) {
        const p = G.player, t = g.trap();
        g.untangle(); g.bags = [];
        if (Crossbar.ctl) Crossbar.release(p);
        /* (the little Wrens are whisked home on their strings: nothing to set out again) */
        for (const e of g.puppets()) Return.snap(e);
        yield 36;
        g.state = 'interval'; g.st = 0;
        for (const [fx, fy] of g.feet) { Fx.dust(fx * T + 8, fy * T + 12); if (p.onTile(fx, fy)) p.unstick(); }
        if (t && p.feetOn(t.tx, t.ty)) { p.y += T; p.unstick(); }
        Sfx.play('rumble'); G.shake = 8;
        yield 30;
        /* a sandbag out of the flies, onto the stage trap, and straight through it */
        if (t) { g.bags.push({ x: t.tx * T + 8, y: t.ty * T + 10, t: 0 }); yield 76; }
        g.lowerThird(false);
        yield 36;
        yield* say(null, "A sandbag drops onto the trap at centre stage and goes straight through. The Great Marionette clambers up and marches off round the stage like a toy soldier, turning at whatever's in its way; and down a string of its own comes a third little Wren.", { focus: g });
        g.state = 'march'; g.st = 0; g.march = LEFT;
    },
    /* the second: out of the trap, its strings let out long and slack, its bar down low */
    *toAct3(g) {
        const p = G.player;
        g.bags = [];
        if (Crossbar.ctl) Crossbar.release(p);
        yield 30;
        g.climbOut(true); g.state = 'interval'; g.st = 0;
        const c = g.third(); if (c) { if (c.heldBy) Crossbar.release(p); c.hauled = 1; Sfx.play('twang'); }
        for (const e of g.puppets()) Return.snap(e);
        yield 40;
        yield* say(null, 'It heaves itself out of the trap. Up in the flies something gives: its strings run out long and slack, and down comes the bar that works it, to swing low over the stage, still well over your head.', { focus: g });
        g.state = 'dance'; g.st = 0;
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
    ENEMY.captain = { hp: 2, r: 8, tall: 30, yarn: THREAD.jory, harmless: true };
    ENEMY.greatmarionette = { hp: 3, r: 12, tall: 40, yarn: THREAD.jory, harmless: true, flies: true, swims: true };
    const cp = { r: '#d6304e', R: '#9a1e36', b: '#2e3a7a', B: '#1e2a5a', g: '#f7d64a', G: '#c8a83a', s: '#f0c8a0', w: '#fbf6ea', f: '#fbf6ea' };
    const capt = leg => ['.........ff.........', '........fwwf........', '.......kbbbbk.......', '......kbbbbbbk......', '......kbbbbbbk......', '......kbbbbbbk......', '.....kkggggggkk.....', '......kssssssk......', '......kswsswsk......', '......kssssssk......', '.......kssssk.......', '.....kkrrrrrrkk.....', '....krRrggggrRrk....', '...ksrrrggggrrrsk...', '...kskrrggggrrksk...', '...kk.krrrrrrk.kk...', '.....kwwwwwwwwk.....', '.....kwgwgwgwgk.....', '.....kwwwwwwwwk.....', '......kbbbbbbk......', '......kbBkkbBk......', '......kbBk' + leg + 'Bk......'.slice(0, 20), '......kkkk.kkkk.....', '....................'];
    defSprite('captain_0', capt('kbB'), cp); defSprite('captain_1', capt('.bB'), cp);
    defSprite('captain_trap', ['....................', '....................', '.......kbbbbk.......', '......kbbbbbbk......', '.....kkggggggkk.....', '......kssssssk......', '......ksxssxsk......', '......kssssssk......', '....kkrrrrrrrrkk....', '...krrrrggggrrrrk...', '..kkkkkkkkkkkkkkkk..', '..k..............k..', '..kkkkkkkkkkkkkkkk..', '....................'], Object.assign({ x: '#2a1f2d' }, cp));
    const gm = { w: '#e6c08a', W: '#c49a62', d: '#8a6040', r: '#e8463c', R: '#a82a26', e: '#2a1f2d', h: '#8a5a3a', s: '#9a6438' };
    /* the Great Marionette: a carved head with your hair and a painted face (its jaw on a hinge), your scarf knotted
       at the neck, a jacket with buttons, hips in blue with peg holes for the legs; its arms and legs are drawn
       jointed as it dances (GMArt) */
    const GMB = { h: '#a5532a', H: '#743620', l: '#c8743a', w: '#ecc895', W: '#d4a46a', d: '#a87a48', D: '#c49a62', e: '#fbf6ea', c: '#f07a7a', m: '#a8442a',
        r: '#e8463c', R: '#b02b2e', o: '#f5786c', t: '#e7ad3c', T: '#b67d26', y: '#f4c860', p: '#3a5fae', P: '#25407e', a: '#5a80c8' };
    const GM_ROWS = [
        '.............kkkkkkkkkk.............',
        '...........kkhhhhllhhhhkk...........',
        '..........khhhhhllhhhhhhhk..........',
        '.........khhhhhllhhhhhhhhhk.........',
        '........khhhhhllhhhhhhhhhhHk........',
        '........khhhhhlhhhhhhhhhhhHk........',
        '.......khhhhhhhhhhhhhhhhhhHHk.......',
        '.......khhhhhhhhhhhhhhhhhhhHk.......',
        '.......khhhhwhhhhhhhwhhhhhHHk.......',
        '.......khhwwwwhhhhwwwwwhhhhHk.......',
        '.......khwwwwwwwwwwwwwwwwwhHk.......',
        '.......khwwwwwwwwwwwwwwwwwWHk.......',
        '.......khwwkkwwwwwwwwkkwwwWHk.......',
        '.......khwwkewwwwwwwwkewwwWHk.......',
        '.......khwwkkwwwwwwwwkkwwwWHk.......',
        '.......khwccwwwwwwwwwwccwwWHk.......',
        '.......khwwwwwwwmmmmwwwwwwWHk.......',
        '.......kHwwwwwdwwwwdwwwwwWWHk.......',
        '........kwwwwwdwwwwdwwwwWWHk........',
        '........kWwwwwdwwwwdwwwWWWk.........',
        '.........kWWwwddddddwwWWWk..........',
        '..........kkWWWWWWWWWWWWkk..........',
        '............kkkkkddkkkkk............',
        '................kDdk................',
        '..........kkkkkkkkkkkkkkkk..........',
        '.........kooooorrrrrrrrRRRk.........',
        '.........krrrrrrrrrrrrkrrrRk........',
        '.........kRRRRRRRRRRRRkrrrrRk.......',
        '.........kkkkkkkkkkkkkkrrrrRk.......',
        '........kdttttttttttttkrRkrRk.......',
        '........kdtttttttkttttkrRkdk........',
        '........kytttttttTttttkrRkTk........',
        '........kytttttttTtttttkrRkk........',
        '........kytttttttktttttkrRkk........',
        '........kytttttttTtttttkrRkk........',
        '........kytttttttTttttttkrRk........',
        '........kytttttttkttttttkrRk........',
        '........kttttttttTttttttkRkk........',
        '........kttttttttTtttttttTTk........',
        '........kttttttttktttttttTTk........',
        '........kttttttttTtttttttTTk........',
        '........kTTTTTTTTTTTTTTTTTTk........',
        '.........kkkkkkkkkkkkkkkkkk.........',
        '...............kddddk...............',
        '..........kkkkkkkkkkkkkkkk..........',
        '..........kapppppppppppPPk..........',
        '..........kapppppppppppPPk..........',
        '..........kadppppppppppdPk..........',
        '..........kapppppppppppPPk..........',
        '..........kPPPPPPPPPPPPPPk..........',
        '..........kkkkkkkkkkkkkkkk..........'];
    ART.gm_body = defSprite('gm_body', GM_ROWS, GMB);
    /* fallen: folded up in a heap on the boards, its head lolling, its legs splayed, its strings gone slack */
    ART.gm_down = paintSprite(96, 52, x => {
        const R = (c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
        for (const [kx, ky, fx, fy, hx] of [[26, 42, 13, 47, 42], [70, 42, 83, 47, 53]]) {
            GMArt.rod(R, kx, ky, fx, fy, 2, '#3a5fae', '#5a80c8'); GMArt.rod(R, hx, 48, kx, ky, 2, '#3a5fae', '#5a80c8'); GMArt.peg(R, kx, ky);
            stampPx(x, ['..kkkk..', '.kbubBk.', 'kbuubbBk', 'kbbbbbBk', 'kSSSSSSk', '.kkkkkk.'], { b: '#7a4a2c', B: '#5a341e', u: '#9a6a44', S: '#45281c' }, fx - 4, fy - 2);
        }
        GM_ROWS.forEach((r, j) => { const sh = j < 23 ? Math.floor((22 - j) / 5) : 0; for (let i = 0; i < r.length; i++) { const c = GMB[r[i]] || (r[i] === 'k' ? PAL.ink : null); if (c) R(c, 30 + i + sh, 1 + j, 1, 1); } });
        for (const [sx, sy, ex, ey, hx, hy] of [[39, 30, 31, 39, 25, 46], [56, 30, 65, 39, 72, 46]]) {
            GMArt.rod(R, ex, ey, hx, hy, 1, '#ecc895', '#fff0d0'); GMArt.rod(R, sx, sy, ex, ey, 2, '#e7ad3c', '#f4c860'); GMArt.peg(R, ex, ey); GMArt.peg(R, sx, sy);
            GMArt.disc(R, hx, hy, 3, PAL.ink); GMArt.disc(R, hx, hy, 2, '#ecc895'); R('#fff0d0', hx - 1, hy - 1, 1, 1);
        }
        GMArt.rod(R, 60, 49, 91, 43, 1, '#9a6438', '#c9925a');
    });
    defSprite('gm_body_old', ['..........kkkkkkkkkkkk..........', '.........khhhhhhhhhhhhk.........', '........khhhhhhhhhhhhhhk........', '........khwwwwwwwwwwwwhk........', '........kwwwwwwwwwwwwwwk........', '........kwwekwwwwwwkewwk........', '........kwwwwwwwwwwwwwwk........', '........kwwwwwwRRwwwwwwk........', '.........kwwwwwwwwwwwwk.........', '..........kkkkwwwwkkkkk.........', '......kkkkrrrrrrrrrrrrkkkk......', '.....krrrrrrrrrrrrrrrrrrrrk.....', '....krRrrrrrrrrrrrrrrrrrrRrk....', '...kwkrrrrrrrrrrrrrrrrrrrrkwk...', '...kwkrrrrrrrrrrrrrrrrrrrrkwk...', '...kwk.krrrrrrrrrrrrrrrrk.kwk...', '...kk..kRRRRRRRRRRRRRRRRk..kk...', '.......kddddddddddddddddk.......', '.......kd..............dk.......', '.......kd..............dk.......', '.......kd..............dk.......', '.......kd..............dk.......', '.......kW..............Wk.......', '.......kk..............kk.......'], gm);
    /* its feet: wooden boots like yours, the ankle peg's hole on top */
    defSprite('gm_foot', ['................', '................', '................', '................', '................', '......kkkk......', '.....kbdbBk.....', '.....kbbbBk.....',
        '.....kbbbBk.....', '....kkbbbBkk....', '...kbubbbbbBk...', '..kbuubbbbbBBk..', '..kbbbbbbbbbBk..', '..kSSSSSSSSSSk..', '...kkkkkkkkkk...', '................'], { b: '#7a4a2c', B: '#5a341e', u: '#9a6a44', S: '#45281c', d: '#3a2418' });
    defSprite('gm_down', ['................................................................', '..........kkkkkkkkkkkk..........................................', '.........khhhhhhhhhhhhk...kkkkkkkkkkkkkkkkkkkkkkkkkkkk...........', '........khwwwwwwwwwwwwhk.krrrrrrrrrrrrrrrrrrrrrrrrrrrrk...........', '........kwwxwwwwwwxwwwwkkrrrrrrrrrrrrrrrrrrrrrrrrrrrrrk..kkkkkk...', '........kwwwwwwwwwwwwwwkrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrkkkddddddk..', '.........kwwwwwRRwwwwwk.kRRRRRRRRRRRRRRRRRRRRRRRRRRRRk.kddddddk..', '..........kkkkkkkkkkkk...kkkkkkkkkkkkkkkkkkkkkkkkkkkkk..kkkkkkk..', '................................................................'], Object.assign({ x: '#2a1f2d' }, gm));
    /* the stage trap shut: a square hatch let into the boards, its own short boards across, two iron hinges, a ring to lift it */
    defSprite('stagetrap', ['ssssssssssssssss', 'swwwwwwwwwwwwwws', 'shhhuuuuuuuuhhhs', 'shhhUUUUUUUUhhhs', 'suuuuuuuuuuuuuus', 'sUUUUUUUUUUUUUUs', 'swwwwwwwwwwwwwws', 'suuuuuuuuuuuuuus',
        'sUUUUUUUUUUUUUUs', 'swwwwwwwwwwwwwws', 'suuuuuuiiuuuuuus', 'sUUUUUiUUiUUUUUs', 'swwwwwwiiwwwwwws', 'suuuuuuuuuuuuuus', 'sUUUUUUUUUUUUUUs', 'ssssssssssssssss'],
        { s: '#5a3e26', u: '#b8925e', U: '#9a7448', w: '#d4ae78', h: '#4a4450', i: '#e8b04a' });
    ART.flat_red = null;
    defSprite('flat_red', ['kkkkkkkkkkkkkkkk', 'krrrrrrrrrrrrrrk', 'krRrrrrrrrrrrRrk', 'krrrrrrrrrrrrrrk', 'krrrrRrrrrrRrrrk', 'krrrrrrrrrrrrrrk', 'kRrrrrrrrrrrrrrk', 'krrrrrrRrrrrrrrk', 'krrrrrrrrrrrrrrk', 'krrRrrrrrrrrrRrk', 'krrrrrrrrrrrrrrk', 'kggggggggggggggk', 'kccccccccccccccc', 'kccccccccccccccc', 'kkkkkkkkkkkkkkkk', '................'], { r: '#9a1e36', R: '#7a1428', g: '#f7d64a', c: '#c8a070' });
    const furn = (w, h, fn) => paintSprite(w, h, x => fn((c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); }));
    ART.poster = furn(16, 30, R => { R('#c8a070', 2, 0, 12, 22); R('#fbf6ea', 3, 1, 10, 20); R('#e8463c', 5, 6, 6, 10); R('#8a5a3a', 6, 3, 4, 4); R('#9a6438', 11, 5, 1, 12); R('#5a3a2a', 7, 22, 2, 8); });
    ART.booth = furn(32, 28, R => { R('#9a1e36', 0, 6, 32, 22); R('#f7d64a', 0, 6, 32, 2); R('#3a0a16', 6, 10, 20, 10); R('#fbf6ea', 8, 12, 16, 6); R('#c8a070', 0, 24, 32, 4); R('#f7d64a', 10, 0, 12, 6); R('#9a1e36', 11, 1, 10, 4); });
    /* six theatre seats seen from behind, facing the stage: plush backs with a rolled top, pleats and a brass number,
       wooden armrests between them, all on one dark riser with its shadow on the boards */
    ART.seats = paintSprite(96, 18, x => {
        const seat = ['....kkkkkkkk....', '...khhhhhhrRk...', '..khrrrrrrrrRk..', '..khrrrrrrrrRk..', '..kRRRRRRRRRDk..', '..krrprrrprrDk..', '..krrprggprrDk..',
            '.kkrrprrrprrDkk.', 'kgkrrprrrprrDkgk', 'kakrrprrrprrDkak', 'kAkrrprrrprrDkAk', 'kAkRRRRRRRRRDkAk', 'kAkDDDDDDDDDDkAk'];
        const L = { k: PAL.ink, h: '#ec6a80', r: '#c42b4a', p: '#ad2440', R: '#9a1e36', D: '#6e1428', g: '#e8b04a', a: '#c9925a', A: '#8a5a34' };
        for (let i = 0; i < 6; i++) stampPx(x, seat, L, i * 16, 0);
        const R = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
        R(PAL.ink, 0, 13, 96, 3); R('#4a2e22', 1, 13, 94, 2); R('#6b4128', 1, 13, 94, 1);
        for (let i = 0; i < 6; i++) R('#3a0a16', i * 16 + 3, 14, 10, 1);
        x.globalAlpha = 0.3; R(PAL.ink, 1, 16, 94, 2); x.globalAlpha = 1;
    }, false);
    ART.drum = furn(16, 18, R => { R('#d6304e', 1, 4, 14, 12); R('#fbf6ea', 1, 2, 14, 4); R('#f7d64a', 1, 8, 14, 1); R('#f7d64a', 1, 12, 14, 1); R('#9a6438', 3, 0, 1, 4); R('#9a6438', 12, 0, 1, 4); });
    ART.prompter = furn(16, 22, R => { R('#3a2a30', 0, 6, 16, 16); R('#c8a070', 0, 4, 16, 3); R('#fff4c0', 4, 10, 8, 4); });
    ART.set_tidy = furn(64, 24, R => { R('#efe4cc', 0, 4, 64, 20); R('#5fb7a8', 0, 0, 64, 6); R('#3c8a80', 0, 6, 64, 1); for (let i = 4; i < 64; i += 16) { R('#9a3a4a', i, 10, 8, 10); } R('#c8a070', 28, 8, 8, 16); R('#f7d64a', 31, 2, 2, 4); });
    ART.mirror = furn(16, 26, R => { R('#c8a070', 0, 0, 16, 22); R('#cfe6f4', 2, 2, 12, 16); R('#fff4c0', 0, 0, 2, 2); R('#fff4c0', 14, 0, 2, 2); R('#fff4c0', 0, 20, 2, 2); R('#fff4c0', 14, 20, 2, 2); R('#5a3a2a', 6, 22, 4, 4); });
    ART.workbench = furn(32, 22, R => { R('#9a6438', 0, 6, 32, 6); R('#6b4128', 2, 12, 3, 10); R('#6b4128', 27, 12, 3, 10); R('#c8c0b8', 6, 2, 5, 4); R('#e6c08a', 18, 1, 8, 5); R('#2a1f2d', 20, 3, 1, 1); R('#2a1f2d', 23, 3, 1, 1); });
    ART.puppets_hung = furn(48, 30, R => { R('#6b4128', 0, 0, 48, 2); const c = ['#5fb7a8', '#e0913a', '#4f9be0', '#7f7688', '#8a6a4a']; for (let i = 0; i < 5; i++) { R('#cfc6b8', 4 + i * 9, 2, 1, 6); R(c[i], 1 + i * 9, 8, 7, 12); R('#e6c08a', 2 + i * 9, 5, 5, 4); } });
    ART.monogram_marionette = paintSprite(16, 10, x => { x.fillStyle = '#d6304e'; x.fillRect(8, 1, 2, 6); x.fillRect(4, 6, 5, 2); x.fillRect(3, 4, 2, 3); x.fillStyle = '#f7d64a'; x.fillRect(6, 0, 6, 1); x.fillRect(11, 0, 1, 3); }, false);
}
CONTENT_INIT.push(initMarionetteFoes);
