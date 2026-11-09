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
const out = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(ROOT, 'play.html');
fs.writeFileSync(out, page);
/* the same page for a host that supplies its own document wrapper (--artifact out.html) */
const ai = process.argv.indexOf('--artifact');
if (ai > 0) {
    const bare = page.replace(/<!doctype html>\s*/i, '').replace(/<html[^>]*>\s*/i, '').replace(/<\/html>\s*/i, '')
        .replace(/<head>\s*/i, '').replace(/<\/head>\s*/i, '').replace(/<body>\s*/i, '').replace(/<\/body>\s*/i, '')
        .replace(/<meta charset="utf-8">\s*/i, '').replace(/<meta name="viewport"[^>]*>\s*/i, '');
    fs.writeFileSync(process.argv[ai + 1], bare);
    console.log('built ' + process.argv[ai + 1]);
}
console.log(`built ${path.relative(process.cwd(), out)} (${(page.length / 1024).toFixed(0)} KB, ${files.length} files)`);
