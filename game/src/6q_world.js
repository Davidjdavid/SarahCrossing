/* ---- 6q_world.js ---- */
/* Little bits of island life: gems on the mountain top, trees that sparkle when something's hidden in them, crates
   on the end of a fishing line, food that sometimes gives Sarah a boost, butterflies around the flowers by day,
   fireflies at night, and the lighthouse beam once the lamp is lit again. */

/* ---------------------------------------------------------------- gems on the mountain top (one to three a day) */
const GEM_WEIGHTS = [['gem_quartz', 30], ['gem_amethyst', 24], ['gem_topaz', 18], ['gem_emerald', 12], ['gem_sapphire', 8], ['gem_ruby', 5], ['gem_diamond', 2]];
const Gems = {
    today() {
        const day = Clock.dayNum();
        if (!S.gems || S.gems.day !== day) {
            const r = mulberry(hash32(S.seed + ':gems:' + day));
            const n = r() < 0.4 ? 1 : r() < 0.8 ? 2 : 3;
            const spots = shuffled((W0.gemSpots || []).map((s, i) => i), r).slice(0, n);
            S.gems = { day, list: spots.map(i => ({ i, id: weighted(GEM_WEIGHTS, r) })), taken: [] };
        }
        return S.gems;
    },
    leftToday() { if (!S || !W0.gemSpots) return 0; const g = this.today(); return g.list.filter(q => !g.taken.includes(q.i)).length; },
    add(a) {
        a.ents = a.ents.filter(e => e.gemSpot == null);
        if (!S || !W0.gemSpots) return;
        const g = this.today();
        for (const q of g.list) {
            if (g.taken.includes(q.i)) continue;
            const [tx, ty] = W0.gemSpots[q.i];
            const e = makeItemEnt(q.id, (tx + 0.5) * TILE, (ty + 0.8) * TILE, { gemSpot: q.i });
            e.twinkle = true;
            const d0 = e.draw;
            e.draw = ctx => { d0(ctx); if ((G.t + q.i * 37) % 70 < 10) spr(ctx, 'gem_glint', e.x - 4, e.y - 10); };
            a.add(e);
        }
    },
};

/* ---------------------------------------------------------------- trees that sparkle */
const Sparkle = {
    day: -1, cache: {},
    secret(e) {
        if (!S || !e || e.kind !== 'tree' || e.money || e.tx == null) return null;
        const day = Clock.dayNum();
        if (this.day !== day) { this.day = day; this.cache = {}; }
        if (S.trees[e.id + ':d'] === day) return null;
        if (e.id in this.cache) return this.cache[e.id];
        // rare: out of the six hundred or so trees, only a handful have something in them on any given day
        const r = mulberry(hash32(S.seed + e.id + day));
        const bag = r() < 0.009, amount = 100 * rint(2, 10, r), special = r() < 0.003;
        return (this.cache[e.id] = bag ? { bag: true, amount } : special ? { special: true } : null);
    },
    forget(e) { if (this.cache) delete this.cache[e.id]; },
    /* a single little glint every few seconds: the kind of thing you catch out of the corner of your eye */
    draw(ctx, e) {
        if (!this.secret(e)) return;
        const per = 280 + ((e.tx * 31 + e.ty * 17) % 120);
        const t = (G.t + e.tx * 13 + e.ty * 7) % per;
        if (t > 22) return;
        const spot = Math.floor((G.t + e.tx * 13 + e.ty * 7) / per) % 4;
        const ox = [-8, 6, -2, 9][spot], oy = [-30, -22, -36, -26][spot];
        ctx.globalAlpha = 0.85 * (t < 11 ? t / 11 : (22 - t) / 11);
        spr(ctx, 'twinkle', e.x + ox, e.y + oy);
        ctx.globalAlpha = 1;
    },
    /* for gossip: "one of the trees by the pond was sparkling" */
    hintSpot() {
        const a = G.areas && G.areas.island;
        if (!a || !S) return null;
        const places = ['pond', 'orchard', 'forest', 'meadow', 'village', 'eastside', 'farm', 'plaza', 'beach', 'river', 'eastmeadow', 'waterfall'];
        for (const e of a.ents) {
            if (e.kind !== 'tree' || !this.secret(e)) continue;
            let best = null, bd = 1e9;
            for (const k of places) { const s = W0.spots[k]; if (!s) continue; const d = Math.hypot(s.x - e.tx, s.y - e.ty); if (d < bd) { bd = d; best = k; } }
            if (best && bd < 14) return PLACE_NAMES[best] || null;
        }
        return null;
    },
};

/* ---------------------------------------------------------------- a crate on the line */
async function openCrate() {
    const r = R();
    Sfx.play('fanfare');
    await UI.say(null, rpick(['Sarah reels in... a crate! A little wooden crate, covered in seaweed. She pries it open...',
        "That's not a fish! It's a crate! It's heavy. It sloshes. Sarah opens it...", 'A crate on the line! Barnacles, seaweed, and something inside...']));
    S.stats.crates = (S.stats.crates || 0) + 1;
    const sp = r < 0.3 ? poolSpecial(['poem', 'acc', 'emote', 'hair', 'sew', 'song', 'dance']) : null;
    if (sp) { await grantSpecial(sp, 'It was in a crate from the sea!'); return; }
    if (r < 0.6) { const n = 100 * rint(3, 20); addMoney(n); await UI.say(null, `A soggy little bag of ${fmtNum(n)} sand dollars! Still good. Money is waterproof here.`); return; }
    if (r < 0.8) { const g = weighted(GEM_WEIGHTS); receive(g, 1); await UI.say(null, `${cap(aOrAn(itemName(g)))} ${itemName(g).toLowerCase()}, wrapped in a handkerchief! Somebody lost this a long time ago.`); return; }
    const it = rpick(['conch', 'seaglass', 'pearl', 'coral', 'shell_lamp', 'shell_mirror', 'surfboard', 'beach_umbrella', 'boot', 'star']);
    receive(it, 1);
    await UI.say(null, it === 'boot' ? 'An old boot. Inside the crate. A boot in a box. The sea has a sense of humor.' : `${cap(aOrAn(itemName(it)))} ${itemName(it).toLowerCase()}! The sea gives nice presents.`);
}

/* ---------------------------------------------------------------- food boosts */
const BONUSES = {
    speed: { name: 'Speedy', icon: 'ui_moves', text: 'Sarah feels light on her feet! She walks and runs faster for a while.' },
    charm: { name: 'Charming', icon: 'emote_heart', text: 'Sarah feels extra charming! Chatting, gifts and favors make friends a little happier.' },
    fisher: { name: 'Lucky angler', icon: 'tool_rod', text: 'Sarah feels fishy! Rare fish and crates bite more often.' },
    harvest: { name: 'Green thumb', icon: 'tfruit_peach', text: 'Sarah feels fruity! Trees drop extra fruit when she shakes them.' },
    lucky: { name: 'Lucky day', icon: 'ui_coin', text: "Sarah feels lucky! She keeps spotting sand dollars on the ground." },
    haggler: { name: 'Haggler', icon: 'ui_coin', text: 'Sarah feels persuasive! Fortune pays a quarter more for everything.' },
    tickets: { name: 'Arcade ace', icon: 'ui_ticket', text: 'Sarah feels unstoppable! Double tickets at the arcade.' },
    comber: { name: 'Beachcomber', icon: 'shell_conch', text: 'Sarah has a feeling about the beach. More shells washed up!' },
    wish: { name: 'Stargazer', icon: 'twinkle', text: 'Sarah feels starry! Shooting stars fall much more often tonight.' },
};
const BONUS_MS = 15 * 60e3;
function bonusOn(id) { return !!(S && S.bonus && S.bonus.id === id && Date.now() < S.bonus.until); }
function bonusCharm() { return bonusOn('charm') ? 1 : 0; }
function bonusSpeed() { return bonusOn('speed') ? 1.3 : 1; }
/* fresh food (cooked by Sarah, or from Mac's or Basil's cart) always gives a boost, and swaps out one she already has;
   anything else gives one 1 time in 10, and only when she has none */
async function foodBonus(it, fresh) {
    if (!it || !['dish', 'fruit', 'snack'].includes(it.type)) return;
    const active = S.bonus && Date.now() < S.bonus.until;
    if (!fresh && (active || R() >= 0.1)) return;
    const id = rpick(Object.keys(BONUSES).filter(k => !(active && S.bonus.id === k)));
    S.bonus = { id, until: Date.now() + BONUS_MS, lucky: 0 };
    Save.touch();
    Sfx.play('levelup');
    G.player.emote = 'sparkle'; G.player.emoteT = 80;
    if (id === 'comber') extraShells();
    UI.toast(`${BONUSES[id].name}! ${BONUSES[id].text}`, BONUSES[id].icon);
    HUD.bonus();
}
function extraShells() {
    const a = G.areas.island;
    if (!a) return;
    const spots = shuffled(beachSpots(a));
    for (let i = 0; i < 5 && i < spots.length; i++) {
        const [tx, ty] = spots[i];
        const id = weighted([['scallop', 10], ['turban', 8], ['cowrie', 8], ['coral', 5], ['conch', 3], ['seaglass', 2], ['pearl', 1]]);
        const e = makeItemEnt(id, (tx + 0.5) * TILE, (ty + 0.8) * TILE);
        e.twinkle = true;
        a.add(e);
    }
}
/* the lucky boost: every so often, a few sand dollars on the ground nearby */
function bonusTick() {
    if (!bonusOn('lucky') || G.busy || !G.area || G.area.id !== 'island' || G.frame % 60) return;
    const B = S.bonus;
    B.lucky = (B.lucky || 0) + 1;
    if (B.lucky % 50) return;
    const p = G.player;
    for (let k = 0; k < 10; k++) {
        const x = p.x + rint(-40, 40), y = p.y + rint(-30, 30);
        if (G.area.solidPx(x, y - 2) || Math.hypot(x - p.x, y - p.y) < 16) continue;
        const bag = makeItemEnt('money_bag', x, y);
        bag.frame = 'money_bag_s'; bag.amount = 50 * rint(1, 6); bag.fresh = 12; bag.twinkle = true;
        G.area.add(bag);
        UI.toast('Sarah spots some sand dollars on the ground!', 'money_bag');
        return;
    }
}

/* ---------------------------------------------------------------- butterflies by day, fireflies by night */
const Flutter = {
    bugs: [], flies: [], t: 0,
    reset() { this.bugs = []; this.flies = []; },
    flowersInView() {
        const a = G.area, cam = G.cam, v = G.view;
        return a.ents.filter(e => (e.wildFlower || e.gardenFlower) && e.x > cam.x - 20 && e.x < cam.x + v.w + 20 && e.y > cam.y - 10 && e.y < cam.y + v.h + 20);
    },
    update() {
        const a = G.area;
        if (!a || a.id !== 'island' || !S) { this.bugs.length = 0; this.flies.length = 0; return; }
        this.t++;
        const h = Clock.hourF(), season = Clock.season(), wet = G.weather === 'rain' || G.weather === 'snow';
        const day = h >= 7 && h < 19 && season !== 'winter' && !wet;
        const m = Clock.month(), night = (h >= 20.5 || h < 4.5) && m >= 5 && m <= 9 && !wet;
        // butterflies: a few around the flowers in view
        if (day && this.t % 30 === 0) {
            const fl = this.flowersInView();
            const want = Math.min(7, Math.ceil(fl.length / 4));
            if (this.bugs.length < want && fl.length) {
                const f = rpick(fl);
                this.bugs.push({ home: f, x: f.x + rint(-30, 30), y: f.y - rint(20, 40), vx: 0, vy: 0, sub: rint(0, 3), rest: 0, t: rint(0, 99), sy: 0 });
            }
        }
        if (!day) this.bugs = this.bugs.filter(b => (b.y -= 1.2) > G.cam.y - 30);
        for (const b of this.bugs) {
            b.t++;
            const f = b.home;
            if (!a.ents.includes(f)) { b.home = null; }
            if (b.rest > 0) { b.rest--; continue; }
            const tx = f ? f.x + Math.sin(b.t / 37 + b.sub) * 14 : b.x + Math.sin(b.t / 20) * 30;
            const ty = f ? f.y - 10 + Math.cos(b.t / 29) * 7 : b.y - 1;
            b.vx += (tx - b.x) * 0.004 + (R() - 0.5) * 0.18; b.vy += (ty - b.y) * 0.004 + (R() - 0.5) * 0.18;
            b.vx *= 0.94; b.vy *= 0.94;
            b.x += b.vx; b.y += b.vy;
            if (f && Math.hypot(b.x - f.x, b.y - (f.y - 6)) < 4 && R() < 0.02) b.rest = rint(60, 180);
            if (f && R() < 0.001) { const fl = this.flowersInView(); if (fl.length) b.home = rpick(fl); }
            b.sy = (f ? f.y : b.y) + 2;
        }
        const cam = G.cam, v = G.view;
        this.bugs = this.bugs.filter(b => b.x > cam.x - 80 && b.x < cam.x + v.w + 80 && b.y > cam.y - 80 && b.y < cam.y + v.h + 80);
        // fireflies: floating over grass and flowers after dark
        if (night) {
            const max = (G.events && G.events.has('fireflies')) ? 40 : 22;
            while (this.flies.length < max) {
                const tx = Math.floor((cam.x + R() * v.w) / TILE), ty = Math.floor((cam.y + R() * v.h) / TILE);
                const c = W0.grid[ty] && W0.grid[ty][tx];
                if (c !== 'g' && c !== 'm') { if (R() < 0.7) break; continue; }
                this.flies.push({ x: (tx + R()) * TILE, y: (ty + R()) * TILE, ph: R() * 6.28, sp: 0.4 + R() * 0.6, vx: 0, vy: 0 });
            }
        }
        if (!night && this.flies.length) this.flies.length = 0;
        for (const q of this.flies) {
            q.ph += 0.05 * q.sp;
            q.vx += (R() - 0.5) * 0.05; q.vy += (R() - 0.5) * 0.05;
            q.vx *= 0.97; q.vy *= 0.97;
            q.x += q.vx + Math.sin(q.ph * 0.7) * 0.15; q.y += q.vy + Math.cos(q.ph * 0.5) * 0.1;
            if (q.x < cam.x - 20) q.x += v.w + 30; else if (q.x > cam.x + v.w + 20) q.x -= v.w + 30;
            if (q.y < cam.y - 20) q.y += v.h + 30; else if (q.y > cam.y + v.h + 20) q.y -= v.h + 30;
        }
    },
    ents() {
        return this.bugs.map(b => ({ kind: 'bug', sy: b.sy, y: b.y, x: b.x,
            draw: ctx => spr(ctx, `cr_butterfly${b.sub}_${b.rest > 0 ? 0 : (b.t >> 2) % 2}`, Math.round(b.x), Math.round(b.y)) }));
    },
    drawLights(ctx) {
        if (!this.flies.length) return;
        const cam = G.cam;
        for (const q of this.flies) {
            const glow = 0.5 + 0.5 * Math.sin(q.ph * 2);
            if (glow < 0.15) continue;
            const x = Math.round(q.x - cam.x), y = Math.round(q.y - cam.y);
            ctx.fillStyle = `rgba(210,255,120,${0.18 * glow})`;
            ctx.fillRect(x - 2, y - 2, 5, 5);
            ctx.fillStyle = `rgba(240,255,170,${0.9 * glow})`;
            ctx.fillRect(x, y, 1, 1);
        }
    },
};

/* ---------------------------------------------------------------- the lighthouse lamp at night */
const Beam = {
    drawLights(ctx) {
        const a = G.area;
        if (!a || a.id !== 'island' || !S || !Quests.lamp() || (G.lightStrength || 0) < 0.25) return;
        const b = W0.buildings.lighthouse;
        if (!b) return;
        const lx = (b.x + b.w / 2) * TILE - G.cam.x, ly = (b.y + b.h) * TILE - 100 - G.cam.y;
        const k = Math.min(1, (G.lightStrength - 0.25) * 2);
        const ang = (G.t / 170) % (Math.PI * 2);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const len = 420;
        for (const dir of [ang, ang + Math.PI]) {
            const g = ctx.createLinearGradient(lx, ly, lx + Math.cos(dir) * len, ly + Math.sin(dir) * len * 0.45);
            g.addColorStop(0, `rgba(255,240,170,${0.32 * k})`); g.addColorStop(1, 'rgba(255,240,170,0)');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.moveTo(lx, ly);
            ctx.lineTo(lx + Math.cos(dir - 0.09) * len, ly + Math.sin(dir - 0.09) * len * 0.45);
            ctx.lineTo(lx + Math.cos(dir + 0.09) * len, ly + Math.sin(dir + 0.09) * len * 0.45);
            ctx.closePath(); ctx.fill();
        }
        ctx.globalAlpha = k;
        spr(ctx, 'lighthouse_glow', lx, ly);
        ctx.restore();
    },
};

