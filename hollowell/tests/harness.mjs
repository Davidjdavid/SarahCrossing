// Loads the built game (dist/hollowell.js) into a fresh sandbox with no page: the real game code, headless.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'dist', 'hollowell.js'), 'utf8');

export function loadGame() {
    const store = new Map();
    const sandbox = {
        console, Math, JSON, Date, Map, Set, Array, Object, String, Number, Boolean, Error, Proxy, Promise,
        Uint8Array, Uint8ClampedArray, Float32Array, Int32Array, Buffer, setTimeout, clearTimeout,
        unescape, escape, encodeURIComponent, decodeURIComponent, parseInt, parseFloat, isNaN, Infinity, NaN,
        localStorage: {
            getItem: k => store.has(k) ? store.get(k) : null,
            setItem: (k, v) => store.set(k, String(v)),
            removeItem: k => store.delete(k),
        },
        performance: { now: () => Date.now() },
    };
    sandbox.globalThis = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(SRC, sandbox, { filename: 'hollowell.js' });
    const HW = sandbox.HW;
    HW._store = store;
    return HW;
}
