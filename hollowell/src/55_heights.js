/* Belfry Heights (overworld block 2,0): windswept cliffs in three terraces above the lake, and the Belfry
   (D4, Mum's bell tower) on top. The way up from Millwater is the cliff stair, a ravine up the east side of
   block 2,1 (walled off from Hushwood, src/59_hushwood.js), reached by paddling over
   the lake to its north-east shore. On the Heights: a boulder asleep on the first stair (ring the shrine
   bell beside it and it goes home), a ledge the gusts blow across, a chasm the Hookline crosses. */

const BELFRY_ENTRY = { x: 29, y: 53 };

const HEIGHTS_ROWS = [
    '################################################################',
    '###.,...........".......r..................................."###',
    '###..r...............,....XXXXXXXXXX.......................,.###',
    '###.......................XXXXXXXXXX..............b..........###',
    '###....,........r.,.......XXXXXXXXXX.........................###',
    '###."......,..............XXXXXXXXXX........"....,...........###',
    '###....,..."..........r.".XXXXXXXXXX.....r...r...............###',
    '###...,...........,.......XXXX:XXXXX...r.....................###',
    '###.....".....................::...................,.........###',
    '##############################H#################################',
    '##############################H#################################',
    '###.....................................ooooo.......:........###',
    '###...........................::::::::::ooooo::::::::........###',
    '###...............,b....................ooooo.......:........###',
    '###.............b......,................ooooo.......:........###',
    '###.b...............................b...ooooo.......:........###',
    '###.....................................ooooo.......:........###',
    '###.....................................ooooo..."...:........###',
    '####################################################H###########',
    '####################################################H###########',
    '###.........:................................................###',
    '###.........:::::::::::::::::::::::::::::::::::::::::........###',
    '###.........:................................................###',
    '###.........:................................................###',
    '###"........:................................................###',
    '###r........:...........b....,................r...........,..###',
    '###.........:....."....b...r.................................###',
    '###.........:.......vvvvvvvv#####vvvvvvvvvvvvvvvv.........,b.###',
    '############H################...################################',
    '############H#################.#################################',
    '###.".r.....::::::::::::::::::::::::::::::::.................###',
    '###.....,..................................:.................###',
    '###........".........,.......".,...........:."...............###',
    '###..".........................,....,......:.................###',
    '###........................................:.................###',
    '###.....b......................"...........:............,....###',
    '###...........,..............,.r...........:......,..........###',
    '###....b...................................:............,....###',
    '###........r...................,...........:...r.........."..###',
    '##########################################:::###################',
];

defBlock({
    id: 'heights', bx: 2, by: 0, name: 'Belfry Heights', theme: 'heights', music: 'heights', owArt: true, soft: 3,
    /* the terraces, from the lake up: each a level higher */
    levels: [[20, 34, 0], [20, 23, 1], [20, 14, 2], [20, 4, 3]],
    rows: HEIGHTS_ROWS,
    forest: ['pine', 'tree_birch'],
    legend: {},
    ents: [
        /* terrace 1: the shrine bell, and the boulder asleep on the stair; along the path, a little cave stopped up
           by another sleeping boulder, out of the shrine's reach (after the Belfry: the Recall Bell) */
        { k: 'bell', x: 14, y: 31, id: 'hShrine' },
        { k: 'deco', x: 14, y: 32, look: 'shrine_post', solid: [[0, 0]], oy: -4, text: 'A little shrine with a bell on a bracket. Carved underneath: RING, AND ALL COMES HOME.' },
        { k: 'block', x: 11, y: 30, id: 'hBoulder', look: 'boulder_b', sleeper: true, tiedOff: true, startAt: [12, 29], trace: [[11, 30], [12, 30], [12, 29]], noPush: true, pushLine: "A boulder, fast asleep on the stair. It doesn't budge. It snores, faintly." },
        { k: 'sign', x: 44, y: 31, text: 'BELFRY HEIGHTS. Mind the wind. Mind the drop. Mind your mother.' },
        { k: 'rest', x: 46, y: 33 },
        { k: 'npc', who: 'brindle', x: 30, y: 34, face: 'down', route: [[30, 34, 240], [22, 36, 200]] },
        { k: 'critter', who: 'goat', look: 'sheep', x: 26, y: 35, speed: 0.4, route: [[26, 35, 200], [33, 37, 160]] },
        /* terrace 2: the windy ledge (gusts blow south, toward the drop) */
        { k: 'gust', x: 13, y: 20, w: 39, h: 7, dir: 'down', period: 300, len: 110, force: 1.0, id: 'hGust' },
        { k: 'vane', x: 11, y: 20 }, { k: 'vane', x: 53, y: 20 },
        { k: 'sign', x: 11, y: 22, text: 'THE BLUSTER. Walk in the lulls; lean into it when it blows. (The vanes spin up first.)' },
        { k: 'block', x: 31, y: 28, id: 'hCaveRock', look: 'boulder_b', sleeper: true, tiedOff: true, startAt: [30, 29], trace: [[31, 28], [30, 28], [30, 29]], noPush: true, pushLine: 'A boulder, asleep in the mouth of a little cave. No bell nearby will reach it.' },
        { k: 'chest', x: 29, y: 28, item: 'heartpatch', id: 'hCave' },
        /* terrace 3: the chasm, eyelets either side */
        { k: 'eyelet', x: 38, y: 12 }, { k: 'eyelet', x: 46, y: 12 },
        { k: 'rest', x: 33, y: 13 },
        /* the top: the Belfry */
        { k: 'building', x: 26, y: 2, w: 10, h: 6, door: 4, art: 'belfry' },
        { k: 'warp', x: 30, y: 7, to: 'belfry', tx2: BELFRY_ENTRY.x, ty2: BELFRY_ENTRY.y, face: 'up', dir: 'up' },
        { k: 'npc', who: 'tess', x: 33, y: 8, face: 'down' },
        { k: 'sign', x: 28, y: 8, text: 'THE BELFRY. Ring once for the Wanderer. (Twice if lost.)' },
        { k: 'enemy', x: 20, y: 14, type: 'nibbler' }, { k: 'enemy', x: 50, y: 34, type: 'nibbler' },
    ],
    regions: [
        { name: 'The Bluster', x: 3, y: 20, w: 58, h: 8 },
        { name: 'The Belfry', x: 3, y: 1, w: 58, h: 8 },
    ],
});

PEOPLE_DEF.brindle = { name: 'Brindle', col: '#d8b070', look: { body: 'adult', hair: 'long', hairC: '#9a6438', top: '#b48ce8', accent: '#fbf6ea', bottom: '#5a4a3a', skin: 'tan' } };
PEOPLE_DEF.tess = PEOPLE_DEF.tess || { name: 'Mum', col: '#e8b04a', look: { body: 'adult', hair: 'bun', hairC: '#c45a3a', top: '#e8b04a', accent: '#fbf6ea', bottom: '#6b4128', skin: 'light' } };

TALK.brindle = function* () {
    yield* firstThen('brindle', "Goats, heather and wind. That's the Heights. The goats are mostly wind too, some days.",
        ["That boulder on the stair? Rolled down in a storm and fell asleep there. Ring the shrine bell. Wakes anything.", "The Bluster blows on and off, regular as a clock. Watch the vanes.", "Your mum's up top. She's been up top since before the sun."]);
};
TALK.tess = function* () {
    if (Progress.flag('d4')) { yield* say('tess', cycle('tess4', ["Four Knots! Did you hear the bells ringing for you? That was me. Well. Some of it.", "Get yourself home for the festival. Everyone'll be there. Everyone always is.", "My bell-ringer's bairn. Go on, then."])); return; }
    if (!Progress.flag('met:tess')) {
        Progress.set('met:tess');
        yield* say('tess', "{name}! You climbed all this way! Come here, let me see you. Windblown. Good. That's how you should look.");
        yield* say('tess', "The Belfry's just there. Bells call things home, love. Remember that. Ring, and everything that's wandered comes running back.");
        yield* say('tess', "I'd come in with you, but I've the noon bell to see to. And the one o'clock. And... well. Bells.");
        return;
    }
    yield* say('tess', cycle('tess1', ["A ring reaches as far as you can throw a shout. Seven strides, about.", "When it's windy, everything wanders. When the bell goes, everything comes back. That's the Heights for you.", "Did your dad feed you? He never feeds you."]));
};
BUDGE.brindle = 'Brindle: "Mind the goats."';
BUDGE.tess = 'Mum: "Oof! Hello, love."';

/* the Heights' rock: grey-violet blocks, lichen; heather on top */
OWA.cliffs.heights = {
    face: (x, th, v, m) => OWA.rockFace(x, th, v, m, { blocks: true, band1: [0, 5, 10], band2: [0, 6, 11], lichen: ['#c8d890', '#e8e0a0', '#a8c0a0'], seed: 5 }),
    top: (x, th, v, m) => OWA.rockTop(x, th, v, m, { tuft: ['#9a6aa8', '#c48ad0'], seed: 5 }),
};
