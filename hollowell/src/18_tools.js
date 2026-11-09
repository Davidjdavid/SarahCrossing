/* Tools Wren finds in the Houses. Gloves work through the action button (11_player.js); the rest are used
   with C. Each tool: use(p) on press, hold(p) while held, busy(p) while it keeps Wren still. */

const TOOLS = {};
const Tools = {
    use(p) {
        const id = Inv.equipped; if (!id) return;
        const t = TOOLS[id];
        if (t && t.use) { t.use(p); Stats.count('tool:' + id); }
        else if (id === 'gloves') UI.toast('Hold Z against something to grip it.');
    },
    hold(p) { const t = TOOLS[Inv.equipped]; if (t && t.hold) t.hold(p); },
    unhold(p) { for (const k in TOOLS) if (TOOLS[k].unhold) TOOLS[k].unhold(p); },
    busy(p) { const t = TOOLS[Inv.equipped]; return t && t.busy ? t.busy(p) : false; },
    update(area) { for (const k in TOOLS) if (TOOLS[k].update) TOOLS[k].update(area); },
    draw(cx, cy) { for (const k in TOOLS) if (TOOLS[k].draw) TOOLS[k].draw(cx, cy); },
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
