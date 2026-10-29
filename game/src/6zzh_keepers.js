/* ---- 6zzh_keepers.js ---- */
/* The shopkeepers step out (David, 29 October: "Fortune and Wasabi leave their stores and wander sometimes right?"):
   Fortune, Floss and Waffle mind their counters all day but for a lunch break most days and, some afternoons, a walk
   round the island (keeperDay, from makePlan); the shop runs on the honor system meanwhile (26_rooms.js HONOR). DJ
   Wasabi keeps a night owl's day with a house of his own (22_npc.js, 20_world.js): asleep till noon, out in the
   afternoon, at the booth from the evening; when he's out the club's turntables play on autoplay (clubBooth). Caught
   out and about, a keeper chats about their break (keeperOutTalk). And anyone on their lunch may bring it up (David,
   29 October: "not always, but it's in the pool", lunchLine, a topic for topicLine). */

/* where each keeper has lunch and walks (the first that's open and exists; rooms only while they're open) */
const KEEPER_LUNCH = {
    fortune: [['home', 3], ['in_restaurant', 2], ['in_cafe', 1.5], ['bench_e', 1]],
    floss: [['in_restaurant', 3], ['in_cafe', 2], ['bench_museum', 1], ['plaza', 1]],
    waffle: [['in_restaurant', 2], ['in_cafe', 1.5], ['bench_boardwalk', 1.5], ['garden', 1]],
};
const KEEPER_WALK = [['plaza', 2], ['boardwalk', 1.5], ['beach', 1.5], ['pond', 1.5], ['harbor', 1], ['garden', 1], ['bench_e', 1], ['bench_boardwalk', 1], ['pier', 1], ['statue', 0.8]];
function keeperSpot(d) { return d.shop === true ? 'shop' : d.shop || (d.dj ? 'club' : null); }
/* a keeper's day: the counter from opening, out for lunch about noon (four days in five) and a walk some afternoons
   (three in five), back at the counter till closing */
function keeperDay(id, day, d, r) {
    const work = keeperSpot(d), out = [];
    const ok = (spot, a, b) => {
        if (spot === 'home') return !!(d.house && ROOMS[d.house]);
        if (spot.startsWith('in_')) { const room = spot.slice(3); return !!ROOMS[room] && roomOpen(room, a) && roomOpen(room, b); }
        return !!(W0.spots[spot] || spot.startsWith('bench'));
    };
    const pick = (list, a, b) => { const L = list.filter(([s]) => ok(s, a, b)); return L.length ? weighted(L, r) : null; };
    if (r() < 0.8) {
        const a = 12 + r() * 0.7, b = a + 0.55 + r() * 0.25, spot = pick(KEEPER_LUNCH[id] || KEEPER_WALK, a, b);
        if (spot) out.push({ a, b, spot, lunch: true });
    }
    if (r() < 0.6) {
        const a = 14.6 + r() * 1.6, b = a + 0.6 + r() * 0.5, spot = pick(KEEPER_WALK, a, b);
        if (spot && b < d.bed - 0.6) out.push({ a, b, spot, walk: true });
    }
    const segs = [];
    let t = d.wake;
    for (const s of out) { if (s.a > t) segs.push({ a: t, b: s.a, spot: work }); segs.push(s); t = s.b; }
    segs.push({ a: t, b: d.bed, spot: work });
    return segs;
}
/* at their counter (or the booth) right now */
function atCounter(n) { const sp = keeperSpot(n.def); return !!sp && (n.area === sp || (sp === 'shop' && n.area === 'shop')); }

/* ---------------------------------------------------------------- out and about */
const KEEPER_OUT = {
    fortune: {
        lunch: ["Lunch break! The shop's on the honor system. Cuke is probably paying double right now.",
            "Oh! Hi! I'm on my lunch. A fortune cookie sandwich: two cookies with a fortune in the middle. It's mostly fortune.",
            "Shh, don't tell anyone, but I'm having lunch somewhere that isn't the shop. It's thrilling."],
        walk: ["Just stretching my legs! Stand behind a counter all day and you forget you have legs.",
            "A little walk! My fortune said 'go outside.' I argued with it. It won.",
            "I needed some air. The shop smells like cookies all day. That's not a complaint. Well. It's a small one."],
        ask: ["What's up?", "Walk with me a minute? I'll keep walking. You keep talking."],
        chat: ["I love seeing what everyone bought out on the island. That lamp? Mine. I mean, sold by me.",
            "Out here, nobody asks me for change. It's very relaxing.", "Every walk I find a new favorite bench. Today it's that one. Tomorrow, who knows."],
        bye: ["Back to the counter soon! Come by!", "See you at the shop! Bring your fortune luck."],
    },
    floss: {
        lunch: ["Lunch, sugar! A girl can't run on hairspray alone. I tried.",
            "On my break! The salon's self-serve right now. I'm a little nervous. Nobody cut their own bangs, I hope.",
            "Cotton candy for lunch? No, sugar, that would be weird. It's a salad. A pink one."],
        walk: ["Just getting some fresh air! The dryers make everything so... fluffy. Including me.",
            "A little stroll, sugar! The sea breeze is murder on my hair, but the view is worth it.",
            "Floss is out and about! Don't look at my hair. The humidity's having its way with it."],
        ask: ["What's new, gorgeous?", "Walk and talk, sugar?"],
        chat: ["I people-watch on my walks. Hair-watch, really. Coco's bun? Iconic.", "Out here I see who's overdue for a trim. I'm not saying who. It's Kai.",
            "Sometimes I just sit and let my hair do whatever it wants. It wants to be big. I let it."],
        bye: ["Back to the salon, sugar! The chair misses me.", "Toodles! Stay fluffy."],
    },
    waffle: {
        lunch: ["Lunch break! I'm having pancakes. ...Don't make it weird.",
            "Taking my lunch out here. You can't sell lamps on an empty stomach. Well, you can. I'd rather not.",
            "Mmm, lunch. The shop's on the honor system. Everyone pays in the syrup jar. It's very sticky."],
        walk: ["Checking out the island's displays! Professional research. That bench? Mine. That lamp? Also mine.",
            "A little walk! I like seeing where folks put the things they bought. It makes me happy.",
            "Out for a stroll. I counted fourteen lamps on the way. I'm proud of every one."],
        ask: ["What's up, cus-friend?", "Oh, hello! Got a minute?"],
        chat: ["A good bench is one you forget you're sitting on. A great bench is one you remember forever.", "I'm thinking about a new hedge. Rounder. Friendlier.",
            "Every lamp on this island has a story. Most of the stories are 'Waffle sold it.' Good stories."],
        bye: ["Back to the shop! Lamps don't polish themselves.", "See you! May your lamps always glow."],
    },
    wasabi: {
        lunch: ["Breakfast! At this hour! That's how a DJ does it. Lunch is breakfast if you wake up at noon.",
            "YOOO! Fueling up. Big set tonight. Wasabi on everything. Obviously.", "First meal of the day! Don't tell me what time it is. I don't want to know."],
        walk: ["Just catching some sun before the night shift! Daylight's weird. It's so... bright.",
            "Out here listening to the island. The waves have a great beat. I might sample them.", "YOOO! Daytime Wasabi! Rare sighting. Take a picture. Actually, don't. I just woke up."],
        ask: ["What's the word, superstar?", "Talk to me!"],
        chat: ["The club's on autoplay till I get there. The turntables know what they're doing. I taught them.", "Gulls have terrible rhythm. Every one of them. I've listened.",
            "I got a house now, east past Cuke's. Speakers in every corner. The neighbors? Cuke's asleep by ten. It works out."],
        bye: ["Catch you tonight at the club!", "Later! The floor opens at sunset. Well. It's always open. But you know."],
    },
};
/* talking to a keeper away from their counter: about their break, then a chat (true when handled) */
async function keeperOutTalk(n) {
    const id = n.id, L = KEEPER_OUT[id];
    if (!L || atCounter(n)) return false;
    const seg = planNow(id, dayHour());
    rel(id).met = true;
    await UI.say(id, voiced(id, rpick(seg && seg.lunch ? L.lunch : L.walk)), { keep: true });
    for (;;) {
        const k = await UI.ask(id, rpick(L.ask), ['Talk', 'See you!'], { keep: true });
        if (k !== 0) { await UI.say(id, rpick(L.bye)); return true; }
        await justTalk(n, () => rpick(L.chat));
    }
}

/* ---------------------------------------------------------------- lunch, a thing to bring up */
const LUNCH_LINES = {
    home: ["Just having lunch at home! Nothing fancy. A sandwich. A really good sandwich.", "Lunch break! I made soup. It's the kind of soup you make when you can't decide. Everything soup.",
        "I'm on my lunch! It's the best part of the day. Don't tell breakfast.", "Lunch at home, feet up. Okay, one foot. I'm not a monster."],
    in_restaurant: ["Lunch at Mac's! The special today is mac and cheese. The special every day is mac and cheese.", "I come here for lunch whenever I can. Mac always gives me extra. I think. It might just be a big plate.",
        "Mmm. Mac's never misses. You should get the special. Whatever it is. It's always good."],
    in_cafe: ["Lunch at Muggy's! Well, a coffee and a muffin. That's lunch if you believe in yourself.", "Muggy makes a mean latte. I'm calling it lunch."],
    out: ["A picnic lunch! Food tastes better outside. That's science.", "Lunch with a view. The gulls are watching my sandwich. I'm watching the gulls."],
};
const LUNCH_OWN = {
    joe: ["Lunch! I'm having a sandwich and writing a poem about the sandwich. It's going well. For the poem.", "Lunchtime! I made enough for two. In case you came by. You came by!"],
    kai: ["Lunch, dude! Fish tacos. I caught the fish. Then I bought a fish. Long story.", "Bro, lunch is the best. Second best. Surfing is first. Lunch is a close second."],
    coco: ["Girl, lunch is my favorite gossip hour. Sit, sit. Who have you seen today?", "A chocolate croissant for lunch. Don't judge me. Judge me a little."],
    chili: ["Spicy lunch. Obviously. My mouth's on fire. Perfect.", "Lunch. Extra hot sauce. The hot sauce has hot sauce on it."],
    cuke: ["LUNCH!!! PROTEIN! VEGETABLES! MORE VEGETABLES! Wait. I'm a vegetable.", "Refueling! Then a jog! Then a smaller lunch! It's called pacing!"],
    sully: ["Lunch, kid. A frappe and a sandwich. Back home that's a balanced meal.", "Lunch break. I'm on the clock for nothing, but I still take a lunch. Habit."],
    maki: ["I am eating lunch. Slowly. Properly. It is important to taste things.", "Lunch is a small ceremony. I bow to the rice. The rice does not bow back."],
    basil: ["My own noodles for lunch. Is that cheating? It tastes like winning.", "Lunch! I put a little basil on everything. Including the basil."],
    cece: ["A little slice of cheesecake for lunch. And a salad. The salad is for show.", "Lunch break! I'm testing a new flavor. Purely for science. Mm. Science."],
    clementine: ["Lunch, darling. Something light. Citrus, naturally.", "One must lunch, darling. Beautifully, if possible."],
    brulee: ["Ah, lunch! A crème brûlée for lunch is not a crime. I checked.", "A proper lunch, with a proper napkin. The museum can wait one hour."],
    ginger: ["Lunch break! I build better on a full stomach. Ask anyone who's seen me build hungry.", "Lunch! Then back to the hammer. The hammer's patient. Mostly."],
    scampi: ["Lunch, matey! Hardtack and chowder. Ye can take the shrimp off the sea, but not the chowder off the shrimp.", "A sailor's lunch. Quick, salty, and eaten standing up. Old habits."],
    mug: ["Lunch! I don't eat, technically. I'm a mug. But I like to sit with a coffee and remember.", "On my break! A mug resting with a mug. Very relaxing. For both of us."],
};
/* on their lunch right now (and there, not still on the way) */
function onLunch(n) {
    if (!n || n.path || n.sleeping) return null;
    const s = planNow(n.id, dayHour());
    return s && s.lunch ? s : null;
}
function lunchLine(n) {
    const s = onLunch(n);
    if (!s) return null;
    const where = s.spot === 'home' ? 'home' : LUNCH_LINES[s.spot] ? s.spot : 'out';
    const pool = LUNCH_LINES[where].concat(LUNCH_OWN[n.id] || [], LUNCH_OWN[n.id] || []);
    return rpick(pool);
}
EXTRA_TOPICS.push(['lunch', n => (onLunch(n) ? 3 : 0), lunchLine]);

/* ---------------------------------------------------------------- the club without its DJ */
async function clubBooth() {
    const n = NPCs.get('wasabi');
    if (n && !n.sleeping && n.area === 'club' && !G.busy) return talkTo(n);
    if (G.busy) return;
    G.busy++;
    try {
        await UI.say(null, rpick(['A sticky note on the turntables: "AUTOPLAY ON. Pick a track, superstar! Back tonight. - DJ W"',
            'DJ Wasabi is out. The turntables are on autoplay, blinking away happily.']), { keep: true });
        await clubMenu();
    } catch (e) { console.error(e); }
    UI.hideDialog();
    G.busy--;
}
Bus.on('enter', id => {
    if (id !== 'club') return;
    const n = NPCs.get('wasabi');
    if (n && (n.sleeping || n.area !== 'club')) setTimeout(() => { if (G.area.id === 'club') UI.toast('DJ Wasabi is out. The booth is on autoplay!', 'wasabi_0'); }, 400);
});
