/* ---- 2a_flowers.js ---- */
/* Flowers. Wild ones grow all over the island: pick them, and they grow back in a couple of days. Fortune sells flower
   seeds: plant them in a garden plot to harvest, or in any hole dug with the shovel to grow flowers right there. Planted
   flowers bloom the next day and give one flower a day. */
const FLOWER_REGROW = 2;
function flowerState() {
    if (!S.flowers) S.flowers = { picked: {}, planted: [] };
    return S.flowers;
}
function addWildFlowers(a) {
    a.ents = a.ents.filter(e => !e.wildFlower);
    if ((a.season || Clock.season()) === 'winter') return;
    const F = flowerState(), day = Clock.dayNum();
    W0.flowers.forEach((f, idx) => {
        if (isCleared('wf' + idx)) return;
        const pk = F.picked[idx];
        if (pk != null && day - pk < (townOrd() === 'nature' ? 1 : FLOWER_REGROW) && !(G.events && G.events.has('flowerfest') && pk < day)) return;
        const id = `flower_${f.kind}_${f.color}`;
        const [fx, fy] = tileFoot(f.x, f.y);
        const e = makeItemEnt(id, fx, fy + 1, { flowerIdx: idx, wildFlower: true });
        e.draw = ctx => spr(ctx, ITEMS[id].icon, e.x, e.y);
        e.sy = e.y - 10;
        a.add(e);
    });
}
function flowerBloomed(pl) { return Clock.dayNum() - pl.day >= 1; }
function addPlantedFlowers(a) {
    a.ents = a.ents.filter(e => !e.gardenFlower);
    for (const pl of flowerState().planted) addFlowerPlant(a, pl);
}
function addFlowerPlant(a, pl) {
    const [fx, fy] = tileFoot(pl.x, pl.y);
    const id = `flower_${pl.kind}_${pl.ci}`;
    const e = a.add({ kind: 'gflower', gardenFlower: true, x: fx, y: fy + 1, tx: pl.x, ty: pl.y, pl });
    e.sy = e.y - 8;
    e.hit = { x: pl.x * TILE, y: pl.y * TILE - 6, w: TILE, h: TILE + 6 };
    e.draw = ctx => {
        // (watered today: the soil round it darker, and a glint now and then)
        if (watered(pl)) {
            ctx.fillStyle = 'rgba(52,34,20,0.32)';
            ctx.beginPath(); ctx.ellipse(e.x, e.y - 1, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
            if ((G.t + pl.x * 13) % 80 < 10) { ctx.fillStyle = '#e8f6ff'; ctx.fillRect(e.x + 3, e.y - 9 - ((G.t + pl.x * 13) % 80 >> 2), 1, 1); }
        }
        if (!flowerBloomed(pl)) { spr(ctx, 'sprout', e.x, e.y); return; }
        const icon = ITEMS[id].icon;
        const picked = pl.pickDay === Clock.dayNum();
        spr(ctx, icon, e.x - 4, e.y - 2);
        if (!picked) spr(ctx, icon, e.x + 4, e.y - 3);
        spr(ctx, icon, e.x + 1, e.y + 1);
    };
    e.interact = () => flowerPlantMenu(e);
    return e;
}
async function flowerPlantMenu(e) {
    const pl = e.pl, day = Clock.dayNum(), id = `flower_${pl.kind}_${pl.ci}`, F = flowerState();
    const name = itemName(id).toLowerCase();
    if (heldTool() === 'can') { await waterTiles([[pl.x, pl.y]], e.x, e.y); return; }
    if (heldTool() === 'shovel') {
        // (a hybrid's color only comes from breeding: as seeds it's just the kind again)
        const k = await UI.ask(null, isHybrid(pl.ci) ? `Dig up the ${name}s? They'll go back in Sarah's pocket as plain ${pl.kind} seeds, and that color won't come back from them.`
            : `Dig up the ${name}s? They'll go back in Sarah's pocket as seeds.`, ['Dig them up', 'Leave them']);
        if (k !== 0) return;
        F.planted = F.planted.filter(q => q !== pl);
        G.area.remove(e);
        receive('seed_fl_' + pl.kind, 1);
        Sfx.play('dig');
        Save.touch();
        return;
    }
    if (!flowerBloomed(pl)) { await UI.say(null, `A little ${pl.kind} sprout. It'll bloom tomorrow. It's trying its best.`); return; }
    if (pl.pickDay === day) {
        await UI.say(null, rpick([`The ${name}s are blooming. Sarah already picked one today; they need until tomorrow.`, `Sarah admires her ${name}s. One a day, that's the deal.`]));
        return;
    }
    pl.pickDay = day;
    const p = G.player;
    faceToward(p, e);
    p.pose = 'pick'; p.poseT = 14;
    Sfx.play('pick');
    receive(id, 1);
    S.stats.flowers = (S.stats.flowers || 0) + 1;
    Save.touch();
}
/* planting seeds in a freshly dug hole */
async function plantFlowersInHole(e, seedIds) {
    if (visitorStop('plant')) return;
    const a = G.area, h = e.hole, F = flowerState(), forestF = forest();
    let sid = seedIds[0];
    if (seedIds.length > 1) {
        const j = await UI.ask(null, 'Which seeds?', seedIds.map(s => itemName(s)).concat(['Never mind']));
        if (j >= seedIds.length) return;
        sid = seedIds[j];
    }
    if (groundChar(h.x, h.y) !== 'g') { await UI.say(null, "Flowers want grass to grow in. This spot isn't grass."); return; }
    removeItem(sid, 1);
    a.remove(e);
    forestF.holes = forestF.holes.filter(q => q !== h);
    const pl = { x: h.x, y: h.y, kind: ITEMS[sid].flower, ci: rint(0, 2), day: Clock.dayNum(), pickDay: -1 };
    F.planted.push(pl);
    addFlowerPlant(a, pl);
    const p = G.player;
    p.pose = 'pick'; p.poseT = 16;
    Sfx.play('plant');
    S.stats.planted = (S.stats.planted || 0) + 1;
    Save.touch();
    UI.toast(`Planted ${itemName(sid).toLowerCase()}. They'll bloom tomorrow.`, ITEMS[sid].icon);
}
/* ---------------------------------------------------------------- the watering can */
/* Sarah waters the flowers she planted (the tile in front of her and the one each side of it: a sweep of the can). Two of
   a kind side by side, both watered, may grow a new one beside them by the next morning (flowerBreed): two of one color
   make that color again, two different colors make the third, so Sarah can grow the colors she wants. Nothing else
   needs watering (this island doesn't do chores); wild flowers just get a drink. */
ITEMS.can = { name: 'Watering can', type: 'tool', price: 600, icon: 'f_watering_can' };
const BREED_CHANCE = 0.35, BREED_MAX = 8;
function watered(pl) { return pl.wet === Clock.dayNum(); }
function waterFront() {
    const p = G.player, [px, py] = probePoint(p, 12), tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    const [sx, sy] = p.dir === 'up' || p.dir === 'down' ? [1, 0] : [0, 1];
    return waterTiles([[tx, ty], [tx - sx, ty - sy], [tx + sx, ty + sy]], px, py + 5);
}
async function waterTiles(tiles, fx, fy) {
    const p = G.player, day = Clock.dayNum();
    if (G.busy || visitorStop('water')) return;
    G.busy++;
    try {
        const dx = fx - p.x, dy = fy - p.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) p.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        p.tool = { kind: 'can', t: 0 };
        for (let i = 0; i < 34; i++) {
            p.tool.t = i; p.pose = 'water'; p.poseT = 0;
            if (i === 8) Sfx.play('pour');
            if (i >= 8 && i < 30 && i % 2 === 0) waterFx(fx, fy);
            await waitFrames(1);
        }
    } finally { p.tool = null; p.pose = null; G.busy--; }
    let n = 0;
    for (const pl of flowerState().planted) if (pl.wet !== day && tiles.some(([x, y]) => x === pl.x && y === pl.y)) { pl.wet = day; n++; }
    if (n) { S.stats.watered = (S.stats.watered || 0) + n; Save.touch(); }
}
/* a few drops falling from the can's spout onto the ground in front */
function waterFx(x, y) {
    if (typeof EnvPour !== 'undefined' && EnvPour.on()) return;          // (the new look pours real drops)
    for (let i = 0; i < 3; i++) G.fx.push({ x: x + rint(-5, 5), y: y - 16 + rint(-2, 2), vx: (R() - 0.5) * 0.3, vy: 0.6 + R() * 0.5, t: 0, life: 18, c: rpick(['#bfe6ff', '#8fd0f8', '#e8f6ff']),
        update() { this.x += this.vx; this.y += this.vy; this.vy += 0.08; },
        draw(ctx) { ctx.fillStyle = this.c; ctx.fillRect(Math.round(this.x), Math.round(this.y), 1, 2); } });
}
/* each morning: watered pairs of a kind (yesterday, both bloomed) may grow a new flower on a free bit of grass beside them */
function flowerBreed() {
    const a = G.areas && G.areas.island, F = S.flowers, day = Clock.dayNum();
    if (!a || !F || !F.planted.length || Online.visitor()) return;
    const r = mulberry(hash32(S.seed + ':bloom:' + day)), wet = F.planted.filter(pl => pl.wet === day - 1 && day - pl.day >= 2);
    const at = new Map(F.planted.map(pl => [pl.x + ',' + pl.y, pl])), born = [];
    const free = (x, y) => !at.has(x + ',' + y) && groundChar(x, y) === 'g' && !pathAt(x, y) && !a.waterAt(x, y) && !a.blockedAt(x, y)
        && !a.ents.some(o => (o.tx === x && o.ty === y) || (o.kind === 'item' && Math.floor(o.x / TILE) === x && Math.floor((o.y - 2) / TILE) === y));
    for (let i = 0; i < wet.length && born.length < BREED_MAX; i++) for (let j = i + 1; j < wet.length && born.length < BREED_MAX; j++) {
        const A = wet[i], B = wet[j];
        if (A.kind !== B.kind || Math.max(Math.abs(A.x - B.x), Math.abs(A.y - B.y)) !== 1 || A.bred === day || B.bred === day || r() >= BREED_CHANCE) continue;
        const spots = [];
        for (const P of [A, B]) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (free(P.x + dx, P.y + dy)) spots.push([P.x + dx, P.y + dy]);
        if (!spots.length) continue;
        const [x, y] = spots[Math.floor(r() * spots.length)];
        const ci = breedColor(A.ci, B.ci, r);       // (and now and then a hybrid: 2ab_hybrids.js)
        const pl = { x, y, kind: A.kind, ci, day: day - 1, pickDay: -1, bred: day };
        A.bred = B.bred = day;
        F.planted.push(pl); at.set(x + ',' + y, pl); born.push(pl);
    }
    if (!born.length) return;
    S.stats.bred = (S.stats.bred || 0) + born.length;
    for (const pl of born) addFlowerPlant(a, pl);
}
function flowerSeedIds() { return S.pocket.filter(s => s && ITEMS[s.id].flower).map(s => s.id).filter((v, i, arr) => arr.indexOf(v) === i); }
/* everyone likes flowers; some people have a favorite */
const FLOWER_LOVES = { cece: ['flower_daisy_2', 'flower_tulip_2'], coco: ['flower_tulip_2', 'flower_lily_2'], clementine: ['flower_lily_1', 'flower_cosmos_2'],
    maki: ['flower_lily_0'], david: ['flower_cosmos_0', 'flower_cosmos_1', 'flower_cosmos_2'], cuke: ['flower_daisy_1'], sully: ['flower_tulip_0'],
    kai: ['flower_lily_1'], basil: ['flower_daisy_0'], wonton: ['flower_lily_0'], chili: ['flower_tulip_0', 'flower_rose_0'], brulee: ['flower_rose_0', 'flower_rose_1'] };
for (const [id, list] of Object.entries(FLOWER_LOVES)) if (TALK[id]) TALK[id].loves = (TALK[id].loves || []).concat(list);
for (const id of NEIGHBORS) if (TALK[id]) TALK[id].likes = (TALK[id].likes || []).concat(['flower']);

