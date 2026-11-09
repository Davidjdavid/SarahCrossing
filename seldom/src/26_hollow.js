/* the Hollow: a faded old village. By night, the Faded: people the island stopped looking at. */
const FADED_LOOKS = [
    { skin: P.skin, hair: '#8a6a4a', style: 'bob', top: '#c97a8a', bottom: '#5a4a6a' },
    { skin: P.skinD, hair: '#2a1a1a', style: 'short', top: '#7a9a5a', bottom: '#4a4a5a', tall: true },
    { skin: P.skinS, hair: '#d8c8a8', style: 'bun', top: '#8a7ac9', bottom: '#4a3a5a', skirt: '#4a3a5a' },
    { skin: P.skin, hair: '#5a3a2a', style: 'cap', hat: '#c9a04a', top: '#5a8ac9', bottom: '#3a3a4a', tall: true },
];
ISLAND_ADD.push(function hollow(m) {
    m.addAt('sign', 16, 58, { text: 'THE HOLLOW. Once called Lowmeadow. Nobody remembers why it changed.' });
    /* the old gate out to the harbor: tied shut from this side */
    m.add('woodgate', 35 * TILE, 66 * TILE, { name: 'gateH', w: 16, h: 16, flag: 'gateH' });
    m.add('rope', 33 * TILE + 4, 65 * TILE + 8, { name: 'ropeH', flag: 'gateH' });
    /* the ants' bridge over the black brook */
    m.add('twig', 28 * TILE, 60 * TILE + 5, { name: 'htwig1', w: 16, h: 6 });
    m.add('twig', 28 * TILE, 61 * TILE + 5, { name: 'htwig2', w: 16, h: 6 });
    m.add('anthill', 29 * TILE + 4, 58 * TILE + 6, { name: 'hanthill' });
    for (let i = 0; i < 4; i++) m.add('ant', 27 * TILE + i * 5, 59 * TILE + 4 + (i % 2) * 3, { name: 'hant' + i });
    /* the chapel in its yard */
    addProp(m, { id: 'chapel', tx: 14, ty: 62, tw: 8, th: 5, open: [[4, 4]], draw: drawChapel });
    m.doors = m.doors || [];
    m.doors.push({ x: 18, y: 66, to: 'chapel', tx: 6, ty: 9, tdir: 'up', dir: 'up', locked: () => !Light.night(), lockedSay: () => 'The chapel door is shut. A note pinned to it, in very faint ink: "Night service only. After the lamps are lit and the dark is properly dark."' });
    /* the Faded: four of them stand in the yard's gateway, waiting to be seen */
    for (let i = 0; i < 4; i++) m.addAt('faded', 16 + i, 70, { name: 'faded' + i, dir: 'down', song: i === 1 ? 'hollow' : null });
    for (const [x, y, n] of [[8, 66, 'drift1'], [28, 69, 'drift2'], [26, 73, 'drift3']]) m.addAt('faded', x, y, { name: n, drift: true });
});
kind('faded', {
    w: 10, h: 6, ph: 16, wild: true, figure: true, solid: true,
    present(e) { return Light.night() || e.restored; },
    draw(e, D) {
        if (e.restored) { const i = Math.floor(e.ox / 16) % FADED_LOOKS.length; D.person('faded' + i, FADED_LOOKS[i], e, e.moving ? 1 : 0); return; }
        D.thing(e, 'ghost', Math.floor(e.t * 3) % 2, e.dir === 'left', { bob: Math.sin(e.t * 2.4 + e.ox) * 1.5, alpha: 0.85 });
    },
    update(e, dt) {
        if (e.drift) { const a = e.t * 0.5 + e.ox; e.x = e.ox + Math.sin(a) * 18; e.y = e.oy + Math.cos(a * 0.7) * 8; e.dir = Math.cos(a) > 0 ? 'right' : 'left'; }
    },
    onSeen(e) { if (!e.drift) G.flags.seenFaded = true; },
    act(e) {
        const lines = ['A faded figure. It looks up at you, very pleased to be seen.', '"Are you looking at us? Really looking? Oh, how lovely."', '"We\'re waiting our turn to be seen. It\'s a long queue."', '"Shh. The chapel\'s for evening service. We\'re the service. Sort of."'];
        say(lines[(e.st.n = (e.st.n || 0) + 1) % lines.length]);
    },
    light() { return { r: 22, up: 10, c: 'rgba(160,190,255,A)' }; },
});
function drawChapel(D, p) {
    const c = spr('chapel', () => {
        const g = grid(128, 100);
        rect(g, 8, 40, 112, 59, '#a8a0b8'); shade(g, '#a8a0b8', '#8a8298', x => x > 100);
        for (let y = 0; y < 42; y++) { const inset = Math.round((42 - y) * 0.2); rect(g, 4 + inset, y + 4, 120 - inset * 2, 1, y % 5 === 4 ? '#4a3a5a' : '#5e4a70'); }
        rect(g, 56, 0, 16, 40, '#a8a0b8'); for (let y = 0; y < 12; y++) rect(g, 64 - Math.round(y * 0.7) - 1, y - 8 + 8, Math.round(y * 1.4) + 2, 1, '#4a3a5a');
        ell(g, 64, 22, 5, 5, '#e8d0ff'); px(g, 64, 22, '#a080d0');
        rect(g, 58, 70, 12, 29, '#3a2a3a'); ell(g, 64, 70, 6, 5, '#3a2a3a');
        for (const x of [22, 40, 88, 106]) { rect(g, x - 4, 54, 8, 14, '#5a4a7a'); ell(g, x, 54, 4, 4, '#5a4a7a'); px(g, x, 58, '#c8b0f0'); }
        return toCanvas(outline(g));
    });
    D.img(c, p.tx * TILE, (p.ty + p.th) * TILE - c.height);
}

/* inside the chapel: Mrs. Sepia and the Prism */
room('chapel', [
    'KKKKKKKKKKKKK',
    'KFFFFFFFFFFFK',
    'KFFFFFFFFFFFK',
    'KFFFFFFFFFFFK',
    'KFFFFFFFFFFFK',
    'KFFFFFFFFFFFK',
    'KFFFFFFFFFFFK',
    'KFFFFFFFFFFFK',
    'KFFFFFFFFFFFK',
    'KFFFFFFFFFFFK',
    'KKKKKKDKKKKKK',
], {
    exit: ['island', 18, 67],
    def: { dim: '#9890c8' },
    init(m) {
        furn(m, 'altar', 5, 1, 40, 8, { name: 'altar', onAct: prismTake });
        furn(m, 'organ', 9, 1, 34, 8, { say: 'An old organ. When you look at it, faintly, it plays.' });
        m.add('organ', 9 * TILE, 1 * TILE + 8, { name: 'organsrc', song: 'hollow', w: 34, h: 8, loud: 400 });
        for (let y = 4; y <= 8; y += 2) { furn(m, 'pew', 2, y, 48, 6, { say: 'A pew. Someone faint is sitting on it, very politely.' }); furn(m, 'pew', 8, y, 48, 6, { say: 'A pew, worn smooth by people who were not, strictly, there.' }); }
        person(m, 'sepia', 6, 3, { spec: { skin: '#e4ecff', hair: '#8890b8', style: 'bun', top: '#b8c0e0', bottom: '#a0a8d0', skirt: '#a0a8d0', tall: true, glasses: '#8890b8' }, alpha: 0.8, display: 'Mrs. Sepia', voice: { p: 330, w: 'sine', v: 0.12, wob: 0.05 }, brain: e => { e.dir = 'down'; }, talk: sepiaTalk, ghostly: true });
    },
});
kind('organ', { w: 34, h: 8, ph: 30, fixed: true, draw() { } });
async function sepiaTalk(e) {
    const F = G.flags;
    if (!F.prism) {
        await say('Oh! Someone\'s looking at us. Really looking. Do you know how long it\'s been?', 'sepia');
        await say('We\'re the Faded. When the light went out, the Eye stopped coming down this way, and so we... faded. We\'re still here. Just less so.', 'sepia');
        await say('The glass on the altar was the last piece of the great lens. Take it to the lighthouse, child. If the light is ever lit again, it would see us. Every night.', 'sepia');
        return;
    }
    await say('The Prism cuts the looking in two. Where the halves meet, two places are one. That\'s how the old keepers went about, you know. Very efficient.', 'sepia');
}
async function prismTake(e) {
    if (G.flags.prism) { say('The altar is bare now, except for a little dust shaped like a triangle.'); return; }
    if (!ent('sepia').st.spoke) { ent('sepia').st.spoke = true; await say('Oh! Someone\'s looking at us. Take it, child. It was the last piece of the great lens. If the light is ever lit again, it would see us. Every night.', 'sepia'); }
    G.flags.prism = true; Sfx.play('get'); Fx.flash = 0.5;
    await say('Dot got the Prism!', null, { name: false });
    await say('Go on, try it. Cut the looking in two.', 'sepia');
    UI.showHint('Tab: split the view in two. Hold X to move the other half. Tab again to put it back.', 14);
    Save.write(true);
}
