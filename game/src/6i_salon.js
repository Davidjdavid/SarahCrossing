/* ---- 6i_salon.js ---- */
/* Floss & Gloss, the salon: a new hair style, hair color (and a color for the tips), skin tone, eye color, blush and
   freckles. Sarah's frames are built from the same letter templates as the atlas (sarah.py + hair.py), so her new look
   works in every outfit (and every outfit she sews), walking, sitting, dancing and hugging, from every side. */
const LOOK_DEFAULT = { hair: 'waves', hairCol: '#8f4629', tipCol: '#d8914f', skin: '#fbd9c6', eyes: '#6c5236', blush: true, freckles: false };
const SALON_PRICE = 1000;
const HAIR_COLORS = [['#8f4629', 'auburn'], ['#241a1c', 'black'], ['#3e2418', 'dark brown'], ['#6a4028', 'brown'], ['#8a4a2a', 'chestnut'],
    ['#b85a2a', 'copper'], ['#d8702a', 'ginger'], ['#e0a070', 'strawberry blonde'], ['#e8c46a', 'blonde'], ['#f0e6c8', 'platinum'],
    ['#b8b8c4', 'silver'], ['#f08ab8', 'pink'], ['#b494e0', 'lilac'], ['#4a78c8', 'blue'], ['#3aa8a0', 'teal'], ['#c0303a', 'cherry red']];
const TIP_COLORS = [[null, 'same as the rest'], ['#d8914f', 'copper-gold'], ['#e8c46a', 'blonde'], ['#f0e6c8', 'platinum'], ['#f08ab8', 'pink'],
    ['#b494e0', 'lilac'], ['#4ec3d9', 'aqua'], ['#e0405a', 'red'], ['#241a1c', 'black']];
const SKIN_TONES = [['#fde7da', 'porcelain'], ['#fbd9c6', 'fair'], ['#f1c7a8', 'light'], ['#e2ae8a', 'warm beige'], ['#d0976c', 'golden'],
    ['#b97d55', 'tan'], ['#9a6243', 'brown'], ['#7a4a30', 'deep brown'], ['#5a3422', 'espresso']];
const EYE_COLORS = [['#6c5236', 'hazel'], ['#4a2c1c', 'brown'], ['#2a1a14', 'dark brown'], ['#3f7a4a', 'green'], ['#3f6fb8', 'blue'],
    ['#6a7488', 'gray'], ['#a8742a', 'amber'], ['#7a4ab0', 'violet']];

function look(st) { const s = st || S; return Object.assign({}, LOOK_DEFAULT, (s && s.look) || {}); }
function lookIsDefault(L) { L = L || look(); return Object.keys(LOOK_DEFAULT).every(k => L[k] === LOOK_DEFAULT[k]); }
function lookKey(L) { L = L || look(); return hash32(JSON.stringify(Object.keys(LOOK_DEFAULT).map(k => L[k]))).toString(36); }
function mixHex(a, b, t) { const x = hexRgbA(a), y = hexRgbA(b); return rgbHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t); }
function mulHex(a, m) { const x = hexRgbA(a); return rgbHex(x[0] * m[0], x[1] * m[1], x[2] * m[2]); }
/* the colors a look paints with (the same letters sarah.py uses) */
function lookPal(L) {
    const T = GD.sarahTpl, p = Object.assign({}, T.base);
    if (L.hairCol !== LOOK_DEFAULT.hairCol || L.tipCol !== LOOK_DEFAULT.tipCol) {
        const H = L.hairCol;
        p.H = H; p.h = shadeHex(H, -0.24); p.k = shadeHex(H, -0.5);
        p.L = mixHex(mulHex(H, [1.3, 1.3, 1.3]), '#ffffff', 0.12);
        p.C = L.tipCol || mixHex(H, p.L, 0.5);
    }
    if (L.skin !== LOOK_DEFAULT.skin) {
        const Sk = L.skin, deep = hexRgbA(Sk).reduce((a, b) => a + b, 0) < 420;
        p.S = Sk; p.s = mulHex(Sk, [0.93, 0.84, 0.8]); p.n = mulHex(Sk, [0.9, 0.75, 0.7]);
        p.b = mixHex(Sk, deep ? '#b0404e' : '#f05a78', deep ? 0.28 : 0.4);
        p.t = '#ffffff';
    }
    if (L.eyes !== LOOK_DEFAULT.eyes) p.i = L.eyes;
    if (!L.blush) p.b = p.S;
    p.F = mulHex(p.S, [0.72, 0.55, 0.5]);                 // freckles
    return p;
}
const FACE_CH = 'SsebimtnF';
/* the happy face goes where the face shows (a fringe stays a fringe) */
function mergeFace(styleRow, happyRow, baseRow) {
    let o = '';
    for (let i = 0; i < 16; i++) o += FACE_CH.includes(baseRow[i]) && FACE_CH.includes(styleRow[i]) && FACE_CH.includes(happyRow[i]) ? happyRow[i] : styleRow[i];
    return o;
}
function stripHair(r) { return r.replace(/[kHhLC]/g, '.'); }
function underlay(rows, y0, back, over) {
    back.forEach((br, i) => {
        const y = y0 + i;
        if (!rows[y]) return;
        for (let x = 0; x < 16; x++) { const c = br[x]; if (c !== '.' && (over || rows[y][x] === '.')) rows[y][x] = c; }
    });
}
/* the letters for one frame: dir (down/up/side), body (stand, walkA, sit, cheer...), face (normal/happy), sil (pants/dress) */
function sarahRowsFor(dir, body, face, sil, L) {
    const T = GD.sarahTpl, HT = T.hair, st = (HT && HT.styles[L.hair]) || null;
    const blank = '.'.repeat(16);
    if (!st) return null;
    let head = st.head[dir === 'side' ? 'side' : dir].slice();
    const hd = body === 'sit' || body === 'pick' ? 'down' : dir;
    if (body === 'sit' || body === 'pick') head = st.head.down.slice();
    if (face === 'happy' && T.happy[hd]) for (const [k, v] of Object.entries(T.happy[hd])) head[+k] = mergeFace(head[+k], v, T.head[hd][+k]);
    if (L.freckles && hd === 'down') {
        for (const [x, y] of [[4, 11], [6, 12], [11, 11], [9, 12]]) if (FACE_CH.includes(head[y][x]) && head[y][x] !== 'b') head[y] = head[y].slice(0, x) + 'F' + head[y].slice(x + 1);
    }
    const back = st.back[hd] || [], over = st.over[hd];
    if (body === 'sit') {
        const rows = new Array(24).fill(0).map(() => blank.split(''));
        T.sit[sil].forEach((r, i) => { rows[15 + i] = stripHair(r).split(''); });
        underlay(rows, 15, back, over);
        head.forEach((r, i) => { for (let x = 0; x < 16; x++) if (r[x] !== '.') rows[1 + i][x] = r[x]; });
        return { rows: rows.map(r => r.join('')), top: 15 };
    }
    let b = (T.body[dir][sil] || {})[body] || (dir === 'down' ? T.poses[sil][body] : null);
    if (!b) return null;
    b = b.map(stripHair);
    if (dir === 'up') {
        const bald = HT.baldUp[HT.baldUp[body] ? body : 'stand'];
        b = bald.slice(0, 5).concat([sil === 'dress' ? HT.baldUpDress : bald[5]], b.slice(6));
    }
    if (body === 'pick') {
        const rows = new Array(24).fill(0).map(() => blank.split(''));
        b.forEach((r, i) => { rows[14 + i] = r.split(''); });
        underlay(rows, 16, back, over);
        head.forEach((r, i) => { for (let x = 0; x < 16; x++) if (r[x] !== '.') rows[2 + i][x] = r[x]; });
        return { rows: rows.map(r => r.join('')), top: 15 };
    }
    const rows = head.concat(b).map(r => r.split(''));
    underlay(rows, 14, back, over);
    return { rows: rows.map(r => r.join('')), top: 14 };
}
/* one frame of Sarah in a built-in outfit, in her current look */
function lookFrame(outfit, dir, body, face, L) {
    const T = GD.sarahTpl, o = T.hair.outfits[outfit];
    if (!o) return null;
    const [sil, Tc, U, V, P, Q, F, f] = o;
    const got = sarahRowsFor(dir, body, face, sil, L);
    if (!got) return null;
    const pal = Object.assign(lookPal(L), { T: Tc, U, V, P: P || Tc, Q: Q || U, F, f, x: T.outline });
    const s = new PixSpr(16, 24);
    for (let y = 0; y < 24; y++) for (let x = 0; x < 16; x++) { const k = got.rows[y][x]; if (k !== '.' && pal[k]) s.set(x, y, pal[k]); }
    return s;
}
/* the sprite name for a frame of Sarah ("down_stand", "side_hug"...) in an outfit, in her look */
const SARAH_FRAMES = {};
function sarahSprite(outfit, frame) {
    if (Online.visitor()) return personFrame(Online.who(), frame);          // a visitor, as themselves
    outfit = outfit || 'crimson';
    const L = look(), custom = !!(S.designs && S.designs[outfit]);
    if (!custom && lookIsDefault(L)) return `sarah_${outfit}_${frame}`;
    const name = `sl_${lookKey(L)}_${outfit}_${frame}`;
    if (Assets.dyn[name]) return name;
    const T = GD.sarahTpl;
    if (!Object.keys(SARAH_FRAMES).length) for (const [nm, dir, body, face] of T.frames) SARAH_FRAMES[nm] = [dir, body, face];
    const spec = SARAH_FRAMES[frame];
    if (!spec) return `sarah_${outfit}_${frame}`;
    const s = custom ? sewFrame(S.designs[outfit], spec[0], spec[1], spec[2], L) : lookFrame(outfit, spec[0], spec[1], spec[2], L);
    if (!s) return `sarah_${outfit}_${frame}`;
    Assets.dyn[name] = { c: s.canvas(), w: 16, h: 24, ax: 8, ay: 23 };
    return name;
}

/* ---------------------------------------------------------------- the salon chair */
const Salon = {
    run() { return visitorStop('look') ? Promise.resolve(null) : new Promise(res => this.start(res)); },
    start(res) {
        this.res = res;
        this.L = look();
        this.orig = look();
        this.tab = 'style';
        const U = Studio.open('Floss & Gloss', 'A new look! Pick a style and colors. Floss does the rest.');
        this.U = U;
        const cv = el('canvas', 'st-canvas');
        cv.width = 72; cv.height = 34;
        U.box.appendChild(cv);
        this.cv = cv;
        this._fit = fitCanvas(cv, U.box, 72, 34);
        Studio.onResize = () => this._fit();
        U.x.addEventListener('click', () => this.finish(false));
        Studio.onKey = (code, down) => { if (down && code === 'Escape') this.finish(false); };
        this.tools();
        this.draw();
    },
    frames() {
        const o = S.player.outfit || 'crimson', L = this.L, custom = !!(S.designs && S.designs[o]);
        return [['down', 'stand', 'happy'], ['side', 'stand', 'normal'], ['up', 'stand', 'normal']].map(([d, b, f]) =>
            custom ? sewFrame(S.designs[o], d, b, f, L) : lookFrame(o, d, b, f, L));
    },
    draw() {
        const g = this.cv.getContext('2d');
        g.imageSmoothingEnabled = false;
        const grd = g.createLinearGradient(0, 0, 0, 34);
        grd.addColorStop(0, '#f6e8fa'); grd.addColorStop(1, '#e8d4f2');
        g.fillStyle = grd; g.fillRect(0, 0, 72, 34);
        g.fillStyle = 'rgba(179,124,240,0.18)';
        for (let x = 0; x < 72; x += 6) g.fillRect(x, 0, 3, 34);
        this.frames().forEach((s, i) => {
            if (!s) return;
            const x = 4 + i * 23, y = 6;
            g.fillStyle = 'rgba(59,42,69,0.18)'; g.fillRect(x + 3, y + 23, 10, 2);
            g.save(); if (i === 1) { g.translate(x + 16, 0); g.scale(-1, 1); g.drawImage(s.canvas(), 0, y); } else g.drawImage(s.canvas(), x, y); g.restore();
        });
    },
    set(k, v) { this.L[k] = v; this.tools(); this.draw(); },
    changed() { return Object.keys(LOOK_DEFAULT).some(k => this.L[k] !== this.orig[k]); },
    swatches(key, list, allowNull) {
        const U = this.U, sw = el('div', 'swatches');
        for (const [hex, name] of list) {
            const b = el('button', 'swatch' + (this.L[key] === hex ? ' on' : ''));
            b.type = 'button'; b.title = name; b.setAttribute('aria-label', name);
            if (hex) b.style.background = hex; else { b.textContent = '='; b.style.background = this.L.hairCol; b.style.color = '#fff'; }
            b.addEventListener('click', () => { Sfx.ui('tick'); this.set(key, hex); });
            sw.appendChild(b);
        }
        mySwatches(sw, c => this.L[key] === c.hex, c => this.set(key, c.hex), () => colorForm(U, { start: this.L[key] || this.L.hairCol, done: c => { if (c) this.L[key] = c.hex; this.tools(); this.draw(); } }));
        U.tools.appendChild(sw);
        const mine = myColors().find(c => c.hex === this.L[key]);
        if (mine) editMine(U, mine, () => { this.tools(); this.draw(); });
    },
    tools() {
        const U = this.U, L = this.L;
        U.tools.innerHTML = '';
        const tabs = el('div', 'st-row');
        for (const [k, label] of [['style', 'Style'], ['hair', 'Hair color'], ['tips', 'Tips'], ['skin', 'Skin'], ['eyes', 'Eyes'], ['extra', 'Extras']])
            tabs.appendChild(chip(label, () => { this.tab = k; this.tools(); }, this.tab === k ? 'on' : ''));
        U.tools.appendChild(tabs);
        const HT = GD.sarahTpl.hair;
        if (this.tab === 'style') {
            U.tools.appendChild(stLabel('Hair style'));
            const row = el('div', 'st-row');
            for (const id of HT.order) row.appendChild(chip(HT.styles[id].name, () => this.set('hair', id), L.hair === id ? 'on' : ''));
            U.tools.appendChild(row);
            if (HT.special && HT.special.length) {
                const got = HT.special.filter(id => specialStyleOk(id)).length;
                U.tools.appendChild(stLabel(`Special styles (${got} of ${HT.special.length} found)`));
                const r2 = el('div', 'st-row');
                for (const id of HT.special) {
                    if (specialStyleOk(id)) r2.appendChild(chip(HT.styles[id].name, () => this.set('hair', id), L.hair === id ? 'on' : ''));
                    else { const c = chip('???', () => UI.toast(specialHint('hair', id), 'ic_stylecard')); c.classList.add('locked'); r2.appendChild(c); }
                }
                U.tools.appendChild(r2);
            }
        } else if (this.tab === 'hair') {
            U.tools.appendChild(stLabel('Hair color'));
            this.swatches('hairCol', HAIR_COLORS);
        } else if (this.tab === 'tips') {
            U.tools.appendChild(stLabel('A different color at the ends (the first one keeps it all one color)'));
            this.swatches('tipCol', TIP_COLORS, true);
        } else if (this.tab === 'skin') {
            U.tools.appendChild(stLabel('Skin tone'));
            this.swatches('skin', SKIN_TONES);
        } else if (this.tab === 'eyes') {
            U.tools.appendChild(stLabel('Eye color'));
            this.swatches('eyes', EYE_COLORS);
        } else {
            U.tools.appendChild(stLabel('Little touches'));
            const row = el('div', 'st-row');
            row.appendChild(chip(L.blush ? 'Blush: on' : 'Blush: off', () => this.set('blush', !L.blush), L.blush ? 'on' : ''));
            row.appendChild(chip(L.freckles ? 'Freckles: on' : 'Freckles: off', () => this.set('freckles', !L.freckles), L.freckles ? 'on' : ''));
            U.tools.appendChild(row);
            const r2 = el('div', 'st-row');
            r2.appendChild(chip('Back to how I looked', () => { this.L = Object.assign({}, this.orig); this.tools(); this.draw(); }));
            r2.appendChild(chip("Sarah's original look", () => { this.L = Object.assign({}, LOOK_DEFAULT); this.tools(); this.draw(); }));
            U.tools.appendChild(r2);
        }
        const foot = el('div', 'st-row');
        foot.style.marginTop = '12px';
        const ch = this.changed();
        foot.appendChild(chip(ch ? `Do it! (${fmtNum(SALON_PRICE)})` : 'Nothing changed yet', () => this.finish(true), ch ? 'go big' : ''));
        foot.appendChild(chip('Never mind', () => this.finish(false)));
        U.tools.appendChild(foot);
        U.sub.textContent = `${HT.styles[L.hair] ? HT.styles[L.hair].name : 'Hair'} \u00b7 ${colorWord(L.hairCol, HAIR_COLORS)}${L.tipCol && L.tipCol !== L.hairCol ? ' with ' + colorWord(L.tipCol, TIP_COLORS) + ' tips' : ''}`;
    },
    finish(ok) {
        if (ok && !this.changed()) return;
        if (ok && S.money < SALON_PRICE) { UI.toast(`A new look is ${fmtNum(SALON_PRICE)} sand dollars.`); return; }
        const L = this.L, res = this.res;
        Studio.close();
        this.res = null;
        if (res) res(ok ? L : null);
    },
};
function colorWord(hex, list) { const f = list.find(c => c[0] === hex); if (f) return f[1]; const m = myColors().find(c => c.hex === hex); return m ? m.name : 'a custom color'; }

function flossVoice() { const f = NPCs.get('floss'); return f && !f.sleeping && f.area === 'salon' ? 'floss' : null; }
async function salonChair() {
    const v = flossVoice();
    // Floss out? The chair is self-serve on the honor system (the mirror is very encouraging)
    const k = await UI.ask(v, v ? rpick(['Sit, sugar, sit! What are we doing today?', 'The chair is warm and so is my heart. New look?', "Ooh, I've been DYING to get my hands on that hair. What'll it be?"])
        : 'A big comfy salon chair. Self-serve styling, honor system. Try a new look?', ['A new look!', 'Just looking'], { keep: true });
    if (k !== 0) { await UI.say(v, v ? rpick(["Looking is free! Looking is how it starts.", 'Take your time, sugar. The chair will wait.']) : 'Sarah gives the chair a little spin. Maybe next time.'); return; }
    UI.hideDialog();
    const L = await Salon.run();
    if (!L) { await UI.say(v, v ? rpick(['Next time, sugar. The chair remembers you.', "No pressure! Hair is a journey."]) : 'No new look today. The chair understands.'); return; }
    addMoney(-SALON_PRICE, true, 'Salon');
    const before = look();
    S.look = Object.assign({}, L);
    Save.touch();
    await fadeTo(async () => { G.player.dir = 'down'; await waitFrames(20); });
    Sfx.play('fanfare');
    G.player.pose = 'cheer'; G.player.poseT = 60;
    const style = GD.sarahTpl.hair.styles[L.hair];
    if (!v) { await UI.say(null, `Sarah drops the sand dollars in the honor jar and checks the mirror. ${before.hair !== L.hair ? (style ? style.name : 'New hair') + '!' : 'New colors!'} Floss would be proud.`); S.stats.salon = (S.stats.salon || 0) + 1; Bus.emit('look', L); return; }
    await UI.say('floss', [before.hair !== L.hair ? `Ta-daa! ${style ? style.name : 'New hair'}! Sugar, you look like a whole new dessert.` : 'Ta-daa! Look at those colors. You look like a sunset. A sunset with great skin.',
        rpick(["Come back anytime. I'll be here, fluffing things.", "Go show everyone. Especially Clementine. She'll pretend she's not jealous."])]);
    S.stats.salon = (S.stats.salon || 0) + 1;
    Bus.emit('look', L);
}
async function flossTalk(n) {
    const k = await UI.ask('floss', rpick(['Hi, sugar! Welcome to Floss & Gloss.', "Well hello, gorgeous. Here for a little fluff?", 'Sugar! Come in, come in. The chair is free.']),
        ['Talk', 'A new look!', 'See you!'], { keep: true });
    if (k === 0) { await UI.say('floss', rpick(FLOSS_CHAT)); return; }
    if (k === 1) { UI.hideDialog(); await salonChair(); return; }
    await UI.say('floss', rpick(['Bye, sugar! Stay fluffy.', 'See you soon! Keep the humidity away from that hair.']));
}
const FLOSS_CHAT = [
    "I'm cotton candy, sugar. I've been having a good hair day since the day I was spun.",
    "Clementine sends everyone here after she dresses them. We call it the full makeover. She calls it 'finishing the job.'",
    'David came in and asked for "more." More what? "More," he said. I respect it.',
    "Humidity is my nemesis. I live on an island. I know. I KNOW.",
    'Wonton asked for a trim. He is a dumpling. I trimmed his little fold. He left very happy.',
    "Everybody's hair tells a story. Joe's hair tells a poem. A beautiful one. About curls.",
    "The secret to great hair? A good night's sleep. In bed by midnight, sugar. The hair knows.",
];

/* ---------------------------------------------------------------- the salon itself */
ROOM_HOURS.salon = [10, 22];
ROOMS.salon = { w: 11, h: 6, wall: 'wall_salon', floor: 'floor_salon', music: 'boutique', name: 'Floss & Gloss', staff: 'floss',
    staffAt: [8, 0], staffStand: [8, 2], guest: [5, 3, 2], build: a => buildSalonRoom(a),
    closedSign: 'FLOSS & GLOSS. Open {hours:salon}. Floss is asleep. Her hair is also asleep. It has earned it.' };
function buildSalonRoom(a) {
    const items = layoutItems([
        ['window_wall', 0, 'wall'], ['salon_mirror', 2, 'wall'], ['salon_mirror', 5, 'wall'], ['sign_salon', 8, 'wall'],
        ['salon_chair', 2, 1], ['salon_chair', 5, 1], ['salon_desk', 8, 1], ['salon_sink', 0, 4], ['salon_dryer', 2, 4],
        ['salon_sofa', 7, 4], ['salon_shelf', 9, 4], ['plant_monstera', 10, 5]]);
    items.forEach(it => {
        if (it.id === 'salon_chair') it.use = () => salonChair();
        else if (it.id === 'salon_desk') it.use = 'counter';
        else if (it.id === 'salon_mirror') it.use = () => UI.say(null, lookIsDefault() ? 'Sarah checks the mirror. Same Sarah. Still great.' : 'Sarah checks the mirror. The new look? Honestly? Iconic.');
        else if (it.id === 'salon_dryer') it.use = () => UI.say(null, rpick(['A hood hair dryer. It hums like a very small airplane.', 'Sarah sits under the dryer for a second. Warm. Loud. Relaxing, somehow.']));
        else if (it.id === 'salon_sink') it.use = () => UI.say(null, 'A shampoo sink. It smells like strawberries and coconut and a little like cotton candy.');
        else if (it.id === 'salon_shelf') it.use = () => UI.say(null, rpick(['Shelves of hair products: "Extra Fluff", "Sea Salt Spray", "Anti-Humidity (Please)".', 'Brushes, combs, a hundred bottles. One is labeled "For David Only."']));
        else if (it.id === 'salon_sofa') it.use = () => UI.say(null, 'A little pink sofa for waiting. There are magazines. They are all about hair.');
    });
    a.items = items;
    placeFurniture(a, items);
}

