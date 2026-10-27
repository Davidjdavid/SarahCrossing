/* ---- 33kb_doll_act.js ---- */
/* How the redone dolls and folks act (the style test, with 33ka_doll_kit.js): animation matters as much as the models
   (David, 26 October). Everyone breathes, shifts their weight and looks about when they stand; walks with knees and
   elbows bending, and Sarah runs with her arms out like a happy kid. Faces follow what's happening: the mouth moves
   while someone's line is typing, a line's mood shows when it's said (a gift loved, a boot given...), the game's emotes
   become faces (a heart, a bang of surprise, a sweat drop), and games get their own acting: in tag whoever's running
   away is thrilled, glances back over their shoulder, now and then stumbles, and celebrates a close escape; whoever's
   it sets their brows and leans into the chase. Each folk moves in its own way (FOLK_ACT): Maki small and precise,
   Kai loose and bouncy with arms flying, Ginger sturdy, stomping. */
const FOLK_ACT = {
    maki: { bounce: 0.55, arms: 0.45, sway: 0.25, look: 0.25, run: 'pump' },
    kai: { bounce: 1.35, arms: 1.4, sway: 1.3, look: 0.6, run: 'flail' },
    ginger: { bounce: 1.0, arms: 0.9, sway: 0.6, look: 0.45, run: 'out' },
    basil: { bounce: 0.9, arms: 0.8, sway: 0.6, look: 0.4, run: 'pump' },
    wonton: { bounce: 1.1, arms: 0.7, sway: 0.9, look: 0.5, run: 'out' },
    chili: { bounce: 1.3, arms: 1.3, sway: 0.8, look: 0.6, run: 'flail' },
    coco: { bounce: 0.8, arms: 0.7, sway: 0.7, look: 0.5, run: 'pump' },
    cece: { bounce: 0.7, arms: 0.6, sway: 0.4, look: 0.7, run: 'pump' },
    clementine: { bounce: 0.7, arms: 0.6, sway: 0.7, look: 0.3, run: 'out' },
    cuke: { bounce: 1.0, arms: 1.2, sway: 0.5, look: 0.4, run: 'pump' },
    sully: { bounce: 0.5, arms: 0.5, sway: 0.4, look: 0.3, run: 'pump' },
    brulee: { bounce: 0.7, arms: 0.7, sway: 0.6, look: 0.5, run: 'out' },
    mac: { bounce: 0.9, arms: 0.8, sway: 0.7, look: 0.4, run: 'pump' },
    fortune: { bounce: 0.8, arms: 0.7, sway: 0.6, look: 0.4, run: 'pump' },
    floss: { bounce: 1.2, arms: 1.0, sway: 1.0, look: 0.6, run: 'flail' },
    waffle: { bounce: 0.8, arms: 0.7, sway: 0.5, look: 0.4, run: 'pump' },
    wasabi: { bounce: 1.0, arms: 1.1, sway: 1.2, look: 0.5, run: 'out' },
};
/* the game's emotes as faces */
const EMOTE_FACE = { heart: 'love', sparkle: 'excited', sweat: 'worried', bang: 'surprised', note: 'happy', spicy: 'determined', laugh: 'happytalk', zzz: 'sleepy', dots: 'idle' };
/* the faces with their eyes open (they blink) */
const FACE_OPEN = new Set(['idle', 'talk', 'joy', 'surprised', 'sad', 'worried', 'determined', 'annoyed', 'excited']);
Object.assign(EnvDolls, {
    /* ---------------------------------------------------------------- what someone is up to: their face and their acting */
    act(e, d) {
        const A = d.act || (d.act = { look: 0, lookT: 0, lookTo: 0, glanceT: 0, glanceAt: 120, stumbleT: 0, stumbleAt: 300, cheerT: 0, close: 0, mood: null, moodT: 0 });
        const t = G.t, seed = e === G.player ? 1 : hdSeed(e.id || e.who || 0);
        const out = { face: null, mode: null, target: null };
        // a game with a neighbor (tag: who's running from whom)
        const g = typeof IslandGames !== 'undefined' && IslandGames.on, p = G.player;
        if (g && g.phase === 'play' && g.kind === 'tag' && (e === p || e === g.n)) {
            const npc = e === g.n, it = npc ? g.it === 'npc' : g.it === 'sarah', other = npc ? p : g.n;
            const dist = Math.hypot(other.x - e.x, other.y - e.y) / TILE;
            out.target = other;
            if (it) { out.face = 'determined'; out.mode = 'chase'; }
            else {
                out.mode = 'flee';
                out.face = (t >> 5) % 5 === 0 ? 'joy' : 'excited';
                // a close call, then away: celebrate
                if (dist < 1.6) A.close = t;
                if (A.close && t - A.close < 140 && dist > 4.2 && !A.cheerT) { A.cheerT = 48; A.close = 0; }
                // a glance back over the shoulder every so often while running (more often when they're close)
                if (npc && e.moving) {
                    if (--A.glanceAt <= 0) { A.glanceT = 26; A.glanceAt = (dist < 3 ? 70 : 120) + (hash32(seed + ':' + (t >> 6)) % 80); }
                    // and now and then a stumble (never when they're about to be caught)
                    if (--A.stumbleAt <= 0) { if (dist > 2.2) A.stumbleT = 34; A.stumbleAt = 420 + hash32(seed + ':s' + (t >> 7)) % 400; }
                }
            }
        }
        if (A.glanceT > 0) { A.glanceT--; out.glance = Math.sin((1 - A.glanceT / 26) * Math.PI); }
        if (A.stumbleT > 0) { A.stumbleT--; out.stumble = A.stumbleT / 34; out.face = 'surprised'; }
        if (A.cheerT > 0) { A.cheerT--; out.cheer = A.cheerT / 48; out.face = 'excited'; }
        // the game's emotes over their head
        if (e.emote && e.emoteT > 0 && EMOTE_FACE[e.emote]) out.face = EMOTE_FACE[e.emote];
        // talking: the mouth moves while their line types, and the line's mood shows
        const id = e === p ? 'sarah' : e.id;
        if (typeof UI !== 'undefined' && UI.dialogOpen && UI._sp && UI._sp === id) {
            const mood = this.moodOf(id, UI._full);
            const open = UI._typing && (t >> 2) % 2 === 0;
            const base = mood || out.face || 'idle';
            out.face = open ? (base === 'happy' || base === 'love' ? 'happytalk' : base === 'sad' || base === 'cry' ? 'worried' : 'talk') : base;
            out.talking = UI._typing;
        }
        // sitting quietly, asleep
        if (e.sleeping) out.face = 'sleepy';
        // (the style test's gallery shows every face: __dbg, EnvDolls.forceFace)
        if (this.forceFace) { out.face = this.forceFace; A.lookTo = A.look = 0; }
        // standing: now and then a look round (some more curious than others)
        if (!e.moving && !out.mode && --A.lookT <= 0) { A.lookTo = (hash32(seed + ':l' + (t >> 6)) % 100 / 100 - 0.5) * 1.1; A.lookT = 150 + hash32(seed + ':' + (t >> 5)) % 260; if (A.lookT % 3 === 0) A.lookTo = 0; }
        A.look += ((e.moving || out.mode ? 0 : A.lookTo) - A.look) * 0.06;
        out.look = A.look;
        return out;
    },
    /* a line's mood, from what it is (a neighbor's gift lines) and how it reads */
    moodOf(id, text) {
        if (!text) return null;
        const T = typeof TALK !== 'undefined' && TALK[id];
        if (T) { if (text === fillText(T.loveLine || '')) return 'excited'; if (text === fillText(T.likeLine || '')) return 'happy'; if (text === fillText(T.dislikeLine || '')) return 'annoyed'; }
        if (/\b(sorry|oh no|aw+|sad|miss)\b/i.test(text)) return 'sad';
        if (/(!\?|\?!|\bwhoa\b|\bwow\b|\bwait\b)/i.test(text)) return 'surprised';
        if (/\b(ha+|haha|yay|love|thank)/i.test(text) || /!$/.test(text.trim())) return 'happy';
        return null;
    },
    /* the face to show now: blinking now and then while the eyes are open */
    showFace(d, e, face) {
        const seed = e === G.player ? 1 : hdSeed(e.id || e.who || 0), f = face || d.expr || 'idle';
        this.setFace(d, FACE_OPEN.has(f) && hdBlinkNow(seed) && !this.forceFace ? 'blink' : f);
    },

    /* ---------------------------------------------------------------- a redone doll */
    pose2(d, e) {
        const walk = !!(e.moving || e.walking || e.glide || e.pose === 'walk'), run = walk && !!e.run && !e.glide, t = G.t;
        const m = hdMotion(e, walk), P = d.parts, sit = this.sitting(e), seed = e === G.player ? 1 : hdSeed(e.id || e.who || 0);
        const A = this.act(e, d);
        let pk = sit ? 'sit' : null;
        if (!pk && e.tool) { const k = e.tool.kind, ph = e.tool.t < (k === 'axe' ? 10 : 12) ? 0 : 1; pk = k === 'axe' ? 'axe' + ph : k === 'can' ? 'water' : 'dig' + ph; }
        if (!pk && e.pose && e.pose !== 'walk') pk = e.pose;
        if (e === G.player && G.held && !sit) pk = 'holdup';
        const Q = pk && this.POSES[pk];
        // which way: where it's going (smoothly), or the way it faces; a pose faces us; a glance looks back at whoever
        // it's running from
        let ang;
        const sp = Math.hypot(m.vx, m.vy);
        if (Q && !e.tool && !Q.rod && !Q.face && pk !== 'sit') ang = 0;
        else if (walk && sp > 0.3 && !sit) ang = Math.atan2(m.vx, m.vy);
        else ang = [Math.PI / 2, Math.PI / 4, 0, -Math.PI / 4, -Math.PI / 2, -Math.PI * 3 / 4, Math.PI, Math.PI * 3 / 4][sit && !this.atTable(e) ? 2 : m.face];
        if (d.ang == null) d.ang = ang;
        let da = ang - d.ang;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        d.ang += da * (1 - Math.pow(0.7, Math.min(4, (G.frameMs || 16.7) / 16.7)));
        const root = d.root;
        root.visible = true;
        const gy = Env.groundH(e.x, e.y) + this.step(e), sitY = Q && Q.sit ? gy + 0.46 - 0.3 * DOLL2.H : gy;
        // (the celebration's jump)
        const cj = A.cheer ? Math.sin((1 - A.cheer) * Math.PI) * 0.3 : 0;
        root.position.set(e.x / TILE, sitY + (e.hop || 0) / TILE + cj, this.atTable(e) ? this.tableZ(e) : e.y / TILE * R3_ZS + (Q && Q.sit ? 0.12 : 0));
        root.rotation.y = d.ang + (A.cheer ? (1 - A.cheer) * Math.PI * 2 : 0);
        // the step: legs swing from the hips and bend at the knees coming forward; the arms swing against them
        const ph = m.dist / (run ? 30 : 24) * Math.PI * 2, s = walk ? Math.sin(ph) : 0, c = walk ? Math.cos(ph) : 0;
        const br = Math.sin(t / 26 + seed), shift = Math.sin(t / 97 + seed * 3);
        const legA = run ? 0.75 : 0.5, kneeA = run ? 1.25 : 0.7;
        const W = {
            lL: -s * legA, lR: s * legA, kL: 0.06 + (walk ? kneeA * Math.max(0, c) : Math.max(0, shift) * 0.12), kR: 0.06 + (walk ? kneeA * Math.max(0, -c) : Math.max(0, -shift) * 0.12),
            aLx: s * 0.7, aRx: -s * 0.7, aLz: -0.22 - br * 0.02, aRz: 0.22 + br * 0.02, eL: -0.18 - (walk ? 0.25 * Math.max(0, -s) : 0), eR: -0.18 - (walk ? 0.25 * Math.max(0, s) : 0),
            bx: run ? 0.2 : walk ? 0.06 : 0, bz: walk ? -s * 0.04 : shift * 0.025, by: walk ? Math.abs(c) * (run ? 0.034 : 0.014) : (br * 0.5 + 0.5) * 0.004,
            hx: -0.06 - (run ? 0.12 : 0), hy: A.look || 0, hz: walk ? s * 0.03 : 0,
        };
        // Sarah's run: arms out to her sides, flapping a little, as a happy kid runs
        if (run && e === G.player && A.mode !== 'chase') Object.assign(W, { aLz: -1.25 + s * 0.15, aRz: 1.25 + s * 0.15, aLx: 0.3 + s * 0.25, aRx: 0.3 - s * 0.25, eL: -0.15, eR: -0.15, hx: -0.2 });
        else if (A.mode === 'chase' && run) Object.assign(W, { aLx: s * 1.0, aRx: -s * 1.0, eL: -1.1, eR: -1.1, aLz: -0.15, aRz: 0.15, bx: 0.28 });
        else if (A.mode === 'flee' && run) Object.assign(W, { aLz: -0.6 - Math.abs(s) * 0.5, aRz: 0.6 + Math.abs(s) * 0.5, aLx: s * 0.6, aRx: -s * 0.6, eL: -0.5, eR: -0.5 });
        // a glance back over the shoulder: the head turns most of the way round, the body a little
        if (A.glance) { W.hy += 1.25 * A.glance * (Math.sin(seed) > 0 ? 1 : -1); W.bz += 0.08 * A.glance; }
        // a stumble: pitched forward, arms flung out, then caught
        if (A.stumble) { const k = Math.sin(A.stumble * Math.PI); W.bx += 0.65 * k; W.aLx = W.aRx = -1.6 * k; W.aLz = -0.6; W.aRz = 0.6; W.hx -= 0.3 * k; }
        // celebrating: arms up
        if (A.cheer) Object.assign(W, { aLz: -2.6, aRz: 2.6, aLx: 0, aRx: 0, eL: -0.2, eR: -0.2 });
        // talking: a nod with the words, a hand that talks too
        if (A.talking && !walk && !Q) { W.hx += Math.sin(t / 3.2) * 0.05; W.aRx = -0.45 + Math.sin(t / 7) * 0.15; W.aRz = 0.4; W.eR = -0.9; }
        // dancing on her own between the dance game's steps: bobbing on the beat, hips swaying, arms going (the dance-off's
        // other dancer too)
        if (!Q && !walk && typeof Dance !== 'undefined' && Dance.on && Dance.ready && Dance.info && (e === G.player || e === Dance.rival)) {
            const ph = Music.songTime() / (Dance.info.beat || 0.5) * Math.PI, b = Math.abs(Math.sin(ph)), sw = Math.sin(ph / 2);
            Object.assign(W, { by: -b * 0.025, kL: 0.12 + b * 0.3, kR: 0.12 + b * 0.3, lL: -b * 0.12, lR: -b * 0.12, bz: sw * 0.09, bx: 0.04, hz: -sw * 0.07, hx: -0.02 - b * 0.07, hy: sw * 0.15,
                aLx: -0.55 + sw * 0.45, aRx: -0.55 - sw * 0.45, aLz: -0.35, aRz: 0.35, eL: -1.25 + b * 0.2, eR: -1.25 + b * 0.2 });
        }
        if (Q) {
            const hop = Q.hop ? Math.abs(Math.sin(t / 6)) * 0.035 : 0;
            Object.assign(W, { aLx: Q.aF[0], aRx: Q.aF[1], aLz: -Q.aO[0], aRz: Q.aO[1], lL: Q.legs || 0, lR: Q.legs || 0, kL: Q.sit ? 1.45 : Q.bend ? 0.4 : 0.05, kR: Q.sit ? 1.45 : Q.bend ? 0.4 : 0.05,
                eL: Q.rod ? -0.6 : -0.2, eR: Q.rod ? -0.6 : -0.2, bx: Q.bend || 0, by: hop - (Q.sink || 0), hx: -0.06 + (Q.head || 0), bz: Q.lean || 0, hy: 0 });
            if (pk === 'hug') { W.eL = W.eR = -0.9; }
            // shaking a tree: both arms pushing and pulling at the trunk, the body rocking with them
            if (pk === 'shake') { const j = Math.sin(t * 1.7); W.aLx += j * 0.22; W.aRx += j * 0.22; W.eL = W.eR = -0.5 - j * 0.2; W.bz = j * 0.07; W.bx += j * 0.05; }
        }
        // (eased the same however often frames come)
        const k = 1 - Math.pow(0.7, Math.min(4, (G.frameMs || 16.7) / 16.7)), ease = (o, key, v) => { o[key] += (v - o[key]) * k; };
        ease(P.armL.rotation, 'x', W.aLx); ease(P.armR.rotation, 'x', W.aRx); ease(P.armL.rotation, 'z', W.aLz); ease(P.armR.rotation, 'z', W.aRz);
        if (P.elL) { ease(P.elL.rotation, 'x', W.eL); ease(P.elR.rotation, 'x', W.eR); }
        ease(P.legL.rotation, 'x', W.lL); ease(P.legR.rotation, 'x', W.lR);
        if (P.knL) { ease(P.knL.rotation, 'x', W.kL); ease(P.knR.rotation, 'x', W.kR); }
        ease(P.body.rotation, 'x', W.bx); ease(P.body.rotation, 'z', W.bz); ease(P.body.position, 'y', W.by);
        ease(P.head.rotation, 'x', W.hx); ease(P.head.rotation, 'y', W.hy); ease(P.head.rotation, 'z', W.hz);
        // what's in the hand
        const tool = Q && Q.rod ? 'rod' : e === G.player ? heldTool() : null;
        if (tool !== d.tool) { if (d.toolMesh) { d.toolMesh.parent.remove(d.toolMesh); d.toolMesh = null; } d.tool = tool; if (tool) d.toolMesh = this.toolModel2(d, tool); }
        // the face: the acting's, a pose's, Sarah running for joy
        const QF = { holdup: 'joy', cheer: 'excited', happy: 'happy', left: 'joy', right: 'joy', hug: 'happy', fish: 'determined', shake: 'determined', axe0: 'determined', axe1: 'determined', dig0: 'determined', dig1: 'determined', water: 'happy' };
        this.showFace(d, e, A.face || (pk && QF[pk]) || (run && e === G.player ? 'happy' : null));
    },
    /* a tool in a redone doll's hand: the shovel the style test made (props2.py), the others as before */
    toolModel2(d, kind) {
        // (the fishing rod, props2.py: held at its grip, pointing out forward and up; the line is tied at its tip: EnvFishing)
        if (kind === 'rod' && EnvModels.has('style_rod')) {
            const g = new THREE.Group();
            for (const p of EnvModels.models.style_rod.parts) { const m = new THREE.Mesh(p.geometry, p.material); m.castShadow = true; g.add(m); }
            g.scale.setScalar(1.05 / DOLL2.H);
            g.position.set(0, -0.1, 0.01);
            g.rotation.set(1.25, 0, 0);
            d.rodTip = new THREE.Object3D();
            d.rodTip.position.y = 1.0;
            g.add(d.rodTip);
            (d.parts.elR || d.parts.armR).add(g);
            return g;
        }
        if (kind === 'shovel' && EnvModels.has('style_shovel')) {
            const g = new THREE.Group();
            for (const p of EnvModels.models.style_shovel.parts) { const m = new THREE.Mesh(p.geometry, p.material); m.castShadow = true; g.add(m); }
            // (held at the grip end of the shaft, the blade down and forward; in doll units, the doll is scaled)
            g.scale.setScalar(0.55 / DOLL2.H);
            g.position.set(0, -0.04, 0.01);
            g.rotation.set(0.5, 0, 0);
            (d.parts.elR || d.parts.armR).add(g);
            return g;
        }
        if (kind === 'can') return this.canModel(d, d.parts.elR || d.parts.armR, -0.1);
        const g = this.toolModel(d, kind);
        if (g && d.parts.elR) { g.parent.remove(g); g.position.set(0, -0.11, 0.01); d.parts.elR.add(g); g.scale.setScalar(0.85); }
        return g;
    },

    /* ---------------------------------------------------------------- a redone folk */
    poseFolk2(d, e) {
        const walk = !!(e.moving || e.walking || e.glide), run = walk && !!(e.run || e.jog), t = G.t, P = d.parts;
        const m = hdMotion(e, walk), seed = hdSeed(e.id || 0), table = this.atTable(e), seat = isSeated(e) || table, lounge = isLounging(e);
        const F = FOLK_ACT[d.folk] || FOLK_ACT.ginger, A = this.act(e, d);
        const Q = e.pose && e.pose !== 'walk' ? e.pose : null;
        const sp = Math.hypot(m.vx, m.vy);
        let ang = ((seat && !table) || lounge || Q === 'cheer' || Q === 'happy') ? 0 : walk && sp > 0.3 ? Math.atan2(m.vx, m.vy) : [Math.PI / 2, Math.PI / 4, 0, -Math.PI / 4, -Math.PI / 2, -Math.PI * 3 / 4, Math.PI, Math.PI * 3 / 4][m.face];
        // a glance back: the whole folk turns to look at who's after it, still running the other way
        if (A.glance && A.target) { const back = Math.atan2(A.target.x - e.x, (A.target.y - e.y) * R3_ZS); let dd = back - ang; while (dd > Math.PI) dd -= Math.PI * 2; while (dd < -Math.PI) dd += Math.PI * 2; ang += dd * 0.8 * A.glance; }
        if (d.ang == null) d.ang = ang;
        let da = ang - d.ang;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        d.ang += da * (A.glance ? 0.45 : 0.28);
        const root = d.root;
        root.visible = true;
        const gy = Env.groundH(e.x, e.y) + this.step(e), hop = (e.hop || 0) / TILE * 0.6 * F.bounce;
        let y = gy + hop, z = e.y / TILE * R3_ZS;
        if (table) { y = gy + 0.44; z = this.tableZ(e); }
        else if (seat) { y = gy + 0.36; z += 0.1; }
        else if (lounge) y = gy - 0.02;
        else if (e.def && e.def.spring) { const w = Env.waterH(e.x, e.y); y = (w != null ? w : gy) - 0.32; }
        // (the old keeper floats, bobbing)
        else if (d.folk === 'ghost') y = gy + 0.18 + Math.sin(t / 13) * 0.06;
        // (standing on a stool behind a counter: 33kc_doll_stools.js)
        if (!seat && !lounge) y += EnvStools.height(e);
        const cj = A.cheer ? Math.sin((1 - A.cheer) * Math.PI) * 0.4 : 0;
        root.position.set(e.x / TILE, y + cj, z);
        root.rotation.y = d.ang + (A.cheer ? (1 - A.cheer) * Math.PI * 2 : 0);
        // the step: feet in turn, a waddle, squashed landing and stretched in the air (Kai's loose, Maki's neat)
        const ph = m.dist / (run ? 18 : 14) * Math.PI * 2, s = walk ? Math.sin(ph) : 0, air = walk ? Math.min(1, (e.hop || 0) / 3) : 0;
        const br = Math.sin(t / 24 + seed);
        let sq = walk ? (0.05 * air - 0.05 * (1 - air)) * F.bounce : 0.012 * br, lean = run ? 0.16 : walk ? 0.05 : 0, roll = walk ? s * 0.08 * F.sway : Math.sin(t / 40 + seed) * 0.02 * F.sway, lift = 0, yaw = A.look * F.look;
        if (Q === 'cheer' || Q === 'happy') { const b = Math.abs(Math.sin(t / 6)); lift = b * 0.12; sq = 0.06 * b - 0.04 * (1 - b); }
        else if (Q === 'hug') lean = 0.25;
        else if (Q === 'pick') { lean = 0.35; sq = -0.04; }
        else if (Q === 'shake') { lean = 0.18; roll = Math.sin(t * 1.7) * 0.12; }      // (shaking a fruit tree)
        else if (Q === 'left' || Q === 'right') { roll = Q === 'left' ? 0.18 : -0.18; lift = 0.04; }
        // (dancing at the club: a bounce on the beat, rocking side to side, a little turn now and then)
        const dance = !!e.dancer && !walk;
        if (dance) { const b = Math.abs(Math.sin(t / 9 + e.x)); sq = 0.06 * b - 0.035; roll = Math.sin(t / 18 + e.x) * 0.14; lift = b * 0.05; yaw += Math.sin(t / 36 + e.x) * 0.35; }
        // (sitting: leaning back a touch)
        if (seat) lean = -0.08;
        if (A.stumble) { const k = Math.sin(A.stumble * Math.PI); lean += 0.7 * k; sq -= 0.05 * k; }
        if (A.cheer) { sq = 0.08 * Math.sin((1 - A.cheer) * Math.PI); }
        if (A.talking) sq += Math.abs(Math.sin(t / 3)) * 0.025;
        root.position.y += lift;
        const k = 1 - Math.pow(0.68, Math.min(4, (G.frameMs || 16.7) / 16.7)), ease = (o, key, v) => { o[key] += (v - o[key]) * k; };
        ease(P.body.scale, 'y', 1 + sq); ease(P.body.scale, 'x', 1 - sq * 0.5); ease(P.body.scale, 'z', 1 - sq * 0.5);
        ease(P.body.rotation, 'x', lean); ease(P.body.rotation, 'z', roll); ease(P.body.rotation, 'y', yaw);
        const out = seat || lounge;
        for (const f of P.feet) ease(f.rotation, 'x', out ? -1.2 : s * 0.75 * f.userData.side);
        for (const l of P.legs) ease(l.rotation, 'x', out ? -1.3 : s * 0.65 * l.userData.side * (l.userData.back ? -1 : 1));
        // the arms: swinging as it walks; up for a cheer; each folk's own run (Maki pumps, Kai flails, Ginger holds them out)
        for (const a of P.arms) {
            const side = a.userData.side;
            // (fwd turns an arm about the up axis: -side * k swings it forward, +side * k back)
            let up = 0, fwd = walk ? s * 0.45 * F.arms * side : Math.sin(t / 30 + seed) * 0.04;
            if (seat || lounge) { up = -0.15; fwd = -side * 0.7; }
            if (Q === 'cheer' || A.cheer) up = 1.25;
            else if (Q === 'happy') { up = 0.95; fwd = -side * 0.2; }
            else if (Q === 'hug') { up = 0.3; fwd = -side * 1.15; }
            else if (Q === 'pick') { up = -0.1; fwd = -side * 0.9; }
            else if (Q === 'shake') { up = 0.45 + Math.sin(t * 1.7) * 0.15; fwd = -side * 1.1; }
            else if (Q === 'left' || Q === 'right') up = (Q === 'left') === (side < 0) ? 1.5 : 0.15;
            else if (dance) { up = 0.85 + Math.sin(t / 9 + e.x + (side > 0 ? Math.PI : 0)) * 0.55 * F.arms; fwd = -side * 0.25; }
            else if (run && (A.mode === 'flee' || F.run === 'flail')) { up = 0.7 + Math.sin(ph * 2 + side) * 0.6 * F.arms; fwd = 0; }
            else if (run && F.run === 'out') up = 0.55;
            else if (run) { up = 0.15; fwd = s * 0.8 * side; }
            if (A.stumble) { up = 0.4; fwd = 0.8 * side; }
            if (A.talking && side > 0) { up = 0.45 + Math.sin(t / 6) * 0.2; fwd = -0.3; }
            ease(a.rotation, 'z', side * up); ease(a.rotation, 'y', fwd);
        }
        this.showFace(d, e, A.face || (Q === 'cheer' ? 'excited' : Q === 'happy' ? 'happy' : null) || (run ? 'joy' : null));
    },
});
