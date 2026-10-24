/* ---- 31a_ground3d.js ---- */
/* The island's ground up close, in HD-2D: the painted island picture has one pixel to a world pixel, which is a smear
   of a few big squares a tile when the camera is near. So each piece of ground also gets a map of what it is (grass,
   dirt, cobbles, sand, rock, stairs; or "keep the picture" for water, fields, bridges and anything drawn on the ground),
   and the shader draws each kind from its own fine pixel art, three texels to a world pixel like the HD sprites: grass
   with blades and flowers in patches, dirt with pebbles and a darker rim where grass reaches over it, rounded cobbles,
   rippled sand. Anything steep (the cliffs, the rock rim where high ground meets the sea) is a wall of stacked stones
   mapped on its face, and stairs have steps. The art is made here once, from numbers; colors come from a small palette
   picture per season (each kind a row of 16 tones, darkest first). */
const R3_DET_N = 512, R3_DET_K = 48 / R3_DET_N;           // texture pixels, and the share of one a tile takes
const R3_MAT = { keep: 0, grass: 1, dirt: 2, cobble: 3, sand: 4, rock: 5, stairs: 6 };
let R3_DET = null, R3_CLS = null;

/* the fine art: A = grass, dirt, cobbles, sand (one in each channel); B = stone wall, flowers */
function r3Detail() {
    if (R3_DET) return R3_DET;
    const N = R3_DET_N, A = new Float32Array(N * N * 4).fill(0.5), B = new Float32Array(N * N * 4), r = mulberry(91573);
    const I = (x, y) => (((y % N) + N) % N) * N + (((x % N) + N) % N);
    // value noise that wraps around (p cells across)
    const vn = (p, seed) => {
        const g = new Float32Array(p * p), rr = mulberry(seed);
        for (let i = 0; i < g.length; i++) g[i] = rr();
        return (x, y) => {
            const fx = x / N * p, fy = y / N * p, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
            const u = tx * tx * (3 - 2 * tx), v = ty * ty * (3 - 2 * ty), at = (i, j) => g[(((j % p) + p) % p) * p + (((i % p) + p) % p)];
            return (at(ix, iy) * (1 - u) + at(ix + 1, iy) * u) * (1 - v) + (at(ix, iy + 1) * (1 - u) + at(ix + 1, iy + 1) * u) * v;
        };
    };
    const set = (arr, ch, x, y, v) => { arr[I(x, y) * 4 + ch] = v; };
    // grass: soft clumps, then thousands of little blades (a light tip, a darker stem, a shadow at the root)
    const g1 = vn(8, 11), g2 = vn(32, 12);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) A[I(x, y) * 4] = 0.5 + (g1(x, y) - 0.5) * 0.22 + (g2(x, y) - 0.5) * 0.16;
    for (let n = 0; n < N * N / 11; n++) {
        const x = Math.floor(r() * N), y = Math.floor(r() * N), len = 2 + Math.floor(r() * 3), dark = r() < 0.3;
        set(A, 0, x, y + 1, 0.2);
        for (let j = 0; j < len; j++) set(A, 0, x, y - j, dark ? 0.32 : j === len - 1 ? 0.9 : 0.7);
        if (!dark && r() < 0.4) set(A, 0, x + (r() < 0.5 ? -1 : 1), y - len + 1, 0.78);
    }
    // dirt: earthy patches and grain, pebbles lit from the top left
    const d1 = vn(16, 21), d2 = vn(64, 22);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) A[I(x, y) * 4 + 1] = 0.5 + (d1(x, y) - 0.5) * 0.24 + (d2(x, y) - 0.5) * 0.14 + (r() - 0.5) * 0.1;
    const pebble = (arr, ch, x, y, w, h, base) => {
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
            if ((i === 0 || i === w - 1) && (j === 0 || j === h - 1) && w > 2 && h > 2) continue;
            set(arr, ch, x + i, y + j, i + j === 0 || (j === 0 && i < w - 1) ? base + 0.25 : i === w - 1 || j === h - 1 ? base - 0.3 : base);
        }
        set(arr, ch, x + 1, y + h, 0.12);
    };
    for (let n = 0; n < 2400; n++) pebble(A, 1, Math.floor(r() * N), Math.floor(r() * N), 2 + Math.floor(r() * 3), 2 + Math.floor(r() * 2), 0.62 + r() * 0.1);
    // cobbles: stones round a jittered grid (Voronoi), dark mossy gaps, each stone its own shade with a lit top-left rim
    {
        const C = 24, cs = N / C, pts = [];
        for (let gy = 0; gy < C; gy++) for (let gx = 0; gx < C; gx++) pts.push([(gx + 0.5 + (gy % 2) * 0.5 + (r() - 0.5) * 0.55) * cs, (gy + 0.5 + (r() - 0.5) * 0.5) * cs, r()]);
        const moss = vn(32, 31);
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
            const gx = Math.floor(x / cs), gy = Math.floor(y / cs);
            let b1 = 1e9, b2 = 1e9, p1 = null, p2 = null;
            for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
                const cx = gx + dx, cy = gy + dy, p = pts[(((cy % C) + C) % C) * C + (((cx % C) + C) % C)];
                const px = p[0] + Math.floor(cx / C) * N, py = p[1] + Math.floor(cy / C) * N, dd = (x + 0.5 - px) ** 2 + (y + 0.5 - py) ** 2;
                if (dd < b1) { b2 = b1; p2 = p1; b1 = dd; p1 = [px, py, p[2]]; } else if (dd < b2) { b2 = dd; p2 = [px, py, p[2]]; }
            }
            const sep = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), edge = (b2 - b1) / (2 * sep);
            let v;
            if (edge < 1.6) v = 0.04 + moss(x, y) * 0.16;
            else {
                const dx = x + 0.5 - p1[0], dy = y + 0.5 - p1[1], dl = Math.hypot(dx, dy) || 1, lit = -(dx + dy) / dl / Math.SQRT2;
                v = 0.5 + (p1[2] - 0.5) * 0.2;
                if (edge < 3.6) v += lit * 0.2 - 0.03;
                else v += lit * 0.05 * Math.min(1, dl / cs);
                v += (r() - 0.5) * 0.05;
            }
            A[I(x, y) * 4 + 2] = v;
        }
    }
    // sand: fine grain over soft wind ripples, a few bright and dark specks
    const s1 = vn(16, 41), s2 = vn(8, 42);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const rip = Math.sin((y + s2(x, y) * 60) / N * Math.PI * 2 * 24) * 0.045;
        A[I(x, y) * 4 + 3] = 0.52 + (s1(x, y) - 0.5) * 0.12 + rip + (r() - 0.5) * 0.09;
    }
    for (let n = 0; n < 1800; n++) set(A, 3, Math.floor(r() * N), Math.floor(r() * N), r() < 0.6 ? 0.86 : 0.3);
    // the stone wall: rows of rounded stones of every width, lit on top, shaded underneath, dark gaps
    {
        const RH = 16, wn = vn(16, 51);
        for (let row = 0; row < N / RH; row++) {
            let x = Math.floor(r() * 30);
            const start = x;
            while (x < start + N) {
                const w = 14 + Math.floor(r() * 22), y0 = row * RH, tone = 0.46 + (r() - 0.5) * 0.22;
                const t0 = Math.floor(r() * 2), b0 = Math.floor(r() * 2);
                for (let j = 0; j < RH; j++) for (let i = 0; i < w; i++) {
                    const top = j <= t0, bot = j >= RH - 1 - b0, side = i === 0 || i === w - 1;
                    if (top || bot || side) { set(B, 0, x + i, y0 + j, 0.05); continue; }
                    if ((j === t0 + 1 || j === RH - 2 - b0) && (i === 1 || i === w - 2)) { set(B, 0, x + i, y0 + j, 0.05); continue; }
                    let v = tone + (wn(x + i, y0 + j) - 0.5) * 0.12 + (r() - 0.5) * 0.05;
                    if (j <= t0 + 2) v += 0.22; else if (j >= RH - 3 - b0) v -= 0.16;
                    if (i === 1) v += 0.08; else if (i === w - 2) v -= 0.08;
                    set(B, 0, x + i, y0 + j, v);
                }
                x += w;
            }
        }
    }
    // flowers: little clumps of five-petal flowers; the value picks the color (palette row 5)
    {
        const kinds = [0.3, 0.5, 0.7, 0.9, 0.62];
        for (let n = 0; n < 520; n++) {
            const cx = Math.floor(r() * N), cy = Math.floor(r() * N), kind = kinds[Math.floor(r() * kinds.length)], m = 2 + Math.floor(r() * 4);
            for (let k = 0; k < m; k++) {
                const x = cx + Math.floor((r() - 0.5) * 16), y = cy + Math.floor((r() - 0.5) * 12);
                for (const [dx, dy] of [[0, -2], [-2, 0], [2, 0], [-1, 2], [1, 2], [0, -1], [-1, 0], [1, 0], [0, 1], [-1, 1], [1, 1], [-1, -1], [1, -1]]) set(B, 1, x + dx, y + dy, kind);
                set(B, 1, x, y, 0.98); set(B, 1, x, y + 3, 0.15);
            }
        }
    }
    const tex = (src) => {
        const d = new Uint8Array(N * N * 4);
        for (let i = 0; i < d.length; i++) d[i] = Math.max(0, Math.min(255, Math.round(src[i] * 255)));
        const t = new THREE.DataTexture(d, N, N, THREE.RGBAFormat);
        t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
        t.generateMipmaps = true; t.anisotropy = 4; t.needsUpdate = true;
        return t;
    };
    for (let i = 3; i < B.length; i += 4) B[i] = 1;
    R3_DET = { a: tex(A), b: tex(B), pal: null, palOf: null };
    return R3_DET;
}

/* the palette picture: 16 tones a row; rows grass, dirt, cobbles, sand, stone wall, flowers */
const R3_PALS = {
    grass: { spring: [[0, '#2f5a2a'], [0.25, '#4a8a36'], [0.5, '#6db248'], [0.72, '#8acb5a'], [0.88, '#acdc74'], [1, '#d4ee98']],
        summer: [[0, '#2c5528'], [0.25, '#457f33'], [0.5, '#64a843'], [0.72, '#80c053'], [0.88, '#a4d46c'], [1, '#cce690']],
        fall: [[0, '#3a5a26'], [0.25, '#55843a'], [0.5, '#76a948'], [0.72, '#92bf58'], [0.88, '#b4d070'], [1, '#d8e294']],
        winter: [[0, '#8297b0'], [0.25, '#b4c4d6'], [0.5, '#dae4ee'], [0.72, '#e8eff6'], [0.88, '#f4f8fc'], [1, '#ffffff']] },
    dirt: [[0, '#5a3c26'], [0.18, '#7d5a3a'], [0.4, '#a07a50'], [0.6, '#b89060'], [0.8, '#ceaa78'], [1, '#e8d2a8']],
    cobble: [[0, '#3c4a36'], [0.18, '#5c6a50'], [0.24, '#7c7a72'], [0.4, '#99958c'], [0.58, '#b2aea4'], [0.78, '#ccc8bd'], [1, '#ebe7dc']],
    sand: [[0, '#a8875a'], [0.3, '#cfb07a'], [0.52, '#e2c98f'], [0.75, '#eed9a6'], [1, '#fbf0d0']],
    rock: [[0, '#2e2925'], [0.12, '#4a433c'], [0.3, '#6b6359'], [0.5, '#8a8276'], [0.7, '#a69d8f'], [1, '#d0c8b8']],
    flower: [[0, '#4a8a36'], [0.2, '#4a8a36'], [0.3, '#f6f3ea'], [0.42, '#f6f3ea'], [0.5, '#f49ab9'], [0.58, '#f49ab9'], [0.62, '#e8574b'], [0.68, '#e8574b'],
        [0.7, '#ffd54a'], [0.82, '#ffd54a'], [0.9, '#b58ae2'], [0.96, '#b58ae2'], [1, '#ffcf3a']],
};
function r3Palette(season) {
    const D = r3Detail();
    if (D.palOf === season) return D.pal;
    const W = 16, H = 8, d = new Uint8Array(W * H * 4);
    const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    // flower colors are picked, not blended; the rest are smooth ramps
    const ramp = (keys, row, pick) => {
        for (let i = 0; i < W; i++) {
            const t = (i + 0.5) / W;
            let j = 0; while (j < keys.length - 2 && keys[j + 1][0] < t) j++;
            const [ta, ca] = keys[j], [tb, cb] = keys[j + 1], a = hex(ca), b = hex(cb), u = pick ? (t - ta < tb - t ? 0 : 1) : Math.max(0, Math.min(1, (t - ta) / (tb - ta)));
            for (let q = 0; q < 3; q++) d[(row * W + i) * 4 + q] = Math.round(a[q] + (b[q] - a[q]) * u);
            d[(row * W + i) * 4 + 3] = 255;
        }
    };
    const P = R3_PALS, win = season === 'winter';
    ramp(P.grass[season] || P.grass.summer, 0);
    ramp(win ? [[0, '#6b5a4c'], [0.4, '#a69888'], [0.7, '#d8d4d0'], [1, '#f4f6f8']] : P.dirt, 1);
    ramp(P.cobble, 2);
    ramp(P.sand, 3);
    ramp(P.rock, 4);
    ramp(win ? [[0, '#dae4ee'], [1, '#ffffff']] : P.flower, 5, !win);
    if (!D.pal) { D.pal = new THREE.DataTexture(d, W, H, THREE.RGBAFormat); D.pal.magFilter = D.pal.minFilter = THREE.NearestFilter; D.pal.generateMipmaps = false; }
    else D.pal.image.data.set(d);
    D.pal.needsUpdate = true;
    D.palOf = season;
    return D.pal;
}

/* what kind of ground each tile is (stairs by the island's list of them) */
function r3TileClass() {
    if (R3_CLS && R3_CLS.src === W0.grid) return R3_CLS.c;
    const Wt = W0.w, Ht = W0.h, c = new Uint8Array(Wt * Ht), M = R3_MAT;
    const ramp = new Set((W0.ramps || []).map(([x, y]) => y * Wt + x));
    for (let y = 0; y < Ht; y++) for (let x = 0; x < Wt; x++) {
        const g = W0.grid[y][x], k = y * Wt + x;
        c[k] = ramp.has(k) ? M.stairs : g === 'g' ? M.grass : g === 'p' || g === 'd' ? M.dirt : g === 'c' ? M.cobble : g === 's' ? M.sand : g === 'm' ? M.rock : M.keep;
    }
    R3_CLS = { src: W0.grid, c, ramp };
    return c;
}
/* a tile's kind with Sarah's own paths on it (16 + the kind: decided by the tile even where the path is drawn over the
   ground; brick and planks keep their picture) */
function r3ClassAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= W0.w || ty >= W0.h) return R3_MAT.keep;
    const P = S && S.paths && S.paths.t, o = P && P[tx + ',' + ty];
    if (o) return o === 'grass' ? 16 + R3_MAT.grass : o === 'dirt' ? 16 + R3_MAT.dirt : o === 'stone' ? 16 + R3_MAT.cobble : R3_MAT.keep;
    return r3TileClass()[ty * W0.w + tx];
}
/* the kind of ground at a world pixel (K: the kinds of the tiles round a piece): each tile's kind is spread over its
   neighbors with a smooth weight (a quadratic B-spline) and the strongest wins, paths and the like a little favored so a
   thin one never breaks into beads. That rounds the tile steps into curves and diagonals. Water, fields, bridges, stairs
   and brick or plank paths keep their tiles' own shape, except at the water's edge, where the picture decides (blue is
   water, anything else is the land round it). cr, cg, cb: the picture's color there. */
function r3KindAt(K, wx, wy, cr, cg, cb) {
    const fx = wx / TILE - 0.5, fy = wy / TILE - 0.5, ix = Math.round(fx), iy = Math.round(fy), u = fx - ix, v = fy - iy;
    const ti = (Math.floor(wy / TILE) - K.y0) * K.w + Math.floor(wx / TILE) - K.x0, raw = K.t[ti], wet = K.wet[ti];
    if (wet === 2) return R3_MAT.keep;
    if ((raw & 15) === R3_MAT.stairs) return raw;
    const blue = cb > cr + 18 && cb > cg - 12;
    const u0 = 0.5 * (0.5 - u) * (0.5 - u), u1 = 0.75 - u * u, u2 = 0.5 * (0.5 + u) * (0.5 + u);
    const v0 = 0.5 * (0.5 - v) * (0.5 - v), v1 = 0.75 - v * v, v2 = 0.5 * (0.5 + v) * (0.5 + v);
    let w1 = 0, w2 = 0, w3 = 0, w4 = 0, w5 = 0, nearWet = false;
    for (let j = 0; j < 3; j++) {
        const wv = j === 0 ? v0 : j === 1 ? v1 : v2, row = (iy - 1 + j - K.y0) * K.w + ix - 1 - K.x0;
        for (let i = 0; i < 3; i++) {
            const k = row + i, c = K.t[k] & 15, w = wv * (i === 0 ? u0 : i === 1 ? u1 : u2);
            if (K.wet[k] === 1) nearWet = true;
            if (c === 1) w1 += w; else if (c === 2) w2 += w * 1.25; else if (c === 3) w3 += w * 1.25; else if (c === 4) w4 += w * 1.25; else if (c === 5) w5 += w * 1.25;
        }
    }
    if (blue && nearWet) return R3_MAT.keep;
    let best = R3_MAT.keep, bw = 0;
    if (w1 > bw) { bw = w1; best = 1; } if (w2 > bw) { bw = w2; best = 2; } if (w3 > bw) { bw = w3; best = 3; } if (w4 > bw) { bw = w4; best = 4; } if (w5 > bw) { bw = w5; best = 5; }
    return best | (raw & 16);
}
function r3IsRamp(tx, ty) { r3TileClass(); return R3_CLS.ramp.has(ty * W0.w + tx); }
/* a piece's map of kinds, empty (all "keep the picture") until it's painted */
function r3KindsTex() {
    const N = R3_CHUNKPX, t = new THREE.DataTexture(new Uint8Array(N * N * 4), N, N, THREE.RGBAFormat);
    t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
    return t;
}

/* a piece's map of kinds, from the kind under each of its pixels (cls, worked out with the picture's wavy borders) and
   whatever was drawn over the ground since (base = the ground before that): drawn-over pixels keep the picture. Each
   pixel also knows how near the next different kind is (1 to 5 pixels) and what that kind is, for rims and grass
   reaching over the edges. */
function r3ChunkKinds(ch, cls, base) {
    const N = R3_CHUNKPX, now = ch.ctx.getImageData(0, 0, N, N).data, b = base.data, id = new Uint8Array(N * N);
    for (let i = 0, j = 0; i < N * N; i++, j += 4) {
        const c = cls[i];
        id[i] = c >= 16 ? c - 16 : (now[j] !== b[j] || now[j + 1] !== b[j + 1] || now[j + 2] !== b[j + 2] || now[j + 3] !== b[j + 3]) ? 0 : c;
    }
    const dist = new Uint8Array(N * N).fill(5), nb = new Uint8Array(N * N);
    const look = (i, n) => { if (id[n] !== id[i]) { dist[i] = 1; nb[i] = id[n]; } else if (dist[n] + 1 < dist[i]) { dist[i] = dist[n] + 1; nb[i] = nb[n]; } };
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const i = y * N + x;
        if (x > 0) look(i, i - 1);
        if (y > 0) { look(i, i - N); if (x > 0) look(i, i - N - 1); if (x < N - 1) look(i, i - N + 1); }
    }
    for (let y = N - 1; y >= 0; y--) for (let x = N - 1; x >= 0; x--) {
        const i = y * N + x;
        if (x < N - 1) look(i, i + 1);
        if (y < N - 1) { look(i, i + N); if (x < N - 1) look(i, i + N + 1); if (x > 0) look(i, i + N - 1); }
    }
    // (the texture's first row is its bottom: the picture's last row)
    const d = ch.kinds.image.data;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const i = y * N + x, o = ((N - 1 - y) * N + x) * 4;
        d[o] = id[i] * 32; d[o + 1] = dist[i] * 40; d[o + 2] = nb[i] * 32; d[o + 3] = 255;
    }
    ch.kinds.needsUpdate = true;
}

const R3_GROUND_HEAD = 'uniform sampler2D uKinds; uniform sampler2D uDetA; uniform sampler2D uDetB; uniform sampler2D uPal; uniform float uDetOn;\n'
    + 'vec3 r3pal(float row, float v){ return texture2D(uPal, vec2((floor(clamp(v, 0.0, 0.999) * 16.0) + 0.5) / 16.0, (row + 0.5) / 8.0)).rgb; }\n';
/* (runs just after the picture is read: the fine art replaces it, and the light and shadows fall on that) */
const R3_GROUND_GLSL = `
float r3Proc = 0.0;
if (uDetOn > 0.5) {
    vec4 mt = texture2D(uKinds, vUv);
    float id = floor(mt.r * 7.97 + 0.5);
    if (id > 0.5) {
        vec3 fn = normalize(cross(dFdx(vWp), dFdy(vWp)));
        float up = abs(fn.y);
        vec2 tp = vec2(vWp.x, vWp.z / ${R3_ZS.toFixed(3)});
        vec2 du = tp * ${R3_DET_K.toFixed(5)};
        vec4 da = texture2D(uDetA, du);
        float near = mt.g * 6.375, nb = floor(mt.b * 7.97 + 0.5);
        vec3 col;
        if (id < 5.5 && up < 0.9) {
            // a cliff (a sea cliff too): stones in rows across its face
            vec2 wu = abs(fn.x) > abs(fn.z) ? vec2(vWp.z / ${R3_ZS.toFixed(3)}, -vWp.y) : vec2(vWp.x, -vWp.y);
            // (walls turned away from the sun would be nearly black: they get some of the sky's light back)
            col = r3pal(4.0, texture2D(uDetB, wu * ${R3_DET_K.toFixed(5)}).r) * (0.92 + 0.16 * r3n(wu * 0.6)) * (1.0 + 0.45 * max(0.0, fn.x) + 0.2 * max(0.0, -fn.z));
        } else if (id > 5.5) {
            // stairs: stone treads with a lit nose and a shaded riser under it
            float s = fract(vWp.y / 0.4 + 0.15);
            col = s > 0.8 ? r3pal(2.0, 0.26 + da.b * 0.12) : s > 0.72 ? r3pal(2.0, 0.86) : r3pal(2.0, 0.42 + da.b * 0.4);
        } else {
            // (the rock rim above the sea is grass on top)
            float row = id > 4.5 ? 0.0 : id - 1.0, v = id < 1.5 || id > 4.5 ? da.r : id < 2.5 ? da.g : id < 3.5 ? da.b : da.a;
            // grass reaches a little over the edge of paths, cobbles and sand
            if (id > 1.5 && nb > 0.5 && nb < 1.5 && near < 2.5 && da.r > (near < 1.5 ? 0.48 : 0.64)) { v = da.r; row = 0.0; }
            col = r3pal(row, v);
            if (row < 0.5) {
                float fl = texture2D(uDetB, du).g;
                if (fl > 0.02 && r3n(tp * 0.31 + 3.7) > 0.52) col = r3pal(5.0, fl);
                col *= 0.9 + 0.2 * r3n(tp * 0.17);
                if (nb > 1.5 && near < 1.5) col *= 0.88;
            } else {
                if (id > 1.5 && id < 2.5 && near < 2.5) col *= near < 1.5 ? 0.82 : 0.92;
                col *= 0.95 + 0.1 * r3n(tp * 0.23 + 9.1);
            }
        }
        diffuseColor.rgb = diffuse * col;
        r3Proc = 1.0;
    }
}`;
