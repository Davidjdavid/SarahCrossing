/* ---- 11_save.js ---- */
/* Save data: one object, kept online with the island (12_cloud.js), plus a save code / save file to take anywhere */
const PHOTO_KEY = 'sc-photos-';              // + island id (or 'new'): this device's copy of the album
let S = null;

function newState() {
    const seed = Math.random().toString(36).slice(2, 10);
    return {
        v: 1, mapV: 7, seed, created: Date.now(), started: false,
        islandName: '', birthday: null,
        money: 800,
        pocket: new Array(20).fill(null),
        storage: {},
        player: { area: 'island', x: (W0.intro.start[0]) * TILE, y: (W0.intro.start[1]) * TILE, dir: 'up', outfit: 'crimson', acc: null, eyes: 'glasses' },
        wardrobe: { outfits: ['crimson', 'pajamas'], accs: ['glasses'] },
        house: { level: 0, wall: 'wall_cream', floor: 'floor_wood', items: [] },
        trees: {}, shells: { day: -1, taken: [] }, drops: [], plots: new Array(6).fill(null),
        npcs: {}, seen: {}, recipes: ['nigiri', 'fruit_salad', 'fried_rice'],
        mail: [], mailSeq: 1,
        dance: { songs: {}, moves: ['wave', 'happy', 'laugh', 'heart', 'yawn'] },
        council: { best: 0, lastDay: -1, plaques: [] },
        flags: { news9: true, v9: 1, news10: true, v10: 1, shops1: 1 }, stats: {}, lastDay: -1, day: 0, startDay: 0, poems: [],
        pottery: { seq: 1, pieces: {}, kiln: [], made: 0 },
        arcade: { tickets: 0, best: {}, plays: {}, free: {}, won: 0, claw: null, reach: {}, rival: {} },
        rope: { best: 0, day: -1, trophy: false },
        karaoke: { best: {}, day: -1, trophy: false },
        games: {},
        shops: { shop: { spent: 0, level: 1 }, boutique: { spent: 0, level: 1 } },
        fest: {},
    };
}

const Save = {
    dirty: false, last: 0, ok: true,
    exists() { return !!(S && S.started); },
    /* a raw save (from the server, this device or a save file) made ready to play, or null if it can't be */
    load(raw) {
        if (!raw) return null;
        try {
            return migrate(raw);
        } catch (e) {
            // the island stays on the server (and in its backups) untouched until something is saved over it
            console.error('could not load the save', e);
            return null;
        }
    },
    touch() { this.dirty = true; },
    write(force) {
        if (!S || !S.started || LAB) return;
        if (!force && !this.dirty) return;
        if (G.mode === 'title' && !this.dirty) return;      // nothing has moved since the island was loaded
        if (G && G.player) {
            const p = G.player;
            S.player.area = G.area.id; S.player.x = p.x; S.player.y = p.y; S.player.dir = p.dir;
        }
        this.dirty = false; this.last = performance.now();
        Cloud.saved(force);
    },
    /* the next save starts a new island (the one before stays on the server) */
    wipe() { Cloud.id = null; Cloud.rev = 0; Cloud.island = null; lsSet(CLOUD_CURRENT, ''); lsDel(CLOUD_COPY + 'new'); Photos.cache = []; },
    async exportCode(st) {
        if (!st) { this.write(true); st = S; }
        const json = JSON.stringify(st);
        try {
            if (window.CompressionStream) {
                const cs = new Blob([json]).stream().pipeThrough(new CompressionStream('deflate'));
                const buf = new Uint8Array(await new Response(cs).arrayBuffer());
                let bin = '';
                for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
                return 'SC1:' + btoa(bin);
            }
        } catch (e) { /* fall through */ }
        return 'SC0:' + btoa(unescape(encodeURIComponent(json)));
    },
    async importCode(code) {
        code = (code || '').trim().replace(/\s+/g, '');
        let json = null;
        if (code.startsWith('SC1:')) {
            const bin = atob(code.slice(4));
            const buf = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
            const ds = new Blob([buf]).stream().pipeThrough(new DecompressionStream('deflate'));
            json = await new Response(ds).text();
        } else if (code.startsWith('SC0:')) {
            json = decodeURIComponent(escape(atob(code.slice(4))));
        } else if (code.startsWith('{')) {
            json = code;
        }
        if (!json) throw new Error('bad code');
        const st = migrate(JSON.parse(json));
        if (!st || !st.seed) throw new Error('bad code');
        return st;
    },
};

function migrate(st) {
    if (!st || typeof st !== 'object') return null;
    const base = newState();
    if (st.mapV === undefined) st.mapV = 3;       // (saves from before the map had a number were all on map 3's island)
    for (const k of Object.keys(base)) if (st[k] === undefined) st[k] = base[k];
    for (const k of ['player', 'wardrobe', 'house', 'shells', 'dance', 'council', 'arcade', 'rope', 'karaoke']) {
        for (const kk of Object.keys(base[k])) if (st[k][kk] === undefined) st[k][kk] = base[k][kk];
    }
    // the island got bigger (map 3, twice the size): anything tied to old spots on the ground starts fresh
    // (Sarah's things, money, friends, house and everything she's made all stay)
    if (!(st.mapV >= 3)) {
        st.mapV = 3;
        st.player.area = 'island';
        st.player.x = (W0.spots.plaza.x + 0.5) * TILE; st.player.y = (W0.spots.plaza.y + 3.6) * TILE;
        st.forest = undefined; st.drops = []; st.shells = { day: -1, taken: [] }; st.flowers = undefined;
        st.paths = undefined; st.cleared = undefined; st.buildMoved = undefined; st.deco = undefined;
        if (st.lost) st.lost.cur = null;
    }
    // a whole new island, three times the size (map 4): Sarah's progress all comes along (money, her things, her house,
    // friends, unlocks, days played). What was laid out on the old island's ground starts fresh; anything of hers that
    // was out on it (things set down, displays, flowers and trees she planted) waits in her storage, with a letter.
    // a new island (map 4 was the first big one, on the beta site only; map 5 is Harbor Square, map 6 the same with its
    // shops in two rows along an alley): progress stays, what was laid out on the old island's ground comes back to storage
    if (st.mapV === 3 || st.mapV === 4 || st.mapV === 5) {
        const from = st.mapV;
        st.mapV = 6;
        delete st.explored; delete st.places;
        const back = {}, give = (id, n) => { if (id && ITEMS[id]) back[id] = (back[id] || 0) + (n || 1); };
        for (const d of st.drops || []) if (!d.area || d.area === 'island') give(d.id);
        st.drops = (st.drops || []).filter(d => d.area && d.area !== 'island');
        for (const p of (st.deco && st.deco.placed) || []) give(p.id);
        for (const f of (st.flowers && st.flowers.planted) || []) give('seed_fl_' + f.kind);
        for (const t of (st.forest && st.forest.planted) || []) {
            if (t.kind === 'money') st.money += t.amount || 0;
            else give(t.kind === 'fruit' ? t.fruit : t.kind === 'palm' ? 'coconut' : 'sapling');
        }
        for (const [id, n] of Object.entries(back)) st.storage[id] = (st.storage[id] || 0) + n;
        st.forest = undefined; st.shells = { day: -1, taken: [] }; st.flowers = undefined;
        st.paths = undefined; st.cleared = undefined; st.buildMoved = undefined; st.deco = undefined;
        if (st.lost) st.lost.cur = null;
        if (st.player.area === 'island') { st.player.x = (W0.spots.plaza.x + 0.5) * TILE; st.player.y = (W0.spots.plaza.y + 2.6) * TILE; }
        if (st.started) {
            const n = Object.values(back).reduce((a, b) => a + b, 0);
            const stuff = n ? `\n\nAnything you'd left out on the ground (${n} thing${n === 1 ? '' : 's'}) is waiting in your storage.` : '';
            if (from === 5) st.mail.push({ id: st.mailSeq++, from: 'ginger', subject: 'The shops moved!', read: false, claimed: false, gift: null, gifts: null, day: Clock.dayNum(),
                body: 'Sarah! The crew and I moved the shops off the square. They\'re in two rows just east of it now, with a little alley between them: '
                    + 'Clementine\'s, the salon, Sully\'s studio and Waffle\'s open on the alley, and Mac\'s, the arcade, the club and my workshop on Market Lane. '
                    + 'The square has a lot more room to breathe.' + stuff + '\n- Ginger' });
            else st.mail.push({ id: st.mailSeq++, from: 'ginger', subject: from === 4 ? 'We rebuilt it again!' : 'The island grew!', read: false, claimed: false, gift: null, gifts: null, day: Clock.dayNum(),
                body: (from === 4 ? 'Sarah! Don\'t be mad. The crew and I rebuilt the island one more time, and this time it\'s right.\n\n'
                    : 'Sarah! Big news. Really big. The crew and I rebuilt the whole island, and it\'s a lot bigger now.\n\n')
                    + 'There\'s a proper town square with a Town Hall, a Post Office and a Bank (I\'m still finishing the insides), two rows of shops along an alley next to it, '
                    + 'a farm up the hill, a forest with trails that loop, a campsite, and a mountain with a trail all the way up to the lookout. '
                    + 'Your house, your things and all your friends came along on the boat.'
                    + (n ? `\n\nAnything you'd left out on the old island's ground (${n} thing${n === 1 ? '' : 's'}) is waiting in your storage.` : '')
                    + '\n\nGo have a look around. Try the Ridge Trail.\n- Ginger' });
        }
    }
    // a fresh start on the remade island (map 7: its woods regrown in groves and clearings, 27 October). David's call:
    // only Sarah's stats and money come along, and who she is (her name, the island's, her birthday, how long she's been
    // here); everything else starts new. The whole old save is kept inside the new one (before7), in case it's wanted.
    if (st.mapV === 6) {
        st.mapV = 7;
        if (st.started) {
            const old = JSON.parse(JSON.stringify(st));
            old.mapV = 6;
            const keep = {};
            for (const k of ['money', 'stats', 'islandName', 'playerName', 'birthday', 'seed', 'created', 'day', 'startDay', 'lastDay']) if (st[k] !== undefined) keep[k] = st[k];
            for (const k of Object.keys(st)) delete st[k];
            Object.assign(st, newState(), keep, { started: true, before7: old });
            st.flags.introDone = true; st.flags.metJoe = true;
            // (cheat mode, once used, stays marked: it goes with her records)
            if (old.flags && old.flags.cheat) st.flags.cheat = old.flags.cheat;
            st.house.items = STARTER_HOUSE.map(o => Object.assign({ flip: false }, o));
            const met = { met: true, talkDay: -1, giftDay: -1, gifts: 0, favor: null, photo: false, letter: false, last: '' };
            st.npcs = { joe: Object.assign({ pts: 100 }, met), fortune: Object.assign({ pts: 0 }, met) };
            const [bx, by] = W0.boat || W0.intro.start;
            st.player.x = (bx + 0.5) * TILE; st.player.y = (by + 0.6) * TILE; st.player.dir = 'down';
            st.mail.push({ id: st.mailSeq++, from: 'fortune', subject: 'A fresh start!', read: false, claimed: false, gift: null, gifts: null, day: Clock.dayNum(),
                body: `Sarah! Welcome back to ${st.islandName || 'the island'}. Ginger's crew made the whole island new: the woods grew back in groves, `
                    + 'there\'s room to breathe everywhere, and every house and shop got a fresh start.\n\n'
                    + `Your savings came along on the boat (${fmtNum(st.money)} sand dollars), and so did your records: every fish, every hug, every day. `
                    + 'Everything else is brand new, so go say hi to everyone. They can\'t wait to meet you. Again!\n- Fortune' });
        }
    }
    // the final update: glasses get their own slot (so Sarah can wear a hat too), and Joe is always her best friend
    if (!st.flags.v9) {
        st.flags.v9 = 1;
        if (FACE_ACCS.has(st.player.acc)) { st.player.eyes = st.player.acc; st.player.acc = null; }
        if (!st.wardrobe.accs.includes('glasses')) st.wardrobe.accs.push('glasses');
    }
    if (st.player.eyes && !FACE_ACCS.has(st.player.eyes)) st.player.eyes = null;
    // the shops grow with Sarah's shopping: counted from now, with a head start for what she has already bought
    if (!st.shops || typeof st.shops !== 'object') st.shops = base.shops;
    for (const k of ['shop', 'boutique']) if (!st.shops[k] || typeof st.shops[k] !== 'object') st.shops[k] = { spent: 0, level: 1 };
    if (!st.flags.shops1) { st.flags.shops1 = 1; st.shops.shop.spent = Math.max(st.shops.shop.spent || 0, (st.stats.bought || 0) * 300); }
    if (st.npcs && st.npcs.joe && !(st.npcs.joe.pts >= 100)) st.npcs.joe.pts = 100;
    // personal moments a close friend has shared (6z_talk_more.js): a count, missing means none yet
    for (const r of Object.values(st.npcs || {})) if (r && r.shared != null && !(r.shared >= 0)) r.shared = 0;
    if (st.karaoke && !st.karaoke.best) st.karaoke.best = {};
    for (const k of ['specials', 'quests', 'cookLog']) if (st[k] != null && typeof st[k] !== 'object') st[k] = undefined;
    if (st.tasks && !Array.isArray(st.tasks.list)) st.tasks = undefined;
    if (st.art && st.art.hung != null && !Array.isArray(st.art.hung)) st.art.hung = undefined;
    // handmade pottery becomes real items first, so nothing below throws it away
    // (one broken piece must never cost Sarah the whole island)
    for (const f of [registerAllPottery, registerAllArt, registerAllDesigns]) {
        try { f(st); } catch (e) { console.error('loading the save:', f.name, e); }
    }
    // forget anything this version doesn't know about
    st.pocket = st.pocket.map(s => (s && ITEMS[s.id] ? s : null));
    for (const k of Object.keys(st.storage)) if (!ITEMS[k]) delete st.storage[k];
    while (st.pocket.length < 20 + 10 * (st.bag || 0)) st.pocket.push(null);
    while (st.plots.length < 6) st.plots.push(null);
    return st;
}

/* the small photo album lives apart from the save so saves stay light: on the server next to the island,
   with a copy on this device */
const Photos = {
    cache: null, timer: 0,
    key() { return PHOTO_KEY + (Cloud.id || 'new') + (Online.visitor() ? '-' + Online.who() : ''); },
    list() {
        if (!this.cache) { try { this.cache = JSON.parse(lsGet(this.key()) || '[]'); } catch (e) { this.cache = []; } }
        return this.cache.slice();
    },
    keep(l) { this.cache = l; lsSet(this.key(), JSON.stringify(l)); this.send(); },
    add(url) {
        const l = this.list();
        l.unshift({ url, t: Date.now() });
        while (l.length > 12) l.pop();
        this.keep(l);
        return true;
    },
    remove(i) { const l = this.list(); l.splice(i, 1); this.keep(l); },
    /* the server's album, when the island loads */
    got(l) { if (Array.isArray(l)) { this.cache = l; lsSet(this.key(), JSON.stringify(l)); } },
    /* to the server, a moment after the last change */
    send() {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            if (!Cloud.id) return;        // a new island: sent once the island itself is on the server
            Cloud.api('PUT', Cloud.photosUrl(), { photos: this.list() }).catch(e => console.warn('photos not saved online', e));
        }, 1200);
    },
};

