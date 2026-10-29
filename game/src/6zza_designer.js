/* ---- 6zza_designer.js ---- */
/* The designer (David, 28 October: "during the beta let me move stairs, outdoor furniture, indoor furniture, etc. and save
   it as the main map for the real game to use"). On the beta site the phone's Designer app moves, turns, adds and takes
   away the island's props and outdoor pieces (Island edit with no limits but water, cliffs, doors and cutting a place off:
   IslandEdit's `design`) and any room's furniture but Sarah's own house (decorating's `design`: one bookcase turned to face
   west on the left wall, in that room only), and says what each neighbor likes doing and where they like to be (`npcs`:
   idleStart's weights, makePlan's places). Saved, it goes to the server (server/design.mjs) as the island every game starts
   from, the live site's too: read as the game starts (Design.load) and laid over world.json and the rooms' layouts before
   anything is built (Design.apply, Design.room). The island's props keep their numbers (saves refer to them by number:
   S.deco, S.cleared): one taken away is marked gone, and the added ones go on the end of W0.props after the world's own
   (`base`: how many the world had when it was saved). */
const WORLD_PROPS = W0.props.length, WORLD0 = W0.props.map(p => Object.assign({}, p));
/* (and the ground as world.json has it, for the stairs: a staircase is two rows of a cliff's face cut into dirt steps,
   collision off, in W0.ramps) */
const WORLD0_GROUND = { grid: W0.grid.slice(), coll: W0.coll.slice(), water: W0.water.slice(), ramps: (W0.ramps || []).map(r => r.slice()) };
/* what a bridge can be laid over: a stream or pond, and the ground at its two ends */
const BRIDGE_WET = new Set(['r', 'o']), BRIDGE_LAND = new Set(['g', 'd', 'p', 'c', 's']);
const LIKE_ACTS = { stars: 'Stargazing', snack: 'An ice cream', phone: 'On their phone', book: 'Reading', ground: 'Sitting on the grass', paint: 'Painting',
    cup: 'A mug of cocoa', fish: 'Fishing', bench: 'Sitting on a bench', scope: 'The telescope' };
const LIKE_LEVELS = [['Never', 'never'], ['Now and then', 'a little'], ['Likes', 'likes'], ['Loves', 'loves']];
/* where each neighbor starts (David, 29 October: "a good starting place instead of creating each of them from nothing"),
   from who they are (PERSONA) and where they already like to be (NPC_DEFS fav): what they do more often or never with
   nothing to do (acts), the free-time places they like (spots, RES_SPOTS) and whole parts of the island (areas). 3 loves,
   2 likes, 1 now and then, 0 never. The designer's own word for any of these takes its place (Design.like). */
const LIKES_START = {
    maki: { acts: { book: 3, bench: 2, scope: 1, ground: 0 }, spots: { pond: 2, oldtree: 2, statue: 2 }, areas: { square: 2, meadow: 2, campsite: 1 } },
    kai: { acts: { fish: 3, ground: 2, snack: 2, book: 1 }, spots: { beach: 3, pier: 3, bonfire: 3, harbor: 2, waterfall: 2 }, areas: { beach: 3, harbor: 2 } },
    basil: { acts: { ground: 3, cup: 2, stars: 2, phone: 0 }, spots: { meadow: 3, plaza: 2, farm: 2, beach: 1 }, areas: { meadow: 3, village: 2 } },
    wonton: { acts: { cup: 3, stars: 2, ground: 2, phone: 0 }, spots: { pond: 1 }, areas: { spring: 3 } },
    chili: { acts: { phone: 3, scope: 2, stars: 2, book: 1 }, spots: { lookout: 3, boardwalk: 2, bonfire: 2 }, areas: { lookout: 3, mountain: 2 } },
    coco: { acts: { phone: 3, bench: 3, snack: 2, fish: 0 }, spots: { plaza: 3, statue: 2, boardwalk: 2 }, areas: { square: 3, market: 3, woods: 1 } },
    cece: { acts: { snack: 3, book: 2, bench: 2, phone: 1 }, spots: { pond: 2, orchard: 2, farm: 2, meadow: 2 }, areas: { village: 2, orchard: 2, square: 1 } },
    clementine: { acts: { paint: 3, phone: 2, bench: 2, fish: 0, ground: 0 }, spots: { plaza: 3, statue: 3, boardwalk: 2, pier: 1 }, areas: { market: 3, square: 3, farm: 0, campsite: 0 } },
    cuke: { acts: { stars: 2, fish: 2, book: 1, phone: 0 }, spots: { orchard: 3, meadow: 3, farm: 3, beach: 2, waterfall: 2 }, areas: { orchard: 3, farm: 3, mountain: 2, river: 2 } },
    sully: { acts: { cup: 3, bench: 3, fish: 2, paint: 1, phone: 0 }, spots: { harbor: 3, pier: 2, plaza: 2, pond: 2 }, areas: { harbor: 3, square: 2 } },
    ginger: { acts: { cup: 3, bench: 2, scope: 1, paint: 1 }, spots: { farm: 2, plaza: 2, statue: 1, meadow: 1 }, areas: { farm: 2, village: 2, woods: 2 } },
    brulee: { acts: { paint: 3, book: 2, stars: 2, phone: 0 }, spots: { waterfall: 3, pond: 3, oldtree: 2, statue: 2, lookout: 2 }, areas: { falls: 3, pond: 3, woods: 2 } },
    mac: { acts: { snack: 3, cup: 2, bench: 2, fish: 1 }, spots: { orchard: 3, farm: 2, plaza: 2, harbor: 2, beach: 1 }, areas: { orchard: 2, farm: 2, harbor: 2 } },
    joe: { acts: { book: 3, stars: 3, ground: 2, paint: 2, phone: 1 }, spots: { pond: 3, meadow: 2, lookout: 2, oldtree: 2, bonfire: 2 }, areas: { pond: 3, meadow: 2, woods: 2 } },
    scampi: { acts: { fish: 3, stars: 2, cup: 2, phone: 0 }, spots: { pier: 3, harbor: 3, bonfire: 3, beach: 2 }, areas: { harbor: 3, beach: 3, mountain: 1 } },
    mug: { acts: { cup: 3, book: 2, bench: 2, snack: 1, phone: 0 }, spots: { plaza: 3, statue: 2, oldtree: 1 }, areas: { market: 3, square: 3 } },
};
/* a design's parts the server takes (server/design.mjs) */
const DESIGN_PARTS = ['v', 'base', 'props', 'added', 'stairs', 'paths', 'bridges', 'areas', 'areasV', 'rooms', 'npcs', 'note'];
/* the areas' colors on the island and the map */
const AREA_COLS = ['#ff9f6b', '#7cc8ff', '#b48cff', '#7fd67f', '#ffd25e', '#ff7fb6', '#5fd6c8', '#d6a35f', '#9fb4ff', '#f08a8a', '#b8e07a', '#e0a6ff'];
const Design = {
    d: null, rev: 0, edit: false, dirty: false, ver: 0, undo: [], at: null,
    blank() { return { v: 1, base: WORLD_PROPS, props: {}, added: [], rooms: {}, npcs: {} }; },
    work() { if (!this.d) this.d = this.blank(); for (const k of ['props', 'rooms', 'npcs']) if (!this.d[k] || typeof this.d[k] !== 'object') this.d[k] = {}; if (!Array.isArray(this.d.added)) this.d.added = []; return this.d; },
    async load() {
        if (LAB) return;
        try {
            const r = await fetch('/api/design', { credentials: 'same-origin', cache: 'no-store' });
            if (!r.ok) return;
            const j = await r.json();
            this.d = j.design && typeof j.design === 'object' && !Array.isArray(j.design) ? j.design : null;
            this.rev = j.rev || 0; this.edit = !!j.edit; this.at = j.at || null;
        } catch (e) { /* (offline: the island as it ships) */ }
    },
    /* the island's props as the design has them, laid over world.json's (from the world's own again first) */
    apply() {
        W0.props.length = WORLD_PROPS; W0_ORIG.props.length = WORLD_PROPS;
        WORLD0.forEach((p0, i) => { for (const p of [W0.props[i], W0_ORIG.props[i]]) { p.x = p0.x; p.y = p0.y; if (p0.rot) p.rot = p0.rot; else delete p.rot; if (p0.gone) p.gone = p0.gone; else delete p.gone; delete p.lift; } });
        const d = this.d;
        if (d) {
            for (const [k, o] of Object.entries(d.props || {})) {
                const i = +k;
                if (!(i >= 0 && i < WORLD_PROPS) || !o) continue;
                for (const p of [W0.props[i], W0_ORIG.props[i]]) {
                    if (o.gone) { p.gone = 1; continue; }
                    if (Number.isInteger(o.x) && Number.isInteger(o.y)) { p.x = o.x; p.y = o.y; }
                    if (o.rot & 3) p.rot = o.rot & 3; else delete p.rot;
                }
            }
            // (one this version can't make stays in the list, taken away, so the ones after it keep their numbers)
            for (const o of Array.isArray(d.added) ? d.added : []) {
                const ok = o && Number.isInteger(o.x) && Number.isInteger(o.y) && (o.kind === 'disp' ? !!dispDef(o.disp) : !!PROP_SIZE[o.kind] || o.kind === 'fence');
                const p = ok ? Object.assign({}, o, { added: 1 }) : { kind: 'rock', x: 0, y: 0, gone: 1, added: 1 };
                if (p.rot) p.rot &= 3;
                W0.props.push(p); W0_ORIG.props.push(Object.assign({}, p));
            }
        }
        this.ground();
        // (the island's paths as drawn: a layer under Sarah's own, 6f_paths.js)
        const P = d && d.paths && typeof d.paths === 'object' && !Array.isArray(d.paths) ? d.paths : null;
        DESIGN_PATHS = P && Object.keys(P).length ? P : null; DESIGN_PATHS_V++;
        fenceTiles.c = null; benches.c = null;
        this.ver++;
    },
    /* the stairs as the design has them: some taken away (the cliff's face again), some cut into a cliff (d.stairs: gone
       and add, each a list of "x,y" tiles); the rows are changed in place, since the island keeps them (a.grid) */
    ground() {
        const G0 = WORLD0_GROUND, R = W0.ramps || (W0.ramps = []);
        for (let y = 0; y < W0.h; y++) { W0.grid[y] = G0.grid[y]; W0.coll[y] = G0.coll[y]; W0.water[y] = G0.water[y]; }
        R.length = 0;
        for (const r of G0.ramps) R.push(r.slice());
        const S = this.d && this.d.stairs, put = (k, x, y, ch) => { const row = W0[k][y]; W0[k][y] = row.slice(0, x) + ch + row.slice(x + 1); };
        if (S) {
            const gone = new Set(Array.isArray(S.gone) ? S.gone : []);
            for (let i = R.length - 1; i >= 0; i--) { const [x, y] = R[i]; if (!gone.has(x + ',' + y)) continue; R.splice(i, 1); put('coll', x, y, '1'); put('grid', x, y, 'g'); }
            for (const k of Array.isArray(S.add) ? S.add : []) {
                const [x, y] = String(k).split(',').map(Number);
                if (!(x > 0 && y > 0 && x < W0.w - 1 && y < W0.h - 1) || W0.coll[y][x] !== '1' || R.some(r => r[0] === x && r[1] === y)) continue;
                put('coll', x, y, '0'); put('grid', x, y, 'd'); R.push([x, y]);
            }
        }
        RAMPS.clear();
        for (const [x, y] of R) RAMPS.add(x + ',' + y);
        // the bridges as the design has them: some taken away (the stream, or the bank at either end, again), some laid
        // across a stream (d.bridges: gone and add, "x,y" tiles; their planks are drawn from the grid's 'w': EnvBuild.decks)
        const B = this.d && this.d.bridges;
        if (B) {
            for (const k of Array.isArray(B.gone) ? B.gone : []) {
                const [x, y] = String(k).split(',').map(Number), u = this.underBridge(x, y);
                if (u) { put('grid', x, y, u.g); put('coll', x, y, u.wet ? '1' : '0'); put('water', x, y, u.w); }
            }
            for (const k of Array.isArray(B.add) ? B.add : []) {
                const [x, y] = String(k).split(',').map(Number);
                if (!(x > 0 && y > 0 && x < W0.w - 1 && y < W0.h - 1) || !(BRIDGE_WET.has(W0.grid[y][x]) || BRIDGE_LAND.has(W0.grid[y][x])) || RAMPS.has(k)) continue;
                put('grid', x, y, 'w'); put('coll', x, y, '0'); put('water', x, y, '.');
            }
        }
        // (the new look keeps what water each tile shows, keyed by the grid it was worked out from: rows change in place)
        if (typeof EnvGround !== 'undefined') EnvGround._water = null;
    },
    /* what's under one of the island's own bridges' planks: the stream where it runs on either side of the bridge, else
       the bank (as the ground beside it) */
    underBridge(x, y) {
        const G0 = WORLD0_GROUND, g = (a, b) => G0.grid[b] && G0.grid[b][a];
        if (g(x, y) !== 'w') return null;
        const run = this.runOf(x, y, (a, b) => g(a, b) === 'w'), wide = this.bridgeWide(run), ys = run.map(t => t[1]), xs = run.map(t => t[0]);
        const side = wide ? [[x, Math.min(...ys) - 1], [x, Math.max(...ys) + 1]] : [[Math.min(...xs) - 1, y], [Math.max(...xs) + 1, y]];
        const wet = side.find(([a, b]) => BRIDGE_WET.has(g(a, b)) || g(a, b) === '~');
        if (wet) return { g: g(wet[0], wet[1]), w: G0.water[wet[1]][wet[0]], wet: true };
        const dry = side.find(([a, b]) => BRIDGE_LAND.has(g(a, b)));
        return { g: dry ? g(dry[0], dry[1]) : 'g', w: '.', wet: false };
    },
    /* the tiles joined to one (up, down, left, right) that pass a test */
    runOf(tx, ty, ok) {
        const run = [], q = [[tx, ty]], seen = new Set([tx + ',' + ty]);
        while (q.length) { const [x, y] = q.pop(); run.push([x, y]); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (!seen.has(k) && ok(nx, ny)) { seen.add(k); q.push([nx, ny]); } } }
        return run;
    },
    /* a bridge runs east to west (across a stream running north to south) when it's at least as long that way */
    bridgeWide(run) { const xs = run.map(t => t[0]), ys = run.map(t => t[1]); return Math.max(...xs) - Math.min(...xs) >= Math.max(...ys) - Math.min(...ys); },
    /* the paths tool (PathTool with design): lay a path of a style on a tile, or take one up ('erase': a path drawn here, or
       the island's own road under it, which becomes grass); one undo a stroke */
    pathPaint(x, y, st) {
        const c = W0.grid[y] && W0.grid[y][x], baked = c === 'p' || c === 'd' || c === 'b', k = x + ',' + y, cur = this.d && this.d.paths && this.d.paths[k];
        let v;
        if (st === 'erase') { if (cur && cur !== 'grass') v = baked ? 'grass' : null; else if (!cur && baked) v = 'grass'; else return false; }
        else { if (pathOkAt(x, y) || cur === st) return false; v = st; }
        if (!this.pathStroke) { this.snap(); this.pathStroke = true; }
        const d = this.work(), P = d.paths || (d.paths = {});
        if (v == null) delete P[k]; else P[k] = v;
        if (!Object.keys(P).length) delete d.paths;
        DESIGN_PATHS = d.paths || null; DESIGN_PATHS_V++;
        this.changed('paths');
        return true;
    },
    /* the tiles a staircase cut here would take (w tiles wide, one to three, the cliff's two rows), or why not */
    stairAt(tx, ty, w) {
        w = w || this.stairW || 3;
        const H = (x, y) => +((W0.height[y] || [])[x]) || 0, a = G.areas.island;
        let top = H(tx, ty - 1) > H(tx, ty) ? ty : H(tx, ty - 2) > H(tx, ty - 1) && H(tx, ty - 1) === H(tx, ty) ? ty - 1 : -1;
        if (top < 0) return { why: "Stairs go up a cliff: tap the cliff's face." };
        const lo = H(tx, top), hi = H(tx, top - 1), tiles = [], x0 = tx - Math.floor((w - 1) / 2);
        for (let x = x0; x < x0 + w; x++) for (let y = top; y <= top + 1; y++) {
            if (W0.coll[y][x] !== '1' || H(x, y) !== lo || H(x, top - 1) !== hi || a.waterAt(x, y) || RAMPS.has(x + ',' + y)) return { why: `There isn't a straight stretch of cliff ${['one tile', 'two tiles', 'three tiles'][w - 1]} wide there.` };
            tiles.push([x, y]);
        }
        if (W0.coll[top - 1][tx] === '1' || W0.coll[top + 2][tx] === '1' || a.blockedAt(tx, top - 1) || a.blockedAt(tx, top + 2)) return { why: 'The stairs need open ground at the top and the bottom.' };
        return { tiles };
    },
    /* a staircase's tiles (all of the run the tapped one is in) */
    stairRun(tx, ty) {
        if (!RAMPS.has(tx + ',' + ty)) return null;
        const run = [], q = [[tx, ty]], seen = new Set([tx + ',' + ty]);
        while (q.length) { const [x, y] = q.pop(); run.push([x, y]); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (x + dx) + ',' + (y + dy); if (RAMPS.has(k) && !seen.has(k)) { seen.add(k); q.push([x + dx, y + dy]); } } }
        return run;
    },
    /* everything still reachable from the square: every door and every place the neighbors go (or what isn't) */
    cutOff() {
        const a = G.areas.island, W = a.w, s0 = W0.spots.plaza, seen = new Uint8Array(W * a.h), q = [s0.y * W + s0.x];
        seen[q[0]] = 1;
        for (let i = 0; i < q.length; i++) {
            const c = q[i], cx = c % W;
            for (const n of [c - 1, c + 1, c - W, c + W]) { if (n < 0 || n >= W * a.h || seen[n] || a.blocked[n] || (n === c - 1 && cx === 0) || (n === c + 1 && cx === W - 1)) continue; seen[n] = 1; q.push(n); }
        }
        for (const [id, b] of Object.entries(W0.buildings)) { const k = (b.y + b.h) * W + b.x + b.door; if (!seen[k]) return `That would cut off ${bldName(id)}.`; }
        for (const sp of Object.values(W0.spots)) { const k = sp.y * W + sp.x; if (!seen[k] && !a.blocked[k]) return 'That would cut off part of the island.'; }
        return null;
    },
    /* the stairs tool (David, 29 October: he wanted to move some and make some smaller): a tap on a cliff's face cuts
       stairs there, as wide as picked (stairW); a tap on a staircase picks it, and then it can be made narrower or wider,
       moved a tile either way along the cliff or to another cliff altogether, or taken away. Nothing that would leave
       somewhere nobody can get to (cutOff): it's put back as it was */
    stairTap(E, tx, ty) {
        if (E.stairMove) {
            const M = E.stairMove, st = this.stairAt(tx, ty, M.w);
            if (st.why) { E.msg = st.why; Sfx.ui('nope'); E.render(); return; }
            E.stairMove = null;
            if (this.stairEdit(E, st.tiles, M.run, 'The stairs moved here.')) E.stairSel = this.stairRun(st.tiles[0][0], st.tiles[0][1]);
            E.render();
            return;
        }
        const run = this.stairRun(tx, ty);
        if (run) { E.stairSel = run; E.msg = ''; Sfx.ui('tick'); E.render(); return; }
        E.stairSel = null;
        // (where the island's own stairs were taken away: a tap there puts them back as they were)
        const back = this.stairsGone().find(g => g.some(t => t[0] === tx && t[1] === ty));
        if (back) { if (this.stairEdit(E, back, [], 'The stairs are back as they were.')) E.stairSel = this.stairRun(back[0][0], back[0][1]); E.render(); return; }
        const st = this.stairAt(tx, ty, this.stairW || 3);
        if (st.why) { E.msg = st.why; Sfx.ui('nope'); E.render(); return; }
        if (this.stairEdit(E, st.tiles, [], 'Stairs cut into the cliff.')) E.stairSel = this.stairRun(st.tiles[0][0], st.tiles[0][1]);
        E.render();
    },
    /* the island's own staircases the design has taken away, each a list of its tiles (David, 29 October: moving stairs
       with the first stairs tool took them away; these can be put back) */
    stairsGone() {
        const S = this.d && this.d.stairs, gone = new Set(S && Array.isArray(S.gone) ? S.gone : []), own = new Set(WORLD0_GROUND.ramps.map(r => r[0] + ',' + r[1])), out = [], seen = new Set();
        for (const k of gone) {
            if (seen.has(k) || !own.has(k)) continue;
            const run = [], q = [k];
            seen.add(k);
            while (q.length) {
                const c = q.pop(), [x, y] = c.split(',').map(Number);
                run.push([x, y]);
                for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = (x + dx) + ',' + (y + dy); if (gone.has(n) && own.has(n) && !seen.has(n)) { seen.add(n); q.push(n); } }
            }
            out.push(run);
        }
        return out;
    },
    /* the design's stairs changed: these tiles cut, those back to the cliff's face; undone if that would cut somewhere off */
    stairEdit(E, add, remove, msg) {
        const d = this.work(), S = d.stairs && typeof d.stairs === 'object' ? d.stairs : (d.stairs = { add: [], gone: [] });
        S.add = Array.isArray(S.add) ? S.add : []; S.gone = Array.isArray(S.gone) ? S.gone : [];
        const before = JSON.stringify(d);
        this.snap();
        for (const [x, y] of remove) { const k = x + ',' + y, i = S.add.indexOf(k); if (i >= 0) S.add.splice(i, 1); else if (!S.gone.includes(k)) S.gone.push(k); }
        for (const [x, y] of add) { const k = x + ',' + y, i = S.gone.indexOf(k); if (i >= 0) S.gone.splice(i, 1); else if (!S.add.includes(k)) S.add.push(k); }
        this.changed('island');
        const why = this.cutOff();
        if (why) { this.d = JSON.parse(before); this.undo.pop(); this.changed('island'); E.msg = why + ' The stairs are as they were.'; Sfx.ui('nope'); return false; }
        E.msg = msg;
        Sfx.play(remove.length && !add.length ? 'pick' : 'place');
        return true;
    },
    /* a staircase across its width: which way it climbs (north up a south face, or east or west up a side), the axis its
       width runs along (0: x, 1: y) and its columns of tiles in order along that axis */
    stairCols(run) {
        const H = (x, y) => +((W0.height[y] || [])[x]) || 0;
        const ys = run.map(t => t[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
        const north = run.some(([x]) => H(x, y0 - 1) !== H(x, y1 + 1));
        const ax = north ? 0 : 1, by = new Map();
        for (const t of run) { if (!by.has(t[ax])) by.set(t[ax], []); by.get(t[ax]).push(t); }
        const keys = [...by.keys()].sort((p, q) => p - q);
        return { ax, keys, cols: keys.map(k => by.get(k).slice().sort((p, q) => p[1 - ax] - q[1 - ax])) };
    },
    /* a column of stairs beside a staircase (at u along its width), shaped like its column at u0: the cliff's face the
       same height row by row, open ground at either end; or null */
    stairCol(C, u0, u) {
        const H = (x, y) => +((W0.height[y] || [])[x]) || 0, a = G.areas.island, xy = (uu, v) => C.ax ? [v, uu] : [uu, v];
        const src = C.cols[C.keys.indexOf(u0)], vs = src.map(t => t[1 - C.ax]), v0 = Math.min(...vs), v1 = Math.max(...vs), out = [];
        for (let v = v0 - 1; v <= v1 + 1; v++) {
            const [x, y] = xy(u, v), [sx, sy] = xy(u0, v);
            if (x < 1 || y < 1 || x >= W0.w - 1 || y >= W0.h - 1 || H(x, y) !== H(sx, sy) || a.waterAt(x, y)) return null;
            const stair = v >= v0 && v <= v1;
            if (stair) { if (W0.coll[y][x] !== '1' || RAMPS.has(x + ',' + y)) return null; out.push([x, y]); }
            else if (W0.coll[y][x] === '1') return null;
        }
        return out;
    },
    /* what's done to the picked staircase: narrower, wider, a tile along, taken away */
    stairDo(E, what) {
        const run = E.stairSel;
        if (!run) return;
        const C = this.stairCols(run), first = C.keys[0], last = C.keys[C.keys.length - 1];
        const reselect = (t) => { E.stairSel = t ? this.stairRun(t[0], t[1]) : null; };
        if (what === 'narrower') {
            if (C.keys.length < 2) { E.msg = "That's as narrow as stairs go. Take them away instead?"; Sfx.ui('nope'); }
            else if (this.stairEdit(E, [], C.cols[C.cols.length - 1], 'A tile narrower.')) reselect(C.cols[0][0]);
        } else if (what === 'wider') {
            if (C.keys.length >= 3) { E.msg = 'Three tiles is as wide as stairs go.'; Sfx.ui('nope'); }
            else {
                const col = this.stairCol(C, last, last + 1) || this.stairCol(C, first, first - 1);
                if (!col) { E.msg = "The cliff doesn't run on straight enough either side to widen them."; Sfx.ui('nope'); }
                else if (this.stairEdit(E, col, [], 'A tile wider.')) reselect(col[0]);
            }
        } else if (what === 'back' || what === 'on') {
            // (a tile along: the column at the far end comes off, a new one goes on at the near end)
            const fwd = what === 'on', col = fwd ? this.stairCol(C, last, last + 1) : this.stairCol(C, first, first - 1);
            if (!col) { E.msg = "The cliff doesn't run on straight that way."; Sfx.ui('nope'); }
            else if (this.stairEdit(E, col, fwd ? C.cols[0] : C.cols[C.cols.length - 1], 'Moved a tile.')) reselect(col[0]);
        } else if (what === 'away') {
            if (this.stairEdit(E, [], run, 'The stairs are gone: the cliff is whole again there.')) E.stairSel = null;
        } else if (what === 'moveto') {
            if (C.ax) { E.msg = 'Stairs up the side of a cliff can only move along it, a tile at a time.'; Sfx.ui('nope'); }
            else { E.stairMove = { run, w: C.keys.length }; E.msg = `${G.touchUsed ? 'Tap' : 'Click'} a cliff's face where they should go.`; }
        }
        E.render();
    },
    /* the bridges tool (David, 29 October: going over the island's layout, he wanted to move bridges): a tap on a bridge
       picks it, and then it moves a tile at a time along its stream, laid across again bank to bank wherever that is, or
       goes; a tap on a stream lays a new one straight across it (bridgeW tiles wide). The pier isn't a bridge. Nothing that
       would cut a place off */
    bridgeRun(tx, ty) {
        const g = (x, y) => W0.grid[y] && W0.grid[y][x];
        if (g(tx, ty) !== 'w') return null;
        const run = this.runOf(tx, ty, (x, y) => g(x, y) === 'w');
        return run.some(([x, y]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => g(x + dx, y + dy) === '~')) ? null : run;
    },
    /* what a tile is under any planks on it: a bridge of the island's own over the stream or its bank, one the design laid
       over what world.json has there */
    underAt(x, y) {
        const c = W0.grid[y] && W0.grid[y][x];
        if (c !== 'w') return c;
        const c0 = WORLD0_GROUND.grid[y][x];
        return c0 === 'w' ? (this.underBridge(x, y) || { g: 'g' }).g : c0;
    },
    /* a bridge across these lines (rows for one running east to west, columns otherwise), from the stream near `ref`
       along each out to dry ground both sides: the tiles, or why not */
    layAcross(lines, wide, ref) {
        let lo = Infinity, hi = -Infinity;
        const at = (l, u) => wide ? [u, l] : [l, u], wet = (l, u) => BRIDGE_WET.has(this.underAt(...at(l, u)));
        for (const l of lines) {
            let m = null;
            for (let d = 0; d <= 4 && m == null; d++) for (const u of [ref - d, ref + d]) if (m == null && wet(l, u)) m = u;
            if (m == null) return { why: 'A bridge goes across a stream or a pond.' };
            let a = m, b = m;
            while (wet(l, a - 1) && m - a < 12) a--;
            while (wet(l, b + 1) && b - m < 12) b++;
            lo = Math.min(lo, a - 1); hi = Math.max(hi, b + 1);
        }
        if (hi - lo + 1 > 12) return { why: "The water's too wide there for a bridge." };
        const tiles = [];
        for (const l of lines) for (let u = lo; u <= hi; u++) tiles.push(at(l, u));
        return { tiles, wide };
    },
    /* whether planks can lie on these tiles (`own`: the bridge's own, when it's moving): all at one level, over water or
       ground, every line across starting and ending on a bank that's clear, with somewhere to walk on beyond it */
    bridgeOk(tiles, wide, own) {
        const a = G.areas.island, H = (x, y) => +((W0.height[y] || [])[x]) || 0, mine = new Set((own || []).map(t => t[0] + ',' + t[1]));
        const lv = H(tiles[0][0], tiles[0][1]), ends = new Map();
        for (const [x, y] of tiles) {
            const k = x + ',' + y, c = this.underAt(x, y);
            if (x < 1 || y < 1 || x >= W0.w - 1 || y >= W0.h - 1) return "That's off the island.";
            if (H(x, y) !== lv || RAMPS.has(k) || !(BRIDGE_WET.has(c) || BRIDGE_LAND.has(c)) || (W0.grid[y][x] === 'w' && !mine.has(k))) return 'A bridge needs the same level both sides, and nothing else in its way.';
            if (BRIDGE_LAND.has(c) && !mine.has(k) && a.blockedAt(x, y)) return "Something's standing on the bank there.";
            const l = wide ? y : x, u = wide ? x : y, e = ends.get(l) || [u, u];
            ends.set(l, [Math.min(e[0], u), Math.max(e[1], u)]);
        }
        for (const [l, [u0, u1]] of ends) for (const u of [u0 - 1, u1 + 1]) {
            const [x, y] = wide ? [u, l] : [l, u];
            if (W0.coll[y][x] === '1' || a.waterAt(x, y) || (a.blockedAt(x, y) && !mine.has(x + ',' + y))) return 'The bridge would end where nobody can walk.';
        }
        return null;
    },
    /* a new bridge where a stream is tapped: straight across it the shorter way */
    bridgeAt(tx, ty, w) {
        w = w || this.bridgeW || 2;
        if (!BRIDGE_WET.has(this.underAt(tx, ty))) return { why: `${G.touchUsed ? 'Tap' : 'Click'} a stream or a pond where the bridge should cross.` };
        const opts = [true, false].map(wide => {
            const c = wide ? ty : tx, lines = [];
            for (let i = 0; i < w; i++) lines.push(c - Math.floor((w - 1) / 2) + i);
            const r = this.layAcross(lines, wide, wide ? tx : ty);
            if (r.why) return r;
            const why = this.bridgeOk(r.tiles, wide);
            return why ? { why } : r;
        }).filter(o => o.tiles).sort((p, q) => p.tiles.length - q.tiles.length);
        return opts[0] || { why: "A bridge can't cross there." };
    },
    bridgeTap(E, tx, ty) {
        const run = this.bridgeRun(tx, ty);
        if (run) { E.bridgeSel = run; E.msg = ''; Sfx.ui('tick'); E.render(); return; }
        E.bridgeSel = null;
        const back = this.bridgesGone().find(g => g.some(t => t[0] === tx && t[1] === ty));
        if (back) { if (this.bridgeEdit(E, back, [], 'The bridge is back as it was.')) E.bridgeSel = this.bridgeRun(back[0][0], back[0][1]); E.render(); return; }
        const b = this.bridgeAt(tx, ty);
        if (b.why) { E.msg = b.why; Sfx.ui('nope'); E.render(); return; }
        if (this.bridgeEdit(E, b.tiles, [], 'A new bridge across the water.')) E.bridgeSel = this.bridgeRun(b.tiles[0][0], b.tiles[0][1]);
        E.render();
    },
    /* the island's own bridges the design has taken away, each a list of its tiles */
    bridgesGone() {
        const B = this.d && this.d.bridges, gone = new Set(B && Array.isArray(B.gone) ? B.gone : []), seen = new Set(), out = [];
        const own = (x, y) => WORLD0_GROUND.grid[y] && WORLD0_GROUND.grid[y][x] === 'w';
        for (const k of gone) {
            if (seen.has(k)) continue;
            const [x, y] = k.split(',').map(Number);
            if (!own(x, y)) continue;
            const run = this.runOf(x, y, (a, b) => own(a, b) && gone.has(a + ',' + b));
            run.forEach(t => seen.add(t[0] + ',' + t[1]));
            out.push(run);
        }
        return out;
    },
    /* the design's bridges changed: these tiles planked, those not; put back as they were if that would cut somewhere off */
    bridgeEdit(E, add, remove, msg) {
        const d = this.work(), B = d.bridges && typeof d.bridges === 'object' ? d.bridges : (d.bridges = { add: [], gone: [] });
        B.add = Array.isArray(B.add) ? B.add : []; B.gone = Array.isArray(B.gone) ? B.gone : [];
        const before = JSON.stringify(d), own = (x, y) => WORLD0_GROUND.grid[y][x] === 'w';
        this.snap();
        for (const [x, y] of remove) { const k = x + ',' + y, i = B.add.indexOf(k); if (i >= 0) B.add.splice(i, 1); else if (own(x, y) && !B.gone.includes(k)) B.gone.push(k); }
        for (const [x, y] of add) { const k = x + ',' + y, i = B.gone.indexOf(k); if (i >= 0) B.gone.splice(i, 1); else if (!own(x, y) && !B.add.includes(k)) B.add.push(k); }
        this.changed('island');
        const why = this.cutOff();
        if (why) { this.d = JSON.parse(before); this.undo.pop(); this.changed('island'); E.msg = why + ' The bridges are as they were.'; Sfx.ui('nope'); return false; }
        E.msg = msg;
        Sfx.play(remove.length && !add.length ? 'pick' : 'place');
        return true;
    },
    /* what's done to the picked bridge: a tile along its stream either way, or taken away */
    bridgeDo(E, what) {
        const run = E.bridgeSel;
        if (!run) return;
        if (what === 'away') { if (this.bridgeEdit(E, [], run, 'The bridge is gone.')) E.bridgeSel = null; E.render(); return; }
        const wide = this.bridgeWide(run), lines = [...new Set(run.map(t => wide ? t[1] : t[0]))], d = what === 'on' ? 1 : -1;
        const wet = run.filter(([x, y]) => BRIDGE_WET.has(this.underAt(x, y))), us = (wet.length ? wet : run).map(t => wide ? t[0] : t[1]);
        const r = this.layAcross(lines.map(l => l + d), wide, Math.round(us.reduce((p, q) => p + q, 0) / us.length));
        const why = r.why || this.bridgeOk(r.tiles, wide, run);
        if (why) { E.msg = why; Sfx.ui('nope'); E.render(); return; }
        const keep = new Set(r.tiles.map(t => t[0] + ',' + t[1]));
        if (this.bridgeEdit(E, r.tiles, run.filter(t => !keep.has(t[0] + ',' + t[1])), 'Moved a tile.')) E.bridgeSel = this.bridgeRun(r.tiles[0][0], r.tiles[0][1]);
        E.render();
    },
    /* a room's furniture as the design has it (its layout's pieces keyed by where they first stood, `id@x,y`: moved, turned,
       taken away; and the ones added), once per list; placeFurniture asks */
    room(a, list) {
        if (list.designed) return list;
        list.designed = true;
        for (const it of list) if (!it.o && !it.added) { it.o = it.id + '@' + it.x + ',' + it.y; it.of = !!it.flip; }
        const R = this.d && this.d.rooms && this.d.rooms[a.id];
        if (!R) return list;
        const keep = [], at = new Map();
        list.forEach((it, i) => {
            if (R.gone && R.gone[it.o]) return;
            const m = R.moved && R.moved[it.o];
            if (m && Number.isInteger(m.x) && Number.isInteger(m.y)) { it.x = m.x; it.y = m.y; it.flip = !!m.flip; if (m.rot & 3) it.rot = m.rot & 3; else delete it.rot; }
            at.set(i, keep.length); keep.push(it);
        });
        for (const it of keep) if (it.on != null) { if (at.has(it.on)) it.on = at.get(it.on); else delete it.on; }
        for (const o of Array.isArray(R.added) ? R.added : []) {
            if (!o || !furnDef(o.id) || !Number.isInteger(o.x) || !Number.isInteger(o.y)) continue;
            const it = { id: o.id, x: o.x, y: o.y, flip: !!o.flip, added: true };
            if (o.rot & 3) it.rot = o.rot & 3;
            const on = o.on != null ? keep.findIndex(k => k.o === o.on) : -1;
            if (on >= 0) it.on = on;
            keep.push(it);
        }
        list.length = 0;
        list.push(...keep);
        return list;
    },
    /* the island's areas (d.areas: { id, name, rects: [[x, y, w, h]...] }): its own parts as the plan has them (world.json's
       areas: the shopping district, the square, the farm...; David, 29 October: "the shopping district area should already
       be on the area maker so I can see and edit where NPCs think are the market area"), with any David drew; once one is
       changed the design keeps the whole list as its own (areasV). Named on the map, and where a neighbor is in one their
       texts say so (placeName, 69_texts.js); the last wins where two overlap */
    av: 0,
    presets() { return Array.isArray(W0.areas) ? W0.areas : []; },
    areas() {
        const C = this._ac, d = this.d, own = d && Array.isArray(d.areas) ? d.areas : [];
        if (C && C.d === d && C.av === this.av && C.own === own && C.n === own.length && C.v === !!(d && d.areasV)) return C.L;
        const L = (d && d.areasV ? own : this.presets().filter(P => !own.some(A => A && A.id === P.id)).map(P => ({ id: P.id, name: P.name, rects: P.rects.map(r => r.slice()) })).concat(own))
            .filter(A => A && A.name && Array.isArray(A.rects));
        this._ac = { d, av: this.av, own, n: own.length, v: !!(d && d.areasV), L, near: new Map() };
        return L;
    },
    /* the design's own list of areas, to change: the island's parts copied in the first time */
    ownAreas() {
        const d = this.work();
        if (!d.areasV) { d.areas = this.areas().map(A => ({ id: A.id, name: A.name, rects: A.rects.map(r => r.slice()) })); d.areasV = 1; this.av++; }
        return d.areas;
    },
    /* one of the island's own parts just as it ships (not shown again on the map, which names those places itself) */
    untouched(A) { const P = this.presets().find(q => q.id === A.id); return !!P && P.name === A.name && JSON.stringify(P.rects) === JSON.stringify(A.rects); },
    areaAt(tx, ty) {
        const L = this.areas();
        for (let i = L.length - 1; i >= 0; i--) if (L[i].rects.some(r => tx >= r[0] && tx < r[0] + r[2] && ty >= r[1] && ty < r[1] + r[3])) return L[i];
        return null;
    },
    /* which of the island's own parts a plan spot was in as the island shipped */
    homeArea(k) {
        const s = W0_ORIG.spots[k] || W0.spots[k], L = this.presets();
        if (!s) return null;
        for (let i = L.length - 1; i >= 0; i--) if (L[i].rects.some(r => s.x >= r[0] && s.x < r[0] + r[2] && s.y >= r[1] && s.y < r[1] + r[3])) return L[i].id;
        return null;
    },
    /* the area a plan spot belongs to: the one it's in, or when it's in none, the one it was in (redrawn away from it:
       the neighbors' visits there go to the area as it's drawn now, spotAt) */
    spotArea(k) {
        const s = W0.spots[k];
        if (!s) return null;
        const A = this.areaAt(s.x, s.y);
        if (A) return A;
        const id = this.homeArea(k);
        return id ? this.areas().find(q => q.id === id) || null : null;
    },
    /* where a neighbor going to a plan spot stands, when its area no longer covers it: the area's open tile nearest it */
    spotAt(k) {
        const s = W0.spots[k];
        if (!s || this.areaAt(s.x, s.y)) return null;
        const A = this.spotArea(k);
        return A ? this.openNear(A, s.x, s.y) : null;
    },
    /* the tiles a neighbor can stand on: open, dry and reachable from the square (worked out again when the island changes) */
    open() {
        const a = G.areas && G.areas.island;
        if (!a) return null;
        if (this._open && this._open.a === a && this._open.ver === this.ver) return this._open.m;
        const W = a.w, H = a.h, m = new Uint8Array(W * H), s0 = W0.spots.plaza, q = [s0.y * W + s0.x];
        m[q[0]] = 1;
        for (let i = 0; i < q.length; i++) {
            const c = q[i], cx = c % W;
            for (const n of [c - 1, c + 1, c - W, c + W]) { if (n < 0 || n >= W * H || m[n] || a.blocked[n] || (n === c - 1 && cx === 0) || (n === c + 1 && cx === W - 1)) continue; m[n] = 1; q.push(n); }
        }
        for (let i = 0; i < m.length; i++) if (m[i] && a.waterAt(i % W, Math.floor(i / W))) m[i] = 2;
        this._open = { a, ver: this.ver, m };
        return m;
    },
    openNear(A, x, y) {
        const m = this.open(), C = this.areas() && this._ac, key = A.id + ':' + x + ',' + y;
        if (!m) return null;
        if (C.near.has(key)) return C.near.get(key);
        const W = G.areas.island.w;
        let best = null, bd = 1e9;
        for (const r of A.rects) for (let ty = Math.max(0, r[1]); ty < Math.min(W0.h, r[1] + r[3]); ty++) for (let tx = Math.max(0, r[0]); tx < Math.min(W0.w, r[0] + r[2]); tx++) {
            if (m[ty * W + tx] !== 1) continue;
            const d = (tx - x) * (tx - x) + (ty - y) * (ty - y);
            if (d < bd) { bd = d; best = [tx, ty]; }
        }
        C.near.set(key, best);
        return best;
    },
    /* the areas with none of the neighbors' plan spots in them (ones David drew somewhere new): places of their own that the
       neighbors go to by day (makePlan's 'area:<id>', designAreaSpots) */
    placeAreas() {
        const C = this.areas() && this._ac;
        if (!C.place) {
            const has = new Set();
            for (const k of Object.keys(W0.spots)) { const A = this.spotArea(k); if (A) has.add(A.id); }
            C.place = C.L.filter(A => !has.has(A.id));
        }
        return C.place;
    },
    /* a tile in such an area for a neighbor to spend a while at: the same one all day (or its middle, for planning) */
    areaVisit(id, who) {
        const A = this.areas().find(q => q.id === id), m = this.open();
        if (!A || !m) return null;
        const big = A.rects.slice().sort((p, q) => q[2] * q[3] - p[2] * p[3])[0];
        if (!big) return null;
        if (!who) return this.openNear(A, big[0] + Math.floor(big[2] / 2), big[1] + Math.floor(big[3] / 2));
        const r = mulberry(hash32(who + ':' + Clock.dayNum() + ':' + id));
        for (let i = 0; i < 12; i++) {
            const R = A.rects[Math.floor(r() * A.rects.length)], tx = R[0] + Math.floor(r() * R[2]), ty = R[1] + Math.floor(r() * R[3]);
            if (tx >= 0 && ty >= 0 && tx < W0.w && ty < W0.h && m[ty * G.areas.island.w + tx] === 1) return [tx, ty];
        }
        return this.openNear(A, big[0] + Math.floor(big[2] / 2), big[1] + Math.floor(big[3] / 2));
    },
    /* the areas tool: pick an area (or make one), then tap two corners to add a piece to it; a tap inside a piece of it
       takes the piece away */
    areaTap(E, tx, ty) {
        const A0 = this.areas().find(x => x.id === E.areaId);
        if (!A0) { E.msg = 'Make an area first (New area), or pick one.'; E.render(); return; }
        const hit = A0.rects.findIndex(r => tx >= r[0] && tx < r[0] + r[2] && ty >= r[1] && ty < r[1] + r[3]);
        if (!E.corner && hit >= 0) { this.snap(); const A = this.ownAreas().find(x => x.id === A0.id); A.rects.splice(hit, 1); this.changed('areas'); E.msg = `A piece of ${A.name} taken away.`; E.render(); return; }
        if (!E.corner) { E.corner = [tx, ty]; E.msg = 'Now tap the opposite corner.'; E.render(); return; }
        const [x0, y0] = E.corner, x = Math.min(x0, tx), y = Math.min(y0, ty);
        E.corner = null;
        this.snap();
        const A = this.ownAreas().find(q => q.id === A0.id);
        A.rects.push([x, y, Math.abs(tx - x0) + 1, Math.abs(ty - y0) + 1]);
        this.changed('areas');
        E.msg = `Added to ${A.name}.`;
        Sfx.play('place');
        E.render();
    },
    areaName(E, A) {
        const panel = $('#panel');
        panel.innerHTML = '';
        const head = el('div', 'phead');
        head.appendChild(el('h2', null, A ? 'Rename the area' : 'A new area'));
        panel.appendChild(head);
        const body = el('div', 'pbody'), f = el('label', 'field');
        f.appendChild(el('span', null, 'What is it called? (as a neighbor would say it: "the campfire", "the east meadow")'));
        const inp = el('input');
        inp.maxLength = 40; inp.value = A ? A.name : ''; inp.autocomplete = 'off'; inp.id = 'areaname';
        f.appendChild(inp);
        body.appendChild(f);
        const row = el('div', 'st-row');
        const done = () => {
            const name = (inp.value || '').trim().slice(0, 40);
            if (name) {
                this.snap();
                const L = this.ownAreas(), mine = A && L.find(q => q.id === A.id);
                if (mine) mine.name = name;
                else { const id = 'a' + (L.reduce((m, x) => Math.max(m, /^a\d+$/.test(x.id) ? +x.id.slice(1) : 0), 0) + 1); L.push({ id, name, rects: [] }); E.areaId = id; }
                this.changed('areas');
            }
            E.render();
        };
        row.appendChild(chip('Done', done, 'go'));
        row.appendChild(chip('Never mind', () => E.render()));
        body.appendChild(row);
        panel.appendChild(body);
        inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') done(); });
        setTimeout(() => { try { inp.focus(); } catch (e) { /* fine */ } }, 60);
    },
    /* the areas drawn over the island in the flat view: each piece in its area's color, its name on the biggest */
    drawAreas(ctx, E) {
        this.areas().forEach((A, i) => {
            // (the island's own parts as they ship only while the Areas tool is on: they cover the whole island)
            if (!E.areaMode && this.untouched(A)) return;
            const col = AREA_COLS[i % AREA_COLS.length], on = A.id === E.areaId;
            ctx.fillStyle = col + (on ? '55' : '30'); ctx.strokeStyle = col; ctx.lineWidth = on ? 2 : 1;
            for (const r of A.rects) { ctx.fillRect(r[0] * TILE, r[1] * TILE, r[2] * TILE, r[3] * TILE); ctx.strokeRect(r[0] * TILE + 0.5, r[1] * TILE + 0.5, r[2] * TILE - 1, r[3] * TILE - 1); }
            const big = A.rects.slice().sort((p, q) => q[2] * q[3] - p[2] * p[3])[0];
            if (big) { ctx.font = '600 8px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(A.name, (big[0] + big[2] / 2) * TILE, (big[1] + big[3] / 2) * TILE); }
        });
        if (E.corner) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(E.corner[0] * TILE + 1, E.corner[1] * TILE + 1, TILE - 2, TILE - 2); }
    },
    /* what each neighbor likes, 0 never .. 3 loves (null: as they are) */
    // (the designer's word, else where they start, LIKES_START; -1 is the designer saying "as they are" over a start)
    like(id, part, k) {
        const N = this.d && this.d.npcs && this.d.npcs[id], own = N && N[part] ? N[part][k] : undefined, st = LIKES_START[id] && LIKES_START[id][part];
        const v = own !== undefined ? own : st ? st[k] : undefined;
        return Number.isInteger(v) && v >= 0 && v <= 3 ? v : null;
    },
    /* every place or area something's said about for a neighbor, by the designer or where they start */
    likeKeys(id, part) {
        const N = this.d && this.d.npcs && this.d.npcs[id], st = LIKES_START[id] && LIKES_START[id][part];
        return [...new Set(Object.keys((N && N[part]) || {}).concat(Object.keys(st || {})))];
    },
    // (and Sarah's own word for a good friend at the Town Hall's Residents: more often, or never, townLike)
    likeWeight(id, k, def) { const v = this.like(id, 'acts', k), w = v == null ? def : [0, 1, 3, 6][v], t = townLike(id, k); return t === 0 ? 0 : t === 2 ? w * 3 : w; },
    likeChance(id, k, def) { const v = this.like(id, 'acts', k), c = v == null ? def : [0, 0.25, 0.6, 0.9][v], t = townLike(id, k); return t === 0 ? 0 : t === 2 ? Math.min(0.95, c * 1.5) : c; },

    /* ------------------------------------------------------------ changing it */
    snap() { this.undo.push(JSON.stringify(this.d)); if (this.undo.length > 60) this.undo.shift(); },
    changed(where) {
        this.dirty = true; this.av++;
        // (the island built again, and its 3D; what the neighbors like and the areas only change their days)
        if (where === 'island' || where == null) { this.apply(); applyBuildingMoves(); rebuildIsland(); Env.dirty = true; }
        else Plans.reset();
    },
    back() {
        if (!this.undo.length) return;
        this.d = JSON.parse(this.undo.pop());
        this.dirty = true; this.av++;
        this.apply(); applyBuildingMoves(); rebuildIsland();
        if (G.area && G.area.interior && G.area.id !== 'home' && ROOMS[G.area.id]) { markRoomStale(G.area.id); G.area = ensureArea(G.area.id); if (Decor.on) Decor.render(); }
        Plans.reset();
        Env.dirty = true;
    },
    async save() {
        const d = this.work();
        d.v = 1; d.base = WORLD_PROPS;
        for (const k of Object.keys(d)) if (!DESIGN_PARTS.includes(k)) delete d[k];
        try {
            const r = await fetch('/api/design', { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-Sarah': '1' }, body: JSON.stringify({ design: d, rev: this.rev }) });
            const j = await r.json().catch(() => ({}));
            if (!r.ok) { UI.toast(r.status === 409 ? 'The design was saved somewhere else since. Open the Designer again to load it first.' : (j.error || "Couldn't save the design.")); return false; }
            this.rev = j.rev; this.at = j.at; this.dirty = false;
            UI.toast('Saved. This is the island every game starts from now.');
            Sfx.play('buy');
            return true;
        } catch (e) { UI.toast("Couldn't reach the server to save the design."); return false; }
    },
    async reload() {
        await this.load();
        this.undo = []; this.dirty = false;
        this.apply(); applyBuildingMoves(); rebuildIsland();
        Plans.reset();
        Env.dirty = true;
    },

    /* ------------------------------------------------------------ the island (IslandEdit with `design`) */
    foot(p) {
        let w, h;
        if (p.kind === 'disp') { const d = dispDef(p.disp); w = d ? d.w : 1; h = d ? displayRows(d) : 1; return p.rot & 1 ? { w: h, h: w } : { w, h }; }
        w = p.w || PROP_SIZE[p.kind] || 1; h = p.kind === 'windmill' ? 2 : p.kind === 'volleyball' ? 5 : PROP_ROWS[p.kind] || 1;
        return (p.rot & 1) && !PROP_FIXED.has(p.kind) ? { w: h, h: w } : { w, h };
    },
    name(p) { return p.kind === 'disp' ? (dispDef(p.disp) || { name: p.disp }).name : PROP_NAMES[p.kind] || p.kind.replace(/_/g, ' '); },
    frame(p) { return p.kind === 'disp' ? (dispDef(p.disp) || {}).frame : p.kind === 'bush' ? 'bush_' + Clock.season() : KNICK_FRAME[p.kind] || p.kind; },
    /* the prop on this tile (any of the island's, the designer's own added ones too) */
    thingAt(tx, ty) {
        for (let i = W0.props.length - 1; i >= 0; i--) {
            const p = W0.props[i];
            if (propGone(i) || isCleared('pr' + i) || (p.project && !projectBuilt(p.project))) continue;
            const F = this.foot(p);
            if (tx >= p.x && tx < p.x + F.w && ty >= p.y && ty < p.y + F.h) return { propIdx: i, design: true };
        }
        return null;
    },
    /* picked up: off the island until it's set down again (p.lift) */
    pickUp(E, e) {
        const i = e.propIdx, p = W0.props[i], F = this.foot(p);
        E.held = { src: 'design', idx: i, kind: p.kind, disp: p.disp, w: F.w, rows: F.h, rot: p.rot || 0, frame: this.frame(p), name: this.name(p), from: [p.x, p.y] };
        p.lift = 1;
        rebuildIsland();
        Sfx.play('pick');
        E.msg = '';
        E.render();
    },
    pickNew(E, kind, disp) {
        const p = { kind, disp }, F = this.foot(p);
        E.held = { src: 'new', kind, disp, w: F.w, rows: F.h, rot: 0, frame: this.frame(p), name: this.name(p) };
        E.msg = '';
        E.render();
    },
    cancel(E) {
        const h = E.held;
        if (h && h.src === 'design') { delete W0.props[h.idx].lift; rebuildIsland(); }
        E.held = null;
    },
    turn(E) {
        const h = E.held;
        if (!h || PROP_FIXED.has(h.kind)) return;
        h.rot = ((h.rot || 0) + 1) & 3;
        [h.w, h.rows] = [h.rows, h.w];
        Sfx.ui('tick');
        E.render();
    },
    /* where it can't go: off the island, in the water (the pier and bridges are fine), on a cliff or the stairs, in a doorway,
       on something else (IslandEdit.whyNot then checks nothing gets cut off) */
    tileWhy(h, x, y, doors, ptx, pty) {
        const a = G.areas.island;
        for (let k = 0; k < h.w; k++) for (let r = 0; r < h.rows; r++) {
            const tx = x + k, ty = y + r;
            if (tx < 1 || ty < 1 || tx >= a.w - 1 || ty >= a.h - 1) return 'Too close to the edge of the island.';
            if (a.waterAt(tx, ty) && W0.grid[ty][tx] !== 'w') return "That's water.";
            if (W0.coll[ty][tx] === '1' || RAMPS.has(tx + ',' + ty)) return "That's a cliff or the stairs.";
            if (doors.has(tx + ',' + ty)) return 'Keep the doorway clear!';
            if (a.blockedAt(tx, ty)) return "Something's already there.";
            if (tx === ptx && ty === pty) return 'Sarah is standing there.';
        }
        return null;
    },
    drop(E, x, y) {
        const h = E.held, d = this.work();
        this.snap();
        const rot = h.rot & 3;
        if (h.src === 'new') d.added.push(Object.assign({ kind: h.kind, x, y }, h.disp ? { disp: h.disp } : {}, rot ? { rot } : {}));
        else if (h.idx < WORLD_PROPS) {
            const p0 = WORLD0[h.idx];
            if (p0.x === x && p0.y === y && !rot) delete d.props[h.idx]; else d.props[h.idx] = Object.assign({ x, y }, rot ? { rot } : {});
        } else {
            const o = d.added[h.idx - WORLD_PROPS];
            if (o) { o.x = x; o.y = y; if (rot) o.rot = rot; else delete o.rot; }
        }
        E.held = null; E.msg = '';
        this.changed('island');
        Sfx.play('place');
        E.render();
        return true;
    },
    remove(E) {
        const h = E.held, d = this.work();
        if (!h || h.src !== 'design') return;
        this.snap();
        if (h.idx < WORLD_PROPS) d.props[h.idx] = { gone: 1 };
        else if (d.added[h.idx - WORLD_PROPS]) d.added[h.idx - WORLD_PROPS].gone = 1;
        E.held = null; E.msg = '';
        this.changed('island');
        Sfx.play('pick');
        E.render();
    },
    /* the panel while designing the island */
    islandPanel(E) {
        const panel = $('#panel'), h = E.held;
        panel.hidden = false; panel.className = 'decor edit'; panel.innerHTML = '';
        UI.modal = true;
        const head = el('div', 'phead');
        head.appendChild(el('h2', null, h ? `Moving: ${h.name}` : 'Designer · the island'));
        head.appendChild(btn('Done', 'green', () => E.close()));
        panel.appendChild(head);
        const body = el('div', 'pbody');
        const facing = ['facing front', 'facing right', 'facing back', 'facing left'][h ? h.rot & 3 : 0];
        const tip = E.look ? 'Drag to look around the island.' : E.bridges ? (E.bridgeSel ? 'This bridge: move it along the water, a tile at a time, or take it away.' : `${G.touchUsed ? 'Tap' : 'Click'} a bridge to move it or take it away, or a stream or pond to lay a new one across it (as wide as picked below). Bridges taken away are dashed: ${G.touchUsed ? 'tap' : 'click'} one to put it back. The new look shows the change once you're done.`) : E.areaMode ? `Areas: the island's parts as the neighbors think of them. Pick one (or make a new one), then ${G.touchUsed ? 'tap' : 'click'} one corner and the opposite corner to add a piece to it; a tap inside a piece takes it away. A neighbor going somewhere an area no longer covers goes to the area as it's drawn now, and a new area with none of their places in it is somewhere they go by day.` : E.stairs ? (E.stairMove ? `${G.touchUsed ? 'Tap' : 'Click'} a cliff's face where the stairs should go.` : E.stairSel ? 'These stairs: make them narrower or wider, move them along the cliff or somewhere else, or take them away.' : `${G.touchUsed ? 'Tap' : 'Click'} stairs to change or move them, or a cliff's face to cut new ones (as wide as picked below). Stairs taken away are dashed: ${G.touchUsed ? 'tap' : 'click'} one to put it back. Turn Stairs off to move things again.`)
            : h ? `${G.touchUsed ? 'Tap' : 'Click'} where it should go (${facing}).${G.touchUsed ? '' : ' R turns it, Esc puts it back.'}`
                : `${G.touchUsed ? 'Tap' : 'Click'} anything on the island to move, turn or take it away, or add something new. Nothing is kept until you save.`;
        body.appendChild(el('p', 'muted', E.msg || tip));
        const row = el('div', 'st-row');
        if (h) {
            if (!PROP_FIXED.has(h.kind)) row.appendChild(chip('Turn', () => this.turn(E)));
            row.appendChild(chip(h.src === 'new' ? 'Never mind' : 'Put it back', () => E.cancel()));
            if (h.src === 'design') row.appendChild(chip('Take it away', () => this.remove(E)));
        } else {
            row.appendChild(chip('Add something', () => this.catalog(E)));
            row.appendChild(chip('Paths', () => { E.close(); PathTool.open({ design: true }); }));
            row.appendChild(chip('Stairs', () => { E.stairs = !E.stairs; E.areaMode = E.bridges = false; E.stairSel = E.stairMove = E.bridgeSel = null; E.msg = ''; E.render(); }, E.stairs ? 'on' : ''));
            row.appendChild(chip('Bridges', () => { E.bridges = !E.bridges; E.areaMode = E.stairs = false; E.stairSel = E.stairMove = E.bridgeSel = null; E.msg = ''; E.render(); }, E.bridges ? 'on' : ''));
            row.appendChild(chip('Areas', () => { E.areaMode = !E.areaMode; E.stairs = E.bridges = false; E.corner = null; E.msg = ''; if (!this.areas().some(A => A.id === E.areaId)) E.areaId = (this.areas()[0] || {}).id; E.render(); }, E.areaMode ? 'on' : ''));
            if (this.undo.length) row.appendChild(chip('Undo', () => { this.back(); E.render(); }));
            row.appendChild(chip(this.dirty ? 'Save the design' : 'Saved', () => this.save().then(() => E.render()), this.dirty ? 'go' : ''));
            row.appendChild(chip("Neighbors' likes", () => { E.close(); this.likesPanel(); }));
        }
        row.appendChild(chip('Look around', () => { E.look = !E.look; E.msg = ''; E.render(); }, E.look ? 'on' : ''));
        body.appendChild(row);
        // (the stairs tool: how wide new stairs are; and what to do with the stairs picked)
        if (E.stairs && !h) {
            const sr = el('div', 'st-row');
            if (E.stairMove) sr.appendChild(chip('Never mind', () => { E.stairMove = null; E.msg = ''; E.render(); }));
            else if (E.stairSel) {
                const C = this.stairCols(E.stairSel), side = C.ax === 1;
                sr.appendChild(chip(side ? 'Move up' : 'Move left', () => this.stairDo(E, 'back')));
                sr.appendChild(chip(side ? 'Move down' : 'Move right', () => this.stairDo(E, 'on')));
                if (!side) sr.appendChild(chip('Move somewhere else', () => this.stairDo(E, 'moveto')));
                sr.appendChild(chip('Narrower', () => this.stairDo(E, 'narrower')));
                sr.appendChild(chip('Wider', () => this.stairDo(E, 'wider')));
                sr.appendChild(chip('Take them away', () => this.stairDo(E, 'away')));
                sr.appendChild(chip('Done with these', () => { E.stairSel = null; E.msg = ''; E.render(); }));
            } else {
                for (const w of [1, 2, 3]) sr.appendChild(chip(`New stairs ${w} wide`, () => { this.stairW = w; E.render(); }, (this.stairW || 3) === w ? 'on' : ''));
                // (the island's own stairs taken away: shown dashed on the island, and all put back here)
                const gone = this.stairsGone();
                if (gone.length) sr.appendChild(chip(gone.length > 1 ? `Put back the ${gone.length} stairs taken away` : 'Put back the stairs taken away', () => { this.stairEdit(E, [].concat(...gone), [], gone.length > 1 ? 'Every staircase is back as it was.' : 'The stairs are back as they were.'); E.render(); }, 'go'));
            }
            body.appendChild(sr);
        }
        // (the bridges tool: what to do with the bridge picked; how wide new ones are)
        if (E.bridges && !h) {
            const br = el('div', 'st-row');
            if (E.bridgeSel) {
                const wide = this.bridgeWide(E.bridgeSel);
                br.appendChild(chip(wide ? 'Move up' : 'Move left', () => this.bridgeDo(E, 'back')));
                br.appendChild(chip(wide ? 'Move down' : 'Move right', () => this.bridgeDo(E, 'on')));
                br.appendChild(chip('Take it away', () => this.bridgeDo(E, 'away')));
                br.appendChild(chip('Done with this one', () => { E.bridgeSel = null; E.msg = ''; E.render(); }));
            } else {
                for (const w of [1, 2, 3]) br.appendChild(chip(`New bridges ${w} wide`, () => { this.bridgeW = w; E.render(); }, (this.bridgeW || 2) === w ? 'on' : ''));
                const gone = this.bridgesGone();
                if (gone.length) br.appendChild(chip(gone.length > 1 ? `Put back the ${gone.length} bridges taken away` : 'Put back the bridge taken away', () => { this.bridgeEdit(E, [].concat(...gone), [], gone.length > 1 ? 'Every bridge is back as it was.' : 'The bridge is back as it was.'); E.render(); }, 'go'));
            }
            body.appendChild(br);
        }
        // (the areas tool: which area the taps add to, a new one, its name)
        if (E.areaMode && !h) {
            const ar = el('div', 'st-row');
            this.areas().forEach((A, i) => { const c = chip(A.name, () => { E.areaId = A.id; E.corner = null; E.render(); }, A.id === E.areaId ? 'on' : ''); c.style.borderBottom = '3px solid ' + AREA_COLS[i % AREA_COLS.length]; ar.appendChild(c); });
            ar.appendChild(chip('New area', () => this.areaName(E, null), 'go'));
            const cur = this.areas().find(A => A.id === E.areaId);
            if (cur) {
                ar.appendChild(chip('Rename', () => this.areaName(E, cur)));
                ar.appendChild(chip('Delete this area', () => { this.snap(); this.d.areas = this.ownAreas().filter(A => A.id !== cur.id); this.av++; E.areaId = null; this.changed('areas'); E.render(); }));
            }
            body.appendChild(ar);
        }
        panel.appendChild(body);
    },
    /* everything that can be added to the island: its own kinds of thing, Waffle's pieces by kind, and furniture */
    catalog(E) {
        const panel = $('#panel');
        panel.innerHTML = '';
        const head = el('div', 'phead');
        head.appendChild(el('h2', null, 'Add something'));
        head.appendChild(btn('Back', '', () => E.render()));
        panel.appendChild(head);
        const tabs = el('div', 'tabs'), body = el('div', 'pbody'), grid = el('div', 'grid');
        const own = Object.keys(PROP_SIZE).filter(k => !['windmill', 'volleyball', 'statue_david', 'statue_sarah', 'swing_set', 'hammock', 'park_clock', 'shrine_stone', 'mailbox', 'tent', 'blanket'].includes(k)).concat(['fence']);
        const outdoor = Object.keys(DISPLAYS), furn = Object.keys(FURN).filter(id => FURN[id].kind === 'floor' && !FURN[id].color && !DISPLAYS[id]);
        const show = (tab) => {
            this._tab = tab;
            tabs.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.k === tab));
            grid.innerHTML = '';
            const list = tab === 'island' ? own.map(k => ({ kind: k })) : (tab === 'outdoor' ? outdoor : furn).map(id => ({ kind: 'disp', disp: id }));
            for (const p of list) {
                const b = el('button', 'slot');
                b.type = 'button';
                const name = this.name(p);
                b.title = name; b.setAttribute('aria-label', name);
                b.appendChild(iconCanvas(this.frame(p), 48));
                b.addEventListener('click', () => { Sfx.ui('tick'); this.pickNew(E, p.kind, p.disp); });
                grid.appendChild(b);
            }
        };
        for (const [k, label] of [['island', 'Island things'], ['outdoor', 'Outdoor pieces'], ['furniture', 'Furniture']]) {
            const t = el('button', 'tab', label);
            t.type = 'button'; t.dataset.k = k;
            t.addEventListener('click', () => show(k));
            tabs.appendChild(t);
        }
        panel.appendChild(tabs);
        body.appendChild(grid);
        panel.appendChild(body);
        show(this._tab || 'island');
    },

    /* ------------------------------------------------------------ a room (decorating with `design`) */
    canRoom(a) { return !!(a && a.interior && a.floor && a.id !== 'home' && ROOMS[a.id]); },
    /* the pieces of a room's design from its furniture as it stands now */
    roomChanged(a) {
        const d = this.work(), list = a.items || [], old = d.rooms[a.id] || {};
        const R = { moved: {}, gone: {}, added: [] }, present = new Set();
        for (const it of list) {
            if (!it.o) continue;
            present.add(it.o);
            const m = /@(-?\d+),(-?\d+)$/.exec(it.o), ox = m ? +m[1] : it.x, oy = m ? +m[2] : it.y;
            if (it.x !== ox || it.y !== oy || (it.rot & 3) || !!it.flip !== !!it.of) R.moved[it.o] = Object.assign({ x: it.x, y: it.y }, it.rot & 3 ? { rot: it.rot & 3 } : {}, it.flip ? { flip: true } : {});
        }
        for (const k of Object.keys(old.gone || {})) R.gone[k] = 1;
        for (const k of this._roomKeys || []) if (!present.has(k)) R.gone[k] = 1;
        for (const k of present) delete R.gone[k];
        for (const it of list) if (!it.o) R.added.push(Object.assign({ id: it.id, x: it.x, y: it.y }, it.rot & 3 ? { rot: it.rot & 3 } : {}, it.flip ? { flip: true } : {}, it.on != null && list[it.on] && list[it.on].o ? { on: list[it.on].o } : {}));
        if (!Object.keys(R.moved).length) delete R.moved;
        if (!Object.keys(R.gone).length) delete R.gone;
        if (!R.added.length) delete R.added;
        if (Object.keys(R).length) d.rooms[a.id] = R; else delete d.rooms[a.id];
        this.dirty = true;
    },
    roomStart(a) {
        this.room(a, a.items || (a.items = []));
        this._roomKeys = (a.items || []).filter(it => it.o).map(it => it.o);
    },
    /* every piece of furniture there is, for a room */
    roomCatalog() {
        const out = {};
        // (not Sarah's own paintings: they're hers)
        for (const id of Object.keys(FURN)) if (!FURN[id].color && !FURN[id].art && ['floor', 'rug', 'top', 'wall'].includes(FURN[id].kind)) out[id] = 1;
        return out;
    },

    /* ------------------------------------------------------------ neighbors' likes */
    likesPanel(who) {
        const ids = Object.keys(IDLE_LIKES).filter(id => NPC_DEFS[id]);
        who = who || this._who || ids[0];
        this._who = who;
        const P = UI.open({ title: "Neighbors' likes", wide: true, foot: true, back: () => this.app() });
        const pick = el('div', 'st-row');
        for (const id of ids) pick.appendChild(chip(NPC_DEFS[id].name, () => this.likesPanel(id), id === who ? 'on' : ''));
        P.body.appendChild(pick);
        P.body.appendChild(el('p', 'muted', `Tap one to change it: as they are → loves → likes → now and then → never. "As they are" leaves ${NPC_DEFS[who].name} to the game. Each neighbor starts with a few likes from who they are; change any of them.`));
        const likeChip = (part, k, label, def) => {
            const v = this.like(who, part, k), st = LIKES_START[who] && LIKES_START[who][part] && LIKES_START[who][part][k] != null;
            return chip(`${label}: ${v == null ? (def || 'as they are') : LIKE_LEVELS[v][1]}`, () => {
                const d = this.work(), N = d.npcs[who] || (d.npcs[who] = {}), L = N[part] || (N[part] = {});
                this.snap();
                // (round from loves to never, then "as they are": over a starting like that's said as -1)
                const next = v == null ? 3 : v === 0 ? (st ? -1 : null) : v - 1;
                if (next == null) delete L[k]; else L[k] = next;
                if (!Object.keys(L).length) delete N[part];
                if (!Object.keys(N).length) delete d.npcs[who];
                this.changed('likes');
                this.likesPanel(who);
            }, v == null ? '' : v >= 2 ? 'go' : v === 0 ? 'off' : 'on');
        };
        P.body.appendChild(el('h3', null, 'What they like doing with nothing to do'));
        const acts = el('div', 'st-row');
        for (const k of Object.keys(LIKE_ACTS)) acts.appendChild(likeChip('acts', k, LIKE_ACTS[k], IDLE_LIKES[who] === k ? 'their favorite' : ''));
        P.body.appendChild(acts);
        // where they go, one list (David, 28 October: a favorite place and a favorite area were two lists for one thing): each
        // area of the island, the whole of it first (every place of theirs inside it), then the places in it, any of which
        // set on its own counts over its area (designSpots)
        P.body.appendChild(el('h3', null, 'Where they like to be in their free time'));
        P.body.appendChild(el('p', 'muted', 'A whole area counts every place in it; a place set on its own counts over its area.'));
        const fav = NPC_DEFS[who].fav || {}, by = {};
        for (const k of Object.keys(RES_SPOTS).filter(k => W0.spots[k])) { const A = this.spotArea(k), id = A ? A.id : ''; (by[id] || (by[id] = [])).push(k); }
        for (const A of this.areas().concat([{ id: '', name: 'Elsewhere' }])) {
            const ks = by[A.id] || [];
            if (!A.id && !ks.length) continue;
            P.body.appendChild(el('div', 'st-label', A.name));
            const g = el('div', 'st-row');
            if (A.id) g.appendChild(likeChip('areas', A.id, 'The whole area', ''));
            for (const k of ks) g.appendChild(likeChip('spots', k, landmarkName(k, RES_SPOTS[k]), fav[k] ? 'a favorite' : ''));
            P.body.appendChild(g);
        }
        P.foot.appendChild(el('span', 'grow', this.dirty ? 'Not saved yet.' : 'Saved.'));
        P.foot.appendChild(btn('Save the design', this.dirty ? 'green' : '', () => this.save().then(() => this.likesPanel(who))));
    },

    /* ------------------------------------------------------------ the phone app */
    app() {
        UI.close(true);
        const P = UI.open({ title: 'Designer', back: backToPhone });
        P.body.appendChild(el('p', null, "What you change here is the island every game starts from: this site's, and Sarah's once it goes live. Move, turn, add or take away anything on the island or in a room, and say what the neighbors like. Nothing is kept until you save."));
        P.body.appendChild(el('p', 'muted', this.rev ? `Saved ${this.rev} time${this.rev === 1 ? '' : 's'}${this.at ? ', last on ' + new Date(this.at).toLocaleString() : ''}.` : 'Nothing saved yet: the island as it ships.'));
        if (this.dirty) P.body.appendChild(el('p', null, 'There are changes that aren\'t saved yet.'));
        const row = el('div', 'st-row'), a = G.area;
        if (a && a.id === 'island') row.appendChild(chip('Design the island', () => { UI.close(true); IslandEdit.open({ design: true }); }, 'go'));
        else if (this.canRoom(a)) row.appendChild(chip('Design this room', () => { UI.close(true); Decor.enter({ design: true }); }, 'go'));
        row.appendChild(chip("Neighbors' likes", () => this.likesPanel()));
        if (this.dirty) row.appendChild(chip('Save the design', () => this.save().then(() => this.app()), 'go'));
        if (this.undo.length) row.appendChild(chip('Undo', () => { this.back(); this.app(); }));
        if (this.dirty) row.appendChild(chip('Throw away what isn\'t saved', () => this.reload().then(() => this.app())));
        P.body.appendChild(row);
        if (!(a && a.id === 'island') && !this.canRoom(a)) P.body.appendChild(el('p', 'muted', a && a.id === 'home' ? "Sarah's own house is hers to decorate." : 'Go outside, or into a room, to design it.'));
    },
};
/* (makePlan's places, weighted by what the designer said a neighbor likes: 22_npc.js) */
function designSpots(id, wts) {
    const mul = (k, v) => { if (v === 0) delete wts[k]; else wts[k] = (wts[k] || 0.5) * [0, 0.5, 2, 4][v] + [0, 0, 1, 3][v]; };
    for (const k of Design.likeKeys(id, 'spots')) { const v = Design.like(id, 'spots', k); if (W0.spots[k] && v != null) mul(k, v); }
    // (an area they like or never go to: every place of theirs inside it)
    if (Design.likeKeys(id, 'areas').length) for (const k of Object.keys(wts)) {
        const A = W0.spots[k] && Design.spotArea(k), v = A ? Design.like(id, 'areas', A.id) : null;
        if (v != null && Design.like(id, 'spots', k) == null) mul(k, v);
    }
}
/* the areas with no plan spot of their own, as places to go by day ('area:<id>'), weighted by what the designer said */
function designAreaSpots(id, wts, band) {
    if (band === 'night' || NPC_DEFS[id].goat) return;
    for (const A of Design.placeAreas()) {
        const v = Design.like(id, 'areas', A.id);
        const w = v != null ? 0.5 * [0, 0.5, 2, 4][v] + [0, 0, 1, 3][v] : 0.5;
        if (w > 0) wts['area:' + A.id] = w;
    }
}
/* "at the campfire": the area a spot is in, as a neighbor would say it; a spot still in the part of the island it always
   was in keeps its own words ("outside the boutique" says more than "at the shopping district") */
function designPlace(spot) {
    const A = /^area:/.test(spot) ? Design.areas().find(q => q.id === spot.slice(5)) : Design.spotArea(spot);
    if (!A || (PLACE_NAMES[spot] && A.id === Design.homeArea(spot))) return null;
    return /^(the|a|an|my|your)\s/i.test(A.name) || /^[A-Z]/.test(A.name) ? 'at ' + A.name.replace(/^The /, 'the ') : 'at the ' + A.name;
}
