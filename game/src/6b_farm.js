/* ---- 6b_farm.js ---- */
/* Inside the barn and the windmill, and popping into a neighbor's house while they're out. */
ROOMS.barn = { w: 13, h: 7, wall: 'wall_barn', floor: 'floor_hay', music: 'house', name: 'The barn', build: a => buildBarnRoom(a) };
ROOMS.windmill = { w: 9, h: 6, wall: 'wall_stone', floor: 'floor_boards', music: 'house', name: 'The windmill', build: a => buildWindmillRoom(a) };

const FARM_LINES = {
    tractor: ["Gerald the tractor. He's older than the island. (He's not. But he acts like it.)", 'Sarah pats Gerald on the fender. A little puff of dust comes out. That is a thank-you.',
        "Gerald's key is in the ignition. Sarah turns it. Gerald says 'cough.' Gerald goes back to sleep.", "Someone (Ginger) has painted GERALD on the seat in very careful letters."],
    hay_stack: ['Hay bales, stacked by Ginger. Perfectly level. She checked.', 'Hay bales. They smell like summer, even in winter.'],
    feed_sacks: ["Chicken feed. There are no chickens. Ginger says 'yet.'", 'Sacks of feed. A note: "FOR THE CHICKENS (future)."'],
    milk_can: ["An old milk can. There are no cows. (There are no cows.) It's full of umbrellas now.", 'A milk can. Cuke uses it as a very loud drum at 5 AM.'],
    wheelbarrow: ["A wheelbarrow full of pumpkins, waiting to go to Fortune's.", 'The wheelbarrow squeaks a little. It is a friendly squeak.'],
    tool_wall: ['A pitchfork, a rake and a hoe. Very farm. Very serious.', "Ginger's farm tools, all oiled and hung in size order."],
    pegboard: ["Ginger's spare tools. Everything has an outline drawn around it, so she knows what's missing."],
    pumpkin_pile: ['Pumpkins. Summer pumpkins, fall pumpkins, all-year pumpkins. The farm is very committed.'],
    window_wall: ['Through the window: fields, the windmill, and a scarecrow named Steve waving at nobody.'],
    gear_wall: ['Big wooden gears, turning with the sails. Ginger oiled them. They hum a little. She tuned them.', 'The gears go round and round. Sarah watches them for a while. Very relaxing.'],
    grain_hopper: ["Grain goes in the top, flour comes out the bottom. It's basically magic. (It's not magic.)"],
    flour_sacks: ['Sacks of fresh flour. Cece comes by every morning for one. Sometimes two.', 'FLOUR. Each sack has a little wheat stamp on it. Cute.'],
    sack_cart: ['A hand truck with a sack of flour on it, ready to roll down the hill.'],
    millstone: ['The millstones turn slowly with the sails. Grind, grind. It smells like fresh bread in here.', 'The top stone turns on the bottom one. The whole windmill is really just a very big pepper grinder.'],
};
function farmUse(ent) {
    const id = ent.def.id;
    if (id === 'gear_wall') return Quests.gearWall();
    if (id === 'millstone' && Quests.done('windmill')) return Quests.moonBin();
    if (id === 'hay_pile') return jumpInHay(ent);
    if (id === 'flour_bin') return flourBin();
    if (id === 'hayloft_ladder') {
        return UI.say(null, G.area.id === 'barn' ? 'Sarah climbs up to the hayloft. More hay, a warm breeze, and a view of the whole farm. She climbs back down.'
            : 'The ladder goes up to the sails. Sarah climbs a few rungs. Very windy. Very high. She climbs back down.');
    }
    return UI.say(null, rpick(FARM_LINES[id] || [`A ${ent.def.name.toLowerCase()}.`]));
}
async function jumpInHay(ent) {
    const p = G.player;
    Sfx.play('pick');
    p.pose = 'cheer'; p.poseT = 30;
    for (let i = 0; i < 14; i++) G.fx.push({ x: ent.x + rint(-14, 14), y: ent.y - rint(4, 14), vx: (R() - 0.5) * 1.4, vy: -0.8 - R(), t: 0, life: 36, c: rpick(['#e8c860', '#f2dc80', '#d4b048']),
        update() { this.x += this.vx; this.y += this.vy; this.vy += 0.08; },
        draw(ctx) { ctx.fillStyle = this.c; ctx.fillRect(Math.round(this.x), Math.round(this.y), 2, 1); } });
    await UI.say(null, rpick(['Sarah jumps in the hay. It is exactly as fun as it looks.', 'FWUMP. Sarah is in the hay now. She will be finding hay in her hair until Thursday.',
        'Sarah flops into the hay pile. It is soft. It is scratchy. It is perfect.']));
}
async function flourBin() {
    const day = Clock.dayNum();
    if (S.flags.flourDay === day) { await UI.say(null, 'Sarah already took a scoop today. The windmill needs time. It is doing its best.'); return; }
    S.flags.flourDay = day;
    Sfx.play('pick');
    receive('flour', 2);
    await UI.say(null, 'A barrel of fresh flour, with a sign: "TAKE A SCOOP. - the windmill." Sarah takes two bags of flour.');
}
function wireFarm(a) {
    for (const it of a.items) it.use = ent => farmUse(ent);
}
function buildBarnRoom(a) {
    const items = layoutItems([
        ['tool_wall', 0, 'wall'], ['window_wall', 3, 'wall'], ['hayloft_ladder', 6, 'wall'], ['window_wall', 9, 'wall'], ['pegboard', 11, 'wall'],
        ['tractor', 1, 0], ['feed_sacks', 4, 0], ['hay_stack', 8, 0], ['hay_stack', 10, 0], ['milk_can', 12, 0],
        ['hay_pile', 9, 3], ['pumpkin_pile', 0, 4], ['wheelbarrow', 1, 5], ['pumpkin_pile', 12, 5], ['milk_can', 12, 3], ['old_trunk', 6, 1]]);
    a.items = items;
    wireFarm(a);
    for (const it of items) if (it.id === 'old_trunk') it.use = () => Quests.barnTrunk();
    placeFurniture(a, items);
}
function buildWindmillRoom(a) {
    const items = layoutItems([
        ['window_wall', 0, 'wall'], ['gear_wall', 3, 'wall'], ['hayloft_ladder', 6, 'wall'], ['window_wall', 8, 'wall'],
        ['flour_sacks', 0, 0], ['millstone', 3, 1], ['grain_hopper', 5, 1], ['flour_bin', 8, 1], ['sack_cart', 0, 4], ['flour_sacks', 7, 4]]);
    a.items = items;
    wireFarm(a);
    placeFurniture(a, items);
    // the top millstone turns with the sails
    const ms = a.ents.find(e => e.furn && e.def && e.def.id === 'millstone');
    if (ms) {
        const draw0 = ms.draw;
        ms.draw = ctx => {
            if (draw0) draw0(ctx); else spr(ctx, ms.frame, ms.x, ms.y);
            const t = G.t / 40, cx = ms.x, cy = ms.y - 22;
            for (let k = 0; k < 2; k++) {
                const ang = t + k * Math.PI;
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.fillRect(Math.round(cx + Math.cos(ang) * 9), Math.round(cy + Math.sin(ang) * 3), 2, 1);
            }
        };
    }
}
/* the farm is a nice place to hang out (and drop things) */
for (const [id, spots] of Object.entries({ ginger: { in_barn: 1.5, in_windmill: 1 }, cuke: { in_barn: 1, in_windmill: 0.8 }, mac: { in_windmill: 1 }, cece: { in_windmill: 1.2 },
    basil: { in_barn: 0.8 }, kai: { in_barn: 0.5 }, joe: { in_windmill: 0.5 } })) {
    const d = NPC_DEFS[id];
    if (d && d.fav) Object.assign(d.fav, spots);
}
AREA_TALK.barn = ["I come here to think. Mostly about Gerald. Do you think he's lonely?", 'The hay smells SO good. I might nap. Right here. Standing up.', "Ginger says there will be chickens 'soon.' She has said that for a year."];
AREA_TALK.windmill = ['Listen. The gears are humming. Ginger tuned them. Of course she did.', "The millstones are SO slow. I love them. They're my role models.", 'Everything in here is a little bit floury. Including me now.'];

/* ---------------------------------------------------------------- dropping in while they're out */
const SNOOP_IN = ["Sarah lets herself in. Nobody locks their door on this island. Nobody even knows where their keys are.",
    "The door swings open. It's quiet inside. It smells like somebody's house, which it is.", "Sarah tiptoes in. She doesn't know why she's tiptoeing. It just feels right."];
const CAUGHT = {
    maki: "Oh. Sarah. You are in my house. ...Did you touch the rice cooker? I will know.", kai: "Duuude! You're in my shack! Welcome! Mi shack es su shack!",
    basil: 'Oh, hello! Make yourself at home. You already did. Good.', chili: "Whoa, you're in here? It's so hot in here. Sorry. It's always hot in here.",
    coco: "SARAH. You're in my HOUSE. This is the best gossip I've ever walked into.", cece: "Oh! Sarah! Hi! Sorry! Why am I sorry? You're in MY house! Sorry!",
    clementine: 'Darling. You let yourself in. Bold. I respect it. Did you try anything on?', cuke: "SARAH! You're here! In my house! At this hour! Want some water?!",
    sully: "Kid! Whaddya doin' in heah? ...Ah, it's fine. Coffee's on. It's always on.", david: "HONEY. You broke into my house? Iconic. Mind the goat bed.",
    joe: "Oh, hi! You're in my house! Did you read the poem on the typewriter? Don't. It's not done. It's about you.", ginger: "Hey! Checking out the workshop? Don't touch the level. It's perfectly level.",
    brulee: 'Ah! A visitor. In my gallery. In my home. It is fine. Please do not tap anything.', mac: "Sarah! You're here! Are you hungry? You broke in hungry, didn't you?",
};
async function snoopIn(id) {
    const R = ROOMS[id], owner = R.owner, nm = NPC_DEFS[owner].name;
    await UI.say(null, KNOCK[owner] || 'Nobody answers.', { keep: true });
    const k = await UI.ask(null, `Nobody's home. The door isn't locked. (Nobody locks anything here.) Go in and look around?`, ['Go in', 'Leave it']);
    if (k !== 0) return;
    G.snoop = { owner, room: id, day: Clock.dayNum() };
    await enterRoom(id);
    await UI.say(null, rpick(SNOOP_IN) + ` ${nm} will probably be back later.`);
}
/* the owner comes home to find Sarah in the living room */
async function snoopChecks(a) {
    const sn = G.snoop;
    if (!sn || a.id !== sn.room) return false;
    const n = NPCs.get(sn.owner);
    if (sn.caught) return false;
    if (n && !n.sleeping && n.area === a.id) {
        sn.caught = true;
        G.busy++;
        try {
            await waitFrames(20);
            faceToward(G.player, n);
            n.emote = 'bang'; n.emoteT = 60;
            Sfx.play('item');
            await UI.say(sn.owner, voiced(sn.owner, CAUGHT[sn.owner] || "Oh! You're in my house! Hi!"));
            n.emote = 'heart'; n.emoteT = 60;
        } finally { G.busy--; }
        return true;
    }
    // nobody's coming, but it's their bedtime: better go
    const want = n && targetFor(n, dayHour());
    if (want && want.sleep) {
        G.busy++;
        try { await UI.say(null, `It's getting late. ${NPC_DEFS[sn.owner].name} will be home to sleep soon. Sarah slips back out.`); } finally { G.busy--; }
        await leaveInterior();
        return true;
    }
    return false;
}
Bus.on('leave', () => { G.snoop = null; });

