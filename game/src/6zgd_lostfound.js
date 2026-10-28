/* ---- 6zgd_lostfound.js ---- */
/* When the day turns over at 5 AM (David's note of 27 October, late): what renews and was left lying out on the island
   (fruit, fish, shells, flowers, wood and the like) is gone by morning, the island has it back; anything that matters
   (furniture, clothes, tools, keepsakes, a dish she cooked...) is picked up on the Council's morning walk and kept at
   the Town Hall's Lost and Found, where Sarah takes it back. Only what Sarah dropped or a tree let fall: the festivals'
   and storylines' things keep to their own rules, and so do quest things. Kept as S.lostFound { id: how many }; while
   the Town Hall's rooms aren't open (CIVIC_PREVIEW), it goes home to storage instead. */
const LOST_RENEWS = new Set(['fruit', 'fish', 'shell', 'veg', 'flower', 'material', 'snack']);
const LOST_LEAVE = new Set(['special', 'quest', 'lost']);
function lostFound() { if (!S.lostFound) S.lostFound = {}; return S.lostFound; }
function lostFoundTick() {
    if (!S || !S.drops || Online.visitor()) return;
    const keep = [], gone = new Set(), found = {};
    let renewed = 0;
    for (const d of S.drops) {
        const it = ITEMS[d.id], plain = Object.keys(d).every(k => k === 'id' || k === 'x' || k === 'y' || k === 'area');
        if (!plain || !it || d.area !== 'island' || LOST_LEAVE.has(it.type)) { keep.push(d); continue; }
        gone.add(d);
        if (LOST_RENEWS.has(it.type)) renewed++;
        else found[d.id] = (found[d.id] || 0) + 1;
    }
    if (!gone.size) return;
    S.drops = keep;
    // (and off the island now, if Sarah's out there as the day turns)
    for (const a of Object.values(G.areas || {})) if (a && a.ents) for (const e of a.ents.slice()) if (e.dropRef && gone.has(e.dropRef)) a.remove(e);
    const ids = Object.keys(found);
    if (ids.length) {
        const list = ids.map(id => '- ' + (found[id] > 1 ? `${found[id]} × ` : '') + itemName(id)).join('\n');
        if (CIVIC_PREVIEW) for (const id of ids) lostFound()[id] = (lostFound()[id] || 0) + found[id];
        else for (const id of ids) toStorage(id, found[id]);
        sendMail({ from: 'floret', subject: 'Found on the morning walk', body: `Dear ${S.playerName || 'Sarah'},\nThe Council walks the island every morning at five. This morning we found these left out:\n${list}\n` +
            (CIVIC_PREVIEW ? 'They are safe at the Town Hall. Ask at the desk for the Lost and Found.' : 'Dame Stalk carried them to your house. They are in your storage.') +
            (renewed ? '\nThe fruit and shells and such, the island had back. That is how islands are.' : '') + '\n- Sir Floret, for the Council' });
    }
    Save.touch();
}

/* ---------------------------------------------------------------- the Town Hall's screen */
CIVIC_SCREENS.lostfound = { title: 'Lost and Found', icon: 'ui_present', blurb: 'What was left out on the island overnight, kept safe', states: ['Works', 'Empty'],
    draw(b, st) {
        if (st === 'Empty') { CV.empty(b, 'Nothing here. Everything on the island is where it belongs.', 'ui_present'); return; }
        CV.note(b, 'The Council walks the island at five every morning. Fruit, fish, shells and flowers left lying about go back to the island; anything else is kept here.');
        const l = CV.list(b);
        for (const [id, n] of [['sofa_pink', 1], ['axe', 1], ['nigiri', 2]]) CV.row(l, itemIcon(id), itemName(id), n > 1 ? `${n} of them` : 'Found this morning', el('span', 'cv-pill', 'Sample'));
    } };
CIVIC_MENUS.townhall.splice(CIVIC_MENUS.townhall.indexOf('residents') + 1, 0, 'lostfound');
CIVIC_LIVE.lostfound = {
    draw(b, f, redraw) {
        const lf = lostFound(), ids = Object.keys(lf).filter(id => lf[id] > 0 && ITEMS[id]);
        if (!ids.length) { CV.empty(b, 'Nothing here. Everything on the island is where it belongs.', 'ui_present'); return; }
        CV.note(b, 'Found on the Council\'s morning walks. Take back whatever you like: it goes in your pockets, or home to storage when they\'re full.');
        const take = (id) => { const n = lf[id]; delete lf[id]; receive(id, n); Save.touch(); Sfx.play('pick'); redraw(); };
        const l = CV.list(b);
        for (const id of ids) CV.row(l, itemIcon(id), itemName(id), lf[id] > 1 ? `${lf[id]} of them` : (ITEM_TYPES[ITEMS[id].type] || ''), el('span', 'cv-pill ok', 'Take'), () => take(id));
        if (ids.length > 1) f.appendChild(btn('Take everything', 'green', () => { for (const id of ids) { receive(id, lf[id], true); delete lf[id]; } UI.toast('Took everything from the Lost and Found.', 'ui_present'); Save.touch(); redraw(); }));
    },
};
