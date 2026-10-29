/* ---- 41c_phone_icons.js ---- */
/* The phone's app icons (David, 29 October: "redo the phone icons too, they're not great quality"): drawn as shapes at
   the screen's own resolution so they stay crisp at any size, like stickers: cream and colored pieces with a soft outline
   in a deeper shade of the app's tile. Each is drawn on a 100 x 100 square. */
function phoneInk(col) {
    const c = parseInt(col.slice(1), 16), mix = (v, t) => Math.round(v * 0.32 + t * 0.68);
    return `rgb(${mix(c >> 16, 70)},${mix((c >> 8) & 255, 48)},${mix(c & 255, 40)})`;
}
const PHONE_PAPER = '#fffaf2';
/* a shape filled and outlined (path drawn by fn); `w` the outline's width */
function piShape(g, I, fn, fill, w) {
    g.beginPath(); fn(); if (fill) { g.fillStyle = fill; g.fill(); }
    g.lineWidth = w || 6; g.strokeStyle = I.ink; g.stroke();
}
/* a cluster of round pieces with one outline round the lot (outlines first, fills over them) */
function piBlob(g, I, circles, fill) {
    g.fillStyle = I.ink;
    for (const [x, y, r] of circles) { g.beginPath(); g.arc(x, y, r + 3, 0, 7); g.fill(); }
    g.fillStyle = fill;
    for (const [x, y, r] of circles) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
}
function piRR(g, x, y, w, h, r) {
    g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function piHeart(g, x, y, s, col) {
    g.beginPath(); g.moveTo(x, y + s * 0.9);
    g.bezierCurveTo(x - s * 1.4, y, x - s * 0.7, y - s * 1.1, x, y - s * 0.35);
    g.bezierCurveTo(x + s * 0.7, y - s * 1.1, x + s * 1.4, y, x, y + s * 0.9);
    g.fillStyle = col; g.fill();
}
const PHONE_ICONS = {
    map(g, I) {
        piShape(g, I, () => { g.moveTo(12, 26); g.lineTo(37, 17); g.lineTo(63, 26); g.lineTo(88, 17); g.lineTo(88, 74); g.lineTo(63, 83); g.lineTo(37, 74); g.lineTo(12, 83); g.closePath(); }, PHONE_PAPER);
        g.fillStyle = '#bfe3a0'; g.beginPath(); g.ellipse(26, 56, 8, 11, 0.3, 0, 7); g.fill(); g.beginPath(); g.ellipse(76, 62, 6, 8, -0.2, 0, 7); g.fill();
        g.lineWidth = 4; g.strokeStyle = I.ink; g.beginPath(); g.moveTo(37, 18); g.lineTo(37, 73); g.moveTo(63, 27); g.lineTo(63, 82); g.stroke();
        piShape(g, I, () => { g.arc(52, 40, 11, Math.PI * 0.8, Math.PI * 0.2); g.lineTo(52, 63); g.closePath(); }, '#ef6461', 5);
        g.fillStyle = PHONE_PAPER; g.beginPath(); g.arc(52, 40, 4, 0, 7); g.fill();
    },
    tasks(g, I) {
        piShape(g, I, () => piRR(g, 22, 18, 56, 68, 9), PHONE_PAPER);
        piShape(g, I, () => piRR(g, 37, 11, 26, 14, 5), '#f2b25c', 5);
        for (let i = 0; i < 3; i++) {
            const y = 39 + i * 15;
            g.lineWidth = 4; g.strokeStyle = I.ink; g.beginPath(); piRR(g, 31, y - 5, 10, 10, 2.5); g.stroke();
            g.lineWidth = 5; g.beginPath(); g.moveTo(48, y); g.lineTo(68, y); g.stroke();
            if (i < 2) { g.strokeStyle = '#4fa25a'; g.lineWidth = 5; g.beginPath(); g.moveTo(31, y - 1); g.lineTo(36, y + 4); g.lineTo(45, y - 8); g.stroke(); }
        }
    },
    texts(g, I) {
        piShape(g, I, () => { piRR(g, 34, 14, 54, 38, 16); }, '#9fdc8e');
        piShape(g, I, () => { g.moveTo(26, 38); g.arcTo(66, 38, 66, 74, 16); g.arcTo(66, 74, 14, 74, 16); g.lineTo(24, 74); g.lineTo(14, 86); g.lineTo(16, 72); g.arcTo(10, 38, 26, 38, 16); g.closePath(); }, PHONE_PAPER);
        g.fillStyle = I.ink;
        for (const x of [26, 38, 50]) { g.beginPath(); g.arc(x, 56, 4, 0, 7); g.fill(); }
    },
    mail(g, I) {
        piShape(g, I, () => piRR(g, 12, 26, 76, 52, 9), PHONE_PAPER);
        g.lineWidth = 5; g.strokeStyle = I.ink; g.beginPath(); g.moveTo(16, 31); g.lineTo(50, 57); g.lineTo(84, 31); g.stroke();
        piHeart(g, 50, 58, 9, '#ef6461');
    },
    friends(g, I) {
        piShape(g, I, () => { g.arc(66, 90, 24, Math.PI, 0); g.closePath(); }, '#ffc7d6');
        piShape(g, I, () => g.arc(66, 42, 15, 0, 7), '#ffc7d6');
        piShape(g, I, () => { g.arc(38, 94, 27, Math.PI, 0); g.closePath(); }, PHONE_PAPER);
        piShape(g, I, () => g.arc(38, 46, 18, 0, 7), PHONE_PAPER);
        g.fillStyle = I.ink;
        g.beginPath(); g.arc(32, 44, 2.6, 0, 7); g.arc(44, 44, 2.6, 0, 7); g.fill();
        g.lineWidth = 3.5; g.strokeStyle = I.ink; g.beginPath(); g.arc(38, 49, 5.5, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
        piHeart(g, 80, 22, 7, '#ef6461');
    },
    recipes(g, I) {
        g.lineWidth = 5; g.strokeStyle = I.ink;
        for (const x of [36, 50, 64]) { g.beginPath(); g.moveTo(x, 34); g.bezierCurveTo(x - 7, 27, x + 7, 21, x, 13); g.stroke(); }
        piShape(g, I, () => piRR(g, 8, 50, 16, 9, 4), '#f0a35e', 5);
        piShape(g, I, () => piRR(g, 76, 50, 16, 9, 4), '#f0a35e', 5);
        piShape(g, I, () => { g.moveTo(18, 44); g.lineTo(82, 44); g.lineTo(78, 76); g.quadraticCurveTo(76, 86, 64, 86); g.lineTo(36, 86); g.quadraticCurveTo(24, 86, 22, 76); g.closePath(); }, '#f0a35e');
        piShape(g, I, () => piRR(g, 14, 38, 72, 9, 4.5), PHONE_PAPER, 5);
    },
    collection(g, I) {
        piShape(g, I, () => { g.moveTo(50, 28); g.quadraticCurveTo(32, 18, 10, 24); g.lineTo(10, 78); g.quadraticCurveTo(32, 72, 50, 82); g.closePath(); }, PHONE_PAPER);
        piShape(g, I, () => { g.moveTo(50, 28); g.quadraticCurveTo(68, 18, 90, 24); g.lineTo(90, 78); g.quadraticCurveTo(68, 72, 50, 82); g.closePath(); }, PHONE_PAPER);
        piShape(g, I, () => { g.moveTo(64, 22); g.lineTo(64, 50); g.lineTo(70, 44); g.lineTo(76, 50); g.lineTo(76, 21); }, '#ef6461', 4);
        // (a star, and a fish on the pages)
        g.fillStyle = '#f5c13d'; g.beginPath();
        for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 4.5 : 10; g.lineTo(30 + Math.cos(a) * r, 44 + Math.sin(a) * r); }
        g.fill();
        g.fillStyle = '#7cc0e6'; g.beginPath(); g.ellipse(66, 64, 8, 5, 0, 0, 7); g.moveTo(73, 64); g.lineTo(80, 59); g.lineTo(80, 69); g.fill();
    },
    wardrobe(g, I) {
        piShape(g, I, () => {
            g.moveTo(36, 16); g.lineTo(20, 22); g.lineTo(8, 40); g.lineTo(21, 50); g.lineTo(28, 43); g.lineTo(28, 86); g.lineTo(72, 86); g.lineTo(72, 43);
            g.lineTo(79, 50); g.lineTo(92, 40); g.lineTo(80, 22); g.lineTo(64, 16); g.quadraticCurveTo(50, 30, 36, 16); g.closePath();
        }, '#f48fa8');
        g.save(); g.beginPath(); g.rect(28, 54, 44, 10); g.clip(); g.fillStyle = PHONE_PAPER; g.fillRect(20, 54, 60, 10); g.restore();
        piHeart(g, 60, 38, 6, PHONE_PAPER);
    },
    moves(g, I) {
        piShape(g, I, () => g.arc(46, 54, 32, 0, 7), '#ffd65c');
        g.lineWidth = 5; g.strokeStyle = I.ink;
        g.beginPath(); g.arc(35, 50, 6, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
        g.beginPath(); g.arc(57, 50, 6, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
        piShape(g, I, () => { g.moveTo(32, 62); g.quadraticCurveTo(46, 80, 60, 62); g.closePath(); }, '#ef6461', 4);
        g.fillStyle = '#ffb3c4'; g.beginPath(); g.ellipse(27, 62, 5, 3.5, 0, 0, 7); g.ellipse(65, 62, 5, 3.5, 0, 0, 7); g.fill();
        piShape(g, I, () => { for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + i * Math.PI / 4, r = i % 2 ? 4 : 12; g.lineTo(82 + Math.cos(a) * r, 20 + Math.sin(a) * r); } g.closePath(); }, PHONE_PAPER, 4);
    },
    camera(g, I) {
        piShape(g, I, () => piRR(g, 28, 22, 24, 16, 5), PHONE_PAPER, 5);
        piShape(g, I, () => piRR(g, 10, 32, 80, 50, 13), PHONE_PAPER);
        piShape(g, I, () => g.arc(50, 57, 18, 0, 7), '#86bde8');
        g.fillStyle = '#3f6690'; g.beginPath(); g.arc(50, 57, 9, 0, 7); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(45, 52, 4, 0, 7); g.fill();
        g.fillStyle = '#ef6461'; g.beginPath(); g.arc(77, 43, 4.5, 0, 7); g.fill();
    },
    council(g, I) {
        piShape(g, I, () => { g.moveTo(40, 88); g.lineTo(42, 58); g.lineTo(58, 58); g.lineTo(60, 88); g.closePath(); }, '#b5df86');
        piBlob(g, I, [[30, 46, 15], [50, 32, 18], [70, 46, 15], [50, 52, 14]], '#5faa4f');
        g.fillStyle = '#7cc463';
        for (const [x, y] of [[28, 42], [46, 28], [66, 42], [56, 36]]) { g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); }
        g.fillStyle = I.ink; g.beginPath(); g.arc(46, 70, 2.6, 0, 7); g.arc(54, 70, 2.6, 0, 7); g.fill();
    },
    home(g, I) {
        piShape(g, I, () => piRR(g, 22, 18, 56, 44, 14), '#f29a72');
        piShape(g, I, () => piRR(g, 16, 50, 68, 24, 9), '#f7b893');
        piShape(g, I, () => piRR(g, 8, 38, 20, 38, 9), '#f29a72');
        piShape(g, I, () => piRR(g, 72, 38, 20, 38, 9), '#f29a72');
        g.lineWidth = 6; g.strokeStyle = I.ink; g.beginPath(); g.moveTo(20, 76); g.lineTo(20, 86); g.moveTo(80, 76); g.lineTo(80, 86); g.stroke();
        piHeart(g, 50, 36, 6, PHONE_PAPER);
    },
    edit(g, I) {
        piShape(g, I, () => { g.moveTo(8, 78); g.quadraticCurveTo(50, 40, 92, 78); g.closePath(); }, '#f4dc9c');
        g.lineWidth = 12; g.strokeStyle = I.ink; g.beginPath(); g.moveTo(50, 70); g.quadraticCurveTo(54, 46, 62, 30); g.stroke();
        g.lineWidth = 6; g.strokeStyle = '#b07a4c'; g.beginPath(); g.moveTo(50, 70); g.quadraticCurveTo(54, 46, 62, 30); g.stroke();
        for (const a of [-2.6, -1.9, -0.9, -0.25]) piShape(g, I, () => { g.moveTo(62, 30); g.quadraticCurveTo(62 + Math.cos(a - 0.35) * 26, 30 + Math.sin(a - 0.35) * 26, 62 + Math.cos(a) * 30, 30 + Math.sin(a) * 30 + 8); g.quadraticCurveTo(62 + Math.cos(a + 0.35) * 18, 30 + Math.sin(a + 0.35) * 18, 62, 30); }, '#62b356', 4.5);
        g.fillStyle = '#9b6a3e'; g.beginPath(); g.arc(60, 34, 4, 0, 7); g.arc(66, 33, 4, 0, 7); g.fill();
        g.strokeStyle = PHONE_PAPER; g.lineWidth = 4; g.beginPath(); g.moveTo(20, 86); g.quadraticCurveTo(30, 82, 40, 86); g.moveTo(58, 86); g.quadraticCurveTo(68, 82, 78, 86); g.stroke();
    },
    calendar(g, I) {
        piShape(g, I, () => piRR(g, 14, 20, 72, 66, 11), PHONE_PAPER);
        g.save(); g.beginPath(); piRR(g, 14, 20, 72, 66, 11); g.clip(); g.fillStyle = '#ef6461'; g.fillRect(14, 20, 72, 20); g.restore();
        g.lineWidth = 6; g.strokeStyle = I.ink; g.beginPath(); piRR(g, 14, 20, 72, 66, 11); g.stroke();
        g.beginPath(); g.moveTo(14, 40); g.lineTo(86, 40); g.lineWidth = 4; g.stroke();
        g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(34, 12); g.lineTo(34, 26); g.moveTo(66, 12); g.lineTo(66, 26); g.stroke();
        g.fillStyle = I.ink; g.font = '700 34px Fredoka, "Baloo 2", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(String(typeof Clock !== 'undefined' && Clock.date ? Clock.date() : 1), 50, 65);
    },
    poems(g, I) {
        piShape(g, I, () => piRR(g, 16, 16, 50, 66, 7), PHONE_PAPER);
        g.lineWidth = 4; g.strokeStyle = I.ink;
        for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(25, 32 + i * 12); g.lineTo(i % 2 ? 48 : 56, 32 + i * 12); g.stroke(); }
        piShape(g, I, () => { g.moveTo(90, 10); g.quadraticCurveTo(96, 44, 56, 72); g.quadraticCurveTo(58, 34, 90, 10); g.closePath(); }, '#ffd65c', 5);
        g.lineWidth = 3.5; g.beginPath(); g.moveTo(84, 22); g.quadraticCurveTo(72, 48, 58, 70); g.stroke();
        g.lineWidth = 5; g.beginPath(); g.moveTo(56, 72); g.lineTo(48, 86); g.stroke();
    },
    pottery(g, I) {
        const vase = () => { g.moveTo(38, 16); g.lineTo(62, 16); g.lineTo(58, 28); g.quadraticCurveTo(86, 44, 74, 70); g.quadraticCurveTo(66, 88, 50, 88); g.quadraticCurveTo(34, 88, 26, 70); g.quadraticCurveTo(14, 44, 42, 28); g.closePath(); };
        g.beginPath(); vase(); g.fillStyle = '#e8925c'; g.fill();
        g.save(); g.beginPath(); vase(); g.clip(); g.fillStyle = PHONE_PAPER; g.fillRect(0, 52, 100, 9); g.fillStyle = '#5aa6c8'; for (let x = 18; x < 84; x += 12) { g.beginPath(); g.arc(x, 56.5, 2.6, 0, 7); g.fill(); } g.restore();
        g.lineWidth = 6; g.strokeStyle = I.ink; g.beginPath(); vase(); g.stroke();
        g.fillStyle = I.ink; g.beginPath(); g.ellipse(50, 16, 12, 3.5, 0, 0, 7); g.fill();
    },
    arcade(g, I) {
        piBlob(g, I, [[26, 66, 15], [74, 66, 15]], PHONE_PAPER);
        piShape(g, I, () => piRR(g, 10, 34, 80, 38, 19), PHONE_PAPER);
        g.fillStyle = PHONE_PAPER; g.beginPath(); g.arc(26, 66, 14, 0, 7); g.arc(74, 66, 14, 0, 7); g.fill();
        g.fillStyle = I.ink; g.fillRect(23, 44, 8, 22); g.fillRect(16, 51, 22, 8);
        g.fillStyle = '#ef6461'; g.beginPath(); g.arc(70, 47, 5.5, 0, 7); g.fill();
        g.fillStyle = '#5fb8e8'; g.beginPath(); g.arc(80, 57, 5.5, 0, 7); g.fill();
        g.fillStyle = '#f5c13d'; g.beginPath(); g.arc(60, 57, 5.5, 0, 7); g.fill();
    },
    music(g, I) {
        g.lineWidth = 7; g.strokeStyle = I.ink; g.beginPath(); g.moveTo(38, 28); g.lineTo(38, 70); g.moveTo(74, 20); g.lineTo(74, 62); g.stroke();
        g.fillStyle = I.ink; g.beginPath(); g.moveTo(35, 24); g.lineTo(77, 14); g.lineTo(77, 28); g.lineTo(35, 38); g.closePath(); g.fill();
        piShape(g, I, () => g.ellipse(29, 72, 12, 9, -0.35, 0, 7), '#a58ae8', 5);
        piShape(g, I, () => g.ellipse(65, 64, 12, 9, -0.35, 0, 7), '#a58ae8', 5);
    },
    gohome(g, I) {
        piShape(g, I, () => piRR(g, 64, 16, 11, 22, 3), '#b5826a', 5);
        piShape(g, I, () => piRR(g, 22, 44, 56, 42, 5), PHONE_PAPER);
        piShape(g, I, () => { g.moveTo(10, 50); g.lineTo(50, 16); g.lineTo(90, 50); g.closePath(); }, '#ec6f5c');
        piShape(g, I, () => piRR(g, 43, 60, 15, 26, 4), '#b07a4c', 5);
        g.fillStyle = '#86bde8'; g.fillRect(28, 56, 9, 9);
        g.lineWidth = 3.5; g.strokeStyle = I.ink; g.strokeRect(28, 56, 9, 9);
    },
    settings(g, I) {
        piShape(g, I, () => {
            for (let i = 0; i < 16; i++) {
                const a0 = (i / 16) * Math.PI * 2, a1 = ((i + 1) / 16) * Math.PI * 2, r = i % 2 ? 30 : 39;
                g.lineTo(50 + Math.cos(a0 + 0.06) * r, 50 + Math.sin(a0 + 0.06) * r); g.lineTo(50 + Math.cos(a1 - 0.06) * r, 50 + Math.sin(a1 - 0.06) * r);
            }
            g.closePath();
        }, '#c9cbe0');
        piShape(g, I, () => g.arc(50, 50, 13, 0, 7), PHONE_PAPER, 5);
    },
    save(g, I) {
        // (a crescent: the moon's disc less a disc beside it, each outline only where it borders the other)
        const moon = () => g.arc(44, 52, 32, 0, 7), bite = () => g.arc(62, 38, 26, 0, 7);
        g.save(); g.beginPath(); g.rect(0, 0, 100, 100); bite(); g.clip('evenodd');
        g.beginPath(); moon(); g.fillStyle = '#ffd65c'; g.fill(); g.lineWidth = 6; g.strokeStyle = I.ink; g.stroke(); g.restore();
        g.save(); g.beginPath(); moon(); g.clip(); g.beginPath(); bite(); g.lineWidth = 6; g.strokeStyle = I.ink; g.stroke(); g.restore();
        g.fillStyle = I.ink; g.font = '700 20px Fredoka, "Baloo 2", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('z', 76, 64); g.font = '700 14px Fredoka, "Baloo 2", system-ui, sans-serif'; g.fillText('z', 86, 50);
    },
    designer(g, I) {
        piShape(g, I, () => { g.moveTo(14, 86); g.lineTo(14, 20); g.lineTo(80, 86); g.closePath(); g.moveTo(24, 76); g.lineTo(52, 76); g.lineTo(24, 48); g.closePath(); }, '#ffd65c');
        g.lineWidth = 4; g.strokeStyle = I.ink;
        for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(14, 20 + i * 13); g.lineTo(20, 20 + i * 13); g.stroke(); }
        g.save(); g.translate(70, 44); g.rotate(Math.PI / 4);
        piShape(g, I, () => piRR(g, -7, -32, 14, 46, 3), '#f28b8b', 5);
        piShape(g, I, () => { g.moveTo(-7, 14); g.lineTo(7, 14); g.lineTo(0, 28); g.closePath(); }, PHONE_PAPER, 5);
        g.fillStyle = I.ink; g.beginPath(); g.moveTo(-2.5, 23); g.lineTo(2.5, 23); g.lineTo(0, 28); g.closePath(); g.fill();
        g.restore();
    },
};
/* the HUD's buttons in the same hand (David, 28 October: the tools, moves, pocket, map... "like the phone menu"): an open
   hand, the tools Sarah holds, her pocket, the phone, running shoes, and the day's weather */
const HUD_SKIN = '#ffd9b4', HUD_WOOD = '#c98a52', HUD_STEEL = '#d7dde6';
Object.assign(PHONE_ICONS, {
    hand(g, I) {
        g.save(); g.translate(30, 64); g.rotate(-0.75); piShape(g, I, () => piRR(g, -7, -26, 14, 34, 7), HUD_SKIN, 5); g.restore();
        for (const [x, y] of [[36, 24], [48, 17], [60, 20], [71, 29]]) piShape(g, I, () => piRR(g, x - 6.5, y, 13, 42, 6.5), HUD_SKIN, 5);
        piShape(g, I, () => piRR(g, 27, 46, 52, 40, 18), HUD_SKIN, 5);
        g.fillStyle = HUD_SKIN; g.fillRect(31, 45, 44, 9);
        g.fillStyle = 'rgba(239,120,110,0.35)'; g.beginPath(); g.ellipse(53, 70, 12, 8, 0, 0, 7); g.fill();
    },
    axe(g, I) {
        g.save(); g.translate(50, 52); g.rotate(-0.62);
        piShape(g, I, () => piRR(g, -6, -38, 12, 80, 6), HUD_WOOD, 5);
        piShape(g, I, () => { g.moveTo(-4, -36); g.lineTo(24, -42); g.quadraticCurveTo(34, -24, 26, -6); g.lineTo(-4, -14); g.closePath(); }, HUD_STEEL, 5);
        g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.beginPath(); g.moveTo(26, -36); g.quadraticCurveTo(31, -24, 26, -12); g.stroke();
        g.restore();
    },
    shovel(g, I) {
        g.save(); g.translate(50, 50); g.rotate(0.62);
        piShape(g, I, () => piRR(g, -5, -40, 10, 56, 5), HUD_WOOD, 5);
        piShape(g, I, () => { g.moveTo(-12, -44); g.lineTo(12, -44); g.lineTo(9, -36); g.lineTo(-9, -36); g.closePath(); }, HUD_WOOD, 5);
        piShape(g, I, () => { g.moveTo(-15, 12); g.lineTo(15, 12); g.lineTo(14, 32); g.quadraticCurveTo(0, 48, -14, 32); g.closePath(); }, HUD_STEEL, 5);
        g.restore();
    },
    can(g, I) {
        piShape(g, I, () => { g.moveTo(58, 52); g.lineTo(84, 30); g.lineTo(90, 36); g.lineTo(64, 64); g.closePath(); }, '#5cc6c0', 5);
        piShape(g, I, () => { g.ellipse(87, 31, 7, 9, -0.8, 0, 7); }, '#5cc6c0', 5);
        g.lineWidth = 6; g.strokeStyle = I.ink; g.beginPath(); g.arc(38, 44, 18, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
        g.lineWidth = 3; g.strokeStyle = '#5cc6c0'; g.beginPath(); g.arc(38, 44, 18, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
        piShape(g, I, () => piRR(g, 16, 42, 46, 40, 10), '#5cc6c0', 5);
        g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); piRR(g, 22, 48, 8, 26, 4); g.fill();
        g.fillStyle = '#9fdcff'; for (const [x, y] of [[90, 52], [84, 62], [94, 66]]) { g.beginPath(); g.ellipse(x, y, 3, 4.5, 0, 0, 7); g.fill(); }
    },
    pocket(g, I) {
        g.lineWidth = 6; g.strokeStyle = I.ink; g.beginPath(); g.arc(50, 40, 22, Math.PI, 0); g.stroke();
        g.lineWidth = 3; g.strokeStyle = '#e9b97a'; g.beginPath(); g.arc(50, 40, 22, Math.PI, 0); g.stroke();
        piShape(g, I, () => { g.moveTo(20, 40); g.lineTo(80, 40); g.lineTo(86, 82); g.quadraticCurveTo(50, 92, 14, 82); g.closePath(); }, '#f2c27e', 5);
        piShape(g, I, () => { g.moveTo(20, 40); g.lineTo(80, 40); g.lineTo(78, 56); g.quadraticCurveTo(50, 66, 22, 56); g.closePath(); }, '#e0a35e', 5);
        piShape(g, I, () => g.arc(50, 60, 6, 0, 7), '#ffe39a', 4);
    },
    phone(g, I) {
        piShape(g, I, () => piRR(g, 28, 10, 44, 80, 12), '#5a4660', 5);
        g.fillStyle = PHONE_PAPER; g.beginPath(); piRR(g, 33, 19, 34, 58, 6); g.fill();
        const cols = ['#8fd46f', '#ffd0dc', '#c8f0c0', '#ffe8b0', '#d0e4ff', '#ecd8ff'];
        cols.forEach((c, i) => { g.fillStyle = c; g.beginPath(); piRR(g, 37 + (i % 2) * 14, 24 + Math.floor(i / 2) * 15, 11, 11, 3.5); g.fill(); });
        g.fillStyle = PHONE_PAPER; g.beginPath(); g.arc(50, 83, 3, 0, 7); g.fill();
    },
    run(g, I) {
        g.lineWidth = 5; g.strokeStyle = I.ink;
        for (const [y, w] of [[38, 16], [52, 22], [66, 14]]) { g.beginPath(); g.moveTo(6, y); g.lineTo(6 + w, y); g.stroke(); }
        piShape(g, I, () => { g.moveTo(30, 70); g.lineTo(34, 40); g.quadraticCurveTo(44, 32, 52, 40); g.lineTo(62, 52); g.quadraticCurveTo(90, 56, 92, 68); g.lineTo(92, 74); g.lineTo(30, 74); g.closePath(); }, '#ffffff', 5);
        piShape(g, I, () => { g.moveTo(28, 72); g.lineTo(94, 72); g.lineTo(94, 80); g.quadraticCurveTo(60, 84, 28, 80); g.closePath(); }, '#ef6461', 5);
        g.lineWidth = 5; g.strokeStyle = '#4f9be0'; g.beginPath(); g.moveTo(40, 66); g.quadraticCurveTo(52, 58, 66, 62); g.stroke();
        g.lineWidth = 3; g.strokeStyle = I.ink; for (const x of [46, 52]) { g.beginPath(); g.moveTo(x, 44); g.lineTo(x + 6, 48); g.stroke(); }
    },
    sunny(g, I) {
        g.lineWidth = 7; g.strokeStyle = '#f2a83a';
        for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.beginPath(); g.moveTo(50 + Math.cos(a) * 30, 50 + Math.sin(a) * 30); g.lineTo(50 + Math.cos(a) * 42, 50 + Math.sin(a) * 42); g.stroke(); }
        piShape(g, I, () => g.arc(50, 50, 20, 0, 7), '#ffd24a', 5);
    },
    cloudy(g, I) { piBlob(g, I, [[34, 58, 16], [52, 48, 20], [70, 58, 15], [50, 64, 15]], '#ffffff'); },
    moon(g, I) {
        piShape(g, I, () => { g.arc(50, 50, 30, Math.PI * 0.35, Math.PI * 1.65); g.arc(64, 42, 24, Math.PI * 1.45, Math.PI * 0.55, true); g.closePath(); }, '#ffe9a0', 5);
        g.fillStyle = '#ffe9a0'; for (const [x, y, r] of [[78, 70, 3], [84, 52, 2]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    },
    rain(g, I) {
        piBlob(g, I, [[34, 44, 15], [52, 36, 19], [70, 44, 14], [50, 50, 14]], '#ffffff');
        g.fillStyle = '#5aa8e8'; for (const [x, y] of [[34, 74], [52, 82], [70, 74]]) { g.beginPath(); g.moveTo(x, y - 10); g.quadraticCurveTo(x + 7, y, x, y + 4); g.quadraticCurveTo(x - 7, y, x, y - 10); g.fill(); }
    },
    snow(g, I) {
        piBlob(g, I, [[34, 44, 15], [52, 36, 19], [70, 44, 14], [50, 50, 14]], '#ffffff');
        g.lineWidth = 3.5; g.strokeStyle = '#7ab8e8';
        for (const [x, y] of [[34, 76], [52, 84], [70, 76]]) for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; g.beginPath(); g.moveTo(x - Math.cos(a) * 6, y - Math.sin(a) * 6); g.lineTo(x + Math.cos(a) * 6, y + Math.sin(a) * 6); g.stroke(); }
    },
});
/* the screens' own icons in the same hand (David, 29 October: "make the icons in the bank and all the other menus look like
   the phone menu quality"): the sand dollar, a present, a prize ticket, a lock, the safe deposit box, a package, a pile of
   leaves, the mailbox, a path, the market's chart, the island's flag, a statue, a hammer and plank for the town's projects */
Object.assign(PHONE_ICONS, {
    coin(g, I) {
        piShape(g, I, () => g.arc(50, 52, 35, 0, 7), '#f6d98e');
        g.fillStyle = '#fff1c4'; g.beginPath(); g.arc(50, 52, 26, 0, 7); g.fill();
        // (a sand dollar's five petals round a little hole)
        g.lineWidth = 4; g.strokeStyle = I.ink;
        for (let i = 0; i < 5; i++) {
            const a = -Math.PI / 2 + i * Math.PI * 2 / 5;
            g.save(); g.translate(50 + Math.cos(a) * 13, 52 + Math.sin(a) * 13); g.rotate(a + Math.PI / 2);
            g.beginPath(); g.ellipse(0, 0, 4.5, 9.5, 0, 0, 7); g.fillStyle = '#f2c86a'; g.fill(); g.stroke(); g.restore();
        }
        g.fillStyle = I.ink; g.beginPath(); g.arc(50, 52, 3, 0, 7); g.fill();
    },
    present(g, I) {
        piShape(g, I, () => piRR(g, 18, 46, 64, 42, 7), '#ef7f8f');
        piShape(g, I, () => g.rect(44, 46, 12, 42), '#ffd65c', 4);
        piShape(g, I, () => piRR(g, 12, 33, 76, 16, 6), '#f59aa6');
        piShape(g, I, () => g.rect(44, 33, 12, 16), '#ffd65c', 4);
        piShape(g, I, () => g.ellipse(37, 23, 12, 8, -0.45, 0, 7), '#ffd65c', 4.5);
        piShape(g, I, () => g.ellipse(63, 23, 12, 8, 0.45, 0, 7), '#ffd65c', 4.5);
        piShape(g, I, () => g.arc(50, 28, 6, 0, 7), '#f2b23a', 4.5);
    },
    ticket(g, I) {
        g.save(); g.translate(50, 52); g.rotate(-0.28);
        piShape(g, I, () => {
            g.moveTo(-38, -21); g.lineTo(38, -21); g.lineTo(38, -8); g.arc(38, 0, 8, -Math.PI / 2, Math.PI / 2, true); g.lineTo(38, 21);
            g.lineTo(-38, 21); g.lineTo(-38, 8); g.arc(-38, 0, 8, Math.PI / 2, -Math.PI / 2, true); g.closePath();
        }, '#ffb85c');
        g.lineWidth = 3.5; g.strokeStyle = I.ink; g.setLineDash([5, 6]); g.beginPath(); g.moveTo(-17, -17); g.lineTo(-17, 17); g.stroke(); g.setLineDash([]);
        piShape(g, I, () => { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 5 : 11.5; g.lineTo(11 + Math.cos(a) * r, 1 + Math.sin(a) * r); } g.closePath(); }, '#fff3c4', 4);
        g.restore();
    },
    lock(g, I) {
        g.lineWidth = 15; g.strokeStyle = I.ink; g.beginPath(); g.arc(50, 42, 17, Math.PI, 0); g.lineTo(67, 52); g.moveTo(33, 52); g.lineTo(33, 42); g.stroke();
        g.lineWidth = 7; g.strokeStyle = '#c9cbe0'; g.beginPath(); g.arc(50, 42, 17, Math.PI, 0); g.lineTo(67, 52); g.moveTo(33, 52); g.lineTo(33, 42); g.stroke();
        piShape(g, I, () => piRR(g, 20, 48, 60, 40, 10), '#f2c45c');
        piShape(g, I, () => { g.arc(50, 63, 6, Math.PI * 0.8, Math.PI * 2.2); g.lineTo(53, 77); g.lineTo(47, 77); g.closePath(); }, I.ink, 2);
    },
    chest(g, I) {
        piShape(g, I, () => piRR(g, 12, 46, 76, 40, 7), '#c98a52');
        piShape(g, I, () => { g.moveTo(12, 48); g.lineTo(12, 36); g.quadraticCurveTo(12, 18, 50, 18); g.quadraticCurveTo(88, 18, 88, 36); g.lineTo(88, 48); g.closePath(); }, '#d99c62');
        for (const x of [24, 70]) piShape(g, I, () => g.rect(x, 21, 6, 64), '#ffd65c', 3.5);
        piShape(g, I, () => piRR(g, 41, 40, 18, 20, 4), '#ffd65c', 4);
        g.fillStyle = I.ink; g.beginPath(); g.arc(50, 48, 3, 0, 7); g.fill(); g.fillRect(48.5, 48, 3, 7);
    },
    package(g, I) {
        piShape(g, I, () => piRR(g, 14, 38, 72, 48, 6), '#e2b47a');
        piShape(g, I, () => { g.moveTo(14, 40); g.lineTo(24, 18); g.lineTo(76, 18); g.lineTo(86, 40); g.closePath(); }, '#efc994');
        piShape(g, I, () => { g.moveTo(44, 18); g.lineTo(56, 18); g.lineTo(57, 40); g.lineTo(57, 60); g.lineTo(43, 60); g.lineTo(43, 40); g.closePath(); }, '#f6e2b8', 4);
        piShape(g, I, () => piRR(g, 58, 64, 20, 14, 3), PHONE_PAPER, 4);
        g.lineWidth = 3; g.strokeStyle = I.ink; g.beginPath(); g.moveTo(62, 69); g.lineTo(74, 69); g.moveTo(62, 74); g.lineTo(70, 74); g.stroke();
    },
    leaves(g, I) {
        piBlob(g, I, [[28, 70, 16], [50, 62, 20], [72, 70, 15], [50, 76, 14]], '#f0a04a');
        const leaf = (x, y, a, col) => {
            g.save(); g.translate(x, y); g.rotate(a);
            piShape(g, I, () => { g.moveTo(-15, 0); g.quadraticCurveTo(0, -12, 15, 0); g.quadraticCurveTo(0, 12, -15, 0); g.closePath(); }, col, 4);
            g.lineWidth = 2.5; g.strokeStyle = I.ink; g.beginPath(); g.moveTo(-12, 0); g.lineTo(12, 0); g.stroke();
            g.restore();
        };
        leaf(34, 50, -0.5, '#e2683c'); leaf(62, 44, 0.6, '#f6c64a'); leaf(50, 30, -0.1, '#d8573a'); leaf(74, 60, 1.2, '#e2683c');
    },
    mailbox(g, I) {
        piShape(g, I, () => piRR(g, 40, 58, 12, 32, 3), '#b07a4c', 5);
        piShape(g, I, () => { g.moveTo(12, 64); g.lineTo(12, 40); g.arc(30, 40, 18, Math.PI, Math.PI * 1.5); g.lineTo(62, 22); g.arc(62, 40, 18, Math.PI * 1.5, 0); g.lineTo(80, 64); g.closePath(); }, '#6fb880');
        piShape(g, I, () => { g.moveTo(12, 64); g.lineTo(12, 40); g.arc(30, 40, 18, Math.PI, Math.PI * 1.5); g.lineTo(30, 64); g.closePath(); }, '#5aa06a', 5);
        g.lineWidth = 5; g.strokeStyle = I.ink; g.beginPath(); g.moveTo(84, 54); g.lineTo(84, 12); g.stroke();
        piShape(g, I, () => piRR(g, 84, 10, 12, 16, 3), '#ef6461', 4.5);
    },
    paths(g, I) {
        const road = () => { g.moveTo(34, 96); g.bezierCurveTo(30, 66, 72, 66, 64, 40); g.bezierCurveTo(58, 22, 70, 12, 76, 4); };
        g.lineWidth = 30; g.strokeStyle = I.ink; g.beginPath(); road(); g.stroke();
        g.lineWidth = 21; g.strokeStyle = '#f4dc9c'; g.beginPath(); road(); g.stroke();
        for (const [x, y, r] of [[36, 84, 5], [44, 68, 4.5], [60, 56, 5], [64, 38, 4.5], [66, 22, 4]]) piShape(g, I, () => g.ellipse(x, y, r * 1.3, r, 0.3, 0, 7), '#c9cbe0', 3);
        piBlob(g, I, [[18, 40, 9], [26, 34, 8]], '#8fd46f');
        piBlob(g, I, [[86, 74, 9], [80, 66, 7]], '#8fd46f');
    },
    chart(g, I) {
        piShape(g, I, () => piRR(g, 12, 16, 76, 70, 10), PHONE_PAPER);
        g.lineWidth = 3; g.strokeStyle = 'rgba(120, 90, 60, 0.25)';
        for (const y of [36, 52, 68]) { g.beginPath(); g.moveTo(20, y); g.lineTo(80, y); g.stroke(); }
        headLine(g, I, () => { g.moveTo(22, 70); g.lineTo(38, 56); g.lineTo(52, 62); g.lineTo(76, 32); }, '#4fa25a', 6);
        piShape(g, I, () => { g.moveTo(78, 24); g.lineTo(82, 40); g.lineTo(66, 32); g.closePath(); }, '#4fa25a', 4);
    },
    flag(g, I) {
        piShape(g, I, () => piRR(g, 22, 14, 8, 78, 4), PHONE_PAPER, 5);
        piShape(g, I, () => g.arc(26, 12, 6, 0, 7), '#ffd65c', 4);
        const cloth = () => { g.moveTo(30, 20); g.bezierCurveTo(46, 12, 62, 28, 86, 20); g.lineTo(86, 56); g.bezierCurveTo(62, 64, 46, 48, 30, 56); g.closePath(); };
        g.beginPath(); cloth(); g.fillStyle = '#5aa8e8'; g.fill();
        g.save(); g.beginPath(); cloth(); g.clip(); g.fillStyle = PHONE_PAPER;
        for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2) g.fillRect(30 + i * 14, 14 + j * 15, 14, 15);
        g.restore();
        g.lineWidth = 5; g.strokeStyle = I.ink; g.beginPath(); cloth(); g.stroke();
    },
    statue(g, I) {
        // (someone in bronze on a stone plinth, waving)
        piShape(g, I, () => piRR(g, 18, 74, 64, 16, 4), '#d8d2c4');
        piShape(g, I, () => piRR(g, 26, 64, 48, 12, 3), '#e8e2d4', 5);
        g.save(); g.translate(64, 40); g.rotate(-0.6); piShape(g, I, () => piRR(g, -4.5, -20, 9, 24, 4.5), '#c99a5a', 5); g.restore();
        piShape(g, I, () => { g.moveTo(34, 64); g.lineTo(39, 40); g.quadraticCurveTo(50, 34, 61, 40); g.lineTo(66, 64); g.closePath(); }, '#c99a5a');
        piShape(g, I, () => g.arc(50, 25, 12, 0, 7), '#c99a5a');
        g.fillStyle = '#e8c48a'; g.beginPath(); g.ellipse(46, 21, 3.5, 4.5, 0.4, 0, 7); g.ellipse(44, 46, 3, 7, 0.2, 0, 7); g.fill();
    },
    build(g, I) {
        g.save(); g.translate(50, 70); g.rotate(-0.12);
        piShape(g, I, () => piRR(g, -40, -9, 80, 18, 4), '#e6b97c');
        g.fillStyle = I.ink; for (const x of [-26, 26]) { g.beginPath(); g.arc(x, 0, 2.6, 0, 7); g.fill(); }
        g.restore();
        g.save(); g.translate(48, 40); g.rotate(-0.7);
        piShape(g, I, () => piRR(g, -5, -6, 10, 52, 5), '#c98a52', 5);
        piShape(g, I, () => { g.moveTo(-20, -18); g.lineTo(16, -18); g.lineTo(20, -10); g.lineTo(16, -2); g.lineTo(-20, -2); g.quadraticCurveTo(-26, -10, -20, -18); g.closePath(); }, '#c9cbe0', 5);
        g.restore();
    },
});
/* which of the screens' pictures are icons drawn as shapes: a picture's name -> [its drawing, its tile's color]. The apps'
   pictures (app_<id>) are the phone's own, an emote (emote_<kind>) its bubble (41d_head_icons.js); anything else is a
   thing's own picture (furniture, fish, clothes, people) and stays as it is */
const UI_VEC = {
    ui_coin: ['coin', '#ffe7a8'], ui_present: ['present', '#ffd6de'], ui_ticket: ['ticket', '#ffe0b8'], ui_lock: ['lock', '#e4e4f0'],
    ui_moves: ['moves', '#ecd8ff'], ui_hand: ['hand', '#ffe6cc'], ui_run: ['run', '#d0e4ff'], ui_house: ['gohome', '#ffd9d0'],
    ui_phone: ['phone', '#ffe6cc'], ui_pocket: ['pocket', '#ffe8b0'], ui_invite: ['texts', '#c8f0c0'], ui_chest: ['chest', '#f6e0c4'],
    ui_chart: ['chart', '#d8f0c8'], ic_package: ['package', '#f6e2c4'], ic_leafpile: ['leaves', '#f8e6c4'], mailbox: ['mailbox', '#d8f0c8'],
    app_mail: ['mail', '#ffe0d2'], app_paths: ['paths', '#f4e8c8'], ui_flag: ['flag', '#d0e4ff'], ui_statue: ['statue', '#f2e2c8'],
    ui_build: ['build', '#ffe6cc'],
};
function uiVecOf(name) {
    if (!name) return null;
    if (UI_VEC[name]) return UI_VEC[name];
    const app = /^app_(\w+)$/.exec(name), A = app && PHONE_ICONS[app[1]] && APPS.find(q => q[0] === app[1]);
    if (A) return [A[0], A[2]];
    const em = /^emote_(\w+)$/.exec(name);
    if (em && HEAD_ICONS[em[1]]) return ['emote:' + em[1], '#fff1d6'];
    return null;
}
/* a screen's icon: drawn as shapes at the screen's resolution where it's one of those, its picture otherwise. Its size is
   `css` pixels unless the place it's in says (CSS: canvas.vec), on a plate in its tile's color where pictures have plates */
function uiIcon(name, css) {
    const v = uiVecOf(name);
    if (!v) return iconCanvas(name, css);
    css = css || 32;
    const k = Math.min(3, Math.max(2, Math.ceil(window.devicePixelRatio || 1))), c = document.createElement('canvas');
    c.width = c.height = Math.round(css * k);
    c.className = 'vec';
    c.style.setProperty('--vs', css + 'px');
    c.style.setProperty('--plate', v[1]);
    const g = c.getContext('2d');
    g.scale(c.width / 100, c.width / 100);
    g.lineJoin = 'round'; g.lineCap = 'round';
    if (v[0].startsWith('emote:')) headIcon(g, v[0].slice(6));
    else PHONE_ICONS[v[0]](g, { ink: phoneInk(v[1]) });
    c.setAttribute('aria-hidden', 'true');
    return c;
}
/* an app's icon as a canvas `css` pixels square (sharp on the screen it's on) */
function phoneIcon(id, col, css) {
    css = css || 40;
    const k = Math.min(3, Math.max(2, Math.ceil(window.devicePixelRatio || 1))), c = document.createElement('canvas');
    c.width = c.height = Math.round(css * k);
    c.className = 'vec';
    c.style.width = c.style.height = css + 'px';
    const g = c.getContext('2d');
    g.scale(c.width / 100, c.width / 100);
    g.lineJoin = 'round'; g.lineCap = 'round';
    const draw = PHONE_ICONS[id];
    if (draw) draw(g, { ink: phoneInk(col || '#e4e4f0') });
    c.setAttribute('aria-hidden', 'true');
    return c;
}
