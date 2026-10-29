/* ---- 6r_seaview.js ---- */
/* The view from the lookout: the telescope opens a big, smooth painting of the sea, drawn fresh for right now. The
   sky follows the time of day (night, dawn, sunrise, noon, sunset, dusk) and the weather; at night the moon shows its
   real phase over the water; boats sail past, gulls wheel, clouds drift, and once the lighthouse is lit again its beam
   sweeps the sea. On a whale day (SeaSky.whaleDay) a whale out there comes up, spouts, and dives with its tail up, now
   and again. */
const SEA_KEYS = [   // hour, sky top, sky mid, horizon, sea near, sea far
    [0, '#070b1e', '#0e1634', '#1a2650', '#040814', '#101a38'],
    [4.5, '#0a1028', '#18204a', '#2a3162', '#060b1c', '#141d40'],
    [5.5, '#232a5c', '#6a4e84', '#f0906a', '#1a2448', '#6a5a80'],
    [6.5, '#3d6fb8', '#e9a07a', '#ffd49a', '#1f4e84', '#c89a8a'],
    [8, '#4f93dc', '#9cc8ee', '#e8f0e8', '#1e5d98', '#8fc0e0'],
    [12, '#2f7fd6', '#79b6ec', '#cfe9f8', '#17558f', '#7fb8e2'],
    [16, '#3a7fcc', '#86b8e4', '#e2ecf0', '#1b5690', '#88b8d8'],
    [18, '#4a6cb8', '#e59a82', '#ffc47a', '#1d4a80', '#d69a7a'],
    [19.3, '#2c3470', '#b86a8a', '#f08a6a', '#1a2c5a', '#a06070'],
    [20.5, '#121a40', '#2a2a5a', '#4a3a6a', '#0a1228', '#2a2a50'],
    [24, '#070b1e', '#0e1634', '#1a2650', '#040814', '#101a38'],
];
function hexMix(a, b, t) { const x = hexRgbA(a), y = hexRgbA(b); return `rgb(${Math.round(x[0] + (y[0] - x[0]) * t)},${Math.round(x[1] + (y[1] - x[1]) * t)},${Math.round(x[2] + (y[2] - x[2]) * t)})`; }
function seaColors(h, weather) {
    let i = 0;
    while (i < SEA_KEYS.length - 2 && h >= SEA_KEYS[i + 1][0]) i++;
    const a = SEA_KEYS[i], b = SEA_KEYS[i + 1], t = (h - a[0]) / (b[0] - a[0]);
    const out = [1, 2, 3, 4, 5].map(k => hexMix(a[k], b[k], clamp(t, 0, 1)));
    if (weather === 'cloudy' || weather === 'rain' || weather === 'snow') {
        const grey = weather === 'rain' ? '#5a6272' : weather === 'snow' ? '#c8ccd6' : '#8a93a4';
        const k = weather === 'cloudy' ? 0.35 : 0.55;
        const dark = h < 5 || h > 20.5;
        return out.map(c => { const m = c.match(/\d+/g).map(Number); const g = hexRgbA(dark ? '#20242e' : grey); return `rgb(${Math.round(m[0] + (g[0] - m[0]) * k)},${Math.round(m[1] + (g[1] - m[1]) * k)},${Math.round(m[2] + (g[2] - m[2]) * k)})`; });
    }
    return out;
}
const SeaView = {
    on: false,
    open(after) {
        if (this.on) return;
        this.on = true;
        G.busy++;
        const root = el('div');
        root.id = 'seaview';
        const cv = el('canvas');
        root.appendChild(cv);
        const cap = el('div', 'sv-cap');
        root.appendChild(cap);
        const x = el('button', 'sv-x', '\u00d7');
        x.type = 'button'; x.setAttribute('aria-label', 'Stop looking');
        root.appendChild(x);
        $('#ui').appendChild(root);
        this.root = root; this.cv = cv; this.cap = cap; this.after = after;
        this.t0 = performance.now();
        const r = mulberry(hash32(S.seed + ':sea:' + Clock.dayNum()));
        this.stars = Array.from({ length: 220 }, () => ({ x: r(), y: Math.pow(r(), 1.6) * 0.62, s: r() < 0.08 ? 2 : 1, tw: r() * 6.28, sp: 0.5 + r() * 2 }));
        this.clouds = Array.from({ length: G.weather === 'sunny' ? 5 : G.weather === 'cloudy' ? 11 : 13 }, () => ({ x: r() * 1.4 - 0.2, y: 0.08 + r() * 0.42, w: 0.12 + r() * 0.22, h: 0.03 + r() * 0.05, v: 0.00002 + r() * 0.00004, puffs: 3 + Math.floor(r() * 4), seed: r() }));
        this.boats = Array.from({ length: 3 }, (_, i) => ({ x: r(), y: 0.66 + r() * 0.2, dir: r() < 0.5 ? -1 : 1, v: 0.00003 + r() * 0.00005, kind: i === 2 ? 'ferry' : 'sail', size: 0.6 + r() * 0.8 }));
        this.gulls = Array.from({ length: 5 }, () => ({ x: r(), y: 0.2 + r() * 0.3, ph: r() * 6, v: 0.00008 + r() * 0.0001 }));
        this.whale = SeaSky.whaleDay() ? { x: 0.22 + r() * 0.5, y: 0.7 + r() * 0.1, t0: 1.5 + r() * 3, dir: r() < 0.5 ? -1 : 1 } : null;
        this.drops = Array.from({ length: 160 }, () => ({ x: r(), y: r(), v: 0.6 + r() * 0.8 }));
        this.shoot = null;
        this.star = Quests.starVisible();
        const close = () => this.close();
        x.addEventListener('click', ev => { ev.stopPropagation(); close(); });
        root.addEventListener('pointerdown', ev => { if (ev.target === x) return; if (performance.now() - this.t0 > 600) close(); });
        this._key = ev => { if (['Escape', 'Space', 'Enter', 'KeyE', 'KeyX', 'KeyB'].includes(ev.code)) { ev.preventDefault(); ev.stopPropagation(); if (performance.now() - this.t0 > 400) close(); } };
        addEventListener('keydown', this._key, true);
        this._resize = () => this.fit();
        addEventListener('resize', this._resize);
        this.fit();
        this.caption();
        Sfx.play('pick');
        const loop = () => { if (!this.on) return; this.draw(); this.raf = requestAnimationFrame(loop); };
        loop();
    },
    fit() {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        this.W = Math.round(innerWidth * dpr); this.H = Math.round(innerHeight * dpr);
        this.cv.width = this.W; this.cv.height = this.H;
        this.cv.style.width = innerWidth + 'px'; this.cv.style.height = innerHeight + 'px';
        this.bg = null;
    },
    caption() {
        const h = Clock.hourF(), night = h >= 20.5 || h < 5;
        const w = { sunny: 'Clear', cloudy: 'Cloudy', rain: 'Rainy', snow: 'Snowy' }[G.weather] || '';
        const when = h < 5 ? 'Late night' : h < 6.8 ? 'Sunrise' : h < 11 ? 'Morning' : h < 15 ? 'Midday' : h < 18 ? 'Afternoon' : h < 19.8 ? 'Sunset' : h < 21 ? 'Dusk' : 'Night';
        const moon = night && G.weather !== 'rain' && G.weather !== 'snow' ? ` \u00b7 ${this.moonPos(h) ? cap(moonPhaseName(Clock.island()).replace(/^an? /, '')) : 'The moon has set'}` : '';
        this.cap.innerHTML = '';
        this.cap.appendChild(el('b', null, 'The view from the lookout'));
        this.cap.appendChild(el('span', null, `${when} \u00b7 ${Clock.fmt().s} \u00b7 ${w}${moon}`));
        this.cap.appendChild(el('small', null, this.star ? 'One star over the sea is blinking. Short, short, long...' : 'Tap anywhere to come back'));
    },
    paintBg() {
        const W = this.W, H = this.H, h = Clock.hourF(), hz = Math.round(H * 0.6);
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const g = c.getContext('2d');
        const [top, mid, hor, near, far] = seaColors(h, G.weather);
        const sky = g.createLinearGradient(0, 0, 0, hz);
        sky.addColorStop(0, top); sky.addColorStop(0.62, mid); sky.addColorStop(1, hor);
        g.fillStyle = sky; g.fillRect(0, 0, W, hz);
        // stars
        // how dark it is (0 day .. 1 night), and how many stars show through the weather
        const dark = h >= 19.8 || h < 5.6 ? clamp(h >= 19.8 ? (h - 19.8) / 1.2 : (5.6 - h) / 1, 0, 1) : 0;
        this.night = dark;
        this.starK = dark * (G.weather === 'sunny' ? 1 : G.weather === 'cloudy' ? 0.35 : 0);
        // the sun and the moon
        const sun = this.sunPos(h), moon = this.moonPos(h);
        this.sun = sun; this.moon = moon;
        if (sun && G.weather !== 'rain') {
            const r = Math.min(W, H) * 0.045, sx = sun[0] * W, sy = sun[1] * hz;
            const low = clamp(1 - (hz - sy) / (hz * 0.5), 0, 1);
            const glow = g.createRadialGradient(sx, sy, r * 0.5, sx, sy, r * 7);
            glow.addColorStop(0, `rgba(255,${Math.round(240 - 70 * low)},${Math.round(200 - 110 * low)},${G.weather === 'cloudy' || G.weather === 'snow' ? 0.35 : 0.6})`);
            glow.addColorStop(1, 'rgba(255,200,120,0)');
            g.fillStyle = glow; g.fillRect(0, 0, W, hz);
            if (G.weather !== 'snow') {
                g.fillStyle = low > 0.6 ? '#ffb070' : low > 0.3 ? '#ffe0a0' : '#fff8e0';
                g.beginPath(); g.arc(sx, sy, r, 0, Math.PI * 2); g.fill();
            }
        }
        // distant islands, hazy
        const fillIsland = (x0, w, hgt) => {
            g.beginPath(); g.moveTo(x0 * W, hz);
            for (let k = 0; k <= 20; k++) { const u = k / 20; g.lineTo((x0 + w * u) * W, hz - Math.sin(u * Math.PI) * hgt * H * (0.8 + 0.2 * Math.sin(u * 13))); }
            g.closePath(); g.fill();
        };
        g.globalAlpha = 0.55; g.fillStyle = mid; fillIsland(0.08, 0.16, 0.022); fillIsland(0.7, 0.1, 0.014); g.globalAlpha = 1;
        // the sea
        const sea = g.createLinearGradient(0, hz, 0, H);
        sea.addColorStop(0, far); sea.addColorStop(1, near);
        g.fillStyle = sea; g.fillRect(0, hz, W, H - hz);
        g.fillStyle = 'rgba(255,255,255,0.16)'; g.fillRect(0, hz, W, Math.max(1, Math.round(H * 0.002)));
        this.hz = hz;
        this.bg = c;
        this.bgAt = performance.now();
    },
    sunPos(h) {
        if (h < 5.8 || h > 19.6) return null;
        const u = (h - 5.8) / (19.6 - 5.8);                      // sunrise on the right (east), sunset on the left (west)
        return [0.9 - u * 0.8, 1 - Math.sin(u * Math.PI) * 0.85];
    },
    /* the moon rises about 50 minutes later every day: with the sun at new moon, at sunset when it's full */
    moonPos(h) {
        const age = moonAge(Clock.island()), rise = (6 + (age / 29.530588) * 24) % 24;
        const up = (h - rise + 24) % 24;
        if (up > 12.4) return null;
        const u = up / 12.4;
        return [0.9 - u * 0.8, 1 - Math.sin(u * Math.PI) * 0.8];
    },
    drawMoon(g, x, y, r, dim) {
        const age = moonAge(Clock.island()), ph = age / 29.530588;
        const lit = '#f4f1e0', dark = dim ? 'rgba(200,215,240,0.12)' : 'rgba(40,46,70,0.55)';
        g.save();
        if (dim) g.globalAlpha = dim;
        if (!dim) {
            const glow = g.createRadialGradient(x, y, r, x, y, r * 5);
            glow.addColorStop(0, `rgba(230,236,255,${0.12 + 0.2 * (1 - Math.abs(ph - 0.5) * 2)})`); glow.addColorStop(1, 'rgba(230,236,255,0)');
            g.fillStyle = glow; g.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
        }
        g.fillStyle = dark; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
        g.fillStyle = lit;
        const waxing = ph < 0.5, k = Math.cos(ph * 2 * Math.PI), rx = Math.abs(k) * r;
        g.beginPath();
        // the lit half-disc
        g.arc(x, y, r, -Math.PI / 2, Math.PI / 2, !waxing);
        // the terminator: an ellipse back to the top
        const gibbous = (ph > 0.25 && ph < 0.75);
        g.ellipse(x, y, rx, r, 0, Math.PI / 2, -Math.PI / 2, waxing ? gibbous : !gibbous);
        g.closePath(); g.fill();
        // a few maria
        g.globalCompositeOperation = 'source-atop';
        g.fillStyle = 'rgba(160,160,150,0.35)';
        for (const [dx, dy, rr] of [[-0.3, -0.2, 0.22], [0.15, 0.1, 0.28], [-0.1, 0.35, 0.16]]) { g.beginPath(); g.arc(x + dx * r, y + dy * r, rr * r, 0, 7); g.fill(); }
        g.restore();
    },
    draw() {
        const W = this.W, H = this.H;
        if (!this.bg || performance.now() - this.bgAt > 20000) this.paintBg();
        const g = this.cv.getContext('2d'), t = (performance.now() - this.t0) / 1000, hz = this.hz, h = Clock.hourF();
        g.drawImage(this.bg, 0, 0);
        // stars (and the one that blinks)
        if (this.starK > 0) {
            for (const s of this.stars) {
                const a = this.starK * (0.55 + 0.45 * Math.sin(t * s.sp + s.tw)) * (1 - s.y / 0.7);
                if (a <= 0.02) continue;
                g.fillStyle = `rgba(255,255,240,${a})`;
                g.fillRect(s.x * W, s.y * hz, s.s * 1.5, s.s * 1.5);
            }
            if (this.star) {
                const cyc = t % 3.2, on = cyc < 0.25 || (cyc > 0.5 && cyc < 0.75) || (cyc > 1.0 && cyc < 1.8);
                const sx = W * 0.62, sy = hz * 0.22, rr = Math.max(3, W * 0.004);
                if (on) {
                    const gl = g.createRadialGradient(sx, sy, 0, sx, sy, rr * 6);
                    gl.addColorStop(0, 'rgba(200,230,255,0.95)'); gl.addColorStop(1, 'rgba(200,230,255,0)');
                    g.fillStyle = gl; g.fillRect(sx - rr * 6, sy - rr * 6, rr * 12, rr * 12);
                }
                g.fillStyle = on ? '#ffffff' : 'rgba(255,255,255,0.35)'; g.fillRect(sx - rr / 2, sy - rr / 2, rr, rr);
            }
            // a shooting star now and then
            if (!this.shoot && starNight() && Math.random() < 0.004) this.shoot = { x: 0.2 + Math.random() * 0.6, y: 0.05 + Math.random() * 0.2, t: 0 };
            if (this.shoot) {
                const S0 = this.shoot; S0.t += 1 / 60;
                const x1 = (S0.x + S0.t * 0.5) * W, y1 = (S0.y + S0.t * 0.25) * hz;
                const gr = g.createLinearGradient(x1 - W * 0.08, y1 - hz * 0.04, x1, y1);
                gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, `rgba(255,255,255,${this.starK})`);
                g.strokeStyle = gr; g.lineWidth = Math.max(1.5, W * 0.0015);
                g.beginPath(); g.moveTo(x1 - W * 0.08, y1 - hz * 0.04); g.lineTo(x1, y1); g.stroke();
                if (S0.t > 0.8) this.shoot = null;
            }
        }
        // the moon, with its real phase (pale in the daytime sky, when it's up)
        if (this.moon && G.weather !== 'rain' && G.weather !== 'snow') {
            const r = Math.min(W, H) * 0.038, day = 1 - this.night;
            if (day < 0.5 || this.moon[1] < 0.9) this.drawMoon(g, this.moon[0] * W, this.moon[1] * hz, r, day > 0.5 ? 0.55 : 0);
        }
        // clouds
        const dark = G.weather === 'rain', nightK = this.night > 0.5;
        for (const c of this.clouds) {
            c.x += c.v * (dark ? 2 : 1) * 60 / 60;
            if (c.x > 1.3) c.x = -0.35;
            const cx = c.x * W, cy = c.y * hz, cw = c.w * W, ch = c.h * H;
            const col = dark ? (nightK ? 'rgba(34,38,50,0.9)' : 'rgba(70,76,92,0.85)') : G.weather === 'snow' ? (nightK ? 'rgba(84,90,112,0.85)' : 'rgba(220,224,234,0.85)') : nightK ? 'rgba(60,66,100,0.55)' : 'rgba(255,255,255,0.78)';
            g.fillStyle = col;
            const r0 = mulberry(Math.floor(c.seed * 1e6));
            for (let k = 0; k < c.puffs; k++) {
                const px = cx + (k / (c.puffs - 1) - 0.5) * cw, py = cy - Math.sin(k / (c.puffs - 1) * Math.PI) * ch * 0.6;
                g.beginPath(); g.ellipse(px, py, cw * (0.22 + r0() * 0.12), ch * (0.6 + r0() * 0.4), 0, 0, 7); g.fill();
            }
            // a warm edge at sunrise and sunset
            if (!dark && ((h > 5.5 && h < 7.5) || (h > 17.5 && h < 19.8))) { g.fillStyle = 'rgba(255,170,120,0.25)'; g.beginPath(); g.ellipse(cx, cy + ch * 0.3, cw * 0.45, ch * 0.3, 0, 0, 7); g.fill(); }
        }
        // the path of light on the water (sun or moon)
        const src = this.sun && G.weather !== 'rain' ? this.sun : (this.moon && this.night > 0.5 && G.weather !== 'rain' && G.weather !== 'snow' ? this.moon : null);
        if (src) {
            const sx = src[0] * W, warm = src === this.sun;
            for (let k = 0; k < 70; k++) {
                const yy = hz + (k / 70) * (H - hz), spread = (8 + k * 3.2) * (W / 900);
                const x = sx + Math.sin(t * 1.7 + k * 1.3) * spread * 0.6;
                const a = (warm ? 0.5 : 0.35) * (1 - k / 90) * (0.5 + 0.5 * Math.sin(t * 3 + k));
                g.fillStyle = warm ? `rgba(255,236,190,${a})` : `rgba(230,236,255,${a})`;
                g.fillRect(x - spread / 2, yy, spread * (0.4 + 0.6 * Math.abs(Math.sin(k + t))), Math.max(1, H * 0.003));
            }
        }
        // waves
        g.strokeStyle = nightK ? 'rgba(160,180,230,0.14)' : 'rgba(255,255,255,0.22)';
        g.lineWidth = Math.max(1, H * 0.002);
        for (let k = 0; k < 26; k++) {
            const yy = hz + Math.pow((k + 1) / 27, 1.6) * (H - hz);
            const len = W * (0.02 + 0.05 * (k / 26)), off = ((t * (8 + k) * 3 + k * 97) % (W + len)) - len;
            for (let j = 0; j < 4; j++) {
                const x = (off + j * W / 4 + k * 37) % (W + len) - len / 2;
                g.beginPath(); g.moveTo(x, yy); g.quadraticCurveTo(x + len / 2, yy - H * 0.004, x + len, yy); g.stroke();
            }
        }
        // boats
        for (const b of this.boats) {
            b.x += b.v * b.dir;
            if (b.x > 1.15) b.x = -0.15; if (b.x < -0.15) b.x = 1.15;
            const persp = (b.y - 0.6) / 0.4, s = (0.4 + persp) * b.size * H * 0.05;
            const bx = b.x * W, by = hz + (b.y - 0.6) * (H - hz) * 2.2 + Math.sin(t * 1.5 + b.x * 10) * s * 0.05;
            if (by > H) continue;
            g.fillStyle = nightK ? '#1a2038' : '#4a3a3a';
            g.beginPath(); g.moveTo(bx - s, by); g.lineTo(bx + s, by); g.lineTo(bx + s * 0.7, by + s * 0.3); g.lineTo(bx - s * 0.7, by + s * 0.3); g.closePath(); g.fill();
            if (b.kind === 'sail') {
                g.fillStyle = nightK ? '#3a4262' : '#fdf8ee';
                g.beginPath(); g.moveTo(bx, by - s * 1.6); g.lineTo(bx, by - s * 0.08); g.lineTo(bx + s * 0.85 * b.dir, by - s * 0.08); g.closePath(); g.fill();
                g.fillStyle = nightK ? '#2a3050' : '#e84a5a';
                g.beginPath(); g.moveTo(bx - s * 0.1 * b.dir, by - s * 1.3); g.lineTo(bx - s * 0.1 * b.dir, by - s * 0.1); g.lineTo(bx - s * 0.6 * b.dir, by - s * 0.1); g.closePath(); g.fill();
            } else {
                g.fillStyle = nightK ? '#2a3050' : '#f4f0e8'; g.fillRect(bx - s * 0.6, by - s * 0.45, s * 1.1, s * 0.45);
                g.fillStyle = nightK ? '#2a3050' : '#e0405a'; g.fillRect(bx + s * 0.1, by - s * 0.8, s * 0.22, s * 0.35);
            }
            if (this.night > 0.3) { g.fillStyle = `rgba(255,230,150,${this.night})`; g.fillRect(bx - s * 0.05, by - s * 0.5, Math.max(2, s * 0.08), Math.max(2, s * 0.08)); }
        }
        if (this.whale) this.drawWhale(g, t, hz, nightK);
        // gulls by day
        if (this.night < 0.3 && G.weather !== 'rain' && G.weather !== 'snow') {
            g.strokeStyle = 'rgba(40,40,60,0.7)'; g.lineWidth = Math.max(1.2, W * 0.0012);
            for (const gl of this.gulls) {
                gl.x += gl.v; if (gl.x > 1.1) gl.x = -0.1;
                const gx = gl.x * W, gy = gl.y * hz + Math.sin(t + gl.ph) * hz * 0.02, w = W * 0.012, flap = Math.sin(t * 7 + gl.ph) * w * 0.35;
                g.beginPath(); g.moveTo(gx - w, gy - flap); g.quadraticCurveTo(gx - w * 0.4, gy - w * 0.4, gx, gy); g.quadraticCurveTo(gx + w * 0.4, gy - w * 0.4, gx + w, gy - flap); g.stroke();
            }
        }
        // the lighthouse beam, from the far right
        if (Quests.lamp() && this.night > 0.2) {
            const lx = W * 0.97, ly = hz - H * 0.02, ang = Math.PI + Math.sin(t * 0.6) * 0.6;
            const gr = g.createLinearGradient(lx, ly, lx + Math.cos(ang) * W * 0.8, ly + Math.sin(ang) * H * 0.1);
            gr.addColorStop(0, `rgba(255,240,180,${0.35 * this.night})`); gr.addColorStop(1, 'rgba(255,240,180,0)');
            g.fillStyle = gr;
            g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx + Math.cos(ang - 0.05) * W, ly + Math.sin(ang - 0.05) * W); g.lineTo(lx + Math.cos(ang + 0.05) * W, ly + Math.sin(ang + 0.05) * W); g.closePath(); g.fill();
            g.fillStyle = `rgba(255,245,200,${this.night})`; g.beginPath(); g.arc(lx, ly, Math.max(2, W * 0.003), 0, 7); g.fill();
        }
        // rain or snow
        if (G.weather === 'rain' || G.weather === 'snow') {
            const snow = G.weather === 'snow';
            g.fillStyle = snow ? 'rgba(255,255,255,0.85)' : 'rgba(200,215,240,0.5)';
            for (const d of this.drops) {
                d.y += (snow ? 0.0016 : 0.012) * d.v; d.x += snow ? Math.sin(t + d.v * 9) * 0.0006 : 0.002;
                if (d.y > 1) { d.y = 0; d.x = Math.random(); }
                if (snow) g.fillRect(d.x * W, d.y * H, Math.max(2, W * 0.002), Math.max(2, W * 0.002));
                else g.fillRect(d.x * W, d.y * H, Math.max(1, W * 0.001), H * 0.02);
            }
        }
    },
    /* the whale, every fourteen seconds: its back up out of the water (a spout over the blowhole), back under, then its
       tail up and down as it dives, a little further along each time */
    drawWhale(g, t, hz, nightK) {
        const W = this.W, H = this.H, q = this.whale, c = t - q.t0;
        if (c < 0) return;
        const k = c % 14, n = Math.floor(c / 14), persp = (q.y - 0.6) / 0.4, s = (0.4 + persp) * H * 0.045;
        const wx = ((q.x + n * 0.05 * q.dir) % 1.2 + 1.2) % 1.2 * W - W * 0.1 + q.dir * k * s * 0.08, by = hz + (q.y - 0.6) * (H - hz) * 2.2;
        const dark = nightK ? '#1a2038' : '#3e4e64', foam = nightK ? 'rgba(180,196,230,0.5)' : 'rgba(255,255,255,0.7)';
        const up = k < 4 ? Math.sin(Math.min(1, k / 1.2) * Math.PI / 2) : k < 5 ? 1 - (k - 4) : 0;
        if (up > 0.01) {
            g.fillStyle = dark;
            g.beginPath(); g.ellipse(wx, by, s * 2.4, s * 0.62 * up, 0, Math.PI, Math.PI * 2); g.fill();
            g.beginPath(); g.moveTo(wx - q.dir * s * 1.0, by - s * 0.45 * up); g.lineTo(wx - q.dir * s * 1.45, by - s * 0.42 * up); g.lineTo(wx - q.dir * s * 1.3, by - s * 0.78 * up); g.closePath(); g.fill();
            g.strokeStyle = foam; g.lineWidth = Math.max(1, H * 0.003);
            g.beginPath(); g.ellipse(wx, by, s * 2.6, s * 0.16, 0, 0, Math.PI); g.stroke();
        }
        // the spout: puffs going up and spreading, then gone
        const sk = k > 1 && k < 3 ? (k - 1) / 2 : -1;
        if (sk >= 0) for (let i = 0; i < 9; i++) {
            const life = Math.min(1, Math.max(0, sk * 1.5 - i * 0.06)), a = (1 - life) * 0.85;
            if (a <= 0.02) continue;
            g.fillStyle = nightK ? `rgba(190,200,230,${a})` : `rgba(255,255,255,${a})`;
            g.beginPath(); g.arc(wx + q.dir * s * 1.3 + Math.sin(i * 2.1) * life * s * 0.6, by - s * (0.6 + life * 2.6), s * (0.14 + life * 0.32), 0, 7); g.fill();
        }
        // the tail: the stock up out of the water and the flukes spread across, their pale undersides toward Sarah
        const tk = k > 5.5 && k < 7.5 ? Math.sin((k - 5.5) / 2 * Math.PI) : 0;
        if (tk > 0.01) {
            const cx = wx - q.dir * s * 1.6, top = by - tk * s * 2.3;
            g.fillStyle = dark;
            g.beginPath(); g.moveTo(cx - s * 0.22, by); g.lineTo(cx - s * 0.1, top + s * 0.25); g.lineTo(cx + s * 0.1, top + s * 0.25); g.lineTo(cx + s * 0.22, by); g.closePath(); g.fill();
            for (const side of [-1, 1]) {
                g.fillStyle = nightK ? '#3a4262' : '#e8eef2';
                g.beginPath(); g.moveTo(cx, top + s * 0.3);
                g.quadraticCurveTo(cx + side * s * 0.6, top + s * 0.35, cx + side * s * 1.25, top - s * 0.25);
                g.quadraticCurveTo(cx + side * s * 0.55, top - s * 0.02, cx, top + s * 0.12); g.closePath(); g.fill();
                g.strokeStyle = dark; g.lineWidth = Math.max(1, s * 0.07); g.stroke();
            }
            g.strokeStyle = foam; g.lineWidth = Math.max(1, H * 0.003);
            g.beginPath(); g.ellipse(cx, by, s * 0.7, s * 0.12, 0, 0, Math.PI); g.stroke();
        }
    },
    close() {
        if (!this.on) return;
        this.on = false;
        cancelAnimationFrame(this.raf);
        removeEventListener('keydown', this._key, true);
        removeEventListener('resize', this._resize);
        if (this.root) this.root.remove();
        this.root = null; this.bg = null;
        G.busy = Math.max(0, G.busy - 1);
        G.keys = {};
        S.stats.views = (S.stats.views || 0) + 1;
        const after = this.after;
        this.after = null;
        if (after) setTimeout(after, 30);
    },
};
function lookoutView() {
    return new Promise(res => SeaView.open(async () => { if (Quests.starVisible()) await Quests.lookout(); res(); }));
}

/* on a whale day the neighbors talk about it (a topic for topicLine; _ is everyone without lines of their own) */
const WHALE_TALK = {
    _: ['Did you see the whale? Out past the pier. It went WHOOSH, then it was gone. Then WHOOSH again!',
        "A whale! Off our island! I've been staring at the sea all day. My neck hurts. Worth it.",
        "Somebody said there's a whale out there today. I looked for an hour and saw a lot of sea. Very good sea, though."],
    kai: ["Dude. DUDE. A whale. It spouted like a giant lawn sprinkler. I'm still buzzing.", "The whale and me, we had a moment. It flipped its tail. I flipped my noodles. Same energy."],
    maki: ['A humpback, I believe. It surfaced twice, then dived. I timed it. Of course I timed it.'],
    sully: ['A whale off the pier! Back home we would have charged admission. Wicked big.'],
    coco: ["Don't tell anyone, but I heard the whale is looking for a new island. I'm telling everyone. Is that bad?"],
    cece: ['The whale splashed and I said sorry. Out loud. To the ocean. I do not know why.'],
    brulee: ['A whale! If only the museum had a room big enough. I have asked. The board said no.'],
    cuke: ['I saw the whale at dawn while I was jogging. It was also up early. Respect.'],
    scampi: ["Thar she blows! Haven't seen one that size since my sailing days. Takes me back, it does."],
    mug: ['A whale! In MY day the biggest thing in the sea was a gravy boat.'],
};
EXTRA_TOPICS.push(['whale', n => (SeaSky.whaleDay() ? 1.6 : 0), n => rpick(WHALE_TALK[n.id] || WHALE_TALK._)]);
