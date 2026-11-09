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
