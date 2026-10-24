// Paints the island's ground: 16 pixels a tile, in the first island's palette (so the seasons recolor it as before).
//  - grass, rock, sand and open sea: copied from the first island in blocks of tiles, each block picked to follow a
//    smooth pattern of lighter and darker ground, their seams dithered
//  - cobbles, paths, dirt and water: drawn here in the first island's colors; paths, rivers and ponds along the
//    curves they follow (not tile by tile), so they wind
//  - other borders wavy (each pixel looks at the ground a few pixels off, along a smooth noise field), except on and
//    beside cliffs, stairs, bridges, cobbles and fields, which keep their straight lines
//  - cliffs, side edges: the first island's tile with the same higher ground around it; stairs, waterfalls, bridges,
//    fields and the hot spring: copied whole
//  - the sea lighter in the shallows and foamy at the shore, ponds and rivers with a bright rim
import { loadSource, sig, topKind, nearestKey, T } from './source.mjs';
import { hash, noise } from './rand.mjs';

export function paintGround(P, world, srcDir) {
  const S = loadSource(srcDir), SI = S.img, SW = SI.w, SH = SI.h;
  const W = P.W, H = P.H, PW = W * T, PH = H * T, px = new Uint8Array(PW * PH);
  const ter = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? '~' : P.ter[y * W + x]);
  const lvl = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : P.lvl[y * W + x]);
  const isSea = (x, y) => ter(x, y) === '~';
  const sp = (sx, sy) => SI.px[Math.max(0, Math.min(SH - 1, sy)) * SW + Math.max(0, Math.min(SW - 1, sx))];
  const copyTile = (sx, sy, x, y) => { for (let j = 0; j < T; j++) px.set(SI.px.subarray((sy * T + j) * SW + sx * T, (sy * T + j) * SW + sx * T + T), (y * T + j) * PW + x * T); };

  // ---------------------------------------------------------------- copied textures, in blocks of B tiles
  const B = S.B, BP = B * T;
  const palRGB = [];
  { const hex = SI.pal; for (let i = 0; i < 256; i++) palRGB.push([hex[i * 3], hex[i * 3 + 1], hex[i * 3 + 2]]); }
  const lum = (i) => { const c = palRGB[i] || [0, 0, 0]; return c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11; };
  // each kind's blocks, darkest first
  const sorted = {};
  for (const c of 'gms~') {
    const list = S.blocks[c].length ? S.blocks[c] : S.tiles[c].map(([x, y]) => [x, y]);
    sorted[c] = list.map(([bx, by]) => { let s = 0, n = 0; for (let y = by * T; y < (by + B) * T; y += 3) for (let x = bx * T; x < (bx + B) * T; x += 3) { s += lum(sp(x, y)); n++; } return { bx, by, l: s / n }; }).sort((a, b) => a.l - b.l);
  }
  const tone = noise(41);
  const pickCache = new Map();
  /* the source block for output block (bx, by) of kind c: lighter or darker following a smooth pattern */
  const blockSrc = (c, bx, by) => {
    const key = c + bx + ',' + by;
    let v = pickCache.get(key);
    if (!v) {
      const L = sorted[c], q = Math.max(0, Math.min(0.999, 0.5 + tone(bx / 5, by / 5) * 0.55 + ((hash(bx, by, 9) % 100) / 100 - 0.5) * 0.12));
      v = L[Math.floor(q * L.length)];
      pickCache.set(key, v);
    }
    return v;
  };
  /* a copied kind's pixel at (X, Y): from its block's source, dithered with the neighbour block's near the seams */
  const nd = noise(18);
  const copied = (c, X, Y) => {
    let bx = Math.floor(X / BP), by = Math.floor(Y / BP);
    const ox = X - bx * BP, oy = Y - by * BP, j = nd(X / 5, Y / 5) * 5 + ((hash(X, Y, 17) & 3) - 1.5);
    if (ox + j < 3) bx--;
    else if (oy + j < 3) by--;
    const s = blockSrc(c, bx, by);
    return sp(s.bx * T + (X - bx * BP), s.by * T + (Y - by * BP));
  };
  // ---------------------------------------------------------------- drawn textures
  const COB = [56, 56, 56, 58, 58, 58, 143, 143, 133];
  const cobble = (X, Y) => {
    const row = Math.floor(Y / 6), ry = Y - row * 6, xx = X + (row & 1) * 3, col = Math.floor(xx / 6), rx = xx - col * 6;
    if (ry === 4 || rx === 3) return 101;
    return COB[hash(col, row, 5) % COB.length];
  };
  const PATH = { base: 53, k: [[47, 10], [27, 7], [43, 5], [31, 7], [230, 6], [202, 5], [69, 2], [188, 1]] };
  const DIRT = { base: 134, k: [[135, 10], [137, 9], [83, 6], [231, 8], [201, 5], [62, 4], [186, 2], [188, 1]] };
  for (const E of [PATH, DIRT]) { E.tbl = []; for (const [i, n] of E.k) for (let j = 0; j < n; j++) E.tbl.push(i); while (E.tbl.length < 100) E.tbl.push(E.base); }
  // little clumps of two or three pixels, like the first island's paths
  const earth = (E, X, Y) => {
    const cx = Math.floor((X + (hash(Math.floor(Y / 2), 3) & 1)) / 2), cy = Math.floor(Y / 2);
    const v = hash(cx, cy, 11) % 100, w = hash(X, Y, 12) % 100;
    return w < 8 ? E.tbl[(v + w * 7) % 100] : E.tbl[v];
  };
  const nw = noise(7), nh = noise(8);
  const wat = (c, X, Y) => {
    if (c === 'h') return nh(X / 4, Y / 4) > 0.35 ? 73 : 80;
    const s = Math.sin(X * 0.21 + nw(X / 20, Y / 9) * 6 + Y * 0.06), h = hash(X, Y, 13) % 1000;
    if (s > 0.93 && (Y % 5) < 2) return 241;
    if (s > 0.8 && (Y % 5) < 2) return 218;
    if (h < 25) return 219;
    return 97;
  };
  const texAt = (c, X, Y) => {
    switch (c) {
      case 'p': return earth(PATH, X, Y);
      case 'd': return earth(DIRT, X, Y);
      case 'c': return cobble(X, Y);
      case 'o': case 'r': case 'h': return wat(c, X, Y);
      case 'g': case 'm': case 's': case '~': return copied(c, X, Y);
      default: return copied('g', X, Y);
    }
  };

  // ---------------------------------------------------------------- what keeps straight edges
  const HARD = new Set(['b', 'w', 'F', 'W', 'x', 'h']);
  const hard = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = y * W + x;
    if (HARD.has(P.ter[k]) || P.face[k] || sig(lvl, isSea, x, y)) hard[k] = 1;
  }
  const nearHard = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let h = 0;
    for (let dy = -1; dy <= 1 && !h; dy++) for (let dx = -1; dx <= 1 && !h; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H && hard[yy * W + xx]) h = 1; }
    nearHard[y * W + x] = h;
  }
  // a smooth field of pixel offsets, repeating every 128 pixels (noise on lattices that wrap, so it has no seams)
  const FS = 128, fx = new Int8Array(FS * FS), fy = new Int8Array(FS * FS);
  const lattice = (n, seed) => { const a = new Float32Array(n * n); for (let i = 0; i < a.length; i++) a[i] = (hash(seed, i) / 4294967296) * 2 - 1; return a; };
  const smp = (L, n, x, y) => {
    const c = FS / n, gx = x / c, gy = y / c, ix = Math.floor(gx), iy = Math.floor(gy), tx = gx - ix, ty = gy - iy;
    const u = tx * tx * (3 - 2 * tx), v = ty * ty * (3 - 2 * ty), at = (i, j) => L[((j % n) * n) + (i % n)];
    return (at(ix, iy) * (1 - u) + at(ix + 1, iy) * u) * (1 - v) + (at(ix, iy + 1) * (1 - u) + at(ix + 1, iy + 1) * u) * v;
  };
  const L1x = lattice(8, 21), L1y = lattice(8, 22), L2x = lattice(24, 23), L2y = lattice(24, 24);
  for (let y = 0; y < FS; y++) for (let x = 0; x < FS; x++) {
    fx[y * FS + x] = Math.round((smp(L1x, 8, x, y) * 0.75 + smp(L2x, 24, x, y) * 0.25) * 4.5);
    fy[y * FS + x] = Math.round((smp(L1y, 8, x, y) * 0.75 + smp(L2y, 24, x, y) * 0.25) * 4.5);
  }

  // ---------------------------------------------------------------- the lines paths and rivers follow, by tile
  // each tile lists the line pieces near it; a pixel is on a path or in a river when it's within the line's half-width
  // (give or take a pixel or two of wobble) and its tile isn't something hard
  const near = new Map();
  P.strokes.forEach((s, si) => {
    const r = s.width / 2 + 1;
    for (let i = 0; i < s.line.length - 1; i++) {
      const [ax, ay] = s.line[i], [bx, by] = s.line[i + 1];
      for (let y = Math.floor(Math.min(ay, by) - r); y <= Math.ceil(Math.max(ay, by) + r); y++) for (let x = Math.floor(Math.min(ax, bx) - r); x <= Math.ceil(Math.max(ax, bx) + r); x++) {
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        const k = y * W + x;
        if (!near.has(k)) near.set(k, []);
        near.get(k).push(si, i);
      }
    }
  });
  const ne = noise(19);
  const strokeAt = (k, X, Y) => {
    const L = near.get(k);
    if (!L) return null;
    const x = X / T, y = Y / T;
    let best = null, bd = 1e9;
    for (let j = 0; j < L.length; j += 2) {
      const s = P.strokes[L[j]], i = L[j + 1], [ax, ay] = s.line[i], [bx, by] = s.line[i + 1];
      const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1e-9, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2));
      const d = Math.hypot(x - ax - dx * t, y - ay - dy * t) - s.width / 2 - ne(X / 11, Y / 11) * 0.12;
      // rivers win over paths (a path meets a river at a bridge, which is hard and drawn on its own)
      const rank = d < 0 ? (s.kind === 'r' ? -2 : -1) : d;
      if (rank < bd) { bd = rank; best = s.kind; }
    }
    return bd < 0 ? best : null;
  };
  // round shapes (ponds, the plaza), by tile too
  const nearShape = new Map();
  P.shapes.forEach((sh, si) => {
    sh.n = noise(sh.seed);
    for (let y = Math.floor(sh.cy - sh.ry - 2); y <= Math.ceil(sh.cy + sh.ry + 2); y++) for (let x = Math.floor(sh.cx - sh.rx - 2); x <= Math.ceil(sh.cx + sh.rx + 2); x++) {
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const k = y * W + x;
      if (!nearShape.has(k)) nearShape.set(k, []);
      nearShape.get(k).push(si);
    }
  });
  const shapeAt = (k, X, Y) => {
    const L = nearShape.get(k);
    if (!L) return null;
    const x = X / T, y = Y / T;
    for (const si of L) {
      const sh = P.shapes[si], dx = (x - sh.cx) / sh.rx, dy = (y - sh.cy) / sh.ry;
      const wob = sh.kind === 'o' ? sh.n(x / 2, y / 2) * 0.22 : ne(X / 9, Y / 9) * 0.04;
      if (dx * dx + dy * dy + wob < 1) return sh.kind;
    }
    return null;
  };

  // ---------------------------------------------------------------- the base: every pixel
  const mat = new Uint8Array(PW * PH);         // the kind each pixel ended up with (for the shores)
  for (let Y = 0; Y < PH; Y++) {
    const ty = Y >> 4, fyy = (Y % FS) * FS;
    for (let X = 0; X < PW; X++) {
      const tx = X >> 4, k = ty * W + tx, own = P.ter[k];
      let c = own;
      if (!hard[k] && own !== '~' && (near.has(k) || nearShape.has(k))) {
        // on a path's, street's or river's line, or in a pond or the plaza; or off them (a path tile beside its line
        // shows what it was laid over)
        const s = near.has(k) ? strokeAt(k, X, Y) : null, sh = s ? null : nearShape.has(k) ? shapeAt(k, X, Y) : null;
        if (s) c = s;
        else if (sh) c = sh;
        else if ('pdrco'.includes(own)) c = P.under[k] || (P.lvl[k] >= 2 ? 'm' : 'g');
      }
      if (c === own && !nearHard[k] && 'gms~'.includes(own)) {
        const fi = fyy + (X % FS), wx = X + fx[fi], wy = Y + fy[fi];
        const sx = Math.max(0, Math.min(W - 1, wx >> 4)), sy = Math.max(0, Math.min(H - 1, wy >> 4)), k2 = sy * W + sx, o = P.ter[k2];
        // borrow only plain ground, on the same level (never across a cliff, never a path's tile: paths have lines)
        if (P.lvl[k2] === P.lvl[k] && !hard[k2] && 'gms~'.includes(o)) c = o;
      }
      px[Y * PW + X] = texAt(c, X, Y);
      mat[Y * PW + X] = c.charCodeAt(0);
    }
  }

  // ---------------------------------------------------------------- the sea's shallows and every shore's rim
  const SEA = 126, isWater = (m) => m === 126 || m === 111 || m === 114 || m === 104;       // ~ o r h
  // (bridges and the pier stand over the water: not shore)
  const dist = chamfer(PW, PH, (i) => !isWater(mat[i]) && mat[i] !== 98 && mat[i] !== 119, 48);
  for (let i = 0; i < PW * PH; i++) {
    const m = mat[i];
    if (!isWater(m)) continue;
    const d = dist[i], X = i % PW, Y = (i / PW) | 0, h = hash(X, Y, 31) % 100;
    if (m === SEA) {
      if (d <= 2) px[i] = 41;
      else if (d <= 5) px[i] = h < 70 ? 148 : 41;
      else if (d <= 10) px[i] = h < 55 ? 184 : 148;
      else if (d <= 18) px[i] = h < 45 ? 65 : 184;
      else if (d <= 28 && h < 30) px[i] = 65;
    } else if (m !== 104) {
      if (d <= 1) px[i] = 241;
      else if (d <= 3) px[i] = 148;
    }
  }

  // ---------------------------------------------------------------- tiles beside higher ground: the first island's
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = y * W + x, c = P.ter[k];
    if ('~WbwFohrx'.includes(c)) continue;
    const s = sig(lvl, isSea, x, y);
    if (!s) continue;
    const key = nearestKey(S, s + '|' + topKind(ter, lvl, x, y));
    const list = S.cliffs.get(key);
    const [sx, sy] = list[hash(x, y, 3) % list.length];
    copyTile(sx, sy, x, y);
  }

  // ---------------------------------------------------------------- copied whole
  // stairs: grass ones up to the uplands, rock ones up the mountain (3 x 2 tiles)
  for (const r of P.ramps) {
    const [sx, sy] = r.L >= 2 ? [124, 25] : [79, 43];
    for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) copyTile(sx + i, sy + j, r.x - 1 + i, r.y + 1 + j);
  }
  // waterfalls (2 x 2)
  for (const f of P.falls) {
    const [sx, sy] = f.L >= 2 ? [138, 25] : [126, 43];
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) copyTile(sx + i, sy + j, f.x + i, f.y + 1 + j);
  }
  // fields, the hot spring and anything else copied as a block
  for (const b of P.blocks) for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) copyTile(b.sx + i, b.sy + j, b.x + i, b.y + j);
  // the boardwalk (two rows of planks), the pier and the bridges (planks over the water)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = P.ter[y * W + x];
    if (c === 'b') copyTile(92 + (x % 4), ter(x, y - 1) === 'b' ? 95 : 94, x, y);
    else if (c === 'w') {
      const along = ter(x, y - 1) === 'w' && ter(x, y + 1) === 'w' && !(ter(x - 1, y) === 'w' && ter(x + 1, y) === 'w' && ter(x - 2, y) === 'w');
      if (along) copyTile(ter(x - 1, y) === 'w' ? 80 : 79, 114 + (y % 4), x, y);
      else copyTile(121 + (x % 4), ter(x, y - 1) === 'w' ? 67 : 66, x, y);
    }
  }

  const pal = new Uint8Array(768); pal.set(SI.pal.subarray(0, 768));
  return { w: PW, h: PH, px, pal };
}

/* each pixel's distance (in pixels, up to `max`) to the nearest pixel where src(i), two-pass chamfer */
function chamfer(w, h, src, max) {
  const d = new Uint8Array(w * h).fill(max);
  for (let i = 0; i < w * h; i++) if (src(i)) d[i] = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    let v = d[i];
    if (x > 0) v = Math.min(v, d[i - 1] + 1);
    if (y > 0) { v = Math.min(v, d[i - w] + 1); if (x > 0) v = Math.min(v, d[i - w - 1] + 1); if (x < w - 1) v = Math.min(v, d[i - w + 1] + 1); }
    d[i] = v;
  }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
    const i = y * w + x;
    let v = d[i];
    if (x < w - 1) v = Math.min(v, d[i + 1] + 1);
    if (y < h - 1) { v = Math.min(v, d[i + w] + 1); if (x < w - 1) v = Math.min(v, d[i + w + 1] + 1); if (x > 0) v = Math.min(v, d[i + w - 1] + 1); }
    d[i] = v;
  }
  return d;
}
