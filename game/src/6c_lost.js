/* ---- 6c_lost.js ---- */
/* Lost and found. Every few days somebody loses something (a wallet, keys, a handheld game, Joe's poem notebook...).
   It turns up somewhere on the island: out in the grass, in the barn or the windmill, in a shop, or in somebody
   else's house. The owner asks around, other neighbors drop hints, the island board posts a notice. Bring it back
   for friendship and a thank-you. If nobody finds it in three days, the owner finds it in their other pocket. */
const LOST_THINGS = [
    ['wallet', 'wallet', ['sully', 'david', 'basil', 'mac', 'kai']],
    ['keys', 'keys', ['cece', 'ginger', 'joe', 'maki', 'clementine']],
    ['handheld', 'handheld game', ['kai', 'chili', 'cuke', 'david', 'coco']],
    ['notebook', 'poem notebook', ['joe']],
    ['diary', 'diary', ['coco']],
    ['glasses', 'reading glasses', ['maki', 'brulee', 'sully']],
    ['spoon', 'lucky spoon', ['mac']],
    ['hammer', 'lucky hammer', ['ginger']],
    ['sweatband', 'sweatband', ['cuke']],
    ['hotsauce', 'hot sauce', ['chili']],
    ['shell', 'lucky shell', ['kai', 'wonton']],
    ['brush', 'favorite paintbrush', ['brulee']],
    ['scarf', 'silk scarf', ['clementine', 'coco']],
    ['cap', 'lucky cap', ['sully', 'cuke']],
    ['recipe', 'recipe card', ['cece', 'mac']],
    ['chopsticks', 'good chopsticks', ['basil', 'maki']],
];
const LOST_OUTSIDE = ['pond', 'beach', 'beach_w', 'beach_e', 'orchard', 'meadow', 'farm', 'forest', 'waterfall', 'river', 'lookout', 'eastmeadow', 'bridge', 'bench_pond', 'bench_beach', 'mountain', 'garden'];
const LOST_ROOMS = ['barn', 'windmill', 'museum', 'restaurant', 'shop', 'boutique', 'studio', 'arcade', 'builder'];
function lostId(owner, kind) { return `lost_${owner}_${kind}`; }
for (const [kind, what, owners] of LOST_THINGS) {
    for (const o of owners) {
        if (!NPC_DEFS[o]) continue;
        ITEMS[lostId(o, kind)] = { name: `${NPC_DEFS[o].name}'s ${what}`, type: 'lost', price: 0, icon: 'ic_lost_' + kind, owner: o, what, kind };
    }
}
function lostState() {
    if (!S.lost) S.lost = { cur: null, last: 0, done: 0 };
    return S.lost;
}
function lostWhere(c) {
    if (!c) return '';
    if (c.area === 'island') return PLACE_NAMES[c.spot] || 'outside somewhere';
    if (c.area.startsWith('h_')) return `at ${NPC_DEFS[c.area.slice(2)].name}'s house`;
    return ROOM_PLACE[c.area] || 'inside somewhere';
}
/* a free tile nobody would put furniture on, that you can walk to from the door */
function reachableTiles(a, from) {
    const seen = new Set([from[1] * a.w + from[0]]), q = [from], out = [];
    while (q.length) {
        const [x, y] = q.shift();
        out.push([x, y]);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx, ny = y + dy, k = ny * a.w + nx;
            if (a.blockedAt(nx, ny) || seen.has(k)) continue;
            seen.add(k); q.push([nx, ny]);
        }
    }
    return out;
}
function hideSpot(r, owner) {
    for (let tries = 0; tries < 12; tries++) {
        if (r() < 0.42) {
            const spot = rpick(LOST_OUTSIDE, r), s = W0.spots[spot], a = G.areas.island;
            if (!s || !a) continue;
            const c = [];
            for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
                const x = s.x + dx, y = s.y + dy;
                if (!a.blockedAt(x, y) && W0.reach[y] && W0.reach[y][x] === '1' && !a.waterAt(x, y)) c.push([x, y]);
            }
            if (!c.length) continue;
            const [x, y] = rpick(c, r);
            return { area: 'island', spot, x, y };
        }
        const houses = NEIGHBORS.filter(id => id !== owner && NPC_DEFS[id].house && ROOMS[NPC_DEFS[id].house] && rel(id).met).map(id => NPC_DEFS[id].house);
        const room = rpick(LOST_ROOMS.concat(houses, houses), r);
        const a = ensureArea(room);
        if (!a) continue;
        const door = [a.doorTile[0], a.doorTile[1] - 1];
        const tiles = reachableTiles(a, door).filter(([x, y]) => Math.abs(x - door[0]) + Math.abs(y - door[1]) > 2);
        if (!tiles.length) continue;
        const [x, y] = rpick(tiles, r);
        return { area: room, x, y };
    }
    return null;
}
/* a new day: maybe somebody loses something */
function lostDaily(day, force) {
    const L = lostState();
    const c = L.cur;
    if (c && !c.found && day - c.day >= 3) {
        L.cur = null; L.last = day;
        L.gaveUp = { owner: c.owner, id: c.id, day };
        removeLostEnts();
        return;
    }
    if (c) return;
    const r = mulberry(hash32(S.seed + ':lost:' + day));
    if (!force && (day - (S.startDay || day) < 2 || day - (L.last || 0) < 2 || r() > 0.45)) return;
    const pool = [];
    for (const [kind, what, owners] of LOST_THINGS) for (const o of owners) if (NPC_DEFS[o] && !NPC_DEFS[o].visitor && rel(o).met && (!force || !force.owner || force.owner === o)) pool.push([o, kind]);
    if (!pool.length) return;
    let [owner, kind] = rpick(pool, r);
    if (force && force.kind) { kind = force.kind; owner = force.owner || owner; }
    const where = force && force.where ? force.where : hideSpot(r, owner);
    if (!where) return;
    L.cur = Object.assign({ owner, kind, id: lostId(owner, kind), day, found: false }, where);
    L.last = day;
    placeLostEnt();
    sendMail({ from: owner, subject: `Have you seen my ${ITEMS[L.cur.id].what}?`, body: lostLetter(L.cur) });
    Save.touch();
}
function lostLetter(c) {
    const it = ITEMS[c.id], nm = NPC_DEFS[c.owner].name;
    const vague = c.area === 'island' ? `I was out and about yesterday. Maybe I dropped it ${lostWhere(c)}? Or somewhere else. Probably somewhere else.`
        : `I was ${lostWhere(c)} yesterday... maybe it's there? I looked everywhere. (I looked in two places.)`;
    return `Hi {name},\nI lost my ${it.what}! I've looked everywhere.\n${vague}\nIf you find it, you are my hero. Forever. Or at least until Thursday.\n- ${nm}`;
}
function lostItemEnt(a) {
    const c = lostState().cur;
    if (!c || c.found || c.area !== a.id) return null;
    const x = (c.x + 0.5) * TILE, y = (c.y + 1) * TILE - 3;
    const e = makeItemEnt(c.id, x, y, { lostThing: true });
    e.twinkle = true;
    const draw0 = e.draw;
    e.draw = ctx => { draw0(ctx); if ((G.t >> 3) % 7 === 0) spr(ctx, 'twinkle', e.x + 6, e.y - 12); };
    return e;
}
function removeLostEnts() { for (const a of Object.values(G.areas || {})) if (a && a.ents) a.ents = a.ents.filter(e => !e.lostThing); }
function placeLostEnt() {
    removeLostEnts();
    const c = lostState().cur;
    if (!c || c.found) return;
    const a = G.areas[c.area];
    if (!a) return;                       // rooms build it in when they're built
    const e = lostItemEnt(a);
    if (e) a.add(e);
}
function addLostItem(a) {
    if (!S || !S.lost || !a) return;
    a.ents = a.ents.filter(e => !e.lostThing);
    const e = lostItemEnt(a);
    if (e) a.add(e);
}
Bus.on('got', id => {
    const c = S.lost && S.lost.cur;
    if (!c || id !== c.id || c.found) return;
    c.found = true;
    Sfx.play('fanfare');
    G.player.pose = 'cheer'; G.player.poseT = 30;
    setTimeout(() => UI.toast(`Found ${ITEMS[id].name}! Bring it back to ${NPC_DEFS[c.owner].name}.`, ITEMS[id].icon), 300);
    Save.touch();
});
/* what people say while it's missing */
function lostHint(n) {
    const c = S.lost && S.lost.cur;
    if (!c || c.found || n.id === c.owner || !TALK[n.id]) return null;
    const it = ITEMS[c.id], nm = NPC_DEFS[c.owner].name;
    return rpick([`Did you hear? ${nm} lost their ${it.what}! I think I saw something shiny ${lostWhere(c)}.`,
        `${nm} is looking everywhere for their ${it.what}. I saw something like that ${lostWhere(c)}. Maybe?`,
        `Psst. ${nm}'s ${it.what}? Try ${lostWhere(c)}. You didn't hear it from me.`]);
}
function ownerLostLine(n) {
    const c = S.lost && S.lost.cur;
    if (!c || c.owner !== n.id) return null;
    const it = ITEMS[c.id];
    if (c.found && pocketCount(c.id)) return null;
    if (c.found) return `Somebody said you found my ${it.what}? Do you still have it? Please say yes.`;
    return rpick([`Have you seen my ${it.what}? I've looked everywhere. I think I was ${lostWhere(c)} when I had it last...`,
        `My ${it.what} is gone! Gone! If you see it... maybe ${lostWhere(c)}? I don't know. I don't know anything anymore.`]);
}
/* giving it back */
async function returnLost(n) {
    const c = S.lost.cur, id = c.id, it = ITEMS[id];
    if (!takeOwned(id)) return;
    const owner = n.id, r = rel(owner);
    UI.hideDialog();
    G.player.pose = 'cheer'; G.player.poseT = 30;
    n.emote = 'heart'; n.emoteT = 120;
    Sfx.play('fanfare');
    const lines = { joe: "My NOTEBOOK! All my poems! Thank you! Please don't read page twelve. There's nothing on page twelve. (There is a lot on page twelve.)",
        coco: "My DIARY! Did you read it? ...Don't answer that. Thank you. You're my favorite. Don't tell anyone. (Tell everyone.)",
        mac: 'My lucky spoon! Everything tastes better with it. EVERYTHING. Thank you!', ginger: 'My lucky hammer! Everything I build is a little crooked without it. Thank you!',
        chili: 'My hot sauce! My emergency hot sauce! Thank you. Want some? Careful. It is SO hot.', kai: "Duuude! You found it! You're, like, the best finder on the island!" };
    await UI.say(owner, voiced(owner, lines[owner] && (c.kind === 'notebook' || c.kind === 'diary' || c.kind === 'spoon' || c.kind === 'hammer' || c.kind === 'hotsauce' || owner === 'kai') ? lines[owner]
        : rpick([`My ${it.what}! You found it! Where was it? ${cap(lostWhere(c))}? I would NEVER have looked there.`, `You found my ${it.what}! Thank you, thank you, thank you!`])), { keep: true });
    const reward = 800 + (hash32(id + c.day) % 5) * 200;
    addMoney(reward, true);
    await UI.say(owner, voiced(owner, `Here, take this. ${fmtNum(reward)} sand dollars. It's a finder's fee. I insist.`), { keep: true });
    UI.toast(`+${fmtNum(reward)} sand dollars`, 'ui_coin');
    S.lost.cur = null; S.lost.done = (S.lost.done || 0) + 1;
    S.stats.returned = (S.stats.returned || 0) + 1;
    const up = addPts(owner, 8);
    Save.touch();
    if (up) { UI.hideDialog(); await heartUp(n, up); }
}
function hasLostFor(id) { const c = S.lost && S.lost.cur; return c && c.owner === id && c.found && (pocketCount(c.id) || S.storage[c.id]) ? c : null; }

