/* ---- 6v_stack.js ---- */
/* Snack Stack: the fourth cabinet. Drop snacks into the box; two of the same squish together into the next,
   bigger snack: edamame, cherry, lychee, mochi, dumpling, peach, coconut, cheesecake, poke bowl, pumpkin,
   watermelon. Keep the pile below the line. */
const SNACK_NAMES = ['Edamame', 'Cherry', 'Lychee', 'Mochi', 'Dumpling', 'Peach', 'Coconut', 'Cheesecake', 'Poke bowl', 'Pumpkin', 'Watermelon'];
const SNACK_R = [4.5, 5.5, 7, 8.5, 10.5, 12.5, 15, 17.5, 20.5, 24, 27.5];
const SNACK_DOT = ['#7acc5e', '#d8283f', '#e8607a', '#ffd0e0', '#fbf1d8', '#ffa98a', '#8a5a3a', '#fff4dc', '#4f86c6', '#f08a2a', '#3f9a4a'];
const SNACK_PTS = [1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 66];
const STACK_L = 5, STACK_R = 93, STACK_FLOOR = 146, STACK_LINE = 30;
function StackGame() {
    this.balls = []; this.score = 0; this.over = false; this.pops = []; this.t = 0;
    this.cur = this.pick(); this.next = this.pick();
    this.x = (STACK_L + STACK_R) / 2; this.cool = 0; this.top = 0; this.danger = 0; this.merges = 0; this.seq = 1;
}
StackGame.prototype = {
    pick() { return Math.floor(R() * R() * 5); },
    update(inp) {
        const H = inp.held, P = inp.pressed;
        this.t++;
        this.pops = this.pops.filter(q => ++q.t < 30);
        const r = SNACK_R[this.cur];
        if (H.left) this.x -= 1.6;
        if (H.right) this.x += 1.6;
        if (inp.pointer && inp.pointer.down && inp.pointer.x < STACK_R + 6) this.x = inp.pointer.x;
        this.x = clamp(this.x, STACK_L + r, STACK_R - r);
        if (this.cool > 0) this.cool--;
        else if (P.drop || P.down || (P.screen && inp.pointer.x < STACK_R + 6)) this.drop();
        for (let k = 0; k < 4; k++) this.step();
        this.merge();
        // too high for too long?
        const high = this.balls.some(b => b.age > 90 && b.y - b.r < STACK_LINE);
        this.danger = high ? this.danger + 1 : Math.max(0, this.danger - 2);
        if (this.danger > 150) { this.over = true; Sfx.play('gameover'); }
        for (const b of this.balls) b.age++;
    },
    drop() {
        this.balls.push({ t: this.cur, r: SNACK_R[this.cur], x: this.x + (R() - 0.5) * 0.2, y: 18, vx: 0, vy: 0.5, age: 0, id: this.seq++ });
        this.cur = this.next; this.next = this.pick();
        this.cool = 26;
        Sfx.play('drop');
    },
    step() {
        const B = this.balls, g = 0.045;
        for (const b of B) {
            b.vy += g;
            b.vx *= 0.995; b.vy *= 0.998;
            b.x += b.vx; b.y += b.vy;
            if (b.x - b.r < STACK_L) { b.x = STACK_L + b.r; b.vx = Math.abs(b.vx) * 0.3; }
            if (b.x + b.r > STACK_R) { b.x = STACK_R - b.r; b.vx = -Math.abs(b.vx) * 0.3; }
            if (b.y + b.r > STACK_FLOOR) { b.y = STACK_FLOOR - b.r; if (b.vy > 0) b.vy = -b.vy * 0.15; b.vx *= 0.92; }
        }
        for (let i = 0; i < B.length; i++) {
            const a = B[i];
            for (let j = i + 1; j < B.length; j++) {
                const b = B[j];
                const dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r;
                if (dx * dx + dy * dy >= rr * rr) continue;
                const d = Math.sqrt(dx * dx + dy * dy) || 0.01, nx = dx / d, ny = dy / d, over = rr - d;
                const ma = a.r * a.r, mb = b.r * b.r, tot = ma + mb;
                a.x -= nx * over * (mb / tot); a.y -= ny * over * (mb / tot);
                b.x += nx * over * (ma / tot); b.y += ny * over * (ma / tot);
                const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
                if (rv < 0) {
                    const imp = -(1.15) * rv / (1 / ma + 1 / mb);
                    a.vx -= imp * nx / ma; a.vy -= imp * ny / ma;
                    b.vx += imp * nx / mb; b.vy += imp * ny / mb;
                    // a little rolling friction so piles settle
                    const tx = -ny, ty = nx, tv = (b.vx - a.vx) * tx + (b.vy - a.vy) * ty;
                    a.vx += tx * tv * 0.05; a.vy += ty * tv * 0.05; b.vx -= tx * tv * 0.05; b.vy -= ty * tv * 0.05;
                }
            }
        }
    },
    merge() {
        const B = this.balls;
        for (let i = 0; i < B.length; i++) {
            const a = B[i];
            for (let j = i + 1; j < B.length; j++) {
                const b = B[j];
                if (a.t !== b.t || a.gone || b.gone) continue;
                const dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r + 0.6;
                if (dx * dx + dy * dy > rr * rr) continue;
                a.gone = b.gone = true;
                const t = a.t + 1, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
                this.merges++;
                if (t > 10) {
                    this.score += 200;
                    this.pops.push({ text: 'WATERMELON PARTY! +200', x: mx, y: my, t: 0, col: '#8cf0ff' });
                    Sfx.play('bento');
                    continue;
                }
                this.score += SNACK_PTS[t];
                this.top = Math.max(this.top, t);
                B.push({ t, r: SNACK_R[t], x: mx, y: my, vx: (a.vx + b.vx) / 2, vy: Math.min(0, (a.vy + b.vy) / 2) - 0.3, age: 20, id: this.seq++, pop: 12 });
                this.pops.push({ text: t >= 7 ? SNACK_NAMES[t].toUpperCase() + '!' : '+' + SNACK_PTS[t], x: mx, y: my - 6, t: 0, col: t >= 7 ? '#ffd84a' : '#ffffff' });
                Sfx.play(t >= 7 ? 'levelup' : t >= 4 ? 'line' : 'blip');
            }
        }
        if (B.some(b => b.gone)) this.balls = B.filter(b => !b.gone);
    },
    draw(g, t, state) {
        g.fillStyle = '#1b1030'; g.fillRect(0, 0, ARCADE_W, ARCADE_H);
        // the box: a wooden bento crate
        g.fillStyle = '#c9954f'; g.fillRect(STACK_L - 3, STACK_LINE - 8, STACK_R - STACK_L + 6, STACK_FLOOR - STACK_LINE + 11);
        g.fillStyle = '#2a1a3a'; g.fillRect(STACK_L, STACK_LINE - 8, STACK_R - STACK_L, STACK_FLOOR - STACK_LINE + 8);
        g.fillStyle = '#34224a';
        for (let y = STACK_LINE; y < STACK_FLOOR; y += 8) g.fillRect(STACK_L, y, STACK_R - STACK_L, 1);
        // the line not to cross
        const warn = this.danger > 30 && Math.floor(t / 6) % 2;
        g.fillStyle = warn ? '#ff5a6a' : 'rgba(255,255,255,0.25)';
        for (let x = STACK_L; x < STACK_R; x += 4) g.fillRect(x, STACK_LINE, 2, 1);
        // the snack about to drop, and a guide line
        if (!this.over && state !== 'over') {
            const r = SNACK_R[this.cur];
            g.fillStyle = 'rgba(255,255,255,0.14)';
            for (let y = 20 + r; y < STACK_FLOOR; y += 5) g.fillRect(Math.round(this.x), y, 1, 2);
            if (this.cool < 12) spr(g, 'snack_' + this.cur, Math.round(this.x), 14);
        }
        for (const b of this.balls) {
            const s = b.pop ? 1 + b.pop-- * 0.02 : 1;
            if (s !== 1) { g.save(); g.translate(b.x, b.y); g.scale(s, s); spr(g, 'snack_' + b.t, 0, 0); g.restore(); }
            else spr(g, 'snack_' + b.t, Math.round(b.x), Math.round(b.y));
        }
        popText(g, this.pops, 0, 0);
        // side panel
        const sx = 99;
        pxText(g, 'NEXT', sx, 4, '#ffd84a');
        g.fillStyle = '#6b4ac9'; g.fillRect(sx - 1, 11, 33, 26);
        g.fillStyle = '#241638'; g.fillRect(sx, 12, 31, 24);
        spr(g, 'snack_' + this.next, sx + 15, 24);
        sideLabel(g, sx, 42, 'SCORE', pxNum(this.score));
        sideLabel(g, sx, 60, 'BEST', pxNum(Math.max(this.score, arc().best.stack || 0)), '#ffd84a');
        // the snack chain: smallest to biggest
        pxText(g, 'CHAIN', sx, 80, '#b8a0d8');
        for (let i = 0; i < 11; i++) {
            const y = 90 + i * 5, made = i <= Math.max(this.top, 4);
            g.fillStyle = made ? SNACK_DOT[i] : 'rgba(255,255,255,0.15)';
            g.fillRect(sx + 1 + (i % 2) * 3, y, 4, 4);
            if (i === this.top && this.top > 4) { g.fillStyle = '#ffd84a'; g.fillRect(sx + 9, y + 1, 2, 2); }
        }
        if (this.top >= 5) pxText(g, SNACK_NAMES[this.top].split(' ')[0].toUpperCase(), sx, 146, SNACK_DOT[this.top]);
    },
};
ARCADE_GAMES.stack = {
    name: 'Snack Stack', fee: PLAY_FEE, tune: 'stack', glow: '#ff9ec0',
    help: '\u2190 \u2192 move \u00b7 Space (or \u2193) drops \u00b7 or tap where to drop',
    how: 'Drop snacks into the box. When two of the same snack touch, they squish together into the next bigger snack: edamame, cherry, lychee, mochi, dumpling, peach, coconut, cheesecake, poke bowl, pumpkin, watermelon! Keep the pile under the line.',
    buttons: [
        { k: 'left', label: '\u25c0', keys: MOVE_KEYS.left, side: 'L', aria: 'Move left' },
        { k: 'right', label: '\u25b6', keys: MOVE_KEYS.right, side: 'L', aria: 'Move right' },
        { k: 'drop', label: 'DROP', keys: MOVE_KEYS.drop.concat(MOVE_KEYS.down), side: 'R', aria: 'Drop the snack', wide: true },
    ],
    create() { return new StackGame(); },
    tickets(g) { return g.score > 0 ? Math.max(1, Math.floor(g.score / 30) + g.top * 2) : 0; },
    result(g) {
        const best = arc().best.stack || 0;
        return { title: g.score >= best && g.score > 0 ? 'New best!' : 'Game over', icon: 'snack_' + Math.min(6, g.top),
            lines: [`${fmtNum(g.score)} points \u00b7 biggest snack: ${SNACK_NAMES[g.top]}`, `Best: ${fmtNum(Math.max(best, g.score))}`] };
    },
};

