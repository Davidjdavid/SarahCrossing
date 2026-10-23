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
  assert.equal(refs.length, 5, refs.join());
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
  assert.deepEqual(Object.keys(window).sort(), ['ATLAS_JSON', 'ATLAS_PNG', 'GAMEDATA', 'GROUND_PAL', 'GROUND_PNG', 'WORLD_JSON']);
  for (const k of ['ATLAS_PNG', 'GROUND_PNG']) {
    const png = fs.readFileSync(path.join(dist, window[k]));
    assert.equal(png.subarray(1, 4).toString(), 'PNG', k);
  }
  assert.deepEqual(window.GAMEDATA, JSON.parse(fs.readFileSync(path.join(ROOT, 'game/assets/gamedata.json'), 'utf8')));
  assert.ok(window.ATLAS_JSON.sarah_crimson_down_stand);
  assert.equal(window.WORLD_JSON.grid.length, window.WORLD_JSON.h);
});

test('build.json says which version this is', () => {
  const b = JSON.parse(fs.readFileSync(path.join(dist, 'build.json'), 'utf8'));
  assert.match(b.version, /^\d{8}-\d{6}/);
  assert.ok(b.builtAt);
});
