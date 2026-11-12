/* House 4: the Belfry, on Belfry Heights. Mum's House (Tess), brass threads. A tower climbed floor by floor.
   Bells ring things home: everything out of place within reach snaps back at once, and shoves harder doing
   it. A ring wakes sleepers (things tied off where they lie: they go home) and bats. Gusts blow loose things
   along and push Wren (holding on to something keeps her put). The Recall Bell (from Clangor) rings
   wherever Wren is; holding a thing (grip, paddle) keeps it from snapping. Old rules join in: strays fill
   pits; the snap shoves through whatever stands in the way home. Near the top, two rooms ask for older things
   with the bells: the Bell Frame (a thing at home blocks the way home, and a thing goes home the way it went)
   and the Cistern (the Hookline, and a raft going home carries whoever's aboard). Tollgrim lives in the great
   bell; only the clapper coming home hard knocks him out of it, and he learns (src/56b_belfry_foes.js). */

THEMES.belfryhouse = { floor: ['#d8c8a8', '#b4a27e', '#ecdcbc', '#8a7a5a'], wall: ['#a39aa8', '#7f7688', '#c4bccb', '#5a5264'], stone: ['#a39aa8', '#7f7688', '#c4bccb', '#5a5264'], water: ['#78c4ea', '#4e9ad4', '#b4e4f8', '#2e5a9a'], dark: '#2a2438' };
FLOORS.belfryhouse = {
    /* a bell tower's floor: broad oak boards laid across, two to a tile, each its own shade, butt-jointed here and there,
       nailed down with brass where they cross a joist (not the narrow planks of the other Houses) */
    floor: (x, th, v) => {
        const tone = ['#a0703f', '#946538', '#a87746', '#8f6236'];
        for (let r = 0; r < 2; r++) {
            const y0 = r * 8, c = tone[(r * 3 + v) % 4];
            fill(x, c, 0, y0, 16, 8); fill(x, shade(c, 0.14), 0, y0, 16, 1); fill(x, shade(c, -0.18), 0, y0 + 6, 16, 1); fill(x, '#4e3220', 0, y0 + 7, 16, 1);
            speckle(x, [shade(c, -0.12), shade(c, 0.07)], 70 + v * 4 + r, 0.09, 0, y0 + 1, 16, 5);
            for (let i = 0; i < 16; i++) if (hash2(i, r + v * 2, 59) < 0.28) px(x, i, y0 + 3 + (i % 2), shade(c, -0.08));
            if (hash2(v, r, 53) < 0.6) { const j = 1 + Math.floor(hash2(r, v, 47) * 13); fill(x, '#4e3220', j, y0, 1, 7); px(x, j + 1, y0 + 1, shade(c, 0.14)); }
            if ((v + r) % 2 === 0) { px(x, 7, y0 + 3, '#e8b04a'); px(x, 8, y0 + 3, '#b88a2a'); px(x, 7, y0 + 4, '#8a6420'); }
        }
    },
    /* a ringers' runner: a long purple carpet bound in brass, laid up the middle of the stair */
    runner: (x, th, v) => {
        fill(x, '#5a3e8c'); fill(x, '#7d5bc4', 2, 0, 12, 16); speckle(x, ['#6a4aa8', '#9070d8'], 10 + v, 0.18, 2, 0, 12, 16);
        for (let j = (v & 1) * 4; j < 16; j += 8) { px(x, 7, j + 2, '#e8b04a'); px(x, 8, j + 2, '#e8b04a'); px(x, 6, j + 3, '#b88a2a'); px(x, 9, j + 3, '#b88a2a'); }
        fill(x, '#e8b04a', 1, 0, 1, 16); fill(x, '#e8b04a', 14, 0, 1, 16); fill(x, '#8a6420', 0, 0, 1, 16); fill(x, '#8a6420', 15, 0, 1, 16);
    },
    /* the old bell frame: great oak beams laid one on another, the top of each lit and its side in shadow, the grain
       running along them, bolted with brass; they cast a shadow on the boards at their foot */
    frame: (x, th, v) => {
        fill(x, '#7a4a2a'); fill(x, '#a8703e', 0, 0, 16, 5); fill(x, '#c48a52', 0, 0, 16, 1); fill(x, '#5e3820', 0, 5, 16, 1);
        for (const gy of [2, 7, 10]) for (let i = 0; i < 16; i++) if (hash2(i, gy + v * 3, 61) < 0.5) px(x, i, gy, gy < 5 ? '#946036' : '#6a3e22');
        if (v === 0) { fill(x, '#4a2c18', 9, 0, 1, 13); px(x, 10, 1, '#c48a52'); }
        px(x, 4, 8, '#f7d64a'); px(x, 5, 8, '#b88a2a'); px(x, 4, 9, '#8a6420'); px(x, 12, 8, '#f7d64a'); px(x, 13, 8, '#b88a2a'); px(x, 12, 9, '#8a6420');
        fill(x, '#3a2414', 0, 13, 16, 1); fill(x, '#21150f', 0, 14, 16, 2);
    },
    floor2: (x, th, v) => { fill(x, '#a39aa8'); speckle(x, ['#8f8696', '#b4acba'], 30 + v, 0.3); fill(x, '#7f7688', 0, 15, 16, 1); fill(x, '#7f7688', 15, 0, 1, 16); },
    floor3: (x, th, v) => { fill(x, '#7d5bc4'); speckle(x, ['#6a4aa8', '#9070d8'], 10 + v, 0.2); fill(x, '#e8b04a', 0, 0, 16, 1); fill(x, '#e8b04a', 0, 15, 16, 1); },
};
WALLS.belfryhouse = {
    edge: '#2a2438',
    top: (x) => { fill(x, '#4a4258'); speckle(x, ['#5a5264'], 8, 0.15); },
    face: (x, th, v) => {
        Paint.bricks(x, ['#a39aa8', '#7f7688', '#c4bccb', '#3e3a52'], v);
        fill(x, '#e8b04a', 0, 12, 16, 1); fill(x, '#2a2438', 0, 15, 16, 1);
        if (v === 1) { fill(x, '#2a2438', 6, 3, 4, 7); fill(x, '#78c4ea', 7, 4, 2, 5); }   /* an arrow slit */
    },
};

const BELFRY_OUT = { x: 128 + 30, y: 0 + 8 };    /* the door out, at the foot of the tower */

defHouse({
    id: 'belfry', name: 'The Belfry', place: 'The Belfry', house: 'belfry', theme: 'belfryhouse', thread: THREAD.tess, music: 'belfry',
    knotName: 'Ringing Knot',
    entry: BELFRY_ENTRY,
    cells: {
        /* ---------------- 1 Bell Porch: a ring wakes a sleeper ---------------- */
        '1,4': {
            name: 'Bell Porch',
            rows: [
                '#########.##########',
                '#########.##########',
                '#########..#########',
                '#........R.........#',
                '#........R.........#',
                '.........R..........',
                '#........R.........#',
                '#........R.........#',
                '#........R.........#',
                '#........R.........#',
                '#########R##########',
            ],
            ents: [
                { k: 'block', x: 10, y: 2, id: 'bpBoulder', look: 'boulder_b', sleeper: true, tiedOff: true, startAt: [9, 2], trace: [[10, 2], [9, 2]], noPush: true, pushLine: "A boulder, asleep in the doorway. It doesn't stir. It hums a little in its sleep." },
                { k: 'bell', x: 6, y: 4, id: 'bpBell' },
                { k: 'enemy', x: 2, y: 3, type: 'bat' }, { k: 'enemy', x: 17, y: 3, type: 'bat' },
                { k: 'pot', x: 1, y: 9, id: 'bpPot1' }, { k: 'pot', x: 18, y: 9, id: 'bpPot2' },
                { k: 'warp', x: 9, y: 10, to: 'hollow', tx2: BELFRY_OUT.x, ty2: BELFRY_OUT.y, dir: 'down', face: 'down' },
                { k: 'sign', x: 11, y: 9, text: 'THE BELFRY. Strike a bell, and listen. (Mind the bats.)' },
            ],
            nudge: { solved: () => Progress.areaFlag('belfry', 'woke:bpBoulder'), after: 60 * 60 * 2, at: [6, 4], say: 'The bell by the door sways in the draught. The boulder in the doorway twitches, as if it were dreaming of bells.' },
        },
        /* ---------------- 2 The Draught: the gust carries strays into the pits by the key ---------------- */
        '0,4': {
            name: 'The Draught',
            rows: [
                '####################',
                '#...##.............#',
                '#...##.............#',
                '#...##.............#',
                '#...##.............#',
                '#...oo..............',
                '#...##.............#',
                '#...##.............#',
                '#...##.............#',
                '#...##.............#',
                '####################',
            ],
            ents: [
                { k: 'gust', x: 4, y: 5, w: 15, h: 1, dir: 'left', period: 240, len: 120, id: 'drGust' },
                { k: 'vane', x: 17, y: 4, gust: 'drGust' },
                { k: 'crate', x: 10, y: 7, id: 'drStray1', marked: false },
                { k: 'crate', x: 13, y: 3, id: 'drStray2', marked: false },
                { k: 'crate', x: 8, y: 2, id: 'drCrate' },
                { k: 'chest', x: 2, y: 5, item: 'key', id: 'drKey' },
                { k: 'sign', x: 18, y: 6, text: 'THE DRAUGHT. Everything that blows down the lane ends up in the pits. Most of it comes back.' },
            ],
            nudge: { solved: 'belfry_chest:drKey', after: 60 * 60 * 3, thing: 'drStray1', say: "The pale crates don't belong anywhere. Whatever falls into a pit and doesn't come back fills it in." },
        },
        /* ---------------- 3 Windward: ring the crate home onto its plate in a lull (the Plan) ---------------- */
        '2,4': {
            name: 'Windward',
            rows: [
                '####################',
                '#..................#',
                '#..................#',
                '#...............####',
                '#...............#..#',
                '...................#',
                '#...............#..#',
                '#...............####',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'plate', x: 12, y: 5, sig: 'wp' },
                { k: 'crate', x: 12, y: 5, id: 'wwCrate', patience: 280, startAt: [5, 5], trace: [[12, 5], [11, 5], [10, 5], [9, 5], [8, 5], [7, 5], [6, 5], [5, 5]] },
                /* a strong wind: nothing walks home through it; the gate's upwind, so nobody walks to it through a gust */
                { k: 'gust', x: 6, y: 4, w: 10, h: 3, dir: 'left', period: 340, len: 130, phase: 100, force: 0.7, beats: true, id: 'wwGust' },
                { k: 'vane', x: 15, y: 2, gust: 'wwGust' },
                { k: 'bell', x: 11, y: 2, id: 'wwBell' },
                { k: 'door', x: 16, y: 5, type: 'gate', when: 'wp', dir: 'v', id: 'wwGate', passed: 'right' },
                { k: 'chest', x: 18, y: 5, item: 'plan', id: 'wwPlan' },
                { k: 'sign', x: 1, y: 8, text: 'WINDWARD. The gate opens while the crate sits at home. The crate would love to sit at home.' },
            ],
            nudge: { solved: 'belfry_wwGate', after: 60 * 60 * 3, at: [11, 2], say: 'The crate never gets home before the next gust takes it. Something would have to call it home all at once, in a lull.' },
        },
        /* ---------------- 4 The Stair (hub) ---------------- */
        '1,3': {
            name: 'The Stair',
            rows: [
                '#########.##########',
                '#........R.........#',
                '#........R.........#',
                '#........R.........#',
                '#........R.........#',
                '.........R..........',
                '#........R.........#',
                '#........R.........#',
                '#........R.........#',
                '#........R.........#',
                '#########R##########',
            ],
            ents: [
                { k: 'door', x: 9, y: 0, type: 'lock', id: 'stLockN' },
                { k: 'door', x: 19, y: 5, type: 'lock', id: 'stLockE', dir: 'v' },
                { k: 'bell', x: 9, y: 4, id: 'stBell' },
                { k: 'enemy', x: 3, y: 2, type: 'bat' }, { k: 'enemy', x: 16, y: 2, type: 'bat' }, { k: 'enemy', x: 9, y: 8, type: 'bat' },
                { k: 'deco', x: 3, y: 8, look: 'bellrope', solid: [[0, 0]], text: 'A bell-rope, hanging from somewhere far above. It goes up and up into the dark.' },
                { k: 'deco', x: 16, y: 8, look: 'bellrope', solid: [[0, 0]], text: 'Another bell-rope. You give it a tug. Somewhere above, very faintly: dong.' },
            ],
        },
        /* ---------------- 5 Weathercock Walk: hold on to the busts while the gust blows ---------------- */
        '0,3': {
            name: 'Weathercock Walk',
            rows: [
                '####################',
                '####################',
                '####################',
                '#oooooooooooooooo###',
                '#oooo.ooo.ooo.ooo###',
                '#...................',
                '#oooooooooooooooo..#',
                '#oooooooooooooooo..#',
                '#################..#',
                '#################..#',
                '####################',
            ],
            ents: [
                { k: 'gust', x: 2, y: 3, w: 15, h: 5, dir: 'down', period: 260, len: 120, force: 1.2, id: 'wcGust' },
                { k: 'vane', x: 18, y: 6, gust: 'wcGust' },
                { k: 'bust', x: 5, y: 4, id: 'wcBust1' }, { k: 'bust', x: 9, y: 4, id: 'wcBust2' }, { k: 'bust', x: 13, y: 4, id: 'wcBust3' },
                { k: 'chest', x: 1, y: 5, item: 'key', id: 'wcKey' },
                { k: 'sign', x: 18, y: 9, text: "WEATHERCOCK WALK. The gusts come down off the roof every few breaths, hard enough to lift a roof slate." },
            ],
            nudge: { solved: 'belfry_chest:wcKey', after: 60 * 60 * 3, thing: 'wcBust2', say: "The busts don't shift an inch in the wind. Someone holding on to one wouldn't either." },
        },
        /* ---------------- 6 The Rafters (optional): wake what's asleep, and everything else ---------------- */
        '2,3': {
            name: 'The Rafters',
            rows: [
                '####################',
                '#...............#..#',
                '#...............#..#',
                '#...............#.##',
                '#..................#',
                '...................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'block', x: 16, y: 4, id: 'raWall', look: 'wallblock', sleeper: true, tiedOff: true, startAt: [17, 3], trace: [[16, 4], [17, 4], [17, 3]], noPush: true, pushLine: 'A slab of wall, a bit too clean. It feels warm, like something asleep.' },
                { k: 'chest', x: 18, y: 1, item: 'heartpatch', id: 'raPatch' },
                { k: 'bell', x: 13, y: 4, id: 'raBell' },
                { k: 'enemy', x: 3, y: 2, type: 'bat' }, { k: 'enemy', x: 6, y: 8, type: 'bat' }, { k: 'enemy', x: 12, y: 2, type: 'bat' },
                { k: 'enemy', x: 14, y: 8, type: 'bat' }, { k: 'enemy', x: 9, y: 1, type: 'bat' }, { k: 'enemy', x: 3, y: 8, type: 'bat' },
            ],
        },
        /* ---------------- 7 Clangor's Loft (mini-boss): its own ring snaps the busts home through it ---------------- */
        '1,2': {
            name: "Clangor's Loft",
            rows: [
                '#########.##########',
                '#..................#',
                '#..................#',
                '#..................#',
                '#...................',
                '....................',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#########.##########',
            ],
            ents: [
                { k: 'clangor', x: 9, y: 4, id: 'clangor' },
                { k: 'bust', x: 4, y: 3, id: 'clB1' }, { k: 'bust', x: 15, y: 3, id: 'clB2' },
                { k: 'bust', x: 4, y: 7, id: 'clB3' }, { k: 'bust', x: 15, y: 7, id: 'clB4' },
                { k: 'shutter', x: 0, y: 5, dir: 'v', group: 'cl' }, { k: 'shutter', x: 9, y: 10, dir: 'h', group: 'cl' },
                { k: 'door', x: 9, y: 0, type: 'lock', id: 'clLockN' },
                { k: 'chest', x: 9, y: 6, item: 'bell', id: 'clBell', hidden: true, when: 'flag:belfry_clangor', big: true },
                { k: 'sign', x: 1, y: 9, text: "CLANGOR'S LOFT. When the old armour rings, everything out of place up here goes home at once, and woe betide whatever stands on its way." },
                { k: 'block', x: 19, y: 4, id: 'clWall', look: 'wallblock', sleeper: true, tiedOff: true, startAt: [19, 5], trace: [[19, 4], [19, 5]], noPush: true, pushLine: 'A slab of wall, a bit too clean. It feels warm, like something asleep.' },
            ],
        },
        /* ---------------- 8 The Reach: ring where only the right sleeper hears ---------------- */
        '0,2': {
            name: 'The Reach',
            rows: [
                '####################',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#...................',
                '#####..............#',
                '#..#...............#',
                '#..................#',
                '#..#...............#',
                '####################',
            ],
            ents: [
                { k: 'plate', x: 2, y: 2, sig: 'r1' }, { k: 'plate', x: 10, y: 9, sig: 'r2' },
                { k: 'bust', x: 2, y: 2, id: 'reS1', sleeper: true, tiedOff: true, resetSleep: 'belfry_reach', startAt: [17, 1], trace: [[2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2], [15, 2], [16, 2], [17, 2], [17, 1]] },
                { k: 'bust', x: 10, y: 9, id: 'reS2', sleeper: true, tiedOff: true, resetSleep: 'belfry_reach', startAt: [17, 9], trace: [[10, 9], [11, 9], [12, 9], [13, 9], [14, 9], [15, 9], [16, 9], [17, 9]] },
                /* open while the near sleeper is home on its plate and the far one sleeps on (Belfry.tick says) */
                { k: 'door', x: 3, y: 8, type: 'gate', when: 'r1&r2sleep', dir: 'v', id: 'reGate', passed: 'left' },
                { k: 'chest', x: 1, y: 8, item: 'key', id: 'reKey' },
                { k: 'sign', x: 18, y: 4, text: "THE REACH. A bell is heard seven strides off, and no further. The gate goes by the top plate, and stays shut while the bottom sleeper is awake." },
            ],
            nudge: { solved: 'belfry_reGate', after: 60 * 60 * 3, thing: 'reS1', say: "Two sleepers, a long way apart. Ring close to one and the other won't hear." },
        },
        /* ---------------- 9 Echo Room (S15): ring the stones in the order of Gran's lullaby ---------------- */
        '2,2': {
            name: 'Echo Room',
            dark: true,
            rows: [
                '####################',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '...................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'stone', x: 5, y: 4, pitch: 'low', id: 'esLow' }, { k: 'stone', x: 9, y: 4, pitch: 'mid', id: 'esMid' }, { k: 'stone', x: 13, y: 4, pitch: 'high', id: 'esHigh' },
                { k: 'chest', x: 9, y: 2, item: 'heartpatch', id: 'esPatch', hidden: true, when: 'flag:belfry_echo' },
                { k: 'deco', x: 16, y: 8, look: 'note_paper', solid: [[0, 0]], text: 'Scratched into the plaster, very small, with a pin: "Sang her to sleep with the stones. Low, high, middle, high, low. She never knew I could. -L."', if: 'belfry_echo' },
                { k: 'sign', x: 2, y: 8, text: "Three stones: a big one, a middling one, a small one. Somebody has chalked on the wall: SING HER TO SLEEP." },
            ],
        },
        /* ---------------- 10 Bell Ropes: hold one, ring for the other (the Pattern) ---------------- */
        '1,1': {
            name: 'Bell Ropes',
            rows: [
                '#########.##########',
                '#..................#',
                '#..........#########',
                '#.................##',
                '...........#########',
                '....................',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#########.##########',
            ],
            ents: [
                /* the stair up to the great bell is barred from above (it opens once Tollgrim's beaten); the way up now is
                   east, through the Bell Frame and the Cistern, opened by the same plates as the Pattern */
                { k: 'door', x: 9, y: 0, type: 'gate', when: 'flag:belfry_boss', id: 'brStair' },
                { k: 'sign', x: 10, y: 1, text: 'THE BELL STAIR. Barred from above.' },
                { k: 'door', x: 19, y: 5, type: 'gate', when: 'flag:belfry_ropes|flag:belfry_boss', dir: 'v', id: 'brEast' },
                { k: 'plate', x: 5, y: 3, sig: 'p1' }, { k: 'plate', x: 17, y: 3, sig: 'p2' },
                { k: 'crate', x: 5, y: 3, id: 'brC1', sleeper: true, tiedOff: true, resetSleep: 'belfry_ropes', onHome() { Belfry.ropesHome(this); }, startAt: [15, 6], trace: [[5, 3], [5, 4], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5], [15, 5], [15, 6]] },
                { k: 'crate', x: 17, y: 3, id: 'brC2' },
                { k: 'chest', x: 9, y: 7, item: 'pattern', id: 'brPattern', hidden: true, when: 'flag:belfry_ropes', big: true },
                { k: 'block', x: 0, y: 4, id: 'brWall', look: 'wallblock', sleeper: true, tiedOff: true, startAt: [0, 5], trace: [[0, 4], [0, 5]], noPush: true, pushLine: 'A slab of wall, a bit too clean. It feels warm, like something asleep.' },
                { k: 'sign', x: 18, y: 9, text: "BELL ROPES. The pattern shows when the left plate is pressed and the right one isn't." },
                { k: 'enemy', x: 3, y: 8, type: 'bat' }, { k: 'enemy', x: 16, y: 8, type: 'bat' },
            ],
            nudge: { solved: 'belfry_ropes', after: 60 * 60 * 4, thing: 'brC2', say: "Ring here and both crates come running. Unless one of them is being held." },
        },
        /* ---------------- 11 Mum's workshop (signature room) ---------------- */
        '0,1': {
            name: 'Workshop',
            rows: [
                '####################',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#...................',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'deco', x: 3, y: 2, look: 'bellmould', solid: [[0, 0], [1, 0]], text: 'Moulds for casting bells, nested like bowls. Brass shavings everywhere. On the biggest, scratched: T.' },
                { k: 'deco', x: 9, y: 1, look: 'sampler_tess', solid: false, oy: -8, baseY: -100, text: 'A sampler, stitched in brass-coloured thread: a bell and the letter T.' },
                { k: 'deco', x: 14, y: 3, look: 'tuningforks', solid: [[0, 0]], text: 'A rack of tuning forks, each with a label: STAIR. RAFTERS. PORCH. WAKE THE BOULDER (GENTLY).' },
                { k: 'chest', x: 16, y: 7, item: 'heartpatch', id: 'bwPatch' },
                { k: 'signature', x: 9, y: 5, house: 'belfry' },
            ],
        },
        /* ---------------- 12 The Great Bell: Tollgrim (entered from the Cistern, through the big door) ----------------
           The draught down through the bell (his first beat) and the gale along under it (his second and third) are his:
           he turns them on and off (src/56b_belfry_foes.js). The old tenor bell hangs in the west bay all fight long. */
        '1,0': {
            name: 'The Great Bell',
            rows: [
                '####################',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#...................',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#########.##########',
            ],
            ents: [
                { k: 'greatbell', x: 8, y: 1 },
                { k: 'clapper', x: 9, y: 4, id: 'clapper' },
                { k: 'tollgrim', x: 10, y: 3, id: 'tollgrim' },
                { k: 'gust', x: 9, y: 4, w: 2, h: 5, dir: 'down', period: 260, len: 90, off: true, id: 'gbGust' },
                { k: 'gust', x: 1, y: 4, w: 18, h: 1, dir: 'left', period: 60, len: 60, beats: true, off: true, id: 'gbGale' },
                { k: 'vane', x: 5, y: 9, gust: 'gbGust' }, { k: 'vane', x: 14, y: 9, gust: 'gbGust' },
                { k: 'louvre', x: 19, y: 4 },
                { k: 'bell', x: 2, y: 8, id: 'gbTenor' },
                { k: 'shutter', x: 19, y: 5, dir: 'v', group: 'boss' },
                { k: 'pot', x: 1, y: 9, id: 'gbPot1' }, { k: 'pot', x: 18, y: 9, id: 'gbPot2' },
            ],
        },
        /* ---------------- 13 The Bell Frame (Tidyhouse + Kiln + Belfry): the boulder home first, the crate behind it ----------------
           The plate in the frame's narrow gap holds the north gate open while something sits on it. The sleeping boulder's
           place is the gap's top, right above the plate. Anything coming home up the gap stops on the plate when the
           boulder is home first (a thing at home blocks the way home), so the crate has to come home that way: it goes back
           the way it went, so it has to go out down through the boulder's empty place and the plate. From its home below
           the frame that means the long way round, up the east side and back down through the gap (carried up the gap and
           back, the thread undoes itself). Then ring: the boulder wakes and is home before the crate. */
        '2,1': {
            name: 'The Bell Frame',
            rows: [
                '##############.#####',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '...................#',
                '#FFFF.FFFFFF.......#',
                '#...F.F....F.......#',
                '#...F.F....F.......#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'plate', x: 5, y: 7, sig: 'fb' },
                /* (asleep a step from the gap's mouth: woken, it's in the way of anything leaving the gap at once) */
                { k: 'block', x: 5, y: 6, id: 'fbRock', look: 'boulder_b', sleeper: true, tiedOff: true, resetSleep: 'belfry_frame', startAt: [4, 5], trace: [[5, 6], [5, 5], [4, 5]], noPush: true, noPull: true, pushLine: 'A boulder, fast asleep on its way home. Much too heavy to shift by hand.' },
                { k: 'crate', x: 9, y: 8, id: 'fbCrate' },
                { k: 'bell', x: 8, y: 4, id: 'fbBell' },
                { k: 'door', x: 14, y: 0, type: 'gate', when: 'fb|flag:belfry_boss', id: 'fbGate', passed: 'up' },
                { k: 'deco', x: 2, y: 1, look: 'bellrope', solid: [[0, 0]], text: 'A bell-rope with a red woollen grip, hanging out of the dark. The bell it rang came down long ago.' },
                { k: 'deco', x: 17, y: 3, look: 'bellrope', solid: [[0, 0]], text: 'Another bell-rope. A tug, and nothing at all happens far above.' },
                { k: 'sign', x: 1, y: 3, text: 'THE BELL FRAME. The gate north keeps to the plate in the frame. (The boulder came down with the old bell, and has slept by the frame ever since.)' },
            ],
            nudge: { solved: 'belfry_fbGate', after: 60 * 60 * 3, thing: 'fbRock', say: "The sleeping boulder's place is right above the plate. Woken, it would sit in the way of anything coming home up the gap." },
        },
        /* ---------------- 14 The Cistern (Kiln + Millrace + Belfry): ride the raft home across the gap ----------------
           The floor has fallen in down the middle: a shaft between the near pool and the far channel, too wide for anything
           but the Hookline, and nothing on the far side to catch it but the raft. Hooked over, the raft's way home runs back
           across the shaft (a returning thing hangs on its thread over a drop), and a returning float carries whoever rides
           it. But the gale down the near pool never lets up, and nothing walks home through it (only a bell's snap gets
           through: the raft lies pinned at the pool's foot). So: hook the raft over, step aboard, ring. On the far side, a lever
           lowers the drawbridge for the way back (and once Tollgrim's beaten it's down anyway). */
        '2,0': {
            name: 'The Cistern',
            rows: [
                '####################',
                '#....~ooo~~........#',
                '#....~ooo~~........#',
                '#....~ooo~~........#',
                '#....~ooo~~........#',
                '.....~ooo~~........#',
                '#....~ooo~~........#',
                '#....~ooo~~........#',
                '#....#ooo##........#',
                '#.....ooo..........#',
                '##############.#####',
            ],
            ents: [
                { k: 'raft', x: 5, y: 1, id: 'csRaft' },
                { k: 'gust', x: 9, y: 1, w: 2, h: 7, dir: 'down', period: 60, len: 60, beats: true, id: 'csGale' },     /* (it never lets up) */
                { k: 'vane', x: 12, y: 8, gust: 'csGale' },
                { k: 'door', x: 0, y: 5, type: 'big', id: 'brBig', dir: 'v' },
                { k: 'lever', x: 2, y: 9, id: 'csLever', once: true, onPull() { Belfry.bridge(this.area, true); } },
                { k: 'drawbridge', x: 6, y: 9 },
                { k: 'downpipe', x: 12, y: 0 },
                { k: 'sign', x: 18, y: 7, text: "THE CISTERN. The roof lets the rain in and the floor lets the cistern out. The draught down the old bell shaft never stops." },
                { k: 'pot', x: 18, y: 9, id: 'csPot' },
            ],
            nudge: { solved: () => Progress.areaFlag('belfry', 'cs:over') || Progress.areaFlag('belfry', 'door:brBig'), after: 60 * 60 * 3, thing: 'csRaft', say: 'The raft keeps trying to go home, and the gale keeps blowing it back. Its home is just where you want to be.' },
        },
    },
    legend: {
        'F': { k: 'wall', p: 'frame' },     /* the old bell frame's beams (solid) */
        'R': { k: 'floor', p: 'runner' },   /* the ringers' runner up the stair */
    },
    build: a => Belfry.build(a),
    drawGround: (a, cx, cy) => Belfry.drawGround(a, cx, cy),
    tick: a => Belfry.tick(a),
    afterKnot: function* () { yield* Belfry.afterKnot(); },
});

const Belfry = {
    seq: [],
    /* the Cistern's drawbridge: three planks over the shaft on the old bell-hoist's row */
    BRIDGE: [[6, 9], [7, 9], [8, 9]],
    bridged() { return Progress.areaFlag('belfry', 'bridge:cs') || Progress.flag('belfry_boss'); },
    bridge(a, now) {
        const r = a.rooms.find(q => q.key === '2,0'); if (!r) return;
        for (const [x, y] of this.BRIDGE) a.setCell(r.x + x, r.y + y, '_');
        if (!now) return;
        Progress.setAreaFlag('belfry', 'bridge:cs');
        Sfx.play('door'); Sfx.play('push'); G.shake = 4;
        for (const [x, y] of this.BRIDGE) Fx.dust((r.x + x) * T + 8, (r.y + y) * T + 10);
    },
    build(a) { if (this.bridged()) this.bridge(a, false); },
    /* the Cistern's broken floor: the stone lip torn ragged where the cistern's bottom fell in, the water trickling over it
       into the shaft, and a few puddles where the roof lets the rain in */
    drawGround(a, cx, cy) {
        const r = a._cs || (a._cs = a.rooms.find(q => q.key === '2,0'));
        if (!r || r.x * T - cx > W || (r.x + r.w) * T - cx < 0 || r.y * T - cy > H || (r.y + r.h) * T - cy < 0) return;
        const X = (r.x * T) - cx, Y = (r.y * T) - cy;
        for (const [px0, py0, w, h] of [[2, 3, 18, 7], [13, 4, 14, 6], [16, 6, 10, 5], [3, 7, 12, 5]]) {
            const x0 = X + px0 * T - 2, y0 = Y + py0 * T + 5;
            Gfx.alpha(0.4); Gfx.rect(x0 + 2, y0, w - 4, h, '#4e9ad4'); Gfx.rect(x0, y0 + 1, w, h - 2, '#4e9ad4'); Gfx.rect(x0 + 1, y0 + 1, w - 2, h - 2, '#78c4ea');
            Gfx.alpha(0.7); Gfx.rect(x0 + 3, y0 + 1, Math.round(w / 3), 1, '#ffffff'); Gfx.alpha(1);
        }
        for (let ty = 1; ty <= 9; ty++) for (const [tx, side] of [[6, -1], [8, 1]]) {
            if (a.kind(r.x + tx, r.y + ty).pit !== true) continue;
            const ex = X + tx * T + (side < 0 ? 0 : T - 3), ey = Y + ty * T;
            for (let j = 0; j < 16; j += 2) { const d = 1 + Math.floor(hash2(tx, ty * 8 + j, 71) * 3); Gfx.rect(side < 0 ? ex : ex + 3 - d, ey + j, d, 2, j % 4 ? '#7f7688' : '#5a5264'); }
            /* (where the water stands against the lip, it spills over in a thin fall) */
            if (ty < 8 && hash2(tx, ty, 73) < 0.45) {
                const fx = side < 0 ? ex + 3 : ex - 1, k = (G.t >> 2) % 6;
                for (let i = 0; i < 6; i++) { Gfx.alpha(0.75 - i * 0.1); Gfx.rect(fx + (i === k ? side : 0) * -1, ey + 4 + i * 2, 1, 2, i === k ? '#ffffff' : '#78c4ea'); }
                Gfx.alpha(1);
            }
        }
    },
    tick(a) {
        /* the Reach: the far sleeper still asleep */
        const s2 = a.find('reS2');
        if (s2 && Return.asleep(s2)) Signals.set(a, 'r2sleep');
        const g = a.find('reGate');
        if (g && g.open && !Progress.flag('belfry_reach')) Progress.set('belfry_reach');
        /* the Bell Frame: once Wren's through its gate the boulder stays awake (it doesn't lie down again) */
        const fg = a.find('fbGate');
        if (fg && fg.openedOnce && !Progress.flag('belfry_frame')) Progress.set('belfry_frame');
        /* the Cistern: over on the far side */
        const p = G.player, cr = a._cs || (a._cs = a.rooms.find(q => q.key === '2,0'));
        if (p && cr && p.state === 'normal' && !Progress.areaFlag('belfry', 'cs:over') && p.ty > cr.y && p.ty < cr.y + 10 && p.tx > cr.x && p.tx <= cr.x + 4) Progress.setAreaFlag('belfry', 'cs:over');
    },
    /* Bell Ropes: the left crate comes home onto its plate while nothing presses the right one */
    ropesHome(c) {
        if (Progress.flag('belfry_ropes')) return;
        const a = c.area, p2 = a.ents.find(e => e.kind === 'plate' && e.sig === 'p2');
        if (p2 && p2.weighed()) return;
        Progress.set('belfry_ropes'); Sfx.play('appear'); G.shake = 4;
    },
    /* the Echo Room's stones, struck in turn */
    stone(st) {
        const want = ['low', 'high', 'mid', 'high', 'low'];
        if (Progress.flag('belfry_echo')) return;
        this.seq.push(st.pitch);
        if (this.seq.length > want.length) this.seq.shift();
        if (this.seq.join() === want.join()) {
            Progress.set('belfry_echo'); Stats.count('secret:echo');
            Sfx.play('appear'); Music.play('lullaby');
            UI.toast('The stones hum the tune all together, once, softly. Somewhere a chest clicks open.', 220);
        }
    },
    *afterKnot() {
        Progress.set('d4');
        Progress.setGoal('Home to Hollowell: it is the Knotting Festival.');
        yield* say(null, 'Every bell in the tower rings at once, then all fall quiet together. Down in the valley, very faintly, the town bell answers.');
        const a = G.map, r = a.rooms.find(r => r.key === '1,0');
        a.add(new Warp(r.x + 3, r.y + 9, { to: 'hollow', tx2: BELFRY_OUT.x, ty2: BELFRY_OUT.y, face: 'down' }));
        a.add(new Prop(r.x + 3, r.y + 9, { im: ART.exitlight, solid: [] }));
    },
};
SIGNATURE_TEXT.belfry = "Engraved in the brass plate on the floor, small and neat: a bell and the letter T. Someone signed this House the way a founder signs a bell, on the inside where only the ringer sees.";

/* the Cistern's drawbridge, hauled up against the far side of the shaft on its ropes until the lever lets it down */
class Drawbridge extends Ent {
    constructor(tx, ty, p = {}) { super('drawbridge', p); this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T; }
    get sortY() { return this.y + 14; }
    draw(cx, cy) {
        if (Belfry.bridged()) return;
        const x = this.x - cx, y = this.y - cy;
        /* the planks standing on end at the shaft's lip, a rope from the top over a pulley in the wall above */
        Gfx.rect(x + 1, y - 22, 9, 36, PAL.ink); Gfx.rect(x + 2, y - 21, 7, 34, '#9a6438');
        for (let i = 0; i < 3; i++) Gfx.rect(x + 2 + i * 3, y - 21, 1, 34, i === 0 ? '#c48a52' : '#6b4128');
        for (const by of [y - 17, y + 6]) { Gfx.rect(x + 2, by, 7, 2, '#5a5264'); Gfx.rect(x + 2, by, 7, 1, '#a39aa8'); }
        /* its rope, over to an iron ring on the stone at the channel's foot */
        Gfx.line(x + 5, y - 21, x - 6, y - 9, '#c9925a'); Gfx.line(x + 5, y - 20, x - 6, y - 8, '#9a6438');
        Gfx.circle(x - 7, y - 8, 2, PAL.ink); Gfx.rect(x - 8, y - 9, 2, 2, '#a39aa8');
    }
}
SPAWN.drawbridge = (x, y, p) => new Drawbridge(x, y, p);
/* a lead downpipe bringing the roof's rain down the wall into the cistern (drawn on the wall: nothing stands there) */
SPAWN.downpipe = (tx, ty, p) => {
    const pr = new Prop(tx, ty, { im: ART.downpipe, solid: [], oy: 2 });
    pr.baseY = -100;
    return pr;
};
CONTENT_INIT.push(() => {
    ART.downpipe = paintSprite(12, 30, x => {
        const R = (c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
        R('#5a6270', 3, 0, 6, 26); R('#8f96a0', 4, 0, 2, 26); R('#3e4852', 8, 0, 1, 26);
        R('#5a6270', 1, 4, 10, 3); R('#8f96a0', 1, 4, 10, 1); R('#5a6270', 1, 18, 10, 3); R('#8f96a0', 1, 18, 10, 1);
        R('#5a6270', 2, 25, 8, 3); R('#3e4852', 3, 27, 6, 1); R('#78c4ea', 5, 28, 2, 2);
    });
});
