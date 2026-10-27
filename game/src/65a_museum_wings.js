/* ---- 65a_museum_wings.js ---- */
/* The museum in rooms (David, 26 October: "a room for each kind of thing given to it: paintings, pottery and so on, each
   laid out for its kind, walked through from the entrance hall"). The hall (65_museum.js: Brulee's desk and the easel
   corner) has an archway for each wing on its back wall; walking up through one goes into that wing, and the wing's door
   leads back to the hall. The gallery hangs the paintings (five on the wall, three on easels), the pottery hall has ten
   pedestals, the aquarium has every fish in the game in its tanks from the start, the photography wing frames photos from
   the camera's album or real ones uploaded from a computer or a phone (kept with the album on the server: a photo with
   museum set is on the wall and never pushed out of the album), the fashion wing dresses its dress forms in Sarah's own
   designs (copies, in S.art.fashion) and island history keeps what was found in each of the island's old mysteries,
   with the island's founding on a plaque. */
const MUSEUM_WINGS = [
    { id: 'museum_art', name: 'Paintings', door: 1, icon: 'f_easel' },
    { id: 'museum_pots', name: 'Pottery', door: 4, icon: 'f_orange_vase' },
    { id: 'museum_fish', name: 'Aquarium', door: 7, icon: 'fish_koi' },
    { id: 'museum_photo', name: 'Photography', door: 9, icon: 'app_camera' },
    { id: 'museum_fashion', name: 'Fashion', door: 12, icon: 'mannequin_sundress' },
    { id: 'museum_history', name: 'Island History', door: 15, icon: 'ic_oldmap' },
];
const WING_ROOMS = {
    museum_art: { w: 14, h: 7, wall: 'wall_gallery', floor: 'floor_parquet', build: a => buildGallery(a) },
    museum_pots: { w: 13, h: 6, wall: 'wall_cream', floor: 'floor_marble', build: a => buildPotteryHall(a) },
    museum_fish: { w: 15, h: 7, wall: 'wall_night', floor: 'floor_blue', build: a => buildAquarium(a) },
    museum_photo: { w: 14, h: 6, wall: 'wall_gallery', floor: 'floor_wood', build: a => buildPhotoWing(a) },
    museum_fashion: { w: 13, h: 6, wall: 'wall_boutique', floor: 'floor_salon', build: a => buildFashionWing(a) },
    museum_history: { w: 13, h: 6, wall: 'wall_stone', floor: 'floor_boards', build: a => buildHistoryWing(a) },
};
for (const W of MUSEUM_WINGS) ROOMS[W.id] = Object.assign({ music: 'museum', name: `The Museum: ${W.name}`, exitTo: 'museum', exitAt: [W.door, 0], building: 'museum' }, WING_ROOMS[W.id]);
function isMuseumRoom(id) { return id === 'museum' || !!ROOMS[id] && ROOMS[id].exitTo === 'museum'; }

/* a sprite drawn smaller (a painting on an easel, a fish in a tank) */
function sprScaled(ctx, name, x, y, s, flip) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); spr(ctx, name, 0, 0, flip); ctx.restore();
}
/* rebuild a room around Sarah if she's in it (after something changes on display), or next time she comes in */
function refreshRoomHere(id) {
    if (G.area && G.area.id === id) {
        const p = G.player, x = p.x, y = p.y, dir = p.dir;
        G.areas[id] = buildRoom(id);
        G.area = G.areas[id];
        p.x = x; p.y = y; p.dir = dir;
    } else markRoomStale(id);
}

/* ---------------------------------------------------------------- the hall's archways */
function museumArches(a) {
    a.upDoors = [];
    for (const W of MUSEUM_WINGS) {
        const [x, y] = toArea(W.door, -1);                  // (the wall just above the floor's first row)
        a.block(x, y, 0);                                   // (open: walking up into it goes through)
        const e = a.add({ kind: 'deco', x: (x + 0.5) * TILE, y: (y + 1) * TILE + 1 });
        e.draw = ctx => drawArch(ctx, x * TILE, (y + 1) * TILE, W);
        e.look3d = { arch: W.id };
        e.hit = { x: x * TILE, y: y * TILE - 8, w: TILE, h: TILE + 10 };
        e.interact = () => enterWing(W);
        e.label = W.name;
        a.upDoors.push({ x, go: () => enterWing(W) });
    }
}
function drawArch(ctx, px, by, W) {
    // a stone frame round a dim opening with a round top, the wing's floor running in; a plaque above with a little
    // picture of what's inside
    ctx.fillStyle = '#b8b0a0'; ctx.fillRect(px + 1, by - 24, 14, 24);
    ctx.fillStyle = '#e8e2d6'; ctx.fillRect(px + 2, by - 23, 12, 23);
    ctx.fillStyle = '#2a2026'; ctx.fillRect(px + 4, by - 18, 8, 18); ctx.fillRect(px + 5, by - 20, 6, 2);
    ctx.fillStyle = '#4a3a34'; ctx.fillRect(px + 4, by - 5, 8, 5);
    ctx.fillStyle = '#c8c0b0'; ctx.fillRect(px + 7, by - 24, 2, 3);
    ctx.fillStyle = '#c8a048'; ctx.fillRect(px + 2, by - 32, 12, 7);
    ctx.fillStyle = '#2c2a3a'; ctx.fillRect(px + 3, by - 31, 10, 5);
    sprScaled(ctx, W.icon, px + 8, by - 8, 0.5);
}
/* the plaque's lettering, for the new look's archway */
function museumPlaque(id) {
    const c = museumPlaque.cache || (museumPlaque.cache = {});
    if (c[id]) return c[id];
    const W = MUSEUM_WINGS.find(w => w.id === id), cv = document.createElement('canvas');
    cv.width = 320; cv.height = 70;
    const g = cv.getContext('2d');
    g.fillStyle = '#2c2a3a'; g.fillRect(0, 0, cv.width, cv.height);
    g.fillStyle = '#f2d880'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '600 34px Georgia, "Times New Roman", serif';
    g.fillText((W ? W.name : '').toUpperCase(), cv.width / 2, cv.height / 2 + 2, cv.width - 24);
    return (c[id] = cv);
}
async function enterWing(W) {
    if (enterWing.busy) return;
    enterWing.busy = true;
    try {
        Sfx.play('step');
        const R = ROOMS[W.id];
        await goRoom(W.id, [Math.floor(R.w / 2), R.h - 1], 'up');
    } finally { enterWing.busy = false; }
}

/* ---------------------------------------------------------------- the gallery */
function buildGallery(a) {
    const rows = [['museum_bench', 3, 5], ['museum_bench', 9, 5], ['plant_monstera', 0, 6], ['plant_monstera', 13, 6]];
    const hung = museumWall().map(id => { if (id && id.startsWith('art_by_')) npcArtPiece(id.slice(7)); return id; });
    MUSEUM_WALL.forEach(([x, y], i) => { if (y === 'wall') rows.push([hung[i] || 'empty_frame', x, 'wall']); });
    const items = layoutItems(rows);
    items.forEach(it => {
        if (it.id === 'empty_frame') it.use = () => UI.say(null, 'An empty frame. A little card underneath says: "Reserved for Sarah." (Brulee can change what hangs in the gallery.)');
        else if (FURN[it.id] && (FURN[it.id].art || ART_STARTERS[it.id])) it.use = () => viewArt(it.id);
        else if (it.id === 'museum_bench') it.use = () => UI.say(null, rpick(['Sarah sits on the gallery bench and looks at the art for a while. Very cultured.', 'A velvet bench. It is for looking at paintings. Sarah looks at paintings.']));
    });
    a.items = items;
    placeFurniture(a, items);
    MUSEUM_WALL.forEach(([x, y], i) => { if (y !== 'wall') artEasel(a, x, y, hung[i]); });
}
/* a painting on an easel in the middle of the room */
function artEasel(a, fx, fy, id) {
    const [x, y] = toArea(fx, fy), frame = id && FURN[id] ? FURN[id].frame || 'f_' + id : null;
    const e = a.add({ kind: 'deco', x: (x + 0.5) * TILE, y: (y + 1) * TILE - 1 });
    e.draw = ctx => { spr(ctx, 'easel', e.x, e.y); if (frame) sprScaled(ctx, frame, e.x, e.y - 15, 0.5); };
    e.look3d = { easel: frame || 'f_empty_frame' };
    e.hit = { x: x * TILE, y: y * TILE - 16, w: TILE, h: 2 * TILE };
    e.interact = () => (id ? viewArt(id) : UI.say(null, 'An empty easel. A card says: "Reserved for Sarah." (Brulee can change what stands here.)'));
    a.block(x, y, 1);
    return e;
}

/* ---------------------------------------------------------------- the pottery hall */
function buildPotteryHall(a) {
    const rows = [['window_wall', 3, 'wall'], ['clock_wall', 6, 'wall'], ['window_wall', 9, 'wall'], ['plant_monstera', 0, 5], ['plant_monstera', 12, 5]];
    const peds = museumPeds();
    MUSEUM_PEDESTALS.forEach(([x, y], i) => {
        const pid = peds[i];
        if (pid && FURN[pid] && FURN[pid].kind === 'floor') { rows.push([pid, x, y]); return; }
        rows.push(['pedestal', x, y]);
        if (pid) rows.push([pid, x, y]);
    });
    const items = layoutItems(rows);
    items.forEach(it => {
        if (it.id === 'pedestal') it.use = () => UI.say(null, 'An empty pedestal. A card says: "For pottery made on this island. Ask Brulee!"');
        else if (ITEMS[it.id] && ITEMS[it.id].pottery) it.use = () => UI.say(null, `On the pedestal: "${itemName(it.id)}." Pottery by Sarah.${labelOf(it.id) && labelOf(it.id).desc ? ` The little card says: "${labelOf(it.id).desc}"` : ' Brulee has polished it until it gleams.'}`);
        else if (it.id === 'orange_vase' || it.id === 'rose_vase') it.use = () => UI.say(null, `On the pedestal: ${it.id === 'orange_vase' ? 'an orange vase' : 'a vase of roses'} from Brulee's own collection. It's keeping the spot warm until Sarah donates some pottery.`);
    });
    a.items = items;
    placeFurniture(a, items);
}

/* ---------------------------------------------------------------- the aquarium */
/* every fish in the game, from the start: a tank for the rivers, the sea and the ponds, and a touch pool for the ones
   with shells and arms (any fish added later swims in the sea tank) */
const AQUARIUM = [
    { at: [1, 0], name: 'Rivers', fish: ['trout', 'ayu', 'salmon', 'eel'], note: 'Cold, quick water from the falls. The trout race the bubbles.' },
    { at: [6, 0], name: 'The Sea', fish: ['mackerel', 'seabream', 'seabass', 'yellowtail', 'tuna', 'pufferfish', 'moonfish', 'sunrise'], note: 'The big tank. The tuna swims laps. The pufferfish does not.' },
    { at: [11, 0], name: 'Ponds', fish: ['koi', 'goldfish', 'catfish', 'crawfish'], note: 'Still, green water, like the pond by the meadow. The koi are very calm about it.' },
    { at: [6, 3], name: 'The touch pool', pool: true, fish: ['squid', 'octopus', 'shrimp', 'lobster'], note: 'Look, don\'t touch. (Brulee changed the sign. It used to say "touch".)' },
];
function aquariumTanks() {
    const listed = new Set(AQUARIUM.flatMap(T => T.fish));
    const more = FISHES.map(f => f.id).filter(id => !listed.has(id) && id !== 'boot' && ITEMS[id]);
    return AQUARIUM.map(T => (T.name === 'The Sea' && more.length ? Object.assign({}, T, { fish: T.fish.concat(more) }) : T));
}
function buildAquarium(a) {
    const items = layoutItems([['museum_bench', 1, 5], ['museum_bench', 12, 5], ['plant_monstera', 0, 6], ['plant_monstera', 14, 6]]);
    items.forEach(it => { if (it.id === 'museum_bench') it.use = () => UI.say(null, 'Sarah sits and watches the fish go round. Then round again. It is very calming.'); });
    a.items = items;
    placeFurniture(a, items);
    for (const T of aquariumTanks()) {
        const [x, y] = toArea(T.at[0], T.at[1]);
        const e = a.add({ kind: 'deco', x: (x + 1.5) * TILE, y: (y + 1) * TILE - 1 });
        e.draw = ctx => (T.pool ? drawTouchPool(ctx, e, T) : drawTank(ctx, e, T));
        e.look3d = { tank: T.fish.filter(id => ITEMS[id]), pool: !!T.pool };
        e.hit = { x: x * TILE, y: y * TILE - (T.pool ? 4 : 18), w: 3 * TILE, h: TILE + (T.pool ? 4 : 18) };
        e.interact = () => aquariumCard(T);
        for (let k = 0; k < 3; k++) a.block(x + k, y, 1);
    }
}
function drawTank(ctx, e, T) {
    const x0 = Math.round(e.x - 24), by = e.y + 1, t = G.t;
    ctx.fillStyle = '#5a3a26'; ctx.fillRect(x0 + 1, by - 10, 46, 10);
    ctx.fillStyle = '#7a5236'; ctx.fillRect(x0 + 2, by - 9, 44, 8);
    ctx.fillStyle = '#5a3a26'; for (const k of [16, 31]) ctx.fillRect(x0 + k, by - 9, 1, 8);
    const g = ctx.createLinearGradient(0, by - 30, 0, by - 10);
    g.addColorStop(0, '#7ac8e8'); g.addColorStop(1, '#1e5a8a');
    ctx.fillStyle = g; ctx.fillRect(x0 + 2, by - 29, 44, 19);
    ctx.fillStyle = '#e8d8a8'; ctx.fillRect(x0 + 2, by - 12, 44, 2);
    ctx.fillStyle = '#3a9a4a'; for (const k of [5, 13, 27, 38, 43]) ctx.fillRect(x0 + k + Math.round(Math.sin(t / 30 + k)), by - 18, 1, 6);
    T.fish.forEach((id, i) => {
        if (/^(squid|octopus|shrimp|crawfish|lobster)$/.test(id)) { sprScaled(ctx, 'fish_' + id, x0 + 8 + i * 9, by - 9, 0.45); return; }
        const ph = t / (70 + i * 9) + i * 1.7, fx = x0 + 9 + (Math.sin(ph) * 0.5 + 0.5) * 30, fy = by - 25 + (i % 4) * 3.4;
        sprScaled(ctx, 'fish_' + id, fx, fy + 6, 0.45, Math.cos(ph) < 0);
    });
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x0 + 4, by - 27, 1, 12); ctx.fillRect(x0 + 6, by - 27, 1, 5);
    ctx.fillStyle = '#3a2a22'; ctx.fillRect(x0 + 1, by - 30, 46, 1); ctx.fillRect(x0 + 1, by - 30, 1, 20); ctx.fillRect(x0 + 46, by - 30, 1, 20);
    ctx.fillStyle = '#5a3a26'; ctx.fillRect(x0, by - 33, 48, 3);
}
function drawTouchPool(ctx, e, T) {
    const x0 = Math.round(e.x - 24), by = e.y + 1, t = G.t;
    ctx.fillStyle = '#9a9284'; ctx.fillRect(x0 + 1, by - 9, 46, 9);
    ctx.fillStyle = '#c8c0b0'; ctx.fillRect(x0 + 1, by - 11, 46, 3);
    ctx.fillStyle = '#4aa8d8'; ctx.fillRect(x0 + 4, by - 10, 40, 6);
    T.fish.forEach((id, i) => sprScaled(ctx, 'fish_' + id, x0 + 9 + i * 10, by - 3, 0.45, i % 2 === 1));
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x0 + 8 + ((t >> 3) % 30), by - 9, 3, 1);
}
/* what's in a tank: each fish, where and when it's caught, and whether Sarah has caught one */
function aquariumCard(T) {
    const P = UI.open({ title: T.name });
    P.body.appendChild(el('p', 'muted', T.note));
    const list = el('div', 'list');
    for (const id of T.fish) {
        const f = FISHES.find(q => q.id === id);
        if (!f || !ITEMS[id]) continue;
        const row = el('div', 'row');
        row.appendChild(iconCanvas('fish_' + id, 40));
        const t = el('div', 't');
        t.appendChild(el('b', null, itemName(id)));
        const where = [f.where.includes('s') ? 'the sea' : null, f.where.includes('r') ? 'rivers' : null, f.where.includes('p') ? 'ponds' : null].filter(Boolean).join(', ');
        const when = f.seasons.length >= 4 ? 'all year' : f.seasons.join(', ');
        const hours = f.hours[0] === 0 && f.hours[1] >= 24 ? 'any time' : `${fmtOpen(f.hours[0] % 24)} to ${fmtOpen(f.hours[1] % 24)}`;
        t.appendChild(el('span', null, `${cap(where)} · ${when} · ${hours}${S.seen && S.seen[id] ? ' · Sarah has caught one' : ''}`));
        row.appendChild(t);
        list.appendChild(row);
    }
    P.body.appendChild(list);
}

/* ---------------------------------------------------------------- photography */
/* five frames on the wall and four easels; a photo hangs in a spot when it has museum set (its spot's number) */
const MUSEUM_PHOTO_SPOTS = [[6, 'wall'], [3, 'wall'], [9, 'wall'], [0, 'wall'], [12, 'wall'], [2, 3], [5, 3], [8, 3], [11, 3]];
const PHOTO_SPOT_NAMES = ['The middle of the wall', 'Left of the middle', 'Right of the middle', 'The far left', 'The far right', 'The first easel', 'The second easel', 'The third easel', 'The fourth easel'];
const MPHOTO = new Map();          // url -> the loaded picture
function museumPhotos() {
    const out = MUSEUM_PHOTO_SPOTS.map(() => null);
    for (const p of Photos.list()) if (p.museum != null && p.museum >= 0 && p.museum < out.length && !out[p.museum]) out[p.museum] = p;
    return out;
}
/* a museum photo as a piece that hangs: a small framed picture for the flat view, a sharp one for the new look */
function photoPiece(p) {
    const name = 'mphoto_' + p.t;
    if (Assets.dyn[name]) return name;
    let im = MPHOTO.get(p.url);
    if (!im) {
        im = new Image();
        im.onload = () => { im.ok = true; refreshRoomHere('museum_photo'); };
        im.src = p.url;
        MPHOTO.set(p.url, im);
    }
    if (!im.ok) return null;
    const draw = (k) => {
        const c = document.createElement('canvas');
        c.width = 32 * k; c.height = 26 * k;
        const g = c.getContext('2d'), [fc, edge] = ART_FRAMES.gold;
        g.fillStyle = edge; g.fillRect(k, k, 30 * k, 24 * k);
        g.fillStyle = fc; g.fillRect(2 * k, 2 * k, 28 * k, 22 * k);
        g.fillStyle = '#fbf8f2'; g.fillRect(3 * k, 3 * k, 26 * k, 20 * k);
        // (the photo cropped to fill its window, keeping its shape)
        const W = 24 * k, H = 18 * k, s = Math.max(W / im.naturalWidth, H / im.naturalHeight), sw = W / s, sh = H / s;
        g.imageSmoothingEnabled = true;
        g.drawImage(im, (im.naturalWidth - sw) / 2, (im.naturalHeight - sh) / 2, sw, sh, 4 * k, 4 * k, W, H);
        return c;
    };
    Assets.dyn[name] = { c: draw(1), w: 32, h: 26, ax: 16, ay: 25, hi: draw(8) };
    FURN[name] = { id: name, name: p.title || 'A photo', w: 2, h: 1, kind: 'wall', price: 0, frame: name, art: true, fixture: true, mphoto: true };
    return name;
}
function buildPhotoWing(a) {
    const shown = museumPhotos(), pieces = shown.map(p => (p ? photoPiece(p) : null));
    const rows = [['table_wood', 1, 5], ['paper_pile', 2, 5], ['plant_monstera', 13, 5]];
    MUSEUM_PHOTO_SPOTS.forEach(([x, y], i) => { if (y === 'wall') rows.push([pieces[i] || 'empty_frame', x, 'wall']); });
    const items = layoutItems(rows);
    items.forEach(it => {
        if (it.id === 'table_wood' || it.id === 'paper_pile') it.use = () => photoDesk();
        const i = MUSEUM_PHOTO_SPOTS.findIndex(([x, y]) => y === 'wall' && x === it.x - 1);
        if (i >= 0 && (it.id === 'empty_frame' || FURN[it.id] && FURN[it.id].mphoto)) it.use = () => photoSpot(i);
    });
    a.items = items;
    placeFurniture(a, items);
    MUSEUM_PHOTO_SPOTS.forEach(([x, y], i) => {
        if (y === 'wall') return;
        const [ax, ay] = toArea(x, y), frame = pieces[i];
        const e = a.add({ kind: 'deco', x: (ax + 0.5) * TILE, y: (ay + 1) * TILE - 1 });
        e.draw = ctx => { spr(ctx, 'easel', e.x, e.y); if (frame) sprScaled(ctx, frame, e.x, e.y - 15, 0.5); };
        e.look3d = { easel: frame || 'f_empty_frame' };
        e.hit = { x: ax * TILE, y: ay * TILE - 16, w: TILE, h: 2 * TILE };
        e.interact = () => photoSpot(i);
        a.block(ax, ay, 1);
    });
}
/* the desk by the door: hang a photo in the first free spot */
async function photoDesk() {
    const free = museumPhotos().findIndex(p => !p);
    if (free < 0) { await UI.say(null, 'A guest book and a stack of little cards. Every spot in the photography wing has a photo in it. Take one down to hang another.'); return; }
    await UI.say(null, 'A guest book and a stack of little cards: "Hang a photo of your island! Or of anywhere. Brulee is not picky about photos. (She is very picky about photos.)"', { keep: true });
    UI.hideDialog();
    await photoSpot(free);
}
async function photoSpot(i) {
    const p = museumPhotos()[i];
    if (p) return viewMuseumPhoto(p, i);
    if (visitorStop('museum')) return;
    return hangPhoto(i);
}
/* choose a photo for a spot: one from the album, or a real one from this device */
function hangPhoto(i) {
    return new Promise(res => {
        let done = false;
        const fin = v => { if (!done) { done = true; res(v); } };
        const P = UI.open({ title: `Hang a photo: ${PHOTO_SPOT_NAMES[i].toLowerCase()}`, onClose: () => fin(null) });
        P.body.appendChild(el('p', 'muted', 'A photo from your album, or a real one from this computer or phone. It stays on the wall, and in your album, until you take it down.'));
        const grid = el('div', 'grid photogrid');
        const all = Photos.list();
        all.forEach((p, k) => {
            if (p.museum != null) return;
            const b = el('button', 'slot');
            b.type = 'button'; b.title = (p.tags && p.tags[0]) || 'A photo'; b.setAttribute('aria-label', b.title);
            const im = el('img'); im.src = p.url; im.alt = ''; im.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:4px';
            b.appendChild(im);
            b.addEventListener('click', async () => { UI.close(true); fin(await placePhoto(i, k)); });
            grid.appendChild(b);
        });
        if (grid.children.length) P.body.appendChild(grid);
        else P.body.appendChild(el('p', 'muted', 'No photos in the album yet. Take some with the camera on your phone, or upload one.'));
        const up = btn('Upload a photo', 'green', async () => {
            const url = await pickPhotoFile();
            if (!url) return;
            UI.close(true);
            const l = Photos.list();
            l.unshift({ url, t: Date.now(), real: true });
            Photos.keep(l);
            fin(await placePhoto(i, 0));
        });
        P.body.appendChild(up);
    });
}
/* hang the album's k-th photo in spot i, with a name for its little card */
async function placePhoto(i, k) {
    const l = Photos.list(), p = l[k];
    if (!p) return false;
    const title = await askText('A name for its card', 'What is it?', p.title || (p.tags && p.tags[0]) || '', 40, null, 'Hang it');
    p.museum = i;
    if (title) p.title = String(title).replace(/\s+/g, ' ').trim().slice(0, 40);
    trimAlbum(l);
    Photos.keep(l);
    S.stats.donated = (S.stats.donated || 0) + 1;
    refreshRoomHere('museum_photo');
    Sfx.play('place');
    UI.toast(`"${p.title || 'A photo'}" is on the wall`, 'app_camera');
    return true;
}
/* (the album keeps twelve of its own: what's on the museum's wall doesn't count) */
function trimAlbum(l) {
    for (let n = l.filter(p => p.museum == null).length; n > 12; n--) {
        const k = l.map(p => p.museum == null).lastIndexOf(true);
        if (k < 0) break;
        l.splice(k, 1);
    }
    return l;
}
function viewMuseumPhoto(p, i) {
    return new Promise(res => {
        const P = UI.open({ title: p.title || 'A photo', onClose: res });
        const im = el('img', 'museumphoto');
        im.src = p.url; im.alt = p.title || 'A photo';
        im.style.cssText = 'display:block;max-width:100%;max-height:52vh;margin:0 auto;border:6px solid #c8a048;border-radius:3px';
        P.body.appendChild(im);
        const d = new Date(p.t);
        P.body.appendChild(el('p', 'artcap', `${p.real ? 'A real photo' : 'Taken on the island'}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`));
        if (p.tags && p.tags.length) P.body.appendChild(el('p', 'muted', p.tags.join(' · ')));
        if (Online.visitor()) return;
        const row = el('div', 'st-row');
        row.appendChild(chip('Rename', async () => {
            UI.close(true);
            const t = await askText('A name for its card', 'What is it?', p.title || '', 40, null, 'Save');
            if (t) { const l = Photos.list(), q = l.find(x => x.t === p.t && x.url === p.url); if (q) { q.title = String(t).replace(/\s+/g, ' ').trim().slice(0, 40); Photos.keep(l); } }
            delete FURN['mphoto_' + p.t]; delete Assets.dyn['mphoto_' + p.t];
            refreshRoomHere('museum_photo');
            res();
        }));
        row.appendChild(chip('Take it down', () => {
            const l = Photos.list(), q = l.find(x => x.t === p.t && x.url === p.url);
            if (q) { delete q.museum; Photos.keep(trimAlbum(l)); }
            UI.close(true);
            refreshRoomHere('museum_photo');
            UI.toast('Back in your album', 'app_camera');
            res();
        }));
        P.body.appendChild(row);
    });
}
/* a real photo from this computer or phone, made smaller for the album (about 720 pixels across, a JPEG) */
function pickPhotoFile() {
    return new Promise(res => {
        const inp = document.createElement('input');
        inp.type = 'file'; inp.accept = 'image/*';
        inp.addEventListener('change', () => {
            const f = inp.files && inp.files[0];
            if (!f) { res(null); return; }
            const r = new FileReader();
            r.onload = () => shrinkPhoto(String(r.result)).then(res, () => { UI.toast("That picture couldn't be opened. Try a JPEG or PNG?"); res(null); });
            r.onerror = () => res(null);
            r.readAsDataURL(f);
        });
        inp.click();
    });
}
function shrinkPhoto(url, max = 720) {
    return new Promise((ok, bad) => {
        const im = new Image();
        im.onload = () => {
            const k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas');
            c.width = Math.max(1, Math.round(im.naturalWidth * k)); c.height = Math.max(1, Math.round(im.naturalHeight * k));
            const g = c.getContext('2d');
            g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height);
            g.drawImage(im, 0, 0, c.width, c.height);
            ok(c.toDataURL('image/jpeg', 0.82));
        };
        im.onerror = bad;
        im.src = url;
    });
}

/* ---------------------------------------------------------------- fashion */
/* six dress forms along the back, each in one of Sarah's designs (a copy: changing or deleting the design at the
   sewing machine leaves the museum's as it was) */
const MUSEUM_FORMS = [[1, 1], [3, 1], [5, 1], [7, 1], [9, 1], [11, 1]];
function fashionState() { const A = artState(); if (!Array.isArray(A.fashion)) A.fashion = []; return A.fashion; }
function buildFashionWing(a) {
    const items = layoutItems([['fabric_shelf', 2, 'wall'], ['window_wall', 6, 'wall'], ['fabric_shelf', 9, 'wall'],
        ['museum_bench', 2, 4], ['museum_bench', 9, 4], ['mirror_stand', 0, 4], ['plant_monstera', 12, 5]]);
    items.forEach(it => {
        if (it.id === 'museum_bench') it.use = () => UI.say(null, 'Sarah sits and admires the outfits. She made those. She is a designer now. Officially.');
        else if (it.id === 'fabric_shelf') it.use = () => UI.say(null, 'Bolts of fabric, for show. A card says: "Lent by Clementine. Do not unroll. Darling."');
    });
    a.items = items;
    placeFurniture(a, items);
    const F = fashionState();
    MUSEUM_FORMS.forEach(([fx, fy], i) => {
        const [x, y] = toArea(fx, fy), rec = F[i] || null;
        const e = a.add({ kind: 'mannequin', x: (x + 0.5) * TILE, y: (y + 1) * TILE - 2, dressForm: true, design: rec ? rec.d : null, sale: 'form' + i + (rec ? ':' + rec.day + rec.name : '') });
        e.draw = ctx => drawDressForm(ctx, e);
        e.hit = { x: x * TILE, y: y * TILE - 12, w: TILE, h: TILE + 12 };
        e.interact = () => fashionAsk(i);
        a.block(x, y, 1);
    });
}
const FORM_SPR = new WeakMap();
function drawDressForm(ctx, e) {
    const x = Math.round(e.x), by = Math.round(e.y), top = by - 27;
    ctx.fillStyle = '#5a3a28'; ctx.fillRect(x - 4, by - 1, 8, 2); ctx.fillRect(x - 1, by - 6, 2, 5);
    let s = e.design && FORM_SPR.get(e.design);
    if (e.design && !s && typeof sewFrame === 'function') {
        const L = Object.assign({}, look(), { skin: '#efe2cc' }), f = sewFrame(e.design, 'down', 'stand', 'normal', L);
        if (f) { s = f.canvas(); FORM_SPR.set(e.design, s); }
    }
    if (s) ctx.drawImage(s, 0, 12, 16, 10, x - 8, top + 12, 16, 10);
    else { ctx.fillStyle = '#d8c8ae'; ctx.fillRect(x - 4, top + 12, 8, 10); ctx.fillStyle = '#efe2cc'; ctx.fillRect(x - 3, top + 13, 6, 8); }
    ctx.fillStyle = '#efe2cc'; ctx.fillRect(x - 1, top + 10, 2, 2); ctx.fillRect(x - 2, top + 7, 4, 3);
}
async function fashionAsk(i) {
    const F = fashionState(), rec = F[i];
    if (rec) {
        const opts = Online.visitor() ? ['Lovely'] : ['Lovely', 'Change it', 'Take it down'];
        const k = await UI.ask(null, `"${rec.name}", designed by Sarah at the sewing machine. On show since ${dayLabel(rec.day)}.`, opts);
        if (k === 1) return fashionPick(i);
        if (k === 2) { F[i] = null; Save.touch(); refreshRoomHere('museum_fashion'); Sfx.play('pick'); }
        return;
    }
    if (visitorStop('museum')) return;
    if (!Object.keys(designs()).length) { await UI.say(null, 'An empty dress form. A card says: "For outfits designed on this island. Make one at the sewing machine in Clementine\'s!"'); return; }
    return fashionPick(i);
}
function fashionPick(i) {
    return new Promise(res => {
        let done = false;
        const fin = v => { if (!done) { done = true; res(v); } };
        const P = UI.open({ title: 'Dress the form', onClose: () => fin(null) });
        P.body.appendChild(el('p', 'muted', 'One of your designs from the sewing machine. The museum keeps its own copy, so you can still change yours.'));
        const grid = el('div', 'grid');
        for (const [id, d] of Object.entries(designs())) {
            const b = el('button', 'slot');
            b.type = 'button'; b.title = d.name || 'My design'; b.setAttribute('aria-label', b.title);
            b.appendChild(iconCanvas('cloth_' + id, 48));
            b.addEventListener('click', () => {
                const F = fashionState();
                F[i] = { d: JSON.parse(JSON.stringify(d)), name: d.name || 'My design', day: Clock.dayNum() };
                S.stats.donated = (S.stats.donated || 0) + 1;
                Save.touch();
                UI.close(true);
                refreshRoomHere('museum_fashion');
                Sfx.play('fanfare');
                UI.toast(`"${F[i].name}" is on show`, 'cloth_' + id);
                fin(true);
            });
            grid.appendChild(b);
        }
        P.body.appendChild(grid);
    });
}

/* ---------------------------------------------------------------- island history */
/* a glass case for each of the island's old mysteries: what was found, once it's solved */
const MUSEUM_HISTORY = [
    { q: 'treasure', item: 'oldmap', at: [1, 2], text: "Captain Gouda's map, 1887, found in the barn's old trunk. Sarah followed it from the pier past three palms, dug where the sand turned dark, and found the treasure. The X is still very faint." },
    { q: 'ghost', item: 'compass', at: [3, 2], text: "The old lighthouse keeper's compass. After a bowl of clam chowder like Martha's, he said goodbye and left it on the lamp room's sill. The lighthouse has shone every night since." },
    { q: 'goat', item: 'q_goatpic', at: [5, 2], text: 'A tiny painting of the goat, from the great trade that went all the way round the island, can to bell. The goat wears its golden bell now. It is very proud.' },
    { q: 'windmill', item: 'q_cog', at: [7, 2], text: 'One of the windmill\'s three lost cogs (Ginger made a spare, so this one could retire here). With all three back, the moonstone grinds moon flour again.' },
    { q: 'star', item: 'starcrystal', at: [9, 2], text: 'Sarah answered the blinking star with the lighthouse\'s great lamp: short, short, long. It answered back, and this fell on the mountain top. It still glows a little at night.' },
    { q: 'backroom', item: 'q_arcadekey', at: [11, 2], text: 'The old key to the arcade\'s back room, found in the keeper\'s desk. Behind the door: the island\'s first arcade, four classic cabinets, good as new.' },
];
function buildHistoryWing(a) {
    const items = layoutItems([['window_wall', 2, 'wall'], ['plaque_silver', 6, 'wall'], ['window_wall', 10, 'wall'],
        ['museum_bench', 2, 4], ['museum_bench', 9, 4], ['plant_monstera', 0, 5], ['plant_monstera', 12, 5]]);
    items.forEach(it => {
        if (it.id === 'plaque_silver') it.use = () => foundingPlaque();
        else if (it.id === 'museum_bench') it.use = () => UI.say(null, 'Sarah sits for a while with the island\'s old stories. It has had a lot of them. It has her now, too.');
    });
    a.items = items;
    placeFurniture(a, items);
    for (const H of MUSEUM_HISTORY) {
        const [x, y] = toArea(H.at[0], H.at[1]), found = Quests.done(H.q) && ITEMS[H.item];
        const e = a.add({ kind: 'deco', x: (x + 0.5) * TILE, y: (y + 1) * TILE - 1 });
        e.draw = ctx => drawCase(ctx, e, found ? H.item : null);
        e.look3d = { showcase: found ? H.item : null };
        e.hit = { x: x * TILE, y: y * TILE - 14, w: TILE, h: TILE + 14 };
        e.interact = () => (found ? UI.say(null, [`${QUEST_INFO[H.q] ? QUEST_INFO[H.q].title : itemName(H.item)}.`, H.text]) : UI.say(null, 'An empty glass case. Its card says: "Still a mystery." Somewhere on the island, something is waiting to be found.'));
        a.block(x, y, 1);
    }
}
function drawCase(ctx, e, item) {
    const x = Math.round(e.x), by = Math.round(e.y) + 1;
    ctx.fillStyle = '#4a2e22'; ctx.fillRect(x - 6, by - 2, 12, 2); ctx.fillRect(x - 6, by - 13, 12, 2);
    ctx.fillStyle = '#5a3a28'; ctx.fillRect(x - 5, by - 11, 10, 9);
    ctx.fillStyle = '#c8a048'; ctx.fillRect(x - 2, by - 8, 4, 2);
    ctx.fillStyle = '#8a1e2e'; ctx.fillRect(x - 5, by - 14, 10, 1);
    if (item) sprScaled(ctx, ITEMS[item].icon, x, by - 15, 0.6);
    ctx.fillStyle = 'rgba(220,240,250,0.35)'; ctx.fillRect(x - 5, by - 22, 10, 8);
    ctx.fillStyle = '#c8a048'; ctx.fillRect(x - 5, by - 23, 10, 1); ctx.fillRect(x - 5, by - 23, 1, 9); ctx.fillRect(x + 4, by - 23, 1, 9);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x - 3, by - 21, 1, 4);
}
function foundingPlaque() {
    const start = S.startDay != null ? S.startDay : Clock.dayNum(), days = Clock.dayNum() - start + 1, met = NEIGHBORS.filter(id => rel(id).met).length;
    const solved = MUSEUM_HISTORY.filter(H => Quests.done(H.q)).length;
    return UI.say(null, [`A plaque with the Cozy Council's broccoli seal: "${S.islandName || 'This island'}. Its newest chapter began on ${dayLabel(start)}, when ${S.playerName || 'Sarah'} stepped off the boat."`,
        `Underneath, in smaller letters someone keeps up to date: "${days} ${plural(days, 'day')} on the island. ${met} ${plural(met, 'neighbor')} met. ${solved ? `${solved} old ${plural(solved, 'mystery', 'mysteries')} solved.` : 'Its old mysteries still waiting.'}"`]);
}
