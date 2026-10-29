/* ---- 64_restaurant.js ---- */
/* Mac's: the island restaurant. A short menu that changes every day (eat in or take it to go), a dessert from
   Cece, and neighbors dropping by for a meal. Eat with a neighbor and they'll chat with you. */
ROOMS.restaurant = { w: 13, h: 7, wall: 'wall_diner', floor: 'floor_diner', music: 'restaurant', name: "Mac's", staff: 'mac',
    staffAt: [3, 0], guest: [6, 5, 1], build: a => buildRestaurantRoom(a),
    guestSpots: [[6, 1, 'right'], [9, 1, 'left'], [6, 4, 'right'], [9, 4, 'left'], [0, 4, 'right'], [3, 4, 'left']],
    closedSign: "MAC'S. Open {hours:restaurant}. Breakfast, lunch and dinner. \"Come hungry. Leave full. Come back hungry.\"" };
/* which table each seat faces (floor coords of the table tile in front of it) */
const SEAT_TABLE = [[7, 1], [8, 1], [7, 4], [8, 4], [1, 4], [2, 4]];
const MAC_SPECIALS = ['mac_cheese', 'tomato_soup'];
const CECE_DESSERTS = ['cheesecake', 'cherry_cheesecake', 'choc_cheesecake', 'gingerbread', 'creme_brulee', 'mango_sticky', 'lychee_ice'];

function buildRestaurantRoom(a) {
    const items = layoutItems([
        ['sign_restaurant', 0, 'wall'], ['menu_board', 2, 'wall'], ['window_wall', 7, 'wall'], ['window_wall', 9, 'wall'], ['clock_wall', 11, 'wall'],
        ['stove_pro', 0, 0], ['counter_diner', 2, 1], ['cheesecake_case', 11, 2], ['cake_stand', 11, 2],
        ['dining_table', 7, 1], ['table_setting', 7, 1], ['table_setting', 8, 1],
        ['dining_table', 7, 4], ['table_setting', 7, 4], ['table_setting', 8, 4],
        ['dining_table', 1, 4], ['table_setting', 1, 4], ['table_setting', 2, 4],
        ['plant_monstera', 12, 0], ['plant_monstera', 12, 6]]);
    const use = {
        counter_diner: 'counter',
        menu_board: () => readMenuBoard(),
        stove_pro: () => UI.say(null, rpick(["Something is bubbling. It smells like butter and happiness.", 'A big pot of cheese sauce. It is the size of a hot tub. Wonton would have opinions.'])),
        cheesecake_case: () => UI.say(null, `Today's dessert from Cece: ${itemName(todaysMenu().dessert).toLowerCase()}. A little card says "sorry if it's not perfect!" It's perfect.`),
    };
    items.forEach(it => { if (use[it.id]) it.use = use[it.id]; });
    a.items = items;
    placeFurniture(a, items);
    // chairs at the seats (you can walk around them; neighbors sit in them), and whatever's being eaten on the table; in
    // the new look each is a stool, so the round folks fit (David, 27 October)
    ROOMS.restaurant.guestSpots.forEach(([fx, fy, face], i) => {
        const [x, y] = toArea(fx, fy);
        const ch = a.add({ kind: 'deco', x: (x + 0.5) * TILE, y: (y + 1) * TILE - 3, flip: face === 'left' });
        ch.sy = (y + 0.5) * TILE + 3;
        ch.draw = ctx => spr(ctx, 'f_dining_chair', ch.x, ch.y);
        ch.look3d = { model: 'furn_diner_stool', face };
        const [tx, ty] = toArea(...SEAT_TABLE[i]);
        const plate = a.add({ kind: 'deco', x: (tx + 0.5) * TILE, y: (ty + 1) * TILE - 13 });
        plate.sy = (ty + 1) * TILE;
        plate.look3d = { dish: i, tx, ty };
        plate.draw = ctx => {
            const dish = seatDish(i);
            if (dish) spr(ctx, ITEMS[dish].icon, plate.x, plate.y);
        };
    });
}
/* someone (a neighbor, or Sarah) is eating at seat i: what's on their plate */
function seatDish(i) {
    if (G.eatSeat === i) return G.eatDish;
    const n = NPCs.list.find(o => !o.sleeping && o.area === 'restaurant' && o.want && o.want.slot === i && !o.path);
    if (!n) return null;
    const m = todaysMenu();
    return m.dishes[hash32(n.id + ':' + Clock.dayNum()) % m.dishes.length];
}
function macVoice() { const m = NPCs.get('mac'); return m && !m.sleeping && m.area === 'restaurant' ? 'mac' : null; }

/* the menu changes every day: one of Mac's specials, three island dishes, one of Cece's desserts */
function todaysMenu() {
    const day = Clock.dayNum();
    if (todaysMenu.c && todaysMenu.c.day === day) return todaysMenu.c;
    const r = mulberry(hash32(S.seed + ':menu:' + day));
    const special = G.events && G.events.has('soupday') ? 'tomato_soup' : G.events && G.events.has('macday') ? 'mac_cheese' : MAC_SPECIALS[day % MAC_SPECIALS.length];
    const pool = RECIPES.map(x => x.id).filter(id => !MAC_SPECIALS.includes(id) && !CECE_DESSERTS.includes(id) && ITEMS[id] && farOk(id));
    const mains = shuffled(pool, r).slice(0, 3);
    const dessert = CECE_DESSERTS[Math.floor(r() * CECE_DESSERTS.length)];
    todaysMenu.c = { day, special, dishes: [special].concat(mains, [dessert]), dessert };
    return todaysMenu.c;
}
function menuPrice(id) {
    if (G.events && G.events.has('macday') && id === 'mac_cheese') return 0;
    const p = Math.max(150, Math.round((ITEMS[id].price || 400) * 1.2 / 10) * 10);
    return G.events && G.events.has('feastday') ? Math.round(p / 20) * 10 : p;
}
async function readMenuBoard() {
    const m = todaysMenu();
    await UI.say(null, [`TODAY AT MAC'S. Special: ${itemName(m.special)} (${fmtNum(menuPrice(m.special))}).`,
        `Also: ${m.dishes.slice(1, 4).map(id => `${itemName(id)} (${fmtNum(menuPrice(id))})`).join(', ')}.`,
        `Dessert from Cece: ${itemName(m.dessert)} (${fmtNum(menuPrice(m.dessert))}). Eat in or take it to go!`]);
}

/* ordering */
WORK_MENUS.mac = { room: 'restaurant', label: "What's cooking?", fn: () => orderFood() };
async function orderFood() {
    UI.hideDialog();
    const id = await pickDish();
    if (!id) { await UI.say(macVoice(), rpick(['No rush! The kitchen is always warm.', "Take your time. I'll be here. Stirring."])); return; }
    const price = menuPrice(id), nm = itemName(id).toLowerCase(), mac = macVoice();
    const k = await UI.ask(mac, mac ? `One ${nm}! Eating here, or to go?` : `A wrapped-up ${nm} from the honor fridge. Eat here, or take it to go?`,
        [`Eat here (${fmtNum(price)})`, `To go (${fmtNum(price)})`, 'Never mind']);
    if (k === 2 || k < 0) return;
    if (S.money < price) { Sfx.ui('nope'); await UI.say(mac, mac ? "Ah, you're a little short. Tell you what, come back after some fishing. The kitchen will wait." : "Sarah doesn't have quite enough sand dollars for the honor jar."); return; }
    if (k === 1) {
        addMoney(-price, true, 'Food');
        receive(id, 1);
        markFresh(id, 1);
        Sfx.play('buy');
        await UI.say(mac, mac ? rpick(["Wrapped up nice and warm! Give it to someone you love. Or eat it. Also love.", 'To go! Careful, it is hot. Everything I make is hot.'])
            : 'Sarah drops the sand dollars in the honor jar. The jar seems pleased.');
        return;
    }
    addMoney(-price, true, 'Food');
    Sfx.play('buy');
    const guest = await maybeInvite();
    await eatHere(id, guest);
}
function pickDish() {
    return new Promise(res => {
        let done = false;
        const finish = v => { if (!done) { done = true; res(v); } };
        const m = todaysMenu();
        const P = UI.open({ title: "Today at Mac's", onClose: () => finish(null) });
        P.body.appendChild(el('p', 'muted', 'A fresh menu each day. Eat here with whoever\'s around, invite a friend, or take your meal to go.'));
        const list = el('div', 'list');
        m.dishes.forEach((id, i) => {
            const row = el('button', 'row');
            row.type = 'button';
            row.appendChild(iconCanvas(ITEMS[id].icon, 40));
            const t = el('div', 't');
            t.appendChild(el('b', null, itemName(id)));
            t.appendChild(el('span', null, i === 0 ? "Mac's special" : id === m.dessert ? "Cece's dessert of the day" : (ITEMS[id].spicy ? 'Spicy! ' : '') + 'Island classic'));
            row.appendChild(t);
            row.appendChild(el('span', 'price', menuPrice(id) ? fmtNum(menuPrice(id)) : 'Free!'));
            row.addEventListener('click', () => { finish(id); UI.close(true); });
            list.appendChild(row);
        });
        P.body.appendChild(list);
    });
}
/* Sarah sits down to eat; if a neighbor is eating here too (or she invited one), they eat together */
async function eatHere(id, guestId) {
    const a = G.area, p = G.player, R0 = ROOMS.restaurant;
    void a;
    const taken = new Set(NPCs.list.filter(n => !n.sleeping && n.area === 'restaurant' && n.want && n.want.slot != null && n.id !== guestId).map(n => n.want.slot));
    let seat = -1, pair = -1;
    if (guestId) for (let i = 0; i + 1 < R0.guestSpots.length; i += 2) if (!taken.has(i) && !taken.has(i + 1)) { seat = i; pair = i + 1; break; }
    if (seat < 0) seat = R0.guestSpots.findIndex((_, i) => !taken.has(i));
    if (seat < 0) seat = 0;
    const [fx, fy, face] = R0.guestSpots[seat];
    const [x, y] = toArea(fx, fy);
    UI.hideDialog();
    await fadeTo(async () => {
        p.x = (x + 0.5) * TILE; p.y = (y + 0.5) * TILE + 4; p.dir = face; G.eatSeat = seat; G.eatDish = id;
        if (guestId) seatGuest(guestId, pair);
    });
    const guest = guestId ? NPCs.get(guestId) : null;
    const buddy = guest && guest.area === 'restaurant' ? guest : NPCs.list.find(n => !n.sleeping && n.area === 'restaurant' && n.want && n.want.slot != null && n.id !== 'mac' && TALK[n.id]);
    const nm = itemName(id).toLowerCase();
    p.pose = 'cheer'; p.poseT = 30;
    if (buddy && buddy === guest) {
        if (!buddy.def.human) { buddy.hop = 3; }
        await UI.say(buddy.id, voiced(buddy.id, fillText(rpick(INVITE_DINE[buddy.id] || INVITE_DINE._))));
    }
    await UI.say(null, rpick([`Sarah eats the ${nm}. It is so good she has to close her eyes for a second.`, `The ${nm} is perfect. Mac watches from the kitchen, beaming.`,
        `Sarah takes a bite of the ${nm}. Then another. Then it is gone. Where did it go? (Sarah.)`]));
    S.stats.meals = (S.stats.meals || 0) + 1;
    foodBonus(ITEMS[id], true);
    if (buddy) {
        const r = rel(buddy.id), day = Clock.dayNum();
        buddy.emote = 'heart'; buddy.emoteT = 70;
        await UI.say(buddy.id, voiced(buddy.id, rpick(DINE_TALK[buddy.id] || DINE_TALK._)));
        let pts = 0;
        if (r.met && r.dineDay !== day) { r.dineDay = day; pts += 4; }
        if (buddy === guest && r.inviteDay !== day) { r.inviteDay = day; pts += 3; }
        if (pts && buddy.id !== 'joe') { const up = addPts(buddy.id, pts); if (up) await heartUp(buddy, up); }
    } else if (macVoice()) await UI.say('mac', rpick(["How is it? Don't answer. I can see your face. That's the face I cook for.", "Clean plate! That's the highest compliment in this building."]));
    await fadeTo(async () => { G.eatSeat = null; G.eatDish = null; const [dx, dy] = toArea(6, 5); p.x = (dx + 0.5) * TILE; p.y = (dy + 0.5) * TILE + 4; p.dir = 'down'; });
    Save.touch();
}
/* ---------------------------------------------------------------- inviting a friend */
const INVITE_YES = {
    _: ['On my way! Save me a seat!', "Ooh, Mac's? Yes! Be right there!", 'Give me two minutes. Order something good!'],
    joe: ["For you? Always. I'm already walking. I'm practically running. Okay, I'm running.", "Dinner? With you? At the same table? ...Cool. Cool cool cool. Totally normal. On my way!"],
    maki: ['I will be there in exactly four minutes.', 'Yes. Please save me a chair that doesn\'t wobble.'],
    kai: ['Dude, YES. Paddling over. Walking. Walking over.'], basil: ["I'd love that. I'll bring an appetite. And a napkin."],
    wonton: ['Yes! As long as nobody orders soup near me.'], chili: ["I'm there. Tell Mac to warm up the hot sauce."],
    coco: ['OMG yes. I have SO much to tell you. Leaving now. Running. In heels. It is fine.'], cece: ['Me? Really? Yes! Sorry! I mean yes!'],
    clementine: ['Of course, darling. Give me two minutes to choose an entirely effortless outfit.'], cuke: ['Yes! I will jog there! Stretching now!'],
    sully: ["Kid, you had me at Mac's. Comin'."], ginger: ['Just tightening the last bolt. There. On my way!'], brulee: ['Magnifique. I am putting on my good scarf.'],
    fortune: ['I foresee... myself... at Mac\'s. In five minutes.'],
    floss: ["Yes! Let me finish this blowout. I'll be right there."], waffle: ["Crispy yes. I'll be right over."],
};
const INVITE_NO = {
    _: ["Aw, I can't right now! Rain check?", 'I just ate! Next time, I promise!', "Ahh, I'm in the middle of something. Save me a bite?"],
    maki: ['Not today. My schedule is very precise. You are in it for tomorrow. Probably.'], kai: ["Can't, dude. I'm halfway through a nap. If I stop now, I'll have to start over."],
    wonton: ['I am soaking. Soaking is serious. Another time!'], coco: ["Nooo, I can't! I'm literally in the middle of gossip. Next time!"],
    cece: ["I can't! Something's in the oven. Several somethings. I didn't expect the first one to turn out well."], sully: ["Can't, kid. Kiln's firing. Next time, I'm buyin'."],
    clementine: ["Darling, I'm booked. Fashion never sleeps. Tomorrow?"], cuke: ["I'm doing laps! 40 more! Next time!"],
};
const INVITE_DINE = {
    _: ['Thanks for inviting me! This is so nice. Just us, and a whole lot of cheese.', 'You invited ME? This is the best day. Pass the bread.'],
    joe: ["This is nice. Two friends. Eating. At a table. Friend dinner. (Joe has gone very pink.)", "Here, take this napkin. It's the one without the rhyme ideas on it."],
    maki: ['Thank you for the invitation. The seating is acceptable. The company is excellent.'], kai: ['Dude. Dinner buddies. This rules.'],
    coco: ["Okay so. SO. I have news. But first: thank you for inviting me. You're the best. Now the news..."], cece: ["Thanks for asking me! I had something in the oven, so I made myself leave. Mac has an oven. I don't need to bring one."],
    sully: ["Thanks for the invite, kid. Means a lot. Don't tell anybody I said that."],
};
function inviteList() {
    return textContacts().filter(id => id !== 'mac' && id !== 'goat' && NPC_DEFS[id] && !NPC_DEFS[id].dj && !Plans.get(id).away);
}
function inviteStatus(id) {
    const n = NPCs.get(id), d = NPC_DEFS[id], dh = dayHour();
    if (id === 'joe') return '';
    if (!n || n.sleeping) return 'asleep';
    const seg = planNow(id, dh);
    if ((d.shop && atCounter(n)) || (seg && (d.work || []).some(w => w[0] === seg.spot))) return 'working';
    if (n.area === 'restaurant') return "at Mac's";
    return '';
}
function pickInvitee() {
    return new Promise(res => {
        let done = false;
        const finish = v => { if (!done) { done = true; res(v); } };
        const P = UI.open({ title: 'Invite a friend', phone: true, back: () => UI.close(), onClose: () => finish(null) });
        P.body.appendChild(el('p', 'muted', 'Who should Sarah text? Good friends say yes more often. (One invite an hour.)'));
        const list = el('div', 'list');
        for (const id of inviteList()) {
            const row = el('button', 'row');
            row.type = 'button';
            row.appendChild(iconCanvas(contactIcon(id), 40));
            const t = el('div', 't');
            t.appendChild(el('b', null, NPC_DEFS[id].name));
            t.appendChild(el('span', 'hearts', heartStr(hearts(id))));
            row.appendChild(t);
            const st = inviteStatus(id);
            if (st) row.appendChild(el('span', 'openbadge', st));
            row.addEventListener('click', () => { finish(id); UI.close(true); });
            list.appendChild(row);
        }
        P.body.appendChild(list);
    });
}
async function maybeInvite() {
    const here = NPCs.list.some(n => !n.sleeping && n.area === 'restaurant' && n.want && n.want.slot != null && n.id !== 'mac' && TALK[n.id]);
    const now = Clock.island().getTime();
    if (here || !inviteList().length || (S.inviteAt && now - S.inviteAt < 3600e3 && now >= S.inviteAt)) return null;
    const k = await UI.ask(null, 'Eat with someone? Sarah could text a friend to come join her.', ['Text a friend', 'Eat by myself']);
    if (k !== 0) return null;
    UI.hideDialog();
    const id = await pickInvitee();
    if (!id) return null;
    S.inviteAt = now;
    S.stats.invites = (S.stats.invites || 0) + 1;
    const d = NPC_DEFS[id], st = inviteStatus(id), log = textsOf(id);
    const say = (me, t) => { log.push({ me, t, day: Clock.dayNum(), at: Date.now() }); if (log.length > 40) log.splice(0, log.length - 40); };
    say(true, "Want to get food at Mac's? I'm here now!");
    Sfx.ui('tick');
    await waitFrames(30);
    let yes = false, line;
    if (id === 'joe') { yes = true; line = rpick(INVITE_YES.joe); }
    else if (st === 'asleep') { log.push({ sys: true, t: `Delivered. ${d.name} is asleep.`, day: Clock.dayNum(), at: Date.now() }); Save.touch(); await UI.say(null, `No answer. ${d.name} must be asleep. Sarah eats by herself, and that's nice too.`); return null; }
    else if (st === 'working') { const seg = planNow(id, dayHour()); line = `I'm working${seg ? ' until ' + roundTime(seg.b) : ''}! Rain check?`; }
    else if (st === "at Mac's") { yes = true; line = "I'm already at Mac's! Look up! Hi!"; }
    else {
        const chance = [0.3, 0.45, 0.6, 0.72, 0.85, 0.95][hearts(id)] + (bonusCharm() ? 0.1 : 0);
        yes = R() < chance;
        line = rpick(yes ? INVITE_YES[id] || INVITE_YES._ : INVITE_NO[id] || INVITE_NO._);
    }
    line = fillText(voiced(id, line));
    say(false, line);
    Save.touch();
    Sfx.ui('ok');
    await UI.say(null, [`Sarah texts ${d.name}: "Want to get food at Mac's? I'm here now!"`, `${d.name}: "${line}"`]);
    if (!yes) { await UI.say(null, 'Oh well. Sarah eats by herself, and that\'s nice too.'); return null; }
    if (st !== "at Mac's") await UI.say(null, `Sarah waits a few minutes. Then the door opens, and there's ${d.name}!`);
    return id;
}
/* put the invited friend in the seat across the table (their plan says so too, so they stay for a while) */
function seatGuest(id, slot) {
    const n = NPCs.get(id);
    if (!n) return;
    const dh = dayHour();
    S.invite = { id, day: Clock.dayNum(), a: dh - 0.02, b: dh + 0.8 };
    delete Plans.cache[id];
    const want = targetFor(n, dh);
    if (slot >= 0) {
        const [fx, fy, face] = ROOMS.restaurant.guestSpots[slot];
        const [x, y] = toArea(fx, fy);
        Object.assign(want, { area: 'restaurant', x: (x + 0.5) * TILE, y: (y + 0.5) * TILE + 4, fixed: true, face, slot, seat: true, anchor: null });
    }
    moveTo(n, want, true);
}
function inviteOverride(id, day) {
    const v = S && S.invite;
    return v && v.id === id && v.day === day ? [['in_' + (v.place || 'restaurant'), v.a, v.b]] : null;
}
const DINE_TALK = {
    _: ['Oh, hi! Eat with me! Everything is better with company. Especially dessert.', "Mac's is the best. I come here more than I cook. I don't cook."],
    maki: ['Mac cuts his vegetables slightly uneven. I have made peace with it. It is still delicious.'],
    kai: ['Dude! Lunch buddies! This tomato soup is basically the ocean, if the ocean was soup.'],
    basil: ["Mac's cooking is so comforting. I'd never tell him, but I steal ideas for the cart."],
    wonton: ['I only order the things that are NOT soup. I have to be careful here.'],
    chili: ['I asked Mac to make it spicier. He made it cheesier. I respect it.'],
    coco: ["Sit, sit! Start eating. I have a long story and I'd hate for you to get hungry halfway through."],
    cece: ['I made the dessert! Is it okay? Be honest. No, don\'t be honest. Say it\'s okay. Sorry!'],
    clementine: ['Darling. A table for two. How chic. Try the dessert, I insist.'],
    cuke: ["I already had breakfast. At 5. This is my second breakfast. It's 'lunch' to you!"],
    sully: ["Kid, pull up a chair. The chowdah here's almost as good as back home. Almost."],
    ginger: ["Lunch break! Mac's chairs are solid. I checked. Old habit."],
    brulee: ["Just one little dessert, I told myself. It is my third. Please do not tell Mac. He knows."],
    joe: ["I'm trying to write about the sandwich before I finish it. Going to be a very short poem."],
};

/* first time in: Mac says hi */
Bus.on('enter', async id => {
    if (id !== 'restaurant' || S.flags.restaurantTour || !macVoice()) return;
    S.flags.restaurantTour = true;
    G.busy++;
    await waitFrames(20);
    await UI.say('mac', ["Welcome to Mac's! Sit anywhere. Well, anywhere with a chair.",
        "The menu changes every day: one of my specials, a few island favorites, and a dessert Cece drops off every morning.",
        "Eat here and whoever's around might join you. Or take it to go. Food makes a great gift. Food makes everything great.",
        "Order at the counter anytime!"]);
    G.busy--;
});

