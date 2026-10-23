/* ---- 51_fishing.js ---- */
/* Fishing: cast, wait for the nibbles, press on the big bite */
const FISH_QUIPS = {
    tuna: 'The king of poke!', moonfish: 'It glows a little. A night owl fish!', sunrise: "It's so early. Why was it even awake?",
    boot: "It's just a fish that gave up.", salmon: 'Nigiri time!', eel: 'Unagi! Slippery, delicious, rude.',
    pufferfish: 'It puffed up. Rude. Beautiful, but rude.', goldfish: 'A tiny golden legend!', koi: 'So elegant. Maki would approve.',
    squid: 'Squid! It inked a little. Out of respect.', octopus: 'Eight arms. Zero chill.', shrimp: 'Sweet shrimp! Tom yum material.',
    crawfish: 'Crawfish! Spicy boil energy.', yellowtail: 'Yellowtail! Very sushi.', mackerel: 'Mackerel! Classic.',
};
/* standing out on the pier (past the beach), where the big ones bite */
function onPier() {
    const pr = W0.pier, p = G.player;
    if (!pr || !p || G.area.id !== 'island') return false;
    const tx = Math.floor(p.x / TILE), ty = Math.floor((p.y - 2) / TILE);
    return tx >= pr.x0 - 1 && tx <= pr.x1 + 1 && ty >= pr.y0 + 2 && ty <= pr.y1;
}
const Fishing = {
    st: null,
    start(tx, ty, kind) {
        const p = G.player;
        // cast a little further out if there is more water that way
        const [dx, dy] = DIRV[p.dir];
        let bx = tx, by = ty;
        for (let k = 1; k <= 2; k++) if (G.area.waterAt(tx + dx * k, ty + dy * k) === kind) { bx = tx + dx * k; by = ty + dy * k; }
        this.st = { phase: 'cast', t: 0, x: (bx + 0.5) * TILE, y: (by + 0.5) * TILE, sx: p.x + dx * 8, sy: p.y - 10 + dy * 4, kind,
            wait: rint(80, 260) * (bonusOn('fisher') ? 0.6 : 1), nibbles: rint(1, 3), dip: 0, shadow: null, fish: this.choose(kind) };
        if (R() < (bonusOn('fisher') ? 0.2 : 0.1)) this.st.fish = 'crate';
        const f = FISHES.find(q => q.id === this.st.fish) || (this.st.fish === 'crate' ? { size: 2 } : null);
        const size = f ? f.size : 2;
        const ang = R() * Math.PI * 2;
        this.st.shadow = { x: this.st.x + Math.cos(ang) * 30, y: this.st.y + Math.sin(ang) * 20, size };
        p.pose = 'fish'; p.poseT = 99999;
        G.fishing = true;
        Sfx.play('cast');
    },
    choose(kind) {
        const h = Clock.hourF(), season = Clock.season();
        const ok = FISHES.filter(f => {
            if (!f.where.includes(kind)) return false;
            if (!f.seasons.includes(season)) return false;
            const [a, b] = f.hours;
            return hourIn(h, a, b);
        });
        const list = ok.map(f => {
            let w = f.w;
            if (G.weather === 'rain' && (f.id === 'eel' || f.id === 'catfish')) w *= 2.5;
            if (G.area.id === 'island' && this.st === null && onPier() && f.size >= 3) w *= 1.4;   // the pier: bigger fish
            if (bonusOn('fisher') && f.price >= 700) w *= 2.2;
            return [f.id, w];
        });
        return list.length ? weighted(list) : 'boot';
    },
    press() {
        const s = this.st;
        if (!s) return;
        if (s.phase === 'bite') this.catch();
        else if (s.phase === 'cast' || s.phase === 'wait' || s.phase === 'nibble') this.fail("Too early! It swam away.");
    },
    update() {
        const s = this.st;
        if (!s) return;
        s.t++;
        const p = G.player;
        if (s.phase === 'cast') { if (s.t > 20) { s.phase = 'wait'; s.t = 0; Sfx.play('plop'); } return; }
        // the shadow drifts toward the bobber
        const sh = s.shadow;
        const dx = s.x - sh.x, dy = s.y - sh.y, d = Math.hypot(dx, dy);
        if (d > 7) { sh.x += dx / d * 0.25; sh.y += dy / d * 0.25; }
        if (s.phase === 'wait' && s.t > s.wait && d <= 8) { s.phase = 'nibble'; s.t = 0; }
        else if (s.phase === 'nibble') {
            if (s.t % 45 === 1) { s.dip = 5; Sfx.play('nibble'); }
            if (s.t >= s.nibbles * 45 + rint(10, 50)) { s.phase = 'bite'; s.t = 0; s.dip = 12; Sfx.play('bite'); p.emote = 'bang'; p.emoteT = 30; }
        } else if (s.phase === 'bite') {
            if (s.t > 52) this.fail('It got away...');
        }
        if (s.dip > 0) s.dip -= 0.5;
        if (G.keys.Escape || G.keys.KeyB) this.stop();
    },
    async catch() {
        const s = this.st;
        this.stop(true);
        const id = s.fish;
        const p = G.player;
        p.pose = 'cheer'; p.poseT = 70; p.dir = 'down';
        if (id === 'crate') { G.busy++; try { await openCrate(); } finally { G.busy--; } Bus.emit('fish', 'crate'); return; }
        Sfx.play('fanfare');
        G.busy++;
        G.held = id;
        S.stats.fish = (S.stats.fish || 0) + 1;
        const first = !S.seen[id];
        await UI.say(null, `Sarah caught ${id === 'boot' ? 'an old boot' : aOrAn(itemName(id)) + ' ' + itemName(id).toLowerCase()}! ${FISH_QUIPS[id] || ''}${first ? ' (New!)' : ''}`);
        G.held = null;
        receive(id, 1, true);
        S.seen[id] = S.seen[id] || Clock.dayNum();
        G.busy--;
        Bus.emit('fish', id);
    },
    fail(msg) {
        this.stop(true);
        G.player.emote = 'sweat'; G.player.emoteT = 50;
        UI.toast(msg);
        Sfx.play('miss');
    },
    stop(quiet) {
        this.st = null;
        G.fishing = false;
        const p = G.player;
        if (p.pose === 'fish') { p.pose = null; p.poseT = 0; }
        if (!quiet) Sfx.play('reel');
    },
    draw(ctx) {
        const s = this.st;
        if (!s) return;
        const p = G.player;
        const hx = p.x + (p.dir === 'left' ? -9 : p.dir === 'right' ? 9 : 5), hy = p.y - 16 + (p.dir === 'up' ? -6 : 0);
        let bx = s.x, by = s.y;
        if (s.phase === 'cast') { const k = Math.min(1, s.t / 20); bx = lerp(hx, s.x, k); by = lerp(hy, s.y, k) - Math.sin(k * Math.PI) * 18; }
        if (s.phase !== 'cast' && s.shadow) spr(ctx, `fishshadow_${Math.min(4, s.shadow.size)}`, s.shadow.x, s.shadow.y);
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(hx + 0.5, hy + 0.5); ctx.quadraticCurveTo((hx + bx) / 2, Math.max(hy, by) + 4, bx + 0.5, by + 0.5 + s.dip * 0.3); ctx.stroke();
        // rod
        ctx.strokeStyle = '#7a5234';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(p.x + (p.dir === 'left' ? -3 : 3), p.y - 10); ctx.lineTo(hx, hy); ctx.stroke();
        spr(ctx, 'bobber', bx, by + (s.phase === 'cast' ? 0 : Math.round(s.dip * 0.25) + (G.t >> 5) % 2));
        if (s.phase === 'bite' || (s.phase === 'nibble' && s.dip > 3)) {
            ctx.strokeStyle = 'rgba(255,255,255,0.7)';
            ctx.beginPath(); ctx.ellipse(bx, by + 3, 6 + (s.t % 20) / 3, 2 + (s.t % 20) / 8, 0, 0, 7); ctx.stroke();
        }
    },
};
function startFishing(tx, ty, kind) {
    if (!pocketCount('rod')) {
        UI.say(null, S.flags.rod ? "Sarah's fishing rod is at home. (Check storage? Or buy one from Fortune.)" : 'Sarah needs a fishing rod. Kai, the poke bowl on the beach, might have a spare.');
        return;
    }
    if (G.fishing) return;
    Fishing.start(tx, ty, kind);
}

