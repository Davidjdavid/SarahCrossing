/* The game: scenes (title, naming, play), the step (60 a second, fixed) and the picture. */

const Game = {
    newGame(name, opts = {}) {
        G.wanderer = name;
        G.seed = opts.seed || 20261109;
        G.rng = mulberry(G.seed);
        Inv.reset(); Progress.reset(); Stats.reset();
        G.player = null;
        Script.clear(); Dialog.active = false; UI.menu = null;
        G.scene = 'play';
        Story.begin(opts);
    },
    load(s) {
        Script.clear(); Dialog.active = false; UI.menu = null;
        G.scene = 'play';
        Save.apply(s);
        UI.fadeA = 1; UI.fade = { from: 1, to: 0, t: 0, dur: 30 };
        if (Story.afterLoad) Story.afterLoad();
    },
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
            }
            Script.update();
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
            /* things lying on the floor, then threads, then everything standing, sorted by depth */
            const floor = a.ents.filter(e => e.floor && e.x > cx - 40 && e.x < cx + W + 40 && e.y > cy - 40 && e.y < cy + H + 40);
            for (const e of floor) e.draw(cx, cy);
            Threads.draw(a, cx, cy);
            const stand = a.ents.filter(e => !e.floor && e.x > cx - 80 && e.x < cx + W + 40 && e.y > cy - 80 && e.y < cy + H + 80);
            stand.push(p);
            stand.sort((m, n) => m.sortY - n.sortY);
            for (const e of stand) e.draw(cx, cy);
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
            Knots.draw(cx, cy);
            if (G.holdUp) {
                const im = spr(ITEM_ICON[G.holdUp.id] || ('icon_' + G.holdUp.id)) || spr(G.holdUp.id);
                if (im) Gfx.img(im, p.x - cx - im.width / 2, p.y - cy - 30);
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
        let last = performance.now(), acc = 0;
        const loop = now => {
            acc += Math.min(100, now - last); last = now;
            let n = 0;
            while (acc >= 1000 / FPS && n < 4) { if (!HW._paused) Game.step(); acc -= 1000 / FPS; n++; }
            Game.render();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
        setTimeout(() => { const h = document.getElementById('hint'); if (h) h.style.opacity = '0'; }, 9000);
        addEventListener('beforeunload', () => { if (G.scene === 'play') Save.autosave(); });
    } else {
        G.scene = 'title';
    }
}
boot();
