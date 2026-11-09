/* Wren: walking, pushing, pulling, lifting and throwing, the stick, tools, getting hurt, and Wren's own
   thread: Wren has a mark too, and falls, sinking and the fog send Wren flying back along their trace. */

const PSPEED = 1.3;
const PBOX = { hw: 5, hh: 4 };          /* half the hitbox at Wren's feet */

class Player extends Ent {
    constructor(x, y) {
        super('player');
        this.x = x; this.y = y;
        this.dir = DOWN; this.anim = 0; this.walking = false;
        this.state = 'normal'; this.stateT = 0;
        this.pushT = 0; this.pushDir = -1;
        this.carry = null; this.grip = null;
        this.inv = 0;                 /* invulnerable frames */
        this.kx = 0; this.ky = 0;     /* knockback */
        this.mark = null; this.trace = [];
        this.weightN = WEIGHT.medium;
        this.swingT = 0; this.flight = null; this.fogT = 0; this.stillT = 0;
        this.shove = null;
        this.hop = null;
    }
    get sortY() { return this.y + 2; }
    get tx() { return tileOf(this.x); }
    get ty() { return tileOf(this.y); }
    /* does the hitbox overlap a tile? */
    onTile(x, y) {
        if (this.flying || this.dead) return false;
        const x0 = this.x - PBOX.hw, x1 = this.x + PBOX.hw - 0.01, y0 = this.y - PBOX.hh, y1 = this.y + PBOX.hh - 0.01;
        return x * T < x1 && (x + 1) * T > x0 && y * T < y1 && (y + 1) * T > y0;
    }
    feetOn(x, y) { return !this.flying && tileOf(this.x) === x && tileOf(this.y) === y; }
    get flying() { return this.state === 'flight' || this.state === 'hop' || this.state === 'reel'; }
    get busy() { return this.state !== 'normal' || Script.blocking(); }

    /* ----- marks and traces ----- */
    setMark(tx = this.tx, ty = this.ty, area = this.area) {
        this.mark = { area: area.id, tx, ty };
        this.trace = [[tx, ty]];
    }
    traceStep() {
        const tx = this.tx, ty = this.ty, tr = this.trace;
        const last = tr[tr.length - 1];
        if (last && last[0] === tx && last[1] === ty) return;
        let cut = -1;
        for (let i = tr.length - 1; i >= 0; i--) if (tr[i][0] === tx && tr[i][1] === ty) { cut = i; break; }
        if (cut >= 0) tr.length = cut + 1; else tr.push([tx, ty]);
        if (tr.length > 600) tr.splice(1, tr.length - 600);
        /* what Wren carries goes the same way */
        if (this.carry) Return.moved(this.carry, tx, ty);
        Stats.stepped(this.area, tx, ty);
    }

    /* ----- collision ----- */
    solidAt(tx, ty, forMove) {
        const a = this.area;
        if (!a.inside(tx, ty)) return true;
        const k = a.kind(tx, ty);
        if (k.solid) return true;
        if (k.ledge) return true;
        if (k.deep && !this.canSwim()) {
            const o = a.at(tx, ty);
            if (!Water.rideable(o)) return true;
        }
        const o = a.at(tx, ty);
        if (o && o !== this.carry && !o.walkOn && !Water.rideable(o)) return true;
        for (const b of a.blockers) if (b.blocks(tx, ty, this)) return true;
        return false;
    }
    canSwim() { return false; }
    boxFree(x, y) {
        const x0 = tileOf(x - PBOX.hw), x1 = tileOf(x + PBOX.hw - 0.01), y0 = tileOf(y - PBOX.hh), y1 = tileOf(y + PBOX.hh - 0.01);
        for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (this.solidAt(tx, ty)) return false;
        return true;
    }
    moveAxis(dx, dy) {
        const nx = this.x + dx, ny = this.y + dy;
        if (this.boxFree(nx, ny)) { this.x = nx; this.y = ny; return true; }
        /* slide round corners */
        if (dx !== 0 && dy === 0) {
            for (const s of [1, -1]) for (let o = 1; o <= 6; o++) if (this.boxFree(nx, this.y + s * o) && this.boxFree(this.x, this.y + s * Math.min(o, 1))) { this.y += s * Math.min(1, Math.abs(dx)); return false; }
        } else if (dy !== 0 && dx === 0) {
            for (const s of [1, -1]) for (let o = 1; o <= 6; o++) if (this.boxFree(this.x + s * o, ny) && this.boxFree(this.x + s * Math.min(o, 1), this.y)) { this.x += s * Math.min(1, Math.abs(dy)); return false; }
        }
        /* a ledge below: hop down */
        if (dy > 0 && dx === 0) {
            const tx = tileOf(this.x), ty = tileOf(this.y + PBOX.hh + dy);
            if (this.area.kind(tx, ty).ledge && Math.abs(this.x - (tx * T + 8)) < 6) this.startHop(tx, ty);
        }
        return false;
    }
    /* the thing (grid) right in front of Wren */
    front(dist = 1) {
        const tx = tileOf(this.x + DX[this.dir] * 12), ty = tileOf(this.y - 4 + DY[this.dir] * 12);
        return { tx: tx + DX[this.dir] * (dist - 1), ty: ty + DY[this.dir] * (dist - 1) };
    }
    thingInFront() {
        const f = this.front();
        return this.area.at(f.tx, f.ty);
    }

    /* ----- each step ----- */
    update() {
        if (this.inv > 0) this.inv--;
        this.stateT++;
        switch (this.state) {
            case 'flight': return this.updateFlight();
            case 'fall': return this.updateFall();
            case 'hop': return this.updateHop();
            case 'reel': return this.updateReel();
            case 'faint': return;
        }
        /* on a float that's moving: carried along */
        if (this.ride && Water.rider(this)) return;
        if (this.shove) return this.updateShove();
        if (this.kx || this.ky) {
            this.moveAxis(this.kx, 0); this.moveAxis(0, this.ky);
            this.kx *= 0.78; this.ky *= 0.78;
            if (Math.abs(this.kx) < 0.15) this.kx = 0; if (Math.abs(this.ky) < 0.15) this.ky = 0;
        }
        const cut = Script.blocking() || UI.modal();
        const ax = cut ? { x: 0, y: 0 } : Input.axis();
        if (this.swingT > 0) this.updateSwing();
        if (Tools.busy(this)) { this.walking = false; this.afterMove(); return; }
        /* paddling: C held on something floating steers it instead of walking */
        if (!cut && Inv.equipped === 'paddle' && Input.down('tool') && TOOLS.paddle.float(this)) { TOOLS.paddle.hold(this); this.walking = false; this.anim = 0; this.afterMove(); return; }

        /* a pull in progress finishes, whatever the buttons do */
        if (this.pullT > 0) {
            this.pullT--;
            const k = 1 - this.pullT / 18;
            this.x = lerp(this.pullFrom.x, this.pullFrom.tx, k); this.y = lerp(this.pullFrom.y, this.pullFrom.ty, k);
            this.walking = true; this.anim++;
            if (this.pullT === 0) { this.x = this.pullFrom.tx; this.y = this.pullFrom.ty; }
            this.afterMove();
            return;
        }
        /* grip (Gloves): hold the action button against a thing */
        if (!cut && this.grip) {
            if (!Input.down('act') || this.grip.removed || (!this.grip.mv && !this.adjacentTo(this.grip))) this.release();
        }
        let moving = false;
        if (this.state === 'normal' && this.swingT <= 0 && (ax.x || ax.y)) {
            if (this.grip) {
                moving = this.gripMove(ax);
            } else {
                /* facing: keep it if one of the pressed directions matches */
                const dirs = [];
                if (ax.x < 0) dirs.push(LEFT); if (ax.x > 0) dirs.push(RIGHT); if (ax.y < 0) dirs.push(UP); if (ax.y > 0) dirs.push(DOWN);
                if (!dirs.includes(this.dir)) this.dir = dirs[0];
                let sp = PSPEED * (this.carry ? 0.92 : 1) * (this.area.kind(this.tx, this.ty).slow ? 0.6 : 1);
                if (ax.x && ax.y) sp *= 0.7071;
                const bx = this.x, by = this.y;
                this.moveAxis(ax.x * sp, 0);
                this.moveAxis(0, ax.y * sp);
                moving = Math.abs(this.x - bx) + Math.abs(this.y - by) > 0.05;
                /* pushing: walking straight into a thing */
                const card = (ax.x === 0) !== (ax.y === 0);
                if (card && !moving && !this.carry) this.tryPush(this.dir);
                else { this.pushT = 0; }
            }
        } else this.pushT = 0;
        this.walking = moving;
        if (moving) { this.anim++; this.stillT = 0; } else { this.anim = 0; this.stillT++; }

        if (!cut && this.state === 'normal') {
            if (Input.pressed('act')) this.action();
            else if (Input.down('act') && !this.grip && !this.carry && Inv.has('gloves')) this.tryGrip();
            if (Input.pressed('atk') && !this.carry && this.swingT <= 0 && !this.grip && Inv.has('staff')) this.startSwing();
            if (Input.pressed('tool') && !this.grip) Tools.use(this);
            if (Input.down('tool')) Tools.hold(this); else Tools.unhold(this);
        }
        this.afterMove();
    }
    afterMove() {
        if (this.state !== 'normal') return;
        this.traceStep();
        const k = this.area.kind(tileOf(this.x), tileOf(this.y));
        /* standing over a pit: fall */
        if (k.pit && this.overPit()) this.startFall('pit');
        else if (k.deep && !this.onRaft()) this.startFall('water');
        if (k.hurt && this.inv <= 0) this.hurt(1, this.x - DX[this.dir] * 8, this.y - DY[this.dir] * 8);
        /* the fog at the edge of the valley */
        if (k.fog && !Progress.flag('cut_self')) {
            this.fogT++;
            if (this.fogT === 1) Sfx.play('tug');
            if (this.fogT > 40) { this.fogT = 0; Story.fogPull(this); }
        } else this.fogT = 0;
        if (this.carry) { this.carry.cx = this.x; this.carry.cy = this.y - 14; }
    }
    overPit() {
        /* most of the feet over a pit */
        const pts = [[-3, -2], [3, -2], [-3, 3], [3, 3]];
        let n = 0; for (const [dx, dy] of pts) if (this.area.kind(tileOf(this.x + dx), tileOf(this.y + dy)).pit) n++;
        return n >= 3;
    }
    onRaft() { return Water.rideable(this.area.at(this.tx, this.ty)); }

    tryPush(d) {
        const f = this.front();
        const o = this.area.at(f.tx, f.ty);
        if (!o || o.fixed || !o.isGrid) {
            this.pushT = 0;
            /* a locked door */
            for (const b of this.area.blockers) if (b.tryUnlock && b.blocks(f.tx, f.ty)) { if (!this._knock || G.t - this._knock > 40) { this._knock = G.t; b.tryUnlock(this); } }
            return;
        }
        if (o.mv) { this.pushT = 0; return; }
        /* roughly lined up with it */
        const off = (d === LEFT || d === RIGHT) ? Math.abs(this.y - (o.ty * T + 8)) : Math.abs(this.x - (o.tx * T + 8));
        if (off > 7) { this.pushT = 0; return; }
        if (this.pushDir !== d) { this.pushT = 0; this.pushDir = d; }
        this.pushT++;
        this.pushing = true;
        const need = o.weight >= WEIGHT.heavy ? 18 : 12;
        if (this.pushT >= need) {
            this.pushT = 0;
            if (o.onPushed && o.onPushed(this, d) === false) return;
            if (o.noPush) { if (o.pushLine) UI.toast(o.pushLine); return; }
            if (!o.push(d, o.weight >= WEIGHT.heavy ? 20 : 16)) { if (o.ret) Sfx.play('push'); }
            else Stats.count('pushes');
        }
    }

    adjacentTo(o) { const f = this.front(); return o.tx === f.tx && o.ty === f.ty; }
    tryGrip() {
        const o = this.thingInFront();
        if (!o || o.fixed || o.noGrip) return;
        this.grip = o; o.heldBy = this;
        Sfx.play('click');
    }
    release() { if (this.grip) { this.grip.heldBy = null; if (this.grip.ret) Return.disturb(this.grip); } this.grip = null; }
    /* while gripping: back away to pull it, push into it to push it */
    gripMove(ax) {
        const o = this.grip;
        const back = OPP[this.dir];
        const want = ax.x < 0 ? LEFT : ax.x > 0 ? RIGHT : ax.y < 0 ? UP : DOWN;
        if (want === back && !o.mv && !this.pullT) {
            /* step back a tile, the thing follows */
            const bx = this.x + DX[back] * T, by = this.y + DY[back] * T;
            const tx = tileOf(this.x), ty = tileOf(this.y);
            if (!this.solidAt(tx + DX[back], ty + DY[back]) && !o.fixed && !o.noPull) {
                const dest = { x: o.tx + DX[back], y: o.ty + DY[back] };
                /* the thing moves into where Wren stands */
                const a = this.area;
                if (!a.kind(dest.x, dest.y).solid) {
                    this.pullT = 18;
                    this.pullFrom = { x: this.x, y: this.y, tx: tileOf(this.x) * T + 8 + DX[back] * T, ty: tileOf(this.y) * T + 8 + DY[back] * T };
                    o.startMove(dest.x, dest.y, 18);
                    Sfx.play('push'); Stats.count('pulls');
                }
            }
        }
        if (want === this.dir) { this.tryPush(this.dir); }
        return false;
    }

    action() {
        if (this.carry) return this.throwCarry();
        const f = this.front();
        const a = this.area;
        /* townsfolk, signs, chests, anything that talks or opens */
        const cand = [];
        const o = a.at(f.tx, f.ty);
        if (o) cand.push(o);
        for (const e of a.ents) if (e !== o && e.interact && e.talkBox && e.talkBox(this, f)) cand.push(e);
        /* across a counter */
        if (!cand.length) {
            const o2 = a.at(f.tx + DX[this.dir], f.ty + DY[this.dir]);
            if (o2 && o2.counter && a.kind(f.tx, f.ty).solid) cand.push(o2);
        }
        for (const e of cand) {
            if (e.interact && e.interact(this) !== false) { Stats.count('interactions'); return; }
        }
        if (o && o.liftable && !o.mv) return this.lift(o);
        if (o && Inv.has('gloves')) this.tryGrip();
    }
    lift(o) {
        const a = this.area;
        a.unplace(o, o.tx, o.ty);
        o.carried = true; o.heldBy = this;
        this.carry = o;
        o.cx = this.x; o.cy = this.y - 14;
        Return.moved(o, this.tx, this.ty);
        Sfx.play('lift');
        this.liftT = 8;
        if (o.onLift) o.onLift(this);
    }
    throwCarry() {
        const o = this.carry; this.carry = null;
        o.carried = false; o.heldBy = null;
        Thrown.start(o, this, this.dir);
        Sfx.play('throw');
    }
    /* drop what's carried (cutscenes, falls) */
    dropCarry() {
        const o = this.carry; if (!o) return;
        this.carry = null; o.carried = false; o.heldBy = null;
        if (o.ret) { Return.sendHome(o); }
        else { o.tx = this.tx; o.ty = this.ty; this.area.place(o, o.tx, o.ty); }
    }

    /* ----- the stick ----- */
    startSwing() {
        this.swingT = 16; Sfx.play('swing'); this.swingHit = new Set();
        Stats.count('swings');
    }
    swingBox() {
        const d = this.dir, cx = this.x + DX[d] * 12, cy = this.y - 3 + DY[d] * 11;
        return { x0: cx - 8, y0: cy - 8, x1: cx + 8, y1: cy + 8 };
    }
    updateSwing() {
        this.swingT--;
        if (this.swingT > 12 || this.swingT < 4) return;
        const b = this.swingBox(), a = this.area;
        /* things on the grid */
        for (let ty = tileOf(b.y0); ty <= tileOf(b.y1); ty++) for (let tx = tileOf(b.x0); tx <= tileOf(b.x1); tx++) {
            const o = a.at(tx, ty);
            if (o && !this.swingHit.has(o)) {
                const cx = tx * T + 8, cy = ty * T + 8;
                if (cx < b.x0 || cx > b.x1 || cy < b.y0 || cy > b.y1) continue;
                this.swingHit.add(o);
                if (o.hit) o.hit(this, this.dir);
                else if (o.weight <= WEIGHT.light && !o.fixed && !o.mv) { o.push(this.dir, 8); Sfx.play('hitthing'); }
                else if (o.onStruck) o.onStruck(this);
                else if (o.ret || o.fixed) { Sfx.play('hitthing'); Fx.dust(cx, cy); }
            }
        }
        for (const e of a.ents) {
            if (this.swingHit.has(e) || !e.hurtBox) continue;
            const h = e.hurtBox();
            if (h && h.x0 < b.x1 && h.x1 > b.x0 && h.y0 < b.y1 && h.y1 > b.y0) { this.swingHit.add(e); e.struck(this, 1, this.dir); }
        }
    }

    /* ----- being hurt, falling, flying home ----- */
    hurt(n, fx, fy) {
        if (this.inv > 0 || this.flying || this.state === 'faint' || G.cheats.god) return;
        Inv.hp = Math.max(0, Inv.hp - n);
        this.inv = 70;
        const d = Math.hypot(this.x - fx, this.y - fy) || 1;
        this.kx = (this.x - fx) / d * 3.2; this.ky = (this.y - fy) / d * 3.2;
        Sfx.play('hurt'); G.shake = 6; G.hitstop = 4;
        Stats.count('hits');
        if (this.grip) this.release();
        if (Inv.hp <= 0) this.faint();
    }
    faint() {
        if (this.carry) this.dropCarry();
        this.state = 'faint'; this.stateT = 0;
        Stats.count('faints');
        Script.run(Story.faint());
    }
    startFall(why) {
        if (this.state !== 'normal') return;
        if (this.carry) this.dropCarry();
        if (this.grip) this.release();
        this.state = 'fall'; this.stateT = 0; this.fallWhy = why;
        Sfx.play(why === 'water' ? 'splash' : 'fall');
        if (why === 'water') Fx.splash(this.x, this.y);
        Stats.count(why === 'water' ? 'sinks' : 'falls');
    }
    updateFall() {
        if (this.stateT >= 26) {
            Inv.hp = Math.max(0, Inv.hp - 1);
            if (Inv.hp <= 0) { this.faint(); return; }
            this.flyHome();
        }
    }
    /* fly back along the trace to the mark */
    flyHome(opts = {}) {
        const pts = this.trace.slice().reverse().map(([x, y]) => [x * T + 8, y * T + 10]);
        if (!pts.length || !this.mark || this.mark.area !== this.area.id) {
            const m = this.mark;
            this.state = 'normal';
            if (m) { this.x = m.tx * T + 8; this.y = m.ty * T + 10; }
            return;
        }
        pts.unshift([this.x, this.y]);
        let len = 0; for (let i = 1; i < pts.length; i++) len += dist(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
        const dur = opts.dur || clamp(Math.round(len / 4.5), 24, 110);
        this.flight = { pts, len, dur, t: 0, opts };
        this.state = 'flight'; this.stateT = 0;
        Sfx.play('flight');
    }
    updateFlight() {
        const f = this.flight;
        f.t++;
        const k = f.t / f.dur, want = k * f.len;
        let acc = 0;
        for (let i = 1; i < f.pts.length; i++) {
            const [ax, ay] = f.pts[i - 1], [bx, by] = f.pts[i], seg = dist(ax, ay, bx, by);
            if (acc + seg >= want || i === f.pts.length - 1) {
                const u = seg ? clamp((want - acc) / seg, 0, 1) : 1;
                this.x = lerp(ax, bx, u); this.y = lerp(ay, by, u);
                f.seg = i;
                break;
            }
            acc += seg;
        }
        if (f.t >= f.dur) {
            const m = this.mark;
            this.x = m.tx * T + 8; this.y = m.ty * T + 10;
            this.state = 'normal'; this.inv = 40; this.flight = null;
            this.trace = [[m.tx, m.ty]];
            Sfx.play('land'); Fx.dust(this.x, this.y);
            if (f.opts.then) f.opts.then();
        }
    }
    startHop(tx, ty) {
        /* land on the first open tile below the ledge */
        let ly = ty + 1;
        while (this.area.kind(tx, ly).ledge) ly++;
        this.hop = { fx: this.x, fy: this.y, tx: this.x, ty: ly * T + 8, t: 0, dur: 22 };
        this.state = 'hop'; this.stateT = 0; Sfx.play('lift');
    }
    updateHop() {
        const h = this.hop; h.t++;
        const k = h.t / h.dur;
        this.x = lerp(h.fx, h.tx, k); this.y = lerp(h.fy, h.ty, k);
        this.z = Math.sin(k * Math.PI) * 10;
        if (h.t >= h.dur) { this.z = 0; this.state = 'normal'; Sfx.play('land'); Fx.dust(this.x, this.y); this.hop = null; }
    }
    canBeShoved(d) {
        if (this.flying || this.state !== 'normal') return false;
        const nx = this.x + DX[d] * T, ny = this.y + DY[d] * T;
        /* shoved into anything but a wall (pits and water are fair game) */
        const tx = tileOf(nx), ty = tileOf(ny), k = this.area.kind(tx, ty);
        if (k.solid && !k.deep) return false;
        const o = this.area.at(tx, ty); if (o && o !== this.carry) return false;
        for (const b of this.area.blockers) if (b.blocks(tx, ty, this)) return false;
        return true;
    }
    shoved(d, dur) {
        this.shove = { fx: this.x, fy: this.y, tx: this.x + DX[d] * T, ty: this.y + DY[d] * T, t: 0, dur };
        if (this.grip) this.release();
        Sfx.play('hurt');
    }
    updateShove() {
        const s = this.shove; s.t++;
        this.x = lerp(s.fx, s.tx, s.t / s.dur); this.y = lerp(s.fy, s.ty, s.t / s.dur);
        if (s.t >= s.dur) { this.shove = null; this.afterMove(); }
    }

    /* ----- drawing ----- */
    sprite() {
        let fr = 0;
        if (this.walking) fr = [0, 1, 0, 2][Math.floor(this.anim / 8) % 4];
        if (this.carry || this.liftT > 0 || this.state === 'hold') {
            const d = this.dir === LEFT ? 'right' : this.dir === RIGHT ? 'right' : this.dir === UP ? 'up' : 'down';
            return { im: spr(`wren_lift_${d}`), flip: this.dir === LEFT };
        }
        if (this.state === 'flight') { const d = [DOWN, RIGHT, UP, LEFT][Math.floor(this.stateT / 4) % 4]; return { im: personFrame('wren', d, 0), flip: d === LEFT }; }
        if (this.state === 'faint' || this.state === 'sleep') return { im: spr('wren_sleep'), flip: false };
        return { im: personFrame('wren', this.dir, fr), flip: this.dir === LEFT };
    }
    draw(cx, cy) {
        if (this.hidden) return;
        if (this.liftT > 0) this.liftT--;
        if (this.state === 'fall') {
            const k = 1 - this.stateT / 26;
            const { im } = this.sprite();
            if (!HEADLESS && im && k > 0) {
                const w = Math.max(1, Math.round(16 * k));
                Gfx.ctx.globalAlpha = Math.max(0, k);
                Gfx.ctx.drawImage(im, Math.round(this.x - cx - w / 2), Math.round(this.y - cy - 12 * k + (1 - k) * 4), w, w);
                Gfx.ctx.globalAlpha = 1;
            }
            return;
        }
        if (this.inv > 0 && this.state === 'normal' && (this.inv >> 2) % 2 && this.inv < 69) return;
        const { im, flip } = this.sprite();
        const z = this.z || 0;
        /* shadow */
        Gfx.alpha(0.25); Gfx.rect(this.x - cx - 5, this.y - cy + 2, 10, 2, PAL.ink); Gfx.alpha(1);
        let sx = this.x - cx - 8, sy = this.y - cy - 13 - z;
        if (this.walking && (Math.floor(this.anim / 8) % 2)) sy -= 1;
        if (this.pushT > 3) sx += DX[this.dir] * 1;
        Gfx.img(im, sx, sy, flip);
        if (this.carry) {
            const c = this.carry, ci = c.sprite();
            if (ci) Gfx.img(ci, this.x - cx - 8, this.y - cy - 25 - z);
        }
        if (this.swingT > 0) this.drawStick(cx, cy);
    }
    drawStick(cx, cy) {
        /* the stick sweeps through an arc in front */
        const d = this.dir, k = 1 - this.swingT / 16;
        const base = { [DOWN]: Math.PI / 2, [UP]: -Math.PI / 2, [LEFT]: Math.PI, [RIGHT]: 0 }[d];
        const ang = base + (k - 0.5) * 2.0 * (d === LEFT || d === UP ? -1 : 1);
        const hx = this.x - cx + DX[d] * 3, hy = this.y - cy - 5 + DY[d] * 2;
        const ex = hx + Math.cos(ang) * 13, ey = hy + Math.sin(ang) * 13;
        Gfx.line(hx + 1, hy + 1, ex + 1, ey + 1, PAL.ink);
        Gfx.line(hx, hy, ex, ey, '#c08a50');
        Gfx.rect(ex - 1, ey - 1, 2, 2, PAL.ink);
        if (this.swingT > 6 && this.swingT < 12) { Gfx.alpha(0.5); Gfx.line(hx, hy, hx + Math.cos(ang - 0.4) * 12, hy + Math.sin(ang - 0.4) * 12, PAL.white); Gfx.alpha(1); }
    }
}

/* ---------- thrown things ---------- */
const Thrown = {
    list: [],
    start(o, p, d) {
        /* from the middle of Wren's tile, so a throw always lands the same number of tiles away */
        const sx = (d === LEFT || d === RIGHT) ? p.tx * T + 8 : p.x, sy = (d === UP || d === DOWN) ? p.ty * T + 10 : p.y;
        const t = { o, d, x: sx, y: sy - 12, z: 12, t: 0, dist: 0, max: 4 * T, speed: 3.2, lastTx: p.tx, lastTy: p.ty };
        o.flying = true;
        this.list.push(t);
        Stats.count('throws');
    },
    update(area) {
        for (const t of this.list) {
            if (t.o.area !== area) { t.done = true; continue; }
            t.t++;
            const nx = t.x + DX[t.d] * t.speed, ny = t.y + DY[t.d] * t.speed;
            const tx = tileOf(nx), ty = tileOf(ny + 12);
            t.dist += t.speed;
            t.z = Math.max(0, 12 - Math.pow(t.dist / t.max, 2) * 12);
            /* walls and standing things stop it */
            const k = area.kind(tx, ty);
            let stop = (k.solid && !k.deep && !k.pit && !k.ledge && !k.low) || !area.inside(tx, ty);
            const occ = area.at(tx, ty);
            if (occ && occ !== t.o) {
                stop = true;
                if (occ.hit) occ.hit(t.o, t.d);
                else if (!occ.fixed && occ.weight <= t.o.weight && !occ.mv && occ.canPush && occ.canPush(t.d)) { occ.push(t.d, 8); Stats.count('knocks'); }
            }
            for (const b of area.blockers) if (b.blocks(tx, ty)) stop = true;
            for (const e of area.ents) {
                if (!e.hurtBox || e === t.o) continue;
                const h = e.hurtBox();
                if (h && nx + 4 > h.x0 && nx - 4 < h.x1 && ny + 8 > h.y0 && ny < h.y1) { e.struck(t.o, 1, t.d); stop = true; }
            }
            if (!stop) {
                t.x = nx; t.y = ny;
                if (tx !== t.lastTx || ty !== t.lastTy) {
                    t.lastTx = tx; t.lastTy = ty; Return.moved(t.o, tx, ty);
                    for (const e of area.ents) if (e.strike && e.tx === tx && e.ty === ty) e.strike(t.o);
                }
            }
            if (stop || t.dist >= t.max) { t.done = true; this.land(t, area); }
        }
        this.list = this.list.filter(t => !t.done);
    },
    land(t, area) {
        const o = t.o;
        o.flying = false;
        const tx = t.lastTx, ty = t.lastTy;
        if (o.breaks) { Shards.start(o, tx, ty); return; }
        o.tx = tx; o.ty = ty; o.x = tx * T; o.y = ty * T;
        if (area.at(tx, ty) && area.at(tx, ty) !== o) {
            /* fall back to a free tile next to it */
            for (let d = 0; d < 4; d++) if (area.freeForThing(tx + DX[d], ty + DY[d], o)) { o.tx += DX[d]; o.ty += DY[d]; break; }
        }
        area.place(o, o.tx, o.ty);
        Sfx.play('land');
        if (o.ret) Return.moved(o, o.tx, o.ty);
        o.landed();
    },
    draw(cx, cy) {
        for (const t of this.list) {
            const im = t.o.sprite();
            Gfx.alpha(0.25); Gfx.rect(t.x - cx - 4, t.y - cy + 12, 8, 2, PAL.ink); Gfx.alpha(1);
            if (im) Gfx.img(im, t.x - cx - 8, t.y - cy - t.z);
        }
    },
};

/* ---------- shards: a broken thing flies home in pieces along its trace ---------- */
const Shards = {
    list: [],
    /* a flight of pieces along tiles (no pot behind it): creatures made of clay, thrown clay shots */
    flight(area, path, opts = {}) {
        if (path.length < 2) { if (opts.onDone) opts.onDone(); return; }
        this.list.push({ o: { area, shardCol: opts.col || '#c4623a', fake: true, owner: opts.owner }, path, i: 0, t: 0, pace: opts.pace || 4, x: path[0][0] * T + 8, y: path[0][1] * T + 8, delay: opts.delay || 6, hurt: !!opts.hurt, onDone: opts.onDone });
    },
    start(o, tx, ty) {
        const a = o.area;
        Sfx.play('shatter');
        Fx.burst(tx * T + 8, ty * T + 8, o.shardCol || '#d98f3a');
        Stats.count('shatters');
        if (o.drop && !o.dropped) { o.dropped = true; a.add(new Pickup(tx * T, ty * T, { what: o.drop, vz: 2, life: 600 })); }
        if (!o.ret) { a.remove(o); return; }
        o.shattered = true;
        /* the way home: the trace reversed, from where it broke */
        Return.moved(o, tx, ty);
        const path = o.ret.trace.slice().reverse();
        this.list.push({ o, path, i: 0, t: 0, pace: 4, x: tx * T + 8, y: ty * T + 8, delay: 10 });
    },
    update(area) {
        for (const s of this.list) {
            if (s.o.area !== area) { s.done = true; if (!s.o.fake) this.reform(s); continue; }
            if (s.delay > 0) { s.delay--; continue; }
            s.t++;
            if (s.t >= s.pace) {
                s.t = 0; s.i++;
                if (s.i >= s.path.length) { if (s.o.fake) { if (s.onDone) s.onDone(); } else this.reform(s); s.done = true; continue; }
                const [tx, ty] = s.path[s.i];
                this.strike(area, tx, ty, s);
            }
            const [ax, ay] = s.path[Math.max(0, s.i)], b = s.path[Math.min(s.path.length - 1, s.i + 1)];
            const k = s.t / s.pace;
            s.x = lerp(ax, b[0], k) * T + 8; s.y = lerp(ay, b[1], k) * T + 8;
        }
        this.list = this.list.filter(s => !s.done);
    },
    /* the pieces hit what's on the way at head height */
    strike(area, tx, ty, s) {
        const o = area.at(tx, ty);
        if (o && o !== s.o && o.hit) o.hit(s.o, -1, true);
        for (const e of area.ents) if (e.strike && e.tx === tx && e.ty === ty) e.strike(s.o);
        for (const e of area.ents) {
            if (!e.hurtBox) continue;
            const h = e.hurtBox();
            const cx = tx * T + 8, cy = ty * T + 8;
            if (h && cx + 6 > h.x0 && cx - 6 < h.x1 && cy + 6 > h.y0 && cy - 6 < h.y1) e.struck(s.o, 1, -1, true);
        }
        if (s.o.onShardTile) s.o.onShardTile(tx, ty);
        /* clay creatures' pieces hurt Wren too */
        if (s.hurt) { const p = G.player; if (p && p.area === area && p.feetOn(tx, ty)) p.hurt(1, tx * T + 8 - DX[dirOf(1, 0)], ty * T + 8); }
    },
    reform(s) {
        const o = s.o;
        o.shattered = false;
        o.ret.trace = [[o.ret.mx, o.ret.my]];
        o.tx = o.ret.mx; o.ty = o.ret.my; o.x = o.tx * T; o.y = o.ty * T;
        o.ret.state = 'home';
        o.pendingHome = true;
    },
    draw(cx, cy) {
        for (const s of this.list) {
            if (s.delay > 0) continue;
            const col = s.o.shardCol || '#d98f3a';
            for (let i = 0; i < 5; i++) {
                const a = G.t * 0.3 + i * 1.3;
                Gfx.rect(s.x - cx + Math.cos(a) * 3, s.y - cy - 6 + Math.sin(a) * 2, 2, 2, i % 2 ? col : shade(col, -0.35));
            }
        }
    },
};
