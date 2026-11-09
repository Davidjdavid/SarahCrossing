/* the woods north and west of the square, the old fort beyond them */

ROOMS.woodedge = {
    name: 'Wood Edge', out: true, music: 'woods',
    exits: { d: 'square', l: 'deepwood', u: 'fortgate' },
    map: [
        '#######:########',
        '#######:########',
        '#####..:..######',
        '###....:....####',
        '##..,..:.....###',
        '::::::::......##',
        '##.....:...,.###',
        '###....:....####',
        '####...:....####',
        '#####.;;...#####',
        '######;;########',
    ],
    ents: [
        { k: 'wall', id: 'we_wall', x: 7, y: 1, s: { age: [6] } },
        { k: 'tree', id: 'we_tree', x: 1, y: 5, s: { age: [5] } },
        { k: 'slime', id: 'we_slime', x: 10, y: 6, s: { hp: [2], str: [1] }, ai: 'chase', range: 4, sleep: 'night' },
        { k: 'tree', id: 'we_t2', x: 4, y: 3, s: { age: [7] } },
        { k: 'tree', id: 'we_t3', x: 11, y: 4, s: { age: [4] } },
        { k: 'tree', id: 'we_t4', x: 3, y: 7, s: { age: [2] } },
    ],
};

ROOMS.deepwood = {
    name: 'Deep Wood', out: true, music: 'woods', nest: [11, 2],
    exits: { r: 'woodedge', l: 'mirror', d: 'westlane' },
    map: [
        '#######~~#######',
        '#.....#~~#...###',
        '#.....#~~#...###',
        '#.....#~~#...###',
        '#.....#~~##.####',
        ':::::::~~:::::::',
        '#.:...#~~#.....#',
        '#.:...#~~#..,..#',
        '#.:,..#~~#.....#',
        '#.:...#~~#.....#',
        '##:####~~#######',
    ],
    ents: [
        { k: 'bridge', id: 'dw_bridge', x: 7, y: 5, w: 2, s: { age: [0] } },
        { k: 'wall', id: 'dw_wall', x: 11, y: 4, s: { age: [7] } },
        DECO('nest', 11, 2, 'nest', { walk: false }),
        { k: 'egg', id: 'egg', x: 11, y: 2, s: { age: [0] } },
        { k: 'tree', id: 'oldtree', x: 2, y: 1, w: 2, h: 2, s: { age: [8] }, hollow: true, big: true },
        { k: 'tree', id: 'dw_t1', x: 4, y: 3, s: { age: [3] } },
        { k: 'tree', id: 'dw_t2', x: 13, y: 7, s: { age: [6] } },
        { k: 'slime', id: 'dw_slime', x: 4, y: 7, s: { hp: [4], str: [2] }, ai: 'chase', range: 3, sleep: 'night' },
    ],
};

ROOMS.hollow = {
    name: 'The Hollow', out: false, music: 'home', entry: [7, 8], ret: { room: 'deepwood', x: 2, y: 3 },
    map: [
        '                ',
        '                ',
        '    hhhhhhhh    ',
        '    h______h    ',
        '    h______h    ',
        '    h______h    ',
        '    h______h    ',
        '    h______h    ',
        '    h______h    ',
        '    hhhMhhhh    ',
        '                ',
    ],
    ents: [
        NPC('squirrel', 9, 4, 'squirrel', { when: 'always', always: true }),
        { k: 'stamp', id: 'st_hollow', x: 6, y: 5, stamp: 'hollow' },
        { k: 'loose', id: 'hollow6', x: 5, y: 3, s: { v: [6] } },
        DECO('acorns', 10, 3, 'acorns', { text: ['A heap of acorns. Hundreds. Someone has been counting.'] }),
    ],
};

ROOMS.mirror = {
    name: 'Mirror Pond', out: true, music: 'pond',
    exits: { r: 'deepwood' },
    map: [
        '################',
        '####.......#####',
        '###..~~~~~..####',
        '##..~~~~~~~..###',
        '##.~~~~~~~~~..##',
        '##.~~~~~~-.....:',
        '##.~~~~~~~~~..##',
        '##..~~~~~~~..###',
        '###..~~~~~..####',
        '####.......#####',
        '################',
    ],
    ents: [
        { k: 'mirror', id: 'mstone', x: 9, y: 5, s: { v: [6] } },
        DECO('mp_reed', 4, 2, 'reeds', { walk: true }), DECO('mp_reed2', 11, 8, 'reeds', { walk: true }),
        DECO('mp_sign', 13, 4, 'sign', { text: ['MIRROR POND. What you put in comes back the other way up.'] }),
    ],
};

ROOMS.fortgate = {
    name: 'Fort Gate', out: true, music: 'fort',
    exits: { d: 'woodedge', u: 'fortyard' },
    map: [
        '#######-########',
        '#.....--.......#',
        '#......-.......#',
        'kkkkkkk-kkkkkkkk',
        'kkkkkkk-kkkkkkkk',
        '#......:.......#',
        '#..,...:.......#',
        '##.....:......##',
        '###....:.....###',
        '####...:....####',
        '#######:########',
    ],
    ents: [
        { k: 'golem', id: 'golem', x: 7, y: 4, s: { hp: [9, 9], str: [9], wt: [9] }, ai: 'guard', windup: true },
        DECO('fg_sign', 4, 6, 'sign', { text: ['OLD FORT. Abandoned. The guard was never told.'] }),
        DECO('fg_torch1', 6, 5, 'torch'), DECO('fg_torch2', 8, 5, 'torch'),
    ],
};

ROOMS.fortyard = {
    name: 'Fort Yard', out: true, music: 'fort',
    exits: { d: 'fortgate' },
    map: [
        'kkkkkkkkkkkkkkkk',
        'kkk-kk-kk-kk-kkk',
        'k--------------k',
        'k--------------k',
        'k--------------k',
        'k--------------k',
        'k----------o---k',
        'k--------------k',
        'k--o-----------k',
        'kkkkkkk-kkkkkkkk',
        'kkkkkkk-kkkkkkkk',
    ],
    ents: [
        { k: 'door', id: 'd11', x: 3, y: 1, s: { addr: [1, 1] }, look: 'cell' },
        { k: 'door', id: 'd12', x: 6, y: 1, s: { addr: [1, 2] }, look: 'cell' },
        { k: 'door', id: 'd13', x: 9, y: 1, s: { addr: [1, 3] }, look: 'cell' },
        { k: 'door', id: 'd14', x: 12, y: 1, s: { addr: [1, 4] }, look: 'cell' },
        DECO('arch15', 15, 5, 'arch', { s: { addr: [1, 5] }, bolt: ['addr'], text: ['A doorway, bricked up long ago. The number above it says 15.'] }),
        { k: 'rattle', id: 'rat1', x: 4, y: 4, s: { hp: [3], str: [2] }, ai: 'patrol', path: [[4, 4], [11, 4]], pi: 1 },
        { k: 'rattle', id: 'rat2', x: 12, y: 7, s: { hp: [3], str: [1] }, ai: 'patrol', path: [[12, 7], [12, 2]], pi: 1 },
    ],
};

const CELL = (id, name, ents, ret) => ({
    name, out: false, music: 'fort', entry: [7, 7], ret, takes: false,
    map: [
        '                ',
        '                ',
        '    kkkkkkkk    ',
        '    k------k    ',
        '    k------k    ',
        '    k------k    ',
        '    k------k    ',
        '    k------k    ',
        '    kkkMkkkk    ',
        '                ',
        '                ',
    ],
    ents,
});
ROOMS.cell11 = CELL('cell11', 'Cell 11', [NPC('prisoner', 9, 4, 'ghost', { when: 'always', always: true }), DECO('c11_cot', 5, 3, 'cot')], { room: 'fortyard', x: 3, y: 2 });
ROOMS.cell12 = CELL('cell12', 'Cell 12', [{ k: 'jar', id: 'jar12', x: 9, y: 3, s: { n: [3] } }, DECO('c12_cot', 5, 3, 'cot')], { room: 'fortyard', x: 6, y: 2 });
ROOMS.cell13 = CELL('cell13', 'Cell 13', [{ k: 'crate', id: 'c13', x: 8, y: 5, s: { wt: [5] } }, DECO('c13_cot', 5, 3, 'cot')], { room: 'fortyard', x: 9, y: 2 });
ROOMS.cell14 = CELL('cell14', 'Cell 14', [{ k: 'rattle', id: 'rat14', x: 9, y: 4, s: { hp: [5], str: [1] }, ai: 'chase', range: 5 }, DECO('c14_cot', 5, 3, 'cot')], { room: 'fortyard', x: 12, y: 2 });
ROOMS.armory = {
    name: 'Armory', out: false, music: 'fort', entry: [7, 8], ret: { room: 'fortyard', x: 14, y: 5 },
    map: [
        '                ',
        '  kkkkkkkkkkkk  ',
        '  k----------k  ',
        '  k----------k  ',
        '  k----------k  ',
        '  k----------k  ',
        '  k----------k  ',
        '  k----------k  ',
        '  k----------k  ',
        '  kkkkkMkkkkkk  ',
        '                ',
    ],
    ents: [
        { k: 'chest', id: 'specstand', x: 7, y: 3, item: 'specs', look: 'stand', emptyText: ['An empty stand.'] },
        DECO('rack1', 3, 2, 'rack'), DECO('rack2', 4, 2, 'rack'), DECO('rack3', 11, 2, 'rack'), DECO('rack4', 12, 2, 'rack'),
        DECO('arm_note', 10, 6, 'sign', { text: ['"Issued to the night watch: spectacles, one pair. For seeing what isn\'t written down."'] }),
    ],
};
