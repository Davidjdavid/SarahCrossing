/* ---- 25_house.js ---- */
/* Sarah's house: room drawing, furniture, decorating, and the club room */
const WALL_ROWS = 2;
function buildRoomBg(a) {
    const c = document.createElement('canvas');
    c.width = a.w * TILE; c.height = a.h * TILE;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
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
    a.bg = c;
}

/* furniture definition; food can sit on tables as decoration */
function furnDef(id) {
    if (FURN[id]) return FURN[id];
    const it = ITEMS[id];
    if (it && ['dish', 'fruit', 'veg'].includes(it.type)) return { id, name: it.name, w: 1, h: 1, kind: 'top', sets: ['food'], food: 1, frame: it.icon };
    if (it && it.type === 'flower') return { id, name: it.name + ' vase', w: 1, h: 1, kind: 'top', sets: ['flower'], flower: 1, frame: it.icon };
    return null;
}
function furnFootprint(it) {
    const d = furnDef(it.id);
    return { w: d.w, h: d.kind === 'wall' ? 1 : d.kind === 'top' ? 1 : d.h, kind: d.kind };
}

/* turn a room's item list (Sarah's house: S.house.items) into entities */
function placeFurniture(a, items) {
    const list = items || (a.id === 'home' ? S.house.items : a.items || []);
    a.ents = a.ents.filter(e => !e.furn);
    a.decals = [];
    const f = a.floor;
    // reset floor blocking
    for (let y = f.y0; y < f.y0 + f.h; y++) for (let x = f.x0; x < f.x0 + f.w; x++) a.block(x, y, 0);
    const surfaceAt = {};
    list.forEach((it, idx) => {
        const d = furnDef(it.id);
        if (!d) return;
        const ent = { furn: true, idx, item: it, def: d, flip: !!it.flip, frame: d.frame || 'f_' + it.id };
        const px = (it.x + d.w / 2) * TILE;
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
            const h = d.kind === 'top' ? 1 : d.h;
            ent.x = px; ent.y = (it.y + h) * TILE - 1; ent.sy = ent.y;
            for (let y = it.y; y < it.y + h; y++) for (let x = it.x; x < it.x + d.w; x++) a.block(x, y, 1);
            ent.hit = { x: it.x * TILE, y: it.y * TILE - 12, w: d.w * TILE, h: h * TILE + 12 };
            if (d.surface) for (let x = it.x; x < it.x + d.w; x++) surfaceAt[`${x},${it.y + h - 1}`] = idx;
        }
        if (d.light) ent.light = { r: d.light, y: -12 };
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
    const n = d.name;
    const t = Clock.fmt().s;
    const lines = {
        bed_simple: [`Sarah isn't sleepy. It's only ${t}.`], cloud_bed: [`The weighted blanket is calling. Sarah is not ready to answer. It's only ${t}.`],
        clock_wall: [`The clock says ${t}. (You can set it in Settings, if the island's clock ever feels off.)`],
        nameplate: ['SARAH \u00b7 HARVARD \u00b7 TITLE: (smudged)'], diploma: ['A diploma. The job title part is smudged. It is always smudged.'],
        dnd_sign: ['DO NOT DISTURB BEFORE NOON. This is legally binding. John checked.'],
        blackout_curtains: ['Blackout curtains. The single most important object on the island.'],
        goat_statue: ["It's a goat statue. Nothing else to say."], party_console: ['A party game console. David always wins. Nobody knows how.'],
        jackbox_trophy: ['GAME NIGHT CHAMPION: DAVID. Engraved. Pre-engraved, actually.'],
        contract_frame: ['"SIBLINGS IN LAW." Signed by everyone. John billed everyone for it.'],
        golf_bag: ["James's old golf bag. It still has a scorecard in it. Every hole says FORE."],
        coffee_maker: ["The coffee maker has a timer. It's set for 11 AM. That's early."],
        framed_poem: [rpick(JOE_FRAMED)], sonnet_stack: ["A stack of Joe's poems. The top one is about a frog. So is the second one. Coco calls it 'generational wealth.'"],
        typewriter: ['Joe left a poem in the typewriter: "I have a spoon. / It is not the moon. / I will write more soon." It is signed "Joe (Poet)."'],
        light_floor: ['Sarah does a little shimmy on the light-up floor. The house is now a club.'],
        star_jar: ['A jar of star fragments. Wishes, basically. Very sparkly wishes.'],
        plaque_gold: ['THE CUTEST HOUSE ON THE ISLAND. Signed: Sir Floret, Dame Stalk, Little Sprout.'],
        trophy_arcade: ['ARCADE CHAMPION. Chili cried a little when he handed it over. Hot tears.'],
        trophy_rope: ["JUMP ROPE CHAMPION. It's made from a water bottle. Cuke says that makes it more meaningful."],
        trophy_karaoke: ['KARAOKE STAR. Joe wrote a poem about it. It is about a microphone. It is perfect.'],
        snack_machine: ['Hot chips. Only hot chips. Chili restocks it somehow, even here.'],
        arcade_stool: ['A bright pink arcade stool. It spins. Sarah spins.'],
        neon_game: ['GAME ON. It buzzes a little. Cozy buzzing.'],
    }[d.id];
    if (d.photo) {
        const who = d.photo;
        await UI.say(null, `${NPC_DEFS[who] ? NPC_DEFS[who].name : 'Joe'}'s photo. On the back it says: "${PHOTO_NOTES[who] || 'Love you!'}"`);
        return;
    }
    await UI.say(null, lines || [`A lovely ${n.toLowerCase()}.`]);
}

/* ---------------------------------------------------------------- decorating */
const Decor = {
    on: false, held: null, sel: null, cursor: [2, 3], tab: 'furniture',
    async enter() {
        if (G.area.id !== 'home' || this.on) return;
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
        this.on = false; G.decor = false;
        this.held = null; this.sel = null;
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
    owned() {
        const out = {};
        const ok = t => ['furniture', 'wall', 'floor', 'dish', 'fruit', 'veg', 'flower', 'art'].includes(t);
        for (const s of S.pocket) if (s && ok(ITEMS[s.id].type)) out[s.id] = (out[s.id] || 0) + s.n;
        for (const [id, n] of Object.entries(S.storage)) if (ITEMS[id] && ok(ITEMS[id].type)) out[id] = (out[id] || 0) + n;
        return out;
    },
    takeOne(id) {
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
        head.innerHTML = `<h2>Decorating</h2>`;
        const done = document.createElement('button');
        done.className = 'btn green'; done.type = 'button'; done.textContent = 'Done';
        done.addEventListener('click', () => this.exit());
        head.appendChild(done);
        panel.appendChild(head);
        const info = document.createElement('div');
        info.className = 'muted';
        info.style.padding = '0 18px 8px';
        const selIt = this.sel != null ? S.house.items[this.sel] : null;
        info.textContent = this.held ? `Placing: ${itemName(this.held)}. Tap a spot in the room.${G.touchUsed ? '' : ' (Arrows + Enter, F to flip, Esc to cancel)'}`
            : selIt ? `${itemName(selIt.id)} selected.` : 'Tap furniture in the room to move it, or pick something below to place it.';
        panel.appendChild(info);
        if (selIt) {
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;gap:8px;padding:0 18px 10px;flex-wrap:wrap';
            const mk = (label, fn, cls) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ' + (cls || ''); b.textContent = label; b.addEventListener('click', fn); row.appendChild(b); };
            mk('Move', () => this.pickUpPlaced(this.sel));
            if (furnDef(selIt.id).kind !== 'wall') mk('Flip', () => { selIt.flip = !selIt.flip; this.refresh(); }, 'alt');
            mk('Put away', () => this.store(this.sel), 'alt');
            panel.appendChild(row);
        }
        const tabs = document.createElement('div');
        tabs.className = 'tabs';
        for (const [k, label] of [['furniture', 'Furniture'], ['food', 'Tabletop'], ['wall', 'Wallpaper'], ['floor', 'Flooring']]) {
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
        const tabOf = id => ['dish', 'fruit', 'veg', 'flower'].includes(ITEMS[id].type) ? 'food' : ITEMS[id].type === 'art' ? 'furniture' : ITEMS[id].type;
        const ids = Object.keys(owned).filter(id => tabOf(id) === this.tab).sort();
        if (!ids.length) {
            const p = document.createElement('p');
            p.className = 'muted';
            p.textContent = this.tab === 'furniture' ? "No furniture in storage. Fortune's shop has new pieces every day." : this.tab === 'food' ? 'Dishes, fruit, veggies and picked flowers can go on tables as decorations. Little Sprout loves that.' : `No spare ${this.tab === 'wall' ? 'wallpaper' : 'flooring'} yet. Fortune stocks one a day.`;
            body.appendChild(p);
        }
        for (const id of ids) {
            const b = document.createElement('button');
            b.type = 'button'; b.className = 'slot' + (this.held === id ? ' sel' : '');
            b.title = itemName(id);
            b.setAttribute('aria-label', itemName(id));
            b.appendChild(iconCanvas(itemIcon(id), 48));
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
        const t = ITEMS[id].type;
        if (t === 'wall' || t === 'floor') {
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
        this.held = this.held === id ? null : id;
        this.sel = null;
        this.render();
    },
    refresh() { placeFurniture(G.area); Save.touch(); this.render(); },
    pickUpPlaced(i) {
        const it = S.house.items[i];
        if (!it) return;
        this.removeAt(i);
        toStorage(it.id, 1);
        this.held = it.id;
        this.sel = null;
        this.refresh();
    },
    store(i) {
        const it = S.house.items[i];
        if (!it) return;
        this.removeAt(i);
        toStorage(it.id, 1);
        this.sel = null;
        Sfx.play('pick');
        this.refresh();
    },
    removeAt(i) {
        // anything sitting on it goes to storage too
        const items = S.house.items;
        for (let k = items.length - 1; k >= 0; k--) if (items[k].on === i) { toStorage(items[k].id, 1); items.splice(k, 1); if (k < i) i--; }
        items.splice(i, 1);
        for (const it of items) if (it.on != null && it.on > i) it.on--;
    },
    /* can `id` go with its top-left at tile (x, y)? returns placement or null */
    fit(id, x, y, ignore) {
        const d = furnDef(id), a = G.area, f = a.floor;
        const items = S.house.items;
        const occ = (kind) => {
            const m = new Set();
            items.forEach((it, i) => {
                if (i === ignore) return;
                const dd = furnDef(it.id);
                if (!dd || dd.kind !== kind && !(kind === 'floor' && dd.kind === 'top' && it.on == null)) return;
                const h = dd.kind === 'wall' || dd.kind === 'top' ? 1 : dd.h;
                for (let yy = it.y; yy < it.y + h; yy++) for (let xx = it.x; xx < it.x + dd.w; xx++) m.add(`${xx},${yy}`);
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
        const d = furnDef(id);
        const x = tx - Math.floor((d.w - 1) / 2);
        const y = d.kind === 'wall' ? 0 : ty - ((d.kind === 'top' ? 1 : d.h) - 1);
        const spot = this.fit(id, x, y);
        if (!spot) { Sfx.ui('nope'); return false; }
        if (!this.takeOne(id)) { this.held = null; this.render(); return false; }
        const it = { id, x: spot.x, y: spot.y, flip: false };
        if (spot.on != null) it.on = spot.on;
        S.house.items.push(it);
        Sfx.play('place');
        const left = this.owned()[id] || 0;
        if (!left) this.held = null;
        this.refresh();
        Bus.emit('decorated');
        return true;
    },
    tap(px, py) {
        const [tx, ty] = this.tileAt(px, py);
        if (this.held) { this.place(tx, ty); return; }
        // select topmost furniture under the tap
        const items = S.house.items;
        let found = null;
        for (let i = items.length - 1; i >= 0; i--) {
            const it = items[i], d = furnDef(it.id);
            const h = d.kind === 'wall' ? 2 : d.kind === 'top' ? 1 : d.h;
            const y0 = d.kind === 'wall' ? 0 : it.y;
            if (tx >= it.x && tx < it.x + d.w && ty >= y0 && ty < y0 + h) {
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
        else if (code === 'KeyF' && this.sel != null) { const it = S.house.items[this.sel]; it.flip = !it.flip; this.refresh(); return; }
        else if ((code === 'Backspace' || code === 'Delete') && this.sel != null) { this.store(this.sel); return; }
        else if (code === 'Escape') { if (this.held || this.sel != null) { this.held = null; this.sel = null; this.render(); } else this.exit(); return; }
        const a = G.area;
        c[0] = clamp(c[0], a.floor.x0, a.floor.x0 + a.floor.w - 1);
        c[1] = clamp(c[1], 0, a.floor.y0 + a.floor.h - 1);
    },
    draw(ctx) {
        if (!this.on) return;
        const a = G.area, f = a.floor;
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 1;
        for (let x = f.x0; x <= f.x0 + f.w; x++) { ctx.beginPath(); ctx.moveTo(x * TILE + 0.5, 0); ctx.lineTo(x * TILE + 0.5, (f.y0 + f.h) * TILE); ctx.stroke(); }
        for (let y = f.y0; y <= f.y0 + f.h; y++) { ctx.beginPath(); ctx.moveTo(f.x0 * TILE, y * TILE + 0.5); ctx.lineTo((f.x0 + f.w) * TILE, y * TILE + 0.5); ctx.stroke(); }
        const [cx, cy] = this.hover || this.cursor;
        if (this.held) {
            const d = furnDef(this.held);
            const x = cx - Math.floor((d.w - 1) / 2);
            const y = d.kind === 'wall' ? 0 : cy - ((d.kind === 'top' ? 1 : d.h) - 1);
            const ok = this.fit(this.held, x, y);
            const h = d.kind === 'wall' ? 2 : d.kind === 'top' ? 1 : d.h;
            ctx.fillStyle = ok ? 'rgba(140,193,82,0.35)' : 'rgba(224,64,90,0.35)';
            ctx.fillRect(x * TILE, y * TILE, d.w * TILE, h * TILE);
            ctx.globalAlpha = 0.75;
            const lift = ok && ok.on != null ? surfaceLift(S.house.items[ok.on]) : 0;
            const fy = d.kind === 'wall' ? WALL_ROWS * TILE - 5 : (y + (d.kind === 'top' ? 1 : d.h)) * TILE - 1 - lift;
            spr(ctx, d.frame || 'f_' + this.held, (x + d.w / 2) * TILE, fy);
            ctx.globalAlpha = 1;
        } else {
            ctx.strokeStyle = '#ffcf57';
            ctx.lineWidth = 2;
            if (this.sel != null && S.house.items[this.sel]) {
                const it = S.house.items[this.sel], d = furnDef(it.id);
                const h = d.kind === 'wall' ? 2 : d.kind === 'top' ? 1 : d.h;
                ctx.strokeRect(it.x * TILE + 1, (d.kind === 'wall' ? 0 : it.y) * TILE + 1, d.w * TILE - 2, h * TILE - 2);
            } else if (!G.touchUsed) ctx.strokeRect(cx * TILE + 1, cy * TILE + 1, TILE - 2, TILE - 2);
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
    a.add({ kind: 'deco', frame: 'f_neon_sign', x: 11 * TILE, y: WALL_ROWS * TILE - 5, layer: 0, flip: true });
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

