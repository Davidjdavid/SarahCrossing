/* ---- 33i_env_contact.js ---- */
/* Soft dark patches on the ground right under things (trees, bushes, props, buildings) in the new 3D look, as the concept
   grounds them: the sun's shadow falls off to one side, this is the light the sky can't reach underneath. One instanced
   quad lying on the ground per thing, darkest in the middle; it leaves the picture's alpha (the depth of field's) alone. */
const EnvContact = {
    build(group, a) {
        const list = [];
        const add = (x, z, rx, rz, k) => list.push([x, z, rx, rz, k == null ? 1 : k]);
        for (const e of a.ents) {
            const x = e.x / TILE, z = e.y / TILE * R3_ZS, k = e.kind;
            const T = k === 'tree' || k === 'fruittree' || k === 'palm' || k === 'bigtree' || k === 'oldtree' || k === 'bush' ? Env.tileSpot(e) : null;
            if (k === 'tree' || k === 'fruittree' || k === 'palm') add(T.x, T.z, /^palm/.test(e.frame || '') ? 0.7 : 1.25, 1.0, 0.9);
            else if (k === 'bigtree' || k === 'oldtree') add(T.x, T.z, 1.8, 1.5, 0.9);
            else if (k === 'bush') add(T.x, T.z, 0.7, 0.55, 0.9);
            else if (k === 'bench') add(x, z - 0.1, 0.85, 0.5, 0.8);
            else if (k === 'lamp' || k === 'mailbox') add(x, z, 0.38, 0.32, 0.8);
            else if (k === 'building' && e.b) { const b = e.b; add(b.x + b.w / 2, (b.y + b.h - 0.4) * R3_ZS, b.w * 0.62, 0.9, 1); }
        }
        if (!list.length) return { meshes: [] };
        const geo = new THREE.PlaneGeometry(2, 2);
        geo.rotateX(-Math.PI / 2);
        const mat = new THREE.MeshBasicMaterial({ map: this.tex(), color: 0x10140a, transparent: true, depthWrite: false, opacity: 0.42 });
        Object.assign(mat, { blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor });
        mat.polygonOffset = true; mat.polygonOffsetFactor = -2; mat.polygonOffsetUnits = -2;
        const m = new THREE.InstancedMesh(geo, r3Patch(mat, { key: 'envcontact', inst: true, noDof: true, noCloud: true }), list.length);
        const M = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
        list.forEach(([x, z, rx, rz, k], i) => {
            p.set(x, EnvGround.heightAt(x, z / R3_ZS) + 0.025, z);
            s.set(rx, 1, rz * k);
            M.compose(p, q, s); m.setMatrixAt(i, M);
        });
        m.instanceMatrix.needsUpdate = true;
        m.renderOrder = 1; m.frustumCulled = false;
        group.add(m);
        return { meshes: [m] };
    },
    /* a soft round patch (alpha falling off from the middle) */
    tex() {
        if (this._t) return this._t;
        const cv = document.createElement('canvas'); cv.width = cv.height = 64;
        const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
        return (this._t = new THREE.CanvasTexture(cv));
    },
};
/* Warm pools of light on the ground at night round the street lamps, lanterns and lit doorways: the scene has only a few
   real lights (the nearest), so these show where every light falls. One instanced quad lying on the ground per light,
   added to what's under it, coming up as the lamps come on. */
const EnvGlow = {
    build(group, a) {
        const list = [];
        for (const e of a.ents) {
            // (a street lamp's pool reaches far round it, as its light does; a lantern's or a fire's stays small)
            if (e.light && !e.furn) list.push([e.x / TILE, e.y / TILE + 0.15, e.kind === 'lamp' ? Math.max(6.5, e.light.r / TILE * 4) : Math.max(1.6, e.light.r / TILE * 1.05), e.holiday ? 0.7 : 1, 0xffc27a]);
            else if (e.kind === 'building' && e.b) { const b = e.b; list.push([b.x + b.w / 2, b.y + b.h + 0.35, Math.min(2.2, b.w * 0.42), 0.55, e.id === 'club' ? 0xff6ab0 : 0xffc27a]); }
        }
        if (!list.length) return { meshes: [] };
        const geo = new THREE.PlaneGeometry(2, 2);
        geo.rotateX(-Math.PI / 2);
        const mat = new THREE.MeshBasicMaterial({ map: EnvContact.tex(), color: 0xffffff, transparent: true, depthWrite: false, opacity: 0 });
        // (added to the ground's color; the picture's alpha, the depth of field's, left alone)
        Object.assign(mat, { blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor });
        mat.polygonOffset = true; mat.polygonOffsetFactor = -3; mat.polygonOffsetUnits = -3;
        const m = new THREE.InstancedMesh(geo, r3Patch(mat, { key: 'envglow', inst: true, noDof: true, noCloud: true }), list.length);
        const M = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color();
        list.forEach(([x, y, r, k, col], i) => {
            p.set(x, EnvGround.heightAt(x, y) + 0.03, y * R3_ZS);
            s.set(r, 1, r * 0.9);
            M.compose(p, q, s); m.setMatrixAt(i, M);
            m.setColorAt(i, c.set(col).multiplyScalar(k));
        });
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
        m.renderOrder = 1; m.frustumCulled = false;
        m.visible = false;
        group.add(m);
        return { meshes: [m], tick: () => { const k = G.lamps || 0; m.visible = k > 0.02 && m.count > 0; mat.opacity = k * 0.58; } };
    },
};
