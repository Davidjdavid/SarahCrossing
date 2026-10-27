/* ---- 68_rescue.js ---- */
/* Safety nets. The watchdog notices when the game thinks something is going on but nothing is (a dialog nobody is
   waiting for, a panel flag with no panel, "busy" with nothing happening) and lets Sarah move again. Going home works
   from anywhere: the phone's Go home app, or H twice on a keyboard. */
/* is this text box really on screen, in something that's open? */
function liveField(el) {
    if (!el || !el.isConnected) return false;
    if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return false;
    return !!el.closest('#panel:not([hidden]), #studio, #bigmap, #arcade, #title, #photobar');
}
const Watchdog = {
    dlg: 0, modal: 0, busy: 0,
    /* flags that say an overlay is up, when the overlay itself is gone: the keys would go to it forever */
    heal() {
        if (Studio.on && !$('#studio')) { Studio.on = false; Studio.onKey = null; Studio.onResize = null; UI.modal = false; console.warn('watchdog: studio flag without a studio'); }
        if (typeof BigMap !== 'undefined' && BigMap.on && !(BigMap.root && BigMap.root.isConnected)) { BigMap.on = false; BigMap.root = null; console.warn('watchdog: map flag without a map'); }
        if (Arcade.on && !$('#arcade')) { Arcade.on = false; Arcade.state = 'off'; Arcade.g = null; Arcade.U = null; UI.modal = false; console.warn('watchdog: arcade flag without a cabinet'); }
        if (Decor.on && G.area && G.area.id !== 'home') { Decor.exit(); console.warn('watchdog: decorating outside the house'); }
        if (Photo.on && $('#photobar').hidden) { Photo.stop(); console.warn('watchdog: photo mode without its bar'); }
        // (an edit mode whose panel was closed under it: its Done button is gone and the taps still go to it, so it comes back;
        // and they're for the island only, as decorating is for the house)
        for (const T of [typeof IslandEdit !== 'undefined' && IslandEdit, typeof PathTool !== 'undefined' && PathTool, typeof Mover !== 'undefined' && Mover]) {
            if (!T || !T.on) continue;
            if (G.area && G.area.id !== 'island') { if (T === Mover) Mover.cancel(true); else T.close(); console.warn('watchdog: an island edit mode off the island'); continue; }
            if ($('#panel').hidden && !UI.dialogOpen && !G.busy) { T.render(); console.warn('watchdog: an edit mode without its panel'); }
        }
        const f = document.activeElement;
        if (f && f !== document.body && ['INPUT', 'TEXTAREA', 'SELECT'].includes(f.tagName) && !liveField(f)) f.blur();
    },
    minigame() {
        return Dance.on || Karaoke.on || Rope.on || Arcade.on || Photo.on || Decor.on || Studio.on || !!Fishing.st || !!IslandGames.on ||
            (typeof Mover !== 'undefined' && Mover.on) || (typeof PathTool !== 'undefined' && PathTool.on) || (typeof BigMap !== 'undefined' && BigMap.on) ||
            (typeof IslandEdit !== 'undefined' && IslandEdit.on);
    },
    tick() {
        if (G.busy < 0) G.busy = 0;
        if (G.mode !== 'play') { this.dlg = this.modal = this.busy = 0; return; }
        if (G.frame % 15 === 0) this.heal();
        const mg = this.minigame();
        // a dialog left on screen with nothing waiting on it swallows every tap
        if (UI.dialogOpen && !UI._adv && !UI._chooser && !UI._typing && !UI.modal && !G.busy && !mg) {
            if (++this.dlg > 40) { UI.hideDialog(); this.dlg = 0; }
        } else this.dlg = 0;
        // "a panel is open" with no panel showing
        if (UI.modal && $('#panel').hidden && !mg) {
            if (++this.modal > 30) { UI.modal = false; this.modal = 0; }
        } else this.modal = 0;
        // busy, but nothing is showing, nobody is walking anywhere on purpose and no scene is counting frames
        const p = G.player;
        const quiet = G.busy > 0 && !UI.dialogOpen && !UI.modal && !mg && !Waiters.length && !G.fade && !(p && p.glide) &&
            !NPCs.list.some(n => n.script || (n.path && n.onArrive && n.travel));
        if (quiet) {
            if (++this.busy > 600) { console.warn('watchdog: nothing was happening; letting Sarah move again'); this.busy = 0; unstick(); }
        } else this.busy = 0;
    },
};
/* clear every "something is happening" flag */
function unstick() {
    for (let i = 0; i < 3 && Studio.on; i++) { const x = $('#studio .st-head .x'); if (x) x.click(); else break; }
    if (Studio.on) Studio.close();
    if (Decor.on) Decor.exit();
    if (Photo.on) Photo.stop();
    if (Fishing.st) Fishing.stop(true);
    if (IslandGames.on) IslandGames.stop();
    if (typeof Mover !== 'undefined' && Mover.on) Mover.cancel(true);
    if (typeof PathTool !== 'undefined' && PathTool.on) PathTool.close();
    if (typeof BigMap !== 'undefined' && BigMap.on) BigMap.close();
    if (typeof IslandEdit !== 'undefined' && IslandEdit.on) IslandEdit.close();
    UI.close(true);
    UI.hideDialog();
    G.busy = 0; G.fade = 0; G.lockCam = false; G.camTarget = null; G.camShift = null; G.held = null; G.reel = null; G.keys = {};
    for (const n of NPCs.list) n.talking = false;
    const p = G.player;
    if (p) { p.path = null; p.onArrive = null; p.glide = null; p.sit = null; p.sy = undefined; p.pose = null; p.hidden = false; }
}
function playingAGame() { return Dance.on || Karaoke.on || Rope.on || Arcade.on || !!IslandGames.on; }
/* straight home: through Sarah's front door, whatever was going on */
async function goHome() {
    if (G.mode !== 'play') return;
    if (playingAGame()) { UI.toast('Finish (or quit) the game first.'); return; }
    unstick();
    Sfx.play('door');
    if (Online.visitor()) {
        const [tx, ty] = Online.arrival(Online.who());
        await fadeTo(async () => { setArea('island', (tx + 0.5) * TILE, (ty + 0.6) * TILE, 'down'); });
        UI.toast(Online.who() === 'joe' ? 'Back home. The kettle is still warm.' : 'Back at the boat.', 'app_gohome');
        Save.touch();
        return;
    }
    await fadeTo(async () => {
        const a = ensureArea('home');
        setArea('home', (a.doorTile[0] + 0.5) * TILE, (a.doorTile[1] - 0.2) * TILE, 'up');
    });
    Bus.emit('enter', 'home');
    UI.toast('Home sweet home.', 'app_gohome');
    Save.touch();
}
async function askGoHome() {
    UI.close(true);
    const k = await UI.ask(null, Online.visitor() ? (Online.who() === 'joe' ? 'Go home? Joe zips straight to his front door.' : 'Go back to the boat? (Handy if you ever get stuck somewhere.)')
        : G.area.id === 'home' ? "Sarah is already home. Pop back to the front door anyway?" : 'Go home? Sarah will zip straight through her front door. (Handy if she ever gets stuck somewhere.)', ['Go home', 'Stay here']);
    if (k === 0) await goHome();
}
/* H twice (within a couple of seconds) on a keyboard */
let homeKeyT = 0;
function homeKey() {
    if (G.mode !== 'play') return;
    if (playingAGame()) return;
    const now = Date.now();
    if (now - homeKeyT < 2500) { homeKeyT = 0; goHome(); return; }
    homeKeyT = now;
    UI.toast('Press H again to go home.', 'app_gohome');
}

