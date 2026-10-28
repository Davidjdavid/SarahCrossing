/* ---- 28_visits.js ---- */
/* Neighbors drop by Sarah's house some afternoons and evenings: they knock, look around, say what they think,
   sometimes bring something, and head out. If Sarah's not home, they might leave a note. */
const VISIT_KNOCK = {
    maki: 'It\'s Maki. I was passing at a normal walking speed. May I come in?',
    kai: "Knock knock! It's Kai! Bowl-oha! Can I come in?",
    basil: "Hey, {name}. It's Basil. I brought good vibes and no noodles. Can I come in?",
    chili: "It's Chili. Can I come in? If it helps, I've already decided I can.",
    coco: "Knock knock! It's Coco! I have NEWS. Well, I will once I see your house. Can I come in?",
    cece: "Hi! It's Cece! Is this a good time? I brought a cake, but I can eat it on the step if you're busy.",
    clementine: "Darling, it's Clementine. I'm here to see your interiors. Can I come in?",
    cuke: "KNOCK KNOCK! It's Cuke! I jogged here! Can I come in?",
    sully: "Knock knock. It's Sully. Just passin' by. Mind if I come in, kid?",
    joe: "Knock knock! It's me! Joe! Regular Joe! Just a normal visit! Can I come in?",
    ginger: "Knock knock! It's Ginger! Just checking your doorframe. And you. Can I come in?",
    brulee: "Bonjour! It's Brulee. I hear you have... interiors. May I come in?",
    mac: "Knock knock! It's Mac! I didn't bring food, which is very unlike me. Can I come in?",
};
const VISIT_SET = { maki: 'sushi', kai: 'beach', basil: 'takeout', chili: 'takeout', coco: 'dessert', cece: 'dessert', clementine: 'cottage',
    cuke: 'garden', sully: 'crimson', joe: 'poet', ginger: 'cottage', brulee: 'artist', mac: 'diner' };
const VISIT_LOVE = {
    maki: 'Ah. A sushi setup. You\'ve made me feel very at home. Possibly too at home. May I straighten that?', kai: 'Beach vibes! You totally get it, dude.', basil: 'Takeout decor. Very nice. For a moment I thought I\'d come over to work.',
    chili: "This room has some heat. I like it. You could go hotter. That's true of most rooms.", coco: "Dessert vibes?! This house is DELICIOUS. I'm telling everyone.",
    cece: "It's like a little bakery! I'd be so happy here. I'd never get anything done. Oh, that's already true at mine.", clementine: 'Darling, the cottage look? Cozy. Classic. Correct.',
    cuke: 'Plants! Green things! Fresh air! This house is HYDRATED!', sully: "Hahvahd stuff! Wicked smaht. You fit right in, kid.",
    joe: 'You put out the poetry things! Near the good light, too. They\'ll write better here.',
    ginger: 'A cottage! Good bones. Solid beams. I could live here. I might.',
    brulee: "An artist's home! Easels, paintings... I feel like I'm at work, but relaxing.",
    mac: "Diner style! Checkered floor, red chairs... {name}, this is my dream. Can I cook here?",
};
const VISIT_BYE = ['Okay, I should get going! Thanks for having me!', "This was nice. Let's do it again sometime!", 'I had fun! See you around the island!'];

const Visits = {
    today() {
        const day = Clock.dayNum();
        if (S.visit && S.visit.day === day) return S.visit;
        const r = mulberry(hash32(S.seed + ':visit:' + day));
        let v = { day, who: null, at: 0, state: 'none' };
        if (r() < 0.5) {
            const pool = NEIGHBORS.concat(['joe']).filter(id => S.npcs[id] && S.npcs[id].met && S.npcs[id].pts >= 10);
            const who = pool.length ? rpick(pool, r) : null;
            if (who) v = { day, who, at: 13 + r() * 9, state: 'pending' };
        }
        S.visit = v;
        return v;
    },
    check() {
        if (!S || !S.started || G.mode !== 'play' || !S.flags.introDone || Online.visitor()) return;     // people knock on Sarah's door
        const v = this.today();
        if (v.state !== 'pending') return;
        const dh = dayHour();
        if (dh < v.at) return;
        const n = NPCs.get(v.who);
        if (dh > v.at + 2 || !n) {
            v.state = 'missed';
            if (n && R() < 0.6) sendMail({ from: v.who, subject: 'I stopped by!', body: `{name}!\nI came by your house around ${fmtClock(v.at % 24)}, but you weren't home. Next time!\n- ${n.def.name}` });
            Save.touch();
            return;
        }
        if (G.area.id !== 'home' || G.busy || UI.modal || UI.dialogOpen || Decor.on || Dance.on || Photo.on || G.fishing) return;
        if (n.sleeping || n.talking || n.script) return;
        if (n.want && n.want.fixed) return;          // at work
        v.state = 'done';
        Save.touch();
        this.run(n);
    },
    async run(n) {
        const id = n.id, p = G.player, a = G.area;
        G.busy++;
        try {
            Sfx.play('knock');
            await waitFrames(24);
            const knockLine = voiced(id, VISIT_KNOCK[id] || `Knock knock! It's ${n.def.name}! Can I come in?`);
            const k = await UI.ask(id, knockLine, ['Come in!', 'Not right now']);
            if (k !== 0) { await UI.say(id, voiced(id, "Aw, okay! Another time!")); return; }
            // they come in through the front door
            n.script = true; n.talking = false; n.path = null;
            n.area = 'home'; n.sleeping = false;
            n.x = (a.doorTile[0] + 0.5) * TILE; n.y = (a.doorTile[1] - 0.3) * TILE;
            Sfx.play('door');
            const [sx, sy] = openSpots(a, 1, a.floor.x0 + a.floor.w / 2 - 0.5, a.floor.y0 + a.floor.h / 2)[0];
            walkNpc(n, sx, sy);
            for (let i = 0; i < 300 && n.path; i++) { stepNpc(n); await waitFrames(1); }
            n.moving = false; n.hop = 0;
            faceNpc(n, p); faceToward(p, n);
            n.emote = 'heart'; n.emoteT = 80;
            await UI.say(id, voiced(id, rpick(["So this is your place! Nice! I never know what to do with my hands on a house tour.", "It looks so much like you in here. I mean that nicely. I'm looking at the nice part.", 'Look at this! Okay, give me the tour. Actually, I can see everything from here.'])), { keep: true });
            // something in the room catches their eye
            const items = S.house.items.map(it => furnDef(it.id)).filter(d => d && !d.food && !d.flower);
            const set = VISIT_SET[id];
            const fav = items.find(d => set && d.sets.includes(set));
            if (fav && VISIT_LOVE[id]) await UI.say(id, voiced(id, `Is that ${aOrAn(fav.name)} ${fav.name.toLowerCase()}? ${VISIT_LOVE[id]}`), { keep: true });
            else if (items.length) { const d = rpick(items); await UI.say(id, voiced(id, `Ooh, ${aOrAn(d.name)} ${d.name.toLowerCase()}. ${rpick(['Very nice.', 'Where did you get that?', 'I hadn\'t thought of having one at home. Now I want one.', 'Classic.'])}`), { keep: true }); }
            const sc = councilScore();
            const verdict = sc.total >= 21 ? "Honestly? This might be the cutest house on the island. Don't tell Clementine I said that."
                : sc.total >= 13 ? 'It feels really cozy in here. I could stay all day. I won\'t. But I could.'
                : 'It\'s cozy! Maybe a lamp? Everybody always says "add a lamp." I\'m saying it too.';
            await UI.say(id, voiced(id, verdict), { keep: true });
            // a little something, sometimes
            const r = rel(id);
            if (R() < 0.35 + hearts(id) * 0.08) {
                const t = TALK[id];
                const gift = t && t.loves ? rpick(t.loves.filter(x => ITEMS[x] && ITEMS[x].type === 'dish').concat(['fruit_salad'])) : rpick(['cheesecake', 'fried_rice', 'truffles']);
                await UI.say(id, voiced(id, 'Oh! I almost forgot. I brought you something.'), { keep: true });
                p.pose = 'cheer'; p.poseT = 30;
                Sfx.play('fanfare');
                receive(gift, 1);
            }
            if (r.houseDay !== Clock.dayNum()) { r.houseDay = Clock.dayNum(); const up = addPts(id, 3); if (up) { UI.hideDialog(); await heartUp(n, up); } }
            S.stats.guests = (S.stats.guests || 0) + 1;
            await UI.say(id, voiced(id, rpick(VISIT_BYE)));
            // and out the door
            walkNpc(n, a.doorTile[0], a.doorTile[1] - 1);
            for (let i = 0; i < 300 && n.path; i++) { stepNpc(n); await waitFrames(1); }
            Sfx.play('door');
        } catch (e) { console.error(e); }
        finally {
            n.script = false; n.talking = false; n.path = null;
            if (n.area === 'home') { n.area = null; n.sleeping = true; }
            n.segKey = null;
            NPCs.place(true);
            UI.hideDialog();
            G.busy--;
        }
    },
};

