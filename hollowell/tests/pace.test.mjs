// Frame pacing (src/90_main.js Pace): steps per screen refresh at common refresh rates, with the jitter real screens have.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

/* refresh times for a screen at hz with +-jit ms of jitter (deterministic), for secs seconds */
function times(hz, jit, secs, seed = 1) {
    let s = seed; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647) * 2 - 1;
    const out = []; for (let i = 0; i <= hz * secs; i++) out.push(i * 1000 / hz + r() * jit + 1000);
    return out;
}
function run(hz, jit, secs = 10) {
    const HW = loadGame(), P = HW.global('Pace');
    P.last = null; P.acc = 0; P.hist = [];
    return times(hz, jit, secs).map(t => P.frame(t)).slice(8);     /* (after it settles) */
}

test('60 Hz, with a millisecond of jitter: exactly one step every refresh (no 0-then-2 stutter)', () => {
    for (const hz of [60, 59.94, 60.05]) {
        const n = run(hz, 1.0);
        assert.ok(n.every(k => k === 1), `${hz} Hz: ${[...new Set(n)]}`);
    }
});

test('120 Hz: a step every other refresh, evenly; 144 Hz and 75 Hz: never two in one refresh, and the right rate', () => {
    const n = run(120, 0.3);
    for (let i = 1; i < n.length; i++) assert.notEqual(n[i], n[i - 1], 'alternating');
    for (const hz of [144, 75, 165]) {
        const m = run(hz, 0.3, 20);
        assert.ok(m.every(k => k <= 1), `${hz}: at most one`);
        const rate = m.reduce((a, b) => a + b, 0) / (m.length / hz);
        assert.ok(Math.abs(rate - 60) < 0.5, `${hz}: ${rate.toFixed(2)} steps a second`);
    }
});

test('30 Hz (a slow machine): two steps every refresh; a long pause costs one step, not a burst', () => {
    const n = run(30, 1.0);
    assert.ok(n.every(k => k === 2), [...new Set(n)].join());
    const HW = loadGame(), P = HW.global('Pace');
    P.last = null; P.frame(1000); P.frame(1016.7);
    assert.equal(P.frame(9000), 1, 'one step after a long pause');
});
