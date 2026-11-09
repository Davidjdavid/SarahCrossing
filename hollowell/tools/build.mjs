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
body { display: flex; align-items: center; justify-content: center; }
canvas { image-rendering: pixelated; image-rendering: crisp-edges; display: block; outline: none; }
#hint { position: fixed; bottom: 6px; left: 0; right: 0; text-align: center; color: #6a5f6e;
  font: 12px/1.2 system-ui, sans-serif; pointer-events: none; transition: opacity 1s; }
</style>
</head>
<body>
<canvas id="game" tabindex="0"></canvas>
<div id="hint">Arrows/WASD move &middot; Z action &middot; X stick &middot; C tool &middot; Enter menu &middot; F11 full screen</div>
<script>
${js.replace(/<\/script>/g, '<\\/script>')}
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, 'play.html'), html);
console.log(`built play.html (${(html.length / 1024).toFixed(0)} KB) from ${files.length} files`);
