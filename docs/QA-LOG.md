# QA log

The testing before Sarah Crossing goes live (from 29 October). Every problem found goes here, with where it is, how to
make it happen, what shows it, how bad it is, and whether it's fixed and checked again.

- **Severity:** blocker (can't play on, or a save is hurt) · major (something doesn't work, or looks badly wrong) ·
  medium (works, but wrong or confusing) · minor (a small look or wording thing).
- **Checked:** how a fix was confirmed: *browser* (played or looked at in a real browser, with a screenshot or a test
  that drives the page), *code* (a test or script checks it, nothing looked at), or *not yet*.
- The QA room (`?qa` on beta) is where it's tested: a throwaway island with tools to go anywhere and set any time, day,
  weather, friendship or unlock. Its Notes tab keeps problems found while playing, with where and when; they're copied here.

| # | Problem | Where | How to make it happen | Evidence | Severity | Fixed | Checked |
|---|---------|-------|-----------------------|----------|----------|-------|---------|
| 1 | A merge left conflict markers in the game's code, so the game wouldn't run | 6m_specials.js (the specials' unlock check) | Build after merging the arcade work | `npm test`: "the game code ... is valid JavaScript" failed | blocker | yes (61c9585) | code: `npm test` 59/59 |
| 2 | Four tests still expected the game as it was before 29 October (neighbors with no likes of their own; every outdoor piece in four colors; over 90 talk options, before "Need anything?" went) | tests/e2e.test.mjs | Run the whole e2e file after the merges | 98/102 passed | minor (tests only) | yes (b7c4663) | code: the four tests pass |
| 3 | The talk prompt check could miss when another neighbor walked over to say hello and stood in front for a frame | tests/e2e.test.mjs, the head icons test | Only in a full run, now and then | 101/102 passed; it passes alone | minor (test only) | yes (2635754) | code: passes alone; full run pending |
| 4 | Sarah's sweater: the sleeve's rounded end ran on past the cuff into the mitten hand and showed through it | 33ka_doll_kit.js (the doll kit's long sleeves) | Any long-sleeved outfit in the new look, close up | David's note; the kit's geometry (the sleeve's end cap reaches 2 cm under the cuff's bottom) | medium | yes (83e5725: the sleeve stops inside the cuff) | browser: close-ups standing, cheering and watering, the hands come cleanly out of the cuffs |
| 5 | Footprints in the sand were made but too small and faint to see (7 by 4 pixels, dark at 42% on the rippled sand) | 33x_env_steps.js | Walk on the beach in the new look | A probe kept the prints: 14 made, nothing visible until drawn in solid red | major (the feature looked missing) | yes: half as big again, stronger, a paler rim like sand pressed in | browser: a trail of left and right prints behind Sarah |
| 6 | The To-do app, with no favors, still said to ask around with "Need anything?", which went on 29 October | 6n_requests.js `appTasks` | Open the phone's To-do with no favor going | QA sweep 1 screenshot (005-app_tasks) | minor | yes: "Neighbors ask when they need a hand, so stop and chat now and then." | code: the text; sweep 1 rerun |
