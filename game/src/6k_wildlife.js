/* ---- 6k_wildlife.js ---- */
/* Island wildlife and the world around it. Birds peck in the grass, squirrels and rabbits and the odd deer live in
   the forest, gulls and crabs on the beaches, ducks and frogs at the pond: they all scatter when Sarah gets too close.
   Out on the water, sailboats, a fishing boat and the ferry go by, dolphins jump, and now and then a plane or a hot air
   balloon crosses the sky, with gulls wheeling over the beach. It's all decoration: nothing here can be caught. */
const CRITTER = {
    bird:      { fly: true, r: 46, frames: { idle: ['stand', 'peck'], run: ['fly0', 'fly1'] } },
    squirrel:  { r: 42, frames: { idle: ['stand'], run: ['run0', 'run1'] } },
    rabbit:    { r: 42, frames: { idle: ['sit'], run: ['hop0', 'hop1'] } },
    deer:      { r: 76, frames: { idle: ['stand'], run: ['run0', 'stand'] } },
    owl:       { fly: true, r: 40, frames: { idle: ['sit', 'sit', 'sit', 'blink'], run: ['sit'] }, ownFly: 'bird' },
    gull:      { fly: true, r: 54, frames: { idle: ['stand'], run: ['fly0', 'fly1'] } },
    crab:      { r: 34, frames: { idle: ['0', '1'], run: ['0', '1'] }, burrow: true },
    duck:      { r: 40, frames: { idle: ['0', '1'], run: ['0', '1'] }, swim: true },
    frog:      { r: 30, frames: { idle: ['sit'], run: ['jump'] }, burrow: true },
    butterfly: { r: 0, frames: { idle: ['0', '1'], run: ['0', '1'] }, flutter: true },
};
function tileKind(x, y) {
    const g = W0.grid[y] && W0.grid[y][x];
    if (!g) return null;
    const h = heightAt(x, y);
    if (h === 1 && x >= 56 && x <= 112 && y >= 4 && y <= 40) return 'forest';
    if (g === 's') return 'sand';
    if (g === 'g' || g === 'm') return 'grass';
    if (g === 'o' || g === 'r') return 'fresh';
    return null;
}
const Critters = {
    list: [], max: 12, spawnT: 0,
    reset() { this.list = []; },
    /* what's on screen (world pixels): the flat view's, or in the 3D views the bigger part of the world they show */
    view() {
        const v = G.view, cam = G.cam, r = typeof R3 !== 'undefined' && R3.active() && R3.view;
        return r ? { x: r.x0, y: r.y0, w: r.x1 - r.x0, h: r.y1 - r.y0 } : { x: cam.x, y: cam.y, w: v.w, h: v.h };
    },
    spawn() {
        const a = G.areas.island, V = this.view();
        if (!a || G.area !== a) return;
        const h = Clock.hourF(), night = h >= 21 || h < 5.5, season = Clock.season(), rain = G.weather === 'rain' || G.weather === 'snow';
        // just outside the view (nobody pops out of thin air in front of Sarah)
        const tx0 = Math.floor(V.x / TILE) - 6, ty0 = Math.floor(V.y / TILE) - 6, tw = Math.ceil(V.w / TILE) + 12, th = Math.ceil(V.h / TILE) + 12;
        for (let tries = 0; tries < 8; tries++) {
            const tx = tx0 + Math.floor(R() * tw), ty = ty0 + Math.floor(R() * th);
            const inView = tx * TILE > V.x - 8 && tx * TILE < V.x + V.w + 8 && ty * TILE > V.y - 8 && ty * TILE < V.y + V.h + 24;
            if (inView && R() < 0.85) continue;
            const k = tileKind(tx, ty);
            if (!k) continue;
            let kind = null, sub = null;
            const r = R();
            if (k === 'forest') {
                if (a.blockedAt(tx, ty)) continue;
                if (night) kind = r < 0.5 ? 'owl' : r < 0.75 ? 'rabbit' : null;
                else kind = r < 0.36 ? 'squirrel' : r < 0.7 ? 'bird' : r < 0.9 ? 'rabbit' : 'deer';
            } else if (k === 'grass') {
                if (a.blockedAt(tx, ty) || pathAt(tx, ty)) continue;
                if (night) kind = r < 0.3 ? 'rabbit' : null;
                else kind = r < 0.6 ? 'bird' : r < 0.8 ? 'rabbit' : (season === 'spring' || season === 'summer') && !rain ? 'butterfly' : 'bird';
            } else if (k === 'sand') {
                if (a.blockedAt(tx, ty)) continue;
                kind = night ? (r < 0.5 ? 'crab' : null) : r < 0.6 ? 'gull' : 'crab';
            } else if (k === 'fresh') {
                if (season === 'winter') continue;
                if (a.waterAt(tx, ty) === 'p' || a.waterAt(tx, ty) === 'r') kind = !night && r < 0.7 ? 'duck' : null;
                else continue;
            }
            if (!kind || (rain && (kind === 'bird' || kind === 'butterfly') && R() < 0.7)) continue;
            if (kind === 'deer') { let free = true; for (let dx = -1; dx <= 1; dx++) if (a.blockedAt(tx + dx, ty)) free = false; if (!free) continue; }
            if (kind === 'bird') sub = rpick(['robin', 'bluebird', 'sparrow']);
            if (kind === 'butterfly') sub = rint(0, 3);
            this.list.push({ kind, sub, x: (tx + 0.3 + R() * 0.4) * TILE, y: (ty + 0.6) * TILE, flip: R() < 0.5, state: 'idle', t: rint(0, 60), alt: kind === 'butterfly' ? 10 : 0,
                vx: 0, vy: 0, fade: 1, home: [(tx + 0.5) * TILE, (ty + 0.6) * TILE] });
            return;
        }
    },
    frameName(c) {
        const def = CRITTER[c.kind], set = c.state === 'idle' ? def.frames.idle : def.frames.run;
        const f = set[Math.floor(c.t / (c.state === 'idle' ? 26 : 6)) % set.length];
        if (c.kind === 'bird') return `cr_${c.sub}_${f}`;
        if (c.kind === 'butterfly') return `cr_butterfly${c.sub}_${f}`;
        if (c.kind === 'owl' && c.state !== 'idle') return `cr_sparrow_${['fly0', 'fly1'][Math.floor(c.t / 6) % 2]}`;
        return `cr_${c.kind}_${f}`;
    },
    flee(c, fromX, fromY) {
        if (c.state !== 'idle' || c.kind === 'butterfly') return;
        const def = CRITTER[c.kind];
        const away = c.x >= fromX ? 1 : -1;
        c.state = 'run'; c.t = 0; c.flip = away < 0;
        if (def.fly) { c.vx = away * (0.9 + R() * 0.8); c.vy = -(0.3 + R() * 0.5); c.climb = 0.9 + R() * 0.5; }
        else if (c.kind === 'deer') { c.vx = away * 2.6; c.vy = (R() - 0.5) * 0.6; }
        else if (c.kind === 'duck') { c.vx = away * 0.7; c.vy = (R() - 0.5) * 0.3; }
        else { c.vx = away * (c.kind === 'crab' ? 1.0 : c.kind === 'frog' ? 1.2 : 2.1); c.vy = (R() - 0.5) * 0.8; }
        if (def.fly && G.frame % 3 === 0) Sfx.ui('tick');
    },
    startle(x, y, r) { for (const c of this.list) if (Math.hypot(c.x - x, c.y - y) < r) this.flee(c, x, y); },
    update() {
        const a = G.areas.island;
        if (!a || G.area !== a || G.mode !== 'play') { if (this.list.length && G.area && G.area !== a) this.list = []; return; }
        if (++this.spawnT >= 50) { this.spawnT = 0; if (this.list.length < this.max * (townOrd() === 'nature' ? 1.5 : 1)) this.spawn(); }
        const p = G.player, V = this.view();
        for (const c of this.list) {
            c.t++;
            const def = CRITTER[c.kind];
            if (c.state === 'idle') {
                const d = p && !p.hidden ? Math.hypot(p.x - c.x, p.y - c.y) : 9999;
                if (def.r && d < def.r * (p.run ? 1.35 : 1)) { this.flee(c, p.x, p.y); continue; }
                if (def.flutter) {
                    c.x = c.home[0] + Math.sin(c.t / 40) * 14 + Math.sin(c.t / 13) * 3;
                    c.y = c.home[1] + Math.cos(c.t / 55) * 6;
                    c.alt = 10 + Math.sin(c.t / 9) * 3;
                    c.flip = Math.cos(c.t / 40) < 0;
                } else if (c.kind === 'crab' || c.kind === 'duck') {
                    c.x = c.home[0] + Math.sin(c.t / (c.kind === 'crab' ? 30 : 90)) * (c.kind === 'crab' ? 6 : 10);
                } else if (c.t % 150 === 0 && R() < 0.5 && c.kind !== 'owl') {
                    // a few steps somewhere nearby
                    const nx = c.x + (R() - 0.5) * 20, ny = c.y + (R() - 0.5) * 8;
                    if (!a.blockedAt(Math.floor(nx / TILE), Math.floor((ny - 2) / TILE))) { c.flip = nx < c.x; c.x = nx; c.y = ny; }
                }
                continue;
            }
            // running, hopping, flying off
            c.x += c.vx; c.y += c.vy;
            if (def.fly) { c.alt += c.climb; c.vy -= 0.01; }
            if (c.kind === 'rabbit' || c.kind === 'frog') c.alt = Math.abs(Math.sin(c.t / 5)) * 4;
            if (def.burrow && c.t > 30) c.fade -= 0.05;
            if (c.kind === 'duck' && c.t > 50) c.fade -= 0.03;
            if (!def.fly && !def.burrow && c.kind !== 'duck' && c.t > 50) c.fade -= 0.04;
            if (c.fade <= 0 || c.t > 400 || c.x < V.x - 120 || c.x > V.x + V.w + 120 || c.y - c.alt < V.y - 140) c.gone = true;
        }
        this.list = this.list.filter(c => !c.gone && Math.abs(c.x - (V.x + V.w / 2)) < V.w + 400 && Math.abs(c.y - (V.y + V.h / 2)) < V.h + 400);
    },
    /* critters as things to y-sort with everything else (flyers go on top) */
    ents() {
        return this.list.map(c => {
            if (!c.draw) c.draw = ctx => {
                const flying = c.alt > 1;
                if (flying && c.kind !== 'butterfly') { ctx.fillStyle = 'rgba(20,20,40,0.2)'; ctx.fillRect(Math.round(c.x - 2), Math.round(c.y - 1), 5, 2); }
                spr(ctx, this.frameName(c), c.x, c.y - c.alt, c.flip, c.fade < 1 ? Math.max(0, c.fade) : null);
            };
            c.sy = c.alt > 6 && c.kind !== 'butterfly' ? c.y + 400 : c.y;
            return c;
        });
    },
};

/* ---------------------------------------------------------------- out on the water, up in the sky */
const SeaSky = {
    boats: [], sky: [], dolphins: [], flock: null, whale: null, t: 0, nextBoat: 300, nextSky: 2400, nextDolphin: 900, nextWhale: 1500,
    reset() { this.boats = []; this.sky = []; this.dolphins = []; this.flock = null; this.whale = null; },
    openSea(x, y) { const a = G.areas.island; return a && a.waterAt(x, y) === 's' && W0.grid[y] && W0.grid[y][x] === '~'; },
    clearLane(x0, y0, x1, y1) {
        const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
        for (let i = 0; i <= n; i += 2) {
            const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n);
            if (x < 0 || y < 0 || x >= W0.w || y >= W0.h) continue;
            for (let dy = -1; dy <= 1; dy++) if (!this.openSea(x, y + dy) && W0.grid[y + dy]) return false;
        }
        return true;
    },
    /* Sarah up at the lookout (David, 28 October: the plane only goes over there, where it makes sense, and boats sail
       by on the northern sea it looks out on) */
    atLookout() {
        const s = W0.spots && W0.spots.lookout, p = G.player;
        return !!s && !!p && G.area === G.areas.island && Math.hypot(p.x / TILE - s.x, p.y / TILE - s.y) < 10;
    },
    /* a boat across the northern sea, seen from the lookout: along the coast, between the island and the horizon */
    spawnNorthBoat() {
        const s = W0.spots.lookout, kinds = ['sea_sail', 'sea_sailb', 'sea_fish', 'sea_ferry'];
        for (let tries = 0; tries < 8; tries++) {
            const y = rint(1, 5), east = R() < 0.5, xa = W0.w + 3, xb = Math.max(-3, s.x - 45);
            const [x0, x1] = east ? [xb, xa] : [xa, xb];
            if (!this.clearLane(x0, y, x1, y)) continue;
            const kind = rpick(kinds), sp = kind === 'sea_ferry' ? 0.42 : kind === 'sea_fish' ? 0.26 : 0.3, len = Math.abs(x1 - x0) * TILE;
            this.boats.push({ kind, x: x0 * TILE, y: y * TILE, vx: Math.sign(x1 - x0) * sp, vy: 0, t: 0, life: len / sp + 10 });
            return true;
        }
        return false;
    },
    spawnBoat() {
        if (this.atLookout()) return this.spawnNorthBoat();
        // boats sail out of sight of the pier: from a side of the map toward the far horizon (the bottom edge), or back
        const v = G.view, cam = G.cam;
        const vy0 = Math.floor(cam.y / TILE), vy1 = Math.floor((cam.y + v.h) / TILE);
        const kinds = ['sea_sail', 'sea_sailb', 'sea_fish', 'sea_ferry'];
        for (let tries = 0; tries < 10; tries++) {
            const west = R() < 0.5, y0 = Math.min(W0.h - 2, Math.max(vy0, 110) + Math.floor(R() * 8));
            const x0 = west ? -3 : W0.w + 3, x1 = west ? rint(40, 66) : rint(94, 120), y1 = W0.h + 3;
            const out = R() < 0.5;
            const [ax, ay, bx, by] = out ? [x0, y0, x1, y1] : [x1, y1, x0, y0];
            if (!this.clearLane(ax, ay, bx, by)) continue;
            if (Math.max(ay, by) < vy0 - 2 || Math.min(ay, by) > vy1 + 14) continue;
            const kind = rpick(kinds), sp = kind === 'sea_ferry' ? 0.42 : kind === 'sea_fish' ? 0.26 : 0.3;
            const len = Math.hypot(bx - ax, by - ay) * TILE;
            this.boats.push({ kind, x: ax * TILE, y: ay * TILE, vx: (bx - ax) * TILE / len * sp, vy: (by - ay) * TILE / len * sp, t: 0, life: len / sp + 10 });
            return true;
        }
        return false;
    },
    spawnDolphins() {
        const v = G.view, cam = G.cam;
        for (let tries = 0; tries < 12; tries++) {
            const tx = Math.floor((cam.x + R() * v.w) / TILE), ty = Math.floor((cam.y + R() * v.h) / TILE);
            let open = true;
            for (let dy = -2; dy <= 2; dy++) for (let dx = -3; dx <= 3; dx++) if (!this.openSea(tx + dx, ty + dy)) open = false;
            if (!open) continue;
            const n = rint(1, 3), dir = R() < 0.5 ? 1 : -1;
            for (let i = 0; i < n; i++) this.dolphins.push({ x: (tx + 0.5) * TILE + i * 14 * dir, y: (ty + 0.5) * TILE + i * 3, t: -i * 16, flip: dir < 0 });
            return;
        }
    },
    /* a whale (the new look's, EnvSights): some days from December to April, by day, one in three, now and then out in a
       good stretch of open sea in view; it comes up twice, spouting, then dives with its tail up */
    whaleDay() {
        const m = Clock.month(), h = Clock.hourF();
        return (m === 12 || m <= 4) && h >= 7 && h < 17 && hash32((S.seed || '') + ':whale:' + Clock.dayNum()) % 3 === 0;
    },
    spawnWhale() {
        // (the new look sees further up the screen than the flat view's rectangle, out to sea from the lookout most of all;
        // of the open water in sight, one of the nearest stretches, as the far ones melt into the haze or hide behind the shore)
        const v = G.view, cam = G.cam, p = G.player, out = [], R3on = typeof R3 !== 'undefined' && R3.active();
        const x0 = Math.floor(cam.x / TILE) - 6, y0 = Math.floor(cam.y / TILE) - 9, x1 = Math.ceil((cam.x + v.w) / TILE) + 6, y1 = Math.ceil((cam.y + v.h * 0.8) / TILE);
        const open = (tx, ty) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -2; dx <= 2; dx++) if (!this.openSea(tx + dx, ty + dy)) return false; return true; };
        // (on the screen, with none of the island's ground between the camera and the water there: a cliff top hides the sea
        // below it, however near)
        const bend = (z) => { const bd = Math.max(0, R3U.uBendZ.value - z); return R3U.uBendK.value * bd * bd; };
        const seen = (tx, ty) => {
            if (!R3on) return true;
            const q = R3.project((tx + 0.5) * TILE, (ty + 0.5) * TILE, 0);
            if (!(q.x > v.w * 0.08 && q.x < v.w * 0.92 && q.y > v.h * 0.12 && q.y < v.h * 0.9)) return false;
            const c = R3.camera.position, X = tx + 0.5, Z = (ty + 0.5) * R3_ZS, Y = r3GroundH(X * TILE, (ty + 0.5) * TILE) - bend(Z) + 0.3;
            for (let i = 2; i < 30; i++) {
                const k = i / 30, x = c.x + (X - c.x) * k, y = c.y + (Y - c.y) * k, z = c.z + (Z - c.z) * k;
                if (y < r3GroundH(x * TILE, z / R3_ZS * TILE) - bend(z)) return false;
            }
            return true;
        };
        // (a few tiles off from Sarah, and clear of the pier and the boat tied up at its end)
        const d = (q) => Math.hypot(q[0] + 0.5 - p.x / TILE, q[1] + 0.5 - p.y / TILE), pr = W0.pier;
        const clear = (tx, ty) => !pr || !(tx >= pr.x0 - 3 && tx <= pr.x1 + 8 && ty >= pr.y0 - 1 && ty <= pr.y1 + 3);
        for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (open(tx, ty) && clear(tx, ty) && d([tx, ty]) >= 4 && seen(tx, ty)) out.push([tx, ty]);
        if (!out.length) return false;
        out.sort((a, b) => d(a) - d(b));
        const [tx, ty] = out[Math.floor(R() * Math.min(4, out.length))];
        this.whale = { x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE, t: 0, flip: R() < 0.5 };
        return true;
    },
    /* now and then something goes over: a big see-through cloud (with its shadow sliding across the ground), a plane,
       or a hot air balloon. Not too often: a few minutes apart, on average */
    spawnSky() {
        const v = G.view, cam = G.cam, h = Clock.hourF(), fair = G.weather === 'sunny' || G.weather === 'cloudy';
        const roll = R(), cloudy = G.weather === 'cloudy', look = this.atLookout();
        if (roll < (look ? 0.2 : cloudy ? 0.72 : 0.5)) { this.spawnCloud(); return; }
        const balloon = fair && h > 7 && h < 18.5 && roll > (look ? 0.9 : 0.85);
        // (a plane only over the lookout)
        if (!balloon && !look) return;
        const fromLeft = R() < 0.5, fromTop = R() < 0.5;
        const x = fromLeft ? cam.x - 60 : cam.x + v.w + 60, y = cam.y + (fromTop ? 0.15 : 0.6) * v.h;
        const sp = balloon ? 0.28 : 1.15;
        const tx = fromLeft ? cam.x + v.w + 80 : cam.x - 80, ty = cam.y + (fromTop ? 0.75 : 0.2) * v.h;
        const d = Math.hypot(tx - x, ty - y);
        this.sky.push({ kind: balloon ? 'balloon' : 'plane', x, y, vx: (tx - x) / d * sp, vy: (ty - y) / d * sp, t: 0, life: d / sp + 20, flip: !fromLeft });
    },
    /* the wind blows the same way all day (mostly west to east), and the clouds go with it */
    wind() {
        const r = mulberry(hash32((S && S.seed || 'x') + ':wind:' + Clock.dayNum()));
        const east = r() < 0.75, dy = (r() - 0.5) * 0.5;
        return [east ? 1 : -1, dy];
    },
    spawnCloud() {
        const v = G.view, cam = G.cam, [wx, wy] = this.wind();
        const big = G.weather === 'cloudy' ? 1.25 : 1;
        const w = Math.round((150 + R() * 90) * big), hgt = Math.round(w * (0.38 + R() * 0.12));
        const img = cloudImage(w, hgt);
        const sp = 0.18 + R() * 0.1;
        const len = Math.hypot(wx, wy);
        const vx = wx / len * sp, vy = wy / len * sp;
        const x = wx > 0 ? cam.x - w - 40 : cam.x + v.w + 40;
        const y = cam.y + v.h * (0.05 + R() * 0.55) - hgt / 2;
        const life = (v.w + w * 2 + 160) / Math.abs(vx);
        this.sky.push({ kind: 'cloud', x, y, vx, vy, t: 0, life, img, w, h: hgt });
    },
    update() {
        const a = G.areas.island;
        if (!a || G.area !== a || G.mode !== 'play') { if (G.area && G.area !== a && (this.boats.length || this.sky.length)) this.reset(); return; }
        this.t++;
        const v = G.view, cam = G.cam;
        // is there sea in view (or just past it)?
        const seaNear = (() => { for (let y = Math.floor(cam.y / TILE) - 4; y <= Math.floor((cam.y + v.h) / TILE) + 4; y += 3) for (let x = Math.floor(cam.x / TILE); x <= Math.floor((cam.x + v.w) / TILE); x += 4) if (this.openSea(x, y)) return true; return false; })();
        // (up at the lookout, something soon: a boat on the sea below and a plane going over)
        const look = this.atLookout();
        if (look && !this.wasLook) { this.nextBoat = Math.min(this.nextBoat, rint(60, 400)); this.nextSky = Math.min(this.nextSky, rint(300, 1500)); }
        this.wasLook = look;
        if (--this.nextBoat <= 0) { this.nextBoat = look ? rint(500, 1300) : rint(900, 2400); if (seaNear && this.boats.length < 3) { if (!this.spawnBoat()) this.nextBoat = 300; } }
        if (--this.nextDolphin <= 0) { this.nextDolphin = rint(1200, 3000); if (seaNear) this.spawnDolphins(); }
        if (--this.nextSky <= 0) { this.nextSky = look ? rint(1800, 5400) : rint(9000, 16200); if (G.weather !== 'rain' && G.weather !== 'snow') this.spawnSky(); }
        for (const b of this.boats) { b.t++; b.x += b.vx; b.y += b.vy; }
        this.boats = this.boats.filter(b => b.t < b.life);
        for (const s of this.sky) { s.t++; s.x += s.vx; s.y += s.vy; }
        this.sky = this.sky.filter(s => s.t < s.life);
        for (const d of this.dolphins) d.t++;
        this.dolphins = this.dolphins.filter(d => d.t < 60);
        if (--this.nextWhale <= 0) { this.nextWhale = rint(2400, 6000); if ((seaNear || look) && !this.whale && this.whaleDay()) this.spawnWhale(); }
        if (this.whale && ++this.whale.t > 1400) this.whale = null;
        // gulls wheeling over the beach while it's light
        const h = Clock.hourF(), day = h > 6 && h < 20 && G.weather !== 'rain';
        const beach = day && (() => { const ty = Math.floor((cam.y + v.h / 2) / TILE); return ty > 96; })();
        if (beach && !this.flock) this.flock = { cx: cam.x + v.w * (0.3 + R() * 0.4), cy: cam.y + v.h * 0.3, n: rint(2, 4), t: 0 };
        if (this.flock) { this.flock.t++; this.flock.cx += Math.sin(this.flock.t / 600) * 0.15; if (!beach && this.flock.t > 120) this.flock = null; }
    },
    /* boats and dolphins sit on the water: sorted with everything else */
    ents() {
        const out = [];
        for (const b of this.boats) {
            if (!b.draw) b.draw = ctx => spr(ctx, `${b.kind}_${Math.floor(b.t / 40) % 2}`, b.x, b.y, b.vx < 0);
            b.sy = b.y; out.push(b);
        }
        for (const d of this.dolphins) {
            if (d.t < 0) continue;
            if (!d.draw) d.draw = ctx => {
                const k = d.t < 14 ? 0 : d.t < 26 ? 1 : d.t < 38 ? 2 : -1;
                if (k >= 0) spr(ctx, `sea_dolphin_${k}`, d.x + (d.flip ? -1 : 1) * (d.t - 20) * 0.6, d.y, d.flip);
                if (d.t < 8 || (d.t > 34 && d.t < 50)) spr(ctx, 'sea_splash', d.x + (d.t > 30 ? (d.flip ? -12 : 12) : 0), d.y + 2);
            };
            d.sy = d.y; out.push(d);
        }
        return out;
    },
    /* planes, balloons and the gulls: over everything */
    drawSky(ctx) {
        const a = G.area;
        if (!a || a.id !== 'island') return;
        const day = 1 - clamp((G.lightStrength || 0) / 0.5, 0, 1);
        for (const s of this.sky) {
            if (s.kind === 'cloud') {
                // the shadow slides over the ground below (only while the sun's out), the cloud itself you can see through
                const fade = Math.min(1, s.t / 90, (s.life - s.t) / 90);
                if (day > 0.05) { ctx.globalAlpha = 0.17 * day * fade; ctx.drawImage(s.img.shadow, Math.round(s.x + 40), Math.round(s.y + 100), s.w, s.h); }
                ctx.globalAlpha = 0.36 * fade;
                ctx.drawImage(s.img, Math.round(s.x), Math.round(s.y), s.w, s.h);
                ctx.globalAlpha = 1;
            } else if (s.kind === 'plane') {
                // pointing the way it's flying (the sprite's nose points up)
                const ang = Math.atan2(s.vy, s.vx) + Math.PI / 2;
                for (const [frame, ox, oy] of [['sky_plane_shadow', 46, 60], ['sky_plane', 0, 0]]) {
                    ctx.save();
                    ctx.translate(Math.round(s.x + ox), Math.round(s.y + oy));
                    ctx.rotate(ang);
                    spr(ctx, frame, 0, 0);
                    ctx.restore();
                }
            } else {
                ctx.fillStyle = 'rgba(20,20,40,0.18)';
                ctx.beginPath(); ctx.ellipse(s.x + 30, s.y + 70, 8, 3, 0, 0, 7); ctx.fill();
                spr(ctx, 'sky_balloon', s.x, s.y + Math.sin(s.t / 50) * 2);
            }
        }
        const f = this.flock;
        if (f) for (let i = 0; i < f.n; i++) {
            const ang = f.t / (80 + i * 9) + i * 2.1, rx = 34 + i * 9, ry = 12 + i * 3;
            const x = f.cx + Math.cos(ang) * rx, y = f.cy + Math.sin(ang) * ry;
            spr(ctx, `cr_gull_fly${Math.floor((f.t + i * 7) / 8) % 2}`, x, y, Math.sin(ang) > 0);
        }
    },
    /* the planes' blinking lights still show at night */
    drawLights(ctx) {
        const a = G.area;
        if (!a || a.id !== 'island' || (G.lightStrength || 0) < 0.3) return;
        for (const s of this.sky) {
            if (s.kind !== 'plane' || (s.t >> 4) % 2) continue;
            // the wingtip lights, turned with the plane
            const ang = Math.atan2(s.vy, s.vx) + Math.PI / 2, c = Math.cos(ang), sn = Math.sin(ang);
            for (const [lx, ly, col] of [[-15, -2, '#ff4a4a'], [14, -2, '#6aff6a']]) {
                ctx.fillStyle = col;
                ctx.fillRect(Math.round(s.x + lx * c - ly * sn - G.cam.x), Math.round(s.y + lx * sn + ly * c - G.cam.y), 2, 2);
            }
        }
    },
};

/* a big soft cloud, made of puffs: drawn small and blown up, so it stays pixel-y (and a matching shadow) */
function cloudImage(w, h) {
    const k = 2, cw = Math.ceil(w / k), ch = Math.ceil(h / k);
    const puffs = [];
    const n = 4 + Math.floor(R() * 3);
    for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n;
        puffs.push([cw * (0.12 + u * 0.76), ch * (0.62 + (R() - 0.5) * 0.12), cw * (0.14 + R() * 0.07), ch * (0.26 + R() * 0.08)]);
    }
    for (let i = 0; i < 2 + Math.floor(R() * 2); i++) puffs.push([cw * (0.3 + R() * 0.4), ch * (0.38 + R() * 0.1), cw * (0.15 + R() * 0.08), ch * (0.28 + R() * 0.07)]);
    const make = (cols) => {
        const c = document.createElement('canvas');
        c.width = cw; c.height = ch;
        const g = c.getContext('2d');
        cols.forEach(([col, dy]) => {
            g.fillStyle = col;
            for (const [x, y, rx, ry] of puffs) { g.beginPath(); g.ellipse(x, y + dy, Math.max(1, rx - (dy < 0 ? 1 : 0)), Math.max(1, ry - (dy < 0 ? 1 : 0)), 0, 0, 7); g.fill(); }
        });
        return c;
    };
    const img = make([['#c9d6ea', 1], ['#ffffff', -1], ['#ffffff', -2]]);
    img.shadow = make([['#101838', 0]]);
    return img;
}

