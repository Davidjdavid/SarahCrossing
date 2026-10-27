/* ---- 24_places.js ---- */
/* Going in and out of buildings, signs, the board, knocking on doors */
async function fadeTo(fn) {
    G.busy++;
    for (let i = 1; i <= 8; i++) { G.fade = i / 8; await waitFrames(1); }
    await fn();
    updateCam(true);
    for (let i = 7; i >= 0; i--) { G.fade = i / 8; await waitFrames(1); }
    G.fade = 0;
    G.busy--;
}

function setArea(id, x, y, dir) {
    if (id !== 'island') ensureArea(id);
    Chats.endAll(); Bubbles.clear();
    if (G.player && G.player.sit) { G.player.sit = null; G.player.sy = undefined; }
    G.area = G.areas[id];
    const p = G.player;
    p.x = x; p.y = y; p.dir = dir || p.dir; p.path = null;
    S.player.area = id;
    Weather.parts = [];
    NPCs.place(true);
    Music.update(true);
    Save.touch();
}

async function enterBuilding(id) {
    const b = W0.buildings[id];
    if (id === 'home') {
        Sfx.play('door');
        await fadeTo(async () => {
            const a = G.areas.home && !G.areas.home.stale ? G.areas.home : (G.areas.home = buildHome());
            setArea('home', (a.doorTile[0] + 0.5) * TILE, (a.doorTile[1] - 0.2) * TILE, 'up');
        });
        Bus.emit('enter', 'home');
        return;
    }
    if (id === 'club') {
        Sfx.play('door');
        await fadeTo(async () => {
            if (!G.areas.club) G.areas.club = buildClub();
            const a = G.areas.club;
            setArea('club', (a.doorTile[0] + 0.5) * TILE, (a.doorTile[1] - 0.2) * TILE, 'up');
        });
        Bus.emit('enter', 'club');
        return;
    }
    if (id === 'lighthouse' && !lighthouseOpen()) { await boardedLighthouse(); return; }
    if (shopReno(id)) {
        await UI.say('sign', id === 'shop' ? "CLOSED FOR RENOVATION. Back tomorrow, BIGGER. (Lots of hammering inside. Fortune is supervising. Ginger is ignoring the supervising.)"
            : 'CLOSED TODAY. "Something fabulous is happening. Come back tomorrow, darling." You can hear Clementine telling Ginger to move a shelf one inch to the left.');
        return;
    }
    if (id === 'shop') {
        // (after hours Fortune's at home, but the shop stays open on the honor system: David, 27 October)
        if (!roomOpen('shop') && !Online.visitor()) UI.toast("Fortune's gone home for the night. The shop's on the honor system!", 'fortune_0');
        await enterRoom('shop');
        return;
    }
    if (id === 'boutique') {
        if (roomOpen('boutique')) { await enterRoom('boutique'); return; }
        await UI.say('sign', "CLEMENTINE'S. Open {hours:boutique}. Closed now. The mannequins are resting. They work very hard.");
        return;
    }
    // (the civic buildings' insides, on beta for now: 6zc_civic.js)
    if (typeof civicOpen === 'function' && civicOpen(id)) {
        if (roomOpen(id)) { await enterRoom(id); return; }
        await UI.say('sign', ROOMS[id].closedSign);
        return;
    }
    if (CIVIC_SIGNS[id]) { await UI.say('sign', CIVIC_SIGNS[id]); return; }
    if (ROOMS[id] && ROOMS[id].owner) { await visitHouse(id); return; }
    if (id === 'barn') { await enterRoom('barn'); return; }
    if (!ROOMS[id] && !id.startsWith('h_')) { await UI.say('sign', 'Opening soon! There is a lot of hammering going on inside.'); return; }
    if (ROOMS[id]) {
        if (roomOpen(id)) { await enterRoom(id); return; }
        await UI.say('sign', ROOMS[id].closedSign || 'Closed right now. Come back later!');
        return;
    }
    await knock(id.replace('h_', ''));
}
async function leaveInterior() {
    const from = G.area.id;
    const R0 = G.area.room;
    if (R0 && R0.exitTo) { Sfx.play('step'); await goRoom(R0.exitTo, R0.exitAt || [1, 1], 'down'); return; }
    const b = bldOf(G.area.building || from);
    if (!b) return;                         // (already outside: a second tap on the door while the first was fading)
    Sfx.play('door');
    await fadeTo(async () => {
        setArea('island', (b.x + b.door + 0.5) * TILE, (b.y + b.h + 0.75) * TILE, 'down');
    });
    Bus.emit('leave', from);
}

const KNOCK = {
    maki: 'A note on the door: "Out. Back soon. Please do not open. I am rolled very tight."',
    kai: 'A surfboard leans on the door. A sign says: "Gone surfing (emotionally)."',
    basil: 'The door smells like lime and peanuts. Nobody answers.',
    chili: 'The doorknob is warm. Everything about this house is warm.',
    coco: 'A sign: "Ring for gossip. Knock for more gossip."',
    cece: 'A sign: "Baking. Or crying. Possibly both. Come back later!"',
    clementine: 'A sign: "Out being fabulous. Orange you glad you stopped by?"',
    cuke: 'A sign: "Out running. Probably. It\'s always probably."',
    david: 'The door is painted like a rainbow. A sign says: "NO SHOES. SKATES OK."',
    joe: 'A note on the door: "Out writing. Or napping. Probably napping. - Joe (Poet)"',
    sully: 'A sign on the door: "Knock loud. I got the radio on. - Sully"',
    ginger: 'A sign on the door: "Out building something. Probably a porch. - G."',
    brulee: 'A little card on the door: "At the museum, being cultured. Please do not tap the door. - B."',
    mac: 'The door smells like butter. A note: "At the restaurant! Come eat! - Mac"',
};
async function knock(npcId) {
    const n = NPCs.get(npcId);
    Sfx.play('knock');
    const h = Clock.hourF();
    if (n && n.sleeping) {
        await UI.say(null, `Knock knock... ${n.def.name} is asleep. It's ${Clock.fmt().s}. Even on this island, that's bedtime.`);
        return;
    }
    await UI.say(null, KNOCK[npcId] || 'Nobody answers.');
}

const SIGNS = {
    island: () => `Welcome to ${S.islandName || 'the island'}! Population: very cute. The time is ${Clock.fmt().s}.`,
    club: () => 'CLUB WASABI. Always open. Daytime is for practicing. The floor really gets going after 9 PM.',
    bigtree: () => 'The big tree. It has been here longer than anyone. It looks extremely relaxed about it.',
    rock: () => 'A rock. It is doing its best.',
    flowerbed: () => 'Fortune planted these. They smell a little like fortune cookies, somehow.',
    spring: () => 'The hot spring. It is NOT soup. (Wonton would like that on the record.)',
    cart: () => "Basil's noodle cart. It opens at 8 PM and closes around 1 AM. Late-night noodles for everyone.",
};
async function talkSign(key) {
    const t = SIGNS[key];
    await UI.say(key === 'island' || key === 'club' ? 'sign' : null, t ? t() : '...');
}

