/* The lab: a test room for the Return's rules (debug warp only). */

defArea({
    id: 'lab', name: 'Lab', family: 'dungeon', theme: 'tidy', house: 'lab', thread: THREAD.ives,
    rows: [
        '####################',
        '#..........#.......#',
        '#..........#.......#',
        '#...............o..#',
        '#..........#....o..#',
        '#..........#.......#',
        '####.#######.......#',
        '#..................#',
        '#..................#',
        '#..................#',
        '####################',
    ],
    legend: { 'B': { k: 'floor', p: 'floor', ent: 'block' }, 'P': { k: 'floor', p: 'floor', ent: 'pot' } },
    ents: [
        { k: 'block', x: 3, y: 3 }, { k: 'wood', x: 6, y: 3 }, { k: 'pot', x: 8, y: 2 }, { k: 'crate', x: 8, y: 4 },
        { k: 'plate', x: 3, y: 8, sig: 'p1' }, { k: 'door', x: 11, y: 3, type: 'gate', when: 'p1', dir: 'v' },
        { k: 'crystal', x: 14, y: 8 }, { k: 'stray', x: 15, y: 2 },
        { k: 'enemy', x: 16, y: 8, type: 'nibbler' }, { k: 'chest', x: 18, y: 1, id: 'c1', item: 'heartpatch' },
        { k: 'sign', x: 1, y: 1, text: 'This is the lab. Everything here returns.' },
    ],
    rooms: [{ x: 0, y: 0, w: 20, h: 11 }],
    entry: { x: 2, y: 8 },
    music: 'tidy',
});

defArea({
    id: 'lab2', name: 'Lab 2', family: 'dungeon', theme: 'tidy', house: 'lab', thread: THREAD.bram,
    rows: [
        '####################',
        '#..................#',
        '#..................#',
        '#.......ooo........#',
        '#.......ooo........#',
        '#.......ooo........#',
        '#..................#',
        '#..................#',
        '#..................#',
        '#..................#',
        '####################',
    ],
    ents: [
        { k: 'pot', x: 2, y: 2, id: 'p1' }, { k: 'pot', x: 13, y: 8, id: 'p2' },
        { k: 'charm', x: 4, y: 2, id: 'c1', sig: 'c1' },
        { k: 'charm', x: 5, y: 7, id: 's1', seq: 'abc', order: 0, col: 'sun' },
        { k: 'charm', x: 6, y: 7, id: 's2', seq: 'abc', order: 1, col: 'moon' },
        { k: 'charm', x: 7, y: 7, id: 's3', seq: 'abc', order: 2, col: 'star' },
        { k: 'charm', x: 9, y: 4, id: 'pitc', sig: 'pitc' },
        { k: 'eyelet', x: 12, y: 4 },
        { k: 'seal', x: 16, y: 2, id: 'seal1' },
        { k: 'pot', x: 15, y: 6, id: 'p3' },
    ],
    rooms: [{ x: 0, y: 0, w: 20, h: 11 }],
    entry: { x: 2, y: 8 },
});

/* water: a current, a ferry, a wheel, a pond to paddle on */
defArea({
    id: 'lab3', name: 'Lab 3', family: 'dungeon', theme: 'tidy', house: 'lab', thread: THREAD.ambrose,
    rows: [
        '####################',
        '#..................#',
        '#.>>>>>>>~##########',
        '#..................#',
        '#..................#',
        '#.>>>>>>>>>>~......#',
        '#.~~~~~~...........#',
        '#.~~~~~~...........#',
        '#.~~~~~~...........#',
        '#.~~~~~~...........#',
        '####################',
    ],
    ents: [
        { k: 'crate', x: 2, y: 3, id: 'crate' },
        { k: 'raft', x: 2, y: 5, id: 'ferry' },
        { k: 'wheel', x: 6, y: 4, face: 'down', sig: 'w1', id: 'wheel' },
        { k: 'raft', x: 7, y: 8, id: 'raft' },
        { k: 'crate', x: 7, y: 9, id: 'floater' },
        { k: 'block', x: 10, y: 7, id: 'stone' },
        { k: 'block', x: 10, y: 6, id: 'stray', stray: true },
    ],
    rooms: [{ x: 0, y: 0, w: 20, h: 11 }],
    entry: { x: 15, y: 3 },
});

/* wind and bells */
defArea({
    id: 'lab4', name: 'Lab 4', family: 'dungeon', theme: 'tidy', house: 'lab', thread: THREAD.tess,
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
        { k: 'gust', x: 1, y: 1, w: 12, h: 2, dir: 'right', period: 400, len: 200, phase: 200, id: 'gust' },
        { k: 'crate', x: 2, y: 1, id: 'crate' },
        { k: 'bell', x: 15, y: 5, id: 'bell' },
        { k: 'block', x: 4, y: 5, id: 'stone' },
        { k: 'wood', x: 3, y: 7, id: 'sleeper', sleeper: true, tiedOff: true, startAt: [10, 7], trace: [[3, 7], [4, 7], [5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7]] },
        { k: 'enemy', x: 17, y: 8, type: 'bat' },
    ],
    rooms: [{ x: 0, y: 0, w: 20, h: 11 }],
    entry: { x: 15, y: 8 },
});

/* Wren's own mark: a bed, the Bedroll, crumbling boards, dreamcatchers, bouncy moss, sleep puffs, a Snoreling */
defArea({
    id: 'lab5', name: 'Lab 5', family: 'dungeon', theme: 'tidy', house: 'lab', thread: THREAD.mallow,
    rows: [
        '########################################',
        '#.......................#..............#',
        '#.......................#..............#',
        '#.........oooooooo......#..............#',
        '#.........cccccccc.....................#',
        '#.........oooooooo......#..............#',
        '#.......................#....~~~~~~~...#',
        '#.......................#....~~~~~~~...#',
        '#.......................#..............#',
        '#.......................#..............#',
        '########################################',
    ],
    legend: { 'c': { k: 'floor', p: 'floor3', ent: 'crumble' } },
    ents: [
        { k: 'bed', x: 2, y: 1, id: 'bed' },
        { k: 'dreamring', x: 13, y: 4, id: 'ring1', sig: 'r1' },
        { k: 'moss', x: 2, y: 8, id: 'moss' },
        { k: 'puffball', x: 20, y: 8, id: 'puff' },
        { k: 'crate', x: 6, y: 8, id: 'crate', marked: false },
        { k: 'plate', x: 34, y: 2, sig: 'p1' },
        { k: 'snoreling', x: 37, y: 9, id: 'snore' },
        { k: 'raft', x: 35, y: 6, id: 'raft' },
    ],
    rooms: [{ x: 0, y: 0, w: 24, h: 11 }, { x: 24, y: 0, w: 16, h: 11 }],
    entry: { x: 5, y: 5 },
});

/* puppets: a puppet through a hole and over spikes to a plate; a rack of two; a toy soldier; a painted flat */
defArea({
    id: 'lab6', name: 'Lab 6', family: 'dungeon', theme: 'tidy', house: 'lab', thread: THREAD.jory,
    rows: [
        '####################',
        '#........#.........#',
        '#........#.........#',
        '#........O..^^^....#',
        '#........#.........#',
        '#........#.........#',
        '#..................#',
        '#........#.........#',
        '#........#.........#',
        '#........#.........#',
        '####################',
    ],
    legend: { 'O': { k: 'crawl', p: 'wall', ent: 'crawlhole' } },
    ents: [
        { k: 'puppet', x: 6, y: 3, id: 'pA' },
        { k: 'plate', x: 17, y: 3, sig: 'lp' },
        { k: 'door', x: 9, y: 6, type: 'gate', when: 'lp', dir: 'v', id: 'labGate' },
        { k: 'rack', x: 2, y: 8, group: 'g', id: 'rack' },
        { k: 'puppet', x: 5, y: 8, id: 'pB', group: 'g' }, { k: 'puppet', x: 5, y: 6, id: 'pC', group: 'g' },
        { k: 'soldier', x: 12, y: 8, id: 'sol', facing: 'right' },
        { k: 'flat', x: 14, y: 6, id: 'flat' },
    ],
    rooms: [{ x: 0, y: 0, w: 20, h: 11 }],
    entry: { x: 3, y: 3 },
});

/* two layers: a room and its Underside; cords, tugs, knots, a hatch, a counterweight; the Needle */
defHouse({
    id: 'lab7', name: 'Lab 7', theme: 'tidy', house: 'lab', thread: THREAD.guild,
    themeAt: (x, y) => y >= 11 ? 'underside' : 'tidy',
    drawGround: (a, cx, cy) => Spool.drawAbove(a, cx, cy),
    entry: { x: 2, y: 2 },
    cells: {
        '0,0': {
            name: 'Upstairs',
            rows: [
                '####################',
                '#..............#...#',
                '#..............#...#',
                '#..............#...#',
                '#..............#...#',
                '#..................#',
                '#..............#...#',
                '#..............#...#',
                '#..............#...#',
                '#..............#...#',
                '####################',
            ],
            ents: [
                { k: 'wood', x: 4, y: 3, id: 'kA' },
                { k: 'wood', x: 8, y: 3, id: 'kB', startAt: [8, 5], trace: [[8, 3], [8, 4], [8, 5]] },
                { k: 'plate', x: 8, y: 5, sig: 'lp' },
                { k: 'wood', x: 11, y: 7, id: 'kC' },
                { k: 'stray', x: 5, y: 8, id: 'kS' },
                { k: 'door', x: 15, y: 5, type: 'gate', when: '!cw', dir: 'v', id: 'cwGate' },
            ],
        },
        '0,1': {
            name: 'Underneath', above: '0,0',
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
                { k: 'plate', x: 12, y: 5, sig: 'cw' },
                { k: 'weight', x: 12, y: 5, id: 'cwWeight' },
            ],
        },
    },
});

