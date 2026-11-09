/* saving: the island in localStorage (one slot), written at moments that matter and every so often.
   Anything that can't be stored (a private window) just isn't, and the game says so once. */
const SAVE_KEY = 'seldom-save-1', SET_KEY = 'seldom-settings';
const Save = {
    pendingAt: 0, warned: false,
    soon() { this.pendingAt = G.t + 1.5; },
    tick() { if (this.pendingAt && G.t >= this.pendingAt) { this.pendingAt = 0; this.write(); } },
    /* everything that matters: flags, the hour, pockets, the notebook, where Dot is, and each map's things */
    snapshot() {
        const maps = {};
        for (const id in MAPS) {
            const m = MAPS[id];
            maps[id] = {
                ents: m.ents.filter(e => e.name && e.kind !== 'dot').map(e => ({ n: e.name, x: Math.round(e.x * 10) / 10, y: Math.round(e.y * 10) / 10, dir: e.dir, gone: e.gone || undefined, rm: e.removed || undefined, st: e.st, hidden: e.hidden || undefined })),
                tiles: m.changed ? Object.fromEntries(Object.entries(m.changed)) : undefined,
                props: m.props.filter(p => p.id).map(p => ({ id: p.id, gone: p.gone || undefined, st: p.st })),
            };
        }
        const d = World.dot;
        return {
            v: 1, at: Date.now(), playT: G.playT || 0, flags: G.flags, hour: World.hour, day: World.day, inv: World.inv, notebook: Notebook.got,
            dot: { map: World.map.id, x: d.x, y: d.y, dir: d.dir }, zmin: Cam.zmin, zmax: Cam.zmax, maps,
        };
    },
    write(force) {
        if (!World.map || World.cutscene && !force || G.state === 'title' || G.noSave) return false;
        try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.snapshot())); return true; }
        catch (e) { if (!this.warned) { this.warned = true; Fx.toast('This browser won\'t keep a save here.'); } return false; }
    },
    read() { try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } },
    clear() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } },
    /* lay a save over a freshly built island */
    apply(s) {
        G.flags = s.flags || {}; World.hour = s.hour; World.day = s.day || 1; World.inv = s.inv || {};
        Notebook.got = s.notebook || {}; G.playT = s.playT || 0;
        Cam.zmin = s.zmin || 1; Cam.zmax = s.zmax || 1;
        for (const id in s.maps) {
            const m = MAPS[id], sm = s.maps[id]; if (!m) continue;
            if (sm.tiles) for (const k in sm.tiles) { const [x, y] = k.split(',').map(Number); m.tiles[y * m.w + x] = sm.tiles[k]; m.changed = m.changed || {}; m.changed[k] = sm.tiles[k]; }
            for (const se of sm.ents) {
                const e = m.find(se.n); if (!e) continue;
                e.x = se.x; e.y = se.y; e.dir = se.dir || e.dir; e.gone = !!se.gone; e.st = Object.assign(e.st, se.st || {}); e.hidden = !!se.hidden;
                if (se.rm) { e.removed = true; m.remove(e); }
            }
            for (const sp of sm.props || []) { const p = m.props.find(q => q.id === sp.id); if (p) { p.gone = !!sp.gone; if (sp.st) p.st = sp.st; } }
            m.rebuildSolid();
        }
        Story.restore();
        const d = World.dot;
        World.map = null;
        World.go(s.dot.map, 0, 0, s.dot.dir, { quiet: true });
        d.x = s.dot.x; d.y = s.dot.y; Cam.snap();
        if (World.afterLoad) { const f = World.afterLoad; World.afterLoad = null; f(); }
    },
    settings() { try { localStorage.setItem(SET_KEY, JSON.stringify(Settings)); } catch (e) { } },
    loadSettings() { try { Object.assign(Settings, JSON.parse(localStorage.getItem(SET_KEY) || '{}')); } catch (e) { } },
};
/* change a tile in a way the save remembers */
function setTile(map, x, y, ch) { map.setT(x, y, ch); map.changed = map.changed || {}; map.changed[x + ',' + y] = ch; }
