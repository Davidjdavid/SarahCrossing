/* ---- 6zt_themed_furn.js ---- */
/* The newcomers' houses, themed (David, 27 October late): Captain Shrimpy's is a ship's cabin (a ship's wheel and a
   brass porthole on the wall, an anchor on a coil of rope, the old lighthouse keeper's sort of things), Muggy's
   remembers when everyone on the island was dishware (a teacup to sit in, a teapot lamp, a rack of plates on the wall,
   a china cabinet full of cups: "my old neighbors"). Their models are furn_i.py's; their pictures for the flat views are
   drawn here. Not sold anywhere: a friend's house is theirs. */
const THEMED_FURN = {
    ship_wheel: ["Ship's wheel", 1, 1, 'wall'], porthole: ['Porthole', 1, 1, 'wall'], anchor_deco: ['Anchor', 1, 1, 'floor'],
    teacup_chair: ['Teacup chair', 1, 1, 'floor'], teapot_lamp: ['Teapot lamp', 1, 1, 'floor'], plate_rack: ['Plate rack', 2, 1, 'wall'],
    china_cabinet: ['China cabinet', 2, 1, 'floor'],
};
for (const [id, [name, w, h, kind]] of Object.entries(THEMED_FURN)) {
    ITEMS[id] = { name, type: 'furniture', price: 0, icon: 'f_' + id };
    FURN[id] = { id, name, w, h, kind, price: 0, sets: ['themed'], light: id === 'teapot_lamp' ? 22 : undefined };
}
HOUSE_LAYOUT.scampi.items = ROOMS.h_scampi.layout = [
    ['porthole', 0, 'wall'], ['ship_wheel', 2, 'wall'], ['lh_map', 3, 'wall'], ['clock_wall', 5, 'wall'], ['porthole', 6, 'wall'],
    ['lh_trunk', 0, 0], ['lh_cot', 5, 0], ['lh_stove', 1, 0], ['table_wood', 2, 2], ['chair_wood', 4, 2], ['rug_round', 2, 3], ['anchor_deco', 6, 3], ['lamp_floor', 0, 4]];
HOUSE_LAYOUT.mug.items = ROOMS.h_mug.layout = [
    ['plate_rack', 1, 'wall'], ['clock_wall', 4, 'wall'], ['window_wall', 5, 'wall'],
    ['china_cabinet', 0, 0], ['bed_simple', 5, 0], ['cafe_table', 3, 2], ['coffee_maker', 3, 2], ['teacup_chair', 2, 2], ['teacup_chair', 4, 2], ['rug_round', 2, 3],
    ['teapot_lamp', 0, 4], ['plant_monstera', 6, 4]];

ASSET_MAKERS.push(() => {
    const make = (name, w, h, ax, ay, fn) => {
        if (Assets.frames[name] || Assets.dyn[name]) return;
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const g = c.getContext('2d');
        const R = (col, x, y, ww, hh) => { g.fillStyle = col; g.fillRect(x, y, ww, hh); };
        const disc = (col, cx, cy, r) => { for (let y = -r; y <= r; y++) { const dx = Math.round(Math.sqrt(Math.max(0, r * r - y * y))); R(col, cx - dx, cy + y, dx * 2 + 1, 1); } };
        fn(g, R, disc);
        Assets.dyn[name] = { c, w, h, ax, ay };
    };
    make('f_ship_wheel', 16, 16, 8, 15, (g, R, disc) => {
        for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; for (let t = 1; t <= 7; t++) R(t > 5 ? '#8a5a30' : '#a8743e', Math.round(8 + Math.cos(a) * t) - (t > 5 ? 1 : 0), Math.round(8 + Math.sin(a) * t) - (t > 5 ? 1 : 0), t > 5 ? 2 : 1, t > 5 ? 2 : 1); }
        for (let k = 0; k < 40; k++) { const a = k / 40 * Math.PI * 2; R('#a8743e', Math.round(8 + Math.cos(a) * 5), Math.round(8 + Math.sin(a) * 5), 1, 1); }
        disc('#d8a848', 8, 8, 1);
    });
    make('f_porthole', 16, 16, 8, 15, (g, R, disc) => { disc('#a87a2a', 8, 8, 7); disc('#d8a848', 8, 8, 6); disc('#3a7aaa', 8, 8, 4); R('#9ad4f0', 5, 6, 3, 2); R('#e8f6fc', 6, 5, 1, 1); });
    make('f_anchor_deco', 16, 28, 8, 27, (g, R, disc) => {
        for (let k = 0; k < 4; k++) R(k % 2 ? '#b89868' : '#c8a878', 2 + k, 26 - k * 2, 12 - k * 2, 2);
        R('#4a4c52', 7, 6, 2, 16); R('#4a4c52', 4, 8, 8, 2); R('#4a4c52', 6, 3, 4, 1); R('#4a4c52', 6, 3, 1, 3); R('#4a4c52', 9, 3, 1, 3);
        R('#4a4c52', 3, 18, 2, 3); R('#4a4c52', 11, 18, 2, 3); R('#4a4c52', 4, 20, 8, 2); R('#6a6c72', 2, 17, 2, 2); R('#6a6c72', 12, 17, 2, 2);
    });
    make('f_teacup_chair', 16, 28, 8, 27, (g, R, disc) => {
        R('#e8e2d8', 1, 25, 14, 2); R('#f8f4ec', 2, 24, 12, 1);
        R('#f8f4ec', 2, 13, 11, 10); R('#f08aa8', 2, 15, 11, 2); R('#d8a848', 2, 12, 11, 1); R('#f4a8c0', 3, 13, 9, 2);
        R('#f8f4ec', 13, 15, 2, 1); R('#f8f4ec', 14, 16, 1, 3); R('#f8f4ec', 13, 19, 2, 1); R('#e0dad0', 3, 22, 9, 1);
    });
    make('f_teapot_lamp', 16, 28, 8, 27, (g, R, disc) => {
        disc('#f8f4ec', 8, 20, 5); R('#3a6ab8', 3, 19, 11, 2); R('#e0dad0', 4, 25, 8, 1);
        R('#f8f4ec', 13, 16, 1, 3); R('#f8f4ec', 14, 15, 1, 2); R('#3a6ab8', 2, 18, 1, 4); R('#3a6ab8', 1, 19, 1, 2);
        R('#ffe2a0', 6, 13, 4, 2); R('#fff2c8', 7, 11, 2, 2);
    });
    make('f_plate_rack', 32, 16, 16, 15, (g, R, disc) => {
        R('#a8743e', 1, 1, 30, 13); R('#c08a52', 1, 6, 30, 1); R('#c08a52', 1, 12, 30, 1);
        const cols = ['#f8f4ec', '#bcd8f0', '#f8f4ec', '#f4c8d4', '#f8f4ec', '#d8ecc4'];
        for (let k = 0; k < 6; k++) { disc(cols[k], 4 + k * 5, 4, 2); disc(cols[(k + 1) % 6], 4 + k * 5, 10, 2); }
    });
    make('f_china_cabinet', 32, 28, 16, 27, (g, R, disc) => {
        R('#a8743e', 3, 25, 2, 3); R('#a8743e', 27, 25, 2, 3); R('#f0e6d4', 2, 2, 28, 24); R('#e4d6c0', 3, 19, 26, 5);
        R('#d8eef4', 4, 4, 11, 14); R('#d8eef4', 17, 4, 11, 14); R('#d8c8b0', 15, 4, 2, 14); R('#e4d6c0', 4, 9, 24, 1); R('#e4d6c0', 4, 14, 24, 1);
        const cols = ['#bcd8f0', '#f4c8d4', '#d8ecc4', '#f8e0a0'];
        for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) R(cols[(k + r) % 4], 5 + k * 4 + (k > 2 ? 2 : 0), 6 + r * 5, 2, 2);
        R('#f0e6d4', 3, 0, 26, 2); R('#d8a848', 14, 11, 1, 1); R('#d8a848', 17, 11, 1, 1);
    });
});
