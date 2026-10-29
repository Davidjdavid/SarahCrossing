/* ---- 6zzi_accessories.js ---- */
/* Clementine's accessories (David, 29 October: "a rotating stock of accessories with 20 unique items ... those glasses
   come in red, orange, yellow, blue, black, purple, white, gray, pink, rainbow ... so there is reason to check the stock
   of the shops each day"). Twenty kinds (the first nine and ACC_NEW's eleven), most in colors of their own: each color an
   item (acc_<kind>@<color>, "Glasses (red)", the same price) worn as <kind>@<color>; whatever draws an accessory looks
   it up by its kind (accBase) and repaints it where its own color is (ACC_PAINT: the flat pictures and the HD ones from
   the picture, accPaintCanvas; the dolls' pieces in the new look by their material's color, accTint3d in
   EnvDolls.extras). The boutique lays out ACC_DAILY of them a day, each in one of its colors, from the seed and the day
   (accDaily); the shop's size no longer changes how many. */

const ACC_HEX = { red: '#e0404a', orange: '#f08a2a', yellow: '#f4cc3a', green: '#4fae5a', blue: '#3f78d8', purple: '#8c5ad0', pink: '#f584b8',
    white: '#f4f2ec', black: '#2c2830', gray: '#8e8c96', brown: '#8a5a36', rainbow: null };
const ACC_RAINBOW = ['#ff5a6a', '#ffa24a', '#ffd84a', '#5ed17a', '#4ea8f0', '#b37cf0'];
const ACC_DAILY = 5;
/* the eleven new kinds: name, price */
const ACC_NEW = { cap: ['Baseball cap', 650], beret: ['Beret', 750], buckethat: ['Bucket hat', 700], headband: ['Headband', 350], bunnyears: ['Bunny ears', 500],
    tophat: ['Top hat', 1800], cowboyhat: ['Cowboy hat', 1400], bandana: ['Bandana', 400], heartglasses: ['Heart sunglasses', 900], earmuffs: ['Earmuffs', 600],
    starclips: ['Star clips', 350] };
/* where each kind's own color is in its pictures (main: a hue in degrees, or dark / light for a black or white piece)
   and on its doll piece (m3: the materials' colors), and the colors it comes in besides its own */
const ACC_PAINT = {
    glasses: { main: 'dark', m3: ['#5a3a2c', '#3a2a2a'], colors: 'red,orange,yellow,blue,black,purple,white,gray,pink,rainbow' },
    sunglasses: { main: 'dark', m3: ['#5a3a2c', '#3a2a2a'], colors: 'red,pink,blue,white,yellow,purple,rainbow' },
    heartglasses: { main: 335, m3: ['#f070a8'], colors: 'red,purple,yellow,blue,black,white,rainbow' },
    sunhat: { main: 43, tol: 16, smin: 0.22, m3: ['#f2dca0'], colors: 'white,pink,blue,black,green' },
    beanie: { main: 255, m3: ['#8a72d0'], colors: 'red,orange,yellow,green,blue,pink,white,black,gray,rainbow' },
    flower: { main: 342, m3: ['#f6a8c8'], colors: 'red,orange,yellow,blue,purple,white' },
    headphones: { main: 350, m3: ['#e84a6a'], colors: 'blue,green,yellow,purple,pink,white,black,rainbow' },
    partyhat: { main: 340, m3: ['#f59ab5'], colors: 'red,green,yellow,blue,purple,rainbow' },
    bow: { main: 352, m3: ['#ec4a6c', '#c83a52'], colors: 'pink,orange,yellow,blue,purple,white,black,green' },
    cap: { main: 355, m3: ['#d8404a'], colors: 'orange,yellow,green,blue,purple,pink,white,black,gray' },
    beret: { main: 356, m3: ['#c8303a'], colors: 'black,blue,pink,green,gray,white' },
    buckethat: { main: 45, m3: ['#e8c04a'], colors: 'red,green,blue,pink,white,black' },
    headband: { main: 333, m3: ['#ec70a0'], colors: 'red,yellow,green,blue,purple,white,black' },
    bunnyears: { main: 'light', m3: ['#f6f4f0'], colors: 'black,brown,gray,pink' },
    tophat: { main: 'dark', m3: ['#2a2630'], colors: 'brown,gray,purple,red,white,blue' },
    cowboyhat: { main: 28, tol: 18, m3: ['#a06a3a'], colors: 'black,white,pink,gray,red' },
    bandana: { main: 355, m3: ['#d8404a'], colors: 'blue,black,green,yellow,purple,pink' },
    earmuffs: { main: 333, m3: ['#f590b8'], colors: 'white,red,blue,purple,gray,yellow' },
    starclips: { main: 47, m3: ['#f8d040'], colors: 'pink,blue,purple,red,white,green,rainbow' },
};
/* an accessory's kind and color: glasses@red is glasses, in red */
function accBase(a) { if (!a) return a; const s = String(a), i = s.indexOf('@'); return i > 0 ? s.slice(0, i) : s; }
function accColor(a) { const s = String(a || ''), i = s.indexOf('@'); return i > 0 ? s.slice(i + 1) : null; }
EYE_ACCS.add('heartglasses');

/* ---------------------------------------------------------------- the items */
for (const [id, [name, price]] of Object.entries(ACC_NEW)) {
    ITEMS['acc_' + id] = { name, type: 'acc', price, icon: 'accicon_' + id, wear: id };
    if (!GD.accs.includes(id)) GD.accs.push(id);
}
for (const [id, P] of Object.entries(ACC_PAINT)) {
    const it = ITEMS['acc_' + id];
    if (!it) continue;
    for (const c of P.colors.split(',')) {
        const v = id + '@' + c;
        ITEMS['acc_' + v] = Object.assign({}, it, { name: `${it.name} (${c})`, icon: it.icon + '@' + c, wear: v, base: 'acc_' + id, color: c });
    }
}
/* today's accessories at Clementine's: ACC_DAILY kinds, each in its own color or (three times in four) one of its others */
function accDaily(day) {
    const r = mulberry(hash32(S.seed + ':accs:' + day));
    return shuffled(GD.accs.slice(), r).slice(0, ACC_DAILY).map(b => {
        const P = ACC_PAINT[b], cs = P ? P.colors.split(',') : [];
        const c = cs.length && r() < 0.75 ? cs[Math.floor(r() * cs.length)] : null;
        return 'acc_' + b + (c ? '@' + c : '');
    });
}

/* ---------------------------------------------------------------- repainting a picture */
/* the pixels in an accessory's own color moved to another, keeping their shading (a rainbow runs its hues across) */
function accPaintCanvas(cv, base, color) {
    const P = ACC_PAINT[base];
    if (!P || !color) return;
    const g = cv.getContext('2d'), img = g.getImageData(0, 0, cv.width, cv.height), d = img.data, W = cv.width;
    const hit = (h, s, v) => P.main === 'dark' ? v < 0.5 && s < 0.42 : P.main === 'light' ? v > 0.62 && s < 0.2 : s > (P.smin || 0.18) && v > 0.12 && hueGap(h, P.main) <= (P.tol || 24);
    let n = 0, sv = 0, ss = 0, x0 = 1e9, x1 = -1;
    const hs = new Array(d.length / 4);
    for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 8) continue;
        const c = hsv(d[i] / 255, d[i + 1] / 255, d[i + 2] / 255);
        if (!hit(...c)) continue;
        hs[i / 4] = c; n++; sv += c[2]; ss += c[1];
        const x = (i / 4) % W; x0 = Math.min(x0, x); x1 = Math.max(x1, x);
    }
    if (!n) return;
    const mv = sv / n, ms = ss / n, T = color === 'rainbow' ? null : hsv(...hex01(ACC_HEX[color] || '#888888'));
    for (let k = 0; k < hs.length; k++) {
        const c = hs[k];
        if (!c) continue;
        const x = k % W, [th, ts, tv] = T || [((x - x0) / Math.max(1, x1 - x0 + 1)) * 300, 0.72, 0.96];
        const s = Math.max(0, Math.min(1, ts + (c[1] - ms) * (ts > 0.15 ? 0.7 : 0.15))), v = Math.max(0.04, Math.min(1, tv + (c[2] - mv) * 0.9));
        const o = rgbOf(th, s, v), i = k * 4;
        d[i] = Math.round(o[0] * 255); d[i + 1] = Math.round(o[1] * 255); d[i + 2] = Math.round(o[2] * 255);
    }
    g.putImageData(img, 0, 0);
}
/* a flat picture of an accessory in a color (acc_<kind>@<color>_<dir>, accicon_<kind>@<color>), made the first time it's
   drawn from its own (from colorSprite, 6zz_colors.js) */
function accSprite(name) {
    const m = /^(acc|accicon)_([a-z]+)@([a-z]+)(_[a-z]+)?$/.exec(name);
    if (!m) return undefined;
    const src = m[1] + '_' + m[2] + (m[4] || ''), f = Assets.frames[src], dy = Assets.dyn[src];
    if (!f && !dy) return null;
    const cv = document.createElement('canvas');
    let w, h, ax, ay;
    if (f) { [, , w, h, ax, ay] = f; if (!Assets.atlas) return null; cv.width = w; cv.height = h; cv.getContext('2d').drawImage(Assets.atlas, f[0], f[1], w, h, 0, 0, w, h); }
    else { ({ w, h, ax, ay } = dy); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(dy.c, 0, 0); }
    accPaintCanvas(cv, m[2], m[3]);
    return (Assets.dyn[name] = { c: cv, w, h, ax, ay });
}

/* ---------------------------------------------------------------- the flat pictures of the new kinds */
/* rows of letters over the 16x30 frame a person's accessories use (their feet at 8, 29: a person's head from row 7),
   each letter a color from the kind's palette; side faces right, up is from behind (the same as from the front when not
   given) */
const ACC_ART = {
    cap: { pal: { a: '#7a1a24', b: '#d8404a', c: '#f07078' },
        down: [5, ['......aaaa......', '....aabbccaa....', '...abbbbbbcba...', '..abbbbbbbbbba..', '..aaaaaaaaaaaa..', '..abbbbbbbbbba..', '...aaaaaaaaaa...']],
        side: [5, ['.....aaaa.......', '...aabbbca......', '..abbbbbbba.....', '..abbbbbbbba....', '..aaaaaaaaabbaa.', '..........aaaa..']],
        up: [5, ['......aaaa......', '....aabbbbaa....', '...abbbbbbbba...', '..abbbbbbbbbba..', '..abbbbaabbbba..', '..aaaaa..aaaaa..']] },
    beret: { pal: { a: '#6a141c', b: '#c8303a', c: '#e86068' },
        down: [5, ['........aa......', '....aaaaaaaa....', '..aabbbbbbcbbaa.', '.abbbbbbbbbbbbba', '..aabbbbbbbbbaa.', '....aaaaaaaaa...']] },
    buckethat: { pal: { a: '#7a5a10', b: '#e8c04a', c: '#f8dc80', d: '#c09a28' },
        down: [4, ['.....aaaaaa.....', '....abbbbbba....', '....abcbbbba....', '....abbbbbba....', '...aabbbbbbaa...', '.aabbbbbbbbbbaa.', '.abddddddddddba.', '..aaaaaaaaaaaa..']] },
    headband: { pal: { a: '#9a2a5a', b: '#f070a8', c: '#ffa0c8' },
        down: [7, ['.....aaaaaa.....', '...aabbbbbbaa...', '..abbcbbbbbbba..', '..aa........aa..']],
        side: [7, ['.....aaaa.......', '....abbbba......', '....abbba.......', '....aaa.........']] },
    bunnyears: { pal: { a: '#8a8494', b: '#f8f6fa', d: '#f5a0c0' },
        down: [0, ['...aa......aa...', '..abba....abba..', '..abda....adba..', '..abda....adba..', '..abda....adba..', '..abda....adba..', '...aba....aba...', '...aba....aba...', '...aaaaaaaaaa...']],
        side: [0, ['.....aa.aa......', '....abbabba.....', '....abdabda.....', '....abdabda.....', '....abdabda.....', '....abdabda.....', '.....abaaba.....', '.....abaaba.....', '.....aaaaaa.....']],
        up: [0, ['...aa......aa...', '..abba....abba..', '..abba....abba..', '..abba....abba..', '..abba....abba..', '..abba....abba..', '...aba....aba...', '...aba....aba...', '...aaaaaaaaaa...']] },
    tophat: { pal: { a: '#0c0a10', b: '#2c2830', c: '#4a4452', d: '#d8404a' },
        down: [0, ['....aaaaaaaa....', '....abbbbbca....', '....abbbbbca....', '....abbbbbca....', '....abbbbbca....', '....adddddda....', '..aaabbbbbbaaa..', '..abbbbbbbbbcba.', '..aaaaaaaaaaaaa.']] },
    cowboyhat: { pal: { a: '#4a2a14', b: '#a06a3a', c: '#c89060', d: '#2e2630' },
        down: [3, ['.....aaaaaa.....', '....abbabbba....', '....abbbbbca....', '....abbbbbca....', '....adddddda....', 'aa..abbbbbba..aa', 'abaaabbbbbbaaaba', '.abbbbbbbbbbbba.', '..aaaaaaaaaaaa..']] },
    bandana: { pal: { a: '#7a1a24', b: '#d8404a', c: '#f07078', d: '#f8f2ec' },
        down: [6, ['.....aaaaaa.....', '...aabdbbdbaa...', '..abbbbbbbbbba..', '..abdbbdbbdbba..', '..aaaaaaaaaaaa..']],
        side: [6, ['.....aaaaaa.....', '...abbdbbdba....', '..abbbbbbbbba...', 'aabdbbdbbdbba...', 'abaaaaaaaaaaa...', '.aba............', '..a.............']],
        up: [6, ['.....aaaaaa.....', '...aabdbbdbaa...', '..abbbbbbbbbba..', '..abdbbaabbdba..', '..aaaaabbaaaaa..', '......abba......', '.......aa.......']] },
    heartglasses: { eye: true, pal: { a: '#b8306a', b: '#ff8ac0' },
        down: [14, ['..aa.aa..aa.aa..', '..abbbaaaabbba..', '...aba....aba...', '....a......a....']],
        side: [14, ['..........aa.aa.', '.......aaaabbba.', '...........aba..', '............a...']] },
    earmuffs: { pal: { a: '#9a2a5a', b: '#f590b8', c: '#ffc0d8', h: '#6a6874' },
        down: [7, ['.....hhhhhh.....', '...hh......hh...', '..h..........h..', '..h..........h..', '.h............h.', '.h............h.', 'abba........abba', 'bccb........bccb', 'bbbb........bbbb', 'abba........abba']],
        side: [7, ['.....hhhh.......', '...hh....h......', '..h.......h.....', '..h.......h.....', '..h.......h.....', '.........abba...', '........abccba..', '........abbbba..', '.........abba...']] },
    starclips: { pal: { a: '#9a7010', b: '#f8d040', c: '#fff0a0' },
        down: [8, ['..........a.....', '.........aba....', '........abcba...', '.........aba.a..', '.........a.aba..', '...........abcba', '............aba.', '............a.a.']],
        side: [8, ['....a...........', '...aba..........', '..abcba.........', '...aba.a........', '...a.aba........', '.....abcba......', '......aba.......', '......a.a.......']],
        up: 'mirror' },
};
ASSET_MAKERS.push(() => {
    const draw = (rows, pal, mirror) => {
        const c = document.createElement('canvas');
        c.width = 16; c.height = 30;
        const g = c.getContext('2d');
        const [y0, list] = rows;
        list.forEach((r, j) => { const row = mirror ? r.split('').reverse().join('') : r; for (let i = 0; i < 16; i++) { const col = pal[row[i]]; if (col) { g.fillStyle = col; g.fillRect(i, y0 + j, 1, 1); } } });
        return c;
    };
    for (const [id, A] of Object.entries(ACC_ART)) {
        const views = { down: A.down, side: A.side || A.down, up: A.up === 'mirror' ? A.down : A.up || A.down };
        for (const [dir, rows] of Object.entries(views)) {
            if (A.eye && dir === 'up') continue;
            const name = `acc_${id}_${dir}`;
            if (Assets.frames[name] || Assets.dyn[name]) continue;
            Assets.dyn[name] = { c: draw(rows, A.pal, dir === 'up' && A.up === 'mirror'), w: 16, h: 30, ax: 8, ay: 29 };
        }
        // the icon: the front view, centered in a 16 by 16 square
        const ic = 'accicon_' + id;
        if (Assets.frames[ic] || Assets.dyn[ic]) continue;
        const [y0, list] = A.down, top = y0, hh = list.length, c = document.createElement('canvas');
        c.width = 16; c.height = 16;
        c.getContext('2d').drawImage(draw(A.down, A.pal), 0, top, 16, hh, 0, Math.max(0, Math.round(8 - hh / 2)), 16, hh);
        Assets.dyn[ic] = { c, w: 16, h: 16, ax: 8, ay: 13 };
    }
});

/* ---------------------------------------------------------------- the HD pictures */
HD_ACC.cap = {
    rise: 6,
    draw(s, a) {
        const P = hdAccPen(s, a, 30), side = a.dir === 'side', up = a.dir === 'up';
        const red = hdPal('#6a1420', '#a82a36', '#d8404a', '#ec6a70', '#ff9a98');
        const dome = s.add(red, { layer: 1, R: 6, grad: 0.3 }), brim = s.add(red, { layer: 2, R: 2.5, grad: 0.2 }), btn = s.add(red, { layer: 3, R: 1, bias: 0.1 });
        const ox = side ? -0.8 : 0, arc = [];
        for (let i = 0; i <= 16; i++) { const t = Math.PI + Math.PI * i / 16; arc.push([ox + Math.cos(t) * 12.3, 6.2 + Math.sin(t) * 8.4]); }
        P.poly(dome, arc.concat([[ox + 12.3, 7.4], [ox - 12.3, 7.4]]));
        if (side) P.poly(brim, [[ox + 8, 5.2], [ox + 18, 5.8], [ox + 19, 7.4], [ox + 9, 8]]);
        else if (!up) P.el(brim, 0, 7.6, 9.5, 2.6);
        // (the strap's gap at the back)
        else P.poly(s.add(hdPal('#2a1418', '#3a2228', '#4a2c34', '#5a3a40', '#6a4a50'), { layer: 2, R: 1 }), [[-2.4, 4.6], [2.4, 4.6], [2.6, 7.4], [-2.6, 7.4]]);
        P.el(btn, ox, -2.2, 1.5, 1.1);
        // the panels' seams, gathering at the button
        hdAccTex(s, P, dome, (x, y, d) => { const sq = (y - 7.4) / 9.6, u = (x - ox) / (1 - sq * 0.6 + 0.01); if (Math.abs(((u / 5.5) % 1 + 1) % 1 - 0.5) < 0.07) d(-1); });
    },
};
HD_ACC.beret = {
    rise: 6,
    draw(s, a) {
        const P = hdAccPen(s, a, 30), side = a.dir === 'side';
        const red = hdPal('#5a1018', '#9a2430', '#c8303a', '#e05a62', '#f48a8e');
        const cap = s.add(red, { layer: 1, R: 5, grad: 0.32 }), stem = s.add(red, { layer: 2, R: 1, bias: 0.06 });
        const ox = side ? -1.6 : 1.2, tilt = side ? 0.04 : -0.1, pts = [];
        for (let i = 0; i < 24; i++) { const t = i / 24 * Math.PI * 2, x = Math.cos(t) * 13.2; pts.push([ox + x, 1.6 + Math.sin(t) * 4.4 + x * tilt]); }
        P.poly(cap, pts);
        P.line(stem, ox + 1, -2.6, ox + 1.6, -4.8, 0.7, 0.5);
        hdAccTex(s, P, cap, (x, y, d) => { const t = Math.hypot((x - ox) / 13.2, (y - 1.6) / 4.4); if (y > 3.4 + (x - ox) * tilt && t > 0.7) d(-1); else if (t < 0.45 && y < 0.6) d(1); });
    },
};
HD_ACC.buckethat = {
    rise: 8,
    draw(s, a) {
        const P = hdAccPen(s, a, 32), side = a.dir === 'side';
        const yel = hdPal('#6a4a0a', '#b08818', '#e8c04a', '#f4d878', '#fff0b0');
        const brim = s.add(yel, { layer: 1, R: 3, grad: 0.3 }), crown = s.add(yel, { layer: 2, R: 5, grad: 0.3 }), ox = side ? -0.8 : 0;
        P.el(brim, ox, 6.2, 15.6, 4.2);
        P.poly(crown, [[ox - 8.8, -3], [ox - 7.4, -4.6], [ox + 7.4, -4.6], [ox + 8.8, -3], [ox + 10.4, 6.4], [ox, 7.4], [ox - 10.4, 6.4]]);
        // stitched rings round the brim and the crown
        hdAccTex(s, P, brim, (x, y, d) => { const t = Math.hypot((x - ox) / 15.6, (y - 6.2) / 4.2); if (Math.abs(t - 0.82) < 0.05 && Math.floor(x + 40) % 2 === 0) d(-1); else if (t > 0.92 && y > 7) d(-1); });
        hdAccTex(s, P, crown, (x, y, d) => { if (Math.abs(y - 3.6) < 0.5 && Math.floor(x + 40) % 2 === 0) d(-1); else if (y < -3.6) d(1); });
    },
};
HD_ACC.headband = {
    rise: 1,
    draw(s, a) {
        const P = hdAccPen(s, a, 28), side = a.dir === 'side';
        const pink = hdPal('#7a2448', '#c44a7a', '#ec70a0', '#f698bc', '#ffc4dc'), band = s.add(pink, { layer: 1, R: 2, grad: 0.25 });
        if (side) { const ex = a.person ? 20 - P.cx : -3; P.line(band, ex, 9.6, ex + 0.8, 2.6, 1.5); P.line(band, ex + 0.8, 2.6, ex + 2.6, -0.4, 1.5, 1.4); return; }
        hdAccArc(P, band, 0, 12.4, 12.7, 13.4, 196, 344, 3);
        if (a.dir === 'down') {
            // a little bow over her left eye
            const bow = s.add(pink, { layer: 2, R: 1.5, grad: 0.3, bias: 0.1 }), bx = 7.6, by = 0.8;
            P.poly(bow, [[bx, by], [bx - 3, by - 1.8], [bx - 3.2, by + 1.6]]); P.poly(bow, [[bx, by], [bx + 3, by - 1.8], [bx + 3.2, by + 1.6]]);
            P.el(bow, bx, by, 1, 1.1);
        }
    },
};
HD_ACC.bunnyears = {
    rise: 15,
    draw(s, a) {
        const P = hdAccPen(s, a, 24, 1.2), side = a.dir === 'side', up = a.dir === 'up';
        const white = hdPal('#7a7484', '#c4bfcc', '#e8e6ee', '#f6f4fa', '#ffffff'), pink = hdPal('#a04870', '#e080a8', '#f5a0c0', '#ffc0d8', '#ffe0ec');
        if (!side) hdAccArc(P, s.add(white, { layer: 1, R: 1.5, grad: 0.2 }), 0, 12.4, 12.6, 13.2, 205, 335, 1.8);
        // each ear leans out a little at the top, the inside pink (from behind, all white)
        const ears = side ? [[-1.4, 0.1], [1.2, -0.06]] : [[-4.6, 0.16], [4.6, -0.16]];
        ears.forEach(([x, t], i) => {
            const oval = (rx, ry, cy, n) => { const o = []; for (let k = 0; k < n; k++) { const q = k / n * Math.PI * 2, ey = Math.sin(q) * ry; o.push([x + Math.cos(q) * rx + ey * t, cy + ey]); } return o; };
            P.poly(s.add(white, { layer: 2 + i, R: 3, grad: 0.3 }), oval(2.8, 7.6, -7.2, 20));
            if (!up && !(side && i === 0)) P.poly(s.add(pink, { layer: 4 + i, R: 1.5, grad: 0.2 }), oval(1.3, 5.6, -6.6, 16));
        });
    },
};
HD_ACC.tophat = {
    rise: 15,
    draw(s, a) {
        const P = hdAccPen(s, a, 26), side = a.dir === 'side', ox = side ? -0.6 : 0;
        const blk = hdPal('#0a080c', '#1a1720', '#2c2830', '#46404e', '#625a6c'), red = hdPal('#6a1420', '#a82a36', '#d8404a', '#ec6a70', '#ff9a98');
        const brim = s.add(blk, { layer: 1, R: 2, grad: 0.25 }), crown = s.add(blk, { layer: 2, R: 4, grad: 0.35 }), band = s.add(red, { layer: 3, R: 1.5, grad: 0.15 });
        const c = (x, w) => 1 - ((x - ox) / w) ** 2;
        P.el(brim, ox, 4.6, 12.6, 2.6);
        P.poly(crown, [[ox - 7.6, -11.6], [ox + 7.6, -11.6], [ox + 7.8, 4.2], [ox, 4.8], [ox - 7.8, 4.2]]);
        P.el(crown, ox, -11.6, 7.6, 1.5);
        P.poly(band, hdAccCurve(ox - 7.7, ox + 7.7, x => 1.2 + 0.5 * c(x, 7.7)).concat(hdAccCurve(ox + 7.8, ox - 7.8, x => 3.8 + 0.6 * c(x, 7.8))));
        hdAccTex(s, P, crown, (x, y, d) => { if (y < -11.4 && Math.hypot((x - ox) / 7.6, (y + 11.6) / 1.5) < 0.7) d(1); });
    },
};
HD_ACC.cowboyhat = {
    rise: 9,
    draw(s, a) {
        const P = hdAccPen(s, a, 36), side = a.dir === 'side', ox = side ? -0.8 : 0;
        const brown = hdPal('#3e2210', '#6e4220', '#a06a3a', '#c08a58', '#dcae80'), dk = hdPal('#100c10', '#1e1820', '#2e2630', '#3e3440', '#4e4450');
        const brim = s.add(brown, { layer: 1, R: 3, grad: 0.3 }), crown = s.add(brown, { layer: 2, R: 5, grad: 0.32 }), band = s.add(dk, { layer: 3, R: 1.2, grad: 0.15 });
        // the brim curls up at the sides
        const curl = x => 2.6 * Math.max(0, Math.abs(x - ox) / 16 - 0.55) / 0.45, pts = [];
        for (let i = 0; i < 28; i++) { const t = i / 28 * Math.PI * 2, x = ox + Math.cos(t) * 16.4; pts.push([x, 6 + Math.sin(t) * 3.4 - curl(x) * 1.6]); }
        P.poly(brim, pts);
        P.poly(crown, [[ox - 8.6, 5.6], [ox - 8.4, 0], [ox - 7.4, -3.8], [ox - 4.2, -4.8], [ox, -3.4], [ox + 4.2, -4.8], [ox + 7.4, -3.8], [ox + 8.4, 0], [ox + 8.6, 5.6], [ox, 6.2]]);
        const c = (x, w) => 1 - ((x - ox) / w) ** 2;
        P.poly(band, hdAccCurve(ox - 8.5, ox + 8.5, x => 2.2 + 0.4 * c(x, 8.5)).concat(hdAccCurve(ox + 8.6, ox - 8.6, x => 4.2 + 0.5 * c(x, 8.6))));
        // the crease down the middle of the crown, the brim's rolled edge
        hdAccTex(s, P, crown, (x, y, d) => { if (Math.abs(x - ox) < 0.6 && y < 0) d(-1); });
        hdAccTex(s, P, brim, (x, y, d) => { const t = Math.hypot((x - ox) / 16.4, (y - 6 + curl(x) * 1.6) / 3.4); if (t > 0.86 && y > 6) d(1); });
    },
};
HD_ACC.bandana = {
    rise: 3,
    draw(s, a) {
        const P = hdAccPen(s, a, 30), side = a.dir === 'side', up = a.dir === 'up', ox = side ? -0.6 : 0;
        const red = hdPal('#6a1420', '#a82a36', '#d8404a', '#ec6a70', '#ff9a98'), white = hdPal('#c8c0c0', '#e8e2e0', '#f8f4f2', '#ffffff', '#ffffff');
        const dome = s.add(red, { layer: 1, R: 6, grad: 0.3 }), arc = [];
        for (let i = 0; i <= 16; i++) { const t = Math.PI + Math.PI * i / 16; arc.push([ox + Math.cos(t) * 12.7, 7 + Math.sin(t) * 8.2]); }
        P.poly(dome, arc.concat([[ox + 12.7, 7.6], [ox, 8.4], [ox - 12.7, 7.6]]));
        // white polka dots, in offset rows
        hdAccTex(s, P, dome, (x, y) => {
            const col = Math.floor((x - ox + 40) / 4.2), gx = ((x - ox + 40) / 4.2) % 1, gy = ((y + 40 + (col % 2) * 2.1) / 4.2) % 1;
            if (Math.hypot(gx - 0.5, gy - 0.5) < 0.2) s.recolor(Math.floor(P.X(x)), Math.floor(P.Y(y)), white);
        });
        if (side || up) {
            // the knot at the back, its two ends hanging down
            const kx = up ? 0 : ox - 12, ky = up ? 7 : 6.4, knot = s.add(red, { layer: 2, R: 1.5, grad: 0.3, bias: 0.1 });
            P.line(knot, kx - 0.6, ky, kx - 2.6, ky + 6.4, 1.1, 0.7); P.line(knot, kx + 0.6, ky, kx + 1.6, ky + 7, 1.1, 0.7);
            P.el(knot, kx, ky, 1.8, 1.6);
        }
    },
};
HD_ACC.heartglasses = {
    eye: true,
    draw(s, a) {
        const P = hdAccEyePen(s, a), E = P.E, frame = ['#ff8ac0', '#d8407a', '#9a2050'];
        const lens = (u, v) => (u + v < -0.5 && u + v > -1.1 ? '#ffd0e4' : v < 0 ? '#f080b0' : '#e0609a');
        // a heart: (u² + v² - 1)³ ≤ u²v³, v up
        const heart = (cx, w) => (x, y) => { const u = (x - cx) / w, v = -(y + 0.4) / w, q = u * u + v * v - 1; return q * q * q - u * u * v * v * v <= 0; };
        if (E.side) {
            hdAccRim(s, P, heart(0.4, 2.9), -3.2, -4.4, 4, 3, frame, lens);
            const ear = a.person ? 22.5 : P.cx - 6 * P.k;
            for (let x = Math.floor(ear); x < Math.floor(P.X(-2.8)); x++) s.px(x, Math.floor(P.Y(-1.2)), frame[1]);
            return;
        }
        const half = P.half, w = 3.3;
        for (const sx of [-1, 1]) hdAccRim(s, P, heart(sx * half, w), sx * half - 4, -4.8, sx * half + 4, 3, frame, lens);
        for (let x = -half + 3.4; x < half - 3.4; x += 1) P.px(x + 0.5, -1.6, frame[1]);
    },
};
HD_ACC.earmuffs = {
    rise: 3,
    draw(s, a) {
        const P = hdAccPen(s, a, 32), side = a.dir === 'side';
        const gray = hdPal('#3a3842', '#6a6874', '#8a8894', '#a8a6b2', '#c8c6d0'), pink = hdPal('#9a2a5a', '#d8609a', '#f590b8', '#ffb4d0', '#ffd8e8');
        const fluff = id => hdAccTex(s, P, id, (x, y, d) => { const h = (Math.floor(x * 1.3 + 20) * 7 + Math.floor(y * 1.3 + 20) * 13) % 6; if (h === 0) d(-1); else if (h === 3) d(1); });
        if (side) {
            const band = s.add(gray, { layer: 1, R: 1.5 }), muff = s.add(pink, { layer: 2, R: 3.5, grad: 0.3 }), ex = a.person ? 21.5 - P.cx : -2;
            P.line(band, ex - 0.2, 12, ex + 0.1, 3, 0.9); P.line(band, ex + 0.1, 3, ex + 0.6, -0.4, 0.9, 0.8);
            P.el(muff, ex, 15.6, 3.8, 4.6); fluff(muff);
            return;
        }
        hdAccArc(P, s.add(gray, { layer: 1, R: 1.5, grad: 0.2 }), 0, 13, 12.6, 14.6, 186, 354, 1.6);
        for (const sx of [-1, 1]) { const m = s.add(pink, { layer: 2, R: 3, grad: 0.3 }); P.el(m, sx * 12.8, 15.4, 3.2, 4.4); fluff(m); }
    },
};
HD_ACC.starclips = {
    rise: 0,
    draw(s, a) {
        const P = hdAccPen(s, a, 14, 1.3), d = a.dir, sx = d === 'up' ? -1 : 1;
        const pal = { o: '#9a7010', G: '#f8d040', L: '#fff0a0', D: '#d8a828' };
        const star = ['....o....', '...oLo...', '...oLo...', 'ooooLGooo', '.oLLGGDo.', '..oGGDo..', '.oGGoDDo.', '.oGo.oDo.', 'oo.....oo'];
        const spots = d === 'side' ? [[-8, 1], [-5, -1.8]] : [[sx * 5.6, -0.4], [sx * 9, 2.6]];
        for (const [x, y] of spots) hdAccArt(s, P, star, x - 4.5, y - 4.5, pal);
    },
};
/* each kind in its colors: its own picture, repainted */
for (const [id, P] of Object.entries(ACC_PAINT)) {
    const B = HD_ACC[id];
    if (!B) continue;
    for (const c of P.colors.split(',')) {
        HD_ACC[id + '@' + c] = Object.assign({}, B, {
            draw(s, a) {
                B.draw(s, a);
                const c0 = s.canvas;
                s.canvas = function () { const cv = c0.apply(this, arguments); accPaintCanvas(cv, id, c); return cv; };
            },
        });
    }
}

/* ---------------------------------------------------------------- the new look: the dolls' pieces */
/* (how each sits on the hair, as HAT_FIT's own: 33ka_doll_kit.js) */
Object.assign(HAT_FIT, {
    cap: { cover: [0.32, 0.42, 1.07, 0.8], max: 1.05 }, beret: { cover: [0.6, 0.82, 1.0, 0.34] }, buckethat: { cover: [0.48, 0.76, 0.92, 0.5] },
    headband: { wrap: [0.3, 1.03], over: 1.05, max: 1.5 }, bunnyears: { sit: 1 }, tophat: { cover: [0.72, 1.1, 0.8, 0.55] },
    cowboyhat: { cover: [0.6, 0.88, 0.86, 0.55] }, bandana: { cover: [0.25, 0.32, 1.06, 0.78], max: 1.04 }, earmuffs: { side: [0, 1.06], over: 1.07 },
    starclips: { wrap: [0.65, 0.9], max: 1.5 },
});
/* a doll piece's colors for an accessory in a color: its own color's materials swapped (a rainbow a hue a piece) */
function accTint3d(id) {
    const c = accColor(id), P = c && ACC_PAINT[accBase(id)];
    if (!P) return null;
    return { from: P.m3.map(h => h.toLowerCase()), to: c === 'rainbow' ? 'rainbow' : ACC_HEX[c] };
}
EnvDolls.HATS = {
    cap(head, R, top) {
        const c = this.mat('#d8404a');
        this.piece(head, 'ball', c, 0, top * 0.42, -0.04 * R, 1.07 * R, 0.8 * R, 1.07 * R);
        this.piece(head, 'disc', c, 0, top * 0.38, 0.92 * R, 0.66 * R, 0.05 * R, 0.52 * R, 0.14);
        this.piece(head, 'ball', c, 0, top * 1.2, -0.06 * R, 0.1 * R);
    },
    beret(head, R, top) {
        const c = this.mat('#c8303a');
        this.piece(head, 'ball', c, 0.1 * R, top * 0.84, -0.04 * R, 1.12 * R, 0.34 * R, 1.08 * R, 0, 0, -0.18);
        this.piece(head, 'cone', c, 0.12 * R, top * 1.2, 0, 0.06 * R, 0.16 * R, 0.06 * R);
    },
    buckethat(head, R, top) {
        const c = this.mat('#e8c04a');
        this.piece(head, 'cone', c, 0, top * 0.68, -0.03 * R, 1.42 * R, 0.5 * R, 1.42 * R);
        this.piece(head, 'disc', c, 0, top * 0.88, -0.03 * R, 0.86 * R, 0.5 * R, 0.86 * R);
        this.piece(head, 'ball', c, 0, top * 1.12, -0.03 * R, 0.86 * R, 0.16 * R, 0.86 * R);
    },
    headband(head, R) {
        const c = this.mat('#ec70a0');
        this.piece(head, 'arc', c, 0, 0, 0.12 * R, 1.04 * R, 1.04 * R, 1.6 * R, -0.42);
        for (const s of [-1, 1]) this.piece(head, 'ball', c, 0.42 * R + s * 0.14 * R, 0.88 * R, 0.5 * R, 0.13 * R, 0.09 * R, 0.06 * R, -0.5, 0, s * 0.3);
    },
    bunnyears(head, R, top) {
        const w = this.mat('#f6f4f0'), p = this.mat('#f5a0c0');
        this.piece(head, 'arc', w, 0, 0, 0, 1.03 * R, 1.03 * R, 1.1 * R, -0.12);
        for (const s of [-1, 1]) {
            this.piece(head, 'ball', w, s * 0.38 * R, top * 1.55, -0.04 * R, 0.2 * R, 0.62 * R, 0.1 * R, 0, 0, -s * 0.2);
            this.piece(head, 'ball', p, s * 0.37 * R, top * 1.55, 0.03 * R, 0.1 * R, 0.46 * R, 0.05 * R, 0, 0, -s * 0.2);
        }
    },
    tophat(head, R, top) {
        const k = this.mat('#2a2630');
        this.piece(head, 'disc', k, 0, top * 0.86, 0, 1.12 * R, 0.05 * R, 1.12 * R);
        this.piece(head, 'disc', k, 0, top * 1.32, 0, 0.7 * R, 0.9 * R, 0.7 * R);
        this.piece(head, 'disc', this.mat('#d8404a'), 0, top * 0.98, 0, 0.71 * R, 0.14 * R, 0.71 * R);
    },
    cowboyhat(head, R, top) {
        const c = this.mat('#a06a3a');
        this.piece(head, 'ball', c, 0, top * 0.72, 0, 1.55 * R, 0.08 * R, 1.35 * R);
        for (const s of [-1, 1]) this.piece(head, 'ball', c, s * 1.32 * R, top * 0.8, 0, 0.3 * R, 0.08 * R, 0.9 * R, 0, 0, s * 0.5);
        this.piece(head, 'ball', c, 0, top * 0.98, 0, 0.8 * R, 0.55 * R, 0.76 * R);
        this.piece(head, 'disc', this.mat('#2e2630'), 0, top * 0.82, 0, 0.8 * R, 0.12 * R, 0.76 * R);
    },
    bandana(head, R, top) {
        const c = this.mat('#d8404a'), w = this.mat('#f8f2ec');
        this.piece(head, 'ball', c, 0, top * 0.3, -0.04 * R, 1.06 * R, 0.78 * R, 1.06 * R);
        // white dots over it
        for (const [a, e] of [[0.2, 1.0], [1.4, 0.75], [2.6, 0.95], [-1.0, 0.8], [-2.2, 1.05], [0.8, 0.45], [-0.4, 0.4], [2.0, 0.4]]) {
            const ry = 0.78 * R, rr = 1.06 * R, x = Math.sin(a) * Math.sin(e) * rr * 1.01, z = Math.cos(a) * Math.sin(e) * rr * 1.01 - 0.04 * R, y = top * 0.3 + Math.cos(e) * ry * 1.01;
            this.piece(head, 'ball', w, x, y, z, 0.07 * R);
        }
        // the knot at the back and its two ends
        this.piece(head, 'ball', c, 0, top * 0.32, -1.02 * R, 0.16 * R);
        for (const s of [-1, 1]) this.piece(head, 'cone', c, s * 0.12 * R, top * 0.05, -1.02 * R, 0.1 * R, 0.4 * R, 0.04 * R, 0, 0, Math.PI + s * 0.3);
    },
    earmuffs(head, R) {
        const p = this.mat('#f590b8');
        this.piece(head, 'arc', this.mat('#9a98a4'), 0, -0.05 * R, 0, 1.12 * R, 1.12 * R, 1.4 * R);
        for (const s of [-1, 1]) {
            this.piece(head, 'ball', p, s * 1.08 * R, -0.12 * R, 0, 0.26 * R, 0.36 * R, 0.36 * R);
            for (let k = 0; k < 5; k++) { const q = k / 5 * Math.PI * 2; this.piece(head, 'ball', p, s * 1.14 * R, -0.12 * R + Math.sin(q) * 0.24 * R, Math.cos(q) * 0.24 * R, 0.14 * R); }
        }
    },
    starclips(head, R, top) {
        const c = this.mat('#f8d040');
        for (const [x, y, z, sc] of [[0.72, 0.66, 0.6, 1], [0.92, 0.36, 0.42, 0.85]]) {
            const g = new THREE.Group();
            g.position.set(x * R, top * y, z * R);
            g.lookAt(x * R * 3, top * y, z * R * 3);
            head.add(g);
            for (let k = 0; k < 5; k++) { const q = k / 5 * Math.PI * 2; this.piece(g, 'cone', c, Math.sin(q) * 0.09 * R * sc, Math.cos(q) * 0.09 * R * sc, 0, 0.06 * R * sc, 0.14 * R * sc, 0.03 * R * sc, 0, 0, -q); }
            this.piece(g, 'ball', c, 0, 0, 0, 0.07 * R * sc, 0.07 * R * sc, 0.04 * R * sc);
        }
    },
};
EnvDolls.EYES = {
    heartglasses(head, R, E, eyeY, fz, ex) {
        const c = this.mat('#f070a8', 0.35);
        for (const s of [-1, 1]) {
            const x = s * ex * R, w = (E.r || 0.2) * R * 0.9;
            for (const t of [-1, 1]) this.piece(head, 'ball', c, x + t * w * 0.5, eyeY + w * 0.25, fz + 0.02 * R, w * 0.62, w * 0.62, 0.05 * R);
            this.piece(head, 'cone', c, x, eyeY - w * 0.5, fz + 0.02 * R, w * 0.95, w * 0.95, 0.05 * R, 0, 0, Math.PI);
        }
        this.piece(head, 'box', c, 0, eyeY + 0.04 * R, fz + 0.03 * R, Math.max(0.06 * R, (ex * 2 - (E.r || 0.2) * 2) * R), 0.03 * R, 0.03 * R);
    },
};
