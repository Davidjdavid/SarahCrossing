/* ---- 33g_env_models.js ---- */
/* The models made in Blender (tools/blender/*.py, game/assets/models/*.glb) for the new 3D look: trees, buildings, walls,
   furniture, plants, props. Loaded once (in the test area, from the start, so they're usually there before the
   island is), each turned into parts (a geometry and a material) whose materials join the rest of the view (the bend
   toward the horizon, depth of field, shadows); a model placed many times is drawn as one instanced mesh per part.
   Phones load the lighter version of a model where there is one (name_lod1). The colors in the models' pictures are used
   as they are, like the game's other pictures (no color-space conversion), and colors kept in a mesh are turned back
   into the colors as painted. */
const EnvModels = {
    OUTDOOR: new Set(['furn_lunar_lantern', 'furn_red_lantern', 'furn_heart_lamp', 'furn_cafe_table', 'furn_easel']),
    models: {}, textures: {}, ready: false, failed: false, _p: null, done: 0, total: 1,
    phone() { try { return matchMedia('(pointer: coarse)').matches || Math.min(screen.width, screen.height) < 600; } catch (e) { return false; } },
    /* the names to fetch: each model once, its phone version on phones */
    names() {
        const all = Object.keys(window.MODELS || {}), phone = this.phone();
        // (the style test's models only where it's shown: 33ka_doll_kit.js)
        const test = typeof STYLE2 !== 'undefined' && STYLE2;
        return all.filter(n => (phone ? !all.includes(n + '_lod1') : !/_lod\d$/.test(n)) && (test || !/^(doll_|folk2_|style_)/.test(n)));
    },
    load() {
        if (this._p) return this._p;
        if (typeof THREE === 'undefined' || !THREE.GLTFLoader || !window.MODELS) { this.failed = true; return (this._p = Promise.resolve(false)); }
        const loader = new THREE.GLTFLoader(), tl = new THREE.TextureLoader(), names = this.names();
        // (the ground's surfaces too: repeating, sharp at a slant, their colors as they are; the file's top row is north)
        const texs = Object.entries(window.TEXTURES || {}).map(([n, url]) => new Promise((ok, bad) => tl.load(url, t => {
            t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.flipY = false; t.encoding = THREE.LinearEncoding; t.needsUpdate = true;
            this.textures[n] = t; this.done++; ok();
        }, undefined, bad)));
        // (the rooms' furniture and the things lying about come after: the island never waits for them, and each shows its
        // picture till it's in)
        // (but the lanterns the holidays put up on the island come with the island: 54_events.js decorateIsland; and the
        // easel a neighbor paints at, 33kd_doll_idle.js)
        const after = n => /^(furn_|item_)/.test(n) && !this.OUTDOOR.has(n), first = names.filter(n => !after(n));
        const later = names.filter(n => /^item_/.test(n)).concat(names.filter(n => /^furn_/.test(n) && !this.OUTDOOR.has(n)));   // (the small things first: they lie about outdoors)
        this.total = first.length + Object.keys(window.TEXTURES || {}).length;
        const get = n => new Promise((ok, bad) => loader.load(window.MODELS[n], g => ok([n, g]), undefined, bad));
        this._p = Promise.all(first.map(n => get(n).then(r => { this.done++; return r; })).concat(texs))
            .then(list => {
                for (const it of list) if (it) { const [n, g] = it; this.models[n.replace(/_lod\d$/, '')] = this.prepare(g.scene, n); }
                this.ready = true;
                // then the furniture and the things, a few at a time
                let i = 0;
                const next = () => { const n = later[i++]; if (!n) return; get(n).then(([n, g]) => { this.models[n] = this.prepare(g.scene, n); if (/^furn_/.test(n)) this.furnN = (this.furnN || 0) + 1; }).catch(e => console.warn('a model could not be loaded', n, e)).then(next); };
                for (let k = 0; k < 4; k++) next();
                return true;
            })
            .catch(e => { console.error('the models could not be loaded (the new look draws its own)', e); this.failed = true; return false; });
        return this._p;
    },
    has(name) { return this.ready && !!this.models[name]; },
    /* a loaded scene as parts, each geometry in the model's own space (y up, its front toward +z) */
    prepare(scene, name) {
        const parts = [], anchors = {}, sizes = {};
        scene.updateMatrixWorld(true);
        scene.traverse(o => {
            // (named empties mark spots on a model: anchor_fruit_0.. where its fruit hangs; their scale a size there)
            if (/^anchor_/.test(o.name)) {
                const k = o.name.replace(/^anchor_/, '').replace(/_\d+$/, '');
                (anchors[k] = anchors[k] || []).push(new THREE.Vector3().setFromMatrixPosition(o.matrixWorld));
                sizes[k] = new THREE.Vector3().setFromMatrixScale(o.matrixWorld).x;
                return;
            }
            if (!o.isMesh) return;
            const g = this.unpack(o.geometry);
            g.applyMatrix4(o.matrixWorld);
            this.srgb(g);
            g.computeBoundingSphere();
            // (each part keeps its object's name and origin: a folk's feet and eyes move about theirs)
            const at = new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
            for (const m of [].concat(o.material)) parts.push({ geometry: g, material: this.material(m, name), glass: /glass/i.test(m.name || ''), node: o.name, at });
        });
        return { parts, name, anchors, sizes };
    },
    /* the build keeps a model's points small (scripts/glb-pack.mjs: positions, colors and picture spots in 16 bits,
       normals in 8, each in its own strided view): they're made plain numbers again here, so everything that reads a
       model's geometry sees what Blender wrote (a part's node carries its positions' scale, applied with its matrix) */
    unpack(src) {
        const as = Object.values(src.attributes);
        if (as.every(a => !a.isInterleavedBufferAttribute && a.array instanceof Float32Array)) return src.clone();
        const g = new THREE.BufferGeometry();
        if (src.index) g.setIndex(src.index.clone());
        for (const [k, a] of Object.entries(src.attributes)) {
            const il = a.isInterleavedBufferAttribute, arr = il ? a.data.array : a.array, st = il ? a.data.stride : a.itemSize, off = il ? a.offset : 0;
            const n = a.itemSize, out = new Float32Array(a.count * n);
            const sc = !a.normalized ? 1 : arr instanceof Int8Array ? 127 : arr instanceof Uint8Array ? 255 : arr instanceof Int16Array ? 32767 : arr instanceof Uint16Array ? 65535 : 1;
            for (let i = 0; i < a.count; i++) for (let j = 0; j < n; j++) { const v = arr[i * st + off + j]; out[i * n + j] = sc === 1 ? v : Math.max(-1, v / sc); }
            g.setAttribute(k, new THREE.BufferAttribute(out, n));
        }
        for (const gr of src.groups) g.addGroup(gr.start, gr.count, gr.materialIndex);
        g.name = src.name;
        g.userData = Object.assign({}, src.userData);
        return g;
    },
    /* colors kept in a mesh arrive as glTF's linear values: turned back into the colors as painted, which is how the
       game shows its pictures (a mesh's colors would otherwise come out darker and more saturated than designed) */
    srgb(g) {
        const c = g.attributes.color;
        if (!c) return;
        const a = c.array, max = a instanceof Uint16Array ? 65535 : a instanceof Uint8Array ? 255 : 1, n = c.itemSize;
        for (let i = 0; i < a.length; i++) {
            if (n === 4 && i % 4 === 3) continue;
            const v = a[i] / max, s = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
            a[i] = max === 1 ? s : Math.round(s * max);
        }
    },
    material(m, name) {
        // (flames: unlit, their own colors)
        if (/glow/i.test(m.name || '')) { const b = r3Patch(new THREE.MeshBasicMaterial({ vertexColors: true }), { key: 'envmodelglow', see: this.tall(name) }); b.name = m.name; return b; }
        const glass = /glass/i.test(m.name || '');
        // (a display case's glass: see-through, a faint sheen)
        if (/_clear$/.test(m.name || '')) { const c = r3Patch(new THREE.MeshStandardMaterial({ vertexColors: !!m.vertexColors, color: m.color, roughness: 0.1, metalness: 0, transparent: true, opacity: 0.28, depthWrite: false }), { key: 'envmodelclear' }); c.name = m.name; return c; }
        if (m.map) m.map.encoding = THREE.LinearEncoding;
        const opts = { map: m.map || null, color: m.map ? 0xffffff : m.color, roughness: glass ? 0.35 : /gloss/.test(m.name || '') ? 0.5 : 0.92, metalness: 0, vertexColors: !m.map && !!m.vertexColors };
        // (the pines' needle tufts are mostly in the normal map: a little stronger than baked, as the concept's are crisp)
        if (m.normalMap) { opts.normalMap = m.normalMap; opts.normalScale = (m.normalScale ? m.normalScale.clone() : new THREE.Vector2(1, 1)).multiplyScalar(/^pine_/.test(name) ? 1.7 : 1); }
        // the windows glow at night (EnvBuild's tick turns them up), their curtains brightest
        if (glass) { opts.emissive = new THREE.Color(0xffd890); opts.emissiveMap = m.map || null; opts.emissiveIntensity = 0.0; }
        // (only what's tall enough to hide Sarah fades in front of her: the folks and critters, the furniture, the
        // flowers and the low props never do)
        const see = this.tall(name);
        // (the grass along a wall's top and the moss in it go with the season, like the lawn: R3U.uGrassTint)
        if (/^wall/.test(name)) return Object.assign(r3Patch(new THREE.MeshStandardMaterial(opts), { key: 'envwall', fhead: 'uniform vec4 uGrassTint;\n', fmap: `
            float gm = smoothstep(0.015, 0.06, diffuseColor.g - max(diffuseColor.r, diffuseColor.b));
            diffuseColor.rgb = mix(diffuseColor.rgb, min(diffuseColor.rgb * uGrassTint.rgb, vec3(1.0)), gm);
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.88, 0.91, 0.96), gm * uGrassTint.w);` }), { name: m.name || name });
        const out = r3Patch(new THREE.MeshStandardMaterial(opts), { key: glass ? 'envmodelglass' : see ? 'envmodel' : 'envfolk', see });
        out.name = m.name || name;
        if (glass) this.glassMats.push(out);
        return out;
    },
    glassMats: [], _tints: new Map(),
    // (fruit too: it hangs on a tree, and must fade with it, or it would hang in the air where a tree was)
    tall(name) { return /^(tree_|pine_|palm_|fruit_|bld_|house_|cottage|shop|windmill|grand_lights)/.test(name || ''); },
    /* a copy of a model's material in another color (a house painted in its own look); a plain clone would lose the
       view's patch (the bend, depth of field, shadows) */
    tinted(m, color) {
        const c = m.clone();
        c.onBeforeCompile = null;
        c.color.set(color);
        return r3Patch(c, { key: 'envmodel', see: !!(m._r3o && m._r3o.see) });
    },
    /* one model at many places (each a Matrix4 in the world): an instanced mesh per part */
    instances(group, name, matrices, o) {
        o = o || {};
        const M = this.models[name], out = [];
        if (!M || !matrices.length) return out;
        for (const p of M.parts) {
            // (a part shaded in greys for painting, *_top or *_trim, in o.tint's color: a flower's petals)
            let mat = p.material;
            const role = o.tint && /_(top|trim)$/.exec(mat.name || '');
            if (role && o.tint[role[1]]) {
                const k = mat.uuid + o.tint[role[1]];
                if (!this._tints.has(k)) this._tints.set(k, this.tinted(mat, o.tint[role[1]]));
                mat = this._tints.get(k);
            }
            const mesh = new THREE.InstancedMesh(p.geometry, this.instMat(mat), matrices.length);
            matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
            mesh.instanceMatrix.needsUpdate = true;
            mesh.castShadow = o.shadow !== false; mesh.receiveShadow = true;
            mesh.frustumCulled = false;
            group.add(mesh);
            out.push(mesh);
        }
        return out;
    },
    /* (an instanced copy of a part's material: the bend has to read the instance's own matrix) */
    instMat(m) {
        if (m._inst) return m._inst;
        const c = m.clone();
        c.onBeforeCompile = null;
        // (with the original's options, so a wall's seasonal grass comes along)
        const o = m._r3o || {};
        m._inst = r3Patch(c, Object.assign({}, o, { key: (o.key || (m.isMeshBasicMaterial ? 'envmodelglow' : m.emissiveMap ? 'envmodelglass' : 'envmodel')) + 'i', inst: true, see: !!o.see }));
        if (m.emissiveMap) this.glassMats.push(m._inst);
        return m._inst;
    },
    /* one model at one place: its parts as plain meshes */
    place(group, name, matrix, o) {
        o = o || {};
        const M = this.models[name], out = [];
        if (!M) return out;
        for (const p of M.parts) {
            const mesh = new THREE.Mesh(p.geometry, p.material);
            mesh.matrixAutoUpdate = false;
            mesh.matrix.copy(matrix);
            mesh.castShadow = o.shadow !== false; mesh.receiveShadow = true;
            group.add(mesh);
            out.push(mesh);
        }
        return out;
    },
    /* the windows' glow (0 by day, up to 1 late at night) */
    glow(g) { for (const m of this.glassMats) m.emissiveIntensity = g * 1.1; },
    mat4(x, y, z, rotY, sx, sy, sz) {
        const m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY || 0);
        return m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sx || 1, sy == null ? (sx || 1) : sy, sz == null ? (sx || 1) : sz));
    },
};
/* (in the test area, and on Sarah's island where the new look is on, start fetching them at once) */
if (window.IS_LAB || ENV_ISLAND) setTimeout(() => EnvModels.load(), 0);
