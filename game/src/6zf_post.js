/* ---- 6zf_post.js ---- */
/* The Post Office, for real (on beta with the civic buildings: CIVIC_PREVIEW): letters to the neighbors with a present
   if you like (delivered the next morning; they write back), postcards that turn up in the mail from places far away
   (a collection), now and then a mysterious special delivery, the island's own paper every morning (what Sarah and the
   neighbors did yesterday, the weather, the shops) with an archive of past papers, and tracking for IslandMart orders.
   Each replaces its sample screen (CIVIC_LIVE). The real world's news and weather join the paper once the zip code
   works. A person's letters, postcards and papers are their own (PERSON_KEYS). */
const POST_STAMP = 100, POST_PAPERS = 60;
function post() {
    const P = S.post || (S.post = {});
    if (!P.cards) P.cards = [];
    if (!P.sent) P.sent = [];
    if (!P.papers) P.papers = [];
    return P;
}
function postFree() { return Clock.weekday() === 0; }             // postage is free on Sundays
function postPeople() { return NEIGHBORS.concat(['joe']).filter(id => S.npcs[id] && S.npcs[id].met && NPC_DEFS[id]); }

/* ---------------------------------------------------------------- postcards from far away */
/* [id, name, sky top, sky bottom, land, what's there] */
const POSTCARDS = [
    ['coral', 'Coral Bay', '#5ab8f0', '#d8f2ff', '#f2d8a0', 'palms'], ['puff', 'Mount Puff', '#8ab8f0', '#eaf4ff', '#7aa860', 'peak'],
    ['lantern', 'Lantern Town', '#1e2050', '#4a3a6a', '#3a2a4a', 'lanterns'], ['snowcap', 'Snowcap', '#a8c0e8', '#f0f6ff', '#fbfbfb', 'peak'],
    ['pumpkin', 'Pumpkin Hollow', '#f0a060', '#ffe0b0', '#8a5a34', 'pumpkins'], ['point', 'Lighthouse Point', '#6aa8e0', '#e0f0ff', '#8a9a6a', 'lighthouse'],
    ['cactus', 'Cactus Flats', '#f0b070', '#fff0d0', '#e0b070', 'cacti'], ['tulip', 'Tulip Fields', '#8ac8f0', '#f0f8ff', '#6aa850', 'tulips'],
    ['volcano', 'Volcano Isle', '#e07050', '#ffd0a0', '#4a3a3a', 'volcano'], ['moonlake', 'Moonlit Lake', '#101838', '#2a3a6a', '#1a2a3a', 'moon'],
    ['cherry', 'Cherry Valley', '#a8d0f0', '#fff0f4', '#88b070', 'blossoms'], ['falls', 'Rainbow Falls', '#7ac0f0', '#e8f8ff', '#5a8a5a', 'falls'],
    ['fog', 'Fog Harbor', '#a8b0b8', '#e0e4e8', '#6a7078', 'boats'], ['sunflower', 'Sunflower Farm', '#70b8f0', '#e0f4ff', '#7a9a40', 'sunflowers'],
    ['ice', 'The Ice Palace', '#7a90d0', '#e0e8ff', '#e8f0ff', 'palace'], ['ruins', 'Jungle Ruins', '#78c0a0', '#e0f8e8', '#3a7a4a', 'ruins'],
    ['springs', 'Hot Spring Hills', '#c8a0d8', '#fff0f0', '#8a8a6a', 'steam'], ['starfall', 'Starfall Desert', '#0c1030', '#3a2a5a', '#6a4a3a', 'stars'],
    ['windmill', 'Windmill Plains', '#80c0f0', '#f0f8ff', '#9ab060', 'windmill'], ['aurora', 'Aurora Bay', '#081828', '#1a3a4a', '#2a3a4a', 'aurora'],
    ['coconut', 'Coconut Cove', '#40b0e0', '#c8f0ff', '#f0e0b0', 'palms'], ['pines', 'Pine Ridge', '#90b8e0', '#f0f8ff', '#3a6a4a', 'pines'],
    ['glass', 'Glass Beach', '#60b0e0', '#e8f8ff', '#d8e8e0', 'glass'], ['balloon', 'Balloon Valley', '#f0c080', '#fff4e0', '#8aa860', 'balloons'],
];
const POSTCARD_NOTES = [
    "Greetings from {place}! It's beautiful here. I thought of you right away. (And of snacks.)",
    "{place}! The view is unreal. I bought you nothing, but I'm sending this, which is better.",
    "Hello from {place}! The locals are very nice. One of them is a goose. The goose is less nice.",
    "Wish you were here! {place} is everything the brochure said. The brochure said 'nice.'",
    "Postcard from {place}! I'm having the best time. I miss the island a little. Okay, a lot.",
];
function postcardCanvas(c, W, H) {
    W = W || 96; H = H || 64;
    const [, name, s1, s2, land, what] = c, k = W / 96;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d'), r = mulberry(hash32(c[0]));
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, s1); gr.addColorStop(1, s2); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const night = ['lanterns', 'moon', 'stars', 'aurora'].includes(what);
    if (night) { g.fillStyle = '#ffffff'; for (let i = 0; i < 22; i++) g.fillRect(Math.floor(r() * W), Math.floor(r() * H * 0.55), 1, 1); }
    if (what === 'aurora') { for (let i = 0; i < 3; i++) { g.strokeStyle = ['rgba(90,240,170,0.55)', 'rgba(120,200,255,0.45)', 'rgba(200,120,255,0.35)'][i]; g.lineWidth = 5 * k; g.beginPath(); g.moveTo(0, (14 + i * 6) * k); g.bezierCurveTo(30 * k, (4 + i * 6) * k, 60 * k, (26 + i * 5) * k, W, (10 + i * 6) * k); g.stroke(); } }
    if (what === 'moon') { g.fillStyle = '#fff6d0'; g.beginPath(); g.arc(70 * k, 16 * k, 7 * k, 0, 7); g.fill(); }
    else if (!night && what !== 'fog') { g.fillStyle = '#fff2a0'; g.beginPath(); g.arc(74 * k, 15 * k, 7 * k, 0, 7); g.fill(); }
    // the land: hills, a peak or a beach
    g.fillStyle = land;
    if (what === 'peak' || what === 'volcano') {
        g.beginPath(); g.moveTo(0, H); g.lineTo(0, 46 * k); g.lineTo(34 * k, 14 * k); g.lineTo(62 * k, 44 * k); g.lineTo(W, 40 * k); g.lineTo(W, H); g.fill();
        g.fillStyle = what === 'volcano' ? '#ff7040' : '#ffffff'; g.beginPath(); g.moveTo(26 * k, 22 * k); g.lineTo(34 * k, 14 * k); g.lineTo(42 * k, 22 * k); g.fill();
        if (what === 'volcano') { g.fillStyle = 'rgba(80,70,70,0.6)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc((34 + i * 3) * k, (10 - i * 3) * k, (3 + i) * k, 0, 7); g.fill(); } }
    } else {
        g.beginPath(); g.moveTo(0, H); g.lineTo(0, 44 * k); g.quadraticCurveTo(30 * k, 30 * k, 52 * k, 42 * k); g.quadraticCurveTo(74 * k, 50 * k, W, 40 * k); g.lineTo(W, H); g.fill();
    }
    if (['palms', 'boats', 'lighthouse', 'glass', 'falls'].includes(what) || name.includes('Bay') || name.includes('Cove') || name.includes('Beach')) { g.fillStyle = 'rgba(60,140,210,0.85)'; g.fillRect(0, 52 * k, W, H - 52 * k); }
    const at = (x, y) => [x * k, y * k];
    const dots = (n, col, y0, sz) => { g.fillStyle = col; for (let i = 0; i < n; i++) { const [x, y] = at(8 + i * (80 / n) + r() * 4, y0 + r() * 6); g.fillRect(x, y, sz * k, sz * k); } };
    switch (what) {
        case 'palms': for (const x of [14, 26]) { g.fillStyle = '#7a5234'; g.fillRect(...at(x, 30), 2 * k, 18 * k); g.fillStyle = '#3a8a4a'; g.beginPath(); g.ellipse(...at(x + 1, 30), 9 * k, 3 * k, 0, 0, 7); g.fill(); } break;
        case 'lanterns': for (let i = 0; i < 7; i++) { g.fillStyle = '#ffb040'; g.beginPath(); g.arc(...at(10 + i * 12, 18 + (i % 2) * 6 + r() * 4), 2.5 * k, 0, 7); g.fill(); } break;
        case 'pumpkins': dots(6, '#f08020', 50, 4); break;
        case 'lighthouse': g.fillStyle = '#ffffff'; g.fillRect(...at(70, 20), 6 * k, 26 * k); g.fillStyle = '#d8433b'; g.fillRect(...at(70, 28), 6 * k, 4 * k); g.fillRect(...at(70, 38), 6 * k, 4 * k); g.fillStyle = '#ffe070'; g.fillRect(...at(69, 16), 8 * k, 4 * k); break;
        case 'cacti': for (const x of [20, 50, 76]) { g.fillStyle = '#4a8a4a'; g.fillRect(...at(x, 34), 3 * k, 14 * k); g.fillRect(...at(x - 3, 38), 3 * k, 2 * k); g.fillRect(...at(x - 3, 34), 2 * k, 5 * k); } break;
        case 'tulips': for (let i = 0; i < 4; i++) dots(10, ['#e8443a', '#f4c040', '#f49ac0', '#9a5ad8'][i], 46 + i * 4, 2); break;
        case 'blossoms': for (const x of [18, 40, 66]) { g.fillStyle = '#7a5234'; g.fillRect(...at(x, 34), 2 * k, 12 * k); g.fillStyle = '#ffc0d8'; g.beginPath(); g.arc(...at(x + 1, 32), 7 * k, 0, 7); g.fill(); } break;
        case 'falls': g.fillStyle = 'rgba(230,248,255,0.9)'; g.fillRect(...at(44, 26), 8 * k, 26 * k); g.strokeStyle = 'rgba(255,120,120,0.6)'; g.lineWidth = 2 * k; g.beginPath(); g.arc(...at(48, 40), 18 * k, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); break;
        case 'boats': for (const x of [20, 56]) { g.fillStyle = '#5a4a3a'; g.fillRect(...at(x, 52), 14 * k, 3 * k); g.fillStyle = '#f0f0f0'; g.beginPath(); g.moveTo(...at(x + 7, 38)); g.lineTo(...at(x + 7, 51)); g.lineTo(...at(x + 14, 51)); g.fill(); } break;
        case 'sunflowers': dots(12, '#f4c040', 44, 3); dots(12, '#7a5234', 45, 1); break;
        case 'palace': g.fillStyle = '#e0f0ff'; g.fillRect(...at(36, 26), 24 * k, 18 * k); for (const x of [34, 46, 58]) { g.beginPath(); g.moveTo(...at(x, 26)); g.lineTo(...at(x + 2.5, 14)); g.lineTo(...at(x + 5, 26)); g.fill(); } break;
        case 'ruins': g.fillStyle = '#8a8a7a'; g.fillRect(...at(36, 28), 20 * k, 16 * k); g.fillStyle = '#6a6a5a'; g.fillRect(...at(40, 34), 4 * k, 10 * k); g.fillRect(...at(48, 34), 4 * k, 10 * k); break;
        case 'steam': for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(...at(30 + i * 9, 34 - (i % 2) * 6), 5 * k, 0, 7); g.fill(); } break;
        case 'stars': g.fillStyle = '#ffffff'; for (let i = 0; i < 6; i++) { const [x, y] = at(10 + r() * 76, 6 + r() * 20); g.fillRect(x, y, 2 * k, 1 * k); g.fillRect(x + 0.5 * k, y - 0.5 * k, 1 * k, 2 * k); } break;
        case 'windmill': g.fillStyle = '#f0e8d8'; g.fillRect(...at(60, 24), 8 * k, 20 * k); g.strokeStyle = '#7a5234'; g.lineWidth = 2 * k; g.beginPath(); g.moveTo(...at(52, 16)); g.lineTo(...at(76, 32)); g.moveTo(...at(76, 16)); g.lineTo(...at(52, 32)); g.stroke(); break;
        case 'pines': for (const x of [12, 30, 48, 66, 80]) { g.fillStyle = '#2a5a3a'; g.beginPath(); g.moveTo(...at(x, 46)); g.lineTo(...at(x + 5, 26)); g.lineTo(...at(x + 10, 46)); g.fill(); } break;
        case 'glass': dots(14, '#8ad8c8', 54, 2); dots(10, '#5ab0e0', 56, 2); break;
        case 'balloons': for (const [x, y, c2] of [[20, 14, '#e8443a'], [46, 22, '#f4c040'], [70, 12, '#3a7ad8']]) { g.fillStyle = c2; g.beginPath(); g.arc(...at(x, y), 5 * k, 0, 7); g.fill(); g.fillStyle = '#7a5234'; g.fillRect(...at(x - 1.5, y + 7), 3 * k, 2 * k); } break;
    }
    // a stamp in the corner
    g.fillStyle = '#fbf8f2'; g.fillRect(W - 15 * k, 3 * k, 12 * k, 14 * k);
    g.fillStyle = s1; g.fillRect(W - 13 * k, 5 * k, 8 * k, 10 * k);
    return cv;
}

/* ---------------------------------------------------------------- the island paper */
/* yesterday's numbers, kept just before the new day's count starts (54_events.js) */
function postYesterday() {
    if (!S || !S.dayStats || S.dayStats.day === Clock.dayNum()) return;
    const counts = {};
    for (const k of DAY_STATS) { const n = (S.stats[k] || 0) - (S.dayStats.base[k] || 0); if (n > 0) counts[k] = n; }
    post().yday = { day: S.dayStats.day, counts };
}
const PAPER_STORIES = {
    fish: [n => [`${n} FISH LANDED`, `{name} reeled in ${n} ${plural(n, 'fish', 'fish')} yesterday. Kai says he is "not even mad. Mostly impressed."`]],
    shell: [n => ['BEACH COMBED', `${n} ${plural(n, 'treasure')} picked up along the shore. The crabs have filed a complaint. It was dismissed.`]],
    fruit: [n => ['TREES SHAKEN', `${n} ${plural(n, 'piece')} of fruit came down yesterday. Witnesses describe the trees as "tired."`]],
    cooked: [n => ['SOMETHING SMELLS GOOD', `${n} ${plural(n, 'dish', 'dishes')} cooked at {name}'s kitchenette. Mac asked for the recipe. Then asked again.`]],
    hugs: [n => ['HUGS ON THE RISE', `${n} hugs reported yesterday. Cuke calls it "excellent for circulation."`]],
    gifts: [n => ['A GENEROUS DAY', `${n} ${plural(n, 'present')} handed out. The neighbors are "touched" and "a little worried about storage."`]],
    arcade: [n => ['HIGH SCORES', `${n} arcade ${plural(n, 'game')} played. Chili was seen fanning himself with a ticket.`]],
    dances: [n => ['THE FLOOR IS HOT', `{name} danced at Club Wasabi. Wasabi says the speakers "have never been happier."`]],
    karaoke: [n => ['A STAR SINGS', `{name} sang Joe's poems at the club. Joe cried. Joe always cries. This time more.`]],
    poems: [n => ['POETRY CORNER', `Joe read ${n} ${plural(n, 'poem')} aloud yesterday, at least one of them about a frog.`]],
    gem: [n => ['SPARKLE FOUND', `${n} ${plural(n, 'gem')} dug up. Sully says "wicked shiny."`]],
    sold: [n => ['BUSINESS IS GOOD', `Fortune bought ${n} things yesterday and is "thinking about a bigger shelf."`]],
    wood: [n => ['TIMBER', `${n} pieces of wood chopped. Ginger says the crew could "use a hand like that."`]],
    flowers: [n => ['IN BLOOM', `Flowers picked by the handful. The bees have been informed.`]],
    talks: [n => ['THE ISLAND IS CHATTY', `${n} ${plural(n, 'conversation')} yesterday. Topics included snacks, the weather, and snacks.`]],
    islandGames: [n => ['GAMES ON THE GREEN', `${n} ${plural(n, 'game')} played with the neighbors. Nobody is speaking of the tag incident.`]],
};
const PAPER_QUIET = [['A QUIET DAY', 'Nothing much happened yesterday. A seagull was interviewed. It said "nothing to report." Then it took a fry.'],
    ['ALL CALM', 'The island rested. The waves kept going. Experts say the waves will keep going today too.']];
const PAPER_ADS = ['LOST: one sock. Answers to "Sock." Contact Wonton (not soup).', 'FOR SALE: a lamp. It is a very nice lamp. - Fortune',
    'WANTED: someone to listen to a poem. Just one. Okay, three. - Joe', 'FREE: advice about hot sauce. Unasked for. - Chili',
    'CLASSES: morning jogs at 5 AM. Everyone welcome. No one has come. - Cuke', 'NOTICE: the goat is fine. The goat is always fine.'];
const PAPER_SKY = { sunny: ['Sunny', 'A good day to be outside. Bring a hat.'], cloudy: ['Cloudy', 'Grey skies, cozy vibes. Good day for a book.'],
    rain: ['Rain', "Rain all day. The fish don't mind. Bring an umbrella."], snow: ['Snow', 'Snow! Bundle up. Snowball fights are not banned.'] };
/* today's paper, made once in the morning: the weather, what happened yesterday, a neighbor or two, the shops */
function postMakePaper() {
    const P = post(), day = Clock.dayNum();
    if (P.papers.some(p => p.day === day)) return null;
    const r = mulberry(hash32(S.seed + ':paper:' + day)), stories = [];
    const y = P.yday && P.yday.day >= day - 7 ? P.yday.counts : {};
    for (const k of shuffled(Object.keys(y).filter(k => PAPER_STORIES[k]), r)) if (stories.length < 4) stories.push(rpick(PAPER_STORIES[k], r)(y[k]));
    if (!stories.length) stories.push(rpick(PAPER_QUIET, r));
    const hols = (typeof holidaysToday === 'function' ? holidaysToday() : []).map(h => h.name);
    const met = postPeople(), who = met.length ? NPC_DEFS[rpick(met, r)].name : 'A neighbor';
    const bits = [`${who} was spotted ${rpick(['humming near the pier', 'reading on a bench', 'arguing with a seagull, and losing', 'admiring a cloud', 'jogging, briefly', 'looking for a lost button'], r)}.`];
    try { bits.push(`Fortune's hot item today: ${itemName(shopStock().hot)}. She pays double.`); } catch (e) { /* the shop isn't up yet */ }
    const poem = typeof JOE_POEMS !== 'undefined' ? rpick(JOE_POEMS, r) : null;
    const paper = { day, sky: G.weather || 'sunny', hols, stories, bits, ad: rpick(PAPER_ADS, r), poem: poem ? [poem[0], poem[1].slice(0, 4)] : null, world: zipPage() };
    P.papers.push(paper);
    while (P.papers.length > POST_PAPERS) P.papers.shift();
    return paper;
}
function paperView(b, p) {
    const pp = el('div', 'cv-paper');
    pp.appendChild(el('h3', null, `The ${S.islandName || 'Island'} Gazette`));
    pp.appendChild(el('div', 'cv-dateline', dayDate(p.day) + (p.hols.length ? ' · ' + p.hols.join(', ') : '')));
    const W = p.world, sky = PAPER_SKY[(W && W.sky) || p.sky] || PAPER_SKY.sunny;
    const w = el('div', 'cv-weather');
    w.appendChild(el('b', null, W && W.sky ? `Weather in ${W.town}: ${sky[0]}, high ${W.hi}°, low ${W.lo}°` : `Weather: ${sky[0]}`));
    w.appendChild(el('span', null, sky[1])); pp.appendChild(w);
    // the real world's page, once the island has a zip code (6zh_world.js)
    if (W && W.local && W.local.length) { pp.appendChild(el('h4', null, `${W.town} news`)); for (const t of W.local) { const s = el('div', 'cv-story'); s.appendChild(el('span', null, t)); pp.appendChild(s); } }
    if (W && W.world && W.world.length) { pp.appendChild(el('h4', null, 'The world')); for (const t of W.world) { const s = el('div', 'cv-story'); s.appendChild(el('span', null, t)); pp.appendChild(s); } }
    pp.appendChild(el('h4', null, 'Yesterday on the island'));
    for (const [h, t] of p.stories) { const s = el('div', 'cv-story'); s.appendChild(el('b', null, h)); s.appendChild(el('span', null, fillText(t))); pp.appendChild(s); }
    pp.appendChild(el('h4', null, 'Around town'));
    for (const t of p.bits) { const s = el('div', 'cv-story'); s.appendChild(el('span', null, t)); pp.appendChild(s); }
    if (p.poem) { pp.appendChild(el('h4', null, "Joe's poem corner")); const q = el('div', 'cv-poem', `"${p.poem[0]}"\n${p.poem[1].join('\n')}`); pp.appendChild(q); }
    pp.appendChild(el('h4', null, 'Classifieds'));
    const ad = el('div', 'cv-story'); ad.appendChild(el('span', null, p.ad)); pp.appendChild(ad);
    b.appendChild(pp);
}

/* ---------------------------------------------------------------- each morning (54_events.js) */
function postTick() {
    if (!S || !CIVIC_PREVIEW) return;
    const P = post(), day = Clock.dayNum(), r = mulberry(hash32(S.seed + ':post:' + day));
    // letters Sarah mailed arrive; the neighbors write back
    for (const L of P.sent.filter(l => l.day < day)) {
        P.sent.splice(P.sent.indexOf(L), 1);
        postDeliver(L);
    }
    // a postcard from somewhere far away
    const left = POSTCARDS.filter(c => !P.cards.includes(c[0]));
    const met = postPeople();
    if (left.length && met.length && r() < 0.16) {
        const c = rpick(left, r), from = rpick(met, r);
        P.cards.push(c[0]);
        sendMail({ from, subject: `A postcard from ${c[1]}`, body: `${CV.fill(rpick(POSTCARD_NOTES, r), { place: c[1] })}\n- ${NPC_DEFS[from].name}`, card: c[0] });
    }
    // now and then, a mysterious package
    if (day >= (S.startDay || day) + 5 && (P.special || 0) < day - 6 && r() < 0.1) {
        const rare = Object.keys(FURN).filter(id => ITEMS[id] && FURN[id].price >= 2500 && !FURN[id].prize && !FURN[id].fixture && !FURN[id].pottery && !FURN[id].art && !FURN[id].outdoor);
        if (rare.length) {
            P.special = day;
            sendMail({ from: 'post', subject: 'A special delivery', body: "A package came for you. No return address. No note. Just a stamp with a little star on it.\nThe Post Office doesn't know who sent it. The Post Office has theories.", gift: rpick(rare, r) });
        }
    }
    // a letter for a neighbor that came to Sarah's mailbox by mistake (to take round), or one left too long goes back
    if (P.lost && P.lost.day < day - 3) { removeItem('lost_mail', pocketCount('lost_mail')); P.lost = null; }
    if (!P.lost && met.length && r() < 0.12) {
        const to = rpick(met, r);
        P.lost = { to, day };
        sendMail({ from: 'post', subject: `A letter for ${NPC_DEFS[to].name}?`, body: `This came to your mailbox by mistake. It's addressed to ${NPC_DEFS[to].name}. The handwriting is very loopy.\nCould you take it to them? We'd be ever so grateful.\n- The Post Office`, gift: 'lost_mail' });
    }
    // the paper
    const paper = postMakePaper();
    if (paper) {
        sendMail({ from: 'post', subject: `The ${S.islandName || 'Island'} Gazette`, body: `Today's paper: ${paper.stories[0][0].toLowerCase()}, and more inside.`, paper: day });
    }
    // old papers leave the mailbox after two weeks (they're all in the archive), and the Post Office's own read notes after a month
    S.mail = S.mail.filter(m => !(m.paper != null && m.day < day - 14) && !(m.from === 'post' && m.read && (m.claimed || !m.gift) && m.day < day - 30));
    Save.touch();
}
/* a letter arrives: friendship, the present (or not), and a reply in the mail */
function postDeliver(L) {
    const id = L.to, d = NPC_DEFS[id], nm = S.playerName || 'Sarah';
    if (!d) return;
    S.stats.letters = (S.stats.letters || 0) + 1;
    let pts = 3, giftLine = '', back = null;
    if (L.gift) {
        const bad = id === 'joe' ? null : badGiftKind(id, L.gift);
        if (bad) { back = L.gift; giftLine = `You sent ${aOrAn(itemName(L.gift))} ${itemName(L.gift).toLowerCase()}! I couldn't keep it, though. It's back in this envelope. It barely fit.`; }
        else {
            const tier = id === 'joe' ? 'love' : giftTier(id, L.gift);
            pts += { love: 8, like: 5, neutral: 3, dislike: 1 }[tier];
            giftLine = { love: `And the ${itemName(L.gift).toLowerCase()}! I LOVE it. It's already in the best spot in my house.`, like: `Thank you for the ${itemName(L.gift).toLowerCase()}! It's really nice.`,
                neutral: `Thanks for the ${itemName(L.gift).toLowerCase()}! That was thoughtful.`, dislike: `Thanks for the ${itemName(L.gift).toLowerCase()}. I'll find a place for it. Somewhere.` }[tier];
        }
    }
    addPts(id, pts, 'letter');
    const t = TALK[id], r = mulberry(hash32(S.seed + ':reply:' + id + ':' + L.day));
    const ps = t && t.chat && t.chat.length ? rpick(t.chat, r) : '';
    const open = id === 'joe' ? `Dear ${nm},\nYou wrote me a letter. A real one. With paper. I read it four times.` : `Dear ${nm},\n${rpick(['Thank you for your letter! It made my whole day.', 'I got your letter! I read it twice. Okay, three times.', 'A letter! For me! Nobody writes letters anymore. Except you. And now me.'], r)}`;
    const close = rpick(['Your friend,', 'See you on the island,', 'Write back soon,', 'Love,'], r);
    const body = [open, giftLine, id === 'joe' ? 'I wrote you something back:\n' + (typeof JOE_POEMS !== 'undefined' ? rpick(JOE_POEMS, r)[1].slice(0, 4).join('\n') : '') : (ps ? 'P.S. ' + voiced(id, ps) : ''), `${close}\n${d.name}`].filter(Boolean).join('\n\n');
    sendMail({ from: id, subject: rpick(['Re: your letter', 'Thank you!', 'A letter back!'], r), body, gift: back });
}

/* the lost letter: in the addressee's talk menu (with the island jobs: civicOptions) */
ITEMS.lost_mail = { name: 'A letter (not yours)', type: 'quest', price: 0, icon: 'app_mail' };
function postLostOptions(n) {
    const P = S.post, L = P && P.lost;
    if (!L || L.to !== n.id || !pocketCount('lost_mail')) return [];
    return [{ label: 'This came to me by mistake', fn: async () => {
        removeItem('lost_mail', 1);
        P.lost = null;
        addPts(n.id, 2);
        S.stats.lostMail = (S.stats.lostMail || 0) + 1;
        n.emote = 'heart'; n.emoteT = 70;
        await UI.say(n.id, voiced(n.id, rpick(["My letter! I've been waiting for this! Thank you for bringing it all this way.", "Oh! That's mine! The Post Office mixes us up. It happens. It happens a lot. Thank you!", 'A letter for me? From... oh! I know who this is from. Thank you, really!'])), { keep: true });
        const pay = 100 * rint(2, 5);
        addMoney(pay, true, 'Favors');
        await UI.say(n.id, voiced(n.id, `Here, ${fmtNum(pay)} sand dollars. For the stamp you didn't need. And the walk.`), { keep: true });
        Save.touch();
        return true;
    } }];
}

/* the mailbox's colors (tools/blender/props.py MAILBOX_COLORS: a model each); green is the one it came with */
const MAILBOX_COLORS = [[null, 'Green', '#3d7a4a'], ['red', 'Red', '#c8463a'], ['blue', 'Blue', '#3d6fb6'], ['yellow', 'Yellow', '#e8b83a'],
    ['pink', 'Pink', '#e88aaa'], ['white', 'White', '#ece6dc'], ['black', 'Black', '#3b2f32']];
/* and its styles (tools/blender/props_island.py mailbox_<style>, their bodies take the paint): paid for once, then Sarah's */
const MAILBOX_STYLES = [[null, 'Classic', 0], ['cottage', 'Cottage', 3000], ['fish', 'Fish', 4000], ['lighthouse', 'Lighthouse', 5000]];

/* the mailbox in a style and color, for the Post Office's screen */
function mailboxCanvas(style, col) {
    const cv = document.createElement('canvas'); cv.width = 160; cv.height = 120;
    const g = cv.getContext('2d'), dark = 'rgba(0,0,0,0.15)', lite = 'rgba(255,255,255,0.25)';
    const post = () => { g.fillStyle = '#8a5a34'; g.fillRect(74, 62, 12, 54); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(80, 62, 6, 54); };
    const flag = (x, y, h) => { g.fillStyle = '#d8433b'; g.fillRect(x, y, 5, h); g.fillRect(x, y, 18, 10); };
    if (style === 'cottage') {
        post(); flag(106, 40, 24);
        g.fillStyle = col; g.fillRect(46, 40, 60, 28); g.fillStyle = dark; g.fillRect(46, 62, 60, 6);
        g.fillStyle = '#7a4a3a'; g.beginPath(); g.moveTo(38, 42); g.lineTo(76, 14); g.lineTo(114, 42); g.closePath(); g.fill();
        g.fillStyle = '#b0583e'; g.fillRect(92, 14, 8, 16);
        g.fillStyle = '#f2e8d2'; g.beginPath(); g.moveTo(68, 68); g.lineTo(68, 52); g.arc(76, 52, 8, Math.PI, 0); g.lineTo(84, 68); g.fill();
    } else if (style === 'lighthouse') {
        g.fillStyle = '#c4bcae'; g.fillRect(54, 108, 52, 8);
        for (let i = 0; i < 6; i++) { const y0 = 108 - i * 14, w0 = 34 - i * 2.4, w1 = 34 - (i + 1) * 2.4; g.fillStyle = i % 2 ? '#f4f0e8' : col; g.beginPath(); g.moveTo(80 - w0 / 2 - 6, y0); g.lineTo(80 + w0 / 2 + 6, y0); g.lineTo(80 + w1 / 2 + 6, y0 - 14); g.lineTo(80 - w1 / 2 - 6, y0 - 14); g.fill(); }
        g.fillStyle = '#34343a'; g.fillRect(62, 22, 36, 5); g.fillStyle = '#ffe08a'; g.fillRect(70, 10, 20, 12);
        g.fillStyle = '#c8302a'; g.beginPath(); g.moveTo(66, 10); g.lineTo(80, 0); g.lineTo(94, 10); g.fill();
        g.fillStyle = '#2a2420'; g.fillRect(72, 48, 16, 4); g.fillStyle = '#a8743e'; g.fillRect(76, 98, 8, 10);
    } else if (style === 'fish') {
        post(); flag(104, 30, 26);
        g.fillStyle = col; g.beginPath(); g.ellipse(76, 50, 34, 20, 0, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.moveTo(104, 50); g.lineTo(126, 34); g.lineTo(120, 50); g.lineTo(126, 66); g.fill();
        g.beginPath(); g.moveTo(64, 32); g.lineTo(84, 22); g.lineTo(90, 32); g.fill();
        g.fillStyle = dark; g.fillRect(48, 62, 56, 4); g.fillStyle = lite; g.fillRect(56, 36, 36, 4);
        g.fillStyle = '#e88a7a'; g.beginPath(); g.arc(44, 52, 8, 0, Math.PI * 2); g.fill(); g.fillStyle = '#2a2020'; g.beginPath(); g.arc(43, 52, 5, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(58, 44, 6, 0, Math.PI * 2); g.fill(); g.fillStyle = '#1e1a1a'; g.beginPath(); g.arc(57, 44, 3, 0, Math.PI * 2); g.fill();
    } else {
        // (the one it came with: a rounded box on a post, its flag up)
        post();
        g.fillStyle = col; g.beginPath(); g.moveTo(40, 66); g.lineTo(40, 40); g.arc(68, 40, 28, Math.PI, 0); g.lineTo(96, 66); g.closePath(); g.fill();
        g.fillStyle = lite; g.fillRect(46, 30, 44, 5); g.fillStyle = dark; g.fillRect(40, 60, 56, 6);
        g.lineWidth = 3; g.strokeStyle = 'rgba(59,42,42,0.5)'; g.strokeRect(40, 40, 18, 26);
        g.fillStyle = col === '#c8463a' ? '#f4c040' : '#d8433b'; g.fillRect(100, 26, 5, 34); g.fillRect(100, 26, 18, 10);
    }
    return cv;
}

/* ---------------------------------------------------------------- the screens */
CIVIC_LIVE.letter = {
    draw(b, f, redraw) {
        const P = post(), ppl = postPeople();
        if (!ppl.length) { CV.empty(b, 'Make some friends first! Letters go to neighbors you have met.', 'app_mail'); return; }
        const st = this.st || (this.st = { to: ppl[0], gift: null, text: '' });
        if (!ppl.includes(st.to)) st.to = ppl[0];
        b.appendChild(el('div', 'cv-h', 'To'));
        const who = el('div', 'st-row');
        for (const id of ppl) who.appendChild(chip(NPC_DEFS[id].name, () => { st.to = id; redraw(); }, id === st.to ? 'on' : ''));
        b.appendChild(who);
        const fl = el('label', 'field'); fl.appendChild(el('span', null, 'Letter'));
        const blank = `Dear ${NPC_DEFS[st.to].name},\n\n\nYour friend,\n${S.playerName || 'Sarah'}`;
        const ta = el('textarea', 'cv-letter'); ta.maxLength = 400; ta.value = st.text || blank;
        ta.addEventListener('input', () => { st.text = ta.value; });
        fl.appendChild(ta); b.appendChild(fl);
        const gift = el('div', 'st-row');
        if (st.gift && pocketCount(st.gift)) { gift.appendChild(iconCanvas(itemIcon(st.gift), 32)); gift.appendChild(el('span', null, itemName(st.gift))); gift.appendChild(chip('Take it off', () => { st.gift = null; redraw(); })); }
        else {
            st.gift = null;
            gift.appendChild(chip('Attach a present', async () => {
                const id = await pickFromPocket('Attach a present', s => !importantItem(s.id) && !['lost', 'bag', 'quest', 'tool'].includes(ITEMS[s.id].type), 'Important things and tools stay with you.');
                if (id) st.gift = id;
                civicScreen('letter', null, () => civicMenu('postoffice'));
            }));
        }
        b.appendChild(gift);
        const cost = postFree() ? 0 : POST_STAMP;
        CV.note(b, postFree() ? 'Postage is free today (Sunday)! It arrives tomorrow morning.' : `Postage: ${POST_STAMP} sand dollars (free on Sundays). It arrives tomorrow morning.`);
        if (P.sent.length) CV.note(b, `On the way: ${P.sent.map(l => 'to ' + NPC_DEFS[l.to].name).join(', ')}.`);
        const say = bankMsg(b);
        f.appendChild(btn('Mail it', 'green', () => {
            const text = (st.text || ta.value).trim();
            if (text.replace(/\s/g, '').length <= blank.replace(/\s/g, '').length + 2) return say('err', 'Write a little something first!');
            if (S.money < cost) return say('err', `Postage is ${POST_STAMP} sand dollars, and you have ${fmtNum(S.money)}. Sundays are free!`);
            if (P.sent.some(l => l.to === st.to)) return say('err', `There's already a letter on its way to ${NPC_DEFS[st.to].name}. One a day!`);
            if (cost) addMoney(-cost, true, 'Postage');
            if (st.gift) removeItem(st.gift, 1);
            P.sent.push({ to: st.to, text: text.slice(0, 400), gift: st.gift, day: Clock.dayNum() });
            Sfx.play('item'); Save.touch();
            UI.toast(`Mailed! ${NPC_DEFS[st.to].name} gets it tomorrow morning.`, 'app_mail');
            this.st = null;
            redraw();
        }));
    },
};
CIVIC_LIVE.postcards = {
    draw(b) {
        const P = post();
        if (!P.cards.length) { CV.empty(b, 'No postcards yet. Neighbors who go on trips send them, and some just turn up in the mail.'); return; }
        CV.note(b, `${P.cards.length} of ${POSTCARDS.length} postcards collected`);
        const g = el('div', 'cv-cards');
        for (const c of POSTCARDS) {
            const have = P.cards.includes(c[0]), d = el('div', 'cv-card' + (have ? '' : ' locked'));
            if (have) { d.appendChild(postcardCanvas(c)); d.appendChild(el('span', null, c[1])); }
            else { const cv = document.createElement('canvas'); cv.width = 96; cv.height = 64; const g2 = cv.getContext('2d'); g2.fillStyle = '#d8d0c4'; g2.fillRect(0, 0, 96, 64); d.appendChild(cv); d.appendChild(el('span', null, '?')); }
            g.appendChild(d);
        }
        b.appendChild(g);
    },
};
CIVIC_LIVE.tracking = {
    draw(b) {
        const day = Clock.dayNum(), h = Clock.hourF();
        const orders = S.mail.filter(m => (m.from === 'shop' || (m.from === 'post' && m.gift)) && m.day >= day - 3).slice(-8).reverse();
        if (!orders.length) { CV.empty(b, "Nothing on the way. Order from IslandMart on your laptop and it arrives in the next morning's mail.", 'ic_package'); return; }
        const l = CV.list(b), step = n => { const m = el('div', 'cv-steps'); for (let i = 0; i < 4; i++) m.appendChild(el('i', i < n ? 'on' : null)); return m; };
        for (const m of orders) {
            const what = m.gifts ? m.gifts.map(g => itemName(g)).join(', ') : itemName(m.gift);
            if (m.from === 'post') { CV.row(l, 'ui_present', 'A mysterious package', m.claimed ? 'Delivered. You opened it. Mysterious!' : "A special delivery. No tracking. Very mysterious.", el('span', 'cv-pill', '?')); continue; }
            if (m.day > day) CV.row(l, 'ic_package', what, h < 18 ? 'Ordered today · Packing at IslandMart' : 'On the boat · Arriving tomorrow morning', step(h < 18 ? 1 : 2));
            else if (!m.claimed) CV.row(l, 'ic_package', what, 'Delivered this morning · In your mailbox', step(4));
            else CV.row(l, 'ic_package', what, `Delivered ${m.day === day ? 'today' : dayDate(m.day)} · Collected`, step(4));
        }
    },
};
CIVIC_LIVE.gazette = {
    draw(b) {
        const P = post();
        const p = P.papers[P.papers.length - 1] || postMakePaper();
        if (!p) { CV.empty(b, "Today's paper isn't out yet."); return; }
        paperView(b, p);
        if (!zipState()) CV.note(b, 'The real world\'s news and weather join the paper once you register your zip code at the Town Hall.');
    },
};
CIVIC_LIVE.archive = {
    draw(b) {
        const P = post();
        if (!P.papers.length) { CV.empty(b, 'No papers kept yet. Every morning\'s Gazette goes here.'); return; }
        CV.note(b, `${P.papers.length} ${plural(P.papers.length, 'paper')} kept (the last ${POST_PAPERS} days).`);
        const l = CV.list(b);
        for (const p of P.papers.slice().reverse()) CV.row(l, 'app_mail', dayDate(p.day), p.stories.map(s => s[0].toLowerCase()).join(' · '), null, () => {
            const Q = UI.open({ title: `The Gazette, ${dayDate(p.day)}`, back: () => civicScreen('archive', null, () => civicMenu('postoffice')) });
            Q.body.className = 'pbody cv';
            paperView(Q.body, p);
        });
    },
};
CIVIC_LIVE.mailbox = {
    draw(b, f, redraw) {
        const P = post(), owned = [null].concat(P.styles || []);
        const cur = P.box || null, curS = P.style || null;
        const pick = this.pick !== undefined ? this.pick : cur, pickS = this.pickS !== undefined ? this.pickS : curS;
        const colOf = k => (MAILBOX_COLORS.find(c => c[0] === k) || MAILBOX_COLORS[0]), styleOf = k => (MAILBOX_STYLES.find(c => c[0] === k) || MAILBOX_STYLES[0]);
        const prev = el('div', 'cv-mailbox');
        prev.appendChild(mailboxCanvas(pickS, colOf(pick)[2]));
        b.appendChild(prev);
        b.appendChild(el('div', 'cv-h', 'Style'));
        const st = el('div', 'st-row');
        for (const [k, name, price] of MAILBOX_STYLES) st.appendChild(chip(owned.includes(k) ? name : `${name} · ${fmtNum(price)}`, () => { this.pickS = k; redraw(); }, k === pickS ? 'on' : ''));
        b.appendChild(st);
        b.appendChild(el('div', 'cv-h', 'Color'));
        const sw = el('div', 'swatches');
        for (const [k, name, c] of MAILBOX_COLORS) {
            const s = el('button', 'swatch' + (k === pick ? ' on' : '')); s.type = 'button'; s.style.background = c; s.title = name; s.setAttribute('aria-label', name);
            s.addEventListener('click', () => { this.pick = k; redraw(); });
            sw.appendChild(s);
        }
        b.appendChild(sw);
        CV.note(b, 'Painting is free. A new style is paid for once, then it\'s yours to switch back to any time.');
        if (Online.visitor()) { CV.banner(b, 'info', 'This is ' + Online.name('sarah') + "'s mailbox. You can look, though!"); return; }
        const say = bankMsg(b), buy = !owned.includes(pickS), price = styleOf(pickS)[2];
        const go = btn(buy ? `Buy the ${styleOf(pickS)[1].toLowerCase()} · ${fmtNum(price)}` : 'Paint it', 'green', () => {
            if (buy) {
                if (S.money < price) return say('err', `The ${styleOf(pickS)[1].toLowerCase()} is ${fmtNum(price)} sand dollars, and you have ${fmtNum(S.money)}.`);
                addMoney(-price, true, 'Post Office');
                P.styles = (P.styles || []).concat([pickS]);
            }
            P.box = pick; P.style = pickS;
            this.pick = this.pickS = undefined;
            Sfx.play('fanfare'); Save.touch(); redraw();
            UI.toast(pickS ? `Your mailbox is a ${colOf(pick)[1].toLowerCase()} ${styleOf(pickS)[1].toLowerCase()} now.` : `Your mailbox is ${colOf(pick)[1].toLowerCase()} now.`, 'mailbox');
        });
        go.disabled = !buy && pick === cur && pickS === curS;
        f.appendChild(go);
    },
};
