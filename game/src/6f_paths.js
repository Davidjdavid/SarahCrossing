/* ---- 6f_paths.js ---- */
/* Paths Sarah lays herself (and the ones Ginger's crew adds when a building moves), drawn over the island's ground.
   S.paths.t maps "x,y" to a style: dirt, stone, brick or planks, or "grass" where an old path was taken up.
   Paths round their corners and join up with the island's own roads. */
const PATH_STYLES = [['dirt', 'Dirt'], ['stone', 'Stones'], ['brick', 'Brick'], ['planks', 'Planks']];
function pathsState() { if (!S.paths) S.paths = { t: {}, auto: {} }; if (!S.paths.auto) S.paths.auto = {}; return S.paths; }
/* the island's own paths as the designer drew them (6zza_designer.js, the design's paths: laid over every game's island,
   the live one's too, under Sarah's own), and a count that changes whenever they do (DESIGN_PATHS_V) */
let DESIGN_PATHS = null, DESIGN_PATHS_V = 0;
function overlayAt(x, y) { const k = x + ',' + y, P = S && S.paths, o = P ? P.t[k] : undefined; return o !== undefined ? o : DESIGN_PATHS ? DESIGN_PATHS[k] : undefined; }
/* changes when any path does, Sarah's or the design's (what the ground's pieces are drawn from) */
function pathsVer() { return (S && S.pathsV || 0) + '.' + DESIGN_PATHS_V; }
/* the path style at a tile ('baked' for the island's own roads), or null */
function pathAt(x, y) {
    const o = overlayAt(x, y);
    if (o === 'grass') return null;
    if (o) return o;
    const c = W0.grid[y] && W0.grid[y][x];
    return c === 'p' || c === 'd' || c === 'b' ? 'baked' : null;
}
function isPathish(x, y) { if (pathAt(x, y)) return true; const c = W0.grid[y] && W0.grid[y][x]; return c === 'c' || c === 'w'; }
/* the ground as it is now (paths taken up are grass again) */
function groundChar(x, y) { const o = overlayAt(x, y); if (o === 'grass') return naturalUnder(x, y); if (o) return 'p'; return W0.grid[y] ? W0.grid[y][x] : '~'; }
/* what's under a road: whatever most of the ground around it is */
function naturalUnder(x, y) {
    const n = { g: 0, s: 0, m: 0 };
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const c = W0.grid[y + dy] && W0.grid[y + dy][x + dx]; if (n[c] != null) n[c]++; }
    return n.s > n.g && n.s >= n.m ? 's' : n.m > n.g ? 'm' : 'g';
}
function heightAt(x, y) { return W0.height && W0.height[y] ? +W0.height[y][x] : 0; }
const RAMPS = new Set((W0.ramps || []).map(([x, y]) => x + ',' + y));

/* ---------------------------------------------------------------- textures */
const PathTex = {
    cache: new Map(), src: null,
    /* tiles of the baked ground to borrow texture from: plain grass / sand / rock by height, and the middle of wide roads */
    sources() {
        if (this.src) return this.src;
        const out = {}, g = W0.grid;
        const same = (x, y, ch) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!g[y + dy] || g[y + dy][x + dx] !== ch || W0.coll[y + dy][x + dx] === '1') return false; return true; };
        for (let y = 2; y < W0.h - 2; y++) for (let x = 2; x < W0.w - 2; x++) {
            const c = g[y][x];
            if (!'gspm'.includes(c) || !same(x, y, c)) continue;
            // stay clear of anything painted on top of the ground (cliff rims and the like)
            if (c !== 'p' && [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dy]) => heightAt(x + dx, y + dy) !== heightAt(x, y))) continue;
            const k = c === 'p' ? 'p' : c + heightAt(x, y);
            (out[k] || (out[k] = [])).push([x, y]);
        }
        this.src = out;
        return out;
    },
    picks: new Map(),
    pickSrc(kind, x, y) {
        const pk = kind + '|' + x + ',' + y;
        if (this.picks.has(pk)) return this.picks.get(pk);
        const S2 = this.sources(), list = S2[kind] || S2.g0 || [];
        let out = null;
        if (list.length) {
            // one of the nearest few, picked by position (so neighbors don't all look identical)
            const near = [];
            for (const q of list) {
                const d = Math.abs(q[0] - x) + Math.abs(q[1] - y);
                if (near.length < 6 || d < near[near.length - 1][0]) { near.push([d, q]); near.sort((a, b) => a[0] - b[0]); if (near.length > 6) near.pop(); }
            }
            out = near[(x * 7 + y * 13) % near.length][1];
        }
        this.picks.set(pk, out);
        return out;
    },
    season() { const a = G.areas.island; return (a && a.bgSeason) || Clock.season(); },
    base(style, x, y) {
        const season = this.season();
        if (style === 'grass' || style === 'dirt') {
            const kind = style === 'dirt' ? 'p' : naturalUnder(x, y) + heightAt(x, y);
            const sp = this.pickSrc(kind, x, y);
            const key = `b|${style}|${season}|${sp ? sp.join(',') : '-'}`;
            let c = this.cache.get(key);
            if (!c) {
                c = document.createElement('canvas'); c.width = c.height = TILE;
                // (from the piece of the baked ground the tile is in; not kept until that piece has loaded)
                const P = Ground.G.size, img = sp ? Ground.piece(season, Math.floor(sp[1] * TILE / P) * Ground.G.cols + Math.floor(sp[0] * TILE / P)) : null;
                if (img) c.getContext('2d').drawImage(img, (sp[0] * TILE) % P, (sp[1] * TILE) % P, TILE, TILE, 0, 0, TILE, TILE);
                if (img || !sp) this.cache.set(key, c);
            }
            return c;
        }
        const v = (x * 3 + y * 5) % 3;
        const key = `b|${style}|${season}|${v}`;
        let c = this.cache.get(key);
        if (!c) { c = drawPathStyle(style, season, v); this.cache.set(key, c); }
        return c;
    },
    /* the tile with rounded corners and soft edges where it meets grass */
    tile(style, x, y) {
        if (style === 'grass') return this.base(style, x, y);
        const n = isPathish(x, y - 1), s = isPathish(x, y + 1), w = isPathish(x - 1, y), e = isPathish(x + 1, y);
        const mask = (n ? 1 : 0) | (e ? 2 : 0) | (s ? 4 : 0) | (w ? 8 : 0);
        const b = this.base(style, x, y);
        const key = `t|${style}|${this.season()}|${mask}|${style === 'dirt' ? PathTex.pickSrc('p', x, y) : (x * 3 + y * 5) % 3}`;
        let c = this.cache.get(key);
        if (c) return c;
        c = document.createElement('canvas'); c.width = c.height = TILE;
        const g = c.getContext('2d');
        g.drawImage(b, 0, 0);
        const r = 5.5;
        const cut = (cx, cy) => {         // round off one outer corner
            for (let py = 0; py < TILE; py++) for (let px = 0; px < TILE; px++) {
                const dx = cx ? px - (TILE - 1 - r) : r - px, dy = cy ? py - (TILE - 1 - r) : r - py;
                if (dx > 0 && dy > 0 && dx * dx + dy * dy > r * r) g.clearRect(px, py, 1, 1);
            }
        };
        if (!n && !w) cut(0, 0);
        if (!n && !e) cut(1, 0);
        if (!s && !e) cut(1, 1);
        if (!s && !w) cut(0, 1);
        g.globalCompositeOperation = 'source-atop';
        g.fillStyle = 'rgba(60,40,30,0.13)';
        if (!n) g.fillRect(0, 0, TILE, 1);
        if (!s) g.fillRect(0, TILE - 1, TILE, 1);
        if (!w) g.fillRect(0, 0, 1, TILE);
        if (!e) g.fillRect(TILE - 1, 0, 1, TILE);
        g.globalCompositeOperation = 'source-over';
        this.cache.set(key, c);
        return c;
    },
    reset() { this.cache.clear(); },
};
function drawPathStyle(style, season, v) {
    const s = new PixSpr(TILE, TILE), win = season === 'winter';
    const rnd = mulberry(hash32(style + v));
    if (style === 'stone') {
        s.rect(0, 0, 16, 16, win ? '#cfc9c4' : '#b8a888');
        const stones = [[1, 1, 6, 5], [8, 0, 7, 6], [0, 7, 5, 5], [6, 7, 5, 4], [12, 7, 4, 5], [2, 12, 6, 4], [9, 12, 6, 4]];
        for (const [x, y, w, h] of stones) {
            const c = rnd() < 0.5 ? '#c8c2ba' : '#b4aea6';
            s.rrect(x, y, w, h, 2, win ? '#e8e8ee' : c);
            s.hline(x + 1, x + w - 2, y, win ? '#ffffff' : '#dcd8d0');
            s.hline(x + 1, x + w - 2, y + h - 1, '#8a857e');
        }
    } else if (style === 'brick') {
        s.rect(0, 0, 16, 16, win ? '#e8dcd6' : '#e0c8b0');
        for (let row = 0; row < 4; row++) {
            const off = row % 2 ? 4 : 0;
            for (let bx = -4; bx < 16; bx += 8) {
                const x = bx + off, c = rnd() < 0.3 ? '#b85a40' : rnd() < 0.5 ? '#c8684a' : '#c06048';
                for (let yy = row * 4; yy < row * 4 + 3; yy++) for (let xx = Math.max(0, x); xx < Math.min(16, x + 7); xx++) s.set(xx, yy, win && yy === row * 4 ? '#f4eeee' : c);
            }
        }
    } else {          // planks
        s.rect(0, 0, 16, 16, '#c99a62');
        for (let y = 0; y < 16; y += 4) {
            s.hline(0, 15, y, '#9a6d3f');
            const c = rnd() < 0.5 ? '#d4a870' : '#bf8f58';
            s.rect(0, y + 1, 16, 3, c);
            s.set(2 + (y % 8), y + 2, '#8a5a33'); s.set(12 - (y % 8), y + 2, '#8a5a33');
        }
        if (win) for (let i = 0; i < 10; i++) s.set(Math.floor(rnd() * 16), Math.floor(rnd() * 16), '#ffffff');
    }
    return s.canvas();
}
/* drawn right over the ground, under everything else */
function drawPaths(ctx, a, cam, v) {
    const P = S && S.paths;
    if ((!P || !Object.keys(P.t).length) && !DESIGN_PATHS) return;
    const x0 = Math.max(0, Math.floor(cam.x / TILE)), y0 = Math.max(0, Math.floor(cam.y / TILE));
    const x1 = Math.min(a.w - 1, Math.ceil((cam.x + v.w) / TILE)), y1 = Math.min(a.h - 1, Math.ceil((cam.y + v.h) / TILE));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const st = overlayAt(x, y);
        if (!st) continue;
        ctx.drawImage(PathTex.tile(st, x, y), x * TILE - cam.x, y * TILE - cam.y);
    }
}
function setPath(x, y, style) {
    const P = pathsState(), k = x + ',' + y;
    if (!style) delete P.t[k]; else P.t[k] = style;
    S.pathsV = (S.pathsV || 0) + 1;
}
/* can a path go here? */
function pathOkAt(x, y) {
    const a = G.areas.island;
    if (x < 1 || y < 1 || x >= a.w - 1 || y >= a.h - 1) return 'edge';
    if (W0.coll[y][x] === '1' || a.waterAt(x, y)) return 'water';
    const c = W0.grid[y][x];
    if (c === 'c' || c === 'w' || c === 'F') return 'fixed';
    if (RAMPS.has(x + ',' + y)) return 'slope';
    if (a.blockedAt(x, y)) return 'blocked';
    return null;
}

/* ---------------------------------------------------------------- the path tool (from Ginger, or the phone) */
const PathTool = {
    on: false, style: 'dirt', look: false, cursor: [0, 0], painting: false, last: null, changed: 0, design: false,
    /* o.design: the designer's paths (the island every game starts from), not Sarah's own */
    open(o) {
        if (this.on || G.mode !== 'play') return;
        this.design = !!(o && o.design && Design.edit);
        if (!this.design && visitorStop('build')) return;
        if (G.area.id !== 'island') { UI.toast('Paths go outside! Head out onto the island first.'); return; }
        UI.close(true); UI.hideDialog();
        this.on = true; this.changed = 0; this.look = false;
        const p = G.player;
        this.cursor = [Math.floor(p.x / TILE), Math.floor((p.y - 2) / TILE) + 1];
        G.camTarget = [p.x, p.y];
        G.keys = {};
        this.render();
        Sfx.ui('open');
    },
    close() {
        if (!this.on) return;
        this.on = false;
        $('#panel').hidden = true; $('#panel').innerHTML = ''; $('#panel').classList.remove('decor');
        UI.modal = false;
        G.camTarget = null;
        if (this.design) { this.design = false; Sfx.ui('close'); IslandEdit.open({ design: true }); return; }
        if (this.changed) { Save.touch(); UI.toast(`${this.changed} ${plural(this.changed, 'tile')} of path laid.`); }
        Sfx.ui('close');
    },
    render() {
        const panel = $('#panel');
        panel.hidden = false; panel.className = 'decor'; panel.innerHTML = '';
        UI.modal = true;
        const head = el('div', 'phead');
        head.appendChild(el('h2', null, this.design ? 'Designer · the island\'s paths' : 'Paths'));
        head.appendChild(btn('Done', 'green', () => this.close()));
        panel.appendChild(head);
        const body = el('div', 'pbody');
        body.appendChild(el('p', 'muted', this.look ? 'Drag to look around the island.' : this.design ? `${G.touchUsed ? 'Tap or drag' : 'Click or drag'} to lay the island's own paths, every game's (Sarah's own still go on top). The eraser takes any of them up, the island's roads too. Save the design to keep them.`
            : G.touchUsed ? 'Tap or drag across the ground to lay a path. Paths can\'t go under trees or buildings.'
            : 'Click or drag to lay a path. (Arrows + Enter work too. Esc when you\'re done.)'));
        const row = el('div', 'st-row');
        for (const [k, label] of PATH_STYLES) row.appendChild(chip(label, () => { this.style = k; this.look = false; this.render(); }, this.style === k && !this.look ? 'on' : ''));
        row.appendChild(chip('Eraser', () => { this.style = 'erase'; this.look = false; this.render(); }, this.style === 'erase' && !this.look ? 'on' : ''));
        row.appendChild(chip('Look around', () => { this.look = !this.look; this.render(); }, this.look ? 'on' : ''));
        if (this.design) {
            if (Design.undo.length) row.appendChild(chip('Undo', () => { Design.back(); this.render(); }));
            row.appendChild(chip(Design.dirty ? 'Save the design' : 'Saved', () => Design.save().then(() => this.render()), Design.dirty ? 'go' : ''));
        }
        body.appendChild(row);
        panel.appendChild(body);
    },
    paint(x, y) {
        const k = this.style;
        if (this.design) return Design.pathPaint(x, y, k);
        if (k === 'erase') {
            const o = overlayAt(x, y), c = W0.grid[y] && W0.grid[y][x];
            const baked = c === 'p' || c === 'd' || c === 'b';
            if (o && o !== 'grass') { setPath(x, y, baked ? 'grass' : null); this.changed++; return true; }
            if (!o && baked) { setPath(x, y, 'grass'); this.changed++; return true; }
            return false;
        }
        const why = pathOkAt(x, y);
        if (why) return false;
        if (overlayAt(x, y) === k) return false;
        setPath(x, y, k);
        this.changed++;
        return true;
    },
    toTile(wx, wy) { return [Math.floor(wx / TILE), Math.floor(wy / TILE)]; },
    down(wx, wy, ev) {
        this.painting = true;
        this.last = null;
        this.drag0 = ev ? [ev.clientX, ev.clientY, G.cam.x, G.cam.y] : null;
        if (this.look) return;
        this.stroke(wx, wy);
    },
    move(wx, wy, ev) {
        if (!this.painting) return;
        if (this.look) {
            if (!ev || !this.drag0) return;
            const k = G.view.cssScale || 1;
            G.camTarget = [this.drag0[2] - (ev.clientX - this.drag0[0]) / k + G.view.w / 2, this.drag0[3] - (ev.clientY - this.drag0[1]) / k + G.view.h / 2];
            return;
        }
        this.stroke(wx, wy);
        // near the screen edge: let the view slide along
        if (ev) {
            const r = $('#game').getBoundingClientRect(), fx = (ev.clientX - r.left) / r.width, fy = (ev.clientY - r.top) / r.height;
            const cx = G.cam.x + G.view.w / 2, cy = G.cam.y + G.view.h / 2;
            if (fx < 0.1 || fx > 0.9 || fy < 0.12 || fy > 0.7) G.camTarget = [cx + (fx < 0.1 ? -24 : fx > 0.9 ? 24 : 0), cy + (fy < 0.12 ? -24 : fy > 0.7 ? 24 : 0)];
        }
    },
    up() { this.painting = false; this.last = null; this.drag0 = null; if (this.design) { Design.pathStroke = false; this.render(); } },
    stroke(wx, wy) {
        const [tx, ty] = this.toTile(wx, wy);
        const pts = this.last ? linePts(this.last[0], this.last[1], tx, ty) : [[tx, ty]];
        this.last = [tx, ty];
        let any = false;
        for (const [x, y] of pts) any = this.paint(x, y) || any;
        if (any) Sfx.step(this.style === 'planks' ? 'wood' : this.style === 'erase' ? 'grass' : 'stone');
        this.cursor = [tx, ty];
    },
    key(code) {
        const c = this.cursor;
        if (code === 'Escape') { this.close(); return; }
        if (code === 'ArrowLeft' || code === 'KeyA') c[0]--;
        else if (code === 'ArrowRight' || code === 'KeyD') c[0]++;
        else if (code === 'ArrowUp' || code === 'KeyW') c[1]--;
        else if (code === 'ArrowDown' || code === 'KeyS') c[1]++;
        else if (isA(code)) { if (this.paint(c[0], c[1])) Sfx.step('stone'); else Sfx.ui('nope'); return; }
        else if (code === 'Digit1') this.style = 'dirt'; else if (code === 'Digit2') this.style = 'stone'; else if (code === 'Digit3') this.style = 'brick'; else if (code === 'Digit4') this.style = 'planks'; else if (code === 'Digit5') this.style = 'erase';
        G.camTarget = [(c[0] + 0.5) * TILE, (c[1] + 0.5) * TILE];
        if (code.startsWith('Digit')) this.render();
    },
    /* the cursor, and a hint of which tiles are off limits */
    draw(ctx) {
        if (!this.on || G.touchUsed) return;
        const [x, y] = this.cursor;
        const bad = this.style !== 'erase' && pathOkAt(x, y);
        ctx.strokeStyle = bad ? '#e0405a' : '#ffcf57'; ctx.lineWidth = 2;
        ctx.strokeRect(x * TILE + 1, y * TILE + 1, TILE - 2, TILE - 2);
    },
};

