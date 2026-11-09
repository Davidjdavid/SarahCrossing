/* people and creatures, drawn from parts so each has a look of their own */

const LOOKS = {
    player: { skin: 's', hair: 'u', hat: 'cap', hatc: 'r', shirt: 'b', pants: 'B', bag: true },
    postmaster: { skin: 's', hair: 'G', hat: 'cap', hatc: 'B', shirt: 'B', pants: 'K', mustache: 'G' },
    gran: { skin: 's', hair: 'W', style: 'bun', shirt: 'P', dress: true, glasses: true },
    pip: { skin: 'S', hair: 'd', style: 'spiky', shirt: 'o', pants: 'u' },
    dot: { skin: 's', hair: 'r', style: 'bob', shirt: 'y', apron: 'w', pants: 'u' },
    fife: { skin: 's', hair: 'o', style: 'curly', shirt: 'p', dress: true },
    sev: { skin: 'S', hair: 'W', style: 'bald', shirt: 'G', pants: 'K', mustache: 'W' },
    tock: { skin: 's', hair: 'K', style: 'short', shirt: 'P', pants: 'K', goggles: true, apron: 'u' },
    guard: { skin: 's', hair: 'd', hat: 'helmet', hatc: 'g', shirt: 'R', pants: 'k' },
    marlo: { skin: 'S', hair: 'd', hat: 'sou', hatc: 'y', shirt: 'y', pants: 'B', beard: 'd' },
    grist: { skin: 's', hair: 'W', hat: 'cap', hatc: 'W', shirt: 'w', pants: 't' },
    keeper: { skin: 's', hair: 'W', style: 'bun', shirt: 'N', shawl: 'R', dress: true, glasses: true },
    son: { skin: 'S', hair: 'u', hat: 'sailor', hatc: 'w', shirt: 'w', stripes: 'B', pants: 'B' },
    miner: { skin: 's', hair: 'd', hat: 'helmet', hatc: 'y', shirt: 'u', pants: 'd', lamp: true },
    walker: { skin: 's', hair: 'o', hat: 'wide', hatc: 't', shirt: 'N', pants: 'u', pack: true },
    elder: { skin: 's', hair: 'W', hat: 'cap', hatc: 'r', shirt: 'b', pants: 'B', bag: true, beard: 'W', cane: true },
};

function drawPerson(g, o, dir, frame) {
    const col = k => C[k] || k;
    const bob = frame ? 1 : 0;
    const side = dir === 'l' || dir === 'r';
    /* feet */
    if (frame && !side) { R(g, C.k, 4, 14, 3, 2); R(g, C.k, 9, 15, 3, 1); }
    else if (frame && side) { R(g, C.k, 4, 15, 3, 1); R(g, C.k, 9, 14, 3, 2); }
    else { R(g, C.k, 4, 15, 3, 1); R(g, C.k, 9, 15, 3, 1); }
    /* legs or skirt */
    if (o.dress) blob(g, 3, 11 + bob, 10, 5 - bob, col(o.shirt), C.k, (x, y) => x >= (y < 1 ? 1 : 0) && x <= (y < 1 ? 8 : 9));
    else { R(g, C.k, 4, 12 + bob, 8, 3 - bob); R(g, col(o.pants), 5, 12 + bob, 2, 2 - bob); R(g, col(o.pants), 9, 12 + bob, 2, 2 - bob); }
    /* body */
    blob(g, 3, 8 + bob, 10, 6, col(o.shirt), C.k, roundRect(10, 6, 2));
    if (o.stripes) { R(g, col(o.stripes), 4, 10 + bob, 8, 1); R(g, col(o.stripes), 4, 12 + bob, 8, 1); }
    if (o.apron && dir !== 'u') { R(g, col(o.apron), 5, 10 + bob, 6, 3); R(g, C.k, 5, 13 + bob, 6, 0); }
    if (o.shawl) { R(g, col(o.shawl), 4, 9 + bob, 8, 2); }
    if (o.bag) {
        if (dir === 'd') { R(g, C.u, 5, 9 + bob, 1, 1); R(g, C.u, 6, 10 + bob, 1, 1); R(g, C.u, 7, 11 + bob, 1, 1); R(g, C.t, 9, 11 + bob, 3, 3); R(g, C.k, 9, 14 + bob, 3, 0); P1(g, C.u, 10, 12 + bob); }
        else if (dir === 'u') { R(g, C.u, 10, 9 + bob, 1, 1); R(g, C.u, 9, 10 + bob, 1, 1); R(g, C.u, 8, 11 + bob, 1, 1); }
        else { const bx = dir === 'r' ? 3 : 10; R(g, C.t, bx, 10 + bob, 3, 4); R(g, C.u, bx, 13 + bob, 3, 1); }
    }
    if (o.pack && dir !== 'd') R(g, C.u, dir === 'u' ? 4 : (dir === 'r' ? 2 : 11), 8 + bob, dir === 'u' ? 8 : 3, 5);
    /* arms */
    if (!side) { R(g, C.k, 2, 9 + bob, 2, 4); R(g, col(o.skin), 2, 10 + bob, 1, 2); R(g, C.k, 12, 9 + bob, 2, 4); R(g, col(o.skin), 13, 10 + bob, 1, 2); }
    else { const ax = dir === 'r' ? 8 : 6; R(g, C.k, ax, 10 + bob, 2, 3); R(g, col(o.skin), ax + (dir === 'r' ? 0 : 1), 11 + bob, 1, 1); }
    if (o.cane) { R(g, C.u, dir === 'l' ? 1 : 14, 9 + bob, 1, 7); }
    /* head */
    blob(g, 3, 0 + bob, 10, 9, col(o.skin), C.k, roundRect(10, 9, 4));
    const hy = bob;
    const hair = col(o.hair);
    /* hair */
    if (o.style !== 'bald') {
        R(g, hair, 4, 1 + hy, 8, 2);
        if (dir === 'u') { R(g, hair, 4, 1 + hy, 8, 6); R(g, hair, 3, 3 + hy, 1, 4); R(g, hair, 12, 3 + hy, 1, 4); }
        else if (side) { const bx = dir === 'r' ? 4 : 9; R(g, hair, bx, 1 + hy, 3, 5); }
        else { R(g, hair, 4, 3 + hy, 1, 2); R(g, hair, 11, 3 + hy, 1, 2); }
        if (o.style === 'spiky') { P1(g, hair, 5, hy); P1(g, hair, 8, hy); P1(g, hair, 11, hy); P1(g, C.k, 5, hy - 1 < 0 ? 0 : hy - 1); }
        if (o.style === 'bun') { blob(g, 6, -1 + hy < 0 ? 0 : hy - 1, 4, 3, hair, C.k, ellipse(2, 1.5, 2, 1.5)); }
        if (o.style === 'bob' && dir !== 'u') { R(g, hair, 3, 3 + hy, 2, 4); R(g, hair, 11, 3 + hy, 2, 4); }
        if (o.style === 'curly') { for (let i = 3; i < 13; i += 2) P1(g, hair, i, 1 + hy); R(g, hair, 3, 2 + hy, 2, 5); R(g, hair, 11, 2 + hy, 2, 5); }
    } else if (dir !== 'u') { R(g, hair, 3, 4 + hy, 1, 2); R(g, hair, 12, 4 + hy, 1, 2); }
    else { R(g, hair, 3, 4 + hy, 10, 3); }
    /* face */
    if (dir !== 'u') {
        const ex = dir === 'd' ? [6, 9] : dir === 'l' ? [5] : [10];
        for (const x of ex) R(g, C.k, x, 4 + hy, 1, 2);
        if (dir === 'd') { P1(g, C.p, 5, 6 + hy); P1(g, C.p, 10, 6 + hy); }
        if (o.glasses) { for (const x of ex) { R(g, C.c, x - 1, 4 + hy, 3, 2); P1(g, C.k, x, 5 + hy); } if (dir === 'd') R(g, C.k, 7, 4 + hy, 2, 1); }
        if (o.goggles) { for (const x of ex) { R(g, C.y, x - 1, 3 + hy, 3, 3); R(g, C.k, x, 4 + hy, 1, 1); } }
        if (o.mustache) { const m = col(o.mustache); if (dir === 'd') R(g, m, 5, 6 + hy, 6, 1); else R(g, m, dir === 'l' ? 3 : 10, 6 + hy, 3, 1); }
        if (o.beard) { const b = col(o.beard); if (dir === 'd') { R(g, b, 4, 6 + hy, 8, 2); R(g, b, 5, 8 + hy, 6, 1); } else R(g, b, dir === 'l' ? 3 : 8, 6 + hy, 5, 2); }
    }
    /* hats */
    const hc = col(o.hatc || 'r');
    if (o.hat === 'cap') { R(g, hc, 4, hy, 8, 3); R(g, C.k, 4, hy, 8, 0); if (dir === 'd') R(g, C.R, 3, 3 + hy, 10, 1); else if (dir === 'l') R(g, C.R, 1, 3 + hy, 5, 1); else if (dir === 'r') R(g, C.R, 10, 3 + hy, 5, 1); P1(g, C.w, 6, 1 + hy); }
    if (o.hat === 'helmet') { blob(g, 3, hy, 10, 5, hc, C.k, (x, y) => y < 4 || x === 0 || x === 9 ? y < 5 : y < 4); if (o.lamp) R(g, C.Y, 7, 1 + hy, 2, 2); }
    if (o.hat === 'sou') { blob(g, 2, hy, 12, 5, hc, C.k, (x, y) => y >= 3 || (x > 1 && x < 10)); }
    if (o.hat === 'sailor') { R(g, hc, 4, hy, 8, 2); R(g, C.B, 4, 2 + hy, 8, 1); }
    if (o.hat === 'wide') { R(g, hc, 2, 2 + hy, 12, 1); R(g, hc, 5, hy, 6, 2); R(g, C.k, 2, 3 + hy, 12, 1); }
}
const personCache = new Map();
function personImg(look, dir = 'd', frame = 0) {
    const key = look + dir + frame;
    if (personCache.has(key)) return personCache.get(key);
    const o = LOOKS[look] || LOOKS.player;
    const cv = mkCanvas(16, 16), g = cv.getContext('2d');
    drawPerson(g, o, dir, frame);
    personCache.set(key, cv);
    return cv;
}

/* creatures */
function slimeImg(hp, t, asleep, frame) {
    const size = hp === Infinity ? 3 : hp <= 3 ? 0 : hp <= 6 ? 1 : hp <= 9 ? 2 : 3;
    const key = `slime${size}${asleep ? 'z' : ''}${frame}`;
    return made(key, 16, 16, g => {
        const rx = [4, 5, 6, 7][size], ry = [3, 4, 5, 6][size] - (frame ? 1 : 0);
        const w = rx * 2 + (frame ? 2 : 0), h = ry * 2 + 1;
        const x0 = 8 - Math.floor(w / 2), y0 = 15 - h;
        blob(g, x0, y0, w, h, (x, y) => y < h / 3 ? C.l : C.n, C.k, (x, y) => ellipse(w / 2, h, w / 2, h)(x, y));
        const ey = y0 + Math.floor(h / 2);
        if (asleep) { R(g, C.k, x0 + Math.floor(w / 2) - 3, ey, 2, 1); R(g, C.k, x0 + Math.floor(w / 2) + 1, ey, 2, 1); }
        else { R(g, C.k, x0 + Math.floor(w / 2) - 3, ey - 1, 1, 2); R(g, C.k, x0 + Math.floor(w / 2) + 2, ey - 1, 1, 2); }
        R(g, C.w, x0 + 2, y0 + 2, 2, 1);
    });
}
function rattleImg(frame) {
    return made('rattle' + frame, 16, 16, g => {
        for (let i = 0; i < 3; i++) { R(g, C.k, 2 + i * 4 + (frame && i % 2 ? 1 : 0), 13, 1, 3); R(g, C.k, 13 - i * 4 - (frame && i % 2 ? 1 : 0), 13, 1, 3); }
        blob(g, 2, 4, 12, 10, (x, y) => (x % 4 === 0 && y > 2) ? C.W : C.w, C.k, ellipse(6, 5, 6, 5));
        R(g, C.G, 7, 5, 2, 8);
        blob(g, 4, 1, 8, 6, C.w, C.k, ellipse(4, 3, 4, 3));
        R(g, C.R, 5, 3, 2, 2); R(g, C.R, 9, 3, 2, 2);
    });
}
function golemImg(awake, wound) {
    return made(`golem${awake}${wound}`, 16, 16, g => {
        blob(g, 1, 2, 14, 14, (x, y) => (x + y) % 5 === 0 ? C.G : C.g, C.k, roundRect(14, 14, 3));
        R(g, C.G, 3, 9, 10, 1); R(g, C.G, 7, 10, 2, 5);
        const eye = wound ? C.r : awake ? C.y : C.G;
        R(g, eye, 4, 5, 3, 2); R(g, eye, 9, 5, 3, 2);
        R(g, C.N, 2, 3, 3, 1); R(g, C.N, 11, 13, 3, 1);
    });
}
function catImg(heavy) {
    return made('cat' + heavy, 16, 16, g => {
        const w = heavy ? 15 : 11, x0 = heavy ? 0 : 3;
        blob(g, x0, heavy ? 5 : 8, w, heavy ? 11 : 8, (x, y) => (x % 4 === 1) ? C.t : C.o, C.k, roundRect(w, heavy ? 11 : 8, 4));
        const hx = x0 + w - 8;
        blob(g, hx, heavy ? 3 : 5, 8, 7, C.o, C.k, roundRect(8, 7, 3));
        P1(g, C.k, hx + 1, heavy ? 2 : 4); P1(g, C.k, hx + 6, heavy ? 2 : 4);
        R(g, C.k, hx + 2, heavy ? 6 : 8, 1, 1); R(g, C.k, hx + 5, heavy ? 6 : 8, 1, 1); P1(g, C.p, hx + 3, heavy ? 7 : 9);
        R(g, C.o, x0 - (heavy ? 0 : 2), heavy ? 13 : 13, 3, 2);
    });
}
function chickImg(stage, frame) {
    return made('chick' + stage + frame, 16, 16, g => {
        if (stage === 'egg') { blob(g, 4, 4, 8, 11, C.w, C.k, ellipse(4, 5.5, 4, 5.5)); P1(g, C.T, 6, 8); P1(g, C.T, 9, 11); P1(g, C.T, 8, 6); return; }
        if (stage === 'chick') {
            const b = frame ? 1 : 0;
            blob(g, 4, 6 + b, 9, 9 - b, C.y, C.k, ellipse(4.5, 4.5, 4.5, 4.5));
            R(g, C.k, 6, 9 + b, 1, 1); R(g, C.k, 10, 9 + b, 1, 1); R(g, C.o, 8, 10 + b, 2, 1);
            R(g, C.o, 6, 15, 1, 1); R(g, C.o, 10, 15, 1, 1); R(g, C.Y, 5, 8 + b, 2, 1);
            return;
        }
        blob(g, 2, 4, 12, 10, C.b, C.k, ellipse(6, 5, 6, 5));
        blob(g, 8, 1, 7, 7, C.b, C.k, ellipse(3.5, 3.5, 3.5, 3.5));
        R(g, C.k, 11, 3, 1, 1); R(g, C.o, 14, 4, 2, 1); R(g, C.B, 3, 7, 6, 3); R(g, C.c, 5, 10, 5, 2);
    });
}
function critterImg(look, frame) {
    return made('crit' + look + frame, 16, 16, g => {
        if (look === 'squirrel') {
            blob(g, 1, 2, 7, 12, C.o, C.k, ellipse(3.5, 6, 3.5, 6)); R(g, C.T, 3, 4, 2, 6);
            blob(g, 6, 6, 8, 9, C.o, C.k, roundRect(8, 9, 3)); blob(g, 8, 2, 7, 6, C.o, C.k, roundRect(7, 6, 2));
            R(g, C.k, 12, 4, 1, 1); P1(g, C.k, 9, 1); R(g, C.T, 9, 9, 4, 4);
        } else if (look === 'ghost' || look === 'clerk') {
            const b = frame ? 1 : 0;
            blob(g, 3, 1 + b, 10, 14, (x, y) => y > 10 ? C.v : C.w, C.g, (x, y) => roundRect(10, 14, 5)(x, y) && !(y > 11 && x % 3 === (frame ? 1 : 0)));
            R(g, C.k, 5, 6 + b, 2, 2); R(g, C.k, 9, 6 + b, 2, 2); R(g, C.G, 7, 10 + b, 2, 1);
            if (look === 'clerk') { R(g, C.B, 4, 1 + b, 8, 3); R(g, C.k, 3, 4 + b, 10, 1); }
        } else if (look === 'hourling') {
            const b = frame ? 1 : 0;
            blob(g, 2, 1 + b, 12, 12, C.m, C.k, ellipse(6, 6, 6, 6));
            blob(g, 4, 3 + b, 8, 8, C.w, C.K, ellipse(4, 4, 4, 4));
            R(g, C.k, 7, 4 + b, 1, 4); R(g, C.k, 7, 7 + b, 3, 1);
            R(g, C.k, 4, 13 + b, 2, 3 - b); R(g, C.k, 10, 13 + b, 2, 3 - b);
        }
    });
}
