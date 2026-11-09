// Joins src/*.js in file-name order into one script and puts it in the page: play.html.
// node tools/build.mjs [out.html]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT } from './headless.mjs';

const files = fs.readdirSync(path.join(ROOT, 'src')).filter(f => f.endsWith('.js')).sort();
const js = files.map(f => `/* ---- ${f} ---- */\n` + fs.readFileSync(path.join(ROOT, 'src', f), 'utf8')).join('\n');
const tmp = path.join(ROOT, '.build-check.js');
fs.writeFileSync(tmp, js);
try { execFileSync(process.execPath, ['--check', tmp], { stdio: 'inherit' }); } finally { fs.rmSync(tmp, { force: true }); }
const page = fs.readFileSync(path.join(ROOT, 'tools/template.html'), 'utf8').replace('/*@@GAME@@*/', () => js.replace(/<\/script/gi, '<\\/script'));
const out = process.argv[2] || path.join(ROOT, 'play.html');
fs.writeFileSync(out, page);
console.log(`built ${path.relative(process.cwd(), out)} (${(page.length / 1024).toFixed(0)} KB, ${files.length} files)`);
