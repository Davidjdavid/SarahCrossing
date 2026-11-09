// A quick look at the game: node seldom/tests/shot.mjs OUTDIR "query" 'js steps...'
// Steps run in the page with window.__seldom available (debug mode); "shot:name" takes a screenshot.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import path from 'node:path';
import url from 'node:url';
const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const [out, query, ...steps] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1152, height: 648 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e.stack || e)));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
await page.goto('file://' + path.join(HERE, '..', 'seldom.html') + '?debug&' + (query || ''));
await page.waitForTimeout(300);
for (const s of steps) {
  if (s.startsWith('shot:')) { await page.screenshot({ path: path.join(out, s.slice(5) + '.png') }); continue; }
  if (s.startsWith('wait:')) { await page.waitForTimeout(+s.slice(5)); continue; }
  if (s.startsWith('key:')) { const [k, ms] = s.slice(4).split('@'); await page.keyboard.down(k); await page.waitForTimeout(+(ms || 80)); await page.keyboard.up(k); continue; }
  const r = await page.evaluate(s);
  if (r !== undefined) console.log('>', JSON.stringify(r));
}
if (errors.length) console.log('ERRORS:\n' + errors.join('\n'));
await browser.close();
