/* world things that aren't people or critters: the Great Clock, music, little bridges, lamps, signs */

/* the Great Clock: the island's hour moves only while its face is seen (it's an update, so Still does it) */
kind('clock', {
    w: 30, h: 10, ph: 30, fixed: true,
    draw() { },
    update(e, dt) {
        const before = World.hour;
        World.hour += dt * HOUR_RATE * (World.timeScale || 1);
        if (Math.floor(before) !== Math.floor(World.hour)) { Sfx.play('tock'); Story.hourChanged(Math.floor(World.hour)); }
        if (World.hour >= 24) { World.hour -= 24; World.day++; if (typeof midnight === 'function') midnight(); }
    },
    onSeen(e) { if (e.unseenFor > 20 && World.map.id !== 'test') Notebook.saw('hour'); },
});
function drawTower(D, p) {
    const c = towerCanvas();
    const x = p.tx * TILE + p.tw * TILE / 2 - c.width / 2, y = (p.ty + p.th) * TILE - c.height;
    D.img(c, x, y);
    /* the hands, as the island's hour has them */
    const ctx = D.ctx, cx = D.X(x + 18), cy = D.Y(y + 34), k = D.k;
    const h = World.hour % 12, m = World.hour % 1;
    const hand = (a, len, w, col) => { ctx.strokeStyle = col; ctx.lineWidth = w * k; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(a) * len * k, cy - Math.cos(a) * len * k); ctx.stroke(); };
    hand(h / 12 * Math.PI * 2, 3.6, 1.4, P.ink); hand(m * Math.PI * 2, 5.6, 0.9, P.redS);
}

/* the village band: their song is the village's music, and it only plays while they're seen */
kind('band', {
    w: 40, h: 12, ph: 26, solid: true, fixed: true,
    draw(e, D) {
        const ctx = D.ctx;
        ctx.fillStyle = '#b07a46'; ctx.fillRect(D.X(e.x - 2), D.Y(e.y - 2), (e.w + 4) * D.k, (e.h + 4) * D.k);
        ctx.fillStyle = '#8a5a34'; ctx.fillRect(D.X(e.x - 2), D.Y(e.y + e.h), (e.w + 4) * D.k, 3 * D.k);
        const beat = Math.floor((e.st.mpos || 0) * (SONGS[e.song] ? SONGS[e.song].bpm / 60 : 2)) % 2;
        const folks = [['drummer', BAND[0], 10], ['horn', BAND[1], 30]];
        for (const [id, sp, x] of folks) {
            const c = personFrame('band-' + id, sp, 'down', 0);
            D.img(c, e.x + x - 8, e.y + e.h - c.height - 2 - (beat && id === 'horn' ? 1 : 0));
        }
        D.img(thing('drum'), e.x + 3, e.y + 2 + (beat ? 1 : 0));
    },
    ownSong: true,
    update(e, dt) { musicStep(e, dt); },
    act(e) { say(e.talkLine || '♪ The band plays on, as long as somebody\'s watching. ♪', null); },
});
const BAND = [
    { skin: P.skinD, hair: '#2a1a1a', style: 'cap', hat: P.red, top: P.white, bottom: P.navy },
    { skin: P.skin, hair: '#c9a04a', style: 'bob', top: P.purple, bottom: P.navy },
];

/* a twig bridge the ants built: tiny (so only there when looked at closely), and something to walk on */
kind('twig', {
    w: 16, h: 6, ph: 6, tiny: true, deck: true, flat: true, fixed: true,
    draw(e, D) { D.img(thing('twig'), e.x, e.y); },
});

/* street lamps: lit at night */
kind('lamp', {
    w: 6, h: 4, ph: 28, solid: true, fixed: true,
    draw(e, D) {
        const ctx = D.ctx, k = D.k;
        ctx.fillStyle = P.greyD; ctx.fillRect(D.X(ecx(e) - 1), D.Y(e.y - 22), 2 * k, 24 * k);
        ctx.fillStyle = Light.night() || Light.dark() > 0.2 ? P.yellow : '#e8e2c0'; ctx.fillRect(D.X(ecx(e) - 3), D.Y(e.y - 28), 6 * k, 6 * k);
        ctx.fillStyle = P.ink; ctx.fillRect(D.X(ecx(e) - 4), D.Y(e.y - 29), 8 * k, 1.5 * k);
    },
    light(e) { return Light.dark() > 0.15 ? { r: 46, up: 26 } : null; },
});
/* a sign to read */
kind('sign', {
    w: 12, h: 6, ph: 14, solid: true, fixed: true,
    draw(e, D) {
        const ctx = D.ctx, k = D.k;
        ctx.fillStyle = P.brownS; ctx.fillRect(D.X(ecx(e) - 1), D.Y(e.y - 4), 2 * k, 10 * k);
        ctx.fillStyle = P.ink; ctx.fillRect(D.X(e.x - 1), D.Y(e.y - 12), (e.w + 2) * k, 10 * k);
        ctx.fillStyle = P.tan; ctx.fillRect(D.X(e.x), D.Y(e.y - 11), e.w * k, 8 * k);
        ctx.fillStyle = P.tanS; ctx.fillRect(D.X(e.x + 2), D.Y(e.y - 9), (e.w - 4) * k, k); ctx.fillRect(D.X(e.x + 2), D.Y(e.y - 6), (e.w - 5) * k, k);
    },
    act(e) { say(e.text); },
});

/* furniture and fixtures, drawn simply */
const FURN = {
    bed(D, e) { box(D, e.x, e.y - 10, e.w, e.h + 10, '#8a5a34'); box(D, e.x + 1, e.y - 9, e.w - 2, 6, P.white); box(D, e.x + 1, e.y - 3, e.w - 2, e.h + 1, '#5a7fd6'); },
    shelf(D, e) { box(D, e.x, e.y - 18, e.w, e.h + 18, '#8a5a34'); for (let i = 0; i < 3; i++) box(D, e.x + 1, e.y - 16 + i * 7, e.w - 2, 1, '#5a3a22'); },
    table(D, e) { box(D, e.x, e.y - 6, e.w, e.h + 2, '#b07a46'); box(D, e.x, e.y - 6, e.w, 2, '#c99a62'); },
    oven(D, e) { box(D, e.x, e.y - 16, e.w, e.h + 16, '#8a8378'); box(D, e.x + 3, e.y - 8, e.w - 6, 8, e.st.on ? '#f08a3c' : '#2a1b2d'); box(D, e.x + 2, e.y - 16, e.w - 4, 3, '#5c574f'); },
    counter(D, e) { box(D, e.x, e.y - 8, e.w, e.h + 8, '#8a5a34'); box(D, e.x, e.y - 8, e.w, 3, '#c08b55'); },
    telescope(D, e) { const ctx = D.ctx; ctx.strokeStyle = P.gold; ctx.lineWidth = 4 * D.k; ctx.beginPath(); ctx.moveTo(D.X(ecx(e) - 6), D.Y(e.y + 2)); ctx.lineTo(D.X(ecx(e) + 8), D.Y(e.y - 20)); ctx.stroke(); box(D, ecx(e) - 3, e.y - 2, 6, 6, P.brownS); },
    chart(D, e) { box(D, e.x, e.y - 20, e.w, 18, P.navy); for (let i = 0; i < 8; i++) box(D, e.x + 2 + (i * 7) % (e.w - 4), e.y - 18 + (i * 5) % 14, 1, 1, P.yellow); },
    pedestal(D, e) { box(D, e.x, e.y - 8, e.w, e.h + 8, P.stone); box(D, e.x - 1, e.y - 9, e.w + 2, 2, P.stoneS); },
    pew(D, e) { box(D, e.x, e.y - 6, e.w, e.h + 6, '#6a4a3a'); box(D, e.x, e.y - 8, e.w, 3, '#4a2c1d'); },
    altar(D, e) { box(D, e.x, e.y - 10, e.w, e.h + 10, P.stone); box(D, e.x, e.y - 10, e.w, 2, P.gold); },
    barrel(D, e) { box(D, e.x, e.y - 10, e.w, e.h + 10, P.brown); box(D, e.x, e.y - 6, e.w, 1, P.brownD); box(D, e.x, e.y - 1, e.w, 1, P.brownD); },
    plant(D, e) { box(D, e.x + 2, e.y - 4, e.w - 4, e.h + 4, '#a8603a'); D.img(treeCanvas('bush', 0), ecx(e) - 9, e.y - 16); },
    stairs(D, e) { for (let i = 0; i < 4; i++) box(D, e.x, e.y - 12 + i * 4, e.w, 3, i % 2 ? '#8a8378' : '#a39a8c'); },
    lens(D, e) {
        /* the great lens: a brass drum of four glasses round the lamp */
        const ctx = D.ctx, cx = D.X(ecx(e)), cy = D.Y(e.y - 8), r = 20 * D.k, n = G.flags.lensSet || 0;
        box(D, e.x + 4, e.y - 2, e.w - 8, e.h + 2, '#5c574f');
        ctx.fillStyle = P.goldS; ctx.beginPath(); ctx.arc(cx, cy, r + 3 * D.k, 0, 7); ctx.fill();
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = i < n ? (G.flags.lit ? '#fff6c8' : '#bfe6ff') : '#2a2440';
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, -Math.PI / 2 + i * Math.PI / 2 + 0.08, -Math.PI / 2 + (i + 1) * Math.PI / 2 - 0.08); ctx.closePath(); ctx.fill();
        }
        ctx.fillStyle = P.gold; ctx.beginPath(); ctx.arc(cx, cy, 5 * D.k, 0, 7); ctx.fill();
        if (n >= 4) { ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + Math.sin(G.t * 3) * 0.15) + ')'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill(); }
    },
    breadcounter(D, e) { FURN.counter(D, e); D.img(thing('bread'), e.x + 2, e.y - 14); },
    crates(D, e) { D.img(thing('crate'), e.x, e.y + e.h - 16); D.img(thing('crate'), e.x + 6, e.y + e.h - 26); },
    organ(D, e) { box(D, e.x, e.y - 24, e.w, e.h + 24, '#5a3a4a'); for (let i = 0; i < 6; i++) box(D, e.x + 2 + i * 5, e.y - 30, 3, 10, P.stoneS); },
    crate(D, e) { D.img(thing('crate'), e.x, e.y + e.h - 16); },
    chest(D, e) { box(D, e.x, e.y - 8, e.w, e.h + 8, P.brown); box(D, e.x, e.y - 8, e.w, 3, P.brownS); box(D, ecx(e) - 1, e.y - 4, 2, 2, P.gold); },
    bench(D, e) { box(D, e.x, e.y - 5, e.w, 3, '#b07a46'); box(D, e.x, e.y - 9, e.w, 2, '#8a5a34'); box(D, e.x + 1, e.y - 2, 1, 4, P.brownD); box(D, e.x + e.w - 2, e.y - 2, 1, 4, P.brownD); },
    window(D, e) { box(D, e.x, e.y - 12, e.w, 12, '#5a3a22'); box(D, e.x + 1, e.y - 11, e.w - 2, 10, Light.night() ? '#2a3566' : '#9fd3f0'); box(D, e.x + e.w / 2 - 0.5, e.y - 11, 1, 10, '#5a3a22'); },
    rug(D, e) { box(D, e.x, e.y, e.w, e.h, '#b8434f'); box(D, e.x + 2, e.y + 2, e.w - 4, e.h - 4, '#c9566a'); },
    fireplace(D, e) { box(D, e.x, e.y - 18, e.w, e.h + 18, P.stoneS); box(D, e.x + 4, e.y - 8, e.w - 8, 8, '#2a1b2d'); if (e.lit !== false) box(D, e.x + 6, e.y - 5 - Math.abs(Math.sin(G.t * 9)) * 2, e.w - 12, 5, P.orange); },
};
function box(D, x, y, w, h, c) { D.ctx.fillStyle = c; D.ctx.fillRect(D.X(x), D.Y(y), Math.ceil(w * D.k), Math.ceil(h * D.k)); }
kind('furn', {
    w: 16, h: 8, ph: 20, solid: true, fixed: true,
    draw(e, D) { const f = FURN[e.furn]; if (f) { const ctx = D.ctx; f(D, e); ctx.strokeStyle = P.ink; } },
    act(e) { if (e.say) say(typeof e.say === 'function' ? e.say(e) : e.say); },
    light(e) { return e.furn === 'fireplace' ? { r: 50, up: 6, c: 'rgba(255,170,90,A)' } : null; },
});
function furn(map, f, tx, ty, w, h, o) { return map.add('furn', tx * TILE, ty * TILE + TILE - h, Object.assign({ furn: f, w, h }, o)); }
