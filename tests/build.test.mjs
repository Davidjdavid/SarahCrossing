// npm run build: the page, its hashed files and the joined-up game code.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { ROOT } from './helpers.mjs';

let dist;
before(() => {
  dist = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-dist-'));
  execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: ROOT, env: { ...process.env, DIST_DIR: dist }, stdio: 'ignore' });
});
after(() => fs.rmSync(dist, { recursive: true, force: true }));

const page = () => fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const asset = (re) => re.exec(page())[1];

test('the page points at files that exist, named by their content', () => {
  const refs = [...page().matchAll(/(?:src|href)="(assets\/[^"]+)"/g)].map((m) => m[1]);
  assert.equal(refs.length, 6, refs.join());
  for (const ref of refs) {
    assert.match(ref, /-[0-9a-f]{10}\.(js|css|png|webmanifest)$/);
    assert.ok(fs.existsSync(path.join(dist, ref)), ref);
  }
});

test('icons for the browser tab and the home screen, and the manifest that names them', () => {
  assert.equal(fs.readFileSync(path.join(dist, 'favicon.png')).subarray(1, 4).toString(), 'PNG');
  const manifest = JSON.parse(fs.readFileSync(path.join(dist, asset(/href="(assets\/manifest-[^"]+)"/)), 'utf8'));
  assert.equal(manifest.name, 'Sarah Crossing');
  for (const icon of manifest.icons) {
    const png = fs.readFileSync(path.join(dist, icon.src.slice(1)));
    const [w, h] = icon.sizes.split('x').map(Number);
    assert.equal(png.readUInt32BE(16), w);
    assert.equal(png.readUInt32BE(20), h);
  }
});

test('the game code is game/src joined in file-name order, and is valid JavaScript', () => {
  const js = fs.readFileSync(path.join(dist, asset(/src="(assets\/game-[^"]+)"/)), 'utf8');
  const files = fs.readdirSync(path.join(ROOT, 'game/src')).filter((f) => f.endsWith('.js')).sort();
  assert.equal(js, files.map((f) => fs.readFileSync(path.join(ROOT, 'game/src', f), 'utf8')).join(''));
  assert.ok(js.startsWith("/* ---- 00_core.js ---- */\n/* Sarah Crossing - core helpers */\n'use strict';"), 'strict mode covers all of it');
  execFileSync(process.execPath, ['--check', path.join(dist, asset(/src="(assets\/game-[^"]+)"/))]);
});

test('the data script holds the sprites, world and game data, and points at the pictures', () => {
  const window = {};
  new Function('window', fs.readFileSync(path.join(dist, asset(/src="(assets\/data-[^"]+)"/)), 'utf8'))(window);
  assert.deepEqual(Object.keys(window).sort(), ['ATLAS_JSON', 'ATLAS_PNG', 'GAMEDATA', 'GROUND', 'GROUND_PAL', 'HDW_JS', 'LAB', 'MODELS', 'TEXTURES', 'WORLD_JSON']);
  // the models made in Blender (tools/blender/): every one a GLB, the tree, the cottage and the wall among them
  for (const name of ['tree_round_a', 'tree_round_b_fall', 'tree_round_a_lod1', 'palm_ac', 'fruit_apple', 'fruit_coconut', 'bush_round', 'bush_fall', 'cottage', 'shop', 'wall2_a', 'wall_corner', 'bench', 'lamp', 'pine_a', 'pine_a_lod1', 'sunflowers', 'flowers_mixed']) assert.ok(window.MODELS[name], name);
  for (const f of Object.values(window.MODELS)) assert.equal(fs.readFileSync(path.join(dist, f)).subarray(0, 4).toString(), 'glTF', f);
  // and the ground's surfaces: a color, a normal map and a height for each
  for (const s of ['flagstones', 'path', 'lawn']) for (const k of ['col', 'nrm', 'hgt']) assert.ok(window.TEXTURES[`${s}_${k}`], `${s}_${k}`);
  // the ground: every piece, and the map's copy, is a picture; together they cover the island
  const G = window.GROUND;
  assert.equal(G.urls.length, G.cols * G.rows);
  assert.ok(G.cols * G.size >= window.WORLD_JSON.w * 16 && G.rows * G.size >= window.WORLD_JSON.h * 16, 'the pieces cover the island');
  // the test area (?lab) has its own small world and ground
  const L = window.LAB;
  assert.ok(L.ground.cols * L.ground.size >= L.world.w * 16 && L.ground.rows * L.ground.size >= L.world.h * 16, "the test area's pieces cover it");
  assert.ok(L.world.buildings.home && L.world.buildings.shop && L.world.waterfalls.length, 'the test area has the cottage, the shop and a waterfall');
  for (const f of [window.ATLAS_PNG, G.map, ...G.urls, L.ground.map, ...L.ground.urls]) {
    const png = fs.readFileSync(path.join(dist, f));
    assert.equal(png.subarray(1, 4).toString(), 'PNG', f);
  }
  // the HD drawing worker: the house looks and the 32*.js files, a script that parses
  const hdw = path.join(dist, window.HDW_JS);
  assert.match(window.HDW_JS, /^assets\/hdw-[0-9a-f]{10}\.js$/);
  execFileSync(process.execPath, ['--check', hdw]);
  assert.ok(fs.readFileSync(hdw, 'utf8').includes('HD_SPR'));
  assert.deepEqual(window.GAMEDATA, JSON.parse(fs.readFileSync(path.join(ROOT, 'game/assets/gamedata.json'), 'utf8')));
  assert.ok(window.ATLAS_JSON.sarah_crimson_down_stand);
  assert.equal(window.WORLD_JSON.grid.length, window.WORLD_JSON.h);
});

test('build.json says which version this is', () => {
  const b = JSON.parse(fs.readFileSync(path.join(dist, 'build.json'), 'utf8'));
  assert.match(b.version, /^\d{8}-\d{6}/);
  assert.ok(b.builtAt);
});
