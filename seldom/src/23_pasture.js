/* Pan's Pasture: sheep that can't bear to be out of sight, a pen, an orchard, and something very small by the pond */
const PASTURE = { x: 67, y: 27, w: 30, h: 42 };
const PEN = { x: 87, y: 45, w: 5, h: 5 };
NAMES.pan = 'Pan';

ISLAND_ADD.push(function pasture(m) {
    person(m, 'pan', 89, 42, { spec: LOOKS.pan, song: 'pasture', loud: 150, day: [[0, 24, { x: 89, y: 42, dir: 'down' }]], talk: panTalk });
    for (const [n, x, y] of [['dolly', 72, 35], ['lolly', 79, 46], ['molly', 82, 56], ['polly', 93, 36]]) m.addAt('sheep', x, y, { name: n, zone: PASTURE });
    addProp(m, { id: 'pengate', tx: 87, ty: 44, tw: 5, th: 1, fh: 1, draw: drawPenGate });
    house(m, 'panhouse', 86, 30, 4, 3, { tw: 4, th: 3, wall: '#e8d8b0', roof: '#6cbf5a', door: 1, windows: [2, 3], timber: true }, ['island', 0, 0, () => true, () => 'Pan\'s house. It smells strongly of sheep.']);
    addProp(m, { id: 'windmill', tx: 78, ty: 28, tw: 3, th: 3, fh: 2, draw: drawWindmill, update: (p, dt) => { p.st = p.st || {}; p.st.a = (p.st.a || 0) + dt * 0.8; } });
    for (const [x, y] of [[72, 53], [75, 53], [72, 56], [75, 56], [78, 54]]) m.addAt('apple', x, y, { name: 'apple' + x + y });
    m.addAt('sign', 84, 42, { text: 'PAN\'S PEN. Sheep go in. (They do not.)' });
    /* the ants' pond: a twig bridge to the islet, there only if you look closely */
    for (let x = 88; x <= 90; x++) m.add('twig', x * TILE, 56 * TILE + 5, { name: 'ptwig' + x });
    m.add('crown', 91 * TILE + 6, 56 * TILE + 6, { name: 'crown' });
    for (let i = 0; i < 6; i++) m.add('ant', 85 * TILE + i * 5, 57 * TILE + (i % 3) * 3, { name: 'pant' + i });
    m.add('anthill', 86 * TILE, 57 * TILE + 4, { name: 'anthill' });
});

function drawPenGate(D, p) {
    if (G.flags.penOpen) return;
    for (let i = 0; i < p.tw; i++) { const x = (p.tx + i) * TILE; box(D, x, p.ty * TILE + 6, 16, 2, P.white); box(D, x, p.ty * TILE + 11, 16, 2, P.white); box(D, x + 7, p.ty * TILE + 3, 2, 12, '#c08b55'); }
}
function drawWindmill(D, p) {
    const c = windmillBody(), x = p.tx * TILE + 24 - c.width / 2, y = (p.ty + p.th) * TILE - c.height;
    D.img(c, x, y);
    const ctx = D.ctx, cx = D.X(x + 20), cy = D.Y(y + 14), a = (p.st && p.st.a) || 0, s = sailCanvas();
    for (let i = 0; i < 4; i++) {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(a + i * Math.PI / 2);
        ctx.drawImage(s, 0, -2 * D.k, s.width * D.k, s.height * D.k); ctx.restore();
    }
    box(D, x + 18, y + 12, 4, 4, P.brownD);
}

/* sheep: penned ones settle; outside the pasture they forget to worry */
KINDS.sheep.update = (function (orig) {
    return function (e, dt) {
        const [tx, ty] = tileOf(e);
        e.unbound = !!e.penned || !inRect(tx, ty, PASTURE);
        if (!e.penned && inRect(tx, ty, PEN)) { e.penned = true; Sfx.play('chime'); Fx.sparkle(ecx(e), e.y); bark(ent('pan'), penCount() === 4 ? 'All of them!' : 'One in!', 2); Save.soon(); }
        if (e.penned && !inRect(tx, ty, PEN)) e.penned = false;
        orig(e, dt);
        if (e.penned) { e.st.dx = clamp(e.st.dx || 0, -0.3, 0.3); }
    };
})(KINDS.sheep.update);
KINDS.sheep.push = function (e, dir, by) { const [dx, dy] = DIRS[dir]; moveEnt(e, dx * 1.2, dy * 1.2); e.pushed = 0.2; };
KINDS.sheep.act = function (e) {
    const names = { dolly: 'Dolly', lolly: 'Lolly', molly: 'Molly', polly: 'Polly' };
    say(e.penned ? names[e.name] + ' is content.' : names[e.name] + ' baas at you. Then, for some reason, a little bit past you.');
};
function penCount() { return ['dolly', 'lolly', 'molly', 'polly'].filter(n => { const s = ent(n); return s && s.penned; }).length; }

async function panTalk(e) {
    const F = G.flags;
    if (!e.st.met) {
        e.st.met = true;
        await say(F.bridge ? 'Pan, shepherd. Thanks to Bridget\'s bridge, I can come to Lamp Night! If I can ever get this lot into the pen.' : 'Pan, shepherd. How did you... never mind.', 'pan');
        await say('They\'ve gone daft lately. They can\'t bear to be out of sight. Wherever anybody\'s looking, that\'s where they want to be.', 'pan');
        await say('Walk away from them and they come tumbling after, right along the edge of things. I\'ve opened the pen gate. Bring them in, if you can.', 'pan');
        F.penOpen = true; e.map.props.find(p => p.id === 'pengate').fh = 0; e.map.rebuildSolid();
        return;
    }
    const n = penCount();
    if (n < 4) { await say(n ? `${n} of 4 in. They come along behind you, or get shoved by the edge of things. Sheep are like that.` : 'All four are still out. Dolly, Lolly, Molly and Polly. The edge of things, Dot. Use the edge of things.', 'pan'); return; }
    if (!F.loupe) {
        await say('All four! You\'re a natural. Here, Nan always said our family kept a piece of the old lighthouse. Her reading glass. She used it for the tiny print.', 'pan');
        F.loupe = true; Cam.zmax = Math.max(Cam.zmax, 3); Sfx.play('get'); Fx.flash = 0.4;
        await say('Dot got the Loupe!', null, { name: false });
        await say('Nan used to say there\'s a whole world down there, if you look close enough. Ants and that. She talked to the ants. Lovely woman.', 'pan');
        UI.showHint('E (or the mouse wheel) to look closer. Q to look farther again.', 10);
        Save.write(true);
        return;
    }
    await say('The flock\'s happy. Mind you, they keep looking up. Not at me. At something.', 'pan');
}
Story.on('restore', () => { if (G.flags.penOpen) { const m = MAPS.island, p = m.props.find(q => q.id === 'pengate'); if (p) { p.fh = 0; m.rebuildSolid(); } } });

/* the Ant Crown: tiny (only there up close), on the islet the ants' twig bridge reaches */
kind('crown', {
    w: 4, h: 3, ph: 4, tiny: true, fixed: true,
    draw(e, D) { box(D, e.x, e.y, 4, 2, P.gold); box(D, e.x, e.y - 1, 1, 1, P.gold); box(D, e.x + 2, e.y - 1, 1, 1, P.gold); if (Math.floor(G.t * 3) % 2) box(D, e.x + 1, e.y - 2, 1, 1, P.white); },
    act(e) { e.removed = true; e.map.remove(e); giveCurio('crown'); say('A crown smaller than a crumb. The ants seem to want you to have it.'); },
});
kind('anthill', {
    w: 14, h: 6, ph: 8, fixed: true, solid: false,
    draw(e, D) { box(D, e.x, e.y, 14, 6, '#a8703f'); box(D, e.x + 3, e.y - 3, 8, 3, '#a8703f'); box(D, e.x + 6, e.y - 3, 2, 2, P.ink); },
    act() { if (Cam.zoom >= TINY_ZOOM) say('Tiny voices: "Big one! Big one is looking! Quick, show it the crown!"'); else say('An anthill. You can\'t see any ants.'); },
});
KINDS.ant.update = function (e, dt) { e.x += e.vx * dt; if (Math.abs(e.x - e.ox) > 22) e.vx = -e.vx; };
