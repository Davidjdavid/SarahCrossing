/* ---- 6zj_vacations.js ---- */
/* Vacations (David, 27 October: "now and then (rare, and marked on the calendar): a neighbor packs their bags, walks to
   the pier with friends seeing them off, and a boat comes for them; friends get a postcard, good friends a souvenir in the
   mail, and they come home after a few days"). Each neighbor goes away about three times a year, worked out from the
   island's seed (vacationOf: the same whenever you look), never over their own day, a festival they're part of or Sarah's
   birthday, and only one of them at a time (a trip that would clash moves on a few days until it doesn't). On the day they leave they're at the pier from mid-morning with a
   suitcase (two friends come to see them off) and step onto the boat; the days between they're away (makePlan: away);
   the day they're back they step off the boat in the afternoon. The board and its calendar say so ahead of time. */
const VAC_EVERY = 120;
const VAC = {
    maki: { place: 'Kyoto', gift: 'lucky_cat', card: "Kyoto is very tidy. I approve. The temples are precisely as old as the guidebook said.\nI have bowed to eleven deer. They bowed back. Mostly.\nBack soon.\n- Maki" },
    kai: { place: 'Surf Point', gift: 'shell_lamp', card: "DUDE. The waves here are HUGE. I did not surf them. I watched them. Respectfully.\nA seagull took my sunglasses. We're friends now.\nCatch you soon!\n- Kai" },
    basil: { place: 'the Noodle Mountains', gift: 'paper_lantern', card: "The mountains are quiet. The noodles are long. I have found balance.\nThen I lost it on a very steep path. Then I found it again.\nSee you soon.\n- Basil" },
    chili: { place: 'Hot Pepper Valley', gift: 'chili_lights', card: "It's SO hot here. I love it. I fit right in. A pepper waved at me.\nI ate the hottest sauce in the valley. My ears are still ringing.\nBack soon! Save me a ticket.\n- Chili" },
    coco: { place: 'the Big City', gift: 'snow_globe', card: "The city is SO big. Nobody here knows any gossip. Can you imagine?\nI've started some. Just a little. To help.\nTell everyone I said hi. Tell me everything they said back.\n- Coco" },
    cece: { place: 'Cheesecake Bay', gift: 'cake_stand', card: "I'm at Cheesecake Bay! Sorry, I know that's a lot.\nI took a baking class. Mine cracked. The teacher's cracked too! I felt so much better.\nSorry this postcard is short. Sorry!\n- Cece" },
    clementine: { place: 'the Citrus Coast', gift: 'orange_vase', card: "Darling. The Citrus Coast. Everything here is orange. EVERYTHING.\nI have never been more understood.\nI bought three hats. They are all orange. One is a little more orange.\n- Clementine" },
    cuke: { place: 'Pickle Peaks', gift: 'herb_pot', card: "HIKING TRIP! I climbed Pickle Peak twice before breakfast!\nThere's no pickle at the top. I asked. They laughed. I don't know why.\nDrink water! I'll check when I'm back!\n- Cuke" },
    sully: { place: 'Boston', gift: 'boston_sign', card: "Back home in Boston, kid. Wicked good to see the old neighborhood.\nEverybody here calls me a pie. I'm a CAKE. I've corrected four people. Five.\nBack soon. Keep the kiln warm.\n- Sully" },
    ginger: { place: 'the Gingerbread Village', gift: 'mini_windmill', card: "Sarah!\nThe Gingerbread Village has the best-built houses I've ever seen. I've been measuring their porches.\nI fixed a crooked one. Nobody asked. They were very grateful anyway.\n- Ginger" },
    brulee: { place: 'Paris', gift: 'art_seaside', card: "Paris. The museums. The light. The pastries that are also, somehow, art.\nI stood in front of one painting for three hours. It was a painting of a spoon.\nI have notes for our museum.\n- Brulee" },
    mac: { place: 'Cheddar Falls', gift: 'steamer_stack', card: "Cheddar Falls! The waterfall isn't cheese. I checked. Twice.\nI've been eating everything. Research. For the menu.\nDon't let anyone go hungry while I'm gone!\n- Mac" },
    wonton: { place: 'Dumpling Springs', gift: 'lunar_lantern', card: "Greetings from Dumpling Springs! Forty hot springs. NONE of them are soup.\nI asked every one. Very politely.\nI miss my spring, though. Keep it warm.\n- Wonton" },
};
/* festivals a neighbor is part of, and the days nobody should miss */
const VAC_KEEP = new Set(['halloween', 'winterfest', 'toyday', 'newyear', 'lunar', 'feastday', 'egghunt', 'fishoff', 'birthday', 'valentine']);

/* the vacation someone's on, or about to be on, over this day: { id, leave, back, place } (leave and back are day numbers:
   away from mid-morning on leave until the afternoon of back), or null */
function vacationOf(id, day) {
    if (!VAC[id] || !S || !S.flags || !S.flags.introDone) return null;
    for (const v of vacationsNear(id, day)) if (day >= v.leave && day <= v.back) return v;
    return null;
}
/* someone's vacations in the period round this day (cached) */
function vacationsNear(id, day) {
    const base = (S.startDay || 0) + 20, k = Math.floor((day - base) / VAC_EVERY);
    return [k - 1, k].map(i => vacationIn(id, i)).filter(Boolean);
}
function vacationIn(id, k) {
    const c = vacationIn.cache || (vacationIn.cache = {}), key = S.seed + ':' + id + ':' + k;
    if (c[key] !== undefined) return c[key];
    c[key] = null;
    if (k < 0) return null;
    const base = (S.startDay || 0) + 20, r = mulberry(hash32(S.seed + ':vac:' + id + ':' + k)), len = 3 + Math.floor(r() * 3);
    // (each neighbor's turn falls at its own point in the period, so they don't all go in the same week)
    const span = VAC_EVERY - len - 2, start = (hash32(S.seed + ':vacoff:' + id) % 90 + Math.floor(r() * 20)) % span;
    const clash = (leave, back) => {
        for (let d = leave; d <= back; d++) {
            const dt = new Date(d * 86400e3), hs = holidaysOn(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
            if (hs.some(h => h.npc === id || VAC_KEEP.has(h.id))) return true;
        }
        // one at a time: whoever comes first in the list has their trip settled first
        for (const o of Object.keys(VAC)) {
            if (o === id) break;
            for (const w of [k - 1, k, k + 1].map(i => vacationIn(o, i)).filter(Boolean)) if (w.leave <= back + 1 && w.back >= leave - 1) return true;
        }
        return false;
    };
    for (let t = 0; t < span; t += 3) {
        const leave = base + k * VAC_EVERY + (start + t) % span, back = leave + len;
        if (!clash(leave, back)) return (c[key] = { id, leave, back, place: VAC[id].place });
    }
    return null;
}
/* away all day (between leaving and coming back) */
function onVacation(id, day) { const v = vacationOf(id, day == null ? Clock.dayNum() : day); return !!v && (day == null ? Clock.dayNum() : day) > v.leave && (day == null ? Clock.dayNum() : day) < v.back; }
/* off the island right now (counting the afternoon they left and the morning they're back) */
function awayNow(id) {
    const day = Clock.dayNum(), v = vacationOf(id, day), h = dayHour();
    return !!v && (day > v.leave || h >= VAC_LEAVE + 0.75) && (day < v.back || h < VAC_BACK);
}
const VAC_LEAVE = 10, VAC_BACK = 15;
/* a vacation in the next few days (a storyline won't cast them) */
function vacationSoon(id, days = 6) { const day = Clock.dayNum(); for (let d = day; d <= day + days; d++) if (vacationOf(id, d)) return true; return false; }

/* the day's plan on a vacation: away, or the morning they leave (to the pier with their bags, onto the boat), or the
   afternoon they're back (off the boat, then home and the rest of their day); null on any other day */
function vacationPlan(id, day, plan) {
    const v = vacationOf(id, day);
    if (!v) return null;
    if (day > v.leave && day < v.back) return { day, wake: 0, bed: 0, segs: [], away: true, vacation: v };
    if (day === v.leave) {
        const segs = plan.segs.filter(s => s.a < VAC_LEAVE).map(s => Object.assign({}, s, { b: Math.min(s.b, VAC_LEAVE) }));
        segs.push({ a: VAC_LEAVE, b: VAC_LEAVE + 0.75, spot: 'pier', bags: true });
        return Object.assign({}, plan, { wake: Math.min(plan.wake, VAC_LEAVE), bed: VAC_LEAVE + 0.75, segs, sleepAt: 'boat', vacation: v });
    }
    const segs = [{ a: VAC_BACK, b: VAC_BACK + 0.4, spot: 'pier', bags: true }].concat(plan.segs.filter(s => s.b > VAC_BACK + 0.4).map(s => Object.assign({}, s, { a: Math.max(s.a, VAC_BACK + 0.4) })));
    return Object.assign({}, plan, { wake: VAC_BACK, segs, wakeAt: 'boat', vacation: v });
}
/* two friends come down to the pier to see them off (worked out from the seed, among those up and about) */
function vacationOverride(id, day) {
    for (const o of Object.keys(VAC)) {
        if (o === id) continue;
        const v = vacationOf(o, day);
        if (!v || v.leave !== day) continue;
        const pals = Object.keys(VAC).filter(x => x !== o && !vacationOf(x, day)).sort((a, b) => hash32(S.seed + ':pal:' + o + a) - hash32(S.seed + ':pal:' + o + b)).slice(0, 2);
        if (pals.includes(id)) return [['pier', VAC_LEAVE - 0.1, VAC_LEAVE + 0.9]];
    }
    return null;
}

/* the mail: a postcard the day after they leave (anyone who's met them), a souvenir the day they're back (good friends) */
function vacationTick() {
    if (Online.visitor()) return;
    const day = Clock.dayNum();
    for (const id of Object.keys(VAC)) {
        const v = vacationOf(id, day), r = rel(id);
        if (!v || !r.met) continue;
        const key = 'vac' + id + v.leave;
        if (day === v.leave + 1 && !S.flags[key + 'c']) {
            S.flags[key + 'c'] = 1;
            sendMail({ from: id, subject: `A postcard from ${v.place}`, body: VAC[id].card });
        }
        if (day === v.back && hearts(id) >= 3 && !S.flags[key + 's']) {
            S.flags[key + 's'] = 1;
            sendMail({ from: id, subject: "I'm back! I brought you something", body: `Hi!\nI'm home from ${v.place}. I saw this and thought of you, so I got two. One's for me.\nCome say hi!\n- ${NPC_DEFS[id].name}`, gift: VAC[id].gift });
        }
    }
}
/* what they say about it: the few days before they go, and the day they're back */
function vacationLine(id) {
    const day = Clock.dayNum();
    for (let d = day; d <= day + 3; d++) {
        const v = vacationOf(id, d);
        if (!v) continue;
        if (v.leave === day && !awayNow(id)) return `I'm off to ${v.place} this morning! The boat's at ${fmtClock(VAC_LEAVE + 0.75)}. My suitcase is SO full.`;
        if (v.leave > day) return `I'm going on vacation ${v.leave - day === 1 ? 'tomorrow' : 'in ' + (v.leave - day) + ' days'}! To ${v.place}. I'll send you a postcard!`;
        if (v.back === day && day === d) return `I'm back from ${v.place}! It was wonderful. But I missed the island. Did you get my postcard?`;
    }
    return null;
}
/* the board and the calendar: who's away, who's going */
function vacationEvents(dn) {
    const out = [];
    for (const id of Object.keys(VAC)) {
        const v = vacationOf(id, dn);
        if (!v) continue;
        const nm = NPC_DEFS[id].name;
        out.push(v.leave === dn ? { icon: 'ui_present', name: `${nm} leaves for ${v.place}`, note: `The boat leaves the pier at ${fmtClock(VAC_LEAVE + 0.75)}. Come say goodbye!` }
            : v.back === dn ? { icon: 'ui_present', name: `${nm} is back`, note: `Home from ${v.place} on the ${fmtClock(VAC_BACK)} boat.` }
            : { icon: 'ui_present', name: `${nm} is on vacation`, note: `In ${v.place}. Back ${v.back - dn === 1 ? 'tomorrow' : 'in ' + (v.back - dn) + ' days'}.` });
    }
    return out;
}
