/* the long road east, the cape, and the lighthouse: No. 0 */

ROOMS.road = {
    name: 'The Long Road', out: true, music: 'road',
    exits: { l: '@road', r: '@road' },
    map: [
        '################',
        '################',
        '##.............#',
        '#..............#',
        '#..............#',
        ';;;;;;;;;;;;;;;;',
        '#..............#',
        '#..............#',
        '##............##',
        '################',
        '################',
    ],
    ents: [
        { k: 'milestone', id: 'ms_road', x: 7, y: 4, side: 'both' },
        { k: 'stamp', id: 'st_walk', x: 10, y: 4, stamp: 'walk', when: 'walk' },
        NPC('walker', 12, 6, 'walker', AGE([3, 3], { when: 'walk', always: true })),
    ],
};

ROOMS.cliff = {
    name: 'The Cape', out: true, music: 'cape',
    exits: { l: '@road' },
    map: [
        '%%%%%%%%%%%%%%%%',
        '%%%%^^^^^^^^%%%%',
        '%%%^........^%%%',
        '%%^..........^%%',
        '#.............^%',
        ';;;;;;;;;.....^%',
        '#.......;.....^%',
        '#.......;....^%%',
        '##..,...;...^%%%',
        '%#^^^^^^^^^^%%%%',
        '%%%%%%%%%%%%%%%%',
    ],
    ents: [
        H('lighthouse', 7, 2, [0], 'lighthouse', { h: 5, door: [1, 4] }),
        { k: 'milestone', id: 'ms_west', x: 3, y: 6, side: 'west' },
        DECO('cape_bench', 11, 6, 'bench'),
    ],
};

const LH = (name, map, ents, extra) => Object.assign({ name, out: false, music: 'tower', bld: 'lh', map, ents }, extra || {});

ROOMS.lh0 = LH('The Lighthouse', [
    '                ',
    '  WWWWWWWWWWWW  ',
    '  W__________W  ',
    '  W__________W  ',
    '  W__________W  ',
    '  W____rr____W  ',
    '  W____rr____W  ',
    '  W__________W  ',
    '  W__________W  ',
    '  WWWWWMWWWWWW  ',
    '                ',
], [
    { k: 'drum', id: 'drum0', x: 7, y: 1, i: 0 },
    { k: 'stairs', id: 'lh0_up', x: 12, y: 2, to: 'lh1', tx: 11, ty: 2, look: 'stairsup' },
    DECO('lh0_shelf', 12, 3, 'shelf'),
    { k: 'cat', id: 'cat', x: 11, y: 2, s: { wt: [9] }, bed: [4, 8] },
    DECO('catbed', 4, 8, 'catbed', { walk: true }),
    NPC('keeper', 5, 4, 'keeper', AGE([8, 8], { when: 'always', ownAge: true })),
    DECO('keeperchair', 5, 3, 'rocker'),
    DECO('lh0_stove', 3, 2, 'stove', { text: ['A little stove. A kettle, still warm.'] }),
    DECO('lh0_photo', 10, 1, 'frame', { text: ['A photo of a boy on a boat, waving.'] }),
], { entry: [7, 8], ret: { room: 'cliff', x: 8, y: 7 }, takes: true });

ROOMS.lh1 = LH('Second Floor', [
    '                ',
    '  WWWWWWWWWWWW  ',
    '  W__________W  ',
    '  W__________W  ',
    '  W__________W  ',
    '  WvvvvvvvvvvW  ',
    '  W__________W  ',
    '  W__________W  ',
    '  W__________W  ',
    '  WWWWWWWWWWWW  ',
    '                ',
], [
    { k: 'stairs', id: 'lh1_down', x: 12, y: 2, to: 'lh0', tx: 11, ty: 3, look: 'stairsdown' },
    { k: 'stairs', id: 'lh1_up', x: 3, y: 2, to: 'lh2', tx: 4, ty: 2, look: 'stairsup' },
    { k: 'anchor', id: 'anchor', x: 6, y: 3, s: { wt: [9] } },
    { k: 'jar', id: 'lhjar', x: 10, y: 2, s: { n: [0] } },
    { k: 'drum', id: 'drum1', x: 13, y: 7, i: 1 },
    { k: 'door', id: 'lh1_door', x: 7, y: 9, s: { addr: [4] }, face: 'u', look: 'door' },
    DECO('lh1_rope', 4, 7, 'rope', { text: ['A coil of rope. Too short to climb back up.'] }),
]);

ROOMS.lh2 = LH('Third Floor', [
    '                ',
    '  WWWWWWWWWWWW  ',
    '  W___W___W__W  ',
    '  W___W___W__W  ',
    '  W___W___W__W  ',
    '  W__________W  ',
    '  W___W___W__W  ',
    '  W___W___W__W  ',
    '  W___W___W__W  ',
    '  WWWWWWWWWWWW  ',
    '                ',
], [
    { k: 'stairs', id: 'lh2_down', x: 3, y: 2, to: 'lh1', tx: 4, ty: 2, look: 'stairsdown' },
    { k: 'stairs', id: 'lh2_up', x: 12, y: 8, to: 'lh3', tx: 4, ty: 8, look: 'stairsup' },
    { k: 'gate', id: 'sungate', x: 6, y: 5, hours: ['day'], look: 'sungate' },
    { k: 'gate', id: 'moongate', x: 10, y: 5, hours: ['night'], look: 'moongate' },
    DECO('sunwin', 4, 1, 'sunwindow', { text: ['A window. The sun gate opens to it.'] }),
    DECO('moonwin', 8, 1, 'moonwindow', { text: ['A window. The moon gate opens to it.'] }),
    { k: 'drum', id: 'drum2', x: 13, y: 4, i: 2 },
]);

ROOMS.lh3 = LH('Fourth Floor', [
    '                ',
    '  WWWWWWWWWWWW  ',
    '  W__________W  ',
    '  W__________W  ',
    '  W__________W  ',
    '  W__________W  ',
    '  W__________W  ',
    '  W__________W  ',
    '  W__________W  ',
    '  WWWWWWWWWWWW  ',
    '                ',
], [
    { k: 'stairs', id: 'lh3_down', x: 3, y: 8, to: 'lh2', tx: 11, ty: 8, look: 'stairsdown' },
    { k: 'stairs', id: 'lh3_up', x: 12, y: 2, to: 'lhtop', tx: 4, ty: 8, look: 'stairsup' },
    { k: 'wall', id: 'partition', x: 11, y: 2, s: { age: [1] }, hide: ['age'], look: 'partition', text: ['A wooden partition. Newer than the rest of the tower.'] },
    DECO('lh3_shelf', 12, 3, 'shelf'),
    { k: 'drum', id: 'drum3', x: 7, y: 1, i: 3, hide: ['cnt'] },
    { k: 'scope', id: 'lhscope', x: 5, y: 5, s: { d: [9] }, hide: ['d'], look: 'bigscope', text: ['A great brass telescope, aimed out to sea.'] },
    DECO('lh3_desk', 9, 6, 'desk', { text: ['A logbook. Ship after ship, ticked off. The last page is blank.'] }),
]);

ROOMS.lhtop = LH('The Lamp', [
    '                ',
    '  WWWWWWWWWWWW  ',
    '  W__________W  ',
    '  W___nnnn___W  ',
    '  W___n__n___W  ',
    '  W___nnnn___W  ',
    '  W__________W  ',
    '  W__________W  ',
    '  W__________W  ',
    '  WWWWWWWWWWWW  ',
    '                ',
], [
    { k: 'stairs', id: 'lht_down', x: 3, y: 8, to: 'lh3', tx: 11, ty: 3, look: 'stairsdown' },
    { k: 'lamp', id: 'lamp', x: 7, y: 4, w: 2, look: 'lamp', bolt: ['lamp'] },
    { k: 'bell', id: 'bell', x: 7, y: 7, look: 'bell' },
    DECO('readout', 6, 1, 'readout', { w: 4, text: null }),
]);
