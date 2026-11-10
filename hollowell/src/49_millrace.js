/* House 3: the Millrace, above the falls in Millwater. Dad's House (Ambrose), blue threads. Water carries
   floating things off along the currents; the Return brings them back the long way, slower upstream.
   A raft whose mark sits on a current runs by itself like a ferry; rafts carry Wren both ways; a
   waterwheel on a bank turns while something floats in front of it; the Paddle (from the Snapjaw) steers
   anything floating, and paddling holds a thing where it is. Earlier tools join in: the Hookline reels a
   raft over to you; a pot carried on a ride sends its shards back along the ride; strays fill water in.
   The House's end begins at the top of the race (the Paddle first): the Two Wheels, then two rooms that fold in
   the earlier Houses (the Lock: a thing at home blocks the way home, on water; the Bell Race: a pot's pieces ring
   the bells in the order it last passed them, and a ferry passes them one way going out, the other coming home),
   and Old Grindle in the Millpond, three rounds, the pond's sluice turning between them (src/49b_millrace_foes.js). */

THEMES.millhouse = { floor: ['#d8b98a', '#b48a5a', '#ecd2a8', '#8a6440'], wall: ['#8c98a4', '#66727e', '#aab6c0', '#3e4852'], stone: ['#a8b0a8', '#848c86', '#c8d0c8', '#5c645e'], water: ['#4fb0e0', '#3586c8', '#9ad8f2', '#22508e'], dark: '#1c2630' };
/* the mill's floor: wet flagstones laid in courses, the joints dark and green with moss, a shine where the wet catches */
const MILL_SLABS = [[[9, 7], [6, 10]], [[16], [7, 9]], [[5, 11], [16]], [[10, 6], [4, 7, 5]]];
FLOORS.millhouse = {
    floor: (x, th, v) => {
        fill(x, '#55615a');
        MILL_SLABS[v].forEach((widths, row) => {
            let sx = 0;
            widths.forEach((w, i) => {
                const y0 = row * 8, k = hash2(v * 7 + row, i, 61);
                const base = k < 0.33 ? '#96a299' : k < 0.66 ? '#8c988f' : '#a0aba2';
                fill(x, base, sx + 1, y0 + 1, w - 1, 7);
                fill(x, '#bec8c0', sx + 1, y0 + 1, w - 1, 1); fill(x, '#76827a', sx + 1, y0 + 7, w - 1, 1);
                speckle(x, ['#7f8b83', '#a9b4ab'], 71 + v * 5 + row * 3 + i, 0.12, sx + 1, y0 + 2, w - 1, 5);
                /* a little moss where this slab meets the next, and now and then a wet shine */
                if (hash2(v, row * 4 + i, 63) < 0.6) { px(x, sx + w, y0 + 3 + Math.floor(k * 3), '#6f9a50'); px(x, sx + w, y0 + 4 + Math.floor(k * 3), '#86b060'); }
                if (k > 0.7 && w > 5) { px(x, sx + 2 + Math.floor(k * (w - 4)), y0 + 3, '#d6ecef'); px(x, sx + 3 + Math.floor(k * (w - 4)), y0 + 3, '#c4dde2'); }
                sx += w;
            });
        });
        if (v === 2) { px(x, 0, 7, '#6f9a50'); px(x, 1, 8, '#86b060'); }
    },
    floor2: (x, th, v) => { fill(x, '#a8b0a8'); speckle(x, ['#949c96', '#bcc4bc'], 40 + v, 0.3); fill(x, '#7c847e', 0, 15, 16, 1); fill(x, '#7c847e', 15, 0, 1, 16); },
    /* a slatted boardwalk over a channel: boards laid across, the water glinting in the gaps between them */
    floor3: (x, th, v) => {
        fill(x, '#1e3f6e');
        for (let j = 0; j < 4; j++) {
            const y0 = j * 4, c = ['#b08a5a', '#a07a4c', '#bc9662', '#a8824f'][(j + v) % 4];
            fill(x, c, 0, y0, 16, 3); fill(x, '#d0aa74', 0, y0, 16, 1); fill(x, shade(c, -0.18), 0, y0 + 2, 16, 1);
            const n = (j + v) % 2 ? 2 : 13;
            px(x, n, y0 + 1, '#5a4026'); px(x, 15 - n, y0 + 1, '#5a4026');
            if (hash2(v, j, 81) < 0.55) { const gx = 3 + Math.floor(hash2(j, v, 83) * 9); fill(x, '#4fb0e0', gx, y0 + 3, 2, 1); }
        }
    },
};
WALLS.millhouse = {
    edge: '#1c2630',
    top: (x) => { fill(x, '#46525e'); speckle(x, ['#525e6a'], 6, 0.15); },
    face: (x, th, v) => {
        Paint.bricks(x, ['#8c98a4', '#66727e', '#aab6c0', '#3e4852'], v);
        fill(x, '#4f9be0', 0, 13, 16, 1); fill(x, '#1c2630', 0, 15, 16, 1);
        if (v === 3) { fill(x, '#3a2418', 5, 4, 6, 6); fill(x, '#7cc8ee', 6, 5, 4, 4); }   /* a little porthole */
    },
};

const MILL_OUT = { x: 128 + 47, y: 80 + 26 };    /* the door out, on Millrace Falls */

/* a ferry bell: a little brass bell on a post by a landing, with a rope. Rung, its ferry stops waiting: at its own
   landing it sets off now, out at the far end it starts for home now. (Somebody, somewhere, hears it and gives the
   ferry's thread a tug.) */
class BellRope extends GridThing {
    constructor(tx, ty, p = {}) { super('bellrope', tx, ty, Object.assign({ weight: WEIGHT.fixed, fixed: true, marked: false, hookable: false }, p)); this.swing = 0; }
    interact() {
        this.swing = 40; Sfx.play('charm'); Fx.ring(this.tx * T + 8, this.ty * T - 10, '#f7d64a');
        Stats.count('ferrybell');
        const f = this.area.find(this.ferry);
        if (!f || f.removed || f.swallowed || !f.ret || f.mv || f.ret.state === 'returning') return true;   /* (already on its way) */
        if (f.ret.state === 'home') f.driftT = (f.homeWait || Water.HOME_WAIT) - 1;
        else if (!Return.held(f)) f.ret.timer = 1;
        return true;
    }
    tick() { if (this.swing > 0) this.swing--; }
    draw(cx, cy) {
        const x = this.tx * T - cx, y = this.ty * T - cy, wet = this.area.kind(this.tx, this.ty).water;
        if (wet) { Gfx.alpha(0.6); Gfx.rect(x + 3, y + 13, 10, 2, '#d8f2fc'); Gfx.alpha(1); }
        else { Gfx.alpha(0.25); Gfx.rect(x + 4, y + 13, 9, 2, PAL.ink); Gfx.alpha(1); }
        /* the post and its arm */
        Gfx.rect(x + 6, y - 10, 4, 25, PAL.ink); Gfx.rect(x + 7, y - 9, 2, 23, '#9a6438'); Gfx.rect(x + 7, y - 9, 1, 23, '#c9925a');
        Gfx.rect(x + 6, y - 12, 9, 3, PAL.ink); Gfx.rect(x + 7, y - 11, 7, 1, '#c9925a');
        /* the bell hangs off the arm and swings when rung; its rope down the post */
        const sw = Math.round(Math.sin(this.swing / 4) * (this.swing / 40) * 2);
        const bx = x + 12 + sw, by = y - 9;
        Gfx.rect(bx - 3, by, 7, 6, PAL.ink); Gfx.rect(bx - 2, by + 1, 5, 4, '#f7d64a'); Gfx.rect(bx - 2, by + 1, 1, 3, '#fff4c0');
        Gfx.rect(bx - 4, by + 5, 9, 2, PAL.ink); Gfx.rect(bx - 3, by + 5, 7, 1, '#b88a2a');
        Gfx.rect(bx, by + 7, 1, 1, PAL.ink);
        Gfx.line(bx, by + 7, x + 10, y + 6, '#e6c08a'); Gfx.rect(x + 10, y + 6, 2, 3, '#c9925a');
    }
}
SPAWN.bellrope = (x, y, p) => new BellRope(x, y, p);
/* the House's Pattern, at the end of the Bell Race (a game that already holds it, from where it used to be, finds buttons) */
SPAWN.millpattern = (x, y, p) => new Chest(x, y, Object.assign(p, { item: Inv.hasPattern('mill') && !Progress.areaFlag('millrace', 'chest:' + p.id) ? 'b20' : 'pattern' }));

defHouse({
    id: 'millrace', name: 'The Millrace', place: 'The Millrace', house: 'mill', theme: 'millhouse', thread: THREAD.ambrose, music: 'millrace',
    knotName: 'Running Knot',
    entry: MILLRACE_ENTRY,
    legend: {
        'I': { k: 'bridgew', p: 'bridgeV', flow: RIGHT },     /* a footbridge over a current running east */
    },
    cells: {
        /* ---------------- 1 Wheel Hall (entrance): drift, and a wheel that turns as things float past ---------------- */
        '1,3': {
            name: 'Wheel Hall',
            rows: [
                '#########.##########',
                '#........:.........#',
                '#..>>>>>>I>>>>>>>~.#',
                '#........:.........#',
                '#........:.........#',
                '.........:..........',
                '#........:.........#',
                '#........:.........#',
                '#........:.........#',
                '#........:.........#',
                '#########.##########',
            ],
            ents: [
                { k: 'crate', x: 3, y: 3, id: 'whCrate' },
                { k: 'wheel', x: 12, y: 1, face: 'down', sig: 'wh', id: 'whWheel', time: 360 },
                { k: 'door', x: 9, y: 0, type: 'gate', when: 'wh', id: 'whGate', passed: 'up' },
                { k: 'pot', x: 1, y: 9, id: 'whPot1' }, { k: 'pot', x: 18, y: 9, id: 'whPot2' },
                { k: 'warp', x: 9, y: 10, to: 'hollow', tx2: MILL_OUT.x, ty2: MILL_OUT.y, dir: 'down', face: 'down' },
                { k: 'sign', x: 11, y: 9, text: "THE MILLRACE. What floats goes where the water goes. Then it comes home, the long way round." },
            ],
            nudge: { solved: 'millrace_whGate', after: 60 * 60 * 2, thing: 'whCrate', say: 'The crate sits right by the race. The wheel above the water creaks, as if it would like something to turn it.' },
        },
        /* ---------------- 2 Ferry Pool: a raft that runs itself out to an island and back ---------------- */
        '0,3': {
            name: 'Ferry Pool',
            rows: [
                '####################',
                '#~~~~~~~~~~~~~~~~..#',
                '#~....~~~~~~~~~~~..#',
                '#~....~<<<<<<<<<<..#',
                '#~....~~~~~~~~~~A..#',
                '#~~~~~~~~~~~~~~~A...',
                '#~~~~~~~~~~~~~~~A..#',
                '#~~~~~~~~~~~~~~~~..#',
                '#~~~~~~~~~~~~~~~~..#',
                '#~~~~~~~~~~~~~~~~..#',
                '####################',
            ],
            ents: [
                { k: 'raft', x: 16, y: 6, id: 'fpFerry' },
                { k: 'bellrope', x: 6, y: 2, ferry: 'fpFerry', id: 'fpBellFar' }, { k: 'bellrope', x: 16, y: 7, ferry: 'fpFerry', id: 'fpBellHome' },
                { k: 'chest', x: 3, y: 3, item: 'key', id: 'fpKey' },
                { k: 'pot', x: 2, y: 2, id: 'fpPot' },
                { k: 'sign', x: 18, y: 8, text: "FERRY POOL. The ferry goes out to the island and comes back by itself. If you miss it, it'll be along again." },
            ],
            nudge: { solved: 'millrace_chest:fpKey', after: 60 * 60 * 2, thing: 'fpFerry', say: 'The raft bobs at its landing, then sets off. It always comes back to the same spot.' },
        },
        /* ---------------- 3 Backwash: hook the raft over to you; the current takes you both back ---------------- */
        '2,3': {
            name: 'Backwash',
            rows: [
                '####################',
                '#########...########',
                '#########...########',
                '#########...########',
                '##.>>>>>>~..########',
                '.........##v########',
                '#..................#',
                '#..............~~..#',
                '#..............~~..#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'raft', x: 9, y: 4, id: 'bwRaft' },
                { k: 'chest', x: 10, y: 2, item: 'plan', id: 'bwPlan' },
                { k: 'pot', x: 1, y: 9, id: 'bwPot' }, { k: 'pot', x: 18, y: 6, id: 'bwPot2' },
                { k: 'enemy', x: 15, y: 7, type: 'snapper' },
                { k: 'sign', x: 1, y: 6, text: "BACKWASH. What you pull to you, the water takes back." },
            ],
            nudge: { solved: 'millrace_chest:bwPlan', after: 60 * 60 * 3, thing: 'bwRaft', say: "The raft's a long way off across the water. If only something could reach it from the landing." },
        },
        /* ---------------- 4 Carousel: a raft going round and round a millstone pillar to four landings ---------------- */
        '1,2': {
            name: 'The Carousel',
            rows: [
                '#########.##########',
                '#########.##########',
                '#########.##########',
                '#####>>>>>>>>>V#####',
                '#####A########V#####',
                '.....A########V.....',
                '#####A########V#####',
                '#####A<<<<<<<<<#####',
                '#########.##########',
                '#########.##########',
                '#########.##########',
            ],
            ents: [
                { k: 'raft', x: 9, y: 7, id: 'caRaft' },
                { k: 'door', x: 1, y: 5, type: 'lock', id: 'caLockW', dir: 'v' },
                { k: 'sign', x: 10, y: 9, text: 'ALL ROUND THE MILLSTONE: west, north, east, and home again.' },
            ],
        },
        /* ---------------- 5 Shard Race: carry a pot on the ride; smash it at the end; the pieces ride back under the charms ---------------- */
        '0,2': {
            name: 'Shard Race',
            rows: [
                '####################',
                '###############..#.#',
                '##>>>>>>>>>>>>~....#',
                '##A############..#.#',
                '##A##############..#',
                '##A<<<<<<<<<<<<<<...',
                '#################..#',
                '####################',
                '####################',
                '####################',
                '####################',
            ],
            ents: [
                { k: 'raft', x: 16, y: 5, id: 'srFerry' },
                { k: 'pot', x: 18, y: 4, id: 'srPot1' }, { k: 'pot', x: 18, y: 6, id: 'srPot2' },
                { k: 'charm', x: 8, y: 2, mode: 'pulse', sig: 'sr1', col: 'sun', time: 150, id: 'srC1' },
                { k: 'charm', x: 2, y: 4, mode: 'pulse', sig: 'sr2', col: 'moon', time: 150, id: 'srC2' },
                { k: 'charm', x: 9, y: 5, mode: 'pulse', sig: 'sr3', col: 'star', time: 150, id: 'srC3' },
                { k: 'door', x: 17, y: 2, type: 'gate', when: 'sr1&sr2&sr3', id: 'srGate', passed: 'right', dir: 'v' },
                { k: 'chest', x: 18, y: 2, item: 'heartpatch', id: 'srPatch' },
            ],
            nudge: { solved: 'millrace_srGate', after: 60 * 60 * 3, at: [9, 5], say: 'Three charms hang over the race, a long ride apart. One flight back along the ride would ring them all.' },
        },
        /* ---------------- 6 Snapjaw's Race (mini-boss): float crates down onto it; the Paddle ---------------- */
        '2,2': {
            name: "Snapjaw's Race",
            rows: [
                '####################',
                '#...........V#######',
                '#...........V#######',
                '#...........V#######',
                '#...........V#######',
                '............V#######',
                '#...........V#######',
                '#...........V#######',
                '#...........V#######',
                '#...........~#######',
                '####################',
            ],
            ents: [
                { k: 'crate', x: 11, y: 1, id: 'sjCrate1' }, { k: 'crate', x: 11, y: 3, id: 'sjCrate2' },
                { k: 'snapjaw', x: 12, y: 6, id: 'snapjaw' },
                { k: 'shutter', x: 0, y: 5, dir: 'v', group: 'sj' },
                { k: 'chest', x: 4, y: 5, item: 'paddle', id: 'sjPaddle', hidden: true, when: 'flag:millrace_snapjaw', big: true },
                { k: 'pot', x: 1, y: 1, id: 'sjPot1' }, { k: 'pot', x: 1, y: 9, id: 'sjPot2' },
            ],
        },
        /* ---------------- 7 Upstream: paddle up the race to the key, the big door, and the upper floor (the lock east) ----------------
           (the House's last stretch starts at the top of the race either way, so nobody reaches Old Grindle without the Paddle) */
        '1,1': {
            name: 'Upstream',
            rows: [
                '#########.##########',
                '#......#...........#',
                '#......##V##.......#',
                '#......##V##.......#',
                '#......##V##.......#',
                '.......##V##........',
                '#......##V##.......#',
                '#......##V##.......#',
                '#......##~##.......#',
                '#..........#.......#',
                '#########.##########',
            ],
            ents: [
                { k: 'raft', x: 9, y: 8, id: 'upRaft' },
                { k: 'chest', x: 8, y: 1, item: 'key', id: 'upKey' },
                { k: 'door', x: 9, y: 0, type: 'big', id: 'upBig' },
                { k: 'door', x: 18, y: 5, type: 'lock', id: 'upLockE', dir: 'v' },
                { k: 'sign', x: 13, y: 1, text: "TOP OF THE RACE. The quick way back down is the wet way. (Everything comes home.)" },
                { k: 'sign', x: 8, y: 9, text: "UPSTREAM. Nothing goes up the race by itself." },
                { k: 'pot', x: 1, y: 1, id: 'upPot1' }, { k: 'pot', x: 18, y: 1, id: 'upPot2' }, { k: 'pot', x: 1, y: 9, id: 'upPot3' },
                { k: 'enemy', x: 3, y: 4, type: 'nibbler' }, { k: 'enemy', x: 15, y: 7, type: 'nibbler' },
            ],
            nudge: { solved: 'millrace_chest:upKey', after: 60 * 60 * 3, thing: 'upRaft', say: 'The raft waits at the foot of the race. Rafts only go where the water goes... unless somebody steers.' },
        },
        /* ---------------- 8 Overflow: strays fill the water in (stepping stones), the way to the workshop ---------------- */
        '0,1': {
            name: 'Overflow',
            rows: [
                '####.###############',
                '#.......VV.........#',
                '#.......VV.........#',
                '#.......VV.........#',
                '#.......VV.........#',
                '#.......VV..........',
                '#.......VV.........#',
                '#.......VV.........#',
                '#.......VV.........#',
                '#.......~~.........#',
                '####################',
            ],
            ents: [
                { k: 'block', x: 12, y: 2, id: 'ovStray1', stray: true },
                { k: 'block', x: 14, y: 7, id: 'ovStray2', stray: true },
                { k: 'block', x: 13, y: 4, id: 'ovStone' },
                { k: 'block', x: 16, y: 5, id: 'ovStray3', stray: true },
                { k: 'pot', x: 2, y: 2, id: 'ovPot' },
                { k: 'sign', x: 17, y: 8, text: "OVERFLOW. Odd old millstones lie about here, belonging nowhere. Mind they don't fall in." },
            ],
            nudge: { solved: () => [1, 2, 3, 4, 5, 6, 7, 8].some(y => Progress.areaFlag('millrace', `fill:8,${11 + y}`) && Progress.areaFlag('millrace', `fill:9,${11 + y}`)), after: 60 * 60 * 3, thing: 'ovStray1', say: "The pale millstones don't seem to belong anywhere. Things that belong nowhere stay wherever they end up." },
        },
        /* ---------------- 9 The Two Wheels: hold the raft on one wheel until the crate reaches the other (the sluice north) ---------------- */
        '2,1': {
            name: 'The Two Wheels',
            rows: [
                '#.##################',
                '#.##########.#######',
                '#.>>>>>>>>>>~#######',
                '#.............#V####',
                '#.............#V####',
                '..............#V####',
                '#.............#V####',
                '#.............#V####',
                '#.............#V####',
                '#.............#~.###',
                '####################',
            ],
            ents: [
                { k: 'raft', x: 2, y: 2, id: 'twRaft' },
                { k: 'wheel', x: 12, y: 1, face: 'down', sig: 'tw1', mode: 'hold', id: 'twWheel1' },
                { k: 'door', x: 15, y: 4, type: 'gate', when: 'tw1', id: 'twSluice', dir: 'h' },
                { k: 'crate', x: 15, y: 3, id: 'twCrate' },
                { k: 'wheel', x: 16, y: 9, face: 'left', sig: 'tw2', mode: 'hold', id: 'twWheel2' },
                { k: 'door', x: 1, y: 0, type: 'gate', when: 'flag:millrace_twoWheels', id: 'twGate', passed: 'up' },
                { k: 'sign', x: 1, y: 9, text: "TWO WHEELS. When both turn together, the sluice to the north lifts. (One wheel, one sluice: a long way between.)" },
                { k: 'enemy', x: 5, y: 8, type: 'dustbunny' },
            ],
            nudge: { solved: 'millrace_twoWheels', after: 60 * 60 * 4, thing: 'twRaft', say: "The raft only sits on the first wheel a moment before it heads home. Something would have to keep it there." },
        },
        /* ---------------- 12 The Lock (Tidyhouse + Kiln + Millrace): a hold wheel kept turning with nobody holding ----------------
           The keeper's wheel lifts the far gate only while something floats on its water (a dead end past the log's mooring).
           Anything put there heads home the way it came, so the gate drops again; unless its way home runs through the log's
           mooring and the log is home first (a thing at home blocks the way home). Hook the log away down the race (or paddle
           it), put the crate in the race behind it: the log coming home shoves the lighter crate ahead of it, past its
           mooring and onto the wheel's water, and then sits in the crate's way home for good. */
        '2,0': {
            name: 'The Lock',
            rows: [
                '####################',
                '#..................#',
                '#..................#',
                '#.#~~>>>>>~........#',
                '#.#.#######........#',
                '::::::::::::::::::::',
                '#..................#',
                '#...------------...#',
                '#...------------...#',
                '#..................#',
                '#.##################',
            ],
            ents: [
                { k: 'wheel', x: 3, y: 2, face: 'down', sig: 'lk', mode: 'hold', id: 'lkWheel' },
                { k: 'wood', x: 4, y: 3, id: 'lkLog', look: 'mill_log' },
                { k: 'crate', x: 8, y: 2, id: 'lkCrate' },
                { k: 'door', x: 19, y: 5, type: 'gate', when: 'lk', id: 'lkGate', passed: 'right', dir: 'v' },
                { k: 'door', x: 0, y: 5, type: 'big', id: 'lkBig', dir: 'v' },
                { k: 'sign', x: 3, y: 7, text: "THE LOCK. The keeper's wheel holds the far gate up while anything floats on its water, and drops it the moment it's gone." },
                { k: 'pot', x: 18, y: 9, id: 'lkPot1' }, { k: 'pot', x: 18, y: 1, id: 'lkPot2' },
            ],
            nudge: { solved: 'millrace_lkGate', after: 60 * 60 * 3, thing: 'lkLog', say: "The log bobs at its mooring, very settled. Nothing gets past it once it's home." },
        },
        /* ---------------- 13 The Bell Race (Kiln + Millrace): three bells in order, from a ferry that only passes them one way out ----------------
           The bells hang over the race and must ring sun, moon, star. A pot carried on the ride sends its pieces home along
           it, ringing the last bell it passed first: riding out rings them star, moon, sun (wrong), and a ride out and back
           unpicks itself (the thread can't knot). The pot has to reach the far end some other way (the Hookline across to
           the island, or the ferry hooked over and ridden home, or paddled round) and ride home past star, moon, sun. */
        '3,0': {
            name: 'The Bell Race',
            rows: [
                '####################',
                '#...~~~~~~~~~~~....#',
                '#...>>>>>>>>>>~....#',
                '#...~~~~~~~~~~~....#',
                '#...~~~~~~~~~~~~~~~#',
                '....~~~~~~~~~~~~~~~#',
                '#::::::::::::::::::#',
                '#..................#',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'raft', x: 4, y: 2, id: 'brFerry', homeWait: 40 },
                { k: 'charm', x: 6, y: 2, seq: 'brs', order: 0, col: 'sun', glyph: true, id: 'brSun' },
                { k: 'charm', x: 9, y: 2, seq: 'brs', order: 1, col: 'moon', glyph: true, id: 'brMoon' },
                { k: 'charm', x: 12, y: 2, seq: 'brs', order: 2, col: 'star', glyph: true, id: 'brStar' },
                { k: 'eyelet', x: 17, y: 2 },
                { k: 'pot', x: 13, y: 8, id: 'brPot1' }, { k: 'pot', x: 16, y: 8, id: 'brPot2' },
                { k: 'millpattern', x: 2, y: 4, id: 'brPattern', hidden: true, when: 'brs', big: true },
                { k: 'sign', x: 1, y: 3, look: 'mill_carving', text: "A carved board on a post by the landing: a sun, then a moon, then a star, each with little lines round it as if it were ringing. In that order, the carving seems to say." },
                { k: 'sign', x: 1, y: 7, text: "THE BELL RACE. Three clay bells hang over the race. Rung in their proper order, they give up the race's pattern." },
            ],
            nudge: { solved: 'millrace_chest:brPattern', after: 60 * 60 * 4, at: [12, 2], say: "Whatever the pieces passed last, they ring first. Going out, the ferry passes these bells one way round; coming home, the other." },
        },
        /* ---------------- 10 Dad's workshop (signature room) ---------------- */
        '0,0': {
            name: 'Workshop',
            rows: [
                '####################',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '####.###############',
            ],
            ents: [
                { k: 'deco', x: 3, y: 1, look: 'drafting', solid: [[0, 0], [1, 0]], text: "A drafting table. Pinned to it: a careful drawing of a waterwheel, a raft, and an island, labelled RACE, THIRD GO. In the corner, in blue: A.R." },
                { k: 'deco', x: 9, y: 1, look: 'sampler_ambrose', solid: false, oy: -8, baseY: -100, text: 'A sampler, stitched in blue: a wheel and the letters A.R.' },
                { k: 'deco', x: 14, y: 2, look: 'spoolrack', solid: [[0, 0], [1, 0]], text: 'A rack of spools: every one blue. A label on the shelf: SPARE THREAD (MILL). DO NOT LET IT TANGLE.' },
                { k: 'deco', x: 6, y: 6, look: 'model_mill', solid: [[0, 0], [1, 0]], text: "A little model of the Millrace, with a tiny raft on a tiny string. The string runs down through a hole in the table." },
                { k: 'chest', x: 16, y: 7, item: 'heartpatch', id: 'wsPatch' },
                { k: 'signature', x: 10, y: 5, house: 'mill' },
                { k: 'deco', x: 2, y: 8, look: 'flourbag', text: 'A sack of flour, stamped with a wheel. Funny place for flour.' },
            ],
        },
        /* ---------------- 11 The Millpond: Old Grindle (three rounds; the sluice turns the races between them) ---------------- */
        '1,0': {
            name: 'The Millpond',
            rows: [
                '####################',
                '#~~~~~~~~~~~~~~~~~~#',
                '#.....~~~~~~~~.....#',
                '#.....~~~~~~~~.....#',
                '#....>>>>~~<<<<....#',
                '#.~~~~~~~~~~~~~~~~..',
                '#.~~~~~~~A~~~~~~~~.#',
                '#.~~~~~~~A~~~~~~~~.#',
                '#......:::::.......#',
                '#..................#',
                '#########.##########',
            ],
            ents: [
                { k: 'grindle', x: 9, y: 3, id: 'grindle' },
                { k: 'sluice', x: 9, y: 0, id: 'gSluice' },
                /* two barrels on the bank at the heads of the side races */
                { k: 'barrel', x: 5, y: 3, id: 'gbW' }, { k: 'barrel', x: 14, y: 3, id: 'gbE' },
                { k: 'raft', x: 9, y: 7, id: 'gRaft', homeWait: 50 },
                { k: 'bellrope', x: 8, y: 7, ferry: 'gRaft', id: 'gBell' },
                { k: 'pot', x: 7, y: 9, id: 'gPot1' }, { k: 'pot', x: 12, y: 9, id: 'gPot2' },
                { k: 'sign', x: 2, y: 2, text: 'THE MILLPOND. Do not feed the machinery.' },
                { k: 'shutter', x: 9, y: 10, dir: 'h', group: 'boss' },
                { k: 'shutter', x: 19, y: 5, dir: 'v', group: 'boss' },
            ],
        },
    },
    tick: a => Mill.tick(a),
    onEnter: a => Mill.enter(a),
    afterKnot: function* () { yield* Mill.afterKnot(); },
});

const Mill = {
    enter(a) {},
    tick(a) {
        if (Signals.get(a, 'tw1') && Signals.get(a, 'tw2') && !Progress.flag('millrace_twoWheels')) {
            Progress.set('millrace_twoWheels'); Sfx.play('appear'); G.shake = 4;
        }
    },
    *afterKnot() {
        Progress.set('d3');
        Progress.setGoal('Next, Belfry Heights: across the lake from Millwater, up the cliff stair. (The Paddle will get you over.)');
        yield* say(null, 'Somewhere below, a great wheel turns over once, and stops. A hatch in the millpond wall swings open onto the falls.');
        const a = G.map, r = a.rooms.find(r => r.key === '1,0');
        a.add(new Warp(r.x + 2, r.y + 9, { to: 'hollow', tx2: MILL_OUT.x, ty2: MILL_OUT.y, face: 'down' }));
        a.add(new Prop(r.x + 2, r.y + 9, { im: ART.exitlight, solid: [] }));
    },
};
