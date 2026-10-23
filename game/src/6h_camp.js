/* ---- 6h_camp.js ---- */
/* David's statue (and its plaque), the bonfire on the beach, the campsite up in the forest where visitors pitch their
   tents, and the old giants of the forest that no axe will ever touch. */

/* ---------------------------------------------------------------- David's statue */
const PLAQUE_LINES = ['David rulz okay????'];
async function readPlaque() {
    Sfx.play('pick');
    await UI.say('plaque', PLAQUE_LINES.map(l => l.replace('{island}', S.islandName || 'this island')).join('\n'), { letter: true });
}
async function davidStatue() {
    const dv = NPCs.get('david');
    const near = dv && !dv.sleeping && dv.area === G.area.id && Math.hypot(dv.x - G.player.x, dv.y - G.player.y) < 90;
    if (near) {
        await UI.say('david', rpick(["Honey. Look at him. Look at ME. The sculptor got my good side. Both of my sides are my good side.",
            'I come here every visit. For the view. The view is me.', "They wanted me to hold still for the sculptor. I did not hold still. Somehow it still worked."]));
        return;
    }
    await UI.say(null, rpick([
        'A statue of David mid-pose: sunglasses on, one finger pointed at the sky, roller skates polished to a shine. Even in marble, he is serving.',
        "David's statue. The pose is very cool. The plaque in front explains exactly how cool.",
        "Somebody left a flower by the statue's skates. It was probably David. It was definitely David.",
        'A pigeon is sitting on the statue\'s pointing finger. The pigeon looks cool too. It\'s the statue\'s energy.',
    ]));
}

/* ---------------------------------------------------------------- fire (the bonfire, and the fire ring at the campsite) */
function bonfireLit() { return hourIn(Clock.hourF(), 18, 27) && G.weather !== 'rain'; }
function campfireLit() { return hourIn(Clock.hourF(), 18, 26.5) && visitorsToday().length > 0 && G.weather !== 'rain'; }
function drawFlames(ctx, x, y, big) {
    const t = G.t;
    const k = big ? 1 : 0.62;
    // a few flickering tongues of flame, drawn in layers: red, orange, yellow, a white-hot core
    const layers = [['#e2442a', 9, 13], ['#f7962d', 7, 10], ['#ffd84a', 5, 7], ['#fff6d0', 2, 3]];
    for (const [c, w, h] of layers) {
        ctx.fillStyle = c;
        for (let i = -1; i <= 1; i++) {
            const wob = Math.sin(t / 5 + i * 2.1 + w) * 1.2;
            const hh = Math.round((h + Math.sin(t / 3.3 + i * 1.7) * 2) * k);
            const ww = Math.max(1, Math.round((w / 3) * k));
            const cx = Math.round(x + i * w * 0.3 * k + wob * k);
            for (let r = 0; r < hh; r++) {
                const narrow = Math.max(1, Math.round(ww * (1 - r / hh)));
                ctx.fillRect(cx - (narrow >> 1), Math.round(y - r), narrow, 1);
            }
        }
    }
    // sparks drifting up
    for (let i = 0; i < (big ? 4 : 2); i++) {
        const ph = (t * 0.7 + i * 23) % 40;
        ctx.fillStyle = `rgba(255,${180 + (i * 17) % 60},80,${1 - ph / 40})`;
        ctx.fillRect(Math.round(x + Math.sin((t + i * 40) / 11) * 5 * k), Math.round(y - 8 * k - ph * 0.7), 1, 1);
    }
}
function drawSmoke(ctx, x, y) {
    for (let i = 0; i < 3; i++) {
        const ph = (G.t * 0.35 + i * 20) % 60;
        ctx.fillStyle = `rgba(210,210,220,${0.45 * (1 - ph / 60)})`;
        ctx.fillRect(Math.round(x + Math.sin((G.t + i * 50) / 30) * 3), Math.round(y - 4 - ph * 0.5), 2, 2);
    }
}
function drawBonfire(ctx, e) {
    spr(ctx, 'bonfire', e.x, e.y);
    const lit = bonfireLit();
    if (lit) drawFlames(ctx, e.x, e.y - 5, true); else drawSmoke(ctx, e.x, e.y - 6);
    e.light = lit ? { r: 76 + Math.round(Math.sin(G.t / 4) * 3), y: -8, c: 'fire' } : null;
}
function drawCampfire(ctx, e) {
    spr(ctx, 'campfire', e.x, e.y);
    const lit = campfireLit();
    if (lit) drawFlames(ctx, e.x, e.y - 4, false);
    e.light = lit ? { r: 52 + Math.round(Math.sin(G.t / 4) * 2), y: -6, c: 'fire' } : null;
}
async function roastMarshmallow() {
    if (!pocketCount('marshmallow')) return false;
    const k = await UI.ask(null, 'Roast a marshmallow?', ['Roast one', 'Not now']);
    if (k !== 0) return true;
    removeItem('marshmallow', 1);
    G.busy++;                                   // hold still: it's a delicate operation
    try {
        G.player.pose = 'pick'; G.player.poseT = 40;
        Sfx.play('pick');
        await waitFrames(40);
        const burnt = R() < 0.2;
        await UI.say(null, burnt ? 'Sarah holds it a little too close. FWOOMP. It is on fire. She blows it out. It is extremely crispy. She loves it anyway.'
            : rpick(['Sarah turns the marshmallow slowly until it is perfectly golden. Patience. Discipline. Snack.',
                'Golden brown, gooey in the middle. A perfect marshmallow. Sarah should be very proud. She is.']));
        receive(burnt ? 'marshmallow_burnt' : 'marshmallow_toasted', 1);
        S.stats.marshmallows = (S.stats.marshmallows || 0) + 1;
    } finally { G.busy = Math.max(0, G.busy - 1); }
    return true;
}
async function useBonfire() {
    if (!bonfireLit()) {
        await UI.say(null, G.weather === 'rain' ? "The rain put the bonfire out. It'll be back tomorrow evening." : 'Just warm embers for now. The bonfire gets lit every evening around 6.');
        return;
    }
    if (await roastMarshmallow()) return;
    await UI.say(null, rpick(['Sarah warms her hands by the fire. The waves are loud and the fire is louder. It is perfect.',
        'The fire crackles. Somebody out there is playing a ukulele, badly. It adds to it.',
        "Sarah watches the sparks float up toward the stars. It's the best TV on the island.",
        "It would be perfect for marshmallows. Fortune sells them. Just saying."]));
}
async function useCampfire() {
    if (!campfireLit()) {
        await UI.say(null, visitorsToday().length ? 'A ring of stones with a fire laid and ready. Somebody will light it after dinner.' : 'A ring of stones for a campfire. It gets lit when somebody is camping.');
        return;
    }
    if (await roastMarshmallow()) return;
    await UI.say(null, rpick(['The campfire pops and hisses. The whole clearing smells like pine smoke.', 'Sarah sits by the campfire for a bit. An owl says something. Probably about marshmallows.']));
}

/* ---------------------------------------------------------------- tents at the campsite */
const TENT_COLORS = ['tent_coral', 'tent_green', 'tent_blue'];
function tentOccupant(i) { return visitorsToday().find(id => tentOf(id) === i) || null; }
function drawTent(ctx, e) {
    const who = tentOccupant(e.tent), n = who && NPCs.get(who);
    const asleep = n && n.sleeping && hourIn(Clock.hourF(), 19, 29);
    spr(ctx, TENT_COLORS[e.tent % 3] + (who ? '' : '_closed'), e.x, e.y);
    if (asleep && (G.t >> 5) % 3 === 0) spr(ctx, 'emote_zzz', e.x + 12, e.y - 30);
    e.light = asleep ? { r: 26, y: -10 } : null;
}
async function useTent(e) {
    const who = tentOccupant(e.tent);
    if (!who) { await UI.say(null, 'An empty tent, pitched and ready for whoever comes over on the boat next.'); return; }
    const n = NPCs.get(who), nm = NPC_DEFS[who].name;
    if (n && n.sleeping) {
        await UI.say(null, who === 'david' ? 'Zzz. David is asleep in the tent. The tent is snoring. Fabulously.' : `Zzz. ${nm} is asleep in there. Sarah tiptoes away.`);
        return;
    }
    const inside = { david: 'a sleeping bag, a disco ball, a tiny mirror and a second, backup disco ball' }[who] || 'a sleeping bag, a flashlight and a camping mug';
    await UI.say(null, `${nm}'s tent. Inside: ${inside}.`);
}

/* ---------------------------------------------------------------- the old giants */
async function oldTreeTalk(e) {
    if (heldTool() === 'axe') { await UI.say(null, 'Sarah looks at the axe. She looks at the tree. The tree has been here for three hundred years. Sarah puts the axe away.'); return; }
    e.shake = 10;
    await UI.say(null, rpick([
        "One of the forest's old giants. Its trunk is wider than Sarah's front door. It was here before the island had a name.",
        "Sarah hugs the old tree. She can't reach around it. Not even close. It feels like being hugged back, very slowly.",
        'The old tree creaks in the wind like it is telling a very long story. Sarah listens for a while.',
        "Way up high, somebody carved 'G + THE FOREST'. That's Ginger's handwriting. There must have been a ladder.",
        'Moss, ferns, a mushroom that looks like a tiny umbrella. The old tree is its own little neighborhood.',
    ]));
    if (typeof Critters !== 'undefined') Critters.startle(e.x, e.y - 30, 90);
}

