/* ---- 21_player.js ---- */
/* Sarah: movement, animation, interaction and tap-to-walk */
const DIRV = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };

function makePlayer(x, y, dir) {
    return { kind: 'player', x, y, dir: dir || 'down', moving: false, anim: 0, pose: null, poseT: 0, path: null,
        goal: null, onArrive: null, stuck: 0, run: false, bob: 0, emote: null, emoteT: 0 };
}

/* which of Sarah's frames ("down_walkA", "side_hug"...) she's in right now */
function playerFrameKey(p) {
    const side = p.dir === 'left' || p.dir === 'right';
    const d = side ? 'side' : p.dir;
    if (p.pose) {
        const byPose = { pick: 'down_pick', cheer: 'down_cheer', happy: side ? 'side_happy' : 'down_happy', left: 'down_left', right: 'down_right', hug: 'side_hug' };
        if (byPose[p.pose]) return byPose[p.pose];
        if (p.pose === 'fish') return `${d}_stand`;
        if (p.pose === 'shake') return `${d}_${(G.t >> 2) % 2 ? 'walkA' : 'walkB'}`;     // (shaking a tree: a little effort)
        if (p.pose === 'walk') { const k = Math.floor(p.anim / 4) % 4; return `${d}_${k === 1 ? 'walkA' : k === 3 ? 'walkB' : 'stand'}`; }
    }
    let b = 'stand';
    if (p.moving) {
        const k = Math.floor(p.anim / (p.run ? 5 : 8)) % 4;
        b = k === 1 ? 'walkA' : k === 3 ? 'walkB' : 'stand';
    }
    return `${d}_${b}`;
}
function playerFrame(p) { return sarahSprite(S.player.outfit || 'crimson', playerFrameKey(p)); }
function drawPlayer(ctx, p) {
    if (hdOn() && hdDrawPlayer(ctx, p)) return;           // the HD-2D view's bigger Sarah
    const flip = p.dir === 'left';
    if (p.pose === 'hug') {
        const y = Math.round(p.y);
        spr(ctx, 'shadow_s', p.x, p.y + 1);
        drawToolUnder(ctx, p, y);
        spr(ctx, playerFrame(p), p.x, y, flip);
        drawSarahAccs(ctx, p.x, y, 'side', flip);
        drawToolOver(ctx, p, y);
        return;
    }
    if (p.sit && Math.abs(p.y - (p.sit.benchY - 1)) > 2) { p.sit = null; p.sy = undefined; }        // moved by something else
    if (p.sit && p.sit.rot) {
        // (a turned bench: side on or her back to us, the seat hiding her legs)
        const y = Math.round(p.y);
        drawSeated(ctx, sitClipY(p.sit), () => { spr(ctx, playerFrame(p), p.x, y, flip); drawSarahAccs(ctx, p.x, y, playerFaceDir(p), flip); });
        return;
    }
    if (p.sit) {
        // a real sitting frame: hands on her lap, feet on the ground in front of the bench
        const y = Math.round(p.y), o = S.player.outfit || 'crimson';
        spr(ctx, sarahSprite(o, 'down_sit'), p.x, y);
        drawSarahAccs(ctx, p.x, y + 1, 'down', false);
        return;
    }
    const y = Math.round(p.y) - (p.hop || 0);
    spr(ctx, 'shadow_s', p.x, p.y + 1);
    drawToolUnder(ctx, p, y);
    spr(ctx, playerFrame(p), p.x, y, flip);
    drawSarahAccs(ctx, p.x, y + (p.pose === 'pick' ? 2 : 0), playerFaceDir(p), flip);
    drawToolOver(ctx, p, y);
}
/* which way Sarah's face points in the frame she's drawn with (bending down, cheering and dancing all face the front,
   whichever way she was walking), so her glasses and hat go on the right way round */
function playerFaceDir(p) {
    const side = p.dir === 'left' || p.dir === 'right';
    if (p.pose === 'pick' || p.pose === 'cheer' || p.pose === 'left' || p.pose === 'right') return 'down';
    if (p.pose === 'happy') return side ? 'side' : 'down';
    if (p.pose === 'hug') return 'side';
    return side ? 'side' : p.dir;
}
/* glasses (or a monocle, or a fancy mustache) first, then whatever's on her head */
function drawSarahAccs(ctx, x, y, d, flip) {
    const e = S.player.eyes, a = S.player.acc;
    if (e && Assets.has(`acc_${e}_${d}`)) spr(ctx, `acc_${e}_${d}`, x, y, flip);
    if (a && Assets.has(`acc_${a}_${d}`)) spr(ctx, `acc_${a}_${d}`, x, y, flip);
}
/* Sarah as she looks right now (outfit, look, glasses and hat), for menus */
function sarahPreview(px, frame) {
    const name = sarahSprite(S.player.outfit, frame || 'down_happy');
    const base = iconCanvas(name, px);
    const k = base.width / 16;
    const g = base.getContext('2d');
    g.imageSmoothingEnabled = false;
    for (const id of [S.player.eyes, S.player.acc]) {
        const nm = id && `acc_${id}_down`, f = nm && Assets.frames[nm];
        if (!f) continue;
        const [sx, sy, w, h, ax, ay] = f;
        g.drawImage(Assets.atlas, sx, sy, w, h, (8 - ax) * k, (23 - ay) * k, w * k, h * k);
    }
    return base;
}

/* Sarah's feet: a box round the spot she stands on, as wide as the doll the new look draws there and a couple of pixels
   below it too, so she stops just short of a wall, a stair's side or the water instead of standing half in it */
function blockedFoot(a, x, y) {
    return a.solidPx(x - 5, y - 4) || a.solidPx(x + 5, y - 4) || a.solidPx(x - 5, y + 2) || a.solidPx(x + 5, y + 2);
}

function movePlayer(p, dx, dy) {
    const a = G.area;
    let moved = false;
    if (dx) {
        if (!blockedFoot(a, p.x + dx, p.y)) { p.x += dx; moved = true; }
        else if (!dy) {   // slide around corners
            for (const n of [-1, 1]) if (!blockedFoot(a, p.x + dx, p.y + n * 3) && !blockedFoot(a, p.x, p.y + n)) { p.y += n; moved = true; break; }
        }
    }
    if (dy) {
        if (!blockedFoot(a, p.x, p.y + dy)) { p.y += dy; moved = true; }
        else if (!dx) {
            for (const n of [-1, 1]) if (!blockedFoot(a, p.x + n * 3, p.y + dy) && !blockedFoot(a, p.x + n, p.y)) { p.x += n; moved = true; break; }
            if (dy < 0) tryDoor(p);
        }
    }
    return moved;
}

function tryDoor(p) {
    if (G.area.id !== 'island') return;
    const tx = Math.floor(p.x / TILE), ty = Math.floor((p.y - 6) / TILE);
    for (const e of G.area.ents) {
        if ((e.kind === 'building' || e.kind === 'windmill') && e.door && e.door.tx === tx && e.door.ty === ty) {
            if (!G.doorCooldown) { G.doorCooldown = 30; e.interact(); }
            return;
        }
    }
}

function updatePlayer(p) {
    if (p.poseT > 0 && --p.poseT === 0) p.pose = null;
    if (p.emoteT > 0 && --p.emoteT === 0) p.emote = null;
    if (G.doorCooldown) G.doorCooldown--;
    p.moving = false;
    if (p.glide) {
        // a short scripted step (making room to talk)
        const g = p.glide, dx = g.x - p.x, dy = g.y - p.y, d = Math.hypot(dx, dy);
        if (d <= 1.4 || ++g.t > 40) { p.x = g.x; p.y = g.y; p.glide = null; }
        else { p.x += dx / d * 1.4; p.y += dy / d * 1.4; p.moving = true; p.anim++; }
        return;
    }
    if (G.busy || UI.modal) { p.path = null; return; }
    if (p.sit) {
        // sitting on a bench: any move (or a tap somewhere) stands Sarah back up
        const k = G.keys;
        if (k.ArrowLeft || k.KeyA || k.ArrowRight || k.KeyD || k.ArrowUp || k.KeyW || k.ArrowDown || k.KeyS || p.path) { const path = p.path; standUp(p); p.path = path; }
        else return;
    }
    let dx = 0, dy = 0;
    const k = G.keys;
    const hold = G.hold && G.hold.steer ? G.hold : null;
    if (hold && !p.sit) {
        // a finger held down: walk towards it (and run when it's far ahead); if something's in the way, go around it
        const [wx, wy] = hold.world();
        const ddx = wx - p.x, ddy = wy - (p.y - 4), d = Math.hypot(ddx, ddy);
        const tx = Math.floor(wx / TILE), ty = Math.floor(wy / TILE);
        if (hold.around) {
            // following a way around: look again when the finger moves to another tile, or the way runs out
            if (!p.path || (hold.around !== tx + ',' + ty && G.frame % 20 === 0)) { hold.around = null; p.path = null; }
        }
        if (!hold.around && d > 5) {
            p.path = null; p.onArrive = null;
            const sp = (d > 6 * TILE || (S.settings && S.settings.run) ? 2.1 : 1.35) * bonusSpeed();
            const ux = ddx / d, uy = ddy / d, x0 = p.x, y0 = p.y;
            movePlayer(p, ux * sp, 0); movePlayer(p, 0, uy * sp);
            if (Math.abs(ux) > Math.abs(uy)) p.dir = ux > 0 ? 'right' : 'left'; else p.dir = uy > 0 ? 'down' : 'up';
            p.moving = true; p.run = sp > 1.5; p.anim++;
            hold.stuck = Math.hypot(p.x - x0, p.y - y0) < sp * 0.35 ? (hold.stuck || 0) + 1 : 0;
            if (hold.stuck > 8 && d > TILE && !G.area.blockedAt(tx, ty) && walkTo(tx, ty, null, wx, wy)) { hold.around = tx + ',' + ty; hold.stuck = 0; }
            afterMove(p);
            return;
        }
        if (!hold.around) return;
    }
    if (k.ArrowLeft || k.KeyA) dx -= 1;
    if (k.ArrowRight || k.KeyD) dx += 1;
    if (k.ArrowUp || k.KeyW) dy -= 1;
    if (k.ArrowDown || k.KeyS) dy += 1;
    // the Run toggle (R, or the shoe button); holding Shift does the opposite of whatever it's set to
    p.run = !!(k.ShiftLeft || k.ShiftRight) !== !!(S.settings && S.settings.run);
    if (dx || dy) { p.path = null; p.onArrive = null; }
    if (!dx && !dy && p.path) {
        // follow the tap path
        const nx = p.path.length ? (p.path[0][0] + 0.5) * TILE : p.goal[0];
        const ny = p.path.length ? (p.path[0][1] + 0.5) * TILE + 4 : p.goal[1];
        const ddx = nx - p.x, ddy = ny - p.y;
        const dist = Math.hypot(ddx, ddy);
        const sp = (p.run ? 2.1 : 1.35) * bonusSpeed();
        if (dist < sp + 0.1) {
            if (p.path.length) p.path.shift();
            else { p.x = nx; p.y = ny; arrive(p); return; }
        } else {
            const ux = ddx / dist, uy = ddy / dist;
            const before = [p.x, p.y];
            let moved = movePlayer(p, ux * sp, 0) | movePlayer(p, 0, uy * sp);
            if (Math.abs(ux) > Math.abs(uy)) p.dir = ux > 0 ? 'right' : 'left'; else p.dir = uy > 0 ? 'down' : 'up';
            p.moving = true;
            p.anim++;
            if (Math.hypot(p.x - before[0], p.y - before[1]) < 0.2) { if (++p.stuck > 24) { p.path = null; p.stuck = 0; arrive(p, true); } }
            else p.stuck = 0;
        }
        afterMove(p);
        return;
    }
    if (dx || dy) {
        const sp = (p.run ? 2.1 : 1.35) * bonusSpeed();
        const n = dx && dy ? 0.7071 : 1;
        if (dy < 0) p.dir = 'up'; else if (dy > 0) p.dir = 'down';
        if (dx < 0) p.dir = 'left'; else if (dx > 0) p.dir = 'right';
        if (dx && dy) p.dir = Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : p.dir;
        movePlayer(p, dx * sp * n, 0);
        movePlayer(p, 0, dy * sp * n);
        p.moving = true;
        p.anim++;
        afterMove(p);
    }
}

function afterMove(p) {
    const a = G.area;
    if (a.interior && p.y > a.exitY) leaveInterior();
    // (an open archway in the back wall: the museum's wings)
    if (a.interior && a.upDoors && p.y < a.floor.y0 * TILE + 2) { const tx = Math.floor(p.x / TILE), d = a.upDoors.find(o => o.x === tx); if (d) d.go(); }
    if (p.moving && G.frame % (p.run ? 14 : 20) === 0) Sfx.step(G.area.id === 'island' ? groundAt(p.x, p.y) : 'wood');
}
function groundAt(x, y) {
    const a = G.area;
    if (!a.grid) return 'wood';
    const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE), o = overlayAt(tx, ty);
    if (o === 'planks') return 'wood';
    if (o === 'stone' || o === 'brick') return 'stone';
    const c = groundChar(tx, ty);
    return c === 'w' || c === 'b' ? 'wood' : c === 's' ? 'sand' : c === 'c' || c === 'm' ? 'stone' : 'grass';
}

function arrive(p, failed) {
    const cb = p.onArrive;
    p.path = null; p.goal = null; p.onArrive = null;
    if (cb && !failed) cb();
}

/* walk to a tile (then optionally do something) */
function walkTo(tx, ty, cb, fx, fy) {
    const p = G.player, a = G.area;
    const sx = Math.floor(p.x / TILE), sy = Math.floor((p.y - 2) / TILE);
    const free = a.nearestFree(tx, ty, 3);
    if (!free) return false;
    const path = findPath(a, sx, sy, free[0], free[1]);
    if (!path) return false;
    p.path = path;
    p.goal = fx != null ? [fx, fy] : [(free[0] + 0.5) * TILE, (free[1] + 0.5) * TILE + 4];
    p.onArrive = cb || null;
    p.stuck = 0;
    return true;
}

/* walk next to an entity, face it, and use it: right away if she's already beside it (a tree shaken, a neighbor talked
   to from where she stands), otherwise to whichever side is the shortest walk */
const REACH = 28;
function approach(e) {
    const p = G.player, a = G.area;
    const ex = e.x, ey = e.y;
    const use = () => { faceToward(p, e); tryInteract(e); };
    if (!(heldTool() === 'axe' && isChoppable(e)) && Math.hypot(ex - p.x, ey - p.y) < REACH) { p.path = null; use(); return; }
    let cands;
    if (e.stand) cands = [e.stand];
    else {
        const tx = Math.floor(ex / TILE), ty = Math.floor((ey - 2) / TILE);
        if (heldTool() === 'axe' && isChoppable(e)) {
            // chop from the side, where the swing looks right
            const near = p.x < ex ? -1 : 1;
            cands = [[tx + near, ty], [tx - near, ty], [tx, ty + 1]];
        } else if (e.npc) {
            // stand beside people so nobody's face is hidden behind Sarah's hair
            const near = p.x < ex ? -1 : 1;
            cands = [[tx + near, ty], [tx - near, ty], [tx, ty + 1], [tx, ty - 1], [tx - 1, ty + 1], [tx + 1, ty + 1]];
        } else cands = [[tx, ty + 1], [tx - 1, ty], [tx + 1, ty], [tx, ty - 1], [tx - 1, ty + 1], [tx + 1, ty + 1]];
        if (e.w2) cands.unshift([tx, ty + 1], [tx - 1, ty + 1]);
    }
    const sx = Math.floor(p.x / TILE), sy = Math.floor((p.y - 2) / TILE);
    let best = null;
    for (const [cx, cy] of cands) {
        if (a.blockedAt(cx, cy)) continue;
        if (cx === sx && cy === sy) { best = { path: [], cx, cy }; break; }
        const path = findPath(a, sx, sy, cx, cy, 4000);
        if (path && (!best || path.length < best.path.length)) best = { path, cx, cy };
    }
    if (!best) {
        if (Math.hypot(ex - p.x, ey - p.y) < REACH) use();
        return;
    }
    p.path = best.path;
    p.goal = [(best.cx + 0.5) * TILE, (best.cy + 0.5) * TILE + 4];
    p.onArrive = use;
}
function faceToward(p, e) {
    const dx = e.x - p.x, dy = (e.y - 4) - (p.y - 4);
    if (Math.abs(dx) > Math.abs(dy)) p.dir = dx > 0 ? 'right' : 'left';
    else p.dir = dy > 0 ? 'down' : 'up';
}

/* what's in front of Sarah */
function probePoint(p, dist) {
    const [dx, dy] = DIRV[p.dir];
    return [p.x + dx * (dist || 12), p.y - 5 + dy * (dist || 12)];
}
function inHit(e, x, y, pad) {
    const h = e.hit;
    if (!h) return false;
    pad = pad || 0;
    return x >= h.x - pad && x < h.x + h.w + pad && y >= h.y - pad && y < h.y + h.h + pad;
}
function frontTarget(p) {
    const [px, py] = probePoint(p, 12);
    let best = null, bd = 1e9;
    const nightNow = hourIn(Clock.hourF(), 21, 27);
    const consider = e => {
        if (!e.interact || e === p || (e.onlyNight && !nightNow)) return;
        const near = inHit(e, px, py) || Math.hypot(e.x - px, (e.y - 6) - py) < 12;
        if (!near) return;
        const d = Math.hypot(e.x - px, e.y - 6 - py) + (e.npc ? -6 : 0) + (e.kind === 'item' ? -4 : 0);
        if (d < bd) { bd = d; best = e; }
    };
    G.area.ents.forEach(consider);
    NPCs.here().forEach(consider);
    Online.here().forEach(consider);
    return best;
}
function tryInteract(e) {
    if (!e || G.busy || UI.modal) return;
    Promise.resolve(e.interact(e)).catch(err => console.error(err));
}
function pressA() {
    const p = G.player;
    if (!p || G.busy || UI.modal) return;
    const e = frontTarget(p);
    // holding the watering can: water what's in front (planted flowers drink it up; a wild one isn't picked)
    if (heldTool() === 'can' && G.area.id === 'island' && (e ? e.gardenFlower || e.wildFlower : !G.area.waterAt(...probePoint(p, 14).map(v => Math.floor(v / TILE))))) { waterFront(e); return; }
    if (e) { tryInteract(e); return; }
    // water in front: fish
    const [px, py] = probePoint(p, 14);
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    const w = G.area.waterAt(tx, ty);
    if (w && w !== 'h') { startFishing(tx, ty, w); return; }
    // holding the shovel: dig right here
    if (heldTool() === 'shovel' && G.area.id === 'island') { shovelFront(); return; }
    if (w === 'h') return;
    // otherwise pick up something at her feet
    const under = G.area.ents.find(e2 => e2.kind === 'item' && Math.hypot(e2.x - p.x, e2.y - p.y) < 10);
    if (under) tryInteract(under);
}


