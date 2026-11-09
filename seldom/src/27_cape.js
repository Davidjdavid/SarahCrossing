/* the Cape and the lighthouse */
ISLAND_ADD.push(function cape(m) {
    addProp(m, { id: 'lighthouse', tx: 86, ty: 6, tw: 3, th: 4, fh: 2, open: [[1, 1]], draw: drawLighthouse });
    m.doors = m.doors || [];
    m.doors.push({ x: 87, y: 9, to: 'lamproom', tx: 5, ty: 8, tdir: 'up', dir: 'up', locked: () => G.flags.eye && !G.flags.ended, lockedSay: () => null });
    m.add('lhlamp', 87 * TILE + 4, 3 * TILE + 14, { name: 'lhlamp', w: 24, h: 10 });
    furn(m, 'bench', 79, 6, 26, 5, { say: 'The keepers\' bench. Someone carved into it: "Watch the sea, and it watches back."' });
    house(m, 'keepercot', 75, 11, 4, 3, { tw: 4, th: 3, wall: '#c8c0b0', roof: '#5a6a8a', door: 1, windows: [3] }, ['island', 0, 0, () => true, () => 'The old keeper\'s cottage, boarded up for ninety-nine years.']);
    for (const [x, y] of [[82, 15], [92, 13], [73, 7]]) m.addAt('rock', x, y, { name: 'caperock' + x });
    m.addAt('sign', 74, 16, { text: 'THE CAPE. The ferry used to run from the ledge across the Gap. The ferry was the keeper. The keeper had a way with glass.' });
    m.addAt('sign', 66, 17, { text: 'The old ferry ledge. Across the Gap, the cape. Nothing to cross on but water. The keepers never needed a boat, they say.' });
    /* the bonfire on the square, kept every night since Lamp Night */
    m.add('bonfire', 52 * TILE + 2, 42 * TILE + 2, { name: 'bonfire', w: 14, h: 10 });
});
function drawLighthouse(D, p) {
    const c = lighthouseCanvas(!!G.flags.lit);
    D.img(c, p.tx * TILE + 24 - c.width / 2, (p.ty + p.th) * TILE - c.height);
}
/* the lamp at the top: a flame reaching it lights it (if the keeper's family is there to see) */
kind('lhlamp', {
    w: 24, h: 10, ph: 14, fixed: true, flat: true,
    draw(e, D) {
        if (!G.flags.lit) return;
        const g = 0.5 + Math.sin(G.t * 3) * 0.2;
        D.ctx.fillStyle = `rgba(255,230,140,${g})`; D.ctx.beginPath(); D.ctx.arc(D.X(ecx(e)), D.Y(ecy(e)), 10 * D.k, 0, 7); D.ctx.fill();
    },
    light(e) { return G.flags.lit ? { r: 80, up: 4, c: 'rgba(255,230,150,A)' } : null; },
});
kind('bonfire', {
    w: 14, h: 10, ph: 18, solid: true, fixed: true,
    present() { return G.flags.festival; },
    draw(e, D) {
        box(D, e.x, e.y + 4, 14, 5, '#6b4128'); box(D, e.x + 2, e.y + 2, 10, 3, '#8a5a34');
        if (!Light.night()) return;
        for (let i = 0; i < 3; i++) { const h = 8 + Math.abs(Math.sin(G.t * 7 + i * 2)) * 6; box(D, e.x + 2 + i * 4, e.y + 4 - h, 4, h, i === 1 ? P.yellow : P.orange); }
    },
    update(e, dt) {
        if (!Light.night() || !G.flags.eye || G.flags.lit) return;
        e.st.acc = (e.st.acc || 0) + dt;
        if (e.st.acc > 0.25) { e.st.acc = 0; e.map.add('ember', ecx(e) - 2, e.y - 6, { fly: true, vx: 34 + Math.random() * 6, vy: -4 + Math.random() * 4, life: 8 }); }
    },
    light() { return Light.night() ? { r: 60, up: 8, c: 'rgba(255,170,90,A)' } : null; },
});
/* sparks from the bonfire, drifting east on the night wind (and through a seam, if there's one in the way) */
kind('ember', {
    w: 3, h: 3, ph: 4, solid: false,
    draw(e, D) { box(D, e.x, e.y - 8, 3, 3, Math.floor(G.t * 12 + e.ox) % 2 ? P.yellow : P.orange); },
    update(e, dt) {
        e.life -= dt; e.x += e.vx * dt; e.y += (e.vy + Math.sin(e.t * 5 + e.ox) * 6) * dt;
        if (e.life <= 0) { e.removed = true; e.map.remove(e); return; }
        const lamp = ent('lhlamp');
        if (lamp && !G.flags.lit && overlap({ x: e.x - 2, y: e.y - 10, w: 7, h: 7 }, { x: lamp.x - 28, y: lamp.y - 40, w: lamp.w + 56, h: lamp.h + 80 })) lightTheLamp();
    },
    onSeam(e) { e.life = Math.max(e.life, 3); },
});

/* the lamp room at the top of the lighthouse */
room('lamproom', [
    'xxxKKKKKxxx',
    'xxKFFFFFKxx',
    'xKFFFFFFFKx',
    'KFFFFFFFFFK',
    'KFFFFFFFFFK',
    'KFFFFFFFFFK',
    'xKFFFFFFFKx',
    'xxKFFFFFKxx',
    'xxxKFFFKxxx',
    'xxxxKDKxxxx',
], {
    exit: ['island', 87, 10],
    def: { dim: '#a8a8d0' },
    init(m) {
        furn(m, 'lens', 4, 3, 48, 8, { name: 'lens', onAct: lensAct });
        furn(m, 'window', 2, 3, 16, 2, { solid: false, say: 'The sea, all the way round.' });
        m.addAt('sign', 7, 6, { text: 'In the keeper\'s hand: "The lens is four glasses. Set them, and the light sees for itself. It still needs a flame. A flame is the easy part, for whoever is doing the looking."' });
    },
});
async function lensAct(e) {
    const F = G.flags;
    const have = ['spyglass', 'loupe', 'wideglass', 'prism'].filter(k => F[k]);
    if (have.length < 4) {
        await say(`The great lens. Four empty settings. You have ${have.length} of the glasses.`, null);
        return;
    }
    if (F.eye) return;
    await scene(actThree);
}

/* ---------- the last act ---------- */
async function actThree() {
    const F = G.flags, d = World.dot;
    d.dir = 'up';
    for (const [i, name] of ['Spyglass', 'Loupe', 'Wide Glass', 'Prism'].entries()) {
        F.lensSet = i + 1; Sfx.play('chime'); await say(`Dot sets the ${name} in the lens.`, null, { name: false });
    }
    await wait(0.8);
    await say('It\'s all there. Every glass. But it\'s dark.', 'dot');
    await say('...', 'dot');
    await say('Wait. I put all the glasses in. So why can I still see?', 'dot');
    d.dir = 'down'; await wait(1.2);
    await say('Iris said: look at the looking itself.', 'dot');
    await say('It was never me doing the looking, was it. The ball in the air. The clock. The sheep. The woods.', 'dot');
    await say('It was you.', 'dot');
    await wait(0.6);
    await say('You\'re the one looking. You\'ve always been. I\'m just the one you were looking at.', 'dot');
    await say('The lamp needs a flame. I can\'t carry fire all the way up here. But you can bring anything anywhere, can\'t you? You just have to look at it the right way.', 'dot');
    await say('Bring Grandpa. Bring everyone, if you can. Then bring the fire. I\'ll be right here.', 'dot');
    /* out onto the island; Dot stands at the lighthouse door, and the view lets go of Dot */
    await Fx.fadeOut(0.8);
    World.go('island', 87, 10, 'up', { quiet: true });
    F.eye = true; F.quarryGate = true; F.luxGaveUp = true;
    Eye.begin();
    Save.write(true);
}
const EYE_WALKERS = ['ansel', 'iris', 'pan', 'flash'];
/* the route to the cape for the island's people: to the ledge, then over the gap (only by a seam), then to the lighthouse */
const CAPE_ROUTE = [[50, 34], [49, 30], [49, 25], [52, 23], [55, 21], [55, 19], [58, 19], [64, 19], [66, 19], [69, 19], [72, 19], [78, 14], [84, 11]];
const CAPE_SPOTS = { ansel: [86, 11], iris: [89, 11], pan: [84, 12], flash: [90, 12] };
function walkerBrain(e, dt) {
    if (e.st.arrived) { const s = CAPE_SPOTS[e.name]; e.dir = 'up'; if (s) goTo(e, s[0], s[1], dt, 46); return; }
    if (e.st.leg == null) {
        /* start from the nearest point of the route */
        let best = 0, bd = 1e9; CAPE_ROUTE.forEach(([x, y], i) => { if (i > 8) return; const dd = dist(ecx(e), ecy(e), x * TILE, y * TILE); if (dd < bd) { bd = dd; best = i; } });
        e.st.leg = best;
        e.st.toFirst = true;
    }
    const [tx, ty] = CAPE_ROUTE[Math.min(e.st.leg, CAPE_ROUTE.length - 1)];
    if (e.st.toFirst) { const [cx, cy] = tileOf(e); if (cx === tx && cy === ty) e.st.toFirst = false; else { goTo(e, tx, ty, dt, 46); return; } }
    const gx = tx * TILE + (TILE - e.w) / 2, gy = ty * TILE + TILE - e.h - 1;
    const arrived = walkTo(e, gx, gy, dt, 46);
    const [cx] = tileOf(e);
    if (cx >= 71) { e.st.leg = Math.max(e.st.leg, 10); }
    if (arrived) { e.st.leg++; if (e.st.leg >= CAPE_ROUTE.length) e.st.arrived = true; }
    if (e.blockedT > 0.8 && e.st.leg === 9 && !e.st.waiting) { e.st.waiting = true; bark(e, 'How do we get across?', 3); }
    if (e.st.leg === 9) { e.blockedT = 0; e.dir = 'right'; e.moving = true; }
}
const Eye = {
    t: 0, intro: 0, wide: null,
    begin() {
        Cam.eye = true; Cam.split = false; Cam.mode = 'pinned'; Cam.zmin = 0.5; Cam.zmax = 3; Cam.zoom = Cam.ztarget = 1;
        Cam.ax = 87 * TILE; Cam.ay = 9 * TILE; Cam.clampMap(0);
        this.intro = 0; this.t = 0;
        for (const n of EYE_WALKERS) {
            let e = ent(n); if (!e) continue;
            if (n === 'ansel') { e.hidden = false; if (e.map !== MAPS.island) continue; }
            if (e.map !== MAPS.island) { e.map.remove(e); e.map = MAPS.island; MAPS.island.ents.push(e); const home = { iris: [40, 36], ansel: [39, 49] }[n]; if (home) { e.x = home[0] * TILE + 3; e.y = home[1] * TILE + 6; } }
            e.hidden = false; e.hold = false; e.brain = walkerBrain; e.st.leg = null; e.st.arrived = false; e.fixed = false;
        }
        const d = World.dot; d.hold = true; d.x = 87 * TILE + 3; d.y = 10 * TILE + 6; d.dir = 'up';
        Fx.fadeIn(1.5);
        Music.cut();
    },
    /* where on the screen the whole island is drawn */
    layout() {
        const m = MAPS.island, s = Math.min(R.gw / m.pw, R.gh / m.ph);
        return { s, x: R.gx + (R.gw - m.pw * s) / 2, y: R.gy + (R.gh - m.ph * s) / 2 };
    },
    /* the whole island once, small and still: the picture outside the view */
    still() {
        if (this.wide && this.wideVer === G.solidVer) return this.wide;
        const m = MAPS.island, c = document.createElement('canvas'); c.width = m.pw / 2; c.height = m.ph / 2;
        const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
        const save = World.map, saveT = G.t; World.map = m;
        const fake = Object.create(R); fake.ctx = ctx;
        const keepLight = Light.draw; Light.draw = () => { };
        R.drawWorld.call(fake, { x: 0, y: 0, w: m.pw, h: m.ph }, 0, 0, c.width, c.height, 0, { terrain: true });
        Light.draw = keepLight; World.map = save;
        ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, c.width, c.height);
        ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#9a98b8'; ctx.fillRect(0, 0, c.width, c.height);
        ctx.globalCompositeOperation = 'source-over';
        this.wide = c; this.wideVer = G.solidVer;
        return c;
    },
    draw(ctx) {
        const L = this.layout(), m = MAPS.island;
        ctx.fillStyle = '#1a2a44'; ctx.fillRect(R.gx, R.gy, R.gw, R.gh);
        /* the pull-back: from Dot's old view out to the whole island */
        const k = clamp(this.intro / 3.5, 0, 1), e = ease(k);
        const full = { s: L.s, x: L.x, y: L.y };
        const fr = Cam.rect(0);
        const close = { s: R.gw / fr.w, x: R.gx - fr.x * (R.gw / fr.w), y: R.gy - fr.y * (R.gw / fr.w) };
        const s = lerp(close.s, full.s, e), ox = lerp(close.x, full.x, e), oy = lerp(close.y, full.y, e);
        ctx.drawImage(this.still(), ox, oy, m.pw * s, m.ph * s);
        const frames = Cam.frames();
        frames.forEach((r, i) => {
            const sx = ox + r.x * s, sy = oy + r.y * s, sw = r.w * s, sh = r.h * s;
            R.drawWorld(r, sx, sy, sw, sh, i);
            ctx.strokeStyle = i ? '#9fe8ff' : P.cream; ctx.lineWidth = Math.max(2, R.s * 0.8);
            ctx.strokeRect(sx, sy, sw, sh);
            if (k >= 1) { const L2 = 6 * R.s; ctx.fillStyle = i ? '#9fe8ff' : P.cream; for (const [cx, cy] of [[sx, sy], [sx + sw, sy], [sx, sy + sh], [sx + sw, sy + sh]]) ctx.fillRect(cx - L2 / 2, cy - L2 / 2, L2, L2); }
        });
        if (Cam.split && k >= 1) {
            const [A, B] = frames;
            ctx.strokeStyle = 'rgba(255,200,240,0.8)'; ctx.setLineDash([4 * R.s, 3 * R.s]); ctx.lineWidth = R.s;
            ctx.beginPath(); ctx.moveTo(ox + (A.x + A.w) * s, oy + (A.y + A.h / 2) * s); ctx.lineTo(ox + B.x * s, oy + (B.y + B.h / 2) * s); ctx.stroke(); ctx.setLineDash([]);
        }
        if (G.flags.lit) Beam.draw(ctx, ox, oy, s);
        /* little marks for the folk walking to the cape */
        if (k >= 1 && !G.flags.lit) for (const n of EYE_WALKERS) {
            const p = ent(n); if (!p || p.map !== MAPS.island || p.st.arrived) continue;
            const x = ox + ecx(p) * s, y = oy + (p.y - 10) * s;
            ctx.fillStyle = p.seen ? P.yellow : P.cream; ctx.beginPath(); ctx.arc(x, y, 2.4 * R.s, 0, 7); ctx.fill();
            drawText(ctx, NAMES[n] || n, x + 4 * R.s, y - 4 * R.s, P.cream, R.s * 0.8, '#00000088');
        }
        if (k >= 1 && !World.cutscene && !G.flags.lit) this.drawGoals(ctx);
        if (G.flags.lastLook && !G.flags.ended && G.state === 'play' && !World.cutscene) {
            const t = 'Look at whatever you like.   Z: close your eye.';
            ctx.fillStyle = 'rgba(26,18,32,0.8)'; roundRect(ctx, R.gx + (VIEW_W / 2 - textWidth(t) / 2 - 8) * R.s, R.gy + (VIEW_H - 22) * R.s, (textWidth(t) + 16) * R.s, 14 * R.s, 4 * R.s); ctx.fill();
            drawText(ctx, t, R.gx + (VIEW_W / 2 - textWidth(t) / 2) * R.s, R.gy + (VIEW_H - 19) * R.s, P.cream, R.s);
        }
    },
    goals() {
        const F = G.flags, here = n => { const e = ent(n); return e && e.st.arrived; };
        return [
            [Light.night(), 'Night (the island keeps the Great Clock\'s hour)'],
            [here('ansel'), 'Grandpa Ansel at the lighthouse'],
            [EYE_WALKERS.slice(1).every(here), 'Everyone else (if you can)'],
            [F.lit, 'A flame for the lamp'],
        ];
    },
    drawGoals(ctx) {
        const s = R.s;
        const g = this.goals();
        const k = s * 0.75;
        ctx.fillStyle = 'rgba(26,18,32,0.82)'; roundRect(ctx, R.gx + 4 * s, R.gy + R.gh - 42 * s, 150 * s, 38 * s, 4 * s); ctx.fill();
        g.forEach(([ok, t], i) => drawText(ctx, (ok ? '✓ ' : '· ') + t, R.gx + 9 * s, R.gy + R.gh - 38 * s + i * 8.5 * s, ok ? P.yellow : P.cream, k));
        drawText(ctx, 'Arrows: move   Q/E: size   Tab: split   X: other half', R.gx + 160 * s, R.gy + R.gh - 10 * s, '#c9b8e8', k, '#00000088');
    },
};
Story.on('tick', (dt) => {
    if (!G.flags.eye) return;
    Eye.intro += dt; Eye.t += dt;
    if (Eye.intro > 3.5 && !G.flags.eyeTold && !World.cutscene) {
        G.flags.eyeTold = true;
        scene(async () => {
            await say('(This is the island. All of it. The lit-up box is what you see; everywhere else holds still.)', null, { name: false });
            await say('(Move the view with the arrows. It isn\'t Dot\'s any more. It\'s yours.)', null, { name: false });
        });
    }
});
Story.on('restore', () => { if (G.flags.eye && !G.flags.ended) World.afterLoad = () => { Eye.begin(); Eye.intro = 99; G.flags.eyeTold = true; Fx.fade = 0; }; });

/* lit: the light sweeps the island, and wherever it falls, things go on by themselves */
async function lightTheLamp() {
    const F = G.flags;
    const ansel = ent('ansel');
    if (!ansel || !ansel.st.arrived) {
        if (!F.needAnsel || G.t - F.needAnsel > 6) { F.needAnsel = G.t; const d = World.dot; bark(d, 'Wait! Grandpa needs to be here!', 3); }
        return;
    }
    if (F.lit) return;
    F.lit = true; Sfx.play('bell'); Fx.flash = 0.8;
    for (const e of MAPS.island.ents) if (e.kind === 'ember') { e.removed = true; }
    MAPS.island.ents = MAPS.island.ents.filter(e => !e.removed || e.kind !== 'ember');
    Save.write(true);
    await scene(async () => {
        await wait(1.5);
        await say('Ninety-nine years. Look at that. LOOK at it.', 'ansel');
        await say('It\'s looking at us. The whole island, all by itself.', 'iris');
        await say('Hey. You. Eye.', 'dot');
        await say('When you go now, we won\'t stop. The light will keep the hour for us. The Faded will be seen every night.', 'dot');
        await say('Thank you for looking at us. Most people never do.', 'dot');
        await say('One last look? At whatever you like. Then you can close your eye.', 'dot');
    });
    F.lastLook = true;
}
const Beam = {
    a: 0,
    /* the light's reach, as rectangles along its direction (it's a view too: things in it go on) */
    rects() {
        const L = ent('lhlamp'); if (!L) return [];
        const out = [], cx = ecx(L), cy = ecy(L) + 20;
        for (let i = 1; i <= 7; i++) {
            const d = i * 14 * TILE / 1.1, w = 10 * TILE + i * 18;
            out.push({ x: cx + Math.cos(this.a) * d - w / 2, y: cy + Math.sin(this.a) * d - w / 2, w, h: w });
        }
        return out;
    },
    draw(ctx, ox, oy, s) {
        const L = ent('lhlamp'); if (!L) return;
        const cx = ox + ecx(L) * s, cy = oy + ecy(L) * s, len = 110 * TILE * s;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, len);
        g.addColorStop(0, 'rgba(255,240,180,0.55)'); g.addColorStop(1, 'rgba(255,240,180,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, len, this.a - 0.18, this.a + 0.18); ctx.closePath(); ctx.fill();
    },
};
Story.on('tick', (dt) => {
    if (!G.flags.lit) return;
    Beam.a = (Beam.a + dt * 0.5) % (Math.PI * 2);
    /* the Faded, seen at last, come back to themselves */
    for (const e of MAPS.island.ents) if (e.kind === 'faded' && !e.restored) {
        for (const r of Beam.rects()) if (overlap(r, e)) { e.restored = true; }
    }
});
/* the beam is a view too */
Laws.see = (function (orig) { return function () { orig.call(this); if (G.flags.lit && World.map && World.map.id === 'island') { const extra = Beam.rects(); this.frames = this.frames.concat(extra); for (const e of World.map.ents) if (!e.seen && exists(e) && extra.some(r => overlap(r, visBox(e)))) e.seen = true; } }; })(Laws.see);
