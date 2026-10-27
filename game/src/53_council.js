/* ---- 53_council.js ---- */
/* The Cozy Council: three very serious heads of broccoli rate the house */
function councilScore() {
    const items = S.house.items.map(it => furnDef(it.id)).filter(Boolean);
    const n = items.length;
    const count = f => items.filter(f).length;
    const lights = count(d => d.light), rugs = count(d => d.kind === 'rug'), soft = count(d => d.soft), plants = count(d => d.plant);
    const wallSet = GD.wallTheme[S.house.wall], floorSet = GD.floorTheme[S.house.floor];
    // Sir Floret: coziness
    let a = 1 + Math.min(3, lights) * 1.1 + Math.min(2, rugs) * 0.8 + Math.min(3, soft) * 0.7 + Math.min(3, plants) * 0.5
        + (S.house.wall !== 'wall_cream' ? 0.6 : 0) + (S.house.floor !== 'floor_wood' ? 0.4 : 0) + Math.min(1, n / 12);
    // Dame Stalk: themes
    const sets = {};
    for (const d of items) for (const s of d.sets) if (!['friends', 'council', 'holiday', 'family', 'food'].includes(s)) sets[s] = (sets[s] || 0) + 1;
    if (wallSet) sets[wallSet] = (sets[wallSet] || 0) + 1;
    if (floorSet) sets[floorSet] = (sets[floorSet] || 0) + 1;
    let bestSet = null, best = 0;
    for (const [k, v] of Object.entries(sets)) if (v > best) { best = v; bestSet = k; }
    const strong = Object.values(sets).filter(v => v >= 3).length;
    let b = 1 + Math.min(5, best) * 1.05 + (strong >= 2 ? 1 : 0) + Math.min(n, 24) / 12 + (wallSet && wallSet === floorSet ? 1 : 0);
    // Little Sprout: joy (friends' photos, food on display, fun things, variety)
    const photos = count(d => d.photo);
    const food = count(d => d.food);
    const fun = count(d => d.anim || d.disco || d.stars || ['family', 'club', 'rainbow', 'poet', 'holiday', 'pottery'].some(s => d.sets.includes(s)));
    const variety = Object.keys(sets).length;
    let c = 1 + Math.min(4, photos) * 0.8 + Math.min(3, food) * 0.7 + Math.min(4, fun) * 0.55 + Math.min(6, variety) * 0.4;
    const broccoli = S.house.items.some(it => it.id === 'stir_fry' || it.id === 'broccoli');
    const r5 = v => Math.round(clamp(v, 1, 10) * 2) / 2;
    const out = { floret: r5(a), stalk: r5(b), sprout: r5(c), bestSet, n, broccoli };
    out.total = out.floret + out.stalk + out.sprout;
    return out;
}
function councilTier(total) { return total >= 27 ? 3 : total >= 21 ? 2 : total >= 15 ? 1 : 0; }
const TIER_NAMES = ['Cute', 'Very cute', 'Adorable', 'The Cutest House on the Island'];

async function appCouncil() {
    if (G.area.id !== 'home') {
        const P = UI.open({ title: 'The Cozy Council', phone: true, back: backToPhone });
        P.body.appendChild(el('p', 'muted', 'The Council visits your home in person. Go home, then call from your phone.'));
        if (S.council.best) P.body.appendChild(el('p', null, `Best score so far: ${S.council.best} / 30 (${TIER_NAMES[councilTier(S.council.best)]})`));
        return;
    }
    UI.close(true);
    if (S.council.lastDay === Clock.dayNum()) { await UI.say('council', 'The Council has already deliberated today. The Council needs its rest. The Council is broccoli.'); return; }
    await councilVisit();
}

async function councilVisit() {
    G.busy++;
    const a = G.area, p = G.player;
    const f = a.floor;
    const spots = openSpots(a, 3, f.x0 + f.w / 2 - 0.5, f.y0 + f.h / 2).sort((q, r) => q[0] - r[0]);
    const judges = ['floret', 'stalk', 'sprout'].map((id, i) => {
        const e = { kind: 'judge', frame: `${id}_0`, x: (spots[i][0] + 0.5) * TILE, y: (spots[i][1] + 1) * TILE - 2 };
        a.add(e);
        return e;
    });
    faceToward(p, judges[1]);
    Sfx.play('door');
    await waitFrames(20);
    const sc = councilScore();
    S.council.lastDay = Clock.dayNum();
    await UI.say('floret', 'The Cozy Council is now in session.', { keep: true });
    await UI.say('stalk', 'We are three very serious heads of broccoli. We will now evaluate your home.', { keep: true });
    await UI.say('sprout', "I'm the little one!", { keep: true });
    if (sc.broccoli) {
        await UI.say('sprout', 'Is that... is that a broccoli dish? On DISPLAY? *faints*', { keep: true });
        judges[2].frame = 'sprout_1';
        sc.sprout = Math.max(1, sc.sprout - 2);
        sc.total = sc.floret + sc.stalk + sc.sprout;
    }
    const line = (s, low, mid, high) => (s <= 4 ? low : s <= 7 ? mid : high);
    const setName = sc.bestSet ? SET_NAMES[sc.bestSet] || sc.bestSet : 'mystery';
    await UI.say('floret', `Coziness: ${sc.floret}. ` + line(sc.floret, 'It is very... echo-y in here. A lamp, perhaps? A rug?', 'Warm. Soft. Getting there. More lamps. Lamps are love.', 'The lighting! The soft things! Exquisite. I feel held.'), { keep: true });
    await UI.say('stalk', `Theme: ${sc.stalk}. ` + line(sc.stalk, "The theme appears to be 'stuff.'", `I sense a ${setName} theme emerging. Commit to it.`, `A cohesive vision. The ${setName} theme sings. Matching walls, matching floors. Chef's kiss.`), { keep: true });
    await UI.say('sprout', `Joy: ${sc.sprout}. ` + line(sc.sprout, 'Can we get a friend photo in here? Or a snack on display? Snacks are joy.', 'I like it here! I like the fun stuff!', 'I LOVE IT HERE. I want to live here. Can I live here? I am a vegetable.'), { keep: true });
    const tier = councilTier(sc.total);
    const firstBest = sc.total > S.council.best;
    S.council.best = Math.max(S.council.best, sc.total);
    Sfx.play(tier >= 2 ? 'fanfare' : 'item');
    await UI.say('council', `Total: ${sc.total} out of 30. The Council declares this house: ${TIER_NAMES[tier].toUpperCase()}!`, { keep: true });
    const plaque = [null, 'plaque_bronze', 'plaque_silver', 'plaque_gold'][tier];
    if (plaque && !S.council.plaques.includes(plaque)) {
        S.council.plaques.push(plaque);
        receive(plaque, 1);
        await UI.say('floret', `Please accept this ${itemName(plaque).toLowerCase()}. Display it with pride. Or at least with a lamp nearby.`, { keep: true });
    } else if (tier < 3) {
        await UI.say('stalk', rpick(['We will return tomorrow. Surprise us.', 'Try more of one theme. Walls and floors count too.', 'Friends\' photos and food on display make Little Sprout very happy.']), { keep: true });
    }
    UI.hideDialog();
    for (const j of judges) a.remove(j);
    Save.touch();
    G.busy--;
    Bus.emit('council', sc.total);
}

