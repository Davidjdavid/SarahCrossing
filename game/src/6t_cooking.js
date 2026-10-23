/* ---- 6t_cooking.js ---- */
/* The kitchen: cooking is a little Cooking Mama-style game. Every dish is a few steps, and the steps are shared between
   dishes: every rice dish starts by rinsing and cooking the rice, every noodle dish boils the noodles, batters crack an
   egg and whisk... There are eight kinds of step (chop, stir, heat, pour, mash, top, roll, timing). The first time
   Sarah cooks a dish she plays it through; after that she can Quick cook it, or play again for a better medal. A gold
   medal makes a double portion. Nobody ever fails: the worst you can do is "rustic". */
const COOK_W = 160, COOK_H = 128;
const CK_MEDALS = { bronze: 1, silver: 2, gold: 3 };
const CK_NAME = { clam_live: 'clams', eggs: 'egg', greenonion: 'green onion', thaibasil: 'basil', coconutmilk: 'coconut milk', soysauce: 'soy sauce',
    creamcheese: 'cream cheese', bokchoy: 'bok choy', moonflour: 'moon flour', sesame: 'sesame', cherry: 'cherries', chili: 'chilies',
    lychee: 'lychees', peanuts: 'peanuts', salt: 'salt', edamame: 'edamame', shrimp: 'shrimp', lobster: 'lobster' };
function ckName(id) { return CK_NAME[id] || (ITEMS[id] ? ITEMS[id].name.toLowerCase() : id); }
const CK_COL = {
    rice: '#fbf8f0', salmon: '#f28a6b', tuna: '#d9475a', eel: '#8a5a3a', octopus: '#e07a8a', lobster: '#e04a3a', clam_live: '#f0d8b8',
    shrimp: '#f59a6b', tofu: '#fbf5e6', chili: '#e0303a', greenonion: '#6ac04a', cucumber: '#4f9a3f', carrot: '#f08a2a',
    bokchoy: '#8ad06a', broccoli: '#3f8a3a', eggplant: '#6a3a8a', tomato: '#e0403a', mango: '#ffc040', peach: '#ffa98a',
    apple: '#e8505a', cherry: '#d8283f', lychee: '#fbeee8', edamame: '#7acc5e', thaibasil: '#4f9a3f', soysauce: '#5a2a14',
    coconutmilk: '#fbf6ec', cream: '#fffaf0', flour: '#fbf5e6', sugar: '#ffffff', moonflour: '#e6dcff', eggs: '#ffd84a',
    cocoa: '#6b3f25', creamcheese: '#fff8e8', sesame: '#f4e8c8', peanuts: '#c9954f', noodles: '#f4d890', nori: '#2a4a2a', salt: '#ffffff',
};
function ckCol(id) { return CK_COL[id] || '#e8c890'; }

/* ---------------------------------------------------------------- the steps, shared between dishes */
const CK = {
    rinse: { m: 'mash', v: 'rinse', t: 'Rinse the rice', ing: 'rice', goal: 16 },
    cookRice: { m: 'heat', v: 'pot', t: 'Cook the rice', ing: 'rice', zone: [0.42, 0.66] },
    noodles: { m: 'heat', v: 'boil', t: 'Boil the noodles', ing: 'noodles', zone: [0.58, 0.8] },
    crack: { m: 'timing', v: 'crack', t: 'Crack an egg', ing: 'eggs', n: 1 },
    whisk: { m: 'mash', v: 'whisk', t: 'Whisk it up', ing: 'eggs', goal: 18 },
    flour: { m: 'pour', v: 'bag', t: 'Measure the flour', ing: 'flour' },
    wok: { m: 'stir', v: 'wok', t: 'Toss it in the wok', turns: 4 },
    stir: { m: 'stir', v: 'pot', t: 'Stir the pot', turns: 4 },
    toss: { m: 'stir', v: 'bowl', t: 'Toss it together', turns: 3 },
    bake: { m: 'heat', v: 'oven', t: 'Bake it', zone: [0.5, 0.72] },
    simmer: { m: 'heat', v: 'boil', t: 'Let it simmer', zone: [0.36, 0.58] },
    knead: { m: 'mash', v: 'knead', t: 'Knead the dough', ing: 'flour', goal: 18 },
    beat: { m: 'mash', v: 'whisk', t: 'Beat the cream cheese', ing: 'creamcheese', goal: 18 },
    shape: { m: 'roll', v: 'shape', t: 'Shape it', goal: 10 },
    roll: { m: 'roll', v: 'mat', t: 'Roll it up', goal: 12 },
    flip: { m: 'timing', v: 'flip', t: 'Flip it', n: 2 },
};
const CK_PARTS = { RICE: ['rinse', 'cookRice'], NOODLES: ['noodles'], BATTER: ['flour', 'crack', 'whisk'] };
const ckChop = (ing, t, n) => ({ m: 'chop', v: 'chop', ing, t: t || `Chop the ${ckName(ing)}`, n: n || 4 });
const ckSlice = (ing, t) => ({ m: 'chop', v: 'slice', ing, t: t || `Slice the ${ckName(ing)}`, n: 3 });
const ckCube = ing => ({ m: 'chop', v: 'cube', ing, t: `Cube the ${ckName(ing)}`, n: 4 });
const ckPour = (ing, t) => ({ m: 'pour', v: 'bottle', ing, t: t || `Pour in the ${ckName(ing)}` });
const ckTop = (ing, t, n, base) => ({ m: 'top', v: 'top', ing, t: t || `Add the ${ckName(ing)}`, n: n || 3, base });
const ckHeat = (v, t, ing, zone) => ({ m: 'heat', v, t, ing, zone: zone || [0.5, 0.72] });
const ckAs = (key, t, more) => Object.assign({}, CK[key], { t }, more || {});
const COOK_PLANS = {
    nigiri: ['RICE', ckSlice('salmon'), ckAs('shape', 'Shape the nigiri')],
    tuna_roll: ['RICE', ckSlice('tuna'), ckAs('roll', 'Roll the maki')],
    spicy_tuna: ['RICE', ckChop('chili'), ckAs('roll', 'Roll the maki')],
    unagi_don: ['RICE', ckHeat('grill', 'Grill the eel', 'eel', [0.52, 0.74]), ckPour('soysauce', 'Drizzle the sauce')],
    ahi_poke: ['RICE', ckCube('tuna'), ckTop('greenonion', 'Sprinkle the green onion', 3, '#fbf8f0')],
    salmon_poke: ['RICE', ckCube('salmon'), ckTop('sesame', 'Sprinkle the sesame', 4, '#fbf8f0')],
    pad_thai: ['NOODLES', 'crack', 'wok', ckTop('peanuts', 'Sprinkle the peanuts', 3, '#f4d890')],
    green_curry: [ckChop('eggplant'), ckChop('chili'), ckPour('coconutmilk'), ckAs('stir', 'Stir the curry')],
    mango_sticky: ['RICE', ckSlice('mango'), ckPour('coconutmilk', 'Drizzle the coconut milk')],
    mapo_tofu: [ckCube('tofu'), ckChop('chili'), 'wok'],
    dumplings: ['knead', ckChop('bokchoy'), ckAs('shape', 'Pleat the dumplings', { v: 'fold' }), ckHeat('steam', 'Steam them', 'flour', [0.45, 0.68])],
    kungpao: [ckCube('tofu'), 'wok', ckTop('peanuts', 'Toss in the peanuts', 3, '#e8c890')],
    chili_crisp: [ckChop('chili', 'Mince the chilies', 5), ckHeat('fry', 'Fry the chilies', 'chili', [0.55, 0.74]), ckTop('sesame', 'Sprinkle the sesame', 4, '#c0301a')],
    fried_rice: ['RICE', 'crack', 'wok'],
    truffles: [ckHeat('melt', 'Melt the chocolate', 'cocoa', [0.34, 0.56]), ckPour('coconutmilk'), ckAs('shape', 'Roll the truffles')],
    cheesecake: ['beat', 'crack', 'bake'],
    cherry_cheesecake: ['beat', 'bake', ckTop('cherry', 'Top with cherries', 3, '#fff4dc')],
    choc_cheesecake: ['beat', ckHeat('melt', 'Melt the chocolate', 'cocoa', [0.34, 0.56]), 'bake'],
    fruit_salad: [ckSlice('peach'), ckSlice('apple'), ckTop('cherry', 'Add the cherries', 3, '#ffa98a'), 'toss'],
    stir_fry: [ckChop('bokchoy'), ckChop('broccoli'), ckChop('carrot'), 'wok'],
    cuke_salad: [{ m: 'mash', v: 'smash', t: 'Smash the cucumber', ing: 'cucumber', goal: 14 }, ckChop('chili'), 'toss'],
    edamame_bowl: [ckHeat('boil', 'Boil the edamame', 'edamame', [0.58, 0.8]), ckTop('salt', 'Sprinkle some salt', 4, '#7acc5e'), 'toss'],
    lychee_ice: [{ m: 'mash', v: 'shave', t: 'Shave the ice', ing: 'sugar', goal: 18 }, ckTop('lychee', 'Add the lychees', 3, '#e8f6ff'), ckPour('sugar', 'Drizzle the syrup')],
    tom_yum: [ckHeat('boil', 'Boil the broth', 'thaibasil', [0.58, 0.8]), ckChop('chili'), ckTop('shrimp', 'Add the shrimp', 3, '#f0a040'), ckAs('stir', 'Stir the soup')],
    lobster_roll: [ckHeat('boil', 'Boil the lobster', 'lobster', [0.58, 0.8]), ckChop('lobster'), ckAs('toss', 'Mix in the cream'), ckTop('lobster', 'Fill the rolls', 3, '#e8b060')],
    chowder: [ckChop('clam_live', 'Chop the clams'), ckPour('cream'), 'stir', 'simmer'],
    gingerbread: ['flour', 'crack', { m: 'roll', v: 'pin', t: 'Roll out the dough', goal: 10 }, 'bake'],
    mac_cheese: ['NOODLES', ckPour('cream'), ckAs('stir', 'Stir in the cheese')],
    tomato_soup: [ckChop('tomato'), 'simmer', ckPour('cream', 'Swirl in the cream')],
    creme_brulee: ['crack', 'whisk', 'bake', ckHeat('torch', 'Torch the sugar', 'sugar', [0.55, 0.76])],
    ramen: ['NOODLES', 'crack', ckChop('greenonion'), ckPour('soysauce', 'Add the soy sauce')],
    mochi: ['RICE', { m: 'mash', v: 'pound', t: 'Pound the mochi', ing: 'rice', goal: 20 }, ckAs('shape', 'Shape the mochi')],
    takoyaki: [ckPour('flour', 'Pour the batter'), ckChop('octopus'), ckAs('flip', 'Turn the takoyaki', { v: 'turn', n: 3 })],
    pancakes: ['BATTER', ckAs('flip', 'Flip the pancakes')],
    mooncakes: ['knead', { m: 'mash', v: 'press', t: 'Press into the mold', ing: 'moonflour', goal: 12 }, 'bake'],
    shortcake: ['crack', 'whisk', 'bake', ckTop('cherry', 'Top with cherries', 3, '#fffaf0')],
};
function cookPlan(rid) {
    const r = RECIPES.find(q => q.id === rid);
    const plan = COOK_PLANS[rid] || [ckChop(r ? Object.keys(r.need)[0] : 'carrot'), 'toss'];
    const out = [];
    for (const p of plan) {
        if (typeof p !== 'string') out.push(p);
        else if (CK_PARTS[p]) for (const k of CK_PARTS[p]) out.push(CK[k]);
        else out.push(CK[p]);
    }
    return out;
}
const CK_BTN = { chop: 'CHOP', stir: 'STIR', heat: 'HEAT', pour: 'POUR', top: 'DROP', roll: 'ROLL', mash: 'TAP!', timing: 'NOW!' };
const CK_MASH_BTN = { rinse: 'SWISH', whisk: 'WHISK', knead: 'KNEAD', pound: 'POUND', shave: 'SHAVE', smash: 'SMASH', press: 'PRESS' };
const CK_TIME_BTN = { crack: 'CRACK', flip: 'FLIP', turn: 'TURN' };
function ckHow(sp) {
    const T = G.touchUsed, key = T ? 'Tap' : 'Press Space';
    switch (sp.m) {
        case 'chop': return T ? 'Tap CHOP when the knife is right over a dotted line.' : 'Press Space when the knife is right over a dotted line.';
        case 'stir': return T ? 'Draw circles on the screen with your finger! Round and round.' : 'Press \u2190 \u2191 \u2192 \u2193 around and around (or draw circles with the mouse).';
        case 'heat': return T ? 'Hold HEAT to turn it up, let go to cool it. Keep the needle in the green!' : 'Hold Space to turn up the heat, let go to cool it. Keep the needle in the green!';
        case 'pour': return T ? 'Hold POUR and let go right at the gold line. It keeps dripping a little!' : 'Hold Space to pour. Let go right at the gold line. It keeps dripping a little!';
        case 'mash': return `${key} as fast as you can!`;
        case 'top': return T ? 'Tap DROP to land it right on a sparkle.' : 'Press Space to drop it right on a sparkle.';
        case 'roll': return T ? 'Tap \u25c0 and \u25b6 one after the other. Left, right, left, right!' : 'Press \u2190 and \u2192 one after the other. Left, right, left, right!';
        case 'timing': return sp.v === 'crack' ? `${key} when the egg is over the green part of the bar.` : `${key} when it's golden: the green part of the bar.`;
    }
    return '';
}

/* ---------------------------------------------------------------- drawing helpers (crisp pixel shapes) */
function ckRect(g, x, y, w, h, col) { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); }
function ckEll(g, cx, cy, rx, ry, col) {
    g.fillStyle = col;
    const n = Math.ceil(ry);
    for (let y = -n; y <= n; y++) {
        const k = 1 - (y * y) / (ry * ry);
        if (k < 0) continue;
        const w = rx * Math.sqrt(k);
        g.fillRect(Math.round(cx - w), Math.round(cy + y), Math.max(1, Math.round(2 * w)), 1);
    }
}
function ckSpr(g, name, cx, cy, k) {
    const f = Assets.frames[name];
    if (!f) return;
    const [sx, sy, w, h] = f;
    g.drawImage(Assets.atlas, sx, sy, w, h, Math.round(cx - (w * k) / 2), Math.round(cy - (h * k) / 2), w * k, h * k);
}
function ckLine(g, x0, y0, x1, y1, col, w) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    g.fillStyle = col;
    for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + ((x1 - x0) * i) / n - (w || 1) / 2), Math.round(y0 + ((y1 - y0) * i) / n - (w || 1) / 2), w || 1, w || 1);
}
function ckSparkle(g, x, y, t, col) {
    const k = (t >> 3) % 4;
    g.fillStyle = col || '#ffffff';
    g.fillRect(x, y - 1 - (k === 0 ? 1 : 0), 1, 3 + (k === 0 ? 2 : 0));
    g.fillRect(x - 1 - (k === 2 ? 1 : 0), y, 3 + (k === 2 ? 2 : 0), 1);
}
function ckGrade(sc) { return sc >= 0.9 ? ['PERFECT!', '#ffd84a'] : sc >= 0.75 ? ['GREAT!', '#8cf0a0'] : sc >= 0.55 ? ['GOOD!', '#8cd0ff'] : ['OKAY!', '#ffffff']; }
function ckPop(game, sc, x, y, text) {
    const [w, col] = ckGrade(sc);
    const short = text || (sc >= 0.9 ? 'PERFECT' : sc >= 0.7 ? 'NICE' : sc >= 0.4 ? 'OK' : 'OOPS');
    game.pops.push({ text: short, x, y, t: 0, col: text ? '#ffffff' : col });
    void w;
    if (sc >= 0.9 && !text) Sfx.play('good');
}
/* the kitchen: a tiled wall, a shelf of jars, a wooden counter */
function ckKitchen(g) {
    ckRect(g, 0, 0, COOK_W, 64, '#fdf0dc');
    for (let y = 6; y < 64; y += 10) ckRect(g, 0, y, COOK_W, 1, '#f4e2c4');
    for (let y = 0; y < 64; y += 10) for (let x = ((y / 10) % 2) * 5; x < COOK_W; x += 10) ckRect(g, x, y + 1, 1, 5, '#f7e8d0');
    // a little shelf of jars and a bowl, up in the middle (the edges are for meters)
    ckRect(g, 52, 26, 56, 3, '#b8844a'); ckRect(g, 52, 29, 56, 1, '#8a5a3a');
    [['#f7962d', 55], ['#6ac04a', 64], ['#e0405a', 73], ['#8a5ab8', 82]].forEach(([c, x]) => { ckRect(g, x, 17, 6, 9, 'rgba(255,255,255,0.7)'); ckRect(g, x, 20, 6, 6, c); ckRect(g, x, 15, 6, 2, '#8a5a3a'); });
    ckEll(g, 96, 23, 5, 3, '#e8eef6'); ckEll(g, 103, 23, 3, 2, '#f0d0a0');
    ckRect(g, 0, 62, COOK_W, 3, '#b8844a');
    ckRect(g, 0, 65, COOK_W, COOK_H - 65, '#e8c890');
    for (let y = 72; y < COOK_H; y += 9) { ckRect(g, 0, y, COOK_W, 1, '#dcb87a'); ckRect(g, ((y * 37) % 90) + 10, y + 4, 24, 1, '#dcb87a'); }
}
function ckStove(g) {
    ckRect(g, 36, 100, 88, 18, '#4a4550'); ckRect(g, 36, 100, 88, 2, '#6a6570');
    ckEll(g, 80, 107, 20, 4, '#2d2a33'); ckEll(g, 80, 107, 16, 3, '#3a3640');
    ckRect(g, 112, 110, 5, 4, '#8a8a90'); ckRect(g, 42, 110, 5, 4, '#8a8a90');
}
function ckFlames(g, v, t, y) {
    const n = 3 + Math.round(v * 6);
    for (let i = 0; i < n; i++) {
        const x = 80 + (i - (n - 1) / 2) * 4, h = 2 + v * 8 + ((t + i * 7) % 6 < 3 ? 1 : 0);
        ckRect(g, x - 1, y - h, 3, h, v > 0.75 ? '#ff5a2a' : '#ff9a3a');
        ckRect(g, x, y - h * 0.6, 1, h * 0.6, '#ffe070');
        ckRect(g, x - 1, y - 1, 3, 1, '#6a8aff');
    }
}
function ckBowl(g, cx, cy, rx, ry, fill) {
    ckEll(g, cx, cy + 2, rx + 2, ry + 3, 'rgba(0,0,0,0.12)');
    ckEll(g, cx, cy, rx, ry + 2, '#dfe7f0');
    ckRect(g, cx - rx + 2, cy + ry - 3, 2 * rx - 4, 2, '#4f86c6');
    ckEll(g, cx, cy - 2, rx - 2, ry - 3, '#eef3f8');
    if (fill) ckEll(g, cx, cy - 1, rx - 4, ry - 5, fill);
}
function ckHand(g, x, y, flip) {
    ckEll(g, x, y, 6, 5, '#ffd8b8'); ckEll(g, x + (flip ? 4 : -4), y - 3, 3, 2, '#ffd8b8');
    ckRect(g, x - 5, y + 3, 10, 1, '#e8b898');
}
/* a food bar for chopping (x, y: left top) */
function ckFood(g, sp, x, y, w, h, col, first, last) {
    if (w < 1) return;
    const lo = shadeHex(col, -0.28), hi = shadeHex(col, 0.35);
    ckRect(g, x, y, w, h, col);
    ckRect(g, x, y, w, 2, hi); ckRect(g, x, y + h - 2, w, 2, lo);
    if (first) { ckRect(g, x, y, 1, 1, '#d9a45a'); ckRect(g, x, y + h - 1, 1, 1, '#d9a45a'); }
    if (last) { ckRect(g, x + w - 1, y, 1, 1, '#d9a45a'); ckRect(g, x + w - 1, y + h - 1, 1, 1, '#d9a45a'); }
    if (sp.v === 'slice') for (let k = x + 3; k < x + w - 1; k += 5) ckLine(g, k, y + 2, k + 3, y + h - 3, hi);
    else if (sp.v === 'chop') for (let k = x + 3; k < x + w - 2; k += 6) ckRect(g, k, y + Math.round(h / 2) - 1, 2, 2, lo);
    else for (let k = x + 4; k < x + w - 2; k += 8) ckRect(g, k, y + 2, 1, h - 4, hi);
    if (last && sp.ing === 'chili') ckRect(g, x + w, y + Math.round(h / 2) - 1, 3, 2, '#5aa04a');
    if (last && sp.ing === 'greenonion') ckRect(g, x + w - 6, y, 6, h, '#fbf8f0');
    if (last && sp.ing === 'carrot') { ckRect(g, x + w, y + 1, 2, 2, '#5aa04a'); ckRect(g, x + w, y + h - 3, 2, 2, '#5aa04a'); }
}
function ckKnife(g, x, y) {
    x = Math.round(x);
    ckRect(g, x - 2, y - 12, 5, 11, '#6b4028'); ckRect(g, x - 1, y - 9, 1, 1, '#d8c0a0'); ckRect(g, x - 1, y - 5, 1, 1, '#d8c0a0');
    ckRect(g, x - 1, y - 1, 3, 16, '#dfe6ee'); ckRect(g, x - 1, y - 1, 1, 16, '#ffffff'); ckRect(g, x, y + 14, 1, 2, '#b8c4d0');
}
function ckTopping(g, id, x, y) {
    x = Math.round(x); y = Math.round(y);
    const c = ckCol(id);
    if (id === 'sesame' || id === 'salt') { ckRect(g, x - 2, y, 1, 1, c); ckRect(g, x + 1, y - 1, 1, 1, c); ckRect(g, x, y + 1, 1, 1, c); ckRect(g, x + 2, y + 1, 1, 1, c); return; }
    if (id === 'greenonion') { for (const [dx, dy] of [[-2, 0], [1, -1], [1, 1]]) { ckRect(g, x + dx, y + dy, 2, 1, c); ckRect(g, x + dx, y + dy + 1, 2, 1, '#bfe8a0'); } return; }
    if (id === 'peanuts') { ckEll(g, x - 1, y, 1.5, 1.2, c); ckEll(g, x + 2, y + 1, 1.5, 1.2, shadeHex(c, -0.15)); return; }
    ckEll(g, x, y, 2.6, 2.4, shadeHex(c, -0.2)); ckEll(g, x, y - 0.5, 2.2, 2, c); ckRect(g, x - 1, y - 2, 1, 1, shadeHex(c, 0.5));
    if (id === 'cherry') ckRect(g, x, y - 4, 1, 2, '#5a3a24');
}

/* ---------------------------------------------------------------- the eight kinds of step */
const CK_MECH = {};
CK_MECH.chop = {
    init(s, sp) {
        s.n = sp.n || 4; s.x0 = 26; s.x1 = 134; s.marks = [];
        for (let i = 0; i < s.n; i++) s.marks.push({ x: Math.round(s.x0 + ((i + 1) * (s.x1 - s.x0)) / (s.n + 1) + (R() - 0.5) * 8), cut: false });
        s.ph = R() * 6; s.sp = 0.05; s.kx = s.x0; s.down = 0; s.T = 60 * 11; s.col = ckCol(sp.ing); s.cuts = [];
    },
    update(s, inp) {
        if (s.down > 0) s.down--;
        else s.ph += s.sp;
        s.kx = s.x0 - 8 + (s.x1 - s.x0 + 16) * (0.5 - 0.5 * Math.cos(s.ph));
        if ((inp.pressed.act || inp.pressed.screen) && s.down === 0 && !s.fin) {
            s.down = 12;
            const left = s.marks.filter(m => !m.cut);
            let m = left[0];
            for (const q of left) if (Math.abs(q.x - s.kx) < Math.abs(m.x - s.kx)) m = q;
            const err = Math.abs(m.x - s.kx);
            m.cut = true; m.at = Math.round(s.kx); m.sc = err <= 2 ? 1 : clamp(1 - (err - 2) / 12, 0, 1);
            s.cuts.push(m.at);
            ckPop(this, m.sc, m.at, 50);
            Sfx.play('chop');
            s.sp *= 1.12;
            if (s.marks.every(q => q.cut)) s.fin = 26;
        }
        const avg = () => s.marks.reduce((a, q) => a + (q.sc || 0), 0) / s.n;
        if (s.fin && --s.fin <= 0) { s.score = avg(); s.done = true; }
        else if (s.t >= s.T && !s.fin) { s.score = avg(); s.done = true; }
    },
    draw(g, s) {
        ckRect(g, 16, 72, 128, 36, '#8a5a3a'); ckRect(g, 18, 70, 124, 36, '#d9a45a'); ckRect(g, 18, 70, 124, 2, '#e8b870');
        ckEll(g, 134, 78, 2, 2, '#8a5a3a');
        const v = s.spec.v, h = v === 'slice' ? 16 : v === 'cube' ? 14 : 10, y0 = 88 - Math.round(h / 2);
        const cuts = s.cuts.slice().sort((a, b) => a - b), edges = [s.x0, ...cuts, s.x1];
        for (let i = 0; i < edges.length - 1; i++) {
            const a = edges[i] + (i ? 1 : 0), b = edges[i + 1] - (i < edges.length - 2 ? 1 : 0), off = cuts.length ? (i - cuts.length / 2) * 1.5 : 0;
            ckFood(g, s.spec, a + off, y0, b - a, h, s.col, i === 0, i === edges.length - 2);
        }
        for (const m of s.marks) if (!m.cut) for (let y = y0 - 9; y < y0 + h + 6; y += 3) ckRect(g, m.x, y, 1, 1, 'rgba(255,255,255,0.95)');
        const d = s.down > 6 ? (12 - s.down) / 6 : s.down / 6;
        ckKnife(g, s.kx, y0 - 26 + d * 22);
    },
};
CK_MECH.stir = {
    init(s, sp) { s.turns = sp.turns || 4; s.acc = 0; s.ang = 0; s.T = 60 * 12; s.pa = null; s.lastK = null; s.par = s.turns * 80; s.cx = 80; s.cy = 82; s.q = 0; s.hint = 0; },
    update(s, inp) {
        const P = inp.pressed, p = inp.pointer;
        const add = d => {
            s.acc += Math.abs(d); s.ang += d;
            const q = Math.floor(s.acc / (Math.PI / 2));
            if (q !== s.q) { s.q = q; Sfx.play(s.spec.v === 'wok' ? 'sizzle' : 'whisk'); }
        };
        const wrap = d => { while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
        if (p.down) {
            const a = Math.atan2((p.y - s.cy) * 1.6, p.x - s.cx);
            if (s.pa != null && Math.hypot(p.x - s.cx, (p.y - s.cy) * 1.6) > 5) { const d = wrap(a - s.pa); if (Math.abs(d) < 1.3) add(d); }
            s.pa = a;
        } else s.pa = null;
        for (const [k, a] of [['right', 0], ['down', Math.PI / 2], ['left', Math.PI], ['up', -Math.PI / 2]]) {
            if (!P[k]) continue;
            if (s.lastK != null) {
                const d = wrap(a - s.lastK);
                if (Math.abs(Math.abs(d) - Math.PI / 2) < 0.01) add(d);
                else if (Math.abs(Math.abs(d) - Math.PI) < 0.01) add(Math.PI * 0.36 * (s.ang < 0 ? -1 : 1));   // \u25c0 \u25b6 \u25c0 \u25b6 works too, just slower
            }
            s.lastK = a;
        }
        if (P.act) { s.hint = 50; }
        if (s.hint > 0) s.hint--;
        const prog = s.acc / (s.turns * 2 * Math.PI);
        s.prog = Math.min(1, prog);
        if (prog >= 1) { s.done = true; s.score = s.t <= s.par ? 1 : clamp(1 - ((s.t - s.par) / (s.T - s.par)) * 0.6, 0.4, 1); }
        else if (s.t >= s.T) { s.done = true; s.score = 0.5 * prog; }
    },
    draw(g, s, pt) {
        const v = s.spec.v, cols = this.cols, A = cols[0], B = cols[1] || shadeHex(A, -0.3), prog = s.prog || 0;
        const cx = s.cx, cy = s.cy;
        if (v === 'wok') { ckStove(g); ckFlames(g, 0.7, pt, 106); ckEll(g, cx, cy + 2, 40, 17, '#1e1c24'); ckEll(g, cx, cy, 38, 15, '#2d2a33'); ckRect(g, cx + 36, cy - 3, 24, 5, '#6b4028'); ckRect(g, cx + 36, cy - 3, 24, 1, '#8a5a3a'); }
        else if (v === 'pot') { ckStove(g); ckFlames(g, 0.45, pt, 106); ckRect(g, cx - 34, cy - 4, 68, 16, '#6a6f7e'); ckEll(g, cx, cy + 12, 34, 5, '#5a5f6e'); ckEll(g, cx, cy - 4, 34, 11, '#7a8090'); ckRect(g, cx - 42, cy - 4, 8, 3, '#3a3640'); ckRect(g, cx + 34, cy - 4, 8, 3, '#3a3640'); }
        else ckBowl(g, cx, cy, 38, 16);
        const base = mixHex(A, B, prog * 0.5);
        ckEll(g, cx, cy - 3, 30, 10, base);
        g.globalAlpha = clamp(1 - prog * 0.85, 0, 1);
        for (let k = 0; k < 3; k++) for (let r = 3; r < 28; r += 2) {
            const a = s.ang + (k * 2 * Math.PI) / 3 + r * 0.13;
            ckRect(g, cx + Math.cos(a) * r - 1, cy - 3 + Math.sin(a) * r * 0.34, 2, 1, B);
        }
        g.globalAlpha = 1;
        if (v === 'wok' || v === 'bowl') for (let i = 0; i < 7; i++) {
            const a = s.ang * 1.1 + i * 0.9, r = 8 + (i * 7) % 18, jump = v === 'wok' ? Math.max(0, Math.sin(s.ang * 2 + i)) * 5 : 0;
            ckRect(g, cx + Math.cos(a) * r - 1, cy - 4 + Math.sin(a) * r * 0.34 - jump, 3, 2, cols[i % cols.length]);
        }
        // the spoon
        const bx = cx + Math.cos(s.ang) * 18, by = cy - 3 + Math.sin(s.ang) * 6;
        ckLine(g, bx, by - 2, bx + 12, by - 34, '#b8844a', 2);
        ckEll(g, bx, by, 4, 2.5, '#c9955a');
        // progress ticks around the edge
        for (let i = 0; i < 24; i++) {
            const a = -Math.PI / 2 + (i / 24) * 2 * Math.PI;
            ckRect(g, cx + Math.cos(a) * 48 - 1, cy - 3 + Math.sin(a) * 26 - 1, 2, 2, i / 24 < prog ? '#ffd84a' : 'rgba(80,60,40,0.25)');
        }
        if (!G.touchUsed && s.lastK != null) {
            const next = s.lastK + (s.ang < 0 ? -Math.PI / 2 : Math.PI / 2);
            const hx = cx + Math.cos(next) * 58, hy = cy - 3 + Math.sin(next) * 32;
            if ((pt >> 4) % 2) ckEll(g, hx, hy, 2.5, 2.5, '#e0405a');
        }
        if (s.hint) pxShadow(g, G.touchUsed ? 'DRAW CIRCLES!' : 'USE THE ARROWS!', 80, 40, '#ffffff', 1, 'center', '#6b4028');
    },
};
CK_MECH.heat = {
    init(s, sp) { s.v = 0; s.vel = 0; s.z = sp.zone || [0.5, 0.72]; s.prog = 0; s.need = 60 * 2.6; s.T = 60 * 13; s.inZ = 0; s.first = -1; s.burn = 0; s.puffs = []; s.col = ckCol(sp.ing); },
    update(s, inp) {
        const held = inp.held.act || inp.pointer.down;
        s.vel += ((held ? 0.012 : -0.009) - s.vel) * 0.12;
        s.v = clamp(s.v + s.vel, 0, 1);
        if ((s.v === 0 && s.vel < 0) || (s.v === 1 && s.vel > 0)) s.vel = 0;
        const inZ = s.v >= s.z[0] && s.v <= s.z[1];
        if (inZ) { s.prog += 1 / s.need; s.inZ++; if (s.first < 0) s.first = s.t; }
        const hot = s.v > s.z[1] + 0.1;
        if (hot) { s.burn++; s.prog = Math.max(0, s.prog - 0.25 / s.need); }
        const wet = ['pot', 'boil', 'steam'].includes(s.spec.v);
        if (s.v > 0.2 && s.t % Math.max(8, Math.round(26 - s.v * 18)) === 0) Sfx.play(wet ? 'bubble' : 'sizzle');
        if ((inZ && s.t % 9 === 0) || (hot && s.t % 5 === 0)) s.puffs.push({ x: 80 + (R() - 0.5) * 30, y: 70, t: 0, smoke: hot });
        s.puffs = s.puffs.filter(q => { q.t++; q.y -= 0.45; q.x += Math.sin(q.t / 9) * 0.3; return q.t < 50; });
        if (s.prog >= 1) { s.done = true; const span = Math.max(1, s.t - s.first); s.score = clamp(0.4 + (0.6 * s.inZ) / span - s.burn / 240, 0.3, 1); Sfx.play('ding'); }
        else if (s.t >= s.T) { s.done = true; s.score = 0.5 * s.prog; }
    },
    draw(g, s, pt) {
        const v = s.spec.v, cooked = mixHex(s.col, v === 'melt' ? '#5a3420' : '#d8a050', v === 'boil' || v === 'pot' || v === 'steam' ? s.prog * 0.2 : s.prog * 0.65);
        if (v === 'oven') {
            ckRect(g, 36, 34, 88, 72, '#d8d0c8'); ckRect(g, 36, 34, 88, 2, '#eee8e0'); ckRect(g, 36, 104, 88, 2, '#a8a098');
            ckRect(g, 46, 50, 68, 42, '#3a2a30');
            ckRect(g, 46, 50, 68, 42, `rgba(255,150,60,${0.15 + s.v * 0.55})`);
            const h = 6 + s.prog * 10;
            ckRect(g, 60, 86 - h, 40, h, mixHex('#f8e8c0', '#d8a050', s.prog)); ckRect(g, 60, 86 - h, 40, 2, shadeHex(mixHex('#f8e8c0', '#c07a30', s.prog), 0.1));
            ckRect(g, 56, 86, 48, 3, '#8a8a90');
            for (let i = 0; i < 4; i++) ckRect(g, 48 + i * 18, 94, 6, 3, '#3a3640');
            ckRect(g, 52, 38, 56, 6, '#3a3640');
            const a = -Math.PI * 0.75 + s.v * Math.PI * 1.5;
            ckEll(g, 80, 41, 3, 3, '#eee8e0'); ckLine(g, 80, 41, 80 + Math.cos(a - Math.PI / 2) * 3, 41 + Math.sin(a - Math.PI / 2) * 3, '#e0405a');
        } else if (v === 'torch') {
            ckEll(g, 72, 96, 22, 6, 'rgba(0,0,0,0.12)'); ckRect(g, 52, 80, 40, 14, '#f4f0ea'); ckEll(g, 72, 94, 20, 4, '#e0d8cc');
            ckEll(g, 72, 80, 20, 5, mixHex('#fff0c0', '#b8702a', s.prog)); ckEll(g, 66, 79, 5, 1.5, 'rgba(255,255,255,0.4)');
            ckRect(g, 106, 44, 10, 22, '#e0405a'); ckRect(g, 106, 44, 10, 3, '#ff7a8a'); ckRect(g, 100, 58, 8, 4, '#8a8a90');
            const L = 4 + s.v * 20;
            for (let i = 0; i < L; i++) ckRect(g, 99 - i, 60 + i * 0.7, 2, 2, i < L * 0.4 ? '#8ab8ff' : i < L * 0.75 ? '#ffd84a' : '#ff7a2a');
        } else {
            ckStove(g); ckFlames(g, s.v, pt, 106);
            if (v === 'fry' || v === 'grill' || v === 'melt') {
                ckEll(g, 80, 84, 34, 11, '#1e1c24'); ckEll(g, 80, 82, 32, 9, '#3a3640'); ckRect(g, 112, 79, 26, 5, '#6b4028');
                if (v === 'grill') for (let x = 54; x < 108; x += 6) ckRect(g, x, 76, 1, 12, '#2d2a33');
                for (let i = 0; i < (v === 'melt' ? 1 : 5); i++) {
                    if (v === 'melt') { ckEll(g, 80, 82, 18 + s.prog * 8, 5 + s.prog * 2, cooked); continue; }
                    const x = 60 + i * 10, y = 81 + ((i * 3) % 3) - (s.v > s.z[0] && (pt + i * 5) % 20 < 3 ? 1 : 0);
                    ckEll(g, x, y, 5, 3, cooked); ckRect(g, x - 2, y - 2, 3, 1, shadeHex(cooked, 0.3));
                }
            } else {
                ckRect(g, 48, 62, 64, 30, '#7a8090'); ckRect(g, 48, 62, 64, 2, '#9aa0b0'); ckRect(g, 40, 66, 8, 3, '#3a3640'); ckRect(g, 112, 66, 8, 3, '#3a3640');
                ckRect(g, 48, 88, 64, 4, '#5a5f6e');
                if (v === 'pot') { ckRect(g, 46, 58 - (s.v > 0.7 && pt % 6 < 3 ? 1 : 0), 68, 5, '#9aa0b0'); ckRect(g, 76, 54, 8, 4, '#3a3640'); }
                else if (v === 'steam') { for (let k = 0; k < 2; k++) { ckRect(g, 50, 46 + k * 8, 60, 8, '#d8b878'); ckRect(g, 50, 46 + k * 8, 60, 1, '#b8985a'); } ckRect(g, 48, 42, 64, 5, '#c8a868'); }
                else {
                    ckEll(g, 80, 64, 30, 4, '#8ab8d8');
                    for (let i = 0; i < Math.round(s.v * 8); i++) { const x = 54 + ((i * 29 + (pt >> 2)) % 52); ckEll(g, x, 63 + ((pt + i * 7) % 4 < 2 ? 0 : 1), 1.5, 1, '#e8f6ff'); }
                    if (s.spec.ing === 'noodles') for (let i = 0; i < 5; i++) ckLine(g, 60 + i * 8, 64, 64 + i * 8, 62 + Math.sin(pt / 8 + i) * 2, cooked);
                    else if (s.spec.ing && s.spec.ing !== 'rice') for (let i = 0; i < 4; i++) ckEll(g, 62 + i * 12, 64, 3, 1.5, cooked);
                }
            }
        }
        for (const q of s.puffs) { g.globalAlpha = 0.6 * (1 - q.t / 50); ckEll(g, q.x, q.y, 3 + q.t / 12, 2 + q.t / 16, q.smoke ? '#6a6570' : '#ffffff'); }
        g.globalAlpha = 1;
        // the heat gauge
        const gx = 146, gy = 22, gh = 80;
        ckRect(g, gx - 2, gy - 2, 12, gh + 4, '#3b2a45'); ckRect(g, gx, gy, 8, gh, '#2d2230');
        ckRect(g, gx, gy + gh * (1 - s.z[1]), 8, gh * (s.z[1] - s.z[0]), '#5ac05a');
        ckRect(g, gx, gy, 8, gh * (1 - s.z[1] - 0.1), '#c04040');
        const ny = gy + gh * (1 - s.v);
        ckRect(g, gx - 4, ny - 1, 3, 3, '#ffffff'); ckRect(g, gx - 1, ny, 10, 1, '#ffffff');
        pxText(g, 'HEAT', gx + 4, gy - 9, '#3b2a45', 1, 'center');
        // how done it is
        ckRect(g, 8, 22, 6, 80, '#3b2a45'); ckRect(g, 9, 23, 4, 78, '#f4e8d8');
        ckRect(g, 9, 23 + 78 * (1 - s.prog), 4, 78 * s.prog, '#ffb030');
        pxText(g, 'DONE', 11, 13, '#3b2a45', 1, 'center');
        if (s.v > s.z[1] + 0.1 && (pt >> 3) % 2) pxShadow(g, 'TOO HOT!', 80, 26, '#ff5a4a', 1, 'center', '#3b2a45');
    },
};
CK_MECH.pour = {
    init(s, sp) { s.lv = 0; s.flow = 0; s.tg = 0.55 + R() * 0.25; s.T = 60 * 10; s.settle = 0; s.poured = false; s.col = ckCol(sp.ing); },
    update(s, inp) {
        const held = inp.held.act || inp.pointer.down;
        s.flow = held ? Math.min(1, s.flow + 0.09) : Math.max(0, s.flow - 0.1);
        s.lv += s.flow * 0.0068;
        if (s.flow > 0.3 && s.t % 10 === 0) Sfx.play('pour');
        if (s.lv > 0.04) s.poured = true;
        const sc = () => clamp(1 - Math.abs(s.lv - s.tg) / 0.22, 0, 1);
        if (s.lv >= 1) { s.lv = 1; s.done = true; s.score = 0.25; ckPop(this, 0, 72, 50, 'SPILL!'); Sfx.play('splat'); return; }
        if (s.poured && !held && s.flow === 0) { if (++s.settle > 40) { s.done = true; s.score = sc(); ckPop(this, s.score, 72, 52); } }
        else s.settle = 0;
        if (s.t >= s.T && !s.done) { s.done = true; s.score = s.poured ? sc() * 0.8 : 0; }
    },
    draw(g, s, pt) {
        const x0 = 50, w = 44, yb = 106, h = 46, top = yb - h;
        ckEll(g, x0 + w / 2, yb + 2, w / 2 + 3, 3, 'rgba(0,0,0,0.12)');
        ckRect(g, x0, top, w, h, 'rgba(220,240,255,0.45)');
        const lh = Math.round(s.lv * h);
        if (lh > 0) { ckRect(g, x0 + 1, yb - lh, w - 2, lh, s.col); ckRect(g, x0 + 1, yb - lh, w - 2, 1, shadeHex(s.col, 0.4)); ckRect(g, x0 + 1, yb - lh + 1, w - 2, 1, shadeHex(s.col, -0.1)); }
        ckRect(g, x0, top, 1, h, '#8ab8d8'); ckRect(g, x0 + w - 1, top, 1, h, '#8ab8d8'); ckRect(g, x0, yb - 1, w, 1, '#8ab8d8');
        ckRect(g, x0 + w - 1, top + 6, 8, 3, '#8ab8d8'); ckRect(g, x0 + w + 5, top + 6, 3, 22, '#8ab8d8'); ckRect(g, x0 + w - 1, top + 25, 8, 3, '#8ab8d8');
        for (let k = 1; k < 5; k++) ckRect(g, x0 + 2, yb - (h * k) / 5, 5, 1, '#8ab8d8');
        const ty = Math.round(yb - s.tg * h);
        for (let x = x0 - 4; x < x0 + w + 4; x += 3) ckRect(g, x, ty, 2, 1, '#e8a800');
        ckRect(g, x0 - 7, ty - 2, 3, 5, '#e8a800'); ckRect(g, x0 - 6, ty - 1, 3, 3, '#ffd84a');
        // the container, tipping as it pours
        const tip = s.flow * 0.9 + (s.flow > 0 ? Math.sin(pt / 5) * 0.03 : 0);
        g.save(); g.translate(96, 30); g.rotate(-tip);
        if (s.spec.v === 'bag') { ckRect(g, -8, -12, 18, 22, '#e8d8b8'); ckRect(g, -8, -4, 18, 6, '#e0405a'); ckRect(g, -8, -12, 18, 2, '#c8b898'); ckRect(g, -10, 8, 4, 2, '#e8d8b8'); }
        else { ckRect(g, -6, -10, 13, 18, shadeHex(s.col, s.spec.ing === 'soysauce' ? 0 : -0.25)); ckRect(g, -4, -4, 9, 6, '#fffaf0'); ckRect(g, -10, 4, 5, 3, shadeHex(s.col, -0.3)); ckRect(g, -3, -13, 7, 3, '#e0405a'); }
        g.restore();
        if (s.flow > 0.05) { const sx = 85 - s.flow * 4; ckRect(g, sx - s.flow, 38, 1 + s.flow * 2, yb - lh - 38, s.col); ckRect(g, sx - s.flow, 38, 1, yb - lh - 38, shadeHex(s.col, 0.3)); }
        pxText(g, 'LINE', x0 - 12, ty - 9, '#b88a00', 1, 'center');
    },
};
CK_MECH.mash = {
    init(s, sp) { s.fill = 0; s.goal = sp.goal || 16; s.T = 60 * 7; s.b = 0; s.par = s.goal * 9; s.n = 0; s.col = ckCol(sp.ing); },
    update(s, inp) {
        if (s.b > 0) s.b--;
        if (inp.pressed.act || inp.pressed.screen) {
            s.fill += 1 / s.goal; s.b = 7; s.n++;
            Sfx.play({ rinse: 'splat', whisk: 'whisk', shave: 'whisk' }[s.spec.v] || 'squish');
        }
        if (s.fill < 1) s.fill = Math.max(0, s.fill - 0.0011);
        if (s.fill >= 1) { s.done = true; s.score = s.t <= s.par ? 1 : clamp(1 - ((s.t - s.par) / (s.T - s.par)) * 0.6, 0.4, 1); }
        else if (s.t >= s.T) { s.done = true; s.score = 0.5 * s.fill; }
    },
    draw(g, s, pt) {
        const v = s.spec.v, f = Math.min(1, s.fill), b = s.b;
        if (v === 'rinse') {
            ckBowl(g, 80, 90, 38, 16, mixHex('#e8ecf0', '#9fd4f0', f));
            for (let i = 0; i < 26; i++) { const a = i * 2.4 + s.n * 0.5, r = 4 + ((i * 7) % 22); ckRect(g, 80 + Math.cos(a) * r + Math.sin(b) * 2, 87 + Math.sin(a) * r * 0.3, 2, 1, '#ffffff'); }
            if (b) for (let i = 0; i < 4; i++) ckRect(g, 60 + i * 14, 72 - b, 1, 2, '#9fd4f0');
        } else if (v === 'whisk') {
            ckBowl(g, 80, 90, 38, 16, s.col === '#ffd84a' ? mixHex('#ffc830', '#fff0b0', f) : mixHex(s.col, '#ffffff', f * 0.4));
            for (let i = 0; i < Math.round(f * 18); i++) ckRect(g, 56 + ((i * 17) % 48), 84 + ((i * 5) % 7), 2, 2, 'rgba(255,255,255,0.85)');
            const sw = Math.sin(s.n * 1.3) * 10;
            ckRect(g, 79 + sw, 46, 3, 20, '#8a8a90');
            for (let k = -1; k <= 1; k++) { ckLine(g, 80 + sw, 64, 80 + sw + k * 6, 80, '#c8ccd6'); }
            ckLine(g, 74 + sw, 80, 86 + sw, 80, '#c8ccd6');
        } else if (v === 'shave') {
            ckBowl(g, 80, 96, 30, 12);
            ckEll(g, 80, 90 - f * 6, 8 + f * 16, 3 + f * 8, '#ffffff'); ckEll(g, 76, 88 - f * 8, 4 + f * 6, 2 + f * 3, '#f0f8ff');
            ckRect(g, 62, 34 + (b ? 2 : 0), 36, 20, '#bfe4f8'); ckRect(g, 62, 34 + (b ? 2 : 0), 36, 3, '#e8f6ff'); ckRect(g, 66, 38, 3, 12, '#ffffff');
            ckRect(g, 58, 30, 44, 4, '#8a8a90');
            if (b) for (let i = 0; i < 6; i++) ckRect(g, 66 + ((i * 11 + pt) % 28), 56 + ((i * 7 + pt * 2) % 24), 1, 1, '#ffffff');
        } else if (v === 'pound') {
            ckEll(g, 80, 104, 36, 7, '#6b4028'); ckRect(g, 46, 86, 68, 18, '#8a5a3a'); ckEll(g, 80, 86, 34, 7, '#a8784a'); ckEll(g, 80, 86, 28, 5, '#6b4028');
            ckEll(g, 80, 84 + (b > 4 ? 1 : 0), 18 + (b > 4 ? 3 : 0) + f * 2, 5 - (b > 4 ? 1 : 0), mixHex('#f4f0e0', '#ffffff', f));
            const my = b > 3 ? 62 + (7 - b) * 4 : 36 + b * 4;
            ckRect(g, 60, my - 8, 26, 14, '#c9955a'); ckRect(g, 60, my - 8, 26, 2, '#e0b070'); ckRect(g, 84, my - 3, 24, 4, '#a8784a');
        } else {
            // knead, smash, press: something squished on the board
            ckRect(g, 26, 76, 108, 32, '#d9a45a'); ckRect(g, 26, 76, 108, 2, '#e8b870');
            const col = v === 'smash' ? s.col : v === 'press' ? '#e6dcff' : '#f4e0b0';
            if (v === 'smash') {
                for (let i = 0; i < 5; i++) { const sp = f * 6; ckRect(g, 46 + i * 14 + (i - 2) * sp, 86 + ((i * 3) % 4) * f, 12 - f * 3, 7, col); ckRect(g, 46 + i * 14 + (i - 2) * sp, 86, 12 - f * 3, 1, shadeHex(col, 0.4)); }
                const ky = b > 3 ? 78 : 60 + b;
                ckRect(g, 44, ky, 60, 5, '#dfe6ee'); ckRect(g, 44, ky, 60, 1, '#ffffff'); ckRect(g, 104, ky + 1, 18, 4, '#6b4028');
            } else {
                const sq = b > 3 ? 3 : 0;
                ckEll(g, 80, 92, 22 + sq * 2, 9 - sq, col);
                ckEll(g, 76, 89, 8, 2, shadeHex(col, 0.4));
                for (let i = 0; i < Math.round((1 - f) * 8); i++) ckRect(g, 66 + ((i * 13) % 28), 90 + ((i * 5) % 6), 2, 1, shadeHex(col, -0.2));
                if (v === 'press') {
                    g.globalAlpha = f; for (let a = 0; a < 6; a++) ckRect(g, 80 + Math.cos(a) * 9, 92 + Math.sin(a) * 3, 2, 1, '#8a6ab8'); ckEll(g, 80, 92, 2, 1, '#8a6ab8'); g.globalAlpha = 1;
                    const py = b > 3 ? 70 : 50 + b * 2;
                    ckRect(g, 66, py, 28, 12, '#a8784a'); ckRect(g, 76, py - 16, 8, 16, '#8a5a3a');
                } else { ckHand(g, 68, 82 + sq, false); ckHand(g, 92, 82 + sq, true); }
            }
        }
        // the effort meter
        ckRect(g, 30, 114, 100, 6, '#3b2a45'); ckRect(g, 31, 115, 98 * f, 4, f >= 1 ? '#5ac05a' : '#ffb030');
    },
};
CK_MECH.top = {
    init(s, sp) {
        s.n = sp.n || 3; s.marks = [];
        const gap = s.n > 3 ? 16 : 20;
        for (let i = 0; i < s.n; i++) s.marks.push({ x: Math.round(80 + (i - (s.n - 1) / 2) * gap + (R() - 0.5) * 4), got: false });
        s.ph = R() * 6; s.sp = 0.042; s.hx = 80; s.drops = []; s.cool = 0; s.T = 60 * 12; s.used = 0; s.scs = []; s.base = sp.base || '#f4e0b0';
    },
    update(s, inp) {
        s.ph += s.sp;
        s.hx = 24 + 112 * (0.5 - 0.5 * Math.cos(s.ph));
        if (s.cool > 0) s.cool--;
        if ((inp.pressed.act || inp.pressed.screen) && s.cool === 0 && s.used < s.n) { s.drops.push({ x: Math.round(s.hx), y: 34, vy: 0.4 }); s.used++; s.cool = 20; Sfx.play('drop'); }
        for (const d of s.drops) {
            if (d.landed) continue;
            d.vy += 0.18; d.y += d.vy;
            if (d.y < 82) continue;
            d.y = 82; d.landed = true;
            const free = s.marks.filter(m => !m.got);
            let m = free[0];
            for (const q of free) if (Math.abs(q.x - d.x) < Math.abs(m.x - d.x)) m = q;
            const dist = Math.abs(m.x - d.x);
            m.got = true;
            const sc = dist <= 2 ? 1 : clamp(1 - (dist - 2) / 12, 0, 1);
            s.scs.push(sc);
            ckPop(this, sc, d.x, 62);
            Sfx.play('plop');
        }
        if (s.scs.length >= s.n && !s.fin) s.fin = 26;
        const avg = () => s.scs.reduce((a, q) => a + q, 0) / s.n;
        if (s.fin && --s.fin <= 0) { s.done = true; s.score = avg(); }
        else if (s.t >= s.T && !s.fin) { s.done = true; s.score = avg(); }
        s.sp = 0.042 * (1 + s.used * 0.12);
    },
    draw(g, s, pt) {
        ckEll(g, 80, 98, 50, 12, 'rgba(0,0,0,0.12)'); ckEll(g, 80, 94, 50, 14, '#f7f3ea'); ckEll(g, 80, 93, 44, 11, '#e8e0d4');
        ckEll(g, 80, 88, 38, 9, shadeHex(s.base, -0.15)); ckEll(g, 80, 86, 38, 8, s.base); ckEll(g, 70, 84, 12, 2, shadeHex(s.base, 0.35));
        for (const m of s.marks) if (!m.got) ckSparkle(g, m.x, 82, pt + m.x, '#e0405a');
        for (const d of s.drops) ckTopping(g, s.spec.ing, d.x, d.y);
        if (s.used < s.n && s.cool === 0) ckTopping(g, s.spec.ing, s.hx, 32);
        ckHand(g, s.hx, 24, false);
        ckRect(g, s.hx - 3, 14, 7, 7, '#e0405a');
        for (let y = 38; y < 80; y += 4) if (s.used < s.n) ckRect(g, Math.round(s.hx), y, 1, 2, 'rgba(255,255,255,0.35)');
    },
};
CK_MECH.roll = {
    init(s, sp) { s.goal = sp.goal || 12; s.prog = 0; s.last = null; s.wob = 0; s.T = 60 * 8; s.par = s.goal * 12; s.side = 0; s.fillCol = this.cols[0]; },
    update(s, inp) {
        const P = inp.pressed, p = inp.pointer;
        let k = null;
        if (P.left || (P.screen && p.x < COOK_W / 2)) k = 'L';
        else if (P.right || (P.screen && p.x >= COOK_W / 2)) k = 'R';
        if (k) {
            if (k !== s.last) { s.prog += 1 / s.goal; s.side = k === 'L' ? -1 : 1; Sfx.play('squish'); }
            else { s.wob = 10; Sfx.play('nope'); }
            s.last = k;
        }
        if (P.act) s.hint = 50;
        if (s.hint > 0) s.hint--;
        if (s.wob > 0) s.wob--;
        if (s.prog >= 1) { s.done = true; s.score = s.t <= s.par ? 1 : clamp(1 - ((s.t - s.par) / (s.T - s.par)) * 0.6, 0.4, 1); }
        else if (s.t >= s.T) { s.done = true; s.score = 0.5 * s.prog; }
    },
    draw(g, s, pt) {
        const v = s.spec.v, f = Math.min(1, s.prog), wob = s.wob ? Math.sin(s.wob * 2) * 2 : 0;
        if (v === 'mat') {
            ckRect(g, 28, 60, 104, 50, '#d8c080');
            for (let y = 61; y < 110; y += 3) ckRect(g, 28, y, 104, 1, '#b8a060');
            const yb = 104 - f * 38;
            ckRect(g, 32, 64, 96, yb - 64, '#2a4a2a'); ckRect(g, 34, 66, 92, Math.max(0, yb - 68), '#fbf8f0');
            if (yb - 66 > 10) ckRect(g, 34, 74, 92, 5, s.fillCol);
            const rh = 7 + f * 7;
            ckRect(g, 32 + wob, yb - 3, 96, rh, '#2a4a2a'); ckRect(g, 32 + wob, yb - 3, 96, 2, '#3f6a3f');
            ckHand(g, 30 + wob + (s.side < 0 ? 3 : 0), yb + 2, false); ckHand(g, 130 + wob - (s.side > 0 ? 3 : 0), yb + 2, true);
        } else if (v === 'pin') {
            ckRect(g, 24, 76, 112, 32, '#d9a45a'); ckRect(g, 24, 76, 112, 2, '#e8b870');
            ckEll(g, 80, 92, 14 + f * 30, 6 + f * 6, '#e8b870'); ckEll(g, 76, 90, 8 + f * 18, 2 + f * 2, '#f4c888');
            const px = 80 + s.side * 12 + wob;
            ckRect(g, px - 22, 82, 44, 8, '#c9955a'); ckRect(g, px - 22, 82, 44, 2, '#e0b070'); ckRect(g, px - 30, 84, 8, 4, '#8a5a3a'); ckRect(g, px + 22, 84, 8, 4, '#8a5a3a');
        } else if (v === 'fold') {
            ckRect(g, 24, 76, 112, 32, '#d9a45a');
            ckEll(g, 80, 92, 24, 9, '#fbf5e6'); ckEll(g, 80, 90, 10, 4, '#8ad06a');
            const pleats = Math.floor(f * 8);
            ckEll(g, 80, 86, 22, 5, '#fbf5e6');
            for (let i = 0; i < pleats; i++) ckRect(g, 62 + i * 5, 81, 1, 4, '#d8cbb0');
            ckHand(g, 56 + (s.side < 0 ? 3 : 0), 84, false); ckHand(g, 104 - (s.side > 0 ? 3 : 0), 84, true);
        } else {
            // shaping a rice ball / mochi / truffle between two hands
            ckRect(g, 24, 80, 112, 28, '#d9a45a');
            const col = this.rid === 'truffles' ? '#6b3f25' : this.rid === 'mochi' ? '#fff0f4' : '#fbf8f0';
            const lump = (1 - f) * 3;
            for (let a = 0; a < Math.PI * 2; a += 0.35) ckEll(g, 80 + Math.cos(a) * (13 + Math.sin(a * 3) * lump), 90 + Math.sin(a) * (7 + Math.cos(a * 2) * lump), 3, 3, col);
            ckEll(g, 80, 90, 13, 7, col); ckEll(g, 75, 87, 4, 2, shadeHex(col, 0.4));
            if (this.rid === 'nigiri' && f > 0.5) { ckEll(g, 80, 84, 14, 3, '#f28a6b'); ckRect(g, 70, 84, 20, 1, '#ffc0a8'); }
            ckHand(g, 60 + (s.side < 0 ? 5 : 0) + wob, 88, false); ckHand(g, 100 - (s.side > 0 ? 5 : 0) + wob, 88, true);
        }
        ckRect(g, 30, 116, 100, 6, '#3b2a45'); ckRect(g, 31, 117, 98 * f, 4, '#ffb030');
        if (s.hint) pxShadow(g, G.touchUsed ? 'TAP LEFT, THEN RIGHT!' : 'LEFT, THEN RIGHT!', 80, 44, '#ffffff', 1, 'center', '#6b4028');
    },
};
CK_MECH.timing = {
    setup(s) {
        s.pos = 0; s.dir = 1; s.anim = 0; s.res = null;
        s.zc = s.spec.v === 'crack' ? 0.3 + R() * 0.4 : 0.52 + R() * 0.16;
        s.zw = s.spec.v === 'crack' ? 0.16 : 0.18;
        s.sp = (s.spec.v === 'crack' ? 0.016 : 0.0058) * (1 + s.k * 0.15);
    },
    init(s, sp) { s.n = sp.n || 1; s.k = 0; s.scs = []; s.T = 60 * 14; s.yolks = 0; CK_MECH.timing.setup(s); },
    hit(s, game) {
        const d = Math.abs(s.pos - s.zc), hw = s.zw / 2;
        const sc = d <= hw ? 1 - (d / hw) * 0.2 : clamp(0.55 - (d - hw) * 2.5, 0.05, 0.55);
        s.scs.push(sc); s.res = sc; s.anim = 46;
        if (s.spec.v === 'crack' && sc >= 0.5) s.yolks++;
        ckPop(game, sc, s.spec.v === 'crack' ? Math.round(30 + 100 * s.pos) : 80, 44);
        Sfx.play(s.spec.v === 'crack' ? 'crack' : 'flip');
    },
    update(s, inp) {
        if (s.anim > 0) {
            if (--s.anim === 0) { s.k++; if (s.k >= s.n) { s.done = true; s.score = s.scs.reduce((a, q) => a + q, 0) / s.n; } else CK_MECH.timing.setup(s); }
            return;
        }
        if (s.spec.v === 'crack') { s.pos += s.sp * s.dir; if (s.pos > 1) { s.pos = 1; s.dir = -1; } if (s.pos < 0) { s.pos = 0; s.dir = 1; } }
        else { s.pos += s.sp; if (s.pos >= 1) { s.pos = 1; CK_MECH.timing.hit(s, this); return; } }
        if (inp.pressed.act || inp.pressed.screen || s.t >= s.T) CK_MECH.timing.hit(s, this);
    },
    draw(g, s, pt) {
        const v = s.spec.v;
        if (v === 'crack') {
            ckBowl(g, 80, 92, 30, 12, s.yolks ? '#fff0c0' : null);
            for (let i = 0; i < s.yolks; i++) ckEll(g, 74 + i * 10, 89, 3, 2, '#ffb020');
            const ex = 30 + 100 * s.pos;
            if (!s.anim) { ckEll(g, ex, 52, 7, 9, '#e8d8c0'); ckEll(g, ex - 1, 51, 6, 8, '#fff8ec'); ckRect(g, ex - 3, 46, 2, 2, '#ffffff'); ckHand(g, ex, 40, false); }
            else {
                const k = 1 - s.anim / 46, good = s.res >= 0.5;
                ckEll(g, ex - 6 - k * 8, 50, 5, 5, '#fff8ec'); ckEll(g, ex + 6 + k * 8, 50, 5, 5, '#fff8ec');
                if (good) { if (k < 0.6) ckEll(g, ex + (80 - ex) * k * 1.6, 56 + k * 50, 3, 2.5, '#ffb020'); }
                else ckEll(g, ex, Math.min(104, 56 + k * 80), 4, 2, '#ffc030');
            }
        } else if (v === 'turn') {
            ckStove(g); ckFlames(g, 0.5, pt, 106);
            ckRect(g, 44, 74, 72, 22, '#2d2a33'); ckRect(g, 44, 74, 72, 2, '#4a4550'); ckRect(g, 116, 80, 22, 5, '#6b4028');
            const col = ckDone(s.pos), flipK = s.anim ? Math.sin((s.anim / 46) * Math.PI) : 0;
            for (let i = 0; i < 6; i++) {
                const x = 54 + (i % 3) * 26, y = 80 + Math.floor(i / 3) * 10;
                ckEll(g, x, y + 2, 6, 4, '#1e1c24');
                ckEll(g, x, y - flipK * 5, 5, 4, s.anim && s.res >= 0.5 ? '#d89040' : col);
                if (s.anim && s.res >= 0.5) { ckRect(g, x - 2, y - 2 - flipK * 5, 3, 1, '#8a4a2a'); ckRect(g, x + 1, y - 3 - flipK * 5, 1, 1, '#5aa04a'); }
            }
        } else {
            ckStove(g); ckFlames(g, 0.5, pt, 106);
            ckEll(g, 80, 86, 34, 11, '#1e1c24'); ckEll(g, 80, 84, 32, 9, '#3a3640'); ckRect(g, 112, 81, 26, 5, '#6b4028');
            const air = s.anim ? Math.sin((s.anim / 46) * Math.PI) : 0;
            const col = s.anim ? (s.res >= 0.5 ? '#d89040' : ckDone(Math.min(1, s.pos + 0.2))) : ckDone(s.pos);
            ckEll(g, 80, 82 - air * 34, 20, 6 * (1 - air * 0.7) + 1, col);
            ckEll(g, 74, 80 - air * 34, 7, 1.5 * (1 - air * 0.7) + 0.5, shadeHex(col, 0.3));
            if (!s.anim && s.pos > 0.4) for (let i = 0; i < 3; i++) ckRect(g, 66 + i * 12, 78 + ((pt + i * 5) % 8 < 4 ? 0 : 1), 1, 1, '#fff4dc');
            if (!s.anim && s.pos > 0.85 && pt % 5 === 0) ckEll(g, 80 + (R() - 0.5) * 30, 68, 3, 2, 'rgba(90,85,95,0.6)');
        }
        // the timing bar
        const bx = 30, bw = 100, by = 112;
        ckRect(g, bx - 1, by - 1, bw + 2, 7, '#3b2a45');
        if (v === 'crack') ckRect(g, bx, by, bw, 5, '#f4e8d8');
        else for (let i = 0; i < bw; i++) ckRect(g, bx + i, by, 1, 5, ckDone(i / bw));
        ckRect(g, bx + bw * (s.zc - s.zw / 2), by, bw * s.zw, 5, 'rgba(90,192,90,0.85)');
        const cx = Math.round(bx + bw * s.pos);
        ckRect(g, cx - 1, by - 4, 3, 3, '#ffffff'); ckRect(g, cx, by - 1, 1, 7, '#ffffff');
        if (s.n > 1) pxText(g, `${Math.min(s.k + 1, s.n)}/${s.n}`, 150, 104, '#3b2a45', 1, 'right');
    },
};
function ckDone(p) {   // pale, golden, brown, burnt
    const stops = [[0, '#f8ecc8'], [0.45, '#f0c878'], [0.62, '#e0a050'], [0.8, '#a86430'], [1, '#3a2418']];
    for (let i = 1; i < stops.length; i++) if (p <= stops[i][0]) return mixHex(stops[i - 1][1], stops[i][1], (p - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]));
    return stops[stops.length - 1][1];
}

/* ---------------------------------------------------------------- the game: steps in a row, then the plate */
function CookGame(opts) {
    this.rid = opts.recipe;
    this.recipe = RECIPES.find(r => r.id === this.rid) || RECIPES[0];
    this.steps = cookPlan(this.recipe.id);
    this.cols = Object.keys(this.recipe.need).map(ckCol);
    if (this.cols.length < 2) this.cols.push(shadeHex(this.cols[0], -0.3));
    this.i = -1; this.scores = []; this.over = false; this.pops = []; this.pt = 0;
    this.next();
}
CookGame.prototype = {
    next() {
        this.i++;
        if (this.i >= this.steps.length) { this.plate(); return; }
        const spec = this.steps[this.i];
        this.s = { spec, t: 0, done: false, score: 0 };
        CK_MECH[spec.m].init.call(this, this.s, spec);
        this.phase = 'intro'; this.pt = 0;
        Arcade.help(`Step ${this.i + 1} of ${this.steps.length}: ${spec.t}. ${ckHow(spec)}`);
        Arcade.label('act', spec.m === 'mash' ? CK_MASH_BTN[spec.v] || 'TAP!' : spec.m === 'timing' ? CK_TIME_BTN[spec.v] || 'NOW!' : CK_BTN[spec.m]);
    },
    update(inp) {
        this.pt++;
        this.pops = this.pops.filter(q => ++q.t < 34);
        const P = inp.pressed;
        if (this.phase === 'intro') {
            if (this.pt > 110 || (this.pt > 26 && (P.act || P.screen))) { this.phase = 'go'; this.pt = 0; }
            return;
        }
        if (this.phase === 'go') {
            const s = this.s;
            s.t++;
            CK_MECH[s.spec.m].update.call(this, s, inp);
            if (s.done) { this.scores.push(clamp(s.score, 0, 1)); this.phase = 'grade'; this.pt = 0; if (s.score >= 0.75) Sfx.play('levelup'); }
            return;
        }
        if (this.phase === 'grade') { if (this.pt > 62) this.next(); return; }
        if (this.phase === 'plate' && (this.pt > 170 || (this.pt > 50 && (P.act || P.screen)))) this.over = true;
    },
    plate() {
        this.total = this.scores.reduce((a, b) => a + b, 0) / Math.max(1, this.scores.length);
        this.medal = this.total >= 0.85 ? 'gold' : this.total >= 0.6 ? 'silver' : 'bronze';
        this.phase = 'plate'; this.pt = 0;
        Sfx.play(this.medal === 'gold' ? 'fanfare' : 'party');
        Arcade.help(this.medal === 'gold' ? 'A gold medal! That makes a double portion.' : 'All done! Tap to plate it up.');
        Arcade.label('act', 'YUM!');
    },
    draw(g) {
        ckKitchen(g);
        if (this.phase === 'plate') { this.drawPlate(g); return; }
        const s = this.s;
        CK_MECH[s.spec.m].draw.call(this, g, s, this.phase === 'go' ? s.t : this.pt);
        popText(g, this.pops, 0, 0);
        // the step dots and the timer
        for (let i = 0; i < this.steps.length; i++) {
            const done = i < this.scores.length, col = done ? ckGrade(this.scores[i])[1] : i === this.i ? '#ffffff' : 'rgba(59,42,69,0.35)';
            ckEll(g, 8 + i * 8, 6, 2.5, 2.5, '#3b2a45'); ckEll(g, 8 + i * 8, 6, 1.6, 1.6, col);
        }
        if (this.phase === 'go' && s.T) {
            const left = clamp(1 - s.t / s.T, 0, 1);
            ckRect(g, 0, COOK_H - 3, COOK_W, 3, 'rgba(59,42,69,0.35)');
            ckRect(g, 0, COOK_H - 3, COOK_W * left, 3, left < 0.25 ? '#ff5a4a' : '#ffd84a');
        }
        if (this.phase === 'intro') {
            const y = 38, k = pxWidth(s.spec.t, 2) > 148 ? 1 : 2;
            ckRect(g, 0, y, COOK_W, 32, '#e0405a'); ckRect(g, 0, y, COOK_W, 2, '#ff7a8a'); ckRect(g, 0, y + 30, COOK_W, 2, '#a8283f');
            pxShadow(g, `STEP ${this.i + 1} OF ${this.steps.length}`, 80, y + 5, '#ffe0e6', 1, 'center', '#a8283f');
            pxShadow(g, s.spec.t, 80, y + (k === 2 ? 14 : 17), '#ffffff', k, 'center', '#a8283f');
            if (this.pt > 26 && (this.pt >> 4) % 2) pxText(g, G.touchUsed ? 'TAP TO START' : 'PRESS SPACE', 80, y + 36, '#3b2a45', 1, 'center');
        } else if (this.phase === 'grade') {
            const [w, col] = ckGrade(this.scores[this.scores.length - 1]);
            const bounce = Math.max(0, 8 - this.pt) * 1.5;
            ckRect(g, 0, 44, COOK_W, 24, 'rgba(59,42,69,0.6)');
            pxShadow(g, w, 80, 48 - bounce, col, 3, 'center', '#3b2a45');
            for (let i = 0; i < 6; i++) ckSparkle(g, 20 + i * 24, 40 + ((i * 13) % 30), this.pt + i * 5, col);
        }
    },
    drawPlate(g) {
        for (let y = 72; y < COOK_H; y += 8) for (let x = ((y >> 3) % 2) * 8; x < COOK_W; x += 16) ckRect(g, x, y, 8, 8, 'rgba(224,64,90,0.35)');
        ckEll(g, 72, 76, 36, 10, 'rgba(0,0,0,0.12)'); ckEll(g, 72, 72, 36, 11, '#f7f3ea'); ckEll(g, 72, 71, 30, 8, '#e8e0d4');
        const k = this.pt < 12 ? 1 + this.pt / 4 : 4;
        ckSpr(g, 'dish_' + this.rid, 72, 56, Math.round(k));
        for (let i = 0; i < 8; i++) { const a = i * 0.8 + this.pt / 30; ckSparkle(g, Math.round(72 + Math.cos(a) * 44), Math.round(52 + Math.sin(a) * 26), this.pt + i * 4, i % 2 ? '#ffffff' : '#ffd84a'); }
        const mc = { gold: ['#ffd84a', '#c89a10'], silver: ['#e8eef4', '#a8b4c0'], bronze: ['#e8a060', '#a8683a'] }[this.medal];
        if (this.pt > 20) {
            const my = 36 + Math.max(0, 30 - this.pt) * 2;
            ckRect(g, 128, my - 20, 5, 14, '#4f86c6'); ckRect(g, 135, my - 20, 5, 14, '#e0405a');
            ckEll(g, 134, my, 11, 11, mc[1]); ckEll(g, 134, my, 9, 9, mc[0]);
            for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5; ckRect(g, 134 + Math.cos(a) * 4, my + Math.sin(a) * 4, 2, 2, '#ffffff'); }
            ckRect(g, 133, my - 1, 3, 3, '#ffffff');
        }
        ckRect(g, 0, 92, COOK_W, 28, 'rgba(59,42,69,0.55)');
        pxShadow(g, this.recipe.name, 80, 96, '#ffffff', 1, 'center', '#3b2a45');
        pxShadow(g, this.medal.toUpperCase() + ' MEDAL!', 80, 106, mc[0], 1, 'center', '#3b2a45');
        if (this.medal === 'gold') pxShadow(g, 'DOUBLE PORTION!', 80, 114, '#8cf0a0', 1, 'center', '#3b2a45');
    },
};
const COOK_LINES = {
    gold: ['Perfect! Fortune would put this in the shop window.', 'Chef Sarah! Even Maki would call this precise.', 'Wow. Joe is going to want a poem about this. He\'ll write a great one.', 'Restaurant quality. Mac would hire you on the spot.'],
    silver: ['Delicious! A little messy, a lot tasty.', 'So good! Practice makes perfect-er.', 'Yum! The kitchen smells amazing.'],
    bronze: ["It's... rustic! Still very tasty.", 'Every chef starts somewhere. This somewhere is yummy.', 'A little lumpy, a lot of love.'],
};
ARCADE_GAMES.cook = {
    name: 'Cooking', fee: 0, tune: 'cooking', glow: '#ffb030', kitchen: true, noReady: true, w: COOK_W, h: COOK_H, scored: false,
    pauseNote: 'The stove will wait. Everything is on low.', quitLabel: 'Stop cooking',
    buttons: [
        { k: 'left', label: '\u25c0', keys: ['ArrowLeft', 'KeyA'], side: 'L', aria: 'Left' },
        { k: 'right', label: '\u25b6', keys: ['ArrowRight', 'KeyD'], side: 'L', aria: 'Right' },
        { k: 'up', keys: ['ArrowUp', 'KeyW'], noPad: true },
        { k: 'down', keys: ['ArrowDown', 'KeyS'], noPad: true },
        { k: 'act', label: 'GO', keys: ['Space', 'Enter', 'KeyE', 'KeyX', 'KeyJ', 'KeyZ', 'NumpadEnter'], side: 'R', aria: 'Action', wide: true },
    ],
    create(opts) { return new CookGame(opts); },
    result(g) {
        const name = g.recipe.name, two = g.medal === 'gold';
        return { title: { gold: 'Gold medal!', silver: 'Silver medal!', bronze: 'Bronze medal!' }[g.medal], icon: 'dish_' + g.rid,
            lines: [two ? `Sarah made two servings of ${name}!` : `Sarah made ${name}!`, rpick(COOK_LINES[g.medal])], btn: 'Yum!' };
    },
};

/* ---------------------------------------------------------------- from the kitchen menu */
function cookLog() { if (!S.cookLog) S.cookLog = {}; return S.cookLog; }
function medalTag(m) { const t = el('span', 'medal ' + m, m ? cap(m) : ''); t.hidden = !m; return t; }
async function cookDish(r, quick) {
    let medal = null;
    if (!quick) {
        const res = await Arcade.start('cook', { recipe: r.id, home: true, title: 'Cooking: ' + r.name });
        if (!res || res.quit || !res.medal) return false;
        medal = res.medal;
    }
    if (!Object.entries(r.need).every(([k, n]) => kitchenCount(k) >= n)) { UI.toast('Missing ingredients.'); return false; }
    for (const [k, n] of Object.entries(r.need)) useIngredient(k, n);
    let made = 1;
    if (medal === 'gold') made = 2;
    receive(r.id, made);
    markFresh(r.id, made);
    Sfx.play('cook');
    S.stats.cooked = (S.stats.cooked || 0) + 1;
    const L = cookLog(), c = L[r.id] || (L[r.id] = { medal: null, plays: 0 });
    if (medal) { c.plays++; if ((CK_MEDALS[medal] || 0) > (CK_MEDALS[c.medal] || 0)) c.medal = medal; }
    if (G.player) { G.player.pose = 'cheer'; G.player.poseT = 30; }
    Bus.emit('cooked', { id: r.id, medal, made });
    Save.touch();
    if (quick) UI.toast(`Made ${r.name}!`, 'dish_' + r.id);
    else if (medal === 'gold' && made < 2) UI.toast('Gold medal! (No room in your pocket for the second serving.)', 'dish_' + r.id);
    await checkSpecialMilestones();
    await flushSpecials();
    await maybeSpecial(0.1, ['recipe', 'poem', 'acc'], 'Tucked in the cookbook, Sarah finds something special!');
    return true;
}

