/* ---- 33j_env_decals.js ---- */
/* What lies flat on the ground in the new look (a garden plot and what grows in it, the volleyball court's lines, a dug
   hole): each drawn by its usual 2D drawing into a small picture and laid on the ground, following its shape; drawn
   again when it changes (a plot's stage), and only near the view. */
const EnvDecals = {
    SCALE: 4,           // picture pixels to a world pixel (the classic art, kept sharp)
    build(group, a) {
        this.group = new THREE.Group();
        group.add(this.group);
        this.list = new Map();
        let frame = 0;
        return { meshes: [], tick: (r3, a) => { if (frame++ % 10 === 0) this.update(r3, a); } };
    },
    sig(e) {
        let s = (e.frame || '') + (e.hidden ? 'h' : '') + (e.x | 0) + ',' + (e.y | 0);
        if (e.kind === 'plot') { const pl = S.plots[e.idx]; s += pl ? plotStage(pl) + pl.seed : '-'; }
        return s;
    },
    update(r3, a) {
        const v = r3.view;
        if (!v) return;
        const seen = new Set();
        for (const e of a.ents) {
            if (e.layer !== 0 || e.kind === 'waterfall' || (e.kind === 'plot' && EnvModels.has('planter_box'))) continue;
            if (e.x < v.x0 - 64 || e.x > v.x1 + 64 || e.y < v.y0 - 64 || e.y > v.y1 + 96) continue;
            seen.add(e);
            const s = this.sig(e);
            let d = this.list.get(e);
            if (d && d.sig === s) continue;
            if (d) { this.drop(d); this.list.delete(e); }
            if (e.hidden) continue;
            d = this.make(e);
            if (d) { d.sig = s; this.list.set(e, d); }
        }
        for (const [e, d] of this.list) if (!seen.has(e)) { this.drop(d); this.list.delete(e); }
    },
    /* its picture, from its frame's size (a plot: its soil and what grows up out of it) */
    make(e) {
        const fr = e.frame && Assets.frames[e.frame];
        let w = 24, h = 32, ax = 12, ay = 24;
        if (fr) { w = fr[2]; h = fr[3]; ax = fr[4]; ay = fr[5]; }
        const K = this.SCALE, x0 = e.x - ax - 2, y0 = e.y - ay - 2, W = w + 4, H = h + 4;
        const cv = document.createElement('canvas');
        cv.width = W * K; cv.height = H * K;
        const g = cv.getContext('2d');
        g.imageSmoothingEnabled = false;
        g.scale(K, K);
        g.translate(-x0, -y0);
        const was = R3.drawingCard;
        R3.drawingCard = false;
        try { if (e.draw) e.draw(g); else if (e.frame) spr(g, e.frame, e.x, e.y, e.flip); }
        finally { R3.drawingCard = was; }
        const tex = new THREE.CanvasTexture(cv);
        tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4;
        // a sheet lying on the ground, a point every half tile so it follows the ground's shape
        const nx = Math.max(2, Math.ceil(W / TILE * 2) + 1), ny = Math.max(2, Math.ceil(H / TILE * 2) + 1), pos = [], uv = [], idx = [];
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
            const u = i / (nx - 1), t = j / (ny - 1), wx = (x0 + u * W) / TILE, wy = (y0 + t * H) / TILE;
            pos.push(wx, EnvGround.heightAt(wx, wy) + 0.03, wy * R3_ZS);
            uv.push(u, 1 - t);
        }
        for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) { const p = j * nx + i; idx.push(p, p + nx, p + 1, p + 1, p + nx, p + nx + 1); }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        geo.computeVertexNormals();
        const mat = r3Patch(new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5 }), { key: 'envdecal' });
        mat.polygonOffset = true; mat.polygonOffsetFactor = -3; mat.polygonOffsetUnits = -3;
        const mesh = new THREE.Mesh(geo, mat);
        mesh.receiveShadow = true;
        this.group.add(mesh);
        return { mesh, tex };
    },
    drop(d) {
        this.group.remove(d.mesh);
        d.mesh.geometry.dispose(); d.mesh.material.dispose(); d.tex.dispose();
    },
};
