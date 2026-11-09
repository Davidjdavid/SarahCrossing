/* the village and the harbor: the first act. Lamp Night is tonight, and it's been morning all week. */
const SQUARE = { x: 43, y: 35, w: 15, h: 10 };
const LOOKS = {
    ansel: { skin: P.skin, hair: '#e8e2d8', style: 'cap', hat: P.navy, top: P.navy, bottom: '#4a4a5a', beard: '#f0ece4' },
    iris: { skin: P.skinS, hair: '#2a1b2d', style: 'long', top: P.purple, bottom: P.navy, glasses: P.gold },
    crumb: { skin: P.skin, hair: '#c97a4a', style: 'bun', top: P.pink, bottom: P.white, apron: P.white, round: true, tall: true, blush: '#f29a8c' },
    bridget: { skin: P.skinD, hair: '#3a2a1a', style: 'cap', hat: P.orange, top: '#c08b55', bottom: '#4a5a8a', tall: true },
    flash: { skin: P.skinD2, hair: '#1a1220', style: 'spiky', top: P.yellow, bottom: P.navy },
    tilt: { skin: P.skin, hair: '#c9a04a', style: 'curly', top: P.red, bottom: P.navy, tall: true },
    holt: { skin: P.skinS, hair: '#d8d8d8', style: 'bald', top: '#7a8a5a', bottom: '#5a4a3a', beard: '#d8d8d8', tall: true },
    lux: { skin: P.skin, hair: '#5a3a22', style: 'cap', hat: P.navy, top: P.blue, bottom: P.navy, tall: true },
    pan: { skin: P.skin, hair: '#d8a050', style: 'wide', hat: P.tan, top: P.green, bottom: P.brownS, tall: true },
};
Object.assign(VOICES, {
    dot: { p: 620, w: 'square' }, ansel: { p: 170, w: 'triangle', v: 0.12 }, iris: { p: 520, w: 'triangle', v: 0.1 }, crumb: { p: 360, w: 'square' },
    bridget: { p: 260, w: 'square' }, flash: { p: 760, w: 'square', wob: 0.25 }, tilt: { p: 300, w: 'square', wob: 0.2 }, holt: { p: 150, w: 'sawtooth', v: 0.05 },
    lux: { p: 200, w: 'sawtooth', v: 0.05 }, pan: { p: 230, w: 'triangle', v: 0.12 }, band: { p: 400, w: 'triangle' },
});
NAMES.dot = 'Dot'; NAMES.crumb = 'Mrs. Crumb'; NAMES.band = 'Reel';

function house(m, id, tx, ty, tw, th, b, to) {
    const p = addProp(m, { id, tx, ty, tw, th, b, open: b.door != null ? [[b.door, th - 1]] : null });
    m.doors = m.doors || [];
    if (to) m.doors.push({ x: tx + b.door, y: ty + th - 1, to: to[0], tx: to[1], ty: to[2], tdir: 'up', dir: 'up', locked: to[3], lockedSay: to[4] });
    return p;
}

ISLAND_ADD.push(function village(m) {
    m.doors = m.doors || [];
    /* the Great Clock */
    addProp(m, { id: 'tower', tx: 49, ty: 34, tw: 2, th: 4, fh: 2, draw: drawTower, sortBias: 0 });
    m.add('clock', 788, 566, { name: 'clock', w: 24, h: 6 });
    /* houses */
    house(m, 'home', 38, 45, 4, 4, { tw: 4, th: 4, wall: '#f3e2c0', roof: '#4f7fd6', door: 1, windows: [2], chimney: 46, timber: true }, ['home', 4, 6]);
    addProp(m, { id: 'observatory', tx: 38, ty: 31, tw: 4, th: 5, open: [[2, 4]], draw: drawObservatory });
    m.doors.push({ x: 40, y: 35, to: 'observatory', tx: 5, ty: 7, tdir: 'up', dir: 'up' });
    house(m, 'bakery', 58, 35, 5, 4, { tw: 5, th: 4, wall: '#fbe3d0', roof: '#e2574c', door: 2, windows: [0, 4], awning: P.red, chimney: 10 }, ['bakery', 5, 7]);
    house(m, 'workshop', 58, 50, 4, 3, { tw: 4, th: 3, wall: '#d8b27c', roof: '#7a5a3a', door: 1, windows: [3], timber: true }, ['island', 0, 0, () => true, () => 'A note on the door: "Out building the bridge. Watch me sometime! - Bridget"']);
    /* the square */
    for (const [x, y] of [[44, 35], [56, 35], [44, 44], [56, 44]]) m.addAt('lamp', x, y, {});
    m.add('band', 708, 658, { name: 'band', song: 'village', w: 40, h: 12, talk: bandTalk });
    furn(m, 'bench', 52, 39, 26, 5, { name: 'bench', onAct: benchSit });
    m.addAt('sign', 47, 45, { text: 'SELDOM SQUARE. Lamp Night tonight! (Weather and hour permitting.)' });
    m.addAt('sign', 42, 37, { text: 'OBSERVATORY. Iris B. Puzzles welcome. Knock (just walk in).' });
    /* people */
    person(m, 'holt', 54, 39, { spec: LOOKS.holt, display: 'Old Holt', day: [[0, 24, { x: 54, y: 39, dir: 'left' }]], talk: holtTalk, speed: 20 });
    person(m, 'flash', 46, 38, { spec: LOOKS.flash, day: [[5.5, 19.5, { x: 46, y: 38, dir: 'right' }], [19.5, 5.5, { x: 39, y: 50, home: true }]], door: [39, 48], talk: flashTalk, speed: 60 });
    person(m, 'bridget', 64, 42, { spec: LOOKS.bridget, brain: bridgetBrain, talk: bridgetTalk });
    m.add('bridgework', 65 * TILE, 40 * TILE, { name: 'bridgework', w: 32, h: 32 });
    person(m, 'lux', 55, 30, { spec: LOOKS.lux, display: 'Watchman Lux', path: [[50, 30, 1.2], [61, 30, 1.2]], brain: luxBrain, talk: luxTalk, speed: 34 });
    m.add('gatewatch', 49 * TILE, 28 * TILE, { name: 'gatewatch', w: 32, h: 26 });
    m.addAt('leica', 53, 39, { name: 'leica' });
    m.addAt('ball', 47, 38, { name: 'ball' });
    /* the hen run behind the bakery */
    m.addAt('chicken', 59, 42, { name: 'hen' });
    m.addAt('egg', 61, 43, { name: 'egg' });
    /* the harbor */
    person(m, 'ansel', 51, 71, { spec: LOOKS.ansel, brain: anselBrain, talk: anselTalk, dir: 'down', door: [39, 48], speed: 30 });
    m.addAt('bobber', 51, 74, { name: 'bobber' });
    person(m, 'tilt', 37, 60, { spec: LOOKS.tilt, brain: tiltBrain, talk: tiltTalk, dir: 'right', speed: 30 });
    m.addAt('sign', 52, 61, { text: 'SELDOM HARBOR. Boats: none expected. (None ever are.)' });
    addProp(m, { id: 'boat', tx: 47, ty: 68, tw: 2, th: 2, fh: 1, draw: drawBoat });
    furn(m, 'crates', 48, 60, 22, 10, { say: 'Crates of nets, rope and old floats. Nobody has fished from a boat here in years.' });
    furn(m, 'barrel', 53, 60, 12, 8, { say: 'A barrel that smells like the sea.' });
});

/* ---------- the opening ---------- */
START.onNew = () => {
    World.hour = 9;
    G.flags.started = true;
    scene(async () => {
        Cam.hold = { x: 50.5 * TILE, y: 68.5 * TILE, speed: 99 };
        await wait(1.2);
        const a = ent('ansel'); faceTo(a, World.dot);
        await say('Ah, Dot. Morning. ...Still morning, isn\'t it? Feels like it\'s been morning all week.', 'ansel');
        await say('Lamp Night is tonight. Ninety-nine years the lighthouse has been dark, and every year we light our lanterns for it anyway.', 'ansel');
        await say('Run up to the village and help them get ready, would you? I\'ll be along once something bites.', 'ansel');
        a.dir = 'down';
    }).then(() => UI.showHint('Arrow keys or WASD to walk.  Z to talk.', 8));
};

/* ---------- Ansel: fishing, then the square, then home ---------- */
function anselBrain(e, dt) {
    if (G.flags.festival) { if (!e.hidden) { const [tx, ty] = tileOf(e); if (tx === 39 && ty === 49) { e.hidden = true; } else goTo(e, 39, 49, dt); } return; }
    if (!e.st.bit) {
        e.dir = 'down';
        e.st.fish = (e.st.fish || 0) + dt;   /* the fish only bite while someone's watching */
        if (e.st.fish > 14) { e.st.bit = true; bark(e, 'A bite!'); Sfx.play('splash'); }
        return;
    }
    goTo(e, 48, 43, dt);
}
async function anselTalk(e) {
    const F = G.flags;
    if (!F.festival && !e.st.bit) { await say('Nothing yet. Fish are funny here. They only seem to bite when somebody\'s watching the line.', 'ansel'); return; }
    if (!F.festival) {
        if (lampReady() && !Light.night()) { await say('All ready, by the look of it. Now we just need the night to come.', 'ansel'); return; }
        await say('Got one! Now, Lamp Night. Mrs. Crumb\'s cake, the band, Bridget\'s bridge so Pan can bring the flock... and the night itself.', 'ansel');
        return;
    }
    return actTwoAnsel(e);
}
kind('bobber', {
    w: 6, h: 4, ph: 6, fixed: true, flat: true,
    draw(e, D) { const a = ent('ansel'); if (!a || a.st.bit || a.hidden) return; box(D, e.x + 1, e.y + Math.sin(G.t * 3) * 0.8, 4, 3, P.red); box(D, e.x + 1, e.y - 1 + Math.sin(G.t * 3) * 0.8, 4, 1, P.white); },
});
function drawBoat(D, p) {
    const x = p.tx * TILE, y = p.ty * TILE, b = Math.sin(G.t * 1.5) * 0.6;
    box(D, x - 4, y + 10 + b, 40, 12, '#8a5a34'); box(D, x - 2, y + 8 + b, 36, 4, '#b07a46'); box(D, x + 14, y - 14 + b, 2, 24, P.brownD); box(D, x + 16, y - 12 + b, 12, 14, P.cream);
}
function drawObservatory(D, p) {
    const c = spr('observatory', () => {
        const g = grid(64, 92);
        rect(g, 6, 34, 52, 57, '#d9cfe8'); shade(g, '#d9cfe8', '#b8acd0', x => x > 48);
        for (let y = 40; y < 90; y += 7) rect(g, 6, y, 52, 1, '#b8acd0');
        for (let y = 10; y < 35; y++) for (let x = 0; x < 64; x++) { const dx = (x + 0.5 - 32) / 27, dy = (y + 0.5 - 34) / 24; if (dx * dx + dy * dy <= 1) px(g, x, y, x > 44 ? '#4a2c70' : '#6a4a9a'); }
        rect(g, 29, 10, 6, 24, '#2a2440'); px(g, 31, 14, P.yellow); px(g, 32, 20, P.white);
        rect(g, 4, 33, 56, 3, '#4a2c70');
        rect(g, 26, 74, 12, 17, P.brownD); rect(g, 31, 75, 1, 15, P.brownS);
        rect(g, 14, 46, 8, 8, '#8fd0f0'); rect(g, 42, 46, 8, 8, '#8fd0f0');
        return toCanvas(outline(g));
    });
    D.img(c, p.tx * TILE, (p.ty + p.th) * TILE - c.height);
}

/* ---------- the band ---------- */
async function bandTalk() {
    const F = G.flags;
    if (!F.drummer) { await say('We\'re the Lamp Night band. Well, half of it. Tilt went off down the beach to find a drumstick... hours ago? Days? Never came back.', 'band'); return; }
    if (!F.festival) { await say('Full band again! It sounds right now, doesn\'t it? We play as long as somebody\'s listening.', 'band'); return; }
    if (F.lastNote) { await say('Since we played it all the way through, we\'ve started again from the top. Most songs are like that, really.', 'band'); return; }
    await say('Funny thing about our song. Nobody\'s ever heard the end of it. Nobody\'s ever stayed that long.', 'band');
}
/* the band only plays while seen; the drums only once Tilt's back; and the song does end, for whoever watches long enough */
const BAND_SONG_LOOPS = 6;
KINDS.band.update = function (e, dt) {
    musicStep(e, dt);
    const S = SONGS[e.song]; if (!S) return;
    const loop = (60 / S.bpm / 4) * S.len;
    if (!G.flags.lastNote && G.flags.drummer && e.st.mpos >= loop * BAND_SONG_LOOPS && !World.cutscene && G.state === 'play') {
        G.flags.lastNote = true; e.st.mpos = 0;
        scene(async () => { Sfx.play('chime'); await say('...and that\'s the end! The whole song! Nobody\'s ever stayed for all of it before. Here, a keepsake.', 'band'); giveCurio('note'); });
    }
};
KINDS.band.draw = (function (orig) {
    return function (e, D) {
        const ctx = D.ctx;
        box(D, e.x - 2, e.y - 2, e.w + 4, e.h + 4, '#b07a46'); box(D, e.x - 2, e.y + e.h, e.w + 4, 3, '#8a5a34');
        const S = SONGS[e.song];
        const beat = Math.floor((e.st.mpos || 0) * (S ? S.bpm / 60 : 2)) % 2;
        if (G.flags.drummer) { const c = personFrame('tilt', LOOKS.tilt, 'down', 0); D.img(c, e.x + 6 - 8, e.y + e.h - c.height - 2 - (beat ? 1 : 0)); }
        D.img(thing('drum'), e.x + 1, e.y + 2 + (beat && G.flags.drummer ? 1 : 0));
        const c2 = personFrame('reel', BAND[1], 'down', 0); D.img(c2, e.x + 30 - 8, e.y + e.h - c2.height - 2 - (beat ? 1 : 0));
        box(D, e.x + 33, e.y - 6 - (beat ? 1 : 0), 6, 3, P.gold);
        if (Music.src === e && Math.floor(G.t * 2) % 2) drawText(ctx, '♪', D.X(e.x + 20), D.Y(e.y - 24 - (beat ? 2 : 0)), P.white, D.k, P.ink);
    };
})(KINDS.band.draw);

/* ---------- Tilt, the drummer who wandered off ---------- */
function tiltBrain(e, dt) {
    if (G.flags.drummer) { e.hidden = true; return; }
    if (!e.st.woke) { e.st.woke = true; e.st.first = true; }
    if (goTo(e, 46, 43, dt) || (Math.abs(ecx(e) - 46.5 * TILE) < 10 && Math.abs(e.y - 43 * TILE) < 16)) {
        G.flags.drummer = true; e.hidden = true; Fx.puff(ecx(e), e.y, 'pop'); Sfx.play('chime');
        bark(ent('holt'), 'The drums are back!', 3);
        Save.soon();
    }
    if (e.st.first && e.t > 0.5) { e.st.first = false; bark(e, '...huh?', 2); Notebook.saw('still', e); }
}
async function tiltTalk(e) {
    if (!e.st.talked) {
        e.st.talked = true;
        await say('Whoa! Dot! Was I... walking? I went to find a drumstick on the beach and I feel like I\'ve been walking forever.', 'tilt');
        await say('Is it still morning? It\'s still morning. Right. Back to the band!', 'tilt');
        return;
    }
    await say('Back to the band! Back to the band!', 'tilt');
}

/* ---------- Bridget builds while watched ---------- */
function bridgetBrain(e, dt) {
    const b = ent('bridgework');
    if (G.flags.bridge) { if (!G.flags.festival || Light.night()) { e.dir = 'down'; return; } goTo(e, 60, 53, dt); return; }
    e.dir = 'right';
    if (World.talking === e) return;
    b.st.p = Math.min(1, (b.st.p || 0) + dt / 22);
    e.anim += dt;
    if (Math.floor(e.t * 2.5) !== Math.floor((e.t - dt) * 2.5)) { Sfx.play('tock'); }
    if (b.st.p >= 1) {
        G.flags.bridge = true;
        for (const [x, y] of [[65, 40], [66, 40], [65, 41], [66, 41]]) setTile(e.map, x, y, 'b');
        bark(e, 'Done!', 3); Sfx.play('chime'); Save.soon();
    }
}
async function bridgetTalk(e) {
    const b = ent('bridgework');
    if (G.flags.bridge) { await say(G.flags.festival ? 'Best bridge I ever built. Took an audience, that\'s all.' : 'Done! I knew I just needed somebody to watch. Pan can bring the flock over for Lamp Night now.', 'bridget'); return; }
    if (!e.st.met) { e.st.met = true; await say('Bridget, carpenter. This bridge? Been building it since spring.', 'bridget'); await say('Funny thing. I only ever get anything done while somebody\'s watching me. Stick around?', 'bridget'); return; }
    await say(`About ${Math.round((b.st.p || 0) * 100)} percent there. Don't go wandering off on me.`, 'bridget');
}
kind('bridgework', {
    w: 32, h: 32, ph: 32, fixed: true, flat: true,
    draw(e, D) {
        if (G.flags.bridge) return;
        const p = e.st.p || 0, n = Math.floor(p * 8);
        for (let i = 0; i < n; i++) box(D, e.x + i * 4, e.y + 4, 3, 24, '#b07a46');
        box(D, e.x, e.y + 4, 32 * Math.min(1, p * 1.3), 2, '#7c5230'); box(D, e.x, e.y + 26, 32 * Math.min(1, p * 1.3), 2, '#7c5230');
    },
});

/* ---------- Flash and the ball ---------- */
async function flashTalk(e) {
    const F = G.flags;
    if (Light.night() && !F.festival) { await say('Lamp Night! I\'m staying up the WHOLE night.', 'flash'); return; }
    if (!F.ballGame) {
        await say('Wanna see my super throw? Go long, Dot!', 'flash');
        F.ballGame = true;
        const b = ent('ball');
        if (b && !b.held) { b.x = ecx(e); b.y = e.y - 2; b.z = 10; b.vx = 4; b.vy = -150; b.vz = 200; Sfx.play('throw'); }
        return;
    }
    if (F.festival && !F.quarry) { await say('Lux says nobody gets past him. But he can\'t watch the gate AND get watched himself, can he?', 'flash'); return; }
    await say('Did you see it come down? It never comes down till somebody goes and looks.', 'flash');
}

/* ---------- Old Holt on his bench ---------- */
async function holtTalk(e) {
    const F = G.flags;
    if (!F.clockSeen) { await say('Hm.', 'holt'); return; }
    if (!F.festival) {
        if (lampReady() && !Light.night()) { await say('Everything\'s ready but the night. Sit on the bench a while, Dot, and watch the tower with me. The evening comes quicker that way.', 'holt'); return; }
        if (Light.night()) { await say('Night at last. In my day, the lighthouse swept right over this bench. We never needed anybody to watch the tower then.', 'holt'); return; }
        if (e.st.n = (e.st.n || 0) + 1, e.st.n % 3 === 0) { await say('At midnight a little bird pops out of the tower. Nobody\'s seen it in years. Nobody\'s been watching at midnight.', 'holt'); return; }
        await say('The tower\'s hands are moving again. First time in ages. Must be somebody watching it.', 'holt'); return;
    }
    await say('When the lighthouse was lit, the hour moved wherever its light fell. Watched by the island itself, you see. Nobody had to stand around.', 'holt');
}

/* ---------- Watchman Lux and the north gate ---------- */
function luxBrain(e, dt) { if (G.flags.luxGaveUp) { e.dir = 'down'; return; } walkPath(e, dt); }
async function luxTalk(e) {
    if (G.flags.luxGaveUp) { await say('Gate\'s open. I\'ve stopped pretending I can see everything. Very freeing, actually.', 'lux'); return; }
    await say('Quarry\'s shut. Has been for years. Nobody goes up there. Not on my watch!', 'lux');
}
/* the gate: going north while Lux can see you (that is, while he's seen) sends you back */
kind('gatewatch', {
    w: 32, h: 26, ph: 26, fixed: true, flat: true,
    draw() { },
    update(e, dt) {
        const d = World.dot, lux = ent('lux');
        if (G.flags.luxGaveUp || !lux) return;
        if (d.map !== e.map || !overlap(d, e) || d.dir !== 'up') return;
        if (lux.seen && !World.cutscene) {
            scene(async () => {
                faceTo(lux, d); bark(lux, 'Oi!', 2); Sfx.play('bonk');
                d.y = 31 * TILE; Cam.snap();
                await say('Oi! Back you go. Nobody goes up to the quarry while I\'m watching.', 'lux');
            });
        }
    },
});
Story.on('entered', () => { });
Story.on('tick', () => {
    const d = World.dot; if (!d || d.map.id !== 'island') return;
    const [tx, ty] = tileOf(d);
    if (!G.flags.quarry && ty < 28 && tx >= 36 && tx <= 66) { G.flags.quarry = true; Save.soon(); }
    if (G.flags.quarry && !G.flags.luxGaveUp && ty >= 31 && ty <= 34 && tx >= 46 && tx <= 54 && !World.cutscene) {
        G.flags.luxGaveUp = true;
        const lux = ent('lux');
        scene(async () => {
            faceTo(lux, d);
            await say('You! You were up the quarry?! Nobody gets past me... unless... unless nobody\'s looking at me.', 'lux');
            await say('Fine. FINE. The gate stays open. I can\'t watch everything. Turns out nobody can.', 'lux');
        });
    }
    /* the first time the Great Clock is seen in ages, the village notices */
    const clock = ent('clock');
    if (clock && clock.seen && !G.flags.clockSeen) {
        G.flags.clockSeen = true;
        const h = ent('holt'), f = ent('flash');
        if (h) bark(h, 'The tower\'s hands moved!', 3);
        if (f) bark(f, 'Whoa!', 2);
    }
});

/* ---------- Leica, who can't bear not to be seen (in the village) ---------- */
kind('leica', {
    w: 12, h: 7, ph: 13, bound: true, figure: true, solid: true,
    init(e) { e.st.t = 0; },
    draw(e, D) { D.thing(e, 'dog', (e.moving || e.pushed > 0) && Math.floor(e.t * 8) % 2, e.dir === 'left'); if (e.pushed > 0) D.sweat(e); },
    update(e, dt) {
        e.pushed = Math.max(0, (e.pushed || 0) - dt);
        const [tx, ty] = tileOf(e);
        e.unbound = !(tx >= 36 && tx <= 64 && ty >= 30 && ty <= 56);
        e.st.t -= dt; e.moving = false;
        if (e.st.t <= 0) { e.st.t = 1.5 + hash2(e.t * 9 | 0, 3, 3) * 2; e.st.dx = (hash2(e.t * 7 | 0, 1, 4) - 0.5) * 2; e.st.dy = (hash2(e.t * 5 | 0, 2, 5) - 0.5) * 2; }
        if (e.st.t > 0.8) { moveEnt(e, e.st.dx * 16 * dt, e.st.dy * 16 * dt); e.moving = true; if (e.st.dx) e.dir = e.st.dx < 0 ? 'left' : 'right'; }
    },
    act(e) {
        faceTo(e, World.dot);
        const lines = ['Leica wags her tail.', 'Leica looks up. Not at Dot, exactly. Somewhere past Dot.', 'Leica sits, very good, and waits for somebody to notice.'];
        say(lines[(e.st.pets = (e.st.pets || 0) + 1) % lines.length]);
    },
});

/* ---------- Lamp Night ---------- */
function lampReady() { const F = G.flags; return F.cake && F.bridge && F.drummer; }
Story.on('tick', () => {
    const F = G.flags, d = World.dot;
    if (F.festival || World.cutscene || G.state !== 'play' || !d || d.map.id !== 'island') return;
    const [tx, ty] = tileOf(d);
    if (!inRect(tx, ty, SQUARE)) return;
    if (lampReady() && Light.night()) lampNight();
});
async function lampNight() {
    G.flags.festival = true;
    await scene(async () => {
        await Fx.fadeOut(0.6);
        const spots = { ansel: [48, 40, 'down'], iris: [52, 40, 'down'], crumb: [54, 40, 'down'], bridget: [46, 40, 'down'], flash: [50, 42, 'up'], holt: [54, 39, 'left'], pan: [56, 41, 'left'] };
        for (const n in spots) {
            const e = ent(n); if (!e) continue;
            if (e.map !== World.map) { e.map.remove(e); e.map = World.map; World.map.ents.push(e); }
            e.hidden = false; e.x = spots[n][0] * TILE + 3; e.y = spots[n][1] * TILE + 8; e.dir = spots[n][2]; e.hold = true;
        }
        const d = World.dot; d.x = 50 * TILE + 3; d.y = 40 * TILE + 8; d.dir = 'up';
        Cam.hold = { x: 50.5 * TILE, y: 39 * TILE, speed: 99 };
        G.flags.lanterns = true;
        Fx.fadeIn(0.8); await wait(1);
        await say('The cake! Lamp Night cake, everyone, fresh as anything. It baked beautifully. Somebody watched it.', 'crumb');
        await say('Gather round. Ninety-nine years ago tonight, the lighthouse went dark. My grandfather was its last keeper.', 'ansel');
        await say('They say its light swept over the whole island every night, and wherever it fell, the hour moved by itself. Nobody had to watch anything.', 'ansel');
        await say('Its great lens was four glasses. When the light went out, they were scattered. Only one ever came back to our family.', 'ansel');
        await say('Dot. This was his. It\'s yours now.', 'ansel');
        G.flags.spyglass = true; Sfx.play('get'); Fx.flash = 0.5;
        await say('Dot got the Spyglass!', null, { name: false });
        await say('Look through it, Dot. Not at things. At the looking itself.', 'iris');
        await say('The other three glasses... Pan\'s family always had one, I think. The miners took one up the quarry. And the last went south through the woods, to the Hollow.', 'ansel');
        await say('Nobody goes to the Hollow. Not since it faded.', 'holt');
        await say('Bring them home, Dot. Maybe the old light can be lit again. Happy Lamp Night, everyone.', 'ansel');
        /* later that night, everyone goes home */
        await Fx.fadeOut(0.8);
        for (const n in spots) { const e = ent(n); if (e) e.hold = false; }
        const homes = { pan: ['island', 89, 42], bridget: ['island', 64, 42], iris: ['observatory', 5, 4], crumb: ['bakery', 5, 2], holt: ['island', 54, 39] };
        for (const n in homes) {
            const e = ent(n), [mid, x, y] = homes[n]; if (!e) continue;
            if (e.map.id !== mid) { e.map.remove(e); e.map = MAPS[mid]; MAPS[mid].ents.push(e); }
            e.x = x * TILE + 3; e.y = y * TILE + 8; e.goal = null; e.hidden = false;
        }
        for (const [n, y] of [['ansel', 49], ['flash', 50]]) { const e = ent(n); if (e) { e.hidden = true; e.x = 39 * TILE + 3; e.y = y * TILE + 6; } }
        Fx.fadeIn(0.8);
        Save.write(true);
    });
    UI.showHint('Hold X (or Shift) and use the arrows to look around. Let go and the view stays put.', 12);
}
/* the festival's lanterns, floating up over the square */
Story.on('tick', () => {
    if (!G.flags.lanterns || !World.map || World.map.id !== 'island') return;
    if (!Light.night()) return;
    if (Math.random() < 0.05) Fx.add({ x: (44 + Math.random() * 13) * TILE, y: 44 * TILE, vx: (Math.random() - 0.5) * 6, vy: -14, life: 6, c: P.yellow, r: 1.6, star: false, lantern: true });
});

/* ---------- Iris: she notices how things work, and will say what she thinks (the hints) ---------- */
function hintNow() {
    const F = G.flags;
    if (!F.festival) {
        if (!F.cake) return invHas('egg', 3) || F.eggsGiven ? 'Mrs. Crumb had your eggs. A watched cake bakes, they say.' : 'Mrs. Crumb wants three eggs, and her hen only ever has one. But you know, things you don\'t look at have a way of going back to how they were.';
        if (!F.drummer) return 'The band\'s missing their drummer. Tilt went off along the beach, west of the pier. Nobody\'s looked that way in ages.';
        if (!F.bridge) return 'Bridget only works while somebody watches her. She\'s by the river, east of the square.';
        if (!Light.night()) return 'Lamp Night needs night. And the hour only moves while somebody watches the Great Clock. Have you tried just... watching it?';
        return 'Everything\'s ready. Go to the square!';
    }
    return actTwoHint();
}

/* the bench by the Clock: sit and watch it a while (everything you can see goes by faster, the hour too) */
async function benchSit(e) {
    const clock = ent('clock');
    const r = await ask('Sit on the bench and watch the Great Clock for a while?', ['Until night', 'Until morning', 'Not now'], null);
    if (r === 2 || r == null) return;
    const d = World.dot;
    d.x = ecx(e) - d.w / 2; d.y = e.y + 2; d.dir = 'up'; d.sitting = true;
    World.lapse = { until: r === 0 ? 'night' : 'day', t: 0 };
    Music.cut();
}
const LAPSE = 8;
function lapseDone() {
    const L = World.lapse; if (!L) return true;
    const clock = ent('clock');
    if (L.t > 1 && Input.anyHit && G.t - (Talk.closedAt || 0) > 0.4) return true;
    if (!clock || !clock.seen && L.t > 0.5) return true;
    if (L.until === 'night' && Light.night() && World.hour % 24 >= 20) return true;
    if (L.until === 'day' && World.hour % 24 >= 7.5 && World.hour % 24 < 8) return true;
    return false;
}

/* ---------- little secrets in the village ---------- */
/* the hen's seventh egg is golden */
Story.on('got', (what, e) => {
    if (what !== 'egg') return;
    G.flags.eggsPicked = (G.flags.eggsPicked || 0) + 1;
    if (e && e.golden) { e.golden = false; invTake('egg'); giveCurio('goldegg'); say('A golden egg! Warm, and very heavy for an egg.'); }
});
KINDS.egg.respawn = function (e) { if ((G.flags.eggsPicked || 0) >= 6 && !G.flags.curio_goldegg) e.golden = true; };
KINDS.egg.draw = function (e, D) { D.thing(e, e.golden ? 'goldegg' : 'egg'); if (e.golden && Math.floor(G.t * 3) % 2) box(D, e.x + 2, e.y - 6, 1, 1, P.white); };
/* at midnight the tower's little door opens and its bird comes out, for whoever is watching */
function midnight() {
    if (G.flags.curio_feather || G.flags.featherDropped) return;
    G.flags.featherDropped = true;
    Fx.sparkle(50 * TILE, 35 * TILE, P.gold); Sfx.play('bell');
    const h = ent('holt'); if (h && h.seen) bark(h, 'The bird! The little bird!', 3);
    MAPS.island.add('feather', 50 * TILE - 3, 38 * TILE + 6, { name: 'feather' });
}
kind('feather', {
    w: 8, h: 4, ph: 8, fixed: true,
    draw(e, D) { box(D, e.x, e.y + 1, 8, 2, P.gold); box(D, e.x + 1, e.y, 5, 1, P.goldS); box(D, e.x + 7, e.y + 2, 2, 1, P.brownS); },
    act(e) { e.removed = true; e.map.remove(e); giveCurio('feather'); say('A tiny feather made of brass, with a spring for a quill.'); },
});
/* Leica, squeezed into the garden nobody can get into, digs something up and brings it out */
const GARDEN = { x: 43, y: 31, w: 3, h: 2 };
Story.on('tick', () => {
    const l = ent('leica'); if (!l || G.flags.curio_marble) return;
    const [x, y] = tileOf(l);
    if (inRect(x, y, GARDEN)) { if (!l.st.dug) { l.st.dug = true; bark(l, '*dig dig dig*', 3); Sfx.play('push'); Save.soon(); } }
    else if (l.st.dug && l.seen && !World.cutscene) {
        l.st.dug = false;
        scene(async () => { bark(l, 'Woof!', 2); await say('Leica drops something at Dot\'s feet. A glass marble, with a tiny lighthouse inside it.'); giveCurio('marble'); });
    }
});
