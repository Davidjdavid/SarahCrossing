/* ---- 6zv_versus.js ---- */
/* Two-player arcade games: your board and the other player's side by side in one cabinet. The other player is a
   neighbor (an opponent brain for each game, with the neighbor's own skill) or, later, a friend online. In the
   falling-block games a big clear sends junk to the other board (Bento Blocks: rows with a gap, Spice Capsules: loose
   capsule halves, first to clear every bug wins); the first board to fill up loses. The rest are races for the higher
   score. Each game says how through Versus.ADAPT: junk(g, n) puts junk on a board, hook(g, send) makes a board report
   what it sends, done(g) says a board has won outright, brain(g, skill) plays a board. */

/* how well each neighbor plays (0 a beginner, 1 a whiz), and what they say */
const VS_SKILL = { chili: 0.8, maki: 0.85, david: 0.7, kai: 0.4, cece: 0.3, coco: 0.5, cuke: 0.6, sully: 0.55, basil: 0.45, wonton: 0.35,
    clementine: 0.5, ginger: 0.65, brulee: 0.4, mac: 0.35, joe: 0.5, james: 0.6, john: 0.6, elizabeth: 0.55, floss: 0.5, waffle: 0.45 };
const VS_LINES = {
    start: ["Let's go! I'm not going easy on you.", 'Ready when you are. Are you ready? I am.', "Best of one. No take-backs."],
    win: ['Good game! I got lucky. Very lucky. Skillfully lucky.', 'I win! Rematch? I mean, if you want. No pressure.'],
    lose: ["You got me! That was a good one.", 'Ahh! So close. Next time, you are going DOWN. Nicely.'],
    chili: { start: ["You want to play ME? At MY arcade? This is going to be spicy."], win: ["Too hot to handle! Good game, though. Really."], lose: ["You beat me. At my own arcade. I need a minute. And some hot sauce."] },
    maki: { start: ['I will be precise. You should be too.'], win: ['Every piece where it belonged. Thank you for the game.'], lose: ['Hm. You placed well. I respect that. Precisely.'] },
    kai: { start: ["Duuude, vs mode? Let's ride this wave."], win: ["Whoa, I won? Gnarly. I wasn't even looking."], lose: ['Wiped out! That was rad though.'] },
    david: { start: ["Oh, it's ON, sister. Skates or no skates."], win: ['And the crowd goes WILD. The crowd is me.'], lose: ["Okay, okay, you're good. Fabulous, even. Rematch."] },
};
function vsLine(who, k) { const own = VS_LINES[who] && VS_LINES[who][k]; return rpick(own && R() < 0.7 ? own : VS_LINES[k]); }

const Versus = {
    /* sounds from the other board would double every blip: it plays silently */
    quiet(fn) { const s = Sfx.play; Sfx.play = () => {}; try { return fn(); } finally { Sfx.play = s; } },
    has(id) { return !!this.ADAPT[id] && !!ARCADE_GAMES[id]; },
    ADAPT: {},
    /* the neighbors who'd play: everyone awake in this room (and whoever runs it) */
    rivals(areaId) {
        const out = [];
        for (const n of NPCs.list || []) {
            if (!n || n.sleeping || n.area !== areaId || !VS_SKILL[n.id]) continue;
            out.push(n.id);
        }
        return out;
    },
};

/* a two-player match: two boards of one game, one yours, one the rival's */
function VsMatch(id, opts) {
    const def = ARCADE_GAMES[id], A = Versus.ADAPT[id];
    this.id = id; this.def = def; this.A = A; this.remote = opts.remote || null; this.who = opts.rival || opts.remote; this.rivalName = Online.name(this.who);
    const o = Object.assign({}, opts, { level: A.level || 1, vs: true });
    this.me = def.create(o);
    this.op = Versus.quiet(() => def.create(o));
    this.junkMe = 0; this.junkOp = 0;
    // (online, junk goes over the live connection; the friend's board here is a picture of theirs, sent a few times a second)
    if (A.hook) A.hook(this.me, n => { if (this.remote) Online.game(this.remote, { k: 'junk', n }); else this.junkOp += n; this.flash = { side: 1, t: 30, n }; });
    if (A.hook && !this.remote) A.hook(this.op, n => { this.junkMe += n; this.flash = { side: 0, t: 30, n }; });
    this.brain = this.remote ? null : A.brain(this.op, VS_SKILL[opts.rival] || 0.5);
    if (this.remote) VsNet.match = this;
    this.score = 0; this.over = false; this.won = null;
    const mk = () => { const c = document.createElement('canvas'); c.width = def.w || ARCADE_W; c.height = def.h || ARCADE_H; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return { c, g }; };
    this.cvMe = mk(); this.cvOp = mk();
    this.t = 0;
}
VsMatch.prototype = {
    update(inp) {
        this.t++;
        if (this.flash && --this.flash.t <= 0) this.flash = null;
        // junk arrives between pieces (each game decides when it can take it)
        if (this.junkMe && this.A.ready(this.me)) { this.A.junk(this.me, this.junkMe); this.junkMe = 0; Sfx.play('land'); }
        if (this.junkOp && this.A.ready(this.op)) { Versus.quiet(() => this.A.junk(this.op, this.junkOp)); this.junkOp = 0; }
        this.me.update(inp);
        if (this.remote) {
            if (this.snapIn) { Object.assign(this.op, this.snapIn); this.snapIn = null; }
            if (this.left_ && !this.op.over) { this.op.over = true; this.op.score = Math.min(this.op.score || 0, (this.me.score || 0) - 1); }
            if (this.t % 6 === 0 || this.me.over) Online.game(this.remote, { k: 'snap', s: vsSnap(this.me) });
        } else {
            const oi = this.brain.input();
            oi.pointer = VS_NO_POINTER;
            Versus.quiet(() => this.op.update(oi));
        }
        this.score = this.me.score || 0;
        if (this.A.race) return this.raceCheck();
        const meDone = this.A.done && this.A.done(this.me), opDone = this.A.done && this.A.done(this.op);
        if (this.me.over || this.op.over || meDone || opDone) {
            this.over = true;
            this.won = meDone || (this.op.over && !this.me.over) ? true : opDone || (this.me.over && !this.op.over) ? false : (this.me.score || 0) >= (this.op.score || 0);
        }
    },
    /* a race: until the clock runs out (or the game's own does), or one board is done and the other already ahead */
    raceCheck() {
        const a = this.me.score || 0, b = this.op.score || 0;
        if (this.A.frames) this.left = Math.max(0, this.A.frames - this.t);
        const timeUp = this.A.frames && this.left <= 0;
        if (timeUp || (this.me.over && this.op.over) || (this.me.over && b > a) || (this.op.over && a > b)) { this.over = true; this.won = a >= b; }
    },
    draw(g, t, state) {
        const W = this.cvMe.c.width, H = this.cvMe.c.height;
        this.me.draw(this.cvMe.g, t, state);
        this.op.draw(this.cvOp.g, t, state);
        g.fillStyle = '#120c22'; g.fillRect(0, 0, W * 2 + VS_GAP, H + VS_HEAD);
        g.drawImage(this.cvMe.c, 0, VS_HEAD); g.drawImage(this.cvOp.c, W + VS_GAP, VS_HEAD);
        // the names over the boards, junk waiting, a flash when some goes across
        pxShadow(g, 'YOU', W / 2, 2, '#8cf0ff', 1, 'center');
        pxShadow(g, this.rivalName.toUpperCase(), W + VS_GAP + W / 2, 2, '#ffb0c8', 1, 'center');
        const pend = (n, x) => { for (let i = 0; i < Math.min(n, 12); i++) { g.fillStyle = i < 4 ? '#ffd84a' : '#ff6a5a'; g.fillRect(x + i * 4, 3, 3, 3); } };
        pend(this.junkMe, 4); pend(this.junkOp, W + VS_GAP + 4);
        if (this.A.race && this.left != null) pxShadow(g, `${Math.floor(this.left / 3600)}:${String(Math.floor(this.left / 60) % 60).padStart(2, '0')}`, W + VS_GAP / 2, 2, this.left < 600 ? '#ff8a6a' : '#ffd84a', 1, 'center');
        if (this.A.race) for (const [b, x] of [[this.me, 0], [this.op, W + VS_GAP]]) if (b.over) { g.globalAlpha = 0.5; g.fillStyle = '#120c22'; g.fillRect(x, VS_HEAD, W, H); g.globalAlpha = 1; pxShadow(g, 'DONE', x + W / 2, VS_HEAD + H / 2 - 4, '#ffffff', 1, 'center'); }
        if (this.flash) { g.globalAlpha = this.flash.t / 30; g.fillStyle = '#fff4c0'; g.fillRect(this.flash.side ? W + VS_GAP : 0, VS_HEAD, W, 3); g.globalAlpha = 1; }
        if (this.over || state === 'over') {
            const lost = this.won === false, x = lost ? 0 : W + VS_GAP;
            g.fillStyle = 'rgba(18,12,34,0.55)'; g.fillRect(x, VS_HEAD + 56, W, 26);
            pxShadow(g, this.won === null ? '' : 'K.O.', x + W / 2, VS_HEAD + 62, '#ff8a6a', 2, 'center');
        }
    },
};
const VS_GAP = 4, VS_HEAD = 9, VS_NO_POINTER = { x: 0, y: 0, down: false, seen: false };
/* a board as plain data, to send: what's drawn, without the sparkles and the links between pieces */
const VS_SKIP = new Set(['pops', 'bits', 'puffs', 'rings', 'spray', 'touch', 'drag', 'word', 'calc', 'banner', 'talk', 'swipe', 'pile', 'groups']);
function vsSnap(g) {
    const seen = new WeakSet();
    return JSON.parse(JSON.stringify(g, function (k, v) {
        if (VS_SKIP.has(k) || typeof v === 'function') return undefined;
        // (a sushi clearing keeps just its timing: the group it belongs to is shared by its pieces)
        if (k === 'g' && v && typeof v === 'object' && 'flash' in v) return { t: v.t, flash: v.flash };
        if (v && typeof v === 'object') { if (seen.has(v)) return undefined; seen.add(v); }
        return v;
    }));
}

/* playing a friend online: an invite, an answer, then each side plays its own board and sends it across */
const VsNet = {
    asking: null, match: null,
    /* ask a friend on the island to play; resolves true when they say yes */
    invite(to, id) {
        if (this.asking) return Promise.resolve(false);
        Online.game(to, { k: 'invite', game: id });
        return new Promise(res => {
            const P = UI.open({ title: `Asking ${Online.name(to)}...`, foot: true, onClose: () => this.answer(to, { k: 'decline', why: 'cancel' }) });
            P.body.appendChild(el('p', 'muted', `${Online.name(to)} gets a message asking to play ${ARCADE_GAMES[id].name}. Waiting for an answer.`));
            P.foot.appendChild(btn('Never mind', 'alt', () => UI.close()));
            this.asking = { to, id, res, timer: setTimeout(() => this.answer(to, { k: 'decline', why: 'late' }), 30000) };
        });
    },
    answer(from, d) {
        const a = this.asking;
        if (!a || a.to !== from) return;
        clearTimeout(a.timer); this.asking = null;
        if (d.why === 'cancel') Online.game(from, { k: 'cancel' });
        else UI.close(true);
        if (d.k !== 'accept') UI.toast(d.why === 'busy' ? `${Online.name(from)} is busy right now.` : d.why === 'late' ? `${Online.name(from)} didn't answer.` : d.why === 'cancel' ? 'Never mind, then.' : `${Online.name(from)} said not now.`);
        a.res(d.k === 'accept');
    },
    got(from, d) {
        if (!d || typeof d !== 'object') return;
        if (d.k === 'invite') return this.invited(from, d.game);
        if (d.k === 'accept' || d.k === 'decline') return this.answer(from, d);
        if (d.k === 'cancel') { if (this.prompt === from) { this.prompt = null; UI.hideDialog(); UI.toast(`${Online.name(from)} changed their mind.`); } return; }
        const m = this.match;
        if (!m || m.remote !== from) return;
        if (d.k === 'snap' && d.s && typeof d.s === 'object') m.snapIn = d.s;
        else if (d.k === 'junk') m.junkMe += Math.max(0, Math.min(12, d.n | 0));
        else if (d.k === 'leave') m.left_ = true;
    },
    /* a friend asks: play, or not now (busy in a game or a menu: they hear so) */
    async invited(from, id) {
        if (!Versus.has(id) || Arcade.on || UI.modal || G.busy || this.asking || this.match || G.mode !== 'play') { Online.game(from, { k: 'decline', why: 'busy' }); return; }
        this.prompt = from;
        G.busy++;
        const k = await UI.ask(null, `${Online.name(from)} wants to play ${ARCADE_GAMES[id].name} with you! On the house.`, ['Play!', 'Not now']);
        G.busy--;
        if (this.prompt !== from) return;
        this.prompt = null;
        Online.game(from, { k: k === 0 ? 'accept' : 'decline' });
        if (k === 0) { UI.hideDialog(); await this.play(id, from); }
    },
    async play(id, friend) {
        const res = await Arcade.start(versusDef(id), { remote: friend, title: `${ARCADE_GAMES[id].name} \u00b7 vs ${Online.name(friend)}` });
        this.match = null;
        if (res) { S.stats.vsGames = (S.stats.vsGames || 0) + 1; if (res.won) S.stats.vsWins = (S.stats.vsWins || 0) + 1; Save.touch(); }
        return res;
    },
    /* a friend left the island mid-game: you win */
    gone(who) { if (this.match && this.match.remote === who) this.match.left_ = true; if (this.asking && this.asking.to === who) this.answer(who, { k: 'decline', why: 'late' }); },
    /* the friends on the island right now */
    friends() { return [...Online.others.values()].map(o => o.who).filter(w => w && w !== Online.who()); },
};

/* the cabinet's two-player version of a game: same buttons, twice as wide */
function versusDef(id) {
    const key = 'vs_' + id;
    if (ARCADE_GAMES[key]) return key;
    const d = ARCADE_GAMES[id];
    ARCADE_GAMES[key] = {
        name: d.name + ' vs', fee: d.fee, tune: d.tune, glow: d.glow, help: d.help, how: d.how, buttons: d.buttons, scored: false,
        w: (d.w || ARCADE_W) * 2 + VS_GAP, h: (d.h || ARCADE_H) + VS_HEAD, pauseNote: 'Your rival waits, very politely.',
        create(opts) { return new VsMatch(id, opts); },
        tickets(m) { return m.won ? 25 : 5; },
        result(m, opts) {
            const name = m.rivalName;
            if (m.remote) {
                if (m.quit) Online.game(m.remote, { k: 'leave' });
                else Online.game(m.remote, { k: 'snap', s: vsSnap(m.me) });
                return { title: m.won ? 'You win!' : `${name} wins!`, lines: [`You: ${fmtNum(m.me.score || 0)} \u00b7 ${name}: ${fmtNum(m.op.score || 0)}`, m.left_ ? `${name} had to go. That counts!` : m.won ? 'Good game!' : 'So close. Rematch?'] };
            }
            return { title: m.won ? 'You win!' : `${name} wins!`, lines: [`You: ${fmtNum(m.me.score || 0)} · ${name}: ${fmtNum(m.op.score || 0)}`, m.won ? `${name}: "${vsLine(m.who, 'lose')}"` : `${name}: "${vsLine(m.who, 'win')}"`] };
        },
    };
    return key;
}
/* playing a neighbor: they get a little closer for it (once a day each) */
async function versusPlay(id, rival, opts) {
    const sp = rival;
    await UI.say(sp, vsLine(rival, 'start'));
    UI.hideDialog();
    const res = await Arcade.start(versusDef(id), Object.assign({ rival, title: `${ARCADE_GAMES[id].name} · vs ${Online.name(rival)}` }, opts || {}));
    if (!res) return res;
    const r = rel(rival);
    if (r.vsDay !== Clock.dayNum()) { r.vsDay = Clock.dayNum(); r.pts += 3; Save.touch(); }
    S.stats.vsGames = (S.stats.vsGames || 0) + 1;
    if (res.won) S.stats.vsWins = (S.stats.vsWins || 0) + 1;
    return res;
}

/* ---------------------------------------------------------------- Bento Blocks: rows with a gap */
BENTO_LOOK.G = { base: '#8a8494', hi: '#b8b2c2', lo: '#5a5464' };      // junk: plain rice in grey seaweed
function blocksJunk(g, n) {
    const hole = Math.floor(R() * g.cols);
    for (let k = 0; k < n; k++) {
        if (g.grid[0].some(c => c)) { g.over = true; return; }
        g.grid.shift();
        const row = new Array(g.cols).fill('G'); row[hole] = null;
        g.grid.push(row);
    }
    if (g.p && !g.fits(g.p, 0, 0)) { if (g.fits(g.p, 0, -1)) g.p.y--; else if (g.fits(g.p, 0, -2)) g.p.y -= 2; else g.over = true; }
}
/* where a piece would best go: every turn and column, scored on the board it leaves (height, holes, bumps, rows) */
function blocksBest(g, skill) {
    const out = [];
    for (let rot = 0; rot < 4; rot++) {
        for (let x = -2; x < g.cols; x++) {
            const p = { id: g.p.id, x, y: g.p.y, rot };
            if (!g.fits(p, 0, 0, rot)) continue;
            let y = p.y; while (g.fits({ id: p.id, x, y: y + 1, rot }, 0, 0, rot)) y++;
            const grid = g.grid.map(r => r.slice());
            let top = false;
            for (const [cx, cy] of bentoCells(p.id, rot)) { if (y + cy < 0) top = true; else grid[y + cy][x + cx] = p.id; }
            if (top) continue;
            let lines = 0;
            for (let yy = 0; yy < g.rows; yy++) if (grid[yy].every(c => c)) lines++;
            const hts = [];
            let holes = 0;
            for (let xx = 0; xx < g.cols; xx++) {
                let h = 0, seen = false;
                for (let yy = 0; yy < g.rows; yy++) { if (grid[yy][xx]) { if (!seen) { h = g.rows - yy; seen = true; } } else if (seen) holes++; }
                hts.push(h);
            }
            const agg = hts.reduce((a, b) => a + b, 0) - lines * g.cols;
            let bump = 0; for (let xx = 1; xx < g.cols; xx++) bump += Math.abs(hts[xx] - hts[xx - 1]);
            out.push({ rot, x, s: -0.51 * agg + 0.76 * lines * lines - 0.36 * holes * 3 - 0.18 * bump });
        }
    }
    out.sort((a, b) => b.s - a.s);
    // (a weaker player sometimes takes a worse spot)
    const pick = R() > skill * 0.9 + 0.1 ? Math.min(out.length - 1, Math.floor(R() * 4)) : 0;
    return out[pick] || null;
}
/* a brain turns a plan into button presses, at the speed its skill allows */
function plannedBrain(g, skill, plan, opts) {
    opts = opts || {};
    const rotKey = opts.rot || 'rot', dropKey = opts.drop === undefined ? 'drop' : opts.drop;
    let goal = null, cur = null, wait = 0;
    const think = Math.round(46 - skill * 36), step = Math.max(2, Math.round(10 - skill * 8));
    return {
        input() {
            const out = { held: {}, pressed: {} };
            const piece = opts.piece ? opts.piece(g) : g.p;
            if (!piece) { goal = null; cur = null; return out; }
            if (piece !== cur) { cur = piece; goal = null; wait = think + Math.floor(R() * 10); }
            if (wait > 0) { wait--; return out; }
            if (!goal) { goal = plan(g, skill); wait = step; if (!goal) { out.pressed.drop = true; return out; } return out; }
            wait = step;
            if (piece.rot !== goal.rot) out.pressed[rotKey] = true;
            else if (piece.x < goal.x) out.pressed.right = true;
            else if (piece.x > goal.x) out.pressed.left = true;
            else if (dropKey && skill > 0.45) out.pressed[dropKey] = true;
            else { out.held.down = true; wait = 0; }
            return out;
        },
    };
}
Versus.ADAPT.blocks = {
    level: 3,
    ready: g => !g.clearing && !!g.p,
    junk: blocksJunk,
    // clearing rows sends junk (2 rows: 1, 3: 2, a BENTO: 4), less whatever was waiting to come in
    hook(g, send) {
        const fin = g.finishClear.bind(g);
        g.finishClear = function () { const n = this.clearing ? this.clearing.rows.length : 0; fin(); const k = [0, 0, 1, 2, 4][n] || 0; if (k) send(k); };
    },
    brain: (g, skill) => plannedBrain(g, skill, blocksBest),
};

/* ---------------------------------------------------------------- Spice Capsules: loose halves, first to clear the bugs */
function capsulesJunk(g, n) {
    const cols = shuffled(Array.from({ length: g.cols }, (_, i) => i)).slice(0, Math.min(n, g.cols));
    for (const x of cols) {
        let y = -1;
        for (let yy = 0; yy < g.rows; yy++) { if (g.grid[yy][x]) break; y = yy; }
        if (y < 1) { g.over = true; return; }
        g.grid[y][x] = { c: Math.floor(R() * 3), link: null };
    }
}
function capsulesBest(g, skill) {
    const out = [];
    for (let rot = 0; rot < 4; rot++) for (let x = 0; x < g.cols; x++) {
        const p = { x, y: g.p.y, rot, a: g.p.a, b: g.p.b };
        if (!g.fits(p, 0, 0, rot)) continue;
        let y = p.y; while (g.fits({ x, y: y + 1, a: p.a, b: p.b }, 0, 0, rot)) y++;
        const cells = g.cells({ x, y, a: p.a, b: p.b }, rot);
        if (cells.some(([cx, cy]) => cy < 0)) continue;
        let s = 0;
        const at = (xx, yy) => (xx >= 0 && yy >= 0 && xx < g.cols && yy < g.rows ? g.grid[yy][xx] : null);
        for (const [cx, cy, c] of cells) {
            // same colors beside and below make runs; a bug of the color under it is the best
            let run = 1;
            for (let k = 1; k < 4; k++) { const q = at(cx, cy + k); if (q && q.c === c) { run++; if (q.bug) s += 2; } else break; }
            let row = 1;
            for (const d of [-1, 1]) for (let k = 1; k < 4; k++) { const q = at(cx + d * k, cy); if (q && q.c === c) row++; else break; }
            s += (run >= 4 ? 12 : run * run) + (row >= 4 ? 12 : row * row * 0.6);
            const under = at(cx, cy + 1);
            if (under && under.c !== c) s -= under.bug ? 4 : 2;
            s -= (g.rows - cy) * 0.15;
        }
        if (cells[0][2] === cells[1][2] && (rot === 1 || rot === 3)) s += 1.5;
        out.push({ rot, x, s });
    }
    out.sort((a, b) => b.s - a.s);
    const pick = R() > skill * 0.9 + 0.1 ? Math.min(out.length - 1, Math.floor(R() * 4)) : 0;
    return out[pick] || null;
}
Versus.ADAPT.capsules = {
    level: 2,
    ready: g => g.phase === 'fall' && !!g.p,
    junk: capsulesJunk,
    // a chain of two or more clears sends that many halves across
    hook(g, send) {
        const chk = g.checkMatches.bind(g);
        g.checkMatches = function () { const before = this.chain; chk(); if (this.phase !== 'clear' && before >= 2) send(before); };
    },
    done: g => g.phase === 'stage',
    brain: (g, skill) => plannedBrain(g, skill, capsulesBest),
};

/* ---------------------------------------------------------------- Dumpling Drop: burnt dumplings rain on the other steamer */
/* where a pair would best go: the groups it joins (four pops), kept low and off the middle column */
function dumplingBest(g, skill) {
    const out = [];
    for (let rot = 0; rot < 4; rot++) for (let x = 0; x < DUMP_COLS; x++) {
        const [dx, dy] = DUMP_OFF[rot];
        if (x + dx < 0 || x + dx >= DUMP_COLS || !g.fits(x, Math.ceil(g.p.y), rot)) continue;
        const grid = g.grid.map(r => r.map(c => (c ? c.c : null)));
        const drop = (cx, c) => { let y = DUMP_ROWS - 1; while (y >= 0 && grid[y][cx] != null) y--; if (y >= 0) grid[y][cx] = c; return y; };
        // (the lower one lands first)
        const first = dy > 0 ? [[x + dx, g.p.b], [x, g.p.a]] : [[x, g.p.a], [x + dx, g.p.b]];
        const ys = first.map(([cx, c]) => [cx, drop(cx, c), c]);
        if (ys.some(q => q[1] < 1)) continue;
        let sc = 0;
        for (const [cx, cy, c] of ys) {
            const seen = new Set([cx + ',' + cy]), todo = [[cx, cy]];
            while (todo.length) {
                const [qx, qy] = todo.pop();
                for (const [ox, oy] of DUMP_OFF) { const nx = qx + ox, ny = qy + oy; if (nx >= 0 && nx < DUMP_COLS && ny >= 1 && ny < DUMP_ROWS && grid[ny][nx] === c && !seen.has(nx + ',' + ny)) { seen.add(nx + ',' + ny); todo.push([nx, ny]); } }
            }
            sc += seen.size >= 4 ? 14 : seen.size * seen.size;
            sc -= (DUMP_ROWS - cy) * 0.25 + (cx === DUMP_MID && cy < 5 ? 8 : 0);
        }
        out.push({ rot, x, s: sc });
    }
    out.sort((a, b) => b.s - a.s);
    const pick = R() > skill * 0.9 + 0.1 ? Math.min(out.length - 1, Math.floor(R() * 4)) : 0;
    return out[pick] || null;
}
Versus.ADAPT.dumpling = {
    ready: g => true,
    junk(g, n) { g.pending = Math.min(72, g.pending + n); },
    // a pop sends burnt dumplings over (70 points a piece, what's left after cooling your own tray); no heat of its own
    hook(g, send) {
        g.heat = () => 0;
        let frac = 0;
        const chk = g.check.bind(g), end = g.endChain.bind(g);
        g.check = function () {
            const sc = this.score, had = this.pending;
            chk();
            const pts = this.score - sc;
            if (pts > 0) { frac += Math.max(0, pts / 70 - (had - this.pending)); const k = Math.floor(frac); if (k) { frac -= k; send(k); } }
        };
        // (whatever's in the tray rains in after a pair that pops nothing)
        g.endChain = function () { if (!this.chain && this.pending >= 1) { this.hot = true; return this.rain(); } return end(); };
    },
    brain: (g, skill) => plannedBrain(g, skill, dumplingBest, { rot: 'cw', drop: null }),
};

/* ---------------------------------------------------------------- Sushi Swap: combos and chains push the other belt up */
/* a swap that lines up three (or more): the one nearest the bottom, the bigger the better */
function sushiFind(g) {
    const G2 = g.grid, ok = b => b && b.s === 'idle';
    let best = null;
    for (let r = g.topRow(); r < SUSHI_ROWS; r++) for (let c = 0; c < SUSHI_COLS - 1; c++) {
        const a = G2[r][c], b = G2[r][c + 1];
        if ((!a && !b) || (a && !ok(a)) || (b && !ok(b)) || (a && b && a.k === b.k)) continue;
        // (a piece moved over a gap would fall: leave those to the humans)
        if (r < SUSHI_ROWS - 1 && ((a && !G2[r + 1][c + 1]) || (b && !G2[r + 1][c]))) continue;
        const k = (x, y) => { if (y < 0 || y >= SUSHI_ROWS || x < 0 || x >= SUSHI_COLS) return -1; if (y === r && x === c) return b ? b.k : -1; if (y === r && x === c + 1) return a ? a.k : -1; const q = G2[y][x]; return ok(q) ? q.k : -1; };
        let n = 0;
        for (const x of [c, c + 1]) {
            const kk = k(x, r);
            if (kk < 0) continue;
            let h = 1; for (let d = 1; k(x - d, r) === kk; d++) h++; for (let d = 1; k(x + d, r) === kk; d++) h++;
            let v = 1; for (let d = 1; k(x, r - d) === kk; d++) v++; for (let d = 1; k(x, r + d) === kk; d++) v++;
            if (h >= 3) n += h; if (v >= 3) n += v;
        }
        if (n && (!best || n * 10 + r > best.n * 10 + best.r)) best = { r, c, n };
    }
    return best;
}
function sushiBrain(g, skill) {
    let goal = null, wait = 30;
    const step = Math.max(3, Math.round(14 - skill * 11));
    return {
        input() {
            const out = { held: {}, pressed: {} };
            if (wait > 0) { wait--; return out; }
            wait = step;
            if (!goal || !g.grid[goal.r] || R() < 0.04) goal = sushiFind(g);
            if (!goal) {
                // nothing to match: bring a row up (when there's room), or look again soon
                if (!g.grid.slice(0, 5).some(row => row.some(b => b)) && R() < 0.5) out.pressed.raise = true;
                wait = step * 2;
                return out;
            }
            if (g.cy < goal.r) out.pressed.down = true;
            else if (g.cy > goal.r) out.pressed.up = true;
            else if (g.cx < goal.c) out.pressed.right = true;
            else if (g.cx > goal.c) out.pressed.left = true;
            else { out.pressed.swap = true; goal = null; wait = step + Math.round(20 * (1 - skill)); }
            return out;
        },
    };
}
Versus.ADAPT.sushi = {
    ready: g => !g.groups.length && !g.dead,
    // the other belt jumps up a row for each (a full top row costs them their patience instead)
    junk(g, n) { for (let k = 0; k < n; k++) { if (g.grid[0].some(b => b)) { g.health = Math.max(1, g.health - 35); continue; } g.shift(); g.rise = 0; } },
    hook(g, send) {
        const m = g.match.bind(g);
        g.match = function (hit) { const ch = this.chain; m(hit); const n = hit.size, k = (n >= 4 ? Math.floor((n - 1) / 3) : 0) + (this.chain > ch ? this.chain - 1 : 0); if (k) send(k); };
    },
    brain: sushiBrain,
};

/* ---------------------------------------------------------------- the races: higher score when the clock runs out */
const VS_RACE = 60 * 75;
function surfBrain(g, skill) {
    let cool = 0;
    return { input() {
        const out = { held: {}, pressed: {} };
        if (cool > 0) { cool--; return out; }
        const px = 36, lead = g.speed * (6 + (1 - skill) * 4);
        for (const o of g.things) {
            if (o.done) continue;
            const d = o.x - px;
            // jump a rock as it comes near (a slower player sometimes jumps late), not into a gull overhead
            if (o.kind === 'rock' && d > o.w / 2 + 2 && d < o.w / 2 + 6 + lead) {
                if (!g.things.some(q => q.kind === 'gull' && !q.done && Math.abs(q.x - px - lead * 1.5) < 14) && R() < 0.35 + skill * 0.6) { out.pressed.jump = true; cool = 12; }
                break;
            }
            if ((o.kind === 'shell' || o.kind === 'star') && o.y < SURF_SEA - 16 && d > 10 && d < 24 && R() < skill * 0.5) { out.pressed.jump = true; cool = 20; break; }
        }
        return out;
    } };
}
function gardenBrain(g, skill) {
    let wait = 20, target = -1;
    const step = Math.max(2, Math.round(10 - skill * 8));
    return { input() {
        const out = { held: {}, pressed: {} };
        if (wait > 0) { wait--; return out; }
        wait = step;
        // (a slower player sometimes bonks Cuke by mistake)
        const ok = i => g.pop[i] && !g.pop[i].hit && g.pop[i].t <= g.pop[i].up && (g.pop[i].who !== 'cuke' || R() > 0.6 + skill * 0.4);
        if (target < 0 || !ok(target)) {
            target = -1;
            let bd = 99;
            for (let i = 0; i < 9; i++) if (ok(i)) { const d = Math.abs(i % 3 - g.cur % 3) + Math.abs(Math.floor(i / 3) - Math.floor(g.cur / 3)) - (g.pop[i].who === 'gold' ? 2 : 0); if (d < bd) { bd = d; target = i; } }
            if (target < 0) return out;
        }
        const tx = target % 3, ty = Math.floor(target / 3), cx = g.cur % 3, cy = Math.floor(g.cur / 3);
        if (tx < cx) out.pressed.left = true; else if (tx > cx) out.pressed.right = true;
        else if (ty < cy) out.pressed.up = true; else if (ty > cy) out.pressed.down = true;
        else { out.pressed.bonk = true; target = -1; wait = step + Math.round((1 - skill) * 12); }
        return out;
    } };
}
function fruitBrain(g, skill) {
    let aim = null, re = 0;
    return { input() {
        const out = { held: {}, pressed: {} };
        if (--re <= 0 || !aim || aim.done) {
            re = Math.round(18 - skill * 12);
            // the fruit that lands soonest that can still be reached; a bee or a rotten one close by pushes the other way
            let best = null, bs = -1e9;
            for (const it of g.items) {
                if (it.done || it.t < 0 || it.kind === 'bee' || it.kind === 'rotten') continue;
                const sc = it.y - Math.abs(it.x - g.x) * 0.6 + (it.kind === 'gold' ? 40 : 0);
                if (sc > bs) { bs = sc; best = it; }
            }
            aim = best;
        }
        let tx = aim ? aim.x : ARCADE_W / 2;
        for (const it of g.items) if (!it.done && (it.kind === 'bee' || it.kind === 'rotten') && it.y > FRUIT_GROUND - 70 && Math.abs(it.x - g.x) < 18) tx = g.x + (g.x > it.x ? 30 : -30);
        if (tx < g.x - 3 - (1 - skill) * 6) out.held.left = true;
        else if (tx > g.x + 3 + (1 - skill) * 6) out.held.right = true;
        return out;
    } };
}
function stackBrain(g, skill) {
    let tx = null, wait = 30;
    return { input() {
        const out = { held: {}, pressed: {} };
        if (g.cool > 0) { tx = null; return out; }
        if (tx == null) {
            // over the same snack (so they merge), else anywhere; a beginner just drops somewhere
            const same = g.balls.filter(b => b.t === g.cur && b.age > 30).sort((a, b) => b.y - a.y)[0];
            tx = same && R() < 0.4 + skill * 0.5 ? same.x : STACK_L + 10 + R() * (STACK_R - STACK_L - 20);
            wait = Math.round(40 - skill * 30);
        }
        if (Math.abs(g.x - tx) > 2) { if (g.x < tx) out.held.right = true; else out.held.left = true; return out; }
        if (--wait <= 0) { out.pressed.drop = true; tx = null; }
        return out;
    } };
}
function noodleBrain(g, skill) {
    let last = null;
    return { input() {
        const out = { held: {}, pressed: {} };
        const head = g.body[0];
        if (!head || (last && last[0] === head[0] && last[1] === head[1])) return out;
        last = head.slice();
        // the way to the nearest snack that doesn't run into the noodle (a breadth-first search on the board)
        const W = NOODLE_W, H = NOODLE_H, block = new Set(g.body.slice(0, -1).map(([x, y]) => x + ',' + y));
        const goal = new Set(g.food.map(f => f.x + ',' + f.y));
        const prev = new Map([[head[0] + ',' + head[1], null]]), q = [head];
        let end = null;
        while (q.length && !end) {
            const [x, y] = q.shift();
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
                if (nx < 0 || ny < 0 || nx >= W || ny >= H || block.has(k) || prev.has(k)) continue;
                prev.set(k, [x, y]);
                if (goal.has(k)) { end = [nx, ny]; break; }
                q.push([nx, ny]);
            }
        }
        let dir = null;
        if (end && R() < 0.75 + skill * 0.25) {
            let c = end;
            for (let p = prev.get(c[0] + ',' + c[1]); p && (p[0] !== head[0] || p[1] !== head[1]); p = prev.get(c[0] + ',' + c[1])) c = p;
            dir = [c[0] - head[0], c[1] - head[1]];
        } else {
            // no way to a snack: any safe square
            for (const [dx, dy] of shuffled([[1, 0], [-1, 0], [0, 1], [0, -1]])) { const nx = head[0] + dx, ny = head[1] + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H && !block.has(nx + ',' + ny)) { dir = [dx, dy]; break; } }
        }
        if (dir) out.pressed[dir[0] > 0 ? 'right' : dir[0] < 0 ? 'left' : dir[1] > 0 ? 'down' : 'up'] = true;
        return out;
    } };
}
Object.assign(Versus.ADAPT, {
    surf: { race: true, frames: VS_RACE, ready: () => false, brain: surfBrain },
    garden: { race: true, ready: () => false, brain: gardenBrain },
    fruit: { race: true, frames: VS_RACE, ready: () => false, brain: fruitBrain },
    stack: { race: true, frames: VS_RACE, ready: () => false, brain: stackBrain },
    noodle: { race: true, frames: VS_RACE, ready: () => false, brain: noodleBrain },
});
