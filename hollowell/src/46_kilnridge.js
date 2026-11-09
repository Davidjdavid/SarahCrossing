/* Kilnridge (overworld block 0,2): red clay canyons west of Meadowfold. The Kiln is cut into the big mesa;
   the potters' camp sits in the basin; a switchback climbs the hawk's mesa; crocks wander. The canyon
   road comes in from Meadowfold on the east. */

const KILNRIDGE_ROWS = [
    '%###############################################################',
    '%###############################################################',
    '%###############################################################',
    '%##.fffffff....,,,...................,....,.....,............###',
    '%##......,.,#####################....".,.,,...,..............###',
    '%##.........##."........"......##......,.,....#############..###',
    '%##.".,..,,.##..YYY.......,.,..##...,...."....##.........##..###',
    '%##.....,.,.##..YYY"...........##...."..,.....##.........##..###',
    '%##,.".,....##..YYY.......,....#HH..,...r.....##.........##..###',
    '%##........,##"................#HH.,..........##......^..##,.###',
    '%##"###H###.##................"##.............##.........##..###',
    '%##.......".##............".,..##...,.........##.........##..###',
    '%##vvvvvvv..#####################.......,,....##.........##..###',
    '%##.....,"..##########:##########.....",......##.........##".###',
    '%##...,...."...,......:,...,........"...".....##H##########..###',
    '%##.....^^.....,....,.:....."."...............##H##########".###',
    '%##.....^......"......:.......,......,......:::H..,..........###',
    '%##............,".....:..........,..r...."..:,..."..,........###',
    '%##..........,........:.....................:......."......,.###',
    '%##"..................:.....................:..,.............###',
    '%##...r...............:.....,..,.,..............".".,........###',
    '%##....."...........,.:....................,.,...............###',
    '%##........,.......,,.:................,.................#######',
    '%##.,...,........"....::::::::::::::::::::::::::::::::::::::::::',
    '%##"....,..,,.................:..............,.,......,..#######',
    '%##.....,"....r.....,.....,...:...",..............".,........###',
    '%##.......,........"......,...:.,...^^............"..........###',
    '%##..^^.........,.............:.,...^....,......"..."...,....###',
    '%##....,........,.....,..,....:...."..............."..,.,.,..###',
    '%##.,.,.......,,.."...........:.....,...;;;;;;;;;;;;;,.......###',
    '%########r.................r..:.........;;;;;;;;;;;;;...,.r..###',
    '%##..............,............:::::::::.;;;;;;;;;;;;;........###',
    '%########......^^.,.............,...,...;;;;;;;;;;;;;........###',
    '%##...........".^..,"....".,.".......,..;;;;;;;;;;;;;........###',
    '%##...".".............."..,....................,...........,.###',
    '%##..........,..,..........,...............................,.###',
    '%##..................."...........,........,."....^..........###',
    '%###############################################################',
    '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
    '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
];

defBlock({
    id: 'kilnridge', bx: 0, by: 2, name: 'Kilnridge', theme: 'kiln', music: 'kiln',
    rows: KILNRIDGE_ROWS,
    forest: ['tree_autumn'],
    legend: {},
    ents: [
        { k: 'deco', x: 20, y: 11, look: 'kilnfacade', solid: [], ox: 0, oy: -14, baseY: 34 },
        { k: 'warp', x: 22, y: 13, to: 'kiln', tx2: 29, ty2: 42, face: 'up', dir: 'up' },
        { k: 'rest', x: 25, y: 15 },
        { k: 'sign', x: 24, y: 16, text: 'THE KILN. Open to Wanderers. Mind the pots: they mind you.' },
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
        { k: 'crock', x: 30, y: 20 }, { k: 'crock', x: 12, y: 26 }, { k: 'crock', x: 36, y: 35 }, { k: 'crock', x: 52, y: 20 }, { k: 'crock', x: 6, y: 6 },
        { k: 'pickup', x: 15, y: 7, what: 'b20', id: 'mesaButtons' },
    ],
    onEnter: (a, o) => { },
    tick: a => {
        const p = G.player;
        if (p && !Progress.flag('kilnPass') && p.x < 64 * T) Progress.set('kilnPass');
    },
});

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
