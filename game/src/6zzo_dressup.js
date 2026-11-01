/* ---- 6zzo_dressup.js ---- */
/* Everyone dresses up (1 November): David, James, John, Elizabeth and Joe, playing on Sarah's island, have their hair
   done at Floss & Gloss, sew at the machine and wear what they buy, as Sarah does. Their look is their own save's
   (PERSON_KEYS: look, wardrobe, player), starting from how they've always looked (HD_FOLKS: look() and hdOutfit build
   on it); the clothes they came in are an outfit in their wardrobe (out_<who>), and their glasses an accessory. The 3D
   views draw them from hdSarahSpec as they do Sarah; the flat views from their HD picture a third the size
   (dressSprite), or their own 16x24 sprite while they look as they always have. Everyone else sees it in the look sent
   with their position (Online.tick, hdRemoteLook). */
const DRESS_PEOPLE = ['david', 'james', 'john', 'elizabeth', 'joe'];
for (const who of DRESS_PEOPLE) ITEMS['out_' + who] = { name: `${cap(who)}'s own clothes`, type: 'outfit', price: 0, icon: who + '_down_stand', wear: who, own: true };

/* a visitor's save, the first time it loads this: their own clothes and glasses in their wardrobe, the glasses on */
function dressSeed(st) {
    const who = Online.who(), f = HD_FOLKS[who];
    st.flags.dress12 = 1;
    if (!f || !st.player || !st.wardrobe) return;
    if (!st.wardrobe.outfits.includes(who)) st.wardrobe.outfits.unshift(who);
    if (!st.player.outfit || !ITEMS['out_' + st.player.outfit]) st.player.outfit = who;
    if (f.eyes) {
        if (!st.wardrobe.accs.includes(f.eyes)) st.wardrobe.accs.push(f.eyes);
        if (!st.player.eyes) st.player.eyes = f.eyes;
    }
}

/* the same look, clothes and things worn (key order aside) */
function sameSpec(a, b) {
    const same = (x, y) => { x = x || {}; y = y || {}; return [...new Set(Object.keys(x).concat(Object.keys(y)))].every(k => (x[k] == null ? null : x[k]) === (y[k] == null ? null : y[k])); };
    return !!a && !!b && same(a.look, b.look) && same(a.clothes, b.clothes) && (a.eyes || null) === (b.eyes || null) && (a.acc || null) === (b.acc || null);
}
/* a visitor as this device sees them, without what they wear on their face and head (the flat views add those) */
function dressSpec() {
    const id = S.player.outfit || Online.who(), d = S.designs && S.designs[id];
    return { look: look(), clothes: d ? hdDesign(d) : hdOutfit(id), eyes: null, acc: null };
}
/* does this visitor look as they always have? (then their own sprite, glasses and all) */
function dressAsAlways() {
    const who = Online.who(), f = HD_FOLKS[who];
    return !f || (sameSpec(Object.assign(dressSpec(), { eyes: S.player.eyes || null }), Object.assign(hdFolkSpec(who), { acc: null })));
}
/* a person's frame for the flat views (the classic view, menus, the flat games): their HD picture a third the size, as
   a sprite of its own, kept by what it shows */
function dressSprite(spec, frame) {
    const name = 'dr_' + hash32(frame + JSON.stringify(spec)).toString(36);
    if (Assets.dyn[name]) return name;
    if (!HD_HAIR.waves) return null;
    const f = hdPersonFrame(spec, frame, false);
    if (!f) return null;
    Assets.dyn[name] = shrinkHd(f);
    return name;
}
/* an HD frame (three canvas pixels to a world pixel) back to one: each 3x3 block becomes the color most of it is,
   or nothing where most of it is clear, so the outline and the colors stay crisp */
function shrinkHd(f) {
    const w = Math.round(f.w / 3), h = Math.round(f.h / 3), src = f.c.getContext('2d').getImageData(0, 0, f.w, f.h).data;
    const out = document.createElement('canvas');
    out.width = w; out.height = h;
    const g = out.getContext('2d'), img = g.createImageData(w, h), D = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const n = new Map();
        let solid = 0, best = null, bestN = 0, dark = 1e9;
        for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
            const k = ((y * 3 + j) * f.w + x * 3 + i) * 4;
            if (src[k + 3] < 128) continue;
            solid++;
            const c = (src[k] << 16) | (src[k + 1] << 8) | src[k + 2], m = (n.get(c) || 0) + 1, lum = src[k] + src[k + 1] + src[k + 2];
            n.set(c, m);
            // (the most of any one color; a tie goes to the darker, so an outline survives)
            if (m > bestN || (m === bestN && lum < dark)) { best = c; bestN = m; dark = lum; }
        }
        if (solid < 4) continue;
        const o = (y * w + x) * 4;
        D[o] = best >> 16; D[o + 1] = (best >> 8) & 255; D[o + 2] = best & 255; D[o + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return { c: out, w, h, ax: Math.round(f.ax / 3), ay: Math.round(f.ay / 3) };
}
/* this device's visitor in a flat view's frame (sarahSprite's, for whoever's playing) */
function visitorSprite(frame) {
    const who = Online.who();
    if (dressAsAlways()) return personFrame(who, frame);
    return dressSprite(dressSpec(), frame) || personFrame(who, frame);
}
/* someone else playing online, in a flat view: as they look in their own game */
function remoteSprite(o, frame) {
    const spec = hdRemoteLook(o.who, o.look);
    if (!o.look || !o.look.hd || sameSpec(spec, hdFolkSpec(o.who))) return personFrame(o.who, frame);
    return dressSprite(spec, frame) || personFrame(o.who, frame);
}
