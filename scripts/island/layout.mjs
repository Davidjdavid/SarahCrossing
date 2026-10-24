// The big island's layout: the coast, the land's heights, water, districts, roads and trails, buildings, trees,
// flowers, props and the named spots the neighbors use, as the world.json the game reads (plus what the painter needs).
//
// The shape of it, north at the top:
//   - the town in the middle of the south coast: a round stone plaza with the big tree, curving stone streets lined
//     with shops, the pier where the boat comes in, a boardwalk along the beach to the east (the diner, the arcade, the
//     club)
//   - the neighborhood to the west: houses scattered along winding lanes, a pond, with the forest growing all round it
//   - the forest: big, on the low ground and up onto the uplands, its trails a maze with clearings (the campsite, the
//     old giant trees, a picnic spot, hidden glades)
//   - the uplands (one level up, stone cliffs along their south edge): the farm in the north-west, the meadow
//   - the mountain in the north-east, five terraces above the uplands: a trail winds up them, crossing back and forth,
//     to the summit and its telescope; a river falls down its face in a chain of waterfalls and runs to the sea east
//     of the town; the hot spring and the east meadow at its foot, the orchard by the river, the lighthouse on the
//     south-east point
import fs from 'node:fs';
import path from 'node:path';
import { rng, noise, fbm } from './rand.mjs';

const SRC = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'source/world.json'), 'utf8'));
export const W = 272, H = 228;
const SEA = '~';

export function makeIsland(seed = 7) {
  const I = new Island(seed);
  I.shape();
  I.plan();
  I.heights();
  I.terrain();
  I.town();
  I.neighborhood();
  I.farm();
  I.mountain();
  I.forest();
  I.coast();
  I.roads();
  I.bridges();
  I.greenery();
  I.furnish();
  I.places();
  return I.output();
}

class Island {
  constructor(seed) {
    this.seed = seed;
    this.land = new Uint8Array(W * H);
    this.lvl = new Uint8Array(W * H);
    this.ter = new Array(W * H).fill(SEA);
    this.coll = new Uint8Array(W * H);
    this.occ = new Uint8Array(W * H);        // taken: 1 by a building, prop, tree or field; 2 room kept clear; 3 a flower
    this.zone = new Array(W * H).fill('');
    this.under = new Array(W * H).fill('');  // the ground a path was laid over
    this.buildings = {}; this.props = []; this.trees = []; this.fruitTrees = []; this.palms = []; this.flowers = []; this.oldTrees = [];
    this.spots = {}; this.ramps = []; this.waterfalls = []; this.fields = []; this.stubs = {}; this.gemSpots = []; this.plots = []; this.lots = {};
    this.blocks = [];          // pieces of the first island's ground copied whole: { sx, sy, w, h, x, y }
    this.strokes = [];         // paths, streets and rivers as the lines they follow, for the painter: { line, width, kind }
    this.shapes = [];          // round things: ponds, the plaza, the statue's square: { kind, cx, cy, rx, ry, seed }
    this.crossings = [];       // where a path met the river: a straight bridge goes there
  }
  i(x, y) { return y * W + x; }
  in(x, y) { return x >= 0 && y >= 0 && x < W && y < H; }
  T(x, y) { return this.in(x, y) ? this.ter[this.i(x, y)] : SEA; }
  setT(x, y, c) { if (this.in(x, y)) this.ter[this.i(x, y)] = c; }
  L(x, y) { return this.in(x, y) ? this.lvl[this.i(x, y)] : 0; }
  isLand(x, y) { return this.in(x, y) && this.land[this.i(x, y)] === 1; }
  free(x, y) { return this.isLand(x, y) && !this.occ[this.i(x, y)] && !this.face[this.i(x, y)] && !'~orhxWFbwcpd'.includes(this.T(x, y)); }

  /* ---------------------------------------------------------------- the coast */
  shape() {
    // an uneven blob: its outline pushed about by warped noise, with a few headlands and bays put where they belong
    const wx = fbm(this.seed + 3, 70, 3), wy = fbm(this.seed + 4, 70, 3), n2 = fbm(this.seed + 2, 14, 3);
    const g = (x, y, cx, cy, rx, ry) => Math.exp(-(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2));
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const X = x + wx(x, y) * 26, Y = y + wy(x, y) * 22;
      const nx = (X - 136) / 112, ny = (Y - 113) / 90;
      const d = (Math.abs(nx) ** 2.3 + Math.abs(ny) ** 2.3) ** (1 / 2.3);
      let v = 1 - d + n2(x, y) * 0.06;
      v += 0.20 * g(x, y, 224, 44, 40, 36);          // the mountain's shoulder
      v += 0.14 * g(x, y, 36, 34, 26, 22);           // the farm's headland
      v += 0.10 * g(x, y, 60, 196, 36, 12);          // a long beach in the south-west
      v -= 0.46 * g(x, y, 128, 212, 15, 10);         // the harbor bay, where the pier is
      v -= 0.34 * g(x, y, 14, 134, 10, 12);          // a cove on the west coast
      v -= 0.30 * g(x, y, 262, 146, 11, 14);         // and one on the east
      v += 0.18 * g(x, y, 238, 194, 16, 10);         // the lighthouse point
      v -= 0.20 * g(x, y, 140, 10, 30, 8);           // a bay in the north
      const edge = Math.min(x, y, W - 1 - x, H - 1 - y);
      if (edge < 12) v -= (12 - edge) * 0.05;
      this.land[this.i(x, y)] = v > 0 ? 1 : 0;
    }
    // one island: the biggest piece of land; lakes the sea can't reach become land; no one-tile spurs or notches
    for (let pass = 0; pass < 3; pass++) {
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
        const k = this.i(x, y), n = this.land[k - 1] + this.land[k + 1] + this.land[k - W] + this.land[k + W];
        if (this.land[k] && n <= 1) this.land[k] = 0;
        else if (!this.land[k] && n >= 3) this.land[k] = 1;
      }
    }
    let big = null;
    for (const c of this.components((k) => this.land[k] === 1)) if (!big || c.length > big.length) big = c;
    this.land.fill(0);
    for (const k of big) this.land[k] = 1;
    const sea = this.flood(this.i(0, 0), (k) => this.land[k] === 0);
    for (let k = 0; k < W * H; k++) if (!this.land[k] && !sea.has(k)) this.land[k] = 1;
    this.seaDist = this.distance((k) => this.land[k] === 0);
  }
  components(ok) {
    const seen = new Uint8Array(W * H), out = [];
    for (let k = 0; k < W * H; k++) if (!seen[k] && ok(k)) {
      const c = [], st = [k]; seen[k] = 1;
      while (st.length) { const q = st.pop(); c.push(q); const x = q % W, y = (q / W) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (!this.in(nx, ny)) continue; const n = ny * W + nx; if (!seen[n] && ok(n)) { seen[n] = 1; st.push(n); } } }
      out.push(c);
    }
    return out;
  }
  flood(start, ok) {
    const seen = new Set([start]), st = [start];
    while (st.length) { const q = st.pop(); const x = q % W, y = (q / W) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (!this.in(nx, ny)) continue; const n = ny * W + nx; if (!seen.has(n) && ok(n)) { seen.add(n); st.push(n); } } }
    return seen;
  }
  /* every tile's distance (8-way steps) to the nearest tile where src(k) */
  distance(src) {
    const d = new Uint16Array(W * H).fill(9999), q = [];
    for (let k = 0; k < W * H; k++) if (src(k)) { d[k] = 0; q.push(k); }
    for (let h = 0; h < q.length; h++) {
      const k = q[h], x = k % W, y = (k / W) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (!this.in(nx, ny)) continue; const n = ny * W + nx; if (d[n] > d[k] + 1) { d[n] = d[k] + 1; q.push(n); } }
    }
    return d;
  }
  coastY(x, fromSouth) {
    if (fromSouth) { for (let y = H - 1; y >= 0; y--) if (this.isLand(x, y)) return y; }
    else for (let y = 0; y < H; y++) if (this.isLand(x, y)) return y;
    return -1;
  }

  /* ---------------------------------------------------------------- the plan: the heights' edges, stairs and falls */
  plan() {
    // the uplands' south edge and each mountain terrace's, as a row per column (higher ground is everything north of it,
    // so every cliff faces south, east or west, never away from the camera)
    const n = noise(this.seed + 30), n2 = noise(this.seed + 31);
    this.bottoms = [];
    const b1 = new Array(W).fill(-1);
    for (let x = 0; x < W; x++) {
      const east = Math.max(0, Math.min(1, (x - 140) / 46));
      b1[x] = Math.round(98 + east * 15 + n(x / 30, 0.5) * 13 + n2(x / 10, 3.5) * 3);
    }
    this.slope(b1, 1);
    this.bottoms[1] = b1;
    // the mountain: five terraces, each narrower and further north, their edges wandering
    // (each terrace's edge curves up to meet the north coast at its ends, so there are no long sheer side walls)
    const M = [null, null,
      { cx: 214, w: 60, d: 104 }, { cx: 218, w: 50, d: 88 }, { cx: 221, w: 40, d: 73 }, { cx: 223, w: 31, d: 58 }, { cx: 225, w: 21, d: 44 }];
    for (let L = 2; L <= 6; L++) {
      const m = M[L], b = new Array(W).fill(-1), nn = noise(this.seed + 40 + L), nm = noise(this.seed + 60 + L);
      const cx = m.cx + Math.round(nn(0.3, L) * 5);
      for (let x = 0; x < W; x++) {
        const t = (x - cx) / (m.w + nn(x / 19, 1.7) * 6), top = this.coastY(x);
        if (Math.abs(t) > 1 || top < 0) continue;
        // a dome down from the coast, with spurs and bays along its edge
        const v = Math.round(top + (m.d - top) * (1 - t * t) + nm(x / 7, 2.2) * 3 * (1 - t * t) + nm(x / 16, 5.1) * 6 * (1 - t * t));
        if (v > top + 1) b[x] = v;
      }
      this.slope(b, 2);
      this.bottoms[L] = b;
    }
    // stairs (3 wide) where a road or trail climbs a cliff, and falls where the river does: their stretch of cliff is
    // kept straight so the stairs and the water fit
    this.rampAt = [];          // { L, x }: stairs from level L-1 up to L, columns x-1..x+1
    this.fallAt = [];          // { L, x }: the river falls from L to L-1, columns x..x+1
    // up onto the uplands: the town's north road, the farm lane, two forest trails, the meadow path, the mountain road
    for (const x of [126, 52, 32, 92, 152, 180]) this.rampAt.push({ L: 1, x });
    // the trail up the mountain, crossing back and forth
    this.trail = [{ L: 2, x: 172 }, { L: 3, x: 246 }, { L: 4, x: 196 }, { L: 5, x: 240 }, { L: 6, x: 216 }];
    for (const t of this.trail) this.rampAt.push({ L: t.L, x: t.x });
    // the river: a lake on the fifth terrace, falling straight down the mountain's face, then off the uplands
    this.riverX = 226;
    for (let L = 5; L >= 2; L--) this.fallAt.push({ L, x: this.riverX });
    this.fallAt.push({ L: 1, x: 208 });
    // keep the terraces nested: at least 8 rows apart (two of cliff, six to walk on), and 5 columns in at the sides
    this.nest();
    // each trail stair where its terrace has room for it (near where it was planned)
    for (const r of this.rampAt) if (r.L >= 2) r.x = this.goodColumn(r.L, r.x);
    for (const t of this.trail) t.x = this.rampAt.find(r => r.L === t.L && r.L >= 2).x;
    for (const r of this.rampAt) this.straighten(r.L, r.x - 3, r.x + 3);
    for (const f of this.fallAt) this.straighten(f.L, f.x - 2, f.x + 3);
    this.nest();
  }
  /* a column near x where level L's edge is well inside the island, with level L-1 room below it and a straight run */
  goodColumn(L, x) {
    const b = this.bottoms[L], lo = this.bottoms[L - 1];
    for (let d = 0; d < 40; d++) for (const s of [1, -1]) {
      const c = x + d * s;
      let ok = true;
      for (let k = -4; k <= 4 && ok; k++) if (!(b[c + k] >= 0) || !(lo[c + k] >= 0) || b[c + k] < this.coastY(c + k) + 6 || lo[c + k] < b[c] + 9) ok = false;
      if (ok) return c;
    }
    return x;
  }
  nest() {
    for (let L = 2; L <= 6; L++) {
      const lo = this.bottoms[L - 1], b = this.bottoms[L];
      for (let x = 0; x < W; x++) {
        if (b[x] < 0) continue;
        let ok = lo[x] >= 0;
        for (let k = -5; k <= 5 && ok; k++) if (lo[x + k] === undefined || lo[x + k] < 0) ok = false;
        if (!ok) { b[x] = -1; continue; }
        b[x] = Math.min(b[x], lo[x] - 8);
      }
    }
  }
  /* no edge climbs more than `max` rows from one column to the next (taller steps would be sheer side walls) */
  slope(b, max) {
    for (let pass = 0; pass < 2; pass++) for (let x = 1; x < W; x++) if (b[x] >= 0 && b[x - 1] >= 0) b[x] = Math.max(b[x - 1] - max, Math.min(b[x - 1] + max, b[x]));
  }
  straighten(L, x0, x1) {
    const b = this.bottoms[L];
    if (!b) return;
    const xs = []; for (let x = x0; x <= x1; x++) if (b[x] >= 0) xs.push(b[x]);
    if (!xs.length) return;
    const v = Math.round(xs.reduce((a, c) => a + c, 0) / xs.length);
    for (let x = x0; x <= x1; x++) if (b[x] >= 0) b[x] = v;
  }

  /* ---------------------------------------------------------------- heights */
  heights() {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const k = this.i(x, y);
      if (!this.land[k]) continue;
      let l = 0;
      for (let L = 1; L <= 6; L++) { const b = this.bottoms[L]; if (b && b[x] >= 0 && y <= b[x]) l = L; }
      this.lvl[k] = l;
    }
    // cliffs: a raised edge facing south becomes two rows of stone face on the lower ground; facing east or west, one
    this.face = new Uint8Array(W * H);         // 1, 2: the face's rows; 3: a side edge
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const k = this.i(x, y);
      if (!this.land[k]) continue;
      const h = this.lvl[k];
      if (y > 0 && this.isLand(x, y - 1) && this.L(x, y - 1) > h) this.face[k] = 1;
      else if (y > 1 && this.isLand(x, y - 2) && this.L(x, y - 2) > h && this.L(x, y - 1) === h) this.face[k] = 2;
      else if ((this.isLand(x - 1, y) && this.L(x - 1, y) > h) || (this.isLand(x + 1, y) && this.L(x + 1, y) > h)) this.face[k] = 3;
    }
  }

  /* ---------------------------------------------------------------- the ground's kinds */
  terrain() {
    const nb = noise(this.seed + 50);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const k = this.i(x, y);
      if (!this.land[k]) { this.ter[k] = SEA; this.coll[k] = 1; continue; }
      const l = this.lvl[k];
      // beaches: low ground near the sea, a few tiles deep
      const beach = 3 + Math.round((nb(x / 9, y / 9) + 1) * 2.5);
      this.ter[k] = l === 0 && this.seaDist[k] <= beach ? 's' : l >= 2 ? 'm' : 'g';
      if (this.face[k]) this.coll[k] = 1;
    }
    // stairs and falls cut through the faces
    for (const r of this.rampAt) {
      const b = this.bottoms[r.L];
      for (let dx = -1; dx <= 1; dx++) for (const dy of [1, 2]) {
        const x = r.x + dx, y = b[r.x] + dy;
        this.coll[this.i(x, y)] = 0; this.ramps.push([x, y]); this.setT(x, y, 'd');
      }
    }
    this.rampSet = new Set(this.ramps.map(([x, y]) => x + ',' + y));
    for (const f of this.fallAt) {
      const b = this.bottoms[f.L], tiles = [];
      for (let dx = 0; dx <= 1; dx++) for (const dy of [1, 2]) { const x = f.x + dx, y = b[f.x] + dy; this.setT(x, y, 'W'); this.coll[this.i(x, y)] = 1; this.occ[this.i(x, y)] = 1; tiles.push([x, y]); }
      this.waterfalls.push({ tiles, level: f.L });
    }
  }

  /* ---------------------------------------------------------------- drawing helpers */
  /* a smooth wobbly line through points (Catmull-Rom), every half tile */
  curve(pts, wobble = 0, seed = 0) {
    const out = [], nw = noise(this.seed + 900 + seed);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), steps = Math.max(2, Math.ceil(len * 2));
      for (let s = 0; s < steps; s++) {
        const t = s / steps, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        let x = f(p0[0], p1[0], p2[0], p3[0]), y = f(p0[1], p1[1], p2[1], p3[1]);
        if (wobble) {
          // pushed sideways by a little noise, fading out at the ends (so paths still meet where they should)
          const dx = p2[0] - p1[0], dy = p2[1] - p1[1], l = Math.hypot(dx, dy) || 1;
          const fade = Math.min(1, (i === 0 ? t * 3 : 1), (i === pts.length - 2 ? (1 - t) * 3 : 1));
          const w = nw(out.length / 18, seed) * wobble * fade;
          x += -dy / l * w; y += dx / l * w;
        }
        out.push([x, y]);
      }
    }
    out.push(pts[pts.length - 1].slice());
    return out;
  }
  /* every tile within width/2 of a line: fn(x, y) once each */
  stroke(line, width, fn) {
    const r = width / 2, seen = new Set();
    for (const [px, py] of line) {
      for (let y = Math.floor(py - r); y <= Math.ceil(py + r); y++) for (let x = Math.floor(px - r); x <= Math.ceil(px + r); x++) {
        if ((x + 0.5 - px) ** 2 + (y + 0.5 - py) ** 2 > r * r + 0.01) continue;
        const k = x + ',' + y;
        if (seen.has(k) || !this.in(x, y)) continue;
        seen.add(k); fn(x, y);
      }
    }
    return seen;
  }
  /* a path, a trail or a street (kind p, d or c): laid on open ground, up a cliff only by its stairs; where it meets
     the river a bridge is built afterwards */
  path(pts, width = 2, kind = 'p', wobble = 1.5, seed = 0) {
    const line = this.curve(pts, wobble, seed);
    this.strokes.push({ line, width, kind });
    let wet = null;
    this.stroke(line, width, (x, y) => {
      const k = this.i(x, y), t = this.ter[k];
      if (!this.land[k] || this.face[k] && !this.rampSet.has(x + ',' + y)) return;
      if (t === 'r' || t === 'o') { if (!wet) { wet = [x, y]; this.crossings.push({ x, y }); } return; }
      if ('WFbhxw'.includes(t) || (t === 'c' && kind !== 'c') || this.occ[k] === 1) return;
      if (t === 'd' && kind === 'p') return;
      if (t !== 'p' && t !== 'd' && t !== 'c') this.under[k] = t;
      this.ter[k] = kind;
      if (this.occ[k] === 3) this.occ[k] = 0;
    });
    return line;
  }
  /* a round shape of some kind of ground (ponds, the plaza) */
  blob(kind, cx, cy, rx, ry) {
    const seed = this.seed + Math.round(cx * 7 + cy * 13);
    this.shapes.push({ kind, cx, cy, rx, ry, seed });
    const n = noise(seed);
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy + (kind === 'o' ? n(x / 2, y / 2) * 0.22 : 0) >= 1 || !this.isLand(x, y)) continue;
      const k = this.i(x, y);
      if (this.ter[k] !== 'c' && this.ter[k] !== 'o') this.under[k] = this.ter[k];
      this.ter[k] = kind;
      if (kind === 'o') { this.coll[k] = 1; this.occ[k] = 1; }
    }
  }
  /* a piece of the first island, ground and all (its picture is copied by the painter) */
  copyBlock(sx, sy, w, h, x, y) {
    this.blocks.push({ sx, sy, w, h, x, y });
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const k = this.i(x + i, y + j);
      this.ter[k] = SRC.grid[sy + j][sx + i]; this.coll[k] = SRC.coll[sy + j][sx + i] === '1' ? 1 : 0; this.occ[k] = this.coll[k] ? 1 : this.occ[k];
    }
  }
  zoneRect(x0, y0, x1, y1, z) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (this.in(x, y)) this.zone[this.i(x, y)] = z; }
  /* the topmost tile of some kind in a column, at or below a row (where a street is, under a door) */
  firstBelow(x, y, kinds, max = 12) { for (let d = 0; d <= max; d++) if (kinds.includes(this.T(x, y + d))) return y + d; return -1; }

  /* ---------------------------------------------------------------- buildings and props */
  building(id, x, y, w, h, door, sprite, front) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const k = this.i(x + i, y + j); this.occ[k] = 1; if (this.ter[k] !== 's') this.ter[k] = 'g'; }
    this.buildings[id] = { x, y, w, h, door, sprite };
    // a bit of room above and around it
    for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) { const k = this.i(x + i, y + j); if (!this.occ[k]) this.occ[k] = 2; }
    if (front) this.spots[front] = { x: x + door, y: y + h + 1, r: 1 };
    return this.buildings[id];
  }
  /* the path from a door (on the building's bottom row) down to the road below it */
  doorPath(id, kind, kinds) {
    const b = this.buildings[id], x = b.x + b.door, wide = b.w >= 4 ? 1 : 0, out = [];
    const toY = this.firstBelow(x, b.y + b.h, kinds || [kind]);
    const end = toY < 0 ? b.y + b.h + 1 : toY - 1;
    for (let y = b.y + b.h; y <= end; y++) for (const dx of [0, wide]) {
      const k = this.i(x + dx, y);
      if (this.ter[k] !== kind) { if (!'pdc'.includes(this.ter[k])) this.under[k] = this.ter[k]; this.ter[k] = kind; }
      if (this.occ[k] !== 1) this.occ[k] = 0;
      out.push([x + dx, y]);
    }
    this.strokes.push({ line: [[x + 0.5 + wide * 0.5, b.y + b.h - 0.3], [x + 0.5 + wide * 0.5, end + 1.2]], width: wide ? 2 : 1.7, kind });
    this.stubs[id] = kind === 'c' ? [] : out;
  }
  prop(kind, x, y, extra) {
    const p = Object.assign({ kind, x, y }, extra || {});
    this.props.push(p);
    const w = (extra && extra.w) || PROP_W[kind] || 1, rows = PROP_ROWS[kind] || 1;
    for (let j = 0; j < rows; j++) for (let i = 0; i < w; i++) this.occ[this.i(x + i, y - j)] = 1;
    return p;
  }
  /* a prop if there's room for it */
  maybe(kind, x, y, extra) {
    const w = (extra && extra.w) || PROP_W[kind] || 1, rows = PROP_ROWS[kind] || 1;
    for (let j = 0; j < rows; j++) for (let i = 0; i < w; i++) if (!this.free(x + i, y - j)) return null;
    return this.prop(kind, x, y, extra);
  }
  /* a building on the north side of a street, door onto it: `x` its left column, the street found under the door */
  onStreet(id, x, w, h, door, sprite, front, fromY, streetKinds = 'c') {
    const y0 = this.firstBelow(x + door, fromY, streetKinds, 60);
    if (y0 < 0) throw new Error('no street under ' + id);
    // the street's top edge under the whole front, so no corner of the building sits on it
    let top = y0;
    for (let i = 0; i < w; i++) { const t = this.firstBelow(x + i, y0 - 6, streetKinds, 12); if (t >= 0) top = Math.min(top, t); }
    this.building(id, x, top - h - 1, w, h, door, sprite, front);
    this.doorPath(id, streetKinds[0], streetKinds);
    return this.buildings[id];
  }

  /* ---------------------------------------------------------------- the town */
  town() {
    const px = 128, coast = this.coastY(px, true);
    this.pier = { x0: px, x1: px + 1, y0: coast - 1, y1: coast + 18 };
    // the plaza: round, stone, the big tree in the middle
    this.plazaC = { x: 128.5, y: 164, rx: 11, ry: 7 };
    this.blob('c', this.plazaC.x, this.plazaC.y, this.plazaC.rx, this.plazaC.ry);
    this.bigTree = { x: 128, y: 162 };
    // the streets, curving gently: Main Street along the coast, Market Row above the plaza, and between them
    this.main = this.path([[88, 187], [104, 183], [118, 180], [128, 179.5], [140, 180], [156, 183], [170, 188]], 3, 'c', 0, 1);
    this.market = this.path([[98, 151], [110, 148], [122, 147], [128, 147], [138, 146.5], [150, 148], [162, 152]], 3, 'c', 0, 2);
    this.path([[128.5, 149], [128.5, 158]], 3, 'c', 0, 3);
    this.path([[128.5, 170], [128.5, 180]], 3, 'c', 0, 4);
    this.path([[128.5, 181], [128.5, coast]], 2, 'c', 0, 5);
    // the statue's little square, west of the plaza
    this.statueC = { x: 109, y: 166 };
    this.blob('c', 109, 166, 5.5, 4.5);
    this.path([[114, 165.5], [118, 165]], 2, 'c', 0, 6);
    this.statue = { x: 108, y: 164, w: 3, h: 2 };
    this.prop('statue_david', 108, 164);
    this.prop('plaque', 109, 167);
    this.zoneRect(96, 142, 166, 192, 'town');
    // shops on the north side of the streets
    this.onStreet('shop', 103, 5, 3, 2, 'shop', 'shopfront', 130);
    this.onStreet('boutique', 110, 4, 3, 2, 'boutique', 'boutiquefront', 130);
    this.onStreet('salon', 134, 4, 3, 2, 'salon', 'salonfront', 130);
    this.onStreet('studio', 141, 5, 3, 2, 'studio', 'studiofront', 130);
    this.onStreet('displays', 149, 5, 3, 2, 'displays', 'displaysfront', 130);
    this.onStreet('museum', 96, 7, 4, 3, 'museum', 'museumfront', 160);
    this.onStreet('builder', 146, 5, 3, 2, 'builder', 'builderfront', 160);
    // a plot kept for a café on Main Street (the new vendors come later)
    this.lots.cafe = this.lot(156, 5, 3);
  }
  /* room kept on a street for a building to come */
  lot(x, w, h) {
    const y0 = this.firstBelow(x + 2, 150, 'c', 60);
    if (y0 < 0) return null;
    const r = { x, y: y0 - h - 1, w, h };
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.occ[this.i(x + i, r.y + j)] = 2;
    return r;
  }

  /* ---------------------------------------------------------------- the neighborhood */
  neighborhood() {
    const R = rng(this.seed + 60);
    this.hub = [64, 144];
    const lanes = [
      [[98, 168], [88, 162], [76, 154], [64, 144]],                         // from the town
      [[64, 144], [58, 134], [53, 122], [52, 112]],                         // north, to the farm lane
      [[64, 144], [53, 151], [42, 160], [34, 171], [30, 182]],               // south-west, to the beach
      [[64, 144], [74, 135], [82, 124], [90, 113]],                         // north-east, into the forest
      [[58, 134], [45, 131], [34, 126], [27, 117]],                         // west
      [[53, 151], [61, 162], [69, 172], [76, 184]],                         // south, to the beach
      [[42, 160], [32, 152], [24, 148]],                                    // a dead end in the west
    ];
    this.lanes = lanes.map((l, i) => this.path(l, 2, 'p', 2.4, 10 + i));
    for (const l of this.lanes) for (const [x, y] of l) this.zone[this.i(Math.round(x), Math.round(y))] = 'home';
    this.zoneRect(26, 118, 96, 176, 'home');
    // the pond
    this.pondAt = { x: 84, y: 141 };
    this.blob('o', 84, 141, 5, 3);
    // houses along the lanes, north of them (doors face south), not too neat: jittered, with varied gaps
    const order = ['home', 'h_coco', 'h_cece', 'h_chili', 'h_clementine', 'h_sully', 'h_maki', 'h_brulee', 'h_mac', 'h_basil', 'h_joe', 'h_ginger'];
    const cands = [];
    this.lanes.forEach((l) => {
      for (let s = 4; s < l.length - 4; s += 3) {
        const [lx, ly] = l[s];
        for (let gap = 1; gap <= 3; gap++) for (const shift of [0, -2, 2, -4, 4]) cands.push({ x0: Math.round(lx) + shift, gap, ly: Math.round(ly), r: R() });
      }
    });
    cands.sort((p, q) => p.r - q.r);
    const placed = [];
    for (const id of order) {
      const big = id === 'home', w = big ? 4 : 3, h = 3, door = big ? 2 : 1;
      let ok = null;
      for (const c of cands) {
        const x = c.x0 - door, y = c.ly - 1 - c.gap - h;
        if (!this.fits(x - 1, y - 2, w + 2, h + 1 + c.gap)) continue;
        const ly = this.firstBelow(x + door, y + h, 'p', 4);
        if (ly < 0) continue;
        if (placed.some(p => Math.abs(p.x - x) < w + 4 && Math.abs(p.y - y) < h + 4)) continue;
        if (big && Math.hypot(x - this.hub[0], y - this.hub[1]) > 16) continue;
        ok = { x, y };
        break;
      }
      if (!ok) throw new Error('no room for ' + id);
      placed.push(ok);
      this.building(id, ok.x, ok.y, w, h, door, big ? 'house_sarah' : 'house_' + id.slice(2));
      this.doorPath(id, 'p');
      if (big) this.prop('mailbox', ok.x + w, ok.y + h);
    }
    // Sarah's garden: six plots beside the house
    const hm = this.buildings.home;
    let gx = hm.x + hm.w + 2;
    if (!this.fits(gx, hm.y, 6, 4)) gx = hm.x - 7;
    for (const [dx, dy] of [[0, 0], [2, 0], [4, 0], [0, 2], [2, 2], [4, 2]]) { this.plots.push({ x: gx + dx, y: hm.y + dy }); this.occ[this.i(gx + dx, hm.y + dy)] = 1; }
    this.spots.garden = { x: gx + 2, y: hm.y + 4, r: 2 };
    this.spots.village = { x: this.hub[0], y: this.hub[1], r: 3 };
  }
  fits(x, y, w, h) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const k = this.i(x + i, y + j);
      if (!this.isLand(x + i, y + j) || this.occ[k] || this.face[k] || this.lvl[k] !== this.L(x, y + h - 1) || !'gs'.includes(this.ter[k])) return false;
    }
    return true;
  }

  /* ---------------------------------------------------------------- the farm */
  farm() {
    this.zoneRect(16, 16, 88, 60, 'farm');
    // fields, copied from the first island's (each its crop)
    const src = [{ x: 26, y: 9, w: 8, h: 4, crop: 'wheat' }, { x: 35, y: 8, w: 9, h: 5, crop: 'cabbage' }, { x: 13, y: 20, w: 7, h: 7, crop: 'corn' }, { x: 36, y: 34, w: 9, h: 4, crop: 'pumpkin' }, { x: 51, y: 16, w: 7, h: 5, crop: 'sunflower' }];
    // the barn and the windmill first, then each field on open ground near where it's wanted (two tiles to spare round it)
    const room = (x, y, w, h, m) => { for (let j = -m; j < h + m; j++) for (let i = -m; i < w + m; i++) { const k = this.i(x + i, y + j); if (!this.isLand(x + i, y + j) || this.lvl[k] !== 1 || this.face[k] || this.occ[k] || this.ter[k] !== 'g' || this.seaDist[k] < 3) return false; } return true; };
    const near = (x, y, w, h) => { for (let d = 0; d < 24; d++) for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== d) continue; if (room(x + dx, y + dy, w, h, 2)) return [x + dx, y + dy]; } return null; };
    const [bx, by] = near(46, 26, 5, 3) || [46, 26];
    this.building('barn', bx, by, 5, 3, 2, 'barn');
    const [wx, wy] = near(74, 26, 3, 3) || [74, 26];
    this.windmill = { x: wx, y: wy + 1, w: 3, h: 2, door: 1 };
    this.prop('windmill', wx, wy + 1);
    for (let j = 0; j < 3; j++) for (let i = -1; i <= 3; i++) this.occ[this.i(wx + i, wy + j)] = 1;
    const want = [[30, 34], [38, 30], [60, 30], [30, 44], [62, 42]];
    src.forEach((f, i) => {
      const at = near(want[i][0], want[i][1], f.w, f.h + 1);
      if (!at) return;
      const [x, y] = at;
      this.copyBlock(f.x, f.y, f.w, f.h, x, y);
      for (let j = 0; j < f.h; j++) for (let k = 0; k < f.w; k++) this.occ[this.i(x + k, y + j)] = 1;
      this.fields.push({ x, y, w: f.w, h: f.h, crop: f.crop });
      this.prop('fence', x, y + f.h, { w: f.w });
    });
    this.goatpen = { x: 30, y: 52, w: 8, h: 6 };
    const gp = this.goatpen;
    this.prop('fence', gp.x, gp.y, { w: gp.w });
    this.prop('fence', gp.x, gp.y + gp.h - 1, { w: 3 }); this.prop('fence', gp.x + gp.w - 3, gp.y + gp.h - 1, { w: 3 });
    for (let j = 1; j < gp.h - 1; j++) { this.prop('fence', gp.x, gp.y + j, { w: 1 }); this.prop('fence', gp.x + gp.w - 1, gp.y + j, { w: 1 }); }
    for (let j = 1; j < gp.h - 1; j++) for (let i = 1; i < gp.w - 1; i++) this.occ[this.i(gp.x + i, gp.y + j)] = 2;
    this.prop('trough', gp.x + 2, gp.y + 2);
    // the farm's roads: from the farm lane's stairs past the barn, the windmill and the pen
    const b1 = this.bottoms[1];
    this.path([[52, b1[52] - 1], [50, 74], [47, 62], [46, 50], [47, 38], [48, 30]], 2, 'p', 1.6, 21);
    this.path([[47, 40], [58, 39], [70, 38], [75, 30]], 2, 'p', 1.3, 22);
    this.path([[46, 50], [38, 52], [34, 58]], 2, 'p', 1, 23);
    this.doorPath('barn', 'p');
    for (const [k, x, y] of [['scarecrow', 28, 38], ['scarecrow', 65, 35], ['hay', 54, 29], ['hay', 55, 30], ['hay', 42, 29], ['well', 53, 41], ['crate', 44, 31], ['crate', 57, 36], ['wheelbarrow', 67, 40], ['hay', 72, 33]]) this.maybe(k, x, y);
    this.maybe('sign_farm', 49, 64);
    // a plot kept for the garden center
    this.lots.garden = { x: 54, y: 48, w: 5, h: 3 };
    for (let j = 0; j < 3; j++) for (let i = 0; i < 5; i++) this.occ[this.i(54 + i, 48 + j)] = 2;
    this.spots.farm = { x: 47, y: 39, r: 3 };
    this.spots.goatpen = { x: gp.x + 4, y: gp.y + 3, r: 2 };
    this.prop('bench', 40, 41);
    this.spots.bench_farm = { x: 41, y: 41, r: 1 };
  }

  /* ---------------------------------------------------------------- the mountain */
  mountain() {
    const R = rng(this.seed + 90);
    // the lake on the fifth terrace, the river falling from it terrace by terrace
    const b5 = this.bottoms[5], rx = this.riverX;
    const lake = { x: rx - 3, y: b5[rx] - 8, w: 8, h: 5 };
    this.blob('o', lake.x + 4.5, lake.y + 2.5, 4.5, 2.6);
    this.lake = lake;
    const water = (x, y) => { const k = this.i(x, y); if (this.ter[k] === 'W' || !this.land[k]) return; this.ter[k] = 'r'; this.coll[k] = 1; this.occ[k] = 1; };
    let y0 = lake.y + lake.h - 1;
    for (let L = 5; L >= 2; L--) {
      const b = this.bottoms[L][rx];
      for (let y = y0; y <= b; y++) { water(rx, y); water(rx + 1, y); }
      y0 = b + 3;
    }
    // across the uplands to their fall, then through the low ground to the sea east of the town
    const f1 = this.fallAt.find(f => f.L === 1), b1 = this.bottoms[1][f1.x];
    const up = this.curve([[rx + 1, y0 - 0.5], [rx - 4, y0 + 4], [f1.x + 6, b1 - 7], [f1.x + 1, b1 - 2], [f1.x + 1, b1 + 0.5]], 1.5, 3);
    this.stroke(up, 2.2, (x, y) => { const k = this.i(x, y); if (this.lvl[k] === 1 && !this.face[k]) water(x, y); });
    this.strokes.push({ line: up, width: 2.2, kind: 'r' });
    const sx = 192, seaY = this.coastY(sx, true);
    this.riverLine = this.curve([[f1.x + 1, b1 + 2.5], [f1.x - 3, b1 + 14], [200, 140], [194, 164], [sx, seaY + 2]], 3, 4);
    this.stroke(this.riverLine, 3, (x, y) => { const k = this.i(x, y); if (this.land[k] && this.lvl[k] === 0 && !this.face[k]) water(x, y); });
    this.strokes.push({ line: this.riverLine, width: 3, kind: 'r' });
    // the trail: stairs up each terrace, and between them a path winding across the terrace
    const tr = this.trail;
    const foot = (t) => [t.x, this.bottoms[t.L][t.x] + 3.5];
    const top = (t) => [t.x, this.bottoms[t.L][t.x] - 0.5];
    this.trailhead = [tr[0].x - 8, this.bottoms[1][tr[0].x - 8] - 7];
    this.path([this.trailhead, [tr[0].x - 3, foot(tr[0])[1] + 2], foot(tr[0])], 2, 'd', 1, 40);
    for (let i = 0; i < tr.length; i++) {
      const t = tr[i];
      this.path([foot(t), [t.x, this.bottoms[t.L][t.x] + 1.5], top(t)], 2, 'd', 0, 41 + i);
      if (i + 1 < tr.length) {
        const n = tr[i + 1], a = top(t), b = foot(n);
        const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + R.int(-1, 2)];
        this.path([a, [a[0], a[1] - 2], [a[0] + (b[0] - a[0]) * 0.3, mid[1] - 2], mid, [b[0] - (b[0] - a[0]) * 0.25, mid[1] + 2], [b[0], b[1] + 2], b], 2, 'd', 2.2, 50 + i);
      }
    }
    // the summit: a lookout with the telescope at its north edge, looking out to sea
    const last = top(tr[tr.length - 1]);
    let sumY = Math.round(last[1] - 9);
    while (!this.isLand(last[0], sumY - 2)) sumY++;
    this.path([last, [last[0] + 3, last[1] - 4], [last[0] + 1, sumY + 2]], 2, 'd', 1, 60);
    this.prop('telescope', last[0] + 1, sumY);
    this.prop('bench', last[0] - 4, sumY + 1);
    this.spots.lookout = { x: last[0] + 1, y: sumY + 2, r: 2 };
    this.spots.bench_lookout = { x: last[0] - 3, y: sumY + 2, r: 1 };
    this.spots.summit = { x: last[0], y: sumY + 4, r: 2 };
    const m3 = tr[1].x - 12;
    this.spots.mountain = { x: m3, y: this.bottoms[3][m3] - 4, r: 3 };
    // gems hide high up: on the top three terraces, off the trail
    for (let tries = 0; tries < 800 && this.gemSpots.length < 14; tries++) {
      const x = R.int(176, 262), y = R.int(12, 84), k = this.i(x, y);
      if (!this.isLand(x, y) || this.lvl[k] < 4 || this.face[k] || this.ter[k] !== 'm' || this.occ[k]) continue;
      if (this.gemSpots.some(([gx, gy]) => Math.abs(gx - x) + Math.abs(gy - y) < 5)) continue;
      this.gemSpots.push([x, y]);
    }
    // the hot spring at the mountain's foot, copied whole from the first island (rim, water and all)
    const hs = { sx: 141, sy: 49, w: 10, h: 7 };
    const hx = 234, hy = this.bottoms[2][hx + 5] + 4;
    this.spring = { x: hx, y: hy };
    this.copyBlock(hs.sx, hs.sy, hs.w, hs.h, hx, hy);
    this.wonton = [hx + (146 - hs.sx), hy + (52.9 - hs.sy)];
    this.spots.spring = { x: hx + 5, y: hy + 8, r: 1 };
    this.zoneRect(hx - 2, hy - 2, hx + hs.w + 2, hy + hs.h + 2, 'spring');
    // plots kept for a trail outfitter at the trailhead and a house near the mountain
    this.lots.outfitter = { x: this.trailhead[0] - 9, y: this.trailhead[1] - 4, w: 5, h: 3 };
    this.lots.mountainHouse = { x: hx - 9, y: hy + 1, w: 3, h: 3 };
    for (const l of [this.lots.outfitter, this.lots.mountainHouse]) for (let j = -1; j <= l.h; j++) for (let i = -1; i <= l.w; i++) if (this.in(l.x + i, l.y + j) && !this.occ[this.i(l.x + i, l.y + j)]) this.occ[this.i(l.x + i, l.y + j)] = 2;
  }

  /* ---------------------------------------------------------------- the forest */
  forest() {
    const R = rng(this.seed + 80);
    const nf = noise(this.seed + 81);
    // all round the neighborhood: west, north and east of it, and north up onto the uplands as far as the farm
    const inForest = (x, y) => {
      if (!this.isLand(x, y)) return false;
      const k = this.i(x, y);
      if (this.zone[k] === 'farm' || this.zone[k] === 'town' || this.zone[k] === 'spring' || this.lvl[k] > 1 || this.ter[k] === 's') return false;
      const wob = nf(x / 12, y / 12) * 0.18;
      const ox = (x - 62) / 58, oy = (y - 126) / 66;
      const nx = (x - 62) / 36, ny = (y - 147) / 29;
      return ox * ox + oy * oy < 1 + wob && nx * nx + ny * ny > 1 + wob && y > 62;
    };
    this.inForest = inForest;
    // the maze: cells about 8 tiles apart, jittered; a random spanning tree of them plus a few loops; each trail bends
    const C = 8, cells = [], at = new Map();
    for (let cy = 0; cy * C < H; cy++) for (let cx = 0; cx * C < W; cx++) {
      const x = cx * C + 4 + R.int(-2, 2), y = cy * C + 4 + R.int(-2, 2);
      if (!inForest(x, y) || this.face[this.i(x, y)] || this.occ[this.i(x, y)] || this.ter[this.i(x, y)] !== 'g') continue;
      const c = { cx, cy, x, y, l: this.lvl[this.i(x, y)], id: cells.length };
      cells.push(c); at.set(cx + ',' + cy, c);
    }
    const edges = [];
    for (const c of cells) for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [-1, 1]]) {
      const d = at.get((c.cx + dx) + ',' + (c.cy + dy));
      if (!d || c.l !== d.l) continue;           // between levels only by the planned stairs (below)
      edges.push({ a: c, b: d, w: R() + (dx && dy ? 0.35 : 0) });
    }
    edges.sort((p, q) => p.w - q.w);
    const parent = cells.map((_, i) => i), find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    const used = [];
    for (const e of edges) { const a = find(e.a.id), b = find(e.b.id); if (a !== b) { parent[a] = b; used.push(e); } else if (R() < 0.07) used.push(e); }
    for (const e of used) {
      const mx = (e.a.x + e.b.x) / 2, my = (e.a.y + e.b.y) / 2, dx = e.b.x - e.a.x, dy = e.b.y - e.a.y, l = Math.hypot(dx, dy) || 1, o = R.range(-2.5, 2.5);
      this.path([[e.a.x, e.a.y], [mx - dy / l * o, my + dx / l * o], [e.b.x, e.b.y]], 2, 'd', 0.6, 100 + (e.a.id % 50));
    }
    // the stairs between the low forest and the upper forest, tied into the nearest cells
    const nearest = (x, y, lv) => { let best = null, bd = 1e9; for (const c of cells) if (c.l === lv) { const d = Math.hypot(c.x - x, c.y - y); if (d < bd) { bd = d; best = c; } } return bd < 22 ? best : null; };
    for (const r of this.rampAt.filter(r => r.L === 1 && (r.x === 32 || r.x === 92))) {
      const b = this.bottoms[1][r.x];
      this.path([[r.x, b + 6], [r.x, b + 2], [r.x, b - 3]], 2, 'd', 0, 30 + r.x);
      const lo = nearest(r.x, b + 6, 0), hi = nearest(r.x, b - 3, 1);
      if (lo) this.path([[r.x, b + 6], [lo.x, lo.y]], 2, 'd', 0.8, 31 + r.x);
      if (hi) this.path([[r.x, b - 3], [hi.x, hi.y]], 2, 'd', 0.8, 32 + r.x);
    }
    // ways in: from the neighborhood's lanes, the farm lane and the meadow
    for (const [x, y] of [this.lanes[3][this.lanes[3].length - 1], this.lanes[4][this.lanes[4].length - 1], [52, this.bottoms[1][52] - 6], [104, 92]]) {
      const lv = this.lvl[this.i(Math.round(x), Math.round(y))], c = nearest(x, y, lv);
      if (c) this.path([[x, y], [c.x, c.y]], 2, 'd', 1, 34 + Math.round(x));
    }
    // clearings: the campsite, the picnic spot, the old giants, hidden glades
    this.clear = new Set();
    const open = (x, y, r) => { for (let yy = y - r; yy <= y + r; yy++) for (let xx = x - r; xx <= x + r; xx++) if ((xx - x) ** 2 + (yy - y) ** 2 <= r * r && this.isLand(xx, yy)) this.clear.add(this.i(xx, yy)); };
    const far = (c) => Math.hypot(c.x - this.hub[0], c.y - this.hub[1]);
    const pick = (lv, deep) => {
      const cs = cells.filter(c => c.l === lv && !c.taken && cells.every(o => !o.taken || Math.hypot(o.x - c.x, o.y - c.y) > 12));
      if (!cs.length) return null;
      cs.sort((a, b) => far(b) - far(a));
      const c = deep ? cs[R.int(0, Math.min(4, cs.length - 1))] : cs[R.int(0, cs.length - 1)];
      c.taken = true; return c;
    };
    const camp = pick(1, true);
    open(camp.x, camp.y, 6);
    this.camp = { x: camp.x, y: camp.y };
    [[camp.x - 5, camp.y - 3], [camp.x + 2, camp.y - 4], [camp.x + 3, camp.y + 2]].forEach(([x, y], i) => this.prop('tent', x, y, { tent: i }));
    this.prop('campfire', camp.x - 1, camp.y + 1);
    this.prop('picnic', camp.x - 6, camp.y + 3);
    if (!this.maybe('sign_camp', camp.x + 1, camp.y + 6)) this.prop('sign_camp', camp.x, camp.y + 5);
    this.spots.campsite = { x: camp.x, y: camp.y + 3, r: 3 };
    const pic = pick(0, false);
    open(pic.x, pic.y, 4);
    this.prop('picnic', pic.x - 1, pic.y);
    this.spots.picnic_forest = { x: pic.x, y: pic.y + 1, r: 1 };
    this.spots.forest = { x: pic.x + 1, y: pic.y + 2, r: 3 };
    for (let i = 0; i < 9; i++) {
      const c = pick(i % 3 === 0 ? 0 : 1, i < 4);
      if (!c) break;
      open(c.x, c.y, 4);
      this.oldTrees.push({ x: c.x - 1, y: c.y - 2, v: i % 3 });
      for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) this.occ[this.i(c.x - 1 + k, c.y - 2 + j)] = 1;
      if (i === 0) this.spots.oldtree = { x: c.x, y: c.y + 1, r: 2 };
    }
    this.glades = [];
    for (let i = 0; i < 6; i++) { const c = pick(i % 2, true); if (!c) break; open(c.x, c.y, 3); this.glades.push({ x: c.x, y: c.y }); }
    this.forestCells = cells;
  }

  /* ---------------------------------------------------------------- the coast: the boardwalk, the lighthouse, Kai's */
  coast() {
    // the boardwalk east of the pier, along the top of the beach, with the diner, the arcade and the club on it
    const by = this.coastY(158, true) - 8;
    for (let x = 140; x <= 182; x++) for (const dy of [0, 1]) { const k = this.i(x, by + dy); if (this.isLand(x, by + dy) && this.ter[k] !== 'r') { this.ter[k] = 'b'; this.coll[k] = 0; } }
    this.boardwalkY = by;
    const BB = (id, x, w, door, sprite, front) => { this.building(id, x, by - 3, w, 3, door, sprite, front); this.stubs[id] = []; };
    BB('restaurant', 142, 5, 2, 'restaurant', 'restaurantfront');
    BB('arcade', 151, 5, 2, 'arcade', 'arcadefront');
    BB('club', 160, 6, 3, 'club', 'clubfront');
    this.prop('sign_club', 167, by - 1);
    this.spots.boardwalk = { x: 158, y: by + 1, r: 3 };
    this.prop('bench', 172, by + 2);
    this.spots.bench_boardwalk = { x: 173, y: by + 2, r: 1 };
    // a plot kept for a bait shop at the harbor, by the pier
    this.lots.bait = { x: 133, y: this.pier.y0 - 5, w: 4, h: 3 };
    // the lighthouse on the south-east point
    let lx = 0, ly = 0;
    for (let x = 252; x >= 206; x--) { const y = this.coastY(x, true); if (y > ly) { ly = y; lx = x; } }
    this.building('lighthouse', lx - 1, ly - 7, 3, 3, 1, 'lighthouse');
    this.spots.lighthousefront = { x: lx, y: ly - 3, r: 1 };
    this.lighthouseAt = [lx, ly];
    // Kai's house on the south-west beach, and a plot for a house on the west beach
    const kx = 68, ky = this.coastY(kx + 1, true) - 9;
    this.building('h_kai', kx, ky, 3, 3, 1, 'house_kai');
    this.stubs.h_kai = [];
    const wx = 40, wy = this.coastY(wx + 1, true) - 9;
    this.lots.beachHouse = { x: wx, y: wy, w: 3, h: 3 };
    for (let j = -1; j <= 3; j++) for (let i = -1; i <= 3; i++) if (!this.occ[this.i(wx + i, wy + j)]) this.occ[this.i(wx + i, wy + j)] = 2;
  }

  /* ---------------------------------------------------------------- roads between the districts */
  roads() {
    const b1 = this.bottoms[1];
    const up = (x) => [[x, b1[x] + 4], [x, b1[x] + 1.5], [x, b1[x] - 1]];
    // the town's north road: Market Row, up the uplands' stairs, on to the meadow
    this.path([[128.5, 146], [128, 132], [126.5, 118], ...up(126), [124, 80], [128, 64]], 2, 'p', 2, 70);
    // Main Street west to the neighborhood, and the farm lane up from it to the uplands
    this.path([[89, 186], [86, 176], [92, 170], [98, 168]], 2, 'p', 1.5, 71);
    this.path([[52, 112], ...up(52), [52, b1[52] - 4]], 2, 'p', 0.5, 72);
    // east: Main Street, over the river, past the orchard, up the mountain road to the trailhead
    this.path([[170, 188], [180, 178], [192, 170], [206, 162], [214, 150], [208, 136], [190, 126], ...up(180), this.trailhead], 2, 'p', 2, 73);
    // the meadow path across the uplands, to the east meadow and the trailhead, and down its own stairs to the orchard
    this.path([[128, 64], [142, 70], [152, b1[152] - 4], [166, 88], [182, 92], this.trailhead], 2, 'p', 2, 75);
    this.path([[152, b1[152] - 4], ...up(152), [156, 124], [164, 140], [160, 150]], 2, 'p', 1.5, 76);
    // to the hot spring and the lighthouse
    this.path([this.trailhead, [this.spring.x - 6, this.spring.y + 10], [this.spring.x + 5, this.spring.y + 9]], 2, 'p', 1.5, 77);
    this.path([[182, this.boardwalkY + 0.5], [200, this.boardwalkY - 1], [222, this.boardwalkY - 2], [this.lighthouseAt[0], this.lighthouseAt[1] - 3]], 2, 'p', 2, 78);
    // beach paths
    this.path([[104, 183], [98, 190], [92, 196]], 2, 'p', 1, 79);
    this.path([[30, 182], [34, 192]], 2, 'p', 1, 80);
    this.path([[76, 184], [72, 194]], 2, 'p', 1, 81);
  }

  /* ---------------------------------------------------------------- straight bridges where paths met the river */
  bridges() {
    this.bridgeTiles = [];
    for (const c of this.crossings) {
      // which way the water runs here: a bridge goes straight across it
      let hx = 0, hy = 0;
      for (let d = -3; d <= 3; d++) { if (this.T(c.x + d, c.y) === 'r') hx++; if (this.T(c.x, c.y + d) === 'r') hy++; }
      const across = hy >= hx;            // the river runs north-south: walk across east-west
      const tiles = [];
      if (across) {
        let a = c.x, b = c.x;
        while ('ro'.includes(this.T(a - 1, c.y))) a--;
        while ('ro'.includes(this.T(b + 1, c.y))) b++;
        for (let y = c.y; y <= c.y + 1; y++) for (let x = a - 1; x <= b + 1; x++) tiles.push([x, y]);
      } else {
        let a = c.y, b = c.y;
        while ('ro'.includes(this.T(c.x, a - 1))) a--;
        while ('ro'.includes(this.T(c.x, b + 1))) b++;
        for (let x = c.x; x <= c.x + 1; x++) for (let y = a - 1; y <= b + 1; y++) tiles.push([x, y]);
      }
      if (tiles.some(([x, y]) => this.face[this.i(x, y)] || this.T(x, y) === 'W')) continue;
      for (const [x, y] of tiles) { const k = this.i(x, y); if (this.ter[k] !== 'r' && this.ter[k] !== 'o' && !this.under[k]) this.under[k] = this.ter[k]; this.ter[k] = 'w'; this.coll[k] = 0; this.occ[k] = 1; this.bridgeTiles.push([x, y]); }
    }
    const L = this.riverLine, mid = L[Math.floor(L.length * 0.55)];
    this.spots.river = { x: Math.round(mid[0]) - 3, y: Math.round(mid[1]), r: 2 };
    let br = null;
    for (const [x, y] of this.bridgeTiles) if (this.lvl[this.i(x, y)] === 0 && (!br || y < br[1])) br = [x, y];
    if (br) this.spots.bridge = { x: br[0], y: br[1], r: 0 };
    const f1 = this.fallAt.find(f => f.L === 1);
    this.spots.waterfall = { x: f1.x - 3, y: this.bottoms[1][f1.x] + 5, r: 2 };
    this.maybe('bench', f1.x - 6, this.bottoms[1][f1.x] + 4);
    this.spots.bench_falls = { x: f1.x - 5, y: this.bottoms[1][f1.x] + 4, r: 1 };
  }

  /* ---------------------------------------------------------------- trees, flowers */
  greenery() {
    const R = rng(this.seed + 100), nf = fbm(this.seed + 101, 20, 3);
    this.treeAt = new Set();
    const nearPath = (x, y, r) => { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if ('pdcbw'.includes(this.T(x + i, y + j))) return true; return false; };
    const tree = (x, y, kind) => {
      const k = this.i(x, y);
      if (!this.free(x, y) || this.clear.has(k)) return false;
      for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (this.treeAt.has(this.i(x + i, y + j)) && Math.abs(i) + Math.abs(j) < 3) return false;
      this.trees.push({ x, y, kind }); this.treeAt.add(k); this.occ[k] = 1;
      return true;
    };
    for (let y = 8; y < H - 8; y++) for (let x = 8; x < W - 8; x++) {
      const k = this.i(x, y);
      if (!this.land[k] || this.ter[k] === 's') continue;
      const z = this.zone[k], f = this.inForest(x, y), l = this.lvl[k], dens = nf(x, y);
      let p;
      if (f) p = 0.46 + dens * 0.3;
      else if (z === 'town' || z === 'farm' || z === 'spring') p = 0.006;
      else if (l >= 2) p = 0.03 + Math.max(0, dens) * 0.08;
      else p = 0.03 + Math.max(0, dens) * 0.14;
      if (nearPath(x, y, 1) && !f) p *= 0.3;
      if (R() < p) tree(x, y, l >= 2 ? (R() < 0.8 ? 'pine' : 'oak') : f ? (R() < (l ? 0.45 : 0.2) ? 'pine' : R() < 0.06 ? 'blossom' : 'oak') : R() < 0.22 ? 'blossom' : R() < 0.15 ? 'pine' : 'oak');
    }
    // the orchard: fruit trees in loose rows east of the town, by the river
    const fruits = ['peach', 'cherry', 'mango', 'lychee', 'apple'];
    for (let row = 0; row < 5; row++) for (let col = 0; col < 7; col++) {
      const x = 164 + col * 4 + (row % 2) * 2, y = 126 + row * 4;
      if (this.fruitTrees.length >= 30 || !this.free(x, y)) continue;
      this.fruitTrees.push({ x, y, fruit: fruits[(row * 7 + col) % 5] }); this.occ[this.i(x, y)] = 1;
    }
    this.spots.orchard = { x: 175, y: 136, r: 3 };
    // palms along the beaches
    for (let x = 14; x < W - 14; x++) {
      const y = this.coastY(x, true) - 3 - R.int(0, 2);
      if (R() < 0.13 && this.T(x, y) === 's' && this.free(x, y) && !this.palms.some(p => Math.abs(p.x - x) < 5)) { this.palms.push({ x, y, coconut: R() < 0.55 }); this.occ[this.i(x, y)] = 1; }
    }
    // flowers: drifts in the meadows, along the lanes, round the houses
    const fk = ['tulip', 'daisy', 'cosmos', 'lily'];
    const nm = fbm(this.seed + 102, 9, 2);
    for (let y = 8; y < H - 8; y++) for (let x = 8; x < W - 8; x++) {
      const k = this.i(x, y);
      if (!this.free(x, y) || this.ter[k] !== 'g' || this.inForest(x, y)) continue;
      const meadow = (x > 106 && x < 160 && y > 34 && y < 92) || (x > 156 && x < 206 && y > 86 && y < 116);
      const p = meadow ? 0.05 + Math.max(0, nm(x, y)) * 0.25 : this.zone[k] === 'home' || nearPath(x, y, 2) ? 0.02 : 0.004;
      if (R() < p) { const kind = fk[Math.floor((nm(x / 2, y / 2) + 1) * 2) % 4]; this.flowers.push({ x, y, kind, color: R.int(0, 2) }); this.occ[k] = 3; }
    }
  }

  /* ---------------------------------------------------------------- props and the spots that go with them */
  furnish() {
    const R = rng(this.seed + 110);
    const P = this.plazaC;
    this.prop('board', Math.round(P.x - 6), Math.round(P.y + 4));
    this.prop('fountain', Math.round(P.x + 5), Math.round(P.y - 4));
    this.prop('bench', Math.round(P.x - 8), Math.round(P.y - 2)); this.prop('bench', Math.round(P.x + 6), Math.round(P.y + 3));
    this.spots.plaza = { x: Math.round(P.x), y: Math.round(P.y + 3), r: 4 };
    this.spots.plaza_w = { x: Math.round(P.x - 5), y: Math.round(P.y), r: 1 };
    this.spots.plaza_e = { x: Math.round(P.x + 5), y: Math.round(P.y + 1), r: 2 };
    this.spots.bench_w = { x: Math.round(P.x - 7), y: Math.round(P.y - 2), r: 1 };
    this.spots.bench_e = { x: Math.round(P.x + 7), y: Math.round(P.y + 3), r: 1 };
    this.spots.board = { x: Math.round(P.x - 5), y: Math.round(P.y + 5), r: 1 };
    const cy = Math.round(P.y + 1), cx = Math.round(P.x + 8);
    this.cart = { x: cx + 0.5, y: cy, tiles: [[cx - 1, cy], [cx, cy], [cx + 1, cy]], basil: [cx + 2.45, cy + 0.85] };
    for (const [x, y] of this.cart.tiles) this.occ[this.i(x, y)] = 1;
    this.rope = { a: [Math.round(P.x - 4), Math.round(P.y + 2)], b: [Math.round(P.x + 2), Math.round(P.y + 2)], mid: [Math.round(P.x - 1), Math.round(P.y + 2)] };
    this.spots.statue = { x: this.statueC.x + 1, y: this.statueC.y + 3, r: 2 };
    this.prop('bench', this.statueC.x - 4, this.statueC.y + 2);
    this.spots.bench_statue = { x: this.statueC.x - 3, y: this.statueC.y + 2, r: 1 };
    const mf = this.spots.museumfront;
    this.maybe('bench', mf.x - 6, mf.y);
    this.spots.bench_museum = { x: mf.x - 5, y: mf.y, r: 1 };
    this.prop('sign_island', 131, this.pier.y0 - 2);
    // lamps along the streets and lanes, trash cans, drinking fountains
    const lamp = (x, y) => this.maybe('lamp', x, y);
    for (const line of [this.main, this.market]) for (let s = 6; s < line.length; s += 16) { const [x, y] = line[s]; if (!lamp(Math.round(x), Math.round(y) - 2)) lamp(Math.round(x), Math.round(y) + 2); }
    for (const l of this.lanes) for (let s = 10; s < l.length; s += 24) { const [x, y] = l[s]; for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2]]) if (lamp(Math.round(x) + dx, Math.round(y) + dy)) break; }
    for (const [x, y] of [[117, 158], [140, 171], [99, 186], [168, 186], [125, 183]]) this.maybe('trashcan', x, y);
    for (const [x, y] of [[121, 156], [158, 156]]) this.maybe('drinkfountain', x, y);
    // the pond's bench and the beach things
    const pd = this.pondAt;
    this.maybe('bench', pd.x - 2, pd.y + 5);
    this.spots.pond = { x: pd.x, y: pd.y + 5, r: 2 };
    this.spots.bench_pond = { x: pd.x - 1, y: pd.y + 5, r: 1 };
    const beach = (x) => this.coastY(x, true) - 3;
    // the bonfire on the west beach
    const bx = 30, byy = beach(30) - 1;
    this.prop('bonfire', bx, byy); this.maybe('log', bx - 3, byy + 1); this.maybe('log', bx + 3, byy + 1); this.maybe('log', bx, byy + 3);
    this.maybe('sign_bonfire', bx + 5, byy - 2);
    this.bonfire = { x: bx, y: byy };
    this.spots.bonfire = { x: bx + 1, y: byy + 2, r: 2 };
    this.spots.beach_w = { x: 20, y: beach(20) - 1, r: 4 };
    this.spots.beach = { x: 94, y: beach(94), r: 4 };
    this.maybe('bench', 103, beach(104));
    this.spots.bench_beach = { x: 104, y: beach(104), r: 1 };
    this.spots.beach_e = { x: 180, y: beach(180) + 1, r: 3 };
    this.spots.beach_far = { x: 218, y: beach(218), r: 3 };
    this.spots.pier = { x: 129, y: this.pier.y0 + 1, r: 1 };
    this.spots.pier_end = { x: 129, y: this.pier.y1, r: 0 };
    this.spots.harbor = { x: 137, y: beach(137) - 1, r: 3 };
    // the volleyball court, the ice cream cart, a sandcastle, the tackle, the sea viewer, driftwood
    for (let vx = 196; vx < 230; vx++) { const vy = beach(vx + 3) - 4; if (this.fitsSand(vx, vy, 7, 6)) { this.prop('volleyball', vx, vy); break; } }
    for (const [k, x] of [['icecream', 186], ['sandcastle', 110], ['driftwood', 58], ['driftwood', 150], ['driftwood', 232], ['driftwood', 44]]) this.maybe(k, x, beach(x) + 1);
    this.maybe('tackle', 131, this.pier.y0 + 3);
    this.maybe('viewer', 125, this.pier.y0 - 1);
    // the meadows' benches (and a picnic blanket), the east side
    this.spots.meadow = { x: 132, y: 58, r: 4 };
    this.maybe('blanket', 137, 56);
    this.maybe('bench', 127, 62);
    this.spots.bench_meadow = { x: 128, y: 62, r: 1 };
    this.spots.eastmeadow = { x: 190, y: 98, r: 3 };
    this.maybe('bench', 185, 98);
    this.spots.bench_eastmeadow = { x: 186, y: 98, r: 1 };
    this.spots.eastside = { x: 180, y: 168, r: 3 };
    // rocks and boulders up the mountain, bushes in the low ground, birdhouses and flamingos in the neighborhood
    for (let t = 0, n = 0; t < 3000 && n < 60; t++) {
      const x = R.int(150, 262), y = R.int(12, 112);
      if (this.lvl[this.i(x, y)] < 1 || this.zone[this.i(x, y)] === 'spring') continue;
      if (this.maybe(R() < 0.25 ? 'boulder' : 'rock', x, y)) n++;
    }
    for (let t = 0, n = 0; t < 5000 && n < 70; t++) {
      const x = R.int(14, 250), y = R.int(60, 198);
      if (this.ter[this.i(x, y)] !== 'g' || this.zone[this.i(x, y)] === 'town') continue;
      if (this.maybe('bush', x, y)) n++;
    }
    for (const id of Object.keys(this.buildings).filter(k => k.startsWith('h_'))) {
      const b = this.buildings[id];
      if (R() < 0.35) this.maybe(R() < 0.5 ? 'birdhouse' : 'flamingo', b.x - 1, b.y + 2);
      if (R() < 0.3) this.maybe('flowerbed', b.x + b.w + 1, b.y + 1);
    }
  }
  /* ---------------------------------------------------------------- places to find (the map names them once found) */
  places() {
    const P = this.placesOut = [];
    // when: night, dawn, rain, snow or a season; such places can only be found then, so finding them all takes days
    // ('start': known from the start, the places Sarah arrives at and lives)
    const add = (id, name, at, r, when, note) => { if (at) P.push(Object.assign({ id, name, x: Math.round(at.x), y: Math.round(at.y), r: r || 4 }, when ? { when } : {}, note ? { note } : {})); };
    const s = this.spots, g = this.glades || [];
    const xy = (x, y) => ({ x, y });
    add('plaza', 'The Plaza', s.plaza, 6, 'start');
    add('pier', 'The Pier', s.pier, 3, 'start');
    add('statue', "David's Square", s.statue, 4);
    add('boardwalk', 'The Boardwalk', s.boardwalk, 5);
    add('harbor', 'The Harbor', s.harbor, 4);
    add('pond', 'Lily Pond', s.pond, 4);
    add('garden', 'Home', s.garden, 4, 'start');
    add('campsite', 'The Campsite', s.campsite, 6, null, 'Tents, a fire ring, and a sign about raccoons.');
    add('oldtree', 'The Old Giants', s.oldtree, 5, null, 'Trees older than anyone remembers. Nobody brings an axe here.');
    add('picnic', 'Picnic Clearing', s.picnic_forest, 4);
    const glade = [['fairyring', 'Fairy Ring', 'night', 'A ring of mushrooms, glowing softly. Sarah does not step inside. Just in case.'],
      ['mossy', 'Mossy Hollow', null, 'Soft green moss everywhere. It is very quiet here.'],
      ['whisper', 'Whispering Glade', 'dawn', 'At dawn the wind in the leaves sounds like someone almost saying your name.'],
      ['fern', 'Fern Grotto', 'rain', 'In the rain the ferns stand up tall and the whole glade smells green.'],
      ['owl', "Owl's Roost", 'night', 'Something up in the dark branches says "hoo." Sarah says "hi."'],
      ['bluebell', 'Bluebell Dell', 'spring', 'Bluebells, as far as you can see. Which is about twelve feet. Still.']];
    glade.forEach(([id, name, when, note], i) => { if (g[i]) add(id, name, g[i], 3, when, note); });
    add('farm', 'The Farm', s.farm, 6);
    add('windmill', 'Windmill Hill', xy(this.windmill.x + 1, this.windmill.y + 3), 4);
    add('goatpen', "The Goat's Pen", s.goatpen, 4);
    add('meadow', 'The Meadow', s.meadow, 7);
    add('eastmeadow', 'East Meadow', s.eastmeadow, 6);
    add('orchard', 'The Orchard', s.orchard, 6);
    add('river', 'Riverside', s.river, 4);
    add('waterfall', 'The Falls', s.waterfall, 5);
    add('spring', 'The Hot Spring', s.spring, 5);
    add('trailhead', 'The Trailhead', xy(this.trailhead[0], this.trailhead[1]), 4);
    add('cascade', 'The Cascade', xy(this.riverX - 3, this.bottoms[3][this.riverX] + 4), 4, null, 'Waterfall after waterfall, all the way down the mountain.');
    add('lake', 'Mountain Lake', xy(this.lake.x + 4, this.lake.y + this.lake.h + 2), 4, null, 'A still lake high on the mountain. The sky is in it twice.');
    add('mistyledge', 'Misty Ledge', s.mountain, 4, 'rain', 'The cloud comes right down to the path. Sarah is, briefly, in the sky.');
    const t4 = this.trail[3];
    add('eaglerock', 'Eagle Rock', xy(t4.x - 6, this.bottoms[4][t4.x - 6] - 3), 4, null, 'A big flat rock with the whole island below it.');
    add('summit', 'The Summit', s.summit, 4, null, 'The top of the island. Everything is down from here.');
    add('lookout', 'The Lookout', s.lookout, 3);
    add('snowypeak', 'Snowy Peak', s.summit, 5, 'snow', 'Snow on the summit, and not a single footprint but Sarah\'s.');
    add('lighthouse', 'Lighthouse Point', s.lighthousefront, 5);
    add('bonfire', 'Bonfire Beach', s.bonfire, 5);
    add('beach', 'Sandy Beach', s.beach, 6);
    add('fardunes', 'The Far Dunes', s.beach_far, 5);
    // the coves and the north shore: wherever there's land nearest the spot planned
    const landNear = (x, y) => { for (let d = 0; d < 20; d++) for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) { const k = this.i(x + dx, y + dy); if (this.isLand(x + dx, y + dy) && !this.coll[k] && !this.face[k]) return xy(x + dx, y + dy); } return null; };
    add('westcove', 'West Cove', landNear(20, 134), 5);
    add('eastcove', 'East Cove', landNear(252, 146), 5);
    add('moonbay', 'Moonlit Bay', landNear(140, 18), 6, 'night', 'The moon on the water, and the whole north sea quiet.');
    add('beacon', 'The Beacon', s.lighthousefront, 6, 'night', 'At night the lighthouse beam sweeps right over Sarah\'s head.');
    add('sunrise', 'Sunrise Shore', landNear(252, 120), 5, 'dawn', 'The sun comes up out of the sea right here. Worth the early alarm.');
  }
  fitsSand(x, y, w, h) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { if (this.T(x + i, y + j) !== 's' || this.occ[this.i(x + i, y + j)]) return false; } return true; }

  /* ---------------------------------------------------------------- world.json */
  output() {
    // the pier, the boat at its end and the arrival scene
    const pe = this.pier;
    for (let y = pe.y0; y <= pe.y1; y++) for (let x = pe.x0; x <= pe.x1; x++) { const k = this.i(x, y); this.ter[k] = 'w'; this.coll[k] = 0; }
    const end = pe.y1;
    const intro = { sarah: [pe.x0 + 0.6, end - 3.6], fortune: [pe.x0 + 1.1, end - 5.4], joe: [pe.x0 + 1.8, end - 3.5], start: [pe.x0 + 0.6, end - 6.5] };
    // collision for everything solid on the ground
    for (let k = 0; k < W * H; k++) {
      const t = this.ter[k];
      if ('~orhxWF'.includes(t)) this.coll[k] = 1;
      if (t === 'b' || t === 'w') this.coll[k] = 0;
    }
    for (const [x, y] of this.ramps) this.coll[this.i(x, y)] = 0;
    const reach = this.flood(this.i(Math.floor(intro.start[0]), Math.floor(intro.start[1])), (k) => !this.coll[k] && (this.land[k] || this.ter[k] === 'w'));
    const rows = (f) => { const out = []; for (let y = 0; y < H; y++) { let s = ''; for (let x = 0; x < W; x++) s += f(this.i(x, y)); out.push(s); } return out; };
    const water = (t) => (t === '~' ? 's' : t === 'o' ? 'p' : t === 'r' ? 'r' : t === 'h' ? 'h' : '.');
    const p = this.palms.find(q => q.x > 40 && q.x < 110) || this.palms[0];
    const plaza = [Math.floor(this.plazaC.x - this.plazaC.rx), Math.floor(this.plazaC.y - this.plazaC.ry), Math.ceil(this.plazaC.x + this.plazaC.rx), Math.ceil(this.plazaC.y + this.plazaC.ry)];
    return {
      world: {
        w: W, h: H,
        grid: rows((k) => this.ter[k]),
        water: rows((k) => water(this.ter[k])),
        coll: rows((k) => (this.coll[k] ? '1' : '0')),
        height: rows((k) => String(this.lvl[k])),
        buildings: this.buildings,
        fruitTrees: this.fruitTrees, palms: this.palms, bigTree: this.bigTree, props: this.props, plots: this.plots, trees: this.trees, flowers: this.flowers,
        plaza, spots: this.spots, cart: this.cart, intro, boat: [pe.x0, end], wonton: this.wonton,
        river: this.riverLine.filter((_, i) => i % 40 === 0).map(([x, y]) => [+x.toFixed(1), +y.toFixed(1)]),
        rope: this.rope, waterfalls: this.waterfalls, fields: this.fields, windmill: this.windmill, stubs: this.stubs,
        squares: [plaza, [this.statueC.x - 5, this.statueC.y - 4, this.statueC.x + 6, this.statueC.y + 5]],
        statue: this.statue, bonfire: this.bonfire, goatpen: this.goatpen, oldTrees: this.oldTrees,
        pier: pe, camp: this.camp, tent: { w: 3, h: 2 },
        treasure: { x: p.x, y: p.y + 4, palm: [p.x, p.y] }, gemSpots: this.gemSpots, ramps: this.ramps,
        reach: rows((k) => (reach.has(k) ? '1' : '0')),
        lots: this.lots, glades: this.glades, places: this.placesOut,
      },
      paint: {
        W, H, ter: this.ter, lvl: this.lvl, face: this.face, land: this.land, blocks: this.blocks, strokes: this.strokes, shapes: this.shapes, under: this.under,
        ramps: this.rampAt.map(r => ({ L: r.L, x: r.x, y: this.bottoms[r.L][r.x] })), falls: this.fallAt.map(f => ({ L: f.L, x: f.x, y: this.bottoms[f.L][f.x] })),
      },
    };
  }
}

const PROP_W = { bench: 2, flowerbed: 2, board: 1, lamp: 1, mailbox: 1, sign_island: 1, sign_club: 1, rock: 1, driftwood: 1, bush: 1,
  windmill: 3, boulder: 2, well: 1, hay: 1, crate: 1, scarecrow: 1, sign_farm: 1, telescope: 1, statue_david: 3, plaque: 1, bonfire: 2, log: 2,
  tent: 3, picnic: 3, campfire: 1, trough: 2, sign_camp: 1, sign_bonfire: 1, blanket: 3,
  trashcan: 1, fountain: 2, drinkfountain: 1, volleyball: 7, tackle: 1, sandcastle: 1, birdhouse: 1, wheelbarrow: 2, icecream: 2, viewer: 1, flamingo: 1 };
const PROP_ROWS = { statue_david: 2, tent: 2, blanket: 2 };
