/* ---- 6z_shops.js ---- */
/* The shops grow. Fortune's Goods and Clementine's each move up twice, once Sarah has played enough days and spent
   enough there: a letter, a day closed for the work, then a grand reopening with a bigger shop, more stock, a daily
   sale, longer hours and (at the top) a weekly treat. Only Sarah's shopping counts (the island is hers). */
const SHOP_UP = {
    shop: {
        // (the fourth, the Department Store, comes from the town's project: 6zgb_projects.js)
        owner: 'fortune', names: ["Fortune's Goods", "Fortune's Goods & More", "Fortune's Emporium", "Fortune's Department Store"],
        need: [null, { days: 7, spent: 20000 }, { days: 20, spent: 80000 }],
        hours: [[8, 22], [7, 23], [6, 24], [6, 24]], size: [[15, 7], [19, 7], [19, 9], [23, 9]],
        furn: [5, 7, 9, 12], walls: [1, 2, 2, 3], floors: [1, 2, 2, 3],
        perks: [null,
            ['two more stages of furniture every day', 'two wallpapers and two floors', "Fortune's pick: one piece 30% off every day", 'open 7 AM to 11 PM'],
            ['nine stages of furniture every day', 'a furniture set of the week, 15% off (at the counter)', 'Fortune pays 10% more for what you sell', 'open 6 AM to midnight'],
            ['twelve stages of furniture every day', 'three wallpapers and three floors', 'a bigger shop, all the way to the new back wall']],
    },
    boutique: {
        owner: 'clementine', names: ["Clementine's", "Clementine's Atelier", 'Maison Clementine'],
        need: [null, { days: 5, spent: 8000 }, { days: 15, spent: 30000 }],
        hours: [[9, 21], [9, 22], [8, 23]], size: [[11, 6], [13, 6], [15, 6]],
        outfits: [4, 6, 99], accs: [3, 5, 99],
        perks: [null,
            ['six outfits and five accessories every day', 'the look of the day: one outfit 25% off', 'open until 10 PM'],
            ['the whole collection, every outfit and accessory, every day', 'the look of the day, 25% off', 'open 8 AM to 11 PM']],
    },
};
const SALE_OFF = { shop: 0.3, boutique: 0.25 }, WEEK_OFF = 0.15;

function shopState(id) {
    if (!S.shops) S.shops = {};
    if (!S.shops[id]) S.shops[id] = { spent: 0, level: 1 };
    return S.shops[id];
}
function shopLevel(id) { return SHOP_UP[id] ? Math.max(1, Math.min(SHOP_UP[id].names.length, shopState(id).level || 1)) : 1; }
function shopName(id) { return SHOP_UP[id] ? SHOP_UP[id].names[shopLevel(id) - 1] : (ROOMS[id] && ROOMS[id].name) || id; }
/* closed today for the building work? */
function shopReno(id) { const s = SHOP_UP[id] && shopState(id); return !!(s && s.reno != null && s.reno === Clock.dayNum()); }
function roomHours(id) { return townHours(id, SHOP_UP[id] ? SHOP_UP[id].hours[shopLevel(id) - 1] : ROOM_HOURS[id]); }
function daysPlayed() { const d = Clock.dayNum(); return d - (S.startDay || d) + 1; }

/* what Sarah has spent at a shop counts toward its next level */
function noteSpend(id, n) {
    if (!SHOP_UP[id] || !(n > 0) || Online.visitor()) return;
    shopState(id).spent += Math.round(n);
}
/* which shop the player is buying in right now */
function shopHere() { const a = G.area && G.area.id; return SHOP_UP[a] ? a : null; }

/* today's price at a shop: the daily sale, the set of the week, or the grand-opening gift */
function shopPrice(id, shop) {
    const it = ITEMS[id];
    if (!it) return 0;
    let price = it.price || 100;
    if (!shop) return price;
    const st = shopStock();
    if (shopGift(shop) && giftable(shop, id)) return 0;
    if (shop === 'shop' && st.sale === id) price *= 1 - SALE_OFF.shop;
    else if (shop === 'shop' && st.week && st.week.ids.includes(id)) price *= 1 - WEEK_OFF;
    else if (shop === 'boutique' && st.look === id) price *= 1 - SALE_OFF.boutique;
    return Math.round(price / 10) * 10;
}
function priceNote(id, shop) {
    if (!shop) return '';
    const st = shopStock();
    if (shopGift(shop) && giftable(shop, id)) return ' Free today: your grand-opening gift!';
    if (shop === 'shop' && st.sale === id) return " Fortune's pick: 30% off today!";
    if (shop === 'shop' && st.week && st.week.ids.includes(id)) return ` Set of the week: 15% off!`;
    if (shop === 'boutique' && st.look === id) return ' The look of the day: 25% off!';
    return '';
}
/* the grand-opening gift: one thing on the house, the day the shop reopens */
function shopGift(shop) { const s = SHOP_UP[shop] && shopState(shop); return !!(s && s.gift === Clock.dayNum() && !Online.visitor()); }
function giftable(shop, id) {
    const t = ITEMS[id] && ITEMS[id].type;
    return shop === 'shop' ? ['furniture', 'wall', 'floor'].includes(t) : t === 'outfit' || t === 'acc';
}
/* after paying: count it, and use up the gift if that's what it was */
function shopPaid(shop, id, price) {
    if (!shop) return;
    if (price === 0 && shopGift(shop) && giftable(shop, id)) { shopState(shop).gift = null; UI.toast('Grand-opening gift: on the house!', ITEMS[id].icon); }
    noteSpend(shop, price);
}
/* Fortune's Emporium: one furniture set a week */
function weekSet() {
    if (shopLevel('shop') < 3) return null;
    const week = Math.floor(Clock.dayNum() / 7), r = mulberry(hash32(S.seed + ':weekset:' + week));
    const ok = id => FURN[id].price > 0 && !FURN[id].fixture && !FURN[id].prize && id !== 'kitchenette';
    const sets = Object.keys(SET_NAMES).filter(s => Object.keys(FURN).filter(id => ok(id) && FURN[id].sets[0] === s).length >= 4);
    const set = rpick(sets, r);
    return set ? { set, ids: Object.keys(FURN).filter(id => ok(id) && FURN[id].sets[0] === set) } : null;
}
function sellBonus() { return shopLevel('shop') >= 3 ? 1.1 : 1; }

/* a new day: does a shop move up? (the letter comes the day before the work) */
function shopsTick() {
    if (Online.visitor()) return;
    const day = Clock.dayNum();
    for (const id of Object.keys(SHOP_UP)) {
        const U = SHOP_UP[id], s = shopState(id);
        if (s.reno != null && day > s.reno) {
            s.level = Math.min(3, (s.level || 1) + 1); s.reno = null; s.grand = s.level; s.gift = day;
            townLog(`${shopName(id)} reopens, bigger.`);
            sendMail({ from: U.owner, subject: `${U.names[s.level - 1]} is OPEN`, body: REOPEN_MAIL[id](s.level) });
            continue;
        }
        const lv = s.level || 1, need = U.need[lv];
        if (s.reno != null || !need || daysPlayed() < need.days || s.spent < need.spent) continue;
        s.reno = day + 1;
        sendMail({ from: U.owner, subject: RENO_MAIL[id].subject, body: RENO_MAIL[id].body(U.names[lv]) });
    }
}
const RENO_MAIL = {
    shop: { subject: 'Big news! (Shop closed tomorrow)', body: next => `Hello hello!\nBusiness is BOOMING, and most of the boom is you. So: the shop is growing!\nGinger is coming tomorrow with a lot of wood and a lot of opinions, so Fortune's Goods is closed all day tomorrow.\nThe day after, come see ${next}. There might be a gift. There will definitely be a gift.\n- Fortune\n\nP.S. Today's cookie said "expand." I listened.` },
    boutique: { subject: 'Darling. Closed tomorrow.', body: next => `Darling,\nYou have been shopping like a woman with a vision, and the shop simply can't keep up. It must become MORE.\nThe boutique is closed tomorrow for a little transformation. Ginger is doing the shelves. I am doing the vision.\nThe day after: ${next}. Come early. Come dressed.\n- Clementine` },
};
const REOPEN_MAIL = {
    shop: lv => `Hello hello!\nThe hammering has stopped! Welcome to ${SHOP_UP.shop.names[lv - 1]}!\nNew today:\n${SHOP_UP.shop.perks[lv - 1].map(p => '- ' + p).join('\n')}\n\nCome by today: your first piece of furniture is on the house. A grand-opening gift. From me. And the cookie.\n- Fortune`,
    boutique: lv => `Darling,\nIt's done, and it's divine. Welcome to ${SHOP_UP.boutique.names[lv - 1]}.\nNew:\n${SHOP_UP.boutique.perks[lv - 1].map(p => '- ' + p).join('\n')}\n\nCome in today and pick one piece, any piece. On the house. A grand-opening gift, because you made this happen.\n- Clementine`,
};

/* the rooms grow with the shop (rooms are rebuilt every day, so a new level shows the next morning) */
for (const id of Object.keys(SHOP_UP)) {
    ROOMS[id].resize = R => { const [w, h] = SHOP_UP[id].size[shopLevel(id) - 1]; R.w = w; R.h = h; R.name = shopName(id); };
}
/* the furniture stages in Fortune's shop, by level (3x2 each) */
function shopSlots() {
    const lv = shopLevel('shop');
    if (lv === 1) return SHOP_SLOTS;
    const s = [[4, 0], [8, 0], [12, 0], [16, 0], [4, 3], [8, 3], [16, 3]];
    return lv === 2 ? s : lv === 3 ? s.concat([[4, 6], [14, 6]]) : s.concat([[4, 6], [14, 6], [20, 0], [20, 3], [8, 6]]);
}
/* where the floor-and-wallpaper stage goes, and the plant in the corner */
function shopCorner() { const lv = shopLevel('shop'); return { floor: [12, 3], plant: lv === 1 ? [14, 6] : lv === 2 ? [18, 6] : lv === 3 ? [18, 8] : [22, 8] }; }
function boutiqueSpots() {
    const lv = shopLevel('boutique'), s = [[1, 1], [3, 1], [1, 4], [3, 4]];
    return lv === 1 ? s : lv === 2 ? s.concat([[12, 1], [12, 4]]) : s.concat([[12, 1], [12, 4], [14, 1], [14, 4]]);
}

/* the first visit after a shop moves up: the grand reopening */
Bus.on('enter', async id => {
    const s = SHOP_UP[id] && shopState(id);
    if (!s || !s.grand || Online.visitor()) return;
    const U = SHOP_UP[id], lv = s.grand, n = NPCs.get(U.owner);
    s.grand = null;
    Save.touch();
    await waitFrames(30);
    const sp = n && !n.sleeping && n.area === id ? U.owner : null;
    if (n) { n.emote = 'sparkle'; n.emoteT = 120; }
    Sfx.play('fanfare');
    G.player.pose = 'cheer'; G.player.poseT = 40;
    G.busy++;
    try {
        const lines = id === 'shop'
            ? [`WELCOME to ${U.names[lv - 1]}! Look at it! LOOK AT IT!`, `New: ${U.perks[lv - 1].join('; ')}.`, shopGift(id) ? 'And your grand-opening gift: the first piece of furniture you pick today is free. Any stage. Go!' : 'Thank you for shopping here. Really. The cookie and I are very grateful.']
            : [`Darling. Welcome to ${U.names[lv - 1]}. Breathe it in.`, `New: ${U.perks[lv - 1].join('; ')}.`, shopGift(id) ? 'And because you made this happen: pick one piece today, any piece, on the house.' : 'You made this happen, you know. Your taste did.'];
        await UI.say(sp, sp ? lines : [`The shop has been renovated: ${U.names[lv - 1]}! A sign by the counter lists what's new: ${U.perks[lv - 1].join('; ')}.`]);
    } finally { G.busy--; }
});

/* the shopkeepers hint at what's coming */
function shopTalk(id) {
    const U = SHOP_UP[id], s = shopState(id), need = U.need[s.level || 1];
    if (!need || s.reno != null) return null;
    const k = Math.min(s.spent / need.spent, daysPlayed() / need.days);
    if (k < 0.5) return null;
    if (id === 'shop') return k < 0.85 ? "Business is good. Really good. I've started sketching a bigger shop on the back of my fortunes." : "Almost there! A little more business and I'm calling Ginger. The shop's going to grow!";
    return k < 0.85 ? "Darling, the racks are bursting. If this keeps up, the shop will simply have to become more." : 'Very close now, darling. One more good week of shopping and I am redecorating the whole building.';
}
