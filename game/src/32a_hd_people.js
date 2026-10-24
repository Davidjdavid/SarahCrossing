/* ---- 32a_hd_people.js ---- */
/* HD people: Sarah, Joe, David and the family, 48x72, standing on row 71 (anchor 24,69). A person is a look (hair
   style and colors, skin, eyes, blush, freckles), clothes (a style and colors: the built-in outfits and everything sewn
   at the machine) and accessories. One skeleton per side and pose (where the head, shoulders, hands, hips, knees and
   feet are), and the clothes and hair are drawn around it, so every outfit and hair style works in every pose. */
const HD_W = 48, HD_H = 72, HD_AX = 24, HD_AY = 69;

/* ---------------------------------------------------------------- clothes */
/* how each style is cut: sleeves (long, short, none, wide), legs (pants, flare, tights) or a skirt (knee, floor, tutu),
   and the details drawn over it */
const HD_STYLE = {
    toppants: { sleeves: 'long', legs: 'pants' },
    knit: { sleeves: 'long', legs: 'pants', knit: 1 },
    cozy: { sleeves: 'long', legs: 'pants', knit: 1, cardigan: 1 },
    dress: { sleeves: 'short', skirt: 'knee', one: 1 },
    sundress: { sleeves: 'none', skirt: 'knee', one: 1, straps: 1 },
    sweaterdress: { sleeves: 'long', skirt: 'knee', one: 1, knit: 1 },
    topskirt: { sleeves: 'short', skirt: 'knee' },
    beach: { sleeves: 'none', skirt: 'knee', straps: 1 },
    overalls: { sleeves: 'short', legs: 'pants', bib: 1 },
    hoodie: { sleeves: 'long', legs: 'pants', hood: 1, pocket: 1 },
    pajamas: { sleeves: 'long', legs: 'pants', buttons: 1, piping: 1 },
    suit: { sleeves: 'long', legs: 'pants', lapels: 1, tie: 1 },
    jacket: { sleeves: 'long', legs: 'pants', lapels: 1, open: 1 },
    muumuu: { sleeves: 'short', skirt: 'floor', one: 1 },
    gown: { sleeves: 'none', skirt: 'floor', one: 1, sash: 1, straps: 1 },
    robe: { sleeves: 'wide', skirt: 'floor', one: 1, cuffs: 1 },
    yukata: { sleeves: 'wide', skirt: 'floor', one: 1, obi: 1, wrap: 1 },
    jumpsuit: { sleeves: 'long', legs: 'flare', one: 1, belt: 1, collar: 1 },
    cape: { sleeves: 'long', legs: 'tights', cape: 1, emblem: 1 },
    tutu: { sleeves: 'none', legs: 'tights', skirt: 'tutu' },
    sailor: { sleeves: 'short', skirt: 'knee', one: 1, sailor: 1 },
    spacesuit: { sleeves: 'long', legs: 'pants', one: 1, belt: 1, space: 1 },
    raincoat: { sleeves: 'long', legs: 'pants', coat: 1, buttons: 1 },
    chef: { sleeves: 'long', legs: 'pants', chef: 1 },
    goth: { sleeves: 'long', skirt: 'knee', one: 1, lace: 1 },
    tennis: { sleeves: 'none', skirt: 'knee', one: 1, collar: 1 },
    party: { sleeves: 'none', skirt: 'knee', one: 1, straps: 1, sparkle: 1 },
};
/* the built-in outfits (gamedata outfits: silhouette, top, its shade, trim, bottom, its shade, shoes, their shade) */
const HD_OUTFIT_STYLE = { crimson: 'knit', sundress: 'sundress', pajamas: 'pajamas', overalls: 'overalls', beach: 'beach', party: 'party',
    yukata: 'yukata', raincoat: 'raincoat', hoodie: 'hoodie', sweaterdress: 'sweaterdress', chef: 'chef', cozy: 'cozy', goth: 'goth', tennis: 'tennis' };
function hdOutfit(id) {
    const o = GD.sarahTpl && GD.sarahTpl.hair && GD.sarahTpl.hair.outfits[id];
    if (!o) return hdOutfit('crimson');
    const [sil, T, U, V, P, , F] = o;
    return { style: HD_OUTFIT_STYLE[id] || (sil === 'dress' ? 'dress' : 'toppants'), top: T, trim: V, bottom: P || T, shoes: F };
}
/* a design sewn at the machine */
function hdDesign(d) {
    const one = typeof SEW_ONE_PIECE !== 'undefined' && SEW_ONE_PIECE.has(d.style);
    return { style: HD_STYLE[d.style] ? d.style : 'dress', top: d.top[0], trim: d.trim[0], bottom: (one ? d.top : d.bottom)[0], shoes: d.shoes[0],
        pat: d.pat, patCol: d.patCol && d.patCol[0], patWhere: d.patWhere, print: d.print };
}

/* ---------------------------------------------------------------- who */
/* the island's people besides Sarah, as looks and clothes (their 16x24 sprites, three times over) */
const HD_FOLKS = {
    joe: { look: { hair: 'joecut', hairCol: '#3e2418', tipCol: null, skin: '#f1c7a8', eyes: '#2a1a14', blush: false },
        clothes: { style: 'jacket', top: '#c9962b', trim: '#efe6d2', bottom: '#5a3b2e', shoes: '#3a2a22' } },
    david: { look: { hair: 'davidcut', hairCol: '#d8602a', tipCol: null, skin: '#fbd9c6', eyes: '#3f6fb8', blush: false, beard: '#c0502a' },
        clothes: { style: 'jacket', top: '#e86aa8', trim: '#ffd1e7', bottom: '#f4f1ea', shoes: '#f4f1ea', skates: 1 } },
    james: { look: { hair: 'jamescut', hairCol: '#7a5030', tipCol: null, skin: '#fbd9c6', eyes: '#4a2c1c', blush: false },
        clothes: { style: 'jacket', top: '#4f9a62', trim: '#efe6d2', bottom: '#cdb98e', shoes: '#efeae0' }, eyes: 'glasses' },
    john: { look: { hair: 'johncut', hairCol: '#241a1c', tipCol: null, skin: '#fbd9c6', eyes: '#2a1a14', blush: false },
        clothes: { style: 'suit', top: '#253463', trim: '#c0303a', bottom: '#253463', shoes: '#2b2b33' }, eyes: 'glasses' },
    elizabeth: { look: { hair: 'sleek', hairCol: '#5a3622', tipCol: null, skin: '#fbd9c6', eyes: '#4a2c1c', blush: true },
        clothes: { style: 'toppants', top: '#4a78c8', trim: '#9ab8e8', bottom: '#2c3e66', shoes: '#efeae0' }, eyes: 'glasses' },
};
/* Sarah as she is right now */
function hdSarahSpec() {
    const L = look(), id = S.player.outfit || 'crimson', d = S.designs && S.designs[id];
    return { look: L, clothes: d ? hdDesign(d) : hdOutfit(id), eyes: S.player.eyes || null, acc: S.player.acc || null };
}
function hdFolkSpec(who, acc) {
    const f = HD_FOLKS[who];
    if (!f) return null;
    const eye = acc && EYE_ACCS.has(acc);
    return { look: Object.assign({}, LOOK_DEFAULT, f.look), clothes: f.clothes, eyes: eye ? acc : f.eyes || null, acc: eye ? null : acc || null };
}

/* ---------------------------------------------------------------- the skeleton */
/* the animations, and how many frames each has: walking and running cycles, and standing (breathing) */
const HD_ANIM = { idle: 4, walk: 8, run: 6 };
const HD_JOINTS = ['shL', 'elL', 'hdL', 'shR', 'elR', 'hdR', 'hpL', 'knL', 'anL', 'ftL', 'hpR', 'knR', 'anR', 'ftR'];
/* where everything is for a side and a pose. dir: down, dside (three-quarters front), side, uside (three-quarters back), up;
   the side views face right (they're flipped for left). body: idle, walk, run (with a phase), or one of the poses
   (cheer, left, right, pick, sit, hug); the old frame names' stand/walkA/walkB are idle 0 / walk 2 / walk 6 */
function hdPose(dir, body, ph) {
    if (body === 'stand') { body = 'idle'; ph = ph || 0; }
    if (body === 'walkA' || body === 'walkB') { ph = body === 'walkA' ? 2 : 6; body = 'walk'; }
    if (dir === 'dside' || dir === 'uside') {
        // three-quarters: halfway between the front (or back) and the side; the near side is L, as side-on
        const a = hdPose(dir === 'dside' ? 'down' : 'up', body, ph), b = hdPose('side', body, ph), J = Object.assign({}, a);
        const near = dir === 'dside' ? a : hdSwapLR(a);
        for (const k of HD_JOINTS) J[k] = [near[k][0] * 0.5 + b[k][0] * 0.5, near[k][1] * 0.5 + b[k][1] * 0.5];
        J.dir = dir; J.fx = 24; J.dy = Math.round(a.dy * 0.5 + b.dy * 0.5); J.sway = b.sway; J.bounce = b.bounce; J.lean = b.lean * 0.6;
        return J;
    }
    const J = { dir, body, ph: ph || 0, fx: 24, fy: 20.5, top: 30, waist: 46, hip: 49, dy: 0, sway: 0, bounce: 0, lean: 0,
        shL: [16, 31.5], elL: [13, 40], hdL: [14, 48.5], shR: [32, 31.5], elR: [35, 40], hdR: [34, 48.5],
        hpL: [20, 49], knL: [20, 57.5], anL: [19.8, 66], ftL: [19.5, 71], hpR: [28, 49], knR: [28, 57.5], anR: [28.2, 66], ftR: [28.5, 71] };
    const walk = body === 'walk', run = body === 'run', t = (J.ph / (HD_ANIM[body] || 1)) * Math.PI * 2, sn = Math.sin(t), cs = Math.cos(t);
    if (body === 'idle') {
        // breathing: shoulders and head rise a pixel and settle; the hair stirs
        J.dy = [0, 0, -1, -1][J.ph % 4]; J.sway = [0, 0.4, 0.7, 0.3][J.ph % 4];
        J.hdL[1] += J.dy * -0.5; J.hdR[1] += J.dy * -0.5;
    }
    if (dir === 'side') {
        Object.assign(J, { fx: 25, shL: [24.5, 32], elL: [24.5, 40], hdL: [25, 48], shR: [24, 32], elR: [24, 40], hdR: [24.5, 47.5],
            hpL: [24.5, 49], knL: [24.8, 57.5], anL: [24.8, 66], ftL: [25, 71], hpR: [23.2, 49], knR: [23, 57.5], anR: [22.8, 66], ftR: [23, 71] });
        if (body === 'idle') { J.hdL[1] -= J.dy * 0.5; J.hdR[1] -= J.dy * 0.5; }
        // L is the near side (towards us), R the far side
        if (walk || run) {
            const A = run ? 7.5 : 5.6, lift = run ? 4.5 : 2.6;
            for (const [k, ph0, hx] of [['L', 0, 24.8], ['R', Math.PI, 23]]) {
                const f = Math.sin(t + ph0), up = Math.max(0, Math.cos(t + ph0)) * lift;
                J['an' + k] = [hx + A * f + up * 0.3, 65.6 - up]; J['ft' + k] = [hx + A * f * 1.05 + up * 0.4, 71 - up];
                J['kn' + k] = [hx + A * 0.46 * f + up * (run ? 1.1 : 0.7), 57.5 - up * 0.45];
            }
            if (run) {
                // leaning in, arms bent and pumping
                J.lean = 1.5;
                for (const [k, sg] of [['L', -1], ['R', 1]]) { const sh = J['sh' + k]; sh[0] += 1.2; J['el' + k] = [sh[0] + 3.4 * sg * sn, sh[1] + 6.5]; J['hd' + k] = [J['el' + k][0] + 3, J['el' + k][1] - 2.5 + Math.abs(sn) * 1.5]; }
                J.dy = Math.abs(sn) > 0.7 ? 1 : -1; J.bounce = J.dy < 0 ? 1 : 0; J.sway = -0.9;
            } else {
                J.elL = [24.5 - 1.6 * sn, 40]; J.hdL = [25 - 4.4 * sn, 47 + Math.abs(sn) * 0.5]; J.elR = [24 + 1.6 * sn, 40]; J.hdR = [24.5 + 4.4 * sn, 47 + Math.abs(sn) * 0.5];
                J.dy = Math.abs(sn) > 0.5 ? 1 : 0; J.bounce = J.dy ? 0 : 1; J.sway = -0.5 - 0.3 * Math.abs(cs);
            }
        }
        if (body === 'hug') { J.elL = [28.5, 37.5]; J.hdL = [35, 37]; J.elR = [28, 37]; J.hdR = [34.5, 36]; }
        return J;
    }
    if (walk || run) {
        // front or back: the lifting foot rises (a shorter leg, a raised shoe), the other arm swings forward
        const lift = run ? 4.5 : 3, lR = Math.max(0, sn) * lift, lL = Math.max(0, -sn) * lift;
        J.anR[1] -= lR; J.ftR[1] -= lR; J.knR[1] -= lR * 0.5; J.knR[0] += lR * 0.25;
        J.anL[1] -= lL; J.ftL[1] -= lL; J.knL[1] -= lL * 0.5; J.knL[0] -= lL * 0.25;
        if (run) {
            for (const [k, sg] of [['L', -1], ['R', 1]]) { const sh = J['sh' + k]; J['el' + k] = [sh[0] + sg * 3.2, sh[1] + 6]; J['hd' + k] = [sh[0] + sg * 1.2, sh[1] + 9.5 - (k === 'L' ? lR : lL) * 0.8]; }
            J.dy = Math.abs(sn) > 0.7 ? 1 : -1; J.bounce = J.dy < 0 ? 1 : 0;
        } else {
            J.hdL[1] -= lR * 0.6; J.elL[1] -= lR * 0.3; J.hdR[1] -= lL * 0.6; J.elR[1] -= lL * 0.3;
            J.hdL[0] -= lL * 0.3; J.hdR[0] += lR * 0.3;
            J.dy = Math.abs(sn) > 0.5 ? 1 : 0; J.bounce = J.dy ? 0 : 1;
        }
        J.sway = 0.5 * sn;
    }
    if (body === 'cheer') { J.elL = [10.5, 26.5]; J.hdL = [8, 19.5]; J.elR = [37.5, 26.5]; J.hdR = [40, 19.5]; }
    if (body === 'stretch') {
        // a big stretch after standing about: arms up overhead (ph 0 to 2), up on her toes at the top
        const k = Math.min(2, J.ph) / 2;
        // (a V, out past the hair: arms straight up would go behind it)
        J.elL = [13 - k * 4.5, 40 - k * 19]; J.hdL = [14 - k * 8.5, 48.5 - k * 40]; J.elR = [35 + k * 4.5, 40 - k * 19]; J.hdR = [34 + k * 8.5, 48.5 - k * 40];
        if (k === 1) { J.dy = -1; J.anL[1] -= 1; J.anR[1] -= 1; J.ftL[1] -= 0.5; J.ftR[1] -= 0.5; }
        J.sway = k * 0.5;
    }
    if (body === 'left' || body === 'right') {
        // a dance step: arms out, one leg kicked to the side
        const L = body === 'left';
        J.elL = [9.5, 31]; J.hdL = [5, 29 + (L ? -3 : 1)]; J.elR = [38.5, 31]; J.hdR = [43, 29 + (L ? 1 : -3)];
        if (L) { J.knL = [16.5, 56.5]; J.anL = [13, 63]; J.ftL = [12, 69.5]; } else { J.knR = [31.5, 56.5]; J.anR = [35, 63]; J.ftR = [36, 69.5]; }
        J.sway = L ? -0.8 : 0.8;
    }
    if (body === 'pick') {
        // crouching to pick something up: everything lower, knees out, hands down in front
        Object.assign(J, { fy: 27.5, top: 37, waist: 50.5, hip: 53, shL: [16, 38.5], elL: [15, 46], hdL: [19.5, 56], shR: [32, 38.5], elR: [33, 46], hdR: [28.5, 56],
            hpL: [20, 53], knL: [17, 60], anL: [19, 66.5], ftL: [19, 71], hpR: [28, 53], knR: [31, 60], anR: [29, 66.5], ftR: [29, 71] });
    }
    if (body === 'sit') {
        // sitting on a bench, seen from the front: knees towards us, hands on the lap
        Object.assign(J, { fy: 23.5, top: 33, waist: 49, hip: 52, shL: [16, 34.5], elL: [14, 43], hdL: [19, 52.5], shR: [32, 34.5], elR: [34, 43], hdR: [29, 52.5],
            hpL: [20, 53], knL: [19.5, 58.5], anL: [19.5, 65.5], ftL: [19.5, 71], hpR: [28, 53], knR: [28.5, 58.5], anR: [28.5, 65.5], ftR: [28.5, 71], sitting: 1 });
    }
    return J;
}
/* the same pose with left and right swapped (the back view's near side is on the other side) */
function hdSwapLR(J) {
    const o = Object.assign({}, J);
    for (const k of HD_JOINTS) { const m = k.endsWith('L') ? k.slice(0, -1) + 'R' : k.slice(0, -1) + 'L'; o[k] = [48 - J[m][0], J[m][1]]; }
    return o;
}
/* the 3/4 views' squeeze: the head turns more than the body */
function hdWarps(dir) {
    if (dir === 'dside') return { head: { c: 24, kl: 1, kr: 0.7, sh: 2 }, body: { c: 24, kl: 1, kr: 0.82, sh: 1 } };
    if (dir === 'uside') return { head: { c: 24, kl: 0.7, kr: 1, sh: -1.5 }, body: { c: 24, kl: 0.82, kr: 1, sh: -0.5 } };
    return { head: null, body: null };
}

/* ---------------------------------------------------------------- drawing a person */
const HD_EYEDK = '#2b1b19', HD_EYEL = '#5a3a30';
function hdPersonSprite(spec, dir, body, face, o) {
    o = o || {};
    const s = new HDSprite(HD_W, HD_H), J = hdPose(dir, body, o.ph), L = spec.look, C = spec.clothes;
    const st = HD_STYLE[C.style] || HD_STYLE.toppants, side = dir === 'side', up = dir === 'up' || dir === 'uside';
    const turned = side || dir === 'dside' || dir === 'uside', W = hdWarps(dir);       // turned: the far arm and leg go behind
    const skin = hdSkin(L.skin), hands = [skin[1], skin[1], skin[2], skin[3], skin[4]], top = hdRamp(C.top), bot = hdRamp(C.bottom || C.top), trim = hdRamp(C.trim || C.top), shoe = hdRamp(C.shoes || '#3a2a22');
    const g = hdHeadGeo(J, L);
    const hair = HD_HAIR[L.hair] || HD_HAIR.waves;
    const fabric = [];                     // parts that take the pattern
    const by = J.dy;
    // hair that falls behind the body
    s.warp = W.head;
    if (hair && hair.back) hair.back(s, g);
    s.warp = W.body;
    if (st.cape && !up) hdCape(s, J, trim, side);
    // legs and feet (the far leg first, so the near one overlaps it when turned)
    const legMat = st.skirt && st.legs !== 'tights' ? skin : st.legs === 'tights' ? (C.style === 'tutu' ? hdRamp('#f4e6ea') : bot) : bot;
    for (const k of turned ? ['R', 'L'] : ['L', 'R']) {
        const far = turned && k === 'R';
        const leg = s.add(legMat, { layer: far ? 0 : 1, R: 3.5, grad: 0.1, bias: far ? -0.12 : 0 });
        const hp = J['hp' + k], kn = J['kn' + k], an = J['an' + k];
        const wide = st.legs === 'flare' ? 1.2 : 0;
        s.line(leg, hp[0], hp[1], kn[0], kn[1], 3.8, 3.5);
        s.line(leg, kn[0], kn[1], an[0], an[1], 3.5, 3.2 + wide);
        if (!st.skirt && !J.sitting) fabric.push(leg);
        if (st.skirt === 'floor' && !J.sitting) continue;
        hdShoe(s, J, k, C.skates ? hdRamp('#f4f1ea') : shoe, far, side, C.skates);
    }
    if (st.legs === 'pants' || st.legs === 'flare') hdPantsSeams(s, J, side);
    const sleeveLong = st.sleeves === 'long' || st.sleeves === 'wide';
    const arm = (k, far) => {
        const sh = J['sh' + k], el = J['el' + k], hd = J['hd' + k];
        const id = s.add(sleeveLong ? top : skin, { layer: far ? 0 : 4, R: 3, grad: 0.15, bias: far ? -0.14 : -0.06 });
        const sl = st.sleeves === 'short' ? s.add(top, { layer: far ? 0 : 4, R: 3, grad: 0.15, bias: far ? -0.14 : -0.04 }) : null;
        s.dy = by;
        const w = st.sleeves === 'wide' ? 1.1 : 0;
        s.line(id, sh[0], sh[1], el[0], el[1], 2.4 + w * 0.6, 2.2 + w);
        s.line(id, el[0], el[1], hd[0], hd[1] - 1.6, 2.2 + w, 2 + w * 1.4);
        if (sl != null) { s.line(sl, sh[0], sh[1], (sh[0] + el[0]) / 2, (sh[1] + el[1]) / 2, 2.6, 2.5); fabric.push(sl); }
        if (sleeveLong) fabric.push(id);
        const hand = s.add(hands, { layer: far ? 0 : 5, R: 2, bias: far ? -0.1 : 0 });
        s.ellipse(hand, hd[0], hd[1], 2.2, 2.3);
        if (st.cuffs || st.wrap) { const cuff = s.add(trim, { layer: far ? 0 : 4, R: 2 }); s.line(cuff, el[0] + (hd[0] - el[0]) * 0.72, el[1] + (hd[1] - el[1]) * 0.72, el[0] + (hd[0] - el[0]) * 0.82, el[1] + (hd[1] - el[1]) * 0.82, 2.4 + w, 2.6 + w); }
        s.dy = 0;
    };
    // turned, the far arm swings behind the body (side-on it's hidden while it hangs straight)
    if (turned && (!side || Math.abs(J.hdR[0] - J.shR[0]) >= 2.5 || body === 'hug')) arm('R', true);
    // the body
    const torso = s.add(top, { layer: 3, R: 6, grad: 0.22 });
    fabric.push(torso);
    const neck = s.add(skin, { layer: 2, R: 3, bias: -0.08 });
    hdTorso(s, J, torso, side, by);
    if (st.skirt) {
        const sk = s.add(st.one ? top : bot, { layer: 3, R: 5, grad: 0.16 });
        fabric.push(sk);
        hdSkirt(s, J, sk, st.skirt, side);
    }
    if (st.coat || st.chef) {
        // a coat or chef's jacket that comes down over the hips
        const coat = s.add(top, { layer: 3, R: 5, grad: 0.18 });
        fabric.push(coat);
        if (side) s.poly(coat, [[19.5, J.waist - 2 + by], [29.6, J.waist - 2 + by], [30.5, J.hip + 6 + by], [18.8, J.hip + 6 + by]]);
        else s.poly(coat, [[16, J.waist - 2 + by], [32, J.waist - 2 + by], [33, J.hip + 6 + by], [15, J.hip + 6 + by]]);
    }
    // the neck (g.fy already moves with the body)
    if (side) s.poly(neck, [[21.8 + J.lean, g.fy + 4.5], [26.6 + J.lean, g.fy + 4.5], [26.6 + J.lean * 0.6, J.top + by + 2], [21.8 + J.lean * 0.6, J.top + by + 2]]);
    else s.poly(neck, [[21, g.fy + 4.5], [27, g.fy + 4.5], [27, J.top + by + 1], [25, J.top + by + 3], [23, J.top + by + 3], [21, J.top + by + 1]]);
    // arms (the far one, when turned, was drawn behind the body)
    for (const k of turned ? ['L'] : ['L', 'R']) arm(k, false);
    // the clothes' details (under the hair that falls in front, and under the chin)
    s.dy = by;
    hdClothesDetail(s, J, st, C, { top, bot, trim, skin, side, up });
    if (C.print && (dir === 'down' || dir === 'dside') && !J.sitting) { s.dy = 0; hdPrint(s, J, C.print); }
    s.dy = 0;
    // the head, the hair over it, the face
    s.warp = W.head;
    hdHead(s, g, skin, face, o);
    if (hair && hair.front) hair.front(s, g);
    // two-tone hair: the ends in the tip color
    if (L.tipCol && L.tipCol !== L.hairCol) hdTips(s, g, hdRamp(L.tipCol));
    if (C.pat && C.pat !== 'none' && C.patCol) hdPattern(s, fabric, C, st, J);
    if (!up) hdFace(s, g, L, face, o);
    s.warp = null;
    return s;
}

/* the head's shape and where the face goes */
function hdHeadGeo(J, L) {
    const side = J.dir === 'side', up = J.dir === 'up' || J.dir === 'uside', fx = J.fx + (side ? J.lean : 0), fy = J.fy + J.dy;
    // hair and faces are drawn from the front, the side or the back; the 3/4 views squeeze a front or back drawing
    return { J, dir: side ? 'side' : up ? 'up' : 'down', view: J.dir, body: J.body, fx, fy, side, up, H: hdRamp(L.hairCol), look: L,
        sway: J.sway || 0, bounce: J.bounce || 0, top: fy - 16, crownY: fy - 11, chin: fy + 8, left: fx - 9.5, right: fx + 9.5 };
}
function hdHead(s, g, skin, face, o) {
    const fx = g.fx, fy = g.fy;
    const head = s.add(skin, g.side ? { layer: 5, R: 7, grad: 0.14, flat: 1, bias: 0.02 } : { layer: 5, R: 7, grad: 0.12 });
    if (g.side) {
        const odx = s.dx; s.dx += fx - 25;                // drawn for a head at x 25 (it leans forward when running)
        const ear = s.add(skin, { layer: 5, R: 2, bias: -0.04 });
        s.poly(head, [[16, fy - 8.5], [30, fy - 9], [33, fy - 6.5], [33.6, fy - 3], [35, fy + 0.5], [33.6, fy + 2], [33.4, fy + 4], [32, fy + 6.5], [29, fy + 8.3], [25, fy + 8.1], [21, fy + 6], [17.5, fy + 2.5], [16, fy - 2.5]]);
        s.ellipse(ear, 21.5, fy - 0.5, 1.8, 2.5);
        s.mod(21.5, fy - 0.5, -1);
        s.dx = odx;
        return;
    }
    const ear = s.add(skin, { layer: 4, R: 2 });
    s.ellipse(ear, fx - 9.4, fy - 1, 1.6, 2.3); s.ellipse(ear, fx + 9.4, fy - 1, 1.6, 2.3);
    s.poly(head, [[fx - 9, fy - 7.5], [fx + 9, fy - 7.5], [fx + 9.5, fy - 2.5], [fx + 8.5, fy + 2.5], [fx + 5, fy + 6.5], [fx + 2, fy + 8], [fx - 2, fy + 8], [fx - 5, fy + 6.5], [fx - 8.5, fy + 2.5], [fx - 9.5, fy - 2.5]]);
}
/* eyes, brows, mouth, cheeks */
function hdFace(s, g, L, face, o) {
    const fx = g.fx, fy = g.fy, happy = face === 'happy', blink = o.blink && !happy;
    const iris = L.eyes || '#6c5236', skinR = hdSkin(L.skin), lip = skinR[0];
    const deep = hdRgb(L.skin).reduce((a, b) => a + b, 0) < 420;
    const blushC = L.blush === false ? null : hdFromHsl(hdHsl(hdRgb(deep ? '#b0404e' : '#f08a8a'))[0], 0.6, deep ? 0.42 : 0.74);
    const mouth = '#9b4b47', mouthIn = '#7a3238';
    if (g.side) {
        const ex = 30, odx = s.dx, lk = Math.max(0, o.look || 0) * 0.6;
        s.dx += fx - 25;
        if (blink || happy) { s.px(ex - 1, fy - 1, HD_EYEDK); s.px(ex, fy - 1.5, HD_EYEDK); s.px(ex + 1, fy - 1, HD_EYEDK); }
        else { s.px(ex, fy - 3, HD_EYEDK); s.px(ex + 1, fy - 3, HD_EYEDK); s.px(ex + lk, fy - 2, HD_EYEDK); s.px(ex + 1 + lk, fy - 2, iris); s.px(ex + lk, fy - 1, iris); s.px(ex + 1, fy - 1, HD_EYEL); s.px(ex - 1, fy - 3, HD_EYEL); }
        s.px(ex - 1, fy - 5, g.H[1]); s.px(ex, fy - 5, g.H[1]); s.px(ex + 1, fy - 5.5, g.H[1]);
        s.px(34, fy + 1, skinR[1]);
        if (happy) { s.px(31, fy + 4, mouth); s.px(32, fy + 4, mouth); s.px(33, fy + 3.5, mouth); s.px(32, fy + 5, mouthIn); }
        else { s.px(31.5, fy + 4.5, mouth); s.px(32.5, fy + 4.5, mouth); }
        if (blushC) { s.px(28, fy + 2, blushC); s.px(29, fy + 2, blushC); }
        if (L.freckles) for (const [x, y] of [[30, 1], [32, 0.5], [31, 2]]) s.px(x, fy + y, skinR[0]);
        if (L.beard) hdBeard(s, g, L.beard);
        s.dx = odx;
        return;
    }
    const lx = fx - 6, rx = fx + 4, lk = o.look || 0;          // left edge of each eye (3 wide); a glance moves the irises
    if (happy) {
        // smiling eyes: little upside-down arcs
        for (const x0 of [lx, rx]) { s.px(x0, fy - 1, HD_EYEDK); s.px(x0 + 1, fy - 2, HD_EYEDK); s.px(x0 + 2, fy - 1, HD_EYEDK); }
    } else if (blink) {
        for (const x0 of [lx, rx]) for (let i = 0; i < 3; i++) s.px(x0 + i, fy, HD_EYEDK);
    } else {
        for (const x0 of [lx, rx]) {
            for (let i = 0; i < 3; i++) s.px(x0 + i, fy - 2.5, HD_EYEDK);
            s.px(x0 + 0.5 + lk, fy - 1.5, HD_EYEDK); s.px(x0 + 1.5 + lk, fy - 1.5, iris); s.px(x0 + 0.5 + lk, fy - 0.5, iris); s.px(x0 + 1.5 + lk, fy - 0.5, HD_EYEL);
        }
        s.px(lx - 1, fy - 2.5, HD_EYEL); s.px(rx + 3, fy - 2.5, HD_EYEL);           // lashes at the outer corners
        s.px(lx + 0.5 + lk, fy - 1.5, '#fbf4ea');                                    // a glint
        s.px(rx + 0.5 + lk, fy - 1.5, '#fbf4ea');
    }
    // brows
    for (const x of [lx, lx + 1, lx + 2]) s.px(x, fy - 5, g.H[2]); s.px(lx + 3, fy - 5, g.H[3]);
    for (const x of [rx, rx + 1, rx + 2]) s.px(x, fy - 5, g.H[2]); s.px(rx - 1, fy - 5, g.H[3]);
    // nose and mouth
    s.px(fx, fy + 2.5, skinR[1]);
    if (happy) {
        for (const x of [fx - 2, fx - 1, fx, fx + 1]) s.px(x, fy + 4.5, mouth);
        s.px(fx - 3, fy + 3.5, mouth); s.px(fx + 2, fy + 3.5, mouth);
        s.px(fx - 1, fy + 5.5, mouthIn); s.px(fx, fy + 5.5, mouthIn);
    } else {
        for (const x of [fx - 2, fx - 1, fx, fx + 1]) s.px(x, fy + 4.5, mouth);
        s.px(fx - 1, fy + 5.5, lip); s.px(fx, fy + 5.5, lip);
        s.px(fx - 3, fy + 3.5, skinR[1]); s.px(fx + 2, fy + 3.5, skinR[1]);
    }
    if (blushC) { s.px(lx - 0.5, fy + 2.5, blushC); s.px(lx + 0.5, fy + 2.5, blushC); s.px(rx + 1.5, fy + 2.5, blushC); s.px(rx + 2.5, fy + 2.5, blushC); }
    if (L.freckles) for (const [x, y] of [[-5, 2], [-3.5, 3], [3, 2], [4.5, 3], [-4, 1.5], [4, 1.5]]) s.px(fx + x, fy + y, skinR[0]);
    if (L.beard) hdBeard(s, g, L.beard);
}
/* David's ginger beard and mustache */
function hdBeard(s, g, col) {
    const b = s.add(hdRamp(col), { layer: 6, R: 2, grad: 0.2 }), fx = g.fx, fy = g.fy;
    if (g.side) { s.poly(b, [[22, fy + 1], [25, fy + 3], [30, fy + 3.5], [33.5, fy + 3.5], [33.5, fy + 5.5], [31.5, fy + 8], [27, fy + 9], [23, fy + 6.5]]); s.px(32.5, fy + 4.6, '#7a3238'); return; }
    s.poly(b, [[fx - 9, fy + 0.5], [fx - 6.5, fy + 3], [fx - 3.5, fy + 3.2], [fx + 3.5, fy + 3.2], [fx + 6.5, fy + 3], [fx + 9, fy + 0.5], [fx + 8, fy + 4.5], [fx + 5, fy + 8], [fx + 2, fy + 9.2], [fx - 2, fy + 9.2], [fx - 5, fy + 8], [fx - 8, fy + 4.5]]);
    for (const x of [fx - 2, fx - 1, fx, fx + 1]) s.px(x, fy + 5.2, '#7a3238');
    s.px(fx - 1, fy + 6.2, '#e8e2d6'); s.px(fx, fy + 6.2, '#e8e2d6');
}

/* the torso: shoulders to hips */
function hdTorso(s, J, id, side, by) {
    const t = J.top + by, b = J.hip + by, m = (t + b) / 2;
    const l = J.lean || 0;
    if (side) s.poly(id, [[21 + l, t], [27 + l, t], [29.5 + l, t + 2.5], [30 + l * 0.6, t + 9], [29.2, b - 3], [29.6, b], [19.4, b], [19, b - 3], [19 + l * 0.6, t + 9], [19.6 + l, t + 2.5]]);
    else s.poly(id, [[17, t], [31, t], [33, t + 2], [32, m], [31, b - 3], [32, b], [16, b], [17, b - 3], [16, m], [15, t + 2]]);
}
/* skirts: knee length, to the floor, or a tutu */
function hdSkirt(s, J, id, kind, side) {
    const w = J.waist + J.dy - 1, sit = J.sitting;
    if (kind === 'tutu') {
        const y = J.hip + J.dy;
        if (side) { s.ellipse(id, 24.5, y, 10, 3.2); return; }
        s.ellipse(id, 24, y, 14.5, 3.6);
        return;
    }
    const hem = sit ? (kind === 'floor' ? 66 : 58) : kind === 'floor' ? 68.5 : 59 + J.dy;
    if (side) {
        const sw = J.body === 'walkA' || J.body === 'walkB' ? 2.5 : 0;
        s.poly(id, [[19.3, w], [29.6, w], [31.5 + sw, hem], [30.5 + sw, hem + 1.5], [17.5 - sw, hem + 1.5], [16.5 - sw, hem]]);
        return;
    }
    const fl = kind === 'floor' ? 4 : 3.2, sway = J.body === 'left' ? -1.5 : J.body === 'right' ? 1.5 : 0;
    s.poly(id, [[16, w], [32, w], [32 + fl + sway, hem], [31 + fl + sway, hem + 1.2], [17 - fl + sway, hem + 1.2], [16 - fl + sway, hem]]);
}
/* a shoe at the end of a leg; side-on it points forward */
function hdShoe(s, J, k, mat, far, side, skates) {
    const an = J['an' + k], ft = J['ft' + k], id = s.add(mat, { layer: far ? 0 : 1, R: 3, bias: far ? -0.12 : 0 });
    const y1 = ft[1], y0 = Math.min(an[1] - 0.5, y1 - 5);
    if (side) {
        const lifted = y1 < 70;
        s.poly(id, [[ft[0] - 3.4, y0], [ft[0] + 2.2, y0], [ft[0] + 3.2, y1 - 3.5], [ft[0] + 6.2, y1 - 2], [ft[0] + 6.4, y1], [ft[0] - 3.6, y1]]);
        if (lifted) s.mod(ft[0], y1, -1);
    } else s.poly(id, [[ft[0] - 3.5, y0], [ft[0] + 3.5, y0], [ft[0] + 3.9, y1 - 2], [ft[0] + 3.6, y1], [ft[0] - 4.4, y1], [ft[0] - 4.4, y1 - 2]]);
    for (let x = Math.round(ft[0] - 4); x <= Math.round(ft[0] + (side ? 6 : 3.6)); x++) s.mod(x, y1, -1);          // the sole
    if (skates) {
        // David's roller skates: rainbow wheels
        const wc = ['#e0405a', '#f7962d', '#ffd84a', '#5ed17a', '#4ea8f0', '#b37cf0'];
        const xs = side ? [ft[0] - 2, ft[0] + 4] : [ft[0] - 2.5, ft[0] + 2];
        xs.forEach((x, i) => { const c = wc[(i * 3 + (k === 'L' ? 0 : 1)) % 6]; s.px(x, y1 + 0, c); s.px(x + 1, y1 + 0, c); });
    }
}
function hdPantsSeams(s, J, side) {
    if (side) return;
    for (const k of ['L', 'R']) { const kn = J['kn' + k], an = J['an' + k]; s.mod(kn[0] + (k === 'L' ? -1.8 : 1.8), kn[1] + 3, 1); s.mod(an[0], an[1] - 0.5, 1); }
}
/* a hero's cape, behind everything */
function hdCape(s, J, mat, side) {
    const id = s.add(mat, { layer: 0, R: 4, grad: 0.2, bias: -0.06 });
    if (side) s.poly(id, [[18, J.top + 1], [24, J.top], [21, 62], [12, 63.5], [13, 52]]);
    else s.poly(id, [[16, J.top + 1], [32, J.top + 1], [36.5, 62], [11.5, 62]]);
}

/* the clothes' details: knit ribs, bibs, lapels, buttons, belts... */
function hdClothesDetail(s, J, st, C, m) {
    const t = J.top, b = J.hip, side = m.side, up = m.up, cx = side ? 24.5 : 24, front = !side && !up;
    if (st.knit) {
        for (let x = 17; x <= 31; x++) if (x % 2 === 0) s.mod(x, b - 2, -1);
        if (front) for (let y = t + 4; y < b - 3; y++) { if (y % 3 === 0) { s.mod(20, y, 1); s.mod(28, y, 1); } else if (y % 3 === 1) { s.mod(21, y, -1); s.mod(27, y, -1); } }
    }
    if (st.cardigan && front) { for (let y = t + 2; y < b; y++) s.mod(24, y, -1); for (const y of [t + 6, t + 10, t + 14]) s.px(25, y, m.trim[1]); }
    if (st.straps && !up) {
        // a sleeveless top: bare shoulders above the neckline, thin straps
        const sk = s.add(m.skin, { layer: 3, R: 2, bias: -0.04 });
        if (side) s.poly(sk, [[21, t], [27, t], [28.5, t + 2], [21.5, t + 3]]);
        else s.poly(sk, [[17, t], [31, t], [33, t + 2], [29, t + 4.5], [24, t + 5.5], [19, t + 4.5], [15, t + 2]]);
        const sp = s.add(m.top, { layer: 4, R: 1 });
        if (side) s.line(sp, 24.5, t, 24.5, t + 3, 0.6); else { s.line(sp, 19.5, t, 19.5, t + 4, 0.6); s.line(sp, 28.5, t, 28.5, t + 4, 0.6); }
    }
    if (st.bib && front) {
        const bib = s.add(m.bot, { layer: 4, R: 3, grad: 0.15 });
        s.poly(bib, [[18.5, t + 7], [29.5, t + 7], [29.5, b], [18.5, b]]);
        s.line(bib, 18.5, t + 7, 18.5, t + 0.5, 0.9); s.line(bib, 29.5, t + 7, 29.5, t + 0.5, 0.9);
        s.px(19, t + 7, '#e8c46a'); s.px(29, t + 7, '#e8c46a');
        s.rect(bib, 21, t + 10, 6, 4); s.mod(21, t + 10, -1); s.mod(26, t + 10, -1);
    } else if (st.bib && up) {
        const bib = s.add(m.bot, { layer: 4, R: 3 });
        s.line(bib, 19, t + 1, 23, b - 4, 0.9); s.line(bib, 29, t + 1, 25, b - 4, 0.9);
    } else if (st.bib && side) {
        const bib = s.add(m.bot, { layer: 4, R: 3, grad: 0.15 });
        s.poly(bib, [[25.5, t + 7], [29.8, t + 7], [29.6, b], [24.5, b]]);
        s.line(bib, 26.5, t + 7, 23.5, t + 0.5, 0.8);
        s.px(26, t + 7, '#e8c46a');
    }
    if (st.hood && !side) {
        const hood = s.add(m.top, { layer: 4, R: 3, grad: 0.1, bias: -0.04 });
        if (up) s.poly(hood, [[17.5, t - 1], [30.5, t - 1], [29, t + 8], [24, t + 10], [19, t + 8]]);
        else { s.poly(hood, [[16.5, t - 0.5], [21, t - 1], [22.5, t + 2], [17.5, t + 3]]); s.poly(hood, [[31.5, t - 0.5], [27, t - 1], [25.5, t + 2], [30.5, t + 3]]); }
        if (front) { s.px(22, t + 3, m.trim[2]); s.px(22, t + 4, m.trim[2]); s.px(22, t + 5, m.trim[1]); s.px(26, t + 3, m.trim[2]); s.px(26, t + 4, m.trim[2]); s.px(26, t + 5, m.trim[1]); }
    }
    if (st.pocket && front) { for (let x = 19; x <= 29; x++) s.mod(x, b - 7, -1); s.mod(19, b - 6, -1); s.mod(29, b - 6, -1); for (let x = 20; x <= 28; x++) s.mod(x, b - 6, 1); }
    if (st.buttons && front) for (let y = t + 4; y < b - 1; y += 4) s.px(24, y, m.trim[2]);
    if (st.piping && front) { for (let y = t + 1; y < b; y++) s.px(23, y, m.trim[3]); for (let x = 16; x <= 32; x++) s.px(x, b - 1, m.trim[3]); }
    if ((st.lapels || st.open) && front) {
        // an open jacket over a shirt: the shirt shows down the middle, lapels fold back
        const shirt = s.add(st.open ? m.trim : hdRamp('#f4f1ea'), { layer: 3, R: 2, grad: 0.25 });
        s.poly(shirt, [[21.5, t], [26.5, t], [26, b - (st.open ? 0 : 6)], [22, b - (st.open ? 0 : 6)]]);
        for (let y = t; y < t + 9; y++) { s.mod(21 - (t + 9 - y) * 0.25, y, 1); s.mod(27 + (t + 9 - y) * 0.25, y, 1); }
        for (let y = t + 1; y < b; y++) { s.mod(21, y, -1); s.mod(27, y, -1); }
        if (st.tie) { const tie = s.add(m.trim, { layer: 4, R: 1.5, grad: 0.3 }); s.poly(tie, [[23, t + 1], [25, t + 1], [25.5, t + 11], [24, t + 13], [22.5, t + 11]]); }
        else if (C.style === 'jacket') { s.px(28.5, t + 7, '#3f6b8a'); s.px(28.5, t + 8, '#3f6b8a'); s.px(28.5, t + 6, '#d8d0c0'); }
    }
    if (st.belt || st.obi || st.sash) {
        const bt = s.add(st.belt ? hdRamp('#3a2a22') : m.trim, { layer: 4, R: 2, grad: 0.3 });
        const y = J.waist - (st.obi ? 3 : 1);
        if (side) s.rect(bt, 19.4, y, 10.4, st.obi ? 5 : 2.5); else s.rect(bt, 16, y, 16, st.obi ? 5 : 2.5);
        if (st.belt && front) { s.px(23, y + 1, '#e8c46a'); s.px(24, y + 1, '#e8c46a'); s.px(25, y + 1, '#e8c46a'); }
        if (st.obi && front) { s.mod(24, y + 2, 1); s.mod(23, y + 2, 1); }
    }
    if (st.wrap && front) { for (let y = t; y < J.waist - 3; y++) { s.mod(21 + (y - t) * 0.35, y, -1); } for (let y = t; y < t + 6; y++) s.px(22 + (y - t) * 0.35, y, m.trim[3]); }
    if (st.collar && front) { s.px(21, t, m.trim[3]); s.px(22, t + 1, m.trim[3]); s.px(27, t, m.trim[3]); s.px(26, t + 1, m.trim[3]); s.px(23, t + 1, m.trim[2]); s.px(25, t + 1, m.trim[2]); }
    if (st.sailor && !side) {
        const col = s.add(m.trim, { layer: 4, R: 2, grad: 0.2 });
        if (front) { s.poly(col, [[16.5, t], [21, t], [24, t + 6], [27, t], [31.5, t], [31, t + 3], [24, t + 9], [17, t + 3]]); s.px(23, t + 7, '#e0405a'); s.px(24, t + 7, '#e0405a'); s.px(25, t + 7, '#e0405a'); s.px(24, t + 8, '#e0405a'); }
        else s.poly(col, [[17, t], [31, t], [30.5, t + 7], [17.5, t + 7]]);
    }
    if (st.cape && front) {
        // the cape's clasp at the shoulders, and the emblem
        s.px(17, t + 1, '#ffd84a'); s.px(31, t + 1, '#ffd84a');
        const em = s.add(hdRamp('#ffd84a'), { layer: 4, R: 2, grad: 0.3 });
        s.poly(em, [[24, t + 4], [27, t + 7], [24, t + 10], [21, t + 7]]);
    }
    if (st.chef && front) {
        // double-breasted buttons and a neckerchief
        for (const y of [t + 5, t + 9, t + 13]) { s.px(21, y, '#c8ccd6'); s.px(27, y, '#c8ccd6'); }
        const nk = s.add(m.trim, { layer: 4, R: 1.5, grad: 0.3 });
        s.poly(nk, [[20.5, t - 0.5], [27.5, t - 0.5], [24, t + 3.5]]);
    }
    if (st.coat && front) { for (let y = t + 2; y < b + 6; y++) s.mod(24, y, -1); }
    if (st.space) {
        if (front) { s.px(22, t + 5, '#e0405a'); s.px(23, t + 5, '#ffd84a'); s.px(25, t + 5, '#bfe8ff'); s.px(26, t + 5, '#bfe8ff'); }
    }
    if (st.lace && front) for (let x = 16; x <= 32; x += 2) s.px(x, 59, m.trim[3]);
    if (st.sparkle && front) for (const [x, y] of [[19, t + 6], [28, t + 11], [21, 52], [27, 56], [24, t + 15]]) s.px(x, y, '#fff6fb');
    if (st.cuffs && front) { s.px(23, t + 2, m.trim[3]); s.px(24, t + 3, m.trim[3]); s.px(25, t + 2, m.trim[3]); }
}
/* the ends of the hair in the tip color: the lowest third of each hair part, with a soft dithered edge */
function hdTips(s, g, tip) {
    const HR = g.H, ys = [];
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) { const p = s.part[y * s.w + x]; if (p >= 0 && s.parts[p].mat === HR) ys.push(y); }
    if (!ys.length) return;
    const y0 = Math.min(...ys), y1 = Math.max(...ys);
    if (y1 - y0 < 24) return;                                   // short hair: no tips to dye
    const cut = y1 - (y1 - y0) * 0.17;
    for (let y = Math.floor(cut - 2); y <= y1; y++) for (let x = 0; x < s.w; x++) {
        const p = s.part[y * s.w + x];
        if (p < 0 || s.parts[p].mat !== HR) continue;
        if (y < cut && (x + y) % 2) continue;
        s.recolor(x, y, tip);
    }
}
/* a pattern on the fabric (the sewing machine's: stripes, dots, checks, plaid, hearts, stars, flowers) */
function hdPattern(s, fabric, C, st, J) {
    const pc = hdRamp(C.patCol), set = new Set(fabric), onTop = C.patWhere !== 'bottom', onBot = C.patWhere !== 'top';
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
        const p = s.part[y * s.w + x];
        if (!set.has(p)) continue;
        const lower = y > J.waist + J.dy;
        if (lower ? !onBot : !onTop) continue;
        const h = hdPatHit(C.pat, x, y);
        if (h === 'o') s.recolor(x, y, '#ffd84a'); else if (h) s.recolor(x, y, pc);
    }
}
function hdPatHit(kind, x, y) {
    if (kind === 'stripes') return y % 4 < 2 ? 'X' : '';
    if (kind === 'dots') return (y % 6 === 2 || y % 6 === 3) && ((x + (Math.floor(y / 6) % 2) * 3) % 6 === 1 || (x + (Math.floor(y / 6) % 2) * 3) % 6 === 2) ? 'X' : '';
    if (kind === 'checks') return ((x >> 2) + (y >> 2)) % 2 === 0 ? 'X' : '';
    if (kind === 'plaid') return x % 6 === 1 || y % 6 === 1 ? 'X' : '';
    const M = { hearts: [['X.X.', 'XXXX', '.XX.'], 7, 6], stars: [['.X..', 'XXX.', '.X..'], 6, 5], flowers: [['.X.', 'XoX', '.X.'], 6, 5] }[kind];
    if (!M) return '';
    const [rows, px, py] = M, band = Math.floor(y / py), lx = (x + (band % 2) * Math.floor(px / 2)) % px, ly = y % py;
    const c = ly < rows.length && lx < rows[0].length ? rows[ly][lx] : '.';
    return c === '.' ? '' : c;
}
/* the little print on the front (6x3 at the machine), two pixels per dot */
function hdPrint(s, J, print) {
    const W = typeof PRINT_W !== 'undefined' ? PRINT_W : 6, H = typeof PRINT_H !== 'undefined' ? PRINT_H : 3;
    const x0 = 24 - W, y0 = J.top + 5 + J.dy;
    for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
        const c = print[py * W + px];
        if (!c) continue;
        for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) s.recolor(Math.round(s.X(x0 + px * 2 + dx + 0.5) - 0.5), y0 + py * 2 + dy, c);
    }
}

/* ---------------------------------------------------------------- frames */
/* "down_walkA" -> [dir, body, face] (the frames list sarah.py makes) */
const HD_FRAMES = {
    down_stand: ['down', 'stand', 'normal'], down_walkA: ['down', 'walkA', 'normal'], down_walkB: ['down', 'walkB', 'normal'],
    up_stand: ['up', 'stand', 'normal'], up_walkA: ['up', 'walkA', 'normal'], up_walkB: ['up', 'walkB', 'normal'],
    side_stand: ['side', 'stand', 'normal'], side_walkA: ['side', 'walkA', 'normal'], side_walkB: ['side', 'walkB', 'normal'],
    down_happy: ['down', 'stand', 'happy'], down_cheer: ['down', 'cheer', 'happy'], down_left: ['down', 'left', 'happy'], down_right: ['down', 'right', 'happy'],
    down_pick: ['down', 'pick', 'normal'], side_happy: ['side', 'stand', 'happy'], side_hug: ['side', 'hug', 'happy'], down_sit: ['down', 'sit', 'normal'],
};
/* a frame's name: one of the old ones ("down_walkA") or side:animation:phase[:glance] ("dside:walk:3", "down:idle:2:1")
   -> [dir, body, face, phase, glance] */
function hdFrameSpec(frame) {
    if (frame.indexOf(':') > 0) { const [dir, body, ph, look] = frame.split(':'); return [dir, body, body === 'stretch' && +ph >= 1 ? 'happy' : 'normal', +ph || 0, +look || 0]; }
    const f = HD_FRAMES[frame] || HD_FRAMES.down_stand;
    return [f[0], f[1], f[2], 0, 0];
}
/* a whole frame of a person (with accessories) as a canvas: { c, w, h, ax, ay } */
function hdPersonFrame(spec, frame, blink) {
    const key = 'p|' + frame + '|' + (blink ? 1 : 0) + '|' + JSON.stringify(spec);
    return hdCached(key, () => {
        const [dir, body, face, ph, look] = hdFrameSpec(frame), up = dir === 'up' || dir === 'uside';
        // a tall hat (a wizard's, a chef's toque) needs room above the frame: 18 more rows, like the old 16x30 hats
        const hat = spec.acc && HD_ACC[spec.acc], room = hat && !hat.eye && hat.rise > 2 ? 18 : 0, H = HD_H + room;
        let c = hdPersonSprite(spec, dir, body, face, { blink, ph, look }).canvas();
        if (room) { const t = document.createElement('canvas'); t.width = HD_W; t.height = H; t.getContext('2d').drawImage(c, 0, room); c = t; }
        for (const id of [spec.eyes, spec.acc]) {
            const A = id && HD_ACC[id];
            if (!A || (A.eye && up)) continue;
            const s = new HDSprite(HD_W, H);
            s.dy = room;
            s.warp = hdWarps(dir).head;                 // a 3/4 view squeezes the front or back accessory like the head
            A.draw(s, hdAccAt(hdPose(dir, body, ph), dir));
            s.warp = null;
            hdStack(c, s.canvas());
        }
        return { c, w: HD_W, h: H, ax: HD_AX, ay: HD_AY + room };
    });
}
/* where an accessory goes on a person: the top of the head (over the hair), its width, the eye line */
function hdAccAt(J, dir) {
    const fy = J.fy + J.dy, side = dir === 'side', l = side ? J.lean || 0 : 0;
    return { dir: side ? 'side' : dir === 'up' || dir === 'uside' ? 'up' : 'down', cx: 24 + l, top: fy - 17, w: 24, eyeY: fy - 1.5, eyeDx: 5, faceX: 33.5 + l, person: true };
}
