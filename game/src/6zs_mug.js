/* ---- 6zs_mug.js ---- */
/* Mugsy, the living mug who opens the coffee shop (David, 27 October late). Once Sarah has given the museum twenty
   things and the pottery hall is full of her own pots, Brulee writes to thank her, and at the museum tells of the dig
   the island had long ago: one piece of a very old pot was found, and the rest never were. From then on an X scratched
   in the ground turns up somewhere on the island each day (not dug that day, it's somewhere else the next), a piece
   under each: five in all. Brulee fetches Sully, who joins them with gold in the cracks: a giant mug, on show in the
   museum's hall for the day. The next day, the first time Sarah is out on the island, the mug comes bounding up: it was
   alive all along. It would like to stay and open the coffee shop on the alley's lot (the COMING SOON sign); the next
   morning Mugsy's is open and the mug lives on the plot by the farm lane (land_b). A coffee at the counter, or one to
   go, always perks Sarah up (Speedy). One of the Collection's secret neighbors.
   Kept as S.mug { stage, day, found, dug, visit, visited, free }; stage: 0 not yet, 1 Brulee's letter has come,
   2 digging, 3 all five found, 4 put together (day), 5 the visit, 6 said yes (day), 7 living here. */
const MUG_DONATED = 20, MUG_PIECES = 5;
ITEMS.mug_shard = { name: 'Old pottery piece', type: 'quest', price: 0, icon: 'mug_shard' };
/* the café's drinks: a snack each (the price is what Fortune pays; the café's own is CAFE_MENU's) */
const CAFE_MENU = [['latte', 'Latte', 300, 'drink_latte'], ['mocha', 'Mocha', 350, 'drink_mocha'], ['iced_coffee', 'Iced coffee', 280, 'drink_iced'], ['matcha_latte', 'Matcha latte', 380, 'drink_matcha']];
for (const [id, name, , icon] of CAFE_MENU) ITEMS[id] = { name, type: 'snack', price: 60, icon, coffee: true };
NPC_DEFS.mug = { name: 'Mugsy', sprite: 'mug', color: '#3a6aa8', voice: 520, wave: 'triangle', house: 'h_mug', h: 16, wake: 5.5, bed: 23, newcomer: true,
    fav: { plaza: 3, alley: 3, museumfront: 2, bench_museum: 2, garden: 1.5, board: 1.5, in_museum: 1, bench_e: 1 }, work: [['cafe', 6.8, 16.8]] };
HOUSE_BASE.h_mug = { wall: '#f6eedc', roof: '#3a8a8a', trim: '#7a4a30', door: '#3a6aa8', sig: 'plants' };
HOUSE_IDS.push('h_mug');
HOUSE_LAYOUT.mug = { wall: 'wall_cream', floor: 'floor_wood', items: [
    ['window_wall', 1, 'wall'], ['clock_wall', 4, 'wall'],
    ['shelf_book', 0, 0], ['bed_simple', 5, 0], ['table_wood', 2, 2], ['coffee_maker', 2, 2], ['chair_wood', 3, 2], ['rug_round', 3, 3], ['lamp_floor', 0, 4], ['plant_monstera', 6, 4]] };
ROOMS.h_mug = { w: 7, h: 5, wall: 'wall_cream', floor: 'floor_wood', music: 'house', owner: 'mug', layout: HOUSE_LAYOUT.mug.items, home: [3, 2, 2] };
ROOM_HOURS.cafe = [7, 17];
R3_VOL.cafe = { roof: 22 };          // (in HD-2D its picture stands up as walls and a roof, like the shops)
ROOMS.cafe = { w: 9, h: 6, wall: 'wall_cream', floor: 'floor_wood', music: 'shop', name: "Mugsy's", staff: 'mug', staffAt: [4, 0], staffStand: [4, 2], guest: [4, 3, 2],
    build: a => buildCafeRoom(a),
    closedSign: 'MUGSY\'S. Open {hours:cafe}. A note on the door: "Closed! I\'m asleep! (I\'m not asleep. I\'m at home vibrating quietly.) - Mugsy"' };
WORK_MENUS.mug = { room: 'cafe', label: 'Coffee, please!', fn: () => cafeMenu() };
TALK.mug = {
    intro: ["Hi again! It's me! The mug! Mugsy now, officially. I made a little name tag. It fell off. I don't have a front, exactly."],
    chat: [
        "Fun fact: I'm a mug. Not a cup. Cups are for tea. I'm for COFFEE. And for love. But mostly coffee.",
        "I was asleep for, like, three hundred years? In pieces? So if I talk fast it's because I have a LOT of catching up to do.",
        "Okay, don't be weird about it, but... is it strange that everyone here is food? Mac is macaroni. MACARONI. And he's so nice!",
        "I try not to stare at Ginger. She's a COOKIE, {name}. A cookie who builds houses! With a hammer!",
        "Sully says I'm 'wicked old.' I prefer 'vintage.' 'Antique,' if you're feeling fancy.",
        "The gold in my cracks? Sully says where you broke, you get to be golden. I think about that a lot.",
        "I drink my own coffee. Is that weird? It feels weird. It's delicious, though.",
        "Being caffeinated is my natural state. Being decaf is my nightmare. I had it once. In 1720. Never again.",
        "Fortune's a cookie with a message inside. I'm a mug with coffee inside. We're basically twins.",
        "Some nights I dream I'm back in the ground. Then I wake up and smell the beans and I'm like, nope, ALIVE, LET'S GO.",
        "Brulee says I'm 'priceless.' Fortune says I'm 'about forty sand dollars.' I'm choosing to believe Brulee.",
        "Clementine is an orange. A whole orange! With sunglasses! I didn't know fruit could be that cool. I'm a little jealous.",
    ],
    rain: ["Rain! Perfect latte weather. Every weather is latte weather, but especially this one."],
    night: ["It's late. I should sleep. I won't. I had four espressos. I'm going to count the stars. All of them."],
    winter: ["Cold out! Hold me. Not in a weird way. I'm WARM. I'm a mug. It's what I do."],
    loves: ['latte', 'mocha', 'iced_coffee', 'matcha_latte', 'cheesecake'], likes: ['dish', 'snack', 'staple', 'flower'], dislikes: ['boot'],
    loveLine: "FOR ME? Oh my gosh. Oh my GOSH. I'm going to be so jittery. Thank you, {name}!",
    likeLine: "Ooh, thank you! It's going on the shelf behind the counter where everyone can see it.",
    dislikeLine: "Oh. A... boot. I was buried for centuries next to stuff like this. Brings back memories. Muddy ones.",
    want: ['cocoa', 'sugar', 'cream', 'cherry'],
    letter: "Hi {name}!!\nI'm writing this at the counter between customers. (There was one customer. It was Joe. He ordered a poem. I made him a latte.)\nHere's something warm for you!\n- Mugsy",
    letterGift: 'latte',
};
defSpecial('friend_mug', 'friend', 'Mugsy', 'secret', 'The museum is missing something very old. Keep giving it things, and fill the pottery hall.', {});

function mugState() {
    if (!S.mug) S.mug = { stage: 0, found: 0 };
    return S.mug;
}
function mugStage() { return (S && S.mug && S.mug.stage) || 0; }
function mugHere() { return mugStage() >= 7; }
/* the museum has twenty things from Sarah and every pedestal in the pottery hall holds a pot of hers */
function mugReady() { const A = artState(); return (S.stats.donated || 0) >= MUG_DONATED && new Set(A.pots).size >= MUSEUM_PEDESTALS.length; }
function cafeLot() { return (W0.lots && W0.lots.cafe) || { x: 173, y: 93, w: 4, h: 3 }; }

/* each morning: Brulee's letter, the mug's visit due, the café open */
function mugTick() {
    if (!S || LAB || Online.visitor()) return;
    const Q = mugState(), day = Clock.dayNum();
    if (Q.stage === 0 && mugReady()) {
        Q.stage = 1;
        sendMail({ from: 'brulee', subject: 'Merci, merci, merci!', body: "Dear {name},\nThe museum has never looked so beautiful. Twenty gifts! And the pottery hall, every pedestal full. I walk through it each morning and I cry a little. Only a little.\nPlease, come and see me at the museum. There is something I have wanted to tell someone for a long time. Someone with an eye for pottery.\n- Brulee, Curator" });
    }
    else if (Q.stage === 4 && day > Q.day) { Q.stage = 5; Q.visit = null; }
    else if (Q.stage === 6 && day > Q.day) mugMoveIn();
    mugJoin();
    mugRefresh();
}
/* once it lives here: one of the neighbors, its house and its café on the island */
function mugJoin() {
    if (!mugHere()) return;
    if (!NEIGHBORS.includes('mug')) NEIGHBORS.push('mug');
    if (!VS_SKILL.mug) VS_SKILL.mug = 0.6;
    const l = W0.lots && W0.lots.land_b, c = cafeLot();
    if (l && !W0.buildings.h_mug) W0.buildings.h_mug = { x: l.x, y: l.y, w: 3, h: 3, door: 1, sprite: 'house_mug' };
    if (!W0.buildings.cafe) W0.buildings.cafe = { x: c.x, y: c.y, w: 4, h: 3, door: 2, sprite: 'cafe' };
}
/* the COMING SOON sign comes down once the café is up, and the plot's FOR SALE sign once the house is */
function cafeOpen() { return mugHere(); }
function mugLotTaken(x, y) {
    const l = W0.lots && W0.lots.land_b;
    return !!(l && mugHere() && x >= l.x && x < l.x + l.w && y >= l.y && y < l.y + l.h);
}
function mugMoveIn() {
    const Q = mugState();
    Q.stage = 7; Q.home = Clock.dayNum(); Q.free = true;
    mugJoin();
    townLog("Mugsy's, the island's coffee shop, opens on the alley. Its owner is a mug.");
    earnSpecial('friend_mug', 'A secret neighbor: Mugsy, the living mug, stayed!');
    sendMail({ from: 'mug', subject: "We're OPEN!!", body: "{name}!!!\nGinger finished the café at, like, 5 AM. She's a machine. A cookie machine.\nMugsy's is open! Come by for your first cup. It's on the house. Everything's on the house today. (Fortune says I can't do that every day. Fortune is no fun.)\nThank you for putting me back together.\n- Mugsy\n\nP.S. A little something to get you started.", gift: 'latte' });
    if (typeof rebuildIsland === 'function' && G.areas && G.areas.island) rebuildIsland();
    if (typeof NPCs !== 'undefined') { Plans.reset(); NPCs.place(true); }
}

/* ---------------------------------------------------------------- where it is */
function mugTarget(n, dh) {
    const st = mugStage(), Q = S.mug;
    if (st < 4 || st >= 7) return st >= 7 ? null : { key: 'mug-away', sleep: true };
    // on show in the museum's hall the day it's put together
    if (st === 4) { const [x, y] = toArea(8, 2); return { key: 'mug-show', area: 'museum', x: (x + 0.5) * TILE, y: (y + 0.6) * TILE, fixed: true, face: 'down' }; }
    const c = cafeLot(), lot = { key: 'mug-lot', area: 'island', x: (c.x + 2) * TILE, y: (c.y + c.h + 0.6) * TILE, fixed: true, face: 'down' };
    if (st === 5 && Q.visit) return { key: 'mug-visit', area: 'island', x: (Q.visit.x + 0.5) * TILE, y: (Q.visit.y + 0.5) * TILE + 4, fixed: true, face: Q.visit.face };
    if (st === 5 && !Q.visited) return { key: 'mug-away', sleep: true };
    const h = Clock.hourF();
    return h >= 6 && h < 22 ? lot : { key: 'mug-rest', sleep: true };
}

/* ---------------------------------------------------------------- the X in the ground */
/* where today's X is: a patch of open grass, from the island's seed and the day */
function mugSpot(day) {
    const a = G.areas && G.areas.island;
    if (!a) return null;
    // (open grass with no tree beside it or in the few tiles south of it, whose crown would hide the X from the camera)
    const trees = new Set(a.ents.filter(e => e.tx != null && (e.forest || e.kind === 'tree' || e.kind === 'young')).map(e => e.tx + ',' + e.ty));
    const clear = (x, y) => { for (let dy = -1; dy <= 3; dy++) for (let dx = -1; dx <= 1; dx++) if (trees.has((x + dx) + ',' + (y + dy))) return false; return true; };
    const grass = grassSpots(a).filter(([x, y]) => clear(x, y));
    if (!grass.length) return null;
    const r = mulberry(hash32(S.seed + ':mugx:' + day));
    const [x, y] = grass[Math.floor(r() * grass.length)];
    return { x, y };
}
/* the island's X for today, while there are pieces left to find (and not after today's is dug) */
function mugRefresh(a) {
    a = a || (G.areas && G.areas.island);
    if (!a || LAB || !S) return;
    const Q = S.mug, day = Clock.dayNum();
    const want = Q && Q.stage === 2 && Q.dug !== day ? mugSpot(day) : null;
    let e = a.ents.find(q => q.mugX);
    if (e && want && e.tx === want.x && e.ty === want.y) return;
    if (e) a.remove(e);
    if (want) addMugX(a, want.x, want.y);
}
function addMugX(a, tx, ty) {
    const [fx, fy] = tileFoot(tx, ty);
    const e = a.add({ kind: 'deco', mugX: true, digX: true, tx, ty, layer: 0, x: fx, y: fy - 3, decal: [36, 32, 18, 16] });
    e.hit = { x: tx * TILE, y: ty * TILE, w: TILE, h: TILE };
    e.draw = ctx => {
        // an X scratched in the grass, a little earth turned at its ends (the old diggers' mark), big enough to read from
        // the new look's low camera
        const x = Math.round(e.x), y = Math.round(e.y);
        ctx.fillStyle = 'rgba(150,112,70,0.6)';
        for (let i = -11; i <= 11; i++) { ctx.fillRect(x + i - 2, y + i * 0.8 - 2, 5, 5); ctx.fillRect(x + i - 2, y - i * 0.8 - 2, 5, 5); }
        ctx.fillStyle = 'rgba(74,44,22,0.95)';
        for (let i = -10; i <= 10; i++) { ctx.fillRect(x + i - 1, y + i * 0.8 - 1, 3, 3); ctx.fillRect(x + i - 1, y - i * 0.8 - 1, 3, 3); }
        ctx.fillStyle = 'rgba(170,128,80,0.9)';
        for (const [dx, dy] of [[-14, -10], [13, -11], [-14, 10], [13, 10], [-4, -12], [4, 12], [0, -4]]) ctx.fillRect(x + dx, y + dy, 3, 2);
    };
    e.interact = () => mugDig(a, e);
    return e;
}
async function mugDig(a, e) {
    if (heldTool() !== 'shovel') { await UI.say(null, 'An X, scratched into the ground. The old diggers\' mark, the one Brulee told you about. A shovel would help.'); return; }
    if (G.busy || visitorStop('dig')) return;
    const Q = mugState();
    G.busy++;
    try { await toolSwing('shovel', () => { Sfx.play('dig'); dirtFx(e.x, e.y - 2); }); } finally { G.busy--; }
    a.remove(e);
    Q.dug = Clock.dayNum();
    Q.found = (Q.found || 0) + 1;
    receive('mug_shard', 1);
    Sfx.play('fanfare');
    G.player.pose = 'cheer'; G.player.poseT = 50;
    if (Q.found >= MUG_PIECES) {
        Q.stage = 3;
        await UI.say(null, 'Another piece of very old pottery, cream with a blue band. That makes five! Brulee will want to see these.');
        townLog(`${S.playerName || 'Sarah'} finds the last piece of the museum's old pot.`);
    } else await UI.say(null, `A piece of very old pottery! Cream, with a blue band, and an edge that curls like a handle. That's ${Q.found} of ${MUG_PIECES}. (Another X will turn up tomorrow.)`);
    Save.touch();
}

/* ---------------------------------------------------------------- Brulee and Sully */
/* in Brulee's talk menu (50_talk.js) */
function mugOptions(n) {
    if (n.id !== 'brulee' || !S.mug || Online.visitor()) return [];
    const Q = S.mug, st = Q.stage, out = [];
    if (st === 1) out.push({ label: 'About your letter...', fn: async () => { await mugStory(); return true; } });
    if (st === 2) out.push({ label: 'The old pot?', fn: async () => { await UI.say('brulee', [`${Q.found || 0} of ${MUG_PIECES} pieces! Look for the X in the ground. One a day, somewhere new. Bring a shovel, ma chère.`], { keep: true }); return true; } });
    if (st === 3) out.push({ label: 'I found all five pieces!', fn: async () => { await mugMend(n); return true; } });
    return out;
}
async function mugStory() {
    const Q = mugState(), say = lines => UI.say('brulee', lines, { keep: true });
    await say(["Ah, {name}! You came. Your gifts, they have made this museum magnifique. And the pottery hall! Full! I told you, I cry a little. Every morning.",
        "Now. A secret. Long ago, before you came, there was a dig on this island. Archaeologists. Very serious hats.",
        "They found one piece of a very old pot. Cream, with a blue band. Beautiful. And then... nothing. They packed up and went home. The rest is still out there, somewhere.",
        "You have an eye for pottery. Would you look for the rest? Five pieces, I think. I hope not more.",
        "The old diggers scratched an X wherever they meant to dig. The island has moved them about since. One shows each day, somewhere new. Dig it up before tomorrow, or it wanders off!"]);
    if (!pocketCount('shovel')) await say(["No shovel? Fortune sells them. She will sell you anything, that one."]);
    Q.stage = 2; Q.found = Q.found || 0;
    mugRefresh();
    Save.touch();
}
function shardCount() { return pocketCount('mug_shard') + ((S.storage && S.storage.mug_shard) || 0); }
async function mugMend(n) {
    const Q = mugState(), b = s => UI.say('brulee', s, { keep: true });
    const sully = s => UI.say('sully', [].concat(s).map(l => (typeof bostonize === 'function' ? bostonize(l) : l)), { keep: true });
    if (G.area.id !== 'museum') { await b(["All five! Mon dieu! Bring them to the museum, and I will fetch someone who knows pots."]); return; }
    if (shardCount() < MUG_PIECES) { await b(["Five pieces? I only see " + shardCount() + ". Did one fall out of your pocket? Check your storage, ma chère."]); return; }
    await b(["All five! Mon dieu! We need an expert. A pottery person. Wait here."]);
    UI.hideDialog();
    G.busy++;
    try {
        for (let i = 1; i <= 10; i++) { G.fade = i / 10; await waitFrames(1); }
        let k = MUG_PIECES - removeItem('mug_shard', MUG_PIECES);
        if (k > 0 && S.storage && S.storage.mug_shard) { const t = Math.min(k, S.storage.mug_shard); S.storage.mug_shard -= t; if (!S.storage.mug_shard) delete S.storage.mug_shard; }
        Q.stage = 4; Q.day = Clock.dayNum();
        for (let i = 0; i < 30; i++) await waitFrames(1);
        for (let i = 9; i >= 0; i--) { G.fade = i / 10; await waitFrames(1); }
        G.fade = 0;
    } finally { G.busy = Math.max(0, G.busy - 1); G.fade = 0; }
    await sully(["Whaddaya got? ...Oh. Oh, these are OLD, kid. Wicked old.",
        "When a pot breaks, you don't hide it. You fill the cracks with gold. Makes it stronger. Makes it prettier, too. Gimme a minute."]);
    Sfx.play('item');
    await UI.say(null, 'Sully works quietly, piece by piece, a thin line of gold in every crack. Five pieces become one: a mug. A GIANT mug, nearly as tall as Sarah.', { keep: true });
    await b(["It is... a mug? Magnifique! It goes on show today, here in the hall. Tomorrow I will write a little card for it."]);
    await sully(["Funny thing. I coulda sworn it was warm when I picked it up. Eh. Must be the lights."]);
    townLog('Sully mends the museum\'s old pot with gold: a giant mug, on show in the hall.');
    Plans.reset(); NPCs.place(true);
    Save.touch();
}

/* ---------------------------------------------------------------- the visit, and the mug's own words */
/* every second or so (90_main.js): the day after it's mended, the first time Sarah is out on the island, the mug finds her */
function mugCheck() {
    const Q = S && S.mug;
    if (!Q || Q.stage !== 5 || Q.visited || Q.visiting || !uiIdle() || !G.area || G.area.id !== 'island' || Online.visitor()) return;
    mugVisit();
}
async function mugVisit() {
    const Q = mugState(), p = G.player, a = G.areas.island, n = NPCs.get('mug');
    if (!n || !a) return;
    Q.visiting = true;
    try {
        const sx = Math.floor(p.x / TILE), sy = Math.floor((p.y - 2) / TILE);
        // it comes bounding up from a few tiles off, and stops beside her
        const near = [[1, 0, 'left'], [-1, 0, 'right'], [0, 1, 'up'], [0, -1, 'down']].find(([dx, dy]) => !a.blockedAt(sx + dx, sy + dy));
        if (!near) return;
        let from = null;
        for (let r = 6; r >= 3 && !from; r--) for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r], [r, r], [-r, r]]) if (!a.blockedAt(sx + dx, sy + dy) && findPath(a, sx + dx, sy + dy, sx + near[0], sy + near[1], 4000)) { from = [sx + dx, sy + dy]; break; }
        if (!from) from = [sx + near[0], sy + near[1]];
        n.area = 'island'; n.sleeping = false; n.path = null; n.moving = false;
        n.x = (from[0] + 0.5) * TILE; n.y = (from[1] + 0.5) * TILE + 4;
        Q.visit = { x: sx + near[0], y: sy + near[1], face: near[2] };
        G.busy++;
        try {
            await UI.say(null, 'A giant mug comes bounding up, slopping a little coffee with every hop.');
            for (let i = 0; i < 360 && Math.hypot(n.x - (Q.visit.x + 0.5) * TILE, n.y - (Q.visit.y + 0.5) * TILE - 4) > TILE * 0.6; i++) await waitFrames(1);
            n.x = (Q.visit.x + 0.5) * TILE; n.y = (Q.visit.y + 0.5) * TILE + 4; n.path = null; n.moving = false;
            n.dir = near[2]; n.flip = near[2] === 'left';
            p.dir = n.x > p.x + 2 ? 'right' : n.x < p.x - 2 ? 'left' : n.y > p.y ? 'down' : 'up';
        } finally { G.busy = Math.max(0, G.busy - 1); }
        rel('mug').met = true;
        const say = lines => UI.say('mug', lines, { keep: true });
        await say(["THERE you are! Hi! Hello! It's me! The mug! From the museum!",
            "Okay so, funny story. I wasn't just a mug. I was a LIVING mug. The whole time. In pieces, under the ground, for, like, centuries. Very boring. Zero stars.",
            "And then YOU dug me up! Piece by piece! And Sully put me back together with GOLD. I'm golden now! Look at me!",
            "Thank you. Really. You put me back together. Nobody's ever done anything that nice for a mug.",
            "Also, can I say, and I mean this with love: why is everyone here FOOD? I saw a cookie carrying a ladder this morning. A COOKIE.",
            "Sorry. I have so much energy. Like, SO much. I think it's the coffee. I'm always full of coffee. Occupational hazard."]);
        await mugAsk(n);
        Q.visited = true;
    } finally { Q.visiting = false; Q.visit = null; Save.touch(); Plans.reset(); }
}
async function mugAsk(n) {
    const Q = mugState();
    const k = await UI.ask('mug', "So... there's a little lot by the alley with a COMING SOON sign. What if what's coming soon... is a coffee shop? Run by a mug? Could I stay?", ['Yes! Stay!', 'Let me think'], { keep: true });
    if (k === 0) {
        await UI.say('mug', ["YESSS! Okay! I'll talk to Ginger! She can build it by tomorrow, I just know it. A cookie with a hammer. Unstoppable.",
            "Mugsy's. That's what I'll call it. Come by tomorrow for your first cup. On the house!"]);
        Q.stage = 6; Q.day = Clock.dayNum();
        n.emote = 'heart'; n.emoteT = 90;
    } else await UI.say('mug', ["Totally fair! Big decision! I'll be by the lot, vibrating gently, if you change your mind."]);
    Save.touch();
}
/* talking to the mug before it lives here (50_talk.js); false once it does */
async function mugTalk(n) {
    const Q = mugState(), st = Q.stage;
    if (st >= 7) return false;
    if (st === 4) { await UI.say(null, rpick(['A giant mug, mended with gold, on show in the hall. It\'s warm to the touch. Is it... humming?', 'The museum\'s new treasure: a giant mug with golden seams. For a second Sarah could swear it winked.'])); return true; }
    if (st === 5) { await UI.say('mug', ["You're back! Have you thought about it? The coffee shop?"], { keep: true }); await mugAsk(n); return true; }
    if (st === 6) { await UI.say('mug', [rpick(["Tomorrow! I'm so excited I could boil. Can mugs boil? I'm going to find out.", "Ginger measured me for the counter. I'm the perfect height. I'm always the perfect height."])]); return true; }
    return true;
}

/* ---------------------------------------------------------------- the café */
function buildCafeRoom(a) {
    const items = layoutItems([
        ['window_wall', 1, 'wall'], ['menu_board', 3, 'wall'], ['clock_wall', 6, 'wall'], ['window_wall', 8, 'wall'],
        ['shelf_book', 0, 0], ['counter_diner', 3, 1], ['coffee_maker', 3, 1], ['cake_stand', 4, 1], ['register', 5, 1], ['cheesecake_case', 7, 0],
        ['macaron_stool', 0, 3], ['cafe_table', 1, 3], ['macaron_stool', 2, 3], ['macaron_stool', 6, 3], ['cafe_table', 7, 3], ['macaron_stool', 8, 3],
        ['plant_monstera', 0, 5], ['plant_monstera', 8, 5]]);
    items.forEach(it => {
        if (it.id === 'counter_diner' || it.id === 'register' || it.id === 'coffee_maker') it.use = 'counter';
        else if (it.id === 'menu_board') it.use = () => UI.say(null, `The menu, in curly chalk: ${CAFE_MENU.map(([, name, price]) => `${name} ${fmtNum(price)}`).join(' · ')}. At the bottom: "Every cup perks you up! (Mugs too.)"`);
        else if (it.id === 'cheesecake_case') it.use = () => UI.say(null, 'A glass case of cheesecakes from Cece. A little sign: "Pairs well with coffee. Everything pairs well with coffee."');
        else if (it.id === 'cafe_table') it.use = () => UI.say(null, rpick(['A little round table. Someone left a doodle of a mug on a napkin. The mug in the doodle is smiling.', 'Sarah sits for a moment. The café smells like toast and coffee and something golden.']));
        else if (it.id === 'shelf_book') it.use = () => UI.say(null, 'Books to borrow: "Beans: A Love Story," "So You Were Buried For Centuries," and a very thin one called "Decaf (Why?)".');
    });
    a.items = items;
    placeFurniture(a, items);
}
async function cafeMenu() {
    const Q = mugState(), m = NPCs.get('mug'), here = m && !m.sleeping && m.area === 'cafe' ? 'mug' : null;
    const free = !!Q.free;
    const opts = CAFE_MENU.map(([, name, price]) => `${name} · ${free ? 'free!' : fmtNum(price)}`).concat(['Never mind']);
    const k = await UI.ask(here, here ? (free ? "Your first cup's on the house! What'll it be?" : rpick(['What can I get you?', "Welcome to Mugsy's! What'll it be?", "The usual? I don't know what your usual is yet. Let's find out!"])) : 'The counter. A jar says "TIPS (and also payment)". Nobody is here, so it\'s the honor system.', opts, { keep: true });
    if (k < 0 || k >= CAFE_MENU.length) { if (here) await UI.say('mug', rpick(['Come back soon! The coffee misses you already.', 'Bye! Stay warm!'])); return; }
    const [id, name, price] = CAFE_MENU[k];
    if (!free && S.money < price) { await UI.say(here, here ? "Oh no, you're a little short! That's okay. Water's free. It's boring, but it's free." : 'Not enough sand dollars for that.'); return; }
    const w = await UI.ask(here, here ? `One ${name.toLowerCase()}! For here or to go?` : 'For here or to go?', ['For here', 'To go'], { keep: true });
    if (!free) addMoney(-price, true, 'Shopping');
    Q.free = false;
    Sfx.play('item');
    if (w === 1) { addItem(id, 1); if (here) await UI.say('mug', 'There you go! Careful, it\'s hot. Well. Warm. Okay, it\'s pleasantly warm.'); Save.touch(); return; }
    const p = G.player;
    p.pose = 'happy'; p.poseT = 50;
    Sfx.play('eat');
    S.stats.coffees = (S.stats.coffees || 0) + 1;
    coffeeBoost();
    if (here) await UI.say('mug', rpick(["How is it? Don't answer. I can tell. It's GREAT.", "Feel that? That's the zoomies. You've got the zoomies now.", 'Perfect! Now go do eleven things at once.']));
    Save.touch();
}
/* a coffee always perks Sarah up (6q_world.js's Speedy) */
function coffeeBoost() {
    S.bonus = { id: 'speed', until: Date.now() + BONUS_MS, lucky: 0 };
    Sfx.play('levelup');
    G.player.emote = 'sparkle'; G.player.emoteT = 80;
    UI.toast('Caffeinated! Sarah walks and runs faster for a while.', BONUSES.speed.icon);
    HUD.bonus();
}

/* ---------------------------------------------------------------- pictures in the flat views */
const MUG_ICONS = {
    mug_shard: [{ a: '#2d2230', b: '#f6eedc', c: '#e0d4bc', d: '#3a6aa8', e: '#c8b898' }, [
        '................',
        '................',
        '................',
        '.....aaaa.......',
        '....abbbbaa.....',
        '...abbbbbbba....',
        '...abbbbbbbba...',
        '..abddddddddba..',
        '..addddddddda...',
        '..abbbbbbbbba...',
        '...abbbccbba....',
        '...abcceeca.....',
        '....acceea......',
        '.....aaaa.......',
        '................',
        '................']],
    drink_latte: [{ a: '#2d2230', b: '#f6eedc', c: '#c8945a', d: '#f6ead8', e: '#3a6aa8', f: '#fbf8f2', g: '#d8d0c0' }, [
        '................',
        '................',
        '................',
        '................',
        '...aaaaaaaaa....',
        '..adddcddddda...',
        '..abdcccddba.aa.',
        '..abbbbbbbbaa.a.',
        '..aeeeeeeeeba.a.',
        '..abbbbbbbbaaa..',
        '...abbbbbbba....',
        '.aaaaaaaaaaaaa..',
        'agffffffffffffa.',
        '.aaaaaaaaaaaaa..',
        '................',
        '................']],
    drink_mocha: [{ a: '#2d2230', b: '#f6eedc', c: '#5a3020', d: '#fbf6ee', e: '#7a4a30', f: '#fbf8f2', g: '#d8d0c0' }, [
        '................',
        '.....aaa........',
        '....adcda.......',
        '...adddcda......',
        '..adcdddddaa....',
        '..addddcdddda...',
        '..abbbbbbbba.aa.',
        '..abbbbbbbbaa.a.',
        '..aeeeeeeeeba.a.',
        '..abbbbbbbbaaa..',
        '...abbbbbbba....',
        '.aaaaaaaaaaaaa..',
        'agffffffffffffa.',
        '.aaaaaaaaaaaaa..',
        '................',
        '................']],
    drink_iced: [{ a: '#2d2230', b: '#e8d4b8', c: '#8a5a34', d: '#f4fbff', e: '#e8403a', f: '#ffffff', g: '#d8eef4' }, [
        '.........ae.....',
        '.........af.....',
        '....aaaaaeaa....',
        '...agddgdfdga...',
        '...abdbbdbbba...',
        '...abbbbbbbba...',
        '...abbbcbbbba...',
        '...abbcccbbba...',
        '...acccbcccca...',
        '...acccccccca...',
        '...acccccccca...',
        '...acccccccca...',
        '...agggggggga...',
        '....aaaaaaaa....',
        '................',
        '................']],
    drink_matcha: [{ a: '#2d2230', b: '#f6eedc', c: '#6aa040', d: '#e8f4d8', e: '#3a8a8a', f: '#fbf8f2', g: '#d8d0c0' }, [
        '................',
        '................',
        '................',
        '................',
        '...aaaaaaaaa....',
        '..adddcddddda...',
        '..abdcccddba.aa.',
        '..abbbbbbbbaa.a.',
        '..aeeeeeeeeba.a.',
        '..abbbbbbbbaaa..',
        '...abbbbbbba....',
        '.aaaaaaaaaaaaa..',
        'agffffffffffffa.',
        '.aaaaaaaaaaaaa..',
        '................',
        '................']],
};
ASSET_MAKERS.push(() => {
    const make = (name, w, h, ax, ay, fn) => {
        if (Assets.frames[name] || Assets.dyn[name]) return;
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const g = c.getContext('2d');
        fn((col, x, y, ww, hh) => { g.fillStyle = col; g.fillRect(x, y, ww, hh); }, g);
        Assets.dyn[name] = { c, w, h, ax, ay };
    };
    for (const [name, [pal, rows]] of Object.entries(MUG_ICONS)) make(name, 16, 16, 8, 13, R => rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') R(pal[ch], x, y, 1, 1); })));
    // the mug, hopping (two frames): cream, a blue band, gold seams, a handle on its right
    for (const k of [0, 1]) make('mug_' + k, 16, 18, 8, 17, R => {
        const s = k ? 1 : 0;
        R('#7a5a3a', 4, 16, 3, 2); R('#7a5a3a', 9, 16, 3, 2);
        R('#2d2230', 2, 2 + s, 11, 14 - s); R('#f6eedc', 3, 3 + s, 9, 12 - s); R('#6a3a1e', 3, 3 + s, 9, 2);
        R('#3a6aa8', 3, 10 + s, 9, 2); R('#e8c048', 5, 6 + s, 1, 4); R('#e8c048', 9, 12 + s, 2, 1);
        R('#2d2230', 13, 6 + s, 2, 6); R('#f6eedc', 13, 7 + s, 1, 4);
        R('#2a1a16', 5, 7 + s, 1, 2); R('#2a1a16', 9, 7 + s, 1, 2); R('#e8889a', 4, 9 + s, 1, 1); R('#e8889a', 10, 9 + s, 1, 1);
    });
    // the café (a 4-wide building, as the shops' pictures)
    make('cafe', 64, 60, 32, 57, R => {
        R('#2d2230', 3, 22, 58, 36); R('#f6ecd8', 4, 23, 56, 34);
        for (let i = 0; i < 24; i++) R(i % 2 ? '#8a5432' : '#7a4a30', 32 - 30 + i, 22 - i, 60 - i * 2, 1);
        R('#2d2230', 2, 21, 60, 2);
        R('#fbf6ec', 26, 8, 12, 8); R('#3a6aa8', 26, 12, 12, 2); R('#6a3a1e', 27, 8, 10, 2); R('#fbf6ec', 38, 10, 3, 4);
        R('#ffffff', 31, 3, 1, 4); R('#ffffff', 33, 1, 1, 4);
        for (let x = 4; x < 60; x += 4) { R(x % 8 ? '#f6eedc' : '#7a4a30', x, 30, 4, 6); }
        R('#3a8a8a', 22, 26, 20, 5); R('#fff8ec', 24, 27, 16, 3);
        R('#2d2230', 36, 38, 10, 19); R('#3a8a8a', 37, 39, 8, 18); R('#ffe8b0', 38, 41, 6, 5);
        R('#2d2230', 9, 39, 16, 12); R('#ffe8b0', 10, 40, 14, 10); R('#fbf6ec', 16, 40, 2, 10); R('#fbf6ec', 10, 44, 14, 2);
        R('#8a5a34', 9, 51, 16, 3); R('#5aa846', 10, 50, 3, 2); R('#f6c8d8', 14, 50, 2, 1); R('#5aa846', 19, 50, 4, 2);
        R('#2e3634', 50, 46, 7, 9); R('#f4f0e6', 51, 48, 5, 1); R('#f4f0e6', 51, 51, 4, 1);
    });
});
