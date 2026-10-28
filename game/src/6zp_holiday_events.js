/* ---- 6zp_holiday_events.js ---- */
/* More holidays with something to do (docs/ROADMAP.md: "way more holiday events"; the first six are in 6z_festivals.js):
   - New Year's Eve: everyone who's still up gathers on the square from a little after 11 (nyeOverride, staying up past
     bed for it); ten seconds before island midnight a countdown fills the screen, and at midnight the square cheers,
     fireworks go up, and each neighbor there with Sarah counts it as time together (NewYear, every frame).
   - The Fourth of July and Stargazing Night: everyone out at the beach for the fireworks, up at the lookout for the stars
     (Gathering, with New Year's Eve's square).
   - Pirate Day: a map in a bottle from Kai in the morning, steps from a landmark to an X, and treasure under it
     (pirateTick, addPirateX).
   - Lunar New Year: on top of Wonton's red envelope in the mail, each neighbor hands Sarah one the first time they see
     her that day (88 sand dollars and a wish: lunarHello).
   - Valentine's Day: "Happy Valentine's!" in the talk menu gives a neighbor a card; each takes it their own way, and a
     good friend (three hearts) gives a box of truffles back (valentineOptions). */
const NYE_FROM = 23.2, NYE_TO = 24.75;
const LUNAR_LINES = ['Happy Lunar New Year! Here, a red envelope. For luck. And for snacks. Mostly luck.',
    'A red envelope for you! Inside: good fortune. Also 88 sand dollars. The fortune is the main thing. The money is also nice.',
    "Happy New Year! Here's a red envelope. May your year be full of good things. Like this envelope."];
const VAL_LINES = {
    _: ["A valentine? For me? I'm keeping it forever. Or until it falls behind the dresser. Then forever back there.", "Aww! A card! Happy Valentine's Day to you too!"],
    maki: ['A valentine. With a border. Evenly spaced. This is the most thoughtful thing anyone has ever given me.'],
    kai: ["Duuude. A valentine? For me? I'm putting it on my board. Like, on my actual surfboard. Respectfully."],
    basil: ["A card! I'm putting it on the cart, right by the noodles. Everyone will see it. Good."],
    wonton: ['A valentine. In my spring it will get wet. I will keep it on the rock. The special rock.'],
    chili: ["Okay, a valentine is... hot. I mean nice. It's very nice. Thanks. I'm blushing. I'm always red. You can't tell."],
    coco: ["A VALENTINE! For ME! I'm telling everyone. Okay, so. Who else did you give one to? You can tell me. I won't tell. (I'll tell.)"],
    cece: ["You made me a valentine?! Sorry. I mean thank you. I'm going to cry a little. Sorry. Happy crying!"],
    clementine: ['Darling, the card stock! The lettering! I adore it. I shall frame it in orange.'],
    cuke: ['A valentine! I read it twice already. Once while jogging. It was harder to read while jogging!'],
    sully: ["A valentine. Kid, you're wicked sweet. Don't tell the guys at the studio I'm smiling."],
    ginger: ['A card! Sturdy fold, straight edges. Built to last. Like a good friendship.'],
    brulee: ['Une carte de Saint-Valentin! I will put it in the museum. In the most important case. Mine.'],
    mac: ["For me? Aw, shucks. You're sweeter than my mac and cheese. Okay, almost."],
    joe: ["You made me a card? I... I made you one too. It's at home. It has a frog on it. Can I give it to you later? Don't open it in front of Coco."],
};
const NYE_LINES = ["Happy New Year! Ten out of ten countdown. I counted along. I got to four.", 'Happy New Year! This year is going to be the best one. I can feel it in my toppings.',
    "Happy New Year! I made a resolution: more of this. Standing on the square with everyone. That's the whole resolution."];

/* ---------------------------------------------------------------- nights everyone's out together */
/* New Year's Eve on the square, the Fourth of July's fireworks from the beach, Stargazing Night up at the lookout: all
   who're up go (a `late` override, so they stay up past bed for it); when Sarah comes by, each there says hello and it
   counts as a little time together, once a night (Gathering) */
const GATHER = { nye: ['plaza', NYE_FROM, NYE_TO], july4: ['beach', 20.8, 23.2], stargazing: ['lookout', 21, 23.6] };
const GATHER_LINES = {
    nye: ['Almost midnight! Did you make a resolution? Mine is to stay up until midnight. So far so good.', "Everyone's here! Get ready to count. I practice counting backwards every year. It never gets easier."],
    july4: ['Happy Fourth! Grab a spot on the sand, the fireworks start any minute!', "I brought a blanket. It's for sitting. And for hiding under if they're too loud."],
    stargazing: ["Look up! There's one! ...That was a plane. Wait, THERE'S one!", 'Make a wish when you see one. I wished for more wishes. Is that allowed? It should be allowed.'],
};
function gatherOf(day) {
    const dt = new Date(day * 86400e3);
    const h = holidaysOn(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()).find(x => GATHER[x.id]);
    return h ? h.id : null;
}
function nyeDay(day) { return gatherOf(day) === 'nye'; }
function gatherOverride(id, day) {
    const g = gatherOf(day), d = NPC_DEFS[id] || {};
    if (!g || d.goat || d.dj || d.shop || d.spring || d.early) return null;
    const [spot, a, b] = GATHER[g];
    return [['party:' + spot, a, b, { late: true }]];
}
const Gathering = {
    /* every second or so: Sarah among the crowd, on its night and in its hours */
    tick() {
        if (!S || G.mode !== 'play' || G.frame % 60 || !G.area || G.area.id !== 'island' || G.busy || Online.visitor()) return;
        const day = Clock.dayNum(), g = gatherOf(day);
        if (!g || S.flags['gather' + day]) return;
        const [spot, a, b] = GATHER[g], h = dayHour(), sp = W0.spots[spot], p = G.player;
        if (!sp || h < a || h > b || Math.hypot(p.x / TILE - sp.x, p.y / TILE - sp.y) > 9) return;
        const there = NPCs.here().filter(n => n.want && n.want.party && TALK[n.id] && Math.hypot(n.x - p.x, n.y - p.y) < 10 * TILE);
        if (there.length < 2) return;
        S.flags['gather' + day] = 1;
        for (const n of there) { addPts(n.id, 1); remember(n.id, 'gather'); n.emote = rpick(['heart', 'note', 'sparkle']); n.emoteT = 120; }
        const n = rpick(there);
        Bubbles.show(n, voiced(n.id, rpick(GATHER_LINES[g])));
        setTimeout(() => Bubbles.hide(n), 3800);
        Save.touch();
    },
};
const NewYear = {
    done: null, el: null, timer: null,
    /* every frame: ten seconds before island midnight on New Year's Eve */
    tick() {
        if (!S || !G.events || !G.events.has('nye') || G.mode === 'title') return;
        const t = Clock.island();
        if (t.getHours() !== 23 || t.getMinutes() !== 59 || t.getSeconds() < 50 || this.done === Clock.dayNum()) return;
        this.done = Clock.dayNum();
        this.count();
    },
    show(text, big) {
        if (!this.el) {
            this.el = el('div', 'nye-count');
            Object.assign(this.el.style, { position: 'fixed', left: '50%', top: '20%', transform: 'translate(-50%, -50%)', zIndex: 9999, pointerEvents: 'none',
                fontFamily: 'inherit', fontWeight: 800, color: '#ffd84a', textShadow: '0 4px 0 #6a3a10, 0 0 24px rgba(255,200,80,.6)', textAlign: 'center', whiteSpace: 'nowrap' });
            document.body.appendChild(this.el);
        }
        this.el.style.fontSize = big ? 'min(22vmin, 160px)' : 'min(11vmin, 80px)';
        this.el.textContent = text;
        this.el.hidden = !text;
    },
    count() {
        clearInterval(this.timer);
        this.timer = setInterval(() => {
            const t = Clock.island();
            if (t.getHours() === 23) { this.show(String(60 - t.getSeconds()), true); return; }
            clearInterval(this.timer);
            this.cheer();
        }, 100);
    },
    /* midnight: the square cheers */
    async cheer() {
        this.show('Happy New Year!', false);
        setTimeout(() => this.show(''), 5000);
        Sfx.play('fanfare');
        for (let i = 0; i < 8; i++) setTimeout(() => { if (G.area && !G.area.interior) { const v = G.view; firework(G.cam.x + v.w * (0.15 + R() * 0.7), G.cam.y + v.h * (0.1 + R() * 0.3)); } }, i * 350);
        const year = Clock.island().getFullYear();
        const p = G.player, sq = W0.spots.plaza, near = G.area && G.area.id === 'island' && sq && Math.hypot(p.x / TILE - sq.x, p.y / TILE - sq.y) < 14;
        const there = near ? NPCs.here().filter(n => n.want && n.want.party && Math.hypot(n.x - p.x, n.y - p.y) < 14 * TILE) : [];
        for (const n of there) { n.emote = rpick(['heart', 'sparkle', 'note']); n.emoteT = 150; n.pose = 'cheer'; n.poseT = 90; }
        if (p) { p.pose = 'cheer'; p.poseT = 90; p.emote = 'sparkle'; p.emoteT = 120; }
        townLog(near ? `The island counts down to ${year} together on the square.` : `The island welcomes ${year}.`);
        if (!near || S.flags['nye' + year] || Online.visitor()) return;
        S.flags['nye' + year] = true;
        for (const n of there) { if (TALK[n.id]) { addPts(n.id, 3); remember(n.id, 'newyear'); } }
        S.stats.newYears = (S.stats.newYears || 0) + 1;
        Save.touch();
        const n = there.find(x => TALK[x.id]);
        if (n && !G.busy && !UI.modal) setTimeout(() => { if (!G.busy) Bubbles.show(n, voiced(n.id, rpick(NYE_LINES))); setTimeout(() => Bubbles.hide(n), 3500); }, 1800);
    },
};

/* ---------------------------------------------------------------- Pirate Day: a treasure hunt */
/* in the morning a map in a bottle (a letter from Kai) says how many steps from a landmark to walk; an X marks the
   spot there, and the shovel digs up the treasure: Kai's treasure chest the first year, sand dollars after that */
const PIRATE_MARKS = { oldtree: 'the big old tree in the forest', waterfall: 'the waterfall', pond: 'the pond', lookout: 'the lookout',
    bonfire: 'the bonfire on the beach', orchard: 'the orchard', harbor: 'the harbor', meadow: 'the meadow' };
/* today's treasure: where it is and the clue, the same all day */
function pirateSpot(day) {
    const a = G.areas && G.areas.island;
    if (!a) return null;
    const r = mulberry(hash32(S.seed + ':pirate:' + day)), grass = grassSpots(a);
    for (const k of shuffled(Object.keys(PIRATE_MARKS).filter(k => W0.spots[k]), r)) {
        const L = W0.spots[k], near = grass.filter(([x, y]) => { const d = Math.abs(x - L.x) + Math.abs(y - L.y); return d >= 3 && d <= 7; });
        if (!near.length) continue;
        const [x, y] = near[Math.floor(r() * near.length)], dx = x - L.x, dy = y - L.y;
        const leg = (n, pos, neg) => n ? `${Math.abs(n)} ${plural(Math.abs(n), 'step')} ${n > 0 ? pos : neg}` : '';
        const walk = [leg(dx, 'east', 'west'), leg(dy, 'south', 'north')].filter(Boolean).join(', then ');
        return { x, y, clue: `Start at ${PIRATE_MARKS[k]}. Walk ${walk}. Dig where X marks the spot.` };
    }
    return null;
}
function pirateTick() {
    if (!festOn('pirateday') || !S.drops) return;
    const a = G.areas && G.areas.island, st = festDay('pirate');
    if (!st.spot) {
        st.spot = pirateSpot(Clock.dayNum());
        if (!st.spot) return;
        sendMail({ from: 'kai', subject: 'Arr! A treasure map!', body: `Ahoy, {name}!\nI found a map in a bottle on the beach this morning. It says:\n\n"${st.spot.clue}"\n\nI'd dig it up myself, but I don't have a shovel. Or hands. Bring a shovel! Arr!\n- Captain Kai (just Kai)` });
        Save.touch();
    }
    if (a && !st.dug && !a.ents.some(e => e.pirateX)) addPirateX(a, st.spot.x, st.spot.y);
}
function addPirateX(a, tx, ty) {
    const [fx, fy] = tileFoot(tx, ty), day = Clock.dayNum();
    const e = a.add({ kind: 'deco', pirateX: true, day, layer: 0, x: fx, y: fy - 3 });
    e.hit = { x: tx * TILE, y: ty * TILE, w: TILE, h: TILE };
    e.draw = ctx => {
        // a big X scratched in the ground
        const x = Math.round(e.x), y = Math.round(e.y);
        ctx.fillStyle = 'rgba(120,30,20,0.85)';
        for (let i = -4; i <= 4; i++) { ctx.fillRect(x + i, y + i, 2, 2); ctx.fillRect(x + i, y - i, 2, 2); }
    };
    e.interact = async () => {
        if (heldTool() !== 'shovel') { await UI.say(null, 'An X, scratched into the ground. Somebody wanted this spot found. A shovel would help.'); return; }
        G.busy++;
        try { await toolSwing('shovel', () => { Sfx.play('dig'); dirtFx(e.x, e.y - 2); }); } finally { G.busy--; }
        a.remove(e);
        const st = festDay('pirate');
        st.dug = true;
        Sfx.play('fanfare');
        G.player.pose = 'cheer'; G.player.poseT = 50;
        if (firstWin('pirate_chest')) { receive('treasure_chest', 1); addMoney(1000, true, 'Found & gifts'); await UI.say(null, 'Treasure! A real treasure chest, and 1,000 sand dollars inside it. Arr!'); }
        else { addMoney(1500, true, 'Found & gifts'); await UI.say(null, "Treasure! A little bag of 1,500 sand dollars. Somebody's going to miss these. (Nobody's going to miss these. Arr!)"); }
        townLog(`${S.playerName || 'Sarah'} digs up the Pirate Day treasure.`);
        Save.touch();
    };
}
Bus.on('enter', id => { if (id === 'island') pirateTick(); });

/* ---------------------------------------------------------------- Lunar New Year, Valentine's Day */
/* the first talk of the day: a red envelope */
async function lunarHello(n, firstToday) {
    const r = rel(n.id), day = Clock.dayNum();
    if (!firstToday || !isHoliday('lunar') || r.lnyDay === day || !TALK[n.id] || n.id === 'wonton' || Online.visitor()) return;
    r.lnyDay = day;
    n.emote = 'sparkle'; n.emoteT = 70;
    await UI.say(n.id, voiced(n.id, rpick(LUNAR_LINES)), { keep: true });
    addMoney(88, true, 'Found & gifts');
    Sfx.play('item');
}
/* in the talk menu */
function valentineOptions(n) {
    const id = n.id, r = rel(id), day = Clock.dayNum(), out = [];
    if (isHoliday('valentine') && r.valDay !== day && (TALK[id] || id === 'joe')) out.push({ label: "Happy Valentine's!", fn: async () => { await valentineGive(n); return true; } });
    return out;
}
async function valentineGive(n) {
    const id = n.id, r = rel(id);
    r.valDay = Clock.dayNum();
    G.player.pose = 'cheer'; G.player.poseT = 24;
    n.emote = 'heart'; n.emoteT = 90;
    Sfx.play('heart');
    await UI.say(id, id === 'joe' ? VAL_LINES.joe[0] : voiced(id, rpick(VAL_LINES[id] || VAL_LINES._)), { keep: true });
    const up = addPts(id, 4, 'valentine');
    if (hearts(id) >= 3 && ITEMS.truffles && id !== 'joe') {
        await UI.say(id, voiced(id, "Wait, I have something for you too. Truffles! Coco helped. Coco ate three. There are still some."), { keep: true });
        receive('truffles', 1);
    }
    if (up) await heartUp(n, up);
    S.stats.valentines = (S.stats.valentines || 0) + 1;
    Save.touch();
}
