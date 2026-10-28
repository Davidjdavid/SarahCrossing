/* ---- 6zgc_statue.js ---- */
/* The statue on the square, recast (David, 27 October late): the day after Sarah's statue goes up, the Cozy Council
   congratulates her at the Town Hall and says they'll commission a new one whenever she likes, free, ready the next
   morning: Sarah again, David, any of the island's people, Dr. Frasier Crane (from the 90s show: "Sarah will think it's
   funny"), her Tamagotchi keychain or a rose, all in bronze on the same plinth. Kept as S.town.statue { kind, spec,
   told, next: { kind, day } }: kind is 'sarah', 'frasier', 'tama', 'rose' or an NPC_DEFS id; spec is how Sarah looked
   when hers was cast. In the new look the plinth is the statue's model without its figure and the figure is cast here:
   a doll or a toy from the game's own models with every color turned to bronze (EnvStatue); the flat views draw the
   figure's picture in bronze. */
const STATUE_FRASIER = { look: { hair: 'johncut', hairCol: '#8a6a4a', tipCol: null, skin: '#f1c7a8', eyes: '#3a2a1c', blush: false, masc: true },
    clothes: { style: 'suit', top: '#5a4632', trim: '#8a2a2a', bottom: '#5a4632', shoes: '#2b2220' } };
function statueState() {
    const T = town();
    if (!T.statue) T.statue = { kind: 'sarah' };
    return T.statue;
}
function statueKind() { return (S && S.town && S.town.statue && S.town.statue.kind) || 'sarah'; }
/* who and what can stand there: Sarah, David, the island's people (a newcomer once they've moved in), the three more */
function statueChoices() {
    const people = ['david', 'joe', ...NEIGHBORS, ...Object.keys(NPC_DEFS).filter(id => !NEIGHBORS.includes(id) && !['david', 'joe'].includes(id))]
        .filter((id, i, a) => NPC_DEFS[id] && a.indexOf(id) === i && (!NPC_DEFS[id].newcomer || NEIGHBORS.includes(id)));
    return [['sarah', S.playerName || 'Sarah'], ...people.map(id => [id, NPC_DEFS[id].name]), ['frasier', 'Dr. Frasier Crane'], ['tama', 'Your Tamagotchi keychain'], ['rose', 'A rose']];
}
function statueName(kind) { const c = statueChoices().find(x => x[0] === kind); return c ? c[1] : NPC_DEFS[kind] ? NPC_DEFS[kind].name : kind; }
/* each morning: a new statue cast overnight goes up */
function statueTick() {
    const st = S && S.town && S.town.statue;
    if (!st || !st.next || Clock.dayNum() < st.next.day || Online.visitor()) return;
    st.kind = st.next.kind;
    st.spec = st.kind === 'sarah' ? hdSarahSpec() : null;
    st.next = null;
    townLog(`A new statue on the square: ${st.kind === 'rose' ? 'a rose' : st.kind === 'tama' ? 'a Tamagotchi keychain' : statueName(st.kind)}, in bronze.`);
    sendMail({ from: 'floret', subject: 'The new statue is up', body: STATUE_MAIL(st.kind) });
    // (the flat views' picture of it, and the new look's island built again)
    const e = G.areas && G.areas.island && G.areas.island.ents.find(q => q.kind === 'statue_sarah');
    if (e) e.frame = statueFrame();
    if (typeof Env !== 'undefined') Env.dirty = true;
}
function STATUE_MAIL(kind) {
    const what = kind === 'sarah' ? 'you, again (a fine choice; the Council approves of you)' : kind === 'frasier' ? 'a Dr. Frasier Crane. The Council does not know who he is. The Council has decided he is a doctor of soup'
        : kind === 'tama' ? 'a Tamagotchi keychain, taller than Dame Stalk. The little screen is bronze too. The pet on it looks fed' : kind === 'rose' ? 'a rose, as tall as a lamp post'
        : `${statueName(kind)}, who came to watch it go up and pretended not to`;
    return `Dear resident,\nThe new statue is on the plinth on the square: ${what}.\nShould you wish to change it again, the Council is at the Town Hall's desk, as always. It is still free. It will always be free.\n- Sir Floret, for the Cozy Council`;
}
/* at the Town Hall's desk, the first time after the day Sarah's statue went up: well done, and a new one whenever she likes */
async function statueCongrats() {
    const P = S.town && S.town.proj, st = statueState(), day = Clock.dayNum();
    if (!projectBuilt('statue') || !P || !(day > P.done.statue) || st.told || Online.visitor()) return false;
    st.told = day;
    Save.touch();
    await UI.say('floret', ["Ahem. On behalf of the Council: congratulations on your statue! The whole island has walked past it. Some of them twice. Dame Stalk waved at it.",
        'It is a very good likeness. It has your nose. Probably. The Council does not have noses.'], { keep: true });
    await UI.say('stalk', "And should you ever wish for someone, or something, else up there, the Council will commission a new one. Free of charge. It will be ready by the next morning.", { keep: true });
    const k = await UI.ask('sprout', 'Anyone! Anything! I suggested a statue of me. I was outvoted. By me. I changed my mind.', ['Show me the choices', 'Keep mine for now']);
    return k === 0;
}
/* the plaque, by who's up there */
function statueWords() {
    const k = statueKind(), isl = S.islandName || 'the island', days = daysPlayed();
    if (k === 'sarah') return `A bronze statue of ${S.playerName || 'Sarah'} on a tall stone plinth, flowers round its foot. The brass plaque says: "${S.playerName || 'SARAH'}. Who came to ${isl} and made it home. With love from everyone here, after ${fmtNum(days)} ${days === 1 ? 'day' : 'days'} of her."`;
    if (k === 'frasier') return 'A bronze statue of a man in a fine suit, one hand raised as if about to explain something at length. The plaque says: "DR. FRASIER CRANE. I\'m listening." Nobody on the island knows who he is. Sarah does.';
    if (k === 'tama') return 'A bronze Tamagotchi on its keychain, taller than Sarah, its three buttons as big as dinner plates. The plaque says: "FED, PLAYED WITH, AND LOVED. MOSTLY." The pixel pet on its screen looks happy forever.';
    if (k === 'rose') return 'A bronze rose as tall as a lamp post, every petal cast one by one, a bee in bronze on one leaf. The plaque says: "FOR EVERYONE WHO PLANTS SOMETHING."';
    const n = statueName(k);
    return k === 'goat' ? 'A bronze statue of the goat, looking pleased with itself. The plaque says: "THE GOAT." The real goat walks past it every day and does not look.'
        : `A bronze statue of ${n} on the tall stone plinth. The plaque says: "${n.toUpperCase()}. A GOOD NEIGHBOR." ${n} says it's embarrassing, and stops to look at it every single day.`;
}

/* ---------------------------------------------------------------- the Town Hall's screen */
CIVIC_SCREENS.statue = { title: 'The statue', icon: 'app_camera', blurb: 'A new statue for the square, cast in bronze, free', states: ['Works'],
    draw(b) {
        CV.note(b, 'Once the statue on the square is built, the Council will cast a new one whenever you like: anyone on the island, or something else. Free, and ready the next morning.');
        const l = CV.list(b);
        for (const [id, name] of [['sarah', 'Sarah'], ['david', 'David'], ['frasier', 'Dr. Frasier Crane'], ['tama', 'Your Tamagotchi keychain']]) CV.row(l, 'app_camera', name, id === 'sarah' ? 'On the plinth now' : 'In bronze', el('span', 'cv-pill', 'Sample'));
    } };
CIVIC_MENUS.townhall.splice(CIVIC_MENUS.townhall.indexOf('projects') + 1, 0, 'statue');
CIVIC_LIVE.statue = {
    draw(b, f, redraw) {
        if (!projectBuilt('statue')) { CV.note(b, "There's no statue on the square yet. It's the last of the Town projects: once every other project is built, the island can put one up."); return; }
        const st = statueState(), day = Clock.dayNum();
        CV.note(b, `On the plinth now: ${statueKind() === 'rose' ? 'a rose' : statueKind() === 'tama' ? 'your Tamagotchi keychain' : statueName(statueKind())}.` + (st.next ? ` Being cast: ${statueName(st.next.kind)}, up on the square ${st.next.day > day ? 'tomorrow morning' : 'soon'}.` : ''));
        if (townVisitorNote(b)) return;
        CV.note(b, 'Pick who (or what) the Council should cast next. It\'s free, and it\'s on the square by morning.');
        const l = CV.list(b);
        for (const [id, name] of statueChoices()) {
            if (id === statueKind() && !st.next) continue;
            const sub = id === 'frasier' ? 'From the 90s show. He\'s listening.' : id === 'tama' ? 'Your little egg on its keychain, very big' : id === 'rose' ? 'As tall as a lamp post' : id === 'sarah' ? 'You, in bronze' : 'In bronze';
            const r = CV.row(l, 'app_camera', name, sub, st.next && st.next.kind === id ? el('span', 'cv-pill ok', 'Tomorrow') : null, () => { this.pick = id; redraw(); });
            if (this.pick === id) r.classList.add('sel');
        }
        if (!this.pick || (st.next && st.next.kind === this.pick)) return;
        f.appendChild(btn(`Cast ${statueName(this.pick)} (free)`, 'green', () => {
            st.next = { kind: this.pick, day: day + 1 };
            this.pick = null;
            Save.touch();
            Sfx.play('fanfare');
            UI.toast('The Council will have the new statue up by morning.', 'app_camera');
            redraw();
        }));
    },
};

/* ---------------------------------------------------------------- in bronze, in the new look */
/* the figure on the plinth, made from the game's own doll or toy with every color turned to a shade of bronze (by how
   light it was), the same bronze as Sarah's first statue; kept until the statue changes */
const EnvStatue = {
    key: null, group: null, geos: [],
    /* the plinth: Sarah's statue's model without her figure */
    plinth() {
        if (typeof EnvModels === 'undefined' || !EnvModels.has('statue_sarah')) return null;
        if (!EnvModels.models.statue_plinth) { const M = EnvModels.models.statue_sarah; EnvModels.models.statue_plinth = Object.assign({}, M, { parts: M.parts.filter(p => !/bronze/.test((p.material && p.material.name) || '')) }); }
        return 'statue_plinth';
    },
    bronzePart() { const M = EnvModels.models.statue_sarah; return M && M.parts.find(p => /bronze/.test((p.material && p.material.name) || '')); },
    /* the figure for who's up there (null when it can't be made yet: the new look's people still coming) */
    figure() {
        const k = statueKind(), st = S.town && S.town.statue, spec = k === 'sarah' ? (st && st.spec) || hdSarahSpec() : null;
        const key = k + '|' + (spec ? JSON.stringify(spec) : '') + (EnvDolls.kitReady() ? 'k' : '');
        if (key === this.key && this.group) return this.group;
        const B = this.bronzePart();
        if (!B) return null;
        let src = null, tall = 1.2, pose = null;
        if (k === 'tama' || k === 'rose') {
            const n = k === 'tama' ? 'tama_keychain' : 'flower_rose';
            if (!EnvModels.has(n)) return null;
            src = new THREE.Group();
            for (const p of EnvModels.models[n].parts) src.add(new THREE.Mesh(p.geometry, p.material));
            tall = 1.75;
        } else {
            const human = k === 'sarah' || k === 'frasier' || (NPC_DEFS[k] && NPC_DEFS[k].human);
            const sp = k === 'sarah' ? spec : k === 'frasier' ? STATUE_FRASIER : human ? hdFolkSpec(NPC_DEFS[k].human) : null;
            if (human && (!sp || !EnvDolls.kitReady())) return null;
            const folk = !human && NPC_DEFS[k] && EnvDolls.folkOf({ def: NPC_DEFS[k] });
            if (!human && !folk) return null;
            const d = human ? EnvDolls.make(sp) : EnvDolls.makeFolk({ folk });
            // (a pose for the cast: Sarah and David wave, Frasier raises a hand mid-sentence)
            const P = d.parts;
            if ((k === 'sarah' || k === 'david') && P.armR) { P.armR.rotation.z = 2.55; if (P.elR) P.elR.rotation.x = -0.25; }
            if (k === 'frasier' && P.armR) { P.armR.rotation.set(-0.35, 0, 0.55); if (P.elR) P.elR.rotation.x = -1.7; if (P.armL) P.armL.rotation.set(-0.5, 0, -0.25); if (P.elL) P.elL.rotation.x = -1.2; }
            src = d.root;
            pose = d;
            tall = human ? 1.5 : 1.3;
        }
        this.drop();
        const g = new THREE.Group(), mat = EnvModels.partMat(B), shades = this.shades(B.geometry);
        src.updateMatrixWorld(true);
        const inv = new THREE.Matrix4().copy(src.matrixWorld).invert();
        src.traverse(o => {
            if (!o.isMesh || !o.geometry || !o.visible) return;
            const geo = this.cast(o.geometry, shades);
            const m = new THREE.Mesh(geo, mat);
            m.matrixAutoUpdate = false;
            m.matrix.multiplyMatrices(inv, o.matrixWorld);
            m.castShadow = true; m.receiveShadow = true;
            m.userData.shared = true;
            this.geos.push(geo);
            g.add(m);
        });
        if (pose) EnvDolls.drop(pose);
        // standing on its foot, as tall as it should be
        const box = new THREE.Box3().setFromObject(g), h = Math.max(0.05, box.max.y - box.min.y), s = tall / h, mid = box.getCenter(new THREE.Vector3());
        const out = new THREE.Group();
        g.position.set(-mid.x * s, -box.min.y * s, -mid.z * s);
        g.scale.setScalar(s);
        out.add(g);
        this.key = key;
        this.group = out;
        return out;
    },
    /* the darkest and lightest bronze of Sarah's first statue, to cast with */
    shades(geo) {
        const c = geo.attributes.color;
        let lo = null, hi = null, a = Infinity, z = -Infinity;
        if (c) for (let i = 0; i < c.count; i++) { const l = c.getX(i) * 0.3 + c.getY(i) * 0.59 + c.getZ(i) * 0.11; if (l < a) { a = l; lo = [c.getX(i), c.getY(i), c.getZ(i)]; } if (l > z) { z = l; hi = [c.getX(i), c.getY(i), c.getZ(i)]; } }
        return { lo: lo || [0.29, 0.19, 0.08], hi: hi || [0.78, 0.6, 0.28] };
    },
    /* a copy of a part with its colors in bronze (and none of its picture) */
    cast(src, sh) {
        const geo = new THREE.BufferGeometry();
        for (const k of ['position', 'normal']) if (src.attributes[k]) geo.setAttribute(k, src.attributes[k].clone());
        if (src.index) geo.setIndex(src.index.clone());
        const n = geo.attributes.position.count, c = src.attributes.color, col = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
            const l = c ? Math.min(1, (c.getX(i) * 0.3 + c.getY(i) * 0.59 + c.getZ(i) * 0.11) * 1.5 + 0.18) : 0.6;
            for (let j = 0; j < 3; j++) col[i * 3 + j] = sh.lo[j] + (sh.hi[j] - sh.lo[j]) * l;
        }
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        if (!geo.attributes.normal) geo.computeVertexNormals();
        return geo;
    },
    drop() {
        if (this.group && this.group.parent) this.group.parent.remove(this.group);
        for (const g of this.geos) g.dispose();
        this.geos = []; this.group = null; this.key = null;
    },
};

/* ---------------------------------------------------------------- in the flat views */
/* the plinth from the first statue's picture, and the figure's own picture in bronze on it */
function statueFrame() {
    const k = statueKind();
    if (k === 'sarah') return 'statue_sarah';
    const name = 'statue_' + k;
    if (Assets.dyn[name]) return name;
    const base = Assets.dyn.statue_sarah;
    const pic = NPC_DEFS[k] && NPC_DEFS[k].sprite && Assets.frames[NPC_DEFS[k].sprite + '_0'];
    if (!base || !pic) return 'statue_sarah';
    const c = document.createElement('canvas');
    c.width = 32; c.height = 56;
    const g = c.getContext('2d');
    g.drawImage(base.c, 0, 30, 32, 26, 0, 30, 32, 26);
    const [sx, sy, w, h] = pic, s = Math.min(1, 28 / h, 30 / w);
    g.imageSmoothingEnabled = false;
    g.drawImage(Assets.atlas, sx, sy, w, h, Math.round(16 - w * s / 2), Math.round(31 - h * s), Math.round(w * s), Math.round(h * s));
    const im = g.getImageData(0, 0, 32, 31), D = im.data;
    for (let i = 0; i < D.length; i += 4) {
        if (!D[i + 3]) continue;
        const l = Math.min(1, (D[i] * 0.3 + D[i + 1] * 0.59 + D[i + 2] * 0.11) / 255 * 1.5 + 0.18);
        D[i] = 74 + (200 - 74) * l; D[i + 1] = 48 + (152 - 48) * l; D[i + 2] = 20 + (72 - 20) * l;
    }
    g.putImageData(im, 0, 0);
    Assets.dyn[name] = { c, w: 32, h: 56, ax: 16, ay: 55 };
    return name;
}
