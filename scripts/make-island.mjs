// Makes the island: game/assets/world.json (the map: ground, heights, buildings, trees, props, spots) and
// game/assets/ground/ (its picture, in pieces), from scripts/island/ (layout.mjs lays it out, paint.mjs paints it with
// the first island's textures from scripts/island/source/). The same seed always makes the same island.
//
//   node scripts/make-island.mjs [--seed N] [--preview out.png | --png out.png]
//
// --preview only draws a quick map of the layout (one color per kind of ground, dots for trees and props), and --png
// only the painted ground in summer's colors (with the map next to it as out.json), without writing into game/.
import fs from 'node:fs';
import path from 'node:path';
import { makeIsland } from './island/layout.mjs';
import { writeIndexed } from './lib/png.mjs';
import { formatJson } from './json-format.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const seed = +opt('--seed', 7);
const preview = opt('--preview', null);

const t0 = Date.now();
const { world, paint } = makeIsland(seed);
console.log(`laid out ${world.w}x${world.h} in ${Date.now() - t0} ms: ${Object.keys(world.buildings).length} buildings, ${world.trees.length} trees, ${world.fruitTrees.length} fruit trees, ${world.palms.length} palms, ${world.props.length} props, ${world.flowers.length} flowers, ${Object.keys(world.spots).length} spots`);

if (preview) {
  const K = 4, w = world.w * K, h = world.h * K, px = new Uint8Array(w * h);
  const COL = { '~': [58, 143, 208], g: [112, 190, 84], m: [150, 165, 130], s: [236, 214, 160], p: [214, 186, 128], d: [190, 150, 100], c: [214, 204, 186],
    F: [150, 110, 60], o: [96, 176, 224], r: [96, 176, 224], h: [166, 234, 229], x: [190, 190, 190], b: [160, 110, 70], W: [220, 240, 255], w: [96, 176, 224] };
  const pal = [], idx = {};
  const add = (name, c) => { idx[name] = pal.length / 3; pal.push(...c); };
  for (const [k, c] of Object.entries(COL)) for (let l = 0; l <= 6; l++) add(k + l, c.map((v) => Math.max(0, Math.min(255, Math.round(v * (1 - l * 0.07))))));
  add('face', [110, 90, 70]); add('side', [80, 70, 60]); add('tree', [40, 100, 50]); add('pine', [30, 80, 60]); add('blossom', [240, 160, 200]); add('fruit', [200, 60, 60]);
  add('bld', [180, 60, 60]); add('home', [255, 60, 120]); add('prop', [60, 60, 200]); add('flower', [255, 230, 80]); add('ramp', [255, 200, 0]); add('spot', [0, 0, 0]);
  const put = (x, y, c, s = K) => { for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) { const X = x * K + i, Y = y * K + j; if (X >= 0 && Y >= 0 && X < w && Y < h) px[Y * w + X] = idx[c]; } };
  for (let y = 0; y < world.h; y++) for (let x = 0; x < world.w; x++) {
    const t = world.grid[y][x], l = +world.height[y][x], f = paint.face[y * world.w + x];
    put(x, y, f === 1 || f === 2 ? (t === 'W' ? 'W0' : 'face') : f === 3 ? 'side' : (COL[t] ? t : 'g') + l);
  }
  for (const [x, y] of world.ramps) put(x, y, 'ramp');
  for (const t of world.trees) put(t.x, t.y, t.kind === 'pine' ? 'pine' : t.kind === 'blossom' ? 'blossom' : 'tree');
  for (const t of world.fruitTrees) put(t.x, t.y, 'fruit');
  for (const t of world.palms) put(t.x, t.y, 'tree');
  for (const f of world.flowers) put(f.x, f.y, 'flower', 2);
  for (const p of world.props) put(p.x, p.y, 'prop', 3);
  for (const [id, b] of Object.entries(world.buildings)) for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) put(b.x + i, b.y + j, id === 'home' ? 'home' : 'bld');
  for (const s of Object.values(world.spots)) put(s.x, s.y, 'spot', 2);
  fs.writeFileSync(preview, writeIndexed(w, h, px, Uint8Array.from(pal.concat(new Array(768 - pal.length).fill(0)))));
  console.log('preview ->', preview);
  process.exit(0);
}

const { paintGround } = await import('./island/paint.mjs');
const { writeGround } = await import('./lib/ground.mjs');
const g = paintGround(paint, world, path.join(ROOT, 'scripts/island/source'));
const png = opt('--png', null);
if (png) {
  // just the picture, in summer's colors, to look at
  const pal = JSON.parse(fs.readFileSync(path.join(ROOT, 'game/assets/ground-palettes.json'), 'utf8')).summer, rgb = new Uint8Array(768);
  for (let i = 0; i < 768; i++) rgb[i] = parseInt(pal.substr(i * 2, 2), 16);
  fs.writeFileSync(png, writeIndexed(g.w, g.h, g.px, rgb));
  fs.writeFileSync(png.replace(/\.png$/, '.json'), formatJson(world, 1));
  console.log(`painted in ${Date.now() - t0} ms -> ${png}`);
  process.exit(0);
}
writeGround(path.join(ROOT, 'game/assets/ground'), g.w, g.h, g.px, g.pal);
fs.writeFileSync(path.join(ROOT, 'game/assets/world.json'), formatJson(world, 1));
console.log(`painted and written in ${Date.now() - t0} ms`);
