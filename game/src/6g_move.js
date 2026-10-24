/* ---- 6g_move.js ---- */
/* Moving buildings. Pick a house or a shop at Ginger's, drag its outline somewhere new (green is fine, red says why
   not), and her crew moves it overnight: by morning it's there, the old way in has gone back to grass, and a new path
   runs from the new front door to the nearest path. Anything small in the way (trees, bushes, flowers) is cleared. */
const MOVE_PRICE = 10000;
const MOVE_BIZ = ['shop', 'boutique', 'studio', 'arcade', 'club', 'builder', 'museum', 'restaurant', 'salon', 'displays'];
const ATTACHED = { home: ['mailbox'], club: ['sign_club'] };
const FRONT_SPOTS = { shop: ['shopfront'], boutique: ['boutiquefront'], arcade: ['arcadefront'], studio: ['studiofront'], restaurant: ['restaurantfront'],
    museum: ['museumfront'], builder: ['builderfront'], club: ['clubfront'], salon: ['salonfront'], displays: ['displaysfront'] };
const BLD_NAMES = { home: 'your house', shop: "Fortune's shop", boutique: "Clementine's", studio: 'the pottery studio', arcade: 'the arcade', club: 'Club Wasabi',
    builder: "Ginger's workshop", museum: 'the museum', restaurant: "Mac's", barn: 'the barn', windmill: 'the windmill', salon: 'the salon', displays: "Waffle's shop",
    townhall: 'the Town Hall', postoffice: 'the Post Office', bank: 'the Bank' };
function bldName(id) { return BLD_NAMES[id] || (id.startsWith('h_') && NPC_DEFS[id.slice(2)] ? `${NPC_DEFS[id.slice(2)].name}'s house` : id); }
/* where everything started (world.json), so saved moves can be laid over it */
const W0_ORIG = { buildings: JSON.parse(JSON.stringify(W0.buildings)), props: W0.props.map(p => Object.assign({}, p)), spots: JSON.parse(JSON.stringify(W0.spots)) };
function movedState() { if (!S.buildMoved) S.buildMoved = {}; return S.buildMoved; }
function isCleared(key) { return !!(S && S.cleared && S.cleared[key]); }
/* put every building where the save says it is (and its mailbox / sign / front spot with it) */
function applyBuildingMoves() {
    for (const [id, b] of Object.entries(W0_ORIG.buildings)) { W0.buildings[id].x = b.x; W0.buildings[id].y = b.y; }
    W0.props.forEach((p, i) => { p.x = W0_ORIG.props[i].x; p.y = W0_ORIG.props[i].y; });
    for (const [k, s] of Object.entries(W0_ORIG.spots)) { W0.spots[k].x = s.x; W0.spots[k].y = s.y; }
    const M = (S && S.buildMoved) || {};
    for (const [id, to] of Object.entries(M)) {
        const b = W0.buildings[id], o = W0_ORIG.buildings[id];
        if (!b || !o) continue;
        b.x = to.x; b.y = to.y;
        const dx = to.x - o.x, dy = to.y - o.y;
        for (const kind of ATTACHED[id] || []) W0.props.forEach((p, i) => { if (p.kind === kind) { p.x = W0_ORIG.props[i].x + dx; p.y = W0_ORIG.props[i].y + dy; } });
        for (const sk of FRONT_SPOTS[id] || []) { const s = W0.spots[sk], so = W0_ORIG.spots[sk]; if (s && so) { s.x = so.x + dx; s.y = so.y + dy; } }
    }
    benches.c = null;
    if (typeof applyDecoMoves === 'function') applyDecoMoves();
}

/* ---------------------------------------------------------------- is this a good spot? */
function thingsMap(a, movingId) {
    const m = new Map();
    const put = (x, y, e, soft, what) => { const k = x + ',' + y; if (!m.has(k)) m.set(k, []); m.get(k).push({ e, soft, what }); };
    const attached = ATTACHED[movingId] || [];
    for (const e of a.ents) {
        const k = e.kind;
        if (k === 'building' || e.holiday || e.npc || k === 'movemark') continue;
        if (k === 'tree' || k === 'fruittree' || k === 'young' || k === 'stump') { if (e.tx != null) put(e.tx, e.ty, e, true, k === 'stump' ? 'stump' : 'tree'); continue; }
        if (k === 'hole' || k === 'glow' || k === 'clamspot' || k === 'gflower') { if (e.tx != null) put(e.tx, e.ty, e, true, 'flowers'); continue; }
        if (k === 'item') { put(Math.floor(e.x / TILE), Math.floor((e.y - 2) / TILE), e, true, e.wildFlower ? 'flowers' : 'stuff'); continue; }
        if (k === 'bigtree') { const t = W0.bigTree; for (let yy = 0; yy < 2; yy++) for (let xx = 0; xx < 2; xx++) put(t.x + xx, t.y + yy, e, false, 'big tree'); continue; }
        if (k === 'plot') { put(e.tx, e.ty, e, false, 'garden plot'); continue; }
        if (k === 'fence') { put(Math.floor(e.x / TILE), Math.floor((e.y - 2) / TILE), e, false, 'fence'); continue; }
        if (k === 'cart') { for (const [x, y] of e.tiles || []) put(x, y, e, false, 'noodle cart'); continue; }
        if (e.px != null) {
            if (attached.includes(k)) continue;
            const w = PROP_SIZE[k] || 1, soft = ['rock', 'bush', 'driftwood'].includes(k);
            const what = e.what || { lamp: 'lamp post', bench: 'bench', board: 'island board', mailbox: 'mailbox', windmill: 'windmill', well: 'well', hay: 'hay bale', crate: 'crate',
                scarecrow: 'scarecrow', flowerbed: 'flower bed', boulder: 'boulder', telescope: 'telescope' }[k] || k.replace(/_/g, ' ');
            for (let i = 0; i < w; i++) { put(e.px + i, e.py, e, soft, what); if (k === 'windmill') put(e.px + i, e.py + 1, e, false, what); }
        }
    }
    return m;
}
function rectsTouch(a, b, pad) { return a.x - pad < b.x + b.w && b.x - pad < a.x + a.w && a.y - pad < b.y + b.h && b.y - pad < a.y + a.h; }
function checkMove(id, x, y, things) {
    const a = G.areas.island, b = W0.buildings[id], w = b.w, h = b.h;
    const foot = [];
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) foot.push([xx, yy]);
    const front = [[x + b.door, y + h], [x + b.door, y + h + 1]];
    const all = foot.concat(front);
    if (x === b.x && y === b.y) return { ok: false, why: `That's where ${bldName(id)} is now.`, same: true };
    for (const [tx, ty] of all) {
        if (tx < 1 || ty < 1 || tx >= a.w - 1 || ty >= a.h - 1) return { ok: false, why: 'Too close to the edge of the island.' };
        const c = W0.grid[ty][tx];
        if ('~roh'.includes(c) || a.waterAt(tx, ty)) return { ok: false, why: "That's water! Ginger's crew can't swim that far." };
        if (c === 'F') return { ok: false, why: "That's a farm field. The pumpkins were there first." };
        if (W0.coll[ty][tx] === '1') return { ok: false, why: 'Too close to a cliff.' };
        if (RAMPS.has(tx + ',' + ty)) return { ok: false, why: "That's a slope. Buildings like flat ground." };
    }
    const lvl = heightAt(x, y);
    if (all.some(([tx, ty]) => heightAt(tx, ty) !== lvl)) return { ok: false, why: "The ground isn't flat there." };
    for (const [tx, ty] of foot) {
        const c = W0.grid[ty][tx];
        if (c === 'c') return { ok: false, why: "That's the plaza. Fortune would never allow it." };
        if (c === 'w') return { ok: false, why: "That's the pier. Or a bridge. Either way, no." };
        if (pathAt(tx, ty)) return { ok: false, why: "That's on a path. Buildings can't sit on paths." };
    }
    const [px0, py0, px1, py1] = W0.plaza;
    if (rectsTouch({ x, y, w, h: h + 1 }, { x: px0, y: py0, w: px1 - px0 + 1, h: py1 - py0 + 1 }, 1)) return { ok: false, why: 'Too close to the plaza.' };
    const me = { x, y, w, h: h + 2 };
    for (const [oid, ob] of Object.entries(W0.buildings)) {
        if (oid === id) continue;
        const pend = (S.buildMoves || []).find(m => m.id === oid);
        const r = pend ? { x: pend.x, y: pend.y, w: ob.w, h: ob.h + 2 } : { x: ob.x, y: ob.y, w: ob.w, h: ob.h + 2 };
        if (rectsTouch(me, r, 1)) return { ok: false, why: `Too close to ${bldName(oid)}.` };
    }
    const wm = W0.windmill;
    if (wm && rectsTouch(me, { x: wm.x, y: wm.y, w: wm.w, h: wm.h + 2 }, 1)) return { ok: false, why: 'Too close to the windmill.' };
    things = things || thingsMap(a, id);
    const clear = [];
    for (const [tx, ty] of all) {
        for (const t of things.get(tx + ',' + ty) || []) {
            if (!t.soft) return { ok: false, why: `There's ${aOrAn(t.what)} ${t.what} in the way.` };
            clear.push(t);
        }
    }
    // the whole strip in front of the building is cleared too (a tree right by the door would hide it)
    for (let tx = x; tx < x + w; tx++) for (const t of things.get(tx + ',' + (y + h)) || []) if (t.soft && !clear.includes(t)) clear.push(t);
    // can everybody still get everywhere?
    const blocked = a.blocked.slice();
    for (let yy = b.y; yy < b.y + b.h; yy++) for (let xx = b.x; xx < b.x + b.w; xx++) blocked[yy * a.w + xx] = 0;
    for (const t of clear) { const e = t.e; if (e.tx != null) blocked[e.ty * a.w + e.tx] = 0; else if (e.px != null) blocked[e.py * a.w + e.px] = 0; }
    for (const [tx, ty] of foot) blocked[ty * a.w + tx] = 1;
    for (const [tx, ty] of front) if (!things.get(tx + ',' + ty)) blocked[ty * a.w + tx] = W0.coll[ty][tx] === '1' ? 1 : 0;
    const seen = new Uint8Array(a.w * a.h), q = [];
    const s0 = W0.spots.plaza;
    seen[s0.y * a.w + s0.x] = 1; q.push(s0.y * a.w + s0.x);
    while (q.length) {
        const i = q.pop(), cx = i % a.w, cy = (i / a.w) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = cx + dx, ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= a.w || ny >= a.h) continue;
            const j = ny * a.w + nx;
            if (seen[j] || blocked[j]) continue;
            seen[j] = 1; q.push(j);
        }
    }
    const at = (tx, ty) => seen[ty * a.w + tx] === 1;
    if (!at(front[0][0], front[0][1])) return { ok: false, why: "Nobody could get to the front door from there." };
    for (const oid of Object.keys(W0.buildings).concat(['windmill'])) {
        if (oid === id) continue;
        const [dx, dy] = doorTileOf(oid);
        if (!at(dx, dy)) return { ok: false, why: `That would block the way to ${bldName(oid)}.` };
    }
    const trees = clear.filter(t => t.what === 'tree').length, stuff = clear.filter(t => t.what !== 'tree').length;
    const note = trees || stuff ? `The crew will clear ${[trees ? `${trees} ${plural(trees, 'tree')}` : '', stuff ? 'some little things' : ''].filter(Boolean).join(' and ')}.` : '';
    return { ok: true, why: `Looks good!${note ? ' ' + note : ''}`, clear };
}

/* ---------------------------------------------------------------- dragging the outline around */
const Mover = {
    on: false, id: null, x: 0, y: 0, res: null, look: false, chk: null, things: null,
    run(id) { return new Promise(res => this.start(id, res)); },
    start(id, res) {
        if (visitorStop('build')) { res(null); return; }
        const b = W0.buildings[id], a = G.areas.island;
        this.on = true; this.id = id; this.res = res; this.look = false;
        this.things = thingsMap(a, id);
        // start a little way off, somewhere it might fit
        this.x = b.x; this.y = b.y;
        this.chk = checkMove(id, this.x, this.y, this.things);
        G.keys = {};
        this.center();
        this.render();
    },
    center() { const b = W0.buildings[this.id]; G.camTarget = [(this.x + b.w / 2) * TILE, (this.y + b.h / 2) * TILE]; },
    finish(v) {
        if (!this.on) return;
        this.on = false;
        $('#panel').hidden = true; $('#panel').innerHTML = ''; $('#panel').classList.remove('decor');
        UI.modal = false;
        G.camTarget = null;
        const r = this.res; this.res = null;
        if (r) r(v);
    },
    cancel(quiet) { if (!quiet) Sfx.ui('close'); this.finish(null); },
    setAt(x, y) {
        if (x === this.x && y === this.y) return;
        this.x = x; this.y = y;
        this.chk = checkMove(this.id, x, y, this.things);
        this.status();
    },
    render() {
        const panel = $('#panel');
        panel.hidden = false; panel.className = 'decor'; panel.innerHTML = '';
        UI.modal = true;
        const head = el('div', 'phead');
        head.appendChild(el('h2', null, `Moving ${bldName(this.id)}`));
        head.appendChild(btn('Cancel', 'alt', () => this.cancel()));
        panel.appendChild(head);
        const body = el('div', 'pbody');
        this.msg = el('p', 'movemsg');
        body.appendChild(this.msg);
        const row = el('div', 'st-row');
        this.go = chip(`Move it here (${fmtNum(MOVE_PRICE)})`, () => { if (this.chk && this.chk.ok) { Sfx.ui('ok'); this.finish({ x: this.x, y: this.y }); } else Sfx.ui('nope'); }, 'go');
        row.appendChild(this.go);
        row.appendChild(chip('Look around', b => { this.look = !this.look; b.classList.toggle('on', this.look); this.status(); }, this.look ? 'on' : ''));
        body.appendChild(row);
        panel.appendChild(body);
        this.status();
    },
    status() {
        if (!this.msg) return;
        const c = this.chk;
        this.msg.textContent = this.look ? 'Drag to look around. Tap "Look around" again to go back to placing.'
            : c && c.ok ? c.why : c ? c.why + (c.same ? (G.touchUsed ? ' Tap somewhere new.' : ' Click somewhere new, or use the arrow keys.') : '') : '';
        this.msg.classList.toggle('bad', !!(c && !c.ok && !this.look));
        if (this.go) this.go.disabled = !(c && c.ok);
    },
    tileFor(wx, wy) { const b = W0.buildings[this.id]; return [Math.floor(wx / TILE) - Math.floor(b.w / 2), Math.floor(wy / TILE) - Math.floor(b.h / 2)]; },
    down(wx, wy, ev) {
        this.dragging = true;
        this.drag0 = ev ? [ev.clientX, ev.clientY, G.cam.x, G.cam.y] : null;
        if (this.look) return;
        this.setAt(...this.tileFor(wx, wy));
    },
    move(wx, wy, ev) {
        if (!this.dragging) return;
        if (this.look) {
            if (!ev || !this.drag0) return;
            const k = G.view.cssScale || 1;
            G.camTarget = [this.drag0[2] - (ev.clientX - this.drag0[0]) / k + G.view.w / 2, this.drag0[3] - (ev.clientY - this.drag0[1]) / k + G.view.h / 2];
            return;
        }
        this.setAt(...this.tileFor(wx, wy));
    },
    up() { this.dragging = false; this.drag0 = null; },
    key(code) {
        if (code === 'Escape') { this.cancel(); return; }
        if (isA(code)) { if (this.chk && this.chk.ok) this.finish({ x: this.x, y: this.y }); else Sfx.ui('nope'); return; }
        const d = { ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0], ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1] }[code];
        if (!d) return;
        this.setAt(this.x + d[0], this.y + d[1]);
        this.center();
    },
    draw(ctx) {
        if (!this.on) return;
        const b = W0.buildings[this.id], x = this.x * TILE, y = this.y * TILE, w = b.w * TILE, h = b.h * TILE;
        const ok = this.chk && this.chk.ok;
        const e = G.areas.island.ents.find(q => q.kind === 'building' && q.id === this.id);
        if (e) spr(ctx, e.frame, x + w / 2, y + h, false, 0.55);
        ctx.fillStyle = ok ? 'rgba(140,193,82,0.28)' : 'rgba(224,64,90,0.3)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = ok ? '#8cc152' : '#e0405a'; ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
        // the front door and the step outside it
        const dx = (this.x + b.door) * TILE;
        ctx.fillStyle = ok ? 'rgba(255,207,87,0.55)' : 'rgba(224,64,90,0.45)';
        ctx.fillRect(dx + 2, y + h + 2, TILE - 4, TILE - 4);
        if (this.chk && this.chk.clear) for (const t of this.chk.clear) {
            const tx = t.e.tx != null ? t.e.tx : t.e.px != null ? t.e.px : Math.floor(t.e.x / TILE), ty = t.e.ty != null ? t.e.ty : t.e.py != null ? t.e.py : Math.floor((t.e.y - 2) / TILE);
            ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(tx * TILE + 4, ty * TILE + 4); ctx.lineTo(tx * TILE + 12, ty * TILE + 12); ctx.moveTo(tx * TILE + 12, ty * TILE + 4); ctx.lineTo(tx * TILE + 4, ty * TILE + 12); ctx.stroke();
        }
    },
};

/* ---------------------------------------------------------------- overnight */
function pendingMove() { return (S.buildMoves || [])[0] || null; }
function scheduleMove(id, x, y) {
    S.buildMoves = [{ id, x, y, day: Clock.dayNum() }];
    addMarker(G.areas.island);
    Save.touch();
}
function cancelMove() { S.buildMoves = []; const a = G.areas.island; if (a) a.ents = a.ents.filter(e => e.kind !== 'movemark'); Save.touch(); }
/* Ginger's stakes and string where the building is going */
function addMarker(a) {
    if (!a) return;
    a.ents = a.ents.filter(e => e.kind !== 'movemark');
    const m = pendingMove();
    if (!m || !W0.buildings[m.id]) return;
    const b = W0.buildings[m.id], x0 = m.x * TILE + 2, y0 = m.y * TILE + 4, x1 = (m.x + b.w) * TILE - 2, y1 = (m.y + b.h) * TILE - 2;
    const e = a.add({ kind: 'movemark', layer: 0, x: (x0 + x1) / 2, y: y1 });
    e.draw = ctx => {
        ctx.fillStyle = '#e8c890';
        for (let x = x0; x < x1; x += 4) { ctx.fillRect(x, y0, 2, 1); ctx.fillRect(x, y1, 2, 1); }
        for (let y = y0; y < y1; y += 4) { ctx.fillRect(x0, y, 1, 2); ctx.fillRect(x1, y, 1, 2); }
        for (const [sx, sy] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) {
            ctx.fillStyle = '#8a5a33'; ctx.fillRect(sx - 1, sy - 6, 2, 7);
            ctx.fillStyle = (G.t >> 4) % 2 ? '#f7962d' : '#ff8a4a'; ctx.fillRect(sx + 1, sy - 6, 4, 3);
        }
    };
    e.hit = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    e.interact = () => UI.say(null, `Ginger's stakes and string. ${cap(bldName(m.id))} is moving here tonight. By morning it'll be here.`);
}
/* clear the little things in the new spot: trees are replanted somewhere quiet (they're just gone), flowers too */
function clearForMove(list) {
    if (!S.cleared) S.cleared = {};
    const F = forest();
    for (const t of list) {
        const e = t.e;
        if (e.kind === 'item') {
            if (e.wildFlower && e.flowerIdx != null) S.cleared['wf' + e.flowerIdx] = 1;
            else if (e.lostThing) { /* it stays lost: the room builder will find it a new place */ }
            else if (e.id && ITEMS[e.id]) { toStorage(e.id, 1); if (e.dropRef) { const i = S.drops.indexOf(e.dropRef); if (i >= 0) S.drops.splice(i, 1); } }
            continue;
        }
        if (e.planted) { F.planted = F.planted.filter(q => q !== e.planted); continue; }
        if (e.kind === 'stump') { if (F.chopped[e.id]) F.chopped[e.id].stump = false; continue; }
        if (e.kind === 'hole') { F.holes = F.holes.filter(q => q !== e.hole); continue; }
        if (e.kind === 'gflower') { flowerState().planted = flowerState().planted.filter(q => q !== e.pl); continue; }
        if (e.id && /^(dt|ft|pa)/.test(e.id)) { S.cleared[e.id] = 1; continue; }
        if (e.px != null) { const i = W0.props.findIndex(p => p.x === e.px && p.y === e.py && p.kind === e.kind); if (i >= 0) S.cleared['pr' + i] = 1; }
    }
}
/* wild trees, stumps, rocks, bushes and driftwood: never anything Sarah planted or dropped */
function wildClutter(e) {
    if (e.planted || e.kind === 'item') return false;
    if (e.kind === 'stump') return true;
    if (e.id && /^(dt|ft|pa)/.test(e.id)) return true;
    return e.px != null && ['rock', 'bush', 'driftwood'].includes(e.kind);
}
/* the shortest way from the new door to any path, laid in dirt */
function layPath(id) {
    const a = G.areas.island, [fx, fy] = doorTileOf(id);
    if (isPathish(fx, fy)) return [];
    const W = a.w, from = new Int32Array(W * a.h).fill(-1), start = fy * W + fx;
    from[start] = start;
    const q = [start];
    let hit = -1;
    for (let qi = 0; qi < q.length && hit < 0; qi++) {
        const i = q[qi], cx = i % W, cy = (i / W) | 0;
        for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
            const nx = cx + dx, ny = cy + dy;
            if (nx < 1 || ny < 1 || nx >= W - 1 || ny >= a.h - 1) continue;
            const j = ny * W + nx;
            if (from[j] >= 0) continue;
            if (isPathish(nx, ny) && heightAt(nx, ny) === heightAt(cx, cy)) { from[j] = i; hit = j; break; }
            if (a.blockedAt(nx, ny) || RAMPS.has(nx + ',' + ny) || a.waterAt(nx, ny)) continue;
            from[j] = i; q.push(j);
        }
    }
    const out = [];
    if (hit < 0) { setPath(fx, fy, 'dirt'); return [[fx, fy]]; }
    for (let i = from[hit]; ; i = from[i]) { const x = i % W, y = (i / W) | 0; out.push([x, y]); if (i === start) break; }
    for (const [x, y] of out) setPath(x, y, 'dirt');
    return out;
}
function applyMove(m) {
    const id = m.id, P = pathsState();
    if (!W0.buildings[id]) return;
    const a = G.areas.island, b = W0.buildings[id], things = thingsMap(a, id), soft = [];
    for (let y = m.y; y < m.y + b.h + 2; y++) for (let x = m.x; x < m.x + b.w; x++) {
        if (y === m.y + b.h + 1 && x !== m.x + b.door) continue;
        for (const t of things.get(x + ',' + y) || []) if (t.soft) soft.push(t);
    }
    clearForMove(soft);
    // take up the old way in
    const gone = [];
    if (P.auto[id]) { for (const [x, y] of P.auto[id]) if (overlayAt(x, y) === 'dirt') { const c = W0.grid[y][x]; setPath(x, y, c === 'p' || c === 'd' || c === 'b' ? 'grass' : null); gone.push([x, y]); } }
    else for (const [x, y] of (W0.stubs && W0.stubs[id]) || []) if (!overlayAt(x, y)) { setPath(x, y, 'grass'); gone.push([x, y]); }
    // the old road's soft edges spill onto the grass beside it: tidy those up too, unless another path is right there
    for (const [x, y] of gone) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (overlayAt(nx, ny) || isPathish(nx, ny) || !'gs'.includes(W0.grid[ny] && W0.grid[ny][nx])) continue;
        if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ox, oy]) => isPathish(nx + ox, ny + oy))) continue;
        setPath(nx, ny, 'grass');
    }
    movedState()[id] = { x: m.x, y: m.y };
    applyBuildingMoves();
    G.areas.island = buildIsland();
    restoreDrops(G.areas.island); spawnShells(G.areas.island); decorateIsland(G.areas.island);
    if (G.area && G.area.id === 'island') {
        G.area = G.areas.island;
        const p = G.player, tx = Math.floor(p.x / TILE), ty = Math.floor((p.y - 2) / TILE);
        if (G.area.blockedAt(tx, ty)) { const f = G.area.nearestFree(tx, ty, 8); if (f) { p.x = (f[0] + 0.5) * TILE; p.y = (f[1] + 0.6) * TILE; } }
    }
    P.auto[id] = layPath(id);
    // nothing crowding the new path: trees, rocks and bushes right beside it go too
    const isl = G.areas.island, near = thingsMap(isl, id), side = [];
    for (const [x, y] of P.auto[id]) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
        for (const t of near.get((x + dx) + ',' + (y + dy)) || []) if (wildClutter(t.e) && !side.includes(t)) side.push(t);
    if (side.length) {
        clearForMove(side);
        G.areas.island = buildIsland();
        restoreDrops(G.areas.island); spawnShells(G.areas.island); decorateIsland(G.areas.island);
        if (G.area && G.area.id === 'island') G.area = G.areas.island;
    }
    // a lost thing that ended up under the building turns up right next to it instead
    const lc = S.lost && S.lost.cur;
    if (lc && !lc.found && lc.area === 'island' && G.areas.island.blockedAt(lc.x, lc.y)) {
        const f = G.areas.island.nearestFree(lc.x, lc.y, 6);
        if (f) { lc.x = f[0]; lc.y = f[1]; placeLostEnt(); }
    }
    if (id.startsWith('h_')) { const r = rel(id.slice(2)); r.houseNews = { day: Clock.dayNum(), moved: true }; }
    if (id === 'home') S.flags.homeMoveDay = Clock.dayNum();
    S.stats.moved = (S.stats.moved || 0) + 1;
    Plans.reset();
    Save.touch();
}
/* a new morning: the crew worked all night */
function movesDaily(day) {
    const list = (S.buildMoves || []).filter(m => m.day < day);
    if (!list.length) return;
    S.buildMoves = (S.buildMoves || []).filter(m => m.day >= day);
    for (const m of list) {
        applyMove(m);
        sendMail({ from: 'ginger', subject: `${cap(bldName(m.id))} has moved!`, body: `Hi {name}!\nThe crew worked all night. ${cap(bldName(m.id))} is in its new spot, the old path is grass again, and there's a fresh path to the front door.\nMeasured twice. Moved once.\n- Ginger` });
        setTimeout(() => UI.toast(`Ginger's crew moved ${bldName(m.id)} overnight!`, 'f_toolbox'), 1500);
    }
}

/* ---------------------------------------------------------------- at Ginger's */
function movableIds() {
    return ['home'].concat(MOVE_BIZ, HOUSE_IDS.filter(h => h !== 'home' && W0.buildings[h] && NPC_DEFS[h.slice(2)] && rel(h.slice(2)).met));
}
function pickBuilding() {
    return new Promise(res => {
        let done = false;
        const finish = v => { if (!done) { done = true; res(v); } };
        const P = UI.open({ title: 'Move which building?', onClose: () => finish(null) });
        P.body.appendChild(el('p', 'muted', `${fmtNum(MOVE_PRICE)} sand dollars. The crew moves it overnight; it's in its new spot in the morning.`));
        const list = el('div', 'list');
        for (const id of movableIds()) {
            const r = el('button', 'row');
            r.type = 'button';
            const e = G.areas.island.ents.find(q => q.kind === 'building' && q.id === id);
            r.appendChild(iconCanvas(e ? e.frame : 'house_sarah', 40));
            const t = el('div', 't');
            t.appendChild(el('b', null, cap(bldName(id))));
            t.appendChild(el('span', null, S.buildMoved && S.buildMoved[id] ? 'Moved before' : 'In its original spot'));
            r.appendChild(t);
            r.addEventListener('click', () => { finish(id); UI.close(true); });
            list.appendChild(r);
        }
        P.body.appendChild(list);
    });
}
async function moveBuildingFlow() {
    const pend = pendingMove();
    if (pend) {
        const k = await UI.ask(gingerVoice(), `We're already moving ${bldName(pend.id)} tonight! One job at a time. Want to call it off? (Full refund.)`, ['Keep the plan', 'Call it off']);
        if (k === 1) { cancelMove(); addMoney(MOVE_PRICE, true); await UI.say(gingerVoice(), 'Called off! Here are your sand dollars back. The stakes are coming down.'); }
        return false;
    }
    UI.hideDialog();
    const id = await pickBuilding();
    if (!id) return false;
    if (S.money < MOVE_PRICE) { await UI.say(gingerVoice(), `Moving a whole building is ${fmtNum(MOVE_PRICE)}. You're a little short. Come back after some fishing!`); return false; }
    await UI.say(gingerVoice(), [`Let's find ${bldName(id)} a new spot! I'll show you the island.`, 'Drag the outline around. Green means we can build there. Red means no, and I\'ll say why.']);
    const from = G.area.id;
    const back = G.area.id !== 'island' ? { area: G.area.id, x: G.player.x, y: G.player.y } : null;
    const b = W0.buildings[id];
    await fadeTo(async () => {
        const [fx, fy] = G.areas.island.nearestFree(b.x + b.door, b.y + b.h + 1, 6) || doorTileOf(id);
        setArea('island', (fx + 0.5) * TILE, (fy + 0.6) * TILE, 'down');
        G.player.hidden = true;
    });
    if (from !== 'island') Bus.emit('leave', from);
    const spot = await Mover.run(id);
    let ok = false;
    if (spot) {
        addMoney(-MOVE_PRICE, true);
        scheduleMove(id, spot.x, spot.y);
        Sfx.play('fanfare');
        ok = true;
    }
    await fadeTo(async () => {
        G.player.hidden = false;
        if (back) { setArea(back.area, back.x, back.y, 'up'); }
    });
    if (back) Bus.emit('enter', back.area);
    if (ok) await UI.say(back ? gingerVoice() : null, back ? `Stakes are in! The crew moves ${bldName(id)} tonight. By morning it's in the new spot, with a fresh path to the door.`
        : `Ginger's crew put stakes in the ground. ${cap(bldName(id))} moves there tonight.`);
    return ok;
}

