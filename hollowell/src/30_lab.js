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
