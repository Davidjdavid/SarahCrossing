/* The Tidiness Trials (S28, after the first Knot): three timed rooms in the Inn's attic, set out by the
   innkeeper. Each is something already known, done against the clock:
     1. Two at once: the first block into a pocket, the second onto the pocket's mouth, holding it in.
     2. The long way home: a pot whose way home snakes round the whole room. Left to walk, it's too slow;
        broken, its pieces fly home; carried back over its own path, the path gets shorter.
     3. Home time: ring the bell at the end of a long corridor, then be back on the mat by the door before
        it stops. Walking is too slow; falling flies you home along the way you came. */

/* a serpentine path through a block of tiles, row by row */
function snakePath(x0, y0, x1, y1) {
    const out = [];
    for (let y = y0, k = 0; y <= y1; y++, k++) {
        if (k % 2 === 0) for (let x = x0; x <= x1; x++) out.push([x, y]);
        else for (let x = x1; x >= x0; x--) out.push([x, y]);
    }
    return out;
}
const TRIAL2_PATH = snakePath(22, 2, 37, 8);

const TRIALS = {
    1: { name: 'Trial One: Two at Once', time: 20 * 60, start: 'plate', at: [3, 8], flag: 'trial1' },
    2: { name: 'Trial Two: The Long Way Home', time: 15 * 60, start: 'plate', at: [21, 9], flag: 'trial2' },
    3: { name: 'Trial Three: Home Time', time: 4 * 60, start: 'bell', flag: 'trial3' },
};

defArea({
    id: 'inn_attic', name: 'The Attic', family: 'interior', theme: 'tidy', thread: THREAD.ives, music: 'inn', place: 'The Attic',
    rows: [
        /* room 1 (x 0-19), room 2 (20-39), room 3 (40-59) */
        '####################' + '####################' + '####################',
        '#......###.........#' + '#..................#' + '##.................#',
        '#......#.#.........#' + '#..................#' + '##.##############..#',
        '#..................#' + '#..................#' + '##.##############..#',
        '#..................#' + '#..................#' + '##.##############..#',
        '#...................' + '....................' + '...##############..#',
        '#..................#' + '#..................#' + '#################..#',
        '#..................#' + '#..................#' + '#..................#',
        '#..................#' + '#..................#' + '#....oo............#',
        '#..................#' + '#..................#' + '#..................#',
        '####################' + '####################' + '####################',
    ],
    rooms: [{ x: 0, y: 0, w: 20, h: 11 }, { x: 20, y: 0, w: 20, h: 11 }, { x: 40, y: 0, w: 20, h: 11 }],
    entry: { x: 2, y: 9 },
    ents: [
        { k: 'warp', x: 1, y: 9, to: 'inn', tx2: 2, ty2: 3, face: 'down' },
        { k: 'deco', x: 1, y: 9, look: 'stairs_down', solid: false, baseY: -100 },
        /* 1: two at once */
        { k: 'plate', x: 3, y: 8, sig: 'start1', id: 'start1' },
        { k: 'sign', x: 1, y: 7, text: "TRIAL ONE: TWO AT ONCE. Step on the start plate, then both plates down together before the bell. (Hint: one tidy thing can hold another in.) - I." },
        { k: 'plate', x: 8, y: 2, sig: 't1a' }, { k: 'plate', x: 8, y: 3, sig: 't1b' },
        { k: 'wood', x: 8, y: 5, id: 't1w1' }, { k: 'wood', x: 9, y: 3, id: 't1w2' },
        { k: 'chest', x: 15, y: 2, item: 'b20', id: 't1chest', hidden: true, when: 'flag:trial1' },
        { k: 'door', x: 19, y: 5, type: 'gate', when: 'flag:trial1', dir: 'v', id: 'tg1' },
        /* 2: the long way home */
        { k: 'plate', x: 21, y: 9, sig: 'start2', id: 'start2' },
        { k: 'sign', x: 21, y: 7, text: "TRIAL TWO: THE LONG WAY HOME. Step on the start plate. The pot must be home on its shelf before the bell. It does dawdle so. - I." },
        { k: 'deco', x: 22, y: 1, look: 'shelf', ox: 0, oy: -14, solid: [[0, 0], [1, 0]] },
        { k: 'pot', x: 22, y: 2, id: 'longPot', style: 'pot_teal', group: 'trial2', tiedOff: true, startAt: TRIAL2_PATH[TRIAL2_PATH.length - 1], trace: TRIAL2_PATH },
        { k: 'chest', x: 36, y: 1, item: 'b30', id: 't2chest', hidden: true, when: 'flag:trial2' },
        { k: 'door', x: 39, y: 5, type: 'gate', when: 'flag:trial2', dir: 'v', id: 'tg2' },
        /* 3: home time */
        { k: 'plate', x: 41, y: 5, sig: 'mat3', id: 'mat3' },
        { k: 'sign', x: 44, y: 9, text: "TRIAL THREE: HOME TIME. Ring the bell at the far end, then be home on the plate by the door before it stops. The quickest way home is the way you came. - I." },
        { k: 'crystal', x: 42, y: 8, sig: 'bell3', id: 'bell3' },
        { k: 'chest', x: 41, y: 9, item: 'heartpatch', id: 't3chest', hidden: true, when: 'flag:trial3' },
    ],
    tick: a => Trials.tick(a),
    onEnter: a => { G.trial = null; },
});

const Trials = {
    tick(a) {
        const p = G.player; if (!p || p.area !== a) return;
        const tr = G.trial;
        if (!tr) {
            /* starting: a start plate, or the bell */
            for (const n of [1, 2]) {
                const T0 = TRIALS[n];
                if (Signals.get(a, 'start' + n) && !Progress.flag(T0.flag) && !this.armed[n]) {
                    this.armed[n] = true;
                    if (n === 2 && a.find('longPot').shattered) continue;    /* wait for the pieces to settle */
                    this.begin(a, n); return;
                }
                if (!Signals.get(a, 'start' + n)) this.armed[n] = false;
            }
            const bell = a.find('bell3');
            if (bell && bell.on && !Progress.flag('trial3')) this.begin(a, 3);
            return;
        }
        if (Script.blocking()) return;
        tr.t--;
        if (tr.t % 60 === 0 && tr.t > 0 && tr.t <= 180) Sfx.play('click');
        if (this.won(a, tr.n)) { this.win(a, tr.n); return; }
        if (tr.t <= 0) this.lose(a, tr.n);
    },
    armed: {},
    begin(a, n) {
        const T0 = TRIALS[n];
        G.trial = { n, t: T0.time, max: T0.time };
        Sfx.play('twang');
        UI.showBanner(T0.name);
        /* a fair start: everything in this room back in its place */
        if (n === 1) for (const id of ['t1w1', 't1w2']) { const e = a.find(id); if (e && e.ret && e.ret.state !== 'home' && !Return.held(e)) Return.snap(e); }
        if (n === 2) { const pot = a.find('longPot'); this.unhand(pot); Lever.setOut(pot); pot.tiedOff = false; pot.ret.timer = 20; }
        Stats.count('trial:start:' + n);
    },
    /* take it out of Wren's arms (it's going back on its own) */
    unhand(o) {
        const p = G.player;
        if (p.carry === o) { p.carry = null; o.carried = false; o.heldBy = null; }
        else if (o.heldBy && o.heldBy.release) o.heldBy.release();
    },
    won(a, n) {
        if (n === 1) return Signals.get(a, 't1a') && Signals.get(a, 't1b');
        if (n === 2) { const pot = a.find('longPot'); return Return.isHome(pot) && !pot.shattered && !pot.carried; }
        if (n === 3) { const p = G.player; return p.state === 'normal' && p.tx === 41 && p.ty === 5; }
    },
    win(a, n) {
        G.trial = null;
        Progress.set(TRIALS[n].flag);
        Sfx.play('appear'); Sfx.play('item');
        Stats.count('trial:won:' + n);
        if (n === 3) { Progress.set('s28'); }
        const all = [1, 2, 3].every(k => Progress.flag(TRIALS[k].flag));
        UI.toast(all ? "Ding! All three trials done. Somebody downstairs will want to hear about it." : 'Ding! Trial done.', 200);
    },
    lose(a, n) {
        G.trial = null;
        Sfx.play('bell');
        UI.toast('Brrring! Too slow. Everything goes back where it was.', 160);
        if (n === 1) for (const id of ['t1w1', 't1w2']) { const e = a.find(id); if (e && e.ret && e.ret.state !== 'home') Return.snap(e); }
        if (n === 2) { const pot = a.find('longPot'); this.unhand(pot); if (!pot.shattered) Lever.setOut(pot); }
        if (n === 3) { const bell = a.find('bell3'); if (bell) bell.on = false; }
        Stats.count('trial:lost:' + n);
    },
    /* the clock at the top of the screen */
    draw() {
        const tr = G.trial; if (!tr) return;
        const s = Math.ceil(tr.t / 60), x = W / 2 - 22, y = 3;
        Gfx.rect(x, y, 44, 14, PAL.ink); Gfx.rect(x + 1, y + 1, 42, 12, '#fbf3df');
        Gfx.rect(x + 2, y + 10, Math.round(40 * tr.t / tr.max), 2, s <= 3 ? '#e8463c' : '#3fc1b5');
        Font.draw((s <= 3 ? '{red}' : '') + '0:' + String(s).padStart(2, '0'), x + 13, y + 2, PAL.ink);
    },
};

ITEMS.tealscarf = { name: 'Teal scarf', kind: 'keepsake', desc: "Knitted very evenly, in teal. Every stitch the same size. Every single one." };
