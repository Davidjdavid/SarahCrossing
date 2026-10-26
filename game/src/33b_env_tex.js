/* ---- 33b_env_tex.js ---- */
/* The new 3D look's surfaces (33a_env.js), made here from numbers: rounded cobblestones with mossy gaps, a dry-stone wall,
   grass, a dirt path with pebbles, rippled sand, bark, clay roof tiles, slate shingles, plaster, painted boards. Each is a
   height picture first (what sticks out), and from it a color picture and a normal picture, so the sun picks out every
   stone and gap. They repeat seamlessly; the colors are the concept art's (warm grays, deep greens, terracotta). */
const EnvTex = {
    cache: {},
    /* a seeded random and value noise that wraps round a square of n pixels */
    rand(seed) { return mulberry(seed); },
    noise(n, cells, seed) {
        const g = new Float32Array(cells * cells), r = mulberry(seed);
        for (let i = 0; i < g.length; i++) g[i] = r();
        return (x, y) => {
            const fx = x / n * cells, fy = y / n * cells, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
            const u = tx * tx * (3 - 2 * tx), v = ty * ty * (3 - 2 * ty), at = (i, j) => g[(((j % cells) + cells) % cells) * cells + (((i % cells) + cells) % cells)];
            return (at(ix, iy) * (1 - u) + at(ix + 1, iy) * u) * (1 - v) + (at(ix, iy + 1) * (1 - u) + at(ix + 1, iy + 1) * u) * v;
        };
    },
    /* stones round jittered points (Voronoi): for each pixel, the nearest stone, its own random number, and how far the
       pixel is from that stone's edge (in pixels); sx, sy squash the cells (wall courses are wider than tall) */
    stones(n, cols, rows, seed, jit, sx, sy) {
        const r = mulberry(seed), pts = [];
        for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) pts.push([(i + 0.5 + (j % 2) * 0.5 * (jit.row || 0) + (r() - 0.5) * jit.x) * n / cols, (j + 0.5 + (r() - 0.5) * jit.y) * n / rows, r(), r()]);
        const id = new Int32Array(n * n), edge = new Float32Array(n * n), cx = new Float32Array(n * n), cy = new Float32Array(n * n);
        const cw = n / cols, ch = n / rows;
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
            const gx = Math.floor(x / cw), gy = Math.floor(y / ch);
            let b1 = 1e9, b2 = 1e9, p1 = null, p2 = null, k1 = 0;
            for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
                const ii = gx + dx, jj = gy + dy, k = (((jj % rows) + rows) % rows) * cols + (((ii % cols) + cols) % cols), p = pts[k];
                const px = p[0] + Math.floor(ii / cols) * n, py = p[1] + Math.floor(jj / rows) * n;
                const d = ((x + 0.5 - px) * sx) ** 2 + ((y + 0.5 - py) * sy) ** 2;
                if (d < b1) { b2 = b1; p2 = p1; b1 = d; p1 = [px, py]; k1 = k; } else if (d < b2) { b2 = d; p2 = [px, py]; }
            }
            const i = y * n + x, ddx = (p2[0] - p1[0]) * sx, ddy = (p2[1] - p1[1]) * sy, sep = Math.hypot(ddx, ddy) || 1;
            id[i] = k1; edge[i] = (b2 - b1) / (2 * sep); cx[i] = x + 0.5 - p1[0]; cy[i] = y + 0.5 - p1[1];
        }
        return { id, edge, cx, cy, pts };
    },
    /* normals from a height picture (k: how strongly it stands out), wrapping round */
    normals(n, h, k) {
        const d = new Uint8Array(n * n * 4);
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
            const at = (xx, yy) => h[(((yy % n) + n) % n) * n + (((xx % n) + n) % n)];
            const dx = (at(x + 1, y) - at(x - 1, y)) * k, dy = (at(x, y + 1) - at(x, y - 1)) * k, l = Math.hypot(dx, dy, 1), i = (y * n + x) * 4;
            d[i] = Math.round((-dx / l * 0.5 + 0.5) * 255); d[i + 1] = Math.round((dy / l * 0.5 + 0.5) * 255); d[i + 2] = Math.round((1 / l * 0.5 + 0.5) * 255); d[i + 3] = 255;
        }
        return d;
    },
    tex(n, data, opt) {
        opt = opt || {};
        const t = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.magFilter = opt.near ? THREE.NearestFilter : THREE.LinearFilter;
        t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 8; t.needsUpdate = true;
        return t;
    },
    mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; },
    hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; },
    /* a finished surface: { map, normal } from an albedo function and a height picture */
    make(name, n, fill, nk) {
        if (this.cache[name]) return this.cache[name];
        const h = new Float32Array(n * n), col = new Uint8Array(n * n * 4);
        fill(h, col);
        const out = { map: this.tex(n, col, { near: true }), normal: this.tex(n, this.normals(n, h, nk)), n };
        this.cache[name] = out;
        return out;
    },
    put(col, i, c) { col[i * 4] = Math.max(0, Math.min(255, c[0])); col[i * 4 + 1] = Math.max(0, Math.min(255, c[1])); col[i * 4 + 2] = Math.max(0, Math.min(255, c[2])); col[i * 4 + 3] = 255; },

    /* ---------------------------------------------------------------- the surfaces */
    /* cobblestones: rounded stones, each its own warm or cool gray, lit tops and a dark rim, moss and a blade or two of
       grass in the gaps (repeats every 4 tiles) */
    cobble() {
        return this.make('cobble', 512, (h, col) => {
            // flat stones of every shape (a jittered grid: big and small, four- to seven-sided), light cool and warm grays,
            // worn smooth with only their edges rounded; thin gaps of soil with moss and grass coming through
            const n = 512, S = this.stones(n, 19, 19, 7, { x: 0.95, y: 0.95, row: 0 }, 1, 1), nz = this.noise(n, 48, 3), moss = this.noise(n, 20, 4), wob = this.noise(n, 64, 6), big = this.noise(n, 6, 8), r = mulberry(5);
            const tones = ['#c4c0b6', '#b0aea8', '#cdc6b6', '#a3a7a6', '#bbb3a2', '#9a9993', '#c6beae', '#adb2b0', '#b7ae9c', '#8f918e'].map(c => this.hex(c));
            for (let i = 0; i < n * n; i++) {
                const x = i % n, y = (i / n) | 0, e = S.edge[i], st = S.pts[S.id[i]], gap = 1.4 + wob(x, y) * 1.8;
                if (e < gap) {
                    const m = moss(x, y), g = m > 0.56 ? this.mix(this.hex('#40602c'), this.hex('#5e8840'), Math.min(1, (m - 0.56) * 2.6)) : this.mix(this.hex('#4a463b'), this.hex('#575a40'), m * 1.8);
                    h[i] = 0.04 * m;
                    this.put(col, i, g.map(v => v * (0.92 + (r() - 0.5) * 0.12))); continue;
                }
                // flat on top, rounded within a few pixels of the edge
                const t = Math.min(1, (e - gap) / 8), round = Math.sqrt(t * (2 - t));
                h[i] = 0.25 + round * 0.55 + st[2] * 0.12 + (nz(x, y) - 0.5) * 0.06;
                const base = this.mix(tones[Math.floor(st[3] * tones.length)], this.hex('#c9c3b4'), (big(x, y) - 0.5) * 0.6);
                const d = Math.hypot(S.cx[i], S.cy[i]) || 1, lit = -(S.cx[i] * 0.55 + S.cy[i] * 0.83) / d;
                let k = 0.84 + round * 0.12 + lit * 0.18 * (1 - round) + (nz(x, y) - 0.5) * 0.09 + (r() - 0.5) * 0.035;
                // a stain of lichen or wear here and there
                const l = moss((x * 3) % n, (y * 3) % n);
                const c = l > 0.72 ? this.mix(base, this.hex('#a8ad84'), (l - 0.72) * 2) : base;
                this.put(col, i, c.map(v => v * k));
            }
        }, 3);
    },
    /* the dry-stone wall: courses of rounded stones of every size, warm grays with lichen, deep gaps; mossy along the top
       (repeats every 4 units across, 4 up) */
    wall() {
        return this.make('wall', 256, (h, col) => {
            const n = 256, S = this.stones(n, 6, 10, 17, { x: 0.7, y: 0.25, row: 1 }, 0.62, 1.25), nz = this.noise(n, 24, 13), lich = this.noise(n, 12, 14), r = mulberry(15);
            const tones = ['#8f8678', '#a39a8a', '#7c756c', '#b0a796', '#958a7a', '#857d72', '#a8a08f'].map(c => this.hex(c));
            for (let i = 0; i < n * n; i++) {
                const x = i % n, y = (i / n) | 0, e = S.edge[i], st = S.pts[S.id[i]];
                if (e < 2.2) { h[i] = 0; this.put(col, i, this.mix(this.hex('#25221f'), this.hex('#3a352f'), nz(x, y))); continue; }
                const dome = Math.min(1, e / 10);
                h[i] = Math.sqrt(dome) * (0.75 + st[2] * 0.25) + (nz(x, y) - 0.5) * 0.08;
                let c = tones[Math.floor(st[3] * tones.length)];
                const l = lich(x, y);
                if (l > 0.66) c = this.mix(c, this.hex('#9aa36a'), (l - 0.66) * 2.2);
                const dl = Math.hypot(S.cx[i], S.cy[i]) || 1, lit = (-S.cx[i] * 0.4 - S.cy[i]) / dl;
                let k = 0.8 + dome * 0.2 + lit * 0.12 * (1 - dome * 0.4) + (nz(x, y) - 0.5) * 0.14 + (r() - 0.5) * 0.05;
                if (e < 4) k -= (4 - e) * 0.06;
                this.put(col, i, c.map(v => v * k));
            }
        }, 6);
    },
    /* the lawn as Animal Crossing drew it on the GameCube: a deep green ground scattered with little diamond-shaped leaves
       in lighter and darker greens, each a touch lit on its upper side (repeats every 4 tiles, about five leaves a tile).
       Its colors go with the season, as the trees' do: fresh yellow-greens in spring, deep greens in summer, gold and olive
       in fall with fallen leaves among the grass (orange, red, brown), and dull greens under winter's snow */
    LAWN: {
        spring: { base: '#5aa83c', deep: '#489438', tones: ['#bce274', '#a2d664', '#88c654', '#70b448', '#56983e'] },
        summer: { base: '#3a8436', deep: '#2c6c2e', tones: ['#80c457', '#6cb44c', '#5aa444', '#4c963e', '#336f30'] },
        fall: { base: '#6a8a34', deep: '#56722e', tones: ['#c2b450', '#a8a446', '#8e983e', '#76883a', '#5c7232'], fallen: ['#d8782e', '#c4532a', '#e2a53c', '#9c5c2a'] },
        winter: { base: '#56704a', deep: '#465e3e', tones: ['#8aa070', '#7a9264', '#6c865a', '#5e7a52', '#4c6646'] },
    },
    lawn(season) {
        const P = this.LAWN[season] || this.LAWN.summer;
        return this.make('lawn_' + (this.LAWN[season] ? season : 'summer'), 512, (h, col) => {
            const n = 512, cell = 22, cols = Math.round(n / cell), C = n / cols, r = mulberry(61), nz = this.noise(n, 16, 62), fine = this.noise(n, 96, 63);
            const base = this.hex(P.base), deep = this.hex(P.deep);
            const tones = P.tones.map(c => this.hex(c)), fallen = (P.fallen || []).map(c => this.hex(c));
            // the leaves: one in most cells of a jittered grid, each its own size, turn and green (in fall, one in ten fallen)
            const leaves = [];
            for (let j = 0; j < cols; j++) for (let i = 0; i < cols; i++) {
                if (r() < 0.12) continue;
                const t = r(), tone = t < 0.3 ? 0 : t < 0.55 ? 1 : t < 0.75 ? 2 : t < 0.9 ? 3 : 4, f = r(), down = fallen.length && f < 0.1;
                leaves.push({ x: (i + 0.5 + (r() - 0.5) * 0.8) * C, y: (j + 0.5 + (r() - 0.5) * 0.8) * C, s: C * (0.26 + r() * 0.16) * (down ? 0.85 : 1), a: Math.PI / 4 + (r() - 0.5) * (down ? 2.4 : 0.5),
                    c: down ? fallen[Math.floor(f * 40) % fallen.length] : tones[tone], k: 0.92 + r() * 0.16 });
            }
            const grid = new Map();
            for (const L of leaves) { const k = Math.floor(L.x / C) + ',' + Math.floor(L.y / C); (grid.get(k) || grid.set(k, []).get(k)).push(L); }
            for (let i = 0; i < n * n; i++) {
                const x = i % n, y = (i / n) | 0, gx = Math.floor(x / C), gy = Math.floor(y / C);
                // the ground between: deep green, a little darker in soft patches
                let c = this.mix(base, deep, Math.max(0, nz(x, y) - 0.45) * 1.4), ht = 0;
                for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                    const list = grid.get((((gx + dx) % cols) + cols) % cols + ',' + (((gy + dy) % cols) + cols) % cols);
                    if (!list) continue;
                    for (const L of list) {
                        // (wrapping round the picture's edges)
                        let ox = x + 0.5 - L.x, oy = y + 0.5 - L.y;
                        ox -= Math.round(ox / n) * n; oy -= Math.round(oy / n) * n;
                        const u = ox * Math.cos(L.a) + oy * Math.sin(L.a), v = -ox * Math.sin(L.a) + oy * Math.cos(L.a), m = Math.max(Math.abs(u), Math.abs(v));
                        if (m > L.s) continue;
                        const edge = Math.min(1, (L.s - m) / 2.2), lit = -(ox + oy) / (L.s * 2.4);
                        ht = Math.max(ht, 0.3 + edge * 0.4);
                        c = this.mix(c, L.c.map(q => q * L.k * (1 + lit * 0.1)), edge);
                    }
                }
                h[i] = ht;
                this.put(col, i, c.map(q => q * (0.96 + (fine(x, y) - 0.5) * 0.08)));
            }
        }, 2);
    },
    /* grass under the grass: deep greens in soft clumps, little blades and clover; tinted by the season in the shader */
    grass() {
        return this.make('grass', 256, (h, col) => {
            const n = 256, a = this.noise(n, 8, 21), b = this.noise(n, 32, 22), r = mulberry(23);
            const dark = this.hex('#4b8632'), mid = this.hex('#6ca840'), light = this.hex('#94c656');
            for (let i = 0; i < n * n; i++) {
                const x = i % n, y = (i / n) | 0, t = a(x, y) * 0.6 + b(x, y) * 0.4;
                h[i] = t * 0.3;
                this.put(col, i, t < 0.5 ? this.mix(dark, mid, t * 2) : this.mix(mid, light, (t - 0.5) * 2));
            }
            for (let k = 0; k < n * n / 7; k++) {
                const x = Math.floor(r() * n), y = Math.floor(r() * n), len = 2 + Math.floor(r() * 4), lt = r() < 0.7;
                for (let j = 0; j < len; j++) {
                    const i = ((y - j + n) % n) * n + x;
                    h[i] += 0.12;
                    this.put(col, i, lt ? this.mix(mid, this.hex('#b8dc6e'), j / len) : this.mix(dark, mid, j / len * 0.6));
                }
                const i0 = ((y + 1) % n) * n + x;
                this.put(col, i0, dark.map(v => v * 0.8)); h[i0] -= 0.05;
            }
        }, 2.5);
    },
    /* the dirt path: packed earth, ruts, pebbles lit on top */
    dirt() {
        return this.make('dirt', 256, (h, col) => {
            const n = 256, a = this.noise(n, 12, 31), b = this.noise(n, 48, 32), r = mulberry(33);
            const dk = this.hex('#6a4a30'), md = this.hex('#8c6744'), lt = this.hex('#a8845c');
            for (let i = 0; i < n * n; i++) {
                const x = i % n, y = (i / n) | 0, t = a(x, y) * 0.55 + b(x, y) * 0.45 + (r() - 0.5) * 0.08;
                h[i] = t * 0.35;
                this.put(col, i, t < 0.5 ? this.mix(dk, md, t * 2) : this.mix(md, lt, (t - 0.5) * 2));
            }
            for (let k = 0; k < 150; k++) {
                const x0 = Math.floor(r() * n), y0 = Math.floor(r() * n), w = 2 + Math.floor(r() * 3), hh = 2 + Math.floor(r() * 2), tone = 0.8 + r() * 0.25;
                for (let j = 0; j < hh; j++) for (let i = 0; i < w; i++) {
                    if ((i === 0 || i === w - 1) && (j === 0 || j === hh - 1) && w > 2 && hh > 2) continue;
                    const p = ((y0 + j) % n) * n + ((x0 + i) % n), top = j === 0 || i === 0, bot = j === hh - 1 || i === w - 1;
                    h[p] = 0.7 + (top ? 0.1 : 0);
                    this.put(col, p, this.hex(top ? '#cdb592' : bot ? '#7d6a55' : '#ad9878').map(v => v * tone));
                }
            }
        }, 4);
    },
    /* sand: fine warm grain over wind ripples, a few bright specks */
    sand() {
        return this.make('sand', 256, (h, col) => {
            const n = 256, a = this.noise(n, 16, 41), w = this.noise(n, 8, 42), r = mulberry(43);
            for (let i = 0; i < n * n; i++) {
                const x = i % n, y = (i / n) | 0, rip = Math.sin((y + w(x, y) * 40) / n * Math.PI * 2 * 14) * 0.5 + 0.5, g = (r() - 0.5) * 0.12;
                h[i] = rip * 0.4 + a(x, y) * 0.3;
                const t = 0.5 + (a(x, y) - 0.5) * 0.35 + (rip - 0.5) * 0.12 + g;
                this.put(col, i, this.mix(this.hex('#d4b47c'), this.hex('#f1dcab'), t));
            }
            for (let k = 0; k < 900; k++) { const i = Math.floor(r() * n * n); this.put(col, i, this.hex(r() < 0.6 ? '#fff4d8' : '#b39466')); }
        }, 2);
    },
    /* bark: fibers running up the trunk, darker cracks */
    bark() {
        return this.make('bark', 128, (h, col) => {
            const n = 128, a = this.noise(n, 6, 51), r = mulberry(52), lines = new Float32Array(n);
            for (let x = 0; x < n; x++) lines[x] = r();
            for (let i = 0; i < n * n; i++) {
                const x = i % n, y = (i / n) | 0, f = lines[(x + Math.floor(a(x, y) * 6)) % n], crack = f < 0.18;
                h[i] = crack ? 0 : 0.5 + f * 0.5;
                this.put(col, i, this.mix(this.hex(crack ? '#3a2416' : '#6b4527'), this.hex('#9a6a40'), crack ? 0.1 : f * 0.8 + a(x, y) * 0.2));
            }
        }, 5);
    },
    /* clay roof tiles: rows of rounded tiles overlapping, each a slightly different red (2 tiles across, 2 rows a unit) */
    roofTiles() {
        return this.make('rooftiles', 128, (h, col) => {
            const n = 128, r = mulberry(61), nz = this.noise(n, 16, 62), cols = 8, rows = 8, tone = [];
            for (let i = 0; i < cols * rows; i++) tone.push(0.88 + r() * 0.24);
            for (let i = 0; i < n * n; i++) {
                const x = i % n, y = (i / n) | 0, row = Math.floor(y / (n / rows)), fy = (y % (n / rows)) / (n / rows), off = (row % 2) * 0.5;
                const fx = ((x / (n / cols) + off) % 1), c = Math.floor(x / (n / cols) + off) % cols, curve = Math.sin(fx * Math.PI);
                h[i] = curve * 0.8 + (1 - fy) * 0.2;
                const t = tone[row * cols + c], shade = 0.62 + curve * 0.38 - (fy > 0.86 ? 0.25 : 0) + (nz(x, y) - 0.5) * 0.08;
                this.put(col, i, this.hex('#c8504a').map(v => v * t * shade));
            }
        }, 4);
    },
    /* slate shingles: offset rows of rectangles, blue-grays (2 a unit across, 3 rows a unit) */
    slate() {
        return this.make('slate', 128, (h, col) => {
            const n = 128, r = mulberry(71), nz = this.noise(n, 16, 72), cols = 6, rows = 9, tone = [];
            for (let i = 0; i < cols * rows; i++) tone.push(0.85 + r() * 0.3);
            for (let i = 0; i < n * n; i++) {
                const x = i % n, y = (i / n) | 0, row = Math.floor(y / (n / rows)), fy = (y % (n / rows)) / (n / rows), off = (row % 2) * 0.5;
                const fx = ((x / (n / cols) + off) % 1), c = Math.floor(x / (n / cols) + off) % cols, gap = fx < 0.06 || fy > 0.88;
                h[i] = gap ? 0 : 0.5 + (1 - fy) * 0.5;
                const t = tone[row * cols + c] * (gap ? 0.55 : 1) * (0.86 + (1 - fy) * 0.18) + (nz(x, y) - 0.5) * 0.06;
                this.put(col, i, this.hex('#5d6f8e').map(v => v * t));
            }
        }, 4);
    },
    /* plaster: soft, a little uneven */
    plaster() {
        return this.make('plaster', 128, (h, col) => {
            const n = 128, a = this.noise(n, 16, 81), r = mulberry(82);
            for (let i = 0; i < n * n; i++) { const x = i % n, y = (i / n) | 0, t = a(x, y); h[i] = t * 0.3; const k = 0.94 + t * 0.08 + (r() - 0.5) * 0.04; this.put(col, i, [255 * k, 255 * k, 255 * k]); }
        }, 1.5);
    },
    /* painted boards: horizontal planks with grooves (white, tinted by the material's color) */
    boards() {
        return this.make('boards', 128, (h, col) => {
            const n = 128, a = this.noise(n, 24, 91), r = mulberry(92), rows = 8;
            for (let i = 0; i < n * n; i++) {
                const x = i % n, y = (i / n) | 0, fy = (y % (n / rows)) / (n / rows), groove = fy > 0.86;
                h[i] = groove ? 0 : 0.6 + fy * 0.3;
                const k = (groove ? 0.6 : 0.9 + fy * 0.1) + (a(x, y) - 0.5) * 0.06 + (r() - 0.5) * 0.03;
                this.put(col, i, [255 * k, 255 * k, 255 * k]);
            }
        }, 3);
    },
    /* wood: grain along the planks, for benches, doors, fences' posts */
    wood() {
        return this.make('wood', 128, (h, col) => {
            const n = 128, a = this.noise(n, 8, 101), r = mulberry(102);
            for (let i = 0; i < n * n; i++) {
                const x = i % n, y = (i / n) | 0, g = Math.sin((y + a(x, y) * 18) * 0.9) * 0.5 + 0.5;
                h[i] = g * 0.3;
                this.put(col, i, this.mix(this.hex('#7a4f2c'), this.hex('#a8743f'), g * 0.7 + (r() - 0.5) * 0.1));
            }
        }, 2);
    },
};
