/* ---- 33kd_doll_idle.js ---- */
/* What the neighbors do when they're not busy (David, 27 October: "lots of things they do when they're not busy, each
   its own animation ... so they feel alive"): look up at the stars at night, eat an ice cream, sit on the ground, look
   at their phone, read a book, paint at an easel, sip a mug of cocoa. idleStart (from updateNPC, 22_npc.js) picks one
   now and then for someone standing about with nothing to do (n.idle: its kind and when it ends); in the new look the
   dolls and folks act it out with the thing in hand (props2.py's style_book, style_phone...), the flat views just
   show them standing. Anything else (a chat, Sarah talking to them, their day moving on) ends it. */
const IDLE_ACTS = {
    stars: { hand: null, face: 'happy' },
    snack: { hand: 'style_snack', face: 'happy' },
    phone: { hand: 'style_phone', face: 'idle' },
    book: { hand: 'style_book', face: 'idle' },
    ground: { hand: null, face: 'happy' },
    paint: { hand: 'style_brush', left: 'style_palette', stand: 'furn_easel', face: 'determined' },
    cup: { hand: 'style_cup', face: 'happy' },
    // (a doll fishes in the game's own fishing pose, rod and all; a folk holds the rod out over the water)
    fish: { hand: null, folkHand: 'style_rod', face: 'determined' },
    // (only when their day says so: watering the farm's fields, 22_npc.js farmOverride)
    tend: { hand: 'furn_watering_can', face: 'happy' },
};
/* what's carried on the way somewhere: a suitcase to or from a vacation, the farm's basket to the shop, the catch */
const CARRY = { suitcase: { hand: 'style_suitcase', face: 'happy' }, crate: { hand: 'style_basket', face: 'happy' }, catch: { hand: 'style_bucket', face: 'happy' },
    groceries: { hand: 'style_grocery', face: 'happy' } };
/* what they say when Sarah comes up to them in the middle of it */
const IDLE_HELLO = {
    stars: ['Did you see that one? It winked.', "I'm counting stars. I'm at four. I keep starting over.", 'Look up! The sky is showing off tonight.'],
    snack: ['Want a lick? ...Of the ice cream. No? More for me.', 'Ice cream for lunch. And for second lunch.', "Brain freeze! Worth it."],
    phone: ['Oh! Hi! I was just texting. ...Myself. A reminder to say hi to you. Hi!', "Sorry, I was looking at pictures of soup. Don't tell Wonton.", 'One sec. ...Okay! I\'m here. Mentally and everything.'],
    book: ["I was just at a good part! It's fine. I'll find my page.", "It's a mystery. I think the butler did it. There is no butler.", 'Shh! ...Oh, it\'s you. Hi! Shh.'],
    ground: ['Sit with me! The grass is soft today.', "I'm watching the clouds. That one's a dumpling.", 'Sometimes you just have to sit on the ground. It\'s the law.'],
    paint: ["Don't look yet! It's a surprise. It's the goat.", "I'm painting the island. It keeps moving. The clouds, mostly.", 'Does this look like a tree to you? Be honest. Be kind.'],
    cup: ["Cocoa? I'd share, but it's my third.", 'Nothing like something warm in a mug. Except maybe two mugs.', "Careful, it's hot. I learned that the hard way. Twice."],
    fish: ["Shh! They're biting! ...Okay, they're not. But they might!", "I've caught three boots today. It's a boot day.", 'The trick is patience. And snacks. Mostly snacks.'],
    tend: ["Morning! The tomatoes like a drink before it gets hot. So do I.", 'Water, sun, a little pep talk. That\'s farming. The pep talk is the important part.', "Don't step on the carrots! They're shy."],
    crate: ["Fresh from the farm! I'm taking it to Fortune's. Carrots, tomatoes, a cabbage. And a cucumber. Not me. A different cucumber.", 'Delivery! The shop gets the best of the fields every morning. You can buy it there!'],
    catch: ["Look at this haul, dude! Well. Two fish. A haul is a state of mind.", "Off to sell these at Fortune's. Bro. The bucket's heavy. Respectfully."],
    groceries: ["Just did my shopping! Fortune had the farm's carrots in this morning. Still a little muddy. That's how you know.", "Groceries! I have a plan for dinner. The plan is: everything in this bag.", "I only went in for bread. Look at this bag. LOOK at it."],
};
/* who likes what (picked four times as often) */
const IDLE_LIKES = { joe: 'book', brulee: 'paint', coco: 'phone', sully: 'cup', mac: 'snack', cece: 'snack', clementine: 'paint', kai: 'fish', cuke: 'stars', maki: 'book', chili: 'phone', ginger: 'cup', basil: 'ground', wonton: 'cup', david: 'phone', james: 'book', john: 'snack', elizabeth: 'paint' };

function idleStart(n) {
    const d = n.def, w = n.want;
    if (n.fixed || !n.anchor || d.goat || d.spring || d.dj || d.shop || n.dancer || isSeated(n) || isLounging(n) || (w && (w.playing || w.sit || w.seat || w.jog || w.lounge || w.sleep || w.bags || w.carry))) return;
    const h = Clock.hourF(), out = n.area === 'island', wet = G.weather === 'rain' || G.weather === 'snow';
    const tx = Math.floor(n.x / TILE), ty = Math.floor((n.y - 2) / TILE), a = G.areas[n.area];
    // (their day says what: watering the fields, or a line in the water where there's water ahead)
    if (w && w.tend && out) { n.idle = { kind: 'tend', until: G.t + 900 + rint(0, 600) }; return; }
    if (w && w.fish && out) { const wt = idleWater(n, a); if (wt) { n.idle = { kind: 'fish', until: G.t + 1200 + rint(0, 900) }; faceNpc(n, { x: (wt[0] + 0.5) * TILE, y: (wt[1] + 0.5) * TILE }); } return; }
    const can = {
        stars: out && (h >= 20.5 || h < 4.5) && G.weather !== 'rain' && G.weather !== 'cloudy',
        snack: h >= 11 && h < 20 && G.weather !== 'snow',
        phone: true,
        book: !(out && wet),
        ground: out && !wet && h >= 9 && h < 19 && !pathAt(tx, ty) && 'gs'.includes(groundChar(tx, ty)),
        paint: out && !wet && h >= 8 && h < 18 && !!a && !a.blockedAt(tx, ty - 1),
        cup: h < 11 || h >= 17,
        fish: out && h >= 6 && h < 20 && !!idleWater(n, a),
    };
    const like = IDLE_LIKES[n.id], pool = Object.keys(can).filter(k => can[k]).map(k => [k, k === like ? 4 : 1]);
    if (!pool.length) return;
    const kind = weighted(pool, R);
    n.idle = { kind, until: G.t + 600 + rint(0, 900) };
    // (the painter faces the easel, its canvas toward us; the stargazer and the one on the grass face us)
    if (kind === 'paint') { n.dir = 'up'; n.flip = false; }
    else if (kind === 'fish') { const w = idleWater(n, a); faceNpc(n, { x: (w[0] + 0.5) * TILE, y: (w[1] + 0.5) * TILE }); }
    else if (kind === 'stars' || kind === 'ground') n.dir = 'down';
}

/* water a tile or two from where they stand, straight ahead in one of the four ways (somewhere to cast a line) */
function idleWater(n, a) {
    const tx = Math.floor(n.x / TILE), ty = Math.floor((n.y - 2) / TILE);
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) for (const k of [1, 2]) if (a && a.waterAt(tx + dx * k, ty + dy * k)) return [tx + dx * k, ty + dy * k];
    return null;
}

Object.assign(EnvDolls, {
    /* the thing in hand (and the painter's easel), put on or taken off as what they're doing changes; a suitcase for
       whoever's off on vacation or back from one (6zj_vacations.js) */
    idleHold(d, e) {
        const carry = e.want && (e.want.carry || (e.want.bags ? 'suitcase' : null));
        const I = carry ? CARRY[carry] : e.idle && !e.moving && IDLE_ACTS[e.idle.kind], key = carry ? 'carry:' + carry : I ? e.idle.kind : '';
        if (d.idleKey === key) return;
        for (const g of d.idleThings || []) if (g.parent) g.parent.remove(g);
        d.idleThings = []; d.idleKey = key;
        if (!I) return;
        const has = n => typeof EnvModels !== 'undefined' && EnvModels.has(n);
        const model = (name) => { const g = new THREE.Group(); for (const p of EnvModels.models[name].parts) { const m = new THREE.Mesh(p.geometry, p.material); m.castShadow = true; g.add(m); } return g; };
        const put = (name, side) => {
            if (!name || !has(name)) return;
            // (a doll holds the watering can the way Sarah does, hanging from its handle)
            if (name === 'furn_watering_can' && !d.folk) { const g = this.canModel(d, d.parts.elR || d.parts.armR, -0.1); if (g) d.idleThings.push(g); return; }
            const g = model(name), O = this.HOLD[name] || [0, 0, 0, 0, 0, 0];
            g.rotation.set(O[3], O[4], O[5]);
            if (d.folk) {
                const arm = d.parts.arms.find(a => a.userData.side === side) || d.parts.arms[0];
                if (!arm) return;
                // (a folk is a chunky toy: what it holds is a little bigger, so it reads in its stubby hand)
                const at = this.handOf(arm);
                g.scale.setScalar(name === 'style_rod' ? 0.8 : name === 'furn_watering_can' ? 0.6 : 1.4);
                g.position.set(at.x + O[0] * side, at.y + O[1], at.z + O[2]);
                arm.add(g);
            } else {
                const fore = side > 0 ? d.parts.elR || d.parts.armR : d.parts.elL || d.parts.armL;
                g.scale.setScalar(1 / (d.v2 ? DOLL2.H : DOLL.H));
                g.position.set(O[0] * side, (d.v2 ? -0.1 : -0.245) + O[1], 0.01 + O[2]);
                fore.add(g);
            }
            d.idleThings.push(g);
        };
        put(d.folk ? I.folkHand || I.hand : I.hand, 1);
        put(I.left, -1);
        // the easel stands on the ground in front of them and a little to the side, turned toward them, so the canvas
        // shows past them (they face away from us to paint)
        if (I.stand && has(I.stand)) {
            const g = model(I.stand), s = d.folk ? 1 : 1 / (d.v2 ? DOLL2.H : DOLL.H);
            g.scale.setScalar(s * 0.85);
            g.position.set(-0.42 * s, 0, 0.5 * s);
            g.rotation.y = Math.PI - 0.6;
            d.root.add(g);
            d.idleThings.push(g);
        }
    },
    /* how each thing sits in the hand: offset [x (out from the body), y (along the arm), z] and turn [x, y, z] */
    HOLD: {
        style_phone: [-0.02, -0.04, 0.02, 0, 0, 0],
        style_book: [-0.07, -0.04, 0.03, 0, 0, 0],
        style_snack: [0, -0.03, 0.03, Math.PI / 2, 0, 0],
        style_cup: [0, -0.03, 0.04, Math.PI / 2, 0, 0],
        style_brush: [0, -0.02, 0.02, Math.PI, 0, 0],
        style_palette: [0, -0.02, 0.03, 0, 0, 0],
        style_suitcase: [0.02, -0.02, 0, 0, Math.PI / 2, 0],
        style_rod: [0, -0.02, 0.02, 1.2, 0, 0],
        style_basket: [0.02, -0.02, 0.02, 0, Math.PI / 2, 0],
        style_bucket: [0.02, -0.02, 0.02, 0, Math.PI / 2, 0],
        style_grocery: [0.02, -0.02, 0.02, 0, Math.PI / 2, 0],
        furn_watering_can: [0.02, -0.06, 0.04, 0, -Math.PI / 2, 0],
    },
    /* a folk's hand: the point of its arm furthest from the shoulder */
    handOf(arm) {
        if (arm.userData.hand) return arm.userData.hand;
        let best = new THREE.Vector3(), far = -1;
        arm.traverse(o => {
            const P = o.isMesh && o.geometry.attributes.position;
            if (!P) return;
            for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), r = x * x + y * y + z * z; if (r > far) { far = r; best.set(x, y, z); } }
        });
        return (arm.userData.hand = best);
    },
    /* a redone doll's joints for what they're doing (pose2's W): the ice cream raised for a lick now and then, the phone
       and the book held up and looked down at, head back to the stars, sitting on the grass leaning back on their hands,
       dabbing at the canvas with the palette in the other hand */
    idleDoll(e, W, t, seed) {
        const k = e.idle.kind;
        const lift = (period, len) => { const ph = (t + seed * 7) % period; return ph < len ? Math.sin(ph / len * Math.PI) : 0; };
        if (k === 'stars') Object.assign(W, { hx: -0.5, bx: -0.06, aLx: 0.35, aRx: 0.35, aLz: -0.12, aRz: 0.12, eL: -0.7, eR: -0.7 });
        else if (k === 'snack' || k === 'cup') {
            const b = k === 'snack' ? lift(170, 36) : lift(240, 54);
            Object.assign(W, { aRx: -0.55 - 0.85 * b, eR: -1.15 - 0.5 * b, aRz: 0.25 - 0.12 * b, hx: W.hx + 0.08 * b });
        } else if (k === 'phone') Object.assign(W, { aRx: -0.6, eR: -1.35 + Math.sin(t / 5) * 0.03, aRz: 0.06, aLx: -0.5, eL: -1.3, aLz: -0.06, hx: 0.32 });
        else if (k === 'book') {
            const turn = lift(320, 30);
            Object.assign(W, { aLx: -0.62, aRx: -0.62 - 0.2 * turn, eL: -1.25, eR: -1.25, aLz: -0.04, aRz: 0.04 + 0.3 * turn, hx: 0.26 });
        } else if (k === 'ground') Object.assign(W, { lL: -1.45, lR: -1.45, kL: 0.25, kR: 0.3, aLx: 0.55, aRx: 0.55, aLz: -0.45, aRz: 0.45, eL: -0.1, eR: -0.1, bx: -0.14, hx: -0.12, by: 0 });
        else if (k === 'paint') Object.assign(W, { aRx: -1.15 + Math.sin(t / 9 + seed) * 0.14, eR: -0.5, aRz: 0.15, aLx: -0.45, eL: -1.2, aLz: -0.35, hx: -0.04 });
        else if (k === 'tend') Object.assign(W, { aRx: -0.45 - 0.3 * lift(150, 60), eR: -0.35, aRz: 0.12, hx: 0.22, bx: 0.06 });
    },
    /* a folk's: its arms ({ up, fwd } for the right, side +1, and the left), how it leans */
    idleFolk(e, t, seed) {
        const k = e.idle.kind, ph = (t + seed * 7);
        const lift = (period, len) => { const p = ph % period; return p < len ? Math.sin(p / len * Math.PI) : 0; };
        if (k === 'stars') return { lean: -0.36, R: { up: 0.15, fwd: 0 }, L: { up: 0.15, fwd: 0 } };
        if (k === 'snack' || k === 'cup') { const b = k === 'snack' ? lift(170, 36) : lift(240, 54); return { lean: 0.06 * b, R: { up: 0.35 + 0.5 * b, fwd: -0.9 }, L: null }; }
        if (k === 'phone' || k === 'book') return { lean: 0.12, R: { up: 0.3, fwd: -1.0 }, L: { up: 0.3, fwd: -1.0 } };
        if (k === 'fish') return { lean: 0.04, R: { up: 0.55 + Math.sin(t / 40 + seed) * 0.04, fwd: -1.1 }, L: { up: 0.4, fwd: -1.0 } };
        if (k === 'paint') return { lean: 0.05, R: { up: 0.5 + Math.sin(t / 9 + seed) * 0.15, fwd: -1.0 }, L: { up: 0.2, fwd: -0.4 } };
        if (k === 'tend') { const b = lift(150, 60); return { lean: 0.1 + 0.08 * b, R: { up: 0.3 + 0.3 * b, fwd: -0.9 }, L: null }; }
        return { lean: 0, R: null, L: null };
    },
});
