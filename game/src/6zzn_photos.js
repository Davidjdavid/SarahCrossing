/* ---- 6zzn_photos.js ---- */
/* Shrimpy's and Muggy's photos (David, 29 October: "draw the pictures for Muggy and Shrimpy"): the five-heart photo the
   other neighbors give, in the same light wooden frame with the sky behind a little portrait, so they give one too
   (50_talk.js gives `photo_<id>` once it exists). In the new look they stand in the photo frame wearing this picture. */
const PHOTO_ART = {
    scampi: [{ A: '#2d2230', B: '#c9a462', C: '#bfe6ff', D: '#3a1a1a', r: '#c8483a', W: '#fbf8f0', K: '#22305a', Y: '#f0c040', o: '#f2805a', e: '#1a1a20', h: '#ffffff', p: '#ffb0a0', m: '#8a2a2a', s: '#3a72d0' }, [
        'CrCCCCCCrC',
        'CCrCCCCrCC',
        'CCDWWWWDCC',
        'CDWWWWWWDC',
        'DKKKYYKKKD',
        'DDDDDDDDDD',
        'DoehooehoD',
        'DoeeooeeoD',
        'DpoommoopD',
        'DssssssssD',
        'DooooooooD']],
    mug: [{ A: '#2d2230', B: '#c9a462', C: '#bfe6ff', D: '#2d2230', s: '#f4f8fc', d: '#6a3a1e', c: '#fbf4e2', g: '#f0c848', e: '#1a1a20', h: '#ffffff', k: '#f2a0aa', m: '#a8483a', b: '#3a6aa8' }, [
        'CCsCCsCCCC',
        'CsCCsCCCCC',
        'DDDDDDDDCC',
        'DddddddDCC',
        'DgcccccDDC',
        'DcehcehDcD',
        'DkcmmckDcD',
        'DbbbbbbDDC',
        'DcgccccDCC',
        'DccccccDCC',
        'CDDDDDDCCC']],
};
for (const id of Object.keys(PHOTO_ART)) {
    const name = `${NPC_DEFS[id].name}'s photo`;
    ITEMS['photo_' + id] = { name, type: 'furniture', price: 0, icon: 'f_photo_' + id };
    FURN['photo_' + id] = { id: 'photo_' + id, name, w: 1, h: 1, kind: 'top', price: 0, sets: ['friends'], photo: id };
}
Object.assign(PHOTO_GIVE, {
    scampi: "Here, matey. Me portrait. Had it done in a port I won't name. Hang it somewhere with a view of the sea.",
    mug: 'For you. My photo. From the old days I looked exactly the same, but with more saucers around.',
});
ASSET_MAKERS.push(() => {
    for (const [id, [pal, rows]] of Object.entries(PHOTO_ART)) {
        const name = 'f_photo_' + id;
        if (Assets.frames[name] || Assets.dyn[name]) continue;
        const c = document.createElement('canvas');
        c.width = 16; c.height = 16;
        const g = c.getContext('2d'), R = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
        // the frame (as the others': a dark edge, light wood, thicker at the foot), then the window
        R(pal.A, 2, 0, 12, 16); R(pal.A, 1, 1, 14, 14); R(pal.B, 2, 1, 12, 14);
        rows.forEach((row, y) => [...row].forEach((ch, x) => R(pal[ch], 3 + x, 2 + y, 1, 1)));
        Assets.dyn[name] = { c, w: 16, h: 16, ax: 8, ay: 15 };
    }
});
