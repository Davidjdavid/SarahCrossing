/* Townsfolk: drawn from a few bodies (child, adult, elder) with hair, clothes and extras, so a whole town
   can look different from one another. Each stands on a mark, like everything else: push one for a moment
   and they shuffle off their spot, then shuffle back (S01). */

/* body bases. Codes: k outline, s/S skin, e eye, c cheek, h/H hair, t/T top, p/P bottom, b boots,
   a/A apron or accent */
const BODY = {
    child: {
        h: 16,
        down: WREN_DOWN.map(r => r.replace(/r/g, 'a').replace(/R/g, 'A')),
        right: WREN_RIGHT.map(r => r.replace(/r/g, 'a').replace(/R/g, 'A')),
        up: WREN_UP.map(r => r.replace(/r/g, 'a').replace(/R/g, 'A')),
    },
    adult: {
        h: 20,
        down: [
            '.....kkkkkk.....', '....khhhhhhk....', '...khhhhhhhhk...', '...khhhhhhhhk...', '...khhhhhhhHk...',
            '...khshhhhsHk...', '...kssessesSk...', '...ksssssssSk...', '....ksssssSk....', '.....kSssSk.....',
            '....ktttttttk...', '...ktttaattTTk..', '..kstttaatttTsk.', '..kstttaatttTsk.', '...kTttaattTTk..',
            '....kpppppPk....', '....kpPk.kPPk...', '....kpPk.kPPk...', '....kbbk.kbbk...', '.....kk...kk....'],
        right: [
            '.....kkkkkk.....', '....khhhhhhk....', '...khhhhhhhhk...', '...khhhhhhhhk...', '...kHhhhhhhhk...',
            '...kHhhhhhssk...', '...kHhhhhssek...', '...kHhhhssssk...', '....kHhSsssk....', '.....kSssk......',
            '.....kttttak....', '....kTttttak....', '....kTtttsak....', '....kTtttsak....', '....kTTttaak....',
            '.....kppppk.....', '.....kpkPPk.....', '.....kpkPPk.....', '.....kbkbbk.....', '......kkkk......'],
        up: [
            '.....kkkkkk.....', '....khhhhhhk....', '...khhhhhhhhk...', '...khhhhhhhhk...', '...khhhhhhhHk...',
            '...khhhhhhhHk...', '...kHhhhhhhHk...', '...kHHhhhhHHk...', '....kHHHHHHk....', '.....kSSSSk.....',
            '....ktttttttk...', '...ktttttttTTk..', '..ksttttttttTsk.', '..ksttttttttTsk.', '...kTttttttTTk..',
            '....kpppppPk....', '....kpPk.kPPk...', '....kpPk.kPPk...', '....kbbk.kbbk...', '.....kk...kk....'],
    },
};
BODY.elder = {
    h: 19,
    down: BODY.adult.down.slice(0, 9).concat(BODY.adult.down.slice(10)),
    right: BODY.adult.right.slice(0, 9).concat(BODY.adult.right.slice(10)).map((r, i) => i < 9 ? '.' + r.slice(0, 15) : r),
    up: BODY.adult.up.slice(0, 9).concat(BODY.adult.up.slice(10)),
};

/* hair styles: overrides on the head rows, by direction */
const HAIR = {
    short: null,
    bald: { down: { 1: '....kssssssk....', 2: '...ksssssssSk...', 3: '...khsssssSHk...', 4: '...khsssssshk...', 5: '...khsssssshk...' }, up: { 1: '....kssssssk....', 2: '...ksssssssSk...', 3: '...ksssssssSk...', 4: '...khssssssHk...', 5: '...khhssssHHk...' }, right: { 1: '....kssssssk....', 2: '...ksssssssSk...', 3: '...khssssssSk...', 4: '...kHhsssssSk...' } },
    long: { down: { 8: '...khsssssShk...', 9: '...khkSssSkhk...', 10: '...kh.......hk..' }, up: { 8: '...kHHHHHHHHk...', 9: '...kHHHHHHHHk...', 10: '...kHHHHHHHHk...', 11: '....kHHHHHHk....' }, right: { 8: '...kHhhSsssk....', 9: '...kHhhkSssk....', 10: '...kHhk.........' } },
    bun: { down: { 0: '......kkkk......', 1: '.....khhhhk.....' }, up: { 0: '......kkkk......', 1: '.....khHHhk.....' }, right: { 0: '...kkk..........', 1: '..khhhkkkkk.....' } },
    tuft: { down: { 0: '.......kk.......', 1: '....khhhhhhk....' }, up: { 0: '.......kk.......' }, right: { 0: '......kk........' } },
    cap: { down: { 0: '.....kkkkkk.....', 1: '....kaaaaaak....', 2: '...kaaaaaaaak...', 3: '...kAAAAAAAAk...', 4: '..kkkkkkkkkkkk..' }, up: { 0: '.....kkkkkk.....', 1: '....kaaaaaak....', 2: '...kaaaaaaaak...', 3: '...kaaaaaaaak...', 4: '...kAAAAAAAAk...' }, right: { 0: '.....kkkkkk.....', 1: '....kaaaaaak....', 2: '...kaaaaaaaak...', 3: '...kAAAAAAAAkk..', 4: '...kkkkkkkkkkk..' } },
};
/* extras drawn after: beards, glasses, aprons */
const EXTRA = {
    beard: { down: { 7: '...khhssssshk...', 8: '....khhhhhhk....', 9: '.....khhhhk.....' }, right: { 7: '...kHhhhhhhhk...', 8: '....kHhhhhhk....', 9: '.....khhhk......' } },
    glasses: { down: { 6: '...kskkskkssk...' }, right: { 6: '...kHhhhhskkk...' } },
    mustache: { down: { 8: '....kshhhhSk....' } },
};

function overrideRows(rows, ov) {
    if (!ov) return rows;
    return rows.map((r, i) => {
        const o = ov[i]; if (!o) return r;
        /* '.' in an override keeps what's underneath only where the override is clear */
        let s = '';
        for (let j = 0; j < 16; j++) s += (o[j] && o[j] !== '.') ? o[j] : (r[j] || '.');
        return s;
    });
}

/* make a person's sprites: look = { body, hair, extra:[], skin, hairC, top, bottom, accent, boots } */
function makePerson(id, look) {
    const B = BODY[look.body || 'adult'];
    const skinSet = { light: ['#f2c49b', '#d8956b'], tan: ['#d9a070', '#b0744a'], brown: ['#a8684a', '#7e4a32'], dark: ['#7a4a32', '#5a3220'], pale: ['#f6d8bc', '#dcae8c'] };
    const [s1, s2] = skinSet[look.skin || 'light'];
    const legend = {
        s: s1, S: s2, h: look.hairC || '#6b4128', H: shade(look.hairC || '#6b4128', -0.3),
        t: look.top || '#5a8ad0', T: shade(look.top || '#5a8ad0', -0.28), p: look.bottom || '#6b4128', P: shade(look.bottom || '#6b4128', -0.3),
        a: look.accent || look.top || '#f0d080', A: shade(look.accent || look.top || '#f0d080', -0.28), b: look.boots || '#5a3a26', l: shade(look.hairC || '#6b4128', 0.25),
        c: look.cheek || '#f0a0a0', e: '#2a1f2d',
    };
    for (const dir of ['down', 'right', 'up']) {
        let rows = B[dir];
        if (look.hair && HAIR[look.hair]) rows = overrideRows(rows, HAIR[look.hair][dir]);
        for (const x of look.extra || []) if (EXTRA[x] && EXTRA[x][dir]) rows = overrideRows(rows, EXTRA[x][dir]);
        const n = rows.length;
        const legs = dir === 'right' ? [[5, 6], [8, 9]] : [[5, 6], [9, 10]];
        defSprite(`${id}_${dir}_0`, rows, legend);
        defSprite(`${id}_${dir}_1`, liftLeg(rows, legs[0], n - 3), legend);
        defSprite(`${id}_${dir}_2`, liftLeg(rows, legs[1], n - 3), legend);
    }
}

/* a townsperson on the grid */
class NPC extends GridThing {
    constructor(tx, ty, props = {}) {
        super('npc', tx, ty, Object.assign({ weight: WEIGHT.medium }, props));
        this.dir = props.face !== undefined ? dirByName(props.face) : DOWN;
        this.sprId = props.sprite || props.who;
        this.walking = false; this.anim = 0;
        this.pushedT = 0;
        this.noPush = true;           /* pushing works differently: they budge */
        this.idle = props.idle || null;
        this.path = null;
        this.patience = props.patience || 100;
    }
    onAdd(area) {
        super.onAdd(area);
        if (this.ret) { this.ret.color = THREAD.town; this.ret.patience = this.patience; }
        this.quietHome = true;
    }
    get sortY() { return this.py + 15; }
    onPushed(p, d) {
        /* townsfolk budge when you lean on them */
        this.pushedT++;
        if (this.mv || this.walking) return false;
        if (this.area.freeForThing(this.tx + DX[d], this.ty + DY[d], this)) {
            this.startMove(this.tx + DX[d], this.ty + DY[d], 20);
            this.dir = OPP[d];
            Story.budged(this);
            Stats.count('budge:' + this.who);
        }
        return false;
    }
    interact(p) {
        if (this.mv) return false;
        this.dir = OPP[p.dir];
        const t = Story.talk(this);
        if (t) Script.run(t, { name: 'talk' });
        return true;
    }
    walkTo(tx, ty, speed = 1) {
        const path = findPath(this.area, this.tx, this.ty, tx, ty, this);
        this.path = path; this.walking = !!(path && path.length); this.walkSpeed = speed;
    }
    tick() {
        if (this.path && !this.mv) {
            if (!this.path.length) { this.path = null; this.walking = false; if (this.ret && !this.free) { /* stays a stranger to its spot */ } return; }
            const [nx, ny] = this.path[0];
            if (this.area.freeForThing(nx, ny, this)) {
                this.path.shift();
                this.dir = dirOf(nx - this.tx, ny - this.ty);
                this.startMove(nx, ny, Math.round(16 / (this.walkSpeed || 1)), this.free ? false : false);
                if (this.free && this.ret) { this.ret.mx = nx; this.ret.my = ny; this.ret.trace = [[nx, ny]]; this.ret.state = 'home'; }
            }
        }
        if (this.mv) this.anim++; else if (!this.walking) this.anim = 0;
        if (this.idleTick) this.idleTick();
        if (this.ret && this.ret.state === 'returning' && this.mv) this.anim++;
    }
    sprite() {
        const moving = !!this.mv;
        const fr = moving ? [1, 0, 2, 0][Math.floor(this.anim / 6) % 4] : 0;
        return personFrame(this.sprId, this.dir, fr);
    }
    draw(cx, cy) {
        const im = this.sprite(); if (!im) return;
        const sx = this.px - cx, sy = this.py - cy - (im.height - T) - 2;
        Gfx.alpha(0.22); Gfx.rect(sx + 3, this.py - cy + 13, 10, 2, PAL.ink); Gfx.alpha(1);
        Gfx.img(im, sx, sy, this.dir === LEFT);
        if (this.bubble) { Gfx.img(spr('bubble_' + this.bubble), sx + 8, sy - 10); }
    }
}

/* shortest path on the grid for walkers (4 ways) */
function findPath(area, sx, sy, gx, gy, who, max = 4000) {
    if (sx === gx && sy === gy) return [];
    const q = [[sx, sy]], prev = new Map([[key2(sx, sy), null]]);
    let n = 0;
    while (q.length && n++ < max) {
        const [x, y] = q.shift();
        for (let d = 0; d < 4; d++) {
            const nx = x + DX[d], ny = y + DY[d], k = key2(nx, ny);
            if (prev.has(k)) continue;
            const goal = nx === gx && ny === gy;
            const kk = area.kind(nx, ny);
            if (kk.solid || kk.pit || kk.deep || kk.ledge || kk.fog) continue;
            const o = area.at(nx, ny);
            if (o && o !== who && !goal) continue;
            if (area.blockers.some(b => b.blocks(nx, ny, who))) continue;
            prev.set(k, [x, y]);
            if (goal) {
                const path = []; let c = [nx, ny];
                while (c && !(c[0] === sx && c[1] === sy)) { path.unshift(c); c = prev.get(key2(c[0], c[1])); }
                return path;
            }
            q.push([nx, ny]);
        }
    }
    return null;
}
