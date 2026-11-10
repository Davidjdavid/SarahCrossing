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
                { k: 'deco', x: 15, y: 1, look: 'stove', solid: [[0, 0], [1, 0]], ox: 0, oy: -14 },
                { k: 'deco', x: 2, y: 7, look: 'table', solid: [[0, 0], [1, 0]] },
                { k: 'pie', x: 3, y: 7 },
                { k: 'deco', x: 9, y: 9, look: 'barrel' }, { k: 'deco', x: 17, y: 9, look: 'barrel' },
            ],
            nudge: { solved: 'kc', at: [4, 1], say: 'A pot on the shelf wobbles, as if it would like to be thrown.' },
        },
        /* ---------------- 3 Gallery ---------------- */
        '2,3': {
            name: 'Gallery',
            rows: [
                '####################',
                '#.......#.#........#',
                '#.......#.#........#',
                '#.......#.#........#',
                '#...#####.######.###',
                '...........#.......#',
                '#.........##.......#',
                '#..................#',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'wood', x: 8, y: 5, id: 'galBlock' },
                { k: 'bust', x: 9, y: 5, id: 'galBust' },
                { k: 'plate', x: 10, y: 5, sig: 'g1' },
                { k: 'door', x: 16, y: 4, type: 'gate', when: 'g1', passed: 'up', id: 'gG' },
                { k: 'chest', x: 16, y: 1, item: 'plan', id: 'gPlan' },
                { k: 'deco', x: 2, y: 1, look: 'painting', solid: false, oy: -12, baseY: -100 },
                { k: 'deco', x: 5, y: 1, look: 'painting2', solid: false, oy: -12, baseY: -100 },
                { k: 'enemy', x: 5, y: 8, type: 'dustbunny' },
                { k: 'pot', x: 17, y: 9, style: 'pot_teal' },
            ],
            nudge: { solved: 'g1', thing: 'galBust', say: 'The bust looks very pleased with its spot. Nothing gets past it once it is home.' },
        },
        /* ---------------- 4 Hall of Busts ---------------- */
        '1,2': {
            name: 'Hall of Busts',
            rows: [
                '###.################',
                '#..................#',
                '#..................#',
                '########...........#',
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
                { k: 'wood', x: 8, y: 4, id: 'hallBlock' },
                { k: 'bust', x: 2, y: 8 }, { k: 'bust', x: 17, y: 8 },
                { k: 'door', x: 3, y: 0, type: 'gate', when: 'hb', passed: 'up', id: 'hN' },
                { k: 'door', x: 19, y: 5, type: 'lock', dir: 'v', id: 'hE' },
                { k: 'enemy', x: 15, y: 2, type: 'nibbler' },
            ],
            nudge: { solved: 'hb', after: 60 * 60 * 4, thing: 'hallBust', say: 'The bust in the middle looks restless. It would knock anything out of its way, going home.' },
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
                { k: 'deco', x: 2, y: 1, look: 'shelf', solid: [[0, 0], [1, 0]], ox: 0, oy: -14 },
                { k: 'deco', x: 9, y: 9, look: 'barrel' }, { k: 'deco', x: 1, y: 9, look: 'barrel' },
                { k: 'sign', x: 7, y: 3, text: 'Tins, jars, sacks. Everything labelled. One shelf is labelled THROWING CRATES.' },
            ],
            nudge: { solved: 'tidy_pKey', at: [4, 5], say: "A crate creaks. The little island looks just about one good throw away." },
        },
        /* ---------------- 6 Parlor ---------------- */
        '2,2': {
            name: 'Parlor',
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
                { k: 'deco', x: 10, y: 1, look: 'shelf', solid: [[0, 0], [1, 0]], ox: 0, oy: -14 },
                { k: 'deco', x: 17, y: 8, look: 'plant' },
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
                { k: 'deco', x: 3, y: 8, look: 'plant' }, { k: 'deco', x: 8, y: 6, look: 'plant' }, { k: 'deco', x: 14, y: 8, look: 'plant' }, { k: 'deco', x: 17, y: 6, look: 'plant' },
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
                { k: 'deco', x: 3, y: 2, look: 'washtub' }, { k: 'deco', x: 5, y: 2, look: 'washtub' },
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
                { k: 'deco', x: 3, y: 5, look: 'table', solid: [[0, 0], [1, 0]] }, { k: 'deco', x: 13, y: 6, look: 'table', solid: [[0, 0], [1, 0]] },
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
    onEnter: a => TidyLogic.enter(a),
    afterKnot: function* () { yield* Tidy.afterKnot(); },
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
            if (ball.length && ball.every(b => Return.isHome(b) && !b.tiedOff)) { Progress.set('tidy_ballDone'); Sfx.play('appear'); }
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
    pr.live = true;
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
        Script.run(function* () { yield 60; yield* say(null, 'The Dust Monger bursts into a hundred dust bunnies, which all hop away under the furniture. Something glints in the middle of the floor.'); });
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
            Script.run(function* () { yield* say(null, 'A heap of fluff in the middle of the room shudders, stands up, and looks at you. It is a dust bunny the size of a sofa.'); yield* say(null, 'Your stick would just bounce off all that fluff. Something thrown might not...'); });
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
        Hazard.drop(e, p.x, p.y, { r: 20, dmg: 2, tell: e.flop.crouch + e.flop.air, shake: 8, col: '#b0a698' });
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
        this.lane = Hazard.tiles(this, tiles, { tell: this.tellN, dmg: 0, live: 0, col: '#e8463c' });
    }
    rear(phase) {
        this.tellN = tellFor(1, phase); this.setState('rear'); Stats.count('boss:tidy:stamp');
        Hazard.ring(this, this.x, this.y + 2, HK.stamp, { tell: this.tellN, dmg: 1, col: '#3fc1b5', shake: 8 });
    }
    aimHanger(p) {
        this.tellN = tellFor(1, 3); this.setState('aimH'); Sfx.play('twang');
        this.hangerPath = Flung.line(this.area, [this.homeX, this.homeY], [p.tx, p.ty], HK.hanger);
        Hazard.tiles(this, this.hangerPath.slice(1), { tell: this.tellN, dmg: 0, live: 0, col: '#c9925a', quiet: true });
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
        Script.run(Tidy.bossDown(this));
    }
    updateYarn() { this.yarnT++; }
    draw(cx, cy) {
        if (!this.alive) {
            if (this.yarnT < 120) { const k = 1 - this.yarnT / 120; Gfx.circle(this.x - cx, this.y - cy - 4, Math.round(8 * k), THREAD.ives); Gfx.rect(this.x - cx - 1, this.y - cy, 2, 4, '#1a1018'); }
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
    *bossDown(k) {
        const a = k.area;
        G.boss = null;
        Music.play('silence');
        yield 30;
        yield* say(null, 'The Housekeeper shudders, unravels into a heap of teal yarn, and the yarn runs away across the floor and down a little hole you had not noticed, like water down a drain.');
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
        yield* say(null, 'A door opens in the far wall of the Grand Hall, letting in daylight and the smell of grass.');
        const a = G.map, r = a.rooms.find(r => r.key === '1,0');
        a.add(new Warp(r.x + 17, r.y + 9, { to: 'hollow', tx2: TIDY_OUT.x, ty2: TIDY_OUT.y, face: 'down' }));
        a.add(new Prop(r.x + 17, r.y + 9, { im: ART.exitlight, solid: [] }));
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
ITEM_LINES.plan = () => `You found the {blue}House plan{/}! Every room of ${G.map && G.map.def.name ? G.map.def.name.replace(/^The /, 'the ') : 'the House'}, drawn in a neat hand. (Open the map with [map].)`;
ITEM_LINES.pattern = () => `You found the {blue}Pattern{/}! A square of ${(PATTERN_CLOTH[G.map && G.map.def.house] || ['teal'])[0]} cloth stitched in a pattern like a lock's insides. The big door in this House is stitched to match.`;
ITEM_LINES.gloves = () => 'You found the {red}Gloves{/}! Hold [act] against something to grip it: while you hold on, it stays put. Step back while gripping to pull it.';
ITEM_LINES.heartstitch = () => 'A {red}Heartstitch{/}! Your hearts grow by one.';
ITEM_LINES.key = () => 'A {blue}small key{/}! It opens one locked door in this House.';
ITEM_LINES.heartpatch = () => 'A {red}Heart Patch{/}! ' + (Inv.patches % 4 === 0 ? '' : `(${Inv.patches % 4} of 4.)`);
ITEM_AFTER.gloves = function* () { Progress.set('gotGloves'); };
