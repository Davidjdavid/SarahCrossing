/* ---- 6j_displays.js ---- */
/* Waffle's Island Displays (lamps, benches, hedges, signs and all sorts of outdoor decor) and Island edit mode:
   from the phone, pick up the island's lamps, benches, signs and the like (or anything bought from Waffle) and set
   them down somewhere else. Nothing can go on a path or in front of a door, and nothing can cut off a door or one
   of the neighbors' favorite places. */
const DISPLAYS = {
    dp_lamp: { name: 'Street lamp', price: 1800, w: 1, frame: 'lamp', light: 44 },
    dp_lantern: { name: 'Stone lantern', price: 2200, w: 1, frame: 'd_lantern', light: 34 },
    dp_torch: { name: 'Tiki torch', price: 900, w: 1, frame: 'd_torch', torch: true },
    dp_bench: { name: 'Park bench', price: 2400, w: 2, frame: 'bench', seat: true },
    dp_stonebench: { name: 'Stone bench', price: 2600, w: 2, frame: 'd_stonebench', seat: true },
    dp_log: { name: 'Log bench', price: 1200, w: 2, frame: 'log', seat: true },
    dp_hedge: { name: 'Square hedge', price: 800, w: 1, frame: 'd_hedge' },
    dp_hedge_round: { name: 'Round hedge', price: 800, w: 1, frame: 'd_hedge_round' },
    dp_hedge_long: { name: 'Long hedge', price: 1400, w: 2, frame: 'd_hedge_long' },
    dp_topiary: { name: 'Bunny topiary', price: 3200, w: 1, frame: 'd_topiary' },
    dp_planter: { name: 'Flower planter', price: 1500, w: 2, frame: 'flowerbed' },
    dp_sign: { name: 'Wooden sign', price: 600, w: 1, frame: 'd_sign', sign: true },
    dp_fountain: { name: 'Fountain', price: 9800, w: 2, rows: 1, frame: 'd_fountain', fountain: true },
    dp_birdbath: { name: 'Bird bath', price: 1600, w: 1, frame: 'd_birdbath' },
    dp_gnome: { name: 'Garden gnome', price: 700, w: 1, frame: 'd_gnome' },
    dp_frog: { name: 'Frog statue', price: 1300, w: 1, frame: 'd_frog' },
    dp_umbrella: { name: 'Beach umbrella', price: 1100, w: 1, frame: 'd_umbrella' },
    dp_lounger: { name: 'Beach lounger', price: 1500, w: 2, frame: 'd_lounger' },
    dp_fence: { name: 'Picket fence', price: 300, w: 1, frame: 'd_fence' },
    dp_flag: { name: 'Island flag', price: 1900, w: 1, frame: 'd_flag', flag: true },
    dp_picnic: { name: 'Picnic table', price: 3000, w: 3, frame: 'picnic' },
    dp_flamingo: { name: 'Lawn flamingo', price: 500, w: 1, frame: 'd_flamingo' },
};
for (const [id, d] of Object.entries(DISPLAYS)) ITEMS[id] = { name: d.name, type: 'display', price: d.price, icon: d.frame };
/* the island's own things that can be moved, and what they turn into if Sarah puts them away */
const MOVABLE_PROPS = { lamp: 'dp_lamp', bench: 'dp_bench', flowerbed: 'dp_planter', board: null, sign_island: null, sign_club: null, sign_farm: null,
    sign_camp: null, sign_bonfire: null, well: null, hay: null, crate: null, scarecrow: null };
function deco() { if (!S.deco) S.deco = { moved: {}, gone: {}, placed: [] }; return S.deco; }
/* (put away by Sarah in Island edit, or taken off the island in the designer: 6zza_designer.js) */
function propGone(i) { return !!((S && S.deco && S.deco.gone && S.deco.gone[i]) || (W0.props[i] && (W0.props[i].gone || W0.props[i].lift))); }
/* the save's moves for the island's own things (after the buildings: a sign that moved with the club can move again) */
function applyDecoMoves() {
    const D = S && S.deco;
    // ([x, y] or [x, y, turn]: Sarah can turn what she moves, 29 October)
    if (D && D.moved) for (const [i, xy] of Object.entries(D.moved)) { const p = W0.props[i]; if (p) { p.x = xy[0]; p.y = xy[1]; if (xy.length > 2) { if (xy[2] & 3) p.rot = xy[2] & 3; else delete p.rot; } } }
    benches.c = null;
}
function displayRows(d) { return d.rows || 1; }
/* what a piece set down on the island is: one of Waffle's (DISPLAYS), one of those in another color (its own name and
   picture), or anything that stands on the floor indoors (David, 28 October: "a paint easel outside, a park bench in my
   house"), which keeps its size, its light and, if it's a seat, its seat */
function dispDef(id) {
    if (DISPLAYS[id]) return DISPLAYS[id];
    const f = FURN[id];
    if (!f || f.kind !== 'floor') return null;
    const b = f.base && DISPLAYS[f.base];
    if (b) return Object.assign({}, b, { name: f.name, frame: f.frame || b.frame });
    const fb = f.base ? FURN[f.base] : f, seat = /chair|stool|sofa|couch|bench|seat|beanbag|throne/.test(fb.id);
    return { name: f.name, price: f.price, w: f.w, rows: f.h || 1, frame: f.frame || 'f_' + id, light: f.light, seat, furn: true };
}
function addDisplay(a, p, j) {
    const d = dispDef(p.id);
    if (!d) return null;
    // (one the designer turned a quarter: its width and depth swap)
    const odd = p.rot & 1, w = odd ? displayRows(d) : d.w, rows = odd ? d.w : displayRows(d);
    for (let k = 0; k < w; k++) for (let r = 0; r < rows; r++) a.block(p.x + k, p.y + r);
    const e = a.add({ kind: 'display', disp: p.id, deco: j, frame: d.frame, x: (p.x + w / 2) * TILE, y: (p.y + rows) * TILE - 2, px: p.x, py: p.y, what: d.name.toLowerCase() });
    e.hit = { x: p.x * TILE, y: p.y * TILE - 16, w: w * TILE, h: rows * TILE + 16 };
    if (p.rot) e.rot = p.rot & 3;
    if (d.light) e.light = { r: d.light, y: -24, c: d.fire ? 'fire' : undefined };
    // (a street lamp lights the way a street lamp does: R3.updateLight)
    if (d.lamp) e.lamp = true;
    if (d.seat) e.interact = () => sitOnBench(e);
    else if (d.sign) e.interact = () => UI.say('sign', p.text ? `"${p.text}"` : 'A blank wooden sign. (In Island edit, pick it up to write something on it.)');
    if (d.torch) e.draw = ctx => { spr(ctx, d.frame, e.x, e.y); const lit = hourIn(Clock.hourF(), 18, 29) && G.weather !== 'rain'; if (lit) drawFlames(ctx, e.x, e.y - 22, false); e.light = lit ? { r: 30, y: -22, c: 'fire' } : null; };
    if (d.fountain) e.draw = ctx => drawFountain(ctx, e);
    if (d.flag) e.draw = ctx => { spr(ctx, d.frame, e.x, e.y); };
    return e;
}
function drawFountain(ctx, e) {
    spr(ctx, 'd_fountain', e.x, e.y);
    const t = G.t;
    for (let i = 0; i < 6; i++) {
        const ph = (t * 0.9 + i * 11) % 26, k = ph / 26;
        const x = e.x + Math.sin(i * 1.7) * 6 * k, y = e.y - 27 + ph * ph * 0.04 - ph * 0.3;
        ctx.fillStyle = `rgba(210,240,255,${0.9 - k * 0.6})`;
        ctx.fillRect(Math.round(x), Math.round(y), 1, 2);
    }
}
function addPlacedDisplays(a) { (S && S.deco && S.deco.placed || []).forEach((p, j) => addDisplay(a, p, j)); }
/* the island, built again after something moved (keeps the drops, shells and today's decorations) */
function rebuildIsland() {
    applyBuildingMoves();
    G.areas.island = buildIsland();
    restoreDrops(G.areas.island); spawnShells(G.areas.island); decorateIsland(G.areas.island);
    if (G.area && G.area.id === 'island') G.area = G.areas.island;
}

/* ---------------------------------------------------------------- Waffle's shop */
ROOM_HOURS.displays = [8, 21];
ROOMS.displays = { w: 13, h: 6, wall: 'wall_displays', floor: 'floor_displays', music: 'shop', name: "Waffle's Island Displays", staff: 'waffle',
    staffAt: [6, 0], staffStand: [6, 2], guest: [6, 4, 3], build: a => buildDisplaysRoom(a),
    closedSign: "WAFFLE'S ISLAND DISPLAYS. Open {hours:displays}. Lamps, benches, hedges and more. Waffle is asleep. Syrup dreams." };
function buildDisplaysRoom(a) {
    const items = layoutItems([
        ['window_wall', 0, 'wall'], ['sign_displays', 5, 'wall'],
        ['disp_counter', 5, 1], ['disp_lantern', 0, 1], ['disp_topiary', 2, 1], ['disp_flag', 10, 0],
        ['disp_fountain', 0, 4], ['disp_stonebench', 3, 4], ['disp_gnome', 7, 4], ['disp_flamingo', 8, 4], ['disp_birdbath', 9, 4],
        ['disp_umbrella', 11, 4], ['disp_hedge', 12, 2]]);
    items.forEach(it => {
        if (it.id === 'disp_counter') it.use = 'counter';
        else if (it.id.startsWith('disp_')) it.use = () => displaysBrowse();
    });
    a.items = items;
    placeFurniture(a, items);
}
function waffleVoice() { const w = NPCs.get('waffle'); return w && !w.sleeping && w.area === 'displays' ? 'waffle' : null; }
const WAFFLE_CHAT = [
    "Every island needs a lamp by the pond. It's the law. Well. It's MY law.",
    "Ginger builds the houses, I make the outside nice. We're a team. She says I'm a 'finishing touch.' I'll take it.",
    'The trick with hedges is to trim them a little every day. And to talk to them. Mostly the talking.',
    "People ask why a waffle sells lamps. I say: I have a lot of little squares, and every one of them loves a nice view.",
    "A good bench is where neighbors happen. Put one somewhere nice and watch.",
    'Syrup? No thank you. I prefer to be admired, not eaten.',
];
async function waffleTalk(n) {
    const k = await UI.ask('waffle', rpick(["Welcome to Waffle's! Lamps, benches, hedges, all of it. Your island, but cozier.", 'Hello hello! Looking to spruce up the outside?', "Oh good, a customer! And a friend. A cus-friend."]),
        ['Talk', 'Buy displays', 'How do I set them up?', 'See you!'], { keep: true });
    if (k === 0) { await UI.say('waffle', rpick(WAFFLE_CHAT)); return; }
    if (k === 1) { UI.hideDialog(); await displaysShop(); return; }
    if (k === 2) {
        await UI.say('waffle', ['Everything you buy goes to your house storage. Then open "Island edit" on your phone!',
            'Tap a spot to set something down. Tap a lamp or a bench or a sign (even the ones that were already here) to pick it up and move it.',
            "Just not on a path, and never in front of a door. Folks need to get places."]);
        return;
    }
    await UI.say('waffle', rpick(['Bye! Go make it cozy out there.', 'See you! May your lamps always glow.']));
}
async function displaysBrowse() {
    const v = waffleVoice();
    if (v) { await waffleTalk(NPCs.get('waffle')); return; }
    await staffAway();
}
/* today's stock (6zu_outdoor.js: a few of each kind, each in one of its colors), shown by kind */
function displaysShop() {
    return new Promise(res => {
        const P = UI.open({ title: "Waffle's \u00b7 Island displays", foot: true, wide: true, onClose: res });
        const V = storeView(P);
        const stock = waffleStock(Clock.dayNum());
        const have = id => (S.storage[id] || 0) + pocketCount(id) + deco().placed.filter(p => p.id === id).length;
        const buy = id => {
            const d = dispDef(id);
            if (S.money < d.price) { Sfx.ui('nope'); UI.toast('Not enough sand dollars'); return false; }
            addMoney(-d.price, true, 'Shopping');
            toStorage(id, 1);
            Sfx.play('buy');
            UI.toast(`${d.name} sent to your house. Set it up with Island edit, or inside!`, d.frame);
            S.stats.displays = (S.stats.displays || 0) + 1;
            const w = NPCs.get('waffle'); if (w) { w.emote = 'sparkle'; w.emoteT = 50; }
            return true;
        };
        const pick = id => {
            const d = dispDef(id), n = have(id);
            V.show(id, { title: d.name, sub: `${d.w} ${plural(d.w, 'tile')} wide${d.light || d.torch ? ' \u00b7 lights up at night' : ''}${d.seat ? ' \u00b7 you can sit on it' : ''}${d.sign ? ' \u00b7 write your own words' : ''}${n ? ` \u00b7 you have ${n}` : ''}`,
                buttons: [btn(`Buy \u00b7 ${fmtNum(d.price)}`, '', () => { if (buy(id)) draw(true); })] });
        };
        const draw = (keep) => {
            const back = V.reset();
            V.list.appendChild(el('p', 'muted', 'New pieces every day. Everything works indoors too.'));
            for (const [cat, label] of OUTDOOR_CATS) {
                const mine = stock.filter(s => s.cat === cat);
                if (!mine.length) continue;
                const grid = V.group(label);
                for (const { id } of mine) { const d = dispDef(id); V.card(grid, { id, key: id, icon: d.frame, name: d.name, price: d.price, badge: have(id) ? 'Have' : null, pick: () => pick(id) }); }
            }
            if (V.sel) pick(V.sel);
            if (keep) back();
            P.foot.innerHTML = '';
            P.foot.appendChild(el('span', 'grow', `${fmtNum(S.money)} sand dollars \u00b7 set things up with Island edit on your phone`));
        };
        draw();
    });
}

/* ---------------------------------------------------------------- Island edit */
function ownedDisplays() {
    const out = {};
    for (const [id, n] of Object.entries(S.storage)) if (n > 0 && dispDef(id)) out[id] = (out[id] || 0) + n;
    for (const s of S.pocket) if (s && dispDef(s.id)) out[s.id] = (out[s.id] || 0) + s.n;
    return out;
}
function takeDisplay(id) { if ((S.storage[id] || 0) > 0) return fromStorage(id, 1); return removeItem(id, 1) > 0; }
function doorZoneSet() {
    const z = new Set(), add = (x, y) => { for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [0, 1], [-1, 1], [1, 1]]) z.add((x + dx) + ',' + (y + dy)); };
    for (const b of Object.values(W0.buildings)) add(b.x + b.door, b.y + b.h);
    if (W0.windmill) add(W0.windmill.x + W0.windmill.door, W0.windmill.y + W0.windmill.h);
    for (const p of W0.props) if (p.kind === 'tent') add(p.x + 1, p.y + 2);
    return z;
}
const IslandEdit = {
    on: false, held: null, look: false, cursor: [0, 0], msg: '',
    open(opts) {
        if (this.on || G.mode !== 'play') return;
        // (the designer's island: anything on it, saved as the island every game starts from, 6zza_designer.js)
        const design = !!(opts && opts.design) && Design.edit;
        if (!design && visitorStop('build')) return;
        if (G.area.id !== 'island') { UI.toast('Island edit works outside. Head out onto the island first.'); return; }
        UI.close(true); UI.hideDialog();
        this.on = true; this.held = null; this.look = false; this.msg = ''; this.design = design;
        const p = G.player;
        this.cursor = [Math.floor(p.x / TILE), Math.floor((p.y - 2) / TILE) + 1];
        G.camTarget = [p.x, p.y];
        G.keys = {};
        this.render();
        Sfx.ui('open');
        if (opts && opts.place) this.pickNew(opts.place);
    },
    close() {
        if (!this.on) return;
        if (this.held) this.cancel(true);
        this.on = false; this.design = false; this.stairs = false; this.stairSel = this.stairMove = null; this.bridges = false; this.bridgeSel = null; this.areaMode = false; this.corner = null;
        $('#panel').hidden = true; $('#panel').innerHTML = ''; $('#panel').classList.remove('decor', 'edit');
        UI.modal = false;
        G.camTarget = null;
        // Sarah never ends up inside something
        const p = G.player, a = G.area, tx = Math.floor(p.x / TILE), ty = Math.floor((p.y - 2) / TILE);
        if (a.blockedAt(tx, ty)) { const f = a.nearestFree(tx, ty, 6); if (f) { p.x = (f[0] + 0.5) * TILE; p.y = (f[1] + 0.6) * TILE; } }
        Sfx.ui('close');
    },
    render() {
        if (this.design) { Design.islandPanel(this); return; }
        const panel = $('#panel');
        panel.hidden = false; panel.className = 'decor edit'; panel.innerHTML = '';
        UI.modal = true;
        const head = el('div', 'phead');
        head.appendChild(el('h2', null, this.held ? `Moving: ${this.heldName()}` : 'Island edit'));
        if (S.flags.pathKit && !this.held) head.appendChild(btn('Paths', 'alt', () => { this.close(); PathTool.open(); }));
        head.appendChild(btn('Done', 'green', () => this.close()));
        panel.appendChild(head);
        const body = el('div', 'pbody');
        const tip = this.look ? 'Drag to look around the island.'
            : this.held ? (G.touchUsed ? 'Tap where it should go.' : 'Click where it should go. (Arrows + Enter work too.)')
                : (G.touchUsed ? 'Tap a lamp, bench, sign or decoration to pick it up. Or set down something new.' : 'Click a lamp, bench, sign or decoration to pick it up (or arrows + Enter). Esc when you\'re done.');
        body.appendChild(el('p', 'muted', this.msg || tip));
        const row = el('div', 'st-row');
        if (this.held) {
            row.appendChild(chip(this.held.src === 'new' ? 'Never mind' : 'Put it back', () => this.cancel()));
            const canStore = this.held.src !== 'prop' || MOVABLE_PROPS[this.held.kind];
            if (canStore && this.held.src !== 'new') row.appendChild(chip('Put it away', () => this.putAway()));
            if (this.held.sign) row.appendChild(chip('Write on it', () => this.writeSign()));
            if (this.held.turns) row.appendChild(chip(`Turn (${['facing front', 'facing right', 'facing back', 'facing left'][this.held.rot & 3]})`, () => this.turn()));
        } else {
            const own = ownedDisplays();
            row.appendChild(chip(`Set something down${Object.keys(own).length ? '' : ' (buy at Waffle\'s)'}`, () => this.chooseNew()));
        }
        row.appendChild(chip('Look around', () => { this.look = !this.look; this.msg = ''; this.render(); }, this.look ? 'on' : ''));
        body.appendChild(row);
        panel.appendChild(body);
    },
    /* turn what's in hand a quarter (its width and depth swap): a bench to face the path, a lamp, a sign (David, 29 October:
       benches kept facing the camera) */
    turn() {
        const h = this.held;
        if (!h || !h.turns) return;
        h.rot = ((h.rot || 0) + 1) & 3;
        [h.w, h.rows] = [h.rows, h.w];
        Sfx.ui('tick');
        this.render();
    },
    heldName() { const h = this.held; if (h.name) return h.name; return h.src === 'prop' ? (PROP_NAMES[h.kind] || h.kind.replace(/_/g, ' ')) : dispDef(h.id).name.toLowerCase(); },
    chooseNew() {
        const own = ownedDisplays();
        if (!Object.keys(own).length) { UI.toast("Nothing to set down yet. Waffle's shop (up Main Street) sells lamps, benches, hedges and more."); return; }
        const panel = $('#panel');
        panel.innerHTML = '';
        const head = el('div', 'phead');
        head.appendChild(el('h2', null, 'Set something down'));
        head.appendChild(btn('Back', '', () => this.render()));
        panel.appendChild(head);
        const body = el('div', 'pbody');
        const list = el('div', 'list');
        for (const [id, n] of Object.entries(own)) {
            const d = dispDef(id), r = el('button', 'row');
            r.type = 'button';
            r.appendChild(iconCanvas(d.frame, 40));
            const t = el('div', 't');
            t.appendChild(el('b', null, d.name));
            t.appendChild(el('span', null, `You have ${n}`));
            r.appendChild(t);
            r.addEventListener('click', () => { Sfx.ui('tick'); this.pickNew(id); });
            list.appendChild(r);
        }
        body.appendChild(list);
        panel.appendChild(body);
    },
    pickNew(id) {
        const d = dispDef(id);
        this.held = { src: 'new', id, w: d.w, rows: displayRows(d), frame: d.frame, sign: !!d.sign, text: '', rot: 0, turns: !d.plot };
        this.msg = '';
        this.render();
    },
    /* what's under this tile that can be picked up */
    thingAt(tx, ty) {
        if (this.design) return Design.thingAt(tx, ty);
        const a = G.areas.island;
        for (const e of a.ents) {
            if (e.hidden) continue;
            if (e.kind === 'plot' && e.planter) { if (tx === e.tx && ty === e.ty) return e; continue; }      // (one of Sarah's planter boxes: 6zze_planters.js)
            if (e.kind === 'display' && e.deco != null) {
                const d = dispDef(e.disp);
                if (tx >= e.px && tx < e.px + d.w && ty >= e.py && ty < e.py + displayRows(d)) return e;
            } else if (e.propIdx != null && e.kind in MOVABLE_PROPS) {
                const w = PROP_SIZE[e.kind] || 1;
                if (tx >= e.px && tx < e.px + w && ty === e.py) return e;
            }
        }
        return null;
    },
    pickUp(e) {
        if (this.design) { Design.pickUp(this, e); return; }
        const a = G.areas.island;
        if (e.kind === 'plot') {
            if (S.plots[e.idx]) { this.msg = "Something's growing in it. Harvest it first, then it can move."; Sfx.ui('nope'); this.render(); return; }
            this.held = { src: 'planter', idx: e.idx, id: 'dp_planterbox', w: 1, rows: 1, frame: DISPLAYS.dp_planterbox.frame, ent: e, from: [e.tx, e.ty] };
        } else if (e.kind === 'display') {
            const p = deco().placed[e.deco], d = dispDef(p.id);
            const rot = (p.rot || 0) & 3, odd = rot & 1;
            this.held = { src: 'deco', idx: e.deco, id: p.id, w: odd ? displayRows(d) : d.w, rows: odd ? d.w : displayRows(d), frame: d.frame, sign: !!d.sign, text: p.text || '', ent: e, from: [p.x, p.y], rot, turns: true };
        } else {
            const w0 = PROP_SIZE[e.kind] || 1, r0 = PROP_ROWS[e.kind] || 1, rot = (W0.props[e.propIdx] && W0.props[e.propIdx].rot || 0) & 3, odd = rot & 1;
            this.held = { src: 'prop', idx: e.propIdx, kind: e.kind, w: odd ? r0 : w0, rows: odd ? w0 : r0, frame: e.frame, ent: e, from: [e.px, e.py], rot, turns: !PROP_FIXED.has(e.kind) };
        }
        const h = this.held;
        for (let k = 0; k < h.w; k++) for (let r = 0; r < h.rows; r++) a.block(h.from[0] + k, h.from[1] + r, 0);
        e.hidden = true;
        Sfx.play('pick');
        this.msg = '';
        this.render();
    },
    cancel(quiet) {
        const h = this.held;
        if (!h) return;
        if (this.design) { Design.cancel(this); this.msg = ''; if (!quiet) { Sfx.ui('close'); this.render(); } return; }
        if (h.ent) {
            const a = G.areas.island;
            for (let k = 0; k < h.w; k++) for (let r = 0; r < h.rows; r++) a.block(h.from[0] + k, h.from[1] + r, 1);
            h.ent.hidden = false;
        }
        this.held = null;
        this.msg = '';
        if (!quiet) { Sfx.ui('close'); this.render(); }
    },
    putAway() {
        const h = this.held, D = deco();
        if (h.src === 'deco') { D.placed.splice(h.idx, 1); toStorage(h.id, 1); UI.toast(`${dispDef(h.id).name} put away in your house storage.`, dispDef(h.id).frame); }
        else if (h.src === 'planter') { planters()[h.idx] = null; toStorage('dp_planterbox', 1); UI.toast('Planter box put away in your house storage.', DISPLAYS.dp_planterbox.frame); }
        else if (h.src === 'prop') { const as = MOVABLE_PROPS[h.kind]; if (!as) return; D.gone[h.idx] = true; delete D.moved[h.idx]; toStorage(as, 1); UI.toast(`${DISPLAYS[as].name} put away in your house storage.`, DISPLAYS[as].frame); }
        this.held = null;
        Save.touch();
        rebuildIsland();
        Sfx.play('pick');
        this.render();
    },
    writeSign() {
        const h = this.held, panel = $('#panel');
        panel.innerHTML = '';
        const head = el('div', 'phead');
        head.appendChild(el('h2', null, 'Write on the sign'));
        panel.appendChild(head);
        const body = el('div', 'pbody');
        const f = el('label', 'field');
        f.appendChild(el('span', null, 'What does it say?'));
        const inp = el('input');
        inp.maxLength = 60; inp.value = h.text || ''; inp.autocomplete = 'off'; inp.id = 'signtext';
        f.appendChild(inp);
        body.appendChild(f);
        const row = el('div', 'st-row');
        const done = () => { h.text = (inp.value || '').trim().slice(0, 60); this.render(); };
        row.appendChild(chip('Done', done, 'go'));
        body.appendChild(row);
        panel.appendChild(body);
        inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') done(); });
        setTimeout(() => { try { inp.focus(); } catch (e) { /* fine */ } }, 60);
    },
    /* can the held thing go here? null if so, otherwise why not */
    whyNot(x, y) {
        const h = this.held, a = G.areas.island;
        if (!h) return 'nothing';
        const doors = doorZoneSet();
        const p = G.player, ptx = Math.floor(p.x / TILE), pty = Math.floor((p.y - 2) / TILE);
        // anything can always go back exactly where it came from (or where it first stood), even a scarecrow in a field
        const o = h.src === 'prop' ? W0_ORIG.props[h.idx] : null;
        if ((h.from && x === h.from[0] && y === h.from[1]) || (o && x === o.x && y === o.y)) {
            for (let k = 0; k < h.w; k++) for (let r = 0; r < h.rows; r++) {
                const tx = x + k, ty = y + r;
                if (a.blockedAt(tx, ty)) return "Something's already there.";
                if (tx === ptx && ty === pty) return 'Sarah is standing there.';
            }
            return null;
        }
        const fieldOk = h.kind === 'scarecrow' || h.kind === 'hay' || h.kind === 'crate';     // farm things belong in the fields
        if (this.design) { const why = Design.tileWhy(h, x, y, doors, ptx, pty); if (why) return why; }
        else for (let k = 0; k < h.w; k++) for (let r = 0; r < h.rows; r++) {
            const tx = x + k, ty = y + r;
            if (tx < 1 || ty < 1 || tx >= a.w - 1 || ty >= a.h - 1) return 'Too close to the edge of the island.';
            if (a.waterAt(tx, ty)) return "That's water.";
            if (W0.coll[ty][tx] === '1' || RAMPS.has(tx + ',' + ty)) return "That's a cliff or a slope. It needs flat ground.";
            if (pathAt(tx, ty)) return "Not on the path! Folks need to walk there.";
            const c = W0.grid[ty][tx];
            if (c === 'w' || (c === 'F' && !fieldOk)) return c === 'w' ? "Not on the pier (or a bridge)." : "Not in the farm fields. Ginger would cry. (Scarecrows and hay are fine.)";
            if (doors.has(tx + ',' + ty)) return 'Keep the doorway clear!';
            if (a.blockedAt(tx, ty)) return "Something's already there.";
            if (tx === ptx && ty === pty) return 'Sarah is standing there.';
        }
        // it mustn't cut anyone off: every door and every place the neighbors go stays reachable
        const W = a.w, blk = a.blocked.slice();
        for (let k = 0; k < h.w; k++) for (let r = 0; r < h.rows; r++) blk[(y + r) * W + x + k] = 1;
        const s0 = W0.spots.plaza, seen = new Uint8Array(W * a.h), q = [s0.y * W + s0.x];
        seen[q[0]] = 1;
        for (let i = 0; i < q.length; i++) {
            const c = q[i], cx = c % W;
            for (const n of [c - 1, c + 1, c - W, c + W]) {
                if (n < 0 || n >= W * a.h || seen[n] || blk[n] || (n === c - 1 && cx === 0) || (n === c + 1 && cx === W - 1)) continue;
                seen[n] = 1; q.push(n);
            }
        }
        const reach = (tx, ty) => seen[ty * W + tx] || blk[ty * W + tx];
        for (const [id, b] of Object.entries(W0.buildings)) { const tx = b.x + b.door, ty = b.y + b.h; if (!seen[ty * W + tx]) return `That would block the way to ${bldName(id)}.`; }
        for (const [k, sp] of Object.entries(W0.spots)) if (!reach(sp.x, sp.y)) return 'That would block off part of the island.';
        return null;
    },
    drop(x, y) {
        const h = this.held;
        const why = this.whyNot(x, y);
        if (why) { this.msg = why; Sfx.ui('nope'); this.render(); return false; }
        if (this.design) return Design.drop(this, x, y);
        const D = deco();
        if (h.src === 'planter') planters()[h.idx] = [x, y];
        else if (h.src === 'new' && DISPLAYS[h.id] && DISPLAYS[h.id].plot) {
            // (a planter box from her storage: it becomes one of her garden plots, 6zze_planters.js)
            const i = freePlanter();
            if (i < 0) { this.msg = `That's all ${PLANTERS} planter boxes out already.`; this.render(); return false; }
            if (!takeDisplay(h.id)) { this.msg = "You don't have one of those anymore."; this.render(); return false; }
            planters()[i] = [x, y]; S.plots[i] = null;
        } else if (h.src === 'new') {
            if (!takeDisplay(h.id)) { this.msg = "You don't have one of those anymore."; this.render(); return false; }
            D.placed.push(Object.assign({ id: h.id, x, y, text: h.text || '' }, h.rot & 3 ? { rot: h.rot & 3 } : {}));
        } else if (h.src === 'deco') {
            const p = D.placed[h.idx]; p.x = x; p.y = y; if (h.sign) p.text = h.text || '';
            if (h.rot & 3) p.rot = h.rot & 3; else delete p.rot;
        } else {
            const o = W0_ORIG.props[h.idx], rot = h.rot & 3;
            D.moved[h.idx] = [x, y, rot];
            if (o && o.x === x && o.y === y && ((o.rot || 0) & 3) === rot && !(S.buildMoved && Object.keys(S.buildMoved).length)) delete D.moved[h.idx];
        }
        this.held = null;
        this.msg = '';
        Save.touch();
        rebuildIsland();
        Sfx.play('buy');
        S.stats.decorated = (S.stats.decorated || 0) + 1;
        this.render();
        return true;
    },
    tap(wx, wy) {
        const [tx, ty] = [Math.floor(wx / TILE), Math.floor(wy / TILE)];
        this.cursor = [tx, ty];
        if (this.design && this.stairs && !this.held) { Design.stairTap(this, tx, ty); return; }
        if (this.design && this.bridges && !this.held) { Design.bridgeTap(this, tx, ty); return; }
        if (this.design && this.areaMode && !this.held) { Design.areaTap(this, tx, ty); return; }
        if (this.held) { const h = this.held; this.drop(tx - Math.floor((h.w - 1) / 2), ty - (h.rows - 1)); return; }
        let e = this.thingAt(tx, ty) || this.thingAt(tx, ty + 1);
        if (!e) { this.msg = this.design ? 'Nothing there to move.' : 'Nothing to pick up there. (Lamps, benches, signs, planters and decorations can move.)'; this.render(); return; }
        this.pickUp(e);
    },
    down(wx, wy, ev) {
        this.drag0 = ev ? [ev.clientX, ev.clientY, G.cam.x, G.cam.y, wx, wy] : null;
        this.dragged = 0;
    },
    move(wx, wy, ev) {
        this.hover = [Math.floor(wx / TILE), Math.floor(wy / TILE)];
        if (!this.drag0 || !ev) return;
        const k = G.view.cssScale || 1, dx = ev.clientX - this.drag0[0], dy = ev.clientY - this.drag0[1];
        if (Math.hypot(dx, dy) > 8) this.dragged = 1;
        if (this.look || (this.dragged && !this.held)) G.camTarget = [this.drag0[2] - dx / k + G.view.w / 2, this.drag0[3] - dy / k + G.view.h / 2];
    },
    up(wx, wy) {
        const d0 = this.drag0;
        this.drag0 = null;
        if (!d0 || this.look) return;
        if (this.dragged && !this.held) return;                // that was a drag to look around
        this.tap(wx != null ? wx : d0[4], wy != null ? wy : d0[5]);
    },
    key(code) {
        const c = this.cursor;
        if (code === 'Escape') { if (this.held) this.cancel(); else this.close(); return; }
        if (code === 'KeyR' && this.design) { Design.turn(this); return; }
        if (code === 'KeyR' && this.held && this.held.turns) { this.turn(); return; }
        if (code === 'ArrowLeft' || code === 'KeyA') c[0]--;
        else if (code === 'ArrowRight' || code === 'KeyD') c[0]++;
        else if (code === 'ArrowUp' || code === 'KeyW') c[1]--;
        else if (code === 'ArrowDown' || code === 'KeyS') c[1]++;
        else if (isA(code)) { this.tap((c[0] + 0.5) * TILE, (c[1] + 0.5) * TILE); return; }
        this.hover = null;
        G.camTarget = [(c[0] + 0.5) * TILE, (c[1] + 0.5) * TILE];
    },
    /* the held thing, following the cursor: green where it fits, red where it doesn't */
    draw(ctx) {
        if (!this.on) return;
        const [cx, cy] = this.hover && G.touchUsed === false ? this.hover : this.cursor;
        const h = this.held;
        // (the designer's areas, drawn over the island)
        if (this.design && (this.areaMode || !h)) Design.drawAreas(ctx, this);
        // (the designer's stairs: every staircase near the view, and where one would go)
        if (this.design && this.stairs && !h) {
            ctx.fillStyle = 'rgba(255,170,60,0.35)';
            for (const k of RAMPS) { const [x, y] = k.split(',').map(Number); if (Math.abs(x - cx) < 30 && Math.abs(y - cy) < 20) ctx.fillRect(x * TILE, y * TILE, TILE, TILE); }
            // (the island's own stairs taken away, dashed where they were)
            ctx.strokeStyle = 'rgba(255,170,60,0.9)'; ctx.lineWidth = 1; ctx.setLineDash([2, 2]);
            for (const g of Design.stairsGone()) for (const [x, y] of g) if (Math.abs(x - cx) < 30 && Math.abs(y - cy) < 20) ctx.strokeRect(x * TILE + 1.5, y * TILE + 1.5, TILE - 3, TILE - 3);
            ctx.setLineDash([]);
            // (the stairs picked, outlined; and where new or moved ones would go)
            if (this.stairSel) { ctx.strokeStyle = '#ffcf57'; ctx.lineWidth = 1.5; for (const [x, y] of this.stairSel) ctx.strokeRect(x * TILE + 1, y * TILE + 1, TILE - 2, TILE - 2); }
            const was = !this.stairMove && Design.stairsGone().find(g => g.some(t => t[0] === cx && t[1] === cy));
            const st = this.stairMove ? Design.stairAt(cx, cy, this.stairMove.w) : was ? { tiles: was } : this.stairSel || RAMPS.has(cx + ',' + cy) ? {} : Design.stairAt(cx, cy);
            if (st.tiles) { ctx.fillStyle = 'rgba(140,193,82,0.4)'; for (const [x, y] of st.tiles) ctx.fillRect(x * TILE, y * TILE, TILE, TILE); }
        }
        // (the designer's bridges: every bridge near the view, those taken away dashed, the one picked outlined, and where a
        // new one would go; the flat view's painted ground still shows the island's own)
        if (this.design && this.bridges && !h) {
            const near = (x, y) => Math.abs(x - cx) < 30 && Math.abs(y - cy) < 20;
            ctx.fillStyle = 'rgba(176,122,74,0.6)';
            for (let y = Math.max(0, cy - 20); y < Math.min(W0.h, cy + 20); y++) for (let x = Math.max(0, cx - 30); x < Math.min(W0.w, cx + 30); x++) if (W0.grid[y][x] === 'w') ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
            ctx.strokeStyle = 'rgba(176,122,74,0.95)'; ctx.lineWidth = 1; ctx.setLineDash([2, 2]);
            for (const g of Design.bridgesGone()) for (const [x, y] of g) if (near(x, y)) ctx.strokeRect(x * TILE + 1.5, y * TILE + 1.5, TILE - 3, TILE - 3);
            ctx.setLineDash([]);
            if (this.bridgeSel) { ctx.strokeStyle = '#ffcf57'; ctx.lineWidth = 1.5; for (const [x, y] of this.bridgeSel) ctx.strokeRect(x * TILE + 1, y * TILE + 1, TILE - 2, TILE - 2); }
            else if (!G.touchUsed) {
                const k = cx + ',' + cy + ',' + (Design.bridgeW || 2) + ',' + Design.ver;
                if (this._brk !== k) { this._brk = k; this._br = W0.grid[cy] && W0.grid[cy][cx] === 'w' ? {} : Design.bridgeAt(cx, cy); }
                if (this._br.tiles) { ctx.fillStyle = 'rgba(140,193,82,0.45)'; for (const [x, y] of this._br.tiles) ctx.fillRect(x * TILE, y * TILE, TILE, TILE); }
            }
        }
        if (!h) {
            if (G.touchUsed) return;
            ctx.strokeStyle = '#ffcf57'; ctx.lineWidth = 1;
            ctx.strokeRect(cx * TILE + 0.5, cy * TILE + 0.5, TILE - 1, TILE - 1);
            return;
        }
        const x = cx - Math.floor((h.w - 1) / 2), y = cy - (h.rows - 1);
        const bad = this.whyNotCached(x, y);
        ctx.fillStyle = bad ? 'rgba(224,64,90,0.35)' : 'rgba(140,193,82,0.35)';
        ctx.fillRect(x * TILE, y * TILE, h.w * TILE, h.rows * TILE);
        ctx.globalAlpha = 0.75;
        spr(ctx, h.frame, (x + h.w / 2) * TILE, (y + h.rows) * TILE - 2);
        ctx.globalAlpha = 1;
        // (the designer's: which way it faces, the flat view can't turn the picture)
        if (this.design && !PROP_FIXED.has(h.kind)) {
            const mx = (x + h.w / 2) * TILE, my = (y + h.rows / 2) * TILE, ang = [Math.PI / 2, 0, -Math.PI / 2, Math.PI][h.rot & 3], r = Math.min(h.w, h.rows) * TILE * 0.45 + 4;
            ctx.strokeStyle = '#ffcf57'; ctx.fillStyle = '#ffcf57'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + Math.cos(ang) * r, my + Math.sin(ang) * r); ctx.stroke();
            ctx.beginPath(); ctx.arc(mx + Math.cos(ang) * r, my + Math.sin(ang) * r, 2.5, 0, Math.PI * 2); ctx.fill();
        }
    },
    whyNotCached(x, y) {
        const k = x + ',' + y + ',' + (this.held && this.held.id || this.held && this.held.kind) + ',' + (this.held && this.held.rot);
        if (this._wk !== k) { this._wk = k; this._wv = this.whyNot(x, y); }
        return this._wv;
    },
};
const PROP_NAMES = { lamp: 'lamp post', bench: 'bench', flowerbed: 'flower bed', board: 'island board', sign_island: 'island sign', sign_club: 'club sign',
    sign_farm: 'farm sign', sign_camp: 'campsite sign', sign_bonfire: 'bonfire sign', well: 'well', hay: 'hay bale', crate: 'crate', scarecrow: 'scarecrow' };

