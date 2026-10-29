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
