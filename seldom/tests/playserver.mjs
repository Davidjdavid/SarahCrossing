// A game held open in a headless browser, played over HTTP (for playtesting by an agent that only sees the screen).
// node seldom/tests/playserver.mjs PORT SHOTS_DIR
//   GET /do?k=right:800,z,shift+left:500,wait:1000   hold keys (ms), press (no ms), several at once with +
//   GET /shot                                        a screenshot; answers with its path
//   GET /text                                        what's written on screen right now (dialogue, choices, notices)
import http from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';
import url from 'node:url';
const { chromium } = createRequire(import.meta.url)('playwright');
const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const PORT = +(process.argv[2] || 8765), SHOTS = process.argv[3] || '/tmp', SETUP = process.argv[4] || '';
const KEYS = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', z: 'z', x: 'x', c: 'c', q: 'q', e: 'e', n: 'n', tab: 'Tab', esc: 'Escape', shift: 'Shift', space: 'Space', enter: 'Enter', w: 'w', a: 'a', s: 's', d: 'd' };
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1152, height: 648 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e.message || e)));
await page.goto('file://' + path.join(HERE, '..', 'seldom.html') + '?debug');
await page.evaluate(() => { try { localStorage.clear(); } catch (e) { } });
if (SETUP) { await page.waitForTimeout(300); await page.evaluate(SETUP); }
let n = 0;
async function act(spec) {
    for (const part of spec.split(',').map(s => s.trim()).filter(Boolean)) {
        const [k, ms] = part.split(':');
        if (k === 'wait') { await page.waitForTimeout(+ms || 500); continue; }
        const keys = k.split('+').map(x => KEYS[x.toLowerCase()] || x);
        for (const key of keys) await page.keyboard.down(key);
        await page.waitForTimeout(ms ? +ms : 90);
        for (const key of keys.reverse()) await page.keyboard.up(key);
        await page.waitForTimeout(60);
    }
}
http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x');
    try {
        if (u.pathname === '/do') { await act(u.searchParams.get('k') || ''); res.end('ok'); return; }
        if (u.pathname === '/shot') { const p = path.join(SHOTS, 'play-' + String(++n).padStart(3, '0') + '.png'); await page.screenshot({ path: p }); res.end(p); return; }
        if (u.pathname === '/text') {
            const t = await page.evaluate(() => {
                const out = [];
                if (Talk.cur) { out.push((Talk.cur.who ? (NAMES[Talk.cur.who] || Talk.cur.who) + ': ' : '') + Talk.cur.text); if (Talk.cur.options) out.push('choices: ' + Talk.cur.options.map((o, i) => (i === Talk.choice ? '> ' : '  ') + o).join(' | ')); }
                if (Fx.toasts.length) out.push('notice: ' + Fx.toasts[0].text);
                if (UI.hintT > 0 && UI.hint) out.push('hint: ' + UI.hint);
                if (UI.areaT > 0 && UI.areaName) out.push('area: ' + UI.areaName);
                for (const e of (World.map ? World.map.ents : [])) if (e.bubble && e.seen) out.push((NAMES[e.name] || e.name) + ' (bubble): ' + e.bubble);
                if (G.state === 'notebook') out.push('notebook open: ' + LAWS.filter(l => Notebook.got[l.key]).map(l => l.title + ': ' + l.text).join(' / '));
                return out.join('\n') || '(nothing written on screen)';
            });
            res.end(t + (errors.length ? '\nPAGE ERRORS: ' + errors.join('; ') : '')); return;
        }
        res.statusCode = 404; res.end('?');
    } catch (e) { res.statusCode = 500; res.end(String(e)); }
}).listen(PORT, () => console.log('playserver on ' + PORT));
