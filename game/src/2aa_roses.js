/* ---- 2aa_roses.js ---- */
/* Roses (David, 27 October, with Animal Crossing's flowers: "flowers are kinda an important part"): a fifth kind, from
   Fortune's seeds only (none grow wild), red, white or yellow, and two hybrids (2ab_hybrids.js: pink, blue). The items are
   in gamedata.json; the pictures are drawn here (the atlas has none): a round cup of petals with a deeper swirl over the
   tulip's stem and leaves, and the seed packet is the tulip's repainted. In the new look it's flowers.py's flower_rose. */
const ROSE_COLORS = [['d8283c', '98182a'], ['ffffff', 'cfc6dc'], ['ffd84a', 'd8982a'], ['ff9ec0', 'e0607a'], ['8cb4ff', '5874d0']];
const ROSE_HEAD = [
    '............',
    '....####....',
    '..##RRRR##..',
    '.#RRrrrrRR#.',
    '.#RrRRRRrR#.',
    '.#RrRrrRrR#.',
    '.#RRrRRrRR#.',
    '..#RrrrrR#..',
    '...##RR##...',
];
ASSET_MAKERS.push(() => {
    const st = Assets.frames.fl_tulip_0, sd = Assets.frames.seed_fl_tulip;
    if (!st) return;
    const hex = h => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    ROSE_COLORS.forEach(([main, deep], ci) => {
        const [x, y, w, h, ax, ay] = st, c = document.createElement('canvas');
        c.width = w; c.height = h;
        const g = c.getContext('2d');
        // the tulip's stem and leaves below its cup, then the rose's head over the top
        g.drawImage(Assets.atlas, x, y + 9, w, h - 9, 0, 9, w, h - 9);
        const img = g.getImageData(0, 0, w, h), d = img.data, P = { '#': hex('2d2230'), R: hex(main), r: hex(deep) };
        ROSE_HEAD.forEach((row, j) => [...row].forEach((ch, i) => { const p = P[ch], k = (j * w + i) * 4; if (p) { d[k] = p[0]; d[k + 1] = p[1]; d[k + 2] = p[2]; d[k + 3] = 255; } }));
        g.putImageData(img, 0, 0);
        Assets.dyn[`fl_rose_${ci}`] = { c, w, h, ax, ay };
    });
    if (sd) {
        const [x, y, w, h, ax, ay] = sd, c = document.createElement('canvas');
        c.width = w; c.height = h;
        const g = c.getContext('2d');
        g.drawImage(Assets.atlas, x, y, w, h, 0, 0, w, h);
        const img = g.getImageData(0, 0, w, h), d = img.data, to = { e0405a: hex('d8283c'), b3263a: hex('98182a') };
        for (let k = 0; k < d.length; k += 4) { const t = to[((d[k] << 16) | (d[k + 1] << 8) | d[k + 2]).toString(16).padStart(6, '0')]; if (t) { d[k] = t[0]; d[k + 1] = t[1]; d[k + 2] = t[2]; } }
        g.putImageData(img, 0, 0);
        Assets.dyn.seed_fl_rose = { c, w, h, ax, ay };
    }
});
