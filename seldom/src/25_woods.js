/* the Turnabout Woods: here the edges of the view meet. Walk out of one side and in at the other. */
ISLAND_ADD.push(function woods(m) {
    m.addAt('sign', 33, 38, { text: 'TURNABOUT WOODS. Mind your edges.' });
    m.addAt('squirrel', 30, 41, { name: 'squirrel1' });
    m.addAt('squirrel', 12, 33, { name: 'squirrel2' });
    /* the woodcutters' gates: opened only from the far side */
    m.add('woodgate', 25 * TILE, 34 * TILE, { name: 'gateA', w: 32, h: 16, flag: 'gateA', side: 'west' });
    m.add('rope', 23 * TILE + 4, 33 * TILE + 8, { name: 'ropeA', flag: 'gateA' });
    m.add('woodgate', 14 * TILE, 52 * TILE, { name: 'gateD', w: 16, h: 16, flag: 'gateD', side: 'south' });
    m.add('rope', 15 * TILE + 4, 53 * TILE + 8, { name: 'ropeD', flag: 'gateD' });
    furn(m, 'stump', 8, 33, 18, 8, { say: 'A huge old stump. Somebody carved "WHICH WAY?" into it, and then underneath, "BOTH."' });
    furn(m, 'mushrooms', 19, 31, 16, 6, { solid: false, say: 'A ring of red mushrooms. They look like they\'re about to say something.' });
    furn(m, 'mossrock', 8, 54, 20, 8, { say: 'A mossy stone. "WOODCUTTERS\' REST. Hollow that way. Mind the ants."' });
    furn(m, 'stump', 30, 47, 18, 8, { say: 'A stump with an axe-mark in it. No axe.' });
    m.addAt('sign', 20, 36, { text: 'Carved in the bark: "To go south, go north. You\'ll need to see further than you think. But not TOO far, or you\'ll land in the stream."' });
    /* Ruth, who keeps turning up */
    person(m, 'ruth', 18, 34, { spec: { skin: P.skinS, hair: '#8a3a2a', style: 'pigtails', top: '#5a8a4a', bottom: P.brownS, blush: '#f29a8c' }, display: 'Ruth', voice: { p: 480, w: 'triangle', v: 0.1 }, brain: ruthBrain, talk: ruthTalk });
    /* the traveller in the far north of the woods, mid-step for ninety-nine years */
    person(m, 'rover', 10, 6, { spec: { skin: P.skin, hair: '#5a4a3a', style: 'wide', hat: '#7a5a3a', top: '#8a6a4a', bottom: '#4a4a5a', beard: '#7a6a5a', tall: true }, display: 'Rover', voice: { p: 210, w: 'sawtooth', v: 0.05 }, brain: roverBrain, talk: roverTalk, dir: 'right' });
});
kind('woodgate', {
    w: 32, h: 16, ph: 22, solid: true, fixed: true,
    draw(e, D) {
        if (G.flags[e.flag]) { box(D, e.x - 1, e.y - 8, 3, e.h + 8, '#8a5a34'); box(D, e.x + e.w - 2, e.y - 8, 3, e.h + 8, '#8a5a34'); box(D, e.x + 2, e.y + e.h - 2, e.w - 4, 2, 'rgba(60,40,20,0.35)'); return; }
        for (let x = 0; x < e.w; x += 4) box(D, e.x + x, e.y - 6, 3, e.h + 6, x % 8 ? '#8a5a34' : '#9a6a3a');
        box(D, e.x, e.y - 2, e.w, 2, '#5a3a22'); box(D, e.x, e.y + 7, e.w, 2, '#5a3a22');
    },
    update(e) { e.solid = !G.flags[e.flag]; },
    act(e) {
        if (G.flags[e.flag]) { say('The gate stands open.'); return; }
        const rope = e.map.ents.find(o => o.kind === 'rope' && o.flag === e.flag), d = World.dot;
        say(rope && dist(ecx(rope), ecy(rope), ecx(d), ecy(d)) < 4 * TILE ? 'A woodcutters\' gate, tied shut. The knot\'s on this side: the rope post is right here.' : 'A woodcutters\' gate, tied shut from the other side.');
    },
});
kind('rope', {
    w: 8, h: 6, ph: 18, solid: true, fixed: true,
    draw(e, D) {
        /* a post with a coil of rope and a knot; it glints until pulled */
        box(D, e.x + 2, e.y - 16, 4, 20, P.brownS); box(D, e.x + 1, e.y - 17, 6, 2, P.brownD);
        if (!G.flags[e.flag]) { for (let i = 0; i < 3; i++) box(D, e.x, e.y - 10 + i * 3, 8, 2, i % 2 ? '#e0b878' : '#c99a62'); box(D, e.x + 6, e.y - 4, 2, 6, '#c99a62'); if (Math.floor(G.t * 1.5) % 4 === 0) box(D, e.x + 1, e.y - 11, 1, 1, P.white); }
        else box(D, e.x + 5, e.y - 6, 2, 8, '#c99a62');
    },
    act(e) { if (G.flags[e.flag]) { say('The rope\'s already pulled.'); return; } G.flags[e.flag] = true; Sfx.play('push'); say('Dot pulls the rope. Somewhere nearby, a gate swings open.'); Save.soon(); },
});

/* Ruth: lost in the woods, and not fixed to anywhere, so she wraps round the view like everything loose here */
function ruthBrain(e, dt) {
    const d = World.dot;
    e.st.t = (e.st.t || 0) - dt;
    if (e.st.t <= 0) { e.st.t = 2 + hash2(e.t * 3 | 0, 7, 7) * 2; e.st.dx = hash2(e.t * 5 | 0, 1, 8) < 0.5 ? -1 : 1; }
    if (e.st.t > 1) { moveEnt(e, e.st.dx * 18 * dt, 0); e.moving = true; e.dir = e.st.dx < 0 ? 'left' : 'right'; }
    if (e.wrapped && !e.st.joked) { e.st.joked = true; bark(e, 'Not again!', 2); }
}
async function ruthTalk(e) {
    e.st.n = (e.st.n || 0) + 1;
    if (e.st.n === 1) {
        await say('Oh! Hello. I\'m Ruth. I\'ve been trying to walk home for a week. Every time I walk off one side of things, I come right back in the other.', 'ruth');
        await say('In these woods, the edges are doors. Whatever goes out one side comes in at the other. Even me. ESPECIALLY me.', 'ruth');
        return;
    }
    if (G.flags.gateA) { await say('You found the woodcutters\' rope! Now I can... still not get home, because my home is the other way. Never mind.', 'ruth'); return; }
    await say('If you want to get somewhere in here, look the wrong way, then walk the wrong way. That\'s what I\'ve worked out. It\'s not helped me much.', 'ruth');
    if (G.flags.spyglass) await say('Turning round doesn\'t help, I\'ve tried. Hold X and look past the trees, as far as the view will go. Let go, so it stays. Then walk away from the trees, right out of the edge of what you can see.', 'ruth');
}
function roverBrain(e, dt) {
    if (!e.st.woke) { e.st.woke = true; e.st.walk = 1.4; bark(e, '...and so I said—', 2); }
    if (e.st.walk > 0) { e.st.walk -= dt; moveEnt(e, 20 * dt, 0); e.moving = true; e.dir = 'right'; }
}
async function roverTalk(e) {
    if (G.flags.curio_sandwich) { await say('Ninety-nine years! And I\'d only meant to nip over to the village for lunch. I think I\'ll sit down for a bit.', 'rover'); return; }
    await say('...and so I said, I\'ll just nip over to the village for lunch— oh! Hello! Didn\'t see you there.', 'rover');
    await say('Strange. It feels like I blinked and the trees grew. What year is it? ...Ninety-nine years?! Nobody\'s looked this way in ninety-nine years?', 'rover');
    await say('Well. My sandwich is still fresh, at least. Here, you have it. I seem to have lost my appetite.', 'rover');
    giveCurio('sandwich');
}
/* wind chimes hang here and there in the woods; they play while seen */
kind('chimes', {
    w: 10, h: 4, ph: 24, fixed: true, solid: false,
    draw(e, D) { box(D, ecx(e) - 1, e.y - 24, 2, 4, P.brownS); box(D, e.x, e.y - 20, e.w, 2, P.brownS); for (let i = 0; i < 4; i++) box(D, e.x + 1 + i * 2.5, e.y - 18 + Math.sin(G.t * 3 + i) * 0.6, 1, 6 + i, i % 2 ? P.gold : P.grey); },
});
ISLAND_ADD.push(m => { for (const [x, y] of [[30, 37], [10, 32], [18, 54], [12, 8]]) m.addAt('chimes', x, y, { song: 'woods', name: 'chimes' + x }); });
