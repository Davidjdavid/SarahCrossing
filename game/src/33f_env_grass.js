/* ---- 33f_env_grass.js ---- */
/* Grass and little flowers for the new 3D look (33a_env.js): thousands of tufts of curved blades on the grass (one mesh,
   copies of a few tufts), darker at the root and lit like the ground under them so they melt into it, swaying in the
   breeze; thicker along the edges of paths, where they lean over; and little flowers in patches (white, yellow, pink,
   lilac), as in the concept. Phones get fewer. */
const EnvGrass = {
    /* (the grass comes with each piece of ground: Env's chunks call chunk()) */
    build(group, a) {
        this.season = a.bgSeason || Clock.season();
        this.meshes = [];
        this.mats = null;
        // the tiles trees stand on (grass grows round them, though the tile is blocked)
        this.treeAt = new Set();
        for (const e of a.ents) if (e.kind === 'tree') this.treeAt.add(Math.floor(e.x / TILE) + ',' + Math.floor(e.y / TILE));
        return { meshes: this.meshes };
    },
    /* the tufts and flowers on one piece */
    chunk(c, a) {
        const season = this.season;
        if (season === 'winter') return;
        const phone = R3.phone, Wt = W0.w, Ht = W0.h, G = EnvGround, r = mulberry(hash32('grass' + c.cx + ',' + c.cy));
        // where the grass grows: open grass (not under a building, a prop, water, a cliff)
        const blocked = (x, y) => a.blockedAt(Math.floor(x), Math.floor(y)) && !this.treeAt.has(Math.floor(x) + ',' + Math.floor(y));
        const per = Math.round((phone ? 4 : 11) * (window.__envDbg && window.__envDbg.grass != null ? window.__envDbg.grass : 1)), tufts = [], flowers = [];
        const fnoise = this.fnoise || (this.fnoise = EnvTex.noise(256, 12, 991));
        for (let ty = c.y0; ty < c.y0 + c.h; ty++) for (let tx = c.x0; tx < c.x0 + c.w; tx++) {
            for (let k = 0; k < per; k++) {
                const x = tx + r(), y = ty + r(), g = G.grassAt(x, y);
                if (g < 0.35) continue;
                if (this.steep(x, y)) continue;
                if (G.wetAt(x, y) > 0.1) continue;           // (not on a pond's or stream's damp bank)
                if (blocked(x, y) && r() < 0.85) continue;
                const edge = g < 0.75;                        // at a path's edge: a bit taller, leaning out
                tufts.push([x, y, edge]);
                // flowers in patches
                const patch = fnoise((x / Wt) * 256, (y / Ht) * 256);
                if (!phone && patch > 0.62 && r() < (patch - 0.62) * 1.8) flowers.push([x + (r() - 0.5) * 0.3, y + (r() - 0.5) * 0.3, r() * 4 | 0]);
            }
        }
        for (const m of [this.tuftMesh(c.group, tufts, season, r), this.flowerMesh(c.group, flowers, r)]) if (m) { c.meshes.push(m); this.meshes.push(m); }
    },
    steep(x, y) { const h0 = EnvGround.heightAt(x, y), e = 0.15; return Math.abs(EnvGround.heightAt(x + e, y) - h0) > 0.12 || Math.abs(EnvGround.heightAt(x, y + e) - h0) > 0.12; },
    /* one tuft: blades curving up and out from a small clump (aT: how far up the blade) */
    tuftGeo(n, r) {
        const pos = [], tv = [], idx = [];
        for (let b = 0; b < n; b++) {
            const an = r() * Math.PI * 2, off = r() * 0.07, bx = Math.cos(an) * off, bz = Math.sin(an) * off, lean = 0.08 + r() * 0.16, h = 0.7 + r() * 0.5, w = 0.028 + r() * 0.015, dir = r() * Math.PI * 2;
            const lx = Math.cos(dir) * lean, lz = Math.sin(dir) * lean, px = -Math.sin(dir), pz = Math.cos(dir), base = pos.length / 3;
            for (let s = 0; s <= 3; s++) {
                const t = s / 3, ww = w * (1 - t * 0.9), cx = bx + lx * t * t, cy = h * t, cz = bz + lz * t * t;
                pos.push(cx - px * ww, cy, cz - pz * ww, cx + px * ww, cy, cz + pz * ww); tv.push(t, t);
            }
            for (let s = 0; s < 3; s++) { const a0 = base + s * 2; idx.push(a0, a0 + 1, a0 + 2, a0 + 1, a0 + 3, a0 + 2); }
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(pos.length / 3).fill(0).flatMap(() => [0, 1, 0]), 3));
        g.setAttribute('aT', new THREE.Float32BufferAttribute(tv, 1));
        g.setIndex(idx);
        return g;
    },
    tuftMesh(group, tufts, season, r) {
        if (!tufts.length) return null;
        const geo = this.tuftGeo(R3.phone ? 4 : 6, mulberry(4242));
        const base = { spring: [0.42, 0.72, 0.28], summer: [0.36, 0.64, 0.24], fall: [0.46, 0.66, 0.24] }[season] || [0.36, 0.64, 0.24];
        const mat = r3Patch(new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide }), {
            key: 'envgrass', inst: true,
            vhead: 'attribute float aT; varying float vT;\n',
            vbody: `vT = aT;
                vec4 wp0 = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
                float sway = sin(uTime * 1.7 + wp0.x * 0.9 + wp0.z * 0.6) * 0.5 + sin(uTime * 2.9 + wp0.x * 2.1) * 0.25;
                transformed.x += sway * 0.07 * aT * aT; transformed.z += sway * 0.03 * aT * aT;`,
            fhead: 'varying float vT;\n',
            fmap: '{ diffuseColor.rgb *= 0.68 + 0.45 * vT; }',
        });
        const m = new THREE.InstancedMesh(geo, mat, tufts.length), M = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), c = new THREE.Color();
        tufts.forEach(([x, y, edge], i) => {
            const hgt = (edge ? 0.26 : 0.19) * (0.7 + r() * 0.6);
            p.set(x, EnvGround.heightAt(x, y) - 0.01, y * R3_ZS);
            q.setFromAxisAngle(up, r() * Math.PI * 2);
            s.set(0.9 + r() * 0.4, hgt, 0.9 + r() * 0.4);
            M.compose(p, q, s); m.setMatrixAt(i, M);
            const k = 0.82 + r() * 0.36, y2 = r() < 0.18 ? 0.12 : 0;           // some blades yellower
            c.setRGB(base[0] * k + y2, base[1] * k + y2 * 0.6, base[2] * k); m.setColorAt(i, c);
        });
        m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
        m.receiveShadow = true; m.castShadow = false; m.frustumCulled = false;
        group.add(m);
        return m;
    },
    /* a little flower: a stem and a five-petal head with a yellow middle */
    flowerMesh(group, flowers, r) {
        if (!flowers.length) return null;
        const pos = [], col = [], idx = [];
        const stem = [0.3, 0.55, 0.22];
        pos.push(-0.01, 0, 0, 0.01, 0, 0, 0.01, 0.2, 0, -0.01, 0.2, 0); for (let i = 0; i < 4; i++) col.push(...stem); idx.push(0, 1, 2, 0, 2, 3);
        const c0 = pos.length / 3; pos.push(0, 0.22, 0.01); col.push(1, 0.85, 0.25);
        for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI * 2, rr = i % 2 ? 0.035 : 0.06; pos.push(Math.cos(a) * rr, 0.22 + Math.sin(a) * rr, 0); col.push(1, 1, 1); }
        for (let i = 0; i < 10; i++) idx.push(c0, c0 + 1 + i, c0 + 2 + i);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
        geo.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(pos.length / 3).fill(0).flatMap(() => [0, 1, 0]), 3));
        geo.setIndex(idx);
        const mat = r3Patch(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), { key: 'envflower', inst: true });
        const m = new THREE.InstancedMesh(geo, mat, flowers.length), M = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color();
        const pal = [[1, 1, 1], [1, 0.86, 0.3], [1, 0.55, 0.75], [0.74, 0.58, 1]];
        // (they face the camera, tipped back a little)
        q.setFromEuler(new THREE.Euler(-0.35, 0, 0));
        flowers.forEach(([x, y, k], i) => {
            p.set(x, EnvGround.heightAt(x, y), y * R3_ZS);
            const sc = 0.8 + r() * 0.6; s.set(sc, sc * (0.8 + r() * 0.5), sc);
            M.compose(p, q, s); m.setMatrixAt(i, M);
            c.setRGB(...pal[k]); m.setColorAt(i, c);
        });
        m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
        m.receiveShadow = true; m.frustumCulled = false;
        group.add(m);
        return m;
    },
};
