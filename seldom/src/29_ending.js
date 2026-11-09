/* the end: one last look, the eye closes on it, and that picture is what the credits roll over */
const CREDITS = [
    ['SELDOM', 'title'],
    ['a little island, seldom seen', 'sub'],
    ['', ''],
    ['Dot', 'as themself'],
    ['Ansel', 'the keeper\'s grandson'],
    ['Iris', 'who watched the watching'],
    ['Mrs. Crumb', 'and the cake'],
    ['Bridget', 'and the bridge'],
    ['Tilt and Reel', 'the band'],
    ['Pan', 'Dolly, Lolly, Molly, Polly'],
    ['Watchman Lux', 'who could not see everything'],
    ['Ruth', 'still not home'],
    ['Rover', 'ninety-nine years late for lunch'],
    ['Mrs. Sepia', 'and the Faded'],
    ['Leica', 'good dog'],
    ['Old Holt', 'on his bench'],
    ['', ''],
    ['and you', 'as the Eye'],
    ['', ''],
    ['made by Claude', 'for David'],
];
const Ending = {
    t: 0, phase: 'iris', snap: null, cx: 0, cy: 0,
    begin() {
        G.state = 'ending'; this.t = 0; this.phase = 'iris';
        /* the picture: the last frame, drawn sharp */
        const r = Cam.rect(0), c = document.createElement('canvas'); c.width = VIEW_W * 3; c.height = Math.round(VIEW_W * 3 * r.h / r.w);
        const fake = Object.create(R); fake.ctx = c.getContext('2d'); fake.ctx.imageSmoothingEnabled = false;
        R.drawWorld.call(fake, r, 0, 0, c.width, c.height, 0);
        this.snap = c;
        const L = Eye.layout(); this.cx = L.x + (r.x + r.w / 2) * L.s; this.cy = L.y + (r.y + r.h / 2) * L.s;
        G.flags.ended = true; G.flags.endedAt = Date.now();
        Save.write(true);
        Sfx.play('close');
    },
    update(dt) {
        this.t += dt;
        if (this.phase === 'iris' && this.t > 2.6) { this.phase = 'credits'; this.t = 0; }
        else if (this.phase === 'credits' && (this.t > CREDITS.length * 1.6 + 6 || Input.hit.act && this.t > 3)) { this.phase = 'after'; this.t = 0; }
        else if (this.phase === 'after' && Input.hit.act && this.t > 1.5) { Game.toTitle(); }
        if (this.phase === 'after') { Beam.a = (Beam.a + dt * 0.5) % (Math.PI * 2); Cam.ax += Math.sin(this.t * 0.07) * 6 * dt; Cam.clampMap(0); }
    },
    draw(ctx) {
        const s = R.s, X = v => R.gx + v * s, Y = v => R.gy + v * s;
        if (this.phase === 'iris') {
            Eye.draw(ctx);
            const k = ease(clamp(this.t / 2.2, 0, 1)), rad = lerp(Math.hypot(R.gw, R.gh), 0, k);
            ctx.save(); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.rect(0, 0, R.W, R.H); ctx.arc(this.cx, this.cy, Math.max(0, rad), 0, Math.PI * 2, true); ctx.fill('evenodd'); ctx.restore();
            return;
        }
        ctx.fillStyle = '#000'; ctx.fillRect(R.gx, R.gy, R.gw, R.gh);
        if (this.phase === 'credits') {
            const pw = 200, ph = pw * this.snap.height / this.snap.width, px0 = 20, py0 = (VIEW_H - ph) / 2;
            ctx.globalAlpha = Math.min(1, this.t / 2);
            ctx.fillStyle = P.cream; ctx.fillRect(X(px0 - 4), Y(py0 - 4), (pw + 8) * s, (ph + 16) * s);
            ctx.drawImage(this.snap, X(px0), Y(py0), pw * s, ph * s);
            drawText(ctx, 'Seldom, the last look', X(px0), Y(py0 + ph + 3), P.brownD, s);
            ctx.globalAlpha = 1;
            const y0 = VIEW_H + 10 - this.t * 22;
            CREDITS.forEach(([a, b], i) => {
                const y = y0 + i * 18; if (y < -20 || y > VIEW_H + 10) return;
                if (b === 'title') drawText(ctx, a, X(300 - textWidth(a)), Y(y), P.cream, s * 2);
                else if (b === 'sub') drawText(ctx, a, X(300 - textWidth(a) / 2), Y(y + 4), '#c9b8e8', s);
                else { drawText(ctx, a, X(300 - textWidth(a) / 2), Y(y), P.cream, s); drawText(ctx, b, X(300 - textWidth(b) / 2), Y(y + 9), '#a898c8', s); }
            });
            const yEnd = y0 + CREDITS.length * 18 + 10;
            if (yEnd < VIEW_H) {
                const lines = [`Laws noted: ${Notebook.count()}`, `Curios found: ${curioCount()} of 6`, `Time on Seldom: ${fmtTime(G.playT)}`];
                lines.forEach((l, i) => drawText(ctx, l, X(300 - textWidth(l) / 2), Y(Math.max(yEnd, 70) + i * 11), P.yellow, s));
            }
            return;
        }
        /* after: the island goes on in the light, without anyone */
        Eye.draw(ctx);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(R.gx, R.gy, R.gw, R.gh);
        const t1 = 'The island goes on now, in its own light.', t2 = 'Press Z for the title. Your island will be here.';
        drawText(ctx, t1, X(VIEW_W / 2 - textWidth(t1) / 2), Y(VIEW_H - 30), P.cream, s, P.ink);
        if (this.t > 2) drawText(ctx, t2, X(VIEW_W / 2 - textWidth(t2) / 2), Y(VIEW_H - 18), '#c9b8e8', s, P.ink);
    },
};
function fmtTime(sec) { sec = Math.round(sec || 0); const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, s = sec % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0'); }
/* closing the eye: on the last look, the action button */
Story.on('tick', () => {
    if (G.flags.lastLook && !G.flags.ended && G.state === 'play' && !World.cutscene && Input.hit.act) Ending.begin();
});
