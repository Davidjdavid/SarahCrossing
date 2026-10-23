// Shared by the tests: a game server on a free port with its own empty data folder.
import { spawn } from 'node:child_process';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export const ROOT = path.resolve(import.meta.dirname, '..');

/** Starts server/server.mjs; `password: ''` runs it without a login. */
export async function startServer({ password = 'pw', env = {} } = {}) {
  const dataDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'sc-test-'));
  const child = spawn(process.execPath, ['server/server.mjs'], {
    cwd: ROOT,
    env: { ...process.env, PORT: '0', DATA_DIR: dataDir, SITE_PASSWORD: password, NODE_ENV: 'test', ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  const url = await new Promise((resolve, reject) => {
    child.stdout.on('data', (d) => {
      log += d;
      const m = /on (http:\/\/[\d.]+:\d+)/.exec(log);
      if (m) resolve(m[1]);
    });
    child.stderr.on('data', (d) => (log += d));
    child.on('exit', (code) => {
      fsp.rm(dataDir, { recursive: true, force: true }).catch(() => {});
      reject(new Error(`the server stopped (${code}):\n${log}`));
    });
  });
  return {
    url,
    dataDir,
    log: () => log,
    async stop() {
      child.kill('SIGTERM');
      await new Promise((r) => (child.exitCode !== null ? r() : child.once('exit', r)));
      await fsp.rm(dataDir, { recursive: true, force: true });
    },
  };
}

/** Logs in and gives back the cookie header. */
export async function login(url, password = 'pw') {
  const res = await fetch(url + '/login', { method: 'POST', body: new URLSearchParams({ password, next: '/' }), redirect: 'manual' });
  if (res.status !== 303) throw new Error(`login answered ${res.status}`);
  return res.headers.get('set-cookie').split(';')[0];
}

/** A tiny island save, like the game's, for tests that don't need a real one. */
export function fakeState(over = {}) {
  return { v: 1, seed: 'seed-' + Math.random().toString(36).slice(2), started: true, islandName: 'Test Isle', money: 800, day: 20000, startDay: 19990, stats: { playMs: 90 * 60e3 }, flags: {}, ...over };
}
