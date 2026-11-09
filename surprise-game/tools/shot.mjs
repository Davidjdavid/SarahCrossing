// Screenshots of the built game, driven through window.__dbg. node tools/shot.mjs out-dir [script.json]
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const req = (m) => { try { return require(m); } catch { return require(require('node:child_process').execSync(`node -e "console.log(require.resolve('${m}'))"`).toString().trim()); } };
const { chromium } = req('playwright');
import path from 'node:path';
import fs from 'node:fs';
import { ROOT } from './headless.mjs';
const out = process.argv[2] || '/tmp/shots';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 768, height: 576 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('file://' + path.join(ROOT, 'play.html') + '?debug');
await page.waitForTimeout(400);
const snap = async (name) => { await page.waitForTimeout(450); await page.locator('#game').screenshot({ path: path.join(out, name + '.png') }); };
await snap('00-title');
const steps = JSON.parse(process.argv[3] || '[]');
for (const s of steps) {
  if (s.key) { for (const k of [].concat(s.key)) { await page.keyboard.press(k); await page.waitForTimeout(s.wait ?? 160); } }
  if (s.eval) { await page.evaluate(s.eval); await page.waitForTimeout(s.wait ?? 100); }
  if (s.shot) await snap(s.shot);
}
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
await browser.close();
