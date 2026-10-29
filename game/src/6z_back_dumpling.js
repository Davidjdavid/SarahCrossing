/* ---- 6z_back_dumpling.js ---- */
/* Dumpling Drop: Wonton's cabinet in the arcade (in the back room until David's swap), a falling-pairs puzzle like the old classic. Pairs of
   dumplings drop into the steamer and turn around the one that blinks. Four or more of a colour touching are done and
   pop; what's left falls, and if that pops more it's a chain (chains score big). Chili keeps turning up the heat:
   burnt dumplings pile up in the tray over the steamer, pops cool them off (chains cool lots), the rest rain in after a
   pair that pops nothing, and a burnt one only clears when a pop happens right next to it. */

const DUMP_COLS = 6, DUMP_ROWS = 13;                     // row 0 is hidden above the steamer: dumplings up there can't pop
const DUMP_C = 11, DUMP_X = 6, DUMP_Y = 16;              // a cell, in screen pixels; where visible row 1 starts
const DUMP_W = DUMP_COLS * DUMP_C, DUMP_H = (DUMP_ROWS - 1) * DUMP_C;
const DUMP_MID = 2;                                      // pairs come in down this column; fill its top and it's over
const DUMP_OFF = [[0, -1], [1, 0], [0, 1], [-1, 0]];     // where the second dumpling sits, turn by turn (up, right, down, left)
const DUMP_SPEED = [36, 31, 27, 23, 20, 17, 15, 13, 11, 9, 8, 7, 6, 5, 4];      // frames per row, by level
const DUMP_LEVEL_PAIRS = 16, DUMP_RAIN = 6, DUMP_LOCK = 30;
/* the classic's scoring: 10 x dumplings popped x (chain power + colour bonus + group bonus) */
const DUMP_CHAIN_POW = [0, 8, 16, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448, 480, 512];
const DUMP_COLOR_BONUS = [0, 3, 6, 12];
const DUMP_GROUP_BONUS = [0, 0, 0, 0, 0, 2, 3, 4, 5, 6, 7, 10];
const DUMP_LOOK = [
    { base: '#ff74a0', hi: '#ffc8da', sh: '#e2507f', lo: '#9c2656', ink: '#4a0c26' },      // beet
    { base: '#7ccf52', hi: '#d0f4aa', sh: '#5aae3a', lo: '#2c742c', ink: '#163c12' },      // spinach
    { base: '#ffcf3a', hi: '#fff4b0', sh: '#eaa922', lo: '#a2700c', ink: '#4a3006' },      // golden
    { base: '#62a2ff', hi: '#c6e0ff', sh: '#4282ea', lo: '#284ca2', ink: '#0e2456' },      // butterfly pea
];
const DUMP_BURNT = { base: '#5e4334', hi: '#8a6650', sh: '#49322a', lo: '#22140e', ink: '#ffb060' };
const DUMP_FLASH = { base: '#fff8ee', hi: '#ffffff', sh: '#ffe6d2', lo: '#ffd0b8', ink: '#ffffff' };
/* what Wonton shouts for each chain */
const DUMP_WORDS = ['', '', 'STEAMY!', 'PLEATED!', 'FLUFFY!', 'DUMPLINGS!', 'NOT SOUP!', 'BAO-YOEEN!'];
/* a dumpling's shape, row by row (outline, then dough) */
const DUMP_OUT = [[3, 7], [2, 8], [1, 9], [0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [1, 9], [2, 8]];
const DUMP_IN = [null, [3, 7], [2, 8], [1, 9], [1, 9], [1, 9], [1, 9], [1, 9], [1, 9], [2, 8], null];

/* one dumpling at (x, y), drawn in three passes (outline, dough, face) so the ones of a colour that touch read as one
   squishy blob. link: 1 up, 2 right, 4 down, 8 left; sq squashes it a little (it just landed) */
function dumpDraw(g, pass, x, y, L, face, link, sq, blink, glow) {
    if (link) sq = 0;
    const T = sq ? r => (r < 5 ? r + sq : Math.max(r, 4 + sq)) : r => r;
    const px = (cx, cy, w, col) => { g.fillStyle = col; g.fillRect(x + cx, y + T(cy), w, 1); };
    if (pass === 0) {
        g.fillStyle = glow || L.lo;
        for (let r = 0; r < 11; r++) { const s = DUMP_OUT[r]; g.fillRect(x + s[0], y + T(r), s[1] - s[0] + 1, 1); }
        if (link & 1) g.fillRect(x + 2, y, 7, 6);
        if (link & 2) g.fillRect(x + 5, y + 2, 6, 7);
        if (link & 4) g.fillRect(x + 2, y + 5, 7, 6);
        if (link & 8) g.fillRect(x, y + 2, 6, 7);
        return;
    }
    if (pass === 1) {
        g.fillStyle = L.base;
        for (let r = 1; r < 10; r++) { const s = DUMP_IN[r]; g.fillRect(x + s[0], y + T(r), s[1] - s[0] + 1, 1); }
        if (link & 1) g.fillRect(x + 3, y, 5, 6);
        if (link & 2) g.fillRect(x + 5, y + 3, 6, 5);
        if (link & 4) g.fillRect(x + 3, y + 5, 5, 6);
        if (link & 8) g.fillRect(x, y + 3, 6, 5);
        if (!(link & 4)) { px(1, 8, 9, L.sh); px(2, 9, 7, L.sh); }
        return;
    }
    if (face == null) return;
    // the pinched pleats on top (gone where it's joined to the one above), a shine and a face
    if (!(link & 1)) { px(5, 1, 1, L.hi); px(4, 2, 1, L.sh); px(6, 2, 1, L.sh); px(5, 0, 1, L.sh); }
    px(2, 3, 1, L.hi); px(3, 2, 1, L.hi);
    if (face < 0) {                         // burnt: cross, sooty, glowing a little
        px(2, 4, 1, L.lo); px(3, 5, 1, L.lo); px(8, 4, 1, L.lo); px(7, 5, 1, L.lo);
        px(2, 6, 2, L.ink); px(7, 6, 2, L.ink);
        px(4, 8, 1, L.lo); px(5, 7, 1, L.lo); px(6, 8, 1, L.lo);
        px(8, 3, 1, L.sh); px(1, 7, 1, L.sh); px(6, 3, 1, L.lo);
        return;
    }
    px(1, 7, 1, '#ff9ab8'); px(9, 7, 1, '#ff9ab8');
    if (blink) { px(2, 6, 2, L.ink); px(7, 6, 2, L.ink); }
    else if (face === 0) { px(2, 5, 2, L.ink); px(2, 6, 2, L.ink); px(7, 5, 2, L.ink); px(7, 6, 2, L.ink); px(2, 5, 1, '#ffffff'); px(7, 5, 1, '#ffffff'); }
    else if (face === 1) { px(2, 6, 1, L.ink); px(3, 5, 1, L.ink); px(4, 6, 1, L.ink); px(6, 6, 1, L.ink); px(7, 5, 1, L.ink); px(8, 6, 1, L.ink); }
    else if (face === 2) { px(2, 4, 2, '#ffffff'); px(2, 5, 2, '#ffffff'); px(2, 6, 2, '#ffffff'); px(7, 4, 2, '#ffffff'); px(7, 5, 2, '#ffffff'); px(7, 6, 2, '#ffffff'); px(3, 5, 1, L.ink); px(3, 6, 1, L.ink); px(7, 5, 1, L.ink); px(7, 6, 1, L.ink); }
    else { px(2, 6, 2, L.ink); px(7, 6, 2, L.ink); px(2, 5, 2, L.sh); px(7, 5, 2, L.sh); }
    if (face === 0) { px(4, 7, 1, L.ink); px(6, 7, 1, L.ink); px(5, 8, 1, L.ink); }
    else if (face === 1) { px(5, 7, 1, L.ink); px(5, 8, 1, '#ff6a8a'); }
    else if (face === 2) { px(4, 8, 3, L.ink); }
    else px(5, 8, 1, L.ink);
}
/* a whole dumpling (all three passes), for the next-pair box */
function dumpOne(g, x, y, c) { for (let p = 0; p < 3; p++) dumpDraw(g, p, x, y, DUMP_LOOK[c], c, 0, 0, false); }

function DumplingGame() {
    this.grid = [];
    for (let y = 0; y < DUMP_ROWS; y++) this.grid.push(new Array(DUMP_COLS).fill(null));
    this.t = 0; this.score = 0; this.over = false; this.level = 1; this.pairs = 0;
    this.chain = 0; this.bestChain = 0; this.popped = 0; this.groups = 0; this.burnt = 0; this.allClears = 0;
    this.pending = 0; this.rained = 0; this.hot = false; this.shock = 0;
    this.pops = []; this.bits = []; this.puffs = []; this.quake = 0; this.banner = null; this.word = null; this.calc = null; this.happy = 0;
    this.phase = 'fall'; this.p = null; this.das = 0; this.qt = 0; this.sink = false; this.drag = null; this.acc = 0;
    this.queue = [this.pair(3), this.pair(3)];         // the first two pairs keep to three colours, like the classic
    this.spawn();
}
DumplingGame.prototype = {
    pair(n) { return [Math.floor(R() * n), Math.floor(R() * n)]; },
    speed() { return 1 / DUMP_SPEED[Math.min(DUMP_SPEED.length - 1, this.level - 1)]; },
    /* how many burnt dumplings each pair adds to the tray */
    heat() { return Math.min(2, 0.35 + 0.1 * (this.level - 1)); },
    cell(x, y) { return x >= 0 && x < DUMP_COLS && y >= 0 && y < DUMP_ROWS ? this.grid[y][x] : null; },
    /* is this spot free for a falling dumpling? (y can be between rows: then both rows must be free) */
    free(x, y) {
        if (x < 0 || x >= DUMP_COLS || y < -2) return false;
        const r0 = Math.floor(y), r1 = Math.ceil(y);
        if (r1 >= DUMP_ROWS) return false;
        return !(r0 >= 0 && this.grid[r0][x]) && !(r1 >= 0 && this.grid[r1][x]);
    },
    fits(x, y, rot) { const [dx, dy] = DUMP_OFF[rot]; return this.free(x, y) && this.free(x + dx, y + dy); },
    spawn() {
        const [a, b] = this.queue.shift();
        this.queue.push(this.pair(4));
        this.p = { x: DUMP_MID, y: 1, rot: 0, a, b };
        this.phase = 'fall'; this.lockT = 0; this.resets = 0; this.qt = 0; this.sink = false; this.acc = 0;
        // a row's worth in the tray: it rains in after this pair, unless this pair pops something
        const hot = this.pending >= DUMP_RAIN;
        if (hot && !this.hot) { Sfx.play('sizzle'); this.pops.push({ text: 'GETTING HOT!', x: DUMP_X + DUMP_W / 2, y: DUMP_Y + 8, t: -2, col: '#ff9a6a' }); }
        this.hot = hot;
        if (this.drag) this.drag.dead = true;              // a finger still down from the last pair doesn't steer this one
    },
    update(inp) {
        this.t++;
        this.touch(inp);
        if (this.phase === 'fall') this.control(inp);
        else if (this.phase === 'drop') { if (!this.settle()) { if (this.onLand === 'check') this.check(); else this.afterRain(); } }
        else if (this.phase === 'pop') { if (++this.popT >= 26) this.clearPopped(); }
        else if (this.phase === 'dead') this.dying();
        this.fx();
    },
    idle() { this.t++; this.fx(); },
    after() { this.t++; if (this.phase === 'dead') this.dying(); this.fx(); },

    /* ------------------------------------------------ the falling pair */
    control(inp) {
        const H = inp.held, P = inp.pressed, p = this.p;
        if (this.qt) this.qt--;
        const dir = (H.right ? 1 : 0) - (H.left ? 1 : 0);
        if (P.left) { this.move(-1); this.das = 0; }
        else if (P.right) { this.move(1); this.das = 0; }
        else if (dir) { if (++this.das >= 9 && (this.das - 9) % 2 === 0) this.move(dir); }
        else this.das = 0;
        if (P.cw) this.rotate(1);
        if (P.ccw) this.rotate(-1);
        // fall in eighths of a row (exact, so the pair never snags on a row it isn't in)
        const soft = H.down || this.sink || (this.drag && this.drag.soft);
        this.acc += soft ? Math.max(0.5, this.speed()) : this.speed();
        let landed = false;
        while (this.acc >= 0.125) {
            this.acc -= 0.125;
            if (!this.fits(p.x, p.y + 0.125, p.rot)) { landed = true; this.acc = 0; break; }
            p.y += 0.125;
            if (soft && Number.isInteger(p.y)) this.score++;
        }
        if (!landed) landed = !this.fits(p.x, p.y + 0.125, p.rot);
        if (!landed) { this.lockT = 0; return; }
        // touching down: a soft drop sets it right away, otherwise there's a moment to slide it
        if (soft || ++this.lockT >= DUMP_LOCK) this.lock();
    },
    nudge() { const p = this.p; if (!this.fits(p.x, p.y + 0.125, p.rot)) { if (this.resets < 12) { this.lockT = 0; this.resets++; } } else this.lockT = 0; },
    move(d) {
        const p = this.p;
        if (!p || !this.fits(p.x + d, p.y, p.rot)) return false;
        p.x += d; Sfx.play('blip'); this.nudge();
        return true;
    },
    /* turn around the pivot, kicking off walls and the floor; in a one-wide gap, two quick turns flip it over */
    rotate(d) {
        const p = this.p;
        if (!p) return;
        const r = (p.rot + d + 4) % 4, [dx, dy] = DUMP_OFF[r];
        let x = p.x, y = p.y, ok = this.fits(x, y, r), rot = r;
        if (!ok && dx) { if (this.fits(x - dx, y, r)) { x -= dx; ok = true; } }
        if (!ok && dy > 0) { const ny = Math.ceil(y) - 1; if (this.fits(x, ny, r)) { y = ny; ok = true; } }
        if (!ok && dx) {
            if (this.qt) {
                rot = (p.rot + 2) % 4;
                if (this.fits(x, y, rot)) ok = true;
                else if (DUMP_OFF[rot][1] > 0 && this.fits(x, Math.ceil(y) - 1, rot)) { y = Math.ceil(y) - 1; ok = true; }
                this.qt = 0;
            } else { this.qt = 20; Sfx.play('nibble'); return; }
        }
        if (!ok) return;
        p.x = x; p.y = y; p.rot = rot;
        Sfx.play('rot'); this.nudge();
    },
    /* the phone: drag sideways to steer, drag down to drop faster, flick down to drop, tap to turn */
    touch(inp) {
        const pt = inp.pointer;
        if (inp.pressed.screen) this.drag = { x0: pt.x, y0: pt.y, col0: this.p ? this.p.x : DUMP_MID, t: 0, moved: false, soft: false, dead: false };
        const d = this.drag;
        if (!d) return;
        d.t++;
        const dx = pt.x - d.x0, dy = pt.y - d.y0;
        if (pt.down) {
            if (Math.abs(dx) > 5 || Math.abs(dy) > 6) d.moved = true;
            if (d.dead || this.phase !== 'fall' || !this.p) return;
            const want = clamp(d.col0 + Math.round(dx / 9), 0, DUMP_COLS - 1);
            if (want !== this.p.x) this.move(Math.sign(want - this.p.x));
            d.soft = dy > 10 && dy > Math.abs(dx);
            return;
        }
        this.drag = null;
        if (d.dead || this.phase !== 'fall' || !this.p) return;
        if (!d.moved && d.t < 20) this.rotate(pt.x < DUMP_X + DUMP_W / 2 ? -1 : 1);
        else if (d.t < 14 && dy > 12 && dy > Math.abs(dx) * 1.5) this.sink = true;
    },
    lock() {
        const p = this.p, [dx, dy] = DUMP_OFF[p.rot];
        this.p = null;
        for (const [x, y, c] of [[p.x, p.y, p.a], [p.x + dx, p.y + dy, p.b]]) if (y >= 0) this.grid[y][x] = { c, sq: 6 };
        Sfx.play('squish');
        this.pairs++;
        this.pending = Math.min(72, this.pending + this.heat());
        if (this.pairs % DUMP_LEVEL_PAIRS === 0) {
            this.level++;
            this.banner = { text: 'LEVEL ' + this.level, t: 70, col: '#8cf0ff' };
            Sfx.play('levelup');
        }
        this.chain = 0;
        this.fall('check');
    },

    /* ------------------------------------------------ gravity, pops and chains */
    /* everything with a gap under it falls (animated: each moving dumpling keeps a fractional row, fy) */
    fall(then) {
        for (let x = 0; x < DUMP_COLS; x++) {
            let to = DUMP_ROWS - 1;
            for (let y = DUMP_ROWS - 1; y >= 0; y--) {
                const c = this.grid[y][x];
                if (!c) continue;
                if (y !== to) { this.grid[to][x] = c; this.grid[y][x] = null; c.fy = y; c.v = 0.1; }
                to--;
            }
        }
        this.phase = 'drop'; this.onLand = then;
    },
    settle() {
        let moving = false, thud = 0;
        for (let y = 0; y < DUMP_ROWS; y++) for (let x = 0; x < DUMP_COLS; x++) {
            const c = this.grid[y][x];
            if (!c || c.fy == null) continue;
            c.v = Math.min(0.75, c.v + 0.06); c.fy += c.v;
            if (c.fy >= y) { c.fy = null; c.sq = 6; thud = c.c < 0 ? 2 : Math.max(thud, 1); } else moving = true;
        }
        if (thud) Sfx.play(thud === 2 ? 'land' : 'squish');
        return moving;
    },
    groupsNow() {
        const seen = new Set(), out = [];
        for (let y = 1; y < DUMP_ROWS; y++) for (let x = 0; x < DUMP_COLS; x++) {
            const c = this.grid[y][x];
            if (!c || c.c < 0 || seen.has(c)) continue;
            const grp = [], todo = [[x, y]];
            seen.add(c);
            while (todo.length) {
                const [cx, cy] = todo.pop();
                grp.push([cx, cy]);
                for (const [ox, oy] of DUMP_OFF) {
                    const nx = cx + ox, ny = cy + oy, o = ny >= 1 && this.cell(nx, ny);
                    if (o && o.c === c.c && !seen.has(o)) { seen.add(o); todo.push([nx, ny]); }
                }
            }
            if (grp.length >= 4) out.push(grp);
        }
        return out;
    },
    check() {
        const groups = this.groupsNow();
        if (!groups.length) return this.endChain();
        this.chain++;
        this.bestChain = Math.max(this.bestChain, this.chain);
        let n = 0, sx = 0, sy = 0, gb = 0, burnt = 0;
        const colors = new Set();
        for (const grp of groups) {
            gb += DUMP_GROUP_BONUS[Math.min(11, grp.length)];
            colors.add(this.grid[grp[0][1]][grp[0][0]].c);
            for (const [x, y] of grp) {
                this.grid[y][x].pop = true; n++; sx += x; sy += y;
                // burnt dumplings right next to a pop crumble away with it
                for (const [ox, oy] of DUMP_OFF) { const o = y + oy >= 1 && this.cell(x + ox, y + oy); if (o && o.c < 0 && !o.pop) { o.pop = true; burnt++; } }
            }
        }
        const mult = clamp(DUMP_CHAIN_POW[Math.min(DUMP_CHAIN_POW.length - 1, this.chain - 1)] + DUMP_COLOR_BONUS[colors.size - 1] + gb, 1, 999);
        const pts = 10 * n * mult;
        this.score += pts; this.popped += n; this.groups += groups.length; this.burnt += burnt;
        this.calc = { text: `${10 * n} X ${mult}`, t: 70 };
        // a pop cools the burnt dumplings waiting in the tray (the classic's 70 points a piece: chains cool LOTS)
        const had = this.pending;
        this.pending = Math.max(0, this.pending - pts / 70);
        const cooled = Math.floor(had) - Math.floor(this.pending);
        const cx = DUMP_X + (sx / n + 0.5) * DUMP_C, cy = DUMP_Y + (sy / n - 0.5) * DUMP_C;
        if (this.chain < 2) this.pops.push({ text: '+' + fmtNum(pts), x: cx, y: cy + 4, t: 0, col: '#ffffff' });
        if (cooled > 0) this.pops.push({ text: 'COOLED ' + cooled, x: DUMP_X + DUMP_W / 2, y: DUMP_Y + 8, t: -4, col: '#8cf0ff' });
        if (this.chain >= 2) {
            this.word = { n: this.chain, x: clamp(cx, DUMP_X + 18, DUMP_X + DUMP_W - 18), y: clamp(cy - 10, DUMP_Y + 8, DUMP_Y + DUMP_H - 30), t: 0 };
            this.happy = 50;
        }
        if (this.chain >= 3) this.quake = Math.min(18, 4 + this.chain * 2);
        Sfx.play(['pick', 'item', 'line', 'gold', 'bento'][this.chain - 1] || 'fanfare');
        if (burnt) Sfx.play('crack');
        this.phase = 'pop'; this.popT = 0;
    },
    clearPopped() {
        for (let y = 0; y < DUMP_ROWS; y++) for (let x = 0; x < DUMP_COLS; x++) {
            const c = this.grid[y][x];
            if (!c || !c.pop) continue;
            const px = DUMP_X + x * DUMP_C + 5, py = DUMP_Y + (y - 1) * DUMP_C + 5, L = c.c < 0 ? DUMP_BURNT : DUMP_LOOK[c.c];
            for (let i = 0; i < 5; i++) this.bits.push({ x: px, y: py, vx: (R() - 0.5) * 2.6, vy: -R() * 2.2 - 0.4, t: 0, col: i % 2 ? L.base : L.hi });
            this.puffs.push({ x: px - 1, y: py, t: 0, s: 2 + R() * 2 });
            this.grid[y][x] = null;
        }
        Sfx.play('bubble');
        this.fall('check');
    },
    endChain() {
        if (this.chain) {
            if (this.grid.every(row => row.every(c => !c))) {
                this.allClears++; this.score += 2100; this.pending = 0;
                this.banner = { text: 'ALL CLEAR!', sub: '+2,100', t: 90, col: '#ffd84a' };
                this.happy = 90;
                Sfx.play('party');
            }
        } else if (this.hot && this.pending >= DUMP_RAIN) return this.rain();
        this.next();
    },
    /* the burnt ones rain in: whole rows first, then the rest in random columns */
    rain() {
        const n = Math.min(30, Math.floor(this.pending));
        this.pending -= n; this.rained += n;
        const per = new Array(DUMP_COLS).fill(Math.floor(n / DUMP_COLS));
        for (const x of shuffled([0, 1, 2, 3, 4, 5]).slice(0, n % DUMP_COLS)) per[x]++;
        for (let x = 0; x < DUMP_COLS; x++) {
            let y = DUMP_ROWS - 1;
            while (y >= 0 && this.grid[y][x]) y--;
            for (let k = 0; k < per[x] && y >= 0; k++, y--) this.grid[y][x] = { c: -1, fy: -1.5 - k * 1.2 - R() * 0.6, v: 0.15, sq: 0 };
        }
        Sfx.play('ouch');
        this.pops.push({ text: rpick(['TOO HOT!', 'BURNT!', 'CHILI!!', 'OOPS, CRISPY']), x: DUMP_X + DUMP_W / 2, y: 40, t: 0, col: '#ff9a6a' });
        this.phase = 'drop'; this.onLand = 'rain';
    },
    afterRain() { this.quake = 8; this.shock = 30; Sfx.play('drop'); this.next(); },
    next() {
        if (this.grid[1][DUMP_MID]) return this.die();
        this.spawn();
    },
    die() {
        this.phase = 'dead'; this.deadT = 0; this.p = null;
        for (let y = 0; y < DUMP_ROWS; y++) for (let x = 0; x < DUMP_COLS; x++) {
            const c = this.grid[y][x];
            if (c) { c.fy = null; c.pop = false; c.dy = 0; c.dv = 0; c.wait = Math.abs(x - DUMP_MID) * 3 + (DUMP_ROWS - y) + Math.floor(R() * 4); }
        }
        this.quake = 12;
        Sfx.play('trip');
    },
    /* the steamer tips its dumplings out, then the cabinet says game over */
    dying() {
        this.deadT++;
        for (const row of this.grid) for (const c of row) if (c && this.deadT > c.wait) { c.dv += 0.2; c.dy += c.dv; }
        if (this.deadT === 100) this.over = true;
    },
    fx() {
        this.pops = this.pops.filter(q => ++q.t < 30);
        for (const b of this.bits) { b.x += b.vx; b.y += b.vy; b.vy += 0.13; b.t++; }
        this.bits = this.bits.filter(b => b.t < 28);
        for (const s of this.puffs) { s.t++; s.y -= 0.35; s.x += Math.sin((s.t + s.s * 9) / 5) * 0.2; }
        this.puffs = this.puffs.filter(s => s.t < 40);
        // a little steam always rises through the basket (more as the heat builds)
        if (this.t % Math.max(3, 9 - Math.floor(this.pending)) === 0 && this.puffs.length < 40) this.puffs.push({ x: DUMP_X + 2 + R() * (DUMP_W - 4), y: DUMP_Y + DUMP_H - 2, t: 0, s: 1, amb: true });
        for (const row of this.grid) for (const c of row) if (c && c.sq) c.sq--;
        if (this.quake) this.quake--;
        if (this.happy) this.happy--;
        if (this.shock) this.shock--;
        if (this.banner && --this.banner.t <= 0) this.banner = null;
        if (this.word && ++this.word.t > 50) this.word = null;
        if (this.calc && --this.calc.t <= 0) this.calc = null;
    },

    /* ------------------------------------------------ drawing */
    linkOf(x, y) {
        const c = this.grid[y][x];
        if (!c || c.c < 0 || c.fy != null || y < 1 || this.phase === 'dead') return 0;
        const same = (xx, yy) => { const o = yy >= 1 && this.cell(xx, yy); return !!o && o.c === c.c && o.fy == null; };
        return (same(x, y - 1) ? 1 : 0) | (same(x + 1, y) ? 2 : 0) | (same(x, y + 1) ? 4 : 0) | (same(x - 1, y) ? 8 : 0);
    },
    drawCells(g, t) {
        const list = [];
        for (let y = 0; y < DUMP_ROWS; y++) for (let x = 0; x < DUMP_COLS; x++) {
            const c = this.grid[y][x];
            if (!c) continue;
            const ry = c.fy != null ? c.fy : y;
            const sx = DUMP_X + x * DUMP_C, sy = Math.round(DUMP_Y + (ry - 1) * DUMP_C + (c.dy || 0));
            if (sy < DUMP_Y - DUMP_C || sy > ARCADE_H) continue;
            let L = c.c < 0 ? DUMP_BURNT : DUMP_LOOK[c.c], face = c.c;
            if (c.pop) {
                const k = this.popT;
                if (k >= 16 || Math.floor(k / 3) % 2 === 0) { L = DUMP_FLASH; face = null; }
            }
            const sq = c.sq > 3 ? 2 : c.sq > 0 ? 1 : 0;
            const blink = (t + x * 41 + y * 67) % 200 < 7;
            list.push([sx, sy, L, face, this.linkOf(x, y), sq, blink, c.pop && this.popT >= 16 ? 1 - (this.popT - 16) / 10 : 1]);
        }
        for (let pass = 0; pass < 3; pass++) for (const [sx, sy, L, face, link, sq, blink, a] of list) {
            if (a < 1) g.globalAlpha = Math.max(0, a);
            dumpDraw(g, pass, sx, sy, L, face, link, sq, blink);
            g.globalAlpha = 1;
        }
    },
    /* where each half of the pair would land (little dots, a help on a small screen) */
    ghost() {
        const p = this.p, [dx, dy] = DUMP_OFF[p.rot];
        const top = x => { let y = DUMP_ROWS - 1; while (y >= 0 && this.grid[y][x]) y--; return y; };
        if (dx) return [[p.x, top(p.x), p.a], [p.x + dx, top(p.x + dx), p.b]];
        const y0 = top(p.x);
        return dy < 0 ? [[p.x, y0, p.a], [p.x, y0 - 1, p.b]] : [[p.x, y0 - 1, p.a], [p.x, y0, p.b]];
    },
    drawPair(g, t, dots) {
        const p = this.p;
        if (!p) return;
        if (dots) for (const [x, y, c] of this.ghost()) {
            if (y < 1) continue;
            const L = DUMP_LOOK[c], gx = DUMP_X + x * DUMP_C, gy = DUMP_Y + (y - 1) * DUMP_C;
            g.fillStyle = L.lo; g.fillRect(gx + 3, gy + 4, 5, 4);
            g.fillStyle = L.base; g.fillRect(gx + 4, gy + 5, 3, 2);
        }
        const [dx, dy] = DUMP_OFF[p.rot];
        const cells = [[p.x, p.y, p.a, true], [p.x + dx, p.y + dy, p.b, false]];
        const glow = Math.floor(t / 12) % 2 ? '#ffffff' : null;
        for (let pass = 0; pass < 3; pass++) for (const [x, y, c, pivot] of cells) {
            dumpDraw(g, pass, DUMP_X + x * DUMP_C, Math.round(DUMP_Y + (y - 1) * DUMP_C), DUMP_LOOK[c], c, 0, 0, false, pivot ? glow : null);
        }
    },
    drawTray(g, t) {
        const n = Math.floor(this.pending), hot = n >= DUMP_RAIN;
        g.fillStyle = '#8a5a2b'; g.fillRect(DUMP_X - 3, 1, DUMP_W + 6, 12);
        g.fillStyle = hot && Math.floor(t / 8) % 2 ? '#6a2020' : '#2a1820'; g.fillRect(DUMP_X - 1, 2, DUMP_W + 2, 10);
        // Chili's at the stove (he wiggles when it's about to rain); the burnt ones queue up beside him
        const wig = hot ? (Math.floor(t / 4) % 2) : 0, chx = DUMP_X + 3 + wig;
        g.fillStyle = '#3f8a3a'; g.fillRect(chx + 2, 3, 2, 2); g.fillRect(chx + 3, 2, 2, 1);
        g.fillStyle = '#e2382b'; g.fillRect(chx, 5, 5, 3); g.fillRect(chx + 1, 8, 3, 2); g.fillRect(chx + 2, 10, 1, 1);
        g.fillStyle = '#ff8a7a'; g.fillRect(chx + 1, 5, 1, 2);
        const icons = [];
        let k = n;
        while (k >= 30 && icons.length < 5) { icons.push(30); k -= 30; }
        while (k >= 6 && icons.length < 5) { icons.push(6); k -= 6; }
        while (k >= 1 && icons.length < 5) { icons.push(1); k--; }
        const B = DUMP_BURNT;
        icons.forEach((v, i) => {
            const cx = DUMP_X + 16 + i * 11;
            if (v === 1) { g.fillStyle = B.lo; g.fillRect(cx - 2, 6, 5, 4); g.fillStyle = B.base; g.fillRect(cx - 1, 7, 3, 2); }
            else if (v === 6) {
                g.fillStyle = B.lo; g.fillRect(cx - 3, 3, 7, 8); g.fillRect(cx - 4, 4, 9, 6);
                g.fillStyle = B.base; g.fillRect(cx - 3, 4, 7, 6);
                g.fillStyle = B.ink; g.fillRect(cx - 2, 6, 1, 1); g.fillRect(cx + 2, 6, 1, 1);
            } else {
                g.fillStyle = '#ff7a3a'; g.fillRect(cx - 2, 2 + (Math.floor(t / 5) % 2), 5, 2);
                g.fillStyle = '#ffd84a'; g.fillRect(cx - 1, 3, 3, 1);
                g.fillStyle = '#140a08'; g.fillRect(cx - 4, 4, 9, 7);
                g.fillStyle = '#3a2418'; g.fillRect(cx - 3, 5, 7, 5);
                g.fillStyle = '#ff7a3a'; g.fillRect(cx - 2, 7, 1, 1); g.fillRect(cx + 2, 7, 1, 1);
            }
        });
    },
    drawSteamer(g, t) {
        // a bamboo steamer, seen from the side
        g.fillStyle = '#8a5a2b'; g.fillRect(DUMP_X - 3, DUMP_Y - 3, DUMP_W + 6, DUMP_H + 6);
        g.fillStyle = '#d9a95a'; g.fillRect(DUMP_X - 2, DUMP_Y - 2, DUMP_W + 4, DUMP_H + 4);
        g.fillStyle = '#b8843e';
        for (let y = DUMP_Y + 20; y < DUMP_Y + DUMP_H; y += 33) { g.fillRect(DUMP_X - 2, y, 2, 3); g.fillRect(DUMP_X + DUMP_W, y, 2, 3); }
        g.fillStyle = '#2b1a24'; g.fillRect(DUMP_X, DUMP_Y, DUMP_W, DUMP_H);
        g.fillStyle = '#33202c';
        for (let x = 1; x < DUMP_COLS; x++) g.fillRect(DUMP_X + x * DUMP_C, DUMP_Y, 1, DUMP_H);
        g.fillStyle = '#3a2632'; g.fillRect(DUMP_X, DUMP_Y + DUMP_H - 2, DUMP_W, 2);
        // the X where the middle column fills up (it flashes once things get tall)
        const danger = this.grid[3][DUMP_MID] || this.grid[2][DUMP_MID];
        const xx = DUMP_X + DUMP_MID * DUMP_C + 2, xy = DUMP_Y + 2;
        g.fillStyle = danger && Math.floor(t / 6) % 2 ? '#ff4a5a' : '#5a2a3a';
        for (let i = 0; i < 7; i++) { g.fillRect(xx + i, xy + i, 1, 1); g.fillRect(xx + 6 - i, xy + i, 1, 1); }
    },
    draw(g, t, state) {
        g.fillStyle = '#1e1228'; g.fillRect(0, 0, ARCADE_W, ARCADE_H);
        const q = this.quake, qx = q ? Math.round((R() - 0.5) * Math.min(5, q / 2)) : 0, qy = q ? Math.round((R() - 0.5) * Math.min(3, q / 3)) : 0;
        g.save(); g.translate(qx, qy);
        this.drawTray(g, t);
        this.drawSteamer(g, t);
        g.save(); g.beginPath(); g.rect(DUMP_X, DUMP_Y, DUMP_W, DUMP_H); g.clip();
        for (const s of this.puffs) if (s.amb) { g.fillStyle = `rgba(255,240,230,${0.24 * (1 - s.t / 40)})`; g.fillRect(Math.round(s.x), Math.round(s.y), 1, 2); }
        this.drawCells(g, t);
        if (this.phase === 'fall') this.drawPair(g, t, state !== 'ready');
        for (const b of this.bits) { g.fillStyle = b.col; g.fillRect(Math.round(b.x), Math.round(b.y), 2, 2); }
        for (const s of this.puffs) if (!s.amb) { const r = Math.round(s.s + s.t / 10); g.fillStyle = `rgba(255,248,240,${0.55 * (1 - s.t / 40)})`; g.fillRect(Math.round(s.x) - r, Math.round(s.y) - r, r * 2, r * 2); }
        g.restore();
        popText(g, this.pops, 0, 0);
        if (this.word) {
            const w = this.word, a = w.t < 40 ? 1 : 1 - (w.t - 40) / 10, y = Math.round(w.y - w.t * 0.3);
            g.globalAlpha = Math.max(0, a);
            const nw = pxWidth(String(w.n), 2), tw = pxWidth('CHAIN!'), x0 = Math.round(w.x - (nw + 3 + tw) / 2);
            const col = ['#ffffff', '#ffffff', '#ffd84a', '#ffb04a', '#ff8a6a', '#ff6aa8', '#c88aff'][Math.min(6, w.n)];
            pxShadow(g, String(w.n), x0, y, col, 2);
            pxShadow(g, 'CHAIN!', x0 + nw + 3, y + 5, col);
            const word = DUMP_WORDS[Math.min(DUMP_WORDS.length - 1, w.n)];
            pxShadow(g, word, clamp(w.x, DUMP_X + pxWidth(word) / 2 + 1, DUMP_X + DUMP_W - pxWidth(word) / 2 - 1), y + 13, '#ffffff', 1, 'center');
            g.globalAlpha = 1;
        }
        if (this.banner) {
            const b = this.banner;
            g.fillStyle = 'rgba(18,12,34,0.7)'; g.fillRect(DUMP_X, 62, DUMP_W, b.sub ? 26 : 18);
            pxShadow(g, b.text, DUMP_X + DUMP_W / 2, 66, b.col, pxWidth(b.text, 2) <= DUMP_W - 4 ? 2 : 1, 'center');
            if (b.sub) pxShadow(g, b.sub, DUMP_X + DUMP_W / 2, 78, '#ffffff', 1, 'center');
        }
        if (this.phase === 'dead' && this.deadT > 20) pxShadow(g, 'STEAMER FULL!', DUMP_X + DUMP_W / 2, 66, '#ff9aa8', 1, 'center');
        if (state === 'ready') {
            const cx = DUMP_X + DUMP_W / 2;
            pxShadow(g, 'DUMPLING DROP', cx, 104, '#ff8aa8', 1, 'center');
            pxShadow(g, 'MATCH 4 TO POP', cx, 116, '#ffffff', 1, 'center');
            pxShadow(g, 'CHAIN FOR MORE!', cx, 124, '#ffd84a', 1, 'center');
        }
        g.restore();
        this.drawPanel(g, t);
    },
    drawPanel(g, t) {
        const sx = 80;
        pxText(g, 'NEXT', sx, 2, '#ffd84a');
        g.fillStyle = '#6b4ac9'; g.fillRect(sx - 1, 9, 36, 32);
        g.fillStyle = '#241638'; g.fillRect(sx, 10, 34, 30);
        const [n1, n2] = this.queue;
        dumpOne(g, sx + 4, 13, n1[1]); dumpOne(g, sx + 4, 24, n1[0]);
        g.globalAlpha = 0.55; dumpOne(g, sx + 20, 17, n2[1]); dumpOne(g, sx + 20, 28, n2[0]); g.globalAlpha = 1;
        sideLabel(g, sx, 45, 'SCORE', pxNum(this.score));
        if (this.calc) pxShadow(g, this.calc.text, sx, 62, '#8cf0ff');
        else pxShadow(g, 'BEST ' + pxNum(Math.max(this.score, arc().best.dumpling || 0)), sx, 62, '#ffd84a');
        sideLabel(g, sx, 72, 'BEST CHAIN', pxNum(this.bestChain), this.bestChain >= 3 ? '#ffd84a' : '#ffffff');
        sideLabel(g, sx, 90, 'LEVEL', pxNum(this.level));
        g.fillStyle = '#3b2a55'; g.fillRect(sx + 14, 99, 36, 3);
        g.fillStyle = '#8cf0ff'; g.fillRect(sx + 14, 99, Math.round(36 * (this.pairs % DUMP_LEVEL_PAIRS) / DUMP_LEVEL_PAIRS), 3);
        // Wonton cheers you on (and sweats when the steamer gets full)
        const sad = this.phase === 'dead' || this.over;
        const danger = !sad && (this.grid[3][DUMP_MID] || this.grid[2].some(c => c));
        const hop = this.happy ? Math.round(Math.abs(Math.sin(this.happy / 4)) * 6) : sad ? 0 : Math.floor(t / 20) % 2;
        const wx = 107 + (this.shock ? (Math.floor(t / 2) % 2 ? 1 : -1) : 0), wy = 148 - hop;
        g.save(); g.translate(wx, wy); g.scale(2, 2);
        spr(g, 'wonton_' + (sad ? 0 : Math.floor(t / (danger ? 8 : 30)) % 2), 0, 0, !sad && this.happy > 0 && Math.floor(this.happy / 10) % 2 === 1);
        g.restore();
        if (danger && Math.floor(t / 10) % 3) { g.fillStyle = '#8cd8ff'; g.fillRect(wx + 12, wy - 24, 2, 3); g.fillRect(wx + 13, wy - 25, 1, 1); }
        if (sad) { g.fillStyle = '#8cd8ff'; const k = Math.floor(t / 6) % 6; g.fillRect(wx - 6, wy - 12 + k, 1, 2); g.fillRect(wx + 5, wy - 12 + ((k + 3) % 6), 1, 2); }
        if (this.happy > 0 && this.word && this.word.n >= 2) {
            const word = DUMP_WORDS[Math.min(DUMP_WORDS.length - 1, this.word.n)], w = pxWidth(word) + 6;
            const bx = clamp(Math.round(wx - w / 2), sx - 2, ARCADE_W - w - 1);
            g.fillStyle = '#ffffff'; g.fillRect(bx, 106, w, 9); g.fillRect(wx - 1, 115, 3, 2);
            pxText(g, word, bx + 3, 108, '#3b2a45');
        } else if (sad) pxShadow(g, 'AWW...', wx, 108, '#ff9aa8', 1, 'center');
    },
};

ARCADE_GAMES.dumpling = {
    name: 'Dumpling Drop', fee: PLAY_FEE, tune: 'dumpling', glow: '#ff8aa8',
    help: '\u2190 \u2192 move \u00b7 \u2193 faster \u00b7 \u2191 or X turns \u00b7 Z turns back \u00b7 or drag, tap and flick the screen',
    how: "Match four or more touching dumplings of one color to pop them. A pop that drops pieces into another match makes a chain for extra points.\n\nBurnt dumplings gather in the tray. They fall after a move that clears nothing. Make matches to reduce them; chains reduce more. Burnt dumplings on the board clear when a match pops beside them.\n\nKeep the middle column open. If it's blocked at the top, the game ends.",
    buttons: [
        { k: 'left', label: '\u25c0', keys: MOVE_KEYS.left, side: 'L', aria: 'Move left' },
        { k: 'down', label: '\u25bc', keys: MOVE_KEYS.down, side: 'L', aria: 'Drop faster' },
        { k: 'right', label: '\u25b6', keys: MOVE_KEYS.right, side: 'L', aria: 'Move right' },
        { k: 'ccw', label: '\u27f2', keys: ['KeyZ', 'KeyQ', 'KeyJ'], side: 'R', aria: 'Turn left' },
        { k: 'cw', label: '\u27f3', keys: MOVE_KEYS.rot.concat(['Space', 'Enter']), side: 'R', aria: 'Turn right' },
    ],
    create() { return new DumplingGame(); },
    tickets(g) { return g.score > 0 ? Math.max(1, Math.floor(g.score / 400) + 2 * Math.max(0, g.bestChain - 1)) : 0; },
    result(g) {
        const best = arc().best.dumpling || 0;
        return { title: g.score >= best && g.score > 0 ? 'New best!' : g.quit ? 'Done steaming' : 'Steamer full!', lines: [`${fmtNum(g.score)} points \u00b7 best chain ${g.bestChain} \u00b7 level ${g.level}`,
            `Best: ${fmtNum(Math.max(best, g.score))} \u00b7 ${fmtNum(g.popped)} ${plural(g.popped, 'dumpling')} popped` + (g.burnt ? ` \u00b7 ${fmtNum(g.burnt)} burnt cleared` : '') + (g.allClears ? ` \u00b7 ${g.allClears} ${plural(g.allClears, 'all clear')}` : '')] };
    },
};

/* its music (a pentatonic little tune, steam-whistle bright), the high score board and the favors */
TUNES.dumpling = { bpm: 128, root: 62, scale: 'major', lead: 'pluck', chords: [1, 6, 4, 5, 1, 6, 2, 5, 4, 5, 3, 6, 2, 5, 1, 1], form: 'ABCDABCEFGFHABCE', vary: true,
    mel: { A: '5 . 6 5 3 . 2 .', B: '1 . 2 . 3 . . .', C: '5 . 6 ^1 6 . 5 3', D: '2 . 3 2 1 . . .', E: '1 . . . 5v . . .',
        F: '6 . ^1 . 6 5 3 .', G: '5 . 3 . 2 . . .', H: '3 . 5 . 6 . ^1 .' },
    leadVol: 0.14, bass: 'x.ox.xo.', arp: 'x.x.x.x.', arpInstr: 'kalimba', arpVol: 0.035, drums: { kick: 'x...x...', snare: '....x...', shaker: 'oxoxoxox' }, drumVol: 0.22 };
FIXED_TUNES.push('dumpling');
HISCORE_RIVALS.dumpling = [['CHILI', 11200, 'played through his lunch break'], ['WONTON', 9800, "it's his steamer"], ['MAKI', 8000, 'every pleat precisely folded'],
    ['MAC', 5600, 'got hungry halfway'], ['BASIL', 3700, 'steamed them slowly. patiently']];
ARC_TARGET.dumpling = [2000, 5000, 10000];
TRACK_NAMES.dumpling = 'Dumpling Drop';
