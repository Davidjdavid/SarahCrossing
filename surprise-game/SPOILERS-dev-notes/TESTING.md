# ⚠️ SPOILERS — How the game is tested ⚠️

| Command | What it does |
|---------|--------------|
| `node tools/check-world.mjs` | Every map is 16×11; exits line up in both directions; doors have somewhere in front of them; entries/returns aren't inside walls; ids are unique. |
| `tests/rules.test.mjs` | ~30 rule tests: conservation (no taking empty-handed), reach, push weights, sinking/floating/rafts, plates and gates, cracks and falling, addresses (0 = lighthouse, 01, unknown → Nowhere, room 9 only when built), ages (0 not yet, 9 ruin, no materializing on someone), rotten bridges, parcels, monster drops, golem wind-up, counters carrying into unreachable drums and overflowing, the bell lighting the lamp, time bands, the road's length, mirror flip, the chick, the hollow, undo/restart exactness, cookies, unborn, the far shore. |
| `tests/walkthrough.test.mjs` | A bot (`tests/bot.mjs`, path-finding + swaps by name) plays the whole intended route from waking up to the lamp. |
| `tests/secrets.test.mjs` | Every one of the 9 stamps is obtained by a scripted route; the honest-walk stamp is refused after a milestone swap. |
| `tests/fuzz.test.mjs` | 6 seeds × 1500 random actions (moves, any swap target with any pocket slot, waits, random teleports). After every action: invariants (in bounds, valid digits, never inside something solid, no NaN road) and **undo restores the exact previous state**, then the action is redone. Found a real bug (undo through doors). |
| `tests/e2e/smoke.test.mjs` | Headless Chromium: title → new game, the first swap by keys, every room drawn by day / night / eerie with spectacles and watch, pause/album/map, and the ending from the bell to the credits and back into play — no console errors. |

Design judgement still matters more than green tests: the tests only prove nothing is
broken or unreachable. Playtest notes (from screenshots and scripted runs) are in
`DESIGN.md`'s changelog section.
