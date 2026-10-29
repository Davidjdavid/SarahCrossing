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

/* (photos are of the 3D view, as Sarah sees the island; "Classic 2D" takes them in the flat view instead: R3.active) */
const FILTERS = [['none', 'No filter', ''], ['golden', 'Golden hour', 'sepia(0.25) saturate(1.3) brightness(1.05)'],
    ['night', 'Night owl', 'hue-rotate(200deg) saturate(0.7) brightness(0.9)'], ['mono', 'Black & white', 'grayscale(1) contrast(1.1)'],
    ['flat', 'Classic 2D', '']];
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
        mk(FILTERS[this.filter][1], 'alt', () => { this.filter = (this.filter + 1) % FILTERS.length; this.look(); this.bar(); });
        mk(this.frame ? 'Frame: on' : 'Frame: off', 'alt', () => { this.frame = this.frame ? 0 : 1; this.showFrame(); this.bar(); });
        mk('Take photo', 'green', () => this.snap());
        mk('Album', 'alt', () => this.album());
        mk('Scrapbook', 'alt', () => Scrapbook.open());
        mk('Done', '', () => this.stop());
        this.showFrame();
    },
    /* the filter on what's on screen (the flat view's canvas, and the 3D view's and its weather's) */
    look() { for (const id of ['#game', '#game3d', '#wx3d', '#heads']) { const c = $(id); if (c) c.style.filter = this.on ? FILTERS[this.filter][2] : ''; } },
    flat() { return this.on && FILTERS[this.filter][0] === 'flat'; },
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
        this.look();
        this.grab = null;
        const f = $('#pframe'); if (f) f.remove();
        const p = G.player;
        p.pose = null; p.poseT = 0; p.emote = null; p.emoteT = 0;
        this.pose = 0;
        HUD.show(true);
    },
    snap() {
        // in the 3D view, the picture is taken just after the next frame is drawn (its canvas is only readable then:
        // the main loop calls grab)
        if (typeof R3 !== 'undefined' && R3.active() && R3.canvas) { this.grab = () => { this.grab = null; this.take(true); }; return; }
        this.take(false);
    },
    take(three) {
        // what's in it, before anything changes (the flash, the toast): its tags, and the scrapbook's pages
        const seen = Scrapbook.seen(), tags = seen.map(t => t.label);
        if (FILTERS[this.filter][0] !== 'none') tags.push(FILTERS[this.filter][1]);
        const src = $('#game');
        // (the flat view's game pixels three times over; the 3D view's own pixels, at most 1920 across)
        const W0_ = three ? R3.canvas.width : src.width, H0 = three ? R3.canvas.height : src.height;
        const k = three ? Math.min(1, 1920 / W0_) : 3, u = three ? W0_ / src.width : 1;
        const c = document.createElement('canvas');
        const pad = (this.frame ? 8 : 0) * u, bottom = (this.frame ? 30 : 0) * u, w = Math.round(W0_ * k), h = Math.round(H0 * k);
        c.width = w + Math.round(pad * 2 * k); c.height = h + Math.round((pad + bottom) * k);
        const g = c.getContext('2d');
        g.imageSmoothingEnabled = three;
        if (this.frame) { g.fillStyle = '#fffdf8'; g.fillRect(0, 0, c.width, c.height); }
        const x0 = Math.round(pad * k), y0 = Math.round(pad * k);
        if (three) {
            // the 3D picture, the weather over it, and what the flat view draws over the world (emotes, sparkles)
            g.drawImage(R3.canvas, x0, y0, w, h);
            if (R3.wx && R3.wx.width) g.drawImage(R3.wx, x0, y0, w, h);
            g.drawImage(src, x0, y0, w, h);
        } else g.drawImage(src, x0, y0, w, h);
        // (and the emotes over people's heads, on a canvas of their own at the screen's resolution, as big as the game's:
        // 41d_head_icons.js)
        const hc = $('#heads');
        if (hc && hc.width) { g.imageSmoothingEnabled = true; g.drawImage(hc, x0, y0, w, h); g.imageSmoothingEnabled = three; }
        this.applyFilter(g, x0, y0, w, h);
        if (this.frame) {
            g.fillStyle = '#6e5a78';
            g.font = `600 ${Math.round(9 * k * u)}px Caveat, cursive`;
            g.textAlign = 'center';
            g.fillText(`${S.islandName || 'the island'} \u00b7 ${Clock.dateLine()} \u00b7 ${Clock.fmt().s}`, c.width / 2, c.height - bottom * k / 2 + 3 * k * u);
        }
        const url = c.toDataURL('image/png');
        const t = document.createElement('canvas');
        // (a smaller copy for the album: half size, at most 720 across, as the flat view's photos are)
        const ts = Math.min(0.5, 720 / c.width);
        t.width = Math.round(c.width * ts); t.height = Math.round(c.height * ts);
        const tg = t.getContext('2d');
        tg.imageSmoothingEnabled = three;
        tg.drawImage(c, 0, 0, t.width, t.height);
        const ok = Photos.add(t.toDataURL('image/jpeg', 0.85), tags.slice(0, 16));
        const fresh = Online.visitor() ? [] : Scrapbook.note(seen);
        // (whoever's in it remembers it: 6zm_friendship.js)
        if (ok) for (const s of seen) if (s.k.startsWith('npc:')) remember(s.k.slice(4), 'photo');
        this.last = url;
        const fl = el('div');
        fl.style.cssText = 'position:absolute;inset:0;background:#fff;opacity:0.85;transition:opacity 0.4s;pointer-events:none';
        $('#ui').appendChild(fl);
        requestAnimationFrame(() => { fl.style.opacity = '0'; setTimeout(() => fl.remove(), 450); });
        Sfx.play('pick');
        UI.toast((ok ? 'Saved to your album' : 'Photo taken, but not added to the album. It may be full, or browser storage may be blocked.') + (fresh.length ? `. New in the scrapbook: ${fresh.slice(0, 3).map(t => t.label).join(', ')}${fresh.length > 3 ? '...' : ''}` : ''));
        S.stats.photos = (S.stats.photos || 0) + 1;
        Caps.downloads().then(d => { if (d) this.offerSave(url); });
    },
    applyFilter(g, x, y, w, h) {
        const f = FILTERS[this.filter][0];
        if (f === 'none' || f === 'flat') return;
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
            catch (e) { if (e && e.code === 'declined') return; UI.toast('Couldn\'t save the photo. You can take a screenshot instead.'); }
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
            // (one hung in the museum's photography wing says so)
            if (ph.museum != null) { b.style.position = 'relative'; const tag = el('span', 'pill', 'In the museum'); tag.style.cssText = 'position:absolute;left:6px;bottom:6px'; b.appendChild(tag); }
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
        if (ph.museum != null) P.body.appendChild(el('p', 'muted', `"${ph.title || 'A photo'}" hangs in the museum's photography wing. Deleting it here takes it down there too.`));
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

