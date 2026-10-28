/* ---- 6zzb_profiles.js ---- */
/* The Friends app's profiles (David's last list, 27 October: "fuller profiles: personality, who they're friends with, what
   they like doing, memories with Sarah"). A tap on a friend opens their page: their picture, hearts and what kind of
   person they are; what they do on the island and where they live; what they call Sarah and their catchphrase; what they
   love, like doing and where they like to be (their favorite spot once they've told her, 6zm_friendship.js); who their
   friends are (6zn_bonds.js) and who they're dating; and what they've done with Sarah (the memories they keep, the
   milestones, gifts). Only what Sarah would know: a favorite spot after they've said, the day's plan only where plans
   show (plansShown). */
const PERSONA = {
    maki: ['Neat and precise', 'Keeps everything exactly where it belongs, and measures twice. Kinder than the measuring lets on.'],
    kai: ['Laid-back surfer', 'Lives for the next wave and good vibes. Sand gets everywhere. It\'s a lifestyle.'],
    basil: ['Calm and warm', 'Runs the noodle cart at night. There is always something simmering.'],
    wonton: ['Serene', 'Spends the days in the hot spring, perfectly still. Not soup.'],
    chili: ['Fiery, secretly soft', 'Runs the arcade and hates losing. Likes the quiet more than anyone knows.'],
    coco: ['Chatty and sweet', 'Hears the island\'s news first and passes it on gently. Mostly gently.'],
    cece: ['Shy and apologetic', 'Always just baking something. Says sorry for things that need no sorry.'],
    clementine: ['Stylish and dramatic', 'Runs the boutique. Everything is orange, darling, and that is the point.'],
    cuke: ['Bursting with energy', 'Up at four, jogging the orchard, then out tending the farm. Always has water.'],
    sully: ['Gruff, big-hearted', 'From Boston by way of a long story. Runs the pottery studio. The coffee is always on.'],
    ginger: ['Practical builder', 'Builds the houses and moves them overnight. Does everything sturdily.'],
    brulee: ['Artistic and gentle', 'Keeps the museum and its stories. Everything is art if you squint.'],
    mac: ['Motherly cook', 'Runs the restaurant and worries you haven\'t eaten. You haven\'t, have you?'],
    joe: ['Sweet and poetic', 'Writes poems in every spare minute. Likes rhyming, takeout and frogs. And you, most of all.'],
    scampi: ['Salty old sea captain', 'A giant shrimp the sea washed up on the beach. Built a ship, sailed away, came back to stay, and farms now.'],
    mug: ['Old-fashioned', 'A living mug from the days when everyone was dishware. Runs the café, and is still getting used to talking food.'],
    goat: ['A goat', 'Lives at the farm. Likes being petted, and eating things that aren\'t food.'],
};
/* where each one works (their day's work places: NPC_DEFS work) */
const WORK_NAMES = { cart: "the noodle cart (evenings)", arcade: 'the arcade', boutique: 'the boutique', studio: 'the pottery studio', builder: "the workshop",
    museum: 'the museum', restaurant: "Mac's", shop: "Fortune's", club: 'Club Wasabi', farm: 'the farm', cafe: "the café", salon: 'the salon', displays: "Waffle's" };
/* their favorite spots, as they'd put it (FAV_SPOT's keys) */
const FAV_NAMES = { bench_pond: 'The bench by the pond', pier_end: 'The very end of the pier', bonfire: 'The bonfire on the beach, late at night', spring: 'The hot spring',
    lookout: 'The lookout', plaza: 'The square', bench_beach: 'The bench at the beach', boardwalk: 'The Boardwalk at sunset', orchard: 'The orchard',
    harbor: 'Down by the harbor', oldtree: 'The big old tree in the forest', meadow: 'The meadow up the hill', statue: 'The statue' };
/* what they've done with Sarah, said short (S.npcs[id].mem) */
const MEM_SHORT = { gift: 'You gave them {item}', game: 'You had a {game} together', favor: 'You helped them out', visit: 'You came over to their house',
    gather: 'A night out with the whole island', newyear: 'You counted down to the new year together', coffee: "Coffee together at Muggy's", lost: 'You found their {what}', bench: 'You sat on a bench together',
    lunch: "Lunch together at Mac's", hang: 'You hung out {place}', letter: 'You wrote them a letter', photo: 'You took a photo with them in it',
    catch: 'You gave them a catchphrase: "{phrase}"' };

function agoWords(day) {
    const n = Clock.dayNum() - day;
    return n <= 0 ? 'today' : n === 1 ? 'yesterday' : n < 14 ? `${n} days ago` : dayDate(day);
}
function profilePic(id) {
    const d = NPC_DEFS[id];
    // (the HD picture, drawn at three canvas pixels to one: hdNpcFrame's { c, w, h })
    const f = HD_NPC[id] && hdNpcFrame(id, 0), c = f && f.c;
    if (c) { const k = document.createElement('canvas'); k.width = c.width; k.height = c.height; k.getContext('2d').drawImage(c, 0, 0); k.className = 'prof-pic'; return k; }
    const ic = iconCanvas(d.human ? `${d.human}_down_stand` : `${d.sprite}_0`, 96);
    ic.className = 'prof-pic px';
    return ic;
}
function appProfile(id) {
    const d = NPC_DEFS[id], r = S.npcs[id] || {}, P = UI.open({ title: d.name, phone: true, back: () => appFriends() });
    const head = el('div', 'prof-head');
    head.appendChild(profilePic(id));
    const who = el('div', 'prof-who');
    who.appendChild(el('b', null, d.name));
    if (PERSONA[id]) who.appendChild(el('span', 'prof-kind', PERSONA[id][0]));
    if (id !== 'goat') who.appendChild(el('span', 'hearts', heartStr(hearts(id))));
    head.appendChild(who);
    P.body.appendChild(head);
    if (PERSONA[id]) P.body.appendChild(el('p', null, PERSONA[id][1]));
    const facts = el('dl', 'prof-facts'), fact = (k, v) => { if (!v) return; facts.appendChild(el('dt', null, k)); facts.appendChild(el('dd', null, v)); };
    // what they do and where they live
    const work = [...new Set((d.work || []).map(w => WORK_NAMES[w[0]] || bldName(w[0])))];
    if (id === FARMER || (typeof NEIGHBORS !== 'undefined' && id === 'scampi' && NEIGHBORS.includes('scampi'))) work.push('the farm');
    if (id === FISHER) work.push('fishing off the pier');
    if (id === 'mug' && typeof cafeOpen === 'function' && cafeOpen()) work.push("the café");
    fact('Works at', [...new Set(work)].join(', ') || null);
    fact('Lives', d.spring ? 'In the hot spring' : d.house && W0.buildings[d.house] ? 'In the neighborhood' : id === 'goat' ? 'At the farm, in the pen' : null);
    if (r.nick) fact('Calls you', `"${r.nick}"`);
    const cp = typeof catchOf === 'function' && catchOf(id);
    if (cp) fact('Says', `"${cp}"`);
    // what they love and like doing (the designer's likes first, then their own favorite)
    if (TALK[id]) fact('Loves', lovesText(id));
    const acts = Object.keys(LIKE_ACTS).filter(k => (Design.like(id, 'acts', k) || 0) >= 2);
    if (!acts.length && IDLE_LIKES[id]) acts.push(IDLE_LIKES[id]);
    if (acts.length) fact('Likes', listWords(acts.map(k => LIKE_ACTS[k].toLowerCase()), 4));
    if (r.ms2 && FAV_SPOT[id]) fact('Favorite spot', FAV_NAMES[FAV_SPOT[id][0]] || landmarkName(FAV_SPOT[id][0], FAV_SPOT[id][0]));
    // their friends
    if (TALK[id] || id === 'joe') {
        const close = bondPeople().filter(o => o !== id && bond(id, o) >= BOND_CLOSE && S.npcs[o] && S.npcs[o].met).sort((a, b) => bond(id, b) - bond(id, a));
        const best = bestFriendOf(id), out = fellOutWith(id), partner = coupleOf(id);
        if (best) fact('Best friend', NPC_DEFS[best].name + (close.length > 1 ? `, and close with ${listWords(close.filter(o => o !== best).map(o => NPC_DEFS[o].name), 3)}` : ''));
        if (partner) fact('Dating', NPC_DEFS[partner].name);
        if (out) fact('Not speaking to', NPC_DEFS[out].name);
    }
    if (typeof vacationOf === 'function' && TALK[id]) { const v = awayNow && awayNow(id); if (v) fact('Right now', 'Away on vacation'); }
    P.body.appendChild(facts);
    // with Sarah
    if (id !== 'goat' && r.met) {
        P.body.appendChild(el('h3', null, 'You two'));
        const L = el('div', 'list');
        const line = (text, sub) => { const row = el('div', 'row'); const t = el('div', 't'); t.appendChild(el('b', null, text)); if (sub) t.appendChild(el('span', null, sub)); row.appendChild(t); L.appendChild(row); };
        if (r.ms5) line('Best friends', 'since ' + dayDate(r.ms5));
        else if (r.ms2) line('Friends', 'since ' + dayDate(r.ms2));
        if (r.advice != null && ADVICE[id]) line('Took your advice', `"${ADVICE[id].a[r.advice]}"`);
        if (r.given) line(`${r.given} gift${r.given === 1 ? '' : 's'} from you`, null);
        if (r.photo) line('Gave you their photo', null);
        for (const m of (r.mem || []).slice().reverse()) {
            const t = MEM_SHORT[m.k];
            if (!t) continue;
            line(t.replace('{item}', m.item && ITEMS[m.item] ? 'a ' + itemName(m.item).toLowerCase() : 'a present').replace('{game}', GAME_WORDS[m.game] || 'game').replace('{what}', m.what || 'thing')
                .replace('{place}', m.place || 'together').replace('{phrase}', m.phrase || ''), agoWords(m.day));
        }
        if (!L.children.length) L.appendChild(el('p', 'muted', 'Nothing yet. Say hi, give a gift, play a game!'));
        P.body.appendChild(L);
    }
    const wb = id === 'goat' || !plansShown() ? null : wakeBed(id);
    if (wb) { const row = el('div', 'st-row'); row.appendChild(chip("Today's plan", () => appDayPlan(id))); P.body.appendChild(row); }
}
