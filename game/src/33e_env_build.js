/* ---- 33e_env_build.js ---- */
/* Buildings and the things round them for the new 3D look (33a_env.js): Sarah's cottage (cream plaster, a clay-tile roof
   with eaves and a chimney, framed windows with flower boxes, a red door with a wreath, in the colors of her house's look)
   and Fortune's shop (blue boards, a slate roof, a striped awning over the window, her sign); benches, lamp posts,
   mailboxes, picket fences, flower beds, flowers and pumpkins. Every part is a box or a slope in world units, colored per
   corner, so all the plaster on the island is one mesh, all the roofs another, and so on. Windows glow at night. */
const EnvBuild = {
    /* the props this draws (the rest stay HD cards) */
    props: { bench: 1, lamp: 1, mailbox: 1, fence: 1, flowerbed: 1 },
    /* the island's other props, made in Blender (tools/blender/props_island.py): kind -> [model, its size against the
       prop's footprint, how far back from the prop's foot its middle stands (tiles)] */
    PROP_MODELS: {
        fountain: ['fountain', 0.8, 0.55], drinkfountain: ['drinkfountain', 1, 0.45], board: ['board', 1, 0.4], plaque: ['plaque', 1, 0.45],
        trashcan: ['trashcan', 1, 0.45], statue_david: ['statue_david', 1.35, 1.0], sign_trail: ['signpost_trail', 1, 0.45], sign_farm: ['signpost_farm', 1, 0.45],
        sign_camp: ['signpost_camp', 1, 0.45], sign_bonfire: ['signpost_bonfire', 1, 0.45], sign_club: ['signpost_club', 1, 0.45], sign_island: ['signboard', 1, 0.45],
        windmill: ['windmill', 1, 1.2], well: ['well', 1, 0.5], scarecrow: ['scarecrow', 1, 0.45], hay: ['hay', 1, 0.45], crate: ['crate', 1, 0.45],
        wheelbarrow: ['wheelbarrow', 1, 0.5], trough: ['trough', 1.3, 0.45], birdhouse: ['birdhouse', 1, 0.45], flamingo: ['flamingo', 1, 0.45],
        log: ['log', 1.4, 0.45], campfire: ['campfire', 1, 0.45], bonfire: ['bonfire', 1, 0.5], picnic: ['picnic', 1.25, 0.6], telescope: ['telescope', 1, 0.45],
        viewer: ['viewer', 1, 0.45], tackle: ['tackle', 1, 0.45], driftwood: ['driftwood', 1, 0.45], icecream: ['icecream', 1.3, 0.55],
        sandcastle: ['sandcastle', 1, 0.45], volleyball: ['volleyball', 1, 0.4], boulder: ['rock_a', 1.7, 0.5], tent: [null, 1.3, 1.0], rock: [null, 1, 0.45],
        cart: ['noodle_cart', 1, 0.5],
    },
    /* the island's other buildings, made in Blender (tools/blender/buildings.py, model bld_<id>): id -> how far in front
       of its middle its front wall stands (each stands with its front wall on its footprint's front edge) */
    BUILDINGS: { postoffice: 1.3, bank: 1.3, townhall: 1.65, museum: 1.65, boutique: 1.3, salon: 1.3, studio: 1.3, displays: 1.3,
        restaurant: 1.3, arcade: 1.3, club: 1.3, builder: 1.3, lighthouse: 1.4, barn: 1.5 },
    /* the model a prop is drawn with in the new look, when it has one and it has arrived ([name, size, back]) */
    propModel(e) {
        const P = this.PROP_MODELS[e.kind];
        if (!P || typeof EnvModels === 'undefined') return null;
        const n = e.kind === 'tent' ? 'tent_' + ((e.tent || 0) % 3) : e.kind === 'rock' ? (hash32('rk' + e.x + ',' + e.y) % 2 ? 'rock_a' : 'rock_b') : P[0];
        return EnvModels.has(n) ? [n, P[1], P[2]] : null;
    },
    build(group, a) {
        this.season = a.bgSeason || Clock.season();
        const P = this.parts = {};
        const part = (name) => P[name] || (P[name] = { p: [], n: [], uv: [], c: [], idx: [] });
        this.part = part;
        // the furniture made in Blender (bench, lamp, mailbox, fence, planter, pumpkins), gathered and drawn instanced
        const placed = {}, has = n => typeof EnvModels !== 'undefined' && EnvModels.has(n);
        this.model = (n, x, y, z, rot, sc) => { if (!has(n)) return false; (placed[n] = placed[n] || []).push(EnvModels.mat4(x, y, z, rot || 0, sc || 1)); return true; };
        const mills = [];
        // (Basil's noodle cart is only out at night: its model is hidden by day)
        const nights = [];
        // (wild flowers can be picked and grow back: each one's model, kept by its spot, is hidden while it's gone)
        const picks = [];
        // (the tops of the chimneys: the cottage's and the kit's, where cottage.py and houses.py put them)
        const chimneys = this.chimneys = [];
        for (const e of a.ents) {
            if (e.kind === 'building' && e.b) {
                // Sarah's cottage is the one modelled in Blender (its door on the door's tile, its front wall on the front edge)
                if (e.id === 'home' && has('cottage')) { const A = this.at(e); for (const m of EnvModels.place(group, 'cottage', EnvModels.mat4(A.door, A.y, A.z1 - 1.25))) m.userData.shared = true; chimneys.push([A.door + 0.95, A.y + 3.55, A.z1 - 1.25 - 0.42]); }
                // and Fortune's (its door half a tile right of its middle)
                else if (e.id === 'shop' && has('shop')) { const A = this.at(e); for (const m of EnvModels.place(group, 'shop', EnvModels.mat4(A.door - 0.5, A.y, A.z1 - 1.3))) m.userData.shared = true; }
                // the island's other buildings, each its own model
                else if (this.BUILDINGS[e.id] && has('bld_' + e.id)) { const A = this.at(e); for (const m of EnvModels.place(group, 'bld_' + e.id, EnvModels.mat4(A.cx, A.y, A.z1 - this.BUILDINGS[e.id] - 0.05))) m.userData.shared = true; }
                // the neighbors' houses from the kit of parts, painted from each house's look
                else if (/^h_/.test(e.id || '') && this.house(group, e, houseLook(e.id))) { /* built */ }
                else if (e.id === 'home' || /^h_/.test(e.id || '')) this.cottage(e, houseLook(e.id)); else this.shop(e);
            }
            else if (this.propModel(e)) {
                const [n, sc, back] = this.propModel(e), f = this.foot(e);
                this.model(n, f.x, f.y, f.z - back * R3_ZS, 0, sc);
                if (n === 'windmill') mills.push(placed[n][placed[n].length - 1]);
                if (e.onlyNight) nights.push({ n, i: placed[n].length - 1, on: true });
            }
            else if (e.kind === 'bench') this.bench(e);
            else if (e.kind === 'lamp') this.lamp(e);
            else if (e.kind === 'mailbox') this.mailbox(e);
            else if (e.kind === 'fence') this.fence(e, a);
            else if (e.kind === 'flowerbed') this.flowerbed(e);
            else if (e.wildFlower) { const n = this.flower(e); if (n) picks.push({ idx: e.flowerIdx, n, i: placed[n].length - 1, on: true }); }
            else if (e.holiday && /pumpkin/.test(e.frame || '')) this.pumpkin(e);
        }
        this.decks();
        this.fields();
        // smoke from the chimneys in autumn and winter
        if (this.season === 'fall' || this.season === 'winter') EnvWater.smoke(group, chimneys);
        // the hot spring's rim of stones
        if (this.model && typeof EnvModels !== 'undefined' && EnvModels.has('rock_a')) for (let y = 0; y < W0.h; y++) for (let x = 0; x < W0.w; x++) {
            if (W0.grid[y][x] !== 'x') continue;
            const r = mulberry(hash32('rim' + x + ',' + y));
            for (let k = 0; k < 2; k++) { const px = x + 0.25 + r() * 0.5, pz = y + 0.25 + r() * 0.5; this.model(r() < 0.5 ? 'rock_a' : 'rock_b', px, EnvGround.heightAt(px, pz) - 0.05, pz * R3_ZS, r() * 6.28, 0.55 + r() * 0.35); }
        }
        const T = EnvTex, mats = {
            plaster: this.mat(T.plaster(), 0.9), roof: this.mat(T.roofTiles(), 0.8), slate: this.mat(T.slate(), 0.75), wood: this.mat(T.wood(), 0.85),
            boards: this.mat(T.boards(), 0.85), stone: this.mat(T.wall(), 0.95), plain: this.mat(null, 0.7), glass: this.glassMat(), cloth: this.mat(null, 0.95, true),
            sign: this.signMat(),
        };
        const meshes = [];
        for (const [name, b] of Object.entries(P)) {
            if (!b.p.length) continue;
            const g = new THREE.BufferGeometry();
            g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3));
            g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3));
            g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
            g.setAttribute('color', new THREE.Float32BufferAttribute(b.c, 3));
            g.setIndex(b.idx);
            g.computeBoundingSphere();
            const m = new THREE.Mesh(g, mats[name] || mats.plain);
            m.castShadow = true; m.receiveShadow = true;
            group.add(m);
            meshes.push(m);
        }
        // (a windmill's sails sit on its hub, turning)
        const hub = mills.length && has('windmill_sails') && (EnvModels.models.windmill.anchors.hub || [])[0];
        const sails = hub ? mills.map(M => M.clone().multiply(new THREE.Matrix4().makeTranslation(hub.x, hub.y, hub.z))) : [];
        if (sails.length) placed.windmill_sails = sails.map(M => M.clone());
        const inst = {};
        for (const [n, list] of Object.entries(placed)) for (const m of (inst[n] = EnvModels.instances(group, n, list))) { m.userData.shared = true; meshes.push(m); }
        const spin = new THREE.Matrix4(), turned = new THREE.Matrix4();
        this.glass = mats.glass;
        const none = new THREE.Matrix4().makeScale(0, 0, 0);
        let frame = 0;
        return { meshes, tick: (r3, a) => {
            const g = R3._glow || 0; this.glass.emissiveIntensity = 0.15 + g * 1.4; if (typeof EnvModels !== 'undefined') EnvModels.glow(g);
            if (sails.length) { spin.makeRotationZ(-performance.now() / 2400); sails.forEach((M, i) => { for (const m of inst.windmill_sails || []) { m.setMatrixAt(i, turned.multiplyMatrices(M, spin)); m.instanceMatrix.needsUpdate = true; } }); }
            if (frame++ % 20) return;
            const night = hourIn(Clock.hourF(), 21, 27);
            for (const p of nights) {
                if (p.on === night) continue;
                p.on = night;
                for (const m of inst[p.n] || []) { m.setMatrixAt(p.i, night ? placed[p.n][p.i] : none); m.instanceMatrix.needsUpdate = true; }
            }
            if (!picks.length) return;
            const live = new Set();
            for (const e of a.ents) if (e.wildFlower) live.add(e.flowerIdx);
            for (const p of picks) {
                const on = live.has(p.idx);
                if (on === p.on) continue;
                p.on = on;
                for (const m of inst[p.n] || []) { m.setMatrixAt(p.i, on ? placed[p.n][p.i] : none); m.instanceMatrix.needsUpdate = true; }
            }
        } };
    },
    /* the farm's fields: ridges of tilled soil in rows, the field's crop along them (crops.py), young in spring, full
       grown by autumn, the bare soil in winter */
    fields() {
        if (!this.model || !(W0.fields || []).length || typeof EnvModels === 'undefined' || !EnvModels.has('crop_soil')) return;
        const ZS = R3_ZS, season = this.season, grow = { spring: 0.55, summer: 0.85, fall: 1, winter: 0 }[season] ?? 1;
        for (const f of W0.fields) {
            const r = mulberry(hash32('field' + f.x + ',' + f.y)), crop = 'crop_' + f.crop, has = grow > 0 && EnvModels.has(crop);
            for (let ty = f.y; ty < f.y + f.h; ty++) for (const off of [0.28, 0.76]) {
                const z = ty + off;
                for (let tx = f.x; tx < f.x + f.w; tx++) {
                    if (!(W0.grid[ty] && W0.grid[ty][tx] === 'F')) continue;
                    this.model('crop_soil', tx + 0.5, EnvGround.heightAt(tx + 0.5, z) - 0.02, z * ZS, 0, 1);
                    if (!has) continue;
                    const per = f.crop === 'wheat' ? 3 : f.crop === 'pumpkin' ? (r() < 0.6 ? 1 : 0) : 2;
                    for (let k = 0; k < per; k++) {
                        const x = tx + (k + 0.5) / per + (r() - 0.5) * 0.08;
                        this.model(crop, x, EnvGround.heightAt(x, z) + 0.06, z * ZS, r() * Math.PI * 2, grow * (0.85 + r() * 0.3));
                    }
                }
            }
        }
    },
    /* the bridges and the pier: planks across the way you walk, a beam under each side; a bridge has a rail along each
       side (posts and two rails), the pier stands on posts down into the sea */
    decks() {
        const g = (x, y) => W0.grid[y] && W0.grid[y][x], seen = new Set(), ZS = R3_ZS;
        for (let y = 0; y < W0.h; y++) for (let x = 0; x < W0.w; x++) {
            if (g(x, y) !== 'w' || seen.has(x + ',' + y)) continue;
            const run = [], q = [[x, y]];
            seen.add(x + ',' + y);
            while (q.length) {
                const [cx, cy] = q.pop();
                run.push([cx, cy]);
                for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy, k = nx + ',' + ny; if (g(nx, ny) === 'w' && !seen.has(k)) { seen.add(k); q.push([nx, ny]); } }
            }
            const xs = run.map(t => t[0]), ys = run.map(t => t[1]), x0 = Math.min(...xs), x1 = Math.max(...xs) + 1, y0 = Math.min(...ys), y1 = Math.max(...ys) + 1;
            const sea = EnvGround.waterAt(x, y) === 1, top = EnvGround.deckH(x, y), mx = Math.floor((x0 + x1) / 2), my = Math.floor((y0 + y1) / 2);
            // the way across: north to south where there's ground at both ends (a pier: along its length)
            const dry = (tx, ty) => g(tx, ty) && g(tx, ty) !== 'w' && !EnvGround.waterAt(tx, ty);
            const ns = sea ? y1 - y0 >= x1 - x0 : dry(mx, y0 - 1) && dry(mx, y1);
            const r = mulberry(hash32('deck' + x + ',' + y));
            // (in "along/across" terms: a from a0 to a1 is the way across, c from c0 to c1 the width)
            const [a0, a1, c0, c1] = ns ? [y0, y1, x0, x1] : [x0, x1, y0, y1];
            const bx = (a, c, a2, c2, yb, yt, col) => ns ? this.box('wood', c, yb, a * ZS, c2, yt, a2 * ZS, col, 2) : this.box('wood', a, yb, c * ZS, a2, yt, c2 * ZS, col, 2);
            for (let a = a0; a < a1 - 0.01; a += 0.25) {
                const k = 0.88 + r() * 0.2, col = '#' + [0xa8 * k, 0x7a * k, 0x48 * k].map(v => Math.min(255, Math.round(v)).toString(16).padStart(2, '0')).join('');
                bx(a + 0.012, c0 + 0.03, a + 0.238, c1 - 0.03, top - 0.06, top, col);
            }
            for (const c of [c0 + 0.3, c1 - 0.3]) bx(a0, c - 0.07, a1, c + 0.07, top - 0.24, top - 0.06, '#6e4a2a');
            if (sea) {
                // posts down into the sea every two tiles, each side
                for (let a = a0 + 0.5; a < a1; a += 2) for (const c of [c0 + 0.12, c1 - 0.12]) bx(a - 0.08, c - 0.08, a + 0.08, c + 0.08, -1.8, top + 0.12, '#5e4026');
            } else {
                // a rail each side: posts every tile, a top rail and a middle one
                for (const c of [c0 + 0.06, c1 - 0.06]) {
                    for (let a = a0; a <= a1 + 0.01; a += 1) bx(Math.min(a1 - 0.1, Math.max(a0, a - 0.05)), c - 0.05, Math.min(a1, Math.max(a0 + 0.1, a + 0.05)), c + 0.05, top - 0.06, top + 0.62, '#7a5432');
                    bx(a0, c - 0.045, a1, c + 0.045, top + 0.54, top + 0.62, '#8f6438');
                    bx(a0, c - 0.03, a1, c + 0.03, top + 0.28, top + 0.34, '#8f6438');
                }
            }
        }
    },
    mat(t, rough, cloth) {
        const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: rough, metalness: 0, map: t ? t.map : null, normalMap: t ? t.normal : null, side: cloth ? THREE.DoubleSide : THREE.FrontSide });
        if (t) m.normalScale = new THREE.Vector2(0.8, 0.8);
        return r3Patch(m, { key: 'envbld' + (t ? 't' : '') + (cloth ? 'c' : ''), see: true });
    },
    glassMat() {
        return r3Patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.15, metalness: 0.1, emissive: new THREE.Color(0xffd890), emissiveIntensity: 0.15 }), { key: 'envglass', see: true });
    },
    /* Fortune's sign, painted on a canvas */
    signMat() {
        const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
        const g = cv.getContext('2d');
        g.fillStyle = '#3b2a20'; g.fillRect(0, 0, 256, 64);
        g.strokeStyle = '#d9a64a'; g.lineWidth = 4; g.strokeRect(4, 4, 248, 56);
        g.fillStyle = '#f2c96a'; g.font = 'bold 34px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText("FORTUNE'S", 128, 34);
        const t = new THREE.CanvasTexture(cv);
        return r3Patch(new THREE.MeshStandardMaterial({ map: t, roughness: 0.8, metalness: 0 }), { key: 'envsign' });
    },

    /* ---------------------------------------------------------------- building blocks (world units) */
    col(c) { return Array.isArray(c) ? c : EnvTex.hex(c).map(v => v / 255); },
    /* a flat four-cornered face: corners in order (counter-clockwise from outside), its normal, uv per corner, a color */
    quad(name, c, n, uv, color) {
        const b = this.part(name), base = b.p.length / 3, k = this.col(color);
        for (let i = 0; i < 4; i++) { b.p.push(...c[i]); b.n.push(...n); b.uv.push(...uv[i]); b.c.push(...k); }
        b.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    },
    /* a box from (x0,y0,z0) to (x1,y1,z1); uvs in world units times s (textures repeat per unit) */
    box(name, x0, y0, z0, x1, y1, z1, color, s, skip) {
        s = s || 1; skip = skip || {};
        const Q = (k, c, n, w, h) => { if (!skip[k]) this.quad(name, c, n, [[0, 0], [w * s, 0], [w * s, h * s], [0, h * s]], color); };
        const w = x1 - x0, h = y1 - y0, d = z1 - z0;
        Q('front', [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], w, h);
        Q('back', [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1], w, h);
        Q('left', [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0], d, h);
        Q('right', [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0], d, h);
        Q('top', [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [0, 1, 0], w, d);
        Q('bottom', [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0], w, d);
    },
    /* where a building stands: its footprint in world units, and the ground's height there */
    at(e) {
        const b = e.b, x0 = b.x, x1 = b.x + b.w, z0 = b.y * R3_ZS, z1 = (b.y + b.h) * R3_ZS;
        return { x0, x1, z0, z1, y: Env.groundH((b.x + b.w / 2) * TILE, (b.y + b.h) * TILE - 1), cx: (x0 + x1) / 2, door: b.x + b.door + 0.5 };
    },
    /* a gable roof over x0..x1, z0..z1, its eaves at y and its ridge h higher, overhanging by o (tiles or slate) */
    roof(name, x0, x1, z0, z1, y, h, o, color, trim) {
        const zc = (z0 + z1) / 2, X0 = x0 - o, X1 = x1 + o, Z0 = z0 - o, Z1 = z1 + o, top = y + h, yl = y - o * h / ((z1 - z0) / 2);
        const sl = Math.hypot(zc - Z1, top - yl), nf = [0, (Z1 - zc) / sl, (top - yl) / sl], nb = [0, (zc - Z0) / sl, -(top - yl) / sl];
        // front slope, back slope (uv: across, down the slope)
        const k = 0.42, U = (X1 - X0) * k, V = sl * k;
        this.quad(name, [[X0, yl, Z1], [X1, yl, Z1], [X1, top, zc], [X0, top, zc]], nf, [[0, V], [U, V], [U, 0], [0, 0]], color);
        this.quad(name, [[X1, yl, Z0], [X0, yl, Z0], [X0, top, zc], [X1, top, zc]], [0, nb[1], nb[2]], [[0, V], [U, V], [U, 0], [0, 0]], color);
        // the roof's thickness: boards along the eaves and up the gables
        const t = 0.09;
        this.box('plain', X0, yl - t, Z1 - 0.04, X1, yl, Z1 + 0.02, trim);
        // barge boards up both gables (front half and back half, each side), facing out
        for (const [xe, sx] of [[X0, -1], [X1, 1]]) for (const zE of [Z1, Z0]) {
            const lo = [[xe, yl - t, zE], [xe, top - t, zc], [xe, top + 0.02, zc], [xe, yl, zE]];
            this.quad('plain', sx > 0 === zE < zc ? lo : [lo[3], lo[2], lo[1], lo[0]], [sx, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], trim);
        }
        // a ridge cap
        this.box(name, X0 + 0.05, top - 0.04, zc - 0.09, X1 - 0.05, top + 0.08, zc + 0.09, this.col(color).map(v => v * 0.82), 1);
        return { top, zc };
    },
    /* the triangles under a gable roof, at x (facing left or right) */
    gable(name, x, z0, z1, y, h, color, dir) {
        const zc = (z0 + z1) / 2, b = this.part(name), base = b.p.length / 3, k = this.col(color);
        const pts = dir < 0 ? [[x, y, z0], [x, y, z1], [x, y + h, zc]] : [[x, y, z1], [x, y, z0], [x, y + h, zc]];
        for (const p of pts) { b.p.push(...p); b.n.push(dir, 0, 0); b.uv.push(p[2], p[1]); b.c.push(...k); }
        b.idx.push(base, base + 1, base + 2);
    },
    /* a window on the front wall at (x, y) (its middle), w by h, framed, with a cross, a sill and a flower box */
    window(x, y, z, w, h, trim, opt) {
        opt = opt || {};
        const f = 0.07;
        this.box('glass', x - w / 2, y - h / 2, z - 0.02, x + w / 2, y + h / 2, z + 0.01, [0.42, 0.6, 0.72]);
        this.box('plain', x - w / 2 - f, y + h / 2, z - 0.02, x + w / 2 + f, y + h / 2 + f, z + 0.07, trim);
        this.box('plain', x - w / 2 - f, y - h / 2 - f, z - 0.02, x + w / 2 + f, y - h / 2, z + 0.1, trim);
        this.box('plain', x - w / 2 - f, y - h / 2, z - 0.02, x - w / 2, y + h / 2, z + 0.06, trim);
        this.box('plain', x + w / 2, y - h / 2, z - 0.02, x + w / 2 + f, y + h / 2, z + 0.06, trim);
        this.box('plain', x - 0.025, y - h / 2, z, x + 0.025, y + h / 2, z + 0.04, trim);
        this.box('plain', x - w / 2, y - 0.025, z, x + w / 2, y + 0.025, z + 0.04, trim);
        if (opt.shutters) for (const sx of [-1, 1]) this.box('wood', x + sx * (w / 2 + f + 0.15) - 0.13, y - h / 2, z - 0.01, x + sx * (w / 2 + f + 0.15) + 0.13, y + h / 2, z + 0.05, opt.shutters, 2);
        if (opt.box) {
            const by = y - h / 2 - f - 0.2;
            this.box('wood', x - w / 2 - 0.05, by, z, x + w / 2 + 0.05, by + 0.2, z + 0.24, opt.box, 2);
            const r = mulberry(hash32('fb' + x + y));
            for (let i = 0; i < 7; i++) { const fx = x - w / 2 + 0.05 + (i + 0.5) / 7 * (w - 0.1), c = ['#f04a6a', '#ffd34a', '#ffffff', '#ff7ab8', '#b07af0'][r() * 5 | 0]; this.box('plain', fx - 0.05, by + 0.2, z + 0.06, fx + 0.05, by + 0.32 + r() * 0.06, z + 0.16, '#3f8a34'); this.box('plain', fx - 0.07, by + 0.3 + r() * 0.05, z + 0.05, fx + 0.07, by + 0.42, z + 0.19, c); }
        }
    },

    /* ---------------------------------------------------------------- the buildings */
    /* a neighbor's house from the kit made in Blender (tools/blender/houses.py): the body and roof of its style, the
       walls' pattern, its add-ons, each part's role (wall, roof, trim, door) painted in the house's own colors, so the
       look Ginger changes is the look you see; false when the parts haven't arrived */
    house(group, e, L) {
        const has = n => typeof EnvModels !== 'undefined' && EnvModels.has(n);
        const st = ['gable', 'peaked', 'tiled', 'flat', 'thatch'].includes(L.style) ? L.style : 'gable';
        const names = ['house_body_' + st, 'house_roof_' + st + (L.roof === 'rainbow' ? '_rainbow' : '')];
        if (!names.every(has)) return false;
        if (L.pattern && L.pattern !== 'plain') names.push('house_pattern_' + L.pattern);
        const sig = { bakery: 'awning', lantern: 'lamps' }[L.sig];
        for (const ad of ['boxes', 'shutters', 'lamps', 'plants', 'chimney', 'awning', 'band', 'wreath']) if (L[ad] || sig === ad) names.push('house_' + ad);
        const A = this.at(e), M = EnvModels.mat4(A.door, A.y, A.z1 - 1.1);
        if (names.includes('house_chimney') && this.chimneys) this.chimneys.push([A.door + 0.7, A.y + 2.95, A.z1 - 1.1 - 0.35]);
        for (const n of names) {
            if (!has(n)) continue;
            for (const m of EnvModels.place(group, n, M)) {
                m.userData.shared = true;
                const role = ((m.material.name || '').match(/house_(wall|roof|trim|door)(?!_rainbow)/) || [])[1];
                if (!role || /rainbow/.test(m.material.name)) continue;
                const c = L[role];
                if (!c || c === 'rainbow') continue;
                m.material = EnvModels.tinted(m.material, c); m.userData.ownMat = true;
            }
        }
        return true;
    },
    cottage(e, L) {
        const A = this.at(e), y = A.y, inset = 0.5, x0 = A.x0 + inset, x1 = A.x1 - inset, z0 = A.z0 + 0.5, z1 = A.z1 - 0.2, H = 1.22, RH = 1.02;
        const wall = L.wall || '#fbe7d0', roofC = L.roof || '#c8505a', trim = L.trim || '#ffffff', door = L.door || '#b3263a';
        // a stone footing, the plaster walls, white corners
        this.box('stone', x0 - 0.05, y - 0.3, z0 - 0.05, x1 + 0.05, y + 0.22, z1 + 0.05, '#b8b0a4', 1.6);
        this.box('plaster', x0, y + 0.22, z0, x1, y + H, z1, wall, 1);
        for (const cx of [x0, x1]) for (const cz of [z0, z1]) this.box('plain', cx - 0.07, y + 0.22, cz - 0.07, cx + 0.07, y + H, cz + 0.07, trim);
        this.gable('plaster', x0, z0, z1, y + H, RH, wall, -1);
        this.gable('plaster', x1, z0, z1, y + H, RH, wall, 1);
        const R = this.roof('roof', x0, x1, z0, z1, y + H, RH, 0.26, roofC, trim);
        // a chimney through the back of the roof, on the right
        const chx = x1 - 0.75, chz = z0 + 0.7;
        this.box('stone', chx - 0.18, y + H + 0.4, chz - 0.18, chx + 0.18, R.top + 0.38, chz + 0.18, '#a5584a', 1.8);
        this.box('stone', chx - 0.22, R.top + 0.38, chz - 0.22, chx + 0.22, R.top + 0.46, chz + 0.22, '#7a6a60', 1.8);
        // the door: frame, door, a little window in it, a knob, a step; a wreath
        const dx = A.door, fz = z1;
        this.box('plain', dx - 0.32, y + 0.2, fz - 0.02, dx + 0.32, y + 1.04, fz + 0.06, trim);
        this.box('wood', dx - 0.26, y + 0.2, fz, dx + 0.26, y + 0.98, fz + 0.08, door, 2);
        this.box('plain', dx + 0.15, y + 0.56, fz + 0.08, dx + 0.2, y + 0.61, fz + 0.13, '#e8c65a');
        this.box('stone', dx - 0.4, y - 0.05, fz, dx + 0.4, y + 0.12, fz + 0.3, '#c8c0b2', 1.6);
        this.wreath(dx, y + 0.74, fz + 0.12);
        // windows either side, shutters and flower boxes
        const shutters = L.shutters ? '#3f7a52' : null;
        for (const wx of [x0 + (dx - x0) * 0.45, dx + (x1 - dx) * 0.55]) this.window(wx, y + 0.76, fz, 0.42, 0.42, trim, { box: L.boxes === 0 ? null : '#8a5a33', shutters: shutters || '#4a7a5a' });
    },
    wreath(x, y, z) {
        for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, r = 0.15; this.box('plain', x + Math.cos(a) * r - 0.045, y + Math.sin(a) * r - 0.045, z, x + Math.cos(a) * r + 0.045, y + Math.sin(a) * r + 0.045, z + 0.06, i % 3 ? '#2f6a2a' : '#3f8a34'); }
        this.box('plain', x - 0.06, y - 0.2, z + 0.04, x + 0.06, y - 0.12, z + 0.09, '#d0302a');
    },
    shop(e) {
        const A = this.at(e), y = A.y, x0 = A.x0 + 0.45, x1 = A.x1 - 0.45, z0 = A.z0 + 0.5, z1 = A.z1 - 0.2, H = 1.36;
        const wall = '#5b86bd', trim = '#f2f0ea', roofC = '#7d8ea8', door = '#2f7a4a';
        this.box('stone', x0 - 0.05, y - 0.3, z0 - 0.05, x1 + 0.05, y + 0.2, z1 + 0.05, '#a8a094', 1.6);
        this.box('boards', x0, y + 0.2, z0, x1, y + H, z1, wall, 1.2);
        for (const cx of [x0, x1]) for (const cz of [z0, z1]) this.box('plain', cx - 0.07, y + 0.2, cz - 0.07, cx + 0.07, y + H, cz + 0.07, trim);
        this.gable('boards', x0, z0, z1, y + H, 1.05, wall, -1);
        this.gable('boards', x1, z0, z1, y + H, 1.05, wall, 1);
        this.roof('slate', x0, x1, z0, z1, y + H, 1.05, 0.28, roofC, trim);
        const dx = A.door, fz = z1;
        // the door (glass in the top half), its frame and step
        this.box('plain', dx - 0.32, y + 0.2, fz - 0.02, dx + 0.32, y + 1.08, fz + 0.06, trim);
        this.box('wood', dx - 0.26, y + 0.2, fz, dx + 0.26, y + 1.02, fz + 0.08, door, 2);
        this.box('glass', dx - 0.17, y + 0.6, fz + 0.07, dx + 0.17, y + 0.94, fz + 0.1, [0.5, 0.66, 0.76]);
        this.box('stone', dx - 0.5, y - 0.05, fz, dx + 0.5, y + 0.1, fz + 0.36, '#c8c0b2', 1.6);
        // the shop window (on the side of the door with more room), under a striped awning
        const left = dx - x0 > x1 - dx, wx0 = left ? x0 + 0.25 : dx + 0.5, wx1 = left ? dx - 0.5 : x1 - 0.25, wy0 = y + 0.42, wy1 = y + 0.98;
        this.box('glass', wx0, wy0, fz - 0.02, wx1, wy1, fz + 0.01, [0.48, 0.64, 0.74]);
        this.box('plain', wx0 - 0.07, wy1, fz - 0.02, wx1 + 0.07, wy1 + 0.08, fz + 0.07, trim);
        this.box('plain', wx0 - 0.07, wy0 - 0.12, fz - 0.02, wx1 + 0.07, wy0, fz + 0.14, trim);
        for (const xx of [wx0 - 0.07, wx1, (wx0 + wx1) / 2 - 0.035]) this.box('plain', xx, wy0, fz - 0.02, xx + 0.07, wy1, fz + 0.06, trim);
        this.awning(Math.min(wx0, dx - 0.5) - 0.15, Math.max(wx1, dx + 0.5) + 0.15, wy1 + 0.18, fz, ['#3f9a5a', '#f4f2ea']);
        // the sign over it all
        const sw = Math.min(2.4, x1 - x0 - 0.4), scx = A.cx;
        this.box('wood', scx - sw / 2 - 0.06, y + H - 0.04, fz + 0.02, scx + sw / 2 + 0.06, y + H + 0.42, fz + 0.1, '#5a3e28');
        this.quad('sign', [[scx - sw / 2, y + H, fz + 0.11], [scx + sw / 2, y + H, fz + 0.11], [scx + sw / 2, y + H + 0.38, fz + 0.11], [scx - sw / 2, y + H + 0.38, fz + 0.11]], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], [1, 1, 1]);
        // a chalkboard beside the door
        const bx = left ? dx + 0.75 : dx - 0.75;
        this.box('wood', bx - 0.24, y, fz + 0.45, bx + 0.24, y + 0.75, fz + 0.52, '#6a4a2a');
        this.box('plain', bx - 0.19, y + 0.14, fz + 0.52, bx + 0.19, y + 0.68, fz + 0.54, '#2a3a32');
    },
    /* a striped awning sloping out from the wall over x0..x1 at height y */
    awning(x0, x1, y, z, cols) {
        const n = Math.round((x1 - x0) / 0.26), out = 0.7, drop = 0.42;
        for (let i = 0; i < n; i++) {
            const a = x0 + (x1 - x0) * i / n, b = x0 + (x1 - x0) * (i + 1) / n, c = cols[i % 2];
            const sl = Math.hypot(out, drop), nn = [0, out / sl, drop / sl];
            this.quad('cloth', [[a, y - drop, z + out], [b, y - drop, z + out], [b, y, z + 0.02], [a, y, z + 0.02]], nn, [[0, 0], [1, 0], [1, 1], [0, 1]], c);
            // the scalloped edge
            this.quad('cloth', [[a, y - drop - 0.14, z + out + 0.01], [b, y - drop - 0.14, z + out + 0.01], [b, y - drop, z + out + 0.01], [a, y - drop, z + out + 0.01]], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], c);
        }
    },

    /* ---------------------------------------------------------------- things round the buildings */
    foot(e) { return { x: e.x / TILE, z: e.y / TILE * R3_ZS, y: Env.groundH(e.x, e.y) }; },
    bench(e) {
        const f = this.foot(e), x = f.x, z = f.z - 0.2, y = f.y, w = 1.7;
        if (this.model('bench', x, y, z + 0.05)) return;
        for (let i = 0; i < 3; i++) this.box('wood', x - w / 2, y + 0.42, z - 0.22 + i * 0.15, x + w / 2, y + 0.48, z - 0.1 + i * 0.15, '#b07a46', 2);
        for (let i = 0; i < 3; i++) this.box('wood', x - w / 2, y + 0.58 + i * 0.16, z - 0.3, x + w / 2, y + 0.7 + i * 0.16, z - 0.24, '#a8703e', 2);
        for (const sx of [-1, 1]) { const lx = x + sx * (w / 2 - 0.12); this.box('plain', lx - 0.04, y, z + 0.14, lx + 0.04, y + 0.45, z + 0.2, '#2c2a2e'); this.box('plain', lx - 0.04, y, z - 0.3, lx + 0.04, y + 1.05, z - 0.24, '#2c2a2e'); this.box('plain', lx - 0.04, y + 0.38, z - 0.3, lx + 0.04, y + 0.44, z + 0.2, '#2c2a2e'); }
    },
    lamp(e) {
        const f = this.foot(e), x = f.x, z = f.z - 0.1, y = f.y;
        if (this.model('lamp', x, y, z)) return;
        this.box('plain', x - 0.14, y, z - 0.14, x + 0.14, y + 0.18, z + 0.14, '#2a2830');
        this.box('plain', x - 0.05, y, z - 0.05, x + 0.05, y + 2.1, z + 0.05, '#2a2830');
        this.box('plain', x - 0.17, y + 2.1, z - 0.17, x + 0.17, y + 2.16, z + 0.17, '#2a2830');
        this.box('glass', x - 0.13, y + 2.16, z - 0.13, x + 0.13, y + 2.5, z + 0.13, [0.95, 0.85, 0.55]);
        for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) this.box('plain', x + sx * 0.13 - 0.025, y + 2.16, z + sz * 0.13 - 0.025, x + sx * 0.13 + 0.025, y + 2.5, z + sz * 0.13 + 0.025, '#2a2830');
        this.box('plain', x - 0.2, y + 2.5, z - 0.2, x + 0.2, y + 2.56, z + 0.2, '#2a2830');
        this.box('plain', x - 0.1, y + 2.56, z - 0.1, x + 0.1, y + 2.66, z + 0.1, '#2a2830');
    },
    mailbox(e) {
        const f = this.foot(e), x = f.x, z = f.z - 0.1, y = f.y;
        if (this.model('mailbox', x, y, z)) return;
        this.box('wood', x - 0.05, y, z - 0.05, x + 0.05, y + 0.85, z + 0.05, '#6a4a2a', 2);
        this.box('plain', x - 0.18, y + 0.85, z - 0.32, x + 0.18, y + 1.12, z + 0.2, '#3f7fd0');
        this.box('plain', x - 0.18, y + 1.12, z - 0.32, x + 0.18, y + 1.18, z + 0.2, '#3570b8');
        this.box('plain', x + 0.18, y + 0.95, z - 0.1, x + 0.22, y + 1.32, z - 0.06, '#d8302a');
    },
    /* a white picket fence along this tile, joining its neighbours */
    fence(e, a) {
        const f = this.foot(e), x = f.x, z = f.z - 0.35, y = f.y;
        // (the concept's garden fences are rustic split rails)
        if (this.model('fence_rustic', x, y, z)) { this.sunflowers(e, x, y, z); return; }
        for (let i = 0; i < 4; i++) { const px = x - 0.5 + (i + 0.5) / 4; this.box('plain', px - 0.05, y, z - 0.03, px + 0.05, y + 0.68, z + 0.03, '#f4f2ea'); this.box('plain', px - 0.035, y + 0.68, z - 0.03, px + 0.035, y + 0.74, z + 0.03, '#f4f2ea'); }
        for (const ry of [0.22, 0.5]) this.box('plain', x - 0.5, y + ry, z - 0.06, x + 0.5, y + ry + 0.06, z - 0.03, '#e2dfd6');
        this.sunflowers(e, x, y, z);
    },
    /* sunflowers behind a fence, as in the concept */
    sunflowers(e, x, y, z) {
        if (this.season === 'spring' || this.season === 'winter') return;       // (they bloom in summer and autumn)
        if (this.model('sunflowers', x + 0.05, y, z - 0.3)) return;
        const r = mulberry(hash32('sf' + e.x + e.y));
        for (let i = 0; i < 2; i++) { const sx = x - 0.3 + i * 0.55 + (r() - 0.5) * 0.1, sh = 0.95 + r() * 0.35; this.box('plain', sx - 0.025, y, z - 0.25, sx + 0.025, y + sh, z - 0.2, '#4a8a34'); this.box('plain', sx - 0.13, y + sh - 0.13, z - 0.24, sx + 0.13, y + sh + 0.13, z - 0.19, '#ffc93a'); this.box('plain', sx - 0.06, y + sh - 0.06, z - 0.19, sx + 0.06, y + sh + 0.06, z - 0.16, '#6a3a1a'); }
    },
    flowerbed(e) {
        const f = this.foot(e), x = f.x, z = f.z - 0.35, y = f.y;
        if (this.model('planter', x, y, z)) return;
        this.box('wood', x - 0.9, y, z - 0.35, x + 0.9, y + 0.28, z + 0.25, '#8a5a33', 2);
        const r = mulberry(hash32('bed' + e.x));
        for (let i = 0; i < 16; i++) { const fx = x - 0.75 + r() * 1.5, fz = z - 0.25 + r() * 0.42, c = ['#f04a6a', '#ffd34a', '#ffffff', '#ff7ab8', '#b07af0', '#ff8a3a'][r() * 6 | 0]; this.box('plain', fx - 0.08, y + 0.3, fz - 0.08, fx + 0.08, y + 0.42 + r() * 0.08, fz + 0.08, c); }
    },
    /* a clump of flowers where a wild flower grows (the model's name when it is one) */
    flower(e) {
        const f = this.foot(e), r = mulberry(hash32('fl' + e.x + ',' + e.y)), kind = (e.id || '').split('_')[1] || '';
        const n = { tulip: 'flowers_tulip', daisy: 'flowers_daisy', cosmos: 'flowers_cosmos', lily: 'flowers_lily' }[kind] || 'flowers_mixed';
        if (this.model(n, f.x, f.y, f.z - 0.2, r() * Math.PI * 2)) return n;
        const pal = { tulip: ['#e8324a', '#ffcf3a', '#ff7ab8'], daisy: ['#ffffff', '#fff6d0', '#ffe14a'], cosmos: ['#ff7ab8', '#e0559a', '#ffffff'], lily: ['#ffffff', '#ffb0c8', '#ffd04a'] }[kind] || ['#ffffff', '#ff7ab8', '#ffd34a', '#b07af0'];
        for (let i = 0; i < 4; i++) {
            const fx = f.x + (r() - 0.5) * 0.6, fz = f.z - 0.2 + (r() - 0.5) * 0.45, h = 0.22 + r() * 0.2, c = pal[r() * pal.length | 0];
            this.box('plain', fx - 0.015, f.y, fz - 0.015, fx + 0.015, f.y + h, fz + 0.015, '#3f8a34');
            this.box('plain', fx - 0.07, f.y + h, fz - 0.07, fx + 0.07, f.y + h + 0.05, fz + 0.07, c);
            this.box('plain', fx - 0.025, f.y + h + 0.05, fz - 0.025, fx + 0.025, f.y + h + 0.07, fz + 0.025, '#f8c83a');
        }
    },
    /* a pumpkin: a squat orange ball with ribs, a stem */
    pumpkin(e) {
        if (this.model('pumpkins', e.x / TILE, Env.groundH(e.x, e.y), e.y / TILE * R3_ZS - 0.1, (hash32('pk' + e.x) % 7) * 0.9)) return;
        const f = this.foot(e), r = mulberry(hash32('pk' + e.x + ',' + e.y)), s = 0.17 + r() * 0.07, b = this.part('plain'), base = b.p.length / 3;
        const seg = 14, rings = 7, col = [0.93, 0.48, 0.12], cx = f.x, cy = f.y + s * 0.7, cz = f.z - 0.1;
        for (let j = 0; j <= rings; j++) for (let i = 0; i <= seg; i++) {
            const th = j / rings * Math.PI, ph = i / seg * Math.PI * 2, rib = 1 - 0.1 * Math.pow(Math.abs(Math.cos(ph * 4)), 0.5);
            const nx = Math.sin(th) * Math.cos(ph), ny = Math.cos(th), nz = Math.sin(th) * Math.sin(ph);
            b.p.push(cx + nx * s * rib * 1.15, cy + ny * s * 0.75, cz + nz * s * rib * 1.15); b.n.push(nx, ny, nz); b.uv.push(0, 0);
            const k = 0.82 + 0.18 * rib; b.c.push(col[0] * k, col[1] * k, col[2] * k);
        }
        for (let j = 0; j < rings; j++) for (let i = 0; i < seg; i++) { const a0 = base + j * (seg + 1) + i, a1 = a0 + 1, b0 = a0 + seg + 1, b1 = b0 + 1; b.idx.push(a0, a1, b0, a1, b1, b0); }
        this.box('wood', cx - 0.025, cy + s * 0.7, cz - 0.025, cx + 0.025, cy + s * 0.7 + 0.09, cz + 0.025, '#5a7a2a', 2);
    },
};
