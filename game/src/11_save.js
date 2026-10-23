/* ---- 11_save.js ---- */
/* Save data: one object, kept online with the island (12_cloud.js), plus a save code / save file to take anywhere */
const PHOTO_KEY = 'sc-photos-';              // + island id (or 'new'): this device's copy of the album
let S = null;

function newState() {
    const seed = Math.random().toString(36).slice(2, 10);
    return {
        v: 1, mapV: 3, seed, created: Date.now(), started: false,
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
        flags: { news9: true, v9: 1, news10: true, v10: 1 }, stats: {}, lastDay: -1, day: 0, startDay: 0, poems: [],
        pottery: { seq: 1, pieces: {}, kiln: [], made: 0 },
        arcade: { tickets: 0, best: {}, plays: {}, free: {}, won: 0, claw: null, reach: {}, rival: {} },
        rope: { best: 0, day: -1, trophy: false },
        karaoke: { best: {}, day: -1, trophy: false },
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
        if (!S || !S.started) return;
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
    for (const k of Object.keys(base)) if (st[k] === undefined) st[k] = base[k];
    for (const k of ['player', 'wardrobe', 'house', 'shells', 'dance', 'council', 'arcade', 'rope', 'karaoke']) {
        for (const kk of Object.keys(base[k])) if (st[k][kk] === undefined) st[k][kk] = base[k][kk];
    }
    // the island got bigger (map 3, twice the size): anything tied to old spots on the ground starts fresh
    // (Sarah's things, money, friends, house and everything she's made all stay)
    if (st.mapV !== 3) {
        st.mapV = 3;
        st.player.area = 'island';
        st.player.x = (W0.spots.plaza.x + 0.5) * TILE; st.player.y = (W0.spots.plaza.y + 3.6) * TILE;
        st.forest = undefined; st.drops = []; st.shells = { day: -1, taken: [] }; st.flowers = undefined;
        st.paths = undefined; st.cleared = undefined; st.buildMoved = undefined; st.deco = undefined;
        if (st.lost) st.lost.cur = null;
    }
    // the final update: glasses get their own slot (so Sarah can wear a hat too), and Joe is always her best friend
    if (!st.flags.v9) {
        st.flags.v9 = 1;
        if (FACE_ACCS.has(st.player.acc)) { st.player.eyes = st.player.acc; st.player.acc = null; }
        if (!st.wardrobe.accs.includes('glasses')) st.wardrobe.accs.push('glasses');
    }
    if (st.player.eyes && !FACE_ACCS.has(st.player.eyes)) st.player.eyes = null;
    if (st.npcs && st.npcs.joe && !(st.npcs.joe.pts >= 100)) st.npcs.joe.pts = 100;
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
    key() { return PHOTO_KEY + (Cloud.id || 'new'); },
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
            Cloud.api('PUT', `/api/islands/${encodeURIComponent(Cloud.id)}/photos`, { photos: this.list() }).catch(e => console.warn('photos not saved online', e));
        }, 1200);
    },
};

