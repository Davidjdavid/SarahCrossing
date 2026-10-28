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
const LIKE_ACTS = { stars: 'Stargazing', snack: 'An ice cream', phone: 'On their phone', book: 'Reading', ground: 'Sitting on the grass', paint: 'Painting',
    cup: 'A mug of cocoa', fish: 'Fishing', bench: 'Sitting on a bench', scope: 'The telescope' };
const LIKE_LEVELS = [['Never', 'never'], ['Now and then', 'a little'], ['Likes', 'likes'], ['Loves', 'loves']];
/* a design's parts the server takes (server/design.mjs) */
const DESIGN_PARTS = ['v', 'base', 'props', 'added', 'rooms', 'npcs', 'note'];
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
        WORLD0.forEach((p0, i) => { for (const p of [W0.props[i], W0_ORIG.props[i]]) { p.x = p0.x; p.y = p0.y; if (p0.rot) p.rot = p0.rot; else delete p.rot; delete p.gone; delete p.lift; } });
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
        fenceTiles.c = null; benches.c = null;
        this.ver++;
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
    /* what each neighbor likes, 0 never .. 3 loves (null: as they are) */
    like(id, part, k) { const N = this.d && this.d.npcs && this.d.npcs[id], v = N && N[part] && N[part][k]; return Number.isInteger(v) && v >= 0 && v <= 3 ? v : null; },
    likeWeight(id, k, def) { const v = this.like(id, 'acts', k); return v == null ? def : [0, 1, 3, 6][v]; },
    likeChance(id, k, def) { const v = this.like(id, 'acts', k); return v == null ? def : [0, 0.25, 0.6, 0.9][v]; },

    /* ------------------------------------------------------------ changing it */
    snap() { this.undo.push(JSON.stringify(this.d)); if (this.undo.length > 60) this.undo.shift(); },
    changed(where) {
        this.dirty = true;
        if (where === 'island' || where == null) { this.apply(); applyBuildingMoves(); rebuildIsland(); }
        if (where === 'likes' && typeof Plans !== 'undefined') Plans.reset();
        Env.dirty = true;
    },
    back() {
        if (!this.undo.length) return;
        this.d = JSON.parse(this.undo.pop());
        this.dirty = true;
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
        const tip = E.look ? 'Drag to look around the island.'
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
            if (this.undo.length) row.appendChild(chip('Undo', () => { this.back(); E.render(); }));
            row.appendChild(chip(this.dirty ? 'Save the design' : 'Saved', () => this.save().then(() => E.render()), this.dirty ? 'go' : ''));
            row.appendChild(chip("Neighbors' likes", () => { E.close(); this.likesPanel(); }));
        }
        row.appendChild(chip('Look around', () => { E.look = !E.look; E.msg = ''; E.render(); }, E.look ? 'on' : ''));
        body.appendChild(row);
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
        for (const id of Object.keys(FURN)) if (!FURN[id].color && ['floor', 'rug', 'top', 'wall'].includes(FURN[id].kind)) out[id] = 1;
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
        P.body.appendChild(el('p', 'muted', `Tap one to change it: as they are → loves → likes → now and then → never. "As they are" leaves ${NPC_DEFS[who].name} to the game.`));
        const section = (title, part, keys, label, def) => {
            P.body.appendChild(el('h3', null, title));
            const g = el('div', 'st-row');
            for (const k of keys) {
                const v = this.like(who, part, k), b = chip(`${label(k)}: ${v == null ? (def(k) || 'as they are') : LIKE_LEVELS[v][1]}`, () => {
                    const d = this.work(), N = d.npcs[who] || (d.npcs[who] = {}), L = N[part] || (N[part] = {});
                    this.snap();
                    const next = v == null ? 3 : v === 0 ? null : v - 1;
                    if (next == null) delete L[k]; else L[k] = next;
                    if (!Object.keys(L).length) delete N[part];
                    if (!Object.keys(N).length) delete d.npcs[who];
                    this.changed('likes');
                    this.likesPanel(who);
                }, v == null ? '' : v >= 2 ? 'go' : v === 0 ? 'off' : 'on');
                g.appendChild(b);
            }
            P.body.appendChild(g);
        };
        section('What they like doing with nothing to do', 'acts', Object.keys(LIKE_ACTS), k => LIKE_ACTS[k], k => IDLE_LIKES[who] === k ? 'their favorite' : '');
        section('Where they like to be in their free time', 'spots', Object.keys(RES_SPOTS).filter(k => W0.spots[k]), k => landmarkName(k, RES_SPOTS[k]), k => (NPC_DEFS[who].fav || {})[k] ? 'a favorite' : '');
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
    const L = Design.d && Design.d.npcs && Design.d.npcs[id] && Design.d.npcs[id].spots;
    if (!L) return;
    for (const [k, v] of Object.entries(L)) {
        if (!W0.spots[k] || !Number.isInteger(v)) continue;
        if (v === 0) delete wts[k]; else wts[k] = (wts[k] || 0.5) * [0, 0.5, 2, 4][v] + [0, 0, 1, 3][v];
    }
}
