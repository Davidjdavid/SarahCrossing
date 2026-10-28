/* ---- 25_house.js ---- */
/* Sarah's house: room drawing, furniture, decorating, and the club room */
const WALL_ROWS = 2;
function buildRoomBg(a, k) {
    // k: canvas pixels to a world pixel (the HD-2D view draws rooms with three; then it's only returned)
    const c = document.createElement('canvas');
    c.width = a.w * TILE * (k || 1); c.height = a.h * TILE * (k || 1);
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    if (k) g.scale(k, k);
    g.fillStyle = '#231b2e';
    g.fillRect(0, 0, c.width, c.height);
    const f = a.floor;
    const wall = a.club ? 'wall_disco' : a.wallId || S.house.wall;
    const floor = a.club ? 'floor_disco' : a.floorId || S.house.floor;
    for (let x = f.x0; x < f.x0 + f.w; x++) spr(g, 'wp_' + wall, x * TILE, 0);
    for (let y = f.y0; y < f.y0 + f.h; y++) for (let x = f.x0; x < f.x0 + f.w; x++) spr(g, 'fl_' + floor, x * TILE, y * TILE);
    // soft shadow under the back wall
    const gr = g.createLinearGradient(0, f.y0 * TILE, 0, f.y0 * TILE + 10);
    gr.addColorStop(0, 'rgba(40,20,50,0.28)'); gr.addColorStop(1, 'rgba(40,20,50,0)');
    g.fillStyle = gr;
    g.fillRect(f.x0 * TILE, f.y0 * TILE, f.w * TILE, 10);
    // side walls + front ledge
    g.fillStyle = '#5a4060';
    g.fillRect(f.x0 * TILE - 5, 0, 5, (f.y0 + f.h) * TILE + 6);
    g.fillRect((f.x0 + f.w) * TILE, 0, 5, (f.y0 + f.h) * TILE + 6);
    g.fillStyle = '#6e5078';
    g.fillRect(f.x0 * TILE - 5, (f.y0 + f.h) * TILE, (f.w) * TILE + 10, 6);
    g.fillStyle = '#3e2a48';
    g.fillRect(f.x0 * TILE - 5, (f.y0 + f.h) * TILE + 6, f.w * TILE + 10, 3);
    // doorway + mat
    const [dx, dy] = a.doorTile;
    g.fillStyle = a.club ? '#ff5aa8' : '#c8505a';
    g.fillRect(dx * TILE + 2, dy * TILE - 3, 12, 9);
    g.fillStyle = a.club ? '#3a1a3a' : '#f2c94c';
    g.fillRect(dx * TILE + 3, dy * TILE - 2, 10, 5);
    if (k) return c;
    a.bg = c;
}

/* furniture definition; food can sit on tables as decoration */
function furnDef(id) {
    if (FURN[id]) return FURN[id];
    const it = ITEMS[id];
    if (it && (['dish', 'fruit', 'veg'].includes(it.type) || it.coffee)) return { id, name: it.name, w: 1, h: 1, kind: 'top', sets: ['food'], food: 1, frame: it.icon };
    if (it && it.type === 'flower') return { id, name: it.name + ' vase', w: 1, h: 1, kind: 'top', sets: ['flower'], flower: 1, frame: it.icon };
    // (and a fish, a shell or a gem set down like a little treasure: David, 28 October, "flowers, fish and most other
    // things set down too"; in the new look each is its own model, EnvItems)
    if (it && ['fish', 'shell', 'gem'].includes(it.type)) return { id, name: it.name, w: 1, h: 1, kind: 'top', sets: [it.type], thing: 1, frame: it.icon };
    return null;
}
/* how much floor a piece takes, turned as it is (David, 28 October: furniture faces any of the four ways now that it's
   3D). it.rot is quarter turns: 0 faces the front (south, the camera), 1 east, 2 the back, 3 west; turned a quarter its
   width and depth swap. What hangs on the wall and rugs don't turn */
function furnWH(d, rot) {
    const h = d.kind === 'wall' || d.kind === 'top' ? 1 : d.h;
    return (rot & 1) && turnable(d) ? { w: h, h: d.w } : { w: d.w, h };
}
function turnable(d) { return !!d && d.kind !== 'wall' && d.kind !== 'rug'; }

/* turn a room's item list (Sarah's house: S.house.items) into entities */
function placeFurniture(a, items) {
    let list = items || (a.id === 'home' ? S.house.items : a.items || []);
    // (a room's layout as the designer left it: 6zza_designer.js)
    if (a.interior && a.id !== 'home' && list === a.items) list = Design.room(a, list);
    a.ents = a.ents.filter(e => !e.furn);
    a.decals = [];
    const f = a.floor;
    // reset floor blocking
    for (let y = f.y0; y < f.y0 + f.h; y++) for (let x = f.x0; x < f.x0 + f.w; x++) a.block(x, y, 0);
    const surfaceAt = {};
    list.forEach((it, idx) => {
        const d = furnDef(it.id);
        if (!d) return;
        const ent = { furn: true, idx, item: it, def: d, flip: !!it.flip, rot: turnable(d) ? (it.rot || 0) & 3 : 0, frame: d.frame || 'f_' + it.id };
        const F = furnWH(d, ent.rot), px = (it.x + F.w / 2) * TILE;
        if (d.kind === 'wall') {
            ent.x = px; ent.y = WALL_ROWS * TILE - 5; ent.layer = 0; ent.sy = -100;
            ent.hit = { x: it.x * TILE, y: 8, w: d.w * TILE, h: 22 };
            ent.stand = [it.x, f.y0];
        } else if (d.kind === 'rug') {
            ent.x = px; ent.y = (it.y + d.h) * TILE - 1; ent.layer = 0;
            ent.hit = null;
        } else if (d.kind === 'top' && it.on != null) {
            const lift = surfaceLift(list[it.on]);
            ent.x = px; ent.y = (it.y + 1) * TILE - 3 - lift; ent.sy = (it.y + 1) * TILE - 1 + 0.5;
            ent.hit = { x: it.x * TILE, y: ent.y - 16, w: 16, h: 18 };
        } else {
            const h = F.h;
            ent.x = px; ent.y = (it.y + h) * TILE - 1; ent.sy = ent.y;
            for (let y = it.y; y < it.y + h; y++) for (let x = it.x; x < it.x + F.w; x++) a.block(x, y, 1);
            ent.hit = { x: it.x * TILE, y: it.y * TILE - 12, w: F.w * TILE, h: h * TILE + 12 };
            // (a table turned on its side is a surface all along its front: its whole depth faces the room)
            if (d.surface) for (let x = it.x; x < it.x + F.w; x++) surfaceAt[`${x},${it.y + h - 1}`] = idx;
        }
        // (a lamp Sarah switched off at home gives no light: it.off, lampSwitch)
        if (d.light && !it.off) ent.light = { r: d.light, y: -12 };
        if (d.anim || d.disco || d.stars || d.id === 'light_floor') ent.draw = ctx => drawAnimatedFurn(ctx, ent);
        if (d.flower) ent.draw = ctx => drawFlowerVase(ctx, ent);
        ent.interact = () => useFurniture(ent);
        if (d.kind === 'rug') a.decals.push({ frame: ent.frame, x: ent.x, y: ent.y, rug: true, ent });
        else a.add(ent);
    });
    a.surfaceAt = surfaceAt;
    // keep the doorway clear
    a.block(a.doorTile[0], a.doorTile[1], 0);
}
/* a picked flower in a little glass jar */
function drawFlowerVase(ctx, e) {
    const x = Math.round(e.x), y = Math.round(e.y);
    spr(ctx, e.frame, x, y - 4);
    ctx.fillStyle = 'rgba(190,230,240,0.85)';
    ctx.fillRect(x - 3, y - 7, 6, 7);
    ctx.fillStyle = 'rgba(120,190,215,0.9)';
    ctx.fillRect(x - 3, y - 3, 6, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 2, y - 6, 1, 3);
    ctx.fillStyle = '#5a7f8c';
    ctx.fillRect(x - 4, y - 8, 8, 1);
    ctx.fillRect(x - 3, y, 6, 1);
}
function surfaceLift(parent) {
    if (!parent) return 0;
    const d = furnDef(parent.id);
    return { table_wood: 10, driftwood_table: 10, study_desk: 12, sushi_counter: 14, cheesecake_case: 18, cafe_table: 12,
        dresser: 14, shell_display: 16, counter_shop: 14, counter_boutique: 14, pedestal: 13, acc_table: 12, museum_desk: 14, counter_diner: 14, workbench: 13, dining_table: 11 }[d.id] || 10;
}
function drawAnimatedFurn(ctx, e) {
    spr(ctx, e.frame, e.x, e.y, e.flip);
    const d = e.def;
    const t = G.t;
    if (d.id === 'light_floor') {
        const x0 = e.x - 16, y0 = e.y - 31;
        const cols = ['#ff5aa8', '#4ec3d9', '#ffd84a', '#8cc152'];
        for (let i = 0; i < 16; i++) {
            const cx = x0 + (i % 4) * 8, cy = y0 + Math.floor(i / 4) * 8;
            ctx.fillStyle = cols[(i + (t >> 4)) % 4];
            ctx.fillRect(cx + 1, cy + 1, 6, 6);
        }
    } else if (d.id === 'sushi_conveyor') {
        const off = (t >> 2) % 8;
        ctx.fillStyle = '#ffffff';
        for (let x = e.x - 22 + off; x < e.x + 20; x += 8) { ctx.fillRect(x, e.y - 18, 4, 2); ctx.fillStyle = '#f28a6b'; ctx.fillRect(x, e.y - 19, 4, 1); ctx.fillStyle = '#ffffff'; }
    } else if (d.id === 'choc_fountain') {
        ctx.fillStyle = '#8a5030';
        const k = (t >> 3) % 3;
        ctx.fillRect(e.x - 3 + k, e.y - 10, 1, 3);
    } else if (d.disco && G.lamps > 0.2) {
        const cols = ['255,90,168', '78,195,217', '255,216,74'];
        const f = G.area.floor;
        for (let i = 0; i < 5; i++) {
            const a = t / 40 + i * 1.25;
            let x = Math.round(e.x + Math.cos(a) * 30), y = Math.round(e.y + 20 + Math.sin(a) * 14);
            if (f && (x < f.x0 * TILE || x > (f.x0 + f.w) * TILE - 2)) continue;       // stay inside the room
            ctx.fillStyle = `rgba(${cols[i % 3]},0.5)`;
            ctx.fillRect(x, y, 2, 2);
        }
    } else if (d.arcade) {
        drawCabinetScreen(ctx, e);
    } else if (d.stars && G.lamps > 0.2) {
        for (let i = 0; i < 6; i++) {
            const k = (Math.sin(t / 20 + i * 2) + 1) / 2;
            ctx.fillStyle = `rgba(255,246,176,${0.3 + 0.5 * k})`;
            ctx.fillRect(Math.round(e.x - 40 + i * 17 + Math.sin(i) * 5), 6 + (i * 7) % 20, 1, 1);
        }
    }
}

/* a lamp or lantern in the house switches on and off with a tap (David's list of things that act, 28 October): kept on
   the piece (it.off), so it stays as she left it */
function isLamp(d) { return !!(d && d.light && !d.arcade && !/^cab_|claw|disco|neon/.test(d.id)); }
function lampSwitch(e) {
    if (!isLamp(e.def) || !e.item) return false;
    if (e.item.off) delete e.item.off; else e.item.off = true;
    Sfx.ui(e.item.off ? 'close' : 'open');
    placeFurniture(G.area);
    Save.touch();
    return true;
}
/* a pedestal (or display case) with something on it: looking at it means looking at what's on show */
const DISPLAY_SURFACES = new Set(['pedestal', 'shell_display', 'cheesecake_case']);
function thingOnTop(e) {
    if (!e || !e.def || !DISPLAY_SURFACES.has(e.def.id) || !G.area) return null;
    return G.area.ents.find(o => o !== e && o.furn && o.item && o.item.on === e.idx && o.interact) || null;
}
async function useFurniture(e) {
    const d = e.def;
    if (G.decor) return;
    const top = thingOnTop(e);
    if (top) return top.interact();
    if (G.area.id !== 'home') return roomFurniture(e);
    if (d.cook) return openCooking(d.id === 'wok_stove');
    if (d.wardrobe) return openWardrobe();
    if (d.arcade) return homeArcade(d);
    if (d.id === 'hiscore_board') return showHiScores();
    if (d.easel) return paintAndClose('home');
    if (d.laptop) return useLaptop();
    if (d.art) return viewArt(d.id);
    if (lampSwitch(e) || furnSwitch(e) || globeSpin(e)) return;     // (a lamp, the TV, the record player, the globe: 6zyb_acting.js)
    const t = Clock.fmt().s;
    const lines = {
        bed_simple: [`Sarah isn't sleepy. It's only ${t}.`], cloud_bed: [`The weighted blanket is calling. Sarah is not ready to answer. It's only ${t}.`],
        clock_wall: [`The clock says ${t}. (You can set it in Settings, if the island's clock ever feels off.)`],
        nameplate: ['SARAH \u00b7 HARVARD \u00b7 TITLE: (smudged)'],
        dnd_sign: ['DO NOT DISTURB BEFORE NOON. This is legally binding. John checked.'],
        jackbox_trophy: ['GAME NIGHT CHAMPION: DAVID. Engraved. Pre-engraved, actually.'],
        contract_frame: ['"SIBLINGS IN LAW." Signed by everyone. John billed everyone for it.'],
        framed_poem: [rpick(JOE_FRAMED)],
        typewriter: ['Joe left a poem in the typewriter: "I have a spoon. / It is not the moon. / I will write more soon." It is signed "Joe (Poet)."'],
        light_floor: ['Sarah does a little shimmy on the light-up floor. The house is now a club.'],
        plaque_gold: ['THE CUTEST HOUSE ON THE ISLAND. Signed: Sir Floret, Dame Stalk, Little Sprout.'],
        trophy_arcade: ['ARCADE CHAMPION. Chili cried a little when he handed it over. Hot tears.'],
        trophy_rope: ["JUMP ROPE CHAMPION. It's made from a water bottle. Cuke says that makes it more meaningful."],
        trophy_karaoke: ['KARAOKE STAR. Joe wrote a poem about it. It is about a microphone. It is perfect.'],
    }[d.id];
    if (d.photo) {
        const who = d.photo;
        await UI.say(null, `${NPC_DEFS[who] ? NPC_DEFS[who].name : 'Joe'}'s photo. On the back it says: "${PHOTO_NOTES[who] || 'Love you!'}"`);
        return;
    }
    // (only what's written on a thing, or what it does: the descriptions and jokes went, David, 28 October)
    if (lines) await UI.say(null, lines);
}

/* ---------------------------------------------------------------- decorating */
const Decor = {
    on: false, held: null, sel: null, cursor: [2, 3], tab: 'furniture',
    async enter(opts) {
        // (or the designer, in any other room: its furniture as every game will have it, 6zza_designer.js)
        const design = !!(opts && opts.design) && Design.edit && Design.canRoom(G.area);
        if (this.on || (G.area.id !== 'home' && !design)) return;
        if (!design && visitorStop('decorate')) return;
        this.design = design ? G.area.id : null;
        if (design) Design.roomStart(G.area);
        this.on = true;
        G.decor = true;
        G.player.hidden = true;
        const a = G.area;
        this.cursor = [a.floor.x0 + 1, a.floor.y0 + 1];
        this.held = null; this.sel = null;
        this.render();
        Sfx.ui('open');
    },
    exit() {
        if (!this.on) return;
        this.unhold();
        this.on = false; G.decor = false;
        this.held = null; this.sel = null; this.design = null;
        $('#panel').hidden = true; $('#panel').innerHTML = ''; $('#panel').classList.remove('decor');
        UI.modal = false;
        G.camTarget = null;
        G.camShift = null;
        const p = G.player, a = G.area;
        p.hidden = false;
        const tx = Math.floor(p.x / TILE), ty = Math.floor((p.y - 2) / TILE);
        if (a.blockedAt(tx, ty)) {
            const fr = a.nearestFree(tx, ty, 8) || a.doorTile;
            p.x = (fr[0] + 0.5) * TILE; p.y = (fr[1] + 0.6) * TILE;
        }
        Save.touch();
        Sfx.ui('close');
    },
    /* the designer's piece in hand goes back where it was, if it's let go of without being put down */
    unhold() { const it = this.heldIt; this.heldIt = null; if (!this.design || !it) return; this.list().push(it); placeFurniture(G.area); Design.roomChanged(G.area); },
    /* the pieces being arranged: Sarah's house's, or the room the designer is in */
    list() { return this.design ? G.area.items : S.house.items; },
    /* back to storage (the designer's pieces just go) */
    stash(id) { if (!this.design) toStorage(artBase(id), 1); },
    /* (the designer's undo takes the design back to before each change) */
    mark() { if (this.design) Design.snap(); },
    owned() {
        if (this.design) return Design.roomCatalog();
        const out = {};
        // (a coffee from Muggy's sits on a table like food: 6zs_mug.js)
        // (and Waffle's outdoor pieces: a park bench in the house, 6zu_outdoor.js)
        const ok = id => ['furniture', 'wall', 'floor', 'dish', 'fruit', 'veg', 'flower', 'fish', 'shell', 'gem', 'art', 'display'].includes(ITEMS[id].type) || !!ITEMS[id].coffee;
        for (const s of S.pocket) if (s && ok(s.id)) out[s.id] = (out[s.id] || 0) + s.n;
        for (const [id, n] of Object.entries(S.storage)) if (ITEMS[id] && ok(id)) out[id] = (out[id] || 0) + n;
        return out;
    },
    takeOne(id) {
        if (this.design) return true;
        id = artBase(id);           // (a painting on a table or an easel is the painting: 65_museum.js)
        if (fromStorage(id, 1)) return true;
        return removeItem(id, 1) > 0;
    },
    render() {
        const panel = $('#panel');
        panel.hidden = false;
        panel.className = 'decor';
        panel.innerHTML = '';
        UI.modal = true;
        const owned = this.owned();
        const head = document.createElement('div');
        head.className = 'phead';
        head.innerHTML = this.design ? '<h2></h2>' : `<h2>Decorating</h2>`;
        if (this.design) head.firstChild.textContent = 'Designer \u00b7 ' + (ROOMS[this.design].name || bldName(this.design));
        const done = document.createElement('button');
        done.className = 'btn green'; done.type = 'button'; done.textContent = 'Done';
        done.addEventListener('click', () => this.exit());
        head.appendChild(done);
        panel.appendChild(head);
        const info = document.createElement('div');
        info.className = 'muted';
        info.style.padding = '0 18px 8px';
        const selIt = this.sel != null ? this.list()[this.sel] : null, nm = id => (this.design && FURN[id] && FURN[id].name) || itemName(id);
        info.textContent = this.held ? `Placing: ${nm(this.held)}. Tap a spot in the room.${G.touchUsed ? '' : ' (Arrows + Enter, R to turn, Esc to cancel)'}`
            : selIt ? `${nm(selIt.id)} selected.` : this.design ? 'Tap a piece in the room to move, turn or take it away, or pick something below to add it. Nothing is kept until you save.' : 'Tap furniture in the room to move it, or pick something below to place it.';
        panel.appendChild(info);
        if (this.design && !this.held && !selIt) {
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;gap:8px;padding:0 18px 10px;flex-wrap:wrap';
            if (Design.undo.length) row.appendChild(chip('Undo', () => { Design.back(); this.sel = null; this.render(); }));
            row.appendChild(chip(Design.dirty ? 'Save the design' : 'Saved', () => Design.save().then(() => this.render()), Design.dirty ? 'go' : ''));
            panel.appendChild(row);
        }
        // (a painting: on the wall, on a table or on an easel, 65_museum.js)
        if (this.held && !this.design && ITEMS[artBase(this.held)] && ITEMS[artBase(this.held)].art && FURN[artBase(this.held) + '_stand']) {
            const row = document.createElement('div'), base = artBase(this.held);
            row.style.cssText = 'display:flex;gap:8px;padding:0 18px 10px;flex-wrap:wrap';
            for (const [suf, label] of ART_AS) row.appendChild(chip(label, () => { this.held = base + suf; this.render(); }, this.held === base + suf ? 'on' : ''));
            panel.appendChild(row);
        }
        if (this.held && turnable(furnDef(this.held))) {
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;gap:8px;padding:0 18px 10px;flex-wrap:wrap';
            const b = document.createElement('button'); b.type = 'button'; b.className = 'btn alt';
            b.textContent = 'Turn (' + ['facing front', 'facing right', 'facing back', 'facing left'][this.rot || 0] + ')';
            b.addEventListener('click', () => this.turn());
            row.appendChild(b);
            panel.appendChild(row);
        }
        if (selIt) {
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;gap:8px;padding:0 18px 10px;flex-wrap:wrap';
            const mk = (label, fn, cls) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ' + (cls || ''); b.textContent = label; b.addEventListener('click', fn); row.appendChild(b); };
            mk('Move', () => this.pickUpPlaced(this.sel));
            if (turnable(furnDef(selIt.id))) mk('Turn', () => this.turn(), 'alt');
            if (furnDef(selIt.id).kind !== 'wall') mk('Flip', () => { this.mark(); selIt.flip = !selIt.flip; this.refresh(); }, 'alt');
            mk(this.design ? 'Take it away' : 'Put away', () => this.store(this.sel), 'alt');
            panel.appendChild(row);
        }
        const tabs = document.createElement('div');
        tabs.className = 'tabs';
        const tabList = this.design ? [['furniture', 'Furniture'], ['food', 'On tables'], ['hung', 'On the walls']] : [['furniture', 'Furniture'], ['food', 'Tabletop'], ['wall', 'Wallpaper'], ['floor', 'Flooring']];
        if (this.design && !tabList.some(t => t[0] === this.tab)) this.tab = 'furniture';
        for (const [k, label] of tabList) {
            const t = document.createElement('button');
            t.type = 'button'; t.className = 'tab' + (this.tab === k ? ' on' : ''); t.textContent = label;
            t.addEventListener('click', () => { this.tab = k; this.render(); });
            tabs.appendChild(t);
        }
        panel.appendChild(tabs);
        const body = document.createElement('div');
        body.className = 'pbody';
        const grid = document.createElement('div');
        grid.className = 'grid';
        const tabOf = id => this.design ? ({ top: 'food', wall: 'hung' }[FURN[id].kind] || 'furniture') : ['dish', 'fruit', 'veg', 'flower', 'fish', 'shell', 'gem'].includes(ITEMS[id].type) || ITEMS[id].coffee ? 'food' : ITEMS[id].type === 'art' || ITEMS[id].type === 'display' ? 'furniture' : ITEMS[id].type;
        const ids = Object.keys(owned).filter(id => tabOf(id) === this.tab).sort();
        if (!ids.length) {
            const p = document.createElement('p');
            p.className = 'muted';
            p.textContent = this.tab === 'furniture' ? "No furniture in storage. Fortune's shop has new pieces every day." : this.tab === 'food' ? 'Dishes, fruit, veggies, picked flowers, fish, shells and gems can go on tables (or the floor) as decorations. Little Sprout loves that.' : `No spare ${this.tab === 'wall' ? 'wallpaper' : 'flooring'} yet. Fortune stocks one a day.`;
            body.appendChild(p);
        }
        for (const id of ids) {
            const b = document.createElement('button');
            b.type = 'button'; b.className = 'slot' + (this.held && artBase(this.held) === id ? ' sel' : '');
            b.title = nm(id);
            b.setAttribute('aria-label', nm(id));
            b.appendChild(iconCanvas(this.design ? (FURN[id].frame || 'f_' + id) : itemIcon(id), 48));
            if (owned[id] > 1) { const n = document.createElement('span'); n.className = 'n'; n.textContent = owned[id]; b.appendChild(n); }
            b.addEventListener('click', () => this.choose(id));
            grid.appendChild(b);
        }
        body.appendChild(grid);
        panel.appendChild(body);
        // frame the room beside or above the sheet
        const a = G.area, v = G.view;
        const pr = panel.getBoundingClientRect(), app = $('#app');
        const sheetPx = pr.height / v.cssScale;
        const mw = a.w * TILE, mh = a.h * TILE;
        if (pr.height > app.clientHeight * 0.6 && pr.width < app.clientWidth * 0.6) {
            const pw = pr.width / v.cssScale + 10;
            G.camTarget = [mw / 2 + pw / 2, mh / 2];
            G.camShift = mw <= v.w ? [clamp(pw / 2, 0, Math.max(0, (v.w - mw) / 2 - 4)), 0] : null;
            return;
        }
        G.camTarget = [(a.w * TILE) / 2, (a.h * TILE) / 2 + sheetPx / 2 - 6];
        if (mh <= v.h) {
            // the room is smaller than the screen: slide it up so the floor stays above the sheet
            const def = (mh - v.h) / 2 - 6, want = mh - (v.h - sheetPx - 6);
            G.camShift = [0, clamp(want - def, 0, Math.max(0, (v.h - mh) / 2 + 2))];
        } else G.camShift = null;
    },
    choose(id) {
        const t = ITEMS[id] && ITEMS[id].type;
        if (!this.design && (t === 'wall' || t === 'floor')) {
            const key = t === 'wall' ? 'wall' : 'floor';
            const old = S.house[key];
            if (old === id) return;
            if (!this.takeOne(id)) return;
            toStorage(old, 1);
            S.house[key] = id;
            buildRoomBg(G.area);
            Sfx.play('place');
            this.render();
            return;
        }
        this.unhold();
        this.held = this.held && artBase(this.held) === id ? null : id;
        this.sel = null;
        this.render();
    },
    refresh() { placeFurniture(G.area); if (this.design) Design.roomChanged(G.area); else Save.touch(); this.render(); },
    pickUpPlaced(i) {
        const it = this.list()[i];
        if (!it) return;
        this.mark();
        this.removeAt(i);
        this.stash(it.id);
        this.held = it.id;
        this.heldIt = it;
        this.rot = it.rot || 0;
        this.sel = null;
        this.refresh();
    },
    store(i) {
        const it = this.list()[i];
        if (!it) return;
        this.mark();
        this.removeAt(i);
        this.stash(it.id);
        this.sel = null;
        Sfx.play('pick');
        this.refresh();
    },
    removeAt(i) {
        // anything sitting on it goes to storage too
        const items = this.list();
        for (let k = items.length - 1; k >= 0; k--) if (items[k].on === i) { this.stash(items[k].id); items.splice(k, 1); if (k < i) i--; }
        items.splice(i, 1);
        for (const it of items) if (it.on != null && it.on > i) it.on--;
    },
    /* can `id` go with its top-left at tile (x, y)? returns placement or null */
    fit(id, x, y, ignore, rot) {
        const d0 = furnDef(id), a = G.area, f = a.floor, F = furnWH(d0, rot || 0), d = Object.assign({}, d0, { w: F.w, h: F.h });
        const items = this.list();
        const occ = (kind) => {
            const m = new Set();
            items.forEach((it, i) => {
                if (i === ignore) return;
                const dd = furnDef(it.id);
                if (!dd || dd.kind !== kind && !(kind === 'floor' && dd.kind === 'top' && it.on == null)) return;
                const F = furnWH(dd, it.rot);
                for (let yy = it.y; yy < it.y + F.h; yy++) for (let xx = it.x; xx < it.x + F.w; xx++) m.add(`${xx},${yy}`);
            });
            return m;
        };
        if (d.kind === 'wall') {
            if (x < f.x0 || x + d.w > f.x0 + f.w) return null;
            const o = occ('wall');
            for (let xx = x; xx < x + d.w; xx++) if (o.has(`${xx},0`)) return null;
            return { x, y: 0 };
        }
        const h = d.kind === 'top' ? 1 : d.h;
        if (x < f.x0 || y < f.y0 || x + d.w > f.x0 + f.w || y + h > f.y0 + f.h) return null;
        const door = a.doorTile;
        if (d.kind !== 'rug') {
            for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + d.w; xx++) if (xx === door[0] && yy === door[1] - 1) return null;
        }
        if (d.kind === 'rug') {
            const o = occ('rug');
            for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + d.w; xx++) if (o.has(`${xx},${yy}`)) return null;
            return { x, y };
        }
        if (d.kind === 'top') {
            const si = a.surfaceAt ? a.surfaceAt[`${x},${y}`] : null;
            const tops = new Set(items.filter((it, i) => i !== ignore && furnDef(it.id).kind === 'top' && it.on != null).map(it => `${it.x},${it.y}`));
            if (si != null && si !== ignore && !tops.has(`${x},${y}`)) return { x, y, on: si };
        }
        const o = occ('floor');
        for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + d.w; xx++) if (o.has(`${xx},${yy}`)) return null;
        return { x, y };
    },
    tileAt(px, py) {
        return [Math.floor(px / TILE), Math.floor(py / TILE)];
    },
    place(tx, ty) {
        const id = this.held;
        const d = furnDef(id), rot = turnable(d) ? this.rot || 0 : 0, F = furnWH(d, rot);
        const x = tx - Math.floor((F.w - 1) / 2);
        const y = d.kind === 'wall' ? 0 : ty - (F.h - 1);
        const spot = this.fit(id, x, y, undefined, rot);
        if (!spot) { Sfx.ui('nope'); return false; }
        if (!this.takeOne(id)) { this.held = null; this.render(); return false; }
        // (a piece that was picked up goes back as itself: a room's counter keeps what it does)
        const it = this.heldIt && this.heldIt.id === id ? Object.assign(this.heldIt, { x: spot.x, y: spot.y }) : { id, x: spot.x, y: spot.y, flip: false };
        this.heldIt = null;
        if (rot) it.rot = rot; else delete it.rot;
        if (spot.on != null) it.on = spot.on; else delete it.on;
        this.mark();
        this.list().push(it);
        Sfx.play('place');
        const left = this.owned()[artBase(id)] || 0;
        if (!left || this.design) this.held = null;
        this.refresh();
        Bus.emit('decorated');
        return true;
    },
    tap(px, py) {
        const [tx, ty] = this.tileAt(px, py);
        if (this.held) { this.place(tx, ty); return; }
        // select topmost furniture under the tap
        const items = this.list();
        let found = null;
        for (let i = items.length - 1; i >= 0; i--) {
            const it = items[i], d = furnDef(it.id), F = furnWH(d, it.rot);
            const h = d.kind === 'wall' ? 2 : F.h;
            const y0 = d.kind === 'wall' ? 0 : it.y;
            if (tx >= it.x && tx < it.x + F.w && ty >= y0 && ty < y0 + h) {
                if (found == null || (d.kind === 'top' && furnDef(items[found].id).kind !== 'top') || furnDef(items[found].id).kind === 'rug') found = i;
            }
        }
        this.sel = found;
        this.cursor = [tx, ty];
        if (found != null) Sfx.ui('tick');
        this.render();
    },
    key(code) {
        const c = this.cursor;
        if (code === 'ArrowLeft' || code === 'KeyA') c[0]--;
        else if (code === 'ArrowRight' || code === 'KeyD') c[0]++;
        else if (code === 'ArrowUp' || code === 'KeyW') c[1]--;
        else if (code === 'ArrowDown' || code === 'KeyS') c[1]++;
        else if (isA(code)) { this.tap((c[0] + 0.5) * TILE, (c[1] + 0.5) * TILE); return; }
        else if (code === 'KeyF' && this.sel != null) { const it = this.list()[this.sel]; this.mark(); it.flip = !it.flip; this.refresh(); return; }
        else if (code === 'KeyR') { this.turn(); return; }
        else if ((code === 'Backspace' || code === 'Delete') && this.sel != null) { this.store(this.sel); return; }
        else if (code === 'Escape') { if (this.held || this.sel != null) { this.unhold(); this.held = null; this.sel = null; this.render(); } else this.exit(); return; }
        const a = G.area;
        c[0] = clamp(c[0], a.floor.x0, a.floor.x0 + a.floor.w - 1);
        c[1] = clamp(c[1], 0, a.floor.y0 + a.floor.h - 1);
    },
    /* where the piece in hand would go with the cursor at (cx, cy), turned as it is: its tiles and whether it fits */
    ghost(cx, cy) {
        if (!this.held) return null;
        const d = furnDef(this.held), rot = turnable(d) ? this.rot || 0 : 0, F = furnWH(d, rot);
        const x = cx - Math.floor((F.w - 1) / 2), y = d.kind === 'wall' ? 0 : cy - (F.h - 1);
        return { d, F, rot, x, y, w: F.w, h: d.kind === 'wall' ? 2 : F.h, ok: this.fit(this.held, x, y, undefined, rot) };
    },
    /* the tiles of the piece picked in the room */
    selRect() {
        const it = this.sel != null && this.list()[this.sel];
        if (!it) return null;
        const d = furnDef(it.id), F = furnWH(d, it.rot);
        return { x: it.x, y: d.kind === 'wall' ? 0 : it.y, w: F.w, h: d.kind === 'wall' ? 2 : F.h };
    },
    /* a quarter turn (David, 28 October: furniture faces any of the four ways): the piece in hand, or the one picked if it
       still fits turned where it stands */
    turn() {
        if (this.held) { if (!turnable(furnDef(this.held))) return; this.rot = ((this.rot || 0) + 1) & 3; Sfx.ui('tick'); this.render(); return; }
        const it = this.sel != null && this.list()[this.sel], d = it && furnDef(it.id);
        if (!turnable(d)) return;
        const rot = ((it.rot || 0) + 1) & 3;
        if (!this.fit(it.id, it.x, it.y, this.sel, rot)) { Sfx.ui('nope'); UI.toast("There isn't room to turn it there."); return; }
        this.mark();
        if (rot) it.rot = rot; else delete it.rot;
        Sfx.ui('tick');
        this.refresh();
    },
    /* the same in the 3D view: the grid, where the piece in hand would go (a see-through copy of it there, EnvRoom.ghost)
       and the piece picked, each drawn on the floor where it lies */
    draw3d(ctx) {
        const a = G.area, f = a.floor, P = (x, y, lift) => R3.project(x * TILE, y * TILE, lift || 0);
        const quad = (x, y, w, h, fill, stroke, lift) => {
            const c = [P(x, y, lift), P(x + w, y, lift), P(x + w, y + h, lift), P(x, y + h, lift)];
            ctx.beginPath(); c.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.closePath();
            if (fill) { ctx.fillStyle = fill; ctx.fill(); }
            if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2.5; ctx.stroke(); }
        };
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = f.x0; x <= f.x0 + f.w; x++) { const p0 = P(x, f.y0), p1 = P(x, f.y0 + f.h); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); }
        for (let y = f.y0; y <= f.y0 + f.h; y++) { const p0 = P(f.x0, y), p1 = P(f.x0 + f.w, y); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); }
        ctx.stroke();
        const [cx, cy] = this.hover || this.cursor, g = this.ghost(cx, cy);
        // (what hangs on the wall: its strip along the foot of the back wall)
        if (g) quad(g.x, g.d.kind === 'wall' ? f.y0 : g.y, g.w, g.d.kind === 'wall' ? 0.3 : g.h, g.ok ? 'rgba(140,193,82,0.38)' : 'rgba(224,64,90,0.4)', g.ok ? 'rgba(90,150,50,0.9)' : 'rgba(200,40,60,0.9)');
        else {
            const r = this.selRect(), d = r && furnDef(this.list()[this.sel].id);
            if (r) quad(r.x, d.kind === 'wall' ? f.y0 : r.y, r.w, d.kind === 'wall' ? 0.3 : r.h, 'rgba(255,207,87,0.22)', '#ffcf57');
            else if (!G.touchUsed) quad(cx, cy, 1, 1, null, 'rgba(255,207,87,0.85)');
        }
        ctx.restore();
    },
    draw(ctx) {
        if (!this.on) return;
        const a = G.area, f = a.floor;
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 1;
        for (let x = f.x0; x <= f.x0 + f.w; x++) { ctx.beginPath(); ctx.moveTo(x * TILE + 0.5, 0); ctx.lineTo(x * TILE + 0.5, (f.y0 + f.h) * TILE); ctx.stroke(); }
        for (let y = f.y0; y <= f.y0 + f.h; y++) { ctx.beginPath(); ctx.moveTo(f.x0 * TILE, y * TILE + 0.5); ctx.lineTo((f.x0 + f.w) * TILE, y * TILE + 0.5); ctx.stroke(); }
        const [cx, cy] = this.hover || this.cursor;
        const g = this.ghost(cx, cy);
        if (g) {
            ctx.fillStyle = g.ok ? 'rgba(140,193,82,0.35)' : 'rgba(224,64,90,0.35)';
            ctx.fillRect(g.x * TILE, g.y * TILE, g.w * TILE, g.h * TILE);
            ctx.globalAlpha = 0.75;
            const d = g.d, lift = g.ok && g.ok.on != null ? surfaceLift(this.list()[g.ok.on]) : 0;
            const fy = d.kind === 'wall' ? WALL_ROWS * TILE - 5 : (g.y + g.F.h) * TILE - 1 - lift;
            spr(ctx, d.frame || 'f_' + this.held, (g.x + g.F.w / 2) * TILE, fy);
            ctx.globalAlpha = 1;
        } else {
            ctx.strokeStyle = '#ffcf57';
            ctx.lineWidth = 2;
            const r = this.selRect();
            if (r) ctx.strokeRect(r.x * TILE + 1, r.y * TILE + 1, r.w * TILE - 2, r.h * TILE - 2);
            else if (!G.touchUsed) ctx.strokeRect(cx * TILE + 1, cy * TILE + 1, TILE - 2, TILE - 2);
        }
    },
};

/* ---------------------------------------------------------------- the club room */
function buildClubContents(a) {
    const f = a.floor;
    // DJ booth
    const booth = a.add({ kind: 'booth', frame: 'f_turntables', x: 7.5 * TILE, y: 3 * TILE + 4 });
    for (let x = 6; x <= 8; x++) a.block(x, 2);
    booth.sy = 3 * TILE - 2;
    for (const [x, fr] of [[2, 'f_speaker'], [12, 'f_speaker']]) {
        a.add({ kind: 'deco', frame: fr, x: (x + 0.5) * TILE, y: 3 * TILE - 1 });
        a.block(x, 2);
    }
    a.add({ kind: 'deco', frame: 'f_neon_sign', x: 4 * TILE, y: WALL_ROWS * TILE - 5, layer: 0 });
    a.add({ kind: 'deco', frame: 'f_neon_sign', x: 11 * TILE, y: WALL_ROWS * TILE - 5, layer: 0 });
    const ball = a.add({ kind: 'deco', frame: 'f_disco_ball', x: 7.5 * TILE, y: 24, layer: 2, light: { r: 60, y: 0 } });
    ball.def = furnDef('disco_ball');
    ball.draw = ctx => drawAnimatedFurn(ctx, ball);
    for (let y = 2; y <= 3; y++) { a.block(1, y); a.block(13, y); }
    a.drawUnder = ctx => {
        // the dance floor
        const cols = ['#ff5aa8', '#4ec3d9', '#ffd84a', '#8cc152', '#b37cf0'];
        const night = G.lamps > 0.3 || Dance.on;
        for (let y = 5; y <= 8; y++) for (let x = 4; x <= 10; x++) {
            const k = (x + y + (G.t >> (Dance.on ? 3 : 5))) % cols.length;
            ctx.fillStyle = night ? cols[k] : '#4a3a5a';
            ctx.globalAlpha = night ? 0.75 : 1;
            ctx.fillRect(x * TILE + 1, y * TILE + 1, TILE - 2, TILE - 2);
        }
        ctx.globalAlpha = 1;
    };
}

/* free floor tiles for guests, nearest the middle of the room, never stacked in front of each other */
function openSpots(a, count, nearX, nearY) {
    const f = a.floor, p = G.player;
    const px = Math.floor(p.x / TILE), py = Math.floor((p.y - 2) / TILE);
    const taken = [[px, py]];
    const cands = [];
    for (let y = f.y0; y < f.y0 + f.h; y++) for (let x = f.x0; x < f.x0 + f.w; x++) {
        if (a.blockedAt(x, y)) continue;
        if (a.doorTile && x === a.doorTile[0] && y >= a.doorTile[1] - 1) continue;
        const hidden = y + 1 < f.y0 + f.h && a.blockedAt(x, y + 1);     // furniture right in front would hide them
        cands.push([x, y, Math.hypot(x - nearX, (y - nearY) * 1.4) + (hidden ? 20 : 0)]);
    }
    cands.sort((q, r) => q[2] - r[2]);
    const out = [];
    for (const [x, y] of cands) {
        if (taken.some(([tx, ty]) => (tx === x && Math.abs(ty - y) <= 1) || (Math.abs(tx - x) + Math.abs(ty - y) < 2))) continue;
        out.push([x, y]);
        taken.push([x, y]);
        if (out.length >= count) break;
    }
    while (out.length < count) out.push([f.x0 + out.length, f.y0 + f.h - 1]);
    return out;
}

