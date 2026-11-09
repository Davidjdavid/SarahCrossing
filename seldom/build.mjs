// Builds the game into one HTML file (seldom.html) that opens straight from disk, no server needed.
// The sources are one script, joined in file-name order (src/00_core.js first, src/90_main.js last).
// node seldom/build.mjs [--test]   (--test also writes tests/game.js: the script without the page, for node tests)
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const SRC = path.join(HERE, 'src');

export function joinSources() {
    const files = fs.readdirSync(SRC).filter(f => f.endsWith('.js')).sort();
    return files.map(f => `/* ---- ${f} ---- */\n` + fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n');
}

export function page(js) {
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<title>Seldom</title>
<style>
html, body { margin: 0; height: 100%; background: #000; overflow: hidden; }
canvas { display: block; width: 100vw; height: 100vh; outline: none; image-rendering: pixelated; touch-action: none; }
</style>
</head>
<body>
<canvas id="game" tabindex="0"></canvas>
<script>
${js}
</script>
</body>
</html>
`;
}

const js = joinSources();
fs.writeFileSync(path.join(HERE, 'seldom.html'), page(js));
console.log('wrote seldom/seldom.html', Math.round(js.length / 1024) + ' KB of script');
