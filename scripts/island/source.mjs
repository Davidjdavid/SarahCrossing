// The first island's ground picture and map (scripts/island/source/), which the new island borrows its textures from:
// grass, sand, rock, cobbles and sea copied in blocks, and every cliff, stair and waterfall tile matched by what's around
// it. Copying palette indices keeps the season recoloring working.
import fs from 'node:fs';
import path from 'node:path';
import { readIndexed } from '../lib/png.mjs';

export const T = 16;

export function loadSource(dir) {
  const img = readIndexed(fs.readFileSync(path.join(dir, 'ground.png')));
  const W = JSON.parse(fs.readFileSync(path.join(dir, 'world.json'), 'utf8'));
  const g = (x, y) => (W.grid[y] && W.grid[y][x]) || '~';
  const H = (x, y) => (W.height[y] ? +W.height[y][x] || 0 : 0);
  const C = (x, y) => (W.coll[y] ? W.coll[y][x] === '1' : true);
  const src = { img, W, g, H, C, w: W.w, h: W.h };

  // tiles near anything special (stairs, falls, water, bridges, fields, the spring) aren't used as plain texture
  const special = new Set();
  const mark = (x, y, r) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) special.add((x + dx) + ',' + (y + dy)); };
  for (const [x, y] of W.ramps) mark(x, y, 2);
  for (let y = 0; y < W.h; y++) for (let x = 0; x < W.w; x++) if ('WwbxhFo'.includes(g(x, y))) mark(x, y, 2);
  const flat = (x, y, r) => {
    const c = g(x, y), h = H(x, y);
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (g(x + dx, y + dy) !== c || H(x + dx, y + dy) !== h) return false;
    return true;
  };

  // plain textures: blocks of B x B tiles that are all one kind (with a tile of margin), per kind
  const B = 4;
  src.blocks = {};
  src.tiles = {};
  for (const c of 'gms~c') {
    const blocks = [], tiles = [];
    for (let y = 2; y < W.h - 2; y++) for (let x = 2; x < W.w - 2; x++) {
      if (g(x, y) !== c || special.has(x + ',' + y) || !flat(x, y, 1) || (c !== '~' && C(x, y))) continue;
      tiles.push([x, y]);
      let ok = true;
      for (let j = 0; j < B && ok; j++) for (let i = 0; i < B && ok; i++) if (g(x + i, y + j) !== c || special.has((x + i) + ',' + (y + j)) || !flat(x + i, y + j, 1) || (c !== '~' && C(x + i, y + j))) ok = false;
      if (ok) blocks.push([x, y]);
    }
    src.blocks[c] = blocks; src.tiles[c] = tiles;
  }
  src.B = B;

  // the height tiles: every tile beside higher ground, filed by what's around it (see sig)
  src.cliffs = new Map();
  for (let y = 2; y < W.h - 2; y++) for (let x = 1; x < W.w - 1; x++) {
    if ('~WbFo'.includes(g(x, y))) continue;
    const s = sig((a, b) => H(a, b), (a, b) => g(a, b) === '~', x, y);
    if (!s) continue;
    // stairs and falls are copied whole elsewhere: not as cliff texture
    let near = false;
    for (const [rx, ry] of W.ramps) if (Math.abs(rx - x) <= 1 && Math.abs(ry - y) <= 2) near = true;
    for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -1; dx <= 1 && !near; dx++) if ('Wwo'.includes(g(x + dx, y + dy))) near = true;
    if (near) continue;
    const key = s + '|' + topKind(g, H, x, y);
    if (!src.cliffs.has(key)) src.cliffs.set(key, []);
    src.cliffs.get(key).push([x, y]);
  }
  src.cliffKeys = [...src.cliffs.keys()];
  return src;
}

/* what a tile next to higher ground looks like depends on where the higher ground is: for the 3 x 4 tiles around it
   (a column either side, two rows up and one down), whether each is higher. '' when nothing near is higher. The sea
   counts as level ground (the coast is drawn as coast, not as a cliff). */
export function sig(H, isSea, x, y) {
  const h = H(x, y);
  let s = '', any = false;
  for (let dy = -2; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const n = x + dx, m = y + dy;
    const up = !isSea(n, m) && H(n, m) > h;
    if (up) any = true;
    s += up ? '1' : '0';
  }
  return any ? s : '';
}
/* the ground on top of the nearest higher tile (rock or grass changes the cliff's lip) */
export function topKind(g, H, x, y) {
  const h = H(x, y);
  for (let dy = 1; dy <= 3; dy++) for (const dx of [0, -1, 1]) if (H(x + dx, y - dy) > h) return g(x + dx, y - dy) === 'm' ? 'm' : 'g';
  for (const dx of [-1, 1]) if (H(x + dx, y) > h) return g(x + dx, y) === 'm' ? 'm' : 'g';
  return 'g';
}
/* the nearest filed signature to one the first island doesn't have (the tile's own column counts double) */
export function nearestKey(src, key) {
  if (src.cliffs.has(key)) return key;
  const [s, top] = key.split('|');
  let best = null, bd = 1e9;
  for (const k of src.cliffKeys) {
    const [t, tt] = k.split('|');
    let d = tt === top ? 0 : 3;
    for (let i = 0; i < 12; i++) if (s[i] !== t[i]) d += (i % 3 === 1 ? 2 : 1);
    if (d < bd) { bd = d; best = k; }
  }
  return best;
}
