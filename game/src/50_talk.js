/* ---- 50_talk.js ---- */
/* Talking to people: neighbors, Joe, visitors, the shop, the goat */
const HEARTS = [0, 10, 25, 45, 70, 100];
const RECIPE_FROM = {
    maki: ['tuna_roll', 'spicy_tuna', 'unagi_don'], kai: ['salmon_poke', 'ahi_poke'], basil: ['pad_thai', 'green_curry', 'mango_sticky', 'tom_yum'],
    wonton: ['dumplings', 'edamame_bowl'], chili: ['chili_crisp', 'mapo_tofu', 'kungpao', 'cuke_salad'], coco: ['truffles', 'choc_cheesecake'],
    cece: ['cheesecake', 'cherry_cheesecake'], clementine: ['lychee_ice'], cuke: ['stir_fry'], sully: ['lobster_roll', 'chowder'],
    ginger: ['gingerbread'], brulee: ['creme_brulee'], mac: ['mac_cheese', 'tomato_soup'],
};
function rel(id) {
    if (!S.npcs[id]) S.npcs[id] = { met: false, pts: id === 'joe' ? 100 : 0, talkDay: -1, giftDay: -1, gifts: 0, favor: null, photo: false, letter: false, last: '' };
    return S.npcs[id];
}
function hearts(id) { const p = rel(id).pts; let h = 0; for (let i = 1; i < HEARTS.length; i++) if (p >= HEARTS[i]) h = i; return h; }
/* friendship earned over days (David, 28 October): a kind of thing (a favor, a hangout, a letter...) counts once a day with
   each neighbor; the first talk and a gift each have their own day already (talkDay, giftDay) */
function addPts(id, n, kind) {
    const r = rel(id);
    if (kind) {
        const day = Clock.dayNum();
        if (!r.got || r.got.day !== day) r.got = { day };
        if (r.got[kind]) return 0;
        r.got[kind] = 1;
    }
    const before = hearts(id);
    r.pts = Math.min(120, r.pts + n);
    const after = hearts(id);
    Save.touch();
    return after > before ? after : 0;
}
function heartStr(h) { return '\u2665'.repeat(h) + '\u2661'.repeat(5 - h); }
function partOfDay() { const h = Clock.hourF(); return h < 5 ? 'night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night'; }

async function talkTo(n) {
    if (G.busy) return;
    if (IslandGames.has(n)) { IslandGames.poke(n); return; }
    G.busy++;
    if (n.chat) Chats.end(n.chat);
    n.idleWas = n.idle ? n.idle.kind : n.want && n.want.carry && n.want.carry !== 'suitcase' ? n.want.carry : null;      // (caught in the middle of something: 33kd_doll_idle.js)
    n.talking = true;
    const p = G.player;
    // (from wherever Sarah is: nobody steps round anyone first; the two of them turn to each other, the food folks too,
    // so in the new look nobody talks with their back turned)
    faceToward(p, n);
    if (!n.def.spring && !n.def.shop) { faceToward(n, p); if (!n.def.human) n.flip = p.x < n.x; }
    try {
        const id = n.id;
        if (Online.visitor() && await visitorTalk(n)) { /* a visitor's own conversation (6y_visitors.js) */ }
        else if (await Invites.talk(n)) { /* a lunch, a hangout, news or a present Sarah said yes to */ }
        else if (id === 'goat') await goatTalk(n);
        else if (id === 'fortune') await fortuneTalk(n);
        else if (id === 'floss') { rel('floss').met = true; await flossTalk(n); }
        else if (id === 'waffle') { rel('waffle').met = true; await waffleTalk(n); }
        else if (id === 'wasabi') await wasabiTalk(n);
        else if (id === 'joe') await joeTalk(n);
        else if (id === 'basil' && n.spotKey === 'cart') await noodleCart(n);
        else if (n.def.newcomer && await newcomerTalk(n)) { /* a neighbor still to come: their story (6zr_seafarer.js) */ }
        else await neighborTalk(n);
    } catch (e) { console.error(e); }
    UI.hideDialog();
    n.talking = false;
    G.busy--;
    HUD.update();
}

/* the old chat pool (still used for the noodle cart, benches and a few other places) */
function chatLine(n) {
    const id = n.id, t = TALK[id], r = rel(id);
    if (id === 'chili' && n.area === 'arcade' && R() < 0.6) return rpick(chiliLines());
    if (AREA_TALK[n.area] && !(ROOMS[n.area] && ROOMS[n.area].staff === id) && R() < 0.45) return rpick(AREA_TALK[n.area]);
    if ((n.spotKey === 'rope_a' || n.spotKey === 'rope_b') && R() < 0.7) return rpick(id === 'cuke' ? ROPE_TALK_CUKE : ROPE_TALK);
    const pool = t.chat.slice();
    if (BACK_CHAT[id] && backRoomOpen()) pool.push(BACK_CHAT[id]);
    const w = G.weather, h = Clock.hourF();
    if ((w === 'rain' || w === 'snow') && t.rain) pool.push(...t.rain, ...t.rain);
    if ((h >= 21 || h < 4) && t.night) pool.push(...t.night, ...t.night);
    if (Clock.season() === 'winter' && t.winter) pool.push(...t.winter);
    let line, tries = 0;
    do { line = rpick(pool); } while (line === r.last && tries++ < 5);
    r.last = line;
    return line;
}

/* ---------------------------------------------------------------- the rules of friendship
   - the first chat of the day makes a friend a little happier (a heart pops up)
   - after a real talk, Talk rests for five minutes (come back too soon and they say so)
   - one gift a day (a gift that makes no sense gets handed back, with an explanation)
   - Joe starts at five hearts and loves every gift. Friendship never goes down. */
const TALK_REST_MS = 5 * 60 * 1000;
function talkResting(r) { const now = Date.now(); return !!r.talkAt && now >= r.talkAt && now - r.talkAt < TALK_REST_MS; }
function restLeft(r) { return Math.max(0, Math.ceil((TALK_REST_MS - (Date.now() - r.talkAt)) / 60000)); }
function tooSoonLine(n) {
    const id = n.id, r = rel(id);
    if (r.soonFor !== r.talkAt) { r.soonFor = r.talkAt; r.soon = 0; }
    r.soon = (r.soon || 0) + 1;
    const lvl = Math.min(3, r.soon) - 1;
    const own = TOO_SOON[id];
    const line = own && own[lvl] ? rpick([].concat(own[lvl])) : rpick(TOO_SOON_ANY[lvl]);
    return line.replace('{min}', String(restLeft(r))).replace('{mins}', plural(restLeft(r), 'minute'));
}
function heartPop(n) {
    n.emote = 'heart'; n.emoteT = 70;
    Sfx.play('heart');
    if (typeof Voices !== 'undefined') Voices.chirp(n.id);
}

async function neighborTalk(n) {
    const id = n.id, t = TALK[id], r = rel(id), day = Clock.dayNum();
    if (id === 'wonton' && !hourIn(Clock.hourF(), NPC_DEFS.wonton.wake, NPC_DEFS.wonton.bed)) { await UI.say(id, rpick(t.asleep)); return; }
    if (!r.met) {
        r.met = true;
        await UI.say(id, t.intro);
        if (id === 'kai' && !pocketCount('rod') && !S.flags.rod) {
            S.flags.rod = true;
            G.player.pose = 'cheer'; G.player.poseT = 40;
            Sfx.play('fanfare');
            receive('rod', 1);
            await UI.say(null, 'Sarah got a fishing rod! Face the water and press A (or tap the water) to cast.');
        }
        await teachRecipe(id, true);
        r.talkDay = day;
        r.talkAt = Date.now();
        addPts(id, 4);
        Save.touch();
        return;
    }
    const resting = talkResting(r);
    // birthday / holidays
    const special = holidayLine(id);
    let firstToday = false;
    if (r.talkDay !== day) {
        r.talkDay = day;
        firstToday = true;
        const up = addPts(id, isHoliday('friendday') ? 4 : 2 + bonusCharm());
        const mine = holidaysToday().find(h => h.npc === id);
        heartPop(n);
        // (back after weeks away: they missed her, 6zm_friendship.js)
        const missed = r.missed && !special && !mine;
        if (r.missed) { r.missed = 0; r.faded = 0; }
        if (!mine) await UI.say(id, missed ? voiced(id, rpick(MISSED_LINES)) : special || openerLine(n, true), { keep: true });
        if (up) await heartUp(n, up);
        if (mine) await npcDayGift(n);
    } else if (special && R() < 0.4 && !resting) await UI.say(id, special, { keep: true });
    // somebody redid their house
    if (r.houseNews) await houseReaction(n);
    // going on vacation soon, or just back (6zj_vacations.js)
    const vac = vacationLine(id);
    if (vac && r.vacDay !== day) { r.vacDay = day; await UI.say(id, voiced(id, vac), { keep: true }); }
    // a red envelope on Lunar New Year (6zp_holiday_events.js)
    await lunarHello(n, firstToday);
    // in the middle of something of their own: a book, an ice cream, the stars
    if (n.idleWas && IDLE_HELLO[n.idleWas]) await UI.say(id, voiced(id, rpick(IDLE_HELLO[n.idleWas])), { keep: true });
    n.idleWas = null;
    // something they did together lately (some days)
    const mem = firstToday && R() < 0.6 ? memoryLine(id) : null;
    if (mem) await UI.say(id, voiced(id, mem), { keep: true });
    // good friends now: can they call her something? (once: 6zl_nicknames.js)
    const nick = firstToday && hearts(id) >= 4 && !r.nickAsked && NICK_IDEAS[id];
    if (nick) await nickAsk(n);
    // a new heart, something new they share: personal, advice, a gift for her house, best friends (6zm_friendship.js)
    else await friendMilestone(n);
    // photo at five hearts
    if (hearts(id) >= 5 && !r.photo) {
        r.photo = true;
        await UI.say(id, "Hey. I want you to have this. It's my photo. Don't make it weird.", { keep: true });
        receive('photo_' + id, 1);
        Sfx.play('fanfare');
    }
    // lost something? (or found it again on their own)
    const lostLine = ownerLostLine(n);
    if (lostLine && r.lostAskDay !== day) { r.lostAskDay = day; n.emote = 'sweat'; n.emoteT = 60; await UI.say(id, voiced(id, lostLine), { keep: true }); }
    const gave = S.lost && S.lost.gaveUp;
    if (gave && gave.owner === id && !gave.told) { gave.told = true; await UI.say(id, voiced(id, `Oh! I found my ${ITEMS[gave.id].what}. It was in my other pocket the whole time. I don't have another pocket. I don't know how.`), { keep: true }); }
    // a favor they forgot about, a quest they're part of
    await Requests.onGreet(n, firstToday);
    // today's island drama comes up first, if there is any
    const tea = Drama.lineFor(n);
    if (tea) await UI.say(id, isHoliday('pirateday') && R() < 0.6 ? rpick(['Arr! ', 'Ahoy! ', 'Yarr. ']) + tea : tea, { keep: true });
    else if (resting && !firstToday) await UI.say(id, voiced(id, tooSoonLine(n)), { keep: true });
    else if (!firstToday) await UI.say(id, openerLine(n, false), { keep: true });
    const hadFavor = !!Requests.from(id);
    if (firstToday && !resting) await Requests.maybeAsk(n);
    // (now and then they'd like to play: 6zw_island_games.js; then the game starts and the talk ends)
    if (!resting && (hadFavor || !Requests.from(id)) && await igMaybeAsk(n)) return;
    for (;;) {
        const opts = [], acts = [];
        const add = (label, fn) => { opts.push(label); acts.push(fn); };
        if (!talkResting(r)) add('Talk', async () => { await justTalk(n, () => topicLine(n)); return true; });
        if (r.giftDay !== day) add('Here, a gift', async () => { await giftFlow(n); return !giftTaken(r); });
        // a good friend takes a new catchphrase (6zk_catchphrases.js)
        if (hearts(id) >= 4 && r.catchDay !== day && CATCH[id]) add('New catchphrase?', async () => { await catchFlow(n); return true; });
        if (r.nickAsked && hearts(id) >= 4 && r.nickDay !== day) add('Call me something else?', async () => { await nickFlow(n); return true; });
        for (const o of Requests.options(n)) add(o.label, o.fn);
        for (const o of Quests.options(n)) add(o.label, o.fn);
        for (const o of civicOptions(n)) add(o.label, o.fn);
        for (const o of valentineOptions(n)) add(o.label, o.fn);
        for (const o of mugOptions(n)) add(o.label, o.fn);          // (the museum's old pot: 6zs_mug.js)
        for (const o of stampOptions(n)) add(o.label, o.fn);        // (Museum Day's stamp rally: 6zzd_museumday.js)
        for (const o of seaOptions(n)) add(o.label, o.fn);          // (Shrimpy's stall at the farm: 6zr_seafarer.js)
        for (const o of Drama.options(n)) add(o.label, async () => { await Drama.choose(n, o); return true; });
        if (id === 'sully' && n.area === 'studio') add('Pottery tips?', async () => { await UI.say(id, rpick(POTTERY_TIPS).map(bostonize), { keep: true }); return true; });
        if (id === 'chili' && n.area === 'arcade') add('Prize counter', async () => { UI.hideDialog(); await prizeCounter(); return false; });
        if ((n.spotKey === 'rope_a' || n.spotKey === 'rope_b') && !!Rope.turners()) add('Jump rope!', async () => { setTimeout(() => Rope.ask(), 60); return false; });
        if (IslandGames.list(n).length) add("Let's play!", () => IslandGames.offer(n));
        const work = WORK_MENUS[id] && n.area === WORK_MENUS[id].room ? WORK_MENUS[id] : null;
        if (work) add(work.label, async () => { await work.fn(n); return false; });
        if (hasLostFor(id)) add(`Found your ${ITEMS[S.lost.cur.id].what}!`, async () => { await returnLost(n); return true; });
        add('See you!', async () => { await UI.say(id, rpick(['See you around!', 'Bye, {name}!', 'Later!', 'Okay! Bye!'])); return false; });
        const k = await UI.ask(id, talkResting(r) ? rpick(['Anything else?', 'So!', 'Mm-hm!', 'What else?']) : rpick(['Anyway!', 'So!', 'What else is new?', 'Mm-hm!']), opts, { keep: true });
        const again = await acts[k]();
        if (!again) return;
    }
}
function giftTaken(r) { return r.giftDay === Clock.dayNum(); }

/* ---------------------------------------------------------------- just talking */
/* a fresh line every time (never the one they just said); then Talk rests for five minutes */
async function justTalk(n, pick) {
    const id = n.id, r = rel(id), day = Clock.dayNum();
    let line = pick(), tries = 0;
    while (line === r.lastTalk && tries++ < 6) line = pick();
    r.lastTalk = line;
    r.talkAt = Date.now();
    n.emote = rpick(['note', 'heart', null, null]); n.emoteT = n.emote ? 50 : 0;
    const lines = [].concat(line).map(l => voiced(id, l));
    await UI.say(id, lines, { keep: true });
    S.stats.talks = (S.stats.talks || 0) + 1;
    if (r.chatDay !== day && r.met) {
        r.chatDay = day;
        const up = addPts(id, (1 + bonusCharm()) * (isHoliday('hugday') ? 2 : 1));
        if (up) { UI.hideDialog(); await heartUp(n, up); }
    }
    Save.touch();
}

/* ---------------------------------------------------------------- petting the goat (once a day; kept as hugDay, the
   name older saves have, and three days of it are the goat's quest) */
async function petGoat(n) {
    const r = rel('goat'), day = Clock.dayNum(), p = G.player;
    UI.hideDialog();
    faceToward(p, n);
    p.pose = 'pick'; p.poseT = 40;
    n.emote = 'heart'; n.emoteT = 80;
    Sfx.play('heart');
    for (let i = 0; i < 10; i++) { n.hop = Math.abs(Math.sin(i / 2)) * 2; await waitFrames(2); }
    n.hop = 0;
    await UI.say(null, rpick(GOAT_PETS), { keep: true });
    p.pose = null; p.poseT = 0;
    if (r.hugDay !== day) { r.hugDay = day; Quests.goatPet(); }
}

/* ---------------------------------------------------------------- the goat is a goat */
async function goatTalk(n) {
    const r = rel('goat'), day = Clock.dayNum();
    await UI.say(null, "It's a goat. It appears to have no further announcement.", { keep: true });
    for (const o of Quests.options(n)) { const k0 = await UI.ask(null, 'The goat noses toward Sarah\'s pocket, then looks politely at her face.', [o.label, 'Not now'], { keep: true }); if (k0 === 0) { await o.fn(); return; } }
    const opts = ['Talk to the goat'].concat(r.hugDay !== day ? ['Pet the goat'] : [], r.giftDay !== day ? ['Give it something'] : [], ['Leave']);
    const k = await UI.ask(null, 'The goat waits. A fly settles on one ear and is gently flicked away.', opts, { keep: true });
    const c = opts[k];
    if (c === 'Talk to the goat') await UI.say(null, rpick(['Sarah tells the goat about her day. It listens patiently, then eats the corner of her sleeve. A mixed review.',
        "Sarah says hello. The goat says nothing. It has always been good at keeping a conversation short.", 'Sarah asks how the goat is doing. A slow blink seems like a reasonable answer.',
        'Sarah tells the goat one of Joe\'s poems. The goat chews thoughtfully. It clearly loved it.']), { keep: true });
    else if (c === 'Pet the goat') await petGoat(n);
    else if (c === 'Give it something') await giftFlow(n);
}

async function heartUp(n, h) {
    Sfx.play('heart');
    n.emote = 'heart'; n.emoteT = 90;
    UI.toast(`${n.def.name}: ${heartStr(h)}`, (NPC_DEFS[n.id].sprite || NPC_DEFS[n.id].human) + (NPC_DEFS[n.id].human ? '_down_stand' : '_0'));
    await teachRecipe(n.id, false);
    if (h >= 3 && !rel(n.id).letter && TALK[n.id] && TALK[n.id].letter) {
        rel(n.id).letter = true;
        sendMail({ from: n.id, subject: `A letter from ${n.def.name}`, body: TALK[n.id].letter, gift: TALK[n.id].letterGift, delay: 1 });
    }
}

async function teachRecipe(id, first) {
    const list = (RECIPE_FROM[id] || []).filter(rid => !S.recipes.includes(rid));
    if (!list.length) return;
    const rid = list[0];
    S.recipes.push(rid);
    Save.touch();
    await UI.say(id, first ? `Oh, and here. A recipe. ${RECIPE[rid].name}. Cook it at your kitchenette.` : `You know what? You should have my ${RECIPE[rid].name.toLowerCase()} recipe.`, { keep: true });
    UI.toast(`Learned a recipe: ${RECIPE[rid].name}`, 'dish_' + rid);
    Sfx.play('item');
}

function giftTier(npcId, itemId) {
    const t = TALK[npcId];
    const it = ITEMS[itemId];
    if (!t || !it) return 'neutral';
    const m = list => (list || []).some(k => k === itemId || k === it.type || (k === 'spicy2' && (it.spicy || 0) >= 2) || (k === 'spicy1' && (it.spicy || 0) >= 1) || ('acc_' + k) === itemId);
    if (m(t.dislikes)) return 'dislike';
    if (m(t.loves)) return 'love';
    if (m(t.likes)) return 'like';
    return 'neutral';
}
/* gifts that make no sense: said out loud, then handed back (it doesn't count as today's gift) */
function badGiftKind(npcId, itemId) {
    const it = ITEMS[itemId], t = TALK[npcId] || {};
    if (!it) return null;
    const named = list => (list || []).includes(itemId);
    const wanted = named(t.loves) || named(t.likes) || named(t.want) || (Requests.wants(npcId, itemId));
    if (itemId === 'photo_' + npcId) return 'ownphoto';
    if (itemId.startsWith('photo_')) return 'photo';
    if (it.type === 'tool') return 'tool';
    if (it.type === 'keepsake') return 'keepsake';
    if (it.type === 'display') return 'display';
    if (wanted) return null;
    if (it.type === 'material') return 'wood';
    if (it.type === 'seed') return 'seed';
    if (it.type === 'plant') return 'sapling';
    if (it.type === 'staple') return 'pantry';
    if (itemId === 'boot') return 'boot';
    if (npcId !== 'joe' && giftTier(npcId, itemId) === 'dislike') return 'dislike';
    return null;
}
function badGiftLine(npcId, itemId, kind) {
    const nm = itemName(itemId).toLowerCase(), t = TALK[npcId] || {};
    if (kind === 'dislike' && t.dislikeLine) return t.dislikeLine;
    if (kind === 'boot') return t.dislikeLine || rpick(BAD_GIFT.boot);
    if (kind === 'pantry' && PANTRY_GIFT[itemId]) return rpick([].concat(PANTRY_GIFT[itemId]));
    const own = BAD_GIFT_OWN[npcId] && BAD_GIFT_OWN[npcId][kind];
    const line = own ? rpick([].concat(own)) : rpick(BAD_GIFT[kind] || BAD_GIFT.pantry);
    return line.replace(/\{item\}/g, nm).replace(/\{a\}/g, aOrAn(nm)).replace(/\{who\}/g, itemId.startsWith('photo_') ? (NPC_DEFS[itemId.slice(6)] || { name: 'them' }).name : '');
}

async function giftFlow(n) {
    const id = n.id;
    UI.hideDialog();
    const itemId = await pickFromPocket('Give a gift', s => !importantItem(s.id) && !['lost', 'bag', 'quest'].includes(ITEMS[s.id].type) && s.id !== 'bottle',
        'Important things (quest items, keepsakes, photos, one-of-a-kind gifts) stay with you.');
    if (!itemId) { await UI.say(id === 'goat' ? null : id, id === 'goat' ? 'The goat seems content with that arrangement.' : 'No worries!'); return; }
    const r = rel(id), day = Clock.dayNum();
    const bad = id === 'goat' ? (['tool', 'keepsake', 'display'].includes(ITEMS[itemId].type) || itemId.startsWith('photo_') ? 'goat' : null)
        : id === 'joe' ? (['tool', 'keepsake', 'display'].includes(ITEMS[itemId].type) || itemId.startsWith('photo_') ? 'joe' : null)
            : badGiftKind(id, itemId);
    if (bad) {
        G.player.pose = null;
        n.emote = bad === 'joe' ? 'heart' : bad === 'ownphoto' || bad === 'keepsake' ? 'sparkle' : 'sweat'; n.emoteT = 80;
        Sfx.play(bad === 'joe' ? 'heart' : 'nope');
        if (bad === 'goat') await UI.say(null, rpick([`The goat sniffs the ${itemName(itemId).toLowerCase()} and backs away. Sarah keeps the ${itemName(itemId).toLowerCase()}.`,
            `The goat considers the ${itemName(itemId).toLowerCase()}. It does not eat it. That's how you know it's a bad idea.`]));
        else if (bad === 'joe') await UI.say('joe', fillItem(rpick(JOE_KEEP_IT), itemId));
        else await UI.say(id, [voiced(id, badGiftLine(id, itemId, bad)), `(${n.def.name} hands it back.)`]);
        return;
    }
    removeItem(itemId, 1);
    const handmade = !!ITEMS[itemId].pottery;
    const selfPlush = itemId === 'plush_' + id;
    const tier = selfPlush ? 'love' : handmade ? potteryTier(id, itemId) : id === 'joe' ? 'love' : giftTier(id, itemId);
    r.giftDay = day; r.gifts = 1;
    r.given = (r.given || 0) + 1;          // (every gift ever, for the Friends app's profile: 6zzb_profiles.js)
    const pts = { love: 8, like: 5, neutral: 3, dislike: 1 }[tier] + (isHoliday('kindday') ? 3 : 0) + bonusCharm();
    G.player.pose = 'cheer'; G.player.poseT = 24;
    Sfx.play('item');
    if (id === 'goat') {
        await UI.say(null, selfPlush ? 'The goat looks at the goat plushie. The plushie looks back. Neither will introduce itself.' : "The goat gives the gift a thorough sniff. Then gives Sarah's hand the same inspection.");
    } else if (selfPlush) {
        n.emote = 'heart'; n.emoteT = 90;
        await UI.say(id, voiced(id, PLUSH_SELF[id] || "It's ME! A tiny, soft me! I'm putting it where everyone can see it."));
    } else if (handmade) {
        n.emote = tier === 'love' ? 'heart' : 'sparkle'; n.emoteT = 80;
        await UI.say(id, voiced(id, potteryGiftLine(id, tier)));
    } else if (id === 'joe') {
        n.emote = 'heart'; n.emoteT = 90;
        await UI.say('joe', fillItem(rpick(JOE_GIFT), itemId));
    } else {
        const t = TALK[id];
        const line = { love: t.loveLine, like: t.likeLine, dislike: t.likeLine, neutral: rpick(['Oh! For me? Thank you!', "That's so nice of you. Thanks!", 'Aw, thank you!']) }[tier];
        n.emote = tier === 'love' ? 'heart' : 'note';
        n.emoteT = 80;
        await UI.say(id, line);
    }
    if (ITEMS[itemId].type === 'acc') await offerWear(n, itemId);
    if (['furniture', 'wall', 'floor', 'art'].includes(ITEMS[itemId].type)) await furnitureGift(n, itemId);
    if (tier === 'love' || tier === 'like') remember(id, 'gift', { item: itemId });
    const up = id === 'goat' ? 0 : addPts(id, pts);
    if (up) await heartUp(n, up);
    S.stats.gifts = (S.stats.gifts || 0) + 1;
    Save.touch();
}
/* hats and accessories: put it on now? afterwards it's part of their wardrobe */
async function offerWear(n, itemId) {
    const id = n.id, r = rel(id), acc = ITEMS[itemId].wear;
    r.accs = r.accs || [];
    if (!r.accs.includes(acc)) r.accs.push(acc);
    const who = id === 'goat' ? 'the goat' : n.def.name;
    const k = await UI.ask(null, `Want ${who} to put it on?`, ['Put it on!', 'Maybe later'], { keep: true });
    if (k === 0) {
        r.wearDay = Clock.dayNum(); r.wearing = acc;
        n.emote = 'sparkle'; n.emoteT = 70;
        Sfx.play('item');
        await UI.say(id === 'goat' ? null : id, WEAR_LINES[id] || 'How do I look?', { keep: true });
    } else {
        await UI.say(id === 'goat' ? null : id, id === 'goat' ? 'The goat stands very still while Sarah considers the fit.' : "I'll save it for a special day. Or tomorrow. Tomorrow could be special.", { keep: true });
    }
    Save.touch();
}
function potteryFor(kind) { const s = S.pocket.find(s => s && ITEMS[s.id].pottery && ITEMS[s.id].kind === kind); return s ? s.id : null; }

/* ---------------------------------------------------------------- Joe (five hearts from day one; he loves everything) */
async function joeTalk(n) {
    const r = rel('joe'), day = Clock.dayNum();
    if (!r.met) { r.met = true; S.flags.metJoe = true; }
    r.pts = Math.max(r.pts, 100);
    const resting = talkResting(r);
    if (r.talkDay !== day) {
        r.talkDay = day;
        addPts('joe', 3);
        heartPop(n);
        await UI.say('joe', n.spotKey === 'pier_end' ? rpick(JOE.sunset) : rpick(JOE.greet), { keep: true });
        // today's takeout (once a day, from the afternoon on)
        if (dayHour() >= 15 && r.takeoutDay !== day) {
            r.takeoutDay = day;
            const key = rpick(Object.keys(JOE.takeout), mulberry(hash32(S.seed + ':joe:' + day)));
            const [dish, line] = JOE.takeout[key];
            await UI.say('joe', line, { keep: true });
            G.player.pose = 'cheer'; G.player.poseT = 30;
            Sfx.play('fanfare');
            receive(dish, 1);
        }
    } else {
        const tea = Drama.lineFor(n);
        await UI.say('joe', tea || (resting ? tooSoonLine(n) : openerLine(n, false)), { keep: true });
    }
    const lostLine = ownerLostLine(n);
    if (lostLine && r.lostAskDay !== day) { r.lostAskDay = day; await UI.say('joe', lostLine, { keep: true }); }
    await Requests.onGreet(n, false);
    if (!r.photo) {
        r.photo = true;
        await UI.say('joe', "Here. A photo of me, for you. I look very deep in it. I was thinking about a sandwich.", { keep: true });
        receive('photo_joe', 1);
    }
    for (;;) {
        const opts = [], acts = [];
        const add = (label, fn) => { opts.push(label); acts.push(fn); };
        if (!talkResting(r)) add('Talk', async () => { await justTalk(n, () => topicLine(n)); return true; });
        add('Tell me a poem', async () => { await recitePoem(n.spotKey === 'pier_end' && R() < 0.5); return true; });
        const ks = keepsakeForJoe();
        if (ks) add('Look what I found!', async () => { await joeKeepsakePoem(n, ks); return true; });
        if (r.giftDay !== day) add('Here, a gift', async () => { await giftFlow(n); return !giftTaken(r); });
        for (const o of Requests.options(n)) add(o.label, o.fn);
        for (const o of Quests.options(n)) add(o.label, o.fn);
        for (const o of civicOptions(n)) add(o.label, o.fn);
        for (const o of valentineOptions(n)) add(o.label, o.fn);     // (a valentine: 6zp_holiday_events.js)
        for (const o of Drama.options(n)) add(o.label, async () => { await Drama.choose(n, o); return true; });
        if (hasLostFor('joe')) add(`Found your ${ITEMS[S.lost.cur.id].what}!`, async () => { await returnLost(n); return true; });
        if (IslandGames.list(n).length) add("Let's play!", () => IslandGames.offer(n));
        add('See you later!', async () => { await UI.say('joe', rpick(JOE.bye)); return false; });
        const k = await UI.ask('joe', rpick(["What's up?", 'Anything else? I have time. I always have time.', 'So!', "Got time? I've got time. (Poems available.)"]), opts, { keep: true });
        if (!(await acts[k]())) return;
    }
}
/* poems Sarah hasn't heard come first; every one goes into Joe's Collected Works */
async function recitePoem(sunset) {
    S.poems = S.poems || [];
    let poem;
    if (sunset) poem = JOE_SUNSET_POEM;
    else {
        const fresh = JOE_POEMS.filter(p => !S.poems.includes(p[0]));
        poem = rpick(fresh.length ? fresh : JOE_POEMS);
    }
    const [title, lines] = poem;
    const first = !S.poems.includes(title);
    if (first) S.poems.push(title);
    S.lastPoem = { title, day: Clock.dayNum() };
    await UI.say('joe', rpick(JOE.beforePoem).replace('{t}', title), { keep: true });
    await UI.say('joe', lines.join('\n'), { keep: true, letter: true });
    await UI.say('joe', rpick(JOE.afterPoem), { keep: true });
    if (first) UI.toast(`Added to Joe's Collected Works: "${title}"`, 'app_poems');
    S.stats.poems = (S.stats.poems || 0) + 1;
    Save.touch();
    checkSpecialMilestones();
}
/* keepsakes inspire special poems (once each) */
function keepsakeForJoe() {
    const done = S.joeKeeps || [];
    return (GD.keepsakes || []).find(k => JOE_KEEPSAKE_POEMS[k] && !done.includes(k) && (pocketCount(k) || S.storage[k])) || null;
}
async function joeKeepsakePoem(n, id) {
    S.joeKeeps = S.joeKeeps || [];
    S.joeKeeps.push(id);
    const [title, intro, lines] = JOE_KEEPSAKE_POEMS[id];
    n.emote = 'sparkle'; n.emoteT = 90;
    await UI.say('joe', intro, { keep: true });
    await UI.say('joe', [`This one's called "${title}."`], { keep: true });
    await UI.say('joe', lines.join('\n'), { keep: true, letter: true });
    await UI.say('joe', rpick(["That one's for the " + itemName(id).toLowerCase() + '. And maybe a little bit for you. A tiny bit. Okay, a lot of bit.', 'I think that might be the best thing I have ever written. Again.']), { keep: true });
    S.poems = S.poems || [];
    if (!S.poems.includes(title)) S.poems.push(title);
    S.lastPoem = { title, day: Clock.dayNum() };
    UI.toast(`A special poem for Joe's Collected Works: "${title}"`, 'app_poems');
    S.stats.poems = (S.stats.poems || 0) + 1;
    Save.touch();
}

/* ---------------------------------------------------------------- holidays + birthday lines */
function holidayLine(id) {
    const ev = G.events || new Set();
    if (ev.has('birthday')) return 'Happy birthday, {name}!! The whole island knows. Coco made sure.';
    if (ev.has('newyear')) return 'Happy New Year! My resolution: sleep in more. Nailed it already.';
    if (ev.has('lunar')) return 'Happy Lunar New Year! Wonton is handing out red envelopes at the spring!';
    if (ev.has('valentine')) return "Happy Valentine's Day! Joe's been making a card since dawn. It has a frog on it. Don't tell him I told you!";
    if (ev.has('july4')) return 'Happy Fourth! Fireworks over the beach tonight. I hope we get a good spot.';
    if (ev.has('halloween')) return 'Happy Halloween! I dressed up as myself. Very scary. Very me.';
    if (ev.has('winterfest')) return 'Happy holidays, {name}! Cozy season! Blanket season! Soup season! (Sorry, Wonton.)';
    if (ev.has('nye')) return "It's New Year's Eve! Countdown at midnight in the plaza! Island midnight, obviously.";
    if (ev.has('islandday')) return 'Happy Island Day, {name}! It feels good having you here.';
    return holidayHello(id);
}

/* Basil's night noodle cart */
const CART_MENU = ['pad_thai', 'green_curry', 'tom_yum', 'pad_thai', 'mango_sticky', 'green_curry', 'tom_yum'];
const CART_PRICE = 280;
async function noodleCart(n) {
    const day = Clock.dayNum(), r = rel('basil');
    const special = CART_MENU[hash32(S.seed + ':cart:' + day) % CART_MENU.length];
    const nm = itemName(special).toLowerCase();
    if (!r.met) {
        r.met = true;
        await UI.say('basil', TALK.basil.intro);
        await teachRecipe('basil', true);
    } else if (r.talkDay !== day) {
        r.talkDay = day;
        const up = addPts('basil', 2);
        await UI.say('basil', rpick(["Welcome to the cart. It's {time}. Peak dinner hours.", "Hey, {name}. Hungry? It's the middle of the night. So yes.", 'Cart\'s open. Noodles are hot. The night is young. We are all young.']), { keep: true });
        if (up) await heartUp(n, up);
    }
    S.flags.cart = S.flags.cart || {};
    const bought = S.flags.cart.day === day ? S.flags.cart.n : 0;
    if (bought >= 3) {
        await UI.say('basil', "That's three bowls. I'm cutting you off. With love. Come back tomorrow night.");
        return;
    }
    const k = await UI.ask('basil', `Tonight's special: ${nm}. ${fmtNum(CART_PRICE)} sand dollars a bowl.`, [`One bowl (${fmtNum(CART_PRICE)})`, 'Just saying hi', 'Bye!'], { keep: true });
    if (k === 2) { await UI.say('basil', 'Night, {name}! Well. Morning. Whatever it is for you.'); return; }
    if (k === 1) { await UI.say('basil', chatLine(n)); return; }
    if (S.money < CART_PRICE) { await UI.say('basil', "You're a little short. It's okay. Sell Fortune a shell or two and come back. I'm here till one."); return; }
    const s = await UI.ask('basil', 'Spicy? Thai spicy or tourist spicy?', ['Thai spicy', 'Tourist spicy'], { keep: true });
    addMoney(-CART_PRICE, true, 'Food');
    S.flags.cart = { day, n: bought + 1 };
    Sfx.play('item');
    if (s === 0) {
        n.emote = 'heart'; n.emoteT = 80;
        G.player.emote = 'spicy'; G.player.emoteT = 80;
        await UI.say('basil', rpick(['You said Thai spicy before I finished asking. I like you.', "Thai spicy. Correct answer. Chili is going to be so proud.", 'Thai spicy it is. I added extra. You looked like you could take it.']), { keep: true });
        const up = addPts('basil', 3);
        receive(special, 1);
        markFresh(special, 1);
        UI.hideDialog();
        if (up) await heartUp(n, up);
    } else {
        await UI.say('basil', rpick(['Tourist spicy. Okay. I put one (1) chili flake on it. Be brave.', "Tourist spicy. I respect it. I'm judging a little, but I respect it."]));
        receive(special, 1);
        markFresh(special, 1);
    }
}

