// All of Seldom's checks: build, the laws one by one, then the whole game by the bot.
// node seldom/tests/run.mjs
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import url from 'node:url';
const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const run = (args) => execFileSync(process.execPath, args, { stdio: 'inherit', cwd: path.join(HERE, '..', '..') });
run([path.join(HERE, '..', 'build.mjs')]);
run(['--test', path.join(HERE, 'laws.test.mjs')]);
run([path.join(HERE, 'playthrough.mjs')]);
console.log('seldom: all checks passed');
