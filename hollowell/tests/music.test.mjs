// The music (src/09_audio.js, src/40*_music*.js): every song well formed (each voice the song's length or a part of
// it, every note one the synth can play and in a sensible range, a loop a sensible length), no two voices a semitone
// apart in the Makings' and the Unfinished House's tunes, each of those two places playing its own, and a long stay
// in one room thinning the tune out for a pass, back at a solved step or a new room (never in a fight or a scene).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const toks = c => c.n.replace(/\|/g, ' ').trim().split(/\s+/);
const secs = s => s.len * 60 / s.bpm / (s.div || 4);

test('every song: voices in step, notes in range, a sensible loop', () => {
    const HW = loadGame();
    const SONGS = HW.global('SONGS'), parseSong = HW.global('parseSong'), noteFreq = HW.global('noteFreq');
    for (const [id, s] of Object.entries(SONGS)) {
        if (id === 'silence') continue;
        s._parsed = false; parseSong(s);
        s._ch.forEach((c, k) => {
            assert.equal(s.len % c.ev.length, 0, `${id} voice ${k}: ${c.ev.length} steps against the song's ${s.len}`);
            if (c.drum) { for (const t of toks(c)) assert.ok('.-kshH'.includes(t) && t.length === 1, `${id} drums: ${t}`); return; }
            for (const t of toks(c)) if (t !== '.' && t !== '-') {
                const f = noteFreq(t) * Math.pow(2, (c.tr || 0) / 12);
                assert.ok(f >= 41 && f <= 1600, `${id} voice ${k}: ${t} (${f.toFixed(0)} Hz)`);
            }
            assert.ok(c.vol > 0 && c.vol <= 0.25, `${id} voice ${k}: volume ${c.vol}`);
        });
        assert.ok(secs(s) >= 20 && secs(s) <= 120, `${id}: a ${secs(s).toFixed(1)} s loop`);
    }
    /* the long stays have room to breathe */
    for (const id of ['makings', 'unfinished']) assert.ok(secs(SONGS[id]) >= 60 && secs(SONGS[id]) <= 110, `${id}: ${secs(SONGS[id]).toFixed(1)} s`);
});

test('the Makings\' and the Unfinished House\'s tunes: no two voices a semitone apart', () => {
    const HW = loadGame();
    const SONGS = HW.global('SONGS'), noteFreq = HW.global('noteFreq');
    const midi = t => Math.round(12 * Math.log2(noteFreq(t) / 440)) + 69;
    for (const id of ['makings', 'unfinished']) {
        const s = SONGS[id], len = Math.max(...s.ch.map(c => toks(c).length));
        /* what each voice is sounding at each step, and whether it starts there */
        const at = s.ch.filter(c => !c.drum).map(c => {
            const t = toks(c), v = [];
            for (let i = 0, cur = null; i < len; i++) { const x = t[i % t.length]; cur = x === '.' ? null : x === '-' ? cur : { m: midi(x), on: i }; v.push(cur && { m: cur.m, on: cur.on === i }); }
            return v;
        });
        for (let i = 0; i < len; i++) for (let a = 0; a < at.length; a++) for (let b = a + 1; b < at.length; b++) {
            const x = at[a][i], y = at[b][i];
            if (!x || !y || (!x.on && !y.on)) continue;
            const d = Math.abs(x.m - y.m) % 12;
            assert.ok(d !== 1 && d !== 11, `${id}, step ${i}: voices ${a} and ${b} a semitone apart`);
        }
    }
});

test('the Makings and the Unfinished House play tunes of their own (and the Underside its own)', () => {
    const HW = loadGame();
    const AREAS = HW.global('AREAS'), M = HW.global('Music');
    const makings = Object.keys(AREAS).filter(id => /^making\d+$/.test(id));
    assert.ok(makings.length >= 9, 'every Little House');
    for (const id of makings) assert.equal(AREAS[id].music, 'makings', id);
    assert.equal(AREAS.unfinished.music, 'unfinished');
    assert.equal(AREAS.underside.music, 'underside');
    HW.preset('afterD7'); HW.step(10); HW.skipTalk();
    HW.warp('making1', 3, 16); HW.step(10); HW.skipTalk();
    assert.equal(M.playing, 'makings', 'in a Little House');
    HW.warp('unfinished', 29, 42); HW.step(10); HW.skipTalk();
    assert.equal(M.playing, 'unfinished', 'in the Unfinished House');
    assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
});

/* a pretend sound card: the time is ours, and each note scheduled is written down */
function fakeAudio(HW) {
    const A = HW.global('Audio'), M = HW.global('Music'), notes = [];
    Object.assign(A, { ok: true, ctx: { currentTime: 0 }, tone: (o, t, f, d, wave, v) => notes.push({ t, wave, v }), hit: () => {} });
    M.newBus = () => {}; M.bus = null;
    const run = s => { const end = A.ctx.currentTime + s; while (A.ctx.currentTime < end) { A.ctx.currentTime += 1 / 60; M.tick(); } };
    return { A, M, notes, run };
}

test('a long stay thins the tune for a pass; a solved step, a new room or a scene brings it back; a fight never thins', () => {
    const HW = loadGame();
    HW.preset('afterD7'); HW.step(10); HW.skipTalk();
    HW.warp('making1', 3, 16); HW.step(10); HW.skipTalk();
    const { A, M, notes, run } = fakeAudio(HW);
    const S = HW.global('SONGS'), s = S.makings;
    M.playing = null; M.play('makings');
    const loop = secs(s), t0 = M.next - secs(s) / s.len / 2, lead = n => n.wave === s.ch[0].wave && n.v === s.ch[0].vol;
    const leadIn = p => notes.filter(n => lead(n) && n.t >= t0 + p * loop && n.t < t0 + (p + 1) * loop).length;
    assert.ok(M.THIN_AFTER > loop, 'the first passes are always whole');
    run(loop * 4 + 1);
    const passes = [0, 1, 2, 3].map(leadIn);
    const thinPass = Math.ceil(M.THIN_AFTER / loop);
    passes.forEach((n, p) => p === thinPass ? assert.equal(n, 0, `pass ${p}: the tune rests`) : assert.ok(n > 20, `pass ${p}: the tune plays (${n})`));
    assert.ok(notes.some(n => n.t >= t0 + thinPass * loop && n.t < t0 + (thinPass + 1) * loop && n.wave === 'triangle'), 'the bass goes on under it');

    /* the next thin pass, then a door opening: back at the next beat */
    while (!M.thin) run(1);
    run(10);
    assert.equal(M.thin, true, 'resting');
    HW.global('Sfx').play('door');
    run(0.7);
    assert.equal(M.thin, false, 'a solved step: back');
    const back = A.ctx.currentTime;
    run(loop / 3);
    assert.ok(notes.some(n => lead(n) && n.t >= back), 'the tune plays again');

    /* a new room counts too */
    while (!M.thin) run(1);
    const Cam = HW.global('Cam'), room = Cam.room;
    Cam.room = Object.assign({}, room); run(0.7); Cam.room = room;
    assert.equal(M.thin, false, 'a new room: back');

    /* a scene keeps it whole however long it goes on */
    const Script = HW.global('Script');
    Script.run(function* () { for (;;) yield 1; });
    run(loop * 5);
    assert.equal(M.thin, false, 'never thin in a scene');
    Script.clear();

    /* a fight never thins */
    notes.length = 0;
    M.playing = null; M.play('boss');
    const b = S.boss, bt0 = M.next - secs(S.boss) / S.boss.len / 2, bl = secs(b);
    run(Math.max(M.THIN_AFTER * 3, bl * 8));
    for (let p = 0; p < Math.floor((A.ctx.currentTime - bt0) / bl) - 1; p++)
        assert.ok(notes.some(n => n.wave === b.ch[0].wave && n.v === b.ch[0].vol && n.t >= bt0 + p * bl && n.t < bt0 + (p + 1) * bl), `the fight's pass ${p} whole`);
    assert.equal(HW.ERRORS.length, 0, HW.ERRORS.join('\n'));
});
