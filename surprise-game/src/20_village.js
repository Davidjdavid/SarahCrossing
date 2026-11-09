/* the village: home, the square, the post office, the shop, east lane, clock hill, the harbor.
   maps are 16x11 tiles. interiors use the same grid, the rest of it dark. */

const H = (id, x, y, addr, look, extra) => Object.assign({ k: 'house', id, x, y, w: 3, h: 3, door: [1, 2], s: { addr }, look }, extra || {});
const NPC = (id, x, y, look, extra) => Object.assign({ k: 'npc', id, x, y, look }, extra || {});
const DECO = (id, x, y, look, extra) => Object.assign({ k: 'deco', id, x, y, look }, extra || {});

ROOMS.home = {
    name: 'Home', out: false, music: 'home', entry: [7, 8], ret: { room: 'square', x: 2, y: 4 }, takes: true,
    map: [
        '                ',
        '  WWWwWWWWWwWW  ',
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
        DECO('bed', 3, 2, 'bed', { h: 2 }),
        DECO('hometable', 10, 3, 'table'),
        DECO('homeplant', 12, 2, 'plant'),
        DECO('homeshelf', 12, 6, 'shelf'),
        DECO('mirror', 9, 1, 'mirror'),
        { k: 'crate', id: 'c_home', x: 7, y: 8, s: { wt: [9] } },
    ],
};

ROOMS.square = {
    name: 'Tally Square', out: true, music: 'village',
    exits: { u: 'woodedge', d: 'harbor', r: 'eastlane', l: 'westlane' },
    map: [
        '######;;########',
        '#......;.......#',
        '#..,...;.......#',
        '#......;....,..#',
        '#;;;;;;;;;;;;;;#',
        ';;;;;;;;;;;;;;;;',
        '#;;;;;;;;;;;;;;#',
        '#.......;;.....#',
        '#.......;;.....#',
        '#,......;;....,#',
        '########;;######',
    ],
    ents: [
        H('h1', 1, 1, [1], 'home'),
        H('h2', 12, 1, [2], 'post'),
        H('h3', 1, 6, [3], 'shop'),
        { k: 'clock', id: 'townclock', x: 10, y: 2, text: ['The town clock. It has never once been wrong.'] },
        DECO('well', 12, 7, 'well', { text: ['A well. Very deep. You can\'t see the bottom.'] }),
        DECO('sq_bench', 5, 8, 'bench'),
        NPC('gran', 4, 8, 'gran'),
        NPC('pip', 11, 8, 'pip', { s: { age: [0, 8] }, hide: ['age'] }),
        DECO('sq_flowers1', 13, 9, 'flowerpot', { walk: false }),
    ],
};

ROOMS.post = {
    name: 'Post Office', out: false, music: 'home', entry: [7, 8], ret: { room: 'square', x: 13, y: 4 }, takes: true,
    map: [
        '                ',
        '  WWbbbWWwWWWW  ',
        '  W__________W  ',
        '  W__________W  ',
        '  WCCCCCC____W  ',
        '  W__________W  ',
        '  W__________W  ',
        '  W____rr____W  ',
        '  W__________W  ',
        '  WWWWWMWWWWWW  ',
        '                ',
    ],
    ents: [
        NPC('postmaster', 5, 3, 'postmaster', { when: 'always' }),
        DECO('album', 11, 2, 'album'),
        DECO('postscale', 12, 5, 'scale', { text: ['A scale for parcels. It reads 0.'] }),
        DECO('postsacks', 3, 2, 'sacks'),
    ],
};

ROOMS.shop = {
    name: 'Dot\'s', out: false, music: 'shop', entry: [7, 8], ret: { room: 'square', x: 2, y: 9 }, takes: true,
    map: [
        '                ',
        '  WWWWWwWWwWWW  ',
        '  W__________W  ',
        '  W__________W  ',
        '  W_CCCCCCCC_W  ',
        '  W__________W  ',
        '  W__________W  ',
        '  W____rr____W  ',
        '  W__________W  ',
        '  WWWWWMWWWWWW  ',
        '                ',
    ],
    ents: [
        NPC('dot', 10, 3, 'dot', { when: 'always' }),
        { k: 'shelf', id: 'sh_satchel', x: 5, y: 4, item: 'satchel', s: { price: [3, 0, 0] } },
        { k: 'shelf', id: 'sh_nine', x: 7, y: 4, item: 'digit', digit: 9, s: { price: [9, 0] } },
        { k: 'shelf', id: 'sh_map', x: 9, y: 4, item: 'map', s: { price: [4, 0] } },
        DECO('shopbarrel', 3, 7, 'barrel'),
        DECO('shopplant', 12, 7, 'plant'),
    ],
};

ROOMS.eastlane = {
    name: 'East Lane', out: true, music: 'village',
    exits: { l: 'square', r: '@road', u: 'clockhill' },
    map: [
        '#######;########',
        '#......;.......#',
        '#......;.......#',
        '#......;.......#',
        '#;;;;;;;;;;;;;;#',
        ';;;;;;;;;;;;;;;;',
        '#..............#',
        '#..,...........#',
        '#.......,......#',
        '#..........,...#',
        '################',
    ],
    ents: [
        { k: 'lot', id: 'lot9', x: 2, y: 1, w: 3, h: 3, door: [1, 2], s: { age: [0], addr: [9] } },
        H('h4', 11, 1, [4], 'tock'),
        NPC('guard', 7, 1, 'guard'),
        { k: 'milestone', id: 'ms_east', x: 13, y: 6, side: 'east' },
        DECO('el_bench', 5, 7, 'bench'),
        DECO('el_sign', 2, 6, 'sign', { text: ['Lot for sale. Build what you like.'] }),
        DECO('el_fence', 6, 1, 'fence'), DECO('el_fence2', 8, 1, 'fence'),
    ],
};

ROOMS.tock = {
    name: 'Tock\'s Clocks', out: false, music: 'home', entry: [7, 8], ret: { room: 'eastlane', x: 12, y: 4 }, takes: true,
    map: [
        '                ',
        '  WWWWWWWWWWWW  ',
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
        NPC('tock', 6, 3, 'tock', { when: 'always' }),
        DECO('tock_bench', 5, 3, 'workbench'),
        DECO('tock_c1', 4, 1, 'wallclock'), DECO('tock_c2', 8, 1, 'wallclock'), DECO('tock_c3', 11, 1, 'wallclock'),
        DECO('tock_gf', 12, 5, 'grandfather', { text: ['A grandfather clock, stopped at a quarter past nothing.'] }),
        DECO('tock_bed', 3, 6, 'bed', { h: 2 }),
    ],
};

ROOMS.newhouse = {
    name: 'No. 9', out: false, music: 'home', entry: [7, 8], ret: { room: 'eastlane', x: 3, y: 4 }, host: { room: 'eastlane', id: 'lot9' },
    map: [
        '                ',
        '  WWWWwWWwWWWW  ',
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
        { k: 'stamp', id: 'st_house', x: 7, y: 4, stamp: 'house' },
        DECO('nh_box', 4, 3, 'box', { text: ['A moving box. Empty. Waiting for someone.'] }),
    ],
};

ROOMS.clockhill = {
    name: 'Clock Hill', out: true, music: 'hill',
    exits: { d: 'eastlane' },
    map: [
        '################',
        '##^^^^^^^^^^^^##',
        '#^^..........^^#',
        '#^............^#',
        '#..............#',
        '#.....;;;;.....#',
        '#......;;......#',
        '#..,...;;...,..#',
        '#......;;......#',
        '#......;.......#',
        '#######;########',
    ],
    ents: [
        { k: 'door', id: 'towerdoor', x: 7, y: 5, to: 'clocktower', when: 'eerie', look: 'towerdoor' },
        DECO('tower', 6, 2, 'tower', { w: 3, h: 4, text: ['The old clock tower. No door. No hands. It stopped before anyone remembers.'] }),
        { k: 'scope', id: 'hillscope', x: 12, y: 4, look: 'scope', text: null },
        DECO('hill_bench', 3, 6, 'bench'),
    ],
};

ROOMS.clocktower = {
    name: '??:??', out: false, music: 'eerie', entry: [7, 8], ret: { room: 'clockhill', x: 7, y: 6 },
    map: [
        '                ',
        '  WWWWWWWWWWWW  ',
        '  W---------gW  ',
        '  Wg---------W  ',
        '  W----------W  ',
        '  W----------W  ',
        '  W---------gW  ',
        '  Wg---------W  ',
        '  W----------W  ',
        '  WWWWWMWWWWWW  ',
        '                ',
    ],
    ents: [
        { k: 'chest', id: 'tw_chest', x: 7, y: 3, item: 'satchel', look: 'chest' },
        { k: 'stamp', id: 'st_hour', x: 7, y: 5, stamp: 'hour' },
        NPC('hourling', 10, 4, 'hourling', { always: true, when: 'eerie' }),
        DECO('gear1', 4, 4, 'gear', { walk: false }), DECO('gear2', 11, 7, 'gear', { walk: false }),
    ],
};

ROOMS.harbor = {
    name: 'Harbor', out: true, music: 'sea',
    exits: { u: 'square', l: 'quarry' },
    map: [
        '########;;######',
        '#.......;;.....#',
        '#.......;;.....#',
        '#.......;;.....#',
        '#ssssssss;sssss#',
        'sssssssssssssss#',
        '%%%%%%%==%%%%%%%',
        '%%%%%%%==%%%%%%%',
        '%%%%%%%==%%%%%%%',
        '%%%%%%%%%%%%%%%%',
        '%%%%%%%%%%%%%%%%',
    ],
    ents: [
        H('h6', 2, 1, [6], 'fisher'),
        NPC('marlo', 8, 8, 'marlo'),
        { k: 'sea', id: 'sea', x: 0, y: 6, w: 16, h: 5, s: { d: [INF] }, hide: ['d'], touch: [[7, 9], [8, 9], [6, 8], [9, 8], [6, 7], [9, 7], [6, 6], [9, 6]] },
        DECO('hb_rope', 12, 3, 'barrel'),
        DECO('hb_nets', 13, 2, 'nets', { text: ['Nets, drying. Nothing in them for weeks.'] }),
        { k: 'stamp', id: 'st_shore', x: 7, y: 10, stamp: 'shore', when: 'shore' },
        DECO('bottle', 8, 10, 'bottle', { when: 'shore', text: ['A message in a bottle: "Hello from the far shore. It is closer than it looks."'] }),
        DECO('ship', 10, 6, 'ship', { w: 3, h: 2, when: 'lit', text: ['The boat that came home. It smells of salt and far-off places.'] }),
        NPC('son', 7, 6, 'son', { when: 'lit', always: true }),
        NPC('keeper2', 9, 4, 'keeper', { when: 'lit', always: true }),
    ],
    /* the far shore: as close as the sea's width says */
    tile(x, y) {
        const sea = entById('sea', 'harbor');
        const d = sea ? dval(sea.s.d) : Infinity;
        if (d === Infinity) return null;
        const top = 9 + d;
        if (y >= top && x >= 5 && x <= 10) return 's';
        return null;
    },
};

ROOMS.fisher = {
    name: 'No. 6', out: false, music: 'home', entry: [7, 8], ret: { room: 'harbor', x: 3, y: 4 }, takes: true,
    map: [
        '                ',
        '  WWWwWWWWwWWW  ',
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
        NPC('marlo_in', 5, 4, 'marlo', { when: 'in' }),
        DECO('fi_bed', 3, 2, 'bed', { h: 2 }),
        DECO('fi_wheel', 9, 1, 'shipwheel', { text: ['A ship\'s wheel, hung up like a picture.'] }),
        DECO('fi_barrel', 12, 7, 'barrel'),
        DECO('fi_table', 10, 4, 'table'),
    ],
};

ROOMS.nowhere = {
    name: 'Nowhere', out: false, music: 'nowhere', entry: [7, 8], ret: { room: 'square', x: 7, y: 5 },
    map: [
        '                ',
        '  WWWWWWWWWWWW  ',
        '  W----------W  ',
        '  W----------W  ',
        '  WCCCCCC----W  ',
        '  W----------W  ',
        '  W----------W  ',
        '  W----------W  ',
        '  W----------W  ',
        '  WWWWWMWWWWWW  ',
        '                ',
    ],
    ents: [
        NPC('clerk', 5, 3, 'clerk', { always: true, when: 'always' }),
        DECO('nw_sacks', 11, 2, 'sacks', { text: ['Sacks and sacks of letters. None of them going anywhere.'] }),
        DECO('nw_sacks2', 12, 3, 'sacks', { text: ['To: 47. To: 88. To: 31. Nobody lives at any of them.'] }),
        { k: 'stamp', id: 'st_nowhere', x: 10, y: 6, stamp: 'nowhere' },
    ],
    onEnter() { },
};
