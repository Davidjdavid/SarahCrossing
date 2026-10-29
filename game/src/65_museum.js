/* ---- 65_museum.js ---- */
/* The museum: Brulee's gallery for things Sarah makes. Paint at an easel (a little pixel painting studio), then
   donate paintings and pottery: they go up on the walls and pedestals. Paintings are also furniture, so they can
   hang at home or go to a friend as a gift. */
const ART_W = 32, ART_H = 24;
const ART_PAL = ['#f7f2ea', '#2d2230', '#6b6570', '#c8c4cc', '#ffffff', '#e0405a', '#ff9ec0', '#f7962d', '#ffd84a', '#fff1b8',
    '#8cc152', '#3f8f45', '#4ec3d9', '#4f86c6', '#2c3e66', '#b37cf0', '#6b3fa0', '#8a5a3c', '#d9a46a', '#f2c8a8',
    '#c0773a', '#9fd8ef', '#c9e8a2', '#ffd1ea'];
const ART_PAL_NAMES = ['paper', 'ink', 'gray', 'silver', 'white', 'red', 'pink', 'orange', 'yellow', 'cream', 'green', 'forest', 'sky', 'blue',
    'navy', 'lilac', 'purple', 'brown', 'tan', 'peach', 'ginger', 'ice blue', 'mint', 'blush'];
const ART_FRAMES = { gold: ['#d9b44a', '#b8942a', '#f2d880'], wood: ['#b98552', '#8a5a33', '#d9a46a'], white: ['#f7f4ee', '#cfc8bc', '#ffffff'], black: ['#3b3340', '#1f1a24', '#6b6570'] };
const ART_CODE = '0123456789abcdefghijklmnopqrstuvwxyz';
const ART_IDEAS = ['the sea at sunset', 'a goat. Just a goat', 'your favorite neighbor', 'a bowl of fruit', 'the windmill on the hill', 'a night sky full of stars',
    'your house', 'a flower you picked today', 'Joe reading a poem', 'the waterfall', 'a giant cheesecake', 'the island from above', 'a rainy day',
    'your favorite snack', 'a self-portrait', 'a very happy fish', 'the club at 2 AM', 'a cozy room'];
/* Brulee's own pieces, and the painters */
const ART_STARTERS = {
    art_stilllife: ['Still Life with Clementine', 'Brulee', 'Clementine chose the fruit, the cloth, and the light. Brulee was allowed to choose the brush.'],
    art_seaside: ['Sunset at the Pier', 'Brulee', 'The pier at six, with Joe reading beside the easel. The painting took three poems.'],
    art_goat: ['Portrait of a Goat', 'David', "It's a goat. Nothing else to say. (David says there is a lot else to say.)"],
};

/* the neighbors paint too: each one has a piece in Brulee's collection, painted right here in code */
const NPC_ART = {
    kai: ['Big Wave', 'Kai painted this in one sitting. Then he took a nap in the same sitting.', 'white', P => {
        P.fill(12); P.disc(26, 5, 3, 8); P.rect(0, 15, 32, 9, 13);
        for (let x = 0; x < 32; x++) { const top = 13 + Math.round(3 * Math.sin(x * 0.4)); P.rect(x, top, 1, 24 - top, 13); P.set(x, top, 4); P.set(x, top + 1, 21); }
        P.disc(10, 11, 4, 13); P.ring(10, 11, 4, 4); P.disc(11, 12, 2, 12); P.set(6, 8, 4); P.set(14, 7, 4); }],
    maki: ['Grid No. 7', 'Every square is exactly the same size. Maki checked with a ruler. Twice.', 'black', P => {
        P.fill(4); for (let i = 0; i <= 8; i++) P.line(i * 4, 0, i * 4, 23, 1); for (let j = 0; j <= 6; j++) P.line(0, j * 4, 31, j * 4, 1);
        for (const [cx, cy, c] of [[1, 1, 5], [3, 2, 19], [5, 4, 10], [6, 1, 8], [2, 4, 13]]) P.rect(cx * 4 + 1, cy * 4 + 1, 3, 3, c); }],
    coco: ['Self-Portrait with Glow', "Coco asked whether the smile was too much. Then asked Brulee to make it a little larger.", 'gold', P => {
        P.fill(9); P.disc(16, 12, 8, 8); P.disc(16, 13, 7, 17); P.disc(13, 10, 2, 20); P.rect(13, 12, 1, 2, 1); P.rect(19, 12, 1, 2, 1);
        P.line(14, 16, 18, 16, 1); P.set(11, 15, 6); P.set(21, 15, 6); P.rect(9, 20, 2, 3, 17); P.rect(22, 21, 2, 2, 17); }],
    cece: ['Sorry (in Blue)', 'Cece apologized to the canvas before every brushstroke. It shows. It\'s lovely.', 'white', P => {
        P.rect(0, 0, 32, 6, 13); P.rect(0, 6, 32, 6, 12); P.rect(0, 12, 32, 6, 21); P.rect(0, 18, 32, 6, 4);
        P.disc(14, 10, 2, 6); P.disc(18, 10, 2, 6); for (let j = 0; j < 5; j++) P.line(12 + j, 12 + j, 20 - j, 12 + j, 6); }],
    chili: ['Hot', 'Chili painted it in four minutes. He says the paint was too spicy to wait.', 'black', P => {
        P.fill(1);
        for (let x = 0; x < 32; x++) { const h = 9 + Math.round(6 * Math.abs(Math.sin(x * 0.5))) + (x % 3); P.rect(x, 24 - h, 1, h, 5); P.rect(x, 24 - Math.round(h * 0.6), 1, Math.round(h * 0.6), 7); P.rect(x, 24 - Math.round(h * 0.3), 1, Math.round(h * 0.3), 8); } }],
    clementine: ['Citrus Couture', 'Clementine calls this a fashion statement. The statement is: orange.', 'gold', P => {
        P.fill(6);
        for (const [cx, cy] of [[8, 8], [23, 7], [15, 17]]) { P.disc(cx, cy, 5, 7); P.disc(cx, cy, 4, 8); for (let a = 0; a < 6; a++) P.line(cx, cy, cx + Math.cos(a) * 4, cy + Math.sin(a) * 4, 9); P.set(cx, cy, 4); } }],
    cuke: ['The Morning Jog', 'Painted mid-jog. We are not sure how. Cuke is not sure how.', 'wood', P => {
        P.fill(12); P.disc(5, 4, 2, 8); P.disc(8, 27, 12, 10); P.disc(26, 29, 14, 11); P.line(0, 23, 31, 17, 18); P.line(0, 22, 31, 16, 18);
        P.rect(20, 11, 2, 4, 10); P.disc(21, 9, 1, 22); P.line(20, 15, 19, 17, 10); P.line(21, 15, 23, 17, 10); }],
    ginger: ['Gears No. 2', 'Ginger fixed the frame, the easel and a clock while painting this.', 'wood', P => {
        P.fill(18);
        for (const [cx, cy, r, c] of [[11, 12, 6, 17], [23, 15, 4, 20]]) { P.disc(cx, cy, r, c); for (let a = 0; a < 8; a++) { const q = (a / 8) * Math.PI * 2; P.set(cx + Math.cos(q) * (r + 1), cy + Math.sin(q) * (r + 1), c); P.set(cx + Math.cos(q) * (r + 2), cy + Math.sin(q) * (r + 2), c); } P.disc(cx, cy, Math.max(1, r - 4), 18); } }],
    mac: ['Cheese Moon', "Mac says the moon is made of cheese. He's a mac and cheese. He would know.", 'gold', P => {
        P.fill(14); for (const [x, y] of [[3, 3], [9, 6], [5, 14], [28, 19], [13, 2], [29, 3]]) P.set(x, y, 4);
        P.disc(20, 9, 6, 8); P.disc(18, 7, 1, 7); P.disc(23, 11, 1, 7); P.set(21, 5, 7); P.set(16, 11, 7); P.rect(0, 20, 32, 4, 11); }],
    wonton: ['Steam', 'A bowl, and steam. Wonton says it is NOT a self-portrait. It is steam.', 'white', P => {
        P.fill(15); P.rect(8, 15, 16, 5, 4); P.rect(10, 20, 12, 2, 4); P.line(8, 16, 23, 16, 13);
        for (const x0 of [12, 16, 20]) for (let y = 2; y < 13; y++) P.set(x0 + Math.round(Math.sin(y * 0.8 + x0)), y, 4); }],
    basil: ['Noodle Dance', 'Basil painted with noodles instead of brushes. Al dente, he says. Very expressive.', 'wood', P => {
        P.fill(9); for (let k = 0; k < 6; k++) for (let x = 0; x < 32; x++) P.set(x, 2 + k * 4 + Math.round(1.5 * Math.sin(x * 0.5 + k)), 8);
        for (const [x, y] of [[6, 5], [22, 13], [14, 20], [27, 3]]) { P.set(x, y, 10); P.set(x + 1, y, 11); } }],
    sully: ['Kiln at Night', "Sully says it's just a kiln. Then he stares at it for twenty minutes.", 'wood', P => {
        P.fill(14); for (const [x, y] of [[4, 3], [27, 5], [12, 2], [24, 1]]) P.set(x, y, 4);
        P.rect(9, 8, 14, 15, 17); P.rect(13, 14, 6, 9, 7); P.rect(14, 16, 4, 7, 8); P.rect(19, 3, 3, 5, 2); P.rect(0, 22, 32, 2, 11); }],
    fortune: ['Good Fortune', 'The little paper says: "You will enjoy this painting." It is correct.', 'gold', P => {
        P.fill(9); P.disc(15, 12, 7, 18); P.line(9, 12, 21, 12, 20); P.rect(18, 10, 11, 3, 4); P.line(20, 11, 27, 11, 5); }],
    floss: ['Cotton Candy Sky', 'Floss painted the clouds she wishes she saw. Pink ones. Every day.', 'white', P => {
        P.fill(12); P.disc(8, 8, 4, 6); P.disc(12, 7, 5, 6); P.disc(16, 9, 4, 23); P.disc(22, 16, 5, 15); P.disc(26, 15, 4, 6); P.disc(18, 17, 3, 23); }],
    waffle: ['Breakfast Grid', 'Waffle says Maki copied him. Maki says squares are for everyone.', 'wood', P => {
        P.fill(21); P.rect(6, 4, 20, 16, 18); for (let i = 0; i <= 5; i++) P.line(6 + i * 4, 4, 6 + i * 4, 19, 17); for (let j = 0; j <= 4; j++) P.line(6, 4 + j * 4, 25, 4 + j * 4, 17);
        P.rect(14, 9, 4, 4, 9); P.rect(15, 10, 2, 2, 8); P.line(19, 12, 19, 18, 20); }],
    wasabi: ['Zing', 'Wasabi painted it at the club at 2 AM. You can hear the bass if you look closely.', 'black', P => {
        P.fill(4); for (let k = 0; k < 3; k++) for (let x = 0; x < 32; x++) { const y = 5 + k * 7 + ((x % 8) < 4 ? (x % 4) : 4 - (x % 4)); P.set(x, y, k === 1 ? 22 : 10); P.set(x, y + 1, 11); } }],
    joe: ['A Poem, Painted', 'Joe\'s poem, painted. Visitors have been known to lean very close to read the last \'frog.\'', 'gold', P => {
        P.fill(9); for (let row = 0; row < 6; row++) for (let x = 4; x < 27 - (row % 3) * 3; x++) if (((x * 7 + row * 13) % 5) !== 0) P.set(x, 3 + row * 3, 1);
        P.disc(24, 19, 1, 5); P.disc(27, 19, 1, 5); P.line(23, 20, 25, 22, 5); P.line(28, 20, 26, 22, 5); P.set(25, 21, 5); P.rect(4, 21, 1, 2, 17); P.set(5, 22, 17); }],
};
const NPC_ART_CACHE = {};
function artGen(fn) {
    const px = new Array(ART_W * ART_H).fill(0);
    const P = {
        set(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < ART_W && y < ART_H) px[y * ART_W + x] = c; },
        fill(c) { px.fill(c); },
        rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) P.set(x + i, y + j, c); },
        disc(cx, cy, r, c) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.8) P.set(cx + x, cy + y, c); },
        ring(cx, cy, r, c) { for (let a = 0; a < 64; a++) P.set(cx + Math.cos((a / 64) * 2 * Math.PI) * r, cy + Math.sin((a / 64) * 2 * Math.PI) * r, c); },
        line(x0, y0, x1, y1, c) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) P.set(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, c); },
    };
    fn(P);
    return px.map(v => ART_CODE[v]).join('');
}
function npcArtPiece(npc) {
    if (NPC_ART_CACHE[npc]) return NPC_ART_CACHE[npc];
    const a = NPC_ART[npc];
    if (!a) return null;
    const p = { id: 'art_by_' + npc, name: a[0], note: a[1], frame: a[2], px: artGen(a[3]), by: npc };
    NPC_ART_CACHE[npc] = p;
    if (!FURN[p.id]) {
        const s = artWallSprite(p);
        Assets.dyn[p.id] = { c: s.canvas(), w: s.w, h: s.h, ax: 16, ay: 25 };
        FURN[p.id] = { id: p.id, name: p.name, w: 2, h: 1, kind: 'wall', price: 0, frame: p.id, art: true, fixture: true, npcArt: npc };
    }
    return p;
}
/* the painting a neighbor has in the collection (once Sarah has met them) */
function npcArt(npc) { const a = NPC_ART[npc]; return a && S && rel(npc).met ? { id: 'art_by_' + npc, name: a[0] } : null; }
function artState() {
    if (!S.art) S.art = { seq: 1, pieces: {}, museum: [], pots: [] };
    return S.art;
}
/* what's in the gallery's spots: Sarah picks (A.hung), or else her newest pieces, then Brulee's, then the neighbors' (a
   spot added since she last chose takes what isn't up yet) */
function museumWall() {
    const A = artState(), n = MUSEUM_WALL.length;
    if (Array.isArray(A.hung)) {
        const out = MUSEUM_WALL.map((_, i) => { const id = A.hung[i]; return id && museumCanHang(id) ? id : null; });
        if (A.hung.length < n) { const rest = museumPool().filter(id => !out.includes(id) && museumCanHang(id)); for (let i = A.hung.length; i < n; i++) out[i] = rest.shift() || null; }
        return out;
    }
    const fill = museumPool().filter(id => museumCanHang(id)).slice(0, n);
    while (fill.length < n) fill.push(null);
    return fill;
}
function museumHung(id) { return museumWall().includes(id); }
/* everything that could go on the walls */
function museumPool() {
    const A = artState();
    const npcs = Object.keys(NPC_ART).filter(n => npcArt(n)).map(n => 'art_by_' + n);
    return A.museum.slice().reverse().filter(id => FURN[id]).concat(Object.keys(ART_STARTERS), npcs);
}
function museumCanHang(id) {
    if (ART_STARTERS[id]) return true;
    if (id.startsWith('art_by_')) return !!npcArt(id.slice(7)) && !!npcArtPiece(id.slice(7));
    return artState().museum.includes(id) && !!FURN[id];
}
function artPixels(p) { return p.px.split('').map(c => Math.max(0, ART_CODE.indexOf(c))); }
/* palette colors 0-23 are the easel's own; 24 and up are Sarah's colors, remembered inside the painting */
function artHex(p, v) { return v < ART_PAL.length ? ART_PAL[v] : (p && p.cols && p.cols[v] ? p.cols[v][0] : ART_PAL[0]); }
/* the painting at k screen pixels per paint pixel */
function artCanvas(p, k) {
    const c = document.createElement('canvas');
    c.width = ART_W * k; c.height = ART_H * k;
    const g = c.getContext('2d'), px = artPixels(p);
    for (let i = 0; i < px.length; i++) { g.fillStyle = artHex(p, px[i]); g.fillRect((i % ART_W) * k, Math.floor(i / ART_W) * k, k, k); }
    c.setAttribute('aria-hidden', 'true');
    return c;
}
/* hung on a wall it's a little smaller (each spot keeps its strongest color, so thin lines survive) and framed */
function artWallSprite(p) {
    const s = new PixSpr(32, 26);
    const [fc, edge, hi] = ART_FRAMES[p.frame] || ART_FRAMES.gold;
    s.rect(1, 1, 30, 24, fc); s.frame(1, 1, 30, 24, edge); s.hline(2, 29, 2, hi);
    s.rect(3, 3, 26, 20, edge);
    const px = artPixels(p);
    for (let y = 0; y < 18; y++) for (let x = 0; x < 24; x++) {
        const x0 = Math.floor(x * 4 / 3), x1 = Math.ceil((x + 1) * 4 / 3), y0 = Math.floor(y * 4 / 3), y1 = Math.ceil((y + 1) * 4 / 3);
        const cnt = {};
        for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) { const v = px[yy * ART_W + xx]; cnt[v] = (cnt[v] || 0) + 1; }
        const ks = Object.keys(cnt).map(Number), inked = ks.filter(v => v !== 0);
        const pool = inked.length ? inked : ks;
        let best = pool[0];
        for (const v of pool) if (cnt[v] > cnt[best]) best = v;
        s.set(4 + x, 4 + y, artHex(p, best));
    }
    s.outline('#2d2230');
    return s;
}
/* a painting stands on a table in a little frame or on an easel on the floor as well as hanging (David, 28 October:
   "pictures on a table, on the floor or on the wall"): each way its own piece (<id>_stand, <id>_easel), the same painting,
   which goes back to the pocket or storage as itself (artBase) */
const ART_AS = [['', 'On the wall'], ['_stand', 'On a table'], ['_easel', 'On an easel']];
function artBase(id) { const m = /^(.*)_(stand|easel)$/.exec(id || ''); return m && ITEMS[m[1]] && ITEMS[m[1]].art ? m[1] : id; }
/* (the painting's own picture, smaller: in a frame standing on its foot, or up on an easel's three legs) */
function artStandCanvas(wall, easel) {
    const c = document.createElement('canvas'), x = c.getContext('2d');
    c.width = easel ? 22 : 18; c.height = easel ? 30 : 16;
    x.imageSmoothingEnabled = false;
    if (easel) {
        x.fillStyle = '#6a4a2e';
        for (let i = 0; i < 26; i++) { x.fillRect(Math.round(4 + i * 0.2), 29 - i, 1, 1); x.fillRect(Math.round(17 - i * 0.2), 29 - i, 1, 1); }
        x.fillRect(10, 18, 2, 12); x.fillStyle = '#8a6440'; x.fillRect(3, 19, 16, 2);
        x.drawImage(wall, 1, 1, 30, 24, 2, 4, 18, 15);
    } else {
        x.fillStyle = '#3a2c24'; x.fillRect(7, 14, 4, 2);
        x.drawImage(wall, 1, 1, 30, 24, 1, 1, 16, 13);
    }
    return c;
}
function registerArt(p) {
    const s = artWallSprite(p), wall = s.canvas();
    Assets.dyn[p.id] = { c: wall, w: s.w, h: s.h, ax: 16, ay: 25 };
    ITEMS[p.id] = { name: p.name, type: 'art', price: 0, icon: p.id, art: true };
    FURN[p.id] = { id: p.id, name: p.name, w: 2, h: 1, kind: 'wall', price: 0, sets: ['artist'], frame: p.id, art: true };
    for (const [suf, kind] of [['_stand', 'top'], ['_easel', 'floor']]) {
        const id = p.id + suf, c = artStandCanvas(wall, kind === 'floor');
        Assets.dyn[id] = { c, w: c.width, h: c.height, ax: c.width >> 1, ay: c.height - 1 };
        ITEMS[id] = { name: p.name, type: 'art', price: 0, icon: id, art: true, of: p.id };
        // (in the new look: the photo frame or the shop's easel, wearing the painting: EnvRoom.model)
        FURN[id] = { id, name: p.name, w: 1, h: 1, kind, price: 0, sets: ['artist'], frame: id, art: true, artOf: p.id, pic: p.id };
    }
}
function registerAllArt(st) {
    const A = st && st.art;
    if (!A) return;
    for (const p of Object.values(A.pieces)) registerArt(p);
}
/* everyone likes a handmade painting; a few people love them */
for (const id of ['clementine', 'coco', 'joe', 'cece', 'ginger', 'mac', 'kai', 'basil', 'maki', 'sully', 'cuke', 'chili', 'wonton'])
    if (TALK[id]) TALK[id].likes = (TALK[id].likes || []).concat(['art']);

/* ---------------------------------------------------------------- the painting studio */
const Painter = {
    run() { return new Promise(res => this.start(res)); },
    start(res) {
        this.res = res;
        this.px = new Array(ART_W * ART_H).fill(0);
        this.col = 13; this.tool = 'brush'; this.mirror = false; this.grid = true; this.frame = 'gold'; this.hist = []; this.warned = false;
        this.cols = {};
        myColors().forEach((c, k) => { this.cols[ART_PAL.length + k] = [c.hex, c.name]; });
        const U = Studio.open('The easel', 'Pick a color and paint on the canvas. Tap, or drag to draw lines.');
        this.U = U;
        this.K = 12;
        const cv = el('canvas', 'st-canvas');
        cv.width = ART_W * this.K; cv.height = ART_H * this.K;
        U.box.appendChild(cv);
        this.cv = cv; this.ctx = cv.getContext('2d');
        Studio.onResize = fitCanvas(cv, U.box, cv.width, cv.height);
        U.x.addEventListener('click', () => this.quit());
        cv.addEventListener('pointerdown', e => { e.preventDefault(); this.push(); this.down = true; this.last = null; this.at(e); try { cv.setPointerCapture(e.pointerId); } catch (err) { /* fine */ } });
        cv.addEventListener('pointermove', e => { if (this.down && this.tool !== 'fill') this.at(e); });
        const up = () => { this.down = false; this.last = null; };
        cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
        Studio.onKey = (code, down) => { if (!down) return; if (code === 'Escape') this.quit(); else if (code === 'KeyZ') this.undo(); else if (code === 'Enter') this.done(); };
        this.tools();
        this.draw();
    },
    push() { this.hist.push(this.px.slice()); if (this.hist.length > 40) this.hist.shift(); },
    /* where one of Sarah's colors sits in this painting's palette */
    idxOf(c) { const e = Object.entries(this.cols).find(([, v]) => v[0] === c.hex && v[1] === c.name); return e ? +e[0] : null; },
    addCol(c) {
        const have = this.idxOf(c);
        if (have != null) return have;
        const used = new Set(this.px);
        for (let k = ART_PAL.length; k < ART_CODE.length; k++) if (!this.cols[k] || !used.has(k)) { this.cols[k] = [c.hex, c.name]; return k; }
        UI.toast('That is a lot of colors for one painting!');
        return null;
    },
    /* after a color is changed or deleted: unused slots follow Sarah's list, painted ones keep what they were */
    syncCols() {
        const used = new Set(this.px);
        for (const k of Object.keys(this.cols)) if (!used.has(+k)) delete this.cols[k];
        for (const c of myColors()) if (this.idxOf(c) == null) this.addCol(c);
        if (this.col >= ART_PAL.length && !this.cols[this.col]) this.col = 13;
    },
    undo() { if (!this.hist.length) return; this.px = this.hist.pop(); this.draw(); },
    at(ev) {
        const [cx, cy] = canvasPoint(this.cv, ev);
        const x = Math.floor(cx / this.K), y = Math.floor(cy / this.K);
        if (x < 0 || y < 0 || x >= ART_W || y >= ART_H) return;
        if (this.tool === 'fill') { this.fill(x, y, this.col); if (this.mirror) this.fill(ART_W - 1 - x, y, this.col); this.draw(); return; }
        const pts = this.last ? linePts(this.last[0], this.last[1], x, y) : [[x, y]];
        this.last = [x, y];
        const c = this.tool === 'eraser' ? 0 : this.col, big = this.tool === 'big' || this.tool === 'eraser';
        for (const [px, py] of pts) {
            this.dab(px, py, c, big);
            if (this.mirror) this.dab(ART_W - 1 - px, py, c, big);
        }
        this.draw();
    },
    dab(x, y, c, big) {
        const pts = big ? [[0, 0], [1, 0], [0, 1], [1, 1]] : [[0, 0]];
        for (const [dx, dy] of pts) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < ART_W && Y < ART_H) this.px[Y * ART_W + X] = c; }
    },
    fill(x, y, c) {
        const from = this.px[y * ART_W + x];
        if (from === c) return;
        const st = [[x, y]];
        while (st.length) {
            const [cx, cy] = st.pop();
            if (cx < 0 || cy < 0 || cx >= ART_W || cy >= ART_H || this.px[cy * ART_W + cx] !== from) continue;
            this.px[cy * ART_W + cx] = c;
            st.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
        }
    },
    draw() {
        const g = this.ctx, K = this.K;
        for (let i = 0; i < this.px.length; i++) { g.fillStyle = artHex(this, this.px[i]); g.fillRect((i % ART_W) * K, Math.floor(i / ART_W) * K, K, K); }
        if (this.grid) {
            g.fillStyle = 'rgba(59,42,69,0.08)';
            for (let x = 1; x < ART_W; x++) g.fillRect(x * K, 0, 1, ART_H * K);
            for (let y = 1; y < ART_H; y++) g.fillRect(0, y * K, ART_W * K, 1);
        }
        if (this.mirror) { g.fillStyle = 'rgba(224,64,90,0.35)'; g.fillRect(ART_W / 2 * K - 1, 0, 2, ART_H * K); }
    },
    tools() {
        const U = this.U;
        U.tools.innerHTML = '';
        const short = innerHeight < 520;          // phones on their side: keep Undo and Done! where they can be reached
        if (short) {
            const top = el('div', 'st-row');
            top.appendChild(chip('Undo', () => this.undo()));
            top.appendChild(chip('Done!', () => this.done(), 'go'));
            U.tools.appendChild(top);
        }
        U.tools.appendChild(stLabel('Colors'));
        const sw = el('div', 'swatches');
        ART_PAL.forEach((hex, i) => {
            const b = el('button', 'swatch' + (this.col === i ? ' on' : ''));
            b.type = 'button'; b.title = ART_PAL_NAMES[i]; b.setAttribute('aria-label', ART_PAL_NAMES[i]);
            b.style.background = hex;
            b.addEventListener('click', () => { Sfx.ui('tick'); this.col = i; if (this.tool === 'eraser') this.tool = 'brush'; this.tools(); });
            sw.appendChild(b);
        });
        // Sarah's own colors (each painting remembers them)
        const mine = Object.entries(this.cols).map(([k, [hex, name]]) => ({ k: +k, hex, name }));
        mySwatches(sw, c => this.col === this.idxOf(c), c => { this.col = this.idxOf(c); if (this.tool === 'eraser') this.tool = 'brush'; this.tools(); },
            () => colorForm(U, { done: c => { if (c) { const k = this.addCol(c); if (k != null) this.col = k; } this.tools(); } }));
        U.tools.appendChild(sw);
        if (this.col >= ART_PAL.length) editMine(U, myColors().find(c => this.idxOf(c) === this.col), () => { this.syncCols(); this.tools(); this.draw(); });
        U.tools.appendChild(stLabel('Tools'));
        const row = el('div', 'st-row');
        for (const [k, name] of [['brush', 'Brush'], ['big', 'Big brush'], ['fill', 'Fill'], ['eraser', 'Eraser']]) row.appendChild(chip(name, () => { this.tool = k; this.tools(); }, this.tool === k ? 'on' : ''));
        row.appendChild(chip('Mirror', () => { this.mirror = !this.mirror; this.tools(); this.draw(); }, this.mirror ? 'on' : ''));
        row.appendChild(chip('Grid', () => { this.grid = !this.grid; this.tools(); this.draw(); }, this.grid ? 'on' : ''));
        U.tools.appendChild(row);
        const row2 = el('div', 'st-row');
        if (!short) row2.appendChild(chip('Undo', () => this.undo()));
        row2.appendChild(chip('Clear', () => { this.push(); this.px.fill(0); this.draw(); }));
        row2.appendChild(chip('Fill background', () => { this.push(); for (let i = 0; i < this.px.length; i++) if (this.px[i] === 0) this.px[i] = this.col; this.draw(); }));
        row2.appendChild(chip('Need an idea?', () => { U.sub.textContent = `How about: ${rpick(ART_IDEAS)}?`; }));
        U.tools.appendChild(row2);
        U.tools.appendChild(stLabel('Frame'));
        const row3 = el('div', 'st-row');
        for (const [k, name] of [['gold', 'Gold'], ['wood', 'Wood'], ['white', 'White'], ['black', 'Black']]) row3.appendChild(chip(name, () => { this.frame = k; this.tools(); }, this.frame === k ? 'on' : ''));
        U.tools.appendChild(row3);
        if (!short) {
            const row4 = el('div', 'st-row');
            row4.style.marginTop = '6px';
            row4.appendChild(chip('Done!', () => this.done(), 'go big'));
            U.tools.appendChild(row4);
        }
    },
    done() {
        if (!this.px.some(v => v !== 0)) { this.U.sub.textContent = 'The canvas is still blank! Paint a little something first.'; return; }
        Studio.onKey = (code, down) => { if (down && code === 'Escape') this.quit(); };
        const colName = this.col < ART_PAL.length ? cap(ART_PAL_NAMES[this.col]) : this.cols[this.col] ? this.cols[this.col][1] : 'Blue';
        const used = new Set(this.px), cols = {};
        for (const [k, v] of Object.entries(this.cols)) if (used.has(+k)) cols[k] = v;
        nameStep(this.U, rpick(['Untitled', 'Island Afternoon', 'A Little Something', 'Masterpiece No. ' + (artState().seq), 'Study in ' + colName]),
            name => this.finish({ px: this.px.map(v => ART_CODE[v]).join(''), frame: this.frame, name, cols }));
    },
    quit() {
        if (this.px.some(v => v !== 0) && !this.warned) { this.warned = true; this.U.sub.textContent = 'Close again to leave without keeping this painting.'; return; }
        this.finish(null);
    },
    finish(v) { Studio.close(); const r = this.res; this.res = null; if (r) r(v); },
};
function linePts(x0, y0, x1, y1) {
    const out = [], dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
        out.push([x0, y0]);
        if (x0 === x1 && y0 === y1) return out;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
    }
}
/* painting at an easel (the museum's art corner, or one at home) */
async function paintAtEasel(where) {
    if (visitorStop('any')) return;
    const res = await Painter.run();
    if (!res) return;
    const A = artState();
    const id = 'ptg_' + (A.seq++);
    const p = { id, name: res.name, px: res.px, frame: res.frame, day: Clock.dayNum() };
    if (res.cols && Object.keys(res.cols).length) p.cols = res.cols;
    A.pieces[id] = p;
    registerArt(p);
    S.seen[id] = S.seen[id] || Clock.dayNum();
    S.stats.paintings = (S.stats.paintings || 0) + 1;
    Sfx.play('fanfare');
    G.player.pose = 'cheer'; G.player.poseT = 30;
    Save.touch();
    if (where === 'museum' && bruleeVoice()) {
        await UI.say('brulee', critique(p), { keep: true });
        const k = await UI.ask('brulee', `"${p.name}." Shall I hang it in the museum? Or will you take it home?`, ['Hang it in the museum!', 'Take it home']);
        if (k === 0) { await donateArt(id, true); return; }
    }
    receive(id, 1);
    await UI.say(null, `Sarah finished "${p.name}"! Hang it on a wall at home, give it to a friend, or donate it to the museum.`);
}
/* (Brulee's thank-you keeps the dialog up for the next question; when painting at an easel there is no next question) */
async function paintAndClose(where) {
    try { await paintAtEasel(where); } finally { UI.hideDialog(); }
}
function critique(p) {
    const px = artPixels(p), cnt = {};
    for (const v of px) cnt[v] = (cnt[v] || 0) + 1;
    const painted = px.filter(v => v !== 0).length, kinds = Object.keys(cnt).filter(k => k !== '0').length;
    if (painted < 25) return "Minimalism! Very brave. Very... empty. I love the confidence.";
    if (kinds >= 10) return 'So many colors! It is like a party in a frame. Magnifique.';
    const top = +Object.entries(cnt).filter(([k]) => k !== '0').sort((a, b) => b[1] - a[1])[0][0];
    const fam = [[[12, 13, 14, 21], 'So much blue. I can almost hear the sea. ...No, that is the sea. Still, very good.'], [[10, 11, 22], 'Green! Fresh, alive... I can almost smell the grass.'],
        [[5, 6, 23], 'Such warmth! Such passion! Chili will say it is about him. It is not about him.'], [[7, 8, 9], 'It glows! Like sunshine. Like caramel. My two favorite things.'],
        [[15, 16], 'Purple! Royal, mysterious. I shall have to stand a little taller beside it.'], [[17, 18, 20, 19], 'Earthy. Cozy. Like a gingerbread house in autumn.'],
        [[1, 2, 3], 'Dramatic! Moody! Very modern. I need to sit down.']].find(([set]) => set.includes(top));
    return fam ? fam[1] : 'I see... yes. Yes! I see it now. Wonderful.';
}

/* ---------------------------------------------------------------- the museum */
ROOMS.museum = { w: 17, h: 8, wall: 'wall_gallery', floor: 'floor_parquet', music: 'museum', name: 'The Museum', staff: 'brulee',
    staffAt: [13, 5], staffStand: [13, 7], guest: [8, 5, 2], build: a => buildMuseumRoom(a),
    guestSpots: [[5, 4, 'down'], [6, 4, 'down'], [10, 4, 'down'], [11, 4, 'down']],
    closedSign: 'THE MUSEUM. Open {hours:museum}. "Art is for everyone. Tapping the curator is for no one."' };
/* the gallery's spots (65a_museum_wings.js): five on the wall, the newest in the middle, then three easels */
const MUSEUM_WALL = [[6, 'wall'], [3, 'wall'], [9, 'wall'], [0, 'wall'], [12, 'wall'], [1, 3], [6, 3], [11, 3]];
/* the pottery hall's pedestals: the back row from the middle out, then the front row */
const MUSEUM_PEDESTALS = [[5, 1], [7, 1], [3, 1], [9, 1], [1, 1], [11, 1], [4, 3], [8, 3], [2, 3], [10, 3]];
/* the entrance hall: Brulee's desk, the easel corner, benches, and an archway into each wing on the back wall */
function buildMuseumRoom(a) {
    const rows = [['museum_desk', 12, 6], ['art_supplies', 14, 6], ['museum_bench', 5, 4], ['museum_bench', 10, 4], ['easel', 1, 6], ['table_wood', 2, 6], ['art_supplies', 2, 6],
        ['plant_monstera', 0, 7], ['plant_monstera', 16, 7], ['plant_monstera', 2, 0], ['plant_monstera', 14, 0],
        ['window_wall', 5, 'wall'], ['clock_wall', 8, 'wall'], ['window_wall', 11, 'wall']];
    const items = layoutItems(rows);
    items.forEach(it => {
        if (it.id === 'museum_desk') it.use = 'counter';
        else if (it.id === 'easel') it.use = () => museumEasel();
    });
    a.items = items;
    placeFurniture(a, items);
    museumArches(a);
}
function bruleeVoice() { const b = NPCs.get('brulee'); return b && !b.sleeping && b.area === 'museum' ? 'brulee' : null; }
async function museumEasel() {
    const k = await UI.ask(bruleeVoice(), bruleeVoice() ? 'The easel is free! Paint something? I will not look. (I will look.)' : 'An easel with a fresh canvas and a jar of brushes. Paint something?', ['Paint!', 'Not now']);
    if (k === 0) { UI.hideDialog(); await paintAndClose('museum'); }
}
/* rebuild the hall and the wings around Sarah (after something new goes on display) */
function refreshMuseum() { for (const id of ['museum'].concat(MUSEUM_WINGS.map(W => W.id))) refreshRoomHere(id); }

/* ---------------------------------------------------------------- donations */
WORK_MENUS.brulee = { room: 'museum', label: 'Museum business', fn: () => museumMenu() };
function ownedIds(test) {
    const out = new Set();
    for (const s of S.pocket) if (s && ITEMS[s.id] && test(s.id)) out.add(s.id);
    for (const id of Object.keys(S.storage)) if (ITEMS[id] && test(id)) out.add(id);
    return [...out];
}
async function museumMenu() {
    for (;;) {
        const art = ownedIds(id => ITEMS[id].type === 'art'), pots = ownedIds(id => !!ITEMS[id].pottery), A = artState();
        // (every wing from the desk too, David, 29 October: the fashion and photo wings were only managed in their rooms)
        const forms = typeof fashionState === 'function' && Object.keys(designs()).length && !Online.visitor(), photos = typeof museumPhotos === 'function' && !Online.visitor();
        const opts = ['Paint something', art.length ? 'Donate a painting' : null, pots.length ? 'Donate pottery' : null, forms ? 'Show one of my designs' : null, photos ? 'Hang a photo' : null,
            'Change the walls', 'Change the pedestals', A.museum.length || A.pots.length ? 'Take something home' : null, 'See the collection', 'Never mind'].filter(Boolean);
        const b = bruleeVoice();
        const k = await UI.ask(b, b ? rpick(['How may the museum help you today?', 'Art business? I love art business.', 'Bonjour! Donations, painting, browsing?'])
            : 'The museum desk. Brulee is on a break, so it\'s the honor system: donations in the box, and please, no tapping.', opts, { keep: true });
        const c = opts[k];
        if (c === 'Paint something') { UI.hideDialog(); await paintAtEasel('museum'); return; }
        if (c === 'Donate a painting') { UI.hideDialog(); const id = await pickOwned('Donate a painting', art); if (id) await donateArt(id, false); continue; }
        if (c === 'Donate pottery') { UI.hideDialog(); const id = await pickOwned('Donate pottery', pots); if (id) await donatePot(id); continue; }
        if (c === 'See the collection') { UI.hideDialog(); await museumCatalog(); continue; }
        if (c === 'Show one of my designs') { UI.hideDialog(); await museumFormPick(); continue; }
        if (c === 'Hang a photo') { UI.hideDialog(); await museumPhotoPick(); continue; }
        if (c === 'Change the walls') { UI.hideDialog(); await museumWalls(); continue; }
        if (c === 'Change the pedestals') { UI.hideDialog(); await museumPedestals(); continue; }
        if (c === 'Take something home') { UI.hideDialog(); await museumTakeHome(); continue; }
        await UI.say(b, b ? rpick(['\u00c0 bient\u00f4t! Come back and look at things.', 'Goodbye! Remember: no tapping.']) : 'Sarah tiptoes away from the desk. Very museum of her.');
        return;
    }
}
function pickOwned(title, ids) {
    return new Promise(res => {
        let done = false;
        const finish = v => { if (!done) { done = true; res(v); } };
        const P = UI.open({ title, onClose: () => finish(null) });
        const grid = el('div', 'grid');
        for (const id of ids) {
            const b = slotBtn(id, 0, { onClick: () => { finish(id); UI.close(true); } });
            b.title = itemName(id);
            grid.appendChild(b);
        }
        P.body.appendChild(grid);
    });
}
function takeOwned(id) { return removeItem(id, 1) > 0 || fromStorage(id, 1); }
async function donateArt(id, fresh) {
    if (visitorStop('museum')) return;
    const A = artState(), p = A.pieces[id];
    if (!p) return;
    if (!fresh && !takeOwned(id)) return;
    A.museum.push(id);
    if (Array.isArray(A.hung)) { A.hung = A.hung.filter(x => x !== id); A.hung.unshift(id); A.hung = A.hung.slice(0, MUSEUM_WALL.length); }
    p.donated = Clock.dayNum();
    S.stats.donated = (S.stats.donated || 0) + 1;
    refreshMuseum();
    Sfx.play('fanfare');
    await donationThanks(`"${p.name}"`);
}
async function donatePot(id) {
    if (visitorStop('museum') || !takeOwned(id)) return;
    const A = artState();
    A.pots.push(id);
    S.stats.donated = (S.stats.donated || 0) + 1;
    refreshMuseum();
    Sfx.play('fanfare');
    await donationThanks(`the ${itemName(id).toLowerCase()}`);
}
async function donationThanks(what) {
    const b = NPCs.get('brulee'), day = Clock.dayNum(), r = rel('brulee');
    if (b && bruleeVoice()) { b.emote = 'heart'; b.emoteT = 90; }
    await UI.say(bruleeVoice(), rpick([`${cap(what)}! It will have pride of place. I am going to give it a very small, very serious label.`,
        `Merci, {name}! ${cap(what)} goes up right away. The museum is better already.`,
        `Magnifique. ${cap(what)} is now officially art. It was before. Now it has a label.`]), { keep: true });
    if (r.met && r.donateDay !== day) { r.donateDay = day; const up = addPts('brulee', isHoliday('museumday') ? 10 : 5); if (up && b) await heartUp(b, up); }
    Save.touch();
}

/* ---------------------------------------------------------------- looking at art */
function artInfo(id) {
    if (ART_STARTERS[id]) { const [name, by, note] = ART_STARTERS[id]; return { name, by, note, canvas: () => iconCanvas('f_' + id, 256) }; }
    if (id.startsWith('art_by_')) { const p = npcArtPiece(id.slice(7)); return p && { name: p.name, by: NPC_DEFS[p.by] ? NPC_DEFS[p.by].name : cap(p.by), note: p.note, canvas: () => artCanvas(p, 8) }; }
    const p = artState().pieces[id];
    if (!p) return null;
    return { name: p.name, by: 'Sarah', note: `${p.desc ? `"${p.desc}" ` : ''}Painted on ${dayLabel(p.day)}.${p.donated != null ? ' Donated to the museum.' : ''}`, canvas: () => artCanvas(p, 8) };
}
async function viewArt(id, back) {
    const info = artInfo(id);
    if (!info) return;
    await new Promise(res => {
        const P = UI.open({ title: info.name, back: back || null, onClose: res });
        const box = el('div', 'artview');
        const cv = info.canvas();
        cv.className = 'artcanvas';
        box.appendChild(cv);
        P.body.appendChild(box);
        P.body.appendChild(el('p', 'artcap', `by ${info.by}`));
        P.body.appendChild(el('p', 'muted', info.note));
    });
}
function museumCatalog() {
    return new Promise(res => {
        const A = artState();
        const P = UI.open({ title: 'The Collection', onClose: res, wide: true });
        const again = () => museumCatalog().then(res);
        const section = (title, note) => { P.body.appendChild(el('p', 'artcap', title)); if (note) P.body.appendChild(el('p', 'muted', note)); const g = el('div', 'grid'); P.body.appendChild(g); return g; };
        const slot = (title, pic, fn, cls) => {
            const b = el('button', 'slot' + (cls ? ' ' + cls : ''));
            b.type = 'button'; b.title = title; b.setAttribute('aria-label', title);
            b.appendChild(pic);
            if (fn) b.addEventListener('click', () => { UI.close(true); fn(); });
            return b;
        };
        const forms = typeof fashionState === 'function' ? fashionState().filter(Boolean) : [], photos = typeof museumPhotos === 'function' ? museumPhotos().filter(Boolean) : [];
        const solved = typeof MUSEUM_HISTORY !== 'undefined' ? MUSEUM_HISTORY.filter(H => Quests.done(H.q)).length : 0;
        P.body.appendChild(el('p', 'muted', `${A.museum.length} painting${A.museum.length === 1 ? '' : 's'}, ${A.pots.length} piece${A.pots.length === 1 ? '' : 's'} of pottery, ${forms.length} design${forms.length === 1 ? '' : 's'} and ${photos.length} photo${photos.length === 1 ? '' : 's'} from Sarah, plus Brulee's own collection.`));
        // the gallery
        const g1 = section('Paintings', 'In the gallery, through the first archway.');
        g1.classList.add('artgrid');
        for (const id of museumPool()) {
            const info = artInfo(id);
            if (!info) continue;
            g1.appendChild(slot(info.name + (museumHung(id) ? ' (on the wall)' : ''), artThumb(id), () => viewArt(id, again), museumHung(id) ? 'hung' : ''));
        }
        // the pottery hall
        const g2 = section('Pottery', A.pots.length ? 'In the pottery hall.' : 'Nothing yet: pots from the wheel in the pottery studio go on the pedestals.');
        for (const id of A.pots.slice().reverse()) if (ITEMS[id]) g2.appendChild(slot(itemName(id), iconCanvas(ITEMS[id].icon, 48), typeof itemShowcase === 'function' ? () => itemShowcase(id, again) : null));
        // fashion: the dress forms
        if (typeof fashionState === 'function') {
            const g3 = section('Fashion', forms.length ? 'On the dress forms in the fashion wing.' : 'The dress forms are bare: show one of your designs from the sewing machine.');
            fashionState().forEach((rec, i) => { if (rec) g3.appendChild(slot(`"${rec.name}"`, formThumb(rec), () => fashionAsk(i).then(again))); });
        }
        // photography
        if (typeof museumPhotos === 'function') {
            const g4 = section('Photography', photos.length ? 'In the photography wing.' : 'No photos up yet: hang one from your album, or a real one.');
            museumPhotos().forEach((p, i) => {
                if (!p) return;
                const im = el('img'); im.src = p.url; im.alt = ''; im.style.cssText = 'width:48px;height:48px;object-fit:cover;border-radius:4px';
                g4.appendChild(slot(p.title || 'A photo', im, () => viewMuseumPhoto(p, i).then(again)));
            });
        }
        // the aquarium: every fish, from the start
        if (typeof aquariumTanks === 'function') for (const T of aquariumTanks()) {
            const g5 = section(`Aquarium: ${T.name}`, T.note);
            for (const id of T.fish) if (ITEMS[id]) g5.appendChild(slot(itemName(id), iconCanvas(ITEMS[id].icon, 48), typeof itemShowcase === 'function' ? () => itemShowcase(id, again) : null));
        }
        // island history: a case per mystery, its keepsake once solved
        if (typeof MUSEUM_HISTORY !== 'undefined') {
            const g6 = section('Island history', `${solved} of the island's old mysteries solved.`);
            for (const H of MUSEUM_HISTORY) {
                const done = Quests.done(H.q), name = QUEST_INFO[H.q] ? QUEST_INFO[H.q].title : itemName(H.item);
                if (done) g6.appendChild(slot(name, iconCanvas(ITEMS[H.item] ? ITEMS[H.item].icon : H.item, 48), () => historyCase(H)));
                else { const q = el('span', 'slot-q', '?'); q.style.cssText = 'font:700 26px/48px var(--display);width:48px;text-align:center;opacity:.45'; g6.appendChild(slot(`${name} (an empty case: not solved yet)`, q, null)); }
            }
        }
    });
}
/* a design on show, as a little picture of the dress form wearing it */
function formThumb(rec) {
    const c = document.createElement('canvas');
    c.width = c.height = 48;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    const f = typeof sewFrame === 'function' && rec.d ? sewFrame(rec.d, 'down', 'stand', 'normal', Object.assign({}, look(), { skin: '#efe2cc' })) : null;
    if (f) { const s = f.canvas(); g.drawImage(s, 0, 0, s.width, s.height, (48 - s.width * 2) / 2, (48 - s.height * 2) / 2, s.width * 2, s.height * 2); }
    return c;
}
/* from the desk: one of Sarah's designs onto a dress form (the first bare one, or one she picks to change) */
async function museumFormPick() {
    const F = fashionState(), n = typeof MUSEUM_FORMS !== 'undefined' ? MUSEUM_FORMS.length : 6;
    let i = -1;
    for (let k = 0; k < n; k++) if (!F[k]) { i = k; break; }
    if (i < 0) {
        const k = await UI.ask(bruleeVoice(), 'Every dress form is wearing something. Which one shall we change?', F.slice(0, n).map((r, k) => `Form ${k + 1}: "${r.name}"`).concat(['Never mind']));
        if (k >= n) return;
        i = k;
    }
    await fashionPick(i);
}
/* from the desk: a photo into the first empty spot in the photography wing */
async function museumPhotoPick() {
    const free = museumPhotos().findIndex(p => !p);
    if (free < 0) { await UI.say(bruleeVoice(), 'Every spot in the photography wing has a photo. Take one down in the wing to hang another.'); return; }
    await hangPhoto(free);
}
function artThumb(id) {
    const A = artState();
    if (A.pieces[id]) return artCanvas(A.pieces[id], 2);
    if (id.startsWith('art_by_')) { const p = npcArtPiece(id.slice(7)); if (p) return artCanvas(p, 2); }
    return iconCanvas('f_' + id, 48);
}
/* ---------------------------------------------------------------- choosing what hangs on the walls */
const WALL_SPOT_NAMES = ['The middle', 'Left of the middle', 'Right of the middle', 'Far left', 'Far right', 'The left easel', 'The middle easel', 'The right easel'];
function museumWalls() {
    return new Promise(res => {
        const A = artState();
        if (!Array.isArray(A.hung) || A.hung.length < MUSEUM_WALL.length) A.hung = museumWall();
        const P = UI.open({ title: 'The gallery', onClose: () => { refreshMuseum(); Save.touch(); res(); } });
        let pick = null;
        const draw = () => {
            P.body.innerHTML = '';
            if (pick == null) {
                P.body.appendChild(el('p', 'muted', 'Eight spots in the gallery: five on the wall and three easels. Pick a spot to choose what hangs there. Anything you take down stays in the collection.'));
                const list = el('div', 'list');
                MUSEUM_WALL.forEach((x, i) => {
                    const id = A.hung[i], info = id && artInfo(id);
                    const row = el('button', 'row');
                    row.type = 'button';
                    row.appendChild(id ? artThumb(id) : iconCanvas('f_empty_frame', 40));
                    const t = el('div', 't');
                    t.appendChild(el('b', null, WALL_SPOT_NAMES[i]));
                    t.appendChild(el('span', null, info ? `"${info.name}" by ${info.by}` : 'An empty frame'));
                    row.appendChild(t);
                    row.addEventListener('click', () => { pick = i; Sfx.ui('tick'); draw(); });
                    list.appendChild(row);
                });
                P.body.appendChild(list);
                return;
            }
            P.body.appendChild(el('p', 'muted', `What should hang in "${WALL_SPOT_NAMES[pick].toLowerCase()}"?`));
            const grid = el('div', 'grid artgrid');
            const put = id => {
                const old = A.hung.indexOf(id);
                if (id && old >= 0) A.hung[old] = A.hung[pick];        // swap places
                A.hung[pick] = id;
                Sfx.play('place');
                if (id && id.startsWith('art_by_')) hungNpcArt(id.slice(7));
                pick = null; draw();
            };
            for (const id of museumPool()) {
                const info = artInfo(id);
                if (!info) continue;
                const b = el('button', 'slot' + (A.hung.includes(id) ? ' hung' : ''));
                b.type = 'button'; b.title = `"${info.name}" by ${info.by}`; b.setAttribute('aria-label', b.title);
                b.appendChild(artThumb(id));
                b.addEventListener('click', () => put(id));
                grid.appendChild(b);
            }
            const empty = el('button', 'slot');
            empty.type = 'button'; empty.title = 'Leave it empty'; empty.setAttribute('aria-label', 'Leave it empty');
            empty.appendChild(iconCanvas('f_empty_frame', 40));
            empty.addEventListener('click', () => put(null));
            grid.appendChild(empty);
            P.body.appendChild(grid);
            P.body.appendChild(btn('Back', 'alt', () => { pick = null; draw(); }));
        };
        draw();
    });
}
/* a neighbor finds out their painting is up (once) */
function hungNpcArt(npc) {
    const A = artState();
    A.npcHung = A.npcHung || {};
    if (A.npcHung[npc]) return;
    A.npcHung[npc] = Clock.dayNum();
    addPts(npc, 4);
    setTimeout(() => UI.toast(`${NPC_DEFS[npc] ? NPC_DEFS[npc].name : cap(npc)} is going to be so happy!`, (NPC_DEFS[npc] ? NPC_DEFS[npc].sprite : npc) + '_0'), 300);
}
/* taking a piece back out of the museum (it goes home with Sarah) */
async function museumTakeHome() {
    const A = artState();
    const ids = A.museum.slice().reverse().filter(id => FURN[id]).concat(A.pots.slice().reverse().filter(id => ITEMS[id]));
    if (!ids.length) return;
    const id = await new Promise(res => {
        let done = false;
        const finish = v => { if (!done) { done = true; res(v); } };
        const P = UI.open({ title: 'Take something home', onClose: () => finish(null) });
        P.body.appendChild(el('p', 'muted', 'Brulee will miss it. You can always donate it again.'));
        const grid = el('div', 'grid artgrid');
        for (const x of ids) {
            const b = el('button', 'slot');
            b.type = 'button'; b.title = itemName(x); b.setAttribute('aria-label', itemName(x));
            b.appendChild(A.pieces[x] ? artCanvas(A.pieces[x], 2) : iconCanvas(itemIcon(x), 40));
            b.addEventListener('click', () => { finish(x); UI.close(true); });
            grid.appendChild(b);
        }
        P.body.appendChild(grid);
    });
    if (!id) return;
    const isArt = A.museum.includes(id);
    if (isArt) { A.museum.splice(A.museum.lastIndexOf(id), 1); if (Array.isArray(A.hung)) A.hung = A.hung.map(x => (x === id ? null : x)); if (A.pieces[id]) A.pieces[id].donated = null; }
    else A.pots.splice(A.pots.lastIndexOf(id), 1);
    receive(id, 1);
    refreshMuseum();
    Save.touch();
    Sfx.play('pick');
    await UI.say(bruleeVoice(), rpick([`${isArt ? 'The painting' : 'The pottery'} goes home with you. Take good care of it! And bring it back to visit.`,
        'Ah, a loan to the artist! Very generous of us. Come back soon, little masterpiece.']));
}

/* first time in: Brulee gives the tour */
Bus.on('enter', async id => {
    if (id !== 'museum' || S.flags.museumTour || !bruleeVoice()) return;
    S.flags.museumTour = true;
    G.busy++;
    await waitFrames(20);
    await UI.say('brulee', ['Bienvenue to the museum! I am Brulee, the curator. Please do not tap me. Or the art.',
        'Through the arches: paintings, pottery, the aquarium, photography, fashion and the island\'s history. Most of the gallery is my work for now. I look forward to changing that.',
        'But this museum is for YOU. Paint at the easel in the corner, make pottery at Sully\'s, hang your photos, show your designs. Bring me the ones you love.',
        'I will hang them with great ceremony. Talk to me at the desk anytime.']);
    G.busy--;
});
/* what people say while they're here */
AREA_TALK.museum = ['I stood in front of the goat painting for ten minutes. I think it was looking at me.', "Brulee says I'm not allowed to touch anything. I'm touching nothing. I'm a statue.",
    'Art makes me feel things. Mostly hungry. Is that normal?', 'Did you know Sarah paints? The museum has her stuff now. So fancy.'];
AREA_TALK.restaurant = ["Mac gave me extra cheese. I didn't ask. I never have to ask.", "This is my favorite table. It's also the only table I've sat at. Loyalty.",
    "Mac's special is SO good today. Don't tell Basil I said that."];

