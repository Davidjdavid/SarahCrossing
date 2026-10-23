/* ---- 6l_intro.js ---- */
/* The opening: a still, 16-bit dawn at sea. Sarah stands at the bow of her little sailboat, one hand on the forestay,
   looking at her new island on the horizon while the sun comes up behind it. The sky, the sun, the sea and the sun's
   path on the water are painted here to fit the screen; the island, the boat (with Sarah) and the clouds are sprites
   from art/intro.py. Then a caption, a tap, and she has arrived. */
const INTRO_SKY = ['#17163f', '#1e1a4e', '#272060', '#33266e', '#432c7a', '#573284', '#6e398c', '#89408e', '#a6488e',
    '#c3528a', '#dc6182', '#ee7479', '#f98b6f', '#ffa465', '#ffbd66', '#ffd479', '#ffe6a0'];
const INTRO_SEA = ['#f0a078', '#d27c7e', '#ab627f', '#86507e', '#684479', '#523b73', '#42346a', '#362e60', '#2c2856', '#23224b'];
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const INTRO_LINE = 'Sarah has decided to go on a vacation on her new island!';

function introRGB(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }

const IntroScene = {
    on: false, root: null, cv: null, L: null,
    /* the scene in art pixels: the short side is about 180, scaled up by a whole number to cover the screen */
    layout(w, h) {
        const sc = Math.max(1, Math.floor(Math.min(w, h) / 180));
        const W = Math.ceil(w / sc), H = Math.ceil(h / sc);
        const tall = H > W * 1.15;
        const hy = Math.round(H * (tall ? 0.45 : 0.57));
        // the island sits left of centre on a wide screen (the boat takes the right), in the middle on a tall one
        const ix = Math.round(tall ? W / 2 : Math.max(92, Math.min(W * 0.36, W - 230)));
        const sun = [ix - 30, hy - (tall ? 24 : 27)];
        const boat = tall ? [Math.round(W * 0.2), H - 8] : [Math.round(Math.max(ix + 60, W * 0.56)), H - 5];
        const clouds = tall
            ? [[W * 0.26, hy * 0.36], [W * 0.8, hy * 0.2], [W * 0.62, hy * 0.62], [W * 0.14, hy * 0.78]]
            : [[W * 0.18, hy * 0.3], [W * 0.74, hy * 0.16], [W * 0.56, hy * 0.5], [W * 0.08, hy * 0.7]];
        return { sc, W, H, tall, hy, ix, sun, boat, clouds };
    },
    paint() {
        const root = this.root, cv = this.cv;
        if (!root || !cv) return;
        const L = this.L = this.layout(root.clientWidth || innerWidth, root.clientHeight || innerHeight);
        const { W, H, hy, sun } = L;
        cv.width = W; cv.height = H;
        cv.style.width = W * L.sc + 'px'; cv.style.height = H * L.sc + 'px';
        const ctx = cv.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        const img = ctx.createImageData(W, H), d = img.data;
        const sky = INTRO_SKY.map(introRGB), sea = INTRO_SEA.map(introRGB);
        const SR = L.tall ? 17 : 20;                          // the sun's radius
        const sunCols = ['#fffbea', '#fff3c0', '#ffe496', '#ffcf72'].map(introRGB);
        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                const th = (BAYER4[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
                let c;
                if (y < hy) {
                    const ds = Math.hypot(x - sun[0], (y - sun[1]) * 1.7), dr = Math.hypot(x - sun[0], y - sun[1]);
                    if (dr < SR) {
                        const r = dr / SR;
                        c = sunCols[r < 0.55 ? 0 : r < 0.78 ? 1 : r < 0.93 ? 2 : 3];
                    } else {
                        // the sky: indigo overhead warming to gold at the horizon, with a halo of rings round the sun
                        let u = Math.pow(y / hy, 1.45) * (sky.length - 1);
                        const glow = Math.max(0, 1 - ds / 96);
                        u += glow * glow * 5.5;
                        u = Math.min(sky.length - 1, u);
                        const i = Math.floor(u);
                        c = sky[(u - i) > th ? Math.min(i + 1, sky.length - 1) : i];
                    }
                } else if (y === hy) {
                    const k = Math.max(0, 1 - Math.abs(x - sun[0]) / (W * 0.7));
                    c = introRGB(k > 0.75 ? '#fff0c0' : k > 0.4 ? '#ffc890' : '#e89a88');
                } else {
                    let u = Math.pow((y - hy) / (H - hy), 0.75) * (sea.length - 1);
                    // the sea near the sun is a little warmer
                    u -= Math.max(0, 1 - Math.abs(x - sun[0]) / 70) * Math.max(0, 1 - (y - hy) / 40) * 1.5;
                    u = clamp(u, 0, sea.length - 1);
                    const i = Math.floor(u);
                    c = sea[(u - i) > th ? Math.min(i + 1, sea.length - 1) : i];
                }
                const o = (y * W + x) * 4;
                d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
            }
        }
        ctx.putImageData(img, 0, 0);
        const rnd = mulberry(20260925);
        const px = (x, y, col, w, h) => { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), w || 1, h || 1); };
        // the last stars, fading into the dawn
        const starN = Math.round(W * hy / 520);
        for (let i = 0; i < starN; i++) {
            const x = rnd() * W, y = Math.pow(rnd(), 1.8) * hy * 0.5;
            if (Math.hypot(x - sun[0], y - sun[1]) < 70) continue;
            px(x, y, rnd() < 0.3 ? '#c8b8ff' : '#fff4d6');
        }
        for (const [x, y] of [[W * 0.86, hy * 0.1], [W * 0.1, hy * 0.08]]) {
            px(x, y - 1, '#fff4d6'); px(x - 1, y, '#fff4d6', 3, 1); px(x, y + 1, '#fff4d6');
        }
        // clouds, lit from below
        L.clouds.forEach(([x, y], i) => spr(ctx, 'intro_cloud_' + i, Math.round(x), Math.round(y)));
        // the island, and its reflection broken up by the swell
        spr(ctx, 'intro_island', L.ix, hy);
        const f = Assets.frames.intro_island;
        if (f && Assets.atlas) {
            const [fx, fy, fw, fh, ax, ay] = f;
            ctx.globalAlpha = 0.32;
            for (let k = 0; k < 22; k++) {
                if (k % 3 === 2) continue;
                const row = ay - 1 - Math.floor(k * 1.7);
                if (row < 0) break;
                const wob = Math.round(Math.sin(k * 1.9) * 1.2);
                ctx.drawImage(Assets.atlas, fx, fy + row, fw, 1, L.ix - ax + wob, hy + 1 + k, fw, 1);
            }
            ctx.globalAlpha = 1;
        }
        // the sun's path on the water: broken gold dashes, widening toward us
        for (let y = hy + 2; y < H; y += 2) {
            const dd = y - hy, half = 4 + dd * 0.42;
            const col = dd < 10 ? '#fff4c8' : dd < 26 ? '#ffe08a' : dd < 48 ? '#ffc272' : '#f49c6a';
            let x = sun[0] - half + rnd() * 3;
            while (x < sun[0] + half) {
                const len = 1 + Math.floor(rnd() * (dd < 20 ? 6 : 4));
                const edge = Math.abs(x - sun[0]) / half;
                if (rnd() > edge * 0.8 + dd / (H - hy) * 0.35) px(x, y, edge > 0.7 ? '#e8906e' : col, len, 1);
                x += len + 1 + Math.floor(rnd() * 4);
            }
        }
        // glints on the swell elsewhere
        const glintN = Math.round(W * (H - hy) / 160);
        for (let i = 0; i < glintN; i++) {
            const y = hy + 3 + Math.floor(Math.pow(rnd(), 1.4) * (H - hy - 3));
            const x = rnd() * W;
            if (Math.abs(x - sun[0]) < 6 + (y - hy) * 0.5) continue;
            const near = (y - hy) / (H - hy);
            px(x, y, near < 0.25 ? '#e89a9a' : near < 0.55 ? '#9a6a9e' : '#5e5a92', 2 + Math.floor(rnd() * 3 * (0.5 + near)), 1);
        }
        // a few gulls heading for the island
        const gull = (x, y, up) => {
            const c = '#2e1c3c';
            x = Math.round(x); y = Math.round(y);
            if (up) { px(x - 3, y - 1, c); px(x - 2, y - 1, c); px(x - 1, y, c); px(x, y, c); px(x + 1, y, c); px(x + 2, y - 1, c); px(x + 3, y - 1, c); }
            else { px(x - 3, y, c); px(x - 2, y - 1, c); px(x - 1, y - 1, c); px(x, y, c); px(x + 1, y - 1, c); px(x + 2, y - 1, c); px(x + 3, y, c); }
        };
        gull(sun[0] + 38, hy - 40, false); gull(sun[0] + 50, hy - 46, true); gull(sun[0] + 27, hy - 52, true);
        if (!L.tall) gull(sun[0] - 44, hy - 30, false);
        // Sarah's boat
        spr(ctx, 'intro_boat', L.boat[0], L.boat[1]);
    },
    /* show the scene; resolves once the player has read the line and tapped (or pressed a key), as it starts to fade */
    play() {
        return new Promise(resolve => {
            const root = this.root = el('div', 'introscene');
            root.id = 'introscene';
            const cv = this.cv = el('canvas');
            root.appendChild(cv);
            const caption = el('div', 'introcap', INTRO_LINE);
            const hint = el('div', 'introhint', G.touchUsed ? 'Tap to continue' : 'Press Enter, or click, to continue');
            const words = el('div', 'introwords');
            words.append(caption, hint);
            root.appendChild(words);
            $('#app').appendChild(root);
            this.on = G.introScene = true;
            Music.update(true);
            this.paint();
            const onResize = () => this.paint();
            addEventListener('resize', onResize);
            requestAnimationFrame(() => root.classList.add('in'));
            let stage = 0, done = false;
            const timers = [];
            const showLine = () => { if (stage < 1) { stage = 1; caption.classList.add('in'); timers.push(setTimeout(showHint, 1300)); } };
            const showHint = () => { if (stage < 2) { stage = 2; hint.classList.add('in'); } };
            timers.push(setTimeout(showLine, 1300));
            const swell = () => this.swell();
            swell();
            const swells = setInterval(swell, 5200);
            // the tap: the dawn fades away over the island, which is already waiting underneath
            const finish = () => {
                if (done) return;
                done = true;
                timers.forEach(clearTimeout); clearInterval(swells);
                removeEventListener('keydown', onKey, true);
                removeEventListener('resize', onResize);
                this.on = G.introScene = false;
                root.classList.add('out');
                root.style.pointerEvents = 'none';
                setTimeout(() => { root.remove(); if (this.root === root) this.root = this.cv = null; }, 1000);
                resolve();
            };
            const go = () => { Audio2.unlock(); if (stage === 0) showLine(); else if (stage === 1) showHint(); else finish(); };
            const onKey = e => {
                if (!this.on) return;
                e.stopPropagation();
                if (isA(e.code) || e.code === 'Escape' || e.code === 'KeyZ') { e.preventDefault(); if (!e.repeat) go(); }
            };
            addEventListener('keydown', onKey, true);
            root.addEventListener('pointerdown', e => { e.preventDefault(); go(); });
            this._finish = finish;
        });
    },
    /* the hush of the sea: a slow swell of filtered noise */
    swell() {
        const c = Audio2.ctx;
        if (!c || !Audio2.sfxOn || c.state !== 'running' || !Audio2.noise) return;
        const t = c.currentTime + 0.05;
        const n = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
        n.buffer = Audio2.noise; n.loop = true;
        fl.type = 'lowpass'; fl.frequency.setValueAtTime(380, t); fl.frequency.linearRampToValueAtTime(760, t + 1.6); fl.frequency.linearRampToValueAtTime(300, t + 4.4);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.07, t + 1.6); g.gain.linearRampToValueAtTime(0.0001, t + 4.6);
        n.connect(fl); fl.connect(g); g.connect(Audio2.sfx);
        n.start(t, Math.random() * 0.5); n.stop(t + 4.7);
    },
};

