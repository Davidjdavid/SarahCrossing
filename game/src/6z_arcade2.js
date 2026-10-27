/* ---- 6z_arcade2.js ---- */
/* Three more cabinets, in the arcade's back room since David's swap (with Fruit Catch, the old classics): Surf's Up (Kai's: one button, jump the rocks, grab the shells), Gopher Garden
   (Basil and Cuke's: bonk the gophers, never bonk Cuke) and Noodle Slurp (Basil's: a noodle that grows as it slurps,
   don't bite your own tail). They run in the same cabinet overlay as the others (59_arcade.js). */

/* ---------------------------------------------------------------- Surf's Up */
const SURF_SEA = 112;                       // where the water's surface sits
function SurfGame() {
    this.t = 0; this.score = 0; this.dist = 0; this.shells = 0; this.over = false; this.speed = 1.6;
    this.y = SURF_SEA; this.vy = 0; this.jumps = 0; this.things = []; this.pops = []; this.spray = [];
    this.nextT = 70; this.wipe = 0; this.lives = 3; this.hurt = 0; this.best = 0; this.chain = 0;
}
SurfGame.prototype = {
    jump() {
        if (this.jumps >= 2 || this.wipe) return;
        this.vy = this.jumps ? -2.6 : -3.3; this.jumps++;
        Sfx.play('jump');
        for (let i = 0; i < 5; i++) this.spray.push({ x: 34 + R() * 6, y: this.y, vx: -R() * 1.5, vy: -R() * 1.6, t: 0 });
    },
    spawn() {
        const r = R(), x = ARCADE_W + 10;
        if (r < 0.42) this.things.push({ kind: 'rock', x, y: SURF_SEA, w: 7 + Math.floor(R() * 5) });
        else if (r < 0.58 && this.dist > 300) this.things.push({ kind: 'gull', x, y: SURF_SEA - 28 - R() * 10, ph: R() * 6 });
        else if (r < 0.7 && this.dist > 600) this.things.push({ kind: 'jelly', x, y: SURF_SEA - 2, ph: R() * 6 });
        // shells in a little arc, worth jumping for
        const n = 3 + Math.floor(R() * 3), h = 14 + R() * 20;
        for (let i = 0; i < n; i++) this.things.push({ kind: R() < 0.12 ? 'star' : 'shell', x: x + 28 + i * 9, y: SURF_SEA - 8 - Math.sin((i / (n - 1)) * Math.PI) * h });
        this.nextT = Math.round(lerp(80, 38, Math.min(1, this.dist / 6000)) * (0.7 + R() * 0.6));
    },
    update(inp) {
        this.t++;
        const P = inp.pressed;
        if (P.jump || P.screen) this.jump();
        if (this.wipe) { if (--this.wipe === 0 && this.lives <= 0) { this.over = true; Sfx.play('gameover'); } return this.tidy(); }
        this.speed = Math.min(4.2, 1.6 + this.dist / 2500);
        this.dist += this.speed;
        this.score = Math.floor(this.dist / 10) + this.shells;
        // the board: up, then back down onto the wave
        this.vy += inp.held.jump || inp.pointer.down ? 0.16 : 0.24;        // holding floats a little longer
        this.y += this.vy;
        if (this.y >= SURF_SEA) { if (this.jumps) Sfx.play('plop'); this.y = SURF_SEA; this.vy = 0; this.jumps = 0; }
        if (--this.nextT <= 0) this.spawn();
        const px = 36, py = this.y;
        for (const o of this.things) {
            o.x -= this.speed * (o.kind === 'gull' ? 1.3 : 1);
            if (o.kind === 'gull') o.y += Math.sin(this.t / 10 + o.ph) * 0.3;
            if (o.kind === 'jelly') o.y = SURF_SEA - 2 - Math.abs(Math.sin(this.t / 14 + o.ph)) * 18;
            if (o.done) continue;
            const hit = o.kind === 'rock' ? Math.abs(o.x - px) < (o.w / 2 + 4) && py > SURF_SEA - 7
                : o.kind === 'gull' ? Math.abs(o.x - px) < 8 && Math.abs(o.y - (py - 10)) < 9
                    : o.kind === 'jelly' ? Math.abs(o.x - px) < 6 && Math.abs(o.y - (py - 4)) < 8
                        : Math.abs(o.x - px) < 7 && Math.abs(o.y - (py - 8)) < 9;
            if (!hit) continue;
            o.done = true;
            if (o.kind === 'shell' || o.kind === 'star') {
                const pts = o.kind === 'star' ? 25 : 5 + Math.min(10, this.chain);
                this.chain++; this.shells += pts; this.best = Math.max(this.best, this.chain);
                Sfx.play(o.kind === 'star' ? 'gold' : 'catch');
                this.pops.push({ text: '+' + pts, x: o.x, y: o.y - 6, t: 0, col: o.kind === 'star' ? '#ffd84a' : '#ffffff' });
            } else if (!this.hurt) this.crash(o);
        }
        // a shell missed breaks the chain
        for (const o of this.things) if (!o.done && !o.passed && (o.kind === 'shell' || o.kind === 'star') && o.x < px - 10) { o.passed = true; this.chain = 0; }
        if (this.hurt) this.hurt--;
        this.tidy();
    },
    crash(o) {
        this.lives--; this.hurt = 90; this.wipe = 40; this.chain = 0; this.vy = -2;
        Sfx.play('ouch');
        this.pops.push({ text: { rock: 'BONK!', gull: 'SQUAWK!', jelly: 'ZAP!' }[o.kind] || 'OOF', x: 36, y: this.y - 20, t: 0, col: '#ff9aa8' });
    },
    tidy() {
        this.things = this.things.filter(o => o.x > -20 && !(o.done && o.kind !== 'rock'));
        this.pops = this.pops.filter(p => ++p.t < 30);
        for (const s of this.spray) { s.x += s.vx - this.speed * 0.4; s.y += s.vy; s.vy += 0.15; s.t++; }
        this.spray = this.spray.filter(s => s.t < 24);
    },
    idle() { this.t++; this.y = SURF_SEA + Math.sin(this.t / 20) * 1.5; },
    draw(g, t) {
        const sky = g.createLinearGradient(0, 0, 0, SURF_SEA);
        sky.addColorStop(0, '#ffb07a'); sky.addColorStop(0.5, '#ffd9a8'); sky.addColorStop(1, '#bfe8f2');
        g.fillStyle = sky; g.fillRect(0, 0, ARCADE_W, SURF_SEA);
        g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(104, 40, 14, 0, Math.PI * 2); g.fill();
        // far island and the horizon
        g.fillStyle = '#7ab0b8'; g.fillRect(0, 70, ARCADE_W, 3);
        const off = (this.dist * 0.15) % 200;
        g.fillStyle = '#6a9a6a'; g.beginPath(); g.ellipse(160 - off, 70, 30, 7, 0, Math.PI, 0); g.fill();
        // the sea, in bands that slide at different speeds
        const bands = [['#4f9fc9', 73, 0.3], ['#3a8fd0', 84, 0.6], ['#2f7fc0', 98, 1]];
        for (const [c, y, k] of bands) {
            g.fillStyle = c; g.fillRect(0, y, ARCADE_W, ARCADE_H - y);
            g.fillStyle = 'rgba(255,255,255,0.35)';
            const o = (this.dist * k) % 24;
            for (let x = -o; x < ARCADE_W; x += 24) g.fillRect(Math.round(x), y + 3, 7, 1);
        }
        // the wave Sarah rides
        g.fillStyle = '#2a6aa8'; g.fillRect(0, SURF_SEA + 2, ARCADE_W, ARCADE_H);
        g.fillStyle = '#e8f8ff';
        const wo = (this.dist * 1.2) % 12;
        for (let x = -wo; x < ARCADE_W; x += 12) { g.fillRect(Math.round(x), SURF_SEA + 1, 6, 1); g.fillRect(Math.round(x) + 2, SURF_SEA, 3, 1); }
        for (const o of this.things) {
            if (o.done && o.kind !== 'rock') continue;
            const x = Math.round(o.x), y = Math.round(o.y);
            if (o.kind === 'rock') { g.fillStyle = '#5a5866'; g.fillRect(x - o.w / 2, y - 6, o.w, 8); g.fillStyle = '#7a7888'; g.fillRect(x - o.w / 2 + 1, y - 6, o.w - 3, 2); g.fillStyle = '#e8f8ff'; g.fillRect(x - o.w / 2 - 2, y + 1, o.w + 4, 1); }
            else if (o.kind === 'gull') { const f = Math.floor(t / 6) % 2; g.fillStyle = '#ffffff'; g.fillRect(x - 3, y, 7, 2); g.fillRect(x - 6, y - 1 - f, 3, 1); g.fillRect(x + 4, y - 1 - f, 3, 1); g.fillStyle = '#ffb53a'; g.fillRect(x - 5, y + 1, 2, 1); }
            else if (o.kind === 'jelly') { g.fillStyle = 'rgba(255,170,220,0.9)'; g.fillRect(x - 4, y - 4, 8, 4); g.fillStyle = 'rgba(255,170,220,0.6)'; for (let k = -3; k <= 3; k += 2) g.fillRect(x + k, y, 1, 3 + ((t / 5 + k) & 1)); }
            else if (o.kind === 'star') { g.fillStyle = '#ffd84a'; g.fillRect(x - 1, y - 4, 3, 9); g.fillRect(x - 4, y - 1, 9, 3); }
            else { g.fillStyle = '#ffb59a'; g.fillRect(x - 3, y - 2, 7, 3); g.fillRect(x - 2, y - 3, 5, 1); g.fillRect(x - 1, y + 1, 3, 1); g.fillStyle = '#e8846a'; g.fillRect(x - 1, y - 2, 1, 3); g.fillRect(x + 1, y - 2, 1, 3); g.fillStyle = '#fff1e8'; g.fillRect(x - 2, y - 2, 1, 1); }
        }
        for (const s of this.spray) { g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(Math.round(s.x), Math.round(s.y), 1, 1); }
        // the surfer
        if (!(this.hurt && Math.floor(this.hurt / 4) % 2)) {
            const x = 36, y = Math.round(this.y), tilt = this.wipe ? 1 : 0;
            g.fillStyle = '#ff7a6a'; g.fillRect(x - 9, y - 2 + tilt, 18, 3);
            g.fillStyle = '#ffd84a'; g.fillRect(x - 8, y - 1 + tilt, 16, 1);
            spr(g, sarahSprite(S.player.outfit, this.jumps ? 'down_cheer' : 'side_stand'), x, y - 2, false);
        }
        popText(g, this.pops, 0, 0);
        for (let i = 0; i < 3; i++) pxText(g, '*', 5 + i * 9, 5, i < this.lives ? '#e0405a' : 'rgba(59,42,69,0.3)', 2);
        pxShadow(g, pxNum(this.score), ARCADE_W - 5, 5, '#ffffff', 1, 'right', '#3b2a45');
        pxShadow(g, 'BEST ' + pxNum(Math.max(this.score, arc().best.surf || 0)), ARCADE_W - 5, 13, '#ffd84a', 1, 'right', '#3b2a45');
        if (this.chain >= 5) pxShadow(g, this.chain + ' SHELLS IN A ROW', ARCADE_W / 2, 24, '#ffffff', 1, 'center', '#3b2a45');
    },
};
ARCADE_GAMES.surf = {
    name: "Surf's Up", fee: PLAY_FEE, tune: 'surf', glow: '#7fd3e8',
    help: 'Space (or tap) jumps \u00b7 jump again in the air \u00b7 hold to float',
    how: "Ride Kai's wave. Jump over rocks, stay low under gulls, avoid jellyfish, and collect shells.\n\nCollect shells in a row for more points. Three wipeouts end the ride.",
    buttons: [{ k: 'jump', label: 'JUMP', keys: MOVE_KEYS.drop.concat(['ArrowUp', 'KeyW']), side: 'R', aria: 'Jump', wide: true }],
    create() { return new SurfGame(); },
    tickets(g) { return g.score > 0 ? Math.max(1, Math.floor(g.score / 40)) : 0; },
    result(g) {
        const best = arc().best.surf || 0;
        return { title: g.score >= best && g.score > 0 ? 'New best!' : 'Wiped out', lines: [`${fmtNum(g.score)} points \u00b7 ${fmtNum(Math.floor(g.dist / 10))} m ridden`, `Best: ${fmtNum(Math.max(best, g.score))} \u00b7 longest shell run ${g.best}`] };
    },
};

/* ---------------------------------------------------------------- Gopher Garden */
const GARDEN_HOLES = [];
for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) GARDEN_HOLES.push([24 + c * 44, 48 + r * 34]);
function GardenGame() {
    this.t = 0; this.score = 0; this.over = false; this.left = 60 * 45; this.pops = []; this.pop = new Array(9).fill(null);
    this.cur = 4; this.combo = 0; this.best = 0; this.bonked = 0; this.nextT = 30; this.miss = 0; this.flash = 0;
}
GardenGame.prototype = {
    spawn() {
        const free = this.pop.map((p, i) => p ? -1 : i).filter(i => i >= 0);
        if (!free.length) return;
        const i = rpick(free), lv = Math.min(1, this.t / (60 * 40)), r = R();
        const who = r < 0.07 ? 'gold' : r < 0.07 + lerp(0.08, 0.2, lv) ? 'cuke' : 'gopher';
        this.pop[i] = { who, t: 0, up: Math.round(lerp(78, 40, lv) * (who === 'gold' ? 0.7 : 1)), hit: 0 };
        this.nextT = Math.round(lerp(34, 14, lv) * (0.7 + R() * 0.6));
    },
    bonk(i) {
        const p = this.pop[i];
        this.flash = 6;
        if (!p || p.hit || p.t > p.up) { Sfx.play('miss'); this.combo = 0; return; }
        p.hit = 1; p.t = Math.max(p.t, p.up - 10);
        const [x, y] = GARDEN_HOLES[i];
        if (p.who === 'cuke') {
            this.score = Math.max(0, this.score - 30); this.combo = 0; Sfx.play('ouch');
            this.pops.push({ text: 'NOT CUKE! -30', x, y: y - 16, t: 0, col: '#ff9aa8' });
            return;
        }
        this.combo++; this.bonked++; this.best = Math.max(this.best, this.combo);
        const pts = (p.who === 'gold' ? 50 : 10) + Math.min(20, this.combo * 2);
        this.score += pts;
        if (p.who === 'gold') { this.left += 60 * 3; this.pops.push({ text: '+3 SEC', x, y: y - 24, t: 0, col: '#8cf0ff' }); }
        Sfx.play(p.who === 'gold' ? 'gold' : 'bite');
        this.pops.push({ text: '+' + pts, x, y: y - 16, t: 0, col: p.who === 'gold' ? '#ffd84a' : '#ffffff' });
    },
    update(inp) {
        this.t++;
        const P = inp.pressed;
        // keyboard: move the trowel around the 3x3 garden; tap or click: bonk that hole
        if (P.left) this.cur = this.cur % 3 ? this.cur - 1 : this.cur;
        if (P.right) this.cur = this.cur % 3 < 2 ? this.cur + 1 : this.cur;
        if (P.up) this.cur = this.cur >= 3 ? this.cur - 3 : this.cur;
        if (P.down) this.cur = this.cur < 6 ? this.cur + 3 : this.cur;
        if (P.left || P.right || P.up || P.down) this.touch = false;
        if (P.bonk) this.bonk(this.cur);
        if (P.screen) {
            this.touch = true;                  // once someone taps, the keyboard frame goes away
            const { x, y } = inp.pointer;
            let bi = -1, bd = 1e9;
            GARDEN_HOLES.forEach(([hx, hy], i) => { const d = Math.hypot(hx - x, hy - 6 - y); if (d < bd) { bd = d; bi = i; } });
            if (bd < 22) { this.cur = bi; this.bonk(bi); }
        }
        if (--this.nextT <= 0) this.spawn();
        for (let i = 0; i < 9; i++) {
            const p = this.pop[i];
            if (!p) continue;
            p.t++;
            if (p.t > p.up + 10) {
                if (!p.hit && p.who !== 'cuke') { this.combo = 0; this.miss++; }
                this.pop[i] = null;
            }
        }
        this.pops = this.pops.filter(q => ++q.t < 30);
        if (this.flash) this.flash--;
        if (--this.left <= 0) { this.left = 0; this.over = true; Sfx.play('gameover'); }
    },
    idle() { this.t++; if (this.t % 50 === 0) { const i = Math.floor(R() * 9); this.pop[i] = { who: 'gopher', t: 0, up: 30, hit: 0 }; } for (let i = 0; i < 9; i++) { const p = this.pop[i]; if (p && ++p.t > p.up + 10) this.pop[i] = null; } },
    draw(g, t) {
        g.fillStyle = '#8cc152'; g.fillRect(0, 0, ARCADE_W, ARCADE_H);
        g.fillStyle = '#7ab046';
        for (let y = 0; y < ARCADE_H; y += 8) for (let x = (y / 8) % 2 * 8; x < ARCADE_W; x += 16) g.fillRect(x, y, 8, 8);
        // a fence along the top, with veggies peeking out
        g.fillStyle = '#c9954f'; g.fillRect(0, 22, ARCADE_W, 3);
        for (let x = 4; x < ARCADE_W; x += 12) { g.fillStyle = '#c9954f'; g.fillRect(x, 16, 3, 12); g.fillStyle = '#e8c48a'; g.fillRect(x, 16, 3, 1); }
        GARDEN_HOLES.forEach(([x, y], i) => {
            g.fillStyle = '#6b4a2b'; g.beginPath(); g.ellipse(x, y, 13, 6, 0, 0, Math.PI * 2); g.fill();
            g.fillStyle = '#3e2a18'; g.beginPath(); g.ellipse(x, y, 10, 4, 0, 0, Math.PI * 2); g.fill();
            const p = this.pop[i];
            if (p) {
                const rise = p.t < 8 ? p.t / 8 : p.t > p.up ? Math.max(0, 1 - (p.t - p.up) / 10) : 1;
                const h = Math.round(rise * 14);
                g.save(); g.beginPath(); g.rect(x - 14, y - 26, 28, 26); g.clip();
                if (p.who === 'cuke') spr(g, 'cuke_0', x, y + 16 - h);
                else {
                    const col = p.who === 'gold' ? '#ffd84a' : '#a8743a', dk = p.who === 'gold' ? '#c9a22a' : '#7a5228';
                    const yy = y - h + 2;
                    g.fillStyle = dk; g.fillRect(x - 6, yy - 12, 3, 3); g.fillRect(x + 3, yy - 12, 3, 3);
                    g.fillRect(x - 7, yy - 8, 14, 11); g.fillRect(x - 5, yy - 10, 10, 2);
                    g.fillStyle = col; g.fillRect(x - 6, yy - 9, 12, 11); g.fillRect(x - 4, yy - 10, 8, 1);
                    g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(x - 5, yy - 9, 4, 2);
                    g.fillStyle = '#f2d8b8'; g.fillRect(x - 3, yy - 4, 6, 4);
                    g.fillStyle = '#2d2230';
                    if (p.hit) { g.fillRect(x - 4, yy - 7, 2, 1); g.fillRect(x + 2, yy - 7, 2, 1); } else { g.fillRect(x - 4, yy - 8, 2, 2); g.fillRect(x + 2, yy - 8, 2, 2); }
                    g.fillStyle = '#ff9aa8'; g.fillRect(x - 1, yy - 4, 2, 1);
                    g.fillStyle = '#ffffff'; g.fillRect(x - 1, yy - 2, 1, 2); g.fillRect(x, yy - 2, 1, 2);
                    if (p.hit) { g.fillStyle = '#ffd84a'; g.fillRect(x - 8, yy - 14, 2, 2); g.fillRect(x + 6, yy - 15, 2, 2); }
                }
                g.restore();
            }
            g.fillStyle = '#6b4a2b'; g.fillRect(x - 13, y, 26, 2);
            if (i === this.cur && !this.touch) {
                g.strokeStyle = this.flash ? '#ffffff' : '#ffd84a'; g.lineWidth = 1;
                g.strokeRect(x - 15.5, y - 24.5, 31, 31);
            }
        });
        popText(g, this.pops, 0, 0);
        const secs = Math.ceil(this.left / 60);
        pxShadow(g, 'TIME ' + secs, 5, 5, secs <= 10 && Math.floor(t / 10) % 2 ? '#ff9aa8' : '#ffffff', 1, 'left', '#3b2a45');
        pxShadow(g, pxNum(this.score), ARCADE_W - 5, 5, '#ffffff', 1, 'right', '#3b2a45');
        pxShadow(g, 'BEST ' + pxNum(Math.max(this.score, arc().best.garden || 0)), ARCADE_W - 5, 13, '#ffd84a', 1, 'right', '#3b2a45');
        if (this.combo >= 3) pxShadow(g, this.combo + ' COMBO', ARCADE_W / 2, 150 - 8, '#ffffff', 1, 'center', '#3b2a45');
    },
};
ARCADE_GAMES.garden = {
    name: 'Gopher Garden', fee: PLAY_FEE, tune: 'garden', glow: '#8cc152',
    help: 'Tap a gopher \u00b7 or arrows + Space',
    how: "Bonk the gophers before they hide. Golden gophers score more and add time. Leave Cuke alone when he jogs through.\n\nYou have 45 seconds.",
    buttons: [
        { k: 'left', label: '\u25c0', keys: MOVE_KEYS.left, side: 'L', aria: 'Left' },
        { k: 'up', label: '\u25b2', keys: ['ArrowUp', 'KeyW'], side: 'L', aria: 'Up' },
        { k: 'down', label: '\u25bc', keys: MOVE_KEYS.down, side: 'L', aria: 'Down' },
        { k: 'right', label: '\u25b6', keys: MOVE_KEYS.right, side: 'L', aria: 'Right' },
        { k: 'bonk', label: 'BONK', keys: MOVE_KEYS.drop, side: 'R', aria: 'Bonk', wide: true },
    ],
    create() { return new GardenGame(); },
    tickets(g) { return g.score > 0 ? Math.max(1, Math.floor(g.score / 25)) : 0; },
    result(g) {
        const best = arc().best.garden || 0;
        return { title: g.score >= best && g.score > 0 ? 'New best!' : "Time's up", lines: [`${fmtNum(g.score)} points \u00b7 ${g.bonked} ${plural(g.bonked, 'gopher')} bonked`, `Best: ${fmtNum(Math.max(best, g.score))} \u00b7 best combo ${g.best}`] };
    },
};

/* ---------------------------------------------------------------- Noodle Slurp */
const NOODLE_C = 8, NOODLE_W = 17, NOODLE_H = 15, NOODLE_TOP = 22;
const NOODLE_FOOD = { veg: { pts: 10, grow: 1, col: '#7acc5e' }, shrimp: { pts: 30, grow: 2, col: '#ff8a6a' }, lime: { pts: 5, grow: -2, col: '#c8e84a' }, chili: { pts: 20, grow: 1, col: '#e2382b' } };
function NoodleGame() {
    this.t = 0; this.score = 0; this.over = false; this.pops = [];
    this.body = [[8, 9], [7, 9], [6, 9]]; this.dir = [1, 0]; this.want = [1, 0]; this.grow = 0;
    this.food = []; this.step = 0; this.slurped = 0; this.hot = 0; this.swipe = null;
    this.place('veg'); this.place('veg');
}
NoodleGame.prototype = {
    free() {
        const taken = new Set(this.body.concat(this.food.map(f => [f.x, f.y])).map(([x, y]) => x + ',' + y));
        for (let k = 0; k < 400; k++) { const x = Math.floor(R() * NOODLE_W), y = Math.floor(R() * NOODLE_H); if (!taken.has(x + ',' + y)) return [x, y]; }
        return null;
    },
    place(kind) { const p = this.free(); if (p) this.food.push({ kind, x: p[0], y: p[1], t: 0 }); },
    turn(dx, dy) { if (dx === -this.dir[0] && dy === -this.dir[1]) return; this.want = [dx, dy]; },
    rate() { return Math.max(4, 11 - Math.floor(this.body.length / 5)) - (this.hot ? 3 : 0); },
    update(inp) {
        this.t++;
        const P = inp.pressed;
        if (P.left) this.turn(-1, 0); if (P.right) this.turn(1, 0); if (P.up) this.turn(0, -1); if (P.down) this.turn(0, 1);
        // swipe on the screen
        const pt = inp.pointer;
        if (pt.down && !this.swipe) this.swipe = [pt.x, pt.y];
        if (pt.down && this.swipe) {
            const dx = pt.x - this.swipe[0], dy = pt.y - this.swipe[1];
            if (Math.max(Math.abs(dx), Math.abs(dy)) > 8) { if (Math.abs(dx) > Math.abs(dy)) this.turn(Math.sign(dx), 0); else this.turn(0, Math.sign(dy)); this.swipe = [pt.x, pt.y]; }
        }
        if (!pt.down) this.swipe = null;
        this.pops = this.pops.filter(q => ++q.t < 30);
        for (const f of this.food) f.t++;
        if (this.hot) this.hot--;
        if (++this.step < this.rate()) return;
        this.step = 0;
        this.dir = this.want;
        const [hx, hy] = this.body[0], nx = hx + this.dir[0], ny = hy + this.dir[1];
        if (nx < 0 || ny < 0 || nx >= NOODLE_W || ny >= NOODLE_H || this.body.slice(0, this.grow > 0 ? undefined : -1).some(([x, y]) => x === nx && y === ny)) {
            this.over = true; Sfx.play('gameover');
            this.pops.push({ text: nx < 0 || ny < 0 || nx >= NOODLE_W || ny >= NOODLE_H ? 'BONK! THE BOWL' : 'TANGLED!', x: ARCADE_W / 2, y: 70, t: 0, col: '#ff9aa8' });
            return;
        }
        this.body.unshift([nx, ny]);
        const fi = this.food.findIndex(f => f.x === nx && f.y === ny);
        if (fi >= 0) {
            const f = this.food[fi], d = NOODLE_FOOD[f.kind];
            this.food.splice(fi, 1);
            this.score += d.pts * (this.hot ? 2 : 1); this.slurped++;
            if (d.grow > 0) this.grow += d.grow;
            else for (let k = 0; k < -d.grow && this.body.length > 3; k++) this.body.pop();
            if (f.kind === 'chili') this.hot = 60 * 5;
            Sfx.play(f.kind === 'shrimp' ? 'gold' : 'nibble');
            this.pops.push({ text: (f.kind === 'chili' ? 'SPICY! ' : '') + '+' + d.pts * (this.hot && f.kind !== 'chili' ? 2 : 1), x: nx * NOODLE_C + 4, y: NOODLE_TOP + ny * NOODLE_C - 4, t: 0, col: d.col });
            this.place('veg');
            const r = R();
            if (r < 0.18 && !this.food.some(q => q.kind === 'shrimp')) this.place('shrimp');
            else if (r < 0.28 && this.body.length > 10 && !this.food.some(q => q.kind === 'lime')) this.place('lime');
            else if (r < 0.36 && !this.food.some(q => q.kind === 'chili')) this.place('chili');
        }
        if (this.grow > 0) this.grow--; else this.body.pop();
        // treats don't wait forever
        this.food = this.food.filter(f => f.kind === 'veg' || f.t < 60 * 9);
        if (!this.food.some(f => f.kind === 'veg')) this.place('veg');
    },
    idle() { this.t++; if (this.t % 9) return; const [hx, hy] = this.body[0]; let [dx, dy] = this.dir; if (hx + dx < 1 || hx + dx > NOODLE_W - 2 || hy + dy < 1 || hy + dy > NOODLE_H - 2) [dx, dy] = [-dy, dx]; this.dir = this.want = [dx, dy]; this.body.unshift([hx + dx, hy + dy]); this.body.pop(); },
    draw(g, t) {
        g.fillStyle = '#2a1a3a'; g.fillRect(0, 0, ARCADE_W, ARCADE_H);
        // the bowl: broth with little oil dots
        g.fillStyle = '#c94f3a'; g.fillRect(0, NOODLE_TOP - 4, ARCADE_W, NOODLE_H * NOODLE_C + 8);
        g.fillStyle = '#fff1e8'; for (let x = 4; x < ARCADE_W; x += 12) { g.fillRect(x, NOODLE_TOP - 3, 4, 1); g.fillRect(x + 6, NOODLE_TOP + NOODLE_H * NOODLE_C + 2, 4, 1); }
        g.fillStyle = '#f2c56b'; g.fillRect(0, NOODLE_TOP - 2, ARCADE_W, NOODLE_H * NOODLE_C + 4);
        g.fillStyle = this.hot ? '#e8805a' : '#e8b45a'; g.fillRect(2, NOODLE_TOP, NOODLE_W * NOODLE_C - 2, NOODLE_H * NOODLE_C);
        g.fillStyle = 'rgba(255,240,200,0.4)';
        for (let i = 0; i < 18; i++) { const x = (i * 37 + Math.floor(t / 20)) % (NOODLE_W * NOODLE_C), y = NOODLE_TOP + (i * 53) % (NOODLE_H * NOODLE_C); g.fillRect(x, y, 2, 1); }
        for (const f of this.food) {
            const x = f.x * NOODLE_C, y = NOODLE_TOP + f.y * NOODLE_C, d = NOODLE_FOOD[f.kind];
            const blink = f.kind !== 'veg' && f.t > 60 * 7 && Math.floor(t / 5) % 2;
            if (blink) continue;
            g.fillStyle = d.col; g.fillRect(x + 1, y + 1, 6, 6);
            g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(x + 2, y + 2, 2, 1);
            if (f.kind === 'shrimp') { g.fillStyle = '#ffffff'; g.fillRect(x + 1, y + 5, 2, 1); }
            if (f.kind === 'chili') { g.fillStyle = '#3f8a3a'; g.fillRect(x + 3, y, 2, 2); }
        }
        // the noodle: wavy, head with a happy face
        this.body.forEach(([bx, by], i) => {
            const x = bx * NOODLE_C, y = NOODLE_TOP + by * NOODLE_C;
            // one strand: each piece reaches back to the one before it
            const [px, py] = this.body[Math.max(0, i - 1)];
            const lx = Math.min(bx, px) * NOODLE_C, ly = NOODLE_TOP + Math.min(by, py) * NOODLE_C;
            g.fillStyle = '#d9a84a';
            g.fillRect(lx + 1, ly + 2, Math.abs(bx - px) * NOODLE_C + 6, Math.abs(by - py) * NOODLE_C + 6);
            g.fillStyle = i % 3 ? '#ffe08a' : '#fff1c4';
            g.fillRect(lx + 1, ly + 1, Math.abs(bx - px) * NOODLE_C + 6, Math.abs(by - py) * NOODLE_C + 5);
            if (i === 0) {
                g.fillStyle = '#2d2230';
                const [dx, dy] = this.dir;
                g.fillRect(x + 2 + dx, y + 2 + dy, 1, 1); g.fillRect(x + 5 + dx, y + 2 + dy, 1, 1);
                g.fillStyle = '#ff7aa8'; g.fillRect(x + 3 + dx, y + 5, 2, 1);
            }
        });
        popText(g, this.pops, 0, 0);
        pxShadow(g, pxNum(this.score), ARCADE_W - 5, 4, '#ffffff', 1, 'right', '#3b2a45');
        pxShadow(g, 'BEST ' + pxNum(Math.max(this.score, arc().best.noodle || 0)), ARCADE_W - 5, 12, '#ffd84a', 1, 'right', '#3b2a45');
        pxShadow(g, 'LENGTH ' + this.body.length, 5, 4, '#fff1c4', 1, 'left', '#3b2a45');
        if (this.hot) pxShadow(g, 'SPICY x2', 5, 12, '#ff8a6a', 1, 'left', '#3b2a45');
    },
};
ARCADE_GAMES.noodle = {
    name: 'Noodle Slurp', fee: PLAY_FEE, tune: 'noodle', glow: '#ffd84a',
    help: 'Arrows (or swipe) to steer',
    how: "Steer the noodle and collect greens to grow. Shrimp give extra points. A lime makes the noodle shorter; a chili briefly doubles points and speeds things up.\n\nDon't hit the bowl or cross your own noodle.",
    buttons: [
        { k: 'left', label: '\u25c0', keys: MOVE_KEYS.left, side: 'L', aria: 'Left' },
        { k: 'right', label: '\u25b6', keys: MOVE_KEYS.right, side: 'L', aria: 'Right' },
        { k: 'up', label: '\u25b2', keys: ['ArrowUp', 'KeyW'], side: 'R', aria: 'Up' },
        { k: 'down', label: '\u25bc', keys: MOVE_KEYS.down, side: 'R', aria: 'Down' },
    ],
    create() { return new NoodleGame(); },
    tickets(g) { return g.score > 0 ? Math.max(1, Math.floor(g.score / 30)) : 0; },
    result(g) {
        const best = arc().best.noodle || 0;
        return { title: g.score >= best && g.score > 0 ? 'New best!' : 'Slurped!', lines: [`${fmtNum(g.score)} points \u00b7 ${g.body.length} long`, `Best: ${fmtNum(Math.max(best, g.score))} \u00b7 ${g.slurped} ${plural(g.slurped, 'bite')}`] };
    },
};

/* ---------------------------------------------------------------- the cabinets themselves */
/* new furniture (they can be won at the prize counter, like the others, and played at home for free) */
const CAB_HUE = { surf: 200, garden: 95, noodle: 45 }, CAB_RECOLOR = ['surf', 'garden', 'noodle'];
for (const [id, name] of [['surf', "Surf's Up"], ['garden', 'Gopher Garden'], ['noodle', 'Noodle Slurp']]) {
    ITEMS['cab_' + id] = { name: `${name} cabinet`, type: 'furniture', price: 2400, icon: 'f_cab_' + id };
    FURN['cab_' + id] = { id: 'cab_' + id, name: `${name} cabinet`, w: 1, h: 1, kind: 'floor', price: 2400, sets: ['arcade'], prize: 1, arcade: id, anim: 1, light: 22 };
    PRIZES.splice(PRIZES.findIndex(p => p[0] === 'claw_machine'), 0, ['cab_' + id, 250]);
}
/* their pictures: the Fruit Catch cabinet, repainted (until the new art) */
ASSET_MAKERS.push(() => {
    const base = Assets.frames.f_cab_fruit;
    if (!base) return;
    const [sx, sy, w, h, ax, ay] = base;
    for (const id of CAB_RECOLOR) {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const g = c.getContext('2d');
        g.drawImage(Assets.atlas, sx, sy, w, h, 0, 0, w, h);
        const img = g.getImageData(0, 0, w, h), d = img.data, shift = CAB_HUE[id];
        for (let i = 0; i < d.length; i += 4) {
            if (!d[i + 3]) continue;
            const [hh, ss, ll] = rgbToHsl(d[i], d[i + 1], d[i + 2]);
            if (ss < 0.25) continue;                          // keep the greys and the outline
            const [r, gg, b] = hslToRgb((hh + shift / 360) % 1, ss, ll);
            d[i] = r; d[i + 1] = gg; d[i + 2] = b;
        }
        g.putImageData(img, 0, 0);
        Assets.dyn['f_cab_' + id] = { c, w, h, ax, ay };
    }
    // the out-of-order one (59_arcade.js): grey and dim, its marquee dark
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.drawImage(Assets.atlas, sx, sy, w, h, 0, 0, w, h);
    const img = g.getImageData(0, 0, w, h), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
        if (!d[i + 3]) continue;
        const [hh, ss, ll] = rgbToHsl(d[i], d[i + 1], d[i + 2]);
        const [r, gg, b] = hslToRgb((hh + 0.6) % 1, ss * 0.18, ll * 0.82);
        d[i] = r; d[i + 1] = gg; d[i + 2] = b;
    }
    g.putImageData(img, 0, 0);
    Assets.dyn.f_cab_broken = { c, w, h, ax, ay };
});
function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    if (mx === mn) return [0, 0, l];
    const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h / 6, s, l];
}
function hslToRgb(h, s, l) {
    const f = n => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); };
    return [f(0), f(8), f(4)];
}

/* their music, high score boards and the friends' favors that mention them */
Object.assign(TUNES, {
    surf: { bpm: 126, root: 62, scale: 'major', lead: 'kalimba', chords: [1, 4, 5, 4, 1, 4, 5, 1, 6, 4, 1, 5, 6, 4, 5, 1], form: 'ABCDABCEFGFHABCE', vary: true,
        mel: { A: '1 . 3 5 . 3 5 .', B: '4 . 6 . 5 . 3 .', C: '5 . 6 5 3 . 2 .', D: '1 . . . . . . .', E: '1 . 5 . 1 . . .', F: '6 . 5 . 6 ^1 . .', G: '5 . 3 . 2 . 3 .', H: '5 . 6 . 7 . ^1 .' },
        leadVol: 0.15, bass: 'x.x.x.xo', arp: 'x.x.x.x.', arpInstr: 'pluck', arpVol: 0.04, drums: { kick: 'x...x...', snare: '....x...', shaker: 'oxoxoxox' }, drumVol: 0.24 },
    garden: { bpm: 132, root: 67, scale: 'major', lead: 'pluck', chords: [1, 5, 1, 5, 4, 1, 5, 1, 4, 5, 6, 5, 4, 5, 1, 1], form: 'ABCDABCEFGFHABCE', vary: true,
        mel: { A: '1 1 5 . 1 1 6 .', B: '5 . 3 . 2 . . .', C: '1 1 5 . ^1 . 6 5', D: '4 3 2 . 1 . . .', E: '1 . . . . . . .', F: '4 . 4 . 6 . 5 .', G: '3 . 5 . 2 . . .', H: '4 . 5 . 6 . 7 .' },
        leadVol: 0.14, bass: 'x.o.x.o.', arp: '.x.x.x.x', arpInstr: 'kalimba', arpVol: 0.035, drums: { kick: 'x..xx...', clap: '....x...', shaker: 'oxoxoxox' }, drumVol: 0.24 },
    noodle: { bpm: 100, root: 57, scale: 'minor', lead: 'kalimba', chords: [1, 6, 7, 1, 1, 6, 7, 5, 4, 6, 7, 1, 4, 5, 1, 1], form: 'ABCDABCEFGFHABCE', vary: true,
        mel: { A: '1 . 3 . 5 . 3 .', B: '6 . 5 . 3 . . .', C: '1 . 3 . 5 6 5 3', D: '2 . 1 . . . . .', E: '1 . . . 5v . . .', F: '4 . 6 . 5 . 4 .', G: '3 . 2 . 1 . . .', H: '4 . 5 . 6 . 7 .' },
        leadVol: 0.14, bass: 'x..ox...', arp: '..x...x.', arpInstr: 'pluck', arpVol: 0.035, drums: { kick: 'x...x...', snare: '......x.', shaker: 'o.o.o.o.' }, drumVol: 0.2 },
});
FIXED_TUNES.push('surf', 'garden', 'noodle');
Object.assign(HISCORE_RIVALS, {
    surf: [['KAI', 2400, 'obviously'], ['DAVID', 1700, 'did a spin, somehow'], ['MAKI', 900, 'precise little hops']],
    garden: [['BASIL', 1800, 'protecting his greens'], ['CHILI', 1500, 'bonked with feeling'], ['CUKE', 300, 'kept bonking himself']],
    noodle: [['BASIL', 1400, "it's his noodle"], ['MAC', 1100, 'extra cheese, extra long'], ['CECE', 600, 'apologized to the shrimp']],
});
Object.assign(ARC_TARGET, { surf: [500, 1000, 1800], garden: [500, 900, 1400], noodle: [300, 700, 1200] });
Object.assign(TRACK_NAMES, { surf: "Surf's Up", garden: 'Gopher Garden', noodle: 'Noodle Slurp' });

/* and everyone has something to say about them, once the back room is open (they're its old classics: chiliLines,
   chatLine) */
const CHILI_BACK = [
    "Fruit Catch, Surf's Up, Gopher Garden, Noodle Slurp. In the back room. This WHOLE time. I walked past them every day.",
    'Gopher Garden tip: the golden ones give you more time. Cuke gives you nothing but regret. Do not bonk Cuke.',
    "Noodle Slurp has a chili in it that makes you go faster. They made it in 1987. 1987 knew about me. 1987 KNEW."];
const BACK_CHAT = {
    kai: "Surf's Up is legit, dude. Old school. I've got the high score now. It's my wave. It was always my wave.",
    basil: "There's an old game about a garden in the arcade's back room! Gophers everywhere. And a noodle game! Slurp responsibly.",
    cuke: "There's a cucumber in Gopher Garden! Jogging through! Since 1987! People keep bonking him! GREAT cardio! For them!",
    mac: 'Noodle Slurp. A game where you eat noodles. They made it in 1987 and they were right.',
    maki: "In Noodle Slurp, never cross your own noodle. It's a rule for life, too.",
};
