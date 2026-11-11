/* The Great Pull and the Great Spool. Back from the Drift on foot, Wren finds Gran winding the whole valley in:
   everyone with a thread (everyone not cut free) dragged in a ring round the Well, threads streaming down it. The
   Well's cap is gone; down it, the Great Spool: the foot of the drum Gran is winding, where every thread in the valley
   runs. The six Knots of the Wander are tied into it, each in a room of its own Maker's thread, to be untied; then the
   Climb, and at the top Gran at the Spool. She can't pull Wren. She pulls everything else. Six great threads hold the
   Spool to the walls; the Shears. Then Linnet comes down the Well. (The look: src/75b_spool_art.js.) */

/* ================= the Pull, down here: the one rule every room of the Spool follows =================
   Every thread in the valley runs up to the drum, and the drum is winding.
   - A thing on its own mark holds there: its peg takes the strain.
   - Off its mark, once its patience runs out, it's wound in: not back the way it came, to its mark, but the way the
     threads on the floor run, north, a tile at a time, until it's wound into the turning wall of thread at the head of
     the room (the drum's face); and the drum lets it drop back onto its own mark, the moment the mark is clear (while
     something stands on it, it hangs over it, waiting). Wound across its own mark on the way, it catches there.
   - The rest is the Return's: held things wait (carried, gripped, paddled, on strings); heavier shoves lighter (a tile
     on along the way), it waits behind anything as heavy or fixed, and a heavy one shoves Wren; it presses plates in
     passing; it hangs on its thread over holes and water; a float carries whoever's on it (the river can't have a
     float that's being wound; it can a loose one, every drift starting its patience again, till something stops it).
     An arch over water is too low to ride under: a float goes under on its own, and scrapes off whoever's aboard.
   - Broken, its pieces fly the way the threads run, from where it broke, striking what they pass; then it's whole on
     its mark again.
   - A ring winds everything out of place in its reach at once, fast, shoving harder; a sleeper woken goes too.
   - Every thread here is drawn too taut for the Shears or the Needle (the six great threads at the top, gone slack a
     moment, aside).
   - Wren's own thread is cut: nothing pulls her. Her Bedroll is the one place that stays put; laid here, a fall takes
     her to it (and on a float it goes where the float goes).
   - Each Knot's room has a brake by its door (a ratchet): everything in the room out of its place goes up into the drum
     at once and is laid back where it belongs, and the room's sleepers lie down again where they lay. */
const Pull = {
    fx: [],                 /* things being wound into the face (drawn rising into it) */
    on(a) { return !!(a && a.def && a.def.pull && !Progress.flag('unwound')); },
    dir(a, x, y) { const r = a.roomAt(x, y); return r && r.pull !== undefined ? r.pull : UP; },
    /* the next tile is the drum's face: the room's edge the threads run into (or the drum itself, at the top) */
    face(a, e, nx, ny) {
        const r = a.roomAt(e.tx, e.ty), d = this.dir(a, e.tx, e.ty);
        if (!r) return true;
        if (d === UP && ny <= r.y) return true;
        if (d === DOWN && ny >= r.y + r.h - 1) return true;
        if (d === LEFT && nx <= r.x) return true;
        if (d === RIGHT && nx >= r.x + r.w - 1) return true;
        const s = r.drum;
        return !!(s && nx >= s.tx && nx < s.tx + 4 && ny >= s.ty && ny < s.ty + 2);
    },
    /* one step of a thing being wound in (in place of the Return's step back along the trace) */
    step(e) {
        const a = e.area, r = e.ret, d = this.dir(a, e.tx, e.ty), nx = e.tx + DX[d], ny = e.ty + DY[d], p = G.player;
        const pace = r.snap ? RET.snapPace : Water.pace(e, d, r.pace);
        if (this.face(a, e, nx, ny)) { this.windIn(e); return; }
        if (a.freeForThing(nx, ny, e)) { this.go(e, nx, ny, pace); r.strain = 0; return; }
        const o = a.at(nx, ny), force = e.weight + (r.snap ? 1 : 0);
        if (o && o.isGrid && !o.fixed && o.weight < force && o.canBeShoved && o.canBeShoved(d)) {
            o.shove(d, pace, e); this.go(e, nx, ny, pace);
            if (r.snap && o.weight >= WEIGHT.medium && e.area === G.map) { G.shake = Math.max(G.shake, 3); Sfx.play('push'); }
            return;
        }
        let pushed = false;
        for (const m of a.walkers) if (m.onTile && m.onTile(nx, ny) && m.weightN !== undefined && m.weightN < force && m.shoved) { m.shoved(d, pace, e); pushed = true; }
        if (pushed) return;
        if (p && p.area === a && p.onTile(nx, ny) && force >= WEIGHT.heavy && p.canBeShoved(d)) { p.shoved(d, pace); this.go(e, nx, ny, pace); return; }
        r.strain++;
    },
    go(e, nx, ny, pace) {
        const p = G.player, a = e.area, aboard = p && p.area === a && p.state === 'normal' && p.tx === e.tx && p.ty === e.ty;
        e.startMove(nx, ny, pace, true); if (e.mv) e.mv.pull = true;
        /* a float going under an arch too low to ride: whoever's aboard is scraped off it, into the water */
        if (aboard && a.kind(nx, ny).arch) {
            if (p.ride === e) p.ride = null;
            Sfx.play('hitthing'); Fx.dust(p.x, p.y);
            if (!Progress.flag('arch_scraped')) { Progress.set('arch_scraped'); G.pendingToast = 'The arch is too low to ride under: it scrapes you off into the water.'; }
        }
    },
    /* into the drum, and (as soon as its mark is clear) down onto its mark */
    windIn(e, quiet) {
        const a = e.area, p = G.player, riding = p && p.ride === e;
        if (a === G.map && !quiet) {
            this.fx.push({ im: e.sprite ? e.sprite() : null, x: e.px, y: e.py, col: e.ret.color, t: 0 });
            Sfx.play('twang', 0.5);
        }
        Return.sendHome(e);
        if (riding) { p.ride = null; p.unstick(); }
        Stats.count('wound');
    },
    /* the way the pieces of something broken fly: from where it broke, the way the threads run, to the face */
    path(a, x, y) {
        const out = [[x, y]], d = this.dir(a, x, y), r = a.roomAt(x, y);
        for (let i = 0; i < 24; i++) {
            const nx = x + DX[d], ny = y + DY[d];
            if (!r || a.roomAt(nx, ny) !== r || this.face(a, { tx: x, ty: y }, nx, ny)) break;
            const k = a.kind(nx, ny);
            if (k.solid && !k.low && !k.crawl && !k.arch) break;     /* (the pieces are small: little holes let them through) */
            x = nx; y = ny; out.push([x, y]);
        }
        return out;
    },
    /* a room's brake (the ratchet by its door): everything in the room out of its place is taken up into the drum at once
       and laid back where it belongs; sleepers lie down again where they were */
    reset(a, r) {
        const p = G.player;
        if (Crossbar.ctl) Crossbar.release(p);
        if (p && p.grip) p.release();
        let n = 0;
        for (const e of a.ents.slice()) {
            if (!e.isGrid || !e.ret || e.removed || e.carried || e.pendingHome || e.noReset) continue;
            const home = a.roomAt(e.ret.mx, e.ret.my) === r, here = a.roomAt(e.tx, e.ty) === r;
            if (!home && !here) continue;
            if (e._sleep0 && e.resetSleep && !(typeof e.resetSleep === 'string' && Progress.flag(e.resetSleep))) { if (this.sleepAgain(e)) n++; continue; }
            if (e.ret.state === 'home') continue;
            if (e.mv) { a.unplace(e, e.mv.fx, e.mv.fy); e.mv = null; }
            this.fx.push({ im: e.sprite ? e.sprite() : null, x: e.px, y: e.py, col: e.ret.color, t: 0 });
            Return.sendHome(e); n++;
        }
        return n;
    },
    /* a puzzle sleeper back where it lay, asleep, its way home as it was */
    sleepAgain(e) {
        const a = e.area, [sx, sy] = e._sleep0.at;
        if (Return.asleep(e) && e.tx === sx && e.ty === sy) return false;
        if ((a.at(sx, sy) && a.at(sx, sy) !== e) || Return.wrenOn(a, sx, sy)) return false;
        if (e.mv) { a.unplace(e, e.mv.fx, e.mv.fy); e.mv = null; }
        a.unplace(e, e.tx, e.ty); e.pendingHome = false;
        e.tx = sx; e.ty = sy; e.x = sx * T; e.y = sy * T; a.place(e, sx, sy);
        e.sleeper = true; e.tiedOff = true; e._sleepAgain = false;
        e.ret.trace = (e._sleep0.trace || [[e.ret.mx, e.ret.my], [sx, sy]]).map(q => q.slice()); e.ret.state = 'away'; e.ret.snap = false; e.ret.timer = e.ret.patience; e.ret.strain = 0;
        Fx.poof(sx * T + 8, sy * T + 8);
        return true;
    },
};
/* the Pull in place of the Return's way home, wherever it's on (the Great Spool) */
{
    const update0 = Return.update;
    Return.update = function (e) {
        const r = e.ret;
        /* (the drum holds a thing over its place while Wren stands there: the Return's own pop home sees to that) */
        if (r && !e.removed && !e.pendingHome && r.state === 'returning' && !e.mv && !r.sewing && Pull.on(e.area) && !this.held(e)) return Pull.step(e);
        return update0.call(this, e);
    };
    /* a step of being wound in lays the thread on as it goes (as a river's does): it isn't the way back */
    const sm0 = GridThing.prototype.stepMove;
    GridThing.prototype.stepMove = function () {
        const m = this.mv;
        if (m && m.pull && m.t + 1 >= m.dur) m.returning = false;
        return sm0.call(this);
    };
    /* the drum lays it down the moment its place is clear (and the first time, you're told so) */
    const sendHome0 = Return.sendHome;
    Return.sendHome = function (e) {
        sendHome0.call(this, e);
        if (Pull.on(e.area) && e.area === G.map && G.player && G.player.area === e.area && !Progress.flag('wound_first')) { Progress.set('wound_first'); G.pendingToast = 'Wound into the turning wall of thread, it drops back onto its own place. (While something stands on its place, it hangs over it, waiting.)'; }
    };
    /* broken: the pieces fly the way the threads run */
    const shards0 = Shards.start;
    Shards.start = function (o, tx, ty) {
        if (!o.ret || !Pull.on(o.area)) return shards0.call(this, o, tx, ty);
        Sfx.play('shatter'); Fx.burst(tx * T + 8, ty * T + 8, o.shardCol || '#d98f3a'); Stats.count('shatters');
        o.shattered = true;
        Return.moved(o, tx, ty);
        this.list.push({ o, path: Pull.path(o.area, tx, ty), i: 0, t: 0, pace: 4, x: tx * T + 8, y: ty * T + 8, delay: 10 });
    };
    /* every thread down here is too taut to stitch or to cut (but a great thread gone slack) */
    const needle0 = TOOLS.needle.use;
    TOOLS.needle.use = function (p) {
        if (Pull.on(p.area) && !Needle.st) { Sfx.play('hitthing'); UI.toast("Every thread down here is drawn taut as wire toward the drum. The Needle won't take a stitch.", 170); return; }
        return needle0.call(this, p);
    };
    const shears0 = TOOLS.shears.use;
    TOOLS.shears.use = function (p) {
        if (Pull.on(p.area)) {
            const e = Shears.target(p);
            if (e && e.kind !== 'greatpost' && e.kind !== 'npc' && !e.noCut && e.ret) { Sfx.play('hitthing'); UI.toast('Too taut: the Pull has every thread down here drawn as tight as wire. The Shears skid right off.', 170); return; }
        }
        return shears0.call(this, p);
    };
    /* puppets being wound in don't hunt for a way round each other (that's for walking home) */
    const ptick0 = Puppet.prototype.tick;
    Puppet.prototype.tick = function () { if (Pull.on(this.area)) { if (this.bob > 0) this.bob--; return; } return ptick0.call(this); };
}

/* an arch over the water, too low to get under but for something floating on its own */
TK.arch = { solid: true, water: true, deep: true, arch: true };
{
    const free0 = Area.prototype.freeForThing;
    Area.prototype.freeForThing = function (x, y, e) {
        if (!this.inside(x, y) || !this.kind(x, y).arch) return free0.call(this, x, y, e);
        if (!e || !e.floats) return false;
        const o = this.at(x, y); if (o && o !== e) return false;
        for (const b of this.blockers) if (b.blocks(x, y, e)) return false;
        return true;
    };
    const hold0 = TOOLS.paddle.hold;
    TOOLS.paddle.hold = function (p) {
        const o = this.float(p), ax = Input.axis();
        if (o && !o.mv && !(this.cool > 0) && (ax.x || ax.y)) {
            const d = ax.x < 0 ? LEFT : ax.x > 0 ? RIGHT : ax.y < 0 ? UP : DOWN;
            if (p.area.kind(o.tx + DX[d], o.ty + DY[d]).arch) {
                this.held = o; o.paddled = true; p.dir = d;
                if (!this._archT || G.t - this._archT > 120) { this._archT = G.t; UI.toast('The arch is too low to get under, riding.'); Sfx.play('hitthing', 0.4); }
                return;
            }
        }
        return hold0.call(this, p);
    };
}

/* ================= the rooms ================= */
const KNOT_HOUSES = ['tidy', 'kiln', 'mill', 'belfry', 'slumber', 'marionette'];
const KNOT_COL = { tidy: THREAD.ives, kiln: THREAD.bram, mill: THREAD.ambrose, belfry: THREAD.tess, slumber: THREAD.mallow, marionette: THREAD.jory };
const HOUSE_NAMES = { tidy: 'Tidyhouse', kiln: 'Kiln', mill: 'Millrace', belfry: 'Belfry', slumber: 'Slumberhouse', marionette: 'Marionette Hall' };
/* whose thread each Knot's room is wound with, by cell (the top, the Climb and the Winding Room above the Foot, up the
   middle; a Knot's room either side of each of the lower three) */
const GS_ROOM_HOUSE = { '0,3': 'tidy', '2,3': 'kiln', '0,2': 'mill', '2,2': 'belfry', '0,1': 'slumber', '2,1': 'marionette' };
const GREAT_ENTRY = { x: 29, y: 41 };
const GS_SAY = { tidy: "Mother Ives's teal thread", kiln: "Bram's ochre thread", mill: "Your dad's blue thread", belfry: "Your mum's brass thread", slumber: "Doctor Mallow's lavender thread", marionette: "Jory's crimson thread" };
defHouse({
    id: 'greatspool', name: 'The Great Spool', place: 'The Great Spool', house: 'greatspool', theme: 'spool', thread: THREAD.hesper,
    music: () => SONGS.greatspool ? 'greatspool' : 'pull',
    entry: GREAT_ENTRY, pull: true,
    themeAt: (tx, ty) => { const h = GS_ROOM_HOUSE[Math.floor(tx / 20) + ',' + Math.floor(ty / 11)]; return h ? 'spool_' + h : 'spool'; },
    legend: { 'O': { k: 'crawl', p: 'wall', ent: 'crawlhole' }, 'U': { k: 'arch', p: 'arch' } },
    cells: {
        /* ---------------- the foot of the Well: things come tumbling down after you, and none stays where it lands ---------------- */
        '1,3': {
            name: 'The Foot of the Well',
            rows: ['#########.##########', '#..................#', '#....#.............#', '#..................#', '#..................#', '....................', '#..................#', '#..................#', '#..................#', '#..................#', '####################'],
            ents: [
                { k: 'plate', x: 5, y: 3, sig: 'gsFp' },
                { k: 'door', x: 9, y: 0, type: 'gate', when: 'gsFp', dir: 'h', passed: 'up', id: 'gsFGate' },
                { k: 'crate', x: 8, y: 7, id: 'gsFCrate' },
                { k: 'sign', x: 13, y: 9, text: "Six Knots, tied in six rooms round the Spool's foot: the Wander's, every one you tied. A seventh place waits at the top, an empty peg, for the Wanderer's own." },
            ],
            nudge: { solved: 'greatspool_gsFGate', after: 60 * 100, at: [5, 3], say: 'A thread in the wall twitches over the plate, in the lee of the pillar.' },
        },
        /* ---------------- the Tidyhouse's Knot: the drum lays a thing back the moment its place is clear ---------------- */
        '0,3': {
            name: 'The Airing Cupboard',
            rows: ['####################', '#...#..............#', '#..................#', '#####..............#', '#..................#', '#...................', '#............#.#...#', '#............#.#...#', '#............###...#', '#..................#', '####################'],
            ents: [
                { k: 'knotlock', x: 2, y: 1, house: 'tidy' },
                { k: 'door', x: 4, y: 2, type: 'gate', when: 'gsTp', dir: 'v', passed: 'left', id: 'gsTGate' },
                { k: 'plate', x: 14, y: 7, sig: 'gsTp' },
                /* (patient: time to put the slot behind you and ring from across the room, out of its hearing) */
                { k: 'block', x: 16, y: 3, style: 'wood', id: 'gsTBlock', patience: 300 },
                /* the old mangle: it lives at the top of the slot, and it's asleep across the room */
                { k: 'block', x: 14, y: 6, id: 'gsTMangle', look: 'gs_mangle', sleeper: true, tiedOff: true, resetSleep: 'untie:tidy', startAt: [9, 3], trace: [[14, 6], [14, 5], [13, 5], [12, 5], [11, 5], [10, 5], [9, 5], [9, 4], [9, 3]], noPush: true, pushLine: "The old mangle, fast asleep where somebody left it. It won't budge for anything but a bell." },
                { k: 'ratchet', x: 18, y: 4 },
                { k: 'sign', x: 17, y: 9, text: "A laundry ticket in Mother Ives's hand: MANGLE. LIVES AT THE TOP OF THE SLOT. BACK ON ITS PEG BY SUPPER, PLEASE." },
                { k: 'gsdeco', x: 6, y: 1, look: 'gs_line', solid: false, baseY: -60 }, { k: 'gsdeco', x: 11, y: 1, look: 'gs_line', solid: false, baseY: -60 },
                { k: 'gsdeco', x: 2, y: 9, look: 'gs_basket' }, { k: 'gsdeco', x: 17, y: 7, look: 'gs_press' },
            ],
            nudge: { solved: 'untie:tidy', after: 60 * 150, at: [14, 6], say: GS_SAY.tidy + " twitches at the top of the slot: the old mangle's place." },
        },
        /* ---------------- the Kiln's Knot: the pieces fly north from where the pot breaks; only a puppet hangs where it must ---------------- */
        '2,3': {
            name: 'The Glazing Gallery',
            rows: ['####################', '#####oooooooooooooo#', '#####oooooooooooooo#', '#####oo#ooooooooooo#', '#....oooooooooooooo#', '.....oooooooooooooo#', '#....oooooooooooooo#', '#..............#...#', '#..................#', '#..............#...#', '####################'],
            ents: [
                { k: 'pot', x: 2, y: 8, id: 'gsKPot' },
                { k: 'puppet', x: 11, y: 8, id: 'gsKPuppet', look: 'gs_clay' },
                { k: 'gscharm', x: 5, y: 4, seq: 'gsKs', order: 0, col: 'sun', id: 'gsKSun' },
                { k: 'gscharm', x: 6, y: 2, seq: 'gsKs', order: 1, col: 'moon', id: 'gsKMoon' },
                { k: 'gscharm', x: 6, y: 1, seq: 'gsKs', order: 2, col: 'star', id: 'gsKStar' },
                { k: 'gscharm', x: 6, y: 5, spoils: 'gsKs', col: 'ember', cracked: true, id: 'gsKCrack' },
                { k: 'door', x: 15, y: 8, type: 'gate', when: 'gsKs', dir: 'v', passed: 'right', id: 'gsKGate' },
                { k: 'knotlock', x: 17, y: 8, house: 'kiln' },
                { k: 'ratchet', x: 1, y: 7 },
                { k: 'sign', x: 3, y: 9, text: "Chalked on a kiln shelf in Bram's hand: SUN. MOON. STAR. (In that order. Always in that order.)" },
                { k: 'gsdeco', x: 8, y: 9, look: 'gs_kilnshelf' }, { k: 'gsdeco', x: 13, y: 9, look: 'gs_kilnshelf' },
            ],
            nudge: { solved: 'untie:kiln', after: 60 * 150, at: [7, 4], say: GS_SAY.kiln + ' twitches out over the drop, just under the post.' },
        },
        /* ---------------- the hub: the Winding Room ---------------- */
        '1,2': {
            name: 'The Winding Room',
            rows: ['#########.##########', '#..................#', '#..................#', '#..................#', '#..................#', '....................', '#..................#', '#..................#', '#..................#', '#..................#', '#########.##########'],
            ents: [
                { k: 'deco', x: 7, y: 2, look: 'spoolpost', solid: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]], text: 'The foot of the Great Spool: a drum of thread as wide as a house, every colour, turning, and every turn a little tighter.' },
            ],
        },
        /* ---------------- the Millrace's Knot: the river keeps a loose float till it runs out; then the Pull takes it up ---------------- */
        '0,2': {
            name: 'The Mill-Leat',
            rows: ['####################', '#~~~~~~~~~~~~~~~~..#', '#~~~~#~~~~~~~~~~~..#', '#~~~~~~~~~~~...~~..#', '#~~~~~~~~~~~...~~..#', '#~~~~~~~~~~~~~~~~...', '#####<<<<<<~~~~~~..#', '########...~~~~~~..#', '#..................#', '#...#..............#', '####################'],
            ents: [
                { k: 'wheel', x: 4, y: 3, face: 'right', mode: 'hold', sig: 'gsMw', id: 'gsMWheel' },
                { k: 'raft', x: 13, y: 5, id: 'gsMRaft' },
                { k: 'door', x: 4, y: 8, type: 'gate', when: 'gsMw', dir: 'v', passed: 'left', id: 'gsMGate' },
                { k: 'knotlock', x: 2, y: 8, house: 'mill' },
                { k: 'ratchet', x: 18, y: 8 },
                { k: 'sign', x: 8, y: 9, text: "Your dad's hand, on a board by the jetty: THE LEAT RUNS TILL SOMETHING STOPS IT. (The wheel only turns while something sits on its water.)" },
                { k: 'gsdeco', x: 13, y: 3, look: 'gs_millhouse', solid: [[0, 0]] },
            ],
            nudge: { solved: 'untie:mill', after: 60 * 150, at: [10, 6], say: GS_SAY.mill + ' twitches at the head of the leat, by the jetty.' },
        },
        /* ---------------- the Belfry's Knot: a gale nobody walks through; a boulder asleep beyond it; woken, it goes north ---------------- */
        '2,2': {
            name: 'The Gale Loft',
            rows: ['####################', '#..............#...#', '#..............#...#', '#..................#', '#..............#####', '...................#', '#..................#', '#..................#', '#..................#', '#..................#', '####################'],
            ents: [
                { k: 'gust', x: 6, y: 1, w: 4, h: 9, dir: 'left', period: 60, len: 60, force: 1.6, beats: true, id: 'gsBGale' },
                { k: 'vane', x: 3, y: 2, gust: 'gsBGale' },
                /* the boulder, asleep in the far corner; its own place is out by the middle */
                { k: 'block', x: 12, y: 6, id: 'gsBBoulder', look: 'boulder_b', sleeper: true, tiedOff: true, resetSleep: 'untie:belfry', startAt: [14, 8], trace: [[12, 6], [13, 6], [13, 7], [14, 7], [14, 8]], noPush: true, pushLine: "A boulder fast asleep. It won't budge for anything but a bell." },
                /* an old bell asleep on the frame over the plate */
                { k: 'block', x: 11, y: 1, id: 'gsBBell', look: 'gs_oldbell', sleeper: true, tiedOff: true, resetSleep: 'untie:belfry', startAt: [14, 1], trace: [[11, 1], [12, 1], [13, 1], [14, 1]], noPush: true, pushLine: "An old cracked bell, asleep on the frame. It won't budge for anything but a ring." },
                { k: 'plate', x: 14, y: 2, sig: 'gsBp', minWeight: WEIGHT.heavy, look: 'iron' },
                { k: 'door', x: 15, y: 3, type: 'gate', when: 'gsBp', dir: 'v', passed: 'right', id: 'gsBGate' },
                { k: 'knotlock', x: 17, y: 2, house: 'belfry' },
                { k: 'ratchet', x: 1, y: 7 },
                { k: 'sign', x: 2, y: 9, text: "Your mum's hand, on a ringing card pinned up by the door: TUESDAY PRACTICE, SIX SHARP. BRING A SCARF. (IT'S DRAUGHTY.)" },
                { k: 'gsdeco', x: 17, y: 9, look: 'gs_handbells', solid: [[0, 0], [1, 0]], text: "Handbells laid out for practice, mouths down on a brass-coloured cloth, so they won't ring by themselves." },
            ],
            nudge: { solved: 'untie:belfry', after: 60 * 150, at: [12, 6], say: GS_SAY.belfry + " twitches across the draught, at the boulder's empty place." },
        },
        /* ---------------- the climb: Slumberhouse west, Marionette Hall east, the top north; once every Knot's undone, the Pull throws things across it ---------------- */
        '1,1': {
            name: 'The Climb',
            rows: ['#########.##########', '#..................#', '#..................#', '#..................#', '#..................#', '....................', '#..................#', '#..................#', '#..................#', '#..................#', '#########.##########'],
            ents: [
                { k: 'door', x: 9, y: 0, type: 'gate', when: 'flag:spool_all', dir: 'h', id: 'gsTop' },
                { k: 'sign', x: 11, y: 9, text: 'UP: THE SPOOL. (The way opens when every Knot is undone.)' },
                /* (four lanes on one beat, staggered: a train of six nose to tail from one end, then a clear spell; between the
                   lanes, rows nothing crosses. Staggered so that walking straight up without looking is caught most of the way) */
                { k: 'junklane', x: 18, y: 2, dir: -1, period: 96, phase: 32 }, { k: 'junklane', x: 1, y: 4, dir: 1, period: 96, phase: 80 },
                { k: 'junklane', x: 18, y: 6, dir: -1, period: 96, phase: 32 }, { k: 'junklane', x: 1, y: 8, dir: 1, period: 96, phase: 0 },
            ],
        },
        /* ---------------- the Slumberhouse's Knot: the arch is too low to ride under; send your place, then go home to it ---------------- */
        '0,1': {
            name: 'The Night Ferry',
            rows: ['####################', '##########.........#', '#....~.............#', '#....~....#........#', '#####U#####........#', '#~~~~~..............', '#~~~~~~~~~~~~......#', '#~~~~~~~~~~~~......#', '#~~~~~~~~~~~~......#', '#~~~~~~~~~~~~......#', '####################'],
            ents: [
                { k: 'raft', x: 12, y: 7, id: 'gsSRaft' },
                { k: 'knotlock', x: 6, y: 3, house: 'slumber' },
                { k: 'lever', x: 9, y: 3, id: 'gsSLever', sig: 'gsSl' },
                { k: 'door', x: 10, y: 2, type: 'gate', when: 'gsSl', dir: 'v', passed: 'right', id: 'gsSGate' },
                { k: 'deco', x: 2, y: 2, look: 'bed', solid: [[0, 0], [0, 1]], oy: 0, baseY: 30, text: "Doctor Mallow's spare bed, turned down and waiting, a hot-water bottle in it gone cold." },
                { k: 'nightlight', x: 3, y: 1 }, { k: 'nightlight', x: 7, y: 1 },
                { k: 'ratchet', x: 18, y: 6 },
                { k: 'sign', x: 15, y: 9, text: "A card in Doctor Mallow's hand: LIGHTS OUT AT EIGHT. NO RIDING THE FERRY TO BED. (The bedroom's through the arch. Mind your heads.)" },
            ],
            nudge: { solved: 'untie:slumber', after: 60 * 150, at: [5, 5], say: GS_SAY.slumber + ' twitches under the arch: something floating there by itself would go under.' },
        },
        /* ---------------- the Marionette Hall's Knot: the understudy can't shift the painted rock; rung, it can ---------------- */
        '2,1': {
            name: 'The Prompt Box',
            rows: ['####################', '#..........#####.#.#', '#..........#####.#.#', '#..........##.##.#.#', '#..........#...#.#.#', '...........O...#.#.#', '#..........#...#...#', '#..........#####.#.#', '#................#.#', '#................#.#', '####################'],
            ents: [
                { k: 'puppet', x: 4, y: 8, id: 'gsPuppet' },
                { k: 'block', x: 13, y: 4, style: 'wood', look: 'gs_rock', id: 'gsMRock' },
                { k: 'plate', x: 13, y: 3, sig: 'gsMp' },
                { k: 'door', x: 17, y: 6, type: 'gate', when: 'gsMp', dir: 'v', passed: 'right', id: 'gsMaGate' },
                { k: 'knotlock', x: 18, y: 2, house: 'marionette' },
                { k: 'ratchet', x: 1, y: 7 },
                { k: 'sign', x: 8, y: 9, text: "Pencilled on the prompt box in Jory's hand: QUIET IN THE BOX. THE ROCK STAYS ON ITS MARK. (IT'S PAINTED. IT'S VERY HEAVY PAINT.)" },
                { k: 'gsdeco', x: 1, y: 9, look: 'gs_rail', solid: [[0, 0], [1, 0]], text: "A rail of costumes for a show that never opened: a crimson cape, a gold doublet, a blue gown, every one with JORY stitched in its collar." },
                { k: 'gsdeco', x: 5, y: 9, look: 'gs_ghostlight', text: "A ghost light: one bare bulb on a stand, left burning on an empty stage so nobody falls off it in the dark." },
                { k: 'gsdeco', x: 12, y: 9, look: 'gs_flats', solid: [[0, 0], [1, 0]] },
            ],
            nudge: { solved: 'untie:marionette', after: 60 * 150, at: [13, 5], say: GS_SAY.marionette + ' twitches inside the prompt box, under the painted rock.' },
        },
        /* ---------------- the top: the Spool itself, Gran, the six great threads, in three pairs (SpoolTop, below) ---------------- */
        '1,0': {
            name: 'The Top of the Spool',
            rows: ['####################', '#..................#', '#..................#', '#..................#', '#..................#', '#..................#', '#..................#', '#..................#', '#..................#', '#..................#', '#########.##########'],
            ents: [
                { k: 'greatspool', x: 8, y: 1, id: 'theSpool' },
                { k: 'greatpost', x: 1, y: 2, house: 'tidy' }, { k: 'greatpost', x: 18, y: 2, house: 'kiln' }, { k: 'greatpost', x: 1, y: 5, house: 'mill' },
                { k: 'greatpost', x: 18, y: 5, house: 'belfry' }, { k: 'greatpost', x: 1, y: 8, house: 'slumber' }, { k: 'greatpost', x: 18, y: 8, house: 'marionette' },
                /* things on their shelves, for the Pull to drag */
                { k: 'crate', x: 6, y: 9, id: 'gsCrateA' }, { k: 'crate', x: 13, y: 9, id: 'gsCrateB' }, { k: 'crate', x: 4, y: 9, id: 'gsCrateC' }, { k: 'crate', x: 15, y: 9, id: 'gsCrateD' },
            ],
        },
    },
});
/* each room's own way the threads run (all up, toward the drum) and, at the top, the drum itself */
{
    const d = AREAS.greatspool;
    for (const r of d.rooms) { const c = d.cells[r.key]; r.pull = c && c.pull !== undefined ? dirByName(c.pull) : UP; r.house = GS_ROOM_HOUSE[r.key] || null; }
    d.build = a => { const s = a.find('theSpool'), r = s && a.roomAt(s.tx, s.ty); if (r) r.drum = { tx: s.tx, ty: s.ty }; SpoolTop.apply(a); };
}

/* the room's brake: a ratchet on the wall by the door */
class Ratchet extends GridThing {
    constructor(tx, ty, p = {}) { super('ratchet', tx, ty, Object.assign({ weight: WEIGHT.fixed, fixed: true, marked: false, hookable: false, noCut: true }, p)); this.t = 0; }
    interact() {
        const a = this.area, r = a.roomAt(this.tx, this.ty);
        this.t = 30; Sfx.play('click'); Sfx.play('twang'); G.shake = 3;
        const n = Pull.reset(a, r);
        if (!Progress.flag('ratchet_told')) { Progress.set('ratchet_told'); UI.toast("The drum's brake. You haul on it, and the drum takes up everything in here that's out of its place, and lays it back where it belongs.", 220); }
        else if (!n) UI.toast('Everything in here is already in its place.', 90);
        return true;
    }
    update() { if (this.t > 0) this.t--; }
    sprite() { return spr(this.t > 0 ? 'gs_ratchet_on' : 'gs_ratchet'); }
}
SPAWN.ratchet = (x, y, p) => new Ratchet(x, y, p);
/* a decoration of the Spool's own (its picture painted in src/75b_spool_art.js; solid as given) */
SPAWN.gsdeco = (x, y, p) => SPAWN.deco(x, y, p);

/* a charm of the Kiln's Knot: three in an order (sun, moon, star) and a cracked one that spoils it. Struck in the
   wrong order (or the cracked one struck), they all go dark; a sun struck then starts it again */
class SpoolCharm extends Charm {
    constructor(tx, ty, p = {}) { super(tx, ty, Object.assign({ mode: 'gs' }, p)); this.mode = 'gs'; }
    strike(by) {
        if (this.cool > 0) return;
        super.strike(by);
        GSeq.hit(this);
    }
    draw(cx, cy) { super.draw(cx, cy); if (this.cracked) SpoolArt.crack(this, cx, cy); }
}
SPAWN.gscharm = (x, y, p) => new SpoolCharm(x, y, p);
const GSeq = {
    hit(c) {
        const a = c.area, name = c.spoils || c.seq;
        if (Progress.areaFlag(a.id, 'seq:' + name)) return;
        const st = a.gseq = a.gseq || {}, all = a.ents.filter(e => e.kind === 'charm' && e.seq === name);
        const want = st[name] || 0;
        if (!c.spoils && c.order === want) {
            st[name] = want + 1; c.on = true;
            if (st[name] >= all.length) { Progress.setAreaFlag(a.id, 'seq:' + name); Sfx.play('appear'); }
            return;
        }
        for (const e of all) e.on = false;
        st[name] = 0; Sfx.play('unclick'); Fx.text(c.x + 8, c.y - 12, '...', PAL.grey2);
        if (!c.spoils && c.order === 0) { st[name] = 1; c.on = true; }
    },
};
/* an iron plate: only something heavy sinks it */
{
    const draw0 = Plate.prototype.draw;
    Plate.prototype.draw = function (cx, cy) {
        draw0.call(this, cx, cy);
        if (this.look === 'iron') { const x = this.x - cx, y = this.y - cy + (this.down ? 1 : 0); Gfx.rect(x + 3, y + 4, 10, 1, '#5a5264'); Gfx.rect(x + 3, y + 10, 10, 1, '#5a5264'); Gfx.rect(x + 3, y + 4, 1, 7, '#5a5264'); Gfx.rect(x + 12, y + 4, 1, 7, '#5a5264'); Gfx.rect(x + 7, y + 6, 2, 3, '#7f7688'); }
    };
}

/* a Knot of the Wander, tied into the Spool: untie it */
class KnotLock extends GridThing {
    constructor(tx, ty, p = {}) { super('knotlock', tx, ty, Object.assign({ weight: WEIGHT.fixed, fixed: true, marked: false, hookable: false, noNeedle: true, noCut: true, noCutLine: "It isn't a thread to cut. It's a Knot. Knots are undone with fingers." }, p)); }
    get undone() { return Progress.flag('untie:' + this.house); }
    interact() {
        if (this.undone) { UI.toast('Undone. Its thread hangs slack.'); return true; }
        const h = this.house;
        Script.run(function* () {
            const i = yield* ask(null, `The ${HOUSE_NAMES[h]}'s Knot: the one you tied, pulled tight into the Spool's own thread. Untie it?`, ['Untie it', 'Not yet']);
            if (i !== 0) return;
            Progress.set('untie:' + h); Sfx.play('unclick'); Sfx.play('knot'); G.shake = 6; Stats.count('untied');
            const n = KNOT_HOUSES.filter(k => Progress.flag('untie:' + k)).length;
            yield* say(null, n < 6 ? `It comes undone in your fingers, and somewhere above, the Spool shudders and slows. (${n} of 6.)` : 'The sixth Knot comes undone. Overhead, the Great Spool groans, and stops turning, and for the first time in your life there is no sound of winding anywhere.');
            if (n >= 6) { Progress.set('spool_all'); Progress.setGoal('Up the Climb to the top of the Spool. Gran is there.'); }
            else Progress.setGoal(`Untie the Knots of the Wander, in the rooms round the Spool's foot (${n} of 6).`);
            Save.autosave();
        });
        return true;
    }
    draw(cx, cy) { SpoolArt.knot(this, cx, cy); }
}
SPAWN.knotlock = (x, y, p) => new KnotLock(x, y, p);

/* ---------------- the top: the Spool, its six great threads, Gran ----------------
   The six great threads come down in three pairs, the lowest first, and after each pair Gran changes the room:
   1. the crates. She has the four higher threads wound round her hands (held things wait: drag what you like along one,
      it won't give); the lowest two run free to the drum. Anything out of its place lying under a free one, or wound
      north across one, is dragged along it into the drum (and spat back onto its shelf after), and the thread sags a
      moment: cut it then.
   2. her own junk. She winds the crates up into the drum and keeps them there, lets the middle two run free, and
      throws things off the drum at wherever you're standing (its shadow first). One lies where it lands a little while,
      then she has it back; come down on a free thread, it's dragged along it like anything else.
   3. the dark. She lets the last two run free and pulls the floor up from under them into the drum, and she needs
      both hands for that, so the crates come back down onto their shelves. Nothing can lie on those two now; but a
      thing being wound north hangs on its thread over the dark, as it would anywhere, and wound across one of them,
      it's dragged along it.
   Linnet's bracelet, shown to her: she stops throwing (the room goes quiet) and lets the middle pair go herself, or the
   last pair if the middle's gone. Saved: the threads cut (`great:<house>`) and how far she's changed the room (`gs_s1`,
   `gs_s2`); everything else is worked out from those. */
const SPOOL_PAIRS = [['slumber', 'marionette'], ['mill', 'belfry'], ['tidy', 'kiln']];
/* what she throws: things of the valley's she's already wound in */
const JUNK_LOOKS = ['basket', 'parcel', 'barrel_g', 'toyblock', 'guild_crate'];
const SPOOL_TOSS = { tell: 34, wait: 45, life: 150 };
const SpoolTop = {
    /* the floor that goes from under the last two (room tiles: the top two rows either side of the drum, but the posts) */
    DARK: [],
    pairOf(h) { return SPOOL_PAIRS.findIndex(q => q.includes(h)); },
    done(i) { return SPOOL_PAIRS[i].every(h => Progress.flag('great:' + h)); },
    /* the first pair still standing (3 once all six are cut) */
    stage() { for (let i = 0; i < 3; i++) if (!this.done(i)) return i; return 3; },
    /* the highest pair she's let run free to the drum */
    freed() { return Progress.flag('gs_s2') ? 2 : Progress.flag('gs_s1') ? 1 : 0; },
    quiet() { return Progress.flag('bracelet_top'); },
    throwing() { return this.stage() === 1 && this.freed() === 1 && !this.quiet(); },
    room(a) { return a.rooms.find(q => q.key === '1,0'); },
    crates(a) { const r = this.room(a); return a.ents.filter(e => e.kind === 'crate' && e.ret && !e.removed && a.roomAt(e.ret.mx, e.ret.my) === r); },
    goal() { return `Cut the Spool's great threads, at their posts round the walls (${KNOT_HOUSES.filter(h => Progress.flag('great:' + h)).length} of 6). Too taut to cut, unless something knocks one slack.`; },
    /* the room as she's left it (built afresh: a load, or back up the Climb) */
    apply(a) {
        if (Progress.flag('unwound')) return;
        const r = this.room(a); if (!r) return;
        if (Progress.flag('gs_s2')) for (const [x, y] of this.DARK) a.setCell(r.x + x, r.y + y, 'o');
        else if (Progress.flag('gs_s1')) for (const e of this.crates(a)) this.stow(e);
    },
    /* a crate up in the drum, and kept there */
    stow(e) {
        const a = e.area;
        if (e.mv) { a.unplace(e, e.mv.fx, e.mv.fy); e.mv = null; }
        a.unplace(e, e.tx, e.ty); e.pendingHome = false; e.stowed = true; e.hiddenYank = true; e.inert = true;
        e.tx = -10; e.ty = -10; e.x = -160; e.y = -160;
    },
    /* ...and let down onto its shelf again, the moment the shelf's clear */
    unstow(e) { e.stowed = false; e.hiddenYank = false; e.inert = false; Return.sendHome(e); },
    /* two great threads out of her hands, up to the drum */
    loose(a, i) {
        for (const e of a.ents) if (e.kind === 'greatpost' && SPOOL_PAIRS[i].includes(e.house) && !e.cut) Fx.ring(e.tx * T + 8, e.ty * T - 6, KNOT_COL[e.house]);
        Sfx.play('twang'); G.shake = Math.max(G.shake, 4);
    },
    /* everything she's thrown, back up into the drum, and no more coming */
    hush(a) {
        const s = a.find('theSpool');
        if (s) { s.toss = null; s.junk = s.junk.filter(j => j.thing); }
        for (const e of a.ents.filter(e => e.kind === 'gsjunk')) e.takeBack();
    },
    /* after the first pair: the crates up into the drum, the middle two let go to the drum, and she starts throwing */
    *changeCrates() {
        const a = G.map, p = G.player, s = a.find('theSpool');
        if (p.carry && p.carry.kind === 'crate') p.dropCarry();
        if (p.grip) p.release();
        yield 24;
        yield* say('gran', "{cross}No. No more of that.");
        for (const e of this.crates(G.map)) {
            if (e.stowed) continue;
            if (!e.hiddenYank) Pull.fx.push({ im: e.sprite(), x: e.tx * T, y: e.ty * T, col: e.ret.color, t: 0 });
            this.stow(e); Sfx.play('twang', 0.5);
            yield 8;
        }
        yield 16;
        Progress.set('gs_s1'); this.loose(G.map, 1);
        yield 30;
        yield* say('gran', "{worried}Keep back from them, love. Please.");
        if (s) s.tossWait = 30;
        Progress.setGoal(this.goal());
        Save.autosave();
    },
    /* after the second: the last two let go, and the floor under them up into the drum, board by board; she needs both
       hands for it, so no more throwing, and the crates come back down */
    *changeDark() {
        const a = G.map, p = G.player, r = this.room(a);
        if (p.grip) p.release();
        if (p.carry && p.carry.kind === 'gsjunk') p.carry.takeBack();
        this.hush(a);
        yield 24;
        /* (anybody standing where the floor's going steps off it first; a Bedroll laid there turns up in her pack) */
        const going = (x, y) => this.DARK.some(([u, v]) => r.x + u === x && r.y + v === y);
        if (going(p.tx, p.ty)) yield* walkTo(p, p.tx, r.y + 3);
        if (Inv.bedroll && Inv.bedroll.area === a.id && going(Inv.bedroll.tx, Inv.bedroll.ty)) Bedroll.lost('Your Bedroll went down into the dark with the floor... and turned up, rolled, in your pack.');
        Progress.set('gs_s2'); this.loose(a, 2);
        yield 24;
        G.shake = 4; Sfx.play('rumble');
        const order = this.DARK.slice().sort((u, v) => (Math.abs(u[0] - 9.5) - Math.abs(v[0] - 9.5)) || (v[1] - u[1]));
        for (let i = 0; i < order.length; i++) {
            const x = r.x + order[i][0], y = r.y + order[i][1];
            a.setCell(x, y, 'o');
            const o = a.at(x, y); if (o && !o.fixed && !o.mv && o.landed) o.landed(false);
            Pull.fx.push({ im: spr('gs_board'), x: x * T, y: y * T, col: THREAD.hesper, t: 0 });
            if (i % 3 === 0) Sfx.play('push', 0.4);
            G.shake = Math.max(G.shake, 2);
            yield 3;
        }
        yield 20;
        for (const e of this.crates(a)) if (e.stowed) { this.unstow(e); yield 8; }
        yield 24;
        yield* say('gran', "{sad}There. Nothing can lie on them now.");
        Progress.setGoal(this.goal());
        Save.autosave();
    },
};
for (const y of [1, 2]) for (let x = 1; x <= 18; x++) if ((x <= 7 || x >= 12) && !((x === 1 || x === 18) && y === 2)) SpoolTop.DARK.push([x, y]);

class GreatPost extends GridThing {
    constructor(tx, ty, p = {}) { super('greatpost', tx, ty, Object.assign({ weight: WEIGHT.fixed, fixed: true, marked: false, hookable: false, noNeedle: true }, p)); this.cuttable = true; this.slack = 0; }
    get cut() { return Progress.flag('great:' + this.house); }
    /* still wound round Gran's hand: it won't give, whatever's dragged along it */
    get held() { return !this.cut && SpoolTop.pairOf(this.house) > SpoolTop.freed(); }
    /* where its thread meets the drum: low on the drum's near side */
    get end() { const s = this.area.find('theSpool'); return s ? [this.tx < s.tx ? s.tx - 1 : s.tx + 4, s.ty + 1] : [this.tx, this.ty]; }
    /* the tiles its thread runs over, from beside the post to the drum */
    get tiles() {
        if (this._tiles) return this._tiles;
        const [x1, y1] = this.end, out = [], n = Math.max(Math.abs(x1 - this.tx), Math.abs(y1 - this.ty));
        for (let i = 1; i < n; i++) { const x = Math.round(this.tx + (x1 - this.tx) * i / n), y = Math.round(this.ty + (y1 - this.ty) * i / n); if (!out.some(([u, v]) => u === x && v === y)) out.push([x, y]); }
        return (this._tiles = out);
    }
    under(x, y) { return !this.cut && !this.held && this.tiles.some(([u, v]) => u === x && v === y); }
    update() { if (this.slack > 0) this.slack--; }
    onCut() {
        if (this.cut || !Progress.flag('spool_met')) return;
        if (this.held) { Sfx.play('hitthing'); UI.toast("Gran has this one wound round her hand. It won't give.", 160); return; }
        /* the Spool keeps its threads taut: the Shears only bite one that something's just been dragged along */
        if (this.slack <= 0) { Sfx.play('hitthing'); UI.toast(Progress.flag('taut_told') ? 'Too taut.' : 'Too taut: the Shears skid right off it. It hums, pulled tight as a bowstring toward the drum.', 200); Progress.set('taut_told'); return; }
        Progress.set('great:' + this.house); Sfx.play('snip'); G.shake = 8; Fx.ring(this.tx * T + 8, this.ty * T, KNOT_COL[this.house]);
        const n = KNOT_HOUSES.filter(h => Progress.flag('great:' + h)).length;
        if (n >= 6) Script.run(GreatSpool.finale(), { name: 'finale' });
        else { UI.toast(`A great thread parts with a sound like a bell cracking. (${n} of 6.)`, 120); Progress.setGoal(SpoolTop.goal()); Save.autosave(); }
    }
    draw(cx, cy) { SpoolArt.post(this, cx, cy); }
}
SPAWN.greatpost = (x, y, p) => new GreatPost(x, y, p);

/* something Gran's thrown: a thing of the valley's she'd already wound in, marked to nowhere in this room. It lies where
   it lands a while (lift it, push it, knock it with the stick, as anything light) and then she has it back */
class SpoolJunk extends Liftable {
    constructor(tx, ty, p = {}) { super('gsjunk', tx, ty, Object.assign({ marked: false }, p)); this.life = SPOOL_TOSS.life; }
    sprite() { return spr(this.look) || spr('crate'); }
    tick() {
        if (this.carried || this.heldBy || this.flying || this.mv || this.hookPulled) { this.life = Math.max(this.life, 40); return; }
        if (Script.blocking()) return;
        if (--this.life <= 0) this.takeBack();
    }
    /* back up into the drum */
    takeBack() {
        if (this.removed) return;
        const a = this.area, p = G.player;
        if (p && p.carry === this) { p.carry = null; this.carried = false; this.heldBy = null; }
        if (p && p.grip === this) p.release();
        Thrown.list = Thrown.list.filter(t => t.o !== this);
        if (a === G.map) { Pull.fx.push({ im: this.sprite(), x: this.px, y: this.py, col: THREAD.hesper, t: 0 }); Sfx.play('twang', 0.4); }
        a.remove(this);
    }
    /* (into the dark: the drum has it at once) */
    onLost() { this.takeBack(); }
    draw(cx, cy) { if (!this.carried) SpoolArt.thrown(this, cx, cy); }
}

class SpoolDrum extends Ent {
    constructor(tx, ty, p = {}) { super('greatspool', p); this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T; this.t = 0; this.junk = []; this.toss = null; this.tossWait = 60; }
    get sortY() { return this.y + 40; }
    onAdd(area) { for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) area.staticSolid.add((this.ty + j) * 4096 + this.tx + i); }
    update() {
        this.t++;
        const p = G.player, a = this.area;
        if (!Progress.flag('spool_met') || Progress.flag('unwound') || Script.blocking()) return;
        const top = a.roomAt(this.tx, this.ty);
        /* the Pull: a thing out of its place lying under a free great thread (or being wound in across one: they're the
           Pull's own lines) is dragged along it into the drum, and the thread goes slack a moment; the Spool spits the
           thing back onto its shelf after (what she threw, she keeps). Held, it waits; people are never dragged */
        const posts = a.ents.filter(e => e.kind === 'greatpost' && !e.cut && !e.held);
        for (const e of a.ents) {
            if (!e.isGrid || e.removed || e.carried || e.flying || e.pendingHome || e.hiddenYank || e.person || e.kind === 'greatpost' || a.roomAt(e.tx, e.ty) !== top) continue;
            const junk = e.kind === 'gsjunk';
            if (!junk && (!e.ret || e.ret.state === 'home')) { e.yankT = 0; continue; }
            const hit = posts.filter(q => q.under(e.tx, e.ty));
            if (!hit.length) { e.yankT = 0; continue; }
            if (e.heldBy) continue;
            if ((junk || e.ret.state !== 'returning') && (e.mv || ++e.yankT < 24)) continue;
            e.yankT = 0;
            if (e.mv) { a.unplace(e, e.mv.fx, e.mv.fy); e.mv = null; }
            for (const q of hit) { q.slack = 300; Sfx.play('twang'); Fx.ring(q.tx * T + 8, q.ty * T, KNOT_COL[q.house]); }
            const [ex, ey] = hit[0].end;
            this.junk.push({ x: e.tx * T + 8, y: e.ty * T + 8, tx: ex * T + 8, ty: ey * T + 8, thing: e });
            a.unplace(e, e.tx, e.ty); e.hiddenYank = true; e.inert = true; e.tx = -10; e.ty = -10; e.x = -160; e.y = -160;
            if (!Progress.flag('slack_seen')) { Progress.set('slack_seen'); G.pendingToast = 'The Pull drags it along the great thread into the drum, and the thread goes slack behind it, sagging. Just for a moment.'; }
        }
        /* the second pair: she throws at you */
        if (SpoolTop.throwing()) this.throws(a, p, top);
        else this.toss = null;
        /* the first: things come off the walls into the drum, high over your head */
        if (SpoolTop.stage() === 0 && !SpoolTop.quiet() && this.t % 200 === 0) {
            const y = top.y + 3 + Math.floor(G.rng() * 6), fromL = G.rng() < 0.5;
            this.junk.push({ x: (fromL ? top.x + 1 : top.x + top.w - 2) * T + 8, y: y * T + 8, tx: (this.tx + 2) * T, ty: (this.ty + 1) * T + 8, look: JUNK_LOOKS[Math.floor(G.rng() * JUNK_LOOKS.length)], high: true });
        }
        for (const j of this.junk) {
            const dx = j.tx - j.x, dy = j.ty - j.y, d = Math.hypot(dx, dy);
            if (d < 4) {
                j.gone = true;
                /* spat back onto its shelf: the moment the shelf is clear, as anything the drum lays back (while Wren or
                   anything else is on it, it hangs over it, waiting); or, hers, kept */
                const e = j.thing;
                if (e && !e.removed) { if (e.kind === 'gsjunk') e.area.remove(e); else if (e.ret && !e.stowed) { e.hiddenYank = false; e.inert = false; Return.sendHome(e); } }
                continue;
            }
            j.x += dx / d * 1.6; j.y += dy / d * 1.6;
        }
        this.junk = this.junk.filter(j => !j.gone);
    }
    /* she throws at wherever you're standing: its shadow on the floor first; landed, it lies a while and she has it back.
       Come down on you, it knocks you about and goes straight back up */
    throws(a, p, top) {
        const t = this.toss;
        if (t) {
            if (++t.t < t.tell) return;
            this.toss = null; this.tossWait = SPOOL_TOSS.wait;
            const x = t.tx * T + 8, y = t.ty * T + 8, j = new SpoolJunk(t.tx, t.ty, { look: t.look });
            G.shake = Math.max(G.shake, 3); Fx.dust(x, y + 4); Sfx.play('land');
            if (p.area === a && p.state === 'normal' && p.onTile(t.tx, t.ty)) { p.hurt(1, x, y - 6); Pull.fx.push({ im: j.sprite(), x: t.tx * T, y: t.ty * T, col: THREAD.hesper, t: 0 }); return; }
            if (a.kind(t.tx, t.ty).pit || !a.freeForThing(t.tx, t.ty, j)) { Pull.fx.push({ im: j.sprite(), x: t.tx * T, y: t.ty * T, col: THREAD.hesper, t: 0 }); return; }
            a.add(j);
            return;
        }
        if (p.area !== a || p.state !== 'normal' || a.roomAt(p.tx, p.ty) !== top || p.ty >= top.y + top.h - 1) return;
        if (--this.tossWait > 0 || a.ents.filter(e => e.kind === 'gsjunk').length >= 2) return;
        this.toss = { tx: p.tx, ty: p.ty, t: 0, tell: SPOOL_TOSS.tell, look: JUNK_LOOKS[Math.floor(G.rng() * JUNK_LOOKS.length)] };
        Sfx.play('warn', 0.7);
    }
    draw(cx, cy) { SpoolArt.drum(this, cx, cy); }
}
SPAWN.greatspool = (x, y, p) => new SpoolDrum(x, y, p);

/* a lane of the Climb: once every Knot is undone, the Pull flings things along it from one end, a train of them at a
   time, on a beat. Every throw shows itself first, as every blow in the valley does: the whole lane lights up, blinking
   faster as it comes, a glow gathers at the end it'll come from, and a warning chirps if it's the lane in front of you.
   One that catches you knocks you back to the start of that lane (the row you came up from), never further, and
   leaves you dazed till that train's gone by (never caught twice by one). Nothing in a lane shelters you: you watch
   it, and go behind a train */
const CLIMB_DAZE = { min: 20, max: 90 };
class JunkLane extends Ent {
    constructor(tx, ty, p = {}) {
        super('junklane', p);
        this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T; this.t = p.phase || 0; this.flying = [];
        this.n = p.n || 6; this.every = p.every || 7; this.speed = p.speed || 2.4; this.tellN = p.tell || 36; this.dazed = 0;
    }
    get sortY() { return this.y + 20; }
    get on() { return Progress.flag('spool_all') && !Progress.flag('unwound'); }
    /* how far into the tell of the next throw (0 till it starts, nearly 1 as the throw comes) */
    get tellK() { const left = this.period - (this.t % this.period); return left <= this.tellN ? 1 - left / this.tellN : 0; }
    /* still flinging this throw's train */
    get throwing() { return this.t % this.period < this.n * this.every; }
    hits(p, x) { return Math.abs(p.x - x) < 10 && Math.abs(p.y - 6 - (this.ty * T + 6)) < 9; }
    update() {
        const p = G.player;
        if (this.dazed > 0 && ++this.dazed > CLIMB_DAZE.min && (this.dazed > CLIMB_DAZE.max || !this.passing(this.dazeX, 22))) { this.dazed = 0; if (p && p.pinned === 'dazed') p.pinned = null; }
        if (!this.on || Script.blocking()) return;
        const a = this.area, r = a.roomAt(this.tx, this.ty), k = ++this.t % this.period;
        /* (the chirp for the lane in front of you only: four at once would be no warning at all) */
        if (k === this.period - this.tellN && p && p.area === a && p.state === 'normal' && Math.abs(p.ty - this.ty - 0.5) <= 1) Sfx.play('warn', 0.6);
        if (k < this.n * this.every && k % this.every === 0) this.flying.push({ x: this.tx * T + 8, k: (Math.floor(this.t / this.period) + k / this.every) % 3 | 0 });
        for (const j of this.flying) {
            j.x += this.dir * this.speed;
            const tx = Math.floor(j.x / T);
            if (a.kind(tx, this.ty).solid || a.roomAt(tx, this.ty) !== r) { j.gone = true; Fx.dust(j.x, this.ty * T + 8); continue; }
            if (p.area === a && p.state === 'normal' && this.hits(p, j.x)) {
                j.gone = true; Sfx.play('hitthing'); G.shake = 6; Fx.dust(p.x, p.y);
                /* back to the start of this lane: the row below it; knocked silly a moment (no walking; a tool still works) */
                const [lx, ly] = p.landingSpot(clamp(p.tx, r.x + 1, r.x + r.w - 2), this.ty + 1);
                p.x = lx * T + 8; p.y = ly * T + 10; p.kx = p.ky = 0; p.unstick(); Fx.poof(p.x, p.y);
                if (!p.pinned) { p.pinned = 'dazed'; this.dazed = 1; this.dazeX = p.x; }
                Fx.text(p.x, p.y - 24, '* * *', '#f7d64a'); Stats.count('climb:hit');
                if (!Progress.flag('junk_hit')) { Progress.set('junk_hit'); G.pendingToast = 'Something flying knocks you clean off your feet, back to the start of the lane.'; }
            }
        }
        this.flying = this.flying.filter(j => !j.gone);
    }
    /* is anything coming past pixel column x in the next n frames, flying now or thrown meanwhile? (what a careful eye
       reads off the lane; the tests' climber reads it too) */
    passing(x, n, w = 13) {
        const x0 = this.tx * T + 8, sp = this.dir * this.speed;
        for (const j of this.flying) for (let f = 0; f <= n; f++) if (Math.abs(j.x + sp * f - x) < w) return true;
        for (let f = 1; f <= n; f++) {
            const k = (this.t + f) % this.period;
            if (k < this.n * this.every && k % this.every === 0) for (let g = 1; f + g - 1 <= n; g++) if (Math.abs(x0 + sp * g - x) < w) return true;
        }
        return false;
    }
    draw(cx, cy) { SpoolArt.lane(this, cx, cy); }
}
SPAWN.junklane = (x, y, p) => new JunkLane(x, y, p);

/* Gran's tally, said to Wren's face at the top (src/80b_tally.js; a save that can't say gets it without a number) */
function granCount() {
    const n = Tally.home();
    if (n === null) return "{sad}...No. Every time you fell this Wander, I brought you home. I can't now.";
    if (!n) return "{sad}...No. Not once this Wander did I have to bring you home. And now I can't.";
    const t = numTimes(n);
    return `{sad}...No. ${t[0].toUpperCase() + t.slice(1)} this Wander I brought you home. I can't now.`;
}

const GreatSpool = {
    /* stepping into the top room: Gran */
    tick(a) {
        const p = G.player, r = Cam.room;
        if (!Progress.flag('gs2')) Progress.set('gs2');
        if (!Progress.flag('spool_all') && !Progress.flag('gs_entered')) { Progress.set('gs_entered'); Progress.setGoal(`Untie the Knots of the Wander, in the rooms round the Spool's foot (${KNOT_HOUSES.filter(k => Progress.flag('untie:' + k)).length} of 6).`); }
        /* the first look: things come down the Well after you, and slide away north into the drum */
        if (!Progress.flag('gs_foot_told') && r && r.key === '1,3' && p.state === 'normal' && !Script.blocking() && !Cam.busy && !World.going) {
            Progress.set('gs_foot_told');
            Script.run(function* () {
                yield 50;
                yield* say(null, 'The foot of the Well. Things come tumbling down the shaft after you, every marked thing in the valley, and none of them stays where it lands.');
            });
        }
        /* stepped off a float just as the river took it on: her feet are on the bank but her shoulders over the water,
           where she can't move; she finds her feet */
        if (p.state === 'normal' && !p.ride && !p.shove && !p.boxFree(p.x, p.y)) {
            const k = a.kind(p.tx, p.ty), cx = p.tx * T + 8, cy = p.ty * T + 10;
            if (!k.solid && !k.deep && p.boxFree(cx, cy)) { p.x = cx; p.y = cy; }
        }
        if (!Progress.flag('spool_met') && r && r.name === 'The Top of the Spool' && p.state === 'normal' && !Script.blocking() && !Cam.busy) Script.run(this.meet());
        /* back after a save: Gran is still at the Spool, the room as she's changed it (each pair cut, she changes it
           again: SpoolTop); and once every great thread's cut, the end goes on */
        if (Progress.flag('spool_met') && !Progress.flag('unwound')) {
            const s = a.find('theSpool'), top = s && a.roomAt(s.tx, s.ty);
            let gran = a.ents.find(e => e.who === 'gran');
            if (s && !gran) gran = a.add(new NPC(s.tx + 1, s.ty + 2, { who: 'gran', face: 'down' }));
            if (gran) gran.noBudge = gran.noPull = true;
            const st = SpoolTop.stage(), here = !!top && r === top && p.state === 'normal' && !Script.blocking() && !Cam.busy;
            /* (an older save that showed her the bracelet, when it let three go: she'd have let the middle pair go) */
            if (SpoolTop.quiet() && !SpoolTop.done(1)) for (const h of SPOOL_PAIRS[1]) Progress.set('great:' + h);
            else if (here && st === 1 && !Progress.flag('gs_s1')) Script.run(SpoolTop.changeCrates(), { name: 'gschange' });
            else if (here && st === 2 && !Progress.flag('gs_s2')) Script.run(SpoolTop.changeDark(), { name: 'gschange' });
            if (here && st >= 3 && !a.climax) Script.run(this.finale(), { name: 'finale' });
            if (a.climax) this.climaxTick(a);
        }
        SpoolArt.tick(a);
    },
    *meet() {
        Progress.set('spool_met');
        const a = G.map, s = a.find('theSpool');
        let gran = a.ents.find(e => e.who === 'gran');
        if (!gran) gran = a.add(new NPC(s.tx + 1, s.ty + 2, { who: 'gran', face: 'down' }));
        gran.noBudge = gran.noPull = true;
        Music.play('pull');
        yield 20;
        yield* say('gran', "{sad}You came back. You walked. I felt you go out past the edge, love, and I pulled, and there was nothing on the end.");
        yield* say('gran', "{worried}So I pulled everything else. Down here, where nobody gets lost.");
        yield* say('wren', "You can't pull me, Gran.");
        yield* say('gran', granCount());
        yield* say(null, "Her hands don't stop. Six great threads hold the Spool to the walls, one to every House. The lowest two run free to the drum; the other four she has wound round her hands.");
        yield* say(null, "The free ones are pulled so taut they ring. The crates on the shelves below them shiver, wanting to be wound in.");
        Progress.setGoal(SpoolTop.goal());
    },
    *finale() {
        const a = G.map, p = G.player, r = SpoolTop.room(a);
        Progress.set('spool_cut');
        SpoolTop.hush(a);
        if (p.carry) p.dropCarry();
        if (p.grip) p.release();
        G.shake = 14; Sfx.play('rumble');
        yield 30;
        const gran = a.ents.find(e => e.who === 'gran');
        yield* say(null, "The last great thread parts. The Spool lurches, and everything it was winding goes slack at once: in the walls, overhead, all the way up the Well, a long, long sigh of thread.");
        yield* say('gran', "{worried}Don't, love. If I let go of it, I'll lose you.");
        yield* say(null, "She keeps hold of the Spool, both hands on it.");
        /* Linnet, down the Well after you: in at the door and up the room towards her mother (walks here keep round
           you and whatever's to be left clear, not through) */
        const free = (x, y, who) => a.inside(x, y) && !a.kind(x, y).solid && !a.kind(x, y).pit && (!a.at(x, y) || a.at(x, y) === who) && !(p.tx === x && p.ty === y);
        const route = (n, x, y, avoid = []) => {
            const b = { blocks: (bx, by) => (bx === p.tx && by === p.ty) || avoid.some(([ax, ay]) => ax === bx && ay === by) };
            a.blockers.push(b); const path = findPath(a, n.tx, n.ty, x, y, n); a.blockers.splice(a.blockers.indexOf(b), 1);
            return path;
        };
        const go = (n, x, y, sp) => { n.free = true; n.path = route(n, x, y); n.walking = !!(n.path && n.path.length); n.walkSpeed = sp; };
        const linnet = a.add(new NPC(r.x + 9, free(r.x + 9, r.y + 10) ? r.y + 10 : r.y + 9, { who: 'linnet', face: 'up' }));
        linnet.noBudge = linnet.noPull = true;
        const lt = [[9, 6], [10, 6], [8, 6], [9, 7]].map(([x, y]) => [r.x + x, r.y + y]).find(([x, y]) => free(x, y, linnet) && route(linnet, x, y));
        if (lt) go(linnet, lt[0], lt[1], 0.8);
        for (let t = 0; t < 150 && (linnet.walking || linnet.mv); t++) yield 1;
        linnet.dir = UP;
        yield 10;
        yield* say('linnet', "{sad}Mum.", gran ? { focus: gran } : {});
        yield* say(null, "Gran's hands go still on the Spool.");
        if (gran) {
            /* up to her mother's side (the side you're not on), and she takes one of her hands */
            const s = p.tx > gran.tx ? -1 : 1;
            const spot = [[gran.tx + s, gran.ty], [gran.tx - s, gran.ty], [gran.tx, gran.ty + 1]].find(([x, y]) => free(x, y, linnet) && route(linnet, x, y));
            if (spot) {
                go(linnet, spot[0], spot[1], 0.7);
                for (let t = 0; t < 360 && (linnet.walking || linnet.mv || linnet.tx !== spot[0] || linnet.ty !== spot[1]); t++) { if (t % 90 === 89 && !linnet.mv) go(linnet, spot[0], spot[1], 0.7); yield 1; }
                if ((linnet.tx !== spot[0] || linnet.ty !== spot[1]) && free(spot[0], spot[1], linnet)) { a.unplace(linnet, linnet.tx, linnet.ty); linnet.mv = null; linnet.path = null; linnet.walking = false; linnet.tx = spot[0]; linnet.ty = spot[1]; linnet.x = linnet.tx * T; linnet.y = linnet.ty * T; a.place(linnet, linnet.tx, linnet.ty); }
            }
            linnet.dir = linnet.tx < gran.tx ? RIGHT : linnet.tx > gran.tx ? LEFT : UP; linnet.fixedFace = true;
            gran.dir = DOWN; gran.fixedFace = true;
            yield 16;
            Ending.hands = this.handsOf(linnet, gran); Sfx.play('click');
            yield 30;
            yield* say('gran', "{sad}Linnet.");
            yield* say(null, "Linnet takes one of her mother's hands off the Spool. The other's still on it.");
        }
        Progress.setGoal("Take Gran's other hand.");
        a.climax = { linnet, h: 0, down: 0 };
    },
    /* the end, in Wren's hands: Linnet has one of Gran's, and the other's still on the Spool. Take it (hold [act], facing
       her, as you'd hold on to anything): held things wait. She tries twice to take it back to the Spool; then she lets
       go. Let go first and her hand goes back to it, for as long as you like */
    climaxTick(a) {
        const c = a.climax, p = G.player, gran = a.ents.find(e => e.who === 'gran');
        if (!gran || !c.linnet || c.linnet.removed || Script.blocking() || Cam.busy || p.state !== 'normal') return;
        const facing = p.adjacentTo(gran);
        gran.noGrip = true;
        if (facing && !c.told) { c.told = true; UI.toast(gripWord() + ' [act] to take her hand.', 240); }
        /* (a hold, not a tap, and pressed for it: a button still down from the last words doesn't count; with the grip on
           toggle (Options), a tap, but not the one that closed the last words) */
        if (c.t0 === undefined) c.t0 = G.t;
        if (Settings.grip === 'toggle') { if (p.grip !== gran && facing && !p.carry && gripSteps(0, true, c.t0)) { if (p.grip) p.release(); p.grip = gran; gran.heldBy = p; } }
        else {
            if (facing && Input.pressed('act')) c.armed = true;
            if (!Input.down('act')) c.armed = false;
            if (p.grip !== gran && c.armed && facing && !p.carry) { if (++c.down >= 8) { if (p.grip) p.release(); p.grip = gran; gran.heldBy = p; } } else c.down = 0;
        }
        if (p.grip === gran) {
            if (!c.h) { Sfx.play('click'); Ending.hands = this.handsOf(c.linnet, gran, p); UI.toasts = UI.toasts.filter(t => !/take her hand/.test(t.s)); }
            c.h++;
            /* (she tries twice: her hand pulls back toward the Spool) */
            if (c.h === 40 || c.h === 100) { Sfx.play('tug'); gran.dir = UP; G.shake = Math.max(G.shake, 2); }
            if (c.h === 52 || c.h === 112) gran.dir = DOWN;
            if (c.h >= 160) { a.climax = null; Script.run(this.letGo(gran, c.linnet), { name: 'finale' }); }
        } else if (c.h) { c.h = 0; gran.dir = DOWN; Ending.hands = this.handsOf(c.linnet, gran); }
    },
    *letGo(gran, linnet) {
        const a = G.map, p = G.player;
        yield 8;
        if (p.grip) p.release();
        gran.dir = DOWN;
        Sfx.play('unclick'); G.shake = 6;
        yield* say(null, "She lets go of the Spool.");
        /* the three of you in a row, facing out, hands held */
        const sx = linnet.tx < gran.tx ? gran.tx + 1 : gran.tx - 1, k = a.kind(sx, gran.ty);
        if ((p.tx !== sx || p.ty !== gran.ty) && !a.at(sx, gran.ty) && !k.solid && !k.pit) yield* walkTo(p, sx, gran.ty);
        p.dir = gran.dir = linnet.dir = DOWN; gran.fixedFace = linnet.fixedFace = true;
        Ending.hands = this.handsOf(linnet, gran, p);
        yield 100;
        yield* Ending.unwinding();
    },
    /* hands held, left to right: Gran in the middle, Linnet on her side, Wren (if she has Gran's hand) on the other */
    handsOf(linnet, gran, p) { const l = linnet.tx < gran.tx; return p ? (l ? [linnet, gran, p] : [p, gran, linnet]) : (l ? [linnet, gran] : [gran, linnet]); },
};

/* ---------------- the Great Pull, up in the town ---------------- */
{
    const tick0 = OW.blocks['1,1'].tick;
    OW.blocks['1,1'].tick = a => {
        if (tick0) tick0(a);
        if (!Progress.flag('great_pull') || Progress.flag('unwound')) return;
        /* everyone with a thread is dragged in a ring round the Well */
        /* (the townsfolk, in town: in an arc round the Well, its south side left open so you can get to it) */
        const pulled = a.ents.filter(n => n.kind === 'npc' && !n.cutFree && !Progress.flag('cut:' + n.who) && n.who !== 'gran' && n.who !== 'linnet' && n.tx >= 64 && n.tx < 128 && n.ty >= 40 && n.ty < 80);
        const fresh = pulled.filter(n => !n.dragged);
        if (fresh.length) pulled.forEach((n, i) => {
            const t = Math.PI / 2 + 0.75 + (2 * Math.PI - 1.5) * i / Math.max(1, pulled.length - 1);
            let rx = 95 + Math.round(Math.cos(t) * 6), ry = 59 + Math.round(Math.sin(t) * 4);
            while (pulled.some(q => q !== n && q.dragTo && q.dragTo[0] === rx && q.dragTo[1] === ry)) ry--;
            n.dragTo = [rx, ry];
            n.route = [[rx, ry, 9999]]; n.ri = 0; n.routeWait = 0; n.routeSpeed = 0.5; n.free = true; n.dragged = true; n.path = null;
        });
        if (!Progress.flag('pull_seen') && G.player && G.player.area === a && Math.hypot(G.player.tx - 95, G.player.ty - 60) < 14) {
            Progress.set('pull_seen');
            const nd = a.ents.filter(e => e.dragged).length;
            Script.run(function* () {
                /* (the camera goes to the square while it's told: the ring of people round the Well, the threads) */
                yield* camLook(95, 59);
                if (nd) yield* say(null, "The town square. " + (nd > 6 ? 'Everyone you know is' : 'The few with threads still on them are') + " shuffling towards the Well, step by step, threads streaming from them down into it. Their feet don't want to; their threads do.");
                else yield* say(null, "The town square. Everyone you cut free is standing about the Well, watching. Threads are pouring into it from every direction: from the hills, the river, the fields, every marked thing in the valley. Nobody here is being pulled.");
                yield* say(null, "The Well's cap is gone. Threads pour into the dark like water going down a drain.");
                yield* camBack();
                Progress.setGoal('Down the Well, to the Great Spool.');
            });
        }
    };
    /* the dragged go backwards, facing away from the Well, every one of them: their feet don't want to; their threads do
       (turned to face Wren while she talks to them) */
    const npcTick0 = NPC.prototype.tick;
    NPC.prototype.tick = function () {
        npcTick0.call(this);
        if (this.dragged && !this.cutFree && !Script.running('talk') && Progress.flag('great_pull') && !Progress.flag('unwound') && this.area && this.area.id === 'hollow')
            this.dir = dirOf(this.tx - 95, this.ty - 59);
    };
    /* while the Pull goes on, the dragged are drawn with their threads streaming to the Well */
    const draw0 = NPC.prototype.draw;
    NPC.prototype.draw = function (cx, cy) {
        if (this.dragged && !this.cutFree && Progress.flag('great_pull') && !Progress.flag('unwound') && this.area && this.area.id === 'hollow') {
            const col = (PEOPLE_DEF[this.who] && PEOPLE_DEF[this.who].col) || THREAD.town;
            Gfx.alpha(0.6); Gfx.line(this.px + 8 - cx, this.py + 6 - cy, 95 * T + 8 - cx, 59 * T - cy, col); Gfx.alpha(1);
        }
        return draw0.call(this, cx, cy);
    };
    /* talking to them meanwhile */
    const talk0 = Story.talk;
    Story.talk = function (npc) {
        if (Progress.flag('great_pull') && !Progress.flag('unwound') && npc.area && npc.area.id === 'hollow') {
            if (Progress.flag('cut:' + npc.who)) return function* () { yield* say(npc.who, "{happy}We're all right! Nothing's got hold of us! Go on, {name}!"); };
            if (npc.dragged) return function* () { yield* say(npc.who, ["{worried}I can't... stop... walking. {name}? Is that you?", "{worried}My feet won't listen. It's the Well. It wants us.", "{worried}Go on, love. Down the Well. Don't mind us."][Math.floor(G.rng() * 3)]); };
        }
        /* everyone else with a thread, wherever they are, is holding on to something */
        if (Progress.flag('great_pull') && !Progress.flag('unwound') && !Progress.flag('cut:' + npc.who) && npc.who !== 'gran' && npc.who !== 'linnet' && PEOPLE_DEF[npc.who]) {
            return function* () { yield* say(npc.who, ["{worried}It's pulling. Toward the town, toward the Well. I've got my arm round the post, love, I'm all right. Go on.", "Can you feel it? No. No, you can't, can you. Go on, then. Go and stop it."][Math.floor(G.rng() * 2)]); };
        }
        return talk0.call(this, npc);
    };
}
/* the Well, open */
{
    const deco0 = SPAWN.deco;
    SPAWN.deco = (tx, ty, p) => {
        const pr = deco0(tx, ty, p);
        if (p.id === 'well') {
            const i0 = pr.interact;
            pr.interact = () => {
                if (Progress.flag('great_pull') && !Progress.flag('unwound')) {
                    Script.run(function* () {
                        const i = yield* ask(null, "The Well's cap is gone. Every thread in the valley pours down into the dark. Go down?", ['Down the Well', 'Not yet']);
                        if (i === 0) World.go('greatspool', GREAT_ENTRY.x, GREAT_ENTRY.y, { dir: UP, fade: true });
                    });
                    return true;
                }
                return i0 ? i0() : false;
            };
        }
        return pr;
    };
}
AREAS.greatspool.tick = a => GreatSpool.tick(a);
/* the Well brings you back up (and the foot of the Well is where you'd fall to, if you fell) */
AREAS.greatspool.ents.push({ k: 'warp', x: GREAT_ENTRY.x, y: GREAT_ENTRY.y + 1, to: 'hollow', tx2: 95, ty2: 60, face: 'down', room: '1,3' }, { k: 'deco', x: GREAT_ENTRY.x, y: GREAT_ENTRY.y + 1, look: 'stairs_up', solid: false, baseY: -100, room: '1,3' });

function initGreatSpool() {
    /* the foot of the Great Spool: a drum wound with every colour, round (shaded darker toward its sides, a gleam down
       one side), rising out of sight, standing in a great wooden flange */
    ART.spoolpost = paintSprite(96, 40, x => {
        const R = (c, a, b, w, h) => sq(c, a, b, w, h, x), cols = ['#e8463c', '#3fc1b5', '#e0913a', '#4f9be0', '#e8c04a', '#b48ce8', '#d6304e', '#8fd46a'];
        for (let yy = 0; yy < 34; yy++) for (let xx = 5; xx < 91; xx++) {
            const u = (xx - 48) / 43, k = Math.sqrt(Math.max(0, 1 - u * u)), c = cols[(Math.floor(yy / 2) + (xx % 9 === 0 ? 1 : 0)) % cols.length];
            x.fillStyle = shade(c, -0.6 + 0.62 * k + (Math.abs(u + 0.4) < 0.07 ? 0.3 : 0)); x.fillRect(xx, yy, 1, 1);
        }
        R('#4a301e', 0, 32, 96, 8); R('#7a4e32', 2, 32, 92, 3); R('#a8744c', 4, 32, 88, 1); R('#2a1a10', 1, 39, 94, 1);
    });
    SPR.spoolpost = ART.spoolpost;
}
CONTENT_INIT.push(initGreatSpool);

/* Gran at the Spool: talking to her, before it's over */
{
    const talk0 = Story.talk;
    Story.talk = function (npc) {
        /* (at the very end there's nothing to say: Linnet has one of her hands, and the other's for holding) */
        if ((npc.who === 'gran' || npc.who === 'linnet') && npc.area && npc.area.climax) return null;
        if (npc.who === 'gran' && npc.area && npc.area.id === 'greatspool' && !Progress.flag('unwound')) return function* () {
            /* Linnet's bracelet, from the Stray House: shown to her, she stops throwing (the room goes quiet) and lets a
               pair of the great threads go herself: the middle pair, the one her throwing kept, or the last if that's gone */
            if (Inv.items.bracelet && !Progress.flag('bracelet_top') && Progress.flag('spool_met') && SpoolTop.stage() < 3) {
                const i = yield* ask(null, "Linnet's bracelet is in your satchel: green thread, plaited, with a little brass L. Show it to Gran?", ['Show her', 'Not now']);
                if (i === 0) {
                    const a = npc.area, pair = SpoolTop.done(1) ? 2 : 1;
                    Progress.set('bracelet_top'); Stats.count('secret:bracelet_top');
                    SpoolTop.hush(a);
                    yield* say('gran', "{surprised}...Where did you... I plaited that. I plaited that for her, the spring before her Wander. She never took it off.");
                    yield* say('gran', "{sad}She left it. She left it for somebody to find. For me to find.");
                    for (const h of SPOOL_PAIRS[pair]) Progress.set('great:' + h);
                    for (const e of a.ents) if (e.kind === 'greatpost' && SPOOL_PAIRS[pair].includes(e.house)) Fx.ring(e.tx * T + 8, e.ty * T, KNOT_COL[e.house]);
                    G.shake = 8; Sfx.play('snip');
                    yield* say(null, "Gran's hands go slack on the Spool, and the room goes quiet. Two of the great threads loosen and part, and she doesn't reach for them.");
                    if (SpoolTop.stage() >= 3) { Script.run(GreatSpool.finale(), { name: 'finale' }); return; }
                    yield* say('gran', "{worried}I can't... I can't let go of the rest, love. My hands won't. You'll have to.");
                    Progress.setGoal(SpoolTop.goal());
                    Save.autosave();
                    return;
                }
            }
            yield* say('gran', cycle('gran_spool', ["{worried}Go home, love. Please. Go home and let me hold on.", "{sad}Twenty-five years I've held on. I can't stop now. If I stop, they'll all go.", "{sad}Don't look at me like that. You've your mother's look. And hers."]));
        };
        return talk0.call(this, npc);
    };
}
/* Gran and Linnet at the Spool don't budge when leant on; Gran held doesn't come away with you. Whatever great threads
   she's still holding are drawn with her, wound round her fists */
{
    const push0 = NPC.prototype.onPushed;
    NPC.prototype.onPushed = function (p, d) { if (this.noBudge) return false; return push0.call(this, p, d); };
    const draw0 = NPC.prototype.draw;
    NPC.prototype.draw = function (cx, cy) {
        const r = draw0.call(this, cx, cy);
        if (this.who === 'gran' && this.area && this.area.id === 'greatspool' && Progress.flag('spool_met') && !Progress.flag('unwound')) SpoolArt.hands(this, cx, cy);
        return r;
    };
}
/* while the Pull goes on, nobody with a thread is indoors or down below: they're all out at the Well, or holding on */
{
    const build0 = World.build;
    World.build = function (id) {
        const a = build0.call(this, id);
        if (Progress.flag('great_pull') && !Progress.flag('unwound') && (a.family === 'interior' || id === 'underside'))
            for (const e of a.ents.slice()) if (e.kind === 'npc' && PEOPLE_DEF[e.who] && !Progress.flag('cut:' + e.who) && e.who !== 'gran') a.remove(e);
        return a;
    };
}
/* a load in the Night Ferry's bedroom west of the channel would leave Wren cut off there (the place is built afresh with
   the ferry back at its landing): she starts east of the channel instead, by the lever, which is the way out */
{
    const apply0 = Save.apply;
    Save.apply = function (s) {
        apply0.call(this, s);
        const p = G.player, a = G.map, r = p && a && a.id === 'greatspool' ? a.roomAt(p.tx, p.ty) : null;
        if (!r || r.key !== '0,1' || p.tx - r.x > 4 || p.ty - r.y > 3) return;
        p.x = (r.x + 8) * T + 8; p.y = (r.y + 2) * T + 10; p.unstick(); p.setMark(); Cam.snap(p);
    };
}
/* a save made in the Great Spool as it was first built (sixteen rooms on another map) starts again at the foot of the
   Well, the Knots it had untied still untied; whatever it had left lying about down there is back in its place */
{
    const mig0 = Save.migrate;
    Save.migrate = function (s) {
        s = mig0.call(this, s);
        if (!s || (s.progress.flags && s.progress.flags.gs2)) return s;
        const f = s.progress.flags = s.progress.flags || {};
        if (s.progress.areaFlags && s.progress.areaFlags.greatspool) delete s.progress.areaFlags.greatspool;
        if (s.inv && s.inv.bedroll && s.inv.bedroll.area === 'greatspool') s.inv.bedroll = null;
        if (s.inv && Array.isArray(s.inv.stitches)) s.inv.stitches = s.inv.stitches.filter(r => r.area !== 'greatspool');
        /* (at the foot it's told again how things are down here now) */
        if (s.pos && s.pos.area === 'greatspool') s.pos = { area: 'greatspool', x: GREAT_ENTRY.x * T + 8, y: GREAT_ENTRY.y * T + 10, dir: UP, mark: { area: 'greatspool', tx: GREAT_ENTRY.x, ty: GREAT_ENTRY.y } };
        f.gs2 = true;
        return s;
    };
}
