/* the game's state and how a turn plays out. DOM-free.
   G: the whole save. EV: what happened this turn (the renderer and sound read it). */
let G = null;
let EV = [];
const ROOMS = {};   /* filled by the room files */
const TALK = {};    /* npc id -> function(e) returning lines */
const HOOK = {};    /* named hooks the room files provide */
const SELF = { id: '@', k: 'player' };
const ADDR = { 0: 'lh0', 1: 'home', 2: 'post', 3: 'shop', 4: 'tock', 5: 'five', 6: 'fisher', 7: 'seven', 8: 'millhouse', 9: 'newhouse', 11: 'cell11', 12: 'cell12', 13: 'cell13', 14: 'cell14', 15: 'armory' };
const STAMPS = ['hatch', 'hollow', 'mirror', 'hour', 'nowhere', 'house', 'cellar', 'shore', 'walk'];

function newGame() {
    G = {
        v: 1, room: 'home',
        p: { x: 4, y: 3, dir: 'd', s: { hp: [3], str: [1], wt: [2], age: [0, 8], gold: [1, 2] } },
        pocket: [1], items: {}, hour: [0, 8], road: { p: 0, e: 99 }, count: [0, 4, 2, 7], lamp: [0],
        flags: {}, stamps: {}, rooms: {}, roadDrops: {}, follow: null, dead: null,
        stats: { steps: 0, swaps: 0, turns: 0, ms: 0 },
    };
    for (const id in ROOMS) G.rooms[id] = { ents: clone(ROOMS[id].ents || []) };
    UNDO.length = 0;
    entrySnap = snapCore(true);
    return G;
}

/* ---------- looking things up ---------- */
const def = () => ROOMS[G.room];
const rs = (id = G.room) => G.rooms[id];
function tileAt(x, y, id = G.room) {
    if (x < 0 || y < 0 || x >= MW || y >= MH) return ' ';
    const R = ROOMS[id];
    if (R.tile && G) { const o = R.tile(x, y); if (o) return o; }
    const row = R.map[y];
    return row[x] || ' ';
}
const T = (x, y, id) => tileOf(tileAt(x, y, id));
const covers = (e, x, y) => x >= e.x && y >= e.y && x < e.x + (e.w || 1) && y < e.y + (e.h || 1);
function entsAt(x, y, id = G.room) { return rs(id).ents.filter(e => !e.gone && covers(e, x, y) && present(e)); }
const entById = (id, room = G.room) => rs(room).ents.find(e => e.id === id);
function findEnt(id) { for (const r in G.rooms) { const e = G.rooms[r].ents.find(x => x.id === id); if (e) return e; } return null; }

/* ---------- numbers ---------- */
function slotGet(e, key) {
    if (e === SELF) {
        if (key === 'hour') return G.items.watch ? G.hour : null;
        return G.p.s[key];
    }
    if (e.k === 'clock' && key === 'hour') return G.hour;
    if (e.k === 'drum' && key === 'cnt') return [G.count[3 - e.i]];
    if (e.k === 'lamp' && key === 'lamp') return G.lamp;
    if (e.k === 'milestone') return roadSlot(e, key);
    if (e.k === 'egg' && e.id === 'chick' && e === G.follow) return G.follow.s[key];
    return e.s ? e.s[key] : null;
}
function slotSet(e, key, ds) {
    if (e === SELF) { if (key === 'hour') G.hour = ds; else G.p.s[key] = ds; return; }
    if (e.k === 'clock' && key === 'hour') { G.hour = ds; return; }
    if (e.k === 'drum' && key === 'cnt') { G.count[3 - e.i] = ds[0]; return; }
    if (e.k === 'lamp') { G.lamp = ds; return; }
    if (e.k === 'milestone') { roadSet(e, key, ds); return; }
    e.s[key] = ds;
}
function slotKeys(e) {
    if (e === SELF) { const k = ['hp', 'str', 'wt']; if (G.items.specs) k.push('age'); if (G.items.watch) k.push('hour'); k.push('gold'); return k; }
    if (e.k === 'clock') return ['hour'];
    if (e.k === 'drum') return ['cnt'];
    if (e.k === 'lamp') return ['lamp'];
    if (e.k === 'milestone') return e.side === 'both' ? ['w', 'e'] : e.side === 'east' ? ['e'] : ['w'];
    return Object.keys(e.s || {});
}
const visibleSlot = (e, key) => !(e.hide && e.hide.includes(key)) || !!G.items.specs;
const boltedSlot = (e, key) => !!(e.bolt && e.bolt.includes(key));
function digitReach(e, key, i) { return !(e.far && e.far[key] && e.far[key][i]); }
const pv = k => dval(G.p.s[k]); /* the player's own numbers */

/* ---------- the road: the milestones are its length ---------- */
function roadSlot(e, key) {
    const R = G.road;
    if (e.side !== 'both') return vdig(R.p + R.e, 2);   /* at either end: the whole way */
    return vdig(key === 'w' ? R.p : R.e, 2);
}
function roadSet(e, key, ds) {
    const v = dval(ds), R = G.road;
    if (e.side === 'east') { R.p = 0; R.e = v; return; }
    if (e.side === 'west') { R.p = v; R.e = 0; return; }
    if (key === 'w') R.p = v; else R.e = v;
}

/* ---------- weights, water, platforms ---------- */
const OBJ = { crate: 1, boulder: 1, anchor: 1, parcel: 1 };
function weightOf(e) { const d = slotGet(e, 'wt'); return d ? dval(d) : 0; }
function weightAt(x, y) {
    let w = 0;
    if (G.p.x === x && G.p.y === y) w += pv('wt');
    for (const e of entsAt(x, y)) if ((OBJ[e.k] || e.k === 'golem' || e.k === 'cat') && !e.wet) w += weightOf(e);
    return w;
}
function bridgeAt(x, y) { return entsAt(x, y).find(e => e.k === 'bridge'); }
function platformAt(x, y) {
    const b = bridgeAt(x, y);
    if (b) { const st = bridgeStage(sv(b, 'age')); if (st === 'new' || st === 'sound') return b; }
    return entsAt(x, y).find(e => OBJ[e.k] && e.wet && weightOf(e) === 0) || null;
}
const isWater = (x, y) => !!T(x, y).water;

/* can the player stand at x,y (not counting whatever's solid there) */
function groundOk(x, y, forPlayer = true) {
    const t = T(x, y);
    if (t.solid) return false;
    if (t.pit) return false;
    if (t.water) return !!platformAt(x, y) || (forPlayer && pv('wt') === 0);
    const c = entsAt(x, y).find(e => e.k === 'crack' && e.broken);
    if (c) return false;
    return true;
}
function blockedByEnt(x, y) { return entsAt(x, y).some(e => solidFor(e)); }

/* ---------- undo ---------- */
const UNDO = [];
let entrySnap = null, pendingSnap = null;
function snapCore(withRooms) {
    const { rooms, ...core } = G;
    const s = { core: JSON.stringify(core), rooms: {} };
    if (withRooms) s.rooms[G.room] = JSON.stringify(G.rooms[G.room]);
    return s;
}
function beginSnap() { pendingSnap = snapCore(true); pendingSnap.entry = entrySnap; }
function touchRoom(id) {
    if (pendingSnap && !(id in pendingSnap.rooms)) pendingSnap.rooms[id] = JSON.stringify(G.rooms[id]);
    if (entrySnap && !(id in entrySnap.rooms)) entrySnap.rooms[id] = JSON.stringify(G.rooms[id]);
}
function commitSnap() { if (pendingSnap) { UNDO.push(pendingSnap); if (UNDO.length > 3000) UNDO.shift(); } pendingSnap = null; }
function restoreSnap(s) {
    const core = JSON.parse(s.core);
    const rooms = G.rooms;
    for (const id in s.rooms) rooms[id] = JSON.parse(s.rooms[id]);
    G = Object.assign(core, { rooms });
}
function undo() {
    const s = UNDO.pop();
    if (!s) return false;
    restoreSnap(s);
    if (s.entry) entrySnap = s.entry;
    EV.push({ t: 'undo' });
    return true;
}
function restartRoom() {
    if (!entrySnap) return false;
    const back = entrySnap;
    beginSnap(); for (const id in back.rooms) touchRoom(id); commitSnap();
    restoreSnap(back);
    entrySnap = back;
    EV.push({ t: 'restart' });
    return true;
}

/* ---------- a turn ---------- */
/* a: {t:'move', d} | {t:'wait'} | {t:'swap', tg, pi} ; returns true if anything happened */
function act(a) {
    if (G.dead) return false;
    if (G.flags.ending) return false;
    beginSnap();
    let r = false;
    if (a.t === 'move') r = tryMove(a.d);
    else if (a.t === 'wait') r = 'turn';
    else if (a.t === 'swap') r = (reachable(a.tg) && doSwap(a.tg, a.pi)) ? 'turn' : false;
    if (!r) { pendingSnap = null; return false; }
    commitSnap();
    if (r === 'turn') worldTick();
    else if (r === 'talk') { /* talking takes no time */ }
    G.stats.turns++;
    return true;
}

function worldTick() {
    physics();
    if (!G.dead) tickCounters();
    if (!G.dead) tickMonsters();
    if (!G.dead) physics();
    if (HOOK.afterTurn) HOOK.afterTurn();
}

/* ---------- moving ---------- */
function tryMove(d) {
    const [dx, dy] = DIR[d];
    const P = G.p;
    P.dir = d;
    const nx = P.x + dx, ny = P.y + dy;
    if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) return tryExit(d);
    const t = T(nx, ny);
    if (t.ledge && d === 'u') { EV.push({ t: 'bump' }); return 'face'; }
    /* talking across a counter */
    if (tileAt(nx, ny) === 'C') {
        const shelf = entsAt(nx, ny).find(e => e.k === 'shelf');
        if (shelf) return KIND.shelf.bump(shelf) || 'face';
        const npc = entsAt(nx, ny - 1).find(e => e.k === 'npc');
        if (npc) return talkTo(npc) || 'face';
    }
    const here = entsAt(nx, ny);
    const solid = here.find(e => solidFor(e));
    if (!solid && t.solid) { EV.push({ t: 'bump' }); return 'face'; }
    if (solid) {
        const K = KIND[solid.k];
        if (pushable(solid)) {
            const pr = tryPush(solid, d);
            if (pr === 'pushed') return stepTo(nx, ny, d, true);
            if (pr === 'delivered') return 'turn';
            if (MONSTER[solid.k] && K.bump) return K.bump(solid, nx, ny) || 'face';
            return 'face';
        }
        const r = K.bump ? K.bump(solid, nx, ny) : false;
        if (!r) EV.push({ t: 'bump', e: solid.id });
        return r || 'face';
    }
    if (!groundOk(nx, ny)) {
        const hole = entsAt(nx, ny).find(e => e.k === 'crack' && e.broken);
        if (hole && hole.below) { stepTo(nx, ny, d, false); fallThrough(hole); return 'room'; }
        EV.push({ t: isWater(nx, ny) ? 'splashno' : 'bump' });
        return 'face';
    }
    return stepTo(nx, ny, d, false);
}
function pushable(e) {
    const K = KIND[e.k];
    if (e.wet) return false;
    if (OBJ[e.k]) return true;
    if (MONSTER[e.k]) return false;
    return !!K.push;
}
function stepTo(x, y, d, pushed) {
    const P = G.p;
    const ox = P.x, oy = P.y;
    P.x = x; P.y = y;
    G.stats.steps++;
    EV.push({ t: 'step', x, y, d, pushed, heavy: pv('wt') >= 7 });
    moveFollower(ox, oy);
    if (T(x, y).mat) { exitRoom(); return 'room'; }
    const st = entsAt(x, y).find(e => e.k === 'stamp');
    if (st) { st.gone = true; stamp(st.stamp); }
    if (HOOK.onStep) HOOK.onStep(x, y);
    return 'turn';
}

/* push a row of things. 'pushed' if it moved, 'delivered' if a parcel went through a door */
function tryPush(first, d) {
    const [dx, dy] = DIR[d];
    const chain = [first];
    let x = first.x + dx, y = first.y + dy;
    for (;;) {
        if (x < 0 || y < 0 || x >= MW || y >= MH) break;
        const next = entsAt(x, y).find(e => (OBJ[e.k] && (!e.wet || weightOf(e) === 0)) || (solidFor(e) && pushable(e)));
        if (!next || !(OBJ[next.k] || pushable(next))) break;
        chain.push(next); x += dx; y += dy;
    }
    let total = 0;
    for (const e of chain) total += weightOf(e);
    if (total > pv('str')) { EV.push({ t: 'heavy', ids: chain.map(e => e.id), w: total, s: pv('str') }); return false; }
    if (x < 0 || y < 0 || x >= MW || y >= MH) { EV.push({ t: 'bump' }); return false; }
    const last = chain[chain.length - 1];
    /* a parcel into a door */
    const door = doorAt(x, y);
    if (door && last.k === 'parcel') return deliver(last, door, chain, d) ? 'delivered' : false;
    const t = T(x, y);
    if (t.solid || t.mat || (t.ledge && d === 'u')) { EV.push({ t: 'bump' }); return false; }
    if (entsAt(x, y).some(e => solidFor(e) && !chain.includes(e))) { EV.push({ t: 'bump' }); return false; }
    if (G.follow && G.follow.x === x && G.follow.y === y) { /* the chick hops out of the way */ G.follow.x = G.p.x; G.follow.y = G.p.y; }
    for (let i = chain.length - 1; i >= 0; i--) {
        const e = chain[i];
        e.x += dx; e.y += dy;
        EV.push({ t: 'pushmove', id: e.id, x: e.x, y: e.y });
    }
    /* what was pushed onto a pit or a hole falls */
    const lt = T(last.x, last.y);
    const hole = entsAt(last.x, last.y).find(e => e.k === 'crack' && e.broken);
    if (lt.pit || hole) dropThing(last, hole);
    EV.push({ t: 'push', w: total });
    return 'pushed';
}
function doorAt(x, y) {
    for (const e of entsAt(x, y)) {
        if (e.k === 'door') return e;
        if ((e.k === 'house' || e.k === 'lot') && standing(e) && x === e.x + e.door[0] && y === e.y + e.door[1]) return e;
    }
    return null;
}
function dropThing(e, hole) {
    if (hole && hole.below) {
        touchRoom(hole.below);
        moveEntTo(e, hole.below, e.x, e.y);
        EV.push({ t: 'fall', id: e.id });
    } else {
        e.gone = true;
        EV.push({ t: 'fall', id: e.id });
    }
}
function moveEntTo(e, roomId, x, y) {
    const from = rs();
    touchRoom(roomId);
    from.ents = from.ents.filter(z => z !== e);
    e.x = x; e.y = y; e.wet = false;
    rs(roomId).ents.push(e);
}

/* ---------- leaving a screen ---------- */
function tryExit(d) {
    const ex = (def().exits || {})[d];
    if (!ex) { EV.push({ t: 'bump' }); return 'face'; }
    let to = ex, x = G.p.x, y = G.p.y;
    if (d === 'r') x = 0; if (d === 'l') x = MW - 1; if (d === 'u') y = MH - 1; if (d === 'd') y = 0;
    const R = G.road;
    if (ex === '@road') {
        if (G.room === 'eastlane') { R.e = R.p + R.e; R.p = 1; R.e -= 1; to = R.e <= 0 ? 'cliff' : 'road'; }
        else if (G.room === 'cliff') { R.p = R.p + R.e; R.e = 1; R.p -= 1; to = R.p <= 0 ? 'eastlane' : 'road'; }
        else if (d === 'r') { R.p += 1; R.e -= 1; to = R.e <= 0 ? 'cliff' : 'road'; }
        else { R.p -= 1; R.e += 1; to = R.p <= 0 ? 'eastlane' : 'road'; }
        if (to === 'cliff') { R.p = R.p + Math.max(0, R.e); R.e = 0; }
        if (to === 'eastlane') { R.e = R.e + Math.max(0, R.p); R.p = 0; }
    }
    const ok = arriveOk(to, x, y);
    if (!ok) {
        EV.push({ t: 'bump' });
        if (ex === '@road') restoreRoad();
        return 'face';
    }
    goRoom(to, x, y, 'slide', d);
    return 'room';
}
let roadBackup = null;
function restoreRoad() { if (pendingSnap) { const core = JSON.parse(pendingSnap.core); G.road = core.road; } }
function arriveOk(id, x, y) {
    const t = T(x, y, id);
    if (t.solid || t.pit) return false;
    const es = G.rooms[id].ents.filter(e => !e.gone && covers(e, x, y) && presentIn(e));
    if (es.some(e => KIND[e.k].solid(e))) return false;
    if (t.water) return pv('wt') === 0 || es.some(e => e.k === 'bridge' && ['new', 'sound'].includes(bridgeStage(sv(e, 'age'))));
    return true;
}
const presentIn = e => present(e);

function goRoom(id, x, y, how, d) {
    const from = G.room;
    touchRoom(id);
    if (from === 'road') saveRoadDrops();
    G.room = id;
    G.p.x = x; G.p.y = y;
    if (d) G.p.dir = d;
    if (id === 'road') loadRoadDrops();
    if (G.follow) { G.follow.x = x; G.follow.y = y; }
    EV.push({ t: 'room', how, d, from, to: id });
    const R = ROOMS[id];
    if (R.onEnter) R.onEnter();
    if (HOOK.onRoom) HOOK.onRoom(id, from);
    entrySnap = snapCore(true);
    autosave();
}
function saveRoadDrops() {
    touchRoom('road');
    const loose = rs('road').ents.filter(e => e.k === 'loose' && !e.gone);
    if (loose.length) G.roadDrops[G.road.p] = loose.map(e => ({ x: e.x, y: e.y, v: e.s.v[0] }));
    else delete G.roadDrops[G.road.p];
    rs('road').ents = rs('road').ents.filter(e => e.k !== 'loose');
}
function loadRoadDrops() {
    touchRoom('road');
    rs('road').ents = rs('road').ents.filter(e => e.k !== 'loose');
    for (const l of G.roadDrops[G.road.p] || []) rs('road').ents.push(newLoose(l.x, l.y, l.v));
}

/* doors: the number is the address */
function addrRoom(a) {
    if (a === Infinity) return null;
    const id = ADDR[a];
    if (!id || !ROOMS[id]) return null;
    const h = ROOMS[id].host;
    if (h) { const e = entById(h.id, h.room); if (!e || lotStage(sv(e, 'age')) !== 'house') return null; }
    return id;
}
function enterAddr(a, ret) {
    const id = addrRoom(a) || 'nowhere';
    enterRoomAt(id, ret);
    return 'room';
}
function enterRoomAt(id, ret) {
    const R = ROOMS[id];
    /* inside one building, a door doesn't change the way out */
    touchRoom(id);
    if (!(R.bld && ROOMS[G.room].bld === R.bld && G.rooms[id].ret)) G.rooms[id].ret = ret;
    const [x, y] = freeNear(id, R.entry[0], R.entry[1]);
    EV.push({ t: 'door' });
    goRoom(id, x, y, 'fade', 'u');
}
function houseBump(e, x, y) {
    if (standing(e) && x === e.x + e.door[0] && y === e.y + e.door[1]) return enterAddr(dval(e.s.addr), { room: G.room, x, y: y + 1 });
    EV.push({ t: 'bump' });
    return 'face';
}
function lotBump(e, x, y) {
    if (lotStage(sv(e, 'age')) === 'house') return houseBump(e, x, y);
    EV.push({ t: 'bump' }); return 'face';
}
function doorBump(e) {
    if (e.locked) return say(e.locked);
    const fy = e.face === 'u' ? e.y - 1 : e.y + 1;
    if (e.to) { enterRoomAt(e.to, { room: G.room, x: e.x, y: fy }); return 'room'; }
    return enterAddr(dval(e.s.addr), { room: G.room, x: e.x, y: fy });
}
function exitRoom() {
    const ret = rs().ret || def().ret;
    let { room, x, y } = ret;
    [x, y] = freeNear(room, x, y);
    EV.push({ t: 'door' });
    goRoom(room, x, y, 'fade', 'd');
}
function freeNear(room, x, y) {
    const ok = (a, b) => a >= 0 && b >= 0 && a < MW && b < MH && arriveOk(room, a, b);
    if (ok(x, y)) return [x, y];
    for (let r = 1; r < 6; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (ok(x + dx, y + dy)) return [x + dx, y + dy];
    return [x, y];
}
function takeStairs(e) { EV.push({ t: 'stairs' }); const [x, y] = freeNear(e.to, e.tx, e.ty); goRoom(e.to, x, y, 'fade', e.dir || 'd'); return 'room'; }
function enterHollow(e) { enterRoomAt('hollow', { room: G.room, x: e.x, y: e.y + (e.h || 1) }); return 'room'; }
function fallThrough(hole) {
    EV.push({ t: 'fallme' });
    const [x, y] = freeNear(hole.below, G.p.x, G.p.y);
    goRoom(hole.below, x, y, 'fall', 'd');
}

/* ---------- parcels ---------- */
function deliver(parcel, door, chain, d) {
    const addr = dval(slotGet(door, 'addr') || [door.toAddr]);
    const to = dval(parcel.s.to);
    const room = addrRoom(addr);
    if (addr !== to || !room || !ROOMS[room].takes) { EV.push({ t: 'nope', id: parcel.id }); return false; }
    /* everything behind it moves up one */
    const [dx, dy] = DIR[d];
    for (let i = chain.length - 2; i >= 0; i--) { chain[i].x += dx; chain[i].y += dy; }
    parcel.gone = true;
    G.flags['got_' + parcel.id] = room;
    EV.push({ t: 'deliver', id: parcel.id, room });
    stepTo(G.p.x + dx, G.p.y + dy, d, true);
    if (HOOK.delivered) HOOK.delivered(parcel, room);
    return true;
}

/* ---------- physics: water, plates, gates, cracks ---------- */
function physics() {
    const R = rs();
    for (const e of R.ents) {
        if (e.gone || !OBJ[e.k]) continue;
        const wasWet = e.wet, wasFloat = e.wet && e.float;
        const br = bridgeAt(e.x, e.y), holds = br && ['new', 'sound'].includes(bridgeStage(sv(br, 'age')));
        if (isWater(e.x, e.y) && !holds) {
            e.wet = true;
            e.float = weightOf(e) === 0;
            if (!wasWet) EV.push({ t: e.float ? 'float' : 'sink', id: e.id });
            else if (wasFloat && !e.float) EV.push({ t: 'sink', id: e.id });
            else if (!wasFloat && e.float) EV.push({ t: 'rise', id: e.id });
        } else { e.wet = false; e.float = false; }
    }
    for (const e of R.ents) if (e.k === 'plate' && !e.gone) e.on = weightAt(e.x, e.y) >= dval(e.s.need);
    for (const e of R.ents) {
        if (e.k !== 'gate' || e.gone) continue;
        const want = gateWants(e);
        if (want !== !!e.open) {
            const occupied = (G.p.x === e.x && G.p.y === e.y) || entsAt(e.x, e.y).some(z => z !== e && OBJ[z.k]);
            if (want || !occupied) { e.open = want; EV.push({ t: want ? 'gateopen' : 'gateshut', id: e.id }); }
        }
    }
    for (const e of R.ents) {
        if (e.k !== 'crack' || e.gone || e.broken) continue;
        if (weightAt(e.x, e.y) > dval(e.s.hold)) {
            e.broken = true;
            EV.push({ t: 'crackbreak', id: e.id });
            for (const o of entsAt(e.x, e.y)) if (OBJ[o.k]) dropThing(o, e);
            if (G.p.x === e.x && G.p.y === e.y) {
                if (e.below) { fallThrough(e); return; }
                return die('fall');
            }
        }
    }
    const P = G.p;
    if (isWater(P.x, P.y) && !platformAt(P.x, P.y) && pv('wt') > 0) return die('sink');
    if (dval(G.p.s.hp) <= 0) return die('hp');
    if (HOOK.physics) HOOK.physics();
}
function gateWants(e) {
    if (e.flag) return !!G.flags[e.flag];
    if (e.hours) { const b = band(); return e.hours.includes(b); }
    const plates = rs().ents.filter(p => p.k === 'plate' && p.g === e.g && !p.gone);
    return plates.length > 0 && plates.every(p => p.on);
}
function die(why) { G.dead = why; EV.push({ t: 'die', why }); }

/* ---------- counters: they carry the one ---------- */
function increment(ds, onOverflow) {
    let i = ds.length - 1;
    const out = ds.slice();
    while (i >= 0) {
        if (out[i] === INF) return { ds: out, carried: [] };
        if (out[i] < 9) { out[i]++; return { ds: out, carried: ds.length - 1 - i ? range(i + 1, ds.length) : [] , top: false }; }
        out[i] = 0; i--;
    }
    if (onOverflow) onOverflow();
    return { ds: out, carried: range(0, ds.length), over: true };
}
const range = (a, b) => { const r = []; for (let i = a; i < b; i++) r.push(i); return r; };
function tickCounters() {
    for (const e of rs().ents) {
        if (e.k !== 'counter' || e.gone) continue;
        if (!(e.flow && HOOK[e.flow] && HOOK[e.flow]())) continue;
        const r = increment(e.s.cnt, () => { if (e.drop) placeLoose(e.drop[0], e.drop[1], 1); });
        e.s.cnt = r.ds;
        EV.push({ t: 'tick', id: e.id, carried: r.carried, over: r.over });
        if (HOOK.counted) HOOK.counted(e);
    }
}
function ringBell(e) {
    const r = increment(G.count, () => { const l = dval(G.lamp); if (l !== Infinity && l < 9) G.lamp = [l + 1]; });
    G.count = r.ds;
    EV.push({ t: 'bell', carried: r.carried, over: r.over });
    if (r.over && HOOK.lit) HOOK.lit();
    return 'turn';
}

/* ---------- monsters ---------- */
function asleep(m) {
    if (isEerie()) return true;
    if (m.sleep === 'night') return isNight();
    if (m.sleep === 'day') return !isNight();
    return false;
}
function tickMonsters() {
    const P = G.p;
    for (const m of rs().ents.slice()) {
        if (m.gone || !MONSTER[m.k] || !present(m) || asleep(m)) continue;
        const adj = Math.abs(m.x - P.x) + Math.abs(m.y - P.y) === 1;
        if (adj && m.windup && !m.wound) { m.wound = true; EV.push({ t: 'windup', id: m.id }); continue; }
        if (adj) { hurtPlayer(m); if (G.dead) return; continue; }
        m.wound = false;
        if (m.ai === 'chase') {
            const dist = Math.abs(m.x - P.x) + Math.abs(m.y - P.y);
            if (dist <= (m.range || 4)) monsterStep(m, Math.sign(P.x - m.x), Math.sign(P.y - m.y), Math.abs(P.x - m.x) >= Math.abs(P.y - m.y));
        } else if (m.ai === 'patrol') {
            const [tx, ty] = m.path[m.pi];
            if (m.x === tx && m.y === ty) m.pi = (m.pi + 1) % m.path.length;
            const [gx, gy] = m.path[m.pi];
            monsterStep(m, Math.sign(gx - m.x), Math.sign(gy - m.y), Math.abs(gx - m.x) >= Math.abs(gy - m.y));
        }
    }
}
function monsterFree(x, y) {
    if (x < 0 || y < 0 || x >= MW || y >= MH) return false;
    const t = T(x, y);
    if (t.solid || t.water || t.pit || t.mat) return false;
    if (G.p.x === x && G.p.y === y) return false;
    if (entsAt(x, y).some(e => solidFor(e) || e.k === 'crack' && e.broken)) return false;
    return true;
}
function monsterStep(m, sx, sy, xFirst) {
    const tries = xFirst ? [[sx, 0], [0, sy]] : [[0, sy], [sx, 0]];
    for (const [dx, dy] of tries) {
        if (!dx && !dy) continue;
        if (monsterFree(m.x + dx, m.y + dy)) { m.x += dx; m.y += dy; EV.push({ t: 'mmove', id: m.id }); return true; }
    }
    return false;
}
function hurtPlayer(m) {
    const dmg = sv(m, 'str');
    const hp = pv('hp');
    EV.push({ t: 'mattack', id: m.id, dmg });
    if (hp === Infinity || dmg === 0) return;
    const nv = dmg === Infinity ? 0 : Math.max(0, hp - dmg);
    G.p.s.hp = vdig(nv, G.p.s.hp.length);
    EV.push({ t: 'hurt', dmg });
    if (nv <= 0) die('hp');
}
function attack(m) {
    const dmg = pv('str');
    const hp = sv(m, 'hp');
    EV.push({ t: 'hit', id: m.id, dmg });
    if (hp === Infinity || dmg === 0) return 'turn';
    const nv = dmg === Infinity ? 0 : Math.max(0, hp - dmg);
    m.s.hp = vdig(nv, m.s.hp.length);
    if (nv <= 0) defeat(m);
    return 'turn';
}
function defeat(m) {
    m.gone = true;
    EV.push({ t: 'defeat', id: m.id, x: m.x, y: m.y });
    /* it leaves its numbers behind, the 0 of its health too */
    for (const k of Object.keys(m.s)) for (const d of m.s[k]) placeLoose(m.x, m.y, d);
    if (m.onDefeat && HOOK[m.onDefeat]) HOOK[m.onDefeat](m);
}

/* ---------- loose digits ---------- */
let looseN = 0;
function newLoose(x, y, v) { return { id: 'L' + Date.now().toString(36) + (looseN++), k: 'loose', x, y, s: { v: [v] } }; }
function placeLoose(x, y, v) { const e = newLoose(x, y, v); rs().ents.push(e); EV.push({ t: 'loose', id: e.id }); return e; }
function giveDigit(v) {
    const i = G.pocket.indexOf(null);
    if (i >= 0) { G.pocket[i] = v; EV.push({ t: 'getdigit', v, pi: i }); return; }
    /* hands full: it goes on the floor beside you, where you can see it */
    const order = { u: ['u', 'l', 'r', 'd'], d: ['d', 'l', 'r', 'u'], l: ['l', 'u', 'd', 'r'], r: ['r', 'u', 'd', 'l'] }[G.p.dir];
    for (const d of order) {
        const [dx, dy] = DIR[d];
        if (canDrop(G.p.x + dx, G.p.y + dy)) { placeLoose(G.p.x + dx, G.p.y + dy, v); return; }
    }
    placeLoose(G.p.x, G.p.y, v);
}

/* ---------- swapping: the one verb ---------- */
/* everything you can touch: the four tiles around you, your own tile, yourself */
function reachTiles() {
    const { x, y } = G.p;
    return [[x, y], [x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]];
}
function touchable(e, x, y) {
    if (e.k === 'house' || e.k === 'lot') return x === e.x + e.door[0] && y === e.y + e.door[1];
    if (e.touch) return e.touch.some(([a, b]) => a === x && b === y);
    return covers(e, x, y);
}
function swapTargets() {
    const out = [];
    const seen = new Set();
    for (const [x, y] of reachTiles()) {
        for (const e of rs().ents) {
            if (e.gone || !present(e) || seen.has(e.id) || !touchable(e, x, y)) continue;
            if (e.k === 'crack' && e.broken) continue;
            if (e.k === 'npc' && !(e.hide && G.items.specs)) continue;
            if (e.k === 'loose') { out.push({ t: 'loose', id: e.id }); seen.add(e.id); continue; }
            let any = false;
            for (const key of slotKeys(e)) {
                if (!visibleSlot(e, key) || boltedSlot(e, key)) continue;
                const ds = slotGet(e, key);
                if (!ds) continue;
                ds.forEach((_, i) => { if (digitReach(e, key, i)) { out.push({ t: 'slot', id: e.id, key, i }); any = true; } });
            }
            if (any) seen.add(e.id);
        }
    }
    if (G.follow) {
        const f = G.follow;
        if (Math.abs(f.x - G.p.x) + Math.abs(f.y - G.p.y) <= 1) out.push({ t: 'slot', id: 'chick', key: 'age', i: 0 });
    }
    for (const key of slotKeys(SELF)) slotGet(SELF, key).forEach((_, i) => out.push({ t: 'slot', id: '@', key, i }));
    const [dx, dy] = DIR[G.p.dir];
    const fx = G.p.x + dx, fy = G.p.y + dy;
    if (canDrop(fx, fy)) out.push({ t: 'drop', x: fx, y: fy });
    return out;
}
function sameTarget(a, b) { return a.t === b.t && (a.t === 'drop' ? a.x === b.x && a.y === b.y : a.id === b.id && a.key === b.key && a.i === b.i); }
function reachable(tg) { return swapTargets().some(t => sameTarget(t, tg)); }
function canDrop(x, y) {
    if (x < 0 || y < 0 || x >= MW || y >= MH) return false;
    const t = T(x, y);
    if (t.solid || t.water || t.pit || t.mat) return false;
    if (blockedByEnt(x, y)) return false;
    if (entsAt(x, y).some(e => e.k === 'loose' || e.k === 'crack' && e.broken)) return false;
    return true;
}
function targetEnt(tg) { return tg.id === '@' ? SELF : tg.id === 'chick' ? G.follow : entById(tg.id); }
function targetDigit(tg) {
    if (tg.t === 'loose') { const e = entById(tg.id); return e ? e.s.v[0] : null; }
    if (tg.t === 'drop') return null;
    const e = targetEnt(tg); if (!e) return null;
    const ds = slotGet(e, tg.key); return ds ? ds[tg.i] : null;
}

const FLIP = { 6: 9, 9: 6 };
function doSwap(tg, pi) {
    const pk = G.pocket[pi];
    if (pi < 0 || pi >= G.pocket.length) return false;
    if (tg.t === 'drop') {
        if (pk === null || !canDrop(tg.x, tg.y)) return false;
        placeLoose(tg.x, tg.y, pk); G.pocket[pi] = null;
        EV.push({ t: 'drop', x: tg.x, y: tg.y, v: pk, pi });
        G.stats.swaps++;
        return true;
    }
    if (tg.t === 'loose') {
        const e = entById(tg.id); if (!e) return false;
        const v = e.s.v[0];
        if (pk === null) { e.gone = true; rs().ents = rs().ents.filter(z => z !== e); }
        else e.s.v = [pk];
        G.pocket[pi] = v;
        EV.push({ t: 'swap', tg, give: pk, take: v, pi });
        G.stats.swaps++;
        afterSwapAny();
        return true;
    }
    const e = targetEnt(tg);
    if (!e || pk === null) { EV.push({ t: 'refuse', tg }); return false; }
    if (e !== SELF && e !== G.follow && (!visibleSlot(e, tg.key) || boltedSlot(e, tg.key))) return false;
    const before = slotGet(e, tg.key).slice();
    const old = before[tg.i];
    const nds = before.slice(); nds[tg.i] = pk;
    const prevRoad = clone(G.road);
    slotSet(e, tg.key, nds);
    if (!validAfter(e, tg.key)) {
        slotSet(e, tg.key, before);
        G.road = prevRoad;
        EV.push({ t: 'refuse', tg, why: refusedWhy });
        return false;
    }
    G.pocket[pi] = old;
    EV.push({ t: 'swap', tg, give: pk, take: old, pi });
    G.stats.swaps++;
    afterSwap(e, tg.key, old, pk);
    return true;
}
/* a thing can't come into being where something already stands */
/* why the last swap was refused, so the screen can say so */
let refusedWhy = null;
function occupiedBesides(e) {
    for (let y = e.y; y < e.y + (e.h || 1); y++) for (let x = e.x; x < e.x + (e.w || 1); x++) {
        if (G.p.x === x && G.p.y === y) { refusedWhy = { why: 'you', x, y }; return true; }
        if (G.follow && G.follow.x === x && G.follow.y === y) { refusedWhy = { why: 'way', x, y }; return true; }
        if (entsAt(x, y).some(o => o !== e && (solidFor(o) || OBJ[o.k] || o.k === 'loose'))) { refusedWhy = { why: 'way', x, y }; return true; }
    }
    return false;
}
function validAfter(e, key) {
    refusedWhy = null;
    if (e.k === 'npc' && key === 'age' && dval(e.s.age) === 0) { refusedWhy = { why: 'person' }; return false; }
    if (e.k === 'milestone') {
        const R = G.road;
        if (!Number.isFinite(R.p) || !Number.isFinite(R.e)) { refusedWhy = { why: 'endless' }; return false; }
        if (R.p + R.e > 99) { refusedWhy = { why: 'long' }; return false; }
        return true;
    }
    if (key === 'age' && e !== SELF && e !== G.follow && e.k !== 'npc' && solidFor(e) && occupiedBesides(e)) return false;
    if (key === 'age' && e.k === 'bridge') {
        if (bridgeStage(sv(e, 'age')) === 'none' && (G.p.x === e.x && G.p.y === e.y || entsAt(e.x, e.y).some(o => OBJ[o.k]))) { refusedWhy = { why: 'way', x: e.x, y: e.y }; return false; }
    }
    if (e.k === 'lot' && key === 'age' && lotStage(sv(e, 'age')) !== 'none' && occupiedBesides(e)) return false;
    return true;
}
function afterSwapAny() { physics(); }
function afterSwap(e, key, took, gave) {
    if (e.k === 'mirror' && FLIP[gave] !== undefined) {
        e.s.v = [FLIP[gave]];
        EV.push({ t: 'flip', id: e.id, from: gave, to: FLIP[gave] });
        if (gave === 6) stamp('mirror');
    }
    if (e.k === 'cat' && weightOf(e) <= 2 && e.bed && !(e.x === e.bed[0] && e.y === e.bed[1])) {
        e.x = e.bed[0]; e.y = e.bed[1]; EV.push({ t: 'cathop', id: e.id });
    }
    if (key === 'age' && (e.k === 'egg' || e === G.follow)) chickChanged(e);
    if (key === 'age' && e.k !== 'egg') EV.push({ t: 'age', id: e.id });
    if (e.k === 'milestone') roadChanged();
    if (key === 'hour') EV.push({ t: 'hour' });
    if (e === SELF && key === 'age' && HOOK.selfAge) HOOK.selfAge();
    if (e.k === 'npc' && key === 'age') { EV.push({ t: 'age', id: e.id }); if (e.aside && dval(e.s.age) < 16 && !(G.p.x === e.aside[0] && G.p.y === e.aside[1])) { e.x = e.aside[0]; e.y = e.aside[1]; } }
    if (HOOK.swapped) HOOK.swapped(e, key, took, gave);
}
function roadChanged() {
    const R = G.road;
    if (G.room === 'road') {
        if (R.e === 0) { R.p = R.p; transform('cliff'); }
        else if (R.p === 0) transform('eastlane');
    }
}
function transform(id) {
    touchRoom('road'); touchRoom(id);
    const carried = rs('road').ents.filter(e => e.k === 'loose' && !e.gone);
    rs('road').ents = rs('road').ents.filter(e => e.k !== 'loose');
    delete G.roadDrops[G.road.p];
    const [x, y] = freeNear(id, G.p.x, G.p.y);
    G.room = id; G.p.x = x; G.p.y = y;
    for (const l of carried) { const [lx, ly] = canDrop(l.x, l.y) ? [l.x, l.y] : [x, y]; l.x = lx; l.y = ly; rs(id).ents.push(l); }
    EV.push({ t: 'room', how: 'morph', to: id });
    entrySnap = snapCore(true);
}

/* ---------- the chick ---------- */
function chickChanged(e) {
    const stg = chickStage(sv(e, 'age'));
    if (e === G.follow) {
        if (stg === 'chick') return;
        const egg = { id: 'egg', k: 'egg', x: e.x, y: e.y, s: { age: G.follow.s.age.slice() } };
        G.follow = null;
        if (stg === 'egg') { rs().ents.push(egg); EV.push({ t: 'egged' }); }
        else { flyHome(egg); }
        return;
    }
    if (stg === 'chick') {
        rs().ents = rs().ents.filter(z => z !== e);
        G.follow = { id: 'chick', k: 'egg', x: e.x, y: e.y, s: { age: e.s.age.slice() } };
        EV.push({ t: 'hatch' });
        stamp('hatch');
    } else if (stg === 'bird' && !(G.room === 'deepwood' && e.x === NEST[0] && e.y === NEST[1])) {
        rs().ents = rs().ents.filter(z => z !== e);
        flyHome(e);
    }
}
const NEST = [11, 2];
function flyHome(e) {
    touchRoom('deepwood');
    rs('deepwood').ents = rs('deepwood').ents.filter(z => z.k !== 'egg');
    e.x = NEST[0]; e.y = NEST[1]; e.id = 'egg';
    rs('deepwood').ents.push(e);
    EV.push({ t: 'flyaway' });
}
function moveFollower(ox, oy) {
    if (!G.follow) return;
    G.follow.x = ox; G.follow.y = oy;
}

/* ---------- small interactions ---------- */
function say(lines, who) { if (!lines) return false; EV.push({ t: 'say', lines: Array.isArray(lines) ? lines : [lines], who }); return 'talk'; }
function talkTo(e) {
    const f = TALK[e.id];
    const lines = (!e.ownAge && ageTalk(e)) || (f ? f(e) : e.text);
    if (!lines) return false;
    EV.push({ t: 'say', lines, who: e.id });
    return 'talk';
}
/* anyone whose age you've changed has something to say about it */
function ageTalk(e) {
    if (!e.s || !e.s.age || e.a0 === undefined) return null;
    const a = dval(e.s.age);
    if (a === e.a0) return null;
    if (a === Infinity) return ['I have seen the stars be born.', 'It was nice. A bit long.'];
    if (a < 13) return ['(in a very small voice) Everything is so BIG.'];
    if (a < 20) return ['Ugh. Whatever.'];
    if (a >= 90) return ['Eh? Speak up, dear. I\'m ' + a + '.'];
    if (a > e.a0) return ['I feel... older. Wiser? No. Just older.'];
    return ['I feel younger! Not young. But younger.'];
}
function openChest(e) {
    if (e.open) return say(e.emptyText || ['Empty.']);
    if (e.lock && !(HOOK[e.lock] && HOOK[e.lock](e))) return say(e.lockText || ['Locked.']);
    e.open = true;
    EV.push({ t: 'chest', id: e.id });
    if (e.item) getItem(e.item);
    if (e.digit !== undefined) giveDigit(e.digit);
    return 'turn';
}
function eatCookie(e) {
    const n = dval(e.s.n), hp = pv('hp');
    if (n === 0) return say(['The jar is empty.']);
    if (hp >= 9) return say(['You\'re full.']);
    if (n !== Infinity) e.s.n = vdig(n - 1, e.s.n.length);
    G.p.s.hp = vdig(hp + 1, 1);
    EV.push({ t: 'munch' });
    return 'turn';
}
function shopOpen() { const b = band(), h = hourVal(); return (b === 'day' || b === 'dusk') && h >= 8; }
function buy(e) {
    if (e.sold) return say(e.soldText || ['Sold out.']);
    if (!shopOpen()) return say(['The shop is closed.']);
    const price = dval(e.s.price), gold = pv('gold');
    if (price === Infinity) return say(['That one\'s priceless, love. Not for sale.']);
    if (price > gold) { EV.push({ t: 'poor', id: e.id }); return HOOK.cantAfford ? HOOK.cantAfford(e) : say(['Not enough gold.']); }
    if (gold !== Infinity) G.p.s.gold = vdig(gold - price, 2);   /* endless money stays endless, and stays one infinity */
    e.sold = true;
    EV.push({ t: 'buy', id: e.id });
    if (e.item === 'digit') giveDigit(e.digit); else getItem(e.item);
    if (HOOK.bought) HOOK.bought(e, price);
    return 'turn';
}
function getItem(id) {
    if (id === 'satchel' && G.pocket.length < 3) { G.pocket.push(null); }
    G.items[id] = (G.items[id] || 0) + 1;
    EV.push({ t: 'item', id });
    if (id === 'specs') EV.push({ t: 'reveal' });
}
function stamp(id) {
    if (G.stamps[id]) return;
    G.stamps[id] = true;
    EV.push({ t: 'stamp', id });
}

/* a way out of anywhere: the pause menu takes you to your own front door */
function goHome() {
    if (G.dead) return false;
    beginSnap(); commitSnap();
    G.dead = null;
    const [x, y] = freeNear('square', 2, 4);
    EV.push({ t: 'door' });
    goRoom('square', x, y, 'fade', 'd');
    return true;
}

/* ---------- saving ---------- */
const SAVE_KEY = 'carry-the-one-save-v1';
function autosave() {
    if (typeof localStorage === 'undefined' || G.flags.noSave) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(G)); } catch (e) { /* private mode: play on */ }
}
function loadSave() {
    if (typeof localStorage === 'undefined') return null;
    try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; }
}
/* a save is only numbers: anything that isn't a digit becomes 0 */
function sanitize(g) {
    const fix = ds => Array.isArray(ds) ? ds.map(d => (Number.isInteger(d) && d >= 0 && d <= INF) ? d : 0) : ds;
    for (const k in g.p.s) g.p.s[k] = fix(g.p.s[k]);
    g.hour = fix(g.hour); g.count = fix(g.count); g.lamp = fix(g.lamp);
    g.pocket = g.pocket.map(d => d === null ? null : fix([d])[0]);
    for (const k of ['p', 'e']) if (!Number.isFinite(g.road[k])) g.road[k] = k === 'e' ? 99 : 0;
    for (const id in g.rooms) for (const e of g.rooms[id].ents) if (e.s) for (const k in e.s) e.s[k] = fix(e.s[k]);
    if (g.follow && g.follow.s) g.follow.s.age = fix(g.follow.s.age);
}
function hasSave() { return !!loadSave(); }
function resumeSave() {
    const s = loadSave(); if (!s) return false;
    G = s;
    for (const id in ROOMS) if (!G.rooms[id]) G.rooms[id] = { ents: clone(ROOMS[id].ents || []) };
    sanitize(G);
    G.dead = null;
    UNDO.length = 0;
    entrySnap = snapCore(true);
    return true;
}
