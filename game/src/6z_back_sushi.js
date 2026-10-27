/* ---- 6z_back_sushi.js ---- */
/* Sushi Swap, out front in the arcade (from the back room until David's swap): Maki's conveyor-belt puzzle (a Panel de Pon game). Sushi rides up the belt
   from the bottom, the two-wide cursor swaps the pair it sits on, and three or more alike in a row or column pop.
   Sushi that drops into a new match makes a chain, four or more at once make a combo, and both pause the belt for a
   moment. It runs in the same cabinet overlay as the others (59_arcade.js). */

const SUSHI_COLS = 6, SUSHI_ROWS = 12, SUSHI_C = 12, SUSHI_BX = 6, SUSHI_BY = 5;
const SUSHI_W = SUSHI_COLS * SUSHI_C, SUSHI_H = SUSHI_ROWS * SUSHI_C;
/* in frames: a swap, the moment a piece hangs over a gap, one cell of falling, the flash, the faces, between pops */
const SUSHI_T = { swap: 4, hover: 10, fall: 2, flash: 36, face: 12, pop: 7 };
const SUSHI_HEALTH = 110;                         // how long the stack may sit at the top before Sarah is stuffed
const SUSHI_SIXTH = 8;                            // the speed at which a sixth kind of sushi joins the belt
const SUSHI_COMBO = [0, 0, 0, 0, 20, 30, 50, 60, 70, 80, 100, 140, 170, 210, 250, 290, 340, 390, 440, 490, 550];
const SUSHI_CHAIN = [0, 0, 50, 80, 150, 300, 400, 500, 700, 900, 1100, 1300, 1500, 1800];
const SUSHI_PAL = {
    k: '#2a1c2e', w: '#fffaf0', g: '#d8c8b4', h: '#ffffff',
    o: '#ff8a4a', p: '#ffd8bc', O: '#d0582a',                       // salmon
    y: '#ffd84a', l: '#fff0a0', Y: '#d9a020', n: '#1e3326', N: '#4a7a56',          // tamago, nori
    r: '#e8384e', R: '#a81e3a',                                      // tuna
    G: '#8fd14f', H: '#cdf28e', D: '#4f962e',                       // wasabi
    b: '#a8e0ff', B: '#4a92d0', s: '#6a3a22', c: '#e0405a',          // the soy sauce fish
};
/* each kind has its own colour and its own shape, so the belt reads at a glance (and without colour) */
const SUSHI_KINDS = [
    { name: 'salmon', col: '#ff8a4a', face: [2, 7, 2], art: ['.kkkkkkkkk.', 'kopooopoook', 'koopooopook', 'kooopooopok', 'kpooopooopk', 'kOpooopooOk',
        'kOOpOOOpOOk', 'kwwwwwwwwwk', 'kgwwwwwwwgk', '.kgggggggk.', '..kkkkkkk..'] },
    { name: 'tamago', col: '#ffd84a', face: [1, 8, 2], art: ['.kkkkkkkkk.', 'kllyNnnyllk', 'kyyyNnnyyyk', 'kyyyNnnyyyk', 'kyyyNnnyyyk', 'kYyyNnnyyYk',
        'kYYYNnnYYYk', 'kwwwNnnwwwk', 'kgwwNnnwwgk', '.kggNnnggk.', '..kkkkkkk..'] },
    { name: 'maki', col: '#e8384e', face: [2, 7, 3], art: ['...kkkkk...', '.kkNNnnnkk.', '.kNwwwwwnk.', 'kNwwwwwwwnk', 'kNwwrrrwwnk', 'knwwrrRwwnk',
        'knwwrRRwwnk', 'knwwwwwwgnk', '.knwggggnk.', '.kknnnnnkk.', '...kkkkk...'] },
    { name: 'onigiri', col: '#fffaf0', face: [3, 6, 3], art: ['....kkk....', '...khwwk...', '...kwwwk...', '..khwwwwk..', '..kwwwwwk..', '.kwwwwwwgk.',
        '.kwwnnnwgk.', 'kwwnnnnnwgk', 'kwwnNnnnwgk', 'kgwnnnnnggk', '.kkkkkkkkk.'] },
    { name: 'wasabi', col: '#8fd14f', face: [2, 6, 6], art: ['.....kk....', '....kHGk...', '....kkGGk..', '...kGHHGk..', '..kGGGGDDk.', '..kkDDDDk..',
        '.kGHHGGGGk.', 'kGHGGGGGDDk', 'kDGGGGGDDDk', '.kDDDDDDDk.', '..kkkkkkk..'] },
    { name: 'soy fish', col: '#a8e0ff', face: [2, 5, 3], art: ['...........', '...kkkk....', '..kbhhbk..k', '.kbhbbbbkkk', 'ckbkbsssbBk', 'ckbbsssssBk',
        'ckbbssssbBk', '.kbbbbbbkkk', '..kBBBBk..k', '...kkkk....', '...........'] },
];
const SUSHI_ART = {};
/* one piece, drawn once into a little canvas: plain, flashing, with its pop face, or greyed out at the end */
function sushiArt(k, mode) {
    const key = k + ':' + mode;
    if (SUSHI_ART[key]) return SUSHI_ART[key];
    const c = document.createElement('canvas');
    c.width = 11; c.height = 11;
    const g = c.getContext('2d'), K = SUSHI_KINDS[k];
    K.art.forEach((row, y) => { for (let x = 0; x < 11; x++) { const ch = row[x]; if (ch !== '.') { g.fillStyle = SUSHI_PAL[ch]; g.fillRect(x, y, 1, 1); } } });
    g.globalCompositeOperation = 'source-atop';
    if (mode === 'flash') { g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(0, 0, 11, 11); }
    if (mode === 'dim') { g.fillStyle = 'rgba(64,56,80,0.78)'; g.fillRect(0, 0, 11, 11); }
    if (mode === 'face') {
        // squeezed-shut eyes, > <, just before it pops
        g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(0, 0, 11, 11);
        const [a, b, y] = K.face;
        g.fillStyle = '#2a1c2e';
        g.fillRect(a, y, 1, 1); g.fillRect(a + 1, y + 1, 1, 1); g.fillRect(a, y + 2, 1, 1);
        g.fillRect(b + 1, y, 1, 1); g.fillRect(b, y + 1, 1, 1); g.fillRect(b + 1, y + 2, 1, 1);
    }
    SUSHI_ART[key] = c;
    return c;
}
const SUSHI_SAY = {
    chain: [null, null, ['NICE ROLL!'], ['PRECISE!'], ['EXQUISITE!'], ['MAGNIFICENT!'], ['I AM CRYING', 'RICE TEARS!']],
    combo: [null, null, null, null, ['TIDY!'], ['VERY TIDY!'], ['A FULL PLATTER!']],
};
function SushiGame() {
    this.t = 0; this.f = 0; this.score = 0; this.over = false; this.dead = 0;
    this.grid = [];
    for (let r = 0; r < SUSHI_ROWS; r++) this.grid.push(new Array(SUSHI_COLS).fill(null));
    this.rise = 0; this.cx = 2; this.cy = 7; this.das = 0; this.touch = null;
    this.level = 1; this.cleared = 0; this.chain = 1; this.bestChain = 1; this.bestCombo = 0;
    this.stop = 0; this.stopMax = 1; this.raising = false; this.raiseHeld = false; this.health = SUSHI_HEALTH; this.wasDanger = false;
    this.groups = []; this.pops = []; this.bits = []; this.rings = []; this.shake = 0; this.landT = 0; this.talk = null; this.hop = 0;
    this.fill();
    this.next = this.makeRow();
    this.say(["LET'S ROLL!"], 150);
}
SushiGame.prototype = {
    kinds() { return this.level >= SUSHI_SIXTH ? 6 : 5; },
    block(k) { return { k, s: 'idle', t: 0, oy: 0, sw: 0, ch: false, g: null, popped: false }; },
    /* a kind that doesn't make three in a row with what's to the left or below */
    pick(r, c) {
        const at = (rr, cc) => rr < SUSHI_ROWS && cc >= 0 && this.grid[rr][cc] ? this.grid[rr][cc].k : -1;
        let k = 0;
        for (let tries = 0; tries < 30; tries++) {
            k = Math.floor(R() * this.kinds());
            if (at(r, c - 1) === k && at(r, c - 2) === k) continue;
            if (at(r + 1, c) === k && at(r + 2, c) === k) continue;
            break;
        }
        return k;
    },
    /* the opening stack: a jagged hill of sushi, nothing matched yet */
    fill() {
        const hs = shuffled([4, 5, 6, 7, 6, 5]);
        for (let c = 0; c < SUSHI_COLS; c++) for (let i = 0; i < hs[c]; i++) this.grid[SUSHI_ROWS - 1 - i][c] = this.block(this.pick(SUSHI_ROWS - 1 - i, c));
    },
    /* the next row up the belt (shown dimmed under the stack until it arrives) */
    makeRow() {
        const row = [], a = this.grid[SUSHI_ROWS - 1], b = this.grid[SUSHI_ROWS - 2];
        for (let c = 0; c < SUSHI_COLS; c++) {
            let k = 0;
            for (let tries = 0; tries < 30; tries++) {
                k = Math.floor(R() * this.kinds());
                if (c >= 2 && row[c - 1] === k && row[c - 2] === k) continue;
                if (a[c] && b[c] && a[c].k === k && b[c].k === k) continue;
                break;
            }
            row.push(k);
        }
        return row;
    },
    rowFrames() { return Math.max(36, Math.round(600 * Math.pow(0.9, this.level - 1))); },
    topRow() { return this.rise > 0 ? 1 : 0; },
    say(lines, t) { this.talk = { lines, t: t || 110 }; },
    update(inp) {
        this.f++;
        this.fx();
        if (this.dead) { if (++this.dead >= 96) this.over = true; return; }
        this.t++;
        this.controls(inp, false);
        this.step();
    },
    /* during READY the cursor can already move (but nothing swaps yet) */
    idle(inp) { this.f++; this.fx(); this.controls(inp, true); },
    after() { this.f++; this.fx(); },
    controls(inp, ready) {
        const H = inp.held, P = inp.pressed;
        const dx = (H.right ? 1 : 0) - (H.left ? 1 : 0), dy = (H.down ? 1 : 0) - (H.up ? 1 : 0);
        if (P.left || P.right || P.up || P.down) { this.moveCur((P.right ? 1 : 0) - (P.left ? 1 : 0), (P.down ? 1 : 0) - (P.up ? 1 : 0)); this.das = 0; }
        else if (dx || dy) { if (++this.das >= 10 && (this.das - 10) % 3 === 0) this.moveCur(dx, dy); }
        else this.das = 0;
        this.pointer(inp, ready);
        if (ready) return;
        if (P.swap) this.swap(this.cx, this.cy);
        this.raiseHeld = !!H.raise;
        if ((H.raise || P.raise) && !this.raising && this.canRaise()) { this.raising = true; this.stop = 0; }        // a quick tap still lifts one whole row
    },
    moveCur(dx, dy) {
        const x = clamp(this.cx + dx, 0, SUSHI_COLS - 2), y = clamp(this.cy + dy, this.topRow(), SUSHI_ROWS - 1);
        if (x !== this.cx || y !== this.cy) { this.cx = x; this.cy = y; Sfx.play('blip'); }
    },
    /* the screen: tap a pair to put the cursor there (tap it again to swap), or drag a piece sideways to slide it */
    pointer(inp, ready) {
        const pt = inp.pointer, T = this.touch;
        if (inp.pressed.screen) {
            this.touch = null;
            const fx = (pt.x - SUSHI_BX) / SUSHI_C, row = Math.floor((pt.y - SUSHI_BY + this.rise) / SUSHI_C);
            if (fx < -0.5 || fx > SUSHI_COLS + 0.5 || pt.y < SUSHI_BY - 6 || row > SUSHI_ROWS - 1) return;
            const r = clamp(row, this.topRow(), SUSHI_ROWS - 1), c = clamp(Math.floor(fx), 0, SUSHI_COLS - 1);
            const px = clamp(Math.round(fx) - 1, 0, SUSHI_COLS - 2);
            const was = px === this.cx && r === this.cy;
            if (!was) Sfx.play('blip');
            this.cx = px; this.cy = r;
            this.touch = { col: c, row: r, b: this.grid[r][c], was, moved: false };
            return;
        }
        if (!T) return;
        if (!pt.down) { if (T.was && !T.moved && !ready) this.swap(this.cx, this.cy); this.touch = null; return; }
        if (ready || !T.b) return;
        const col = clamp(Math.floor((pt.x - SUSHI_BX) / SUSHI_C), 0, SUSHI_COLS - 1);
        if (col === T.col) return;
        if (!this.grid[T.row] || this.grid[T.row][T.col] !== T.b) { T.b = null; return; }      // it fell or popped: let go
        const d = col > T.col ? 1 : -1, x = d > 0 ? T.col : T.col - 1;
        if (this.swap(x, T.row)) { T.col += d; T.moved = true; this.cx = x; this.cy = T.row; }
    },
    /* swap the pair at (x, y): either may be empty, but both must be sitting still */
    swap(x, y) {
        const row = this.grid[y];
        if (!row || x < 0 || x > SUSHI_COLS - 2) return false;
        const a = row[x], b = row[x + 1], free = q => !q || q.s === 'idle';
        if ((!a && !b) || !free(a) || !free(b)) return false;
        row[x] = b; row[x + 1] = a;
        if (a) { a.s = 'swap'; a.t = 0; a.sw = -1; }
        if (b) { b.s = 'swap'; b.t = 0; b.sw = 1; }
        Sfx.play('whisk');
        return true;
    },
    canRaise() { return !this.groups.length && !this.grid[0].some(b => b) && !this.dead; },
    step() {
        this.gravity();
        const hit = this.findMatches();
        if (hit.size) this.match(hit);
        // a piece that landed without matching is no longer part of a chain
        for (const row of this.grid) for (const b of row) if (b && b.ch && b.s === 'idle') b.ch = false;
        this.clears();
        if (this.chain > 1 && !this.groups.length && !this.grid.some(row => row.some(b => b && b.ch))) this.chain = 1;
        this.belt();
        this.cy = Math.max(this.cy, this.topRow());
        this.levelUp();
        const danger = this.dangerCols().some(Boolean);
        if (danger && !this.wasDanger && !this.dead && !this.talk) this.say(rpick([['TOO HIGH!'], ['EEP! THE BELT!'], ['MIND THE TOP!']]), 90);
        this.wasDanger = danger;
    },
    /* swaps finish, pieces over a gap hang for a moment and then drop, whole columns falling together */
    gravity() {
        const Gr = this.grid;
        let landed = false;
        for (let r = SUSHI_ROWS - 1; r >= 0; r--) for (let c = 0; c < SUSHI_COLS; c++) {
            const b = Gr[r][c];
            if (!b) continue;
            const below = r < SUSHI_ROWS - 1 ? Gr[r + 1][c] : 'floor';
            if (b.s === 'swap') { if (++b.t < SUSHI_T.swap) continue; b.s = 'idle'; b.sw = 0; }
            if (b.s === 'idle') {
                if (!below) { b.s = 'hover'; b.t = SUSHI_T.hover; }
                else if (below.s === 'hover') { b.s = 'hover'; b.t = below.t; }
                else if (below.s === 'fall') { b.s = 'fall'; b.oy = 0; }
                continue;
            }
            if (b.s === 'hover') { if (--b.t > 0) continue; b.s = 'fall'; b.oy = -SUSHI_C / SUSHI_T.fall; }
            if (b.s === 'fall') {
                b.oy += SUSHI_C / SUSHI_T.fall;
                if (b.oy < 0) continue;
                b.oy = 0;
                if (!below) { Gr[r + 1][c] = b; Gr[r][c] = null; b.oy = -SUSHI_C; }
                else if (below === 'floor' || (below.s !== 'fall' && below.s !== 'hover')) { b.s = 'idle'; landed = true; }
            }
        }
        if (landed && this.landT <= 0) { Sfx.play('land'); this.landT = 5; }
        this.landT--;
    },
    findMatches() {
        const Gr = this.grid, hit = new Set(), ok = b => b && b.s === 'idle';
        const run = cells => {
            let i = 0;
            while (i < cells.length) {
                let e = i + 1;
                if (ok(cells[i])) while (e < cells.length && ok(cells[e]) && cells[e].k === cells[i].k) e++;
                if (e - i >= 3 && ok(cells[i])) for (let j = i; j < e; j++) hit.add(cells[j]);
                i = e;
            }
        };
        for (let r = 0; r < SUSHI_ROWS; r++) run(Gr[r]);
        for (let c = 0; c < SUSHI_COLS; c++) run(Gr.map(row => row[c]));
        return hit;
    },
    /* everything that matched this frame clears as one group: its size is the combo, and if any piece of it fell
       from an earlier clear, it's the next link of a chain */
    match(hit) {
        const list = [];
        for (let r = 0; r < SUSHI_ROWS; r++) for (let c = 0; c < SUSHI_COLS; c++) { const b = this.grid[r][c]; if (b && hit.has(b)) list.push({ b, r, c }); }
        const n = list.length, chained = list.some(o => o.b.ch);
        if (chained) { this.chain++; this.bestChain = Math.max(this.bestChain, this.chain); }
        // (the faster the belt, the snappier the pops)
        const grp = { list, t: 0, n, flash: Math.max(20, SUSHI_T.flash + 2 - this.level * 2), gap: (n > 8 ? 4 : n > 5 ? 5 : SUSHI_T.pop) - (this.level >= 10 ? 1 : 0) };
        for (const o of list) { o.b.s = 'clear'; o.b.g = grp; o.b.ch = false; }
        this.groups.push(grp);
        let pts = n * (10 + (this.level - 1) * 2);
        if (n >= 4) pts += SUSHI_COMBO[Math.min(n, SUSHI_COMBO.length - 1)] + Math.max(0, n - SUSHI_COMBO.length + 1) * 60;
        if (chained) pts += SUSHI_CHAIN[Math.min(this.chain, SUSHI_CHAIN.length - 1)] + Math.max(0, this.chain - SUSHI_CHAIN.length + 1) * 300;
        this.score += pts;
        this.cleared += n;
        // the reward: the belt stops for a bit (longer when things are tight)
        const panic = this.dangerCols().some(Boolean) ? 1.5 : 1;
        let stop = 0;
        if (n >= 4) stop = 40 + n * 10;
        if (chained) stop = Math.max(stop, 60 + this.chain * 45);
        if (stop) { this.stop = Math.min(420, Math.max(this.stop, Math.round(stop * panic))); this.stopMax = Math.max(this.stop, 1); }
        // and the fanfare, stacked just above the pieces that matched
        const lines = [];
        if (chained) {
            lines.push([this.chain + ' CHAIN!', '#ffd84a', 2, 60]);
            Sfx.play(this.chain >= 4 ? 'fanfare' : 'gold');
            if (this.chain >= 3) this.shake = Math.min(18, 6 + this.chain * 2);
            this.say(SUSHI_SAY.chain[Math.min(this.chain, SUSHI_SAY.chain.length - 1)], 100);
            this.hop = 16;
        }
        if (n >= 4) {
            this.bestCombo = Math.max(this.bestCombo, n);
            lines.push([n + ' COMBO!', '#8cf0ff', chained ? 1 : 2, 54]);
            if (!chained) { Sfx.play('bento'); this.say(SUSHI_SAY.combo[Math.min(n, SUSHI_SAY.combo.length - 1)], 90); this.hop = 12; }
            if (n >= 6) this.shake = Math.max(this.shake, 8);
        }
        if (!chained && n < 4) Sfx.play('line');
        lines.push(['+' + pts, '#ffffff', 1, 44]);
        const tall = lines.reduce((a, l) => a + l[2] * 5 + 4, 0);
        let y = clamp(SUSHI_BY + list[0].r * SUSHI_C - this.rise - tall - 1, SUSHI_BY + 3, SUSHI_BY + SUSHI_H - tall);
        lines.forEach(([text, col, k, life], i) => { this.pops.push({ text, x: SUSHI_BX + SUSHI_W / 2, y, t: -i * 4, life, col, k }); y += k * 5 + 4; });
    },
    /* a group flashes, the pieces make a face, then pop one by one (top left first); when the last one is gone the
       sushi above drops, ready to chain */
    clears() {
        for (const grp of this.groups) {
            grp.t++;
            const t0 = grp.flash + SUSHI_T.face;
            grp.list.forEach((o, i) => { if (!o.b.popped && grp.t >= t0 + i * grp.gap) { o.b.popped = true; this.burst(o); } });
            if (grp.t >= t0 + grp.n * grp.gap + 3) grp.done = true;
        }
        for (const grp of this.groups) if (grp.done) this.remove(grp);
        this.groups = this.groups.filter(grp => !grp.done);
    },
    burst(o) {
        const x = SUSHI_BX + o.c * SUSHI_C + 5, y = SUSHI_BY + o.r * SUSHI_C - this.rise + 5, col = SUSHI_KINDS[o.b.k].col;
        for (let j = 0; j < 7; j++) { const a = R() * Math.PI * 2, v = 0.6 + R() * 1.4; this.bits.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, t: 0, col: j < 2 ? '#fffaf0' : col }); }
        this.rings.push({ x, y, t: 0, col });
        Sfx.play('bubble');
    },
    remove(grp) {
        const gone = [];
        for (const o of grp.list) {
            const p = this.grid[o.r][o.c] === o.b ? [o.r, o.c] : this.find(o.b);
            if (p) { this.grid[p[0]][p[1]] = null; gone.push(p); }
        }
        // everything stacked on a popped piece hangs for a moment, then drops (and may chain)
        for (const [r0, c] of gone) for (let r = r0 - 1; r >= 0; r--) {
            const b = this.grid[r][c];
            if (!b || b.s === 'clear' || b.s === 'swap') break;
            b.ch = true;
            if (b.s === 'idle') { b.s = 'hover'; b.t = SUSHI_T.hover; }
        }
    },
    find(b) {
        for (let r = 0; r < SUSHI_ROWS; r++) { const c = this.grid[r].indexOf(b); if (c >= 0) return [r, c]; }
        return null;
    },
    /* the belt: it creeps up (faster as the speed climbs), waits while anything pops or while a reward stop runs,
       and at the very top it holds on for a moment before Sarah is stuffed */
    belt() {
        if (this.groups.length) return;
        const top = this.grid[0];
        if (top.some(b => b)) {
            this.raising = false;
            if (!top.some(b => b && (b.s === 'idle' || b.s === 'swap'))) return;          // only passing through on the way down
            if (this.stop > 0) { this.stop--; return; }
            if (--this.health % 16 === 0) Sfx.play('ticket');
            if (this.health <= 0) this.die();
            return;
        }
        this.health = Math.min(SUSHI_HEALTH, this.health + 3);
        if (this.raising) this.stop = 0;
        else if (this.stop > 0) { this.stop--; return; }
        this.rise += this.raising ? 2 : SUSHI_C / this.rowFrames();
        if (this.rise >= SUSHI_C) this.shift();
    },
    shift() {
        this.rise = Math.max(0, this.rise - SUSHI_C);
        this.grid.shift();
        this.grid.push(this.next.map(k => this.block(k)));
        this.next = this.makeRow();
        this.cy = Math.max(0, this.cy - 1);
        if (this.touch) this.touch.row--;
        if (this.raising) { this.score++; Sfx.play('claw'); if (!this.raiseHeld) this.raising = false; }
    },
    levelUp() {
        const lv = Math.min(99, 1 + Math.floor((this.cleared + this.t / 150) / 24));
        if (lv <= this.level) return;
        this.level = lv;
        Sfx.play('levelup');
        this.pops.push({ text: 'SPEED UP!', x: SUSHI_BX + SUSHI_W / 2, y: 40, t: 0, life: 50, col: '#8cf0ff', k: 1 });
        if (lv === SUSHI_SIXTH) { this.pops.push({ text: 'NEW: SOY FISH!', x: SUSHI_BX + SUSHI_W / 2, y: 50, t: -10, life: 70, col: '#a8e0ff', k: 1 }); this.say(['SOY FISH?!', 'SINCE WHEN?'], 120); }
        else this.say(rpick([['FASTER!'], ['THE BELT IS', 'HUNGRY!'], ['KEEP UP!']]), 90);
    },
    dangerCols() {
        const out = [];
        for (let c = 0; c < SUSHI_COLS; c++) out.push(!!(this.grid[0][c] || this.grid[1][c] || this.grid[2][c]));
        return out;
    },
    die() {
        this.dead = 1; this.raising = false; this.touch = null; this.shake = 14;
        Sfx.play('trip');
        this.say(['STUFFED...'], 999);
    },
    fx() {
        for (const b of this.bits) { b.x += b.vx; b.y += b.vy; b.vy += 0.12; b.t++; }
        this.bits = this.bits.filter(b => b.t < 26);
        this.rings = this.rings.filter(q => ++q.t < 9);
        this.pops = this.pops.filter(q => ++q.t < q.life);
        if (this.shake) this.shake--;
        if (this.hop) this.hop--;
        if (this.talk && --this.talk.t <= 0) this.talk = null;
    },
    draw(g) {
        const f = this.f, C = SUSHI_C, BX = SUSHI_BX, BY = SUSHI_BY, rise = this.rise;
        g.fillStyle = '#1c1430'; g.fillRect(0, 0, ARCADE_W, ARCADE_H);
        g.fillStyle = '#251a3c';
        for (let y = 2; y < ARCADE_H; y += 8) for (let x = 82 + (y / 8 % 2) * 4; x < ARCADE_W; x += 8) g.fillRect(x, y, 1, 1);
        const qx = this.shake ? Math.round((R() - 0.5) * Math.min(4, this.shake / 3)) : 0, qy = this.shake ? Math.round((R() - 0.5) * Math.min(3, this.shake / 4)) : 0;
        g.save(); g.translate(qx, qy);
        const danger = this.dangerCols(), anyDanger = danger.some(Boolean), alarm = anyDanger && Math.floor(f / 8) % 2;
        // the counter: hinoki wood around the belt
        g.fillStyle = '#7a5228'; g.fillRect(BX - 3, BY - 3, SUSHI_W + 6, SUSHI_H + 6);
        g.fillStyle = '#e8c48a'; g.fillRect(BX - 2, BY - 2, SUSHI_W + 4, SUSHI_H + 4);
        g.fillStyle = '#c9954f'; g.fillRect(BX - 2, BY + SUSHI_H, SUSHI_W + 4, 2); g.fillRect(BX + SUSHI_W, BY - 2, 2, SUSHI_H + 4);
        if (alarm) { g.fillStyle = '#ff5a6a'; g.fillRect(BX - 2, BY - 2, SUSHI_W + 4, 2); }
        g.save(); g.beginPath(); g.rect(BX, BY, SUSHI_W, SUSHI_H); g.clip();
        g.fillStyle = '#2e2a48'; g.fillRect(BX, BY, SUSHI_W, SUSHI_H);
        // the belt's slats ride up with the stack
        g.fillStyle = '#37335a';
        for (let r = 0; r <= SUSHI_ROWS + 1; r++) g.fillRect(BX, Math.round(BY + r * C - rise) - 1, SUSHI_W, 1);
        for (let c = 0; c < SUSHI_COLS; c++) if (danger[c]) { g.fillStyle = alarm ? 'rgba(255,90,106,0.22)' : 'rgba(255,90,106,0.1)'; g.fillRect(BX + c * C, BY, C, SUSHI_H); }
        // the stack
        const bounce = [0, -1, -2, -1];
        for (let r = 0; r < SUSHI_ROWS; r++) for (let c = 0; c < SUSHI_COLS; c++) {
            const b = this.grid[r][c];
            if (!b || b.popped) continue;
            let x = BX + c * C, y = BY + r * C - rise + b.oy, mode = 'n';
            if (b.s === 'swap') x += Math.round(b.sw * C * (1 - b.t / SUSHI_T.swap));
            if (b.s === 'clear') mode = b.g.t < b.g.flash ? (Math.floor(b.g.t / 3) % 2 ? 'flash' : 'n') : 'face';
            else if (danger[c] && !this.dead && b.s === 'idle') y += bounce[Math.floor(f / 4 + c) % 4];
            if (this.dead && this.dead > r * 4 + 2) mode = 'dim';
            g.drawImage(sushiArt(b.k, mode), x, Math.round(y));
        }
        // what's coming up the belt
        const ny = Math.round(BY + SUSHI_H - rise);
        this.next.forEach((k, c) => g.drawImage(sushiArt(k, this.dead ? 'dim' : 'n'), BX + c * C, ny));
        g.fillStyle = 'rgba(28,20,48,0.62)'; g.fillRect(BX, ny - 1, SUSHI_W, C + 1);
        // the cursor
        if (!this.dead) {
            const x = BX + this.cx * C - 1, y = Math.round(BY + this.cy * C - rise) - 1, w = 2 * C + 1, h = C + 1;
            const col = Math.floor(f / 12) % 2 ? '#ffffff' : '#ffe88a';
            g.fillStyle = 'rgba(28,20,48,0.7)';
            g.fillRect(x - 1, y - 1, w + 2, 1); g.fillRect(x - 1, y + h, w + 2, 1); g.fillRect(x - 1, y - 1, 1, h + 2); g.fillRect(x + w, y - 1, 1, h + 2);
            g.fillStyle = col;
            g.fillRect(x, y, w, 1); g.fillRect(x, y + h - 1, w, 1); g.fillRect(x, y, 1, h); g.fillRect(x + w - 1, y, 1, h); g.fillRect(x + C, y, 1, 2); g.fillRect(x + C, y + h - 2, 1, 2);
            // corner brackets, so it stands out on a busy belt
            for (const [cx2, cy2, sx, sy] of [[x - 1, y - 1, 1, 1], [x + w, y - 1, -1, 1], [x - 1, y + h, 1, -1], [x + w, y + h, -1, -1]]) {
                g.fillRect(cx2, cy2, 1, 1); g.fillRect(cx2 + sx, cy2, 1, 1); g.fillRect(cx2, cy2 + sy, 1, 1); g.fillRect(cx2 + 2 * sx, cy2, 1, 1); g.fillRect(cx2, cy2 + 2 * sy, 1, 1);
            }
        }
        // a pop: a little star of sparks flying out
        for (const q of this.rings) {
            const d = 2 + q.t * 1.5, x = Math.round(q.x), y = Math.round(q.y);
            g.fillStyle = q.t < 3 ? '#ffffff' : q.col;
            for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) g.fillRect(x + Math.round(ax * d), y + Math.round(ay * d), 1 + Math.abs(ax), 1 + Math.abs(ay));
            for (const [ax, ay] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) g.fillRect(x + Math.round(ax * d * 0.7), y + Math.round(ay * d * 0.7), 1, 1);
            if (q.t < 2) { g.fillStyle = '#ffffff'; g.fillRect(x - 2, y - 2, 5, 5); }
        }
        for (const b of this.bits) { g.fillStyle = b.col; g.fillRect(Math.round(b.x), Math.round(b.y), b.col === '#fffaf0' ? 1 : 2, 2); }          // rice grains are thinner
        if (this.dead > 24) {
            g.fillStyle = 'rgba(28,20,48,0.7)'; g.fillRect(BX, 60, SUSHI_W, 24);
            pxShadow(g, 'STUFFED!', BX + SUSHI_W / 2, 65, '#ff9aa8', 2, 'center');
        }
        g.restore();
        // the big words
        for (const q of this.pops) {
            if (q.t < 0) continue;
            g.globalAlpha = q.t > q.life - 12 ? (q.life - q.t) / 12 : 1;
            const k = q.k || 1, y = q.y - Math.min(q.t, 20) * 0.35 + (q.t < 4 ? 4 - q.t : 0), w = pxWidth(q.text, k);
            const x = Math.round(clamp(q.x, w / 2 + 3, ARCADE_W - w / 2 - 3) - w / 2);
            g.fillStyle = 'rgba(28,20,48,0.72)'; g.fillRect(x - 2, Math.round(y) - 2, w + 3 + k, 5 * k + 3 + k);
            pxShadow(g, q.text, x, Math.round(y), q.col, k);
            g.globalAlpha = 1;
        }
        g.restore();
        this.drawSide(g, anyDanger);
    },
    drawSide(g, anyDanger) {
        const f = this.f, sx = 84;
        // a noren over the side counter
        g.fillStyle = '#8a5a2b'; g.fillRect(sx - 2, 1, 54, 2);
        g.fillStyle = '#3d4fa8'; g.fillRect(sx, 3, 50, 13);
        for (let x = 0; x < 50; x += 5) g.fillRect(sx + x + 1, 16, 3, 1);
        g.fillStyle = '#2c3a84'; g.fillRect(sx + 24, 13, 2, 4);
        pxText(g, 'SUSHI', sx + 25, 7, '#ffffff', 1, 'center');
        sideLabel(g, sx, 21, 'SCORE', pxNum(this.score));
        sideLabel(g, sx, 39, 'BEST', pxNum(Math.max(this.score, arc().best.sushi || 0)), '#ffd84a');
        sideLabel(g, sx, 57, 'SPEED', pxNum(this.level), '#8cf0ff');
        if (this.chain > 1) sideLabel(g, sx, 75, 'CHAIN', 'X' + this.chain + ' !', Math.floor(f / 6) % 2 ? '#ffd84a' : '#ffffff');
        else sideLabel(g, sx, 75, 'CHAIN', 'BEST X' + this.bestChain, '#ffffff');
        // the belt's state: a reward stop, or the alarm at the top
        const bar = (label, col, frac, blink) => {
            pxText(g, label, sx, 94, blink && Math.floor(f / 8) % 2 ? '#ffffff' : col);
            g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(sx, 101, 48, 3);
            g.fillStyle = col; g.fillRect(sx, 101, Math.round(48 * clamp(frac, 0, 1)), 3);
        };
        const topped = this.health < SUSHI_HEALTH;
        if (this.stop > 0) bar('STOP ' + Math.ceil(this.stop / 60), '#8cf0ff', this.stop / this.stopMax);
        else if (topped) bar('DANGER!', '#ff5a6a', this.health / SUSHI_HEALTH, true);
        else if (anyDanger) pxText(g, 'DANGER', sx, 94, Math.floor(f / 8) % 2 ? '#ff5a6a' : '#ff9aa8');
        else if (this.raising) pxText(g, 'RAISE!', sx, 94, '#ffd84a');
        // Maki, who runs the belt, and has something to say about it
        const hop = this.hop ? -Math.round(Math.sin(this.hop / 16 * Math.PI) * 4) : 0;
        spr(g, 'maki_' + (Math.floor(f / 30) % 2), sx + 10, 149 + hop);
        if (this.talk) {
            const L = this.talk.lines, w = Math.max(...L.map(s => pxWidth(s))) + 6, h = L.length * 7 + 4, x = Math.min(sx + 2, ARCADE_W - w - 1), y = 128 - h;
            g.fillStyle = '#2a1c2e'; g.fillRect(x - 1, y - 1, w + 2, h + 2);
            g.fillStyle = '#fffaf0'; g.fillRect(x, y, w, h);
            g.fillStyle = '#2a1c2e'; g.fillRect(sx + 12, y + h + 1, 3, 1); g.fillRect(sx + 12, y + h + 2, 2, 1); g.fillRect(sx + 12, y + h + 3, 1, 1);
            g.fillStyle = '#fffaf0'; g.fillRect(sx + 13, y + h, 2, 1); g.fillRect(sx + 13, y + h + 1, 1, 1);
            L.forEach((s, i) => pxText(g, s, x + 3, y + 3 + i * 7, '#2a1c2e'));
        }
    },
};
ARCADE_GAMES.sushi = {
    name: 'Sushi Swap', fee: PLAY_FEE, tune: 'sushi', glow: '#ff8a6a',
    help: 'Arrows move \u00b7 Space swaps \u00b7 C raises \u00b7 or tap and drag sushi',
    how: "Maki's conveyor belt brings sushi up from the bottom, right on schedule. Swap the pair in the cursor to line up three of a kind in a row or column. Sushi that drops into a new match makes a chain, and four or more at once is a combo: both score big and stop the belt for a moment. Hold RAISE to bring more up yourself, but if the stack hits the top, you're stuffed.",
    buttons: [
        { k: 'left', label: '\u25c0', keys: MOVE_KEYS.left, side: 'L', aria: 'Cursor left' },
        { k: 'up', label: '\u25b2', keys: ['ArrowUp', 'KeyW'], side: 'L', aria: 'Cursor up' },
        { k: 'down', label: '\u25bc', keys: MOVE_KEYS.down, side: 'L', aria: 'Cursor down' },
        { k: 'right', label: '\u25b6', keys: MOVE_KEYS.right, side: 'L', aria: 'Cursor right' },
        { k: 'raise', label: 'RAISE', keys: ['KeyC', 'ShiftLeft', 'ShiftRight', 'KeyR', 'KeyZ'], side: 'R', aria: 'Raise the belt', small: true },
        { k: 'swap', label: 'SWAP', keys: ['Space', 'Enter', 'KeyX', 'KeyJ', 'KeyK', 'KeyE'], side: 'R', aria: 'Swap', wide: true },
    ],
    create() { return new SushiGame(); },
    tickets(g) { return g.score > 0 ? Math.max(1, Math.floor(g.score / 150) + (g.bestChain - 1) * 2) : 0; },
    result(g) {
        const best = arc().best.sushi || 0;
        return { title: g.score >= best && g.score > 0 ? 'New best!' : 'Stuffed!', lines: [`${fmtNum(g.score)} points \u00b7 ${fmtNum(g.cleared)} sushi cleared \u00b7 speed ${g.level}`,
            `Best: ${fmtNum(Math.max(best, g.score))} \u00b7 longest chain x${g.bestChain} \u00b7 biggest combo ${g.bestCombo || '-'}`] };
    },
};

/* its tune (a koto-ish pentatonic shuffle), its high score board and its place in Sarah's music app */
TUNES.sushi = { bpm: 138, root: 64, scale: 'major', lead: 'pluck', chords: [1, 6, 4, 5, 1, 6, 2, 5, 4, 5, 3, 6, 2, 5, 1, 1], form: 'ABCDABCEFGFHABCE', vary: true,
    mel: { A: '3 5 6 . 5 3 2 .', B: '1 2 3 . 2 1 6v .', C: '3 5 6 ^1 6 5 3 5', D: '2 . 3 . 1 . . .', E: '1 . . . 6v . 1 .', F: '6 . 5 6 ^1 . 6 .', G: '5 3 2 3 5 . . .', H: '6 5 3 5 6 . ^1 .' },
    leadVol: 0.14, bass: 'x.o.x.o.', arp: '.x.x.x.x', arpInstr: 'kalimba', arpVol: 0.035, drums: { kick: 'x...x...', snare: '....x...', shaker: 'oxoxoxox' }, drumVol: 0.22 };
FIXED_TUNES.push('sushi');
HISCORE_RIVALS.sushi = [['MAKI', 7000, 'every swap exactly on time'], ['WONTON', 3600, 'swapped with his eyes shut'], ['FORTUNE', 1800, 'said she saw the chain coming']];
ARC_TARGET.sushi = [800, 1800, 3500];
TRACK_NAMES.sushi = 'Sushi Swap';
