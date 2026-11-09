/* putting the room on screen: ground, things, numbers, light, effects */

const VIS = new Map();        /* where each thing is drawn (eases toward where it is) */
const FX = [];                /* particles */
const POPS = [];              /* floating words and numbers */
const FLY = [];               /* digits in flight between a tag and the satchel */
let TAGS = {};                /* id -> key -> [ {x,y} per digit ] for the frame just drawn */
let shake = 0, flash = 0, flashCol = '#fff';
let playerFrame = 0, playerStepT = 0;
const OY = TOP; /* the play area starts under the hud */

function visOf(id, x, y, snap) {
    let v = VIS.get(id);
    if (!v || snap) { v = { x, y }; VIS.set(id, v); }
    return v;
}
function easeVis(dt) {
    const k = 1 - Math.pow(0.0005, dt);
    for (const [id, v] of VIS) {
        if (v.tx === undefined) continue;
        v.x += (v.tx - v.x) * k; v.y += (v.ty - v.y) * k;
        if (Math.abs(v.tx - v.x) < 0.3) v.x = v.tx;
        if (Math.abs(v.ty - v.y) < 0.3) v.y = v.ty;
    }
}
function target(id, x, y) { const v = visOf(id, x, y); v.tx = x; v.ty = y; return v; }
function snapAll() {
    VIS.clear();
}
const moving = () => { for (const v of VIS.values()) if (v.tx !== undefined && (Math.abs(v.tx - v.x) > 1 || Math.abs(v.ty - v.y) > 1)) return true; return false; };

function puff(x, y, col, n = 6, sp = 1, life = 0.5, up = 0) {
    for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, s = (0.5 + Math.random()) * sp;
        FX.push({ x, y, vx: Math.cos(a) * s * 30, vy: Math.sin(a) * s * 30 - up * 30, life, max: life, col, size: Math.random() < 0.3 ? 2 : 1 });
    }
}
function pop(x, y, str, col = C.w) { POPS.push({ x, y, str, col, life: 0.9, max: 0.9 }); }

/* the order things are drawn in: flat things first, then by their feet */
const FLAT = { plate: 1, crack: 1, bridge: 1, loose: 1, stamp: 1, sea: 1 };
function isFlat(e) {
    if (FLAT[e.k]) return true;
    if (e.k === 'lot' && lotStage(sv(e, 'age')) === 'none') return true;
    if (OBJ[e.k] && e.wet) return !e.float;
    if (e.k === 'deco' && e.walk) return true;
    if (e.k === 'gate' && e.open && e.look === 'sluice') return true;
    return false;
}

function drawScene(g, t) {
    const id = G.room;
    g.drawImage(ground(id), 0, OY);
    drawWaterFx(g, id, t, OY);
    const ents = rs().ents.filter(e => !e.gone && present(e));
    TAGS = {};
    /* things lying flat and things under the water */
    for (const e of ents) if (isFlat(e)) drawEnt(g, e, t);
    /* standing things and people, by their feet */
    const stand = ents.filter(e => !isFlat(e));
    const list = stand.map(e => ({ e, y: (e.y + (e.h || 1)) * TS + (e.k === 'npc' || MONSTER[e.k] ? 0.5 : 0) }));
    list.push({ e: 'player', y: G.p.y * TS + 16.6 });
    if (G.follow) list.push({ e: 'follow', y: G.follow.y * TS + 16.4 });
    list.sort((a, b) => a.y - b.y);
    for (const it of list) {
        if (it.e === 'player') drawPlayer(g, t);
        else if (it.e === 'follow') drawFollower(g, t);
        else drawEnt(g, it.e, t);
    }
    drawLight(g, t, ents);
    /* numbers glow over everything, even at night */
    for (const e of ents) drawTags(g, e, t);
    if (G.follow) drawTags(g, G.follow, t);
    drawFx(g);
}

function entPx(e) { const v = target(e.id, e.x * TS, e.y * TS + OY); return v; }
function shadow(g, x, y, w = 10) { g.fillStyle = 'rgba(20,10,30,0.28)'; g.fillRect(x + 8 - w / 2, y + 13, w, 3); g.fillRect(x + 8 - w / 2 + 1, y + 12, w - 2, 1); }

function drawEnt(g, e, t) {
    const v = entPx(e);
    const x = Math.round(v.x), y = Math.round(v.y);
    const a = k => sv(e, k);
    switch (e.k) {
        case 'crate': case 'boulder': case 'anchor': case 'parcel': {
            const wt = weightOf(e);
            const img = e.k === 'crate' ? crateImg(wt, e.float) : e.k === 'boulder' ? boulderImg(wt) : e.k === 'anchor' ? anchorImg() : parcelImg();
            if (e.wet && !e.float) {
                g.globalAlpha = 0.45; g.drawImage(img, x, y + 3); g.globalAlpha = 1;
                g.fillStyle = 'rgba(45,90,160,0.35)'; g.fillRect(x, y, 16, 16);
            } else if (e.wet && e.float) {
                const b = Math.round(Math.sin(t * 3 + e.x) * 1);
                g.drawImage(img, x, y + 2 + b); g.fillStyle = C.c; g.fillRect(x + 1, y + 14, 14, 1);
            } else { shadow(g, x, y, 14); g.drawImage(img, x, y); }
            break;
        }
        case 'tree': {
            const st = treeStage(a('age'));
            const img = treeImg(st, !!e.big, !!e.hollow);
            if (e.big) g.drawImage(img, x, y + 32 - img.height);
            else g.drawImage(img, x, y + 16 - img.height + 2);
            break;
        }
        case 'wall': g.drawImage(wallImg(wallStage(a('age')), e.look), x, y); break;
        case 'bridge': g.drawImage(bridgeImg(bridgeStage(a('age')), e.w || 1), x, y); break;
        case 'lot': { const img = lotImg(lotStage(a('age'))); g.drawImage(img, x, y - 4); break; }
        case 'house': {
            if (e.look === 'lighthouse') { const img = lighthouseImg(!!G.flags.lit); g.drawImage(img, x, y + 80 - img.height); drawLighthouseWindows(g, x, y + 80 - img.height); }
            else g.drawImage(houseImg(e.look), x, y - 4);
            break;
        }
        case 'door': g.drawImage(doorImg(e.look || 'door'), x, y); if (e.look === 'towerdoor') { puffMaybe(x + 8, y + 8, C.v, t); } break;
        case 'plate': g.drawImage(plateImg(!!e.on), x, y); break;
        case 'gate': g.drawImage(gateImg(e.look || 'gate', !!e.open), x, y - 4); break;
        case 'crack': g.drawImage(crackImg(!!e.broken), x, y); break;
        case 'loose': drawLoose(g, e, x, y, t); break;
        case 'stamp': { const b = Math.round(Math.sin(t * 3) * 1.5); g.drawImage(stampImg(e.stamp), x + 2, y + 1 + b); if (Math.sin(t * 5) > 0.95) puff(x + 12, y + 2, C.Y, 1, 0.3, 0.4); break; }
        case 'npc': drawNpc(g, e, x, y, t); break;
        case 'slime': { shadow(g, x, y, 12); g.drawImage(slimeImg(a('hp'), t, asleep(e), Math.floor(t * 3 + e.x) % 2), x, y); if (asleep(e)) zzz(g, x + 10, y, t); break; }
        case 'rattle': shadow(g, x, y, 12); g.drawImage(rattleImg(Math.floor(t * 4) % 2), x, y); break;
        case 'golem': shadow(g, x, y, 14); g.drawImage(golemImg(!asleep(e), !!e.wound), x, y); if (e.wound) { text(g, '!', x + 7, y - 9, C.r, C.k); } break;
        case 'cat': shadow(g, x, y, 14); g.drawImage(catImg(weightOf(e) > 2), x, y); if (Math.sin(t * 0.7 + 1) > 0.9) zzz(g, x + 12, y + 2, t); break;
        case 'egg': { const st = chickStage(a('age')); shadow(g, x, y, 10); g.drawImage(chickImg(st, Math.floor(t * 2) % 2), x, y); break; }
        case 'clock': g.drawImage(fixtureImg('clock'), x, y - 16); break;
        case 'milestone': g.drawImage(fixtureImg('milestone'), x, y - 16); break;
        case 'shelf': g.drawImage(fixtureImg(e.sold ? 'shelf_sold' : 'shelf_' + e.item), x, y - 16); break;
        case 'drum': g.drawImage(fixtureImg('drum'), x, y - 16); break;
        case 'counter': g.drawImage(fixtureImg('counter'), x, y - 16); break;
        case 'chest': g.drawImage(fixtureImg(e.look || 'chest', e.open ? 1 : 0), x, y - 16); break;
        case 'bell': g.drawImage(fixtureImg('bell'), x, y - 16); break;
        case 'jar': g.drawImage(fixtureImg('jar', Math.min(6, a('n'))), x, y - 16); break;
        case 'scope': g.drawImage(fixtureImg(e.look || 'scope'), x, y - 16); break;
        case 'lamp': { const lit = dval(G.lamp) > 0; g.drawImage(fixtureImg('lamp', lit ? 1 : 0), x, y - 16); if (lit) { g.fillStyle = 'rgba(255,240,170,0.25)'; g.fillRect(x - 8, y - 8, 48, 32); } break; }
        case 'mirror': g.drawImage(fixtureImg('mirror'), x, y - 16); break;
        case 'stairs': g.drawImage(fixtureImg(e.look || 'stairsup'), x, y - 16); break;
        case 'deco': drawDeco(g, e, x, y, t); break;
        case 'sea': break;
        default: R(g, C.m, x + 4, y + 4, 8, 8);
    }
}
function puffMaybe(x, y, col, t) { if (Math.random() < 0.08) puff(x, y, col, 1, 0.4, 0.8, 0.5); }
function zzz(g, x, y, t) { const k = (t * 0.8) % 1; text(g, 'z', x + Math.round(k * 4), y - Math.round(k * 8), C.w, C.k); }
function drawDeco(g, e, x, y, t) {
    if (e.look === 'tower') { const img = towerImg(); g.drawImage(img, x, y + 64 - img.height); return; }
    if (e.look === 'wheel') { const fl = HOOK.millFlow && HOOK.millFlow(); const f = fl ? Math.floor(t * 8) % 4 : 0; g.drawImage(wheelImg(f), x - 4, y - 2); if (fl && Math.random() < 0.3) puff(x + 8, y + 28, C.w, 1, 0.6, 0.5); return; }
    if (e.look === 'torch') { g.drawImage(decoImg('torch'), x, y - 16); const f = Math.floor(t * 10) % 3; R(g, C.o, x + 6, y - 1 - f, 4, 5 + f); R(g, C.y, x + 7, y + 1 - f, 2, 3); return; }
    if (e.look === 'readout') { drawReadout(g, x, y); return; }
    if (e.look === 'ship') { const b = Math.round(Math.sin(t * 1.5) * 1); g.drawImage(shipImg(), x, y - 22 + b); return; }
    if (e.look === 'gear') { const img = decoImg('gear'); g.save(); g.translate(x + 8, y + 8); g.rotate(t * (e.id === 'gear1' ? 1 : -1)); g.drawImage(img, -8, -24); g.restore(); return; }
    const img = decoImg(e.look);
    if (e.h === 2) { g.drawImage(img, x, y); return; }
    g.drawImage(img, x, y - 16);
}
function drawReadout(g, x, y) {
    R(g, C.k, x, y + 1, 64, 14); R(g, C.K, x + 1, y + 2, 62, 12);
    const ds = [dval(G.lamp), ...G.count];
    ds.forEach((d, i) => {
        const dx = x + 4 + i * 12;
        R(g, i === 0 ? C.o : C.w, dx, y + 3, 9, 10);
        g.drawImage(digitImg(d === Infinity ? INF : d, i === 0 ? C.k : C.k, 1), dx + 2, y + 5);
    });
}
const LH_WIN = [30, 48, 66, 84];
function drawLighthouseWindows(g, x, y0) {
    /* four windows up the tower show the four drums; the lamp is the fifth digit */
    const ys = LH_WIN;
    for (let i = 0; i < 4; i++) {
        const d = G.count[i];
        const wy = y0 + ys[i];
        R(g, C.k, x + 18, wy, 12, 12); R(g, C.B, x + 19, wy + 1, 10, 10);
        if (i === 0 && !G.items.specs) { R(g, C.G, x + 20, wy + 2, 8, 8); continue; }
        g.drawImage(digitImg(d, C.Y, 1), x + 22, wy + 3);
    }
}
function drawLoose(g, e, x, y, t) {
    const stack = rs().ents.filter(z => z.k === 'loose' && !z.gone && z.x === e.x && z.y === e.y);
    const n = stack.indexOf(e);
    const ox = (n - (stack.length - 1) / 2) * 5;
    const b = Math.round(Math.sin(t * 3 + e.x + n) * 1.2);
    const v = e.s.v[0];
    g.fillStyle = 'rgba(20,10,30,0.3)'; g.fillRect(x + 4 + ox, y + 12, 8, 2);
    const cx = x + 8 + ox;
    const img = digitImg(v, C.y, 1);
    const w = img.width;
    if (FLY.some(f => f.hide && f.hide.id === e.id)) return;
    R(g, C.k, cx - Math.ceil(w / 2) - 2, y + 2 + b, w + 4, 10);
    R(g, C.o, cx - Math.ceil(w / 2) - 1, y + 3 + b, w + 2, 8);
    g.drawImage(img, cx - Math.ceil(w / 2), y + 4 + b);
    (TAGS[e.id] = TAGS[e.id] || {}).v = [{ x: cx - Math.ceil(w / 2), y: y + 4 + b, w }];
}
function drawNpc(g, e, x, y, t) {
    const L = e.look;
    shadow(g, x, y);
    if (L === 'squirrel' || L === 'ghost' || L === 'clerk' || L === 'hourling') { g.drawImage(critterImg(L, Math.floor(t * 2) % 2), x, y); return; }
    let look = L;
    if (L === 'pip' || L === 'sev') { /* ages show */ }
    const facing = e.face || 'd';
    const b = Math.floor(t * 1.5 + e.x) % 2;
    g.drawImage(personImg(look, facing, 0), x, y - (b ? 1 : 0) + (b ? 1 : 0));
    if (L === 'grist_in' || e.id === 'grist_in' || e.id === 'marlo_in' || e.id === 'sev_in') zzz(g, x + 11, y, t);
    if (L === 'dot' && !shopOpen()) zzz(g, x + 11, y, t);
}
function drawPlayer(g, t) {
    const P = G.p;
    const v = target('@', P.x * TS, P.y * TS + OY);
    const x = Math.round(v.x), y = Math.round(v.y);
    const walking = Math.abs(v.tx - v.x) + Math.abs(v.ty - v.y) > 0.5;
    const frame = walking ? (Math.floor(t * 8) % 2) : 0;
    const wt = pv('wt');
    const floatY = wt === 0 ? Math.round(Math.sin(t * 3) * 1.5) - 2 : 0;
    const old = G.items.specs && dval(G.p.s.age) >= 60;
    if (G.dead === 'sink') { g.globalAlpha = 0.5; }
    shadow(g, x, y + (wt === 0 ? 1 : 0), wt === 0 ? 8 : 10);
    if (isWater(P.x, P.y) && !platformAt(P.x, P.y)) { R(g, C.c, x + 2, y + 13, 12, 2); }
    g.drawImage(personImg(old ? 'elder' : 'player', P.dir, frame), x, y + floatY);
    g.globalAlpha = 1;
}
function drawFollower(g, t) {
    const f = G.follow;
    const v = target('chick', f.x * TS, f.y * TS + OY);
    g.drawImage(chickImg('chick', Math.floor(t * 4) % 2), Math.round(v.x), Math.round(v.y) + 2);
}

/* ---------- number tags ---------- */
function tagSize(n, icon = true) { return { w: 4 + (icon ? 6 : 0) + n * 5 - 1, h: 10 }; }
function drawTag(g, e, key, ds, x, y, opt = {}) {
    const hidden = e.hide && e.hide.includes(key);
    const bolted = boltedSlot(e, key);
    const icon = opt.icon !== false;
    const { w, h } = tagSize(ds.length, icon);
    x = Math.round(x); y = Math.round(y);
    const fill = hidden ? C.e : bolted ? C.W : C.w, line = hidden ? C.E : C.k;
    blob(g, x, y, w, h, fill, line, roundRect(w, h, 2));
    let cx = x + 2;
    if (icon) { g.drawImage(iconImg(key, hidden ? C.E : ICON_COL[key] || C.G), cx, y + 2); cx += 6; }
    const out = [];
    ds.forEach((d, i) => {
        const far = e.far && e.far[key] && e.far[key][i];
        const hideD = FLY.some(f => f.hide && f.hide.id === e.id && f.hide.key === key && f.hide.i === i);
        if (far) R(g, C.G, cx - 1, y + 1, 6, 8);
        if (!hideD) {
            const flip = e.k === 'mirror';
            g.drawImage(digitImg(d, far ? C.W : hidden ? C.k : C.k, 1, false), cx + (d === INF ? -0.5 : 0) | 0, y + 2);
        }
        out.push({ x: cx, y: y + 2, w: digitW(d) });
        cx += 5;
    });
    if (bolted) { P1(g, C.G, x + 1, y + 1); P1(g, C.G, x + w - 2, y + 1); P1(g, C.G, x + 1, y + h - 2); P1(g, C.G, x + w - 2, y + h - 2); }
    if (hidden) { const s = (performance.now() / 300 + e.x) % 6; if (s < 1) P1(g, C.w, x + 1 + Math.floor(s * (w - 2)), y); }
    ((TAGS[e.id] = TAGS[e.id] || {})[key] = out);
    return { w, h };
}
function drawTags(g, e, t) {
    if (e.k === 'loose') return;
    if (e === G.follow) {
        const v = VIS.get('chick'); if (!v) return;
        const ds = G.follow.s.age;
        const { w } = tagSize(1);
        drawTag(g, { id: 'chick', k: 'egg', hide: null }, 'age', ds, v.x + 8 - w / 2, v.y - 8);
        return;
    }
    const keys = slotKeys(e).filter(k => slotGet(e, k) && visibleSlot(e, k));
    if (!keys.length) return;
    const v = VIS.get(e.id); if (!v) return;
    const x = v.x, y = v.y;
    const W = (e.w || 1) * TS;
    const one = (k, tx, ty, o) => drawTag(g, e, k, slotGet(e, k), tx, ty, o);
    switch (e.k) {
        case 'house': case 'lot': {
            const dx = x + e.door[0] * TS + 8, dy = y + e.door[1] * TS;
            const { w } = tagSize(slotGet(e, 'addr').length, false);
            one('addr', dx - w / 2, dy - 10, { icon: false });
            if (keys.includes('age')) { const { w: w2 } = tagSize(1); one('age', x + W / 2 - w2 / 2, y - 14); }
            return;
        }
        case 'door': { const { w } = tagSize(slotGet(e, 'addr').length, false); one('addr', x + 8 - w / 2, e.face === 'u' ? y + 3 : y - 6, { icon: false }); return; }
        case 'clock': { const { w } = tagSize(2); one('hour', x + 8 - w / 2, y - 14); return; }
        case 'milestone': {
            if (keys.length === 2) { one('w', x - 6, y - 9); one('e', x + 6, y - 9 + 11); }
            else { const { w } = tagSize(2); one(keys[0], x + 8 - w / 2, y - 8); }
            return;
        }
        case 'drum': { const { w } = tagSize(1, false); if (keys.includes('cnt')) one('cnt', x + 8 - w / 2, y + 3, { icon: false }); return; }
        case 'counter': { const { w } = tagSize(3); one('cnt', x + 8 - w / 2, y - 11); return; }
        case 'shelf': { const { w } = tagSize(slotGet(e, 'price').length); one('price', x + 8 - w / 2, y + 10); return; }
        case 'plate': { const { w } = tagSize(1); one('need', x + 8 - w / 2, y + 3); return; }
        case 'crack': if (!e.broken) { const { w } = tagSize(1); one('hold', x + 8 - w / 2, y + 3); } return;
        case 'sea': { const { w } = tagSize(1); one('d', 7.5 * TS - w / 2 + 0, 9 * TS + OY + 3); return; }
        case 'lamp': { const { w } = tagSize(1); one('lamp', x + 16 - w / 2, y + 3); return; }
        case 'mirror': { const { w } = tagSize(1); one('v', x + 8 - w / 2, y - 6); return; }
        case 'tree': if (e.big) { const { w } = tagSize(1); one('age', x + 16 - w / 2, y + 20); return; } break;
        case 'bridge': { const { w } = tagSize(1); one('age', x + W / 2 - w / 2, y + 3); return; }
    }
    /* default: a row of tags over its head */
    const sizes = keys.map(k => tagSize(slotGet(e, k).length).w);
    const total = sizes.reduce((a, b) => a + b, 0) + (keys.length - 1) * 2;
    let tx = x + W / 2 - total / 2;
    const lift = e.k === 'wall' && wallStage(sv(e, 'age')) === 'rubble' ? 2 : e.k === 'tree' ? (treeStage(sv(e, 'age')) === 'seed' || treeStage(sv(e, 'age')) === 'sprout' ? 4 : -2) : -8;
    const ty = e.k === 'tree' ? y + 4 : (OBJ[e.k] && e.wet && !e.float) ? y + 3 : y + lift;
    keys.forEach((k, i) => { one(k, tx, ty); tx += sizes[i] + 2; });
}

/* ---------- light and dark ---------- */
const darkCv = { cv: null };
function lightSources(ents) {
    const L = [];
    const pv0 = VIS.get('@');
    if (pv0) L.push([pv0.x + 8, pv0.y + 8, 40]);
    for (const e of ents) {
        const v = VIS.get(e.id); if (!v) continue;
        if (e.look === 'torch') L.push([v.x + 8, v.y, 34]);
        if (e.k === 'house' && e.look !== 'lighthouse') { L.push([v.x + 12, v.y + 36, 18]); L.push([v.x + 37, v.y + 36, 18]); }
        if (e.k === 'house' && e.look === 'lighthouse' && G.flags.lit) L.push([v.x + 24, v.y - 30, 90]);
        if (e.k === 'lot' && lotStage(sv(e, 'age')) === 'house') L.push([v.x + 24, v.y + 36, 22]);
        if (e.k === 'clock') L.push([v.x + 8, v.y - 8, 22]);
        if (e.k === 'loose') L.push([v.x + 8, v.y + 8, 12]);
        if (e.k === 'door' && e.look === 'towerdoor') L.push([v.x + 8, v.y + 8, 30]);
        if (e.k === 'lamp' && dval(G.lamp) > 0) L.push([v.x + 16, v.y + 8, 80]);
    }
    if (G.follow) { const v = VIS.get('chick'); if (v) L.push([v.x + 8, v.y + 8, 14]); }
    return L;
}
function drawLight(g, t, ents) {
    const d = def();
    const b = band();
    let col = null, alpha = 0;
    if (d.dark) { col = '8,6,16'; alpha = 0.82; }
    else if (d.out) {
        if (b === 'dusk') { g.fillStyle = 'rgba(240,120,60,0.18)'; g.fillRect(0, OY, VW, MH * TS); col = '40,20,60'; alpha = 0.18; }
        if (b === 'night') { col = '12,14,44'; alpha = 0.62; }
    }
    if (b === 'eerie') {
        g.save(); g.globalCompositeOperation = 'difference'; g.fillStyle = 'rgba(120,60,150,0.85)'; g.fillRect(0, OY, VW, MH * TS); g.restore();
        g.save(); g.globalCompositeOperation = 'color'; g.fillStyle = 'rgba(176,127,208,0.55)'; g.fillRect(0, OY, VW, MH * TS); g.restore();
        if (Math.random() < 0.3) puff(Math.random() * VW, OY + Math.random() * MH * TS, C.v, 1, 0.2, 1.2, 0.3);
        return;
    }
    if (!col) return;
    if (!darkCv.cv) darkCv.cv = mkCanvas(VW, MH * TS);
    const dc = darkCv.cv, dg = dc.getContext('2d');
    dg.globalCompositeOperation = 'source-over';
    dg.clearRect(0, 0, VW, MH * TS);
    dg.fillStyle = `rgba(${col},${alpha})`;
    dg.fillRect(0, 0, VW, MH * TS);
    dg.globalCompositeOperation = 'destination-out';
    for (const [lx, ly, r0] of lightSources(ents)) {
        const r = r0 * (1 + Math.sin(t * 2 + lx) * 0.03);
        const gr = dg.createRadialGradient(lx, ly - OY, 0, lx, ly - OY, r);
        gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        dg.fillStyle = gr; dg.fillRect(lx - r, ly - OY - r, r * 2, r * 2);
    }
    g.drawImage(dc, 0, OY);
}

/* ---------- effects ---------- */
function stepFx(dt) {
    for (let i = FX.length - 1; i >= 0; i--) { const p = FX[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 40 * dt; p.life -= dt; if (p.life <= 0) FX.splice(i, 1); }
    for (let i = POPS.length - 1; i >= 0; i--) { const p = POPS[i]; p.y -= 18 * dt; p.life -= dt; if (p.life <= 0) POPS.splice(i, 1); }
    shake = Math.max(0, shake - dt * 30);
    flash = Math.max(0, flash - dt * 2.5);
}
function drawFx(g) {
    for (const p of FX) { g.globalAlpha = Math.max(0, p.life / p.max); g.fillStyle = p.col; g.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size); }
    g.globalAlpha = 1;
    for (const p of POPS) { g.globalAlpha = Math.min(1, p.life / p.max * 2); textC(g, p.str, p.x, Math.round(p.y), p.col, C.k); }
    g.globalAlpha = 1;
}
