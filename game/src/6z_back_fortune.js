/* ---- 6z_back_fortune.js ---- */
/* Fortune Falls: Fortune's pegboard for the arcade's back room (a Peggle-style game). Aim the launcher, drop a sesame
   ball through the pegs and light every orange fortune peg to clear the board; lit pegs pop once the ball has left.
   The steamer basket at the bottom catches a free ball, the purple peg (it moves every shot) is a big bonus, a green
   peg splits the ball in two, and the last orange peg gets a slow-motion close-up, then Extreme Fever and the bonus
   buckets. Seven hand-made boards come round in turn, each with more orange pegs (and every third one a ball fewer)
   than the last; running out of balls ends the game. It runs in the cabinet overlay (59_arcade.js) like the others. */

const FF_L = 6, FF_R = 130, FF_TOP = 10;                       // the board's side walls and ceiling
const FF_BR = 2.5, FF_PR = 3.5, FF_RIM = 1.6;                  // ball, peg and basket-rim radius
const FF_GRAV = 0.085, FF_V0 = 2.4, FF_VMAX = 4.8, FF_SUB = 5;  // per frame; five small steps a frame so nothing tunnels
const FF_PX = 68, FF_PY = 9, FF_MUZ = 10, FF_AIM = 1.45;       // launcher pivot, barrel length, widest aim (from straight down)
const FF_BY = 144, FF_BW = 9;                                  // the basket: rim height and half-width
const FF_PEG = { blue: 10, orange: 100, green: 10, purple: 500 };
const FF_FEVER = [2500, 5000, 10000, 5000, 2500];
const FF_FREE = [2500, 7500, 15000];                           // a single shot worth this much earns a free ball
const FF_NOTES = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96, 98, 100];
const FF_ODE = [76, 76, 77, 79, 79, 77, 76, 74, 72, 72, 74, 76, 76, 74, 74];
const FF_COL = { blue: ['#3f8cff', '#1f4fb0', '#a8d2ff'], orange: ['#ff8a1e', '#b0500a', '#ffd29a'], green: ['#3cc84a', '#1d7a2a', '#b4f5ae'], purple: ['#b45cf0', '#6326a0', '#e6c6ff'] };
const FF_LIT = { blue: ['#c4e4ff', '#6aa8ff', '#ffffff'], orange: ['#ffe08a', '#ffa030', '#ffffff'], green: ['#ccffbc', '#5ce06a', '#ffffff'], purple: ['#f2d6ff', '#c07af5', '#ffffff'] };
const FF_DISC = ['..###..', '.#####.', '#######', '#######', '#######', '.#####.', '..###..'];
const FF_BALL = ['.###.', '#####', '#####', '#####', '.###.'];
const FF_BIGBALL = ['..ooo..', '.o###o.', 'o#####o', 'o#####o', 'o#####o', '.o###o.', '..ooo..'];   // the ball in play, outlined so it stands out
const FF_BALLCOL = ['#ffd84a', '#d0841c', '#fffbe0', '#3a1a0c'];
const FF_SLIPS = [
    'A BUCKET IS IN|YOUR FUTURE.', 'THE PEGS FEAR|YOUR AIM.', 'YOU WILL BOUNCE BACK.|YOU ALWAYS DO.', 'GRAVITY IS ON|YOUR SIDE. MOSTLY.',
    'LUCKY NUMBERS:|10 BALLS.', 'WONTON IS NOT SOUP.|THAT IS NOT A FORTUNE.', 'CHILI WILL BE|SO JEALOUS.', 'MAKI SAYS THAT ANGLE|WAS NEARLY PRECISE.',
    'YOUR NEXT SHOT:|LEGENDARY. PROBABLY.', 'GOOD THINGS COME TO|THOSE WHO BOUNCE.', 'THE BALL KNOWS|THE WAY. TRUST IT.', 'KAI SAYS THE PEGS|ARE VIBING. OK KAI.',
];
const FF_TMP = { x: 0, y: 0, vx: 0, vy: 0 };

/* where a moving peg is at time T (and how fast it's going): spinning rings and swaying lanterns */
function ffAt(p, T, o) {
    const m = p.mv;
    if (m.r) { const a = m.a + m.w * T; o.x = m.cx + Math.cos(a) * m.r; o.y = m.cy + Math.sin(a) * m.r; o.vx = -Math.sin(a) * m.r * m.w; o.vy = Math.cos(a) * m.r * m.w; }
    else { const s = Math.sin(m.w * T + m.ph), c = Math.cos(m.w * T + m.ph) * m.w; o.x = m.x0 + m.ax * s; o.y = m.y0 + m.ay * s; o.vx = m.ax * c; o.vy = m.ay * c; }
}
/* a ball against something round: push it out, bounce it (relative to the thing, which may be moving) */
function ffBounce(b, px, py, pvx, pvy, rr, dx, dy, d2, e) {
    const d = Math.sqrt(d2);
    let nx = d > 0.01 ? dx / d : 0, ny = d > 0.01 ? dy / d : -1;
    // dead on top of a peg it would balance there forever: tip it off to one side
    if (ny < -0.98) { nx = nx < 0 ? -0.25 : 0.25; ny = -0.968; }
    b.x = px + nx * rr; b.y = py + ny * rr;
    const rvx = b.vx - pvx, rvy = b.vy - pvy, vn = rvx * nx + rvy * ny;
    if (vn < 0) {
        const vt = rvy * nx - rvx * ny;
        b.vx = pvx - vn * e * nx - vt * 0.97 * ny;
        b.vy = pvy - vn * e * ny + vt * 0.97 * nx;
    }
    return vn;
}
/* small pixel sprites (pegs, the ball), shaded from the top left, made once */
const ffSprites = {};
function ffSprite(key, rows, cols, glow) {
    if (ffSprites[key]) return ffSprites[key];
    const n = rows.length, pad = glow ? 2 : 0, c = document.createElement('canvas');
    c.width = c.height = n + pad * 2;
    const g = c.getContext('2d'), m = (c.width - 1) / 2;
    if (glow) { g.fillStyle = glow; for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) { const d = Math.hypot(x - m, y - m); if (d > n / 2 - 0.5 && d < n / 2 + 1.7) g.fillRect(x, y, 1, 1); } }
    rows.forEach((r, y) => { for (let x = 0; x < n; x++) { const s = x + y, ch = r[x]; if (ch === '#') { g.fillStyle = s <= Math.floor(n / 2) ? cols[2] : s >= n + 2 ? cols[1] : cols[0]; g.fillRect(x + pad, y + pad, 1, 1); } else if (ch === 'o') { g.fillStyle = cols[3]; g.fillRect(x + pad, y + pad, 1, 1); } } });
    ffSprites[key] = c;
    return c;
}
function ffNote(m, instr, vol) { if (Sfx.notes) Sfx.notes([m], instr, vol || 0.12, 0); }

/* ---------------------------------------------------------------- the boards (hand-made; the orange pegs are dealt anew each time) */
const FF_BOARDS = [
    { name: 'Cookie Crumbs', sky: ['#24163e', '#4e2652'], make(P) {
        for (let r = 0; r < 8; r++) { const odd = r % 2; P.row(36 + r * 13, odd ? 23 : 16, odd ? 113 : 120, odd ? 8 : 9); }
    } },
    { name: 'Lucky Rainbow', sky: ['#1c1a44', '#40285e'], make(P) {
        P.arc(68, 134, 60, 210, 330, 11); P.arc(68, 134, 45, 194, 346, 10); P.arc(68, 134, 30, 188, 352, 7); P.arc(68, 134, 15, 210, 330, 3);
        P.cloud(30, 44); P.cloud(106, 44); P.cloud(68, 64);
        P.row(32, 50, 86, 4); P.dot(18, 120); P.dot(118, 120);
    } },
    { name: 'Steamer Baskets', sky: ['#2a1630', '#5c2a3c'], make(P) {
        // three baskets that turn, each with a way in; a dumpling waits inside
        P.ring(36, 66, 15, 10, 0.018, [0, 3, 6]); P.dot(36, 66);
        P.ring(100, 66, 15, 10, -0.018, [1, 4, 7]); P.dot(100, 66);
        P.ring(68, 110, 17, 12, 0.014, [0, 4, 8]); P.dot(68, 110);
        P.row(32, 16, 120, 7); P.arc(68, 70, 22, 220, 320, 4); P.dot(68, 82); P.dot(56, 92); P.dot(80, 92);
        P.line(17, 92, 26, 130, 4); P.line(119, 92, 110, 130, 4); P.dot(17, 50); P.dot(119, 50);
    } },
    { name: 'Noodle Waves', sky: ['#1e1838', '#2e3a5e'], make(P) {
        // the noodles are spaced so a ball can always slip between them (no pockets to get stuck in)
        for (let r = 0; r < 5; r++) P.wave(36 + r * 22, r % 2 ? 20 : 16, r % 2 ? 120 : 116, 9, 8, 1, 0);
        for (let r = 0; r < 4; r++) { P.dot(40 + (r % 2) * 6, 47 + r * 22); P.dot(96 + (r % 2) * 6, 47 + r * 22); }
    } },
    { name: 'The Fortune Cookie', sky: ['#2c1a2e', '#5e3a2a'], make(P) {
        P.arc(68, 116, 54, 208, 332, 10); P.arc(68, 120, 32, 214, 326, 6);
        P.line(70, 102, 112, 126, 5);                                      // the paper slip, poking out
        P.dot(18, 32); P.dot(40, 36); P.dot(68, 34); P.dot(96, 36); P.dot(118, 32); P.dot(29, 50); P.dot(54, 50); P.dot(82, 50); P.dot(107, 50);
        P.row(130, 17, 56, 4); P.dot(18, 110); P.dot(119, 104); P.dot(68, 84); P.dot(52, 96); P.dot(30, 90); P.dot(106, 88);
    } },
    { name: 'Chopsticks', sky: ['#1a2030', '#3a2a4a'], make(P) {
        // two chopsticks steep enough to roll down, into a bowl that drops the ball out of its middle
        P.line(17, 37, 54, 84, 9); P.line(119, 37, 82, 84, 9);
        P.line(30, 92, 58, 128, 7); P.line(106, 92, 78, 128, 7);
        P.row(112, 60, 76, 2); P.cloud(68, 44); P.row(66, 56, 80, 3);
        P.dot(18, 104); P.dot(118, 104); P.dot(18, 124); P.dot(118, 124); P.row(30, 40, 96, 3);
    } },
    { name: 'Paper Lanterns', sky: ['#28143a', '#4a1e3a'], make(P) {
        // three lanterns swaying together, open at the top and bottom
        const sw = { ax: 2.5, ay: 0, w: 0.025, ph: 0 };
        [[30, 76], [68, 64], [106, 76]].forEach(([x, y]) => {
            P.oval(x, y, 12.5, 16, 12, [3, 9], sw); P.dot(x, y, sw);
            P.dot(x, 30); P.dot(x, y + 25, sw);
        });
        P.row(126, 17, 119, 9); P.dot(49, 44); P.dot(87, 44);
    } },
];
function ffLayout(def) {
    const out = [];
    const add = (x, y, mv) => out.push({ x, y, mv: mv || null });
    const sway = (x, y, sw) => sw ? { x0: x, y0: y, ax: sw.ax, ay: sw.ay, w: sw.w, ph: sw.ph } : null;
    const P = {
        dot(x, y, sw) { add(x, y, sway(x, y, sw)); },
        row(y, x0, x1, n) { for (let i = 0; i < n; i++) add(lerp(x0, x1, n > 1 ? i / (n - 1) : 0.5), y); },
        line(x0, y0, x1, y1, n) { for (let i = 0; i < n; i++) { const k = n > 1 ? i / (n - 1) : 0.5; add(lerp(x0, x1, k), lerp(y0, y1, k)); } },
        arc(cx, cy, r, a0, a1, n, skip) { for (let i = 0; i < n; i++) { if (skip && skip.includes(i)) continue; const a = lerp(a0, a1, n > 1 ? i / (n - 1) : 0.5) * Math.PI / 180; add(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } },
        ring(cx, cy, r, n, w, skip) { for (let i = 0; i < n; i++) { if (skip && skip.includes(i)) continue; const a = i / n * Math.PI * 2; add(cx + Math.cos(a) * r, cy + Math.sin(a) * r, w ? { cx, cy, r, a, w } : null); } },
        oval(cx, cy, rx, ry, n, skip, sw) { for (let i = 0; i < n; i++) { if (skip && skip.includes(i)) continue; const a = i / n * Math.PI * 2, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry; add(x, y, sway(x, y, sw)); } },
        cloud(x, y) { add(x - 12, y + 2); add(x, y - 4); add(x + 12, y + 2); add(x, y + 8); },      // four pegs, spaced so no ball can rest between them
        wave(y, x0, x1, n, amp, cycles, ph) { for (let i = 0; i < n; i++) { const k = i / (n - 1); add(lerp(x0, x1, k), y + Math.sin(ph + k * cycles * Math.PI * 2) * amp); } },
    };
    def.make(P);
    // keep everything clear of the launcher and the basket, far enough off the walls that no ball can wedge itself
    // in beside a peg, and never two pegs on top of each other
    const pegs = [];
    for (const q of out) {
        if (q.x < 15 || q.x > 121 || q.y < 26 || q.y > 136) continue;
        if (pegs.some(o => Math.hypot(o.x - q.x, o.y - q.y) < 7)) continue;
        pegs.push(q);
    }
    return pegs;
}

/* ---------------------------------------------------------------- the game */
function FortuneGame() {
    this.t = 0; this.score = 0; this.over = false; this.board = -1; this.cleared = 0; this.oranges = 0; this.bestShot = 0; this.shot = 0;
    this.angle = 0.18; this.aimHold = 0; this.pops = []; this.parts = []; this.shake = 0; this.hop = 0; this.recoil = 0;
    this.zoom = 1; this.fx = ARCADE_W / 2; this.fy = ARCADE_H / 2; this.scale = 1; this.slow = 0;
    this.T = 0; this.bx = 68; this.bdir = 1; this.balls = []; this.hitList = []; this.guide = []; this.guideHit = null; this.tockT = 0;
    this.onHit = (p, b, vn) => this.hit(p, b, vn);
    this.nextBoard();
}
FortuneGame.prototype = {
    nextBoard() {
        this.board++;
        const n = this.board, lay = FF_BOARDS[n % FF_BOARDS.length];
        this.lay = lay;
        this.pegs = ffLayout(lay).map(q => ({ x: q.x, y: q.y, vx: 0, vy: 0, mv: q.mv, kind: 'blue', lit: false, gone: false, touch: 0, flash: 0 }));
        this.movers = this.pegs.filter(p => p.mv);
        // Peggle deals the orange pegs fresh every time; here there are more of them each board, and a ball fewer every third board
        const deal = shuffled(this.pegs), K = Math.min(Math.floor(this.pegs.length * 0.42), 8 + n * 2);
        deal.slice(0, K).forEach(p => { p.kind = 'orange'; });
        deal.slice(K, K + 2).forEach(p => { p.kind = 'green'; });
        this.orangeTotal = K; this.orangeLeft = K; this.mult = 1;
        this.left = Math.max(6, 10 - Math.floor(n / 3));
        this.bspeed = Math.min(1.25, 0.5 + n * 0.09);
        this.fever = 0; this.feverT = 0; this.slow = 0; this.balls = []; this.hitList = [];
        this.posts = [[0, FF_BY, 0], [0, FF_BY, 0], [0, FF_BY + 5, 0], [0, FF_BY + 5, 0]];
        this.moveBasket(0);
        this.movePurple();
        this.slip = rpick(FF_SLIPS);
        this.banner = 110; this.phase = 'aim';
        this.tallyT = 0; this.ballBonus = 0; this.perfect = false; this.doneT = 0;
        for (const p of this.movers) ffAt(p, this.T, p);
    },
    /* the purple peg hops to another blue peg every shot */
    movePurple() {
        for (const p of this.pegs) if (p.kind === 'purple' && !p.lit) p.kind = 'blue';
        const blues = this.pegs.filter(p => p.kind === 'blue' && !p.lit && !p.gone);
        if (blues.length) rpick(blues).kind = 'purple';
    },
    multFor() {
        const hit = this.orangeTotal - this.orangeLeft, K = this.orangeTotal;
        return hit >= K * 0.88 ? 10 : hit >= K * 0.76 ? 5 : hit >= K * 0.6 ? 3 : hit >= K * 0.4 ? 2 : 1;
    },
    movePegs() { for (const p of this.movers) ffAt(p, this.T, p); },
    moveBasket(dt) {
        if (this.fever) return;
        this.bx += this.bdir * this.bspeed * dt;
        const lo = FF_L + FF_BW + 2, hi = FF_R - FF_BW - 2;
        if (this.bx < lo) { this.bx = lo; this.bdir = 1; } else if (this.bx > hi) { this.bx = hi; this.bdir = -1; }
        const P = this.posts, v = this.bdir * this.bspeed;
        P[0][0] = P[2][0] = this.bx - FF_BW; P[1][0] = P[3][0] = this.bx + FF_BW;
        for (const q of P) q[2] = v;
    },
    /* one small step of a ball: gravity, walls, pegs, the basket's rims. T is null for the real ball (the pegs are
       already where they are), or a time for the aiming guide and the look-ahead, which need the pegs at that time */
    step(b, dt, T, hit) {
        b.vy += FF_GRAV * dt;
        const sp = b.vx * b.vx + b.vy * b.vy;
        if (sp > FF_VMAX * FF_VMAX) { const k = FF_VMAX / Math.sqrt(sp); b.vx *= k; b.vy *= k; }
        b.x += b.vx * dt; b.y += b.vy * dt;
        if (b.x < FF_L + FF_BR) { b.x = FF_L + FF_BR; if (b.vx < 0) b.vx *= -0.8; }
        else if (b.x > FF_R - FF_BR) { b.x = FF_R - FF_BR; if (b.vx > 0) b.vx *= -0.8; }
        if (b.y < FF_TOP + FF_BR) { b.y = FF_TOP + FF_BR; if (b.vy < 0) b.vy *= -0.8; }
        const rr = FF_BR + FF_PR, o = FF_TMP;
        for (const p of this.pegs) {
            if (p.gone) continue;
            let px = p.x, py = p.y, pvx = p.vx, pvy = p.vy;
            if (T != null && p.mv) { ffAt(p, T, o); px = o.x; py = o.y; pvx = o.vx; pvy = o.vy; }
            const dx = b.x - px, dy = b.y - py;
            if (dx >= rr || dx <= -rr || dy >= rr || dy <= -rr) continue;
            const d2 = dx * dx + dy * dy;
            if (d2 >= rr * rr) continue;
            const vn = ffBounce(b, px, py, pvx, pvy, rr, dx, dy, d2, 0.62);
            if (hit) hit(p, b, vn);
        }
        const r2 = FF_BR + FF_RIM;
        for (const q of this.posts) {
            const dx = b.x - q[0], dy = b.y - q[1], d2 = dx * dx + dy * dy;
            if (d2 < r2 * r2) ffBounce(b, q[0], q[1], q[2], 0, r2, dx, dy, d2, 0.5);
        }
    },
    /* the dotted guide: the path to the first peg, and a little of the bounce after it */
    makeGuide() {
        const a = this.angle, c = { x: FF_PX + Math.sin(a) * FF_MUZ, y: FF_PY + Math.cos(a) * FF_MUZ, vx: Math.sin(a) * FF_V0, vy: Math.cos(a) * FF_V0 };
        const dots = [], dt = 1 / FF_SUB;
        let first = null, other = false, after = 0, lx = c.x, ly = c.y;
        const fn = p => { if (!first) first = p; else if (p !== first) other = true; };
        this.guideHit = null;
        for (let i = 0; i < 900 && c.y < ARCADE_H; i++) {
            this.step(c, dt, this.T + i * dt, fn);
            if (first && !this.guideHit) { this.guideHit = { x: c.x, y: c.y, p: first }; lx = c.x; ly = c.y; }
            if (other || (first && ++after > 16 * FF_SUB)) break;
            if (Math.hypot(c.x - lx, c.y - ly) >= 3.5) { dots.push([c.x, c.y, first ? 1 : 0]); lx = c.x; ly = c.y; }
        }
        this.guide = dots;
    },
    aim(inp) {
        const H = inp.held, P = inp.pressed, dir = (H.right ? 1 : 0) - (H.left ? 1 : 0);
        if (P.left || P.right) this.angle += (P.right ? 1 : -1) * 0.005;          // a tap moves it a hair
        if (dir) {
            this.aimHold++;
            // hold to swing, faster the longer it's held; Shift (or down) keeps it slow for fine aiming
            if (H.fine) this.angle += dir * 0.0025;
            else if (this.aimHold > 8) this.angle += dir * Math.min(0.028, 0.004 + (this.aimHold - 8) * 0.0007);
        } else this.aimHold = 0;
        const pt = inp.pointer;
        if (pt.down || P.screen) this.angle = Math.atan2(pt.x - FF_PX, Math.max(3, pt.y - FF_PY));
        this.angle = clamp(this.angle, -FF_AIM, FF_AIM);
    },
    fire() {
        if (this.left <= 0) return;
        this.left--;
        const a = this.angle;
        this.balls = [{ x: FF_PX + Math.sin(a) * FF_MUZ, y: FF_PY + Math.cos(a) * FF_MUZ, vx: Math.sin(a) * FF_V0, vy: Math.cos(a) * FF_V0, trail: [], lx: null, ly: null, slowT: 0 }];
        this.phase = 'fly'; this.shot = 0; this.shotHits = 0; this.hitList = []; this.flyT = 0; this.slowUsed = false; this.banner = Math.min(this.banner, 12);
        for (const p of this.pegs) p.touch = 0;
        this.recoil = 5;
        Sfx.play('jump');
    },
    update(inp) {
        this.t++;
        this.tick(true);
        const ph = this.phase;
        if (ph !== 'tally' && ph !== 'lose') this.aim(inp);
        if (ph === 'aim') { this.makeGuide(); if (inp.pressed.fire) this.fire(); }
        else if (ph === 'fly') this.fly();
        else if (ph === 'pop') this.popStep();
        else if (ph === 'tally') this.tally(inp);
        else if (ph === 'lose' && ++this.loseT > 120) this.over = true;
    },
    idle(inp) { this.t++; this.tick(false); this.aim(inp); this.makeGuide(); },
    /* everything that moves on its own: sparks, score pops, shake, the camera, the basket and the moving pegs */
    tick(live) {
        for (const q of this.parts) { q.x += q.vx; q.y += q.vy; q.vy += q.g; q.t++; }
        this.parts = this.parts.filter(q => q.t < q.life);
        this.pops = this.pops.filter(q => ++q.t < q.life);
        for (const p of this.pegs) if (p.flash) p.flash--;
        if (this.shake) this.shake--;
        if (this.hop) this.hop--;
        if (this.recoil) this.recoil--;
        if (live && this.banner) this.banner--;
        if (this.fever) this.feverT++;
        this.scale += ((this.slow ? 0.2 : 1) - this.scale) * 0.15;
        this.zoom += ((this.slow ? 1.9 : 1) - this.zoom) * (this.slow ? 0.1 : 0.08);
        let tx = ARCADE_W / 2, ty = ARCADE_H / 2;
        if (this.slow && this.focus) { const b = this.focusBall && !this.focusBall.out ? this.focusBall : this.focus; tx = (b.x + this.focus.x) / 2; ty = (b.y + this.focus.y) / 2; }
        this.fx += (tx - this.fx) * 0.15; this.fy += (ty - this.fy) * 0.15;
        if (this.phase !== 'fly') { this.T++; this.movePegs(); this.moveBasket(1); }
    },
    fly() {
        this.flyT++;
        this.slowCheck();
        const dt = this.scale / FF_SUB;
        this.dt = dt;
        for (let s = 0; s < FF_SUB; s++) {
            this.T += dt;
            this.movePegs(); this.moveBasket(dt);
            for (const b of this.balls) if (!b.out) { this.step(b, dt, null, this.onHit); this.landed(b); }
        }
        for (const b of this.balls) { b.trail.push([b.x, b.y]); if (b.trail.length > 4) b.trail.shift(); }
        this.unstick();
        this.balls = this.balls.filter(b => !b.out);
        if (!this.balls.length) { this.slow = 0; this.phase = 'pop'; this.popT = 8; }
    },
    /* a ball that stops moving can't be allowed to hang there: pegs it keeps leaning on pop early (Peggle does this
       too), a ball that barely moves gets a nudge, and a shot that somehow goes on and on is wrapped up */
    unstick() {
        for (const p of this.pegs) if (!p.gone && p.touch > 45) this.popEarly(p);
        for (const b of this.balls) {
            if (b.out) continue;
            b.slowT = Math.abs(b.vx) + Math.abs(b.vy) < 0.3 ? b.slowT + 1 : 0;
            if (b.slowT > 100) {
                b.slowT = 0;
                for (const p of this.pegs) if (!p.gone && Math.hypot(p.x - b.x, p.y - b.y) < 9) this.popEarly(p);
                b.vy += 0.8; b.vx += b.x < ARCADE_W / 2 ? 0.4 : -0.4;
            }
        }
        if (this.flyT > 60 * 20 && this.flyT % 40 === 0) {
            for (const b of this.balls) {
                let best = null, bd = 1e9;
                for (const p of this.pegs) { if (p.gone) continue; const d = Math.hypot(p.x - b.x, p.y - b.y); if (d < bd) { bd = d; best = p; } }
                if (best && bd < 24) this.popEarly(best);
            }
        }
        if (this.flyT > 60 * 45) for (const b of this.balls) b.out = true;
    },
    popEarly(p) {
        if (!p.lit) this.light(p, null);
        p.gone = true; this.puff(p);
        const i = this.hitList.indexOf(p);
        if (i >= 0) this.hitList.splice(i, 1);
    },
    hit(p, b, vn) {
        p.touch += this.dt;
        if (!p.lit) this.light(p, b);
        else if (vn < -0.6 && this.t - this.tockT > 4) { this.tockT = this.t; ffNote(60, 'pluck', 0.06); }
        b.lx = p.x; b.ly = p.y;
    },
    light(p, b) {
        p.lit = true; p.flash = 10;
        this.hitList.push(p);
        this.shotHits = (this.shotHits || 0) + 1;
        // Peggle's climbing notes: every peg in a shot rings a little higher
        ffNote(FF_NOTES[Math.min(FF_NOTES.length - 1, this.shotHits - 1)], p.kind === 'orange' || p.kind === 'purple' ? 'bell' : 'kalimba', p.kind === 'blue' ? 0.1 : 0.13);
        const col = FF_COL[p.kind];
        this.spark(p.x, p.y, col[2], p.kind === 'blue' ? 3 : 7);
        this.addScore(FF_PEG[p.kind] * this.mult, p.x, p.y - 7, p.kind === 'blue' ? '#a8d2ff' : col[2], p.kind === 'purple' ? 2 : 1);
        if (p.kind === 'orange') {
            this.orangeLeft--; this.oranges++; this.hop = 14;
            // a fortune peg lit from far away is a long shot
            if (b && b.lx != null && Math.hypot(p.x - b.lx, p.y - b.ly) > 70) { this.addScore(1000); this.pop('LONG SHOT! +1000', p.x, p.y - 15, '#ffd84a', 1, 50); Sfx.play('good'); }
            const m = this.multFor();
            if (m > this.mult && this.orangeLeft) { this.mult = m; this.pop('X' + m + '!', ARCADE_W / 2, 52, this.multCol(), 2, 50); Sfx.play('levelup'); }
            else this.mult = m;
            if (!this.orangeLeft) this.startFever(p);
        } else if (p.kind === 'purple') { Sfx.play('gold'); this.shake = Math.max(this.shake, 5); }
        else if (p.kind === 'green' && b) this.split(p, b);
    },
    multCol() { return { 1: '#ffffff', 2: '#8cf0ff', 3: '#7affa0', 5: '#ffd84a', 10: '#ff7aa8' }[this.mult] || '#ffffff'; },
    /* green peg: the ball splits and a second one bounces off the other way */
    split(p, b) {
        Sfx.play('levelup');
        this.pop('DOUBLE DUMPLING!', p.x, p.y - 14, '#b4f5ae', 1, 55);
        this.spark(p.x, p.y, '#ffffff', 8);
        if (this.balls.filter(q => !q.out).length >= 4) return;
        this.balls.push({ x: clamp(2 * p.x - b.x, FF_L + FF_BR, FF_R - FF_BR), y: b.y, vx: -b.vx || 0.6, vy: b.vy, trail: [], lx: p.x, ly: p.y, slowT: 0 });
    },
    addScore(pts, x, y, col, k) {
        const before = this.shot;
        this.score += pts; this.shot += pts; this.bestShot = Math.max(this.bestShot, this.shot);
        if (x != null) this.pop(pxNum(pts), x, y, col, k || 1, k > 1 ? 40 : 24);
        for (const th of FF_FREE) if (before < th && this.shot >= th && !this.fever) this.freeBall('BIG SHOT! FREE BALL', ARCADE_W / 2, 64);
    },
    freeBall(text, x, y) {
        this.left++;
        Sfx.play('item');
        this.pop(text, x, y, '#8cf0ff', 1, 60);
    },
    /* the basket (a free ball), the fever buckets, or off the bottom */
    landed(b) {
        if (this.fever) {
            if (b.y > FF_BY + 3) {
                const i = clamp(Math.floor((b.x - FF_L) / ((FF_R - FF_L) / 5)), 0, 4), cx = FF_L + (i + 0.5) * (FF_R - FF_L) / 5;
                b.out = true;
                this.addScore(FF_FEVER[i], cx, FF_BY - 10, '#ffd84a', 2);
                this.spark(cx, FF_BY, '#ffd84a', 14); this.spark(cx, FF_BY, '#ff7aa8', 8);
                this.shake = 10; Sfx.play('fanfare');
            }
            return;
        }
        if (b.vy > 0 && b.y > FF_BY && b.y < FF_BY + 8 && Math.abs(b.x - this.bx) < FF_BW - FF_RIM) {
            b.out = true;
            this.freeBall('FREE BALL!', this.bx, FF_BY - 10);
            this.spark(this.bx, FF_BY, '#ffd84a', 8);
        } else if (b.y > ARCADE_H + 5) b.out = true;
    },
    /* the last orange peg: if the ball is about to hit it, slow everything right down and lean in */
    slowCheck() {
        if (this.slow) {
            this.slowT++;
            if (this.slowEnd) { if (--this.slowEnd <= 0) this.slow = 0; }
            else if (this.slowT > 150) this.slow = 0;              // a near miss after all
            else if (this.slowT % 6 === 0) Sfx.play('reel');      // drum roll
            return;
        }
        if (this.orangeLeft !== 1 || this.fever || this.slowUsed) return;
        const p = this.pegs.find(q => q.kind === 'orange' && !q.lit);
        if (!p) return;
        for (const b of this.balls) {
            if (b.out || Math.hypot(b.x - p.x, b.y - p.y) > 40 || !this.willHit(b, p, 24)) continue;
            this.slow = 1; this.slowT = 0; this.slowEnd = 0; this.slowUsed = true; this.focus = p; this.focusBall = b;
            break;
        }
    },
    willHit(b, target, frames) {
        const c = { x: b.x, y: b.y, vx: b.vx, vy: b.vy }, dt = 1 / FF_SUB;
        let hit = false;
        const fn = p => { if (p === target) hit = true; };
        for (let i = 1; i <= frames * FF_SUB && !hit && c.y < ARCADE_H; i++) this.step(c, dt, this.T + i * dt, fn);
        return hit;
    },
    startFever(p) {
        this.fever = 1; this.feverT = 0;
        if (this.slow) this.slowEnd = 45;
        this.shake = 16;
        Sfx.play('firework');
        if (Sfx.notes) Sfx.notes(FF_ODE, 'bell', 0.11, 0.17);       // what else would you play
        for (let i = 0; i < 30; i++) { const a = R() * Math.PI * 2, s = 0.5 + R() * 2; this.parts.push({ x: p.x, y: p.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.5, g: 0.04, t: 0, life: 30 + R() * 20, col: `hsl(${Math.floor(R() * 360)},90%,65%)` }); }
        // the basket makes way for the five bonus buckets
        this.posts = [];
        for (let k = 1; k < 5; k++) { const x = FF_L + k * (FF_R - FF_L) / 5; this.posts.push([x, FF_BY, 0], [x, FF_BY + 5, 0]); }
    },
    /* after the shot, the lit pegs pop one by one */
    popStep() {
        if (--this.popT > 0) return;
        const p = this.hitList.shift();
        if (p) {
            if (!p.gone) { p.gone = true; this.puff(p); if (this.hitList.length % 2 === 0) Sfx.play('nibble'); }
            this.popT = this.hitList.length > 14 ? 1 : 3;
            return;
        }
        if (this.fever) { this.phase = 'tally'; this.tallyT = 0; this.cleared++; Sfx.play('party'); return; }
        if (this.left <= 0) { this.phase = 'lose'; this.loseT = 0; Sfx.play('miss'); return; }
        this.movePurple();
        this.phase = 'aim';
    },
    /* board clear: every ball left over is worth 1000, a board with no peg left standing 10000 more */
    tally(inp) {
        const t = ++this.tallyT;
        if (!this.doneT && t > 50 && t % 12 === 0) {
            if (this.left > 0) { this.left--; this.ballBonus++; this.score += 1000; Sfx.play('ticket'); }
            else {
                this.doneT = t;
                if (this.pegs.every(p => p.gone)) { this.perfect = true; this.score += 10000; Sfx.play('prize'); this.shake = 8; }
            }
        }
        if (this.doneT && (t > this.doneT + 300 || (t > this.doneT + 30 && (inp.pressed.fire || inp.pressed.screen)))) { Sfx.play('levelup'); this.nextBoard(); }
    },
    spark(x, y, col, n) { for (let i = 0; i < n; i++) { const a = R() * Math.PI * 2, s = 0.4 + R() * 1.2; this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.4, g: 0.05, t: 0, life: 14 + R() * 10, col }); } },
    puff(p) { const col = FF_LIT[p.kind][1]; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; this.parts.push({ x: p.x, y: p.y, vx: Math.cos(a) * 0.7, vy: Math.sin(a) * 0.7, g: 0, t: 0, life: 9, col }); } },
    pop(text, x, y, col, k, life) {
        const hw = pxWidth(text, k || 1) / 2 + 1;
        x = clamp(x, FF_L + hw, FF_R - hw);
        // a word that would land on top of a fresh one goes just above it instead
        while (this.pops.some(q => q.t < 12 && q.text.length > 4 && text.length > 4 && Math.abs(q.y - y) < 7 && Math.abs(q.x - x) < hw + 10)) y -= 8;
        this.pops.push({ text, x, y, col, k: k || 1, t: 0, life: life || 30 });
    },

    /* ------------------------------------------------ drawing */
    draw(g, t, state) {
        g.save();
        if (this.shake) { const s = Math.min(3, this.shake / 3); g.translate(Math.round((R() - 0.5) * 2 * s), Math.round((R() - 0.5) * 2 * s)); }
        if (this.zoom > 1.01) {
            // the slow-motion close-up: lean in on the ball and the last orange peg
            const z = this.zoom, hw = ARCADE_W / 2 / z, hh = ARCADE_H / 2 / z;
            g.translate(ARCADE_W / 2, ARCADE_H / 2); g.scale(z, z);
            g.translate(-clamp(this.fx, hw, ARCADE_W - hw), -clamp(this.fy, hh, ARCADE_H - hh));
        }
        this.drawBack(g, t);
        this.drawBasket(g, t);
        spr(g, 'fortune_' + (this.fever ? Math.floor(t / 8) % 2 : Math.floor(t / 30) % 2), 22, 26 - (this.hop ? Math.round(Math.sin(this.hop / 14 * Math.PI) * 4) : this.fever ? (Math.floor(t / 8) % 2) * 2 : 0));
        this.drawPegs(g, t);
        for (const q of this.parts) { g.globalAlpha = Math.max(0, 1 - q.t / q.life); g.fillStyle = q.col; g.fillRect(Math.round(q.x), Math.round(q.y), 1, 1); }
        g.globalAlpha = 1;
        if (this.phase === 'aim') this.drawGuide(g, t);
        for (const b of this.balls) {
            b.trail.forEach(([x, y], i) => { g.fillStyle = `rgba(255,230,170,${0.12 + i * 0.08})`; g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2); });
            g.drawImage(ffSprite('bigball', FF_BIGBALL, FF_BALLCOL), Math.round(b.x) - 3, Math.round(b.y) - 3);
        }
        for (const q of this.pops) {
            g.globalAlpha = Math.max(0, Math.min(1, 2 - 2 * q.t / q.life));
            pxShadow(g, q.text, Math.round(q.x), Math.round(Math.max(FF_TOP + 2, q.y - q.t * (q.k > 1 ? 0.25 : 0.35))), q.col, q.k, 'center', '#1a0e24');
        }
        g.globalAlpha = 1;
        g.restore();
        this.drawHud(g, t, state);
    },
    drawBack(g, t) {
        const sky = g.createLinearGradient(0, FF_TOP, 0, ARCADE_H);
        if (this.fever) { const h = (t * 4) % 360; sky.addColorStop(0, `hsl(${h},45%,22%)`); sky.addColorStop(1, `hsl(${(h + 70) % 360},50%,30%)`); }
        else { sky.addColorStop(0, this.lay.sky[0]); sky.addColorStop(1, this.lay.sky[1]); }
        g.fillStyle = sky; g.fillRect(0, 0, ARCADE_W, ARCADE_H);
        // Fortune Falls itself: soft streams of water running down behind the pegs
        for (let i = 0; i < 5; i++) {
            const x = 16 + i * 24 + (i % 2) * 4, w = 6 + (i % 3) * 2, sp = 0.4 + (i % 3) * 0.15;
            g.fillStyle = 'rgba(170,200,255,0.05)'; g.fillRect(x, FF_TOP, w, ARCADE_H);
            g.fillStyle = 'rgba(220,235,255,0.09)';
            for (let y = (t * sp + i * 23) % 16 - 16; y < ARCADE_H; y += 16) g.fillRect(x + 1 + (i * 3) % (w - 2), Math.round(y), 1, 6);
        }
        // a mist at the bottom where the falls land
        g.fillStyle = 'rgba(220,235,255,0.06)'; g.fillRect(0, ARCADE_H - 14, ARCADE_W, 14); g.fillRect(0, ARCADE_H - 7, ARCADE_W, 7);
        if (this.fever) for (let i = 0; i < 12; i++) { const x = (i * 47 + t * (1 + i % 3)) % ARCADE_W, y = (i * 31 + t * 0.7 * (1 + i % 2)) % ARCADE_H; g.fillStyle = (t + i * 5) % 20 < 10 ? '#ffffff' : '#ffd84a'; g.fillRect(Math.round(x), Math.round(y), 1, 1); }
    },
    drawPegs(g, t) {
        for (const p of this.pegs) {
            if (p.gone) continue;
            const x = Math.round(p.x), y = Math.round(p.y);
            if (p.lit) g.drawImage(ffSprite(p.kind + 'L', FF_DISC, FF_LIT[p.kind], 'rgba(255,255,255,0.3)'), x - 5, y - 5);
            else {
                g.drawImage(ffSprite(p.kind, FF_DISC, FF_COL[p.kind]), x - 3, y - 3);
                // the purple peg twinkles so it's easy to find; in the fever every peg left glimmers
                if (p.kind === 'purple' && t % 40 < 20) { g.fillStyle = '#ffffff'; g.fillRect(x + 3, y - 4, 1, 1); g.fillRect(x + 2, y - 5, 1, 1); }
                if (this.fever && (t + x) % 24 < 3) { g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(x - 1, y - 1, 2, 2); }
            }
            if (p.flash) { g.strokeStyle = `rgba(255,255,255,${p.flash / 12})`; g.lineWidth = 1; g.beginPath(); g.arc(x + 0.5, y + 0.5, 4 + (10 - p.flash) * 0.6, 0, Math.PI * 2); g.stroke(); }
        }
    },
    drawGuide(g, t) {
        if (this.left <= 0) return;
        const n = this.guide.length;
        this.guide.forEach(([x, y, after], i) => {
            const a = after ? 0.45 : 1 - 0.4 * i / Math.max(1, n);
            g.fillStyle = `rgba(20,10,30,${a * 0.6})`; g.fillRect(Math.round(x) + 1, Math.round(y) + 1, 1, 1);
            g.fillStyle = after ? `rgba(255,216,74,${a})` : `rgba(255,255,255,${a})`; g.fillRect(Math.round(x), Math.round(y), 1, 1);
        });
        const h = this.guideHit;
        if (h && t % 30 < 22) { g.strokeStyle = h.p.kind === 'orange' ? 'rgba(255,216,74,0.9)' : 'rgba(255,255,255,0.6)'; g.lineWidth = 1; g.strokeRect(Math.round(h.p.x) - 5.5, Math.round(h.p.y) - 5.5, 11, 11); }
    },
    drawLauncher(g, t) {
        const a = this.angle, back = this.recoil ? this.recoil * 0.5 : 0;
        g.save();
        g.translate(FF_PX + 0.5, FF_PY);
        g.rotate(-a);
        g.fillStyle = '#5a3418'; g.fillRect(-3, -back, 6, FF_MUZ + 1);
        g.fillStyle = '#e8b05a'; g.fillRect(-2, -back, 4, FF_MUZ);
        g.fillStyle = '#fff0c4'; g.fillRect(-2, -back, 1, FF_MUZ - 1);
        g.fillStyle = '#c0782a'; g.fillRect(-3, FF_MUZ - 2 - back, 6, 2);
        g.restore();
        // the launcher's hub: a fortune cookie, of course
        g.fillStyle = '#5a3418'; g.beginPath(); g.arc(FF_PX + 0.5, FF_PY, 6, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#e8b05a'; g.beginPath(); g.arc(FF_PX + 0.5, FF_PY, 5, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#b8782a'; g.fillRect(FF_PX - 1, FF_PY - 4, 2, 7);
        g.fillStyle = '#fff0c4'; g.fillRect(FF_PX - 3, FF_PY - 3, 2, 1);
        if (this.phase === 'aim' && this.left > 0) g.drawImage(ffSprite('bigball', FF_BIGBALL, FF_BALLCOL), Math.round(FF_PX + Math.sin(a) * FF_MUZ) - 3, Math.round(FF_PY + Math.cos(a) * FF_MUZ) - 3);
    },
    drawBasket(g, t) {
        if (this.fever) {
            // the five fever buckets, the middle one worth the most
            const w = (FF_R - FF_L) / 5, cols = ['#7a4ad0', '#3a8ad8', '#e0405a', '#3a8ad8', '#7a4ad0'];
            for (let i = 0; i < 5; i++) {
                const x0 = Math.round(FF_L + i * w), x1 = Math.round(FF_L + (i + 1) * w);
                g.fillStyle = cols[i]; g.fillRect(x0, FF_BY + 1, x1 - x0, ARCADE_H - FF_BY);
                g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(x0, FF_BY + 1, x1 - x0, 1);
                const v = FF_FEVER[i];
                pxText(g, v >= 10000 ? '10K' : v >= 5000 ? '5K' : '2.5K', Math.round((x0 + x1) / 2), FF_BY + 3, (t + i * 6) % 30 < 15 ? '#ffffff' : '#ffd84a', 1, 'center');
            }
            g.fillStyle = '#ffd84a';
            for (let k = 1; k < 5; k++) { const x = Math.round(FF_L + k * w); g.fillRect(x - 1, FF_BY - 1, 2, ARCADE_H - FF_BY + 1); }
            return;
        }
        // a bamboo steamer basket
        const x = Math.round(this.bx), w = FF_BW, y = FF_BY - 1;
        g.fillStyle = '#6a3e1a'; g.fillRect(x - w - 2, y - 1, w * 2 + 5, ARCADE_H - y + 1);
        g.fillStyle = '#d8a85a'; g.fillRect(x - w - 1, y, w * 2 + 3, ARCADE_H - y);
        g.fillStyle = '#4a2a14'; g.fillRect(x - w + 1, y, w * 2 - 1, 2);
        g.fillStyle = '#b07a3a'; g.fillRect(x - w - 1, y + 4, w * 2 + 3, 1); g.fillRect(x - w - 1, y + 7, w * 2 + 3, 1);
        g.fillStyle = '#f2d08a'; g.fillRect(x - w - 1, y - 1, 3, 1); g.fillRect(x + w - 1, y - 1, 3, 1);
    },
    drawHud(g, t, state) {
        // walls: the ball tube on the left, the fortune meter on the right
        g.fillStyle = '#2a1640'; g.fillRect(0, FF_TOP, FF_L, ARCADE_H); g.fillRect(FF_R, FF_TOP, ARCADE_W - FF_R, ARCADE_H);
        g.fillStyle = '#d9a84a'; g.fillRect(FF_L - 1, FF_TOP, 1, ARCADE_H); g.fillRect(FF_R, FF_TOP, 1, ARCADE_H);
        const ball = ffSprite('ball', FF_BALL, FF_BALLCOL);
        for (let i = 0; i < Math.min(this.left, 27); i++) g.drawImage(ball, 0, FF_TOP + 3 + i * 5);
        const K = this.orangeTotal, mh = ARCADE_H - FF_TOP - 6, my = ARCADE_H - 3, hit = K - this.orangeLeft;
        g.fillStyle = '#140a20'; g.fillRect(FF_R + 2, FF_TOP + 3, 3, mh);
        g.fillStyle = this.fever ? `hsl(${(t * 6) % 360},90%,60%)` : '#ff8a1e';
        const fill = Math.round(mh * hit / K);
        g.fillRect(FF_R + 2, my - fill, 3, fill);
        g.fillStyle = '#ffffff';
        for (const f of [0.4, 0.6, 0.76, 0.88]) g.fillRect(FF_R + 1, Math.round(my - mh * Math.ceil(K * f - 1e-9) / K), 5, 1);
        // the top bar: score, this shot, the multiplier
        g.fillStyle = '#1b1030'; g.fillRect(0, 0, ARCADE_W, FF_TOP);
        g.fillStyle = '#d9a84a'; g.fillRect(0, FF_TOP - 1, ARCADE_W, 1);
        pxShadow(g, pxNum(this.score), 3, 2, '#ffffff', 1, 'left', '#3b2a45');
        if ((this.phase === 'fly' || this.phase === 'pop') && this.shot) pxShadow(g, '+' + pxNum(this.shot), 79, 2, '#ffd84a', 1, 'left', '#3b2a45');
        else pxText(g, 'BEST ' + pxNum(Math.max(this.score, arc().best.fortune || 0)), 79, 2, '#8a6aa8', 1, 'left');
        pxShadow(g, 'X' + this.mult, ARCADE_W - 3, 2, this.multCol(), 1, 'right', '#3b2a45');
        if (this.zoom < 1.05) this.drawLauncher(g, t);
        // messages over the board
        const mid = (y, h) => { g.fillStyle = 'rgba(18,10,30,0.7)'; g.fillRect(FF_L, y, FF_R - FF_L, h); };
        if (this.banner && this.phase !== 'tally' && state !== 'ready') {
            g.globalAlpha = Math.min(1, this.banner / 20);
            mid(56, 28);
            pxShadow(g, 'BOARD ' + (this.board + 1), ARCADE_W / 2, 60, '#ffd84a', 2, 'center');
            pxShadow(g, this.lay.name, ARCADE_W / 2, 74, '#ffffff', 1, 'center');
            g.globalAlpha = 1;
        }
        if (this.phase === 'aim' && this.left === 1 && !this.banner && t % 40 < 28) pxShadow(g, 'LAST BALL!', ARCADE_W / 2, 132, '#ff9aa8', 1, 'center', '#1a0e24');
        if (this.fever && this.feverT < 130 && this.phase !== 'tally') {
            const k = this.feverT < 8 ? 1 : 2;
            g.globalAlpha = Math.min(1, (130 - this.feverT) / 20);
            mid(42, 32);
            ['EXTREME', 'FEVER!'].forEach((w, j) => {
                const y = 46 + j * 14;
                let x = Math.round(ARCADE_W / 2 - pxWidth(w, k) / 2);
                pxText(g, w, x + k, y + k, '#120c22', k);
                for (const ch of w) { pxText(g, ch, x, y, `hsl(${(t * 8 + x * 4) % 360},95%,68%)`, k); x += pxWidth(ch, k) + k; }
            });
            g.globalAlpha = 1;
        }
        if (this.phase === 'tally') {
            mid(28, 98);
            pxShadow(g, 'BOARD CLEAR!', ARCADE_W / 2, 33, '#ffd84a', 2, 'center');
            pxShadow(g, 'BALLS LEFT ' + this.ballBonus + ' X 1000', ARCADE_W / 2, 50, '#ffffff', 1, 'center');
            if (this.perfect) pxShadow(g, 'EVERY PEG! +10000', ARCADE_W / 2, 59, (t % 20 < 10) ? '#ff7aa8' : '#ffd84a', 1, 'center');
            if (this.doneT) {
                // a fortune from the cookie
                g.fillStyle = '#fffaf0'; g.fillRect(12, 70, ARCADE_W - 24, 22);
                g.fillStyle = '#e8d8c0'; g.fillRect(12, 91, ARCADE_W - 24, 1);
                this.slip.split('|').forEach((l, i) => pxText(g, l, ARCADE_W / 2, 73 + i * 9, '#c0302a', 1, 'center'));
                spr(g, 'fortune_' + Math.floor(t / 20) % 2, 20, 118);
                pxShadow(g, 'SCORE ' + pxNum(this.score), ARCADE_W / 2 + 6, 100, '#ffffff', 1, 'center');
                if (this.tallyT > this.doneT + 30 && t % 40 < 28) pxShadow(g, 'FIRE: NEXT BOARD', ARCADE_W / 2 + 6, 112, '#8cf0ff', 1, 'center');
            }
        }
        if (this.phase === 'lose') {
            mid(56, 30);
            pxShadow(g, 'OUT OF BALLS', ARCADE_W / 2, 60, '#ff9aa8', 2, 'center');
            pxShadow(g, this.orangeLeft + ' FORTUNE ' + plural(this.orangeLeft, 'PEG') + ' TO GO', ARCADE_W / 2, 76, '#ffffff', 1, 'center');
        }
    },
};
ARCADE_GAMES.fortune = {
    name: 'Fortune Falls', fee: PLAY_FEE, tune: 'fortune', glow: '#ff8a1e',
    help: '\u2190 \u2192 aim (hold Shift or \u2193 for fine aim) \u00b7 or tap/drag the screen \u00b7 Space fires',
    how: "Fortune's lucky pegboard! Aim the launcher and drop a sesame ball through the pegs: light up every orange fortune peg to clear the board, and the fewer that are left, the more everything scores. Catch the ball in the steamer basket for a free one, hit the purple peg for a big bonus, and a green peg makes a Double Dumpling (two balls!). Ten balls to start, and Fortune says your future looks bouncy.",
    buttons: [
        { k: 'left', label: '\u25c0', keys: MOVE_KEYS.left, side: 'L', aria: 'Aim left' },
        { k: 'right', label: '\u25b6', keys: MOVE_KEYS.right, side: 'L', aria: 'Aim right' },
        { k: 'fine', label: 'FINE', keys: ['ShiftLeft', 'ShiftRight', 'ArrowDown', 'KeyS'], side: 'R', aria: 'Aim finely', noPad: true },
        { k: 'fire', label: 'FIRE', keys: MOVE_KEYS.drop.concat(['ArrowUp', 'KeyW']), side: 'R', aria: 'Fire', wide: true },
    ],
    create() { return new FortuneGame(); },
    tickets(g) { return g.score > 0 ? Math.max(1, Math.floor(g.score / 1600) + g.cleared * 2) : 0; },
    result(g) {
        const best = arc().best.fortune || 0;
        return { title: g.score >= best && g.score > 0 ? 'New best!' : g.cleared ? 'What a run!' : g.quit ? 'Game over' : 'Out of balls', lines: [
            `${fmtNum(g.score)} points \u00b7 ${g.cleared} ${plural(g.cleared, 'board')} cleared \u00b7 ${g.oranges} fortune ${plural(g.oranges, 'peg')}`,
            `Best: ${fmtNum(Math.max(best, g.score))} \u00b7 biggest shot ${fmtNum(g.bestShot)}`,
            `Fortune says: "${rpick(FORTUNES)}"`] };
    },
};

/* its music and its line on the high score board */
TUNES.fortune = { bpm: 116, root: 65, scale: 'major', lead: 'bell', chords: [1, 4, 6, 5, 1, 4, 2, 5, 6, 4, 1, 5, 2, 5, 1, 1], form: 'ABCDABCEFGFHABCE', vary: true,
    mel: { A: '5 . 6 5 3 . 2 .', B: '3 . 5 . 6 . . .', C: '^1 . 6 5 3 . 5 6', D: '5 . 3 . 2 . . .', E: '1 . . . . . . .', F: '6 . ^1 . 6 5 3 .', G: '5 . 6 . 5 . 3 .', H: '2 . 3 . 5 . 6 .' },
    leadVol: 0.12, bass: 'x.o.x.o.', arp: 'x.x.x.x.', arpInstr: 'kalimba', arpVol: 0.035, drums: { kick: 'x...x...', snare: '....x...', shaker: 'oxoxoxox' }, drumVol: 0.22 };
FIXED_TUNES.push('fortune');
HISCORE_RIVALS.fortune = [['FORTUNE', 60000, 'she saw it coming'], ['MAKI', 41000, 'worked out every bounce'], ['KAI', 17000, '"the pegs told me to"']];
ARC_TARGET.fortune = [8000, 20000, 40000];
TRACK_NAMES.fortune = 'Fortune Falls';
