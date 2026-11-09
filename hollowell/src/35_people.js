/* The people of Hollowell: how they look and sound. Their lines are in the story files. */

const PEOPLE_DEF = {
    gran: { name: 'Gran', col: '#f0e6d0', look: { body: 'elder', hair: 'bun', hairC: '#e8e4e0', top: '#6a8ac4', accent: '#f0e6d0', bottom: '#4a4a6a', skin: 'light', extra: ['glasses'] } },
    quill: { name: 'Miss Quill', col: '#c8d8f0', look: { body: 'adult', hair: 'bun', hairC: '#3a2a2a', top: '#3a5a8a', accent: '#fbf6ea', bottom: '#2a3a5a', skin: 'pale', extra: ['glasses'] } },
    tuck: { name: 'Tuck', col: '#f7d64a', look: { body: 'child', hair: 'tuft', hairC: '#e0b040', top: '#5ab85a', accent: '#3a7a3a', bottom: '#3a5fae', skin: 'light' } },
    nell: { name: 'Nell', col: '#f59ac0', look: { body: 'child', hair: 'long', hairC: '#2a1a1a', top: '#f07a9a', accent: '#fbf6ea', bottom: '#7a4a6a', skin: 'brown' } },
    otto: { name: 'Otto', col: '#9fdcf5', look: { body: 'child', hair: 'cap', hairC: '#6b4128', top: '#e8463c', accent: '#3a5fae', bottom: '#45403f', skin: 'tan' } },
    bea: { name: 'Bea', col: '#c8e66a', look: { body: 'child', hair: 'bun', hairC: '#d9832a', top: '#f7d64a', accent: '#e8463c', bottom: '#6b4128', skin: 'light' } },
    hob: { name: 'Fisher Hob', col: '#7ec8f0', look: { body: 'adult', hair: 'cap', hairC: '#9a9188', top: '#3a7ab8', accent: '#e6c08a', bottom: '#5a4a3a', skin: 'tan', extra: ['beard'] } },
    arlo: { name: 'Old Arlo', col: '#e6c08a', look: { body: 'elder', hair: 'bald', hairC: '#f0f0f0', top: '#9a6438', accent: '#c9925a', bottom: '#45403f', skin: 'tan', extra: ['mustache'] } },
    ives: { name: 'Mother Ives', col: '#5ad1c5', look: { body: 'adult', hair: 'bun', hairC: '#8a4a2a', top: '#2e9a96', accent: '#fbf6ea', bottom: '#1f5d63', skin: 'light' } },
    bram: { name: 'Bram', col: '#f0b060', look: { body: 'adult', hair: 'short', hairC: '#2a1a14', top: '#d98f3a', accent: '#9a6438', bottom: '#5a3a26', skin: 'dark', extra: ['beard'] } },
    rosa: { name: 'Rosa', col: '#f8c8a0', look: { body: 'adult', hair: 'long', hairC: '#e0b040', top: '#f4e6c8', accent: '#e8463c', bottom: '#9a3a4a', skin: 'light' } },
    thimble: { name: 'Thimble', col: '#d8c8f0', look: { body: 'adult', hair: 'short', hairC: '#7a7a8a', top: '#7d5bc4', accent: '#f7d64a', bottom: '#3e3a3c', skin: 'pale', extra: ['glasses'] } },
    seam: { name: 'Sebastian Seam', col: '#f07a9a', look: { body: 'adult', hair: 'tuft', hairC: '#1a1a1a', top: '#d0608e', accent: '#fbf6ea', bottom: '#2a2a3a', skin: 'brown' } },
    mallow: { name: 'Doctor Mallow', col: '#c9b3f0', look: { body: 'adult', hair: 'bald', hairC: '#c8c0b8', top: '#fbf6ea', accent: '#b48ce8', bottom: '#4b3a8a', skin: 'light', extra: ['glasses', 'mustache'] } },
    mabel: { name: 'Auntie Mabel', col: '#c8e66a', look: { body: 'elder', hair: 'long', hairC: '#c8c8d0', top: '#8a5aa0', accent: '#f7d64a', bottom: '#4a2a5a', skin: 'dark' } },
    burr: { name: 'Constable Burr', col: '#9a9188', look: { body: 'adult', hair: 'cap', hairC: '#3a3a5a', top: '#2b5aa8', accent: '#f7d64a', bottom: '#1f3270', skin: 'light', extra: ['mustache'] } },
    gundry: { name: 'Gundry', col: '#c9925a', look: { body: 'adult', hair: 'short', hairC: '#c4623a', top: '#7a5233', accent: '#e6c08a', bottom: '#45281c', skin: 'tan' } },
    ambrose: { name: 'Dad', col: '#7ec8f0', look: { body: 'adult', hair: 'short', hairC: '#a5532a', top: '#4f9be0', accent: '#fbf6ea', bottom: '#5a4a3a', skin: 'light', extra: ['beard'] } },
    tess: { name: 'Mum', col: '#f7d64a', look: { body: 'adult', hair: 'long', hairC: '#3a2a1a', top: '#e8c04a', accent: '#a6772a', bottom: '#6b4128', skin: 'tan' } },
    jory: { name: 'Jory', col: '#d6304e', look: { body: 'elder', hair: 'tuft', hairC: '#f0f0f0', top: '#c42b4a', accent: '#f7d64a', bottom: '#2a1f2d', skin: 'light', extra: ['glasses'] } },
};

function initPeople() {
    for (const [id, d] of Object.entries(PEOPLE_DEF)) {
        PEOPLE[id] = d; SPEAKER_COL[id] = d.col;
        makePerson(id, d.look);
    }
    SPEAKER_COL.wren = '#e8463c';
    VOICES.bram = 'low'; VOICES.burr = 'low'; VOICES.hob = 'low'; VOICES.arlo = 'low'; VOICES.ambrose = 'low'; VOICES.gundry = 'low';
    /* animals */
    defSprite('cat_0', ['................', '................', '................', '................', '................', '................', '..k...k.........', '.kok.kok........',
        '.koookoook...kk.', '.kowooowok..kok.', '.kooooooookkok..', '..kOOooooooook..', '...koooOOooook..', '...kOk.kOk.kOk..', '....k...k...k...', '................'],
        { o: '#f0a050', O: '#c87830', w: '#2a1f2d' });
    defSprite('cat_1', ['................', '................', '................', '................', '................', '................', '..k...k.........', '.kok.kok........',
        '.koookoook...kk.', '.kowooowok..kok.', '.kooooooookkok..', '..kOOooooooook..', '...koooOOooook..', '..kOk..kOkkOk...', '...k....k..k....', '................'],
        { o: '#f0a050', O: '#c87830', w: '#2a1f2d' });
    defSprite('dog_0', ['................', '................', '................', '................', '................', '..kk............', '.kbbk...........', '.kbwbkkkkkkkk...',
        '.kbbbwwwwwwwwk..', '..kkbwwwwwwwwbk.', '...kwwwwwwwwbbk.', '...kwbwwwwbwwk..', '...kbk.kbk.kbk..', '...kk..kk..kk...', '................', '................'],
        { w: '#f4e6c8', b: '#9a6438' });
    defSprite('bubble_dots', ['.kkkkkkk.', 'kwwwwwwwk', 'kwkwkwkwk', 'kwwwwwwwk', '.kkkwkkk.', '....k....'], {});
    defSprite('bubble_heart', ['.kkkkkkk.', 'kwrwwwrwk', 'kwrrwrrwk', 'kwwrrrwwk', '.kkkrkkk.', '....k....'], {});
    defSprite('bubble_bang', ['.kkkkkkk.', 'kwwwrwwwk', 'kwwwrwwwk', 'kwwwwwwwk', '.kkkrkkk.', '....k....'], {});
}
CONTENT_INIT.push(initPeople);

/* animals that go where they like (Biscuit) or chase a ball (Pudding) */
class Critter extends Ent {
    constructor(tx, ty, props = {}) {
        super('critter', props);
        this.x = tx * T + 8; this.y = ty * T + 10; this.dir = RIGHT; this.t = 0; this.anim = 0;
        this.route = props.route || null; this.ri = 0; this.wait = 0;
    }
    get sortY() { return this.y + 1; }
    update() {
        this.t++;
        if (this.follow) {
            const p = G.player, d = dist(p.x, p.y, this.x, this.y);
            if (d > 24) { const dx = p.x - this.x, dy = p.y - this.y; this.x += dx / d * 1.1; this.y += dy / d * 1.1; this.dir = dx < 0 ? LEFT : RIGHT; this.anim++; }
            return;
        }
        if (!this.route) return;
        if (this.wait > 0) { this.wait--; return; }
        const [gx, gy, w] = this.route[this.ri];
        const tx = gx * T + 8, ty = gy * T + 10, dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy);
        if (d < 1) { this.ri = (this.ri + 1) % this.route.length; this.wait = w || 60; return; }
        const sp = this.speed || 0.6;
        this.x += dx / d * Math.min(sp, d); this.y += dy / d * Math.min(sp, d);
        if (Math.abs(dx) > 0.3) this.dir = dx < 0 ? LEFT : RIGHT;
        this.anim++;
    }
    interact() { const f = CRITTER_TALK[this.who]; if (f) Script.run(f(this)); return true; }
    talkBox(p, f) { return Math.abs(f.tx * T + 8 - this.x) < 12 && Math.abs(f.ty * T + 8 - this.y) < 12; }
    draw(cx, cy) {
        const im = spr(this.look + '_' + (Math.floor(this.anim / 10) % 2));
        Gfx.alpha(0.2); Gfx.rect(this.x - cx - 4, this.y - cy + 1, 8, 2, PAL.ink); Gfx.alpha(1);
        if (im) Gfx.img(im, this.x - cx - 8, this.y - cy - 13, this.dir === LEFT);
    }
}
const CRITTER_TALK = {};
SPAWN.critter = (x, y, p) => new Critter(x, y, p);
SPAWN.npc = (x, y, p) => new NPC(x, y, p);
