/* the things that act: Dot, people, critters, things to carry */
const DOT_SPEED = 78;
const DOT_SPEC = { skin: P.skin, hair: '#6b3f26', style: 'beanie', hat: P.red, top: P.teal, bottom: '#3a4a7a', shoes: P.brownD, blush: '#f29a8c' };

kind('dot', {
    w: 10, h: 7, ph: 22, figure: true,
    draw(e, d) {
        const moving = e.moving;
        let f = moving ? (Math.floor(e.anim * 8) % 4 === 1 ? 1 : Math.floor(e.anim * 8) % 4 === 3 ? 2 : 0) : 0;
        /* left standing a while, Dot turns round and looks up: not at anything on the island */
        if (!moving && e.idle > 7 && !World.talking && G.state === 'play') { if (e.dir !== 'down') { e.dir = 'down'; } if ((e.idle % 6) < 2.2) f = 3; }
        d.person('dot', DOT_SPEC, e, f);
    },
    update(e, dt) {
        if (World.cutscene || G.state !== 'play' || Cam.looking || Cam.eye || e.sitting) { e.moving = false; if (e.sitting && World.lapse) { e.dir = 'up'; } else if (e.sitting) e.sitting = false; return; }
        /* if the ground went out from under Dot (a tiny bridge no longer looked at), back to the last safe spot */
        if (boxBlocked(e.map, e, e, true)) {
            const wet = e.map.waterAt(...tileOf(e));
            const spot = nearestFree(e.map, e);
            if (spot) { if (wet) { Fx.splash(ecx(e), ecy(e)); bark(e, 'Splash!', 1.5); } e.x = spot[0]; e.y = spot[1]; }
        }
        let [ax, ay] = Input.axis();
        e.moving = !!(ax || ay);
        if (!e.moving) { e.anim = 0; e.idle = (e.idle || 0) + dt; return; }
        e.idle = 0;
        e.dir = dirOf(ax, ay, e.dir);
        e.anim += dt;
        const sp = DOT_SPEED * dt * (e.slow ? 0.5 : 1);
        let dx = ax * sp, dy = ay * sp;
        /* a pinned view is a wall for Dot (except where the view's edges meet) */
        const wrapping = inZone(e.map, e, 'wrap') && !Cam.split;
        if (Cam.mode === 'pinned' || Cam.split) {
            const r = Cam.homeRect(), b = Cam.dotBox();
            const seamR = Cam.split && Cam.home === 0, seamL = Cam.split && Cam.home === 1;
            if (!wrapping) {
                if (dx < 0 && b.x + dx < r.x && !seamL) { dx = Math.min(0, r.x - b.x); Cam.bump.l = 1; }
                if (dx > 0 && b.x + b.w + dx > r.x + r.w && !seamR) { dx = Math.max(0, r.x + r.w - b.x - b.w); Cam.bump.r = 1; }
                if (dy < 0 && b.y + dy < r.y) { dy = Math.min(0, r.y - b.y); Cam.bump.t = 1; }
                if (dy > 0 && b.y + b.h + dy > r.y + r.h) { dy = Math.max(0, r.y + r.h - b.y - b.h); Cam.bump.b = 1; }
            }
        }
        if ((Cam.bump.l || Cam.bump.r || Cam.bump.t || Cam.bump.b) === 1 && !G.flags.pinHinted) {
            e.bumps = (e.bumps || 0) + dt;
            if (e.bumps > 1.2) { G.flags.pinHinted = true; UI.showHint('The view is pinned in place. C (or tap X) to let it follow Dot again.', 8); }
        }
        const [hx, hy] = moveEnt(e, dx, dy);
        const hit = hx || hy;
        if (hit && hit.kind && KINDS[hit.kind].push) KINDS[hit.kind].push(hit, e.dir, e);
        if (e.carrying) carryPos(e);
        /* stepping on things (doors, plates) */
        World.step(e);
    },
});
function carryPos(d) { const c = d.carrying; c.x = ecx(d) - c.w / 2; c.y = d.y + 0.5; c.z = 17; c.map = d.map; }

/* people: a paper doll, a name, things to say, a day (sched) and a way of walking (path) */
kind('npc', {
    w: 10, h: 7, ph: 22, solid: true, figure: true,
    init(e) { e.st.i = 0; e.st.wait = 0; },
    draw(e, d) {
        const f = e.moving ? (Math.floor(e.anim * 6) % 4 === 1 ? 1 : Math.floor(e.anim * 6) % 4 === 3 ? 2 : 0) : 0;
        d.person(e.name, e.spec, e, f);
        if (e.bubble) d.bubble(e, e.bubble);
    },
    update(e, dt) {
        e.moving = false;
        if (World.talking === e) return;
        if (e.brain) e.brain(e, dt);
        else if (e.path) walkPath(e, dt);
        if (e.moving) e.anim += dt; else e.anim = 0;
    },
    act(e) { faceTo(e, World.dot); talkTo(e); },
});
function faceTo(e, o) { e.dir = dirOf(ecx(o) - ecx(e), ecy(o) - ecy(e), e.dir); }
/* walk a loop of tile waypoints [[tx,ty,wait],...] at e.speed */
function walkPath(e, dt) {
    const p = e.path; if (!p || !p.length) return;
    if (e.st.wait > 0) { e.st.wait -= dt; return; }
    const [tx, ty] = p[e.st.i % p.length];
    if (walkTo(e, tx * TILE + (TILE - e.w) / 2, ty * TILE + TILE - e.h - 1, dt)) {
        e.st.wait = p[e.st.i % p.length][2] || 0;
        e.st.i = (e.st.i + 1) % p.length;
    }
}
/* step toward a point; true when there */
function walkTo(e, x, y, dt, speed) {
    const sp = (speed || e.speed || 40) * dt;
    const dx = x - e.x, dy = y - e.y, d = Math.hypot(dx, dy);
    if (d <= sp) { const [hx, hy] = moveEnt(e, dx, dy); return !hx && !hy || d < 1; }
    const mx = dx / d * sp, my = dy / d * sp;
    e.dir = dirOf(mx, my, e.dir); e.moving = true;
    const [hx, hy] = moveEnt(e, mx, my);
    if (hx && hy) { e.blockedT = (e.blockedT || 0) + dt; } else e.blockedT = 0;
    return false;
}

/* things that can be carried, put down and thrown */
function carriable(name, o) {
    kind(name, Object.assign({
        w: 8, h: 6, ph: 9, carry: true, solid: false,
        draw(e, d) { d.thing(e, o.pic || name); },
        update(e, dt) { flyStep(e, dt); },
    }, o));
}
function flyStep(e, dt) {
    if (e.held) return;
    if (e.z > 0 || e.vz) {
        e.vz -= 420 * dt; e.z += e.vz * dt;
        const [hx, hy] = moveEnt(e, e.vx * dt, e.vy * dt);
        if (hx) e.vx = -e.vx * 0.3; if (hy) e.vy = -e.vy * 0.3;
        if (e.z <= 0) {
            e.z = 0;
            if (Math.abs(e.vz) > 60) { e.vz = -e.vz * 0.35; e.vx *= 0.6; e.vy *= 0.6; Sfx.play('thud'); }
            else { e.vz = 0; e.vx = 0; e.vy = 0; landed(e); }
        }
    } else if (e.vx || e.vy) {
        moveEnt(e, e.vx * dt, e.vy * dt); e.vx *= 0.85; e.vy *= 0.85;
        if (Math.abs(e.vx) + Math.abs(e.vy) < 2) { e.vx = 0; e.vy = 0; }
    }
}
function landed(e) {
    const [tx, ty] = tileOf(e);
    if (e.map.waterAt(tx, ty) && !KINDS[e.kind].floats) { Fx.splash(ecx(e), ecy(e)); e.removed = true; e.map.remove(e); if (e.wild) { e.removed = false; e.gone = true; e.map.ents.push(e); } }
    const K = KINDS[e.kind]; if (K.onLand) K.onLand(e);
}
carriable('egg', { wild: true, pocket: 'egg', ph: 8 });
carriable('apple', { wild: true, pocket: 'apple', ph: 8 });
carriable('ball', { w: 7, h: 6, ph: 8, noteStill: true });
carriable('rock', { w: 12, h: 8, ph: 11, wild: true, heavy: true });
carriable('flowerpick', { pic: 'flower', wild: true, pocket: 'flower', ph: 9 });

/* critters */
kind('chicken', {
    w: 9, h: 6, ph: 12, wild: true, figure: true,
    init(e) { e.st.t = 0; e.st.tx = e.x; e.st.ty = e.y; },
    draw(e, d) { d.thing(e, 'chicken', e.moving && Math.floor(e.t * 8) % 2, e.dir === 'left'); },
    update(e, dt) {
        e.moving = false; e.st.t -= dt;
        if (e.st.t <= 0) { e.st.t = 1 + hash2(e.x | 0, e.t * 10 | 0, 2) * 2; const a = hash2(e.t * 7 | 0, e.y | 0, 3) * 6.28; e.st.tx = e.ox + Math.cos(a) * 20; e.st.ty = e.oy + Math.sin(a) * 12; }
        walkTo(e, e.st.tx, e.st.ty, dt, 24);
    },
});
kind('sheep', {
    w: 14, h: 8, ph: 14, bound: true, figure: true, solid: true,
    init(e) { e.st.t = 0; },
    draw(e, d) { d.thing(e, 'sheep', (e.moving || e.pushed) && Math.floor(e.t * 6) % 2, e.dir === 'left'); if (e.pushed > 0) d.sweat(e); },
    update(e, dt) {
        e.moving = false; e.pushed = Math.max(0, (e.pushed || 0) - dt);
        if (e.penned) return;
        e.st.t -= dt;
        if (e.st.t <= 0) { e.st.t = 2 + hash2(e.x | 0, e.t * 10 | 0, 5) * 3; e.st.dx = (hash2(e.t * 3 | 0, e.y | 0, 6) - 0.5) * 2; e.st.dy = (hash2(e.y | 0, e.t * 3 | 0, 7) - 0.5); }
        if (e.st.t > 1.2) { const [hx] = moveEnt(e, e.st.dx * 10 * dt, e.st.dy * 10 * dt); e.moving = true; if (e.st.dx) e.dir = e.st.dx < 0 ? 'left' : 'right'; if (hx) e.st.dx *= -1; }
    },
});
kind('ghost', {
    w: 10, h: 6, ph: 16, wild: true, figure: true, solid: true,
    draw(e, d) { d.thing(e, 'ghost', Math.floor(e.t * 3) % 2, false, { bob: Math.sin(e.t * 3) * 1.5, alpha: 0.9 }); },
    update(e, dt) { if (e.path) walkPath(e, dt); },
});
kind('ant', {
    w: 4, h: 3, ph: 3, tiny: true, wild: true,
    draw(e, d) { d.thing(e, 'ant', Math.floor(e.t * 10) % 2, e.vx < 0); },
    update(e, dt) { e.x += e.vx * dt; if (Math.abs(e.x - e.ox) > 30) e.vx = -e.vx; },
    init(e) { e.vx = 8; },
});
kind('squirrel', {
    w: 8, h: 6, ph: 10, wild: true,
    draw(e, d) { d.thing(e, 'squirrel', Math.floor(e.t * 10) % 2, e.vx < 0); },
    init(e) { e.vx = 50; },
    update(e, dt) { const [hx] = moveEnt(e, e.vx * dt, 0); if (hx) e.vx = -e.vx; },
});
kind('moth', {
    w: 6, h: 4, ph: 6, bound: true,
    draw(e, d) { d.thing(e, 'moth', Math.floor(e.t * 12) % 2, false, { bob: Math.sin(e.t * 5) * 2 - 6 }); },
    update(e, dt) { e.overWater = true; e.overTall = true; },
});
/* a pushable boulder (one tile) */
kind('boulder', {
    w: 14, h: 12, ph: 16, solid: true,
    draw(e, d) { d.thing(e, 'boulder'); },
    push(e, dir, by) {
        e.st.push = (e.st.push || 0) + STEP;
        if (e.st.push < 0.25) return;
        e.st.push = 0;
        const [dx, dy] = DIRS[dir];
        const nb = { x: e.x + dx * TILE, y: e.y + dy * TILE, w: e.w, h: e.h };
        if (!boxBlocked(e.map, nb, e)) { e.slide = [dx * TILE, dy * TILE]; Sfx.play('push'); }
    },
    update(e, dt) {
        if (e.slide) { const sp = 64 * dt; const mx = clamp(e.slide[0], -sp, sp), my = clamp(e.slide[1], -sp, sp); e.x += mx; e.y += my; e.slide[0] -= mx; e.slide[1] -= my; if (!e.slide[0] && !e.slide[1]) e.slide = null; }
    },
});

/* the nearest place a thing's box fits on the ground (searching outward a few pixels at a time) */
function nearestFree(map, e) {
    for (let r = 2; r <= 64; r += 2) {
        for (let a = 0; a < 16; a++) {
            const x = e.x + Math.round(Math.cos(a / 16 * Math.PI * 2) * r), y = e.y + Math.round(Math.sin(a / 16 * Math.PI * 2) * r);
            if (!boxBlocked(map, { x, y, w: e.w, h: e.h }, e, true)) return [x, y];
        }
    }
    return null;
}
