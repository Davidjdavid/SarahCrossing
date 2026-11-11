/* Tools Wren finds in the Houses. Gloves work through the action button (11_player.js); the rest are used
   with C. Each tool: use(p) on press, hold(p) while held, busy(p) while it keeps Wren still. */

const TOOLS = {};
const Tools = {
    use(p) {
        const id = Inv.equipped; if (!id) return;
        const t = TOOLS[id];
        if (t && t.use) { t.use(p); Stats.count('tool:' + id); }
        else if (id === 'gloves') UI.toast(gripWord() + ' [act] against something to grip it.');
    },
    hold(p) { const t = TOOLS[Inv.equipped]; if (t && t.hold) t.hold(p); },
    unhold(p) { for (const k in TOOLS) if (TOOLS[k].unhold) TOOLS[k].unhold(p); },
    busy(p) { const t = TOOLS[Inv.equipped]; return t && t.busy ? t.busy(p) : false; },
    update(area) { for (const k in TOOLS) if (TOOLS[k].update) TOOLS[k].update(area); },
    draw(cx, cy) { for (const k in TOOLS) if (TOOLS[k].draw) TOOLS[k].draw(cx, cy); },
};
/* the Gloves work through Action, not as a tool; but with the grip on toggle (Options), a hold stays on with no button
   down, so her two gloved hands show on the thing while it does (and plainly go when a knock lets go) */
TOOLS.gloves = {
    draw(cx, cy) {
        const p = G.player, o = p && p.grip;
        if (!o || o.removed || !o.isGrid || Settings.grip !== 'toggle') return;
        const x = o.px - cx, y = o.py - cy, d = p.dir;
        const at = d === UP ? [[3, 13], [10, 13]] : d === DOWN ? [[3, 1], [10, 1]] : d === LEFT ? [[13, 4], [13, 10]] : [[0, 4], [0, 10]];
        for (const [u, v] of at) { Gfx.rect(x + u - 1, y + v - 1, 5, 4, PAL.ink); Gfx.rect(x + u, y + v, 3, 2, '#e8c08a'); }
    },
};

/* tool icons (16x16) */
function initToolIcons() {
    defSprite('icon_gloves', ['................', '................', '...kk.kk........', '..kyykyyk.......', '..kyykyykkk.....', '..kyykyykyyk....', '..kyyyyyykyk....', '..kyyyyyyyyk....',
        '..kYyyyyyyyk....', '...kYyyyyyk.....', '...krrrrrrk.....', '...kRRRRRRk.....', '....kkkkkk......', '................', '................', '................'],
        { y: '#e8c08a', Y: '#c09060' });
    defSprite('icon_hook', ['................', '..........kkk...', '.........kwwwk..', '.........kk.kk..', '..........k.kk..', '.........kk.k...', '........kk......', '.......kk.......',
        '......kbk.......', '.....kbk........', '....kbk.........', '...kbbk.........', '..kbbk..........', '..kkk...........', '................', '................'],
        { w: '#dfe6ef', b: '#c9925a' });
    defSprite('icon_bell', ['................', '.......kk.......', '......kyyk......', '.....kyyyyk.....', '....kyywyyyk....', '....kyywyyyk....', '....kyyyyyyk....', '...kyyyyyyyyk...',
        '...kyyyyyyyyk...', '..kYYYYYYYYYYk..', '..kkkkkkkkkkkk..', '.......kk.......', '......kYYk......', '.......kk.......', '................', '................'],
        { y: '#f0c850', Y: '#b88a2a', w: '#fff4c0' });
    defSprite('icon_bedroll', ['................', '................', '................', '...kkkkkkkkkk...', '..kmmmmmmmmmmk..', '..kmMmMmMmMmmk..', '..kmmmmmmmmmmk..', '..kkkkkkkkkkkk..',
        '..kwwwkmmmmmmk..', '..kwwwkmMmMmmk..', '..kwwwkmmmmmmk..', '..kkkkkkkkkkkk..', '................', '................', '................', '................'],
        { m: '#b48ce8', M: '#7d5bc4', w: '#fbf6ea' });
    defSprite('icon_paddle', ['................', '...........kk...', '..........kbk...', '.........kbk....', '........kbk.....', '.......kbk......', '......kbk.......', '.....kuuk.......',
        '....kuuuuk......', '...kuuuuuk......', '...kuuuuk.......', '...kuuuk........', '....kkk.........', '................', '................', '................'],
        { b: '#9a6438', u: '#e6c08a' });
    defSprite('icon_crossbar', ['................', '..kkkkkkkkkkkk..', '..kbbbbbbbbbbk..', '..kkkkkbkkkkkk..', '..k...kbk...k...', '..k...kbk...k...', '..k....k....k...', '..k....k....k...',
        '..k....k....k...', '.krk..krk..krk..', '.krk..krk..krk..', '..k....k....k...', '................', '................', '................', '................'],
        { b: '#c9925a', r: '#d6304e' });
    defSprite('icon_needle', ['................', '............kk..', '...........kwk..', '..........kwk...', '.........kgk....', '........kgk.....', '.......kgk......', '......kgk.......',
        '.....kgk........', '....kgk.........', '...kgk.rr.......', '..kwk.r..r......', '..kk...rr.r.....', '..........r.....', '................', '................'],
        { w: '#ffffff', g: '#aab7c8', r: '#e8463c' });
    defSprite('icon_shears', ['................', '..kk.......kk...', '.kwwk.....kwwk..', '..kwwk...kwwk...', '...kwwk.kwwk....', '....kwwkwwk.....', '.....kwwwk......', '......kyk.......',
        '.....kkykk......', '....krrkrrk.....', '...kr.kk..rk....', '...kr.k...rk....', '....krk..rk.....', '.....k....k.....', '................', '................'],
        { w: '#dfe6ef', y: '#f7d64a', r: '#c42b4a' });
}
