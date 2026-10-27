/* ---- 20_world.js ---- */
/* Areas (island, house, club), entities, collision and pathfinding */
const G = {
    area: null, areas: {}, player: null, cam: { x: 0, y: 0 }, busy: 0, frame: 0, t: 0,
    view: { w: 320, h: 180, scale: 4 }, keys: {}, mode: 'title', fx: [], particles: [],
};

class Area {
    constructor(id, w, h) {
        this.id = id; this.w = w; this.h = h;
        this.blocked = new Uint8Array(w * h);
        this.ents = []; this.decals = [];
        this.bg = null;        // canvas drawn under everything
        this.water = null;
    }
    blockedAt(tx, ty) { return tx < 0 || ty < 0 || tx >= this.w || ty >= this.h || this.blocked[ty * this.w + tx] !== 0; }
    block(tx, ty, v) { if (tx >= 0 && ty >= 0 && tx < this.w && ty < this.h) this.blocked[ty * this.w + tx] = v == null ? 1 : v; }
    solidPx(px, py) {
        const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
        if (!this.blockedAt(tx, ty)) return false;
        // (a half tile: a cut water tile's corner is bank or beach, and only the ground's own collision blocks it)
        const c = this.cut && this.cut[ty] && this.cut[ty][tx];
        if (!c || c === '.' || this.blocked[ty * this.w + tx] !== 1 || (W0.coll[ty] && W0.coll[ty][tx] !== '1')) return true;
        return !inCut(c, px / TILE - tx, py / TILE - ty);
    }
    add(e) { this.ents.push(e); return e; }
    remove(e) { const i = this.ents.indexOf(e); if (i >= 0) this.ents.splice(i, 1); }
    waterAt(tx, ty) {
        if (!this.water || ty < 0 || ty >= this.h || tx < 0 || tx >= this.w) return null;
        const c = this.water[ty][tx];
        return c === '.' ? null : c;
    }
    nearestFree(tx, ty, maxR) {
        if (!this.blockedAt(tx, ty)) return [tx, ty];
        for (let r = 1; r <= (maxR || 6); r++) {
            for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
                if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
                if (!this.blockedAt(tx + dx, ty + dy)) return [tx + dx, ty + dy];
            }
        }
        return null;
    }
}

/* is a spot in a tile (u, v from its north-west corner, 0..1) in the triangle its cut gives the other side? a: the
   north-west corner, b north-east, c south-east, d south-west (scripts/island/layout.mjs, cuts) */
function inCut(c, u, v) {
    return c === 'a' ? u + v < 1 : c === 'b' ? v < u : c === 'c' ? u + v > 1 : c === 'd' ? u < v : false;
}

/* A* on the tile grid, 8 directions without cutting corners. Returns tile list excluding the start. */
function findPath(area, sx, sy, gx, gy, maxNodes) {
    if (area.blockedAt(gx, gy)) return null;
    if (sx === gx && sy === gy) return [];
    const W = area.w, H = area.h, N = W * H;
    const g = new Float32Array(N).fill(1e9), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
    const open = [];     // binary heap of [f, idx]
    const push = (f, i) => { open.push([f, i]); let k = open.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (open[p][0] <= open[k][0]) break; [open[p], open[k]] = [open[k], open[p]]; k = p; } };
    const pop = () => { const top = open[0], last = open.pop(); if (open.length) { open[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < open.length && open[l][0] < open[m][0]) m = l; if (r < open.length && open[r][0] < open[m][0]) m = r; if (m === k) break; [open[m], open[k]] = [open[k], open[m]]; k = m; } } return top; };
    const h = (x, y) => { const dx = Math.abs(x - gx), dy = Math.abs(y - gy); return (dx + dy) + (1.414 - 2) * Math.min(dx, dy); };
    const s = sy * W + sx;
    g[s] = 0; push(h(sx, sy), s);
    let n = 0;
    const lim = maxNodes || 6000;
    while (open.length && n++ < lim) {
        const [, cur] = pop();
        if (closed[cur]) continue;
        closed[cur] = 1;
        const cx = cur % W, cy = (cur / W) | 0;
        if (cx === gx && cy === gy) {
            const out = [];
            let k = cur;
            while (k !== s) { out.push([k % W, (k / W) | 0]); k = from[k]; }
            return out.reverse();
        }
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = cx + dx, ny = cy + dy;
            if (area.blockedAt(nx, ny)) continue;
            if (dx && dy && (area.blockedAt(cx + dx, cy) || area.blockedAt(cx, cy + dy))) continue;
            const ni = ny * W + nx;
            if (closed[ni]) continue;
            const ng = g[cur] + (dx && dy ? 1.414 : 1);
            if (ng < g[ni]) { g[ni] = ng; from[ni] = cur; push(ng + h(nx, ny), ni); }
        }
    }
    return null;
}

/* ---------------------------------------------------------------- the island */
const W0 = window.WORLD_JSON;
/* the test area for the new 3D look (?lab in the address: scripts/island/plan-lab.mjs): a small world of its own,
   played without saving and without the neighbors' days (Joe and Maki stand on the cobbles, as in the concept art) */
const LAB = !!window.IS_LAB;
function tileFoot(tx, ty) { return [(tx + 0.5) * TILE, (ty + 1) * TILE - 2]; }
/* inside the community garden's fence (or its gate): the new look tills it */
function inCommunity(tx, ty) {
    const c = W0.community;
    if (!c) return false;
    return (tx > c.x && tx < c.x + c.w - 1 && ty > c.y && ty < c.y + c.h - 1) || (tx === c.gate && ty === c.y + c.h - 1);
}

function buildIsland() {
    const a = new Area('island', W0.w, W0.h);
    a.water = W0.water;
    a.grid = W0.grid;
    a.cut = W0.cut || null;
    for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) a.blocked[y * a.w + x] = W0.coll[y][x] === '1' ? 1 : 0;
    const season = Clock.season();
    a.season = season;
    // buildings + doors
    for (const [id, b] of Object.entries(W0.buildings)) {
        for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) a.block(x, y);
        const e = a.add({ kind: 'building', id, frame: b.sprite, x: (b.x + b.w / 2) * TILE, y: (b.y + b.h) * TILE, b });
        e.hit = { x: b.x * TILE, y: b.y * TILE - 16, w: b.w * TILE, h: b.h * TILE + 16 };
        const dx = b.x + b.door, dy = b.y + b.h - 1;
        e.door = { tx: dx, ty: dy };
        e.stand = [dx, dy + 1];
        e.interact = () => enterBuilding(id);
    }
    // trees (the ones Sarah hasn't chopped down)
    const gone = forest().chopped;
    let i = 0;
    for (const t of W0.fruitTrees) {
        const id = `ft${t.x}_${t.y}`;
        if (gone[id] || isCleared(id)) continue;
        a.block(t.x, t.y);
        const [fx, fy] = tileFoot(t.x, t.y);
        a.add(makeFruitTree(id, fx, fy, t.fruit, t.x, t.y));
    }
    for (const t of W0.trees) {
        if (gone[`dt${t.x}_${t.y}`] || isCleared(`dt${t.x}_${t.y}`)) continue;
        a.block(t.x, t.y);
        const [fx, fy] = tileFoot(t.x, t.y);
        const v = (t.x * 7 + t.y * 13) % 3;
        const frame = t.kind === 'blossom' ? `tree_blossom_${season}` : `tree_${t.kind}_${season}_${v}`;
        a.add(makeTree(`dt${t.x}_${t.y}`, fx, fy, frame, t.x, t.y));
        i++;
    }
    for (const p of W0.palms) {
        if (gone[`pa${p.x}_${p.y}`] || isCleared(`pa${p.x}_${p.y}`)) continue;
        a.block(p.x, p.y);
        const [fx, fy] = tileFoot(p.x, p.y);
        a.add(makePalm(`pa${p.x}_${p.y}`, fx, fy, p.coconut, p.x, p.y));
    }
    if (W0.bigTree) {
        const t = W0.bigTree;
        // (its 2x2 and the ring round it but the corners: the raised bed of stones it stands in, in the new look)
        for (let y = t.y - 1; y < t.y + 3; y++) for (let x = t.x - 1; x < t.x + 3; x++) if ((x === t.x - 1 || x === t.x + 2) && (y === t.y - 1 || y === t.y + 2)) continue; else a.block(x, y);
        const e = a.add({ kind: 'bigtree', frame: `tree_big_${season}`, x: (t.x + 1) * TILE, y: (t.y + 2) * TILE - 1 });
        e.hit = { x: t.x * TILE - 16, y: t.y * TILE - 40, w: 64, h: 72 };
        e.stand = [t.x, t.y + 3];
        e.interact = () => heldTool() === 'axe' ? UI.say(null, 'The big tree is too big. And too relaxed. Sarah puts the axe down.') : talkSign('bigtree');
        G.bigTree = e;
    }
    // the old giants of the forest: nobody's axe is going anywhere near these
    for (const t of W0.oldTrees || []) {
        for (let y = t.y; y < t.y + 2; y++) for (let x = t.x; x < t.x + 2; x++) a.block(x, y);
        const e = a.add({ kind: 'oldtree', frame: `tree_old_${season}_${t.v || 0}`, x: (t.x + 1) * TILE, y: (t.y + 2) * TILE - 1, tx: t.x, ty: t.y });
        e.hit = { x: t.x * TILE - 12, y: t.y * TILE - 56, w: 56, h: 88 };
        e.stand = [t.x, t.y + 2];
        e.interact = async () => {
            if (t === W0.oldTrees[0] && Quests.stage('windmill') >= 1 && !Quests.done('windmill') && !(Quests.st('windmill').cogs || []).includes('tree')) { await Quests.findCog('tree'); return; }
            await oldTreeTalk(e);
        };
    }
    W0.props.forEach((p, i) => { if (!isCleared('pr' + i) && !propGone(i)) { const e = addProp(a, p); if (e) e.propIdx = i; } });
    addPlacedDisplays(a);
    addDockedBoat(a);
    // Basil's noodle cart only rolls out at night
    const C = W0.cart;
    if (C) {
        const cart = a.add({ kind: 'cart', frame: 'noodle_cart', x: C.x * TILE, y: (C.y + 1) * TILE - 2, onlyNight: true });
        cart.hit = { x: (C.x - 1.9) * TILE, y: (C.y - 1.4) * TILE, w: 3.8 * TILE, h: 2.6 * TILE };
        cart.interact = () => { const b = NPCs.get('basil'); if (b && b.spotKey === 'cart' && !b.sleeping) talkTo(b); else talkSign('cart'); };
        cart.tiles = C.tiles;
        cart.solid = false;
        G.cart = cart;
    }
    // the waterfalls: moving water over the painted rock, and spray at the foot
    for (const wf of W0.waterfalls) addWaterfall(a, wf);
    addWildFlowers(a);
    addPlantedFlowers(a);
    // garden plots: raised planter boxes (solid; Sarah plants from beside them), Sarah's by her house and the community
    // garden's by the farm (c)
    W0.plots.forEach((p, idx) => {
        const [fx, fy] = tileFoot(p.x, p.y);
        a.block(p.x, p.y);
        const e = a.add({ kind: 'plot', idx, x: fx, y: fy + 1, tx: p.x, ty: p.y, layer: 0, c: !!p.c });
        e.hit = { x: p.x * TILE, y: p.y * TILE, w: TILE, h: TILE };
        e.stand = null;
        e.interact = () => usePlot(idx);
        e.draw = (ctx) => drawPlot(ctx, e);
    });
    a.bgSeason = season;
    addForest(a);
    applyExteriors(a);
    addLostItem(a);
    return a;
}

const PROP_SIZE = { bench: 2, flowerbed: 2, board: 1, lamp: 1, mailbox: 1, sign_island: 1, sign_club: 1, rock: 1, driftwood: 1, bush: 1,
    windmill: 3, boulder: 2, well: 1, hay: 1, crate: 1, scarecrow: 1, sign_farm: 1, telescope: 1, statue_david: 3, plaque: 1, bonfire: 2, log: 2,
    tent: 3, picnic: 3, campfire: 1, trough: 2, sign_camp: 1, sign_bonfire: 1, sign_trail: 1, blanket: 3,
    trashcan: 1, fountain: 2, fountain_grand: 4, drinkfountain: 1, sign_lot: 1, sign_land: 1, volleyball: 7, tackle: 1, sandcastle: 1, birdhouse: 1, wheelbarrow: 2, icecream: 2, viewer: 1, flamingo: 1 };
const PROP_ROWS = { statue_david: 2, tent: 2, blanket: 2, fountain_grand: 3 };
/* the little things around the island, and what Sarah finds when she looks at them */
const KNICK_FRAME = { fountain: 'd_fountain', fountain_grand: 'd_fountain', flamingo: 'd_flamingo', sign_trail: 'sign_camp', sign_lot: 'sign_camp', sign_land: 'sign_camp' };
const PROP_TALK = {
    windmill: () => "The windmill turns slowly. It grinds the island's flour. It also, according to Cuke, 'makes wind.' It does not.",
    scarecrow: () => rpick(["A scarecrow in a sun hat. The birds are not scared. The birds think it's a friend.", "The scarecrow has a little sign: 'HI. I'M STEVE.' Hi, Steve."]),
    hay: () => rpick(['A hay bale. It smells like summer, even in winter.', 'Hay. Soft-looking. It is not soft. Sarah checks.']),
    well: () => 'An old stone well. Sarah drops in a pebble and makes a wish. The well says nothing. Wells are very private.',
    crate: () => 'A crate of freshly picked vegetables, labeled "FOR FORTUNE." Fortune picks them up every morning.',
    sign_farm: () => 'UP THE HILL: THE FARM, THE FOREST, AND THE MOUNTAIN. Mind the cows. (There are no cows.)',
    boulder: () => 'A big mountain boulder. It has been sitting here for ten thousand years. It seems relaxed about it.',
    telescope: () => lookoutTelescope(),
    blanket: () => rpick(['A checkered picnic blanket, spread out and waiting. Somebody left a basket of napkins. Very organized picnicking.',
        'A picnic blanket. Neighbors come here for lunch with a view. The ants come here for the same reason.', 'A soft picnic blanket. It smells like grass and strawberries.']),
    sign_camp: () => 'THE CAMPSITE. Tents for visitors, a fire ring for stories. "Leave nothing but footprints. And maybe a marshmallow for the raccoon."',
    sign_lot: () => 'SET ASIDE FOR A NEW BUSINESS. "Coming soon: a coffee shop! Somebody new is moving to the island to open it. Who? A mystery. A delicious mystery." - Ginger',
    sign_land: () => 'LAND FOR SALE. A quiet plot in the neighborhood, with room for one cozy house. "Newcomers welcome! The crew will have it built in no time." - Ginger',
    sign_trail: () => 'THE RIDGE TRAIL. The farm, the campsite, the ridge, the lookout. "Wear good shoes. Bring a snack. Say hi to the pines." - Ginger',
    sign_bonfire: () => 'THE BONFIRE. Lit every evening. Bring a friend. Bring marshmallows. Do not bring Wonton near the fire; he gets steamy.',
    picnic: () => rpick(['A picnic table. Someone carved "J+J+E+D WERE HERE" into it. Family vandalism. Very sweet.', 'A picnic table with a checkered cloth. It smells like pine and granola bars.']),
    trough: () => rpick(["The goat's water trough. The goat drinks from it very loudly. On purpose.", 'A trough of fresh water. Ginger fills it every morning.']),
    log: () => rpick(['A log bench by the fire. Good for sitting. Good for stories.', 'A log. Smooth on top from a lot of sitting.']),
    trashcan: () => rpick(['A trash can. It is very clean. Ginger power-washes it on Sundays. She says a clean bin is a happy bin.',
        "A trash can. Somebody threw away a poem draft. It's Joe's. It's about a sock. Sarah puts it in her pocket. (Just kidding. It's a sock poem.)",
        'A trash can with a little leaf sticker: RECYCLE, PLEASE. Cuke put the sticker on. Cuke put stickers on all of them.',
        "Sarah peeks in the trash can. A banana peel, a napkin, and a note: 'I DID NOT eat the last cheesecake. - not Coco.'"]),
    fountain_grand: () => PROP_TALK.fountain(),
    fountain: () => rpick(['A little fountain on Main Street. Sarah tosses in a shell and makes a wish. The wish is a secret.',
        'The fountain burbles away. The bottom is covered in shells. Everyone on the island has made a wish here. Mostly for snacks.',
        'A fountain. Wonton says it is "a very small hot spring, but cold, and on a stick." That is not what a fountain is.']),
    drinkfountain: () => rpick(['A drinking fountain. Sarah takes a sip. Ice cold! Cuke taped a note to it: "HYDRATE!!!"',
        "A drinking fountain. The water arcs up in a perfect little rainbow. Sarah drinks. Refreshing. Very island.",
        'Sarah presses the button. The water shoots straight up her nose. She looks around. Nobody saw. (The goat saw.)']),
    volleyball: () => rpick(["A beach volleyball court. Kai and Chili play here at sunset. The score is always 'a lot to a lot.'",
        "The volleyball net. Somebody wrote the rules on a board: 1. Have fun. 2. No spiking the goat. 3. See rule 1.",
        'A volleyball court drawn in the sand with rope. Sully refs sometimes. He calls everything "wicked out."']),
    vbball: () => rpick(['A volleyball. Sarah gives it a little bump. It goes straight up. It comes straight down. On her head. Nobody saw.',
        'Sarah serves the ball over the net! It lands in. Nobody is on the other side to return it. She wins. Undefeated.',
        "The volleyball has a face drawn on it. Its name is Ball. Kai named it. Kai isn't great at names."]),
    tackle: () => rpick(["Somebody's fishing tackle: a box of shiny lures, a bait bucket, and a rod leaning on the box. A note says: 'BACK SOON - KAI.'",
        'A tackle box full of lures. One is shaped like a tiny cheesecake. Cece says it works on the fancy fish.',
        "A bait bucket and a tackle box. The bucket has one very small fish in it. It seems happy. It's on a break."]),
    sandcastle: () => rpick(['A sandcastle with a moat and a tiny flag. Somebody worked very hard on this. Sarah does not step on it. Sarah is a good person.',
        "A sandcastle. There's a shell for a door and a little sign: 'KING KAI'S CASTLE. NO WAVES.' The waves have not read the sign.",
        'A sandcastle. It has towers and a moat. Someone left a spoon for scale. It is a very big castle for a spoon.']),
    birdhouse: () => rpick(['A little birdhouse on a pole, with a red roof. A bird is home. It is judging Sarah very politely.',
        'A birdhouse. Ginger built it. It has a porch. Of course it has a porch.',
        "A birdhouse. There's a tiny sign on it: 'NO VACANCY.' The birds are doing great."]),
    wheelbarrow: () => rpick(["Ginger's wheelbarrow, full of garden dirt and two brave little sprouts.",
        'A wheelbarrow. Sarah gives it a push. It goes in a small circle. Sarah decides that was the plan.']),
    icecream: () => rpick(["An ice cream cart with a striped umbrella. A sign says 'BACK IN 5 MINUTES - MAC.' It has said that all week.",
        "The ice cream cart. The menu says: vanilla, chocolate, and 'Cece's cheesecake swirl (sorry if it's too good).'",
        'An ice cream cart. It is closed, but it smells like waffle cones. That feels like a kind of open.']),
    viewer: () => rpick(['A coin-op sea viewer. Sarah drops in a sand dollar and looks: waves! A boat! A seagull, VERY close. It looks back.',
        'Sarah looks through the viewer. Way out at sea there is a little sailboat. Someone on it is waving. Sarah waves back.',
        "The viewer is pointed at the lighthouse. Sarah looks. Somebody's up there. Oh. It's the lamp. Probably."]),
    flamingo: () => rpick(['A pink plastic flamingo, standing on one leg in the grass. It is doing its best.', 'A lawn flamingo. Someone gave it a tiny bow tie. Iconic.']),
};
/* every fence tile on the island (so each piece knows which way its neighbors are) */
function fenceTiles() {
    if (fenceTiles.c && fenceTiles.c.src === W0.props) return fenceTiles.c.set;
    const set = new Set();
    W0.props.forEach((p, i) => { if (p.kind === 'fence' && !propGone(i)) for (let k = 0; k < (p.w || 1); k++) set.add(p.x + k + ',' + p.y); });
    fenceTiles.c = { src: W0.props, set };
    return set;
}
/* the beach volleyball court: rope lines in the sand, the net across the middle (you can't walk through it), a ball */
function addVolleyball(a, p) {
    const w = PROP_SIZE.volleyball, net = p.y + 2;
    for (let k = 0; k < w; k++) a.block(p.x + k, net);
    // (placed by its bottom middle, so it isn't skipped while part of it is still on screen)
    const court = a.add({ kind: 'deco', frame: 'vb_court', x: (p.x + w / 2) * TILE, y: (p.y + 5) * TILE, layer: 0 });
    court.draw = ctx => spr(ctx, 'vb_court', court.x - w * TILE / 2, court.y - 5 * TILE);
    const e = a.add({ kind: 'volleyball', frame: 'vb_net', x: (p.x + w / 2) * TILE, y: (net + 1) * TILE - 2, px: p.x, py: p.y });
    e.hit = { x: p.x * TILE, y: net * TILE - 14, w: w * TILE, h: TILE + 14 };
    e.interact = () => UI.say(null, PROP_TALK.volleyball());
    const ball = a.add({ kind: 'vbball', frame: 'vb_ball', x: (p.x + 1.5) * TILE, y: (p.y + 3.8) * TILE });
    ball.hit = { x: ball.x - 8, y: ball.y - 12, w: 16, h: 14 };
    ball.interact = () => { ball.bounce = 30; Sfx.play('pick'); return UI.say(null, PROP_TALK.vbball()); };
    ball.draw = ctx => { const b = ball.bounce > 0 ? Math.abs(Math.sin(ball.bounce-- / 5)) * 8 * (ball.bounce / 30) : 0; spr(ctx, 'shadow_s', ball.x, ball.y); spr(ctx, 'vb_ball', ball.x, ball.y - b); };
    return e;
}
function addProp(a, p) {
    const w = p.w || PROP_SIZE[p.kind] || 1;
    if (p.kind === 'fence') {
        const F = fenceTiles();
        for (let k = 0; k < w; k++) {
            const x = p.x + k, y = p.y;
            a.block(x, y);
            const [fx, fy] = tileFoot(x, y);
            const L = F.has(x - 1 + ',' + y), Rt = F.has(x + 1 + ',' + y), U = F.has(x + ',' + (y - 1));
            a.add({ kind: 'fence', frame: `fence_${L && Rt ? 'm' : Rt ? 'l' : L ? 'r' : 'n'}${U ? 1 : 0}`, x: fx, y: fy });
        }
        return;
    }
    if (p.kind === 'volleyball') return addVolleyball(a, p);
    const rows = PROP_ROWS[p.kind] || 1;
    for (let k = 0; k < w; k++) for (let j = 0; j < rows; j++) if (p.kind !== 'driftwood' && p.kind !== 'blanket') a.block(p.x + k, p.y + j);
    const fx = (p.x + w / 2) * TILE, fy = (p.y + rows) * TILE - 2;
    let frame = KNICK_FRAME[p.kind] || p.kind;
    if (p.kind === 'bush') frame = `bush_${a.season || Clock.season()}`;
    const e = a.add({ kind: p.kind, frame, x: fx, y: fy, px: p.x, py: p.y });
    e.hit = { x: p.x * TILE, y: p.y * TILE - 12, w: w * TILE, h: rows * TILE + 12 };
    if (p.kind === 'lamp') { e.light = { r: 44, y: -24 }; e.hit = null; }
    if (p.kind === 'fountain' || p.kind === 'fountain_grand') e.draw = ctx => drawFountain(ctx, e);
    if (p.kind === 'blanket') { e.frame = 'picnic_blanket'; e.layer = 0; e.y = p.y * TILE + 23; e.hit = { x: p.x * TILE, y: p.y * TILE, w: w * TILE, h: 2 * TILE }; }
    if (p.kind === 'telescope') e.interact = () => useTelescope();
    if (p.kind === 'board') e.interact = () => readBoard();
    if (p.kind === 'sign_island') e.interact = async () => { if (!(await Jobs.paint())) talkSign('island'); };     // (an island job to repaint it: 6zi_jobs.js)
    if (p.kind === 'sign_club') e.interact = () => talkSign('club');
    if (p.kind === 'mailbox') { e.interact = () => openMailbox(); G.mailbox = e; e.draw = ctx => spr(ctx, unreadMail() ? 'mailbox_flag' : 'mailbox', e.x, e.y); }
    if (p.kind === 'bench' || p.kind === 'log') e.interact = () => sitOnBench(e);
    if (p.kind === 'statue_david') { e.hit = { x: p.x * TILE, y: p.y * TILE - 56, w: 3 * TILE, h: 2 * TILE + 56 }; e.interact = () => davidStatue(); }
    if (p.kind === 'plaque') e.interact = () => readPlaque();
    if (p.kind === 'bonfire') { e.draw = ctx => drawBonfire(ctx, e); e.interact = () => useBonfire(e); e.fire = true; G.bonfire = e; }
    if (p.kind === 'campfire') { e.draw = ctx => drawCampfire(ctx, e); e.interact = () => useCampfire(e); G.campfire = e; }
    if (p.kind === 'tent') { e.tent = p.tent || 0; e.hit = { x: p.x * TILE, y: p.y * TILE - 20, w: 3 * TILE, h: 2 * TILE + 20 }; e.draw = ctx => drawTent(ctx, e); e.interact = () => useTent(e); e.stand = [p.x + 1, p.y + 2]; }
    if (p.kind === 'rock') e.interact = () => talkSign('rock');
    if (p.kind === 'flowerbed') e.interact = () => talkSign('flowerbed');
    if (p.kind === 'crate') e.interact = async () => {
        if (Quests.stage('windmill') >= 1 && !Quests.done('windmill') && !(Quests.st('windmill').cogs || []).includes('crate') && p.y < 45) { await Quests.findCog('crate'); return; }
        await UI.say(null, PROP_TALK.crate());
    };
    if (PROP_TALK[p.kind] && !e.interact) e.interact = () => UI.say(null, PROP_TALK[p.kind]());
    if (p.kind === 'windmill') {
        e.y = (p.y + 2) * TILE - 2;
        e.draw = ctx => drawWindmill(ctx, e);
        e.hit = { x: p.x * TILE, y: p.y * TILE - 48, w: 3 * TILE, h: 2 * TILE + 48 };
        for (let k = 0; k < 3; k++) a.block(p.x + k, p.y + 1);
        e.light = null;
        // there's a door: walk up to it (or tap the windmill) to go inside
        e.door = { tx: p.x + 1, ty: p.y + 1 };
        e.stand = [p.x + 1, p.y + 2];
        e.interact = () => enterRoom('windmill');
    }
    return e;
}

/* Sarah's sailboat, tied up stern-to at the end of the pier, bow out to sea (the boat from the opening scene) */
const BOAT_TALK = ["Sarah's sailboat, tied up at the end of the pier. It brought her here at sunrise. It still smells like sunscreen and adventure.",
    "The sailboat bobs at the pier. Its sail is furled up neat and tidy. Maybe another voyage someday. Not today. Today is for the island.",
    "Sarah's boat. A gull is sitting on the boom like it owns the place. It does not own the place."];
function addDockedBoat(a) {
    const pr = W0.pier;
    if (!pr || !Assets.frames.boat_docked) return;
    const bx = pr.x1 + 1, by = pr.y1 - 3;                          // the stern touches the pier's east edge
    const [, , fw] = Assets.frames.boat_docked;
    const e = a.add({ kind: 'sailboat', frame: 'boat_docked', x: bx * TILE - 3, y: (by + 2) * TILE + 6 });
    e.hit = { x: bx * TILE, y: (by - 1) * TILE, w: Math.round(fw * 0.85), h: 3 * TILE + 6 };
    e.stand = [pr.x1, by + 1];
    e.draw = ctx => spr(ctx, 'boat_docked', e.x, e.y + (Math.sin(G.t / 55) > 0.35 ? 1 : 0));
    e.interact = () => UI.say(null, rpick(BOAT_TALK));
    return e;
}

function makeTree(id, x, y, frame, tx, ty) {
    const e = { kind: 'tree', id, frame, x, y, tx, ty, shake: 0 };
    e.hit = { x: x - 14, y: y - 36, w: 28, h: 38 };
    e.interact = () => heldTool() === 'axe' ? chopTree(e) : e.money ? shakeMoneyTree(e) : shakeTree(e);
    return e;
}
function makeFruitTree(id, x, y, fruit, tx, ty) {
    const e = makeTree(id, x, y, `tree_fruit_${Clock.season()}`, tx, ty);
    e.kind = 'fruittree'; e.fruit = fruit;
    e.draw = (ctx) => {
        const sx = e.shake ? Math.round(Math.sin(e.shake * 1.3) * 1.5) : 0;
        spr(ctx, e.frame, e.x + sx, e.y);
        if (treeHasFruit(e)) {
            for (const [ox, oy] of [[-7, -24], [5, -28], [0, -18]]) spr(ctx, `tfruit_${e.fruit}`, e.x + ox + sx, e.y + oy + 8);
        }
    };
    return e;
}
function makePalm(id, x, y, coconut, tx, ty) {
    const e = makeTree(id, x, y, 'palm_0', tx, ty);
    e.kind = coconut ? 'fruittree' : 'tree';
    e.fruit = coconut ? 'coconut' : null;
    e.hit = { x: x - 14, y: y - 42, w: 28, h: 44 };
    e.draw = (ctx) => {
        const sx = e.shake ? Math.round(Math.sin(e.shake * 1.3) * 1.5) : 0;
        spr(ctx, (e.fruit && treeHasFruit(e)) ? 'palm_1' : 'palm_0', e.x + sx, e.y);
    };
    return e;
}

/* ---------------------------------------------------------------- interiors */
const HOUSE_SIZES = [[7, 5], [9, 6], [11, 7], [13, 8], [15, 9]];
function buildHome() {
    const [fw, fh] = HOUSE_SIZES[S.house.level];
    const a = new Area('home', fw + 2, fh + 4);
    // layout: row 0-1 back wall, rows 2..fh+1 floor, row fh+2 front wall with door, cols 0 and w-1 side walls
    for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) {
        const floor = x >= 1 && x <= fw && y >= 2 && y <= fh + 1;
        a.blocked[y * a.w + x] = floor ? 0 : 1;
    }
    a.floor = { x0: 1, y0: 2, w: fw, h: fh };
    a.doorTile = [1 + Math.floor(fw / 2), fh + 2];
    a.block(a.doorTile[0], a.doorTile[1], 0);
    a.exitY = (fh + 3) * TILE - 4;
    a.interior = true;
    a.building = 'home';
    placeFurniture(a);
    buildRoomBg(a);
    return a;
}
function buildClub() {
    const fw = 12, fh = 8;
    const a = new Area('club', fw + 2, fh + 4);
    for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) {
        const floor = x >= 1 && x <= fw && y >= 2 && y <= fh + 1;
        a.blocked[y * a.w + x] = floor ? 0 : 1;
    }
    a.floor = { x0: 1, y0: 2, w: fw, h: fh };
    a.doorTile = [1 + Math.floor(fw / 2), fh + 2];
    a.block(a.doorTile[0], a.doorTile[1], 0);
    a.exitY = (fh + 3) * TILE - 4;
    a.interior = true;
    a.building = 'club';
    a.club = true;
    buildClubContents(a);
    buildRoomBg(a);
    return a;
}

/* the cart is only solid while it's out */
function updateCart() {
    const c = G.cart, a = G.areas.island;
    if (!c || !a) return;
    const out = hourIn(Clock.hourF(), 21, 27);
    if (out === c.solid) return;
    c.solid = out;
    for (const [x, y] of c.tiles) a.block(x, y, out ? 1 : 0);
    const p = G.player;
    if (out && p && G.area === a && c.tiles.some(([x, y]) => Math.floor(p.x / TILE) === x && Math.floor(p.y / TILE) === y)) p.y = (W0.cart.y + 1) * TILE + 8;
}

/* ---------------------------------------------------------------- waterfalls, the windmill, the lookout */
function addWaterfall(a, wf) {
    const xs = wf.tiles.map(t => t[0]), ys = wf.tiles.map(t => t[1]);
    const x0 = Math.min(...xs) * TILE, x1 = (Math.max(...xs) + 1) * TILE, y0 = Math.min(...ys) * TILE, y1 = (Math.max(...ys) + 1) * TILE;
    const e = a.add({ kind: 'waterfall', x: (x0 + x1) / 2, y: y1, layer: 0 });
    e.draw = ctx => {
        const t = G.t;
        // falling streaks
        for (let x = x0 + 1; x < x1 - 1; x += 3) {
            const off = (t * 2 + x * 7) % 24;
            ctx.fillStyle = 'rgba(255,255,255,0.75)';
            for (let y = y0 - 24 + off; y < y1; y += 24) {
                const a0 = Math.max(y0, y), a1 = Math.min(y1, y + 9);
                if (a1 > a0) ctx.fillRect(x, a0, 1, a1 - a0);
            }
        }
        // spray at the foot
        for (let i = 0; i < 7; i++) {
            const k = (t + i * 13) % 40;
            const sx = x0 + ((i * 37 + (t >> 3)) % (x1 - x0)), sy = y1 + 2 - k * 0.25;
            ctx.fillStyle = `rgba(255,255,255,${0.8 - k / 50})`;
            ctx.fillRect(Math.round(sx), Math.round(sy), 2, 2);
        }
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(x0 - 3, y1 - 1, x1 - x0 + 6, 3);
    };
    return e;
}
function drawWindmill(ctx, e) {
    spr(ctx, 'windmill', e.x, e.y);
    const blades = Math.floor(G.t / 14) % 4;
    spr(ctx, 'windmill_blades_' + blades, e.x, e.y - 64);
}
async function useTelescope() {
    const star = Quests.starVisible();
    const k = await UI.ask(null, star ? 'The lookout telescope. Up in the night sky, one star seems to be blinking...' : 'The lookout telescope. Where should Sarah look?', ['Out to sea', 'Down at the island', 'Never mind']);
    if (k === 0) await lookoutView();
    else if (k === 1) await UI.say(null, lookoutTelescope());
}
function lookoutTelescope() {
    Sfx.play('pick');
    const sights = ["Sarah looks through the telescope. She can see her house! It looks tiny. It looks CUTE.",
        'Through the telescope: the whole town, the pier, and Joe on the bench, writing something. Probably about the telescope.',
        "Through the telescope: Cuke, jogging. Tiny Cuke. Tiny, energetic Cuke.",
        'Through the telescope: the farm, the windmill, and a lot of pumpkins that look extremely pleased with themselves.',
        "Through the telescope: the sea goes on forever. Somewhere out there, a boat is going somewhere. Good for it."];
    return rpick(sights);
}

