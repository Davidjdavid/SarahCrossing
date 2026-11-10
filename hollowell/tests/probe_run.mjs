// The polish run (POLISH.md): the whole scripted game, from the title to the credits, with every step drawn and probed
// (src/26_probe.js). Prints what the probe found; writes the full report as JSON (argument: where; default the
// scratchpad's probe_report.json or ./probe_report.json).
import fs from 'node:fs';
import { loadGame } from './harness.mjs';
import { LEG1, LEG2, LEG3, LEG4, LEG5, LEG6, LEG7, LEG8, LEG9 } from './legs.mjs';

const out = process.argv[2] || 'probe_report.json';
const HW = loadGame();
const P = HW.probe(true); HW.drawEveryStep(true);
const chain = name => { const H0 = loadGame(); H0.preset(name); const id = H0.G.map.id, p = H0.player(); HW.warp(id, p.tx, p.ty); HW.step(5); HW.skipTalk(); };
const legs = [LEG1, LEG2, LEG3, LEG4, LEG5, LEG6, LEG7, LEG8, LEG9];
const failures = [];
const t0 = Date.now();
legs.forEach((leg, i) => {
    try { leg(HW, i ? chain : undefined); }
    catch (e) { failures.push(`leg ${i + 1}: ${e.message.split('\n')[0]}`); }
    console.log(`leg ${i + 1} done: ${P.frameN} frames probed, ${P.log.size} kinds of issue so far (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
});
const r = P.report();
r.errors = HW.ERRORS.slice(); r.failures = failures;
fs.writeFileSync(out, JSON.stringify(r, null, 1));
console.log(`\n${r.frames} frames; ${r.issues.length} kinds of issue; ${r.errors.length} errors; ${failures.length} leg failures`);
for (const x of r.issues) console.log(`[${x.kind}] x${x.n} ${x.key} -- ${x.where}${x.detail ? ' -- ' + x.detail : ''}`);
for (const f of failures) console.log('FAIL ' + f);
for (const e of r.errors.slice(0, 10)) console.log('ERROR ' + e);
