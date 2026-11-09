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
        try { localStorage.setItem(this.key(n), JSON.stringify(this.snapshot())); return true; }
        catch (e) { reportError(e); return false; }
    },
    autosave() { if (G.scene === 'play' && !G.noSave) this.write(); },
    read(n) {
        try { const s = localStorage.getItem(this.key(n)); return s ? this.migrate(JSON.parse(s)) : null; }
        catch (e) { return null; }
    },
    migrate(s) {
        if (!s || s.game !== 'hollowell') return null;
        /* v1 is the first; later shapes upgrade here, one step at a time */
        s.inv = Object.assign({ hp: 6, maxHp: 6, buttons: 0, tools: [], keyCount: {}, patterns: [], plans: [], knots: [], patches: 0, patchIds: [], items: {}, bedroll: null }, s.inv || {});
        s.progress = Object.assign({ flags: {}, areaFlags: {}, notes: [], journal: [], goal: '' }, s.progress || {});
        s.stats = Object.assign({ c: {}, rooms: {}, playFrames: 0, visited: {} }, s.stats || {});
        s.v = SAVE_V;
        return s;
    },
    /* put a save into the running game */
    apply(s) {
        Inv.reset(); Object.assign(Inv, s.inv);
        Progress.reset(); Object.assign(Progress, s.progress);
        Stats.reset(); Object.assign(Stats, s.stats);
        G.wanderer = s.name || 'Wren';
        G.seed = s.seed || 1; G.rng = mulberry(G.seed + Stats.playFrames);
        G.player = null;
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
    erase(n) { try { localStorage.removeItem(this.key(n)); } catch { } },
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
