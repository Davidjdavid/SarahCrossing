/* ---- 2d_life.js ---- */
/* Neighbors living their lives: sitting on benches, and stopping to chat with each other (little speech bubbles
   over their heads). Sarah can sit on benches too. */

/* ---------------------------------------------------------------- benches */
function benches() {
    if (benches.c) return benches.c;
    const placed = (S && S.deco && S.deco.placed || []).filter(p => typeof DISPLAYS !== 'undefined' && DISPLAYS[p.id] && DISPLAYS[p.id].seat)
        .map(p => ({ kind: 'bench', x: p.x, y: p.y, placed: true }));
    return (benches.c = W0.props.filter((p, i) => (p.kind === 'bench' || p.kind === 'log') && !(typeof propGone === 'function' && propGone(i))).concat(placed));
}
function nearestBench(tx, ty, maxD) {
    let best = null, bd = maxD || 4;
    for (const b of benches()) { const d = Math.hypot(b.x + 1 - tx, b.y - ty); if (d < bd) { bd = d; best = b; } }
    return best;
}
function benchSeatPos(b, seat) { const by = (b.y + 1) * TILE - 2; return { x: (b.x + 0.5 + seat) * TILE, y: by - 1, benchY: by }; }
function seatTaken(b, seat, self) {
    const p = G.player;
    if (p && p.sit && p.sit.b === b && p.sit.seat === seat) return true;
    return NPCs.list.some(o => o !== self && !o.sleeping && o.want && o.want.sit && o.want.sit.b === b && o.want.sit.seat === seat);
}
/* a plan spot next to a bench means sitting on it, if there's room */
function benchSpot(n, spot) {
    const s = W0.spots[spot];
    if (!s || n.def.goat) return null;
    const b = nearestBench(s.x, s.y, 4);
    if (!b) return null;
    const first = hash32(n.id + ':' + Clock.dayNum()) % 2;
    for (const seat of [first, 1 - first]) {
        if (seatTaken(b, seat, n)) continue;
        const p = benchSeatPos(b, seat);
        return { area: 'island', x: p.x, y: p.y, fixed: true, face: 'down', sit: { b, seat, benchY: p.benchY } };
    }
    return null;
}
function isSeated(n) {
    const w = n.want;
    return !!(w && w.sit && !n.path && n.area === 'island' && Math.abs(n.x - w.x) < 1 && Math.abs(n.y - w.y) < 1);
}
/* sitting: the food folks sink into the seat a little and the bench hides their feet (people have real sitting frames) */
function drawSeated(ctx, benchY, fn) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-100000, -100000, 200000, benchY - 5 + 100000);
    ctx.clip();
    fn();
    ctx.restore();
}
/* Sarah sits down on the nearest free seat and stays there until she moves */
async function sitOnBench(e) {
    const b = benches().find(q => q.x === e.px && q.y === e.py);
    const p = G.player;
    if (b) {
        const seats = [0, 1].filter(s => !seatTaken(b, s)).sort((s1, s2) => Math.abs(benchSeatPos(b, s1).x - p.x) - Math.abs(benchSeatPos(b, s2).x - p.x));
        if (seats.length) {
            const pos = benchSeatPos(b, seats[0]);
            p.x = pos.x; p.y = pos.y; p.dir = 'down'; p.path = null;
            p.sit = { b, seat: seats[0], benchY: pos.benchY };
            p.sy = pos.benchY + 0.5;
        }
    }
    const buddy = p.sit && NPCs.here().find(n => isSeated(n) && n.want.sit.b === p.sit.b);
    if (buddy && TALK[buddy.id]) {
        buddy.emote = 'heart'; buddy.emoteT = 60;
        await UI.say(buddy.id, voiced(buddy.id, rpick(BENCH_BUDDY)));
        const r = rel(buddy.id), day = Clock.dayNum();
        if (r.met && r.benchDay !== day) { r.benchDay = day; const up = addPts(buddy.id, 2); if (up) await heartUp(buddy, up); }
        return;
    }
    await UI.say(null, rpick(['Sarah sits for a minute. The breeze smells like sea salt and somebody\'s noodles.',
        'Sarah sits on the bench. A cloud goes by. It looks like a dumpling. Wonton would not like that.',
        'Sarah sits and does absolutely nothing for a while. It is fantastic.', 'A good bench. Sarah sits. The island keeps being the island.']));
}
const BENCH_BUDDY = ['Oh, hi! Sit, sit. This is the best bench. I would know. I have tried them all.', 'Bench buddies! We just sit. That is the whole activity.',
    "Nice, right? I come here to think. Mostly about snacks.", "Shh. Listen. ...That's the island. It's doing nothing. I love it."];
function standUp(p) {
    const b = p.sit.b;
    p.sit = null; p.sy = undefined;
    p.y = (b.y + 1.5) * TILE + 4;
}

/* ---------------------------------------------------------------- chatting */
/* lines alternate between the two people, starting with whoever walked up */
const CHAT_LINES = [
    ['Nice day, huh?', 'The nicest. So far.', 'Bold of you.'],
    ["Did you see Sarah's house?", 'Cutest on the island.', "Don't tell the Cozy Council."],
    ['What are you up to?', 'Absolutely nothing.', 'Can I join?', 'Obviously.'],
    ["Have you been to Mac's today?", 'Twice.', 'Respect.'],
    ['I had the weirdest dream.', 'Was it about soup?', '...How did you know?'],
    ['Is it early or late?', 'Yes.'],
    ['Joe read me a poem today.', 'Frog or spoon?', 'Both.', 'A classic.'],
    ['The goat looked at me.', "It's a goat.", 'Nothing else to say.'],
    ['Noodles later?', "Basil's cart? Always."],
    ['I bought a hat.', 'Where is it?', 'In my heart.', '...Okay.'],
    ['The museum has new art!', 'Is it the goat again?', 'Not ONLY the goat.'],
    ['Ginger fixed my door.', 'Was it broken?', "No. It's perfect now, though."],
    ['Have you seen Wonton?', 'In the hot spring.', 'Is that soup?', "Don't."],
    ['I love this island.', 'Me too.', 'Group hug?', 'Group of two hug.'],
    ["What's your favorite time of day?", '2 AM.', 'Same.'],
    ['Coco told me a secret.', 'Everyone knows it.', '...Everyone?', 'Everyone.'],
    ['That cloud looks like a cheesecake.', 'Cece will cry.', 'Happy tears, though.'],
    ["I'm going to try pottery.", "Sully's going to call you kid.", "I'm ready."],
    ['The windmill hums now.', 'Ginger tuned it.', 'Ginger tunes everything.'],
    ["I've been thinking.", 'Uh oh.', 'About snacks.', 'Oh, good.'],
    ['Wanna race to the pier?', 'No.', 'Fair.'],
    ['Hi!', 'Hi!', "...That's all I had.", 'Perfect conversation.'],
    ["Fortune's cookie said 'good things.'", "Mine said 'more good things.'", "We're set."],
    ['Sarah waved at me!', 'She waved at me too!', "We're so popular."],
    ['I found a star fragment.', 'Did you make a wish?', 'For a nap.', 'Good wish.'],
    ["The flowers by the pond are blooming.", 'I picked one for my table.', 'So fancy.'],
    ["Brulee called my scarf 'a statement.'", 'Good or bad?', 'Unclear.'],
    ["What's for dinner?", 'Whatever Mac is making.', 'Perfect.'],
    ['Did you hear the waterfall?', 'It never stops talking.', 'Relatable.'],
    ['I tried the claw machine.', 'Win anything?', 'Humility.'],
    ['Do you ever just sit?', "I'm sitting right now. Emotionally.", 'Same.'],
    ['I read a whole book today.', 'Which one?', 'The menu at Mac\'s.'],
    ['Do you think fish know they live in the ocean?', 'I think they suspect.', 'Deep.'],
    ['Jump rope this afternoon?', "Cuke's turning. He's a menace.", 'A wonderful menace.'],
    ['Club tonight?', 'Every night is club night.', "Wasabi's playing the good one."],
    ["I finally cleaned my house.", 'Wow!', 'I put everything under the bed.', 'Classic.'],
    ['Karaoke tonight?', "Only if Joe does the frog poem.", 'He always does the frog poem.'],
    ["I'm learning to paint.", 'What are you painting?', 'The goat.', 'Everyone paints the goat.'],
    ['Have you tried the farm veggies?', "The cabbage looked at me funny.", "That's just how cabbages look."],
    ['I climbed the mountain!', 'How was the view?', 'Tall.'],
];
const CHAT_RAIN = [['Rain again!', 'Great napping weather.', 'Every weather is napping weather.'], ['My hair is doing a thing.', 'The rain thing.', 'The rain thing.'],
    ['Puddle jumping later?', 'Obviously.']];
const CHAT_SNOW = [['Snow!', 'Snowball fight?', 'Gently.'], ['I made a snow dumpling.', 'Does Wonton know?', 'He must never know.']];
const CHAT_NIGHT = [['Up late too?', 'Late? It\'s early.', 'Island time.'], ['The stars are out.', 'Show-offs.'], ["Cuke's been asleep for hours.", 'Weird of him.']];
const CHAT_MORNING = [['Morning!', 'Is it? Barely.'], ['Coffee?', 'Coffee.']];
/* how each neighbor starts a conversation */
const CHAT_BY = {
    coco: [['Okay, so. Did you hear?', 'Hear what?', "Nothing yet. I'm starting it."], ['I have NEWS.', 'Is it big?', 'It is medium. Medium news.']],
    cuke: [['I jogged six miles!', "It's afternoon.", 'Before breakfast!'], ['Did you drink water today?', 'Some.', 'MORE.']],
    sully: [['Wicked nice day, huh?', 'Wicked?', 'Very. It means very, kid.'], ["Ya want a frappe?", "A milkshake?", "A FRAPPE."]],
    david: [['Honey, love the look.', "I'm a food.", 'An iconic food.'], ['Club tonight. Wear sparkles.', 'I have no sparkles.', "I'll lend you mine."]],
    chili: [['Is it hot out, or is it me?', "It's you.", 'Thought so.']],
    clementine: [['Darling. Orange is back.', 'Did it leave?', 'Never.']],
    kai: [["Surf's up, dude!", "We're on land.", "Mentally, surf's up."]],
    basil: [['Noodles tonight?', 'Always.', 'Balance.']],
    maki: [['Your posture is precise today.', 'Thank you?', 'You are welcome. Precisely.']],
    cece: [['Sorry! Hi! Sorry.', 'Why are you sorry?', "I don't know! Sorry!"]],
    ginger: [['Your porch is a little crooked.', "I don't have a porch.", '...Want one?']],
    brulee: [['You have the face of a painting.', 'Which one?', 'A good one.']],
    mac: [['Have you eaten?', 'Yes.', 'Eat again.'], ['I made too much soup.', 'Again?', 'Always.']],
    joe: [['Want to hear a poem?', 'Is it about a frog?', "It's about a different frog."]],
};
/* the island's favorite topic: {name} and Joe. Very schoolyard. */
const CHAT_JOE = [
    ['Did you know {name} and Joe like like each other?', "Oh no way! That's crazy!"],
    ['I saw {name} and Joe holding hands when they thought no one was looking!', "Oh no way! That's crazy!"],
    ["Joe turned bright red when I said {name}'s name.", 'Oh no way!', 'I said it three more times.', "That's crazy!"],
    ['{name} and Joe sat on the SAME bench. The same one.', "Oh no way! That's crazy!"],
    ['Joe saved {name} the last cookie.', "Oh no way! That's crazy!", 'It was a BIG cookie.', 'Wow.'],
    ['Do you think {name} LIKE likes Joe?', 'Everybody knows she does.', "Oh no way! That's crazy!"],
    ['Joe wrote a poem with a heart on it.', 'Who was it for?', 'Guess.', "Oh no way! That's crazy!"],
];
/* and when Joe's in the chat, somebody always asks (they go first, Joe answers) */
const CHAT_WITH_JOE = [
    ['So, Joe... do you LIKE like {name}?', 'I... have to go write a poem. Right now. Bye.'],
    ['Joe, your face is all red.', "It's the sun.", "It's cloudy.", "It's... a different sun."],
    ['Joe! {name} was looking for you!', 'She was?! I mean. Cool. Cool cool cool.'],
];
/* extra lines for today's holiday (holidays fill this in) */
const CHAT_TODAY = [];

const Chats = {
    list: [],
    cool: {},
    free(n) {
        const w = n.want, d = n.def;
        if (n.chat || n.talking || n.script || n.path || n.sleeping || d.goat || d.spring || d.dj || d.shop || n.dancer) return false;
        if (w && w.playing) return false;
        if (n.fixed && !(w && (w.seat || w.sit))) return false;
        if ((n.chatCool || 0) > G.frame) return false;
        return !!(TALK[n.id] || d.human);
    },
    pick(A, B) {
        const pool = [], add = (list, wt) => { for (const s of list || []) pool.push([s, wt]); };
        add(CHAT_LINES, 1);
        add(CHAT_BY[A.id], 4);
        const w = G.weather, h = Clock.hourF();
        if (w === 'rain') add(CHAT_RAIN, 6);
        if (w === 'snow') add(CHAT_SNOW, 6);
        if (h >= 21 || h < 4) add(CHAT_NIGHT, 4);
        if (h >= 5 && h < 11) add(CHAT_MORNING, 3);
        add(CHAT_TODAY, 10);
        if (S.flags.metJoe) {
            if (A.id === 'joe' || B.id === 'joe') add(CHAT_WITH_JOE, 3);
            else add(CHAT_JOE, 1.2);
        }
        return weighted(pool, R);
    },
    start(A, B) {
        const lines = this.pick(A, B);
        if (CHAT_WITH_JOE.includes(lines) && A.id === 'joe') { const t = A; A = B; B = t; }
        const c = { a: A, b: B, lines, i: -1, t: 0 };
        A.chat = c; B.chat = c;
        if (!A.want || !(A.want.seat || A.want.sit)) faceNpc(A, B);
        if (!B.want || !(B.want.seat || B.want.sit)) faceNpc(B, A);
        this.list.push(c);
        this.next(c);
    },
    next(c) {
        c.i++;
        if (c.i >= c.lines.length) { this.end(c); return; }
        const sp = c.i % 2 === 0 ? c.a : c.b, other = sp === c.a ? c.b : c.a;
        const text = voiced(sp.id, fillText(c.lines[c.i]).replace(/\{A\}/g, c.a.def.name).replace(/\{B\}/g, c.b.def.name));
        Bubbles.hide(other);
        Bubbles.show(sp, text);
        sp.hop = 2;
        c.t = Math.min(260, 110 + text.length * 2.2);
    },
    end(c) {
        for (const n of [c.a, c.b]) { Bubbles.hide(n); n.chat = null; n.chatCool = G.frame + 60 * 15; }
        this.cool[[c.a.id, c.b.id].sort().join('+')] = G.frame + 60 * 60;
        this.list = this.list.filter(x => x !== c);
    },
    endAll() { for (const c of this.list.slice()) this.end(c); },
    update() {
        if (G.mode !== 'play') { if (this.list.length) this.endAll(); return; }
        for (const c of this.list.slice()) {
            const gone = [c.a, c.b].some(n => n.talking || n.script || n.path || n.sleeping || n.area !== G.area.id);
            if (gone) { this.end(c); continue; }
            if (--c.t <= 0) this.next(c);
        }
        if (G.frame % 40 !== 0 || UI.modal || G.busy) return;
        const here = NPCs.here().filter(n => this.free(n));
        if (here.length < 2) return;
        // two people close together start talking
        for (let i = 0; i < here.length; i++) for (let j = i + 1; j < here.length; j++) {
            const A = here[i], B = here[j];
            if (A.chat || B.chat) continue;
            const seated = (A.want && (A.want.seat || A.want.sit)) && (B.want && (B.want.seat || B.want.sit));
            const d = Math.hypot(A.x - B.x, A.y - B.y);
            if (d > (seated ? 52 : 40)) continue;
            if ((this.cool[[A.id, B.id].sort().join('+')] || 0) > G.frame) continue;
            if (R() < 0.6) { R() < 0.5 ? this.start(A, B) : this.start(B, A); return; }
        }
        // or somebody spots a friend a little way off and walks over
        if (R() < 0.55) {
            const A = rpick(here.filter(n => !n.fixed && n.anchor));
            if (!A) return;
            const B = here.filter(n => n !== A && !n.chat && Math.hypot(n.x - A.x, n.y - A.y) < 170 && Math.hypot(n.x - A.x, n.y - A.y) > 34)
                .sort((p, q) => Math.hypot(p.x - A.x, p.y - A.y) - Math.hypot(q.x - A.x, q.y - A.y))[0];
            if (!B || (this.cool[[A.id, B.id].sort().join('+')] || 0) > G.frame) return;
            const a = G.area, bx = Math.floor(B.x / TILE), by = Math.floor((B.y - 2) / TILE);
            const side = A.x < B.x ? -1 : 1;
            for (const [tx, ty] of [[bx + side, by], [bx - side, by], [bx, by + 1]]) {
                if (a.blockedAt(tx, ty)) continue;
                const path = findPath(a, Math.floor(A.x / TILE), Math.floor((A.y - 2) / TILE), tx, ty, 1500);
                if (!path || !path.length || path.length > 16) continue;
                A.path = path; A.dest = [(tx + 0.5) * TILE, (ty + 0.5) * TILE + 4];
                A.onArrive = () => { if (this.free(A) && this.free(B) && Math.hypot(A.x - B.x, A.y - B.y) < 48) this.start(A, B); };
                A.chatCool = G.frame + 60 * 8;
                return;
            }
        }
    },
};

/* speech bubbles are little HTML labels over the canvas, so the text stays sharp */
const Bubbles = {
    root: null, map: new Map(),
    ensure() {
        if (this.root) return this.root;
        const r = document.createElement('div');
        r.id = 'bubbles';
        r.setAttribute('aria-live', 'polite');
        $('#game').after(r);
        this.root = r;
        return r;
    },
    show(n, text) {
        this.hide(n);
        const b = document.createElement('div');
        b.className = 'chatb';
        b.textContent = text;
        this.ensure().appendChild(b);
        this.map.set(n, b);
        this.place(n, b);
    },
    hide(n) { const b = this.map.get(n); if (b) { b.remove(); this.map.delete(n); } },
    clear() { for (const b of this.map.values()) b.remove(); this.map.clear(); },
    place(n, b) {
        const v = G.view, cs = v.cssScale;
        const top = n.y - (n.def.human ? 30 : (n.def.h || 16) + 8) - (isSeated(n) ? -4 : 0);
        b.style.transform = `translate(${Math.round((n.x - G.cam.x) * cs)}px, ${Math.round((top - G.cam.y) * cs)}px) translate(-50%, -100%)`;
    },
    update() {
        if (!this.map.size) return;
        const hideAll = UI.modal || G.fade > 0.5;
        for (const [n, b] of this.map) {
            if (n.area !== G.area.id || n.sleeping) { this.hide(n); continue; }
            b.style.visibility = hideAll ? 'hidden' : '';
            this.place(n, b);
        }
    },
};

