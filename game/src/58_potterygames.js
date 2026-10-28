/* ---- 58_potterygames.js ---- */
/* The pottery editors: the wheel (center, open, shape), hand-building / freestyle sculpting, and glazing.
   They share one overlay card with a big pixel canvas on one side and the tools on the other. */
const Studio = {
    on: false, onKey: null, onResize: null,
    open(title, sub) {
        this.kind = /easel/i.test(title) ? 'painting' : /wheel|hand-building|sculpting|glazing/i.test(title) ? 'pottery' : null;     // for the Music app
        this.close();
        const root = el('div');
        root.id = 'studio';
        const card = el('div', 'st-card');
        const head = el('div', 'st-head');
        const h = el('h2', null, title);
        const x = el('button', 'x', '\u00d7');
        x.type = 'button'; x.setAttribute('aria-label', 'Close');
        head.appendChild(h); head.appendChild(x);
        const subEl = el('div', 'st-sub', sub || '');
        const body = el('div', 'st-body');
        const box = el('div', 'st-box');
        const tools = el('div', 'st-tools');
        body.appendChild(box); body.appendChild(tools);
        card.appendChild(head); card.appendChild(subEl); card.appendChild(body);
        root.appendChild(card);
        $('#ui').appendChild(root);
        this.on = true;
        G.busy++;
        UI.modal = true;
        G.keys = {};
        this._resize = () => this.onResize && this.onResize();
        addEventListener('resize', this._resize);
        return { root, card, head, title: h, x, sub: subEl, body, box, tools };
    },
    /* trying something on (the salon, the sewing machine): in the 3D view Sarah's own doll wears it as it's made, with the
       camera in close on her and the studio to one side (under her on an upright phone); the flat views keep their little
       picture of her */
    tryOn(t) {
        G.tryOn = t;
        const r = $('#studio');
        if (!r || !R3.active()) return false;
        if (!r.classList.contains('side')) { r.classList.add('side'); R3.mirror = true; G.player.dir = 'down'; }
        return true;
    },
    close() {
        const r = $('#studio');
        G.tryOn = null;
        if (typeof R3 !== 'undefined') R3.mirror = false;
        if (!r) return;
        r.remove();
        removeEventListener('resize', this._resize);
        this.on = false; this.onKey = null; this.onResize = null;
        G.busy = Math.max(0, G.busy - 1);
        UI.modal = false;
    },
};
function chip(label, fn, cls) {
    const b = el('button', 'chip' + (cls ? ' ' + cls : ''), label);
    b.type = 'button';
    b.addEventListener('click', ev => { ev.stopPropagation(); Sfx.ui('tick'); fn(b); });
    return b;
}
function stLabel(t) { return el('div', 'st-label', t); }
/* a canvas that fills the space it's given, in whole-ish steps so the pixels stay crisp */
function fitCanvas(cv, box, lw, lh, side) {
    const fit = () => {
        const wide = innerWidth >= 620 && innerWidth > innerHeight * 0.9;
        const avW = Math.min(wide ? innerWidth * 0.46 : innerWidth - 60, 420);
        const avH = Math.min(innerHeight - (wide ? 150 : 330), 560);
        let k = Math.max(1, Math.min(avW / lw, avH / lh));
        if (k > 2) k = Math.floor(k * 2) / 2;
        cv.style.width = Math.round(lw * k) + 'px';
        cv.style.height = Math.round(lh * k) + 'px';
    };
    fit();
    return fit;
}
function canvasPoint(cv, ev) {
    const r = cv.getBoundingClientRect();
    return [(ev.clientX - r.left) / r.width * cv.width, (ev.clientY - r.top) / r.height * cv.height];
}
/* the last step for every new piece: a name */
function nameStep(U, suggested, done) {
    U.tools.innerHTML = '';
    U.sub.textContent = 'Give it a name, or keep this one.';
    const f = el('label', 'field');
    f.appendChild(el('span', null, 'Name'));
    const inp = el('input');
    inp.maxLength = 24; inp.value = suggested; inp.id = 'potname'; inp.autocomplete = 'off';
    f.appendChild(inp);
    U.tools.appendChild(f);
    const row = el('div', 'st-row');
    row.appendChild(chip('Save it', () => done((inp.value || '').trim() || suggested), 'go big'));
    U.tools.appendChild(row);
    inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') done((inp.value || '').trim() || suggested); });
    setTimeout(() => { try { inp.focus(); inp.select(); } catch (e) { /* fine */ } }, 60);
}

/* ---------------------------------------------------------------- profile (thrown pots) */
function profR(prof, t) {
    const r = prof.r, n = r.length - 1;
    const f = clamp(t, 0, 1) * n, i = Math.min(n - 1, Math.floor(f)), u = f - i;
    const p0 = r[Math.max(0, i - 1)], p1 = r[i], p2 = r[i + 1], p3 = r[Math.min(n, i + 2)];
    const v = 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
    return Math.max(0.6, v);
}
function profMax(prof) { return prof.handle ? 5.2 : prof.spout ? 5.6 : 7; }
function fixProf(prof) {
    const mx = profMax(prof);
    prof.h = clamp(Math.round(prof.h), 3, POT_H_BIG);
    prof.r = prof.r.map(v => clamp(v, 0.7, mx));
    prof.r[6] = Math.max(prof.r[6], 1.6);
    return prof;
}
/* a thrown pot as pixels: lit on the left, shaded on the right, an opening at the rim, maybe a handle and a spout */
function profileMask(prof) {
    const W = POT_W, h = prof.h, cx = W / 2;
    const m = new Array(W * h).fill('.');
    const rows = [];
    for (let y = 0; y < h; y++) {
        let r = profR(prof, h === 1 ? 0 : y / (h - 1));
        if (y === h - 1) r = Math.max(1, r * 0.86);
        rows.push(r);
        for (let x = 0; x < W; x++) {
            const d = x + 0.5 - cx;
            if (Math.abs(d) > r + 0.15) continue;
            const rel = d / Math.max(r, 0.5);
            m[y * W + x] = rel < -0.45 ? 'l' : rel > 0.5 && r >= 1.8 ? 'd' : 'o';
        }
    }
    // the opening
    const r0 = rows[0];
    for (let x = 0; x < W; x++) {
        const d = Math.abs(x + 0.5 - cx);
        if (d <= r0 - 1 && m[x] !== '.') m[x] = 'i';
        if (h >= 6 && r0 >= 2.5 && d <= r0 - 1.8 && m[W + x] !== '.') m[W + x] = 'i';
    }
    const bodyRight = y => { for (let x = W - 1; x >= 0; x--) if (m[y * W + x] !== '.') return x; return -1; };
    const bodyLeft = y => { for (let x = 0; x < W; x++) if (m[y * W + x] !== '.') return x; return W; };
    if (prof.handle && h >= 5) {
        const y0 = Math.max(1, Math.round(h * 0.2)), y1 = Math.min(h - 2, Math.max(y0 + 2, Math.round(h * 0.66)));
        const xr = Math.max(bodyRight(y0), bodyRight(y1));
        const put = (x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < h) m[y * W + x] = c; };
        for (let x = xr + 1; x <= Math.min(W - 1, xr + 2); x++) { put(x, y0, 'o'); put(x, y1, 'd'); }
        for (let y = y0; y <= y1; y++) put(Math.min(W - 1, xr + 3), y, 'd');
    }
    if (prof.spout) {
        const xl = bodyLeft(0);
        if (xl >= 2) { m[xl - 1] = 'l'; m[xl - 2] = 'l'; if (h > 1) m[W + xl - 1] = 'o'; }
    }
    return m.join('');
}
function classifyPot(prof) {
    const r = prof.r, h = prof.h, mx = Math.max(...r);
    if (prof.spout) return 'pitcher';
    if (h <= 4) return 'plate';
    if (prof.handle) return h <= 8 ? 'cup' : 'mug';
    if (h <= 8 && mx >= 4.5) return 'bowl';
    if (Math.min(r[1], r[2]) < Math.max(r[3], r[4], r[5]) * 0.64 && h >= 9) return 'vase';
    if (h >= 10) return 'jar';
    return 'pot';
}
const POT_PRESETS = {
    Vase: { h: 18, r: [2.6, 1.8, 2.4, 4.6, 5.6, 5.2, 3.6] },
    Bowl: { h: 7, r: [6.4, 6.2, 5.8, 5.2, 4.4, 3.4, 2.4] },
    Mug: { h: 11, r: [4.3, 4.3, 4.3, 4.3, 4.3, 4.2, 4], handle: true },
    Cup: { h: 7, r: [3.8, 3.7, 3.6, 3.4, 3.2, 3, 2.6], handle: true },
    Plate: { h: 3, r: [6.8, 6.6, 6.2, 5.6, 5, 4.2, 3.4] },
    Jar: { h: 14, r: [3.6, 4.4, 5.4, 5.8, 5.6, 5, 4] },
    Pitcher: { h: 15, r: [3.8, 3.4, 4, 4.8, 5.1, 5, 4.2], handle: true, spout: true },
};

/* ---------------------------------------------------------------- the wheel */
const WH = { W: 160, H: 200, base: 176, cx: 80 };
const Wheel = {
    run() { return new Promise(res => this.start(res)); },
    start(res) {
        const U = Studio.open("Sully's wheel", '');
        this.U = U; this.res = res;
        const cv = el('canvas', 'st-canvas');
        cv.width = WH.W; cv.height = WH.H;
        U.box.appendChild(cv);
        this.cv = cv; this.ctx = cv.getContext('2d');
        this.buf = document.createElement('canvas'); this.buf.width = WH.W; this.buf.height = WH.H;
        this.bctx = this.buf.getContext('2d');
        this.img = this.bctx.createImageData(WH.W, WH.H);
        Studio.onResize = fitCanvas(cv, U.box, WH.W, WH.H);
        this.st = { phase: 'center', pressure: 0, hold: false, prog: 0, off: 0, wob: 1, depth: 0, t: 0, prof: null, hist: [], sel: 0, drag: null, qC: 0, qO: 0 };
        U.x.addEventListener('click', () => this.finish(null));
        cv.addEventListener('pointerdown', e => this.down(e));
        cv.addEventListener('pointermove', e => this.move(e));
        const up = () => { this.st.hold = false; this.st.drag = null; };
        cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('pointerleave', up);
        Studio.onKey = (code, down, e) => this.key(code, down, e);
        this.phaseTools();
        const loop = () => { if (!this.cv || !Studio.on) return; this.update(); this.draw(); this.raf = requestAnimationFrame(loop); };
        this.raf = requestAnimationFrame(loop);
    },
    finish(piece) {
        cancelAnimationFrame(this.raf);
        this.cv = null;
        Studio.close();
        const r = this.res; this.res = null;
        if (r) r(piece);
    },
    say(t) { this.U.sub.textContent = t; },
    holdButton(label) {
        const b = chip(label, () => {}, 'big st-hold');
        const on = e => { e.preventDefault(); this.st.hold = true; if (!this.st.pause) this.st.armed = true; b.classList.add('on'); };
        const off = () => { this.st.hold = false; b.classList.remove('on'); };
        b.addEventListener('pointerdown', on);
        b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
        return b;
    },
    phaseTools() {
        const U = this.U, st = this.st;
        U.tools.innerHTML = '';
        if (st.phase === 'center') {
            this.say('Step 1: center the clay. Press and hold, and keep the needle in the green until the wobble stops.');
            U.tools.appendChild(this.holdButton('Hold to press'));
            U.tools.appendChild(el('p', 'muted', G.touchUsed ? 'You can also hold anywhere on the wheel.' : 'Or hold Space. Too much pressure squishes it.'));
        } else if (st.phase === 'open') {
            this.say('Step 2: open it up. Hold to press down into the clay, and let go when the needle is in the green.');
            U.tools.appendChild(this.holdButton('Hold to press down'));
            U.tools.appendChild(el('p', 'muted', 'Too shallow and the bottom is heavy. Too deep and... well, Sully will patch it.'));
        } else if (st.phase === 'shape') {
            this.say('Step 3: shape it. Drag the white handles (or the clay) sideways. Drag the top handle up or down to pull it taller.');
            const pre = el('div', 'st-row');
            for (const name of Object.keys(POT_PRESETS)) pre.appendChild(chip(name, () => { this.snap(); st.prof = fixProf(JSON.parse(JSON.stringify(Object.assign({ handle: false, spout: false }, POT_PRESETS[name])))); this.refresh(); }));
            U.tools.appendChild(stLabel('Start from'));
            U.tools.appendChild(pre);
            const ops = el('div', 'st-row');
            const op = (label, fn) => ops.appendChild(chip(label, () => { this.snap(); fn(st.prof); fixProf(st.prof); this.refresh(); }));
            const vol = (p, dh) => { const h1 = clamp(p.h + dh, 3, POT_H_BIG); const k = Math.sqrt(p.h / h1); p.h = h1; p.r = p.r.map(v => v * k); };
            op('Taller', p => vol(p, 2)); op('Shorter', p => vol(p, -2));
            op('Wider', p => { p.r = p.r.map(v => v + 0.5); }); op('Narrower', p => { p.r = p.r.map(v => v - 0.5); });
            op('Belly', p => { p.r[3] += 0.8; p.r[2] += 0.5; p.r[4] += 0.5; p.r[1] += 0.2; p.r[5] += 0.2; });
            op('Neck', p => { p.r[1] -= 0.8; p.r[2] -= 0.4; p.r[0] -= 0.2; });
            op('Flare', p => { p.r[0] += 0.9; p.r[1] += 0.3; });
            op('Smooth', p => { p.r = p.r.map((v, i, a) => (a[Math.max(0, i - 1)] + v * 2 + a[Math.min(a.length - 1, i + 1)]) / 4); });
            U.tools.appendChild(stLabel('Shape'));
            U.tools.appendChild(ops);
            const add = el('div', 'st-row');
            const tog = (label, key) => { const b = chip(label, () => { this.snap(); st.prof[key] = !st.prof[key]; fixProf(st.prof); b.classList.toggle('on', st.prof[key]); this.refresh(); }); b.classList.toggle('on', !!st.prof[key]); return b; };
            add.appendChild(tog('Handle', 'handle'));
            add.appendChild(tog('Spout', 'spout'));
            add.appendChild(chip('Undo', () => { if (st.hist.length) { st.prof = st.hist.pop(); this.refresh(); } }));
            U.tools.appendChild(stLabel('Extras'));
            U.tools.appendChild(add);
            this.info = el('p', 'muted');
            U.tools.appendChild(this.info);
            const go = el('div', 'st-row');
            go.appendChild(chip("That's the one", () => this.done(), 'go big'));
            U.tools.appendChild(go);
            this.refresh();
        }
    },
    refresh() {
        const st = this.st;
        if (st.phase !== 'shape') return;
        const kind = classifyPot(st.prof);
        st.mask = profileMask(st.prof);
        this.preview = pieceCanvas({ id: 'wheelprev', h: st.prof.h, mask: st.mask, state: 'green' }, { wet: true });
        if (this.info) this.info.textContent = `Right now it's ${aOrAn(kind)} ${kind}.${st.prof.h > POT_H_SMALL ? ' Big enough to stand on the floor.' : ' It fits on a table.'}`;
    },
    snap() { this.st.hist.push(JSON.parse(JSON.stringify(this.st.prof))); if (this.st.hist.length > 40) this.st.hist.shift(); },
    done() {
        const st = this.st;
        st.phase = 'name';
        const kind = classifyPot(st.prof);
        const sugg = cap((st.prof.h >= 18 ? 'tall ' : st.prof.h <= 7 && kind !== 'plate' ? 'little ' : '') + kind);
        nameStep(this.U, sugg, name => {
            const p = { id: newPieceId(), kind, base: cap(kind), h: st.prof.h, mask: profileMask(st.prof), glaze: null, state: 'green', stars: clamp(1 + Math.round(st.qC + st.qO), 1, 3),
                big: st.prof.h > POT_H_SMALL, prof: st.prof, auto: false, day: Clock.dayNum() };
            p.custom = name !== sugg ? name : null;
            p.name = p.custom || sugg;
            this.finish(p);
        });
    },
    key(code, down, e) {
        const st = this.st;
        if (code === 'Escape' && down) { this.finish(null); return; }
        if (st.phase === 'center' || st.phase === 'open') {
            if (code === 'Space' || code === 'Enter' || code === 'KeyE') {
                if (down && e && e.repeat) return;              // a key held down since the last step doesn't count
                st.hold = down;
                if (down && !st.pause) st.armed = true;
            }
            return;
        }
        if (st.phase !== 'shape' || !down) return;
        const p = st.prof;
        if (code === 'ArrowUp' || code === 'KeyW') st.sel = Math.max(0, st.sel - 1);
        else if (code === 'ArrowDown' || code === 'KeyS') st.sel = Math.min(6, st.sel + 1);
        else if (code === 'ArrowLeft' || code === 'KeyA') { this.snap(); p.r[st.sel] -= 0.4; fixProf(p); this.refresh(); }
        else if (code === 'ArrowRight' || code === 'KeyD') { this.snap(); p.r[st.sel] += 0.4; fixProf(p); this.refresh(); }
        else if (code === 'KeyR') { this.snap(); p.h += 1; fixProf(p); this.refresh(); }
        else if (code === 'KeyF') { this.snap(); p.h -= 1; fixProf(p); this.refresh(); }
        else if (code === 'Enter') this.done();
    },
    geom() {
        const p = this.st.prof, K = Math.min(6, 150 / p.h);
        return { K, top: WH.base - p.h * K };
    },
    handles() {
        const p = this.st.prof, { K, top } = this.geom();
        return p.r.map((r, i) => [WH.cx + profR(p, i / 6) * K + 7, top + (i / 6) * p.h * K]);
    },
    down(e) {
        const st = this.st;
        e.preventDefault();
        if (st.phase === 'center' || st.phase === 'open') { st.hold = true; if (!st.pause) st.armed = true; return; }
        if (st.phase !== 'shape') return;
        const [x, y] = canvasPoint(this.cv, e);
        const hs = this.handles();
        let best = -1, bd = 1e9;
        hs.forEach(([hx, hy], i) => { const d = Math.hypot(hx - x, hy - y); if (d < bd) { bd = d; best = i; } });
        if (bd > 16) {
            // grabbing the clay itself: the nearest height
            const { K, top } = this.geom();
            if (y < top - 12 || y > WH.base + 6) return;
            best = clamp(Math.round((y - top) / (st.prof.h * K) * 6), 0, 6);
        }
        this.snap();
        st.sel = best;
        st.drag = { i: best, x0: x, y0: y, r0: st.prof.r.slice(), h0: st.prof.h, K: this.geom().K };
        try { this.cv.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
    },
    move(e) {
        const st = this.st, d = st.drag;
        if (!d || st.phase !== 'shape') return;
        const [x, y] = canvasPoint(this.cv, e);
        const dr = (x - d.x0) / d.K;
        const p = st.prof;
        p.r = d.r0.map((v, j) => { const k = Math.abs(j - d.i); return v + dr * (k === 0 ? 1 : k === 1 ? 0.45 : k === 2 ? 0.15 : 0); });
        if (d.i === 0) p.h = d.h0 - (y - d.y0) / d.K;
        fixProf(p);
        this.refresh();
    },
    update() {
        const st = this.st;
        st.t++;
        if (st.phase === 'center') {
            st.pressure = clamp(st.pressure + (st.hold ? 0.018 : -0.022), 0, 1);
            const inBand = st.pressure >= 0.52 && st.pressure <= 0.8;
            if (inBand) st.prog = Math.min(1, st.prog + 0.0075);
            else if (st.prog > 0.05) st.off++;
            if (st.pressure > 0.93) { st.prog = Math.max(0, st.prog - 0.004); if (st.t % 30 === 0) this.say('Too hard! Ease up a little. The clay is getting squished.'); }
            st.wob = 1 - st.prog;
            if (st.prog >= 1) {
                st.qC = clamp(1 - st.off / 260, 0, 1);
                // a little breather before step 2: the press that finished centering doesn't carry over into opening
                st.phase = 'open'; st.hold = false; st.pressure = 0; st.armed = false; st.pressed = false; st.pause = 45;
                Sfx.play('item');
                this.phaseTools();
                this.say(st.qC > 0.7 ? 'Centered! Smooth as butter. Now open it up: hold to press down, let go in the green.' : 'Centered! A little wobbly, but it counts. Now open it up: hold to press down, let go in the green.');
            }
        } else if (st.phase === 'open') {
            if (st.pause > 0) { st.pause--; return; }
            if (st.hold && st.armed) st.depth = Math.min(1, st.depth + 0.011), st.pressed = true;
            // a quick tap isn't a real press: keep going until it's at least a little way down
            if (!st.hold && st.pressed && st.depth < 0.2) { st.pressed = false; st.armed = false; this.say('Keep holding! Press down until the needle reaches the green, then let go.'); }
            if ((!st.hold && st.pressed) || st.depth >= 1) {
                const dp = st.depth;
                st.qO = dp >= 0.62 && dp <= 0.8 ? 1 : dp < 0.62 ? 0.5 : dp < 0.95 ? 0.6 : 0.2;
                st.phase = 'shape';
                st.prof = fixProf({ h: 9, r: [4.5, 4.8, 5, 5.2, 5.3, 5.2, 4.8], handle: false, spout: false });
                Sfx.play(st.qO === 1 ? 'fanfare' : 'item');
                this.phaseTools();
                this.say((st.qO === 1 ? 'Perfect! Nice even floor. ' : dp < 0.62 ? 'A little thick on the bottom. Still good! ' : dp < 0.95 ? 'Just a touch deep. No problem. ' : 'Whoa, almost went through! Sully patched it. ')
                    + 'Now shape it: drag the white handles, or pick a starting shape.');
            }
        }
    },
    /* the clay on the wheel, shaded like a spinning pot */
    draw() {
        const ctx = this.ctx, st = this.st, img = this.img, D = img.data;
        D.fill(0);
        ctx.fillStyle = '#3b2a45'; ctx.fillRect(0, 0, WH.W, WH.H);
        ctx.fillStyle = '#46334f'; ctx.fillRect(0, 0, WH.W, 120);
        // splash pan + wheel head
        ctx.fillStyle = '#5a6070'; ctx.beginPath(); ctx.ellipse(WH.cx, WH.base + 5, 64, 14, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#8a96a8'; ctx.beginPath(); ctx.ellipse(WH.cx, WH.base + 2, 50, 9, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#b8c4d0'; ctx.beginPath(); ctx.ellipse(WH.cx, WH.base + 1, 46, 7, 0, 0, 7); ctx.fill();
        for (let k = 0; k < 6; k++) { const a = st.t * 0.14 + k * 1.047; if (Math.sin(a) < 0) continue; ctx.fillStyle = '#6b7385'; ctx.fillRect(Math.round(WH.cx + Math.cos(a) * 42), Math.round(WH.base + 1 + Math.sin(a) * 5), 2, 1); }
        // the clay
        let prof, K, ox = 0, opened = st.phase !== 'center';
        if (st.phase === 'center' || st.phase === 'open') {
            prof = { h: 8, r: [3.8, 5, 5.4, 5.5, 5.5, 5.4, 5.2] };
            K = 6;
            if (st.phase === 'center') ox = st.wob * 5 * Math.sin(st.t * 0.33) + (st.pressure > 0.93 ? Math.sin(st.t) : 0);
        } else { prof = st.prof; K = Math.min(6, 150 / prof.h); }
        const Hp = prof.h * K, top = WH.base - Hp;
        const base = hexRgb(CLAY_WET);
        for (let yy = 0; yy <= Hp; yy++) {
            const y = Math.round(top + yy);
            if (y < 0 || y >= WH.H) continue;
            const r = profR(prof, yy / Hp) * K * (yy === Math.round(Hp) ? 0.9 : 1);
            const ring = ((yy + Math.floor(st.t / 3)) % 6) === 0;
            for (let x = Math.floor(WH.cx + ox - r); x <= Math.ceil(WH.cx + ox + r); x++) {
                if (x < 0 || x >= WH.W) continue;
                const nx = (x + 0.5 - WH.cx - ox) / r;
                if (Math.abs(nx) > 1) continue;
                let l = 0.6 + 0.4 * (Math.sqrt(1 - nx * nx) * 0.85 - nx * 0.4);
                if (nx > -0.62 && nx < -0.4) l += 0.14;          // wet sheen
                if (ring) l -= 0.07;
                const i = (y * WH.W + x) * 4;
                D[i] = clamp(base[0] * l, 0, 255); D[i + 1] = clamp(base[1] * l, 0, 255); D[i + 2] = clamp(base[2] * l, 0, 255); D[i + 3] = 255;
            }
        }
        this.bctx.putImageData(img, 0, 0);
        ctx.drawImage(this.buf, 0, 0);
        // the rim: open pots show their inside
        const r0 = profR(prof, 0) * K;
        if (opened) {
            const dp = st.phase === 'open' ? st.depth : 1;
            ctx.fillStyle = '#c98f6b'; ctx.beginPath(); ctx.ellipse(WH.cx + ox, top + 1, r0, Math.max(2, r0 * 0.22), 0, 0, 7); ctx.fill();
            ctx.fillStyle = '#5a3426'; ctx.beginPath(); ctx.ellipse(WH.cx + ox, top + 1.5, Math.max(1, (r0 - 3) * (st.phase === 'open' ? 0.3 + dp * 0.7 : 1)), Math.max(1, (r0 * 0.22 - 1) * (st.phase === 'open' ? 0.3 + dp * 0.7 : 1)), 0, 0, 7); ctx.fill();
        } else {
            ctx.fillStyle = '#c98f6b'; ctx.beginPath(); ctx.ellipse(WH.cx + ox, top + 2, r0 * 0.9, 3, 0, 0, 7); ctx.fill();
        }
        // a little spin mark on the front
        const a = st.t * 0.16;
        if (Math.cos(a) > 0.2) { ctx.fillStyle = 'rgba(90,52,38,0.55)'; ctx.fillRect(Math.round(WH.cx + ox + Math.sin(a) * profR(prof, 0.5) * K * 0.9), Math.round(top + Hp * 0.5), 2, 2); }
        if (st.phase === 'shape') {
            const p = st.prof;
            // handle + spout previews
            if (p.handle) { ctx.strokeStyle = '#a8735a'; ctx.lineWidth = 4; ctx.beginPath(); const hy = top + Hp * 0.43, hr = Hp * 0.23; ctx.arc(WH.cx + profR(p, 0.43) * K - 2, hy, hr, -Math.PI / 2, Math.PI / 2); ctx.stroke(); }
            if (p.spout) { ctx.fillStyle = '#c98f6b'; ctx.beginPath(); ctx.moveTo(WH.cx - r0 + 3, top); ctx.lineTo(WH.cx - r0 - 7, top - 3); ctx.lineTo(WH.cx - r0 + 3, top + 5); ctx.fill(); }
            // handles
            const hs = this.handles();
            hs.forEach(([hx, hy], i) => {
                const px = WH.cx + profR(p, i / 6) * K;
                ctx.strokeStyle = 'rgba(255,247,241,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px, hy); ctx.lineTo(hx - 3, hy); ctx.stroke();
                ctx.fillStyle = i === st.sel ? '#ffcf57' : '#fff7f1';
                ctx.strokeStyle = '#1c1426'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.arc(hx, hy, i === 0 ? 4.5 : 3.5, 0, 7); ctx.fill(); ctx.stroke();
                if (i === 0) { ctx.fillStyle = '#fff7f1'; ctx.beginPath(); ctx.moveTo(hx, hy - 12); ctx.lineTo(hx - 4, hy - 7); ctx.lineTo(hx + 4, hy - 7); ctx.fill(); }
            });
            // what it will look like on a shelf
            if (this.preview) {
                ctx.fillStyle = 'rgba(255,247,241,0.9)'; ctx.fillRect(4, 4, 38, 62);
                ctx.imageSmoothingEnabled = false;
                const pw = this.preview.width * 2, ph = this.preview.height * 2;
                ctx.drawImage(this.preview, 23 - pw / 2, 62 - ph, pw, ph);
            }
        } else {
            // the gauge
            const gx = 146, gy = 26, gh = 140;
            const band = st.phase === 'center' ? [0.52, 0.8] : [0.62, 0.8];
            const v = st.phase === 'center' ? st.pressure : st.depth;
            ctx.fillStyle = '#241a30'; ctx.fillRect(gx - 1, gy - 1, 10, gh + 2);
            ctx.fillStyle = '#6b5a78'; ctx.fillRect(gx, gy, 8, gh);
            ctx.fillStyle = '#8cc152'; ctx.fillRect(gx, gy + gh * (1 - band[1]), 8, gh * (band[1] - band[0]));
            if (st.phase === 'center') { ctx.fillStyle = '#e0405a'; ctx.fillRect(gx, gy, 8, gh * 0.07); }
            ctx.fillStyle = '#fff7f1'; ctx.fillRect(gx - 4, Math.round(gy + gh * (1 - v)) - 1, 16, 3);
            if (st.phase === 'center') {
                ctx.fillStyle = '#241a30'; ctx.fillRect(12, 16, 100, 7);
                ctx.fillStyle = '#ffcf57'; ctx.fillRect(13, 17, Math.round(98 * st.prog), 5);
            }
            // Sarah's hands on the clay while pressing
            if (st.hold) {
                ctx.fillStyle = '#fbd9c6'; ctx.strokeStyle = '#8a5a4a'; ctx.lineWidth = 1;
                const hy = st.phase === 'center' ? WH.base - 26 : top - 4 + st.depth * 10;
                if (st.phase === 'center') { for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(WH.cx + ox + sx * 36, hy, 8, 5, 0, 0, 7); ctx.fill(); ctx.stroke(); } }
                else { ctx.beginPath(); ctx.ellipse(WH.cx, hy, 7, 5, 0, 0, 7); ctx.fill(); ctx.stroke(); }
            }
        }
    },
};

/* ---------------------------------------------------------------- hand-building + freestyle sculpting */
const Sculpt = {
    run(pick) { return new Promise(res => this.start(pick, res)); },
    start(pick, res) {
        const tpl = pick.template ? GD.potTemplates[pick.template] : null;
        const big = pick.free === 'big' || (tpl && tpl.big);
        const W = POT_W, H = big ? POT_H_BIG : POT_H_SMALL;
        const m = new Array(W * H).fill('.');
        if (tpl) tpl.rows.forEach((row, y) => { const yy = H - tpl.rows.length + y; for (let x = 0; x < W; x++) m[yy * W + x] = row[x]; });
        else for (let y = H - 4; y < H; y++) for (let x = 4; x < 10; x++) m[y * W + x] = 'o';
        this.s = { W, H, m, start: m.slice(), tool: 'clay', mirror: !tpl, hist: [], tpl: pick.template || null, tplName: tpl ? tpl.name : 'Sculpture', last: -1 };
        this.res = res;
        const U = Studio.open(tpl ? `Hand-building: ${tpl.name.toLowerCase()}` : 'Freestyle sculpting',
            tpl ? 'Tweak it however you like: add clay, carve it away, draw lines, poke holes. Or just hit Done.' : 'Paint clay onto the board to build your piece. Mirror makes both sides match.');
        this.U = U;
        this.C = big ? 9 : 14;
        const cv = el('canvas', 'st-canvas');
        cv.width = W * this.C + 8; cv.height = H * this.C + 8;
        U.box.appendChild(cv);
        this.cv = cv; this.ctx = cv.getContext('2d');
        Studio.onResize = fitCanvas(cv, U.box, cv.width, cv.height);
        U.x.addEventListener('click', () => this.finish(null));
        cv.addEventListener('pointerdown', e => { e.preventDefault(); this.push(); this.paintAt(e); try { cv.setPointerCapture(e.pointerId); } catch (err) { /* fine */ } this.down = true; });
        cv.addEventListener('pointermove', e => { if (this.down) this.paintAt(e); });
        const up = () => { this.down = false; this.s.last = -1; };
        cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
        Studio.onKey = (code, down) => { if (down && code === 'Escape') this.finish(null); if (down && code === 'Enter') this.done(); if (down && code === 'KeyZ') this.undo(); };
        this.tools();
        this.draw();
    },
    tools() {
        const U = this.U, s = this.s;
        U.tools.innerHTML = '';
        U.tools.appendChild(stLabel('Tool'));
        const row = el('div', 'st-row');
        const tb = {};
        for (const [k, label] of [['clay', 'Add clay'], ['carve', 'Carve'], ['line', 'Draw line'], ['hole', 'Poke hole']]) {
            tb[k] = chip(label, () => { s.tool = k; for (const [kk, b] of Object.entries(tb)) b.classList.toggle('on', kk === k); });
            tb[k].classList.toggle('on', s.tool === k);
            row.appendChild(tb[k]);
        }
        U.tools.appendChild(row);
        const row2 = el('div', 'st-row');
        const mir = chip('Mirror', b => { s.mirror = !s.mirror; b.classList.toggle('on', s.mirror); this.draw(); });
        mir.classList.toggle('on', s.mirror);
        row2.appendChild(mir);
        row2.appendChild(chip('Undo', () => this.undo()));
        row2.appendChild(chip('Start over', () => { this.push(); s.m = s.start.slice(); this.draw(); }));
        if (!s.tpl) row2.appendChild(chip('Clear', () => { this.push(); s.m.fill('.'); this.draw(); }));
        U.tools.appendChild(row2);
        U.tools.appendChild(el('p', 'muted', 'Lines and holes only go on clay. Lines become little grooves the glaze settles into.'));
        const go = el('div', 'st-row');
        go.appendChild(chip('Done', () => this.done(), 'go big'));
        U.tools.appendChild(go);
    },
    push() { this.s.hist.push(this.s.m.slice()); if (this.s.hist.length > 60) this.s.hist.shift(); },
    undo() { if (this.s.hist.length) { this.s.m = this.s.hist.pop(); this.draw(); } },
    paintAt(e) {
        const s = this.s, [px, py] = canvasPoint(this.cv, e);
        const x = Math.floor((px - 4) / this.C), y = Math.floor((py - 4) / this.C);
        if (x < 0 || y < 0 || x >= s.W || y >= s.H) return;
        const i = y * s.W + x;
        if (i === s.last) return;
        s.last = i;
        const set = (xx, yy) => {
            const j = yy * s.W + xx, cur = s.m[j];
            if (s.tool === 'clay') s.m[j] = cur === '.' ? 'o' : cur === 'd' || cur === 'i' ? 'o' : cur;
            else if (s.tool === 'carve') s.m[j] = '.';
            else if (s.tool === 'line' && cur !== '.') s.m[j] = 'd';
            else if (s.tool === 'hole' && cur !== '.') s.m[j] = 'i';
        };
        set(x, y);
        if (s.mirror) set(s.W - 1 - x, y);
        Sfx.step('wood');
        this.draw();
    },
    draw() {
        const s = this.s, ctx = this.ctx, C = this.C;
        ctx.fillStyle = '#3b2a45'; ctx.fillRect(0, 0, this.cv.width, this.cv.height);
        ctx.fillStyle = '#efe6f4'; ctx.fillRect(4, 4, s.W * C, s.H * C);
        ctx.fillStyle = '#e4d8ec';
        for (let y = 0; y < s.H; y++) for (let x = 0; x < s.W; x++) if ((x + y) % 2) ctx.fillRect(4 + x * C, 4 + y * C, C, C);
        const rgb = pieceRGB({ id: 'sculpt', h: s.H, mask: s.m.join(''), auto: true, state: 'green' }, { wet: true });
        for (let y = 0; y < s.H; y++) for (let x = 0; x < s.W; x++) {
            const c = rgb[y * s.W + x];
            if (!c) continue;
            ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
            ctx.fillRect(4 + x * C, 4 + y * C, C, C);
        }
        ctx.strokeStyle = 'rgba(59,42,69,0.12)'; ctx.lineWidth = 1;
        for (let x = 0; x <= s.W; x++) { ctx.beginPath(); ctx.moveTo(4 + x * C + 0.5, 4); ctx.lineTo(4 + x * C + 0.5, 4 + s.H * C); ctx.stroke(); }
        for (let y = 0; y <= s.H; y++) { ctx.beginPath(); ctx.moveTo(4, 4 + y * C + 0.5); ctx.lineTo(4 + s.W * C, 4 + y * C + 0.5); ctx.stroke(); }
        if (s.mirror) { ctx.strokeStyle = 'rgba(224,64,90,0.55)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(4 + s.W * C / 2, 4); ctx.lineTo(4 + s.W * C / 2, 4 + s.H * C); ctx.stroke(); ctx.setLineDash([]); }
    },
    done() {
        const s = this.s;
        const n = s.m.filter(c => c !== '.').length;
        if (n < 8) { this.U.sub.textContent = "That's barely a pebble! Add a little more clay first."; Sfx.ui('nope'); return; }
        // trim empty rows off the top
        let top = 0;
        while (top < s.H - 3 && s.m.slice(top * s.W, (top + 1) * s.W).every(c => c === '.')) top++;
        const h = s.H - top, mask = s.m.slice(top * s.W).join('');
        const kind = s.tpl || 'sculpture';
        const sugg = s.tpl ? s.tplName : 'Sculpture';
        nameStep(this.U, sugg, name => {
            const p = { id: newPieceId(), kind, base: sugg, h, mask, glaze: null, state: 'green', stars: 2, big: h > POT_H_SMALL, auto: true, day: Clock.dayNum() };
            p.custom = name !== sugg ? name : null;
            p.name = p.custom || sugg;
            this.finish(p);
        });
    },
    finish(p) {
        this.cv = null;
        Studio.close();
        const r = this.res; this.res = null;
        if (r) r(p);
    },
};

/* ---------------------------------------------------------------- glazing */
const Glaze = {
    run(p) { return new Promise(res => this.start(p, res)); },
    start(p, res) {
        const W = POT_W, H = p.h;
        this.p = p; this.res = res;
        this.g = { gl: (p.glaze || '0'.repeat(W * H)).split(''), col: 'c', tool: 'brush', mirror: !p.auto, finish: p.finish || 'gloss', speckle: !!p.speckle, hist: [], last: -1 };
        // Sarah's own glaze colors live on the piece (keys A, B, C...)
        this.cols = Object.assign({}, p.cols || {});
        for (const c of myColors()) this.addCol(c);
        const U = Studio.open(`Glazing: ${p.name.toLowerCase()}`, 'Pick a glaze, then paint, fill or dip. Patterns go on in the color you have picked.');
        this.U = U;
        this.C = H > POT_H_SMALL ? 9 : 14;
        const cv = el('canvas', 'st-canvas');
        cv.width = W * this.C + 8; cv.height = H * this.C + 8;
        U.box.appendChild(cv);
        this.cv = cv; this.ctx = cv.getContext('2d');
        Studio.onResize = fitCanvas(cv, U.box, cv.width, cv.height);
        U.x.addEventListener('click', () => this.finish(false));
        cv.addEventListener('pointerdown', e => { e.preventDefault(); this.push(); this.at(e, true); try { cv.setPointerCapture(e.pointerId); } catch (err) { /* fine */ } this.down = true; });
        cv.addEventListener('pointermove', e => { if (this.down && this.g.tool === 'brush') this.at(e, false); });
        const up = () => { this.down = false; this.g.last = -1; };
        cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
        Studio.onKey = (code, down) => { if (down && code === 'Escape') this.finish(false); if (down && code === 'Enter') this.done(); if (down && code === 'KeyZ') this.undo(); };
        this.tools();
        this.draw();
    },
    body(i) { return this.p.mask[i] !== '.'; },
    keyOf(c) { const e = Object.entries(this.cols).find(([, v]) => v[0] === c.hex && v[1] === c.name); return e ? e[0] : null; },
    addCol(c) {
        const have = this.keyOf(c);
        if (have) return have;
        const used = new Set(this.g.gl);
        for (let k = 0; k < 20; k++) { const key = String.fromCharCode(65 + k); if (!this.cols[key] || !used.has(key)) { this.cols[key] = [c.hex, c.name]; return key; } }
        return null;
    },
    rows() {
        const W = POT_W, H = this.p.h;
        let t = H, b = -1;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (this.body(y * W + x)) { t = Math.min(t, y); b = Math.max(b, y); }
        return [t, b];
    },
    tools() {
        const U = this.U, g = this.g;
        U.tools.innerHTML = '';
        U.tools.appendChild(stLabel('Glazes'));
        const sw = el('div', 'swatches');
        const sws = {};
        const pickCol = k => { g.col = k; for (const [kk, b] of Object.entries(sws)) b.classList.toggle('on', kk === k); };
        for (const [k, [hex, name]] of Object.entries(GLAZES)) {
            const b = el('button', 'swatch');
            b.type = 'button'; b.title = name; b.setAttribute('aria-label', name);
            b.style.background = hex;
            b.addEventListener('click', () => { Sfx.ui('tick'); pickCol(k); });
            sws[k] = b; sw.appendChild(b);
        }
        mySwatches(sw, c => g.col === this.keyOf(c), c => { const k = this.addCol(c); if (k) { g.col = k; this.tools(); } },
            () => colorForm(U, { done: c => { if (c) { const k = this.addCol(c); if (k) g.col = k; } this.tools(); } }));
        for (const b of sw.querySelectorAll('.swatch.mine')) { const c = myColors().find(q => q.name === b.title); const k = c && this.keyOf(c); if (k) sws[k] = b; }
        U.tools.appendChild(sw);
        if (/[A-Z]/.test(g.col)) editMine(U, myColors().find(c => this.keyOf(c) === g.col), () => { this.tools(); this.draw(); });
        const bare = chip('Bare clay (eraser)', () => pickCol('0'));
        sws['0'] = bare;
        const r0 = el('div', 'st-row');
        r0.appendChild(bare);
        U.tools.appendChild(r0);
        pickCol(g.col);
        U.tools.appendChild(stLabel('Paint'));
        const r1 = el('div', 'st-row');
        const tb = {};
        for (const [k, label] of [['brush', 'Brush'], ['fill', 'Fill']]) {
            tb[k] = chip(label, () => { g.tool = k; for (const [kk, b] of Object.entries(tb)) b.classList.toggle('on', kk === k); });
            tb[k].classList.toggle('on', g.tool === k);
            r1.appendChild(tb[k]);
        }
        const mir = chip('Mirror', b => { g.mirror = !g.mirror; b.classList.toggle('on', g.mirror); });
        mir.classList.toggle('on', g.mirror);
        r1.appendChild(mir);
        U.tools.appendChild(r1);
        U.tools.appendChild(stLabel('Dip and patterns'));
        const r2 = el('div', 'st-row');
        const op = (label, fn) => r2.appendChild(chip(label, () => { this.push(); fn(); this.draw(); }));
        const W = POT_W;
        op('Dip all', () => this.each(() => true));
        op('Dip top', () => { const [t, b] = this.rows(); const mid = t + (b - t + 1) / 2; this.each((x, y) => y < mid); });
        op('Dip bottom', () => { const [t, b] = this.rows(); const mid = t + (b - t + 1) / 2; this.each((x, y) => y >= mid); });
        op('Stripes', () => { const [t] = this.rows(); this.each((x, y) => (y - t) % 3 === 2); });
        op('Dots', () => { const [t] = this.rows(); this.each((x, y) => (y - t) % 3 === 1 && (x + Math.floor((y - t) / 3) * 2) % 4 === 1); });
        op('Drips', () => {
            const [t, b] = this.rows();
            const maxLen = Math.max(2, Math.floor((b - t + 1) * 0.5));
            for (let x = 0; x < W; x++) {
                let top = -1;
                for (let y = 0; y < this.p.h; y++) if (this.body(y * W + x)) { top = y; break; }
                if (top < 0) continue;
                const len = 1 + (hash32(this.p.id + ':drip:' + x) % maxLen);
                for (let y = top; y < Math.min(this.p.h, top + len); y++) if (this.body(y * W + x)) this.g.gl[y * W + x] = this.g.col;
            }
        });
        U.tools.appendChild(r2);
        U.tools.appendChild(stLabel('Finish'));
        const r3 = el('div', 'st-row');
        const fb = {};
        for (const [k, label] of [['gloss', 'Glossy'], ['matte', 'Matte']]) {
            fb[k] = chip(label, () => { g.finish = k; for (const [kk, b] of Object.entries(fb)) b.classList.toggle('on', kk === k); this.draw(); });
            fb[k].classList.toggle('on', g.finish === k);
            r3.appendChild(fb[k]);
        }
        const spk = chip('Speckled', b => { g.speckle = !g.speckle; b.classList.toggle('on', g.speckle); this.draw(); });
        spk.classList.toggle('on', g.speckle);
        r3.appendChild(spk);
        U.tools.appendChild(r3);
        const r4 = el('div', 'st-row');
        r4.appendChild(chip('Undo', () => this.undo()));
        r4.appendChild(chip('Wipe it all off', () => { this.push(); g.gl.fill('0'); this.draw(); }));
        U.tools.appendChild(r4);
        const go = el('div', 'st-row');
        go.appendChild(chip('Done glazing', () => this.done(), 'go big'));
        U.tools.appendChild(go);
    },
    each(pred) {
        const W = POT_W;
        for (let y = 0; y < this.p.h; y++) for (let x = 0; x < W; x++) if (this.body(y * W + x) && pred(x, y)) this.g.gl[y * W + x] = this.g.col;
    },
    push() { this.g.hist.push(this.g.gl.slice()); if (this.g.hist.length > 60) this.g.hist.shift(); },
    undo() { if (this.g.hist.length) { this.g.gl = this.g.hist.pop(); this.draw(); } },
    at(e, first) {
        const g = this.g, W = POT_W, [px, py] = canvasPoint(this.cv, e);
        const x = Math.floor((px - 4) / this.C), y = Math.floor((py - 4) / this.C);
        if (x < 0 || y < 0 || x >= W || y >= this.p.h) return;
        const i = y * W + x;
        if (!this.body(i) || i === g.last) return;
        g.last = i;
        if (g.tool === 'fill') {
            if (!first) return;
            const from = g.gl[i];
            if (from === g.col) return;
            const q = [i], seen = new Set([i]);
            while (q.length) {
                const j = q.pop();
                g.gl[j] = g.col;
                const jx = j % W, jy = Math.floor(j / W);
                for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                    const nx = jx + dx, ny = jy + dy;
                    if (nx < 0 || ny < 0 || nx >= W || ny >= this.p.h) continue;
                    const k = ny * W + nx;
                    if (seen.has(k) || !this.body(k) || g.gl[k] !== from) continue;
                    seen.add(k); q.push(k);
                }
            }
        } else {
            g.gl[i] = g.col;
            if (g.mirror) { const j = y * W + (W - 1 - x); if (this.body(j)) g.gl[j] = g.col; }
        }
        Sfx.step('sand');
        this.draw();
    },
    draw() {
        const p = this.p, g = this.g, ctx = this.ctx, C = this.C, W = POT_W;
        ctx.fillStyle = '#3b2a45'; ctx.fillRect(0, 0, this.cv.width, this.cv.height);
        ctx.fillStyle = '#efe6f4'; ctx.fillRect(4, 4, W * C, p.h * C);
        ctx.fillStyle = '#e4d8ec';
        for (let y = 0; y < p.h; y++) for (let x = 0; x < W; x++) if ((x + y) % 2) ctx.fillRect(4 + x * C, 4 + y * C, C, C);
        const rgb = pieceRGB(Object.assign({}, p, { finish: g.finish, speckle: g.speckle, cols: this.cols }), { glaze: g.gl.join('') });
        for (let y = 0; y < p.h; y++) for (let x = 0; x < W; x++) {
            const c = rgb[y * W + x];
            if (!c) continue;
            ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
            ctx.fillRect(4 + x * C, 4 + y * C, C, C);
        }
        ctx.strokeStyle = 'rgba(59,42,69,0.12)'; ctx.lineWidth = 1;
        for (let x = 0; x <= W; x++) { ctx.beginPath(); ctx.moveTo(4 + x * C + 0.5, 4); ctx.lineTo(4 + x * C + 0.5, 4 + p.h * C); ctx.stroke(); }
        for (let y = 0; y <= p.h; y++) { ctx.beginPath(); ctx.moveTo(4, 4 + y * C + 0.5); ctx.lineTo(4 + W * C, 4 + y * C + 0.5); ctx.stroke(); }
    },
    done() {
        const p = this.p, g = this.g;
        const s = g.gl.join('');
        p.glaze = /[^0]/.test(s) ? s : null;
        p.finish = g.finish; p.speckle = g.speckle;
        const used = new Set(g.gl), cols = {};
        for (const [k, v] of Object.entries(this.cols)) if (used.has(k)) cols[k] = v;
        if (Object.keys(cols).length) p.cols = cols; else delete p.cols;
        this.finish(true);
    },
    finish(ok) {
        this.cv = null;
        Studio.close();
        const r = this.res; this.res = null;
        if (r) r(ok);
    },
};

