/* The Hollow: one big outdoor map put together from nine blocks of 64x40 tiles (a region each, the town in
   the middle). Each block has its own theme (palette), music and names; forest ('Y') gets its trees placed
   automatically; unfinished blocks are fog. */

const OW = { bw: 64, bh: 40, cols: 3, rows: 3, blocks: {} };
function defBlock(b) { OW.blocks[b.bx + ',' + b.by] = b; return b; }

const OW_LEGEND = {
    'Y': { k: 'tree', p: 'forest' }, 'X': { k: 'roof', p: 'grass' },
    'T': { k: 'grass', p: 'grass', ent: 'tree', props: { look: 'tree' } },
    'A': { k: 'grass', p: 'grass', ent: 'tree', props: { look: 'tree_apple' } },
    'b': { k: 'grass', p: 'grass', ent: 'deco', props: { look: 'bush' } },
    'B': { k: 'grass', p: 'grass', ent: 'deco', props: { look: 'bush_berry' } },
    'r': { k: 'grass', p: 'grass', ent: 'deco', props: { look: 'rock' } },
    'f': { k: 'grass', p: 'grass', ent: 'deco', props: { look: 'fence' } },
    'l': { k: 'grass', p: 'grass', ent: 'deco', props: { look: 'fence_v' } },
    'h': { k: 'grass', p: 'grass', ent: 'deco', props: { look: 'haybale' } },
    'n': { k: 'grass', p: 'grass', ent: 'rest' },
    'w': { k: 'grass', p: 'flowers', ent: 'deco', props: { look: 'flowerbed', solid: [[0, 0]] } },
    'm': { k: 'path', p: 'cobble', ent: 'deco', props: { look: 'flowerbed', solid: [[0, 0]] } },
    /* a low rock in deep water: nothing walks or floats onto it; a hook flies over it */
    'Q': { k: 'low', p: 'deep', ent: 'deco', props: { look: 'rock', solid: false } },
};

function buildOverworld() {
    const W2 = OW.bw * OW.cols, H2 = OW.bh * OW.rows;
    const rows = [];
    const themes = [];
    const ents = [], regions = [];
    for (let y = 0; y < H2; y++) rows.push(new Array(W2).fill('%'));
    for (let by = 0; by < OW.rows; by++) for (let bx = 0; bx < OW.cols; bx++) {
        const b = OW.blocks[bx + ',' + by];
        const ox = bx * OW.bw, oy = by * OW.bh;
        themes.push(b ? b.theme : 'town');
        if (!b) continue;
        const br = b.rows;
        for (let y = 0; y < OW.bh; y++) for (let x = 0; x < OW.bw; x++) rows[oy + y][ox + x] = (br[y] && br[y][x]) || '%';
        for (const e of b.ents || []) {
            const o = Object.assign({}, e, { x: e.x + ox, y: e.y + oy, block: b.id });
            /* paths and spots given with a thing are in the block's own tiles too */
            if (o.trace) o.trace = o.trace.map(([x, y]) => [x + ox, y + oy]);
            if (o.startAt) o.startAt = [o.startAt[0] + ox, o.startAt[1] + oy];
            if (o.at) o.at = [o.at[0] + ox, o.at[1] + oy];
            if (o.route) o.route = o.route.map(([x, y, ...w]) => [x + ox, y + oy, ...w]);
            ents.push(o);
        }
        regions.push({ name: b.name, sub: b.sub, x: ox, y: oy, w: OW.bw, h: OW.bh, music: b.music, mark: true, id: b.id });
        for (const r of b.regions || []) regions.unshift(Object.assign({}, r, { x: r.x + ox, y: r.y + oy, music: r.music || b.music }));
    }
    /* trees on the forest */
    for (let y = 0; y < H2 - 1; y += 2) for (let x = (y / 2) % 2; x < W2 - 1; x += 2) {
        if (rows[y][x] === 'Y' && rows[y + 1][x] === 'Y' && rows[y][x + 1] === 'Y' && rows[y + 1][x + 1] === 'Y') {
            const b = OW.blocks[Math.floor(x / OW.bw) + ',' + Math.floor(y / OW.bh)];
            const looks = (b && b.forest) || ['tree', 'tree2'];
            const look = looks[Math.floor(hash2(x, y, 5) * looks.length)];
            ents.push({ k: 'tree', x, y, look, deco: true });
        }
    }
    defArea({
        id: 'hollow', name: 'The Hollow', family: 'outdoor', theme: 'town',
        rows: rows.map(r => r.join('')),
        legend: Object.assign({}, OW_LEGEND, ...Object.values(OW.blocks).map(b => b.legend || {})),
        ents, regions,
        themeAt: (tx, ty) => themes[clamp(Math.floor(ty / OW.bh), 0, OW.rows - 1) * OW.cols + clamp(Math.floor(tx / OW.bw), 0, OW.cols - 1)],
        music: 'town', quietName: false,
        tick: a => { for (const b of Object.values(OW.blocks)) if (b.tick) b.tick(a); },
        onEnter: (a, o) => { for (const b of Object.values(OW.blocks)) if (b.onEnter) b.onEnter(a, o); },
    });
}
CONTENT_INIT.push(buildOverworld);

/* rest spots: a stump with a stitched cross. Sit (Z) to tie off your thread here: your mark, and a save */
SPAWN.rest = (tx, ty, p) => {
    const pr = new Prop(tx, ty, { im: ART.stump, solid: [[0, 0]], oy: 2 });
    pr.interact = () => {
        Script.run(function* () {
            const pl = G.player;
            const cut = Progress.flag('cut_self');
            /* (said in full the first time, and the first time after your thread's cut; then short: every save out of doors) */
            const full = cut ? firstTime('stumpCut') : !Progress.flag('rested');
            const i = yield* ask(null, cut ? (full ? "A stump with a little red cross stitched into the bark. There's nothing to tie off any more. Remember this place?" : 'The stitched stump. Remember this place?') : full ? 'A stump with a little red cross stitched into the bark. Tie off your thread here?' : 'The stitched stump. Tie off your thread here?', [cut ? 'Remember it (save)' : 'Tie off (save)', 'Not now']);
            if (i === 0) {
                pl.setMark(tx, ty + 1);
                Inv.hp = Math.max(Inv.hp, Math.min(Inv.maxHp, Inv.hp + 2));
                Save.write(); Sfx.play('save');
                UI.toast(Progress.flag('cut_self') ? 'Remembered. (Saved.)' : 'Tied off. (Saved.)');
                Progress.set('rested');
            }
        });
        return true;
    };
    pr.talkBox = (pl, f) => f.tx === tx && f.ty === ty;
    return pr;
};
