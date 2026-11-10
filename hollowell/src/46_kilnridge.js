/* Kilnridge (overworld block 0,2): red clay canyons west of Meadowfold. The Kiln is cut into the big mesa;
   the potters' camp sits in the basin; a switchback climbs the hawk's mesa; crocks wander. The canyon
   road comes in from Meadowfold on the east. */

const KILNRIDGE_ROWS = [
    '%###############################################################',
    '%###############################################################',
    '%###############################################################',
    '%##.fffffff....,,,...................,....,.....,............###',
    '%##......,.#####################################################',
    '%##........##.."........"......##......,.,....#############..###',
    '%##.".,..,,##...........YYY.,..##...,...."....##.........##..###',
    '%##.....,.,#####..."....YYY....##...."..^.....##.........##..###',
    '%##,.".,...###.#........YYY....##...,.........##.........##..###',
    '%######H########...............##..,^.........##......^..##..###',
    '%######H#####................."##.............##.........##..###',
    '%##......."##.............".,..##...,......^..##.........##..###',
    '%##........################H#####.......,,....##.........##..###',
    '%##.....,".###########:####H#####.....",......##.........##..###',
    '%##...,...."..c,...l..:,.l.,........"...".....##H##########..###',
    '%##.....^......,...l,.:..l.."."....^..........##H##########..###',
    '%##......^....."...fff:fff....,......,......:::H..,........#.###',
    '%##............,".....:..c.......,......."..:,..."..,.......^###',
    '%##..........,........:.^^^........................."......,.###',
    '%##"..................:.^.^....................,.............###',
    '%##...................:.^^^.,..,.,..............".".,.......c###',
    '%##....."...........,.:....................,.,...............###',
    '%##........,.......,,.:................,.................#######',
    '%##.,...,........"....::::::::::::::::::::::::::::::::::::::::::',
    '%##"....,..,,.................:..............,.,......,..#######',
    '%##.....,"..........,.....,...:...",..............".,........###',
    '%##.......,........"......,...:.,...^^............"..........###',
    '%##..^^.........,.............:.,...^....,......"..."...,....###',
    '%##....,...########H#########.:...."..............."..,.,.,..###',
    '%##.,.,....#...........#....#.:.....,...;;;;;;;;;;;;;,.......###',
    '%########..#...........#....#.:.........;;;;;;;;;;;;;..cccc..###',
    '%##........#..c.............#.:::::::::.;;;;;;;;;;;;;..cccc..###',
    '%########..#....ccccc..#....#...,...,...;;;;;;;;;;;;;..cccc..###',
    '%##........#....ccccc..#....#".......,..;;;;;;;;;;;;;........###',
    '%##..."."..##################..................,...........,.###',
    '%##..........,..,..........,...............................,.###',
    '%##..................."...........,........,."....^..........###',
    '%###############################################################',
    '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
    '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
];

defBlock({
    id: 'kilnridge', bx: 0, by: 2, name: 'Kilnridge', theme: 'kiln', music: 'kiln', owArt: true, soft: 3,
    rows: KILNRIDGE_ROWS,
    forest: ['tree_autumn'],
    legend: { 'c': { k: 'clay', p: 'wetclay' } },
    /* the canyon floor; the Kiln Mesa's top (its chimney a hollow in it); the hawk's mesa; the High Mesa over the fair; the
       slot behind the dam; the firing hole; the pit and the kiln yard down in it */
    levels: [[30, 20, 1], [20, 6, 2], [16, 8, 1], [52, 10, 2], [20, 3, 3], [59, 10, 1], [13, 26, 1], [15, 30, 0], [25, 30, 0]],
    faceH: 2,
    rim: [[1, 0, 2, 39], [3, 0, 63, 2], [61, 0, 63, 21], [61, 25, 63, 37], [3, 37, 60, 37]],
    ents: [
        { k: 'deco', x: 20, y: 11, look: 'kilnfacade', solid: [], ox: 0, oy: -14, baseY: 34 },
        { k: 'warp', x: 22, y: 13, to: 'kiln', tx2: 29, ty2: 42, face: 'up', dir: 'up' },
        { k: 'rest', x: 27, y: 15 },
        { k: 'sign', x: 20, y: 18, text: 'THE KILN. Open to Wanderers. Mind the pots: they mind you.' },
        { k: 'sign', x: 55, y: 22, text: 'KILNRIDGE. Clay, kilns, pots, crocks, and more pots.' },
        { k: 'building', x: 41, y: 26, w: 4, h: 3, style: 'ochre', door: null, windows: [0, 3], wallH: 18, variant: 'kr1' },
        { k: 'building', x: 47, y: 26, w: 4, h: 3, style: 'ochre', door: null, windows: [0, 3], wallH: 18, variant: 'kr2', chimneyX: 6 },
        { k: 'deco', x: 51, y: 30, look: 'kilnbig', solid: [[0, 0], [1, 0], [0, 1], [1, 1]], ox: 0, oy: -6 },
        { k: 'deco', x: 39, y: 32, look: 'rack', solid: [[0, 0]] }, { k: 'deco', x: 40, y: 32, look: 'rack', solid: [[0, 0]] },
        { k: 'npc', who: 'annie', x: 44, y: 30, face: 'down' },
        { k: 'npc', who: 'tal', x: 49, y: 32, face: 'left' },
        { k: 'pot', x: 42, y: 33 }, { k: 'pot', x: 47, y: 30 }, { k: 'pot', x: 50, y: 33 },
        { k: 'pot', x: 52, y: 7 }, { k: 'pot', x: 54, y: 12 },
        { k: 'nest', x: 47, y: 16 },
        { k: 'urnseal', x: 3, y: 31, id: 'linnetUrn' },
        { k: 'linnetnote', x: 3, y: 31, note: 3, under: 'linnetUrn' },
        { k: 'crock', x: 30, y: 20 }, { k: 'crock', x: 5, y: 22 }, { k: 'crock', x: 36, y: 35 }, { k: 'crock', x: 52, y: 20 }, { k: 'crock', x: 6, y: 6 },
        { k: 'pickup', x: 29, y: 6, what: 'b20', id: 'mesaButtons' },
        /* the Kiln's forecourt: its gate opens once the ground's been fired (the firing hole by the road), or for anybody
           who's been in already (an older Wander) */
        { k: 'door', x: 22, y: 16, type: 'gate', when: 'fgHole|flag:visited:kiln|flag:d2', dir: 'h', id: 'kilnGate' },
        { k: 'vent', x: 25, y: 17, dir: 'down', dist: 2, period: 280, id: 'fgVent1' },
        { k: 'charm', x: 25, y: 19, mode: 'once', id: 'fgHole', sig: 'fgHole', col: 'ember' },
        { k: 'pot', x: 17, y: 19, id: 'fgPot1' }, { k: 'pot', x: 18, y: 21, id: 'fgPot2' },
        /* the Firing Ground: the old potters' pit, its vent firing through a gate held open from the far corner */
        { k: 'vent', x: 14, y: 31, dir: 'right', dist: 11, period: 300, phase: 150, id: 'fgVent2' },
        { k: 'plate', x: 12, y: 33, sig: 'fgPlate', minWeight: WEIGHT.medium },
        { k: 'door', x: 23, y: 31, type: 'gate', when: 'fgPlate|fgKiln', dir: 'v', id: 'fgGate' },
        { k: 'charm', x: 25, y: 31, mode: 'once', id: 'fgKiln', sig: 'fgKiln', col: 'ember' },
        { k: 'crate', x: 18, y: 31, id: 'fgCrate' },
        { k: 'pot', x: 14, y: 29, id: 'fgPot3' }, { k: 'pot', x: 21, y: 29, id: 'fgPot4' },
        { k: 'deco', x: 25, y: 29, look: 'kiln_dome', solid: [[0, 0], [1, 0]], oy: -20, text: 'An old beehive kiln, the bricks black inside. Warm, still, the way a stone stays warm after the sun goes in.' },
        { k: 'chest', x: 27, y: 32, item: 'heartpatch', id: 'fgPatch' },
        { k: 'brampot', x: 24, y: 33 },
        /* the vent under the Kiln Mesa, asleep under a boulder that rolled onto it (a ring wakes it) */
        { k: 'vent', x: 14, y: 14, dir: 'up', dist: 6, period: 300, phase: 60, id: 'chimneyVent' },
        { k: 'block', x: 11, y: 14, id: 'ventBoulder', look: 'boulder_big', weight: WEIGHT.heavy, sleeper: true, tiedOff: true, startAt: [14, 14], trace: [[11, 14], [12, 14], [13, 14], [14, 14]], noPush: true, pushLine: "A boulder, fast asleep right on top of a vent. The ground under it grumbles. It doesn't budge." },
        { k: 'charm', x: 14, y: 8, mode: 'once', id: 'chimney', sig: 'chimneyLit', col: 'ember' },
        { k: 'chest', x: 17, y: 10, item: 'b50', id: 'chimneyChest', hidden: true, when: 'chimneyLit' },
        { k: 'pot', x: 16, y: 15, id: 'cvPot1' }, { k: 'pot', x: 17, y: 17, id: 'cvPot2' },
        /* the clay dam over the slot (it takes three knocks, one on top of another) */
        { k: 'claydam', x: 60, y: 16, id: 'clayDam' },
        { k: 'vent', x: 60, y: 20, dir: 'up', dist: 4, period: 180, id: 'damVent' },
        { k: 'chest', x: 60, y: 6, item: 'heartpatch', id: 'slotPatch' },
        { k: 'deco', x: 59, y: 9, look: 'pot_stack', solid: [[0, 0]], oy: -6, text: "Crocks, a dozen of them, not finished: no legs yet, no faces, set out in the cleft to dry. One of them is very slightly turned toward you. It wasn't, a moment ago." },
        /* the canyon's dressing: spires, heaps of broken pots, finished ones stacked to sell */
        { k: 'deco', x: 38, y: 13, look: 'hoodoo', solid: [[0, 0]], oy: -28 }, { k: 'deco', x: 44, y: 7, look: 'hoodoo', solid: [[0, 0]], oy: -28 },
        { k: 'deco', x: 6, y: 13, look: 'hoodoo', solid: [[0, 0]], oy: -28 }, { k: 'deco', x: 33, y: 33, look: 'hoodoo', solid: [[0, 0]], oy: -28 },
        { k: 'deco', x: 56, y: 35, look: 'hoodoo', solid: [[0, 0]], oy: -28 },
        { k: 'deco', x: 38, y: 29, look: 'pot_stack', solid: [[0, 0]], oy: -6 }, { k: 'deco', x: 53, y: 27, look: 'shard_heap', solid: false },
        { k: 'deco', x: 9, y: 20, look: 'shard_heap', solid: false }, { k: 'deco', x: 27, y: 18, look: 'shard_heap', solid: false },
    ],
    onEnter: (a, o) => { },
    tick: a => {
        const p = G.player;
        if (p && !Progress.flag('kilnPass') && p.x < 64 * T) Progress.set('kilnPass');
        Vents.update(a);
    },
    drawOver: (a, cx, cy) => {
        Vents.draw(a, cx, cy);
        /* smoke from the chimneys: the Kiln's, the potters' kiln's */
        for (const [sx, sy] of [[20 * T + 37, 80 * T + 11 * T - 14], [51 * T + 16, 80 * T + 30 * T - 10]]) {
            if (sx - cx < -30 || sx - cx > W + 30 || sy - cy < -60 || sy - cy > H + 20) continue;
            for (let i = 0; i < 6; i++) {
                const ph = ((G.t + i * 23) % 140) / 140, x = sx - cx + Math.sin(ph * 5 + i) * 3 + ph * 10, y = sy - cy - ph * 46;
                Gfx.alpha(0.45 * (1 - ph)); Gfx.circle(x, y, 2 + ph * 4, ph < 0.3 ? '#a89888' : '#d8ccc0'); Gfx.alpha(1);
            }
        }
    },
});

/* Bram's first pot, hidden in the old kiln yard */
SPAWN.brampot = (tx, ty) => {
    const pr = new Prop(tx, ty, { im: spr('bram_pot'), solid: [[0, 0]], oy: 0 });
    pr.interact = () => {
        Script.run(function* () {
            yield* say(null, 'A little pot, lopsided, a thumbprint pressed into its side. Scratched round its belly in big wobbly letters: BRAM. AGE 9. MY FIRST WANDER POT. WHEN I AM BIG I WILL MAKE BETTER ONES THAN THIS.');
            if (!Progress.flag('brampot')) { Progress.set('brampot'); Stats.count('secret:brampot'); yield* say(null, "Somebody kept it all these years, and set it down out here where only somebody patient would find it."); }
        });
        return true;
    };
    pr.talkBox = (pl, f) => f.tx === tx && f.ty === ty;
    return pr;
};

PEOPLE_DEF.annie = { name: 'Ochre Annie', col: '#f0b060', look: { body: 'adult', hair: 'long', hairC: '#c4623a', top: '#c9925a', accent: '#93432c', bottom: '#5a3a26', skin: 'tan' } };
PEOPLE_DEF.tal = { name: 'Tal', col: '#c8d8f0', look: { body: 'adult', hair: 'cap', hairC: '#3a3a5a', top: '#5a7aa8', accent: '#e6c08a', bottom: '#45403f', skin: 'brown', extra: ['beard'] } };
TALK.annie = function* () {
    yield* firstThen('annie', "Annie. I dig the clay. Bram buys the clay. Bram breaks the pots. The pots come back. It's a living.",
        ["Strange thing: the Kiln's been here forever, but the inside always smells of fresh clay. Like someone's been working.", "Throw a pot at a crock and it'll fly to bits, and the bits'll go home the way the crock walked. Don't stand where the crock's been.", "Up on the hawk's mesa there's a nest right over the path down. That bird's got something shiny up there."]);
};
TALK.tal = function* () {
    yield* firstThen('tal', "Tal, tinker. I mend things. Well. Nothing in the Hollow stays broken, so mostly I just sit here.",
        ["They say there's a bridge out east of Meadowfold. Washed away. Folk with a hook get across, I'm told.", "That little crack in the west cliff? Wind whistles through it. Something in there, I reckon. Clay, I reckon. Old clay.", "You ever wonder where the bits go, when a pot flies home? They go home. Obviously. But where's home for a pot?"]);
};
BUDGE.annie = 'Ochre Annie: "Easy! I dig clay, I don\'t get dug."';
BUDGE.tal = 'Tal: "Mind my tools."';

/* the hawk's nest over the switchback: struck by flying pieces it tips out what's in it (S20) */
SPAWN.nest = (tx, ty) => {
    const c = new Charm(tx, ty, { mode: 'once', id: 'hawknest', col: 'ochre' });
    c.draw = function (cx, cy) {
        const x = this.x - cx + 8, y = this.y - cy;
        Gfx.img(ART.deadtree, x - 12, y - 30);
        if (!this.on) Gfx.img(ART.nest, x - 6, y - 14);
        Gfx.alpha(0.18); Gfx.rect(x - 4, y + 9, 8, 2, PAL.ink); Gfx.alpha(1);
    };
    const strike = c.strike;
    c.strike = function (by) {
        if (this.on) return;
        strike.call(this, by);
        this.area.add(new Pickup(this.x, this.y - 10, { what: 'heartpatch', id: 'hawkPatch', vz: 1.5 }));
        Sfx.play('appear');
    };
    return c;
};
/* an old cracked urn, wedged at the end of the crevice */
SPAWN.urnseal = (x, y, p) => { const s = new Seal(x, y, p); s.sprite = () => spr('urn_cracked'); s.onStruck = () => UI.toast('An old urn, cracked all over. A good knock from a distance would do it.'); return s; };
LINNET_NOTES[3] = { title: 'A note in a cracked urn', text: "I broke a pot in the Kiln and watched the bits go home and I could SEE THE THREAD. Just for a moment. It went down through the floor. Down. Not back to the shelf: down. Who's down there? - L." };
NOTES.linnet3 = { title: LINNET_NOTES[3].title, text: LINNET_NOTES[3].text };

function initKilnridgeArt() {
    ART.kilnfacade = paintSprite(48, 48, x => {
        /* an arch of fired brick round the door, a chimney behind smoking */
        for (let j = 0; j < 48; j++) for (let i = 0; i < 48; i++) {
            const dx = i - 24, dy = j - 30, r = Math.hypot(dx, dy * 1.2);
            if (j > 14 && r < 22 && !(Math.abs(dx) < 7 && j > 28)) {
                const brick = (Math.floor(j / 4) + Math.floor((i + (Math.floor(j / 4) % 2) * 3) / 6)) % 2;
                x.fillStyle = j % 4 === 3 ? '#5e261c' : brick ? '#b8583a' : '#c4623a';
                if (r > 19) x.fillStyle = '#8a3c28';
                x.fillRect(i, j, 1, 1);
            }
        }
        x.fillStyle = '#2a1410'; x.fillRect(17, 28, 14, 20); x.fillStyle = '#f39a3c'; x.globalAlpha = 0.35; x.fillRect(18, 38, 12, 10); x.globalAlpha = 1;
        x.fillStyle = '#e8a070'; x.fillRect(20, 18, 8, 6); x.fillStyle = '#93432c'; x.fillRect(21, 19, 6, 4); x.fillStyle = '#f7d64a'; x.fillRect(23, 20, 2, 2);
        x.fillStyle = '#6a2e22'; x.fillRect(34, 0, 7, 16); x.fillStyle = '#8a7a6a'; x.fillRect(33, 0, 9, 2);
    });
    ART.deadtree = paintSprite(24, 34, x => {
        x.fillStyle = '#7a5a40'; x.fillRect(11, 8, 3, 26); x.fillRect(5, 6, 2, 10); x.fillRect(6, 15, 6, 2); x.fillRect(16, 4, 2, 12); x.fillRect(13, 13, 4, 2);
        x.fillStyle = '#5a3e2a'; x.fillRect(13, 8, 1, 26); x.fillRect(3, 4, 2, 3); x.fillRect(18, 2, 2, 3);
    });
    ART.nest = paintSprite(12, 8, x => { x.fillStyle = '#9a6438'; x.fillRect(0, 3, 12, 5); x.fillStyle = '#c9925a'; for (let i = 0; i < 12; i += 2) x.fillRect(i, 3 + (i % 4 ? 1 : 0), 2, 1); x.fillStyle = '#f07a9a'; x.fillRect(4, 1, 4, 3); x.fillStyle = '#ffd8e4'; x.fillRect(5, 1, 1, 1); });
    defSym('urn_cracked', ['........', '......kk', '.....kyo', '.....kkk', '....kook', '...kyoko', '..kyooko', '..kookoo', '..koOooo', '..kookOo', '..kOokoo', '...kOooo', '....kOOO', '.....kkk', '........', '........'], { o: '#a8805a', O: '#7a5a3a', y: '#c8a07a' }, { y: 'o' });
}
CONTENT_INIT.push(initKilnridgeArt);


/* ---------- wet clay, vents, and a dam that mends ----------
   Wet clay: soft going (Wren wades), and anything that comes to rest in it (pushed, thrown, fired) sticks fast, unbroken:
   it's held, so it doesn't go home (rule 3) until it's lifted out or gripped. A vent keeps its own mouth wet with steam;
   every so often it breathes out hard, and whatever's stuck in its mouth is flung up and over whatever's in front (walls
   too), landing a set way off. What's flung lays its thread along its flight like anything thrown, so when a pot breaks
   where it lands its pieces fly home back over the wall it crossed, then along wherever it was carried. A clay dam takes
   three knocks to break, but the clay settles back if it's left alone a little while. */
TK.clay = { solid: false, slow: true, clay: true };
const CLAY = { clay: true };          /* what's holding a thing that's stuck in the clay */
const Clay = {
    at(a, x, y) { return !!a.kind(x, y).clay; },
    stuck(o) { return o.heldBy === CLAY; },
    stick(o) {
        if (o.heldBy || o.carried || o.fixed || o.weight > WEIGHT.light) return;
        o.heldBy = CLAY; o.stuckNoPush = !o.noPush; o.noPush = true;
        Fx.dust(o.tx * T + 8, o.ty * T + 13);
    },
    unstick(o) { if (o.heldBy === CLAY) o.heldBy = null; if (o.stuckNoPush) { o.noPush = false; o.stuckNoPush = false; } },
};
{
    /* coming to rest on clay (a push, a hook's last tug; not a thing going home, which walks on through) */
    const landed0 = GridThing.prototype.landed;
    GridThing.prototype.landed = function (returning) {
        landed0.call(this, returning);
        if (!returning && !this.removed && !this.hookPulled && this.area && this.ret && this.ret.state !== 'returning' && Clay.at(this.area, this.tx, this.ty) && !this.area.kind(this.tx, this.ty).pit) Clay.stick(this);
    };
    /* thrown into clay: it sticks there, whole */
    const land0 = Thrown.land;
    Thrown.land = function (t, area) {
        const o = t.o, tx = t.lastTx, ty = t.lastTy;
        if (Clay.at(area, tx, ty) && !area.at(tx, ty) && o.weight <= WEIGHT.light) {
            o.flying = false; o.tx = tx; o.ty = ty; o.x = tx * T; o.y = ty * T;
            area.place(o, tx, ty);
            if (o.ret) Return.moved(o, tx, ty);
            Sfx.play('land'); Clay.stick(o);
            return;
        }
        return land0.call(this, t, area);
    };
    /* lifting it out (or taking hold of it) frees it */
    const lift0 = Player.prototype.lift;
    Player.prototype.lift = function (o) { Clay.unstick(o); return lift0.call(this, o); };
    const grip0 = Player.prototype.tryGrip;
    Player.prototype.tryGrip = function () { const o = this.thingInFront(); if (o && Clay.stuck(o)) Clay.unstick(o); return grip0.call(this); };
}
SFX.vent = (o, t) => { Audio.hit(o, t, 0.5, 0.2, 300, 3000); Audio.tone(o, t, 110, 0.4, 'triangle', 0.12, { slide: 220 }); };

/* a vent: a crack in the clay with heat coming off it, wet round its mouth */
class Vent extends FloorThing {
    constructor(tx, ty, p = {}) {
        super('vent', tx, ty, p);
        this.d = dirByName(p.dir || 'up'); this.dist = p.dist || 4;
        this.period = p.period || 300; this.phase = p.phase || 0; this.t = 0; this.puffT = 0;
        this.inert = false;
    }
    get k() { return (this.t + this.phase) % this.period; }
    get soon() { return !this.off && this.k > this.period - 70; }
    update() {
        this.t++;
        if (this.puffT > 0) this.puffT--;
        if (this.off || this.k !== 0) return;
        const a = this.area;
        /* (a sleeping boulder on its mouth smothers it) */
        const o = a.at(this.tx, this.ty);
        if (o && Return.asleep(o)) return;
        this.puffT = 40;
        if (a === G.map && G.player) { const p = G.player; if (Math.abs(p.tx - this.tx) < 12 && Math.abs(p.ty - this.ty) < 8) Sfx.play('vent', 0.6); }
        if (o && !o.fixed && !o.mv && !o.carried && o.weight <= WEIGHT.light && (!o.heldBy || o.heldBy === CLAY)) Vents.fire(o, this);
        /* standing in it: a hot breath, and off you step */
        const p = G.player;
        if (p && p.area === a && p.state === 'normal' && p.feetOn(this.tx, this.ty)) {
            p.kx = -DX[this.d] * 2.6 || (p.x < this.tx * T + 8 ? -2.6 : 2.6); p.ky = -DY[this.d] * 2.6;
            Fx.text(p.x, p.y - 20, 'Hot!', '#f39a3c');
        }
    }
    draw(cx, cy) {
        const x = this.tx * T - cx, y = this.ty * T - cy, soon = this.soon, on = this.puffT > 0;
        /* the wet mouth, the crack, the glow inside it (brighter as it's about to go) */
        const im = spr('vent_mouth'); if (im) Gfx.img(im, x, y);
        const glow = on ? '#ffe08a' : soon ? (((G.t >> 2) % 2) ? '#f8b050' : '#f39a3c') : '#c4623a';
        Gfx.rect(x + 5, y + 7, 6, 2, glow); Gfx.rect(x + 7, y + 6, 2, 4, glow);
        if (soon || on) { Gfx.alpha(0.35); Gfx.rect(x + 3, y + 5, 10, 6, glow); Gfx.alpha(1); }
    }
}
SPAWN.vent = (x, y, p) => new Vent(x, y, p);

const Vents = {
    flights: [],
    /* up it goes, over whatever's in front, and down a set way off */
    fire(o, v) {
        const a = v.area;
        Clay.unstick(o);
        a.unplace(o, o.tx, o.ty);
        o.flying = true; o.mv = null;
        /* the tiles it passes over; it comes down on the last open one, or stops short at a thing standing up in its way */
        const path = [];
        let land = null;
        for (let i = 1; i <= v.dist; i++) {
            const x = v.tx + DX[v.d] * i, y = v.ty + DY[v.d] * i;
            if (!a.inside(x, y)) break;
            const occ = a.at(x, y);
            if (occ && occ !== o && !occ.walkOn) { path.push({ x, y, hit: occ }); break; }
            let shut = false; for (const b of a.blockers) if (b.blocks(x, y, o)) shut = true;
            if (shut) { path.push({ x, y, hit: null, shut: true }); break; }
            path.push({ x, y });
            const k = a.kind(x, y);
            if (!k.solid || k.deep || k.pit) land = { x, y };
        }
        this.flights.push({ o, v, path, land, i: 0, t: 0, x: v.tx * T + 8, y: v.ty * T + 8, z: 0, a });
        Stats.count('vent:fired');
    },
    update(a) {
        for (const f of this.flights) {
            if (f.a !== a || f.o.area !== a) { f.done = true; this.drop(f, true); continue; }
            f.t++;
            const n = f.path.length, dur = Math.max(10, n * 6), k = Math.min(1, f.t / dur);
            const ex = (f.path.length ? f.path[f.path.length - 1].x : f.v.tx) * T + 8, ey = (f.path.length ? f.path[f.path.length - 1].y : f.v.ty) * T + 8;
            const tx = lerp(f.v.tx * T + 8, ex, k), ty = lerp(f.v.ty * T + 8, ey, k);
            f.x = tx; f.y = ty; f.z = Math.sin(k * Math.PI) * (18 + n * 3);
            /* over each tile: charms and bells hanging in the air there are struck (its thread jumps straight from the
               vent to where it comes down, the way a thread goes over a wall) */
            const idx = Math.min(n - 1, Math.floor(k * n - 0.001));
            while (f.i <= idx && f.i < n) {
                const s = f.path[f.i++];
                if (s.hit || s.shut) {
                    if (s.hit && s.hit.hit) s.hit.hit(f.o, f.v.d);
                    f.done = true; this.drop(f); break;
                }
                for (const e of a.ents) if (e.strike && e.tx === s.x && e.ty === s.y && e !== f.o) e.strike(f.o);
            }
            if (!f.done && f.t >= dur) { f.done = true; this.drop(f); }
        }
        this.flights = this.flights.filter(f => !f.done);
    },
    /* down it comes: into clay (whole), a pit or water, or onto the ground (a pot breaks) */
    drop(f, away) {
        const o = f.o, a = f.a;
        o.flying = false;
        let { x, y } = f.land || { x: f.v.tx, y: f.v.ty };
        if (a.at(x, y) && a.at(x, y) !== o) {
            /* (something's landed there since: the nearest open tile back along the way) */
            const back = f.path.slice().reverse().find(s => !a.at(s.x, s.y) && !a.kind(s.x, s.y).solid);
            if (back) { x = back.x; y = back.y; } else { x = f.v.tx; y = f.v.ty; }
        }
        if (o.ret) Return.moved(o, x, y);
        if (away || o.removed) { if (o.ret) Return.sendHome(o); else { o.tx = x; o.ty = y; o.x = x * T; o.y = y * T; a.place(o, x, y); } return; }
        const k = a.kind(x, y);
        if (Clay.at(a, x, y) && !a.at(x, y)) { o.tx = x; o.ty = y; o.x = x * T; o.y = y * T; a.place(o, x, y); Sfx.play('land'); Clay.stick(o); return; }
        if (o.breaks && !k.pit && !k.deep) { o.tx = x; o.ty = y; Shards.start(o, x, y); return; }
        o.tx = x; o.ty = y; o.x = x * T; o.y = y * T;
        a.place(o, x, y); Sfx.play('land');
        o.landed(false);
    },
    draw(a, cx, cy) {
        for (const f of this.flights) {
            if (f.a !== a) continue;
            const im = f.o.sprite && f.o.sprite();
            Gfx.alpha(0.25); Gfx.rect(f.x - cx - 4, f.y - cy + 4, 8, 2, PAL.ink); Gfx.alpha(1);
            if (im) Gfx.img(im, f.x - cx - 8, f.y - cy - 8 - f.z);
        }
    },
};

/* a dam of hard clay across a cleft: three knocks from flying things in quick succession break it; left alone, it settles */
class ClayDam extends GridThing {
    constructor(tx, ty, p = {}) { super('dam', tx, ty, Object.assign({ weight: WEIGHT.fixed, fixed: true, marked: false, hookable: false }, p)); this.hp = 3; this.mendT = 0; }
    onAdd(area) { super.onAdd(area); if (this.id && Progress.areaFlag(area.id, 'seal:' + this.id)) area.remove(this); }
    hit(by, d, shard) {
        if (!by || (!shard && !by.flying)) { Sfx.play('hitthing'); return; }
        this.hp--; this.mendT = this.mend || 270; G.shake = 4;
        Sfx.play('shatter'); Fx.burst(this.tx * T + 8, this.ty * T + 6, '#b8583a');
        if (this.hp > 0) return;
        if (this.id) Progress.setAreaFlag(this.area.id, 'seal:' + this.id);
        Fx.burst(this.tx * T + 8, this.ty * T + 8, '#e08a5e'); Sfx.play('door'); G.shake = 10;
        Stats.count('secret:dam');
        this.area.remove(this);
    }
    onStruck() { UI.toast(this.hp < 3 ? 'The cracks in the dam are already closing up.' : 'Hard clay, thick as a wall. It would take a good many knocks, one on top of another.'); }
    tick() { if (this.hp < 3 && --this.mendT <= 0) { this.hp = 3; if (this.area === G.map) Sfx.play('unclick'); } }
    sprite() { return spr('clay_dam_' + (3 - this.hp)); }
}
SPAWN.claydam = (x, y, p) => new ClayDam(x, y, p);

/* ---------- Kilnridge's look: a canyon floor of red clay dust, cracked where it's driest; dry grass; sandstone in layers ---------- */
OWA.ground.kiln = {
    grass: {
        field: (tx, ty) => OWA.field(tx, ty, 57, 6, 5, -0.05),
        draw(x, th, v, fl) {
            const [g0, g1, g2, g3] = th.grass;
            fill(x, g0);
            speckle(x, [g1], 11 + v * 13, 0.13); speckle(x, [g2], 23 + v * 7, 0.07);
            /* cracks where it's dried out (a cell of dried mud, edged dark, its lip catching the light) */
            for (let n = 0; n < [0, 1, 3, 4][fl]; n++) {
                let cx = Math.floor(hash2(v + fl * 5, n, 81) * 14) + 1, cy = Math.floor(hash2(n, v + fl * 5, 82) * 14) + 1;
                for (let st = 0; st < 7; st++) {
                    px(x, cx, cy, '#9a5a34'); if (cy + 1 < 16) px(x, cx, cy + 1, mix(g0, g2, 0.6));
                    const r = hash2(n * 7 + st, v + fl, 83);
                    if (r < 0.45) cx = clamp(cx + 1, 0, 15); else if (r < 0.7) cy = clamp(cy + 1, 0, 15); else if (r < 0.85) cy = clamp(cy - 1, 0, 15); else cx = clamp(cx - 1, 0, 15);
                }
            }
            /* pebbles, and now and then a bit of broken pot */
            for (let n = 0; n < 2; n++) { const sx = Math.floor(hash2(v, n, 91) * 14) + 1, sy = Math.floor(hash2(n, v, 92) * 13) + 2; px(x, sx, sy, '#b07850'); px(x, sx + 1, sy, '#c89068'); px(x, sx, sy + 1, '#8a5638'); }
            if (v === 1 && fl < 2) { px(x, 10, 11, '#c4623a'); px(x, 11, 11, '#e08a5e'); px(x, 10, 12, '#93432c'); }
            if (v === 3) { px(x, 4, 6, '#b8a050'); px(x, 5, 5, '#d8c070'); px(x, 3, 5, '#b8a050'); }
        },
    },
    /* the canyon's flowers: little orange and yellow stars close to the dust */
    flowers(x, th, v) {
        OWA.ground.kiln.grass.draw(x, th, v, 0);
        const cols = [['#f39a3c', '#fbe08a'], ['#f7d64a', '#fff4c0'], ['#e8463c', '#f7d64a'], ['#fbf6ea', '#f39a3c']];
        for (let n = 0; n < 2; n++) {
            const [pe, mi] = cols[Math.floor(hash2(v, n, 9) * cols.length)], fx = 3 + Math.floor(hash2(n, v, 1) * 9), fy = 3 + Math.floor(hash2(v + 3, n, 2) * 9);
            px(x, fx, fy - 1, pe); px(x, fx - 1, fy, pe); px(x, fx + 1, fy, pe); px(x, fx, fy, mi); px(x, fx, fy + 1, '#8a7a3a'); px(x, fx + 1, fy + 2, '#8a7a3a');
        }
    },
    /* dry grass in clumps, bleached at the tips */
    tallgrass(x, th, v) {
        OWA.ground.kiln.grass.draw(x, th, v, 0);
        for (let i = 0; i < 6; i++) {
            const bx = 2 + i * 2 + (i % 2), h = 5 + Math.floor(hash2(i, v, 4) * 5);
            for (let j = 0; j < h; j++) px(x, bx + (j > h - 3 ? (i % 2 ? 1 : -1) : 0), 15 - j, j > h - 3 ? '#f0dca0' : j > h / 2 ? '#d8b868' : '#b89048');
        }
    },
    /* the track: clay packed hard and pale, two ruts worn in it */
    path(x, th, v) {
        const [p0, p1, p2] = th.path;
        fill(x, p0); speckle(x, [p1], 31 + v, 0.15); speckle(x, [p2], 41 + v, 0.08);
        for (let n = 0; n < 2; n++) { const sx = Math.floor(hash2(v, n, 12) * 13) + 1, sy = Math.floor(hash2(n, v, 13) * 13) + 1; px(x, sx, sy, '#c89870'); px(x, sx + 1, sy, p1); }
    },
    /* under the autumn trees: red earth and fallen leaves */
    forest(x, th, v) { fill(x, '#7a3a24'); speckle(x, ['#8a4a2a', '#6a3020'], v + 9, 0.3); speckle(x, ['#f0a840', '#d9832a'], v + 21, 0.06); },
    /* wet clay: dark and glossy, a sheen on it, a puddle in the hollows */
    wetclay(x, th, v) {
        fill(x, '#8a4a30'); speckle(x, ['#7a3e28', '#9a5638'], 50 + v, 0.3);
        for (let n = 0; n < 3; n++) { const sx = Math.floor(hash2(v, n, 51) * 12) + 1, sy = Math.floor(hash2(n, v, 52) * 13) + 1; fill(x, '#b87050', sx, sy, 3, 1); px(x, sx, sy + 1, '#6a3420'); }
        if (v % 2) { fill(x, '#6a3a30', 6, 9, 5, 3); fill(x, '#8aa8b8', 7, 10, 3, 1); px(x, 7, 9, '#c8d8e0'); }
        for (let i = 0; i < 16; i += 5) px(x, (i + v * 3) % 16, 14, '#6a3420');
    },
    /* steps cut into the sandstone */
    stairs(x, th) {
        const [s0, s1, s2, s3] = th.stone;
        for (let i = 0; i < 4; i++) { const y = i * 4; fill(x, mix(s0, s2, 0.35), 0, y, 16, 2); fill(x, s0, 0, y + 2, 16, 1); fill(x, mix(s1, s3, 0.5), 0, y + 3, 16, 1); }
        fill(x, s3, 0, 0, 1, 16); fill(x, s3, 15, 0, 1, 16);
    },
};
OWA.cliffs.kiln = {
    face: (x, th, v, m) => OWA.rockFace(x, th, v, m, { tint: ['#c4623a', '#a84e30', '#d67a54', '#93432c', '#b8583a'], band1: [0, 3, 7, 10, 13], band2: [0, 4, 8, 12], lip: ['#c78a52', '#d9a067', '#e8b884'], rimTop: ['#e08a5e', '#b0603e', '#8a4430'], seed: 3 }),
    top: (x, th, v, m) => OWA.rockTop(x, th, v, m, { topCol: '#a85a3a', tuft: ['#c8a050', '#e0c070'], seed: 3 }),
};

function initKilnridgeArt2() {
    /* a vent's mouth: wet clay round a crack, a little steam beading */
    defSprite('vent_mouth', ['................', '.....kkkkkk.....', '...kkuuuuuukk...', '..kuuUUUUUUuuk..', '.kuUUkkkkkkUUuk.', '.kuUkkkkkkkkUuk.', 'kuUUkk....kkUUuk', 'kuUkk......kkUuk',
        'kuUkk......kkUuk', 'kuUUkk....kkUUuk', '.kuUkkkkkkkkUuk.', '.kuUUkkkkkkUUuk.', '..kuuUUUUUUuuk..', '...kkuuuuuukk...', '.....kkkkkk.....', '................'], { u: '#a86040', U: '#7a3e28' });
    /* the dam: a plug of hard clay, cracking */
    for (let c = 0; c < 3; c++) {
        const rows = ['.kkkkkkkkkkkkkk.', 'kuuuuuuuuuuuuuuk', 'kuUuuuuUuuuuUuuk', 'kuuuuuuuuuuuuuuk', 'kuuuUuuuuuuUuuuk', 'kuuuuuuuuuuuuuuk', 'kUuuuuUuuuuuuuUk', 'kuuuuuuuuuuuuuuk',
            'kuuuUuuuuuUuuuuk', 'kuuuuuuuuuuuuuuk', 'kuUuuuuuUuuuuuuk', 'kuuuuuuuuuuuuuuk', 'kUUUUUUUUUUUUUUk', 'kUUUUUUUUUUUUUUk', 'kUUUUUUUUUUUUUUk', '.kkkkkkkkkkkkkk.'].map(r => r.split(''));
        const cracks = [[[3, 2], [4, 3], [4, 4], [5, 5], [5, 6], [6, 7]], [[11, 3], [10, 4], [10, 5], [11, 6], [11, 7], [10, 8], [9, 9]], [[6, 8], [7, 9], [7, 10], [8, 11], [3, 9], [2, 10], [12, 9], [13, 10]]];
        for (let i = 0; i < c; i++) for (const [cx, cy] of cracks[i]) rows[cy][cx] = 'k';
        defSprite('clay_dam_' + c, rows.map(r => r.join('')), { u: '#c06a44', U: '#8a4430' });
    }
    /* a hoodoo: a spire of clay with a cap of harder stone */
    ART.hoodoo = paintSprite(16, 44, x => {
        for (let j = 6; j < 44; j++) {
            const w = Math.round(3 + (j / 44) * 4 + Math.sin(j / 3.5) * 1.2);
            for (let i = 8 - w; i < 8 + w; i++) {
                const l = -(i - 8) / w * 0.6 + (hash2(i, j, 7) - 0.5) * 0.4, band = Math.floor(j / 5) % 2;
                x.fillStyle = l > 0.35 ? (band ? '#f0a070' : '#e8946a') : l > -0.25 ? (band ? '#d67a54' : '#c4623a') : '#93432c'; x.fillRect(i, j, 1, 1);
            }
        }
        for (let j = 0; j < 7; j++) { const w = j < 2 ? 4 + j : 6; for (let i = 8 - w; i < 8 + w; i++) { x.fillStyle = j < 2 ? '#e0d0b8' : i < 8 ? '#c8b8a0' : '#a89880'; x.fillRect(i, j + 1, 1, 1); } }
    });
    /* an old beehive kiln, cold for years */
    ART.kiln_dome = paintSprite(40, 36, x => {
        for (let j = 0; j < 32; j++) for (let i = 0; i < 40; i++) {
            const u = (i - 20) / 19, w = (j - 30) / 28; if (u * u + w * w > 1) continue;
            const row = Math.floor(j / 4), brick = (row + Math.floor((i + (row % 2) * 3) / 6)) % 2;
            const l = -u * 0.6 - w * 0.5 + (hash2(i, j, 4) - 0.5) * 0.3;
            x.fillStyle = j % 4 === 3 ? '#6a2e22' : l > 0.5 ? '#e08a5e' : brick ? '#b8583a' : '#c4623a'; x.fillRect(i, j + 2, 1, 1);
        }
        x.fillStyle = '#2a1410'; x.fillRect(14, 20, 12, 14); x.fillStyle = '#4a2418'; x.fillRect(15, 21, 10, 12);
        x.fillStyle = '#6a2e22'; x.fillRect(13, 19, 14, 2); x.fillStyle = '#8a7a6a'; x.fillRect(17, 0, 6, 4);
    });
    /* a stack of finished pots, and a heap of the broken ones */
    ART.pot_stack = paintSprite(16, 22, x => {
        const pot = (ox, oy, c) => { const [a, b, d] = c; x.fillStyle = b; x.fillRect(ox + 1, oy + 1, 6, 6); x.fillStyle = a; x.fillRect(ox + 1, oy + 1, 3, 5); x.fillStyle = d; x.fillRect(ox + 2, oy, 4, 1); x.fillRect(ox + 1, oy + 6, 6, 1); };
        pot(0, 14, ['#f2bc78', '#d98f3a', '#a8602a']); pot(8, 14, ['#e8946a', '#c4623a', '#93432c']); pot(4, 7, ['#f2bc78', '#d98f3a', '#a8602a']); pot(4, 0, ['#9ae0d8', '#4fb8b0', '#2e7e78']);
    });
    ART.shard_heap = paintSprite(16, 10, x => { for (let n = 0; n < 16; n++) { const sx = Math.floor(hash2(n, 2, 5) * 13), sy = 3 + Math.floor(hash2(2, n, 6) * 6); x.fillStyle = ['#d98f3a', '#c4623a', '#a8602a', '#4fb8b0'][n % 4]; x.fillRect(sx, sy, 3 - (n % 2), 2); } });
    /* a pot with a child's thumbprint pressed in it, and letters scratched round its belly */
    defSym('bram_pot', ['........', '........', '.....kkk', '....kyoo', '....kOOO', '.....koo', '....kyoo', '...kyooo', '..kyookk', '..kookyk', '..kooook', '..kOoooo', '...kOOoo', '....kOOO', '.....kkk', '........'], { o: '#c08050', O: '#8a5638', y: '#e0a878' }, { y: 'o' });
}
CONTENT_INIT.push(initKilnridgeArt2);
