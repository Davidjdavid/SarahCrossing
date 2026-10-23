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
        if (pk != null && day - pk < FLOWER_REGROW && !(G.events && G.events.has('flowerfest') && pk < day)) return;
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
    if (heldTool() === 'shovel') {
        const k = await UI.ask(null, `Dig up the ${name}s? They'll go back in Sarah's pocket as seeds.`, ['Dig them up', 'Leave them']);
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
function flowerSeedIds() { return S.pocket.filter(s => s && ITEMS[s.id].flower).map(s => s.id).filter((v, i, arr) => arr.indexOf(v) === i); }
/* everyone likes flowers; some people have a favorite */
const FLOWER_LOVES = { cece: ['flower_daisy_2', 'flower_tulip_2'], coco: ['flower_tulip_2', 'flower_lily_2'], clementine: ['flower_lily_1', 'flower_cosmos_2'],
    maki: ['flower_lily_0'], david: ['flower_cosmos_0', 'flower_cosmos_1', 'flower_cosmos_2'], cuke: ['flower_daisy_1'], sully: ['flower_tulip_0'],
    kai: ['flower_lily_1'], basil: ['flower_daisy_0'], wonton: ['flower_lily_0'], chili: ['flower_tulip_0'] };
for (const [id, list] of Object.entries(FLOWER_LOVES)) if (TALK[id]) TALK[id].loves = (TALK[id].loves || []).concat(list);
for (const id of NEIGHBORS) if (TALK[id]) TALK[id].likes = (TALK[id].likes || []).concat(['flower']);

