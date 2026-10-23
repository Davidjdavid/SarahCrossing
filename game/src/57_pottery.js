/* ---- 57_pottery.js ---- */
/* Sully's pottery studio. Throw pots on the wheel, hand-build little figures (slugs, dollhouses...) or sculpt freestyle,
   glaze them however you like, and fire them in the kiln. Finished pieces are real furniture: display them at home
   or give them away (they end up in the neighbor's house). The editors themselves live in 58_potterygames.js. */

const GLAZES = {
    a: ['#f4efe6', 'cream'], b: ['#9fc3e6', 'sky blue'], c: ['#2f5da8', 'cobalt'], d: ['#8fc4a1', 'celadon'], e: ['#5c8a4a', 'forest green'],
    f: ['#e0784a', 'terracotta'], g: ['#f7a8c4', 'pink'], h: ['#e0405a', 'red'], i: ['#ffd45a', 'yellow'], j: ['#b39ae0', 'lavender'],
    k: ['#3a3340', 'black'], l: ['#8a5a3a', 'chocolate'], m: ['#f28a1a', 'orange'], n: ['#6fd3c9', 'turquoise'], o: ['#d9b44a', 'gold'], p: ['#ffffff', 'white'],
};
const CLAY_WET = '#b07a5c', CLAY_BISQUE = '#e3c2a2';
const POT_W = 14;                                  // piece body width in pixels (sprites add a 1 px outline)
const POT_H_SMALL = 14, POT_H_BIG = 26;
const KILN_MIN = 5;                                // real minutes in the kiln
const KILN_FEE = 150;

function pottery() {
    if (!S.pottery) S.pottery = { seq: 1, pieces: {}, kiln: [], made: 0 };
    return S.pottery;
}

/* ---------------------------------------------------------------- colours + drawing a piece */
function hexRgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
function tint(rgb, k) {
    // k < 0 darkens toward deep purple, k > 0 lightens toward white
    const to = k < 0 ? [26, 16, 38] : [255, 255, 255], t = Math.min(1, Math.abs(k));
    return rgb.map((v, i) => Math.round(v + (to[i] - v) * t));
}
/* per-pixel colours for a piece (null = empty) */
function pieceRGB(p, opt) {
    opt = opt || {};
    const w = POT_W, h = p.h, m = p.mask, g = opt.glaze || p.glaze;
    const clay = hexRgb(opt.wet || p.state === 'green' && !g ? CLAY_WET : CLAY_BISQUE);
    const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? '.' : m[y * w + x];
    const out = [];
    let sp = hash32(p.id + ':sp');
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const ch = at(x, y);
        if (ch === '.') { out.push(null); continue; }
        const gc = g ? g[y * w + x] : '0';
        const gv = gc && gc !== '0' ? (GLAZES[gc] || (p.cols && p.cols[gc])) : null;
        let rgb = gv ? hexRgb(gv[0]) : (opt.wet ? hexRgb(CLAY_WET) : clay);
        let k = 0;
        if (ch === 'd') k = -0.34;
        else if (ch === 'i') k = -0.58;
        else if (ch === 'l') k = 0.2;
        else if (p.auto) {
            if (at(x - 1, y) === '.') k += 0.16;
            if (at(x + 1, y) === '.') k -= 0.2;
            if (at(x, y - 1) === '.') k += 0.07;
            if (at(x, y + 1) === '.') k -= 0.1;
        }
        const glazed = gc && gc !== '0';
        if (glazed && p.finish === 'matte') k *= 0.7;
        if (glazed && p.finish !== 'matte' && ch === 'l') k += 0.15;
        rgb = tint(rgb, k);
        if (glazed && p.speckle) { sp = Math.imul(sp ^ (sp >>> 13), 0x5bd1e965) >>> 0; if ((sp & 15) === 0) rgb = tint(rgb, -0.28); }
        out.push(rgb);
    }
    // a glossy glint near the top-left of the body
    if (g && p.finish !== 'matte') {
        for (let y = 1; y < h; y++) {
            let x0 = -1;
            for (let x = 0; x < w; x++) if (out[y * w + x]) { x0 = x; break; }
            if (x0 < 0) continue;
            const i = y * w + x0 + 1;
            if (out[i] && m[i] !== 'i' && m[i] !== 'd' && g[i] !== '0') { out[i] = tint(out[i], 0.45); break; }
        }
    }
    return out;
}
/* the piece as a little sprite canvas with the usual dark outline */
function pieceCanvas(p, opt) {
    const w = POT_W, h = p.h, rgb = pieceRGB(p, opt);
    const c = document.createElement('canvas');
    c.width = w + 2; c.height = h + 2;
    const g = c.getContext('2d');
    const img = g.createImageData(w + 2, h + 2);
    const put = (x, y, col) => { const i = (y * (w + 2) + x) * 4; img.data[i] = col[0]; img.data[i + 1] = col[1]; img.data[i + 2] = col[2]; img.data[i + 3] = 255; };
    const filled = (x, y) => x >= 0 && y >= 0 && x < w && y < h && rgb[y * w + x];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (rgb[y * w + x]) put(x + 1, y + 1, rgb[y * w + x]);
    const OUTC = [45, 34, 48];
    for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) {
        if (filled(x, y)) continue;
        if (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) put(x + 1, y + 1, OUTC);
    }
    g.putImageData(img, 0, 0);
    return c;
}

/* ---------------------------------------------------------------- pieces as items */
function piecePrice(p) {
    const n = p.mask.split('').filter(c => c !== '.').length;
    const cols = new Set((p.glaze || '').split('').filter(c => c !== '0')).size;
    return Math.round((300 + n * 3 + cols * 60 + (p.stars || 1) * 120 + (p.big ? 400 : 0)) / 10) * 10;
}
function registerPiece(p) {
    Assets.dyn[p.id] = { c: pieceCanvas(p), w: POT_W + 2, h: p.h + 2, ax: (POT_W + 2) / 2, ay: p.h + 1 };
    if (p.state !== 'done') return;
    ITEMS[p.id] = { name: p.name, type: 'furniture', price: piecePrice(p), icon: p.id, pottery: true, kind: p.kind };
    FURN[p.id] = { id: p.id, name: p.name, w: 1, h: 1, kind: p.big ? 'floor' : 'top', price: 0, sets: ['pottery'], frame: p.id, pottery: true, plant: p.kind === 'vase' ? 1 : 0 };
}
/* called on every loaded save, before anything checks whether its items exist */
function registerAllPottery(st) {
    const P = st && st.pottery;
    if (!P) return;
    for (const p of Object.values(P.pieces)) registerPiece(p);
}

/* a name from the shape and the glaze ("Tall cobalt vase") unless Sarah named it herself */
function glazeWord(p) {
    if (!p.glaze) return p.state === 'green' ? '' : 'terracotta';
    const counts = {};
    for (const c of p.glaze) if (c !== '0') counts[c] = (counts[c] || 0) + 1;
    const keys = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    if (!keys.length) return 'terracotta';
    if (keys.length >= 4) return 'rainbow';
    const g = GLAZES[keys[0]] || (p.cols && p.cols[keys[0]]);
    return (p.speckle ? 'speckled ' : '') + (g ? g[1] : 'glazed');
}
function autoName(p) {
    if (p.custom) return p.custom;
    const base = p.base || cap(p.kind);
    const size = p.prof ? (p.h >= 18 ? 'tall ' : p.h <= 4 ? '' : Math.max(...p.prof.r) >= 6.2 ? 'wide ' : p.h <= 7 ? 'little ' : '') : '';
    return cap((size + glazeWord(p) + ' ' + base.toLowerCase()).trim().replace(/\s+/g, ' '));
}

/* ---------------------------------------------------------------- the studio */
ROOMS.studio = { w: 13, h: 7, wall: 'wall_brick', floor: 'floor_studio', music: 'studio', name: "Sully's Pottery", staff: 'sully',
    staffAt: [4, 1], staffStand: [4, 2], guest: [6, 4, 2], build: a => buildStudioRoom(a),
    closedSign: 'SULLY\'S POTTERY STUDIO. Open {hours:studio}. "Come make somethin\', kid."' };
function buildStudioRoom(a) {
    const P = pottery();
    const rows = [
        ['pottery_shelf', 0, 'wall'], ['window_wall', 3, 'wall'], ['studio_sign', 5, 'wall'], ['glaze_chart', 8, 'wall'], ['pottery_shelf', 11, 'wall'],
        ['potters_wheel', 1, 0], ['glaze_table', 8, 0], ['kiln', 11, 0], ['work_table', 0, 3], ['display_shelf', 10, 4], ['clay_bin', 0, 5], ['plant_monstera', 12, 6]];
    // Sarah's three newest small pieces sit on the display shelf
    const done = Object.values(P.pieces).filter(p => p.state === 'done' && !p.big).sort((x, y) => (y.n || 0) - (x.n || 0)).slice(0, 3);
    done.forEach((p, i) => rows.push([p.id, 10 + i, 4]));
    const items = layoutItems(rows);
    const use = { potters_wheel: () => potteryWheel(), glaze_table: () => glazeStation(), kiln: () => kilnStation(), work_table: () => handBuild(),
        display_shelf: () => UI.say('sully', bostonize("That's your shelf, kid. Your newest pieces go up there. Wicked nice.")),
        clay_bin: () => UI.say(null, 'A bin of clay. A sign on it says: "WICKED GOOD CLAY. FREE. DON\'T GET WEIRD."') };
    items.forEach(it => { if (use[it.id]) it.use = use[it.id]; });
    a.items = items;
    placeFurniture(a, items);
    // the kiln glows while something's firing
    const kiln = a.ents.find(e => e.furn && e.def.id === 'kiln');
    if (kiln) kiln.draw = ctx => {
        spr(ctx, kiln.frame, kiln.x, kiln.y);
        if (!pottery().kiln.length) return;
        const k = 0.45 + 0.25 * Math.sin(G.t / 7);
        ctx.fillStyle = `rgba(255,140,40,${k})`;
        ctx.fillRect(Math.round(kiln.x) - 7, Math.round(kiln.y) - 25, 16, 13);
        ctx.fillStyle = `rgba(255,220,120,${k * 0.8})`;
        ctx.fillRect(Math.round(kiln.x) - 4, Math.round(kiln.y) - 20, 9, 6);
    };
    if (kiln) kiln.light = { r: 30, y: -18 };
}
function sullyVoice() { const s = NPCs.get('sully'); return s && !s.sleeping && s.area === 'studio' ? 'sully' : null; }
function sullySays(text) { const sp = sullyVoice(); return UI.say(sp, sp ? bostonize(text) : text.replace(/\bkid\b/gi, 'Sarah')); }
function shelfPieces() { return Object.values(pottery().pieces).filter(p => p.state === 'green' || p.state === 'glazed').sort((a, b) => a.n - b.n); }
function newPieceId() { const P = pottery(); return 'pot_' + (P.seq++); }
function savePiece(p) {
    const P = pottery();
    p.n = p.n || P.seq;
    P.pieces[p.id] = p;
    P.made = (P.made || 0) + (p.counted ? 0 : 1);
    p.counted = true;
    registerPiece(p);
    Save.touch();
}

/* first time in: Sully shows Sarah around */
Bus.on('enter', async id => {
    if (id !== 'studio' || S.flags.studioTour || !sullyVoice()) return;
    S.flags.studioTour = true;
    G.busy++;
    await waitFrames(20);
    await UI.say('sully', [bostonize("Hey, kid! Welcome to the studio. Lemme give ya the tour. It's a short tour."),
        bostonize("The wheel's for pots: vases, bowls, mugs, plates. Center the clay, open it up, then shape it however you want."),
        bostonize("The table's for hand-buildin'. Slugs, dollhouses, frogs. Or freestyle, whatever ya dream up."),
        bostonize("Glazes are on the other table. Paint it, dip it, drip it. Then the kiln in the back fires it."),
        bostonize(`Firin' costs one piece of wood, or ${KILN_FEE} sand dollahs if ya got no wood. Takes about ${KILN_MIN} minutes. Then it's yours. Show it off. Give it away. Whatevah.`)]);
    G.busy--;
});

const POTTERY_TIPS = [
    ["On the wheel, keep the pressure steady. Not too hard. The clay can tell when you're nervous, kid."],
    ["Want a vase? Hit Vase, then pinch the Neck. Want it fancy? Flare the rim. Want a mug? Handle. Easy."],
    ["Drips look great over a dipped glaze. Dip it one color, pick a second, hit Drips. Trust me."],
    ["The hand-buildin' table does little critters. Slugs, frogs, a goat. The goat's just a goat. Don't ask it questions."],
    ["Firin' takes a few minutes. One piece of wood per pot. Chop a tree, bring me the wood, fire for free. That's the deal."],
    ["Lines ya draw on the clay turn into little grooves. The glaze settles in 'em. Makes the details pop."],
    ["Big pieces stand on the floor. Little ones go on tables. Give 'em away, too. People love handmade stuff. Well. Most people. Wonton's weird about bowls."],
];

/* ---------------------------------------------------------------- stations */
async function potteryWheel() {
    if (shelfPieces().length >= 8) { await sullySays("Your shelf's full, kid. Glaze and fire some of those first."); return; }
    const p = await Wheel.run();
    if (!p) return;
    savePiece(p);
    await afterMaking(p);
}
async function handBuild() {
    if (shelfPieces().length >= 8) { await sullySays("Your shelf's full, kid. Glaze and fire some of those first."); return; }
    const pick = await pickTemplate();
    if (!pick) return;
    const p = await Sculpt.run(pick);
    if (!p) return;
    savePiece(p);
    await afterMaking(p);
}
async function afterMaking(p) {
    Sfx.play('fanfare');
    S.stats.pottery = (S.stats.pottery || 0) + 1;
    const k = await UI.ask(sullyVoice(), sullyVoice() ? bostonize(`Nice ${p.base ? p.base.toLowerCase() : p.kind}, kid! Wanna glaze it now?`) : `A ${p.base ? p.base.toLowerCase() : p.kind}! Glaze it now?`,
        ['Glaze it now', 'Leave it on my shelf']);
    if (k === 0) await glazePiece(p);
    else UI.toast(`${p.name} is drying on your shelf at the studio.`, p.id);
}
async function glazePiece(p) {
    const ok = await Glaze.run(p);
    if (!ok) return;
    p.state = 'glazed';
    p.name = autoName(p);
    registerPiece(p);
    Save.touch();
    const k = await UI.ask(sullyVoice(), sullyVoice() ? bostonize('Lookin\' good. Into the kiln?') : 'Put it in the kiln?', ['Into the kiln!', 'Not yet']);
    if (k === 0) await kilnStation();
}
async function glazeStation() {
    const list = shelfPieces();
    if (!list.length) { await sullySays("Nothin' to glaze yet, kid. Make somethin' on the wheel or the table first."); return; }
    const p = await pickPiece('Glaze which piece?', list, p => p.state === 'glazed' ? 'Glazed (you can redo it)' : 'Not glazed yet');
    if (p) await glazePiece(p);
}
async function kilnStation() {
    const P = pottery(), now = Clock.real().getTime();
    const ready = P.kiln.filter(k => k.ready <= now);
    if (ready.length) {
        Sfx.play('fanfare');
        for (const k of ready) finishPiece(P.pieces[k.id], true);
        P.kiln = P.kiln.filter(k => k.ready > now);
        const names = ready.map(k => P.pieces[k.id].name);
        await sullySays(ready.length === 1 ? `Out of the kiln: your ${names[0].toLowerCase()}! Wicked nice work, kid.` : `Out of the kiln: ${ready.length} pieces! Look at 'em, kid. Beautiful.`);
        markRoomStale('studio');
        return;
    }
    if (P.kiln.length) {
        const mins = Math.max(1, Math.ceil((Math.min(...P.kiln.map(k => k.ready)) - now) / 60000));
        await sullySays(`Still firin'. About ${mins} more ${plural(mins, 'minute')}, kid. Go grab a coffee.`);
        return;
    }
    const glazed = shelfPieces().filter(p => p.state === 'glazed');
    const bare = shelfPieces().filter(p => p.state === 'green');
    if (!glazed.length) {
        if (bare.length) {
            const k = await UI.ask(sullyVoice(), sullyVoice() ? bostonize("Nothin' glazed yet, kid. Fire somethin' bare? It comes out a nice natural terracotta.") : 'Nothing is glazed yet. Fire a piece bare?', ['Fire one bare', 'Not now']);
            if (k !== 0) return;
            const p = await pickPiece('Fire which piece bare?', bare, () => 'Unglazed');
            if (!p) return;
            p.state = 'glazed'; p.glaze = null; p.name = autoName(p);
            return fireNow([p]);
        }
        await sullySays("The kiln's empty, kid. Make somethin' first. Then glaze it. Then we fire it.");
        return;
    }
    return fireNow(glazed);
}
async function fireNow(list) {
    const wood = pocketCount('wood');
    const n = list.length;
    const useWood = Math.min(wood, n), pay = (n - useWood) * KILN_FEE;
    const cost = [useWood ? `${useWood} ${plural(useWood, 'piece')} of wood` : '', pay ? `${fmtNum(pay)} sand dollars` : ''].filter(Boolean).join(' and ');
    const k = await UI.ask(sullyVoice(), `Fire ${n === 1 ? 'your ' + list[0].name.toLowerCase() : n + ' pieces'}? That's ${cost}. It takes about ${KILN_MIN} minutes.`, ['Fire it up!', 'Not yet']);
    if (k !== 0) return;
    if (S.money < pay) { await sullySays(`You're a little short, kid. Bring some wood (the axe gets ya three pieces a tree), or ${fmtNum(pay)} sand dollahs.`); return; }
    if (useWood) removeItem('wood', useWood);
    if (pay) addMoney(-pay, true);
    const P = pottery(), ready = Clock.real().getTime() + KILN_MIN * 60000;
    for (const p of list) { p.state = 'kiln'; P.kiln.push({ id: p.id, ready }); }
    Sfx.play('timber');
    Save.touch();
    await sullySays(`In they go. Come back in ${KILN_MIN} minutes, kid. If ya leave, I'll mail 'em to ya.`);
}
function finishPiece(p, toSarah) {
    p.state = 'done';
    p.name = autoName(p);
    p.doneDay = Clock.dayNum();
    registerPiece(p);
    if (toSarah) receive(p.id, 1);
    Save.touch();
}
/* the kiln keeps going while Sarah's elsewhere: anything done while she's out gets mailed to her */
function potteryTick() {
    if (!S || !S.pottery || !S.pottery.kiln.length) return;
    const P = S.pottery, now = Clock.real().getTime();
    const ready = P.kiln.filter(k => k.ready <= now);
    if (!ready.length) return;
    if (G.area && G.area.id === 'studio') {
        if (!P.dinged) { P.dinged = true; Sfx.play('wish'); UI.toast('Ding! The kiln is done. Open it up!', 'f_kiln'); }
        return;
    }
    for (const k of ready) {
        const p = P.pieces[k.id];
        finishPiece(p, false);
        sendMail({ from: 'sully', subject: `Your ${p.name.toLowerCase()}`, body: `Hey kid,\nYour ${p.name.toLowerCase()} came out of the kiln wicked nice. Here it is.\nCome make another one.\n- Sully`, gift: p.id });
    }
    P.kiln = P.kiln.filter(k => k.ready > now);
    P.dinged = false;
    HUD.update();
}

/* ---------------------------------------------------------------- choosing things (template, piece) */
function pickTemplate() {
    return new Promise(res => {
        let done = false;
        const P = UI.open({ title: 'Hand-building', onClose: () => { if (!done) { done = true; res(null); } } });
        P.body.appendChild(el('p', 'muted', 'Start from a shape and make it yours, or sculpt something from scratch.'));
        const grid = el('div', 'grid');
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(92px, 1fr))';
        const add = (label, preview, pick) => {
            const b = el('button', 'slot');
            b.type = 'button';
            b.style.aspectRatio = 'auto'; b.style.padding = '10px 4px 8px'; b.style.display = 'grid'; b.style.gap = '4px';
            b.appendChild(preview);
            b.appendChild(el('span', null, label)).style.cssText = 'font:600 13px/1.1 Fredoka, sans-serif; color: var(--ink)';
            b.addEventListener('click', () => { done = true; UI.close(true); Sfx.ui('ok'); res(pick); });
            grid.appendChild(b);
        };
        for (const [id, t] of Object.entries(GD.potTemplates)) {
            const p = { id: 'tpl_' + id, h: t.rows.length, mask: t.rows.join(''), auto: true, state: 'green' };
            const c = pieceCanvas(p, { wet: true });
            c.style.cssText = `width:${Math.min(64, (c.width) * 4)}px;height:auto;image-rendering:pixelated;justify-self:center`;
            add(t.name, c, { template: id });
        }
        const blank = big => { const c = el('div'); c.style.cssText = `width:44px;height:${big ? 64 : 44}px;border:3px dashed var(--line);border-radius:10px;justify-self:center`; return c; };
        add('Freestyle', blank(false), { free: 'small' });
        add('Freestyle (big)', blank(true), { free: 'big' });
        P.body.appendChild(grid);
    });
}
function pickPiece(title, list, note) {
    return new Promise(res => {
        let done = false;
        const P = UI.open({ title, onClose: () => { if (!done) { done = true; res(null); } } });
        const L = el('div', 'list');
        for (const p of list) {
            const r = el('button', 'row');
            r.type = 'button';
            const c = pieceCanvas(p);
            c.style.cssText = 'width:40px;height:auto;image-rendering:pixelated';
            r.appendChild(c);
            const t = el('div', 't');
            t.appendChild(el('b', null, p.name));
            t.appendChild(el('span', null, note(p)));
            r.appendChild(t);
            r.addEventListener('click', () => { done = true; UI.close(true); Sfx.ui('ok'); res(p); });
            L.appendChild(r);
        }
        P.body.appendChild(L);
    });
}

/* ---------------------------------------------------------------- the phone's gallery */
function appPottery() {
    const P = UI.open({ title: 'Pottery', phone: true, back: backToPhone });
    const all = Object.values(pottery().pieces).sort((a, b) => b.n - a.n);
    P.body.appendChild(el('p', 'muted', all.length ? `Everything you've made at Sully's studio. ${all.filter(p => p.state === 'done').length} finished.`
        : `Nothing yet. Sully's studio is next to the plaza, open ${hoursText('studio')}. Slugs are encouraged.`));
    const now = Clock.real().getTime();
    const L = el('div', 'list');
    for (const p of all) {
        const r = el('div', 'row');
        const c = pieceCanvas(p);
        c.style.cssText = 'width:40px;height:auto;image-rendering:pixelated';
        r.appendChild(c);
        const t = el('div', 't');
        t.appendChild(el('b', null, p.name));
        const k = pottery().kiln.find(q => q.id === p.id);
        const st = p.state === 'done' ? `Finished \u00b7 ${'\u2605'.repeat(p.stars || 1)}` : p.state === 'kiln' ? `In the kiln \u00b7 about ${Math.max(1, Math.ceil(((k && k.ready) - now) / 60000))} min` : p.state === 'glazed' ? 'Glazed, on your studio shelf' : 'Drying on your studio shelf';
        t.appendChild(el('span', null, st + (p.desc ? ` \u00b7 "${p.desc}"` : '')));
        r.appendChild(t);
        if (p.state === 'done') r.appendChild(btn('Edit', 'alt', () => editLabel(p.id, appPottery)));
        L.appendChild(r);
    }
    P.body.appendChild(L);
    // Sarah's paintings live here too, so they can get names and notes
    const art = Object.entries((S.art && S.art.pieces) || {}).filter(([id]) => ITEMS[id]);
    if (art.length) {
        P.body.appendChild(el('p', 'muted', 'Your paintings'));
        const L2 = el('div', 'list');
        for (const [id, p] of art.reverse()) {
            const r = el('div', 'row');
            r.appendChild(artThumb(id));
            const t = el('div', 't');
            t.appendChild(el('b', null, p.name));
            t.appendChild(el('span', null, p.desc ? `"${p.desc}"` : `Painted on ${dayLabel(p.day)}`));
            r.appendChild(t);
            r.appendChild(btn('Edit', 'alt', () => editLabel(id, appPottery)));
            L2.appendChild(r);
        }
        P.body.appendChild(L2);
    }
}

/* ---------------------------------------------------------------- pottery as a gift */
const POT_LOVES = {
    maki: { kind: ['plate'], line: 'A handmade plate. For sushi. It is perfectly flat. I may cry. Precisely.' },
    kai: { color: ['b', 'c', 'n'], line: "Duuude, it's ocean colors! You MADE this? It's going right in the shack!" },
    basil: { kind: ['bowl'], line: "A bowl. For noodles. Handmade. That's... that's really special. Thank you." },
    wonton: { kind: ['bowl'], line: 'A bowl! It is beautiful. It is NOT for soup. It is for... looking at. Thank you!' },
    chili: { color: ['h', 'm'], line: "It's RED. It's hot. You made it? I'm blushing. I'm always blushing, but still." },
    coco: { color: ['g', 'l'], line: "You MADE this?! It's gorgeous. I'm telling everyone. EVERYONE." },
    cece: { kind: ['plate', 'dumpling', 'heartdish'], line: "You made this? For me? It's perfect. No cracks! Sorry, I'm crying!" },
    clementine: { color: ['m', 'f'], line: 'Darling. Orange. Handmade. You understand me. You truly understand me.' },
    cuke: { color: ['d', 'e'], line: "It's GREEN! And handmade! I'm so hydrated right now! Thank you!" },
    sully: { kind: ['mug', 'cup'], line: "A mug! For my coffee! Kid, this is wicked nice. The handle's perfect. I'm proud of ya." },
    david: { color: ['o'], rainbow: true, line: 'Honey. It SPARKLES. Or it will in my house, because I will light it dramatically.' },
    joe: { kind: ['slug', 'snail', 'frog', 'duck', 'sculpture'], line: "You made this? It's perfect. I'm going to write a poem about it. It'll probably be about a spoon." },
    ginger: { kind: ['dollhouse', 'bighouse'], line: "A tiny house! You MADE this? The proportions are perfect. I'm putting it on my workbench." },
    brulee: { kind: ['vase', 'sculpture'], line: 'A vase! Handmade! This belongs in a museum. Luckily, I know a museum.' },
    mac: { kind: ['bowl', 'plate'], line: "A bowl! For mac and cheese! I'm serving my very best batch in this. Every day." },
};
function potteryTier(npcId, itemId) {
    const P = S.pottery && S.pottery.pieces[itemId], pref = POT_LOVES[npcId];
    if (!P || !pref) return 'like';
    const cols = new Set((P.glaze || '').split('').filter(c => c !== '0'));
    if (pref.kind && pref.kind.includes(P.kind)) return 'love';
    if (pref.color && pref.color.some(c => cols.has(c))) return 'love';
    if (pref.rainbow && cols.size >= 4) return 'love';
    return 'like';
}
function potteryGiftLine(npcId, tier) {
    if (tier === 'love' && POT_LOVES[npcId]) return POT_LOVES[npcId].line;
    return rpick(['Wait, you MADE this? At the studio? That is so cool. Thank you!', "You made this yourself? I love it. I'm keeping it forever.", 'Handmade! Nobody ever gives me handmade things. Thank you!']);
}

