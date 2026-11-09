/* west of the square: the lane and the river, the mere, the mill, the quarry */

ROOMS.westlane = {
    name: 'West Lane', out: true, music: 'village',
    exits: { r: 'square', u: 'deepwood', l: 'mere', d: 'quarry' },
    map: [
        '##:####~~#######',
        '#.:....~~......#',
        '#.:....~~......#',
        '#.:....~~......#',
        '#.:::..~~....;.#',
        ';;;;;;;~~;;;;;;;',
        '#......~~....;.#',
        '#..,...~~....;.#',
        '#......~~.,..;.#',
        '#......~~....;.#',
        '#######~~####;##',
    ],
    ents: [
        H('h5', 4, 1, [5], 'five'),
        H('h7', 11, 1, [7], 'seven'),
        { k: 'bridge', id: 'wl_bridge', x: 7, y: 5, w: 2, s: { age: [9] } },
        { k: 'parcel', id: 'parcel5', x: 10, y: 5, s: { wt: [2], to: [5] } },
        NPC('sev', 14, 3, 'sev', { s: { age: [7, 7] }, hide: ['age'] }),
        DECO('wl_bench', 14, 2, 'bench'),
        DECO('wl_sign', 10, 7, 'sign', { text: ['WEST LANE BRIDGE. Built in the year 1. Mind your step.'] }),
    ],
};

ROOMS.five = {
    name: 'No. 5', out: false, music: 'home', entry: [7, 8], ret: { room: 'westlane', x: 5, y: 4 }, takes: true,
    map: [
        '                ',
        '  WWWwWWWWwWWW  ',
        '  W__________W  ',
        '  W__________W  ',
        '  W____rr____W  ',
        '  W____rr____W  ',
        '  W__________W  ',
        '  W__________W  ',
        '  W__________W  ',
        '  WWWWWMWWWWWW  ',
        '                ',
    ],
    ents: [
        NPC('fife', 6, 3, 'fife', { when: 'always' }),
        DECO('fi5_chair', 5, 3, 'chair'),
        DECO('fi5_yarn', 11, 2, 'yarn', { text: ['Yarn. A great deal of yarn.'] }),
        DECO('fi5_bed', 12, 6, 'bed', { h: 2 }),
        DECO('fi5_plant', 3, 7, 'plant'),
    ],
};

ROOMS.seven = {
    name: 'No. 7', out: false, music: 'home', entry: [7, 8], ret: { room: 'westlane', x: 12, y: 4 }, takes: true,
    map: [
        '                ',
        '  WWWWWwWWWWWW  ',
        '  W__________W  ',
        '  W__________W  ',
        '  W__________W  ',
        '  W__________W  ',
        '  W__________W  ',
        '  W__________W  ',
        '  W__________W  ',
        '  WWWWWMWWWWWW  ',
        '                ',
    ],
    ents: [
        NPC('sev_in', 9, 3, 'sev', { when: 'in' }),
        DECO('sv_chair', 9, 2, 'chair'),
        DECO('sv_bed', 3, 2, 'bed', { h: 2 }),
        DECO('sv_frame', 6, 1, 'frame', { text: ['A portrait of a stern young man. It\'s him, a long time ago.'] }),
        DECO('sv_table', 11, 5, 'table'),
    ],
};

ROOMS.mere = {
    name: 'The Mere', out: true, music: 'pond',
    exits: { r: 'westlane', d: 'mill' },
    map: [
        '################',
        '#~~~~~~~~~~~####',
        '#~~~~~~~~~~~...#',
        '#~~~~~~...~~...#',
        '#~~~~~~...~....#',
        '#~~~~~~...~....;',
        '#~~~~~~~~~~....#',
        '#~~~~~~~~~~~...#',
        '##~~~~~~~~~~..##',
        '###~~~~~~~~~..##',
        '####~#######:###',
    ],
    ents: [
        { k: 'plate', id: 'mere_plate', x: 8, y: 5, s: { need: [6] }, g: 'sluice' },
        { k: 'crate', id: 'mere_crate', x: 8, y: 4, s: { wt: [1] } },
        { k: 'boulder', id: 'mere_boulder', x: 10, y: 4, s: { wt: [7] }, wet: true },
        { k: 'gate', id: 'sluice', x: 4, y: 9, g: 'sluice', look: 'sluice' },
        { k: 'tree', id: 'mere_sapling', x: 13, y: 3, s: { age: [0] } },
        DECO('mere_sign', 14, 6, 'sign', { text: ['THE MERE. The sluice feeds the mill. Weigh it down to open.'] }),
        DECO('mere_reeds', 11, 7, 'reeds', { walk: true }),
    ],
};

ROOMS.mill = {
    name: 'The Mill', out: true, music: 'mill',
    exits: { u: 'mere', r: 'quarry' },
    map: [
        '####~#######:###',
        '#...~.......:..#',
        '#...~.......:..#',
        '#...~.......:..#',
        '#...~.......:..#',
        '#...~...::::::::',
        '#...~...:......#',
        '#.::=::::......#',
        '#...~...,......#',
        '#...~..........#',
        '####~###########',
    ],
    ents: [
        H('h8', 1, 1, [8], 'mill'),
        { k: 'deco', id: 'wheel', x: 5, y: 2, w: 1, h: 2, look: 'wheel', text: ['The waterwheel.'] },
        { k: 'counter', id: 'millcount', x: 6, y: 2, s: { cnt: [0, 4, 2] }, far: { cnt: [true, false, false] }, flow: 'millFlow', drop: [7, 4], touch: [[6, 2], [6, 3]] },
        { k: 'chest', id: 'strongbox', x: 9, y: 2, item: 'watch', lock: 'millLock', look: 'strongbox', lockText: ['A strongbox. Its lock is wired to the wheel\'s counter. The counter\'s hundreds are up out of reach.'] },
        NPC('grist', 10, 6, 'grist'),
        DECO('mill_sacks', 13, 8, 'sacks', { text: ['Flour sacks.'] }),
    ],
};

ROOMS.millhouse = {
    name: 'No. 8', out: false, music: 'home', entry: [7, 8], ret: { room: 'mill', x: 2, y: 4 }, takes: true,
    map: [
        '                ',
        '  WWWWWwWWWWWW  ',
        '  W__________W  ',
        '  W__________W  ',
        '  W__________W  ',
        '  W__________W  ',
        '  W__________W  ',
        '  W__________W  ',
        '  W__________W  ',
        '  WWWWWMWWWWWW  ',
        '                ',
    ],
    ents: [
        NPC('grist_in', 6, 4, 'grist', { when: 'in' }),
        DECO('mh_bed', 3, 2, 'bed', { h: 2 }),
        DECO('mh_stones', 11, 3, 'millstone', { text: ['A spare millstone. Very heavy, and not the kind of heavy you can change.'] }),
        DECO('mh_sacks', 12, 7, 'sacks'),
    ],
};

ROOMS.quarry = {
    name: 'The Quarry', out: true, music: 'mill', below: 'cellar',
    exits: { u: 'westlane', l: 'mill', r: 'harbor' },
    map: [
        '#######~~####:##',
        '#....o.~~....:.#',
        '#......~~....:.#',
        '#...o..~~.....:#',
        '#.....-----...:#',
        ':::::.-----.::::',
        '#.....-----....#',
        '#..o..-----..o.#',
        '#.....-----....#',
        '#..............#',
        '################',
    ],
    ents: [
        { k: 'crack', id: 'cr1', x: 7, y: 5, s: { hold: [3] }, below: 'cellar' },
        { k: 'crack', id: 'cr2', x: 8, y: 6, s: { hold: [3] }, below: 'cellar' },
        { k: 'crack', id: 'cr3', x: 9, y: 4, s: { hold: [3] }, below: 'cellar' },
        { k: 'boulder', id: 'q_boulder', x: 3, y: 6, s: { wt: [5] } },
        { k: 'crate', id: 'q_crate', x: 11, y: 8, s: { wt: [3] } },
        DECO('q_sign', 4, 4, 'sign', { text: ['DANGER. Cracked floor. Nothing heavier than 3, please.'] }),
    ],
};

ROOMS.cellar = {
    name: 'The Old Dig', out: false, music: 'eerie', entry: [7, 5], ret: { room: 'quarry', x: 5, y: 5 }, dark: true,
    map: [
        '                ',
        '  oooooooooooo  ',
        '  o----------o  ',
        '  o----------o  ',
        '  o----------o  ',
        '  o----------o  ',
        '  o----------o  ',
        '  o----------o  ',
        '  o----------o  ',
        '  oooooooooooo  ',
        '                ',
    ],
    ents: [
        { k: 'stairs', id: 'cellar_up', x: 3, y: 2, to: 'quarry', tx: 4, ty: 5, look: 'ladder' },
        { k: 'stamp', id: 'st_cellar', x: 11, y: 7, stamp: 'cellar' },
        { k: 'loose', id: 'cel9a', x: 10, y: 3, s: { v: [9] } },
        { k: 'loose', id: 'cel9b', x: 12, y: 4, s: { v: [9] } },
        DECO('cel_cart', 5, 7, 'cart', { text: ['A mine cart full of rubble. And numbers, half-buried.'] }),
        NPC('miner', 9, 6, 'miner', { when: 'always', always: true }),
    ],
};
