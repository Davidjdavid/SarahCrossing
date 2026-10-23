/* ---- 11_save.js ---- */
/* Save data: one object, kept in this browser (localStorage) with a save code for moving devices */
const SAVE_KEY = 'sarah-crossing-save-v2';
const PHOTO_KEY = 'sarah-crossing-photos-v1';
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
    exists() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } },
    load() {
        let raw = null;
        try {
            raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return null;
            return migrate(JSON.parse(raw));
        } catch (e) {
            // keep a copy of what was there, so a bad load can't be saved over and lost
            console.error('could not load the save', e);
            try { if (raw) localStorage.setItem(SAVE_KEY + '-backup', raw); } catch (e2) { /* storage full or blocked */ }
            return null;
        }
    },
    touch() { this.dirty = true; },
    write(force) {
        if (!S || !S.started) return;
        if (!force && !this.dirty) return;
        try {
            if (G && G.player) {
                const p = G.player;
                S.player.area = G.area.id; S.player.x = p.x; S.player.y = p.y; S.player.dir = p.dir;
            }
            localStorage.setItem(SAVE_KEY, JSON.stringify(S));
            this.dirty = false; this.ok = true; this.last = performance.now();
        } catch (e) { this.ok = false; }
    },
    wipe() { try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(PHOTO_KEY); } catch (e) { /* storage blocked */ } },
    async exportCode() {
        this.write(true);
        const json = JSON.stringify(S);
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

/* the small photo album lives in its own key so saves stay light */
const Photos = {
    list() { try { return JSON.parse(localStorage.getItem(PHOTO_KEY) || '[]'); } catch (e) { return []; } },
    add(url) {
        const l = this.list();
        l.unshift({ url, t: Date.now() });
        while (l.length > 12) l.pop();
        try { localStorage.setItem(PHOTO_KEY, JSON.stringify(l)); return true; } catch (e) { return false; }
    },
    remove(i) { const l = this.list(); l.splice(i, 1); try { localStorage.setItem(PHOTO_KEY, JSON.stringify(l)); } catch (e) { /* ignore */ } },
};

