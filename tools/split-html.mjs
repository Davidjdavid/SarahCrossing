// Splits the one-file Sarah Crossing page (as published from claude.ai) into this
// repository's source tree. It was used once, to start the repository from
// Sarah_Crossing2.html; it's kept so a newer one-file version can be compared or
// brought in the same way.
//
//   node tools/split-html.mjs <Sarah_Crossing.html> [out-dir, default game/]
//
// Writes:
//   index.html      the page (head, markup, the two scripts)
//   style.css       the styles
//   src/*.js        the game code, one file per "/* ---- name.js ---- */" section
//   assets/         atlas.png + atlas.json (sprites), ground.png + ground-palettes.json
//                   (the island ground, recolored per season), world.json, gamedata.json
//
// It refuses to overwrite src/ files that differ from what it would write, unless
// --force is given, so edits made in the repository can't be lost by accident.
import fs from 'node:fs';
import path from 'node:path';
import { formatJson } from '../scripts/json-format.mjs';

const args = process.argv.slice(2);
const force = args.includes('--force');
const [input, outArg] = args.filter((a) => a !== '--force');
if (!input) {
  console.error('usage: node tools/split-html.mjs <Sarah_Crossing.html> [out-dir] [--force]');
  process.exit(2);
}
const OUT = path.resolve(outArg || 'game');
const html = fs.readFileSync(input, 'utf8');

// ---------------------------------------------------------------- the parts
const styleStart = html.indexOf('<style>\n');
const styleEnd = html.indexOf('</style>', styleStart);
if (styleStart < 0 || styleEnd < 0) throw new Error('no <style> block');
const css = html.slice(styleStart + '<style>\n'.length, styleEnd);

const appStart = html.indexOf('<div id="app">');
const appEnd = html.indexOf('\n<script>', appStart);
if (appStart < 0 || appEnd < 0) throw new Error('no <div id="app">');
const markup = html.slice(appStart, appEnd).trimEnd();

// The fonts and other <head> links between <title> and the styles.
const titleEnd = html.indexOf('</title>');
const headLinks = html.slice(titleEnd + '</title>'.length, styleStart).trim();

// The data script: one `window.NAME = value;` per line.
const dataStart = html.indexOf('<script>\n', appEnd) + '<script>\n'.length;
const dataEnd = html.indexOf('</script>', dataStart);
const data = {};
for (const line of html.slice(dataStart, dataEnd).split('\n')) {
  const m = /^window\.([A-Z_]+) = /.exec(line);
  if (!m) continue;
  let value = line.slice(m[0].length).trim();
  if (value.endsWith(';')) value = value.slice(0, -1);
  data[m[1]] = JSON.parse(value);
}
for (const k of ['ATLAS_PNG', 'ATLAS_JSON', 'GROUND_IDX', 'GROUND_PAL', 'WORLD_JSON', 'GAMEDATA']) {
  if (!(k in data)) throw new Error(`the data script has no window.${k}`);
}

// The game script, cut at its section markers.
const codeStart = html.indexOf('<script>\n', dataEnd) + '<script>\n'.length;
const codeEnd = html.lastIndexOf('</script>');
const code = html.slice(codeStart, codeEnd);
const MARKER = /^\/\* ---- ([0-9a-z_]+\.js) ---- \*\/$/gm;
const marks = [...code.matchAll(MARKER)];
if (!marks.length || marks[0].index !== 0) throw new Error('the game script does not start with a section marker');
const modules = marks.map((m, i) => ({ name: m[1], text: code.slice(m.index, i + 1 < marks.length ? marks[i + 1].index : code.length) }));
const sorted = modules.map((m) => m.name).slice().sort();
if (sorted.join() !== modules.map((m) => m.name).join()) throw new Error('the sections are not in file-name order, so the build would put them in a different order');

// ---------------------------------------------------------------- write
function write(rel, content) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (!force && rel.startsWith('src/') && fs.existsSync(file) && !fs.readFileSync(file).equals(Buffer.from(content))) {
    throw new Error(`${rel} has changed in the repository; run again with --force to replace it`);
  }
  fs.writeFileSync(file, content);
}

const png = (dataUrl) => Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');

write('assets/atlas.png', png(data.ATLAS_PNG));
write('assets/atlas.json', formatJson(data.ATLAS_JSON, 1));
write('assets/ground.png', Buffer.from(data.GROUND_IDX, 'base64'));
write('assets/ground-palettes.json', formatJson(data.GROUND_PAL, 1));
write('assets/world.json', formatJson(data.WORLD_JSON, 2));
write('assets/gamedata.json', formatJson(data.GAMEDATA, 2));
write('style.css', css);
for (const m of modules) write(`src/${m.name}`, m.text);
write(
  'index.html',
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Sarah Crossing</title>
${headLinks}
<link rel="stylesheet" href="style.css">
</head>
<body>
${markup}
<script src="data.js"></script>
<script src="game.js"></script>
</body>
</html>
`,
);
console.log(`Wrote ${modules.length} code files and the assets to ${path.relative(process.cwd(), OUT) || '.'}`);
