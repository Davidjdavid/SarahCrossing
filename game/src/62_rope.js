/* ---- 62_rope.js ---- */
/* Jump rope in the plaza. Most dry afternoons Cuke and a friend turn a long rope from 2:30 to 5:30 PM. Walk up and
   jump in: press A (or tap) as the rope swings under Sarah's feet. It gets faster every five jumps. */

const ROPE_HOURS = [14.5, 17.5];
const ROPE_FRIENDS = ['coco', 'kai', 'cece', 'joe', 'maki', 'basil'];
const ROPE_TILES = W0.rope;                 // turner a, turner b, and the jumper's tile (plaza)
const ROPE_AIR = 26;                          // frames in the air per jump
const ROPE_TALK_CUKE = ["Jump rope is the best cardio! After running. And more running.", "We've been turning since 2:30! My arms are SO awake!",
    'Jump in whenever you want! Timing is everything! Hydration is also everything!'];
const ROPE_TALK = ["Cuke talked me into turning the rope. My arms are so tired. Jump in so it's worth it!", "Cuke asked me to help turn. I said yes before I saw how long his warm-up was.",
    'Jump in! I promise not to trip you. Cuke might. By accident. Very enthusiastically.'];
function ropeDay(day) {
    if (!S || !S.flags || !S.flags.introDone) return null;
    const today = Clock.dayNum();
    day = day == null ? today : day;
    if (day === today && G.weather && (G.weather === 'rain' || G.weather === 'snow')) return null;
    const r = mulberry(hash32(S.seed + ':rope:' + day));
    if (r() < 0.25) return null;
    return { a: 'cuke', b: rpick(ROPE_FRIENDS, r) };
}
function ropeOverride(id, day) {
    const rd = ropeDay(day);
    if (!rd) return null;
    if (id === rd.a) return [['rope_a', ROPE_HOURS[0], ROPE_HOURS[1]]];
    if (id === rd.b) return [['rope_b', ROPE_HOURS[0], ROPE_HOURS[1]]];
    return null;
}
function ropeSpot(which) {
    const [tx, ty] = ROPE_TILES[which];
    return { area: 'island', x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE + 4, fixed: true, face: which === 'a' ? 'right' : 'left' };
}

const Rope = {
    on: false, ent: null, phase: 0, period: 72, jumps: 0, air: 0, state: 'off', t: 0,
    forced: null,
    turners() {
        // (a neighbor who asked Sarah to jump rope holds it with a friend, 6zw_island_games.js igRope)
        if (this.forced) return this.forced;
        const rd = ropeDay();
        if (!rd) return null;
        const a = NPCs.get(rd.a), b = NPCs.get(rd.b);
        const ok = n => n && !n.sleeping && n.area === 'island' && n.spotKey === (n === a ? 'rope_a' : 'rope_b') && !n.path && !n.talking;
        return ok(a) && ok(b) ? [a, b] : null;
    },
    /* the rope appears when both turners are in place, and goes away when they leave */
    sync() {
        const isl = G.areas && G.areas.island;
        if (!isl || !ROPE_TILES) return;            // (no jump rope in a world without the plaza's spot for it)
        const live = !!this.turners();
        const has = this.ent && isl.ents.includes(this.ent);
        const my = ROPE_TILES.mid[1];
        // nobody walks through a turning rope
        const block = v => { for (let x = ROPE_TILES.a[0] + 1; x < ROPE_TILES.b[0]; x++) isl.block(x, my, v); };
        if (live && !has) { this.ent = isl.add(this.makeEnt()); block(1); }
        else if (!live && has && !this.on) { isl.remove(this.ent); this.ent = null; block(0); }
    },
    makeEnt() {
        const [mx, my] = ROPE_TILES.mid;
        const e = { kind: 'rope', x: (mx + 0.5) * TILE, y: (my + 0.5) * TILE + 4, layer: 1, stand: [mx, my + 1] };
        Object.defineProperty(e, 'sy', { get: () => (this.front() ? e.y + 3 : e.y - 20) });
        e.hit = { x: (ROPE_TILES.a[0] + 1) * TILE, y: (my - 1) * TILE, w: 5 * TILE, h: 2 * TILE + 4 };
        e.interact = () => this.ask();
        e.draw = ctx => this.drawRope(ctx);
        return e;
    },
    front() { return Math.sin(this.phase * Math.PI * 2) > 0; },
    drawRope(ctx) {
        const tw = this.turners() || (this.on ? this.cast : null);
        if (!tw) return;
        const [A, B] = tw;
        const ax = Math.round(A.x) + 7, bx = Math.round(B.x) - 7, feet = Math.round(A.y);
        const hy = feet - 9 - Math.round(A.hop || 0);
        const ph = this.phase * Math.PI * 2;
        const up = (Math.cos(ph) + 1) / 2;                    // 1 = over their heads, 0 = sweeping the ground
        const cy = lerp(feet + 11, feet - 63, up) + Math.sin(ph) * 8;
        for (const [dy, col] of [[1, '#9a2a44'], [0, '#ff6a9a']]) {
            ctx.strokeStyle = col;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(ax, hy + dy);
            ctx.quadraticCurveTo((ax + bx) / 2, cy + dy, bx, hy + dy);
            ctx.stroke();
        }
        ctx.fillStyle = '#8a5a2b';
        ctx.fillRect(ax - 1, hy - 1, 3, 3); ctx.fillRect(bx - 1, hy - 1, 3, 3);
    },
    update() {
        if (G.frame % 30 === 7) this.sync();
        if (!this.ent && !this.on) return;
        if (!this.on) { this.phase += 1 / 80; return; }
        const p = G.player;
        this.t++;
        const prev = this.phase;
        this.phase += 1 / this.period;
        if (this.air) { this.air++; if (this.air > ROPE_AIR) this.air = 0; }
        p.hop = this.air ? Math.sin(Math.PI * this.air / ROPE_AIR) * 11 : 0;
        const crossed = Math.floor(prev - 0.5) !== Math.floor(this.phase - 0.5);
        if (this.judgeT && --this.judgeT === 0) this.hud('#djudge', '');
        if (this.goT && --this.goT === 0) this.hud('#dcount', '');
        if (this.state === 'ready') {
            if (!crossed) return;
            if (--this.count > 0) this.hud('#dcount', String(this.count));
            else { this.state = 'play'; this.hud('#dcount', 'GO!'); this.goT = 40; }
            return;
        }
        if (this.state !== 'play') return;
        if (!crossed) return;
        if (p.hop > 2.5) {
            this.jumps++;
            this.hud('#dscore', `${this.jumps} ${plural(this.jumps, 'jump')}`);
            if (this.jumps % 5 === 0) {
                this.period = Math.max(34, this.period - 5);
                this.say(this.jumps % 10 === 0 ? `${this.jumps}!` : 'FASTER!', '#ffd84a');
                Sfx.play('levelup');
                for (const n of this.cast) { n.emote = rpick(['note', 'sparkle', 'heart']); n.emoteT = 50; }
                for (const n of NPCs.here()) if (!this.cast.includes(n) && Math.hypot(n.x - p.x, n.y - p.y) < 90) { n.emote = 'note'; n.emoteT = 50; }
            }
        } else this.trip();
    },
    hud(sel, text, col) { const e = $(sel); if (e.textContent !== text) e.textContent = text; if (col) e.style.color = col; },
    say(text, col) { this.hud('#djudge', text, col); this.judgeT = 40; },
    jump() {
        if (!this.on || this.air || (this.state !== 'play' && this.state !== 'ready')) return;
        this.air = 1;
        Sfx.play('jump');
    },
    async ask() {
        const tw = this.turners();
        if (!tw || G.busy) return;
        const [A] = tw;
        const first = !S.flags.ropeTried;
        const k = await UI.ask(A.id, first ? "Jump in! We turn, you jump. Hit A right as the rope comes around under your feet. I've been turning since 2:30. Since 4 AM, really."
            : rpick(["Jump in! It's good cardio. Everything is good cardio.", 'Rope is turning! Get in here!', `Your best is ${S.rope.best || 0}. Beat it! Hydrate first!`]),
            ['Jump in!', 'Just watching']);
        if (k !== 0) return;
        S.flags.ropeTried = true;
        await this.start(tw);
    },
    async start(tw) {
        UI.hideDialog();
        const p = G.player;
        this.cast = tw;
        G.busy++;
        this.on = true; this.state = 'ready'; this.t = 0; this.jumps = 0; this.air = 0; this.period = 72; this.count = 3;
        this.phase = Math.floor(this.phase) + 0.55;
        for (const n of tw) n.script = true;                 // the turners stay put until the game's over
        HUD.show(false);
        const [mx, my] = ROPE_TILES.mid;
        // anyone standing in the way steps aside
        for (const n of NPCs.here()) if (!tw.includes(n) && Math.abs(n.y - ((my + 0.5) * TILE + 4)) < 12 && n.x > (ROPE_TILES.a[0] + 0.5) * TILE && n.x < (ROPE_TILES.b[0] + 0.5) * TILE) { n.y += TILE * 2; n.path = null; }
        p.path = null;
        p.glide = { x: (mx + 0.5) * TILE, y: (my + 0.5) * TILE + 4, t: 0 };
        for (let i = 0; i < 30 && p.glide; i++) await waitFrames(1);
        p.x = (mx + 0.5) * TILE; p.y = (my + 0.5) * TILE + 4; p.dir = 'down';
        G.camTarget = [p.x, p.y - 24];
        for (const s of ['#djudge', '#dcombo', '#dcount', '#dlyric']) { $(s).style.left = ''; $(s).style.top = ''; $(s).textContent = ''; }
        $('#dancehud').hidden = false;
        this.hud('#dsong', `Jump rope with ${tw[0].def.name} & ${tw[1].def.name}`);
        this.hud('#dscore', '0 jumps');
        this.hud('#dcount', '3');
        this.hud('#dtip', G.touchUsed ? 'Tap as the rope swings under your feet' : 'Press Space as the rope swings under your feet \u00b7 Esc to stop');
        await new Promise(res => { this._done = res; });
    },
    trip() {
        if (this.state !== 'play') return;
        this.state = 'done';
        Sfx.play('trip');
        const p = G.player;
        p.pose = 'pick'; p.poseT = 50;
        p.emote = 'dots'; p.emoteT = 60;
        this.say(this.jumps ? 'OOPS!' : 'WHOOPS!', '#ffffff');
        setTimeout(() => this.end(), 900);
    },
    quit() { if (!this.on || this.state === 'done') return; this.state = 'done'; this.end(); },
    async end() {
        const p = G.player, n = this.jumps, R0 = S.rope;
        $('#dancehud').hidden = true;
        this.hud('#dtip', '');
        HUD.show(true);
        p.hop = 0;
        G.camTarget = null;
        // step back out of the rope
        const [mx, my] = ROPE_TILES.mid;
        p.glide = { x: (mx + 0.5) * TILE, y: (my + 1.5) * TILE + 4, t: 0 };
        for (let i = 0; i < 30 && p.glide; i++) await waitFrames(1);
        p.dir = 'up';
        this.on = false;
        const [A, B] = this.cast;
        for (const t of this.cast) t.script = false;
        const best = n > (R0.best || 0);
        if (best) R0.best = n;
        S.stats.rope = (S.stats.rope || 0) + 1;
        // (Cuke's own way of putting it when he's turning; anyone else's otherwise)
        const talk = A.id !== 'cuke' ? (n >= 20 ? "That was amazing! My arms gave up before your legs did!" : n >= 10 ? `${n} jumps! You make it look easy!`
            : n >= 3 ? `${n} jumps! Nice! Again sometime?` : 'The rope got you! It happens to everyone. Again sometime?')
            : n >= 20 ? "THAT WAS AMAZING! You're a natural! Were you up at 5 AM practicing? You don't have to answer."
                : n >= 10 ? `${n} jumps! Nice work! I nearly joined in and forgot I was holding the rope!` : n >= 3 ? `${n} jumps! Nice! Warm-up's over. Next time, we go faster.`
                    : "Rope got you! It happens to everyone. It happens to me at 5 AM. Try again!";
        await UI.say(A.id, voiced(A.id, talk), { keep: true });
        if (n >= 3) { const pay = n * 10; addMoney(pay, true, 'Prizes & tips'); await UI.say(B.id, voiced(B.id, rpick([`Here, ${fmtNum(pay)} sand dollars. It's the plaza jump-rope fund. We just made it up.`, `The crowd chipped in ${fmtNum(pay)} sand dollars! The crowd is us.`])), { keep: true }); }
        if (best && n >= 5) await UI.say(null, `New personal best: ${n} jumps!`, { keep: true });
        if (n >= 30 && !R0.trophy) {
            R0.trophy = true;
            receive('trophy_rope', 1);
            Sfx.play('fanfare');
            await UI.say(A.id, A.id === 'cuke' ? "Thirty jumps! That's the plaza record! Here, take the trophy. We made it out of a water bottle. It's real now."
                : "Thirty jumps! That's the plaza record! Cuke left a trophy for whoever got there. It's made of a water bottle. Here!", { keep: true });
        }
        if (R0.day !== Clock.dayNum()) {
            R0.day = Clock.dayNum();
            for (const t of this.cast) { const up = addPts(t.id, 2); if (up) await heartUp(t, up); }
        }
        UI.hideDialog();
        Save.touch();
        G.busy = Math.max(0, G.busy - 1);
        if (this._done) { const d = this._done; this._done = null; d(); }
    },
};

