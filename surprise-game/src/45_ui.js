/* the hud, the swap cursor, talking, menus, and what each event looks and sounds like */

const UI = {
    mode: 'title', sel: null, dlg: null, dlgQ: [], banner: null, menuI: 0, titleI: 0, trans: null,
    lastPocket: 0, hint: true, t: 0, reveal: 0, album: false, ending: null,
};
const NAMES = {
    postmaster: 'Postmaster', gran: 'Gran', pip: 'Pip', dot: 'Dot', fife: 'Mrs. Fife', sev: 'Old Sev', sev_in: 'Old Sev', tock: 'Tock', guard: 'Guard',
    marlo: 'Marlo', marlo_in: 'Marlo', grist: 'Grist', grist_in: 'Grist', keeper: 'The Keeper', son: 'Ned', squirrel: 'Squirrel', prisoner: 'Prisoner',
    clerk: 'The Clerk', hourling: '??', miner: 'Old Miner', walker: 'A walker', mirror: '',
};
const ITEM_TEXT = {
    letter: ['A letter. "To: the Keeper. No. 0."'],
    satchel: ['A bigger satchel!'],
    map: ['A map of the island. (Open it from the menu.)'],
    watch: ['A pocket watch. It keeps whatever time you tell it.'],
    specs: ['Spectacles.'],
};
const STAMP_NAME = { hatch: 'Hatchling', hollow: 'The Hollow', mirror: 'Upside Down', hour: 'The Hour That Isn\'t', nowhere: 'Nowhere', house: 'Housewarming', cellar: 'The Old Dig', shore: 'The Far Shore', walk: 'Halfway' };

/* ---------- the hud ---------- */
const POCKET_X = 3;
function pocketPos(i) { return { x: POCKET_X + 13 + i * 15, y: 2 }; }
function drawHud(g, t) {
    R(g, C.k, 0, 0, VW, TOP); R(g, C.K, 0, TOP - 1, VW, 1);
    /* the satchel */
    R(g, C.u, POCKET_X, 3, 10, 10); R(g, C.t, POCKET_X + 1, 4, 8, 4); R(g, C.d, POCKET_X + 3, 1, 4, 2); P1(g, C.y, POCKET_X + 5, 6);
    G.pocket.forEach((d, i) => {
        const { x, y } = pocketPos(i);
        const sel = UI.mode === 'pocket' && UI.sel.pi === i;
        blob(g, x, y, 13, 12, sel ? C.y : C.d, sel ? C.w : C.u, roundRect(13, 12, 2));
        const hide = FLY.some(f => f.pocket === i);
        if (d !== null && !hide) { const img = digitImg(d, C.w, 1); g.drawImage(img, x + 7 - Math.ceil(img.width / 2), y + 3); }
    });
    /* your own numbers */
    let x = POCKET_X + 15 + G.pocket.length * 15 + 4;
    const self = (key, ds) => {
        g.drawImage(iconImg(key, ICON_COL[key]), x, 5); x += 7;
        for (const d of ds) { if (!FLY.some(f => f.hide && f.hide.id === '@' && f.hide.key === key)) g.drawImage(digitImg(d, C.w, 1), x, 5); x += 5; }
        x += 5;
    };
    self('hp', G.p.s.hp); self('str', G.p.s.str); self('wt', G.p.s.wt);
    if (G.items.specs) self('age', G.p.s.age);
    /* right side: gold and the watch */
    let rx = VW - 4;
    const right = (key, ds) => { const w = 7 + ds.length * 5; rx -= w; let xx = rx; g.drawImage(iconImg(key, ICON_COL[key]), xx, 5); xx += 7; for (const d of ds) { g.drawImage(digitImg(d, C.w, 1), xx, 5); xx += 5; } rx -= 6; };
    right('gold', G.p.s.gold);
    if (G.items.watch) right('hour', G.hour);
    if (G.items.letter && !G.flags.letterRead) { rx -= 9; R(g, C.w, rx, 4, 9, 7); R(g, C.k, rx, 4, 9, 1); P1(g, C.k, rx + 1, 5); P1(g, C.k, rx + 7, 5); R(g, C.k, rx + 2, 6, 5, 1); }
}

/* ---------- swapping: the cursor ---------- */
function selfCardPos() {
    const v = VIS.get('@') || { x: G.p.x * TS, y: G.p.y * TS + OY };
    const keys = slotKeys(SELF);
    const w = keys.reduce((a, k) => a + tagSize(slotGet(SELF, k).length).w + 2, 0) + 4;
    let x = Math.round(v.x + 8 - w / 2), y = Math.round(v.y - 30);
    if (y < TOP + 2) y = Math.round(v.y + 20);
    x = clamp(x, 2, VW - w - 2);
    return { x, y, w, keys };
}
function drawSelfCard(g) {
    const { x, y, w, keys } = selfCardPos();
    blob(g, x, y, w, 14, C.K, C.k, roundRect(w, 14, 3));
    let cx = x + 3;
    for (const k of keys) { const { w: tw } = drawTag(g, SELF, k, slotGet(SELF, k), cx, y + 2); cx += tw + 2; }
}
function candPos(c) {
    if (c.t === 'drop') return { x: c.x * TS + 6, y: c.y * TS + OY + 5, w: 4 };
    if (c.t === 'loose') { const p = TAGS[c.id] && TAGS[c.id].v; return p ? p[0] : null; }
    const p = TAGS[c.id] && TAGS[c.id][c.key];
    return p ? p[c.i] : null;
}
function openSwap() {
    const cands = swapTargets().filter(c => c.t === 'drop' || candPos(c) || c.id === '@');
    if (!cands.length) return;
    const [dx, dy] = DIR[G.p.dir];
    const fx = G.p.x + dx, fy = G.p.y + dy;
    let i = cands.findIndex(c => c.t === 'loose' && (() => { const e = entById(c.id); return e && e.x === G.p.x && e.y === G.p.y; })());
    const faced = cands.findIndex(c => {
        if (c.t === 'drop' || c.id === '@') return false;
        if (c.t === 'loose') { const e = entById(c.id); return e && e.x === fx && e.y === fy; }
        if (c.id === 'chick') return G.follow.x === fx && G.follow.y === fy;
        const e = entById(c.id); return e && touchable(e, fx, fy);
    });
    if (faced >= 0) i = faced;
    if (i < 0) i = cands.findIndex(c => c.id === '@');
    if (i < 0) i = 0;
    UI.sel = { cands, i, pi: UI.lastPocket };
    UI.mode = 'swap';
    UI.hint = false;
    sfx('open');
}
function moveSel(d) {
    const S = UI.sel;
    const cur = candPos(S.cands[S.i]);
    if (!cur) return;
    const [dx, dy] = DIR[d];
    let best = -1, bs = Infinity;
    S.cands.forEach((c, j) => {
        if (j === S.i) return;
        const p = candPos(c); if (!p) return;
        const vx = p.x - cur.x, vy = p.y - cur.y;
        const along = vx * dx + vy * dy;
        if (along <= 0) return;
        const across = Math.abs(vx * dy) + Math.abs(vy * dx);
        const s = along + across * 2.5;
        if (s < bs) { bs = s; best = j; }
    });
    if (best >= 0) { S.i = best; sfx('tick'); }
}
function validPockets(c) {
    const out = [];
    G.pocket.forEach((d, i) => {
        if (c.t === 'loose') out.push(i);
        else if (d !== null) out.push(i);
    });
    return out;
}
function confirmSel() {
    const S = UI.sel, c = S.cands[S.i];
    if (UI.mode === 'swap') {
        let ok = validPockets(c);
        if (c.t === 'loose' && G.pocket.includes(null) && G.pocket.length > 1) {
            /* an empty pocket is the natural place for something picked up, but the full ones are offered too */
        }
        if (!ok.length) { sfx('refuse'); shakeTags(c); return; }
        if (ok.length === 1) return doIt(c, ok[0]);
        UI.mode = 'pocket';
        if (!ok.includes(S.pi)) S.pi = c.t === 'loose' && G.pocket.indexOf(null) >= 0 ? G.pocket.indexOf(null) : ok[0];
        sfx('tick');
        return;
    }
    if (UI.mode === 'pocket') {
        if (!validPockets(c).includes(S.pi)) { sfx('refuse'); return; }
        doIt(c, S.pi);
    }
}
function doIt(c, pi) {
    UI.lastPocket = pi;
    UI.mode = 'play';
    const before = candPos(c);
    const r = act({ t: 'swap', tg: c, pi });
    if (!r) { sfx('refuse'); shakeTags(c); EV.length = 0; return; }
    handleEvents({ swapFrom: before, swapPi: pi, swapTg: c });
}
function shakeTags(c) { shake = 2; }
function drawSel(g, t) {
    const S = UI.sel;
    drawSelfCard(g);
    /* every candidate gets a soft frame; the chosen one a bright, pulsing one */
    S.cands.forEach((c, j) => {
        const p = candPos(c); if (!p) return;
        const on = j === S.i;
        if (c.t === 'drop') {
            const pulse = on ? (Math.sin(t * 8) > 0 ? C.y : C.w) : C.W;
            dotted(g, c.x * TS + 3, c.y * TS + OY + 3, 10, 10, pulse);
            return;
        }
        if (!on) { g.globalAlpha = 0.6; g.strokeStyle = C.w; g.lineWidth = 1; g.strokeRect(p.x - 1.5, p.y - 1.5, p.w + 3, 9); g.globalAlpha = 1; }
    });
    const c = S.cands[S.i], p = candPos(c);
    if (p && c.t !== 'drop') {
        const k = Math.sin(t * 8) > 0 ? C.y : C.o;
        g.strokeStyle = k; g.lineWidth = 1; g.strokeRect(p.x - 2.5, p.y - 2.5, p.w + 5, 11);
        R(g, k, p.x + Math.floor(p.w / 2) - 1, p.y - 6 + Math.round(Math.sin(t * 6)), 3, 2); P1(g, k, p.x + Math.floor(p.w / 2), p.y - 4 + Math.round(Math.sin(t * 6)));
    }
    /* a word on what the cursor is on */
    const label = candLabel(c);
    if (label) { const w = textW(label) + 6; const ly = OY + MH * TS - 14; blob(g, VW / 2 - w / 2, ly, w, 12, C.k, C.K, roundRect(w, 12, 3)); textC(g, label, VW / 2, ly + 2, C.w); }
}
function candLabel(c) {
    if (c.t === 'drop') return 'put it down';
    if (c.t === 'loose') return 'pick up';
    const nm = c.id === '@' ? 'you' : null;
    const k = SLOT_NAMES[c.key] || c.key;
    if (UI.mode === 'pocket') return 'which?';
    return nm ? `your ${k}` : null;
}

/* ---------- dialog ---------- */
function sayLines(lines, who) {
    for (const l of lines) UI.dlgQ.push({ text: l, who });
    if (!UI.dlg) nextLine();
}
function nextLine() {
    UI.dlg = UI.dlgQ.shift() || null;
    if (UI.dlg) { UI.dlg.shown = 0; UI.dlg.rows = wrap(UI.dlg.text, VW - 28); if (UI.mode !== 'dialog') UI.prevMode = UI.mode === 'dialog' ? 'play' : UI.mode; UI.mode = 'dialog'; }
    else { UI.mode = UI.prevMode === 'swap' || UI.prevMode === 'pocket' ? 'play' : (UI.prevMode || 'play'); if (UI.mode === 'dialog') UI.mode = 'play'; if (UI.afterDlg) { const f = UI.afterDlg; UI.afterDlg = null; f(); } }
}
function drawDialog(g, t) {
    const D = UI.dlg; if (!D) return;
    const h = 14 + D.rows.length * FONT_H;
    const y = VH - h - 4;
    blob(g, 4, y, VW - 8, h, C.w, C.k, roundRect(VW - 8, h, 4));
    R(g, C.T, 6, y + h - 3, VW - 12, 1);
    if (D.who && NAMES[D.who]) { const nm = NAMES[D.who]; const w = textW(nm) + 8; blob(g, 10, y - 9, w, 12, C.u, C.k, roundRect(w, 12, 3)); text(g, nm, 14, y - 7, C.w); }
    let n = Math.floor(D.shown);
    D.rows.forEach((row, i) => { const s = row.slice(0, Math.max(0, n)); n -= row.length; text(g, s, 12, y + 7 + i * FONT_H, C.k); });
    if (D.shown >= D.text.length && Math.sin(t * 6) > 0) { R(g, C.u, VW - 18, y + h - 9, 5, 2); R(g, C.u, VW - 17, y + h - 7, 3, 1); }
}

/* ---------- banners ---------- */
function banner(str, sub, col = C.w, dur = 1.6) { UI.banner = { str, sub, col, t: dur, max: dur }; }
function drawBanner(g) {
    const B = UI.banner; if (!B) return;
    const a = Math.min(1, B.t / 0.3, (B.max - B.t) / 0.2 + 0.001);
    g.globalAlpha = Math.max(0, Math.min(1, a));
    const w = Math.max(textW(B.str), B.sub ? textW(B.sub) : 0) + 16;
    const h = B.sub ? 26 : 16;
    blob(g, VW / 2 - w / 2, TOP + 6, w, h, C.k, C.K, roundRect(w, h, 4));
    textC(g, B.str, VW / 2, TOP + 10, B.col);
    if (B.sub) textC(g, B.sub, VW / 2, TOP + 20, C.W);
    g.globalAlpha = 1;
}

/* ---------- turning events into sights and sounds ---------- */
function tagCenter(id, key, i) { const p = TAGS[id] && TAGS[id][key] && TAGS[id][key][i]; return p ? { x: p.x + 2, y: p.y + 3 } : null; }
function handleEvents(ctx = {}) {
    const evs = EV.splice(0);
    let says = [];
    for (const e of evs) {
        const ent = e.id ? entById(e.id) : null;
        const ev = ent ? VIS.get(ent.id) : null;
        const cx = ev ? ev.x + 8 : 0, cy = ev ? ev.y + 8 : 0;
        switch (e.t) {
            case 'step': sfx(e.heavy ? 'heavystep' : 'step'); if (e.heavy) { shake = 1.5; puff(G.p.x * TS + 8, G.p.y * TS + OY + 14, C.T, 3, 0.4, 0.3); } break;
            case 'bump': sfx('bump'); break;
            case 'heavy': sfx('heavy'); shake = 1; for (const id of e.ids) { const v = VIS.get(id); if (v) pop(v.x + 8, v.y - 4, 'too heavy', C.W); } break;
            case 'push': sfx('push'); break;
            case 'pushmove': break;
            case 'swap': {
                sfx('swap');
                const tg = ctx.swapTg || e.tg;
                if (tg && tg.id && tg.t !== 'loose') BOUNCE.set(tg.id, 0.3);
                const from = ctx.swapFrom || (tg && candPos(tg));
                const pp = pocketPos(e.pi);
                if (from) {
                    const hideKey = tg.t === 'loose' ? { id: tg.id, key: 'v', i: 0 } : { id: tg.id, key: tg.key, i: tg.i };
                    FLY.push({ v: e.take, x0: from.x, y0: from.y, x1: pp.x + 5, y1: pp.y + 3, t: 0, dur: 0.32, pocket: e.pi });
                    if (e.give !== null && e.give !== undefined) FLY.push({ v: e.give, x0: pp.x + 5, y0: pp.y + 3, x1: from.x, y1: from.y, t: 0, dur: 0.32, hide: hideKey, arc: -1 });
                    puff(from.x + 2, from.y + 3, C.Y, 6, 0.8, 0.4);
                }
                break;
            }
            case 'drop': sfx('drop'); { const pp = pocketPos(e.pi); FLY.push({ v: e.v, x0: pp.x + 5, y0: pp.y + 3, x1: e.x * TS + 6, y1: e.y * TS + OY + 4, t: 0, dur: 0.3 }); } break;
            case 'getdigit': { sfx('get'); const pp = pocketPos(e.pi); puff(pp.x + 6, pp.y + 6, C.Y, 8, 1, 0.5); break; }
            case 'refuse': sfx('refuse'); shake = 1.5; break;
            case 'age': sfx('grow'); if (ev) puff(cx, cy, C.l, 10, 1, 0.6, 1); break;
            case 'sink': sfx('sink'); if (ev) puff(cx, cy + 4, C.c, 10, 1, 0.6, 1); break;
            case 'float': case 'rise': sfx('float'); if (ev) puff(cx, cy + 4, C.w, 8, 0.8, 0.6, 1); break;
            case 'fall': sfx('fall'); if (ev) puff(cx, cy, C.T, 8, 1, 0.5); break;
            case 'fallme': sfx('fall'); break;
            case 'crackbreak': sfx('crack'); if (ev) puff(cx, cy, C.g, 14, 1.4, 0.6, 1); shake = 3; break;
            case 'gateopen': sfx('gate'); break;
            case 'gateshut': sfx('gateshut'); break;
            case 'hit': sfx('hit'); if (ev) { puff(cx, cy, C.w, 6, 1, 0.3); pop(cx, cy - 10, e.dmg === Infinity ? '∞' : String(e.dmg), C.y); } break;
            case 'mattack': if (ev) { const v = VIS.get('@'); pop(v.x + 8, v.y - 6, e.dmg === Infinity ? '∞' : '-' + e.dmg, C.r); } break;
            case 'hurt': sfx('hurt'); shake = 3; flash = 0.4; flashCol = C.r; break;
            case 'windup': sfx('windup'); break;
            case 'defeat': sfx('defeat'); puff(e.x * TS + 8, e.y * TS + OY + 8, C.w, 16, 1.5, 0.7, 1); break;
            case 'loose': break;
            case 'creak': sfx('creak'); says.push({ lines: ['The planks creak. Not a chance.'] }); break;
            case 'nope': sfx('refuse'); if (ev) pop(cx, cy - 10, 'wrong address', C.W); break;
            case 'deliver': sfx('deliver'); break;
            case 'door': sfx('door'); break;
            case 'stairs': sfx('stairs'); break;
            case 'room': startTransition(e); break;
            case 'say': says.push({ lines: e.lines, who: e.who }); break;
            case 'item': sfx('item'); says.push({ lines: ITEM_TEXT[e.id] ? (e.id === 'satchel' && G.items.satchel > 1 ? ['An even bigger satchel!'] : ITEM_TEXT[e.id]) : [e.id], item: e.id }); break;
            case 'reveal': UI.reveal = 1.5; sfx('reveal'); break;
            case 'stamp': sfx('stamp'); banner('Stamp: ' + (STAMP_NAME[e.id] || e.id), 'a new stamp for the album', C.y, 2.6); break;
            case 'chest': sfx('chest'); break;
            case 'bell': sfx('bell'); if (e.carried && e.carried.length) setTimeout(() => sfx('carry'), 250); break;
            case 'tick': sfx(e.carried && e.carried.length ? 'carry' : 'clock'); if (e.over) sfx('pop'); break;
            case 'munch': sfx('munch'); break;
            case 'flip': sfx('flip'); if (ev) puff(cx, cy, C.c, 10, 1, 0.6, 1); break;
            case 'cathop': sfx('meow'); break;
            case 'hatch': sfx('hatch'); break;
            case 'flyaway': sfx('flap'); break;
            case 'egged': sfx('pop'); break;
            case 'buy': sfx('buy'); break;
            case 'poor': sfx('refuse'); break;
            case 'splashno': sfx('splash'); break;
            case 'die': sfx('die'); UI.mode = 'dead'; break;
            case 'undo': sfx('undo'); snapAllSoon(); break;
            case 'restart': sfx('undo'); snapAllSoon(); break;
            case 'ending': UI.endingPending = true; break;
            case 'hour': { const h = hourVal(), b = band(); sfx('flip'); banner(b === 'eerie' ? '??:??' : String(h).padStart(2, '0') + ':00', { day: 'day', dusk: 'dusk', night: 'night', eerie: 'the hour that isn\'t' }[b], b === 'eerie' ? C.v : C.Y, 1.6); setMusic(musicFor(G.room)); break; }
            case 'album': UI.mode = 'album'; UI.albumFrom = 'play'; sfx('menu'); break;
        }
    }
    for (const s of says) sayLines(s.lines, s.who);
    if (UI.endingPending && !UI.dlg) { UI.endingPending = false; startEnding(); }
}
function snapAllSoon() { VIS.clear(); FLY.length = 0; groundCache.key = null; }

/* ---------- moving between rooms ---------- */
let lastFrame = null;
function startTransition(e) {
    groundCache.key = null;
    if (e.how === 'slide') { UI.trans = { how: 'slide', d: e.d, t: 0, dur: 0.35, img: lastFrame }; }
    else if (e.how === 'morph') { UI.trans = { how: 'morph', t: 0, dur: 0.6 }; flash = 1; flashCol = C.w; sfx('morph'); }
    else if (e.how === 'fall') { UI.trans = { how: 'fade', t: 0, dur: 0.5 }; shake = 4; }
    else UI.trans = { how: 'fade', t: 0, dur: 0.35 };
    VIS.clear();
    if (ROOMS[e.to] && ROOMS[e.to].name && e.to !== e.from) {
        const nm = e.to === 'road' ? ROOMS.road.name : ROOMS[e.to].name;
        if (!UI.lastBanner || UI.lastBanner !== e.to) banner(nm, null, C.w, 1.4);
        UI.lastBanner = e.to;
    }
    setMusic(musicFor(e.to));
}
function musicFor(id) {
    if (isEerie()) return 'eerie';
    const m = ROOMS[id] && ROOMS[id].music;
    if (m === 'village' && isNight() && ROOMS[id].out) return 'night';
    return m || 'village';
}
function drawTransition(g, t, frameCv) {
    const T0 = UI.trans; if (!T0) return;
    const k = Math.min(1, T0.t / T0.dur);
    if (T0.how === 'slide' && T0.img) {
        const [dx, dy] = DIR[T0.d];
        const e = 1 - Math.pow(1 - k, 3);
        const ox = -dx * VW * e, oy = -dy * (MH * TS) * e;
        g.save(); g.beginPath(); g.rect(0, OY, VW, MH * TS); g.clip();
        g.drawImage(frameCv, 0, OY, VW, MH * TS, ox + dx * VW, OY + oy + dy * MH * TS, VW, MH * TS);
        g.drawImage(T0.img, 0, OY, VW, MH * TS, ox, OY + oy, VW, MH * TS);
        g.restore();
    } else if (T0.how === 'fade') {
        g.fillStyle = `rgba(26,20,32,${1 - k})`; g.fillRect(0, OY, VW, MH * TS);
    }
}
