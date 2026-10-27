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
  for (const name of ['tree_round_a', 'tree_round_b_fall', 'tree_round_a_spring', 'tree_round_b_winter', 'tree_round_a_lod1', 'palm_ac', 'fruit_apple', 'fruit_coconut', 'bush_round', 'bush_fall', 'cottage', 'shop', 'wall2_a', 'wall_corner', 'bench', 'lamp', 'pine_a', 'pine_a_lod1', 'sunflowers', 'flowers_mixed', 'fountain', 'windmill', 'windmill_sails', 'tent_1', 'campfire', 'statue_david', 'house_body_gable', 'house_roof_thatch', 'house_roof_gable_rainbow', 'house_pattern_brick', 'house_chimney', 'noodle_cart', 'bld_postoffice', 'bld_townhall', 'bld_bank', 'bld_museum', 'bld_boutique', 'bld_salon', 'bld_studio', 'bld_displays', 'bld_restaurant', 'bld_arcade', 'bld_club', 'bld_builder', 'bld_lighthouse', 'bld_barn', 'crop_soil', 'crop_cabbage', 'crop_wheat', 'crop_pumpkin', ...['maki', 'kai', 'basil', 'wonton', 'chili', 'coco', 'cece', 'clementine', 'cuke', 'sully', 'ginger', 'brulee', 'mac', 'fortune', 'goat', 'floss', 'waffle', 'wasabi', 'floret', 'stalk', 'sprout', 'ghost'].map(n => 'folk_' + n), ...['robin', 'bluebird', 'sparrow', 'gull', 'owl', 'squirrel', 'rabbit', 'deer', 'crab', 'duck', 'frog', 'butterfly0', 'butterfly3'].map(n => 'critter_' + n), ...['bed_simple', 'table_wood', 'shelf_book', 'counter_shop', 'kiln', 'tractor', 'lh_lens', 'dining_table', 'salon_chair', 'snack_machine'].map(n => 'furn_' + n)]) assert.ok(window.MODELS[name], name);
  for (const f of Object.values(window.MODELS)) assert.equal(fs.readFileSync(path.join(dist, f)).subarray(0, 4).toString(), 'glTF', f);
  // and the ground's surfaces: a color, a normal map and a height for each
  for (const s of ['flagstones', 'path']) for (const k of ['col', 'nrm', 'hgt']) assert.ok(window.TEXTURES[`${s}_${k}`], `${s}_${k}`);
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

// the models are packed small for the browser (scripts/glb-pack.mjs); EnvModels.unpack turns them back into numbers
function readGlb(buf) {
  const json = JSON.parse(buf.subarray(20, 20 + buf.readUInt32LE(12)).toString('utf8'));
  const binAt = 20 + buf.readUInt32LE(12), bin = buf.subarray(binAt + 8, binAt + 8 + buf.readUInt32LE(binAt));
  const size = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
  const read = { 5120: ['readInt8', 1, 127], 5121: ['readUInt8', 1, 255], 5122: ['readInt16LE', 2, 32767], 5123: ['readUInt16LE', 2, 65535], 5126: ['readFloatLE', 4, 1] };
  const values = (i) => {
    const a = json.accessors[i], v = json.bufferViews[a.bufferView], n = size[a.type], [fn, bytes, max] = read[a.componentType];
    const stride = v.byteStride || n * bytes, at = (v.byteOffset || 0) + (a.byteOffset || 0), out = [];
    for (let k = 0; k < a.count; k++) for (let j = 0; j < n; j++) { const x = bin[fn](at + k * stride + j * bytes); out.push(a.normalized ? Math.max(-1, x / max) : x); }
    return out;
  };
  return { json, values };
}
test('the models are packed smaller, and unpack to the points Blender wrote', async () => {
  const { packGlb } = await import('../scripts/glb-pack.mjs');
  for (const name of ['folk2_kai', 'cottage', 'doll_kit']) {
    const raw = fs.readFileSync(path.join(ROOT, 'game/assets/models', name + '.glb')), packed = packGlb(raw);
    // (the cottage is mostly its baked pictures, which stay as they are)
    assert.ok(packed.length < raw.length * (name === 'cottage' ? 1 : 0.8), `${name}: ${packed.length} of ${raw.length}`);
    const a = readGlb(raw), b = readGlb(packed);
    assert.equal(b.json.nodes.length, a.json.nodes.length);
    let meshes = 0;
    a.json.nodes.forEach((na, i) => {
      const nb = b.json.nodes[i];
      assert.equal(nb.name, na.name);
      assert.deepEqual(nb.translation, na.translation, `${name} ${na.name} keeps its origin`);
      if (na.mesh === undefined) return;
      meshes++;
      const s = (nb.scale || [1, 1, 1])[0] / (na.scale || [1, 1, 1])[0];
      a.json.meshes[na.mesh].primitives.forEach((pa, k) => {
        const pb = b.json.meshes[nb.mesh].primitives[k];
        for (const [sem, ia] of Object.entries(pa.attributes)) {
          const va = a.values(ia), vb = b.values(pb.attributes[sem]);
          assert.equal(vb.length, va.length);
          const tol = sem === 'NORMAL' ? 0.02 : sem === 'POSITION' ? s / 32767 : 2e-5;
          let worst = 0;
          for (let j = 0; j < va.length; j++) worst = Math.max(worst, Math.abs((sem === 'POSITION' ? vb[j] * s : vb[j]) - va[j]));
          assert.ok(worst <= tol, `${name} ${na.name} ${sem}: off by ${worst}`);
        }
      });
    });
    assert.ok(meshes > 0);
  }
});

test('no two files of the game declare the same top-level function (in one joined script the later one silently wins)', () => {
  const dir = path.join(ROOT, 'game/src'), seen = {};
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort()) {
    for (const m of fs.readFileSync(path.join(dir, f), 'utf8').matchAll(/^(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)\s*\(/gm)) (seen[m[1]] ||= []).push(f);
  }
  assert.deepEqual(Object.entries(seen).filter(([, v]) => v.length > 1).map(([k, v]) => `${k}: ${v.join(', ')}`), []);
});
