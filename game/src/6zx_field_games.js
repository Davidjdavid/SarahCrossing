/* ---- 6zx_field_games.js ---- */
/* The island games that are 2D minigames (David's rule: the minigames keep their 2D look), played in the arcade's
   cabinet overlay (59_arcade.js, a `field` game: no fee, no tickets, no high scores): beach volleyball at the court,
   first to seven, and a snowball fight in winter, first to five hits. The neighbor plays the other side at their own
   skill (VS_SKILL). "Let's play!" offers them where they fit (6zw_island_games.js). */

/* ---------------------------------------------------------------- drawing people on the little screens */
function fieldPerson(g, who, x, y, frame, flip) {
    if (who === 'sarah') {
        spr(g, sarahSprite(S.player.outfit || 'crimson', frame), x, y, flip);
        drawSarahAccs(g, x, y + (frame === 'down_pick' ? 2 : 0), frame.startsWith('side') ? 'side' : 'down', flip);
        return;
    }
    const d = NPC_DEFS[who];
    if (!d) return;
    if (d.human) {
        const [dd, b] = frame.split('_'), name = `${d.human}_${dd === 'side' ? 'side' : 'down'}_${b === 'walkA' || b === 'walkB' ? b : 'stand'}`;
        spr(g, Assets.has(name) ? name : `${d.human}_down_stand`, x, y, flip);
    } else spr(g, `${d.sprite}_${frame.endsWith('walkA') || frame === 'down_cheer' ? 1 : 0}`, x, y, flip);
}
function fieldName(who) { return who === 'sarah' ? (S.playerName || 'Sarah') : (NPC_DEFS[who] ? NPC_DEFS[who].name : who); }

/* ---------------------------------------------------------------- beach volleyball */
const VB_W = 200, VB_H = 130, VB_GROUND = 114, VB_NET = 100, VB_NET_TOP = 76, VB_R = 4, VB_TO = 7;
function VolleyGame(opts) {
    this.rival = opts.rival || 'kai';
    this.skill = VS_SKILL[this.rival] || 0.5;
    this.me = { x: 50, y: VB_GROUND, vy: 0, cool: 0, anim: 0, moving: false };
    this.op = { x: 150, y: VB_GROUND, vy: 0, cool: 0, anim: 0, moving: false, plan: 150, think: 0, noise: 0 };
    this.score = 0; this.opScore = 0; this.over = false; this.win = false;
    this.t = 0; this.pause = 0; this.msg = ''; this.sparks = [];
    // (on her own at the court: a ball machine across the net sends every ball back; the score is how many she gets over)
    this.solo = !!opts.solo;
    if (this.solo) { this.op.x = VB_W + 40; this.machineT = 0; this.prevBest = vbSoloBest(); }
    this.serve(this.solo || R() < 0.5 ? this.me : this.op);
}
VolleyGame.prototype = {
    serve(p) {
        // the ball starts over the server's head and drops onto it
        this.ball = { x: p.x + (p === this.me ? 2 : -2), y: 40, vx: 0, vy: 0, spin: 0, last: null };
        this.server = p;
    },
    idle() { this.draw0 = true; },
    update(inp) {
        this.t++;
        const me = this.me, op = this.op, b = this.ball;
        // Sarah: run, jump
        const sp = 1.7;
        me.moving = false;
        if (inp.held.left) { me.x -= sp; me.moving = true; me.flip = true; }
        if (inp.held.right) { me.x += sp; me.moving = true; me.flip = false; }
        if (inp.pointer && inp.pointer.down && inp.pointer.y > 40) { const dx = inp.pointer.x - me.x; if (Math.abs(dx) > 3) { me.x += Math.sign(dx) * sp; me.moving = true; me.flip = dx < 0; } }
        if ((inp.pressed.jump || inp.pressed.screen) && me.y >= VB_GROUND) { me.vy = -3.7; Sfx.play('jump'); }
        if (this.solo) this.machine(b); else this.brain(op, b);
        for (const p of [me, op]) {
            p.vy += 0.2; p.y += p.vy;
            if (p.y >= VB_GROUND) { p.y = VB_GROUND; p.vy = 0; }
            if (p.moving) p.anim++;
            if (p.cool > 0) p.cool--;
        }
        me.x = clamp(me.x, 10, VB_NET - 8);
        if (!this.solo) op.x = clamp(op.x, VB_NET + 8, VB_W - 10);
        if (this.pause > 0) { if (--this.pause === 0) { this.msg = ''; if (this.solo ? this.missed : this.score >= VB_TO || this.opScore >= VB_TO) { this.over = true; this.win = this.score > this.opScore; } } return; }
        // the ball
        const bx0 = b.x;
        b.vy += 0.11; b.x += b.vx; b.y += b.vy; b.spin += b.vx * 0.2;
        if (this.solo && bx0 < VB_NET && b.x >= VB_NET && b.last === me) { this.score++; this.msg = this.score % 5 ? '' : this.score + '!'; }
        // the net: off its top, or back off its side
        if (Math.abs(b.x - VB_NET) < VB_R + 1.5 && b.y + VB_R > VB_NET_TOP) {
            if (b.y < VB_NET_TOP + 2 && b.vy > 0) { b.vy = -Math.abs(b.vy) * 0.6; b.y = VB_NET_TOP - VB_R; }
            else { b.vx = (b.x < VB_NET ? -1 : 1) * Math.max(0.6, Math.abs(b.vx) * 0.6); b.x = VB_NET + (b.x < VB_NET ? -1 : 1) * (VB_R + 1.6); }
        }
        // heads and arms
        for (const p of [me, op]) {
            if (p.cool || (this.solo && p === op)) continue;
            const cx = p.x, cy = p.y - 15, dx = b.x - cx, dy = b.y - cy, d = Math.hypot(dx, dy);
            if (d > 12 + VB_R) continue;
            const nx = dx / (d || 1), ny = Math.min(-0.35, dy / (d || 1)), nl = Math.hypot(nx, ny);
            // (a long rally gets quicker, so somebody misses in the end)
            this.rally = (this.rally || 0) + 1;
            const pow = Math.max(3.3, Math.hypot(b.vx, b.vy) * 0.85) * (1 + Math.min(0.45, this.rally * 0.035));
            b.vx = nx / nl * pow; b.vy = ny / nl * pow;
            // a hit in the air goes over hard (a spike); one from the ground floats up
            const toward = p === me ? 1 : -1;
            if (p.y < VB_GROUND - 6) { b.vx += toward * 1.6; if (b.y < VB_NET_TOP) b.vy = Math.max(b.vy, -1.2); }
            else {
                // a bump from the ground: up, and on toward the net (more if they were running that way)
                const run = p.moving ? (p.flip ? -1 : 1) : 0;
                b.vx = b.vx * 0.4 + toward * 1.5 + run * 0.6;
                b.vy = Math.min(b.vy, -3.1);
            }
            b.vx = clamp(b.vx, -4.8, 4.8);
            b.x = cx + nx / nl * (12 + VB_R); b.y = cy + ny / nl * (12 + VB_R);
            p.cool = 10; b.last = p;
            Sfx.play('blip');
        }
        // down in the sand: a point to whoever's side it isn't on; past the end of the court, the last to touch it loses it
        const out = b.x < -VB_R || b.x > VB_W + VB_R;
        if (this.solo && (b.y + VB_R >= VB_GROUND || out)) {
            this.msg = out ? 'OUT!' : 'MISS!'; this.missed = true;
            Sfx.play('land'); this.pause = 70;
            b.y = Math.min(b.y, VB_GROUND - VB_R); b.vx = 0; b.vy = 0;
            return;
        }
        if (b.y + VB_R >= VB_GROUND || out) {
            const mine = out ? (b.last ? b.last === op : b.x > VB_NET) : b.x > VB_NET;
            if (mine) this.score++; else this.opScore++;
            this.msg = out ? 'OUT!' : mine ? 'POINT!' : fieldName(this.rival).toUpperCase() + ' SCORES';
            if (!out) for (let i = 0; i < 10; i++) this.sparks.push({ x: b.x, y: VB_GROUND, vx: (R() - 0.5) * 2.4, vy: -R() * 2, t: 30 });
            Sfx.play(mine ? 'good' : 'land');
            this.pause = 70; this.rally = 0;
            b.y = VB_GROUND - VB_R; b.vx = 0; b.vy = 0;
            this.serve(mine ? me : op);
            this.ball.y = 40;
        }
        for (const s of this.sparks) { s.x += s.vx; s.y += s.vy; s.vy += 0.15; s.t--; }
        this.sparks = this.sparks.filter(s => s.t > 0);
    },
    /* on her own: the ball machine across the net catches whatever comes over and lobs it back, a little harder and
       further from her as the rally goes on */
    machine(b) {
        if (this.machineT > 0) this.machineT--;
        if (b.x > VB_NET + 6 && b.vy > 0 && b.y > 58 && !this.machineT) {
            const k = Math.min(1, this.score / 30);
            b.vx = -(1.0 + R() * 0.8 + k * 0.5); b.vy = -3.2 - R() * 0.5 - k * 0.3;
            b.last = null; this.machineT = 12;
            Sfx.play('blip');
        }
    },
    /* the neighbor's side: get under where the ball will come down (a little behind it, so it goes over), jump at it
       near the net; how well depends on their skill */
    brain(op, b) {
        const sk = this.skill;
        op.moving = false;
        if (--op.think <= 0) {
            op.think = Math.round(9 - sk * 6);
            // where it crosses head height, following its flight (walls and the net's side included)
            let x = b.x, y = b.y, vx = b.vx, vy = b.vy, land = null;
            for (let i = 0; i < 240; i++) {
                vy += 0.11; x += vx; y += vy;
                if (Math.abs(x - VB_NET) < 5 && y > VB_NET_TOP) vx = -vx;
                if (y >= VB_GROUND - 22 && vy > 0) { land = x; break; }
            }
            // (going out past the end: a good player lets it go)
            if (this.pause || (land != null && land > VB_W + 2 && R() < 0.3 + sk * 0.7)) land = null;
            if (land != null && land > VB_NET) {
                // a new ball to reach: how well they judge it (now and then they misjudge one badly)
                if (op.lastLand == null || Math.abs(op.lastLand - land) > 25) op.noise = (R() - 0.5) * (1 - sk) * 36 + (R() < (1 - sk) * 0.3 ? (R() < 0.5 ? -1 : 1) * 22 : 0);
                op.lastLand = land;
                op.plan = land + 5 + op.noise;
            } else { op.plan = 150; op.lastLand = null; }
        }
        const dx = op.plan - op.x, sp = 1.25 + sk * 0.55;
        if (Math.abs(dx) > 2) { op.x += Math.sign(dx) * Math.min(sp, Math.abs(dx)); op.moving = true; op.flip = dx < 0; }
        else op.flip = true;
        // a jump for a ball dropping near them, high enough to meet
        if (!this.pause && op.y >= VB_GROUND && b.x > VB_NET && Math.abs(b.x - op.x) < 16 && b.y > 42 && b.y < 84 && b.vy > 0 && R() < 0.05 + sk * 0.12) op.vy = -3.6;
    },
    draw(g) {
        // sky, the sea, the sand
        const sky = g.createLinearGradient(0, 0, 0, 90);
        sky.addColorStop(0, '#8fd3ff'); sky.addColorStop(1, '#dff4ff');
        g.fillStyle = sky; g.fillRect(0, 0, VB_W, 92);
        g.fillStyle = '#ffffff'; for (const [cx, cy, w] of [[30, 18, 22], [120, 12, 30], [170, 28, 18]]) { g.fillRect(cx + ((this.t / 20) % 200) - 20, cy, w, 4); g.fillRect(cx + 4 + ((this.t / 20) % 200) - 20, cy - 3, w - 8, 3); }
        g.fillStyle = '#3aa0d8'; g.fillRect(0, 86, VB_W, 14);
        g.fillStyle = '#7cc8ee'; for (let x = (this.t >> 2) % 12; x < VB_W; x += 12) g.fillRect(x, 88 + ((x >> 3) % 3) * 3, 4, 1);
        g.fillStyle = '#f2dca4'; g.fillRect(0, 100, VB_W, VB_H - 100);
        g.fillStyle = '#e6c98a'; for (let i = 0; i < 40; i++) g.fillRect((i * 53) % VB_W, 102 + (i * 29) % 26, 2, 1);
        g.fillStyle = '#ffffff'; g.fillRect(4, VB_GROUND + 1, VB_W - 8, 1);
        // the net
        g.fillStyle = '#7a5234'; g.fillRect(VB_NET - 1, VB_NET_TOP - 2, 3, VB_GROUND - VB_NET_TOP + 4);
        g.fillStyle = 'rgba(255,255,255,0.75)';
        for (let y = VB_NET_TOP; y < VB_NET_TOP + 16; y += 3) g.fillRect(VB_NET - 4, y, 9, 1);
        g.fillStyle = '#ffffff'; g.fillRect(VB_NET - 5, VB_NET_TOP - 1, 11, 2);
        // the ball's shadow, the people, the ball (it has a face; its name is Ball)
        const b = this.ball;
        g.fillStyle = 'rgba(80,60,30,0.25)';
        const sh = clamp(1 - (VB_GROUND - b.y) / 120, 0.3, 1);
        g.beginPath(); g.ellipse(b.x, VB_GROUND + 2, 5 * sh, 1.6 * sh, 0, 0, 7); g.fill();
        const pose = p => (p.y < VB_GROUND - 2 ? 'down_cheer' : p.moving ? `side_${Math.floor(p.anim / 6) % 2 ? 'walkA' : 'walkB'}` : 'side_stand');
        fieldPerson(g, 'sarah', Math.round(this.me.x), Math.round(this.me.y), pose(this.me), !!this.me.flip);
        if (this.solo) {
            // the ball machine: a box on legs with a tube pointing over the net
            g.fillStyle = '#5a6a7a'; g.fillRect(170, VB_GROUND - 18, 16, 14); g.fillStyle = '#3a4a5a'; g.fillRect(172, VB_GROUND - 4, 2, 4); g.fillRect(182, VB_GROUND - 4, 2, 4);
            g.fillStyle = '#e8443a'; g.fillRect(162, VB_GROUND - 22, 12, 5); g.fillStyle = '#ffd84a'; g.fillRect(176, VB_GROUND - 14, 3, 2);
        } else fieldPerson(g, this.rival, Math.round(this.op.x), Math.round(this.op.y), pose(this.op), this.op.flip !== false);
        if (b.y < -VB_R) { g.fillStyle = '#ffffff'; g.fillRect(Math.round(b.x) - 1, 2, 3, 3); }
        g.fillStyle = '#ffffff'; g.beginPath(); g.arc(b.x, b.y, VB_R, 0, 7); g.fill();
        g.strokeStyle = '#f0a040'; g.lineWidth = 1; g.beginPath(); g.arc(b.x, b.y, VB_R - 1, b.spin, b.spin + 2); g.stroke();
        g.fillStyle = '#3a2a40'; g.fillRect(Math.round(b.x) - 2, Math.round(b.y) - 1, 1, 1); g.fillRect(Math.round(b.x) + 1, Math.round(b.y) - 1, 1, 1);
        g.fillStyle = '#ffffff'; for (const s of this.sparks) g.fillRect(Math.round(s.x), Math.round(s.y), 1, 1);
        // the score
        g.fillStyle = 'rgba(18,12,34,0.55)'; g.fillRect(0, 0, VB_W, 11);
        pxText(g, fieldName('sarah'), 4, 3, '#ffd84a');
        if (this.solo) {
            pxText(g, 'Best ' + Math.max(this.score, vbSoloBest()), VB_W - 4, 3, '#9ef0ff', 1, 'right');
            pxShadow(g, `${this.score} over`, VB_W / 2, 3, '#ffffff', 1, 'center');
        } else {
            pxText(g, fieldName(this.rival), VB_W - 4, 3, '#9ef0ff', 1, 'right');
            pxShadow(g, `${this.score} - ${this.opScore}`, VB_W / 2, 3, '#ffffff', 1, 'center');
        }
        if (this.msg) pxShadow(g, this.msg, VB_W / 2, 46, '#ffd84a', 2, 'center');
    },
};

/* ---------------------------------------------------------------- the snowball fight */
const SB_W = 200, SB_H = 130, SB_TO = 5, SB_TOP = 16;
function SnowGame(opts) {
    this.rival = opts.rival || 'cuke';
    this.skill = VS_SKILL[this.rival] || 0.5;
    this.walls = [[36, 36], [36, 88], [150, 36], [150, 88]].map(([x, y]) => ({ x, y, w: 14, h: 16, hp: 5 }));
    this.me = { x: 22, y: 70, ammo: 2, pack: 0, hurt: 0, cool: 0, anim: 0, moving: false, side: 1 };
    this.op = { x: 178, y: 70, ammo: 2, pack: 0, hurt: 0, cool: 0, anim: 0, moving: false, side: -1, think: 0, goal: null, aim: 0 };
    this.balls = []; this.puffs = [];
    this.score = 0; this.opScore = 0; this.over = false; this.win = false; this.t = 0; this.msg = ''; this.msgT = 0;
}
SnowGame.prototype = {
    wallTop(w) { return w.y + (5 - w.hp) * 2; },
    wallAt(x, y, pad) { pad = pad || 0; return this.walls.find(w => w.hp > 0 && x > w.x - pad && x < w.x + w.w + pad && y > this.wallTop(w) - pad && y < w.y + w.h + pad); },
    move(p, dx, dy) {
        const lo = p.side > 0 ? 8 : SB_W / 2 + 8, hi = p.side > 0 ? SB_W / 2 - 8 : SB_W - 8;
        const nx = clamp(p.x + dx, lo, hi), ny = clamp(p.y + dy, SB_TOP + 14, SB_H - 4);
        if (!this.wallAt(nx, ny - 3, 4)) { p.x = nx; p.y = ny; }
        else if (!this.wallAt(p.x, ny - 3, 4)) p.y = ny;
        else if (!this.wallAt(nx, p.y - 3, 4)) p.x = nx;
        if (dx || dy) { p.moving = true; p.anim++; }
    },
    throw(p) {
        if (p.ammo <= 0 || p.cool > 0 || p.hurt > 20) return false;
        p.ammo--; p.cool = 22; p.pack = 0;
        this.balls.push({ x: p.x + p.side * 8, y: p.y - 12, vx: p.side * 2.7, from: p, z: 0, t: 0 });
        Sfx.play('blip');
        return true;
    },
    packing(p, on) {
        if (!on || p.ammo >= 3 || p.hurt) { p.pack = 0; return; }
        p.moving = false;
        if (++p.pack >= 34) { p.ammo++; p.pack = 0; Sfx.play('squish'); }
    },
    idle() {},
    update(inp) {
        this.t++;
        const me = this.me, op = this.op;
        for (const s of this.puffs) { s.x += s.vx; s.y += s.vy; s.vy += 0.08; s.t--; }
        this.puffs = this.puffs.filter(s => s.t > 0);
        if (this.msgT && --this.msgT === 0) this.msg = '';
        // five hits: a moment to see it, then the end (nothing more counts)
        if (this.endT) { if (--this.endT === 0) { this.over = true; this.win = this.score > this.opScore; } return; }
        for (const p of [me, op]) { p.moving = false; if (p.cool > 0) p.cool--; if (p.hurt > 0) p.hurt--; }
        // Sarah: move (arrows, or drag on her side of the screen), throw, pack
        if (!me.hurt) {
            const sp = 1.2;
            let dx = (inp.held.right ? 1 : 0) - (inp.held.left ? 1 : 0), dy = (inp.held.down ? 1 : 0) - (inp.held.up ? 1 : 0);
            if (inp.pointer && inp.pointer.down && inp.pointer.x < SB_W / 2) { const px = inp.pointer.x - me.x, py = inp.pointer.y + 6 - me.y; if (Math.hypot(px, py) > 3) { const l = Math.hypot(px, py); dx = px / l; dy = py / l; } }
            if (dx && dy && Math.abs(dx) === 1 && Math.abs(dy) === 1) { dx *= 0.71; dy *= 0.71; }
            if (inp.held.pack) this.packing(me, true);
            else { me.pack = 0; if (dx || dy) this.move(me, dx * sp, dy * sp); }
            if (inp.pressed.throw) this.throw(me);
        }
        this.brain(op);
        // the snowballs: a little arc on the way, stopped by forts, a hit is a point
        for (const b of this.balls) {
            b.x += b.vx; b.t++;
            b.z = Math.sin(Math.min(1, b.t / 70) * Math.PI) * 10;
            // (snowballs go over the thrower's own forts, so there's cover to throw from; the far side's stop them)
            const w = this.wallAt(b.x, b.y);
            if (w && (w.x > SB_W / 2) === (b.vx > 0)) { w.hp--; b.done = true; this.splat(b.x, b.y, '#ffffff'); Sfx.play('splat'); continue; }
            const tgt = b.from === me ? op : me;
            if (Math.abs(b.x - tgt.x) < 6 && Math.abs(b.y - (tgt.y - 12)) < 9 && !tgt.hurt) {
                b.done = true;
                tgt.hurt = 40; tgt.pack = 0;
                if (tgt === op) this.score++; else this.opScore++;
                this.splat(tgt.x, tgt.y - 12, '#ffffff');
                Sfx.play(tgt === op ? 'good' : 'ouch');
                this.msg = tgt === op ? 'HIT!' : 'OOF!'; this.msgT = 40;
                if (this.score >= SB_TO || this.opScore >= SB_TO) { this.endT = 70; this.msg = this.score >= SB_TO ? 'YOU WIN!' : 'GOT YOU!'; this.msgT = 0; }
            }
            if (b.x < -4 || b.x > SB_W + 4) b.done = true;
        }
        this.balls = this.balls.filter(b => !b.done);
    },
    splat(x, y, col) { for (let i = 0; i < 8; i++) this.puffs.push({ x, y, vx: (R() - 0.5) * 1.8, vy: -R() * 1.4, t: 22, col }); },
    /* the neighbor: pack behind a fort, step out lined up with Sarah to throw, sidestep what's coming */
    brain(op) {
        const me = this.me, sk = this.skill;
        if (op.hurt) return;
        // a snowball coming their way: get out of its line (sometimes too late)
        const inc = this.balls.find(b => b.from === me && b.x > op.x - 60 && b.x < op.x && Math.abs(b.y - (op.y - 12)) < 10);
        if (inc && (op.dodge || R() < 0.02 + sk * 0.08)) {
            op.dodge = true;
            this.move(op, 0, (op.y > 70 ? -1 : 1) * (1.0 + sk * 0.5));
            return;
        }
        op.dodge = false;
        if (op.ammo === 0 || (op.ammo < 3 && op.pack > 0)) {
            // behind the nearer fort to pack
            const w = this.walls.filter(q => q.x > SB_W / 2 && q.hp > 0).sort((a, b) => Math.abs(a.y + 10 - op.y) - Math.abs(b.y + 10 - op.y))[0];
            const gx = w ? w.x + w.w + 9 : SB_W - 16, gy = w ? w.y + w.h - 2 : op.y;
            if (Math.hypot(gx - op.x, gy - op.y) > 3) { const l = Math.hypot(gx - op.x, gy - op.y); this.move(op, (gx - op.x) / l * 1.1, (gy - op.y) / l * 1.1); }
            else this.packing(op, true);
            return;
        }
        // lined up with Sarah (near enough, by their skill) and nothing in the way: throw
        if (--op.think <= 0) { op.think = Math.round(14 - sk * 8); op.aim = me.y + (R() - 0.5) * (1 - sk) * 22; }
        const dy = op.aim - op.y;
        const tx = SB_W / 2 + 26 + (1 - sk) * 20;
        const dx = op.x > tx + 2 ? -1 : op.x < tx - 14 ? 1 : 0;
        if (Math.abs(dy) > 2 || dx) this.move(op, dx * 0.9, Math.sign(dy) * Math.min(1.05, Math.abs(dy)));
        const lined = Math.abs(me.y - op.y) < 8, blocked = this.walls.some(w => w.hp > 0 && w.x < op.x && op.y - 12 > w.y && op.y - 12 < w.y + w.h);
        if (lined && !blocked && R() < 0.06 + sk * 0.1) this.throw(op);
        else if (Math.abs(dy) <= 2 && !dx && op.cool === 0 && R() < 0.01) this.throw(op);
    },
    draw(g) {
        // snow, a few sparkles, the middle line
        g.fillStyle = '#eef6ff'; g.fillRect(0, 0, SB_W, SB_H);
        g.fillStyle = '#dbe9f8'; for (let i = 0; i < 70; i++) g.fillRect((i * 37) % SB_W, SB_TOP + (i * 53) % (SB_H - SB_TOP), 3, 1);
        g.fillStyle = '#ffffff'; for (let i = 0; i < 12; i++) if ((this.t + i * 17) % 90 < 10) g.fillRect((i * 61) % SB_W, SB_TOP + (i * 41) % (SB_H - SB_TOP), 1, 1);
        g.fillStyle = '#c4d8ee'; for (let y = SB_TOP + 2; y < SB_H; y += 6) g.fillRect(SB_W / 2, y, 1, 3);
        // pines along the top
        g.fillStyle = '#2f6a4a'; for (let x = 6; x < SB_W; x += 22) { g.beginPath(); g.moveTo(x, SB_TOP + 8); g.lineTo(x + 6, SB_TOP - 6); g.lineTo(x + 12, SB_TOP + 8); g.fill(); }
        g.fillStyle = '#ffffff'; for (let x = 6; x < SB_W; x += 22) g.fillRect(x + 4, SB_TOP - 3, 4, 2);
        // what's drawn further up is behind what's further down
        const things = [];
        // the forts: blocks of packed snow, a little lower with every snowball they stop
        for (const w of this.walls) if (w.hp > 0) things.push([w.y + w.h, () => {
            const top = this.wallTop(w), bot = w.y + w.h;
            g.fillStyle = 'rgba(90,120,160,0.22)'; g.fillRect(w.x + 1, bot, w.w, 2);
            g.fillStyle = '#c9dcf0'; g.fillRect(w.x, top + 3, w.w, bot - top - 3);
            g.fillStyle = '#ffffff'; g.fillRect(w.x + 1, top, w.w - 2, 4); g.fillRect(w.x, top + 1, w.w, 2);
            g.fillStyle = '#a9c2de';
            for (let y = top + 6, row = 0; y < bot - 1; y += 4, row++) { g.fillRect(w.x, y, w.w, 1); for (let x = w.x + (row % 2 ? 3 : 6); x < w.x + w.w - 1; x += 7) g.fillRect(x, y - 3, 1, 3); }
        }]);
        const pose = p => (p.hurt > 20 ? 'down_pick' : p.pack ? 'down_pick' : p.cool > 14 ? 'down_cheer' : p.moving ? `side_${Math.floor(p.anim / 6) % 2 ? 'walkA' : 'walkB'}` : 'side_stand');
        for (const [p, who] of [[this.me, 'sarah'], [this.op, this.rival]]) things.push([p.y, () => {
            g.fillStyle = 'rgba(90,120,160,0.25)'; g.beginPath(); g.ellipse(p.x, p.y + 1, 6, 2, 0, 0, 7); g.fill();
            if (p.hurt && (p.hurt >> 2) % 2) g.globalAlpha = 0.5;
            fieldPerson(g, who, Math.round(p.x), Math.round(p.y), pose(p), p.side < 0);
            g.globalAlpha = 1;
            if (p.pack) { g.fillStyle = '#ffffff'; g.fillRect(Math.round(p.x) - 6, Math.round(p.y) - 30, Math.round(12 * p.pack / 34), 2); }
        }]);
        things.sort((a, b) => a[0] - b[0]).forEach(t => t[1]());
        for (const b of this.balls) {
            g.fillStyle = 'rgba(90,120,160,0.3)'; g.fillRect(Math.round(b.x) - 1, Math.round(b.y) + 10, 3, 1);
            g.fillStyle = '#ffffff'; g.beginPath(); g.arc(b.x, b.y - b.z, 2.2, 0, 7); g.fill();
            g.fillStyle = '#b4cbe4'; g.fillRect(Math.round(b.x), Math.round(b.y - b.z), 1, 1);
        }
        for (const s of this.puffs) { g.fillStyle = s.col; g.fillRect(Math.round(s.x), Math.round(s.y), 2, 2); }
        // score, snowballs in hand
        g.fillStyle = 'rgba(18,12,34,0.6)'; g.fillRect(0, 0, SB_W, 11);
        pxText(g, fieldName('sarah'), 4, 3, '#ffd84a');
        pxText(g, fieldName(this.rival), SB_W - 4, 3, '#9ef0ff', 1, 'right');
        pxShadow(g, `${this.score} - ${this.opScore}`, SB_W / 2, 3, '#ffffff', 1, 'center');
        for (let i = 0; i < 3; i++) { g.fillStyle = i < this.me.ammo ? '#ffffff' : 'rgba(255,255,255,0.25)'; g.beginPath(); g.arc(8 + i * 7, SB_H - 6, 2.4, 0, 7); g.fill(); }
        if (this.msg) pxShadow(g, this.msg, SB_W / 2, 50, '#ffd84a', 2, 'center');
    },
};

const FIELD_LINES = {
    vbStart: ["Volleyball! First to seven. The ball's name is Ball. Be nice to Ball.", "Beach volleyball! First to seven points. No spiking the goat."],
    vbWin: ["You won! Your serve is unstoppable. Ball is proud of you.", "Seven! You win! I'm going to go lie down in the sand now."],
    vbLose: ["Seven! I win! That was so close. Ball had a great day.", "Good game! I got seven first. Rematch at sunset?"],
    sbStart: ["Snowball fight! First to five hits. Hide behind your fort to make more snowballs!", "Snowball fight! Five hits wins. Pack 'em tight!"],
    sbWin: ["Okay, okay! You win! I have snow in places snow shouldn't be.", "Five hits! You win! You've got a great arm. A cold, cold arm."],
    sbLose: ["Five! I win! You're covered in snow. You look like a snow person. Cute.", "Ha! Got you five times! Good fight. Hot cocoa?"],
    kai: { vbStart: ["Duuude. Volleyball. First to seven. Ball's ready. Are you ready?"], vbLose: ["Gnarly game, dude. I won, I think? Ball says I won."] },
    cuke: { vbStart: ["Volleyball! Great for the shoulders! First to seven! Stretch first!"], sbStart: ["Snowball fight! Cold-weather cardio! First to five hits!"] },
    chili: { vbStart: ["Volleyball! Hot sand, hot serves! First to seven!"], sbStart: ["A snowball fight? With ME? I'm going to melt them all! First to five!"] },
    sully: { vbStart: ["Volleyball, kid. First to seven. I'm wicked good at this."], sbStart: ["Snowball fight! First to five. Boston rules: no ice balls."] },
};
function fieldLine(id, key) { const own = FIELD_LINES[id] && FIELD_LINES[id][key]; return voiced(id, rpick(own || FIELD_LINES[key])); }

ARCADE_GAMES.volley = {
    name: 'Beach Volleyball', fee: 0, field: true, tune: 'fruit', glow: '#ffcf5a', w: VB_W, h: VB_H, noReady: false,
    help: '← → run · Space jumps', quitLabel: 'Stop playing',
    buttons: [
        { k: 'left', label: '◀', keys: MOVE_KEYS.left, side: 'L', aria: 'Run left' },
        { k: 'right', label: '▶', keys: MOVE_KEYS.right, side: 'L', aria: 'Run right' },
        { k: 'jump', label: 'Jump', keys: ['Space', 'Enter', 'ArrowUp', 'KeyW', 'KeyJ', 'KeyX', 'KeyE'], side: 'R', wide: true, aria: 'Jump' },
    ],
    create(opts) { return new VolleyGame(opts); },
    result(g, opts) {
        if (g.solo) { const best = vbSoloBest(); return { title: `${g.score} over the net!`, lines: [g.score > g.prevBest ? 'A new best at the court!' : `Your best: ${best}`, 'The ball machine is ready when you are.'], icon: 'vb_ball' }; }
        const n = fieldName(opts.rival);
        return { title: g.win ? 'You win!' : `${n} wins!`, lines: [`${g.score} to ${g.opScore}`, g.win ? 'Ball had a great time.' : 'So close! First to seven.'], icon: 'vb_ball' };
    },
};
ARCADE_GAMES.snowball = {
    name: 'Snowball Fight', fee: 0, field: true, tune: 'stack', glow: '#9ed8ff', w: SB_W, h: SB_H,
    help: 'Arrows move · Space throws · hold Z (or Shift) behind your fort to make snowballs', quitLabel: 'Stop playing',
    buttons: [
        { k: 'left', label: '◀', keys: ['ArrowLeft', 'KeyA'], side: 'L', aria: 'Move left' },
        { k: 'up', label: '▲', keys: ['ArrowUp', 'KeyW'], side: 'L', aria: 'Move up' },
        { k: 'down', label: '▼', keys: ['ArrowDown', 'KeyS'], side: 'L', aria: 'Move down' },
        { k: 'right', label: '▶', keys: ['ArrowRight', 'KeyD'], side: 'L', aria: 'Move right' },
        { k: 'throw', label: 'Throw', keys: ['Space', 'Enter', 'KeyX', 'KeyE', 'KeyJ'], side: 'R', wide: true, aria: 'Throw a snowball' },
        { k: 'pack', label: 'Make', keys: ['KeyZ', 'KeyK', 'ShiftLeft', 'ShiftRight', 'KeyC'], side: 'R', wide: true, aria: 'Make a snowball (hold)' },
    ],
    create(opts) { return new SnowGame(opts); },
    result(g, opts) {
        const n = fieldName(opts.rival);
        return { title: g.win ? 'You win!' : `${n} wins!`, lines: [`${g.score} hits to ${g.opScore}`, g.win ? 'Snow everywhere. Victory!' : 'Pack faster, throw straighter!'] };
    },
};

/* ---------------------------------------------------------------- offering and playing them on the island */
const FieldGames = {
    list(n) {
        const out = [], h = Clock.hourF(), wet = G.weather === 'rain' || G.weather === 'storm', p = G.player;
        if (h < 7 || h >= 20) return out;
        const court = (W0.props || []).find(q => q.kind === 'volleyball');
        if (court && !wet && Math.hypot((court.x + 3) * TILE - p.x, (court.y + 2) * TILE - p.y) < 12 * TILE) out.push(['volley', 'Volleyball']);
        if (Clock.season() === 'winter' && !wet) out.push(['snowball', 'Snowball fight']);
        return out;
    },
    async start(kind, n) {
        if (G.busy || Arcade.on) return;
        const id = n.id, key = kind === 'volley' ? 'vb' : 'sb';
        if (n.chat) Chats.end(n.chat);
        n.script = true;
        G.busy++;
        let wins = 0, games = 0;
        try {
            faceNpc(n, G.player);
            await UI.say(id, fieldLine(id, key + 'Start'), { keep: true });
            UI.hideDialog();
            igRec(kind).played++;
            S.stats.islandGames = (S.stats.islandGames || 0) + 1;
            G.busy--;
            let last = null;
            await Arcade.start(kind, { rival: id, home: true, title: `${ARCADE_GAMES[kind].name} with ${n.def.name}`, onOver: r => { if (!r.quit) { games++; last = r; if (r.won) wins++; } } });
            G.busy++;
            if (last) {
                await UI.say(id, fieldLine(id, key + (last.won ? 'Win' : 'Lose')), { keep: true });
                if (last.won) { G.player.pose = 'cheer'; G.player.poseT = 60; }
                igRec(kind).won += wins;
                if (kind === 'volley') { const v = vbVs(id); v.played += games; v.won += wins; }
                if (games > 1) await UI.say(null, `${games} games: ${wins} won by Sarah, ${games - wins} by ${n.def.name}.`, { keep: true });
                await igFriend(n, kind);
            } else await UI.say(id, igLine(id, 'quit'), { keep: true });
        } catch (e) { console.error(e); }
        UI.hideDialog();
        G.busy = Math.max(0, G.busy - 1);
        n.script = false;
        Save.touch();
    },
};
