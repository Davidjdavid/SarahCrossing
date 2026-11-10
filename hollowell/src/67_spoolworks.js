/* House 7: the Spoolworks, under the Guild Hall. The Guild's own works (Gundry's; umber thread), not part of the Wander:
   every room is two, the Works floor up top and the Under-works below it, joined by hatches. Up top, things on their
   marks; below, a cord hanging under every mark: tug it (snap home), hold it (tie off: held fast up top), undo it. A
   counterweight on a plate below holds a gate shut above. Cog the Guild hound gives up the Needle (a new place for
   anything: three stitches at a time). Then the Practice Floor (the apprentices' puppets, worked from a rack below:
   hold them where they're walked) and the Ropewalk (a crate out of reach across a fallen floor: moved into line through
   its cord, then hooked); the Bobbin Loft wants four bobbins on four plates (three stitches and a knot); the Tangle, in
   the heart of the Works, comes apart when all four of its bobbins are held away from it at once, and learns.
   Gundry's own bench is up a ladder nobody can climb while a crate sits on the trapdoor. */

THEMES.spoolworks = { floor: ['#9c6a40', '#7a5232', '#b4825a', '#3a2418'], wall: ['#8a5a3a', '#5a3a26', '#a8784a', '#2a1a10'], stone: ['#8a8076', '#6a6058', '#a89e94', '#3e3832'], water: ['#3f6f98', '#2e5478', '#6f9fc8', '#1c3450'], dark: '#140e0a' };
FLOORS.spoolworks = {
    /* oiled wood blocks laid basket-weave (two to a square, each square turned), oil dark in the joints, and the
       Works' thread-dust caught in them: not the planks of the Houses up the valley */
    floor: (x, th, v) => {
        fill(x, '#5e3c26');
        for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
            const X = i * 8, Y = j * 8, across = (i + j) % 2 === 0;
            for (let k = 0; k < 2; k++) {
                const tone = ['#9c6a40', '#94643c', '#a4704a'][Math.floor(hash2(i * 2 + k, j + v * 3, 41) * 3)];
                if (across) { fill(x, tone, X, Y + k * 4, 8, 3); fill(x, shade(tone, 0.12), X, Y + k * 4, 7, 1); }
                else { fill(x, tone, X + k * 4, Y, 3, 8); fill(x, shade(tone, 0.12), X + k * 4, Y, 1, 7); }
            }
        }
        speckle(x, ['#86582f', '#b0805a'], 70 + v, 0.04);
        /* now and then a stray end of thread caught in a joint */
        if (v === 3) { const f = '#5a7ea8'; px(x, 9, 7, f); px(x, 10, 6, f); px(x, 11, 7, shade(f, -0.2)); }
    },
    floor2: (x, th, v) => { fill(x, '#7a4e32'); for (let i = 0; i < 16; i += 2) fill(x, i % 4 ? '#8a5e3e' : '#6a4228', i, 0, 1, 16); fill(x, '#c9a24a', 0, 0, 16, 1); fill(x, '#c9a24a', 0, 15, 16, 1); },
    /* an iron walkway plate, riveted */
    floor3: (x, th, v) => {
        fill(x, '#5e5a56'); speckle(x, ['#6e6a66', '#4e4a46'], 40 + v, 0.25);
        fill(x, '#7a7672', 0, 0, 16, 1); fill(x, '#7a7672', 0, 0, 1, 16); fill(x, '#3a3632', 0, 15, 16, 1); fill(x, '#3a3632', 15, 0, 1, 16);
        for (const [i, j] of [[2, 2], [12, 2], [2, 12], [12, 12]]) { px(x, i, j, '#b4b0aa'); px(x, i + 1, j + 1, '#2e2a26'); }
    },
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
/* the Under-works: the Spoolworks' own cellar (not the Underside's joists): old flagstones, lint and thread-ends
   gathered in the joints; walls of foundation stone under a timber sill */
THEMES.underworks = { floor: ['#6e6258', '#5a4e46', '#86796c', '#2e2620'], wall: ['#7a6e64', '#5e544c', '#948a80', '#2e2620'], stone: ['#7a6e64', '#5e544c', '#948a80', '#2e2620'], water: ['#3f6f98', '#2e5478', '#6f9fc8', '#1c3450'], dark: '#120c08' };
FLOORS.underworks = {
    floor: (x, th, v) => {
        fill(x, '#4a3e36');
        const slabs = [[[1, 1, 15, 7], [1, 9, 9, 7], [11, 9, 5, 7]], [[1, 1, 7, 15], [9, 1, 7, 9], [9, 11, 7, 5]], [[1, 1, 10, 6], [12, 1, 4, 6], [1, 8, 15, 8]], [[1, 1, 15, 15]]][v];
        slabs.forEach(([X, Y, w, h], n) => {
            const t = ['#6e6258', '#6a5e54', '#72665b'][Math.floor(hash2(n, v, 5) * 3)];
            fill(x, t, X, Y, w, h); fill(x, shade(t, 0.1), X, Y, w, 1); fill(x, shade(t, -0.12), X, Y + h - 1, w, 1);
        });
        speckle(x, ['#62564c', '#7a6e62'], 50 + v, 0.06);
        /* lint gathered along a joint, and now and then a thread-end */
        for (let i = 1; i < 16; i++) if (hash2(i, v, 9) < 0.18) px(x, i, 0, '#9a8c7c');
        if (v === 2) { const f = '#b48ce8'; px(x, 9, 7, f); px(x, 10, 7, f); px(x, 11, 6, shade(f, -0.2)); }
    },
    floor2: (x, th, v) => { fill(x, '#7a6248'); speckle(x, ['#8a7258', '#6a5238'], 40 + v, 0.3); },
    floor3: (x, th, v) => { fill(x, '#3a2c22'); speckle(x, ['#4a3a2c', '#2a2018'], 30 + v, 0.35); },
};
WALLS.underworks = {
    edge: '#120c08',
    top: (x) => { fill(x, '#241a14'); speckle(x, ['#30241c'], 10, 0.2); },
    face: (x, th, v) => {
        Paint.bricks(x, ['#7a6e64', '#5e544c', '#948a80', '#2e2620'], v);
        fill(x, '#5a3e2a', 0, 0, 16, 3); fill(x, '#7a5a3e', 0, 0, 16, 1); fill(x, '#3a2618', 0, 3, 16, 1); fill(x, '#120c08', 0, 15, 16, 1);
    },
};

const SPOOL_OUT = { x: 29, y: 1 };    /* back up in the Guild Hall, in front of the big door */
const WEIGHT_LINE = "An iron counterweight, bolted to nothing, far too heavy to shift an inch. Its mark is only a stitch in the floor, though.";

defHouse({
    id: 'spoolworks', name: 'The Spoolworks', place: 'The Spoolworks', house: 'spoolworks', theme: 'spoolworks', thread: THREAD.guild, music: 'spoolworks',
    entry: SPOOL_ENTRY,
    themeAt: (x, y) => y >= 33 ? 'underworks' : 'spoolworks',
    drawGround: (a, cx, cy) => Spool.drawAbove(a, cx, cy), drawFront: (a, cx, cy) => { Spool.drawAboveFront(a, cx, cy); Spoolworks.drawFront(a, cx, cy); },
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
                '....................',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#########.##########',
            ],
            ents: [
                { k: 'warp', x: 9, y: 10, to: 'underside', tx2: SPOOL_OUT.x, ty2: SPOOL_OUT.y, face: 'down', dir: 'down' },
                /* (at the passage's mouth, below where the House's name is shown as you come in) */
                { k: 'wood', x: 13, y: 3, id: 'gaBlock', startAt: [9, 3], trace: [[13, 3], [12, 3], [11, 3], [10, 3], [9, 3]], knotted: true, patience: 90, pushLine: "It won't budge. Not a quiver. Something is holding it fast from underneath." },
                { k: 'sign', x: 3, y: 8, text: "THE SPOOLWORKS. Up here, the Works floor; under it, the Under-works. Every mark up here has its cord down there. (Trapdoor in the corner.) -G." },
                { k: 'deco', x: 2, y: 2, look: 'spoolrack', ox: 0, solid: [[0, 0], [1, 0]] }, { k: 'deco', x: 16, y: 2, look: 'spoolrack', ox: 0, solid: [[0, 0], [1, 0]] },
                /* the side doors: the Practice Floor's (open while both its plates are down, and for good once you're through)
                   and the Ropewalk's (open once the Practice Floor's done with) */
                { k: 'door', x: 19, y: 5, type: 'gate', when: 'pa1&pa2', passed: 'left', dir: 'v', id: 'gaGateE' },
                { k: 'door', x: 0, y: 5, type: 'gate', when: 'paDone', keep: true, dir: 'v', id: 'gaGateW' },
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
                { k: 'deco', x: 14, y: 0, look: 'spoolshelf', solid: false, baseY: -100 },
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
                '####.###############',
            ],
            ents: [
                { k: 'door', x: 4, y: 2, type: 'gate', when: 'ss1', dir: 'v', id: 'ssGate', passed: 'left' },
                { k: 'chest', x: 2, y: 2, item: 'key', id: 'ssKey' },
                { k: 'plate', x: 15, y: 6, sig: 'ss1' },
                { k: 'wood', x: 15, y: 3, id: 'ssBlock', patience: 120 },
                { k: 'deco', x: 15, y: 1, look: 'spoolrack', ox: 0, solid: [[0, 0], [1, 0]] }, { k: 'deco', x: 6, y: 8, look: 'spoolrack', ox: 0, solid: [[0, 0], [1, 0]] },
                { k: 'sign', x: 18, y: 8, text: "THE SPOOL STORE. The gate's on the plate. The plate's on whatever you put on it, for as long as it stays put. -G." },
                /* the Ropewalk's far side, kept shut from this side until its key's been taken */
                { k: 'door', x: 4, y: 10, type: 'gate', when: 'rwOut', keep: true, dir: 'h', id: 'ssGateS' },
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
                '#########.##########',
            ],
            ents: [
                { k: 'deco', x: 9, y: 2, look: 'kennel', ox: -8, oy: -10, solid: [[0, 0]], text: "A kennel built like a little workshop. Over the door: COG. GOOD BOY. (MOSTLY.)" },
                { k: 'cog', x: 9, y: 4, id: 'cog' },
                { k: 'shutter', x: 0, y: 5, dir: 'v', group: 'cog' }, { k: 'shutter', x: 9, y: 10, dir: 'h', group: 'cog' },
                { k: 'chest', x: 5, y: 2, item: 'needle', id: 'kNeedle', hidden: true, when: 'flag:spool_cog', big: true },
            ],
            /* (not while Cog's about; after, the weight in the south doorway) */
            nudge: { solved: () => { const w = G.map.find('paWeight'); return !Inv.has('needle') || !w || !!w.stitched; }, after: 60 * 60 * 2, at: [9, 9], say: "Nobody can push the weight in the south doorway. But a place can be given, and a stitch can be made: that's what Needles are for." },
        },
        /* ---------------- 5 The Practice Floor: the apprentices' puppets, worked from a rack below ---------------- */
        '2,2': {
            name: 'The Practice Floor',
            rows: [
                '#########.##########',
                '#.......#..#.......#',
                '#..................#',
                '#..................#',
                '#.........#.#.#....#',
                '..........#.#.#....#',
                '#.........#.#.#....#',
                '#.........#.#.#....#',
                '#.........#.#.#....#',
                '#.........#.#.#....#',
                '####################',
            ],
            ents: [
                /* the way in from the Kennel: a weight nobody can push, in a nook of its own (the Needle, first) */
                { k: 'weight', x: 9, y: 1, id: 'paWeight', noPush: true, pushLine: WEIGHT_LINE, stitchName: 'the iron weight' },
                /* two practice puppets on their stands, strung to the rack below; two plates down two runs */
                { k: 'puppet', x: 11, y: 3, id: 'paWren', group: 'pa', look: 'puppet_wren', showThrough: true, stitchName: 'the little wooden Wren' },
                { k: 'puppet', x: 13, y: 3, id: 'paBoy', group: 'pa', look: 'puppet_boy', showThrough: true, stitchName: 'the little wooden boy' },
                { k: 'plate', x: 11, y: 8, sig: 'pa1' }, { k: 'plate', x: 13, y: 6, sig: 'pa2' },
                { k: 'deco', x: 16, y: 0, look: 'spoolshelf', solid: false, baseY: -100 }, { k: 'deco', x: 6, y: 0, look: 'practiceboard', solid: false, baseY: -100 },
                { k: 'sign', x: 17, y: 8, text: "THE PRACTICE FLOOR. Every apprentice learns to work a House from underneath. Puppets first: they forgive you. -G." },
            ],
            nudge: { solved: 'spoolworks_gaGateE', after: 60 * 60 * 3, at: [12, 3], say: 'Two practice puppets, and not a string on them up here. Their strings run down through the floor.' },
        },
        /* ---------------- 6 The Ropewalk: a crate out of reach across a fallen floor (key 2) ---------------- */
        '0,2': {
            name: 'The Ropewalk',
            rows: [
                '####.###############',
                '#.......ooo........#',
                '#.......ooo........#',
                '#.......ooo........#',
                '#.......ooo........#',
                '#.......ooo.........',
                '#.......ooo........#',
                '#.......ooo........#',
                '#.......ooo........#',
                '#.......ooo........#',
                '####################',
            ],
            ents: [
                { k: 'crate', x: 2, y: 2, id: 'rwCrate', patience: 180, stitchName: 'the old crate' },
                { k: 'chest', x: 2, y: 8, item: 'key', id: 'rwKey' },
                /* the ropes laid along the walk, from the jack on the east wall to the post on the west, snapped where the floor went */
                { k: 'deco', x: 11, y: 2, look: 'ropes', ox: 0, solid: false, baseY: -100 }, { k: 'deco', x: 11, y: 7, look: 'ropes', ox: 0, solid: false, baseY: -100 },
                { k: 'deco', x: 1, y: 2, look: 'ropes_w', ox: 0, solid: false, baseY: -100 }, { k: 'deco', x: 1, y: 7, look: 'ropes_w', ox: 0, solid: false, baseY: -100 },
                { k: 'deco', x: 19, y: 2, look: 'ropejack', ox: 0, solid: false, baseY: -100 }, { k: 'deco', x: 19, y: 7, look: 'ropejack', ox: 0, solid: false, baseY: -100 },
                { k: 'deco', x: 0, y: 2, look: 'ropepost', ox: 0, solid: false, baseY: -100 }, { k: 'deco', x: 0, y: 7, look: 'ropepost', ox: 0, solid: false, baseY: -100 },
                { k: 'sign', x: 17, y: 9, text: "THE ROPEWALK. The floor went in the big frost, and the ropes with it. Mind the gap. -G." },
            ],
            nudge: { solved: 'spoolworks_chest:rwKey', after: 60 * 60 * 3, at: [2, 2], say: "That crate's too far off, and never in line with anywhere you can stand. From underneath, though, everything up here hangs within reach." },
        },
        /* ---------------- 7 The Bobbin Loft: four bobbins, four plates (the Pattern) ---------------- */
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
        /* ---------------- 8 The Heart of the Works: the Tangle ---------------- */
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
                { k: 'tbobbin', x: 9, y: 2, id: 'tbN', stitchName: 'the north bobbin' }, { k: 'tbobbin', x: 6, y: 5, id: 'tbW', stitchName: 'the west bobbin' },
                { k: 'tbobbin', x: 12, y: 5, id: 'tbE', stitchName: 'the east bobbin' }, { k: 'tbobbin', x: 9, y: 8, id: 'tbS', stitchName: 'the south bobbin' },
                { k: 'shutter', x: 9, y: 10, dir: 'h', group: 'tangle' },
            ],
        },
        /* ---------------- 9 Gundry's Bench (signature): up a ladder, if the crate on the trapdoor shifts ---------------- */
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
                { k: 'sign', x: 2, y: 2, text: '[act] on a cord: a tug (whatever it holds goes home, now). Hold [act]: tie it off (it stays put up there, whatever happens). [act] on a knot: undo it. -G.' },
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
                '##.#################',
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
                { k: 'door', x: 2, y: 1, type: 'lock', dir: 'h', id: 'usLock' },
                { k: 'chest', x: 5, y: 8, item: 'plan', id: 'usPlan' },
                { k: 'sign', x: 5, y: 4, text: "NORTH: UNDER THE LOFT. Kept locked since the Tangle got into the Loft that time. The spare key's kept in the Ropewalk. -G." },
            ],
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
        '2,5': {
            name: 'Under the Practice Floor', above: '2,2',
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
                { k: 'hatch', x: 3, y: 8 },
                { k: 'underrack', x: 12, y: 3, group: 'pa', id: 'paRack' },
                { k: 'sign', x: 15, y: 2, text: "THE PRACTICE RACK. Its strings go up through the boards to the puppets on the floor above. Take it and they walk; let go, and home they go. -G." },
            ],
            nudge: { solved: 'spoolworks_gaGateE', after: 60 * 60 * 3, at: [12, 3], say: 'Let go of the rack and the puppets walk home. Unless something holds them where they stand.' },
        },
        '0,5': {
            name: 'Under the Ropewalk', above: '0,2',
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
                { k: 'hatch', x: 15, y: 8 },
                { k: 'sign', x: 17, y: 2, text: 'UNDER THE ROPEWALK. Where the light comes down, the floor up there has gone. Down here it holds. -G.' },
            ],
            nudge: { solved: 'spoolworks_chest:rwKey', after: 60 * 60 * 3, at: [2, 2], say: "A hook bites into anything that won't budge, and you go to it." },
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
                /* the counterweight of the Heart's old hoist: its line runs up through the floor */
                { k: 'plate', x: 1, y: 6, sig: 'hoist' },
                { k: 'weight', x: 1, y: 6, id: 'hhWeight', patience: 360, hoistLine: true, stitchName: 'the hoist weight' },
                { k: 'sign', x: 4, y: 6, text: "COUNTERWEIGHT: THE HEART'S HOIST. On its plate, the hook's up. Off it, the hook comes down." },
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
    build: a => Spoolworks.build(a),
});

const Spoolworks = {
    /* (an older save may hold a stitch for the weight that used to stand under the Spool Store: it's gone now, and a
       stitch for nothing shouldn't take up one of the Needle's three) */
    build(a) { if (Inv.stitches) Inv.stitches = Inv.stitches.filter(r => !(r.area === 'spoolworks' && r.key === 'usWeight')); },
    tick(a) {
        /* the Bobbin Loft opens when all four plates have been held down together a moment (not a single frame) */
        const all = ['bl1', 'bl2', 'bl3', 'bl4'].every(s => Signals.get(a, s));
        this.blT = all ? (this.blT || 0) + 1 : 0;
        if (this.blT === 1 && !Progress.areaFlag('spoolworks', 'blHeld')) { Sfx.play('rumble'); G.pendingToast = "All four plates down: somewhere in the wall, a winch begins, very slowly, to turn."; }
        if (this.blT > 300 || Progress.areaFlag('spoolworks', 'blHeld')) { Signals.set(a, 'blHeld'); if (!Progress.areaFlag('spoolworks', 'blHeld')) Progress.setAreaFlag('spoolworks', 'blHeld'); }
        /* once through the Practice Floor's door, the Ropewalk's opens; once the Ropewalk's key is taken, its far door */
        if (Progress.areaFlag('spoolworks', 'door:gaGateE')) Signals.set(a, 'paDone');
        if (Progress.areaFlag('spoolworks', 'chest:rwKey')) Signals.set(a, 'rwOut');
    },
    /* over the room: the Heart's hoist (and the thread it winds round the trapdoor) */
    drawFront(a, cx, cy) {
        if (typeof SpoolFoes !== 'undefined') SpoolFoes.drawHoist(a, cx, cy);
    },
};
SIGNATURE_TEXT.spoolworks = "Burnt into the bench with a hot needle: a little spool, and G.G. Under it, much smaller, much older: L. WAS HERE TOO.";

/* bobbins: iron-cored, heavy, slow to go home */
SPAWN.bobbin = (x, y, p) => new Block(x, y, Object.assign({ weight: WEIGHT.heavy, look: 'bobbin', patience: 240 }, p));

/* the Heart's hoist counterweight: an iron weight on a line that runs up through the boards */
{
    const weight0 = SPAWN.weight;
    SPAWN.weight = (x, y, p) => {
        const w = weight0(x, y, p);
        if (p.hoistLine) w.draw = function (cx, cy) {
            const sx = this.px - cx + 8, sy = this.py - cy;
            const gone = Progress.flag('d7') || SpoolFoes.hoistGone(this.area);
            Gfx.line(sx, sy - (gone ? 4 : 14), sx, sy + 2, '#cfc6b8'); Gfx.line(sx + 1, sy - (gone ? 4 : 14), sx + 1, sy + 2, '#8a8276');
            Block.prototype.draw.call(this, cx, cy);
        };
        return w;
    };
}

/* a crossbar rack in the Under-works: its strings run up through the floor to puppets on the floor above (drawn where
   they show through), and the rack walks them as any rack does */
class UnderRack extends Rack {
    draw(cx, cy) {
        const im = spr('rack'); if (im) Gfx.img(im, this.px - cx, this.py - cy - 8);
        const r = this.area.roomAt(this.tx, this.ty), ab = r && r.above;
        if (!ab) return;
        Gfx.alpha(0.45);
        for (const e of this.area.ents) if (e.kind === 'puppet' && e.group === this.group && !e.removed) Gfx.line(this.px - cx + 8, this.py - cy - 6, e.px - ab.dx * T - cx + 8, e.py - ab.dy * T - cy - 12, THREAD.jory);
        Gfx.alpha(1);
    }
}
SPAWN.underrack = (x, y, p) => new UnderRack(x, y, p);
/* holding a rack whose puppets are up above, the strings run up to where they show through */
{
    const draw0 = Crossbar.draw;
    Crossbar.draw = function (cx, cy) {
        const c = this.ctl, p = G.player, r = c && c.rack && p ? p.area.roomAt(c.rack.tx, c.rack.ty) : null;
        if (!r || !r.above || !c.puppets.some(e => e.area.roomAt(e.tx, e.ty) !== r)) return draw0.call(this, cx, cy);
        const hx = p.x - cx, hy = p.y - cy - 24, ab = r.above;
        Gfx.rect(hx - 6, hy, 12, 2, '#9a6438'); Gfx.rect(hx - 1, hy - 2, 2, 6, '#9a6438');
        Gfx.alpha(0.8);
        for (const e of c.puppets) Gfx.line(hx, hy, e.px - ab.dx * T - cx + 8, e.py - ab.dy * T - cy - 14, THREAD.jory);
        Gfx.alpha(1);
    };
}

function initSpoolworks() {
    const deco = (n, w, h, f, outline = true) => { ART[n] = paintSprite(w, h, f, outline); SPR[n] = ART[n]; };
    /* a little wooden boy for the Practice Floor (a green scarf, a shock of hair) */
    const pp = { w: '#e6c08a', W: '#c49a62', d: '#8a6040', e: '#2a1f2d', h: '#7a4e32', g: '#5ab85a', b: '#4f9be0', B: '#3a6ab0' };
    const boy = arms => ['......kkkk......', '.....khhhhk.....', '....khwwwwhk....', '.....kwewek.....', '.....kggggk.....', '....' + arms + '....', '...kwkbbbbkwk...', '...kk.bbbb.kk...', '......kBBk......', '......kWWk......', '.....kB..Bk.....', '.....kB..Bk.....', '.....kW..Wk.....', '....kkk..kkk....', '...kddddddddk...', '...kkkkkkkkkk...'];
    defSprite('puppet_boy', boy('kkbbbbkk'), pp); defSprite('puppet_boy_up', boy('kwbbbbwk'), pp);
    /* a shelf of spools on a wall, the Makers' colours */
    deco('spoolshelf', 32, 16, x => {
        const R = (c, a, b, w, h) => sq(c, a, b, w, h, x);
        R('#5a3a26', 1, 11, 30, 2); R('#3a2618', 3, 13, 2, 2); R('#3a2618', 27, 13, 2, 2);
        [THREAD.ives, THREAD.bram, THREAD.ambrose, THREAD.tess, THREAD.mallow, THREAD.jory].forEach((c, i) => { R('#c9925a', 2 + i * 5, 3, 4, 1); R(c, 2 + i * 5, 4, 4, 6); R(shade(c, -0.25), 2 + i * 5, 8, 4, 2); R('#c9925a', 2 + i * 5, 10, 4, 1); });
    });
    /* the practice board: chalk on a slate, a puppet and its strings going down through a floor line */
    deco('practiceboard', 32, 16, x => {
        const R = (c, a, b, w, h) => sq(c, a, b, w, h, x);
        R('#6a4630', 1, 1, 30, 14); R('#2e3a34', 3, 3, 26, 10);
        R('#e8e4d8', 6, 5, 3, 3); R('#e8e4d8', 7, 8, 1, 3); R('#e8e4d8', 5, 9, 5, 1);
        R('#e8e4d8', 4, 11, 24, 1); for (let i = 0; i < 3; i++) R('#e8e4d8', 7 + i, 12 - 0, 1, 1);
        R('#e8e4d8', 22, 5, 4, 1); R('#e8e4d8', 24, 5, 1, 6); R('#e8e4d8', 21, 8, 7, 1);
    });
    /* the ropewalk's rope jack (on the east wall) and its ropes, snapped where the floor went */
    deco('ropejack', 16, 16, x => {
        /* the jack the strands are twisted from: a crank wheel on a block, three hooks */
        const R = (c, a, b, w, h) => sq(c, a, b, w, h, x);
        R('#6a4630', 5, 1, 9, 14); R('#9a6438', 6, 2, 7, 12);
        x.strokeStyle = '#c9a24a'; x.lineWidth = 1; x.beginPath(); x.arc(10, 8, 3, 0, Math.PI * 2); x.stroke();
        for (const y of [4, 8, 12]) { R('#c9a24a', 2, y, 4, 1); R('#c9a24a', 2, y - 1, 1, 1); }
    });
    deco('ropepost', 16, 16, x => {
        /* the far post, the strands' ends tied round it */
        const R = (c, a, b, w, h) => sq(c, a, b, w, h, x);
        R('#6a4630', 4, 1, 6, 14); R('#9a6438', 5, 2, 4, 12);
        for (const y of [4, 8, 12]) { R('#d8c08a', 3, y, 9, 1); R('#a8905a', 10, y + 1, 4, 1); }
    });
    const ropes = (n, west) => deco(n, west ? 112 : 128, 16, x => {
        const w = west ? 112 : 128;
        const strand = (y0, c, c2) => {
            for (let i = 0; i < w; i++) {
                const end = west ? w - 8 - (y0 % 3) * 2 : 8 + (y0 % 3) * 2, fr = west ? i > end : i < end;     /* the frayed end at the gap */
                const dy = fr ? Math.round(Math.sin(i * 1.3 + y0) * 1.2 + (west ? i - end : end - i) / 2) : 0;
                x.fillStyle = (i + y0) % 4 < 2 ? c : c2; x.fillRect(i, y0 + dy, 1, 1);
            }
        };
        strand(4, '#d8c08a', '#a8905a'); strand(8, '#c9a46a', '#99743e'); strand(12, '#d8c08a', '#a8905a');
    }, false);
    ropes('ropes', false); ropes('ropes_w', true);
}
CONTENT_INIT.push(initSpoolworks);
