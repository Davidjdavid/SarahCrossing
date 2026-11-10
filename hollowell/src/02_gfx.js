/* The screen: one 320x180 canvas scaled up by whole numbers with crisp pixels. Off-screen canvases for
   sprites and tiles. Headless, every canvas is a stub that draws nothing. */

const NULL_CTX = new Proxy({}, {
    get(t, k) {
        if (k === 'canvas') return t.canvas;
        if (k === 'getImageData') return (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h });
        if (k === 'createImageData') return (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h });
        if (k === 'measureText') return () => ({ width: 0 });
        if (k in t) return t[k];
        return () => {};
    },
    set(t, k, v) { t[k] = v; return true; },
});
function nullCanvas(w, h) { return { width: w, height: h, getContext: () => NULL_CTX, isNull: true }; }

const Gfx = {
    canvas: null, ctx: null, scale: 1,

    init() {
        if (HEADLESS) { this.canvas = nullCanvas(W, H); this.ctx = NULL_CTX; return; }
        /* the game draws into its own 320x180 canvas; each frame is then copied onto the page's canvas, which covers the
           window and is exactly as many pixels as the screen shows there (on a screen scaled to 125% or 150% too), at a
           whole number of real pixels per game pixel when that fills most of the window: crisp, every column the same
           width, nothing for the browser to stretch */
        this.screen = document.getElementById('game');
        this.sctx = this.screen.getContext('2d', { alpha: false });
        this.canvas = this.makeCanvas(W, H);
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        this.view = { sc: 1, x: 0, y: 0, w: W, h: H };
        const fit = (devW, devH) => {
            const dpr = window.devicePixelRatio || 1;
            const dw = Math.max(1, devW || Math.round(innerWidth * dpr)), dh = Math.max(1, devH || Math.round(innerHeight * dpr));
            if (this.screen.width !== dw) this.screen.width = dw;
            if (this.screen.height !== dh) this.screen.height = dh;
            const fs = Math.min(dw / W, dh / H), s = Math.max(1, Math.floor(fs + 0.001));
            const sc = (s / fs > 0.86) ? s : fs;
            const cw = Math.round(W * sc), ch = Math.round(H * sc);
            this.view = { sc, x: Math.floor((dw - cw) / 2), y: Math.floor((dh - ch) / 2), w: cw, h: ch };
            this.dpr = dpr; this.scale = sc / dpr;
            if (typeof Pace !== 'undefined') Pace.dirty = true;
            this.present();
        };
        this.fit = fit;
        let watched = false;
        try {
            /* (the exact count when the browser gives one that agrees with the page's size times the scaling; else that product) */
            const ro = new ResizeObserver(es => {
                const e = es[0], b = e.devicePixelContentBoxSize && e.devicePixelContentBoxSize[0], c = e.contentBoxSize && e.contentBoxSize[0], dpr = window.devicePixelRatio || 1;
                if (b && c && Math.abs(b.inlineSize - c.inlineSize * dpr) <= 2 && Math.abs(b.blockSize - c.blockSize * dpr) <= 2) fit(b.inlineSize, b.blockSize);
                else if (c) fit(Math.round(c.inlineSize * dpr), Math.round(c.blockSize * dpr));
                else fit();
            });
            ro.observe(this.screen, { box: 'device-pixel-content-box' }); watched = true;
        } catch (e) { /* (older browsers: the window's size) */ }
        if (!watched) addEventListener('resize', () => fit());
        fit();
        this.screen.focus();
    },
    /* the frame onto the screen */
    present() {
        if (HEADLESS || !this.sctx) return;
        const v = this.view, x = this.sctx;
        x.imageSmoothingEnabled = false;
        x.fillStyle = '#17121a'; x.fillRect(0, 0, this.screen.width, this.screen.height);
        x.drawImage(this.canvas, 0, 0, W, H, v.x, v.y, v.w, v.h);
    },

    makeCanvas(w, h) {
        if (HEADLESS) return nullCanvas(w, h);
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
        return c;
    },

    rect(x, y, w, h, col) { const c = this.ctx; c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); },
    frame(x, y, w, h, col) {
        this.rect(x, y, w, 1, col); this.rect(x, y + h - 1, w, 1, col);
        this.rect(x, y, 1, h, col); this.rect(x + w - 1, y, 1, h, col);
    },
    /* draw a canvas (sprite) at a pixel spot, optionally mirrored */
    img(im, x, y, flip = false, alpha = 1) {
        if (!im) return;
        const c = this.ctx;
        if (alpha !== 1) c.globalAlpha = alpha;
        if (flip) {
            c.save(); c.translate(Math.round(x) + im.width, Math.round(y)); c.scale(-1, 1);
            c.drawImage(im, 0, 0); c.restore();
        } else c.drawImage(im, Math.round(x), Math.round(y));
        if (alpha !== 1) c.globalAlpha = 1;
    },
    /* part of a canvas */
    sub(im, sx, sy, sw, sh, x, y) { if (im) this.ctx.drawImage(im, sx, sy, sw, sh, Math.round(x), Math.round(y), sw, sh); },
    line(x0, y0, x1, y1, col) {
        /* pixel line (Bresenham), for threads */
        x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
        const c = this.ctx; c.fillStyle = col;
        let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, e = dx + dy;
        for (let n = 0; n < 2000; n++) {
            c.fillRect(x0, y0, 1, 1);
            if (x0 === x1 && y0 === y1) break;
            const e2 = 2 * e;
            if (e2 >= dy) { e += dy; x0 += sx; }
            if (e2 <= dx) { e += dx; y0 += sy; }
        }
    },
    circle(cx, cy, r, col) {
        const c = this.ctx; c.fillStyle = col;
        for (let y = -r; y <= r; y++) {
            const w = Math.floor(Math.sqrt(r * r - y * y));
            c.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
        }
    },
    alpha(a) { this.ctx.globalAlpha = a; },
};

/* Palette: the named colours everything is painted with (warm, saturated, a little storybook) */
const PAL = {
    ink: '#2a1f2d', ink2: '#3d2c3e', night: '#17121a',
    white: '#fbf6ea', cream: '#f4e9cf', paper: '#e9d9b4', parch: '#d6c193',
    grey1: '#cfc6b8', grey2: '#9a9188', grey3: '#6a635e', grey4: '#45403f',
    skin: '#f2c49b', skin2: '#d8956b', skin3: '#a8684a', skinD: '#8a5a3c', skinD2: '#5e3a26',
    red: '#e8463c', red2: '#b02b2e', red3: '#6e1d2b', rose: '#f07a7a',
    orange: '#f39a3c', orange2: '#c76b2a', rust: '#9a4a22',
    yellow: '#f7d64a', gold: '#d9a33a', gold2: '#a6772a', brass: '#e2b45a',
    lime: '#c8e66a', green: '#8fd46a', green2: '#4fa84a', green3: '#2e7a43', green4: '#1d4d36',
    teal: '#5ad1c5', teal2: '#2e9a96', teal3: '#1f5d63',
    sky: '#9fdcf5', blue: '#7ec8f0', blue2: '#3f8fd8', blue3: '#2b5aa8', blue4: '#1f3270',
    lav: '#c9b3f0', purple: '#b48ce8', purple2: '#7d5bc4', purple3: '#4b3a8a',
    pink: '#f59ac0', pink2: '#d0608e',
    tan: '#e6c08a', brown: '#c9925a', brown2: '#9a6438', brown3: '#6b4128', brown4: '#45281c',
    ochre: '#d98f3a', clay: '#c4623a', clay2: '#93432c', clay3: '#6a2e22',
    silver: '#dfe6ef', silver2: '#aab7c8',
    crimson: '#c42b4a', umber: '#7a5233',
};

/* the colour of each Maker's thread (and the player's) */
const THREAD = {
    none: '#cfc6b8', wren: '#e8463c', ives: '#3fc1b5', bram: '#e0913a', ambrose: '#4f9be0',
    tess: '#e8c04a', mallow: '#b48ce8', jory: '#d6304e', guild: '#a8784a', loom: '#e4ecf5',
    hesper: '#f0e6d0', linnet: '#8fd46a', tuck: '#5ab85a', chalk: '#eeeeee', town: '#d9c9a8',
};

function hexRGB(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function rgbHex(r, g, b) { return '#' + ((1 << 24) | (clamp(r | 0, 0, 255) << 16) | (clamp(g | 0, 0, 255) << 8) | clamp(b | 0, 0, 255)).toString(16).slice(1); }
function shade(h, f) { const [r, g, b] = hexRGB(h); return f >= 0 ? rgbHex(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f) : rgbHex(r * (1 + f), g * (1 + f), b * (1 + f)); }
function mix(a, b, t) { const A = hexRGB(a), B = hexRGB(b); return rgbHex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)); }
