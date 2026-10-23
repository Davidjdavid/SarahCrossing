/* ---- 61_arcadegames.js ---- */
/* The cabinet games. Bento Blocks: falling bento pieces, fill a row to clear it. Spice Capsules: drop two-colour
   capsules, line up four of a colour to clear the spice bugs. Fruit Catch: Sarah catches fruit, dodges bees.
   Each game is an object with update(input) and draw(ctx); the cabinet overlay in 59_arcade.js runs them. */

const MOVE_KEYS = { left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], down: ['ArrowDown', 'KeyS'],
    rot: ['ArrowUp', 'KeyW', 'KeyX', 'KeyK', 'KeyE'], drop: ['Space', 'Enter', 'KeyJ'], hold: ['KeyC', 'ShiftLeft', 'ShiftRight', 'KeyH'] };
function sideLabel(g, x, y, label, value, col) {
    pxText(g, label, x, y, '#b8a0d8');
    pxShadow(g, value, x, y + 8, col || '#ffffff');
}
function popText(g, pops, ox, oy) {
    for (const q of pops) {
        if (q.t < 0) continue;
        const a = 1 - q.t / 30;
        g.globalAlpha = Math.max(0, a);
        pxShadow(g, q.text, ox + q.x, oy + q.y - q.t * 0.4, q.col || '#ffd84a', 1, 'center');
        g.globalAlpha = 1;
    }
}

/* ---------------------------------------------------------------- Bento Blocks */
const BENTO_PIECES = {
    I: { cells: [[0, 1], [1, 1], [2, 1], [3, 1]], n: 4 },
    O: { cells: [[1, 0], [2, 0], [1, 1], [2, 1]], n: 4 },
    T: { cells: [[1, 0], [0, 1], [1, 1], [2, 1]], n: 3 },
    S: { cells: [[1, 0], [2, 0], [0, 1], [1, 1]], n: 3 },
    Z: { cells: [[0, 0], [1, 0], [1, 1], [2, 1]], n: 3 },
    J: { cells: [[0, 0], [0, 1], [1, 1], [2, 1]], n: 3 },
    L: { cells: [[2, 0], [0, 1], [1, 1], [2, 1]], n: 3 },
};
const BENTO_LOOK = {
    I: { base: '#f4efe6', hi: '#ffffff', lo: '#2d3a2e' },        // cucumber roll
    O: { base: '#ffd45a', hi: '#fff0a8', lo: '#d9a030' },        // tamago
    T: { base: '#f28a4a', hi: '#ffc09a', lo: '#c0582a' },        // salmon
    S: { base: '#a27ad9', hi: '#d4bdf5', lo: '#6f4aa8' },        // ube mochi
    Z: { base: '#e0405a', hi: '#ff8a9a', lo: '#a02a40' },        // tuna
    J: { base: '#f4efe6', hi: '#ffffff', lo: '#b8b0a8' },        // onigiri
    L: { base: '#ff9ec0', hi: '#ffd6e6', lo: '#d9608e' },        // sakura mochi
};
const BENTO_SPEED = [48, 40, 33, 27, 22, 18, 14, 11, 9, 7, 6, 5, 4, 3, 2];
function bentoCells(id, rot) {
    const P = BENTO_PIECES[id];
    let c = P.cells;
    if (id === 'O') return c;
    for (let i = 0; i < rot; i++) c = c.map(([x, y]) => [P.n - 1 - y, x]);
    return c;
}
function bentoCell(g, x, y, id, alpha) {
    const L = BENTO_LOOK[id];
    if (alpha != null) g.globalAlpha = alpha;
    g.fillStyle = L.lo; g.fillRect(x, y, 8, 8);
    g.fillStyle = L.base; g.fillRect(x, y, 7, 7);
    g.fillStyle = L.hi; g.fillRect(x, y, 7, 1); g.fillRect(x, y, 1, 7);
    switch (id) {
        case 'I': g.fillStyle = '#2d3a2e'; g.fillRect(x, y, 8, 8); g.fillStyle = '#f4efe6'; g.fillRect(x + 1, y + 1, 6, 6);
            g.fillStyle = '#6cbf4a'; g.fillRect(x + 3, y + 3, 2, 2); g.fillStyle = '#ffffff'; g.fillRect(x + 1, y + 1, 2, 1); break;
        case 'O': g.fillStyle = '#2d3a2e'; g.fillRect(x, y + 3, 8, 2); break;
        case 'T': g.fillStyle = '#fff4e6'; g.fillRect(x + 1, y + 2, 5, 1); g.fillRect(x + 2, y + 5, 5, 1); break;
        case 'S': g.fillStyle = L.hi; g.fillRect(x + 2, y + 3, 1, 1); g.fillRect(x + 5, y + 5, 1, 1); g.fillRect(x + 4, y + 2, 1, 1); break;
        case 'Z': g.fillStyle = '#f4efe6'; g.fillRect(x, y + 6, 7, 1); g.fillStyle = L.hi; g.fillRect(x + 2, y + 2, 3, 1); break;
        case 'J': g.fillStyle = '#2d3a2e'; g.fillRect(x, y + 5, 8, 3); g.fillStyle = '#3f5a44'; g.fillRect(x + 1, y + 5, 5, 1); break;
        case 'L': g.fillStyle = '#6cbf4a'; g.fillRect(x + 4, y + 1, 2, 1); g.fillRect(x + 5, y + 2, 1, 1); break;
    }
    if (alpha != null) g.globalAlpha = 1;
}
function BlocksGame(startLevel) {
    this.cols = 10; this.rows = 18;
    this.grid = [];
    for (let y = 0; y < this.rows; y++) this.grid.push(new Array(this.cols).fill(null));
    this.bag = [];
    this.next = this.pull();
    this.startLevel = Math.max(1, Math.min(15, startLevel || 1));
    this.hold = null; this.canHold = true;
    this.score = 0; this.lines = 0; this.level = this.startLevel; this.over = false;
    this.fall = 0; this.lockT = 0; this.lockMoves = 0; this.das = 0; this.clearing = null; this.pops = [];
    this.spawn();
}
BlocksGame.prototype = {
    pull() { if (!this.bag.length) this.bag = shuffled(Object.keys(BENTO_PIECES)); return this.bag.pop(); },
    spawn() {
        const id = this.next;
        this.next = this.pull();
        this.p = { id, x: 3, y: id === 'I' ? -1 : 0, rot: 0 };
        this.fall = 0; this.lockT = 0; this.lockMoves = 0;
        if (!this.fits(this.p, 0, 0)) this.over = true;
    },
    fits(p, dx, dy, rot) {
        for (const [cx, cy] of bentoCells(p.id, rot == null ? p.rot : rot)) {
            const x = p.x + cx + dx, y = p.y + cy + dy;
            if (x < 0 || x >= this.cols || y >= this.rows) return false;
            if (y >= 0 && this.grid[y][x]) return false;
        }
        return true;
    },
    speed() { return BENTO_SPEED[Math.min(BENTO_SPEED.length - 1, this.level - 1)]; },
    update(inp) {
        this.pops = this.pops.filter(q => ++q.t < 30);
        if (this.clearing) { if (--this.clearing.t <= 0) this.finishClear(); return; }
        if (!this.p) return;
        const H = inp.held, P = inp.pressed;
        const dir = (H.right ? 1 : 0) - (H.left ? 1 : 0);
        if (P.left) { this.move(-1); this.das = 0; }
        else if (P.right) { this.move(1); this.das = 0; }
        else if (dir) { if (++this.das >= 10 && (this.das - 10) % 3 === 0) this.move(dir); }
        else this.das = 0;
        if (P.rot) this.rotate();
        if (P.hold) { this.doHold(); return; }
        if (P.drop) { this.hardDrop(); return; }
        const soft = !!H.down;
        if (++this.fall >= (soft ? Math.min(2, this.speed()) : this.speed())) {
            this.fall = 0;
            if (this.fits(this.p, 0, 1)) { this.p.y++; if (soft) this.score += 1; }
        }
        if (!this.fits(this.p, 0, 1)) { if (++this.lockT >= (soft ? 10 : 30)) this.lock(); }
        else this.lockT = 0;
    },
    move(d) { if (this.fits(this.p, d, 0)) { this.p.x += d; Sfx.play('blip'); this.nudgeLock(); } },
    rotate() {
        if (this.p.id === 'O') return;
        const r = (this.p.rot + 1) % 4;
        for (const [kx, ky] of [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1]]) {
            if (this.fits(this.p, kx, ky, r)) { this.p.x += kx; this.p.y += ky; this.p.rot = r; Sfx.play('rot'); this.nudgeLock(); return; }
        }
    },
    nudgeLock() { if (this.lockT && this.lockMoves < 15) { this.lockT = 0; this.lockMoves++; } },
    /* put the falling piece aside for later (once per piece) */
    doHold() {
        if (!this.canHold || !this.p) return;
        const cur = this.p.id;
        if (this.hold) {
            const h = this.hold;
            this.hold = cur;
            this.p = { id: h, x: 3, y: h === 'I' ? -1 : 0, rot: 0 };
            this.fall = 0; this.lockT = 0; this.lockMoves = 0;
            if (!this.fits(this.p, 0, 0)) this.over = true;
        } else { this.hold = cur; this.spawn(); }
        this.canHold = false;
        Sfx.play('rot');
    },
    ghostY() { let d = 0; while (this.fits(this.p, 0, d + 1)) d++; return this.p.y + d; },
    hardDrop() {
        const d = this.ghostY() - this.p.y;
        this.p.y += d;
        this.score += 2 * d;
        Sfx.play('drop');
        this.lock();
    },
    lock() {
        let top = false;
        for (const [cx, cy] of bentoCells(this.p.id, this.p.rot)) {
            const x = this.p.x + cx, y = this.p.y + cy;
            if (y < 0) { top = true; continue; }
            this.grid[y][x] = this.p.id;
        }
        if (top) { this.over = true; return; }
        this.canHold = true;
        Sfx.play('land');
        const full = [];
        for (let y = 0; y < this.rows; y++) if (this.grid[y].every(c => c)) full.push(y);
        if (full.length) { this.clearing = { rows: full, t: 22 }; this.p = null; Sfx.play(full.length >= 4 ? 'bento' : 'line'); }
        else this.spawn();
    },
    finishClear() {
        const rows = this.clearing.rows, n = rows.length;
        this.clearing = null;
        for (const y of rows) { this.grid.splice(y, 1); this.grid.unshift(new Array(this.cols).fill(null)); }
        const pts = [0, 100, 300, 500, 800][n] * this.level;
        this.score += pts;
        this.pops.push({ text: n >= 4 ? 'BENTO! +' + pts : '+' + pts, x: 40, y: rows[0] * 8, t: 0 });
        const lv = this.level;
        this.lines += n;
        this.level = this.startLevel + Math.floor(this.lines / 10);
        if (this.level > lv) { Sfx.play('levelup'); this.pops.push({ text: 'LEVEL ' + this.level, x: 40, y: 60, t: -8, col: '#8cf0ff' }); }
        this.spawn();
    },
    draw(g, t) {
        const bx = 6, by = 4;
        g.fillStyle = '#1b1030'; g.fillRect(0, 0, ARCADE_W, ARCADE_H);
        g.fillStyle = '#d9b44a'; g.fillRect(bx - 2, by - 2, 84, 148);
        g.fillStyle = '#3a1420'; g.fillRect(bx, by, 80, 144);
        g.fillStyle = '#4e1e2e';
        for (let y = 1; y < this.rows; y++) for (let x = 1; x < this.cols; x++) g.fillRect(bx + x * 8, by + y * 8, 1, 1);
        const flash = this.clearing && Math.floor(this.clearing.t / 3) % 2 === 0;
        for (let y = 0; y < this.rows; y++) for (let x = 0; x < this.cols; x++) {
            const c = this.grid[y][x];
            if (!c) continue;
            if (this.clearing && this.clearing.rows.includes(y)) {
                if (flash) { g.fillStyle = '#fff8e0'; g.fillRect(bx + x * 8, by + y * 8, 8, 8); continue; }
            }
            bentoCell(g, bx + x * 8, by + y * 8, c);
        }
        if (this.p && !this.over) {
            const gy = this.ghostY();
            for (const [cx, cy] of bentoCells(this.p.id, this.p.rot)) if (gy + cy >= 0) bentoCell(g, bx + (this.p.x + cx) * 8, by + (gy + cy) * 8, this.p.id, 0.25);
            for (const [cx, cy] of bentoCells(this.p.id, this.p.rot)) if (this.p.y + cy >= 0) bentoCell(g, bx + (this.p.x + cx) * 8, by + (this.p.y + cy) * 8, this.p.id);
        }
        popText(g, this.pops, bx, by);
        // the side panel
        const sx = 92;
        const box = (label, id, y, dim) => {
            pxText(g, label, sx, y, '#ffd84a');
            g.fillStyle = '#6b4ac9'; g.fillRect(sx - 1, y + 7, 41, 21);
            g.fillStyle = '#241638'; g.fillRect(sx, y + 8, 39, 19);
            if (!id) return;
            const cells = bentoCells(id, 0);
            const minX = Math.min(...cells.map(c => c[0])), maxX = Math.max(...cells.map(c => c[0]));
            const minY = Math.min(...cells.map(c => c[1])), maxY = Math.max(...cells.map(c => c[1]));
            const k = 6, ox = sx + Math.round((39 - (maxX - minX + 1) * k) / 2) - minX * k, oy = y + 8 + Math.round((19 - (maxY - minY + 1) * k) / 2) - minY * k;
            for (const [cx, cy] of cells) { g.globalAlpha = dim ? 0.4 : 1; g.fillStyle = BENTO_LOOK[id].lo; g.fillRect(ox + cx * k, oy + cy * k, k, k); g.fillStyle = BENTO_LOOK[id].base; g.fillRect(ox + cx * k, oy + cy * k, k - 1, k - 1); g.globalAlpha = 1; }
        };
        box('NEXT', this.next, 2);
        box('HOLD', this.hold, 32, !this.canHold);
        sideLabel(g, sx, 64, 'SCORE', pxNum(this.score));
        sideLabel(g, sx, 82, 'LINES', pxNum(this.lines));
        sideLabel(g, sx, 100, 'LEVEL', pxNum(this.level));
        sideLabel(g, sx, 118, 'BEST', pxNum(Math.max(this.score, arc().best.blocks || 0)), '#ffd84a');
        spr(g, 'maki_' + (Math.floor(t / 30) % 2), 112, 146);
    },
};
ARCADE_GAMES.blocks = {
    name: 'Bento Blocks', fee: PLAY_FEE, tune: 'blocks', glow: '#ffd45a', levels: true,
    help: '\u2190 \u2192 move \u00b7 \u2191 turn \u00b7 \u2193 fast fall \u00b7 Space instant drop \u00b7 C (or Shift) hold',
    how: 'Bento pieces fall into the box. Move and turn them so they fill a whole row: a full row clears. Clear four at once for a BENTO. Hold \u2193 to fall fast, press Space to drop it right away, and press C (or Shift) to put a piece on hold for later. Faster every ten rows. Once you reach a level you can start there next time.',
    buttons: [
        { k: 'left', label: '\u25c0', keys: MOVE_KEYS.left, side: 'L', aria: 'Move left' },
        { k: 'down', label: '\u25bc', keys: MOVE_KEYS.down, side: 'L', aria: 'Fall faster' },
        { k: 'right', label: '\u25b6', keys: MOVE_KEYS.right, side: 'L', aria: 'Move right' },
        { k: 'hold', label: 'HOLD', keys: MOVE_KEYS.hold, side: 'R', aria: 'Hold this piece', small: true },
        { k: 'rot', label: '\u27f3', keys: MOVE_KEYS.rot, side: 'R', aria: 'Turn' },
        { k: 'drop', label: '\u2913', keys: MOVE_KEYS.drop, side: 'R', aria: 'Drop' },
    ],
    create(opts) { return new BlocksGame(opts && opts.level); },
    tickets(g) { return g.score > 0 ? Math.max(1, Math.floor(g.score / 400) + Math.floor(g.lines / 2)) : 0; },
    result(g) {
        const best = arc().best.blocks || 0;
        return { title: g.score >= best && g.score > 0 ? 'New best!' : 'Game over', lines: [`${fmtNum(g.score)} points \u00b7 ${g.lines} ${plural(g.lines, 'row')} \u00b7 level ${g.level}`, `Best: ${fmtNum(Math.max(best, g.score))}`] };
    },
};

/* ---------------------------------------------------------------- Spice Capsules */
const SPICE = [
    { name: 'chili', base: '#e0405a', hi: '#ff9aa8', lo: '#a02a40', hat: '#3f8a3a' },
    { name: 'mustard', base: '#ffd45a', hi: '#fff4b8', lo: '#c99a2a', hat: '#fff4e6' },
    { name: 'wasabi', base: '#8cc152', hi: '#d0f0a0', lo: '#5a8f2e', hat: '#2f6a2a' },
];
const BUG_HATS = ['...hh...', '..h..h..', '.hh..hh.'];
const BUG_BODY = ['.bbbbbb.', 'bbwbbwbb', 'bbkbbkbb', 'bbbbbbbb', 'bbbkkbbb', '.bbbbbb.'];
const BUG_LEGS = ['b.b..b.b', '.b.bb.b.'];
const CAP_BG = '#141a33';
function drawBug(g, x, y, c, frame, k, faded) {
    k = k || 1;
    const C = SPICE[c];
    const rows = [BUG_HATS[c]].concat(BUG_BODY, [BUG_LEGS[frame % 2]]);
    const blink = frame % 7 === 3;
    if (faded) g.globalAlpha = 0.25;
    rows.forEach((r, yy) => {
        for (let xx = 0; xx < 8; xx++) {
            const ch = r[xx];
            if (ch === '.') continue;
            let col = ch === 'b' ? C.base : ch === 'w' ? (blink ? C.base : '#ffffff') : ch === 'k' ? (blink ? C.lo : '#2d2230') : C.hat;
            if (ch === 'b' && xx === 1 && yy > 1 && yy < 6) col = C.hi;
            g.fillStyle = col;
            g.fillRect(x + xx * k, y + yy * k, k, k);
        }
    });
    if (faded) g.globalAlpha = 1;
}
function pillCell(g, x, y, c, link) {
    const C = SPICE[c];
    let rx = x + 1, ry = y + 1, rw = 6, rh = 6;
    if (link === 'R') rw = 7;
    else if (link === 'L') { rx = x; rw = 7; }
    else if (link === 'D') rh = 7;
    else if (link === 'U') { ry = y; rh = 7; }
    g.fillStyle = C.lo; g.fillRect(rx, ry, rw, rh);
    g.fillStyle = C.base; g.fillRect(rx, ry, rw - (link === 'R' ? 0 : 1), rh - (link === 'D' ? 0 : 1));
    g.fillStyle = C.hi; g.fillRect(rx + 1, ry + 1, Math.max(1, rw - 3), 1);
    g.fillStyle = CAP_BG;
    const cut = (cx, cy) => g.fillRect(cx, cy, 1, 1);
    const L = rx, Rr = rx + rw - 1, T = ry, B = ry + rh - 1;
    if (link !== 'L' && link !== 'U' && link !== 'D') { cut(L, T); cut(L, B); }          // round the left end
    if (link !== 'R' && link !== 'U' && link !== 'D') { cut(Rr, T); cut(Rr, B); }        // round the right end
    if (link === 'D') { cut(L, T); cut(Rr, T); }
    if (link === 'U') { cut(L, B); cut(Rr, B); }
}
function linkXY(x, y, link) { return link === 'R' ? [x + 1, y] : link === 'L' ? [x - 1, y] : link === 'U' ? [x, y - 1] : [x, y + 1]; }
function CapsuleGame(startLevel) {
    this.cols = 8; this.rows = 14;
    this.level = Math.max(0, Math.min(19, (startLevel || 1) - 1)); this.score = 0; this.stages = 0; this.over = false; this.pops = [];
    this.nextC = this.pair();
    this.newBottle();
}
CapsuleGame.prototype = {
    pair() { return [Math.floor(R() * 3), Math.floor(R() * 3)]; },
    newBottle() {
        this.grid = [];
        for (let y = 0; y < this.rows; y++) this.grid.push(new Array(this.cols).fill(null));
        const n = Math.min(40, 4 * (this.level + 1));
        const colors = shuffled(Array.from({ length: n }, (_, i) => i % 3));
        const minY = this.level < 3 ? 7 : this.level < 6 ? 6 : 5;
        for (const c of colors) {
            for (let tries = 0; tries < 80; tries++) {
                const x = Math.floor(R() * this.cols), y = minY + Math.floor(R() * (this.rows - minY));
                if (this.grid[y][x] || this.wouldRun(x, y, c)) continue;
                this.grid[y][x] = { c, bug: true };
                break;
            }
        }
        this.bugs = 0;
        for (const row of this.grid) for (const c of row) if (c && c.bug) this.bugs++;
        this.caps = 0; this.chain = 0; this.t = 0;
        this.spawn();
    },
    wouldRun(x, y, c) {
        const same = (xx, yy) => xx >= 0 && yy >= 0 && xx < this.cols && yy < this.rows && this.grid[yy][xx] && this.grid[yy][xx].c === c;
        const count = (dx, dy) => { let n = 0; for (let k = 1; k < 3; k++) { if (same(x + dx * k, y + dy * k)) n++; else break; } return n; };
        return count(1, 0) + count(-1, 0) >= 2 || count(0, 1) + count(0, -1) >= 2;
    },
    spawn() {
        const [a, b] = this.nextC;
        this.nextC = this.pair();
        this.p = { x: 3, y: 0, rot: 0, a, b };
        this.fall = 0; this.lockT = 0; this.das = 0; this.phase = 'fall';
        if (!this.fits(this.p, 0, 0)) { this.over = true; }
    },
    cells(p, rot) {
        rot = rot == null ? p.rot : rot;
        const x = p.x, y = p.y;
        if (rot === 0) return [[x, y, p.a, 'R'], [x + 1, y, p.b, 'L']];
        if (rot === 1) return [[x, y, p.a, 'U'], [x, y - 1, p.b, 'D']];
        if (rot === 2) return [[x + 1, y, p.a, 'L'], [x, y, p.b, 'R']];
        return [[x, y - 1, p.a, 'D'], [x, y, p.b, 'U']];
    },
    fits(p, dx, dy, rot) {
        for (const [x, y] of this.cells({ x: p.x + dx, y: p.y + dy, a: p.a, b: p.b }, rot == null ? p.rot : rot)) {
            if (x < 0 || x >= this.cols || y >= this.rows) return false;
            if (y >= 0 && this.grid[y][x]) return false;
        }
        return true;
    },
    speed() { return Math.max(10, 36 - this.level * 2 - Math.floor(this.caps / 10)); },
    update(inp) {
        this.pops = this.pops.filter(q => ++q.t < 30);
        this.t++;
        if (this.phase === 'fall') return this.updFall(inp);
        if (this.phase === 'clear') { if (--this.clearT <= 0) this.removeMarked(); return; }
        if (this.phase === 'settle') { if (this.t % 5 === 0 && !this.settleStep()) this.checkMatches(); return; }
        if (this.phase === 'stage') { if (--this.stageT <= 0) { this.level++; this.newBottle(); } }
    },
    updFall(inp) {
        const H = inp.held, P = inp.pressed;
        const dir = (H.right ? 1 : 0) - (H.left ? 1 : 0);
        const mv = d => { if (this.fits(this.p, d, 0)) { this.p.x += d; Sfx.play('blip'); } };
        if (P.left) { mv(-1); this.das = 0; }
        else if (P.right) { mv(1); this.das = 0; }
        else if (dir) { if (++this.das >= 10 && (this.das - 10) % 4 === 0) mv(dir); }
        else this.das = 0;
        if (P.rot) {
            const r = (this.p.rot + 1) % 4;
            for (const kx of [0, -1, 1]) if (this.fits(this.p, kx, 0, r)) { this.p.x += kx; this.p.rot = r; Sfx.play('rot'); break; }
        }
        if (P.drop) { while (this.fits(this.p, 0, 1)) { this.p.y++; this.score += 1; } Sfx.play('drop'); this.lock(); return; }
        const soft = !!H.down;
        if (++this.fall >= (soft ? 3 : this.speed())) {
            this.fall = 0;
            if (this.fits(this.p, 0, 1)) this.p.y++;
            else this.lock();
        }
    },
    lock() {
        for (const [x, y, c, link] of this.cells(this.p)) {
            if (y < 0) { this.over = true; return; }
            this.grid[y][x] = { c, link };
        }
        this.caps++;
        this.p = null;
        Sfx.play('land');
        this.chain = 0;
        this.checkMatches();
    },
    checkMatches() {
        const mark = new Set();
        const scan = (len, get, key) => {
            for (let i = 0; i < len.outer; i++) {
                let j = 0;
                while (j < len.inner) {
                    const c = get(i, j);
                    if (!c) { j++; continue; }
                    let e = j + 1;
                    while (e < len.inner && get(i, e) && get(i, e).c === c.c) e++;
                    if (e - j >= 4) for (let k = j; k < e; k++) mark.add(key(i, k));
                    j = e;
                }
            }
        };
        scan({ outer: this.rows, inner: this.cols }, (y, x) => this.grid[y][x], (y, x) => x + ',' + y);
        scan({ outer: this.cols, inner: this.rows }, (x, y) => this.grid[y][x], (x, y) => x + ',' + y);
        if (!mark.size) {
            if (this.bugs === 0) {
                this.phase = 'stage'; this.stageT = 110; this.stages++;
                const bonus = 1000 * (this.level + 1);
                this.score += bonus;
                this.pops.push({ text: 'CLEAR! +' + bonus, x: 32, y: 48, t: -30, col: '#8cf0ff' });
                Sfx.play('levelup');
            } else this.spawn();
            return;
        }
        this.chain++;
        this.marked = mark;
        let bugs = 0, sx = 0, sy = 0;
        for (const k of mark) { const [x, y] = k.split(',').map(Number); if (this.grid[y][x].bug) bugs++; sx += x; sy += y; }
        const pts = bugs * 100 * this.chain + (mark.size - bugs) * 10;
        this.score += pts;
        this.pops.push({ text: (this.chain > 1 ? 'x' + this.chain + ' ' : '') + '+' + pts, x: Math.round(sx / mark.size * 8 + 4), y: Math.round(sy / mark.size * 8), t: 0, col: bugs ? '#ffd84a' : '#ffffff' });
        Sfx.play(bugs ? 'bug' : 'line');
        this.phase = 'clear'; this.clearT = 18;
    },
    removeMarked() {
        for (const k of this.marked) {
            const [x, y] = k.split(',').map(Number);
            const cell = this.grid[y][x];
            if (cell.link) {
                const [px, py] = linkXY(x, y, cell.link);
                const o = this.grid[py] && this.grid[py][px];
                if (o && !this.marked.has(px + ',' + py)) o.link = null;
            }
            if (cell.bug) this.bugs--;
            this.grid[y][x] = null;
        }
        this.marked = null;
        this.phase = 'settle'; this.t = 0;
    },
    /* every capsule piece with nothing under it drops one row; true if anything moved */
    settleStep() {
        const done = new Set();
        let moved = false;
        for (let y = this.rows - 2; y >= 0; y--) {
            for (let x = 0; x < this.cols; x++) {
                const c = this.grid[y][x];
                if (!c || c.bug || done.has(c)) continue;
                if (c.link === 'L' || c.link === 'R') {
                    const px = c.link === 'R' ? x + 1 : x - 1, o = this.grid[y][px];
                    done.add(c); done.add(o);
                    if (!this.grid[y + 1][x] && !this.grid[y + 1][px]) {
                        this.grid[y + 1][x] = c; this.grid[y + 1][px] = o; this.grid[y][x] = null; this.grid[y][px] = null; moved = true;
                    }
                } else if (c.link === 'U') {
                    const o = this.grid[y - 1][x];
                    done.add(c); done.add(o);
                    if (!this.grid[y + 1][x]) { this.grid[y + 1][x] = c; this.grid[y][x] = o; this.grid[y - 1][x] = null; moved = true; }
                } else if (c.link === 'D') {
                    continue;                        // moves with the half below it
                } else {
                    done.add(c);
                    if (!this.grid[y + 1][x]) { this.grid[y + 1][x] = c; this.grid[y][x] = null; moved = true; }
                }
            }
        }
        return moved;
    },
    draw(g, t) {
        const bx = 8, by = 34, W = this.cols * 8, H = this.rows * 8;
        g.fillStyle = '#20163a'; g.fillRect(0, 0, ARCADE_W, ARCADE_H);
        // the bottle: glass, a neck, a cork of light
        g.fillStyle = '#9fd8ec';
        g.fillRect(bx - 3, by - 3, W + 6, H + 6);
        g.fillRect(bx + 20, by - 16, 24, 14);
        g.fillStyle = CAP_BG;
        g.fillRect(bx, by, W, H);
        g.fillRect(bx + 23, by - 13, 18, 14);
        g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(bx - 2, by + 4, 1, H - 10); g.fillRect(bx + 21, by - 14, 1, 9);
        g.fillStyle = '#1e2548';
        for (let y = 1; y < this.rows; y++) for (let x = 1; x < this.cols; x++) g.fillRect(bx + x * 8, by + y * 8, 1, 1);
        const fr = Math.floor(t / 16);
        const flash = this.phase === 'clear' && Math.floor(this.clearT / 3) % 2 === 0;
        for (let y = 0; y < this.rows; y++) for (let x = 0; x < this.cols; x++) {
            const c = this.grid[y][x];
            if (!c) continue;
            const px = bx + x * 8, py = by + y * 8;
            if (this.marked && this.marked.has(x + ',' + y) && flash) { g.fillStyle = '#ffffff'; g.fillRect(px + 1, py + 1, 6, 6); continue; }
            if (c.bug) drawBug(g, px, py, c.c, fr + x + y);
            else pillCell(g, px, py, c.c, c.link);
        }
        if (this.p && !this.over) for (const [x, y, c, link] of this.cells(this.p)) pillCell(g, bx + x * 8, by + y * 8, c, link);
        popText(g, this.pops, bx, by);
        if (this.phase === 'stage') {
            g.fillStyle = 'rgba(20,16,40,0.6)'; g.fillRect(bx, by + 40, W, 26);
            pxShadow(g, 'CLEAR!', bx + W / 2, by + 44, '#8cf0ff', 2, 'center');
            pxText(g, 'NEXT BOTTLE', bx + W / 2, by + 58, '#ffffff', 1, 'center');
        }
        // side panel
        const sx = 82;
        pxText(g, 'NEXT', sx, 4, '#ffd84a');
        g.fillStyle = '#6b4ac9'; g.fillRect(sx - 1, 11, 26, 12);
        g.fillStyle = CAP_BG; g.fillRect(sx, 12, 24, 10);
        pillCell(g, sx + 4, 13, this.nextC[0], 'R'); pillCell(g, sx + 12, 13, this.nextC[1], 'L');
        sideLabel(g, sx, 30, 'LEVEL', pxNum(this.level + 1));
        sideLabel(g, sx, 50, 'BUGS', pxNum(this.bugs), this.bugs ? '#ff9aa8' : '#8cf0ff');
        sideLabel(g, sx, 70, 'SCORE', pxNum(this.score));
        sideLabel(g, sx, 90, 'BEST', pxNum(Math.max(this.score, arc().best.capsules || 0)), '#ffd84a');
        // the three bugs dance (a bug fades out once its colour is gone from the bottle)
        const left = [0, 0, 0];
        for (const row of this.grid) for (const c of row) if (c && c.bug) left[c.c]++;
        for (let i = 0; i < 3; i++) drawBug(g, sx + i * 17, 118 + (Math.floor(t / 12 + i) % 2) * 2, i, fr + i, 2, !left[i]);
    },
};
ARCADE_GAMES.capsules = {
    name: 'Spice Capsules', fee: PLAY_FEE, tune: 'capsules', glow: '#8cc152', levels: true,
    help: '\u2190 \u2192 move \u00b7 \u2191 turn \u00b7 \u2193 fast fall \u00b7 Space instant drop',
    how: 'Chili, mustard and wasabi bugs are loose in the bottle! Drop the capsules so four of one colour line up in a row or column (bugs count). Clear every bug to fill the next bottle. Chains score extra.',
    buttons: [
        { k: 'left', label: '\u25c0', keys: MOVE_KEYS.left, side: 'L', aria: 'Move left' },
        { k: 'down', label: '\u25bc', keys: MOVE_KEYS.down, side: 'L', aria: 'Fall faster' },
        { k: 'right', label: '\u25b6', keys: MOVE_KEYS.right, side: 'L', aria: 'Move right' },
        { k: 'rot', label: '\u27f3', keys: MOVE_KEYS.rot, side: 'R', aria: 'Turn' },
        { k: 'drop', label: '\u2913', keys: MOVE_KEYS.drop, side: 'R', aria: 'Drop' },
    ],
    create(opts) { return new CapsuleGame(opts && opts.level); },
    tickets(g) { return g.score > 0 ? Math.max(1, Math.floor(g.score / 400) + g.stages * 4) : 0; },
    result(g) {
        const best = arc().best.capsules || 0;
        return { title: g.score >= best && g.score > 0 ? 'New best!' : 'Game over', lines: [`${fmtNum(g.score)} points \u00b7 ${g.stages} ${plural(g.stages, 'bottle')} cleared`, `Best: ${fmtNum(Math.max(best, g.score))}`] };
    },
};

/* ---------------------------------------------------------------- Fruit Catch */
const FRUIT_GROUND = 140;
const goldCache = {};
function goldFruit(id) {
    if (goldCache[id]) return goldCache[id];
    const c = document.createElement('canvas');
    c.width = 16; c.height = 16;
    const g = c.getContext('2d');
    spr(g, 'fruit_' + id, 8, 13);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = 'rgba(255,214,64,0.62)';
    g.fillRect(0, 0, 16, 16);
    goldCache[id] = c;
    return c;
}
/* Fruit Catch, remade: the trees shake before they drop something (and a shadow on the grass shows where it'll land),
   each fruit falls its own way, ten in a row starts a Fever (everything golden, double points), and power-ups help.
   Every 25 fruit is a new round, a little faster; a round with no hearts lost is a Perfect round. */
const FRUIT_TREES = [18, 68, 118];
const FRUIT_KINDS = {
    apple: { pts: 10, vy: 1, col: '#e0405a' }, mango: { pts: 10, vy: 1, col: '#ffb53a' }, cherry: { pts: 10, vy: 1.05, col: '#d8283f', pair: true },
    peach: { pts: 15, vy: 0.9, col: '#ffa98a', sway: 1 }, lychee: { pts: 15, vy: 0.6, col: '#f4e6ea', sway: 0.5 }, coconut: { pts: 25, vy: 1.7, col: '#8a5a3a' },
};
const FRUIT_POWERS = { basket: 'BIG BASKET', honey: 'SLOW HONEY', magnet: 'FRUIT MAGNET' };
function FruitGame() {
    this.x = ARCADE_W / 2; this.vx = 0; this.items = []; this.t = 0; this.score = 0; this.hearts = 5; this.combo = 0; this.best = 0;
    this.caught = 0; this.over = false; this.pops = []; this.splats = []; this.bits = []; this.spawnT = 50; this.hurt = 0; this.happy = 0;
    this.clouds = [[20, 34], [92, 48]]; this.round = 1; this.roundCaught = 0; this.roundHurt = false; this.banner = 90;
    this.juice = 0; this.fever = 0; this.power = null; this.powerT = 0; this.shakes = [0, 0, 0]; this.pile = []; this.quake = 0;
}
FruitGame.prototype = {
    speed() { return Math.min(1.9, 0.75 + (this.round - 1) * 0.12) * (this.power === 'honey' ? 0.55 : 1); },
    reach() { return this.power === 'basket' ? 18 : 11; },
    move(inp) {
        const H = inp.held, dir = (H.right ? 1 : 0) - (H.left ? 1 : 0);
        if (dir) this.vx = clamp(this.vx + dir * 0.9, -3.4, 3.4); else this.vx *= 0.5;
        if (inp.pointer.down) this.vx = clamp(inp.pointer.x - this.x, -4, 4);
        this.x = clamp(this.x + this.vx, 12, ARCADE_W - 12);
    },
    /* a tree shakes, then lets go: the item is born in its leaves */
    queue() {
        const sp = this.speed(), r = R(), lvl = this.round;
        let kind;
        if (r < 0.035) kind = 'power';
        else if (r < 0.085) kind = 'gold';
        else if (lvl >= 2 && r < 0.085 + Math.min(0.16, 0.04 * lvl)) kind = R() < 0.5 ? 'bee' : 'rotten';
        else kind = rpick(lvl < 2 ? ['apple', 'mango', 'cherry', 'peach'] : Object.keys(FRUIT_KINDS));
        const tree = Math.floor(R() * 3), x = clamp(FRUIT_TREES[tree] + (R() - 0.5) * 34, 10, ARCADE_W - 10);
        this.shakes[tree] = 26;
        const it = { kind, id: FRUIT_KINDS[kind] ? kind : rpick(GD.fruit), x, x0: x, y: 14, vy: 0, t: -26, ph: R() * 6, sp };
        if (kind === 'power') it.power = rpick(Object.keys(FRUIT_POWERS));
        this.items.push(it);
        if (kind === 'cherry') this.items.push(Object.assign({}, it, { x: clamp(x + (x > ARCADE_W / 2 ? -12 : 12), 10, ARCADE_W - 10), t: -32 }));
        this.spawnT = Math.round(lerp(64, 22, Math.min(1, (lvl - 1) / 8)) * (0.75 + R() * 0.5) * (this.fever ? 0.6 : 1) / (this.power === 'honey' ? 0.7 : 1));
    },
    update(inp) {
        this.t++;
        this.move(inp);
        if (this.banner) this.banner--;
        if (--this.spawnT <= 0 && !this.banner) this.queue();
        const bx = this.x, by = FRUIT_GROUND - 28, reach = this.reach();
        for (const it of this.items) {
            if (++it.t < 0) continue;                                    // still in the leaves
            const k = FRUIT_KINDS[it.kind];
            const fall = (k ? k.vy : it.kind === 'bee' ? 0.7 : 1) * it.sp;
            it.vy = Math.min(it.vy + 0.035 * fall, 2.8 * fall);
            it.y += it.vy;
            if (k && k.sway) it.x = clamp(it.x0 + Math.sin(it.t / 16 + it.ph) * 10 * k.sway, 8, ARCADE_W - 8);
            if (it.kind === 'bee') it.x = clamp(it.x + Math.sign(bx - it.x) * 0.35 + Math.sin(it.t / 9 + it.ph) * 0.8, 8, ARCADE_W - 8);
            if (this.power === 'magnet' && it.kind !== 'bee' && it.kind !== 'rotten') it.x += clamp(bx - it.x, -0.9, 0.9);
            if (!it.done && it.y >= by - 5 && it.y <= by + 7 && Math.abs(it.x - bx) <= reach) { it.done = true; this.got(it); }
            if (!it.done && it.y > FRUIT_GROUND - 2) { it.done = true; this.missed(it); }
        }
        this.items = this.items.filter(i => !i.done);
        this.pops = this.pops.filter(p => ++p.t < 30);
        this.splats = this.splats.filter(s => ++s.t < 70);
        for (const b of this.bits) { b.x += b.vx; b.y += b.vy; b.vy += 0.12; b.t++; }
        this.bits = this.bits.filter(b => b.t < 26);
        for (const c of this.clouds) { c[0] += 0.05; if (c[0] > ARCADE_W + 20) c[0] = -20; }
        for (let i = 0; i < 3; i++) if (this.shakes[i]) this.shakes[i]--;
        if (this.hurt) this.hurt--;
        if (this.happy) this.happy--;
        if (this.quake) this.quake--;
        if (this.fever && --this.fever === 0) this.pops.push({ text: 'FEVER OVER', x: ARCADE_W / 2, y: 60, t: 0, col: '#ffffff' });
        if (this.powerT && --this.powerT === 0) this.power = null;
        if (this.hearts <= 0) { this.over = true; Sfx.play('gameover'); }
    },
    splash(it, n, col) { for (let i = 0; i < n; i++) this.bits.push({ x: it.x, y: it.y, vx: (R() - 0.5) * 3, vy: -R() * 2.5, t: 0, col }); },
    got(it) {
        if (it.kind === 'bee' || it.kind === 'rotten') {
            this.hearts--; this.hurt = 40; this.combo = 0; this.juice = 0; this.roundHurt = true; this.quake = 10;
            Sfx.play('ouch');
            this.pops.push({ text: it.kind === 'bee' ? 'BZZ! OUCH' : 'EW! ROTTEN', x: it.x, y: it.y - 8, t: 0, col: '#ff9aa8' });
            return;
        }
        if (it.kind === 'power') {
            this.power = it.power; this.powerT = 60 * 9;
            Sfx.play('levelup');
            this.pops.push({ text: FRUIT_POWERS[it.power] + '!', x: it.x, y: it.y - 10, t: 0, col: '#8cf0ff' });
            return;
        }
        this.combo++; this.caught++; this.roundCaught++; this.best = Math.max(this.best, this.combo);
        const k = FRUIT_KINDS[it.kind];
        let pts = it.kind === 'gold' ? 50 : k.pts;
        if (this.combo % 10 === 0) pts += 5 * this.combo;
        if (this.fever) pts *= 2;
        this.score += pts;
        this.happy = 14;
        if (it.kind === 'coconut') this.quake = 6;
        if (it.kind === 'gold' && this.hearts < 5) this.hearts++;
        this.pile.push(it.kind === 'gold' ? 'gold' : it.id); if (this.pile.length > 4) this.pile.shift();
        this.splash(it, 6, it.kind === 'gold' ? '#ffd84a' : k.col);
        if (!this.fever && ++this.juice >= 10) { this.fever = 60 * 8; this.juice = 0; Sfx.play('fanfare'); this.pops.push({ text: 'FRUIT FEVER!', x: ARCADE_W / 2, y: 56, t: 0, col: '#ffd84a' }); }
        else Sfx.play(it.kind === 'gold' ? 'gold' : 'catch');
        const word = this.combo % 10 === 0 ? `${this.combo} IN A ROW +${pts}` : this.combo >= 5 && R() < 0.25 ? rpick(['NICE', 'JUICY', 'SWEET', 'YUM']) + ' +' + pts : '+' + pts;
        this.pops.push({ text: word, x: it.x, y: it.y - 10, t: 0, col: it.kind === 'gold' || this.fever ? '#ffd84a' : '#ffffff' });
        if (this.roundCaught >= 25) this.nextRound();
    },
    nextRound() {
        if (!this.roundHurt) { const b = 100 * this.round; this.score += b; this.pops.push({ text: `PERFECT ROUND +${b}`, x: ARCADE_W / 2, y: 70, t: 0, col: '#8cf0ff' }); Sfx.play('fanfare'); }
        this.round++; this.roundCaught = 0; this.roundHurt = false; this.banner = 80;
    },
    missed(it) {
        if (it.kind === 'bee' || it.kind === 'rotten' || it.kind === 'power') return;
        this.hearts--; this.hurt = 30; this.combo = 0; this.juice = 0; this.roundHurt = true;
        Sfx.play('splat');
        this.splats.push({ x: it.x, id: it.id, t: 0, col: it.kind === 'gold' ? '#ffd84a' : (FRUIT_KINDS[it.kind] || {}).col });
    },
    idle(inp) { this.move(inp); },
    drawItem(g, it) {
        const x = Math.round(it.x), y = Math.round(it.y);
        if (it.t < 0) { if (Math.floor(it.t / 4) % 2) { g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(x, 13, 1, 1); } return; }
        if (it.kind === 'bee') {
            const flap = Math.floor(it.t / 3) % 2;
            g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(x - 3, y - 5 + flap, 3, 2); g.fillRect(x + 1, y - 5 + flap, 3, 2);
            g.fillStyle = '#ffd84a'; g.fillRect(x - 4, y - 3, 8, 5);
            g.fillStyle = '#2d2230'; g.fillRect(x - 2, y - 3, 1, 5); g.fillRect(x + 1, y - 3, 1, 5); g.fillRect(x + 4, y - 1, 1, 1); g.fillRect(x - 3, y - 2, 1, 1);
        } else if (it.kind === 'rotten') {
            g.fillStyle = '#6b5a3a'; g.fillRect(x - 4, y - 3, 8, 7); g.fillStyle = '#4a3e28'; g.fillRect(x - 2, y - 1, 2, 2); g.fillRect(x + 1, y + 1, 2, 1);
            g.fillStyle = '#2d2230'; const f = it.t / 5; g.fillRect(x + Math.round(Math.sin(f) * 6), y - 7 + Math.round(Math.cos(f * 1.3) * 2), 1, 1); g.fillRect(x - Math.round(Math.cos(f) * 5), y - 6, 1, 1);
        } else if (it.kind === 'power') {
            const p = Math.floor(it.t / 6) % 2;
            g.fillStyle = p ? '#8cf0ff' : '#ffffff'; g.fillRect(x - 5, y - 5, 10, 10);
            g.fillStyle = '#3b2a45'; g.fillRect(x - 4, y - 4, 8, 8);
            pxText(g, { basket: 'B', honey: 'H', magnet: 'M' }[it.power], x - 1, y - 2, p ? '#ffffff' : '#8cf0ff');
        } else if (it.kind === 'gold' || this.fever) {
            g.drawImage(goldFruit(FRUIT_KINDS[it.kind] ? (GD.fruit.includes(it.id) ? it.id : 'peach') : it.id), x - 8, y - 8);
            if (Math.floor(it.t / 5) % 2) { g.fillStyle = '#ffffff'; g.fillRect(x + 5, y - 8, 1, 3); g.fillRect(x + 4, y - 7, 3, 1); }
        } else if (Assets.has('fruit_' + it.id)) spr(g, 'fruit_' + it.id, x, y + 5);
        else { g.fillStyle = FRUIT_KINDS[it.kind].col; g.fillRect(x - 4, y - 4, 8, 8); }
    },
    draw(g, t) {
        const fever = this.fever > 0, qx = this.quake ? Math.round((R() - 0.5) * 3) : 0;
        g.save(); g.translate(qx, 0);
        const sky = g.createLinearGradient(0, 0, 0, FRUIT_GROUND);
        if (fever) { sky.addColorStop(0, '#ffcf57'); sky.addColorStop(1, '#fff1c4'); } else { sky.addColorStop(0, '#7fd3e8'); sky.addColorStop(1, '#e4f6fb'); }
        g.fillStyle = sky; g.fillRect(-4, 0, ARCADE_W + 8, ARCADE_H);
        g.fillStyle = '#ffffff';
        for (const [cx, cy] of this.clouds) { g.fillRect(Math.round(cx) - 8, cy, 16, 4); g.fillRect(Math.round(cx) - 5, cy - 3, 9, 3); }
        // the trees along the top (a shaking tree is about to drop something)
        FRUIT_TREES.forEach((cx, i) => {
            const r = i === 1 ? 30 : 26, sh = this.shakes[i] ? Math.round(Math.sin(this.shakes[i] * 1.7) * 2) : 0;
            g.fillStyle = fever ? '#c98a2e' : '#3f7a2e'; g.beginPath(); g.ellipse(cx + sh, 6, r, 16, 0, 0, Math.PI * 2); g.fill();
            g.fillStyle = fever ? '#ffd84a' : '#5fa63e'; g.beginPath(); g.ellipse(cx - 4 + sh, 3, r - 6, 11, 0, 0, Math.PI * 2); g.fill();
            g.fillStyle = '#ff7a6a'; g.fillRect(cx - 9 + sh, 10, 2, 2); g.fillRect(cx + 6 + sh, 6, 2, 2); g.fillStyle = '#ffc53a'; g.fillRect(cx + 1 + sh, 13, 2, 2);
            if (this.shakes[i] && this.shakes[i] % 6 < 3) { g.fillStyle = '#7acc5e'; g.fillRect(cx - 12 + sh * 2, 18 + (26 - this.shakes[i]) / 2, 2, 1); g.fillRect(cx + 10 - sh, 20 + (26 - this.shakes[i]) / 3, 2, 1); }
        });
        // grass, and where things are going to land
        g.fillStyle = fever ? '#c9b24a' : '#8cc152'; g.fillRect(-4, FRUIT_GROUND - 2, ARCADE_W + 8, ARCADE_H - FRUIT_GROUND + 2);
        g.fillStyle = fever ? '#a8903a' : '#6fa03e'; g.fillRect(-4, FRUIT_GROUND - 2, ARCADE_W + 8, 1);
        for (const it of this.items) {
            if (it.kind === 'bee' || it.kind === 'power') continue;
            const k = Math.max(0, Math.min(1, (it.y + 20) / FRUIT_GROUND));
            g.fillStyle = it.kind === 'rotten' ? `rgba(90,60,40,${0.25 + k * 0.3})` : `rgba(40,60,20,${0.2 + k * 0.35})`;
            const w = Math.round(3 + k * 5);
            g.fillRect(Math.round(it.x0 != null && FRUIT_KINDS[it.kind] && FRUIT_KINDS[it.kind].sway ? it.x : it.x) - w, FRUIT_GROUND - 1, w * 2, 1);
        }
        for (const s of this.splats) {
            g.globalAlpha = Math.max(0, 1 - s.t / 70);
            g.fillStyle = s.col || '#e0405a';
            g.fillRect(Math.round(s.x) - 4, FRUIT_GROUND - 3, 9, 2); g.fillRect(Math.round(s.x) - 2, FRUIT_GROUND - 4, 5, 1);
            g.globalAlpha = 1;
        }
        for (const it of this.items) this.drawItem(g, it);
        for (const b of this.bits) { g.fillStyle = b.col; g.fillRect(Math.round(b.x), Math.round(b.y), 2, 2); }
        // Sarah (or whoever's playing) with the basket held high
        const blink = this.hurt && Math.floor(this.hurt / 4) % 2;
        if (!blink) {
            const bob = Math.abs(this.vx) > 0.4 ? Math.floor(t / 6) % 2 : 0;
            const sx = Math.round(this.x), sy = FRUIT_GROUND - bob, reach = this.reach();
            g.fillStyle = 'rgba(40,60,20,0.35)'; g.fillRect(sx - 6, FRUIT_GROUND, 12, 2);
            spr(g, sarahSprite(S.player.outfit, 'down_cheer'), sx, sy, this.vx < -0.4);
            const by = sy - 30;
            // what's been caught peeks over the rim
            this.pile.forEach((id, i) => { const px = sx - 6 + i * 4; if (id === 'gold') { g.fillStyle = '#ffd84a'; g.fillRect(px, by - 2, 4, 3); } else { g.fillStyle = (FRUIT_KINDS[id] || {}).col || '#e0405a'; g.fillRect(px, by - 2, 4, 3); } });
            g.fillStyle = this.power === 'basket' ? '#3a6ea8' : '#8a5a2b'; g.fillRect(sx - reach + 1, by, reach * 2 - 1, 7);
            g.fillStyle = this.power === 'basket' ? '#6ab0e8' : '#c9954f'; g.fillRect(sx - reach + 2, by + 1, reach * 2 - 3, 5);
            g.fillStyle = '#a8753a'; for (let k2 = -reach + 3; k2 < reach - 1; k2 += 3) g.fillRect(sx + k2, by + 2, 1, 3);
            g.fillStyle = '#e8c48a'; g.fillRect(sx - reach + 2, by + 1, reach * 2 - 3, 1);
            if (this.happy) { g.fillStyle = '#ffd84a'; g.fillRect(sx - reach - 1, by - 3, 1, 1); g.fillRect(sx + reach + 1, by - 4, 1, 1); }
        }
        popText(g, this.pops, 0, 0);
        g.restore();
        // hud: hearts, score, the juice meter, round, power-up time
        for (let i = 0; i < 5; i++) pxText(g, '*', 5 + i * 9, 5, i < this.hearts ? '#e0405a' : 'rgba(59,42,69,0.3)', 2);
        pxShadow(g, pxNum(this.score), ARCADE_W - 5, 5, '#ffffff', 1, 'right', '#3b2a45');
        pxShadow(g, 'BEST ' + pxNum(Math.max(this.score, arc().best.fruit || 0)), ARCADE_W - 5, 13, '#ffd84a', 1, 'right', '#3b2a45');
        g.fillStyle = 'rgba(59,42,69,0.45)'; g.fillRect(5, 18, 42, 4);
        g.fillStyle = fever ? (Math.floor(t / 4) % 2 ? '#ffffff' : '#ffd84a') : '#ff7aa8';
        g.fillRect(6, 19, fever ? Math.round(40 * this.fever / 480) : Math.round(40 * this.juice / 10), 2);
        pxShadow(g, fever ? 'FEVER x2' : 'JUICE', 5, 24, fever ? '#ffd84a' : '#ffffff', 1, 'left', '#3b2a45');
        if (this.power) pxShadow(g, `${FRUIT_POWERS[this.power]} ${Math.ceil(this.powerT / 60)}`, ARCADE_W / 2, 32, '#8cf0ff', 1, 'center', '#3b2a45');
        if (this.combo >= 5) pxShadow(g, this.combo + ' IN A ROW', ARCADE_W / 2, 40, '#ffffff', 1, 'center', '#3b2a45');
        if (this.banner) pxShadow(g, 'ROUND ' + this.round, ARCADE_W / 2, 66, '#ffffff', 2, 'center', '#3b2a45');
    },
};
ARCADE_GAMES.fruit = {
    name: 'Fruit Catch', fee: PLAY_FEE, tune: 'fruit', glow: '#ff9ec0',
    help: '\u2190 \u2192 move (or drag on the screen)',
    how: "Watch the trees: one shakes, then drops something (its shadow shows where). Catch the fruit, dodge bees and rotten fruit. Ten in a row starts a Fruit Fever: double points! Golden fruit mends a heart, and B, H and M boxes are power-ups. Every 25 fruit is a new round.",
    buttons: [
        { k: 'left', label: '\u25c0', keys: MOVE_KEYS.left, side: 'L', aria: 'Move left' },
        { k: 'right', label: '\u25b6', keys: MOVE_KEYS.right, side: 'R', aria: 'Move right' },
    ],
    create() { return new FruitGame(); },
    tickets(g) { return g.score > 0 ? Math.max(1, Math.floor(g.score / 50)) : 0; },
    result(g) {
        const best = arc().best.fruit || 0;
        return { title: g.score >= best && g.score > 0 ? 'New best!' : 'Game over', lines: [`${fmtNum(g.score)} points \u00b7 round ${g.round} \u00b7 ${g.caught} ${plural(g.caught, 'fruit')} caught`, `Best: ${fmtNum(Math.max(best, g.score))} \u00b7 longest streak ${g.best}`] };
    },
};

