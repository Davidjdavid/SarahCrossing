/* House 3: the Millrace, above the falls in Millwater. Dad's House (Ambrose), blue threads. Water carries
   floating things off along the currents; the Return brings them back the long way, slower upstream.
   A raft whose mark sits on a current runs by itself like a ferry; rafts carry Wren both ways; a
   waterwheel on a bank turns while something floats in front of it; the Paddle (from the Snapjaw) steers
   anything floating, and paddling holds a thing where it is. Earlier tools join in: the Hookline reels a
   raft over to you; a pot carried on a ride sends its shards back along the ride; strays fill water in.
   Old Grindle gulps floating barrels at its intake; full, it settles at its mark and its gear-heart shows. */

THEMES.millhouse = { floor: ['#d8b98a', '#b48a5a', '#ecd2a8', '#8a6440'], wall: ['#8c98a4', '#66727e', '#aab6c0', '#3e4852'], stone: ['#a8b0a8', '#848c86', '#c8d0c8', '#5c645e'], water: ['#4fb0e0', '#3586c8', '#9ad8f2', '#22508e'], dark: '#1c2630' };
FLOORS.millhouse = {
    floor: (x, th, v) => Paint.planks(x, ['#d2ae78', '#a8804e', '#e8cc98', '#7a5a36'], v, false),
    floor2: (x, th, v) => { fill(x, '#a8b0a8'); speckle(x, ['#949c96', '#bcc4bc'], 40 + v, 0.3); fill(x, '#7c847e', 0, 15, 16, 1); fill(x, '#7c847e', 15, 0, 1, 16); },
    floor3: (x, th, v) => Paint.planks(x, ['#9a7a52', '#7a5a36', '#b8966a', '#5a4026'], v, true),
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
                '#..................#',
                '#..>>>>>>I>>>>>>>~.#',
                '#..................#',
                '#..................#',
                '....................',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
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
        /* ---------------- 7 Upstream: paddle up the race to the key, and the big door ---------------- */
        '1,1': {
            name: 'Upstream',
            rows: [
                '#########.##########',
                '#......#...#.......#',
                '#......##V##.......#',
                '#......##V##.......#',
                '#......##V##.......#',
                '.......##V##........',
                '#......##V##.......#',
                '#......##V##.......#',
                '#......##~##.......#',
                '#..................#',
                '#########.##########',
            ],
            ents: [
                { k: 'raft', x: 9, y: 8, id: 'upRaft' },
                { k: 'chest', x: 10, y: 1, item: 'key', id: 'upKey' },
                { k: 'door', x: 9, y: 0, type: 'big', id: 'upBig' },
                { k: 'door', x: 18, y: 5, type: 'lock', id: 'upLockE', dir: 'v' },
                { k: 'sign', x: 8, y: 1, text: "TOP OF THE RACE. The quick way back down is the wet way. (Everything comes home.)" },
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
        /* ---------------- 9 The Two Wheels: hold the raft on one wheel until the crate reaches the other (Pattern) ---------------- */
        '2,1': {
            name: 'The Two Wheels',
            rows: [
                '####################',
                '############.#######',
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
                { k: 'chest', x: 7, y: 6, item: 'pattern', id: 'twPattern', hidden: true, when: 'flag:millrace_twoWheels', big: true },
                { k: 'sign', x: 1, y: 9, text: "TWO WHEELS. When both turn together, the race gives up its pattern. (One wheel, one sluice: a long way between.)" },
                { k: 'enemy', x: 5, y: 8, type: 'dustbunny' },
            ],
            nudge: { solved: 'millrace_twoWheels', after: 60 * 60 * 4, thing: 'twRaft', say: "The raft only sits on the first wheel a moment before it heads home. Something would have to keep it there." },
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
        /* ---------------- 11 The Millpond: Old Grindle ---------------- */
        '1,0': {
            name: 'The Millpond',
            rows: [
                '####################',
                '#~~~~~~~~~~~~~~~~~~#',
                '#...~~~~~~~~~~~~...#',
                '#...~~~~~~~~~~~~...#',
                '#.>>>>>>>~~<<<<<<<.#',
                '#.~~~~~~~A~~~~~~~~.#',
                '#.~~~~~~~A~~~~~~~~.#',
                '#.~~~~~~~A~~~~~~~~.#',
                '#.~~~~~~~A~~~~~~~~.#',
                '#..................#',
                '#########.##########',
            ],
            ents: [
                { k: 'grindle', x: 9, y: 3, id: 'grindle' },
                { k: 'barrel', x: 2, y: 3, id: 'gbW' }, { k: 'barrel', x: 17, y: 3, id: 'gbE' },
                { k: 'sign', x: 3, y: 3, text: 'THE MILLPOND. Do not feed the machinery.' },
                { k: 'raft', x: 9, y: 8, id: 'gRaft' },
                { k: 'shutter', x: 9, y: 10, dir: 'h', group: 'boss' },
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
