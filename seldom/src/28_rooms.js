/* the insides of things. A room is its own little map; while you're in it, the whole island is out of view. */
function room(id, rows, o) {
    MAP_MAKERS.push(() => {
        const legend = Object.assign({
            D: { under: 'F', spawn: (m, x, y) => { m.doors = m.doors || []; m.doors.push({ x, y, to: o.exit[0], tx: o.exit[1], ty: o.exit[2], tdir: 'down', dir: 'down' }); } },
        }, o.legend || {});
        return new GameMap(Object.assign({ id, rows, fill: 'x', outside: 'x', indoor: true, bg: '#120c18', legend, init: o.init }, o.def || {}));
    });
}

/* ---- home: Dot and Ansel's house ---- */
room('home', [
    'KKKKKKKKKKKK',
    'KFFFFFFFFFFK',
    'KFFFFFFFFFFK',
    'KFFFFFrrFFFK',
    'KFFFFFrrFFFK',
    'KFFFFFFFFFFK',
    'KFFFFFFFFFFK',
    'KKKKDKKKKKKK',
], {
    exit: ['island', 39, 49],
    init(m) {
        furn(m, 'bed', 1, 2, 22, 10, { say: 'Dot\'s bed. The blanket has a lighthouse on it.' });
        furn(m, 'shelf', 4, 1, 30, 8, { name: 'curioshelf', say: () => curioShelfText(), song: 'lullaby', loud: 400 });
        furn(m, 'fireplace', 8, 1, 28, 8, {});
        furn(m, 'table', 8, 4, 26, 10, { say: 'A table with two chairs. One of them is always Ansel\'s.' });
        furn(m, 'window', 2, 0, 16, 2, { solid: false, say: 'The window faces the harbor.' });
        furn(m, 'chest', 10, 6, 14, 8, { say: () => G.flags.festival ? 'Ansel\'s old keeper things. A logbook: "Day 1. Lit the lamp. The island hums along nicely by itself."' : 'Ansel\'s old keeper\'s chest. Locked, as always, till Lamp Night.' });
        person(m, 'ansel_home', 9, 3, { spec: LOOKS.ansel, display: 'Ansel', voice: VOICES.ansel, brain: () => { }, when: () => G.flags.festival, talk: actTwoAnsel, dir: 'down' });
    },
});
NAMES.ansel_home = 'Ansel'; VOICES.ansel_home = VOICES.ansel;

/* ---- the observatory: Iris ---- */
room('observatory', [
    'KKKKKKKKKKK',
    'KFFFFFFFFFK',
    'KFFFFFFFFFK',
    'KFFFFFFFFFK',
    'KFFFFFFFFFK',
    'KFFFFFFFFFK',
    'KFFFFFFFFFK',
    'KFFFFFFFFFK',
    'KKKKKDKKKKK',
], {
    exit: ['island', 40, 36],
    def: { dim: '#b8b8e0' },
    init(m) {
        furn(m, 'telescope', 5, 2, 16, 8, { say: () => irisScope() });
        furn(m, 'chart', 1, 1, 40, 4, { solid: true, say: 'A star chart, covered in Iris\'s notes. Next to most of the stars: "didn\'t move (wasn\'t looking)".' });
        furn(m, 'shelf', 8, 1, 30, 8, { say: 'Books. "Hours and Who Keeps Them". "A Field Guide to Things You Can\'t See". "Lighthouses of the Southern Isles".' });
        person(m, 'iris', 5, 4, { spec: LOOKS.iris, display: 'Iris', brain: irisBrain, talk: irisTalk, dir: 'down' });
    },
});
function irisBrain(e) { e.dir = 'down'; if (Light.night() && !G.flags.festival && lampReady()) e.hidden = true; else e.hidden = false; }
async function irisTalk(e) {
    const F = G.flags;
    if (!e.st.met) {
        e.st.met = true;
        await say('Dot. Have you noticed? Things only seem to happen where somebody\'s looking.', 'iris');
        await say('I chart the stars. They only move while I watch. Last week I looked away for an hour, and when I looked back, they hadn\'t moved at all.', 'iris');
        await say('Anyway. If you\'re ever stuck, ask me. I like puzzles. I\'m less good at doing things.', 'iris');
        return;
    }
    const r = await ask('Need something?', ['Any ideas?', 'What are you working on?', 'Never mind'], 'iris');
    if (r === 0) await say(hintNow(), 'iris');
    if (r === 1) await say(irisMusing(), 'iris');
}
function irisMusing() {
    const F = G.flags;
    if (!F.festival) return 'The Great Clock. It keeps the island\'s hour, but clocks can\'t tell time by themselves, you know. Somebody has to watch them.';
    const aside = irisAside(); if (aside && Math.random() < 0.5) return aside;
    if (!F.prism) return 'Where does the looking come from, Dot? Not your eyes. You\'re in the picture too. I\'ve been trying to work out who\'s holding the spyglass.';
    return 'The lighthouse was the island\'s own eye. With it lit, we wouldn\'t need anyone else to look at us. Strange thought, isn\'t it?';
}
function irisScope() {
    if (Light.night()) return 'Through the telescope: stars, and far off to the north-east, the dark tower of the lighthouse.';
    return 'Through the telescope: the sky. It\'s daytime, so mostly sky.';
}

/* ---- the bakery: Mrs. Crumb and the oven that bakes while watched ---- */
room('bakery', [
    'KKKKKKKKKKKK',
    'KkkkkkkkkkkK',
    'KkkkkkkkkkkK',
    'KkkkkkkkkkkK',
    'KkkkkkkkkkkK',
    'KkkkkkkkkkkK',
    'KkkkkkkkkkkK',
    'KKKKKDKKKKKK',
], {
    exit: ['island', 60, 39],
    init(m) {
        for (let x = 1; x <= 10; x++) if (x !== 9) furn(m, x % 3 === 1 ? 'breadcounter' : 'counter', x, 3, 16, 8, { say: 'Bread, buns, and a smell that makes the whole room cozy.' });
        furn(m, 'window', 3, 0, 16, 2, { solid: false, say: 'The window looks out on the square. You can just see the Great Clock.' });
        furn(m, 'plant', 10, 6, 14, 8, { say: 'A potted fern, slightly floury.' });
        furn(m, 'oven', 7, 1, 22, 10, { name: 'oven', say: () => ovenText() });
        furn(m, 'barrel', 1, 1, 12, 8, { say: 'Flour.' });
        furn(m, 'barrel', 2, 1, 12, 8, { say: 'More flour.' });
        person(m, 'crumb', 5, 2, { spec: LOOKS.crumb, display: 'Mrs. Crumb', brain: crumbBrain, talk: crumbTalk, dir: 'down' });
    },
});
function crumbBrain(e) { e.dir = 'down'; }
KINDS.furn.update = function (e, dt) {
    if (e.name === 'oven' && G.flags.cakeBaking && !G.flags.cake) {
        e.st.on = true; e.st.p = Math.min(1, (e.st.p || 0) + dt / 24);
        if (Math.random() < 0.05) Fx.add({ x: ecx(e) + (Math.random() - 0.5) * 10, y: e.y - 16, vx: 0, vy: -8, life: 1.2, c: '#e8e2d8', r: 1.4 });
        if (e.st.p >= 1) { G.flags.cake = true; e.st.on = false; Sfx.play('chime'); const c = ent('crumb'); if (c) bark(c, 'Ding! Done!', 3); Save.soon(); }
    }
};
function ovenText() {
    const o = ent('oven');
    if (G.flags.cake) return 'The oven\'s cooling. It smells like Lamp Night.';
    if (G.flags.cakeBaking) return `The cake is baking. About ${Math.round((o.st.p || 0) * 100)} percent done.`;
    return 'A big stone oven, warm even when it isn\'t on.';
}
async function crumbTalk(e) {
    const F = G.flags;
    if (F.cake && !F.festival && !e.st.gold) { e.st.gold = true; await say('The cake\'s ready! You know, my granny swore that hen once laid a golden egg. The seventh one of the day, she said. Seventh!', 'crumb'); return; }
    if (F.cake) { await say(F.festival ? (invHas('egg') ? 'More eggs? Bless you. I\'ll make a quiche.' : 'Best cake I ever baked. Watched every minute of it.') : 'The cake\'s ready! I\'ll bring it to the square tonight. If it ever is tonight.', 'crumb'); if (F.festival && invHas('egg')) invTake('egg', World.inv.egg); return; }
    if (F.cakeBaking) { await say('It\'s in! Now don\'t take your eyes off that oven. A watched cake bakes, that\'s what my mother said.', 'crumb'); return; }
    const n = World.inv.egg || 0;
    if (n >= 3) {
        invTake('egg', 3); F.eggsGiven = true; F.cakeBaking = true;
        await say('Three eggs! Wonderful! In it goes...', 'crumb');
        await say('Now don\'t take your eyes off that oven. A watched cake bakes, that\'s what my mother said. Bless her, she was very literal.', 'crumb');
        return;
    }
    if (!e.st.met) {
        e.st.met = true;
        await say('Dot! Just who I need. The Lamp Night cake needs three eggs, and my hen\'s only ever got the one.', 'crumb');
        await say('She lays one egg, and that\'s it. Every time I look in the hen run, there\'s the one egg. The run\'s just outside, by the east road.', 'crumb');
        return;
    }
    await say(n ? `That's ${n}. I need three. Just the one in the run? Same as always.` : 'Three eggs, Dot. The hen run\'s just outside, by the east road.', 'crumb');
}
Story.on('entered', (m) => {
    /* after Lamp Night, the folk who live indoors go home */
    if (!G.flags.festival) return;
    for (const [n, room] of [['crumb', 'bakery'], ['iris', 'observatory']]) {
        const e = ent(n); if (!e || e.map.id === room || e.map === World.map) continue;
        e.map.remove(e); e.map = MAPS[room]; MAPS[room].ents.push(e); e.x = e.ox; e.y = e.oy; e.hold = false; e.hidden = false;
    }
});

/* ---- curios: little secrets, kept on the shelf at home ---- */
const CURIOS = {
    note: { name: 'The Last Note', text: 'The end of the band\'s song, written on a scrap. Nobody had ever heard it.' },
    goldegg: { name: 'The Golden Egg', text: 'The seventh egg. Mrs. Crumb\'s granny was right.' },
    crown: { name: 'The Ant Crown', text: 'A crown smaller than a crumb. You have to look very closely to see it at all.' },
    sandwich: { name: 'The Old Sandwich', text: 'A sandwich packed ninety-nine years ago. Still fresh: nobody was looking.' },
    feather: { name: 'The Clockwork Feather', text: 'Dropped by the tower\'s little bird, which only comes out at midnight. For whoever is watching.' },
    marble: { name: 'The Lost Marble', text: 'Leica found it in a garden nobody can get into. She was very pleased about it.' },
};
function giveCurio(id) {
    if (G.flags['curio_' + id]) return;
    G.flags['curio_' + id] = true;
    Sfx.play('get'); Fx.flash = 0.3;
    Fx.toast('Found a curio: ' + CURIOS[id].name);
    Save.soon();
}
function curioCount() { return Object.keys(CURIOS).filter(k => G.flags['curio_' + k]).length; }
function curioShelfText() {
    const got = Object.keys(CURIOS).filter(k => G.flags['curio_' + k]);
    if (!got.length) return 'Dot\'s shelf of curious things. Empty, so far. There are six spaces.';
    return 'Dot\'s shelf of curious things (' + got.length + ' of 6): ' + got.map(k => CURIOS[k].name).join(', ') + '.';
}
