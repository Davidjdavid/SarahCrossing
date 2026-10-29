/* ---- 41_menus.js ---- */
/* Panels: pocket, phone apps, shop, cooking, wardrobe, mail, settings */
function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
}
function btn(label, cls, fn) {
    const b = el('button', 'btn' + (cls ? ' ' + cls : ''), label);
    b.type = 'button';
    b.addEventListener('click', ev => { ev.stopPropagation(); fn(ev); });
    return b;
}
function slotBtn(id, n, opts) {
    opts = opts || {};
    const b = el('button', 'slot' + (opts.sel ? ' sel' : '') + (!id ? ' empty' : '') + (opts.locked ? ' locked' : ''));
    b.type = 'button';
    if (id) {
        b.appendChild(iconCanvas(opts.icon || itemIcon(id), 48));
        b.setAttribute('aria-label', opts.locked ? 'Not found yet' : itemName(id) + (n > 1 ? `, ${n}` : ''));
        b.title = opts.locked ? '???' : itemName(id);
        if (n > 1) b.appendChild(el('span', 'n', String(n)));
    } else b.setAttribute('aria-label', 'Empty');
    if (opts.onClick) b.addEventListener('click', opts.onClick);
    return b;
}
function detailRow(id, extra) {
    const d = el('div', 'detail');
    d.appendChild(iconCanvas(itemIcon(id), 48));
    const t = el('div');
    t.appendChild(el('b', null, itemName(id)));
    t.appendChild(el('span', null, extra || ITEM_TYPES[ITEMS[id].type] || ''));
    d.appendChild(t);
    return d;
}

/* ---------------------------------------------------------------- pocket */
function openPocket(sel, tab) {
    const atHome = G.area.id === 'home';
    const tabs = atHome ? el('div', 'tabs') : null;
    const P = UI.open({ title: 'Pocket', foot: true, tabs, wide: true });
    if (atHome) {
        for (const [k, label] of [['pocket', 'Pocket'], ['storage', 'House storage']]) {
            const b = el('button', 'tab' + ((tab || 'pocket') === k ? ' on' : ''), label);
            b.type = 'button';
            b.addEventListener('click', () => { Sfx.ui('tick'); openPocket(null, k); });
            tabs.appendChild(b);
        }
        if (tab === 'storage') return storageTab(P);
    }
    const V = storeView(P, G.touchUsed ? 'Tap an item to see what you can do with it.' : 'Pick an item to see what you can do with it. (I opens the pocket.)');
    const draw = () => {
        const back = V.reset();
        const grid = V.group(null, 'grid');
        S.pocket.forEach((s, i) => grid.appendChild(slotBtn(s && s.id, s && s.n, { sel: i === sel, onClick: () => { if (s) { sel = i; Sfx.ui('tick'); draw(); } } })));
        const s = sel != null ? S.pocket[sel] : null;
        if (s) {
            const it = ITEMS[s.id];
            V.sel = sel;
            V.show(s.id, { sub: `${ITEM_TYPES[it.type] || 'Item'}${importantItem(s.id) ? ' \u00b7 important' : unsellable(s.id) ? ' \u00b7 keepsake' : ' \u00b7 sells for ' + fmtNum(sellPrice(s.id))}${s.n > 1 ? ` \u00b7 ${s.n} of them` : ''}`,
                lines: [itemDesc(s.id), importantItem(s.id) ? { text: IMPORTANT_NOTE, cls: 'important' } : null],
                buttons: pocketActions(sel, s, () => { if (!S.pocket[sel]) sel = null; draw(); }) });
        } else { sel = null; V.clear(); }
        back();
        P.foot.innerHTML = '';
        P.foot.appendChild(el('span', 'grow', `${pocketFree()} free ${plural(pocketFree(), 'slot')} \u00b7 ${fmtNum(S.money)} sand dollars`));
        // (after a shopping trip: every piece of furniture, wallpaper and flooring sent home in one go)
        const home = S.pocket.map((q, k) => [q, k]).filter(([q]) => q && ITEMS[q.id] && ['furniture', 'wall', 'floor'].includes(ITEMS[q.id].type) && !importantItem(q.id));
        if (home.length >= 2) P.foot.appendChild(btn(`Send furniture home (${home.length})`, 'alt', () => {
            for (const [q, k] of home) toStorage(q.id, removeSlot(k));
            Sfx.play('item');
            UI.toast(`Sent home: ${home.length} ${plural(home.length, 'piece')}`, itemIcon(home[0][0].id));
            sel = null; V.clear(); draw();
        }));
    };
    draw();
}
/* everything that's been sent home: take it back out (to give as a gift, or to carry) */
function storageTab(P) {
    let sel = null;
    const V = storeView(P, G.touchUsed ? 'Tap something to take it out.' : 'Pick something to take it out.');
    const draw = () => {
        const back = V.reset();
        const ids = Object.keys(S.storage).filter(id => ITEMS[id] && S.storage[id] > 0).sort((a, b) => itemName(a).localeCompare(itemName(b)));
        const grid = V.group(null, 'grid');
        ids.forEach(id => grid.appendChild(slotBtn(id, S.storage[id], { sel: id === sel, onClick: () => { sel = id; Sfx.ui('tick'); draw(); } })));
        if (!ids.length) V.list.appendChild(el('p', 'muted', 'Nothing in storage. Furniture you buy is delivered here. Placed furniture is in your room.'));
        if (sel && S.storage[sel]) {
            const btns = [];
            if (canLabel(sel)) btns.push(btn('Name & note', 'alt', () => editLabel(sel, null)));
            btns.push(btn('Take one', '', () => {
                if (!canAdd(sel, 1)) { Sfx.ui('nope'); UI.toast('Your pocket is full'); return; }
                fromStorage(sel, 1); addItem(sel, 1, true); Sfx.play('pick'); draw();
            }));
            if (S.storage[sel] > 1 && stackMax(sel) > 1) btns.push(btn('Take all', 'alt', () => {
                const n = S.storage[sel];
                let got = 0;
                for (let k = 0; k < n && canAdd(sel, 1); k++) { fromStorage(sel, 1); addItem(sel, 1, true); got++; }
                if (!got) { Sfx.ui('nope'); UI.toast('Your pocket is full'); return; }
                Sfx.play('pick'); draw();
            }));
            V.sel = sel;
            V.show(sel, { sub: `${ITEM_TYPES[ITEMS[sel].type] || 'Item'} \u00b7 ${S.storage[sel]} in storage`, lines: [itemDesc(sel)], buttons: btns });
        } else { sel = null; V.clear(); }
        back();
        P.foot.innerHTML = '';
        P.foot.appendChild(el('span', 'grow', `${pocketFree()} free pocket ${plural(pocketFree(), 'slot')}. Take furniture out to give it as a gift.`));
    };
    draw();
}
function pocketActions(i, s, redraw) {
    const it = ITEMS[s.id], out = [];
    const atHome = G.area.id === 'home';
    if (it.type === 'fruit' || it.type === 'dish' || it.type === 'snack') out.push(btn('Eat', '', () => { UI.close(); eatItem(i); }));
    // (anything that stands on the floor indoors can go outside too: dispDef in 6j_displays.js)
    if (it.type === 'display' || (FURN[s.id] && FURN[s.id].kind === 'floor')) out.push(btn('Set it up outside', '', async () => { UI.close(true); if (G.area.id !== 'island') await leaveInterior(); IslandEdit.open({ place: s.id }); }));
    if (it.type === 'outfit' || it.type === 'acc') out.push(btn('Add to wardrobe', '', () => {
        const w = it.wear;
        const list = it.type === 'outfit' ? S.wardrobe.outfits : S.wardrobe.accs;
        if (!list.includes(w)) list.push(w);
        removeSlot(i, 1);
        if (it.type === 'outfit') S.player.outfit = w; else if (FACE_ACCS.has(w)) S.player.eyes = w; else S.player.acc = w;
        UI.toast(`Wearing: ${it.name}`, it.icon);
        Sfx.play('item');
        redraw();
    }));
    if (s.id === 'bottle') out.push(btn('Read', '', () => { removeSlot(i, 1); UI.close(); openBottle(); }));
    if (s.id === 'q_note') out.push(btn('Read', '', () => { UI.close(); Quests.readNote(); }));
    if (canLabel(s.id)) out.push(btn('Name & note', 'alt', () => editLabel(s.id, null)));
    if (HELD_TOOLS.includes(s.id)) out.push(heldTool() === s.id ? btn('Put it away', '', () => { setHeld(null); redraw(); }) : btn('Hold it', '', () => { setHeld(s.id); UI.close(); UI.toast(`Holding the ${it.name.toLowerCase()}. (Tools button to switch.)`, it.icon); }));
    if (['furniture', 'wall', 'floor'].includes(it.type)) {
        if (atHome) out.push(btn('Place it', '', () => { UI.close(); Decor.enter().then(() => { if (it.type === 'furniture') { Decor.held = s.id; } Decor.render(); }); }));
        out.push(btn('Send home', 'alt', () => { removeSlot(i, 1); toStorage(s.id, 1); UI.toast(`${it.name} sent to your house`, it.icon); redraw(); }));
    } else if (!['tool'].includes(it.type)) {
        out.push(btn('Send home', 'alt', () => { const n = removeSlot(i); toStorage(s.id, n); UI.toast(`Sent to your house storage`, it.icon); redraw(); }));
    }
    if (G.area.id === 'island' && it.type !== 'tool' && !importantItem(s.id) && !Online.visitor()) out.push(btn('Drop', 'alt', () => {
        removeSlot(i, 1);
        const p = G.player;
        spawnDrop(s.id, p.x + (p.dir === 'left' ? -10 : p.dir === 'right' ? 10 : 0), p.y + (p.dir === 'up' ? -8 : 6));
        redraw();
    }));
    return out;
}
async function eatItem(i) {
    const s = S.pocket[i];
    if (!s) return;
    const it = ITEMS[s.id];
    const fresh = useFresh(s.id);
    removeSlot(i, 1);
    const p = G.player;
    p.pose = 'happy'; p.poseT = 50;
    Sfx.play('eat');
    if ((it.spicy || 0) >= 2) { p.emote = 'spicy'; p.emoteT = 90; UI.toast(`${it.name}: Thai spicy. Perfect.`, it.icon); }
    else { p.emote = 'heart'; p.emoteT = 70; UI.toast(`Sarah ate the ${it.name.toLowerCase()}. Delicious.`, it.icon); }
    S.stats.ate = (S.stats.ate || 0) + 1;
    foodBonus(it, fresh);
}
function pickFromPocket(title, filter, note) {
    return new Promise(res => {
        let done = false;
        const P = UI.open({ title, onClose: () => { if (!done) { done = true; res(null); } } });
        const grid = el('div', 'grid');
        P.body.appendChild(grid);
        if (note && S.pocket.some(s => s && !filter(s))) P.body.appendChild(el('p', 'muted', note));
        let any = false;
        S.pocket.forEach(s => {
            const ok = s && filter(s);
            if (ok) any = true;
            const b = slotBtn(s && s.id, s && s.n, { onClick: () => { if (!ok) return; done = true; UI.close(true); res(s.id); } });
            if (s && !ok) b.style.opacity = '0.35';
            grid.appendChild(b);
        });
        if (!any) P.body.appendChild(el('p', 'muted', 'Nothing in your pocket fits here.'));
    });
}

/* ---------------------------------------------------------------- phone */
const APPS = [
    ['map', 'Map', '#8fd46f'], ['tasks', 'To-do', '#ffe8b0'], ['texts', 'Messages', '#c8f0c0'], ['friends', 'Friends', '#ffd0dc'], ['recipes', 'Recipes', '#fff0c8'],
    ['collection', 'Collection', '#d8f0ff'], ['wardrobe', 'Wardrobe', '#f7d0d8'], ['moves', 'Moves', '#ecd8ff'], ['camera', 'Camera', '#d0e4ff'],
    ['council', 'Cozy Council', '#d8f0c8'], ['home', 'Decorate', '#ffe6cc'], ['edit', 'Island edit', '#d8f0c8'], ['calendar', 'Today', '#ffe0e8'],
    ['poems', "Joe's Poems", '#fff1c9'], ['pottery', 'Pottery', '#f6dccb'], ['arcade', 'Arcade', '#e8dcff'], ['music', 'Music', '#e6dcff'], ['gohome', 'Go home', '#ffd9d0'],
    ['settings', 'Settings', '#e4e4f0'], ['save', 'Save & quit', '#dfe8f5'], ['designer', 'Designer', '#ffe9a8'],
];
/* the phone apps that only work in some places say so */
async function phoneSays(text) {
    UI.close(true);
    G.busy++;
    try { await UI.say('phone', text); } finally { G.busy--; }
    openPhone();
}
function openPhone() {
    const P = UI.open({ title: S.islandName || 'Island', phone: true });
    // (along the top, as on a phone: the time, the day's weather and what's in the wallet)
    const bar = el('div', 'pstatus'), f = Clock.fmt();
    bar.appendChild(el('span', null, f.s));
    bar.appendChild(el('span', null, `${Clock.dateLine().replace(/^\w+, /, '')} \u00b7 ${{ sunny: 'Sunny', cloudy: 'Cloudy', rain: 'Rain', snow: 'Snow' }[G.weather] || ''}`));
    const cash = el('span');
    cash.appendChild(el('i', 'coin'));
    cash.appendChild(document.createTextNode(fmtNum(S.money)));
    bar.appendChild(cash);
    P.body.appendChild(bar);
    // (two even rows of tiles: the everyday apps, the two folders, Settings and Save & quit, each a tile of its own)
    P.body.appendChild(appGrid(PHONE_HOME.map(id => (PHONE_FOLDERS.some(f => f.id === id) ? folderTile(PHONE_FOLDERS.find(f => f.id === id)) : appTile(id)))));
}
/* the phone's home screen (David, 29 October: "22 options when you open your phone is a lot... put some apps in its own
   section"), in two even rows (David, 29 October, later: Mail off the phone, letters are read at the mailbox; Save & quit a
   tile of its own instead of a button at the foot): the everyday apps, the two folders opened in place, Settings, Save & quit */
const PHONE_HOME = ['map', 'texts', 'friends', 'tasks', 'calendar', 'camera', 'play', 'island', 'settings', 'save'];
const PHONE_FOLDERS = [
    { id: 'play', name: 'Play', apps: ['arcade', 'music', 'moves', 'poems', 'pottery', 'recipes'] },
    { id: 'island', name: 'Home & island', apps: ['home', 'edit', 'wardrobe', 'collection', 'council', 'gohome', 'designer'] },
];
/* tiles in two rows, as many across as that takes (the home screen five, a folder three or four) */
function appGrid(tiles) {
    const grid = el('div', 'apps');
    grid.style.setProperty('--cols', String(Math.max(3, Math.min(5, Math.ceil(tiles.length / 2)))));
    for (const t of tiles) grid.appendChild(t);
    return grid;
}
/* (the designer only where the island's design can be saved: the beta site, 6zza_designer.js) */
function appShown(id) { return id !== 'designer' || Design.edit; }
function appBadge(id) { return id === 'tasks' ? Requests.open().length : id === 'texts' ? Invites.pending().length : 0; }
function appTile(id, from) {
    const [, label, color] = APPS.find(a => a[0] === id);
    const b = el('button', 'app');
    b.type = 'button';
    b.dataset.app = id;
    const tile = el('div', 'tile');
    tile.style.background = color;
    tile.appendChild(phoneIcon(id, color, 38));
    b.appendChild(tile);
    b.appendChild(el('span', null, label));
    const u = appBadge(id);
    if (u) tile.appendChild(el('span', 'badge', String(u)));
    b.addEventListener('click', () => { Sfx.ui('tick'); openApp(id, from); });
    return b;
}
/* a folder: its first four apps small on a frosted tile; a tap opens it */
function folderTile(f) {
    const apps = f.apps.filter(appShown), b = el('button', 'app folder');
    b.type = 'button';
    b.dataset.folder = f.id;
    const tile = el('div', 'tile');
    for (const id of apps.slice(0, 4)) { const m = el('div', 'mini'); const col = APPS.find(a => a[0] === id)[2]; m.style.background = col; m.appendChild(phoneIcon(id, col, 18)); tile.appendChild(m); }
    const u = apps.reduce((n, id) => n + appBadge(id), 0);
    if (u) tile.appendChild(el('span', 'badge', String(u)));
    b.appendChild(tile);
    b.appendChild(el('span', null, f.name));
    b.addEventListener('click', () => { Sfx.ui('tick'); openFolder(f.id); });
    return b;
}
function openFolder(fid) {
    const f = PHONE_FOLDERS.find(q => q.id === fid);
    const P = UI.open({ title: f.name, phone: true, back: () => openPhone() });
    P.body.appendChild(appGrid(f.apps.filter(appShown).map(id => appTile(id, fid))));
}
/* (an app opened from a folder goes back to the folder) */
let phoneFrom = null;
function openApp(id, from) {
    phoneFrom = from || null;
    ({ map: appMap, tasks: appTasks, friends: appFriends, recipes: appRecipes, collection: appCollection, wardrobe: () => openWardrobe(true),
        moves: appMoves, camera: () => { UI.close(true); Photo.start(); }, calendar: appToday, settings: appSettings, poems: appPoems, pottery: appPottery,
        council: appCouncil, arcade: appArcade, texts: appTexts, gohome: askGoHome, music: () => appMusic(), save: appSaveQuit, designer: () => Design.app(),
        home: () => { if (G.area.id !== 'home') { phoneSays('Decorate only works inside your house. Head home first, then open it again!'); return; } UI.close(true); Decor.enter(); },
        paths: () => { UI.close(true); PathTool.open(); },
        edit: () => { if (G.area.id !== 'island') { phoneSays('Island edit only works outside. Step outside first, then open it again!'); return; } UI.close(true); IslandEdit.open(); } })[id]();
}
const backToPhone = () => (phoneFrom ? openFolder(phoneFrom) : openPhone());

function appMap() { UI.close(true); BigMap.open({ fromPhone: true }); }

/* the letters, read at the mailbox by Sarah's door (David, 29 October: no Mail app on the phone any more, "so you can only
   check it at the mailbox"; its flag is up and flashing while there are new ones, 20_world.js and EnvBuild) */
function unreadMail() { return S.mail.filter(m => !m.read && m.day <= Clock.dayNum()).length; }
/* the mailbox in the flat views: its flag up while there are new letters, flashing (lit every other half second) */
function mailboxFrame() {
    if (mailboxFrame.f !== G.frame) { mailboxFrame.f = G.frame; mailboxFrame.n = S && S.mail ? unreadMail() : 0; }
    if (!mailboxFrame.n) return 'mailbox';
    if (!(Math.floor(performance.now() / 450) % 2)) return 'mailbox_flag';
    // (the classic picture's flag lit: its reds turned a warm gold; the HD-2D view has its own, HD_SPR.mailbox_flag_lit)
    if (!Assets.dyn.mailbox_flag_lit && Assets.frames.mailbox_flag) {
        const [sx, sy, w, h, ax, ay] = Assets.frames.mailbox_flag, c = document.createElement('canvas');
        c.width = w; c.height = h;
        const g = c.getContext('2d');
        g.drawImage(Assets.atlas, sx, sy, w, h, 0, 0, w, h);
        const d = g.getImageData(0, 0, w, h), p = d.data;
        for (let i = 0; i < p.length; i += 4) if (p[i + 3] && p[i] > 140 && p[i] - p[i + 1] > 70 && p[i] - p[i + 2] > 50) { p[i] = 255; p[i + 1] = Math.min(255, p[i + 1] + 150); p[i + 2] = Math.min(255, p[i + 2] + 40); }
        g.putImageData(d, 0, 0);
        Assets.dyn.mailbox_flag_lit = { c, w, h, ax, ay };
    }
    return 'mailbox_flag_lit';
}
async function openMailbox() {
    if (S.mail.some(m => m.day <= Clock.dayNum())) Sfx.play('item'); else Sfx.ui('open');
    appMail(true);
}
/* (the mailbox's letters; `box` is left from when the phone had them too, `all` shows the older ones as well) */
function appMail(box, all) {
    const P = UI.open({ title: 'Mailbox' });
    const list = el('div', 'list');
    const mails = S.mail.filter(x => x.day <= Clock.dayNum()).reverse();
    // letters to the other people who play (13_online.js)
    const write = btn('Write a letter', 'green', () => Online.writeLetter());
    write.style.marginBottom = '10px';
    P.body.appendChild(write);
    // (orders and presents piling up: every present taken at once, the letters left to read)
    const gifted = mails.filter(m => mailGifts(m).length && !m.claimed);
    if (gifted.length >= 2) {
        const all = btn(`Take every present (${gifted.length})`, 'alt', () => {
            let home = 0;
            for (const m of gifted) {
                m.claimed = true;
                for (const g of mailGifts(m)) if (!addItem(g, 1, true)) { toStorage(g, 1); home++; }
            }
            Sfx.play('item'); Save.touch();
            UI.toast(home ? `Presents taken (${home} went home to storage)` : 'Presents taken', 'ui_present');
            appMail(true);
        });
        all.style.margin = '0 0 10px 8px';
        P.body.appendChild(all);
    }
    if (!mails.length) list.appendChild(el('p', 'muted', rpick(['The mailbox is empty. A tiny spider lives in it. It seems happy.', 'Nothing in the mailbox yet. Neighbors write once they get to know you.'])));
    // (months of letters: the newest first, the older ones a tap away, so the list doesn't go on and on)
    const MAIL_SHOWN = 30, shown = all ? mails : mails.filter((m, i) => i < MAIL_SHOWN || !m.read || (mailGifts(m).length && !m.claimed));
    for (const m of shown) {
        const r = el('button', 'row' + (m.read ? '' : ' unread'));
        r.type = 'button';
        r.appendChild(uiIcon(mailGifts(m).length && !m.claimed ? 'ui_present' : 'app_mail', 40));
        const t = el('div', 't');
        t.appendChild(el('b', null, m.subject));
        t.appendChild(el('span', null, mailFromName(m)));
        r.appendChild(t);
        r.addEventListener('click', () => openLetter(m));
        list.appendChild(r);
    }
    if (shown.length < mails.length) {
        const more = btn(`Older letters (${mails.length - shown.length})`, 'alt', () => appMail(true, true));
        more.style.margin = '10px 0 0 8px';
        list.appendChild(more);
    }
    P.body.appendChild(list);
}
function mailFromName(m) {
    if (PEOPLE.includes(m.from) && !NPC_DEFS[m.from]) return Online.name(m.from);
    if (m.from === 'harvard') return 'Harvard (probably)';
    if (m.from === 'fortune') return "Fortune's Goods";
    if (m.from === 'shop') return 'IslandMart (online)';
    if (m.from === 'post') return 'The Post Office';
    return (NPC_DEFS[m.from] && NPC_DEFS[m.from].name) || m.from;
}
/* a letter can carry one gift (m.gift) or a whole order (m.gifts) */
function mailGifts(m) { return m.gifts ? m.gifts : m.gift ? [m.gift] : []; }
function openLetter(m) {
    m.read = true;
    mailboxFrame.f = null;
    Save.touch();
    HUD.update();
    const gifts = mailGifts(m);
    const P = UI.open({ title: m.subject, back: () => appMail(true), foot: gifts.length > 0 || m.paper != null });
    // a postcard shows its picture; the paper opens to read (6zf_post.js)
    const card = m.card && typeof POSTCARDS !== 'undefined' && POSTCARDS.find(c => c[0] === m.card);
    if (card) { const cv = postcardCanvas(card, 288, 192); cv.className = 'postcard'; P.body.appendChild(cv); }
    const body = el('div', 'letterbody', fillText(m.body));
    P.body.appendChild(body);
    if (m.paper != null) {
        const p = post().papers.find(q => q.day === m.paper);
        if (p) P.foot.appendChild(btn('Read the paper', 'green', () => { const Q = UI.open({ title: m.subject, back: () => openLetter(m) }); Q.body.className = 'pbody cv'; paperView(Q.body, p); }));
    }
    if (gifts.length) {
        if (m.claimed) P.foot.appendChild(el('span', 'grow', `Came with: ${gifts.map(g => itemName(g)).join(', ')} (taken)`));
        else {
            if (gifts.length === 1) P.foot.appendChild(detailRow(gifts[0], 'Attached gift'));
            else P.foot.appendChild(el('span', 'grow', `In the box: ${gifts.map(g => itemName(g)).join(', ')}`));
            P.foot.appendChild(btn(gifts.length === 1 ? 'Take it' : 'Take them', 'green', () => {
                m.claimed = true;
                for (const g of gifts) receive(g, 1);
                Sfx.play('item'); Save.touch(); openLetter(m);
            }));
        }
    }
}

function appFriends() {
    const P = UI.open({ title: 'Friends', phone: true, back: backToPhone });
    const list = el('div', 'list');
    const ids = NEIGHBORS.concat(['joe'], ['goat']);
    let shown = 0;
    for (const id of ids) {
        const r = S.npcs[id];
        if (!r || !r.met) continue;
        shown++;
        const d = NPC_DEFS[id];
        const row = el('div', 'row');
        row.appendChild(iconCanvas(d.human ? `${d.human}_down_stand` : `${d.sprite}_0`, 40));
        const t = el('div', 't');
        t.appendChild(el('b', null, d.name));
        // (their hours and today's plan only on the beta site or with the debug tools: in the game, text them, 69_texts.js)
        const wb = id === 'goat' || !plansShown() ? null : wakeBed(id);
        const partner = coupleOf(id);
        const tip = id === 'goat' ? "It's a goat. It lives at the farm now."
            : (TALK[id] ? `Loves: ${lovesText(id)}` : id === 'joe' ? 'Likes: rhyming, takeout, frogs. (And you. Shh.)' : 'Family')
            + (wb ? ` \u00b7 up ${fmtDayHour(wb.wake)} to ${fmtDayHour(wb.bed)}` : '') + (partner ? ` \u00b7 dating ${NPC_DEFS[partner].name}` : '');
        t.appendChild(el('span', null, tip));
        row.appendChild(t);
        if (id !== 'goat') row.appendChild(el('span', 'hearts', heartStr(hearts(id))));
        // (a tap opens their profile: 6zzb_profiles.js)
        row.classList.add('tap'); row.onclick = () => { Sfx.ui('tick'); appProfile(id); };
        list.appendChild(row);
    }
    if (!shown) list.appendChild(el('p', 'muted', "You haven't met anyone yet. Say hi to the neighbors!"));
    P.body.appendChild(list);
    P.body.appendChild(el('p', 'muted', 'Tap a friend to see their page. Chat and give gifts to build friendship. Friends share recipes and letters. At five hearts, they give you their photo.'));
}
function lovesText(id) {
    const map = { maki: 'sushi', kai: 'poke bowls, tuna', basil: 'Thai food', wonton: 'dumplings (veggie!)', chili: 'anything very spicy',
        coco: 'chocolate', cece: 'cheesecake', clementine: 'clothes, fruit salad', cuke: 'veggies', david: 'anything that sparkles',
        sully: 'lobster rolls, chocolate', ginger: 'wood, gingerbread', brulee: 'art, cr\u00e8me br\u00fbl\u00e9e, sea glass', mac: 'home cooking' };
    return map[id] || 'gifts';
}

function appRecipes() {
    const P = UI.open({ title: 'Recipes', phone: true, back: backToPhone });
    P.body.appendChild(el('p', 'muted', `You know ${S.recipes.length} of ${RECIPES.length}. Friends teach you new ones. Cook at your kitchenette.`));
    const list = el('div', 'list');
    const sorted = RECIPES.filter(r => S.recipes.includes(r.id)).concat(RECIPES.filter(r => !S.recipes.includes(r.id)));
    for (const r of sorted) {
        const known = S.recipes.includes(r.id);
        const row = el('div', 'row');
        const ic = iconCanvas('dish_' + r.id, 40);
        if (!known) ic.style.filter = 'brightness(0) opacity(0.25)';
        row.appendChild(ic);
        const t = el('div', 't');
        t.appendChild(el('b', null, known ? r.name : '???'));
        t.appendChild(el('span', null, known ? Object.entries(r.need).map(([k, n]) => (n > 1 ? n + ' \u00d7 ' : '') + itemName(k)).join(', ') : 'Not learned yet'));
        row.appendChild(t);
        if (known && r.spicy >= 2) row.appendChild(el('span', 'price', 'Spicy'));
        list.appendChild(row);
    }
    P.body.appendChild(list);
}

function appCollection(tab) {
    tab = tab || 'fish';
    const tabs = el('div', 'tabs');
    const P = UI.open({ title: 'Collection', phone: true, back: backToPhone, tabs });
    const T = [['fish', 'Fish'], ['beach', 'Beach'], ['garden', 'Fruit & veg'], ['flower', 'Flowers'], ['dish', 'Dishes'], ['furniture', 'Furniture'], ['special', 'Specials']];
    for (const [k, label] of T) {
        const b = el('button', 'tab' + (k === tab ? ' on' : ''), label);
        b.type = 'button';
        b.addEventListener('click', () => appCollection(k));
        tabs.appendChild(b);
    }
    if (tab === 'special') { specialsTab(P); return; }
    const ids = {
        fish: FISHES.map(f => f.id),
        beach: GD.shells.map(s => s.id).concat(['star', 'bottle', 'clam_live', 'wood']),
        garden: GD.fruit.concat(GD.veg),
        flower: Object.keys(ITEMS).filter(k => ITEMS[k].type === 'flower'),
        dish: RECIPES.map(r => r.id),
        furniture: Object.keys(FURN).filter(k => !FURN[k].fixture && !FURN[k].pottery),
    }[tab];
    const found = ids.filter(i => S.seen[i]).length;
    P.body.appendChild(el('p', 'muted', `Found ${found} of ${ids.length}.`));
    const grid = el('div', 'grid');
    for (const i of ids) {
        const seen = !!S.seen[i];
        // (tap one found: its own display, 41a_showcase.js)
        const b = slotBtn(i, 0, { locked: !seen, onClick: () => { if (seen) { Sfx.ui('tick'); itemShowcase(i, () => appCollection(tab)); } } });
        grid.appendChild(b);
    }
    P.body.appendChild(grid);
    P.body.appendChild(el('p', 'muted', 'Tap something you\'ve found to see it up close.'));
}
/* the Specials list: everything one-of-a-kind, what's found, and a hint for what isn't */
function specialsTab(P) {
    const all = Object.values(SPECIALS);
    P.body.appendChild(el('p', 'muted', `Found ${specialCount()} of ${all.length}. Specials turn up in fishing crates, sparkly trees, favors for neighbors, high scores, new recipes, and a few island mysteries.`));
    for (const [cat, label] of SPECIAL_CATS) {
        const list = all.filter(sp => sp.cat === cat);
        if (!list.length) continue;
        P.body.appendChild(el('p', 'artcap', `${label} (${list.filter(sp => hasSpecial(sp.id)).length}/${list.length})`));
        const grid = el('div', 'list sp-list');
        for (const sp of list) {
            const got = hasSpecial(sp.id);
            const row = el('div', 'row' + (got ? '' : ' locked'));
            row.appendChild(got ? iconCanvas(specialIcon(sp.id), 40) : el('div', 'sp-q', '?'));
            const t = el('div', 't');
            t.appendChild(el('b', null, got ? sp.name : '???'));
            t.appendChild(el('span', null, got ? (specials()[sp.id].how || SPECIAL_BLURB[sp.cat]) : sp.hint ? 'Hint: ' + sp.hint : 'Keep exploring. There\'s more to find around the island.'));
            row.appendChild(t);
            grid.appendChild(row);
        }
        P.body.appendChild(grid);
    }
}
function fishNote(id) {
    const f = FISHES.find(x => x.id === id);
    if (!f) return ITEM_TYPES[ITEMS[id].type];
    const where = f.where.split('').map(c => ({ s: 'sea', r: 'river', p: 'pond' }[c])).join(' or ');
    const hrs = f.hours[1] - f.hours[0] >= 24 ? 'any time' : `${fmtHour(f.hours[0])} to ${fmtHour(f.hours[1])}`;
    return `${cap(where)}, ${hrs}. Sells for ${fmtNum(f.price)}.`;
}
function fmtHour(h) { h = h % 24; return `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`; }

function appMoves() {
    const P = UI.open({ title: 'Moves', phone: true, back: backToPhone });
    const list = el('div', 'list');
    for (const m of S.dance.moves) {
        if (!MOVES[m]) continue;
        const r = el('button', 'row');
        r.type = 'button';
        r.appendChild(uiIcon('emote_' + (MOVES[m].emote || 'note'), 40));
        const t = el('div', 't');
        t.appendChild(el('b', null, MOVES[m].name));
        t.appendChild(el('span', null, MOVES[m].note));
        r.appendChild(t);
        r.addEventListener('click', () => { UI.close(true); doMove(m); });
        list.appendChild(r);
    }
    for (const m of Object.keys(MOVES).filter(k => !S.dance.moves.includes(k))) {
        const r = el('div', 'row locked');
        r.appendChild(uiIcon('ui_lock', 40));
        const t = el('div', 't');
        t.appendChild(el('b', null, MOVES[m].name));
        t.appendChild(el('span', null, 'Locked. ' + moveHow(m)));
        r.appendChild(t);
        list.appendChild(r);
    }
    P.body.appendChild(list);
    P.body.appendChild(el('p', 'muted', 'Learn new moves by dancing at Club Wasabi, and keep an eye out for hidden ones.'));
}

function appToday() {
    const P = UI.open({ title: 'Today', phone: true, back: backToPhone });
    const st = shopStock();
    const up = NPCs.list.filter(n => !n.sleeping && !n.def.dj && !n.def.goat).length;
    const d = Drama.cur();
    const lines = [
        ['Island time', `${Clock.fmt().s}. (Settings can change it.)`],
        ['Weather', cap({ sunny: 'sunny', cloudy: 'cloudy', rain: 'rain', snow: 'snow' }[G.weather])],
        ['Special', eventLabel() || 'Just a nice day'],
        ['Who\'s up', `${up} ${plural(up, 'neighbor')} awake right now. Most are up by 9 AM and in bed around midnight.`],
        ["Fortune's hot item", `${itemName(st.hot)} (pays double)`],
        ['Shops', `Fortune's ${hoursText('shop')}. Clementine's ${hoursText('boutique')}. Mac's ${hoursText('restaurant')}. The museum ${hoursText('museum')}. Sully's studio ${hoursText('studio')}. Ginger's workshop ${hoursText('builder')}. Floss & Gloss ${hoursText('salon')}. Waffle's ${hoursText('displays')}. Noodle cart 8 PM to 1 AM. If nobody's at the counter, it's the honor system.`],
        ['Arcade', `${cap(hoursText('arcade'))}, on the Boardwalk. Chili runs the prize counter most afternoons.`],
        ['Club Wasabi', 'Busy from 9 PM. Practice any time.'],
        ['Joe', 'Up early (around 6:30 AM), to bed late. Sunset at the pier. Ask him for a poem.'],
    ];
    const rd = ropeDay();
    lines.push(['Jump rope', rd ? `In the plaza, 2:30 to 5:30 PM, with ${NPC_DEFS[rd.a].name} and ${NPC_DEFS[rd.b].name}.` : 'Not today. (Too wet, or Cuke is resting his arms.)']);
    if (S.birthday) lines.push(['Your birthday', `${MONTHS[S.birthday.m - 1]} ${S.birthday.d}`]);
    const list = el('div', 'list');
    for (const [k, v] of lines) {
        const r = el('div', 'row');
        const t = el('div', 't');
        t.appendChild(el('b', null, k));
        t.appendChild(el('span', null, v));
        r.appendChild(t);
        list.appendChild(r);
    }
    P.body.appendChild(list);
    const cal = el('div', 'st-row');
    cal.style.marginTop = '12px';
    cal.appendChild(btn('Holidays & calendar', 'green', () => { UI.close(true); openBoard(true); }));
    P.body.appendChild(cal);
}

/* picture quality and draw distance (31_render3d.js GFX), kept per device */
function gfxSetting() {
    const box = el('div', 'field');
    box.style.marginTop = '14px';
    for (const [k, label, names, tip] of [['q', 'Picture quality', ['auto', 'low', 'medium', 'high'], 'Lower is smoother on slower devices. High shows reflections in the water.'],
        ['f', 'Draw distance', ['auto', 'near', 'normal', 'far'], 'How far off the island is drawn before the haze.']]) {
        box.appendChild(el('span', null, label));
        const row = el('div', 'st-row');
        const draw = () => { row.innerHTML = ''; for (const n of names) row.appendChild(chip(cap(n), () => { GFX.set(k, n); draw(); }, GFX.pick(k) === n ? 'on' : '')); };
        draw();
        box.appendChild(row);
        box.appendChild(el('p', 'muted', tip));
    }
    return box;
}
function appSettings() {
    const P = UI.open({ title: 'Settings', phone: true, back: backToPhone });
    const b = P.body;
    const toggle = (label, get, set) => {
        const r = el('button', 'row');
        r.type = 'button';
        const t = el('div', 't');
        t.appendChild(el('b', null, label));
        const s = el('span', null, get() ? 'On' : 'Off');
        t.appendChild(s);
        r.appendChild(t);
        r.addEventListener('click', () => { set(!get()); s.textContent = get() ? 'On' : 'Off'; Sfx.ui('tick'); });
        return r;
    };
    const list = el('div', 'list');
    list.appendChild(toggle('Music', () => Audio2.musicOn, v => { Audio2.musicOn = v; Audio2.savePrefs(); Music.update(true); }));
    list.appendChild(toggle('Sound effects', () => Audio2.sfxOn, v => { Audio2.sfxOn = v; Audio2.savePrefs(); }));
    list.appendChild(toggle('Neighbors can text me first', () => !(S.settings && S.settings.npcTexts === false), v => { S.settings = S.settings || {}; S.settings.npcTexts = v; Save.touch(); }));
    // 3D, or the classic flat view (kept per device; phones without WebGL always use the classic view): "give players an
    // option to play in 2D mode", David, 28 October
    if (R3.available()) {
        const v = toggle('View', () => R3.want, on => R3.setWant(on)), s = v.querySelector('span'), show = () => { s.textContent = R3.want ? '3D' : 'Classic 2D'; };
        show();
        v.addEventListener('click', show);
        list.appendChild(v);
    }
    // (the new 3D look can draw the tiles on the ground, kept per device)
    if (R3.available() && typeof Env !== 'undefined' && Env.want()) list.appendChild(toggle('Show the tile grid', () => EnvGround.gridOn.value > 0, v => { EnvGround.gridOn.value = v ? 1 : 0; lsSet('sc-grid', v ? '1' : '0'); }));
    b.appendChild(list);
    // the island's name and clock are Sarah's to set
    if (!Online.visitor()) { b.appendChild(islandNameSetting()); b.appendChild(clockSetting()); }
    b.appendChild(zoomSetting());
    if (R3.available()) b.appendChild(gfxSetting());
    b.appendChild(el('h3', null, '')).style.margin = '8px 0 0';
    const note = el('p', 'muted', Cloud.problem === 'offline' ? "Can't reach the island server right now. Your island is kept on this device and saves online once the connection is back."
        : 'Your island saves online as you play, so it follows you to any device.');
    b.appendChild(note);
    const codeBox = el('div', 'field');
    codeBox.appendChild(el('span', null, 'Save code (a backup you can copy)'));
    const ta = el('textarea');
    ta.id = 'savecode';
    ta.readOnly = true;
    ta.placeholder = 'Tap "Make save code"';
    codeBox.appendChild(ta);
    b.appendChild(codeBox);
    const row = el('div');
    row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:8px';
    row.appendChild(btn('Make save code', '', async () => {
        ta.value = await Save.exportCode();
        ta.focus(); ta.select();
        try { await navigator.clipboard.writeText(ta.value); UI.toast('Save code copied'); } catch (e) { UI.toast('Save code ready. Copy it from the box.'); }
    }));
    row.appendChild(btn('Load a code', 'alt', () => loadCodePanel()));
    b.appendChild(row);
    const dl = el('div');
    dl.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:8px';
    dl.appendChild(btn('Save a backup file', 'alt', () => saveGameFile()));
    b.appendChild(dl);
    const isl = el('div');
    isl.style.cssText = 'margin-top:18px;padding-top:12px;border-top:2px dashed var(--line)';
    isl.appendChild(el('p', 'muted', 'Switch islands, start a new island, or restore a backup. Existing islands remain saved online.'));
    isl.appendChild(btn('Your islands', 'alt', () => IslandList.open(true)));
    b.appendChild(isl);
    b.appendChild(el('p', 'muted', 'Controls: arrows or WASD walk, Shift runs, E / Space / Enter talks and uses things, I opens the pocket, P opens the phone, M opens the map, Q does a dance move, - and + zoom, H twice goes home. On a phone, tap where you want to go or what you want to use, and pinch to zoom.'));
    if (!Online.visitor()) b.appendChild(secretsSection());
}
/* the island clock: pick the time it is on the island; it keeps running from there */
function clockSetting() {
    const box = el('div', 'field');
    box.style.marginTop = '14px';
    box.appendChild(el('span', null, 'Island clock'));
    const row = el('div', 'clockrow');
    const now = el('b', 'clocknow', Clock.fmt().s);
    const inp = el('input');
    inp.type = 'time'; inp.id = 'clockset'; inp.setAttribute('aria-label', 'Island time');
    const d = Clock.island();
    inp.value = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    row.appendChild(now);
    row.appendChild(inp);
    row.appendChild(btn('Set', 'green', () => {
        const m = /^(\d{1,2}):(\d{2})/.exec(inp.value || '');
        if (!m) { UI.toast('Pick a time first'); return; }
        setIslandTime(+m[1], +m[2]);
        clockChanged();
        now.textContent = Clock.fmt().s;
        Sfx.play('item');
        UI.toast(`The island clock now says ${Clock.fmt().s}.`);
    }));
    box.appendChild(row);
    const nudge = el('div', 'st-row');
    nudge.style.marginTop = '6px';
    for (const [label, mins] of [['-1 hour', -60], ['-10 min', -10], ['+10 min', 10], ['+1 hour', 60]]) {
        nudge.appendChild(chip(label, () => {
            if (!S.settings) S.settings = {};
            S.settings.clockShift = Clock.shiftMin() + mins;
            clockChanged();
            now.textContent = Clock.fmt().s;
            const dd = Clock.island();
            inp.value = `${String(dd.getHours()).padStart(2, '0')}:${String(dd.getMinutes()).padStart(2, '0')}`;
        }));
    }
    box.appendChild(nudge);
    box.appendChild(el('p', 'muted', "The clock keeps running from whatever time you set. Moving it across 5 AM can start a new island day early (or give you yesterday again)."));
    return box;
}
/* after the clock moves: new weather, events, lighting, where everyone is */
function clockChanged() {
    Save.touch();
    G.weather = todayWeather(); G.events = todayEvents();
    const a = G.areas.island;
    if (a && a.bgSeason !== Clock.season()) { G.areas.island = buildIsland(); restoreDrops(G.areas.island); spawnShells(G.areas.island); if (G.area.id === 'island') G.area = G.areas.island; }
    if (dailyCheck()) {
        const isl = G.areas.island;
        isl.ents = isl.ents.filter(e => e.shellIdx == null);
        spawnShells(isl); addForest(isl); addWildFlowers(isl); addPlantedFlowers(isl);
    }
    decorateIsland(G.areas.island);
    Plans.reset(); NPCs.place(true); Music.update(true); HUD.update();
}
/* a save code (or file) comes in as an island of its own, or replaces the same island: see 6x_islands.js */
function loadCodePanel(fromTitle) { IslandList.importPanel(!fromTitle); }

/* ---------------------------------------------------------------- shop */
async function fortuneTalk(n) {
    const r = rel('fortune'), day = Clock.dayNum();
    if (!r.met) { r.met = true; await UI.say('fortune', "Welcome to Fortune's Goods! Everything's fresh. Including me. Especially me.", { keep: true }); }
    if (r.talkDay !== day) {
        r.talkDay = day;
        const f = FORTUNES[hash32(S.seed + ':f:' + day) % FORTUNES.length];
        n.emote = 'sparkle'; n.emoteT = 60;
        await UI.say('fortune', ["Today's fortune! *crack*", `"${f}"`], { keep: true });
        const ev = G.events;
        const gifts = { halloween: 'pumpkin_lantern', winterfest: 'snow_globe', lunar: 'lunar_lantern', valentine: 'heart_lamp', july4: 'firework_poster', newyear: 'firework_poster',
            earthday: 'sapling', islandday: 'star_jar', harvest: 'lunar_lantern', flowerfest: 'seed_fl_lily' };
        if (G.events.has('fortuneday')) {
            const f2 = FORTUNES[hash32(S.seed + ':f2:' + day) % FORTUNES.length];
            await UI.say('fortune', ["It's Fortune Cookie Day! You get a second one. *crack*", `"${f2}"`], { keep: true });
        }
        for (const [k, gift] of Object.entries(gifts)) {
            if (ev.has(k) && !S.flags['hol_' + k + day]) {
                S.flags['hol_' + k + day] = true;
                await UI.say('fortune', `And happy ${eventLabel()}! Here, a little something for your house.`, { keep: true });
                receive(gift, 1);
                break;
            }
        }
    }
    await shopOrderTalk();
    for (;;) {
        if (!S.flags.gingerHint && S.house.level < HOUSE_EXPAND.length) {
            S.flags.gingerHint = true;
            await UI.say('fortune', "Oh! Want a bigger house? Ginger the builder has a workshop now, just up the road from here. Tell her I sent you. She won't care, but tell her.", { keep: true });
        }
        const opts = ['Talk', 'Buy', 'Sell', 'See you!'];
        const k = await UI.ask('fortune', rpick(['What can I do for you?', 'Buying? Selling? Just here for the fortune? Everyone is just here for the fortune.', 'Take your time! Island time!']), opts, { keep: true });
        const c = opts[k];
        if (c === 'Talk') { await justTalk(n, () => (R() < 0.5 && shopTalk('shop')) || rpick(FORTUNE_CHAT)); continue; }
        UI.hideDialog();
        if (c === 'Buy') { await shopBuy(); }
        else if (c === 'Sell') { await shopSell(); }
        else { await UI.say('fortune', rpick(['Come back soon! The fortune changes every day!', "Bye bye! May your cookies always crack evenly!", 'See you! Sleep in! It is good for you!'])); return; }
    }
}
const FORTUNE_CHAT = ["Someone bought my display lamp yesterday. I had to put up a lamp to show where the lamp used to be.",
    'My fortune said to try something new. I put the lamps on the other shelf. Had a few minutes of wondering where I\'d put the lamps.', "Cuke comes in at 8 AM on the dot, every day. I open at 8. He's been waiting outside since 4.",
    "When I'm on a break, the shop runs on the honor system. Everyone pays. Cuke overpays. Every time.",
    "Mac buys all my flour. Cece buys all my sugar. Together they buy all my eggs. It's a whole economy.",
    "The best time to sell fish is whenever you catch them. That's also my life advice.", "I found a fortune in a cookie once that said 'you are the cookie.' I think about it a lot.",
    "Ginger fixed my counter. The cookie jar used to wobble. I miss the little rattle, but I prefer the jar in one piece.",
    "I sleep in a big fortune cookie. Well. It's a bed shaped like one. Close enough!"];
function shopBuy(startTab) {
    return new Promise(res => {
        const st = shopStock();
        const tabs = el('div', 'tabs');
        let tab = startTab || 'furniture';
        const P = UI.open({ title: `${shopName('shop')} \u00b7 Buy`, tabs, foot: true, wide: true, onClose: res });
        const V = storeView(P);
        const lists = {
            furniture: () => st.furn.concat(st.walls, st.floors),
            week: () => (st.week ? st.week.ids : []),
            garden: () => GD.veg.map(v => 'seed_' + v).filter(farOk).concat(GD.flowerKinds.map(k => 'seed_fl_' + k)),
            pantry: () => GD.staples.slice().concat(candyOnSale() ? ['candy'] : []),
            tools: () => TOOL_STOCK.slice().concat(nextBag() ? [nextBag()] : []),
        };
        const priceOf = id => Math.round(shopPrice(id, 'shop') * (ITEMS[id].flower && G.events.has('flowerfest') ? 0.5 : 1));
        const what = id => {
            const it = ITEMS[id], f = FURN[id], note = priceNote(id, 'shop');
            return (f ? `${SET_NAMES[f.sets[0]]} \u00b7 ${f.w}\u00d7${f.kind === 'wall' ? 1 : f.h}${f.kind === 'wall' ? ' wall' : f.kind === 'top' ? ' tabletop' : f.kind === 'rug' ? ' rug' : ''}` : it.type === 'bag' ? `+10 pocket slots (you have ${pocketSize()})` : ITEM_TYPES[it.type]) + (note ? ' \u00b7' + note : '');
        };
        /* one bought: furniture goes home, the rest into the pocket */
        const buy = id => {
            const it = ITEMS[id], price = priceOf(id);
            if (S.money < price) { Sfx.ui('nope'); UI.toast('Not enough sand dollars'); return false; }
            if (it.type === 'bag') { addMoney(-price, true, 'Shops'); noteSpend('shop', price); upgradeBag(); Sfx.play('fanfare'); UI.toast(`${it.name}! Your pocket now holds ${pocketSize()} things.`, it.icon); return true; }
            const big = ['furniture', 'wall', 'floor'].includes(it.type);
            addMoney(-price, true, buyWhy(id));
            if (big) { toStorage(id, 1); UI.toast(`${it.name} delivered to your house`, it.icon); }
            else receive(id, 1);
            if (id === 'rod') S.flags.rodBought = true;
            Sfx.play('buy');
            S.stats.bought = (S.stats.bought || 0) + 1;
            shopPaid('shop', id, price);
            return true;
        };
        const pick = id => {
            const it = ITEMS[id], price = priceOf(id), many = !['furniture', 'wall', 'floor', 'bag', 'tool'].includes(it.type);
            const btns = [btn(price ? `Buy \u00b7 ${fmtNum(price)}` : 'Take one', '', () => { if (buy(id)) draw(true); })];
            if (many && price) btns.push(btn('Buy 5', 'alt', () => { if (buyFive(price, () => buy(id))) draw(true); }));
            V.show(id, { sub: what(id), buttons: btns });
        };
        const draw = (keep) => {
            tabs.innerHTML = '';
            for (const [k, label] of [['furniture', 'Furniture'], st.week ? ['week', 'Set of the week'] : null, ['garden', 'Seeds'], ['pantry', 'Pantry'], ['tools', 'Tools']].filter(Boolean)) {
                const b = el('button', 'tab' + (k === tab ? ' on' : ''), label);
                b.type = 'button';
                b.addEventListener('click', () => { if (tab !== k) { tab = k; V.clear(); draw(); } });
                tabs.appendChild(b);
            }
            const back = V.reset();
            const grid = V.group(), ids = lists[tab]();
            for (const id of ids) V.card(grid, { id, key: id, price: priceOf(id), badge: ITEMS[id].type === 'bag' ? '+10' : null, pick: () => pick(id) });
            if (V.sel && ids.includes(V.sel)) pick(V.sel); else V.clear();
            if (keep) back();
            P.foot.innerHTML = '';
            P.foot.appendChild(el('span', 'grow', tab === 'furniture' ? 'New furniture every day. Furniture goes straight to your house. Clothes are at Clementine\'s.'
                : tab === 'week' && st.week ? `The ${SET_NAMES[st.week.set]} set, 15% off all week. ${fmtNum(S.money)} sand dollars` : `${fmtNum(S.money)} sand dollars`));
        };
        draw();
    });
}
function shopClothes(staffed) {
    return new Promise(res => {
        const st = shopStock();
        const P = UI.open({ title: `${shopName('boutique')} \u00b7 Clothes`, foot: true, wide: true, onClose: res });
        const V = storeView(P);
        const owned = it => it.type === 'outfit' ? S.wardrobe.outfits.includes(it.wear) : S.wardrobe.accs.includes(it.wear);
        const buy = id => {
            const it = ITEMS[id], price = shopPrice(id, 'boutique');
            if (S.money < price) { Sfx.ui('nope'); UI.toast('Not enough sand dollars'); return false; }
            addMoney(-price, true, 'Clothes');
            receive(id, 1);
            Sfx.play('buy');
            S.stats.bought = (S.stats.bought || 0) + 1;
            shopPaid('boutique', id, price);
            if (staffed && R() < 0.4) UI.toast(rpick(['Clementine: "Iconic choice."', 'Clementine: "Darling. Yes."', 'Clementine: "That is so you. Or it will be."']));
            return true;
        };
        const pick = id => {
            const it = ITEMS[id], price = shopPrice(id, 'boutique'), note = priceNote(id, 'boutique');
            V.show(id, { sub: (it.type === 'outfit' ? 'Outfit' : 'Accessory') + (owned(it) ? ' \u00b7 already in your wardrobe' : '') + (note ? ' \u00b7' + note : ''),
                buttons: [btn(price ? `Buy \u00b7 ${fmtNum(price)}` : 'Take it', '', () => { if (buy(id)) draw(true); })] });
        };
        const draw = (keep) => {
            const back = V.reset();
            const grid = V.group();
            for (const id of st.clothes) V.card(grid, { id, key: id, price: shopPrice(id, 'boutique'), badge: owned(ITEMS[id]) ? 'Have' : null, pick: () => pick(id) });
            if (V.sel) pick(V.sel);
            if (keep) back();
            P.foot.innerHTML = '';
            P.foot.appendChild(el('span', 'grow', `New pieces every day. Add clothes to your wardrobe from your pocket, or give accessories to friends. ${fmtNum(S.money)} sand dollars`));
        };
        draw();
    });
}

function appPoems() {
    const P = UI.open({ title: "Joe's Collected Works", phone: true, back: backToPhone });
    const heard = S.poems || [];
    P.body.appendChild(el('p', 'muted', `Every poem Joe has read to you. ${heard.length} of ${JOE_POEMS.length + 1} so far. Ask him for more. (He has more. He always has more.)`));
    const list = el('div', 'list');
    if (!heard.length) list.appendChild(el('p', 'muted', 'No poems yet. Find Joe and ask him for one. You are in for a treat.'));
    heard.forEach((title, i) => {
        const poem = JOE_POEMS.find(p => p[0] === title) || (JOE_SUNSET_POEM[0] === title ? JOE_SUNSET_POEM : null);
        if (!poem) return;
        const row = el('button', 'row');
        row.type = 'button';
        row.appendChild(uiIcon('app_poems', 40));
        const t = el('div', 't');
        t.appendChild(el('b', null, `No. ${i + 1}: "${title}"`));
        t.appendChild(el('span', null, poem[1][0] + ' ...'));
        row.appendChild(t);
        row.addEventListener('click', () => {
            const Q = UI.open({ title: `"${title}"`, back: appPoems });
            Q.body.appendChild(el('div', 'letterbody', poem[1].join('\n') + '\n\n  - Joe (Poet)'));
        });
        list.appendChild(row);
    });
    P.body.appendChild(list);
}

function shopSell() {
    return new Promise(res => {
        const st = shopStock();
        const P = UI.open({ title: `${shopName('shop')} \u00b7 Sell`, foot: true, wide: true, onClose: res });
        const V = storeView(P);
        const each = id => Math.round(sellPrice(id) * (id === st.hot ? 2 : 1) * (bonusOn('haggler') ? 1.25 : 1) * sellBonus());
        const sell = (i, all) => {
            const s = S.pocket[i];
            if (!s) return;
            const n = all ? removeSlot(i) : removeSlot(i, 1), pay = each(s.id) * n;
            addMoney(pay, true, sellWhy(s.id));
            Sfx.play('sell');
            S.stats.sold = (S.stats.sold || 0) + n;
            UI.toast(`Sold${n > 1 ? ` ${n}` : ''}: +${fmtNum(pay)}`, itemIcon(s.id));
            if (!S.pocket[i]) V.clear();
            draw(true);
        };
        const pick = i => {
            const s = S.pocket[i], hot = s.id === st.hot, e = each(s.id);
            const btns = [btn(`Sell 1 \u00b7 ${fmtNum(e)}`, '', () => sell(i, false))];
            if (s.n > 1) btns.push(btn(`Sell all ${s.n} \u00b7 ${fmtNum(e * s.n)}`, 'alt', () => sell(i, true)));
            V.show(s.id, { sub: `${fmtNum(e)} each${hot ? ' \u00b7 hot item today, double price' : ''}${s.n > 1 ? ` \u00b7 you have ${s.n}` : ''}`, buttons: btns });
        };
        const draw = (keep) => {
            const back = V.reset();
            V.list.appendChild(el('p', 'muted', `Hot item today: ${itemName(st.hot)}. Fortune pays double.`));
            const grid = V.group();
            let any = false, kept = 0;
            S.pocket.forEach((s, i) => {
                if (!s) return;
                if (unsellable(s.id)) { if (ITEMS[s.id].type !== 'tool') kept++; return; }
                any = true;
                V.card(grid, { id: s.id, key: 'p' + i, price: each(s.id) * s.n, earn: true, badge: s.n > 1 ? '\u00d7' + s.n : s.id === st.hot ? 'Hot' : null, hot: s.id === st.hot && s.n <= 1, pick: () => pick(i) });
            });
            if (!any) V.list.appendChild(el('p', 'muted', 'Nothing to sell. Shake some trees, comb the beach, or go fishing!'));
            if (kept) V.list.appendChild(el('p', 'muted', `Keepsakes and one-of-a-kind gifts (${kept} in your pocket) aren't for sale. Fortune insists.`));
            const i = V.sel ? +V.sel.slice(1) : -1;
            if (i >= 0 && S.pocket[i] && !unsellable(S.pocket[i].id)) pick(i); else V.clear();
            if (keep) back();
            P.foot.innerHTML = '';
            P.foot.appendChild(el('span', 'grow', `${fmtNum(S.money)} sand dollars`));
            // (a pocketful of one kind sold in one go, as at Animal Crossing's drop-off box: a second tap to be sure)
            for (const [t, word] of [['fish', 'fish'], ['fruit', 'fruit'], ['shell', 'shells'], ['veg', 'vegetables'], ['flower', 'flowers']]) {
                const slots = S.pocket.map((q, k) => [q, k]).filter(([q]) => q && ITEMS[q.id] && ITEMS[q.id].type === t && !unsellable(q.id));
                const n = slots.reduce((a, [q]) => a + q.n, 0), pay = slots.reduce((a, [q]) => a + each(q.id) * q.n, 0);
                if (n < 2 || slots.length < 2) continue;
                const b = btn(`All ${word} (${n})`, 'alt', () => {
                    if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = `Sell ${n} ${word} for ${fmtNum(pay)}?`; return; }
                    for (const [q, k] of slots) removeSlot(k);
                    addMoney(pay, true, sellWhy(slots[0][0].id));
                    Sfx.play('sell');
                    S.stats.sold = (S.stats.sold || 0) + n;
                    UI.toast(`Sold ${n} ${word}: +${fmtNum(pay)}`, itemIcon(slots[0][0].id));
                    V.clear();
                    draw(true);
                });
                P.foot.appendChild(b);
            }
        };
        draw();
    });
}

/* ---------------------------------------------------------------- cooking */
function openCooking(wok) {
    const P = UI.open({ title: wok ? 'Wok stove' : 'Kitchenette', foot: true });
    const draw = () => {
        P.body.innerHTML = '';
        const list = el('div', 'list');
        const known = RECIPES.filter(r => S.recipes.includes(r.id));
        const log = cookLog();
        for (const r of known) {
            const have = Object.entries(r.need).every(([k, n]) => kitchenCount(k) >= n);
            const done = log[r.id];
            const row = el('div', 'row');
            row.appendChild(iconCanvas('dish_' + r.id, 40));
            const t = el('div', 't');
            const b = el('b', null, r.name);
            if (done && done.medal) { b.appendChild(document.createTextNode(' ')); b.appendChild(medalTag(done.medal)); }
            t.appendChild(b);
            t.appendChild(el('span', null, Object.entries(r.need).map(([k, n]) => `${kitchenCount(k) >= n ? '\u2713' : '\u2717'} ${n > 1 ? n + ' \u00d7 ' : ''}${itemName(k)}`).join('  ')));
            row.appendChild(t);
            const go = async quick => {
                if (!have) { Sfx.ui('nope'); UI.toast('Missing ingredients. Fortune sells the pantry basics.'); return; }
                UI.close(true);
                await cookDish(r, quick);
                if (!UI.modal && !G.busy) openCooking(wok);
            };
            if (done) {
                row.appendChild(btn('Quick', have ? 'green' : 'alt', () => go(true)));
                row.appendChild(btn('Play', 'alt', () => go(false)));
            } else row.appendChild(btn('Cook!', have ? 'green' : 'alt', () => go(false)));
            list.appendChild(row);
        }
        const soup = el('div', 'row');
        soup.appendChild(iconCanvas('wonton_0', 40));
        const t = el('div', 't');
        t.appendChild(el('b', null, 'Wonton soup'));
        t.appendChild(el('span', null, 'Sarah looks at this recipe. Then toward the hot spring. She decides not to.'));
        soup.appendChild(t);
        list.appendChild(soup);
        P.body.appendChild(list);
        P.foot.innerHTML = '';
        P.foot.appendChild(el('span', 'grow', 'Ingredients can come from your pocket or house storage. Cook a new dish by hand the first time. Later, choose Quick cook or Play to try for a better medal. Gold makes two servings.'));
    };
    draw();
}

/* ---------------------------------------------------------------- wardrobe */
function openWardrobe(fromPhone) {
    if (visitorStop('look')) return;
    const P = UI.open({ title: 'Wardrobe', phone: false, back: fromPhone === true ? backToPhone : null });
    const draw = () => {
        P.body.innerHTML = '';
        const prev = el('div', 'detail');
        prev.appendChild(sarahPreview(64));
        const t = el('div');
        const wearing = [ITEMS['out_' + S.player.outfit].name].concat([S.player.eyes, S.player.acc].filter(a => a && ITEMS['acc_' + a]).map(a => ITEMS['acc_' + a].name));
        t.appendChild(el('b', null, wearing.join(' + ')));
        t.appendChild(el('span', null, 'Tap to change. Buy more at Fortune\'s and Clementine\'s, then add them from your pocket.'));
        prev.appendChild(t);
        P.body.appendChild(prev);
        P.body.appendChild(el('p', 'muted', 'Outfits'));
        const g1 = el('div', 'grid');
        for (const o of S.wardrobe.outfits) g1.appendChild(slotBtn('out_' + o, 0, { sel: S.player.outfit === o, onClick: () => { S.player.outfit = o; Save.touch(); Sfx.ui('ok'); draw(); } }));
        P.body.appendChild(g1);
        const section = (label, key, list) => {
            P.body.appendChild(el('p', 'muted', label));
            const g2 = el('div', 'grid');
            const none = slotBtn('ui_present', 0, { sel: !S.player[key], onClick: () => { S.player[key] = null; Save.touch(); draw(); } });
            none.innerHTML = '<span style="font:600 14px Fredoka,sans-serif">None</span>';
            g2.appendChild(none);
            for (const a of list) g2.appendChild(slotBtn('acc_' + a, 0, { sel: S.player[key] === a, onClick: () => { S.player[key] = a; Save.touch(); Sfx.ui('ok'); draw(); } }));
            P.body.appendChild(g2);
        };
        section('Glasses & face', 'eyes', S.wardrobe.accs.filter(a => FACE_ACCS.has(a) && ITEMS['acc_' + a]));
        section('Hats & hair things', 'acc', S.wardrobe.accs.filter(a => !FACE_ACCS.has(a) && ITEMS['acc_' + a]));
    };
    draw();
}

/* ---------------------------------------------------------------- mail helpers + bottles */
const MAIL_KEEP = 250;
function sendMail(m) {
    S.mail.push({ id: S.mailSeq++, from: m.from, subject: m.subject, body: m.body, gift: m.gift || null, gifts: m.gifts || null, read: false, claimed: false,
        day: Clock.dayNum() + (m.delay || 0), ...(m.card ? { card: m.card } : {}), ...(m.paper != null ? { paper: m.paper } : {}) });
    // (the mailbox keeps the newest 250 letters that are read and have nothing left to take; unread ones and presents stay
    // however many there are: a year of letters otherwise grew the save by a hundred KB, QA, 29 October)
    const settled = S.mail.filter(x => x.read && (x.claimed || !mailGifts(x).length));
    if (settled.length > MAIL_KEEP) { const drop = new Set(settled.slice(0, settled.length - MAIL_KEEP)); S.mail = S.mail.filter(x => !drop.has(x)); }
    Save.touch();
}
async function openBottle() {
    const r = mulberry(hash32(S.seed + ':bottle:' + Clock.dayNum()));
    const notes = [
        'A note in a bottle, in handwriting that is very obviously Joe\'s:\n"I put this in a bottle. / The bottle is wet. / The sea is big. / I am not done yet." (It is signed "Joe (Poet).")',
        'A note in a bottle:\n"If found, please return to Wonton. (It is a recipe for NOT soup.)"',
        'A note in a bottle:\n"GOOD MORNING FROM THE OCEAN!! - Cuke" (It is dated 4:12 AM.)',
        'A note in a bottle, from Joe:\n"Dear fish. / Hello. / I am Joe. / Now you know." There is a drawing of a fish. The fish is wearing a hat.',
    ];
    await UI.say(null, rpick(notes, r), { letter: true });
    if (r() < 0.5) receive(rpick(['star_jar', 'framed_poem', 'shell_display', 'rose_vase'], r), 1);
    // once in a while the bottle itself is the treasure: a tiny ship inside
    if (!hasSpecial('shipbottle') && R() < 0.25) await grantSpecial('shipbottle', 'The bottle had a tiny ship inside, all this time!');
    else if (R() < 0.08) await maybeSpecial(1, ['poem', 'song', 'emote'], 'Something special was tucked under the note!');
}

/* ---------------------------------------------------------------- arcade stats */
function appArcade() {
    const P = UI.open({ title: 'Arcade', phone: true, back: backToPhone });
    const A = arc();
    const head = el('div', 'detail');
    head.appendChild(uiIcon('ui_ticket', 48));
    const t = el('div');
    t.appendChild(el('b', null, `${fmtNum(A.tickets)} ${plural(A.tickets, 'ticket')}`));
    t.appendChild(el('span', null, "Spend them at Chili's prize counter. Plushies, trophies, even the machines."));
    head.appendChild(t);
    P.body.appendChild(head);
    const L = el('div', 'list');
    L.style.marginTop = '10px';
    const row = (icon, name, note) => {
        const r = el('div', 'row');
        r.appendChild(iconCanvas(icon, 40));
        const tt = el('div', 't');
        tt.appendChild(el('b', null, name));
        tt.appendChild(el('span', null, note));
        r.appendChild(tt);
        L.appendChild(r);
    };
    for (const id of arcadeCabs()) {
        const plays = A.plays[id] || 0;
        row('f_cab_' + id, ARCADE_GAMES[id].name, plays ? `Best ${fmtNum(A.best[id] || 0)} \u00b7 played ${plays} ${plural(plays, 'time')}` : 'Not played yet. The first game is free.');
    }
    row('f_claw_machine', 'Claw machine', A.won ? `${A.won} ${plural(A.won, 'plushie')} won` : 'No plushies yet. It is all in the wrist.');
    row('f_trophy_rope', 'Jump rope', S.rope.best ? `Best: ${S.rope.best} jumps` : 'In the plaza on dry afternoons, 2:30 to 5:30 PM.');
    const sung = Object.keys(S.karaoke.best);
    row('f_trophy_karaoke', 'Karaoke', sung.length ? `${sung.length} ${plural(sung.length, 'poem')} sung \u00b7 ask DJ Wasabi for more` : "Ask DJ Wasabi at the club. You'll be singing Joe's poems.");
    P.body.appendChild(L);
    P.body.appendChild(el('p', 'muted', `The arcade is on the Boardwalk, open ${hoursText('arcade')}. Chili works the prize counter most afternoons; the rest of the time it runs on the honor system.`));
}

