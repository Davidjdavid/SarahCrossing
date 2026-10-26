/* ---- 33n_env_ghost.js ---- */
/* The see-through in the new look, without a dotted pattern: whatever stands between the camera and Sarah near her on
   screen, and anything right in front of the camera, fades to a soft ghost of itself. The main pass leaves those pixels
   out (r3Patch, o.see); here a second pass draws them again, only there, see-through: first their depth (so only the
   nearest surface of a tree shows, not every leaf behind it), then their colors laid over what's behind. Only the few
   things near Sarah or the bottom of the view take part: a model placed many times gets a small copy holding just those
   copies (from EnvCull's full list), a model placed once (a building, a house) a copy of itself. The copies live on
   layer 1, which only the second pass draws (Post3.render). */
const EnvGhost = {
    LAYER: 1,
    on: false, items: [], live: [],
    /* after Env builds: everything that can fade */
    collect(r3, group) {
        this.clear(r3);
        const byMesh = new Map(EnvCull.list.map(T => [T.m, T]));
        group.traverse(o => {
            const m = o.material;
            if (!o.isMesh || Array.isArray(m) || !m || !m._r3o || !m._r3o.see || o.userData.ghost) return;
            if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
            this.items.push({ src: o, T: byMesh.get(o) || null, d: null, c: null });
        });
        // (the lights light the second pass too)
        r3.scene.traverse(o => { if (o.isLight) o.layers.enable(this.LAYER); });
        this.r3 = r3; this.key = ''; this.frame = 0;
    },
    clear(r3) {
        for (const it of this.items) for (const g of [it.d, it.c]) if (g && g.parent) g.parent.remove(g);
        this.items = []; this.live = []; this.on = false;
    },
    /* the two materials a faded thing is drawn with: its depth first, then its colors */
    mats(m) {
        if (m._ghost) return m._ghost;
        const mk = (depth) => {
            const g = m.clone();
            r3Patch(g, Object.assign({}, m._r3o, { ghost: true }));
            if (depth) { g.colorWrite = false; g.polygonOffset = true; g.polygonOffsetFactor = 1; g.polygonOffsetUnits = 2; }
            else Object.assign(g, { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor });
            return g;
        };
        return (m._ghost = [mk(true), mk(false)]);
    },
    /* the copies of one thing (made the first time it's near) */
    make(it) {
        const [md, mc] = this.mats(it.src.material), s = it.src, scene = this.r3.scene;
        for (const [k, mat, order] of [['d', md, 0], ['c', mc, 3]]) {
            let g;
            if (it.T) {
                g = new THREE.InstancedMesh(s.geometry, mat, it.T.n);
                if (k === 'c') { g.instanceMatrix = it.d.instanceMatrix; if (it.d.instanceColor) g.instanceColor = it.d.instanceColor; }
                else if (it.T.cols) g.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(it.T.n * 3), 3);
                g.count = 0;
            } else {
                g = new THREE.Mesh(s.geometry, mat);
                g.matrixAutoUpdate = false;
            }
            g.frustumCulled = false; g.castShadow = false; g.receiveShadow = true; g.renderOrder = order;
            g.layers.set(this.LAYER); g.userData.ghost = true; g.visible = false;
            scene.add(g);
            it[k] = g;
        }
    },
    /* each frame: which things could be fading now (the shader decides each pixel; this only has to be generous) */
    update(r3) {
        if (!this.items.length) { this.on = false; return; }
        const U = R3U.uSee.value, D = R3U.uDof.value, cam = r3.camera;
        // (again only when Sarah or the view has moved, and now and then anyway)
        const key = [U.x, U.y, U.z, U.w, cam.position.x, cam.position.z].map(v => Math.round(v * 40)).join(',');
        if (key === this.key && this.frame++ % 30) return;
        this.key = key;
        cam.updateMatrixWorld();
        const V = cam.matrixWorldInverse.elements, Pm = cam.projectionMatrix.elements, asp = cam.aspect;
        const nearZ = D.z > D.w ? D.z : 0, seeZ = U.w > 0 ? U.z - 0.8 : -1, v = r3.view;
        const vx0 = v ? v.x0 / TILE - 4 : -1e9, vx1 = v ? v.x1 / TILE + 4 : 1e9, vy0 = v ? v.y0 / TILE - 4 : -1e9, vy1 = v ? v.y1 / TILE + 8 : 1e9;
        // could a sphere at (x, y, z) of radius r be fading? near the camera, or in front of Sarah and near her on screen
        const fades = (x, y, z, r) => {
            const vz = -(V[2] * x + V[6] * y + V[10] * z + V[14]);
            if (vz + r < 0.3) return false;
            const vx = V[0] * x + V[4] * y + V[8] * z + V[12], vy = V[1] * x + V[5] * y + V[9] * z + V[13], d = Math.max(0.3, vz);
            const nx = Pm[0] * vx / d, ny = Pm[5] * vy / d, rn = r * Pm[5] / d;
            // (off the screen it can't show, faded or not)
            if (nx - rn * 1.2 > 1.05 || nx + rn * 1.2 < -1.05 || ny - rn > 1.05 || ny + rn < -1.05) return false;
            if (vz - r < nearZ) return true;
            if (vz - r >= seeZ) return false;
            return Math.hypot((nx - U.x) * asp, ny - U.y) < U.w + rn * 1.2;
        };
        const live = [];
        for (const it of this.items) {
            const s = it.src, bs = s.geometry.boundingSphere;
            if (it.T) {
                const T = it.T, A = T.all;
                let k = 0, dst = null, dc = null;
                for (let i = 0; i < T.n; i++) {
                    const px = T.px[i], pz = T.pz[i];
                    if (px < vx0 || px > vx1 || pz < vy0 || pz > vy1) continue;
                    const o = i * 16, sc = Math.hypot(A[o], A[o + 1], A[o + 2]);
                    if (sc === 0) continue;
                    if (!fades(A[o + 12], A[o + 13] + bs.center.y * sc, A[o + 14], bs.radius * sc + 0.2)) continue;
                    if (!it.d) this.make(it);
                    if (!dst) { dst = it.d.instanceMatrix.array; dc = T.cols && it.d.instanceColor ? it.d.instanceColor.array : null; }
                    dst.set(A.subarray(o, o + 16), k * 16);
                    if (dc) dc.set(T.cols.subarray(i * 3, i * 3 + 3), k * 3);
                    k++;
                }
                if (it.d) {
                    it.d.count = it.c.count = k;
                    it.d.visible = it.c.visible = k > 0 && s.visible !== false;
                    if (k) { it.d.instanceMatrix.needsUpdate = true; if (it.d.instanceColor) it.d.instanceColor.needsUpdate = true; live.push(it); }
                }
            } else {
                if (!s.visible || !s.parent) { if (it.d) it.d.visible = it.c.visible = false; continue; }
                s.updateMatrixWorld();
                const c = this._c || (this._c = new THREE.Vector3());
                c.copy(bs.center).applyMatrix4(s.matrixWorld);
                const sc = s.matrixWorld.getMaxScaleOnAxis();
                const on = fades(c.x, c.y, c.z, bs.radius * sc + 0.2);
                if (on && !it.d) this.make(it);
                if (it.d) {
                    it.d.visible = it.c.visible = on;
                    if (on) { it.d.matrix.copy(s.matrixWorld); it.c.matrix.copy(s.matrixWorld); it.d.matrixWorld.copy(s.matrixWorld); it.c.matrixWorld.copy(s.matrixWorld); live.push(it); }
                }
            }
        }
        this.live = live;
        this.on = live.length > 0;
    },
    hide() { for (const it of this.items) if (it.d) it.d.visible = it.c.visible = false; this.on = false; this.key = ''; },
};
