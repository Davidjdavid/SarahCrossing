/* ---- 23_items.js ---- */
/* Pocket, storage, pickups, trees, shells and the garden */
function pocketCount(id) { let n = 0; for (const s of S.pocket) if (s && s.id === id) n += s.n; return n; }
function pocketFree() { return S.pocket.filter(s => !s).length; }
/* backpacks: each one adds ten pocket slots (Fortune sells them on the tool rack) */
const BAGS = ['bag_1', 'bag_2'];
function pocketSize(st) { st = st || S; return 20 + 10 * (st.bag || 0); }
function nextBag() { return BAGS[S.bag || 0] || null; }
function upgradeBag() {
    S.bag = (S.bag || 0) + 1;
    while (S.pocket.length < pocketSize()) S.pocket.push(null);
    Save.touch();
}
function canAdd(id, n) {
    n = n || 1;
    const mx = stackMax(id);
    let room = 0;
    for (const s of S.pocket) {
        if (!s) room += mx;
        else if (s.id === id && mx > 1) room += mx - s.n;
    }
    return room >= n;
}
function addItem(id, n, quiet) {
    n = n || 1;
    if (!ITEMS[id]) { console.warn('unknown item', id); return 0; }
    const mx = stackMax(id);
    let left = n;
    for (const s of S.pocket) if (left && s && s.id === id && s.n < mx) { const k = Math.min(left, mx - s.n); s.n += k; left -= k; }
    for (let i = 0; i < S.pocket.length && left; i++) if (!S.pocket[i]) { const k = Math.min(left, mx); S.pocket[i] = { id, n: k }; left -= k; }
    const got = n - left;
    if (got) { S.seen[id] = S.seen[id] || Clock.dayNum(); Save.touch(); }
    if (!quiet && got) UI.toast(got > 1 ? `Got ${got} \u00d7 ${itemName(id)}` : `Got ${aOrAn(itemName(id))} ${itemName(id)}`, itemIcon(id));
    return got;
}
function removeItem(id, n) {
    n = n || 1;
    let left = n;
    for (let i = S.pocket.length - 1; i >= 0 && left; i--) {
        const s = S.pocket[i];
        if (s && s.id === id) { const k = Math.min(left, s.n); s.n -= k; left -= k; if (!s.n) S.pocket[i] = null; }
    }
    Save.touch();
    return n - left;
}
function removeSlot(i, n) {
    const s = S.pocket[i];
    if (!s) return 0;
    const k = Math.min(n || s.n, s.n);
    s.n -= k;
    if (!s.n) S.pocket[i] = null;
    Save.touch();
    return k;
}
function toStorage(id, n) { S.storage[id] = (S.storage[id] || 0) + (n || 1); S.seen[id] = S.seen[id] || Clock.dayNum(); Save.touch(); }
function fromStorage(id, n) { n = n || 1; if ((S.storage[id] || 0) < n) return false; S.storage[id] -= n; if (!S.storage[id]) delete S.storage[id]; Save.touch(); return true; }
/* anything Sarah gets: the pocket if there's room, otherwise it goes straight home to storage */
function receive(id, n, quiet) {
    n = n || 1;
    const got = addItem(id, n, quiet);
    if (got < n) {
        toStorage(id, n - got);
        UI.toast(`Pockets full! ${n - got > 1 ? (n - got) + ' \u00d7 ' : ''}${itemName(id)} went home to storage`, itemIcon(id));
    }
    return got;
}
function addMoney(n, quiet, why) {
    const was = S.money;
    S.money = Math.max(0, Math.min(9999999, S.money + n));
    moneyFlow(S.money - was, why);
    Save.touch();
    HUD.update();
    if (!quiet && n > 0) UI.toast(`+${fmtNum(n)} sand dollars`, 'ui_coin');
}

/* where sand dollars come from and where they go, by why (every addMoney says: 'Fish', 'House', 'Prizes & tips'...),
   for the Bank's statement (6ze_bank.js); money moved in and out of the Bank itself isn't earning or spending */
function moneyFlow(d, why) {
    if (!d || why === 'bank') return;
    const B = S.bank || (S.bank = {}), F = B.flow || (B.flow = { in: {}, out: {}, since: Clock.dayNum() });
    const side = d > 0 ? F.in : F.out, k = why || 'Other';
    side[k] = (side[k] || 0) + Math.abs(d);
}

/* ---------------------------------------------------------------- things lying on the ground */
function makeItemEnt(id, x, y, extra) {
    const e = Object.assign({ kind: 'item', id, x, y, frame: itemIcon(id), layer: 1 }, extra || {});
    e.hit = { x: x - 8, y: y - 14, w: 16, h: 16 };
    e.sy = y - 6;
    e.interact = () => pickUp(e);
    e.draw = ctx => {
        const bob = itemLift(e);
        spr(ctx, 'shadow_s', e.x, e.y + 1);
        spr(ctx, e.frame, e.x, e.y - bob);
        if (e.twinkle) {
            const k = (G.t + e.x) % 90;
            if (k < 20) spr(ctx, 'twinkle', e.x + 5, e.y - 12);
        }
    };
    return e;
}
/* how high something just dropped is above the ground (world pixels): fruit falling out of a shaken tree (e.fall: from
   its height, landing with a little bounce), anything else set down just now hopping once (e.fresh). From G.t, so the new
   look, which never calls the picture's draw, sees it the same and it always comes to rest */
function itemLift(e) {
    if (e.fall) {
        const k = (G.t - e.fall.t0) / e.fall.T;
        if (k < 1) return e.fall.h * (1 - k * k);
        const b = (G.t - e.fall.t0 - e.fall.T) / 10;
        if (b < 1) return Math.sin(b * Math.PI) * 3;
        e.fall = null;
    }
    if (e.fresh) {
        if (e.freshAt == null) e.freshAt = G.t;
        const left = e.fresh - (G.t - e.freshAt);
        if (left > 0) return left * 0.4;
        e.fresh = 0;
    }
    return 0;
}
/* (fall: drop from that many world pixels up, as fruit from a tree's crown) */
function spawnDrop(id, x, y, persist, fall) {
    const e = makeItemEnt(id, x, y);
    if (fall) e.fall = { h: fall, t0: G.t + (fall > 0 ? rint(0, 6) : 0), T: 24 };
    else e.fresh = 12;
    if (persist !== false) {
        e.dropRef = { id, x, y, area: G.area.id };
        S.drops.push(e.dropRef);
        Save.touch();
    }
    G.area.add(e);
    return e;
}
async function pickUp(e) {
    if (e.dropRef && visitorStop('take')) return;
    const p = G.player;
    faceToward(p, e);
    p.pose = 'pick'; p.poseT = 14;
    Sfx.play('pick');
    G.area.remove(e);
    if (e.dropRef) { const i = S.drops.indexOf(e.dropRef); if (i >= 0) S.drops.splice(i, 1); }
    if (e.shellIdx != null) S.shells.taken.push(e.shellIdx);
    if (e.flowerIdx != null) flowerState().picked[e.flowerIdx] = Clock.dayNum();
    if (e.gemSpot != null && S.gems && !S.gems.taken.includes(e.gemSpot)) S.gems.taken.push(e.gemSpot);
    if (e.id === 'money_bag') { addMoney(e.amount || 500, false, 'Found & gifts'); return; }
    receive(e.id, 1);
    S.stats[ITEMS[e.id] ? ITEMS[e.id].type : 'x'] = (S.stats[ITEMS[e.id] ? ITEMS[e.id].type : 'x'] || 0) + 1;
    Bus.emit('got', e.id);
    if (e.id === 'bottle') await openBottle();
}
function restoreDrops(a) {
    for (const d of S.drops) if (d.area === a.id) { const e = makeItemEnt(d.id, d.x, d.y); e.dropRef = d; a.add(e); }
}

/* ---------------------------------------------------------------- trees */
function treeHasFruit(e) {
    const t = S.trees[e.id];
    return t == null || Clock.dayNum() - t >= 3;
}
const TREE_FALL = 30;       // world pixels up in the crown that shaken fruit falls from
async function shakeTree(e) {
    const p = G.player;
    faceToward(p, e);
    // she takes hold and shakes it, the tree shakes, and only then does something fall
    p.pose = 'shake'; p.poseT = 34;
    await waitFrames(6);
    e.shake = 28;
    Sfx.play('rustle');
    Critters.startle(e.x, e.y - 20, 70);
    await waitFrames(20);
    if (festShake(e)) return;
    if (e.kind === 'fruittree' && e.fruit && treeHasFruit(e)) {
        S.trees[e.id] = Clock.dayNum();
        const spots = [[-10, 10], [10, 11], [0, 16]].concat(bonusOn('harvest') ? [[-4, 20], [6, 19]] : []);
        S.stats.shakes = (S.stats.shakes || 0) + 1;
        for (const [ox, oy] of spots) {
            const x = e.x + ox, y = e.y + oy;
            // (out of the crown, each a moment after the last, landing round the trunk)
            if (!G.area.solidPx(x, y - 2)) spawnDrop(e.fruit, x, y, true, TREE_FALL);
            else spawnDrop(e.fruit, p.x + rint(-6, 6), p.y + 2, true, TREE_FALL);
        }
        Save.touch();
        return;
    }
    // ordinary trees sometimes drop a little bag of sand dollars (once a day each)
    const key = e.id + ':d';
    if (S.trees[key] !== Clock.dayNum()) {
        const sec = Sparkle.secret(e);
        S.trees[key] = Clock.dayNum();
        Sparkle.forget(e);
        if (sec && sec.bag) {
            const bag = makeItemEnt('money_bag', e.x + 8, e.y + 12);
            bag.frame = 'money_bag'; bag.amount = sec.amount; bag.fresh = 12;
            G.area.add(bag);
            Save.touch();
        } else if (sec && sec.special) {
            leafFx(e.x, e.y);
            const id = hasSpecial('luckypenny') ? poolSpecial(null) : 'luckypenny';
            if (id) await grantSpecial(id, 'It fell out of a sparkling tree!');
            else { addMoney(1000, false, 'Found & gifts'); }
            Save.touch();
        } else if (bonusOn('lucky') && R() < 0.5) {
            const bag = makeItemEnt('money_bag', e.x + 8, e.y + 12);
            bag.frame = 'money_bag_s'; bag.amount = 50 * rint(1, 4); bag.fresh = 12;
            G.area.add(bag);
        }
    }
}
function tickTrees() {
    for (const e of G.area.ents) if (e.shake) e.shake--;
}

/* ---------------------------------------------------------------- shells wash up every day */
function beachSpots(area) {
    if (beachSpots.cache) return beachSpots.cache;
    const out = [];
    const a = area || G.areas.island;
    for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) {
        if (a.grid[y][x] !== 's' || a.blockedAt(x, y) || W0.reach[y][x] !== '1') continue;
        let nearSea = false;
        for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (a.waterAt(x + dx, y + dy) === 's') nearSea = true;
        if (nearSea) out.push([x, y]);
    }
    beachSpots.cache = out;
    return out;
}
function spawnShells(a) {
    const day = Clock.dayNum();
    if (S.shells.day !== day) { S.shells = { day, taken: [] }; Save.touch(); }
    const r = mulberry(hash32(S.seed + ':shells:' + day));
    const spots = shuffled(beachSpots(), r);
    const weights = GD.shells.map(s => [s.id, s.w]);
    let n = 9 + Math.floor(r() * 4);
    const list = [];
    for (let i = 0; i < n; i++) list.push(weighted(weights, r));
    if (S.flags.wished === day - 1) for (let i = 0; i < 3; i++) list.push('star');
    if (r() < 0.22) list.push('bottle');
    list.forEach((id, i) => {
        if (S.shells.taken.includes(i)) return;
        const [tx, ty] = spots[i % spots.length];
        const e = makeItemEnt(id, (tx + 0.5) * TILE + rint(-3, 3, r), (ty + 0.8) * TILE, { shellIdx: i });
        if (id === 'star' || id === 'bottle' || id === 'pearl') e.twinkle = true;
        a.add(e);
    });
    Gems.add(a);
}

/* ---------------------------------------------------------------- garden plots */
function plotStage(pl) {
    if (!pl) return 0;
    const d = Clock.dayNum() - pl.day;
    return d <= 0 ? 1 : d === 1 ? 2 : 3;
}
function drawPlot(ctx, e) {
    const pl = S.plots[e.idx];
    const st = plotStage(pl);
    // (in the new look what grows is a model standing in the plot: here only its soil)
    const env = typeof Env !== 'undefined' && Env.on && typeof EnvItems !== 'undefined' && EnvItems.plant(e);
    spr(ctx, env ? 'plot_0' : `plot_${st}`, e.x, e.y);
    // (a raised planter box: a wooden rim round the soil, its front a shade darker)
    const bx = e.tx * TILE, by = e.ty * TILE;
    ctx.fillStyle = '#c08a52'; ctx.fillRect(bx, by, TILE, 2); ctx.fillRect(bx, by, 2, TILE); ctx.fillRect(bx + TILE - 2, by, 2, TILE);
    ctx.fillStyle = '#8a5a32'; ctx.fillRect(bx, by + TILE - 3, TILE, 3);
    if (env) return;
    if (st === 3) spr(ctx, pl.seed.startsWith('flower_') ? ITEMS[pl.seed].icon : 'veg_' + pl.seed, e.x, e.y - (pl.seed.startsWith('flower_') ? 1 : 3));
}
/* the community garden by the farm (the plots marked c): anyone may plant there, and each morning Ginger's crew plants
   what seeds were left over in the empty beds, grown and ready to pick: a third of mornings none, a third one bed, a
   third two (David, 27 October) */
function communityTick() {
    if (Online.visitor() || !W0.plots) return;
    const day = Clock.dayNum(), r = mulberry(hash32(S.seed + ':garden:' + day));
    const empty = W0.plots.map((p, i) => p.c && !S.plots[i] ? i : -1).filter(i => i >= 0);
    const seeds = Object.keys(ITEMS).filter(id => ITEMS[id].type === 'seed' && ITEMS[id].grows);
    let n = Math.floor(r() * 3);
    while (n-- > 0 && empty.length && seeds.length) {
        const i = empty.splice(Math.floor(r() * empty.length), 1)[0], sid = seeds[Math.floor(r() * seeds.length)];
        S.plots[i] = { seed: ITEMS[sid].grows.replace('*', String(Math.floor(r() * 3))), day: day - 2 };
    }
}
async function usePlot(i) {
    if (visitorStop('farm')) return;
    const pl = S.plots[i];
    const st = plotStage(pl);
    if (!pl) {
        const seeds = S.pocket.filter(s => s && ITEMS[s.id].type === 'seed');
        if (!seeds.length) { await UI.say(null, W0.plots[i] && W0.plots[i].c ? "A bed in the community garden. Anyone can plant here, and Ginger's crew plants whatever seeds are left over now and then. Fortune sells seeds at the shop." : 'A garden plot. Fortune sells seeds at the shop.'); return; }
        const opts = seeds.map(s => `${itemName(s.id)} (${s.n})`).concat(['Not now']);
        const k = await UI.ask(null, 'Plant something here?', opts);
        if (k >= seeds.length) return;
        const sid = seeds[k].id;
        removeItem(sid, 1);
        const grows = ITEMS[sid].grows.replace('*', String(rint(0, 2)));
        S.plots[i] = { seed: grows, day: Clock.dayNum() };
        G.player.pose = 'pick'; G.player.poseT = 14;
        Sfx.play('dig');
        Save.touch();
        UI.toast(`Planted ${ITEMS[sid].flower ? itemName(sid).toLowerCase() : itemName(grows).toLowerCase()}. Ready in 2 days.`, ITEMS[sid].icon);
        return;
    }
    if (st < 3) {
        const left = 2 - (Clock.dayNum() - pl.day);
        await UI.say(null, `The ${itemName(pl.seed).toLowerCase()} is growing. ${left} more ${plural(left, 'day')}. No watering needed. This island doesn't do chores.`);
        return;
    }
    const r = mulberry(hash32(S.seed + ':plot' + i + ':' + pl.day));
    const n = 2 + (r() < 0.5 ? 1 : 0);
    G.player.pose = 'cheer'; G.player.poseT = 30;
    Sfx.play('fanfare');
    receive(pl.seed, n);
    S.plots[i] = null;
    S.stats.harvests = (S.stats.harvests || 0) + 1;
    Save.touch();
}

