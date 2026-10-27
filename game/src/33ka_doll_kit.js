/* ---- 33ka_doll_kit.js ---- */
/* The dolls redone in the style David set on 26 October: chibi toys after Animal Crossing's people. The kit is made in
   Blender (tools/blender/dolls.py: doll_kit, doll_hair): a big round head with its face painted on a patch of it, hair
   sculpted as chunky locks, a sweater with a ribbed hem and collar, mitten hands, rolled jeans, chunky shoes; every part
   shaded in greys and named for the color that paints it (top, trim, bottom, shoes, skin, hair...), so the tailor's
   clothes and the salon's hair still dress it. Elbows and knees bend (each limb is two pieces jointed on a ball).
   The face is one of sixteen expressions painted on a sheet per look (EnvDolls.faceSheet) and chosen by moving the
   patch's picture: happy, surprised, sad, excited, talking...
   It's in the test area and on Sarah's island on beta, the live site keeps the first dolls until David says so
   (STYLE2: where the new look is, ENV_ISLAND; localStorage sc-style2 1 or 0 anywhere). */
const STYLE2 = (() => { const v = lsGet('sc-style2'); return v === '1' ? true : v === '0' ? false : LAB || ENV_ISLAND; })();
const DOLL2 = { H: 1.62, R: 0.215, HEAD: 0.782, NECK: 0.56 };
/* how each hat (EnvDolls.extras) meets the hair, in head radii (EnvDolls.hatFit): cover [band, crown's middle height,
   crown's width, crown's height] presses the hair above the band inside the crown; sit lifts it to the hair's top; wrap
   [height, ring] widens it round the hair (over: a band over the top too); max: how much wider it may grow (what comes
   down over the brow, a beanie or a hood, stays its size, or it would cover the eyes) */
const HAT_FIT = {
    sunhat: { cover: [0.55, 0.71, 0.85, 0.55] }, beanie: { cover: [0.3, 0.36, 1.08, 0.92], max: 1.04 }, piratehat: { cover: [0.6, 0.84, 0.88, 0.6] },
    wizardhat: { cover: [0.6, 0.66, 0.72, 0.4] }, witchhat: { cover: [0.6, 0.66, 0.7, 0.4] }, deerstalker: { cover: [0.35, 0.49, 1.06, 0.72], max: 1.06 },
    chefhat: { cover: [0.75, 1.07, 0.8, 0.6] }, ghosthood: { cover: [0.2, 0.41, 1.12, 1.0], max: 1.05 }, pumpkinhat: { cover: [0.7, 1.1, 0.76, 0.5] },
    soupbowl: { cover: [0.75, 1.0, 0.82, 0.4] }, mummywrap: { cover: [0.15, 0.5, 1.04, 0.8], max: 1.06 }, robotbox: { cover: [0.35, 0.82, 0.95, 0.55], max: 1.15 },
    crown: { sit: 1 }, partyhat: { sit: 1 }, halo: { sit: 1 }, catears: { sit: 1 }, bathat: { sit: 1 }, goathorns: { sit: 1 },
    tiara: { wrap: [0, 1], top: 1, max: 1.6 }, flowercrown: { wrap: [0.63, 0.86], max: 1.25 }, bow: { wrap: [0.9, 0.62], max: 1.5 }, flower: { wrap: [0.62, 0.93], max: 1.5 },
    sunrays: { wrap: [0.73, 0.9] }, lobsterclaws: { wrap: [0.73, 0.92] }, headphones: { wrap: [0, 1.06], over: 1.12 },
};
/* the expressions on a face sheet, four to a row */
const FACES = ['idle', 'blink', 'talk', 'happy', 'happytalk', 'joy', 'surprised', 'sad', 'cry', 'excited', 'determined', 'worried', 'sleepy', 'wink', 'love', 'annoyed'];
/* the redone food folks' faces (tools/blender/folks2.py paints none: each has a patch these are painted on). Maki: white
   eyes on the dark nori, a little lidded (precise, deadpan), rice-white brows and mouth. Kai: big round white eyes, a
   grin, navy brows (loose, sunny). Ginger: chocolate-chip eyes, icing brows and smile, pink icing cheeks */
const FOLK_FACES = {
    maki: { eye: 'white', X: 128, EY: 128, EX: 62, MY: 186, BY: 76, er: [24, 28], pupil: 0.5, rest: 0.13, line: '#efe9dc', shut: '#efe9dc', lidLine: '#efe9dc', lid: '#1d3830',
        brow: '#efe9dc', browW: 0.8, mouth: '#efe9dc', mouthIn: '#8a2a36', mouthRim: '#efe9dc', blush: [92, 30, 22, 12], restMouth: 'flat', w: 1.1 },
    kai: { eye: 'white', X: 128, EY: 116, EX: 64, MY: 182, BY: 82, er: [28, 30], pupil: 0.6, look: -0.12, ring: '#1a2c58', line: '#1a2c58', lid: '#3c7ad0',
        brow: '#1a2c58', browW: 1.1, browLen: 18, mouth: '#1a2c58', mouthIn: '#3a1424', teeth: true, blush: [98, 32, 22, 13], restMouth: 'grin', ms: 1.35, w: 1.2 },
    ginger: { eye: 'chip', X: 128, EY: 112, EX: 54, MY: 178, BY: 66, er: [20, 22], iris: '#22100a', iris2: '#5a3020', line: '#fdfbf6', shut: '#2a160e', lid: '#cc8440',
        brow: '#fdfbf6', browW: 1.1, mouth: '#fdfbf6', mouthIn: '#5a2a18', mouthRim: '#fdfbf6', blush: [84, 34, 15, 15], blushCol: '#f49ab0', restMouth: 'smile', ms: 1.3, w: 1.3 },
};
/* the rest of the folks, after their HD pictures: most have dark glossy eyes (a chip, with a shine), Coco, Cece, Floss and
   Waffle white ones with a line round them; Clementine's and DJ Wasabi's eyes are behind their shades (noEyes: the brows
   and mouth do the acting); Chili's brows are thick and cocky, Sully's bushy, Cece's worried, with her nervous sweat drop */
(() => {
    const chip = (lid, brow, extra) => Object.assign({ eye: 'chip', X: 128, EY: 118, EX: 84, MY: 166, BY: 82, er: [21, 25], iris: '#1c1214', iris2: '#4a2c22', line: '#2a1a16', shut: '#2a1a16', lid,
        brow, browW: 0.95, mouth: '#3a1c18', mouthIn: '#5e1f26', blush: [96, 34, 18, 11], restMouth: 'smile', ms: 1.1, w: 1.15 }, extra || {});
    const white = (lid, ring, extra) => Object.assign({ eye: 'white', X: 128, EY: 118, EX: 84, MY: 166, BY: 82, er: [22, 25], pupil: 0.58, ring, line: ring, shut: ring, lid,
        brow: ring, browW: 0.9, mouth: ring, mouthIn: '#5a1424', blush: [96, 34, 18, 11], restMouth: 'smile', ms: 1.1, w: 1.15, lashes: true }, extra || {});
    Object.assign(FOLK_FACES, {
        basil: chip('#e8be74', '#a87038', { restMouth: 'grin', ms: 0.9 }),
        wonton: chip('#f6e6c0', '#c8a070', { EX: 76, restMouth: 'grin', ms: 0.9 }),
        chili: chip('#d8322a', '#3a1012', { EX: 66, browW: 1.55, browTilt: 0.45, browArch: 2, mouth: '#3a0e10', mouthIn: '#5a1418', blushCol: 'rgba(255,176,170,0.6)', restMouth: 'grin', ms: 1.0 }),
        coco: white('#5e3826', '#1e1210', { sclera: '#fbf8f2', brow: '#8a5a3e', mouth: '#f2a2b8', mouthRim: '#f2a2b8', blushCol: 'rgba(242,138,184,0.6)' }),
        cece: white('#faf0da', '#6a4430', { browTilt: -0.55, mouth: '#5a2a2a', sweat: true, ms: 0.9 }),
        clementine: chip('#f0861e', '#a8501a', { noEyes: true, BY: 66, MY: 162, blush: [96, 25, 20, 12], mouth: '#7a3a1a', ms: 1.2 }),
        cuke: chip('#3e8e3a', '#1e4a1c', { EX: 62, blush: null, blushHappy: [80, 34, 16, 10], mouthIn: '#4a1e22', restMouth: 'grin', ms: 1.3 }),
        sully: chip('#f2c46a', '#4a2818', { browW: 1.65, browArch: 2, browLen: 18, mouth: '#4a2818', ms: 1.3 }),
        brulee: chip('#fbe8b8', '#a87a48', { mouth: '#5a2a1a' }),
        mac: chip('#f6c838', '#a8701a', { mouth: '#5a2a1a', ms: 1.2 }),
        fortune: chip('#e8b45a', '#8a5a22', { EX: 76, mouth: '#5a2a1a' }),
        floss: white('#f6a2cc', '#7a3a5a', { EX: 76, brow: '#c05a8a', blushCol: 'rgba(156,200,242,0.75)' }),
        waffle: white('#e8a850', '#6a3a14', { EX: 74, mouth: '#7a3a1a' }),
        wasabi: chip('#8cc43c', '#3a5a1a', { noEyes: true, BY: 70, MY: 165, blush: [100, 25, 20, 12], mouth: '#2e4a12', restMouth: 'smile', ms: 1.2 }),
        goat: chip('#f2f0ea', null, { EX: 54, er: [34, 40], MY: 205, blush: [96, 46, 20, 13], ms: 0.6, w: 1.0 }),
        floret: chip('#a8d48a', '#2a4a20', { EX: 60, rest: 0.42, browW: 1.4, browArch: 1, mouth: '#2a3a20', restMouth: 'flat', blush: null, blushHappy: [80, 34, 14, 9] }),
        stalk: chip('#a8d48a', '#2a4a20', { EX: 60, lashes: true, mouth: '#2a3a20', mouthIn: '#2a3a20', teeth: true, restMouth: 'grin', ms: 1.0 }),
        sprout: chip('#a8d48a', '#2a4a20', { EX: 56, er: [24, 28], mouthIn: '#5e1f26', restMouth: 'grin', ms: 0.8, blush: [84, 34, 18, 12] }),
        scampi: chip('#e8603e', '#f4f0e6', { EX: 70, browW: 1.75, browArch: 2, browLen: 20, browTilt: 0.2, mouth: '#4a1810', mouthIn: '#5e1f26', restMouth: 'smile', ms: 1.15, blushCol: 'rgba(255,190,170,0.6)' }),
        mug: chip('#f6eedc', '#5a3a2a', { EX: 64, mouth: '#4a2a1a', mouthIn: '#6a1e26', restMouth: 'grin', ms: 1.25, blushCol: 'rgba(240,140,150,0.6)' }),
        ghost: chip('#d4e0fa', '#aebeea', { closed: true, shut: '#5a6aa8', line: '#5a6aa8', EX: 70, mouth: '#5a6aa8', blush: [90, 30, 18, 10], blushCol: 'rgba(244,150,170,0.45)' }),
    });
})();
Object.assign(EnvDolls, {
    sheets: new Map(),
    kitReady() { return STYLE2 && typeof EnvModels !== 'undefined' && EnvModels.has('doll_kit'); },
    /* the kit's parts by name, each its geometry about its own joint and where that joint is */
    kit() {
        if (this._kit) return this._kit;
        const out = {};
        for (const name of ['doll_kit', 'doll_hair']) {
            const M = EnvModels.models[name];
            if (!M) continue;
            for (const p of M.parts) out[p.node] = { geo: p.geometry.clone().translate(-p.at.x, -p.at.y, -p.at.z), at: p.at.clone() };
        }
        return (this._kit = out);
    },
    make2(spec) {
        const L = spec.look || LOOK_DEFAULT, C = spec.clothes || { style: 'toppants', top: '#c0303a', trim: '#f4f0e6', bottom: '#4d6d9f', shoes: '#f3f1ee' };
        const st = HD_STYLE[C.style] || HD_STYLE.toppants, K = this.kit(), R = DOLL2.R;
        const c = (h) => new THREE.Color(h);
        const top = c(C.top || '#c0303a'), trim = c(C.trim || C.top || '#f4f0e6'), bottom = c(C.bottom || C.top || '#4d6d9f'), shoes = c(C.shoes || '#f3f1ee');
        const skin = c(L.skin || '#fbd9c6');
        // (the rolled cuff shows the cloth's paler inside; the sole is pale under dark shoes, a shade darker under pale ones)
        const hsl = {};
        shoes.getHSL(hsl);
        const role = { top, trim, bottom, bottom2: bottom.clone().lerp(c('#ffffff'), 0.35), shoes, sole: hsl.l < 0.55 ? c('#efe8dc') : shoes.clone().multiplyScalar(0.84), skin };
        const d = { v2: true, R, textures: [], geos: [], parts: {}, eye: { x: 0.32, y: -0.1, z: 1.0, r: 0.25 } }, P = d.parts;
        const root = d.root = new THREE.Group();
        root.scale.setScalar(DOLL2.H);
        const body = P.body = new THREE.Group();
        root.add(body);
        const joint = (parent, name, at, base) => { const g = new THREE.Group(); g.position.copy(at).sub(base || new THREE.Vector3()); parent.add(g); P[name] = g; return g; };
        // what each joint carries: [the kit part, its color (or a role)]
        const lists = new Map();
        const add = (g, name, col) => { if (!K[name]) return false; if (!lists.has(g)) lists.set(g, []); lists.get(g).push([K[name].geo, col]); return true; };
        // the body: the top, its hem and collar, the jeans' seat (or a skirt, built below)
        const one = !!st.one, skirt = st.skirt, legsCol = skirt && !st.legs ? skin : one && !skirt ? top : bottom;
        // (the men's cut, David's call: straighter, a touch broader at the shoulders, a jacket that's open over a shirt, and
        // a touch taller)
        const masc = !!L.masc && !skirt && !one;
        if (masc) {
            root.scale.setScalar(DOLL2.H * 1.04);
            add(body, 'torso_m__top', top); add(body, 'hem_m__top', top); add(body, 'collar_m__trim', trim); add(body, 'hips_m__bottom', bottom);
            if (st.lapels || st.open) { add(body, 'shirt_m__trim', trim); add(body, 'lapel_m__top', top); add(body, 'pocket_m__top', top); }
        } else {
            // (bare shoulders: the top cut across above the chest, thin straps over them)
            if (st.straps && K['torso_strap__top']) { add(body, 'torso_strap__top', top); add(body, 'chest__skin', skin); add(body, 'straps__top', top); }
            else add(body, 'torso__top', top);
            add(body, 'hem__trim', st.knit || !one ? trim : top);
            if (!st.straps && !(st.collar && K['collar_pt__trim'])) add(body, 'collar__trim', trim);
            if (!skirt) add(body, 'hips__bottom', one ? top : bottom);
        }
        // what some clothes add (tools/blender/dolls.py: bib, hoodie, fastenings, cape): a bib and its straps, a hood with
        // its pocket and drawstrings, buttons down the front, a belt, an obi or a sash, a cardigan's front, a pointed collar
        const brass = c('#e8c35a');
        if (st.bib) { add(body, 'bib__bottom', bottom); add(body, 'bib__metal', brass); }
        if (st.hood) { add(body, 'hood__top', top); add(body, 'cord__trim', trim); }
        if (st.pocket) add(body, 'pocket_h__top', top);
        if (st.buttons || st.coat) add(body, 'buttons__trim', trim);
        if (st.chef) add(body, 'buttons2__trim', trim);
        if (st.belt) { add(body, 'belt__belt', c('#3a2a22')); add(body, 'belt__metal', brass); }
        if (st.obi) add(body, 'obi__trim', trim);
        if (st.sash) add(body, 'sash__trim', trim);
        if (st.cardigan) add(body, 'cardigan__trim', trim);
        if (st.collar) add(body, 'collar_pt__trim', trim);
        if (st.cape) add(body, 'cape__trim', trim);
        // legs: the thigh from the hip, the shin from the knee with the cuff (on trousers) and the shoe
        for (const k of ['l', 'r']) {
            const th = K['thigh_' + k + '__bottom'], sh = K['shin_' + k + '__bottom'];
            if (!th || !sh) continue;
            const leg = joint(body, k === 'l' ? 'legL' : 'legR', th.at), knee = joint(leg, k === 'l' ? 'knL' : 'knR', sh.at, th.at);
            add(leg, 'thigh_' + k + '__bottom', legsCol);
            add(knee, 'shin_' + k + '__bottom', legsCol);
            if (st.legs === 'pants' && !one && !masc) add(knee, 'shin_' + k + '__bottom2', role.bottom2);
            add(knee, 'shin_' + k + '__shoes', shoes);
            add(knee, 'shin_' + k + '__sole', role.sole);
            if (C.skates) for (const w of [-0.04, 0.05]) this.piece(knee, 'disc', this.mat('#f2c84a', 0.4), (k === 'l' ? -1 : 1) * 0.004, -0.112 + 0.004, w - 0.02, 0.016, 0.036, 0.016, 0, 0, Math.PI / 2);
        }
        // arms: a long sleeve to a cuff, or bare (under a short or wide sleeve, built below), the mitten hand
        const long = st.sleeves === 'long', sl = masc && K['uarm_m_l__top'] ? 'm_' : '';
        for (const k of ['l', 'r']) {
            const ua = K[(long ? 'uarm_' + sl : 'uarm_bare_') + k + (long ? '__top' : '__skin')], fa = K[(long ? 'farm_' + sl : 'farm_bare_') + k + (long ? '__top' : '__skin')];
            if (!ua || !fa) continue;
            const arm = joint(body, k === 'l' ? 'armL' : 'armR', ua.at), el = joint(arm, k === 'l' ? 'elL' : 'elR', fa.at, ua.at);
            // (the broader cut's shoulders a little further out)
            if (masc) arm.position.x += (k === 'l' ? -1 : 1) * 0.005;
            if (long) { add(arm, 'uarm_' + sl + k + '__top', top); add(el, 'farm_' + sl + k + '__top', top); add(el, 'farm_' + sl + k + '__trim', trim); add(el, 'farm_' + sl + k + '__skin', skin); }
            else {
                add(arm, 'uarm_bare_' + k + '__skin', skin); add(el, 'farm_bare_' + k + '__skin', skin);
                const s = k === 'l' ? -1 : 1;
                if (st.sleeves === 'short') { this.piece(arm, 'ball', this.mat(C.top || '#c0303a'), 0, -0.02, 0, 0.046, 0.06, 0.046); this.piece(arm, 'band', this.mat(C.trim || C.top || '#f4f0e6'), 0, -0.07, 0, 0.044, 0.044, 0.044, Math.PI / 2); }
                if (st.sleeves === 'wide') this.piece(el, 'wide', this.mat(C.top || '#c0303a'), 0, 0.03, 0, 0.75, 0.6, 0.75);
                void s;
            }
        }
        // a skirt over the hips with its folds (pleats to the knee, gathers to the floor, a tutu's ruffles); before the
        // kit had them, turned shapes as the first dolls had
        if (skirt && !add(body, 'skirt_' + skirt + '__skirt', (one ? top : bottom))) {
            this.piece(body, skirt === 'floor' ? 'floor' : skirt === 'tutu' ? 'tutu' : 'knee', this.mat((one ? C.top : C.bottom) || '#4d6d9f'), 0, skirt === 'tutu' ? 0.27 : 0.3, 0, 0.82, skirt === 'floor' ? 0.66 : 0.72, 0.72);
        }
        // the head, turning at the neck: the skull and ears, the hair, the face on its patch
        const hk = K['head__skin'];
        const head = joint(body, 'head', hk ? hk.at : new THREE.Vector3(0, DOLL2.NECK, 0));
        add(head, 'head__skin', skin); add(head, 'ear_l__skin', skin); add(head, 'ear_r__skin', skin);
        const hc = new THREE.Group();
        hc.position.y = DOLL2.HEAD - DOLL2.NECK;
        head.add(hc);
        P.hc = hc;
        const hairK = K['hair_' + L.hair + '__hair'];
        if (hairK) lists.get(head).push([hairK.geo, 'hair']);
        else this.hair(d, hc, L);
        // (a beard, sculpted as the hair is, in the look's beard color: David's)
        if (L.beard && K['beard_full__beard']) lists.get(head).push([K['beard_full__beard'].geo, c(L.beard)]);
        // (the patch the face is painted on: its own picture, one sheet per look, the expression chosen by its UVs)
        const fk = K['face__face'];
        if (fk) {
            const geo = fk.geo.clone(), sheet = this.faceSheet(L);
            d.faceUV = Float32Array.from(geo.attributes.uv.array);
            const m = new THREE.Mesh(geo, sheet.mat);
            m.renderOrder = 2;
            head.add(m);
            d.face = m;
            d.geos.push(geo);
            this.setFace(d, 'idle');
        }
        this.extras(d, hc, spec, L);
        if (hairK) this.hatFit(d, lists.get(head), hairK.geo, spec.acc);
        // each joint's kit parts as one mesh, its colors in it
        if (!this.vc) this.vc = r3Patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, metalness: 0 }), { key: 'envdollvc' });
        const hairBase = c(L.hairCol || '#5a3622'), hairTip = L.tipCol ? c(L.tipCol) : null;
        for (const [g, list] of lists) {
            const geo = this.merge2(list, hairBase, hairTip);
            const mesh = new THREE.Mesh(geo, this.vc);
            mesh.castShadow = true; mesh.receiveShadow = true;
            g.add(mesh);
            d.geos.push(geo);
        }
        d.joints = [body, P.legL, P.legR, P.knL, P.knR, P.armL, P.armR, P.elL, P.elR, head, hc, d.hatG].filter(Boolean);
        this.bake(d);
        // (at rest the arms hang a little out from the sides, clear of the hem)
        return d;
    },
    /* a hat sits on the hair, not through it (David, 27 October; every hat was made for a bare head, its top 1.02 head
       radii up): one that covers the crown is made as wide as the hair at its band and presses the hair above the band
       down and in, inside its crown, as Animal Crossing's hats flatten the hair; one that sits on top is lifted to the
       hair's top; one that goes round the head goes round the hair (HAT_FIT) */
    hatFit(d, list, geo, acc) {
        const F = HAT_FIT[acc], g = d.hatG;
        if (!F || !g) return;
        const R = DOLL2.R, off = DOLL2.HEAD - DOLL2.NECK, a = geo.attributes.position.array, n = a.length;
        const Y = i => (a[i + 1] - off) / R, Rr = i => Math.hypot(a[i], a[i + 2]) / R;
        const reach = (h, dh) => { let m = 0; for (let i = 0; i < n; i += 3) if (Math.abs(Y(i) - h) < dh) m = Math.max(m, Rr(i)); return m; };
        // (where something on top rests: the hair's height round a ring half a head out, the middle of sixteen ways round,
        // so a bun or a mohawk's crest comes up through a crown instead of lifting it into the air)
        let topC = 1.02, top = -9;
        const bins = new Array(16).fill(-9);
        for (let i = 0; i < n; i += 3) {
            const y = Y(i), r = Rr(i);
            top = Math.max(top, y);
            if (r < 0.55) topC = Math.max(topC, y);
            if (r > 0.42 && r < 0.75) { const b = Math.floor((Math.atan2(a[i + 2], a[i]) / (Math.PI * 2) + 1) * 16) % 16; bins[b] = Math.max(bins[b], y); }
        }
        const got = bins.filter(v => v > -9).sort((x, y) => x - y), rest = got.length ? Math.max(1.02, got[got.length >> 1]) : 1.02;
        if (F.sit) g.position.y += (rest - 1.02) * R * F.sit;
        // (what goes round the head grows as if the head were as big as the hair)
        if (F.wrap) {
            const [h, ring] = F.wrap, s = Math.min(F.max || 1.7, Math.max(1, F.top ? rest / 1.02 : (reach(h, 0.1) + 0.04) / ring));
            g.scale.setScalar(s);
            if (F.over) g.scale.y = Math.max(s, (topC + 0.06) / F.over);
        }
        if (!F.cover) return;
        const [line, cy, rx, ry] = F.cover;
        const s = Math.min(F.max || 1.4, Math.max(1, reach(line + 0.08, 0.08) / (rx * 0.97))), sv = 1 + (s - 1) * 0.4;
        g.scale.set(s, sv, s);
        const b = geo.clone(), p = b.attributes.position.array;
        const k = Math.min(1, ((cy + ry * 0.8) * sv - line) / Math.max(0.01, top - line));
        for (let i = 0; i < n; i += 3) {
            const y = (p[i + 1] - off) / R;
            if (y <= line) continue;
            const w = Math.min(1, (y - line) / 0.12), ys = line + (y - line) * k;
            const e = (ys - cy * sv) / (ry * sv), ra = rx * s * 0.9 * Math.sqrt(Math.max(0, 1 - e * e));
            const r = Math.hypot(p[i], p[i + 2]) / R, f = r > ra && r > 1e-6 ? (r + (ra - r) * w) / r : 1;
            p[i] *= f; p[i + 2] *= f; p[i + 1] = (y + (ys - y) * w) * R + off;
        }
        b.computeVertexNormals();
        for (const e of list) if (e[0] === geo) e[0] = b;
        d.geos.push(b);
    },
    /* a joint's parts as one geometry, each painted: its role's color times its greys; hair its color, fading to the
       dyed tips' down each lock (the kit keeps how far along in the blue) */
    merge2(list, hairBase, hairTip) {
        let n = 0, ni = 0;
        for (const [g] of list) { n += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
        const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), idx = new Uint32Array(ni), tmp = new THREE.Color();
        let o = 0, oi = 0;
        for (const [g, c] of list) {
            const Pa = g.attributes.position, Na = g.attributes.normal, Ca = g.attributes.color, cnt = Pa.count;
            pos.set(Pa.array.subarray ? Pa.array.subarray(0, cnt * 3) : Pa.array, o * 3);
            nor.set(Na.array.subarray ? Na.array.subarray(0, cnt * 3) : Na.array, o * 3);
            const cs = Ca ? Ca.itemSize : 0, ca = Ca ? Ca.array : null, max = ca instanceof Uint16Array ? 65535 : ca instanceof Uint8Array ? 255 : 1;
            for (let i = 0; i < cnt; i++) {
                const r = ca ? ca[i * cs] / max : 1, b = ca ? ca[i * cs + 2] / max : 0;
                if (c === 'hair') {
                    const t = hairTip ? Math.max(0, Math.min(1, (b - 0.35) / 0.4)) : 0;
                    tmp.copy(hairBase); if (hairTip) tmp.lerp(hairTip, t * t * (3 - 2 * t));
                    const k = r * 1.12;
                    col[(o + i) * 3] = Math.min(1, tmp.r * k); col[(o + i) * 3 + 1] = Math.min(1, tmp.g * k); col[(o + i) * 3 + 2] = Math.min(1, tmp.b * k);
                } else {
                    const k = r * 1.06;
                    col[(o + i) * 3] = Math.min(1, c.r * k); col[(o + i) * 3 + 1] = Math.min(1, c.g * k); col[(o + i) * 3 + 2] = Math.min(1, c.b * k);
                }
            }
            if (g.index) for (let i = 0; i < g.index.count; i++) idx[oi++] = o + g.index.getX(i);
            else for (let i = 0; i < cnt; i++) idx[oi++] = o + i;
            o += cnt;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        geo.setIndex(new THREE.BufferAttribute(idx, 1));
        geo.computeBoundingSphere();
        return geo;
    },

    /* ---------------------------------------------------------------- the face */
    /* show an expression: the patch's picture moved to that cell of the sheet */
    setFace(d, name) {
        if (!d.face || d.faceNow === name) return;
        const i = Math.max(0, FACES.indexOf(name)), cx = i % 4, cy = i >> 2, uv = d.face.geometry.attributes.uv, a = uv.array, b = d.faceUV;
        for (let k = 0; k < a.length; k += 2) { a[k] = (cx + b[k]) / 4; a[k + 1] = (cy + b[k + 1]) / 4; }
        uv.needsUpdate = true;
        d.faceNow = name;
    },
    /* the sheet of a look's sixteen faces (shared by every doll with that look) */
    faceSheet(L) { return this.sheet('p|' + [L.skin, L.eyes, L.hairCol, L.blush ? 1 : 0, L.freckles ? 1 : 0, L.masc ? 1 : 0].join('|'), this.personFace(L)); },
    /* a folk's own sheet, from its face (FOLK_FACES) */
    folkSheet(id) { return FOLK_FACES[id] ? this.sheet('f|' + id, FOLK_FACES[id]) : null; },
    sheet(key, S) {
        let s = this.sheets.get(key);
        if (s) return s;
        const C = 256, cv = document.createElement('canvas');
        cv.width = cv.height = C * 4;
        const g = cv.getContext('2d');
        FACES.forEach((name, i) => {
            g.save();
            g.translate((i % 4) * C, (i >> 2) * C);
            g.beginPath(); g.rect(0, 0, C, C); g.clip();
            this.paintFace(g, name, S);
            g.restore();
        });
        // (the kit's UVs run from the top of the face down, as glTF's do)
        const tex = new THREE.CanvasTexture(cv);
        tex.anisotropy = 4; tex.flipY = false;
        // (blended by the picture's alpha, while what's in the alpha channel, the depth of field's blur, stays the head's)
        const mat = r3Patch(new THREE.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, roughness: 0.55, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
            blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor }), { key: 'envdollface2', noDof: true });
        s = { tex, mat, cv };
        this.sheets.set(key, s);
        return s;
    },
    /* a person's face as a painting style: big glossy eyes (a dark oval, the iris in the eyes' color, two shines, a lash
       line), soft brows a shade darker than the hair, a small mouth, blush; laid out round the head (the middle of the
       face at 128, 128 of the cell, 2.46 pixels a degree) */
    personFace(L) {
        const b = new THREE.Color(L.hairCol || '#5a3622').multiplyScalar(0.78);
        const S = { eye: 'person', X: 128, EY: 143, EX: 43, MY: 199, BY: 102, er: [21, 30], iris: L.eyes || '#6c5236', line: '#1e1210', lashes: true,
            lid: L.skin || '#fbd9c6', brow: '#' + b.getHexString(), mouth: '#7a2a2e', ms: 1.2, blush: L.blush ? [66, 30, 21, 12] : null, blushHappy: [66, 30, 21, 12], freckles: !!L.freckles };
        // a boy's face (still a chibi's): rounder eyes a little smaller and further apart, no lash line, a hint of lid,
        // thicker straighter brows set lower, a little nose, a wider plainer mouth, the blush only when he's happy
        if (L.masc) Object.assign(S, { EX: 46, er: [19, 25], lashes: false, rest: 0.08, BY: 108, browW: 1.75, browLen: 17, browArch: 2, ms: 1.3,
            lidLine: '#2a1a16', mouth: '#6a2a28', blushHappy: [68, 30, 19, 10], brow: '#' + b.clone().multiplyScalar(0.85).getHexString(),
            nose: '#' + new THREE.Color(L.skin || '#fbd9c6').multiplyScalar(0.74).getHexString() });
        return S;
    },
    /* one face in a 256-pixel cell, in a style S (personFace, FOLK_FACES): each expression changes the eyes, brows and
       mouth, so they read at a glance at sixty pixels tall, as Animal Crossing's do */
    paintFace(g, name, S) {
        const X = S.X, EY = S.EY, EX = S.EX, MY = S.MY, BY = S.BY, W = S.w || 1;
        const line = S.line, mouthC = S.mouth, shutC = S.shut || S.line;
        g.lineCap = 'round'; g.lineJoin = 'round';
        const ell = (x, y, rx, ry, fill) => { g.fillStyle = fill; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); };
        // ---- the parts
        const blush = (k) => {
            const B = k ? S.blushHappy || S.blush : S.blush;
            if (!B) return;
            g.fillStyle = S.blushCol ? S.blushCol : `rgba(244,118,130,${0.34 + (k || 0) * 0.2})`;
            for (const s of [-1, 1]) { g.beginPath(); g.ellipse(X + s * B[0], EY + B[1], B[2], B[3], 0, 0, Math.PI * 2); g.fill(); }
        };
        const freckles = () => { if (!S.freckles) return; g.fillStyle = 'rgba(150,90,60,0.6)'; for (const s of [-1, 1]) for (const [dx, dy] of [[56, 26], [64, 32], [72, 26], [62, 21]]) { g.beginPath(); g.arc(X + s * dx, EY + dy, 1.8, 0, Math.PI * 2); g.fill(); } };
        // an open eye: o.wide makes it bigger, o.lid (0..1) covers its top, sloping (o.slope > 0: down toward the outer
        // corner, sad; < 0 cross), o.look moves the iris, o.star / o.heart change the shine
        const eye = (s, o) => {
            if (S.noEyes) return;
            o = o || {};
            // (the old keeper's eyes stay shut in a smile, unless something surprises him)
            if (S.closed && !o.wide && !o.heart && !o.star) { shut(s, true, o.dy); return; }
            const x = X + s * EX, y = EY + (o.dy || 0), rx = S.er[0] * (o.wide ? 1.06 : 1), ry = S.er[1] * (o.wide ? 1.14 : 1), lx = (o.look ? o.look[0] : 0), ly = (o.look ? o.look[1] : 0);
            const lid = o.lid != null ? o.lid : S.rest || 0;
            if (o.heart) {
                const k = ry / 30;
                g.fillStyle = '#e8405e';
                g.beginPath(); g.moveTo(x, y + 18 * k); g.bezierCurveTo(x - 30 * k, y - 2 * k, x - 16 * k, y - 26 * k, x, y - 10 * k); g.bezierCurveTo(x + 16 * k, y - 26 * k, x + 30 * k, y - 2 * k, x, y + 18 * k); g.fill();
                ell(x - 7 * k, y - 10 * k, 4 * k, 3 * k, 'rgba(255,255,255,0.9)');
                return;
            }
            // (what shows of it: the oval, below the lid's line when there's a lid)
            const top = y - ry + ry * 2 * lid, sl = (o.slope || 0) * 16 * W;
            g.save();
            g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.clip();
            if (lid > 0) { g.beginPath(); g.moveTo(x - rx - 4, top - s * sl); g.lineTo(x + rx + 4, top + s * sl); g.lineTo(x + rx + 4, y + ry + 4); g.lineTo(x - rx - 4, y + ry + 4); g.closePath(); g.clip(); }
            const ir = o.small ? 0.62 : 1;
            if (S.eye === 'person') {
                ell(x, y, rx, ry, '#2b1a17');
                const grd = g.createLinearGradient(0, y - ry, 0, y + ry), ic = new THREE.Color(S.iris);
                grd.addColorStop(0, '#' + ic.clone().multiplyScalar(0.55).getHexString()); grd.addColorStop(1, '#' + ic.clone().lerp(new THREE.Color('#ffffff'), 0.25).getHexString());
                ell(x + lx, y + ry * 0.18 + ly, rx * 0.78 * ir, ry * 0.77 * ir, grd);
                ell(x + lx, y + ry * 0.22 + ly, rx * 0.44 * ir, ry * 0.44 * ir, '#120a08');
            } else if (S.eye === 'white') {
                ell(x, y, rx, ry, S.sclera || '#fbf8f2');
                ell(x + (S.look || 0) * s * rx * 0.25 + lx, y + ry * 0.12 + ly, rx * (S.pupil || 0.56) * ir, ry * (S.pupil || 0.56) * 1.12 * ir, S.iris || '#1e1416');
            } else {
                // (a chocolate chip: dark and round)
                const grd = g.createRadialGradient(x - rx * 0.3, y - ry * 0.3, 1, x, y, ry);
                grd.addColorStop(0, S.iris2 || '#5a3020'); grd.addColorStop(1, S.iris || '#24120c');
                ell(x, y, rx, ry, grd);
            }
            const sx = S.eye === 'white' ? x + (S.look || 0) * s * rx * 0.25 + lx : x + lx * 0.3, sy = y + ly * 0.3;
            if (o.star) {
                g.fillStyle = '#ffffff';
                const cx = sx - rx * 0.24, cy = sy - ry * 0.27, R1 = ry * 0.45, R2 = ry * 0.14;
                g.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 - Math.PI / 2, r = k % 2 ? R2 : R1; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); g.fill();
                ell(sx + rx * 0.38, sy + ry * 0.4, rx * 0.16, rx * 0.16, '#ffffff');
            } else {
                ell(sx - rx * (S.eye === 'white' ? 0.18 : 0.3), sy - ry * 0.32, rx * (S.eye === 'white' ? 0.26 : 0.38), ry * (S.eye === 'white' ? 0.22 : 0.3), '#ffffff');
                ell(sx + rx * 0.36, sy + ry * 0.4, rx * 0.16, rx * 0.16, 'rgba(255,255,255,0.9)');
            }
            g.restore();
            // (an outline round a white eye, so it reads on a pale body)
            if (S.eye === 'white' && S.ring) { g.strokeStyle = S.ring; g.lineWidth = 3 * W; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.stroke(); }
            // the lid's edge, or the lash line along the top flicked out at the outer corner
            if (lid > 0) {
                const hw = Math.sqrt(Math.max(0, 1 - Math.pow((top - y) / ry, 2))) * rx;
                g.strokeStyle = S.lidLine || line; g.lineWidth = 5.5 * W;
                g.beginPath(); g.moveTo(x - hw - 1, top - s * sl * (hw / (rx + 4))); g.lineTo(x + hw + 1, top + s * sl * (hw / (rx + 4))); g.stroke();
            } else if (S.lashes) {
                g.strokeStyle = line; g.lineWidth = 5.5;
                g.beginPath(); g.ellipse(x, y, rx + 1, ry + 1, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
                g.lineWidth = 4.5; g.beginPath(); g.moveTo(x + s * (rx - 2), y - ry * 0.55); g.quadraticCurveTo(x + s * (rx + 6), y - ry * 0.62, x + s * (rx + 9), y - ry * 0.85); g.stroke();
            }
        };
        // a shut eye: a curve, up (laughing: ^) or down (resting, blinking), or sad (tilted)
        const shut = (s, happy, dy, sad) => {
            if (S.noEyes) return;
            const x = X + s * EX, y = EY + (dy || 0) + (happy ? 4 : 2), k = S.er[0] / 21;
            g.strokeStyle = shutC; g.lineWidth = 6.5 * W;
            g.beginPath();
            if (happy) { g.moveTo(x - 17 * k, y + 6 * k); g.quadraticCurveTo(x, y - 16 * k, x + 17 * k, y + 6 * k); }
            else if (sad) { g.moveTo(x - 16 * k, y - (2 + s * 4) * k); g.quadraticCurveTo(x, y + 10 * k, x + 16 * k, y - (2 - s * 4) * k); }
            else { g.moveTo(x - 17 * k, y - 3 * k); g.quadraticCurveTo(x, y + 11 * k, x + 17 * k, y - 3 * k); }
            g.stroke();
            if (!happy && S.lashes) { g.lineWidth = 4; g.beginPath(); g.moveTo(x + s * 15 * k, y - 1); g.lineTo(x + s * 21 * k, y - 6); g.stroke(); }
        };
        // brows: lift raises them, tilt > 0 lowers their inner ends (cross), < 0 raises them (worried, sad)
        const brows = (lift, tilt) => {
            if (!S.brow) return;
            g.strokeStyle = S.brow; g.lineWidth = 6.5 * (S.browW || 1);
            const bw = S.browLen || 15;
            for (const s of [-1, 1]) {
                const x = X + s * EX, y = BY - (lift || 0) + (S.browSet || 0) * (tilt > 0 ? 0 : 0);
                const ti = ((tilt || 0) + (S.browTilt || 0)) * 9;
                g.beginPath(); g.moveTo(x - s * (bw - 1), y + ti); g.quadraticCurveTo(x + s * 1, y - (S.browArch != null ? S.browArch : 5) + ti * 0.4, x + s * bw, y + 1 - ti * 0.3); g.stroke();
            }
        };
        // mouths (in the style's colors; an open one dark inside with a tongue, edged when the body is dark)
        const M = S.ms || 1;
        const stroke = (w) => { g.strokeStyle = mouthC; g.lineWidth = w * W; };
        const smile = (w, dep) => { w *= M; dep *= M; stroke(5); g.beginPath(); g.moveTo(X - w, MY - dep * 0.3); g.quadraticCurveTo(X, MY + dep, X + w, MY - dep * 0.3); g.stroke(); };
        const open = (w, h, tongue) => {
            w *= M; h *= M;
            g.fillStyle = S.mouthIn || '#5e1f26';
            g.beginPath(); g.moveTo(X - w, MY - h * 0.3); g.quadraticCurveTo(X, MY - h * 0.45, X + w, MY - h * 0.3); g.bezierCurveTo(X + w * 0.9, MY + h * 0.9, X - w * 0.9, MY + h * 0.9, X - w, MY - h * 0.3); g.closePath(); g.fill();
            if (tongue !== false) { g.save(); g.clip(); ell(X, MY + h * 0.62, w * 0.62, h * 0.42, '#e7707e'); if (S.teeth) { g.fillStyle = '#fbf8f2'; g.fillRect(X - w, MY - h * 0.5, w * 2, h * 0.32); } g.restore(); }
            if (S.mouthRim) { g.strokeStyle = S.mouthRim; g.lineWidth = 3.5 * W; g.stroke(); }
        };
        const oh = (r) => { r *= M; ell(X, MY + 2, r * 0.8, r, S.mouthIn || '#5e1f26'); if (S.mouthRim) { g.strokeStyle = S.mouthRim; g.lineWidth = 3.5 * W; g.beginPath(); g.ellipse(X, MY + 2, r * 0.8, r, 0, 0, Math.PI * 2); g.stroke(); } };
        const frown = (w, dep) => { w *= M; dep *= M; stroke(5); g.beginPath(); g.moveTo(X - w, MY + dep * 0.6); g.quadraticCurveTo(X, MY - dep, X + w, MY + dep * 0.6); g.stroke(); };
        const wavy = (w) => { w *= M; stroke(4.5); g.beginPath(); g.moveTo(X - w, MY + 2); g.quadraticCurveTo(X - w / 2, MY - 6, X, MY + 1); g.quadraticCurveTo(X + w / 2, MY + 7, X + w, MY - 1); g.stroke(); };
        const flat = (w, up) => { w *= M; stroke(5); g.beginPath(); g.moveTo(X - w, MY + 1); g.quadraticCurveTo(X, MY + 1 + (up || 0), X + w, MY - 1 - (up || 0) * 0.6); g.stroke(); };
        const tears = () => { g.fillStyle = 'rgba(120,190,240,0.85)'; for (const s of [-1, 1]) { const x = X + s * (EX + 6); g.beginPath(); g.moveTo(x - 5, EY + 10); g.quadraticCurveTo(x + s * 2, EY + 40, x - 3 + s * 2, EY + 58); g.quadraticCurveTo(x + 7, EY + 40, x + 4, EY + 10); g.fill(); } };
        // (the resting mouth: a style can have its own, Maki's straight line, Kai's grin)
        const rest = () => { if (S.restMouth === 'flat') flat(10, 1); else if (S.restMouth === 'grin') open(15, 13); else smile(13, 7); };
        // ---- each expression
        blush(['happy', 'happytalk', 'joy', 'excited', 'love', 'cry'].includes(name) ? 1 : 0);
        freckles();
        // (Cece's nervous sweat drop, at her temple, unless she's happy)
        if (S.sweat && !['happy', 'happytalk', 'joy', 'excited', 'love'].includes(name)) { const x = X + EX + 30, y = EY - 26; g.fillStyle = '#8ec8f4'; g.beginPath(); g.moveTo(x, y - 12); g.quadraticCurveTo(x + 9, y + 2, x, y + 6); g.quadraticCurveTo(x - 9, y + 2, x, y - 12); g.fill(); ell(x - 2, y - 1, 2, 3, 'rgba(255,255,255,0.8)'); }
        if (S.nose) { const ny = EY + (MY - EY) * 0.52; g.strokeStyle = S.nose; g.lineWidth = 4.5; g.beginPath(); g.moveTo(X - 5, ny); g.quadraticCurveTo(X, ny + 5, X + 5, ny); g.stroke(); }
        switch (name) {
        case 'idle': brows(0, 0); eye(-1); eye(1); rest(); break;
        case 'blink': brows(0, 0); shut(-1); shut(1); rest(); break;
        case 'talk': brows(2, 0); eye(-1); eye(1); open(13, 15); break;
        case 'happy': brows(5, -0.2); shut(-1, true); shut(1, true); open(17, 17); break;
        case 'happytalk': brows(6, -0.2); shut(-1, true); shut(1, true); open(18, 24); break;
        case 'joy': brows(6, -0.2); eye(-1, { lid: 0 }); eye(1, { lid: 0 }); open(19, 20); break;
        case 'surprised': brows(14, -0.3); eye(-1, { wide: 1, small: 1, lid: 0 }); eye(1, { wide: 1, small: 1, lid: 0 }); oh(10); break;
        case 'sad': brows(2, -1.1); eye(-1, { lid: 0.32, slope: 0.7, look: [0, 4] }); eye(1, { lid: 0.32, slope: 0.7, look: [0, 4] }); frown(11, 6); break;
        case 'cry': brows(2, -1.2); shut(-1, false, 0, true); shut(1, false, 0, true); tears(); wavy(13); break;
        case 'excited': brows(10, -0.2); eye(-1, { star: 1, lid: 0 }); eye(1, { star: 1, lid: 0 }); open(20, 22); break;
        case 'determined': brows(-3, 1.1); eye(-1, { lid: 0.22, slope: -0.5 }); eye(1, { lid: 0.22, slope: -0.5 }); flat(12, 4); break;
        case 'worried': brows(6, -1.0); eye(-1, { look: [-2, 2], lid: 0 }); eye(1, { look: [-2, 2], lid: 0 }); wavy(12); break;
        case 'sleepy': brows(-1, 0); eye(-1, { lid: 0.55 }); eye(1, { lid: 0.55 }); oh(6); break;
        case 'wink': brows(4, 0); eye(-1, { lid: 0 }); shut(1, true); open(15, 13); break;
        case 'love': brows(6, -0.2); eye(-1, { heart: 1 }); eye(1, { heart: 1 }); open(16, 15); break;
        case 'annoyed': brows(-2, 0.6); eye(-1, { lid: 0.45, look: [3, 0] }); eye(1, { lid: 0.45, look: [3, 0] }); flat(10, -3); break;
        }
    },
});

/* the style test's corner of the test area: the five props redone (tools/blender/props2.py: a bench, a street lamp, an
   armchair, a strawberry shortcake on a café table, the shovel lying in the grass) beside the square, where Sarah,
   Maki, Kai, Ginger and Joe stand (LAB_CAST) */
const EnvStyle = {
    SPOTS: [['style_bench', 32.5, 25.1, 0], ['style_lamp', 29.9, 24.7, 0], ['style_armchair', 26.3, 25.9, 0.3], ['furn_cafe_table', 27.5, 25.8, 0],
        ['style_shovel', 31.3, 28.6, 0, 'lying']],
    build(group, a) {
        const none = { meshes: [] };
        if (!STYLE2 || !LAB || !a || a.id !== 'island' || typeof EnvModels === 'undefined' || !EnvModels.has('style_bench')) return none;
        const meshes = [];
        for (const [name, x, y, rot, how] of this.SPOTS) {
            if (!EnvModels.has(name)) continue;
            const gy = Env.groundH(x * TILE, y * TILE), m = new THREE.Matrix4();
            if (how === 'lying') m.makeRotationY(-0.5).multiply(new THREE.Matrix4().makeRotationZ(Math.PI / 2)).setPosition(x, gy + 0.035, y * R3_ZS);
            else m.makeRotationY(rot).setPosition(x, gy, y * R3_ZS);
            meshes.push(...EnvModels.instances(group, name, [m]));
            // (the cake on the table's top)
            if (name === 'furn_cafe_table' && EnvModels.has('style_cake')) {
                const A = EnvModels.models[name].anchors.top, top = A ? A[0].y : 0.72;
                meshes.push(...EnvModels.instances(group, 'style_cake', [new THREE.Matrix4().makeRotationY(0.6).setPosition(x, gy + top, y * R3_ZS)]));
            }
        }
        return { meshes };
    },
};
