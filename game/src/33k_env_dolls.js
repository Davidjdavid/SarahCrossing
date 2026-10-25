/* ---- 33k_env_dolls.js ---- */
/* People as dolls in the new 3D look (David's pick: simpler than Animal Crossing's people, dressed and done up at the
   tailor and the salon). A doll is put together from the same look and clothes as the HD pictures (hdSarahSpec,
   hdFolkSpec): a big round head with a painted face that blinks; hair built from rounded pieces for each style (the
   tips another color when they're dyed); a body cut for each style of clothes (sleeves long, short, none or wide; pants,
   tights, flares, or a skirt to the knee or the floor); shoes; glasses and hats. Its legs and arms swing at the joints as
   it walks and runs, as a doll's would. The poses not made yet (sitting, picking up, swinging a tool, fishing...) show
   the HD card instead. Units: one is the doll's height (DOLL.H world units), feet at 0, facing +z (south). */
const DOLL = { H: 1.62, R: 0.165 };     // height in world units; the head's radius (in doll units)
const EnvDolls = {
    dolls: new Map(), drawn: new Set(), mats: new Map(), geos: {},
    build(group, a) {
        this.group = new THREE.Group();
        group.add(this.group);
        for (const d of this.dolls.values()) this.drop(d);
        this.dolls = new Map();
        this.drawn = new Set();
        return { meshes: [], tick: (r3, a) => this.tick(r3, a) };
    },
    /* (the HD-2D view asks: is this one a doll right now? then it draws no card) */
    draws(e) { return (Env.on || (typeof EnvRoom !== 'undefined' && EnvRoom.on)) && this.drawn.has(e); },
    /* the dolls go where the new look is drawing: the island, or the room Sarah is in */
    attach(parent) {
        if (this.group && this.group.parent === parent) return;
        for (const d of this.dolls.values()) this.drop(d);
        this.dolls = new Map();
        this.drawn = new Set();
        if (!this.group) this.group = new THREE.Group();
        if (this.group.parent) this.group.parent.remove(this.group);
        parent.add(this.group);
    },
    /* who's a doll and how they look: Sarah (or whoever is visiting as themselves), the island's people (the food folks
       stay as they are), and friends playing along online */
    specOf(e) {
        if (e === G.player) return Online.visitor() ? hdFolkSpec(Online.who()) : hdSarahSpec();
        if (e.def) { if (e.def.human) return hdFolkSpec(e.def.human, npcWearing(e.id)); const f = this.folkOf(e); return f ? { folk: f, acc: npcWearing(e.id) } : null; }
        if (e.who) return e.who === 'sarah' ? hdRemoteSarah(e.look) : hdFolkSpec(e.who);
        if (e.kind === 'judge' || e.kind === 'ghost') { const f = this.folkOf(e); return f ? { folk: f } : null; }
        return null;
    },
    /* a food folk's model (folk_maki...: tools/blender/folks.py), once the models are in */
    folkOf(e) {
        // (and in the rooms, the Cozy Council's judges and the old keeper's ghost)
        const id = e.def ? e.def.sprite : e.kind === 'judge' ? String(e.frame || '').split('_')[0] : e.kind === 'ghost' ? 'ghost' : null;
        return id && typeof EnvModels !== 'undefined' && EnvModels.has('folk_' + id) ? id : null;
    },
    /* those who aren't neighbors but stand in a room now and then: the council's judges, the ghost near midnight */
    guests(a) { return a && a.interior ? a.ents.filter(e => (e.kind === 'judge' || (e.kind === 'ghost' && typeof Quests !== 'undefined' && Quests.ghostHere())) && this.folkOf(e)) : []; },
    /* sitting: Sarah on a bench, a neighbor seated or lounging */
    sitting(e) { return !!e.sit || (!!e.def && (isSeated(e) || isLounging(e))); },
    /* a shopkeeper behind the counter along the back wall stands on a step there, so they show over it */
    step(e) {
        const a = G.area;
        return a && a.interior && e.npc && a.room && a.room.staff === e.id && a.floor && e.y < (a.floor.y0 + 1.5) * TILE ? 0.38 : 0;
    },
    /* (every pose is a doll's now; only someone hidden has none) */
    canPose(e) { return !e.hidden; },
    tick(r3, a) {
        this.drawn.clear();
        const v = r3.view, near = (e) => !v || (e.x > v.x0 - 32 && e.x < v.x1 + 32 && e.y > v.y0 - 32 && e.y < v.y1 + 64);
        const who = [G.player].concat(NPCs.here().filter(n => n.def && (n.def.human || this.folkOf(n))), Online.here(), this.guests(a));
        for (const [e, d] of this.dolls) if (!who.includes(e)) { this.drop(d); this.dolls.delete(e); }
        for (const e of who) {
            if (e && !near(e)) { const d1 = this.dolls.get(e); if (d1) d1.root.visible = false; continue; }
            const d0 = e && this.dolls.get(e);
            if (!e || !this.canPose(e)) { if (d0) d0.root.visible = false; continue; }
            const spec = this.specOf(e);
            if (!spec) continue;
            const key = JSON.stringify(spec);
            let d = d0;
            if (d && d.key !== key) { this.drop(d); d = null; }
            if (!d) { d = spec.folk ? this.makeFolk(spec) : this.make(spec); d.key = key; this.dolls.set(e, d); this.group.add(d.root); }
            if (d.folk) this.poseFolk(d, e); else this.pose(d, e);
            this.drawn.add(e);
        }
    },
    drop(d) {
        if (d.root.parent) d.root.parent.remove(d.root);
        for (const t of d.textures || []) t.dispose();
        for (const g of d.geos || []) g.dispose();
        if (d.faceMat) d.faceMat.dispose();
        if (d.hairMat) d.hairMat.dispose();
    },

    /* ---------------------------------------------------------------- moving */
    /* each pose as where the joints want to be: the arms (forward and out, radians), the legs forward, the body's lean
       and how far it sinks, the head's tilt; the doll eases into it */
    POSES: {
        cheer: { aF: [0, 0], aO: [2.75, 2.75], hop: 1 },
        happy: { aF: [-0.3, -0.3], aO: [1.35, 1.35], hop: 1, head: 0.12 },
        left: { aF: [0, -0.2], aO: [2.4, 0.25], lean: 0.12 },
        right: { aF: [-0.2, 0], aO: [0.25, 2.4], lean: -0.12 },
        pick: { aF: [-1.1, -1.1], aO: [0.2, 0.2], bend: 0.55, sink: 0.07, head: 0.25 },
        hug: { aF: [-1.35, -1.35], aO: [0.35, 0.35] },
        fish: { aF: [-0.95, -0.95], aO: [0.22, 0.22], rod: 1 },
        sit: { aF: [-0.55, -0.55], aO: [0.1, 0.1], legs: -1.5, sit: 1 },
        axe0: { aF: [-2.7, -2.7], aO: [0.12, 0.12], bend: -0.12 },
        axe1: { aF: [-0.75, -0.75], aO: [0.1, 0.1], bend: 0.3, sink: 0.02 },
        dig0: { aF: [-0.6, -0.6], aO: [0.15, 0.15], bend: 0.35, sink: 0.04 },
        dig1: { aF: [-1.5, -1.5], aO: [0.15, 0.15], bend: -0.05 },
    },
    pose(d, e) {
        const walk = !!(e.moving || e.walking || e.glide || e.pose === 'walk'), run = walk && !!e.run && !e.glide, t = G.t;
        const m = hdMotion(e, walk), P = d.parts, sit = this.sitting(e), seed = e === G.player ? 1 : hdSeed(e.id || e.who || 0);
        // which pose: sitting, a tool mid-swing, one of the game's poses (or none: standing, walking, running)
        let pk = sit ? 'sit' : null;
        if (!pk && e.tool) { const k = e.tool.kind, ph = e.tool.t < (k === 'axe' ? 10 : 12) ? 0 : 1; pk = k === 'axe' ? 'axe' + ph : 'dig' + ph; }
        if (!pk && e.pose && e.pose !== 'walk') pk = e.pose;
        const Q = pk && this.POSES[pk];
        // the way it faces (a pose like cheering faces us, as the HD pictures do)
        const face = Q && !e.tool && !Q.rod && pk !== 'sit' ? 2 : m.face;
        const ang = [Math.PI / 2, Math.PI / 4, 0, -Math.PI / 4, -Math.PI / 2, -Math.PI * 3 / 4, Math.PI, Math.PI * 3 / 4][sit ? 2 : face];
        if (d.ang == null) d.ang = ang;
        let da = ang - d.ang;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        d.ang += da * 0.35;
        const root = d.root;
        root.visible = true;
        // (sitting on a bench: the seat's height, legs out in front)
        const gy = Env.groundH(e.x, e.y) + this.step(e), sitY = Q && Q.sit ? gy + 0.46 - 0.4 * DOLL.H : gy;
        root.position.set(e.x / TILE, sitY + (e.hop || 0) / TILE, e.y / TILE * R3_ZS + (Q && Q.sit ? 0.12 : 0));
        root.rotation.y = d.ang;
        // where the joints want to be
        const ph = m.dist / (run ? 34 : 26) * Math.PI * 2, sw = walk ? Math.sin(ph) * (run ? 0.85 : 0.5) : 0;
        const br = walk || Q ? 0 : Math.sin(t / 22 + seed) * 0.5 + 0.5;
        const W = { aLx: -sw * 0.85, aRx: sw * 0.85, aLz: -0.12 - br * 0.03, aRz: 0.12 + br * 0.03, lL: sw, lR: -sw,
            bx: run ? 0.16 : walk ? 0.05 : 0, by: walk ? Math.abs(Math.cos(ph)) * (run ? 0.03 : 0.016) : br * 0.004, hx: -0.2 - (run ? 0.1 : 0), bz: 0 };
        if (Q) {
            // (cheering and the like bounce on the beat)
            const hop = Q.hop ? Math.abs(Math.sin(t / 6)) * 0.035 : 0;
            Object.assign(W, { aLx: Q.aF[0], aRx: Q.aF[1], aLz: -Q.aO[0], aRz: Q.aO[1], lL: Q.legs || 0, lR: Q.legs || 0, bx: Q.bend || 0, by: hop - (Q.sink || 0), hx: -0.2 + (Q.head || 0), bz: Q.lean || 0 });
        }
        // eased (snappy enough for a dance step, never a jump)
        const k = 0.38, ease = (o, key, v) => { o[key] += (v - o[key]) * k; };
        ease(P.armL.rotation, 'x', W.aLx); ease(P.armR.rotation, 'x', W.aRx); ease(P.armL.rotation, 'z', W.aLz); ease(P.armR.rotation, 'z', W.aRz);
        ease(P.legL.rotation, 'x', W.lL); ease(P.legR.rotation, 'x', W.lR);
        ease(P.body.rotation, 'x', W.bx); ease(P.body.rotation, 'z', W.bz); ease(P.body.position, 'y', W.by); ease(P.head.rotation, 'x', W.hx);
        // what's in the hand: the tool being carried or swung, the fishing rod
        const tool = Q && Q.rod ? 'rod' : e === G.player ? heldTool() : null;
        if (tool !== d.tool) { if (d.toolMesh) { d.toolMesh.parent.remove(d.toolMesh); d.toolMesh = null; } d.tool = tool; if (tool) d.toolMesh = this.toolModel(d, tool); }
        // the eyes shut for a moment every few seconds
        const blink = hdBlinkNow(seed);
        if (blink !== d.blink) { d.blink = blink; d.faceMat.map = blink ? d.faceShut : d.faceOpen; }
    },
    /* a tool in the hand: the axe, the shovel, the fishing rod */
    toolModel(d, kind) {
        const g = new THREE.Group(), wood = this.mat('#9a6a3a'), metal = this.mat('#a8adb4', 0.35);
        if (kind === 'axe') { this.piece(g, 'disc', wood, 0, 0.1, 0, 0.012, 0.36, 0.012); this.piece(g, 'box', metal, 0.035, 0.26, 0, 0.07, 0.06, 0.016); this.piece(g, 'box', this.mat('#c84a3a'), 0, 0.26, 0, 0.022, 0.07, 0.024); }
        else if (kind === 'shovel') { this.piece(g, 'disc', wood, 0, 0.0, 0, 0.011, 0.42, 0.011); this.piece(g, 'box', metal, 0, -0.24, 0, 0.07, 0.1, 0.012); this.piece(g, 'box', this.mat('#3a7ac8'), 0, 0.22, 0, 0.05, 0.02, 0.02); }
        else if (kind === 'rod') { this.piece(g, 'disc', this.mat('#c8783a'), 0, 0.22, 0, 0.007, 0.5, 0.007); this.piece(g, 'disc', this.mat('#3a3a42', 0.4), 0.018, 0.04, 0, 0.022, 0.012, 0.022, 0, 0, Math.PI / 2); }
        else return null;
        // held in the right hand (the +x arm), pointing forward for the rod, up along the arm for the others
        g.position.set(0, -0.245, 0.01);
        g.rotation.set(kind === 'rod' ? 1.2 : 0.35, 0, 0);
        d.parts.armR.add(g);
        return g;
    },

    /* ---------------------------------------------------------------- the food folks */
    /* a folk put together from its model: the body, and the parts that move about their joints (feet that step, eyes
       that shut, the gingerbread builder's arms and legs, the goat's legs); a hat or glasses a friend gave at the
       model's anchors */
    makeFolk(spec) {
        const M = EnvModels.models['folk_' + spec.folk], pre = spec.folk + '_';
        const d = { folk: spec.folk, parts: { eyes: [], feet: [], arms: [], legs: [] } }, P = d.parts;
        const root = d.root = new THREE.Group(), body = P.body = new THREE.Group();
        root.add(body);
        for (const p of M.parts) {
            const key = p.node.startsWith(pre) ? p.node.slice(pre.length) : p.node;
            const kind = /^eye_/.test(key) ? 'eyes' : /^foot_/.test(key) ? 'feet' : /^arm_/.test(key) ? 'arms' : /^leg_/.test(key) ? 'legs' : null;
            let geo = p.geometry;
            if (kind) { p.local = p.local || p.geometry.clone().translate(-p.at.x, -p.at.y, -p.at.z); geo = p.local; }
            let mat = p.material;
            // (the old keeper is a ghost: a little see-through)
            if (spec.folk === 'ghost') mat = p._ghost || (p._ghost = r3Patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0, transparent: true, opacity: 0.78, depthWrite: false }), { key: 'envghost', noDof: true }));
            const mesh = new THREE.Mesh(geo, mat);
            mesh.castShadow = spec.folk !== 'ghost'; mesh.receiveShadow = true;
            mesh.userData.shared = true;        // (the model's: kept when the island is built again)
            if (!kind) { body.add(mesh); continue; }
            const g = new THREE.Group();
            g.position.copy(p.at);
            g.add(mesh);
            // (the feet and legs stay on the ground when the body squashes; eyes, arms go with it)
            (kind === 'feet' || kind === 'legs' ? root : body).add(g);
            g.userData.side = /_l$|_fl$|_bl$/.test(key) ? -1 : 1;
            g.userData.back = /_b[lr]$/.test(key);
            P[kind].push(g);
        }
        // a gift: a hat on top, glasses on the face (made as a doll's, sized to the folk)
        const acc = spec.acc, L = { hairCol: '#5a3a2a' };
        if (acc) {
            const eye = EYE_ACCS.has(acc), A = M.anchors[eye ? 'eyes' : 'hat'], s = M.sizes[eye ? 'eyes' : 'hat'] || 1;
            if (A) {
                const g = new THREE.Group(), R = DOLL.R, k = eye ? 3.0 * s : 1.9 * s;
                g.scale.setScalar(k);
                if (eye) g.position.set(A[0].x, A[0].y + 0.05 * R * k, A[0].z - 0.86 * R * k);
                else g.position.set(A[0].x, A[0].y - 0.8 * 1.02 * R * k, A[0].z);
                body.add(g);
                this.extras(d, g, eye ? { eyes: acc } : { acc }, L);
            }
        }
        return d;
    },
    /* how a folk moves: a waddle and a hop as it walks (the HD pictures' hop), each foot stepping, a slow breath
       standing; it turns to where it's going, sits on a bench with its feet out, cheers with a bounce */
    poseFolk(d, e) {
        const walk = !!(e.moving || e.walking || e.glide), run = walk && !!(e.run || e.jog), t = G.t, P = d.parts;
        const m = hdMotion(e, walk), seed = hdSeed(e.id || 0), seat = isSeated(e), lounge = isLounging(e);
        const Q = e.pose && e.pose !== 'walk' ? e.pose : null;
        const face = seat || lounge || Q === 'cheer' || Q === 'happy' ? 2 : m.face;
        const ang = [Math.PI / 2, Math.PI / 4, 0, -Math.PI / 4, -Math.PI / 2, -Math.PI * 3 / 4, Math.PI, Math.PI * 3 / 4][face];
        if (d.ang == null) d.ang = ang;
        let da = ang - d.ang;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        d.ang += da * 0.3;
        const root = d.root;
        root.visible = true;
        // where it stands: on the ground (a bench's seat, a blanket, down in the spring's water for Wonton)
        const gy = Env.groundH(e.x, e.y) + this.step(e), hop = (e.hop || 0) / TILE * 0.6;
        let y = gy + hop, z = e.y / TILE * R3_ZS;
        if (seat) { y = gy + 0.36; z += 0.1; }
        else if (lounge) y = gy - 0.02;
        else if (e.def && e.def.spring) { const w = Env.waterH(e.x, e.y); y = (w != null ? w : gy) - 0.32; }
        else if (e.kind === 'ghost') y = gy + 0.18 + Math.sin(G.t / 13) * 0.06;
        root.position.set(e.x / TILE, y, z);
        root.rotation.y = d.ang;
        // the step: feet swinging in turn, the body rocking side to side, squashed as it lands and stretched in the air
        const ph = m.dist / (run ? 20 : 15) * Math.PI * 2, sw = walk ? Math.sin(ph) : 0, air = walk ? Math.min(1, (e.hop || 0) / 3) : 0;
        const br = Math.sin(t / 24 + seed);
        let sq = walk ? 0.05 * air - 0.05 * (1 - air) : 0.012 * br, lean = 0, roll = walk ? sw * 0.07 : 0, lift = 0;
        if (Q === 'cheer' || Q === 'happy') { const b = Math.abs(Math.sin(t / 6)); lift = b * 0.12; sq = 0.06 * b - 0.04 * (1 - b); }
        else if (Q === 'hug') lean = 0.25;
        else if (Q === 'pick') lean = 0.35;
        else if (Q === 'left' || Q === 'right') roll = Q === 'left' ? 0.15 : -0.15;
        if (e.dancer) { const b = Math.abs(Math.sin(t / 9 + e.x)); sq = 0.05 * b - 0.03; roll = Math.sin(t / 18 + e.x) * 0.1; }
        root.position.y += lift;
        const k = 0.35, ease = (o, key, v) => { o[key] += (v - o[key]) * k; };
        ease(P.body.scale, 'y', 1 + sq); ease(P.body.scale, 'x', 1 - sq * 0.5); ease(P.body.scale, 'z', 1 - sq * 0.5);
        ease(P.body.rotation, 'x', lean); ease(P.body.rotation, 'z', roll);
        const out = seat || lounge;
        for (const f of P.feet) ease(f.rotation, 'x', out ? -1.2 : sw * 0.7 * f.userData.side);
        for (const l of P.legs) ease(l.rotation, 'x', out ? -1.3 : sw * 0.6 * l.userData.side * (l.userData.back ? -1 : 1));
        for (const a of P.arms) {
            const up = Q === 'cheer' || Q === 'happy';
            ease(a.rotation, 'z', up ? a.userData.side * -0.9 : 0);
            ease(a.rotation, 'y', walk ? sw * 0.35 : 0);
        }
        // the eyes shut for a moment every few seconds
        const blink = hdBlinkNow(seed);
        for (const g of P.eyes) g.scale.y = blink ? 0.1 : 1;
    },

    /* ---------------------------------------------------------------- materials and shapes */
    mat(hex, rough) {
        const k = hex + '|' + (rough || 0.75);
        let m = this.mats.get(k);
        if (!m) { m = r3Patch(new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), roughness: rough || 0.75, metalness: 0 }), { key: 'envdoll' }); m.userData.plain = true; this.mats.set(k, m); }
        return m;
    },
    /* a doll's pieces merged: every plain-colored piece of a joint (the body, a leg, an arm, the head) into one mesh with
       its colors in it, the hair into one: a handful of draws a doll instead of forty */
    bake(d) {
        const P = d.parts;
        if (!this.vc) this.vc = r3Patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, metalness: 0 }), { key: 'envdollvc' });
        d.geos = [];
        for (const g of [P.body, P.legL, P.legR, P.armL, P.armR, P.head]) {
            if (!g) continue;
            const plain = g.children.filter(m => m.isMesh && m.material.userData.plain), hair = g.children.filter(m => m.isMesh && m.material === d.hairMat);
            for (const [list, mat] of [[plain, this.vc], [hair, d.hairMat]]) {
                if (!list.length) continue;
                const geo = this.merge(list);
                for (const m of list) { g.remove(m); if (m.material === d.hairMat) m.geometry.dispose(); }
                const mesh = new THREE.Mesh(geo, mat);
                mesh.castShadow = true; mesh.receiveShadow = true;
                g.add(mesh);
                d.geos.push(geo);
            }
        }
    },
    merge(list) {
        const pos = [], nor = [], col = [], idx = [], v = new THREE.Vector3(), n3 = new THREE.Matrix3();
        let base = 0;
        for (const m of list) {
            m.updateMatrix();
            const g = m.geometry, Pa = g.attributes.position, Na = g.attributes.normal, Ca = g.attributes.color, c = m.material.color;
            n3.getNormalMatrix(m.matrix);
            for (let i = 0; i < Pa.count; i++) {
                v.fromBufferAttribute(Pa, i).applyMatrix4(m.matrix); pos.push(v.x, v.y, v.z);
                v.fromBufferAttribute(Na, i).applyMatrix3(n3).normalize(); nor.push(v.x, v.y, v.z);
                if (Ca) col.push(Ca.getX(i), Ca.getY(i), Ca.getZ(i)); else col.push(c.r, c.g, c.b);
            }
            if (g.index) for (let i = 0; i < g.index.count; i++) idx.push(base + g.index.getX(i));
            else for (let i = 0; i < Pa.count; i++) idx.push(base + i);
            base += Pa.count;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
        geo.setIndex(idx);
        geo.computeBoundingSphere();
        return geo;
    },
    geo(kind) {
        if (this.geos[kind]) return this.geos[kind];
        const L = (pts, seg) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg || 16);
        const cap = (len, r) => { const p = []; for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2; p.push([Math.sin(a) * r, -len + r - Math.cos(a) * r]); } for (let i = 6; i >= 0; i--) { const a = i / 6 * Math.PI / 2; p.push([Math.sin(a) * r, -r + Math.cos(a) * r]); } return L(p, 14); };
        const G = {
            ball: () => new THREE.SphereGeometry(1, 18, 14),
            head: () => new THREE.SphereGeometry(1, 40, 28),
            hcap: () => new THREE.SphereGeometry(1, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.58),
            cone: () => new THREE.ConeGeometry(1, 1, 14),
            ring: () => new THREE.TorusGeometry(1, 0.16, 8, 28),
            band: () => new THREE.TorusGeometry(1, 0.08, 6, 28),
            disc: () => new THREE.CylinderGeometry(1, 1, 1, 28),
            box: () => new THREE.BoxGeometry(1, 1, 1),
            leg: () => cap(0.37, 0.044),
            legw: () => cap(0.37, 0.052),
            arm: () => cap(0.25, 0.033),
            sleeve: () => cap(0.12, 0.042),
            fore: () => cap(0.14, 0.031),
            flare: () => L([[0.0, -0.37], [0.072, -0.37], [0.066, -0.3], [0.05, -0.18], [0.05, -0.02], [0.0, 0.0]]),
            wide: () => L([[0.0, -0.21], [0.075, -0.21], [0.06, -0.15], [0.038, -0.03], [0.0, 0.0]]),
            torso: () => L([[0.0, 0.0], [0.085, 0.0], [0.09, 0.03], [0.08, 0.11], [0.096, 0.19], [0.086, 0.24], [0.05, 0.272], [0.0, 0.278]], 20),
            pants: () => L([[0.0, -0.005], [0.09, -0.005], [0.094, 0.03], [0.088, 0.065], [0.0, 0.07]], 20),
            knee: () => L([[0.0, -0.17], [0.165, -0.17], [0.168, -0.155], [0.145, -0.09], [0.11, -0.02], [0.092, 0.03], [0.0, 0.03]], 22),
            floor: () => L([[0.0, -0.4], [0.195, -0.4], [0.198, -0.385], [0.17, -0.25], [0.13, -0.09], [0.093, 0.03], [0.0, 0.03]], 22),
            tutu: () => L([[0.0, -0.05], [0.2, -0.05], [0.21, -0.03], [0.19, 0.0], [0.12, 0.02], [0.0, 0.025]], 22),
            shoe: () => new THREE.SphereGeometry(1, 14, 10),
        };
        return (this.geos[kind] = G[kind]());
    },
    piece(parent, kind, mat, x, y, z, sx, sy, sz, rx, ry, rz) {
        const m = new THREE.Mesh(this.geo(kind), mat);
        m.position.set(x, y, z);
        if (sx != null) m.scale.set(sx, sy == null ? sx : sy, sz == null ? sx : sz);
        if (rx || ry || rz) m.rotation.set(rx || 0, ry || 0, rz || 0);
        m.castShadow = true; m.receiveShadow = true;
        parent.add(m);
        return m;
    },

    /* ---------------------------------------------------------------- putting one together */
    make(spec) {
        const L = spec.look || LOOK_DEFAULT, C = spec.clothes || { style: 'toppants', top: '#c0303a', trim: '#f4f0e6', bottom: '#4d6d9f', shoes: '#f3f1ee' };
        const st = HD_STYLE[C.style] || HD_STYLE.toppants, skin = this.mat(L.skin || '#fbd9c6', 0.6), top = this.mat(C.top || '#c0303a'), trim = this.mat(C.trim || C.top || '#f4f0e6');
        const bottom = this.mat(C.bottom || C.top || '#4d6d9f'), shoes = this.mat(C.shoes || '#f3f1ee', 0.5);
        const d = { textures: [], parts: {} }, P = d.parts;
        const root = d.root = new THREE.Group();
        root.scale.setScalar(DOLL.H);
        const body = P.body = new THREE.Group();
        root.add(body);
        // legs from the hips (tights and pants in the bottom's color, bare under a skirt), shoes on the ends
        const legMat = st.skirt && !st.legs ? skin : bottom;
        for (const s of [-1, 1]) {
            const g = new THREE.Group();
            g.position.set(s * 0.047, 0.4, 0);
            body.add(g);
            this.piece(g, st.legs === 'flare' ? 'flare' : st.legs === 'pants' ? 'legw' : 'leg', legMat, 0, 0, 0);
            this.piece(g, 'shoe', shoes, 0, -0.36, 0.022, 0.052, 0.036, 0.078);
            if (C.skates) { for (const w of [-0.04, 0.05]) this.piece(g, 'disc', this.mat('#f2c84a', 0.4), 0, -0.392, w, 0.018, 0.04, 0.018, 0, 0, Math.PI / 2); }
            P[s < 0 ? 'legL' : 'legR'] = g;
        }
        // the body: hips, a top (the whole of it in a one-piece), a skirt
        const torso = this.piece(body, 'torso', top, 0, 0.395, 0, 1.15, 1, 0.86);
        if (!st.one && !st.skirt) this.piece(body, 'pants', bottom, 0, 0.395, 0, 1.17, 1, 0.88);
        if (st.skirt) this.piece(body, st.skirt === 'floor' ? 'floor' : st.skirt === 'tutu' ? 'tutu' : 'knee', st.one ? top : bottom, 0, st.skirt === 'tutu' ? 0.43 : 0.45, 0, 1.12, 1, 0.92);
        // what's on the front: trim at the neck and the hem, lapels, a bib, buttons, a belt or an obi
        if (!st.straps) this.piece(body, 'band', trim, 0, 0.665, 0, 0.062, 0.062, 0.062, Math.PI / 2);
        if (!st.one && !st.skirt) this.piece(body, 'band', trim, 0, 0.465, 0, 0.098 * 1.15, 0.098 * 0.86, 0.098, Math.PI / 2);
        if (st.belt || st.obi || st.sash) this.piece(body, 'ring', st.belt ? this.mat('#3a2a22') : trim, 0, 0.47, 0, 0.1 * 1.13, 0.1 * 0.86, st.obi ? 0.16 : 0.1, Math.PI / 2);
        if (st.lapels || st.open) for (const s of [-1, 1]) this.piece(body, 'box', trim, s * 0.03, 0.6, 0.078, 0.018, 0.12, 0.012, 0, 0, s * 0.35);
        if (st.tie) this.piece(body, 'box', trim, 0, 0.57, 0.083, 0.018, 0.13, 0.01);
        if (st.bib) {
            this.piece(body, 'box', bottom, 0, 0.535, 0.074, 0.12, 0.12, 0.02);
            for (const s of [-1, 1]) this.piece(body, 'box', bottom, s * 0.05, 0.615, 0.02, 0.022, 0.1, 0.13, -0.15);
        }
        if (st.buttons || st.coat) for (let k = 0; k < 3; k++) this.piece(body, 'ball', trim, 0, 0.62 - k * 0.055, 0.083 - k * 0.004, 0.009);
        if (st.hood) this.piece(body, 'ball', top, 0, 0.66, -0.07, 0.08, 0.06, 0.06);
        if (st.cape) this.piece(body, 'box', trim, 0, 0.42, -0.085, 0.2, 0.42, 0.012, 0.12);
        if (st.straps) for (const s of [-1, 1]) this.piece(body, 'box', top, s * 0.05, 0.66, 0.0, 0.016, 0.03, 0.16);
        // arms from the shoulders: long sleeves in the top's color, short ones to the elbow, none, or wide ones
        for (const s of [-1, 1]) {
            const g = new THREE.Group();
            g.position.set(s * 0.132, 0.632, 0);
            body.add(g);
            if (st.sleeves === 'long') { this.piece(g, 'arm', top, 0, 0, 0); this.piece(g, 'band', trim, 0, -0.205, 0, 0.034, 0.034, 0.034, Math.PI / 2); }
            else if (st.sleeves === 'short') { this.piece(g, 'sleeve', top, 0, 0, 0); this.piece(g, 'fore', skin, 0, -0.1, 0); }
            else if (st.sleeves === 'wide') { this.piece(g, 'arm', skin, 0, 0, 0); this.piece(g, 'wide', top, 0, 0, 0); }
            else this.piece(g, 'arm', skin, 0, 0, 0);
            this.piece(g, 'ball', skin, 0, -0.245, 0.004, 0.036);
            P[s < 0 ? 'armL' : 'armR'] = g;
        }
        // the neck and the head (its face painted on), ears
        this.piece(body, 'disc', skin, 0, 0.685, 0, 0.034, 0.05, 0.034);
        const head = P.head = new THREE.Group();
        head.position.set(0, 0.835, 0);
        body.add(head);
        this.face(d, L);
        const hm = new THREE.Mesh(this.geo('head'), d.faceMat);
        hm.scale.set(DOLL.R, DOLL.R * 0.94, DOLL.R * 0.95);
        hm.castShadow = true; hm.receiveShadow = false;
        head.add(hm);
        for (const s of [-1, 1]) this.piece(head, 'ball', skin, s * DOLL.R * 0.97, -DOLL.R * 0.1, 0, 0.028, 0.034, 0.022);
        this.hair(d, head, L);
        this.extras(d, head, spec, L);
        this.bake(d);
        return d;
    },

    /* the face: painted on a picture wrapped round the head (the front of the head is a quarter of the way along it) */
    face(d, L) {
        const draw = (shut) => {
            const K = 4, cv = document.createElement('canvas');
            cv.width = 256 * K; cv.height = 128 * K;
            const g = cv.getContext('2d');
            g.scale(K, K);
            g.fillStyle = L.skin || '#fbd9c6'; g.fillRect(0, 0, 256, 128);
            const cx = 64, ey = 67;
            // (the features a little bigger than life, drawn round the eyes' line)
            g.translate(cx, ey); g.scale(1.15, 1.15); g.translate(-cx, -ey);
            if (L.blush) { g.fillStyle = 'rgba(240,120,130,0.32)'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * 17, ey + 10, 6.5, 3.6, 0, 0, Math.PI * 2); g.fill(); } }
            if (L.freckles) { g.fillStyle = 'rgba(150,90,60,0.55)'; for (const s of [-1, 1]) for (const [dx, dy] of [[11, 7], [14, 9], [17, 7], [13, 11]]) { g.beginPath(); g.arc(cx + s * dx, ey + dy, 0.55, 0, Math.PI * 2); g.fill(); } }
            // brows in the hair's color
            g.strokeStyle = L.hairCol || '#5a3622'; g.lineWidth = 1.3; g.lineCap = 'round';
            for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 6.5, ey - 9.5); g.quadraticCurveTo(cx + s * 10, ey - 11.4, cx + s * 13.5, ey - 9.8); g.stroke(); }
            for (const s of [-1, 1]) {
                const x = cx + s * 9.5;
                if (shut) { g.strokeStyle = '#3a2420'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x - 4, ey + 0.5); g.quadraticCurveTo(x, ey + 2.8, x + 4, ey + 0.5); g.stroke(); continue; }
                // a tall oval: the iris in the eyes' color, a dark pupil, a shine
                g.fillStyle = '#241612'; g.beginPath(); g.ellipse(x, ey, 4.6, 6.4, 0, 0, Math.PI * 2); g.fill();
                g.fillStyle = L.eyes || '#6c5236'; g.beginPath(); g.ellipse(x, ey + 0.9, 3.5, 4.9, 0, 0, Math.PI * 2); g.fill();
                g.fillStyle = '#1a0e0c'; g.beginPath(); g.ellipse(x, ey + 1.2, 2.0, 3.0, 0, 0, Math.PI * 2); g.fill();
                g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x - 1.5, ey - 2.1, 1.6, 0, Math.PI * 2); g.fill();
                g.beginPath(); g.arc(x + 1.4, ey + 2.7, 0.7, 0, Math.PI * 2); g.fill();
            }
            // a small smile, a hint of a nose
            g.strokeStyle = '#a8404a'; g.lineWidth = 1.1;
            g.beginPath(); g.moveTo(cx - 3, ey + 13); g.quadraticCurveTo(cx, ey + 15.4, cx + 3, ey + 13); g.stroke();
            g.fillStyle = 'rgba(200,120,100,0.35)'; g.beginPath(); g.ellipse(cx, ey + 8, 1.1, 0.8, 0, 0, Math.PI * 2); g.fill();
            const t = new THREE.CanvasTexture(cv);
            t.anisotropy = 4;
            d.textures.push(t);
            return t;
        };
        d.faceOpen = draw(false); d.faceShut = draw(true);
        d.faceMat = r3Patch(new THREE.MeshStandardMaterial({ map: d.faceOpen, roughness: 0.6, metalness: 0 }), { key: 'envdollface' });
    },

    /* hair: rounded pieces for each style round the head (in head radii from its middle); the lower part of the hair the
       tips' color when they're dyed */
    HAIR: {
        waves: [['cap'], ['ball', 0, -0.55, -0.42, 0.98, 1.12, 0.6], ['ball', -0.86, -0.32, 0.12, 0.32, 0.5, 0.36], ['ball', -0.92, -0.86, 0.02, 0.32, 0.46, 0.36],
            ['ball', 0.86, -0.32, 0.12, 0.32, 0.5, 0.36], ['ball', 0.92, -0.86, 0.02, 0.32, 0.46, 0.36], ['ball', -0.34, 0.8, 0.62, 0.5, 0.2, 0.22, 0, 0, 0.32], ['ball', 0.28, 0.84, 0.6, 0.46, 0.18, 0.22, 0, 0, -0.4]],
        sleek: [['cap'], ['ball', 0, -0.7, -0.48, 0.96, 1.28, 0.46], ['ball', -0.88, -0.55, 0.14, 0.22, 0.86, 0.3], ['ball', 0.88, -0.55, 0.14, 0.22, 0.86, 0.3]],
        bob: [['cap'], ['ball', 0, -0.25, -0.34, 1.12, 0.86, 0.76], ['ball', -0.9, -0.32, 0.2, 0.3, 0.6, 0.5], ['ball', 0.9, -0.32, 0.2, 0.3, 0.6, 0.5], ['ball', 0, 0.76, 0.66, 0.86, 0.24, 0.26]],
        pixie: [['cap', 1.06], ['ball', 0.15, 0.8, 0.64, 0.66, 0.2, 0.22, 0, 0, -0.3]],
        buzz: [['cap', 1.03]],
        bald: [],
        johncut: [['cap', 1.07], ['ball', -0.25, 0.86, 0.56, 0.7, 0.24, 0.34, 0, 0, 0.25]],
        joecut: [['cap', 1.07], ...[0, 1, 2, 3, 4, 5, 6, 7].map(k => ['ball', Math.cos(k * 0.8) * 0.55, 0.78 + (k % 2) * 0.1, Math.sin(k * 0.8) * 0.5, 0.34])],
        davidcut: [['cap', 1.07], ...[-0.5, -0.2, 0.1, 0.4].map((x, k) => ['cone', x, 1.0, 0.25 - k * 0.12, 0.2, 0.55, 0.2, -0.5, 0, -x * 0.6])],
        jamescut: [['cap', 1.07], ['ball', 0.3, 0.84, 0.58, 0.76, 0.24, 0.34, 0, 0, -0.35]],
        afro: [['ball', 0, 0.35, -0.3, 1.36, 1.26, 1.16]],
        friar: [['ring', 0, -0.05, -0.05, 1.0, 1.0, 1.0, Math.PI / 2 - 0.25]],
        mohawk: [['cap', 1.02], ...[0, 1, 2, 3].map(k => ['cone', 0, 0.95 - k * 0.1, 0.4 - k * 0.42, 0.16, 0.55, 0.3, -0.5 - k * 0.3])],
        curls: [['cap'], ...[-1, 1].flatMap(s => [['ball', s * 0.85, -0.35, 0.05, 0.34], ['ball', s * 0.9, -0.8, -0.05, 0.32], ['ball', s * 0.55, -0.6, -0.55, 0.36]]), ['ball', 0, -0.55, -0.7, 0.42], ['ball', 0, 0.8, 0.6, 0.8, 0.24, 0.28]],
        braids: [['cap'], ...[-1, 1].flatMap(s => [0, 1, 2, 3, 4].map(k => ['ball', s * (0.78 - k * 0.04), -0.35 - k * 0.38, 0.05 + k * 0.08, 0.2]))],
        ponytail: [['cap'], ['ball', 0, 0.4, -0.95, 0.3], ['ball', 0, -0.05, -1.12, 0.28], ['ball', 0, -0.55, -1.15, 0.26], ['ball', 0, -1.0, -1.05, 0.22]],
        bun: [['cap'], ['ball', 0, 0.85, -0.55, 0.46, 0.42, 0.42]],
        pigtails: [['cap'], ...[-1, 1].flatMap(s => [['ball', s * 1.08, 0.1, -0.25, 0.26], ['ball', s * 1.16, -0.35, -0.2, 0.25], ['ball', s * 1.14, -0.8, -0.1, 0.22]])],
        spacebuns: [['cap'], ['ball', -0.62, 0.88, -0.1, 0.38], ['ball', 0.62, 0.88, -0.1, 0.38]],
        mullet: [['cap', 1.07], ['ball', 0, -0.75, -0.55, 0.78, 0.92, 0.42]],
    },
    hair(d, head, L) {
        const list = this.HAIR[L.hair] || this.HAIR.bob, R = DOLL.R;
        const base = new THREE.Color(L.hairCol || '#5a3622'), tip = L.tipCol ? new THREE.Color(L.tipCol) : null;
        d.hairMat = r3Patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0 }), { key: 'envdollhair' });
        const meshes = [];
        let lo = 1e9, hi = -1e9;
        for (const [kind, x, y, z, sx, sy, sz, rx, ry, rz] of list) {
            let m;
            if (kind === 'cap') {
                // the cap over the top and back of the head, tipped back so its front edge sits above the brows
                const k = x || 1.09;
                m = new THREE.Mesh(this.geo('hcap').clone(), d.hairMat);
                m.scale.set(R * k, R * k * 0.96, R * k);
                m.rotation.x = -0.44;
            } else {
                m = new THREE.Mesh(this.geo(kind).clone(), d.hairMat);
                m.position.set(x * R, y * R, z * R);
                m.scale.set(sx * R, (sy == null ? sx : sy) * R, (sz == null ? sx : sz) * R);
                m.rotation.set(rx || 0, ry || 0, rz || 0);
            }
            m.castShadow = true; m.receiveShadow = true;
            m.updateMatrix();
            head.add(m);
            meshes.push(m);
            const p = m.geometry.attributes.position, v = new THREE.Vector3();
            for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(m.matrix); lo = Math.min(lo, v.y); hi = Math.max(hi, v.y); }
        }
        // the colors: the hair's own, and the tips' over the lowest part of it
        const v = new THREE.Vector3(), c = new THREE.Color();
        for (const m of meshes) {
            const p = m.geometry.attributes.position, col = new Float32Array(p.count * 3);
            for (let i = 0; i < p.count; i++) {
                v.fromBufferAttribute(p, i).applyMatrix4(m.matrix);
                const k = tip ? Math.max(0, Math.min(1, (lo + (hi - lo) * 0.42 - v.y) / ((hi - lo) * 0.3 + 1e-4))) : 0;
                c.copy(base).lerp(tip || base, k);
                const sh = 0.86 + 0.14 * Math.max(0, Math.min(1, (v.y - lo) / (hi - lo + 1e-4)));
                col[i * 3] = c.r * sh; col[i * 3 + 1] = c.g * sh; col[i * 3 + 2] = c.b * sh;
            }
            m.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
        }
        // a beard round the jaw
        if (L.beard) this.piece(head, 'ball', this.mat(L.beard, 0.7), 0, -0.6 * R, 0.5 * R, 0.72 * R, 0.42 * R, 0.44 * R);
    },

    /* glasses and hats */
    extras(d, head, spec, L) {
        const R = DOLL.R, dark = this.mat('#3a2a2a', 0.4), eyeY = -0.05 * R, fz = 0.93 * R;
        const eye = spec.eyes;
        if (eye === 'glasses' || eye === 'sunglasses') {
            for (const s of [-1, 1]) {
                this.piece(head, 'ring', dark, s * 0.38 * R, eyeY, fz, 0.2 * R, 0.2 * R, 0.2 * R);
                if (eye === 'sunglasses') this.piece(head, 'disc', this.mat('#1c1c24', 0.25), s * 0.38 * R, eyeY, fz, 0.2 * R, 0.02 * R, 0.2 * R, Math.PI / 2);
            }
            this.piece(head, 'box', dark, 0, eyeY + 0.03 * R, fz + 0.02 * R, 0.2 * R, 0.035 * R, 0.035 * R);
        } else if (eye === 'monocle') {
            this.piece(head, 'ring', this.mat('#d8b040', 0.3), 0.38 * R, eyeY, fz + 0.02 * R, 0.26 * R, 0.26 * R, 0.4 * R);
            this.piece(head, 'disc', this.mat('#d8eef8', 0.15), 0.38 * R, eyeY, fz + 0.01 * R, 0.24 * R, 0.01 * R, 0.24 * R, Math.PI / 2);
            this.piece(head, 'box', this.mat('#d8b040', 0.3), 0.62 * R, eyeY - 0.5 * R, fz - 0.05 * R, 0.02 * R, 0.6 * R, 0.02 * R, 0, 0, 0.3);
        }
        else if (eye === 'mustache') this.piece(head, 'ball', this.mat(L.hairCol || '#3a2418'), 0, -0.36 * R, 0.9 * R, 0.4 * R, 0.12 * R, 0.14 * R);
        const top = 1.02 * R, acc = spec.acc;
        const gold = this.mat('#e8c048', 0.35);
        const H = {
            sunhat: () => { this.piece(head, 'disc', this.mat('#f2dca0'), 0, top * 0.62, -0.05 * R, 1.6 * R, 0.05 * R, 1.6 * R, -0.12); this.piece(head, 'ball', this.mat('#f2dca0'), 0, top * 0.7, -0.08 * R, 0.85 * R, 0.55 * R, 0.85 * R); this.piece(head, 'band', this.mat('#e8708a'), 0, top * 0.72, -0.08 * R, 0.86 * R, 0.86 * R, 0.86 * R, Math.PI / 2 - 0.12); },
            beanie: () => { this.piece(head, 'ball', this.mat('#c84a5a'), 0, top * 0.35, -0.05 * R, 1.08 * R, 0.92 * R, 1.08 * R); this.piece(head, 'ring', this.mat('#e8e0d8'), 0, top * 0.25, 0, 1.05 * R, 1.05 * R, 1.05 * R, Math.PI / 2 - 0.3); this.piece(head, 'ball', this.mat('#e8e0d8'), 0, top * 1.25, -0.2 * R, 0.25 * R); },
            partyhat: () => { this.piece(head, 'cone', this.mat('#4ab0e0'), 0.2 * R, top * 1.35, 0, 0.42 * R, 0.85 * R, 0.42 * R, 0, 0, -0.25); this.piece(head, 'ball', this.mat('#f8d040'), 0.42 * R, top * 1.78, 0, 0.13 * R); },
            crown: () => { this.piece(head, 'disc', gold, 0, top * 0.95, 0, 0.62 * R, 0.3 * R, 0.62 * R); for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; this.piece(head, 'cone', gold, Math.sin(a) * 0.55 * R, top * 1.22, Math.cos(a) * 0.55 * R, 0.1 * R, 0.25 * R, 0.1 * R); } },
            tiara: () => { this.piece(head, 'ring', gold, 0, top * 0.74, 0.12 * R, 0.84 * R, 0.84 * R, 0.84 * R, Math.PI / 2 - 0.5); for (const s of [-1, 0, 1]) this.piece(head, 'cone', gold, s * 0.3 * R, top * 0.98 - Math.abs(s) * 0.08 * R, 0.66 * R - Math.abs(s) * 0.08 * R, 0.08 * R, (s ? 0.18 : 0.26) * R, 0.05 * R); this.piece(head, 'ball', this.mat('#f088c0', 0.3), 0, top * 0.9, 0.74 * R, 0.13 * R); },
            bow: () => { for (const s of [-1, 1]) this.piece(head, 'ball', this.mat('#ec4a6c'), 0.55 * R + s * 0.3 * R, top * 0.9, 0.3 * R, 0.32 * R, 0.22 * R, 0.13 * R, 0, 0, s * 0.3); this.piece(head, 'ball', this.mat('#c83a52'), 0.55 * R, top * 0.9, 0.36 * R, 0.11 * R); },
            flower: () => { for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; this.piece(head, 'ball', this.mat('#f6a8c8'), 0.74 * R + Math.cos(a) * 0.17 * R, top * 0.62 + Math.sin(a) * 0.17 * R, 0.56 * R, 0.13 * R, 0.13 * R, 0.06 * R); } this.piece(head, 'ball', this.mat('#f8d040'), 0.74 * R, top * 0.62, 0.62 * R, 0.08 * R); },
            flowercrown: () => { for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2; this.piece(head, 'ball', this.mat(['#f088a8', '#f8f4f8', '#f8d040', '#b494e0'][k % 4]), Math.sin(a) * 0.86 * R, top * 0.62 - Math.cos(a) * 0.14 * R, Math.cos(a) * 0.86 * R, 0.13 * R); } },
            headphones: () => { this.piece(head, 'ring', this.mat('#2a2a34'), 0, 0.15 * R, 0, 1.12 * R, 1.12 * R, 1.12 * R, 0, Math.PI / 2); for (const s of [-1, 1]) { this.piece(head, 'ball', this.mat('#e84a6a'), s * 1.06 * R, -0.12 * R, 0, 0.2 * R, 0.36 * R, 0.36 * R); this.piece(head, 'ball', this.mat('#2a2a34'), s * 1.16 * R, -0.12 * R, 0, 0.1 * R, 0.24 * R, 0.24 * R); } },
            piratehat: () => { this.piece(head, 'disc', this.mat('#2a2228'), 0, top * 0.75, 0, 1.25 * R, 0.08 * R, 0.85 * R); this.piece(head, 'ball', this.mat('#2a2228'), 0, top * 0.82, -0.05 * R, 0.9 * R, 0.6 * R, 0.85 * R); this.piece(head, 'ball', this.mat('#f4f0e6'), 0, top * 1.0, 0.78 * R, 0.12 * R); },
            wizardhat: () => { this.piece(head, 'disc', this.mat('#4a3a98'), 0, top * 0.7, 0, 1.3 * R, 0.06 * R, 1.3 * R); this.piece(head, 'cone', this.mat('#4a3a98'), 0, top * 1.45, -0.15 * R, 0.75 * R, 1.6 * R, 0.75 * R, -0.25); this.piece(head, 'ball', this.mat('#f8d040'), 0, top * 1.1, 0.7 * R, 0.1 * R); },
            catears: () => { for (const s of [-1, 1]) { this.piece(head, 'cone', this.mat('#3a3036'), s * 0.6 * R, top * 1.05, -0.05 * R, 0.28 * R, 0.46 * R, 0.14 * R, 0, 0, -s * 0.35); this.piece(head, 'cone', this.mat('#f0a0b4'), s * 0.6 * R, top * 1.02, 0.06 * R, 0.16 * R, 0.3 * R, 0.06 * R, 0, 0, -s * 0.35); } },
            halo: () => { this.piece(head, 'band', this.mat('#fff0a0', 0.2), 0, top * 1.45, 0, 0.7 * R, 0.7 * R, 0.7 * R, Math.PI / 2); },
            goathorns: () => { for (const s of [-1, 1]) this.piece(head, 'cone', this.mat('#d8c8a8'), s * 0.55 * R, top * 1.05, -0.2 * R, 0.15 * R, 0.55 * R, 0.15 * R, -0.6, 0, -s * 0.5); },
            chefhat: () => { this.piece(head, 'disc', this.mat('#fbfbf6'), 0, top * 1.05, -0.05 * R, 0.8 * R, 0.55 * R, 0.8 * R); this.piece(head, 'ball', this.mat('#fbfbf6'), 0, top * 1.55, -0.05 * R, 1.0 * R, 0.6 * R, 1.0 * R); },
        };
        if (acc && H[acc]) H[acc]();
    },
};
