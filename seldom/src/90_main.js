/* starting, the title, the loop */
const Game = {
    build() {
        for (const k in MAPS) delete MAPS[k];
        entSeq = 1;
        for (const make of MAP_MAKERS) { const m = make(); MAPS[m.id] = m; }
        for (const id in MAPS) MAPS[id].populate();
        World.inv = {}; World.hour = 9; World.day = 1; G.flags = {}; Notebook.got = {}; World.triggers = [];
        World.map = null; World.cutscene = null; World.talking = null;
        Cam.zmin = 1; Cam.zmax = 1; Cam.zoom = Cam.ztarget = 1; Cam.split = false; Cam.mode = 'follow'; Cam.eye = false; Cam.hold = null;
        G.playT = 0; G.hudOff = false;
        const start = MAPS[START.map];
        const d = new GameMap({ id: '_', rows: ['.'] }).add('dot', 0, 0, { name: 'dot', corner: true });
        World.dot = d;
        d.map = null;
        return start;
    },
    newGame() {
        const start = this.build();
        World.dot.map = start; start.ents.push(World.dot);
        World.map = start;
        World.go(START.map, start.startX != null ? start.startX : START.x, start.startY != null ? start.startY : START.y, 'down', { quiet: true });
        G.state = 'play';
        if (START.onNew) START.onNew();
        Fx.fadeIn(1);
    },
    continueGame() {
        const s = Save.read(); if (!s) return this.newGame();
        const start = this.build();
        World.dot.map = start; start.ents.push(World.dot); World.map = start;
        try { Save.apply(s); }
        catch (err) { console.error(err); report('load', err); this.newGame(); return; }
        G.state = 'play';
        Fx.fadeIn(0.8);
        if (START.onContinue) START.onContinue(s);
    },
    toTitle() { Music.cut(); G.state = 'title'; Title.enter(); },
};

function report(where, err) { try { console.warn('[seldom]', where, err && err.stack || err); } catch (e) { } }

let lastT = 0, acc = 0;
function frame(ts) {
    requestAnimationFrame(frame);
    const now = ts / 1000;
    let dt = lastT ? now - lastT : STEP; lastT = now;
    if (dt > 0.25) dt = 0.25;
    acc += dt;
    let n = 0;
    while (acc >= STEP && n < 5) { acc -= STEP; tick(STEP); n++; }
    /* watching the Clock from the bench: everything in view runs faster */
    lapseStep();
    if (n === 5) acc = 0;
    try { R.draw(); } catch (err) { report('draw', err); }
}
function lapseStep() {
    if (!World.lapse || G.state !== 'play') return;
    for (let i = 0; i < LAPSE - 1 && World.lapse; i++) { World.lapse.t += STEP; tick(STEP, true); if (lapseDone()) { World.lapse = null; World.dot.sitting = false; } }
}
function tick(dt, fast) {
    G.t += dt; G.frame++;
    if (!fast) Input.poll(); else { Input.hit = {}; }
    if (Input.hit.debug && G.debug) G.showDebug = !G.showDebug;
    try {
        if (G.state === 'title') { Title.update(dt); return; }
        if (G.state === 'ending' || G.state === 'credits') { Ending.update(dt); Music.update(); return; }
        if (G.state === 'play' || G.state === 'talk') {
            G.playT = (G.playT || 0) + dt;
            if (G.state === 'play' && Input.hit.menu) { UI.openMenu(); return; }
            if (G.state === 'play' && Input.hit.notebook) { G.state = 'notebook'; Sfx.play('open'); return; }
            Cam.update(dt);
            World.update(dt);
            if (G.state === 'talk') Talk.update(dt);
            World.triggers = World.triggers.filter(t => !t.done);
        } else if (G.state === 'notebook') UI.updateNotebook();
        else if (G.state === 'menu') UI.updateMenu();
        Fx.update(dt); UI.update(dt); if (!World.lapse) Music.update(); Ambience.update(); Save.tick();
        if (G.state === 'play' && G.t - (G.lastAuto || 0) > 30) { G.lastAuto = G.t; Save.write(); }
    } catch (err) { report('tick', err); if (G.debug) throw err; }
}

function boot() {
    const cv = document.getElementById('game');
    G.debug = !!window.__DEBUG || /[?&]debug/.test(location.search);
    Save.loadSettings();
    R.init(cv); Input.init(cv); Touch.init(cv);
    cv.focus();
    if (/[?&]test/.test(location.search)) { START.map = 'test'; MAP_MAKERS.length = 0; MAP_MAKERS.push(buildTestMap); START.onNew = () => { G.flags.spyglass = true; G.flags.prism = true; Cam.zmin = 0.5; Cam.zmax = 3; }; G.noSave = true; }
    document.addEventListener('visibilitychange', () => { if (document.hidden) G.hiddenAt = Date.now(); else if (G.hiddenAt) { G.awayFor = Date.now() - G.hiddenAt; G.hiddenAt = 0; Story.hooks.away && Story.hooks.away.forEach(f => f(G.awayFor)); } });
    if (G.debug && /[?&]skip/.test(location.search)) START.onNew = () => { G.flags.started = true; };
    Title.enter();
    requestAnimationFrame(frame);
    if (G.debug) window.__seldom = { G, World, Cam, MAPS, Laws, Game, Notebook, Save, tick, Input, Story, ent, Bot, Debug };
}
window.addEventListener('load', boot);
