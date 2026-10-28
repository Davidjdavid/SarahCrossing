/* ---- 6n_requests.js ---- */
/* Favors. Neighbors ask Sarah for things: easy ones while they're still getting to know her (fruit, shells, a
   flower, an easy fish, the dish from the recipe they gave her, something in Fortune's shop today), bigger ones as
   they get closer (take a package to someone, pass on a message, beat a score at the arcade, sew a new outfit, find
   them an accessory, a gem, a piece of pottery). Everything they've asked for is on the To-do list in the phone,
   with hints. */
const REQ_MAX = 6;
function whereIs(id) {
    try { const w = whereabouts(id); if (w.away) return 'off the island'; if (w.asleep) return 'asleep'; return w.now; } catch (e) { return null; }
}
const EASY_FRUIT = ['peach', 'apple', 'cherry', 'mango', 'lychee', 'coconut'];
const EASY_SHELLS = ['clam', 'scallop', 'turban', 'cowrie'];
const FRUIT_HINT = {
    peach: 'Peach trees grow in the orchard east of the river, and a few around the village. Shake one!',
    apple: 'Apple trees grow in the orchard, by the village and up on the farm. Shake one!',
    cherry: 'Cherry trees grow in the orchard and out west. Shake one!',
    mango: 'Mango trees grow in the orchard, near the pond and on the east side. Shake one!',
    lychee: 'Lychee trees grow in the orchard, by the pond and near Cece\'s. Shake one!',
    coconut: 'Coconuts grow on the palm trees along the beach. Shake a palm!',
};
const DELIVER_THINGS = ['a jar of homemade jam', 'a book I borrowed', 'a thank-you card', 'a scarf they left at my place', 'a mixtape', 'a little potted succulent',
    'their favorite mug', 'a box of cookies', 'a birthday card (early)', 'a very nice rock'];
const TELL_MSGS = [
    { msg: 'Tell {to} I said hi! A big hi. The biggest.', reply: 'Aww! Tell {from} I said hi back! A medium hi. It\'s been a long day.', back: 'A medium hi from {to}! I\'ll take it. I\'ll frame it.' },
    { msg: "Tell {to} they were right about the thing. They'll know what thing.", reply: 'I KNEW it! Tell {from} I said "I told you so." Nicely.', back: '"I told you so"? Nicely? ...Okay. That\'s fair.' },
    { msg: 'Could you tell {to} there\'s a great sunset tonight? I checked. It\'s going to be a good one.', reply: 'Ooh! Tell {from} thanks! I\'ll watch it from the pier.', back: 'They\'re going to the pier? Yay! Sunset buddies!' },
    { msg: "Tell {to} Joe has a new poem and they HAVE to hear it. It's incredible.", reply: "A new one?! I'll find him tonight. Tell {from} thank you for the tip!", back: "They're going to love it. Everybody loves Joe's poems." },
    { msg: 'Tell {to} I saved them a spot at the club tonight. Front row.', reply: 'Tell {from} I\'ll be there! Wearing something that sparkles!', back: 'Sparkles?! It\'s going to be a great night.' },
    { msg: 'Please tell {to} I\'m sorry I borrowed their umbrella and forgot to give it back. For a month.', reply: 'Ha! Tell {from} to keep it. It looks better with them anyway.', back: 'I get to KEEP it? This is the best umbrella news of my life.' },
    { msg: 'Tell {to} their hat looked amazing yesterday.', reply: 'They noticed?! Tell {from} thank you! I\'ll wear it again tomorrow!', back: 'Yay! Hat tomorrow! I love when people love their hats.' },
    { msg: "Tell {to} to come to the bonfire tonight. Marshmallows are on me.", reply: 'Tell {from} yes! I\'ll bring extra marshmallows. For balance.', back: 'Extra marshmallows! That\'s the spirit. That\'s the bonfire spirit.' },
    { msg: 'Can you tell {to} I think they\'re a really good friend? I get shy saying it.', reply: 'Oh! That\'s so sweet. Tell {from} they\'re a really good friend too. The best.', back: 'They said that? The BEST? I\'m going to go sit down and smile for a while.' },
    { msg: 'Tell {to} I found their missing sock. It was in my laundry. Don\'t ask.', reply: 'MY SOCK! Tell {from} I\'ve been looking for that sock for weeks!', back: 'A sock reunion! I love a happy ending.' },
];
const ARC_TARGET = { blocks: [2000, 4000, 7000], capsules: [1500, 3000, 5000], fruit: [400, 800, 1300], stack: [800, 1800, 3500] };

const Requests = {
    st() { if (!S.tasks) S.tasks = { seq: 1, list: [], done: 0, gone: {} }; return S.tasks; },
    open() { return this.st().list.filter(t => t.state !== 'done'); },
    from(id) { return this.open().find(t => t.from === id) || null; },
    wants(npcId, itemId) { const t = S && S.tasks ? this.from(npcId) : null; return !!(t && t.kind === 'bring' && t.item === itemId); },
    /* a new day: old favors quietly go away */
    tick() {
        const T = this.st(), day = Clock.dayNum();
        for (const t of T.list) if (t.state !== 'done' && day > t.until) { t.state = 'done'; t.expired = true; T.gone[t.from] = this.what(t); if (t.kind === 'deliver' && pocketCount('package')) removeItem('package', 1); }
        T.list = T.list.filter(t => !(t.state === 'done' && (t.expired || day - (t.doneDay || day) > 3)));
    },
    what(t) {
        if (t.kind === 'bring') return itemName(t.item).toLowerCase();
        if (t.kind === 'type') return { flower: 'flower', dish: 'something to eat', fish: 'fish', acc: 'accessory', gem: 'gem', art: 'painting' }[t.type];
        if (t.kind === 'pottery') return t.pottery === 'heartdish' ? 'heart dish' : t.pottery;
        if (t.kind === 'deliver') return 'package';
        if (t.kind === 'tell') return 'message';
        if (t.kind === 'arcade') return `${ARCADE_GAMES[t.game].name} score`;
        if (t.kind === 'sew') return 'new outfit';
        return 'favor';
    },
    /* a short line for the To-do list */
    label(t) {
        const who = NPC_DEFS[t.from].name, to = t.to ? NPC_DEFS[t.to].name : '';
        switch (t.kind) {
            case 'bring': return `Bring ${who} ${aOrAn(itemName(t.item))} ${itemName(t.item).toLowerCase()}`;
            case 'type': return `Bring ${who} ${{ flower: 'a flower (any kind)', dish: 'something you cooked', fish: 'a fish (any kind)', acc: 'an accessory to wear', gem: 'a gem', art: 'a painting' }[t.type]}`;
            case 'pottery': return `Make ${who} ${aOrAn(this.what(t))} ${this.what(t)} at Sully's studio`;
            case 'deliver': return `Take ${who}'s package to ${to}`;
            case 'tell': return t.state === 'reply' ? `Tell ${who} what ${to} said` : `Pass ${who}'s message on to ${to}`;
            case 'arcade': return t.state === 'ready' ? `Tell ${who} you did it: ${fmtNum(t.score)} in ${ARCADE_GAMES[t.game].name}!` : `Score ${fmtNum(t.score)} in ${ARCADE_GAMES[t.game].name} for ${who}`;
            case 'sew': return t.state === 'ready' ? `Show ${who} your new outfit` : `Sew a brand-new outfit for ${who} to see`;
        }
        return 'A favor';
    },
    hint(t) {
        // (where they are right now only on the beta site or with the debug tools: in the game, text them to find out)
        const where = id => { if (!plansShown()) return `Not sure where ${NPC_DEFS[id].name} is? Text them!`; const w = whereIs(id); return w ? `Right now ${NPC_DEFS[id].name} is ${w}.` : ''; };
        switch (t.kind) {
            case 'bring': {
                const it = ITEMS[t.item];
                if (it.type === 'fruit') return FRUIT_HINT[t.item] || 'Fruit trees grow all over the island.';
                if (it.type === 'shell') return 'Shells wash up on the beaches every morning. The common ones are easy to find.';
                if (it.type === 'fish') return `${fishNote(t.item)} Cast from the pier, the beach or a riverbank.`;
                if (it.type === 'dish') return `Cook it at your kitchenette: ${Object.entries(RECIPE[t.item].need).map(([k, n]) => (n > 1 ? n + ' \u00d7 ' : '') + itemName(k)).join(', ')}. Fortune sells the pantry basics.`;
                if (it.type === 'furniture') return "Fortune's Goods has it in stock today (the shop on Main Street). Buy it, take it out of storage, and bring it over.";
                if (it.type === 'staple') return "Fortune's Goods sells it (Pantry tab).";
                if (it.type === 'veg') return 'Grow it in your garden (seeds at Fortune\'s), or check Fortune\'s for seeds today.';
                if (it.type === 'material') return 'Chop a tree with the axe for wood.';
                return 'Keep an eye out for it around the island.';
            }
            case 'type': return { flower: 'Wildflowers grow all over the island (except in winter). Fortune sells seeds too.', dish: 'Cook anything at your kitchenette.',
                fish: 'Any fish at all. Cast a line off the pier.', acc: "Clementine's boutique sells accessories. Any one will do!", gem: 'Gems show up on the mountain top every day, near the lookout.',
                art: 'Paint something at the easel in the museum.' }[t.type];
            case 'pottery': return `Sully's studio on Gallery Lane is open ${hoursText('studio')}. Any color is fine. Check with Sully for the firing time.`;
            case 'deliver': return `The package is in your pocket. ${where(t.to)}`;
            case 'tell': return t.state === 'reply' ? where(t.from) : where(t.to);
            case 'arcade': return t.state === 'ready' ? where(t.from) : `The arcade is on the Boardwalk. Your best in ${ARCADE_GAMES[t.game].name}: ${fmtNum(arc().best[t.game] || 0)}.`;
            case 'sew': return t.state === 'ready' ? where(t.from) : "The sewing machine is at Clementine's boutique on Gallery Lane.";
        }
        return '';
    },
    due(t) { const d = t.until - Clock.dayNum(); return d <= 0 ? 'today' : d === 1 ? 'by tomorrow' : `in ${d} days`; },
    /* ---------------------------------------------------------------- asking */
    candidates(n) {
        const id = n.id, h = hearts(id), t = TALK[id] || {}, season = Clock.season(), out = [];
        const tier = h <= 1 ? 0 : h <= 3 ? 1 : 2;
        const W = (e, m, s) => [e, m, s][tier];
        const add = (w, fn) => { if (w > 0) out.push([w, fn]); };
        const others = NEIGHBORS.filter(o => o !== id && rel(o).met && !(NPC_DEFS[o] || {}).away);
        add(W(3, 1.5, 0.8), rr => ({ kind: 'bring', item: rpick(EASY_FRUIT, rr) }));
        add(W(2, 1, 0.5), rr => ({ kind: 'bring', item: rpick(EASY_SHELLS, rr) }));
        if (season !== 'winter') add(W(2, 1, 0.6), () => ({ kind: 'type', type: 'flower' }));
        const easyFish = FISHES.filter(f => f.hours[1] - f.hours[0] >= 24 && f.seasons.includes(season) && f.price <= 450 && f.id !== 'boot' && /[sr]/.test(f.where));
        if (easyFish.length) add(W(2, 1, 0.5), rr => ({ kind: 'bring', item: rpick(easyFish, rr).id }));
        const taught = (RECIPE_FROM[id] || []).filter(r => S.recipes.includes(r));
        if (taught.length) add(W(2, 1.5, 1), rr => ({ kind: 'bring', item: rpick(taught, rr) }));
        const st = shopStock(), furn = st.furn.filter(f => ITEMS[f] && ITEMS[f].price <= 2000);
        if (furn.length) add(W(1.5, 1, 0.6), rr => ({ kind: 'bring', item: rpick(furn, rr), pay: true }));
        if (others.length) {
            add(W(0.8, 1.5, 1.2), rr => ({ kind: 'deliver', to: rpick(others, rr), thing: rpick(DELIVER_THINGS, rr) }));
            add(W(0.8, 1.5, 1.2), rr => ({ kind: 'tell', to: rpick(others, rr), msg: Math.floor(rr() * TELL_MSGS.length) }));
        }
        if (t.want && t.want.length) add(W(0.5, 2, 1), rr => ({ kind: 'bring', item: rpick(t.want, rr) }));
        add(W(0.3, 1.2, 1), () => ({ kind: 'type', type: 'dish' }));
        add(W(0.3, 1, 0.8), () => ({ kind: 'type', type: 'fish' }));
        if (S.stats.arcade) add(W(0.3, 1, 1.2), rr => { const g = rpick(arcadeCabs(), rr); return { kind: 'arcade', game: g, score: ARC_TARGET[g][tier] }; });
        add(W(0, 0.6, 1.2), () => ({ kind: 'type', type: 'acc' }));
        add(W(0, 0.4, 1), () => ({ kind: 'sew' }));
        add(W(0, 0.4, 0.9), () => ({ kind: 'type', type: 'gem' }));
        if (S.pottery && S.pottery.made > 0 && POT_LOVES[id]) add(W(0, 0.6, 1.2), rr => {
            const pref = POT_LOVES[id];
            const kind = pref.kind ? rpick(pref.kind.filter(k => ['plate', 'bowl', 'mug', 'cup', 'vase', 'slug', 'frog', 'snail', 'duck', 'dumpling', 'heartdish'].includes(k)).concat(['vase', 'bowl']), rr) : rpick(['vase', 'bowl', 'mug', 'plate'], rr);
            return { kind: 'pottery', pottery: kind };
        });
        if (S.art && Object.keys(S.art.pieces || {}).length) add(W(0, 0.3, 0.8), () => ({ kind: 'type', type: 'art' }));
        return out.map(([w, fn]) => [w, fn, tier]);
    },
    make(n) {
        const T = this.st(), day = Clock.dayNum();
        const rr = mulberry(hash32(S.seed + ':req:' + n.id + ':' + day + ':' + T.seq));
        const c = this.candidates(n);
        let x = rr() * c.reduce((a, b) => a + b[0], 0), pick = c[0];
        for (const q of c) { x -= q[0]; if (x <= 0) { pick = q; break; } }
        const t = Object.assign({ id: T.seq++, from: n.id, day, state: 'open', tier: pick[2] }, pick[1](rr));
        t.until = day + (t.kind === 'pottery' || t.kind === 'arcade' || t.kind === 'sew' ? 3 : t.kind === 'type' && (t.type === 'gem' || t.type === 'art' || t.type === 'acc') ? 3 : 1);
        return t;
    },
    askLine(t) {
        const to = t.to ? NPC_DEFS[t.to].name : '';
        const nm = t.item ? itemName(t.item).toLowerCase() : '';
        switch (t.kind) {
            case 'bring': {
                const it = ITEMS[t.item];
                if (it.type === 'fruit') return `Could you bring me ${aOrAn(nm)} ${nm}? I've been craving one all day.`;
                if (it.type === 'shell') return `I'm making a little shell display. Could you find me ${aOrAn(nm)} ${nm}? The beach has them in the morning.`;
                if (it.type === 'fish') return `Could you catch me ${aOrAn(nm)} ${nm}? I want to try something new. Or just look at it. Both.`;
                if (it.type === 'dish' && (RECIPE_FROM[t.from] || []).includes(t.item)) return `Remember my ${nm} recipe? Could you make me one? I want to see how yours turns out!`;
                if (it.type === 'dish') return `Could you make me ${aOrAn(nm)} ${nm}? I've been dreaming about it.`;
                if (it.type === 'furniture') return `Fortune has ${aOrAn(nm)} ${nm} in stock today. I've been eyeing it! Could you get it for me? I'll pay you back, and then some.`;
                return `Could you find me ${aOrAn(nm)} ${nm}? I'll make it worth it!`;
            }
            case 'type': return { flower: 'Could you pick me a flower? Any flower! My place needs some color.', dish: "I'm SO hungry. Could you cook me something? Anything! Surprise me.",
                fish: "Could you catch me a fish? Any fish. I'm not picky. I'm a little picky. Any fish.", acc: 'I need a new accessory. Something fun to wear. Could you find me one? Any kind!',
                gem: 'I heard there are gems on the mountain top. Could you bring me one? I just want something sparkly.', art: "Could you paint me something? At the museum easel. I'll hang it in the good spot." }[t.type];
            case 'pottery': return `Could you make me ${aOrAn(this.what(t))} ${this.what(t)}? At Sully's studio. Any color! A few days is fine.`;
            case 'deliver': return `Could you take this to ${to}? It's ${t.thing}. They'll know what it's about.`;
            case 'tell': return `Could you pass something on to ${to} for me? ${TELL_MSGS[t.msg].msg.replace(/\{to\}/g, to)}`;
            case 'arcade': return `Chili says nobody can get ${fmtNum(t.score)} points in ${ARCADE_GAMES[t.game].name}. Could you prove him wrong? For me? For the island?`;
            case 'sew': return "Could you make a brand-new outfit at Clementine's sewing machine? I want to see what you come up with!";
        }
        return 'Could you help me with something?';
    },
    async give(n, t) {
        const id = n.id, T = this.st();
        if (t.kind === 'deliver') {
            T.list.push(t);
            await UI.say(id, voiced(id, this.askLine(t)), { keep: true });
            receive('package', 1);
        } else {
            T.list.push(t);
            await UI.say(id, voiced(id, this.askLine(t)), { keep: true });
        }
        UI.toast('Added to your To-do list', 'app_tasks');
        Save.touch();
        // already have it?
        if (this.ready(t) && (t.kind === 'bring' || t.kind === 'type' || t.kind === 'pottery')) {
            const k = await UI.ask(id, 'Oh wait, you have one already?! Would you give it to me?', ['Sure!', 'Not yet'], { keep: true });
            if (k === 0) await this.complete(n, t);
        }
        return true;
    },
    async maybeAsk(n) {
        if (this.from(n.id) || this.open().length >= REQ_MAX || NPC_DEFS[n.id].family || R() > 0.35) return;
        await this.give(n, this.make(n));
    },
    async ask(n) {
        const id = n.id;
        if (this.open().length >= REQ_MAX) { await UI.say(id, voiced(id, "You look busy! Finish your To-do list first. I'm not going anywhere. (I'm going to the plaza later.)")); return; }
        const rr = mulberry(hash32(S.seed + ':need:' + id + ':' + Clock.dayNum() + ':' + this.st().seq));
        if (rr() < 0.2 && hearts(id) >= 2) { await UI.say(id, voiced(id, "Need anything? Me? No, I'm good today. Thanks for asking, though!")); return; }
        await this.give(n, this.make(n));
    },
    /* does Sarah have what this favor needs? */
    ready(t) {
        if (t.kind === 'bring') return pocketCount(t.item) > 0;
        if (t.kind === 'type') return !!this.typeItem(t.type);
        if (t.kind === 'pottery') return !!potteryFor(t.pottery);
        if (t.kind === 'arcade' || t.kind === 'sew' || t.kind === 'tell') return t.state === 'ready' || t.state === 'reply';
        return false;
    },
    typeItem(type) {
        const s = S.pocket.find(s => s && ITEMS[s.id] && (ITEMS[s.id].type === type || (type === 'dish' && ITEMS[s.id].type === 'dish')) && !(type === 'fish' && s.id === 'boot') && !(type === 'acc' && ITEMS[s.id].special));
        return s ? s.id : null;
    },
    /* talk menu entries for this neighbor */
    options(n) {
        const id = n.id, out = [];
        if (!S || NPC_DEFS[id].family) return out;
        const mine = this.from(id);
        if (!mine) out.push({ label: 'Need anything?', fn: async () => { await this.ask(n); return true; } });
        else if (this.ready(mine)) out.push({ label: this.doneLabel(mine), fn: async () => { await this.complete(n, mine); return true; } });
        else out.push({ label: `About that ${this.what(mine)}...`, fn: async () => { await UI.say(id, voiced(id, this.remind(mine)), { keep: true }); return true; } });
        for (const t of this.open().filter(q => q.to === id)) {
            if (t.kind === 'deliver' && pocketCount('package')) out.push({ label: `Package from ${NPC_DEFS[t.from].name}!`, fn: async () => { await this.deliver(n, t); return true; } });
            if (t.kind === 'tell' && t.state === 'open') out.push({ label: `Message from ${NPC_DEFS[t.from].name}!`, fn: async () => { await this.tell(n, t); return true; } });
        }
        return out;
    },
    doneLabel(t) {
        if (t.kind === 'bring') return `Brought your ${itemName(t.item).toLowerCase()}!`;
        if (t.kind === 'type') return `Brought you ${aOrAn(itemName(this.typeItem(t.type)))} ${itemName(this.typeItem(t.type)).toLowerCase()}!`;
        if (t.kind === 'pottery') return `Made your ${this.what(t)}!`;
        if (t.kind === 'tell') return `${NPC_DEFS[t.to].name} says...`;
        if (t.kind === 'arcade') return `Got ${fmtNum(t.score)} in ${ARCADE_GAMES[t.game].name}!`;
        if (t.kind === 'sew') return 'Look at my new outfit!';
        return 'Done!';
    },
    remind(t) {
        const to = t.to ? NPC_DEFS[t.to].name : '';
        switch (t.kind) {
            case 'deliver': return `Did you take the package to ${to} yet? No rush! Well. A little rush. It's ${t.thing}.`;
            case 'tell': return `Did you tell ${to} yet? No pressure. It's just a message. A very important message.`;
            case 'arcade': return `Still going for ${fmtNum(t.score)} in ${ARCADE_GAMES[t.game].name}? I believe in you. Chili doesn't. I do.`;
            case 'sew': return "Still sewing? Take your time! Good outfits take time. Clementine says so. Constantly.";
            case 'pottery': return `Still hoping for that ${this.what(t)}! Sully's studio is open ${hoursText('studio')}. No rush. Island time.`;
        }
        return `Still looking for ${aOrAn(this.what(t))} ${this.what(t)}! No rush. Island time. ${this.hint(t)}`;
    },
    /* ---------------------------------------------------------------- finishing */
    async complete(n, t) {
        const id = n.id;
        let given = null;
        if (t.kind === 'bring') { given = t.item; removeItem(t.item, 1); }
        else if (t.kind === 'type') { given = this.typeItem(t.type); if (!given) return; if (ITEMS[given].type === 'art') { if (!takeOwned(given)) return; } else removeItem(given, 1); }
        else if (t.kind === 'pottery') { given = potteryFor(t.pottery); if (!given) return; removeItem(given, 1); }
        n.emote = 'heart'; n.emoteT = 90;
        Sfx.play('fanfare');
        remember(id, 'favor');
        const nm = given ? itemName(given).toLowerCase() : '';
        let line;
        if (t.kind === 'tell') line = TELL_MSGS[t.msg].back.replace(/\{to\}/g, NPC_DEFS[t.to].name);
        else if (t.kind === 'arcade') line = rpick([`${fmtNum(t.score)}?! In ${ARCADE_GAMES[t.game].name}? I'm telling Chili. I'm telling EVERYONE.`, 'You did it! I knew you could. I told Chili. Chili is sulking. Delicious.']);
        else if (t.kind === 'sew') line = rpick(['Look at you! You MADE that? It\'s incredible. Clementine is going to be so jealous. Happy jealous.', 'A brand-new outfit! You have such good taste. I want one. Not the same one. A different one. Also by you.']);
        else if (t.kind === 'pottery') line = `You MADE me ${aOrAn(nm)} ${nm}?! It's perfect. It's going somewhere special.`;
        else if (given && ITEMS[given].type === 'dish') line = rpick([`You cooked this? For me? ${cap(nm)}! It smells amazing.`, `${cap(nm)}! My favorite. Well, today it is. Every day it could be.`]);
        else line = rpick([`You found it! ${cap(aOrAn(nm))} ${nm}! Thank you!`, `My ${nm}! You're the best. The absolute best.`, `${cap(nm)}! Exactly what I wanted. You're amazing.`]);
        await UI.say(id, voiced(id, line), { keep: true });
        if (given && ITEMS[given].type === 'acc') await offerWear(n, given);
        if (given && (ITEMS[given].type === 'furniture' || ITEMS[given].pottery || ITEMS[given].type === 'art')) {
            const rr2 = rel(id);
            if (n.def.house && ROOMS[n.def.house]) { rr2.furn = rr2.furn || []; rr2.furn.push(given); if (rr2.furn.length > 12) rr2.furn.shift(); markRoomStale(n.def.house); }
        }
        await this.reward(n, t);
    },
    async reward(n, t, byWho) {
        const id = byWho || n.id, T = this.st();
        t.state = 'done'; t.doneDay = Clock.dayNum();
        T.done++;
        S.stats.favors = (S.stats.favors || 0) + 1;
        const rr = mulberry(hash32(S.seed + ':rew:' + t.id));
        const tier = t.tier || 0;
        const money = [300, 600, 1000][tier] + Math.floor(rr() * [5, 8, 11][tier]) * 100 + (t.pay ? ITEMS[t.item].price : 0);
        const say = id === n.id ? n.id : id;
        if (!t.pay && tier > 0 && rr() < 0.4) {
            const pool = Object.values(FURN).filter(f => f.price > 0 && f.price <= [900, 1600, 2600][tier] && !f.prize && !f.fixture && !f.special && !f.outdoor);
            const f = rpick(pool, rr);
            await UI.say(say, voiced(say, 'Here, take this. For your house!'), { keep: true });
            receive(f.id, 1);
        } else {
            await UI.say(say, voiced(say, t.pay ? "And here's the money back, with a little extra for your trouble!" : 'Here, take this. You earned it!'), { keep: true });
            addMoney(money, false, 'Favors');
        }
        const up = addPts(n.id, [4, 6, 10][tier] + bonusCharm(), 'favor');
        UI.hideDialog();
        if (up) await heartUp(n, up);
        Save.touch();
        if (rr() < 0.12) {
            const sp = poolSpecial(null, rr);
            if (sp) { await UI.say(NPC_DEFS[n.id] ? n.id : null, voiced(n.id, 'Oh! And I found this the other day. I think you should have it.')); await grantSpecial(sp, `A thank-you from ${NPC_DEFS[n.id].name}!`); }
        }
        await checkSpecialMilestones();
        await flushSpecials();
    },
    async deliver(n, t) {
        const id = n.id, from = NPC_DEFS[t.from].name;
        removeItem('package', 1);
        n.emote = 'heart'; n.emoteT = 80;
        Sfx.play('item');
        await UI.say(id, voiced(id, rpick([`Oh! ${cap(t.thing)}! From ${from}? That's so nice. Thank you for bringing it!`, `A package from ${from}? For me? ...Oh, it's ${t.thing}! I love it.`])), { keep: true });
        await UI.say(id, voiced(id, `${from} said to give you something for the trouble. Here!`), { keep: true });
        await this.reward(n, t);
        const up = addPts(t.from, 3, 'favor');
        if (up) { const f = NPCs.get(t.from); if (f) f.emote = 'heart'; }
    },
    async tell(n, t) {
        const id = n.id, from = NPC_DEFS[t.from].name, m = TELL_MSGS[t.msg];
        await UI.say(null, `Sarah passes on ${from}'s message.`, { keep: true });
        n.emote = 'note'; n.emoteT = 70;
        await UI.say(id, voiced(id, m.reply.replace(/\{from\}/g, from)), { keep: true });
        t.state = 'reply';
        addPts(id, 2, 'favor');
        UI.toast(`Now tell ${from} what ${n.def.name} said`, 'app_tasks');
        Save.touch();
    },
    /* the arcade and the sewing machine report back */
    onArcade(res) {
        if (!res || res.home) return;
        for (const t of this.open()) if (t.kind === 'arcade' && t.state === 'open' && t.game === res.id && res.score >= t.score) {
            t.state = 'ready';
            UI.toast(`${NPC_DEFS[t.from].name} will want to hear about this! (${fmtNum(res.score)})`, 'app_tasks');
        }
    },
    onSewn() { for (const t of this.open()) if (t.kind === 'sew' && t.state === 'open') { t.state = 'ready'; UI.toast(`Go show ${NPC_DEFS[t.from].name} your new outfit!`, 'app_tasks'); } },
    async onGreet(n, first) {
        const T = this.st(), id = n.id;
        if (T.gone[id]) {
            const what = T.gone[id];
            delete T.gone[id];
            await UI.say(id, voiced(id, `Oh, and don't worry about the ${what}! I sorted it out. Thanks for thinking about it, though!`), { keep: true });
        }
        void first;
    },
};
Bus.on('arcadeGame', res => Requests.onArcade(res));
Bus.on('sewn', () => Requests.onSewn());

/* ---------------------------------------------------------------- the To-do app */
function appTasks() {
    const P = UI.open({ title: 'To-do', phone: true, back: backToPhone });
    const T = Requests.st(), list = Requests.open();
    P.body.appendChild(el('p', 'muted', list.length ? `Favors for friends: ${list.length}. Check each one for its due date.` : 'No favors right now. Ask around: "Need anything?"'));
    const L = el('div', 'list');
    for (const t of list) {
        const row = el('div', 'row task');
        const who = NPC_DEFS[t.from];
        row.appendChild(iconCanvas((who.sprite || who.human) + (who.human ? '_down_stand' : '_0'), 40));
        const tx = el('div', 't');
        tx.appendChild(el('b', null, Requests.label(t)));
        const h = Requests.hint(t);
        tx.appendChild(el('span', null, `${Requests.ready(t) ? '\u2713 Ready to hand over! ' : ''}Due ${Requests.due(t)}.${h ? ' ' + h : ''}`));
        row.appendChild(tx);
        L.appendChild(row);
    }
    P.body.appendChild(L);
    const q = Quests.todo();
    if (q.length) {
        P.body.appendChild(el('h3', 'todo-h', 'Island mysteries'));
        const Q = el('div', 'list');
        for (const x of q) {
            const row = el('div', 'row task' + (x.done ? ' done' : ''));
            row.appendChild(iconCanvas(x.icon, 40));
            const tx = el('div', 't');
            tx.appendChild(el('b', null, x.title));
            tx.appendChild(el('span', null, x.text));
            row.appendChild(tx);
            Q.appendChild(row);
        }
        P.body.appendChild(Q);
    }
    P.body.appendChild(el('p', 'muted', `Favors done so far: ${T.done}.`));
}

