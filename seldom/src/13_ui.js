/* light by the hour, the HUD, hints, the notebook, the menu and the title */
const Light = {
    /* the sky's tint for an hour: [r,g,b] to multiply by, and how dark */
    tint(h) {
        h = ((h % 24) + 24) % 24;
        const keys = [[0, [70, 80, 150]], [4.5, [70, 80, 150]], [6, [255, 190, 200]], [7.5, [255, 255, 255]], [16.5, [255, 255, 255]], [18, [255, 190, 130]], [19.5, [150, 110, 170]], [21, [70, 80, 150]], [24, [70, 80, 150]]];
        for (let i = 0; i < keys.length - 1; i++) {
            const [h0, c0] = keys[i], [h1, c1] = keys[i + 1];
            if (h >= h0 && h <= h1) { const t = (h - h0) / (h1 - h0 || 1); return c0.map((v, j) => Math.round(lerp(v, c1[j], t))); }
        }
        return [255, 255, 255];
    },
    night() { const h = World.hour % 24; return h >= 19.5 || h < 5.5; },
    dark() { const c = this.tint(World.hour); return 1 - (c[0] + c[1] + c[2]) / 765; },
    draw(D, r, sx, sy, sw, sh) {
        const map = World.map, ctx = D.ctx;
        if (map.def.indoor) { if (map.def.dim) { ctx.fillStyle = map.def.dim; ctx.globalCompositeOperation = 'multiply'; ctx.fillRect(sx, sy, sw, sh); ctx.globalCompositeOperation = 'source-over'; } return; }
        const c = this.tint(World.hour);
        if (c[0] + c[1] + c[2] >= 765) return;
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; ctx.fillRect(sx, sy, sw, sh);
        ctx.globalCompositeOperation = 'lighter';
        const dk = this.dark();
        const glow = (x, y, rad, col) => {
            const X = D.X(x), Y = D.Y(y), R2 = rad * D.k;
            if (X < sx - R2 || X > sx + sw + R2 || Y < sy - R2 || Y > sy + sh + R2) return;
            const g = ctx.createRadialGradient(X, Y, 0, X, Y, R2);
            g.addColorStop(0, col.replace('A', (0.55 * dk).toFixed(3))); g.addColorStop(1, col.replace('A', '0'));
            ctx.fillStyle = g; ctx.fillRect(X - R2, Y - R2, R2 * 2, R2 * 2);
        };
        for (const e of map.ents) { const K = KINDS[e.kind]; if (K.light && exists(e)) { const L = K.light(e); if (L) glow(ecx(e), e.y + e.h - (L.up || 8), L.r, L.c || 'rgba(255,200,120,A)'); } }
        for (const p of map.props) if (p.lights && !p.gone) for (const [x, y, rad] of p.lights) glow(p.tx * TILE + x, p.ty * TILE + y, rad, 'rgba(255,200,120,A)');
        if (World.dot && World.dot.map === map && World.dot.lantern) glow(ecx(World.dot), World.dot.y - 4, 40, 'rgba(255,210,140,A)');
        ctx.globalCompositeOperation = 'source-over';
    },
};

const UI = {
    hint: null, hintT: 0, areaName: null, areaT: 0, menu: null, menuSel: 0,
    showHint(text, secs) { this.hint = text; this.hintT = secs || 6; },
    area(name) { if (name && name !== this.areaName) { this.areaName = name; this.areaT = 3; } },
    update(dt) { this.hintT = Math.max(0, this.hintT - dt); this.areaT = Math.max(0, this.areaT - dt); },
    draw(ctx) {
        const s = R.s, X = v => R.gx + v * s, Y = v => R.gy + v * s;
        if (Fx.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${Fx.fade})`; ctx.fillRect(R.gx, R.gy, R.gw, R.gh); }
        if (Fx.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${Fx.flash})`; ctx.fillRect(R.gx, R.gy, R.gw, R.gh); }
        if (G.state === 'ending' || G.state === 'credits') { Ending.draw(ctx); return; }
        if (!G.hudOff) this.drawHud(ctx, X, Y, s);
        if (this.areaT > 0 && this.areaName) {
            const a = Math.min(1, this.areaT, (3 - this.areaT) * 3);
            ctx.globalAlpha = a; const w = textWidth(this.areaName) * 2;
            drawText(ctx, this.areaName, X(VIEW_W / 2 - w / 2), Y(40), P.cream, s * 2, P.ink);
            ctx.globalAlpha = 1;
        }
        if (this.hintT > 0 && this.hint && G.state === 'play') {
            const a = Math.min(1, this.hintT); ctx.globalAlpha = a * 0.9;
            const lines = wrapText(this.hint, 330), w = Math.max(...lines.map(textWidth)) + 12, h = 4 + lines.length * 10;
            ctx.fillStyle = 'rgba(26,18,32,0.85)'; roundRect(ctx, X(VIEW_W / 2 - w / 2), Y(VIEW_H - 9 - h), w * s, h * s, 4 * s); ctx.fill();
            lines.forEach((ln, i) => drawText(ctx, ln, X(VIEW_W / 2 - w / 2 + 6), Y(VIEW_H - 6 - h + i * 10), P.cream, s));
            ctx.globalAlpha = 1;
        }
        if (Fx.toasts.length && G.state !== 'title') {
            const t = Fx.toasts[0], a = Math.min(1, t.t * 4, (3 - t.t) * 2);
            ctx.globalAlpha = a; const w = textWidth(t.text) + 22;
            ctx.fillStyle = P.cream; roundRect(ctx, X(VIEW_W / 2 - w / 2), Y(6), w * s, 14 * s, 4 * s); ctx.fill();
            ctx.drawImage(thing('note'), X(VIEW_W / 2 - w / 2 + 4), Y(7), 10 * s, 12 * s);
            drawText(ctx, t.text, X(VIEW_W / 2 - w / 2 + 17), Y(9), P.ink, s);
            ctx.globalAlpha = 1;
        }
        Talk.draw(ctx);
        if (G.state === 'notebook') this.drawNotebook(ctx, X, Y, s);
        if (G.state === 'menu') this.drawMenu(ctx, X, Y, s);
    },
    drawHud(ctx, X, Y, s) {
        if (World.map && !World.map.def.noClock) {
            const cx = X(12), cy = Y(12), r = 7.5 * s;
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = 'rgba(26,18,32,0.75)'; ctx.beginPath(); ctx.arc(cx, cy, r + 2 * s, 0, 7); ctx.fill();
            ctx.fillStyle = Light.night() ? '#d8dcf8' : P.white; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
            const h = World.hour % 12, m = (World.hour % 1);
            const hand = (a, len, w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(a) * len, cy - Math.cos(a) * len); ctx.stroke(); };
            hand(h / 12 * Math.PI * 2, r * 0.5, 2 * s, P.ink); hand(m * Math.PI * 2, r * 0.8, 1.2 * s, P.redS);
            ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(cx, cy, 1.2 * s, 0, 7); ctx.fill();
            ctx.globalAlpha = 1;
        }
        let x = VIEW_W - 16;
        for (const [flag, pic] of [['prism', 'prism'], ['wideglass', 'wideglass'], ['loupe', 'loupe'], ['spyglass', 'spyglass']]) {
            if (!G.flags[flag]) continue;
            const c = thing(pic); ctx.drawImage(c, X(x - c.width / 2), Y(16 - c.height / 2), c.width * s, c.height * s); x -= 18;
        }
        if (Cam.zoom !== 1 && (Cam.zmin < 1 || Cam.zmax > 1)) drawText(ctx, 'x' + (Math.round(Cam.zoom * 100) / 100), X(VIEW_W - 30), Y(28), P.cream, s, P.ink);
    },
    /* the notebook: the laws Dot has seen, and what's in the pockets */
    drawNotebook(ctx, X, Y, s) {
        ctx.fillStyle = 'rgba(10,6,14,0.6)'; ctx.fillRect(R.gx, R.gy, R.gw, R.gh);
        const bx = 40, by = 18, bw = VIEW_W - 80, bh = VIEW_H - 36;
        ctx.fillStyle = '#f3e6c4'; roundRect(ctx, X(bx), Y(by), bw * s, bh * s, 5 * s); ctx.fill();
        ctx.fillStyle = '#d8c79e'; ctx.fillRect(X(bx + bw / 2 - 1), Y(by + 4), 2 * s, (bh - 8) * s);
        for (let y = by + 20; y < by + bh - 6; y += 10) { ctx.fillStyle = '#e4d3ab'; ctx.fillRect(X(bx + 6), Y(y), (bw / 2 - 12) * s, s * 0.5); ctx.fillRect(X(bx + bw / 2 + 6), Y(y), (bw / 2 - 12) * s, s * 0.5); }
        drawText(ctx, "Dot's notebook", X(bx + 10), Y(by + 6), P.brownD, s);
        const shown = LAWS.filter(l => !l.secret || Notebook.got[l.key]);
        shown.forEach((l, i) => {
            const got = Notebook.got[l.key];
            const y = by + 20 + i * 11;
            if (i === Notebook.sel) { ctx.fillStyle = 'rgba(240,138,60,0.25)'; ctx.fillRect(X(bx + 6), Y(y - 1), (bw / 2 - 12) * s, 10 * s); }
            drawText(ctx, (got ? '✎ ' + l.title : '· · ·'), X(bx + 10), Y(y), got ? P.ink : '#a8946c', s);
        });
        const L = shown[Notebook.sel];
        if (L && Notebook.got[L.key]) {
            drawText(ctx, L.title, X(bx + bw / 2 + 10), Y(by + 8), P.redS, s);
            wrapText(L.text, bw / 2 - 22).forEach((ln, i) => drawText(ctx, ln, X(bx + bw / 2 + 10), Y(by + 22 + i * 10), P.ink, s));
        } else drawText(ctx, 'Not yet...', X(bx + bw / 2 + 10), Y(by + 22), '#a8946c', s);
        const inv = Object.entries(World.inv).filter(([, n]) => n > 0);
        const cur = Object.keys(CURIOS).filter(k => G.flags['curio_' + k]);
        const lines = [];
        if (inv.length) lines.push('Pockets: ' + inv.map(([k, n]) => (ITEM_NAMES[k] || k) + ' ' + n).join(', '));
        if (cur.length) lines.push('Curios found: ' + cur.length + ' of 6 (on Dot\'s shelf at home)');
        lines.flatMap(l => wrapText(l, bw / 2 - 22)).forEach((ln, i, all) => drawText(ctx, ln, X(bx + bw / 2 + 10), Y(by + bh - 12 - (all.length - i) * 10), P.brownD, s));
        drawText(ctx, 'N or Esc to close', X(bx + 10), Y(by + bh - 12), '#a8946c', s);
    },
    updateNotebook() {
        const shown = LAWS.filter(l => !l.secret || Notebook.got[l.key]);
        if (Input.hit.up) Notebook.sel = (Notebook.sel + shown.length - 1) % shown.length, Sfx.play('tick');
        if (Input.hit.down) Notebook.sel = (Notebook.sel + 1) % shown.length, Sfx.play('tick');
        if (Input.hit.notebook || Input.hit.menu || Input.hit.back) { G.state = 'play'; Sfx.play('close'); }
    },
    openMenu() { this.menu = 'main'; this.menuSel = 0; G.state = 'menu'; Sfx.play('open'); },
    menuItems() {
        if (this.menu === 'controls') return ['Back'];
        if (this.menu === 'settings') return ['Sound: ' + Math.round(Settings.volume * 10), 'Music: ' + Math.round(Settings.music * 10), 'Calm flicker: ' + (Settings.calm ? 'on' : 'off'), 'Back'];
        return ['Back to the island', 'Notebook', 'Controls', 'Settings', 'Save and go to the title'];
    },
    updateMenu() {
        const items = this.menuItems();
        if (Input.hit.up) this.menuSel = (this.menuSel + items.length - 1) % items.length, Sfx.play('tick');
        if (Input.hit.down) this.menuSel = (this.menuSel + 1) % items.length, Sfx.play('tick');
        const lr = Input.hit.left ? -1 : Input.hit.right ? 1 : 0;
        if (this.menu === 'settings' && lr) {
            if (this.menuSel === 0) Settings.volume = clamp(Math.round(Settings.volume * 10 + lr) / 10, 0, 1);
            if (this.menuSel === 1) Settings.music = clamp(Math.round(Settings.music * 10 + lr) / 10, 0, 1);
            if (this.menuSel === 2) Settings.calm = !Settings.calm;
            Audio2.applyVolume(); Save.settings(); Sfx.play('tick');
        }
        if (Input.hit.menu || Input.hit.back) { if (this.menu === 'main') { G.state = 'play'; Sfx.play('close'); } else { this.menu = 'main'; this.menuSel = 0; } return; }
        if (!Input.hit.act) return;
        Input.consume('act'); Sfx.play('next');
        const it = items[this.menuSel];
        if (this.menu === 'main') {
            if (this.menuSel === 0) G.state = 'play';
            if (this.menuSel === 1) G.state = 'notebook';
            if (this.menuSel === 2) { this.menu = 'controls'; this.menuSel = 0; }
            if (this.menuSel === 3) { this.menu = 'settings'; this.menuSel = 0; }
            if (this.menuSel === 4) { Save.write(true); Game.toTitle(); }
        } else if (it === 'Back') { this.menu = 'main'; this.menuSel = 0; }
        else if (this.menu === 'settings' && this.menuSel === 2) { Settings.calm = !Settings.calm; Save.settings(); }
    },
    drawMenu(ctx, X, Y, s) {
        ctx.fillStyle = 'rgba(10,6,14,0.6)'; ctx.fillRect(R.gx, R.gy, R.gw, R.gh);
        const items = this.menuItems();
        const ctl = this.menu === 'controls' ? Controls.lines().flatMap(l => wrapText(l, 290)) : null;
        const bw = ctl ? 310 : 180, bh = ctl ? 34 + ctl.length * 10 : 24 + items.length * 14, bx = (VIEW_W - bw) / 2, by = (VIEW_H - bh) / 2;
        ctx.fillStyle = 'rgba(26,18,32,0.96)'; roundRect(ctx, X(bx), Y(by), bw * s, bh * s, 5 * s); ctx.fill();
        ctx.strokeStyle = P.cream; ctx.lineWidth = s; roundRect(ctx, X(bx + 1.5), Y(by + 1.5), (bw - 3) * s, (bh - 3) * s, 4 * s); ctx.stroke();
        if (this.menu === 'controls') {
            ctl.forEach((r, i) => drawText(ctx, r, X(bx + 10), Y(by + 10 + i * 10), P.cream, s));
            drawText(ctx, '→ Back', X(bx + 10), Y(by + bh - 14), P.yellow, s);
            return;
        }
        items.forEach((it, i) => drawText(ctx, (i === this.menuSel ? '→ ' : '   ') + it, X(bx + 12), Y(by + 12 + i * 14), i === this.menuSel ? P.yellow : P.cream, s));
    },
    drawTitle(ctx) { Title.draw(ctx); },
};
const ITEM_NAMES = { egg: 'Eggs', apple: 'Apples', flower: 'Flowers', bread: 'Bread', fish: 'Fish' };
const Controls = {
    lines() {
        const l = ['Walk: arrow keys or WASD', 'Talk, pick up, put down, throw: Z or Space'];
        if (G.flags.spyglass) l.push('Look: hold X (or Shift) and use the arrows', 'Let go of X: the view stays. C (or tap X): follow again');
        if (G.flags.wideglass || G.flags.loupe) l.push('Zoom: Q and E (or the mouse wheel)');
        if (G.flags.prism) l.push('Split the view: Tab');
        l.push('Notebook: N    Menu: Esc', 'A gamepad works too');
        return l;
    },
};
