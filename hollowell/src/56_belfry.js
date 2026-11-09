/* House 4: the Belfry, on Belfry Heights. Mum's House (Tess), brass threads. A tower climbed floor by floor.
   Bells ring things home: everything out of place within reach snaps back at once, and shoves harder doing
   it. A ring wakes sleepers (things tied off where they lie: they go home) and bats. Gusts blow loose things
   along and push Wren (holding on to something heavy keeps her put). The Recall Bell (from Clangor) rings
   wherever Wren is; holding a thing (grip, paddle) keeps it from snapping. Old rules join in: strays fill
   pits; the snap shoves through whatever stands in the way home. Tollgrim lives in the great bell; the gust
   blows its clapper out, and the Recall Bell brings it slamming home into him. */

THEMES.belfryhouse = { floor: ['#d8c8a8', '#b4a27e', '#ecdcbc', '#8a7a5a'], wall: ['#a39aa8', '#7f7688', '#c4bccb', '#5a5264'], stone: ['#a39aa8', '#7f7688', '#c4bccb', '#5a5264'], water: ['#78c4ea', '#4e9ad4', '#b4e4f8', '#2e5a9a'], dark: '#2a2438' };
FLOORS.belfryhouse = {
    floor: (x, th, v) => Paint.planks(x, ['#c8a878', '#a07e52', '#e0c494', '#76583a'], v, true),
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
                { k: 'block', x: 10, y: 2, id: 'bpBoulder', look: 'boulder_b', sleeper: true, tiedOff: true, startAt: [9, 2], trace: [[10, 2], [9, 2]], noPush: true, pushLine: "A boulder, asleep in the doorway. It doesn't stir. It hums a little in its sleep." },
                { k: 'bell', x: 6, y: 4, id: 'bpBell' },
                { k: 'enemy', x: 2, y: 3, type: 'bat' }, { k: 'enemy', x: 17, y: 3, type: 'bat' },
                { k: 'pot', x: 1, y: 9, id: 'bpPot1' }, { k: 'pot', x: 18, y: 9, id: 'bpPot2' },
                { k: 'warp', x: 9, y: 10, to: 'hollow', tx2: BELFRY_OUT.x, ty2: BELFRY_OUT.y, dir: 'down', face: 'down' },
                { k: 'sign', x: 11, y: 9, text: 'THE BELFRY. Strike a bell, and listen. (Mind the bats.)' },
            ],
            nudge: { solved: () => !Progress.areaFlag('belfry', 'sleep:bpBoulder'), after: 60 * 60 * 2, at: [6, 4], say: 'The bell by the door sways in the draught. The boulder in the doorway twitches, as if it were dreaming of bells.' },
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
                { k: 'plate', x: 2, y: 5, sig: 'wp' },
                { k: 'crate', x: 2, y: 5, id: 'wwCrate' },
                { k: 'gust', x: 2, y: 4, w: 14, h: 3, dir: 'right', period: 300, len: 130, force: 0.7, id: 'wwGust' },
                { k: 'vane', x: 1, y: 3, gust: 'wwGust' },
                { k: 'bell', x: 13, y: 2, id: 'wwBell' },
                { k: 'door', x: 16, y: 5, type: 'gate', when: 'wp', dir: 'v', id: 'wwGate', passed: 'right' },
                { k: 'chest', x: 18, y: 5, item: 'plan', id: 'wwPlan' },
                { k: 'sign', x: 1, y: 8, text: 'WINDWARD. The gate opens while the crate sits at home. The crate would love to sit at home.' },
            ],
            nudge: { solved: 'belfry_wwGate', after: 60 * 60 * 3, at: [13, 2], say: 'The crate never gets home before the next gust takes it. Something would have to call it home all at once, in a lull.' },
        },
        /* ---------------- 4 The Stair (hub) ---------------- */
        '1,3': {
            name: 'The Stair',
            rows: [
                '#########.##########',
                '#..................#',
                '#..................#',
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
                { k: 'sign', x: 18, y: 9, text: "WEATHERCOCK WALK. When it blows, hold on to something that won't." },
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
                { k: 'bust', x: 2, y: 2, id: 'reS1', sleeper: true, tiedOff: true, startAt: [17, 1], trace: [[2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2], [15, 2], [16, 2], [17, 2], [17, 1]] },
                { k: 'bust', x: 10, y: 9, id: 'reS2', sleeper: true, tiedOff: true, startAt: [17, 9], trace: [[10, 9], [11, 9], [12, 9], [13, 9], [14, 9], [15, 9], [16, 9], [17, 9]] },
                { k: 'door', x: 3, y: 8, type: 'gate', when: 'r1&!r2', dir: 'v', id: 'reGate', passed: 'left' },
                { k: 'chest', x: 1, y: 8, item: 'key', id: 'reKey' },
                { k: 'sign', x: 18, y: 4, text: "THE REACH. A bell is heard seven strides off, and no further. Some sleepers are best left lying." },
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
                { k: 'deco', x: 16, y: 8, look: 'note_paper', solid: [[0, 0]], text: 'Scratched into the plaster, very small, with a pin: "Sang her to sleep with the stones. Low, high, middle, high, low. She never knew I could. - L."', if: 'belfry_echo' },
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
                '...................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#########.##########',
            ],
            ents: [
                { k: 'door', x: 9, y: 0, type: 'big', id: 'brBig' },
                { k: 'plate', x: 5, y: 3, sig: 'p1' }, { k: 'plate', x: 17, y: 3, sig: 'p2' },
                { k: 'crate', x: 5, y: 3, id: 'brC1', sleeper: true, tiedOff: true, startAt: [15, 6], trace: [[5, 3], [5, 4], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5], [15, 5], [15, 6]] },
                { k: 'crate', x: 17, y: 3, id: 'brC2' },
                { k: 'chest', x: 9, y: 7, item: 'pattern', id: 'brPattern', hidden: true, when: 'flag:belfry_ropes', big: true },
                { k: 'block', x: 0, y: 4, id: 'brWall', look: 'wallblock', sleeper: true, tiedOff: true, startAt: [0, 5], trace: [[0, 4], [0, 5]], noPush: true, pushLine: 'A slab of wall, a bit too clean. It feels warm, like something asleep.' },
                { k: 'sign', x: 18, y: 9, text: "BELL ROPES. The pattern shows when the left plate is pressed and the right one isn't. Hold fast, and ring." },
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
        /* ---------------- 12 The Great Bell: Tollgrim ---------------- */
        '1,0': {
            name: 'The Great Bell',
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
                '#########.##########',
            ],
            ents: [
                { k: 'greatbell', x: 8, y: 1 },
                { k: 'clapper', x: 9, y: 4, id: 'clapper' },
                { k: 'tollgrim', x: 10, y: 3, id: 'tollgrim' },
                { k: 'gust', x: 9, y: 4, w: 2, h: 5, dir: 'down', period: 420, len: 70, id: 'gbGust', when: 'flag:belfry_tollAwake' },
                { k: 'vane', x: 5, y: 8, gust: 'gbGust' }, { k: 'vane', x: 14, y: 8, gust: 'gbGust' },
                { k: 'shutter', x: 9, y: 10, dir: 'h', group: 'boss' },
                { k: 'pot', x: 1, y: 9, id: 'gbPot1' }, { k: 'pot', x: 18, y: 9, id: 'gbPot2' },
            ],
        },
    },
    tick: a => Belfry.tick(a),
    afterKnot: function* () { yield* Belfry.afterKnot(); },
});

const Belfry = {
    seq: [],
    tick(a) {
        /* Bell Ropes: the left plate pressed and the right one not, both at once */
        if (Signals.get(a, 'p1') && !Signals.get(a, 'p2') && !Progress.flag('belfry_ropes')) { Progress.set('belfry_ropes'); Sfx.play('appear'); G.shake = 4; }
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
