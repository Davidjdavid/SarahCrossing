// The island's layout, from its plan (plan.mjs): the coast, the land's heights, water, roads, stairs and bridges,
// buildings, trees, flowers, props and the named spots the neighbors use, as the world.json the game reads (plus what the
// painter needs). The plan says where everything goes; this works out the tiles: which ground is higher (and its cliffs),
// where a path crossing a cliff needs stairs and a river a waterfall, where bridges go, and that every door, staircase
// and spot can be walked to from the pier (it stops with an error if not).
import fs from 'node:fs';
import path from 'node:path';
import { rng, noise, hash } from './rand.mjs';
import { PLAN } from './plan.mjs';

const SRC = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'source/world.json'), 'utf8'));
export const W = PLAN.w, H = PLAN.h;
const SEA = '~';
// the first island's fields, copied whole for their crops
const CROPS = { wheat: { x: 26, y: 9, w: 8, h: 4 }, cabbage: { x: 35, y: 8, w: 9, h: 5 }, corn: { x: 13, y: 20, w: 7, h: 7 }, pumpkin: { x: 36, y: 34, w: 9, h: 4 }, sunflower: { x: 51, y: 16, w: 7, h: 5 } };
const SPRING = { sx: 141, sy: 49, w: 10, h: 7 };

export function makeIsland(seed = PLAN.seed) {
  const I = new Island(PLAN, seed);
  I.shape();
  I.heights();
  I.terrain();
  I.water();
  I.buildings();
  I.roads();
  I.bridges();
  I.ground();
  I.furnish();
  I.greenery();
  return I.output();
}

class Island {
  constructor(plan, seed) {
    this.P = plan; this.seed = seed;
    this.land = new Uint8Array(W * H);
    this.lvl = new Uint8Array(W * H);
    this.face = new Uint8Array(W * H);
    this.ter = new Array(W * H).fill(SEA);
    this.coll = new Uint8Array(W * H);
    this.occ = new Uint8Array(W * H);        // taken: 1 solid (building, prop, tree, field); 2 room kept clear; 3 a flower
    this.keep = new Uint8Array(W * H);       // no trees or flowers here (clearings, in front of doors, round spots)
    this.under = new Array(W * H).fill('');  // the ground a path was laid over
    this.buildingsOut = {}; this.props = []; this.trees = []; this.fruitTrees = []; this.palms = []; this.flowers = []; this.oldTrees = [];
    this.spots = {}; this.ramps = []; this.rampAt = []; this.fallAt = []; this.waterfalls = []; this.fields = []; this.stubs = {}; this.gemSpots = []; this.plots = [];
    this.blocks = []; this.strokes = []; this.shapes = []; this.crossings = [];
  }
  i(x, y) { return y * W + x; }
  in(x, y) { return x >= 0 && y >= 0 && x < W && y < H; }
  T(x, y) { return this.in(x, y) ? this.ter[this.i(x, y)] : SEA; }
  L(x, y) { return this.in(x, y) ? this.lvl[this.i(x, y)] : 0; }
  isLand(x, y) { return this.in(x, y) && this.land[this.i(x, y)] === 1; }

  /* ---------------------------------------------------------------- the coast */
  shape() {
    const nz = noise(this.seed), coast = curve(this.P.coast, true, 0.6);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) this.land[this.i(x, y)] = pip(coast, x + 0.5 + nz(x / 6, y / 6) * 1.4, y + 0.5 + nz(x / 6 + 50, y / 6 + 20) * 1.4) ? 1 : 0;
    this.landD = this.distance((k) => !this.land[k]);
  }
  distance(src) {
    const d = new Uint16Array(W * H).fill(999), q = [];
    for (let k = 0; k < W * H; k++) if (src(k)) { d[k] = 0; q.push(k); }
    for (let h = 0; h < q.length; h++) {
      const k = q[h], x = k % W, y = (k / W) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (!this.in(nx, ny)) continue; const n = ny * W + nx; if (d[n] > d[k] + 1) { d[n] = d[k] + 1; q.push(n); } }
    }
    return d;
  }
  flood(start, ok) {
    const seen = new Set([start]), st = [start];
    while (st.length) { const q = st.pop(); const x = q % W, y = (q / W) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (!this.in(nx, ny)) continue; const n = ny * W + nx; if (!seen.has(n) && ok(n)) { seen.add(n); st.push(n); } } }
    return seen;
  }

  /* ---------------------------------------------------------------- heights, stairs, waterfalls */
  heights() {
    // each level's edge, a row per column, wandering a little from the plan's line
    this.edges = this.P.levels.map((lv, li) => {
      const n = noise(this.seed + 100 + li * 7), P = lv.pts, b = new Int16Array(W).fill(-1), ro = lv.rough == null ? 1 : lv.rough;
      for (let x = lv.x0; x <= lv.x1; x++) {
        let v;
        if (x <= P[0][0]) v = P[0][1]; else if (x >= P[P.length - 1][0]) v = P[P.length - 1][1];
        else { let i = 0; while (P[i + 1][0] < x) i++; const t = (x - P[i][0]) / (P[i + 1][0] - P[i][0]), s = t * t * (3 - 2 * t); v = P[i][1] + (P[i + 1][1] - P[i][1]) * s; }
        b[x] = Math.round(v + (n(x / 7, 0.5) * 1.1 + n(x / 19, 4.5) * 1.4) * ro);
        if (x > lv.x0 && !lv.steep) b[x] = Math.max(b[x - 1] - 2, Math.min(b[x - 1] + 2, b[x]));
      }
      return { L: lv.L, b };
    });
    this.raise();
    // where paths and rivers cross a cliff, its edge runs straight for a few columns (stairs and falls are straight)
    const cross = this.crossingsAt();
    for (const g of cross) {
      const e = this.edgeAt(g.L, g.cx); if (!e) continue;
      for (let x = g.x0 - 2; x <= g.x1 + 2; x++) if (e.b[x] >= 0) e.b[x] = e.b[g.cx];
    }
    this.raise();
    // stairs: 3 wide on the two rows of cliff; a wider crossing gets more side by side
    for (const g of this.crossingsAt()) {
      const e = this.edgeAt(g.L, g.cx), y = e.b[g.cx], n = g.x1 - g.x0 + 1;
      const xs = g.water ? [] : n <= 3 ? [Math.round((g.x0 + g.x1) / 2)] : Array.from({ length: n - 2 }, (_, i) => g.x0 + 1 + i);
      for (const x of xs) {
        this.rampAt.push({ L: g.L, x, y });
        for (let dx = -1; dx <= 1; dx++) for (const dy of [1, 2]) { const tx = x + dx, ty = y + dy, k = this.i(tx, ty); if (this.ramps.some(([a, b]) => a === tx && b === ty)) continue; this.face[k] = 0; this.ramps.push([tx, ty]); }
        for (let dx = -1; dx <= 1; dx++) for (const dy of [-1, 0, 3, 4]) this.keep[this.i(x + dx, y + dy)] = 1;
      }
      if (g.water) for (let x = g.x0; x <= g.x1; x += 2) {
        const fx = Math.min(x, g.x1 - 1); this.fallAt.push({ L: g.L, x: fx, y });
        const tiles = []; for (let dx = 0; dx <= 1; dx++) for (const dy of [1, 2]) tiles.push([fx + dx, y + dy]);
        this.waterfalls.push({ tiles, level: g.L });
      }
    }
    this.rampSet = new Set(this.ramps.map(([x, y]) => x + ',' + y));
  }
  /* the level grid and the cliffs from the edges: a raised edge facing south is two rows of face on the lower ground,
     facing east or west one column */
  raise() {
    this.lvl.fill(0); this.face.fill(0);
    for (const e of this.edges) for (let x = 0; x < W; x++) for (let y = 0; y <= e.b[x] && y < H; y++) { const k = this.i(x, y); if (this.land[k] && this.lvl[k] < e.L) this.lvl[k] = e.L; }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const k = this.i(x, y); if (!this.land[k]) continue; const h = this.lvl[k];
      if (this.isLand(x, y - 1) && this.L(x, y - 1) > h) this.face[k] = 1;
      else if (this.isLand(x, y - 2) && this.L(x, y - 2) > h && this.L(x, y - 1) === h) this.face[k] = 2;
      else if ((this.isLand(x - 1, y) && this.L(x - 1, y) > h) || (this.isLand(x + 1, y) && this.L(x + 1, y) > h)) this.face[k] = 3;
    }
  }
  /* the edge that makes the cliff at column x for level L (the lowest-reaching one) */
  edgeAt(L, x) { let best = null; for (const e of this.edges) if (e.L === L && e.b[x] >= 0 && (!best || e.b[x] > best.b[x])) best = e; return best; }
  /* every place a path or river crosses a south-facing cliff: the cliff tiles it covers, grouped */
  crossingsAt() {
    const road = new Uint8Array(W * H), wet = new Uint8Array(W * H);
    const lines = this.roadLines();
    for (const l of lines) stroke(l.line, l.w, (x, y) => { if (this.in(x, y)) road[this.i(x, y)] = 1; });
    for (const r of this.P.rivers) stroke(curve(r.pts, false, 0.3), r.w, (x, y) => { if (this.in(x, y)) wet[this.i(x, y)] = 1; });
    const hit = new Uint8Array(W * H), out = [];
    for (let k = 0; k < W * H; k++) if ((this.face[k] === 1 || this.face[k] === 2) && (road[k] || wet[k])) hit[k] = wet[k] ? 2 : 1;
    const seen = new Uint8Array(W * H);
    for (let k = 0; k < W * H; k++) {
      if (!hit[k] || seen[k]) continue;
      const st = [k], g = []; seen[k] = 1;
      while (st.length) { const c = st.pop(); g.push(c); const x = c % W, y = (c / W) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = this.i(x + dx, y + dy); if (this.in(x + dx, y + dy) && hit[n] === hit[k] && !seen[n]) { seen[n] = 1; st.push(n); } } }
      const xs = g.map(c => c % W), x0 = Math.min(...xs), x1 = Math.max(...xs), top = Math.min(...g.map(c => (c / W) | 0));
      const cx = Math.round((x0 + x1) / 2), up = top - (this.face[this.i(cx, top)] === 2 ? 2 : 1);
      out.push({ x0, x1, cx, L: this.L(cx, up), water: hit[k] === 2 });
    }
    return out;
  }
  /* every path, trail, street and door path as the line it follows (the square too, as its outline is solid ground) */
  roadLines() {
    if (this._lines) return this._lines;
    const out = [];
    for (const p of this.P.paths) out.push({ line: p.ring ? curve(ringPts(...p.ring), true, 0.25) : curve(p.pts, false, 0.25), w: p.w || 2, kind: p.trail ? 'd' : 'p', closed: !!p.ring });
    for (const s of this.P.streets) out.push({ line: curve(s.pts, false, 0.25), w: s.w, kind: 'c' });
    for (const b of this.P.buildings) if (b.link) { const dx = b.x + b.door + 0.5; out.push({ line: curve([[dx, b.y + b.h - 0.3], ...b.link], false, 0.25), w: 1.35, kind: 'p', door: b.id }); }
    return (this._lines = out);
  }

  /* ---------------------------------------------------------------- the ground's kinds */
  terrain() {
    const sand = new Uint8Array(W * H);
    for (const [a, b, c, d] of this.P.sand) for (let y = b; y <= d; y++) for (let x = a; x <= c; x++) if (this.in(x, y)) sand[this.i(x, y)] = 1;
    for (let k = 0; k < W * H; k++) {
      if (!this.land[k]) { this.ter[k] = SEA; this.coll[k] = 1; continue; }
      const l = this.lvl[k];
      // beaches on the low ground; raised land meets the sea with a rim of rock (a little sea cliff)
      this.ter[k] = sand[k] || (l === 0 && this.landD[k] <= 14) ? 's' : this.landD[k] <= 1 ? 'm' : 'g';
      if (this.face[k]) this.coll[k] = 1;
    }
    for (const [x, y] of this.ramps) { const k = this.i(x, y); this.ter[k] = 'd'; this.coll[k] = 0; }
    for (const w of this.waterfalls) for (const [x, y] of w.tiles) { const k = this.i(x, y); this.ter[k] = 'W'; this.coll[k] = 1; this.occ[k] = 1; }
  }

  /* ---------------------------------------------------------------- rivers and ponds */
  water() {
    for (const r of this.P.rivers) {
      const line = curve(r.pts, false, 0.3);
      this.strokes.push({ line, width: r.w, kind: 'r' });
      stroke(line, r.w, (x, y) => { const k = this.i(x, y); if (!this.in(x, y) || !this.land[k] || this.face[k] || this.ter[k] === 'W') return; this.ter[k] = 'r'; this.coll[k] = 1; this.occ[k] = 1; });
      this.riverLine = line;
    }
    for (const p of this.P.ponds) {
      const seed = this.seed + Math.round(p.x * 7 + p.y * 13), n = noise(seed);
      this.shapes.push({ kind: 'o', cx: p.x, cy: p.y, rx: p.rx, ry: p.ry, seed });
      for (let y = Math.floor(p.y - p.ry - 1); y <= p.y + p.ry + 1; y++) for (let x = Math.floor(p.x - p.rx - 1); x <= p.x + p.rx + 1; x++) {
        const dx = (x + 0.5 - p.x) / p.rx, dy = (y + 0.5 - p.y) / p.ry, k = this.i(x, y);
        if (!this.isLand(x, y) || this.face[k] || dx * dx + dy * dy + n((x + 0.5) / 2, (y + 0.5) / 2) * 0.22 >= 1) continue;
        this.ter[k] = 'o'; this.coll[k] = 1; this.occ[k] = 1;
      }
    }
  }

  /* ---------------------------------------------------------------- buildings (before the roads, which go round them) */
  buildings() {
    for (const b of this.P.buildings) {
      const sprite = b.sprite || 'house_' + b.id.slice(2);
      for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) { const k = this.i(b.x + i, b.y + j); this.occ[k] = 1; if (this.ter[k] !== 's') this.ter[k] = 'g'; }
      for (let j = -1; j <= b.h; j++) for (let i = -1; i <= b.w; i++) { const k = this.i(b.x + i, b.y + j); this.keep[k] = 1; if (!this.occ[k]) this.occ[k] = 2; }
      for (const dy of [b.h, b.h + 1, b.h + 2]) { const k = this.i(b.x + b.door, b.y + dy); this.keep[k] = 1; if (this.occ[k] === 2) this.occ[k] = 0; }
      this.buildingsOut[b.id] = { x: b.x, y: b.y, w: b.w, h: b.h, door: b.door, sprite };
      if (b.front) this.spots[b.front] = { x: b.x + b.door, y: b.y + b.h + 1, r: 1 };
    }
    for (const l of Object.values(this.P.lots)) for (let j = -1; j <= l.h; j++) for (let i = -1; i <= l.w; i++) { const k = this.i(l.x + i, l.y + j); this.keep[k] = 1; if (!this.occ[k]) this.occ[k] = 2; }
  }

  /* ---------------------------------------------------------------- paths, trails, streets and the square */
  roads() {
    const q = this.P.plaza;
    this.plazaRect = [q.x0, q.y0, q.x1 + 1, q.y1 + 1];
    this.shapes.push({ kind: 'c', cx: (q.x0 + q.x1 + 1) / 2, cy: (q.y0 + q.y1 + 1) / 2, rx: (q.x1 - q.x0 + 1) / 2, ry: (q.y1 - q.y0 + 1) / 2, seed: this.seed + 5, p: 8 });
    const lay = (x, y, kind) => {
      const k = this.i(x, y), t = this.ter[k];
      if (!this.in(x, y) || !this.land[k] || this.occ[k] === 1 && t !== 'r' && t !== 'o') return false;
      if (this.face[k] && !this.rampSet.has(x + ',' + y)) return false;
      if (t === 'r' || t === 'o') { this.crossings.push({ x, y }); return false; }
      if (t === 'W') return false;
      if (this.rampSet.has(x + ',' + y)) return true;
      if (t === 'c' || (t === 'p' && kind === 'd') || (t === 'd' && kind === 'p' && this.rampSet.has(x + ',' + y))) return true;
      if (!'pdc'.includes(t)) this.under[k] = t;
      this.ter[k] = kind; if (this.occ[k] === 2) this.occ[k] = 0;
      return true;
    };
    for (let y = q.y0; y <= q.y1; y++) for (let x = q.x0; x <= q.x1; x++) {
      const dx = Math.abs((x + 0.5 - (q.x0 + q.x1 + 1) / 2) / ((q.x1 - q.x0 + 1) / 2)), dy = Math.abs((y + 0.5 - (q.y0 + q.y1 + 1) / 2) / ((q.y1 - q.y0 + 1) / 2));
      if (dx ** 8 + dy ** 8 < 1) lay(x, y, 'c');
    }
    // paths and trails first, then the stone streets over them
    const lines = this.roadLines().slice().sort((a, b) => (a.kind === 'c') - (b.kind === 'c'));
    for (const l of lines) {
      this.strokes.push({ line: l.line, width: l.w, kind: l.kind });
      const tiles = [];
      stroke(l.line, l.w, (x, y) => { if (lay(x, y, l.kind)) tiles.push([x, y]); });
      if (l.door) this.stubs[l.door] = l.door.startsWith('h_') || l.door === 'home' ? dedupe(tiles).filter(([x, y]) => this.ter[this.i(x, y)] === 'p') : [];
    }
    for (const b of this.P.buildings) if (!(b.id in this.stubs)) this.stubs[b.id] = [];
  }

  /* ---------------------------------------------------------------- straight bridges where paths met the river */
  bridges() {
    this.bridgeTiles = [];
    const done = new Set();
    for (const c of this.crossings) {
      if (done.has(c.x + ',' + c.y) || this.T(c.x, c.y) === 'w' || this.T(c.x, c.y) === 'o') continue;
      // straight across the water, two tiles thick, a tile of bank each end
      let hx = 0, hy = 0;
      for (let d = -3; d <= 3; d++) { if (this.T(c.x + d, c.y) === 'r') hx++; if (this.T(c.x, c.y + d) === 'r') hy++; }
      const tiles = [];
      if (hy >= hx) {
        let a = c.x, b = c.x; while (this.T(a - 1, c.y) === 'r') a--; while (this.T(b + 1, c.y) === 'r') b++;
        const y0 = this.crossings.some(o => o.y === c.y + 1 && Math.abs(o.x - c.x) <= 3) ? c.y : c.y - 1;
        for (let y = y0; y <= y0 + 1; y++) for (let x = a - 1; x <= b + 1; x++) tiles.push([x, y]);
      } else {
        let a = c.y, b = c.y; while (this.T(c.x, a - 1) === 'r') a--; while (this.T(c.x, b + 1) === 'r') b++;
        for (let x = c.x; x <= c.x + 1; x++) for (let y = a - 1; y <= b + 1; y++) tiles.push([x, y]);
      }
      if (tiles.some(([x, y]) => this.face[this.i(x, y)] || this.T(x, y) === 'W' || !this.isLand(x, y))) throw new Error(`no room for a bridge at ${c.x},${c.y}: a path crosses the river too near a cliff`);
      for (const [x, y] of tiles) {
        const k = this.i(x, y);
        if (this.ter[k] !== 'r' && !this.under[k]) this.under[k] = this.ter[k];
        this.ter[k] = 'w'; this.coll[k] = 0; this.occ[k] = 1; this.keep[k] = 1; this.bridgeTiles.push([x, y]); done.add(x + ',' + y);
      }
    }
  }

  /* ---------------------------------------------------------------- fields, the hot spring, the garden, the pier */
  ground() {
    for (const f of this.P.fields) {
      const s = CROPS[f.crop];
      this.copyBlock(s.x, s.y, s.w, s.h, f.x, f.y);
      for (let j = 0; j < s.h; j++) for (let i = 0; i < s.w; i++) this.occ[this.i(f.x + i, f.y + j)] = 1;
      for (let j = -1; j <= s.h + 1; j++) for (let i = -1; i <= s.w; i++) this.keep[this.i(f.x + i, f.y + j)] = 1;
      this.fields.push({ x: f.x, y: f.y, w: s.w, h: s.h, crop: f.crop });
      this.prop('fence', f.x, f.y + s.h, { w: s.w });
    }
    const hs = this.P.hotspring;
    this.copyBlock(SPRING.sx, SPRING.sy, SPRING.w, SPRING.h, hs.x, hs.y);
    for (let j = -1; j <= SPRING.h; j++) for (let i = -1; i <= SPRING.w; i++) this.keep[this.i(hs.x + i, hs.y + j)] = 1;
    this.wonton = [hs.x + (146 - SPRING.sx), hs.y + (52.9 - SPRING.sy)];
    const gd = this.P.garden;
    for (const [dx, dy] of [[0, 0], [2, 0], [4, 0], [0, 2], [2, 2], [4, 2]]) { this.plots.push({ x: gd.x + dx, y: gd.y + dy }); this.occ[this.i(gd.x + dx, gd.y + dy)] = 1; }
    for (let j = -1; j <= 4; j++) for (let i = -1; i <= 6; i++) this.keep[this.i(gd.x + i, gd.y + j)] = 1;
    const pe = this.P.pier;
    this.pier = { x0: pe.x, x1: pe.x + 1, y0: pe.y0, y1: pe.y1 };
    for (let y = pe.y0; y <= pe.y1; y++) for (let x = pe.x; x <= pe.x + 1; x++) { const k = this.i(x, y); if (this.land[k]) continue; this.ter[k] = 'w'; this.coll[k] = 0; }
    this.pierStart = pe.y0; while (this.land[this.i(pe.x, this.pierStart)]) this.pierStart++;
  }
  copyBlock(sx, sy, w, h, x, y) {
    this.blocks.push({ sx, sy, w, h, x, y });
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const k = this.i(x + i, y + j);
      this.ter[k] = SRC.grid[sy + j][sx + i]; this.coll[k] = SRC.coll[sy + j][sx + i] === '1' ? 1 : 0; if (this.coll[k]) this.occ[k] = 1;
    }
  }

  /* ---------------------------------------------------------------- props, the old tree, the big tree, spots */
  prop(kind, x, y, extra) {
    const p = Object.assign({ kind, x, y }, extra || {});
    this.props.push(p);
    const w = (extra && extra.w) || PROP_W[kind] || 1, rows = PROP_ROWS[kind] || 1;
    for (let j = 0; j < rows; j++) for (let i = 0; i < w; i++) { const k = this.i(x + i, y + j); this.occ[k] = 1; this.keep[k] = 1; }
    return p;
  }
  furnish() {
    const P = this.P;
    for (const p of P.props) { const { kind, x, y, ...rest } = p; this.prop(kind, x, y, Object.keys(rest).length ? rest : null); }
    // the goat pen: a fence round it with a gap at the bottom
    const G = P.goatpen;
    this.goatpen = { ...G };
    this.prop('fence', G.x, G.y, { w: G.w });
    this.prop('fence', G.x, G.y + G.h - 1, { w: 3 }); this.prop('fence', G.x + G.w - 3, G.y + G.h - 1, { w: 3 });
    for (let j = 1; j < G.h - 1; j++) { this.prop('fence', G.x, G.y + j, { w: 1 }); this.prop('fence', G.x + G.w - 1, G.y + j, { w: 1 }); }
    for (let j = 0; j < G.h; j++) for (let i = 0; i < G.w; i++) this.keep[this.i(G.x + i, G.y + j)] = 1;
    const wm = P.props.find(p => p.kind === 'windmill');
    this.windmill = { x: wm.x, y: wm.y, w: 3, h: 2, door: 1 };
    const ot = P.oldTree;
    this.oldTrees.push({ x: ot.x, y: ot.y, v: 0 });
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) this.occ[this.i(ot.x + i, ot.y + j)] = 1;
    this.bigTree = { ...P.bigTree };
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) this.occ[this.i(P.bigTree.x + i, P.bigTree.y + j)] = 1;
    const c = P.cart;
    this.cart = { x: c.x + 0.5, y: c.y, tiles: [[c.x - 1, c.y], [c.x, c.y], [c.x + 1, c.y]], basil: [c.x + 2.45, c.y + 0.85] };
    this.rope = { a: [P.rope.x, P.rope.y], b: [P.rope.x + 6, P.rope.y], mid: [P.rope.x + 3, P.rope.y] };
    const st = P.props.find(p => p.kind === 'statue_david');
    this.statue = { x: st.x, y: st.y, w: 3, h: 2 };
    const bf = P.props.find(p => p.kind === 'bonfire');
    this.bonfire = { x: bf.x, y: bf.y };
    this.camp = { ...P.camp };
    for (const [name, [x, y, r]] of Object.entries(P.spots)) this.spots[name] = { x, y, r };
    for (const s of Object.values(this.spots)) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (this.in(s.x + dx, s.y + dy)) this.keep[this.i(s.x + dx, s.y + dy)] = 1;
    for (const c of P.clearings) for (let y = Math.floor(c.y - c.r); y <= c.y + c.r; y++) for (let x = Math.floor(c.x - c.r); x <= c.x + c.r; x++) if (this.in(x, y) && (x + 0.5 - c.x) ** 2 + (y + 0.5 - c.y) ** 2 <= c.r * c.r) this.keep[this.i(x, y)] = 1;
    for (const [a, b, c2, d] of P.noTree) for (let y = b; y <= d; y++) for (let x = a; x <= c2; x++) if (this.in(x, y)) this.keep[this.i(x, y)] = 1;
  }

  /* ---------------------------------------------------------------- trees, fruit trees, palms, flowers, gems */
  greenery() {
    const P = this.P, R = rng(this.seed + 5);
    const nearRoad = (x, y, r = 1) => { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if ('pdcw'.includes(this.T(x + i, y + j))) return true; return false; };
    const free = (k) => this.land[k] && !this.face[k] && !this.occ[k] && this.ter[k] === 'g';
    const lawn = new Uint8Array(W * H);
    for (const l of P.lawns) for (let j = 0; j < l.h; j++) for (let i = 0; i < l.w; i++) lawn[this.i(l.x + i, l.y + j)] = 1;
    // the orchard: fruit trees in loose rows
    const FRUITS = ['peach', 'cherry', 'mango', 'lychee', 'apple'], o = P.orchard;
    for (let y = o.y + 1, row = 0; y < o.y + o.h; y += 3, row++) for (let x = o.x + 1 + (row % 2) * 2; x < o.x + o.w; x += 4) {
      const k = this.i(x, y); if (!free(k) || nearRoad(x, y)) continue;
      this.fruitTrees.push({ x, y, fruit: FRUITS[(row + x) % 5] }); this.occ[k] = 1;
    }
    const inOrchard = (x, y) => x >= o.x - 1 && x <= o.x + o.w && y >= o.y - 1 && y <= o.y + o.h;
    // trees: thick in the woods, a line of them along cliff tops, a few anywhere else; never two side by side
    const order = []; for (let k = 0; k < W * H; k++) order.push(k);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    for (const k of order) {
      const x = k % W, y = (k / W) | 0;
      if (!free(k) || this.keep[k] || lawn[k] || nearRoad(x, y) || inOrchard(x, y)) continue;
      let p = 0.022, kind = null;
      for (const f of P.forests) if (pip(f.poly, x + 0.5, y + 0.5)) { p = Math.max(p, f.p); kind = f.kind; }
      if (this.in(x, y + 1) && this.face[this.i(x, y + 1)] === 1) p += 0.22;
      if (this.landD[k] <= 3 && this.lvl[k] >= 1) p += 0.12;
      if (R() >= p) continue;
      let crowd = false;
      for (let j = -1; j <= 1 && !crowd; j++) for (let i = -1; i <= 1; i++) if ((i || j) && this.in(x + i, y + j) && this.occ[this.i(x + i, y + j)] === 1) { crowd = true; break; }
      if (crowd) continue;
      const l = this.lvl[k], r = R();
      const t = l >= 3 && kind !== 'mixed' ? (r < 0.78 ? 'pine' : 'oak') : kind === 'pine' ? (r < 0.6 ? 'pine' : 'oak') : kind === 'mixed' ? (r < 0.3 ? 'pine' : 'oak') : (r < 0.14 ? 'blossom' : r < 0.24 ? 'pine' : 'oak');
      this.occ[k] = 1; this.trees.push({ x, y, kind: t });
    }
    // palms along the beaches
    for (const k of order) {
      const x = k % W, y = (k / W) | 0;
      if (this.ter[k] !== 's' || this.occ[k] || this.keep[k] || nearRoad(x, y) || this.landD[k] < 2 || this.landD[k] > 6 || R() > 0.05) continue;
      if (this.palms.some(q => Math.abs(q.x - x) + Math.abs(q.y - y) < 7)) continue;
      this.palms.push({ x, y, coconut: R() < 0.55 }); this.occ[k] = 1;
    }
    // flowers: beds where the plan says, a few anywhere
    const FK = ['tulip', 'daisy', 'cosmos', 'lily'];
    const flower = (x, y) => { const k = this.i(x, y); if (!this.in(x, y) || !free(k) || lawn[k] || this.occ[k]) return; this.flowers.push({ x, y, kind: FK[hash(x, y, 1) % 4], color: hash(x, y, 2) % 3 }); this.occ[k] = 3; };
    for (const f of P.flowers) for (let i = 0; i < f.n * 3; i++) { const a = R() * Math.PI * 2, d = Math.sqrt(R()) * f.r; flower(Math.floor(f.x + Math.cos(a) * d), Math.floor(f.y + Math.sin(a) * d)); }
    for (let k = 0; k < W * H; k++) if (free(k) && !this.keep[k] && !lawn[k] && hash(k, this.seed, 6) % 1000 < 12) flower(k % W, (k / W) | 0);
    // gems hide up the mountain, off the trails
    for (const k of order) {
      if (this.gemSpots.length >= 14) break;
      const x = k % W, y = (k / W) | 0;
      if (this.lvl[k] < 3 || x < 150 || !free(k) || this.keep[k] || nearRoad(x, y, 2)) continue;
      if (this.gemSpots.some(([gx, gy]) => Math.abs(gx - x) + Math.abs(gy - y) < 6)) continue;
      this.gemSpots.push([x, y]);
    }
  }

  /* ---------------------------------------------------------------- can everything be walked to? */
  check(start) {
    // solid as the game has it: the ground's collision plus buildings, props, trees, the old and the big tree
    const bl = new Uint8Array(W * H);
    for (let k = 0; k < W * H; k++) bl[k] = this.coll[k];
    const put = (x, y) => { if (this.in(x, y)) bl[this.i(x, y)] = 1; };
    for (const b of Object.values(this.buildingsOut)) for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) put(b.x + i, b.y + j);
    for (const p of this.props) {
      const w = p.w || PROP_W[p.kind] || 1;
      if (p.kind === 'volleyball') { for (let i = 0; i < w; i++) put(p.x + i, p.y + 2); continue; }
      if (p.kind === 'driftwood' || p.kind === 'blanket') continue;
      for (let j = 0; j < (PROP_ROWS[p.kind] || 1); j++) for (let i = 0; i < w; i++) put(p.x + i, p.y + j);
    }
    for (const t of [...this.trees, ...this.fruitTrees, ...this.palms]) put(t.x, t.y);
    for (const t of [...this.oldTrees, this.bigTree]) for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) put(t.x + i, t.y + j);
    const seen = this.flood(this.i(start[0], start[1]), (k) => !bl[k]);
    const near = (x, y, r) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (seen.has(this.i(x + dx, y + dy))) return true; return false; };
    const bad = [];
    for (const [k, s] of Object.entries(this.spots)) if (!near(s.x, s.y, Math.max(1, s.r))) bad.push('spot ' + k);
    for (const [id, b] of Object.entries(this.buildingsOut)) if (!seen.has(this.i(b.x + b.door, b.y + b.h))) bad.push('door ' + id);
    for (const [x, y] of this.ramps) if (!seen.has(this.i(x, y)) && !bl[this.i(x, y)]) bad.push(`stairs ${x},${y}`);
    for (const pl of this.plots) if (!near(pl.x, pl.y + 1, 1)) bad.push('plot');
    for (const p of this.props.filter(q => q.kind === 'tent')) if (!seen.has(this.i(p.x + 1, p.y + 2))) bad.push('tent ' + p.tent);
    if (!seen.has(this.i(this.windmill.x + this.windmill.door, this.windmill.y + this.windmill.h))) bad.push('windmill door');
    if (bad.length) throw new Error("can't walk to: " + [...new Set(bad)].join(', '));
    this.gemSpots = this.gemSpots.filter(([x, y]) => near(x, y, 1));
    return seen;
  }

  /* ---------------------------------------------------------------- world.json */
  output() {
    const pe = this.pier, end = pe.y1;
    const intro = { sarah: [pe.x0 + 0.6, end - 3.6], fortune: [pe.x0 + 1.1, end - 5.4], joe: [pe.x0 + 1.8, end - 3.5], start: [pe.x0 + 0.6, end - 6.5] };
    for (let k = 0; k < W * H; k++) { const t = this.ter[k]; if ('~orhxWF'.includes(t)) this.coll[k] = 1; if (t === 'w') this.coll[k] = 0; }
    for (const [x, y] of this.ramps) this.coll[this.i(x, y)] = 0;
    const start = [Math.floor(intro.start[0]), Math.floor(intro.start[1])];
    this.check(start);
    const reach = this.flood(this.i(start[0], start[1]), (k) => !this.coll[k] && (this.land[k] || this.ter[k] === 'w'));
    const rows = (f) => { const out = []; for (let y = 0; y < H; y++) { let s = ''; for (let x = 0; x < W; x++) s += f(this.i(x, y)); out.push(s); } return out; };
    const water = (t) => (t === '~' ? 's' : t === 'o' ? 'p' : t === 'r' ? 'r' : t === 'h' ? 'h' : '.');
    const palm = this.palms.filter(q => q.x > 30 && q.x < 110).sort((a, b) => a.x - b.x)[0] || this.palms[0];
    return {
      world: {
        w: W, h: H,
        grid: rows((k) => this.ter[k]),
        water: rows((k) => water(this.ter[k])),
        coll: rows((k) => (this.coll[k] ? '1' : '0')),
        height: rows((k) => String(this.lvl[k])),
        buildings: this.buildingsOut,
        fruitTrees: this.fruitTrees, palms: this.palms, bigTree: this.bigTree, props: this.props, plots: this.plots, trees: this.trees, flowers: this.flowers,
        plaza: this.plazaRect, spots: this.spots, cart: this.cart, intro, boat: [pe.x0, end], wonton: this.wonton,
        river: this.riverLine.filter((_, i) => i % 40 === 0).map(([x, y]) => [+x.toFixed(1), +y.toFixed(1)]),
        rope: this.rope, waterfalls: this.waterfalls, fields: this.fields, windmill: this.windmill, stubs: this.stubs,
        squares: [this.plazaRect], statue: this.statue, bonfire: this.bonfire, goatpen: this.goatpen, oldTrees: this.oldTrees,
        pier: pe, camp: this.camp, tent: { w: 3, h: 2 },
        treasure: { x: palm.x, y: palm.y + 3, palm: [palm.x, palm.y] }, gemSpots: this.gemSpots, ramps: this.ramps,
        reach: rows((k) => (reach.has(k) ? '1' : '0')),
        lots: this.P.lots,
      },
      paint: {
        W, H, ter: this.ter, lvl: this.lvl, face: this.face, land: this.land, blocks: this.blocks, strokes: this.strokes, shapes: this.shapes, under: this.under,
        ramps: this.rampAt, falls: this.fallAt,
      },
    };
  }
}

/* ---------------------------------------------------------------- shapes */
/* a smooth line through points (Catmull-Rom), a point every `step` tiles; closed loops come back round */
function curve(pts, closed, step = 0.3) {
  const out = [], n = pts.length, P = (i) => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const steps = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let s = 0; s < steps; s++) {
      const t = s / steps, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(closed ? out[0].slice() : pts[n - 1].slice());
  return out;
}
function ringPts(cx, cy, rx, ry) { const o = []; for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; }
function pip(poly, x, y) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
/* every tile whose middle is within half the width of the line */
function stroke(line, w, fn) {
  const r = w / 2 + 0.01, seen = new Set();
  for (const [px, py] of line) for (let y = Math.floor(py - r); y <= Math.ceil(py + r); y++) for (let x = Math.floor(px - r); x <= Math.ceil(px + r); x++) {
    if ((x + 0.5 - px) ** 2 + (y + 0.5 - py) ** 2 > r * r) continue;
    const k = x + ',' + y; if (seen.has(k)) continue; seen.add(k); fn(x, y);
  }
}
function dedupe(tiles) { const s = new Set(); return tiles.filter(([x, y]) => { const k = x + ',' + y; if (s.has(k)) return false; s.add(k); return true; }); }

const PROP_W = { bench: 2, flowerbed: 2, board: 1, lamp: 1, mailbox: 1, sign_island: 1, sign_club: 1, rock: 1, driftwood: 1, bush: 1,
  windmill: 3, boulder: 2, well: 1, hay: 1, crate: 1, scarecrow: 1, sign_farm: 1, telescope: 1, statue_david: 3, plaque: 1, bonfire: 2, log: 2,
  tent: 3, picnic: 3, campfire: 1, trough: 2, sign_camp: 1, sign_bonfire: 1, sign_trail: 1, blanket: 3,
  trashcan: 1, fountain: 2, drinkfountain: 1, volleyball: 7, tackle: 1, sandcastle: 1, birdhouse: 1, wheelbarrow: 2, icecream: 2, viewer: 1, flamingo: 1 };
const PROP_ROWS = { statue_david: 2, tent: 2, blanket: 2 };
