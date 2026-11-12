/* The game: scenes (title, naming, play), the step (60 a second, fixed) and the picture. */

const Game = {
    newGame(name, opts = {}) {
        G.wanderer = name;
        G.seed = opts.seed || 20261109;
        G.rng = mulberry(G.seed);
        Inv.reset(); Progress.reset(); Stats.reset();
        G.player = null;
        Script.clear(); Dialog.active = false; UI.menu = null; this.fresh();
        G.scene = 'play';
        Story.begin(opts);
    },
    load(s) {
        Script.clear(); Dialog.active = false; UI.menu = null; this.fresh();
        G.scene = 'play';
        /* (dark first: the place's name waits to come up with it, not over the black) */
        UI.fadeA = 1; UI.fade = { from: 1, to: 0, t: 0, dur: 30 };
        Save.apply(s);
        if (Story.afterLoad) Story.afterLoad();
    },
    /* (nothing on the screen from the game before: its notices, its place's name, the name it was last in) */
    fresh() { UI.banner = null; UI.toasts = []; G.regionName = null; },
    step() {
        G.t++;
        TileDraw.frame = G.t;
        Input.update();
        try {
            if (G.debug && Debug.open) { Debug.update(); return; }
            if (G.scene === 'title') { Title.update(); Music.tick(); return; }
            if (G.scene === 'name') { NameEntry.update(); return; }
            if (G.scene !== 'play') return;
            UI.update();
            if (UI.menu) { UI.menu.update(); Music.tick(); return; }
            Dialog.update();
            const p = G.player;
            if (!Script.blocking() && !Dialog.active && !Cam.busy && p && p.state === 'normal') {
                if (Input.pressed('menu')) { PauseMenu.open(); return; }
                if (Input.pressed('map')) { PauseMenu.open(); PauseMenu.tab = 1; return; }
                if (Input.pressed('prev')) Inv.cycleTool(-1);
                if (Input.pressed('next')) Inv.cycleTool(1);
            } else if (p && p.state === 'flight' && !Script.blocking() && !Dialog.active) {
                /* in mid-flight there's time to change hands (for the Bell) */
                if (Input.pressed('prev')) Inv.cycleTool(-1);
                if (Input.pressed('next')) Inv.cycleTool(1);
            }
            Script.update();
            if (G.waiting) Waiting.tick();
            if (G.heartsLeaving > 0 && --G.heartsLeaving === 0) G.keepHearts = false;
            if (G.pendingToast) { UI.toast(G.pendingToast, 180); G.pendingToast = null; }
            Stats.tick();
            Music.tick();
            if (G.hitstop > 0) { G.hitstop--; return; }
            const a = G.map;
            if (!a) return;
            if (Cam.busy) { Cam.update(p); return; }
            Signals.begin(a);
            for (const e of a.ents.slice()) if (!e.floor && !e.removed && !e.inert) e.update();
            if (p) p.update();
            for (const e of a.ents.slice()) if (e.floor && !e.removed) e.update();
            Thrown.update(a); Shards.update(a); Tools.update(a); GlazerShots.update(a);
            Fx.update();
            /* (if Wren went through a door this frame, the place she left doesn't get its say with her new position) */
            if (G.map !== a) return;
            if (a.def.tick) a.def.tick(a);
            if (Story.tick) Story.tick(a);
            Nudges.update(a);
            SeqLocks.tick(a);
            Cam.update(p);
            World.checkRegion();
            if (G.shake > 0) G.shake--;
        } catch (e) { reportError(e); }
    },
    render() {
        try {
            const c = Gfx.ctx;
            Gfx.rect(0, 0, W, H, PAL.night);
            if (G.scene === 'title') { Title.draw(); Debug.draw(); return; }
            if (G.scene === 'name') { NameEntry.draw(); return; }
            const a = G.map, p = G.player;
            if (!a || !p) return;
            let cx = Cam.x, cy = Cam.y;
            if (G.shake > 0 && Settings.shake) { cx += Math.round((Math.random() - 0.5) * 3); cy += Math.round((Math.random() - 0.5) * 3); }
            /* ground */
            const x0 = Math.floor(cx / T), y0 = Math.floor(cy / T);
            for (let ty = y0; ty <= y0 + Math.ceil(H / T); ty++) for (let tx = x0; tx <= x0 + Math.ceil(W / T); tx++) {
                TileDraw.draw(a, tx, ty, tx * T - cx, ty * T - cy);
            }
            if (G.cheats.grid) for (let tx = x0; tx <= x0 + 21; tx++) { Gfx.alpha(0.15); Gfx.rect(tx * T - cx, 0, 1, H, PAL.white); for (let ty = y0; ty <= y0 + 12; ty++) Gfx.rect(0, ty * T - cy, W, 1, PAL.white); Gfx.alpha(1); }
            if (a.def.drawGround) a.def.drawGround(a, cx, cy);
            Water.drawFlow(a, cx, cy);
            /* things lying on the floor, then threads, then everything standing, sorted by depth */
            const floor = a.ents.filter(e => e.floor && e.x > cx - 40 && e.x < cx + W + 40 && e.y > cy - 40 && e.y < cy + H + 40);
            for (const e of floor) e.draw(cx, cy);
            Threads.draw(a, cx, cy);
            const stand = a.ents.filter(e => !e.floor && e.x > cx - 80 - (e.im ? e.im.width : 0) && e.x < cx + W + 40 && e.y > cy - 80 - (e.im ? e.im.height : 0) && e.y < cy + H + 80);    /* (a tall thing whose foot is still on screen: a big building's facade) */
            stand.push(p);
            G.onScreen = floor.concat(stand);
            stand.sort((m, n) => m.sortY - n.sortY);
            for (const e of stand) e.draw(cx, cy);
            if (a.def.drawFront) a.def.drawFront(a, cx, cy);
            p.drawThrough(cx, cy, stand);
            if (p.state === 'flight' && p.flight) {
                /* Wren's own thread, red, during the flight home */
                const f = p.flight, pts = f.pts;
                const i0 = f.seg || 1;
                Gfx.line(p.x - cx, p.y - cy - 6, pts[i0][0] - cx, pts[i0][1] - cy, THREAD.wren);
                for (let i = i0; i + 1 < pts.length; i++) Gfx.line(pts[i][0] - cx, pts[i][1] - cy, pts[i + 1][0] - cx, pts[i + 1][1] - cy, THREAD.wren);
                const m = p.mark; Marks.draw(m.tx * T - cx, m.ty * T - cy, THREAD.wren, true);
            }
            Thrown.draw(cx, cy); Shards.draw(cx, cy); Tools.draw(cx, cy); GlazerShots.draw(cx, cy);
            if (a.def.drawOver) a.def.drawOver(a, cx, cy);
            Fx.draw(cx, cy);
            Bells.drawFx(cx, cy); Bells.drawSleep(a, cx, cy);
            Knots.draw(cx, cy);
            if (G.selfThread) Shears.drawSelfThread(cx, cy);
            if (G.holdUp) {
                const im = spr(G.holdUp.id === 'pattern' && G.map ? patternIcon(G.map.def.house) : ITEM_ICON[G.holdUp.id] || ('icon_' + G.holdUp.id)) || spr(G.holdUp.id);
                /* (on its glow, drawn with Wren: a chest right behind her that she couldn't step back from, up high over it) */
                if (im) { const [hx, hy] = holdUpSpot(p, cx, cy); Gfx.img(im, hx - im.width / 2, hy - Math.floor(im.height / 2)); }
            }
            if (a.def.dark) Lighting.draw(a, cx, cy);
            UI.drawHUD();
            UI.draw();
            Debug.draw();
        } catch (e) { reportError(e); }
    },
};
const ITEM_ICON = { heartpatch: 'heartpatch', key: 'key', knot: 'knot', heartstitch: 'heart', pattern: 'hud_pattern' };
const Lighting = { draw() { } };

/* Frame pacing. The game steps 60 times a second; the screen refreshes at its own rate, and the time between refreshes
   jitters. Steps are paid for out of the time since the last refresh, averaged over the last four and snapped to a whole
   refresh (or whole 60ths) when it's that within a whisker: so on a 60 Hz screen every refresh gets exactly one step,
   never none then two (a visible stutter), and at 120 Hz it's one every other refresh, evenly. A long pause (a tab put
   away) costs one step, not a burst. */
const Pace = {
    STEP: 1000 / FPS, RATES: [60, 120, 144, 165, 240, 75, 90, 100, 50, 30], last: null, acc: 0, hist: [], dirty: true,
    snap(dt) {
        const m = Math.round(dt / this.STEP);
        if (m >= 1 && Math.abs(dt - m * this.STEP) < 1) return m * this.STEP;
        for (const r of this.RATES) if (Math.abs(dt - 1000 / r) < 0.4) return 1000 / r;
        return dt;
    },
    frame(now) {
        if (this.last === null) { this.last = now; return 0; }
        let dt = now - this.last; this.last = now;
        if (dt > 250 || dt < 0) { this.hist = []; this.acc = 0; return 1; }
        this.hist.push(dt); if (this.hist.length > 4) this.hist.shift();
        const avg = this.hist.reduce((s, v) => s + v, 0) / this.hist.length;
        this.acc += this.snap(avg);
        let n = 0;
        while (this.acc >= this.STEP - 1e-6 && n < 4) { this.acc -= this.STEP; n++; }
        if (n === 4 || this.acc < 0) this.acc = 0;
        return n;
    },
};

function boot() {
    Gfx.init();
    Input.init();
    Settings.load();
    initWrenSprites(); initThingSprites(); initUISprites(); initToolIcons(); initEnemySprites();
    if (typeof initContent === 'function') initContent();
    if (!HEADLESS) {
        G.debug = /[?&]debug/.test(location.search);
        if (location.search.includes('notitle') && G.debug) { Game.newGame('Wren', { skipIntro: true }); }
        else Title.open();
        const loop = now => {
            const n = Pace.frame(now);
            /* (sitting and waiting: four steps for every one, until it's over) */
            for (let i = 0; i < n * (G.waiting ? 4 : 1); i++) if (!HW._paused) Game.step();
            if (n > 0 || Pace.dirty) { Game.render(); Gfx.present(); Pace.dirty = false; }
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
        addEventListener('beforeunload', () => { if (G.scene === 'play') Save.autosave(); });
    } else {
        G.scene = 'title';
    }
}
boot();
