/* ---- 6zx_explore.js ---- */
/* Exploring the big island. The island map stays clouded where Sarah hasn't been yet (cells of 4 x 4 tiles, kept in
   the save as S.explored), and the named places laid out with the island (W0.places, scripts/make-island.mjs) are found
   by going there. Some can only be found at night, at dawn, in the rain, in the snow or in one season, so finding them
   all takes days. Each place found pays a little and goes on the map; every ten, a neighbor sends something. */
const EXPLORE_CELL = 4, EXPLORE_SEE = 3;          // cells of 4 tiles; Sarah sees about three cells around her
const EXPLORE_GIFTS = [
    { n: 10, from: 'ginger', gift: 'globe', subject: 'Ten places!', body: 'Sarah! Word is you\'ve found ten places on the new island already. I built half of them and I still get lost. Here, a globe, for the explorer.\n- Ginger' },
    { n: 20, from: 'fortune', gift: 'star_jar', subject: 'Twenty places', body: 'Twenty places found! At this rate you will know the island better than the island does. A jar of stars, for the nights you spend out finding things.\n- Fortune' },
    { n: 30, from: 'sully', gift: 'star_telescope', subject: 'Thirty, kid', body: 'Thirty places, kid. That\'s wicked good. When I was your age I found one place and it was a parking lot. Have a telescope. Look at stuff.\n- Sully' },
];
const Explore = {
    bits: null, of: null, dirty: false,
    cols() { return Math.ceil(W0.w / EXPLORE_CELL); },
    rows() { return Math.ceil(W0.h / EXPLORE_CELL); },
    /* this save's explored cells (decoded once per save) */
    grid() {
        if (this.bits && this.of === S) return this.bits;
        const n = this.cols() * this.rows(), b = new Uint8Array(Math.ceil(n / 8));
        try {
            const s = atob(S.explored || '');
            for (let i = 0; i < s.length && i < b.length; i++) b[i] = s.charCodeAt(i);
        } catch (e) { /* a broken string: start over */ }
        this.bits = b; this.of = S;
        return b;
    },
    seen(cx, cy) { if (cx < 0 || cy < 0 || cx >= this.cols() || cy >= this.rows()) return false; const i = cy * this.cols() + cx; return !!(this.grid()[i >> 3] & (1 << (i & 7))); },
    mark(cx, cy) {
        if (cx < 0 || cy < 0 || cx >= this.cols() || cy >= this.rows()) return;
        const b = this.grid(), i = cy * this.cols() + cx;
        if (!(b[i >> 3] & (1 << (i & 7)))) { b[i >> 3] |= 1 << (i & 7); this.dirty = true; }
    },
    keep() {
        if (!this.dirty || !this.bits) return;
        let s = '';
        for (let i = 0; i < this.bits.length; i++) s += String.fromCharCode(this.bits[i]);
        S.explored = btoa(s);
        this.dirty = false;
        Save.touch();
    },
    /* how much of the island Sarah has seen (0..1) */
    share() {
        let n = 0, land = 0;
        for (let cy = 0; cy < this.rows(); cy++) for (let cx = 0; cx < this.cols(); cx++) {
            const x = cx * EXPLORE_CELL + 2, y = cy * EXPLORE_CELL + 2;
            if (!W0.grid[y] || W0.grid[y][x] === '~') continue;
            land++; if (this.seen(cx, cy)) n++;
        }
        return land ? n / land : 0;
    },
    /* can this place be found right now? */
    now(p) {
        const w = p.when;
        if (!w || w === 'start') return true;
        const h = Clock.hourF();
        if (w === 'night') return h >= 21 || h < 4.5;
        if (w === 'dawn') return h >= 4.5 && h < 7.5;
        if (w === 'rain') return G.weather === 'rain';
        if (w === 'snow') return G.weather === 'snow';
        return Clock.season() === w;
    },
    found(id) { return !!(S && S.places && S.places[id] != null); },
    count() { return S && S.places ? Object.keys(S.places).filter(id => (W0.places || []).some(p => p.id === id)).length : 0; },
    tick() {
        if (G.mode !== 'play' || !S || !S.started || !G.player || !G.area || G.area.id !== 'island' || !W0.places) return;
        if (G.frame % 6 !== 0) return;
        const p = G.player, cx = Math.floor(p.x / TILE / EXPLORE_CELL), cy = Math.floor(p.y / TILE / EXPLORE_CELL);
        for (let dy = -EXPLORE_SEE; dy <= EXPLORE_SEE; dy++) for (let dx = -EXPLORE_SEE - 1; dx <= EXPLORE_SEE + 1; dx++)
            if ((dx / (EXPLORE_SEE + 1.5)) ** 2 + (dy / (EXPLORE_SEE + 0.5)) ** 2 <= 1) this.mark(cx + dx, cy + dy);
        if (G.frame % 600 === 0) this.keep();
        if (G.busy || UI.modal || UI.dialogOpen) return;
        const tx = p.x / TILE, ty = p.y / TILE;
        for (const pl of W0.places) {
            if (pl.when === 'start') { if (!this.found(pl.id)) { if (!S.places) S.places = {}; S.places[pl.id] = Clock.dayNum(); } continue; }
            if (this.found(pl.id) || Math.hypot(pl.x + 0.5 - tx, pl.y + 0.5 - ty) > pl.r || !this.now(pl)) continue;
            this.discover(pl);
            break;
        }
    },
    discover(pl) {
        if (!S.places) S.places = {};
        S.places[pl.id] = Clock.dayNum();
        this.keep();
        const pay = pl.when ? 500 : 100;           // (the ones that only show at certain times pay more)
        addMoney(pay, true);
        Sfx.play('wish');
        const n = this.count(), all = (W0.places || []).length;
        UI.toast(`Found: ${pl.name}! (${n} of ${all} places) +${fmtNum(pay)}`, 'app_map');
        if (pl.note) UI.say(null, pl.note);
        for (const g of EXPLORE_GIFTS) if (n === g.n && NPC_DEFS[g.from]) sendMail({ from: g.from, subject: g.subject, body: g.body, gift: ITEMS[g.gift] ? g.gift : null, delay: 1 });
        if (n === all) sendMail({ from: 'joe', subject: 'Every single place', body: 'Sarah. You found every place on the whole island. Every one. Even the ones that only exist at night. I wrote you a poem:\n\n"Sarah went everywhere. / Then she came home. / Home is the best place. / (She found that one too.)"\n\n- Joe (Poet)', gift: ITEMS.gem_diamond ? 'gem_diamond' : null, delay: 1 });
        Save.touch();
    },
};
/* the island map: clouds over what Sarah hasn't seen yet, soft-edged (one cloud pixel per cell, drawn smoothed) */
function mapFog(bm, g, ox, oy, z) {
    if (!W0.places) return;
    const C = Explore.cols(), R = Explore.rows();
    if (!bm.fog || bm.fogOf !== S.explored + '|' + C) {
        const cv = bm.fog || document.createElement('canvas');
        cv.width = C + 2; cv.height = R + 2;
        const c = cv.getContext('2d'), img = c.createImageData(C + 2, R + 2), d = img.data;
        for (let y = 0; y < R + 2; y++) for (let x = 0; x < C + 2; x++) {
            // (only the land is clouded: the sea and the coast's outline always show)
            const tx = (x - 1) * EXPLORE_CELL + 2, ty = (y - 1) * EXPLORE_CELL + 2, sea = !W0.grid[ty] || !W0.grid[ty][tx] || W0.grid[ty][tx] === '~';
            const i = (y * (C + 2) + x) * 4, open = sea || Explore.seen(x - 1, y - 1);
            d[i] = 238; d[i + 1] = 234; d[i + 2] = 248; d[i + 3] = open ? 0 : 228;
        }
        c.putImageData(img, 0, 0);
        bm.fog = cv; bm.fogOf = S.explored + '|' + C;
    }
    const K = bm.BASE_K * EXPLORE_CELL, dpr = bm.dpr;
    g.save();
    g.setTransform(dpr * z, 0, 0, dpr * z, dpr * ox, dpr * oy);
    g.imageSmoothingEnabled = true;
    g.drawImage(bm.fog, -K, -K, (C + 2) * K, (R + 2) * K);
    g.restore();
}
