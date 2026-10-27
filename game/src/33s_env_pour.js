/* ---- 33s_env_pour.js ---- */
/* Watering in the new look: drops falling from the spout of the can in Sarah's hand (EnvDolls.canModel) while she pours
   (the water pose, p.tool 'can'), little beads that fall onto the flowers and are gone. The flat views draw them as
   pixels (waterFx). */
const EnvPour = {
    N: 72,
    on() { return typeof Env !== 'undefined' && Env.on && !!this.group && typeof R3 !== 'undefined' && R3.active() && !!G.area && !G.area.interior; },
    build(group) {
        const g = this.group = new THREE.Group();
        group.add(g);
        const geo = new THREE.SphereGeometry(0.026, 6, 4);
        const mat = r3Patch(new THREE.MeshBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.85, depthWrite: false }), { key: 'envpour', noDof: true, noEdge: true });
        this.drops = Array.from({ length: this.N }, () => { const m = new THREE.Mesh(geo, mat); m.visible = false; m.scale.set(1, 1.7, 1); m.renderOrder = 3; g.add(m); return { m, t: -1, v: new THREE.Vector3() }; });
        this.next = 0;
        return { meshes: [], tick: () => this.tick() };
    },
    /* the tip of the can's spout in the world (furn_e.py's can: the rose at x 0.24, z 0.24) */
    spout(out) {
        const d = typeof EnvDolls !== 'undefined' && EnvDolls.dolls && EnvDolls.dolls.get(G.player);
        if (!d || d.tool !== 'can' || !d.toolMesh || !d.toolMesh.children[0]) return null;
        d.root.updateMatrixWorld(true);
        return d.toolMesh.children[0].localToWorld(out.set(0.25, 0.235, 0));
    },
    tick() {
        const p = G.player, pour = this.on() && p && p.tool && p.tool.kind === 'can' && p.tool.t >= 8 && p.tool.t < 30;
        const at = pour && this.spout(this._s || (this._s = new THREE.Vector3()));
        if (at) for (let k = 0; k < 3; k++) {
            const q = this.drops[this.next++ % this.N];
            q.t = 0; q.m.visible = true;
            q.m.position.set(at.x + (Math.random() - 0.5) * 0.03, at.y, at.z + (Math.random() - 0.5) * 0.03);
            q.v.set((Math.random() - 0.5) * 0.004, -0.006, (Math.random() - 0.5) * 0.004);
        }
        for (const q of this.drops) {
            if (q.t < 0) continue;
            q.t++;
            q.v.y -= 0.0022;
            q.m.position.add(q.v);
            if (q.t > 70 || q.m.position.y < Env.groundH(q.m.position.x * TILE, q.m.position.z / R3_ZS * TILE)) { q.t = -1; q.m.visible = false; }
        }
    },
};
