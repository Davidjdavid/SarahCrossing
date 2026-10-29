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
    rope_a: 'turning the jump rope in the plaza', rope_b: 'turning the jump rope in the plaza', vb_a: 'playing volleyball at the court', vb_b: 'playing volleyball at the court',
    shopfront: "outside Fortune's", boutiquefront: "outside Clementine's", arcadefront: 'outside the arcade', studiofront: 'outside the pottery studio',
    restaurantfront: "outside Mac's", museumfront: 'outside the museum', builderfront: "outside Ginger's workshop", clubfront: 'outside Club Wasabi',
    salonfront: 'outside the salon', displaysfront: "outside Waffle's", statue: 'on the lawn by Market Lane', boardwalk: 'on the Boardwalk', harbor: 'down by the harbor',
    bonfire: 'at the bonfire on the beach', campsite: 'at the campsite', oldtree: 'by the big old tree in the forest', village: 'in the west village',
    eastside: 'on the east side', bench_statue: 'on a bench in the corner of the square', bench_boardwalk: 'on a bench on the Boardwalk',
    bench_eastmeadow: 'on the bench in the east meadow', cove: 'down in Driftwood Cove',
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
    // (in an area the designer drew and named: 6zza_designer.js)
    const area = typeof designPlace === 'function' && designPlace(spot);
    if (area) return area;
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
    const out = { asleep: !!(n && n.sleeping), away: !!p.away || awayNow(id) };
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
    return out;
}
/* a neighbor's whole day, laid out (David, 27 October: on the beta site or with the debug tools it's fine to see it; in the
   game Sarah texts them to find out where they are and where they're going). localStorage sc-plans 1 or 0 to choose. */
function plansShown() { const v = lsGet('sc-plans'); return v === '1' ? true : v === '0' ? false : !!window.__DEBUG || CIVIC_PREVIEW; }
function appDayPlan(id) {
    const d = NPC_DEFS[id], p = Plans.get(id), dh = dayHour();
    const P = UI.open({ title: `${d.name}'s day`, phone: true, back: appFriends });
    P.body.appendChild(el('p', 'muted', "Today's plan. (Only the beta site and the debug tools show this; in the game, text them to find out.)"));
    const list = el('div', 'list');
    const line = (when, what, now) => { const r = el('div', 'row' + (now ? ' on' : '')), t = el('div', 't'); t.appendChild(el('b', null, when)); t.appendChild(el('span', null, what + (now ? ' (now)' : ''))); r.appendChild(t); list.appendChild(r); };
    if (p.away || awayNow(id)) line('All day', 'Off the island');
    else {
        line(fmtDayHour(p.wake), 'Wakes up', dh < p.wake);
        for (const g of p.segs) line(`${fmtDayHour(g.a)} to ${fmtDayHour(g.b)}`, cap(placeName(id, g.spot)), dh >= g.a && dh < g.b);
        line(fmtDayHour(p.bed), 'Goes to bed', dh >= p.bed);
    }
    P.body.appendChild(list);
}
const TEXT_ASK = [['where', 'Where are you?'], ['next', 'Where are you headed next?'], ['hi', 'Hi!']];
function textReply(id, kind) {
    const w = whereabouts(id), d = NPC_DEFS[id], name = d.name;
    const pick = a => rpick(a);
    // the shopkeepers and the DJ: at the counter (or the booth) their own answers, and the break that's coming if Sarah
    // asks what's next; out on a break, the same as anyone (6zzh_keepers.js)
    const seg = planNow(id, dayHour()), work = keeperSpot(d);
    if (work && !w.asleep && seg && seg.spot === work) {
        const brk = Plans.get(id).segs.find(s => s.a > dayHour() && (s.lunch || s.walk));
        if (kind === 'next' && brk) return pick([`${brk.lunch ? 'Lunch' : 'A little walk'} around ${saidTime(id, brk.a, 'next')}! Then back ${id === 'wasabi' ? 'to the booth' : 'behind the counter'}.`,
            `I'm stepping out around ${saidTime(id, brk.a, 'next')}. ${brk.lunch ? 'Lunch!' : 'Fresh air!'} The ${id === 'wasabi' ? 'turntables run on autoplay' : 'shop runs on the honor system'} while I'm out.`]);
        if (id === 'wasabi') return pick(['At the club. Booth. Spinning. Come dance.', 'At the booth! The floor is warming up. You should be on it.']);
        if (id === 'fortune') return kind === 'next' ? pick([`Still here! The shop's open till ${fmtOpen(ROOM_HOURS.shop[1])}. Then I sleep. In a cookie.`, "Nowhere! I'm the shop. The shop is me."]) : pick(["At the shop, of course! Come by, I have fortunes.", 'Behind the counter! Come say hi.']);
        if (id === 'floss') return kind === 'next' ? pick([`Nowhere, sugar! At the salon till ${fmtOpen(ROOM_HOURS.salon[1])}.`, 'Still at the salon! Fluffing things. Come by.'])
            : pick(['At the salon, sugar! The chair is free.', "Floss & Gloss, where else? I'm steaming a wig. Don't ask."]);
        if (id === 'waffle') return kind === 'next' ? pick([`Right here at the shop till ${fmtOpen(ROOM_HOURS.displays[1])}! Lamps don't sell themselves. They do glow, though.`, 'Staying put! Come see the new benches.'])
            : pick(["At the shop! Waffle's Island Displays. Lamps, benches, hedges. The works.", 'Behind the counter, polishing a lamp post. It is very shiny now.']);
    }
    if (w.away) {
        // (off on vacation: 6zj_vacations.js)
        const v = vacationOf(id, Clock.dayNum()), at = v ? v.place : 'a trip';
        return pick([`Not on the island! I'm in ${at}. Back soon. Miss you!`, `Greetings from ${at}! Off the island for a few days. Save me a snack.`, `On vacation in ${at}! Look out for my postcard.`]);
    }
    if (w.asleep) return null;
    if (kind === 'hi') {
        const t = TALK[id];
        if (id === 'joe') return pick(['Hi!! I was just thinking about a frog. Only the frog. Why do you ask?', 'Hey you! I am writing a poem. Want to hear it later?', 'Hi! (Joe sends a frog emoji. Then a smiley. Then deletes the smiley. Too late.)']);
        return pick([`Hi, {name}! ${w.now ? `I'm ${w.now}.` : ''}`, 'Hiiii!', t && t.chat ? rpick(t.chat) : 'Hi!']);
    }
    const dest = toWhere(w.now);
    const nowBit = w.walking ? (dest ? pick([`On my way! Currently walking ${dest}.`, `Heading ${dest} right now!`]) : pick(['Out for a walk!', `Walking around. Nice ${Clock.hourF() >= 19 || Clock.hourF() < 6 ? 'night' : 'day'} for it.`]))
        : w.now ? pick([`I'm ${w.now}!`, `${cap(w.now)}. Come say hi!`, `${cap(w.now)} right now.`]) : 'Somewhere on the island!';
    const nextBit = w.next ? (w.next.home ? pick([`Heading home around ${w.next.at}.`, `Home by ${w.next.at}, then bed around ${w.bed}.`])
        : pick([`Then ${w.next.place} around ${w.next.at}.`, `After that? ${cap(w.next.place)}, around ${w.next.at}.`, `Around ${w.next.at} I'll be ${w.next.place}.`]))
        : w.bed ? pick([`Then bed around ${w.bed}.`, `Staying put until bedtime. Around ${w.bed}.`]) : '';
    // "where are you?" is just where they are; where they're off to next is only for "where are you headed next?"
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
        ["Same plan. {next} You may know it better than I do by now.", 'Still the plan! Writing it on my hand now so I remember. {next}'],
        ['*replies with a screenshot of the last text*', "At this point you know my schedule better than I do."]],
    hi: [['Hi again!', 'Hi! Hi. Hello! Hi!'], ["Hi! Hi. Hiiii. How many hi's is this? I'm counting.", 'HI. (This is getting fun.)'], ['*waves at the phone*', 'hi hi hi hi hi']],
};
const TEXT_REPEAT_OWN = {
    maki: ['You asked me that a few minutes ago. I have not moved. I do not move without a reason.'],
    coco: ["Girl, are you checking on me? I love it. I'm still {now}. Don't tell anyone where I am. Tell everyone."],
    cuke: ['STILL {NOW}!!! COME JOG WITH ME!!!'], sully: ['Kid. Same place. Relax. Have a frappe.'],
    joe: ["Still {now}! You keep texting me. That's nice. That's very nice. I'm smiling at my phone like a weirdo."],
    clementine: ['Darling, persistence is attractive. Up to a point. We are at the point.'], chili: ["Still here. I was going to move, but then you'd have to ask again. I'm doing you a favor."],
    cece: ["Still {now}! Did the first answer go through? I wasn't sure."], kai: ['Bro. Same spot. Chill. The spot is chill too.'],
};
function repeatReply(id, kind, rep) {
    const w = whereabouts(id), d = NPC_DEFS[id];
    if (w.asleep) return null;
    let line;
    const own = TEXT_REPEAT_OWN[id];
    if (own && rep >= 2 && R() < 0.6) line = rpick(own);
    else line = rpick(TEXT_REPEAT[kind][Math.min(3, rep) - 1]);
    const now = w.now || 'here', next = w.next ? `${cap(w.next.place)} around ${w.next.at}.` : w.bed ? `Bed around ${w.bed}.` : 'Staying put.';
    return line.replace(/\{now\}/g, now).replace(/\{NOW\}/g, now.toUpperCase()).replace(/\{next\}/g, next);
}
function textsOf(id) {
    if (!S.texts) S.texts = {};
    return S.texts[id] || (S.texts[id] = []);
}
function textContacts() {
    const ids = ['joe'].concat(NEIGHBORS, ['fortune', 'floss', 'waffle', 'wasabi']);
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
        if (n && n.sleeping) row.appendChild(el('span', 'openbadge', 'asleep'));
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
            const reply = rep ? repeatReply(id, kind, rep) : textReply(id, kind);
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

