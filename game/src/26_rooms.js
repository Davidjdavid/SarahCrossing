/* ---- 26_rooms.js ---- */
/* Walk-in buildings: Fortune's shop, Clementine's boutique and every neighbor's home. A room is a floor grid
   (fx, fy count from the top-left floor tile) with wallpaper, flooring and furniture. Homes also show the furniture
   Sarah has given the owner. Studio and arcade rooms are added by their own files. */

/* opening hours (island hours, 5 AM to 5 AM): most places are open about 8 AM to 10 PM. When the person who runs one is
   on a break or off doing their own thing, it stays open on the honor system */
const ROOM_HOURS = { shop: [8, 22], boutique: [9, 21], studio: [9, 22], arcade: [10, 24], builder: [8, 20], museum: [9, 21], restaurant: [7, 22] };
/* "8 AM", "noon", "midnight", "10:30 PM" */
function fmtOpen(dh) {
    const h = ((dh % 24) + 24) % 24;
    if (Math.abs(h - 12) < 0.01) return 'noon';
    if (h < 0.01) return 'midnight';
    return fmtClock(h);
}
function hoursText(id) { const h = roomHours(id); return h ? `${fmtOpen(h[0])} to ${fmtOpen(h[1])}` : 'any time'; }
function roomOpen(id, dh) {
    const h = roomHours(id);
    if (!h) return true;
    if (shopReno(id)) return false;
    dh = dh == null ? dayHour() : dh;
    return dh >= h[0] && dh < h[1];
}

/* homes: [id, fx, fy] on the floor, [id, fx, 'wall'] on the back wall; a tabletop thing on a table sits on the table */
const HOUSE_LAYOUT = {
    maki: { wall: 'wall_bamboo', floor: 'floor_tatami', items: [
        ['window_wall', 0, 'wall'], ['noren', 2, 'wall'], ['clock_wall', 5, 'wall'],
        ['sushi_counter', 0, 0], ['rice_cooker', 0, 0], ['bonsai', 1, 0], ['lucky_cat', 2, 0], ['paper_lantern', 6, 0],
        ['tatami', 4, 2], ['shelf_book', 5, 4], ['plant_monstera', 0, 4]] },
    kai: { wall: 'wall_shiplap', floor: 'floor_sand', items: [
        ['shell_mirror', 1, 'wall'], ['window_wall', 3, 'wall'], ['window_wall', 5, 'wall'],
        ['hammock', 0, 0], ['beach_umbrella', 5, 0], ['surfboard', 6, 0], ['driftwood_table', 4, 2], ['shell_lamp', 4, 2],
        ['beanbag', 0, 3], ['shell_display', 5, 4]] },
    basil: { wall: 'wall_mint', floor: 'floor_wood', items: [
        ['spice_rack', 0, 'wall'], ['chili_lights', 4, 'wall'],
        ['wok_stove', 0, 0], ['bed_simple', 4, 0], ['red_lantern', 6, 0], ['table_wood', 0, 3], ['herb_pot', 0, 3], ['steamer_stack', 1, 3],
        ['silk_cushion', 2, 3], ['veggie_planter', 5, 4]] },
    chili: { wall: 'wall_pinkstripe', floor: 'floor_wood', items: [
        ['chili_lights', 0, 'wall'], ['neon_sign', 4, 'wall'],
        ['red_lantern', 0, 0], ['wok_stove', 1, 0], ['bed_simple', 5, 0], ['speaker', 0, 2], ['cafe_table', 5, 3], ['trophy_hot', 5, 3],
        ['silk_cushion', 6, 3], ['plant_cactus', 0, 4]] },
    coco: { wall: 'wall_polka', floor: 'floor_checker', items: [
        ['window_wall', 1, 'wall'], ['clock_wall', 5, 'wall'],
        ['sofa_pink', 0, 0], ['dresser', 4, 0], ['gossip_phone', 4, 0], ['heart_lamp', 5, 0], ['mirror_stand', 6, 0],
        ['pastel_rug', 2, 1], ['cafe_table', 1, 3], ['choc_fountain', 1, 3], ['macaron_stool', 0, 3], ['macaron_stool', 2, 3], ['bed_simple', 5, 2]] },
    cece: { wall: 'wall_pinkstripe', floor: 'floor_checker', items: [
        ['clock_wall', 1, 'wall'], ['window_wall', 4, 'wall'],
        ['cheesecake_case', 0, 0], ['cake_stand', 0, 0], ['cherry_cheesecake', 1, 0], ['kitchenette', 5, 0], ['cafe_table', 1, 2], ['cheesecake', 1, 2],
        ['macaron_stool', 0, 2], ['macaron_stool', 2, 2], ['bed_simple', 5, 2], ['plant_monstera', 0, 4]] },
    clementine: { wall: 'wall_blossom', floor: 'floor_marble', items: [
        ['window_wall', 1, 'wall'], ['shell_mirror', 5, 'wall'],
        ['mirror_stand', 0, 0], ['dresser', 2, 0], ['orange_vase', 2, 0], ['rose_vase', 3, 0], ['bed_simple', 5, 0], ['sofa_pink', 0, 2],
        ['rug_round', 3, 2], ['lamp_floor', 6, 2], ['clothes_rack', 5, 4]] },
    cuke: { wall: 'wall_mint', floor: 'floor_grass', items: [
        ['window_wall', 1, 'wall'], ['clock_wall', 3, 'wall'], ['window_wall', 5, 'wall'],
        ['bed_simple', 0, 0], ['veggie_planter', 5, 0], ['sunflower', 5, 2], ['shoe_rack', 6, 2], ['table_wood', 0, 3], ['watering_can', 0, 3],
        ['herb_pot', 1, 3], ['plant_monstera', 6, 4]] },
    sully: { wall: 'wall_brick', floor: 'floor_wood', items: [
        ['boston_sign', 1, 'wall'], ['chalkboard', 3, 'wall'], ['clock_wall', 6, 'wall'],
        ['bed_simple', 0, 0], ['study_desk', 5, 0], ['coffee_maker', 5, 0], ['globe', 6, 0], ['crimson_chair', 5, 1], ['shelf_book', 0, 3],
        ['plant_monstera', 6, 4]] },
    joe: { wall: 'wall_cream', floor: 'floor_wood', items: [
        ['framed_poem', 1, 'wall'], ['window_wall', 3, 'wall'], ['framed_poem', 5, 'wall'],
        ['study_desk', 0, 0], ['typewriter', 0, 0], ['sonnet_stack', 1, 0], ['chair_wood', 0, 1], ['shelf_book', 5, 0], ['bed_simple', 5, 2],
        ['beanbag', 0, 3], ['paper_pile', 2, 3], ['paper_pile', 1, 1], ['lamp_floor', 6, 4]] },
    fortune: { wall: 'wall_cream', floor: 'floor_wood', items: [
        ['window_wall', 1, 'wall'], ['firework_poster', 3, 'wall'], ['clock_wall', 5, 'wall'],
        ['dresser', 0, 0], ['cookie_jar', 0, 0], ['lucky_cat', 1, 0], ['bed_simple', 5, 0], ['table_wood', 2, 1], ['chair_wood', 2, 2],
        ['rug_round', 0, 2], ['plant_monstera', 0, 4], ['shelf_book', 4, 4], ['lamp_floor', 6, 4]] },
    ginger: { wall: 'wall_workshop', floor: 'floor_wood', items: [
        ['pegboard', 0, 'wall'], ['window_wall', 3, 'wall'], ['swatch_board', 4, 'wall'],
        ['workbench', 0, 0], ['toolbox', 0, 0], ['house_model', 1, 0], ['sawhorse', 3, 0], ['bed_simple', 5, 0], ['rug_round', 2, 1],
        ['lumber_stack', 0, 3], ['paint_cans', 6, 3], ['plant_monstera', 6, 4]] },
    brulee: { wall: 'wall_gallery', floor: 'floor_parquet', items: [
        ['art_stilllife', 0, 'wall'], ['window_wall', 3, 'wall'], ['art_seaside', 5, 'wall'],
        ['easel', 0, 0], ['pedestal', 2, 0], ['rose_vase', 2, 0], ['bed_simple', 5, 0], ['rug_round', 2, 2],
        ['museum_bench', 0, 3], ['table_wood', 5, 3], ['art_supplies', 5, 3], ['plant_monstera', 6, 4]] },
    wasabi: { wall: 'wall_disco', floor: 'floor_wood', items: [
        ['neon_sign', 0, 'wall'], ['window_wall', 3, 'wall'], ['poster_blocks', 5, 'wall'], ['disco_ball', 6, 'wall'],
        ['turntables', 0, 0], ['speaker', 2, 0], ['lamp_floor', 4, 0], ['bed_simple', 5, 0], ['light_floor', 2, 2],
        ['beanbag', 0, 3], ['record_player', 6, 3], ['snack_machine', 6, 4]] },
    mac: { wall: 'wall_diner', floor: 'floor_diner', items: [
        ['menu_board', 0, 'wall'], ['window_wall', 3, 'wall'], ['clock_wall', 5, 'wall'],
        ['kitchenette', 0, 0], ['bed_simple', 5, 0], ['rug_round', 2, 1],
        ['dining_table', 0, 3], ['mac_cheese', 0, 3], ['table_setting', 1, 3], ['dining_chair', 2, 3], ['plant_monstera', 6, 4]] },
};

const ROOMS = {
    shop: { w: 15, h: 7, wall: 'wall_shop', floor: 'floor_shop', music: 'shop', name: "Fortune's Goods", staff: 'fortune',
        staffAt: [1, 0], guest: [7, 4, 3], build: a => buildShopRoom(a) },
    boutique: { w: 11, h: 6, wall: 'wall_boutique', floor: 'floor_marble', music: 'boutique', name: "Clementine's", staff: 'clementine',
        staffAt: [9, 0], guest: [5, 3, 2], build: a => buildBoutiqueRoom(a) },
};
for (const [owner, L] of Object.entries(HOUSE_LAYOUT)) {
    ROOMS['h_' + owner] = { w: 7, h: 5, wall: L.wall, floor: L.floor, music: 'house', owner, layout: L.items, home: [3, 2, 2] };
}

/* ---------------------------------------------------------------- layout helpers */
function roomDoor(R) { return [Math.floor(R.w / 2), R.h - 1]; }        // floor tile just inside the door
function toArea(fx, fy) { return [fx + 1, fy + 2]; }
/* turn [id, fx, fy] rows into placed items (area coords), putting tabletop things on whatever table is under them */
function layoutItems(rows) {
    const out = [];
    const surf = {};
    for (const row of rows) {
        const [id, fx, fy] = row;
        const d = furnDef(id);
        if (!d) continue;
        if (fy === 'wall') { out.push({ id, x: fx + 1, y: 0, flip: !!row[3] }); continue; }
        const [x, y] = toArea(fx, fy);
        const it = { id, x, y, flip: !!row[3] };
        if (d.kind === 'top' && surf[`${x},${y}`] != null) it.on = surf[`${x},${y}`];
        out.push(it);
        if (d.surface) for (let k = 0; k < d.w; k++) surf[`${x + k},${y + d.h - 1}`] = out.length - 1;
    }
    return out;
}
/* which floor tiles are taken (by floor things / wall columns / rugs) */
function occupancy(items) {
    const floor = new Set(), wall = new Set(), rug = new Set(), tops = new Set();
    for (const it of items) {
        const d = furnDef(it.id);
        if (!d) continue;
        if (d.kind === 'wall') { for (let k = 0; k < d.w; k++) wall.add(it.x + k); continue; }
        if (d.kind === 'top' && it.on != null) { tops.add(`${it.x},${it.y}`); continue; }
        const set = d.kind === 'rug' ? rug : floor;
        const h = d.kind === 'top' ? 1 : d.h;
        for (let y = it.y; y < it.y + h; y++) for (let x = it.x; x < it.x + d.w; x++) set.add(`${x},${y}`);
    }
    return { floor, wall, rug, tops };
}
/* can you still walk from the door to every free tile? */
function roomConnected(R, blocked) {
    const [dx, dy] = toArea(...roomDoor(R));
    if (blocked.has(`${dx},${dy}`)) return false;
    const seen = new Set([`${dx},${dy}`]);
    const q = [[dx, dy]];
    while (q.length) {
        const [x, y] = q.shift();
        for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + ox, ny = y + oy;
            if (nx < 1 || ny < 2 || nx > R.w || ny > R.h + 1) continue;
            const k = `${nx},${ny}`;
            if (seen.has(k) || blocked.has(k)) continue;
            seen.add(k); q.push([nx, ny]);
        }
    }
    for (let y = 2; y <= R.h + 1; y++) for (let x = 1; x <= R.w; x++) if (!blocked.has(`${x},${y}`) && !seen.has(`${x},${y}`)) return false;
    return true;
}
/* gifts from Sarah find a spot in the owner's home: wall things on the wall, tabletop things on tables, the rest on the floor */
function placeGifts(R, items, gifts) {
    const [ddx, ddy] = toArea(...roomDoor(R));
    for (let gi = gifts.length - 1; gi >= 0; gi--) {          // newest first, so they always make it in
        const id = gifts[gi];
        const d = furnDef(id);
        if (!d) continue;
        const occ = occupancy(items);
        let spot = null;
        if (d.kind === 'wall') {
            for (let x = 1; x + d.w - 1 <= R.w && !spot; x++) {
                let ok = true;
                for (let k = 0; k < d.w; k++) if (occ.wall.has(x + k)) ok = false;
                if (ok) spot = { x, y: 0 };
            }
        } else if (d.kind === 'top') {
            items.forEach((it, idx) => {
                const pd = furnDef(it.id);
                if (spot || !pd || !pd.surface) return;
                for (let k = 0; k < pd.w && !spot; k++) {
                    const x = it.x + k, y = it.y + pd.h - 1;
                    if (!occ.tops.has(`${x},${y}`)) spot = { x, y, on: idx };
                }
            });
        }
        if (!spot && d.kind !== 'wall') {
            const h = d.kind === 'top' ? 1 : d.h;
            const set = d.kind === 'rug' ? occ.rug : occ.floor;
            for (let y = 2; y + h - 1 <= R.h + 1 && !spot; y++) for (let x = 1; x + d.w - 1 <= R.w && !spot; x++) {
                let ok = true;
                const add = [];
                for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + d.w; xx++) {
                    if (set.has(`${xx},${yy}`)) ok = false;
                    if (d.kind !== 'rug' && xx === ddx && yy >= ddy - 1) ok = false;       // keep the doorway clear
                    add.push(`${xx},${yy}`);
                }
                if (!ok) continue;
                if (d.kind !== 'rug') {
                    const b = new Set(occ.floor);
                    add.forEach(k => b.add(k));
                    if (!roomConnected(R, b)) continue;
                }
                spot = { x, y };
            }
        }
        if (spot) items.push(Object.assign({ id, flip: false, gift: true }, spot));
    }
    return items;
}

/* ---------------------------------------------------------------- building a room */
function roomItems(id) {
    const R = ROOMS[id];
    let items = R.layout ? layoutItems(R.layout) : [];
    if (R.owner) {
        const r = S.npcs[R.owner];
        const gifts = (r && r.furn || []).slice(-8);
        if (gifts.length) items = placeGifts(R, items, gifts);
    }
    return items;
}
function buildRoom(id) {
    const R = ROOMS[id];
    if (R.resize) R.resize(R);
    const a = new Area(id, R.w + 2, R.h + 4);
    for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) a.blocked[y * a.w + x] = x >= 1 && x <= R.w && y >= 2 && y <= R.h + 1 ? 0 : 1;
    a.floor = { x0: 1, y0: 2, w: R.w, h: R.h };
    a.doorTile = [1 + Math.floor(R.w / 2), R.h + 2];
    a.block(a.doorTile[0], a.doorTile[1], 0);
    a.exitY = (R.h + 3) * TILE - 4;
    a.interior = true;
    a.building = id;
    a.room = R;
    const own = R.owner && S.npcs[R.owner];
    a.wallId = (own && own.wall) || R.wall; a.floorId = (own && own.floor) || R.floor;
    a.day = Clock.dayNum();
    a.items = roomItems(id);
    placeFurniture(a, a.items);
    if (R.build) R.build(a);
    buildRoomBg(a);
    addLostItem(a);
    return a;
}
function ensureArea(id) {
    if (id === 'island') return G.areas.island;
    if (id === 'home') { if (!G.areas.home || G.areas.home.stale) G.areas.home = buildHome(); return G.areas.home; }
    if (id === 'club') { if (!G.areas.club) G.areas.club = buildClub(); return G.areas.club; }
    if (ROOMS[id]) {
        const a = G.areas[id];
        if (!a || a.stale || a.day !== Clock.dayNum()) G.areas[id] = buildRoom(id);
        return G.areas[id];
    }
    return null;
}
function markRoomStale(id) { if (G.areas && G.areas[id]) G.areas[id].stale = true; }

/* where people stand in a room: staff behind the counter, guests near the middle, owners around their home */
function roomSpot(id, role, n) {
    const R = ROOMS[id];
    const px = (tx, ty) => [(tx + 0.5) * TILE, (ty + 0.5) * TILE + 4];
    if (role === 'guest' && R.guestSpots && n) {
        // the arcade: a free cabinet, facing the screen
        const taken = new Set(NPCs.list.filter(o => o !== n && !o.sleeping && o.want && o.want.area === id && o.want.slot != null).map(o => o.want.slot));
        const order = shuffled(R.guestSpots.map((_, i) => i), mulberry(hash32(n.id + ':' + Clock.dayNum())));
        const i = order.find(k => !taken.has(k));
        if (i != null) {
            const [fx, fy, face] = R.guestSpots[i];
            const [x, y] = toArea(fx, fy);
            const [sx, sy] = px(x, y);
            if (face) return { area: id, x: sx, y: sy, fixed: true, face, slot: i, seat: true };     // a seat at a table
            const playing = fy <= 3;                      // in front of a machine (the rest are seats)
            return { area: id, x: sx, y: sy, fixed: true, face: playing ? 'up' : 'down', slot: i, playing };
        }
    }
    if (role === 'staff' && R.staffAt) {
        const [x, y] = toArea(...R.staffAt);
        const [sx, sy] = px(x, y);
        return { area: id, x: sx, y: sy, fixed: true, face: 'down', stand: R.staffStand ? toArea(...R.staffStand) : [x, y + 2] };
    }
    const [fx, fy, r] = role === 'home' && R.home ? R.home : R.guest || [Math.floor(R.w / 2), Math.floor(R.h / 2), 2];
    const [x, y] = toArea(fx, fy);
    const [sx, sy] = px(x, y);
    return { area: id, x: sx, y: sy, anchor: [x, y], r };
}

/* ---------------------------------------------------------------- going in */
async function enterRoom(id) {
    Sfx.play('door');
    await fadeTo(async () => {
        const a = ensureArea(id);
        setArea(id, (a.doorTile[0] + 0.5) * TILE, (a.doorTile[1] - 0.2) * TILE, 'up');
    });
    Bus.emit('enter', id);
}
const HOUSE_HELLO = {
    maki: ['Come in. Shoes off. Rice off. (That was a joke. Keep your rice.)', 'Welcome to my home. Everything is exactly where it should be. Please keep it that way.'],
    kai: ["Duuude, come in! Mind the sand. It's everywhere. It's a lifestyle.", 'Bowl-oha! Welcome to the shack!'],
    basil: ['Come in, come in. Something is always simmering. Relax.', 'Welcome. Smells like lime in here. That is on purpose.'],
    chili: ["Oh, you came in. It's hot in here. It's always hot in here.", "Welcome to the hottest house on the island. Literally. I checked."],
    coco: ["OH my GOD, come in! Sit anywhere! Not there. Anywhere else.", "Welcome to Gossip Headquarters. I mean, my house."],
    cece: ["Oh! Hi! Come in! Sorry about the mess! There's no mess. Sorry!", "Welcome! I just baked. I'm always just baking. Sorry!"],
    clementine: ['Darling. Welcome. Try not to be jealous.', 'Come in, darling. Everything is orange. If you\'re finding it overwhelming, try being orange.'],
    cuke: ["GOOD MORNING! Oh wait, it's not. Come in anyway!", "Welcome! I've been up since 4! Have some water!"],
    sully: ["Get in heah, kid. Wipe your feet. Make yourself at home.", "C'mon in. Coffee's on. It's always on."],
    joe: ["Hi! Come in. Mind the pages by the chair; that's a poem still deciding what order to go in.", "Welcome to my house! It's also my office. And my poetry library. It's one room."],
    ginger: ["Come in, come in! Mind the sawdust. It's decorative.", "Welcome to my house! It's mostly workshop. The bed is the only thing I didn't build. I built it."],
    brulee: ['Entrez! Welcome. Look around. Everything is art if you squint.', 'Bienvenue! My little gallery. My little home. Same thing, really.'],
    mac: ["Come in! Sit! Are you hungry? You look hungry.", "Welcome, welcome! Don't mind the smell. It's cheese. It's always cheese."],
};
/* knocking on a neighbor's door: come in if they're home and awake */
async function visitHouse(id) {
    const R = ROOMS[id], owner = R.owner, n = NPCs.get(owner);
    Sfx.play('knock');
    // (off on vacation: a note on the door, 6zj_vacations.js)
    const vac = awayNow(owner) && vacationOf(owner, Clock.dayNum());
    if (vac) { await UI.say(null, `There's a note on the door: "Gone to ${vac.place}! Back ${vac.back - Clock.dayNum() <= 0 ? 'this afternoon' : vac.back - Clock.dayNum() === 1 ? 'tomorrow' : 'in ' + (vac.back - Clock.dayNum()) + ' days'}. Water my plants if you want. (You don't have to.) - ${NPC_DEFS[owner].name}"`); return; }
    if (!n || n.sleeping) {
        await UI.say(null, `Knock knock... ${NPC_DEFS[owner].name} is asleep. It's ${Clock.fmt().s}. Even on this island, that's bedtime.`);
        return;
    }
    if (n.area !== id) { await snoopIn(id); return; }
    await UI.say(owner, rpick(['Coming! ...Come in!', "It's open! Come in!", 'Oh! Come in, come in!']));
    await enterRoom(id);
    const r = rel(owner);
    if (!r.visitDay || r.visitDay !== Clock.dayNum()) {
        const first = !r.visited;
        r.visited = (r.visited || 0) + 1;
        r.visitDay = Clock.dayNum();
        const host = NPCs.get(owner);
        if (host && host.area === id) remember(owner, 'visit');
        if (host && host.area === id) {
            G.busy++;
            await waitFrames(16);
            host.emote = 'heart'; host.emoteT = 70;
            await UI.say(owner, voiced(owner, rpick(HOUSE_HELLO[owner] || ['Welcome!'])));
            if (first && r.met) { const up = addPts(owner, 3); if (up) await heartUp(host, up); }
            G.busy--;
        }
    }
}

/* ---------------------------------------------------------------- looking at other people's things */
async function roomFurniture(ent) {
    const a = G.area, R = a.room, it = ent.item, d = ent.def;
    const top = thingOnTop(ent);
    if (top) return top.interact();
    if (it && it.use) return roomUse(ent);
    if (furnSpin(ent)) return;          // (Shrimpy's ship's wheel, a globe or a snow globe at a neighbor's: 6zyb_acting.js)
    const owner = R && R.owner;
    // (nothing said about a thing just for looking at it: only what's written on it, or one of Sarah's gifts kept)
    if (!owner) return;
    const nm = NPC_DEFS[owner].name;
    if (it && it.gift) {
        const host = NPCs.here().find(n => n.id === owner);
        if (host && !host.sleeping) { host.emote = 'heart'; host.emoteT = 60; }
        await UI.say(null, rpick([`The ${d.name.toLowerCase()} you gave ${nm}. It has a place of honor.`, `${nm} kept the ${d.name.toLowerCase()} you gave them. It looks right at home.`,
            `Your ${d.name.toLowerCase()}! ${nm} put it where everybody can see it.`]));
        return;
    }
    if (d.photo) { await UI.say(null, `${NPC_DEFS[d.photo] ? NPC_DEFS[d.photo].name : 'Joe'}'s photo. ${nm} framed it.`); return; }
    const special = {
        'joe:typewriter': 'There is a poem in the typewriter: "I have a desk. / It is a desk. / I sit at it / to write the rest."',
        'joe:sonnet_stack': 'A tall stack of poems. The top one: "A frog. A log. / A different frog." It is still in progress.',
        'chili:trophy_hot': 'HOT SAUCE CHAMPION. The trophy is also, somehow, hot.',
        'maki:rice_cooker': 'The rice cooker has a label: "DO NOT TOUCH. I KNOW HOW MUCH RICE IS IN HERE."',
    }[owner + ':' + d.id];
    if (special) await UI.say(null, special);
}
/* fittings with a job (shop shelves, mannequins...) */
async function roomUse(ent) {
    const u = ent.item.use;
    if (u === 'buy') return buyItemAsk(ent.item.id);
    if (u === 'counter') { const n = NPCs.get(G.area.room.staff); if (n && !n.sleeping && n.area === G.area.id) return talkTo(n); return staffAway(); }
    if (u === 'tools') return buyTools();
    if (u === 'grocery') { UI.hideDialog(); return shopBuy('garden'); }
    if (u === 'mirror') { await UI.say(null, rpick(['Sarah checks herself in the mirror. The mirror has no notes.', 'Sarah does a little spin. The outfit works from the back, too. Good planning.'])); return openWardrobe(); }
    if (u === 'acc') return accTable();
    if (typeof u === 'function') return u(ent);
}
/* nobody at the counter (they're on a break, or off living their life): the place runs on the honor system */
const HONOR = {
    shop: [() => roomOpen('shop') ? 'Fortune stepped out. A sign on the register says: "HONOR SYSTEM! Leave the sand dollars in the cookie jar. Take a fortune if you like. - F"'
        : 'Fortune has gone home for the night. A sign on the register says: "OPEN ALL NIGHT ON THE HONOR SYSTEM! Sand dollars in the cookie jar, please. Sweet dreams. - F"', () => honorShop()],
    boutique: ['A little jar says: "Honor system, darling." A mannequin in sunglasses is watching.', () => shopClothes(false)],
    builder: ['Ginger is out on a job. A clipboard on the workbench says: "HONOR SYSTEM! Leave your order and the payment. The crew builds overnight. - G"', () => builderMenu()],
    museum: ['Brulee is on a break. A card on the desk says: "Honor system. Donations in the box, s\'il vous pla\u00eet. Do NOT tap the art. - B"', () => museumMenu()],
    restaurant: ["Mac is out. By the counter there's a fridge of wrapped-up meals and a jar that says HONOR SYSTEM. Mac trusts everybody.", () => orderFood()],
    salon: ['Floss is out. A sign on the desk says: "Self-serve styling! Honor system. Pay in the jar. Please do not cut your own bangs. - Floss"', () => salonChair()],
    displays: ["Waffle is out. A sign on the counter says: \"Honor system! Take what you need and leave the sand dollars in the syrup jar. - W\"", () => displaysShop()],
};
async function staffAway() {
    const h = HONOR[G.area.id];
    if (!h) { await UI.say(null, 'Nobody is at the counter right now. Everything here runs on the honor system.'); return; }
    await UI.say(null, typeof h[0] === 'function' ? h[0]() : h[0]);
    UI.hideDialog();
    return h[1]();
}
async function honorShop() {
    const k = await UI.ask(null, 'Buy something, or sell something? (The cookie jar keeps track. Somehow.)', ['Buy', 'Sell', 'Never mind'], { keep: true });
    UI.hideDialog();
    if (k === 0) await shopBuy();
    else if (k === 1) await shopSell();
}

/* ---------------------------------------------------------------- Fortune's Goods */
const SHOP_SLOTS = [[4, 0], [8, 0], [12, 0], [4, 3], [8, 3]];          // 3x2 display stages
function buildShopRoom(a) {
    const R = a.room;
    const st = shopStock();
    // fittings
    const fixed = layoutItems([
        ['shelf_wall', 0, 'wall'], ['sign_shop', 2, 'wall'], ['window_wall', 7, 'wall'], ['clock_wall', 11, 'wall'],
        ['counter_shop', 0, 1], ['cookie_jar', 0, 1], ['register', 2, 1], ['rack_tools', 0, 3], ['shelf_grocery', 0, 5],
        ['plant_monstera', ...shopCorner().plant], ['sunflower', 3, 6]]);
    fixed.forEach(it => { if (it.id === 'counter_shop') it.use = 'counter'; else if (it.id === 'rack_tools') it.use = 'tools'; else if (it.id === 'shelf_grocery') it.use = 'grocery'; });
    // today's furniture on the stages (wall things go up on the wall over a stage in the top row)
    const slots = shopSlots();
    const furn = st.furn.slice(0, slots.length);
    const wallFirst = furn.filter(id => FURN[id].kind === 'wall').concat(furn.filter(id => FURN[id].kind !== 'wall'));
    const items = fixed.slice();
    const stages = [], boards = [];
    const all = slots.map((_, i) => i);
    const used = new Set();
    for (const id of wallFirst) {
        const d = FURN[id];
        const si = all.find(i => !used.has(i));
        if (si == null) continue;
        used.add(si);
        const [sx, sy] = slots[si];
        const [ax, ay] = toArea(sx, sy);
        stages.push({ x: ax, y: ay, id, sale: id === st.sale });
        if (d.kind === 'wall') {
            // wall things hang on a display board standing on the stage
            boards.push([ax, ay, id, d]);
            continue;
        }
        if (d.kind === 'top') {
            items.push({ id: 'pedestal', x: ax + 1, y: ay + 1 });
            items.push({ id, x: ax + 1, y: ay + 1, on: items.length - 1, use: 'buy', sale: true });
            continue;
        }
        items.push({ id, x: ax + Math.floor((3 - d.w) / 2), y: ay + (2 - Math.min(2, d.h)), use: 'buy', sale: true });
    }
    // the last stage: today's flooring on the floor, today's wallpaper on an easel
    const [fx0, fy0] = toArea(...shopCorner().floor);
    if (st.floors[0]) stages.push({ x: fx0, y: fy0, id: st.floors[0], floor: true });
    a.items = items;
    placeFurniture(a, items);
    for (const [ax, ay, id, d] of boards) {
        const e = a.add({ kind: 'deco', x: (ax + 1.5) * TILE, y: (ay + 2) * TILE - 2, sale: id });
        e.draw = ctx => { spr(ctx, 'display_board', e.x, e.y); spr(ctx, d.frame || 'f_' + id, e.x, e.y - 11); };
        e.look3d = { board: id, frame: d.frame || 'f_' + id };
        e.hit = { x: ax * TILE, y: ay * TILE - 8, w: 3 * TILE, h: 2 * TILE + 8 };
        e.interact = () => buyItemAsk(id);
        for (let k = 0; k < 3; k++) a.block(ax + k, ay + 1);
    }
    if (st.walls[0]) {
        const wid = st.walls[0];
        const e = a.add({ kind: 'deco', x: (fx0 + 2.5) * TILE, y: (fy0 + 2) * TILE - 1, sale: wid });
        e.draw = ctx => { spr(ctx, 'easel', e.x, e.y); spr(ctx, 'ic_' + wid, e.x, e.y - 17); };
        e.look3d = { easel: 'ic_' + wid };
        e.hit = { x: (fx0 + 2) * TILE, y: fy0 * TILE, w: TILE, h: 2 * TILE };
        e.interact = () => buyItemAsk(wid);
        a.block(fx0 + 2, fy0 + 1);
    }
    if (st.floors[0]) {
        const fid = st.floors[0];
        const e = a.add({ kind: 'deco', layer: 0, x: (fx0 + 1) * TILE, y: (fy0 + 2) * TILE - 1 });
        e.draw = () => {};
        e.hit = { x: fx0 * TILE, y: fy0 * TILE, w: 2 * TILE, h: 2 * TILE };
        e.interact = () => buyItemAsk(fid);
    }
    a.stages = stages;
    a.drawUnder = ctx => {
        for (const s of a.stages) {
            if (s.floor) {
                for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) spr(ctx, 'fl_' + s.id, (s.x + x) * TILE, (s.y + y) * TILE);
                ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 1; ctx.strokeRect(s.x * TILE + 0.5, s.y * TILE + 0.5, 2 * TILE - 1, 2 * TILE - 1);
                continue;
            }
            const x = s.x * TILE, y = s.y * TILE;
            ctx.fillStyle = 'rgba(90,50,30,0.22)';
            ctx.fillRect(x + 2, y + 3, 3 * TILE - 2, 2 * TILE - 2);
            ctx.fillStyle = '#f7e7cc';
            ctx.fillRect(x + 1, y + 1, 3 * TILE - 2, 2 * TILE - 3);
            ctx.fillStyle = '#ead2ab';
            ctx.fillRect(x + 1, y + 2 * TILE - 5, 3 * TILE - 2, 3);
            spr(ctx, 'price_tag', x + 5, y + 2 * TILE - 2);
            if (s.sale) {
                // Fortune's pick: a red ribbon across the corner
                ctx.fillStyle = '#d8283f'; ctx.fillRect(x + 3 * TILE - 15, y + 2 * TILE - 9, 13, 6);
                ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 3 * TILE - 13, y + 2 * TILE - 7, 9, 2);
            }
        }
    };
}
/* buying one thing, from a stage, the rack or the easel */
async function buyItemAsk(id, sp) {
    const it = ITEMS[id];
    if (!it) return;
    const shop = shopHere(), price = shopPrice(id, shop);
    const f = NPCs.get('fortune');
    sp = sp !== undefined ? sp : (f && !f.sleeping && f.area === 'shop' ? 'fortune' : null);
    const d = FURN[id];
    const about = d ? ` ${SET_NAMES[d.sets[0]] || ''} set \u00b7 ${d.w}\u00d7${d.kind === 'wall' ? 1 : d.h}${d.kind === 'wall' ? ' wall' : d.kind === 'top' ? ' tabletop' : d.kind === 'rug' ? ' rug' : ''}.` : '';
    const k = await UI.ask(sp, `${it.name}.${about} ${price ? fmtNum(price) + ' sand dollars.' : ''}${priceNote(id, shop)}`, [price ? `Buy it (${fmtNum(price)})` : 'Take it (free)', 'Just looking']);
    if (k !== 0) return;
    await buyNow(id, price, sp);
}
async function buyNow(id, price, sp) {
    const it = ITEMS[id];
    if (S.money < price) { Sfx.ui('nope'); await UI.say(sp, "Hmm, not quite enough sand dollars. Shells, fruit and fish add up fast!"); return false; }
    if (it.type === 'bag') {
        addMoney(-price, true, buyWhy(id));
        noteSpend(shopHere(), price);
        upgradeBag();
        Sfx.play('fanfare');
        G.player.pose = 'cheer'; G.player.poseT = 30;
        await UI.say(sp, [`${it.name}! Ten more pockets. Your pocket now holds ${pocketSize()} things.`, rpick(['More room for shells. And fortunes. Mostly fortunes.', 'It even has a little pocket for fortune cookies. I checked.'])]);
        return true;
    }
    const big = ['furniture', 'wall', 'floor'].includes(it.type);
    const home = big || !canAdd(id, 1);             // full pockets: it goes home to storage
    addMoney(-price, true, buyWhy(id));
    if (big) { toStorage(id, 1); UI.toast(`${it.name} delivered to your house`, it.icon); }
    else receive(id, 1);
    if (id === 'rod') S.flags.rodBought = true;
    Sfx.play('buy');
    S.stats.bought = (S.stats.bought || 0) + 1;
    shopPaid(shopHere(), id, price);
    if (sp === 'fortune') { const f = NPCs.get('fortune'); if (f) { f.emote = 'sparkle'; f.emoteT = 50; } }
    await UI.say(sp, home ? rpick(["Thank you! It'll be at your house. The delivery is instant. The delivery is also me.", 'Great choice! Sent to your house already!'])
        : rpick(['Thank you! Enjoy!', 'Great choice!', "Pleasure doing business! May your cookies always crack evenly."]));
    return true;
}
const TOOL_STOCK = ['axe', 'shovel', 'can', 'sapling', 'rod'];
async function buyTools() {
    const f = NPCs.get('fortune');
    const sp = f && !f.sleeping && f.area === 'shop' ? 'fortune' : null;
    const ids = TOOL_STOCK.filter(id => ITEMS[id]).concat(nextBag() ? [nextBag()] : []);
    const opts = ids.map(id => `${itemName(id)} (${fmtNum(ITEMS[id].price)})`).concat(['Just looking']);
    const k = await UI.ask(sp, 'The tool rack. Everything an island needs.', opts);
    if (k >= ids.length) return;
    await buyNow(ids[k], ITEMS[ids[k]].price, sp);
}

/* ---------------------------------------------------------------- Clementine's */
function buildBoutiqueRoom(a) {
    const st = shopStock();
    const items = layoutItems([
        ['window_wall', 0, 'wall'], ['fabric_shelf', 3, 'wall'], ['sign_boutique', 6, 'wall'], ['window_wall', 9, 'wall'],
        ['clothes_rack', 0, 0], ['sewing_table', 3, 0], ['counter_boutique', 8, 1], ['register', 8, 1], ['orange_vase', 10, 1], ['acc_table', 6, 3],
        ['mirror_stand', 10, 3], ['plant_monstera', 0, 5], ['plant_monstera', 10, 5],
        ...[['window_wall', 12, 'wall'], ['window_wall', 14, 'wall']].slice(0, shopLevel('boutique') - 1)]);
    items.forEach(it => {
        if (it.id === 'counter_boutique') it.use = 'counter'; else if (it.id === 'acc_table') it.use = 'acc'; else if (it.id === 'mirror_stand') it.use = 'mirror';
        else if (it.id === 'sewing_table') it.use = () => sewingMachine();
        else if (it.id === 'fabric_shelf') it.use = () => UI.say(boutiqueVoice(), boutiqueVoice() ? 'Fabric, darling. Every color. Use the sewing machine and make something nobody else has.' : 'Bolts of fabric in every color. The sewing machine is right there.');
    });
    a.items = items;
    placeFurniture(a, items);
    // mannequins wearing today's outfits
    const spots = boutiqueSpots();
    const outfits = st.clothes.filter(id => ITEMS[id].type === 'outfit').slice(0, spots.length);
    spots.forEach(([fx, fy], i) => {
        const id = outfits[i];
        if (!id) return;
        const [x, y] = toArea(fx, fy);
        const e = a.add({ kind: 'mannequin', frame: 'mannequin_' + ITEMS[id].wear, x: (x + 0.5) * TILE, y: (y + 1) * TILE - 2, sale: id });
        e.hit = { x: x * TILE, y: y * TILE - 12, w: TILE, h: TILE + 12 };
        e.interact = () => mannequinAsk(id);
        a.block(x, y);
    });
    // the accessories lie on the glass table
    const table = a.ents.find(e => e.furn && e.def.id === 'acc_table');
    if (table) {
        const accs = table.accs = st.clothes.filter(id => ITEMS[id].type === 'acc');
        table.draw = ctx => {
            spr(ctx, table.frame, table.x, table.y);
            accs.slice(0, 5).forEach((id, i, all) => spr(ctx, ITEMS[id].icon, table.x + (i - (all.length - 1) / 2) * 7, table.y - 12));
        };
    }
}
function boutiqueVoice() {
    const c = NPCs.get('clementine');
    return c && !c.sleeping && c.area === 'boutique' ? 'clementine' : null;
}
async function mannequinAsk(id) {
    const it = ITEMS[id], sp = boutiqueVoice();
    const owned = S.wardrobe.outfits.includes(it.wear);
    const trying = S.player.outfit === it.wear && G.tryOn;
    const price = shopPrice(id, 'boutique');
    const opts = [price ? `Buy it (${fmtNum(price)})` : 'Take it (free)', trying ? 'Take it off' : 'Try it on', 'Just looking'];
    const k = await UI.ask(sp, `${it.name}.${owned ? ' (Already in your wardrobe.)' : ''} ${price ? fmtNum(price) + ' sand dollars.' : ''}${priceNote(id, 'boutique')}`, opts);
    if (k === 0) {
        if (await buyNow(id, price, sp)) {
            if (trying) {
                // she was already wearing it: straight into the wardrobe
                if (!S.wardrobe.outfits.includes(it.wear)) S.wardrobe.outfits.push(it.wear);
                removeItem(id, 1);
                G.tryOn = null;
                UI.toast(`${it.name} added to your wardrobe`, it.icon);
            }
        }
    } else if (k === 1) {
        if (trying) { S.player.outfit = G.tryOn.was; G.tryOn = null; Sfx.play('pick'); return; }
        if (!G.tryOn) G.tryOn = { was: S.player.outfit };
        S.player.outfit = it.wear;
        const p = G.player;
        p.pose = 'happy'; p.poseT = 50; p.dir = 'down';
        p.emote = 'sparkle'; p.emoteT = 60;
        Sfx.play('item');
        await UI.say(sp, sp ? rpick(['Darling. Yes. Turn around. Yes.', 'Oh, that is SO you. Or it will be, once you pay for it.', 'Lovely. Hold still a moment so I can admire my excellent recommendation.'])
            : 'Sarah tries it on. The mannequin seems to approve. It is hard to tell. It has no face.');
    }
}
async function accTable() {
    const sp = boutiqueVoice();
    const st = shopStock();
    const accs = st.clothes.filter(id => ITEMS[id].type === 'acc');
    const opts = accs.map(id => `${itemName(id)} (${shopPrice(id, 'boutique') ? fmtNum(shopPrice(id, 'boutique')) : 'free'})`).concat(['Just looking']);
    const k = await UI.ask(sp, sp ? 'The accessories, darling. They finish a look. Or start one.' : 'A glass table of accessories. A tiny sign: "Honor system, darling."', opts);
    if (k >= accs.length) return;
    await buyNow(accs[k], shopPrice(accs[k], 'boutique'), sp);
}
/* leaving the boutique in something you didn't buy puts it back */
Bus.on('leave', from => {
    if (from !== 'boutique' || !G.tryOn) return;
    const was = G.tryOn.was;
    if (!S.wardrobe.outfits.includes(S.player.outfit)) {
        S.player.outfit = was;
        UI.toast('Sarah puts the outfit back on the mannequin. Very responsible.');
    }
    G.tryOn = null;
});

/* ---------------------------------------------------------------- shops say hi, close up, and hosts say goodnight */
Bus.on('enter', id => {
    const R = ROOMS[id];
    if (!R || !R.staff) return;
    if (id === 'arcade' && !S.flags.arcadeTour) return;           // Chili gives the tour instead
    const n = NPCs.get(R.staff);
    if (!n || n.sleeping || n.area !== id) {
        // open, but nobody's minding the counter
        if (n && roomOpen(id)) setTimeout(() => { if (G.area.id === id) UI.toast(`${n.def.name} is out right now. It's the honor system!`, n.def.sprite + '_0'); }, 400);
        return;
    }
    const key = 'hi_' + id;
    if (S.flags[key] === Clock.dayNum()) return;
    S.flags[key] = Clock.dayNum();
    n.emote = 'note'; n.emoteT = 70;
    const hi = { shop: ['Welcome in!', 'Hello hello! Browse away!', "Welcome to Fortune's! Everything's fresh!"],
        boutique: ['Welcome, darling.', 'Darling! Browse. Touch. Buy.', 'Oh good, someone with taste.'],
        arcade: ["Welcome to the arcade! Check the high scores. Preferably the ones with my name on them.", 'Tickets at the counter, games over there. Try to leave my records intact.', "Hey! Pick a game. I'll be over here, looking very calm about how well you do."] }[id] || ['Welcome!'];
    setTimeout(() => UI.toast(`${n.def.name}: "${voiced(n.id, rpick(hi))}"`, n.def.sprite + '_0'), 400);
});
let roomCheckT = 0;
async function roomChecks() {
    const a = G.area;
    if (!a || !a.room || G.busy || UI.modal || UI.dialogOpen || G.mode !== 'play' || Decor.on) return;
    const R = a.room;
    if (R.owner) {
        if (G.snoop && G.snoop.room === a.id && !G.snoop.caught) { await snoopChecks(a); return; }
        const want = targetFor(NPCs.get(R.owner), dayHour());
        if (want.sleep) {
            G.busy++;
            const n = NPCs.get(R.owner);
            n.emote = 'zzz'; n.emoteT = 90;
            await UI.say(R.owner, voiced(R.owner, (dayHour() < 12 ? rpick(["*yawn* Oh! {name}! I'm not up yet. Come back in a little while?", "Mmf... five more minutes. Come back later, {name}?"]) : rpick(["*yawn* Oh, look at the time. It's my bedtime! Thanks for coming over.", "I'm getting sleepy. Come back tomorrow? Goodnight, {name}!"]))));
            G.busy--;
            await leaveInterior();
        }
        return;
    }
    // (a shop no longer puts Sarah out at closing time: she can stay and shop on the honor system, David, 29 October)
}

/* ---------------------------------------------------------------- furniture as a gift: it goes into their home */
const FURN_GIFT = {
    maki: ['I will find the precise spot for this. There is always a precise spot.', 'I know a good spot. I\'ll show you next time you visit.'],
    kai: ["Duuude, this is going right in the shack. Come see it!", 'Sick! My place needed this. My place needed, like, everything.'],
    basil: ["This will look perfect by the window. Come by and see it sometime.", 'Thank you. I was going to rearrange the room anyway. I wasn\'t, but now I am.'],
    chili: ["This is going by my chair. People can admire it while they pretend they didn't come over to borrow sauce.", "Nice. It's going front and center."],
    coco: ["This needs to be somewhere visitors can see it. I want them to ask. I'll practice looking surprised.", "I'm putting this where EVERYONE can see it."],
    cece: ["For my house? Oh! I'll clear a spot. The cake tins can move. They won't like it, but they can.", "Thank you! It's going right next to the cheesecakes!"],
    clementine: ["Darling. This is going somewhere very visible. It deserves an audience.", "I'll style it. Come see it styled."],
    cuke: ['I will put it up first thing tomorrow! At 4 AM!', "Oh nice! My house needed this! Come see it! Early!"],
    sully: ["Kid, this is goin' right in the living room. Wicked nice.", "Alright, this is goin' up tonight. Come see it."],
    joe: ["I'm putting this by my desk. I want it to see the writing process. Very few people have that privilege. Mostly the goat.", 'This is going right by my desk. My desk is also my bed. Well, near it.'],
    ginger: ["Ooh, this is going in the house. I'll build it a little shelf. I'll build the shelf a little shelf.", 'Nice craftsmanship! Going right in the front room.'],
    brulee: ['I will display it properly. With lighting. And a tiny label.', 'For my home? It will be the centerpiece. Magnifique.'],
    mac: ["This is going right by the kitchen. Everything good goes by the kitchen.", "For my place? Aww. Come over and eat next to it sometime."],
};
async function furnitureGift(n, itemId) {
    const id = n.id, d = n.def, t = ITEMS[itemId].type;
    if (d.goat) { await UI.say(null, `The goat sniffs the ${itemName(itemId).toLowerCase()}. It appears to be considering where the grass would go.`, { keep: true }); return; }
    if (!d.house || !ROOMS[d.house]) return;
    const r = rel(id);
    if (t === 'wall') r.wall = itemId;
    else if (t === 'floor') r.floor = itemId;
    else {
        r.furn = r.furn || [];
        r.furn.push(itemId);
        if (r.furn.length > 12) r.furn.shift();
    }
    markRoomStale(d.house);
    await UI.say(id, voiced(id, t === 'wall' ? "New wallpaper? I'm putting it up tonight. Come see!" : t === 'floor' ? "New floors! Oh, my house is going to look so good." : rpick(FURN_GIFT[id] || ['I know exactly where this goes. Come see it sometime!'])), { keep: true });
}

