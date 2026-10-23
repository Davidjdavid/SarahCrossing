// The deploy scripts: they parse, and setup.sh only ever changes its own lines of a shared Caddyfile.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { fakeState, login, ROOT, startServer } from './helpers.mjs';

let tmp;
before(() => (tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-deploy-'))));
after(() => fs.rmSync(tmp, { recursive: true, force: true }));

/** What setup.sh would make the Caddyfile, from one that starts as `text` (null: no file). */
function caddyfile(text, domain = 'sarahcrossing.com', instance = 'live') {
  const file = path.join(tmp, 'Caddyfile');
  fs.rmSync(file, { force: true });
  if (text !== null) fs.writeFileSync(file, text);
  return execFileSync('bash', [path.join(ROOT, 'deploy/setup.sh'), '--caddyfile-only', domain, file], { encoding: 'utf8', env: { ...process.env, INSTANCE: instance } });
}

test('the deploy scripts are valid bash', () => {
  for (const f of ['setup.sh', 'install-release.sh', 'copy-islands.sh']) execFileSync('bash', ['-n', path.join(ROOT, 'deploy', f)]);
});

test('the beta site has its own block and port, and live and beta keep out of each other', () => {
  const beta = caddyfile(null, 'beta.sarahcrossing.com', 'beta');
  assert.match(beta, /^# BEGIN sarahcrossing-beta /);
  assert.match(beta, /^beta\.sarahcrossing\.com \{\n\tencode zstd gzip\n\treverse_proxy 127\.0\.0\.1:8091\n\}$/m);
  assert.doesNotMatch(beta, /www\./);
  // live on a server that has beta: beta stays; beta on a server that has live: live stays
  const both = caddyfile(beta, 'sarahcrossing.com', 'live');
  assert.ok(both.startsWith(beta + '\n# BEGIN sarahcrossing ('), both);
  assert.equal(caddyfile(both, 'beta.sarahcrossing.com', 'beta').split('# BEGIN').length - 1, 2);
  const again = caddyfile(caddyfile(both, 'beta.sarahcrossing.com', 'beta'), 'sarahcrossing.com', 'live');
  assert.match(again, /reverse_proxy 127\.0\.0\.1:8090/);
  assert.match(again, /reverse_proxy 127\.0\.0\.1:8091/);
  assert.equal(again.split('# BEGIN').length - 1, 2);
});

test('a new server gets just this site', () => {
  const out = caddyfile(null);
  assert.match(out, /^# BEGIN sarahcrossing/);
  assert.match(out, /^sarahcrossing\.com \{\n\tencode zstd gzip\n\treverse_proxy 127\.0\.0\.1:8090\n\}$/m);
  assert.match(out, /^www\.sarahcrossing\.com \{\n\tredir https:\/\/sarahcrossing\.com\{uri\} permanent\n\}$/m);
  assert.match(out, /# END sarahcrossing\n$/);
});

test("Ubuntu's welcome page is replaced", () => {
  const stock = ':80 {\n\t# Set this path to your site\'s directory.\n\troot * /usr/share/caddy\n\n\tfile_server\n}\n';
  const out = caddyfile(stock);
  assert.doesNotMatch(out, /usr\/share\/caddy/);
  assert.equal(out, caddyfile(null));
  assert.equal(caddyfile(':80\n'), caddyfile(null));
});

test("another game's site on the same server is kept, and running again changes nothing", () => {
  const other = '# Written by deploy/setup.sh; changes here are replaced on the next deploy.\npaperdrhazelwood.com, www.paperdrhazelwood.com {\n\tencode gzip\n\treverse_proxy 127.0.0.1:8080\n}\n';
  const once = caddyfile(other);
  assert.ok(once.startsWith(other + '\n# BEGIN sarahcrossing'), once);
  assert.equal(caddyfile(once), once, 'the same again');
  // a new domain replaces this site's block, nothing else
  const moved = caddyfile(once, 'example.org');
  assert.ok(moved.startsWith(other));
  assert.doesNotMatch(moved, /sarahcrossing\.com/);
  assert.equal((moved.match(/# BEGIN sarahcrossing/g) || []).length, 1);
});

test('this site in the middle of a Caddyfile moves to the end, without leaving a gap', () => {
  const block = caddyfile(null);
  const out = caddyfile(`a.example {\n\trespond "a"\n}\n\n${block}\nb.example {\n\trespond "b"\n}\n`);
  assert.ok(out.startsWith('a.example {\n\trespond "a"\n}\n\nb.example {\n\trespond "b"\n}\n\n# BEGIN'), out);
});

test('the server reads its password from a file, as the server setup has it', async () => {
  const file = path.join(tmp, 'password');
  fs.writeFileSync(file, 'sea glass\n');
  const srv = await startServer({ password: '', env: { SITE_PASSWORD_FILE: file, NODE_ENV: 'production' } });
  try {
    const cookie = await login(srv.url, 'sea glass');
    const res = await fetch(srv.url + '/api/islands', { method: 'POST', headers: { cookie, 'X-Sarah': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ state: fakeState() }) });
    assert.equal(res.status, 201);
  } finally {
    await srv.stop();
  }
});
