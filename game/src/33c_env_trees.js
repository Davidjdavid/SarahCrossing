/* ---- 33c_env_trees.js ---- */
/* Trees for the new 3D look (33a_env.js). A broadleaf tree is a bent trunk with branches into a crown of leaf clumps:
   each clump a lumpy ball, its surface covered in little cards of leaves (so the edge is leafy, not a smooth ball) that
   are lit as if they were the ball's own skin. The light that reaches each spot picks a tone from the tree's colors (deep
   rust in the shade up to pale gold where the sun hits, in autumn), in steps, as a painter would. Pines are tiers of
   ragged skirts of needles, palms a ringed, leaning trunk with drooping fronds. All of a kind is one mesh.
   That is the fallback: once the Blender models are in (the usual case) the trees, fruit, palms, bushes and pines are
   those, in the style of Animal Crossing, drawn instanced, and they shake, lose their fruit and fall to the axe with the
   game's own trees. */
const EnvTrees = {
    /* the colors a crown can take, darkest first (each tree picks a row) */
    PALS: {
        fall: [['#5a210f', '#8e3615', '#c4561a', '#e7801f', '#f8a72c', '#ffd35c', '#fff0a8'],
            ['#5f3a0c', '#94600f', '#c98c16', '#eab121', '#fbd03a', '#ffe772', '#fff6b8'],
            ['#561c10', '#8b2a14', '#bd4519', '#e2671f', '#f4902a', '#ffbe50', '#ffe49a']],
        summer: [['#173e1f', '#24602c', '#3a8a39', '#5aa845', '#80c454', '#aedc72', '#dff2a8'],
            ['#1c4421', '#2c6a30', '#479640', '#69b44c', '#90cc5c', '#bce27e', '#e6f6b4']],
        spring: [['#2a4a22', '#3c7032', '#5d9c44', '#86c25a', '#b2dc78', '#f2b8d0', '#ffe2ee']],
        winter: [['#3a3430', '#5a4e44', '#7a6a5a', '#a89a8a', '#d8dce2', '#eef2f6', '#ffffff']],
        pine: [['#0f2a24', '#163d31', '#1f5640', '#2c7350', '#3f9160', '#62b073', '#9ed29a']],
        palm: [['#16361c', '#20502a', '#2f7036', '#459044', '#66ad52', '#93cc6a', '#c8e89a']],
        bush: [['#4e1c0e', '#823013', '#b84d18', '#df731e', '#f39a2a', '#ffc858', '#ffe9a0']],
    },
    build(group, a) {
        const season = a.bgSeason || Clock.season();
        this.season = season;
        const pal = this.palTex(season);
        const leaf = this.leafTex();
        const trees = a.ents.filter(e => e.kind === 'tree' || e.kind === 'palm' || e.kind === 'fruittree' || e.kind === 'bigtree' || e.kind === 'oldtree');
        const bushes = a.ents.filter(e => e.kind === 'bush');
        const F = this.buf(), B = this.buf();
        // the trees, palms and bushes made in Blender in the style of Animal Crossing (tools/blender/trees_ac.py), turning
        // with the season; the pines too (vegetation.py)
        const has = n => typeof EnvModels !== 'undefined' && EnvModels.has(n);
        const rounds = (season === 'fall' ? ['tree_round_a_fall', 'tree_round_b_fall'] : ['tree_round_a', 'tree_round_b']).filter(has);
        const palms = ['palm_ac', 'palm_ac_b'].filter(has), pines = ['pine_a', 'pine_b'].filter(has);
        const shrubs = ({ fall: ['bush_fall', 'bush_fall', 'bush_holly'], winter: ['bush_holly'], spring: ['bush_azalea', 'bush_round'], summer: ['bush_hibiscus', 'bush_round'] }[season] || ['bush_round']).filter(has);
        const placed = {}, live = [];
        const put = (list, x, y, z, r, s, turn) => {
            const n = list[(r() * list.length) | 0], M = EnvModels.mat4(x, y - 0.03, z, turn == null ? r() * Math.PI * 2 : turn, s);
            (placed[n] = placed[n] || []).push(M);
            return { n, i: placed[n].length - 1, M };
        };
        // fruit hangs at the tree's anchors (turned and sized with it); a fruit tree is turned only a little, so its
        // fruit stays on the side toward the camera
        const hang = (t, fruit) => {
            const A = EnvModels.models[t.n].anchors.fruit || [], fn = 'fruit_' + fruit, k = fruit === 'coconut' ? 1.35 : 1.9;
            if (!has(fn)) return [];
            // (big, as Animal Crossing hangs them: fruit is what you come to a tree for)
            return A.map((p, j) => {
                const M = t.M.clone().multiply(new THREE.Matrix4().makeTranslation(p.x, p.y - 0.06 * k, p.z)).multiply(new THREE.Matrix4().makeRotationY(j * 2.1)).multiply(new THREE.Matrix4().makeScale(k, k, k));
                (placed[fn] = placed[fn] || []).push(M);
                return { n: fn, i: placed[fn].length - 1, M };
            });
        };
        for (const e of trees) {
            const x = e.x / TILE, z = e.y / TILE * R3_ZS, y = Env.groundH(e.x, e.y), r = mulberry(hash32('tree' + Math.round(e.x) + ',' + Math.round(e.y)));
            // (a palm is a tree or a fruit tree wearing a palm picture)
            const kind = e.kind === 'palm' || /^palm/.test(e.frame || '') ? 'palm' : /pine/.test(e.frame || '') || e.pine || e.treeKind === 'pine' ? 'pine' : 'broad';
            const big = e.kind === 'bigtree' || e.kind === 'oldtree' ? 1.4 : 1, fruit = e.kind === 'fruittree' && e.fruit;
            let t = null;
            if (kind === 'pine') { if (pines.length) t = put(pines, x, y, z, r, 0.8 + r() * 0.22); else this.pine(F, B, x, y, z, r); }
            else if (kind === 'palm') { if (palms.length) t = put(palms, x, y, z, r, 0.9 + r() * 0.15, fruit ? (r() - 0.5) * 1.2 : null); else this.palm(F, B, x, y, z, r, e); }
            else if (rounds.length) t = put(rounds, x, y, z, r, big * (0.9 + r() * 0.15), fruit ? (r() - 0.5) * 0.6 : null);
            else this.broad(F, B, x, y, z, r, big);
            if (t) live.push({ e, t, fruit: fruit ? hang(t, fruit) : [], on: true, ripe: true, shook: false });
        }
        for (const e of bushes) {
            const r = mulberry(hash32('bush' + e.x + ',' + e.y)), x = e.x / TILE, y = Env.groundH(e.x, e.y), z = e.y / TILE * R3_ZS;
            if (shrubs.length) put(shrubs, x, y + 0.02, z, r, 0.95 + r() * 0.25); else this.bush(F, x, y, z, r);
        }
        const models = [], inst = {};
        // (the leaves have their shade painted in: taking the shadow map too, a crown darkens itself twice)
        for (const [n, list] of Object.entries(placed)) for (const m of (inst[n] = EnvModels.instances(group, n, list))) { m.userData.shared = true; if (!/bark|trunk|gloss/.test(m.material.name)) m.receiveShadow = false; models.push(m); }
        this.live = live; this.inst = inst;
        const fm = this.foliageMat(leaf, pal), bm = this.barkMat();
        const fMesh = new THREE.Mesh(this.geo(F), fm), bMesh = new THREE.Mesh(this.geo(B), bm);
        fMesh.customDepthMaterial = this.depthMat(leaf);
        // (the crowns cast shadows but don't take them: leaf cards shading each other come out in stripes; the light
        // the crown gets is its own shading)
        fMesh.castShadow = true; fMesh.receiveShadow = false; bMesh.castShadow = true; bMesh.receiveShadow = true;
        group.add(fMesh, bMesh);
        let frame = 0;
        return { meshes: [fMesh, bMesh].concat(models), count: trees.length, tick: (r3, a) => this.tick(a, frame++) };
    },
    /* the trees follow the game: one shaken sways (its fruit with it), a chopped one is gone, picked fruit is gone until
       it grows back */
    tick(a, frame) {
        const live = this.live, inst = this.inst, none = this._none || (this._none = new THREE.Matrix4().makeScale(0, 0, 0));
        if (!live || !live.length) return;
        const set = (o, M) => { for (const m of inst[o.n] || []) { m.setMatrixAt(o.i, M); m.instanceMatrix.needsUpdate = true; } };
        const W = this._w || (this._w = new THREE.Matrix4()), R = this._r || (this._r = new THREE.Matrix4());
        // (by id: the island's things are made again when Sarah comes back out of a building)
        let ids = null;
        if (frame % 15 === 0) { ids = new Map(); for (const e of a.ents) if (e.id) ids.set(e.id, e); }
        for (const L of live) {
            if (ids && L.e.id) {
                const cur = ids.get(L.e.id);
                if (cur) L.e = cur;
                const on = !!cur, ripe = on && L.fruit.length > 0 && treeHasFruit(L.e);
                if (on !== L.on) { L.on = on; set(L.t, on ? L.t.M : none); }
                if (L.fruit.length && ripe !== L.ripe) { L.ripe = ripe; for (const f of L.fruit) set(f, ripe ? f.M : none); }
            }
            if (!L.on) continue;
            const sh = L.e.shake || 0;
            if (sh > 0 || L.shook) {
                // a sway about the foot of the trunk, side to side, dying away
                const ang = sh > 0 ? Math.sin(sh * 1.3) * 0.035 * Math.min(1, sh / 12) : 0;
                R.makeRotationZ(ang);
                set(L.t, W.multiplyMatrices(L.t.M, R));
                if (L.ripe) for (const f of L.fruit) { W.multiplyMatrices(L.t.M, R).multiply(new THREE.Matrix4().copy(L.t.M).invert().multiply(f.M)); set(f, W); }
                L.shook = sh > 0;
            }
        }
    },

    /* ---------------------------------------------------------------- geometry, gathered into one buffer per material */
    buf() { return { p: [], n: [], uv: [], shade: [], tone: [], idx: [] }; },
    geo(b) {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3));
        g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
        g.setAttribute('aShade', new THREE.Float32BufferAttribute(b.shade, 1));
        g.setAttribute('aTone', new THREE.Float32BufferAttribute(b.tone, 1));
        g.setIndex(b.idx);
        g.computeBoundingSphere();
        return g;
    },
    vert(b, x, y, z, nx, ny, nz, u, v, shade, tone) {
        b.p.push(x, y, z); b.n.push(nx, ny, nz); b.uv.push(u, v); b.shade.push(shade); b.tone.push(tone);
        return b.p.length / 3 - 1;
    },
    /* a card of leaves facing the camera at c, lit as if its normal were n (cell: which of the four leaf pictures) */
    card(b, cx, cy, cz, s, n, shade, tone, cell, rot) {
        const p = ENV.cam.pitch * Math.PI / 180, ux = Math.cos(rot), uy = Math.sin(rot);
        // the camera's right and up, turned by rot in the card's plane
        const R = [ux, uy * Math.cos(p), -uy * Math.sin(p)], U = [-uy, ux * Math.cos(p), -ux * Math.sin(p)];
        const u0 = (cell % 2) * 0.5, v0 = Math.floor(cell / 2) * 0.5, base = b.p.length / 3;
        for (const [a1, a2, uu, vv] of [[-1, -1, 0, 0], [1, -1, 0.5, 0], [1, 1, 0.5, 0.5], [-1, 1, 0, 0.5]])
            this.vert(b, cx + (R[0] * a1 + U[0] * a2) * s, cy + (R[1] * a1 + U[1] * a2) * s, cz + (R[2] * a1 + U[2] * a2) * s, n[0], n[1], n[2], u0 + uu, v0 + vv, shade, tone);
        b.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    },
    /* a lumpy ball (a clump's solid core: no holes through a crown) */
    ball(b, cx, cy, cz, rx, ry, rz, r, shadeFn, tone) {
        const ico = this._ico || (this._ico = new THREE.IcosahedronGeometry(1, 2));
        const P = ico.attributes.position, base = b.p.length / 3, seed = r() * 100;
        for (let i = 0; i < P.count; i++) {
            const x = P.getX(i), y = P.getY(i), z = P.getZ(i), l = Math.hypot(x, y, z), nx = x / l, ny = y / l, nz = z / l;
            const bump = 1 + (Math.sin(nx * 5.1 + seed) * Math.sin(ny * 4.3 + seed * 0.7) * Math.sin(nz * 4.7 + seed * 1.3)) * 0.16;
            const px = cx + nx * rx * bump, py = cy + ny * ry * bump, pz = cz + nz * rz * bump;
            // the solid core sits on the centre of the leaf picture (always leaf, never a gap)
            this.vert(b, px, py, pz, nx, ny, nz, 0.25, 0.25, shadeFn(nx, ny, nz), tone);
        }
        for (let i = 0; i < P.count; i++) b.idx.push(base + i);
    },
    /* a branch or trunk piece: a tapered tube from a to b */
    tube(b, a, c, r0, r1, seg, tone) {
        const dx = c[0] - a[0], dy = c[1] - a[1], dz = c[2] - a[2], L = Math.hypot(dx, dy, dz), d = [dx / L, dy / L, dz / L];
        const t1 = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
        let ex = [d[1] * t1[2] - d[2] * t1[1], d[2] * t1[0] - d[0] * t1[2], d[0] * t1[1] - d[1] * t1[0]]; const el = Math.hypot(...ex); ex = ex.map(v => v / el);
        const ey = [d[1] * ex[2] - d[2] * ex[1], d[2] * ex[0] - d[0] * ex[2], d[0] * ex[1] - d[1] * ex[0]];
        const base = b.p.length / 3;
        for (let ring = 0; ring <= 1; ring++) for (let i = 0; i <= seg; i++) {
            const t = i / seg * Math.PI * 2, cs = Math.cos(t), sn = Math.sin(t), rr = ring ? r1 : r0, o = ring ? c : a;
            const nx = ex[0] * cs + ey[0] * sn, ny = ex[1] * cs + ey[1] * sn, nz = ex[2] * cs + ey[2] * sn;
            this.vert(b, o[0] + nx * rr, o[1] + ny * rr, o[2] + nz * rr, nx, ny, nz, i / seg * 2, ring * L * 1.5, 1, tone);
        }
        for (let i = 0; i < seg; i++) { const a0 = base + i, a1 = base + i + 1, b0 = base + seg + 1 + i, b1 = b0 + 1; b.idx.push(a0, b0, a1, a1, b0, b1); }
    },

    /* ---------------------------------------------------------------- the kinds */
    /* a broadleaf tree: a trunk bending up into a crown of a dozen clumps, a big one in the middle, a ring round it lower
       down and a few on top; leaf cards all over the clumps' outsides (k scales it: the big tree, the old giants) */
    broad(F, B, x, y, z, r, k) {
        const H = (2.6 + r() * 0.6) * k, R = (1.1 + r() * 0.25) * k, lean = (r() - 0.5) * 0.35, tone = r() * 3 | 0;
        const top = [x + lean * 0.5, y + H * 0.62, z - 0.05];
        this.tube(B, [x, y - 0.1, z], [x + lean * 0.25, y + H * 0.35, z], 0.2 * k, 0.15 * k, 8, 0);
        this.tube(B, [x + lean * 0.25, y + H * 0.35, z], top, 0.15 * k, 0.1 * k, 8, 0);
        for (let i = 0; i < 3; i++) { const an = r() * Math.PI * 2; this.tube(B, [x + lean * 0.3, y + H * 0.45, z], [x + Math.cos(an) * R * 0.6, y + H * 0.66, z + Math.sin(an) * R * 0.5], 0.08 * k, 0.04 * k, 6, 0); }
        const cy = y + H * 0.7, clumps = [[0, 0.12, 0, 0.82]];
        const ring = 6 + (r() * 2 | 0);
        for (let i = 0; i < ring; i++) { const an = i / ring * Math.PI * 2 + r() * 0.5; clumps.push([Math.cos(an) * 0.72, -0.22 + r() * 0.2, Math.sin(an) * 0.62, 0.55 + r() * 0.14]); }
        for (let i = 0; i < 4; i++) { const an = r() * Math.PI * 2; clumps.push([Math.cos(an) * 0.36, 0.55 + r() * 0.15, Math.sin(an) * 0.3, 0.5 + r() * 0.12]); }
        for (const [ox, oy, oz, rs] of clumps) {
            const px = x + lean * 0.5 + ox * R, py = cy + oy * R, pz = z + oz * R, rad = rs * R;
            // shade: the crown's underside and inside are in its own shadow
            const shadeFn = (nx, ny, nz) => Math.max(0.35, Math.min(1, 0.72 + ny * 0.25 + (oy + 0.3) * 0.25 + (Math.hypot(ox, oz) > 0.4 ? 0.08 : -0.05)));
            if (!(window.__envDbg && window.__envDbg.noBalls)) this.ball(F, px, py, pz, rad, rad * 0.92, rad * 0.9, r, shadeFn, tone);
            const n = window.__envDbg && window.__envDbg.noCards ? 0 : 16 + (rad * 14 | 0);
            for (let i = 0; i < n; i++) {
                // a point on the clump's outer, upper side
                let nx = r() * 2 - 1, ny = r() * 1.6 - 0.45, nz = r() * 2 - 1; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
                if (ox * nx + oz * nz < -0.35 && Math.hypot(ox, oz) > 0.3) continue;      // (not deep inside the crown)
                const s = rad * (0.36 + r() * 0.18);
                this.card(F, px + nx * rad * 0.95, py + ny * rad * 0.9, pz + nz * rad * 0.9, s, [nx, ny * 0.9 + 0.15, nz], shadeFn(nx, ny, nz), tone, r() * 2 | 0, r() * 6.28);
            }
        }
    },
    /* a pine: a dark trunk and tiers of ragged needle skirts, wide at the bottom, a point on top */
    pine(F, B, x, y, z, r) {
        const H = 3.0 + r() * 0.9, tiers = 5 + (r() * 2 | 0), tone = 3;
        this.tube(B, [x, y - 0.1, z], [x, y + H * 0.35, z], 0.13, 0.09, 6, 0);
        for (let t = 0; t < tiers; t++) {
            const f = t / tiers, by = y + H * (0.18 + f * 0.7), rad = (1.15 - f * 0.85) * (0.95 + r() * 0.15), ty = by + H * 0.3, seg = 18;
            const base = F.p.length / 3, apex = this.vert(F, x, ty, z, 0, 1, 0, 0.25, 0.25, 1, tone);
            for (let i = 0; i <= seg; i++) {
                const an = i / seg * Math.PI * 2, jag = 1 + (i % 2 ? -0.12 : 0.1) + (r() - 0.5) * 0.1, droop = (i % 2 ? 0.05 : -0.12) - r() * 0.06;
                const cx = Math.cos(an), sz = Math.sin(an), shade = 0.62 + 0.38 * (0.5 + 0.5 * (-cx * 0.6 + sz * 0.4)) * (0.7 + f * 0.3);
                this.vert(F, x + cx * rad * jag, by + droop, z + sz * rad * jag * 0.95, cx * 0.8, 0.6, sz * 0.8, 0.25, 0.25, shade * 0.85, tone);
            }
            for (let i = 0; i < seg; i++) F.idx.push(apex, base + 1 + i + 1, base + 1 + i);
            // a ring of needle cards along the skirt's edge, so it's ragged against the sky
            for (let i = 0; i < seg; i += 2) { const an = (i + 0.5) / seg * Math.PI * 2 + r() * 0.2, cx = Math.cos(an), sz = Math.sin(an); this.card(F, x + cx * rad * 0.92, by + 0.06, z + sz * rad * 0.88, 0.26 + r() * 0.1, [cx * 0.7, 0.6, sz * 0.7], 0.7, tone, 2, r() * 6.28); }
        }
    },
    /* a palm: a ringed trunk leaning and curving, fronds drooping from the top, coconuts */
    palm(F, B, x, y, z, r, e) {
        const H = 3.3 + r() * 0.6, lx = 0.5 + r() * 0.5, tone = 4;
        let prev = [x, y - 0.05, z];
        for (let i = 1; i <= 6; i++) { const t = i / 6, p = [x + lx * t * t, y + H * t, z - 0.15 * t]; this.tube(B, prev, p, 0.16 - t * 0.05, 0.15 - t * 0.05, 7, 1); prev = p; }
        const top = prev, fronds = 8;
        for (let f = 0; f < fronds; f++) {
            const an = f / fronds * Math.PI * 2 + r() * 0.3, dx = Math.cos(an), dz = Math.sin(an), len = 1.6 + r() * 0.4, seg = 7, base = F.p.length / 3;
            for (let s = 0; s <= seg; s++) {
                const t = s / seg, w = Math.sin(t * Math.PI) * 0.34 + 0.04, px = top[0] + dx * len * t, py = top[1] + 0.25 * t - 1.2 * t * t, pz = top[2] + dz * len * t * 0.9;
                const sx = -dz * w, sz = dx * w, shade = 0.75 + 0.25 * (1 - t);
                this.vert(F, px + sx, py, pz + sz, 0, 1, 0, 0.5, 0.5 + t * 0.5, shade, tone);
                this.vert(F, px - sx, py, pz - sz, 0, 1, 0, 1.0, 0.5 + t * 0.5, shade, tone);
            }
            for (let s = 0; s < seg; s++) { const a0 = base + s * 2; F.idx.push(a0, a0 + 2, a0 + 1, a0 + 1, a0 + 2, a0 + 3); }
        }
        if (e && (e.fruit === 'coconut' || e.coconut)) for (let i = 0; i < 3; i++) { const an = i * 2.1; this.ball(B, top[0] + Math.cos(an) * 0.14, top[1] - 0.12, top[2] + Math.sin(an) * 0.14, 0.1, 0.1, 0.1, r, () => 1, 2); }
    },
    /* a bush: a few clumps sitting on the ground */
    bush(F, x, y, z, r) {
        const tone = 5, R = 0.48 + r() * 0.12;
        for (let i = 0; i < 5; i++) {
            const an = i * 1.3 + r(), ox = i ? Math.cos(an) * R * 0.55 : 0, oz = i ? Math.sin(an) * R * 0.45 : 0, rad = R * (i ? 0.62 : 0.8), py = y + rad * 0.75 + (i ? 0 : 0.1);
            const shadeFn = (nx, ny) => Math.max(0.4, 0.7 + ny * 0.3);
            this.ball(F, x + ox, py, z + oz, rad, rad * 0.85, rad * 0.85, r, shadeFn, tone);
            for (let k = 0; k < 10; k++) { let nx = r() * 2 - 1, ny = r() * 1.4 - 0.3, nz = r() * 2 - 1; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l; this.card(F, x + ox + nx * rad, py + ny * rad * 0.85, z + oz + nz * rad * 0.85, rad * 0.42, [nx, ny, nz], shadeFn(nx, ny), tone, r() * 2 | 0, r() * 6.28); }
        }
    },

    /* ---------------------------------------------------------------- pictures and materials */
    /* four pictures of a cluster of leaves (white, the shading in the gray: the light picks the color), 64 pixels each */
    leafTex() {
        if (this._leaf) return this._leaf;
        const N = 128, d = new Uint8Array(N * N * 4), r = mulberry(1234);
        for (let cell = 0; cell < 4; cell++) {
            const ox = (cell % 2) * 64, oy = Math.floor(cell / 2) * 64;
            if (cell === 3) {
                // a palm frond: a pale rib down the middle, leaflets slanting out from it
                for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
                    const dx = Math.abs(x - 31.5), w = 30 - Math.abs(y - 32) * 0.15, slant = (dx * 0.7 + y) % 5;
                    if (dx > w || (dx > 1.5 && slant > 3.2)) continue;
                    const i = ((oy + y) * 128 + ox + x) * 4, v = dx < 1.5 ? 1 : 0.55 + (1 - dx / 30) * 0.4 - (slant > 2.4 ? 0.15 : 0);
                    d[i] = d[i + 1] = d[i + 2] = Math.round(v * 255); d[i + 3] = 255;
                }
                continue;
            }
            if (cell === 2) {
                // pine needles: a solid middle, and needles fanning out and down round it
                for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) if (x * x + y * y <= 36) { const i = ((oy + 32 + y) * 128 + ox + 32 + x) * 4; d[i] = d[i + 1] = d[i + 2] = 190; d[i + 3] = 255; }
                for (let k = 0; k < 140; k++) {
                    const a = Math.PI * (0.05 + r() * 0.9), len = 10 + r() * 18, tone = 0.6 + r() * 0.4, x0 = 32 + (r() - 0.5) * 14, y0 = 20 + r() * 14;
                    for (let t = 0; t < len; t++) { const px = Math.round(x0 + Math.cos(a) * t * (r() < 0.5 ? 1 : -1) * 0.4), py = Math.round(y0 + Math.sin(a) * t); if (px < 1 || py < 1 || px > 62 || py > 62) break; const i = ((oy + py) * 128 + ox + px) * 4; d[i] = d[i + 1] = d[i + 2] = Math.round(255 * tone * (1 - t / len * 0.35)); d[i + 3] = 255; }
                }
                continue;
            }
            // (a solid middle: the crown's core is painted from there, never a gap)
            for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) if (x * x + y * y <= 36) { const i = ((oy + 32 + y) * 128 + ox + 32 + x) * 4; d[i] = d[i + 1] = d[i + 2] = 205; d[i + 3] = 255; }
            // a cluster of small round leaf bunches, the lower ones first so the upper ones overlap them; each lit from the
            // top left and darker round its rim, like the concept's crowns
            const blobs = [];
            for (let n = 0; n < 46; n++) { const a = r() * Math.PI * 2, dist = Math.sqrt(r()) * 23; blobs.push([32 + Math.cos(a) * dist, 32 + Math.sin(a) * dist * 0.9, 2.6 + r() * 2.4, 0.78 + r() * 0.22]); }
            blobs.sort((p, q) => p[1] - q[1]);
            for (const [cx, cy, rad, tone] of blobs.reverse()) {
                for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) {
                    const dd = Math.hypot(x, y) / rad;
                    if (dd > 1) continue;
                    const px = Math.round(cx + x), py = Math.round(cy + y);
                    if (px < 1 || py < 1 || px > 62 || py > 62) continue;
                    const lit = (-x * 0.6 - y * 0.8) / rad, sh = Math.max(0.35, Math.min(1, tone * (0.78 + lit * 0.28) - (dd > 0.8 ? 0.16 : 0)));
                    const i = ((oy + py) * N + ox + px) * 4;
                    d[i] = d[i + 1] = d[i + 2] = Math.round(sh * 255); d[i + 3] = 255;
                }
            }
            // the needle pictures (cells 2 and 3) get a spiky fringe at the bottom too
            if (cell >= 2) for (let k = 0; k < 40; k++) { const x0 = 6 + (r() * 52 | 0), len = 6 + (r() * 9 | 0); for (let j = 0; j < len; j++) { const py = 40 + j, px = x0 + Math.round((r() - 0.5) * 1.2 * j * 0.3); if (px < 1 || px > 62 || py > 62) continue; const i = ((oy + py) * N + ox + px) * 4; d[i] = d[i + 1] = d[i + 2] = 150 + (r() * 60 | 0); d[i + 3] = 255; } }
        }
        const t = new THREE.DataTexture(d, N, N, THREE.RGBAFormat);
        t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true;
        return (this._leaf = t);
    },
    /* the palettes as a picture: a row of 7 tones per palette (fall's three, then the pine, palm and bush rows) */
    palTex(season) {
        const rows = (this.PALS[season] || this.PALS.summer).slice(0, 3);
        while (rows.length < 3) rows.push(rows[0]);
        const all = rows.concat([this.PALS.pine[0], this.PALS.palm[0], season === 'fall' ? this.PALS.bush[0] : rows[0]]);
        const W = 7, Hh = all.length, d = new Uint8Array(W * Hh * 4);
        all.forEach((row, j) => row.forEach((c, i) => { const v = EnvTex.hex(c), o = (j * W + i) * 4; d[o] = v[0]; d[o + 1] = v[1]; d[o + 2] = v[2]; d[o + 3] = 255; }));
        const t = new THREE.DataTexture(d, W, Hh, THREE.RGBAFormat);
        t.magFilter = t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true;
        this.palRows = Hh;
        return t;
    },
    /* the crown's material: lit like everything else (sun, sky, shadows), then the light it gets picks the tone */
    foliageMat(leaf, pal) {
        const m = r3Patch(new THREE.MeshLambertMaterial({ map: leaf, alphaTest: 0.5, side: THREE.DoubleSide, color: 0xffffff }), {
            key: 'envleaf', uniforms: { tPal: { value: pal }, uPalRows: { value: this.palRows } },
            vhead: 'attribute float aShade; attribute float aTone; varying float vShade; varying float vTone;\n', vbody: 'vShade = aShade; vTone = aTone;',
            fhead: 'uniform sampler2D tPal; uniform float uPalRows; varying float vShade; varying float vTone;\n',
            fpre: EnvTrees.FPRE,
        });
        return m;
    },
    barkMat() {
        const bark = EnvTex.bark();
        return r3Patch(new THREE.MeshStandardMaterial({ map: bark.map, normalMap: bark.normal, roughness: 0.95, metalness: 0, color: 0xc8b8a8 }), {
            key: 'envbark', vhead: 'attribute float aShade; attribute float aTone; varying float vTone;\n', vbody: 'vTone = aTone;',
            fhead: 'varying float vTone;\n', fmap: '{ if (vTone > 1.5) diffuseColor.rgb = vec3(0.42, 0.27, 0.13); else if (vTone > 0.5) diffuseColor.rgb *= vec3(1.15, 1.02, 0.85); }',
        });
    },
    depthMat(leaf) {
        const dm = r3Depth(leaf);
        return dm;
    },
};
/* (just before the colors are finished: how lit this spot is, against how lit it would be in full sun, picks a tone in
   steps; the leaf picture's own shading and the crown's shade move it up or down a little) */
EnvTrees.FPRE = `
{
    float lum = dot(gl_FragColor.rgb, vec3(0.3, 0.59, 0.11)) / max(0.05, dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11)));
    float leaf = diffuseColor.r;
    float t = clamp(lum * 0.6 * vShade + (leaf - 0.75) * 0.45 + 0.05, 0.0, 1.0);
    t = mix(t, floor(t * 7.0 + 0.5) / 7.0, 0.75);
    float row = floor(vTone + 0.5);
    gl_FragColor.rgb = texture2D(tPal, vec2(0.5 / 7.0 + t * 6.0 / 7.0, (row + 0.5) / uPalRows)).rgb;
}`;
