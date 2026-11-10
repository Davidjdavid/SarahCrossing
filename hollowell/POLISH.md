# HOLLOWELL: Polish campaign

Started 2026-11-10 at David's request, after the game was complete: "a super thorough check", "a full playthrough
actually simulated live in a working browser, fix everything found, another playthrough, check for more", "pretend you
are a game critic", "room for better puzzle rewrites or dialogue tweaks"; weeks are fine. He is not playing it during
the campaign. Updates to him stay spoiler-free (general terms only).

A scheduled check-in (`trig_015MWHhTYQ5hXbEif7uxmLAS`, every four hours, fires into this session) carries the campaign
on; delete it when the exit criteria below are all met.

**The game's page** (David asked for a link, the game in its own frame with instructions beside it, like his first game):
https://claude.ai/artifact/4cwxT315Taw5N4ewmxertc (private to him). Built by `node tools/build.mjs` into
`dist/hollowell_page.html` from `tools/page.html`; republish that same file after every fix round (same URL; from a later
session pass the URL as `url`). It keeps saves in the browser and, signed in, with his account (the `db` capability,
`data/users/<id>/<key>`, newest wins), sizes the screen to whole game pixels, and has Sound, Screen filter and Full
screen buttons and a controller status line. He asked for: a controller (and keybinding in Options), a CRT filter
option, no touch controls, and text that never overflows or gets cut off.

## What the earlier games taught (David's playtests)
The kinds of problems he found once he played: see "Past playtest catalogue" below (from the histories of the earlier
games; the detailed notes stay out of this public repository). Known from Sarah Crossing's own notes here: walking
stutter (steps landing 0, 2, 0, 2 to a refresh), choppy frame rate in busy places, a roof vanishing at the screen's top
edge, a grainy night sky, people facing the wrong way at counters, things hovering.

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
The kinds of problems his playtests of earlier games turned up, most frequent or most annoying first, and how each is
hunted here:
1. **The thing that matters hidden or on the wrong layer** (a marker under trees, a bridge under animated water, a
   door under the screen's curved edge). Here: every door, chest, pickup, sign, switch and person checked for being
   drawn under something; snapshots reviewed.
2. **Stutter and uneven frame pacing.** Here: `Pace` + tests/pace.test.mjs (fixed, see findings 1); first-draw hitches
   (pictures made the first time they're needed) measured.
3. **People or things inside walls and furniture, or walking where they shouldn't.** Here: the probe (every frame), a
   static placement audit over every map and story stage, critter routes (findings 3).
4. **Not knowing what to do** (an ambiguous hint, a refusal with no reason, nothing pointing to the first destination).
   Here: the goal line checked at every story stage; every refusal message read; blind-player reviews.
5. **Colours wrong on his hardware** (a Mac's GPU path swapped red and blue in a game that used WebGL). Here: no WebGL,
   no raw pixel byte order anywhere (checked); 2D canvas only. Low contrast and look-alike colours: reviewed.
6. **Text overflowing its box, or text that shouldn't be there** (raw ids, stale directions). Here: the probe (leftovers,
   missing glyphs), the text-fit audit, every line read.
7. **Repetitive or flat writing; jokes that wear.** Here: a dialogue pass; every repeating line counted.
8. **Sameness and padding instead of depth** (dungeons alike, mazes for length). Here: the critic pass.
9. **Softlocks and blockers.** Here: the bug hunts so far, plus save/reload at every checkpoint of a playthrough.
10. **Missing or stiff animation; things facing the wrong way.** Here: the probe (missing frames), snapshots, a check of
    facing in conversations.
11. **Screen sizes and pixel scaling.** Here: the `scaling` browser check (fixed, see findings 2), wide and tall windows.
12. **Layers clipping through each other.** Here: snapshots.
13. **Core features broken silently.** Here: the full suites, run after every change.
14. **Grating audio** (loud, long, loops jumping to the start, music restarting at every door). Here: audio analysis.
15. **Dropped or extra-effort input** (presses lost in slow frames, double taps during fades). Here: input tests.

What he cares about: he notices anything visible on day one and documents it; plays on real, varied hardware (phone,
Mac, a big high-refresh screen); wants a handmade Nintendo-like feel, readable at a glance; hates repetition and
filler; wants depth from interacting rules; wants friction removed and mistakes forgiven; discovery without hand-holding
but fair (cues exact, refusals say why); wants to be told where to go and shown what changed; and he judges honestly:
**play-time estimates must come from human-paced play** (in one earlier game his real run took half the estimate).

## Open questions the campaign must answer
- **Human-paced length.** The 10-14 hour figure is an estimate from a room count. Measure it better (blind solvers on a
  sample of rooms, reading time for all text, travel); if the honest figure is short, add depth where it counts (new
  ideas, not padding) rather than slow things down.
- **Safari on a Mac** can't be run here (Chromium only): audit by hand for what Safari does differently (sound needing a
  click or key first, storage on a file, features it lacks).

## Findings log
| # | Found by | What (player's view) | Status |
|---|---|---|---|
| 1 | reading the engine | The main loop took 0 or 2 steps on half of all refreshes of a 60 Hz screen with even 0.3 ms of jitter (measured: 149/305/147 refreshes with 0/1/2 steps): constant judder while walking, the stutter Sarah Crossing had | fixed: `Pace` (src/90_main.js) averages and snaps refresh times; tests/pace.test.mjs (60, 59.94, 60.05 Hz all exactly one step a refresh; 120 Hz alternating; 144/75/165 Hz never two) |
| 2 | reading the engine | The screen's scale was chosen in CSS pixels: at 125%/150%/175% Windows scaling game pixels landed on uneven numbers of screen pixels (shimmer while scrolling), and the canvas could start on a fraction of a pixel | fixed: the game draws at 320x180 and is copied to a window-sized canvas at a whole number of real pixels per game pixel (Gfx.present); browser check `scaling` reads back real screenshots at 1x to 2x and measures every pixel run |
| 3 | probe run 1 | 45 kinds of issue in one full game: the dog blinking invisible every other step (no second frame); ten found things showing nothing when held up; the town's animals walking over roofs, fences and stalls (their routes were never moved into the town's tiles, and they walked straight lines); a long dash the font lacks (drawn as "?"); a boss's last flash drawn at an impossible size; a creature stuck in a bush; false alarms (a two-tile boss, flats lying down, pots mid-shatter) taught to the probe | fixed (dog_1, item icons, `critterPath`, route shifting, the dash glyph, Kilnwyrm, the spawn); probe run 2: 4 left |
| 4 | reading the UI code | With Wren low on the screen, a question's choices were drawn above the screen's top edge (partly or wholly unseen) | fixed; tests/ui_fit.test.mjs |
| 5 | menu sweep (tests/ui_sweep.test.mjs) | Late in the game the satchel's "Also:" line ran 1000 px off the panel; the last of nine tools hung off the screen; the Options key line ran off the screen; the button count off the screen past 9999; the tool key under the HUD box 2 px over; two hint lines drawn on each other | fixed: the satchel has a tools row and a things row (pick any thing to read what it is), the journal lists every note and opens each to read again, the count right-aligned; the probe now checks every text against its own panel, the screen's edges and other text |
| 6 | David | A controller, with every button changeable in Options; a CRT filter option | done: Options > Controls (keyboard and controller, saved, with the arrows and Escape always kept), the game's words name the bound buttons ("[tool]" in a line); Options > Screen filter (crisp, soft, strong; flat, so nothing at the edges is hidden); the name screen takes a controller (a letter grid); browser check `gamepad` |
| 7 | placement audit | Shopkeepers stand on the wall row behind their counters (by design: to check on screen), a sign on a forest tile (reads fine), a chest with no floor beside it in the Millwater cave (to check) | open |
| 8 | probe run 2 | Wren briefly inside a solid prop at two spots during scripted moments (hollow 94,58-59 by the well; 81,51) | open |
| 9 | live run 1 (frame times) | The first time a room's floor is drawn its tiles are painted: a 23 ms frame on entering the Tidyhouse's kitchen (a dropped frame; worse on a slow machine) | fixed: `TileDraw.warm` paints a place's tiles when it's entered (behind the fade), once per place |
| 10 | reading the music | The loops are short for a long game: most dungeon tunes repeat every 10-17 s, the boss's every 13 s (an hour in a dungeon is 200+ repeats); music changed with a hard cut | composing longer versions (two composers, new sections after each original opening); the change of music is now a short crossfade (`Music.newBus`) |
