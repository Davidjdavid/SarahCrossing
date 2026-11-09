/* the title screen */
const Title = {
    sel: 0, t: 0, has: false,
    enter() { this.t = 0; this.has = !!Save.read(); this.sel = this.has ? 0 : 1; G.state = 'title'; },
    items() { return this.has ? ['Continue', 'New game'] : ['Begin']; },
    update(dt) {
        this.t += dt;
        const items = this.items();
        if (Input.hit.up || Input.hit.down) { this.sel = (this.sel + 1) % items.length; Sfx.play('tick'); }
        if (Input.hit.act || Input.clicked) {
            Audio2.unlock();
            const it = items[this.sel % items.length];
            Sfx.play('next');
            if (it === 'Continue') Game.continueGame();
            else if (it === 'New game') { if (this.confirm) { this.confirm = false; Save.clear(); Game.newGame(); } else { this.confirm = true; } }
            else Game.newGame();
        }
        if (Input.hit.menu || Input.hit.back) this.confirm = false;
    },
    draw(ctx) {
        const s = R.s, X = v => R.gx + v * s, Y = v => R.gy + v * s;
        /* a night sea under a turning beam: the title's picture */
        const g = ctx.createLinearGradient(0, R.gy, 0, R.gy + R.gh);
        g.addColorStop(0, '#1b1838'); g.addColorStop(0.6, '#3a2f5c'); g.addColorStop(1, '#162a44');
        ctx.fillStyle = g; ctx.fillRect(R.gx, R.gy, R.gw, R.gh);
        for (let i = 0; i < 40; i++) { const x = hash2(i, 1, 9) * VIEW_W, y = hash2(i, 2, 9) * 110; ctx.fillStyle = `rgba(255,248,236,${0.3 + 0.5 * Math.abs(Math.sin(this.t * 0.8 + i))})`; ctx.fillRect(X(x), Y(y), s, s); }
        ctx.fillStyle = '#20406a'; ctx.fillRect(X(0), Y(150), R.gw, (VIEW_H - 150) * s);
        for (let i = 0; i < 30; i++) { const x = (hash2(i, 3, 9) * VIEW_W + this.t * 6 * (i % 3 + 1)) % VIEW_W, y = 152 + hash2(i, 4, 9) * 60; ctx.fillStyle = 'rgba(160,200,255,0.35)'; ctx.fillRect(X(x), Y(y), 6 * s, s); }
        ctx.fillStyle = '#2a2440'; ctx.beginPath(); ctx.moveTo(X(250), Y(152)); ctx.lineTo(X(290), Y(128)); ctx.lineTo(X(340), Y(132)); ctx.lineTo(X(384), Y(150)); ctx.lineTo(X(384), Y(156)); ctx.lineTo(X(250), Y(156)); ctx.fill();
        const lh = lighthouseCanvas(false); ctx.drawImage(lh, X(300), Y(132 - lh.height * 0.6), lh.width * 0.6 * s, lh.height * 0.6 * s);
        drawText(ctx, 'SELDOM', X(VIEW_W / 2 - textWidth('SELDOM') * 2.5), Y(54), P.cream, s * 5, '#120c18');
        drawText(ctx, 'a little island, seldom seen', X(VIEW_W / 2 - textWidth('a little island, seldom seen') / 2), Y(98), '#c9b8e8', s);
        const items = this.items();
        items.forEach((it, i) => {
            const t = (i === this.sel ? '→ ' : '   ') + (it === 'New game' && this.confirm ? 'New game? (erases the save) Press again' : it);
            drawText(ctx, t, X(VIEW_W / 2 - 40), Y(120 + i * 12), i === this.sel ? P.yellow : P.cream, s, '#120c18');
        });
        drawText(ctx, 'Z or Space to choose', X(6), Y(VIEW_H - 12), '#8a7aa8', s);
        drawText(ctx, 'v1', X(VIEW_W - 14), Y(VIEW_H - 12), '#8a7aa8', s);
    },
};
