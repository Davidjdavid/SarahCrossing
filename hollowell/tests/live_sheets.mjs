// Contact sheets of a live run's pictures (tests/live_run.mjs): 12 to a sheet, each at twice size with a caption (its
// number, where, why). Usage: node tests/live_sheets.mjs RUNDIR [per=12]. Writes RUNDIR/sheets/sheet_NNN.png and
// RUNDIR/sheets/sheets.json (which pictures are on which sheet).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)('playwright');
const RUN = path.resolve(process.argv[2]);
const PER = +(process.argv[3] || 12);
const index = JSON.parse(fs.readFileSync(path.join(RUN, 'index.json'), 'utf8'));
const OUT = path.join(RUN, 'sheets');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
const sheets = [];
for (let s = 0; s * PER < index.length; s++) {
    const items = index.slice(s * PER, s * PER + PER).map(it => ({ ...it, data: 'data:image/png;base64,' + fs.readFileSync(path.join(RUN, it.file)).toString('base64') }));
    const png = await page.evaluate(async items => {
        const cols = 3, cw = 640, ch = 360, cap = 34, c = document.createElement('canvas');
        c.width = cols * cw + (cols + 1) * 8; c.height = Math.ceil(items.length / cols) * (ch + cap + 8) + 8;
        const x = c.getContext('2d'); x.fillStyle = '#222'; x.fillRect(0, 0, c.width, c.height); x.imageSmoothingEnabled = false;
        for (let i = 0; i < items.length; i++) {
            const it = items[i], im = new Image(); im.src = it.data; await im.decode();
            const px = 8 + (i % cols) * (cw + 8), py = 8 + Math.floor(i / cols) * (ch + cap + 8);
            x.drawImage(im, px, py, cw, ch);
            x.fillStyle = '#fff'; x.font = 'bold 15px sans-serif';
            x.fillText(`#${it.file.replace('.png', '')}  ${it.why}  leg ${it.leg}  ${it.area}${it.room ? ' / ' + it.room : ''}  @${it.x},${it.y}`, px, py + ch + 15);
            x.fillStyle = '#bbb'; x.font = '12px sans-serif';
            x.fillText((it.text || '').slice(0, 95), px, py + ch + 30);
        }
        return c.toDataURL('image/png');
    }, items);
    const name = 'sheet_' + String(s).padStart(3, '0') + '.png';
    fs.writeFileSync(path.join(OUT, name), Buffer.from(png.split(',')[1], 'base64'));
    sheets.push({ sheet: name, pictures: items.map(i => i.file) });
}
fs.writeFileSync(path.join(OUT, 'sheets.json'), JSON.stringify(sheets, null, 1));
console.log(`${sheets.length} sheets in ${OUT}`);
await browser.close();
