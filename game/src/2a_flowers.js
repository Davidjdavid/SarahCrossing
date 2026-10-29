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
    const day = Clock.dayNum();
    W0.flowers.forEach((f, idx) => {
        if (!wildStands(idx, day)) return;
        const id = `flower_${f.kind}_${f.color}`;
        const [fx, fy] = tileFoot(f.x, f.y);
        const e = makeItemEnt(id, fx, fy + 1, { flowerIdx: idx, wildFlower: true });
        e.draw = ctx => { const on = wildWatered(idx); if (on) flowerWetSoil(ctx, e.x, e.y + 1); spr(ctx, ITEMS[id].icon, e.x, e.y); if (on) flowerGlint(ctx, f, e.x + 2, e.y - 9, wildPartner(idx)); };
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
        // (watered today: the soil round it darker, and a sparkle over it, golden with a partner to cross with)
        const on = watered(pl);
        if (on) flowerWetSoil(ctx, e.x, e.y);
        if (!flowerBloomed(pl)) spr(ctx, 'sprout', e.x, e.y);
        else {
            const icon = ITEMS[id].icon;
            const picked = pl.pickDay === Clock.dayNum();
            spr(ctx, icon, e.x - 4, e.y - 2);
            if (!picked) spr(ctx, icon, e.x + 4, e.y - 3);
            spr(ctx, icon, e.x + 1, e.y + 1);
        }
        if (on) flowerGlint(ctx, pl, e.x + 3, e.y - 12, breedPartner(pl));
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
        await UI.say(null, rpick([`The ${name}s are blooming. Sarah already picked one today; they need until tomorrow.`, `The ${name}s sway in the breeze. Sarah can pick another tomorrow.`]));
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
   make that color again, two different colors make the third, so Sarah can grow the colors she wants. Wild flowers
   cross the same way (they grow in patches of one kind), their new flower a planted one. Nothing needs watering (this
   island doesn't do chores). */
ITEMS.can = { name: 'Watering can', type: 'tool', price: 600, icon: 'f_watering_can' };
const BREED_CHANCE = 0.5, BREED_MAX = 8;
function watered(pl) { return pl.wet === Clock.dayNum(); }
function flowerWetSoil(ctx, x, y) { ctx.fillStyle = 'rgba(52,34,20,0.32)'; ctx.beginPath(); ctx.ellipse(x, y - 1, 7, 3, 0, 0, Math.PI * 2); ctx.fill(); }
function flowerGlint(ctx, pl, x, y, gold) {
    const k = flowerSparkle(pl);
    if (!k) return;
    ctx.fillStyle = gold ? '#ffd24a' : '#f4fbff'; const r = Math.round(k * 3);
    ctx.fillRect(x - r, y, r * 2 + 1, 1); ctx.fillRect(x, y - r, 1, r * 2 + 1);
}
/* (no wild flowers inside the community garden's fence: they were in the way of its beds; David, 29 October) */
function inGardenPlot(f) { const c = W0.community; return !!(f && c && f.x >= c.x && f.x < c.x + c.w && f.y >= c.y && f.y < c.y + c.h); }
/* a wild flower watered today (its number in W0.flowers): it glints like a planted one and crosses like one */
function wildWatered(idx) { const W = flowerState().wildWet; return !!W && W[idx] === Clock.dayNum(); }
function wildPartner(idx) { const f = W0.flowers[idx]; return !!f && wildWatered(idx) && breedSoon().has(f.x + ',' + f.y); }
/* the wild flowers watered on a day that still stand (not picked since, nor cleared), as partners to cross: they grow in
   patches of one kind, and watering a patch used to come to nothing (David, 29 October) */
function wildStands(idx, day) {
    const pk = flowerState().picked[idx];
    if (isCleared('wf' + idx) || Clock.season() === 'winter' || inGardenPlot(W0.flowers[idx])) return false;
    return !(pk != null && day - pk < (townOrd() === 'nature' ? 1 : FLOWER_REGROW) && !(G.events && G.events.has('flowerfest') && pk < day));
}
function wildWetOn(day) {
    const F = flowerState(), W = F.wildWet || {}, B = F.wildBred || {}, out = [];
    for (const k of Object.keys(W)) {
        const idx = +k, f = W0.flowers[idx];
        if (!f || W[k] !== day || !wildStands(idx, day)) continue;
        out.push({ x: f.x, y: f.y, kind: f.kind, ci: f.color, wild: idx, bred: B[idx] });
    }
    return out;
}
/* a watered flower sparkles, so Sarah can tell it's had its drink (David, 28 October and 29 October: "the flowers aren't
   sparkling when I water them"): a burst of glints just as the water reaches it, then one every few seconds, each flower
   at its own moment, a glint that swells and fades in under half a second; 0 between glints */
function flowerSparkle(pl) {
    const at = (waterTiles.at || {})[pl.x + ',' + pl.y], since = at != null ? G.t - at : 1e9;
    if (since >= 0 && since < 80) return 0.55 + 0.45 * Math.abs(Math.sin(since / 80 * Math.PI * 3));
    const ph = (G.t + (hash32(pl.x + ',' + pl.y) % 240)) % 240;
    return ph < 26 ? Math.sin(ph / 26 * Math.PI) : 0;
}
/* a watered flower glints gold only when it will cross-breed tomorrow morning as things stand (David, 29 October: a lone
   flower, or one beside another kind or an unwatered one, glinted gold too). breedSoon is tomorrow's pairs (their tiles),
   worked out again now and then and whenever something's watered */
function breedPartner(pl) { return watered(pl) && breedSoon().has(pl.x + ',' + pl.y); }
function breedSoon() {
    const B = breedSoon, day = Clock.dayNum();
    if (!B.set || B.day !== day || B.t == null || Math.abs(G.t - B.t) > 90) { B.set = new Set(); for (const b of breedPairs(day + 1)) { B.set.add(b.A.x + ',' + b.A.y); B.set.add(b.B.x + ',' + b.B.y); } B.day = day; B.t = G.t; }
    return B.set;
}
/* the can waters the tile in front of the one Sarah stands on (or the flower she's facing) and the one each side of it
   (David, 29 October: it used to reach only a step, often her own tile) */
function waterFront(e) {
    const p = G.player, [dx, dy] = DIRV[p.dir];
    let tx = Math.floor(p.x / TILE) + Math.sign(dx), ty = Math.floor((p.y - 2) / TILE) + Math.sign(dy);
    if (e && e.gardenFlower) { tx = e.tx; ty = e.ty; }
    else if (e && e.wildFlower && W0.flowers[e.flowerIdx]) { tx = W0.flowers[e.flowerIdx].x; ty = W0.flowers[e.flowerIdx].y; }
    const [sx, sy] = p.dir === 'up' || p.dir === 'down' ? [1, 0] : [0, 1];
    return waterTiles([[tx, ty], [tx - sx, ty - sy], [tx + sx, ty + sy]], (tx + 0.5) * TILE, (ty + 0.7) * TILE);
}
async function waterTiles(tiles, fx, fy) {
    const p = G.player, day = Clock.dayNum();
    if (G.busy || visitorStop('water')) return;
    G.busy++;
    try {
        const dx = fx - p.x, dy = fy - p.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) p.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        // (where the water lands: the tile in front, EnvPour sends the drops out to it)
        p.tool = { kind: 'can', t: 0, at: [fx, fy] };
        for (let i = 0; i < 34; i++) {
            p.tool.t = i; p.pose = 'water'; p.poseT = 0;
            if (i === 8) Sfx.play('pour');
            if (i >= 8 && i < 30 && i % 2 === 0) waterFx(fx, fy);
            await waitFrames(1);
        }
    } finally { p.tool = null; p.pose = null; G.busy--; }
    let n = 0;
    // (when the water reached each tile, kept off the save, for the burst of glints: flowerSparkle)
    const F = flowerState(), on = (x, y) => tiles.some(([a, b]) => a === x && b === y), at = waterTiles.at || (waterTiles.at = {});
    for (const [x, y] of tiles) at[x + ',' + y] = G.t;
    breedSoon.t = null;
    for (const pl of F.planted) if (on(pl.x, pl.y) && pl.wet !== day) { pl.wet = day; n++; }
    // (wild ones too: they glint, though only planted ones cross; F.wildWet[idx] is the day)
    W0.flowers.forEach((f, idx) => {
        if (!on(f.x, f.y) || !wildStands(idx, day)) return;
        const W = F.wildWet || (F.wildWet = {});
        for (const k of Object.keys(W)) if (W[k] !== day) delete W[k];
        if (W[idx] !== day) { W[idx] = day; n++; }
    });
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
/* which pairs grow a new flower on the morning of day, and where, from the flowers as they are (nothing changed: the
   morning's flowerBreed plants them, and today's gold glints are tomorrow's pairs worked out now, breedSoon) */
function breedPairs(day) {
    const a = G.areas && G.areas.island, F = S.flowers;
    if (!a || !F) return [];
    // (the planted ones in bloom watered the day before, then the wild ones; nothing new grows where a wild one stands)
    const r = mulberry(hash32(S.seed + ':bloom:' + day)), wet = F.planted.filter(pl => pl.wet === day - 1 && day - pl.day >= 2).concat(wildWetOn(day - 1));
    const at = new Set(F.planted.map(pl => pl.x + ',' + pl.y).concat(W0.flowers.map(f => f.x + ',' + f.y))), bred = new Set(), born = [];
    const free = (x, y) => !at.has(x + ',' + y) && groundChar(x, y) === 'g' && !pathAt(x, y) && !a.waterAt(x, y) && !a.blockedAt(x, y)
        && !a.ents.some(o => (o.tx === x && o.ty === y) || (o.kind === 'item' && Math.floor(o.x / TILE) === x && Math.floor((o.y - 2) / TILE) === y));
    for (let i = 0; i < wet.length && born.length < BREED_MAX; i++) for (let j = i + 1; j < wet.length && born.length < BREED_MAX; j++) {
        const A = wet[i], B = wet[j];
        if (A.kind !== B.kind || Math.max(Math.abs(A.x - B.x), Math.abs(A.y - B.y)) !== 1 || A.bred === day || B.bred === day || bred.has(A) || bred.has(B) || r() >= BREED_CHANCE) continue;
        const spots = [];
        for (const P of [A, B]) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (free(P.x + dx, P.y + dy)) spots.push([P.x + dx, P.y + dy]);
        if (!spots.length) continue;
        const [x, y] = spots[Math.floor(r() * spots.length)];
        const ci = breedColor(A.ci, B.ci, r);       // (and now and then a hybrid: 2ab_hybrids.js)
        bred.add(A); bred.add(B); at.add(x + ',' + y);
        born.push({ A, B, pl: { x, y, kind: A.kind, ci, day: day - 1, pickDay: -1, bred: day } });
    }
    return born;
}
function flowerBreed() {
    const a = G.areas && G.areas.island, F = S.flowers, day = Clock.dayNum();
    if (!a || !F || Online.visitor()) return;
    const wb = {};
    const born = breedPairs(day).map(({ A, B, pl }) => { for (const P of [A, B]) { P.bred = day; if (P.wild != null) wb[P.wild] = day; } F.planted.push(pl); return pl; });
    if (Object.keys(wb).length) F.wildBred = wb;
    if (!born.length) return;
    S.stats.bred = (S.stats.bred || 0) + born.length;
    for (const pl of born) addFlowerPlant(a, pl);
}
function flowerSeedIds() { return S.pocket.filter(s => s && ITEMS[s.id].flower).map(s => s.id).filter((v, i, arr) => arr.indexOf(v) === i); }
/* everyone likes flowers; some people have a favorite */
const FLOWER_LOVES = { cece: ['flower_daisy_2', 'flower_tulip_2'], coco: ['flower_tulip_2', 'flower_lily_2'], clementine: ['flower_lily_1', 'flower_cosmos_2'],
    maki: ['flower_lily_0'], cuke: ['flower_daisy_1'], sully: ['flower_tulip_0'],
    kai: ['flower_lily_1'], basil: ['flower_daisy_0'], wonton: ['flower_lily_0'], chili: ['flower_tulip_0', 'flower_rose_0'], brulee: ['flower_rose_0', 'flower_rose_1'] };
for (const [id, list] of Object.entries(FLOWER_LOVES)) if (TALK[id]) TALK[id].loves = (TALK[id].loves || []).concat(list);
for (const id of NEIGHBORS) if (TALK[id]) TALK[id].likes = (TALK[id].likes || []).concat(['flower']);

