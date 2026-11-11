/* The player's things (Inv), the story's flags (Progress), what the Makers would write down (Stats),
   and the settings. All of it is what a save holds. */

const ITEMS = {
    gloves: { name: 'Gloves', kind: 'tool', desc: 'Hold [act] against a block to grip it: it stays put while you hold on. Step back to pull it. (Or tap [act] to take hold and again to let go: Options, Grip.)' },
    hook: { name: 'Hookline', kind: 'tool', desc: '[tool]: throw the hook. Catches on eyelets and empty marks and reels you over; reels light things to you.' },
    paddle: { name: 'Paddle', kind: 'tool', desc: 'Stand on anything that floats and paddle it about.' },
    bell: { name: 'Recall Bell', kind: 'tool', desc: '[tool]: ring it. Everything nearby out of place snaps straight home, shoving harder than it would on its own.' },
    bedroll: { name: 'Bedroll', kind: 'tool', desc: '[tool]: lay it down to make a place of your own. Hold [tool] to go home to it.' },
    crossbar: { name: 'Crossbar', kind: 'tool', desc: '[tool]: take up the strings of a puppet you can see, and walk it.' },
    needle: { name: 'Needle', kind: 'tool', desc: "[tool]: give a thing a new place. Up to three at a time." },
    shears: { name: 'Shears', kind: 'tool', desc: '[tool]: cut a thread. What is cut stays where it is.' },
    staff: { name: 'Wanderstaff', kind: 'gear', desc: '[atk]: swing it. Knocks light things aside, flips crystals.' },
    satchel: { name: 'Satchel', kind: 'gear', desc: "A Wanderer's bag." },
    key: { name: 'Small key', kind: 'key', desc: 'Opens a locked door in the House it came from.' },
    pattern: { name: 'Pattern', kind: 'key', desc: "The House's master pattern: the big lock is stitched to match it." },
    plan: { name: 'House plan', kind: 'key', desc: 'A plan of this House, every room.' },
    heartpatch: { name: 'Heart Patch', kind: 'collect', desc: 'Four make a heart.' },
    heartstitch: { name: 'Heartstitch', kind: 'collect', desc: 'One more heart.' },
    knot: { name: 'Knot', kind: 'quest', desc: 'A Knot from a House.' },
};
const TOOL_ORDER = ['gloves', 'hook', 'paddle', 'bell', 'bedroll', 'crossbar', 'needle', 'shears'];

const Inv = {
    reset() {
        this.hp = 6; this.maxHp = 6;       /* in half hearts */
        this.buttons = 0;
        this.tools = []; this.equipped = null;
        this.keyCount = {}; this.patterns = []; this.plans = [];
        this.knots = []; this.patches = 0; this.patchIds = [];
        this.items = {};                    /* quest things, notes, strays */
        this.bedroll = null;
        this.stitches = [];                 /* the Needle's stitches: [{ area, key, from, to, trace, stray }] (src/65_spool_kit.js) */                /* where the Bedroll lies: { area, tx, ty, lx, ly } (src/58_bedroll_kit.js) */
    },
    has(id) { return this.tools.includes(id) || !!this.items[id]; },
    keys(h) { return this.keyCount[h] || 0; },
    useKey(h) { this.keyCount[h] = Math.max(0, this.keys(h) - 1); },
    hasPattern(h) { return this.patterns.includes(h); },
    giveTool(id) { if (!this.tools.includes(id)) { this.tools.push(id); this.tools.sort((a, b) => TOOL_ORDER.indexOf(a) - TOOL_ORDER.indexOf(b)); } if (!this.equipped || ITEMS[id].kind === 'tool') this.equipped = id; },
    cycleTool(d) {
        if (!this.tools.length) return;
        const i = this.tools.indexOf(this.equipped);
        this.equipped = this.tools[(i + d + this.tools.length) % this.tools.length];
        Sfx.play('menu');
    },
    heal(n) { this.hp = Math.min(this.maxHp, this.hp + n); },
    addHeart() { this.maxHp += 2; this.hp = this.maxHp; },
    pickup(what, src) {
        switch (what) {
            case 'heart': this.heal(2); Sfx.play('heart'); break;
            case 'b1': this.buttons += 1; Sfx.play('button'); break;
            case 'b5': this.buttons += 5; Sfx.play('button'); break;
            case 'b20': this.buttons += 20; Sfx.play('button'); break;
            case 'key': {
                const h = G.map.def.house; this.keyCount[h] = this.keys(h) + 1; Sfx.play('smallitem');
                UI.toast('A small key.'); break;
            }
            case 'heartpatch': Script.run(Story.getItem('heartpatch', src && src.id)); break;
            default: Script.run(Story.getItem(what));
        }
    },
};

const Progress = {
    reset() { this.flags = {}; this.areaFlags = {}; this.notes = []; this.journal = []; this.goal = ''; },
    flag(n) { return !!this.flags[n]; },
    set(n, v = true) { this.flags[n] = v; },
    get(n) { return this.flags[n]; },
    areaFlag(a, n) { return !!(this.areaFlags[a] && this.areaFlags[a][n]); },
    setAreaFlag(a, n, v = true) { (this.areaFlags[a] = this.areaFlags[a] || {})[n] = v; },
    setGoal(s) { this.goal = s; },
    addNote(id) { if (!this.notes.includes(id)) this.notes.push(id); },
};

/* what happened in each room: the Makers' logbooks read this */
const Stats = {
    reset() {
        this.c = {};                 /* counters */
        this.rooms = {};             /* "area:room" -> { t: frames spent, visits, solvedAt, nudges } */
        this.playFrames = 0;
        this.cur = null;
        this.visited = {};           /* "area" -> Set of tiles seen (for the map), stored as strings */
    },
    count(n, d = 1) { this.c[n] = (this.c[n] || 0) + d; },
    enterRoom(area, room) {
        const k = area.id + ':' + room.i;
        this.cur = k;
        const r = this.rooms[k] = this.rooms[k] || { t: 0, visits: 0, nudges: 0 };
        r.visits++;
    },
    tick() {
        this.playFrames++;
        if (this.cur && this.rooms[this.cur]) this.rooms[this.cur].t++;
    },
    room(area, i) { return this.rooms[area + ':' + i] || { t: 0, visits: 0, nudges: 0 }; },
    stepped(area, tx, ty) {
        if (!area) return;
        const s = this.visited[area.id] = this.visited[area.id] || {};
        const k = (tx >> 2) + ',' + (ty >> 2);
        s[k] = 1;
    },
};

/* Where saves and settings are kept: the browser's own storage, and a copy in memory in case the browser won't keep
   anything (a private window); onSet/onRemove let a page that hosts the game keep a copy elsewhere too. */
const Store = {
    mem: {}, onSet: null, onRemove: null,
    get(k) {
        try { const v = localStorage.getItem(k); if (v !== null) return v; } catch { }
        return Object.prototype.hasOwnProperty.call(this.mem, k) ? this.mem[k] : null;
    },
    set(k, v, quiet) {
        this.mem[k] = v;
        let ok = false; try { localStorage.setItem(k, v); ok = true; } catch { }
        if (!quiet && this.onSet) { try { this.onSet(k, v); } catch { } }
        return ok;
    },
    remove(k, quiet) {
        delete this.mem[k];
        try { localStorage.removeItem(k); } catch { }
        if (!quiet && this.onRemove) { try { this.onRemove(k); } catch { } }
    },
};

const Settings = {
    textSpeed: 1, shake: true, hints: true, grip: 'hold',     /* grip: 'hold' (Action held) or 'toggle' (a tap on, a tap off) */
    load() {
        try { Object.assign(this, JSON.parse(Store.get('hollowell-settings') || '{}')); } catch { }
        /* the buttons as the player set them (the arrows and Escape always kept) */
        if (this.keys && typeof this.keys === 'object') Input.keymap = Object.assign({}, this.keys, typeof KEYS_FIXED !== 'undefined' ? KEYS_FIXED : {});
        if (this.pads && typeof this.pads === 'object') Input.padmap = Object.assign({}, typeof PAD_DEFAULT !== 'undefined' ? JSON.parse(JSON.stringify(PAD_DEFAULT)) : {}, this.pads);
        this.crt = this.crt | 0;
        if (this.grip !== 'toggle') this.grip = 'hold';
        Audio.vol.music = this.music !== undefined ? this.music : 0.6;
        Audio.vol.sfx = this.sfx !== undefined ? this.sfx : 0.8;
    },
    save() {
        this.music = Audio.vol.music; this.sfx = Audio.vol.sfx;
        Store.set('hollowell-settings', JSON.stringify({ textSpeed: this.textSpeed, shake: this.shake, hints: this.hints, music: this.music, sfx: this.sfx, keys: Input.keymap, pads: Input.padmap, crt: this.crt | 0, grip: this.grip }));
        Audio.setVolumes();
    },
};

G.cheats = {};
