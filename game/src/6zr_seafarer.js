/* ---- 6zr_seafarer.js ---- */
/* Captain Scampi, the seafarer (David, 27 October late): a giant shrimp and a salty old sailor, found washed up on the
   beach by the pier, out cold, a week after a new island begins (or after a save is brought in: an older island counts
   its week from the day it first loads this). A storm took his ship; he builds a new one on the beach and needs
   something each day: ten logs (while he's short, chopping down a tree drops a sturdy log beside the wood), then ten
   home-cooked meals for the voyage, then five gems for the compass and the ballast. On the morning tide he sails off, a
   little send-off with a gift, and a few days later his boat is back at the pier: he'd like to drop anchor for good. If
   Sarah says yes he takes the plot for sale by the west lane (land_a) the next morning, works the farm's fields, and
   brings seeds and recipes from his travels. He's one of the island's secret neighbors (the Collection's last page).
   Kept as S.sea { from, stage, day, next, got: { logs, meals, gems } }; stage: 0 not yet, 1 washed up, 2 logs, 3 meals,
   4 gems, 5 sailing the next morning (day: that morning), 6 away (since day), 7 back at the pier, 8 moving in (day: the
   house's morning), 9 living here. */
const SEA_WEEK = 7, SEA_AWAY = 3;
const SEA_NEED = { logs: 10, meals: 10, gems: 5 };
ITEMS.ship_log = { name: 'Sturdy log', type: 'quest', price: 0, icon: 'ic_wood' };
NPC_DEFS.scampi = { name: 'Scampi', sprite: 'scampi', color: '#e8603e', voice: 200, wave: 'sawtooth', house: 'h_scampi', h: 18, wake: 5.5, bed: 21.5, newcomer: true,
    fav: { pier: 3, harbor: 2.5, beach: 2, beach_e: 1.5, bonfire: 2, orchard: 1, farm: 1 }, work: [['farm', 6.4, 10.8, { tend: true }], ['farm', 14, 16.4, { tend: true }]] };
HOUSE_BASE.h_scampi = { wall: '#f6f2e6', roof: '#2f5a9a', trim: '#c8382c', door: '#3a6ab8', sig: 'lantern' };
HOUSE_IDS.push('h_scampi');
HOUSE_LAYOUT.scampi = { wall: 'wall_cream', floor: 'floor_wood', items: [
    ['window_wall', 1, 'wall'], ['clock_wall', 5, 'wall'],
    ['lh_trunk', 0, 0], ['barrel', 1, 0], ['bed_simple', 5, 0], ['table_wood', 2, 2], ['chair_wood', 3, 2], ['rug_round', 4, 3], ['plant_monstera', 0, 4], ['lamp_floor', 6, 4]] };
ROOMS.h_scampi = { w: 7, h: 5, wall: 'wall_cream', floor: 'floor_wood', music: 'house', owner: 'scampi', layout: HOUSE_LAYOUT.scampi.items, home: [3, 2, 2] };
TALK.scampi = {
    intro: ["Ahoy! Captain Scampi, late of the Brine Darling, now of yer fine island. Pleased to meet ye properly, matey.", "If ye ever need a knot tied or a sea shanty sung, ye know where I'll be. Out in the fields, these days. Who'd have thought."],
    chat: [
        "Sailed the seven seas, I did. And the eight puddles. And one very rude lake.",
        "A shrimp on a farm! The fish back home would laugh their gills off. Let 'em. These carrots don't argue.",
        "Arr, the sea's a fickle mistress. The soil's a steady one. I've gone soft. Softer. I was never that crunchy.",
        "Red sky at night, sailor's delight. Red shell all day, that's just me.",
        "I can smell rain coming three days off. Also soup. Mostly soup.",
        "The Brine Darling sank in a storm with forty-foot waves. Or four-foot. It was dark. They felt big.",
        "Ye know what a barnacle is? A friend who won't leave. I've had a few. Good lads.",
        "Never trust a seagull. They're all pirates, the lot of 'em. Feathery pirates.",
        "Some nights I still rock in me sleep, like I'm out on the swell. Then I fall out of bed. Every time.",
        "I named every one of me boats after a sweetheart. They all left me too. Ha! Then the boats sank. Ha. Hm.",
        "Back in my day we navigated by the stars, a soggy map and shouting.",
        "Mac says I'm the only shrimp who's ever asked for MORE cocktail sauce on the side. I don't ask what goes in it. I don't want to know.",
    ],
    rain: ["Ahh, rain! Fresh water from the sky! Free! The sea never gave me anything free but sunburn."],
    night: ["Late watch, eh? I'll keep an eye on the horizon. Old habits. Go on to bed, matey."],
    winter: ["Cold as the North Sea out here! I've wintered in worse. In a barrel. Long story."],
    loves: ['chowder', 'sailor_stew', 'fish_tacos', 'seabass', 'lobster_roll'], likes: ['fish', 'dish', 'shell', 'veg'], dislikes: ['shrimp'],
    loveLine: "Now THAT'S a sailor's supper! Blow me down, matey. Ye've got a heart of gold and a galley to match.",
    likeLine: 'Much obliged, matey. Goes straight in the hold.',
    dislikeLine: "Is that... a SHRIMP? Matey. MATEY. We don't talk about Cousin Barry.",
    want: ['carrot', 'tomato', 'seabass', 'wood', 'pumpkin'],
    letter: "Ahoy, {name}!\nThe fields are coming in fine and the gulls are behaving (mostly).\nHere's a little something from the hold. Fair winds!\n- Capt. Scampi",
    letterGift: 'seed_corn',
};
SPECIAL_CATS.push(['friend', 'Secret neighbors']);
defSpecial('friend_scampi', 'friend', 'Captain Scampi', 'secret', 'Someone might wash up on the beach one day. Look after them.', {});

function seaState() {
    if (!S.sea) S.sea = { from: S.startDay != null ? S.startDay : Clock.dayNum(), stage: 0 };
    S.sea.got = S.sea.got || {};
    return S.sea;
}
function seaStage() { return (S && S.sea && S.sea.stage) || 0; }
/* living here (the house is up): he joins the neighbors */
function seafarerHere() { return seaStage() >= 9; }
/* his building site on the beach east of the pier (the plan's lot, W0.lots.sailor) */
function seaSite() { const l = (W0.lots && W0.lots.sailor) || { x: 124, y: 123, w: 3, h: 3 }; return { x: l.x + l.w / 2, y: l.y + l.h / 2, l }; }

/* each morning: the week's up, he's back from sea, the house is built */
function seaTick() {
    if (!S || LAB || Online.visitor()) return;
    const Q = seaState(), day = Clock.dayNum();
    if (Q.stage === 0 && day >= Q.from + SEA_WEEK) { Q.stage = 1; Q.day = day; }
    else if (Q.stage === 5 && day > Q.day) seaDepart(null, true);
    else if (Q.stage === 6 && day >= Q.day + SEA_AWAY) { Q.stage = 7; Q.day = day; }
    else if (Q.stage === 8 && day >= Q.day) seaMoveIn();
    seaJoin();
    seaRefresh();
}
/* once he lives here: one of the neighbors (the Friends app, chats, plans), his house on the plot */
function seaJoin() {
    if (!seafarerHere()) return;
    if (!NEIGHBORS.includes('scampi')) NEIGHBORS.push('scampi');
    if (!VS_SKILL.scampi) VS_SKILL.scampi = 0.5;
    const l = W0.lots && W0.lots.land_a;
    if (l && !W0.buildings.h_scampi) W0.buildings.h_scampi = { x: l.x, y: l.y, w: 3, h: 3, door: 1, sprite: 'house_scampi' };
}
/* is a plot for sale taken (its FOR SALE sign comes down) */
function lotTaken(x, y) {
    const l = W0.lots && W0.lots.land_a;
    return !!(l && seafarerHere() && x >= l.x && x < l.x + l.w && y >= l.y && y < l.y + l.h);
}
async function seaMoveIn() {
    const Q = seaState();
    Q.stage = 9; Q.home = Clock.dayNum();
    rel('scampi').met = false;          // (his first word as a neighbor is a proper hello: TALK.scampi.intro)
    seaJoin();
    townLog('Captain Scampi drops anchor for good and moves in by the west lane.');
    earnSpecial('friend_scampi', 'A secret neighbor: Captain Scampi stayed!');
    sendMail({ from: 'scampi', subject: 'Landlubber at last', body: "Ahoy, matey!\nGinger had me house up by sunrise. Swore at a hammer only twice. The roof's blue, like the sea, so I don't get homesick.\nYe'll find me in the fields most mornings. Come by for a shanty.\n- Capt. Scampi\n\nP.S. A packet of pumpkin seeds from the far islands, for yer garden. Fortune's stocking 'em now, and sweet corn too.", gift: 'seed_pumpkin' });
    if (typeof rebuildIsland === 'function' && G.areas && G.areas.island) rebuildIsland();
    if (typeof NPCs !== 'undefined') { Plans.reset(); NPCs.place(true); }
}

/* the newcomers' stories, for 22_npc.js and 50_talk.js */
function newcomerTarget(n, dh) { return n.id === 'scampi' ? seaTarget(n, dh) : typeof mugTarget === 'function' && n.id === 'mug' ? mugTarget(n, dh) : null; }
async function newcomerTalk(n) { return n.id === 'scampi' ? seaTalk(n) : typeof mugTalk === 'function' && n.id === 'mug' ? mugTalk(n) : false; }
/* where he is (22_npc.js targetFor asks first): out cold on the sand, at his ship, away at sea, at the pier, or his own day */
function seaTarget(n, dh) {
    const st = seaStage(), s = seaSite(), h = Clock.hourF();
    const at = (x, y, face, extra) => Object.assign({ key: 'sea' + st, area: 'island', x: x * TILE, y: y * TILE, fixed: true, face }, extra || {});
    if (st === 0 || st === 6) return { key: 'sea-away', sleep: true };
    if (st === 1) return at(s.x - 0.9, s.l.y + s.l.h + 0.4, 'down', { lie: true });
    if (st >= 2 && st <= 5) {
        if (st === 5 && Clock.dayNum() >= S.sea.day && h >= 12) return { key: 'sea-away', sleep: true };
        return h >= 6 && h < 21 ? at(s.l.x - 0.6, s.l.y + s.l.h + 0.3, 'right') : { key: 'sea-rest', sleep: true };
    }
    if (st === 7 || st === 8) {
        const pr = W0.pier;
        return h >= 6 && h < 21 ? at(pr.x0 + 0.35, pr.y1 - 2.5, 'left') : { key: 'sea-rest', sleep: true };
    }
    return null;
}

/* his building site, his boat at the pier: an island thing whose look follows the stage */
function seaRefresh(a) {
    a = a || (G.areas && G.areas.island);
    if (!a || LAB) return;
    const st = seaStage(), s = seaSite(), pr = W0.pier;
    const want = st === 1 || st === 2 ? 'wreck' : st === 3 || st === 4 ? 'ship_frame' : st === 5 ? 'ship_scampi' : st >= 7 ? 'ship_scampi' : null;
    const dock = st >= 7;
    let e = a.ents.find(q => q.kind === 'seasite');
    const key = want ? want + (dock ? '@pier' : '') : null;
    if (e && e.key3d === key) return;
    if (e) a.remove(e);
    if (want) {
        const x = dock ? (pr.x0 - 1.6) * TILE : s.x * TILE, y = dock ? (pr.y1 - 2) * TILE : (s.l.y + s.l.h - 0.2) * TILE;
        e = a.add({ kind: 'seasite', frame: want, model3d: want, key3d: key, x, y, float: dock, rot3d: dock ? Math.PI / 2 : 0, layer: 1 });
        e.hit = dock ? null : { x: s.l.x * TILE, y: s.l.y * TILE, w: s.l.w * TILE, h: s.l.h * TILE };
        e.interact = dock ? null : () => { const n = NPCs.get('scampi'); if (n && !n.sleeping) return talkTo(n); return UI.say(null, st <= 2 ? 'Broken planks, a barrel, a coil of rope and a torn scrap of red sail. Something was wrecked out there.' : 'A little ship taking shape on the sand. Someone has been working hard.'); };
    }
    if (typeof Env !== 'undefined') Env.dirty = true;
}

/* chopping down a tree while he's short of logs drops a sturdy log too (29_forest.js fellTree) */
function seaChop(x, y) {
    const Q = S && S.sea;
    if (!Q || Q.stage !== 2) return;
    const have = (Q.got.logs || 0) + pocketCount('ship_log') + ((S.storage && S.storage.ship_log) || 0);
    if (have < SEA_NEED.logs) spawnDrop('ship_log', x, y);
}

/* talking to him (50_talk.js talkTo asks first): the story, the day's job, the send-off, the asking; false once he lives here */
async function seaTalk(n) {
    const Q = seaState(), st = Q.stage, day = Clock.dayNum(), id = 'scampi';
    const say = async (lines) => UI.say(id, lines, { keep: true });
    if (st >= 9) return false;
    rel(id).met = true;
    if (st === 1) {
        await UI.say(null, 'A giant shrimp lies on the sand, very still, a battered captain\'s cap over his eyes. Sarah nudges him.', { keep: true });
        await say(["...Mmmph. Five more minutes, Mother...", "...Wait. LAND? Blessed, BLESSED land! Arr! Where am I? Who are ye? Why is the ground not moving?",
            "Captain Scampi, at yer service. Sailed the seven seas, the eight puddles and one very rude lake. Three nights back a storm took me ship, the Brine Darling, and spat me out here.",
            "Well, a captain without a ship is just a shrimp on a beach. I'll build meself a new one, right here, if ye'll help an old salt.",
            "First I need timber. Ten good logs. Chop down ten trees with an axe and bring me what they give. The sturdy ones, mind."]);
        if (!pocketCount('axe')) await say(["No axe? Fortune's shop sells 'em. Tell her a shrimp sent ye. She'll give ye a look."]);
        Q.stage = 2; Q.day = day; Q.got = {};
        seaRefresh(); Save.touch();
        return true;
    }
    const hand = async (key, label, ids, done, next) => {
        const need = SEA_NEED[key] - (Q.got[key] || 0);
        let give = 0;
        for (const it of ids()) { if (give >= need) break; const k = Math.min(need - give, pocketCount(it)); if (k > 0) { removeItem(it, k); give += k; } }
        if (!give) return false;
        Q.got[key] = (Q.got[key] || 0) + give;
        Sfx.play('item');
        if (Q.got[key] >= SEA_NEED[key]) { await say(done); next(); }
        else await say([`${give} ${label}! That's ${Q.got[key]} of ${SEA_NEED[key]}. ${pickSea(['Keep it coming, matey!', 'Arr, that\'s the spirit!', 'Fine work. Fine work.'])}`]);
        seaRefresh(); Save.touch();
        return true;
    };
    if (st >= 3 && st <= 4 && Q.next != null && day < Q.next) { await say([pickSea(["Tomorrow, matey. A captain needs his beauty sleep. And I'm a shrimp. We need a LOT.", "Come back tomorrow, and I'll have the next job for ye. Today I'm sanding. Sanding is ninety percent of shipbuilding. The rest is shouting."])]); return true; }
    if (st === 2) {
        const ok = await hand('logs', 'logs', () => ['ship_log'], ["Ten logs! Ha HA! She'll have a keel by sundown!", "Come back tomorrow. A ship's no good without provisions, and I've a list."], () => { Q.stage = 3; Q.next = day + 1; Q.asked = null; });
        if (!ok) await say([`Ten logs, matey. Chop down a tree with yer axe and a sturdy log falls out beside the wood. That's ${Q.got.logs || 0} so far.`]);
        return true;
    }
    if (st === 3) {
        if (Q.asked !== 3) { Q.asked = 3; await say(["Provisions! A long voyage needs real food. Ten home-cooked meals: anything ye've made at the stove. Ship's biscuit is no life for a shrimp."]); }
        const dishes = () => [...new Set(S.pocket.filter(q => q && ITEMS[q.id] && ITEMS[q.id].type === 'dish').map(q => q.id))];
        if (dishes().length) {
            const k = await UI.ask(id, `Ye've got ${dishes().reduce((a, d) => a + pocketCount(d), 0)} home-cooked meals on ye. Spare some for the voyage?`, ['Here you go!', 'Not these'], { keep: true });
            if (k === 0) { await hand('meals', 'meals', dishes, ["Ten meals! The galley's stocked! I'll eat like a king. A king shrimp. That's a real thing.", "One more job tomorrow and she's ready to sail."], () => { Q.stage = 4; Q.next = day + 1; Q.asked = null; }); return true; }
        }
        await say([`${Q.got.meals || 0} of ten meals so far. Cook something at the stove and bring it here, matey.`]);
        return true;
    }
    if (st === 4) {
        if (Q.asked !== 4) { Q.asked = 4; await say(["Last job! I need five gems: one for the compass, so she always knows north, and four for the ballast, so she sits pretty in the water. They turn up on the mountain top, I hear."]); }
        const gems = () => GEM_WEIGHTS.map(g => g[0]).filter(g => pocketCount(g) > 0);
        if (gems().length) {
            const k = await UI.ask(id, 'Those gems! Can ye spare them for the ship?', ['Take them!', 'Not these'], { keep: true });
            if (k === 0) { await hand('gems', 'gems', gems, ["Five gems! She's finished! Look at her! Isn't she the prettiest thing ye ever saw? Don't answer that. She can hear ye.", "I sail tomorrow on the morning tide. Come see an old shrimp off, would ye?"], () => { Q.stage = 5; Q.day = day + 1; }); return true; }
        }
        await say([`${Q.got.gems || 0} of five gems. The mountain top has 'em, a few a day.`]);
        return true;
    }
    if (st === 5) {
        if (day < Q.day) { await say(["Tomorrow on the morning tide, matey. Before noon. Don't be late!"]); return true; }
        await seaDepart(n);
        return true;
    }
    if (st === 7) {
        await say(["Ahoy! Couldn't keep away, could I? The sea's grand, but... I missed the place. The fields, the gulls, yer cooking. Ye.",
            "So here's the thing. An old salt's got to drop anchor some time."]);
        const k = await UI.ask(id, "Would ye mind if I stayed? For good? I'd take the plot for sale by the west lane, and I'm handy on a farm. Well. I could learn.", ["Yes! Stay!", 'Maybe later']);
        if (k === 0) {
            await say(["HA HA! Yer a treasure, matey! I'll have Ginger raise me a house by morning. Blue roof. Like the sea.", "Captain Scampi, landlubber. Who'd have thought it!"]);
            Q.stage = 8; Q.day = day + 1;
            n.emote = 'heart'; n.emoteT = 90;
        } else await say(["Fair winds. I'll ask again tomorrow, if ye'll let an old shrimp try."]);
        Save.touch();
        return true;
    }
    if (st === 8) { await say(["Tomorrow I'm a landlubber! Mostly. I'm keeping the hat."]); return true; }
    return false;
}
function pickSea(list) { return list[Math.floor(R() * list.length)]; }

/* the send-off: a gift, he boards, and the little red sail heads out to sea (also by itself if Sarah wasn't there) */
async function seaDepart(n, quiet) {
    const Q = seaState(), day = Clock.dayNum();
    const gift = !hasSpecial('compass') ? 'compass' : !hasSpecial('shipbottle') ? 'shipbottle' : null;
    if (quiet) {
        Q.stage = 6; Q.day = day;
        sendMail({ from: 'scampi', subject: 'Sorry I missed ye!', body: "Ahoy, matey!\nThe tide wouldn't wait, and neither could I. Thank ye for everything: the logs, the grub, the gems. The Brine Darling Two sails like a dream.\nI left ye a little something. Don't forget me!\n- Capt. Scampi", gift: gift ? null : 'shipbottle' });
        if (gift) earnSpecial(gift, 'A parting gift from Captain Scampi.');
        seaRefresh();
        return;
    }
    const id = 'scampi', p = G.player;
    await UI.say(id, ["Well, matey. This is it. The Brine Darling Two, ready for the open sea, all thanks to ye.",
        "Here. For all yer help. Me old compass. Always points home. And home, for ye, is here."], { keep: true });
    if (gift) await grantSpecial(gift, 'A parting gift from Captain Scampi.');
    else { addMoney(5000, true, 'Found & gifts'); await UI.say(null, 'Captain Scampi pressed 5,000 sand dollars into Sarah\'s hand. "For a rainy day. Or a sunny one. I\'m not fussy."', { keep: true }); }
    await UI.say(id, ["Fair winds, matey. Keep a light on for an old shrimp."], { keep: true });
    UI.hideDialog();
    G.busy++;
    try {
        for (let i = 1; i <= 10; i++) { G.fade = i / 10; await waitFrames(1); }
        Q.stage = 6; Q.day = day;
        seaRefresh();
        if (n) { n.want = null; n.sleeping = true; n.area = null; }
        Plans.reset(); NPCs.place(true);
        const s = seaSite(), b = { kind: 'ship_scampi', x: s.x * TILE, y: (s.l.y + s.l.h + 4.2) * TILE, vx: 0.04, vy: 0.3, t: 0, life: 1400 };
        SeaSky.boats.push(b);
        p.dir = 'down';
        for (let i = 9; i >= 0; i--) { G.fade = i / 10; await waitFrames(1); }
        G.fade = 0;
        p.pose = 'cheer'; p.poseT = 120;
        for (let i = 0; i < 260; i++) { G.camTarget = [b.x, b.y - 30]; await waitFrames(1); }
        G.camTarget = null;
        await UI.say(null, 'The little red sail grows smaller and smaller on the bright water, and then it\'s gone.');
    } finally { G.busy = Math.max(0, G.busy - 1); G.camTarget = null; G.fade = 0; }
    Save.touch();
}


/* ---------------------------------------------------------------- what he brings from the far islands
   Once he lives here: pumpkin and sweet corn seeds (Fortune's seed rack has them from then on, his move-in letter
   brings the first packet) and four recipes from the galley, taught a heart at a time like any neighbor's
   (RECIPE_FROM.scampi). The dishes' models are dishes.py's, the plants small_things.py's, the picked ones
   pocket_things.py's; their pictures are drawn here. */
const FAR_VEG = [['pumpkin', 'Pumpkin', 240, 90], ['corn', 'Sweet corn', 160, 70]];
for (const [id, name, price, seed] of FAR_VEG) {
    ITEMS[id] = { name, type: 'veg', price, icon: 'veg_' + id, far: true };
    ITEMS['seed_' + id] = { name: name + ' seeds', type: 'seed', price: seed, icon: 'seed_' + id, grows: id, far: true };
    if (!GD.veg.includes(id)) GD.veg.push(id);
}
const FAR_DISHES = [
    { id: 'sailor_stew', name: "Sailor's stew", price: 1800, need: { seabass: 1, carrot: 1, tomato: 1 }, spicy: 0 },
    { id: 'fish_tacos', name: 'Fish tacos', price: 1400, need: { mackerel: 1, flour: 1, tomato: 1 }, spicy: 0 },
    { id: 'pumpkin_soup', name: 'Pumpkin soup', price: 1200, need: { pumpkin: 1, cream: 1 }, spicy: 0 },
    { id: 'grilled_corn', name: 'Grilled corn', price: 700, need: { corn: 1, chili: 1 }, spicy: 1 },
];
for (const r of FAR_DISHES) {
    ITEMS[r.id] = { name: r.name, type: 'dish', price: r.price, icon: 'dish_' + r.id, spicy: r.spicy, far: true };
    if (!RECIPE[r.id]) { const q = Object.assign({ far: true }, r); RECIPES.push(q); RECIPE[r.id] = q; }
}
RECIPE_FROM.scampi = FAR_DISHES.map(r => r.id);
Object.assign(COOK_PLANS, {
    sailor_stew: [ckCube('seabass'), ckChop('carrot'), ckChop('tomato'), 'stir', 'simmer'],
    fish_tacos: ['knead', ckHeat('grill', 'Grill the fish', 'mackerel', [0.52, 0.74]), ckChop('tomato'), ckAs('shape', 'Fold the tacos', { v: 'fold' })],
    pumpkin_soup: [ckCube('pumpkin'), 'simmer', ckAs('stir', 'Stir it smooth'), ckPour('cream', 'Swirl in the cream')],
    grilled_corn: [ckHeat('grill', 'Grill the corn', 'corn', [0.52, 0.74]), ckChop('chili', 'Mince the chili', 4), ckTop('chili', 'Sprinkle the chili', 3, '#f6d040')],
});
/* the far islands' things only turn up once he's brought them (Fortune's seeds, Mac's menu, the community garden) */
function farOk(id) { return !(ITEMS[id] && ITEMS[id].far) || seafarerHere(); }

/* their pictures, pixel by pixel (16 by 16, the atlas's outline color) */
const FAR_ICONS = {
    veg_pumpkin: [{ a: '#2d2230', b: '#4f9a3f', c: '#f28a2a', d: '#d0661e', e: '#b04e16', f: '#ffb466', g: '#3a7a30' }, [
        '................',
        '................',
        '........aa......',
        '.......abga.....',
        '....aaaabaaaa...',
        '...acfcdccdcca..',
        '..acffcdccdccda.',
        '..acfcdccdcccda.',
        '.acfccdccdcccdca',
        '.accccdccdcccdca',
        '.accccdccdcccdca',
        '..aeccdccdccdea.',
        '..aeeedeedeeeea.',
        '...aaeeeeeeeaa..',
        '.....aaaaaaa....',
        '................']],
    veg_corn: [{ a: '#2d2230', b: '#6cc063', c: '#f6d040', d: '#d8a020', e: '#4f9a3f', f: '#fff0a0', g: '#c8a060' }, [
        '..........aa....',
        '.........agga...',
        '........acfca...',
        '.......acfcdca..',
        '......acfcdcda..',
        '.....acfcdcdca..',
        '....acfcdcdca...',
        '...abcdcdcdca...',
        '..abbcdcdcda....',
        '..abebcdcca.....',
        '.abebebcca......',
        '.abebebba.......',
        'abebebba........',
        'abebbaa.........',
        '.aaaa...........',
        '................']],
    dish_sailor_stew: [{ a: '#2d2230', b: '#a8642e', c: '#f28a2a', d: '#f7ecd6', e: '#ffffff', f: '#3f6a8a', g: '#6cc063', h: '#c88048' }, [
        '................',
        '................',
        '................',
        '................',
        '................',
        '...aaaaaaaaaa...',
        '..abhcbbdbgbba..',
        '.abccbhdddbbcba.',
        'aeebbgbbdbhbbeea',
        '.aeeeeeeeeeeeea.',
        '.aeffffffffffea.',
        '..aeeeeeeeeeea..',
        '..aeeeeeeeeeea..',
        '...aeeeeeeeea...',
        '....aaaaaaaa....',
        '................']],
    dish_pumpkin_soup: [{ a: '#2d2230', b: '#e8c878', c: '#f2a03a', d: '#ffd090', e: '#fff7f1', f: '#6cc063', g: '#e8603e', h: '#f7ecd6' }, [
        '................',
        '................',
        '............aa..',
        '...........abba.',
        '...........abba.',
        '...aaaaaaaaabba.',
        '..acccccccccca..',
        '.acccdhhhdcccca.',
        'aeecccfcdhfccea.',
        '.aeeeeeeeeeeeea.',
        '.aeggggggggggea.',
        '..aeeeeeeeeeea..',
        '..aeeeeeeeeeea..',
        '...aeeeeeeeea...',
        '....aaaaaaaa....',
        '................']],
    dish_fish_tacos: [{ a: '#2d2230', b: '#6cc063', c: '#f0c060', d: '#e8403a', e: '#f7ecd6', f: '#c8902e', g: '#dcd4c4', h: '#f7f3ea', i: '#9ad84a' }, [
        '................',
        '................',
        '................',
        '................',
        '...aaaa..aaaa...',
        '..abdeba.abdeba.',
        '.acbedbcacbedbca',
        '.acccccfacccccfa',
        '..affffa.affffa.',
        '.aaaaaaaaaaaaaa.',
        'aghhhhhhhhhhiiga',
        'aghhhhhhhhhhhhga',
        '.agghhhhhhhhgga.',
        '..agggggggggga..',
        '...aaaaaaaaaa...',
        '................']],
    dish_grilled_corn: [{ a: '#2d2230', b: '#f6d040', c: '#d8a020', d: '#7a4a1e', e: '#6cc063', g: '#dcd4c4', h: '#f7f3ea', f: '#e8403a' }, [
        '................',
        '................',
        '................',
        '................',
        '................',
        '...aaaaaaaaaa...',
        '.eabcbdbcbdbca..',
        'eeabcbdbcbdbcba.',
        '.eacbdbcbdbcbfa.',
        '..aaaaaaaaaaaa..',
        'aghhhhhhhhhhhhga',
        'aghhhhhhhhhhhhga',
        '.agghhhhhhhhgga.',
        '..agggggggggga..',
        '...aaaaaaaaaa...',
        '................']],
    seed_pumpkin: [{ a: '#2d2230', b: '#d9b88a', c: '#efd9b0', d: '#f28a2a', e: '#ffd0a0', f: '#c9a47a', g: '#4f9a3f', h: '#c8601a' }, [
        '................',
        '...aaaaaaaaaa...',
        '..abbbbbbbbbba..',
        '..abbbbbbbbbba..',
        '..acccccccccca..',
        '..acccccgcccca..',
        '..acccddgdccca..',
        '..accdhddhddca..',
        '..accdhedhddca..',
        '..accdhddhddca..',
        '..accdhddhddca..',
        '..acccddddccca..',
        '..acccccccccca..',
        '..acffffffffca..',
        '..acccccccccca..',
        '...aaaaaaaaaa...']],
    seed_corn: [{ a: '#2d2230', b: '#d9b88a', c: '#efd9b0', d: '#f6d040', e: '#fff0a0', f: '#c9a47a', g: '#6cc063', h: '#d8a020' }, [
        '................',
        '...aaaaaaaaaa...',
        '..abbbbbbbbbba..',
        '..abbbbbbbbbba..',
        '..acccccccccca..',
        '..accccddcccca..',
        '..acccdhdhccca..',
        '..accgdedhgcca..',
        '..accgdhdhgcca..',
        '..acccgdhggcca..',
        '..accccgggccca..',
        '..acccccgcccca..',
        '..acccccccccca..',
        '..acffffffffca..',
        '..acccccccccca..',
        '...aaaaaaaaaa...']],
};

/* ---------------------------------------------------------------- his pictures in the flat views */
ASSET_MAKERS.push(() => {
    const make = (name, w, h, ax, ay, fn) => {
        if (Assets.frames[name] || Assets.dyn[name]) return;
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const g = c.getContext('2d');
        fn((col, x, y, ww, hh) => { g.fillStyle = col; g.fillRect(x, y, ww, hh); });
        Assets.dyn[name] = { c, w, h, ax, ay };
    };
    for (const k of [0, 1]) make('scampi_' + k, 16, 18, 8, 17, R => {
        const s = k ? 1 : 0;
        R('#c8543a', 4, 16, 3, 2); R('#c8543a', 9, 16, 3, 2);
        R('#f0784e', 3, 5 + s, 10, 11 - s); R('#ffb08a', 5, 11 + s, 6, 4 - s); R('#d8603a', 3, 9 + s, 10, 1); R('#d8603a', 3, 12 + s, 10, 1);
        R('#f8f4ea', 4, 10 + s, 8, 2); R('#2f6ad0', 3, 9 + s, 10, 1);
        R('#22305a', 3, 3 + s, 10, 2); R('#f6f2e6', 2, 1 + s, 12, 2); R('#1a1a20', 4, 5 + s, 8, 1); R('#e8b838', 7, 3 + s, 2, 1);
        R('#2a1a16', 5, 7 + s, 1, 1); R('#2a1a16', 10, 7 + s, 1, 1);
        R('#d8603a', 1, 0 + s, 1, 3); R('#d8603a', 14, 0 + s, 1, 3);
    });
    make('wreck', 40, 20, 20, 18, R => {
        R('#7a5230', 2, 10, 14, 3); R('#a8743e', 18, 13, 12, 3); R('#8a6a48', 8, 15, 10, 2); R('#c83a2e', 22, 6, 10, 4);
        R('#a8743e', 30, 9, 8, 8); R('#34343a', 30, 11, 8, 1); R('#34343a', 30, 15, 8, 1); R('#d8c08a', 4, 4, 6, 4);
    });
    make('ship_frame', 52, 26, 26, 24, R => {
        R('#7a5230', 6, 20, 6, 4); R('#7a5230', 22, 20, 6, 4); R('#7a5230', 38, 20, 6, 4); R('#a8743e', 4, 18, 44, 2);
        for (let x = 6; x < 46; x += 6) R('#c8945a', x, 6, 2, 12);
        R('#c8945a', 4, 12, 44, 2);
    });
    make('ship_scampi', 56, 48, 28, 46, R => {
        R('#3a6ab8', 4, 38, 48, 6); R('#f4efe2', 2, 32, 52, 6); R('#3a6ab8', 8, 44, 40, 2);
        R('#f4efe2', 6, 24, 14, 8); R('#a84a32', 5, 22, 16, 2); R('#a8743e', 32, 2, 2, 30);
        R('#c8382c', 18, 6, 14, 22); R('#f6f0e6', 22, 14, 6, 6); R('#f4c440', 34, 2, 6, 3);
    });
    for (const [name, [pal, rows]] of Object.entries(FAR_ICONS)) make(name, 16, 16, 8, 13, R => rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') R(pal[ch], x, y, 1, 1); })));
    /* at sea it's one of SeaSky's boats, drawn as <kind>_<frame> */
    Assets.dyn.ship_scampi_0 = Assets.dyn.ship_scampi_1 = Assets.dyn.ship_scampi;
});
