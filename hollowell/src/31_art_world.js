/* Painted art for the outdoors: trees, bushes, rocks, buildings, the Well, fences, and town things.
   Bigger pictures are painted in code (shapes shaded by light from the upper left, with a texture)
   and outlined automatically, so they sit with the pixel sprites. */

function paintSprite(w, h, fn, outline = true) {
    const c = Gfx.makeCanvas(w, h);
    if (HEADLESS) return c;
    const x = c.getContext('2d');
    fn(x, c);
    if (outline) outlineCanvas(c);
    return c;
}
/* fill a disc pixel by pixel with a colour chosen per pixel */
function discPx(x, cx, cy, r, colFn) {
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
        if (i * i + j * j > r * r + r * 0.6) continue;
        const col = colFn(cx + i, cy + j, i / r, j / r);
        if (col) { x.fillStyle = col; x.fillRect(cx + i, cy + j, 1, 1); }
    }
}

const ART = {};          /* name -> canvas */

function treeArt(name, pal, seed = 1, opts = {}) {
    const w = opts.w || 32, h = opts.h || 36;
    ART[name] = paintSprite(w, h, x => {
        const [lo, mid, hi, dark] = pal.leaf;
        /* trunk */
        const tx = w / 2;
        x.fillStyle = pal.bark[1]; x.fillRect(tx - 3, h - 12, 6, 12);
        x.fillStyle = pal.bark[0]; x.fillRect(tx - 3, h - 12, 2, 12);
        x.fillStyle = pal.bark[2]; x.fillRect(tx + 2, h - 12, 1, 12);
        x.fillStyle = pal.bark[2]; x.fillRect(tx - 1, h - 9, 1, 3); x.fillRect(tx + 1, h - 5, 1, 2);
        /* roots */
        x.fillStyle = pal.bark[1]; x.fillRect(tx - 5, h - 2, 3, 2); x.fillRect(tx + 2, h - 2, 3, 2);
        /* canopy: overlapping clumps */
        const clumps = opts.clumps || [[16, 13, 11], [9, 16, 7], [23, 16, 7], [12, 8, 7], [21, 8, 7], [16, 20, 8]];
        for (const [cx, cy, r] of clumps) {
            discPx(x, cx, cy, r, (px, py, u, v) => {
                const light = -u * 0.5 - v * 0.8 + (hash2(px, py, seed) - 0.5) * 0.7;
                if (light > 0.55) return hi;
                if (light > 0.05) return mid;
                if (light > -0.6) return lo;
                return dark;
            });
        }
        /* leaf texture: little dark notches */
        for (let n = 0; n < 40; n++) {
            const px = Math.floor(hash2(n, seed, 3) * w), py = Math.floor(hash2(seed, n, 5) * (h - 10));
            const d = x.getImageData(px, py, 1, 1).data;
            if (d[3] > 0) { x.fillStyle = dark; x.fillRect(px, py, 1, 1); x.fillStyle = hi; if (py > 0) x.fillRect(px, py - 1, 1, 1); }
        }
        if (pal.fruit) for (let n = 0; n < 5; n++) {
            const px = 6 + Math.floor(hash2(n, seed, 9) * (w - 12)), py = 5 + Math.floor(hash2(seed, n, 11) * 16);
            const d = x.getImageData(px, py, 1, 1).data;
            if (d[3] > 0) { x.fillStyle = pal.fruit; x.fillRect(px, py, 2, 2); x.fillStyle = '#ffffff'; x.fillRect(px, py, 1, 1); }
        }
    });
}

function pineArt(name, pal, seed = 1) {
    ART[name] = paintSprite(26, 40, x => {
        x.fillStyle = pal.bark[1]; x.fillRect(11, 32, 4, 8);
        x.fillStyle = pal.bark[0]; x.fillRect(11, 32, 1, 8);
        const tiers = [[13, 2, 4, 8], [13, 7, 7, 13], [13, 13, 9, 20], [13, 19, 11, 28], [13, 25, 12, 34]];
        for (const [cx, top, half, bot] of tiers) {
            for (let y = top; y <= bot; y++) {
                const k = (y - top) / (bot - top), hw = Math.round(half * k);
                for (let i = -hw; i <= hw; i++) {
                    const u = i / (hw || 1);
                    const l = -u * 0.6 + (1 - k) * 0.5 + (hash2(cx + i, y, seed) - 0.5) * 0.5;
                    x.fillStyle = l > 0.5 ? pal.leaf[2] : l > -0.1 ? pal.leaf[1] : l > -0.6 ? pal.leaf[0] : pal.leaf[3];
                    x.fillRect(cx + i, y, 1, 1);
                }
            }
        }
    });
}

function bushArt(name, pal, seed = 1, w = 16, h = 14) {
    ART[name] = paintSprite(w, h, x => {
        const clumps = [[w / 2, h / 2 + 1, 6], [w / 2 - 4, h / 2 + 2, 4], [w / 2 + 4, h / 2 + 2, 4], [w / 2 - 2, h / 2 - 2, 4], [w / 2 + 3, h / 2 - 2, 4]];
        for (const [cx, cy, r] of clumps) discPx(x, Math.round(cx), Math.round(cy), r, (px, py, u, v) => {
            const l = -u * 0.5 - v * 0.8 + (hash2(px, py, seed) - 0.5) * 0.8;
            return l > 0.55 ? pal[2] : l > 0 ? pal[1] : l > -0.6 ? pal[0] : pal[3];
        });
        if (pal[4]) for (let n = 0; n < 4; n++) { const px = 3 + Math.floor(hash2(n, seed, 1) * (w - 6)), py = 2 + Math.floor(hash2(seed, n, 2) * (h - 6)); x.fillStyle = pal[4]; x.fillRect(px, py, 2, 2); x.fillStyle = '#fff8e0'; x.fillRect(px, py, 1, 1); }
    });
}

function rockArt(name, pal, seed = 1, w = 16, h = 14) {
    ART[name] = paintSprite(w, h, x => {
        discPx(x, w / 2, h / 2 + 1, Math.min(w, h) / 2 - 1, (px, py, u, v) => {
            if (v < -0.75 && Math.abs(u) > 0.5) return null;
            const l = -u * 0.6 - v * 0.9 + (hash2(px, py, seed) - 0.5) * 0.4;
            return l > 0.6 ? pal[2] : l > 0 ? pal[1] : l > -0.6 ? pal[0] : pal[3];
        });
    });
}

/* buildings: a roof seen from above, a front wall with a door and windows, painted to a style */
const BSTYLE = {
    cottage: { roof: ['#c45a4a', '#9a3a3a', '#e07a64', '#6e2a2a'], wall: ['#f4e6c8', '#d8c49e'], timber: '#7a4e32', trim: '#5a3a26', door: '#8a5a3a', win: '#7ec8f0' },
    blue: { roof: ['#4a7ac4', '#2e5a98', '#6a9ae0', '#1e3a6a'], wall: ['#f0e8d4', '#d4c8ac'], timber: '#6b4128', trim: '#45281c', door: '#6b4128', win: '#bfe8fb' },
    green: { roof: ['#5aa05a', '#3a7a42', '#7cc070', '#245a2e'], wall: ['#f4e6c8', '#d8c49e'], timber: '#7a4e32', trim: '#5a3a26', door: '#9a6438', win: '#7ec8f0' },
    plum: { roof: ['#8a5aa0', '#6a3a80', '#aa7cc4', '#4a2a5a'], wall: ['#f0e4d8', '#d4c4b4'], timber: '#5a3a3a', trim: '#3e2828', door: '#7a4a4a', win: '#c8e8f8' },
    inn: { roof: ['#3fa8a0', '#2a7e78', '#6ad0c4', '#1e5a56'], wall: ['#f6ead0', '#dccaa4'], timber: '#6b4128', trim: '#45281c', door: '#9a3a4a', win: '#ffe8a0' },
    stone: { roof: ['#8a8070', '#6a6050', '#aaa090', '#4a4438'], wall: ['#c8bcac', '#a89c8c'], timber: '#6a6050', trim: '#4a4438', door: '#6b4128', win: '#7ec8f0' },
    ochre: { roof: ['#d98f3a', '#a8642a', '#f0b060', '#7a4420'], wall: ['#f4e6c8', '#d8c49e'], timber: '#7a4e32', trim: '#5a3a26', door: '#6b4128', win: '#7ec8f0' },
    school: { roof: ['#b0434a', '#8a2a32', '#d06a6a', '#5a1a22'], wall: ['#e8d8b8', '#cdb88c'], timber: '#6b4128', trim: '#45281c', door: '#3a5a8a', win: '#bfe8fb' },
};

function buildingArt(name, wT, hT, style, opts = {}) {
    const S = BSTYLE[style] || BSTYLE.cottage;
    const w = wT * T, wallH = opts.wallH || 22, h = hT * T + 6;
    const roofH = h - wallH;
    const doorX = opts.door !== undefined ? opts.door * T + 3 : Math.floor(w / 2 / T) * T + 3;
    ART[name] = paintSprite(w, h, x => {
        /* front wall */
        const wy = roofH;
        x.fillStyle = S.wall[0]; x.fillRect(1, wy, w - 2, wallH);
        for (let j = 0; j < wallH; j++) for (let i = 1; i < w - 1; i++) if (hash2(i, j, 7) < 0.08) { x.fillStyle = S.wall[1]; x.fillRect(i, wy + j, 1, 1); }
        /* timber frame */
        if (!opts.noTimber) {
            x.fillStyle = S.timber;
            x.fillRect(1, wy, w - 2, 2); x.fillRect(1, wy + wallH - 3, w - 2, 3);
            for (let i = 1; i < w; i += T) x.fillRect(i, wy, 2, wallH);
            x.fillRect(w - 3, wy, 2, wallH);
        }
        /* windows */
        const wins = opts.windows || [];
        for (const wx of wins) {
            const px0 = wx * T + 3;
            x.fillStyle = S.trim; x.fillRect(px0 - 1, wy + 4, 12, 11);
            x.fillStyle = S.win; x.fillRect(px0, wy + 5, 10, 9);
            x.fillStyle = shade(S.win, 0.5); x.fillRect(px0 + 1, wy + 6, 3, 3);
            x.fillStyle = S.trim; x.fillRect(px0 + 4, wy + 5, 1, 9); x.fillRect(px0, wy + 9, 10, 1);
            /* flower box */
            x.fillStyle = '#8a5a3a'; x.fillRect(px0 - 1, wy + 15, 12, 3);
            for (let i = 0; i < 5; i++) { x.fillStyle = ['#e8463c', '#f7d64a', '#f59ac0', '#fbf6ea', '#b48ce8'][(i + wx) % 5]; x.fillRect(px0 + i * 2, wy + 13, 2, 2); }
        }
        /* door */
        if (opts.door !== null) {
            x.fillStyle = S.trim; x.fillRect(doorX - 1, wy + 3, 12, wallH - 3);
            x.fillStyle = S.door; x.fillRect(doorX, wy + 4, 10, wallH - 4);
            x.fillStyle = shade(S.door, 0.2); x.fillRect(doorX + 1, wy + 5, 3, wallH - 7); x.fillRect(doorX + 6, wy + 5, 3, wallH - 7);
            x.fillStyle = '#f7d64a'; x.fillRect(doorX + 7, wy + 12, 1, 2);
            x.fillStyle = S.trim; x.fillRect(doorX, wy + 3, 10, 1);
        }
        /* roof: rows of shingles, the ridge on top, eaves overhanging the wall */
        const [r0, r1, r2, r3] = S.roof;
        for (let j = 0; j < roofH + 3; j++) {
            for (let i = 0; i < w; i++) {
                const row = Math.floor(j / 4), off = (row % 2) * 4;
                const edge = (i + off) % 8 === 0;
                let col = j < 3 ? r2 : r0;
                if (j % 4 === 3) col = r1;
                if (edge && j > 2) col = r1;
                if (hash2(i, j, 13) < 0.05) col = r2;
                if (j >= roofH) col = j === roofH + 2 ? r3 : r1;   /* eaves */
                if (i === 0 || i === w - 1) col = r3;
                x.fillStyle = col; x.fillRect(i, j, 1, 1);
            }
        }
        /* the ridge */
        x.fillStyle = r3; x.fillRect(0, 0, w, 1);
        x.fillStyle = r2; x.fillRect(1, 1, w - 2, 1);
        /* chimney */
        if (opts.chimney !== false) {
            const cx = opts.chimneyX !== undefined ? opts.chimneyX : w - 14;
            x.fillStyle = '#9a8a7a'; x.fillRect(cx, 2, 7, 9); x.fillStyle = '#7a6a5a'; x.fillRect(cx + 5, 2, 2, 9);
            x.fillStyle = '#5a4a3a'; x.fillRect(cx - 1, 1, 9, 2);
        }
        if (opts.sign) {
            const sx = opts.sign.x * T + 2;
            x.fillStyle = S.trim; x.fillRect(sx, wy - 1, 14, 9);
            x.fillStyle = opts.sign.col || '#f4e0a8'; x.fillRect(sx + 1, wy, 12, 7);
            x.fillStyle = S.trim; x.fillRect(sx + 3, wy + 2, 8, 1); x.fillRect(sx + 3, wy + 4, 6, 1);
            if (opts.sign.icon) opts.sign.icon(x, sx + 1, wy);
        }
    });
    return { h, roofH };
}

function initWorldArt() {
    const meadowLeaf = { leaf: ['#4fa84a', '#6fc65a', '#a0e078', '#2e7a43'], bark: ['#9a6438', '#6b4128', '#45281c'] };
    treeArt('tree', meadowLeaf, 1);
    treeArt('tree2', meadowLeaf, 7, { clumps: [[16, 14, 10], [8, 18, 7], [24, 17, 7], [11, 9, 7], [22, 9, 6], [16, 21, 8]] });
    treeArt('tree_apple', Object.assign({ fruit: '#e8463c' }, meadowLeaf), 4);
    treeArt('tree_autumn', { leaf: ['#d9832a', '#f0a840', '#f8d070', '#a85a20'], bark: meadowLeaf.bark }, 3);
    treeArt('tree_hush', { leaf: ['#3e7a6a', '#4f9a80', '#7ac4a0', '#245a4e'], bark: ['#7a6a8a', '#5a4a6a', '#3a2e4a'] }, 5);
    treeArt('tree_birch', { leaf: ['#9ac89a', '#b8dcb0', '#e0f0d8', '#6a9a72'], bark: ['#f4f4f0', '#d8dcd8', '#5a5a5a'] }, 6);
    pineArt('pine', { leaf: ['#2e7a5a', '#3f9a6a', '#6cc08a', '#1d4d3e'], bark: ['#7a4e32', '#5a3a26'] }, 2);
    bushArt('bush', ['#3f9a4a', '#5ab85a', '#8ad87a', '#2a6a36'], 1);
    bushArt('bush_berry', ['#3f9a4a', '#5ab85a', '#8ad87a', '#2a6a36', '#d03a5a'], 2);
    bushArt('hedge', ['#3a8a44', '#4fa84a', '#7cc864', '#235a30'], 3, 16, 16);
    rockArt('rock', ['#968878', '#b8aa98', '#d6cab6', '#6e6458'], 1);
    rockArt('rock_red', ['#93432c', '#c4623a', '#e08a5e', '#6a2e22'], 2);
    rockArt('boulder', ['#8a8070', '#a89c8c', '#c8bcac', '#5e564a'], 3, 16, 16);
    /* the stump with a stitched cross on it: a rest spot (sit to tie off your thread) */
    ART.stump = paintSprite(16, 14, x => {
        x.fillStyle = '#9a6438'; x.fillRect(2, 5, 12, 8); x.fillStyle = '#6b4128'; x.fillRect(2, 10, 12, 3);
        x.fillStyle = '#e6c08a'; x.fillRect(2, 2, 12, 5); x.fillStyle = '#c9925a';
        for (let i = 0; i < 3; i++) x.fillRect(4 + i, 3 + (i % 2), 6 - i * 2, 1);
        x.fillStyle = '#e8463c'; x.fillRect(6, 3, 1, 1); x.fillRect(9, 3, 1, 1); x.fillRect(7, 4, 2, 1); x.fillRect(6, 5, 1, 1); x.fillRect(9, 5, 1, 1);
    });
    /* the Well: stone ring, wooden posts, a red roof, a winch with its rope */
    ART.well = paintSprite(48, 50, x => {
        /* ring */
        for (let j = 0; j < 16; j++) for (let i = 0; i < 40; i++) {
            const c = (Math.floor(i / 6) + Math.floor(j / 4)) % 2 ? '#b8aa98' : '#a09280';
            x.fillStyle = j % 4 === 3 || (i + (Math.floor(j / 4) % 2) * 3) % 6 === 0 ? '#6e6458' : c;
            x.fillRect(4 + i, 32 + j, 1, 1);
        }
        x.fillStyle = '#d6cab6'; x.fillRect(4, 30, 40, 3);
        x.fillStyle = '#2a1f2d'; x.fillRect(8, 31, 32, 2);
        /* posts */
        x.fillStyle = '#7a4e32'; x.fillRect(7, 8, 4, 24); x.fillRect(37, 8, 4, 24);
        x.fillStyle = '#9a6438'; x.fillRect(7, 8, 2, 24); x.fillRect(37, 8, 2, 24);
        /* winch */
        x.fillStyle = '#c9925a'; x.fillRect(11, 15, 26, 4); x.fillStyle = '#e6c08a'; x.fillRect(11, 15, 26, 1);
        x.fillStyle = '#6b4128'; x.fillRect(41, 14, 3, 2); x.fillRect(43, 14, 1, 6);
        /* rope: wound on the winch and hanging down into the dark */
        for (let i = 13; i < 35; i += 2) { x.fillStyle = '#d8b880'; x.fillRect(i, 15, 1, 4); }
        x.fillStyle = '#e8463c'; x.fillRect(23, 19, 1, 13);
        /* roof */
        for (let j = 0; j < 10; j++) {
            const inset = Math.max(0, 9 - j) * 0.6;
            for (let i = Math.floor(inset); i < 48 - Math.floor(inset); i++) {
                x.fillStyle = j < 2 ? '#e07a64' : (i + j) % 6 === 0 ? '#9a3a3a' : j % 3 === 2 ? '#a84a40' : '#c45a4a';
                x.fillRect(i, j, 1, 1);
            }
        }
        x.fillStyle = '#6e2a2a'; x.fillRect(0, 9, 48, 1);
    });
    /* a wooden fence post and rails */
    ART.fence = paintSprite(16, 16, x => {
        x.fillStyle = '#c9925a'; x.fillRect(0, 5, 16, 3); x.fillRect(0, 10, 16, 3);
        x.fillStyle = '#e6c08a'; x.fillRect(0, 5, 16, 1); x.fillRect(0, 10, 16, 1);
        x.fillStyle = '#9a6438'; x.fillRect(6, 2, 4, 13); x.fillStyle = '#c9925a'; x.fillRect(6, 2, 2, 13);
    });
    ART.fence_v = paintSprite(16, 16, x => {
        x.fillStyle = '#9a6438'; x.fillRect(6, 0, 4, 16); x.fillStyle = '#c9925a'; x.fillRect(6, 0, 2, 16);
        x.fillStyle = '#6b4128'; x.fillRect(6, 7, 4, 2);
    });
    ART.lamp = paintSprite(10, 30, x => {
        x.fillStyle = '#4a4a5a'; x.fillRect(4, 8, 2, 20); x.fillRect(2, 27, 6, 3);
        x.fillStyle = '#2e2e3a'; x.fillRect(1, 1, 8, 2); x.fillRect(2, 3, 6, 6);
        x.fillStyle = '#ffe8a0'; x.fillRect(3, 4, 4, 4); x.fillStyle = '#fff8e0'; x.fillRect(3, 4, 2, 2);
    });
    ART.bench = paintSprite(32, 16, x => {
        x.fillStyle = '#9a6438'; x.fillRect(1, 2, 30, 3); x.fillStyle = '#c9925a'; x.fillRect(1, 2, 30, 1);
        x.fillStyle = '#c9925a'; x.fillRect(0, 7, 32, 4); x.fillStyle = '#e6c08a'; x.fillRect(0, 7, 32, 1);
        x.fillStyle = '#6b4128'; x.fillRect(3, 11, 3, 5); x.fillRect(26, 11, 3, 5); x.fillRect(3, 4, 2, 3); x.fillRect(27, 4, 2, 3);
    });
    ART.barrel = paintSprite(14, 16, x => {
        x.fillStyle = '#9a6438'; x.fillRect(1, 2, 12, 13); x.fillStyle = '#c9925a'; x.fillRect(2, 2, 4, 13);
        x.fillStyle = '#6b4128'; x.fillRect(1, 4, 12, 1); x.fillRect(1, 11, 12, 1); x.fillStyle = '#e6c08a'; x.fillRect(2, 1, 10, 2);
    });
    ART.flowerbed = paintSprite(16, 12, x => {
        x.fillStyle = '#7a4e32'; x.fillRect(0, 6, 16, 6); x.fillStyle = '#9a6438'; x.fillRect(0, 6, 16, 1);
        for (let i = 0; i < 6; i++) { x.fillStyle = '#4fa84a'; x.fillRect(1 + i * 2.6, 3, 2, 4); x.fillStyle = ['#e8463c', '#f7d64a', '#f59ac0'][i % 3]; x.fillRect(1 + i * 2.6, 1 + (i % 2), 3, 3); }
    });
    ART.haybale = paintSprite(16, 14, x => {
        x.fillStyle = '#e8c860'; x.fillRect(1, 2, 14, 11); x.fillStyle = '#f8e090'; x.fillRect(1, 2, 14, 3);
        x.fillStyle = '#b8942a'; for (let i = 2; i < 15; i += 3) x.fillRect(i, 5, 1, 7); x.fillStyle = '#9a6438'; x.fillRect(1, 7, 14, 1);
    });
    ART.stall = paintSprite(48, 36, x => {
        /* striped awning over a counter */
        for (let i = 0; i < 48; i++) for (let j = 0; j < 12; j++) { x.fillStyle = Math.floor(i / 6) % 2 ? '#fbf6ea' : '#e8463c'; x.fillRect(i, j + (i % 6 === 0 ? 0 : 0), 1, 1); }
        for (let i = 0; i < 48; i += 6) { x.fillStyle = Math.floor(i / 6) % 2 ? '#fbf6ea' : '#e8463c'; x.fillRect(i + 1, 12, 4, 2); }
        x.fillStyle = '#7a4e32'; x.fillRect(2, 12, 3, 22); x.fillRect(43, 12, 3, 22);
        x.fillStyle = '#c9925a'; x.fillRect(0, 24, 48, 10); x.fillStyle = '#e6c08a'; x.fillRect(0, 24, 48, 2);
        x.fillStyle = '#9a6438'; for (let i = 4; i < 48; i += 8) x.fillRect(i, 27, 1, 7);
    });
}

/* a building standing in the world: its picture, the tiles it blocks, and a door you walk into */
SPAWN.building = (tx, ty, p) => {
    if (p.art && !ART['f_' + p.art]) FACADES[p.art]();
    const name = p.art ? 'f_' + p.art : 'b_' + (p.style || 'cottage') + '_' + p.w + 'x' + p.h + '_' + (p.door !== undefined ? p.door : 'm') + '_' + (p.windows || []).join('.') + (p.sign ? 's' + p.sign.x : '') + (p.variant || '');
    if (!ART[name] && !p.art) buildingArt(name, p.w, p.h, p.style, p);
    const im = ART[name];
    const solid = [];
    const doorX = p.door !== undefined ? p.door : Math.floor(p.w / 2);
    for (let j = 0; j < p.h; j++) for (let i = 0; i < p.w; i++) if (!(j === p.h - 1 && i === doorX && p.door !== null)) solid.push([i, j]);
    const prop = new Prop(tx, ty, { im, solid, oy: -6, baseY: im.height });
    prop.isBuilding = true;
    return prop;
};
SPAWN.tree = (tx, ty, p) => {
    const im = ART[p.look || 'tree'];
    const pr = new Prop(tx, ty, { im, solid: p.deco ? [] : p.small ? [[0, 0]] : [[0, 1], [1, 1]], ox: 0, oy: -(im.height - 32), baseY: im.height - 2 });
    if (p.small) pr.solid = [[0, 0]];
    return pr;
};
SPAWN.deco = (tx, ty, p) => {
    const im = ART[p.look];
    const solid = p.solid === false ? [] : (p.solid || [[0, 0]]);
    /* drawn centred over the tiles it stands on (a bed two wide, a row of seats six wide), not over its first tile */
    const xs = solid.length ? solid.map(q => q[0]) : [0], x0 = Math.min(...xs) * T, fw = (Math.max(...xs) + 1) * T - x0;
    const pr = new Prop(tx, ty, { im, solid, ox: p.ox !== undefined ? p.ox : x0 + Math.round((fw - im.width) / 2), oy: p.oy !== undefined ? p.oy : 16 - im.height, flip: p.flip });
    pr.baseY = p.baseY !== undefined ? p.baseY : im.height;
    if (p.text) { pr.interact = () => { Script.run(function* () { yield* say(null, p.text); }); return true; }; pr.talkBox = (pl, f) => pr.solid.some(([dx, dy]) => tx + dx === f.tx && ty + dy === f.ty); }
    return pr;
};
