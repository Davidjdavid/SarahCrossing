/* ---- 6zp_holiday_events.js ---- */
/* More holidays with something to do (docs/ROADMAP.md: "way more holiday events"; the first six are in 6z_festivals.js):
   - New Year's Eve: everyone who's still up gathers on the square from a little after 11 (nyeOverride, staying up past
     bed for it); ten seconds before island midnight a countdown fills the screen, and at midnight the square cheers,
     fireworks go up, and each neighbor there with Sarah counts it as time together (NewYear, every frame).
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
    david: ["Honey! A valentine! I love it. I love YOU. I love me. It's a day of love."],
    joe: ["You made me a card? I... I made you one too. It's at home. It has a frog on it. Can I give it to you later? Don't open it in front of Coco."],
};
const NYE_LINES = ["Happy New Year! Ten out of ten countdown. I counted along. I got to four.", 'Happy New Year! This year is going to be the best one. I can feel it in my toppings.',
    "Happy New Year! I made a resolution: more of this. Standing on the square with everyone. That's the whole resolution."];

/* ---------------------------------------------------------------- New Year's Eve */
function nyeDay(day) { const dt = new Date(day * 86400e3); return dt.getUTCMonth() === 11 && dt.getUTCDate() === 31; }
function nyeOverride(id, day) {
    if (!nyeDay(day)) return null;
    const d = NPC_DEFS[id] || {};
    if (d.goat || d.dj || d.shop || d.spring || d.visitor || d.early) return null;
    return [['party:plaza', NYE_FROM, NYE_TO, { late: true }]];
}
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
            Object.assign(this.el.style, { position: 'fixed', left: '50%', top: '20%', transform: 'translate(-50%, -50%)', zIndex: 60, pointerEvents: 'none',
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
    const up = addPts(id, 4);
    if (hearts(id) >= 3 && ITEMS.truffles && id !== 'joe') {
        await UI.say(id, voiced(id, "Wait, I have something for you too. Truffles! Coco helped. Coco ate three. There are still some."), { keep: true });
        receive('truffles', 1);
    }
    if (up) await heartUp(n, up);
    S.stats.valentines = (S.stats.valentines || 0) + 1;
    Save.touch();
}
