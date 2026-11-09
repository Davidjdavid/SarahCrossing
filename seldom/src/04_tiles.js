/* tiles: the ground, drawn in code into 16x16 canvases (a few variants each, chosen by a hash of the spot) */
const TT = {};   /* char -> tile type */
function tileType(ch, o) { TT[ch] = Object.assign({ ch, solid: false, water: false, tall: false, variants: 4 }, o); }

function noiseTile(base, dots, seed, n) {
    const g = grid(16, 16);
    rect(g, 0, 0, 16, 16, base);
    for (let i = 0; i < 256; i++) {
        const x = i & 15, y = i >> 4, h = hash2(x, y, seed);
        for (const [c, p] of dots) if (h < p) { px(g, x, y, c); break; }
    }
    return g;
}
const TILE_DRAW = {
    '.'(v) { const g = noiseTile(P.green, [['#5bae4c', 0.12], ['#7fcf68', 0.16]], 11 + v); if (v === 1) { px(g, 4, 6, P.greenS); px(g, 5, 5, P.greenS); px(g, 6, 6, P.greenS); } if (v === 2) { px(g, 11, 10, P.greenS); px(g, 12, 9, P.greenS); px(g, 13, 10, P.greenS); } return g; },
    ','(v) { const g = TILE_DRAW['.'](v); const cs = [P.pink, P.yellow, P.white, P.sky]; for (let i = 0; i < 3; i++) { const x = 2 + Math.floor(hash2(v, i, 3) * 12), y = 2 + Math.floor(hash2(i, v, 4) * 12); px(g, x, y, cs[(v + i) % 4]); px(g, x, y + 1, P.greenS); } return g; },
    '"'(v) { const g = TILE_DRAW['.'](v); for (let i = 0; i < 5; i++) { const x = 1 + ((i * 3 + v * 5) % 14), y = 5 + ((i * 7 + v) % 9); line(g, x, y, x, y - 3, P.greenS); px(g, x + 1, y - 2, '#7fcf68'); } return g; },
    ':'(v) { return noiseTile('#d9b27c', [['#c49a63', 0.12], ['#e8c792', 0.1], ['#b3875a', 0.03]], 21 + v); },
    '='(v) { const g = grid(16, 16); rect(g, 0, 0, 16, 16, '#c9bfae'); for (let y = 0; y < 16; y += 4) { const o = (y / 4 + v) % 2 ? 4 : 0; for (let x = -4; x < 16; x += 8) { rect(g, x + o + 1, y + 1, 6, 2, '#ddd4c4'); px(g, x + o + 1, y + 1, '#ece5d8'); } rect(g, 0, y, 16, 1, '#a89e8d'); } return g; },
    's'(v) { return noiseTile('#f0dca0', [['#e3c988', 0.1], ['#fbeec0', 0.08], ['#d8b977', 0.02]], 31 + v); },
    '~'(v, f) { const g = grid(16, 16); rect(g, 0, 0, 16, 16, '#4f9fd8'); for (let i = 0; i < 3; i++) { const y = (i * 5 + f * 2 + v * 3) % 16, x = (i * 7 + v * 5 + f) % 12; rect(g, x, y, 4, 1, '#7cc0ec'); } if (hash2(v, f, 9) < 0.3) px(g, (v * 7 + f * 3) % 16, (v * 3 + f * 5) % 16, P.white); return g; },
    'd'(v, f) { const g = grid(16, 16); rect(g, 0, 0, 16, 16, '#3b7fc0'); for (let i = 0; i < 2; i++) { const y = (i * 8 + f * 2 + v * 3) % 16, x = (i * 7 + v * 5 + f) % 12; rect(g, x, y, 3, 1, '#5d9bd6'); } return g; },
    'b'(v) { const g = grid(16, 16); rect(g, 0, 0, 16, 16, '#b07a46'); for (let x = 0; x < 16; x += 4) { rect(g, x, 0, 1, 16, '#7c5230'); } rect(g, 0, 0, 16, 1, '#6b4128'); rect(g, 0, 15, 16, 1, '#6b4128'); return g; },
    'v'(v) { const g = grid(16, 16); rect(g, 0, 0, 16, 16, '#b07a46'); for (let y = 0; y < 16; y += 4) { rect(g, 0, y, 16, 1, '#7c5230'); } rect(g, 0, 0, 1, 16, '#6b4128'); rect(g, 15, 0, 1, 16, '#6b4128'); return g; },
    '#'(v) { const g = noiseTile('#8a7f74', [['#776c62', 0.15], ['#9b9086', 0.1]], 41 + v); for (let y = 3; y < 16; y += 5) rect(g, 0, y, 16, 1, '#6b6158'); for (let i = 0; i < 3; i++) { const y = 3 + i * 5; const x = (i * 6 + v * 3) % 16; rect(g, x, y - 4, 1, 4, '#6b6158'); } return g; },
    'w'(v) { const g = grid(16, 16); rect(g, 0, 0, 16, 16, '#a39a8c'); for (let y = 0; y < 16; y += 5) { const o = (y / 5) % 2 ? 4 : 0; rect(g, 0, y, 16, 1, '#6e665b'); for (let x = o; x < 16; x += 8) rect(g, x, y, 1, 5, '#6e665b'); } rect(g, 0, 0, 16, 2, '#c4bcaf'); return g; },
    'f'(v) { const g = TILE_DRAW['.'](v); rect(g, 0, 6, 16, 2, P.white); rect(g, 0, 11, 16, 2, P.white); rect(g, 2, 3, 2, 12, P.white); rect(g, 12, 3, 2, 12, P.white); rect(g, 0, 8, 16, 1, P.grey); rect(g, 0, 13, 16, 1, P.grey); return g; },
    'Y'(v) { const g = grid(16, 16); rect(g, 0, 0, 16, 16, '#8b5a34'); for (let y = 1; y < 16; y += 4) rect(g, 0, y, 16, 2, '#a8703f'); return g; },
    'R'(v) { const g = TILE_DRAW[':'](v); rect(g, 3, 0, 1, 16, P.greyS); rect(g, 12, 0, 1, 16, P.greyS); for (let y = 1; y < 16; y += 4) rect(g, 1, y, 14, 2, P.brownS); return g; },
    'm'(v) { return noiseTile('#5f8f5a', [['#4f7f6a', 0.2], ['#6fa36a', 0.1], ['#3f6f5f', 0.05]], 51 + v); },
    'g'(v) { const g = TILE_DRAW['S'](v); ell(g, 8, 6, 5, 4, P.grey); rect(g, 3, 6, 10, 8, P.grey); rect(g, 3, 13, 10, 2, P.greyS); line(g, 6, 7, 10, 7, P.greyS); line(g, 8, 5, 8, 10, P.greyS); return g; },
    'x'() { const g = grid(16, 16); rect(g, 0, 0, 16, 16, '#120c18'); return g; },
    'F'(v) { const g = grid(16, 16); rect(g, 0, 0, 16, 16, '#c08b55'); for (let y = 0; y < 16; y += 4) rect(g, 0, y, 16, 1, '#a0703f'); rect(g, (v % 2) ? 5 : 11, 0, 1, 4, '#a0703f'); return g; },
    'k'(v) { const g = grid(16, 16); rect(g, 0, 0, 16, 16, '#e8e0cf'); rect(g, 0, 0, 8, 8, '#cfc5b0'); rect(g, 8, 8, 8, 8, '#cfc5b0'); return g; },
    'K'(v) { const g = grid(16, 16); rect(g, 0, 0, 16, 16, '#d9c8a6'); rect(g, 0, 11, 16, 5, '#a58a62'); rect(g, 0, 11, 16, 1, '#7a6040'); for (let x = 2; x < 16; x += 6) rect(g, x, 1, 1, 9, '#cbb994'); return g; },
    'C'(v) { const g = grid(16, 16); rect(g, 0, 0, 16, 16, '#8a5a34'); rect(g, 0, 0, 16, 5, '#c08b55'); rect(g, 0, 5, 16, 1, '#5a3a22'); return g; },
    'r'(v) { const g = grid(16, 16); rect(g, 0, 0, 16, 16, '#b8434f'); rect(g, 1, 1, 14, 14, '#c9566a'); for (let x = 3; x < 14; x += 4) rect(g, x, 3, 2, 10, '#e07a86'); return g; },
    'G'(v) { const g = noiseTile('#3d7a4a', [['#336b40', 0.14], ['#4a8a55', 0.12]], 61 + v); return g; },  /* dark forest floor */
    'S'(v) { return noiseTile('#7d7591', [['#6c6582', 0.15], ['#8d86a0', 0.1]], 71 + v); },                /* hollow's grey grass */
    'p'(v) { return noiseTile('#a49a8e', [['#958b80', 0.15], ['#b3aa9e', 0.1]], 81 + v); },                /* quarry gravel */
    'c'(v) { const g = noiseTile('#6e665b', [['#5c574f', 0.2], ['#7d756a', 0.1]], 91 + v); rect(g, 0, 0, 2, 16, '#4a453f'); rect(g, 14, 0, 2, 16, '#4a453f'); return g; },   /* the chute: a stone gully */
};
tileType('.', {}); tileType(',', {}); tileType('"', {}); tileType(':', {}); tileType('=', {}); tileType('s', {});
tileType('~', { solid: true, water: true, frames: 4 }); tileType('d', { solid: true, water: true, frames: 4 });
tileType('b', {}); tileType('v', {});
tileType('#', { solid: true, cliff: true }); tileType('w', { solid: true }); tileType('f', { solid: true, fence: true, low: true });
tileType('Y', {}); tileType('R', {}); tileType('m', {}); tileType('g', { solid: true }); tileType('x', { solid: true, void: true });
tileType('F', {}); tileType('k', {}); tileType('K', { solid: true }); tileType('C', { solid: true }); tileType('r', {});
tileType('G', {}); tileType('S', {}); tileType('p', {}); tileType('c', { solid: true });
/* trees and bushes stand on grass and are drawn standing up (sorted with people) */
tileType('T', { solid: true, tree: 'oak', under: '.' }); tileType('t', { solid: true, tree: 'pine', under: '.' });
tileType('P', { solid: true, tree: 'pine', under: 'G' }); tileType('o', { solid: true, tree: 'bush', under: '.' });
tileType('q', { solid: true, tree: 'dead', under: 'S' }); tileType('O', { solid: true, tree: 'bush', under: 'p' }); tileType('a', { solid: true, tree: 'palm', under: 's' });

function tileCanvas(ch, v, f) {
    const t = TT[ch]; const base = t && t.under ? t.under : ch;
    const key = 'tile:' + base + ':' + v + ':' + (f || 0);
    return spr(key, () => toCanvas((TILE_DRAW[base] || TILE_DRAW['.'])(v, f || 0)));
}
/* the standing pictures: an oak's round crown, a pine, a bush */
function treeCanvas(kind, v) {
    return spr('tree:' + kind + ':' + v, () => {
        if (kind === 'oak') {
            const g = grid(28, 32);
            rect(g, 12, 20, 4, 10, P.brown); px(g, 11, 29, P.brown); px(g, 16, 29, P.brown); shade(g, P.brown, P.brownS, x => x > 14);
            const c1 = v % 2 ? '#4fae54' : '#57b45a';
            ell(g, 14, 12, 12, 10, P.greenS); ell(g, 13, 11, 11, 9, c1); ell(g, 9, 8, 5, 4, '#6fca66'); ell(g, 18, 14, 5, 4, '#3f9a4c');
            if (v === 3) { px(g, 8, 13, P.red); px(g, 19, 9, P.red); px(g, 14, 16, P.red); }
            return toCanvas(outline(g));
        }
        if (kind === 'pine') {
            const g = grid(22, 32);
            rect(g, 10, 24, 3, 7, P.brownS);
            for (let i = 0; i < 4; i++) { const y = 3 + i * 5, w = 3 + i * 2.2; for (let j = 0; j < 7; j++) rect(g, Math.round(11 - w * (j / 6)), y + j, Math.round(w * 2 * (j / 6)) + 1, 1, i % 2 ? '#2f7a4a' : '#358a52'); }
            shade(g, '#358a52', '#2a6a40', x => x > 12); shade(g, '#2f7a4a', '#245f3a', x => x > 12);
            return toCanvas(outline(g));
        }
        if (kind === 'dead') {
            const g = grid(22, 30);
            rect(g, 10, 12, 3, 17, '#6a5a6a'); line(g, 11, 14, 4, 6, '#6a5a6a'); line(g, 11, 12, 18, 4, '#6a5a6a'); line(g, 6, 8, 5, 3, '#6a5a6a'); line(g, 16, 6, 19, 8, '#6a5a6a');
            return toCanvas(outline(g));
        }
        if (kind === 'palm') {
            const g = grid(26, 32);
            for (let y = 10; y < 31; y++) rect(g, 12 + Math.round(Math.sin(y / 6) * 1.5), y, 3, 1, (y % 3) ? P.tan : P.tanS);
            for (const [dx, dy] of [[-10, 2], [10, 2], [-7, -3], [7, -3], [0, -5]]) line(g, 13, 9, 13 + dx, 9 + dy, P.green), line(g, 13, 10, 13 + dx, 10 + dy, P.greenS);
            return toCanvas(outline(g));
        }
        const g = grid(18, 16);
        ell(g, 9, 9, 8, 6, P.greenS); ell(g, 8, 8, 7, 5, '#5bb457'); ell(g, 6, 6, 3, 2, '#77cc6a');
        if (v === 1) { px(g, 5, 9, P.pink); px(g, 11, 7, P.pink); }
        return toCanvas(outline(g));
    });
}
