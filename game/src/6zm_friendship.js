/* ---- 6zm_friendship.js ---- */
/* Friendship, deeper (David, 27 October: "more than hearts going up ... neighbors who remember what she did and bring it
   up; it fades a little if she's away a long time; milestones that unlock things: sharing something personal, a gift for
   her house, asking her advice, a best-friend moment"). Neighbors remember the last few things Sarah did with them (a gift
   they liked, a game, a favor, a visit, a lunch or a hangout, a letter, a photo together, the catchphrase she gave them,
   finding what they'd lost: remember, kept as S.npcs[id].mem) and some days
   bring one up (memoryLine). After three weeks without a word their friendship fades a little each day, never below the
   hearts they have (friendshipTick, in dailyCheck), and they say they missed her. And at each heart they share something
   new, one a day (friendMilestone): their favorite spot at two hearts, asking her advice at three, a gift for her house
   (in the mail) at four, a best-friend moment at five. */
const MEM_KEEP = 8, FADE_AFTER = 21;
const MEM_LINES = {
    gift: ["I still have the {item} you gave me {when}. It's my favorite thing right now.", 'Remember the {item}, {when}? I look at it every day. Well, most days.'],
    game: ['That {game} {when} was so much fun. Let\'s play again soon!', "I'm still thinking about our {game} {when}. Rematch?"],
    favor: ['Thanks again for helping me out {when}. I won\'t forget it.', 'You really came through for me {when}. I tell everyone.'],
    visit: ['Thanks for coming over {when}! My house felt extra cozy with company.', 'You visited {when}! I tidied for an hour after. Before? No. After. It felt like a party.'],
    gather: ["That night {when}, everyone out together? I keep thinking about it. We should do that more.", 'Remember {when}, when the whole island was out? Best night in a while.'],
    newyear: ['That countdown on the square {when}! What a way to start a year.', "We counted down together {when}! I'm still saying 'happy new year' to everyone. It's getting weird."],
    coffee: ["That coffee at Muggy's {when} was so nice. Let's do it again!", 'I keep thinking about our coffee {when}. Muggy waved at us the whole time.'],
    bench: ['Sitting on that bench with you {when} was nice. We should do nothing together more often.', "That bench {when}! Best doing-nothing I've done all week."],
    lunch: ["Lunch at Mac's {when} was so nice. Mac gave us extra. Mac says that never happened.", 'I keep thinking about our lunch {when}. Same time next week? Or sooner. Sooner works.'],
    hang: ['Hanging out {place} {when} was the best. We should do it again.', "Remember {when}, {place}? I've been back twice. It's not the same without you."],
    letter: ['I still have your letter from {when}. I read it again last night.', "Your letter {when}! I put it somewhere safe. I'm not saying where. It's that safe."],
    photo: ["You took a picture with me in it {when}! I hope I looked good. Don't tell me if I didn't.", 'Was that a photo {when}? Of me? I should have done my good side. All my sides are good. Still.'],
    catch: ['Since you gave me "{phrase}", I can\'t stop saying it. People have noticed.', 'I said "{phrase}" at breakfast this morning. To nobody. It still felt right.'],
    lost: ["I haven't lost my {what} once since you found it. I check on it every hour.", "My {what}! Still safe. Thanks to you. I gave it a little talk about wandering off."],
};
const GAME_WORDS = { tag: 'game of tag', hide: 'game of hide-and-seek', derby: 'fishing derby', danceoff: 'dance-off', duet: 'karaoke duet', volley: 'volleyball game', snowball: 'snowball fight' };
const MISSED_LINES = ["{name}! Where have you BEEN? It's been ages! I missed you.", "Oh! You're back! I thought maybe you'd forgotten about us. About me.", "It's been so long! Sit down. Tell me everything. Skip nothing."];
/* at two hearts: their favorite spot on the island (something personal comes later, at four and five: TM_SHARE in
   6z_talk_more.js), and from then on they ask her to hang out there now and then (Invites.hangSpots, 6w_extras.js) */
const FAV_SPOT = {
    maki: ['bench_pond', "Do you want to know my favorite place on the island? The bench by the pond.", 'The water is flat. The lily pads are evenly spaced. Mostly. I fix the others with a stick.'],
    kai: ['pier_end', "Wanna know my favorite spot, dude? The very end of the pier.", "You can see every wave coming from there. Like the whole ocean's lined up to say hi."],
    basil: ['bonfire', 'My favorite place? The bonfire on the beach, late at night.', 'Everyone comes over hungry and leaves warm. It is like the cart, but with stars.'],
    wonton: ['spring', 'My favorite place is my spring. Obviously. You knew that.', 'The waterfall is nice too. It is a spring that is in a hurry.'],
    chili: ['lookout', "Okay, my favorite spot. Besides the arcade. The lookout, up the hill.", "It's quiet up there. Don't tell anyone I like quiet. It would ruin me."],
    coco: ['plaza', 'My favorite spot? The square. Everyone walks through it eventually. EVERYONE.', 'I just sit on a bench and wait. Like a spider. A nice, chocolate spider.'],
    cece: ['bench_beach', 'Can I tell you my favorite spot? Sorry. The bench at the beach.', 'I like how the waves say sorry and then come back anyway.'],
    clementine: ['boardwalk', 'My favorite place, darling? The Boardwalk at sunset.', "The light does something to orange there that I simply cannot do with thread."],
    cuke: ['orchard', 'My favorite spot? The orchard! I jog round it every morning!', 'The trees cheer me on. In my head. But still!'],
    sully: ['harbor', "My favorite spot, kid? Down by the harbor.", 'Boats coming in, boats going out. Reminds me of home. Smells like it too.'],
    ginger: ['lookout', 'My favorite spot is the lookout. You can see every roof on the island from up there.', 'I built half of them. I count them. Sturdily.'],
    brulee: ['oldtree', 'My favorite place on the island is the big old tree in the forest.', 'It has been there longer than the museum. It is its own kind of exhibit.'],
    mac: ['meadow', "My favorite spot? The meadow up the hill. Perfect for a picnic.", "I've done the math on it. The math is sandwiches."],
};
/* at three hearts: they ask her advice (two answers, a reaction to each) */
const ADVICE = {
    maki: { q: 'I need your advice. Should I reorganize my rice drawer by color, or by size?', a: ['By color!', 'Leave it as it is'], r: ["By color. Bold. Unprecedented. I'm going to do it tonight. Precisely at nine.", 'Leave it... You are right. It is already perfect. I needed to hear that.'] },
    kai: { q: 'Bro, I need advice. Should I finally try the big wave at the point, or just keep watching it?', a: ['Try it, carefully', 'Watching is cool too'], r: ["Carefully. Yeah. Baby steps. Baby waves. Then the big one. Dude, you're like a coach.", "Watching IS cool. Respectfully watching. You get it. You totally get it."] },
    basil: { q: 'May I ask you something? A new noodle on the cart: spicy peanut, or lemongrass?', a: ['Spicy peanut', 'Lemongrass'], r: ["Spicy peanut. Warm and bold. Like a hug with a kick. I'll start tomorrow.", 'Lemongrass. Bright and calm. Yes. The cart has been asking for it.'] },
    wonton: { q: 'I must ask your opinion. Should I let other people into my spring? It is very quiet in there.', a: ['Invite a few friends', 'Keep it peaceful'], r: ['A few friends. In the not-soup. Yes. I will make a little sign. "Welcome. Not soup."', 'Peaceful. Yes. The spring and I will continue to sit. Thank you for understanding the spring.'] },
    chili: { q: "Help me out. Should I make the arcade's games harder or easier? People keep losing. I keep winning.", a: ['A little easier', 'Keep it spicy'], r: ["Easier. Ugh. Fine. A LITTLE easier. For the people. Not for me. I'll still win.", 'Keep it SPICY. Yes! I knew you got it! Nobody wins the arcade. The arcade wins.'] },
    coco: { q: "Okay, I need your advice and you can't tell anyone I asked. Should I keep a secret if it's a happy one?", a: ['Keep it, for now', 'Happy news is for sharing'], r: ['Keep it... for now. Oh, that is SO hard. But you\'re right. I\'ll let them tell it. I\'ll just look very knowing.', 'Happy news is for sharing! I KNEW it. I\'m going to tell everyone. Gently. Wait, maybe I should ask first. You\'re a good influence.'] },
    cece: { q: 'Can I ask you something? Sorry. Should I enter my cheesecake in a real baking contest?', a: ['Yes, enter it!', "Bake it for friends first"], r: ['Enter it! Okay! Okay. I\'m going to do it. If I win I\'ll say sorry to everyone else. Kindly.', 'For friends first. Yes, that feels nicer. You\'re first on the list. Sorry. You\'re welcome. Both.'] },
    clementine: { q: 'Darling, I need an honest eye. The new season: everything orange, or a little bit of teal?', a: ['A little teal', 'Orange, always'], r: ['Teal. A splash. Daring. Delicious. I shall call it "A Little Bit of Ocean." You inspire me.', 'Orange, always. Of course. I was testing you. You passed. You passed beautifully.'] },
    cuke: { q: 'Advice time! Should I try a marathon, or learn to relax? Relaxing sounds HARD.', a: ['Try relaxing', 'Go for the marathon'], r: ["Relaxing. Okay! I'll relax SO hard. Maybe five whole minutes. Then a short jog. A relaxing jog.", 'MARATHON! Yes! I knew it! I\'ll hydrate for both of us!'] },
    sully: { q: "Kid, you've got good sense. Should I teach a pottery class, or keep the studio to myself?", a: ['Teach a class', 'Keep it yours'], r: ["A class. Yeah. Maybe it's time somebody else gets their hands muddy. You're signing up first.", 'Keep it mine. Wicked good. Some places need to stay quiet. Thanks, kid.'] },
    ginger: { q: 'I want a second opinion. Build the new porch with curved railings, or straight?', a: ['Curved railings', 'Straight and sturdy'], r: ['Curved. Ooh. Harder to measure. Much prettier. I accept this challenge. Sturdily.', 'Straight. Sturdy. Classic. The right answer, by the numbers. Good eye.'] },
    brulee: { q: 'I value your opinion. Should the museum stay open later, for the evening light on the paintings?', a: ['Open later!', 'Keep the hours'], r: ['Later! The golden hour on the gallery walls. Magnifique. I will make it a special night.', 'Keep the hours. Yes. Art needs its rest too. As do I. Merci.'] },
    mac: { q: "Here's a question for you. New special: something fancy, or something like Grandma used to make?", a: ['Like Grandma made', 'Something fancy'], r: ["Like Grandma's. That's the one. Comfort first. You're a good soul. Eat up.", "Fancy! Okay! A little parsley on top. A swirl. Maybe a tiny flag. Ooh, I'm excited."] },
};
/* at four hearts: a gift for her house (in the mail) */
const HOUSE_GIFT = { maki: 'bonsai', kai: 'surfboard', basil: 'paper_lantern', wonton: 'steamer_stack', chili: 'chili_lights', coco: 'choc_fountain', cece: 'cake_stand',
    clementine: 'mirror_stand', cuke: 'herb_pot', sully: 'shell_lamp', ginger: 'globe', brulee: 'easel', mac: 'table_setting' };
const HOUSE_GIFT_LINE = "I want you to have something for your house. I sent it in the mail. Put it somewhere you'll see it. Then think of me. Just a little.";
/* at five hearts: the best-friend moment */
const BEST_FRIEND = {
    _: ["{name}... can I say something? You're my best friend on this island.", "That's it. That's the whole thing. I just wanted you to know. Okay. Hug?"],
    maki: ["{name}, I have measured it carefully. You are my best friend. The measurement is exact.", 'There is no margin of error. I checked twice. Precisely.'],
    kai: ['Dude. DUDE. You are my best friend. Like, best-best. Ride-or-die. Wave-or-die.', "I'm gonna paint it on my board. Small. Respectfully. But it's there."],
    sully: ["Kid. You know what you are? You're family. Best friend I've had since Boston.", "Don't make a thing of it. ...Okay, make a little thing of it."],
};

/* ---------------------------------------------------------------- remembering */
function remember(id, k, d) {
    if (!S || !NPC_DEFS[id] || Online.visitor()) return;
    const r = rel(id);
    r.mem = (r.mem || []).filter(m => m.k !== k).concat([Object.assign({ k, day: Clock.dayNum() }, d || {})]).slice(-MEM_KEEP);
}
/* something they remember from the last week, said once (and only some days) */
function memoryLine(id) {
    const r = rel(id), today = Clock.dayNum();
    const m = (r.mem || []).filter(x => !x.said && today - x.day >= 1 && today - x.day <= 7 && MEM_LINES[x.k]).pop();
    if (!m) return null;
    m.said = 1;
    const age = today - m.day, when = age <= 1 ? 'yesterday' : age <= 3 ? 'the other day' : 'last week';
    return rpick(MEM_LINES[m.k]).replace(/\{when\}/g, when).replace(/\{item\}/g, m.item && ITEMS[m.item] ? itemName(m.item).toLowerCase() : 'present')
        .replace(/\{game\}/g, GAME_WORDS[m.game] || 'game').replace(/\{what\}/g, m.what || 'thing')
        .replace(/\{place\}/g, m.place || 'together').replace(/\{phrase\}/g, m.phrase || 'it');
}

/* ---------------------------------------------------------------- fading, a little */
function friendshipTick() {
    if (!S || Online.visitor()) return;
    const today = Clock.dayNum();
    for (const id of NEIGHBORS) {
        const r = S.npcs[id];
        if (!r || !r.met || r.talkDay < 0) continue;
        const gap = today - r.talkDay;
        if (gap <= FADE_AFTER) continue;
        // (a point every other day past three weeks, at most ten, never below the hearts they have)
        const want = Math.min(10, Math.floor((gap - FADE_AFTER) / 2)), take = Math.max(0, Math.min(want - (r.faded || 0), r.pts - HEARTS[hearts(id)]));
        if (take > 0) { r.pts -= take; r.faded = (r.faded || 0) + take; }
        r.missed = 1;
    }
}

/* ---------------------------------------------------------------- milestones */
/* the next thing they share at the hearts they have (one a day), or null */
function nextMilestone(id) {
    const r = rel(id), h = hearts(id);
    if (!FAV_SPOT[id]) return null;
    if (h >= 2 && !r.ms2) return 2;
    if (h >= 3 && !r.ms3) return 3;
    if (h >= 4 && !r.ms4) return 4;
    if (h >= 5 && !r.ms5) return 5;
    return null;
}
async function friendMilestone(n) {
    const id = n.id, r = rel(id), day = Clock.dayNum(), m = nextMilestone(id);
    if (!m || r.msDay === day) return false;
    r.msDay = day;
    r['ms' + m] = day;
    n.emote = 'heart'; n.emoteT = 90;
    if (m === 2) await UI.say(id, FAV_SPOT[id].slice(1).map(l => voiced(id, l)), { keep: true });
    else if (m === 3) {
        const A = ADVICE[id];
        const k = await UI.ask(id, voiced(id, A.q), A.a, { keep: true });
        r.advice = k;
        await UI.say(id, voiced(id, A.r[k] || A.r[0]), { keep: true });
        const up = addPts(id, 2);
        if (up) await heartUp(n, up);
    } else if (m === 4) {
        await UI.say(id, voiced(id, HOUSE_GIFT_LINE), { keep: true });
        const g = HOUSE_GIFT[id];
        if (g && ITEMS[g]) sendMail({ from: id, subject: `Something for your house, from ${NPC_DEFS[id].name}`, body: `Dear {name},\nThis made me think of you. It wants to live at your house.\n- ${NPC_DEFS[id].name}`, gift: g });
    } else if (m === 5) {
        r.bff = day;
        Sfx.play('fanfare');
        await UI.say(id, (BEST_FRIEND[id] || BEST_FRIEND._).map(l => voiced(id, l)), { keep: true });
    }
    Save.touch();
    return true;
}
