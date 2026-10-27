/* ---- 69_texts.js ---- */
/* Messages: text a neighbor to ask where they are and where they're off to next. They answer from their actual day
   (the same plan that moves them around the island), in their own voice. */
const PLACE_NAMES = {
    home: 'at home', goatpen: 'at the goat pen by the barn', jog: 'jogging laps around the orchard', club: 'at Club Wasabi', spring: 'at the hot spring',
    cart: 'at my noodle cart in the plaza', pier_end: 'at the end of the pier', shop: 'at the shop', pier: 'on the pier',
    plaza: 'in the plaza', plaza_w: 'in the plaza', plaza_e: 'in the plaza', bench_w: 'on a bench in the plaza', bench_e: 'on a bench in the plaza',
    board: 'by the island board', garden: "by your garden, actually", beach_w: 'on the west beach', beach: 'on the beach', beach_e: 'on the east beach',
    beach_far: 'on the far beach, past the river', pond: 'by the pond', river: 'down by the river', orchard: 'in the orchard', bridge: 'on the bridge',
    waterfall: 'by the waterfall', meadow: 'in the meadow up the hill', farm: 'at the farm', forest: 'in the forest', eastmeadow: 'in the east meadow',
    mountain: 'on the mountain', lookout: 'up at the lookout', bench_pond: 'on the bench by the pond', bench_falls: 'on the bench by the waterfall',
    bench_beach: 'on the bench at the beach', bench_farm: 'on the bench by the farm', bench_museum: 'on the bench by the museum',
    bench_meadow: 'on the bench in the meadow', bench_lookout: 'on the bench at the lookout',
    rope_a: 'turning the jump rope in the plaza', rope_b: 'turning the jump rope in the plaza',
    shopfront: "outside Fortune's", boutiquefront: "outside Clementine's", arcadefront: 'outside the arcade', studiofront: 'outside the pottery studio',
    restaurantfront: "outside Mac's", museumfront: 'outside the museum', builderfront: "outside Ginger's workshop", clubfront: 'outside Club Wasabi',
    salonfront: 'outside the salon', displaysfront: "outside Waffle's", statue: "by David's statue", boardwalk: 'on the Boardwalk', harbor: 'down by the harbor',
    bonfire: 'at the bonfire on the beach', campsite: 'at the campsite', oldtree: 'by the big old tree in the forest', village: 'in the west village',
    eastside: 'on the east side', bench_statue: 'on a bench in the corner of the square', bench_boardwalk: 'on a bench on the Boardwalk',
    bench_eastmeadow: 'on the bench in the east meadow',
};
/* spots that are really the same place (a bench in the plaza is still the plaza) */
const PLACE_GROUP = { bench_w: 'plaza', bench_e: 'plaza', plaza_w: 'plaza', plaza_e: 'plaza', board: 'plaza', rope_a: 'plaza', rope_b: 'plaza', cart: 'plaza',
    bench_statue: 'statue', bench_boardwalk: 'boardwalk', bench_beach: 'beach', bench_pond: 'pond', bench_falls: 'waterfall', bench_meadow: 'meadow',
    bench_lookout: 'lookout', bench_eastmeadow: 'eastmeadow', bench_farm: 'farm', bench_museum: 'museumfront', pier_end: 'pier' };
function placeGroup(spot) { return PLACE_GROUP[spot] || spot; }
const ROOM_PLACE = { shop: "at Fortune's", boutique: "at Clementine's", studio: 'at the pottery studio', arcade: 'at the arcade', museum: 'at the museum',
    salon: 'at the salon', displays: "at Waffle's",
    restaurant: "at Mac's", builder: "at Ginger's workshop", barn: 'in the barn', windmill: 'in the windmill', club: 'at Club Wasabi' };
/* "at the museum" for a plan spot, from this neighbor's point of view */
function placeName(id, spot) {
    if (!spot) return 'somewhere';
    const d = NPC_DEFS[id] || {};
    if (spot.startsWith('party:')) return `at the party ${(PLACE_NAMES[spot.slice(6)] || 'in the plaza').replace(/^(at|in|on|by) the /, 'at the ')}`;
    if (spot.startsWith('in_')) return ROOM_PLACE[spot.slice(3)] || 'out shopping';
    if ((d.work || []).some(w => w[0] === spot) && ROOM_PLACE[spot]) {
        return { builder: 'at my workshop', museum: 'working at the museum', restaurant: 'working at the restaurant', arcade: 'working at the arcade',
            boutique: 'working at the boutique', studio: 'working at the pottery studio' }[spot] || ROOM_PLACE[spot];
    }
    if (spot === 'home' && d.house && id !== 'goat') return 'at home';
    return PLACE_NAMES[spot] || ROOM_PLACE[spot] || 'out and about';
}
/* "working at the museum" -> "to the museum", for when they're walking there */
function toWhere(s) {
    if (!s) return null;
    if (s === 'at home') return 'home';
    if (/^outside /.test(s)) return s.replace(/^outside /, 'to ');
    const m = s.match(/(?:^|\s)(?:at|in|on|by|around|to) ((?:the|my|your) .+|[A-Z].*)$/);
    return m ? 'to ' + m[1] : null;
}
function roundTime(dh) { return fmtDayHour(Math.round(dh * 4) / 4); }
/* people say "around" a time, and they're a little off: what they tell you is up to 25 minutes early or late (the same
   answer all day, so asking twice doesn't change it) */
function saidTime(id, dh, tag) {
    const r = mulberry(hash32(S.seed + ':said:' + id + ':' + Clock.dayNum() + ':' + tag + ':' + Math.round(dh * 60)));
    return roundTime(dh + (r() - 0.5) * 0.85);
}
/* where they are now, and what's next */
function whereabouts(id) {
    const n = NPCs.get(id), d = NPC_DEFS[id], p = Plans.get(id), dh = dayHour();
    const out = { asleep: !!(n && n.sleeping), away: !!p.away };
    const cur = planNow(id, dh);
    out.now = cur ? placeName(id, cur.spot) : null;
    out.walking = !!(n && !n.sleeping && n.path && n.travel);
    // "next" is the next place that's actually somewhere else (a bench in the plaza is still the plaza)
    const here = cur ? placeName(id, cur.spot) : null, grp = cur ? placeGroup(cur.spot) : null;
    const later = p.segs.filter(s => s.a > dh + 0.05 && (!cur || (placeGroup(s.spot) !== grp && placeName(id, s.spot) !== here)));
    const next = later[0] || null;
    out.next = next ? { place: placeName(id, next.spot), at: saidTime(id, next.a, 'next'), home: next.spot === 'home' } : null;
    out.bed = p.bed ? saidTime(id, p.bed, 'bed') : null;
    out.wake = roundTime(d.wake || 9);
    if (d.visitor) out.leaves = saidTime(id, p.bed || 22, 'boat');
    return out;
}
const TEXT_ASK = [['where', 'Where are you?'], ['next', 'Where are you headed next?'], ['hi', 'Hi!'], ['help', 'Need a hand?']];
function textReply(id, kind) {
    const w = whereabouts(id), d = NPC_DEFS[id], name = d.name;
    const pick = a => rpick(a);
    if (id === 'wasabi') return pick(['At the club. I am always at the club. The club is always at me.', 'Booth. Spinning. Come dance.']);
    if (id === 'fortune') {
        if (w.asleep) return null;
        return kind === 'next' ? pick([`Still here! The shop's open till ${fmtOpen(ROOM_HOURS.shop[1])}. Then I sleep. In a cookie.`, "Nowhere! I'm the shop. The shop is me."]) : pick(["At the shop, of course! Come by, I have fortunes.", 'Behind the counter! Always behind the counter.']);
    }
    if (id === 'floss') {
        if (w.asleep) return null;
        return kind === 'next' ? pick([`Nowhere, sugar! I live at the salon. Open till ${fmtOpen(ROOM_HOURS.salon[1])}.`, 'Still at the salon! Fluffing things. Come by.'])
            : pick(['At the salon, sugar! The chair is free.', "Floss & Gloss, where else? I'm steaming a wig. Don't ask."]);
    }
    if (id === 'waffle') {
        if (w.asleep) return null;
        return kind === 'next' ? pick([`Right here at the shop till ${fmtOpen(ROOM_HOURS.displays[1])}! Lamps don't sell themselves. They do glow, though.`, 'Staying put! Come see the new benches.'])
            : pick(["At the shop! Waffle's Island Displays. Lamps, benches, hedges. The works.", 'Behind the counter, polishing a lamp post. It is very shiny now.']);
    }
    if (w.away) {
        if (id === 'david') return pick(['Not on the island right now, honey. Tell my statue I said hi.', 'Home this week! Keep my tent warm. Metaphorically.',
            "Off the island. But I'm there in spirit. And in marble."]);
        return pick(['Not on the island today! Back home. Miss you! (PLACEHOLDER)', 'Home today, not on the island. Save me a noodle. (PLACEHOLDER)']);
    }
    if (w.asleep) return null;
    if (kind === 'hi') {
        const t = TALK[id];
        if (id === 'joe') return pick(['Hi!! I was just thinking about a frog. Only the frog. Why do you ask?', 'Hey you! I am writing a poem. Want to hear it later?', 'Hi! (Joe sends a frog emoji. Then a smiley. Then deletes the smiley. Too late.)']);
        if (d.family) return pick(['Hey Sarah! (PLACEHOLDER)', 'Hi! What are you up to? (PLACEHOLDER)']);
        if (id === 'david') return pick(['Sister! I am on your island and I look incredible. Come find me.', 'HI. Did you see my statue today? Go see my statue.']);
        return pick([`Hi, {name}! ${w.now ? `I'm ${w.now}.` : ''}`, 'Hiiii!', t && t.chat ? rpick(t.chat) : 'Hi!']);
    }
    const dest = toWhere(w.now);
    const nowBit = w.walking ? (dest ? pick([`On my way! Currently walking ${dest}.`, `Heading ${dest} right now!`]) : pick(['Out for a walk!', `Walking around. Nice ${Clock.hourF() >= 19 || Clock.hourF() < 6 ? 'night' : 'day'} for it.`]))
        : w.now ? pick([`I'm ${w.now}!`, `${cap(w.now)}. Come say hi!`, `${cap(w.now)} right now.`]) : 'Somewhere on the island!';
    const nextBit = w.next ? (w.next.home ? pick([`Heading home around ${w.next.at}.`, `Home by ${w.next.at}, then bed around ${w.bed}.`])
        : pick([`Then ${w.next.place} around ${w.next.at}.`, `After that? ${cap(w.next.place)}, around ${w.next.at}.`, `Around ${w.next.at} I'll be ${w.next.place}.`]))
        : w.bed ? pick([`Then bed around ${w.bed}.`, `Staying put until bedtime. Around ${w.bed}.`]) : '';
    // "where are you?" is just where they are; where they're off to next is only for "where are you headed next?"
    if (d.visitor) {
        const v = visitOf(id, Clock.dayNum());
        const tail = v && !v.last ? pick(['Camping at the campsite tonight!', "I'm in the tent at the campsite tonight."]) : `The boat leaves around ${w.leaves}.`;
        return `${kind === 'next' ? `${nextBit || nowBit} ${tail}` : nowBit}${d.family ? ' (PLACEHOLDER)' : ''}`;
    }
    return kind === 'next' ? (nextBit || nowBit) : nowBit;
}
/* texting the same thing over and over gets its own answers */
function textRepeats(log, label) {
    let n = 0, t = Date.now();
    for (let i = log.length - 2; i >= 0; i--) {
        const m = log[i];
        if (!m.me) continue;
        if (m.t !== label || t - (m.at || 0) > 10 * 60e3) break;
        n++; t = m.at || t;
    }
    return n;
}
const TEXT_REPEAT = {
    where: [['Still {now}! Did my last text not come through?', 'Same place as before! {now}. Come find me!'],
        ["{name}. I am STILL {now}. I promise. I haven't moved. Well. I moved a little. Same place.", 'Still {now}. Still! Nothing has changed except my patience. (It\'s fine.)'],
        ["Are you okay? You keep asking where I am. I'm {now}! Just come over! I'll wait. I'm very good at waiting.", '*sends a little map with a big red X on it*']],
    next: [['Same plan as a minute ago! {next}', "My plans haven't changed! {next}"],
        ["I'm a creature of habit. {next} Same as the last three times. I'm very consistent.", 'Still the plan! Writing it on my hand now so I remember. {next}'],
        ['*replies with a screenshot of the last text*', "At this point you know my schedule better than I do."]],
    hi: [['Hi again!', 'Hi! Hi. Hello! Hi!'], ["Hi! Hi. Hiiii. How many hi's is this? I'm counting.", 'HI. (This is getting fun.)'], ['*waves at the phone*', 'hi hi hi hi hi']],
};
const TEXT_REPEAT_OWN = {
    maki: ['You asked me that a few minutes ago. I have not moved. I do not move without a reason.'],
    coco: ["Girl, are you checking on me? I love it. I'm still {now}. Don't tell anyone where I am. Tell everyone."],
    cuke: ['STILL {NOW}!!! COME JOG WITH ME!!!'], sully: ['Kid. Same place. Relax. Have a frappe.'],
    joe: ["Still {now}! You keep texting me. That's nice. That's very nice. I'm smiling at my phone like a weirdo."], david: ['Honey, obsessed with me? Understandable. Still {now}.'],
    clementine: ['Darling, persistence is attractive. Up to a point. We are at the point.'], chili: ["You keep texting me. I'm blushing. I'm always blushing. But it's the texts this time."],
    cece: ["Sorry! Did I not answer? I'm still {now}! Sorry! Was that too much? Sorry!"], kai: ['Bro. Same spot. Chill. The spot is chill too.'],
};
function repeatReply(id, kind, rep) {
    const w = whereabouts(id), d = NPC_DEFS[id];
    if (w.asleep && !d.dj) return null;
    let line;
    const own = TEXT_REPEAT_OWN[id];
    if (d.family) line = rpick(['Hey Sarah! You already asked! (PLACEHOLDER)', 'Still the same! (PLACEHOLDER)']);
    else if (own && rep >= 2 && R() < 0.6) line = rpick(own);
    else line = rpick(TEXT_REPEAT[kind][Math.min(3, rep) - 1]);
    const now = w.now || 'here', next = w.next ? `${cap(w.next.place)} around ${w.next.at}.` : w.bed ? `Bed around ${w.bed}.` : 'Staying put.';
    return line.replace(/\{now\}/g, now).replace(/\{NOW\}/g, now.toUpperCase()).replace(/\{next\}/g, next);
}
function textsOf(id) {
    if (!S.texts) S.texts = {};
    return S.texts[id] || (S.texts[id] = []);
}
function textContacts() {
    const ids = ['joe'].concat(NEIGHBORS, ['fortune', 'floss', 'waffle', 'wasabi'], VISITORS);
    return ids.filter(id => NPC_DEFS[id] && rel(id).met).sort((a, b) => {
        const la = textsOf(a).slice(-1)[0], lb = textsOf(b).slice(-1)[0];
        return (lb ? lb.at : 0) - (la ? la.at : 0);
    });
}
function contactIcon(id) { const d = NPC_DEFS[id]; return d.human ? `${d.human}_down_stand` : `${d.sprite}_0`; }
function appTexts() {
    const P = UI.open({ title: 'Messages', phone: true, back: backToPhone });
    const list = el('div', 'list');
    const ids = textContacts();
    if (!ids.length) P.body.appendChild(el('p', 'muted', 'Meet some neighbors first. Then you can text them.'));
    for (const id of ids) {
        const d = NPC_DEFS[id], last = textsOf(id).slice(-1)[0];
        const row = el('button', 'row');
        row.type = 'button';
        row.appendChild(iconCanvas(contactIcon(id), 40));
        const t = el('div', 't');
        t.appendChild(el('b', null, d.name));
        t.appendChild(el('span', null, last ? (last.me ? 'You: ' : '') + last.t : 'Tap to text'));
        row.appendChild(t);
        const n = NPCs.get(id);
        if (n && n.sleeping && !NPC_DEFS[id].dj) row.appendChild(el('span', 'openbadge', 'asleep'));
        row.addEventListener('click', () => { Sfx.ui('tick'); textThread(id); });
        list.appendChild(row);
    }
    P.body.appendChild(list);
    P.body.appendChild(el('p', 'muted', 'Text a neighbor to find out where they are, where they are going next, or if they need a hand. Sometimes they text first!'));
}
function textThread(id) {
    const d = NPC_DEFS[id];
    const P = UI.open({ title: d.name, phone: true, back: appTexts, foot: true });
    const box = el('div', 'texts');
    P.body.appendChild(box);
    const day = Clock.dayNum();
    const bubble = (m) => {
        const b = el('div', 'txt ' + (m.me ? 'me' : m.sys ? 'sys' : 'them'), m.t);
        box.appendChild(b);
        return b;
    };
    const draw = () => {
        box.innerHTML = '';
        let lastDay = null;
        for (const m of textsOf(id).slice(-30)) {
            if (m.day !== lastDay) { box.appendChild(el('div', 'txtday', m.day === day ? 'Today' : m.day === day - 1 ? 'Yesterday' : dayLabel(m.day))); lastDay = m.day; }
            bubble(m);
        }
        P.body.scrollTop = P.body.scrollHeight;
    };
    draw();
    let busy = false;
    // they texted first: answer them
    const inv = Invites.pendingFor(id);
    if (inv) {
        P.foot.appendChild(btn('Sure!', 'green', () => { Sfx.ui('ok'); Invites.answer(inv, true); textThread(id); }));
        P.foot.appendChild(btn("Can't right now", 'alt', () => { Sfx.ui('tick'); Invites.answer(inv, false); textThread(id); }));
    }
    for (const [kind, label] of (inv ? [] : TEXT_ASK)) {
        P.foot.appendChild(btn(label, kind === 'where' ? 'green' : 'alt', async () => {
            if (busy) return;
            busy = true;
            const log = textsOf(id);
            log.push({ me: true, t: label, day: Clock.dayNum(), at: Date.now() });
            if (log.length > 40) log.splice(0, log.length - 40);
            draw();
            Sfx.ui('tick');
            const rep = textRepeats(log, label);
            const reply = kind === 'help' ? Invites.helpReply(id) : rep ? repeatReply(id, kind, rep) : textReply(id, kind);
            if (reply == null) {
                const w = whereabouts(id);
                log.push({ sys: true, t: `Delivered. ${d.name} is asleep. (Usually up around ${w.wake}.)`, day: Clock.dayNum(), at: Date.now() });
                draw(); busy = false; Save.touch();
                return;
            }
            const dots = el('div', 'txt them typing', '\u2022 \u2022 \u2022');
            box.appendChild(dots);
            P.body.scrollTop = P.body.scrollHeight;
            await new Promise(r => setTimeout(r, 650 + Math.random() * 500));
            if (!box.isConnected) { busy = false; return; }
            log.push({ me: false, t: fillText(voiced(id, reply)), day: Clock.dayNum(), at: Date.now() });
            Sfx.ui('ok');
            draw();
            busy = false;
            Save.touch();
        }));
    }
}

