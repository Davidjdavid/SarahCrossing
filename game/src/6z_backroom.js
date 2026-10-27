/* ---- 6z_backroom.js ---- */
/* The arcade's back room: a locked STAFF ONLY door between two cabinets. Behind it, the island's very first arcade,
   with four old cabinets (Fruit Catch, Gopher Garden, Surf's Up, Noodle Slurp: the classics; Dumpling Drop, Sushi Swap
   and Fortune Falls are out front, David's swap of 27 October). A hidden mystery, for later in the game: once
   Sarah has played every cabinet out front and has been on the island two weeks, Chili admits it isn't "just
   storage". Sully remembers the key went to the lighthouse keeper, who kept everything. */
const BACK_CABS = ['fruit', 'garden', 'surf', 'noodle'];
const BACK_READY_DAYS = 14;
const BACK_DOOR = [11, 0];                 // the arcade's floor tile in front of the door (between two cabinets)

/* the games you can play right now (the old ones once the door is open) */
function arcadeCabs() { return ARCADE_CABS.concat(backRoomOpen() ? BACK_CABS.filter(id => ARCADE_GAMES[id]) : []); }
function backRoomOpen() {
    if (Quests.done('backroom')) return true;
    // a visitor walks through once Sarah has opened it
    const I = Online.visitor() && Online.island;
    return !!(I && I.quests && I.quests.backroom && I.quests.backroom.done);
}
/* the mystery only starts once Sarah is an arcade regular */
function backRoomReady() {
    const A = arc();
    return daysPlayed() >= BACK_READY_DAYS && ARCADE_CABS.every(id => (A.plays[id] || 0) > 0);
}

/* ---------------------------------------------------------------- the mystery */
QUEST_IDS.push('backroom');
QUEST_INFO.backroom = { title: 'The locked door', icon: 'ic_lost_keys' };
QUEST_RUMORS.backroom = ["Chili keeps looking at that STAFF ONLY door at the back of the arcade. He says it's just storage. He says it way too fast.",
    'Sully says the arcade used to be something else, a long time ago. Before Chili. Before the carpet.',
    'I heard music coming from behind the locked door in the arcade once. Old music. Bleepy. Probably nothing! Probably a ghost!'];
QUEST_ITEM_DESC.q_arcadekey = 'A small brass key on a ring shaped like a joystick. It says "BACK ROOM" on a paper tag.';
ITEMS.q_arcadekey = { name: 'Old arcade key', type: 'quest', price: 0, icon: 'ic_lost_keys' };
QUEST_GUIDE.backroom = ['The locked door', `1. Play every cabinet in the arcade at least once, and be on the island for ${BACK_READY_DAYS} days.\n2. Ask Chili, at the arcade, about the STAFF ONLY door at the back.\n3. Ask Sully about the back room: he gave the key to the old lighthouse keeper.\n4. Search the keeper's desk in the lighthouse.\n5. Open the door with the key.\nReward: the back room, with four classic cabinets: Fruit Catch, Gopher Garden, Surf's Up and Noodle Slurp.`];
function backHint(s) {
    return s === 3 ? 'You found the old arcade key. Try it on the STAFF ONLY door at the back of the arcade.'
        : s === 2 ? 'Sully gave the back-room key to the old lighthouse keeper, who kept everything. Search the lighthouse.'
            : s === 1 ? 'Chili says Sully has been on the island the longest. Ask Sully about the back room.'
                : "A rumor: there's a locked STAFF ONLY door at the back of the arcade. Ask Chili about it.";
}
const BACK_DONE = 'The back room is open: the island\'s first arcade, four classic cabinets, good as new.';
/* what Chili says at the counter: the back room's classics too, once it's open */
function chiliLines() { return backRoomOpen() ? CHILI_ARCADE.concat(CHILI_BACK) : CHILI_ARCADE; }
CHILI_ARCADE.push(
    'Three new cabinets out front! Dumpling Drop, Sushi Swap, Fortune Falls. I tested every one. For safety. For hours.',
    "Fortune Falls is Fortune's idea. The pegs light up when you hit them. I'm not saying the orange pegs are me. The orange pegs are me.");
/* talk menu entries: Chili and Sully */
function backOptions(n) {
    const out = [], s = Quests.stage('backroom');
    if (Quests.done('backroom') || Online.visitor()) return out;
    if (n.id === 'chili' && s === 0 && backRoomReady() && n.area === 'arcade') out.push({ label: 'What\'s behind the STAFF ONLY door?', fn: async () => {
        Quests.heard('backroom');
        await UI.say('chili', ["The door? It's storage. Boxes. Very boring boxes. Nothing in there is hot. Nothing. At all.",
            "...Okay, fine. I've never been in there. It was locked when I got here. There's no key. I've looked. A LOT.",
            "Sully's been on this island longer than anybody. Longer than the carpet. Ask him."], { keep: true });
        Quests.set('backroom', 1);
        return true;
    } });
    if (n.id === 'sully' && s === 1) out.push({ label: "About the arcade's back room...", fn: async () => {
        await UI.say('sully', ["The back room? Kid. That was the first arcade on this island. Four cabinets and a jukebox. Nineteen-eighty-somethin'.",
            'When they built the new place out front, the old machines went in the back and somebody locked the door. Me. I locked the door.',
            "I gave the key to the lighthouse keeper for safekeepin'. That guy kept everything. Logbooks, boots, a whole sandwich. Check his desk."], { keep: true });
        Quests.set('backroom', 2);
        return true;
    } });
    return out;
}
/* the keeper's desk (lighthouse): the key is in a drawer */
async function backKeyHunt() {
    if (Quests.stage('backroom') !== 2 || Quests.done('backroom') || Online.visitor()) return false;
    Sfx.play('item');
    await UI.say(null, ['Sarah opens the drawers of the keeper\'s desk. Logbooks. Pencils. A very old cracker.',
        'In the bottom drawer, under a stack of tide tables: a small brass key on a joystick key ring. The paper tag says "BACK ROOM. - S."']);
    receive('q_arcadekey', 1);
    Quests.set('backroom', 3);
    UI.toast('Found the old arcade key', 'ic_lost_keys');
    return true;
}

/* ---------------------------------------------------------------- the door, out in the arcade */
function addBackDoor(a) {
    const [x, y] = toArea(BACK_DOOR[0], -1);                // the wall above that floor tile
    const e = a.add({ kind: 'deco', x: (x + 0.5) * TILE, y: (y + 1) * TILE + 1 });
    e.draw = ctx => {
        const dx = x * TILE + 2, dy = y * TILE - 8, open = backRoomOpen();
        ctx.fillStyle = '#3b2a45'; ctx.fillRect(dx - 1, dy - 1, TILE - 2, 24);
        ctx.fillStyle = open ? '#7a5a8a' : '#5a4060'; ctx.fillRect(dx, dy, TILE - 4, 23);
        ctx.fillStyle = open ? '#8e6ca0' : '#6a4c72'; ctx.fillRect(dx + 1, dy + 1, TILE - 6, 9); ctx.fillRect(dx + 1, dy + 12, TILE - 6, 10);
        ctx.fillStyle = '#ffd84a'; ctx.fillRect(dx + TILE - 8, dy + 12, 2, 2);
        // the sign
        ctx.fillStyle = '#f2e6c8'; ctx.fillRect(dx + 1, dy + 3, TILE - 6, 5);
        ctx.fillStyle = '#c0283a'; ctx.fillRect(dx + 2, dy + 5, TILE - 8, 1);
        if (!open && Quests.stage('backroom') === 3 && Math.floor(G.t / 20) % 2) { ctx.fillStyle = '#ffffff'; ctx.fillRect(dx + TILE - 9, dy + 10, 1, 1); }
    };
    e.look3d = { backdoor: true };
    e.hit = { x: x * TILE, y: y * TILE - 8, w: TILE, h: TILE + 10 };
    e.interact = () => backDoor();
    return e;
}
async function backDoor() {
    if (backRoomOpen()) { Sfx.play('door'); await goRoom('arcade_back', [4, 3], 'up'); return; }
    if (Quests.stage('backroom') === 3 && pocketCount('q_arcadekey')) {
        G.busy++;
        try {
            Sfx.play('door');
            await UI.say(null, ['Sarah turns the old key. It sticks... then CLICK.', 'The door creaks open. Dust. A smell like 1987. And four shapes under sheets.']);
            removeItem('q_arcadekey', 1);
            Quests.finish('backroom');
            const c = NPCs.get('chili');
            if (c && !c.sleeping && c.area === 'arcade') { c.emote = 'sparkle'; c.emoteT = 120; await UI.say('chili', ["WAIT. You opened it?! What's in there? Is it hot? Tell me it's hot.", "Those are... the CLASSICS. Fruit Catch! Gopher Garden! Surf's Up! Noodle Slurp! I thought those were legends!"]); }
        } finally { G.busy--; }
        await goRoom('arcade_back', [4, 3], 'up');
        return;
    }
    const sp = chiliVoice();
    await UI.say(sp, sp ? rpick(["That's just storage! Old boxes! Nothing to see! Play a game! Please!", "STAFF ONLY. I'm staff. I don't go in there either. Nobody does. It's fine."])
        : 'A door marked STAFF ONLY. It is locked. Behind it, very faintly: nothing. Probably nothing.');
}

/* ---------------------------------------------------------------- the back room itself */
ROOMS.arcade_back = { w: 9, h: 5, wall: 'wall_brick', floor: 'floor_boards', music: 'arcade', name: 'The back room', exitTo: 'arcade', exitAt: BACK_DOOR,
    building: 'arcade', build: a => buildBackRoom(a) };
function buildBackRoom(a) {
    const items = layoutItems([
        ['clock_wall', 2, 'wall'], ['neon_sign', 3, 'wall'], ['shelf_wall', 5, 'wall'],
        // (the four old cabinets in pairs either side, as they were pushed back to make room)
        ['cab_fruit', 0, 0], ['cab_garden', 1, 0], ['cab_surf', 7, 0], ['cab_noodle', 8, 0], ['toolbox', 6, 0],
        ['lamp_floor', 0, 3], ['sofa_pink', 1, 3], ['rug_round', 3, 2]]);
    const use = {
        cab_fruit: () => backCab('fruit'), cab_garden: () => backCab('garden'), cab_surf: () => backCab('surf'), cab_noodle: () => backCab('noodle'),
        neon_sign: () => UI.say(null, 'An old neon sign that says DANCE. Sully says there was dancing in here too, back in 1987, in front of the cabinets. The "N" is very tired.'),
        clock_wall: () => UI.say(null, 'The clock stopped at 4:20. Nobody knows which day. Or which year.'),
        shelf_wall: () => UI.say(null, 'Spare joysticks, a jar of very old tokens, and a high score list in pencil. The top name is "SULLY".'),
        sofa_pink: () => UI.say(null, 'A pink couch with a dent where someone sat watching the games for a very long time.'),
        toolbox: () => UI.say(null, "Ginger's old toolbox. A note inside: \"If you're reading this, the machines are fixed. You're welcome. - G\""),
    };
    items.forEach(it => { if (use[it.id]) it.use = use[it.id]; });
    a.items = items;
    placeFurniture(a, items);
    // boxes stacked in the corner
    for (const [fx, fy] of [[7, 3], [8, 3], [8, 2]]) {
        const [x, y] = toArea(fx, fy);
        const e = a.add({ kind: 'deco', x: (x + 0.5) * TILE, y: (y + 1) * TILE - 1 });
        e.draw = ctx => spr(ctx, 'crate', e.x, e.y);
        e.look3d = { model: 'crate' };
        a.block(x, y);
    }
}

function backCab(id) {
    if (ARCADE_GAMES[id]) return arcadeCabinet(id);
    return UI.say(null, 'A cabinet under a dusty sheet. A note from Ginger is taped to it: "Still fixing this one. Soon! - G"');
}
/* Dumpling Drop, Sushi Swap and Fortune Falls (out front since David's swap): furniture like the others, won at the prize
   counter; the four old cabinets in the back room only once the door is open (back) */
const BACK_HUE = { dumpling: 320, sushi: 150, fortune: 25 };
for (const [id, name] of [['dumpling', 'Dumpling Drop'], ['sushi', 'Sushi Swap'], ['fortune', 'Fortune Falls']]) {
    ITEMS['cab_' + id] = { name: `${name} cabinet`, type: 'furniture', price: 2400, icon: 'f_cab_' + id };
    FURN['cab_' + id] = { id: 'cab_' + id, name: `${name} cabinet`, w: 1, h: 1, kind: 'floor', price: 2400, sets: ['arcade'], prize: 1, arcade: id, anim: 1, light: 22 };
    PRIZES.splice(PRIZES.findIndex(p => p[0] === 'claw_machine'), 0, ['cab_' + id, 250]);
}
for (const id of BACK_CABS) {
    FURN['cab_' + id].back = 1;
    const P = PRIZES.find(p => p[0] === 'cab_' + id);
    if (P) P[1] = 300;
}
Object.assign(CAB_HUE, BACK_HUE);
CAB_RECOLOR.push('dumpling', 'sushi', 'fortune');
