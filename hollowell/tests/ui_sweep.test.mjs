// Every screen and menu, drawn in its fullest state (the longest name a player can type, every tool and thing, every
// note, every room's name), with the probe watching each frame for text that runs out of its panel or off the screen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

function sweep(preset, more) {
    const HW = loadGame();
    HW.preset(preset); HW.step(5); HW.skipTalk();
    HW.G.wanderer = 'WWWWWWWWWW';
    if (more) more(HW);
    const P = HW.probe(true);
    const G = HW.G, M = HW.global('PauseMenu'), O = HW.global('Options'), C = HW.global('Controls'), Game = HW.global('Game');
    const draw = (n = 1) => { for (let i = 0; i < n; i++) { Game.render(); P.frame(); } };
    /* the pause menu, every tab, every selection */
    M.open();
    M.tabs.forEach((t, ti) => {
        M.tab = ti;
        for (let s = 0; s < 12; s++) { M.sel = s % Math.max(1, t === 'Satchel' ? HW.Inv.tools.length : t === 'Save' ? M.saveItems().length : 1); M.saveMsg = s % 2 ? 60 : 0; draw(); }
    });
    M.tab = M.tabs.indexOf('Options'); O.focus = true;
    for (let s = 0; s < O.rows().length; s++) { O.sel = s; draw(); }
    C.start(); for (let s = 0; s < C.list().length; s++) { C.sel = s; draw(); C.wait = C.list()[s]; draw(); C.wait = null; }
    C.msg = 'Act: talk, lift, read: Right Shift.'; draw(); C.close(); O.focus = false;
    M.close();
    /* banners for every place, toasts stacked, the HUD at its fullest */
    const UI = HW.global('UI');
    for (const [id, d] of Object.entries(HW.AREAS)) {
        UI.showBanner(d.name || id, d.place); UI.banner.t = 60; draw();
        for (const r of (d.rooms || [])) if (r.name) { UI.showBanner(r.name); UI.banner.t = 60; draw(); }
    }
    UI.banner = null;
    HW.Inv.maxHp = 40; HW.Inv.buttons = 99999; draw();
    return P.report().issues.filter(i => i.kind === 'text');
}

test('every menu and screen, late in the game: nothing runs out of its panel or off the screen', () => {
    const issues = sweep('afterEnding', HW => {
        for (const id of Object.keys(HW.global('ITEMS'))) { const I = HW.global('ITEMS')[id]; if (I.kind === 'tool') HW.Inv.giveTool(id); else if (I.kind !== 'hidden') HW.Inv.items[id] = 1; }
        for (const n of Object.keys(HW.global('NOTES'))) if (!HW.Progress.notes.includes(n)) HW.Progress.notes.push(n);
    });
    assert.equal(issues.length, 0, issues.map(i => i.key + ' -- ' + i.detail).join('\n'));
});

test('every menu and screen, at the start: nothing runs out of its panel or off the screen', () => {
    const issues = sweep('afterD1');
    assert.equal(issues.length, 0, issues.map(i => i.key + ' -- ' + i.detail).join('\n'));
});
