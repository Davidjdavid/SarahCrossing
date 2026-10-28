/* ---- 6a_bigmap.js ---- */
/* The big map: the whole island, full screen. Drag to look around, pinch / wheel / buttons to zoom. M opens and
   closes it. Buildings are drawn where they stand now (they can move), with names. */
const BigMap = {
    on: false, root: null, cv: null, g: null, base: null, baseKey: '', z: 1, zMin: 1, cx: 0, cy: 0, ptrs: new Map(), pinch: null, dragged: 0,
    BASE_K: 8,                                   // map pixels per tile in the base image
    open(opts) {
        if (this.on || G.mode !== 'play') return;
        UI.close(true);
        this.on = true;
        this.fromPhone = !!(opts && opts.fromPhone);
        G.keys = {};
        const root = el('div');
        root.id = 'bigmap';
        const cv = el('canvas', 'bm-canvas');
        cv.setAttribute('aria-label', 'Map of the island');
        root.appendChild(cv);
        const top = el('div', 'bm-top');
        if (this.fromPhone) {
            // opened from the phone: the back arrow goes back to the phone
            const bk = el('button', 'bm-x bm-back', '\u2039');
            bk.type = 'button'; bk.setAttribute('aria-label', 'Back to the phone');
            bk.addEventListener('click', () => { this.close(); openPhone(); });
            top.appendChild(bk);
        }
        top.appendChild(el('h2', null, S.islandName || 'The island'));
        const x = el('button', 'bm-x', '\u00d7');
        x.type = 'button'; x.setAttribute('aria-label', 'Close the map');
        x.addEventListener('click', () => this.close());
        top.appendChild(x);
        root.appendChild(top);
        const tools = el('div', 'bm-tools');
        const b = (label, aria, fn) => { const k = el('button', 'mbtn', label); k.type = 'button'; k.setAttribute('aria-label', aria); k.addEventListener('click', fn); tools.appendChild(k); return k; };
        b('\u2212', 'Zoom out', () => this.zoomAt(1 / 1.5));
        b('+', 'Zoom in', () => this.zoomAt(1.5));
        const me = b('', 'Find Sarah', () => this.center(true));
        me.appendChild(iconCanvas(sarahSprite(S.player.outfit, 'down_stand'), 24));
        root.appendChild(tools);
        root.appendChild(el('div', 'bm-hint', G.touchUsed ? 'Drag to look around. Pinch to zoom.' : 'Drag to look around. Scroll or +/- to zoom. M or Esc closes.'));
        $('#ui').appendChild(root);
        this.root = root; this.cv = cv; this.g = cv.getContext('2d');
        this.build();
        this.resize();
        this.fit();
        this.center(false);
        this._rs = () => { this.resize(); this.draw(); };
        addEventListener('resize', this._rs);
        cv.addEventListener('pointerdown', e => this.down(e));
        cv.addEventListener('pointermove', e => this.move(e));
        const up = e => { this.ptrs.delete(e.pointerId); if (this.ptrs.size < 2) this.pinch = null; };
        cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
        cv.addEventListener('wheel', e => { e.preventDefault(); const r = cv.getBoundingClientRect(); this.zoomAt(e.deltaY < 0 ? 1.25 : 0.8, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
        Sfx.ui('open');
        this.draw();
    },
    close() {
        if (!this.on) return;
        this.on = false;
        removeEventListener('resize', this._rs);
        if (this.root) this.root.remove();
        this.root = null; this.ptrs.clear(); this.pinch = null;
        G.keys = {};
        Sfx.ui('close');
    },
    key(code) {
        if (code === 'Escape' || code === 'KeyM' || code === 'KeyB') { this.close(); return; }
        const step = 60 / this.z;
        if (code === 'ArrowLeft' || code === 'KeyA') this.cx -= step;
        else if (code === 'ArrowRight' || code === 'KeyD') this.cx += step;
        else if (code === 'ArrowUp' || code === 'KeyW') this.cy -= step;
        else if (code === 'ArrowDown' || code === 'KeyS') this.cy += step;
        else if (code === 'Minus' || code === 'NumpadSubtract') { this.zoomAt(1 / 1.5); return; }
        else if (code === 'Equal' || code === 'NumpadAdd') { this.zoomAt(1.5); return; }
        else if (isA(code)) { this.center(true); return; }
        this.clampView();
        this.draw();
    },
    /* the island at 8 px per tile: ground, paths Sarah drew, trees, buildings */
    build() {
        const a = G.areas.island, K = this.BASE_K;
        const key = [a.bgSeason, S.pathsV || 0, JSON.stringify(S.buildMoved || {}), Design.ver].join('|');
        if (this.base && this.baseKey === key) return;
        this.baseKey = key;
        const c = document.createElement('canvas');
        c.width = a.w * K; c.height = a.h * K;
        const g = c.getContext('2d');
        g.imageSmoothingEnabled = true;
        // (drawn from the island's own tiles: 28 October, the map redone; it shows the designer's stairs too)
        this.tiles(g, K, a.bgSeason || Clock.season());
        this.baseOk = true;
        if (typeof drawPathsOnMap === 'function') drawPathsOnMap(g, K);
        // trees and bushes as little dots
        for (const e of a.ents) {
            if (e.kind !== 'tree' && e.kind !== 'fruittree' && e.kind !== 'bigtree' && e.kind !== 'oldtree') continue;
            const big = e.kind === 'bigtree' || e.kind === 'oldtree';
            const x = e.x / TILE * K, y = (e.y - 6) / TILE * K;
            g.fillStyle = 'rgba(20,40,20,0.35)';
            g.beginPath(); g.ellipse(x + 1, y + 2, big ? 9 : 4.5, big ? 6 : 3, 0, 0, 7); g.fill();
            const blossom = e.frame && String(e.frame).includes('blossom') && a.bgSeason === 'spring';
            g.fillStyle = blossom ? '#f2a6c4' : a.bgSeason === 'fall' ? '#c98a3a' : a.bgSeason === 'winter' ? '#e8eef6' : e.kind === 'fruittree' ? '#5a9e3c' : '#3f8a3a';
            g.beginPath(); g.arc(x, y, big ? 8 : 4, 0, 7); g.fill();
        }
        // buildings: a little roof in the building's own color (the lighthouse and the windmill each a picture of their own,
        // David, 29 October)
        for (const e of a.ents) {
            if (e.kind !== 'building') continue;
            const b = e.b;
            if (e.id === 'lighthouse') { mapLighthouse(g, (b.x + b.w / 2) * K, (b.y + b.h) * K, K); continue; }
            const look = HOUSE_BASE[e.id] ? houseLook(e.id) : null;
            const biz = { club: ['#2e2458', '#e0559a'], barn: ['#c0392b', '#7a2a22'], museum: ['#f4efe6', '#8a95a8'], arcade: ['#2e2458', '#4ec3d9'],
                salon: ['#f6e8fa', '#b37cf0'], displays: ['#eef4e0', '#4a8a4a'], shop: ['#f7ecd6', '#d9913a'], builder: ['#f2e2c8', '#8a5a33'],
                restaurant: ['#fff4dc', '#e0405a'], boutique: ['#fff2f4', '#f7962d'], studio: ['#e8b48a', '#b8553a'] }[e.id];
            let wall = (look && look.wall) || (biz && biz[0]) || '#fbe7d0', roof = (look && look.roof) || (biz && biz[1]) || '#d9674a';
            if (roof === 'rainbow') roof = '#ff5aa8';
            const x = b.x * K, y = b.y * K, w = b.w * K, h = b.h * K;
            g.fillStyle = 'rgba(30,20,40,0.35)'; g.fillRect(x + 2, y + 3, w, h);
            g.fillStyle = wall; g.fillRect(x, y + h * 0.45, w, h * 0.55);
            g.fillStyle = roof; g.fillRect(x, y, w, h * 0.5);
            g.fillStyle = 'rgba(59,42,69,0.85)'; g.fillRect(x + (b.door + 0.3) * K, y + h - K * 0.7, K * 0.4, K * 0.7);
            g.strokeStyle = 'rgba(59,42,69,0.9)'; g.lineWidth = 1.5; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        }
        const wm = W0.props.find((p, i) => p.kind === 'windmill' && !propGone(i));
        if (wm) mapWindmill(g, (wm.x + 1.5) * K, (wm.y + 2) * K, K);
        this.base = c;
    },
    /* the island as a map (David, 28 October: "the map redone to look better"): flat colors by kind of ground, each level
       of grass a shade lighter than the one below it, the cliffs' edges drawn dark, the sea paler along the shore, so it
       reads at a glance like Animal Crossing's map */
    tiles(g, K, season) {
        const GR = W0.grid, HT = W0.height, Wt = W0.w, Ht = W0.h;
        const grass = { spring: ['#86cf63', '#94d770', '#a2de7c', '#b0e488', '#bde994', '#c9ee9f'], summer: ['#7cc858', '#8ad064', '#98d770', '#a6de7c', '#b3e388', '#bfe893'],
            fall: ['#a9bd5c', '#b5c566', '#c0cc70', '#cad37a', '#d3d984', '#dbdf8e'], winter: ['#dfe9ec', '#e5eef0', '#eaf2f3', '#eff5f6', '#f3f8f9', '#f7fbfb'] }[season] || null;
        const G2 = grass || ['#86cf63', '#94d770', '#a2de7c', '#b0e488', '#bde994', '#c9ee9f'];
        const ch = (x, y) => (GR[y] && GR[y][x]) || '~', lv = (x, y) => +((HT[y] || [])[x]) || 0;
        const COL = { s: '#f2e2ae', p: '#e6cf98', d: '#d9bc84', c: '#d6d0c2', F: '#c4975e', w: '#b78757', x: '#c8eef4', h: '#c8eef4', o: '#62bde0', r: '#62bde0', W: '#a8e0f2', m: '#a7ad8f' };
        for (let y = 0; y < Ht; y++) for (let x = 0; x < Wt; x++) {
            const k = ch(x, y);
            let col;
            if (k === '~') {
                // (the sea: deeper blue out from the shore)
                let near = false;
                for (let j = -2; j <= 2 && !near; j++) for (let i = -2; i <= 2 && !near; i++) if (ch(x + i, y + j) !== '~') near = true;
                col = near ? '#86d3ea' : '#5fb7d9';
            } else col = COL[k] || G2[Math.min(G2.length - 1, lv(x, y))];
            g.fillStyle = col;
            g.fillRect(x * K, y * K, K, K);
        }
        // the cliffs' edges: where the ground steps down to the south, east or west, a dark line along the top
        g.strokeStyle = 'rgba(52,72,40,0.55)'; g.lineWidth = Math.max(1, K * 0.22);
        g.beginPath();
        for (let y = 0; y < Ht; y++) for (let x = 0; x < Wt; x++) {
            if (ch(x, y) === '~') continue;
            const h = lv(x, y);
            if (y + 1 < Ht && lv(x, y + 1) < h && ch(x, y + 1) !== '~' && !RAMPS.has(x + ',' + (y + 1))) { g.moveTo(x * K, (y + 1) * K); g.lineTo((x + 1) * K, (y + 1) * K); }
            if (x + 1 < Wt && lv(x + 1, y) < h && ch(x + 1, y) !== '~') { g.moveTo((x + 1) * K, y * K); g.lineTo((x + 1) * K, (y + 1) * K); }
            if (x > 0 && lv(x - 1, y) < h && ch(x - 1, y) !== '~') { g.moveTo(x * K, y * K); g.lineTo(x * K, (y + 1) * K); }
        }
        g.stroke();
        // (the shore: a pale line where the land meets the sea)
        g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = Math.max(1, K * 0.18);
        g.beginPath();
        for (let y = 0; y < Ht; y++) for (let x = 0; x < Wt; x++) {
            if (ch(x, y) !== '~') continue;
            if (ch(x, y - 1) !== '~' && y > 0) { g.moveTo(x * K, y * K + 1); g.lineTo((x + 1) * K, y * K + 1); }
            if (ch(x, y + 1) !== '~' && y + 1 < Ht) { g.moveTo(x * K, (y + 1) * K - 1); g.lineTo((x + 1) * K, (y + 1) * K - 1); }
            if (ch(x - 1, y) !== '~' && x > 0) { g.moveTo(x * K + 1, y * K); g.lineTo(x * K + 1, (y + 1) * K); }
            if (ch(x + 1, y) !== '~' && x + 1 < Wt) { g.moveTo((x + 1) * K - 1, y * K); g.lineTo((x + 1) * K - 1, (y + 1) * K); }
        }
        g.stroke();
    },
    resize() {
        const r = this.root.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
        this.W = r.width; this.H = r.height; this.dpr = dpr;
        this.cv.width = Math.round(r.width * dpr); this.cv.height = Math.round(r.height * dpr);
        this.cv.style.width = r.width + 'px'; this.cv.style.height = r.height + 'px';
        const bw = this.base.width, bh = this.base.height;
        this.zMin = Math.min(this.W / bw, this.H / bh) * 0.96;
        if (this.z < this.zMin) this.z = this.zMin;
    },
    /* the whole island on a wide screen; on a tall phone, fill the height and let her drag sideways */
    fit() {
        const bw = this.base.width, bh = this.base.height;
        this.z = this.W / this.H > 0.8 ? this.zMin : clamp(Math.min(this.H / bh, this.W / bw * 2.4) * 0.92, this.zMin, this.zMin * 3);
    },
    /* where Sarah is, in base-map pixels (inside a building: its door) */
    sarahAt() {
        const K = this.BASE_K, p = G.player;
        if (G.area.id === 'island') return [p.x / TILE * K, (p.y - 4) / TILE * K];
        const b = bldOf(G.area.building || G.area.id) || W0.buildings.home;
        return [(b.x + b.door + 0.5) * K, (b.y + b.h) * K];
    },
    center(anim) {
        const [x, y] = this.sarahAt();
        this.cx = x; this.cy = y;
        this.clampView();
        this.draw();
        if (anim) Sfx.ui('tick');
    },
    clampView() {
        const bw = this.base.width, bh = this.base.height, hw = this.W / 2 / this.z, hh = this.H / 2 / this.z;
        this.cx = bw <= hw * 2 ? bw / 2 : clamp(this.cx, hw, bw - hw);
        this.cy = bh <= hh * 2 ? bh / 2 : clamp(this.cy, hh, bh - hh);
    },
    zoomAt(f, sx, sy) {
        sx = sx == null ? this.W / 2 : sx; sy = sy == null ? this.H / 2 : sy;
        const mx = this.cx + (sx - this.W / 2) / this.z, my = this.cy + (sy - this.H / 2) / this.z;
        this.z = clamp(this.z * f, this.zMin, Math.max(this.zMin * 6, 3));
        this.cx = mx - (sx - this.W / 2) / this.z; this.cy = my - (sy - this.H / 2) / this.z;
        this.clampView();
        this.draw();
    },
    down(e) {
        e.preventDefault();
        this.ptrs.set(e.pointerId, [e.clientX, e.clientY]);
        try { this.cv.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
        if (this.ptrs.size === 2) { const [a, b] = [...this.ptrs.values()]; this.pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] }; }
    },
    move(e) {
        const prev = this.ptrs.get(e.pointerId);
        if (!prev) return;
        const now = [e.clientX, e.clientY];
        this.ptrs.set(e.pointerId, now);
        if (this.ptrs.size >= 2 && this.pinch) {
            const [a, b] = [...this.ptrs.values()];
            const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
            const r = this.cv.getBoundingClientRect();
            if (d > 10) this.zoomAt(d / this.pinch.d, (a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top);
            this.pinch.d = d;
            return;
        }
        this.cx -= (now[0] - prev[0]) / this.z; this.cy -= (now[1] - prev[1]) / this.z;
        this.clampView();
        this.draw();
    },
    draw() {
        if (!this.on) return;
        if (this.base && !this.baseOk && Ground.map(G.areas.island.bgSeason)) this.build();
        const g = this.g, dpr = this.dpr, z = this.z;
        g.setTransform(1, 0, 0, 1, 0, 0);
        const ox = this.W / 2 - this.cx * z, oy = this.H / 2 - this.cy * z;
        mapSea(this, g, ox, oy, z, dpr);                 // the open sea all around, with little waves
        g.setTransform(dpr * z, 0, 0, dpr * z, dpr * ox, dpr * oy);
        g.imageSmoothingEnabled = z < 1;
        g.drawImage(this.base, 0, 0);
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        const S2 = (mx, my) => [ox + mx * z, oy + my * z];
        const K = this.BASE_K;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        // labels never pile up on each other: the first one to claim a spot keeps it
        const placed = [];
        const label = (mx, my, text, col, big, force, dy) => {
            const [x, y0] = S2(mx, my), y = y0 + (dy || 0);
            if (x < -80 || y < -20 || x > this.W + 80 || y > this.H + 20) return false;
            g.font = `600 ${big ? 15 : 12}px Fredoka, sans-serif`;
            const w = g.measureText(text).width + 12, h = big ? 22 : 18;
            const r = { x: x - w / 2 - 2, y: y - h / 2 - 1, w: w + 4, h: h + 2 };
            if (!force && placed.some(q => r.x < q.x + q.w && r.x + r.w > q.x && r.y < q.y + q.h && r.y + r.h > q.y)) return false;
            placed.push(r);
            g.fillStyle = 'rgba(59,42,69,0.82)';
            roundRect(g, x - w / 2, y - h / 2, w, h, h / 2); g.fill();
            g.fillStyle = col || '#fff7f1';
            g.fillText(text, x, y + 1);
            return true;
        };
        // whose house is whose: the owner's little face on the roof, always
        const faceSize = clamp(9 * K * z * 0.3, 18, 30);
        const face = (id, mx, my) => {
            const d = NPC_DEFS[id];
            const f = d && Assets.frames[d.human ? `${d.human}_down_stand` : `${d.sprite}_0`];
            if (!f) return;
            const [x, y] = S2(mx, my);
            if (x < -40 || y < -40 || x > this.W + 40 || y > this.H + 40) return;
            const [sx, sy, w, h] = f, size = faceSize, k = size / Math.max(w, h);
            g.fillStyle = 'rgba(255,247,241,0.92)';
            g.beginPath(); g.arc(x, y, size * 0.62, 0, 7); g.fill();
            g.strokeStyle = d.color || '#6e5a78'; g.lineWidth = 2; g.stroke();
            const was = g.imageSmoothingEnabled;
            g.imageSmoothingEnabled = false;
            g.drawImage(Assets.atlas, sx, sy, w, h, Math.round(x - w * k / 2), Math.round(y - h * k / 2), Math.round(w * k), Math.round(h * k));
            g.imageSmoothingEnabled = was;
            placed.push({ x: x - size * 0.62, y: y - size * 0.62, w: size * 1.24, h: size * 1.24 });
        };
        const names = { home: 'Home', shop: "Fortune's", club: 'Club Wasabi', boutique: 'Boutique', studio: 'Pottery', arcade: 'Arcade',
            builder: "Ginger's Workshop", museum: 'Museum', restaurant: "Mac's Diner", barn: 'Barn', salon: 'Salon', displays: "Waffle's",
            lighthouse: 'Lighthouse', townhall: 'Town Hall', postoffice: 'Post Office', bank: 'Bank' };
        const small = z < this.zMin * 1.35;
        // Sarah first (a pulsing dot), so nothing covers her
        const [px, py] = S2(...this.sarahAt());
        const pulse = 1 + 0.25 * Math.sin(Date.now() / 220);
        const houses = Object.entries(W0.buildings).filter(([id]) => id.startsWith('h_') && NPC_DEFS[id.slice(2)]);
        for (const [id, b] of houses) face(id.slice(2), (b.x + b.w / 2) * K, (b.y + b.h * 0.3) * K);
        g.fillStyle = 'rgba(255,255,255,0.9)';
        g.beginPath(); g.arc(px, py, 8 * pulse, 0, 7); g.fill();
        g.fillStyle = '#b3263a';
        g.beginPath(); g.arc(px, py, 5.5, 0, 7); g.fill();
        label((px - ox) / z, (py + 18 - oy) / z, G.area.id === 'island' ? 'Sarah' : 'Sarah (inside)', '#ffd1dc', false, true);
        for (const [id, b] of Object.entries(W0.buildings)) {
            // (the lighthouse's picture stands taller than its footprint: named over its lamp)
            if (names[id]) label((b.x + b.w / 2) * K, (id === 'lighthouse' ? b.y + b.h - 5.6 : b.y - 0.2) * K, names[id], id === 'home' ? '#ffd1dc' : '#ffe9a8', id === 'home');
        }
        // then the neighbors' houses, named right under the owner's face ("Maki's"; zoomed in: "Maki's house")
        for (const [id, b] of houses) {
            const nm = NPC_DEFS[id.slice(2)].name, text = small ? `${nm}'s` : `${nm}'s house`;
            if (!label((b.x + b.w / 2) * K, (b.y + b.h * 0.3) * K, text, '#fff7f1', false, false, faceSize * 0.62 + 10))
                label((b.x + b.w / 2) * K, (b.y + b.h * 0.3) * K, text, '#fff7f1', false, false, -faceSize * 0.62 - 10);
        }
        const sp = W0.spots;
        const places = [['Town square', sp.plaza.x + 0.5, sp.plaza.y + 3], ['Dock', sp.pier.x + 0.5, sp.pier.y + 3], [landmarkName('orchard', 'Orchard'), sp.orchard.x + 0.5, sp.orchard.y - 3],
            [landmarkName('pond', 'Pond'), sp.pond.x + 0.5, sp.pond.y - 3], ['Farm', sp.farm.x + 0.5, sp.farm.y + 5], [landmarkName('forest', 'Forest'), sp.forest.x + 0.5, sp.forest.y - 2],
            [landmarkName('mountain', 'Mountain'), sp.mountain.x + 0.5, sp.mountain.y - 6], [landmarkName('lookout', 'Lookout'), sp.lookout.x + 0.5, sp.lookout.y - 2], [landmarkName('waterfall', 'Waterfall'), sp.waterfall.x + 4, sp.waterfall.y - 4],
            [landmarkName('spring', 'Hot spring'), W0.wonton[0], W0.wonton[1] - 4], [landmarkName('beach', 'Beach'), sp.beach.x, sp.beach.y + 2], [landmarkName('campsite', 'Campsite'), sp.campsite.x + 0.5, sp.campsite.y - 5],
            ['Bonfire', sp.bonfire.x + 0.5, sp.bonfire.y + 4], ['Market Lane', sp.boardwalk.x, sp.boardwalk.y - 4.5],
            [landmarkName('oldtree', 'Old tree'), sp.oldtree.x, sp.oldtree.y + 3], [landmarkName('eastmeadow', 'East meadow'), sp.eastmeadow.x, sp.eastmeadow.y + 3], [landmarkName('glade', 'The glade'), sp.meadow.x + 0.5, sp.meadow.y - 4]];
        if (W0.props.some(p => p.kind === 'windmill')) { const w = W0.props.find(p => p.kind === 'windmill'); places.push(['Windmill', w.x + 1.5, w.y - 3]); }
        // (the areas drawn in the designer, named first: 6zza_designer.js)
        for (const A of Design.areas().filter(A => !Design.untouched(A))) { const big = A.rects.slice().sort((p, q) => q[2] * q[3] - p[2] * p[3])[0]; if (big) label((big[0] + big[2] / 2) * K, (big[1] + big[3] / 2) * K, A.name.replace(/^the /, 'The '), '#ffd6a8'); }
        for (const [t, x, y] of places) label(x * K, y * K, t, '#c8f0a0');
        mapExtras(this, g, ox, oy, z);                    // a boat, some gulls and the compass
    },
    tick() { if (this.on && G.frame % 4 === 0) this.draw(); },
};
function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.arcTo(x + w, y, x + w, y + r, r); g.lineTo(x + w, y + h - r); g.arcTo(x + w, y + h, x + w - r, y + h, r);
    g.lineTo(x + r, y + h); g.arcTo(x, y + h, x, y + h - r, r); g.lineTo(x, y + r); g.arcTo(x, y, x + r, y, r); g.closePath();
}
/* zoom in Settings */
function zoomSetting() {
    const box = el('div', 'field');
    box.style.marginTop = '14px';
    box.appendChild(el('span', null, 'Zoom'));
    const row = el('div', 'st-row');
    const draw = () => {
        row.innerHTML = '';
        ZOOM_NAMES.forEach((n, i) => row.appendChild(chip(n, () => { Zoom.set(i, true); draw(); }, Zoom.pref === i ? 'on' : '')));
    };
    draw();
    box.appendChild(row);
    box.appendChild(el('p', 'muted', G.touchUsed ? 'Pinch the island to zoom, too.' : 'The - and + keys (or the mouse wheel) zoom, too.'));
    return box;
}


/* the map's lighthouse: a tapering white tower in red bands, the lamp room glowing on top, a gallery round it */
function mapLighthouse(g, cx, by, K) {
    const h = K * 4.2, w0 = K * 1.5, w1 = K * 0.95, top = by - h;
    g.fillStyle = 'rgba(30,20,40,0.35)'; g.beginPath(); g.ellipse(cx + 3, by, w0 * 0.75, K * 0.45, 0, 0, 7); g.fill();
    g.beginPath(); g.moveTo(cx - w0 / 2, by); g.lineTo(cx - w1 / 2, top + K * 0.8); g.lineTo(cx + w1 / 2, top + K * 0.8); g.lineTo(cx + w0 / 2, by); g.closePath();
    g.fillStyle = '#fbf6ee'; g.fill();
    g.save(); g.clip();
    g.fillStyle = '#d8434a';
    for (let k = 0; k < 3; k++) { const y = by - (k * 2 + 1) * (h - K * 0.8) / 6; g.fillRect(cx - w0, y - (h - K * 0.8) / 12, w0 * 2, (h - K * 0.8) / 6); }
    g.restore();
    g.strokeStyle = 'rgba(59,42,69,0.9)'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(cx - w0 / 2, by); g.lineTo(cx - w1 / 2, top + K * 0.8); g.lineTo(cx + w1 / 2, top + K * 0.8); g.lineTo(cx + w0 / 2, by); g.closePath(); g.stroke();
    // (the gallery, the lamp room and its cap)
    g.fillStyle = '#3b2a45'; g.fillRect(cx - w1 * 0.75, top + K * 0.7, w1 * 1.5, K * 0.22);
    g.fillStyle = '#ffd86a'; g.fillRect(cx - w1 * 0.36, top + K * 0.12, w1 * 0.72, K * 0.58);
    g.strokeRect(cx - w1 * 0.36, top + K * 0.12, w1 * 0.72, K * 0.58);
    g.fillStyle = '#d8434a'; g.beginPath(); g.moveTo(cx - w1 * 0.5, top + K * 0.14); g.lineTo(cx, top - K * 0.45); g.lineTo(cx + w1 * 0.5, top + K * 0.14); g.closePath(); g.fill(); g.stroke();
}
/* the map's windmill: a round-shouldered tower with a door and four sails crossed on its front */
function mapWindmill(g, cx, by, K) {
    const h = K * 2.6, w0 = K * 1.9, w1 = K * 1.2, top = by - h;
    g.fillStyle = 'rgba(30,20,40,0.35)'; g.beginPath(); g.ellipse(cx + 3, by, w0 * 0.7, K * 0.4, 0, 0, 7); g.fill();
    g.beginPath(); g.moveTo(cx - w0 / 2, by); g.lineTo(cx - w1 / 2, top); g.lineTo(cx + w1 / 2, top); g.lineTo(cx + w0 / 2, by); g.closePath();
    g.fillStyle = '#f2e2c8'; g.fill(); g.strokeStyle = 'rgba(59,42,69,0.9)'; g.lineWidth = 1.5; g.stroke();
    g.fillStyle = '#b8553a'; g.beginPath(); g.moveTo(cx - w1 * 0.62, top + 1); g.quadraticCurveTo(cx, top - K * 1.1, cx + w1 * 0.62, top + 1); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(59,42,69,0.85)'; g.fillRect(cx - K * 0.22, by - K * 0.75, K * 0.44, K * 0.75);
    // (the sails, a little turned, each a lattice of slats)
    const hx = cx, hy = top + K * 0.25, L = K * 1.9;
    for (let k = 0; k < 4; k++) {
        const a = Math.PI / 4 + k * Math.PI / 2, ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux;
        g.strokeStyle = '#6b4a2e'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx + ux * L, hy + uy * L); g.stroke();
        g.fillStyle = 'rgba(255,250,240,0.92)'; g.beginPath();
        g.moveTo(hx + ux * L * 0.25, hy + uy * L * 0.25); g.lineTo(hx + ux * L, hy + uy * L);
        g.lineTo(hx + ux * L + px * K * 0.5, hy + uy * L + py * K * 0.5); g.lineTo(hx + ux * L * 0.25 + px * K * 0.5, hy + uy * L * 0.25 + py * K * 0.5); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(107,74,46,0.8)'; g.lineWidth = 1; g.stroke();
    }
    g.fillStyle = '#3b2a45'; g.beginPath(); g.arc(hx, hy, K * 0.18, 0, 7); g.fill();
}
