/* The things of the world: blocks, crates, pots, statues, plates, crystals, doors, chests, keys, signs,
   pickups. Each draws itself from its sprite and keeps to the Return's rules. */

/* symmetric sprites: write the left half, the right is mirrored (rightMap changes characters on the right) */
function symRows(half, rightMap = {}) {
    return half.map(h => {
        const r = h.split('').reverse().map(ch => rightMap[ch] !== undefined ? rightMap[ch] : ch).join('');
        return h + r;
    });
}
function defSym(name, half, legend = {}, rightMap = {}) { return defSprite(name, symRows(half, rightMap), legend); }

function initThingSprites() {
    /* heavy stone block (legend recoloured per House) */
    const stone = [
        '.kkkkkkkkkkkkkk.', 'kggggggggggggggk', 'kgwwgggggggggggk', 'kgggggggggggwggk', 'kggggggggggggggk',
        'kGGGGGGGGGGGGGGk', 'kxxxxxxxxxxxxxxk', 'kxGxxxxxxxxxxxxk', 'kxxxxxxXxxxxxxxk', 'kxxxxxxXXxxxxxxk',
        'kxxxxxxxxxxxxGxk', 'kxxxxxxxxxxxxxxk', 'kxxxGxxxxxxxxxxk', 'kxxxxxxxxxxxxxxk', 'kXXXXXXXXXXXXXXk', '.kkkkkkkkkkkkkk.'];
    defSprite('block_stone', stone, { g: '#d4ccc0', G: '#a89e92', x: '#988e84', X: '#6e665e', w: '#f0ebe4' });
    defSprite('block_marble', stone, { g: '#f4f0ea', G: '#cfc6bc', x: '#dcd4ca', X: '#a69c92', w: '#ffffff' });
    defSprite('block_clay', stone, { g: '#e8946a', G: '#b8603e', x: '#c4623a', X: '#8a3c26', w: '#f8c09a' });
    defSprite('block_stray', stone, { g: '#d8e8b8', G: '#a8c088', x: '#b8cc94', X: '#7a9460', w: '#f0f8e0' });
    /* wooden block (medium) */
    defSprite('block_wood', [
        '.kkkkkkkkkkkkkk.', 'kuuuuuuuuuuuuuuk', 'kuUUUUUUUUUUUUuk', 'kuuuuuuuuuuuuuuk', 'kBBBBBBBBBBBBBBk',
        'kbbbbbbbbbbbbbbk', 'kbBbbbbbbbbbbBbk', 'kbbBbbbbbbbbBbbk', 'kbbbBBbbbbBBbbbk', 'kbbbbbBBBBbbbbbk',
        'kbbbbbBBBBbbbbbk', 'kbbbBBbbbbBBbbbk', 'kbbBbbbbbbbbBbbk', 'kbBbbbbbbbbbbBbk', 'kBBBBBBBBBBBBBBk', '.kkkkkkkkkkkkkk.'],
        { u: '#e6b47a', U: '#c48a52', b: '#b47a44', B: '#7e4e2a' });
    /* small crate (light, can be lifted) */
    defSprite('crate', [
        '................', '................', '................', '..kkkkkkkkkkkk..', '..kuuuuuuuuuuk..',
        '..kUUUUUUUUUUk..', '..kbbbbbbbbbbk..', '..kbBbbbbbbBbk..', '..kbbBbbbbBbbk..', '..kbbbBBBBbbbk..',
        '..kbbbBBBBbbbk..', '..kbbBbbbbBbbk..', '..kbBbbbbbbBbk..', '..kBBBBBBBBBBk..', '..kkkkkkkkkkkk..', '................'],
        { u: '#e6b47a', U: '#c48a52', b: '#b47a44', B: '#7e4e2a' });
    /* a stray crate: pale, belongs nowhere */
    defSprite('crate_stray', SPR_SRC.crate.rows, { u: '#f0f8e0', U: '#d8e8b8', b: '#c8dca8', B: '#98b07a' });
    /* pot */
    const potHalf = ['........', '........', '.....kkk', '....kyoo', '....kOOO', '.....koo', '....kyoo', '...kyooo',
        '..kyoooo', '..kooooo', '..kooooo', '..kOoooo', '...kOOoo', '....kOOO', '.....kkk', '........'];
    defSym('pot', potHalf, { o: '#d98f3a', O: '#a8602a', y: '#f2bc78' }, { y: 'o' });
    defSym('pot_teal', potHalf, { o: '#4fb8b0', O: '#2e7e78', y: '#9ae0d8' }, { y: 'o' });
    /* marble bust on a plinth (heavy) */
    defSym('bust', ['......kk', '.....kgg', '....kggg', '....kwgg', '....kggg', '....kGgg', '.....kGg', '....kggg',
        '...kgggg', '..kGGGGG', '..kkkkkk', '..kwwwww', '..kggggg', '..kGgggg', '..kGGGGG', '..kkkkkk'],
        { g: '#efe8de', G: '#c8bcae', w: '#ffffff' }, { w: 'g' });
    /* chest */
    defSym('chest', ['........', '........', '..kkkkkk', '.kuuuuuu', '.kuUUUUU', '.kuuuuuu', '.kkkkkkk', '.kbbbbyy',
        '.kbbbbyk', '.kbbbbbb', '.kbBBBBB', '.kbbbbbb', '.kBBBBBB', '.kkkkkkk', '........', '........'],
        { u: '#e0a060', U: '#b8743c', b: '#a8642e', B: '#7a4420', y: '#f7d64a' });
    defSym('chest_open', ['........', '..kkkkkk', '.kuuuuuu', '.kUUUUUU', '.kKKKKKK', '.kKKKKKK', '.kkkkkkk', '.kbbbbyy',
        '.kbbbbyk', '.kbbbbbb', '.kbBBBBB', '.kbbbbbb', '.kBBBBBB', '.kkkkkkk', '........', '........'],
        { u: '#e0a060', U: '#b8743c', b: '#a8642e', B: '#7a4420', y: '#f7d64a', K: '#3a2418' });
    defSym('chest_big', ['........', '..kkkkkk', '.kyyyyyy', '.kuuuuuu', '.kuUUUUU', '.kuuuuuu', '.kkkkkkk', '.kbbbyyy',
        '.kbbbykk', '.kbbbbyy', '.kbBBBBB', '.kybbbbb', '.kBBBBBB', '.kkkkkkk', '........', '........'],
        { u: '#6ab0e0', U: '#3a7ab8', b: '#2e5a98', B: '#1e3a6a', y: '#f7d64a' });
    /* pressure plate: a raised stone pad in a brass frame; pressed, it sinks flush */
    defSprite('plate', ['................', '................', '..kkkkkkkkkkkk..', '.kbbbbbbbbbbbbk.', '.kbwwwwwwwwwwBk.', '.kbwppppppppPBk.', '.kbwppppppppPBk.',
        '.kbwppppppppPBk.', '.kbwppppppppPBk.', '.kbwppppppppPBk.', '.kbwPPPPPPPPPBk.', '.kbBBBBBBBBBBBk.', '.kxxxxxxxxxxxxk.', '..kkkkkkkkkkkk..', '................', '................'],
        { b: '#c99a5a', B: '#8a5a2e', w: '#f0e4c8', p: '#d8c8a4', P: '#b4a27e', x: '#6e5e42' });
    defSprite('plate_down', ['................', '................', '................', '..kkkkkkkkkkkk..', '.kbbbbbbbbbbbbk.', '.kbBBBBBBBBBBbk.', '.kbBppppppppbbk.',
        '.kbBppppppppbbk.', '.kbBppppppppbbk.', '.kbBppppppppbbk.', '.kbBppppppppbbk.', '.kbbbbbbbbbbbbk.', '.kxxxxxxxxxxxxk.', '..kkkkkkkkkkkk..', '................', '................'],
        { b: '#b8884a', B: '#7a4a22', p: '#a8966e', x: '#5e4e34' });
    /* crystal switch */
    const crys = ['........', '......kk', '.....kww', '....kwaa', '....kaaa', '....kaaa', '.....kaa', '......kk',
        '.....kgg', '....kggg', '...kGGGG', '...kgggg', '...kGGGG', '...kkkkk', '........', '........'];
    defSym('crystal_a', crys, { w: '#e4f6ff', a: '#5ab0f0', g: '#9a9188', G: '#6a635e' }, { w: 'a' });
    defSym('crystal_b', crys, { w: '#ffe8f0', a: '#f0608e', g: '#9a9188', G: '#6a635e' }, { w: 'a' });
    /* key */
    defSprite('key', ['................', '................', '................', '.....kkk........', '....kyyyk.......', '....kyKyk.......',
        '....kyyyk.......', '.....kyk........', '.....kyk........', '.....kykk.......', '.....kyyk.......', '.....kykk.......',
        '.....kyyk.......', '......kk........', '................', '................'], { y: '#f7d64a', K: '#a6772a' });
    /* heart pickup */
    defSym('heart', ['........', '........', '........', '........', '..kkk.kk', '.krrrkrr', '.krwrrrr', '.krrrrrr',
        '.kRrrrrr', '..kRrrrr', '...kRrrr', '....kRrr', '.....kRR', '......kk', '........', '........'], {}, { w: 'r' });
    /* buttons (money): 1, 5, 20 */
    const btn = ['................', '................', '................', '................', '................', '.....kkkkk......',
        '....kwyyyyk.....', '...kyykykyyk....', '...kyyyyyyyk....', '...kyykykyyk....', '...kYyyyyyYk....', '....kYYYYYk.....',
        '.....kkkkk......', '................', '................', '................'];
    defSprite('button1', btn, { y: '#e8b04a', Y: '#a8742a', w: '#fbe8b0' });
    defSprite('button5', btn, { y: '#6ec0ee', Y: '#3a7ab8', w: '#d8f0ff' });
    defSprite('button20', btn, { y: '#e86a8e', Y: '#a83a5a', w: '#ffd0e0' });
    /* sign */
    defSym('sign', ['........', '........', '..kkkkkk', '.kuuuuuu', '.kuUuUuU', '.kuuuuuu', '.kuUUuUU', '.kuuuuuu',
        '.kBBBBBB', '..kkkkkk', '......kb', '......kb', '......kb', '......kB', '.....kkk', '........'],
        { u: '#e6c08a', U: '#9a6438', b: '#9a6438', B: '#6b4128' }, { b: 'k', B: 'k' });
    /* heart patch (a quarter of a heart) */
    defSym('heartpatch', ['........', '........', '........', '..kkk.kk', '.kpppkpp', '.kpwpppp', '.kpkpkpk', '.kpppppp',
        '..kpkpkp', '...kpppp', '....kppp', '.....kpp', '......kk', '........', '........', '........'],
        { p: '#f07a9a', w: '#ffd8e4' }, { w: 'p' });
    /* the Knot (a House's prize): a big golden knot */
    defSym('knot', ['........', '....kkkk', '...kyyyy', '..kyYkky', '..kyk..k', '..kyYkky', '...kyyyy', '..kkyyyy',
        '.kyyykky', '.kyYk..k', '.kyyk...', '..kyyk..', '...kyyk.', '....kyyk', '.....kkk', '........'],
        { y: '#f7d64a', Y: '#d9a33a' });
}

/* ---------- blocks ---------- */
class Block extends GridThing {
    constructor(tx, ty, props = {}) {
        super('block', tx, ty, props);
        this.style = props.style || 'stone';
        this.weight = props.weight || (this.style === 'wood' ? WEIGHT.medium : WEIGHT.heavy);
        if (props.stray) this.marked = false;
        this.floats = this.style === 'wood';
    }
    sprite() { return spr(this.look || (this.marked === false ? 'block_stray' : 'block_' + this.style)); }
}

/* liftable things: pots and crates */
class Liftable extends GridThing {
    constructor(kind, tx, ty, props = {}) {
        super(kind, tx, ty, Object.assign({ weight: WEIGHT.light }, props));
        this.liftable = true;
    }
}
class Pot extends Liftable {
    constructor(tx, ty, props = {}) { super('pot', tx, ty, props); this.breaks = true; this.style = props.style || 'pot'; }
    sprite() { return this.shattered ? null : spr(this.style); }
}
class Crate extends Liftable {
    constructor(tx, ty, props = {}) { super('crate', tx, ty, props); this.floats = true; }
    sprite() { return spr(this.marked === false ? 'crate_stray' : 'crate'); }
}
class Bust extends GridThing {
    constructor(tx, ty, props = {}) { super('bust', tx, ty, Object.assign({ weight: WEIGHT.heavy }, props)); }
    sprite() { return spr('bust'); }
}

/* ---------- floor things (not on the grid: things stand on them) ---------- */
class FloorThing extends Ent {
    constructor(kind, tx, ty, props = {}) { super(kind, props); this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T; this.floor = true; }
    get sortY() { return -1000 + this.y; }
    /* is anything weighing on this tile? */
    weighed() {
        const a = this.area, o = a.at(this.tx, this.ty);
        if (o && !o.carried && !o.flying && o.weight >= (this.minWeight || 1)) return true;
        const p = G.player;
        if (p && p.area === a && !p.flying && !p.dead && p.feetOn(this.tx, this.ty) && (this.minWeight || 1) <= WEIGHT.medium) return true;
        for (const m of a.walkers) if (m.alive !== false && m.feetOn && m.feetOn(this.tx, this.ty) && (m.weightN || 2) >= (this.minWeight || 1)) return true;
        return false;
    }
}
class Plate extends FloorThing {
    constructor(tx, ty, props = {}) {
        super('plate', tx, ty, props);
        this.sig = props.sig || 'plate';
        this.mode = props.mode || 'hold';     /* hold | toggle | timed */
        this.on = false; this.down = false; this.timer = 0;
    }
    update() {
        const w = this.weighed();
        if (w && !this.down) { Sfx.play('click'); if (this.mode === 'toggle') this.on = !this.on; if (this.mode === 'timed' || this.mode === 'pulse') this.timer = this.time || 300; }
        if (!w && this.down) Sfx.play('unclick');
        this.down = w;
        if (this.mode === 'hold') this.on = w;
        if (this.mode === 'timed') { if (this.timer > 0) this.timer--; this.on = w || this.timer > 0; }
        if (this.mode === 'pulse') { if (this.timer > 0) this.timer--; this.on = this.timer > 0; }
        if (this.on) Signals.set(this.area, this.sig);
    }
    draw(cx, cy) {
        Gfx.img(spr(this.down ? 'plate_down' : 'plate'), this.x - cx, this.y - cy);
        if (this.mode === 'toggle') {
            /* a lamp set in the pad: lit while the plate is on, dark while off */
            const lx = this.x - cx + 6, ly = this.y - cy + (this.down ? 7 : 6);
            Gfx.rect(lx, ly, 4, 4, PAL.ink);
            Gfx.rect(lx + 1, ly + 1, 2, 2, this.on ? '#5ad1c5' : '#4a3e2c');
            if (this.on) { Gfx.rect(lx + 1, ly + 1, 1, 1, '#d8fff8'); Gfx.alpha(0.35 + 0.15 * Math.sin(G.t / 8)); Gfx.rect(lx - 1, ly - 1, 6, 6, '#5ad1c5'); Gfx.alpha(1); }
        }
        if ((this.mode === 'timed' || this.mode === 'pulse') && this.timer > 0 && (!this.down || this.mode === 'pulse')) {
            const n = Math.ceil(this.timer / 60);
            for (let i = 0; i < n && i < 8; i++) Gfx.rect(this.x - cx + 3 + i * 2, this.y - cy + 2, 1, 2, PAL.yellow);
        }
    }
}

/* crystal switches flip when struck (the stick, a throw, flying shards) */
class Crystal extends GridThing {
    constructor(tx, ty, props = {}) {
        super('crystal', tx, ty, Object.assign({ weight: WEIGHT.fixed, fixed: true, marked: false }, props));
        this.sig = props.sig || 'crystal';
        this.on = !!props.on;
        this.cool = 0;
    }
    hit() {
        if (this.cool > 0) return;
        this.on = !this.on; this.cool = 20;
        Sfx.play('crystal'); Fx.ring(this.tx * T + 8, this.ty * T + 6, this.on ? '#f0608e' : '#5ab0f0');
    }
    tick() { if (this.cool > 0) this.cool--; if (this.on) Signals.set(this.area, this.sig); }
    sprite() { return spr(this.on ? 'crystal_b' : 'crystal_a'); }
}

/* ---------- signals: plates and crystals set names, doors read expressions ---------- */
const Signals = {
    begin(area) { area.sigPrev = area.sig || {}; area.sig = {}; },
    set(area, name) { area.sig[name] = true; },
    get(area, name) { return !!(area.sigPrev && area.sigPrev[name]); },
    /* "a&b", "a|b", "!a", "a&!b|c" */
    eval(area, expr) {
        if (!expr) return false;
        return expr.split('|').some(term => term.split('&').every(t => {
            t = t.trim(); const neg = t[0] === '!'; const n = neg ? t.slice(1) : t;
            const v = n.startsWith('flag:') ? Progress.flag(n.slice(5)) : this.get(area, n);
            return neg ? !v : v;
        }));
    },
};

/* ---------- doors: gates that open on a signal, locked doors, the Pattern door, shutters ---------- */
class Door extends Ent {
    constructor(tx, ty, props = {}) {
        super('door', props);
        this.tx = tx; this.ty = ty; this.x = tx * T; this.y = ty * T;
        this.type = props.type || 'gate';    /* gate (signal) | lock (small key) | big (Pattern) | shutter (room clear) */
        this.open = false; this.anim = 0;
        this.dir = props.dir || 'h';          /* h: in a horizontal wall (you pass up/down), v: in a vertical wall */
    }
    onAdd(area) {
        if (this.id && Progress.areaFlag(area.id, 'door:' + this.id)) { this.open = true; this.anim = 8; this.locked = false; this.openedOnce = true; this.keep = true; }
    }
    blocks(x, y) { return !this.open && x === this.tx && y === this.ty; }
    update() {
        if (this.type === 'gate' || this.type === 'shutter') {
            let want = this.type === 'gate' ? Signals.eval(this.area, this.when) : !this.shut;
            if (this.keep && this.openedOnce) want = true;
            if (this.open && this.passed && !this.openedOnce) {
                const p = G.player, d = dirByName(this.passed);
                if (p && p.area === this.area && (d === UP ? p.ty < this.ty : d === DOWN ? p.ty > this.ty : d === LEFT ? p.tx < this.tx : p.tx > this.tx) && Math.abs((d === UP || d === DOWN ? p.tx - this.tx : p.ty - this.ty)) < 3) {
                    this.openedOnce = true; this.keep = true; if (this.id) Progress.setAreaFlag(this.area.id, 'door:' + this.id);
                }
            }
            if (want && !this.open) {
                /* don't close on someone; open */
                this.open = true; Sfx.play('door');
                if (this.keep) { this.openedOnce = true; if (this.id) Progress.setAreaFlag(this.area.id, 'door:' + this.id); }
            } else if (!want && this.open) {
                const p = G.player;
                const blocked = (p && p.onTile(this.tx, this.ty)) || this.area.at(this.tx, this.ty);
                if (!blocked) { this.open = false; Sfx.play('doorshut'); }
            }
        }
        this.anim = approach(this.anim, this.open ? 8 : 0, 1);
    }
    /* walking into a locked door with a key */
    tryUnlock(p) {
        if (this.open) return false;
        if (this.type === 'lock') {
            if (Inv.keys(this.area.def.house) > 0) {
                Inv.useKey(this.area.def.house);
                this.openDoor(); return true;
            }
            UI.toast('Locked. A small key would fit.'); return false;
        }
        if (this.type === 'big') {
            if (Inv.hasPattern(this.area.def.house)) { this.openDoor(); return true; }
            UI.toast("A big lock, stitched with the House's pattern."); return false;
        }
        return false;
    }
    openDoor() {
        this.open = true; Sfx.play('unlock');
        if (this.id) Progress.setAreaFlag(this.area.id, 'door:' + this.id);
    }
    get sortY() { return this.y + (this.dir === 'h' ? 15 : 15); }
    draw(cx, cy) {
        const sx = this.x - cx, sy = this.y - cy;
        const a = this.anim;
        if (a >= 8) return;
        const th = this.area.theme;
        const bar = this.type === 'lock' ? '#8a5a2a' : this.type === 'big' ? '#2e5a98' : (th.wall ? th.wall[3] : '#5a4a4a');
        const hi = this.type === 'lock' ? '#c89050' : this.type === 'big' ? '#6ab0e0' : (th.wall ? th.wall[2] : '#9a8a8a');
        if (this.dir === 'h') {
            const hgt = 16 - a * 2;
            Gfx.rect(sx, sy, 16, hgt, PAL.ink);
            Gfx.rect(sx + 1, sy + 1, 14, Math.max(0, hgt - 2), bar);
            for (let i = 2; i < 14; i += 4) Gfx.rect(sx + i, sy + 1, 2, Math.max(0, hgt - 2), hi);
        } else {
            const wd = 16 - a * 2;
            Gfx.rect(sx, sy, wd, 16, PAL.ink);
            Gfx.rect(sx + 1, sy + 1, Math.max(0, wd - 2), 14, bar);
            for (let i = 2; i < 14; i += 4) Gfx.rect(sx + 1, sy + i, Math.max(0, wd - 2), 2, hi);
        }
        if ((this.type === 'lock' || this.type === 'big') && a === 0) {
            Gfx.rect(sx + 5, sy + 5, 6, 6, PAL.ink); Gfx.rect(sx + 6, sy + 6, 4, 4, this.type === 'big' ? '#f7d64a' : '#e8b04a');
            Gfx.rect(sx + 7, sy + 7, 2, 3, PAL.ink);
        }
    }
}

/* ---------- chests ---------- */
class Chest extends GridThing {
    constructor(tx, ty, props = {}) {
        super('chest', tx, ty, Object.assign({ weight: WEIGHT.fixed, fixed: true, marked: false }, props));
        this.item = props.item; this.opened = false;
        this.big = !!props.big;
        this.hidden = !!props.hidden;     /* appears on a signal */
    }
    onAdd(area) {
        super.onAdd(area);
        if (Progress.areaFlag(area.id, 'chest:' + this.id)) { this.opened = true; this.hidden = false; }
        if (this.hidden) area.unplace(this, this.tx, this.ty);
    }
    tick() {
        if (this.hidden && this.when && Signals.eval(this.area, this.when)) {
            this.hidden = false; this.area.place(this, this.tx, this.ty);
            Sfx.play('appear'); Fx.poof(this.tx * T + 8, this.ty * T + 8); Fx.sparkle(this.tx * T + 8, this.ty * T + 4, PAL.yellow);
        }
    }
    interact(p) {
        if (this.opened || this.hidden) return false;
        this.opened = true;
        Progress.setAreaFlag(this.area.id, 'chest:' + this.id);
        Sfx.play('chest');
        Script.run(Story.getItem(this.item));
        return true;
    }
    sprite() { return this.hidden ? null : spr(this.opened ? 'chest_open' : this.big ? 'chest_big' : 'chest'); }
}

/* ---------- signs and other things you read ---------- */
class Sign extends GridThing {
    constructor(tx, ty, props = {}) { super('sign', tx, ty, Object.assign({ weight: WEIGHT.fixed, fixed: true, marked: false }, props)); }
    interact() { Script.run(function* () { yield* say(null, this.text); }.bind(this)); return true; }
    sprite() { return this.look === 'none' ? null : spr(this.look || 'sign'); }
}

/* ---------- pickups lying about (hearts, buttons, keys, heart patches) ---------- */
class Pickup extends Ent {
    constructor(x, y, props = {}) {
        super('pickup', props);
        this.x = x; this.y = y; this.t = 0; this.z = props.z || 0; this.vz = props.vz || 0;
        this.what = props.what || 'heart';
        this.life = props.life || 0;   /* 0: stays */
    }
    onAdd(area) { if (this.id && Progress.areaFlag(area.id, 'got:' + this.id)) area.remove(this); }
    update() {
        this.t++;
        if (this.vz || this.z > 0) { this.z += this.vz; this.vz -= 0.25; if (this.z <= 0) { this.z = 0; this.vz = this.vz < -1.5 ? -this.vz * 0.4 : 0; } }
        if (this.life && this.t > this.life) { this.area.remove(this); return; }
        const p = G.player;
        if (p && p.area === this.area && !p.dead && this.t > 10 && dist(p.x, p.y - 4, this.x + 8, this.y + 8) < 11) this.collect(p);
    }
    collect(p) {
        this.area.remove(this);
        if (this.id) Progress.setAreaFlag(this.area.id, 'got:' + this.id);
        Inv.pickup(this.what, this);
    }
    get sortY() { return this.y + 12; }
    draw(cx, cy) {
        if (this.life && this.t > this.life - 60 && (this.t >> 2) % 2) return;
        const im = spr(PICKUP_SPRITE[this.what] || this.what);
        const bob = this.what === 'heartpatch' || this.what === 'key' ? Math.sin(this.t / 12) * 1.5 : 0;
        if (this.z > 0 || bob) Gfx.rect(this.x - cx + 5, this.y - cy + 13, 6, 2, 'rgba(0,0,0,0.25)');
        Gfx.img(im, this.x - cx, this.y - cy - this.z + bob - 2);
    }
}
const PICKUP_SPRITE = { heart: 'heart', b1: 'button1', b5: 'button5', b20: 'button20', key: 'key', heartpatch: 'heartpatch', heartstitch: 'heart' };

/* plain props that just stand there (a decoration with an optional collision box) */
class Prop extends Ent {
    constructor(tx, ty, props = {}) {
        super('prop', props);
        this.tx = tx; this.ty = ty; this.x = tx * T + (props.ox || 0); this.y = ty * T + (props.oy || 0);
        this.solid = props.solid || [];     /* tiles it blocks, relative [dx,dy] */
        this.staticBlock = !props.moves;    /* fixed props block through the area's tile map, not a list */
        this.inert = !props.live;
    }
    blocks(x, y) { return this.solid.some(([dx, dy]) => this.tx + dx === x && this.ty + dy === y); }
    get sortY() { return this.y + (this.baseY !== undefined ? this.baseY : (this.im ? this.im.height : 16)); }
    draw(cx, cy) {
        const im = this.im || spr(this.look);
        if (im) Gfx.img(im, this.x - cx, this.y - cy, this.flip);
    }
}
