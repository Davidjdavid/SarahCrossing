/* ---- 55_photo.js ---- */
/* Camera: photo mode, filters, the album; and the platform download capability */
const Caps = {
    _dl: null,
    downloads() {
        // only remember the answer once the host has actually been asked
        if (this._dl) return this._dl;
        try {
            if (!window.claude || !window.claude.use) return Promise.resolve(null);
            this._dl = Promise.resolve(window.claude.use('downloads')).catch(() => null);
        } catch (e) { return Promise.resolve(null); }
        return this._dl;
    },
};
function dataUrlToBlob(url) {
    const [head, b64] = url.split(',');
    const mime = (head.match(/data:([^;]+)/) || [])[1] || 'image/png';
    const bin = atob(b64);
    const u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return new Blob([u], { type: mime });
}

const FILTERS = [['none', 'No filter', ''], ['golden', 'Golden hour', 'sepia(0.25) saturate(1.3) brightness(1.05)'],
    ['night', 'Night owl', 'hue-rotate(200deg) saturate(0.7) brightness(0.9)'], ['mono', 'Black & white', 'grayscale(1) contrast(1.1)']];
const POSES = [null, 'happy', 'cheer', 'left', 'right'];
const Photo = {
    on: false, filter: 0, pose: 0, frame: 0,
    start() {
        if (this.on) return;
        this.on = true;
        G.photo = true;
        HUD.show(false);
        this.bar();
        Sfx.ui('open');
    },
    bar() {
        const b = $('#photobar');
        b.hidden = false;
        b.innerHTML = '';
        const mk = (label, cls, fn) => b.appendChild(btn(label, cls, fn));
        mk('Pose', 'alt', () => { this.pose = (this.pose + 1) % POSES.length; this.applyPose(); });
        mk(FILTERS[this.filter][1], 'alt', () => { this.filter = (this.filter + 1) % FILTERS.length; $('#game').style.filter = FILTERS[this.filter][2]; this.bar(); });
        mk(this.frame ? 'Frame: on' : 'Frame: off', 'alt', () => { this.frame = this.frame ? 0 : 1; this.showFrame(); this.bar(); });
        mk('Take photo', 'green', () => this.snap());
        mk('Album', 'alt', () => this.album());
        mk('Scrapbook', 'alt', () => Scrapbook.open());
        mk('Done', '', () => this.stop());
        this.showFrame();
    },
    showFrame() {
        let f = $('#pframe');
        if (this.frame && !f) { f = el('div', 'frame-poloroid'); f.id = 'pframe'; $('#ui').insertBefore(f, $('#photobar')); }
        if (!this.frame && f) f.remove();
    },
    applyPose() {
        const p = G.player;
        const pose = POSES[this.pose];
        p.pose = pose; p.poseT = pose ? 999999 : 0;
        if (pose === 'cheer') { p.emote = 'heart'; p.emoteT = 999999; } else if (pose === 'happy') { p.emote = 'sparkle'; p.emoteT = 999999; } else { p.emote = null; p.emoteT = 0; }
        if (pose) p.dir = 'down';
    },
    stop() {
        this.on = false;
        G.photo = false;
        $('#photobar').hidden = true;
        $('#game').style.filter = '';
        const f = $('#pframe'); if (f) f.remove();
        const p = G.player;
        p.pose = null; p.poseT = 0; p.emote = null; p.emoteT = 0;
        this.pose = 0;
        HUD.show(true);
    },
    snap() {
        // what's in it, before anything changes (the flash, the toast): its tags, and the scrapbook's pages
        const seen = Scrapbook.seen(), tags = seen.map(t => t.label);
        if (FILTERS[this.filter][0] !== 'none') tags.push(FILTERS[this.filter][1]);
        const src = $('#game');
        const k = 3;
        const c = document.createElement('canvas');
        const pad = this.frame ? 8 : 0, bottom = this.frame ? 30 : 0;
        c.width = src.width * k + pad * 2 * k; c.height = src.height * k + (pad + bottom) * k;
        const g = c.getContext('2d');
        g.imageSmoothingEnabled = false;
        if (this.frame) { g.fillStyle = '#fffdf8'; g.fillRect(0, 0, c.width, c.height); }
        g.drawImage(src, pad * k, pad * k, src.width * k, src.height * k);
        this.applyFilter(g, pad * k, pad * k, src.width * k, src.height * k);
        if (this.frame) {
            g.fillStyle = '#6e5a78';
            g.font = `600 ${Math.round(9 * k)}px Caveat, cursive`;
            g.textAlign = 'center';
            g.fillText(`${S.islandName || 'the island'} \u00b7 ${Clock.dateLine()} \u00b7 ${Clock.fmt().s}`, c.width / 2, c.height - bottom * k / 2 + 3 * k);
        }
        const url = c.toDataURL('image/png');
        // a smaller copy for the album
        const t = document.createElement('canvas');
        t.width = Math.round(c.width / 2); t.height = Math.round(c.height / 2);
        const tg = t.getContext('2d');
        tg.imageSmoothingEnabled = false;
        tg.drawImage(c, 0, 0, t.width, t.height);
        const ok = Photos.add(t.toDataURL('image/jpeg', 0.85), tags.slice(0, 16));
        const fresh = Online.visitor() ? [] : Scrapbook.note(seen);
        this.last = url;
        const fl = el('div');
        fl.style.cssText = 'position:absolute;inset:0;background:#fff;opacity:0.85;transition:opacity 0.4s;pointer-events:none';
        $('#ui').appendChild(fl);
        requestAnimationFrame(() => { fl.style.opacity = '0'; setTimeout(() => fl.remove(), 450); });
        Sfx.play('pick');
        UI.toast((ok ? 'Saved to your album' : 'Photo taken (the album is full or storage is blocked)') + (fresh.length ? `. New in the scrapbook: ${fresh.slice(0, 3).map(t => t.label).join(', ')}${fresh.length > 3 ? '...' : ''}` : ''));
        S.stats.photos = (S.stats.photos || 0) + 1;
        Caps.downloads().then(d => { if (d) this.offerSave(url); });
    },
    applyFilter(g, x, y, w, h) {
        const f = FILTERS[this.filter][0];
        if (f === 'none') return;
        const img = g.getImageData(x, y, w, h), d = img.data;
        for (let i = 0; i < d.length; i += 4) {
            let r = d[i], gg = d[i + 1], b = d[i + 2];
            if (f === 'mono') { const v = Math.min(255, (r * 0.3 + gg * 0.59 + b * 0.11) * 1.05); r = gg = b = v; }
            else if (f === 'golden') { r = Math.min(255, r * 1.08 + 12); gg = Math.min(255, gg * 1.02 + 4); b = b * 0.86; }
            else if (f === 'night') { r = r * 0.72; gg = gg * 0.8; b = Math.min(255, b * 1.1 + 18); }
            d[i] = r; d[i + 1] = gg; d[i + 2] = b;
        }
        g.putImageData(img, x, y);
    },
    offerSave(url) {
        const b = $('#photobar');
        if ($('#savephoto')) return;
        const s = btn('Save to device', '', async () => {
            const d = await Caps.downloads();
            if (!d) return;
            try { await d.save({ filename: `sarah-crossing-${Date.now()}.png`, data: dataUrlToBlob(url) }); UI.toast('Photo saved'); }
            catch (e) { if (e && e.code === 'declined') return; UI.toast('Could not save here. Screenshot works too!'); }
            s.remove();
        });
        s.id = 'savephoto';
        b.appendChild(s);
    },
    album() {
        const list = Photos.list();
        const P = UI.open({ title: 'Album', onClose: () => { }, foot: true });
        P.foot.appendChild(btn('Scrapbook', 'alt', () => Scrapbook.open(() => this.album())));
        if (!list.length) { P.body.appendChild(el('p', 'muted', 'No photos yet. Tap Take photo!')); return; }
        const grid = el('div');
        grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px';
        list.forEach((ph, i) => {
            const b = el('button', 'slot');
            b.type = 'button';
            b.style.aspectRatio = 'auto';
            const im = new Image();
            im.src = ph.url; im.className = 'photo'; im.alt = 'Photo ' + (i + 1);
            b.appendChild(im);
            b.addEventListener('click', () => this.view(i));
            grid.appendChild(b);
        });
        P.body.appendChild(grid);
    },
    view(i) {
        const ph = Photos.list()[i];
        if (!ph) return;
        const P = UI.open({ title: new Date(ph.t).toLocaleDateString(), back: () => this.album(), foot: true });
        const im = new Image();
        im.src = ph.url; im.className = 'photo'; im.alt = ph.tags && ph.tags.length ? 'Photo: ' + ph.tags.join(', ') : 'Photo';
        P.body.appendChild(im);
        // (what's in it, as little tags)
        if (ph.tags && ph.tags.length) {
            const tg = el('div', 'phototags');
            for (const t of ph.tags) tg.appendChild(el('span', 'pill', t));
            P.body.appendChild(tg);
        }
        Caps.downloads().then(d => {
            if (d) P.foot.appendChild(btn('Save to device', '', async () => {
                try { await d.save({ filename: `sarah-crossing-${ph.t}.jpg`, data: dataUrlToBlob(ph.url) }); UI.toast('Photo saved'); } catch (e) { /* declined */ }
            }));
            else P.foot.appendChild(el('span', 'grow', 'Long-press or right-click the photo to save it.'));
        });
        P.foot.appendChild(btn('Delete', 'alt', () => { Photos.remove(i); this.album(); }));
    },
};

