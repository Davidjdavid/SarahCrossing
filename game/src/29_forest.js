/* ---- 29_forest.js ---- */
/* The axe and the shovel. Chop trees for wood (three pieces a tree a day), chop them down if you really mean it,
   dig holes, plant saplings or bury fruit to grow new trees, dig up stumps, dig for clams on the beach, and dig up
   the glowing spot for sand dollars (bury some in that hole and a money tree grows). */
function forest() {
    if (!S.forest) S.forest = { chopped: {}, planted: [], holes: [], wood: { day: -1, n: {} }, glow: { day: -1, dug: false }, clams: { day: -1, dug: [] } };
    const F = S.forest;
    const day = Clock.dayNum();
    F.holes = F.holes.filter(h => h.day === day);          // holes fill themselves in overnight
    return F;
}
const GROW_DAYS = 3;
function plantStage(pl) { return clamp(Clock.dayNum() - pl.day, 0, GROW_DAYS); }

/* ---------------------------------------------------------------- holding tools */
const HELD_TOOLS = ['axe', 'shovel'];
function heldTool() {
    if (S.held && !pocketCount(S.held)) S.held = null;
    return S.held || null;
}
function setHeld(id) {
    S.held = id;
    updateToolButton();
    Sfx.ui(id ? 'ok' : 'close');
    Save.touch();
}
function cycleTool() {
    if (G.busy || UI.modal) return;
    const owned = HELD_TOOLS.filter(t => pocketCount(t));
    if (!owned.length) { UI.toast("No tools yet. Fortune's shop has an axe and a shovel on the rack.", 'ui_hand'); return; }
    const order = [null].concat(owned);
    const i = order.indexOf(heldTool());
    const next = order[(i + 1) % order.length];
    setHeld(next);
    UI.toast(next ? `Holding the ${itemName(next).toLowerCase()}` : 'Hands free', next ? itemIcon(next) : 'ui_hand');
}
function updateToolButton() {
    const b = $('#bTool');
    if (!b) return;
    const ic = b.querySelector('.ic');
    const want = heldTool() ? itemIcon(heldTool()) : 'ui_hand';
    if (ic.dataset.icon !== want) { ic.dataset.icon = want; ic.innerHTML = ''; ic.appendChild(iconCanvas(want, 28)); }
    b.lastChild.textContent = heldTool() ? itemName(heldTool()) : 'Tools';
}

/* drawn with Sarah: the tool she's carrying, or mid-swing */
/* how far out from Sarah's middle her hands are: the HD-2D view's Sarah is slimmer than the 16px one */
function toolDx(dx) { return hdOn() ? Math.round(dx * 0.6) : dx; }
function drawToolUnder(ctx, p, y) {
    const t = heldTool();
    if (!t || p.hidden) return;
    if (p.tool) {
        const side = p.dir === 'left' || p.dir === 'right';
        if (p.tool.kind === 'axe' && p.tool.t < 10 && side) spr(ctx, 'axe_up', p.x + toolDx(p.dir === 'left' ? 5 : -5), y - 15, p.dir === 'left');
        return;
    }
    if (p.pose) return;
    if (p.dir === 'up') spr(ctx, 'carry_' + t, p.x + toolDx(-7), y - 1);
    else if (p.dir === 'left' || p.dir === 'right') spr(ctx, 'carry_' + t, p.x + toolDx(p.dir === 'left' ? 5 : -5), y, p.dir === 'left');
}
function drawToolOver(ctx, p, y) {
    const t = heldTool();
    if (!t || p.hidden) return;
    const flip = p.dir === 'left', side = p.dir === 'left' || p.dir === 'right';
    if (p.tool) {
        const k = p.tool.kind, ph = p.tool.t < (k === 'axe' ? 10 : 12) ? 0 : 1;
        if (k === 'axe') {
            if (side) { if (ph === 1) spr(ctx, 'axe_fwd', p.x + toolDx(flip ? -3 : 3), y - 13, flip); }
            else if (p.dir === 'up') spr(ctx, 'axe_up', p.x + 1, y - (ph ? 27 : 19));
            else spr(ctx, 'axe_up', p.x + toolDx(2), y - (ph ? 2 : 21));
        } else {
            if (ph === 0) spr(ctx, 'shovel_dig', p.x + toolDx(side ? (flip ? -4 : 4) : 3), y - 3, flip);
            else spr(ctx, 'shovel_up', p.x + toolDx(side ? (flip ? -8 : 8) : 7), y - 1, flip);
        }
        return;
    }
    if (p.pose || p.dir !== 'down') return;
    spr(ctx, 'carry_' + t, p.x + toolDx(7), y - 1);
}
/* one swing of a tool (the player can't move meanwhile) */
async function toolSwing(kind, onHit) {
    const p = G.player;
    p.tool = { kind, t: 0 };
    const hitAt = kind === 'axe' ? 10 : 12, len = kind === 'axe' ? 22 : 26;
    for (let i = 0; i < len; i++) {
        p.tool.t = i;
        if (kind === 'axe') p.pose = i >= hitAt && (p.dir === 'left' || p.dir === 'right') ? 'hug' : (p.dir === 'down' && i < hitAt ? 'cheer' : null);
        else p.pose = i >= hitAt && p.dir === 'down' ? 'pick' : null;
        p.poseT = 0;
        if (i === hitAt && onHit) onHit();
        await waitFrames(1);
    }
    p.tool = null; p.pose = null;
}
function dirtFx(x, y, col) {
    for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (R() - 0.5) * 2.2, sp = 0.6 + R() * 1.4;
        G.fx.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, life: 26 + rint(0, 10), c: col || rpick(['#8a5a3a', '#6b4a2a', '#a8733f']),
            update() { this.x += this.vx; this.y += this.vy; this.vy += 0.12; },
            draw(ctx) { ctx.fillStyle = this.c; ctx.fillRect(Math.round(this.x), Math.round(this.y), 2, 2); } });
    }
}
function leafFx(x, y) {
    const season = Clock.season();
    const cols = { spring: ['#6cc063', '#ffd1e1'], summer: ['#4fae55', '#7fcf6e'], fall: ['#e39a3b', '#c8702d'], winter: ['#ffffff', '#dfe8f2'] }[season];
    for (let i = 0; i < 14; i++) G.fx.push({ x: x + rint(-12, 12), y: y + rint(-30, -10), vx: (R() - 0.5) * 1.2, vy: 0.3 + R() * 0.6, t: 0, life: 50, c: rpick(cols),
        update() { this.x += this.vx + Math.sin(this.t / 6) * 0.3; this.y += this.vy; },
        draw(ctx) { ctx.fillStyle = this.c; ctx.globalAlpha = Math.min(1, (this.life - this.t) / 20); ctx.fillRect(Math.round(this.x), Math.round(this.y), 2, 1); ctx.globalAlpha = 1; } });
}

/* ---------------------------------------------------------------- the forest on the island map */
function addForest(a) {
    const F = forest();
    a.ents = a.ents.filter(e => !e.forest);
    for (const [id, c] of Object.entries(F.chopped)) if (c.stump) addStump(a, id, c);
    for (const pl of F.planted) addPlanted(a, pl);
    for (const h of F.holes) addHole(a, h);
    const g = glowToday(a);
    if (g) addGlow(a, g);
    clamSpotsToday(a).forEach((c, i) => addClamSpot(a, c, i));
    addQuestWorld(a);
}
function addStump(a, id, c) {
    const [fx, fy] = tileFoot(c.x, c.y);
    const e = a.add({ kind: 'stump', forest: true, id, tx: c.x, ty: c.y, frame: c.palm ? 'stump_palm' : 'stump', x: fx, y: fy });
    e.hit = { x: c.x * TILE, y: c.y * TILE - 4, w: TILE, h: TILE + 4 };
    e.interact = () => heldTool() === 'shovel' ? digAt(c.x, c.y) : UI.say(null, rpick(['A stump. Sarah sits on it for a second. Very stumpy.', 'A tree stump. It has a lot of rings. It has seen things.', 'A stump. A shovel would get it out.']));
    a.block(c.x, c.y);
}
function addPlanted(a, pl) {
    const st = plantStage(pl);
    const [fx, fy] = tileFoot(pl.x, pl.y);
    const season = a.season || Clock.season();
    let e;
    if (st >= GROW_DAYS) {
        if (pl.kind === 'fruit') e = makeFruitTree(pl.id, fx, fy, pl.fruit, pl.x, pl.y);
        else if (pl.kind === 'palm') e = makePalm(pl.id, fx, fy, pl.fruit === 'coconut', pl.x, pl.y);
        else if (pl.kind === 'money' && !pl.paid) {
            e = makeTree(pl.id, fx, fy, 'tree_money', pl.x, pl.y);
            e.money = pl;
            e.draw = ctx => {
                const sx = e.shake ? Math.round(Math.sin(e.shake * 1.3) * 1.5) : 0;
                spr(ctx, 'tree_money', e.x + sx, e.y);
                for (const [ox, oy] of [[-8, -22], [6, -26], [0, -15]]) spr(ctx, 'money_bag_s', e.x + ox + sx, e.y + oy);
            };
        } else e = makeTree(pl.id, fx, fy, pl.look === 'blossom' ? `tree_blossom_${season}` : `tree_${pl.look || 'oak'}_${season}_${(pl.x * 7 + pl.y * 13) % 3}`, pl.x, pl.y);
    } else {
        e = { kind: 'young', id: pl.id, tx: pl.x, ty: pl.y, x: fx, y: fy, frame: st === 0 ? 'sprout' : st === 1 ? `sapling_${season}` : `young_${season}` };
        e.hit = { x: pl.x * TILE, y: fy - (st === 0 ? 12 : st === 1 ? 24 : 32), w: TILE, h: st === 0 ? 14 : st === 1 ? 26 : 34 };
        e.interact = () => heldTool() === 'shovel' ? digAt(pl.x, pl.y) : UI.say(null, `${pl.kind === 'money' ? 'A young tree. It glints a little.' : pl.kind === 'fruit' ? `A young ${itemName(pl.fruit).toLowerCase()} tree.` : 'A young tree.'} It'll be fully grown in ${GROW_DAYS - st} ${plural(GROW_DAYS - st, 'day')}. (No watering needed. This island doesn't do chores.)`);
    }
    e.forest = true; e.planted = pl;
    a.add(e);
    a.block(pl.x, pl.y);
    return e;
}
function addHole(a, h) {
    const [fx, fy] = tileFoot(h.x, h.y);
    const sand = groundChar(h.x, h.y) === 's';
    const e = a.add({ kind: 'hole', forest: true, layer: 0, tx: h.x, ty: h.y, hole: h, x: fx, y: fy - 2, frame: sand ? 'hole_sand' : 'hole' });
    e.hit = { x: h.x * TILE, y: h.y * TILE, w: TILE, h: TILE };
    e.interact = () => holeMenu(e);
    if (h.gold) e.draw = ctx => { spr(ctx, e.frame, e.x, e.y); if ((G.t >> 3) % 6 === 0) spr(ctx, 'twinkle', e.x + 4, e.y - 6); };
    return e;
}

/* the glowing spot: one a day, somewhere in the grass */
function grassSpots(area) {
    if (grassSpots.cache) return grassSpots.cache;
    const a = area || G.areas.island, out = [];
    const sp = Object.values(W0.spots);
    for (let y = 2; y < a.h - 2; y++) for (let x = 2; x < a.w - 2; x++) {
        if (a.grid[y][x] !== 'g' || W0.coll[y][x] === '1' || W0.reach[y][x] !== '1') continue;
        let ok = true;
        for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1; dx++) if ('pcwdF'.includes(a.grid[y + dy][x + dx]) || W0.coll[y + dy][x + dx] === '1') { ok = false; break; }
        if (ok && !sp.some(s => Math.abs(s.x - x) <= 1 && Math.abs(s.y - y) <= 1)) out.push([x, y]);
    }
    grassSpots.cache = out;
    return out;
}
function glowToday(area) {
    const F = forest(), day = Clock.dayNum();
    if (F.glow.day === day && F.glow.dug) return null;
    const a = area || G.areas.island;
    const r = mulberry(hash32(S.seed + ':glow:' + day));
    const cands = grassSpots(a);
    for (let k = 0; k < 80; k++) {
        const [x, y] = cands[Math.floor(r() * cands.length)];
        if (a && !a.blockedAt(x, y) && !canPlant(x, y, false, a)) return { x, y };      // a money tree must be able to grow there
    }
    return null;
}
function addGlow(a, g) {
    const [fx, fy] = tileFoot(g.x, g.y);
    const e = a.add({ kind: 'glow', forest: true, layer: 0, tx: g.x, ty: g.y, x: fx, y: fy - 3 });
    e.hit = { x: g.x * TILE, y: g.y * TILE, w: TILE, h: TILE };
    e.draw = ctx => {
        const k = (Math.sin(G.t / 12) + 1) / 2;
        ctx.fillStyle = `rgba(255,236,140,${0.35 + 0.35 * k})`;
        ctx.fillRect(Math.round(e.x) - 3, Math.round(e.y) - 1, 6, 2);
        ctx.fillRect(Math.round(e.x) - 1, Math.round(e.y) - 3, 2, 6);
        if ((G.t >> 4) % 3 === 0) spr(ctx, 'twinkle', e.x + 5, e.y - 5);
    };
    e.interact = () => heldTool() === 'shovel' ? digAt(g.x, g.y) : UI.say(null, 'Something is glinting in the grass. A shovel would help.');
}
/* clams: little bubbling spots in the sand, a few every day */
function clamSpotsToday(area) {
    const F = forest(), day = Clock.dayNum();
    if (F.clams.day !== day) F.clams = { day, dug: [] };
    const r = mulberry(hash32(S.seed + ':clams:' + day));
    const spots = shuffled(beachSpots(area), r).slice(0, 30);
    const out = [];
    for (let i = 0; i < 5 && i < spots.length; i++) out.push(F.clams.dug.includes(i) ? null : { x: spots[i][0], y: spots[i][1] });
    return out;
}
function addClamSpot(a, c, i) {
    if (!c || a.blockedAt(c.x, c.y)) return;
    const [fx, fy] = tileFoot(c.x, c.y);
    const e = a.add({ kind: 'clamspot', forest: true, layer: 0, tx: c.x, ty: c.y, clamIdx: i, x: fx, y: fy - 4 });
    e.hit = { x: c.x * TILE, y: c.y * TILE, w: TILE, h: TILE };
    e.draw = ctx => {
        const ph = (G.t + i * 23) % 90;
        ctx.fillStyle = '#b8955e';
        ctx.fillRect(Math.round(e.x) - 1, Math.round(e.y), 3, 1);
        if (ph < 30) { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(Math.round(e.x) + (ph > 15 ? 1 : 0), Math.round(e.y) - 1 - (ph >> 3), 1, 1); }
    };
    e.interact = () => heldTool() === 'shovel' ? digAt(c.x, c.y) : UI.say(null, 'Little bubbles are coming up out of the sand. Something is down there. A shovel would help.');
}

/* ---------------------------------------------------------------- chopping */
function isChoppable(e) { return e && (e.kind === 'tree' || e.kind === 'fruittree') && e.tx != null; }
async function chopTree(e) {
    const p = G.player;
    if (G.busy || visitorStop('chop')) return;
    G.busy++;
    try {
        faceToward(p, e);
        await toolSwing('axe', () => {
            e.shake = 16;
            Sfx.play('chop');
            Critters.startle(e.x, e.y - 20, 90);
            leafFx(e.x, e.y);
        });
        const F = forest(), day = Clock.dayNum();
        if (F.wood.day !== day) F.wood = { day, n: {} };
        const n = F.wood.n[e.id] || 0;
        if (n < 3) {
            F.wood.n[e.id] = n + 1;
            const side = p.x < e.x ? -1 : 1;
            const x = e.x + side * rint(6, 11), y = e.y + rint(6, 12);
            spawnDrop('wood', G.area.solidPx(x, y - 2) ? p.x + rint(-6, 6) : x, G.area.solidPx(x, y - 2) ? p.y + 3 : y);
            S.stats.wood = (S.stats.wood || 0) + 1;
            Save.touch();
        } else {
            await waitFrames(6);
            const k = await UI.ask(null, e.fruit ? "That's all the wood for today. Chop the whole tree down? (It won't grow fruit anymore.)" : "That's all the wood this tree has today. Chop it down?", ['Chop it down', 'Leave it']);
            if (k === 0) await fellTree(e);
        }
    } finally { G.busy--; }
}
async function fellTree(e) {
    const a = G.area, F = forest();
    Sfx.play('timber');
    for (let i = 0; i < 18; i++) { e.shake = 18 - i; if (i % 6 === 0) leafFx(e.x, e.y); await waitFrames(2); }
    if (e.fruit && treeHasFruit(e)) for (const ox of [-10, 0, 10]) spawnDrop(e.fruit, e.x + ox, e.y + 10);
    const pal = e.frame && String(e.frame).startsWith('palm') || e.kind === 'fruittree' && e.fruit === 'coconut' || (e.planted && e.planted.kind === 'palm');
    a.remove(e);
    a.block(e.tx, e.ty, 0);
    F.chopped[e.id] = { x: e.tx, y: e.ty, day: Clock.dayNum(), stump: true, palm: !!pal };
    if (e.planted) F.planted = F.planted.filter(q => q !== e.planted);
    addStump(a, e.id, F.chopped[e.id]);
    spawnDrop('wood', e.x + 10, e.y + 8);
    dirtFx(e.x, e.y - 4, '#9a6b45');
    S.stats.felled = (S.stats.felled || 0) + 1;
    Save.touch();
    await UI.say(null, rpick(['TIMBER! Sarah yells it quietly, just in case.', 'The tree comes down. Sarah feels a little bad. The stump seems fine about it.', 'Down it goes. A stump is left behind. Stumps are very patient.']));
}

/* ---------------------------------------------------------------- digging */
function forestAt(a, tx, ty) { return a.ents.find(e => e.forest && e.tx === tx && e.ty === ty); }
async function digAt(tx, ty) {
    const a = G.area, p = G.player, F = forest();
    if (G.busy || visitorStop('dig')) return;
    if (a.id !== 'island') { await UI.say(null, "Sarah can't dig in here. The floor would be very upset."); return; }
    const e = forestAt(a, tx, ty);
    const [fx, fy] = tileFoot(tx, ty);
    const sand = groundChar(tx, ty) === 's';
    const act = async fn => {
        G.busy++;
        try {
            const dx = fx - p.x, dy = fy - 6 - (p.y - 6);
            p.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
            await toolSwing('shovel', () => { Sfx.play('dig'); dirtFx(fx, fy - 4, sand ? '#d9b877' : null); });
            await fn();
        } finally { G.busy--; }
    };
    if (e && e.kind === 'hole') { await holeMenu(e); return; }
    if (e && e.kind === 'treasure') { await Quests.digTreasure(e, act); return; }
    if (e && e.kind === 'stump') {
        await act(async () => {
            a.remove(e); a.block(tx, ty, 0);
            const c = F.chopped[e.id];
            if (e.id.startsWith('pt')) delete F.chopped[e.id]; else c.stump = false;
            S.stats.stumps = (S.stats.stumps || 0) + 1;
            Save.touch();
            UI.toast('Sarah dug up the stump. There is room for a new tree.', 'tool_shovel');
        });
        return;
    }
    if (e && e.kind === 'young') {
        await act(async () => {
            const pl = e.planted;
            a.remove(e); a.block(tx, ty, 0);
            F.planted = F.planted.filter(q => q !== pl);
            Save.touch();
            if (pl.kind === 'money') { addMoney(pl.amount || 0, true); UI.toast(`Sarah dug up the little tree. The ${fmtNum(pl.amount || 0)} sand dollars were still down there.`, 'ui_coin'); }
            else receive(pl.kind === 'fruit' ? pl.fruit : 'sapling', 1);
        });
        return;
    }
    if (e && e.kind === 'glow') {
        await act(async () => {
            F.glow = { day: Clock.dayNum(), dug: true };
            a.remove(e);
            const bag = makeItemEnt('money_bag', fx + 9, fy + 2);
            bag.frame = 'money_bag'; bag.amount = 1000; bag.fresh = 14; bag.twinkle = true;
            a.add(bag);
            const h = { x: tx, y: ty, day: Clock.dayNum(), gold: true };
            F.holes.push(h); addHole(a, h);
            Sfx.play('fanfare');
            Save.touch();
            await UI.say(null, "A bag of 1,000 sand dollars was buried here! And the hole is still glinting. Something could grow here... if Sarah buried a few sand dollars back.");
        });
        return;
    }
    if (e && e.kind === 'clamspot') {
        await act(async () => {
            F.clams.dug.push(e.clamIdx);
            a.remove(e);
            Sfx.play('pick');
            receive('clam_live', 1);
            S.stats.clams = (S.stats.clams || 0) + 1;
            Save.touch();
        });
        return;
    }
    const t = e || a.ents.find(o => o !== p && o.hit && o.kind !== 'item' && !o.npc && o.layer !== 0 && tx >= Math.floor(o.hit.x / TILE) && tx < Math.ceil((o.hit.x + o.hit.w) / TILE) && Math.floor((o.y - 2) / TILE) === ty);
    const c = groundChar(tx, ty);
    if (a.waterAt(tx, ty)) { await UI.say(null, "That's water. Sarah digs anyway, a little. It fills right back in. Water is like that."); return; }
    if (c === 'p' || c === 'd' || c === 'b' || (typeof pathAt === 'function' && pathAt(tx, ty))) { await UI.say(null, 'The path is packed too hard to dig.'); return; }
    if (c === 'c') { await UI.say(null, 'Those are cobblestones. Fortune laid them herself. Sarah leaves them alone.'); return; }
    if (c === 'w') { await UI.say(null, "That's the pier. Please don't."); return; }
    if (a.ents.some(o => o.kind === 'plot' && o.tx === tx && o.ty === ty)) { await UI.say(null, "That's a garden plot. Plant seeds in it instead."); return; }
    if (a.blockedAt(tx, ty) || t) { await UI.say(null, "Something's in the way."); return; }
    if (F.holes.length >= 30) { await UI.say(null, "That's a lot of holes. Maybe fill some in first."); return; }
    await act(async () => {
        const h = { x: tx, y: ty, day: Clock.dayNum() };
        F.holes.push(h);
        addHole(a, h);
        Save.touch();
    });
}
/* can a tree grow at this tile? (it needs a little room on every side) */
function canPlant(tx, ty, palm, area) {
    const a = area || G.area;
    if (pathAt(tx, ty)) return 'path';
    const c = groundChar(tx, ty);
    if (!(c === 'g' || (palm && c === 's'))) return palm ? 'sand' : 'grass';
    const [x0, y0, x1, y1] = W0.plaza;
    if (tx >= x0 - 1 && tx <= x1 + 1 && ty >= y0 - 1 && ty <= y1 + 1) return 'crowded';
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        if (a.blockedAt(tx + dx, ty + dy)) return 'crowded';
    }
    for (const b of Object.values(W0.buildings)) {
        const [sx, sy] = [b.x + b.door, b.y + b.h];
        if (Math.abs(sx - tx) <= 1 && Math.abs(sy - ty) <= 2) return 'crowded';
    }
    return null;
}
async function holeMenu(e) {
    const a = G.area, h = e.hole, F = forest();
    const opts = [], acts = [];
    const fruits = S.pocket.filter(s => s && ITEMS[s.id].type === 'fruit').map(s => s.id).filter((v, i, arr) => arr.indexOf(v) === i);
    if (pocketCount('sapling')) { opts.push('Plant a sapling'); acts.push('sapling'); }
    if (fruits.length) { opts.push('Bury some fruit'); acts.push('fruit'); }
    if (h.gold) { opts.push('Bury sand dollars'); acts.push('money'); }
    const fseeds = flowerSeedIds();
    if (fseeds.length) { opts.push('Plant flower seeds'); acts.push('flowers'); }
    opts.push('Fill it in', 'Leave it'); acts.push('fill', 'leave');
    const k = await UI.ask(null, h.gold ? 'A hole. It is glinting a little.' : 'A hole in the ground. Nice and deep.', opts);
    const act = acts[k];
    if (act === 'leave') return;
    if (act === 'fill') {
        G.area.remove(e);
        F.holes = F.holes.filter(q => q !== h);
        Sfx.play('dig'); dirtFx(e.x, e.y);
        Save.touch();
        return;
    }
    if (act === 'flowers') return plantFlowersInHole(e, fseeds);
    let plant = null;
    if (act === 'sapling') plant = { kind: 'tree', item: 'sapling' };
    else if (act === 'fruit') {
        let id = fruits[0];
        if (fruits.length > 1) {
            const j = await UI.ask(null, 'Which fruit?', fruits.map(f => itemName(f)).concat(['Never mind']));
            if (j >= fruits.length) return;
            id = fruits[j];
        }
        plant = { kind: 'fruit', item: id, fruit: id };
    } else if (act === 'money') {
        const amts = [1000, 5000, 10000].filter(n => S.money >= n);
        if (!amts.length) { await UI.say(null, "Sarah doesn't have 1,000 sand dollars to bury. The hole understands."); return; }
        const j = await UI.ask(null, 'How many sand dollars? (Rumor has it the tree grows three bags of whatever you bury.)', amts.map(n => fmtNum(n)).concat(['Never mind']));
        if (j >= amts.length) return;
        plant = { kind: 'money', amount: amts[j] };
    }
    const sand = groundChar(h.x, h.y) === 's';
    const palm = plant.kind === 'tree' ? sand : plant.fruit === 'coconut';
    if (palm && plant.kind !== 'money') plant.kind = 'palm';
    const why = canPlant(h.x, h.y, palm);
    if (why) {
        await UI.say(null, why === 'path' ? "Not on a path. A tree here would be in everybody's way." : why === 'crowded' ? "It's too crowded here for a tree. Trees like a little room on every side." : why === 'sand' ? 'Palm trees want sand or grass. This is neither. Somehow.'
            : plant.kind === 'fruit' ? 'Fruit trees need grass to grow. (Coconuts are fine on the beach.)' : 'Trees need grass to grow. On sand, a sapling turns into a palm. This is not sand.');
        return;
    }
    if (plant.item) removeItem(plant.item, 1);
    if (plant.kind === 'money') addMoney(-plant.amount, true);
    a.remove(e);
    F.holes = F.holes.filter(q => q !== h);
    const r = mulberry(hash32(S.seed + ':look:' + h.x + ':' + h.y));
    const pl = { id: `pt${h.x}_${h.y}`, x: h.x, y: h.y, kind: plant.kind, fruit: plant.fruit || (plant.kind === 'palm' && plant.item === 'coconut' ? 'coconut' : null), day: Clock.dayNum(),
        amount: plant.amount || 0, look: rpick(['oak', 'oak', 'pine', 'blossom'], r) };
    delete F.chopped[pl.id];
    F.planted.push(pl);
    addPlanted(a, pl);
    const p = G.player;
    p.pose = 'pick'; p.poseT = 16;
    Sfx.play('plant');
    S.stats.planted = (S.stats.planted || 0) + 1;
    Save.touch();
    UI.toast(plant.kind === 'money' ? `Sarah buried ${fmtNum(plant.amount)} sand dollars. Something shiny might grow in ${GROW_DAYS} days.`
        : `Planted! It'll be a full-grown ${plant.kind === 'fruit' ? itemName(plant.fruit).toLowerCase() + ' tree' : plant.kind === 'palm' ? 'palm' : 'tree'} in ${GROW_DAYS} days.`, plant.item ? itemIcon(plant.item) : 'ui_coin');
}
/* shaking a money tree: three bags, then it's an ordinary tree */
async function shakeMoneyTree(e) {
    const pl = e.money;
    e.shake = 26;
    Sfx.play('rustle');
    await waitFrames(16);
    for (const [ox, oy] of [[-10, 10], [10, 11], [0, 16]]) {
        const bag = makeItemEnt('money_bag', e.x + ox, e.y + oy);
        bag.frame = 'money_bag'; bag.amount = pl.amount; bag.fresh = 12; bag.twinkle = true;
        G.area.add(bag);
    }
    pl.paid = true;
    Sfx.play('fanfare');
    G.area.remove(e);
    addPlanted(G.area, pl);
    Save.touch();
}

/* what the shovel does when Sarah presses A with nothing to talk to: dig the tile in front of her */
function shovelFront() {
    const p = G.player;
    const [px, py] = probePoint(p, 12);
    return digAt(Math.floor(px / TILE), Math.floor(py / TILE));
}
/* tapping the ground while holding the shovel: walk next to that tile and dig it */
function tapDig(tx, ty) {
    if (visitorStop('dig')) return true;
    const a = G.area, p = G.player;
    const sx = Math.floor(p.x / TILE), sy = Math.floor((p.y - 2) / TILE);
    let best = null;
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, 1], [0, -1]]) {
        const x = tx + dx, y = ty + dy;
        if (a.blockedAt(x, y)) continue;
        if (x === sx && y === sy) { best = { x, y, path: [] }; break; }
        const path = findPath(a, sx, sy, x, y, 4000);
        if (path && (!best || path.length < best.path.length)) best = { x, y, path };
    }
    if (!best) return false;
    p.path = best.path;
    p.goal = [(best.x + 0.5) * TILE, (best.y + 0.5) * TILE + 4];
    p.onArrive = () => digAt(tx, ty);
    return true;
}

