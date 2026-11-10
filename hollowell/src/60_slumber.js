/* House 5: the Slumberhouse, in Hushwood. Doctor Mallow's House, lavender threads. A great dormitory at night.
   Wren's own mark: lie down in a bed and that bed is where you wake, however far you go in here (rooms don't
   move it), and a fall onto your own bed doesn't hurt, so falls are travel. Your trace remembers paths that are
   gone: boards that crumble behind you, a ride on the current; flying home, you go back the way you came, over
   anything, through dreamcatchers. Matron Hush follows your footsteps exactly; beaten, she leaves the Bedroll:
   lay it anywhere and hold C to go Homeward. Old rules join in: currents and floats, the Hookline, the Recall
   Bell and sleepers, strays filling pits, plates and their weights; and, late on, the Kiln's shards flying home the
   way their pot was carried (the Milk Kitchen) and the Bell rung in mid-flight (the Dreaming Door). Mother Sloth
   pulls you to her bed; fly from her grip, far enough, and her arms snap (three rounds: see 60b). */

THEMES.slumberhouse = { floor: ['#8a8ac8', '#6a6aa8', '#a8a8e0', '#4a4a7a'], wall: ['#b48ce8', '#8a64c4', '#d8c8f8', '#4b3a8a'], stone: ['#9a8ab8', '#7a6a98', '#bcaed8', '#4e4268'], water: ['#6ab0d8', '#4a8ac0', '#a8d8f0', '#2a5a8a'], dark: '#1e1a34' };
FLOORS.slumberhouse = {
    /* soft blue carpet with little stars, old boards, and the night-blue tiles of the wards */
    floor: (x, th, v) => { fill(x, '#6e74b8'); speckle(x, ['#7a80c4', '#646aac'], 70 + v, 0.35); if (v === 3 && hash2(v, 7, 3) < 2) { fill(x, '#c8c0f0', 7, 7, 3, 1); fill(x, '#c8c0f0', 8, 6, 1, 3); } },
    floor2: (x, th, v) => Paint.planks(x, ['#a88a6a', '#86684a', '#c4a684', '#5a4430'], v, true),
    floor3: (x, th, v) => { fill(x, '#5a5e98'); fill(x, '#4a4e84', 0, 15, 16, 1); fill(x, '#4a4e84', 15, 0, 1, 16); speckle(x, ['#6a6ea8'], 40 + v, 0.15); },
};
WALLS.slumberhouse = {
    edge: '#1e1a34',
    top: (x) => { fill(x, '#3e2e6a'); speckle(x, ['#4b3a8a'], 8, 0.15); },
    face: (x, th, v) => {
        fill(x, '#b48ce8'); speckle(x, ['#a47ad8', '#c4a0f0'], 30 + v, 0.25);
        fill(x, '#f7e08a', 3 + (v * 5) % 9, 4, 1, 1); fill(x, '#fbf6ea', 11 - (v * 3) % 7, 8, 1, 1);
        fill(x, '#7d5bc4', 0, 12, 16, 1); fill(x, '#4b3a8a', 0, 15, 16, 1);
    },
};

const SLUMBER_OUT = { x: 128 + 19, y: 40 + 9 };      /* the door out, at the front of the house */

defHouse({
    id: 'slumber', name: 'The Slumberhouse', place: 'The Slumberhouse', house: 'slumber', theme: 'slumberhouse', thread: THREAD.mallow, music: 'slumber',
    knotName: 'Sleeping Knot',
    entry: SLUMBER_ENTRY,
    legend: { 'c': { k: 'floor', p: 'floor2', ent: 'crumble' }, 'n': { k: 'pit', p: 'pit', narrow: true } },
    cells: {
        /* ---------------- 1 The Night Porch: a bed is where you wake; boards that give way; falls are travel ---------------- */
        '1,3': {
            name: 'The Night Porch',
            rows: [
                '#########.##########',
                '#..................#',
                '#..................#',
                '#.........ooooooooo#',
                '#.........ooooo...o#',
                '#.........ccccc...o#',
                '#.........ooooo...o#',
                '#.........ooooooooo#',
                '#..................#',
                '#..................#',
                '#########.##########',
            ],
            ents: [
                { k: 'door', x: 9, y: 0, type: 'gate', when: 'nplever', id: 'npGate' },
                { k: 'lever', x: 16, y: 5, id: 'npLever', sig: 'nplever', once: true },
                { k: 'bed', x: 3, y: 6, id: 'npBed' },
                { k: 'warp', x: 9, y: 10, to: 'hollow', tx2: SLUMBER_OUT.x, ty2: SLUMBER_OUT.y, dir: 'down', face: 'down' },
                { k: 'sign', x: 5, y: 9, text: "THE SLUMBERHOUSE. Lie down a moment, why don't you. However far you wander in here, the bed you lay in is where you'll wake. (Mind the old boards.)" },
            ],
            nudge: { solved: () => Progress.areaFlag('slumber', 'lever:npLever'), after: 60 * 60 * 2, at: [3, 6], say: 'The bed by the door has its covers turned down, as if it were expecting someone. The boards across the pit creak.' },
        },
        /* ---------------- 2 The Long Ward (hub): beds all along, and the patients asleep in the aisles ---------------- */
        '1,2': {
            name: 'The Long Ward',
            rows: [
                '#########.##########',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '....................',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#########.##########',
            ],
            ents: [
                { k: 'door', x: 9, y: 0, type: 'lock', id: 'lwLockN' },
                { k: 'door', x: 19, y: 5, type: 'lock', id: 'lwLockE', dir: 'v' },
                { k: 'bed', x: 2, y: 1 }, { k: 'bed', x: 5, y: 1 }, { k: 'bed', x: 13, y: 1 }, { k: 'bed', x: 16, y: 1 },
                { k: 'bed', x: 2, y: 7 }, { k: 'bed', x: 5, y: 7 }, { k: 'bed', x: 13, y: 7 }, { k: 'bed', x: 16, y: 7 },
                { k: 'snoreling', x: 8, y: 3, id: 'lwSnore1' }, { k: 'snoreling', x: 11, y: 8, id: 'lwSnore2' },
                { k: 'nightlight', x: 4, y: 0 }, { k: 'nightlight', x: 7, y: 0 }, { k: 'nightlight', x: 11, y: 0 }, { k: 'nightlight', x: 15, y: 0 },
                { k: 'sign', x: 10, y: 9, text: "THE LONG WARD. Lights out. Patients will kindly stay in bed. (Snorelings: tread softly and they won't stir.)" },
            ],
        },
        /* ---------------- 3 The Linen Cupboard: one walk over the boards, every lamp lit (key A) ---------------- */
        '0,2': {
            name: 'The Linen Cupboard',
            rows: [
                '####################',
                '#..................#',
                '#.....oooooooo.....#',
                '#####.oo.cccoo.....#',
                '#...#.ooccocoo.....#',
                '#.....oocccc.o......',
                '#...#.oocoocc......#',
                '#####.o.ccocoo.....#',
                '#.....oooooooo.....#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'plate', x: 8, y: 3, sig: 'lp1', mode: 'toggle' }, { k: 'plate', x: 12, y: 5, sig: 'lp2', mode: 'toggle' }, { k: 'plate', x: 7, y: 7, sig: 'lp3', mode: 'toggle' },
                { k: 'door', x: 4, y: 5, type: 'gate', when: 'lp1&lp2&lp3', dir: 'v', id: 'lcGate', keep: true },
                { k: 'chest', x: 2, y: 5, item: 'key', id: 'lcKey' },
                { k: 'bed', x: 16, y: 1, id: 'lcBed' },
                { k: 'sign', x: 17, y: 8, text: 'THE LINEN CUPBOARD. Three lamps on the old floor. Light them all at once and the cupboard opens. The boards only bear you the once.' },
            ],
            nudge: { solved: 'slumber_chest:lcKey', after: 60 * 60 * 3, at: [13, 6], say: 'The boards sag where they have been trodden before. You would have to plan the whole walk before you set foot on them, and fall home after.' },
        },
        /* ---------------- 4 The Laundry: ride the current under the dreamcatchers; jump in before it comes round (the Plan) ---------------- */
        '2,2': {
            name: 'The Laundry',
            rows: [
                '####################',
                '#..................#',
                '#..V<<<<<<<<<<<<<..#',
                '#..V............A...',
                '#..V............A..#',
                '...V............A~~~',
                '#..V............A..#',
                '#..>>>>>>>>>>>>>A..#',
                '#..~...............#',
                '#..................#',
                '#########.##########',
            ],
            ents: [
                { k: 'raft', x: 3, y: 8, id: 'ldBasket', look: 'basket', patience: 2400 },
                { k: 'dreamring', x: 9, y: 7, sig: 'lr1', id: 'ldRing1' }, { k: 'dreamring', x: 16, y: 4, sig: 'lr2', id: 'ldRing2' }, { k: 'dreamring', x: 9, y: 2, sig: 'lr3', id: 'ldRing3' },
                { k: 'chest', x: 1, y: 1, item: 'plan', id: 'ldPlan', hidden: true, when: 'lr1&lr2&lr3' },
                { k: 'grate', x: 19, y: 5 },
                { k: 'barrel', x: 22, y: 5, id: 'ldBarrel', sleeper: true, tiedOff: true, saveWake: e => Bedroll.float === e, startAt: [17, 5], trace: [[22, 5], [21, 5], [20, 5], [19, 5], [18, 5], [17, 5]], pushLine: 'A washtub barrel, bobbing fast asleep by the grate. Bubbles come up, now and then, like snores.' },
                { k: 'door', x: 19, y: 3, type: 'gate', when: 'stlever', dir: 'v', id: 'ldStudyDoor' },
                { k: 'sign', x: 18, y: 9, text: 'THE LAUNDRY. The wash goes round and round. Whatever goes round comes back to where it started, and is none the wiser.' },
                { k: 'sign', x: 1, y: 9, text: 'Hung over the tub: three dreamcatchers. They only catch you on your way home.' },
            ],
            nudge: { solved: () => Inv.plans.includes('slumber'), after: 60 * 60 * 3, at: [3, 8], say: "The basket bobs at its little dock. Out on the water, a dreamcatcher turns slowly, though nobody could ever walk under it." },
        },
        /* ---------------- 5 Mallow's Study (signature): only reached by sending your Bedroll home in the sleeping barrel ---------------- */
        '3,2': {
            name: "Mallow's Study",
            rows: [
                '####################',
                '#..................#',
                '#..................#',
                '...................#',
                '#..................#',
                '~~~~...............#',
                '#~~~...............#',
                '#~~~...............#',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'lever', x: 2, y: 1, id: 'stLever', sig: 'stlever', once: true },
                { k: 'signature', x: 10, y: 5, house: 'slumber' },
                { k: 'deco', x: 14, y: 2, look: 'desk', solid: [[0, 0], [1, 0]], text: "Doctor Mallow's desk. A case book lies open: \"The Wanderer. Sleeps soundly. Dreams of the road. Wakes where we put her.\" The last three words have been crossed out, very hard." },
                { k: 'deco', x: 17, y: 7, look: 'bookshelf_tall', solid: [[0, 0]], oy: -16, text: 'Books on sleep, on dreams, on threads, and one called KNOTS FOR BEGINNERS with a lot of pages turned down.' },
                { k: 'chest', x: 16, y: 2, item: 'heartpatch', id: 'stPatch' },
            ],
        },
        /* ---------------- 6 The Drying Loft: the sleeping boulder's own place is out on the island, empty while it sleeps: the
           Hookline catches on an empty mark. Wake it (the obvious thing) and it goes home and fills it; leave, and it lies
           down again. Then fall home (key B) ---------------- */
        '2,3': {
            name: 'The Drying Loft',
            rows: [
                '#########.##########',
                '#..................#',
                '#..................#',
                '#..................#',
                '#oooooooooooooooooo#',
                '#oooooooooooo.ooooo#',
                '#oooooooooooooooooo#',
                '#oooooooooooooooooo#',
                '#ooooooooooo....ooo#',
                '#ooooooooooo....ooo#',
                '####################',
            ],
            ents: [
                { k: 'block', x: 13, y: 8, id: 'dlBoulder', look: 'boulder_b', sleeper: true, tiedOff: true, resetSleep: true, startAt: [6, 2], trace: [[13, 8], [13, 7], [13, 6], [13, 5], [13, 4], [13, 3], [12, 3], [11, 3], [10, 3], [9, 3], [8, 3], [7, 3], [6, 3], [6, 2]], pushLine: 'A boulder, fast asleep and snoring like a kettle. How did it get up here? How does anything?' },
                { k: 'chest', x: 15, y: 8, item: 'key', id: 'dlKey' },
                { k: 'bed', x: 2, y: 1, id: 'dlBed' },
                { k: 'snoreling', x: 4, y: 2, id: 'dlSnore1' }, { k: 'snoreling', x: 17, y: 2, id: 'dlSnore2' },
                { k: 'sign', x: 17, y: 3, text: 'THE DRYING LOFT. Sheets, socks, and a long way down.' },
            ],
            nudge: { solved: 'slumber_chest:dlKey', after: 60 * 60 * 3, thing: 'dlBoulder', say: 'While the boulder sleeps, its own place out on the island stands empty. Wake it, and it won\'t be.' },
        },
        /* ---------------- 7 The Landing (mini-boss): Matron Hush follows your footsteps (the Bedroll) ---------------- */
        '1,1': {
            name: 'The Landing',
            rows: [
                '#########.##########',
                '#..................#',
                '#..................#',
                '#....cccccccccc....#',
                '#....cccccccccc....#',
                '.....cccccccccc.....',
                '#....cccccccccc....#',
                '#....cccccccccc....#',
                '#..................#',
                '#..................#',
                '#########.##########',
            ],
            ents: [
                { k: 'door', x: 9, y: 0, type: 'big', id: 'laBig' },
                { k: 'shutter', x: 9, y: 10, dir: 'h', group: 'matron' }, { k: 'shutter', x: 0, y: 5, dir: 'v', group: 'matron' }, { k: 'shutter', x: 19, y: 5, dir: 'v', group: 'matron' },
                { k: 'deco', x: 1, y: 8, look: 'bed_big', solid: [[0, 0], [1, 0], [0, 1], [1, 1]], oy: 0, text: "Matron's bed. Starched so stiff it could stand up by itself. It very nearly is." },
                { k: 'matron', x: 3, y: 9, id: 'matron' },
                { k: 'chest', x: 9, y: 8, item: 'bedroll', id: 'laBedroll', hidden: true, when: 'flag:slumber_matron', big: true },
                { k: 'sign', x: 17, y: 1, text: "THE LANDING. Matron does her rounds in her sleep. She never misses a step: yours. (The floorboards here are older than she is.)" },
            ],
        },
        /* ---------------- 8 The Nursery: carry the toy home over the drop it can't climb (key C's door) ---------------- */
        '0,1': {
            name: 'The Nursery',
            rows: [
                '#########.##########',
                '#..................#',
                '#oooooooooooooooooo#',
                '#..................#',
                '#..................#',
                '#...................',
                '##vvvvvvvv#........#',
                '##........#........#',
                '##........#........#',
                '##......n.#........#',
                '####################',
            ],
            ents: [
                { k: 'door', x: 9, y: 0, type: 'lock', id: 'nuLock' },
                { k: 'crate', x: 4, y: 8, id: 'nuToy', marked: false, look: 'toyblock', noThrow: true },
                { k: 'deco', x: 14, y: 7, look: 'crib', solid: [[0, 0], [1, 0]], oy: -6, text: 'A crib, empty. A mobile of little wooden moons turns over it, though there is no draught.' },
                { k: 'sign', x: 12, y: 4, text: "THE NURSERY. Toys away by bedtime, please. (Someone has added, in crayon: THE BIG BLOCK DOESN'T GO BACK. IT NEVER GOES BACK.)" },
            ],
            nudge: { solved: () => Slumber.toyUsed(), after: 60 * 60 * 3, thing: 'nuToy', say: "The toy block in the playpen doesn't belong anywhere. Whatever falls into a pit and doesn't come back fills it in. If only it could be got out of the playpen." },
        },
        /* ---------------- 9 The Moonwalk: be in two places at once, nearly (key C); north, lock D to the Milk Kitchen ---------------- */
        '2,1': {
            name: 'The Moonwalk',
            rows: [
                '###############.####',
                '#...#..............#',
                '#...#..............#',
                '##.##..#......#....#',
                '#..................#',
                '...........#.......#',
                '#..................#',
                '#......#......#....#',
                '#..................#',
                '#..................#',
                '####################',
            ],
            ents: [
                { k: 'door', x: 2, y: 3, type: 'gate', when: 'mwp', id: 'mwGate', passed: 'up' },
                { k: 'door', x: 15, y: 0, type: 'lock', id: 'mwLockN' },
                { k: 'chest', x: 2, y: 1, item: 'key', id: 'mwKey' },
                { k: 'plate', x: 17, y: 9, sig: 'mwp' },
                { k: 'wood', x: 16, y: 9, id: 'mwBlock' },
                { k: 'sign', x: 5, y: 9, text: "THE MOONWALK. The gate in the corner stays open while the far plate is pressed. Nobody has ever walked it in time." },
            ],
            nudge: { solved: 'slumber_mwGate', after: 60 * 60 * 3, at: [2, 4], say: 'The gate is a long way from the plate. Walking back takes too long. Something faster than walking, then.' },
        },
        /* ---------------- 10 Pillow Fort: a Snoreling will sleep in any bed going, even yours (key D) ---------------- */
        '0,0': {
            name: 'Pillow Fort',
            rows: [
                '####################',
                '#......#...#.......#',
                '#......#...#.......#',
                '#......#...#.......#',
                '#......##.##.......#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#..................#',
                '#########.##########',
            ],
            ents: [
                { k: 'door', x: 9, y: 4, type: 'gate', when: 'pfp', id: 'pfGate' },
                { k: 'chest', x: 9, y: 2, item: 'key', id: 'pfKey' },
                { k: 'plate', x: 16, y: 8, sig: 'pfp' },
                { k: 'snoreling', x: 3, y: 2, id: 'pfSnore1' }, { k: 'snoreling', x: 17, y: 2, id: 'pfSnore2' },
                { k: 'deco', x: 2, y: 7, look: 'pillowpile', solid: [[0, 0], [1, 0]], oy: -4, text: 'A heap of pillows, still warm.' },
                { k: 'deco', x: 13, y: 6, look: 'pillowpile', solid: [[0, 0], [1, 0]], oy: -4, text: 'A heap of pillows. Somebody has built a little wall of them, and a little flag on top: a sock.' },
                { k: 'sign', x: 18, y: 9, text: 'PILLOW FORT. The keep opens while someone holds down the plate. (Lights out at eight. Everybody in bed. ANY bed.)' },
            ],
            nudge: { solved: 'slumber_chest:pfKey', after: 60 * 60 * 4, at: [16, 8], say: 'A Snoreling, woken, shuffles about and then goes to the nearest bed it can find. Any bed at all. Even one somebody has just laid out.' },
        },
        /* ---------------- 11 Mother Sloth (boss): the room runs from wall to wall either side of her four-poster (the east wall
           a tile in, so her reach sits square in it) ---------------- */
        '1,0': {
            name: "Mother Sloth's Room",
            rows: [
                '####################',
                '#.................##',
                '#.................##',
                '#.................##',
                '#.................##',
                '#.................##',
                '#.................##',
                '#.................##',
                '#.................##',
                '#.................##',
                '#########.##########',
            ],
            ents: [
                { k: 'nightstand', x: 5, y: 1, text: 'A nightstand. A night-light on it, turned down low, and a glass of water with a very long straw.' },
                { k: 'nightstand', x: 13, y: 1, text: 'A nightstand. A night-light, a book of lullabies, and a pair of spectacles the size of cartwheels.' },
                { k: 'mothersloth', x: 9, y: 2, id: 'sloth' },
                { k: 'shutter', x: 9, y: 10, dir: 'h', group: 'boss' },
            ],
        },
        /* ---------------- 12 The Milk Kitchen: the jug brought home by air; its pieces fly back over the gap (Kiln + Homeward) ---------------- */
        '2,0': {
            name: 'The Milk Kitchen',
            rows: [
                '####################',
                '#....ooooooooo.....#',
                '#....ooooooooo.....#',
                '#....ooooooooo.....#',
                '#....,oo,oo,oo,....#',
                '#....ooooooooo......',
                '#....ooooooooo.....#',
                '#....ooooooooo.....#',
                '#....ooooooooo.....#',
                '#....ooooooooo.....#',
                '###############.####',
            ],
            ents: [
                { k: 'door', x: 19, y: 5, type: 'gate', when: 'mkbell', dir: 'v', id: 'mkGate', keep: true },
                { k: 'bedspring', x: 14, y: 4, dir: 'left' }, { k: 'bedspring', x: 11, y: 4, dir: 'left' }, { k: 'bedspring', x: 8, y: 4, dir: 'left' }, { k: 'bedspring', x: 5, y: 4, dir: 'left' },
                { k: 'charm', x: 9, y: 4, mode: 'once', id: 'mkBell', sig: 'mkbell', col: 'milk' },
                { k: 'deco', x: 1, y: 1, look: 'milkstove', solid: [[0, 0], [1, 0]], text: 'A little stove, still warm. A pan of milk sits on it, a skin on the top.' },
                { k: 'pot', x: 2, y: 2, id: 'mkJug', style: 'jug' },
                { k: 'deco', x: 3, y: 8, look: 'milktable', solid: [[0, 0]], text: 'A kitchen table. Somebody has drawn a moon on it in spilt milk.' },
                { k: 'nightlight', x: 2, y: 0 }, { k: 'nightlight', x: 16, y: 0 },
                { k: 'sign', x: 17, y: 8, text: 'THE MILK KITCHEN. Warm milk, if you ring the little bell. (The old springs only go the one way. Mind the gap.)' },
            ],
            nudge: { solved: 'slumber_mkGate', after: 60 * 60 * 3, thing: 'mkJug', say: "Broken, the jug's pieces would fly home the way the jug came. So far it has never been anywhere but its shelf." },
        },
        /* ---------------- 13 The Dreaming Door: a good dream lit, a bad one dark; the Bell rung on the way home (the Pattern) ---------------- */
        '3,0': {
            name: 'The Dreaming Door',
            rows: [
                '####################',
                '#...#...ooooooooooo#',
                '#...#...cccccccccco#',
                '##.##...oooooooooco#',
                '#....ooooooooooooco#',
                '.....ooooooooooooco#',
                '#....ooooooooooooco#',
                '#....ooooooooooooco#',
                '#....ccccccccccccco#',
                '#....oooooooooooooo#',
                '####################',
            ],
            ents: [
                { k: 'door', x: 2, y: 3, type: 'gate', when: 'dgood&!dbad', id: 'dgDoor', passed: 'up' },
                { k: 'dreamlock', x: 2, y: 3, good: 'dgGood', bad: 'dgBad' },
                { k: 'slumpattern', x: 2, y: 1, id: 'dgPattern', big: true },
                { k: 'dreamring', x: 10, y: 2, sig: 'dgood', id: 'dgGood', time: 300 },
                { k: 'nightmare', x: 6, y: 8, sig: 'dbad', id: 'dgBad', time: 300 },
                { k: 'nightlight', x: 6, y: 0 }, { k: 'nightlight', x: 13, y: 0 },
                { k: 'sign', x: 1, y: 9, text: 'THE DREAMING DOOR. It opens for a good dream, and never for a bad one. (The old boards out there will only bear you the once.)' },
            ],
            nudge: { solved: 'slumber_dgDoor', after: 60 * 60 * 3, at: [10, 2], say: "Flying home, you go back every step of the way you came, under everything that hangs over it. A bell is never so patient: whatever's out of its place, it sends straight home." },
        },
    },
    tick: a => Slumber.tick(a),
    build: a => Slumber.build(a),
    afterKnot: function* () { yield* Slumber.afterKnot(); },
});
/* a pit still there? (for nudges) */
function slumberPit(area, cx, cy, x, y) { const a = G.map; if (!a || a.id !== area) return true; return a.kind(cx * 20 + x, cy * 11 + y).pit; }

const Slumber = {
    NURSERY_PITS: () => { const r = []; for (let x = 1; x <= 18; x++) r.push([x, 11 + 2]); return r; },
    toyUsed() { return this.NURSERY_PITS().some(([x, y]) => Progress.areaFlag('slumber', `fill:${x},${y}`)); },
    build(a) {
        /* the toy block, once it's filled the gap for good, is used up */
        if (this.toyUsed()) { const t = a.find('nuToy'); if (t) a.remove(t); }
    },
    /* the Linen Cupboard's lamps go out when the boards mend (one walk, every lamp lit) */
    linenReset(a) {
        const r = a.rooms.find(q => q.key === '0,2');
        for (const e of a.ents) if (e.kind === 'plate' && /^lp\d$/.test(e.sig) && e.mode === 'toggle') e.on = false;
    },
    tick(a) {
        /* the Linen Cupboard: leave it and the lamps go out with the boards mending */
        const inL = !!(Cam.room && Cam.room.key === '0,2');
        if (this._inL && !inL) this.linenReset(a);
        this._inL = inL;
        /* toys away by bedtime: the toy block won't leave the Nursery */
        const toy = a.find('nuToy'), p = G.player;
        if (toy && !toy.removed && p) {
            const nr = a.rooms.find(q => q.key === '0,1');
            const inN = (x, y) => x >= nr.x && y >= nr.y && x < nr.x + nr.w && y < nr.y + nr.h;
            const out = toy.carried ? (p.state === 'normal' && !inN(p.tx, p.ty)) : (!toy.mv && !inN(toy.tx, toy.ty));
            if (out) {
                if (toy.carried) { p.carry = null; toy.carried = false; toy.heldBy = null; }
                else a.unplace(toy, toy.tx, toy.ty);
                const spot = [[4, 8], [5, 8], [3, 8], [6, 8], [4, 7], [5, 7]].find(([x, y]) => !a.at(nr.x + x, nr.y + y)) || [4, 8];
                toy.tx = nr.x + spot[0]; toy.ty = nr.y + spot[1]; toy.x = toy.tx * T; toy.y = toy.ty * T;
                a.place(toy, toy.tx, toy.ty);
                Fx.poof(toy.tx * T + 8, toy.ty * T + 8);
                UI.toast('The toy block wriggles free and bounces off back to the Nursery. (Toys away by bedtime.)', 160);
            }
        }
        /* the Moonwalk gate, latched once passed */
        const g = a.find('mwGate');
        if (g && g.openedOnce && !Progress.flag('slumber_mwGate')) Progress.set('slumber_mwGate');
    },
    *afterKnot() {
        Progress.set('d5');
        Progress.setGoal('Home to Hollowell. (Somebody at the clinic will want to hear all about it.)');
        yield* say(null, 'All through the house, very softly, every bed creaks at once, as if everyone in them had turned over in their sleep.');
        const a = G.map, r = a.rooms.find(r => r.key === '1,0');
        a.add(new Warp(r.x + 3, r.y + 9, { to: 'hollow', tx2: SLUMBER_OUT.x, ty2: SLUMBER_OUT.y, face: 'down' }));
        a.add(new Prop(r.x + 3, r.y + 9, { im: ART.exitlight, solid: [] }));
    },
};
SIGNATURE_TEXT.slumber = "Stitched into the rug, lavender on lavender, so you'd only see it lying down: a crescent moon and the letters D.M. Someone signed this House where they'd see it last thing at night.";

ITEM_LINES.bedroll = () => 'You found the {red}Bedroll{/}! Tap [tool] to lay it down anywhere: that spot is home now. Hold [tool] to go Homeward, flying back along your trace to it. What you carry comes too.';
ITEM_AFTER.bedroll = function* () { Inv.equipped = 'bedroll'; };

/* the Pattern's chest in the Dreaming Door (a game that found the Pattern in Pillow Fort, before the Milk Kitchen and the
   Dreaming Door were built, finds buttons in it instead) */
SPAWN.slumpattern = (x, y, p) => new Chest(x, y, Object.assign(p, { item: Inv.hasPattern('slumber') && !Progress.areaFlag('slumber', 'chest:' + p.id) ? 'b20' : 'pattern' }));

/* old bedsprings, poking up out of a mattress set on a post: step on and they boing you on, three tiles, the one way
   they're sprung (bouncy moss, indoors) */
class Bedspring extends Moss {
    draw(cx, cy) { Gfx.img(spr(this.squish > 0 ? 'bedspring_squish' : 'bedspring'), this.x - cx, this.y - cy); }
}
SPAWN.bedspring = (x, y, p) => new Bedspring(x, y, Object.assign({ dist: 3 }, p));

/* a bad dream's catcher: a dreamcatcher like any other (a flight home through it lights it), dark-feathered */
class NightmareRing extends DreamRing {
    draw(cx, cy) {
        const x = this.x - cx + 8, y = this.y - cy - 4 + Math.round(Math.sin(G.t / 26 + this.tx) * 1.5), lit = this.lit > 0;
        Gfx.alpha(0.2); Gfx.rect(x - 4, this.y - cy + 12, 8, 2, PAL.ink); Gfx.alpha(1);
        Gfx.line(x, y - 14, x, y - 8, '#5a4a6a');
        if (lit) { Gfx.alpha(0.3 + 0.15 * Math.sin(G.t / 5)); Gfx.circle(x, y, 9, '#c42b6a'); Gfx.alpha(1); }
        /* a thick, knotted hoop of dark willow */
        for (let i = 0; i < 32; i++) {
            const t = i / 32 * Math.PI * 2;
            Gfx.rect(Math.round(x + Math.cos(t) * 7), Math.round(y + Math.sin(t) * 7), 1, 1, PAL.ink);
            Gfx.rect(Math.round(x + Math.cos(t) * 6), Math.round(y + Math.sin(t) * 6), 1, 1, lit ? '#e8508a' : i % 4 === 0 ? '#5a4a6a' : '#8a6a9a');
        }
        /* a tangled web, not a neat cross */
        const web = lit ? '#f0a0c0' : '#b8a0c8';
        Gfx.line(x - 4, y - 3, x + 4, y + 3, web); Gfx.line(x - 4, y + 3, x + 3, y - 4, web); Gfx.line(x - 2, y + 4, x + 4, y - 1, lit ? '#e8508a' : '#8a6a9a');
        /* black feathers hanging under it */
        for (const [fx, h] of [[-4, 5], [0, 6], [3, 4]]) { Gfx.rect(x + fx - 1, y + 7, 3, h, PAL.ink); Gfx.rect(x + fx, y + 7, 1, h - 1, fx ? '#3d2c3e' : '#5a4a6a'); }
    }
}
SPAWN.nightmare = (x, y, p) => new NightmareRing(x, y, p);

/* the Dreaming Door's lock: a little dreamcatcher on the wall either side of it, one for the good dream and one for the
   bad, lit while theirs is */
class DreamLock extends Ent {
    constructor(tx, ty, p = {}) { super('dreamlock', p); this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T; }
    get sortY() { return this.y + 4; }
    draw(cx, cy) {
        const a = this.area, g = a.find(this.good), b = a.find(this.bad);
        for (const [dx, ring, on, off, glow] of [[-1, g, '#f7e08a', '#b48ce8', '#f7e08a'], [1, b, '#e8508a', '#4a3a5a', '#c42b6a']]) {
            const x = this.x - cx + 8 + dx * T, y = this.y - cy + 5, lit = ring && ring.lit > 0;
            if (lit) { Gfx.alpha(0.3); Gfx.circle(x, y, 6, glow); Gfx.alpha(1); }
            Gfx.circle(x, y, 4, PAL.ink); Gfx.circle(x, y, 3, lit ? on : off); Gfx.circle(x, y, 2, lit ? shade(on, 0.5) : '#3e2e6a');
            Gfx.rect(x - 1, y + 4, 1, 3, PAL.ink); Gfx.rect(x + 1, y + 4, 1, 2, PAL.ink);
        }
    }
}
SPAWN.dreamlock = (x, y, p) => new DreamLock(x, y, p);

/* night-lights: a little frosted shade on a brass bracket in the wall, a candle in it, a soft pool of light below */
class NightLight extends Ent {
    constructor(tx, ty, p = {}) { super('nightlight', p); this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T; }
    get sortY() { return this.y + 6; }
    draw(cx, cy) {
        const x = this.x - cx + 8, y = this.y - cy + 4, k = Math.sin(G.t / 27 + this.tx * 1.7);
        /* (the pool of light only on a floor to fall on) */
        if (!this.area.kind(this.tx, this.ty + 1).pit) { Gfx.alpha(0.08 + 0.03 * k); Gfx.circle(x, y + 15, 10, '#f7e08a'); Gfx.alpha(1); }
        Gfx.alpha(0.14 + 0.05 * k); Gfx.circle(x, y + 4, 7, '#fff4c0'); Gfx.alpha(1);
        Gfx.rect(x - 1, y - 3, 3, 4, PAL.ink); Gfx.rect(x, y - 2, 1, 3, '#c8903a');
        Gfx.circle(x, y + 4, 4, PAL.ink); Gfx.circle(x, y + 4, 3, '#f0d890'); Gfx.rect(x - 2, y + 2, 2, 2, '#fff8e0'); Gfx.rect(x, y + 4, 1, 2, '#f39a3c');
        Gfx.rect(x - 3, y + 7, 7, 2, PAL.ink); Gfx.rect(x - 2, y + 7, 5, 1, '#e8b04a');
    }
}
SPAWN.nightlight = (x, y, p) => new NightLight(x, y, p);
/* a nightstand by a bed, its night-light glowing */
SPAWN.nightstand = (x, y, p) => {
    const pr = SPAWN.deco(x, y, Object.assign({ look: 'nightstand', solid: [[0, 0]] }, p)), d0 = pr.draw.bind(pr);
    pr.draw = (cx, cy) => {
        const k = Math.sin(G.t / 23 + x);
        Gfx.alpha(0.14 + 0.04 * k); Gfx.circle(x * T - cx + 8, y * T - cy - 2, 12, '#f7e08a'); Gfx.alpha(1);
        d0(cx, cy);
    };
    return pr;
};
CHARM_COL.milk = '#ece4f6';

function initSlumberRooms() {
    /* the milk jug: cream glaze, a lavender band, a lip with a spout, a handle */
    SPR.jug = paintSprite(16, 16, x => {
        const R = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
        R('#f4ecdc', 5, 3, 6, 3); R('#f4ecdc', 4, 6, 8, 1); R('#f4ecdc', 3, 7, 10, 6); R('#f4ecdc', 4, 13, 8, 1); R('#d8ccb8', 5, 14, 6, 1);
        R('#d8ccb8', 10, 7, 3, 6); R('#d8ccb8', 9, 12, 3, 1); R('#ffffff', 4, 7, 2, 3); R('#ffffff', 6, 4, 1, 2);
        R('#b48ce8', 3, 9, 10, 2); R('#8a64c4', 10, 9, 3, 2); R('#d8c8f8', 4, 9, 2, 1);
        R('#f4ecdc', 4, 2, 8, 1); R('#fbf6ea', 5, 2, 6, 1); R('#3a2a34', 5, 2, 6, 1); R('#fbf6ea', 6, 2, 4, 1); R('#f4ecdc', 3, 2, 1, 1);
        R('#d8ccb8', 12, 5, 2, 1); R('#d8ccb8', 14, 6, 1, 5); R('#d8ccb8', 12, 11, 2, 1);
    });
    /* bedsprings: a ticking-striped mattress with three coils poking up, and squashed flat under a foot */
    const springs = (top, squash) => paintSprite(16, 16, x => {
        const R = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
        /* the mattress: a buttoned, ticking-striped top, its front in shadow */
        R('#efe6d6', 1, 8, 14, 3); for (let i = 2; i < 15; i += 3) R('#a8b4d8', i, 8, 1, 3); R('#fbf6ea', 1, 8, 14, 1);
        R('#d2c4ae', 1, 11, 14, 3); for (let i = 2; i < 15; i += 3) R('#8494c0', i, 11, 1, 3); R('#a89878', 1, 14, 14, 1);
        R('#7d5bc4', 5, 9, 1, 1); R('#7d5bc4', 10, 9, 1, 1);
        /* the springs, bursting up out of it */
        for (const c of [3, 7, 11]) {
            for (let y = top; y < 9; y++) { const odd = (y - top) % 2; R(odd ? '#6a6478' : '#e0dcec', c - 1 + odd, y, 2, 1); }
            R('#a8a4b8', c, top - 1, 1, 1);
        }
        if (squash) R('#8a849a', 2, 7, 12, 1);
    });
    SPR.bedspring = springs(3, false); SPR.bedspring_squish = springs(7, true);
    ART.milkstove = paintSprite(32, 22, x => {
        const R = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
        R('#3e3a4a', 2, 8, 28, 14); R('#5a5468', 2, 8, 28, 2); R('#2a2634', 2, 20, 28, 2); R('#e8463c', 6, 14, 6, 3); R('#f39a3c', 7, 15, 4, 1);
        R('#7a7488', 20, 12, 7, 6); R('#9a94a8', 20, 12, 7, 1);
        R('#9a94a8', 6, 3, 14, 5); R('#c8c4d4', 6, 3, 14, 1); R('#fbf6ea', 7, 4, 12, 2); R('#5a5468', 20, 4, 6, 1);
        R('#e8e0f4', 9, 0, 1, 2); R('#e8e0f4', 13, 0, 1, 2);
    });
    ART.milktable = paintSprite(16, 18, x => {
        const R = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
        R('#9a6438', 1, 4, 14, 6); R('#c48a52', 1, 4, 14, 1); R('#7a4e32', 2, 10, 2, 8); R('#7a4e32', 12, 10, 2, 8); R('#5a3a2a', 1, 9, 14, 1);
        R('#fbf6ea', 6, 5, 3, 3); R('#9a6438', 7, 5, 2, 2);
    });
}
CONTENT_INIT.push(initSlumberRooms);
/* falling home in the Linen Cupboard mends the boards, and puts the lamps out */
Player.onLand.push(p => { const a = p.area; if (a && a.id === 'slumber') { const r = a.roomAt(p.tx, p.ty); if (r && r.key === '0,2') Slumber.linenReset(a); } });
