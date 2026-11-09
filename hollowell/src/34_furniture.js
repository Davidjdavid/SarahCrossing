/* Furniture and things indoors, painted in code. */

function initFurniture() {
    const wood = ['#c9925a', '#9a6438', '#e6c08a', '#6b4128'];
    ART.bed = paintSprite(18, 30, x => {
        x.fillStyle = wood[1]; x.fillRect(1, 0, 16, 6); x.fillStyle = wood[0]; x.fillRect(2, 1, 14, 3);
        x.fillStyle = '#fbf6ea'; x.fillRect(2, 6, 14, 6); x.fillStyle = '#e8dcc8'; x.fillRect(2, 10, 14, 2);
        x.fillStyle = '#c0505a'; x.fillRect(1, 12, 16, 15); x.fillStyle = '#d86a6a'; x.fillRect(1, 12, 16, 3);
        for (let i = 3; i < 16; i += 4) for (let j = 16; j < 27; j += 4) { x.fillStyle = '#f0c040'; x.fillRect(i, j, 1, 1); }
        x.fillStyle = wood[1]; x.fillRect(1, 27, 16, 3);
    });
    ART.bed_gran = paintSprite(18, 30, x => {
        x.fillStyle = wood[3]; x.fillRect(1, 0, 16, 6); x.fillStyle = wood[1]; x.fillRect(2, 1, 14, 3);
        x.fillStyle = '#fbf6ea'; x.fillRect(2, 6, 14, 6);
        x.fillStyle = '#5a8ad0'; x.fillRect(1, 12, 16, 15); x.fillStyle = '#7aa8e8'; x.fillRect(1, 12, 16, 3);
        for (let i = 2; i < 16; i += 3) { x.fillStyle = '#fbf6ea'; x.fillRect(i, 18, 2, 1); x.fillRect(i, 23, 2, 1); }
        x.fillStyle = wood[3]; x.fillRect(1, 27, 16, 3);
    });
    ART.table = paintSprite(32, 20, x => {
        x.fillStyle = wood[0]; x.fillRect(1, 2, 30, 10); x.fillStyle = wood[2]; x.fillRect(1, 2, 30, 2);
        x.fillStyle = wood[1]; x.fillRect(1, 12, 30, 3); x.fillStyle = wood[3]; x.fillRect(3, 15, 3, 5); x.fillRect(26, 15, 3, 5);
        x.fillStyle = '#fbf6ea'; x.fillRect(10, 4, 12, 6); x.fillStyle = '#e8463c'; x.fillRect(14, 5, 4, 3);
    });
    ART.stool = paintSprite(12, 12, x => {
        x.fillStyle = wood[0]; x.fillRect(1, 2, 10, 4); x.fillStyle = wood[2]; x.fillRect(1, 2, 10, 1);
        x.fillStyle = wood[3]; x.fillRect(2, 6, 2, 6); x.fillRect(8, 6, 2, 6);
    });
    ART.shelf = paintSprite(32, 30, x => {
        x.fillStyle = wood[1]; x.fillRect(0, 0, 32, 30); x.fillStyle = wood[3]; x.fillRect(2, 2, 28, 26);
        for (let r = 0; r < 3; r++) {
            const y = 3 + r * 9;
            x.fillStyle = wood[0]; x.fillRect(2, y + 7, 28, 2);
            for (let i = 0; i < 9; i++) {
                const h = 4 + Math.floor(hash2(i, r, 3) * 3), c = ['#c0505a', '#5a8ad0', '#4fa84a', '#e8b04a', '#8a5aa0', '#fbf6ea'][Math.floor(hash2(r, i, 4) * 6)];
                x.fillStyle = c; x.fillRect(3 + i * 3, y + 7 - h, 2, h);
            }
        }
    });
    ART.hearth = paintSprite(32, 32, x => {
        x.fillStyle = '#a89c8c'; x.fillRect(0, 4, 32, 28); x.fillStyle = '#c8bcac'; x.fillRect(0, 4, 32, 3);
        for (let j = 0; j < 28; j += 5) for (let i = (j / 5 % 2) * 4; i < 32; i += 8) { x.fillStyle = '#8a7e70'; x.fillRect(i, 7 + j, 1, 4); }
        x.fillStyle = '#2a1f2d'; x.fillRect(8, 14, 16, 18);
        x.fillStyle = '#f39a3c'; x.fillRect(11, 24, 10, 6); x.fillStyle = '#f7d64a'; x.fillRect(13, 22, 6, 6); x.fillStyle = '#fbf6ea'; x.fillRect(15, 25, 2, 3);
        x.fillStyle = '#6b4128'; x.fillRect(10, 29, 12, 3);
        x.fillStyle = '#7a4e32'; x.fillRect(0, 2, 32, 3);
    });
    ART.rug = paintSprite(48, 32, x => {
        x.fillStyle = '#b0434a'; x.fillRect(0, 0, 48, 32); x.fillStyle = '#d06a6a'; x.fillRect(3, 3, 42, 26);
        x.fillStyle = '#f0c070'; x.fillRect(6, 6, 36, 20); x.fillStyle = '#b0434a'; x.fillRect(9, 9, 30, 14);
        for (let i = 12; i < 36; i += 6) { x.fillStyle = '#f0c070'; x.fillRect(i, 15, 3, 2); }
    }, false);
    ART.rug_small = paintSprite(32, 16, x => {
        x.fillStyle = '#4a7ac4'; x.fillRect(0, 0, 32, 16); x.fillStyle = '#6a9ae0'; x.fillRect(2, 2, 28, 12);
        for (let i = 4; i < 30; i += 4) { x.fillStyle = '#fbf6ea'; x.fillRect(i, 7, 2, 2); }
    }, false);
    ART.portrait_turned = paintSprite(16, 18, x => {
        x.fillStyle = '#9a6438'; x.fillRect(1, 1, 14, 16); x.fillStyle = '#c9925a'; x.fillRect(2, 2, 12, 14);
        x.fillStyle = '#9a6438'; x.fillRect(7, 2, 2, 14); x.fillRect(2, 8, 12, 2);
    });
    ART.portrait_linnet = paintSprite(16, 18, x => {
        x.fillStyle = '#d9a33a'; x.fillRect(1, 1, 14, 16); x.fillStyle = '#9fd4f0'; x.fillRect(3, 3, 10, 12);
        x.fillStyle = '#7a4e32'; x.fillRect(5, 4, 6, 6); x.fillStyle = '#f2c49b'; x.fillRect(6, 6, 4, 4);
        x.fillStyle = '#2a1f2d'; x.fillRect(6, 7, 1, 1); x.fillRect(9, 7, 1, 1);
        x.fillStyle = '#8fd46a'; x.fillRect(5, 10, 6, 5); x.fillStyle = '#7a4e32'; x.fillRect(4, 6, 1, 6); x.fillRect(11, 6, 1, 6);
    });
    ART.window = paintSprite(16, 14, x => {
        x.fillStyle = '#7a4e32'; x.fillRect(0, 0, 16, 14); x.fillStyle = '#9fdcf5'; x.fillRect(2, 2, 12, 10);
        x.fillStyle = '#d8f2ff'; x.fillRect(3, 3, 4, 3); x.fillStyle = '#7a4e32'; x.fillRect(7, 2, 2, 10); x.fillRect(2, 6, 12, 2);
        x.fillStyle = '#e8c860'; x.fillRect(0, 12, 16, 2);
    });
    ART.plant = paintSprite(14, 18, x => {
        x.fillStyle = '#c4623a'; x.fillRect(3, 11, 8, 7); x.fillStyle = '#e08a5e'; x.fillRect(3, 11, 8, 2);
        discPx(x, 7, 7, 6, (px, py, u, v) => (-u - v + hash2(px, py, 2)) > 0.6 ? '#8ad87a' : hash2(px, py, 1) < 0.15 ? null : '#4fa84a');
    });
    ART.counter = paintSprite(48, 22, x => {
        x.fillStyle = wood[0]; x.fillRect(0, 2, 48, 8); x.fillStyle = wood[2]; x.fillRect(0, 2, 48, 2);
        x.fillStyle = wood[1]; x.fillRect(0, 10, 48, 12);
        for (let i = 4; i < 48; i += 12) { x.fillStyle = wood[3]; x.fillRect(i, 12, 8, 8); x.fillStyle = wood[0]; x.fillRect(i + 1, 13, 6, 6); }
    });
    ART.doormat = paintSprite(16, 10, x => {
        x.fillStyle = '#9a6438'; x.fillRect(1, 2, 14, 7); x.fillStyle = '#c9925a';
        for (let i = 2; i < 15; i += 2) x.fillRect(i, 3, 1, 5);
    }, false);
    ART.desk = paintSprite(32, 20, x => {
        x.fillStyle = wood[1]; x.fillRect(1, 2, 30, 9); x.fillStyle = wood[0]; x.fillRect(1, 2, 30, 2);
        x.fillStyle = wood[3]; x.fillRect(1, 11, 30, 3); x.fillRect(2, 14, 3, 6); x.fillRect(27, 14, 3, 6);
        x.fillStyle = '#fbf6ea'; x.fillRect(6, 4, 8, 5); x.fillStyle = '#2a1f2d'; x.fillRect(7, 5, 5, 1); x.fillRect(7, 7, 4, 1);
        x.fillStyle = '#e8463c'; x.fillRect(20, 3, 6, 6); x.fillStyle = '#fbf6ea'; x.fillRect(22, 5, 2, 2);
    });
    ART.chest_wood = paintSprite(16, 14, x => {
        x.fillStyle = wood[1]; x.fillRect(1, 2, 14, 11); x.fillStyle = wood[0]; x.fillRect(1, 2, 14, 4);
        x.fillStyle = '#f7d64a'; x.fillRect(7, 6, 2, 3); x.fillStyle = wood[3]; x.fillRect(1, 6, 14, 1);
    });
    ART.cellar_door = paintSprite(16, 16, x => {
        x.fillStyle = '#5a3a26'; x.fillRect(0, 0, 16, 16); x.fillStyle = '#7a4e32'; x.fillRect(1, 1, 14, 14);
        for (let i = 1; i < 15; i += 4) { x.fillStyle = '#5a3a26'; x.fillRect(i, 1, 1, 14); }
        x.fillStyle = '#9a9188'; x.fillRect(5, 6, 6, 4); x.fillStyle = '#2a1f2d'; x.fillRect(7, 7, 2, 2);
    });
    ART.blackboard = paintSprite(48, 26, x => {
        x.fillStyle = '#7a4e32'; x.fillRect(0, 0, 48, 26); x.fillStyle = '#2e4a3a'; x.fillRect(2, 2, 44, 20);
        x.fillStyle = '#e8ece4'; for (let j = 5; j < 20; j += 4) for (let i = 5; i < 42; i++) if (hash2(i, j, 4) < 0.5) x.fillRect(i, j, 1, 1);
        x.fillStyle = '#c9925a'; x.fillRect(0, 22, 48, 4);
    });
}
CONTENT_INIT.unshift(initFurniture);
CONTENT_INIT.unshift(initWorldArt);
