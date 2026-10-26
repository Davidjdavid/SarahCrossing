/* ---- 90_main.js ---- */
/* Boot, title, intro, the main loop, and input */
const STARTER_HOUSE = [
    { id: 'bed_simple', x: 1, y: 2 }, { id: 'kitchenette', x: 5, y: 2 }, { id: 'rug_round', x: 3, y: 3 },
    { id: 'lamp_floor', x: 7, y: 2 }, { id: 'dresser', x: 5, y: 5 }, { id: 'chair_wood', x: 3, y: 2 }, { id: 'laptop', x: 5, y: 5, on: 4 },
];

/* the test area's island (?lab): a fresh one each visit, standing on the cobbles in front of the cottage */
function labState() {
    const st = newState();
    st.started = true; st.flags.introDone = true; st.flags.metJoe = true;
    st.islandName = 'the test area'; st.birthday = { m: 3, d: 14 };
    st.house.items = STARTER_HOUSE.map(o => Object.assign({ flip: false }, o));
    st.day = Clock.dayNum(); st.startDay = st.day;
    for (const id of ['joe', 'maki', 'fortune']) st.npcs[id] = { met: true, pts: 40, talkDay: -1, giftDay: -1, gifts: 0, favor: null, photo: false, letter: false, last: '' };
    st.player.x = 26.8 * TILE; st.player.y = 27.0 * TILE; st.player.dir = 'down';
    return st;
}
function initWorld() {
    applyBuildingMoves();
    G.weather = todayWeather();
    G.events = todayEvents();
    G.areas = {};
    G.areas.island = buildIsland();
    restoreDrops(G.areas.island);
    spawnShells(G.areas.island);
    decorateIsland(G.areas.island);
    NPCs.init();
}

async function boot(hotData) {
    Zoom.load();
    Render.init();
    R3.load();
    if (R3.want) R3.init();
    Audio2.loadPrefs();
    const opening = LAB ? Promise.resolve(null) : Cloud.boot();          // the island, from the server, while the pictures load
    await Assets.load();
    fillIcons(document);
    const hot = window.claude && window.claude.hot;
    const hotState = hotData && hotData.state;
    const opened = await opening;
    // a visitor sees Sarah's handmade things (in her house, in the museum) too
    if (Online.visitor() && Online.island) for (const f of [registerAllPottery, registerAllArt, registerAllDesigns]) { try { f(Online.island); } catch (e) { console.error('Sarah\'s things:', f.name, e); } }
    S = LAB ? labState() : (hotState && migrate(hotState)) || Save.load(opened && opened.state) || newState();
    // an island that won't load stays untouched on the server; this device starts fresh instead of saving over it
    if (opened && !S.started) { Cloud.broken = Cloud.island || { summary: { islandName: opened.state.islandName } }; Save.wipe(); }
    if (!S.started) S = newState();
    if (!LAB) {
        Cloud.ready();
        Cloud.loadPhotos();
        Online.connect();
        Online.fetchMail();
    }
    initWorld();
    G.player = makePlayer(S.player.x, S.player.y, S.player.dir);
    G.area = G.areas.island;
    bindInput();
    try { if (hot && hot.snapshot) hot.snapshot(() => ({ state: S && S.started ? S : null })); } catch (e) { /* optional */ }
    if (LAB) continueGame(); else showTitle();
    requestAnimationFrame(loop);
    if (DEBUG) window.__dbg = {
        /* a civic screen in one of its states (6zd_civic_screens.js) */
        civic(id, state) { return civicScreen(id, state); },
        quickStart(opts) {
            opts = opts || {};
            Save.wipe();
            S = newState();
            S.started = true; S.flags.introDone = true; S.flags.metJoe = true;
            S.islandName = 'Night Owl Isle'; S.birthday = opts.birthday || { m: 3, d: 14 };
            S.house.items = STARTER_HOUSE.map(o => Object.assign({ flip: false }, o));
            S.day = Clock.dayNum(); S.startDay = S.day;
            rel('joe').met = true; rel('fortune').met = true;
            initWorld();
            G.player = makePlayer((W0.spots.plaza.x + 0.5) * TILE, (W0.spots.plaza.y + 3.6) * TILE, 'down');
            S.player.x = G.player.x; S.player.y = G.player.y; S.player.area = 'island';
            return continueGame();
        },
        setTime(month, day, hour) {
            // make island time = given date/hour (this year)
            const now = Date.now();
            const isl = new Date(now - 3 * 3600e3);
            const want = new Date(isl.getFullYear(), month - 1, day, Math.floor(hour), Math.round((hour % 1) * 60), 0);
            Clock.offsetMs = want.getTime() - isl.getTime();
            G.weather = todayWeather(); G.events = todayEvents();
            if (G.areas.island.bgSeason !== Clock.season()) { G.areas.island = buildIsland(); restoreDrops(G.areas.island); spawnShells(G.areas.island); if (G.area.id === 'island') G.area = G.areas.island; }
            decorateIsland(G.areas.island);
            NPCs.place(true); Music.update(true); HUD.update();
        },
        teleport(area, tx, ty, dir) {
            if (!area) { console.warn('teleport: nowhere to go'); return; }
            if (area !== G.area.id) setArea(area, (tx + 0.5) * TILE, (ty + 0.6) * TILE, dir || 'down');
            const p = G.player; p.x = (tx + 0.5) * TILE; p.y = (ty + 0.6) * TILE; p.dir = dir || 'down';
            updateCam(true);
        },
        give(id, n) { addItem(id, n || 1, true); },
        /* stand at a named place: a spot (plaza, pier...) or just outside a building's door */
        at(name, dir) {
            if (W0.buildings[name]) { const [tx, ty] = doorTileOf(name); this.teleport('island', tx, ty, dir || 'up'); return [tx, ty]; }
            const s = W0.spots[name];
            if (!s) return null;
            const f = G.areas.island.nearestFree(s.x, s.y, 4) || [s.x, s.y];
            this.teleport('island', f[0], f[1], dir || 'down');
            return f;
        },
        /* a spot on the beach right above the water, for fishing */
        fishSpot() {
            const a = G.areas.island;
            for (let y = 60; y < a.h - 2; y++) for (let x = 20; x < a.w - 20; x++)
                if (!a.blockedAt(x, y) && a.waterAt(x, y + 1) === 's' && a.waterAt(x, y + 2) === 's' && !a.waterAt(x, y)) return [x, y];
            return null;
        },
        /* arcade: play a cabinet right now (no fee), hand out tickets, skip to the end of a game */
        arcade(id, opts) { Arcade.start(id, opts || {}); return Arcade.on; },
        tickets(n) { addTickets(n || 0, true); return arc().tickets; },
        rope() { const tw = Rope.turners(); if (!tw) return false; Rope.start(tw); return true; },
        /* a game with a neighbor (6zw/6zx): tag, hide (mode 'hide' or 'seek'), derby, volley, snowball */
        islandGame(kind, id, mode) { const n = NPCs.get(id); if (!n) return false; IslandGames.start(kind, n, mode); return true; },
        karaoke(title) { const poem = JOE_POEMS.concat([JOE_SUNSET_POEM]).find(p => p[0] === title) || JOE_POEMS[0]; Karaoke.start(poem); return poem[0]; },
        /* a finished pottery piece from a hand-building template, straight into the pocket */
        potPiece(kind, glaze) {
            const t = GD.potTemplates[kind || 'frog'], id = newPieceId();
            const mask = t.rows.map(r => r.padEnd(POT_W, '.')).join('');
            const p = { id, kind: kind || 'frog', base: t.name, name: t.name, h: t.rows.length, mask, glaze: mask.replace(/[^.]/g, glaze || 'c').replace(/\./g, '0'),
                state: 'done', big: !!t.big, stars: 2, finish: 'gloss', auto: true };
            savePiece(p); addItem(id, 1, true); return id;
        },
        /* pottery: everything in the kiln is done now */
        kilnDone() { for (const k of pottery().kiln) k.ready = 0; potteryTick(); return pottery().kiln.length; },
        /* one of the siblings is visiting today */
        sibling(who, days) {
            const day = Clock.dayNum();
            visitStart.forced = {};
            for (const id of VISITORS) for (let d0 = day - VISIT_MAX_DAYS; d0 <= day; d0++) visitStart.forced[id + ':' + d0] = null;
            if (who) visitStart.forced[who + ':' + day] = { who, day, days: days || 1, arrive: 10, leave: 25.5 };
            visitOf.cache = {}; tentOf.cache = {}; Plans.reset(); NPCs.place(true); return visitingToday(); },
        /* a neighbor knocks on Sarah's door right now */
        visit(who) { S.visit = { day: Clock.dayNum(), who, at: dayHour() - 0.01, state: 'pending' }; Visits.check(); return S.visit.state; },
        /* walk straight into a room (no knocking, no opening hours) */
        enter(id) { const a = ensureArea(id); setArea(id, (a.doorTile[0] + 0.5) * TILE, (a.doorTile[1] - 0.2) * TILE, 'up'); updateCam(true); return [a.w, a.h]; },
        weather(w) { G.weather = w; Weather.parts = []; },
        /* somebody loses something right now: lost('coco', 'diary', {area: 'barn', x, y}) */
        lost(owner, kind, where) { const L = lostState(); L.cur = null; L.last = 0; lostDaily(Clock.dayNum(), { owner, kind, where }); return L.cur; },
        /* move the clock without teleporting anyone (they walk, like normal) */
        nudge(hours) { Clock.offsetMs += hours * 3600e3; },
        /* same island day, different hour (5 AM..5 AM) */
        hour(h) { Clock.offsetMs += (dayHour(h) - dayHour()) * 3600e3; G.weather = todayWeather(); NPCs.place(true); HUD.update(); },
        /* storylines: start one on purpose, and push days forward */
        drama(tpl, cast) { if (S.drama) S.drama.cur = null; const d = Drama.begin(mulberry(1), { tpl, cast }); Plans.reset(); NPCs.place(true); return d && { tpl: d.tpl, state: d.state, cast: d.cast, gossipers: d.gossipers }; },
        nextDay(n) {
            for (let i = 0; i < (n || 1); i++) {
                Clock.offsetMs += 864e5;
                dailyCheck();
            }
            G.weather = todayWeather(); G.events = todayEvents();
            Plans.reset(); NPCs.place(true);
            const d = Drama.cur();
            return d ? { tpl: d.tpl, state: d.state, day: Clock.dayNum() - d.start } : null;
        },
    };
    if (DEBUG) window.__game = { G, get S() { return S; }, Clock, NPCs, Save, Decor, Dance, Fishing, Music, Audio2, Photo, UI, councilScore, setArea, addItem, receive, Drama, Plans, ROOMS, ensureArea, Studio, Wheel, Sculpt, Glaze,
        Arcade, ARCADE_GAMES, arc, Rope, ropeDay, Karaoke, karaokeSong,
        startNew, continueGame, dailyCheck, spawnShells, buildIsland, initWorld, Sky, pressA, walkTo, approach, frontTarget, rel, hearts, addPts, birthdayParty, openPocket, openPhone, openApp, fortuneTalk, talkTo, Weather, todayWeather };
}

/* ---------------------------------------------------------------- title */
function showTitle() {
    G.mode = 'title';
    const t = $('#title');
    t.hidden = false;
    HUD.show(false);
    const b = $('#tbtns');
    b.innerHTML = '';
    const has = S && S.started;
    // the islands live online: new islands, switching and backups are in Islands (6x_islands.js)
    const visitor = Online.visitor(), nm = Online.name(Online.who());
    if (visitor) {
        // a visitor plays on Sarah's island; only she starts islands or brings them in
        if (has) b.appendChild(btn('Continue', 'green', () => continueGame()));
        if (Cloud.list.length > 1) b.appendChild(btn('Islands', 'alt', () => IslandList.open()));
    } else {
        if (has) b.appendChild(btn('Continue', 'green', () => continueGame()));
        else b.appendChild(btn('Start', 'green', () => startNew()));
        if (has || Cloud.list.length) b.appendChild(btn('Islands', 'alt', () => IslandList.open()));
        b.appendChild(btn('Import a save', 'alt', () => IslandList.importPanel()));
    }
    b.appendChild(btn(Online.me ? 'Change player' : "Who's playing?", 'alt', () => IslandList.who()));
    $('#ttag').textContent = visitor ? (has ? `Welcome to ${S.islandName}, ${nm}! It's ${Clock.fmt().s} here.` : `Hi ${nm}! Sarah hasn't started her island yet. Check back soon!`)
        : has ? `Welcome back to ${S.islandName}. It's ${Clock.fmt().s} here.` : 'An island that runs on Sarah time.';
    IslandList.syncNote();
    if (Cloud.fork) IslandList.fork();
    else if (!Online.me) IslandList.who();
    // drift the camera over the island behind the title
    G.titleCam = { t: 0 };
}
function hideTitle() { $('#title').hidden = true; G.titleCam = null; }

async function continueGame() {
    Audio2.unlock();
    hideTitle();
    const p = G.player;
    const area = S.player.area || 'island';
    G.mode = 'play';
    if (area !== 'island') setArea(area, S.player.x, S.player.y, S.player.dir);
    else { G.area = G.areas.island; p.x = S.player.x; p.y = S.player.y; }
    const tx = Math.floor(p.x / TILE), ty = Math.floor((p.y - 2) / TILE);
    if (G.area.blockedAt(tx, ty)) { const f = G.area.nearestFree(tx, ty, 10); if (f) { p.x = (f[0] + 0.5) * TILE; p.y = (f[1] + 0.6) * TILE; } }
    updateCam(true);
    HUD.show(true);
    HUD.update();
    updateToolButton();
    if (LAB) {
        Music.update(true); UI.toast('The test area for the new 3D look. Nothing here is saved.');
        return;
    }
    const newDay = dailyCheck();
    newsCheck();
    Music.update(true);
    await waitFrames(20);
    const unread = S.mail.filter(m => !m.read && m.day <= Clock.dayNum()).length;
    const h = Clock.hourF();
    const greet = h < 12 ? 'Good morning!' : h < 17 ? 'Good afternoon!' : h < 21 ? 'Good evening!' : 'Hello, night owl!';
    UI.toast(`${greet} It's ${Clock.fmt().s} on ${S.islandName}.`);
    if (unread) setTimeout(() => UI.toast(`You have ${unread} new ${plural(unread, 'letter')}. Check your phone.`, 'app_mail'), 1200);
    if (G.events.has('birthday')) birthdayParty();
}

async function startNew() {
    Audio2.unlock();
    hideTitle();
    G.mode = 'intro';
    G.busy++;
    S.started = false;
    S.house.items = STARTER_HOUSE.map(o => Object.assign({ flip: false }, o));
    const p = G.player;
    G.area = G.areas.island;
    p.x = W0.intro.sarah[0] * TILE; p.y = W0.intro.sarah[1] * TILE; p.dir = 'up';
    G.fade = 1;
    // dawn at sea: Sarah on her boat, the island on the horizon
    await IntroScene.play();
    G.intro = true;
    NPCs.place(true);
    updateCam(true);
    G.fade = 0;
    Music.update(true);
    await waitFrames(55);
    await UI.say('joe', "You made it! I took the early ferry so I could be here to wave you in. I've been waving for an hour. Look at this place!");
    const f = NPCs.get('fortune');
    p.dir = 'up';
    await UI.say('fortune', "Welcome, welcome! I'm Fortune. I run the shop. And, kind of, the island. First things first!", { keep: true });
    UI.hideDialog();
    await setupForm();
    await UI.say('fortune', [`${S.islandName}! Love it.`, 'Here, a phone! Everyone gets a phone. It is the law. (A lawyer named John said so.) It has a map, your mail, and a camera.',
        `One more thing: the island runs on island time. Right now it's ${Clock.fmt().s}. If that ever feels wrong, the phone's Settings can change it.`,
        "Your house is up in the village, northwest of the plaza: take the lane west past the museum, then head north. Say hi to the neighbors! And come by the shop. I have fortunes."]);
    await UI.say('joe', ["I live here now, too! My house is by the beach, just west of the pier. I'll bring takeout later.",
        "And if you ever want a poem, just ask. I have a poetry degree. I have a lot of poems. They're all excellent."]);
    rel('joe').met = true; S.flags.metJoe = true;
    rel('fortune').met = true;
    // Harvard would like Sarah to know she is on vacation
    sendMail({ from: 'harvard', subject: 'Enjoy your island vacation!', body: HARVARD_WELCOME });
    S.flags.introDone = true;
    S.started = true;
    S.day = Clock.dayNum();
    S.startDay = S.day;
    G.intro = false;
    NPCs.place(true);
    G.busy--;
    G.mode = 'play';
    HUD.show(true);
    HUD.update();
    Save.write(true);
    UI.toast(G.touchUsed ? 'Tap to walk. Tap trees, shells and neighbors to use them.' : 'Arrows or WASD to walk. E to talk and use things. P for your phone.');
    setTimeout(() => UI.toast('Try shaking a tree, picking up shells, and selling them at the shop.'), 3200);
}
function setupForm() {
    return new Promise(res => {
        const P = UI.open({ title: 'Welcome to the island', foot: true });
        P.head.querySelector('.x').remove();
        UI._onClose = null;
        const f1 = el('label', 'field');
        f1.appendChild(el('span', null, 'What is the island called?'));
        const name = el('input');
        name.id = 'islandname'; name.maxLength = 22; name.value = 'Night Owl Isle'; name.autocomplete = 'off';
        f1.appendChild(name);
        P.body.appendChild(f1);
        const f2 = el('div', 'field');
        f2.style.marginTop = '12px';
        f2.appendChild(el('span', null, "Sarah's birthday (for the island party)"));
        const row = el('div', 'two');
        const mo = el('select'); mo.id = 'bmonth'; mo.setAttribute('aria-label', 'Birthday month');
        MONTHS.forEach((m, i) => { const o = el('option', null, m); o.value = i + 1; mo.appendChild(o); });
        const dy = el('select'); dy.id = 'bday'; dy.setAttribute('aria-label', 'Birthday day');
        for (let d = 1; d <= 31; d++) { const o = el('option', null, String(d)); o.value = d; dy.appendChild(o); }
        row.appendChild(mo); row.appendChild(dy);
        f2.appendChild(row);
        P.body.appendChild(f2);
        P.body.appendChild(el('p', 'muted', 'Everything else on the island runs on its own. Sarah just gets to live here.'));
        const go = () => {
            S.islandName = (name.value || '').trim().slice(0, 22) || 'Night Owl Isle';
            S.birthday = { m: +mo.value, d: +dy.value };
            UI.modal = false;
            $('#panel').hidden = true; $('#scrim').hidden = true; $('#panel').innerHTML = '';
            G.events = todayEvents();
            res();
        };
        P.foot.appendChild(btn("That's everything", 'green', go));
        name.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } e.stopPropagation(); });
        setTimeout(() => name.focus(), 50);
    });
}

/* ---------------------------------------------------------------- loop */
const STEP = 1000 / 60;
let lastT = 0, acc = 0;
function loop(t) {
    requestAnimationFrame(loop);
    let dt = lastT ? t - lastT : STEP;
    lastT = t;
    if (dt > 250) dt = STEP;
    acc += dt;
    let n = 0;
    while (acc >= STEP && n < 4) { keepSteps(); update(); acc -= STEP; n++; }
    if (n >= 4) acc = 0;
    // drawn on every refresh, not only after a step (60 steps a second land unevenly on a screen's refreshes, which
    // reads as jumpy), with whoever's walking placed between their last two steps; a phone draws after steps only
    if (n || (G.frame > 0 && !R3.phone)) renderBetween(Math.min(1, acc / STEP), dt);
}
/* everyone who walks: where they were before this step */
function walkers() { const out = G.player ? [G.player] : []; if (G.area && G.mode !== 'title') for (const n of NPCs.here()) out.push(n); return out; }
function keepSteps() { for (const m of walkers()) { m.ix = m.x; m.iy = m.y; } }
function renderBetween(t, dt) {
    G.frameMs = dt;
    const moved = [];
    for (const m of walkers()) {
        if (m.ix == null || (m.ix === m.x && m.iy === m.y) || Math.abs(m.x - m.ix) + Math.abs(m.y - m.iy) > 2 * TILE) continue;
        moved.push(m, m.x, m.y);
        m.x = m.ix + (m.x - m.ix) * t; m.y = m.iy + (m.y - m.iy) * t;
    }
    try { render(); } finally { for (let i = 0; i < moved.length; i += 3) { moved[i].x = moved[i + 1]; moved[i].y = moved[i + 2]; } }
}
function update() {
    G.frame++; G.t++;
    tickWaiters();
    Watchdog.tick();
    if (G.mode === 'title' && G.titleCam) {
        G.titleCam.t++;
        const k = G.titleCam.t / 1400;
        G.camTarget = [lerp(14, W0.w - 14, (Math.sin(k) + 1) / 2) * TILE, lerp(12, W0.h - 16, (Math.cos(k * 0.7) + 1) / 2) * TILE];
    } else if (G.mode !== 'title' && G.titleCamWas) { G.camTarget = null; }
    G.titleCamWas = G.mode === 'title';
    if (G.mode === 'intro' && G.player) G.camTarget = [G.player.x, G.player.y - 12];
    if (G.mode === 'play' && !Decor.on && !Dance.on && !Karaoke.on && !Rope.on && !Mover.on && !PathTool.on && !IslandEdit.on && G.camTarget && !G.lockCam) G.camTarget = null;
    if (G.player) updatePlayer(G.player);
    if (G.frame % 20 === 0) updateCart();
    NPCs.update();
    tickTrees();
    Fishing.update();
    Dance.update();
    Karaoke.update();
    Rope.update();
    IslandGames.tick();
    Arcade.update();
    Sky.update();
    Critters.update();
    SeaSky.update();
    Flutter.update();
    bonusTick();
    Extras.tick();
    if (G.mode === 'play' && S && !document.hidden) S.stats.playMs = (S.stats.playMs || 0) + STEP;
    if (G.frame % 600 === 0 && G.mode === 'play') { HUD.bonus(); checkSpecialMilestones(); }
    if (G.frame % 30 === 15) pumpSpecials();
    for (let i = G.fx.length - 1; i >= 0; i--) { const f = G.fx[i]; f.t++; if (f.update) f.update(); if (f.t >= f.life) G.fx.splice(i, 1); }
    updateWeather();
    updateCam();
    Music.tick();
    if (G.frame % 30 === 0) HUD.update();
    if (G.frame % 10 === 0) Zoom.tick();
    if (G.frame % 60 === 30) roomChecks();
    if (G.frame % 90 === 45) Visits.check();
    if (G.frame % 120 === 60) potteryTick();
    if (G.frame % 120 === 0) {
        Music.update(false);
        if (G.mode === 'play' && dailyCheck()) {
            // a new island day while playing
            const a = G.areas.island;
            a.ents = a.ents.filter(e => e.shellIdx == null);
            spawnShells(a);
            decorateIsland(a);
            addForest(a);
            addWildFlowers(a);
            addPlantedFlowers(a);
            if (a.bgSeason !== Clock.season()) { G.areas.island = buildIsland(); restoreDrops(G.areas.island); spawnShells(G.areas.island); decorateIsland(G.areas.island); if (G.area.id === 'island') G.area = G.areas.island; }
            UI.toast(`A new day on ${S.islandName}! ${Clock.dateLine()}.`);
            if (G.events.has('birthday')) birthdayParty();
        }
    }
    if (G.frame % 300 === 0 && G.mode === 'play') Save.write();
    if (G.frame % 3600 === 1800 && G.mode === 'play') worldFetch();
    if (G.frame % 120 === 90 && G.mode === 'play' && CIVIC_PREVIEW) Jobs.tick();        // (a zip code not looked up yet today: 6zh_world.js)
    G.showPrompt = !G.touchUsed;
}
function render() {
    const hd = R3.active();
    R3.show(hd);
    if (hd && R3.render()) {
        const ctx = Render.ctx;
        if (Fishing.st) { R3.localTransform(ctx, G.player.x, G.player.y, 0); R3.over = true; try { Fishing.draw(ctx); } finally { R3.over = false; } }
        ctx.setTransform(1, 0, 0, 1, -G.cam.x, -G.cam.y);
        Sky.draw(ctx);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        // (the dance's arrows and the karaoke's words, flat over the 3D club)
        Dance.draw(ctx);
        Karaoke.draw(ctx);
        Online.update();
        Bubbles.update();
        BigMap.tick();
        return;
    }
    R3.show(false);
    drawWorld();
    const ctx = Render.ctx;
    ctx.setTransform(1, 0, 0, 1, -G.cam.x, -G.cam.y);
    // (placing things on the island: the tiles drawn, as indoors)
    if (PathTool.on || Mover.on || IslandEdit.on) drawTileGrid(ctx);
    Decor.draw(ctx);
    PathTool.draw(ctx);
    Mover.draw(ctx);
    IslandEdit.draw(ctx);
    Fishing.draw(ctx);
    Sky.draw(ctx);
    if (G.held && G.player) spr(ctx, itemIcon(G.held), G.player.x, G.player.y - 28);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    Dance.draw(ctx);
    Karaoke.draw(ctx);
    Online.update();
    Bubbles.update();
    BigMap.tick();
}

/* ---------------------------------------------------------------- input */
function bindInput() {
    addEventListener('keydown', e => {
        const tg = e.target;
        if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.tagName === 'SELECT')) {
            // typing in a box that's really on screen: leave it alone. A box that's gone (or hidden) keeps no keys.
            if (liveField(tg)) return;
            tg.blur();
        }
        Audio2.unlock();
        const code = e.code;
        // a HUD button that was clicked keeps the keyboard focus: Enter and Space must not press it again
        // (that's how Enter used to zoom out), and it shouldn't hold on to the keys at all
        if (tg && tg !== document.body && tg.closest && tg.closest('#hudL, #hudR, #hudB, #hint')) {
            if (code === 'Enter' || code === 'NumpadEnter' || code === 'Space') e.preventDefault();
            tg.blur();
        }
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) e.preventDefault();
        if (Dance.on) {
            if (code === 'Escape') { Dance.quit(); return; }
            const lane = { ArrowLeft: 0, KeyA: 0, KeyD: 0, ArrowDown: 1, KeyS: 1, KeyF: 1, ArrowUp: 2, KeyW: 2, KeyJ: 2, ArrowRight: 3, KeyK: 3 }[code];
            if (lane != null && !e.repeat) Dance.hit(lane);
            return;
        }
        if (Arcade.on) { Arcade.key(code, true, e); return; }
        const up = isA(code) || code === 'ArrowUp' || code === 'KeyW';
        if (Karaoke.on) {
            if (isA(code)) Karaoke.hold(true);
            else if (code === 'ArrowUp' || code === 'KeyW') Karaoke.pitch(1, true);
            else if (code === 'ArrowDown' || code === 'KeyS') Karaoke.pitch(-1, true);
            else if (code === 'Escape') Karaoke.quit();
            return;
        }
        if (Rope.on) { if (up && !e.repeat) Rope.jump(); else if (code === 'Escape') Rope.quit(); return; }
        if (BigMap.on) { BigMap.key(code); return; }
        if (code === 'KeyH' && !e.repeat) { homeKey(); return; }
        if (Studio.on && !UI.dialogOpen) { if (Studio.onKey) Studio.onKey(code, true, e); return; }
        if (UI.dialogOpen) {
            if (UI._chooser) UI._chooser.key(code);
            else if (isA(code) || code === 'Escape' || code === 'KeyB') UI.advance();
            return;
        }
        if (Decor.on) { Decor.key(code); return; }
        if (Mover.on) { Mover.key(code); return; }
        if (PathTool.on) { PathTool.key(code); return; }
        if (IslandEdit.on) { IslandEdit.key(code); return; }
        if (UI.modal) { if (code === 'Escape') UI.close(); return; }
        if (Photo.on) { if (code === 'Escape') Photo.stop(); else if (isA(code)) Photo.snap(); return; }
        if (G.mode !== 'play') return;
        if (Fishing.st && (isA(code))) { Fishing.press(); return; }
        if (Fishing.st && (code === 'Escape' || code.startsWith('Arrow'))) { Fishing.stop(); }
        G.keys[code] = true;
        if (e.repeat) return;
        if (isA(code)) { if (Sky.star && Sky.wish()) return; pressA(); }
        else if (code === 'KeyI' || code === 'Tab') { e.preventDefault(); if (!G.busy) openPocket(); }
        else if (code === 'KeyP' || code === 'Escape') { if (!G.busy) openPhone(); }
        else if (code === 'KeyQ') { if (!G.busy) doMove(rpick(S.dance.moves)); }
        else if (code === 'KeyT') cycleTool();
        else if (code === 'Minus' || code === 'NumpadSubtract') Zoom.out();
        else if (code === 'Equal' || code === 'NumpadAdd') Zoom.in();
        else if (code === 'KeyM') { if (!G.busy) BigMap.open(); }
        else if (code === 'KeyR') toggleRun();
    });
    addEventListener('keyup', e => {
        G.keys[e.code] = false;
        if (Studio.on && Studio.onKey) Studio.onKey(e.code, false, e);
        if (Arcade.on) Arcade.key(e.code, false, e);
        if (Karaoke.on) {
            if (isA(e.code)) Karaoke.hold(false);
            if (e.code === 'ArrowUp' || e.code === 'KeyW') Karaoke.pitch(1, false);
            if (e.code === 'ArrowDown' || e.code === 'KeyS') Karaoke.pitch(-1, false);
        }
    });
    ['pointerup', 'pointercancel'].forEach(t => addEventListener(t, () => { if (Karaoke.on && !G.touchUsed) Karaoke.hold(false); }));
    addEventListener('blur', () => { G.keys = {}; });
    const cv = $('#game');
    // phones and tablets: tap controls from the start
    try { if (matchMedia('(hover: none) and (pointer: coarse)').matches) G.touchUsed = true; } catch (e) { /* old browser */ }
    addEventListener('pointerdown', ev => { if (ev.pointerType === 'touch' && !G.touchUsed) { G.touchUsed = true; $('#hint').hidden = true; } }, true);
    const toScreen = ev => { const r = cv.getBoundingClientRect(); return [(ev.clientX - r.left) / r.width * cv.width, (ev.clientY - r.top) / r.height * cv.height]; };
    const toWorld = ev => {
        const [x, y] = toScreen(ev);
        if (R3.active()) return R3.unproject(x, y);
        return [x + G.cam.x, y + G.cam.y];
    };
    cv.addEventListener('pointerdown', ev => {
        Audio2.unlock();
        if (ev.pointerType === 'touch') { G.touchUsed = true; $('#hint').hidden = true; }
        if (G.pinching) return;
        if (Karaoke.on) { if (!G.touchUsed) Karaoke.hold(true); return; }
        if (Rope.on) { Rope.jump(); return; }
        if (UI.dialogOpen) { UI.advance(); return; }
        const [wx, wy] = toWorld(ev);
        if (Decor.on) { Decor.tap(wx, wy); return; }
        if (Mover.on) { Mover.down(wx, wy, ev); return; }
        if (PathTool.on) { PathTool.down(wx, wy, ev); return; }
        if (IslandEdit.on) { IslandEdit.down(wx, wy, ev); return; }
        if (G.mode !== 'play' || Dance.on || Photo.on || UI.modal) return;
        if (Fishing.st) { Fishing.press(); return; }
        if (Sky.star) { const [sx, sy] = toScreen(ev); if (Math.hypot(Sky.star.x - G.cam.x - sx, Sky.star.y - G.cam.y - sy) < 40) { Sky.wish(); return; } }
        if (G.busy) return;
        // a tap walks there (or talks, picks up...); keeping the finger down keeps walking towards it
        const acted = tapWorld(wx, wy);
        const h = G.hold = { id: ev.pointerId, cx: ev.clientX, cy: ev.clientY, t: performance.now(), steer: false, acted: acted === 'act' };
        h.world = () => toWorld({ clientX: h.cx, clientY: h.cy });
    });
    // after a moment held down on open ground (or once the finger moves anywhere), the tap becomes steering
    setInterval(() => { const h = G.hold; if (h && !h.steer && !h.acted && performance.now() - h.t > 260) h.steer = true; }, 60);
    const endHold = ev => { if (G.hold && (!ev || ev.pointerId === G.hold.id)) { if (G.hold.steer && G.player) G.player.path = null; G.hold = null; } };
    addEventListener('pointerup', endHold);
    addEventListener('pointercancel', endHold);
    addEventListener('blur', () => endHold());
    // a held finger is followed wherever it goes (over the buttons too)
    addEventListener('pointermove', ev => {
        const h = G.hold;
        if (h && ev.pointerId === h.id) { if (!h.steer && Math.hypot(ev.clientX - h.cx, ev.clientY - h.cy) > 14) h.steer = true; h.cx = ev.clientX; h.cy = ev.clientY; }
    });
    cv.addEventListener('pointermove', ev => {
        if (IslandEdit.on) { if (G.pinching) return; const [wx, wy] = toWorld(ev); IslandEdit.move(wx, wy, ev); return; }
        if (Mover.on || PathTool.on) { if (G.pinching) return; const [wx, wy] = toWorld(ev); if (Mover.on) Mover.move(wx, wy, ev); else PathTool.move(wx, wy, ev); return; }
        if (!Decor.on) return;
        const [wx, wy] = toWorld(ev);
        Decor.hover = [Math.floor(wx / TILE), Math.floor(wy / TILE)];
    });
    addEventListener('pointerup', ev => {
        if (Mover.on) Mover.up(); if (PathTool.on) PathTool.up();
        if (IslandEdit.on && !G.pinching) { const r = cv.getBoundingClientRect(); const inside = ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom; if (inside && ev.target === cv) { const [wx, wy] = toWorld(ev); IslandEdit.up(wx, wy); } else IslandEdit.drag0 = null; }
    });
    addEventListener('pointercancel', () => { if (Mover.on) Mover.up(); if (PathTool.on) PathTool.up(); });
    cv.addEventListener('pointerleave', () => { Decor.hover = null; });
    $('#dialog').addEventListener('click', () => UI.advance());
    $('#bPhone').addEventListener('click', () => { if (!G.busy && !UI.modal) { Sfx.ui('open'); openPhone(); } });
    $('#bPocket').addEventListener('click', () => { if (!G.busy && !UI.modal) { Sfx.ui('open'); openPocket(); } });
    $('#bMoves').addEventListener('click', () => { if (!G.busy && !UI.modal) openApp('moves'); });
    $('#bTool').addEventListener('click', () => cycleTool());
    $('#bMap').addEventListener('click', () => { if (!G.busy && !UI.modal) BigMap.open(); });
    $('#bRun').addEventListener('click', () => toggleRun());
    runButton();
    $('#bZoomOut').addEventListener('click', () => Zoom.out());
    $('#bZoomIn').addEventListener('click', () => Zoom.in());
    // the HUD's buttons never take the keyboard focus (so a later Enter can't press them by accident)
    for (const b of document.querySelectorAll('#hudL button, #hudR button, #hudB button')) {
        b.addEventListener('mousedown', ev => ev.preventDefault());
        b.addEventListener('click', () => b.blur());
    }
    // two fingers pinch to zoom; the mouse wheel zooms too
    const touches = new Map();
    let pinch0 = 0;
    const spread = () => { const [a, b] = [...touches.values()]; return Math.hypot(a[0] - b[0], a[1] - b[1]); };
    cv.addEventListener('pointerdown', ev => {
        if (ev.pointerType !== 'touch') return;
        touches.set(ev.pointerId, [ev.clientX, ev.clientY]);
        G.pinching = touches.size >= 2;
        if (touches.size === 2) {
            pinch0 = spread();
            const stop = () => { if (G.player && !G.busy) { G.player.path = null; G.player.onArrive = null; } };
            stop(); setTimeout(stop, 0);
        }
    }, true);
    cv.addEventListener('pointermove', ev => {
        if (!touches.has(ev.pointerId)) return;
        touches.set(ev.pointerId, [ev.clientX, ev.clientY]);
        if (touches.size !== 2 || !pinch0 || G.mode !== 'play') return;
        const d = spread();
        if (d > pinch0 * 1.35) { Zoom.in(); pinch0 = d; }
        else if (d < pinch0 / 1.35) { Zoom.out(); pinch0 = d; }
    });
    const lift = ev => { touches.delete(ev.pointerId); if (touches.size < 2) pinch0 = 0; if (!touches.size) G.pinching = false; };
    cv.addEventListener('pointerup', lift); cv.addEventListener('pointercancel', lift);
    let wheel = 0, wheelT = 0;
    cv.addEventListener('wheel', ev => {
        if (G.mode !== 'play' || UI.modal) return;
        ev.preventDefault();
        if (Date.now() - wheelT > 400) wheel = 0;
        wheelT = Date.now();
        wheel += ev.deltaY;
        if (wheel > 80) { Zoom.out(); wheel = 0; }
        else if (wheel < -80) { Zoom.in(); wheel = 0; }
    }, { passive: false });
    $$('#dancepads .pad').forEach(b => {
        const lane = +b.dataset.lane;
        b.addEventListener('pointerdown', ev => { ev.preventDefault(); b.classList.add('on'); Dance.hit(lane); });
        const off = () => b.classList.remove('on');
        b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { Save.write(true); if (Audio2.ctx) Audio2.ctx.suspend(); } else if (Audio2.ctx && Audio2.started) Audio2.ctx.resume(); });
    addEventListener('pagehide', () => Save.write(true));
    $('#hint').innerHTML = '<kbd>WASD</kbd> walk \u00b7 <kbd>R</kbd> run on/off \u00b7 <kbd>E</kbd> talk/use \u00b7 <kbd>T</kbd> tools \u00b7 <kbd>I</kbd> pocket \u00b7 <kbd>P</kbd> phone \u00b7 <kbd>M</kbd> map \u00b7 <kbd>-</kbd><kbd>+</kbd> zoom \u00b7 <kbd>Q</kbd> dance';
}

/* running: on or off (it stays that way, even next time) */
function toggleRun() {
    if (!S) return;
    if (!S.settings) S.settings = {};
    S.settings.run = !S.settings.run;
    Save.touch();
    runButton();
    Sfx.ui('tick');
    UI.toast(S.settings.run ? 'Running: on. Zoom!' : 'Running: off. Nice and easy.', 'ui_run');
}
function runButton() {
    const b = $('#bRun');
    if (!b) return;
    const on = !!(S && S.settings && S.settings.run);
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
}

/* tap: use whatever is under the finger, or walk there */
function tapWorld(wx, wy) {
    const a = G.area;
    const cands = [];
    for (const n of NPCs.here()) if (inHit(n, wx, wy, 4)) cands.push([0, n]);
    const nightNow = hourIn(Clock.hourF(), 21, 27);
    for (const e of a.ents) if (e.interact && !(e.onlyNight && !nightNow) && inHit(e, wx, wy, e.kind === 'item' ? 5 : 0)) cands.push([e.kind === 'item' ? 1 : e.kind === 'building' ? 3 : 2, e]);
    cands.sort((p, q) => p[0] - q[0] || Math.abs(p[1].y - wy) - Math.abs(q[1].y - wy));
    if (cands.length) { approach(cands[0][1]); return 'act'; }
    // indoors, a tap on (or around) the doorway walks out the door
    if (a.interior && a.doorTile) {
        const [dx, dy] = a.doorTile;
        if (Math.abs(wx / TILE - (dx + 0.5)) < 1.4 && wy / TILE > dy - 0.45) {
            if (walkTo(dx, dy, () => { if (G.area === a && !G.busy) leaveInterior(); })) return 'act';
        }
    }
    const tx = Math.floor(wx / TILE), ty = Math.floor(wy / TILE);
    const w = a.waterAt(tx, ty);
    if (heldTool() === 'shovel' && a.id === 'island' && !w && !a.blockedAt(tx, ty) && tapDig(tx, ty)) return 'act';
    if (w && w !== 'h') {
        // walk to the nearest shore tile, face the water, cast
        let best = null;
        for (let r = 1; r <= 4 && !best; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
            const x = tx + dx, y = ty + dy;
            if (!a.blockedAt(x, y) && !best) best = [x, y];
        }
        if (best) {
            walkTo(best[0], best[1], () => {
                const p = G.player;
                const ddx = (tx + 0.5) * TILE - p.x, ddy = (ty + 0.5) * TILE - (p.y - 6);
                p.dir = Math.abs(ddx) > Math.abs(ddy) ? (ddx > 0 ? 'right' : 'left') : (ddy > 0 ? 'down' : 'up');
                startFishing(tx, ty, w);
            });
        }
        return 'act';
    }
    if (!walkTo(tx, ty, null, wx, wy)) {
        const f = a.nearestFree(tx, ty, 4);
        if (f) walkTo(f[0], f[1]);
    }
}

// a republished page hands its island state across, so nobody loses their place
(() => {
    const hot = window.claude && window.claude.hot;
    if (hot && hot.ready) hot.ready(data => boot(data || {}));
    else boot((hot && hot.data) || {});
})();

