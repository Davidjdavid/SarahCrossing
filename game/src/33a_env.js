/* ---- 33a_env.js ---- */
/* The new 3D look (being built in the test area first: ?lab, scripts/island/plan-lab.mjs). Where the HD-2D view
   (31_render3d.js) stands flat pictures up as cards and lays the painted island on a height grid, this builds the
   world itself: ground with stone walls that stand straight up, a beach that runs down under the water, stream and pond
   beds you can see into (33d_env_water.js), trees with real crowns of leaves (33c_env_trees.js), houses and shops with
   roofs, windows and doors you can see round (33e_env_build.js), a lawn of little leaves as the GameCube game drew it
   (EnvTex.lawn), all lit by the same sun, sky and lamps. People are dolls (33k_env_dolls.js). The HD-2D view stays the
   fallback while the models load, and without WebGL the classic view. */
const ENV = {
    LV: 1.5,            // a level's height (world units; a tile is one unit across)
    BASE: 0.25,         // the low ground's height above the sea
    RES: 4,             // height points a tile
    CHUNK: 16,          // tiles a ground piece
    cam: { dist: 12.2, pitch: 34, fov: 44, ahead: 2.0, lead: [1.5, 3.6, 1.0], out: [13, 3] },    // lead: tiles the camera looks ahead of Sarah running sideways, down, up; out: at the lookout, degrees lower and tiles further
    dof: [25, 62, 7.6, 5.2],   // where the background starts to blur (and fully), where the foreground does (the concept keeps the trees behind the houses sharp)
    people: 1.3,        // how much bigger people stand than in the classic HD-2D view
    items: 0.6,         // and things lying on the ground
    fog: { near: 0.72, far: 1.12 },    // the haze, against how far is drawn: clear further out than the HD-2D view's (the edge itself fades: r3Edge)
};
/* Sarah's island in the new look too: on the beta site for now (localStorage sc-env-island = 1 or 0 to choose anywhere) */
const ENV_ISLAND = (() => { const v = lsGet('sc-env-island'); return v === '1' ? true : v === '0' ? false : /^beta\./.test((window.location && location.hostname) || ''); })();
const Env = {
    on: false, built: null, failed: false,
    want() { return (LAB || ENV_ISLAND) && !this.failed; },
    /* (on Sarah's island only once the Blender models have arrived: the island stays in the HD-2D view till then) */
    active(a) { return this.want() && !!a && a.id === 'island' && !a.interior && (LAB || (typeof EnvModels !== 'undefined' && EnvModels.ready)); },
    /* the HD-2D view asks every frame: draw the island the new way? (builds it the first time) */
    update(r3, a) {
        // (built before the Blender models had arrived, or for another season: build it again)
        if (this.built && this.built.noModels && typeof EnvModels !== 'undefined' && EnvModels.ready) this.teardown(r3);
        if (this.built && this.built.season !== (a.bgSeason || Clock.season())) this.teardown(r3);
        // (back outside after something built from the save changed indoors: a house redone or grown, the mailbox painted)
        if (this.built && G.frame - (this.seen || 0) > 1 && this.built.look !== this.look()) this.teardown(r3);
        // (a town project built overnight while Sarah was out: 6zgb_projects.js)
        if (this.built && this.dirty) { this.dirty = false; this.teardown(r3); }
        this.seen = G.frame;
        if (!this.built) {
            try { this.build(r3, a); }
            catch (e) { console.error('the new 3D look could not be built (using the HD-2D view)', e); this.failed = true; this.teardown(r3); return false; }
        }
        this.on = true;
        this.built.group.visible = true;
        if (typeof EnvDolls !== 'undefined') EnvDolls.attach(this.built.group);
        const ts = performance.now();
        try { this.stream(r3, a); }
        catch (e) { console.error('the new 3D look stopped (using the HD-2D view)', e); this.failed = true; this.teardown(r3); return false; }
        for (const f of this.built.tick) f(r3, a);
        this.seeThrough(r3);
        if (typeof EnvGhost !== 'undefined') EnvGhost.update(r3);
        if (DEBUG) { const T = window.__envT || (window.__envT = { n: 0, ms: 0, max: 0 }); const d = performance.now() - ts; T.n++; T.ms += d; T.max = Math.max(T.max, d); }
        return true;
    },
    /* what the island's 3D is built from that changes while Sarah's indoors (Ginger's work, the Post Office's paint, the
       day's holiday decorations) */
    look() {
        const isl = G.areas && G.areas.island, holi = isl ? isl.ents.filter(e => e.holiday).map(e => e.grand || e.model3d || e.frame).join() : '';
        // (and what's set down on the island, each with whether its model has come yet: the furniture loads after the island)
        const disp = S && S.deco && S.deco.placed ? S.deco.placed.map(p => p.id + (FURN[p.id] && typeof EnvModels !== 'undefined' && EnvModels.has('furn_' + (FURN[p.id].base || p.id)) ? '+' : '')).join() : '';
        // (and the island's own things Sarah moved or put away in Island edit, and the designer's changes: 6zza_designer.js)
        const moved = S && S.deco ? JSON.stringify([S.deco.moved, S.deco.gone]) : '', dv = typeof Design !== 'undefined' ? Design.ver : 0;
        return S ? JSON.stringify([S.exteriors || null, S.house && S.house.level, S.post && S.post.box || null, S.post && S.post.style || null, holi, projectsKey(), disp, moved, dv]) : '';
    },
    /* where Sarah is on screen, for the see-through round her (trees and buildings in front of her) */
    seeThrough(r3) {
        const p = G.player, U = R3U.uSee.value;
        if (!p || p.hidden || G.mode !== 'play') { U.w = 0; return; }
        const v = this._sv || (this._sv = new THREE.Vector3()), cam = r3.camera;
        v.set(p.x / TILE, this.groundH(p.x, p.y) + 0.85, p.y / TILE * R3_ZS);
        cam.updateMatrixWorld();
        const vz = v.clone().applyMatrix4(cam.matrixWorldInverse).z;
        v.project(cam);
        U.set(v.x, v.y, -vz, 0.24);
        R3U.uSeeA.value = cam.aspect;
    },
    /* while the models are still on their way to Sarah's island (or a room), a moment of getting the island ready over
       the view instead of the old look showing first; at most 25 s (then the old look, and the new one when they come) */
    cover(a) {
        const M = typeof EnvModels !== 'undefined' ? EnvModels : null;
        const want = !LAB && ENV_ISLAND && this.want() && !!M && !M.ready && !M.failed && !!a && (a.id === 'island' || !!a.interior) && G.mode === 'play';
        if (want && !this._coverT) this._coverT = performance.now();
        const show = want && performance.now() - this._coverT < 25000;
        let el = this._cover;
        if (!show && !el) return;
        if (!el) {
            el = this._cover = document.createElement('div');
            el.id = 'envload';
            el.innerHTML = '<div class="card"><div>Getting the island ready</div><div class="bar"><i></i></div></div>';
            const app = document.getElementById('app'), ui = document.getElementById('ui');
            if (app && ui) app.insertBefore(el, ui); else document.body.appendChild(el);
        }
        if (show) {
            el.hidden = false; el.classList.remove('gone');
            el.querySelector('i').style.width = Math.round(100 * M.done / Math.max(1, M.total)) + '%';
        } else if (!el.hidden && !el.classList.contains('gone')) {
            el.classList.add('gone');
            setTimeout(() => { if (el.classList.contains('gone')) el.hidden = true; }, 600);
        }
    },
    hide() {
        R3U.uSee.value.w = 0;
        if (typeof EnvGhost !== 'undefined') EnvGhost.hide();
        if (this.on && R3.sea && G.area && !G.area.interior) R3.sea.visible = true;      // (the HD-2D view's own sea back)
        this.on = false;
        if (this.built) this.built.group.visible = false;
    },
    teardown(r3) {
        const b = this.built;
        this.built = null; this.on = false;
        if (!b) return;
        if (typeof EnvGhost !== 'undefined') EnvGhost.clear(r3);
        r3.scene.remove(b.group);
        // (the models' geometry and materials are kept for the next build)
        b.group.traverse(o => { if (o.userData.shared) { if (o.userData.ownMat) o.material.dispose(); return; } if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach(m => m.dispose()); });
        for (const t of b.textures) t.dispose();
    },
    build(r3, a) {
        const t0 = performance.now();
        const group = new THREE.Group();
        r3.scene.add(group);
        const models = typeof EnvModels !== 'undefined';
        if (models) EnvModels.load();
        EnvCull.reset();
        this.built = { group, tick: [], parts: {}, chunks: new Map(), textures: [], area: a, season: a.bgSeason || Clock.season(), noModels: models && !EnvModels.ready && !EnvModels.failed, look: this.look() };
        const tg = performance.now();
        this.ground = EnvGround.build(group);
        if (DEBUG) console.log(`  ground: ${Math.round(performance.now() - tg)} ms`);
        this.built.parts.ground = this.ground;
        if (this.ground.tick) this.built.tick.push(this.ground.tick);     // (the season's colors)
        for (const [name, B] of [['water', typeof EnvWater !== 'undefined' && EnvWater], ['trees', typeof EnvTrees !== 'undefined' && EnvTrees],
            ['build', typeof EnvBuild !== 'undefined' && EnvBuild], ['walls', typeof EnvWalls !== 'undefined' && EnvWalls],
            ['contact', typeof EnvContact !== 'undefined' && EnvContact], ['glow', typeof EnvGlow !== 'undefined' && EnvGlow], ['decals', typeof EnvDecals !== 'undefined' && EnvDecals],
            ['dolls', typeof EnvDolls !== 'undefined' && EnvDolls], ['critters', typeof EnvCritters !== 'undefined' && EnvCritters],
            ['sea', typeof EnvSea !== 'undefined' && EnvSea], ['items', typeof EnvItems !== 'undefined' && EnvItems], ['sights', typeof EnvSights !== 'undefined' && EnvSights], ['style', typeof EnvStyle !== 'undefined' && EnvStyle],
            ['fishing', typeof EnvFishing !== 'undefined' && EnvFishing], ['pour', typeof EnvPour !== 'undefined' && EnvPour], ['flags', typeof EnvFlags !== 'undefined' && EnvFlags], ['spray', typeof EnvSpray !== 'undefined' && EnvSpray], ['night', typeof EnvNight !== 'undefined' && EnvNight], ['lawn', typeof EnvLawn !== 'undefined' && EnvLawn]]) {
            if (!B) continue;
            const t1 = performance.now();
            const p = B.build(group, a);
            if (DEBUG) console.log(`  ${name}: ${Math.round(performance.now() - t1)} ms`);
            this.built.parts[name] = p;
            if (p && p.tick) this.built.tick.push(p.tick);
        }
        // everything placed many times is shown only near the view (the island has hundreds of trees and props)
        // (but not what's moved every frame round Sarah: userData.live, the moths and fireflies)
        group.traverse(o => { if (o.isInstancedMesh && !o.userData.live) EnvCull.track(o); });
        // (and whatever can fade in front of Sarah gets its ghost: 33n_env_ghost.js)
        if (typeof EnvGhost !== 'undefined') EnvGhost.collect(r3, group);
        console.log(`the new 3D look built in ${Math.round(performance.now() - t0)} ms`);
    },
    /* The ground comes in pieces (ENV.CHUNK tiles square), each made the first time it comes near the view:
       those on screen at once (only when arriving or after a jump), the ones just beyond a few milliseconds a frame,
       so walking never waits on them. A piece is shown only while it's near the view, and so is each tree, prop and
       wall piece (EnvCull). A piece is made again when what it shows changes (Sarah's paths). */
    stream(r3, a) {
        const B = this.built, CH = ENV.CHUNK, v = r3.view;
        if (!v) return;
        const vx0 = v.x0 / TILE, vx1 = v.x1 / TILE, vy0 = v.y0 / TILE, vy1 = v.y1 / TILE;
        const cw = Math.ceil(W0.w / CH), chh = Math.ceil(W0.h / CH);
        const near = (m) => {
            const out = [];
            for (let cy = Math.max(0, Math.floor((vy0 - m) / CH)); cy <= Math.min(chh - 1, Math.floor((vy1 + m) / CH)); cy++)
                for (let cx = Math.max(0, Math.floor((vx0 - m) / CH)); cx <= Math.min(cw - 1, Math.floor((vx1 + m) / CH)); cx++) out.push([cx, cy]);
            return out;
        };
        const get = (cx, cy) => { const k = cx + ',' + cy; let c = B.chunks.get(k); if (!c) B.chunks.set(k, c = EnvChunk.make(B, cx, cy)); return c; };
        // what the ground shows changed (Sarah laid or lifted a path): its pieces are made again, nearest first
        const sig = pathsVer();
        if (B.pathsV == null) B.pathsV = sig;
        if (sig !== B.pathsV) { B.pathsV = sig; for (const c of B.chunks.values()) if (c.state === 2) c.stale = true; }
        const seen = near(1), want = near(10);
        // on screen: made now
        for (const [cx, cy] of seen) { const c = get(cx, cy); if (c.state !== 2 || c.stale) EnvChunk.finish(c, a); }
        // just beyond: a few milliseconds a frame
        const t0 = performance.now(), budget = r3.phone ? 4 : 3;
        for (const [cx, cy] of want) {
            const c = get(cx, cy);
            if (c.state === 2 && !c.stale) continue;
            EnvChunk.work(c, a, t0 + budget);
            if (performance.now() > t0 + budget) break;
        }
        const on = new Set(seen.map(([cx, cy]) => cx + ',' + cy));
        for (const [k, c] of B.chunks) c.group.visible = c.state === 2 && on.has(k);
        EnvCull.update(vx0 - 4, vy0 - 4, vx1 + 4, vy1 + 5);
    },
    /* what the new look draws itself (the HD-2D view leaves these out) */
    takes(e) {
        if (!this.on) return false;
        const k = e.kind;
        if (k === 'tree' || k === 'palm' || k === 'fruittree' || k === 'bigtree' || k === 'oldtree' || k === 'building' || k === 'waterfall' || e.wildFlower) return true;
        if (k === 'bush' || (typeof EnvBuild !== 'undefined' && (EnvBuild.props[k] || EnvBuild.propModel(e)))) return true;
        if (e.holiday && (e.grand || /pumpkin/.test(e.frame || '') || (typeof EnvBuild !== 'undefined' && EnvBuild.holidayModel(e)))) return true;
        if (typeof EnvSea !== 'undefined' && EnvSea.takes(e)) return true;
        if (typeof EnvItems !== 'undefined' && EnvItems.takes(e)) return true;
        if (k === 'display' && typeof EnvBuild !== 'undefined' && EnvBuild.dispDrawn && EnvBuild.dispDrawn.has(e)) return true;
        if (k === 'flagpole' && typeof EnvFlags !== 'undefined') return true;
        return false;
    },
    /* the water's surface at a spot (world pixels), or null where there's none: the sea at 0, a stream or pond at its level */
    waterH(x, y) {
        if (!this.ground || (G.area && G.area.interior)) return null;
        const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE), w = EnvGround.waterAt(tx, ty);
        if (w === 1) return 0;
        if (w === 2) return EnvGround.surfAt(tx, ty);
        return null;
    },
    /* where something standing on the tile grid stands in the new look: the middle of its tile (or its footprint), as
       Animal Crossing stands its trees and furniture, not on the tile's south edge where the 2D art drew its feet.
       { x, z } in world units and the ground's height there (y) */
    tileSpot(e) {
        let tx, ty, w = 1, h = 1;
        if (e.tx != null && e.ty != null) { tx = e.tx; ty = e.ty; }
        else if (e.px != null && e.py != null) { tx = e.px; ty = e.py; w = (typeof PROP_SIZE !== 'undefined' && PROP_SIZE[e.kind]) || 1; h = (typeof PROP_ROWS !== 'undefined' && PROP_ROWS[e.kind]) || 1; }
        else { tx = Math.floor(e.x / TILE); ty = Math.floor((e.y - 3) / TILE); }
        if (e.kind === 'bigtree' || e.kind === 'oldtree') { w = 2; h = 2; tx = Math.round(e.x / TILE) - 1; ty = Math.round(e.y / TILE) - 2; }
        const x = tx + w / 2, v = ty + h / 2;
        return { x, z: v * R3_ZS, y: this.groundH(x * TILE, v * TILE) };
    },
    /* the ground's height under a spot (world pixels), for people and cards standing on it */
    groundH(x, y) {
        if (!this.ground || (G.area && G.area.interior)) return 0;
        const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
        if (W0.grid[ty] && W0.grid[ty][tx] === 'w') return EnvGround.deckH(tx, ty);
        const st = EnvGround.stairs && EnvGround.stairs.get(tx + ',' + ty);
        if (st) return EnvGround.stairH(st, y / TILE);
        return EnvGround.heightAt(x / TILE, y / TILE);
    },
};

/* ---------------------------------------------------------------- pieces */
/* A piece of the island: its ground (kinds and damp banks as small pictures of its own, a mesh of heights) and its
   grass, made in steps (a generator that yields between them), in its own group. */
const EnvChunk = {
    MARGIN: 2,          // tiles round a piece that its pictures also cover (so the softened edges match across pieces)
    make(B, cx, cy) {
        const CH = ENV.CHUNK, x0 = cx * CH, y0 = cy * CH, w = Math.min(CH, W0.w - x0), h = Math.min(CH, W0.h - y0);
        const group = new THREE.Group();
        group.visible = false;
        B.group.add(group);
        return { cx, cy, x0, y0, w, h, group, state: 0, job: null, stale: false, meshes: [], built: B };
    },
    /* go on making a piece until the time runs out */
    work(c, a, until) {
        if (c.state === 2 && c.stale) this.clear(c);
        if (!c.job) { c.job = this.steps(c, a); c.state = 1; }
        while (performance.now() < until) {
            if (c.job.next().done) { c.job = null; c.state = 2; c.stale = false; return true; }
        }
        return false;
    },
    finish(c, a) { this.work(c, a, Infinity); },
    clear(c) {
        for (const m of c.meshes) { c.group.remove(m); m.geometry.dispose(); m.material.dispose(); }
        for (const t of c.textures || []) t.dispose();
        c.meshes = []; c.textures = []; c.state = 0; c.job = null;
    },
    *steps(c, a) {
        c.textures = [];
        yield* EnvGround.chunkSteps(c);
    },
};

/* Instanced things (trees, fruit, props, wall pieces, the dark under things) placed all over the island: each keeps the
   whole list of where its copies stand, and only the copies near the view are handed to the GPU. A copy moved (a shaken
   tree, picked fruit, a turning windmill) is moved in the list. */
const EnvCull = {
    list: [], key: '',
    reset() { this.list = []; this.key = ''; },
    track(m) {
        const n = m.count, all = new Float32Array(m.instanceMatrix.array.subarray(0, n * 16)), px = new Float32Array(n), pz = new Float32Array(n);
        for (let i = 0; i < n; i++) { px[i] = all[i * 16 + 12]; pz[i] = all[i * 16 + 14] / R3_ZS; }
        const cols = m.instanceColor ? new Float32Array(m.instanceColor.array.subarray(0, n * 3)) : null;
        const T = { m, all, px, pz, n, cols, dirty: true };
        m.setMatrixAt = (i, M) => { M.toArray(all, i * 16); px[i] = all[i * 16 + 12]; pz[i] = all[i * 16 + 14] / R3_ZS; T.dirty = true; };
        this.list.push(T);
    },
    update(x0, y0, x1, y1) {
        const key = [x0, y0, x1, y1].map(v => Math.floor(v / 2)).join(',');
        const moved = key !== this.key;
        this.key = key;
        for (const T of this.list) {
            if (!moved && !T.dirty) continue;
            T.dirty = false;
            const dst = T.m.instanceMatrix.array, dc = T.cols && T.m.instanceColor.array;
            let k = 0;
            for (let i = 0; i < T.n; i++) {
                const x = T.px[i], z = T.pz[i];
                // (a hidden copy is scaled to nothing: keep it out)
                if (x < x0 || x > x1 || z < y0 || z > y1 || (T.all[i * 16] === 0 && T.all[i * 16 + 5] === 0 && T.all[i * 16 + 10] === 0)) continue;
                dst.set(T.all.subarray(i * 16, i * 16 + 16), k * 16);
                if (dc) dc.set(T.cols.subarray(i * 3, i * 3 + 3), k * 3);
                k++;
            }
            T.m.count = k;
            T.m.visible = k > 0;
            T.m.instanceMatrix.needsUpdate = true;
            if (dc) T.m.instanceColor.needsUpdate = true;
        }
    },
};

/* ---------------------------------------------------------------- the ground */
/* Heights: each tile's level, with the walls put where they look right: a south-facing cliff's two rows of face (the
   game blocks both) become a wall between the first and second row, an east or west face a wall down the middle of its
   column; the sea floor slopes down from the beach; stream and pond beds are dug in. Between two cells far apart in height
   the ground goes straight up (a wall); between near ones it slopes (a beach, a bank). */
const EnvGround = {
    /* what water each tile shows (a bridge or the pier stands over the water under it): 0 none, 1 the sea, 2 a stream,
       pond or spring */
    water() {
        if (this._water && this._water.src === W0.grid) return this._water.k;
        const Wt = W0.w, Ht = W0.h, k = new Uint8Array(Wt * Ht), g = (x, y) => W0.grid[y] && W0.grid[y][x];
        // (a waterfall's tiles are the stream's: over the lip on the upper one, the pool at the foot on the lower)
        const kind = (c) => c === '~' || c === undefined ? 1 : c === 'o' || c === 'r' || c === 'h' || c === 'W' ? 2 : 0;
        for (let y = 0; y < Ht; y++) for (let x = 0; x < Wt; x++) k[y * Wt + x] = kind(g(x, y));
        // planks stand over the water only where it runs on under them: a bridge's middle over the river, not its ends on
        // the banks; the pier's planks over the sea, not those on the beach. So the river keeps its own banks under a bridge.
        const seen = new Uint8Array(Wt * Ht);
        for (let y = 0; y < Ht; y++) for (let x = 0; x < Wt; x++) {
            if (g(x, y) !== 'w' || seen[y * Wt + x]) continue;
            const run = [[x, y]], q = [[x, y]];
            seen[y * Wt + x] = 1;
            while (q.length) {
                const [cx, cy] = q.pop();
                for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                    const nx = cx + dx, ny = cy + dy;
                    if (g(nx, ny) === 'w' && !seen[ny * Wt + nx]) { seen[ny * Wt + nx] = 1; run.push([nx, ny]); q.push([nx, ny]); }
                }
            }
            const xs = run.map(t => t[0]), ys = run.map(t => t[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
            // (across the run: north and south of a bridge going east to west, east and west of one going north to south)
            const wide = x1 - x0 >= y1 - y0, tall = y1 - y0 >= x1 - x0;
            for (const [rx, ry] of run) {
                const c = (wide ? [kind(g(rx, y0 - 1)), kind(g(rx, y1 + 1))] : []).concat(tall ? [kind(g(x0 - 1, ry)), kind(g(x1 + 1, ry))] : []);
                k[ry * Wt + rx] = c.includes(1) ? 1 : c.includes(2) ? 2 : 0;
            }
        }
        this._water = { src: W0.grid, k };
        return k;
    },
    waterAt(x, y) { return x < 0 || y < 0 || x >= W0.w || y >= W0.h ? 1 : this.water()[y * W0.w + x]; },
    /* the level a stream's or pond's tile has its water at: its own, but a waterfall's upper row (the top of the cliff,
       where the water goes over) the stream's above */
    waterLevel(x, y) {
        const h = +((W0.height[y] || [])[x]) || 0;
        if (W0.grid[y] && W0.grid[y][x] === 'W') { const up = +((W0.height[y - 1] || [])[x]) || 0; if (up > h) return up; }
        return h;
    },
    stairs: null,           // (each staircase tile's steps, from EnvBuild.stairs)
    /* the top of the step under a spot (v in tiles, north to south) on a staircase: up one step at a time, eased over the
       front of each so feet don't snap */
    stairH(S, v) {
        const f = Math.max(0, Math.min(0.999, (v - S.top) / 2)) * S.n, i = Math.floor(f), k = f - i, rise = (S.hi - S.lo) / S.n;
        return S.hi - (i + Math.max(0, (k - 0.75) / 0.25)) * rise;
    },
    /* the top of the planks of a bridge or the pier */
    deckH(tx, ty) { return ENV.BASE + (+W0.height[ty][tx] || 0) * ENV.LV + 0.06; },
    /* half-tile cells: the level each shows (in height units) */
    cells() {
        const Wt = W0.w, Ht = W0.h, CW = Wt * 2, CH = Ht * 2, v = new Float32Array(CW * CH);
        const L = (x, y) => (x < 0 || y < 0 || x >= Wt || y >= Ht) ? -1 : this.waterAt(x, y) === 1 ? -1 : +W0.height[y][x] || 0;
        const land = (x, y) => L(x, y) >= 0;
        const ramp = new Set((W0.ramps || []).map(([x, y]) => x + ',' + y));
        // how far each sea tile is from land (the sea floor goes down with it)
        const dSea = new Float32Array(Wt * Ht).fill(99), q = [];
        for (let y = 0; y < Ht; y++) for (let x = 0; x < Wt; x++) if (land(x, y)) { dSea[y * Wt + x] = 0; q.push(y * Wt + x); }
        for (let h = 0; h < q.length; h++) { const k = q[h], x = k % Wt, y = (k / Wt) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= Wt || ny >= Ht) continue; const n = ny * Wt + nx, d = dSea[k] + (dx && dy ? 1.41 : 1); if (d < dSea[n]) { dSea[n] = d; q.push(n); } } }
        // how far each water tile is from its bank (the bed is deeper in the middle)
        const wet = (x, y) => x >= 0 && y >= 0 && x < Wt && y < Ht && this.waterAt(x, y) === 2;
        const dBank = new Float32Array(Wt * Ht);
        for (let y = 0; y < Ht; y++) for (let x = 0; x < Wt; x++) if (wet(x, y)) {
            let d = 9;
            for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (!wet(x + dx, y + dy) && !(W0.grid[y + dy] && W0.grid[y + dy][x + dx] === 'W')) d = Math.min(d, Math.hypot(dx, dy));
            dBank[y * Wt + x] = d;
        }
        const H = (lv) => ENV.BASE + lv * ENV.LV;
        for (let y = 0; y < Ht; y++) for (let x = 0; x < Wt; x++) {
            const l = L(x, y);
            let a = l < 0 ? -(0.2 + Math.min(1.8, (dSea[y * Wt + x] - 0.5) * 0.55)) : H(l), b = a, c = a, d = a;      // a b / c d: the four halves
            if (l >= 0) {
                const up1 = L(x, y - 1), up2 = L(x, y - 2);
                if (up1 > l) { a = b = c = d = H(up1); }                                  // the first row under a cliff: the top of the wall
                else if (up2 > l && up1 === l) { /* the second row: the foot of the wall */ }
                const lf = L(x - 1, y), rt = L(x + 1, y);
                if (lf > l && !(up1 > l)) { a = c = H(lf); }                              // an east-facing wall down the middle
                if (rt > l && !(up1 > l)) { b = d = H(rt); }
                if (wet(x, y)) { const bed = Math.min(0.9, 0.32 + dBank[y * Wt + x] * 0.32); a -= bed; b -= bed; c -= bed; d -= bed; }
            }
            v[(y * 2) * CW + x * 2] = a; v[(y * 2) * CW + x * 2 + 1] = b; v[(y * 2 + 1) * CW + x * 2] = c; v[(y * 2 + 1) * CW + x * 2 + 1] = d;
        }
        // stairs: a straight slope from the top of the wall to its foot (the steps themselves are drawn over it)
        for (const [x, y] of W0.ramps || []) {
            const top = L(x, y - 1) > L(x, y) ? y : y - 1, hi = H(Math.max(L(x, top - 1), L(x, y))), lo = H(L(x, top + 1));
            for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
                const fy = (y - top) + (j + 0.5) / 2;            // 0..2 across the two rows
                v[(y * 2 + j) * CW + x * 2 + i] = hi + (lo - hi) * Math.min(1, Math.max(0, fy / 2));
            }
        }
        return { v, CW, CH, ramp, H };
    },
    /* the height at a point (tiles): between half-cell centres, straight up across a wall, a slope across a bank */
    sample(C, u, v) {
        const fx = u * 2 - 0.5, fy = v * 2 - 0.5, i0 = Math.floor(fx), j0 = Math.floor(fy), tx = fx - i0, ty = fy - j0;
        const at = (i, j) => C.v[Math.max(0, Math.min(C.CH - 1, j)) * C.CW + Math.max(0, Math.min(C.CW - 1, i))];
        const a = at(i0, j0), b = at(i0 + 1, j0), c = at(i0, j0 + 1), d = at(i0 + 1, j0 + 1);
        const range = Math.max(a, b, c, d) - Math.min(a, b, c, d);
        let sx = tx, sy = ty;
        if (range > 0.9) { sx = Math.max(0, Math.min(1, (tx - 0.38) / 0.24)); sy = Math.max(0, Math.min(1, (ty - 0.38) / 0.24)); }
        else { sx = tx * tx * (3 - 2 * tx); sy = ty * ty * (3 - 2 * ty); }
        return (a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy;
    },
    /* ponds and streams with natural shores: where the water tiles' outline, blurred and pushed about by a noise, crosses
       a half is the waterline (round corners, wobbly edges instead of the tiles' square steps); the bed deepens from it
       and the bank rises gently back to the ground. Only ground at the water's own level is touched (not the walls by a
       waterfall), and only within a few tenths of a tile of the tiles' edges, so where people can walk stays the same. */
    shapeWater(h, W, Hn) {
        const R = ENV.RES, Wt = W0.w, Ht = W0.h, LV = ENV.LV, BASE = ENV.BASE;
        const wet = (x, y) => x >= 0 && y >= 0 && x < Wt && y < Ht && this.waterAt(x, y) === 2;
        const lvl = (x, y) => this.waterLevel(Math.max(0, Math.min(Wt - 1, x)), Math.max(0, Math.min(Ht - 1, y)));
        const tileOf = (i, n) => Math.max(0, Math.min(n - 1, Math.floor(i / R - 0.001)));
        const levels = new Set();
        for (let y = 0; y < Ht; y++) for (let x = 0; x < Wt; x++) if (wet(x, y)) levels.add(lvl(x, y));
        if (!levels.size) return;
        // value noise (two octaves, about a tile and a half and half a tile across)
        const hs = (a, b) => { let n = Math.imul(a, 374761393) + Math.imul(b, 668265263) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
        const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
            return (hs(xi, yi) * (1 - u) + hs(xi + 1, yi) * u) * (1 - v) + (hs(xi, yi + 1) * (1 - u) + hs(xi + 1, yi + 1) * u) * v; };
        // (only round the water: X0..X1, Y0..Y1 in height points)
        const blur = (m, r, X0, Y0, X1, Y1) => {
            const t = new Float32Array(W * Hn);
            for (let pass = 0; pass < 2; pass++) for (const horiz of [true, false]) {
                for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
                    let s = 0, c = 0;
                    for (let k = -r; k <= r; k++) { const xx = horiz ? x + k : x, yy = horiz ? y : y + k; if (xx < 0 || yy < 0 || xx >= W || yy >= Hn) continue; s += m[yy * W + xx]; c++; }
                    t[y * W + x] = s / c;
                }
                for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) m[y * W + x] = t[y * W + x];
            }
        };
        for (const L of levels) {
            const surf = BASE + L * LV - 0.14, m = new Float32Array(W * Hn);
            let tx0 = 1e9, ty0 = 1e9, tx1 = -1, ty1 = -1;
            for (let y = 0; y < Ht; y++) for (let x = 0; x < Wt; x++) if (wet(x, y) && lvl(x, y) === L) { tx0 = Math.min(tx0, x); tx1 = Math.max(tx1, x); ty0 = Math.min(ty0, y); ty1 = Math.max(ty1, y); }
            const X0 = Math.max(0, (tx0 - 2) * R), Y0 = Math.max(0, (ty0 - 2) * R), X1 = Math.min(W - 1, (tx1 + 3) * R), Y1 = Math.min(Hn - 1, (ty1 + 3) * R);
            // (a waterfall's two rows count for both levels' outlines, so the stream runs right to the lip and the pool right
            // to the foot of the cliff, instead of each stopping short in a rounded end)
            const fall = (tx, ty) => W0.grid[ty] && W0.grid[ty][tx] === 'W' && (lvl(tx, ty - 1) === L || lvl(tx, ty + 1) === L);
            // (on the grid: a tile's water fills it, a half tile's only its water side)
            for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
                const fx = x / R, fy = y / R, tx = tileOf(x + 0.5, Wt), ty = tileOf(y + 0.5, Ht), c = this.cutAt(tx, ty);
                if (wet(tx, ty) && (lvl(tx, ty) === L || fall(tx, ty)) && !(c && inCut(c, fx - tx, fy - ty))) m[y * W + x] = 1;
            }
            blur(m, 2, X0, Y0, X1, Y1);       // (the banks follow the tiles, their corners rounded)
            for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
                const k = y * W + x, mv = m[k];
                if (mv < 0.02) continue;
                const tx = tileOf(x + 0.5, Wt), ty = tileOf(y + 0.5, Ht), h0 = h[k];
                // (the sea's floor isn't a stream's bank: raised to the beach, it made a sandbar across a stream's mouth)
                if (lvl(tx, ty) !== L || h0 > surf + 0.3 || h0 < surf - 1.2 || this.waterAt(tx, ty) === 1) continue;
                // (a little wobble: the bank stays on its tiles' edge but isn't ruler-straight)
                const u = x / R, v = y / R, wv = mv + (vn(u / 2.2 + 5, v / 2.2) * 0.6 + vn(u / 0.8, v / 0.8) * 0.4 - 0.5) * 0.24;
                // (inside the water's own tiles too: where the wandering outline leaves a bit of a tile out, the bank comes up
                // there, so the water's edge bends both ways instead of only bulging out of a straight channel)
                const land = BASE + L * LV, inWet = wet(tx, ty) || h0 < land - 0.02;      // (or dug into by the channel next door)
                if (wv > 0.5) h[k] = surf - Math.min(0.75, (wv - 0.5) * 2.2);                     // the bed
                else if (wv > 0.25) { const t = (wv - 0.25) / 0.25, top = inWet ? land : h0, hb = surf + (top - surf) * (1 - t * t * (3 - 2 * t)); h[k] = inWet ? hb : Math.min(h0, hb); }   // the bank
                else if (inWet) h[k] = land;
            }
            // (but never where people walk: a dry tile's ground, edges and all, stays above the water, so the waterline
            // bends only inside the water's own tiles and nobody walks into a stream)
            this.keepDry(h, W, R, surf, (tx, ty) => !wet(tx, ty) && lvl(tx, ty) === L, wet, tx0 - 1, ty0 - 1, tx1 + 1, ty1 + 1);
        }
    },
    /* every height point of the walkable tiles (dry: which tiles count) that touch water (is) kept above its surface: on
       the tile's edge just above, inside it a little more (half tiles and tiles nobody walks on are left as they are) */
    keepDry(h, W, R, surf, dry, is, X0, Y0, X1, Y1) {
        for (let ty = Math.max(0, Y0); ty <= Math.min(W0.h - 1, Y1); ty++) for (let tx = Math.max(0, X0); tx <= Math.min(W0.w - 1, X1); tx++) {
            if (!dry(tx, ty) || this.cutAt(tx, ty) || (W0.coll[ty] && W0.coll[ty][tx] === '1') || this.dryIn(tx + 0.5, ty + 0.5, tx, ty, is) > 1) continue;
            // (beside a stream's mouth, its water is a little above the sea's)
            let s = surf;
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (is(tx + dx, ty + dy) && this.waterAt(tx + dx, ty + dy) === 2) s = Math.max(s, this.surfAt(tx + dx, ty + dy));
            for (let j = 0; j <= R; j++) for (let i = 0; i <= R; i++) {
                const k = (ty * R + j) * W + tx * R + i, edge = i === 0 || j === 0 || i === R || j === R;
                h[k] = Math.max(h[k], s + (edge ? 0.01 : 0.04));
            }
        }
    },
    /* a stream's or pond's surface on a water tile (world units): its level's, but a stream running out over the beach
       comes down to the sea's over its last few tiles, so it meets the sea instead of ending a step above it */
    surfAt(x, y) {
        const lv = this.waterLevel(x, y), s = ENV.BASE + lv * ENV.LV - 0.14;
        if (lv) return s;
        const d = this.seaNear(x, y);
        return d < 3 ? Math.min(s, 0.02 + 0.03 * d) : s;
    },
    /* how many tiles from the sea a tile is (0 beside it), up to three (4: further) */
    seaNear(x, y) {
        for (let r = 1; r <= 4; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r && this.waterAt(x + dx, y + dy) === 1) return r - 1;
        return 4;
    },
    /* how far a spot (u, v, tiles) in tile tx, ty is from the nearest of the tiles round it that are water (by is) */
    dryIn(u, v, tx, ty, is) {
        let d = 9;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && is(tx + dx, ty + dy)) {
            const ex = Math.max(tx + dx - u, 0, u - (tx + dx + 1)), ey = Math.max(ty + dy - v, 0, v - (ty + dy + 1));
            d = Math.min(d, Math.hypot(ex, ey));
        }
        return d;
    },
    /* the beaches' waterline smooth too: where the low ground meets the sea, the tiles' outline blurred is the shore (a
       curve, not the tiles' staircase on a diagonal coast); the sand slopes down to it and on under the water. Only beach
       and sea floor are touched, away from the raised ground's sea cliffs and from streams running out to sea. */
    shapeShore(h, W, Hn) {
        const R = ENV.RES, Wt = W0.w, Ht = W0.h, BASE = ENV.BASE;
        const tileOf = (i, n) => Math.max(0, Math.min(n - 1, Math.floor(i / R - 0.001)));
        const hh = (a, b) => { let n = Math.imul(a, 374761393) + Math.imul(b, 668265263) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
        const hs2 = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); return (hh(xi, yi) * (1 - u) + hh(xi + 1, yi) * u) * (1 - v) + (hh(xi, yi + 1) * (1 - u) + hh(xi + 1, yi + 1) * u) * v; };
        const sea = (x, y) => x < 0 || y < 0 || x >= Wt || y >= Ht || this.waterAt(x, y) === 1;
        // (a stream's last few tiles over the beach count with the sea, so the shore curves round its mouth)
        const mouth = (x, y) => x >= 0 && y >= 0 && x < Wt && y < Ht && this.waterAt(x, y) === 2 && !this.waterLevel(x, y) && this.seaNear(x, y) < 3;
        const low = (x, y) => sea(x, y) || mouth(x, y) || (this.waterAt(x, y) === 0 && !(+W0.height[y][x]));
        // (a tile is reshaped only if it and all round it are beach or sea)
        const ok = new Uint8Array(Wt * Ht);
        let any = false;
        for (let y = 0; y < Ht; y++) for (let x = 0; x < Wt; x++) {
            let s = 0, all = true;
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!low(x + dx, y + dy)) all = false; else if (sea(x + dx, y + dy)) s++; }
            if (all && s > 0 && s < 9) { ok[y * Wt + x] = 1; any = true; }
        }
        if (!any) return;
        // the sea's share round each point, blurred over about a tile (running sums: the whole island in a few ms)
        const m = new Float32Array(W * Hn), t = new Float32Array(Math.max(W, Hn)), r = R;
        for (let y = 0; y < Hn; y++) for (let x = 0; x < W; x++) {
            const tx = tileOf(x + 0.5, Wt), ty = tileOf(y + 0.5, Ht), c = this.cutAt(tx, ty);
            m[y * W + x] = (sea(tx, ty) || mouth(tx, ty)) && !(c && inCut(c, x / R - tx, y / R - ty)) ? 1 : 0;
        }
        const line = (get, set, n) => {
            for (let pass = 0; pass < 2; pass++) {
                let acc = 0;
                for (let i = -r; i <= r; i++) acc += get(Math.max(0, Math.min(n - 1, i)));
                for (let i = 0; i < n; i++) { t[i] = acc / (2 * r + 1); acc += get(Math.min(n - 1, i + r + 1)) - get(Math.max(0, i - r)); }
                for (let i = 0; i < n; i++) set(i, t[i]);
            }
        };
        for (let y = 0; y < Hn; y++) line(i => m[y * W + i], (i, v) => { m[y * W + i] = v; }, W);
        for (let x = 0; x < W; x++) line(i => m[i * W + x], (i, v) => { m[i * W + x] = v; }, Hn);
        for (let y = 0; y < Hn; y++) for (let x = 0; x < W; x++) {
            const tx = tileOf(x + 0.5, Wt), ty = tileOf(y + 0.5, Ht);
            if (!ok[ty * Wt + tx] || mouth(tx, ty)) continue;
            const k = y * W + x, h0 = h[k], mv = m[k] + (hs2(x * 0.11, y * 0.11) - 0.5) * 0.16;   // (a little wobble along the shore)
            if (mv <= 0.02 || mv >= 0.98) continue;
            // the shore's profile: the beach's height inland, down to the waterline where the blurred outline is halfway,
            // then on down under the water as the sea floor does
            const hs = mv < 0.5 ? BASE * Math.min(1, (0.5 - mv) / 0.35) : -0.5 * Math.min(1, (mv - 0.5) / 0.4);
            if (sea(tx, ty)) h[k] = Math.max(h0, hs);
            else if (Math.abs(h0 - BASE) < 0.02) h[k] = Math.min(h0, hs);
        }
        // (the beach where people walk stays dry, edges and all: the sea comes up to the tiles' line and no further)
        this.keepDry(h, W, R, 0, (tx, ty) => !sea(tx, ty) && !mouth(tx, ty) && ok[ty * Wt + tx], (x, y) => sea(x, y) || mouth(x, y), 0, 0, Wt - 1, Ht - 1);
    },
    /* the sea cliffs where raised ground drops straight into the sea (David, 29 October: they stepped along every diagonal
       of the coast, tile by tile): their edge follows the outline of the tiles blurred over about a tile, a corner of the
       rim cut back and a notch of sea filled in, with a little wobble. Only the rim nobody walks on is lowered (a blocked
       raised tile), and only the sea is raised, so where people walk stays as it is */
    shapeCliffs(h, W, Hn) {
        const R = ENV.RES, Wt = W0.w, Ht = W0.h, LV = ENV.LV, BASE = ENV.BASE;
        const tileOf = (i, n) => Math.max(0, Math.min(n - 1, Math.floor(i / R - 0.001)));
        const sea = (x, y) => x < 0 || y < 0 || x >= Wt || y >= Ht || this.waterAt(x, y) === 1;
        const lvl = (x, y) => sea(x, y) ? -1 : +W0.height[y][x] || 0;
        const rim = (x, y) => !sea(x, y) && lvl(x, y) > 0 && W0.coll[y] && W0.coll[y][x] === '1';
        // (the tiles to reshape: the blocked rim of raised ground on the sea, and the sea beside it; the level a filled
        // notch of sea rises to is the highest rim round it)
        const ok = new Int8Array(Wt * Ht).fill(-1);
        let any = false;
        for (let y = 0; y < Ht; y++) for (let x = 0; x < Wt; x++) {
            let s = 0, top = -1, low = false;
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx, ny = y + dy;
                if (sea(nx, ny)) s++;
                else if (rim(nx, ny)) top = Math.max(top, lvl(nx, ny));
                else if (dx || dy) low = true;
            }
            if (sea(x, y) ? (top > 0 && !low) : (rim(x, y) && s > 0)) { ok[y * Wt + x] = sea(x, y) ? top : lvl(x, y); any = true; }
        }
        if (!any) return;
        const hh = (a, b) => { let n = Math.imul(a, 374761393) + Math.imul(b, 668265263) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
        const hs2 = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); return (hh(xi, yi) * (1 - u) + hh(xi + 1, yi) * u) * (1 - v) + (hh(xi, yi + 1) * (1 - u) + hh(xi + 1, yi + 1) * u) * v; };
        // the sea's share round each point, blurred over about a tile (running sums, as shapeShore does)
        const m = new Float32Array(W * Hn), t = new Float32Array(Math.max(W, Hn)), r = R;
        for (let y = 0; y < Hn; y++) for (let x = 0; x < W; x++) m[y * W + x] = sea(tileOf(x + 0.5, Wt), tileOf(y + 0.5, Ht)) ? 1 : 0;
        const line = (get, set, n) => {
            for (let pass = 0; pass < 2; pass++) {
                let acc = 0;
                for (let i = -r; i <= r; i++) acc += get(Math.max(0, Math.min(n - 1, i)));
                for (let i = 0; i < n; i++) { t[i] = acc / (2 * r + 1); acc += get(Math.min(n - 1, i + r + 1)) - get(Math.max(0, i - r)); }
                for (let i = 0; i < n; i++) set(i, t[i]);
            }
        };
        for (let y = 0; y < Hn; y++) line(i => m[y * W + i], (i, v) => { m[y * W + i] = v; }, W);
        for (let x = 0; x < W; x++) line(i => m[i * W + x], (i, v) => { m[i * W + x] = v; }, Hn);
        for (let y = 0; y < Hn; y++) for (let x = 0; x < W; x++) {
            const tx = tileOf(x + 0.5, Wt), ty = tileOf(y + 0.5, Ht), lv = ok[ty * Wt + tx];
            if (lv < 0) continue;
            // (eased across the outline rather than cut at it: a point a step off the line is part way down, so the edge
            // runs smoothly between the height points instead of in quarter-tile notches)
            const k = y * W + x, mv = m[k] + (hs2(x * 0.13, y * 0.13) - 0.5) * 0.14, e = Math.min(1, Math.max(0, (mv - 0.38) / 0.24)), t = e * e * (3 - 2 * e);
            if (sea(tx, ty)) { if (t < 1) h[k] = Math.max(h[k], h[k] + (BASE + lv * LV - h[k]) * (1 - t)); }
            else if (t > 0) h[k] = Math.min(h[k], h[k] + (-0.45 - h[k]) * t);
        }
        // (no lone points: where the coast steps on a diagonal, a corner point of the ground people walk on was left standing
        // past a lowered point of the rim, a sharp tooth over the sea (David, 29 October: "the pointy parts of the island's
        // sides"). A point of the rim low between two high ones comes up to them, and one high between low ones comes down)
        for (let pass = 0; pass < 2; pass++) for (let y = 1; y < Hn - 1; y++) for (let x = 1; x < W - 1; x++) {
            const tx = tileOf(x + 0.5, Wt), ty = tileOf(y + 0.5, Ht);
            if (ok[ty * Wt + tx] < 0) continue;
            const k = y * W + x, v = h[k], l = h[k - 1], r = h[k + 1], u = h[k - W], d = h[k + W];
            const pit = Math.max(Math.min(l, r), Math.min(u, d)), peak = Math.max(l, r, u, d);
            if (v < pit - 0.6) h[k] = pit;
            else if (v > peak + 0.6) h[k] = peak;
        }
    },
    heightAt(u, v) {
        const g = this.grid;
        if (!g) return 0;
        const fx = Math.max(0, Math.min(g.W - 1.001, u * ENV.RES)), fy = Math.max(0, Math.min(g.Hn - 1.001, v * ENV.RES));
        const ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy, h = g.h, i = iy * g.W + ix;
        return (h[i] * (1 - tx) + h[i + 1] * tx) * (1 - ty) + (h[i + g.W] * (1 - tx) + h[i + g.W + 1] * tx) * ty;
    },
    /* what kind of ground each spot of a window of tiles is: grass, dirt, cobbles, sand (8 pixels a tile, from the same
       rounded kinds as the HD-2D ground), in a piece's own picture (its top row is the window's south edge) */
    *kindsWin(out, x0, y0, w, h) {
        const P = 8, N = w * P, M = h * P, d = new Uint8Array(N * M * 4);
        const K = { t: new Uint8Array((w + 4) * (h + 4)), wet: new Uint8Array((w + 4) * (h + 4)), w: w + 4, x0: x0 - 2, y0: y0 - 2 };
        for (let j = 0; j < h + 4; j++) for (let i = 0; i < w + 4; i++) {
            const tx = x0 - 2 + i, ty = y0 - 2 + j, c = r3ClassAt(tx, ty), g = W0.grid[ty] ? W0.grid[ty][tx] : '~', k = j * K.w + i;
            K.t[k] = c; K.wet[k] = c !== R3_MAT.keep ? 0 : g === undefined || g === 'W' || this.waterAt(tx, ty) ? 1 : 2;
        }
        // (the top of a wall is raised to the higher ground beside it, though its tile is the lower one's: there the ground is
        // the higher tile's kind, not the lower's, or a beach's sand would run along the top of every wall above it)
        const lvl = (i, j) => i < 0 || j < 0 || i >= W0.w || j >= W0.h || this.waterAt(i, j) === 1 ? -1 : +W0.height[j][i] || 0;
        const upper = (i, j, l) => {
            for (const [di, dj] of [[0, -1], [-1, 0], [1, 0], [0, -2], [-1, -1], [1, -1]]) {
                if (lvl(i + di, j + dj) <= l) continue;
                const c = r3ClassAt(i + di, j + dj) & 15;
                if (c !== R3_MAT.keep && c !== R3_MAT.stairs) return c === R3_MAT.rock ? R3_MAT.grass : c;
            }
            return R3_MAT.grass;
        };
        for (let y = 0; y < M; y++) {
            for (let x = 0; x < N; x++) {
                const wx = (x0 + (x + 0.5) / P) * TILE, wy = (y0 + (y + 0.5) / P) * TILE, ty = Math.floor(wy / TILE), tx = Math.floor(wx / TILE);
                // (each tile its own kind, on the grid: its edges where the tile's are, rounded by the softening below; a
                // half tile's corner is its neighbor's kind)
                let kd = this.kindPx(tx, ty, wx / TILE - tx, wy / TILE - ty);
                const wk = this.waterAtPx(tx, ty, wx / TILE - tx, wy / TILE - ty), l = lvl(tx, ty);
                if (wk === 0 && l >= 0 && kd !== R3_MAT.stairs && this.heightAt(wx / TILE, wy / TILE) > ENV.BASE + l * ENV.LV + 0.6) kd = upper(tx, ty, l);
                if (kd === R3_MAT.keep && wk === 0 && this.laid(tx, ty)) kd = R3_MAT.dirt;           // (under Sarah's bricks or planks)
                if (kd === R3_MAT.keep && wk === 0 && l > 0) kd = R3_MAT.grass;             // (high ground without a kind of its own: lawn, not sand)
                if (kd === R3_MAT.keep && wk === 1) kd = R3_MAT.sand;                   // the sea floor is sand
                if (kd === R3_MAT.keep && wk === 2) kd = 7;                             // a stream or pond bed
                if (W0.grid[ty] && W0.grid[ty][tx] === 'F') kd = R3_MAT.dirt;                           // (a field: tilled soil, never lawn)
                if (inCommunity(tx, ty)) kd = R3_MAT.dirt;                                         // (the community garden, tilled inside its fence)
                if (kd === R3_MAT.keep && W0.grid[ty] && W0.grid[ty][tx] === 'x') kd = R3_MAT.cobble; // (the hot spring's stone rim)
                if (kd === R3_MAT.rock) kd = R3_MAT.grass;
                if (kd === R3_MAT.stairs) kd = R3_MAT.dirt;             // (under the steps: no grass growing up through them)
                const o = ((M - 1 - y) * N + x) * 4;
                d[o] = kd === 1 ? 255 : 0; d[o + 1] = kd === 2 ? 255 : 0; d[o + 2] = kd === 3 ? 255 : 0; d[o + 3] = kd === 4 ? 255 : kd === 7 ? 128 : 0;
            }
            if (y % 32 === 31) yield;
        }
        // soften where grass, dirt and cobbles meet (about a third of a tile each way): the shader cuts the edge with noise
        // there, so paths and the square end raggedly in the grass, as in the concept
        const tmp = new Float32Array(N * M);
        for (let ch = 0; ch < 3; ch++) {
            for (let pass = 0; pass < 2; pass++) for (const horiz of [true, false]) {
                const R = 3;
                for (let y = 0; y < M; y++) for (let x = 0; x < N; x++) {
                    let s = 0, c = 0;
                    for (let k = -R; k <= R; k++) { const xx = horiz ? x + k : x, yy = horiz ? y : y + k; if (xx < 0 || yy < 0 || xx >= N || yy >= M) continue; s += d[(yy * N + xx) * 4 + ch]; c++; }
                    tmp[y * N + x] = s / c;
                }
                for (let i = 0; i < N * M; i++) d[i * 4 + ch] = Math.round(tmp[i]);
            }
            yield;
        }
        Object.assign(out, { d, N, M, P });
    },
    /* a tile's kind of ground at a spot in it (u, v 0..1): the tile's own, or in a half tile's cut corner its neighbor's
       there (the one beside that corner, across or along) */
    kindPx(tx, ty, u, v) {
        const cl = (i, j) => r3ClassAt(i, j) & 15;
        const c = this.cutAt(tx, ty);
        if (c && inCut(c, u, v)) {
            const dx = c === 'b' || c === 'c' ? 1 : -1, dy = c === 'c' || c === 'd' ? 1 : -1;
            const a = cl(tx + dx, ty), b = cl(tx, ty + dy);
            return a !== R3_MAT.keep ? a : b !== R3_MAT.keep ? b : cl(tx + dx, ty + dy);
        }
        return cl(tx, ty);
    },
    /* a half tile's cut (scripts/island/layout.mjs: a, b, c, d its north-west, north-east, south-east, south-west corner),
       or null */
    cutAt(tx, ty) { const r = W0.cut && W0.cut[ty], c = r && r[tx]; return c && c !== '.' ? c : null; },
    /* the water at a spot in a tile (a cut water tile's corner is dry) */
    waterAtPx(tx, ty, u, v) { const w = this.waterAt(tx, ty), c = w ? this.cutAt(tx, ty) : null; return c && inCut(c, u, v) ? 0 : w; },
    /* how near each spot of a window is to a pond's or stream's water (8 pixels a tile, softened over about half a tile):
       the bank there is damp, pebbly earth */
    *wetWin(out, x0, y0, w, h) {
        const P = 8, N = w * P, M = h * P, v = new Float32Array(N * M), d = new Uint8Array(N * M * 4);
        let any = false;
        for (let y = 0; y < M; y++) for (let x = 0; x < N; x++) {
            const tx = x0 + Math.floor(x / P), ty = y0 + Math.floor(y / P), g = W0.grid[ty] && W0.grid[ty][tx];
            if (g !== 'h' && this.waterAtPx(tx, ty, (x % P + 0.5) / P, (y % P + 0.5) / P) === 2) { v[y * N + x] = 1; any = true; }
        }
        if (any) {
            const tmp = new Float32Array(N * M), R = 5;
            for (let pass = 0; pass < 2; pass++) for (const horiz of [true, false]) {
                for (let y = 0; y < M; y++) for (let x = 0; x < N; x++) {
                    let s = 0, c = 0;
                    for (let k = -R; k <= R; k++) { const xx = horiz ? x + k : x, yy = horiz ? y : y + k; if (xx < 0 || yy < 0 || xx >= N || yy >= M) continue; s += v[yy * N + xx]; c++; }
                    tmp[y * N + x] = s / c;
                }
                v.set(tmp);
                yield;
            }
            for (let y = 0; y < M; y++) for (let x = 0; x < N; x++) d[((M - 1 - y) * N + x) * 4] = Math.round(v[y * N + x] * 255);
        }
        // (in its alpha, how wild the grass is: 0 beside trodden ground, the paths, the square, the beach and buildings, up to 1
        // five or six tiles from any: FMAP's wear and patches, EnvLawn's tufts)
        const wild = this.wildWin(x0, y0, w, h);
        for (let y = 0; y < M; y++) for (let x = 0; x < N; x++) {
            const fx = Math.max(0, Math.min(w - 1.001, (x + 0.5) / P - 0.5)), fy = Math.max(0, Math.min(h - 1.001, (y + 0.5) / P - 0.5)), ix = Math.floor(fx), iy = Math.floor(fy), ax = fx - ix, ay = fy - iy;
            const at = (i, j) => wild[j * w + i], v2 = (at(ix, iy) * (1 - ax) + at(ix + 1, iy) * ax) * (1 - ay) + (at(ix, iy + 1) * (1 - ax) + at(ix + 1, iy + 1) * ax) * ay;
            d[((M - 1 - y) * N + x) * 4 + 3] = Math.round(v2 * 255);
        }
        yield;
        // (and in its green and blue, Sarah's brick and plank paths, each its tile's own square: the shader lays the bricks
        // and the boards, FMAP. They were left as the painted picture, which the new look doesn't have: David, 28 October)
        for (let ty = y0; ty < y0 + h; ty++) for (let tx = x0; tx < x0 + w; tx++) {
            const ch = this.laid(tx, ty);
            if (ch) for (let j = 0; j < P; j++) for (let i = 0; i < P; i++) d[((M - 1 - ((ty - y0) * P + j)) * N + (tx - x0) * P + i) * 4 + ch] = 255;
        }
        Object.assign(out, { v, d, N, M, P });
    },
    /* how wild the grass is on each tile of a window (0..1, row by row): how far it is from trodden ground (a path, the
       square, sand, steps, Sarah's own paths, a building and the row in front of it), 0 beside it, 1 from six tiles off */
    wildWin(x0, y0, w, h) {
        const PAD = 7, W2 = w + 2 * PAD, H2 = h + 2 * PAD, D = new Float32Array(W2 * H2), B = this.bldMap();
        for (let j = 0; j < H2; j++) for (let i = 0; i < W2; i++) {
            const tx = x0 - PAD + i, ty = y0 - PAD + j, c = r3ClassAt(tx, ty) & 15, inMap = tx >= 0 && ty >= 0 && tx < W0.w && ty < W0.h;
            const trod = inMap && (c === R3_MAT.dirt || c === R3_MAT.cobble || c === R3_MAT.sand || c === R3_MAT.stairs || this.laid(tx, ty) || B[ty * W0.w + tx]);
            D[j * W2 + i] = trod ? 0 : 99;
        }
        // (the distance, two passes of a chamfer: a step across 1, diagonally 1.4)
        for (let j = 0; j < H2; j++) for (let i = 0; i < W2; i++) {
            let v = D[j * W2 + i];
            if (i > 0) v = Math.min(v, D[j * W2 + i - 1] + 1);
            if (j > 0) { v = Math.min(v, D[(j - 1) * W2 + i] + 1); if (i > 0) v = Math.min(v, D[(j - 1) * W2 + i - 1] + 1.4); if (i < W2 - 1) v = Math.min(v, D[(j - 1) * W2 + i + 1] + 1.4); }
            D[j * W2 + i] = v;
        }
        for (let j = H2 - 1; j >= 0; j--) for (let i = W2 - 1; i >= 0; i--) {
            let v = D[j * W2 + i];
            if (i < W2 - 1) v = Math.min(v, D[j * W2 + i + 1] + 1);
            if (j < H2 - 1) { v = Math.min(v, D[(j + 1) * W2 + i] + 1); if (i < W2 - 1) v = Math.min(v, D[(j + 1) * W2 + i + 1] + 1.4); if (i > 0) v = Math.min(v, D[(j + 1) * W2 + i - 1] + 1.4); }
            D[j * W2 + i] = v;
        }
        const out = new Float32Array(w * h);
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const v = (D[(j + PAD) * W2 + i + PAD] - 0.8) / 5.2; out[j * w + i] = Math.max(0, Math.min(1, v)); }
        return out;
    },
    /* the tiles the island's buildings stand on, and the row in front of each (made once) */
    bldMap() {
        if (this._bld && this._bld.w === W0.w) return this._bld.m;
        const m = new Uint8Array(W0.w * W0.h);
        for (const b of Object.values(W0.buildings || {})) for (let y = b.y; y <= b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) if (x >= 0 && y >= 0 && x < W0.w && y < W0.h) m[y * W0.w + x] = 1;
        this._bld = { w: W0.w, m };
        return m;
    },
    /* how wild the grass is at a spot (tiles), once its piece is made: 0 beside trodden ground, 1 out in the wild */
    wildAt(x, y) {
        const c = this.chunkAt(x, y), w = c && c.wet;
        if (!w || !w.N) return 0.5;
        const i = Math.max(0, Math.min(w.N - 1, Math.floor((x - c.wx0) * w.P))), j = w.M - 1 - Math.max(0, Math.min(w.M - 1, Math.floor((y - c.wy0) * w.P)));
        return w.d[(j * w.N + i) * 4 + 3] / 255;
    },
    /* Sarah's brick (1) or plank (2) path on a tile, or 0 */
    laid(tx, ty) { const o = overlayAt(tx, ty); return o === 'brick' ? 1 : o === 'planks' ? 2 : 0; },
    tex(d, N, M) {
        const t = new THREE.DataTexture(d, N, M, THREE.RGBAFormat);
        t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true;
        return t;
    },
    /* the piece a spot (tiles) is in, once made */
    chunkAt(x, y) {
        const B = Env.built;
        if (!B) return null;
        const c = B.chunks.get(Math.floor(x / ENV.CHUNK) + ',' + Math.floor(y / ENV.CHUNK));
        return c && c.kinds ? c : null;
    },
    /* how wet the bank is at a spot (tiles): 0 away from ponds and streams, 1 in them */
    wetAt(x, y) {
        const c = this.chunkAt(x, y), w = c && c.wet;
        if (!w || !w.N) return 0;
        const i = Math.max(0, Math.min(w.N - 1, Math.floor((x - c.wx0) * w.P))), j = Math.max(0, Math.min(w.M - 1, Math.floor((y - c.wy0) * w.P)));
        return w.v[j * w.N + i];
    },
    /* how much of the ground at a spot (tiles) is grass (0..1) */
    grassAt(x, y) {
        const c = this.chunkAt(x, y), k = c && c.kinds;
        if (!k) return 0;
        const i = Math.max(0, Math.min(k.N - 1, Math.floor((x - c.wx0) * k.P))), j = k.M - 1 - Math.max(0, Math.min(k.M - 1, Math.floor((y - c.wy0) * k.P)));
        return k.d[(j * k.N + i) * 4] / 255;
    },
    /* The heights and the materials are made once for the whole island; the pieces of ground (chunkSteps) as they come
       near the view. */
    build(group) {
        let T0 = performance.now(); const lap = (n) => { if (DEBUG) console.log('ENVDBG ' + n + ' ' + Math.round(performance.now() - T0)); T0 = performance.now(); };
        const C = this.cells(), R = ENV.RES, Wt = W0.w, Ht = W0.h, W = Wt * R + 1, Hn = Ht * R + 1, h = new Float32Array(W * Hn);
        for (let y = 0; y < Hn; y++) for (let x = 0; x < W; x++) h[y * W + x] = this.sample(C, x / R, y / R);
        lap('heights');
        this.shapeWater(h, W, Hn);
        this.shapeShore(h, W, Hn);
        this.shapeCliffs(h, W, Hn);
        lap('water');
        this.grid = { h, W, Hn };
        const T = EnvTex, wall = T.wall(), sand = T.sand();
        // the surfaces baked in Blender (the concept's flagstones, the path, the lawn) where they've loaded, else our own
        const X = typeof EnvModels !== 'undefined' ? EnvModels.textures : {}, B = (n, k, f) => X[n + '_' + k] || f();
        const flat = this.flatTex || (this.flatTex = Object.assign(new THREE.DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1, THREE.RGBAFormat), { needsUpdate: true }));
        // (shared by every piece's material; each piece adds its own pictures and where they lie)
        this.uniforms = {
            uMapSz: { value: new THREE.Vector2(Wt, Ht) },
            tGrass: { value: T.lawn(Clock.season()).map }, tDirt: { value: B('path', 'col', () => T.dirt().map) }, tCob: { value: B('flagstones', 'col', () => T.cobble().map) }, tSand: { value: sand.map }, tWall: { value: wall.map },
            nGrass: { value: T.lawn(Clock.season()).normal }, nDirt: { value: B('path', 'nrm', () => T.dirt().normal) }, nCob: { value: B('flagstones', 'nrm', () => T.cobble().normal) }, nSand: { value: sand.normal }, nWall: { value: wall.normal },
            hCob: { value: B('flagstones', 'hgt', () => flat) }, hDirt: { value: B('path', 'hgt', () => flat) },
            uSeason: { value: new THREE.Vector4(1, 1, 1, 0) }, uRainW: this.rain, uGrid: this.gridOn,
            // (the lawn's average color, what its detail melts into far off, and its broad patches' two tints)
            uGrassAvg: { value: new THREE.Vector3(...T.lawn(Clock.season()).avg) }, uPatchA: { value: new THREE.Vector3(1, 1, 1) }, uPatchB: { value: new THREE.Vector3(1, 1, 1) },
            // (the lamplight pooled on the ground at night: the nearest few pools, EnvGlow)
            uGlowP: { value: Array.from({ length: EnvGlow.N }, () => new THREE.Vector4(0, 0, 0, 0)) }, uGlowC: { value: Array.from({ length: EnvGlow.N }, () => new THREE.Vector3()) }, uGlowK: { value: 0 },
        };
        lap('tex');
        this._season = null;                // (new uniforms: the season's colors go in on the first frame)
        this.meshes = [];
        const uniforms = this.uniforms;
        return { meshes: this.meshes, tick: (r3, a) => {
            const s = a.bgSeason || Clock.season();
            if (s !== this._season) {
                // (the lawn's own colors for the season; winter's snow lies over it)
                this._season = s;
                const L = EnvTex.lawn(s);
                uniforms.tGrass.value = L.map; uniforms.nGrass.value = L.normal;
                uniforms.uGrassAvg.value.set(...L.avg);
                const pt = (EnvTex.LAWN[s] || EnvTex.LAWN.summer).patch;
                uniforms.uPatchA.value.set(...pt[0]); uniforms.uPatchB.value.set(...pt[1]);
                uniforms.uSeason.value.set(...(s === 'winter' ? [1.1, 1.12, 1.18] : [1, 1, 1]), s === 'winter' ? 1 : 0);
                // (the grass along the walls' tops takes the lawn's own change from summer, so it always matches the lawn
                // beside it: a fixed tint made it glow yellow against autumn's olive lawn, David's note of 29 October)
                const A = L.avg, S0 = EnvTex.lawn('summer').avg, k = c => Math.max(0.6, Math.min(1.6, A[c] / Math.max(0.01, S0[c])));
                R3U.uGrassTint.value.set(k(0), k(1), k(2), s === 'winter' ? 0.8 : 0);
            }
            // (the ground gets wet over a few seconds of rain and dries off more slowly after)
            const wet = G.weather === 'rain' ? 1 : 0, R = this.rain;
            R.value += (wet - R.value) * (wet > R.value ? 0.01 : 0.003);
        } };
    },
    rain: { value: 0 },     // (how wet everything is: the ground darkens, puddles shine, rings on the water)
    gridOn: { value: lsGet('sc-grid') === '1' ? 1 : 0 },   // (the tiles drawn on the ground: for placing things, and checking things sit on them)
    /* a piece of ground: its pictures, then its mesh (R points a tile, normals from the whole island's heights, no seams) */
    *chunkSteps(c) {
        const M = EnvChunk.MARGIN, wx0 = c.x0 - M, wy0 = c.y0 - M, ww = c.w + 2 * M, wh = c.h + 2 * M;
        const kinds = {}, wet = {};
        yield* this.kindsWin(kinds, wx0, wy0, ww, wh);
        yield* this.wetWin(wet, wx0, wy0, ww, wh);
        Object.assign(c, { kinds, wet, wx0, wy0 });
        const tk = this.tex(kinds.d, kinds.N, kinds.M), tw = this.tex(wet.d, wet.N, wet.M);
        c.textures.push(tk, tw);
        const uniforms = Object.assign({}, this.uniforms, { uKinds: { value: tk }, uWet: { value: tw }, uOrg: { value: new THREE.Vector2(wx0, wy0) }, uSz: { value: new THREE.Vector2(ww, wh) } });
        const mat = r3Patch(new THREE.MeshStandardMaterial({ roughness: 0.94, metalness: 0, color: 0xffffff }), {
            key: 'envground', uniforms,
            vhead: 'attribute float aAO; varying float vAO; varying vec3 vNw;\n',
            vbody: 'vAO = aAO; vNw = normal;',
            fhead: EnvGround.FHEAD, fmap: EnvGround.FMAP, fnormal: EnvGround.FNORMAL, fpre: 'gl_FragColor.rgb += envGlow;', derivatives: true,
        });
        yield;
        const R = ENV.RES, { h, W, Hn } = this.grid, nx = c.w * R + 1, ny = c.h * R + 1;
        const pos = new Float32Array(nx * ny * 3), nrm = new Float32Array(nx * ny * 3), aoA = new Float32Array(nx * ny), idx = [];
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
            const gx = c.x0 * R + i, gy = c.y0 * R + j, k = j * nx + i, hh = h[gy * W + gx];
            pos[k * 3] = gx / R; pos[k * 3 + 1] = hh; pos[k * 3 + 2] = gy / R * R3_ZS;
            const hl = h[gy * W + Math.max(0, gx - 1)], hr = h[gy * W + Math.min(W - 1, gx + 1)], hu = h[Math.max(0, gy - 1) * W + gx], hd = h[Math.min(Hn - 1, gy + 1) * W + gx];
            const ex = (hr - hl) / (2 / R), ez = (hd - hu) / (2 / R * R3_ZS), l = Math.hypot(ex, 1, ez);
            nrm[k * 3] = -ex / l; nrm[k * 3 + 1] = 1 / l; nrm[k * 3 + 2] = -ez / l;
            // shade where the ground is hemmed in (the foot of a wall, a stream's banks): darker, as the sky reaches it less
            let occ = 0;
            for (const [dx, dy] of EnvGround.AO_TAPS) {
                const xx = Math.max(0, Math.min(W - 1, gx + dx)), yy = Math.max(0, Math.min(Hn - 1, gy + dy)), up = h[yy * W + xx] - hh;
                if (up > 0.05) occ += Math.min(1, up / (Math.hypot(dx, dy) / R * 2.2));
            }
            aoA[k] = Math.max(0.42, 1 - occ * 0.14);
        }
        for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
            const a = j * nx + i, b = a + 1, cc = a + nx, d = cc + 1;
            // split each square along the diagonal that follows the ground (no saw teeth along a wall's top)
            const ha = pos[a * 3 + 1], hb = pos[b * 3 + 1], hc = pos[cc * 3 + 1], hd = pos[d * 3 + 1];
            if (Math.abs(ha - hd) < Math.abs(hb - hc)) idx.push(a, cc, d, a, d, b); else idx.push(a, cc, b, b, cc, d);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
        geo.setAttribute('aAO', new THREE.BufferAttribute(aoA, 1));
        geo.setIndex(idx);
        geo.computeBoundingSphere();
        const m = new THREE.Mesh(geo, mat);
        // (the ground takes shadows but doesn't cast them: a height grid shading itself comes out in stripes)
        m.receiveShadow = true; m.castShadow = false;
        m.renderOrder = -2;
        c.group.add(m);
        c.meshes.push(m);
        this.meshes.push(m);
    },
    AO_TAPS: [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, -2], [0, 2], [3, -3], [-3, -3], [0, -4]],
};
/* the ground's shader (a MeshStandardMaterial's, with the light, shadows and haze it brings): what kind each spot is comes
   from the kinds picture (blended, with ragged edges so grass reaches over paths), each kind from its own surface;
   anything steep is the stone wall, laid in courses across its face */
EnvGround.FHEAD = `
uniform sampler2D uKinds; uniform vec2 uMapSz; uniform vec2 uOrg; uniform vec2 uSz; uniform vec4 uSeason; uniform float uRainW; uniform float uGrid;
uniform sampler2D tGrass; uniform sampler2D tDirt; uniform sampler2D tCob; uniform sampler2D tSand; uniform sampler2D tWall;
uniform sampler2D nGrass; uniform sampler2D nDirt; uniform sampler2D nCob; uniform sampler2D nSand; uniform sampler2D nWall;
uniform sampler2D hCob; uniform sampler2D hDirt; uniform sampler2D uWet;
uniform vec3 uGrassAvg; uniform vec3 uPatchA; uniform vec3 uPatchB;
uniform vec4 uGlowP[${16}]; uniform vec3 uGlowC[${16}]; uniform float uGlowK;
varying float vAO; varying vec3 vNw;
vec4 envW; float envSteep; vec3 envWallN; vec2 envWallUv; float envFar; float envWild; vec3 envGlow;
`;
EnvGround.FMAP = `
{
    vec2 tp = vec2(vWp.x, vWp.z / ${R3_ZS.toFixed(3)});
    vec2 kuv = (tp - uOrg) / uSz;
    vec4 k = texture2D(uKinds, vec2(kuv.x, 1.0 - kuv.y));
    float bed = step(0.3, k.a) * step(k.a, 0.7);
    float sandW = k.a > 0.7 ? 1.0 : 0.0;
    // ragged edges: grass pushes into the others where a fine noise says so
    float rag = r3n(tp * 1.6 + 11.0) * 0.4 + r3n(tp * 5.3) * 0.36 + r3n(tp * 13.1 + 3.0) * 0.24;
    float tot = k.r + k.g + k.b + sandW * k.a;
    // grass where the softened weight, pushed about by the noise, passes a half: a ragged edge a few pixels soft. Where
    // the square or a path meets the grass, what stands up (the flagstones, the pebbles) keeps longest and the gaps go
    // green first, so the stones straggle out into the lawn as in the concept
    vec2 u4h = tp * 0.25;
    float hard = (k.b * texture2D(hCob, u4h).r + k.g * texture2D(hDirt, u4h).r * 0.8) / max(0.001, k.b + k.g);
    float gw = smoothstep(0.4, 0.6, k.r + (rag - 0.5) * 0.45 - (k.b + k.g > 0.04 ? (hard - 0.42) * 0.55 : 0.0));
    vec4 w = vec4(gw, k.g, k.b, sandW * k.a);
    float o = w.y + w.z + w.w;
    if (o < 0.01) w.x = 1.0; else w.yzw *= (1.0 - gw) / o;
    envW = w;
    vec2 u4 = tp * 0.25;
    vec4 wt = texture2D(uWet, vec2(kuv.x, 1.0 - kuv.y));
    vec3 cd = texture2D(tDirt, u4).rgb, cc = texture2D(tCob, u4).rgb, cs = texture2D(tSand, u4).rgb;
    // the lawn (David, 29 October): smooth and mostly green, its fine detail melting into its average color further off;
    // broad irregular patches a shade apart (a slow noise, warped); worn paler and yellower beside the paths, the square,
    // the beach and buildings, now and then down to bare earth, and deeper and richer out in the wild (the wet picture's
    // alpha: how far the trodden ground is, EnvGround.wetWin)
    envWild = wt.a;
    envFar = smoothstep(6.0, 22.0, distance(vWp, cameraPosition));
    vec3 cg = mix(texture2D(tGrass, u4).rgb, uGrassAvg, envFar * 0.85);
    vec2 pw = tp * 0.085 + vec2(r3n(tp * 0.035 + 3.7), r3n(tp * 0.035 + 8.1)) * 1.8;
    vec2 pv = tp * 0.24 + vec2(r3n(tp * 0.11 + 1.3), r3n(tp * 0.11 + 6.6)) * 1.2;
    cg *= mix(uPatchA, uPatchB, smoothstep(0.3, 0.7, r3n(pw))) * mix(vec3(0.95, 0.98, 0.97), vec3(1.04, 1.03, 0.96), r3n(pv));
    cg *= mix(vec3(1.06, 1.05, 0.9), vec3(0.95, 0.99, 0.95), envWild);
    float worn = pow(1.0 - envWild, 3.0) * smoothstep(0.72, 0.84, r3n(tp * 1.1 + 5.0) * 0.7 + r3n(tp * 3.7) * 0.3);
    cg = mix(cg, mix(cg, cd, 0.5), worn * 0.4);
    cg *= uSeason.rgb;
    vec3 col = cg * w.x + cd * w.y + cc * w.z + cs * w.w;
    // a stream or pond bed: sand and pebbles, darker
    if (bed > 0.5 && tot < 0.05) col = mix(cs, cd, 0.5) * 0.7;
    if (tot < 0.05 && bed < 0.5) col = cs * 0.85;
    // sand the waves reach: darker and wet just above the sea and under the shallows
    col = mix(col, col * vec3(0.74, 0.72, 0.7), smoothstep(0.17, 0.02, vWp.y) * w.w);
    // Sarah's own paths of brick (the wet picture's green: a running bond, every brick its own firing, in pale mortar) and
    // planks (its blue: boards across the path, staggered joints, the grain along them, dark gaps)
    float laidW = clamp(wt.g + wt.b, 0.0, 1.0);
    if (laidW > 0.004) {
        vec2 bq = vec2(tp.x * 2.0, tp.y * 4.0);
        bq.x += mod(floor(bq.y), 2.0) * 0.5;
        vec2 bf = fract(bq), bi = floor(bq);
        float mortar = 1.0 - smoothstep(0.55, 1.0, min(min(bf.x, 1.0 - bf.x) / 0.045, min(bf.y, 1.0 - bf.y) / 0.09));
        vec3 brick = mix(vec3(0.6, 0.29, 0.21), vec3(0.76, 0.42, 0.3), r3h(bi + 3.1)) * (0.9 + 0.18 * r3n(tp * 11.0));
        brick = mix(brick, vec3(0.66, 0.62, 0.55), mortar);
        vec2 pq = vec2(tp.x * 0.7, tp.y * 4.0);
        pq.x += r3h(vec2(floor(pq.y), 7.0));
        vec2 pf = fract(pq), pi = floor(pq);
        float gap = 1.0 - smoothstep(0.55, 1.0, min(min(pf.y, 1.0 - pf.y) / 0.08, min(pf.x, 1.0 - pf.x) / 0.025));
        vec3 wood = mix(vec3(0.52, 0.35, 0.2), vec3(0.7, 0.51, 0.31), r3h(pi + 1.7));
        wood *= 0.9 + 0.12 * r3n(vec2(tp.x * 3.0, tp.y * 40.0) + pi);
        wood = mix(wood, vec3(0.22, 0.15, 0.09), gap);
        col = mix(col, brick, wt.g);
        col = mix(col, wood, wt.b);
        w = mix(w, vec4(0.0, 0.0, 1.0, 0.0), laidW);
        envW = w;
    }
    // a pond's or stream's bank: damp, pebbly earth between the grass and the water, its edge ragged
    float wetv = wt.r;
    float bank = smoothstep(0.06, 0.32, wetv + (rag - 0.5) * 0.3) * step(0.05, tot);
    col = mix(col, cd * vec3(0.58, 0.54, 0.48), bank * 0.85);
    // darker where grass meets a path (a little shadow under the overhang)
    col *= 1.0 - 0.18 * w.x * (w.y + w.z) * 4.0;
    // soft patches of lighter and darker over everything (the lawn has its own)
    col *= 1.0 + (r3n(tp * 0.21 + 7.0) - 0.5) * 0.16 * (1.0 - 0.7 * w.x);
    // rain: everything darker where it's wet, and puddles on the paths and the square, the sky's grey in them
    if (uRainW > 0.0) {
        float pud = smoothstep(0.6, 0.68, r3n(tp * 0.55 + 31.0) * 0.7 + r3n(tp * 1.7) * 0.3) * (w.y + w.z) * uRainW;
        col *= 1.0 - 0.2 * uRainW;
        col = mix(col, vec3(0.42, 0.46, 0.5), pud * 0.55);
    }
    // winter: snow lying over the lawn, thinner on the paths
    col = mix(col, vec3(0.9, 0.93, 0.98) * (0.94 + 0.08 * r3n(tp * 3.1)), uSeason.w * clamp(w.x * 0.9 + (w.y + w.z) * 0.55 + w.w * 0.3, 0.0, 0.92));
    // walls
    vec3 nw = normalize(vNw);
    envSteep = smoothstep(0.4, 0.62, 1.0 - abs(nw.y));
    bool ew = abs(nw.x) > abs(nw.z);
    envWallUv = (ew ? vec2(vWp.z / ${R3_ZS.toFixed(3)}, -vWp.y) : vec2(vWp.x, -vWp.y)) * 0.25;
    vec3 cw = texture2D(tWall, envWallUv).rgb;
    col = mix(col, cw, envSteep);
    // lamplight pooled on the ground at night, rising and falling with it (added after the lighting, EnvGround.FPRE; the
    // pools were flat squares laid over the ground and sank under it wherever it rose a little, so the light stopped in
    // a straight line: David, 29 October)
    envGlow = vec3(0.0);
    if (uGlowK > 0.0) for (int i = 0; i < ${16}; i++) {
        vec4 P = uGlowP[i];
        if (P.z <= 0.0) continue;
        vec2 d = (vWp.xz - P.xy) / vec2(P.z, P.z * 0.9);
        float f = max(0.0, 1.0 - dot(d, d));
        envGlow += uGlowC[i] * (P.w * f * f);
    }
    envGlow *= uGlowK * (1.0 - envSteep * 0.8);
    // the tiles' lines (when shown): thin and soft, on flat ground only
    if (uGrid > 0.0) {
        vec2 gd = abs(fract(tp + 0.5) - 0.5) / fwidth(tp);
        col = mix(col, vec3(1.0, 0.98, 0.9), uGrid * 0.55 * (1.0 - smoothstep(0.6, 1.6, min(gd.x, gd.y))) * (1.0 - envSteep));
    }
    diffuseColor.rgb = col * vAO;
}`;
/* (the surfaces' bumps: blended like their colors, turned onto the ground or onto the wall's face) */
EnvGround.FNORMAL = `
{
    vec2 tp = vec2(vWp.x, vWp.z / ${R3_ZS.toFixed(3)}) * 0.25;
    // (under winter's snow the lawn's little leaves hardly show)
    // (nor far off, where the lawn's melted into its own color; a little flatter where it's worn short)
    vec3 tn = (mix(texture2D(nGrass, tp).xyz, vec3(0.5, 0.5, 1.0), max(uSeason.w * 0.85, envFar * 0.85 + (1.0 - envWild) * 0.2)) * envW.x + texture2D(nDirt, tp).xyz * envW.y + texture2D(nCob, tp).xyz * envW.z + texture2D(nSand, tp).xyz * envW.w) * 2.0 - 1.0;
    vec3 wn = texture2D(nWall, envWallUv).xyz * 2.0 - 1.0;
    vec3 N = normalize(vNw);
    // on the ground: across is +x, down the picture is +z (the pictures keep the slope going down them in green)
    vec3 gN = normalize(vec3(tn.x, 0.0, -tn.y) + N * max(0.2, tn.z));
    // on a wall: across (x, or z on an east or west face), and up the wall
    bool ew = abs(N.x) > abs(N.z);
    vec3 T = ew ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0), B = vec3(0.0, 1.0, 0.0);
    vec3 wN = normalize(T * wn.x + B * wn.y + N * max(0.2, wn.z));
    vec3 nW = normalize(mix(gN, wN, envSteep));
    normal = normalize((viewMatrix * vec4(nW, 0.0)).xyz);
}`;
