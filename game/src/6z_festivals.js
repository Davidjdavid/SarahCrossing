/* ---- 6z_festivals.js ---- */
/* Holidays with something to do (the others in 66_holidays.js are mostly decorations and chatter):
   - Egg Hunt (Easter weekend): painted eggs in the grass, in a few trees, buried in the ground and now and then on a
     fishing hook. Cece trades them for sand dollars, a recipe and a golden egg.
   - Fish-Off (the second Saturday of January, April, July and October): Kai gives Sarah three minutes to catch as
     much as she can. Beat his score for the trophy.
   - Beach Cleanup (Earth Day and Ocean Day): litter washes up on the beach. Cuke pays for every piece.
   - Trick-or-Treat (Halloween night): Fortune sells candy; neighbors in costume ask for some. No candy, a prank.
   - Toy Day (December 24): Fortune hands Sarah presents to deliver around the island.
   - Feast Cook-Off (Feast Day): Mac judges one dish.
   Only Sarah takes part (visitors just hear about it): the island's eggs and litter are hers to find. */

/* ---------------------------------------------------------------- when */
function easterDate(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return [month, day];
}
const HOLIDAY_RULES = {
    // the hunt is the three days up to Easter Sunday
    easter: y => { const [m, d] = easterDate(y), t = new Date(Date.UTC(y, m - 1, d - 2)); return [t.getUTCMonth() + 1, t.getUTCDate()]; },
    sat2: (y, h) => { const first = new Date(Date.UTC(y, h.m - 1, 1)).getUTCDay(); return [h.m, 1 + ((6 - first + 7) % 7) + 7]; },
};
HOLIDAYS.push(
    { id: 'egghunt', name: 'Egg Hunt', rule: 'easter', days: 3, icon: 'ev_egg_1', deco: 'bunting', note: 'Painted eggs are hidden all over the island: in the grass, in trees, underground, even in the sea. Bring them to Cece.',
        hello: "Happy Egg Hunt! There are painted eggs EVERYWHERE. I found one in my hat. I wasn't wearing my hat. It was on the shelf.",
        chat: [['Found any eggs?', 'One. It was a rock.', 'Painted?', 'No. Just a rock.']] },
    ...[1, 4, 7, 10].map(m => ({ id: 'fishoff', name: 'Fish-Off', rule: 'sat2', m, icon: 'fish_tuna', note: 'Kai runs a fishing contest by the pier, 9 AM to 6 PM. Three minutes, as many fish as you can.',
        hello: "It's the Fish-Off! Kai is at the pier with a stopwatch. He doesn't know how to stop it. Nobody tell him.",
        chat: [['Entering the Fish-Off?', 'I caught a boot last time.', 'Points?', 'Zero. Style points, though.']] })),
    { id: 'oceansday', name: 'Ocean Day', m: 6, d: 8, icon: 'shell_conch', deco: 'bunting_green', note: "Litter washed up on the beach. Cuke pays for every piece you pick up.",
        hello: "Happy Ocean Day! The sea gave us a bunch of litter. Rude. Let's give it back... to the trash can.",
        chat: [['Beach cleanup today!', 'I found a boot.', 'Just one?', "It's the left one. I'm looking for the right one."]] },
    { id: 'toyday', name: 'Toy Day', m: 12, d: 24, icon: 'ui_present', deco: 'lanterns', note: 'Fortune needs help delivering presents around the island.',
        hello: "Happy Toy Day! Fortune's been wrapping presents since dawn. Some of them are wrapped twice. She got excited." },
);
HOLIDAYS.find(h => h.id === 'earthday').note += ' Litter washed up on the beach, too: Cuke pays for every piece.';
HOLIDAYS.find(h => h.id === 'halloween').note += ' After 5 PM, neighbors come trick-or-treating: Fortune sells candy.';
HOLIDAYS.find(h => h.id === 'feastday').note += ' Mac judges a cook-off: bring him your best dish.';

/* ---------------------------------------------------------------- the things (drawn in code until the new art) */
const EGG_COLORS = [['#ffb3c8', '#ff7aa8'], ['#bfe6ff', '#6ab0e8'], ['#fff1a8', '#f2c94a'], ['#c8f0b8', '#7acc5e']];
function makeSprite(name, w, h, ax, ay, fn) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    fn(c.getContext('2d'));
    Assets.dyn[name] = { c, w, h, ax, ay };
}
ASSET_MAKERS.push(() => {
    const px = (g, col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w || 1, h || 1); };
    EGG_COLORS.forEach(([lt, dk], i) => makeSprite('ev_egg_' + i, 10, 12, 5, 11, g => {
        px(g, '#5a3a4a', 3, 0, 4); px(g, '#5a3a4a', 1, 2, 8, 7); px(g, '#5a3a4a', 2, 1, 6, 10); px(g, '#5a3a4a', 3, 11, 4);
        px(g, lt, 3, 1, 4, 10); px(g, lt, 2, 2, 6, 8); px(g, lt, 2, 3, 6, 6);
        px(g, dk, 2, 5, 6, 2); px(g, '#ffffff', 3, 5, 1); px(g, '#ffffff', 6, 5, 1);
        px(g, dk, 3, 8, 4, 1); px(g, 'rgba(255,255,255,0.75)', 3, 2, 1, 2);
    }));
    makeSprite('ev_candy', 14, 9, 7, 8, g => {
        px(g, '#5a3a4a', 4, 1, 6, 7); px(g, '#ff7aa8', 5, 2, 4, 5); px(g, '#ffffff', 6, 2, 1, 5);
        px(g, '#5a3a4a', 0, 2, 4, 5); px(g, '#ffd84a', 1, 3, 2, 3); px(g, '#5a3a4a', 10, 2, 4, 5); px(g, '#ffd84a', 11, 3, 2, 3);
    });
    // prizes: a golden egg on a stand, a fish trophy, a candy bowl, a star lamp, a recycling bin, a golden spoon
    makeSprite('f_golden_egg', 16, 18, 8, 17, g => {
        px(g, '#6b4a2b', 3, 14, 10, 3); px(g, '#a8743a', 4, 14, 8, 2);
        px(g, '#8a6a10', 6, 2, 4); px(g, '#8a6a10', 4, 4, 8, 9); px(g, '#8a6a10', 5, 3, 6, 11);
        px(g, '#ffd84a', 6, 3, 4, 10); px(g, '#ffd84a', 5, 5, 6, 7); px(g, '#fff1a8', 6, 4, 1, 4); px(g, '#e8b42a', 9, 9, 2, 3);
    });
    makeSprite('f_fish_trophy', 16, 18, 8, 17, g => {
        px(g, '#6b4a2b', 4, 14, 8, 3); px(g, '#e8b42a', 7, 9, 2, 5);
        px(g, '#8a6a10', 2, 3, 10, 6); px(g, '#ffd84a', 3, 4, 8, 4); px(g, '#ffd84a', 11, 2, 3, 3); px(g, '#ffd84a', 11, 7, 3, 3); px(g, '#3b2a45', 4, 5, 1, 1); px(g, '#fff1a8', 5, 4, 3, 1);
    });
    makeSprite('f_candy_bowl', 16, 14, 8, 13, g => {
        px(g, '#ff7a3a', 3, 4, 3, 3); px(g, '#7acc5e', 6, 3, 3, 3); px(g, '#ff7aa8', 9, 4, 3, 3); px(g, '#ffd84a', 5, 5, 6, 2);
        px(g, '#5a3a4a', 1, 7, 14, 1); px(g, '#5a3a4a', 2, 8, 12, 4); px(g, '#ff8a3a', 2, 8, 12, 3); px(g, '#3b2a45', 5, 9, 2, 1); px(g, '#3b2a45', 9, 9, 2, 1); px(g, '#5a3a4a', 4, 12, 8, 1);
    });
    makeSprite('f_toy_star', 16, 28, 8, 27, g => {
        px(g, '#6b4a2b', 5, 24, 6, 3); px(g, '#8a8a9a', 7, 10, 2, 14);
        px(g, '#c99a10', 6, 1, 4, 9); px(g, '#c99a10', 2, 4, 12, 3); px(g, '#ffd84a', 7, 1, 2, 8); px(g, '#ffd84a', 3, 5, 10, 1); px(g, '#ffd84a', 5, 4, 6, 3); px(g, '#fff1a8', 7, 3, 1, 2);
    });
    makeSprite('f_recycle_bin', 16, 18, 8, 17, g => {
        px(g, '#2f6a3a', 2, 3, 12, 2); px(g, '#2f6a3a', 3, 5, 10, 11); px(g, '#4f9a5a', 4, 5, 8, 10); px(g, '#ffffff', 6, 8, 4, 1); px(g, '#ffffff', 6, 8, 1, 4); px(g, '#ffffff', 9, 9, 1, 3); px(g, '#ffffff', 6, 12, 4, 1);
    });
    makeSprite('f_golden_spoon', 16, 18, 8, 17, g => {
        px(g, '#6b4a2b', 3, 14, 10, 3); px(g, '#8a6a10', 7, 6, 2, 8); px(g, '#8a6a10', 5, 1, 6, 6); px(g, '#ffd84a', 6, 2, 4, 4); px(g, '#ffd84a', 7, 6, 1, 7); px(g, '#fff1a8', 6, 2, 1, 2);
    });
});
for (let i = 0; i < 4; i++) ITEMS['egg_' + i] = { name: 'Painted egg', type: 'event', price: 0, icon: 'ev_egg_' + i };
ITEMS.candy = { name: 'Candy', type: 'event', price: 100, icon: 'ev_candy' };
ITEMS.litter_can = { name: 'Washed-up can', type: 'event', price: 0, icon: 'ic_q_tincan' };
ITEMS.litter_boot = { name: 'Washed-up boot', type: 'event', price: 0, icon: 'fish_boot' };
ITEMS.toy_present = { name: "Fortune's present", type: 'event', price: 0, icon: 'ui_present' };
ITEM_TYPES.event = 'Holiday';
const FEST_PRIZES = { golden_egg: ['Golden egg', 'top'], fish_trophy: ['Fish-Off trophy', 'top'], candy_bowl: ['Candy bowl', 'top'], toy_star: ['Toy Day star lamp', 'floor'],
    recycle_bin: ['Recycling bin', 'floor'], golden_spoon: ['Golden spoon', 'top'] };
for (const [id, [name, kind]] of Object.entries(FEST_PRIZES)) {
    ITEMS[id] = { name, type: 'furniture', price: 0, icon: 'f_' + id };
    FURN[id] = { id, name, w: 1, h: 1, kind, price: 0, sets: ['holiday'], light: id === 'toy_star' ? 26 : undefined };
}
const isEgg = id => /^egg_\d$/.test(id);
const LITTER = ['litter_can', 'litter_boot'];

/* ---------------------------------------------------------------- state (island-level: Sarah's) */
function fest() { if (!S.fest || typeof S.fest !== 'object') S.fest = {}; return S.fest; }
/* a prize is won once (placing it at home mustn't make it winnable again) */
function firstWin(id) { const F = fest(); F.won = F.won || {}; if (F.won[id]) return false; F.won[id] = Clock.dayNum(); return true; }
/* today's state for one event, fresh each day */
function festDay(k) { const F = fest(), day = Clock.dayNum(); if (!F[k] || F[k].day !== day) F[k] = { day }; return F[k]; }
const festOn = id => isHoliday(id) && !Online.visitor();
const cleanupOn = () => festOn('earthday') || festOn('oceansday');

/* a new day (or the first visit outside today): put out today's eggs and litter, take away yesterday's */
function festTick() {
    if (Online.visitor() || !S.drops) return;
    const day = Clock.dayNum(), a = G.areas && G.areas.island;
    const old = S.drops.filter(d => d.fest != null && d.fest !== day);
    if (old.length) {
        S.drops = S.drops.filter(d => !(d.fest != null && d.fest !== day));
        if (a) for (const e of a.ents.filter(e => e.dropRef && old.includes(e.dropRef))) a.remove(e);
    }
    if (a) for (const e of a.ents.filter(e => e.eggspot && e.day !== day)) a.remove(e);
    const put = (id, tx, ty) => {
        const [x, y] = tileFoot(tx, ty), d = { id, x, y: y - 1, area: 'island', fest: day };
        S.drops.push(d);
        if (a) { const e = makeItemEnt(id, d.x, d.y); e.dropRef = d; e.twinkle = true; a.add(e); }
    };
    if (festOn('egghunt')) {
        const st = festDay('eggs');
        if (!st.out) {
            st.out = true; st.dug = []; st.shook = []; st.fished = 0;
            const r = mulberry(hash32(S.seed + ':eggs:' + day));
            shuffled(grassSpots(a), r).slice(0, 8).forEach(([x, y], i) => put('egg_' + (i % 4), x, y));
            st.buried = shuffled(grassSpots(a), r).slice(8, 11);
            const trees = a ? a.ents.filter(e => e.kind === 'tree' && !e.forest) : [];
            st.trees = shuffled(trees.map(e => e.id), r).slice(0, 4);
        }
        if (a && !a.ents.some(e => e.eggspot)) st.buried.forEach(([x, y], i) => { if (!st.dug.includes(i)) addEggSpot(a, x, y, i, day); });
    }
    if (cleanupOn()) {
        const st = festDay('litter');
        if (!st.out) {
            st.out = true;
            const r = mulberry(hash32(S.seed + ':litter:' + day));
            shuffled(beachSpots(a), r).slice(0, 10).forEach(([x, y], i) => put(LITTER[i % 2], x, y));
        }
    }
    Save.touch();
}
Bus.on('enter', id => { if (id === 'island') festTick(); });

/* ---------------------------------------------------------------- Egg Hunt */
function addEggSpot(a, tx, ty, i, day) {
    const [fx, fy] = tileFoot(tx, ty);
    const e = a.add({ kind: 'deco', eggspot: true, day, layer: 0, x: fx, y: fy - 3 });
    e.hit = { x: tx * TILE, y: ty * TILE, w: TILE, h: TILE };
    e.draw = ctx => {
        // a little star-shaped crack in the ground
        const x = Math.round(e.x), y = Math.round(e.y);
        ctx.fillStyle = 'rgba(70,45,25,0.75)';
        ctx.fillRect(x - 1, y - 3, 2, 6); ctx.fillRect(x - 4, y - 1, 8, 2); ctx.fillRect(x - 3, y - 3, 1, 1); ctx.fillRect(x + 2, y - 3, 1, 1); ctx.fillRect(x - 3, y + 2, 1, 1); ctx.fillRect(x + 2, y + 2, 1, 1);
    };
    e.interact = async () => {
        if (heldTool() !== 'shovel') { await UI.say(null, 'A little crack in the ground, shaped like a star. Something is buried here. A shovel would help.'); return; }
        G.busy++;
        try { await toolSwing('shovel', () => { Sfx.play('dig'); dirtFx(e.x, e.y - 2); }); } finally { G.busy--; }
        a.remove(e);
        const st = festDay('eggs');
        if (!st.dug.includes(i)) st.dug.push(i);
        receive('egg_' + (i % 4), 1);
        Sfx.play('item');
        UI.toast('Dug up a painted egg!', 'ev_egg_' + (i % 4));
        Save.touch();
    };
}
/* shaking one of today's egg trees: an egg falls out (once) */
function festShake(e) {
    if (!festOn('egghunt')) return false;
    const st = festDay('eggs');
    if (!st.trees || !st.trees.includes(e.id) || st.shook.includes(e.id)) return false;
    st.shook.push(e.id);
    const p = G.player, x = e.x + 8, y = e.y + 12;
    spawnDrop('egg_' + (st.shook.length % 4), G.area.solidPx(x, y - 2) ? p.x : x, G.area.solidPx(x, y - 2) ? p.y + 2 : y, false);
    UI.toast('An egg fell out of the tree!', 'ev_egg_' + (st.shook.length % 4));
    return true;
}
Bus.on('fish', id => {
    // now and then an egg comes up with the catch
    if (festOn('egghunt') && id !== 'crate') {
        const st = festDay('eggs');
        if ((st.fished || 0) < 2 && R() < 0.4) { st.fished = (st.fished || 0) + 1; receive('egg_3', 1); UI.toast('A painted egg was stuck on the hook too!', 'ev_egg_3'); }
    }
    if (FishOff.on && id !== 'crate') FishOff.caught(id);
});
async function eggsToCece() {
    const st = fest(), year = Clock.dayDate().getFullYear();
    if (!st.eggYear || st.eggYear.year !== year) st.eggYear = { year, given: 0 };
    let n = 0;
    for (let i = 0; i < 4; i++) { const c = pocketCount('egg_' + i); if (c) { removeItem('egg_' + i, c); n += c; } }
    const before = st.eggYear.given;
    st.eggYear.given += n;
    addMoney(n * 80, true, 'Prizes & tips');
    Sfx.play('sell');
    const lines = [`${n} ${plural(n, 'egg')}! Oh, they're beautiful. Sorry, I'm emotional. Here, ${fmtNum(n * 80)} sand dollars.`];
    if (before < 3 && st.eggYear.given >= 3) {
        if (!S.recipes.includes('pancakes')) { S.recipes.push('pancakes'); lines.push("And I'm teaching you my pancakes. Flour, eggs, cream, sugar. Don't tell anyone they're easy."); UI.toast('Learned a recipe: Pancakes', 'dish_pancakes'); }
        else { addMoney(500, true, 'Prizes & tips'); lines.push("You already know my pancakes, so here's a little extra. Sorry it's not more! It's 500!"); }
    }
    if (before < 8 && st.eggYear.given >= 8) {
        if (firstWin('golden_egg')) { toStorage('golden_egg', 1); lines.push('Eight eggs! You get the golden egg. I painted it myself. It took four days. Sorry. It went to your house.'); }
        else { addMoney(1500, true, 'Prizes & tips'); lines.push('Eight! Here, 1,500 extra. You already have my golden egg. Sorry there is only one golden egg.'); }
    }
    lines.push(`(${st.eggYear.given} ${plural(st.eggYear.given, 'egg')} this year. ${st.eggYear.given < 3 ? 'At 3: a recipe.' : st.eggYear.given < 8 ? 'At 8: the golden egg.' : 'Every egg still gets you sand dollars!'})`);
    await UI.say('cece', lines, { keep: true });
    Save.touch();
}

/* ---------------------------------------------------------------- Fish-Off */
const FISHOFF_SECS = 180, FISHOFF_BEAT = 200;          // Kai's score to beat
const FishOff = {
    on: false, end: 0, pts: 0, n: 0, timer: 0, el: null,
    open() { return festOn('fishoff') && hourIn(Clock.hourF(), 9, 18); },
    async start() {
        const st = festDay('fishoff');
        if (st.done) { await UI.say('kai', `You already did the Fish-Off today, dude. ${st.pts} points! ${st.pts >= FISHOFF_BEAT ? 'Legend.' : "Next time it's yours."}`, { keep: true }); return; }
        if (!ownedCount('rod')) { await UI.say('kai', "Dude, you need a fishing rod for the Fish-Off. Fortune sells them. It's kind of the main thing.", { keep: true }); return; }
        await UI.say('kai', [`The Fish-Off! Three minutes. Catch as much as you can, anywhere. Bigger fish, more points. My score to beat: ${FISHOFF_BEAT}.`, "Boots are zero points. I know. I've tried. Go!"], { keep: true });
        UI.hideDialog();
        this.on = true; this.end = Date.now() + FISHOFF_SECS * 1000; this.pts = 0; this.n = 0;
        this.el = el('div', 'fest-timer');
        document.body.appendChild(this.el);
        this.timer = setInterval(() => this.tick(), 250);
        this.tick();
    },
    caught(id) {
        if (Date.now() > this.end) return;
        const f = FISHES.find(q => q.id === id), pts = id === 'boot' ? 0 : Math.round((ITEMS[id] ? ITEMS[id].price : 100) / 20) + (f ? f.size * 2 : 0);
        this.pts += pts; this.n++;
        UI.toast(`Fish-Off: +${pts} (${this.pts} so far)`, itemIcon(id));
    },
    tick() {
        const left = Math.max(0, Math.ceil((this.end - Date.now()) / 1000));
        if (this.el) this.el.textContent = `Fish-Off ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')} · ${this.pts} pts`;
        if (left > 0 || G.busy || Fishing.st) return;             // let a bite in progress finish
        this.finish();
    },
    async finish() {
        clearInterval(this.timer); this.on = false;
        if (this.el) { this.el.remove(); this.el = null; }
        const st = festDay('fishoff');
        st.done = true; st.pts = this.pts;
        Sfx.play('fanfare');
        const win = this.pts >= FISHOFF_BEAT;
        const lines = [`Time! ${this.n} ${plural(this.n, 'catch', 'catches')}, ${this.pts} points.`];
        if (win && firstWin('fish_trophy')) { toStorage('fish_trophy', 1); addMoney(1000, true, 'Prizes & tips'); lines.push("You BEAT me! Dude. The trophy's yours. It's at your house. And 1,000 sand dollars. I'm not crying. It's sea spray."); }
        else if (win) { addMoney(1500, true, 'Prizes & tips'); lines.push("You beat me AGAIN. Here's 1,500. You've already got the trophy. You're the trophy now."); }
        else { addMoney(200 + this.pts * 2, true, 'Prizes & tips'); lines.push(`Not bad! My ${FISHOFF_BEAT} stands. Here's ${fmtNum(200 + this.pts * 2)} for showing up. Next Fish-Off: second Saturday in ${['January', 'April', 'July', 'October'][Math.floor(((Clock.dayDate().getMonth() + 3) % 12) / 3)]}.`); }
        await UI.say(NPCs.get('kai') && NPCs.get('kai').area === G.area.id ? 'kai' : null, lines);
        Save.touch();
    },
};

/* ---------------------------------------------------------------- Beach Cleanup */
async function litterToCuke() {
    let n = 0;
    for (const id of LITTER) { const c = pocketCount(id); if (c) { removeItem(id, c); n += c; } }
    const st = festDay('litter');
    const before = st.given || 0;
    st.given = before + n;
    addMoney(n * 60, true, 'Prizes & tips');
    Sfx.play('sell');
    const lines = [`${n} ${plural(n, 'piece')} of litter! The beach says thank you! I said it for the beach! ${fmtNum(n * 60)} sand dollars!`];
    if (before < 10 && st.given >= 10) {
        if (firstWin('recycle_bin')) { toStorage('recycle_bin', 1); lines.push("All ten! A spotless beach! You get my recycling bin! It's at your house! It's GREAT for the heart!"); }
        else { addMoney(800, true, 'Prizes & tips'); lines.push('All ten AGAIN! Here, 800 more! You already have the bin! Two bins is too many bins!'); }
    } else if (st.given < 10) lines.push(`${st.given} of 10 today. Keep going! Squats between pieces! Optional!`);
    await UI.say('cuke', lines, { keep: true });
    Save.touch();
}

/* ---------------------------------------------------------------- Trick-or-Treat */
const trickOn = () => festOn('halloween') && hourIn(Clock.hourF(), 17, 24);
const COSTUMES = { maki: 'a ghost (a sheet with rice on it)', kai: 'a pirate. "Arr, dude."', basil: 'a vampire. A calm one.', wonton: 'a soup. To face his fears.',
    chili: 'the sun. Obviously.', coco: 'a detective. She already knows everything.', cece: 'a witch. A very apologetic witch.', clementine: 'a pumpkin. Couture.',
    cuke: 'a mummy. Wrapped in sweatbands.', sully: 'a lobster. "It\'s a Boston thing, kid."', ginger: 'a robot made of cardboard. Load-bearing.', brulee: 'the Mona Lisa.', mac: 'a chef. He is always dressed as a chef.' };
/* and what each one wears for it in the new look (EnvDolls' costume pieces, 33k_env_dolls.js), from five till midnight */
const COSTUME_ACC = { maki: 'ghosthood', kai: 'piratehat', basil: 'bathat', wonton: 'soupbowl', chili: 'sunrays', coco: 'deerstalker', cece: 'witchhat',
    clementine: 'pumpkinhat', cuke: 'mummywrap', sully: 'lobsterclaws', ginger: 'robotbox', brulee: 'goldframe', mac: 'chefhat' };
function halloweenCostume(id) { return trickOn() ? COSTUME_ACC[id] || null : null; }
function trickOption(n) {
    if (!trickOn() || !NEIGHBORS.includes(n.id)) return null;
    const st = festDay('treat');
    st.done = st.done || [];
    if (st.done.includes(n.id)) return null;
    return { label: 'Trick or treat?', fn: async () => {
        st.done.push(n.id);
        // (the costumes are told by the narrator: "Coco is dressed as a detective. She already knows everything.")
        await UI.say(n.id, voiced(n.id, 'TRICK OR TREAT!'), { keep: true });
        if (COSTUMES[n.id]) await UI.say(null, `${NPC_DEFS[n.id].name} is dressed as ${COSTUMES[n.id]}`, { keep: true });
        if (pocketCount('candy')) {
            removeItem('candy', 1);
            st.given = (st.given || 0) + 1;
            addPts(n.id, 3);
            n.emote = 'heart'; n.emoteT = 80;
            const lines = [voiced(n.id, rpick(['Candy! You are the best house on the island. You are not a house. You know what I mean.', 'Ooh, the good kind! Thank you!', 'Candy! Here, I made you something too.']))];
            if (R() < 0.5) { addMoney(300, true, 'Prizes & tips'); lines.push('(They slip you 300 sand dollars. Reverse trick-or-treating.)'); }
            if (st.given === 5) {
                if (firstWin('candy_bowl')) { toStorage('candy_bowl', 1); lines.push('Word gets around: five treats! Fortune sends a candy bowl to your house. "For next year. - F"'); }
                else addMoney(1000, true, 'Prizes & tips');
            }
            await UI.say(n.id, lines, { keep: true });
        } else {
            const p = G.player;
            p.emote = 'sweat'; p.emoteT = 90;
            Sfx.play('ouch');
            await UI.say(n.id, voiced(n.id, rpick(["No candy? Then... TRICK! *They put a paper bag on your head.* There. Now you're a costume too.", "No candy?! TRICK! *They tie your shoelaces together.* You aren't wearing laces. It was symbolic.",
                "No candy... TRICK! *They say BOO very loudly.* Got you. Fortune sells candy, by the way. Just saying."])), { keep: true });
        }
        Save.touch();
        return true;
    } };
}

/* ---------------------------------------------------------------- Toy Day */
function toyList() {
    const st = festDay('toys');
    if (!st.list) { const r = mulberry(hash32(S.seed + ':toys:' + st.day)); st.list = shuffled(NEIGHBORS.filter(id => id !== 'fortune'), r).slice(0, 5); st.done = []; }
    return st;
}
const TOY_THANKS = { maki: 'A present? For me? I will open it precisely. Corner by corner.', kai: "A present! Dude! It's shaped like a surfboard! It's not a surfboard. It's socks. I love socks.",
    basil: 'Oh, how kind. It feels balanced. Thank you.', wonton: 'A present! It is NOT a soup pot! I checked by shaking it! Thank you!',
    chili: "For me?! It's warm! Everything I hold is warm. Thank you!", coco: "A PRESENT. I'm telling everyone. I'm telling everyone RIGHT NOW.",
    cece: "For me? Oh no, I didn't get Fortune anything! Sorry! Thank you! Sorry!", clementine: 'Darling. The wrapping is orange. Fortune knows me.',
    cuke: "A PRESENT! I'm going to open it while jogging!", sully: "A present, kid? Wicked nice. Tell Fortune thanks.", ginger: "Ooh. Solid wrapping job. Good corners. Thanks!",
    brulee: 'Magnifique. The bow is a work of art. I may not open it.', mac: "A present! Is it cheese? It's cheese. I can smell it. Thank you!" };
async function toyFromFortune() {
    const st = toyList();
    if (st.done.length >= st.list.length) { await UI.say('fortune', 'All delivered! You are the best helper this island has ever had. And the only one.', { keep: true }); return; }
    if (pocketCount('toy_present')) { await UI.say('fortune', `Still delivering? Presents for: ${st.list.filter(id => !st.done.includes(id)).map(id => NPC_DEFS[id].name).join(', ')}.`, { keep: true }); return; }
    const left = st.list.filter(id => !st.done.includes(id));
    if (!canAdd('toy_present', left.length)) { await UI.say('fortune', 'Your pockets are full! Make some room and I will hand you the presents.', { keep: true }); return; }
    receive('toy_present', left.length);
    await UI.say('fortune', [`Happy Toy Day! I wrapped presents for everyone, and now I can't feel my fingers. Can you deliver these?`,
        `They're for ${left.map(id => NPC_DEFS[id].name).join(', ')}. Bring me good news when they're all delivered!`], { keep: true });
    Save.touch();
}
function toyOption(n) {
    if (!festOn('toyday') || !pocketCount('toy_present')) return null;
    const st = toyList();
    if (!st.list.includes(n.id) || st.done.includes(n.id)) return null;
    return { label: 'A present from Fortune!', fn: async () => {
        removeItem('toy_present', 1);
        st.done.push(n.id);
        addPts(n.id, 4);
        n.emote = 'heart'; n.emoteT = 90;
        Sfx.play('item');
        const all = st.done.length >= st.list.length;
        await UI.say(n.id, [voiced(n.id, TOY_THANKS[n.id] || 'A present! Thank you!')].concat(all ? ['(That was the last one! Fortune will want to hear.)'] : []), { keep: true });
        Save.touch();
        return true;
    } };
}
async function toyThanks() {
    const st = toyList();
    st.thanked = true;
    if (firstWin('toy_star')) { toStorage('toy_star', 1); addMoney(1000, true, 'Prizes & tips'); await UI.say('fortune', ['All of them? You did it! Here: the Toy Day star lamp, for your house, and 1,000 sand dollars.', 'May your cookies always crack evenly. Especially today.'], { keep: true }); }
    else { addMoney(2000, true, 'Prizes & tips'); await UI.say('fortune', 'All delivered again! Here, 2,000 sand dollars. You already have the star lamp. It is still the brightest thing on the island.', { keep: true }); }
    Save.touch();
}

/* ---------------------------------------------------------------- Feast Cook-Off */
async function cookOff() {
    const st = festDay('cook');
    if (st.done) { await UI.say('mac', `You already entered! Your ${itemName(st.dish).toLowerCase()} got ${st.score} out of 10. I still think about it.`, { keep: true }); return; }
    const dishes = S.pocket.filter(s => s && ITEMS[s.id] && ITEMS[s.id].type === 'dish').map(s => s.id).filter((id, i, a) => a.indexOf(id) === i);
    if (!dishes.length) { await UI.say('mac', "The Feast Cook-Off! Bring me your best dish. Cook something at home and come back. I'll be here. I'm always here. It's my restaurant.", { keep: true }); return; }
    const k = await UI.ask('mac', 'The Feast Cook-Off! Which dish are you entering?', dishes.map(id => itemName(id)).concat(['Not yet']), { keep: true });
    if (k >= dishes.length) return;
    const id = dishes[k];
    removeItem(id, 1);
    const price = ITEMS[id].price || 0, rec = GD.recipes.find(r => r.id === id), parts = rec ? Object.keys(rec.need).length : 1;
    const score = Math.max(4, Math.min(10, Math.round(3 + price / 600 + parts * 0.7)));
    st.done = true; st.dish = id; st.score = score;
    Sfx.play('fanfare');
    const lines = [`*Mac takes a bite of your ${itemName(id).toLowerCase()}. He closes his eyes. He chews for a very long time.*`, `${score} out of 10! ${score >= 9 ? 'This is the best thing anyone has made in my restaurant. Including me. Especially me.' : score >= 7 ? "That's GOOD. That's really good." : 'Solid! Honest! Warm! Like a hug you can eat.'}`];
    const prize = score >= 8 ? 2000 : score >= 6 ? 800 : 300;
    addMoney(prize, true, 'Prizes & tips');
    if (score >= 8 && firstWin('golden_spoon')) { toStorage('golden_spoon', 1); lines.push(`First place! The golden spoon is yours (it went to your house), and ${fmtNum(prize)} sand dollars.`); }
    else lines.push(`Here's ${fmtNum(prize)} sand dollars. ${score >= 8 ? 'You already have my golden spoon. Polish it.' : 'An 8 or better wins the golden spoon.'}`);
    await UI.say('mac', lines, { keep: true });
    Save.touch();
}

/* ---------------------------------------------------------------- talk menu entries for all of it */
function festOptions(n) {
    const out = [];
    if (Online.visitor()) return out;
    const id = n.id;
    if (id === 'cece' && festOn('egghunt') && [0, 1, 2, 3].some(i => pocketCount('egg_' + i))) out.push({ label: 'I found painted eggs!', fn: async () => { await eggsToCece(); return true; } });
    if (id === 'kai' && FishOff.open() && !FishOff.on && !festDay('fishoff').done) out.push({ label: 'Enter the Fish-Off', fn: async () => { await FishOff.start(); return false; } });
    if (id === 'cuke' && LITTER.some(l => pocketCount(l))) out.push({ label: 'I picked up litter!', fn: async () => { await litterToCuke(); return true; } });
    if (id === 'fortune' && festOn('toyday')) {
        const st = toyList();
        if (st.done.length >= st.list.length && !st.thanked) out.push({ label: 'All the presents are delivered!', fn: async () => { await toyThanks(); return true; } });
        else if (!st.thanked) out.push({ label: 'Toy Day presents?', fn: async () => { await toyFromFortune(); return true; } });
    }
    if (id === 'mac' && festOn('feastday') && !festDay('cook').done) out.push({ label: 'Enter the Feast Cook-Off', fn: async () => { await cookOff(); return true; } });
    const t = trickOption(n);
    if (t) out.push(t);
    const g = toyOption(n);
    if (g) out.push(g);
    return out;
}
/* candy at Fortune's on Halloween week */
function candyOnSale() { return isHoliday('spooky') || isHoliday('halloween'); }
