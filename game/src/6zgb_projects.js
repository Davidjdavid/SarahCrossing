/* ---- 6zgb_projects.js ---- */
/* The town's projects (David, 27 October late), paid for at the Town Hall like Animal Crossing's public works: a swing
   set on the village green, a hammock on the beach, a park clock by the square, a stone tablet on the mountain top,
   restoring the lighthouse (its door boarded up till then; restoring it opens the old keeper's story), and last and
   dearest, a statue of Sarah (Fortune's bigger store was one too, till Fortune took it on: 6z_shops.js). Sand dollars
   go in a little at a time, to any project; once one's paid off, the Cozy Council has it built overnight (it's there
   the next morning, with a letter). Where each stands is in the plan (scripts/island/plan.mjs projects, W0.projects),
   its prop in W0.props with `project`: left off the island until it's built. Its spot isn't kept free (David, 28 October):
   whatever of Sarah's stands there when it goes up comes back to her storage (projectClear). Kept as S.town.proj
   { paid: { id: n }, done: { id: day it's there } }. */
const PROJECTS = [
    { id: 'swings', name: 'A swing set', cost: 30000, where: 'on the village green', icon: 'app_map',
        blurb: 'Two swings on a wooden frame. Swinging is free forever. The Council checked.' },
    { id: 'hammock', name: 'A hammock on the beach', cost: 20000, where: 'on the west beach', icon: 'app_map',
        blurb: 'A striped hammock between two posts, for listening to the waves.' },
    { id: 'clock', name: 'A park clock', cost: 50000, where: 'on the lawn east of the square', icon: 'app_calendar',
        blurb: 'A tall green clock with two faces, so nobody is ever late. (Joe will still be late.)' },
    { id: 'lighthouse', name: 'Restore the lighthouse', cost: 100000, where: 'on the south-east point', icon: 'app_map',
        blurb: 'Pry off the boards, fix the stairs, polish the lamp room. Some say someone still climbs up there at night.' },
    { id: 'shrine', name: 'A stone tablet on the mountain top', cost: 80000, where: 'at the summit', icon: 'app_map',
        blurb: 'An old carved stone with a lantern each side. Make a wish there once a day.' },
    { id: 'statue', name: 'A statue of Sarah', cost: 500000, where: 'on the square', icon: 'app_camera', last: true,
        blurb: 'The town\'s last and grandest project: the island says thank you, in bronze.' },
];
function projState() {
    const T = town();
    if (!T.proj) T.proj = { paid: {}, done: {} };
    T.proj.paid = T.proj.paid || {}; T.proj.done = T.proj.done || {};
    return T.proj;
}
/* built and standing (the morning after it's paid off); the lighthouse is open already for an island whose keeper's
   story had begun before there were projects */
function projectBuilt(id) {
    if (!S || !S.town || !S.town.proj) return id === 'lighthouse' && lighthouseGrandfathered();
    const d = S.town.proj.done[id];
    return (d != null && Clock.dayNum() >= d) || (id === 'lighthouse' && lighthouseGrandfathered());
}
function lighthouseGrandfathered() { return !!(S && S.quests && ((S.quests.ghost && (S.quests.ghost.stage || S.quests.ghost.done)) || (S.quests.star && S.quests.star.stage))); }
function projectPaid(id) { return (S && S.town && S.town.proj && S.town.proj.paid[id]) || 0; }
/* can a project be paid into yet: the statue waits for all the others */
function projectOpen(p) {
    if (projectBuilt(p.id) || (S.town && S.town.proj && S.town.proj.done[p.id] != null)) return false;
    if (p.last) return PROJECTS.every(q => q.last || projectBuilt(q.id));
    return true;
}
function lighthouseOpen() { return projectBuilt('lighthouse'); }
/* the tiles a project's prop stands on */
function projectTiles(p) {
    const odd = p.rot & 1, w0 = PROP_SIZE[p.kind] || 1, h0 = PROP_ROWS[p.kind] || 1, out = [];
    for (let j = 0; j < (odd ? w0 : h0); j++) for (let i = 0; i < (odd ? h0 : w0); i++) out.push({ x: p.x + i, y: p.y + j });
    return out;
}
/* a project going up: what of Sarah's stands on its tiles (things set down, flowers and trees planted, something dropped,
   one of the island's own she moved there) comes back to her storage; true if anything did */
function projectClear(p) {
    const tiles = projectTiles(p), busy = new Set(tiles.map(t => t.x + ',' + t.y)), D = S.deco;
    const was = JSON.stringify([D && D.placed, S.flowers && S.flowers.planted, S.forest && S.forest.planted, S.drops, S.money, D && D.moved]);
    clearTiles(S, tiles);
    if (D && D.moved) for (const [i, xy] of Object.entries(D.moved)) {
        const q = W0.props[i], as = q && MOVABLE_PROPS[q.kind];
        if (!q || !as || +i === W0.props.indexOf(p)) continue;
        if (projectTiles({ kind: q.kind, rot: q.rot, x: xy[0], y: xy[1] }).some(t => busy.has(t.x + ',' + t.y))) { D.gone[i] = true; delete D.moved[i]; toStorage(as, 1); }
    }
    const moved = JSON.stringify([D && D.placed, S.flowers && S.flowers.planted, S.forest && S.forest.planted, S.drops, S.money, D && D.moved]) !== was;
    if (moved) Save.touch();
    return moved;
}
/* a key of what's built, for the new look's island (Env.look) */
function projectsKey() { return PROJECTS.filter(p => projectBuilt(p.id)).map(p => p.id).join() + (projectBuilt('statue') ? ':' + statueKind() : ''); }
/* paying in: n sand dollars toward a project (the rest of it at most) */
function projectPay(id, n) {
    const p = PROJECTS.find(q => q.id === id), P = projState();
    if (!p || !projectOpen(p)) return 0;
    n = Math.min(Math.floor(n), p.cost - (P.paid[id] || 0), S.money);
    if (!(n > 0)) return 0;
    addMoney(-n, true, 'Town projects');
    P.paid[id] = (P.paid[id] || 0) + n;
    if (P.paid[id] >= p.cost) {
        P.done[id] = Clock.dayNum() + 1;
        townLog(`${p.name} is paid for! The Council will have it built by morning.`);
    }
    Save.touch();
    return n;
}
/* each morning: what's been built overnight goes up, with a letter from the Council */
function projectsTick() {
    if (!S || !S.town || !S.town.proj || Online.visitor()) return;
    const P = S.town.proj, day = Clock.dayNum();
    P.told = P.told || {};
    for (const p of PROJECTS) {
        if (P.done[p.id] == null || P.done[p.id] > day || P.told[p.id]) continue;
        P.told[p.id] = day;
        townLog(PROJECT_DONE_LOG[p.id]);
        sendMail({ from: 'floret', subject: `${p.name}: finished!`, body: PROJECT_MAIL[p.id] });
        if (p.id === 'statue') statueState().spec = hdSarahSpec();
    }
    statueTick();
    projectsRefresh();
}
/* put up on the island whatever's been built and isn't there yet (and the new look builds the island again) */
function projectsRefresh() {
    const a = G.areas && G.areas.island;
    if (!a) return;
    const up = W0.props.map((p, i) => [p, i]).filter(([p, i]) => p.project && projectBuilt(p.project) && !a.ents.some(e => e.propIdx === i) && !isCleared('pr' + i) && !propGone(i));
    if (!up.length) return;
    // (Sarah's things in the way go home first: then the island is built again round it)
    let cleared = false;
    for (const [p] of up) if (projectClear(p)) cleared = true;
    if (cleared) {
        rebuildIsland();
        if (S.started) sendMail({ from: 'floret', subject: 'A few of your things', body: 'Dear resident,\nThe crew found some of your things where the new project went up. They have been carried to your house, with care, and put in your storage. Nothing was squashed. Sprout counted.\n- Sir Floret, for the Cozy Council' });
    } else for (const [p, i] of up) { const e = addProp(a, p); if (e) e.propIdx = i; }
    if (typeof Env !== 'undefined') Env.dirty = true;
}
const PROJECT_DONE_LOG = {
    swings: 'A swing set goes up on the village green.', hammock: 'A hammock is hung on the west beach.', clock: 'The park clock starts ticking by the square.',
    lighthouse: 'The old lighthouse is restored. The boards come off its door.', shrine: 'A stone tablet is raised on the mountain top.',
    statue: 'A statue of Sarah is unveiled on the square.',
};
const PROJECT_MAIL = {
    swings: 'Dear resident,\nThe swing set on the village green is finished. The Council tested both swings. Dame Stalk went very high. We do not discuss it.\nSwing freely.\n- Sir Floret, for the Cozy Council',
    hammock: 'Dear resident,\nThe hammock on the west beach is hung. Sprout fell asleep in it during the inspection. We are counting that as a pass.\n- Sir Floret, for the Cozy Council',
    clock: 'Dear resident,\nThe park clock by the square is ticking. It is never wrong. It is the most reliable member of the Council now.\n- Sir Floret, for the Cozy Council',
    lighthouse: "Dear resident,\nThe boards are off the old lighthouse door, the stairs are mended and the lamp room is swept. The workers did say they heard footsteps on the stairs at night, when nobody was there.\nThe Council is sure it is nothing. Mostly sure. You should go and look. Around midnight, perhaps.\n- Sir Floret, for the Cozy Council",
    shrine: 'Dear resident,\nThe stone tablet stands on the mountain top, with a lantern each side. The old carving on it is older than anyone can read. Make a wish there once a day; the Council does, and our wishes have mostly been about soup.\n- Sir Floret, for the Cozy Council',
    statue: 'Dear resident,\nThere is a statue on the square now. Of you. The whole island chipped in, and so did you (a lot).\nThank you for making this place home. Go and see. Try not to wave at it. Everyone waves at it.\n- Sir Floret, Dame Stalk and Sprout, the Cozy Council',
};

/* ---------------------------------------------------------------- the Town Hall's screen */
CIVIC_SCREENS.projects = { title: 'Town projects', icon: 'app_map', blurb: 'Pay toward a swing set, a park clock, the lighthouse... and more',
    states: ['Works'],
    draw(b) {
        const l = CV.list(b);
        for (const p of PROJECTS.slice(0, 4)) CV.row(l, p.icon, p.name, `${fmtNum(p.cost)} sand dollars, ${p.where}`, el('span', 'cv-pill', 'Sample'));
    },
};
CIVIC_MENUS.townhall.splice(2, 0, 'projects');
CIVIC_LIVE.projects = {
    draw(b, f, redraw) {
        const P = projState(), pick = this.pick && PROJECTS.find(p => p.id === this.pick);
        CV.note(b, 'Put sand dollars toward any project, a little at a time. Once one is paid off, the Council builds it overnight.');
        const l = CV.list(b);
        for (const p of PROJECTS) {
            const built = projectBuilt(p.id), soon = !built && P.done[p.id] != null, open = projectOpen(p), paid = P.paid[p.id] || 0;
            const sub = built ? `Built ${p.where}.` : soon ? 'Paid for! Built by tomorrow morning.'
                : !open ? (p.last ? 'Once every other project is built.' : '')
                    : `${fmtNum(paid)} of ${fmtNum(p.cost)} sand dollars, ${p.where}`;
            const tag = built ? el('span', 'cv-pill ok', 'Built') : soon ? el('span', 'cv-pill ok', 'Tomorrow') : !open ? el('span', 'cv-pill', 'Later') : el('span', 'cv-pill', `${Math.floor(paid / p.cost * 100)}%`);
            const r = CV.row(l, p.icon, p.name, sub, tag, open ? () => { this.pick = p.id; redraw(); } : null);
            if (pick === p) r.classList.add('sel');
        }
        if (townVisitorNote(b)) return;
        if (!pick || !projectOpen(pick)) { CV.note(b, 'Pick a project to put sand dollars toward it.'); return; }
        CV.note(b, `${pick.name}: ${pick.blurb}`);
        const left = pick.cost - (P.paid[pick.id] || 0), say = bankMsg(b);
        const give = n => {
            if (S.money <= 0) return say('err', "You don't have any sand dollars on you.");
            const got = projectPay(pick.id, n);
            if (!got) return say('err', 'Nothing to put in just now.');
            Sfx.play(P.done[pick.id] != null ? 'fanfare' : 'coin');
            UI.toast(P.done[pick.id] != null ? `${pick.name}: paid for! Built by tomorrow.` : `${fmtNum(got)} toward ${pick.name.toLowerCase()}.`, 'ui_coin');
            redraw();
        };
        for (const n of [1000, 10000]) if (n < left) f.appendChild(btn(`Put in ${fmtNum(n)}`, 'alt', () => give(n)));
        f.appendChild(btn(S.money >= left ? `Pay the rest (${fmtNum(left)})` : `Put in all I have (${fmtNum(S.money)})`, 'green', () => give(left)));
    },
};

/* ---------------------------------------------------------------- the lighthouse, boarded up */
async function boardedLighthouse() {
    await UI.say('sign', 'The door is boarded shut. A notice is nailed across it: "CLOSED FOR REPAIRS. Restoration fund: ask at the Town Hall." The wind whistles round the old tower.');
}

/* ---------------------------------------------------------------- the projects, once built */
/* the swings: Sarah sits on one and swings for a while, kicking her legs out (the seats in the new look swing with her:
   EnvBuild, Projects.swing; her doll swings with them, EnvDolls.pose2), nothing said (David, 27 October late) */
const Projects = {
    swing: null,
    async swingOn(e) {
        const p = G.player;
        if (G.busy) return;
        G.busy++;
        const seat = e.px + (p.x / TILE < e.px + 1.5 ? 0.88 : 2.12);
        p.path = null; p.x = seat * TILE; p.y = (e.py + 0.6) * TILE; p.dir = 'down';
        const y0 = p.y;
        p.pose = 'sit'; p.poseT = 9999;
        this.swing = { t: 0, amp: 0, e, sx: seat - (e.px + 1.5) };
        for (let i = 0; i < 260; i++) {
            const s = this.swing;
            s.t++; s.amp = i < 200 ? Math.min(0.55, s.amp + 0.006) : Math.max(0, s.amp - 0.012);
            const th = Math.sin(s.t / 22) * s.amp;
            // (the seat swings back, north, as th grows: EnvBuild's seats)
            p.y = y0 - Math.sin(th) * 1.3 * TILE * 0.5; p.hop = (1 - Math.cos(th)) * 1.3 * TILE * 0.6;
            await waitFrames(1);
        }
        p.y = y0 + TILE * 0.6; p.hop = 0; p.pose = null; p.poseT = 0;
        this.swing = null;
        G.busy = Math.max(0, G.busy - 1);
    },
    /* the hammock: Sarah lies down in it (her doll along the cloth in the new look: p.lie, EnvDolls.pose2) until the line
       is read, then gets up where she was */
    async hammock(e) {
        const p = G.player;
        if (G.busy) return;
        G.busy++;
        const [x0, y0, d0] = [p.x, p.y, p.dir];
        p.path = null; p.x = (e.px + 1.5) * TILE; p.y = (e.py + 0.5) * TILE; p.dir = 'down';
        p.pose = 'sit'; p.poseT = 9999; p.lie = e;
        p.emote = 'zzz'; p.emoteT = 160;
        await waitFrames(30);
        await UI.say(null, rpick(['Sarah climbs into the hammock and sways. The waves go hush, hush. A gull says something rude. She doesn\'t mind.',
            'The hammock rocks. The sun is warm. Sarah closes her eyes for just a second. ...A whole minute goes by. Lovely.',
            'Sarah lies back in the hammock and watches the clouds go over. That one is a dumpling. That one is also a dumpling.']));
        p.lie = null; p.pose = null; p.poseT = 0;
        p.x = x0; p.y = y0; p.dir = d0;
        G.busy = Math.max(0, G.busy - 1);
    },
    async clock() {
        const d = Clock.dayDate();
        await UI.say(null, `The park clock says ${fmtClock(Clock.hourF())}. ${d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}. It ticks, very sure of itself.`);
    },
    /* the shrine: read the stone, and make a wish once a day (a little something, now and then) */
    async shrine() {
        const P = projState(), day = Clock.dayNum();
        await UI.say(null, 'The old stone is carved all over in marks nobody can read, round a sun at the top. Someone has left a peach in the little dish.', { keep: true });
        if (P.wish === day) { await UI.say(null, "Sarah already made today's wish. The lanterns flicker, as if to say: tomorrow."); return; }
        const k = await UI.ask(null, 'Make a wish?', ['Make a wish', 'Not today']);
        if (k !== 0) return;
        P.wish = day;
        Save.touch();
        const r = mulberry(hash32(S.seed + ':wish:' + day));
        const x = r();
        if (x < 0.3) { const g = weighted(GEM_WEIGHTS, r); receive(g, 1); await UI.say(null, `Sarah wishes. When she opens her eyes, there's a ${itemName(g).toLowerCase()} on the step that wasn't there before.`); }
        else if (x < 0.5) { addMoney(1000, true, 'Found & gifts'); await UI.say(null, 'Sarah wishes. Something glints in the moss: a little pouch of 1,000 sand dollars. The mountain is generous today.'); }
        else await UI.say(null, rpick(['Sarah wishes. The wind picks up, then settles, warm. It feels like a yes.', 'Sarah wishes. A butterfly lands on the stone for a moment, then floats off down the mountain.',
            'Sarah wishes. Somewhere far below, a neighbor laughs. Good sign.']));
    },
    async statue() { await UI.say(null, statueWords()); },
};
/* the projects' props, once built: how they're used (added to the island by addProp) */
function projectProp(e, p) {
    if (p.kind === 'swing_set') e.interact = () => Projects.swingOn(e);
    else if (p.kind === 'hammock') e.interact = () => Projects.hammock(e);
    else if (p.kind === 'park_clock') { e.interact = () => Projects.clock(); e.hit = { x: p.x * TILE, y: p.y * TILE - 40, w: TILE, h: TILE + 40 }; }
    else if (p.kind === 'shrine_stone') { e.interact = () => Projects.shrine(); e.light = { r: 20, y: -10 }; }
    else if (p.kind === 'statue_sarah') { e.frame = statueFrame(); e.interact = () => Projects.statue(); e.hit = { x: p.x * TILE, y: p.y * TILE - 40, w: 2 * TILE, h: 2 * TILE + 40 }; }
}

/* ---------------------------------------------------------------- their pictures in the flat views (2D, classic) */
ASSET_MAKERS.push(() => {
    const make = (name, w, h, ax, ay, fn) => {
        if (Assets.frames[name] || Assets.dyn[name]) return;
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const g = c.getContext('2d');
        fn(g, (col, x, y, ww, hh) => { g.fillStyle = col; g.fillRect(x, y, ww, hh); });
        Assets.dyn[name] = { c, w, h, ax, ay };
    };
    make('swing_set', 48, 34, 24, 33, (g, R) => {
        R('#7a5230', 2, 4, 3, 30); R('#7a5230', 43, 4, 3, 30); R('#a8743e', 6, 6, 3, 26); R('#a8743e', 39, 6, 3, 26);
        R('#c8945a', 1, 2, 46, 4); R('#8a8a92', 12, 6, 1, 18); R('#8a8a92', 19, 6, 1, 18); R('#8a8a92', 28, 6, 1, 18); R('#8a8a92', 35, 6, 1, 18);
        R('#d0503a', 10, 24, 12, 3); R('#3a8ad0', 26, 24, 12, 3);
    });
    make('hammock', 48, 22, 24, 21, (g, R) => {
        R('#7a5230', 2, 4, 4, 18); R('#7a5230', 42, 4, 4, 18);
        for (let x = 7; x < 41; x++) { const sag = Math.round(Math.sin((x - 7) / 34 * Math.PI) * 6); R(Math.floor((x - 7) / 4) % 2 ? '#e8604a' : '#f4ecd8', x, 8 + sag, 1, 4); }
    });
    make('park_clock', 16, 46, 8, 45, (g, R) => {
        R('#2e6a4a', 3, 40, 10, 6); R('#2e6a4a', 7, 14, 2, 27); R('#c8a048', 6, 26, 4, 2);
        R('#2e6a4a', 1, 1, 14, 14); R('#f6f0de', 3, 3, 10, 10); R('#22201e', 7, 4, 2, 5); R('#22201e', 8, 7, 4, 2);
    });
    make('shrine_stone', 32, 30, 16, 29, (g, R) => {
        R('#a8a094', 1, 24, 30, 6); R('#b4ac9e', 5, 21, 22, 4); R('#c0b8a8', 10, 2, 12, 20); R('#c0b8a8', 11, 1, 10, 2);
        for (let y = 7; y < 19; y += 3) R('#6e675c', 12, y, 8, 1);
        R('#b8b0a2', 2, 14, 4, 10); R('#ffd88a', 2, 16, 4, 2); R('#b8b0a2', 26, 14, 4, 10); R('#ffd88a', 26, 16, 4, 2);
    });
    make('statue_sarah', 32, 56, 16, 55, (g, R) => {
        R('#a8a094', 0, 48, 32, 8); R('#ccc4b4', 6, 30, 20, 18); R('#c8a048', 11, 38, 10, 4);
        R('#8a6430', 11, 18, 10, 12); R('#a87a3a', 10, 4, 12, 14); R('#c8964a', 12, 7, 8, 8); R('#5a3a1a', 13, 9, 2, 2); R('#5a3a1a', 17, 9, 2, 2);
    });
});
