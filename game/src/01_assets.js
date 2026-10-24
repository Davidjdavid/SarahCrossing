/* ---- 01_assets.js ---- */
/* Sprite atlas, the seasonal ground and drawing helpers */
const Assets = {
    atlas: null, frames: window.ATLAS_JSON || {}, groundImg: {},
    dyn: {},             // sprites made while playing (pottery): name -> { c: canvas, w, h, ax, ay }
    load() {
        const jobs = [loadImg(window.ATLAS_PNG).then(i => { this.atlas = i; if (i) for (const f of ASSET_MAKERS) try { f(); } catch (e) { console.error('could not make a sprite', e); } })];
        jobs.push(this.groundFor(Clock.season()));
        return Promise.all(jobs);
    },
    /* the ground for a season: one indexed PNG for the whole year, recolored by swapping in that season's palette.
       Only the season on screen stays in memory. Resolves with the image (and keeps it in groundImg). */
    groundFor(season) {
        if (this.groundImg[season]) return Promise.resolve(this.groundImg[season]);
        if (this._gjob && this._gjob.season === season) return this._gjob.p;
        const p = this.groundBytes().then(png => png ? loadImg(pngWithPalette(png, window.GROUND_PAL[season])) : null).then(i => {
            if (i) { for (const k of Object.keys(this.groundImg)) if (k !== season) delete this.groundImg[k]; this.groundImg[season] = i; }
            if (this._gjob && this._gjob.p === p) this._gjob = null;
            return i;
        });
        this._gjob = { season, p };
        return p;
    },
    /* the best ground to draw right now (the right season once it has loaded) */
    ground(season) {
        const g = this.groundImg[season];
        if (g) return g;
        this.groundFor(season);
        return Object.values(this.groundImg)[0] || null;
    },
    has(name) { return !!this.frames[name] || !!this.dyn[name]; },
    /* the ground's indexed PNG (assets/ground-*.png), fetched once and recolored for each season */
    groundBytes() {
        if (!this._gbytes) {
            this._gbytes = fetch(window.GROUND_PNG)
                .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
                .then(b => new Uint8Array(b))
                .catch(e => { console.error('could not load the ground', e); this._gbytes = null; return null; });
        }
        return this._gbytes;
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
        const hf = hdNamed(name);
        if (hf) { R3.hdSeen = true; if (R3.hdCard) { hdDraw(ctx, hf, x, y, flip); return; } }
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

