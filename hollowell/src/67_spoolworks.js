/* House 7: the Spoolworks, under the Guild Hall. The Guild's own works (Gundry's; umber thread), not part of the Wander:
   every room is two, the Works floor up top and the Under-works below it, joined by hatches. Up top, things on their
   marks; below, a cord hanging under every mark: tug it (snap home), hold it (tie off: held fast up top), undo it. A
   counterweight on a plate below holds a gate shut above. Cog the Guild hound gives up the Needle (a new place for
   anything: three stitches at a time); the Bobbin Loft wants four bobbins on four plates (three stitches and a knot);
   the Tangle, in the heart of the Works, comes apart when all four of its bobbins are pulled away at once.
   Gundry's own bench is up a ladder nobody can climb while a crate sits on the trapdoor. */

THEMES.spoolworks = { floor: ['#9a7a5a', '#7a5a3e', '#b89670', '#4a3424'], wall: ['#8a5a3a', '#5a3a26', '#a8784a', '#2a1a10'], stone: ['#8a8076', '#6a6058', '#a89e94', '#3e3832'], water: ['#3f6f98', '#2e5478', '#6f9fc8', '#1c3450'], dark: '#140e0a' };
FLOORS.spoolworks = {
    /* boards worn pale down the middle, brass-capped seams; a woven runner; iron plate */
    floor: (x, th, v) => Paint.planks(x, ['#a8865e', '#7a5a3e', '#c4a47c', '#4a3424'], v, false),
    floor2: (x, th, v) => { fill(x, '#7a4e32'); for (let i = 0; i < 16; i += 2) fill(x, i % 4 ? '#8a5e3e' : '#6a4228', i, 0, 1, 16); fill(x, '#c9a24a', 0, 0, 16, 1); fill(x, '#c9a24a', 0, 15, 16, 1); },
    floor3: (x, th, v) => { fill(x, '#5a5650'); speckle(x, ['#6a6660', '#4a4640'], 40 + v, 0.3); fill(x, '#3a3632', 0, 0, 16, 1); fill(x, '#3a3632', 0, 0, 1, 16); },
};
WALLS.spoolworks = {
    edge: '#140e0a',
    top: (x) => { fill(x, '#3a2618'); speckle(x, ['#4a3020'], 10, 0.2); },
    face: (x, th, v) => {
        /* brick, a brass pipe along it */
        fill(x, '#8a5a3a'); for (let y = 0; y < 14; y += 4) { fill(x, '#6a4228', 0, y + 3, 16, 1); fill(x, '#6a4228', ((y >> 2) % 2) * 8 + 3, y, 1, 3); }
        fill(x, '#c9a24a', 0, 6, 16, 2); fill(x, '#f7d64a', 0, 6, 16, 1); fill(x, '#140e0a', 0, 15, 16, 1);
    },
};

const SPOOL_OUT = { x: 29, y: 1 };    /* back up in the Guild Hall, in front of the big door */

defHouse({
    id: 'spoolworks', name: 'The Spoolworks', place: 'The Spoolworks', house: 'spoolworks', theme: 'spoolworks', thread: THREAD.guild, music: 'spoolworks',
    entry: SPOOL_ENTRY,
    themeAt: (x, y) => y >= 33 ? 'underside' : 'spoolworks',
    drawGround: (a, cx, cy) => Spool.drawAbove(a, cx, cy),
    cells: {
        /* ================= the Works floor (up top) ================= */
        /* ---------------- 1 The Gatehouse: a crate held fast from underneath ---------------- */
        '1,2': {
            name: 'The Gatehouse',
            rows: [
                '#########.##########',
                '#.......#.#........#',
                '#.......#.#........#',
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
                { k: 'warp', x: 9, y: 10, to: 'underside', tx2: SPOOL_OUT.x, ty2: SPOOL_OUT.y, face: 'down', dir: 'down' },
                { k: 'wood', x: 13, y: 3, id: 'gaBlock', startAt: [9, 2], trace: [[13, 3], [12, 3], [11, 3], [10, 3], [9, 3], [9, 2]], knotted: true, patience: 90, pushLine: "It won't budge. Not a quiver. Something is holding it fast from underneath." },
                { k: 'sign', x: 3, y: 8, text: "THE SPOOLWORKS. Up here, the Works floor; under it, the Under-works. Every mark up here has its cord down there. (Trapdoor in the corner.) -G." },
                { k: 'deco', x: 2, y: 2, look: 'spoolrack', ox: 0, solid: [[0, 0], [1, 0]] }, { k: 'deco', x: 16, y: 2, look: 'spoolrack', ox: 0, solid: [[0, 0], [1, 0]] },
            ],
            nudge: { solved: () => { const b = G.map.find('gaBlock'); return !b || !b.knotted; }, after: 60 * 60 * 2, at: [16, 8], say: 'The crate in the passage sits on nothing, but it is held as if somebody had hold of it. From underneath, somebody would.' },
        },
        /* ---------------- 2 The Winding Hall: the middle of the Works ---------------- */
        '1,1': {
            name: 'The Winding Hall',
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
                { k: 'door', x: 9, y: 0, type: 'big', id: 'swBig' },
                { k: 'door', x: 0, y: 5, type: 'gate', when: '!hw1', passed: 'left', dir: 'v', id: 'swGateW' },
                { k: 'door', x: 19, y: 5, type: 'lock', dir: 'v', id: 'swLockE' },
                { k: 'deco', x: 8, y: 4, look: 'winder', ox: 0, solid: [[0, 0], [1, 0], [2, 0], [3, 0]], text: 'The great winder: a wheel taller than you, every spoke wound with thread, turning so slowly you have to watch a long time to be sure it moves.' },
                { k: 'sign', x: 3, y: 1, text: 'THE WINDING HALL. West: the Spool Store (its gate hangs on a weight below). East: the Kennel. North: the Heart of the Works.' },
                { k: 'spoolmite', x: 4, y: 8 }, { k: 'spoolmite', x: 15, y: 2 },
            ],
        },
        /* ---------------- 3 The Spool Store: push it on, tie it there (key) ---------------- */
        '0,1': {
            name: 'The Spool Store',
            rows: [
                '#########.##########',
                '#...#..............#',
                '#..................#',
                '#...#..............#',
                '#####..............#',
                '#...................',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'door', x: 4, y: 2, type: 'gate', when: 'ss1', dir: 'v', id: 'ssGate', passed: 'left' },
                { k: 'chest', x: 2, y: 2, item: 'key', id: 'ssKey' },
                { k: 'plate', x: 15, y: 6, sig: 'ss1' },
                { k: 'wood', x: 15, y: 3, id: 'ssBlock', patience: 120 },
                { k: 'deco', x: 15, y: 1, look: 'spoolrack', ox: 0, solid: [[0, 0], [1, 0]] }, { k: 'deco', x: 6, y: 8, look: 'spoolrack', ox: 0, solid: [[0, 0], [1, 0]] },
                { k: 'sign', x: 18, y: 8, text: "THE SPOOL STORE. The gate's on the plate. The plate's on whatever you put on it, for as long as it stays put. -G." },
            ],
            nudge: { solved: 'spoolworks_chest:ssKey', after: 60 * 60 * 3, at: [15, 8], say: 'The block goes back before you can get round to the gate. Up here, nothing will keep it on the plate. Down there, something might.' },
        },
        /* ---------------- 4 The Kennel: Cog the Guild hound (the Needle) ---------------- */
        '2,1': {
            name: 'The Kennel',
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
                { k: 'deco', x: 9, y: 2, look: 'kennel', ox: -8, oy: -10, solid: [[0, 0]], text: "A kennel built like a little workshop. Over the door: COG. GOOD BOY. (MOSTLY.)" },
                { k: 'cog', x: 9, y: 4, id: 'cog' },
                { k: 'shutter', x: 0, y: 5, dir: 'v', group: 'cog' },
                { k: 'chest', x: 5, y: 2, item: 'needle', id: 'kNeedle', hidden: true, when: 'flag:spool_cog', big: true },
            ],
        },
        /* ---------------- 5 The Bobbin Loft: four bobbins, four plates (the Pattern) ---------------- */
        '0,0': {
            name: 'The Bobbin Loft',
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
                { k: 'plate', x: 3, y: 3, sig: 'bl1', minWeight: 3 }, { k: 'plate', x: 15, y: 3, sig: 'bl2', minWeight: 3 },
                { k: 'plate', x: 3, y: 8, sig: 'bl3', minWeight: 3 }, { k: 'plate', x: 15, y: 8, sig: 'bl4', minWeight: 3 },
                { k: 'bobbin', x: 6, y: 4, id: 'blB1' }, { k: 'bobbin', x: 12, y: 4, id: 'blB2' }, { k: 'bobbin', x: 6, y: 7, id: 'blB3' }, { k: 'bobbin', x: 12, y: 7, id: 'blB4' },
                { k: 'chest', x: 9, y: 2, item: 'pattern', id: 'blPattern', hidden: true, when: 'blHeld' },
                { k: 'door', x: 9, y: 10, type: 'gate', when: 'blHeld', keep: true, id: 'blExit' },
                { k: 'sign', x: 1, y: 1, text: 'THE BOBBIN LOFT. Four plates, four bobbins (iron cored: only a bobbin will do). The way out wants all four at once.' },
            ],
            nudge: { solved: 'spoolworks_chest:blPattern', after: 60 * 60 * 4, at: [9, 8], say: 'Three bobbins can be given new places on their plates. The fourth needs holding there, and nobody up here has a free hand.' },
        },
        /* ---------------- 6 The Heart of the Works: the Tangle ---------------- */
        '1,0': {
            name: 'The Heart of the Works',
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
                { k: 'tangle', x: 9, y: 5, id: 'tangle' },
                { k: 'tbobbin', x: 9, y: 2, id: 'tbN' }, { k: 'tbobbin', x: 4, y: 5, id: 'tbW' }, { k: 'tbobbin', x: 14, y: 5, id: 'tbE' }, { k: 'tbobbin', x: 9, y: 8, id: 'tbS' },
                { k: 'shutter', x: 9, y: 10, dir: 'h', group: 'tangle' },
            ],
        },
        /* ---------------- 7 Gundry's Bench (signature): up a ladder, if the crate on the trapdoor shifts ---------------- */
        '2,0': {
            name: "Gundry's Bench",
            rows: [
                '####################',
                '#..................#',
                '#..................#',
                '#..................#',
                '#........#.........#',
                '#.......#.#........#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'crate', x: 9, y: 6, id: 'gbCrate' },
                { k: 'signature', x: 4, y: 2, house: 'spoolworks' },
                { k: 'chest', x: 15, y: 2, item: 'heartpatch', id: 'gbPatch' },
                { k: 'deco', x: 11, y: 8, look: 'longtable', ox: 0, solid: [[0, 0], [1, 0], [2, 0], [3, 0]], text: "Gundry's bench. A Needle-shaped dent in the wood, worn smooth; a pair of spectacles; a drawing of a dog, labelled COG, AGED 2." },
            ],
        },
        /* ================= the Under-works (below; up above shows through) ================= */
        '1,5': {
            name: 'Under the Gatehouse', above: '1,2',
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
                '####################',
            ],
            ents: [
                { k: 'hatch', x: 16, y: 8 },
                { k: 'sign', x: 2, y: 2, text: 'Z on a cord: a tug (whatever it holds goes home, now). Hold Z: tie it off (it stays put up there, whatever happens). Z on a knot: undo it. -G.' },
                { k: 'spoolmite', x: 5, y: 7 },
            ],
        },
        '1,4': {
            name: 'Under the Winding Hall', above: '1,1',
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
                '####################',
            ],
            ents: [
                { k: 'hatch', x: 17, y: 8 },
                { k: 'plate', x: 12, y: 5, sig: 'hw1' },
                { k: 'weight', x: 12, y: 5, id: 'hwWeight', patience: 240 },
                { k: 'stray', x: 13, y: 6, id: 'hwStray' },
                { k: 'sign', x: 15, y: 9, text: "COUNTERWEIGHT: SPOOL STORE GATE. On its plate, the gate's shut. Off it, it's open, till the weight goes home." },
                { k: 'spoolmite', x: 6, y: 3 },
            ],
            nudge: { solved: 'spoolworks_swGateW', after: 60 * 60 * 3, thing: 'hwStray', say: 'The weight always goes back the way it came. Unless something heavy is standing in that way.' },
        },
        '0,4': {
            name: 'Under the Spool Store', above: '0,1',
            rows: [
                '##.#################',
                '##.#################',
                '##..################',
                '##.#################',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'hatch', x: 16, y: 5 },
                { k: 'weight', x: 2, y: 2, id: 'usWeight', noPush: true, pushLine: "An iron counterweight, bolted to nothing, far too heavy to shift an inch. Its mark is only a stitch in the floor, though." },
                { k: 'chest', x: 5, y: 8, item: 'plan', id: 'usPlan' },
                { k: 'sign', x: 5, y: 4, text: 'NORTH: UNDER THE LOFT. (A weight in the way. Too heavy for anybody. Its place is only stitched.)' },
            ],
            nudge: { solved: () => { const w = G.map.find('usWeight'); return !w || w.stitched; }, after: 60 * 60 * 2, at: [2, 2], say: "Nobody can push the weight. But a place can be given, and a stitch can be made: that's what Needles are for." },
        },
        '2,4': {
            name: 'Under the Kennel', above: '2,1',
            rows: [
                '#########.##########',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'hatch', x: 9, y: 8 }, { k: 'hatch', x: 17, y: 8 },
            ],
        },
        '0,3': {
            name: 'Under the Bobbin Loft', above: '0,0',
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
                '##.#################',
            ],
            ents: [
                { k: 'hatch', x: 9, y: 8 },
            ],
        },
        '1,3': {
            name: 'Under the Heart', above: '1,0',
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
                '####################',
            ],
            ents: [
                { k: 'hatch', x: 2, y: 8 },
            ],
        },
        '2,3': {
            name: "Under Gundry's Bench", above: '2,0',
            rows: [
                '####################',
                '#..................#',
                '#..................#',
                '#..................#',
                '#........#.........#',
                '#.......#.#........#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#########.##########',
            ],
            ents: [
                { k: 'hatch', x: 9, y: 5 },
                { k: 'sign', x: 3, y: 8, text: "GUNDRY'S. KEEP OUT. (That means you, Bram.)" },
            ],
        },
    },
    tick: a => Spoolworks.tick(a),
});

const Spoolworks = {
    tick(a) {
        /* the Bobbin Loft opens when all four plates have been held down together a moment (not a single frame) */
        const all = ['bl1', 'bl2', 'bl3', 'bl4'].every(s => Signals.get(a, s));
        this.blT = all ? (this.blT || 0) + 1 : 0;
        if (this.blT === 1 && !Progress.areaFlag('spoolworks', 'blHeld')) { Sfx.play('rumble'); G.pendingToast = "All four plates down: somewhere in the wall, a winch begins, very slowly, to turn."; }
        if (this.blT > 300 || Progress.areaFlag('spoolworks', 'blHeld')) { Signals.set(a, 'blHeld'); if (!Progress.areaFlag('spoolworks', 'blHeld')) Progress.setAreaFlag('spoolworks', 'blHeld'); }
    },
};
SIGNATURE_TEXT.spoolworks = "Burnt into the bench with a hot needle: a little spool, and G.G. Under it, much smaller, much older: L. WAS HERE TOO.";

/* bobbins: iron-cored, heavy, slow to go home */
SPAWN.bobbin = (x, y, p) => new Block(x, y, Object.assign({ weight: WEIGHT.heavy, look: 'bobbin', patience: 240 }, p));
