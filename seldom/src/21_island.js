/* the island's ground, painted in code region by region (tile coordinates). Each area's file adds its things. */
const IW = 100, IH = 80;
const ISLAND_ADD = [];   /* functions (map) that put each area's things on the island */
function paintIsland() {
    const g = []; for (let y = 0; y < IH; y++) g.push(new Array(IW).fill('d'));
    const ok = (x, y) => x >= 0 && y >= 0 && x < IW && y < IH;
    const set = (x, y, c) => { if (ok(x, y)) g[y][x] = c; };
    const get = (x, y) => ok(x, y) ? g[y][x] : 'd';
    const rect = (x, y, w, h, c, only) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (!only || only.includes(get(i, j))) set(i, j, c); };
    const hline = (x0, x1, y, c) => { for (let x = x0; x <= x1; x++) set(x, y, c); };
    const vline = (x, y0, y1, c) => { for (let y = y0; y <= y1; y++) if (get(x, y) !== 'd' && get(x, y) !== '~') set(x, y, c); };
    const scatter = (x, y, w, h, c, p, seed, on) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (hash2(i, j, seed) < p && (!on || on.includes(get(i, j)))) set(i, j, c); };
    /* land: a rounded island with a wobbly coast */
    for (let y = 0; y < IH; y++) for (let x = 0; x < IW; x++) {
        const dx = Math.max(4 - x, x - 95, 0), dy = Math.max(3 - y, y - 74, 0);
        const cx = Math.max(0, Math.abs(x - 49.5) - 36), cy = Math.max(0, Math.abs(y - 39) - 26);
        const corner = Math.hypot(cx, cy) - 9;
        const wob = (hash2(x >> 2, y >> 2, 5) - 0.5) * 2.4 + (hash2(x >> 1, y >> 1, 6) - 0.5);
        if (dx + dy === 0 && corner < wob) g[y][x] = '.';
    }
    /* shallow water next to land, sand next to water */
    const near = (x, y, r, test) => { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (test(get(x + i, y + j))) return true; return false; };
    const copy = g.map(r => r.slice());
    for (let y = 0; y < IH; y++) for (let x = 0; x < IW; x++) {
        if (copy[y][x] === 'd' && near(x, y, 1, c => c === '.')) g[y][x] = '~';
        if (copy[y][x] === '.' && near(x, y, 2, c => c === 'd')) g[y][x] = 's';
    }
    const land = ['.', 's'];

    /* ---- the Woods (west): forest floor, walls of pines ---- */
    rect(4, 3, 32, 54, 'G', land);
    vline(35, 2, 57, 'P'); rect(35, 39, 1, 3, ':');            /* the edge of the woods, the path in */
    rect(27, 36, 8, 9, 'G');                                    /* the clearing at the way in */
    rect(25, 15, 2, 42, 'P');                                   /* wall A: north-south */
    rect(4, 27, 21, 2, '~'); rect(4, 26, 21, 1, 'P'); rect(4, 29, 21, 1, 'P');   /* the stream and its banks */
    rect(4, 45, 21, 8, 'P');                                    /* wall D: east-west, thick */
    rect(4, 53, 21, 3, 'G'); rect(4, 56, 31, 1, 'P'); rect(13, 56, 3, 1, ':');   /* the way down to the Hollow */
    scatter(13, 31, 11, 8, 'P', 0.05, 21, ['G']); rect(4, 40, 21, 5, 'P');   /* the west room: open to the north, thick to the south */
    rect(25, 34, 2, 1, 'G'); rect(14, 40, 1, 13, 'G');            /* the woodcutters' doors (gates, shut) */ scatter(6, 5, 18, 20, 'P', 0.09, 22, ['G']); rect(4, 13, 21, 2, 'P'); rect(14, 13, 2, 2, 'G'); scatter(27, 15, 8, 20, 'P', 0.12, 23, ['G']);
    scatter(27, 46, 8, 10, 'P', 0.14, 24, ['G']);
    /* ---- the Hollow (south-west) ---- */
    rect(4, 57, 31, 19, 'S', land.concat(['G']));
    rect(4, 60, 31, 2, '~', ['S']);                              /* the black brook */
    vline(35, 57, 76, 'P', ); rect(35, 66, 1, 1, 'S');              /* the Hollow's east hedge, and its old gate */
    scatter(5, 62, 29, 13, 'q', 0.05, 31, ['S']); rect(26, 62, 5, 3, 'S'); rect(26, 57, 5, 3, 'S');   /* clear ground either end of the ants' bridge */
    rect(11, 64, 14, 1, 'w'); rect(11, 64, 1, 7, 'w'); rect(24, 64, 1, 7, 'w'); rect(11, 70, 14, 1, 'w'); rect(16, 70, 4, 1, 'S');   /* the chapel's yard */
    rect(12, 65, 12, 5, 'S');
    for (const [x, y] of [[7, 65], [9, 67], [7, 69], [27, 66], [29, 68], [27, 70], [31, 65], [6, 72], [28, 73]]) set(x, y, 'g');
    /* ---- the Quarry (north) ---- */
    rect(36, 3, 31, 26, 'p', land.concat(['G']));
    hline(36, 65, 29, 'w'); set(49, 29, ':'); set(50, 29, ':');   /* the north wall and its gate */
    hline(36, 65, 22, 'w'); set(54, 22, 'p'); set(55, 22, 'p');   /* the inner wall, and the hourglass gate's gap */
    rect(36, 12, 21, 4, '#');                                     /* the cliff with Stillfall */
    rect(42, 16, 2, 2, '~'); rect(46, 16, 2, 2, '~');              /* the pool either side of the falls */
    rect(44, 12, 2, 3, '#'); rect(44, 15, 2, 1, 'p');             /* the falls run down the cliff; the cave mouth at its foot */
    rect(50, 12, 2, 4, 'p');                                      /* the way up the cliff */
    rect(52, 4, 15, 4, 'p'); rect(57, 8, 10, 14, '#');            /* the east cliffs */
    rect(59, 8, 2, 10, 'c'); rect(57, 18, 8, 2, 'p');            /* the chute (only the boulder goes down it) and its foot */
    rect(65, 17, 2, 4, 'p');                                      /* the ledge by the gap (behind the cracked wall) */
    rect(52, 8, 5, 4, 'p'); rect(50, 11, 2, 1, 'p');
    rect(36, 4, 16, 8, 'p'); scatter(37, 5, 14, 6, 'o', 0.0, 41);
    for (const [x, y] of [[38, 18], [53, 19], [40, 25], [62, 26], [37, 27], [55, 24], [63, 23]]) set(x, y, 'O');
    /* ---- the Cape (north-east) and the gap ---- */
    rect(67, 3, 4, 23, '~', land.concat(['p', '.', 'G']));
    rect(71, 3, 26, 22, '.', land);
    hline(67, 96, 25, '#'); hline(67, 96, 26, '#');
    scatter(72, 5, 22, 18, ',', 0.08, 51, ['.']); scatter(72, 5, 22, 18, '"', 0.06, 52, ['.']);
    rect(71, 18, 2, 3, '.');
    /* ---- the river between the village and the pasture ---- */
    rect(65, 27, 2, 50, '~'); rect(65, 22, 2, 5, '#');
    /* ---- the Pasture (east) ---- */
    rect(67, 27, 30, 40, '.', land);
    scatter(68, 28, 28, 36, '"', 0.12, 61, ['.']); scatter(68, 28, 28, 36, ',', 0.05, 62, ['.']);
    rect(67, 34, 18, 2, '~'); set(75, 34, 'v'); set(75, 35, 'v');   /* the brook, with a footbridge */
    rect(86, 44, 7, 1, 'f'); rect(86, 50, 7, 1, 'f'); rect(86, 44, 1, 7, 'f'); rect(92, 44, 1, 7, 'f');   /* Pan's pen */
    rect(87, 45, 5, 5, '.'); rect(88, 44, 3, 1, '.');
    rect(71, 51, 7, 7, '.'); for (const [x, y] of [[72, 52], [75, 52], [72, 55], [75, 55], [78, 53]]) set(x, y, 'T');   /* the orchard */
    rect(88, 54, 7, 5, '~'); rect(91, 56, 2, 1, '.');             /* the duck pond and its islet */
    for (const [x, y] of [[69, 31], [94, 31], [70, 62], [95, 60], [83, 59], [80, 30]]) set(x, y, 'T');
    for (const [x, y] of [[82, 37], [83, 37], [84, 37], [79, 47], [80, 47], [69, 48], [69, 49]]) set(x, y, 'o');
    /* ---- the Village (middle) ---- */
    rect(36, 30, 29, 26, '.', land.concat(['p']));
    rect(43, 35, 15, 10, '=');                                   /* the square */
    rect(49, 30, 2, 5, ':'); rect(50, 45, 2, 12, ':');           /* north road to the gate, south road to the harbor */
    rect(36, 39, 7, 3, ':'); rect(58, 40, 7, 2, ':');            /* west road to the woods, east road to the bridge */
    rect(39, 49, 2, 3, ':'); rect(39, 51, 11, 1, ':');
    rect(39, 36, 4, 2, ':');
    for (const [x, y] of [[37, 31], [37, 34], [37, 44], [37, 53], [46, 52], [55, 53], [63, 31], [63, 52], [61, 47], [56, 31], [44, 31], [37, 48]]) set(x, y, 'T');
    for (const [x, y] of [[42, 47], [43, 47], [56, 47], [57, 47], [47, 31], [48, 31], [52, 31], [53, 31]]) set(x, y, 'o');
    scatter(36, 30, 29, 26, ',', 0.05, 71, ['.']);
    rect(58, 41, 5, 4, '.'); rect(58, 41, 5, 1, 'f'); rect(58, 44, 5, 1, 'f'); rect(58, 41, 1, 4, 'f'); rect(62, 41, 1, 4, 'f'); set(60, 41, '.');   /* the hen run */
    /* ---- the Harbor (south) ---- */
    rect(36, 56, 29, 20, 's', ['.', 's', 'G', 'S']);
    for (let y = 64; y < IH; y++) for (let x = 38; x < 63; x++) { const edge = Math.min(x - 38, 62 - x, y - 64); if (edge >= 0 && get(x, y) !== 'd') set(x, y, edge < 2 + (hash2(x, y, 81) < 0.5 ? 0 : 1) ? '~' : 'd'); }   /* the harbor's bay */
    rect(50, 57, 2, 2, ':');
    rect(50, 61, 2, 13, 'v');                                   /* the pier */
    for (const [x, y] of [[38, 57], [62, 57], [41, 58], [60, 60]]) set(x, y, 'a');
    return g.map(r => r.join(''));
}

function buildIsland() {
    const rows = paintIsland();
    const m = new GameMap({
        id: 'island', rows, fill: 'd', outside: 'd', bg: '#3b7fc0',
        zones: [
            { law: 'wrap', x: 4, y: 14, w: 31, h: 42, name: 'Turnabout Woods' },
            { name: 'The Village', x: 36, y: 30, w: 29, h: 26 },
            { name: 'The Harbor', x: 36, y: 56, w: 29, h: 20 },
            { name: "Pan's Pasture", x: 67, y: 27, w: 30, h: 42 },
            { name: 'Stillfall Quarry', x: 36, y: 3, w: 31, h: 26 },
            { name: 'The Hollow', x: 4, y: 57, w: 31, h: 19 },
            { name: 'The Cape', x: 71, y: 3, w: 26, h: 22 },
        ],
        init(m) { for (const add of ISLAND_ADD) add(m); },
    });
    return m;
}
MAP_MAKERS.push(buildIsland);
Object.assign(START, { map: 'island', x: 50, y: 71 });
