/* ---- 54_events.js ---- */
/* Daily things, holidays, the birthday party, Jackbox night, shooting stars, fireworks */
function dailyCheck(force) {
    const day = Clock.dayNum();
    if (!force && S.day === day) return false;
    const first = S.day === 0 || S.day == null;
    S.day = day;
    G.weather = todayWeather();
    G.events = todayEvents();
    try { postYesterday(); Requests.tick(); dayStatsTick(); arcadeRivals(); shopsTick(); festTick(); bankTick(); postTick(); townTick(); worldFetch(); marketDividends(); communityTick(); flowerBreed(); } catch (e) { console.error(e); }
    const r = mulberry(hash32(S.seed + ':mail:' + day));
    if (!first) {
        // Harvard's letters and Joe's poems are for Sarah
        if (r() < 0.22 && !Online.visitor()) { const m = rpick(HARVARD_MAIL, r); sendMail({ from: 'harvard', subject: m.subject, body: fillText(m.body) }); }
        if (r() < 0.2 && S.flags.metJoe && !Online.visitor()) {
            const [title, lines] = rpick(JOE_POEMS, r);
            const intro = rpick(['Hi! I wrote a new poem and I had to send it right away.', 'Hey you. Couldn\'t sleep, so I wrote something.', "Good morning! I've been up since six. A new poem, fresh from the desk."], r);
            sendMail({ from: 'joe', subject: `A new poem: "${title}"`, body: `${intro}\n\n"${title}"\n${lines.join('\n')}\n\nSee you later!\n- Joe`,
                gift: r() < 0.4 ? rpick(['rose_vase', 'framed_poem', 'sonnet_stack', 'typewriter'], r) : null });
        }
        if (G.events.has('valentine') && !S.flags['val' + day] && !Online.visitor()) {
            S.flags['val' + day] = true;
            sendMail({ from: 'joe', subject: "Happy Valentine's Day", body: "Hi,\nHappy Valentine's Day! I made you a card. It has a frog on it. The frog is holding a heart. The frog is not me. (The frog is me.)\nThere's a heart lamp too. Coco said you have to give a lamp. I don't know why. It's a nice lamp.\n\nOkay bye!\nJoe\n\nP.S. Please don't show Coco.", gift: 'heart_lamp' });
        }
        if (!S.flags.gardenMail && !Online.visitor()) {
            S.flags.gardenMail = true;
            sendMail({ from: 'ginger', subject: 'A community garden!', body: "Sarah!\nThe crew and I built a community garden by the farm: eight raised beds just down the path from the crossroads, and we planted fruit trees round the fields while we were at it.\nAnyone can plant there. Whatever seeds we have left over, we pop into an empty bed, so check it in the mornings. Some days there's something ready to pick!\nAnd your garden plots by the house are proper planter boxes now. No more losing them in the grass.\n- Ginger" });
        }
        if (!S.flags.toolsMail) {
            S.flags.toolsMail = true;
            sendMail({ from: 'fortune', subject: 'New on the tool rack!', body: "Hello hello!\nNew at Fortune's Goods: an axe and a shovel!\nChop wood (trees give three pieces a day), dig holes, plant saplings, bury fruit to grow fruit trees.\nAnd if you ever see something glinting in the grass... dig it up. Trust the cookie.\n- Fortune" });
        }
        if (!S.flags.arcadeMail && day >= (S.startDay || day) + 2) {
            S.flags.arcadeMail = true;
            addTickets(10, true);
            sendMail({ from: 'chili', subject: 'The arcade is OPEN', body: `Hey!\nThe arcade on the Boardwalk is open, ${hoursText('arcade')}. I run the prize counter in the afternoon (honor system when I'm on a break).\nPlay the cabinets, win tickets, trade them for prizes. Your first game on every machine is free.\nI put 10 tickets on your card to start. They're warm. Everything I touch is warm.\n- Chili` });
        }
        if (!S.flags.karaokeMail && day >= (S.startDay || day) + 3) {
            S.flags.karaokeMail = true;
            sendMail({ from: 'wasabi', subject: 'KARAOKE IS LIVE', body: "YOOO!\nKaraoke at Club Wasabi. Every night. (Every day too. I don't sleep.)\nJoe gave me ALL his poems. You sing them, the crowd loses it, everybody wins.\nAlso, Cuke says there's jump rope in the plaza on nice afternoons. Cuke says a lot of things. This one's true.\n- DJ Wasabi" });
        }
        if (G.events.has('lunar') && !S.flags['lny' + day]) {
            S.flags['lny' + day] = true;
            sendMail({ from: 'wonton', subject: 'Red envelope!', body: 'Happy Lunar New Year!\nHere is a red envelope. Inside: good luck, and 888 sand dollars. And no soup.\n- Wonton' });
            addMoney(888, true, 'Found & gifts');
        }
    }
    Drama.daily(day);
    if (!first) { movesDaily(day); lostDaily(day); }
    Plans.reset();
    // reveal mail that was scheduled for today
    Save.touch();
    return true;
}

/* the final big update: a letter for islands that were already here when it arrived (new islands just find it all) */
function newsCheck() {
    newsCheck10();
    if (!S || !S.flags || S.flags.news9 || !S.flags.introDone) return;
    S.flags.news9 = true;
    sendMail({ from: 'fortune', subject: 'Big island news!', body: "Hello hello!\nSo much new on the island this week. The cookie told me to write it all down:\n\n" +
        "- The old lighthouse on the beach is open. People say it's haunted. I say bring a snack.\n" +
        "- Friends might ask you for little favors now. Your phone has a new To-do app to keep track.\n" +
        "- Cooking is hands-on! The first time you make a dish, you really make it. Chop, stir, flip. Gold medals make two.\n" +
        "- Special things are hidden all over: fishing crates, sparkly trees, favors, high scores, new recipes. The Collection app lists them.\n" +
        "- Gems glint on the mountain top every day. The lookout telescope has the whole sea in it.\n" +
        "- The arcade has a new cabinet, Snack Stack. And Bento Blocks can hold a piece now!\n" +
        "- Eating at Mac's? Text a friend to join you. Joe always says yes.\n" +
        "- Floss has new styles, Clementine has new sewing patterns, and Brulee lets you choose what hangs in the museum.\n\n" +
        "Oh, and Ginger says there's an old trunk in the barn nobody has opened in a hundred years. I'm just saying.\n- Fortune" });
    Save.touch();
}

/* and the very last touches */
function newsCheck10() {
    if (!S || !S.flags || S.flags.news10 || !S.flags.introDone) return;
    S.flags.news10 = true;
    sendMail({ from: 'fortune', subject: 'Island time, but earlier!', body: "Hello hello!\nA few little changes around the island:\n\n" +
        `- Shops open around 8 AM now and close around 10 PM. Mine is open ${hoursText('shop')}. Everyone's up earlier too. Well. Most of us.\n` +
        "- If nobody's at a counter, it's the honor system! Leave the sand dollars in the jar. The jar keeps track. Somehow.\n" +
        "- There's a Run button now (the little shoe by the map, or press R). Zoom zoom.\n" +
        "- The map shows whose house is whose. No more knocking on the wrong door. (Coco LOVES when people knock on the wrong door.)\n" +
        "- Look around! A volleyball court on the beach, an ice cream cart on the Boardwalk, a fountain on Main Street, and more.\n" +
        "- Full pockets? Whatever you pick up goes straight home to storage. Sand dollars always fit.\n\n" +
        "That's all! Now go outside. It's a nice day. It's always a nice day.\n- Fortune" });
    Save.touch();
}

/* holiday decorations on the island */
function decorateIsland(a) {
    // (what stood solid comes down with the rest)
    for (const e of a.ents) if (e.holiday && e.solidTile) a.block(e.solidTile[0], e.solidTile[1], 0);
    a.ents = a.ents.filter(e => !e.holiday);
    const ev = G.events || new Set();
    const put = (frame, tx, ty, light, model) => {
        const e = a.add({ holiday: true, kind: 'deco', frame, x: (tx + 0.5) * TILE, y: (ty + 1) * TILE - 2, model3d: model || null });
        if (light) e.light = { r: 34, y: -12 };
        return e;
    };
    // a decoration standing on the ground, solid like any prop: never on a path, the water or anything already there
    const stand = (frame, tx, ty, light, model) => {
        const c = groundChar(tx, ty);
        if (a.blockedAt(tx, ty) || a.waterAt(tx, ty) || pathAt(tx, ty) || 'pdbw~'.includes(c) || a.ents.some(o => o.holiday && o.solidTile && o.solidTile[0] === tx && o.solidTile[1] === ty)) return null;
        const e = put(frame, tx, ty, light, model);
        a.block(tx, ty, 1); e.solidTile = [tx, ty];
        return e;
    };
    const [x0, y0, x1, y1] = W0.plaza;
    const [hx, hy] = doorTileOf('home');
    // Spooky Season (David, 27 October: decorations that fit the day, more the more it matters): big jack-o'-lanterns at
    // every shop and building's front corners and by every house's door, hay bales piled with pumpkins at the square's
    // corners, orange and purple bunting across it; on Halloween itself a jack-o'-lantern by every lamp post too
    if (ev.has('spooky') || ev.has('halloween')) {
        const jack = (k) => hash32('jack' + k) % 3 ? 'jack_o_lantern' : 'jack_o_lantern_b';
        for (const [x, y] of [[x0 + 1, y0 + 1], [x1 - 1, y0 + 1], [x0 + 1, y1 - 1], [x1 - 1, y1 - 1]]) {
            for (let r = 0; r <= 2; r++) if (stand('f_pumpkin_pile', x + (x < (x0 + x1) / 2 ? r : -r), y, true, 'jack_stack')) break;
        }
        for (const [id, b] of Object.entries(W0.buildings)) {
            const row = b.y + b.h, door = b.x + b.door, house = id === 'home' || id.startsWith('h_');
            const spots = id === 'home' ? [[door - 1, row], [door + 1, row]] : house ? [[door + (hash32(id) % 2 ? 1 : -1), row], [door - (hash32(id) % 2 ? 1 : -1), row]] : [[b.x, row], [b.x + b.w - 1, row]];
            let n = 0;
            for (const [x, y] of spots) if (x !== door && (!house || id === 'home' || !n) && stand('f_pumpkin_lantern', x, y, true, jack(id + x))) n++;
        }
        for (const [x, y] of [[x0 - 4, y1 + 5], [W0.spots.pier.x - 1, W0.spots.pier.y - 4]]) stand('f_pumpkin_lantern', x, y, true, jack(x + ',' + y));
        bunting('bunting', 'bunting_spooky');
        if (ev.has('halloween')) for (const p of W0.props) if (p.kind === 'lamp') { for (const dx of [1, -1]) if (stand('f_pumpkin_lantern', p.x + dx, p.y, true, jack(p.x + ',' + p.y))) break; }
    }
    if (ev.has('lunar')) for (const [x, y] of [[x0 + 3, y0], [x1 - 3, y0], [x0 + 3, y1], [x1 - 3, y1], [W0.spots.spring.x - 2, W0.spots.spring.y]]) put('f_lunar_lantern', x, y, true);
    if (ev.has('lights')) for (const [x, y] of [[x0, y0 + 1], [x1, y0 + 1], [x0, y1 - 1], [x1, y1 - 1], [hx - 3, hy + 1], [hx + 3, hy + 1]]) put('f_red_lantern', x, y, true);
    if (ev.has('birthday')) for (const [x, y] of [[x0 + 4, y0 + 2], [x1 - 4, y0 + 2], [x0 + 7, y0 + 1]]) put('f_heart_lamp', x, y, true);
    // little holidays: bunting, lanterns or hearts around the plaza
    for (const h of holidaysToday()) {
        if (!h.deco) continue;
        if (h.deco.startsWith('bunting')) bunting(h.deco, h.deco);
        else if (h.deco === 'lanterns') { for (const [x, y] of [[x0, y0 + 1], [x1, y0 + 1], [x0, y1 - 1], [x1, y1 - 1]]) put('f_lunar_lantern', x, y, true); }
        else if (h.deco === 'hearts') { for (const [x, y] of [[x0 + 3, y0 + 1], [x1 - 3, y0 + 1], [x0 + 3, y1 - 1], [x1 - 3, y1 - 1]]) put('f_heart_lamp', x, y, true); }
    }
    // a neighbor's party tonight: lanterns go up around the spot
    const d = typeof Drama !== 'undefined' && S && S.drama ? Drama.cur() : null;
    if (d && Drama.state(d).gathering && d.pday === Clock.dayNum()) {
        const s = W0.spots[d.place] || W0.spots.plaza;
        const deco = d.tpl === 'surprise' ? 'f_heart_lamp' : 'f_red_lantern';
        for (const [dx, dy] of [[-4, -3], [4, -3], [-4, 3], [4, 3]]) {
            const f = a.nearestFree(s.x + dx, s.y + dy, 2);
            if (f) put(deco, f[0], f[1], true);
        }
    }
    // bunting across three open tiles of the square, and the row behind them, near each of its four quarters
    function bunting(frame, model) {
        const open3 = (x, y) => {
            for (let r = 0; r <= 3; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
                if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
                const tx = x + dx, ty = y + dy;
                if ([0, 1, 2].every(i => !a.blockedAt(tx + i, ty) && !a.blockedAt(tx + i, ty - 1))) return [tx, ty];
            }
            return null;
        };
        for (const [x, y] of [[x0 + 6, y0 + 3], [x1 - 8, y0 + 3], [x0 + 6, y1 - 3], [x1 - 8, y1 - 3]]) {
            const f = open3(x, y);
            if (!f) continue;
            const e = a.add({ holiday: true, kind: 'deco', frame, x: (f[0] + 1.5) * TILE, y: (f[1] + 1) * TILE - 2, model3d: model });
            e.hit = null;
        }
    }
}

/* ---------------------------------------------------------------- birthday */
async function birthdayParty() {
    if (Online.visitor()) return;                       // it's Sarah's birthday (her visitors can still say so)
    const year = Clock.dayDate().getFullYear();
    if (S.flags['bday' + year] || !S.birthday) return;
    S.flags['bday' + year] = true;
    G.busy++;
    const p = G.player;
    const who = ['cece', 'david', 'coco', 'kai', 'chili', 'cuke'].map(id => NPCs.get(id)).filter(Boolean);
    const spots = [[-26, -8], [26, -8], [-20, 14], [20, 14], [-34, 4], [34, 4]];
    const saved = who.map(n => ({ n, area: n.area, x: n.x, y: n.y, sleeping: n.sleeping, key: n.spotKey }));
    who.forEach((n, i) => { n.area = G.area.id; n.sleeping = false; n.x = p.x + spots[i][0]; n.y = p.y + spots[i][1]; n.talking = true; n.flip = n.x > p.x; });
    const joe = NPCs.get('joe');
    const jsave = { area: joe.area, x: joe.x, y: joe.y, sleeping: joe.sleeping };
    joe.area = G.area.id; joe.sleeping = false; joe.x = p.x; joe.y = p.y + 26; joe.dir = 'up'; joe.talking = true;
    p.dir = 'down';
    Sfx.play('party');
    confetti(p.x, p.y - 20, 80);
    await UI.say('everyone', 'SURPRISE! HAPPY BIRTHDAY, SARAH!', { keep: true });
    await UI.say('cece', "I made you a birthday cheesecake! It didn't crack! Well. It cracked a little. I fixed it. Sorry!", { keep: true });
    await UI.say('david', "Happy birthday, sister! You're a year more iconic. Here, a crown. Obviously.", { keep: true });
    await UI.say('coco', 'I told everyone. Obviously. This is the one time that is a good thing.', { keep: true });
    await UI.say('joe', "I wrote a birthday poem. It's about cake. Everything good is about cake.", { keep: true });
    await UI.say('joe', BIRTHDAY_POEM.join('\n'), { keep: true, letter: true });
    await UI.say('everyone', '*applause* (the goat also claps, somehow)', { keep: true });
    p.pose = 'cheer'; p.poseT = 60;
    Sfx.play('fanfare');
    receive('birthday_cake', 1);
    receive('acc_crown', 1);
    receive('cheesecake', 1);
    UI.hideDialog();
    await waitFrames(30);
    saved.forEach(s => { s.n.talking = false; s.n.spotKey = null; });
    joe.talking = false; joe.spotKey = null;
    NPCs.place(true);
    G.busy--;
}
function confetti(x, y, n) {
    const cols = ['#ff5aa8', '#ffd84a', '#4ec3d9', '#8cc152', '#ff8a4a', '#b37cf0'];
    for (let i = 0; i < n; i++) {
        const a = R() * Math.PI * 2, sp = 0.6 + R() * 2.2;
        G.fx.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2, t: 0, life: 70 + rint(0, 40), c: rpick(cols),
            update() { this.x += this.vx; this.y += this.vy; this.vy += 0.06; this.vx *= 0.98; },
            draw(ctx) { ctx.fillStyle = this.c; ctx.globalAlpha = Math.min(1, (this.life - this.t) / 20); ctx.fillRect(Math.round(this.x), Math.round(this.y), 2, 2); ctx.globalAlpha = 1; } });
    }
}

/* ---------------------------------------------------------------- Jackbox night (whenever Elizabeth is visiting: 9 PM to midnight, at Sarah's) */
async function jackboxNight() {
    const key = 'jb' + Clock.dayNum();
    if (S.flags[key] || !visitorsToday().includes('elizabeth') || !hourIn(Clock.hourF(), 21, 24) || !S.npcs.elizabeth || !S.npcs.elizabeth.met) return;
    S.flags[key] = true;
    G.busy++;
    const a = G.area, p = G.player;
    const f = a.floor;
    const spots = openSpots(a, 3, f.x0 + f.w / 2 - 0.5, f.y0 + f.h / 2 - 0.5).sort((q, r) => q[0] - r[0]);
    const cast = ['elizabeth_down_stand', 'david_down_stand', 'joe_down_stand'].map((fr, i) =>
        a.add({ kind: 'guest', frame: fr, x: (spots[i][0] + 0.5) * TILE, y: (spots[i][1] + 1) * TILE - 2 }));
    faceToward(p, cast[1]);
    await waitFrames(20);
    await UI.say('elizabeth', 'JACKBOX NIGHT! Phones out. Controllers out. Friendships... at risk.', { keep: true });
    await UI.say('david', "I'm going to win. I've already won. I won in the car.", { keep: true });
    await UI.say('joe', "I answered every prompt with a poem. 'My cat is fat. She sat on my hat.' It works for everything.", { keep: true });
    await UI.say('elizabeth', 'Joe. The prompt was "draw a horse."', { keep: true });
    await UI.say('joe', '...I drew a hat.', { keep: true });
    await UI.say(null, 'Three rounds later...', { keep: true });
    await UI.say('everyone', 'DAVID WON. OBVIOUSLY.', { keep: true });
    await UI.say('david', 'Thank you, thank you. I would like to thank my rainbow trail and nobody else.', { keep: true });
    if (!S.flags.jbTrophy) {
        S.flags.jbTrophy = true;
        receive('jackbox_trophy', 1);
        await UI.say('elizabeth', 'Here. David insists everyone gets a trophy that says HE won. Same time next visit.', { keep: true });
    }
    addPts('david', 4); addPts('joe', 4);
    UI.hideDialog();
    for (const e of cast) a.remove(e);
    G.busy--;
}

/* ---------------------------------------------------------------- night sky: shooting stars + fireworks */
const Sky = {
    star: null, fwT: 0,
    update() {
        if (G.area.interior || !G.player) return;
        const h = Clock.hourF();
        const night = h >= 21 || h < 4.5;
        if (this.star) {
            const s = this.star;
            s.t++;
            s.x += s.vx; s.y += s.vy;
            if (s.t > 60) this.star = null;
        } else if (night && (G.weather === 'sunny' || G.weather === 'cloudy') && R() < (G.events && G.events.has('stargazing') ? 1 / 110 : bonusOn('wish') ? 1 / 160 : 1 / 900)) {
            const v = G.view;
            this.star = { x: G.cam.x + v.w * (0.3 + R() * 0.6), y: G.cam.y + 10 + R() * v.h * 0.25, vx: -2.6, vy: 1.1, t: 0 };
        }
        const ev = G.events || new Set();
        if ((ev.has('july4') && h >= 21) || (ev.has('nye') && h >= 23.5) || (ev.has('newyear') && h < 1)) {
            if (--this.fwT <= 0) {
                this.fwT = rint(20, 55);
                const v = G.view;
                firework(G.cam.x + v.w * (0.15 + R() * 0.7), G.cam.y + v.h * (0.1 + R() * 0.3));
            }
        }
    },
    draw(ctx) {
        const s = this.star;
        if (!s) return;
        const a = 1 - s.t / 60;
        const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 10, s.y - s.vy * 10);
        grad.addColorStop(0, `rgba(255,250,210,${a})`);
        grad.addColorStop(1, 'rgba(255,250,210,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 10, s.y - s.vy * 10); ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fillRect(Math.round(s.x) - 1, Math.round(s.y) - 1, 2, 2);
    },
    async wish() {
        if (!this.star) return false;
        this.star = null;
        S.flags.wished = Clock.dayNum();
        Save.touch();
        const p = G.player;
        p.pose = 'cheer'; p.poseT = 40;
        Sfx.play('wish');
        UI.toast('Sarah made a wish on a shooting star. Check the beach tomorrow.', 'shell_star');
        return true;
    },
};
function firework(x, y) {
    Sfx.play('firework');
    const cols = ['#ff5aa8', '#ffd84a', '#4ec3d9', '#8cc152', '#ffffff', '#ff6a3a'];
    const c = rpick(cols);
    // in the HD-2D view the sky is the top of the screen (the flat view's spot would be on the ground): burst there, as soft sparks
    const hd = R3.shown && !G.area.interior;
    if (hd) { const v = G.view; x = v.w * (0.15 + R() * 0.7); y = v.h * (0.05 + R() * 0.15); }
    for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2, sp = 1.2 + R() * 0.5;
        G.fx.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, life: 50, c, glow: true, screen: hd,
            update() { this.x += this.vx; this.y += this.vy; this.vx *= 0.96; this.vy = this.vy * 0.96 + 0.03; },
            draw(ctx) {
                ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = this.c; ctx.globalAlpha = 1 - this.t / this.life;
                if (!hd) ctx.fillRect(Math.round(this.x), Math.round(this.y), 2, 2);
                else { ctx.beginPath(); ctx.arc(this.x, this.y, 0.9, 0, 7); ctx.fill(); ctx.globalAlpha *= 0.3; ctx.beginPath(); ctx.arc(this.x, this.y, 2.2, 0, 7); ctx.fill(); }
                ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
            } });
    }
}

/* things that happen when Sarah arrives somewhere */
Bus.on('enter', async where => {
    if (where === 'home') {
        if (!S.flags.homeIntro) {
            S.flags.homeIntro = true;
            G.busy++;
            await waitFrames(20);
            await UI.say(null, ["Sarah's new house! It's small, but it has a kitchenette, a bed, and very good vibes.",
                'Tip: open the phone and tap Decorate to move furniture around. Furniture you buy is delivered here.']);
            G.busy--;
        }
        await jackboxNight();
    }
});

