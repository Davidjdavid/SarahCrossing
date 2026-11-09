/* the loop, the keys, and putting the picture on the page */

const SCREEN = document.getElementById('game');
const SG = SCREEN.getContext('2d');
const scene = mkCanvas(VW, VH), g0 = scene.getContext('2d');
const worldCv = mkCanvas(VW, VH), gw = worldCv.getContext('2d');
g0.imageSmoothingEnabled = false; gw.imageSmoothingEnabled = false;

function copyCanvas(src) { const c = mkCanvas(src.width, src.height); c.getContext('2d').drawImage(src, 0, 0); return c; }
function fit() {
    const cs = getComputedStyle(document.body);
    const W = window.innerWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0), H = window.innerHeight;
    const touch = document.body.classList.contains('touch');
    const avH = touch ? H - 170 : H;
    let s = Math.min(W / VW, avH / VH);
    if (s >= 2) s = Math.floor(s);
    SCREEN.width = VW; SCREEN.height = VH;
    SCREEN.style.width = Math.floor(VW * s) + 'px'; SCREEN.style.height = Math.floor(VH * s) + 'px';
}
window.addEventListener('resize', fit);

function saveSettings() { try { localStorage.setItem('carry-the-one-settings', JSON.stringify({ music: AU.music, sound: AU.sound })); } catch (e) { } }
function loadSettings() { try { const s = JSON.parse(localStorage.getItem('carry-the-one-settings') || '{}'); if (s.music === false) AU.music = false; if (s.sound === false) AU.sound = false; } catch (e) { } }

/* ---------- keys ---------- */
const KEYMAP = {
    ArrowUp: 'u', KeyW: 'u', ArrowDown: 'd', KeyS: 'd', ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r',
    KeyZ: 'A', Space: 'A', KeyJ: 'A', KeyX: 'B', KeyK: 'B', Enter: 'START', Escape: 'ESC', KeyP: 'START',
    KeyU: 'UNDO', Backspace: 'UNDO', KeyR: 'RESET', KeyC: 'WAIT', Period: 'WAIT', KeyM: 'MUSIC',
};
const held = { dir: null, since: 0, last: 0 };
let pendingKey = null;
function press(k) {
    audioInit(); audioResume();
    /* while a room slides in, a step waits for it; everything else goes through */
    if (UI.trans && UI.mode === 'play' && 'udlr'.includes(k)) { pendingKey = k; return; }
    switch (UI.mode) {
        case 'title': return titleKey(k);
        case 'play': return playKey(k);
        case 'swap': case 'pocket': return swapKey(k);
        case 'dialog': return dialogKey(k);
        case 'pause': return pauseKey(k);
        case 'album': case 'map': if (k !== 'u' && k !== 'd' && k !== 'l' && k !== 'r') { UI.mode = UI.albumFrom || 'pause'; UI.albumFrom = null; sfx('menu'); } return;
        case 'dead': return deadKey(k);
        case 'ending': return endingKey(k);
    }
}
function titleKey(k) {
    const items = titleItems();
    if (k === 'u') { UI.titleI = (UI.titleI + items.length - 1) % items.length; UI.sureNew = false; sfx('menu'); }
    if (k === 'd') { UI.titleI = (UI.titleI + 1) % items.length; UI.sureNew = false; sfx('menu'); }
    if (k === 'A' || k === 'START') {
        const it = items[UI.titleI];
        if (it === 'New game' && hasSave() && !UI.sureNew) { UI.sureNew = true; sfx('menu'); return; }
        sfx('get');
        UI.sureNew = false;
        if (it === 'Continue' && resumeSave()) begin(false);
        else { newGame(); begin(true); }
    }
}
function begin(fresh) {
    UI.mode = 'play'; VIS.clear(); FX.length = 0; FLY.length = 0; UI.dlg = null; UI.dlgQ = []; UI.banner = null;
    groundCache.key = null;
    setMusic(musicFor(G.room));
    UI.trans = { how: 'fade', t: 0, dur: 0.5 };
    if (fresh) UI.hint = true;
    if (!fresh) banner(ROOMS[G.room].name, null, C.w, 1.4);
}
function playKey(k) {
    if ('udlr'.includes(k)) { tryAct({ t: 'move', d: k }); held.dir = k; held.since = UI.t; held.last = UI.t; return; }
    if (k === 'A') return openSwap();
    if (k === 'WAIT') return tryAct({ t: 'wait' });
    if (k === 'UNDO') { if (undo()) handleEvents(); else sfx('refuse'); return; }
    if (k === 'RESET') { restartRoom(); handleEvents(); return; }
    if (k === 'START' || k === 'ESC') { UI.mode = 'pause'; UI.menuI = 0; sfx('menu'); return; }
    if (k === 'MUSIC') { setMusicOn(!AU.music); saveSettings(); }
}
function tryAct(a) {
    if (UI.trans) return;
    const r = act(a);
    if (a.t === 'wait' && r) { const v = VIS.get('@'); if (v) puff(v.x + 8, v.y + 2, C.W, 2, 0.3, 0.4, 0.6); sfx('clock'); }
    handleEvents();
}
function swapKey(k) {
    if (UI.mode === 'pocket') {
        if (k === 'l' || k === 'u') { UI.sel.pi = (UI.sel.pi + G.pocket.length - 1) % G.pocket.length; sfx('tick'); }
        else if (k === 'r' || k === 'd') { UI.sel.pi = (UI.sel.pi + 1) % G.pocket.length; sfx('tick'); }
        else if (k === 'A') confirmSel();
        else if (k === 'B' || k === 'ESC') { UI.mode = 'swap'; sfx('tick'); }
        return;
    }
    if ('udlr'.includes(k)) return moveSel(k);
    if (k === 'A') return confirmSel();
    if (k === 'B' || k === 'ESC' || k === 'START') { UI.mode = 'play'; UI.sel = null; sfx('tick'); }
    if (k === 'UNDO') { UI.mode = 'play'; if (undo()) handleEvents(); }
}
function dialogKey(k) {
    const D = UI.dlg; if (!D) { UI.mode = 'play'; return; }
    if (k === 'A' || k === 'B' || k === 'START') {
        if (D.shown < D.text.length) D.shown = D.text.length;
        else { sfx('tick'); nextLine(); if (UI.endingPending && !UI.dlg) { UI.endingPending = false; startEnding(); } }
    }
}
function pauseKey(k) {
    const n = pauseItems().length;
    if (k === 'u') { UI.menuI = (UI.menuI + n - 1) % n; sfx('menu'); }
    if (k === 'd') { UI.menuI = (UI.menuI + 1) % n; sfx('menu'); }
    if (k === 'A') pauseSelect(UI.menuI);
    if (k === 'B' || k === 'ESC' || k === 'START') { UI.mode = 'play'; sfx('menu'); }
}
function deadKey(k) {
    if (k === 'UNDO' || k === 'A') { G.dead = null; undo(); UI.mode = 'play'; handleEvents(); }
    if (k === 'RESET') { G.dead = null; restartRoom(); UI.mode = 'play'; handleEvents(); }
}
function endingKey(k) {
    const E = UI.ending;
    if (E.phase === 4 && E.t > 5 && (k === 'A' || k === 'START')) {
        UI.mode = 'play'; UI.ending = null; G.flags.ended = true; autosave();
        setMusic(musicFor(G.room)); VIS.clear();
    }
}
window.addEventListener('keydown', e => {
    const k = KEYMAP[e.code];
    if (!k) return;
    e.preventDefault();
    if (e.repeat) return;
    press(k);
});
window.addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k && k === held.dir) held.dir = null; });
window.addEventListener('blur', () => { held.dir = null; });

/* touch: a d-pad and buttons under the picture */
function setupTouch() {
    const pad = document.getElementById('touch');
    if (!pad) return;
    document.body.classList.add('touch');
    pad.querySelectorAll('[data-k]').forEach(b => {
        const k = b.dataset.k;
        const down = ev => { ev.preventDefault(); press(k); if ('udlr'.includes(k)) { held.dir = k; held.since = UI.t; held.last = UI.t; } b.classList.add('on'); };
        const up = ev => { ev.preventDefault(); if (held.dir === k) held.dir = null; b.classList.remove('on'); };
        b.addEventListener('touchstart', down, { passive: false }); b.addEventListener('touchend', up, { passive: false }); b.addEventListener('touchcancel', up, { passive: false });
        b.addEventListener('mousedown', down); b.addEventListener('mouseup', up); b.addEventListener('mouseleave', up);
    });
    fit();
}
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) setupTouch();
/* inside a frame the page needs a click before it hears keys */
SCREEN.addEventListener('pointerdown', () => { window.focus(); audioInit(); audioResume(); });
let focused = typeof document.hasFocus === 'function' ? document.hasFocus() : true;
window.addEventListener('focus', () => { focused = true; });
window.addEventListener('blur', () => { focused = false; });

/* ---------- each frame ---------- */
let lastT = performance.now();
function update(dt) {
    UI.t += dt;
    easeVis(dt);
    stepFx(dt);
    for (let i = FLY.length - 1; i >= 0; i--) { FLY[i].t += dt; if (FLY[i].t >= FLY[i].dur) { const f = FLY.splice(i, 1)[0]; if (f.pocket !== undefined) puff(f.x1 + 2, f.y1 + 3, C.Y, 4, 0.5, 0.3); else puff(f.x1 + 2, f.y1 + 3, C.Y, 5, 0.6, 0.35); } }
    if (UI.banner) { UI.banner.t -= dt; if (UI.banner.t <= 0) UI.banner = null; }
    if (UI.reveal > 0) UI.reveal = Math.max(0, UI.reveal - dt);
    if (UI.trans) { UI.trans.t += dt; if (UI.trans.t >= UI.trans.dur) { UI.trans = null; if (pendingKey) { const k = pendingKey; pendingKey = null; press(k); } } }
    if (UI.mode === 'dialog' && UI.dlg && UI.dlg.shown < UI.dlg.text.length) { const before = Math.floor(UI.dlg.shown); UI.dlg.shown += dt * 55; if (Math.floor(UI.dlg.shown) !== before && before % 3 === 0) sfx('blip'); }
    if (UI.mode === 'ending') endingUpdate(dt);
    /* holding a direction keeps walking */
    if (UI.mode === 'play' && held.dir && !UI.trans) {
        const v = VIS.get('@');
        const settled = !v || (Math.abs(v.tx - v.x) < 3 && Math.abs(v.ty - v.y) < 3);
        if (UI.t - held.since > 0.22 && UI.t - held.last > 0.11 && settled) { held.last = UI.t; tryAct({ t: 'move', d: held.dir }); }
    }
    musicTick();
}
function drawFly(g) {
    for (const f of FLY) {
        const k = Math.min(1, f.t / f.dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        const x = lerp(f.x0, f.x1, e), y = lerp(f.y0, f.y1, e) - Math.sin(k * Math.PI) * 16 * (f.arc || 1);
        if (f.v === null || f.v === undefined) continue;
        const img = digitImg(f.v, C.Y, 1);
        R(g, C.k, Math.round(x) - 2, Math.round(y) - 2, img.width + 4, 10); R(g, C.o, Math.round(x) - 1, Math.round(y) - 1, img.width + 2, 8);
        g.drawImage(img, Math.round(x), Math.round(y));
    }
}
function drawHint(g, t) {
    /* the very first time: a little key over the nearest number you could touch */
    if (!UI.hint || UI.mode !== 'play' || G.stats.swaps > 0) return;
    const c = swapTargets().find(c => c.t === 'slot' && c.id !== '@');
    if (!c) return;
    const p = candPos(c); if (!p) return;
    const b = Math.round(Math.sin(t * 4) * 1.5);
    const x = p.x - 4, y = p.y - 16 + b;
    blob(g, x, y, 11, 11, C.w, C.k, roundRect(11, 11, 2));
    R(g, C.W, x + 1, y + 9, 9, 1);
    text(g, 'Z', x + 3, y + 2, C.k);
}
function render(t) {
    if (UI.mode === 'title') { drawTitle(g0, t); return blit(); }
    if (UI.mode === 'ending' && UI.ending && UI.ending.phase !== 3) {
        if (UI.ending.phase === 0) { /* fade over the last picture */ g0.drawImage(worldCv, 0, 0); drawHud(g0, t); }
        drawEnding(g0, t);
        if (flash > 0) { g0.globalAlpha = Math.min(1, flash); g0.fillStyle = flashCol; g0.fillRect(0, 0, VW, VH); g0.globalAlpha = 1; }
        return blit();
    }
    gw.fillStyle = C.z; gw.fillRect(0, 0, VW, VH);
    gw.save(); if (shake > 0) gw.translate(Math.round((Math.random() - 0.5) * shake), Math.round((Math.random() - 0.5) * shake));
    drawScene(gw, t);
    gw.restore();
    g0.fillStyle = C.z; g0.fillRect(0, 0, VW, VH);
    const T0 = UI.trans;
    if (T0 && T0.how === 'slide' && T0.img) {
        const k = Math.min(1, T0.t / T0.dur), e = 1 - Math.pow(1 - k, 3);
        const [dx, dy] = DIR[T0.d];
        const W = VW, Hh = MH * TS;
        g0.save(); g0.beginPath(); g0.rect(0, OY, VW, Hh); g0.clip();
        g0.drawImage(T0.img, 0, OY, W, Hh, Math.round(-dx * W * e), OY + Math.round(-dy * Hh * e), W, Hh);
        g0.drawImage(worldCv, 0, OY, W, Hh, Math.round(dx * W * (1 - e)), OY + Math.round(dy * Hh * (1 - e)), W, Hh);
        g0.restore();
    } else {
        g0.drawImage(worldCv, 0, 0);
        if (T0 && T0.how === 'fade') { const k = Math.min(1, T0.t / T0.dur); g0.fillStyle = `rgba(26,20,32,${1 - k})`; g0.fillRect(0, OY, VW, MH * TS); }
        if (T0 && T0.how === 'morph') { const k = Math.min(1, T0.t / T0.dur); g0.fillStyle = `rgba(255,246,224,${1 - k})`; g0.fillRect(0, OY, VW, MH * TS); }
    }
    if (UI.reveal > 0) { const k = UI.reveal / 1.5; g0.fillStyle = `rgba(95,224,200,${k * 0.35})`; g0.fillRect(0, OY, VW, MH * TS); for (let i = 0; i < 6; i++) puff(Math.random() * VW, OY + Math.random() * MH * TS, C.e, 1, 0.3, 0.8, 0.5); }
    drawHud(g0, t);
    if (UI.mode === 'swap' || UI.mode === 'pocket') drawSel(g0, t);
    drawHint(g0, t);
    drawFly(g0);
    drawBanner(g0);
    if (UI.mode === 'dialog') drawDialog(g0, t);
    if (UI.mode === 'dead') drawDead(g0, t);
    if (UI.mode === 'pause') drawPause(g0, t);
    if (UI.mode === 'album') drawAlbum(g0, t);
    if (UI.mode === 'map') drawMap(g0, t);
    if (UI.mode === 'ending' && UI.ending && UI.ending.phase === 3) { }
    if (flash > 0) { g0.globalAlpha = Math.min(1, flash) * 0.6; g0.fillStyle = flashCol; g0.fillRect(0, OY, VW, MH * TS); g0.globalAlpha = 1; }
    blit();
}
function blit() { SG.imageSmoothingEnabled = false; SG.drawImage(scene, 0, 0); }
function frame(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    try { update(dt); render(now / 1000); } catch (err) { console.error(err); }
    requestAnimationFrame(frame);
}
/* a room change copies the last picture so the new room can slide over it */
const _startTransition = startTransition;
startTransition = function (e) { _startTransition(e); if (UI.trans && UI.trans.how === 'slide') UI.trans.img = copyCanvas(worldCv); };

/* ---------- start ---------- */
loadSettings();
fit();
G = null;
UI.mode = 'title';
setMusic('cape');
requestAnimationFrame(frame);
/* tools for testing (and for the curious) */
if (window.__DEBUG) {
    window.__dbg = {
        get G() { return G; }, act: a => { const r = act(a); handleEvents(); return r; }, press, UI, newGame: () => { newGame(); begin(true); },
        go(room, x, y) { G.room = room; G.p.x = x; G.p.y = y; VIS.clear(); groundCache.key = null; handleEvents(); },
        give(item) { getItem(item); handleEvents(); }, digit(v) { giveDigit(v); handleEvents(); }, hour(h) { G.hour = vdig(h, 2); },
        targets: () => swapTargets(), ROOMS,
    };
}
