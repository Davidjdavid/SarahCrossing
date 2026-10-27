/* ---- 2ab_hybrids.js ---- */
/* Hybrid flowers (David, 27 October: "hybrid flower colors"): two rarer colors of each kind that never come from seeds,
   only from cross-breeding watered flowers (2a_flowers.js flowerBreed), as in Animal Crossing: a blue or purple daisy, an
   orange or black tulip, a red or chocolate cosmos, a red or black lily. Each is an item of its own (flower_<kind>_3 and
   _4), its picture the kind's picture repainted (from: which color's picture, map: its colors to the hybrid's), its HD
   picture in 32x_hd_outdoor.js and its color in the new look in EnvItems.PETALS.
   How they come: two seed colors side by side make the third (as before), but a quarter of the time the pair makes its
   hybrid instead: colors 0 and 1 the first, 1 and 2 the second (0 and 2 only ever make 1). Two of a hybrid make it again;
   a hybrid beside a seed color mostly makes the seed color, now and then the hybrid; the two hybrids, either. */
const HYBRID_CHANCE = 0.25;
const FLOWER_HYBRIDS = {
    daisy: [{ name: 'Blue daisy', from: 2, map: { ffb8d6: '8cbcff' } }, { name: 'Purple daisy', from: 2, map: { ffb8d6: 'be8cf0' } }],
    tulip: [{ name: 'Orange tulip', from: 0, map: { e0405a: 'ff8c32', b3263a: 'd25e18' } }, { name: 'Black tulip', from: 0, map: { e0405a: '5a3866', b3263a: '3a2046' } }],
    cosmos: [{ name: 'Red cosmos', from: 0, map: { ff8ac0: 'e03040' } }, { name: 'Chocolate cosmos', from: 0, map: { ff8ac0: '7a4028' } }],
    lily: [{ name: 'Red lily', from: 2, map: { ffb8d6: 'e83848', e0607a: 'b02230' } }, { name: 'Black lily', from: 2, map: { ffb8d6: '4e2a4c', e0607a: '2e1832' } }],
};
for (const [kind, hs] of Object.entries(FLOWER_HYBRIDS)) hs.forEach((h, i) => {
    const base = ITEMS[`flower_${kind}_0`];
    ITEMS[`flower_${kind}_${3 + i}`] = { name: h.name, type: 'flower', price: (base ? base.price : 60) * 5, icon: `fl_${kind}_${3 + i}`, kind, hybrid: true };
});
function isHybrid(ci) { return ci >= 3; }
/* the color a pair of watered flowers grows (r: the morning's random numbers) */
function breedColor(a, b, r) {
    if (a === b) return a;
    const ha = isHybrid(a), hb = isHybrid(b);
    if (!ha && !hb) {
        const lo = Math.min(a, b), hi = Math.max(a, b);
        if (hi - lo === 1 && r() < HYBRID_CHANCE) return 3 + lo;
        return 3 - a - b;
    }
    if (ha && hb) return r() < 0.5 ? a : b;
    return r() < 0.2 ? (ha ? a : b) : (ha ? b : a);
}
/* the pictures: the kind's picture repainted, made once the atlas is in */
ASSET_MAKERS.push(() => {
    for (const [kind, hs] of Object.entries(FLOWER_HYBRIDS)) hs.forEach((h, i) => {
        const f = Assets.frames[`fl_${kind}_${h.from}`];
        if (!f) return;
        const [x, y, w, hh, ax, ay] = f, c = document.createElement('canvas');
        c.width = w; c.height = hh;
        const g = c.getContext('2d');
        g.drawImage(Assets.atlas, x, y, w, hh, 0, 0, w, hh);
        const img = g.getImageData(0, 0, w, hh), d = img.data;
        for (let k = 0; k < d.length; k += 4) {
            const to = h.map[((d[k] << 16) | (d[k + 1] << 8) | d[k + 2]).toString(16).padStart(6, '0')];
            if (to) { d[k] = parseInt(to.slice(0, 2), 16); d[k + 1] = parseInt(to.slice(2, 4), 16); d[k + 2] = parseInt(to.slice(4, 6), 16); }
        }
        g.putImageData(img, 0, 0);
        Assets.dyn[`fl_${kind}_${3 + i}`] = { c, w, h: hh, ax, ay };
    });
});
