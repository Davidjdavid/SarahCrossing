/* House 1: the Tidyhouse, in Meadowfold. The Return itself: patience as a timer, plates pressed in
   passing, heavier shoves lighter, a thing at home blocks the way home, carrying and throwing traces,
   and (with the Gloves) pulling and gripping. The finale tidies a room whose returns deadlock.
   Room by room in DUNGEON_TRACKER.md. Teal threads. */

/* where the Tidyhouse's door is, out in Meadowfold (overworld tiles) */
const TIDY_OUT = { x: 64 + 44, y: 80 + 13 };

const TIDY_LEGEND = {
    'l': { k: 'low', p: 'counter' },
    'U': { k: 'floor', p: 'floor', ent: 'bust' }, 'u': { k: 'floor', p: 'floor2', ent: 'bust' },
    'p': { k: 'floor', p: 'floor3', ent: 'pot', props: { style: 'pot_teal' } },
};

defHouse({
    id: 'tidy', name: 'The Tidyhouse', place: 'The Tidyhouse', house: 'tidy', theme: 'tidy', thread: THREAD.ives, music: 'tidy',
    knotName: 'Tidy Knot', legend: TIDY_LEGEND,
    entry: { x: 29, y: 42 },
    cells: {
        /* ---------------- 1 Foyer ---------------- */
        '1,3': {
            name: 'Foyer',
            rows: [
                '#########.##########',
                '#..................#',
                '#.,,,,,,,,,,,,,,,,.#',
                '#.,U............U,.#',
                '#.,..............,.#',
                '.................,..',
                '#.,..............,.#',
                '#.,U............U,.#',
                '#.,,,,,,,,,,,,,,,,.#',
                '#..................#',
                '#########.##########',
            ],
            ents: [
                { k: 'wood', x: 5, y: 5, id: 'foyerBlock' },
                { k: 'plate', x: 7, y: 5, sig: 'f1' },
                { k: 'door', x: 9, y: 0, type: 'gate', when: 'f1', passed: 'up', id: 'fN' },
                { k: 'door', x: 19, y: 5, type: 'lock', dir: 'v', id: 'fE' },
                { k: 'sign', x: 11, y: 9, text: 'THE TIDYHOUSE. Please leave everything exactly as you found it. (It will insist.)' },
                { k: 'warp', x: 9, y: 10, to: 'hollow', tx2: TIDY_OUT.x, ty2: TIDY_OUT.y, dir: 'down', face: 'down' },
            ],
            nudge: { solved: 'tidy_fN', after: 60 * 60 * 2, thing: 'foyerBlock', say: 'Somewhere in the walls, something ticks... like a block counting before it goes home.' },
        },
        /* ---------------- 2 Kitchen ---------------- */
        '0,3': {
            name: 'Kitchen',
            rows: [
                '####################',
                '#:::::::#::::::::::#',
                '#:::::::#::::::::::#',
                '#lllllll#::::::::::#',
                '#::::::::::::::::::#',
                '#:::::::::::::::::::',
                '#::::::::::::::::::#',
                '#::::::::::::::::::#',
                '#::::::::::::::::::#',
                '#::::::::::::::::::#',
                '####################',
            ],
            ents: [
                { k: 'crystal', x: 4, y: 1, sig: 'kc', id: 'kCrystal', keepOn: true },
                { k: 'chest', x: 13, y: 2, item: 'key', id: 'kKey', hidden: true, when: 'kc' },
                { k: 'pot', x: 12, y: 5, style: 'pot_teal' }, { k: 'pot', x: 16, y: 4, style: 'pot_teal' }, { k: 'pot', x: 11, y: 7, style: 'pot_teal' },
                { k: 'deco', x: 15, y: 1, look: 'td_range', solid: [[0, 0], [1, 0]], ox: 0, oy: -14 },
                { k: 'deco', x: 2, y: 7, look: 'table', solid: [[0, 0], [1, 0]] },
                { k: 'pie', x: 3, y: 7 },
                { k: 'deco', x: 9, y: 9, look: 'barrel' }, { k: 'deco', x: 17, y: 9, look: 'barrel' },
            ],
            nudge: { solved: 'kc', at: [4, 1], say: 'A pot on the shelf wobbles, as if it would like to be thrown.' },
        },
        /* ---------------- 3 Gallery ---------------- */
        /* (the closet wants the bust at home on its own plate, a stiff iron one that only something heavy come to rest on
           sinks, and the far plate pressed, together: a bust pushed onto the far plate lifts its own, and going home it
           never sinks both at once, so it can't be dashed; the far plate's nook is reached only through the bust's place,
           so whatever holds it there has its way home through that place; and anyone in the nook can hop down off its
           step, so the bust coming home never shuts her in) */
        '2,3': {
            name: 'Gallery',
            rows: [
                '####################',
                '#.......#.#........#',
                '#.......#.#........#',
                '#.......#.#........#',
                '#...#####.######.###',
                '...........#.......#',
                '#.........v#.......#',
                '#..................#',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'wood', x: 8, y: 5, id: 'galBlock' },
                { k: 'bust', x: 9, y: 5, id: 'galBust' },
                { k: 'plate', x: 9, y: 5, sig: 'g2', minWeight: WEIGHT.heavy, settled: true, look: 'iron' },
                { k: 'plate', x: 10, y: 5, sig: 'g1' },
                { k: 'door', x: 16, y: 4, type: 'gate', when: 'g1&g2', passed: 'up', id: 'gG' },
                { k: 'chest', x: 16, y: 1, item: 'plan', id: 'gPlan' },
                { k: 'deco', x: 2, y: 1, look: 'painting', solid: false, oy: -12, baseY: -100 },
                { k: 'deco', x: 5, y: 1, look: 'painting2', solid: false, oy: -12, baseY: -100 },
                { k: 'enemy', x: 5, y: 8, type: 'dustbunny' },
                { k: 'pot', x: 17, y: 9, style: 'pot_teal' },
                { k: 'sign', x: 1, y: 7, text: 'THE GALLERY. Please mind the busts. Each one knows its place, and once it is back in it, nothing gets past.' },
            ],
            nudge: { solved: 'tidy_gG', thing: 'galBust', say: "The far plate's nook can only be reached through the bust's own spot. The bust looks very pleased with that spot." },
        },
        /* ---------------- 4 Hall of Busts ---------------- */
        /* (the gallery along the top is reached only round its far end, so the north door is a long walk from the plate:
           nothing pushed onto it and left there holds it long enough; the block, waiting beside the bust's way up and
           back, is what does) */
        '1,2': {
            name: 'Hall of Busts',
            rows: [
                '###.################',
                '#..................#',
                '#..................#',
                '##################.#',
                '#,,,,,,,,,,,,,,,,,,#',
                ',,,,,,,,,,,,,,,,,,,,',
                '#,,,,,,,,,,,,,,,,,,#',
                '#,,,,,,,,,,,,,,,,,,#',
                '#,,,,,,,,,,,,,,,,,,#',
                '#,,,,,,,,,,,,,,,,,,#',
                '#########,##########',
            ],
            ents: [
                { k: 'bust', x: 9, y: 6, id: 'hallBust' },
                { k: 'plate', x: 9, y: 7, sig: 'hb' },
                { k: 'wood', x: 8, y: 5, id: 'hallBlock' },
                { k: 'bust', x: 2, y: 8 }, { k: 'bust', x: 17, y: 8 },
                { k: 'door', x: 3, y: 0, type: 'gate', when: 'hb', passed: 'up', id: 'hN' },
                { k: 'door', x: 19, y: 5, type: 'lock', dir: 'v', id: 'hE' },
                { k: 'enemy', x: 15, y: 2, type: 'nibbler' },
                { k: 'sign', x: 11, y: 9, text: 'THE HALL OF BUSTS. Solid marble, every one. They always go home, and anything lighter in the way gets moved along.' },
            ],
            nudge: { solved: 'tidy_hN', after: 60 * 60 * 4, thing: 'hallBust', say: 'The bust in the middle looks restless. Anything it moves along on its way home ends up one step past its spot.' },
        },
        /* ---------------- 5 Pantry ---------------- */
        '0,2': {
            name: 'Pantry',
            rows: [
                '####################',
                '#::::::::::::::::::#',
                '#::::::::::::::::::#',
                '#::::::::::::::::::#',
                '#::ooo:::::::::::::#',
                '#::o:o::::::::::::::',
                '#::ooo::::::##:#####',
                '#:::::::::::#::::::#',
                '#:::::::::::#::::::#',
                '#:::::::::::#::::::#',
                '####################',
            ],
            ents: [
                { k: 'plate', x: 4, y: 5, sig: 'pt' },
                { k: 'crate', x: 10, y: 2 }, { k: 'crate', x: 15, y: 3 },
                { k: 'door', x: 14, y: 6, type: 'gate', when: 'pt', passed: 'down', id: 'pG' },
                { k: 'chest', x: 16, y: 8, item: 'key', id: 'pKey' },
                { k: 'wood', x: 16, y: 1, look: 'cupboard', id: 'cupboard' },
                { k: 'staffonly', x: 16, y: 0 },
                { k: 'deco', x: 2, y: 1, look: 'td_larder', solid: [[0, 0], [1, 0]], ox: 0, oy: -14 },
                { k: 'deco', x: 9, y: 9, look: 'barrel' }, { k: 'deco', x: 1, y: 9, look: 'barrel' },
                { k: 'sign', x: 7, y: 3, text: 'Tins, jars, sacks. Everything labelled. One shelf is labelled THROWING CRATES.' },
            ],
            nudge: { solved: 'tidy_pKey', at: [4, 5], say: "A crate creaks. The little island looks just about one good throw away." },
        },
        /* ---------------- 6 Parlor ---------------- */
        '2,2': {
            name: 'Parlour',
            rows: [
                '################,###',
                '#,,,,,,,,,,,,,,,,,,#',
                '#,,,,,,,,,,,,,,,,,,#',
                '#,,,,,,,,,,,,,,,,,,#',
                '#,,,,,,,,,,,,,,,,,,#',
                ',,,,,,,,,,,,,,,,,,,,',
                '#############,,,,,,#',
                '#............,,,,,,#',
                '#............,,,,,,#',
                '#,,,,,,,,,,,,,,,,,,#',
                '####################',
            ],
            ents: [
                { k: 'wood', x: 2, y: 7, id: 'parBlock' },
                { k: 'plate', x: 4, y: 7, sig: 'pp', mode: 'pulse', time: 190 },
                { k: 'door', x: 16, y: 0, type: 'gate', when: 'pp', passed: 'up', id: 'pN' },
                { k: 'deco', x: 3, y: 2, look: 'armchair' }, { k: 'deco', x: 6, y: 2, look: 'armchair', flip: true },
                { k: 'deco', x: 4, y: 3, look: 'rug_small', solid: false, baseY: -100 },
                { k: 'deco', x: 10, y: 1, look: 'td_piano', solid: [[0, 0], [1, 0]], ox: 0, oy: -14 },
                { k: 'deco', x: 17, y: 8, look: 'td_fernpot' },
            ],
            nudge: { solved: 'tidy_pN', thing: 'parBlock', say: 'The plate in the corridor clicks every time anything goes over it. Even on the way home.' },
        },
        /* ---------------- 7 Conservatory ---------------- */
        '3,2': {
            name: 'Conservatory',
            rows: [
                '####################',
                '#.............#....#',
                '#.#############....#',
                '#............##....#',
                '#.############.#.###',
                '...................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'plate', x: 6, y: 3, sig: 'ca', mode: 'toggle' },
                { k: 'plate', x: 12, y: 3, sig: 'cb', mode: 'toggle' },
                { k: 'crate', x: 5, y: 7 },
                { k: 'door', x: 16, y: 4, type: 'gate', when: 'ca&cb', passed: 'up', id: 'cG' },
                { k: 'chest', x: 17, y: 1, item: 'heartpatch', id: 'consPatch' },
                { k: 'deco', x: 3, y: 8, look: 'td_palm' }, { k: 'deco', x: 8, y: 6, look: 'td_fernpot' }, { k: 'deco', x: 14, y: 8, look: 'td_palm' }, { k: 'deco', x: 17, y: 6, look: 'td_fernpot' },
                { k: 'sign', x: 1, y: 6, text: 'Seedlings. Do not tread on the plates more than strictly necessary.' },
            ],
            nudge: { solved: 'tidy_cG', after: 60 * 60 * 4, say: 'You count the clicks of the plates on the way in and on the way out. Odd. Even. Odd.' },
        },
        /* ---------------- 8 Linen closets (the Dust Monger) ---------------- */
        '2,1': {
            name: 'Linen Closets',
            rows: [
                '#########.##########',
                '#..................#',
                '#.##............##.#',
                '#.##..U.........##.#',
                '#..................#',
                '....................',
                '#..................#',
                '#.##.........U..##.#',
                '#.##............##.#',
                '#..................#',
                '################.###',
            ],
            ents: [
                { k: 'door', x: 9, y: 0, type: 'lock', id: 'lN' },
                { k: 'door', x: 0, y: 5, type: 'gate', dir: 'v', when: 'flag:tidy_shortcut', id: 'lW' },
                { k: 'shutter', x: 16, y: 10, group: 'monger' }, { k: 'shutter', x: 19, y: 5, dir: 'v', group: 'monger' },
                { k: 'pot', x: 1, y: 1, style: 'pot_teal' }, { k: 'pot', x: 18, y: 9, style: 'pot_teal' }, { k: 'pot', x: 18, y: 1, style: 'pot_teal' },
                { k: 'chest', x: 9, y: 5, item: 'gloves', id: 'gloves', hidden: true, when: 'flag:tidy_monger', big: true },
                { k: 'monger', x: 9, y: 4 },
            ],
        },
        /* ---------------- 9 Laundry ---------------- */
        '3,1': {
            name: 'Laundry',
            rows: [
                '####################',
                '#..................#',
                '#..................#',
                '#..........###.....#',
                '#..........#.......#',
                '...........###.....#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'chest', x: 12, y: 4, item: 'key', id: 'lKey' },
                { k: 'wood', x: 13, y: 4, id: 'laundryBlock' },
                { k: 'deco', x: 3, y: 2, look: 'washtub' }, { k: 'deco', x: 5, y: 2, look: 'td_mangle' },
                { k: 'deco', x: 16, y: 7, look: 'basket' }, { k: 'deco', x: 3, y: 8, look: 'basket' },
                { k: 'enemy', x: 6, y: 7, type: 'dustbunny' }, { k: 'enemy', x: 15, y: 2, type: 'nibbler' },
                { k: 'sign', x: 1, y: 1, text: 'LAUNDRY. Wash on Monday, mangle on Tuesday, fold on Wednesday. The good linen is kept in the cubby.' },
            ],
            nudge: { solved: 'tidy_lKey', thing: 'laundryBlock', say: "The block in the cubby can't be pushed in any further. It could come out, though." },
        },
        /* ---------------- 10 Ballroom: the tidy-up ---------------- */
        '1,1': {
            name: 'Ballroom',
            rows: [
                '####################',
                '#..................#',
                '#..................#',
                '#..................#',
                '#....##########....#',
                '....................',
                '#...o##########....#',
                '##..o...........ooo#',
                '#.ooo...........o.o#',
                '##..............ooo#',
                '###.################',
            ],
            ents: [
                { k: 'bust', x: 17, y: 3, id: 'ballB', group: 'ball', tiedOff: true, startAt: [1, 8],
                    trace: [[17, 3], [16, 3], [15, 3], [15, 4], [15, 5], [14, 5], [13, 5], [12, 5], [11, 5], [10, 5], [9, 5], [8, 5], [7, 5], [6, 5], [5, 5], [4, 5], [4, 6], [4, 7], [4, 8], [3, 8], [2, 8], [1, 8]] },
                { k: 'bust', x: 2, y: 5, id: 'ballA', group: 'ball', tiedOff: true, startAt: [17, 8],
                    trace: [[2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5], [15, 5], [16, 5], [17, 5], [17, 6], [17, 7], [17, 8]] },
                { k: 'lever', x: 6, y: 9, release: 'ball', id: 'ballLever' },
                { k: 'lever', x: 18, y: 4, id: 'shortcut', onFlag: 'tidy_shortcut' },
                { k: 'chest', x: 9, y: 2, item: 'pattern', id: 'pattern', hidden: true, when: 'flag:tidy_ballDone', big: true },
                { k: 'sign', x: 7, y: 9, text: 'TIDY UP. Pull the lever and everything goes back where it belongs. Pull it again to set it all out again. (No pushing in the corridor.)' },
            ],
            nudge: { solved: 'tidy_ballDone', after: 60 * 60 * 4, say: "Two threads, one corridor. One of them will have to wait its turn. Something will have to hold it." },
        },
        /* ---------------- 11 Library ---------------- */
        '0,1': {
            name: 'Library',
            rows: [
                '#########.##########',
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
                { k: 'block', x: 9, y: 1, look: 'bookshelf', id: 'secretShelf', weight: WEIGHT.heavy, noPush: true, pushLine: "The bookshelf won't budge forward. It is very solidly against the wall.", if: '!tidy_attic' },
                { k: 'block', x: 10, y: 2, look: 'bookshelf', id: 'secretShelf2', weight: WEIGHT.heavy, noPush: true, if: 'tidy_attic' },
                { k: 'deco', x: 2, y: 1, look: 'shelf', solid: [[0, 0], [1, 0]], ox: 0, oy: -14 }, { k: 'deco', x: 5, y: 1, look: 'shelf', solid: [[0, 0], [1, 0]], ox: 0, oy: -14 },
                { k: 'deco', x: 12, y: 1, look: 'shelf', solid: [[0, 0], [1, 0]], ox: 0, oy: -14 }, { k: 'deco', x: 15, y: 1, look: 'shelf', solid: [[0, 0], [1, 0]], ox: 0, oy: -14 },
                { k: 'deco', x: 3, y: 5, look: 'td_readtable', solid: [[0, 0], [1, 0]] }, { k: 'deco', x: 13, y: 6, look: 'td_readtable', solid: [[0, 0], [1, 0]] },
                { k: 'deco', x: 7, y: 8, look: 'armchair' },
                { k: 'sign', x: 17, y: 8, text: 'PLEASE DO NOT PULL THE BOOKSHELVES. (Thank you.)' },
            ],
        },
        /* ---------------- 12 Attic (the Maker's signature room) ---------------- */
        '0,0': {
            name: 'Attic',
            rows: [
                '####################',
                '####################',
                '####............####',
                '####............####',
                '####............####',
                '####............####',
                '####............####',
                '####............####',
                '####............####',
                '#########.##########',
                '#########.##########',
            ],
            ents: [
                { k: 'deco', x: 6, y: 1, look: 'sampler_ives', solid: false, oy: -2, baseY: -100, text: "A sampler, stitched in teal: a little house, a little bucket, a little broom, and the letters M. I. in the corner. Under them, very small: 'for the Wanderer'." },
                { k: 'deco', x: 5, y: 3, look: 'armchair' },
                { k: 'deco', x: 7, y: 3, look: 'table', solid: [[0, 0], [1, 0]], text: "A teapot and two cups, set out neatly, as if for visitors." },
                { k: 'chest', x: 13, y: 3, item: 'heartpatch', id: 'atticPatch' },
                { k: 'signature', x: 10, y: 6, house: 'tidy' },
                { k: 'deco', x: 5, y: 7, look: 'basket' }, { k: 'deco', x: 14, y: 7, look: 'plant' },
            ],
        },
        /* ---------------- 13 Antechamber ---------------- */
        '2,0': {
            name: 'Antechamber',
            rows: [
                '####################',
                '#..................#',
                '#.,,,,,,,,,,,,,,,,.#',
                '#.,..............,.#',
                '#.,..............,.#',
                '..,..............,.#',
                '#.,..............,.#',
                '#.,..............,.#',
                '#.,,,,,,,,,,,,,,,,.#',
                '#..................#',
                '#########.##########',
            ],
            ents: [
                { k: 'door', x: 0, y: 5, type: 'big', dir: 'v', id: 'bossDoor' },
                { k: 'pot', x: 4, y: 3, style: 'pot_teal', drop: 'heart' }, { k: 'pot', x: 15, y: 3, style: 'pot_teal', drop: 'heart' },
                { k: 'pot', x: 4, y: 7, style: 'pot_teal' }, { k: 'pot', x: 15, y: 7, style: 'pot_teal' },
                { k: 'sign', x: 3, y: 5, text: 'THE GRAND HALL. The Housekeeper is in. Please wipe your feet and do not touch the furniture.' },
            ],
        },
        /* ---------------- 14 The Grand Hall (boss) ---------------- */
        '1,0': {
            name: 'The Grand Hall',
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
                { k: 'bust', x: 3, y: 4, id: 'gb1' }, { k: 'bust', x: 16, y: 4, id: 'gb2' },
                { k: 'bust', x: 9, y: 8, id: 'gb3' }, { k: 'bust', x: 9, y: 2, id: 'gb4' },
                { k: 'pot', x: 1, y: 1, style: 'pot_teal', drop: 'heart' }, { k: 'pot', x: 18, y: 9, style: 'pot_teal', drop: 'heart' },
                { k: 'housekeeper', x: 9, y: 4 },
                { k: 'shutter', x: 19, y: 5, dir: 'v', group: 'boss' },
            ],
        },
    },
    tick: a => TidyLogic.tick(a),
    onEnter: a => { TidyLogic.enter(a); TidyLook.warm(a); },
    afterKnot: function* () { yield* Tidy.afterKnot(); },
    /* (each room its own look, and its dressing laid over the floor: see the end of this file) */
    themeAt: (x, y) => tidyLookAt(x, y),
    drawGround: (a, cx, cy) => TidyLook.ground(a, cx, cy),
});

const TidyLogic = {
    enter(a) {
        /* the lever by the linen door: remember it */
        if (Progress.flag('tidy_shortcut')) { const l = a.find('shortcut'); if (l) l.on = true; }
    },
    tick(a) {
        if (Cam.room && Cam.room.key === '0,0' && !Progress.flag('tidy_attic')) Progress.set('tidy_attic');
        const lever = a.find('ballLever'); if (lever && !lever.solved) lever.solved = () => Progress.flag('tidy_ballDone');
        /* the ballroom: both blocks home */
        if (!Progress.flag('tidy_ballDone')) {
            const ball = a.ents.filter(e => e.group === 'ball');
            if (ball.length && ball.every(b => Return.isHome(b) && !b.tiedOff)) {
                Progress.set('tidy_ballDone'); Sfx.play('appear'); G.shake = 4;
                /* (said over the chest and the busts, not on them: it once sat right over the chest it told of) */
                const ch = a.find('pattern');
                G.pendingToast = { s: 'Both busts home. Something clicks, and a big chest stands where nothing stood before.', focus: [ch && [ch.tx, ch.ty, 16], ...ball.map(b => [b.tx, b.ty, 24])].filter(Boolean) };
            }
        }
        const sc = a.find('shortcut');
        if (sc && sc.on && !Progress.flag('tidy_shortcut')) Progress.set('tidy_shortcut');
        /* remember doors that stay open as story flags (for nudges and the tracker) */
        for (const d of a.ents) if (d.kind === 'door' && d.id && d.open && (d.openedOnce || d.type !== 'gate')) Progress.set('tidy_' + d.id);
        for (const c of a.ents) if (c.kind === 'chest' && c.opened) Progress.set('tidy_' + c.id);
    },
};

/* the warm pie (S05) */
SPAWN.pie = (tx, ty) => {
    const pr = new Prop(tx, ty, { im: ART.pie, solid: [], oy: -6 });
    pr.live = true; pr.baseY = 24;      /* (it sits on the kitchen table: drawn after it, not behind it) */
    pr.interact = () => {
        if (Progress.flag('pie')) { Script.run(function* () { yield* say(null, 'An empty pie dish. Crumbs.'); }); return true; }
        Script.run(function* () {
            yield* say(null, "A pie, still warm, steam curling off it. A note is tucked under the dish: 'For my favourite Wanderer. Don't tell.'");
            Inv.hp = Inv.maxHp; Sfx.play('heart');
            Progress.set('pie'); Stats.count('secret:pie');
            pr.im = ART.pie_empty;
            yield* say(null, 'You eat the whole pie. You feel wonderful.');
        });
        return true;
    };
    pr.talkBox = (pl, f) => (f.tx === tx || f.tx === tx - 1) && f.ty === ty;
    if (Progress.flag('pie')) pr.im = ART.pie_empty;
    /* still warm: steam curling up off it, a wisp at a time */
    const draw0 = pr.draw;
    pr.draw = function (cx, cy) {
        draw0.call(this, cx, cy);
        if (this.im !== ART.pie) return;
        for (let i = 0; i < 3; i++) {
            const k = ((G.t + i * 23) % 70) / 70, x = Math.round(this.x - cx + 5 + i * 3 + Math.sin(k * 6 + i * 2) * 1.5), y = Math.round(this.y - cy + 1 - k * 12);
            Gfx.alpha(0.75 * (1 - k)); Gfx.rect(x, y, 1, 2, '#ffffff'); Gfx.rect(x + ((k * 6 + i) % 2 < 1 ? 1 : -1), y - 2, 1, 2, '#ffffff'); Gfx.alpha(1);
        }
    };
    return pr;
};
/* the Staff Only door behind the cupboard (S04) */
SPAWN.staffonly = (tx, ty) => {
    const pr = new Prop(tx, ty, { im: ART.staffdoor_wall, solid: [], oy: -2 });
    pr.baseY = -50;
    pr.interact = () => {
        Script.run(function* () {
            const p = G.player;
            if (!p.feetOn(tx, ty + 1)) return;
            if (Progress.flag('staffonly')) { yield* say(null, 'STAFF ONLY. Locked tight. Somebody has wedged a chair under the handle on the other side.'); return; }
            Progress.set('staffonly'); Stats.count('secret:staffonly');
            yield* say(null, 'A narrow door behind where the cupboard stood: STAFF ONLY. You try the handle. It opens...');
            Sfx.play('door');
            yield 40;
            yield* say(null, '...onto a dark little space full of ropes and pulleys, all running down through the floor. A crank turns slowly by itself. Somewhere below, something creaks like a winch.');
            Sfx.play('doorshut'); G.shake = 8;
            yield 30;
            yield* say(null, 'The door swings shut in your face. On the other side, very quietly, something is wedged under the handle.');
        });
        return true;
    };
    pr.talkBox = (pl, f) => f.tx === tx && f.ty === ty;
    return pr;
};
SPAWN.book = (tx, ty, p) => {
    const pr = new Prop(tx, ty, { im: ART.book, solid: [], oy: 4 });
    pr.baseY = -50;
    pr.interact = () => { Script.run(function* () { yield* say(null, p.text); }); return true; };
    pr.talkBox = (pl, f) => f.tx === tx && f.ty === ty;
    return pr;
};
/* a Maker's signature, hidden somewhere in each House (S06) */
SPAWN.signature = (tx, ty, p) => {
    const pr = new Prop(tx, ty, { im: ART['monogram_' + p.house], solid: [], oy: 4 });
    pr.baseY = -50;
    pr.interact = () => {
        Script.run(function* () {
            const first = !Progress.flag('sig:' + p.house);
            Progress.set('sig:' + p.house);
            if (first) Stats.count('secret:sig');
            yield* say(null, SIGNATURE_TEXT[p.house]);
            const n = ['tidy', 'kiln', 'mill', 'belfry', 'slumber', 'marionette'].filter(h => Progress.flag('sig:' + h)).length;
            if (first && ['tidy', 'kiln', 'mill', 'belfry', 'slumber', 'marionette'].includes(p.house)) yield* say(null, `(Maker's marks found: ${n} of 6.)`);
        });
        return true;
    };
    pr.talkBox = (pl, f) => f.tx === tx && f.ty === ty;
    return pr;
};
const SIGNATURE_TEXT = {
    tidy: "Stitched into the floorboards, small and neat, a teal monogram: M.I. And a tiny embroidered broom. Someone signed this House, the way you'd sign a sampler.",
};

/* shutters: close while a fight is on */
SPAWN.shutter = (x, y, p) => {
    const d = new Door(x, y, Object.assign({ type: 'shutter' }, p));
    d.shut = false; d.open = true; d.anim = 8;
    return d;
};

/* the Dust Monger: a huge dust bunny. The stick bounces off its fluff; it fears coming-home furniture */
SPAWN.monger = (tx, ty) => {
    if (Progress.flag('tidy_monger')) return new Ent('none');
    const e = new Enemy(tx, ty, { type: 'monger', hp: 2 });     /* (two hits: a mini-boss shouldn't outstay its idea) */
    e.onDie = () => {
        Progress.set('tidy_monger');
        for (const s of e.area.ents) if (s.kind === 'door' && s.group === 'monger') s.shut = false;
        Music.play('tidy');
        /* (the burst, and the bunnies hopping off under the four closets while it's told) */
        const bits = Tidy.bunnies(e);
        Script.run(function* () { yield 14; yield* say(null, 'The Dust Monger bursts into a hundred dust bunnies, which all hop away under the furniture. Something glints in the middle of the floor.', { focus: bits }); });
    };
    e.wakeT = 0; e.flopT = 120;
    return e;
};
ENEMY.monger = { hp: 2, speed: 1.4, leash: 12, sight: 12, ai: 'monger', yarn: '#e4dcd0', r: 10, tall: 20, armored: true, dmg: 2, drop: 0, weight: WEIGHT.medium };
ENEMY_DRAW.monger = e => spr(e.z > 1 ? 'monger_1' : 'monger_0');
AI.monger = (e, p) => {
    const a = e.area;
    if (!e.awake) {
        if (p.area === a && Cam.room && Cam.room.key === '2,1' && !Cam.busy) {
            e.awake = true;
            for (const s of a.ents) if (s.kind === 'door' && s.group === 'monger') s.shut = true;
            Music.play('boss');
            Script.run(function* () { yield* stepIn(); yield* say(null, 'A heap of fluff in the middle of the room shudders, stands up, and looks at you. It is a dust bunny the size of a sofa.'); yield* say(null, 'Your stick would just bounce off all that fluff. Something thrown might not...'); });
        }
        return;
    }
    /* its one big move: it crouches low, shivering, and comes down out of the air on the spot where Wren stood (its
       shadow's there first): a full heart if she's still under it */
    const f = e.flop;
    if (f) {
        e.shake = ++f.t <= f.crouch;
        if (f.t <= f.crouch) { e.z = -2; return; }
        const k = Math.min(1, (f.t - f.crouch) / f.air);
        e.x = lerp(f.fx, f.tx, k); e.y = lerp(f.fy, f.ty, k); e.z = Math.sin(k * Math.PI) * 34;
        if (k >= 1) { e.z = 0; e.flop = null; e.modeT = 40; e.settle(); e.traceStep(); Fx.poof(e.x, e.y - 4); }
        return;
    }
    if (++e.flopT > 280 && !(e.hopT > 0) && p.state === 'normal' && p.area === a && Cam.room && Cam.room.key === '2,1') {
        e.flopT = 0;
        e.flop = { t: 0, crouch: tellFor(1), air: 28, fx: e.x, fy: e.y, tx: p.x, ty: p.y };
        Hazard.drop(e, p.x, p.y, { r: 20, dmg: 2, tell: e.flop.crouch + e.flop.air, shake: 8 });
        return;
    }
    AI.hop(e, p);
};

/* the Grand Housekeeper: a wardrobe that keeps the hall tidy. Its moves, for a first boss, all slow to come with plain
   tells (TELL[1]): a charge down a lane lit on the floor (a full heart), a stamp that shakes the ring of floor drawn round
   it (half a heart) when Wren comes too close, and, once it won't leave its cross, a coat-hanger flung at her that lies
   on its thread and then comes home along it (half a heart, each way). Each beat it's knocked into, a heart falls out. */
const HK = { near: 34, stamp: 36, cool: [0, 110, 90, 80], hanger: 7 };
class Housekeeper extends Enemy {
    constructor(tx, ty) {
        super(tx, ty, { type: 'housekeeper', hp: 3 });
        this.state = 'sleep'; this.st = 0; this.cd = 90; this.doors = 0; this.cool = 60;
        this.weightN = WEIGHT.medium + 0.5;
        this.homeX = tx; this.homeY = ty;
    }
    hurtBox() { if (!this.alive) return null; return { x0: this.x - 11, x1: this.x + 11, y0: this.y - 30, y1: this.y + 4 }; }
    onTile(x, y) { if (!this.alive) return false; return x * T < this.x + 10 && (x + 1) * T > this.x - 10 && y * T < this.y + 5 && (y + 1) * T > this.y - 6; }
    atHome() { return Math.abs(this.x - (this.homeX * T + 8)) < 2 && Math.abs(this.y - (this.homeY * T + 10)) < 2; }
    update() {
        if (!this.alive) return this.updateYarn();
        this.t++; if (this.flash > 0) this.flash--; if (this.bang > 0) this.bang--;
        const p = G.player, a = this.area;
        if (this.state === 'sleep') {
            if (p.area === a && Cam.room && Cam.room.key === '1,0' && !Cam.busy) {
                this.state = 'wake'; this.st = 0;
                for (const s of a.ents) if (s.kind === 'door' && s.group === 'boss') s.shut = true;
                Music.play(bossSong('tidy'));
                Script.run(Tidy.bossIntro(this));
            }
            return;
        }
        if (Script.blocking()) return;
        this.st++;
        if (this.kx || this.ky) { this.move(this.kx, this.ky); this.kx *= 0.8; this.ky *= 0.8; if (Math.abs(this.kx) + Math.abs(this.ky) < 0.3) this.kx = this.ky = 0; this.traceStep(); }
        const angry = this.hp <= 1;
        /* three beats: (1) it walks over to the mess and yanks it, so it can stand in the way of its own yank;
           (2) it has learnt: it yanks from its cross and never goes over, so the way home has to pass through its
           cross (it leaves it only to charge); (3) it never leaves its cross and yanks the moment anything's out of
           place: hold the thing (the Gloves) and the yank drags the Housekeeper to it instead */
        const phase = 4 - Math.max(1, Math.min(3, this.hp));
        switch (this.state) {
            case 'wake': if (this.st > 30) this.setState('home'); break;
            /* it stands on its spot and watches. Mess: it goes and tidies it. Line up with it: it charges */
            case 'home': {
                if (phase > (this.told || 1) && this.atHome()) {
                    this.told = phase;
                    UI.toast(phase === 2 ? "The Housekeeper plants itself on its cross. It won't go to the mess any more: it yanks things home from where it stands."
                        : "Its doors bang. It won't leave its cross for anything now, and it yanks the moment anything's out of its place.", 260);
                }
                const mess = this.mess();
                if (mess && phase === 1 && this.st > 20) { this.target = mess; this.tsk(); this.setState('tidy'); break; }
                if (mess && phase > 1 && this.st > (phase === 3 ? 8 : 24) && this.atHome()) { this.target = mess; this.tsk(); this.setState('reach'); break; }
                if (phase < 3 && this.st > (angry ? 40 : 70)) {
                    const ax = Math.abs(p.x - this.x), ay = Math.abs(p.y - this.y);
                    if (ax < 12 || ay < 12) { this.chargeDir = ax < 12 ? (p.y < this.y ? UP : DOWN) : (p.x < this.x ? LEFT : RIGHT); this.dir = this.chargeDir; this.windup(phase); break; }
                }
                /* too close: it rises on its toes and stamps (a ring on the floor shows how far the floor shakes) */
                if (this.cool <= 0 && this.atHome() && p.state === 'normal' && p.area === a && this.ringHas(p, HK.near)) { this.rear(phase); break; }
                /* (3) out of reach: a coat-hanger flung at her, and back it comes along its own thread */
                if (phase === 3 && this.cool <= 0 && this.st > 40 && this.atHome() && p.state === 'normal' && Cam.room && Cam.room.key === '1,0' && !a.ents.some(e => e.kind === 'flung' && e.owner === this)) { this.aimHanger(p); break; }
                break;
            }
            case 'rear': if (this.st >= this.tellN) { this.setState('stamped'); this.cool = HK.cool[phase]; Sfx.play('boss'); } break;
            case 'stamped': if (this.st > 24) this.setState('home'); break;
            case 'aimH': if (this.st >= this.tellN) { this.throwHanger(); this.cool = HK.cool[phase] + 60; this.setState('home'); } break;
            /* walk over to the stray furniture and yank it home (look where you stand, Housekeeper) */
            case 'tidy': {
                const m = this.target;
                if (!m || !m.ret || m.ret.state === 'home') { this.setState('return'); break; }
                const gx = m.px + 8, gy = m.py + 10, dx = gx - this.x, dy = gy - this.y, d = Math.hypot(dx, dy) || 1;
                if (d > 21 && this.st < 300) {
                    const sp = angry ? 1.3 : 1.0;
                    if (!this.move(dx / d * sp, dy / d * sp)) { if (!this.move(sign(dx) * sp, 0)) this.move(0, sign(dy) * sp); }
                    this.dir = dirOf(dx, dy); this.anim++; this.traceStep();
                } else { Return.snap(m); Sfx.play('tug'); this.rattle = 1; this.setState('watch'); }
                break;
            }
            case 'watch': if (this.st > 40) this.setState('return'); break;
            /* (2, 3) a thread out from where it stands, and a yank */
            case 'reach': {
                const m = this.target;
                if (!m || !m.ret || m.ret.state === 'home') { this.setState('home'); break; }
                if (this.st === 10) { Return.snap(m); Sfx.play('tug'); this.rattle = 1; }
                /* held fast: the thread goes taut, and the one that comes is the Housekeeper */
                if (this.st > 12 && phase === 3 && Return.held(m)) { this.setState('dragged'); Sfx.play('tug'); break; }
                if (this.st > 50) this.setState('home');
                break;
            }
            case 'dragged': {
                const m = this.target;
                if (!m || !Return.held(m) || this.st > 120) { this.setState('return'); break; }
                const gx = m.px + 8, gy = m.py + 10, dx = gx - this.x, dy = gy - this.y, d = Math.hypot(dx, dy) || 1;
                if (d > 20 && this.move(dx / d * 3.2, dy / d * 3.2)) { this.traceStep(); this.anim++; break; }
                /* into the thing it was pulling on: bang */
                G.shake = 12; G.hitstop = 6; Sfx.play('hitthing'); Sfx.play('boss'); Fx.dust(this.x, this.y);
                this.setState('stunned'); Stats.count('boss:tidy:dragged');
                break;
            }
            case 'windup': {
                /* it can't abide mess: tidying comes before charging */
                const mess = this.mess();
                if (mess) { this.target = mess; this.tsk(); if (this.lane) { this.area.remove(this.lane); this.lane = null; } this.setState('tidy'); break; }
                if (this.st >= this.tellN) { this.setState('charge'); Sfx.play('boss'); }
                break;
            }
            case 'charge': {
                const sp = angry ? 3.4 : 2.8;
                if (!this.move(DX[this.chargeDir] * sp, DY[this.chargeDir] * sp) || this.st > 90) { G.shake = 10; Sfx.play('push'); Fx.dust(this.x, this.y); this.charged = true; this.setState('recoil'); }
                this.traceStep();
                /* down its lane, the width of it: a full heart */
                const lane = this.chargeDir === LEFT || this.chargeDir === RIGHT ? tileOf(p.y) === this.laneAt && Math.abs(p.x - this.x) < 14 : tileOf(p.x) === this.laneAt && Math.abs(p.y - this.y) < 12;
                if (p.state === 'normal' && lane) p.hurt(2, this.x, this.y);
                break;
            }
            /* (in its second beat it's slower to come home after a charge: long enough to get round to a bust) */
            case 'recoil': if (this.st > (phase === 2 && this.charged ? 110 : 36)) { this.charged = false; this.setState('return'); } break;
            /* everything goes back the way it came: so does it */
            case 'return': {
                if (this.trace.length < 2) { this.x = this.homeX * T + 8; this.y = this.homeY * T + 10; this.trace = [[this.homeX, this.homeY]]; this.setState('home'); break; }
                this.goHome(angry ? 1.3 : 1.0); this.anim++;
                break;
            }
            case 'stunned':
                this.doors = Math.min(1, this.st / 10);
                if (this.st > 150) { this.doors = 0; this.setState('return'); }
                break;
        }
        if (this.cool > 0) this.cool--;
        if (p.state === 'normal' && this.state !== 'stunned' && this.state !== 'charge' && Math.abs(p.x - this.x) < 13 && Math.abs(p.y - this.y) < 9) p.hurt(1, this.x, this.y);
    }
    setState(s) { this.state = s; this.st = 0; }
    /* is Wren inside the ring its stamp would shake (as drawn: a ring on the floor, squashed as the floor is seen)? */
    ringHas(p, r) { const dx = p.x - this.x, dy = (p.y - this.y) / 0.7; return dx * dx + dy * dy < r * r; }
    /* the charge's tell: it rattles, its "!", and its lane lit on the floor to the wall */
    windup(phase) {
        this.tellN = tellFor(1, phase); this.setState('windup'); this.bang = this.tellN; Stats.count('boss:tidy:charge');
        const a = this.area, tiles = [];
        let x = tileOf(this.x), y = tileOf(this.y);
        this.laneAt = this.chargeDir === LEFT || this.chargeDir === RIGHT ? y : x;
        for (let i = 0; i < 20; i++) { x += DX[this.chargeDir]; y += DY[this.chargeDir]; if (!a.inside(x, y) || a.kind(x, y).solid || a.at(x, y)) break; tiles.push([x, y]); }
        this.lane = Hazard.tiles(this, tiles, { tell: this.tellN, dmg: 0, live: 0 });
    }
    rear(phase) {
        this.tellN = tellFor(1, phase); this.setState('rear'); Stats.count('boss:tidy:stamp');
        Hazard.ring(this, this.x, this.y + 2, HK.stamp, { tell: this.tellN, dmg: 1, shake: 8 });
    }
    aimHanger(p) {
        this.tellN = tellFor(1, 3); this.setState('aimH'); Sfx.play('twang');
        this.hangerPath = Flung.line(this.area, [this.homeX, this.homeY], [p.tx, p.ty], HK.hanger);
        Hazard.tiles(this, this.hangerPath.slice(1), { tell: this.tellN, dmg: 0, live: 0, quiet: true });
    }
    throwHanger() {
        const path = this.hangerPath; this.hangerPath = null;
        if (!path || path.length < 2) return;
        this.area.add(new Flung(this, path, { pace: 2, back: 2, wait: 100, tell: 30, dmg: 1, col: THREAD.ives, look: Tidy.drawHanger }));
        Sfx.play('throw'); this.rattle = 1; Stats.count('boss:tidy:hanger');
    }
    /* heavy furniture out of its place in its own hall (not the rest of the House) */
    mess() {
        const a = this.area, room = a.roomAt(this.homeX, this.homeY);
        return a.ents.find(e => e.isGrid && e.ret && e.ret.state !== 'home' && !e.tiedOff && e.kind !== 'pot' && !e.carried && e.weight >= WEIGHT.heavy && a.roomAt(e.tx, e.ty) === room);
    }
    /* it has seen something out of place */
    tsk() {
        this.bang = 50; Sfx.play('twang');
        if (!Progress.flag('tidy_tsk')) { Progress.set('tidy_tsk'); UI.toast('"Tsk!" The Housekeeper cannot bear anything out of its place.', 200); }
    }
    /* a returning heavy thing slammed into it */
    shoved(d, pace, by) {
        if (!this.alive || this.state === 'stunned') return;
        this.kx = DX[d] * 3; this.ky = DY[d] * 3;
        G.shake = 12; G.hitstop = 6; Sfx.play('hitthing'); Sfx.play('boss');
        this.setState('stunned'); calmBlows(this);
        Stats.count('boss:tidy:slam');
    }
    struck(by, dmg, dir, shard) {
        if (!this.alive) return;
        if (by && by.isGrid && this.state !== 'stunned') { Sfx.play('hitthing'); Fx.ring(this.x, this.y - 14); this.rattle = 1; return; }   /* a pot just bounces off */
        if (this.state !== 'stunned' || this.doors < 1) { Sfx.play('hitthing'); Fx.ring(this.x, this.y - 14); return; }
        if (this.flash > 0) return;
        this.hp--; this.flash = 30; Sfx.play('enemyhit'); G.hitstop = 8; G.shake = 6;
        this.setState('recoil'); this.doors = 0; this.cool = 90;
        if (this.hp <= 0) this.defeat();
        else bossHeart(this.area, this.x, this.y + 26);       /* (something drops out of its doors: a heart) */
    }
    defeat() {
        this.alive = false; this.yarnT = 0; this.trace = [[this.tx, this.ty]];
        Sfx.play('unravel'); Fx.yarn(this.x, this.y - 16, THREAD.ives); Fx.yarn(this.x, this.y - 8, THREAD.ives);
        Progress.set('tidy_boss');
        this.drain = Tidy.drain(this);
        Script.run(Tidy.bossDown(this));
    }
    updateYarn() { this.yarnT++; }
    draw(cx, cy) {
        if (!this.alive) {
            /* (the heap of yarn, going as it runs away down the hole: Tidy.drain) */
            if (this.yarnT < 240) { const k = 1 - this.yarnT / 240; Gfx.circle(this.x - cx, this.y - cy - 4, Math.round(8 * k), THREAD.ives); Gfx.rect(this.x - cx - 1, this.y - cy, 2, 4, '#1a1018'); }
            return;
        }
        const x = this.x - cx, y = this.y - cy;
        /* its own mark, under where it stands guard */
        if (!this.atHome()) Marks.draw(this.homeX * T - cx, this.homeY * T - cy, THREAD.ives, true);
        let ox = 0, oy = 0;
        if (this.state === 'windup' || this.state === 'rear' || this.state === 'aimH' || (this.state === 'home' && this.rattle && (this.t >> 3) % 3 === 0)) ox = (this.st >> 1) % 2 ? 1 : -1;
        /* about to stamp: up on its toes, higher as it comes; stamped, down flat with a jolt */
        if (this.state === 'rear') oy = -Math.round(4 * Math.min(1, this.st / (this.tellN || 30)));
        if (this.state === 'stamped' && this.st < 6) oy = 1;
        Gfx.alpha(0.3); Gfx.rect(x - 12, y - 1, 24, 3, PAL.ink); Gfx.alpha(1);
        const im = spr(this.state === 'stunned' && this.doors >= 1 ? 'keeper_open' : 'keeper');
        const img = this.flash > 0 && (this.flash >> 1) % 2 ? tinted(im, '#ffffff') : im;
        Gfx.img(img, x - 16 + ox, y - 34 + oy);
        /* a hanger about to be flung: its doors ajar a crack, and the hanger glinting in the gap */
        if (this.state === 'aimH') { Gfx.rect(x - 1 + ox, y - 30, 3, 15, '#1e3a3a'); if ((this.st >> 2) % 2) Gfx.rect(x + ox, y - 26, 1, 3, '#fff6c0'); }
        if (this.bang > 0) Gfx.img(spr('bubble_bang'), x - 4, y - 46 + oy);
        /* its reaching thread, out to what it's yanking (taut and bright while it's being dragged) */
        if ((this.state === 'reach' || this.state === 'dragged') && this.target && !this.target.removed) {
            const m = this.target, mx = m.px + 8 - cx, my = m.py + 8 - cy;
            Gfx.line(x, y - 16, mx, my, this.state === 'dragged' ? shade(THREAD.ives, 0.5) : THREAD.ives);
        }
    }
}
SPAWN.housekeeper = (tx, ty) => Progress.flag('tidy_boss') ? new Ent('none') : new Housekeeper(tx, ty);

const Tidy = {
    /* the Dust Monger burst: dust bunnies hopping off from where it was under the closets in the room's four corners (the
       upper two from in front, the lower two from behind), each gone as it gets there; its yarn with them */
    bunnies(e) {
        const a = e.area, r = a.roomAt(e.hx, e.hy), n = 16, bits = [];
        e.draw = () => { };
        const look = (x, y, b) => { const L = b.ink; Gfx.rect(x - 3, y - 4, 7, 4, L); Gfx.rect(x - 2, y - 6, 1, 2, L); Gfx.rect(x + 1, y - 6, 1, 2, L); Gfx.rect(x - 2, y - 3, 5, 2, '#e4dcd0'); Gfx.rect(x - 1, y - 4, 3, 1, '#f4ecdf'); Gfx.rect(x + (b.dx < 0 ? -1 : 1), y - 3, 1, 1, PAL.ink); };
        for (let i = 0; i < n; i++) {
            const c = i % 4, up = c < 2, tx = r.x + (c % 2 ? 16 : 2), u = hash2(i, 5, 71), v = hash2(i, 9, 72);
            const to = [(tx + 0.2 + u * 1.6) * T, (r.y + (up ? 4 : 7)) * T + (up ? 1 : 3)], from = [e.x - 10 + v * 20, e.y - 2 + u * 6];
            bits.push({ from, to, dx: to[0] - from[0], delay: Math.floor(hash2(i, 3, 73) * 36), speed: 0.5 + v * 0.25, hop: 7 + u * 3, lift: 3, look, ink: PAL.ink });
        }
        return a.add(new Remains(bits, { x: e.x, y: e.y }));
    },
    /* the Housekeeper's coat-hanger: a wooden bar with sloping shoulders and a wire hook, spinning as it flies */
    drawHanger(x, y, f) {
        const R = (c, a, b, w, h) => Gfx.rect(a, b, w, h, c);
        if (f.state !== 'lie' && (G.t >> 2) % 2) { R(PAL.ink, x - 2, y - 5, 4, 10); R('#c9925a', x - 1, y - 4, 2, 8); R('#c8d0dc', x - 1, y - 7, 1, 2); return; }
        R(PAL.ink, x - 6, y, 13, 3); R('#c9925a', x - 5, y + 1, 11, 1);
        Gfx.line(x - 5, y + 1, x, y - 3, '#9a6438'); Gfx.line(x + 5, y + 1, x, y - 3, '#9a6438');
        R('#c8d0dc', x, y - 6, 1, 3); R('#c8d0dc', x + 1, y - 7, 2, 1); R('#c8d0dc', x + 3, y - 6, 1, 1);
    },
    *bossIntro(k) {
        yield 20;
        yield* say(null, 'The great wardrobe at the end of the hall creaks, unfolds a pair of polished feet, and turns to face you. Its doors rattle like teeth.');
        yield* say(null, "It stamps back onto a little teal cross in the middle of the floor, its own spot, and glares round the hall: at the busts, all in their places, and at you, who are not.");
        G.boss = k;
    },
    /* the Housekeeper beaten: three strands of its teal yarn running from the heap across the floor to a little hole at the
       foot of the north wall (beside it, clear of the busts), and down it */
    drain(k) {
        const a = k.area, r = a.roomAt(k.homeX, k.homeY), y = r.y + 1, x0 = tileOf(k.x);
        const free = x => x > r.x && x < r.x + r.w - 1 && !a.kind(x, y).solid && !a.at(x, y) && !a.staticSolid.has(y * 4096 + x);
        const hx = [2, -2, 3, -3, 4, -4, 1, -1, 5, -5].map(d => x0 + d).find(free) || x0, hole = [hx * T + 8, y * T + 6];
        a.add(new Remains([{ from: hole, to: hole, end: 'lie', look: (sx, sy) => { Gfx.rect(sx - 3, sy - 2, 7, 3, '#1a1018'); Gfx.rect(sx - 2, sy - 3, 5, 1, '#1a1018'); Gfx.rect(sx - 2, sy + 1, 5, 1, '#3a2a34'); } }], { x: hole[0], y: hole[1], floor: true }));
        const c = a.add(new CrackRuns(a, k.x, k.y, 0, 0, [THREAD.ives], 0.5, 120));
        const dx = hole[0] - k.x, dy = hole[1] - k.y;
        c.runs = [-2, 0, 2].map((o, i) => { const pts = [[o, -2], [o, Math.round(dy / 2) + o], [dx, Math.round(dy / 2) + o], [dx, dy]]; return { pts, len: pts.reduce((m, q, j) => j ? m + Math.abs(q[0] - pts[j - 1][0]) + Math.abs(q[1] - pts[j - 1][1]) : 0, 0), late: i * 8, col: i === 1 ? shade(THREAD.ives, -0.2) : THREAD.ives }; });
        return c;
    },
    *bossDown(k) {
        const a = k.area;
        G.boss = null;
        Music.play('silence');
        yield 14;
        yield* say(null, 'The Housekeeper shudders, unravels into a heap of teal yarn, and the yarn runs away across the floor and down a little hole you had not noticed, like water down a drain.', { focus: k.drain });
        for (const s of a.ents) if (s.kind === 'door' && s.group === 'boss') s.shut = false;
        const br = a.rooms.find(r => r.key === '1,0');
        a.add(new Hoop(br.x + 9, br.y + 5));
        a.add(new Pickup((br.x + 9) * T, (br.y + 7) * T, { what: 'heartstitch', id: 'tidyHeart' }));
        Sfx.play('appear');
        Music.play('tidy');
    },
    *afterKnot() {
        Progress.set('d1');
        Progress.setGoal("Go back to Hollowell and tell Gran. Next, the Kiln in Kilnridge: the canyon road west of Meadowfold.");
        /* (the door first, then the words about it: down in the hall's south-east corner) */
        const a = G.map, r = a.rooms.find(r => r.key === '1,0');
        a.add(new Warp(r.x + 17, r.y + 9, { to: 'hollow', tx2: TIDY_OUT.x, ty2: TIDY_OUT.y, face: 'down' }));
        a.add(new Prop(r.x + 17, r.y + 9, { im: ART.exitlight, solid: [] }));
        /* (the doorway's whole picture: the light on the floor and the frame in the wall under it, which the box at the foot of
           the screen hid with only the floor's glow left showing) */
        yield* say(null, 'A door opens in the corner of the Grand Hall, letting in daylight and the smell of grass.', { focus: [r.x + 17, r.y + 10, 32] });
    },
};

function initTidyArt() {
    ART.pie = paintSprite(16, 10, x => { x.fillStyle = '#c8d0d8'; x.fillRect(1, 5, 14, 4); x.fillStyle = '#d9a050'; x.fillRect(2, 2, 12, 5); x.fillStyle = '#f0c070'; x.fillRect(3, 2, 10, 2); x.fillStyle = '#a8602a'; for (let i = 3; i < 13; i += 3) x.fillRect(i, 4, 1, 2); x.fillStyle = '#ffffff'; x.globalAlpha = 0.6; x.fillRect(6, 0, 1, 2); x.fillRect(9, 0, 1, 1); x.globalAlpha = 1; });
    ART.pie_empty = paintSprite(16, 10, x => { x.fillStyle = '#c8d0d8'; x.fillRect(1, 5, 14, 4); x.fillStyle = '#e8ecef'; x.fillRect(2, 5, 12, 2); x.fillStyle = '#d9a050'; x.fillRect(5, 6, 1, 1); x.fillRect(9, 5, 1, 1); });
    ART.staffdoor_wall = paintSprite(16, 18, x => { x.fillStyle = '#4a2e22'; x.fillRect(2, 0, 12, 18); x.fillStyle = '#6b4128'; x.fillRect(3, 1, 10, 16); x.fillStyle = '#fbf6ea'; x.fillRect(4, 4, 8, 3); x.fillStyle = '#c42b4a'; x.fillRect(5, 5, 6, 1); x.fillStyle = '#f7d64a'; x.fillRect(11, 10, 1, 2); }, false);
    ART.stove = paintSprite(32, 28, x => { x.fillStyle = '#4a4a5a'; x.fillRect(0, 6, 32, 22); x.fillStyle = '#6a6a7a'; x.fillRect(0, 6, 32, 3); x.fillStyle = '#2a2a3a'; x.fillRect(4, 14, 10, 10); x.fillRect(18, 14, 10, 10); x.fillStyle = '#f39a3c'; x.fillRect(6, 20, 6, 3); x.fillStyle = '#9a9aa8'; x.fillRect(6, 2, 8, 5); x.fillStyle = '#c0505a'; x.fillRect(20, 3, 8, 4); });
    ART.painting = paintSprite(28, 22, x => { x.fillStyle = '#d9a33a'; x.fillRect(0, 0, 28, 22); x.fillStyle = '#9fd4f0'; x.fillRect(3, 3, 22, 16); x.fillStyle = '#8fd46a'; x.fillRect(3, 13, 22, 6); x.fillStyle = '#9a6438'; x.fillRect(13, 8, 3, 6); x.fillStyle = '#4fa84a'; x.fillRect(10, 5, 9, 5); });
    ART.painting2 = paintSprite(20, 24, x => { x.fillStyle = '#9a6438'; x.fillRect(0, 0, 20, 24); x.fillStyle = '#f4e6c8'; x.fillRect(3, 3, 14, 18); x.fillStyle = '#c0505a'; x.fillRect(7, 6, 6, 6); x.fillStyle = '#f2c49b'; x.fillRect(8, 7, 4, 4); x.fillStyle = '#5a8ad0'; x.fillRect(6, 12, 8, 7); });
    ART.armchair = paintSprite(18, 18, x => { x.fillStyle = '#9a3a4a'; x.fillRect(1, 1, 16, 9); x.fillStyle = '#c45a6a'; x.fillRect(2, 2, 14, 7); x.fillStyle = '#9a3a4a'; x.fillRect(0, 8, 18, 7); x.fillStyle = '#c45a6a'; x.fillRect(3, 9, 12, 4); x.fillStyle = '#6b4128'; x.fillRect(1, 15, 2, 3); x.fillRect(15, 15, 2, 3); });
    ART.washtub = paintSprite(18, 16, x => { x.fillStyle = '#9aa8b8'; x.fillRect(1, 4, 16, 11); x.fillStyle = '#c8d4e0'; x.fillRect(1, 4, 16, 2); x.fillStyle = '#7ec8f0'; x.fillRect(3, 6, 12, 3); x.fillStyle = '#ffffff'; x.fillRect(5, 3, 3, 2); x.fillRect(10, 2, 2, 2); });
    ART.basket = paintSprite(16, 14, x => { x.fillStyle = '#c9925a'; x.fillRect(1, 5, 14, 9); x.fillStyle = '#9a6438'; for (let i = 1; i < 15; i += 2) x.fillRect(i, 6, 1, 7); x.fillStyle = '#fbf6ea'; x.fillRect(2, 2, 6, 4); x.fillStyle = '#5ad1c5'; x.fillRect(8, 2, 6, 4); });
    ART.book = paintSprite(14, 8, x => { x.fillStyle = '#fbf6ea'; x.fillRect(1, 1, 12, 6); x.fillStyle = '#9a3a4a'; x.fillRect(0, 2, 14, 1); x.fillRect(6, 1, 2, 6); x.fillStyle = '#9a9188'; for (let i = 2; i < 6; i += 2) { x.fillRect(2, i + 1, 3, 1); x.fillRect(9, i + 1, 3, 1); } });
    ART.sampler_ives = paintSprite(28, 22, x => { x.fillStyle = '#9a6438'; x.fillRect(0, 0, 28, 22); x.fillStyle = '#fbf3df'; x.fillRect(2, 2, 24, 18); x.fillStyle = '#3fc1b5'; x.fillRect(6, 7, 8, 7); x.fillRect(5, 6, 10, 1); x.fillRect(16, 9, 2, 5); x.fillRect(20, 12, 4, 2); x.fillStyle = '#2e9a96'; x.fillRect(18, 16, 2, 1); x.fillRect(21, 16, 2, 1); for (let i = 3; i < 25; i += 2) { x.fillRect(i, 3, 1, 1); x.fillRect(i, 18, 1, 1); } });
    ART.monogram_tidy = paintSprite(16, 10, x => { x.fillStyle = '#3fc1b5'; x.fillRect(2, 2, 1, 6); x.fillRect(3, 3, 1, 1); x.fillRect(4, 4, 1, 1); x.fillRect(5, 3, 1, 1); x.fillRect(6, 2, 1, 6); x.fillRect(9, 2, 1, 6); x.fillRect(8, 2, 3, 1); x.fillRect(8, 7, 3, 1); x.fillStyle = '#2e9a96'; x.fillRect(12, 4, 3, 1); x.fillRect(13, 5, 1, 3); }, false);
    /* the way out after a House's Knot: a doorway of daylight cut through the wall at the foot of the room (the
       picture's lower half lies over that wall), framed in wood, a stone step, the grass outside, and the light
       spilling in across the floor with a few motes in it */
    ART.exitlight = paintSprite(16, 32, x => {
        const R = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
        for (let j = 2; j < 16; j++) {
            const k = (j - 2) / 13, half = Math.round(8 - k * 2), a = Math.min(1, (j - 1) / 5);
            x.globalAlpha = a * (0.3 + 0.25 * k); R('#fff1b8', 8 - half, j, half * 2, 1);
            x.globalAlpha = a * (0.2 + 0.3 * k); R('#fffbe8', 8 - half + 2, j, half * 2 - 4, 1);
        }
        x.globalAlpha = 0.9;
        for (const [a, b] of [[5, 5], [11, 7], [7, 10], [12, 12], [3, 9]]) R('#ffffff', a, b, 1, 1);
        x.globalAlpha = 1;
        /* the opening, the step and the outdoors */
        R('#2a1f2d', 0, 16, 16, 16);
        R('#fffbe8', 2, 16, 12, 16); R('#fff4c8', 2, 21, 12, 5); R('#e4f2b0', 2, 26, 12, 3); R('#b8e08a', 2, 29, 12, 3);
        R('#cfc6b8', 2, 16, 12, 2); R('#efe8de', 2, 16, 12, 1);
        for (const a of [4, 9, 12]) R('#8fcc6a', a, 30, 1, 2);
        /* the frame */
        R('#8a5a34', 0, 16, 2, 16); R('#c9925a', 0, 16, 1, 16); R('#8a5a34', 14, 16, 2, 16); R('#c9925a', 14, 16, 1, 16);
        R('#2a1f2d', 2, 18, 1, 14); R('#2a1f2d', 13, 18, 1, 14);
        R('#e6c08a', 0, 16, 16, 1);
    }, false);
    /* a tall single bookcase, as tall as the others, so it hides what's behind it */
    {
        const wood = ['#c9925a', '#9a6438', '#6b4128', '#3a2418'];
        ART.bookshelf_tall = paintSprite(16, 32, x => {
            x.fillStyle = wood[1]; x.fillRect(0, 0, 16, 32); x.fillStyle = wood[3]; x.fillRect(2, 2, 12, 28);
            x.fillStyle = wood[0]; x.fillRect(0, 0, 16, 1);
            for (let r = 0; r < 3; r++) {
                const y = 4 + r * 9;
                x.fillStyle = wood[0]; x.fillRect(2, y + 7, 12, 2);
                for (let i = 0; i < 4; i++) {
                    const h = 4 + Math.floor(hash2(i, r, 9) * 3), c = ['#c0505a', '#5a8ad0', '#4fa84a', '#e8b04a', '#8a5aa0', '#fbf6ea'][Math.floor(hash2(r, i, 8) * 6)];
                    x.fillStyle = c; x.fillRect(3 + i * 3, y + 7 - h, 2, h);
                }
            }
        });
        SPR.bookshelf = ART.bookshelf_tall;
    }
    defSprite('cupboard', ['.kkkkkkkkkkkkkk.', 'kuuuuuuuuuuuuuuk', 'kUUUUUUUUUUUUUUk', 'kbbbbbbkkbbbbbbk', 'kbqqqqbkkbqqqqbk', 'kbqbbqbkkbqbbqbk', 'kbqqqqbkkbqqqqbk', 'kbbbbbbkkbbbbbbk',
        'kbbbbbykkybbbbbk', 'kbbbbbbkkbbbbbbk', 'kbqqqqbkkbqqqqbk', 'kbqbbqbkkbqbbqbk', 'kbqqqqbkkbqqqqbk', 'kbbbbbbkkbbbbbbk', 'kBBBBBBBBBBBBBBk', '.kk..........kk.'],
        { u: '#8fd6c8', U: '#5fb7a8', b: '#3c8a80', B: '#245a54', q: '#5fb7a8', y: '#f7d64a' });
    /* the Dust Monger */
    const mong = ['................................', '.........kk.........kk..........', '........kggk.......kggk.........', '........kggk.......kggk.........', '........kgik.......kigk.........', '........kggkkkkkkkkkggk.........', '......kkgggggggggggggggkk.......',
        '.....kgggggggggggggggggggk......', '....kgggwwkggggggggwwkgggGk.....', '....kgggwkkggggggggwkkgggGk.....', '...kggggggggggiigggggggggGGk....', '...kgggggggggggggggggggggGGk....', '..kggggggggggggggggggggggGGGk...', '..kgGgggggggggggggggggggGgGGk...',
        '..kgggGggggggggggggggggGggGGk...', '..kGgggggGgggggggggggGgggGGGk...', '...kGGgggggggggggggggggGGGGk....', '....kGGGGGGGGGGGGGGGGGGGGGk.....', '.....kkkkkkkkkkkkkkkkkkkkk......', '......kgggk..........kgggk......', '.......kkk............kkk.......'];
    defSprite('monger_0', mong, { g: '#e4dcd0', G: '#b0a698', w: '#ffffff', i: '#f59ac0' });
    defSprite('monger_1', mong.slice(1).concat(['................................']), { g: '#e4dcd0', G: '#b0a698', w: '#ffffff', i: '#f59ac0' });
    /* the Housekeeper: a teal wardrobe with feet and a face in its doors */
    const kp = [
        '.......kkkkkkkkkkkkkkkkkk.......', '......kyyyyyyyyyyyyyyyyyyk......', '.....kqqqqqqqqqqqqqqqqqqqqk.....', '....kqQQQQQQQQQQQQQQQQQQQQqk....', '....kqQkkkkkkkkkkkkkkkkkkQqk....',
        '....kqQkqqqqqqqkkqqqqqqqkQqk....', '....kqQkqwwwqqqkkqqwwwqqkQqk....', '....kqQkqwkkqqqkkqqkkwqqkQqk....', '....kqQkqwwwqqqkkqqwwwqqkQqk....', '....kqQkqqqqqqqkkqqqqqqqkQqk....',
        '....kqQkqqqqqqykkyqqqqqqkQqk....', '....kqQkqqqqqqqkkqqqqqqqkQqk....', '....kqQkqqqqkkkkkkkkqqqqkQqk....', '....kqQkqqqkrrrrrrrrkqqqkQqk....', '....kqQkqqqkrRRRRRRrkqqqkQqk....',
        '....kqQkqqqqkkkkkkkkqqqqkQqk....', '....kqQkqqqqqqqkkqqqqqqqkQqk....', '....kqQkqqqqqqqkkqqqqqqqkQqk....', '....kqQkqqqqqqqkkqqqqqqqkQqk....', '....kqQkkkkkkkkkkkkkkkkkkQqk....',
        '....kqQQQQQQQQQQQQQQQQQQQQqk....', '....kqqqqqqqqqqqqqqqqqqqqqqk....', '....kqQQQQQQQQQQQQQQQQQQQQqk....', '....kqQkkkkkkkkkkkkkkkkkkQqk....', '....kqQkqqqqqqqqqqqqqqqqkQqk....',
        '....kqQkqqqqqqqyyqqqqqqqkQqk....', '....kqQkqqqqqqqqqqqqqqqqkQqk....', '....kqQkkkkkkkkkkkkkkkkkkQqk....', '....kqqqqqqqqqqqqqqqqqqqqqqk....', '....kkkkkkkkkkkkkkkkkkkkkkkk....',
        '.....kbbk..............kbbk.....', '....kbbbbk............kbbbbk....', '....kkkkkk............kkkkkk....'];
    const KL = { q: '#5fb7a8', Q: '#3c8a80', y: '#f7d64a', w: '#fbf6ea', r: '#9a3a4a', R: '#c45a6a', b: '#6b4128' };
    defSprite('keeper', kp, KL);
    defSprite('keeper_sleep', swapChars(kp, { w: 'q' }), KL);
    const open = kp.slice();
    for (let i = 4; i <= 19; i++) open[i] = '...kqQ' + (i === 4 || i === 19 ? 'kkkkkkkkkkkkkkkkkkkk' : 'k' + (i >= 9 && i <= 13 ? 'KKKKKKmmmmKKKKKK' : 'KKKKKKKKKKKKKKKK') + 'kkk') + 'Qqk...';
    defSprite('keeper_open', open.map(r => r.slice(0, 32).padEnd(32, '.')), Object.assign({}, KL, { K: '#1e3a3a', m: '#e8463c' }));
}
CONTENT_INIT.push(initTidyArt);
ITEM_LINES.plan = () => `You found the {blue}House plan{/}! Every room of ${G.map && G.map.def.name ? G.map.def.name.replace(/^The /, 'the ') : 'the House'}, drawn in a neat hand.` + (firstTime('plan') ? ' (Open the map with [map].)' : '');
ITEM_LINES.pattern = () => { const c = (PATTERN_CLOTH[G.map && G.map.def.house] || ['teal'])[0]; return firstTime('pattern') ? `You found the {blue}Pattern{/}! A square of ${c} cloth stitched in a pattern like a lock's insides. The big door in this House is stitched to match.` : `You found the {blue}Pattern{/}! A square of ${c} cloth, stitched to match this House's big door.`; };
ITEM_LINES.gloves = () => 'You found the {red}Gloves{/}! Hold [act] against something to grip it: while you hold on, it stays put. Step back while gripping to pull it.';
ITEM_LINES.heartstitch = () => 'A {red}Heartstitch{/}! Your hearts grow by one.';
ITEM_LINES.key = () => firstTime('key') ? 'A {blue}small key{/}! It opens one locked door in this House.' : 'A {blue}small key{/}!';
ITEM_LINES.heartpatch = () => 'A {red}Heart Patch{/}! ' + (Inv.patches % 4 === 0 ? '' : `(${Inv.patches % 4} of 4.)`);
ITEM_AFTER.gloves = function* () { Progress.set('gotGloves'); };

/* ======================= the look of the place (all paint: nothing here is solid, moves anything or sets a flag) =======================
   A colour script for the House: teal and cream throughout, crimson underfoot, gilt for the trim. Each room papered and
   floored its own way within it: the halls a polished marble chequer under teal damask and white panelling (the
   gallery's walls picture-gallery red); block parquet in the parlour and the library (walnut) and the ballroom (golden
   oak); white tile over quarry tiles in the kitchen, limewash in the pantry, slate in the laundry, painted boards in the
   linen room, walls of glass round the conservatory, bare boards under the attic's rafters. Floors come a slab, a block or
   two boards to a tile, with soft joints and no speckle, so a mark always sits on one quiet surface; and every floor's
   colours are picked to keep the teal thread, its empty mark and its ring of stitches plain on it (the linen room's boards
   washed lavender, the laundry's slate purple-grey, the conservatory's tiles cream and sandstone). Then a few things in
   each room that say what it is (a range, a piano, a mangle, linen presses...): hung on its walls, laid on its floor
   (TIDY_DRESS, painted into the room's own picture: TidyLook), or standing where something already stood. */
const TIDY_ROOM_LOOK = { '1,3': 'hall', '0,3': 'kitchen', '2,3': 'gallery', '1,2': 'hall', '0,2': 'pantry', '2,2': 'parlour', '3,2': 'garden',
    '2,1': 'linen', '3,1': 'laundry', '1,1': 'ball', '0,1': 'library', '0,0': 'attic', '2,0': 'hall', '1,0': 'grand' };
/* (a chequer or a basket weave needs to know which tile it's on: the odd tiles of the floor are the look's second half,
   '_b'; a wall or the kitchen counter is the same either way, so it's always the first, and painted once) */
const tidyLookAt = (x, y) => {
    const n = TIDY_ROOM_LOOK[Math.floor(x / 20) + ',' + Math.floor(y / 11)] || 'hall', row = AREAS.tidy.rows[y];
    return 'tidy_' + n + (TIDY_LOOKS[n].alt && (x + y) & 1 && row && row[x] !== '#' && row[x] !== 'l' ? '_b' : '');
};
const TidyFloor = {
    /* a slab of stone or marble, a tile to itself: lit along its top and left, in shade along its bottom and right, a
       faint vein across one corner (never through the middle, where a mark is stitched) */
    slab: c => (x, th, v) => {
        fill(x, c[0]);
        if (c[3]) for (const [i, j] of [[[1, 6], [2, 5], [3, 5], [4, 4], [5, 3], [6, 2]], [[9, 14], [10, 13], [11, 13], [12, 12], [13, 11]],
            [[10, 1], [11, 2], [12, 2], [13, 3], [14, 4]], [[1, 10], [2, 11], [2, 12], [3, 13], [4, 14]]][v]) px(x, i, j, c[3]);
        if (c[4] && v === 0) { px(x, 0, 0, c[4]); px(x, 1, 0, c[4]); px(x, 0, 1, c[4]); px(x, 15, 15, c[5]); px(x, 14, 15, c[5]); px(x, 15, 14, c[5]); }
        fill(x, c[1], 0, 0, 15, 1); fill(x, c[1], 0, 1, 1, 14);
        fill(x, c[2], 0, 15, 16, 1); fill(x, c[2], 15, 0, 1, 15);
    },
    /* a block of parquet, a tile to itself: four slats laid one way (the next block the other way), soft seams, a short
       grain mark in each slat near its end, the block's joint dark */
    block: (P, across) => (x, th, v) => {
        for (let s = 0; s < 4; s++) {
            const t = P.tone[(s + v) % P.tone.length], g = s % 2 ? 1 : 12;
            if (across) { fill(x, t, 0, s * 4, 16, 4); if (s) fill(x, P.seam, 0, s * 4, 16, 1); fill(x, P.grain, g, s * 4 + 2, 3, 1); }
            else { fill(x, t, s * 4, 0, 4, 16); if (s) fill(x, P.seam, s * 4, 0, 1, 16); fill(x, P.grain, s * 4 + 2, g, 1, 3); }
        }
        fill(x, P.lit, 0, 0, 15, 1); fill(x, P.lit, 0, 1, 1, 14); fill(x, P.joint, 0, 15, 16, 1); fill(x, P.joint, 15, 0, 1, 15);
    },
    /* boards, two to a tile, up and down (painted) or across (bare); a butt joint with its nails on some */
    boards: P => (x, th, v) => {
        const up = P.dir === 'v';
        for (let b = 0; b < 2; b++) {
            const t = P.tone[(b + v) % P.tone.length], o = b * 8;
            if (up) { fill(x, t, o, 0, 8, 16); fill(x, P.hi, o, 0, 1, 16); fill(x, P.seam, o + 7, 0, 1, 16); }
            else { fill(x, t, 0, o, 16, 8); fill(x, P.hi, 0, o, 16, 1); fill(x, P.seam, 0, o + 7, 16, 1); }
        }
        if (v === 1) { if (up) { fill(x, P.seam, 8, 3, 7, 1); px(x, 10, 1, P.nail); px(x, 10, 5, P.nail); } else { fill(x, P.seam, 3, 8, 1, 7); px(x, 1, 10, P.nail); px(x, 5, 10, P.nail); } }
        if (v === 3) { if (up) { fill(x, P.seam, 0, 12, 7, 1); px(x, 3, 10, P.nail); px(x, 3, 14, P.nail); } else { fill(x, P.seam, 12, 0, 1, 7); px(x, 10, 3, P.nail); px(x, 14, 3, P.nail); } }
    },
    /* a carpet: plain wool, a darker knot where four tiles meet (its borders are laid over it, TidyLook) */
    carpet: C => (x, th, v) => {
        fill(x, C[0]); fill(x, C[1], 0, 0, 15, 1); fill(x, C[1], 0, 1, 1, 14);
        for (const [i, j] of [[0, 0], [15, 0], [0, 15], [15, 15]]) px(x, i, j, C[2]);
    },
};
const TF_MARBLE = TidyFloor.slab(['#e9dfc8', '#f6f0e2', '#c9bb9c', '#d8cbb0']);
const TF_MARBLE_B = TidyFloor.slab(['#41585b', '#587275', '#2c3b3e', '#4e6668']);
const TF_WALNUT = { tone: ['#8a5634', '#93603b', '#865332'], seam: '#734628', grain: '#6e4226', lit: '#a06a42', joint: '#4e2e1c' };
const TF_OAK = { tone: ['#c99552', '#d09c58', '#c48f4e'], seam: '#b07c40', grain: '#a87438', lit: '#e2b674', joint: '#7e5428' };
const TF_CARPET = TidyFloor.carpet(['#9a3a4a', '#a24456', '#7a2a3a']);
const TIDY_LOOKS = {
    hall: { floor: TF_MARBLE, alt: TF_MARBLE_B, paper: 'damask', pc: ['#5fb7a8', '#7ccabe', '#46998d', '#e8c060'], dado: 'cream' },
    grand: { floor: TF_MARBLE, alt: TF_MARBLE_B, paper: 'damask', pc: ['#4c9f93', '#66b7aa', '#367d73', '#f0c868'], dado: 'cream' },
    gallery: { floor: TF_MARBLE, alt: TF_MARBLE_B, paper: 'damask', pc: ['#943848', '#a64a5a', '#742634', '#e0b050'], dado: 'cream' },
    parlour: { floor: TidyFloor.block(TF_WALNUT, false), alt: TidyFloor.block(TF_WALNUT, true), paper: 'stripe', pc: ['#efdcc4', '#c97a84', '#a85a66', '#e0b860'], dado: 'walnut' },
    library: { floor: TidyFloor.block(TF_WALNUT, false), alt: TidyFloor.block(TF_WALNUT, true), paper: 'damask', pc: ['#3f6b58', '#4e7d68', '#2f5646', '#c8a048'], dado: 'walnut' },
    ball: { floor: TidyFloor.block(TF_OAK, false), alt: TidyFloor.block(TF_OAK, true), paper: 'gilt', pc: ['#f2e8d0', '#e6d8b8', '#d9a33a', '#f6d880'], dado: 'cream' },
    kitchen: { floor: TidyFloor.slab(['#e0c79c', '#eed9b4', '#b89c70']), alt: TidyFloor.slab(['#b35c40', '#c8745a', '#86402c']), paper: 'tile', pc: ['#f3efe4', '#cfc7b6', '#ffffff', '#5fb7a8', '#3c8a80'] },
    pantry: { floor: TidyFloor.slab(['#c9b894', '#dacba8', '#a08c68', '#bead88']), paper: 'lime', pc: ['#ece3cf', '#e2d8c2', '#f4ecdc'], dado: 'paint' },
    laundry: { floor: TidyFloor.slab(['#968e9e', '#aea6b6', '#6e6878']), paper: 'tile', pc: ['#e9eff0', '#c2cbcc', '#ffffff', '#5fb7a8', '#3c8a80'] },
    linen: { floor: TidyFloor.boards({ dir: 'v', tone: ['#a89aae', '#a394a9', '#ad9fb3'], hi: '#bcb0c4', seam: '#8a7c92', nail: '#7a6c82' }), paper: 'ticking', pc: ['#efe6d4', '#8a9cc0', '#b8c4dc'], dado: 'paint' },
    garden: { floor: TidyFloor.slab(['#e4e0c8', '#f0ecda', '#b8b498', null, '#c0704a', '#c0704a']), alt: TidyFloor.slab(['#bca088', '#ccb39c', '#967c66', null, '#c0704a', '#c0704a']), paper: 'glass', pc: ['#d2ece8', '#aed6a6', '#eef2ea', '#6aa060', '#c8ccc0'] },
    attic: { floor: TidyFloor.boards({ dir: 'h', tone: ['#b8946a', '#b08c62', '#bf9b70'], hi: '#ccac82', seam: '#7e5e3c', nail: '#5e4430' }), paper: 'plaster', pc: ['#d8ccb4', '#cec1a8', '#e2d8c4'], dado: 'plain' },
};
const TidyWall = {
    /* the paper, the top half of a wall's face (rows 0-7) */
    paper(x, L, v) {
        const C = L.pc;
        switch (L.paper) {
            case 'damask': {
                /* a damask lattice: thin lines crossing on the slant, a dot in each diamond, a gilt glint where they cross */
                fill(x, C[0], 0, 0, 16, 8);
                for (let j = 0; j < 8; j++) for (let i = 0; i < 16; i++) {
                    const a = (i + j) % 8, b = (i - j + 16) % 8;
                    if (a === 0 && b === 0) px(x, i, j, C[3]); else if (a === 0 || b === 0) px(x, i, j, C[1]); else if (a === 4 && b === 4) px(x, i, j, C[2]);
                }
                fill(x, C[2], 0, 0, 16, 1);
                break;
            }
            case 'stripe': for (let i = 0; i < 16; i++) fill(x, [C[2], C[1], C[0], C[0], C[0], C[0], C[0], C[1]][i % 8], i, 0, 1, 8); px(x, 4, 3, C[3]); px(x, 12, 3, C[3]); fill(x, C[2], 0, 0, 16, 1); break;
            case 'gilt': fill(x, C[0], 0, 0, 16, 8); for (const g of [0, 8]) { fill(x, C[2], g, 0, 1, 8); fill(x, C[3], g + 1, 0, 1, 8); }
                for (const g of [3, 11]) { fill(x, C[1], g, 2, 4, 4); fill(x, C[0], g + 1, 3, 2, 2); }
                fill(x, C[2], 0, 0, 16, 1); break;
            case 'lime': fill(x, C[0], 0, 0, 16, 8); fill(x, C[1], 0, 0, 16, 1); fill(x, C[2], (v * 5) % 12 + 1, 3, 3, 1); break;
            case 'ticking': fill(x, C[0], 0, 0, 16, 8); for (const i of [2, 4, 10, 12]) fill(x, C[1], i, 0, 1, 8); for (const i of [3, 11]) fill(x, C[2], i, 0, 1, 8); fill(x, shade(C[0], -0.08), 0, 0, 16, 1); break;
            case 'plaster': fill(x, C[0], 0, 0, 16, 16); fill(x, C[1], 0, 0, 16, 1); if (v === 2) { fill(x, C[2], 4, 4, 5, 1); fill(x, C[1], 9, 9, 3, 1); } break;
        }
    },
    face(x, L, v) {
        const C = L.pc;
        if (L.paper === 'tile') {
            /* glazed white tiles to the floor, a teal band at the dado, a dark teal skirting */
            fill(x, C[1]);
            for (let j = 0; j < 8; j += 4) for (let i = 0; i < 16; i += 4) { fill(x, C[0], i, j, 3, 3); px(x, i, j, C[2]); }
            fill(x, C[3], 0, 8, 16, 2); fill(x, shade(C[3], 0.3), 0, 8, 16, 1); fill(x, C[4], 0, 10, 16, 1);
            for (let i = 0; i < 16; i += 4) { fill(x, C[0], i, 11, 3, 2); px(x, i, 11, C[2]); }
            fill(x, C[4], 0, 13, 16, 2); fill(x, shade(C[4], 0.25), 0, 13, 16, 1); fill(x, '#2a1f2d', 0, 15, 16, 1);
            return;
        }
        if (L.paper === 'glass') {
            /* the conservatory's glazing: white bars, the garden green behind the glass, a glint; a low brick wall under it */
            for (let j = 0; j < 10; j++) fill(x, mix(C[0], C[1], j / 9), 0, j, 16, 1);
            for (const [i, j] of [[2, 8], [3, 7], [4, 8], [5, 9], [10, 9], [11, 8], [12, 7], [13, 8], [14, 9]]) fill(x, C[3], i, j, 1, 10 - j);
            fill(x, C[2], 0, 0, 1, 10); fill(x, C[2], 8, 0, 1, 10); fill(x, C[4], 1, 0, 1, 10); fill(x, C[4], 9, 0, 1, 10);
            fill(x, C[2], 0, 4, 16, 1); fill(x, C[4], 0, 5, 16, 1);
            px(x, 3, 1, '#ffffff'); px(x, 4, 1, '#ffffff'); px(x, 3, 2, '#ffffff'); px(x, 12, 1, '#f4fbfa');
            fill(x, '#eceee4', 0, 10, 16, 1); fill(x, '#a8ac9c', 0, 11, 16, 1);
            fill(x, '#8a4a34', 0, 12, 16, 3);
            for (let i = (v & 1) * 4; i < 16; i += 8) fill(x, '#b86a4a', i, 12, 7, 1);
            for (let i = 4 - (v & 1) * 4; i < 16; i += 8) fill(x, '#c47a58', i, 13, 7, 1);
            fill(x, '#2a1f2d', 0, 15, 16, 1);
            return;
        }
        this.paper(x, L, v);
        switch (L.dado) {
            case 'cream': case 'walnut': {
                const Wd = L.dado === 'cream' ? ['#e6d9bd', '#f7efdc', '#dacbad', '#c2b190'] : ['#7a4c30', '#9a6644', '#6c4229', '#55331f'];
                const rail = L.dado === 'cream' ? ['#f0c868', '#a87a2a'] : ['#b07a4c', '#4e2e1c'];
                fill(x, rail[0], 0, 8, 16, 1); fill(x, rail[1], 0, 9, 16, 1);
                fill(x, Wd[0], 0, 10, 16, 4); fill(x, Wd[1], 0, 10, 16, 1);
                for (const p0 of [1, 9]) { fill(x, Wd[2], p0, 11, 6, 2); fill(x, Wd[3], p0, 11, 6, 1); fill(x, Wd[3], p0, 11, 1, 2); fill(x, Wd[1], p0 + 6, 11, 1, 2); }
                fill(x, L.dado === 'cream' ? '#6e4430' : '#3e2416', 0, 14, 16, 1);
                break;
            }
            case 'paint': {
                const P = L === TIDY_LOOKS.linen ? ['#8fa2ae', '#a8bac4', '#768894'] : ['#4f9c90', '#6fb8ab', '#3f8478'];
                fill(x, '#8a6a4a', 0, 8, 16, 1); fill(x, '#5e4430', 0, 9, 16, 1);
                fill(x, P[0], 0, 10, 16, 4); fill(x, P[1], 0, 10, 16, 1); for (let i = 3; i < 16; i += 4) fill(x, P[2], i, 11, 1, 3);
                fill(x, shade(P[2], -0.25), 0, 14, 16, 1);
                break;
            }
            default: {
                /* (the attic: plaster to the floor, a post here and there, a plain board along the foot) */
                if (v === 1) { fill(x, '#7a5a3c', 6, 0, 3, 13); fill(x, '#9a7450', 6, 0, 1, 13); fill(x, '#5a3e28', 8, 0, 1, 13); }
                fill(x, '#8a6a48', 0, 13, 16, 2); fill(x, '#a8845e', 0, 13, 16, 1);
            }
        }
        fill(x, '#2a1f2d', 0, 15, 16, 1);
    },
};
for (const [n, L] of Object.entries(TIDY_LOOKS)) for (const half of L.alt ? ['', '_b'] : ['']) {
    const tn = 'tidy_' + n + half, f = half ? L.alt : L.floor;
    THEMES[tn] = THEMES.tidy;
    FLOORS[tn] = { floor: f, floor2: TF_CARPET, floor3: f };
    WALLS[tn] = { edge: '#142424', top: (x) => { fill(x, '#245a54'); fill(x, '#2a665f', 0, 0, 16, 1); }, face: (x, th, v) => TidyWall.face(x, L, v) };
}
/* the kitchen counter, over the kitchen's own flags (as the House's counter is drawn over its boards) */
FLOORS.tidy_kitchen.counter = (x, th, v) => {
    FLOORS.tidy_kitchen.floor(x, th, v);
    fill(x, '#3a2a30', 0, 0, 16, 1); fill(x, '#f4ecdc', 0, 1, 16, 5); fill(x, '#fffaf0', 0, 1, 16, 1);
    for (const i of [3, 7, 11, 15]) fill(x, '#ddd0b6', i, 2, 1, 4);
    fill(x, '#ddd0b6', 0, 3, 16, 1);
    fill(x, '#fbf6ea', 0, 6, 16, 1); fill(x, '#a89878', 0, 7, 16, 1);
    fill(x, '#245a54', 0, 8, 16, 6);
    if (v === 3) {
        for (const j of [8, 10, 12]) { fill(x, '#4fa89c', 1, j, 14, 1); fill(x, '#3c8a80', 1, j + 1, 14, 1); px(x, 7, j + 1, '#e8b04a'); px(x, 8, j + 1, '#e8b04a'); }
    } else {
        fill(x, '#3c8a80', 1, 8, 6, 5); fill(x, '#3c8a80', 9, 8, 6, 5);
        fill(x, '#5fb7a8', 1, 8, 6, 1); fill(x, '#5fb7a8', 9, 8, 6, 1); fill(x, '#5fb7a8', 1, 8, 1, 5); fill(x, '#5fb7a8', 9, 8, 1, 5);
        fill(x, '#2e7068', 3, 10, 3, 2); fill(x, '#2e7068', 11, 10, 3, 2);
        px(x, 6, 10, '#e8b04a'); px(x, 9, 10, '#e8b04a');
    }
    fill(x, '#2a1f2d', 0, 13, 16, 2);
    x.globalAlpha = 0.4; fill(x, '#2a1f2d', 0, 15, 16, 1); x.globalAlpha = 1;
};

/* the ground's dressing, room by room, painted once into one picture and laid over the floor under everything that
   stands or lies on it: each carpet's border, the shadow along the foot of every wall (the light comes from the top
   left), and the room's own pieces. (A picture is painted again only if the room's map changes under it.) */
const RoomLook = {
    cache: {},
    sig(a, r) { let s = ''; for (let j = 0; j < r.h; j++) s += a.chars.slice((r.y + j) * a.w + r.x, (r.y + j) * a.w + r.x + r.w).join(''); return s; },
    room(a, r, dress) {
        const k = a.id + ':' + r.key, c = this.cache[k];
        if (c && (!a._dirty || c.sig === this.sig(a, r))) return c.im;
        const im = paintSprite(r.w * T, r.h * T, x => this.paint(x, a, r, dress), false);
        this.cache[k] = { sig: this.sig(a, r), im };
        return im;
    },
    /* (all the rooms painted on the way in, behind the fade) */
    warm(a, dress) { if (HEADLESS) return; for (const r of a.rooms) { const c = this.cache[a.id + ':' + r.key]; if (c && c.sig !== this.sig(a, r)) delete this.cache[a.id + ':' + r.key]; this.room(a, r, dress); } },
    ground(a, cx, cy, dress) {
        if (HEADLESS) return;
        for (const r of a.rooms) {
            const X = r.x * T - cx, Y = r.y * T - cy;
            if (X >= W || Y >= H || X + r.w * T <= 0 || Y + r.h * T <= 0) continue;
            Gfx.img(this.room(a, r, dress), X, Y);
        }
    },
    paint(x, a, r, dress) {
        const R = (c, X, Y, w, h) => { x.fillStyle = c; x.fillRect(X, Y, w, h); };
        const cell = (i, j) => a.cell(r.x + i, r.y + j), carpet = (i, j) => cell(i, j).p === 'floor2' && cell(i, j).k === 'floor';
        const D = dress[r.key] || {}, put = list => { for (const [n, X, Y, flip] of list || []) { const im = ART[n]; if (!im) continue; if (flip) { x.save(); x.translate(X + im.width, Y); x.scale(-1, 1); x.drawImage(im, 0, 0); x.restore(); } else x.drawImage(im, X, Y); } };
        /* carpets (where the House's dressing has them: dress.border): a dark binding, a gilt band, a line of darker red,
           each pixel the band of the nearest edge (so every corner, outside or in, is mitred) */
        const B = dress.border;
        for (let j = 0; j < r.h; j++) for (let i = 0; i < r.w; i++) {
            if (!B || !carpet(i, j)) continue;
            const n = !carpet(i, j - 1), s = !carpet(i, j + 1), w = !carpet(i - 1, j), e = !carpet(i + 1, j);
            const nw = !n && !w && !carpet(i - 1, j - 1), ne = !n && !e && !carpet(i + 1, j - 1), sw = !s && !w && !carpet(i - 1, j + 1), se = !s && !e && !carpet(i + 1, j + 1);
            if (!(n || s || w || e || nw || ne || sw || se)) continue;
            for (let py = 0; py < 16; py++) for (let qx = 0; qx < 16; qx++) {
                const d = Math.min(n ? py : 9, s ? 15 - py : 9, w ? qx : 9, e ? 15 - qx : 9, nw ? Math.max(qx, py) : 9, ne ? Math.max(15 - qx, py) : 9,
                    sw ? Math.max(qx, 15 - py) : 9, se ? Math.max(15 - qx, 15 - py) : 9);
                if (d < 3) R(B[d], i * T + qx, j * T + py, 1, 1);
            }
        }
        put(D.floor);
        if (D.paint) D.paint(x, R, a, r);
        /* the shadow at the foot of the walls */
        for (let j = 0; j < r.h; j++) for (let i = 0; i < r.w; i++) {
            if (cell(i, j).k !== 'floor') continue;
            const X = i * T, Y = j * T;
            if (cell(i, j - 1).k === 'wall') { x.globalAlpha = 0.24; R('#2a1f2d', X, Y, 16, 1); x.globalAlpha = 0.14; R('#2a1f2d', X, Y + 1, 16, 1); x.globalAlpha = 0.06; R('#2a1f2d', X, Y + 2, 16, 1); }
            if (cell(i - 1, j).k === 'wall') { x.globalAlpha = 0.14; R('#2a1f2d', X, Y, 1, 16); x.globalAlpha = 0.06; R('#2a1f2d', X + 1, Y, 1, 16); }
            x.globalAlpha = 1;
        }
        put(D.wall);
    },
};

/* each room's own pieces, in room pixels: hung on the walls (wall: art, x, y[, flipped]) or laid flat on the floor (floor);
   and the carpets' border */
const TIDY_DRESS = {
    border: ['#4a1620', '#d9a33a', '#7a2836'],
    /* the front hall: the family either side of the way in, hats and coats on their pegs, a mat inside the door */
    '1,3': { wall: [['td_coats', 209, 0], ['td_portrait_lady', 113, 1], ['td_portrait_gent', 177, 1]], floor: [['td_doormat', 144, 148]] },
    /* the kitchen: copper pans over the work (the range stands where the old stove stood) */
    '0,3': { wall: [['td_pans', 160, 1]] },
    /* the gallery: pictures on its red walls */
    '2,3': { wall: [['td_paint_sea', 180, 0], ['td_paint_fruit', 214, 0], ['td_paint_hills', 82, 64], ['td_paint_horse', 197, 64]] },
    /* the hall of busts: marble pilasters marching down it */
    '1,2': { wall: [['td_pilaster', 83, 0], ['td_pilaster', 131, 0], ['td_pilaster', 179, 0], ['td_pilaster', 227, 0], ['td_pilaster', 35, 48], ['td_pilaster', 83, 48], ['td_pilaster', 131, 48], ['td_pilaster', 179, 48], ['td_pilaster', 227, 48]] },
    /* the pantry: a ham, strings of onions and garlic, herbs drying (the larder dresser where the bookcase stood) */
    '0,2': { wall: [['td_hams', 85, 0], ['td_herbs', 197, 1]] },
    /* the parlour: the fire, the armchairs drawn up to it (the piano where the bookcase stood) */
    '2,2': { wall: [['td_fireplace', 63, 0]] },
    /* the linen room: its four cupboards made linen presses */
    '2,1': { wall: [['td_press', 32, 32], ['td_press', 256, 32], ['td_press', 32, 112], ['td_press', 256, 112]] },
    /* the laundry: Monday's wash on the line along the wall (the mangle beside the tub) */
    '3,1': { wall: [['td_washline', 114, 0]] },
    /* the ballroom: tall windows hung with crimson, a mirror between */
    '1,1': { wall: [['td_window', 83, 0], ['td_mirror', 153, 1], ['td_window', 211, 0]] },
    /* the library: a reading room's rug (and reading lamps on its tables) */
    '0,1': { floor: [['td_rug', 96, 68]] },
    /* the attic: under the rafters, a round window in the gable */
    '0,0': { wall: [['td_oculus', 161, 17]], paint: (x, R) => TidyLook.rafters(x, R) },
    /* the antechamber: the Housekeeper's brooms and pails, kept just so */
    '2,0': { wall: [['td_brooms', 83, 0], ['td_brooms', 211, 0, true]] },
    /* the grand hall: tall windows, the House's own banner between */
    '1,0': { wall: [['td_window', 83, 0], ['td_banner', 140, 0], ['td_window', 211, 0]] },
};
const TidyLook = {
    ground(a, cx, cy) { RoomLook.ground(a, cx, cy, TIDY_DRESS); },
    warm(a) { RoomLook.warm(a, TIDY_DRESS); },
    /* the attic's roof: rafters down both slopes over the thick side walls, a purlin across */
    rafters(x, R) {
        for (const [x0, dir] of [[0, 1], [319, -1]]) {
            R('#3a2a1e', dir > 0 ? 0 : 256, 74, 64, 6); R('#7a5a3c', dir > 0 ? 0 : 256, 74, 64, 4); R('#a8845e', dir > 0 ? 0 : 256, 74, 64, 1);
            for (let k = 0; k < 3; k++) {
                const top = 8 + k * 50;
                for (let s = 0; s < 64; s++) { const X = x0 + dir * s, Y = top + Math.floor(s * 0.5); if (Y > 160) break; R('#3a2a1e', X, Y, 1, 7); R('#6e5034', X, Y + 1, 1, 5); R('#9a7450', X, Y + 1, 1, 1); }
            }
        }
    },
};
/* the pieces (lit from the top left; most are outlined in ink by paintSprite, as the rest of the House's things are) */
function initTidyLook() {
    const pic = (w, h, fn, outline = true) => paintSprite(w, h, x => fn((c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); }, x), outline);
    const gilt = (R, a, b, w, h) => { R('#d9a33a', a, b, w, h); R('#f2cc6a', a, b, w, 1); R('#f2cc6a', a, b, 1, h); R('#a6772a', a, b + h - 1, w, 1); R('#a6772a', a + w - 1, b, 1, h); };
    /* two of the family, in gilt frames: a lady in teal with a lace collar, a gentleman with whiskers and a crimson stock */
    ART.td_portrait_lady = pic(14, 15, R => {
        gilt(R, 1, 1, 12, 13); R('#2e2630', 3, 3, 8, 9);
        R('#8e8e98', 5, 3, 4, 2); R('#b4b4bc', 5, 3, 2, 1); R('#8e8e98', 6, 2, 2, 1);
        R('#f2c49b', 5, 5, 4, 3); R('#d8956b', 8, 5, 1, 3); R('#2a1f2d', 6, 6, 1, 1);
        R('#fbf6ea', 4, 8, 6, 1); R('#3fa99e', 3, 9, 8, 3); R('#6fd0c4', 4, 9, 2, 2); R('#2e7e78', 9, 9, 2, 3);
    });
    ART.td_portrait_gent = pic(14, 15, R => {
        gilt(R, 1, 1, 12, 13); R('#2e2630', 3, 3, 8, 9);
        R('#5a3a26', 5, 3, 4, 2); R('#f2c49b', 5, 4, 4, 4); R('#d8956b', 8, 4, 1, 4); R('#2a1f2d', 6, 5, 1, 1);
        R('#7a5a44', 4, 6, 1, 2); R('#7a5a44', 9, 6, 1, 2);
        R('#c0303e', 6, 8, 2, 1); R('#3a3448', 3, 9, 8, 3); R('#56506a', 4, 9, 2, 2); R('#fbf6ea', 6, 9, 2, 1);
    });
    /* hats and coats on a peg rail: a long teal coat, a crimson scarf, a bowler and a walking stick */
    ART.td_coats = pic(24, 16, R => {
        R('#8a5a36', 1, 2, 22, 2); R('#b07a4c', 1, 2, 22, 1);
        for (const p of [4, 12, 19]) R('#5e3a22', p, 4, 1, 1);
        R('#3c8a80', 2, 4, 6, 11); R('#5fb7a8', 2, 4, 2, 10); R('#2e6a62', 7, 5, 1, 10); R('#e2b45a', 5, 7, 1, 1); R('#e2b45a', 5, 10, 1, 1); R('#2e6a62', 4, 14, 3, 1);
        R('#b8364a', 11, 4, 3, 9); R('#d85a6a', 11, 4, 1, 8); R('#b8364a', 10, 12, 2, 2); R('#e8b04a', 11, 13, 1, 1);
        R('#2a2834', 16, 5, 7, 2); R('#3a3848', 17, 3, 5, 3); R('#4a4858', 17, 3, 2, 1);
        R('#6b4128', 21, 8, 1, 7); R('#9a6438', 20, 8, 2, 1);
    });
    /* the mat inside the front door: coir, a teal border, the weave showing */
    ART.td_doormat = pic(16, 10, R => {
        R('#3c8a80', 0, 0, 16, 10); R('#b8925a', 1, 1, 14, 8);
        for (let i = 2; i < 14; i += 2) R('#9a7444', i, 2, 1, 6);
        R('#d0aa70', 1, 1, 14, 1); R('#5fb7a8', 0, 0, 16, 1);
    }, false);
    /* the range: a black iron range under a plastered hood, the fire glowing in its box, brass rail and handles, a copper
       kettle on the hob (in place of the old stove, on the same two tiles) */
    ART.td_range = pic(32, 30, R => {
        R('#e8dcc4', 5, 1, 22, 3); R('#ddd0b4', 4, 4, 24, 4); R('#cfc0a0', 3, 8, 26, 3); R('#f4ecdc', 5, 1, 22, 1);
        R('#a89878', 3, 10, 26, 1); R('#e2b45a', 2, 11, 28, 1);
        R('#3a3440', 2, 12, 28, 17); R('#4e4858', 2, 12, 28, 2); R('#5e586a', 2, 12, 28, 1);
        R('#2a2430', 5, 13, 5, 1); R('#2a2430', 22, 13, 5, 1);
        R('#c8743a', 6, 7, 6, 5); R('#f0a868', 6, 7, 2, 2); R('#8a4a22', 11, 8, 1, 4); R('#c8743a', 12, 8, 2, 1); R('#c8743a', 7, 6, 3, 1);
        R('#e2b45a', 2, 15, 28, 1); R('#b88a2a', 2, 16, 28, 1);
        for (const d of [3, 20]) { R('#2e2834', d, 18, 9, 8); R('#4a4454', d, 18, 9, 1); R('#4a4454', d, 18, 1, 8); R('#e2b45a', d + 6, 21, 2, 1); }
        R('#2a1f2d', 13, 18, 6, 8); R('#c0302e', 14, 21, 4, 4); R('#f39a3c', 14, 22, 4, 3); R('#f7d64a', 15, 23, 2, 2);
        R('#2a2430', 2, 27, 28, 2); R('#4a4454', 3, 27, 2, 2); R('#4a4454', 27, 27, 2, 2);
    });
    /* copper pans on a rail: a frying pan, two saucepans, a little milk pan, a ladle */
    ART.td_pans = pic(46, 15, R => {
        R('#b88a2a', 1, 1, 44, 1); R('#e2b45a', 1, 1, 44, 1); R('#8a6a3a', 1, 2, 44, 1);
        const pan = (cx, r, hl) => {
            R('#6b4128', cx, 2, 1, hl);
            for (let j = -r; j <= r; j++) { const w = Math.round(Math.sqrt(r * r - j * j)); R(j < -r / 3 ? '#f0a868' : j > r / 2 ? '#8a4a22' : '#c8743a', cx - w, 2 + hl + r + j, w * 2 + 1, 1); }
            R('#a85a2a', cx - Math.round(r / 2), 2 + hl + r - Math.round(r / 2), Math.max(2, r), Math.max(2, r));
        };
        pan(7, 5, 1); pan(19, 4, 2); pan(30, 3, 3); pan(39, 2, 4);
        R('#9a9aa8', 44, 2, 1, 8); R('#c8c8d4', 43, 9, 2, 2);
    });
    /* pictures for the gallery, in gilt: the sea with a sail on it, a bowl of fruit, the hills at home, a grey horse */
    const framed = (w, h, fn) => pic(w, h, R => { gilt(R, 1, 1, w - 2, h - 2); fn(R); });
    ART.td_paint_sea = framed(26, 15, R => {
        R('#bfe0f0', 3, 3, 20, 5); R('#e8f4fa', 4, 4, 6, 1); R('#3f8fd8', 3, 8, 20, 4); R('#5fb5e8', 3, 8, 20, 1); R('#2b5aa8', 3, 11, 20, 1);
        R('#fbf6ea', 13, 4, 3, 4); R('#d8d0c0', 15, 5, 1, 3); R('#6b4128', 12, 8, 6, 1);
    });
    ART.td_paint_fruit = framed(20, 15, R => {
        R('#3a2a2e', 3, 3, 14, 9); R('#c9925a', 5, 9, 10, 2); R('#e6c08a', 5, 9, 10, 1);
        R('#c0303e', 6, 6, 3, 3); R('#e8604a', 6, 6, 1, 1); R('#8fd46a', 9, 6, 3, 3); R('#c8e66a', 9, 6, 1, 1); R('#8a5aa0', 12, 7, 2, 2); R('#b48ce8', 12, 7, 1, 1);
    });
    ART.td_paint_hills = framed(26, 15, R => {
        R('#cfe9f4', 3, 3, 20, 5); R('#a9e07f', 3, 7, 20, 2); R('#7cc35c', 3, 9, 20, 2); R('#5fa84c', 3, 11, 20, 1);
        R('#a9e07f', 12, 6, 8, 1); R('#fbf6ea', 7, 6, 3, 2); R('#c0505a', 7, 5, 3, 1); R('#f7d64a', 19, 4, 2, 2);
    });
    ART.td_paint_horse = framed(26, 15, R => {
        R('#e8d8b0', 3, 3, 20, 9); R('#c8b888', 3, 10, 20, 2);
        R('#b4b4bc', 9, 6, 9, 3); R('#d8d8e0', 9, 6, 9, 1); R('#b4b4bc', 17, 4, 3, 3); R('#2a1f2d', 19, 5, 1, 1);
        for (const l of [10, 12, 15, 17]) R('#8e8e98', l, 9, 1, 2);
        R('#6e6e78', 8, 7, 1, 3);
    });
    /* a marble pilaster: a gilt capital, a fluted shaft, a plinth */
    ART.td_pilaster = pic(10, 16, R => {
        R('#efe6d6', 2, 3, 6, 11); R('#fbf6ea', 2, 3, 1, 11); R('#cfc2a8', 7, 3, 1, 11); R('#dcd0b8', 4, 3, 1, 11); R('#dcd0b8', 6, 3, 1, 11);
        R('#d9a33a', 1, 1, 8, 2); R('#f2cc6a', 1, 1, 8, 1); R('#efe6d6', 1, 14, 8, 2); R('#cfc2a8', 1, 15, 8, 1);
    });
    /* the larder dresser (in place of the pantry's bookcase): jars of preserves, a crock, a cheese, a loaf */
    ART.td_larder = pic(32, 30, R => {
        R('#9a6438', 1, 1, 30, 28); R('#3a2418', 3, 3, 26, 24); R('#c9925a', 1, 1, 30, 1);
        for (let r = 0; r < 3; r++) { const y = 3 + r * 8; R('#c9925a', 3, y + 7, 26, 1); R('#6b4128', 3, y + 8, 26, 1); }
        const jar = (a, b, c) => { R('#fbf6ea', a, b, 4, 1); R(c, a, b + 1, 4, 5); R(shade(c, 0.35), a, b + 2, 1, 3); R('#e8dcc8', a, b, 4, 1); };
        jar(4, 4, '#c0303e'); jar(9, 4, '#e8903a'); jar(14, 4, '#8aa84a'); jar(19, 4, '#c0303e'); jar(24, 4, '#8a5aa0');
        R('#e8dcc0', 4, 12, 7, 6); R('#fbf6ea', 4, 12, 2, 5); R('#5a8ad0', 4, 14, 7, 1); R('#c8bca0', 10, 12, 1, 6);
        R('#f0c860', 14, 14, 9, 4); R('#f7e08a', 14, 14, 9, 1); R('#c8963a', 14, 17, 9, 1); R('#e8b04a', 18, 14, 4, 2);
        R('#c9925a', 24, 13, 5, 5); R('#e6c08a', 24, 13, 5, 1);
        R('#d8c8a0', 4, 21, 6, 5); R('#c4b088', 4, 24, 6, 1); R('#d8c8a0', 12, 22, 5, 4); R('#9a9aa8', 19, 21, 4, 5); R('#c8c8d4', 19, 21, 1, 5); R('#9a9aa8', 24, 22, 4, 4);
    });
    /* from the pantry's hooks: a ham in a cloth, a string of onions, a string of garlic */
    ART.td_hams = pic(26, 16, R => {
        R('#8a6a4a', 1, 1, 24, 1);
        R('#d8c8a8', 4, 2, 1, 2); R('#c8784a', 2, 4, 6, 7); R('#e09a6a', 2, 4, 2, 5); R('#8a4a2a', 7, 5, 1, 6); R('#c8784a', 3, 11, 4, 2); R('#fbf6ea', 4, 13, 2, 2);
        for (let k = 0; k < 5; k++) { R('#d9a050', 11 + (k % 2), 3 + k * 2, 3, 2); R('#f0c070', 11 + (k % 2), 3 + k * 2, 1, 1); }
        for (let k = 0; k < 5; k++) { R('#f0ead8', 18 + (k % 2), 3 + k * 2, 3, 2); R('#c8bca0', 20 + (k % 2), 4 + k * 2, 1, 1); }
    });
    /* bunches of herbs hung up to dry */
    ART.td_herbs = pic(20, 12, R => {
        R('#8a6a4a', 1, 1, 18, 1);
        for (const [a, c] of [[3, '#6a9a4a'], [9, '#8aae5a'], [15, '#5a8a50']]) { R('#c8a060', a + 1, 2, 1, 2); R(c, a, 4, 3, 5); R(shade(c, 0.25), a, 4, 1, 4); R(c, a - 1, 6, 1, 3); R(c, a + 3, 6, 1, 3); }
    });
    /* the parlour's upright piano (in place of its bookcase): candle sconces, music on the stand, a vase of roses on top */
    ART.td_piano = pic(32, 30, R => {
        R('#6e4226', 2, 4, 28, 24); R('#8a5634', 2, 4, 28, 2); R('#9a6644', 2, 4, 28, 1);
        R('#5a3420', 4, 7, 24, 7); for (let i = 6; i < 27; i += 4) R('#c8963a', i, 9, 1, 1);
        R('#fbf6ea', 11, 8, 10, 5); R('#c8bca0', 12, 9, 8, 1); R('#c8bca0', 12, 11, 8, 1);
        R('#fbf6ea', 3, 15, 26, 3); for (let i = 4; i < 28; i += 2) R('#d8d0c0', i, 17, 1, 1);
        for (const i of [5, 7, 11, 13, 15, 19, 21, 25]) R('#2a1f2d', i, 15, 1, 2);
        R('#4e2e1c', 2, 18, 28, 1); R('#7a4c30', 4, 20, 10, 6); R('#7a4c30', 18, 20, 10, 6); R('#5a3420', 5, 21, 8, 4); R('#5a3420', 19, 21, 8, 4);
        R('#e2b45a', 12, 27, 2, 1); R('#e2b45a', 18, 27, 2, 1);
        for (const s of [0, 29]) { R('#e2b45a', s, 9, 3, 1); R('#fbf6ea', s + 1, 6, 1, 3); R('#f7d64a', s + 1, 5, 1, 1); }
        R('#5fb7a8', 22, 1, 4, 3); R('#3c8a80', 24, 1, 2, 3); R('#c0303e', 21, 0, 2, 2); R('#e8604a', 24, 0, 2, 1); R('#c0303e', 26, 0, 1, 2);
    });
    /* the parlour's fire: a cream marble surround, the coals aglow behind a brass fender, a clock and candlesticks on the mantel */
    ART.td_fireplace = pic(34, 16, R => {
        R('#efe6d6', 0, 3, 34, 2); R('#fbf6ea', 0, 3, 34, 1); R('#cfc2a8', 0, 4, 34, 1);
        R('#e6dcc8', 2, 5, 30, 10); R('#fbf6ea', 2, 5, 1, 10); R('#cfc2a8', 31, 5, 1, 10);
        R('#2a1f2d', 9, 7, 16, 8); R('#3a2a30', 9, 7, 16, 2);
        R('#c0302e', 11, 11, 12, 3); R('#f39a3c', 12, 11, 10, 2); R('#f7d64a', 15, 11, 4, 1); R('#4a4454', 10, 14, 14, 1);
        R('#e2b45a', 9, 14, 16, 1);
        R('#6e4226', 14, 0, 6, 3); R('#fbf6ea', 15, 1, 4, 1); R('#2a1f2d', 17, 1, 1, 1);
        for (const c of [4, 29]) { R('#e2b45a', c, 2, 1, 1); R('#fbf6ea', c, 0, 1, 2); }
    });
    /* a tall gilt mirror */
    ART.td_mirror = pic(14, 15, R => { gilt(R, 1, 1, 12, 13); R('#c8d8e0', 3, 3, 8, 9); R('#e8f2f6', 4, 4, 2, 2); R('#e8f2f6', 6, 6, 1, 1); R('#a8bcc8', 8, 9, 3, 3); });
    /* a potted palm, and a fern in a glazed pot (for the conservatory, and the parlour's corner) */
    ART.td_palm = pic(22, 30, R => {
        R('#efe6d6', 7, 22, 8, 7); R('#fbf6ea', 7, 22, 2, 6); R('#3c8a80', 7, 24, 8, 1); R('#cfc2a8', 13, 22, 2, 7); R('#e6dcc8', 6, 21, 10, 2);
        R('#6b4128', 10, 12, 2, 10);
        const frond = (pts, c) => { for (const [a, b] of pts) R(c, a, b, 2, 2); };
        frond([[10, 12], [8, 10], [6, 9], [4, 9], [2, 10], [1, 12]], '#4fa84a'); frond([[12, 12], [14, 10], [16, 9], [18, 9], [19, 11], [20, 13]], '#4fa84a');
        frond([[10, 11], [9, 8], [8, 5], [7, 3], [6, 2]], '#8ad87a'); frond([[12, 11], [13, 8], [15, 5], [16, 3]], '#4fa84a');
        frond([[11, 11], [11, 7], [11, 4], [12, 1]], '#8ad87a'); frond([[10, 13], [7, 14], [4, 15], [2, 17]], '#2e7a43'); frond([[12, 13], [15, 14], [18, 16], [19, 18]], '#2e7a43');
    });
    ART.td_fernpot = pic(20, 24, R => {
        R('#3c8a80', 6, 16, 8, 7); R('#5fb7a8', 6, 16, 2, 6); R('#2e6a62', 12, 16, 2, 7); R('#4fa89c', 5, 15, 10, 2);
        for (let k = 0; k < 7; k++) { const a = -1.3 + k * 0.43, len = 7 + (k % 2) * 2; for (let s = 1; s <= len; s++) R(s < 4 ? '#4fa84a' : k < 3 ? '#8ad87a' : '#4fa84a', 10 + Math.round(Math.sin(a) * s), 15 - Math.round(Math.cos(a) * s * 0.9) + (s > 5 ? s - 5 : 0), 1, 1); }
        R('#2e7a43', 8, 13, 4, 2);
    });
    /* the linen presses (over the room's four cupboard blocks): folded linen stacked on top, two panelled doors, brass knobs */
    ART.td_press = pic(32, 32, R => {
        R('#142424', 0, 0, 32, 32); R('#8fa2ae', 1, 1, 30, 14); R('#a8bac4', 1, 1, 30, 1);
        for (const [a, c, n] of [[3, '#fbf6ea', 3], [12, '#c9b3f0', 2], [20, '#fbf6ea', 4]]) for (let k = 0; k < n; k++) { R(c, a, 12 - k * 3, 8, 3); R(shade(c, -0.15), a, 14 - k * 3, 8, 1); R('#ffffff', a, 12 - k * 3, 3, 1); }
        R('#768894', 1, 15, 30, 1); R('#9fb0bc', 1, 16, 30, 15); R('#b9c8d2', 1, 16, 30, 1);
        for (const d of [2, 17]) { R('#8496a4', d + 1, 18, 11, 11); R('#b9c8d2', d + 1, 28, 11, 1); R('#b9c8d2', d + 11, 18, 1, 11); R('#6e8090', d + 1, 18, 11, 1); }
        R('#768894', 15, 16, 2, 15); R('#e2b45a', 13, 23, 1, 2); R('#e2b45a', 18, 23, 1, 2); R('#5e6e80', 1, 30, 30, 1);
    }, false);
    /* Monday's wash, pegged out along the laundry wall: sheets, a teal shirt, an apron, crimson socks, a pillowcase */
    ART.td_washline = pic(122, 16, R => {
        for (let i = 1; i < 121; i++) R('#c8bca0', i, 2 + Math.round(Math.sin(i / 120 * Math.PI) * 2), 1, 1);
        const peg = a => R('#9a6438', a, 2 + Math.round(Math.sin(a / 120 * Math.PI) * 2), 1, 2);
        const hang = (a, w, h, c, fn) => { const y = 4 + Math.round(Math.sin((a + w / 2) / 120 * Math.PI) * 2); R(c, a, y, w, h); R(shade(c, 0.3), a, y, 2, h - 1); R(shade(c, -0.15), a + w - 1, y, 1, h); if (fn) fn(a, y); peg(a + 1); peg(a + w - 2); };
        hang(4, 22, 11, '#fbf6ea', (a, y) => { R('#e4ddd0', a + 6, y + 2, 1, 9); R('#e4ddd0', a + 14, y + 2, 1, 9); });
        hang(31, 13, 8, '#3fa99e', (a, y) => { R('#3fa99e', a - 2, y, 2, 4); R('#3fa99e', a + 13, y, 2, 4); R('#2e7e78', a + 6, y, 1, 8); R('#fbf6ea', a + 5, y, 3, 1); });
        hang(50, 9, 10, '#efe2c6', (a, y) => { R('#c0303e', a, y + 6, 9, 1); });
        hang(64, 4, 6, '#b8364a', (a, y) => R('#b8364a', a + 2, y + 5, 3, 2)); hang(71, 4, 6, '#b8364a', (a, y) => R('#b8364a', a + 2, y + 5, 3, 2));
        hang(80, 20, 11, '#dce8f0', (a, y) => { for (let i = 2; i < 20; i += 4) R('#a8c4dc', a + i, y, 1, 11); });
        hang(105, 12, 8, '#fbf6ea', (a, y) => R('#5fb7a8', a + 1, y + 6, 10, 1));
    });
    /* the laundry's mangle (in place of one of its tubs): an iron frame, two wooden rollers, the big wheel and its handle */
    ART.td_mangle = pic(22, 26, R => {
        R('#3a3440', 3, 4, 2, 19); R('#3a3440', 15, 4, 2, 19); R('#5e586a', 3, 4, 1, 19); R('#3a3440', 3, 3, 14, 2); R('#5e586a', 3, 3, 14, 1);
        R('#e6c08a', 5, 8, 10, 3); R('#fbf0d8', 5, 8, 10, 1); R('#c9925a', 5, 11, 10, 3); R('#9a6438', 5, 13, 10, 1);
        R('#fbf6ea', 6, 14, 8, 4); R('#e4ddd0', 6, 17, 8, 1);
        for (let a = 0; a < 24; a++) { const t = a / 24 * Math.PI * 2; R(a < 12 ? '#5e586a' : '#3a3440', 17 + Math.round(Math.cos(t) * 4), 10 + Math.round(Math.sin(t) * 4), 1, 1); }
        R('#4a4454', 17, 7, 1, 7); R('#4a4454', 14, 10, 7, 1); R('#9a6438', 20, 6, 1, 4); R('#c9925a', 20, 5, 2, 1);
        R('#6b4128', 2, 23, 16, 2); R('#9a6438', 2, 23, 16, 1);
    });
    /* a tall window hung with crimson, gathered in gold, under a gilt pelmet */
    ART.td_window = pic(26, 16, R => {
        R('#cfe9f4', 7, 3, 12, 12); R('#e8f6fc', 8, 4, 4, 3); R('#a8d4ec', 7, 11, 12, 4);
        R('#fbf6ea', 12, 3, 2, 12); R('#fbf6ea', 7, 8, 12, 1); R('#efe6d6', 6, 14, 14, 1);
        for (const [a, f] of [[1, 1], [19, -1]]) { R('#9a2a3a', a, 2, 6, 13); R('#c4485a', f > 0 ? a : a + 4, 2, 2, 13); R('#741c2a', f > 0 ? a + 5 : a, 2, 1, 13); R('#e8b04a', a, 9, 6, 1); }
        R('#d9a33a', 0, 0, 26, 3); R('#f2cc6a', 0, 0, 26, 1); R('#a6772a', 0, 2, 26, 1);
    });
    /* the round window in the attic's gable */
    ART.td_oculus = pic(14, 14, R => {
        for (let j = 0; j < 14; j++) for (let i = 0; i < 14; i++) { const d = Math.hypot(i - 6.5, j - 6.5); if (d < 6.6) R(d > 5 ? '#7a5a3c' : j < 6 ? '#cfe9f4' : '#a8d4ec', i, j, 1, 1); }
        R('#7a5a3c', 6, 1, 2, 12); R('#7a5a3c', 1, 6, 12, 2); R('#e8f6fc', 3, 3, 2, 2);
    });
    /* the Housekeeper's things, kept just so: two brooms, a mop, a feather duster, a pail on its hook */
    ART.td_brooms = pic(26, 16, R => {
        R('#8a5a36', 1, 1, 24, 2); R('#b07a4c', 1, 1, 24, 1);
        for (const a of [3, 8]) { R('#9a6438', a, 3, 1, 8); R('#e8c860', a - 2, 11, 5, 4); R('#c8a040', a - 2, 13, 5, 2); R('#3c8a80', a - 2, 11, 5, 1); }
        R('#9a6438', 13, 3, 1, 7); R('#d8d0c0', 11, 10, 5, 5); R('#b8b0a0', 12, 12, 1, 3); R('#b8b0a0', 14, 12, 1, 3);
        R('#6b4128', 18, 3, 1, 5); R('#c0303e', 16, 7, 5, 3); R('#e8604a', 16, 7, 2, 2); R('#c0303e', 17, 10, 3, 1);
        R('#9a9aa8', 21, 8, 4, 6); R('#c8c8d4', 21, 8, 1, 6); R('#6a6a78', 21, 8, 4, 1); R('#6a6a78', 22, 5, 2, 3);
    });
    /* the House's banner: teal cloth on a brass rod, a little house and its pail stitched in cream and crimson, a gold fringe */
    ART.td_banner = pic(40, 16, R => {
        R('#e2b45a', 0, 0, 40, 2); R('#b88a2a', 0, 1, 40, 1); R('#f7d64a', 0, 0, 2, 2); R('#f7d64a', 38, 0, 2, 2);
        R('#3c8a80', 3, 2, 34, 12); R('#5fb7a8', 4, 3, 32, 10); R('#efe6d6', 4, 3, 32, 1); R('#efe6d6', 4, 12, 32, 1);
        R('#c0303e', 14, 5, 10, 2); R('#c0303e', 16, 4, 6, 1); R('#fbf6ea', 15, 7, 8, 5); R('#3c8a80', 18, 9, 2, 3);
        R('#e2b45a', 26, 9, 4, 3); R('#b88a2a', 27, 8, 2, 1);
        for (let i = 3; i < 37; i += 2) R('#e8b04a', i, 14, 1, 2);
    });
    /* the library's rug: deep teal, a cream border, a crimson medallion, fringed ends (laid flat) */
    ART.td_rug = pic(144, 56, (R, x) => {
        R('#1f5d63', 4, 0, 136, 56); R('#efe6d6', 7, 3, 130, 50); R('#2e7e78', 9, 5, 126, 46); R('#3c8a80', 13, 9, 118, 38);
        for (let i = 13; i < 131; i += 6) { R('#e0b050', i + 2, 7, 2, 1); R('#e0b050', i + 2, 48, 2, 1); }
        for (let j = -14; j <= 14; j++) { const w = Math.round((14 - Math.abs(j)) * 2.6); R(Math.abs(j) > 11 ? '#e0b050' : '#9a3a4a', 72 - w, 28 + j, w * 2, 1); }
        R('#c45a6a', 64, 26, 16, 4); R('#e0b050', 70, 27, 4, 2);
        for (let j = 2; j < 54; j += 2) { R('#efe6d6', 0, j, 4, 1); R('#efe6d6', 140, j, 4, 1); }
    }, false);
    /* the library's reading tables (in place of its plain ones): a green-shaded lamp, a book open, an inkpot */
    ART.td_readtable = pic(32, 20, R => {
        R('#8a5634', 1, 5, 30, 8); R('#a8744a', 1, 5, 30, 2); R('#6e4226', 1, 12, 30, 2); R('#4e2e1c', 3, 14, 3, 6); R('#4e2e1c', 26, 14, 3, 6);
        R('#e2b45a', 22, 3, 1, 3); R('#3c8a80', 19, 0, 7, 3); R('#5fb7a8', 19, 0, 3, 1); R('#fff4c0', 20, 3, 5, 1);
        R('#fbf6ea', 6, 5, 10, 4); R('#c8bca0', 10, 5, 2, 4); R('#9a9188', 7, 6, 2, 1); R('#9a9188', 13, 7, 2, 1);
        R('#2a2834', 27, 6, 2, 2); R('#fbf6ea', 28, 3, 1, 3);
    });
}
CONTENT_INIT.push(initTidyLook);
