/* Portraits: a bust of whoever's speaking, in the dialogue box beside their words. Each is generated from the person's
   look (the same body, hair, colours and extras as their sprite: src/19_people.js), so every townsperson has one, with
   the main cast tuned by hand (PORTRAIT_TUNE). 32x32 pixels in the house style: a dark outline, two or three shades a
   colour, the light from the top left. Built as a pixel grid like every sprite, then compiled once per person,
   expression, mouth (shut or open, for talking) and eyes (open or shut, for blinking).
   A line picks its face with a leading mark: "{happy}Four Knots!" (EXPRESSIONS); a line without one is neutral. */

const EXPRESSIONS = ['neutral', 'happy', 'sad', 'surprised', 'cross', 'worried'];
const PORTRAIT = 32;
/* (the skin tones are makePerson's: a person's portrait and sprite always agree) */
const PORTRAIT_SKIN = { light: ['#f2c49b', '#d8956b'], tan: ['#d9a070', '#b0744a'], brown: ['#a8684a', '#7e4a32'], dark: ['#7a4a32', '#5a3220'], pale: ['#f6d8bc', '#dcae8c'] };
/* Wren has a sprite of her own rather than a look: this is the same person */
const WREN_LOOK = { body: 'child', hair: 'bob', hairC: '#a5532a', top: '#e7ad3c', accent: '#e8463c', bottom: '#3a5fae', skin: 'light' };
/* the main cast, by hand, where the look alone falls short (and, with when(), a face kept back until the story's ready
   to show it: none of the cast needs it now, as nobody speaks in costume before Reveal 1) */
const PORTRAIT_TUNE = {
    gran: { cheeks: true },
    ives: { cheeks: true },
    tess: { cheeks: true },
    mallow: { sleepy: true },
    jory: { glassC: '#c9a040' },
    mrives: { glassC: '#4a3a40' },
    quill: { glassC: '#4a3a40' },
    /* (the girl in green ribbons on the old playbill, and in Miss Quill's old drawing) */
    linnet: { ribbon: true, ribbonC: '#5ab85a' },
};
/* someone in costume for the moment, whose picture wears it too: Otto playing the Housekeeper (in the square, on the Making
   Floor, in the Little Houses) has his folded paper hat on over his hair, not his cap */
const PORTRAIT_DRESS = {
    otto: () => { const a = G.map; return a && a.ents && a.ents.some(e => e.kind === 'npc' && e.who === 'otto' && e.paperHat && !e.removed) ? { hair: 'short', paperHat: true, dress: 'hat' } : null; },
};

/* a leading expression mark, if the line has one: ['happy', 'the rest'] */
function exprOf(text) {
    const m = /^\{([a-z]+)\}/.exec(text || '');
    return m && EXPRESSIONS.includes(m[1]) ? [m[1], text.slice(m[0].length)] : ['neutral', text];
}

/* ---- the grid: 32 rows of 32 characters, '.' clear ---- */
function pGrid() { return Array.from({ length: PORTRAIT }, () => Array(PORTRAIT).fill('.')); }
function pIn(x, y) { return x >= 0 && y >= 0 && x < PORTRAIT && y < PORTRAIT; }
function pAt(g, x, y) { return pIn(x, y) ? g[y][x] : '.'; }
function pSet(g, x, y, ch) { if (pIn(x, y)) g[y][x] = ch; }
/* a part, painted on its own layer, then laid on the picture with a dark edge round it where it meets what's behind
   (skip(x, y): where it gets none) */
function pLay(g, part, edge = 'k', skip = null) {
    if (edge) for (let y = 0; y < PORTRAIT; y++) for (let x = 0; x < PORTRAIT; x++) {
        if (part[y][x] !== '.') continue;
        const near = pAt(part, x - 1, y) !== '.' || pAt(part, x + 1, y) !== '.' || pAt(part, x, y - 1) !== '.' || pAt(part, x, y + 1) !== '.';
        if (near && !(skip && skip(x, y))) g[y][x] = edge;
    }
    for (let y = 0; y < PORTRAIT; y++) for (let x = 0; x < PORTRAIT; x++) if (part[y][x] !== '.') g[y][x] = part[y][x];
}
/* rows of characters stamped at (x0, y0); '.' leaves what's there */
function pStamp(g, rows, x0, y0) { rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== '.') pSet(g, x0 + i, y0 + j, r[i]); }); }
/* a shape from half-widths by row ({ y: hw }): symmetric about the middle (columns 16 - hw to 15 + hw) */
function pSpans(part, spans, ch, dy = 0) {
    for (const [y, hw] of Object.entries(spans)) for (let x = 16 - hw; x <= 15 + hw; x++) pSet(part, x, +y + dy, ch);
    return part;
}

/* ---- the bodies: the face's shape (half-widths by row), the shoulders; a child's head sits a row lower ---- */
const P_FACE = { 4: 5, 5: 7, 6: 8, 7: 9, 8: 9, 9: 9, 10: 9, 11: 9, 12: 9, 13: 9, 14: 9, 15: 9, 16: 9, 17: 9, 18: 8, 19: 7, 20: 6, 21: 5, 22: 3 };
const P_BODY = {
    adult: { dy: 0, face: P_FACE, torso: { 25: 9, 26: 11, 27: 12, 28: 13, 29: 14, 30: 14, 31: 14 } },
    /* (a child: the same round head a row lower, small shoulders, rosy cheeks, a scarf) */
    child: { dy: 1, face: Object.assign({}, P_FACE, { 18: 8, 19: 8, 20: 7, 21: 5, 22: 3 }), torso: { 26: 7, 27: 9, 28: 10, 29: 11, 30: 11, 31: 11 }, child: true },
    /* (an elder: a broader jaw, rounder shoulders) */
    elder: { dy: 0, face: Object.assign({}, P_FACE, { 18: 9, 19: 8, 20: 7, 21: 5, 22: 3 }), torso: { 25: 8, 26: 11, 27: 12, 28: 13, 29: 13, 30: 14, 31: 14 } },
};
/* where the features sit (before a body's dy) */
const P_FEAT = { eyeY: 13, eyeL: 10, eyeR: 19, browY: 11, noseY: 17, mouthY: 19 };

/* the colours a look paints with */
function portraitLegend(L) {
    const [s1, s2] = PORTRAIT_SKIN[L.skin || 'light'] || PORTRAIT_SKIN.light;
    const hair = L.hairC || '#6b4128', top = L.top || '#5a8ad0', acc = L.accent || top;
    const pale = luminance(hair) > 0.45, dark = luminance(hair) < 0.03, cap = L.capC || acc;
    return {
        k: PAL.ink, e: '#3d2c3e', E: L.eyeC || '#7a5a6a', w: '#fbf6ea',
        j: shade(s1, 0.28), s: s1, S: s2, J: shade(s2, -0.25),
        c: mix(s1, '#ee6a6a', 0.4),
        m: shade(s2, -0.5), n: '#8e2f3c', W: '#fbf6ea',
        h: hair, H: shade(hair, pale ? -0.22 : -0.3), l: dark ? mix(hair, '#9a8aa8', 0.45) : shade(hair, pale ? 0.5 : 0.3), K: shade(hair, pale ? -0.45 : -0.55),
        b: pale ? shade(hair, -0.4) : dark ? hair : shade(hair, -0.35),
        t: top, T: shade(top, -0.28), u: shade(top, 0.22),
        a: acc, A: shade(acc, -0.28), y: shade(acc, 0.25),
        q: cap, Q: shade(cap, -0.3), Y: shade(cap, 0.25),
        g: L.glassC || '#8a7880', G: '#ffffff', d: '#7ec8f0', D: '#e4f6ff',
        r: L.ribbonC || '#5ab85a', R: shade(L.ribbonC || '#5ab85a', -0.3),
        p: '#f6f1e6', P: '#cfc6b2',
    };
}

/* ---- the features by expression: the left eye (the right is its mirror, with the glint still on the left, where
   the light comes from), the brows, the mouth ---- */
const P_EYES = {
    open: [0, ['kkk', 'wee', 'eee', '.eE']],
    shut: [0, ['...', '...', 'kkk', '...']],
    happy: [0, ['...', '.k.', 'k.k', '...']],
    sad: [0, ['...', 'kkk', 'wee', '.eE']],
    wide: [-1, ['kkk', 'wee', 'eee', 'eee', '.E.']],
    narrow: [0, ['...', 'kk.', 'wek', '.eE']],
    heavy: [0, ['...', 'kkk', 'wee', '.eE']],
};
const P_EYE_FOR = { neutral: 'open', happy: 'happy', sad: 'sad', surprised: 'wide', cross: 'narrow', worried: 'open' };
/* brows: for the left eye, four pixels from its outer end in, each the row it sits on (from browY) */
const P_BROWS = { neutral: [0, 0, 0, 0], happy: [0, -1, -1, 0], sad: [1, 0, 0, -1], surprised: [-1, -2, -2, -1], cross: [-1, 0, 1, 1], worried: [1, 1, 0, -1] };
/* the mouth, centred under the nose: shut, and open (talking) */
const P_MOUTH = {
    neutral: [['.mm.'], ['.mm.', 'mnnm', '.mm.']],
    happy: [['m..m', '.mm.'], ['mmmm', 'mnnm', '.mm.']],
    sad: [['.mm.', 'm..m'], ['.mm.', 'mnnm', 'm..m']],
    surprised: [['.mm.', 'mnnm', '.mm.'], ['.mm.', 'mnnm', 'mnnm', '.mm.']],
    cross: [['mmmm', 'm..m'], ['mmmm', 'mWWm', '.mm.']],
    worried: [['..m.', 'mm.m'], ['.mm.', 'mnnm', 'm..m']],
};

/* ---- hair: a dome over the head, then down each column to where the fringe (or the sides) end ---- */
const P_DOME = [5, 4, 3, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 4, 5];      /* columns 6 to 25: the top of the hair */
/* each style: how far below the dome it starts, and the lowest row of hair in each column 6..25 (the fringe over the
   forehead, the sides past the ears) */
const P_HAIRCUT = {
    short: [0, [12, 12, 10, 9, 8, 7, 8, 9, 8, 7, 7, 8, 9, 8, 7, 8, 9, 10, 12, 12]],
    tuft: [1, [12, 12, 10, 9, 8, 7, 8, 9, 8, 7, 7, 8, 9, 8, 7, 8, 9, 10, 12, 12]],
    long: [0, [30, 30, 13, 11, 10, 9, 9, 8, 7, 6, 6, 7, 8, 9, 9, 10, 11, 13, 30, 30]],
    bun: [3, [12, 11, 9, 8, 7, 7, 6, 6, 6, 6, 6, 6, 6, 6, 7, 7, 8, 9, 11, 12]],
    bob: [0, [19, 19, 13, 9, 9, 8, 9, 9, 9, 8, 9, 9, 9, 8, 9, 9, 9, 13, 19, 19]],
    cap: [0, [12, 12, 10, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 12, 12]],
};
function hairPart(L, dy) {
    const part = pGrid(), style = P_HAIRCUT[L.hair] ? L.hair : L.hair === 'bald' ? 'bald' : 'short';
    if (style === 'bald') {
        /* what's left: a tuft over each ear */
        for (const [x, y] of [[5, 11], [6, 10], [6, 11], [5, 12], [6, 12], [5, 13], [6, 13], [26, 11], [25, 10], [25, 11], [26, 12], [25, 12], [26, 13], [25, 13], [7, 11], [24, 11]]) pSet(part, x, y + dy, x >= 24 ? 'H' : 'h');
        pSet(part, 6, 10 + dy, 'l');
        return part;
    }
    const [down, low] = P_HAIRCUT[style], top = i => P_DOME[i] + down;
    for (let i = 0; i < 20; i++) for (let y = top(i); y <= low[i]; y++) pSet(part, 6 + i, y + dy, 'h');
    /* long hair falls over the shoulders, a little wider than the head; a bob to the jaw */
    if (style === 'long') for (let y = 12; y <= 30; y++) { pSet(part, 5, y + dy, 'h'); pSet(part, 26, y + dy, 'h'); if (y >= 17) { pSet(part, 4, y + dy, 'h'); pSet(part, 27, y + dy, 'h'); } }
    if (style === 'bob') for (let y = 7; y <= 18; y++) { pSet(part, 5, y + dy, 'h'); pSet(part, 26, y + dy, 'h'); }
    if (style === 'tuft') for (const [x, y] of [[13, 1], [14, 0], [14, 1], [15, 1], [16, -1], [16, 0], [16, 1], [17, 0], [17, 1], [18, 1]]) pSet(part, x, y + dy, 'h');
    /* light from the top left: a shine across the crown; shade to the right, at the tips and between the locks */
    for (let y = 0; y < PORTRAIT; y++) for (let x = 0; x < PORTRAIT; x++) {
        if (part[y][x] !== 'h') continue;
        const i = clamp(x - 6, 0, 19), t = top(i) + dy, bot = pAt(part, x, y + 1) === '.';
        if (x >= 24 || (x >= 21 && y > t + 1) || x <= 4) part[y][x] = 'H';
        if (bot && y > t + 2) part[y][x] = x >= 15 ? 'K' : 'H';
        else if (y === t + 2 && x >= 8 && x <= 15 && x % 4 !== 3) part[y][x] = 'l';
        else if (y === t + 1 && x >= 10 && x <= 13) part[y][x] = 'l';
    }
    /* the locks: a darker line up from each notch in the fringe; long hair's strands */
    for (let i = 1; i < 19; i++) if (low[i] < low[i - 1] && low[i] <= low[i + 1] && low[i] < 12) for (let k = 1; k <= 2; k++) if (pAt(part, 6 + i, low[i] - k + dy) === 'h') pSet(part, 6 + i, low[i] - k + dy, 'H');
    if (style === 'long') for (let y = 14; y <= 30; y++) { if (pAt(part, 6, y + dy) === 'h') pSet(part, 6, y + dy, 'H'); if (pAt(part, 25, y + dy) !== '.') pSet(part, 25, y + dy, 'K'); if (y <= 22 && pAt(part, 5, y + dy) === 'h' && y % 5) pSet(part, 5, y + dy, 'l'); }
    if (style === 'bob') for (let y = 10; y <= 18; y++) { if (pAt(part, 7, y + dy) === 'h') pSet(part, 7, y + dy, 'H'); if (y <= 15 && pAt(part, 5, y + dy) === 'h') pSet(part, 5, y + dy, 'l'); }
    return part;
}

/* ---- the picture ---- */
function portraitRows(L, expr = 'neutral', mouthOpen = false, eyesShut = false) {
    const B = P_BODY[L.body] || P_BODY.adult, dy = B.dy;
    const g = pGrid();
    const extra = new Set(L.extra || []);
    /* behind the head: long hair's back */
    if (L.hair === 'long') { const back = pGrid(); for (let y = 12; y <= 29; y++) for (let x = 6; x <= 25; x++) pSet(back, x, y + dy, x > 15 ? 'K' : 'H'); pLay(g, back); }
    /* the shoulders, in the top: the accent down the front (a collar, a placket, an apron's bib) */
    const torso = pSpans(pGrid(), B.torso, 't');
    for (let y = 0; y < PORTRAIT; y++) for (let x = 0; x < PORTRAIT; x++) if (torso[y][x] === 't') {
        const hw = B.torso[y] || 0, rx = 15 + hw;
        if (x >= rx - 2 || (x >= 19 && y >= 30)) torso[y][x] = 'T'; else if (x <= 16 - hw + 2 && y <= 28) torso[y][x] = 'u';
    }
    if (!B.child) for (let y = 26; y < PORTRAIT; y++) for (let x = 14; x <= 17; x++) torso[y][x] = x === 17 ? 'A' : 'a';
    pLay(g, torso);
    /* the neck, in the shade of the chin; a collar round it */
    const neck = pGrid();
    for (let y = 22; y <= 26; y++) for (let x = 13; x <= 18; x++) pSet(neck, x, y + dy, y <= 23 || x >= 17 ? 'J' : 'S');
    pLay(g, neck);
    if (!B.child) { const col = pGrid(); for (const [x, y, c] of [[11, 25, 'y'], [12, 25, 'a'], [12, 26, 'a'], [13, 26, 'y'], [13, 27, 'a'], [20, 25, 'A'], [19, 25, 'a'], [19, 26, 'A'], [18, 26, 'a'], [18, 27, 'A']]) pSet(col, x, y, c); pLay(g, col); }
    if (B.child) {
        /* a child's scarf, its end hanging down the front */
        const scarf = pGrid();
        pSpans(scarf, { 24: 5, 25: 6, 26: 6 }, 'a');
        for (let x = 0; x < PORTRAIT; x++) { if (scarf[26][x] === 'a') scarf[26][x] = 'A'; if (x >= 19 && scarf[25][x] === 'a') scarf[25][x] = 'A'; if (x <= 12 && scarf[24][x] === 'a') scarf[24][x] = 'y'; }
        for (let y = 27; y <= 31; y++) { scarf[y][18] = 'a'; scarf[y][19] = 'a'; scarf[y][20] = 'A'; }
        pLay(g, scarf);
    }
    /* a bald head's scalp, then the face: lit from the top left */
    const face = pGrid();
    if (L.hair === 'bald') for (let i = 1; i < 19; i++) for (let y = P_DOME[i] + 1; y <= 8; y++) pSet(face, 6 + i, y + dy, 's');
    pSpans(face, B.face, 's', dy);
    for (let y = 0; y < PORTRAIT; y++) {
        const xs = []; for (let x = 0; x < PORTRAIT; x++) if (face[y][x] === 's') xs.push(x);
        if (!xs.length) continue;
        const x0 = xs[0], x1 = xs[xs.length - 1];
        face[y][x1] = 'S'; if (y >= 12 + dy && y <= 21 + dy) face[y][x1 - 1] = 'S';
        if (y >= 21 + dy) for (let x = 17; x <= x1; x++) face[y][x] = 'S';
        if (y === 22 + dy) for (let x = x0; x <= x1; x++) face[y][x] = 'S';
        if (y <= 12 + dy && x0 + 1 < x1) face[y][x0 + 1] = 'j';
    }
    if (L.hair === 'bald') for (const [x, y] of [[11, 3], [12, 3], [10, 4], [11, 4], [10, 5], [13, 2]]) pSet(face, x, y + dy, 'j');
    /* the ears */
    for (const ex of [6, 25]) for (let y = 13; y <= 16; y++) pSet(face, ex, y + dy, ex === 25 || y === 16 ? 'S' : 's');
    pLay(g, face);
    /* the hair over it; its shadow on the forehead */
    const hair = hairPart(L, dy);
    pLay(g, hair, 'k');
    /* a bun: a ball of hair sat on top */
    if (L.hair === 'bun') {
        const bun = pSpans(pGrid(), { 0: 2, 1: 3, 2: 3, 3: 3, 4: 2 }, 'h', dy);
        for (const [x, y, c] of [[14, 1, 'l'], [15, 1, 'l'], [14, 2, 'l'], [13, 2, 'l'], [18, 1, 'H'], [18, 2, 'H'], [18, 3, 'H'], [17, 4, 'H'], [16, 4, 'H'], [17, 3, 'H']]) pSet(bun, x, y + dy, c);
        pLay(g, bun);
    }
    for (let y = 2; y < PORTRAIT; y++) for (let x = 0; x < PORTRAIT; x++) if (hair[y][x] === '.' && pAt(g, x, y - 1) === 'k' && 'hHlK'.includes(pAt(hair, x, y - 2)) && 'sj'.includes(g[y][x])) g[y][x] = 'S';
    /* the features */
    const kind = eyesShut && expr !== 'happy' ? 'shut' : L.sleepy && expr === 'neutral' ? 'heavy' : P_EYE_FOR[expr] || 'open';
    const [eo, eye] = P_EYES[kind];
    pStamp(g, eye, P_FEAT.eyeL, P_FEAT.eyeY + dy + eo);
    /* (the right eye: mirrored, but its glint stays at the top left of the iris) */
    const right = eye.map(r => { let m = r.split('').reverse().join(''); const i = m.indexOf('w'), j = m.indexOf('e'); if (i >= 0 && j >= 0 && j < i) m = m.slice(0, j) + 'w' + m.slice(j + 1, i) + 'e' + m.slice(i + 1); return m; });
    pStamp(g, right, P_FEAT.eyeR, P_FEAT.eyeY + dy + eo);
    const brow = P_BROWS[expr] || P_BROWS.neutral;
    brow.forEach((d, i) => { pSet(g, P_FEAT.eyeL - 1 + i, P_FEAT.browY + dy + d, 'b'); pSet(g, P_FEAT.eyeR + 3 - i, P_FEAT.browY + dy + d, 'b'); });
    if (!B.child) pSet(g, 16, P_FEAT.noseY + dy, 'S');
    const [shut, open] = P_MOUTH[expr] || P_MOUTH.neutral, mouth = mouthOpen ? open : shut;
    /* extras: a beard (round the mouth), a moustache over it, glasses */
    if (extra.has('beard')) {
        const bd = pGrid();
        pStamp(bd, [
            'hh..............HH',
            'hh..............HH',
            'hhh............HHH',
            'hhh............HHH',
            'hhhh..........HHHH',
            'lhhhh........hhHHH',
            '.lhhhh......hhhHH.',
            '.lhhhhh....hhhhHH.',
            '..lhhhhhhhhhhhHH..',
            '...hhhhhhhhhhhH...',
            '.....hhhhhhhH.....',
        ], 7, 13 + dy);
        pLay(g, bd, 'k', (x, y) => y < 19 + dy && x > 9 && x < 22);
    }
    pStamp(g, mouth, 14, P_FEAT.mouthY + dy - (mouth.length > 2 ? 1 : 0));
    if (extra.has('mustache') || extra.has('beard')) { const mu = pGrid(); pStamp(mu, ['.lhhhhH.', 'hhhH.HHH'], 12, 17 + dy); pLay(g, mu, 'k', (x, y) => y < 17 + dy || 'mnW'.includes(pAt(g, x, y)) || extra.has('beard')); }
    const cy = P_FEAT.eyeY + dy + (extra.has('glasses') ? 5 : 4);
    if (B.child || L.cheeks) for (const x of [9, 10, 21, 22]) if ('sjS'.includes(pAt(g, x, cy))) pSet(g, x, cy, 'c');
    if (extra.has('glasses')) {
        /* round wire rims a little wider than the eyes, a glint on each, arms back to the ears */
        const gl = pGrid();
        for (const x0 of [P_FEAT.eyeL - 2, P_FEAT.eyeR - 1]) { pStamp(gl, ['.gggg.', 'g....g', 'g....g', 'g....g', 'g....g', '.gggg.'], x0, P_FEAT.eyeY - 1 + dy); pSet(gl, x0 + 1, P_FEAT.eyeY - 1 + dy, 'G'); }
        pStamp(gl, ['gggg'], 14, P_FEAT.eyeY + 1 + dy); pSet(gl, 7, P_FEAT.eyeY + dy, 'g'); pSet(gl, 24, P_FEAT.eyeY + dy, 'g');
        pLay(g, gl, null);
    }
    if (expr === 'worried') pStamp(g, ['.d.', 'dDd', 'ddd', '.d.'], 23, 8 + dy);
    if (L.ribbon) for (const [x0, flip] of [[4, false], [24, true]]) {
        const bow = pGrid();
        pStamp(bow, flip ? ['rr.r', 'RrRr', 'r..R'] : ['r.rr', 'rRrR', 'R..r'], x0, 10 + dy);
        pLay(g, bow);
    }
    /* a cap, over all */
    if (L.hair === 'cap') {
        const cap = pGrid();
        for (let i = 1; i < 19; i++) for (let y = P_DOME[i]; y <= 7; y++) pSet(cap, 6 + i, y + dy, 'q');
        for (let x = 5; x <= 26; x++) pSet(cap, x, 8 + dy, 'Q');
        for (let x = 7; x <= 24; x++) pSet(cap, x, 9 + dy, x >= 17 ? 'Q' : 'q');
        for (let y = 0; y < PORTRAIT; y++) for (let x = 0; x < PORTRAIT; x++) if (cap[y][x] === 'q' && y <= 7 + dy) { if (x >= 21) cap[y][x] = 'Q'; else if (y <= 3 + dy && x >= 9 && x <= 14) cap[y][x] = 'Y'; }
        pLay(g, cap);
    }
    /* a folded paper hat (playing the Housekeeper), over all: a tall white peak, a band folded up round the bottom of it,
       shaded on the right */
    if (L.paperHat) {
        const hat = pGrid();
        for (let y = 0; y <= 5; y++) { const hw = 1 + Math.round(y * 1.6); for (let x = 16 - hw; x <= 15 + hw; x++) pSet(hat, x, y + dy - 1, x > 15 + hw - Math.max(1, y) ? 'P' : 'p'); }
        for (let x = 6; x <= 25; x++) { pSet(hat, x, 5 + dy, x >= 21 ? 'P' : 'p'); pSet(hat, x, 6 + dy, 'P'); }
        pLay(g, hat);
    }
    return g.map(r => r.join(''));
}

const Portraits = {
    cache: new Map(),
    /* the look a portrait is built from: Wren's own, or a person's with any tuning (null: no portrait) */
    dressOf(who) { const f = PORTRAIT_DRESS[who]; return f ? f() : null; },
    look(who) {
        if (who === 'wren') return WREN_LOOK;
        const d = PEOPLE_DEF[who], t = PORTRAIT_TUNE[who], dr = this.dressOf(who);
        if (!d || !d.look || (t && t.when && !t.when())) return null;
        return t || dr ? Object.assign({}, d.look, t, dr) : d.look;
    },
    has(who) { return !!(who && this.look(who)); },
    rows(who, expr, mouth, eyes) { const L = this.look(who); return L ? portraitRows(L, expr, mouth, eyes) : null; },
    get(who, expr = 'neutral', mouth = false, eyes = false) {
        const dr = this.dressOf(who), k = who + (dr ? '~' + dr.dress : '') + '|' + expr + '|' + (mouth ? 1 : 0) + (eyes ? 1 : 0);
        if (this.cache.has(k)) return this.cache.get(k);
        const L = this.look(who); if (!L) return null;
        const c = compileGrid(portraitRows(L, expr, mouth, eyes), Object.assign({}, LEGEND, portraitLegend(L)));
        this.cache.set(k, c);
        return c;
    },
};
