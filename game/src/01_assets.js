/* ---- 01_assets.js ---- */
/* Sprite atlas, the seasonal ground (in pieces) and drawing helpers */
const Assets = {
    atlas: null, frames: window.ATLAS_JSON || {},
    dyn: {},             // sprites made while playing (pottery): name -> { c: canvas, w, h, ax, ay }
    load() {
        return loadImg(window.ATLAS_PNG).then(i => { this.atlas = i; if (i) for (const f of ASSET_MAKERS) try { f(); } catch (e) { console.error('could not make a sprite', e); } });
    },
    has(name) { return !!this.frames[name] || !!this.dyn[name]; },
};

/* the island ground: indexed PNG pieces (window.GROUND: size, cols, rows, urls), one picture for the whole year recolored
   for each season by swapping in its palette. Only the pieces near what's drawn are fetched and decoded, and only a few
   dozen are kept, so the island can be big and still fit on a phone. `ver` goes up as pieces arrive: whatever was drawn
   without them gets drawn again. */
const Ground = {
    G: window.GROUND || { size: 512, cols: 0, rows: 0, urls: [] }, bytes: new Map(), imgs: new Map(), jobs: new Map(), ver: 0, maps: {},
    max() { if (!this._max) { let c = false; try { c = matchMedia('(pointer: coarse)').matches; } catch (e) { /* old browser */ } this._max = c ? 20 : 48; } return this._max; },
    fetch(url) {
        if (!this.bytes.has(url)) {
            this.bytes.set(url, fetch(url).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); }).then(b => new Uint8Array(b))
                .catch(e => { console.error('could not load the ground', url, e); this.bytes.delete(url); return null; }));
        }
        return this.bytes.get(url);
    },
    /* a picture recolored for the season (blob URLs let go once decoded) */
    recolor(url, season) {
        return this.fetch(url).then(png => {
            if (!png) return null;
            const u = pngWithPalette(png, window.GROUND_PAL[season]);
            return loadImg(u).then(i => { URL.revokeObjectURL(u); return i; });
        });
    },
    /* piece i (row * cols + col) for the season, or null while it loads (the load is started) */
    piece(season, i) {
        const k = season + '|' + i, have = this.imgs.get(k);
        if (have) { have.used = ++this.clock; return have.img; }
        if (!this.jobs.has(k) && this.G.urls[i]) {
            this.jobs.set(k, this.recolor(this.G.urls[i], season).then(img => {
                this.jobs.delete(k);
                if (!img) return;
                this.imgs.set(k, { img, used: ++this.clock, season });
                this.ver++;
                // keep the newest few dozen; another season's pieces go first
                while (this.imgs.size > this.max()) {
                    let worst = null, wk = null;
                    for (const [kk, v] of this.imgs) if (!worst || (v.season !== season) > (worst.season !== season) || ((v.season !== season) === (worst.season !== season) && v.used < worst.used)) { worst = v; wk = kk; }
                    this.imgs.delete(wk);
                }
            }));
        }
        return null;
    },
    clock: 0,
    /* the same piece in any season, to show while the right one loads */
    anyPiece(i) { for (const [k, v] of this.imgs) if (k.endsWith('|' + i)) return v.img; return null; },
    /* draw the ground's rectangle (sx, sy, w, h) at (dx, dy), k screen pixels to a ground pixel; true when every piece
       drawn was the right season's (otherwise draw again once `ver` changes) */
    draw(ctx, season, sx, sy, w, h, dx, dy, k) {
        const P = this.G.size, gw = this.G.w || 0, gh = this.G.h || 0;
        k = k || 1;
        const x0 = Math.max(0, sx), y0 = Math.max(0, sy), x1 = Math.min(gw, sx + w), y1 = Math.min(gh, sy + h);
        let all = true;
        for (let r = Math.floor(y0 / P); r * P < y1; r++) for (let c = Math.floor(x0 / P); c * P < x1; c++) {
            const i = r * this.G.cols + c;
            let img = this.piece(season, i);
            if (!img) { all = false; img = this.anyPiece(i); }
            if (!img) continue;
            const px = c * P, py = r * P, ax = Math.max(x0, px), ay = Math.max(y0, py), bx = Math.min(x1, px + img.width), by = Math.min(y1, py + img.height);
            if (bx > ax && by > ay) ctx.drawImage(img, ax - px, ay - py, bx - ax, by - ay, dx + (ax - sx) * k, dy + (ay - sy) * k, (bx - ax) * k, (by - ay) * k);
        }
        return all;
    },
    /* start fetching the pieces around a spot (world pixels), before they're needed */
    around(season, x, y, r) {
        r = r || 600;
        const P = this.G.size;
        for (let row = Math.max(0, Math.floor((y - r) / P)); row <= Math.min(this.G.rows - 1, Math.floor((y + r) / P)); row++)
            for (let c = Math.max(0, Math.floor((x - r) / P)); c <= Math.min(this.G.cols - 1, Math.floor((x + r) / P)); c++) this.piece(season, row * this.G.cols + c);
    },
    /* the whole island at half size (the island map), for a season; null while it loads */
    map(season) {
        const m = this.maps[season];
        if (m && m.img) return m.img;
        if (!m && this.G.map) {
            const job = this.maps[season] = { img: null };
            this.recolor(this.G.map, season).then(img => { for (const kk of Object.keys(this.maps)) if (kk !== season) delete this.maps[kk]; job.img = img; if (!img) delete this.maps[season]; });
        }
        return null;
    },
};

/* sprites made from the atlas once it has loaded (later files add to this) */
const ASSET_MAKERS = [];
function loadImg(src) { return new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }); }
/* a PNG (bytes) with its PLTE chunk replaced by a palette given as a hex string ("rrggbb" per entry) -> blob URL */
const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(bytes, from, to) { let c = 0xffffffff; for (let i = from; i < to; i++) c = CRC_TABLE[(c ^ bytes[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function pngWithPalette(src, hex) {
    const n = hex.length / 6, pal = new Uint8Array(n * 3);
    for (let i = 0; i < n * 3; i++) pal[i] = parseInt(hex.substr(i * 2, 2), 16);
    const parts = [src.subarray(0, 8)];
    let off = 8;
    while (off < src.length) {
        const len = (src[off] << 24 | src[off + 1] << 16 | src[off + 2] << 8 | src[off + 3]) >>> 0;
        const type = String.fromCharCode(src[off + 4], src[off + 5], src[off + 6], src[off + 7]);
        const end = off + 12 + len;
        if (type === 'PLTE') {
            // keep the chunk's size (the image may use fewer entries than there are colors)
            const data = new Uint8Array(len);
            data.set(pal.subarray(0, Math.min(len, pal.length)));
            const chunk = new Uint8Array(12 + len);
            chunk.set(src.subarray(off, off + 8), 0);
            chunk.set(data, 8);
            const c = crc32(chunk, 4, 8 + len);
            chunk[8 + len] = c >>> 24; chunk[9 + len] = (c >>> 16) & 255; chunk[10 + len] = (c >>> 8) & 255; chunk[11 + len] = c & 255;
            parts.push(chunk);
        } else parts.push(src.subarray(off, end));
        off = end;
    }
    return URL.createObjectURL(new Blob(parts, { type: 'image/png' }));
}

/* draw a frame so its anchor lands on (x, y) */
function spr(ctx, name, x, y, flip, alpha) {
    if (R3.drawingCard) {
        if (name === 'shadow_s') return;
        if (R3.sig) { R3.sig.push(name, x, y, flip ? 1 : 0, alpha); R3.sigN++; }
        // a remastered prop, or a neighbor drawn by its frame name (the council, the keeper's ghost): in an HD card, the HD art
        if (hdHas(name)) { R3.hdSeen = true; if (R3.hdCard) { const hf = hdNamed(name); if (hf) { hdDraw(ctx, hf, x, y, flip, alpha); return; } } }
    } else if (R3.over && hdHas(name)) {
        // drawn over the 3D view (the fishing line's bobber, planes and gulls): the HD art too
        const hf = hdNamed(name);
        if (hf) { const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = true; hdDraw(ctx, hf, x, y, flip, alpha); ctx.imageSmoothingEnabled = sm; return; }
    }
    const f = Assets.frames[name];
    if (!f) { const d = Assets.dyn[name]; if (d) sprDyn(ctx, d, x, y, flip, alpha); return; }
    const [sx, sy, w, h, ax, ay] = f;
    const dx = Math.round(x - (flip ? w - 1 - ax : ax)), dy = Math.round(y - ay);
    if (alpha != null && alpha < 1) ctx.globalAlpha = alpha;
    if (flip) {
        ctx.save();
        ctx.translate(dx + w, dy);
        ctx.scale(-1, 1);
        ctx.drawImage(Assets.atlas, sx, sy, w, h, 0, 0, w, h);
        ctx.restore();
    } else {
        ctx.drawImage(Assets.atlas, sx, sy, w, h, dx, dy, w, h);
    }
    if (alpha != null && alpha < 1) ctx.globalAlpha = 1;
}
function sprDyn(ctx, d, x, y, flip, alpha) {
    const dx = Math.round(x - (flip ? d.w - 1 - d.ax : d.ax)), dy = Math.round(y - d.ay);
    if (alpha != null && alpha < 1) ctx.globalAlpha = alpha;
    if (flip) { ctx.save(); ctx.translate(dx + d.w, dy); ctx.scale(-1, 1); ctx.drawImage(d.c, 0, 0); ctx.restore(); }
    else ctx.drawImage(d.c, dx, dy);
    if (alpha != null && alpha < 1) ctx.globalAlpha = 1;
}
/* a frame scaled into a square canvas (for UI icons) */
const iconCache = new Map();
function iconCanvas(name, px) {
    px = px || 32;
    const c = document.createElement('canvas');
    const f = Assets.frames[name];
    if (!f) {
        const d = Assets.dyn[name];
        if (!d) { c.width = c.height = 1; return c; }
        const k = Math.max(1, Math.floor(px / Math.max(d.w, d.h)));
        c.width = d.w * k; c.height = d.h * k;
        const g = c.getContext('2d');
        g.imageSmoothingEnabled = false;
        g.drawImage(d.c, 0, 0, d.w * k, d.h * k);
        c.setAttribute('aria-hidden', 'true');
        return c;
    }
    const [sx, sy, w, h] = f;
    const k = Math.max(1, Math.floor(px / Math.max(w, h)));
    c.width = w * k; c.height = h * k;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(Assets.atlas, sx, sy, w, h, 0, 0, w * k, h * k);
    c.setAttribute('aria-hidden', 'true');
    return c;
}
function fillIcons(root) {
    $$('[data-icon]', root).forEach(el => {
        if (el.firstChild) return;
        el.appendChild(iconCanvas(el.dataset.icon, 28));
    });
}

