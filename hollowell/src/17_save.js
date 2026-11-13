/* Saving: three slots in this browser's storage, plus a code to carry a save elsewhere.
   Saves are plain JSON with a version; migrate() upgrades older ones so old saves always load. */

const SAVE_V = 1;
const Save = {
    slot: 1,
    key(n) { return 'hollowell-slot-' + n; },
    snapshot() {
        const p = G.player, a = G.map;
        return {
            v: SAVE_V, game: 'hollowell', version: VERSION, savedAt: Date.now(),
            name: G.wanderer,
            inv: JSON.parse(JSON.stringify(Inv, (k, v) => typeof v === 'function' ? undefined : v)),
            progress: { flags: Progress.flags, areaFlags: Progress.areaFlags, notes: Progress.notes, journal: Progress.journal, goal: Progress.goal },
            stats: { c: Stats.c, rooms: Stats.rooms, playFrames: Stats.playFrames, visited: Stats.visited },
            pos: a && p ? { area: a.id, x: p.x, y: p.y, dir: p.dir, mark: p.mark } : null,
            seed: G.seed,
        };
    },
    write(n = this.slot) {
        if (G.noSave) return false;
        try { Store.set(this.key(n), JSON.stringify(this.snapshot())); return true; }
        catch (e) { reportError(e); return false; }
    },
    autosave() { if (G.scene === 'play' && !G.noSave) this.write(); },
    read(n) {
        try { const s = Store.get(this.key(n)); return s ? this.migrate(JSON.parse(s)) : null; }
        catch (e) { return null; }
    },
    migrate(s) {
        if (!s || s.game !== 'hollowell') return null;
        /* v1 is the first; later shapes upgrade here, one step at a time */
        s.inv = Object.assign({ hp: 6, maxHp: 6, buttons: 0, tools: [], keyCount: {}, patterns: [], plans: [], knots: [], patches: 0, patchIds: [], items: {}, bedroll: null }, s.inv || {});
        s.progress = Object.assign({ flags: {}, areaFlags: {}, notes: [], journal: [], goal: '' }, s.progress || {});
        s.stats = Object.assign({ c: {}, rooms: {}, playFrames: 0, visited: {} }, s.stats || {});
        /* (Gran's tune went into the Journal when she hummed it: a save from before that heard her hum it too) */
        if (!s.progress.notes.includes('granTune')) s.progress.notes.unshift('granTune');
        /* (the Guild's thread was lightened to read on its floors: a Needle stitch remembers a thing's old colour) */
        for (const st of s.inv.stitches || []) if (st && st.color0 === '#a8784a') st.color0 = THREAD.guild;
        this.dropForeignCuts(s);
        /* (1.0.3 and before: falling down the Nursery playpen's little hole with the toy block in hand took the block down
           too and filled the hole for good, the room's toy and the playpen's way out both lost; nothing too big goes down it
           now, so a game that lost them has them back: the block in its playpen, the hole open) */
        const sl = s.progress.areaFlags.slumber;
        if (sl && sl['fill:8,20']) { delete sl['fill:8,20']; delete sl['gone:nuToy']; }
        s.v = SAVE_V;
        return s;
    },
    /* (a load, or a new Wander, once took in where things had been left in the place the game before was in: what can't be
       this game's own goes. Without the Shears nothing was ever cut; and before the end nobody walks free but someone Wren
       cut loose herself, who's flagged so (Gran and Linnet on their bench are only there after it). A place that held
       nothing else is forgotten again, so it isn't a place she's been) */
    dropForeignCuts(s) {
        const af = s.progress.areaFlags, f = s.progress.flags || {};
        if (!af || typeof af !== 'object') return;
        const shears = Array.isArray(s.inv.tools) && s.inv.tools.includes('shears');
        for (const id of Object.keys(af)) {
            const o = af[id]; if (!o || typeof o !== 'object') continue;
            let n = 0;
            for (const k of Object.keys(o)) if (k.startsWith('cut:') && (!shears || (!f.unwound && this.uncutSpot(id, k.slice(4), f)))) { delete o[k]; n++; }
            if (n && !Object.keys(o).length) delete af[id];
        }
    },
    /* someone's spot in a place (where a person stands, by the key a cut thing is kept by), nobody standing there cut loose */
    uncutSpot(id, key, f) {
        const def = typeof AREAS !== 'undefined' && AREAS[id];
        const at = def ? (def.ents || []).filter(e => e.k === 'npc' && (e.id || '@' + e.x + ',' + e.y) === key) : [];
        return at.length > 0 && !at.some(e => f['cut:' + e.who]);
    },
    /* put a save into the running game */
    apply(s) {
        /* (the place the game before was in goes first, Wren with it: nothing that happens as she leaves a place writes
           that one into this save) */
        G.map = null; G.player = null;
        Inv.reset(); Object.assign(Inv, s.inv);
        Progress.reset(); Object.assign(Progress, s.progress);
        Stats.reset(); Object.assign(Stats, s.stats);
        G.wanderer = s.name || 'Wren';
        G.seed = s.seed || 1; G.rng = mulberry(G.seed + Stats.playFrames);
        const pos = s.pos;
        if (pos && AREAS[pos.area]) {
            World.enter(pos.area, 0, 0, { px: pos.x, py: pos.y, dir: pos.dir, noSave: true });
            /* in a House, start at the room's doorway (the mark) */
            if (pos.mark && pos.mark.area === pos.area && G.map.def.house) {
                G.player.x = pos.mark.tx * T + 8; G.player.y = pos.mark.ty * T + 10; G.player.unstick(); G.player.setMark(); Cam.snap(G.player);
            }
        } else World.enter(START.area, START.x, START.y, { noSave: true });
    },
    list() { return [1, 2, 3].map(n => ({ n, s: this.read(n) })); },
    erase(n) { Store.remove(this.key(n)); },
    /* a save code: the save as text, to copy somewhere safe */
    code(n = this.slot) {
        const s = this.read(n) || this.snapshot();
        const j = JSON.stringify(s);
        return 'HW1:' + (typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(j))) : Buffer.from(j).toString('base64'));
    },
    fromCode(c) {
        c = c.trim();
        if (!c.startsWith('HW1:')) return null;
        try {
            const j = typeof atob === 'function' ? decodeURIComponent(escape(atob(c.slice(4)))) : Buffer.from(c.slice(4), 'base64').toString();
            return this.migrate(JSON.parse(j));
        } catch { return null; }
    },
};
