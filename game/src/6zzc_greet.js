/* ---------------------------------------------------------------- friendship that shows (David's last list, 27 October)
   How close a neighbor is shows in what they do when Sarah's about, without her starting it: one who knows her waves
   from where they are (a heart or more), a friend walks over to say hello (three), and a good friend who sees her sitting
   on a bench comes and sits beside her (four). A word in a bubble over them, never a dialogue that stops her; once a day
   each, a few a day in all, and never while she's busy. Talking to them, the closer they are the warmer the hello
   (`closeOpener`, from openerLine). */
const GREET_MAX = 5;               // unprompted hellos a day, all told
const GREET_WAVE = ['Hi, {name}!', 'Hey, {name}!', 'Oh! Hi!', '{name}! Hi!', 'Hello there!', 'Hiya!'];
const GREET_COME = ["{name}! I thought that was you!", 'There you are! Just wanted to say hi.', 'Hi, {name}! Fancy seeing you here.',
    "Oh good, it's you! How's your day going?", 'Hey! I saw you from over there. Hi!'];
const GREET_COME_BY = {
    maki: ['Hello, {name}. I saw you and adjusted my route. That is a compliment.'],
    kai: ['Duuude! {name}! I saw you from way over there!'],
    basil: ["Ah, {name}. I was just thinking it'd be nice to see you. And here you are."],
    wonton: ['{name}! Hi! I came all the way over! Well. A little way over.'],
    chili: ["{name}! Just the person I wanted to brag to. I mean see. Hi."],
    coco: ['Girl! Come here. No, I came here. Hi! I have so much to tell you.'],
    cece: ["Hi, {name}! Sorry, I hope I'm not interrupting. I just wanted to say hi!"],
    clementine: ['Darling! I spotted you across the island. You stand out. In the good way.'],
    cuke: ['{name}! I jogged over! That counts as cardio AND friendship!'],
    sully: ["Hey, kid! Saw you from ovah there. Figured I'd come say hi."],
    ginger: ['Hey, {name}! Taking a break from measuring things. Hi!'],
    brulee: ['{name}! I was hoping I would run into you. Well, walk into you. Politely.'],
    mac: ['Hey, {name}! Hungry? No? Just saying hi, then!'],
    joe: ['There you are. I was going to go looking for you.'],
    scampi: ['Ahoy, {name}! Spotted ye off the starboard bow!'],
    mug: ['{name}! Hello! I came over on my own two... I came over!'],
};
const GREET_SIT = ['Mind if I sit? My feet have opinions.', 'Room for one more? Thanks, {name}.', 'Ahh. Good spot. You have the best taste in benches.',
    "Scooch! ...Kidding. There's room. Hi!", 'I saw you sitting here and thought, that looks nice.'];

const Greet = {
    day: -1, n: 0, done: {},
    /* who could greet her right now: met, close enough, and doing nothing that matters (Chats.free says so) */
    who(maxD) {
        const p = G.player;
        return NPCs.here().filter(n => Chats.free(n) && !n.def.goat && TALK[n.id] && rel(n.id).met && !this.done[n.id]
            && hearts(n.id) >= 1 && Math.hypot(n.x - p.x, n.y - p.y) < maxD * TILE && Math.hypot(n.x - p.x, n.y - p.y) > 1.6 * TILE);
    },
    update() {
        if (G.mode !== 'play' || UI.modal || G.busy || G.frame % 45 !== 20 || IslandGames.on || Online.visitor()) return;
        const day = Clock.dayNum(), p = G.player;
        if (this.day !== day) { this.day = day; this.n = 0; this.done = {}; }
        if (this.n >= GREET_MAX || !p || p.path || G.reel || G.held) return;
        // a good friend sees her on a bench and comes to sit beside her
        if (p.sit && R() < 0.5) {
            const n = this.who(10).filter(o => hearts(o.id) >= 4 && !o.fixed && o.anchor)[0];
            if (n && this.sitBy(n, p.sit)) return;
        }
        if (R() > 0.12) return;
        const list = this.who(7);
        if (!list.length) return;
        const n = rpick(list), h = hearts(n.id);
        if (h >= 3 && !n.fixed && n.anchor && !p.sit && this.comeOver(n)) return;
        this.wave(n);
    },
    /* a friend standing about turns to her when she's close (updateNPC) */
    watch(n) {
        const p = G.player;
        return !!p && !!TALK[n.id] && !n.def.goat && Math.abs(n.x - p.x) < 3 * TILE && Math.abs(n.y - p.y) < 3 * TILE && rel(n.id).met && hearts(n.id) >= 2;
    },
    mark(n) { this.done[n.id] = true; this.n++; n.chatCool = G.frame + 60 * 20; },
    line(n, list) { return voiced(n.id, nickIn(n.id, fillText(rpick(list)))); },
    say(n, text) { Bubbles.show(n, text); n.hop = 2; setTimeout(() => Bubbles.hide(n), 3200); },
    /* from where they are: turned to her, a hand up and a word */
    /* turned to her, and a little toward the camera behind her, so the wave reads in the new look too */
    turn(n) { const p = G.player; faceNpc(n, { x: p.x, y: p.y + 2 * TILE }); },
    wave(n) {
        this.mark(n);
        this.turn(n);
        n.pose = 'wave'; n.poseT = 80;
        n.emote = hearts(n.id) >= 3 ? 'heart' : 'note'; n.emoteT = 70;
        this.say(n, this.line(n, GREET_WAVE));
        return true;
    },
    /* a friend walks over, says hello, and gets on with their day (the safety net in updateNPC takes them back) */
    comeOver(n) {
        const a = G.area, p = G.player, px = Math.floor(p.x / TILE), py = Math.floor((p.y - 2) / TILE);
        const side = n.x < p.x ? -1 : 1;
        for (const [tx, ty] of [[px + side, py], [px - side, py], [px, py + 1], [px, py - 1]]) {
            if (a.blockedAt(tx, ty) || spotTaken(a.id, (tx + 0.5) * TILE, (ty + 0.5) * TILE + 4, n)) continue;
            const path = findPath(a, Math.floor(n.x / TILE), Math.floor((n.y - 2) / TILE), tx, ty, 1500);
            if (!path || !path.length || path.length > 14) continue;
            this.mark(n);
            n.path = path; n.dest = [(tx + 0.5) * TILE, (ty + 0.5) * TILE + 4]; n.travel = true;
            n.farT = -240;            // (a few seconds by her before the safety net walks them back)
            n.onArrive = () => {
                if (n.talking || G.busy || Math.hypot(n.x - G.player.x, n.y - G.player.y) > 3 * TILE) return;
                this.turn(n);
                n.pose = 'wave'; n.poseT = 50;
                n.emote = 'heart'; n.emoteT = 80;
                // (something from the last week they've been meaning to bring up, if there is one: 6zm_friendship.js)
                const mem = memoryLine(n.id);
                this.say(n, mem ? voiced(n.id, nickIn(n.id, fillText(mem))) : this.line(n, (GREET_COME_BY[n.id] || []).concat(GREET_COME)));
            };
            return true;
        }
        return false;
    },
    /* the other seat on Sarah's bench, if it's free (as a neighbor sits on their own, 33kd_doll_idle.js idleBench) */
    sitBy(n, sit) {
        const b = sit.b, seat = 1 - sit.seat;
        if (!b || seatTaken(b, seat, n)) return false;
        const at = benchSeatPos(b, seat);
        n.benchIdle = { until: G.t + 900 + rint(0, 900), want: n.want, fixed: n.fixed };
        n.want = Object.assign({}, n.want, { x: at.x, y: at.y, fixed: true, face: 'down', sit: { b, seat, benchY: at.benchY } });
        n.fixed = true;
        const ok = walkNpc(n, Math.floor(at.x / TILE), Math.floor((at.y - 2) / TILE), () => {
            n.x = at.x; n.y = at.y; n.dir = 'down';
            if (!n.talking) { n.emote = 'heart'; n.emoteT = 80; this.say(n, this.line(n, GREET_SIT)); remember(n.id, 'bench'); }
        });
        if (!ok) { idleBenchEnd(n); return false; }
        this.mark(n);
        return true;
    },
};

/* talking to them: the closer they are, the warmer the hello (a new acquaintance a little careful, a best friend glad) */
const OPEN_CLOSE = ['{name}! My favorite person. Hi!', "There you are! I was hoping you'd come by.", 'Hi, {name}! Seeing you always makes my day.',
    "Oh, it's you! Good. Hi!", '{name}! Come here, tell me everything.'];
const OPEN_NEW = ['Oh, hello, {name}.', 'Hi there. {name}, right?', 'Oh! Hi.', 'Hello! Nice to see you again.'];
function closeOpener(n, first) {
    const id = n.id;
    if (id === 'joe' || id === 'goat' || !TALK[id]) return null;
    const h = hearts(id);
    if (h >= 4 && R() < (first ? 0.45 : 0.25)) return voiced(id, OPEN_CLOSE[Math.floor(R() * OPEN_CLOSE.length)]);
    if (h <= 0 && first && R() < 0.4) return voiced(id, OPEN_NEW[Math.floor(R() * OPEN_NEW.length)]);
    return null;
}
