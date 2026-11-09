/* What the Kiln brings: charms hung from the ceiling over walkable floor (only flying things reach them:
   shards, thrown things), clay seals that shatter, sequence locks, eyelets to hook onto, the Hookline, and
   Crocks (pots that walk; break one and its shards fly home along the way it walked). */

/* ---------- charms: hanging clay bells ---------- */
class Charm extends Ent {
    constructor(tx, ty, props = {}) {
        super('charm', props);
        this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T;
        this.mode = props.mode || (props.seq ? 'seq' : 'toggle');     /* toggle | once | seq */
        this.on = false; this.swing = 0; this.cool = 0;
        this.col = props.col || 'ochre';
        this.inert = false;
    }
    onAdd(area) { if (this.id && Progress.areaFlag(area.id, 'charm:' + this.id)) this.on = true; }
    get sortY() { return this.y + 40; }
    /* shards and thrown things strike it in passing */
    strike(by) {
        if (this.cool > 0) return;
        this.cool = 14; this.swing = 30;
        Sfx.play('charm');
        Fx.ring(this.x + 8, this.y - 6, CHARM_COL[this.col] || '#f0b060');
        if (this.mode === 'toggle') this.on = !this.on;
        else if (this.mode === 'once') { this.on = true; if (this.id) Progress.setAreaFlag(this.area.id, 'charm:' + this.id); }
        else if (this.mode === 'seq') SeqLocks.hit(this);
        Stats.count('charms');
    }
    update() { if (this.swing > 0) this.swing--; if (this.cool > 0) this.cool--; if (this.on && this.sig) Signals.set(this.area, this.sig); }
    draw(cx, cy) {
        const x = this.x - cx + 8, y = this.y - cy;
        const sw = Math.sin(this.swing / 3) * (this.swing / 30) * 3;
        /* the chain from the ceiling, then the bell above head height */
        for (let i = -14; i < -6; i += 2) Gfx.rect(x + Math.round(sw * (i + 14) / 8), y + i, 1, 1, '#5a4a3a');
        const bx = x + Math.round(sw), by = y - 6;
        const c = CHARM_COL[this.col] || '#e0913a', lit = this.on ? shade(c, 0.35) : c;
        Gfx.rect(bx - 4, by, 8, 6, PAL.ink); Gfx.rect(bx - 3, by + 1, 6, 5, lit); Gfx.rect(bx - 5, by + 5, 10, 2, PAL.ink); Gfx.rect(bx - 4, by + 5, 8, 1, shade(lit, -0.2));
        Gfx.rect(bx - 2, by + 1, 1, 3, shade(lit, 0.4));
        if (this.glyph) Gfx.rect(bx - 1, by + 2, 2, 2, PAL.ink);
        /* its shadow on the floor, so you can see where it hangs */
        Gfx.alpha(0.18); Gfx.rect(x - 4, y + 9, 8, 2, PAL.ink); Gfx.alpha(1);
    }
}
const CHARM_COL = { ochre: '#e0913a', sun: '#f7d64a', moon: '#9fd4f0', star: '#f59ac0', leaf: '#8fd46a', ember: '#e8463c' };
SPAWN.charm = (x, y, p) => new Charm(x, y, p);

/* a sequence lock: charms with seq: 'name' and order 0,1,2... must be struck in order */
const SeqLocks = {
    hit(c) {
        const a = c.area, name = c.seq;
        if (Progress.areaFlag(a.id, 'seq:' + name)) return;
        const st = a.seqState = a.seqState || {};
        const want = st[name] || 0;
        const all = a.ents.filter(e => e.kind === 'charm' && e.seq === name);
        if (c.order === want) {
            st[name] = want + 1; c.on = true;
            if (st[name] >= all.length) { Progress.setAreaFlag(a.id, 'seq:' + name); Sfx.play('appear'); }
        } else {
            st[name] = 0; for (const e of all) e.on = false;
            Sfx.play('unclick'); Fx.text(c.x + 8, c.y - 12, '...', PAL.grey2);
        }
    },
    tick(a) {
        for (const e of a.ents) if (e.kind === 'charm' && e.seq && Progress.areaFlag(a.id, 'seq:' + e.seq)) { e.on = true; Signals.set(a, e.seq); }
    },
};

/* clay seals: solid plugs that shatter when something flies into them */
class Seal extends GridThing {
    constructor(tx, ty, props = {}) { super('seal', tx, ty, Object.assign({ weight: WEIGHT.fixed, fixed: true, marked: false }, props)); }
    onAdd(area) { super.onAdd(area); if (this.id && Progress.areaFlag(area.id, 'seal:' + this.id)) area.remove(this); }
    hit(by, d, shard) {
        if (!by || (!shard && !by.flying && !by.isGrid)) { Sfx.play('hitthing'); return; }
        Sfx.play('shatter'); Fx.burst(this.tx * T + 8, this.ty * T + 8, '#c4623a'); G.shake = 4;
        if (this.id) Progress.setAreaFlag(this.area.id, 'seal:' + this.id);
        this.area.remove(this);
    }
    onStruck() { UI.toast('Hard clay. Something thrown might crack it.'); }
    sprite() { return spr('seal'); }
}
SPAWN.seal = (x, y, p) => new Seal(x, y, p);

/* eyelets: brass rings on posts the Hookline catches on */
class Eyelet extends GridThing {
    constructor(tx, ty, props = {}) { super('eyelet', tx, ty, Object.assign({ weight: WEIGHT.fixed, fixed: true, marked: false }, props)); this.eyelet = true; }
    sprite() { return spr(this.wall ? 'eyelet_wall' : 'eyelet'); }
}
SPAWN.eyelet = (x, y, p) => new Eyelet(x, y, p);

/* ---------- the Hookline ---------- */
TOOLS.hook = {
    h: null,
    use(p) {
        if (this.h || p.state !== 'normal') return;
        this.h = { p, d: p.dir, x: p.x, y: p.y - 6, dist: 0, state: 'out', area: p.area, t: 0 };
        Sfx.play('hook');
    },
    busy(p) { return !!this.h || p.state === 'reel'; },
    update(area) {
        const h = this.h; if (!h) return;
        if (h.area !== area) { this.h = null; return; }
        const p = h.p;
        h.t++;
        if (h.state === 'out') {
            const sp = 5;
            for (let s = 0; s < sp; s++) {
                h.x += DX[h.d]; h.y += DY[h.d]; h.dist++;
                const tx = tileOf(h.x), ty = tileOf(h.y + 6);
                if (this.check(h, area, tx, ty)) return;
                if (h.dist >= 7 * T + 4) { h.state = 'back'; Sfx.play('hookhit'); return; }
            }
        } else if (h.state === 'back') {
            const dx = p.x - h.x, dy = (p.y - 6) - h.y, d = Math.hypot(dx, dy);
            if (d < 7) { this.h = null; if (h.item) h.item.collect(p); return; }
            h.x += dx / d * 6; h.y += dy / d * 6;
            if (h.item) { h.item.x = h.x - 8; h.item.y = h.y - 4; }
        } else if (h.state === 'pull') {
            /* the caught thing comes to Wren a tile at a time */
            const o = h.obj;
            if (o.removed || o.carried) { o.hookPulled = false; this.h = null; return; }
            if (!o.mv) {
                const nx = o.tx - DX[h.d], ny = o.ty - DY[h.d];
                if (!area.freeForThing(nx, ny, o) || h.steps-- <= 0) { o.hookPulled = false; this.h = null; Sfx.play('land'); o.landed(); return; }
                o.hookPulled = true;
                o.startMove(nx, ny, 5);
                if (o.ret) Return.disturb(o);
            }
            h.x = o.px + 8; h.y = o.py + 4;
        }
    },
    /* what the hook's tip has reached */
    check(h, area, tx, ty) {
        const p = h.p;
        if (!area.inside(tx, ty)) { h.state = 'back'; return true; }
        const o = area.at(tx, ty);
        if (o && o !== p.carry && !(tx === p.tx && ty === p.ty)) {
            /* a sleeper won't come; a chest is no post to swing on */
            if (Return.asleep(o)) { h.state = 'back'; Sfx.play('hookhit'); Fx.text(o.tx * T + 8, o.ty * T - 4, 'z', '#d8c8f8'); return true; }
            if (o.eyelet || o.fixed || o.weight >= WEIGHT.heavy) {
                if (o.eyelet || o.hookable !== false) return this.latch(h, area, tx, ty, o.eyelet ? 'eyelet' : 'thing');
                h.state = 'back'; Sfx.play('hookhit'); return true;
            }
            if (o.ret || o.liftable || o.weight <= WEIGHT.medium) {
                h.state = 'pull'; h.obj = o; h.steps = 8; Sfx.play('hookhit'); Stats.count('hook:pull');
                return true;
            }
        }
        /* a shut gate (or anything standing in the way that isn't on the grid) stops the hook */
        for (const b of area.blockers) if (b.blocks(tx, ty, h)) { if (b.hooked) b.hooked(h); h.state = 'back'; Sfx.play('hookhit'); return true; }
        /* an empty mark: where something belongs but isn't */
        for (const e of area.ents) if (e.ret && e.ret.state !== 'home' && e.ret.mx === tx && e.ret.my === ty && !(e.tx === tx && e.ty === ty)) return this.latch(h, area, tx, ty, 'mark');
        for (const e of area.ents) {
            if (e.kind === 'pickup' && Math.abs(e.x + 8 - h.x) < 9 && Math.abs(e.y + 8 - h.y - 6) < 10) { h.item = e; area.remove(e); h.state = 'back'; Sfx.play('hookhit'); return true; }
            if (e.hurtBox) { const b = e.hurtBox(); if (b && h.x > b.x0 && h.x < b.x1 && h.y + 6 > b.y0 && h.y < b.y1) { if (e.hooked) e.hooked(h); else { e.stun = 60; e.flash = 10; Sfx.play('hookhit'); } h.state = 'back'; return true; } }
        }
        const k = area.kind(tx, ty);
        if (k.solid && !k.low) { h.state = 'back'; Sfx.play('hookhit'); Fx.dust(h.x, h.y + 4); return true; }
        return false;
    },
    /* caught: reel Wren over to it */
    latch(h, area, tx, ty, what) {
        const p = h.p;
        Sfx.play('hookhit'); Stats.count('hook:latch');
        /* land on the mark itself, or the tile in front of a post */
        const lx = what === 'mark' ? tx : tx - DX[h.d], ly = what === 'mark' ? ty : ty - DY[h.d];
        h.state = 'reel';
        p.state = 'reel';
        p.reel = { fx: p.x, fy: p.y, tx: lx * T + 8, ty: ly * T + 10, t: 0, h };
        const d = Math.hypot(p.reel.tx - p.x, p.reel.ty - p.y);
        p.reel.dur = Math.max(6, Math.round(d / 4.5));
        h.x = tx * T + 8; h.y = ty * T + 2;
        return true;
    },
    draw(cx, cy) {
        const h = this.h; if (!h) return;
        const p = h.p;
        const sx = p.x - cx, sy = p.y - cy - 6;
        Gfx.line(sx, sy + 1, h.x - cx, h.y - cy + 1, 'rgba(20,10,20,0.4)');
        Gfx.line(sx, sy, h.x - cx, h.y - cy, '#d8c08a');
        Gfx.img(spr('hooktip_' + DIR_NAME[h.d === LEFT ? RIGHT : h.d]), h.x - cx - 4, h.y - cy - 4, h.d === LEFT);
    },
};
/* Wren reeling in along the line (pits and water don't matter: Wren's in the air) */
Player.prototype.updateReel = function () {
    const r = this.reel; r.t++;
    const k = Math.min(1, r.t / r.dur);
    this.x = lerp(r.fx, r.tx, k); this.y = lerp(r.fy, r.ty, k);
    this.traceStep();
    if (k >= 1) {
        this.state = 'normal'; this.reel = null; TOOLS.hook.h = null;
        Sfx.play('land'); Fx.dust(this.x, this.y);
        this.afterMove();
    }
};

function initKilnKit() {
    defSym('seal', ['.kkkkkkk', 'kooooooo', 'koOooooo', 'kooOoOoo', 'kooooooo', 'koOooOoo', 'kooooooo', 'kOoooOoo',
        'kooOoooo', 'kooooooo', 'koOooOoo', 'kooooooo', 'kOOOOOOO', 'kOOOOOOO', 'kOOOOOOO', '.kkkkkkk'],
        { o: '#c4623a', O: '#93432c' }, { O: 'O' });
    defSprite('eyelet', ['......kkkk......', '.....kyyyyk.....', '....kyk..kyk....', '....kyk..kyk....', '.....kyyyyk.....', '......kbbk......', '......kbbk......', '......kbbk......',
        '......kbbk......', '......kbbk......', '......kbbk......', '.....kbbbbk.....', '....kbbbbbbk....', '....kBBBBBBk....', '.....kkkkkk.....', '................'],
        { y: '#e2b45a', b: '#9a6438', B: '#6b4128' });
    defSprite('eyelet_wall', ['................', '................', '................', '......kkkk......', '.....kyyyyk.....', '....kyk..kyk....', '....kyk..kyk....', '.....kyyyyk.....',
        '......kyyk......', '.....kxxxxk.....', '.....kxxxxk.....', '......kkkk......', '................', '................', '................', '................'],
        { y: '#e2b45a', x: '#7a6a5a' });
    defSprite('hooktip_right', ['.kkkk...', 'kwwwwk..', '.kk.kwk.', '....kwk.', '.kk.kwk.', 'kwwwwk..', '.kkkk...', '........'], { w: '#dfe6ef' });
    defSprite('hooktip_down', ['.k...k..', 'kwk.kwk.', 'kwk.kwk.', 'kwk.kwk.', '.kwwwk..', '..kkk...', '........', '........'], { w: '#dfe6ef' });
    defSprite('hooktip_up', ['..kkk...', '.kwwwk..', 'kwk.kwk.', 'kwk.kwk.', 'kwk.kwk.', '.k...k..', '........', '........'], { w: '#dfe6ef' });
    SFX.charm = (o, t) => { Audio.tone(o, t, 1046, 0.5, 'triangle', 0.14, { r: 0.4 }); Audio.tone(o, t, 1568, 0.3, 'sine', 0.05, { r: 0.25 }); };
}
CONTENT_INIT.push(initKilnKit);
