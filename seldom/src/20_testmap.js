/* the prototype's test ground (?test in the address): one of everything */
const TEST_ROWS = [
    'TTTTTTTTTTTTTTTTTTTTTTTTTPPPPPPPPPPPPPPPPPPPPPPP',
    'T.......,......:........TPGGGGGGGGGGGGGGGGGGGGGP',
    'T..2....,......:........TPGGGGGGPPPPPPPGGGGGGGGP',
    'T..............:........TPGGGGGGPGGGGGPGGGGGGGGP',
    'T....1.........:........TPGG9GGGPGGGGGPGGGGGGGGP',
    'T..............:........TPGGGGGGPGGGGGPGGGGGGGGP',
    'T:::::::::::::::::::::::::GGGGGGGPPPPPPPGGGGGGGGP',
    'T....@.........:........TPGGGGGGGGGGGGGGGGGGGGGP',
    'T..............:........TPGGGGGGGGGGGGGGGGGGGGGP',
    'T..fffff.......:........TPPPPPPPPPPPPPPPPPPPPPPP',
    'T..f.3.f.......:...5....T.......................T',
    'T..f..4f.......:........T....6........6.........T',
    'T..ff.ff.......:........T...........ffffffff....T',
    'T..............:........T...6.......f......f....T',
    'T..............:........T...........f......f....T',
    'T::::::::::::::::::::::::...........ffff.fff....T',
    'T..............:........T.......................T',
    'T~~~~~~~~vv~~~~~~~~~~~~~T.......................T',
    'T~~~~~~~~vv~~~~~~~~~~~~~T.......~~~~~~~~~~~~~~~~T',
    'Twwwwwww7777wwwwwwwwwwwwT.......~~~~~~~~~~~~~~~~T',
    'T.......................T.......~~~~~~~~~~~~~~~~T',
    'T.......8...............T.......~~~~~~~~~~~~~~~~T',
    'T...~~~~~~~~~~~~~~~.....T.......~~~~~~~~~~~~~~~~T',
    'T...~~~~~~~~~~~~~~~.....T.......~~~~~~~~~~~~~~~~T',
    'T...~~~~~~~~~~~~~~~.....T.......~~~~~~~~~~~~~~~~T',
    'T.......................T...............A.......T',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
];
function buildTestMap() {
    const m = new GameMap({
        id: 'test', rows: TEST_ROWS, fill: 'T', outside: 'T',
        zones: [{ law: 'wrap', x: 25, y: 0, w: 24, h: 10, name: 'Woods' }],
        legend: {
            '@': { under: '.', spawn: (m, x, y) => { m.startX = x; m.startY = y; } },
            '1': { spawn: (m, x, y) => m.addAt('npc', x, y, { name: 'flash', spec: { skin: P.skinD, hair: '#2a1a1a', style: 'spiky', top: P.yellow, bottom: P.navy }, talk: flashTalk }) },
            '2': { spawn: (m, x, y) => m.addAt('band', x, y, { name: 'band', song: 'village' }) },
            '3': { spawn: (m, x, y) => m.addAt('chicken', x, y, { name: 'hen' }) },
            '4': { spawn: (m, x, y) => m.addAt('egg', x, y, { name: 'egg1' }) },
            '5': { spawn: (m, x, y) => { addProp(m, { id: 'tower', tx: x, ty: y - 3, tw: 2, th: 4, fh: 2, draw: drawTower }); m.addAt('clock', x, y - 2, { name: 'clock', w: 30, h: 10 }); } },
            '6': { spawn: (m, x, y) => m.addAt('sheep', x, y, { name: 'sheep' + x }) },
            '7': { under: '.', spawn: (m, x, y) => m.addAt('ghost', x, y, { name: 'ghost' + x }) },
            '8': { spawn: (m, x, y) => { m.addAt('ant', x, y, { name: 'ant' }); } },
            '9': { under: 'G', spawn: (m, x, y) => m.addAt('squirrel', x, y, { name: 'squirrel' }) },
            'A': { spawn: (m, x, y) => m.addAt('npc', x, y, { name: 'guard', spec: { skin: P.skin, hair: P.brownD, style: 'cap', hat: P.navy, top: P.blue, bottom: P.navy }, speed: 36, path: [[34, 25, 1], [46, 25, 1]], talk: 'Halt! Nobody passes while I\'m watching.' }) },
        },
        init(m) {
            /* the ants' twig bridge over the pond: only there when the view is close enough to see it */
            for (let x = 8; x <= 10; x++) for (let y = 22; y <= 24; y++) m.add('twig', x * TILE, y * TILE + 5, { name: 'twig' + x + y });
            m.add('ball', 6 * TILE, 4 * TILE + 10, { name: 'ball' });
        },
    });
    return m;
}
async function flashTalk(e) {
    if (!G.flags.ballGame) {
        await say('Wanna see my super throw? Go long!', 'flash');
        G.flags.ballGame = true;
        const b = e.map.find('ball');
        if (b) { b.x = ecx(e); b.y = e.y; b.z = 10; b.vx = 0; b.vy = -160; b.vz = 190; Sfx.play('throw'); }
        return;
    }
    await say('Did you see it come down? I never do. It always takes ages.', 'flash');
}
