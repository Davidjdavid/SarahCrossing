/* Fronts painted one by one for the Houses that need their own look (each House should be recognisable
   from across the field). Used through SPAWN.building's `art`. */

const FACADES = {
    /* the Tidyhouse: a prim, perfectly symmetrical manor. Everything matches; nothing is out of place */
    tidyhouse() {
        const w = 144, h = 86;
        ART.f_tidyhouse = paintSprite(w, h, x => {
            const R = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
            const mirror = (fn) => { fn(false); fn(true); };
            const mx = (px, ww, flip) => flip ? w - px - ww : px;
            /* chimneys (a matched pair) */
            mirror(f => { const cx = mx(22, 9, f); R('#a89a8a', cx, 0, 9, 14); R('#867868', cx + 6, 0, 3, 14); R('#5e5246', cx - 1, 0, 11, 2); });
            /* the mansard roof: slate, in neat rows, narrowing to a flat top */
            const roofTop = 6, roofBot = 38;
            for (let j = roofTop; j < roofBot; j++) {
                const k = (j - roofTop) / (roofBot - roofTop), inset = Math.round(16 * (1 - k));
                for (let i = inset; i < w - inset; i++) {
                    let c = (j - roofTop) % 5 === 4 ? '#4e5c6e' : '#6a7a8e';
                    if ((j - roofTop) % 5 === 0) c = '#8494a8';
                    if (((i + (Math.floor((j - roofTop) / 5) % 2) * 3) % 6) === 0 && (j - roofTop) % 5 !== 4) c = '#5a687c';
                    if (i === inset || i === w - inset - 1) c = '#3e4a5a';
                    R(c, i, j, 1, 1);
                }
            }
            R('#3e4a5a', 16, roofTop - 1, w - 32, 2); R('#9aaabc', 17, roofTop + 1, w - 34, 1);
            /* the weathervane: a feather duster */
            R('#5e5246', 71, 0, 2, 6); R('#d8c060', 66, 0, 12, 2); R('#f4e8a0', 67, 0, 10, 1);
            /* dormers over the outer windows */
            mirror(f => {
                const dx = mx(30, 20, f);
                for (let j = 0; j < 6; j++) R('#3e4a5a', dx + 9 - j * 1.5, 14 + j, 2 + j * 3, 1);
                R('#fbf8f0', dx + 2, 20, 16, 14); R('#7ab8d0', dx + 4, 22, 12, 11); R('#c8ecf8', dx + 5, 23, 4, 3);
                R('#fbf8f0', dx + 9, 22, 2, 11); R('#fbf8f0', dx + 4, 27, 12, 1);
            });
            /* the cornice */
            R('#fbf8f0', 0, 38, w, 3); R('#d8d0c0', 0, 41, w, 1);
            /* walls: cream stone in even courses, quoins at the corners */
            R('#f4ecd8', 1, 42, w - 2, 40);
            for (let j = 42; j < 82; j += 6) R('#e4dac2', 1, j + 5, w - 2, 1);
            mirror(f => { for (let j = 42, n = 0; j < 82; j += 6, n++) R('#d8ccb0', mx(1, n % 2 ? 5 : 8, f), j, n % 2 ? 5 : 8, 5); });
            /* a band between the floors */
            R('#fbf8f0', 1, 60, w - 2, 2); R('#3aa597', 1, 62, w - 2, 1);
            /* windows: four up, four down, all exactly alike, teal shutters, the same red flowers in every box */
            const win = (px, py) => {
                R('#2e8a80', px - 3, py, 3, 13); R('#2e8a80', px + 12, py, 3, 13);
                R('#1f6a62', px - 3, py + 4, 3, 1); R('#1f6a62', px + 12, py + 4, 3, 1); R('#1f6a62', px - 3, py + 8, 3, 1); R('#1f6a62', px + 12, py + 8, 3, 1);
                R('#fbf8f0', px - 1, py - 1, 14, 15); R('#7ab8d0', px, py, 12, 13); R('#c8ecf8', px + 1, py + 1, 4, 4);
                R('#fbf8f0', px + 5, py, 2, 13); R('#fbf8f0', px, py + 6, 12, 1);
                R('#f0e0e8', px, py, 12, 2);                       /* curtains, drawn to the same height */
                R('#8a5a3a', px - 1, py + 13, 14, 3); R('#a87048', px - 1, py + 13, 14, 1);
                for (let i = 0; i < 6; i++) { R('#4fa84a', px + i * 2, py + 11, 2, 2); R('#e8463c', px + i * 2, py + 10, 2, 2); }
            };
            for (const px of [10, 34]) { win(px, 45); win(px, 65); win(w - px - 12, 45); win(w - px - 12, 65); }
            /* the porch: columns, a little pediment with a round window */
            for (let j = 0; j < 9; j++) R('#fbf8f0', 72 - (16 - j * 2), 44 + j, (16 - j * 2) * 2, 1);
            for (let j = 0; j < 7; j++) R('#f4ecd8', 72 - (13 - j * 2), 46 + j, (13 - j * 2) * 2, 1);
            R('#fbf8f0', 54, 53, 36, 3); R('#d8d0c0', 54, 56, 36, 1);
            for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) if (i * i + j * j <= 10) R(i * i + j * j > 6 ? '#fbf8f0' : '#7ab8d0', 72 + i - 1, 49 + j, 1, 1);
            mirror(f => { const cx = mx(57, 4, f); R('#fbf8f0', cx, 57, 4, 25); R('#d8d0c0', cx + 3, 57, 1, 25); R('#fbf8f0', cx - 1, 57, 6, 2); R('#fbf8f0', cx - 1, 80, 6, 2); });
            /* the door: a teal double door, a fanlight, a brass knob in each */
            R('#fbf8f0', 63, 62, 18, 24);
            for (let j = 0; j < 4; j++) R('#c8ecf8', 72 - (8 - j * 2) + (j ? 0 : 0), 63 + j, (8 - j * 2) * 2, 1);
            R('#2e8a80', 65, 67, 14, 19); R('#3aa597', 66, 68, 5, 7); R('#3aa597', 73, 68, 5, 7); R('#3aa597', 66, 77, 5, 7); R('#3aa597', 73, 77, 5, 7);
            R('#1f6a62', 71, 67, 2, 19); R('#f7d64a', 70, 75, 1, 2); R('#f7d64a', 73, 75, 1, 2);
            /* clipped topiary, perfectly round, in matching planters */
            mirror(f => {
                const px = mx(46, 10, f);
                discPx(x, px + 5, 70, 5, (a, b, u, v) => u + v < -0.6 ? '#7cc864' : u + v > 0.7 ? '#2e7a43' : (hash2(a, b, 5) < 0.2 ? '#3f9a4a' : '#4fa84a'));
                R('#6b4128', px + 4, 75, 2, 3);
                R('#3aa597', px + 1, 78, 9, 7); R('#2e8a80', px + 1, 83, 9, 2); R('#fbf8f0', px, 78, 11, 1);
            });
            /* the plinth and the step */
            R('#b8b0a0', 1, 82, w - 2, 4); R('#d0c8b8', 1, 82, w - 2, 1);
            R('#d0c8b8', 63, 84, 18, 2);
        });
    },
    /* the Millrace: a tall timber mill straddling the race, a great wheel on its river side, blue trim */
    millrace() {
        const w = 128, h = 86;
        ART.f_millrace = paintSprite(w, h, x => {
            const R = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
            /* roof: a steep gable in dark shingle with a hoist hood at the top */
            for (let j = 0; j < 36; j++) {
                const inset = Math.max(0, Math.round(40 - j * 1.25));
                for (let i = inset; i < w - inset; i++) {
                    let c = (j % 4 === 3) ? '#4a3a4e' : '#62506a';
                    if (((i + (Math.floor(j / 4) % 2) * 4) % 8) === 0 && j % 4 !== 3) c = '#54445c';
                    if (i === inset || i === w - inset - 1) c = '#2e2236';
                    R(c, i, j + 4, 1, 1);
                }
            }
            R('#9a6438', 56, 0, 16, 12); R('#6b4128', 56, 0, 16, 2); R('#3a2418', 60, 4, 8, 8); R('#c9925a', 63, 4, 2, 8);
            /* timber walls, weatherboard */
            R('#c9925a', 2, 40, w - 4, 42);
            for (let j = 40; j < 82; j += 4) R('#9a6438', 2, j + 3, w - 4, 1);
            for (const px of [2, 40, 86, w - 6]) R('#6b4128', px, 40, 4, 42);
            R('#4f9be0', 2, 39, w - 4, 2); R('#2e6ab0', 2, 41, w - 4, 1);
            /* windows with blue shutters, the door in the middle */
            const win = (px, py) => { R('#2e6ab0', px - 3, py, 3, 10); R('#2e6ab0', px + 10, py, 3, 10); R('#fbf3df', px - 1, py - 1, 12, 12); R('#4fb0e0', px, py, 10, 10); R('#a5dcf7', px + 1, py + 1, 3, 3); R('#fbf3df', px + 4, py, 2, 10); };
            win(16, 48); win(102, 48); win(16, 66); win(102, 66);
            R('#6b4128', 50, 56, 28, 30); R('#4f9be0', 52, 58, 24, 28); R('#2e6ab0', 63, 58, 2, 28); R('#f7d64a', 60, 72, 2, 2); R('#f7d64a', 66, 72, 2, 2);
            R('#fbf3df', 46, 52, 36, 4); R('#2e6ab0', 50, 53, 28, 2);
            /* the great wheel on the river side (west), turning round a hub */
            const cx = 10, cy = 62;
            x.fillStyle = '#3a2418'; x.beginPath(); x.arc(cx, cy, 22, Math.PI * 0.5, Math.PI * 1.5); x.fill();
            x.fillStyle = '#7a4e32'; x.beginPath(); x.arc(cx, cy, 20, Math.PI * 0.5, Math.PI * 1.5); x.fill();
            x.fillStyle = '#3a2418'; x.beginPath(); x.arc(cx, cy, 14, Math.PI * 0.5, Math.PI * 1.5); x.fill();
            for (let i = 0; i < 12; i++) { const t = Math.PI * 0.5 + i * Math.PI / 11; R('#e6c08a', Math.round(cx + Math.cos(t) * 18) - 1, Math.round(cy + Math.sin(t) * 18) - 1, 3, 3); R('#9a6438', Math.round(cx + Math.cos(t) * 9), Math.round(cy + Math.sin(t) * 9), 2, 2); }
            R('#c9925a', cx - 2, cy - 2, 5, 5);
            /* water spilling off the wheel */
            for (let j = 0; j < 22; j++) R(j % 3 ? '#a5dcf7' : '#ffffff', 2 + (j % 3), 64 + j, 2, 1);
            /* a stone plinth */
            R('#a8b0a8', 2, 82, w - 4, 4); R('#c8d0c8', 2, 82, w - 4, 1);
        });
    },
};
