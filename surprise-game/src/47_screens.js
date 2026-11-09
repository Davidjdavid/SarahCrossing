/* whole screens: the title, the pause menu, the album, the map, fainting, and the end */

function textBig(g, str, x, y, s, col, sh) {
    let cx = x;
    for (const ch of str) {
        if (ch === ' ') { cx += 3 * s; continue; }
        const gl = GLYPH[ch]; if (!gl) { cx += 4 * s; continue; }
        if (sh) g.drawImage(glyphImg(ch, sh), cx + s, y + s, gl.w * s, gl.rows.length * s);
        g.drawImage(glyphImg(ch, col), cx, y, gl.w * s, gl.rows.length * s);
        cx += (gl.w + 1) * s;
    }
}
const textBigW = (str, s) => textW(str) * s;
function panel(g, x, y, w, h, fill = C.w, line = C.k) { blob(g, x, y, w, h, fill, line, roundRect(w, h, 5)); }

/* ---------- title ---------- */
function titleItems() { return hasSave() ? ['Continue', 'New game'] : ['New game']; }
function drawTitle(g, t) {
    for (let y = 0; y < VH; y += 4) { R(g, y < 80 ? C.k : y < 120 ? C.z : C.k, 0, y, VW, 4); }
    R(g, C.z, 0, 0, VW, VH);
    for (let i = 0; i < 40; i++) { const sx = (hash2(i, 1) * VW) | 0, sy = (hash2(i, 2) * 110) | 0; if (Math.sin(t * 2 + i) > -0.3) P1(g, i % 5 ? C.W : C.Y, sx, sy); }
    /* sea and the island */
    R(g, C.B, 0, 130, VW, 62);
    for (let i = 0; i < 12; i++) R(g, C.b, ((i * 37 + t * 8) % (VW + 20)) - 10, 136 + (i % 4) * 12, 10, 1);
    blob(g, -20, 112, 190, 40, C.D, C.k, ellipse(95, 20, 95, 20));
    blob(g, 150, 100, 70, 40, C.u, C.k, ellipse(35, 20, 35, 20));
    /* the lighthouse, dark */
    const lx = 176, ly = 46;
    g.drawImage(lighthouseImg(false), 0, 0, 48, 128, lx, ly, 24, 64);
    /* the courier, carrying the one */
    const kx = 60, ky = 108;
    g.drawImage(personImg('player', 'r', Math.floor(t * 4) % 2), kx, ky);
    const b = Math.round(Math.sin(t * 3) * 2);
    R(g, C.k, kx + 3, ky - 13 + b, 9, 11); R(g, C.o, kx + 4, ky - 12 + b, 7, 9);
    g.drawImage(digitImg(1, C.Y, 1), kx + 6, ky - 11 + b);
    if (Math.random() < 0.2) puff(kx + 8, ky - 8 + b, C.Y, 1, 0.3, 0.6, 0.6);
    drawFx(g);
    const title = 'CARRY THE ONE';
    textBig(g, title, Math.round(VW / 2 - textBigW(title, 2) / 2), 22, 2, C.Y, C.R);
    const items = titleItems();
    items.forEach((it, i) => {
        const y = 150 + i * 13, on = UI.titleI === i;
        if (on) { const w = textW(it) + 14; blob(g, VW / 2 - w / 2, y - 3, w, 13, C.y, C.k, roundRect(w, 13, 3)); }
        textC(g, it, VW / 2, y, on ? C.k : C.W);
    });
    if (UI.sureNew) textC(g, 'This replaces your saved game. Z again to start over.', VW / 2, VH - 12, C.r);
    if (!UI.sureNew) textC(g, focused ? 'arrows to move    Z to choose' : 'click here first, then press Z', VW / 2, VH - 12, focused ? C.G : C.Y);
}

/* ---------- pause ---------- */
function pauseItems() {
    const it = ['Back to the game', 'Stamps'];
    if (G.items.map) it.push('Map');
    it.push('Music: ' + (AU.music ? 'on' : 'off'), 'Sounds: ' + (AU.sound ? 'on' : 'off'), 'Start this room over', 'Walk home', 'Save and quit');
    return it;
}
function drawPause(g, t) {
    g.fillStyle = 'rgba(26,20,32,0.7)'; g.fillRect(0, 0, VW, VH);
    const items = pauseItems();
    const w = 120, h = 14 + items.length * 12;
    const x = 12, y = 26;
    panel(g, x, y, w, h);
    items.forEach((it, i) => { const on = UI.menuI === i; if (on) R(g, C.y, x + 4, y + 6 + i * 12, w - 8, 11); text(g, it, x + 9, y + 8 + i * 12, C.k); });
    /* how to play: just the keys */
    const kx = 140, ky = 26, kw = 108;
    const keys = [['arrows', 'move'], ['Z', G.stats.swaps ? 'swap' : '?'], ['X', 'back'], ['C', 'wait'], ['U', 'undo'], ['R', 'retry room'], ['Esc', 'menu']];
    panel(g, kx, ky, kw, 14 + keys.length * 11, C.K, C.k);
    keys.forEach(([k, d], i) => { text(g, k, kx + 8, ky + 8 + i * 11, C.Y); text(g, d, kx + 46, ky + 8 + i * 11, C.W); });
    const st = G.stats;
    const lines = [`Steps ${st.steps}`, `Swaps ${st.swaps}`, `Stamps ${Object.keys(G.stamps).length}`];
    lines.forEach((l, i) => text(g, l, kx + 8, ky + 100 + i * 11, C.W));
}
function pauseSelect(i) {
    const it = pauseItems()[i];
    sfx('menu');
    if (it.startsWith('Back')) UI.mode = 'play';
    else if (it === 'Stamps') UI.mode = 'album';
    else if (it === 'Map') UI.mode = 'map';
    else if (it.startsWith('Music')) { setMusicOn(!AU.music); saveSettings(); }
    else if (it.startsWith('Sounds')) { setSoundOn(!AU.sound); saveSettings(); }
    else if (it.startsWith('Start')) { UI.mode = 'play'; restartRoom(); handleEvents(); }
    else if (it.startsWith('Walk')) { UI.mode = 'play'; if (G.room === 'square') { sfx('refuse'); return; } goHome(); handleEvents(); }
    else if (it.startsWith('Save')) { autosave(); UI.mode = 'title'; UI.titleI = 0; setMusic('cape'); }
}

/* ---------- the stamp album ---------- */
/* each missing stamp has a rumor: a nudge, never the answer */
const STAMP_RUMOR = {
    hatch: 'Something in a nest is waiting to be.', hollow: 'The oldest tree keeps a door.', mirror: 'Some stones see things the other way up.',
    hour: 'There is an hour no clock admits to.', nowhere: 'Some letters go nowhere. So can you.', house: 'An empty lot, waiting for its first birthday.',
    cellar: 'The quarry floor can\'t hold everyone.', shore: 'The sea is only as wide as it says.', walk: 'Halfway is a place, if you walk there.',
};
function drawAlbum(g, t) {
    g.fillStyle = 'rgba(26,20,32,0.8)'; g.fillRect(0, 0, VW, VH);
    panel(g, 20, 8, VW - 40, VH - 16, C.Y, C.k);
    textC(g, 'Stamps', VW / 2, 13, C.k);
    const sel = UI.albumI || 0;
    STAMPS.forEach((id, i) => {
        const cx = 40 + (i % 3) * 64, cy = 26 + Math.floor(i / 3) * 42;
        if (i === sel) { const k = Math.sin(t * 6) > 0 ? C.o : C.u; g.strokeStyle = k; g.strokeRect(cx + 7.5, cy - 2.5, 29, 33); }
        if (G.stamps[id]) g.drawImage(stampImg(id), cx + 10, cy, 24, 28);
        else { R(g, C.T, cx + 10, cy, 24, 28); dotted(g, cx + 10, cy, 24, 28, C.u); textC(g, '?', cx + 22, cy + 10, C.u); }
    });
    const id = STAMPS[sel];
    const line = G.stamps[id] ? STAMP_NAME[id] : STAMP_RUMOR[id];
    blob(g, 28, VH - 50, VW - 56, 26, C.w, C.u, roundRect(VW - 56, 26, 3));
    wrap(line, VW - 72).slice(0, 2).forEach((l, i) => textC(g, l, VW / 2, VH - 46 + i * 10, G.stamps[id] ? C.k : C.u));
    textC(g, `${Object.keys(G.stamps).length} of ${STAMPS.length}`, VW / 2, VH - 20, C.u);
}

/* ---------- the map ---------- */
const MAPPOS = { fortyard: [2, -1], fortgate: [2, 0], mirror: [0, 1], deepwood: [1, 1], woodedge: [2, 1], clockhill: [3, 1], mere: [0, 2], westlane: [1, 2], square: [2, 2], eastlane: [3, 2], mill: [0, 3], quarry: [1, 3], harbor: [2, 3], road: [4, 2], cliff: [5, 2] };
function drawMap(g, t) {
    g.fillStyle = 'rgba(26,20,32,0.85)'; g.fillRect(0, 0, VW, VH);
    panel(g, 16, 14, VW - 32, VH - 28, C.T, C.k);
    textC(g, 'Tally', VW / 2, 20, C.k);
    const seen = G.flags.seen || {};
    const cw = 30, ch = 22, ox = 40, oy = 54;
    let here = G.room;
    if (!MAPPOS[here]) { const r = rs().ret; here = r && MAPPOS[r.room] ? r.room : null; }
    for (const [id, [mx, my]] of Object.entries(MAPPOS)) {
        const x = ox + mx * cw, y = oy + my * ch;
        if (!seen[id] && id !== G.room) { dotted(g, x, y, cw - 2, ch - 2, C.t); continue; }
        R(g, id === 'road' ? C.t : ROOMS[id].music === 'woods' || ROOMS[id].music === 'pond' ? C.n : ROOMS[id].music === 'sea' || id === 'cliff' ? C.b : ROOMS[id].music === 'fort' ? C.g : C.Y, x, y, cw - 2, ch - 2);
        g.strokeStyle = C.k; g.strokeRect(x + 0.5, y + 0.5, cw - 3, ch - 3);
        if (id === here && Math.sin(t * 6) > 0) { R(g, C.r, x + cw / 2 - 3, y + ch / 2 - 3, 5, 5); }
    }
    text(g, 'the Long Road', ox + 4 * cw - 2, oy + 2 * ch + 22, C.u);
}

/* ---------- fainting ---------- */
const DEATH = { hp: 'You fainted.', sink: 'You sank like a stone.', fall: 'You fell.', unborn: 'You haven\'t been born yet.' };
function drawDead(g, t) {
    g.fillStyle = 'rgba(26,20,32,0.55)'; g.fillRect(0, TOP, VW, MH * TS);
    const msg = DEATH[G.dead] || 'Oh dear.';
    const w = Math.max(textW(msg), 150) + 24;
    panel(g, VW / 2 - w / 2, 70, w, 44);
    textC(g, msg, VW / 2, 78, C.k);
    textC(g, 'U  undo        R  retry room', VW / 2, 96, C.u);
}

/* ---------- the end ---------- */
function startEnding() {
    UI.mode = 'ending';
    UI.ending = { t: 0, phase: 0 };
    setMusic('ending');
    FX.length = 0;
}
function endingUpdate(dt) {
    const E = UI.ending;
    E.t += dt;
    if (E.phase === 0 && E.t > 1.2) { E.phase = 1; E.t = 0; E.rolled = 0; }
    if (E.phase === 1) {
        const k = Math.floor((E.t - 0.8) / 0.7);
        if (k > E.rolled - 1 && E.rolled < 5 && E.t > 0.8) { E.rolled++; if (E.rolled <= 4) sfx('carry'); else { sfx('lamp'); flash = 1; flashCol = C.Y; } }
        if (E.t > 7.2) { E.phase = 2; E.t = 0; }
    }
    if (E.phase === 2 && E.t > 6) {
        E.phase = 3; E.t = 0;
        G.room = 'harbor'; G.hour = [2, 1]; G.p.x = 8; G.p.y = 4; G.p.dir = 'd';
        if (G.follow) { G.follow.x = 7; G.follow.y = 4; }
        UNDO.length = 0; entrySnap = snapCore(true); autosave();
        VIS.clear();
        UI.mode = 'dialog';
        sayLines(['There you are.'], 'keeper');
        sayLines(['I saw the light from miles out.', 'You left it on.'], 'son');
        sayLines(['Of course I did.'], 'keeper');
        UI.afterDlg = () => { UI.mode = 'ending'; UI.ending = { t: 0, phase: 4 }; };
    }
}
function drawEnding(g, t) {
    const E = UI.ending;
    if (E.phase === 0) { g.fillStyle = `rgba(26,20,32,${Math.min(1, E.t / 1.2)})`; g.fillRect(0, 0, VW, VH); return; }
    if (E.phase === 1 || E.phase === 2) {
        /* the cape at night, from the sea */
        R(g, C.z, 0, 0, VW, VH);
        for (let i = 0; i < 50; i++) P1(g, i % 4 ? C.W : C.Y, (hash2(i, 9) * VW) | 0, (hash2(i, 8) * 90) | 0);
        R(g, C.B, 0, 120, VW, 72);
        for (let i = 0; i < 14; i++) R(g, C.b, ((i * 29 + t * 6) % (VW + 20)) - 10, 126 + (i % 5) * 12, 12, 1);
        blob(g, 60, 104, 160, 40, C.D, C.k, ellipse(80, 20, 80, 20));
        const lit = E.phase === 2 || E.rolled >= 5;
        const lx = 116, ly = 4;
        g.drawImage(lighthouseImg(lit), lx, ly);
        const ys = LH_WIN;
        for (let i = 0; i < 4; i++) {
            const shown = (E.phase === 2 || E.rolled > 3 - i) ? 0 : 9;
            R(g, C.k, lx + 18, ly + ys[i], 12, 12); R(g, C.B, lx + 19, ly + ys[i] + 1, 10, 10);
            g.drawImage(digitImg(shown, C.Y, 1), lx + 22, ly + ys[i] + 3);
            if (E.phase === 1 && E.rolled === 4 - i && Math.random() < 0.5) puff(lx + 24, ly + ys[i] + 6, C.Y, 2, 0.6, 0.5, 1);
        }
        if (E.phase === 1 && E.rolled >= 4) {
            /* the carried one, rising */
            const k = Math.min(1, (E.t - (0.8 + 0.7 * 4)) / 0.7);
            if (k < 1) { g.drawImage(digitImg(1, C.Y, 2), lx + 20, ly + 30 - k * 18); }
        }
        if (lit) {
            const a = t * 0.8;
            g.save(); g.globalAlpha = 0.28; g.fillStyle = C.Y;
            g.beginPath(); g.moveTo(lx + 24, ly + 16); g.lineTo(lx + 24 + Math.cos(a) * 300, ly + 16 + Math.sin(a) * 40 - 20); g.lineTo(lx + 24 + Math.cos(a + 0.12) * 300, ly + 16 + Math.sin(a + 0.12) * 40 + 10); g.closePath(); g.fill();
            g.restore();
            g.fillStyle = 'rgba(255,240,170,0.25)'; g.beginPath(); g.arc(lx + 24, ly + 16, 22, 0, 7); g.fill();
        }
        if (E.phase === 2) {
            const k = Math.min(1, E.t / 5.5);
            const sx = 10 + k * 60, sy = 126 + k * 14, s = 0.5 + k * 1.2;
            R(g, C.Y, sx, sy - 3 * s, 2, 2);
            g.fillStyle = C.k; g.fillRect(sx - 4 * s, sy, 10 * s, 3 * s); g.fillRect(sx, sy - 8 * s, 1 * s, 8 * s);
            g.fillStyle = C.w; g.fillRect(sx + 1 * s, sy - 7 * s, 4 * s, 5 * s);
        }
        drawFx(g);
        return;
    }
    if (E.phase === 4) {
        R(g, C.z, 0, 0, VW, VH);
        const title = 'CARRY THE ONE';
        textBig(g, title, Math.round(VW / 2 - textBigW(title, 2) / 2), 30, 2, C.Y, C.R);
        const st = G.stats;
        const lines = ['Thank you for carrying it.', '', `${st.steps} steps    ${st.swaps} ${st.swaps === 1 ? 'swap' : 'swaps'}`, `${Object.keys(G.stamps).length} of ${STAMPS.length} stamps`, '', 'The island is still there,', 'if you want to look around.'];
        lines.forEach((l, i) => { if (E.t > 1 + i * 0.4) textC(g, l, VW / 2, 66 + i * 12, i === 0 ? C.W : C.g); });
        if (E.t > 5 && Math.sin(t * 4) > 0) textC(g, 'Z', VW / 2, VH - 16, C.Y);
    }
}
