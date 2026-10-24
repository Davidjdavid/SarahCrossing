/* ---- 24b_civic.js ---- */
/* The town's civic buildings on the square: the Town Hall, the Post Office and the Bank. For now their doors are signs
   (the insides come next), and their pictures are simple stand-ins drawn here until the real art: a red-roofed post
   office with an envelope on its sign, a stone bank with columns and a gold coin, a blue-roofed town hall with a clock. */
const CIVIC_SIGNS = {
    townhall: 'TOWN HALL. Opening soon! Ginger is still building the inside. Somebody has already left a note in the suggestion box: "MORE FOUNTAINS."',
    postoffice: 'POST OFFICE. Opening soon! Until then your letters still come straight to your mailbox. The pelican on the sign looks very busy anyway.',
    bank: 'BANK OF THE ISLAND. Opening soon! Your bells are safe in your pocket for now. A card in the window says "WE WILL HAVE A VAULT. PROBABLY."',
};
ASSET_MAKERS.push(() => {
    const make = (name, w, h, ax, ay, draw) => {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const g = c.getContext('2d');
        draw((col, x, y, ww, hh) => { g.fillStyle = col; g.fillRect(x, y, ww, hh); });
        Assets.dyn[name] = { c, w, h, ax, ay };
    };
    const OUT = '#3b2a2a';
    /* a window: frame, glass, a cross bar and a glint */
    const win = (R, x, y, w, h) => { R(OUT, x - 1, y - 1, w + 2, h + 2); R('#7a5a3a', x, y, w, h); R('#9fd8ef', x + 1, y + 1, w - 2, h - 2); R('#7a5a3a', x + (w >> 1), y + 1, 1, h - 2); R('#7a5a3a', x + 1, y + (h >> 1), w - 2, 1); R('#e6f8ff', x + 2, y + 2, 2, 1); };
    /* rows of shingles on a roof band */
    const roof = (R, x, y, w, h, base, dark, light) => { R(OUT, x - 1, y - 1, w + 2, h + 2); R(base, x, y, w, h); for (let j = y + 3; j < y + h; j += 4) R(dark, x, j, w, 1); R(light, x, y, w, 1); R(dark, x, y + h - 2, w, 2); };
    make('postoffice', 80, 60, 40, 57, (R) => {
        R(OUT, 3, 25, 74, 33); R('#f4ead6', 4, 26, 72, 31); R('#e2d4ba', 4, 52, 72, 5);
        roof(R, 1, 10, 78, 17, '#cf4a3c', '#b33a2e', '#e8705f');
        R(OUT, 28, 12, 24, 13); R('#fbf6ea', 29, 13, 22, 11); R('#6b5a4a', 33, 15, 14, 8); R('#ffffff', 34, 16, 12, 6);
        for (let i = 0; i < 6; i++) { R('#6b5a4a', 34 + i, 16 + Math.floor(i / 2), 1, 1); R('#6b5a4a', 45 - i, 16 + Math.floor(i / 2), 1, 1); }
        win(R, 11, 33, 13, 10); win(R, 56, 33, 13, 10);
        R(OUT, 35, 41, 10, 16); R('#3d6fb6', 36, 42, 8, 15); R('#2a4c80', 36, 42, 8, 1); R('#2a4c80', 39, 43, 2, 13); R('#f2d16b', 42, 49, 1, 2);
        R(OUT, 49, 45, 6, 12); R('#d8433b', 50, 46, 4, 11); R('#f08070', 50, 46, 4, 1); R('#3b2a2a', 50, 48, 4, 1);
    });
    make('bank', 80, 60, 40, 57, (R) => {
        R(OUT, 3, 23, 74, 34); R('#e8e4dc', 4, 24, 72, 33);
        for (let y = 27; y < 52; y += 5) R('#d6d0c4', 4, y, 72, 1);
        roof(R, 1, 17, 78, 8, '#2f8f6b', '#226b50', '#4fb08a');
        for (let i = 0; i <= 26; i++) { const y = 17 - Math.round(i * 9 / 26); R(OUT, 14 + i, y - 1, 1, 18 - y); R(OUT, 66 - i, y - 1, 1, 18 - y); R('#f4f0e6', 14 + i, y, 1, 17 - y); R('#f4f0e6', 66 - i, y, 1, 17 - y); }
        R('#b8902e', 36, 9, 9, 9); R('#e9bd4f', 37, 10, 7, 7); R('#f7dc8a', 38, 11, 2, 2); R('#b8902e', 40, 12, 1, 3);
        for (const cx of [11, 24, 51, 64]) { R(OUT, cx - 1, 27, 7, 27); R('#ffffff', cx, 28, 5, 25); R('#d8d2c6', cx + 3, 28, 2, 25); R('#c9c2b4', cx - 1, 27, 7, 2); R('#c9c2b4', cx - 1, 51, 7, 2); }
        R(OUT, 33, 39, 14, 18); R('#6b4a2e', 34, 40, 12, 17); R('#4e3420', 39, 40, 2, 17); R('#e9bd4f', 37, 48, 1, 2); R('#e9bd4f', 42, 48, 1, 2);
        R('#cfc8bb', 28, 54, 24, 3); R('#b9b1a2', 28, 56, 24, 1);
    });
    make('townhall', 112, 84, 56, 81, (R) => {
        R(OUT, 5, 39, 102, 43); R('#f3ecdf', 6, 40, 100, 41); R('#e2d8c4', 6, 74, 100, 7);
        roof(R, 2, 26, 108, 15, '#4a63b5', '#384c90', '#6f86d6');
        R(OUT, 43, 7, 26, 34); R('#f3ecdf', 44, 8, 24, 33); R('#e2d8c4', 44, 36, 24, 5);
        for (let i = 0; i <= 13; i++) { R(OUT, 43 + i, 8 - Math.round(i * 7 / 13) - 1, 1, Math.round(i * 7 / 13) + 2); R(OUT, 69 - i, 8 - Math.round(i * 7 / 13) - 1, 1, Math.round(i * 7 / 13) + 2); R('#4a63b5', 44 + i, 8 - Math.round(i * 7 / 13), 1, Math.round(i * 7 / 13) + 1); R('#4a63b5', 68 - i, 8 - Math.round(i * 7 / 13), 1, Math.round(i * 7 / 13) + 1); }
        R(OUT, 49, 14, 14, 14); R('#384c90', 50, 15, 12, 12); R('#ffffff', 51, 16, 10, 10); R('#3b2a2a', 55, 17, 2, 5); R('#3b2a2a', 56, 21, 4, 1); R('#e9bd4f', 55, 21, 2, 2);
        for (const cx of [17, 30, 76, 89]) { R(OUT, cx - 1, 44, 8, 32); R('#ffffff', cx, 45, 6, 30); R('#d8d2c6', cx + 4, 45, 2, 30); R('#c9c2b4', cx - 1, 44, 8, 2); R('#c9c2b4', cx - 1, 73, 8, 2); }
        win(R, 8, 50, 7, 12); win(R, 41, 47, 8, 10); win(R, 63, 47, 8, 10); win(R, 97, 50, 7, 12);
        R(OUT, 49, 59, 14, 22); R('#6b4a2e', 50, 60, 12, 21); R('#4e3420', 55, 60, 2, 21); R('#e9bd4f', 53, 69, 1, 2); R('#e9bd4f', 58, 69, 1, 2);
        R('#e0559a', 37, 44, 4, 12); R('#e0559a', 71, 44, 4, 12); R('#f28fbf', 37, 44, 4, 2); R('#f28fbf', 71, 44, 4, 2);
        R('#d8d0c0', 40, 78, 32, 3); R('#c4bba8', 40, 80, 32, 1);
    });
});
