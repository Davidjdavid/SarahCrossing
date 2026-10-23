/* ---- 6e_sewing.js ---- */
/* The sewing machine at Clementine's. Sarah designs her own clothes: a style, a color for each part, a pattern, and a
   tiny print on the front drawn pixel by pixel. The outfit is drawn from the same templates as every other outfit,
   so it looks right walking, sitting, dancing and hugging, from every side. */
const SEW_PRICE = 1000, SEW_ALTER = 500;
const SEW_STYLES = [['dress', 'Dress', 'dress'], ['topskirt', 'Top and skirt', 'dress'], ['toppants', 'Top and pants', 'pants'],
    ['overalls', 'Overalls', 'pants'], ['hoodie', 'Hoodie', 'pants'], ['pajamas', 'Pajamas', 'pants'],
    // special patterns (found around the island)
    ['suit', 'Suit', 'pants', true], ['muumuu', 'Muumuu', 'dress', true], ['gown', 'Flowing gown', 'dress', true], ['robe', 'Wizard robe', 'dress', true],
    ['jumpsuit', 'Disco jumpsuit', 'pants', true], ['cape', 'Hero cape', 'pants', true], ['tutu', 'Tutu', 'dress', true], ['sailor', 'Sailor dress', 'dress', true],
    ['spacesuit', 'Spacesuit', 'pants', true]];
const SEW_WORD = { dress: 'dress', topskirt: 'skirt set', toppants: 'outfit', overalls: 'overalls', hoodie: 'hoodie', pajamas: 'pajamas',
    suit: 'suit', muumuu: 'muumuu', gown: 'gown', robe: 'robe', jumpsuit: 'jumpsuit', cape: 'hero suit', tutu: 'tutu', sailor: 'sailor dress', spacesuit: 'spacesuit' };
const SEW_ONE_PIECE = new Set(['dress', 'muumuu', 'gown', 'robe', 'jumpsuit', 'spacesuit']);
const SEW_NOTES = { dress: 'One color, top to hem. Add trim at the waist.', topskirt: 'A top and a skirt, any two colors.', toppants: 'A top and pants, any two colors.',
    overalls: 'A shirt under overalls with a bib and straps.', hoodie: 'A cozy hoodie with a pocket and strings.', pajamas: 'Matching pajamas. Stars are a classic.',
    suit: 'A sharp suit: jacket, trousers, a crisp shirt and a tie.', muumuu: 'Long, breezy and flowery. Island formal.', gown: 'A flowing gown, all the way to the floor. Very red carpet.',
    robe: 'A long wizard robe with trim on the sleeves. Stars optional (but recommended).', jumpsuit: 'A disco jumpsuit with bell-bottoms and a big belt.',
    cape: 'A hero suit with a cape and a shiny emblem.', tutu: 'A leotard and a fluffy tutu. Twirl-ready.', sailor: 'A sailor dress with a collar and a little bow.',
    spacesuit: 'A spacesuit with a glass helmet. For your next trip. Upwards.' };
const SEW_EXTRA_PAL = { W: '#ffffff', Y: '#ffd84a', R: '#e0405a', B: '#bfe8ff' };
const SEW_PARTS = {
    dress: [['top', 'Dress'], ['trim', 'Trim'], ['shoes', 'Shoes']], topskirt: [['top', 'Top'], ['bottom', 'Skirt'], ['trim', 'Trim'], ['shoes', 'Shoes']],
    toppants: [['top', 'Top'], ['bottom', 'Pants'], ['shoes', 'Shoes']], overalls: [['top', 'Shirt'], ['bottom', 'Overalls'], ['shoes', 'Boots']],
    hoodie: [['top', 'Hoodie'], ['bottom', 'Pants'], ['trim', 'Strings'], ['shoes', 'Shoes']], pajamas: [['top', 'Top'], ['bottom', 'Bottoms'], ['trim', 'Trim'], ['shoes', 'Slippers']],
    suit: [['top', 'Jacket'], ['bottom', 'Trousers'], ['trim', 'Tie'], ['shoes', 'Shoes']], muumuu: [['top', 'Muumuu'], ['trim', 'Trim'], ['shoes', 'Sandals']],
    gown: [['top', 'Gown'], ['trim', 'Sash'], ['shoes', 'Shoes']], robe: [['top', 'Robe'], ['trim', 'Trim'], ['shoes', 'Boots']],
    jumpsuit: [['top', 'Jumpsuit'], ['trim', 'Belt'], ['shoes', 'Platforms']], cape: [['top', 'Suit'], ['bottom', 'Leggings'], ['trim', 'Cape'], ['shoes', 'Boots']],
    tutu: [['top', 'Leotard'], ['bottom', 'Tutu'], ['shoes', 'Slippers']], sailor: [['top', 'Top'], ['bottom', 'Skirt'], ['trim', 'Collar'], ['shoes', 'Shoes']],
    spacesuit: [['top', 'Suit'], ['trim', 'Stripes'], ['shoes', 'Boots']],
};
/* the special patterns reshape the outfit a little (with the same letters, so every frame and every hairstyle works) */
function sewSpecialRows(rows, top, dir, body, style) {
    if (body === 'sit' || body === 'pick' || !SEW_NOTES[style]) return;
    const put = (y, x, c, only) => { if (rows[y] && x >= 0 && x < 16 && (!only || only.includes(rows[y][x]))) rows[y][x] = c; };
    const row = (y, s) => { if (rows[y]) rows[y] = s.split(''); };
    const down = dir === 'down', side = dir === 'side', up = dir === 'up';
    const flare = (y, fill) => {
        const r = rows[y];
        if (!r) return;
        const out = r.map(c => ('Ffx'.includes(c) ? fill : c));
        for (let x = 0; x < 16; x++) if (out[x] === fill) { if (x > 0 && out[x - 1] === '.') out[x - 1] = 'x'; if (x < 15 && out[x + 1] === '.') out[x + 1] = 'x'; }
        rows[y] = out;
    };
    if (style === 'muumuu' || style === 'gown' || style === 'robe') {
        // all the way down: the hem sways over the legs, the shoes peek out underneath
        if (side) { row(top + 6, '....xPPPPPPx....'); row(top + 7, '...xPPPPPPPPx...'); row(top + 8, '...xQQQQQQQQx...'); }
        else { row(top + 6, '...xPPPPPPPPx...'); row(top + 7, '..xPPPPPPPPPPx..'); row(top + 8, '..xQQQQQQQQQQx..'); }
    }
    if (style === 'muumuu' && down) { put(top, 6, 'V', 'T'); put(top, 9, 'V', 'T'); }
    if (style === 'gown') {
        if (down) { put(top, 6, 'S', 'T'); put(top, 9, 'S', 'T'); }
        put(top + 7, 5, 'W', 'P'); put(top + 6, 9, 'W', 'P'); put(top + 8, 10, 'W', 'Q');
    }
    if (style === 'robe') { for (const x of [4, 11]) put(top + 3, x, 'V', 'TU'); if (down) { put(top + 1, 7, 'V', 'T'); put(top + 1, 8, 'V', 'T'); } }
    if (style === 'suit' && down) {
        put(top + 1, 6, 'U', 'T'); put(top + 1, 7, 'W', 'T'); put(top + 1, 8, 'W', 'T'); put(top + 1, 9, 'U', 'T');
        for (let y = top + 2; y <= top + 3; y++) { put(y, 7, 'V', 'TU'); put(y, 8, 'V', 'TU'); }
        put(top + 4, 7, 'V', 'T');
    }
    if (style === 'jumpsuit') {
        for (let x = 0; x < 16; x++) put(top + 5, x, 'V', 'P');
        if (down) { put(top + 1, 6, 'V', 'T'); put(top + 1, 9, 'V', 'T'); put(top + 2, 7, 'Y', 'TU'); }
        flare(top + 8, 'Q');
    }
    if (style === 'cape') {
        if (down) {
            for (let y = top + 5; y <= top + 8; y++) for (const [x, c] of [[3, 'x'], [4, 'V'], [11, 'V'], [12, 'x']]) put(y, x, c, '.');
            for (let y = top + 2; y <= top + 3; y++) { put(y, 7, 'Y', 'TU'); put(y, 8, 'Y', 'TU'); }
        } else if (up) { for (let y = top + 6; y <= top + 8; y++) row(y, '...xVVVVVVVVx...'); }
        else if (side) for (let y = top + 5; y <= top + 8; y++) { put(y, 2, 'x', '.'); put(y, 3, 'V', '.'); put(y, 4, 'V', '.'); }
    }
    if (style === 'tutu') {
        if (side) { row(top + 6, '..xPPPPPPPPPPx..'); row(top + 7, '...xxQQQQQQxx...'); }
        else { row(top + 6, '.xPPPPPPPPPPPPx.'); row(top + 7, '..xxQQQQQQQQxx..'); }
    }
    if (style === 'sailor' && down) {
        put(top, 6, 'V', 'T'); put(top, 9, 'V', 'T'); put(top + 1, 6, 'V', 'T'); put(top + 1, 9, 'V', 'T');
        put(top + 1, 7, 'R', 'T'); put(top + 1, 8, 'R', 'T'); put(top + 2, 7, 'R', 'TU');
    }
    if (style === 'spacesuit') {
        for (let x = 0; x < 16; x++) put(top + 5, x, 'V', 'P');
        if (down) { put(top + 2, 7, 'R', 'TU'); put(top + 2, 8, 'Y', 'TU'); put(top + 3, 8, 'B', 'TU'); }
        // the helmet: a glass bubble all the way around her head
        const ring = [];
        for (let y = 0; y < top; y++) for (let x = 0; x < 16; x++) {
            if (rows[y][x] !== '.') continue;
            if ([[0, 1], [1, 0], [0, -1], [-1, 0]].some(([dy, dx]) => { const yy = y + dy, q = rows[yy] && rows[yy][x + dx]; return yy < top && q && q !== '.'; })) ring.push([y, x]);
        }
        for (const [y, x] of ring) rows[y][x] = 'B';
    }
}
const SEW_PATTERNS = [['none', 'Plain', ''], ['stripes', 'Stripes', 'striped'], ['dots', 'Polka dots', 'polka-dot'], ['checks', 'Checks', 'checked'], ['plaid', 'Plaid', 'plaid'],
    ['hearts', 'Hearts', 'heart-print'], ['stars', 'Stars', 'starry'], ['flowers', 'Flowers', 'flowery']];
const SEW_PAL = [['#ffffff', 'white'], ['#f4efe6', 'cream'], ['#3a3340', 'black'], ['#8a8ea8', 'gray'], ['#e0405a', 'red'], ['#b3263a', 'crimson'],
    ['#ff9ec0', 'pink'], ['#e05599', 'hot pink'], ['#f7962d', 'orange'], ['#ffd84a', 'yellow'], ['#8cc152', 'lime'], ['#3f8f45', 'green'], ['#8fc4a1', 'sage'],
    ['#4ec3d9', 'aqua'], ['#4f86c6', 'blue'], ['#2c3e66', 'navy'], ['#b37cf0', 'lilac'], ['#6b3fa0', 'purple'], ['#8a5a3c', 'brown'], ['#d9a46a', 'tan']];
const PRINT_W = 6, PRINT_H = 3;
const MOTIFS = { hearts: [['X.X', 'XXX', '.X.'], 5, 4], stars: [['.X.', 'XXX', '.X.'], 4, 4], flowers: [['.X.', 'XoX', '.X.'], 5, 4] };

function designs() { if (!S.designs) S.designs = {}; return S.designs; }
function newDesign() {
    return { style: 'dress', top: ['#4f86c6', 'blue'], bottom: ['#4f86c6', 'blue'], trim: ['#ffffff', 'white'], shoes: ['#8a5a3c', 'brown'],
        pat: 'none', patCol: ['#ffffff', 'white'], patWhere: 'both', print: new Array(PRINT_W * PRINT_H).fill(null) };
}
function sewSil(style) { return (SEW_STYLES.find(s => s[0] === style) || SEW_STYLES[0])[2]; }
/* the pixel symbols of one frame (the same letters sarah.py uses), and the row where the torso starts */
function overlayRow(base, top) { let o = ''; for (let i = 0; i < 16; i++) o += top[i] !== '.' ? top[i] : base[i]; return o; }
function sewRows(dir, body, face, sil) {
    const T = GD.sarahTpl, blank = '.'.repeat(16);
    if (body === 'sit') {
        const rows = new Array(24).fill(blank);
        T.sit[sil].forEach((r, i) => { rows[15 + i] = r; });
        T.head.down.forEach((r, i) => { rows[1 + i] = overlayRow(rows[1 + i], r); });
        return { rows, top: 15 };
    }
    const head = T.head[dir].slice();
    if (face === 'happy' && T.happy[dir]) for (const [k, v] of Object.entries(T.happy[dir])) head[+k] = v;
    const b = (T.body[dir][sil] || {})[body] || (dir === 'down' ? T.poses[sil][body] : null);
    if (!b) return null;
    if (body === 'pick') {
        const rows = new Array(24).fill(blank);
        b.forEach((r, i) => { rows[14 + i] = r; });
        head.forEach((r, i) => { rows[2 + i] = overlayRow(rows[2 + i], r); });
        return { rows, top: 15 };
    }
    return { rows: head.concat(b), top: 14 };
}
function patHit(kind, x, y) {
    if (kind === 'stripes') return y % 2 === 0 ? 'X' : '';
    if (kind === 'dots') return y % 3 === 1 && (x + (Math.floor(y / 3) % 2) * 2) % 4 === 1 ? 'X' : '';
    if (kind === 'checks') return ((x >> 1) + (y >> 1)) % 2 === 0 ? 'X' : '';
    if (kind === 'plaid') return x % 4 === 1 || y % 4 === 1 ? 'X' : '';
    const m = MOTIFS[kind];
    if (!m) return '';
    const [rows, px, py] = m, band = Math.floor(y / py), lx = (x + (band % 2) * Math.floor(px / 2)) % px, ly = y % py;
    const c = lx < 3 && ly < 3 ? rows[ly][lx] : '.';
    return c === '.' ? '' : c;
}
/* one frame of Sarah in a design, as a 16x24 sprite */
function sewFrame(d, dir, body, face, L) {
    L = L || look();
    const T = GD.sarahTpl, sil = sewSil(d.style);
    const got = (T.hair ? sarahRowsFor(dir, body, face, sil, L) : null) || sewRows(dir, body, face, sil);
    if (!got) return null;
    const rows = got.rows.map(r => r.split('')), top = got.top;
    const down = dir === 'down';
    // style details, drawn with the same letters
    if (down && d.style === 'overalls') {
        for (let y = top + 2; y <= top + 4; y++) for (let x = 6; x <= 9; x++) if (rows[y] && 'TU'.includes(rows[y][x])) rows[y][x] = 'P';
        for (let y = top; y <= top + 1; y++) for (const x of [6, 9]) if (rows[y] && 'TU'.includes(rows[y][x])) rows[y][x] = 'Q';
    }
    if (down && d.style === 'hoodie') {
        for (let y = top + 1; y <= top + 2; y++) for (const x of [7, 8]) if (rows[y] && 'TU'.includes(rows[y][x])) rows[y][x] = 'V';
        for (let x = 6; x <= 9; x++) if (rows[top + 4] && rows[top + 4][x] === 'T') rows[top + 4][x] = 'U';
    }
    sewSpecialRows(rows, top, dir, body, d.style);
    const bottom = SEW_ONE_PIECE.has(d.style) ? d.top : d.bottom;
    const pal = Object.assign(lookPal(L), SEW_EXTRA_PAL, { T: d.top[0], U: shadeHex(d.top[0], -0.18), V: d.trim[0], P: bottom[0], Q: shadeHex(bottom[0], -0.18),
        F: d.shoes[0], f: shadeHex(d.shoes[0], -0.22), x: T.outline });
    const onTop = d.patWhere !== 'bottom', onBottom = d.patWhere !== 'top';
    const s = new PixSpr(16, 24);
    for (let y = 0; y < 24; y++) for (let x = 0; x < 16; x++) {
        const k = rows[y][x];
        if (k === '.' || !pal[k]) continue;
        let c = pal[k];
        if (d.pat && d.pat !== 'none' && ((onTop && 'TU'.includes(k)) || (onBottom && 'PQ'.includes(k)))) {
            const h = patHit(d.pat, x, y);
            if (h === 'o') c = '#ffd84a';
            else if (h) c = 'UQ'.includes(k) ? shadeHex(d.patCol[0], -0.18) : d.patCol[0];
        }
        s.set(x, y, c);
    }
    // the little print on the front
    if (down && d.print) {
        for (let py = 0; py < PRINT_H; py++) for (let px = 0; px < PRINT_W; px++) {
            const c = d.print[py * PRINT_W + px], x = 5 + px, y = top + 1 + py;
            if (c && rows[y] && 'TUPQV'.includes(rows[y][x])) s.set(x, y, c);
        }
    }
    return s;
}
/* every frame the game uses, registered as sprites (sarah_<id>_down_stand...) */
function registerDesign(id, d, L) {
    const T = GD.sarahTpl;
    L = L || look();
    for (const [name, dir, body, face] of T.frames) {
        const s = sewFrame(d, dir, body, face, L);
        if (s) Assets.dyn[`sarah_${id}_${name}`] = { c: s.canvas(), w: 16, h: 24, ax: 8, ay: 23 };
    }
    const icon = sewFrame(d, 'down', 'stand', 'normal', L);
    Assets.dyn['cloth_' + id] = { c: icon.canvas(), w: 16, h: 24, ax: 8, ay: 23 };
    ITEMS['out_' + id] = { name: d.name || 'My design', type: 'outfit', price: 0, icon: 'cloth_' + id, wear: id, custom: true };
}
function registerAllDesigns(st) {
    const D = st && st.designs;
    if (!D || !GD.sarahTpl) return;
    const L = look(st);                       // the save being loaded, not whatever was on screen before
    for (const [id, d] of Object.entries(D)) registerDesign(id, d, L);
}
function sewName(d) {
    const pw = (SEW_PATTERNS.find(p => p[0] === d.pat) || SEW_PATTERNS[0])[2];
    const cname = d.top[1] || 'blue';
    return cap(`${cname} ${pw ? pw + ' ' : ''}${SEW_WORD[d.style] || 'outfit'}`.replace(/\s+/g, ' '));
}

/* ---------------------------------------------------------------- the studio */
const Sewing = {
    run(d) { return new Promise(res => this.start(d, res)); },
    start(d, res) {
        this.d = JSON.parse(JSON.stringify(d || newDesign()));
        if (!this.d.print) this.d.print = new Array(PRINT_W * PRINT_H).fill(null);
        this.res = res; this.tab = 'style'; this.part = 'top'; this.ink = '#ffffff'; this.fresh = !d;
        const U = Studio.open('The sewing machine', 'Pick a style, colors and a pattern. Draw a tiny print on the front if you like.');
        this.U = U;
        const cv = el('canvas', 'st-canvas');
        cv.width = 66; cv.height = 30;
        cv.style.cursor = 'default';
        U.box.appendChild(cv);
        this.cv = cv; this.ctx = cv.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        Studio.onResize = fitCanvas(cv, U.box, cv.width, cv.height);
        U.x.addEventListener('click', () => this.finish(null));
        Studio.onKey = (code, down) => { if (down && code === 'Escape') this.finish(null); };
        this.tools();
        this.draw();
    },
    finish(v) { Studio.close(); const r = this.res; this.res = null; if (r) r(v); },
    draw() {
        const g = this.ctx, W = this.cv.width, H = this.cv.height;
        g.fillStyle = '#fdebe0'; g.fillRect(0, 0, W, H);
        g.fillStyle = '#f2d8c8'; g.fillRect(0, H - 5, W, 5);
        const views = [['down', 'stand', 'normal'], ['side', 'walkA', 'normal'], ['up', 'stand', 'normal'], ['down', 'sit', 'normal']];
        views.forEach(([dir, body, face], i) => {
            const s = sewFrame(this.d, dir, body, face);
            if (!s) return;
            g.fillStyle = 'rgba(59,42,69,0.15)'; g.fillRect(3 + i * 16 + 4, H - 6, 9, 2);
            g.drawImage(s.canvas(), 1 + i * 16, H - 28);
        });
    },
    set(k, v) { this.d[k] = v; if (k === 'top' && SEW_ONE_PIECE.has(this.d.style)) this.d.bottom = v; this.tools(); this.draw(); },
    palette(isOn, onPick, extra) {
        const U = this.U, sw = el('div', 'swatches');
        for (const [hex, name] of SEW_PAL) {
            const b = el('button', 'swatch' + (isOn(hex, name) ? ' on' : ''));
            b.type = 'button'; b.title = name; b.setAttribute('aria-label', name);
            b.style.background = hex;
            b.addEventListener('click', () => { Sfx.ui('tick'); onPick([hex, name]); });
            sw.appendChild(b);
        }
        if (extra) sw.appendChild(extra);
        mySwatches(sw, c => isOn(c.hex, c.name), c => onPick([c.hex, c.name]), () => colorForm(U, { done: c => { if (c) onPick([c.hex, c.name]); else { this.tools(); this.draw(); } } }));
        U.tools.appendChild(sw);
    },
    tools() {
        const U = this.U, d = this.d;
        U.tools.innerHTML = '';
        const tabs = el('div', 'st-row');
        for (const [k, label] of [['style', 'Style'], ['colors', 'Colors'], ['pattern', 'Pattern'], ['print', 'Print']]) tabs.appendChild(chip(label, () => { this.tab = k; this.tools(); }, this.tab === k ? 'on' : ''));
        U.tools.appendChild(tabs);
        const short = innerHeight < 520;
        const foot = el('div', 'st-row');
        if (short) U.tools.appendChild(foot);
        if (this.tab === 'style') {
            U.tools.appendChild(stLabel('What are we making?'));
            const row = el('div', 'st-row');
            const pick = k => { d.style = k; if (SEW_ONE_PIECE.has(k)) d.bottom = d.top; if (k === 'pajamas' && d.pat === 'none') { d.pat = 'stars'; d.patWhere = 'both'; } this.tools(); this.draw(); };
            for (const [k, label, , special] of SEW_STYLES) if (!special) row.appendChild(chip(label, () => pick(k), d.style === k ? 'on' : ''));
            U.tools.appendChild(row);
            const specials = SEW_STYLES.filter(s => s[3]);
            U.tools.appendChild(stLabel(`Special patterns (${specials.filter(s => sewStyleOk(s[0])).length} of ${specials.length} found)`));
            const r2 = el('div', 'st-row');
            for (const [k, label] of specials) {
                if (sewStyleOk(k)) r2.appendChild(chip(label, () => {
                    // a special pattern starts in its classic colors (change them all you like)
                    if (d.style !== k) Object.assign(d, JSON.parse(JSON.stringify(SPECIAL_DESIGNS[k] || {})));
                    pick(k);
                }, d.style === k ? 'on' : ''));
                else { const c = chip('???', () => UI.toast(specialHint('sew', k), 'ic_pattern')); c.classList.add('locked'); r2.appendChild(c); }
            }
            U.tools.appendChild(r2);
            U.tools.appendChild(el('div', 'st-sub', SEW_NOTES[d.style] || ''));
        } else if (this.tab === 'colors') {
            const parts = (SEW_PARTS[d.style] || SEW_PARTS.dress).concat(d.pat !== 'none' ? [['patCol', 'Pattern']] : []);
            if (!parts.some(p => p[0] === this.part)) this.part = parts[0][0];
            const row = el('div', 'st-row');
            for (const [k, label] of parts) row.appendChild(chip(label, () => { this.part = k; this.tools(); }, this.part === k ? 'on' : ''));
            U.tools.appendChild(row);
            U.tools.appendChild(stLabel(`${(parts.find(p => p[0] === this.part) || parts[0])[1]} color`));
            const cur = d[this.part];
            this.palette((hex, name) => cur && cur[0] === hex && cur[1] === name, v => this.set(this.part, v));
            const mine = cur && myColors().find(c => c.hex === cur[0] && c.name === cur[1]);
            if (mine) editMine(U, mine, () => { const c = colorById(mine.id); if (c) this.set(this.part, [c.hex, c.name]); else { this.tools(); this.draw(); } });
        } else if (this.tab === 'pattern') {
            U.tools.appendChild(stLabel('Pattern'));
            const row = el('div', 'st-row');
            for (const [k, label] of SEW_PATTERNS) row.appendChild(chip(label, () => { d.pat = k; this.tools(); this.draw(); }, d.pat === k ? 'on' : ''));
            U.tools.appendChild(row);
            if (d.pat !== 'none') {
                U.tools.appendChild(stLabel('Where'));
                const r2 = el('div', 'st-row');
                const where = SEW_ONE_PIECE.has(d.style) ? [['both', 'All over']] : [['top', 'Top'], ['bottom', { overalls: 'Overalls', hoodie: 'Pants', toppants: 'Pants', suit: 'Trousers', cape: 'Leggings', tutu: 'Tutu', sailor: 'Skirt' }[d.style] || 'Bottom'], ['both', 'Both']];
                if (SEW_ONE_PIECE.has(d.style)) d.patWhere = 'both';
                for (const [k, label] of where) r2.appendChild(chip(label, () => { d.patWhere = k; this.tools(); this.draw(); }, d.patWhere === k ? 'on' : ''));
                U.tools.appendChild(r2);
                U.tools.appendChild(stLabel('Pattern color'));
                this.palette((hex, name) => d.patCol[0] === hex && d.patCol[1] === name, v => this.set('patCol', v));
            }
        } else {
            U.tools.appendChild(stLabel('A tiny print on the front'));
            const K = 26, cv = el('canvas', 'sewprint');
            cv.width = PRINT_W * K; cv.height = PRINT_H * K;
            cv.style.width = cv.width + 'px'; cv.style.height = cv.height + 'px';
            const g = cv.getContext('2d');
            const paint = () => {
                for (let i = 0; i < PRINT_W * PRINT_H; i++) {
                    const x = (i % PRINT_W) * K, y = Math.floor(i / PRINT_W) * K;
                    g.fillStyle = d.print[i] || ((i + Math.floor(i / PRINT_W)) % 2 ? shadeHex(d.top[0], 0.1) : d.top[0]);
                    g.fillRect(x, y, K, K);
                    g.strokeStyle = 'rgba(59,42,69,0.25)'; g.strokeRect(x + 0.5, y + 0.5, K - 1, K - 1);
                }
            };
            paint();
            const hit = e => {
                const r = cv.getBoundingClientRect();
                const x = Math.floor((e.clientX - r.left) / r.width * PRINT_W), y = Math.floor((e.clientY - r.top) / r.height * PRINT_H);
                if (x < 0 || y < 0 || x >= PRINT_W || y >= PRINT_H) return;
                const i = y * PRINT_W + x, v = this.ink === 'erase' ? null : this.ink;
                if (d.print[i] === v) return;
                d.print[i] = v; paint(); this.draw();
            };
            let down = false;
            cv.addEventListener('pointerdown', e => { e.preventDefault(); down = true; hit(e); try { cv.setPointerCapture(e.pointerId); } catch (err) { /* fine */ } });
            cv.addEventListener('pointermove', e => { if (down) hit(e); });
            cv.addEventListener('pointerup', () => { down = false; }); cv.addEventListener('pointercancel', () => { down = false; });
            U.tools.appendChild(cv);
            U.tools.appendChild(el('div', 'st-sub', 'Six by three stitches, right on the chest. Hearts, a smiley, your initials... tiny ones.'));
            const erase = el('button', 'swatch add' + (this.ink === 'erase' ? ' on' : ''), '\u00d7');
            erase.type = 'button'; erase.title = 'Eraser'; erase.setAttribute('aria-label', 'Eraser');
            erase.addEventListener('click', () => { this.ink = 'erase'; this.tools(); });
            this.palette(hex => this.ink === hex, v => { this.ink = v[0]; this.tools(); }, erase);
            const r = el('div', 'st-row');
            r.appendChild(chip('Clear the print', () => { d.print.fill(null); this.tools(); this.draw(); }));
            U.tools.appendChild(r);
        }
        if (!short) { foot.style.marginTop = '8px'; U.tools.appendChild(foot); }
        const price = this.fresh ? SEW_PRICE : SEW_ALTER;
        foot.appendChild(chip(`Sew it! (${fmtNum(price)})`, () => this.done(), short ? 'go' : 'go big'));
    },
    done() {
        const price = this.fresh ? SEW_PRICE : SEW_ALTER;
        if (S.money < price) { this.U.sub.textContent = `Fabric and thread cost ${fmtNum(price)} sand dollars. A little short! Come back after some fishing.`; Sfx.ui('nope'); return; }
        Studio.onKey = (code, down) => { if (down && code === 'Escape') this.finish(null); };
        nameStep(this.U, this.d.name && !this.fresh ? this.d.name : sewName(this.d), name => { this.d.name = name; this.finish(this.d); });
    },
};

/* ---------------------------------------------------------------- at the machine */
async function sewingMachine() {
    const sp = boutiqueVoice();
    const mine = Object.keys(designs());
    const opts = ['Sew something new', mine.length ? 'Change one of my designs' : null, 'Never mind'].filter(Boolean);
    const k = await UI.ask(sp, sp ? `Darling, the sewing machine! Make something fabulous. Fabric and thread are ${fmtNum(SEW_PRICE)}.` : `A sewing machine and a basket of fabric. A little sign: "${fmtNum(SEW_PRICE)} per outfit. Honor system, darling."`, opts);
    if (opts[k] === 'Never mind') return;
    UI.hideDialog();
    let id = null, base = null;
    if (opts[k] === 'Change one of my designs') {
        id = await pickDesign();
        if (!id) return;
        base = designs()[id];
    }
    const d = await Sewing.run(base);
    if (!d) return;
    const price = base ? SEW_ALTER : SEW_PRICE;
    if (S.money < price) return;
    addMoney(-price, true);
    if (!id) { S.designSeq = (S.designSeq || 0) + 1; id = 'cu' + S.designSeq; }
    designs()[id] = d;
    registerDesign(id, d);
    if (!S.wardrobe.outfits.includes(id)) S.wardrobe.outfits.push(id);
    S.stats.sewn = (S.stats.sewn || 0) + 1;
    Sfx.play('fanfare');
    Save.touch();
    Bus.emit('sewn', { id, style: d.style, fresh: !base });
    const p = G.player;
    const w = await UI.ask(sp, sp ? rpick([`"${d.name}." Darling. I'm speechless. I am never speechless.`, `You MADE that? "${d.name}"? I'm putting you on the payroll.`])
        : `Sarah finishes "${d.name}." It's in her wardrobe now.`, ['Wear it now!', 'Maybe later']);
    if (w === 0) {
        S.player.outfit = id;
        p.pose = 'happy'; p.poseT = 50; p.dir = 'down';
        p.emote = 'sparkle'; p.emoteT = 60;
        Sfx.play('item');
    }
    if (sp) { const c = NPCs.get('clementine'); if (c) { c.emote = 'heart'; c.emoteT = 80; } const r = rel('clementine'); if (r.met && r.sewDay !== Clock.dayNum()) { r.sewDay = Clock.dayNum(); addPts('clementine', 3); } }
}
function pickDesign() {
    return new Promise(res => {
        let done = false;
        const finish = v => { if (!done) { done = true; res(v); } };
        const P = UI.open({ title: 'Your designs', onClose: () => finish(null) });
        const grid = el('div', 'grid');
        for (const id of Object.keys(designs())) {
            const b = slotBtn('out_' + id, 0, { onClick: () => { finish(id); UI.close(true); } });
            grid.appendChild(b);
        }
        P.body.appendChild(grid);
        P.body.appendChild(el('p', 'muted', `Alterations are ${fmtNum(SEW_ALTER)} sand dollars.`));
    });
}

