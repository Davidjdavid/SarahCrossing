/* House 6: the Marionette Hall, at Larkspur Fair. Jory's House, crimson threads. A theatre with nobody in the
   seats. Remote bodies: toy soldiers that march till they meet something and turn (shape their beat and they
   press plates for you); painted flats that look like walls until a knock shows the cardboard; and, from
   Captain Tin, the Crossbar: puppets walked from a distance, through little holes, over nails, three at once
   on a rack. Old rules join in: strays stay where they're pushed, the Bedroll gets you home from under the
   stage; up in the fly tower a puppet rung home lights its way at a run, and in the trap room a puppet stepped
   off its stand leaves a mark for the Hookline to catch. The Great Marionette in three acts: walk your puppets
   round its feet till the strings tangle; put a puppet in its march so it turns onto the stage trap; then take
   up its own strings and walk it in yourself. And the curtain falls on whoever was working it. (Reveal 1.) */

THEMES.marionette = { floor: ['#c8a878', '#a07e52', '#e0c494', '#76583a'], wall: ['#9a1e36', '#6a1426', '#c42b4a', '#3a0a16'], stone: ['#9a8a7a', '#7a6a5a', '#bcae9e', '#4e4238'], water: ['#5fb5e8', '#3f8fd8', '#a5dcf7', '#2b5aa8'], dark: '#1a0a10' };
FLOORS.marionette = {
    /* stage boards: laid up and down the stage the way a real stage's are, each lit down one edge, a butt joint here and
       there with a nail head either side of it (not the plain planks of the mills and works) */
    floor: (x, th, v) => {
        const B = ['#c8a070', '#a87e4c', '#dcb886', '#6e4e2e'], D = '#bc9464';
        for (let i = 0; i < 2; i++) {
            const o = i * 8;
            fill(x, (i + v) % 2 ? D : B[0], o, 0, 8, 16); fill(x, B[2], o, 0, 1, 16); fill(x, B[3], o + 7, 0, 1, 16);
            for (let n = 0; n < 2; n++) { const g = Math.floor(hash2(i * 3 + n, v, 59) * 14) + 1, gx = o + 2 + Math.floor(hash2(n, i + v, 60) * 4); fill(x, B[1], gx, g, 1, 2); }
            if (hash2(v, i, 58) < 0.5) {
                const j = Math.floor(hash2(i, v, 57) * 11) + 3;
                fill(x, B[3], o + 1, j, 6, 1); fill(x, B[2], o + 1, j + 1, 6, 1);
                px(x, o + 2, j - 2, '#4a3424'); px(x, o + 5, j + 3, '#4a3424');
            }
        }
        speckle(x, [B[1]], 92 + v, 0.02);
    },
    /* red carpet with a gold edge, the dark of the wings */
    floor2: (x, th, v) => { fill(x, '#a8203a'); speckle(x, ['#b8304a', '#982038'], 50 + v, 0.3); fill(x, '#f7d64a', 0, 0, 16, 1); },
    floor3: (x, th, v) => { fill(x, '#3a2a30'); speckle(x, ['#4a3a40', '#2a1a20'], 30 + v, 0.3); },
    /* a catwalk high in the fly tower: slats laid across the dark, an iron strap along each side */
    catwalk: (x, th, v) => {
        fill(x, '#1a1018');
        for (let j = 0; j < 16; j += 4) { fill(x, '#9a7448', 0, j, 16, 3); fill(x, '#c09060', 0, j, 16, 1); px(x, Math.floor(hash2(j, v, 61) * 14) + 1, j + 1, '#7a5634'); }
        fill(x, '#4a4450', 0, 0, 1, 16); fill(x, '#4a4450', 15, 0, 1, 16);
        for (let j = 2; j < 16; j += 6) { px(x, 0, j, '#8a8496'); px(x, 15, j, '#8a8496'); }
    },
    /* an open trapdoor: the dark under the stage, and the lid hanging down into it from its hinges */
    trap: (x, th, v) => {
        fill(x, '#120c14'); speckle(x, ['#21162a'], 81 + v, 0.07);
        fill(x, '#6e4e2e', 0, 0, 16, 1); fill(x, '#6e4e2e', 0, 15, 16, 1); fill(x, '#6e4e2e', 0, 0, 1, 16); fill(x, '#6e4e2e', 15, 0, 1, 16);
        fill(x, '#8a6440', 1, 1, 14, 4); fill(x, '#c8a070', 1, 1, 14, 1); fill(x, '#a07a4a', 1, 3, 14, 1); fill(x, '#3a2418', 1, 5, 14, 1);
        px(x, 3, 2, '#2a1f2d'); px(x, 12, 2, '#2a1f2d'); px(x, 4, 2, '#8a8496'); px(x, 11, 2, '#8a8496');
        x.globalAlpha = 0.35; fill(x, '#000000', 1, 6, 14, 2); x.globalAlpha = 1;
    },
};
WALLS.marionette = {
    edge: '#1a0a10',
    top: (x) => { fill(x, '#3a0a16'); speckle(x, ['#5a1426'], 8, 0.15); },
    face: (x, th, v) => {
        fill(x, '#9a1e36'); for (let i = 0; i < 16; i += 4) fill(x, '#7a1428', i, 0, 1, 12);
        fill(x, '#f7d64a', 0, 12, 16, 1); fill(x, '#c8a070', 0, 13, 16, 2); fill(x, '#1a0a10', 0, 15, 16, 1);
    },
};

const MARIONETTE_OUT = { x: 31, y: 40 + 10 };     /* the doors out, onto the fair */

defHouse({
    id: 'marionette', name: 'The Marionette Hall', place: 'The Marionette Hall', house: 'marionette', theme: 'marionette', thread: THREAD.jory, music: 'marionette',
    knotName: 'Dancing Knot',
    entry: MARIONETTE_ENTRY,
    legend: { 'O': { k: 'crawl', p: 'wall', ent: 'crawlhole' }, ';': { k: 'floor', p: 'floor2' }, 'T': { k: 'pit', p: 'trap' }, 'c': { k: 'floor', p: 'catwalk' } },
    cells: {
        /* ---------------- 1 The Foyer: toy soldiers on parade; a wall that's only a painted flat ---------------- */
        '1,3': {
            name: 'The Foyer',
            rows: [
                '#########.##########',
                '#........;.........#',
                '#........;.........#',
                '#........;.........#',
                '#........;.........#',
                '#........;..........',
                '#........;.........#',
                '#........;.........#',
                '#........;.........#',
                '#........;.........#',
                '#########.##########',
            ],
            ents: [
                { k: 'flat', x: 19, y: 5, id: 'foFlat', look: 'flat_red' },
                { k: 'soldier', x: 3, y: 3, facing: 'right', id: 'foSol1' }, { k: 'soldier', x: 16, y: 7, facing: 'left', id: 'foSol2' },
                { k: 'warp', x: 9, y: 10, to: 'hollow', tx2: MARIONETTE_OUT.x, ty2: MARIONETTE_OUT.y, dir: 'down', face: 'down' },
                { k: 'sign', x: 11, y: 9, text: "THE MARIONETTE HALL. Tonight: THE WANDERER. (Toy soldiers march till they meet something, then about turn. Don't be the something.)" },
                { k: 'deco', x: 2, y: 9, look: 'poster', solid: [[0, 0]], oy: -14, text: 'A poster: a girl with a stick, painted in bright colours, standing on a stage. Underneath: STARRING YOU.' },
            ],
            nudge: { solved: () => Progress.areaFlag('marionette', 'visited:boxoffice'), after: 60 * 60 * 3, at: [19, 5], say: "The east wall of the foyer is a slightly different red from the rest, and it isn't quite straight. As if it were only painted on something." },
        },
        /* ---------------- 2 The Box Office (behind the flat): the Plan ---------------- */
        '2,3': {
            name: 'The Box Office',
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
                { k: 'chest', x: 10, y: 3, item: 'plan', id: 'boPlan' },
                { k: 'deco', x: 6, y: 6, look: 'booth', solid: [[0, 0], [1, 0]], oy: -12, text: 'The ticket booth. A ledger lies open: "THE WANDERER. Cast: one. Crew: six. Audience: the crew." Six names, rubbed out.' },
                { k: 'deco', x: 15, y: 2, look: 'poster', solid: [[0, 0]], oy: -14, text: "Old playbills, years and years of them. THE WANDERER. THE WANDERER. THE WANDERER. Every one a different face. One, a girl with green ribbons, has a moustache drawn on." },
            ],
        },
        /* ---------------- 3 The Auditorium (hub): rows of empty seats ---------------- */
        '1,2': {
            name: 'The Auditorium',
            rows: [
                '#########.##########',
                '#........;.........#',
                '#..................#',
                '#........;.........#',
                '#........;.........#',
                '.........;..........',
                '#........;.........#',
                '#........;.........#',
                '#........;.........#',
                '#........;.........#',
                '#########.##########',
            ],
            ents: [
                { k: 'door', x: 9, y: 0, type: 'lock', id: 'auLockN' },
                { k: 'door', x: 19, y: 5, type: 'lock', id: 'auLockE', dir: 'v' },
                { k: 'deco', x: 2, y: 3, look: 'seats', solid: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]], text: 'Plush red seats. Nobody in them. There is a small dent in one, about the size of a grandmother.' },
                { k: 'deco', x: 11, y: 3, look: 'seats', solid: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]] },
                { k: 'deco', x: 2, y: 7, look: 'seats', solid: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]] },
                { k: 'deco', x: 11, y: 7, look: 'seats', solid: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]] },
                { k: 'soldier', x: 9, y: 2, facing: 'right', id: 'auSol' },
                { k: 'sign', x: 17, y: 9, text: 'THE AUDITORIUM. Please do not talk during the performance. (There is no one to talk to.)' },
            ],
        },
        /* ---------------- 4 The Orchestra Pit: give the soldier a new beat across the plate (key A) ---------------- */
        '0,2': {
            name: 'The Orchestra Pit',
            rows: [
                '####################',
                '#...#..............#',
                '#...#..............#',
                '##.##..............#',
                '#..................#',
                '#...................',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'door', x: 2, y: 3, type: 'gate', when: 'opp', id: 'opGate', passed: 'up' },
                { k: 'chest', x: 2, y: 1, item: 'key', id: 'opKey' },
                { k: 'plate', x: 9, y: 6, sig: 'opp', mode: 'pulse', time: 80 },
                { k: 'soldier', x: 5, y: 9, facing: 'right', turn: 'right', id: 'opSol' },
                { k: 'block', x: 10, y: 2, id: 'opBlock', marked: false },
                { k: 'deco', x: 14, y: 6, look: 'drum', solid: [[0, 0]], text: 'A big drum. Somebody has painted on it: PLAYED BY B.' },
                { k: 'sign', x: 17, y: 1, text: "THE ORCHESTRA PIT. Our drummer marches round and round the edge, turning right at every wall. He has never once crossed the middle. (The gate by the music stands keeps time with the drum-plate.)" },
            ],
            nudge: { solved: 'marionette_chest:opKey', after: 60 * 60 * 3, thing: 'opBlock', say: 'The drummer turns right at anything in his way, not only walls. Put something in his way, see where he goes instead, and be waiting at the gate when he crosses the plate.' },
        },
        /* ---------------- 5 Rehearsal Room: down the trapdoor for the key, home by the Bedroll (key B); S13 the Wren puppet;
           in its east wall, the way back from the trap room (shut till the House's Pattern has been found) ---------------- */
        '2,2': {
            name: 'The Rehearsal Room',
            rows: [
                '####################',
                '#..................#',
                '#..........#.......#',
                '#..........#.......#',
                '#..........#.......#',
                '...........#.......#',
                '#vvvvvvvvvv#.......#',
                '#..........#.......#',
                '#..........#........',
                '#........o.#.......#',
                '####################',
            ],
            ents: [
                { k: 'chest', x: 5, y: 8, item: 'key', id: 'rhKey' },
                { k: 'deco', x: 2, y: 9, look: 'prompter', solid: [[0, 0]], oy: -6, text: "The prompter's box, under the stage. A script lies open: THE WANDERER, ACT ONE. Every line you've said today is in it. Some you haven't said yet." },
                /* the stage set: the Tidyhouse's foyer in miniature, and a little wooden you (S13, with the Crossbar) */
                { k: 'rack', x: 15, y: 9, group: 'wren', id: 'rhRack' },
                { k: 'puppet', x: 13, y: 7, id: 'wrenPuppet', look: 'puppet_wren', group: 'wren' },
                { k: 'deco', x: 14, y: 2, look: 'set_tidy', solid: [[0, 0], [1, 0], [2, 0], [3, 0]], oy: -8, text: 'A stage set, built small: a grand foyer, a staircase, a portrait of a woman with a feather duster. You have been here. You have been here this week.' },
                { k: 'plate', x: 16, y: 4, sig: 'rhSet', puppetOnly: true },
                { k: 'chest', x: 17, y: 6, item: 'heartpatch', id: 'rhPatch', hidden: true, when: 'flag:s13' },
                { k: 'door', x: 19, y: 8, type: 'gate', when: 'mhPattern', keep: true, id: 'rhGateE', dir: 'v' },
                { k: 'sign', x: 8, y: 1, text: "THE REHEARSAL ROOM. Mind the trapdoor. (There is no ladder. There has never been a ladder. Stagehands come up the hard way.)" },
            ],
            nudge: { solved: 'marionette_chest:rhKey', after: 60 * 60 * 3, at: [5, 5], say: "Under the stage there's no way back up. Unless you'd left somewhere to come home to." },
        },
        /* ---------------- 6 The Wings (mini-boss): Captain Tin marches; knock the flat and he marches on, down a trapdoor (the Crossbar) ---------------- */
        '1,1': {
            name: 'The Wings',
            rows: [
                '#########.##########',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '....................',
                '#.o..............o.#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#########.##########',
            ],
            ents: [
                { k: 'door', x: 9, y: 0, type: 'big', id: 'wiBig' },
                { k: 'door', x: 19, y: 5, type: 'gate', when: 'flag:marionette_tin', keep: true, id: 'wiLockE', dir: 'v' },
                { k: 'shutter', x: 9, y: 10, dir: 'h', group: 'tin' }, { k: 'shutter', x: 0, y: 5, dir: 'v', group: 'tin' }, { k: 'shutter', x: 19, y: 5, dir: 'v', group: 'tin' },
                { k: 'flat', x: 4, y: 6, id: 'wiFlatW', look: 'flat_red', respring: true }, { k: 'flat', x: 15, y: 6, id: 'wiFlatE', look: 'flat_red', respring: true },
                { k: 'captain', x: 9, y: 6, id: 'tin' },
                { k: 'chest', x: 9, y: 3, item: 'crossbar', id: 'wiCrossbar', hidden: true, when: 'flag:marionette_tin', big: true },
            ],
        },
        /* ---------------- 7 The Dressing Rooms: a puppet through the holes, over the nails, onto the plate (key C) ---------------- */
        '0,1': {
            name: 'The Dressing Rooms',
            rows: [
                '####################',
                '#...#....^^....#...#',
                '#...O....^^....O...#',
                '#...#....^^....#...#',
                '##O#################',
                '#...................',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'puppet', x: 2, y: 7, id: 'drPuppet' },
                { k: 'plate', x: 17, y: 2, sig: 'drp' },
                { k: 'chest', x: 10, y: 7, item: 'key', id: 'drKey', hidden: true, when: 'drp' },
                { k: 'deco', x: 8, y: 9, look: 'mirror', solid: [[0, 0]], oy: -12, text: 'A dressing-room mirror ringed with bulbs. Stuck in the frame: a sketch of the Kilnwyrm costume, with notes. "Tail: TOO FLOPPY. -J."' },
                { k: 'sign', x: 17, y: 9, text: 'THE DRESSING ROOMS. The little doors are for the little people.' },
            ],
            nudge: { solved: 'marionette_chest:drKey', after: 60 * 60 * 3, thing: 'drPuppet', say: 'The holes in the walls are puppet-sized. The puppet is right there.' },
        },
        /* ---------------- 8 The Prop Store: three puppets on one rack; the shelves stop the ones in front; three plates open the way
           east, up into the fly tower ---------------- */
        '2,1': {
            name: 'The Prop Store',
            rows: [
                '##O##############.##',
                '#...###########....#',
                '#...#...#.....#....#',
                '#...#.........#....#',
                '#...#.....#...#....#',
                '....#.........#.....',
                '#...#.........#....#',
                '#...###########....#',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'door', x: 17, y: 0, type: 'gate', when: 'wsp', id: 'psWorkshop', keep: true },
                { k: 'door', x: 19, y: 5, type: 'gate', when: 'pp1&pp2&pp3', keep: true, id: 'psGateE', dir: 'v' },
                { k: 'rack', x: 9, y: 8, group: 'trio', id: 'psRack', hookable: false },
                { k: 'puppet', x: 5, y: 2, id: 'psA', group: 'trio' }, { k: 'puppet', x: 5, y: 4, id: 'psB', group: 'trio' }, { k: 'puppet', x: 5, y: 6, id: 'psC', group: 'trio' },
                { k: 'plate', x: 7, y: 6, sig: 'pp1' }, { k: 'plate', x: 9, y: 6, sig: 'pp2' }, { k: 'plate', x: 13, y: 6, sig: 'pp3' },
                { k: 'puppet', x: 2, y: 3, id: 'psLone' },
                { k: 'sign', x: 18, y: 9, text: 'THE PROP STORE. Three understudies on one string. They do everything together. Everything.' },
            ],
            nudge: { solved: 'marionette_psGateE', after: 60 * 60 * 4, at: [9, 8], say: 'The three puppets step together, but a shelf stops one and not the others. That is the whole trick: let the shelves hold some back.' },
        },
        /* ---------------- 9 Jory's Workshop (signature): a puppet through the little door opens the big one ---------------- */
        '2,0': {
            name: "Jory's Workshop",
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
                '##O##############.##',
            ],
            ents: [
                { k: 'plate', x: 2, y: 8, sig: 'wsp' },
                { k: 'signature', x: 10, y: 5, house: 'marionette' },
                { k: 'deco', x: 5, y: 2, look: 'workbench', solid: [[0, 0], [1, 0]], oy: -6, text: "Jory's bench: chisels, paint, a half-carved wooden face that looks a bit like Gran. A label: FOR THE LAST ACT. (NOT YET.)" },
                { k: 'deco', x: 14, y: 2, look: 'puppets_hung', solid: [[0, 0], [1, 0], [2, 0]], oy: -14, text: 'Puppets hanging on a rail: a Housekeeper, a wyrm in three pieces, a mill-beast, a gargoyle, a sloth in a nightcap. Every one you have met.' },
                { k: 'chest', x: 16, y: 5, item: 'b50', id: 'wsButtons' },
            ],
        },
        /* ---------------- 10 The Great Stage (boss) ---------------- */
        '1,0': {
            name: 'The Great Stage',
            rows: [
                '####################',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#;;;;;;;;;;;;;;;;;;#',
                '#;;;;;;;;;;;;;;;;;;#',
                '#########.##########',
            ],
            ents: [
                { k: 'marionette', x: 9, y: 3, id: 'greatMarionette' },
                { k: 'stagetrap', x: 11, y: 6, id: 'gsTrap' },
                { k: 'rack', x: 9, y: 8, group: 'boss', id: 'gsRack', hookable: false },
                { k: 'puppet', x: 3, y: 6, id: 'gsWrenA', look: 'puppet_wren', group: 'boss' }, { k: 'puppet', x: 9, y: 6, id: 'gsWrenB', look: 'puppet_wren', group: 'boss' },
                { k: 'shutter', x: 9, y: 10, dir: 'h', group: 'boss' },
                /* the show: ropes and sandbags tied off up the side walls, footlights along the front of the stage */
                { k: 'deco', x: 0, y: 1, look: 'rigging', solid: [], ox: 1, oy: -6, baseY: 4 },
                { k: 'deco', x: 19, y: 1, look: 'rigging', solid: [], ox: 1, oy: -6, baseY: 4, flip: true },
                { k: 'deco', x: 1, y: 10, look: 'footlights8', solid: [], ox: 0, oy: -4, baseY: -200 },
                { k: 'deco', x: 10, y: 10, look: 'footlights9', solid: [], ox: 0, oy: -4, baseY: -200 },
            ],
            nudge: {
                solved: 'reveal1', after: 60 * 60 * 3, at: [9, 5],
                /* (whatever act it's in when the nudge comes) */
                get say() { return MarionetteHall.stageNudge(); },
            },
        },
        /* ---------------- 11 The Fly Tower: a catwalk round the fly well; three plates that spring back in a blink; a puppet rung
           home along its own trace lights them all at once (the Bell) ---------------- */
        '3,1': {
            name: 'The Fly Tower',
            rows: [
                '####################',
                '#..................#',
                '#...#######........#',
                '#...#ccccc#........#',
                '#...#coooc#........#',
                '....#coooc#........#',
                '#...#coooc#........#',
                '#...#ccccc#........#',
                '#...#######........#',
                '#..................#',
                '##############.#####',
            ],
            ents: [
                { k: 'rack', x: 3, y: 5, group: 'fly', id: 'faRack', hookable: false },
                { k: 'puppet', x: 5, y: 5, id: 'faPuppet', group: 'fly' },
                { k: 'plate', x: 7, y: 3, sig: 'fa1', mode: 'timed', time: 36 }, { k: 'plate', x: 9, y: 5, sig: 'fa2', mode: 'timed', time: 36 }, { k: 'plate', x: 7, y: 7, sig: 'fa3', mode: 'timed', time: 36 },
                { k: 'door', x: 14, y: 10, type: 'gate', when: 'fa1&fa2&fa3', keep: true, id: 'faGate' },
                { k: 'deco', x: 19, y: 1, look: 'pinrail', solid: [], ox: 2, oy: -6, baseY: 4, flip: true },
                { k: 'deco', x: 17, y: 2, look: 'sandbags', solid: [[0, 0], [1, 0]] },
                { k: 'deco', x: 12, y: 8, look: 'sandbags', solid: [[0, 0], [1, 0]] },
                { k: 'sign', x: 16, y: 9, text: "THE FLY TOWER. The fly door opens while all three plates on the catwalk are down at once. They spring back up in a blink. Please don't lean on the rail." },
            ],
            nudge: { solved: 'marionette_faGate', after: 60 * 60 * 3, thing: 'faPuppet', say: "Walked round, the puppet only ever has a foot on one plate. Its way home runs over all three. If only it came home a good deal quicker than it walks." },
        },
        /* ---------------- 12 The Trap Room: every trapdoor in the stage propped open; the understudies' stands across the way are
           marks, and an empty mark is something for the Hookline to catch on (the Pattern) ---------------- */
        '3,2': {
            name: 'The Trap Room',
            rows: [
                '##############.#####',
                '#..................#',
                '#..................#',
                '#TTTTTTTTTTTTTTTTTT#',
                '#TTTTTTTTTTTTTTTTTT#',
                '#TTTTTTT...TTTTTTTT#',
                '#TTTTTTTTTTTTTTTTTT#',
                '#TTTTTTTTTTTTTTTTTT#',
                '...................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'rack', x: 10, y: 2, group: 'trap', id: 'trRack', hookable: false },
                { k: 'puppet', x: 9, y: 5, id: 'trP1', group: 'trap' }, { k: 'puppet', x: 10, y: 8, id: 'trP2', group: 'trap' },
                { k: 'mhpattern', x: 14, y: 9, id: 'trPattern', big: true },
                { k: 'deco', x: 2, y: 2, look: 'trapwinch', solid: [[0, 0], [1, 0]], text: 'The winch that works the traps, chained off. A label: OILING. DO NOT WIND. -J.' },
                { k: 'deco', x: 16, y: 9, look: 'sandbags', solid: [[0, 0], [1, 0]] },
                { k: 'sign', x: 17, y: 2, text: 'THE TRAP ROOM. Every trapdoor in the stage, propped open for oiling. Mind your feet. The understudies wait on their marks across the way.' },
            ],
            nudge: { solved: () => Inv.hasPattern('marionette'), after: 60 * 60 * 3, at: [9, 5], say: "The Hookline bounces off a puppet. But a puppet's stand is a mark like any other, and an empty mark is something to catch on." },
        },
    },
    tick: a => MarionetteHall.tick(a),
    afterKnot: function* () { yield* MarionetteHall.afterKnot(); },
});

const MarionetteHall = {
    tick(a) {
        const r = Cam.room;
        if (r && r.key === '2,3') Progress.setAreaFlag('marionette', 'visited:boxoffice');
        /* the way back from the trap room into the rehearsal room is bolted on the far side till the Pattern's been found */
        if (Inv.hasPattern('marionette')) Signals.set(a, 'mhPattern');
        /* S13: the little wooden Wren walked onto the set's mark */
        if (Signals.get(a, 'rhSet') && !Progress.flag('s13')) {
            Progress.set('s13'); Stats.count('secret:wrenpuppet');
            Sfx.play('appear');
            G.pendingToast = 'The little wooden you takes a bow on the miniature foyer. From somewhere above, very faintly, one pair of hands claps.';
        }
    },
    /* the Great Stage's nudge, for whichever act it's in */
    stageNudge() {
        const g = G.map && G.map.ents.find(e => e.type === 'greatmarionette' && e.alive);
        const act = g ? g.act : 1;
        if (act === 2) return "It marches like any toy soldier, and turns at anything in its way. The trap at centre stage gives under something heavy.";
        if (act === 3) return "Its bar hangs low now. A crossbar is a crossbar, whoever's strings are on it, if only you could get your hands on it.";
        return "The great feet stamp, and every string runs straight up past them. A little Wren walked right round a foot, and round, would wind its own string round it. Two of them, round both feet at once...";
    },
    *afterKnot() {
        Progress.set('d6');
        yield* say(null, 'The Knot pulls tight. Up in the flies, six people you know very well start, very quietly, to cry.');
        const a = G.map, r = a.rooms.find(r => r.key === '1,0');
        a.add(new Warp(r.x + 3, r.y + 9, { to: 'hollow', tx2: MARIONETTE_OUT.x, ty2: MARIONETTE_OUT.y, face: 'down' }));
        a.add(new Prop(r.x + 3, r.y + 9, { im: ART.exitlight, solid: [] }));
    },
};
SIGNATURE_TEXT.marionette = "Carved into the bench, worn smooth by elbows: a little crimson J with a string tied round it. Someone signed this House where only a puppet-maker would ever sit.";
ITEM_LINES.crossbar = () => "You found the {red}Crossbar{/}! Face a puppet you can see and press [tool] to take up its strings: you stand still and it walks for you. [tool] again to let go, and it walks home. Some racks hold several puppets at once.";
ITEM_AFTER.crossbar = function* () { Inv.equipped = 'crossbar'; };

/* the trap room's Pattern (a game that already found it in the prop store, before the House was rebuilt, finds buttons) */
SPAWN.mhpattern = (x, y, p) => new Chest(x, y, Object.assign(p, { item: Inv.hasPattern('marionette') && !Progress.areaFlag('marionette', 'chest:' + p.id) ? 'b20' : 'pattern' }));

/* a flat that springs back up a while after it's knocked down (stagehands) */
{
    const knock = Flat.prototype.knock;
    Flat.prototype.knock = function () {
        const was = this.down;
        knock.call(this);
        if (!was && this.respring) this.springT = 300;
    };
    Flat.prototype.tick = function () {
        if (this.springT > 0 && --this.springT === 0 && this.down) {
            if (this.area.at(this.tx, this.ty) || (G.player && G.player.onTile(this.tx, this.ty)) || this.area.walkers.some(m => m.alive !== false && m.onTile && m.onTile(this.tx, this.ty))) { this.springT = 30; return; }
            this.down = false; this.area.place(this, this.tx, this.ty); Sfx.play('door'); Fx.dust(this.tx * T + 8, this.ty * T + 12);
        }
    };
}

/* the hall's set dressing: rigging up the stage's side walls, footlights along its front, the fly tower's pin rail and its
   sandbags, the trap room's winch */
function initMarionetteDressing() {
    const R = x => (c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
    const rope = (r, x0, y0, y1) => { r('#2a1f2d', x0 - 1, y0, 3, y1 - y0); r('#c9b089', x0, y0, 1, y1 - y0); for (let y = y0 + 1; y < y1; y += 3) r('#8a7050', x0, y, 1, 1); };
    const bag = (r, cx, y) => {
        r('#2a1f2d', cx - 5, y, 10, 11); r('#c8a878', cx - 4, y + 1, 8, 9); r('#e0c494', cx - 4, y + 1, 3, 7); r('#9a7e56', cx + 2, y + 2, 2, 8);
        r('#2a1f2d', cx - 2, y - 2, 4, 3); r('#8a6a4a', cx - 1, y - 1, 2, 1); r('#9a7e56', cx - 3, y + 9, 6, 1);
    };
    /* up a side wall of the stage: two lines run up into the flies, a sandbag tied off on each, cleats at the foot */
    ART.rigging = paintSprite(14, 150, x => {
        const r = R(x);
        rope(r, 4, 0, 140); rope(r, 9, 0, 120);
        bag(r, 4, 58); bag(r, 9, 92);
        r('#2a1f2d', 1, 138, 9, 5); r('#6a635e', 2, 139, 7, 3); r('#a39aa8', 2, 139, 7, 1);
        r('#2a1f2d', 6, 116, 7, 5); r('#6a635e', 7, 117, 5, 3); r('#a39aa8', 7, 117, 5, 1);
    }, false);
    /* footlights: brass cowls along the front edge of the stage, each with a warm glow thrown up onto the boards */
    const footlights = n => paintSprite(n * 16, 12, x => {
        const r = R(x);
        for (let i = 0; i < n; i++) {
            const cx = i * 16 + 8;
            x.globalAlpha = 0.25; r('#fff0a0', cx - 6, 0, 12, 4); x.globalAlpha = 0.45; r('#fff4c0', cx - 3, 1, 6, 3); x.globalAlpha = 1;
            r('#2a1f2d', cx - 5, 4, 10, 6); r('#c8903a', cx - 4, 5, 8, 4); r('#f7d64a', cx - 4, 5, 8, 1); r('#8a5a2a', cx - 4, 8, 8, 1);
            r('#fff4c0', cx - 2, 3, 4, 2); r('#2a1f2d', cx - 6, 9, 12, 1);
        }
    }, false);
    ART.footlights8 = footlights(8); ART.footlights9 = footlights(9);
    /* the fly tower's pin rail: a beam along the wall with belaying pins, every line made off on its pin and running up */
    ART.pinrail = paintSprite(14, 150, x => {
        const r = R(x);
        for (const [rx, top] of [[3, 0], [7, 0], [11, 0]]) rope(r, rx, top, 70);
        r('#2a1f2d', 0, 68, 14, 7); r('#9a6438', 1, 69, 12, 5); r('#c9925a', 1, 69, 12, 1);
        for (const px0 of [2, 6, 10]) { r('#2a1f2d', px0, 64, 3, 14); r('#c8a070', px0 + 1, 65, 1, 12); }
        for (const [rx, y] of [[3, 76], [7, 76], [11, 76]]) { r('#2a1f2d', rx - 1, y, 3, 12); r('#c9b089', rx, y, 1, 11); }
        bag(r, 7, 100);
    }, false);
    /* sandbags in a stack, two tiles long: the stage's counterweights, put by */
    ART.sandbags = paintSprite(32, 20, x => {
        const r = R(x);
        r('#2a1f2d', 0, 17, 32, 3); x.globalAlpha = 0.35; r('#2a1f2d', 1, 17, 30, 3); x.globalAlpha = 1;
        for (const [bx, by] of [[2, 8], [16, 8], [9, 1]]) {
            r('#c8a878', bx, by, 14, 9); r('#e0c494', bx, by, 14, 2); r('#9a7e56', bx, by + 7, 14, 2); r('#8a6a4a', bx + 6, by, 2, 9);
        }
    });
    /* the traps' winch: an iron drum on a frame, its crank chained off */
    ART.trapwinch = paintSprite(32, 22, x => {
        const r = R(x);
        r('#4a4450', 2, 6, 3, 16); r('#4a4450', 27, 6, 3, 16); r('#8a8496', 2, 6, 1, 16); r('#8a8496', 27, 6, 1, 16);
        r('#6a635e', 4, 6, 24, 10); r('#a39aa8', 4, 6, 24, 2); r('#4a4450', 4, 14, 24, 2);
        for (let i = 6; i < 28; i += 3) r('#c9b089', i, 9, 2, 3);
        r('#9a6438', 29, 2, 2, 8); r('#c9925a', 29, 2, 1, 8); r('#c8c0b8', 24, 16, 2, 2); r('#c8c0b8', 26, 18, 2, 2); r('#c8c0b8', 28, 16, 2, 2);
    });
}
CONTENT_INIT.push(initMarionetteDressing);
