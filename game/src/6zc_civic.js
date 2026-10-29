/* ---- 6zc_civic.js ---- */
/* The insides of the civic buildings on the square, built ahead of their features (docs/ROADMAP.md, "Late in
   development"): the Town Hall (Maki at the front desk), the Bank (Coco) and the Post Office (Cece); in their keeper's off
   hours the counters wait with a bell. Each counter opens the building's screens (6zd_civic_screens.js),
   every one drawn with sample numbers and able to show each way it can go. Only on beta for now (CIVIC_PREVIEW: the beta
   host, or localStorage sc-civic 1 or 0 anywhere); elsewhere their doors are still the signs in 24b_civic.js. */
const CIVIC_PREVIEW = (() => { const v = lsGet('sc-civic'); return v === '1' ? true : v === '0' ? false : /^beta\./.test((window.location && location.hostname) || ''); })();
function civicOpen(id) { return CIVIC_PREVIEW && !!ROOMS[id] && !!CIVIC_SIGNS[id]; }

if (CIVIC_PREVIEW) {
    Object.assign(ROOM_HOURS, { townhall: [8, 20], postoffice: [7, 21], bank: [9, 18] });
    ROOMS.townhall = { w: 15, h: 7, wall: 'wall_gallery', floor: 'floor_marble', music: 'museum', name: 'Town Hall', build: a => buildTownHall(a),
        closedSign: 'TOWN HALL. Open {hours:townhall}. The Council has gone home to rest. The Council is broccoli.' };
    ROOMS.postoffice = { w: 13, h: 6, wall: 'wall_cream', floor: 'floor_checker', music: 'shop', name: 'Post Office', build: a => buildPostOffice(a),
        closedSign: 'POST OFFICE. Open {hours:postoffice}. Closed now. Your letters still come to your mailbox overnight.' };
    ROOMS.bank = { w: 13, h: 6, wall: 'wall_stone', floor: 'floor_marble', music: 'museum', name: 'Bank of the Island', build: a => buildBank(a),
        closedSign: 'BANK OF THE ISLAND. Open {hours:bank}. Closed now. The vault is asleep. It snores a little.' };
    // the keepers (David, 28 October: Maki at the Town Hall, Coco at the Bank, Cece at the Post Office): behind the desk or
    // the counter in their hours, which their day follows (work), with the building's screens in their talk menu
    Object.assign(ROOMS.townhall, { staff: 'maki', staffAt: [7, 0], staffStand: [7, 2] });
    Object.assign(ROOMS.bank, { staff: 'coco', staffAt: [6, 0], staffStand: [6, 2] });
    Object.assign(ROOMS.postoffice, { staff: 'cece', staffAt: [6, 0], staffStand: [6, 2] });
    NPC_DEFS.maki.work = [['townhall', 9, 12], ['townhall', 13, 17]];
    NPC_DEFS.coco.work = [['bank', 9.5, 12.5], ['bank', 13.5, 17]];
    NPC_DEFS.cece.work = [['postoffice', 8.5, 12], ['postoffice', 13, 16.5]];
    WORK_MENUS.maki = { room: 'townhall', label: 'Town Hall business', fn: () => civicMenu('townhall') };
    WORK_MENUS.coco = { room: 'bank', label: 'Banking', fn: () => civicMenu('bank') };
    WORK_MENUS.cece = { room: 'postoffice', label: 'Post Office business', fn: () => civicMenu('postoffice') };
}
const CIVIC_KEEPER = { townhall: 'maki', bank: 'coco', postoffice: 'cece' };
const KEEPER_HELLO = {
    maki: ['Town Hall. How can I help? Please take a number. There is only one number. It is yours.', 'Good timing. I just finished putting the records in order. Again.',
        'Everything is filed, stamped and straight. What can I do for you?'],
    coco: ['Welcome to the Bank of the Island! Did you hear about... no. Banking first. Gossip after.', 'Hi hi! Deposits, withdrawals, secrets? I mean... savings!',
        'Oh good, a customer! I have so much to tell you. But first: money stuff!'],
    cece: ['Oh! Hello! Sorry, the stamps are a little sticky. I may have been baking. What can I send for you?', 'Post Office! Sorry. I mean, hi. Letters? Postcards? I can weigh things.',
        'Welcome! Your mail is very important to us. Sorry, that sounded official. It IS important, though.'],
};
/* the keeper at their counter now, if they are */
function civicKeeper(id) {
    const n = CIVIC_KEEPER[id] && NPCs.get(CIVIC_KEEPER[id]);
    return n && !n.sleeping && n.area === id && ROOMS[id] && ROOMS[id].staff === n.id ? n : null;
}

/* the Town Hall: the front desk at the back with the Council behind it, the island's flags either side, the rope for the
   line, benches to wait on, the records on a shelf */
function buildTownHall(a) {
    const flag = townFlagSprite();
    const items = layoutItems([...(flag ? [['island_flag', 9, 'wall']] : []),
        ['window_wall', 0, 'wall'], ['plaque_bronze', 3, 'wall'], ['clock_wall', 7, 'wall'], ['plaque_silver', 11, 'wall'], ['window_wall', 13, 'wall'],
        ['disp_flag', 2, 0], ['museum_desk', 6, 1], ['nameplate', 6, 1], ['paper_pile', 8, 1], ['disp_flag', 11, 0],
        ['shelf_book', 0, 0], ['shelf_book', 13, 0], ['velvet_rope', 4, 3], ['velvet_rope', 9, 3],
        ['museum_bench', 0, 4], ['museum_bench', 13, 4], ['plant_monstera', 0, 2], ['plant_monstera', 14, 2]]);
    items.forEach(it => { if (it.id === 'museum_desk') it.use = () => civicCounter('townhall'); else if (it.id === 'shelf_book') it.use = () => civicScreen('history'); });
    a.items = items;
    placeFurniture(a, items);
    // (the Council isn't kept at the desk any more, David, 28 October: they come by Sarah's house when she asks them to
    // judge it, 53_council.js, and here only the day after her statue goes up, to congratulate her: Sir Floret on one side,
    // Dame Stalk and Little Sprout on the other; behind the desk they'd be hidden, it's taller than a head of broccoli)
    if (typeof statueCongratsDue === 'function' && statueCongratsDue()) [['floret', 6], ['stalk', 10], ['sprout', 11]].forEach(([id, x]) => a.add({ kind: 'judge', frame: `${id}_0`, x: x * TILE + TILE / 2, y: 4 * TILE - 2, civic: true }));
}
/* the Post Office: the counter with its register, mail sacks waiting to go out, parcels, the sorting shelf, the map of
   the boats' routes */
function buildPostOffice(a) {
    const items = layoutItems([
        ['window_wall', 0, 'wall'], ['shelf_wall', 2, 'wall'], ['clock_wall', 5, 'wall'], ['lh_map', 7, 'wall'], ['window_wall', 11, 'wall'],
        ['counter_shop', 5, 1], ['register', 5, 1], ['paper_pile', 7, 1], ['feed_sacks', 0, 1], ['lh_trunk', 9, 0], ['old_trunk', 10, 0],
        ['shelf_book', 11, 1], ['museum_bench', 0, 4], ['plant_monstera', 12, 4], ['sack_cart', 3, 1]]);
    items.forEach(it => { if (it.id === 'counter_shop') it.use = () => civicCounter('postoffice'); });
    a.items = items;
    placeFurniture(a, items);
}
/* the Bank: the teller's counter behind the rope, the vault (a sea chest, till its door is made), a bench, plants */
function buildBank(a) {
    const items = layoutItems([
        ['window_wall', 0, 'wall'], ['clock_wall', 3, 'wall'], ['plaque_silver', 6, 'wall'], ['window_wall', 11, 'wall'],
        ['counter_boutique', 5, 1], ['register', 6, 1], ['velvet_rope', 3, 3], ['velvet_rope', 8, 3], ['bank_chest', 11, 0], ['bank_trunk', 12, 0],
        ['plant_monstera', 0, 0], ['lamp_floor', 2, 0], ['museum_bench', 0, 4], ['plant_monstera', 12, 4]]);
    items.forEach(it => { if (it.id === 'counter_boutique') it.use = () => civicCounter('bank'); else if (it.id === 'bank_chest' || it.id === 'bank_trunk') it.use = () => civicScreen('vault'); });
    a.items = items;
    placeFurniture(a, items);
}

/* what each building's counter offers */
const CIVIC_MENUS = {
    townhall: ['zip', 'ordinance', 'flag', 'census', 'history', 'rename', 'residents', 'holidays', 'jobs', 'backups'],
    postoffice: ['gazette', 'archive', 'letter', 'postcards', 'tracking', 'mailbox'],
    bank: ['savings', 'stocks', 'loan', 'goals', 'statement', 'vault'],
};
async function civicCounter(id) {
    if (id === 'townhall' && statueCongratsDue()) {
        // (the day after Sarah's statue goes up the Council comes by: well done, and a new one whenever she likes, 6zgc_statue.js)
        if (await statueCongrats()) { UI.hideDialog(); civicScreen('statue', null, () => civicMenu('townhall')); return; }
    } else if (civicKeeper(id)) {
        const k = civicKeeper(id);
        k.emote = 'note'; k.emoteT = 40;
        await UI.say(k.id, voiced(k.id, rpick(KEEPER_HELLO[k.id])));
    } else {
        // (the keeper's off: the screens on the honor system, as at the shops after hours)
        await UI.say(null, id === 'townhall' ? 'The front desk has a little bell and a card in very neat letters: "MAKI IS OUT. Back in office hours. Help yourself, then put everything back where it was. Exactly where it was."'
            : id === 'bank' ? 'The teller\'s window has a little bell and a card: "Coco is on a break!! The screens still work. Tell me EVERYTHING when I\'m back!!"'
                : 'There is a bell on the counter and a card: "Sorry! Cece is out. Sorry. The forms are very nice, though. Help yourself. Sorry."');
    }
    UI.hideDialog();
    civicMenu(id);
}
function civicMenu(id) {
    const P = UI.open({ title: ROOMS[id] ? ROOMS[id].name : 'The counter', foot: true });
    P.body.appendChild(el('p', 'muted', 'The ones marked "preview" aren\'t open yet: they show sample numbers. In every screen, the buttons at the bottom show every way it can go.'));
    const list = el('div', 'list');
    for (const s of CIVIC_MENUS[id]) {
        const S_ = CIVIC_SCREENS[s];
        const row = el('button', 'row');
        row.type = 'button';
        row.appendChild(uiIcon(S_.icon || 'ui_present', 40));
        const t = el('div', 't');
        t.appendChild(el('b', null, S_.title));
        t.appendChild(el('span', null, S_.blurb));
        row.appendChild(t);
        if (!CIVIC_LIVE[s]) row.appendChild(el('span', 'cv-pill', 'preview'));
        row.addEventListener('click', () => { Sfx.ui('tick'); civicScreen(s, null, () => civicMenu(id)); });
        list.appendChild(row);
    }
    P.body.appendChild(list);
    P.foot.appendChild(el('span', 'grow', ''));
    P.foot.appendChild(btn('Done', 'alt', () => UI.close()));
}
