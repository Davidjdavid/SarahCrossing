/* Stillfall Quarry: machines whose two halves are far apart. Look at one half and not the other. */
const HOURGLASS_T = 1.5;
ISLAND_ADD.push(function quarry(m) {
    /* the hourglass gate in the inner wall */
    m.add('plate', 44 * TILE + 2, 24 * TILE + 2, { name: 'plate' });
    m.add('hourglass', 41 * TILE + 3, 24 * TILE + 4, { name: 'hourglass' });
    m.add('stonegate', 54 * TILE, 22 * TILE, { name: 'stonegate' });
    m.add('lever', 56 * TILE + 4, 21 * TILE + 6, { name: 'lever' });
    m.addAt('sign', 47, 25, { text: 'QUARRY GATE. Stand on the stone and the gate opens for as long as the sand runs. (Foreman\'s rule: no dawdling while the sand runs.)' });
    for (const [x, y] of [[38, 26], [39, 27], [62, 25]]) m.addAt('rock', x, y, { name: 'qrock' + x + y });
    /* Stillfall: the spring on the ledge feeds the falls; the falls block the cave mouth */
    m.add('spring', 44 * TILE, 11 * TILE + 4, { name: 'spring' });
    m.add('falls', 44 * TILE, 11 * TILE + 8, { name: 'falls', song: 'quarry', loud: 200 });
    m.doors = m.doors || [];
    m.doors.push({ x: 44, y: 15, to: 'cave', tx: 6, ty: 8, tdir: 'up', dir: 'up', locked: fallsBlocking, lockedSay: () => 'The falls pour down over the cave mouth. You\'d be washed right off the ledge.' });
    m.doors.push({ x: 45, y: 15, to: 'cave', tx: 7, ty: 8, tdir: 'up', dir: 'up', locked: fallsBlocking, lockedSay: () => 'The falls pour down over the cave mouth. You\'d be washed right off the ledge.' });
    m.addAt('sign', 48, 17, { text: 'STILLFALL. The spring above has never once stopped. (Not while anybody was looking.)' });
    /* the long view: a cut stone block at the top of the chute, the cracked wall at its foot */
    m.add('block', 59 * TILE + 1, 7 * TILE + 3, { name: 'block' });
    addProp(m, { id: 'crackwall', tx: 64, ty: 17, tw: 1, th: 4, fh: 4, draw: drawCrackWall });
    m.addAt('sign', 57, 6, { text: 'TOP OF THE CHUTE. Blocks go down, push gently. The old foreman watched every one of them down from here. He had a very wide way of looking at things.' });
    m.addAt('sign', 56, 17, { text: 'Beyond the wall at the end of this cut: the old ferry ledge, over the Gap to the cape. Sealed up after the light went out.' });
});

/* a stone you stand on (or set something heavy on) */
kind('plate', {
    w: 12, h: 12, ph: 12, fixed: true, flat: true,
    draw(e, D) { box(D, e.x, e.y, 12, 12, e.st.down ? '#6e665b' : '#8a8378'); box(D, e.x + 1, e.y + 1, 10, 10, e.st.down ? '#7d756a' : '#a39a8c'); box(D, e.x + 4, e.y + 4, 4, 4, e.st.down ? P.gold : P.goldS); },
    update(e) {
        let down = false;
        for (const o of e.map.ents) if (o !== e && exists(o) && !o.held && (o.kind === 'dot' || KINDS[o.kind].heavy) && overlap({ x: e.x + 2, y: e.y + 2, w: 8, h: 8 }, o) && !(o.z > 2)) down = true;
        if (down && !e.st.down) Sfx.play('push');
        e.st.down = down;
        if (down) { const g = ent('stonegate'), h = ent('hourglass'); g.st.open = true; h.st.t = HOURGLASS_T; h.st.run = false; }
        else if (e.st.wasDown) { ent('hourglass').st.run = true; }
        e.st.wasDown = down;
    },
});
kind('hourglass', {
    w: 10, h: 6, ph: 22, fixed: true, solid: true,
    init(e) { e.st.t = 0; },
    draw(e, D) {
        box(D, e.x - 2, e.y - 2, 14, 8, P.stone);
        const c = thing('hourglass'); D.img(c, e.x, e.y - 14);
        const f = clamp((e.st.t || 0) / HOURGLASS_T, 0, 1);
        box(D, e.x + 3, e.y - 11 + (1 - f) * 4, 4, f * 4, P.gold);
        box(D, e.x + 3, e.y - 3 - (1 - f) * 4, 4, (1 - f) * 4, P.gold);
        if (e.st.run && e.st.t > 0) box(D, e.x + 4.5, e.y - 7, 1, 4, P.gold);
    },
    update(e, dt) {
        if (!e.st.run || e.st.t <= 0) return;
        e.st.t -= dt;
        if (e.st.t <= 0) { e.st.t = 0; e.st.run = false; const g = ent('stonegate'); if (!G.flags.quarryGate) g.st.closing = true; }
    },
});
kind('stonegate', {
    w: 32, h: 16, ph: 26, solid: true, fixed: true,
    draw(e, D) {
        const o = e.st.o || 0;
        box(D, e.x, e.y - 10, 32, 26, '#5c574f');
        box(D, e.x + 2, e.y - 8 - o * 22, 28, 22 * (1 - o) + 2, '#8a8378');
        for (let i = 0; i < 3; i++) box(D, e.x + 2, e.y - 2 + i * 5 - o * 22, 28, 1, '#6e665b');
    },
    update(e, dt) {
        if (G.flags.quarryGate) e.st.open = true;
        if (e.st.closing) {
            const d = World.dot;
            if (d.map === e.map && overlap(d, { x: e.x, y: e.y - 4, w: e.w, h: e.h + 8 })) return;   /* never on top of Dot */
            e.st.open = false; e.st.closing = false; Sfx.play('thud');
        }
        const t = e.st.open ? 1 : 0;
        e.st.o = clamp((e.st.o || 0) + (t > (e.st.o || 0) ? dt * 4 : -dt * 4), 0, 1);
        e.solid = e.st.o < 0.9;
        if (e.st.o > 0.9 && e.st.open) Notebook.saw('gate', e);
    },
});
kind('lever', {
    w: 8, h: 6, ph: 14, solid: true, fixed: true,
    draw(e, D) { box(D, e.x, e.y, 8, 6, P.stoneS); const on = G.flags.quarryGate; D.ctx.strokeStyle = P.brownS; D.ctx.lineWidth = 2 * D.k; D.ctx.beginPath(); D.ctx.moveTo(D.X(e.x + 4), D.Y(e.y + 2)); D.ctx.lineTo(D.X(e.x + (on ? 8 : 0)), D.Y(e.y - 8)); D.ctx.stroke(); box(D, e.x + (on ? 6 : -2), e.y - 10, 4, 4, P.red); },
    act(e) { if (G.flags.quarryGate) { say('The lever\'s down. The gate stays open.'); return; } G.flags.quarryGate = true; const g = ent('stonegate'); g.st.open = true; Sfx.play('push'); say('Dot pulls the lever. The gate grinds open, and stays open.'); Save.soon(); },
});

/* the spring and the falls: water only comes over while the spring is seen */
kind('spring', {
    w: 32, h: 8, ph: 10, fixed: true, flat: true,
    draw(e, D) { box(D, e.x, e.y, 32, 8, '#4f9fd8'); for (let i = 0; i < 3; i++) box(D, e.x + 4 + i * 10, e.y + 2 + Math.sin(G.t * 6 + i) * 1.5, 4, 2, P.white); },
    update(e, dt) { e.st.flow = (e.st.flow || 0) + dt; },
});
kind('falls', {
    w: 32, h: 80, ph: 80, fixed: true, flat: true,
    init(e) { e.st.drops = []; for (let y = 0; y < 80; y += 4) e.st.drops.push(y); },
    draw(e, D) {
        for (const y of e.st.drops) { box(D, e.x + 2, e.y + y, 28, 5, '#6fb8ea'); box(D, e.x + 4 + (y % 7), e.y + y + 1, 3, 3, '#cdeaff'); }
        if (e.st.drops.length) for (let i = 0; i < 3; i++) box(D, e.x - 2 + i * 13, e.y + 78 + Math.sin(G.t * 8 + i) * 1, 10, 3, P.white);
    },
    update(e, dt) {
        const spring = ent('spring');
        const feeding = spring && Laws.seenBox(visBox(spring));
        e.st.acc = (e.st.acc || 0) + dt;
        if (feeding) while (e.st.acc > 0.05) { e.st.acc -= 0.05; e.st.drops.push(0); }
        else e.st.acc = 0;
        e.st.drops = e.st.drops.map(y => y + 60 * dt).filter(y => y < 80);
        if (!feeding && !e.st.drops.length && !e.st.told) { e.st.told = true; Notebook.saw('still', e); }
        if (feeding) e.st.told = false;
    },
});
function fallsBlocking() { const f = ent('falls'); return f && f.st.drops.some(y => y > 40); }

/* the miners' stone block: push it down the chute; it rolls only while seen, all the way to the cracked wall */
const CHUTE = [[59.5, 7.5], [59.5, 18.5], [64, 18.5]];
kind('block', {
    w: 14, h: 12, ph: 16, solid: true,
    draw(e, D) { const c = thing('crate'); box(D, e.x, e.y - 4, 14, 16, '#8a8378'); box(D, e.x + 1, e.y - 3, 12, 3, '#a39a8c'); box(D, e.x + 3, e.y + 2, 8, 1, '#5c574f'); if (e.st.leg != null) { box(D, e.x + 2, e.y + 9, 10, 2, 'rgba(0,0,0,0.2)'); } },
    push(e, dir) {
        if (e.st.leg != null || e.st.done) return;
        if (dir !== 'down') { say('It won\'t budge that way. The chute\'s just below it.'); return; }
        e.st.leg = 0; e.solid = false; Sfx.play('push');
    },
    update(e, dt) {
        if (e.st.leg == null || e.st.done) return;
        const [tx, ty] = CHUTE[e.st.leg + 1];
        const gx = tx * TILE - e.w / 2, gy = ty * TILE - e.h / 2;
        const dx = gx - e.x, dy = gy - e.y, d = Math.hypot(dx, dy), sp = 70 * dt;
        if (Math.floor(e.t * 6) !== Math.floor((e.t - dt) * 6)) Sfx.play('thud');
        if (d <= sp) { e.x = gx; e.y = gy; e.st.leg++; if (e.st.leg >= CHUTE.length - 1) smashWall(e); }
        else { e.x += dx / d * sp; e.y += dy / d * sp; }
    },
});
function smashWall(e) {
    e.st.done = true; e.removed = true; e.map.remove(e);
    const p = e.map.props.find(q => q.id === 'crackwall'); p.gone = true; e.map.rebuildSolid();
    G.flags.wallBroken = true;
    for (let i = 0; i < 4; i++) Fx.puff(64.5 * TILE, (17.5 + i) * TILE, 'pop');
    Sfx.play('thud'); Sfx.play('push'); Fx.flash = 0.3;
    Save.soon();
}
Story.on('restore', () => { const m = MAPS.island; if (G.flags.wallBroken) { const p = m.props.find(q => q.id === 'crackwall'); if (p) p.gone = true; const b = m.find('block'); if (b) { b.removed = true; m.remove(b); } m.rebuildSolid(); } });
function drawCrackWall(D, p) {
    const x = p.tx * TILE, y = p.ty * TILE;
    box(D, x, y - 6, 16, 70, '#776c62'); for (let i = 0; i < 5; i++) box(D, x, y - 6 + i * 14, 16, 1, '#5c574f');
    D.ctx.strokeStyle = '#2a1b2d'; D.ctx.lineWidth = D.k; D.ctx.beginPath(); D.ctx.moveTo(D.X(x + 3), D.Y(y + 4)); D.ctx.lineTo(D.X(x + 9), D.Y(y + 20)); D.ctx.lineTo(D.X(x + 5), D.Y(y + 34)); D.ctx.lineTo(D.X(x + 11), D.Y(y + 50)); D.ctx.stroke();
}

/* the cave behind the falls: the Wide Glass */
room('cave', [
    'xxxx######xxxx',
    'xx##pppppp##xx',
    'x#pppppppppp#x',
    '#pppppppppppp#',
    '#pppppppppppp#',
    '#pppppppppppp#',
    'x#pppppppppp#x',
    'xx##pppppp##xx',
    'xxxx##pp##xxxx',
    'xxxxxxDDxxxxxx',
], {
    exit: ['island', 44, 16],
    def: { dim: '#8888b0' },
    legend: { D: { under: 'p', spawn: (m, x, y) => { m.doors = m.doors || []; m.doors.push({ x, y, to: 'island', tx: 44 + (x - 6), ty: 16, tdir: 'down', dir: 'down' }); } } },
    init(m) {
        furn(m, 'pedestal', 6, 3, 16, 8, { name: 'widepedestal', say: () => G.flags.wideglass ? 'An empty pedestal. Something wide used to rest here.' : null, onAct: wideGlassTake });
        m.addAt('sign', 3, 5, { text: 'Scratched in the rock: "Whoever stands on the plate, mind the sand. Whoever stands at the top, mind the whole slope. - the Foreman"' });
        furn(m, 'barrel', 10, 5, 12, 8, { say: 'An old miners\' barrel. Empty, except for a very old sandwich crust.' });
    },
});
async function wideGlassTake(e) {
    if (G.flags.wideglass) { say('An empty pedestal. Something wide used to rest here.'); return; }
    G.flags.wideglass = true; Cam.zmin = 0.5; Sfx.play('get'); Fx.flash = 0.4;
    await say('Dot got the Wide Glass!', null, { name: false });
    await say('Through it, everything is a little further away, and there is a lot more of it.', null, { name: false });
    UI.showHint('Q (or the mouse wheel) to look farther. E to look closer again.', 10);
    Save.write(true);
}
KINDS.furn.draw = (function (orig) { return function (e, D) { orig(e, D); if (e.name === 'widepedestal' && !G.flags.wideglass) { const c = thing('wideglass'); D.img(c, ecx(e) - 7, e.y - 18 + Math.sin(G.t * 2)); } }; })(KINDS.furn.draw);
