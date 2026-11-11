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

test('the satchel with every thing in the game and thirty more: nothing overlaps, every thing can be picked and seen, and all of what each one is shows', () => {
    const HW = loadGame();
    HW.preset('afterEnding'); HW.step(5); HW.skipTalk();
    const ITEMS = HW.global('ITEMS'), M = HW.global('PauseMenu'), Game = HW.global('Game'), Font = HW.global('Font'), Gfx = HW.global('Gfx');
    for (const id of Object.keys(ITEMS)) { const I = ITEMS[id]; if (I.kind === 'tool') HW.Inv.giveTool(id); else if (I.kind !== 'hidden') HW.Inv.items[id] = 1; }
    /* (more than the game will ever hold: "however many" is held to it; every real thing's words are checked below too) */
    for (let i = 0; i < 30; i++) { ITEMS['spare' + i] = { name: 'A spare thing number ' + i, kind: 'keepsake', desc: 'Something kept for no reason at all, which is the best reason there is: it was there.' }; HW.Inv.items['spare' + i] = 1; }
    HW.Inv.buttons = 99999; HW.Inv.maxHp = 40; HW.G.wanderer = 'WWWWWWWWWW';
    const P = HW.probe(true), S = M.SAT;
    M.open(); M.tab = M.tabs.indexOf('Satchel');
    const things = M.things();
    assert.ok(things.length > 2 * S.perRow * 2, `a satchel fuller than the screen (${things.length} things)`);
    /* one frame drawn: the words and the boxes */
    const frame = () => {
        const texts = [], cells = [], r0 = Gfx.rect, d0 = Font.draw;
        Gfx.rect = function (x, y, w, h, c) { if (w === 20 && h === 20) cells.push([x, y]); return r0.apply(this, arguments); };
        Font.draw = function (s, x, y) { texts.push([s, x, y, Font.width(s)]); return d0.apply(this, arguments); };
        try { Game.render(); P.frame(); } finally { Gfx.rect = r0; Font.draw = d0; }
        return { texts, cells };
    };
    const picks = [...HW.Inv.tools.map((t, i) => [0, i]), ...things.map((t, i) => [1, i])];
    for (const [row, i] of picks) {
        M.row = row; if (row) M.tsel = i; else M.sel = i;
        const { texts, cells } = frame(), pick = row ? things[i] : HW.Inv.tools[i];
        /* the picked thing's own box is drawn (its row scrolled into view), and only whole rows of boxes, never more than fit */
        if (row) { const k = i % S.perRow; assert.ok(cells.some(([x, y]) => x === 24 + k * S.pitch && y >= S.gridY && y < S.gridY + S.rows * S.pitch), `${pick}'s box is shown`); }
        assert.ok(cells.length <= S.perRow * S.rows, `${cells.length} boxes drawn`);
        /* all of what it is: every line of it drawn, above the foot */
        const vis = Math.min(S.rows, Math.ceil(things.length / S.perRow)), descY = S.gridY + vis * S.pitch, room = Math.floor((S.footY - descY) / 10);
        const want = M.satchelLines(pick, room);
        assert.ok(want.length <= room, `${pick}: ${want.length} lines for ${room}`);
        for (const l of want) assert.ok(texts.some(t => t[0] === l && t[2] >= descY && t[2] + 8 <= S.footY), `${pick}: "${l}" drawn above the foot`);
        assert.ok(texts.some(t => /Buttons 99999/.test(t[0]) && t[2] === S.footY), 'the foot');
        /* no words over the boxes (but a thing with no picture of its own, a "?" in its box) */
        for (const [s, x, y, w] of texts) for (const [cx, cy] of cells) {
            const inside = x >= cx && x + w <= cx + 20 && y >= cy && y + 8 <= cy + 20;
            assert.ok(inside || x + w <= cx || x >= cx + 20 || y + 8 <= cy || y >= cy + 20, `"${s}" over a box at ${cx},${cy}`);
        }
    }
    /* the arrows walk the rows: down from the tools, down through the things (the rows scroll), up back to the tools */
    M.row = 0; M.sel = 0; M.tsel = 0; M.ttop = 0;
    HW.press('down', 1); assert.equal(M.row, 1);
    for (let n = 1; n * S.perRow < things.length; n++) { HW.press('down', 1); assert.equal(M.tsel, n * S.perRow); frame(); assert.ok(M.ttop <= n && n < M.ttop + S.rows, `row ${n} in view`); }
    while (M.row === 1) HW.press('up', 1);
    assert.equal(M.tsel, 0); frame(); assert.equal(M.ttop, 0);
    const issues = P.report().issues.filter(i => i.kind === 'text');
    assert.equal(issues.length, 0, issues.map(i => i.key + ' -- ' + i.detail).join('\n'));
    M.close();
});
