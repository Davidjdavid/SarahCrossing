# HOLLOWELL: Polish campaign

Started 2026-11-10 at David's request, after the game was complete: "a super thorough check", "a full playthrough
actually simulated live in a working browser, fix everything found, another playthrough, check for more", "pretend you
are a game critic", "room for better puzzle rewrites or dialogue tweaks"; weeks are fine. He is not playing it during
the campaign. Updates to him stay spoiler-free (general terms only).

A scheduled check-in (`trig_015MWHhTYQ5hXbEif7uxmLAS`, every four hours, fires into this session) carries the campaign
on; delete it when the exit criteria below are all met.

## What the earlier games taught (David's playtests)
The kinds of problems he found once he played: see "Past playtest catalogue" below (filled from the histories of the
earlier games in Davidjdavid/SarahCrossing, /JRPG, /PaperDrHazelwood, /Settlers). Known from Sarah Crossing's notes:
walking stutter on high-refresh screens (steps landing 0, 2, 0, 2 to a refresh), choppy frame rate in busy places, a
roof vanishing at the screen's top edge, a grainy night sky, people facing the wrong way at counters, things hovering.

## Phases
1. **Catalogue** the kinds of bugs his playtests found in earlier games; turn them into checks (below).
2. **Tooling** (debug-only, never changes play):
   - the probe (`src/26_probe.js`): every drawn frame checked for invalid colours, missing sprites, alpha or transform
     state left behind, NaN positions, text with leftovers ("undefined", "NaN", stray braces), people and things standing
     inside walls or each other, the player inside a solid, slow frames;
   - frame pacing: the main loop driven with 60, 75, 120, 144 Hz timings (with jitter) and the steps per refresh measured;
   - scaling: crisp whole device pixels at devicePixelRatio 1, 1.25, 1.5, 2 and odd window sizes;
   - text fit: every string the game can show measured in its own box (dialogue, signs, choices, toasts, banners, menus,
     journal, item names), with the longest name a player can type;
   - placement audit: every spawn, route and door checked against the map.
3. **Live playthrough #1**: the whole game in real Chromium, every frame drawn and probed, snapshots at every room entry,
   dialogue, notice and on a timer; agents review the snapshots in batches for visual bugs.
4. **Clarity and critique**: blind-player reviews of every dungeon (only what's on screen), a critic comparing it with
   the best of the genre (fun, pacing, tedium, fairness, story clarity, foreshadowing), a dialogue pass (voice, typos,
   length); a ranked list of improvements.
5. **Fix rounds**: every finding fixed (with a regression test where it can have one); puzzle and dialogue rewrites
   where they help; audio checked (levels, clipping, how long each tune loops).
6. **Live playthrough #2, #3...** until a whole run turns up nothing new; final verification.

## Exit criteria (all must hold)
- [ ] Two consecutive full live playthroughs: no errors, no unexplained probe anomalies, and snapshot review finds
      nothing new above cosmetic.
- [ ] Text-fit audit passes for every string (longest player name included).
- [ ] Placement audit passes: nobody and nothing starts in or walks through a solid; no two things share a tile.
- [ ] Frame pacing: at 60 Hz (with jitter) every refresh gets exactly one step; at 120/144 Hz the pattern is as even
      as it can be; the busiest scenes render well under budget with the CPU slowed 4x.
- [ ] Crisp pixels at devicePixelRatio 1, 1.25, 1.5, 2 and odd window sizes (checked on screenshots).
- [ ] Every main-path puzzle room judged fair by a blind reviewer (or rewritten); the goal line always says where next.
- [ ] Critic's ranked list: every item done or decided against (with the reason) below.
- [ ] Dialogue pass done (typos, voice, overlong lines).
- [ ] Audio: no clipping; levels balanced between tunes and effects; no tune loops so short it wears.
- [ ] `npm test` and `node tests/browser.mjs` pass; docs updated.

## Past playtest catalogue
(to be filled from the research)

## Findings log
| # | Found by | What (player's view) | Status |
|---|---|---|---|
| 1 | reading the engine | The main loop took 0 or 2 steps on half of all refreshes of a 60 Hz screen with even 0.3 ms of jitter (measured: 149/305/147 refreshes with 0/1/2 steps): constant judder while walking, the stutter Sarah Crossing had | fixed: `Pace` (src/90_main.js) averages and snaps refresh times; tests/pace.test.mjs (60, 59.94, 60.05 Hz all exactly one step a refresh; 120 Hz alternating; 144/75/165 Hz never two) |
| 2 | reading the engine | The screen's scale was chosen in CSS pixels: at 125%/150%/175% Windows scaling game pixels landed on uneven numbers of screen pixels (shimmer while scrolling), and the canvas could start on a fraction of a pixel | fixed: the game draws at 320x180 and is copied to a window-sized canvas at a whole number of real pixels per game pixel (Gfx.present); browser check `scaling` reads back real screenshots at 1x to 2x and measures every pixel run |
