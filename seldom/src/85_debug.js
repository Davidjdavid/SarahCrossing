/* debug helpers (only with ?debug): a picture of a whole map, jumping about */
const Debug = {
    /* the whole map drawn small, as a data URL (for checking the layout) */
    mapImage(id, px) {
        const m = MAPS[id || 'island']; px = px || 8;
        const c = document.createElement('canvas'); c.width = m.w * px; c.height = m.h * px;
        const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
        const r = { x: 0, y: 0, w: m.pw, h: m.ph };
        const save = World.map; World.map = m;
        R.drawWorld.call({ ctx, shore: R.shore }, r, 0, 0, c.width, c.height, 0);
        World.map = save;
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '10px monospace';
        for (let x = 0; x < m.w; x += 10) ctx.fillText(x, x * px + 1, 10);
        for (let y = 10; y < m.h; y += 10) ctx.fillText(y, 1, y * px + 4);
        return c.toDataURL();
    },
    go(tx, ty, mapId) { if (mapId && mapId !== World.map.id) World.go(mapId, tx, ty); const d = World.dot; d.x = tx * TILE + 3; d.y = ty * TILE + 7; Cam.mode = 'follow'; Cam.snap(); },
    give(...flags) { for (const f of flags) G.flags[f] = true; Story.restore(); },
};
/* the bot: plays with the same buttons a person has (used by the playthrough test).
   Async, so the game's scenes (promises) get to run between steps. */
const Bot = {
    log: [],
    keys(o) { Input.keys = Object.assign({}, o || {}); },
    async step(n) { for (let i = 0; i < (n || 1); i++) { tick(STEP); lapseStep(); await null; } },
    async press(b, n) { this.keys({ [b]: true }); await this.step(n || 2); this.keys(); await this.step(2); },
    async talkThrough(max) { let n = 0; while ((G.state === 'talk' || World.cutscene) && n++ < (max || 400)) { if (G.state === 'talk') await this.press('act', 3); await this.step(4); } },
    /* walk Dot to a tile by the grid; returns true when there */
    async walkTo(tx, ty, max) {
        const d = World.dot; max = max || 4000;
        let path = null, guard = 0;
        for (let i = 0; i < max; i++) {
            if (G.state === 'talk' || World.cutscene) await this.talkThrough();
            const [cx, cy] = tileOf(d);
            if (cx === tx && cy === ty) { this.keys(); await this.step(2); return true; }
            if (!path || guard++ > 40) { path = findPath(d.map, cx, cy, tx, ty, d, true) || findPath(d.map, cx, cy, tx, ty) || []; guard = 0; }
            let nx = tx, ny = ty;
            while (path.length && path[0][0] === cx && path[0][1] === cy) path.shift();
            if (path.length) [nx, ny] = path[0];
            const gx = nx * TILE + 8, gy = ny * TILE + 11;
            const dx = gx - ecx(d), dy = gy - (d.y + d.h / 2);
            const k = {};
            if (dx < -1.5) k.left = true; if (dx > 1.5) k.right = true;
            if (dy < -1.5) k.up = true; if (dy > 1.5) k.down = true;
            if (!k.left && !k.right && !k.up && !k.down) { path.shift(); }
            this.keys(k); await this.step(1);
        }
        this.keys(); this.log.push('walkTo failed ' + tx + ',' + ty + ' at ' + tileOf(d)); return false;
    },
    /* hold the look button and pan for some steps */
    async look(k, n) { this.keys(Object.assign({ look: true }, k)); await this.step(n); this.keys(); await this.step(2); },
    async face(dir) { this.keys({ [dir]: true }); await this.step(2); this.keys(); await this.step(1); },
    async act() { await this.press('act'); await this.talkThrough(); },
    async until(f, max) { for (let i = 0; i < (max || 6000); i++) { if (f()) return true; if (G.state === 'talk') await this.talkThrough(); await this.step(1); } return false; },
};

/* a game as it stands right after Lamp Night (for playtesting the second act) */
Debug.afterLampNight = async function () {
    Title.enter(); Game.newGame(); await Bot.talkThrough();
    Object.assign(G.flags, { started: 1, clockSeen: 1, eggsGiven: 1, cakeBaking: 1, cake: 1, bridge: 1, drummer: 1, festival: 1, spyglass: 1, lanterns: 1, ballGame: 1 });
    for (const [x, y] of [[65, 40], [66, 40], [65, 41], [66, 41]]) setTile(MAPS.island, x, y, 'b');
    ent('bridgework').st.p = 1; ent('tilt').hidden = true; ent('ansel').hidden = true; ent('ansel').st.bit = true; ent('flash').hidden = true;
    for (const n of ['still', 'return', 'hour']) Notebook.got[n] = 1;
    World.hour = 21.5; Debug.go(50, 40); World.dot.dir = 'down';
    UI.showHint('Hold X (or Shift) and use the arrows to look around. Let go and the view stays put.', 12);
};
