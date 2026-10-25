/* ---- 33g_env_models.js ---- */
/* The models made in Blender (tools/blender/*.py, game/assets/models/*.glb) for the new 3D look: trees, buildings, walls,
   furniture, plants, props. Loaded once (in the test area, from the start, so they're usually there before the
   island is), each turned into parts (a geometry and a material) whose materials join the rest of the view (the bend
   toward the horizon, depth of field, shadows); a model placed many times is drawn as one instanced mesh per part.
   Phones load the lighter version of a model where there is one (name_lod1). The colors in the models' pictures are used
   as they are, like the game's other pictures (no color-space conversion), and colors kept in a mesh are turned back
   into the colors as painted. */
const EnvModels = {
    models: {}, textures: {}, ready: false, failed: false, _p: null,
    phone() { try { return matchMedia('(pointer: coarse)').matches || Math.min(screen.width, screen.height) < 600; } catch (e) { return false; } },
    /* the names to fetch: each model once, its phone version on phones */
    names() {
        const all = Object.keys(window.MODELS || {}), phone = this.phone();
        return all.filter(n => phone ? !all.includes(n + '_lod1') : !/_lod\d$/.test(n));
    },
    load() {
        if (this._p) return this._p;
        if (typeof THREE === 'undefined' || !THREE.GLTFLoader || !window.MODELS) { this.failed = true; return (this._p = Promise.resolve(false)); }
        const loader = new THREE.GLTFLoader(), tl = new THREE.TextureLoader();
        // (the ground's surfaces too: repeating, sharp at a slant, their colors as they are; the file's top row is north)
        const texs = Object.entries(window.TEXTURES || {}).map(([n, url]) => new Promise((ok, bad) => tl.load(url, t => {
            t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.flipY = false; t.encoding = THREE.LinearEncoding; t.needsUpdate = true;
            this.textures[n] = t; ok();
        }, undefined, bad)));
        this._p = Promise.all(this.names().map(n => new Promise((ok, bad) => loader.load(window.MODELS[n], g => ok([n, g]), undefined, bad))).concat(texs))
            .then(list => {
                for (const it of list) if (it) { const [n, g] = it; this.models[n.replace(/_lod\d$/, '')] = this.prepare(g.scene, n); }
                this.ready = true;
                return true;
            })
            .catch(e => { console.error('the models could not be loaded (the new look draws its own)', e); this.failed = true; return false; });
        return this._p;
    },
    has(name) { return this.ready && !!this.models[name]; },
    /* a loaded scene as parts, each geometry in the model's own space (y up, its front toward +z) */
    prepare(scene, name) {
        const parts = [], anchors = {};
        scene.updateMatrixWorld(true);
        scene.traverse(o => {
            // (named empties mark spots on a model: anchor_fruit_0.. where its fruit hangs)
            if (/^anchor_/.test(o.name)) { const k = o.name.replace(/^anchor_/, '').replace(/_\d+$/, ''); (anchors[k] = anchors[k] || []).push(new THREE.Vector3().setFromMatrixPosition(o.matrixWorld)); return; }
            if (!o.isMesh) return;
            const g = o.geometry.clone();
            g.applyMatrix4(o.matrixWorld);
            this.srgb(g);
            g.computeBoundingSphere();
            for (const m of [].concat(o.material)) parts.push({ geometry: g, material: this.material(m, name), glass: /glass/i.test(m.name || '') });
        });
        return { parts, name, anchors };
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
        if (/glow/i.test(m.name || '')) { const b = r3Patch(new THREE.MeshBasicMaterial({ vertexColors: true }), { key: 'envmodelglow' }); b.name = m.name; return b; }
        const glass = /glass/i.test(m.name || '');
        if (m.map) m.map.encoding = THREE.LinearEncoding;
        const opts = { map: m.map || null, color: m.map ? 0xffffff : m.color, roughness: glass ? 0.35 : /gloss/.test(m.name || '') ? 0.5 : 0.92, metalness: 0, vertexColors: !m.map && !!m.vertexColors };
        // (the pines' needle tufts are mostly in the normal map: a little stronger than baked, as the concept's are crisp)
        if (m.normalMap) { opts.normalMap = m.normalMap; opts.normalScale = (m.normalScale ? m.normalScale.clone() : new THREE.Vector2(1, 1)).multiplyScalar(/^pine_/.test(name) ? 1.7 : 1); }
        // the windows glow at night (EnvBuild's tick turns them up), their curtains brightest
        if (glass) { opts.emissive = new THREE.Color(0xffd890); opts.emissiveMap = m.map || null; opts.emissiveIntensity = 0.0; }
        const out = r3Patch(new THREE.MeshStandardMaterial(opts), { key: glass ? 'envmodelglass' : 'envmodel' });
        out.name = m.name || name;
        if (glass) this.glassMats.push(out);
        return out;
    },
    glassMats: [],
    /* a copy of a model's material in another color (a house painted in its own look); a plain clone would lose the
       view's patch (the bend, depth of field, shadows) */
    tinted(m, color) {
        const c = m.clone();
        c.onBeforeCompile = null;
        c.color.set(color);
        return r3Patch(c, { key: 'envmodel' });
    },
    /* one model at many places (each a Matrix4 in the world): an instanced mesh per part */
    instances(group, name, matrices, o) {
        o = o || {};
        const M = this.models[name], out = [];
        if (!M || !matrices.length) return out;
        for (const p of M.parts) {
            const mesh = new THREE.InstancedMesh(p.geometry, this.instMat(p.material), matrices.length);
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
        m._inst = r3Patch(c, { key: (m.isMeshBasicMaterial ? 'envmodelglow' : m.emissiveMap ? 'envmodelglass' : 'envmodel') + 'i', inst: true });
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
/* (in the test area, start fetching them at once) */
if (window.IS_LAB) setTimeout(() => EnvModels.load(), 0);
