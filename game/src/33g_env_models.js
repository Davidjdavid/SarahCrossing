/* ---- 33g_env_models.js ---- */
/* The models made in Blender (tools/blender/*.py, game/assets/models/*.glb) for the new 3D look: the autumn maples, the
   cottage, the stone wall's pieces. Loaded once (in the test area, from the start, so they're usually there before the
   island is), each turned into parts (a geometry and a material) whose materials join the rest of the view (the bend
   toward the horizon, depth of field, shadows); a model placed many times is drawn as one instanced mesh per part.
   Phones load the lighter version of a model where there is one (name_lod1). The colors in the models' pictures are used
   as they are, like the game's other pictures (no color-space conversion). */
const EnvModels = {
    models: {}, ready: false, failed: false, _p: null,
    phone() { try { return matchMedia('(pointer: coarse)').matches || Math.min(screen.width, screen.height) < 600; } catch (e) { return false; } },
    /* the names to fetch: each model once, its phone version on phones */
    names() {
        const all = Object.keys(window.MODELS || {}), phone = this.phone();
        return all.filter(n => phone ? !all.includes(n + '_lod1') : !/_lod\d$/.test(n));
    },
    load() {
        if (this._p) return this._p;
        if (typeof THREE === 'undefined' || !THREE.GLTFLoader || !window.MODELS) { this.failed = true; return (this._p = Promise.resolve(false)); }
        const loader = new THREE.GLTFLoader();
        this._p = Promise.all(this.names().map(n => new Promise((ok, bad) => loader.load(window.MODELS[n], g => ok([n, g]), undefined, bad))))
            .then(list => {
                for (const [n, g] of list) this.models[n.replace(/_lod\d$/, '')] = this.prepare(g.scene, n);
                this.ready = true;
                return true;
            })
            .catch(e => { console.error('the models could not be loaded (the new look draws its own)', e); this.failed = true; return false; });
        return this._p;
    },
    has(name) { return this.ready && !!this.models[name]; },
    /* a loaded scene as parts, each geometry in the model's own space (y up, its front toward +z) */
    prepare(scene, name) {
        const parts = [];
        scene.updateMatrixWorld(true);
        scene.traverse(o => {
            if (!o.isMesh) return;
            const g = o.geometry.clone();
            g.applyMatrix4(o.matrixWorld);
            g.computeBoundingSphere();
            for (const m of [].concat(o.material)) parts.push({ geometry: g, material: this.material(m, name), glass: /glass/i.test(m.name || '') });
        });
        return { parts, name };
    },
    material(m, name) {
        const glass = /glass/i.test(m.name || '');
        if (m.map) m.map.encoding = THREE.LinearEncoding;
        const opts = { map: m.map || null, color: m.map ? 0xffffff : m.color, roughness: glass ? 0.35 : 0.92, metalness: 0 };
        // (the maples' leaf clumps are mostly in the normal map: a little stronger than baked, as the concept's are crisp)
        if (m.normalMap) { opts.normalMap = m.normalMap; opts.normalScale = (m.normalScale ? m.normalScale.clone() : new THREE.Vector2(1, 1)).multiplyScalar(/^tree_/.test(name) ? 1.7 : 1); }
        // the windows glow at night (EnvBuild's tick turns them up), their curtains brightest
        if (glass) { opts.emissive = new THREE.Color(0xffd890); opts.emissiveMap = m.map || null; opts.emissiveIntensity = 0.0; }
        const out = r3Patch(new THREE.MeshStandardMaterial(opts), { key: glass ? 'envmodelglass' : 'envmodel' });
        out.name = m.name || name;
        if (glass) this.glassMats.push(out);
        return out;
    },
    glassMats: [],
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
        m._inst = r3Patch(c, { key: (m.emissiveMap ? 'envmodelglass' : 'envmodel') + 'i', inst: true });
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
