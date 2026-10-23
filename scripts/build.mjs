// Builds the game into dist/, ready for the server (or any static host) to serve.
//
//   node scripts/build.mjs            (npm run build)
//
// dist/
//   index.html                  the page, pointing at the files below
//   assets/game-<hash>.js       game/src/*.js, joined in file-name order (one script,
//                               so the 'use strict' at the top covers all of it)
//   assets/data-<hash>.js       the sprite table, world and game data (game/assets/*.json)
//   assets/style-<hash>.css     game/style.css
//   assets/atlas-<hash>.png     the sprites
//   assets/ground-<hash>.png    the island ground (recolored per season in the browser)
//   build.json                  { version, commit, builtAt }
//
// A file's name changes whenever its content does, so browsers can keep the
// assets forever and still never run an old copy.
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const GAME = path.join(ROOT, 'game');
const DIST = path.resolve(process.env.DIST_DIR || path.join(ROOT, 'dist'));

const read = (rel) => fs.readFileSync(path.join(GAME, rel));
const readJson = (rel) => JSON.parse(read(rel).toString('utf8'));
const hash = (buf) => crypto.createHash('sha256').update(buf).digest('hex').slice(0, 10);

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, 'assets'), { recursive: true });

/** Write dist/assets/<name>-<hash><ext> and give back its URL (relative to the page). */
function emit(name, ext, content) {
  const buf = Buffer.isBuffer(content) ? content : Buffer.from(content);
  const file = `assets/${name}-${hash(buf)}${ext}`;
  fs.writeFileSync(path.join(DIST, file), buf);
  return file;
}

// ---------------------------------------------------------------- code
const sources = fs
  .readdirSync(path.join(GAME, 'src'))
  .filter((f) => f.endsWith('.js'))
  .sort();
const code = sources.map((f) => read(`src/${f}`).toString('utf8')).join('');
const gameJs = emit('game', '.js', code);

// ---------------------------------------------------------------- data
const atlasPng = emit('atlas', '.png', read('assets/atlas.png'));
const groundPng = emit('ground', '.png', read('assets/ground.png'));
const data = [
  `window.ATLAS_PNG = ${JSON.stringify(atlasPng)};`,
  `window.GROUND_PNG = ${JSON.stringify(groundPng)};`,
  `window.ATLAS_JSON = ${JSON.stringify(readJson('assets/atlas.json'))};`,
  `window.GROUND_PAL = ${JSON.stringify(readJson('assets/ground-palettes.json'))};`,
  `window.WORLD_JSON = ${JSON.stringify(readJson('assets/world.json'))};`,
  `window.GAMEDATA = ${JSON.stringify(readJson('assets/gamedata.json'))};`,
  '',
].join('\n');
const dataJs = emit('data', '.js', data);
const styleCss = emit('style', '.css', read('style.css'));

// ---------------------------------------------------------------- page
let page = read('index.html').toString('utf8');
for (const [from, to] of [
  ['href="style.css"', `href="${styleCss}"`],
  ['src="data.js"', `src="${dataJs}"`],
  ['src="game.js"', `src="${gameJs}"`],
]) {
  if (!page.includes(from)) throw new Error(`game/index.html has no ${from}`);
  page = page.replace(from, to);
}
fs.writeFileSync(path.join(DIST, 'index.html'), page);

// ---------------------------------------------------------------- version
let commit = process.env.GITHUB_SHA || '';
if (!commit) {
  try {
    commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    commit = '';
  }
}
const builtAt = new Date().toISOString();
const version = process.env.APP_VERSION || `${builtAt.slice(0, 19).replace(/[-:]/g, '').replace('T', '-')}${commit ? '-' + commit.slice(0, 7) : ''}`;
fs.writeFileSync(path.join(DIST, 'build.json'), JSON.stringify({ version, commit, builtAt }, null, 2) + '\n');

const kb = (f) => Math.round(fs.statSync(path.join(DIST, f)).size / 1024);
console.log(`Built ${version}: ${sources.length} code files, game ${kb(gameJs)} KB, data ${kb(dataJs)} KB -> ${path.relative(ROOT, DIST)}/`);
