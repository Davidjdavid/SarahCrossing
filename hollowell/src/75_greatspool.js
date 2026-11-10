/* The Great Pull and the Great Spool. Back from the Drift on foot, Wren finds Gran winding the whole valley in:
   everyone with a thread (everyone not cut free) dragged in a ring round the Well, threads streaming down it. The
   Well's cap is gone; down it, the Great Spool: the six Knots of the Wander, each tied in a room that remembers its
   House (and everything learnt since), to be untied; and at the top, Gran at the Spool. She can't pull Wren. She pulls
   everything else. Six great threads hold the Spool to the walls; the Shears. Then Linnet comes down the Well. */

THEMES.spool = { floor: ['#2a2840', '#201e34', '#3a3854', '#141224'], wall: ['#3a3456', '#2a2440', '#52487a', '#141024'], stone: ['#4a4466', '#36304e', '#6a6488', '#1e1a2e'], water: ['#3f6f98', '#2e5478', '#6f9fc8', '#1c3450'], dark: '#0c0a16' };
FLOORS.spool = {
    floor: (x, th, v) => { fill(x, '#2a2840'); speckle(x, ['#24223a', '#322f4a'], 20 + v, 0.25); const cols = ['#e8463c', '#3fc1b5', '#e0913a', '#4f9be0', '#e8c04a', '#b48ce8', '#d6304e', '#a8784a']; if (v % 3 === 0) fill(x, shade(cols[v % 8], -0.35), 0, 7, 16, 1); },
    floor2: (x, th, v) => { fill(x, '#3a3854'); speckle(x, ['#4a4864', '#2a2840'], 30 + v, 0.3); },
    floor3: (x, th, v) => { fill(x, '#141224'); for (let i = 1; i < 16; i += 2) fill(x, '#2a2440', i, 0, 1, 16); },
};
WALLS.spool = {
    edge: '#0c0a16',
    top: (x) => { fill(x, '#1e1a2e'); speckle(x, ['#2a2440'], 10, 0.2); },
    face: (x, th, v) => { fill(x, '#3a3456'); const cols = ['#e8463c', '#3fc1b5', '#e0913a', '#4f9be0', '#e8c04a', '#b48ce8']; for (let y = 1; y < 15; y += 2) fill(x, cols[(y + v) % 6], 0, y, 16, 1); fill(x, '#0c0a16', 0, 15, 16, 1); },
};
const KNOT_HOUSES = ['tidy', 'kiln', 'mill', 'belfry', 'slumber', 'marionette'];
const KNOT_COL = { tidy: THREAD.ives, kiln: THREAD.bram, mill: THREAD.ambrose, belfry: THREAD.tess, slumber: THREAD.mallow, marionette: THREAD.jory };
const GREAT_ENTRY = { x: 49, y: 41 };
defHouse({
    id: 'greatspool', name: 'The Great Spool', place: 'The Great Spool', house: 'greatspool', theme: 'spool', thread: THREAD.hesper, music: 'pull',
    entry: GREAT_ENTRY, noNudges: true,
    legend: { 'O': { k: 'crawl', p: 'wall', ent: 'crawlhole' } },
    cells: {
        /* ---------------- the foot of the Well ---------------- */
        '2,3': {
            name: 'The Foot of the Well',
            rows: ['#########.##########', '#..................#', '#..................#', '#..................#', '#..................#', '....................', '#..................#', '#..................#', '#..................#', '#..................#', '####################'],
            ents: [
                { k: 'sign', x: 11, y: 8, text: "Six Knots, tied in six rooms round the Spool's foot: the Wander's, every one you tied. A seventh place waits at the top, an empty peg, for the Wanderer's own." },
            ],
        },
        /* ---------------- the Nursery Stair (on the way to the Slumberhouse's Knot): hooked over; home by falling, onto your own bed ---------------- */
        '1,3': {
            name: 'The Nursery Stair',
            rows: ['####################', '#.....ooooo........#', '#.....ooooo........#', '#.....ooooo........#', '#.....ooooo........#', '......ooooo.........', '#.....ooooo........#', '#.....ooooo........#', '#.....ooooo........#', '#.....ooooo........#', '####################'],
            ents: [
                { k: 'eyelet', x: 4, y: 5 },
                { k: 'sign', x: 15, y: 2, text: "Mallow's hand, very neat: A HOOK GETS YOU OVER. A FALL GETS YOU HOME, IF YOU'VE A BED TO FALL TO. (Even now. Especially now.)" },
            ],
        },
        '0,3': {
            name: "The Slumberhouse's Knot",
            rows: ['####################', '#..................#', '#..................#', '#..................#', '#..................#', '#...................', '#vvvvvvvvvvvvvvvvvv#', '#..................#', '#..................#', '#..................#', '####################'],
            ents: [
                { k: 'knotlock', x: 9, y: 8, house: 'slumber' },
                { k: 'sign', x: 16, y: 2, text: 'No stairs down, and none up. Somewhere of your own to come back to, then.' },
            ],
        },
        /* ---------------- the Puppet Gallery (on the way to the Marionette Hall's Knot): walk it there, then give it a home ---------------- */
        '3,3': {
            name: 'The Puppet Gallery',
            rows: ['####################', '#..................#', '#..................#', '#^^^^^^^^^^^^^^^^^^#', '#..................#', '....................', '#..................#', '#..................#', '#..................#', '#..................#', '####################'],
            ents: [
                { k: 'puppet', x: 9, y: 1, id: 'gsGPuppet', patience: 120 },
                { k: 'plate', x: 2, y: 1, sig: 'gsPg' },
                { k: 'door', x: 19, y: 5, type: 'gate', when: 'gsPg', dir: 'v', id: 'gsPgGate' },
                { k: 'sign', x: 16, y: 8, text: "Jory's hand: SHE'LL WALK IT WHERE YOU LIKE. SHE'LL ALWAYS WALK HOME AFTER. UNLESS HOME'S SOMEWHERE ELSE." },
            ],
        },
        '4,3': {
            name: "The Marionette Hall's Knot",
            rows: ['####################', '#.........#........#', '#.........#........#', '#.........#..^^^...#', '#.........O........#', '..........#........#', '#.........#........#', '#####.#####........#', '#.........#........#', '#.........#........#', '####################'],
            ents: [
                { k: 'puppet', x: 7, y: 4, id: 'gsPuppet' },
                { k: 'plate', x: 14, y: 2, sig: 'gsMp' },
                { k: 'door', x: 5, y: 7, type: 'gate', when: 'gsMp', dir: 'h', passed: 'down', id: 'gsMGate' },
                { k: 'knotlock', x: 5, y: 9, house: 'marionette' },
            ],
        },
        /* ---------------- the hub: the Winding Room ---------------- */
        '2,2': {
            name: 'The Winding Room',
            rows: ['#########.##########', '#..................#', '#..................#', '#..................#', '#..................#', '....................', '#..................#', '#..................#', '#..................#', '#..................#', '#########.##########'],
            ents: [
                { k: 'deco', x: 7, y: 2, look: 'spoolpost', ox: 0, solid: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]], text: 'The foot of the Great Spool: a drum of thread as wide as a house, every colour, turning, and every turn a little tighter.' },
            ],
        },
        /* ---------------- the Tidy Parlour (on the way to the Tidyhouse's Knot): a thing on its plate, for good ---------------- */
        '1,2': {
            name: 'The Tidy Parlour',
            rows: ['####################', '#..................#', '#..................#', '#..................#', '#..................#', '....................', '#..................#', '#..................#', '#..................#', '#..................#', '####################'],
            ents: [
                { k: 'block', x: 17, y: 5, id: 'gsTpBlock' },
                { k: 'plate', x: 17, y: 8, sig: 'gsTa' },
                { k: 'door', x: 0, y: 5, type: 'gate', when: 'gsTa', dir: 'v', id: 'gsTaGate' },
                { k: 'sign', x: 3, y: 2, text: "Mother Ives: EVERYTHING GOES HOME. (That was the whole idea. Make up your own mind, love.)" },
            ],
        },
        '0,2': {
            name: "The Tidyhouse's Knot",
            rows: ['####################', '#....#.............#', '#....#.............#', '#....#.............#', '#....#.............#', '#...................', '#....#.............#', '#....#.............#', '#....#.............#', '#....#.............#', '####################'],
            ents: [
                { k: 'door', x: 5, y: 5, type: 'gate', when: 'gsTp', dir: 'v', passed: 'left', id: 'gsTGate' },
                { k: 'plate', x: 12, y: 2, sig: 'gsTp' },
                { k: 'block', x: 14, y: 7, id: 'gsTBlock' },
                { k: 'knotlock', x: 2, y: 5, house: 'tidy' },
            ],
        },
        /* ---------------- the Kiln Crossing (on the way to the Kiln's Knot): a pot carried over the water on a raft; its shards fly home the way it came ---------------- */
        '3,2': {
            name: 'The Kiln Crossing',
            rows: ['####################', '#.....~~~~~~~~.....#', '#.....~~~~~~~~.....#', '#.....~~~~~~~~.....#', '#.....~~~~~~~~.....#', '......~~~~~~~~......', '#.....~~~~~~~~.....#', '#.....~~~~~~~~.....#', '#.....~~~~~~~~.....#', '#.....~~~~~~~~.....#', '####################'],
            ents: [
                { k: 'pot', x: 3, y: 3, id: 'gsKPot' },
                { k: 'raft', x: 6, y: 5, id: 'gsKRaft', marked: false },
                { k: 'charm', x: 10, y: 5, mode: 'once', sig: 'gsKc', id: 'gsKCharm' },
                { k: 'door', x: 19, y: 5, type: 'gate', when: 'gsKc', dir: 'v', id: 'gsKGate' },
                { k: 'sign', x: 2, y: 8, text: "Bram: A CHARM OVER WATER. NOTHING REACHES IT BUT SOMETHING FLYING. (Things fly home the way they came. Come the long way.)" },
            ],
        },
        '4,2': {
            name: "The Kiln's Knot",
            rows: ['####################', '#.........ooo......#', '#.........ooo......#', '#.........ooo......#', '#.........ooo......#', '..........ooo......#', '#.........ooo......#', '#.........ooo......#', '#.........ooo......#', '#.........ooo......#', '####################'],
            ents: [
                { k: 'eyelet', x: 14, y: 5 },
                /* and one on the near side, for the way back */
                { k: 'eyelet', x: 8, y: 8 },
                { k: 'knotlock', x: 16, y: 5, house: 'kiln' },
                { k: 'sign', x: 3, y: 2, text: 'A gap no one could jump, and a brass eye on the far side, waiting for a hook.' },
            ],
        },
        /* ---------------- the climb: Mill west, Belfry east, the top north; once every Knot's undone, the Pull throws things across it ---------------- */
        '2,1': {
            name: 'The Climb',
            rows: ['#########.##########', '#..................#', '#....#.............#', '#..................#', '#.............#....#', '....................', '#....#.............#', '#..................#', '#.............#....#', '#..................#', '#########.##########'],
            ents: [
                { k: 'door', x: 9, y: 0, type: 'gate', when: 'flag:spool_all', dir: 'h', id: 'gsTop' },
                { k: 'sign', x: 11, y: 9, text: 'UP: THE SPOOL. (The way opens when every Knot is undone.)' },
                { k: 'junklane', x: 18, y: 2, dir: -1, period: 80, phase: 0 }, { k: 'junklane', x: 1, y: 4, dir: 1, period: 70, phase: 30 },
                { k: 'junklane', x: 18, y: 6, dir: -1, period: 75, phase: 50 }, { k: 'junklane', x: 1, y: 8, dir: 1, period: 85, phase: 15 },
            ],
        },
        /* ---------------- the Ferry Landing (on the way to the Millrace's Knot): a ferry that always goes home ---------------- */
        '1,1': {
            name: 'The Ferry Landing',
            /* (seven wide: a ferry cut and left on the far side is always in the Hookline's reach from the near one) */
            rows: ['####################', '#......~~~~~~~.....#', '#......~~~~~~~.....#', '#......~~~~~~~.....#', '#......~~~~~~~.....#', '.......~~~~~~~......', '#......~~~~~~~.....#', '#......~~~~~~~.....#', '#......~~~~~~~.....#', '#......~~~~~~~.....#', '####################'],
            ents: [
                { k: 'raft', x: 13, y: 5, id: 'gsFerry', patience: 240 },
                { k: 'sign', x: 3, y: 8, text: "Your dad's hand: THE FERRY ALWAYS GOES HOME. IT'S A GOOD FERRY. (How'll you get back, then?)" },
            ],
        },
        '0,1': {
            name: "The Millrace's Knot",
            rows: ['####################', '#.....~~~~~~~~.....#', '#.....~~~~~~~~.....#', '#.....~~~~~~~~.....#', '#.....~~~~~~~~.....#', '#.....~~~~~~~~......', '#.....~~~~~~~~.....#', '#.....~~~~~~~~.....#', '#.....~~~~~~~~.....#', '#.....~~~~~~~~.....#', '####################'],
            ents: [
                { k: 'raft', x: 13, y: 5, id: 'gsRaft', marked: false },
                { k: 'knotlock', x: 2, y: 5, house: 'mill' },
                { k: 'sign', x: 16, y: 8, text: 'Deep water, and a raft tied to nothing at all.' },
            ],
        },
        /* ---------------- the Bell Loft (on the way to the Belfry's Knot): wake it, then give it a place ---------------- */
        '3,1': {
            name: 'The Bell Loft',
            rows: ['####################', '#..................#', '#^^^^^^^^^^^^^^^^^^#', '#^^^^^^^^^^^^^^^^^^#', '#..................#', '....................', '#..................#', '#..................#', '#..................#', '#..................#', '####################'],
            ents: [
                { k: 'block', x: 12, y: 1, id: 'gsBlSleeper', look: 'boulder_b', sleeper: true, tiedOff: true, startAt: [9, 1], trace: [[12, 1], [11, 1], [10, 1], [9, 1]], noPush: true, pushLine: "Asleep, over the pins. Nothing you can reach it with but a bell." },
                { k: 'plate', x: 15, y: 1, sig: 'gsBl' },
                { k: 'door', x: 19, y: 5, type: 'gate', when: 'gsBl', dir: 'v', id: 'gsBlGate' },
                { k: 'sign', x: 3, y: 8, text: "Your mum's hand: A BELL WAKES THINGS. IT DOESN'T TELL THEM WHERE TO GO." },
            ],
        },
        '4,1': {
            name: "The Belfry's Knot",
            rows: ['####################', '#.........#........#', '#.........#........#', '#.........#........#', '#.........#........#', '...................#', '#.........#........#', '#.........#........#', '#.........#........#', '#.........#........#', '####################'],
            ents: [
                { k: 'block', x: 13, y: 8, id: 'gsBBoulder', look: 'boulder_b', sleeper: true, tiedOff: true, startAt: [10, 5], trace: [[13, 8], [12, 8], [11, 8], [11, 7], [11, 6], [11, 5], [10, 5]], noPush: true, pushLine: "A boulder fast asleep in the doorway. It won't budge for anything but a bell." },
                { k: 'knotlock', x: 16, y: 3, house: 'belfry' },
            ],
        },
        '2,0': {
            name: 'The Top of the Spool',
            rows: ['####################', '#..................#', '#..................#', '#..................#', '#..................#', '#..................#', '#..................#', '#..................#', '#..................#', '#..................#', '#########.##########'],
            ents: [
                { k: 'greatspool', x: 8, y: 1, id: 'theSpool' },
                { k: 'greatpost', x: 1, y: 2, house: 'tidy' }, { k: 'greatpost', x: 18, y: 2, house: 'kiln' }, { k: 'greatpost', x: 1, y: 5, house: 'mill' },
                { k: 'greatpost', x: 18, y: 5, house: 'belfry' }, { k: 'greatpost', x: 1, y: 8, house: 'slumber' }, { k: 'greatpost', x: 18, y: 8, house: 'marionette' },
                /* things on their shelves, for the Pull to drag */
                { k: 'crate', x: 6, y: 9, id: 'gsCrateA' }, { k: 'crate', x: 13, y: 9, id: 'gsCrateB' }, { k: 'crate', x: 4, y: 9, id: 'gsCrateC' },
            ],
        },
    },
});

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
            yield* say(null, n < 6 ? `It comes undone in your fingers, and somewhere above, the Spool shudders and slows. (${n}\u00a0of\u00a06.)` : 'The sixth Knot comes undone. Overhead, the Great Spool groans, and stops turning, and for the first time in your life there is no sound of winding anywhere.');
            if (n >= 6) { Progress.set('spool_all'); Progress.setGoal('Up the Climb to the top of the Spool. Gran is there.'); }
            else Progress.setGoal(`Untie the Knots of the Wander, in the rooms round the Spool's foot (${n} of 6).`);
            Save.autosave();
        });
        return true;
    }
    draw(cx, cy) {
        const x = this.tx * T - cx, y = this.ty * T - cy, col = KNOT_COL[this.house];
        Gfx.line(x + 8, y - 30, x + 8, y + 2, this.undone ? shade(col, -0.4) : col);
        if (this.undone) { Gfx.line(x + 8, y + 2, x + 4, y + 12, shade(col, -0.4)); return; }
        Gfx.circle(x + 8, y + 6, 6, col); Gfx.circle(x + 8, y + 6, 3, shade(col, 0.35)); Gfx.rect(x + 4, y + 4, 8, 1, shade(col, -0.4));
        if ((G.t >> 4) % 2) Gfx.rect(x + 7, y - 2, 2, 2, '#ffffff');
    }
}
SPAWN.knotlock = (x, y, p) => new KnotLock(x, y, p);
const HOUSE_NAMES = { tidy: 'Tidyhouse', kiln: 'Kiln', mill: 'Millrace', belfry: 'Belfry', slumber: 'Slumberhouse', marionette: 'Marionette Hall' };

/* ---------------- the top: the Spool, its six great threads, Gran ---------------- */
class GreatPost extends GridThing {
    constructor(tx, ty, p = {}) { super('greatpost', tx, ty, Object.assign({ weight: WEIGHT.fixed, fixed: true, marked: false, hookable: false, noNeedle: true }, p)); this.cuttable = true; this.slack = 0; }
    get cut() { return Progress.flag('great:' + this.house); }
    /* the tiles its thread runs over, from beside the post to the drum's foot */
    get tiles() {
        if (this._tiles) return this._tiles;
        const s = this.area.find('theSpool'), out = [];
        if (!s) return out;
        const x1 = s.tx + 2, y1 = s.ty + 2, n = Math.max(Math.abs(x1 - this.tx), Math.abs(y1 - this.ty));
        for (let i = 1; i < n; i++) { const x = Math.round(this.tx + (x1 - this.tx) * i / n), y = Math.round(this.ty + (y1 - this.ty) * i / n); if (!out.some(([u, v]) => u === x && v === y) && !(x === this.tx && y === this.ty)) out.push([x, y]); }
        return (this._tiles = out);
    }
    under(x, y) { return !this.cut && this.tiles.some(([u, v]) => u === x && v === y); }
    update() { if (this.slack > 0) this.slack--; }
    onCut() {
        if (this.cut || !Progress.flag('spool_met')) return;
        /* the Spool keeps its threads taut: the Shears only bite one that something's just been dragged along */
        if (this.slack <= 0) { Sfx.play('hitthing'); UI.toast(Progress.flag('taut_told') ? 'Too taut.' : "Too taut: the Shears skid right off it. If something were dragged along it, it might go slack for a moment...", 200); Progress.set('taut_told'); return; }
        Progress.set('great:' + this.house); Sfx.play('snip'); G.shake = 8; Fx.ring(this.tx * T + 8, this.ty * T, KNOT_COL[this.house]);
        const n = KNOT_HOUSES.filter(h => Progress.flag('great:' + h)).length;
        if (n >= 6) Script.run(GreatSpool.finale(), { name: 'finale' });
        else { UI.toast(`A great thread parts with a sound like a bell cracking. (${n}\u00a0of\u00a06.)`, 120); Save.autosave(); }
    }
    draw(cx, cy) {
        const x = this.tx * T - cx, y = this.ty * T - cy, col = KNOT_COL[this.house];
        Gfx.rect(x + 3, y - 10, 10, 26, '#4a4466'); Gfx.rect(x + 4, y - 10, 8, 26, '#6a6488'); Gfx.rect(x + 2, y - 12, 12, 3, col);
        if (!this.cut) {
            const s = this.area.find('theSpool');
            if (s) {
                const x1 = s.tx * T + 32 - cx, y1 = s.ty * T + 16 - cy;
                if (this.slack > 0) {
                    /* slack: it sags, wobbling */
                    const sag = 10 + Math.sin(G.t / 4) * 3; let px = x + 8, py = y - 6;
                    for (let i = 1; i <= 12; i++) { const k = i / 12, nx = x + 8 + (x1 - x - 8) * k, ny = y - 6 + (y1 - y + 6) * k + Math.sin(k * Math.PI) * sag; Gfx.line(px, py, nx, ny, shade(col, 0.3)); px = nx; py = ny; }
                } else { Gfx.line(x + 8, y - 6, x1, y1, col); Gfx.line(x + 8, y - 5, x1, y1 + 1, shade(col, -0.3)); }
            }
        }
        else Gfx.line(x + 8, y - 6, x + 14, y + 4, shade(col, -0.4));
    }
}
SPAWN.greatpost = (x, y, p) => new GreatPost(x, y, p);
class SpoolDrum extends Ent {
    constructor(tx, ty, p = {}) { super('greatspool', p); this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T; this.t = 0; this.junk = []; }
    get sortY() { return this.y + 40; }
    onAdd(area) { for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) area.staticSolid.add((this.ty + j) * 4096 + this.tx + i); }
    update() {
        this.t++;
        const p = G.player, a = this.area;
        /* Gran pulls everything else: things fly in from the walls toward the Spool (they'd knock you flat, if there were
           anything left in you to unravel; as it is, they knock you about) */
        if (Progress.flag('spool_met') && !Progress.flag('unwound') && !Script.blocking()) {
            /* the Pull: a thing out of its place, lying under a great thread, is dragged along it into the drum, and the
               thread goes slack a moment; the Spool spits the thing back onto its shelf after */
            const posts = a.ents.filter(e => e.kind === 'greatpost' && !e.cut);
            for (const e of a.ents) {
                if (!e.ret || !e.isGrid || e.removed || e.carried || e.mv || e.kind === 'greatpost' || a.roomAt(e.tx, e.ty) !== a.roomAt(this.tx, this.ty)) continue;
                if (Return.atHome ? Return.atHome(e) : (e.tx === e.ret.mx && e.ty === e.ret.my)) { e.yankT = 0; continue; }
                const hit = posts.filter(q => q.under(e.tx, e.ty));
                if (!hit.length) { e.yankT = 0; continue; }
                if (++e.yankT < 24) continue;
                e.yankT = 0;
                for (const q of hit) { q.slack = 300; Sfx.play('twang'); Fx.ring(q.tx * T + 8, q.ty * T, KNOT_COL[q.house]); }
                this.junk.push({ x: e.tx * T + 8, y: e.ty * T + 8, tx: (this.tx + 2) * T, ty: (this.ty + 1) * T + 8, k: 2, thing: e, harmless: true });
                a.unplace(e, e.tx, e.ty); e.hiddenYank = true; e.inert = true; e.tx = -10; e.ty = -10; e.x = -160; e.y = -160;
                if (!Progress.flag('slack_seen')) { Progress.set('slack_seen'); G.pendingToast = 'The Pull drags it along the great thread into the drum, and the thread goes slack behind it, sagging. Just for a moment.'; }
            }
            if (this.t % 140 === 0) {
                const r = a.roomAt(this.tx, this.ty), y = r.y + 3 + Math.floor(G.rng() * 6), fromL = G.rng() < 0.5;
                this.junk.push({ x: (fromL ? r.x + 1 : r.x + r.w - 2) * T + 8, y: y * T + 8, tx: (this.tx + 2) * T, ty: (this.ty + 1) * T + 8, k: Math.floor(G.rng() * 3) });
            }
            for (const j of this.junk) {
                const dx = j.tx - j.x, dy = j.ty - j.y, d = Math.hypot(dx, dy);
                if (d < 4) {
                    j.gone = true;
                    /* spat back onto its shelf */
                    const e = j.thing;
                    if (e && !e.removed && e.ret) { const [hx, hy] = [e.ret.mx, e.ret.my]; e.tx = hx; e.ty = hy; e.x = hx * T; e.y = hy * T; e.hiddenYank = false; e.inert = false; e.ret.trace = [[hx, hy]]; e.ret.state = 'home'; a.place(e, hx, hy); Fx.poof(hx * T + 8, hy * T + 8); }
                    continue;
                }
                j.x += dx / d * 1.6; j.y += dy / d * 1.6;
                if (!j.harmless && p.area === a && p.state === 'normal' && Math.abs(p.x - j.x) < 8 && Math.abs(p.y - 6 - j.y) < 8) { p.hurt(1, j.x, j.y); j.gone = true; }
            }
            this.junk = this.junk.filter(j => !j.gone);
        }
    }
    draw(cx, cy) {
        const x = this.x - cx, y = this.y - cy;
        const cols = ['#e8463c', '#3fc1b5', '#e0913a', '#4f9be0', '#e8c04a', '#b48ce8', '#d6304e', '#a8784a', '#f0e6d0'];
        Gfx.rect(x - 4, y - 6, 72, 6, '#4a4466'); Gfx.rect(x - 4, y + 28, 72, 6, '#4a4466');
        const turn = Progress.flag('spool_all') ? 0 : this.t;
        for (let i = 0; i < 28; i++) Gfx.rect(x, y + i, 64, 1, cols[(i + (turn >> 3)) % cols.length]);
        for (const j of this.junk) Gfx.img(spr(['block_wood', 'pot', 'crate'][j.k]) || spr('block_wood'), j.x - cx - 8, j.y - cy - 12);
    }
}
SPAWN.greatspool = (x, y, p) => new SpoolDrum(x, y, p);

/* a lane of the Climb: once every Knot is undone, the Pull flings things across it, one way, now and then; one that
   catches you knocks you back down to the door. A pillar in the lane stops what's flying (stand in its lee) */
class JunkLane extends Ent {
    constructor(tx, ty, p = {}) { super('junklane', p); this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T; this.t = p.phase || 0; this.flying = []; }
    get sortY() { return this.y + 20; }
    get on() { return Progress.flag('spool_all') && !Progress.flag('unwound'); }
    update() {
        if (!this.on || Script.blocking()) return;
        const a = this.area, p = G.player, r = a.roomAt(this.tx, this.ty);
        if (++this.t % this.period === 0) this.flying.push({ x: this.tx * T + 8, k: (this.t / this.period) % 3 | 0 });
        for (const j of this.flying) {
            j.x += this.dir * 2.2;
            const tx = Math.floor(j.x / T);
            if (a.kind(tx, this.ty).solid || a.roomAt(tx, this.ty) !== r) { j.gone = true; Fx.dust(j.x, this.ty * T + 8); continue; }
            if (p.area === a && p.state === 'normal' && Math.abs(p.x - j.x) < 10 && Math.abs(p.y - 6 - (this.ty * T + 6)) < 9) {
                j.gone = true; Sfx.play('hitthing'); G.shake = 6; Fx.dust(p.x, p.y);
                p.x = (r.x + 9) * T + 8; p.y = (r.y + 9) * T + 10; p.unstick(); Fx.poof(p.x, p.y);
                if (!Progress.flag('junk_hit')) { Progress.set('junk_hit'); G.pendingToast = 'Something flying knocks you clean off your feet and back down to the foot of the Climb.'; }
            }
        }
        this.flying = this.flying.filter(j => !j.gone);
    }
    draw(cx, cy) {
        if (!this.on) return;
        for (const j of this.flying) Gfx.img(spr(['block_wood', 'pot', 'crate'][j.k]) || spr('block_wood'), j.x - cx - 8, this.ty * T - cy - 4 + Math.sin(j.x / 6) * 2);
    }
}
SPAWN.junklane = (x, y, p) => new JunkLane(x, y, p);

const GreatSpool = {
    /* stepping into the top room: Gran */
    tick(a) {
        const p = G.player, r = Cam.room;
        if (!Progress.flag('spool_all') && !Progress.flag('gs_entered')) { Progress.set('gs_entered'); Progress.setGoal(`Untie the Knots of the Wander, in the rooms round the Spool's foot (${KNOT_HOUSES.filter(k => Progress.flag('untie:' + k)).length} of 6).`); }
        if (r && r.key === '0,3' && p.ty >= r.y + 7 && !(Inv.bedroll && Inv.bedroll.area === a.id && Inv.bedroll.ty < r.y + 6)) {
            this.below = (this.below || 0) + 1;
            if (this.below === 900) UI.toast("No way back up from down here. (Pause, then Save: Back to the House's door.)", 240);
        } else this.below = 0;
        if (!Progress.flag('spool_met') && r && r.name === 'The Top of the Spool' && p.state === 'normal' && !Script.blocking() && !Cam.busy) Script.run(this.meet());
        /* back after a save: Gran is still at the Spool; and if every great thread was cut, the end goes on */
        if (Progress.flag('spool_met') && !Progress.flag('unwound')) {
            const s = a.find('theSpool');
            if (s && !a.ents.some(e => e.who === 'gran')) a.add(new NPC(s.tx + 1, s.ty + 2, { who: 'gran', face: 'down' }));
            if (KNOT_HOUSES.every(h => Progress.flag('great:' + h)) && !Script.running('finale') && !Script.blocking()) Script.run(this.finale(), { name: 'finale' });
        }
    },
    *meet() {
        Progress.set('spool_met');
        const a = G.map, s = a.find('theSpool');
        if (!a.ents.some(e => e.who === 'gran')) a.add(new NPC(s.tx + 1, s.ty + 2, { who: 'gran', face: 'down' }));
        Music.play('pull');
        yield 20;
        yield* say('gran', "You came back. You walked. I felt you go out past the edge, love, and I pulled, and I pulled, and there was nothing on the end.");
        yield* say('gran', "So I pulled everything else. Everyone. Down here, safe, where nobody can wander off. Where nobody gets lost.");
        yield* say('wren', "You can't pull me, Gran.");
        yield* say('gran', "...No. I can't, can I.");
        yield* say(null, "Her hands don't stop. The Spool's six great threads, one to every House, hum like bowstrings. Things come flying off the walls toward the drum: pots, crates, blocks, every marked thing in the valley, wound in.");
        yield* say(null, "The great threads are pulled so taut they ring. Every crate and pot near them shivers, wanting to be wound in.");
        Progress.setGoal('Cut the Spool\'s six great threads, at their posts round the walls. (Too taut to cut, unless something knocks one slack.)');
    },
    *finale() {
        const a = G.map, p = G.player;
        Progress.set('spool_cut');
        G.shake = 14; Sfx.play('rumble');
        yield 30;
        const gran = a.ents.find(e => e.who === 'gran');
        yield* say(null, "The last great thread parts. The Spool lurches, and everything it was winding goes slack at once: in the walls, overhead, all the way up the Well, a long, long sigh of thread.");
        yield* say('gran', "Don't. Don't, love, please. If I let go, I'll lose them. I'll lose you. I lost her.");
        const r = a.rooms.find(q => q.name === 'The Top of the Spool');
        /* Linnet, down the Well after you: in at the door and up the room towards her mother (walks here keep round
           you and whatever's to be left clear, not through) */
        const free = (x, y, who) => a.inside(x, y) && !a.kind(x, y).solid && (!a.at(x, y) || a.at(x, y) === who) && !(p.tx === x && p.ty === y);
        const route = (n, x, y, avoid = []) => {
            const b = { blocks: (bx, by) => (bx === p.tx && by === p.ty) || avoid.some(([ax, ay]) => ax === bx && ay === by) };
            a.blockers.push(b); const path = findPath(a, n.tx, n.ty, x, y, n); a.blockers.splice(a.blockers.indexOf(b), 1);
            return path;
        };
        const go = (n, x, y, sp, avoid) => { n.free = true; n.path = route(n, x, y, avoid); n.walking = !!(n.path && n.path.length); n.walkSpeed = sp; };
        const linnet = a.add(new NPC(r.x + 9, free(r.x + 9, r.y + 10) ? r.y + 10 : r.y + 9, { who: 'linnet', face: 'up' }));
        const lt = [[9, 6], [10, 6], [8, 6], [9, 7]].map(([x, y]) => [r.x + x, r.y + y]).find(([x, y]) => free(x, y, linnet) && route(linnet, x, y));
        if (lt) go(linnet, lt[0], lt[1], 0.8);
        for (let t = 0; t < 150 && (linnet.walking || linnet.mv); t++) yield 1;
        linnet.dir = UP;
        yield 10;
        yield* say('linnet', "Mum.");
        yield* say(null, "Gran's hands go still on the Spool.");
        yield* say('linnet', "I came back. Nobody pulled me. I walked all the way, because I wanted to.");
        yield* say('linnet', "That's the only way anyone ever really comes home, Mum. You have to let them choose it.");
        const i = yield* ask(null, "Gran looks at you. You hold out your hand.", ['Let go, Gran.', 'Come home with us.']);
        yield* say('gran', i === 0 ? "...Let go." : "...Home.");
        /* and she takes her hands off the Spool and comes to you, and Linnet to her other side: one hand in yours, one in
           Linnet's (shown, not told: Ending.hands draws the hands held) */
        if (gran) {
            const fits = s => free(p.tx + s, p.ty, gran) && free(p.tx + 2 * s, p.ty, linnet) && route(gran, p.tx + s, p.ty) && route(linnet, p.tx + 2 * s, p.ty, [[p.tx + s, p.ty]]);
            let s = p.tx < r.x + 10 ? 1 : -1;
            if (!fits(s)) s = -s;
            if (!fits(s)) { yield* walkTo(p, r.x + 8, r.y + 6); s = 1; }
            p.dir = s > 0 ? RIGHT : LEFT;
            const spots = [[gran, p.tx + s, 0.6, []], [linnet, p.tx + 2 * s, 0.8, [[p.tx + s, p.ty]]]];
            go(gran, p.tx + s, p.ty, 0.6);
            yield 40;
            go(linnet, p.tx + 2 * s, p.ty, 0.8, [[p.tx + s, p.ty]]);
            for (let t = 0; t < 420 && spots.some(([n, x]) => n.walking || n.mv || n.tx !== x || n.ty !== p.ty); t++) {
                /* (one held up by the other a while finds its way again) */
                if (t % 90 === 89) for (const [n, x, sp, avoid] of spots) if (!n.mv && (n.tx !== x || n.ty !== p.ty)) go(n, x, p.ty, sp, avoid);
                yield 1;
            }
            for (const [n, x] of spots) if (n.tx !== x || n.ty !== p.ty) { a.unplace(n, n.tx, n.ty); n.mv = null; n.path = null; n.walking = false; n.tx = x; n.ty = p.ty; n.x = n.tx * T; n.y = n.ty * T; a.place(n, n.tx, n.ty); }
            yield 12;
            p.dir = gran.dir = linnet.dir = DOWN; gran.fixedFace = linnet.fixedFace = true;
            Ending.hands = s > 0 ? [p, gran, linnet] : [linnet, gran, p];
            yield 100;
        }
        yield* Ending.unwinding();
    },
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
                else yield* say(null, "The town square. Everyone you cut free is standing about the Well, watching. Threads are pouring into it from every direction: from the hills, the river, the fields, every marked thing in the valley. Nobody here is being pulled. You saw to that.");
                yield* say(null, "The Well's cap is gone. Threads pour into the dark like water going down a drain.");
                yield* camBack();
                Progress.setGoal('Down the Well, to the Great Spool.');
            });
        }
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
            if (Progress.flag('cut:' + npc.who)) return function* () { yield* say(npc.who, "We're all right! Nothing's got hold of us! Go on, Wren!"); };
            if (npc.dragged) return function* () { yield* say(npc.who, ["I can't... stop... walking. Wren? Is that you?", "My feet won't listen. It's the Well. It wants us.", "Go on, love. Down the Well. Don't mind us."][Math.floor(G.rng() * 3)]); };
        }
        /* everyone else with a thread, wherever they are, is holding on to something */
        if (Progress.flag('great_pull') && !Progress.flag('unwound') && !Progress.flag('cut:' + npc.who) && npc.who !== 'gran' && npc.who !== 'linnet' && PEOPLE_DEF[npc.who]) {
            return function* () { yield* say(npc.who, ["It's pulling. Toward the town, toward the Well. I've got my arm round the post, love, I'm all right. Go on.", "Can you feel it? No. No, you can't, can you. Go on, then. Go and stop it."][Math.floor(G.rng() * 2)]); };
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
AREAS.greatspool.ents.push({ k: 'warp', x: 49, y: 42, to: 'hollow', tx2: 95, ty2: 60, face: 'down', room: '2,3' }, { k: 'deco', x: 49, y: 42, look: 'stairs_up', solid: false, baseY: -100, room: '2,3' });

function initGreatSpool() {
    ART.spoolpost = paintSprite(96, 24, x => { const R = (c, a, b, w, h) => sq(c, a, b, w, h, x); const cols = ['#e8463c', '#3fc1b5', '#e0913a', '#4f9be0', '#e8c04a', '#b48ce8']; R('#2a2440', 0, 0, 96, 24); for (let i = 0; i < 22; i++) R(cols[i % 6], 2, 1 + i, 92, 1); });
    SPR.spoolpost = ART.spoolpost;
}
CONTENT_INIT.push(initGreatSpool);

/* Gran at the Spool: talking to her, before it's over */
{
    const talk0 = Story.talk;
    Story.talk = function (npc) {
        if (npc.who === 'gran' && npc.area && npc.area.id === 'greatspool' && !Progress.flag('unwound')) return function* () {
            /* Linnet's bracelet, from the Stray House: shown to her, it does what nothing else could */
            if (Inv.items.bracelet && !Progress.flag('bracelet_top') && Progress.flag('spool_met')) {
                const i = yield* ask(null, "Linnet's bracelet is in your satchel: green thread, plaited, with a little brass L. Show it to Gran?", ['Show her', 'Not now']);
                if (i === 0) {
                    Progress.set('bracelet_top'); Stats.count('secret:bracelet_top');
                    yield* say('gran', "...Where did you... I plaited that. I plaited that for her, the spring before her Wander. She never took it off.");
                    yield* say('gran', "She left it. She left it for somebody to find. For me to find.");
                    yield* say(null, "Gran's hands go slack on the Spool. One after another, of their own accord, three of the great threads loosen and part, and she doesn't reach for them.");
                    const left = KNOT_HOUSES.filter(h => !Progress.flag('great:' + h));
                    for (const h of left.slice(0, 3)) Progress.set('great:' + h);
                    G.shake = 8; Sfx.play('snip');
                    if (KNOT_HOUSES.every(h => Progress.flag('great:' + h))) { Script.run(GreatSpool.finale(), { name: 'finale' }); return; }
                    yield* say('gran', "I can't... I can't let go of the rest, love. My hands won't. You'll have to.");
                    Save.autosave();
                    return;
                }
            }
            yield* say('gran', cycle('gran_spool', ["Go home, love. Please. Go home and let me hold on.", "Twenty-five years I've held on. I can't stop now. If I stop, they'll all go.", "Don't look at me like that. You've your mother's look. And hers."]));
        };
        return talk0.call(this, npc);
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
