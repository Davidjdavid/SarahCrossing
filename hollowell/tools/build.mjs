// Builds the game: src/*.js joined in file-name order into one script (00_core.js has the
// 'use strict' that covers all of it), then written out as
//   dist/hollowell.js   the script alone (the headless tests load this)
//   play.html           the whole game in one file: double-click it to play
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'src');
const files = fs.readdirSync(SRC).filter(f => f.endsWith('.js')).sort();
let js = '';
for (const f of files) js += `\n// ---- ${f} ----\n` + fs.readFileSync(path.join(SRC, f), 'utf8');

let version = '0.0.0';
try { version = JSON.parse(fs.readFileSync(path.join(ROOT, 'version.json'), 'utf8')).version; } catch {}
js = js.replace(/__VERSION__/g, version);

fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'dist', 'hollowell.js'), js);

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Hollowell</title>
<style>
html, body { margin: 0; height: 100%; background: #17121a; overflow: hidden; }
canvas { position: fixed; left: 0; top: 0; width: 100vw; height: 100vh; display: block; outline: none; image-rendering: pixelated; }
</style>
</head>
<body>
<canvas id="game" tabindex="0"></canvas>
<script>
${js.replace(/<\/script>/g, '<\\/script>')}
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, 'play.html'), html);
/* the same game in a page of its own (published as a link): tools/page.html with the script inside */
const page = fs.readFileSync(path.join(ROOT, 'tools', 'page.html'), 'utf8').replace('/*GAME_JS*/', () => js.replace(/<\/script>/g, '<\\/script>'));
fs.writeFileSync(path.join(ROOT, 'dist', 'hollowell_page.html'), page);
console.log(`built play.html (${(html.length / 1024).toFixed(0)} KB) from ${files.length} files`);
