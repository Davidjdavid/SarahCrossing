/* people's days: where each wants to be at this hour, and finding the way there.
   They only walk while they're seen (an update), so a day nobody watches never happens. */
function findPath(map, sx, sy, tx, ty, self, allSolid) {
    if (sx === tx && sy === ty) return [];
    const W = map.w, key = (x, y) => y * W + x;
    const prev = new Map(); prev.set(key(sx, sy), -1);
    const q = [[sx, sy]]; let n = 0;
    const fixedSolid = new Set();
    for (const e of map.ents) if (e.solid && (e.fixed || allSolid && e !== self) && exists(e)) for (let yy = Math.floor(e.y / TILE); yy <= Math.floor((e.y + e.h - 1) / TILE); yy++) for (let xx = Math.floor(e.x / TILE); xx <= Math.floor((e.x + e.w - 1) / TILE); xx++) fixedSolid.add(yy * map.w + xx);
    const free = (x, y) => (x === tx && y === ty) || (!map.solidAt(x, y) || (map.waterAt(x, y) && deckAt(map, x, y))) && !fixedSolid.has(y * map.w + x);
    while (q.length && n < 12000) {
        const [x, y] = q.shift(); n++;
        if (x === tx && y === ty) break;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx, ny = y + dy, k = key(nx, ny);
            if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h || prev.has(k) || !free(nx, ny)) continue;
            prev.set(k, key(x, y)); q.push([nx, ny]);
        }
    }
    if (!prev.has(key(tx, ty))) return null;
    const out = []; let k = key(tx, ty);
    while (k !== key(sx, sy)) { out.unshift([k % W, Math.floor(k / W)]); k = prev.get(k); }
    return out;
}
/* walk to a tile by a path (recomputed when the goal changes); true when there */
function goTo(e, tx, ty, dt, speed) {
    const g = tx + ',' + ty;
    if (e.goal !== g) { e.goal = g; const [sx, sy] = tileOf(e); e.route = findPath(e.map, sx, sy, tx, ty, e) || [[tx, ty]]; }
    const r = e.route;
    if (!r.length) return walkTo(e, tx * TILE + (TILE - e.w) / 2, ty * TILE + TILE - e.h - 1, dt, speed);
    const [nx, ny] = r[0];
    if (walkTo(e, nx * TILE + (TILE - e.w) / 2, ny * TILE + TILE - e.h - 1, dt, speed)) r.shift();
    if (e.blockedT > 1.5) { e.blockedT = 0; e.goal = null; }   /* stuck behind someone: think again */
    return false;
}
/* a day: e.day = [[from, to, {x, y, dir, home, path, say}], ...] by the island's hour */
function dayPlan(e) {
    const h = World.hour % 24;
    for (const p of e.day || []) {
        const [a, b, plan] = p;
        if (a <= b ? h >= a && h < b : h >= a || h < b) return typeof plan === 'function' ? plan(e) : plan;
    }
    return null;
}
function dayBrain(e, dt) {
    const plan = (e.override && e.override(e)) || dayPlan(e);
    if (!plan) return;
    if (plan.path) { e.path = plan.path; walkPath(e, dt); return; }
    const [tx, ty] = tileOf(e);
    if (plan.x != null && (tx !== plan.x || ty !== plan.y)) { goTo(e, plan.x, plan.y, dt, plan.speed); return; }
    if (plan.dir && !e.moving) e.dir = plan.dir;
    if (plan.home && !e.hidden) { e.hidden = true; Fx.puff(ecx(e), e.y, 'door'); }
}
kind('person', Object.assign({}, KINDS.npc, {
    present(e) { return !e.hidden && !(e.when && !e.when(e)); },
    update(e, dt) {
        e.moving = false;
        if (World.talking === e || e.hold) { if (e.anim) e.anim = 0; return; }
        if (e.hidden) return;
        if (e.brain) e.brain(e, dt); else dayBrain(e, dt);
        if (e.moving) e.anim += dt; else e.anim = 0;
        if (e.bubbleT) { e.bubbleT -= dt; if (e.bubbleT <= 0) e.bubble = null; }
    },
}));
/* someone comes back out of their house when the morning (or their hour) comes and their door is seen */
function wakeCheck(e) {
    if (!e.hidden) return;
    const plan = dayPlan(e);
    if (plan && !plan.home && e.door && Laws.seenBox({ x: e.door[0] * TILE, y: e.door[1] * TILE, w: TILE, h: TILE })) {
        e.hidden = false; e.x = e.door[0] * TILE + 3; e.y = e.door[1] * TILE + TILE + 2; e.goal = null;
    }
}
Story.on('tick', () => { if (World.map) for (const e of World.map.ents) if (e.hidden && e.door) wakeCheck(e); });
function bark(e, text, secs) { e.bubble = text; e.bubbleT = secs || 2.5; }
function person(map, name, tx, ty, o) {
    NAMES[name] = o.display || name[0].toUpperCase() + name.slice(1);
    if (o.voice) VOICES[name] = o.voice;
    return map.addAt('person', tx, ty, Object.assign({ name, speed: 38 }, o));
}
