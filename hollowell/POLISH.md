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
- [x] One full live playthrough (David, 12 November: one clean run is enough, no need for two in a row): no errors, no
      unexplained probe anomalies, and snapshot review finds nothing new above cosmetic. Live run 5 (findings 79-81).
- [x] Text-fit audit passes for every string (longest player name included).
- [x] Placement audit passes: nobody and nothing starts in or walks through a solid; no two things share a tile.
- [x] Frame pacing: at 60 Hz (with jitter) every refresh gets exactly one step; at 120/144 Hz the pattern is as even
      as it can be; the busiest scenes render well under budget with the CPU slowed 4x.
- [x] Crisp pixels at devicePixelRatio 1, 1.25, 1.5, 2 and odd window sizes (checked on screenshots).
- [x] Every main-path puzzle room judged fair by a blind reviewer (or rewritten); the goal line always says where next.
- [x] Critic's ranked list: every item done or decided against (with the reason) below.
- [x] Dialogue pass done (typos, voice, overlong lines).
- [x] Audio: no clipping; levels balanced between tunes and effects; no tune loops so short it wears.
- [x] `npm test` and `node tests/browser.mjs` pass; docs updated.

**The campaign is complete (12 November).** Every criterion above is met; the evidence for each is below. The last
cosmetic touches (fix round H, findings 80-81) were checked on the final code: `npm test` 851/851, the browser checks
pass, the placement audit 0, and a live run of all nine legs (877 pictures) with 0 probe issues, 0 game errors and 0
page errors.

Where each stands (12 November: all met):
- Text fit: met (tests/ui_fit with the longest name a player can type, tests/ui_sweep for every menu at the start and
  late, and the probe's text checks over every line shown in all nine legs).
- Placement: met (tests/audit_place.mjs: 0 findings over every area at 13 story stages, nine documented exceptions;
  the probe flags nothing standing or walking in a solid over all nine legs).
- Frame pacing: met (tests/pace.test.mjs at 60, 59.94, 60.05, 75, 120, 144 and 30 Hz). With the CPU slowed 4x
  (headless Chromium, software canvas), game work per frame in the six busiest places: mean 3.4-11.2 ms, 95th
  percentile 5.6-14.2 ms (budget 16.7); every playable place holds 60 frames a second; the Great Pull (a cutscene, dozens
  of threads) dips to about 45-50 a second there, because the browser's own copy to the screen runs on the CPU in
  that setup. Accepted: nothing to play during it, and a real browser does that copy on the graphics card.
- Crisp pixels: met (browser check `scaling` at devicePixelRatio 1, 1.25, 1.5, 1.75 and 2, odd sizes included).
- Blind reviewers: Houses 5-7, the Great Spool, the bosses of Houses 7-8 and the ninth Little House by solvers A-D;
  Houses 1-4 (solver E) and the eighth House's rooms and the Little Houses 1-8 (solver F): every main-path room played
  blind; their findings (62-64, 70-71) in fix round E. The goal line: checked
  at every story stage by the journal tests; the Slumberhouse's stale goal fixed (finding 56).
- The critic's list: met (every item done; see below).
- Audio: met (finding 67; levels in scratchpad audio/levels.md). Dialogue pass: met (finding 68). The full live playthrough: met (live run 5, one clean run by David's rule; its
  last cosmetic touches in fix round H). Tests and docs: met (851/851, browser checks pass; this file, CHANGELOG.md,
  QA_REPORT.md and PROJECT_STATE.md up to date).

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
| 7 | placement audit | Shopkeepers stand on the wall row behind their counters (by design: to check on screen), a sign on a forest tile (reads fine), a chest with no floor beside it in the Millwater cave (to check) | done: every flag looked at on screen; the audit (tests/audit_place.mjs) now passes with 0 findings over every area at 13 story stages, listing the nine placed so on purpose with the reason for each (keepers behind counters, a water wheel and the millpond's boss in water, bell ropes over the race, a plaque and a tree sign, the falls' chest opened from a float, the ducks' crossbar stand) and exiting non-zero on anything new |
| 8 | probe run 2 | Wren briefly inside a solid prop at two spots during scripted moments (hollow 94,58-59 by the well; 81,51) | fixed with finding 22 (scripted walks go round things); the probe has flagged no Wren-in-a-solid since, over all nine legs |
| 9 | live run 1 (frame times) | The first time a room's floor is drawn its tiles are painted: a 23 ms frame on entering the Tidyhouse's kitchen, 460 ms entering the Drift (a stall; worse on a slow machine) | fixed: `TileDraw.warm` paints a place's tiles when it's entered (behind the fade), once per place: entering now costs 12-22 ms once, first frames 1-4 ms |
| 10 | reading the music | The loops are short for a long game: most dungeon tunes repeat every 10-17 s, the boss's every 13 s (an hour in a dungeon is 200+ repeats); music changed with a hard cut | composing longer versions (two composers, new sections after each original opening); the change of music is now a short crossfade (`Music.newBus`) |
| 11 | live run 1 (picture #0002) | The game's very first line (narration over a black screen) was invisible: the screen's fade was drawn over the dialogue box | fixed: the fade is drawn first, words over it |
| 12 | live run 1 (probe) | In the Little Houses (worked from underneath) everything said or sparkling in the room above was drawn above the top of the screen: the boy's "Ooh! It jumped!", "Hmph." never seen | fixed: effects in the room above are drawn where that room shows through (`Fx.draw`) |
| 13 | live run 1 (probe) | The same floating words stacked on themselves ("tucked in!" 1500 frames); the boy's lines on top of each other | fixed: `Fx.text` restarts a copy already there; the boy's new line replaces his last |
| 14 | live run 1 (frame times) | Threads were drawn a pixel at a time (13,000 draws a frame at the busiest moment), off screen too | fixed: `Gfx.line` skips what's off screen and draws straight runs at once (1,500 draws; identical pixels, checked on 400 lines); render 4.1 -> 2.7 ms there |
| 15 | the probe itself | Its slow-frame list was inflated by its own stack traces (taken every time a known issue recurred) | fixed: traced once per kind of issue; world-space words no longer checked as if on a panel |
| 16 | live run 1 picture reviews A, B (and the critic) | The dialogue box sat over the boss or the speaker in every boss introduction, the first reveal (two Makers never seen) and the Underside's first room: it went to the top whenever Wren was low | fixed: the box's side is chosen by what it would hide (Wren, the speaker, any boss on screen, a scene's focus), keeping its side through an exchange; notices likewise (`Dialog.coverage`); the HUD steps back while the box is at the top; speakers turn to Wren; tests/polish2.test.mjs |
| 17 | reviews A, B | Page breaks left stubs ("thread.", "Jory this old place.", "apron pocket.") | fixed: `paginate` breaks pages at sentence ends and splits a long sentence evenly; tested on the reported lines |
| 18 | reviews A, B, critic | The House plan said "the Tidyhouse" and the Pattern "teal cloth" in every House (and was drawn blue and yellow) | fixed: each names its own House; the Pattern is drawn in its Maker's colour |
| 19 | reviews A, B | The red stitch ran through the letters of one-line notices and name tags; dark name tags (Jory) hard to read; the HUD's key label and counts unreadable on light floors and sitting on scenery; the gloves labelled with the tool key; the Needle's stitches drawn over the key label; notices and banners under a fade | fixed: taller notices and tags, no top/bottom stitch on short boxes, tags lightened until dark letters read (4.5:1), HUD words on a dark backing, the gloves show the action key, the stitches under the label; the probe now checks marks against words |
| 20 | reviews A, B | Puzzle pieces in a room's top corners hidden under the HUD (a home cross, a key chest, a gate, a wheel) | fixed: the HUD steps back whenever anything that matters is under it (`UI.hudCovers`) |
| 21 | reviews A, B | Multi-tile furniture drawn centred on its first tile: the Auditorium's seats over the walls and aisle (and solid where nothing showed), Matron's bed half in the wall | fixed: drawn centred over the tiles it stands on (`SPAWN.deco`); the inn's tables made symmetric |
| 22 | review A, probe | The opening: Wren hidden behind her own bed; at the ceremony she walked through a prop and the Well, stood behind a villager, and the crowd vanished in one frame | fixed: asleep in a bed she lies in it (head on the pillow, `inBed`); scripted walks go round things (`straightBlocked`, `critterPath`); she stands in front by the Well; the crowd walks off and goes one by one; a thing removed frees every tile it held |
| 23 | reviews A, B | Text promising what isn't drawn (a potting bench, a heap of pottery, a rolling bell-helm, a giant-shaped dent, "you lie down", Matron sitting up, landing in straw) | fixed: the words match the picture, and Wren lies down where the text says so |
| 24 | reviews A, B | Item-get pose looked like Wren lifting the chest; big chests opened brown; Captain Tin floated over his shadow; "Four Knots! Halfway"; a confusing notice about Hints | fixed: she turns to face us holding it up; a blue open chest; Tin on his shadow; "only two to go"; the notice reworded |
| 25 | critic | Signs that gave the step (Orchestra Pit, Prop Store, Hanging Gallery, Bell Ropes, Pillow Fort, Furnace Hall, Backwash, Long Gap, Loading Bay); hints on by default | fixed: signs describe how things work, never the step; the first hint is asked about in-world (answer stands; Options changes it); tested |
| 26 | critic | Waiting: failed tries mean standing about until things come home; patience unreadable | fixed: "Sit and wait for things to come home" in a House's pause menu (runs the game four times as fast until the room's things are home; never with anything dangerous about); a ring of stitches round a moved thing's mark unpicks as its patience runs down |
| 27 | critic | The page's key-hint line sat over the game | fixed: the title screen draws its own controls line with the bound keys |
| 28 | review A | Threads drawn as long diagonals | by design: a thread shows the exact way the thing will come home, and a thrown or flown stretch comes home in a straight line |
| 29 | AI blind solver A | House 7: the first key could open Under the Loft, stranding the run (the Loft needs the Needle, which is behind the Kennel) | fixed: the second lock takes only its own spare key (from the Ropewalk, after the Needle); an old save that spent the first key there gets the Kennel's lock opened; tested |
| 30 | AI blind solver A | Great Spool: a thing coming home dropped onto its place with Wren standing there (overlap; the Airing Cupboard skippable) | fixed: nothing coming home lands under Wren anywhere (07_return: it waits, a heavy thing too, its mark glinting); the top room's crates and the brake wait too; tested (the Airing Cupboard's grip-and-ring is its designed solution and follows the rules) |
| 31 | AI blind solver A | House 7's Practice Floor finishes out of sight (the real unlock opens a gate elsewhere, unseen); 50 experiments to find the Ropewalk | fixed: the Gatehouse door is looked at, with a chime and a ring, when it opens out of sight; camLook can centre on another room; tested |
| 32 | AI blind solver A | Great Spool's Airing Cupboard: 9 frames to spare for a perfect bot; the Bell's range never shown | fixed: the block's patience 5 s (was 2); every ring draws its reach for half a second, stopped by walls; tested |
| 33 | AI blind solver A | Great Spool's Night Ferry: a reload in the bedroom's west half leaves Wren cut off (only Homeward frees her) | fixed: a load in a House with the Bedroll on a float starts on the float; a load west of the Night Ferry's channel starts by the lever; tested |
| 34 | AI blind solver A | The Climb trivial: holding Up reaches the top unhurt from any start | fixed: the lane pillars gone; each lane throws a train of six, every throw told (the lane lights and blinks faster, a glow, a chirp); holding Up is caught every time, waiting for each train never; tested |
| 35 | AI blind solver A | Untaught reaches (the Needle's four tiles, the Bell's range) and silent refusals (a tied crate pushed, the Needle on a knot, pulling onto silk, a target out of reach, the practice rack) | fixed: the Needle outlines every reachable tile and says 'Too far off'; refusals for a tied block, a wedged weight, the practice rack; tested |
| 36 | AI blind solver A | A failed snip's line at the Spool's top nearly gives the answer; the Bell's harder shove never said | fixed: the failed snip's line now only says what happens; the Bell's text says its snap shoves harder |
| 37 | AI blind solver B | The way into House 5 couldn't be found: the door opens only while three Snorelings sleep in the nursery's cradles, nothing links door and cradles, and outdoors they never settle (unlike the Pillow Fort's rule) | fixed: one rule for Snorelings everywhere (woken, they follow a while, then lie down in the nearest bed they can walk to: their spot, an empty cradle, the Bedroll); three lamps over the door, each corded to its cradle, lit while it's filled; a Snoreling asleep on the road with a cradle beside it shows the rule before it matters; tested; LEG5 by the new route |
| 38 | AI blind solver B | House 6's Trap Room: a returning understudy can land on Wren and trap her (only Homeward frees her); about 2 s for two hooks with a tool switch | fixed: while Wren reels in or hops, the tile she'll land on counts as hers (06_area freeForThing), so a thing coming home waits behind her; the understudies wait 7 s (was 2) with a countdown ring; tested |
| 39 | AI blind solver B | Signs that still give the answer: the Moonwalk's, the Pillow Fort's (and Hettie) | fixed: the Moonwalk's and the Pillow Fort's signs and Hettie's line say only how things behave; tested |
| 40 | AI blind solver B | Untaught: the rolled-up Bedroll's straight flight (the Dreaming Door depends on it; looked like an exploit); the Kiln yard's four-tile throw onto the vent; the Loom warp's fourth weight out of sight | fixed: rolling up the Bedroll draws Wren's thread straight to the doorway (taught by play in Mallow's Study too); the warp's four cords drawn over the birches with a glint along each; two vents on the Kiln road throwing a pot between them; tested (the Laundry needs no change: it can be done before the Bedroll) |
| 41 | live run 2 | A Meadowfold nibbler began on a tile the region's redraw made solid, and stood in the wall for good (every probe since) | fixed: its start moved to open ground; tests/polish2 checks no walker starts in a wall in any area (fails before) |
| 42 | live run 2 | Frame spikes: 85 ms twice under the ninth Little House, 45 ms in the Great Spool's Airing Cupboard, 35-44 ms in a few other rooms | fixed where real: the valley's first frame built the fog's texture (44-64 ms): now built behind the entry fade (12-17 ms); the other spikes came from the live run's own loop drawing hundreds of frames without yielding on a loaded machine: with the game's own loop every one of those places draws within about 13 ms |
| 43 | pictures 2b | Notices stack over Wren and over what they're about (the North Gate: banner + three notices over 75% of the screen; the Bobbin Loft; the Spool's top); banners sit on Wren or a speaker (the Underside banner on Otto's entrance) | fixed: notices and the region's banner pick their side by what they'd hide (Wren, the subject, bosses, creatures), at most two at once (the rest queue), never under the banner on one side, held while a scene talks, dropped on leaving their area, moving if Wren walks under; a region's banner only coming in from outside it; frames with a notice over Wren in a whole run 915 -> 10; tests/ui_fit, tests/polish2 |
| 44 | pictures 2b | The Needle's first notice hides its own target; its reach outline is faint 1 px dashes | fixed: the first notice keeps clear of the thing and every tile it could go to; the reach a 2 px stitched outline on a dark under-stroke with a faint wash; the camera leans to keep Wren in view in a top doorway; the full notice twice, then short; tested |
| 45 | pictures 2b | Boxes hide Wren or the line's subject in key scenes (the Tangle's and the Weaver's intros; the whole talk at the Spool's top, Wren off screen) | fixed (framing): in a scene the camera leans (up to 48 px) so Wren and the line's subject both clear the box, the box weighs bosses by their drawn size, Wren steps into a boss's room; pages hiding over half of Wren in a whole run 30 -> 0; tested (the scenes' staging: finding 48) |
| 46 | pictures 2b | Floating speech clamped to the screen's edge, over the HUD, behind notices, merged with sprites; page breaks mid-phrase | fixed: floating speech 3 px inside the screen, clear of the HUD, panels, pop-up icons and each other, on a dark backing, drawn after notices; page breaks weigh every break (a sentence end, then ; : or a dash, then a comma; stubs cost more); tested |
| 47 | pictures 2b | The Spoolworks' threads and marks are the floor's colour (about 1.1:1): the Tangle's four threads unseen until lit | fixed: an opaque 1 px dark under-stroke under every thread, empty mark, patience ring and creature trail; the Guild's thread lighter; tests/contrast.test.mjs: CIE76 difference 40 or more on 90% of every threaded area's floor (worst tenth before -> after: the Spoolworks 18.7 -> 43.7, the Slumberhouse 21.5 -> 53.2, the Loom 22.6 -> 49.9) |
| 48 | pictures 2b | Staging: the Hall of Names (Gran far off, no thread drawn for the pull); the Weaver said to climb the loom but never leaving the floor; Cog's toppled body drawn over Wren's head, then gone in a frame; the kitchen described over the bedroom; the birds gone before the line; the crowd facing every way; promised props not drawn (Otto's paper hat, Gundry's little House, a lid lifting mid-room, silver thread) | fixed: the Hall of Names (Gran walks up, the thread to her hand), the Weaver climbs and clings, Cog topples clear and his thread runs off, the kitchen played downstairs, the birds followed, the crowd faces away in the Pull, Otto's hat and duster, Gundry's rag and little House, the lid by the big door; tests/scenes.test.mjs |
| 49 | pictures 2b | The Makings repeat: the same three Aha notices nine or ten times each, Tuck's same line eight times, the Underside banner on every return | fixed: Tuck has his own line in each Little House; each kind of Aha announced once, then a pip on a small tally; the region's banner only coming in from outside (finding 43) |
| 50 | pictures 2b | Small art: a square of grass in the Drift's stream, a ghost rack beyond a wall, a stale banner under a fade, the Well's roof drawn after its cap is gone; the item-get pose still reads as lifting the chest | fixed: a stone in the Drift's stream, the ghost rack only over open floor, the banner dropped by a fade, the Well's roof gone after the Pull, the held item clear of the chest; tests/art3.test.mjs |
| 51 | pictures 2a | The box hides Wren in nearly every boss intro (she enters at the bottom, the boss is at the top, the room is screen-sized); the Knot question's choices cover the Knot and Wren; stale notices into a new area; an orphan closing quote on a page | fixed with 43-46 (a question's choices sit inside the box when the words leave room) |
| 52 | pictures 2a | The item-get pose reads as lifting the chest whenever it's opened from below (about 18 pictures; finding 24 back); the Kilnwyrm's landed glaze puddle drawn over Wren; the warm pie hidden behind the kitchen table | fixed: the item held up a step back from the chest (or high over it where there's no room) on a soft glow, tested on every House chest; the landed puddle under Wren; the pie on the table; tests/art3.test.mjs |
| 53 | pictures 2a | The Slumberhouse's threads at about 1.3:1 on its floor; hard rectangular seams between outdoor ground regions | fixed: the threads (finding 47); the seams frayed inside regions too (src/33x_soft_edges.js), cobbled roads keeping their edges |
| 54 | pictures 2a | The opening ceremony: Mabel covers Wren all scene; Mother Sloth "fast asleep" with open eyes; the giant's hollow two tiles off; a dozen text-not-drawn nits | fixed: the crowd round Wren, Quill turned to her, Bram's pot; Mother Sloth asleep through her lines; the hollow where the giant lay; the text-not-drawn nits drawn or reworded; tests/scenes.test.mjs |
| 55 | AI blind solver C | The fifth House's chain is a 5 and the best puzzle seen, but Wren's trace isn't drawn while she walks (the route is planned in the head and one revisited tile silently erases rings), and three lamps lit by separate dreams look like success but give no Pattern | fixed: with the Bedroll laid in the fifth House, Wren's way back to it is drawn faintly as she walks (a loop that drops out shows pale and fades); three lamps lit on separate flights hang apart, joined by a gold thread only when one flight dreamt all three, and the third says so as it's seen; same puzzle; tests/review_blind_cd |
| 56 | AI blind solver C | Bugs: a bed that's Wren's mark is lost on loading a save; Homeward does nothing right after a ledge drop until a step; a dream ring on a flight's second tile isn't caught; the journal says "find the Slumberhouse" for the whole House; snorelings follow through doorways and keep hitting; after the ninth Little House locks, the Needle still records stitches that move nothing | fixed: the bed mark survives a load; a tool pressed during a drop or a room scroll is kept; a ring on a flight's second tile is caught; the journal says what to do inside the House; snorelings keep to their nest's room and go back to bed; the Bell on a doorway's top pixels used the next room (fixed); the Needle after the ninth: the solver's script held a stale map (a real return works; tested); tests/review_blind_cd |
| 57 | AI blind solver C | The ninth Little House feels one-shot (no visible way to set it out again after a run), and tying (hold Action on a cord) is untaught there for a player who skipped ahead | fixed: after the first run Mother Ives says it's hers to set out again and Gundry's lever puts it back; tying is taught by the eight before it (the ninth's door opens only after the eighth) |
| 58 | AI blind solver D | The Tangle's last beat needs Action held and Tool pressed together (one thumb on a pad); silent results (the staff on the whole knot; four threads pulled with the fourth only displaced; the tie-off message only once) | fixed: the grip (Options > Grip: hold or toggle; part 1); the stick on the knot thuds, with a shrug of cord and a line the first time; a fourth thread not held glints and slips home, said as it happens; the tie-off said every time, shortened after the first; tests/review_blind_d.test.mjs |
| 59 | AI blind solver D | The Weaver's strand into the loom not found by an AI that skipped the Loom's rooms (no nudges in the Loom); bound plus the warp lash can faint you in about 10 s and C only cuts free with the Shears in hand | fixed: with the Shears in hand, whatever a snip would cut right now glints (the same rules as the snip: the strand from the well's rim, the long thread only while taut, the cocoon only once woken); bound, the tool button cuts free whatever's in hand (said once); a lash plucked while she's bound never lands on her (12 of 24 hearts lost in 15 s before; 4 in 20 s now if she cuts free at once); tested |
| 60 | AI blind solver D | The Great Spool: the Airing Cupboard passed by pushing the block onto the plate and running through within its 5 s (the fix for finding 32 opened a shortcut); the Winding Room's way up hidden behind the drum; the last hand-hold shows no progress; the Foot's sign promises an empty peg that nothing uses | fixed: the Airing Cupboard's gate wants an iron plate under the mangle's place too, so neither the dash nor the hold-then-dash gets through, and both designed ways still pass at a person's pace; the drum moved so the Winding Room's way up is in plain sight; the last hand-hold sews a ring of stitches as it's held, unpicking slowly if let go; the empty peg drawn on the drum, in view through the end and never filled; tested |
| 61 | fix round D part 2 | The Airing Cupboard: Wren in the slot ringing the Bell has the mangle come home over the slot and wall her in (only a reload frees her) | fixed, generally: a thing coming home waits over its place (its mark glinting; in the Great Spool hanging on its thread) if landing would leave Wren nowhere to step or cut her off from every way out of her room she could walk to; it comes down once she's out (`Return.wallsIn`, 07_return); tests/review_blind_d.test.mjs 13-14, failing with the rule off |
| 62 | AI blind solver F | The eighth House opens too gently (the Threshold, the Offcut Yard and the Weighing Room: three pit-fill rooms, rated 2, 2, 2 before its 4s); the Larder solved partly by luck; the Bridge Room's iron crossing silk on the Needle reads as a broken rule | fixed: the eighth House's first three rooms are three different ideas, each a 3 (the Threshold: offcuts hooked across a trench, the House Plan's chest here; the Snag, once the Offcut Yard: a weight held on its way home by silk, pushed round into a hole so it pops up home on its plate; the Weighing Room: weights hanging at home over the chasm, dropped where they hang); old saves keep what they filled (`LoomHouse.migrate`, `settle`); the Larder shows every sleeper's way home as beads along its thread while the Bell's in hand; the Bridge Room's silk parts under iron, seen and said once; tests/loom.test.mjs, tests/review_blind_f.test.mjs (failing before) |
| 63 | AI blind solver F | The Loom's goal line stale after the north gate opens; no Plan chest in the Loom; the HUD's tool box over a chest and the Needle's target on the way in; silent refusals (hooking a cocooned weight, the bell from below in the Makings); the Needle's let-go notice not seen once | fixed: the Loom's goal moves on (the gate, inside, the Shears); its Plan chest in the Threshold; the HUD fades each corner on its own (to 15%) over anything on the grid that matters, at its drawn height, and over tool overlays (the Needle's reach), tested at the spots solvers named in Houses 1-4 and 7; hooking a sleeping weight says so; the Bell from below in a Making says so, once; the Needle's let-go notice was showing (the solver's harness didn't read notices: documented in a test) |
| 64 | AI blind solver F | The Makings: Making 8's nudge says "let go" where a tug works; Making 5's sign says "now" where the bust waits; Making 3's nibbler can pin Tuck for 95 s; Making 3's and Making 7's first signs give the step; the third Aha found nowhere (nothing points to it). The Makings' climb is right (2, 3, 2, 3, 4, 3, 4, 5) | fixed: Making 8's nudge and Making 5's note say what's true; Making 3's and Making 7's first notes say how things behave without naming the tool; Making 3's nibbler backs off after 3 s of cornering Tuck, every time; the third Aha findable by looking (Tuck stops and peers at the hiding place the first time, and it glints through the boards now and then); all three Ahas earnable in every Making; tests/makings.test.mjs, tests/review_blind_f.test.mjs |
| 65 | outside tester (ChatGPT, playing the published tester copy in a browser; an AI, not a person) | On a fresh browser, Options on the title screen threw every frame and showed nothing (a flag asked of a progress record no game had made yet; then a count asked of the statistics); the menu's tab keys not shown (the arrows pick things in the Satchel) | fixed: the inventory, progress and statistics start empty when the game loads; the menu's tab row shows its keys; tests/title_options.test.mjs (fails before); checked in Chromium on a fresh browser |
| 66 | outside tester (ChatGPT) | Stuck in the first House after spending its first key on either locked door; asked whether that's a key-order trap | not a bug: two locked doors before the Gloves and two keys reachable without either (the third key and door come after), so any order finishes; the three rooms it hadn't solved pass their solution tests. Its wish for prompts on things you can use is not taken up (the game shows what things do, not where to act); the tester copy's page gained a Save code box (copy a save, or load one) for future outside runs |
| 67 | the audio check (rendered offline in Chromium through the game's own synth; scratchpad audio/levels.md) | Nothing clipped, but: the game used under a tenth of the available level (tunes -34.5 to -44.9 LUFS, a 10 dB spread); effects 8-28 dB under the music; every note clicked (a gain step at its release; noise hits cut off); a crossfade summed to 1.42x; `Sfx.play`'s volume ignored; one effect asked for but missing; 13 tunes looping in under 45 s | fixed: master level and a memoryless soft limiter (straight to -6 dBFS, a smooth bend to a -0.5 ceiling; it never acts in normal play); per-tune and per-effect levels (src/40e_mix.js): ordinary tunes within 0.2 dB of each other, five quiet on purpose; effects 14 under to 4 over the music; no clicks; the crossfade never over the louder tune; every loop 46.7 s or longer (new sections in each tune's style); tests/audio.test.mjs (6, all failing on the old code), browser scenario `audio`, the music test's loop floor 20 -> 45 s. Untested: Safari and Firefox's sound, real speakers |
| 68 | the dialogue pass (scratchpad dialogue/: VOICES.md, REPEATS.md, edits.log) | About 60 slips (note signatures, British spellings, "house" for a House, the tools' names, names spelt two ways, a hard-coded key); six lines out of their speaker's voice; nine speeches over three pages; 28 lines seen too often | fixed: each slip made one way; each voice its own (a line given to the wrong person, a joke used twice, two barks the same); every speech three pages or fewer (no fact lost); repeats shortened after the first time, varied in turn, turned into notices, or quiet after a few; tests/text_lint.test.mjs (16 checks over every readable string, 10 failing with 38 findings before), a three-page limit test; the four files left to the coordinator done |
| 69 | outside tester (ChatGPT), second run (save codes CP04-CP05 in its report) | Stuck again in the first House: racing the Hall of Busts' north gate before it shuts (a bust or the crate pushed onto the plate, a dash), over and over; it had read the busts as fixed scenery at first, which held up two rooms | done: not a bug (the room's own idea holds its gate; the rooms past it want the Gloves); the race it kept trying is gone (finding 70) |
| 70 | AI blind solver E (Houses 1-4; no broken rule, no softlock) | Races that skip a room's idea (the Hall of Busts, 13-25 frames spare, its block's job never seen; the Gallery, 148 of 160 frames); the Parlor's far gate silently timed (~2.6 s) where every other gate holds; the Drying Racks strand you west of the pit (only the menu's way out); the Glazer asks nothing (standing still wins); Old Grindle's phase 3 unsolved in 16 tries, no nudge in boss rooms; Tollgrim's pebbles hard to see; the HUD panel over gates and a sleeper | fixed: the Hall of Busts' walkway entered only at its far end, so no dash makes it (fastest 314 frames against 180 open) and its own idea passes with 1.5 s to spare, a sign saying how busts behave; the Gallery's closet wants two plates, one only something heavy at rest presses (`settled`), and a dead-end nook that could wall Wren in now has a ledge out; a ring of brass stitches round every plate and gate held by something that runs down (the Parlour's and five more); a one-way ledge out of the Drying Racks; the Glazer's shield follows Wren and only stepping off its line cracks it; Old Grindle's round 3 says its rule, and every boss stage in Houses 1-7 has an opt-in nudge (`BOSS_NUDGES`); Tollgrim's gravel outlined, shadowed and streaked; tests/review_blind_e.test.mjs (22, 19 failing before); probe over all nine legs clean; the HUD's corners (finding 63) |
| 71 | AI blind solver E | Words: the Paddle's text never names the key to hold and steer; Options shows "Hints on" before the game has asked (it asks first); the Echo Room relies on remembering a tune from the first morning (the Journal keeps nothing); the Ballroom's chest appears with nothing said. Its curve: peaks early (House 2 already has a 5), a slow climb after, two or three great rooms a House among warm-ups; guesses 45-100 minutes a House for a first-timer | fixed: the Paddle's text names the key to hold and steer; Options shows Hints as "ask first" until the House has asked; the Journal keeps "Gran's bedtime tune" when she hums it (older saves get it on loading); the Ballroom's chest appears with a chime, a shake and a line; tested |
| 72 | live run 3 (all nine legs in Chromium on a frozen copy of 8bdc612: 847 pictures, 0 game errors, 0 page errors) | The probe: floating words in the Little Houses ("Tsk!", "It JUMPED!") ran into the Aha tally up top (it wasn't among the things they keep clear of); slowest frames 85 ms in the Airing Cupboard, 41 at the Spool's top, 32 under the Winding Hall | fixed: an area can name boxes of its own up top (`hudBoxes`), the tally among them, and floating words keep clear; tests/ui_fit (fails before). The slow frames: the live run's own loop (finding 42); with the game's loop the first frame in each is at most 17.8 ms and every other under 10. Picture reviews A and B running |
| 73 | live run 3, picture review A (with a headless reproduction) | Ordinary creatures kept moving while a line was up or a scene ran: a nibbler three tiles off bit Wren twice in six seconds of a chest's line; the first mini-boss could faint her during its own introduction before she ever had control (the big foes had their own check; the shared update had none) | fixed: the shared creature update holds still while a line is up or a blocking scene runs; tests/hold_still.test.mjs (fails before); suite 799/799 |
| 74 | live run 3, picture reviews A and B (no other blocker; no typos, names or portraits wrong) | The box still on Wren's shoulders (45-60% hidden) in about 25 pages of boss intros and the talk at the Spool's top; notices piling up at the Bobbin Loft's payoff and over Wren (a side bias toward stacking); a boss's notice back after its defeat over the Knot; "Your room" on a black screen; region banners on every border crossing; the HUD over the Slumberhouse door lamps, hams, a weathercock, studs that read as HUD gems; floating words over faces; people stacked in the Makings and the Great Stage's line-up; a tag that reads ":Mother Ives:"; a page starting mid-sentence | fixed: Wren's measuring box matches her drawn sprite, and the box only chooses among placings that show 85% of her or more whenever any does, with `stepIn` walking her clear in ten scenes (worst share hidden over all nine legs 0.41 -> 0.09; no page over 15%); notices weigh Wren above all, a second goes to the free side or waits, other rooms' stitch notices give way, a fight's notices go when the boss does (frames with a notice over a quarter of her 95 -> 3, banners she walks under); the fade set before the first room, a new game or load clearing the last one's banner and notices, a region's name not again within 90 s; the hearts and keys corners step back for the door lamps and the weathercock, no studs in the HUD's row, the hearts on a soft backing; floating words keep off faces and by the speaker; Wren's outline drawn through whoever stands over her; the line-up turned to us; tags slide off faces, one-line tags without end stitches; the Pull notice at the Spool's top cut to two lines (coordinator); tests/live3_ui.test.mjs (20, failing before); live run of all nine legs: 862 pictures, 0 probe issues |
| 75 | live run 3, picture reviews A and B | The Crossbar racks' strings at about 1.1:1 (a puzzle tell); exits that open after their line and defeat lines narrating what isn't shown (seven foes, Mother Sloth's boards and floor, the Great Marionette's march, the Tangle's end); the climax with Wren facing the wall; the stick favour's thread a bare line, and taut after the Pull; the fair gate folding to nothing; a bush on a dark square; a few small mismatches (a squirrel, a water butt, Cog's size, Gundry's age) | fixed: the racks' strings drawn like every thread (dark under-stroke, 0.7, full with the Crossbar in hand; the Marionette Hall in tests/contrast); exits open before their line, placed to show; every foe leaves what the line names on screen while it's read (src/41c_remains.js: bunnies, dust, pots down a drawn crack, yarn, gears, pieces, the floor board by board, threads down the cracks; the Housekeeper too); the Great Marionette marches first; the climax turns and walks Wren to Gran; the stick favour's thread drawn properly and gone once the Spool stops; the fair gate's leaves stand open; the Drift's bush frays into the meadow; the Ropewalk's light soft rays; the Staff Stairs' threads fade round Wren; the small mismatches drawn or trimmed (a trapdoor, steam, a squirrel, Cog wound with thread, Gundry grey at the temples); tests/told_seen.test.mjs (8, failing before). Decided against (cosmetic): the falls' wide east side is the secret float route behind them; the slate east of Snapjaw's Race is solid rock wanting new dressing art; softening the North Shore's shallows would freeze their animation |
| 76 | live run 4 (all nine legs in Chromium on a frozen copy of fe33e4b: 862 pictures; the same copy: 829/829, browser checks pass, placement audit 0) | The probe: 0 kinds of issue; 0 game errors, 0 page errors; every leg complete | clean by machine; picture review A: nothing above cosmetic (finding 77); review B: no blocker, but two small findings above cosmetic (finding 78), so this run doesn't count as the first of the two clean ones: runs 5 and 6 must both come back clean |
| 77 | live run 4, picture review A (cosmetic only) | Two exit doors under the box while their line is read (the Grand Hall, the Kiln's Heart); the Ballroom's notice over the chest it announces; the Glazer standing 4-8 px over its shadow; Tollgrim's climb back into his bell told, not shown; the Grand Hall's intro (a stamp never seen, a bust that reads as perched on the Housekeeper); hams and hook rings in the HUD's row; the Snapjaw's yarn drawn on the crates; the Millpond's wheel cut off during its line; a grey glow over the chasm | fixed (fix round G): both doorways in their line's focus; the Ballroom's notice two lines with a focus, and a notice that would hide Wren or its focus either side leans the camera as the box does (focuses added to nine more "something appears" notices); the Glazer on its shadow; Tollgrim seen dazed, then hopping up into his bell, in the same 30 frames; the Housekeeper steps off its cross and stamps back on, the busts in focus; the ham clear of the hearts, no portholes in the HUD's row; the yarn in the water under the crates; the Millpond's wheel seen turning before its line; a warm glow over the chasm. Decided against: moving the Grand Hall's bust (a puzzle piece of the fight) | |
| 78 | live run 4, picture review B (no blocker, no typos or overflow) | Above cosmetic: the reveal's morning line calls the cellar door "never locked" though the door has said "Locked" since the first morning; Captain Tin's and Matron Hush's ends told but gone before the line can be read (missed by finding 75). Nits: Gran's hands on the Spool told but not drawn in the climax; "Tess" in narration where her tag says "Mum"; a sleepwalker who "gets up" while standing; a line said by Tuck off screen; the Larkspur jump drawn as going up a cliff; people over people in the first reveal; a banner over the Inn's keeper; a notice left up from upstairs. The live run's tool missed a second notice placed in the same frame | fixed (fix round G): the cellar door "locked from the inside"; Captain Tin and Matron Hush leave what their lines name until they're read (in tests/told_seen's foes, with a slow reader); Gran's hands on the drum's rim until they're taken; "Your mum, from somewhere above"; "She sets off"; the reveal's line-up clear of strings and crossbar, tags off Wren's legs, the place name below a face; the live run pictures every notice. Decided against: the Larkspur jump (every cliff shows its south face), Tuck's line from the next room up (the underside shows only the room overhead), a hint notice left up downstairs (its other side covers Wren), four choices that can't fit the box. Suite 843/843; a full live run 876 pictures, 0 probe issues, 0 errors | |
| 79 | live run 5 (all nine legs in Chromium on a frozen copy of b53af38: 876 pictures; the same copy: 843/843, browser checks pass, placement audit 0) | The probe: 0 kinds of issue; 0 game errors, 0 page errors; every leg complete | **clean**: picture review A (finding 80) and B (finding 81) found no blocker and nothing above cosmetic; with David's rule of one clean run, the playthrough exit criterion is met |
| 80 | live run 5, picture review A (0000-0225): no blocker, nothing above cosmetic; every fix of run 4 seen holding | Nits: glazed plates on the Chasm Gallery's top wall in the HUD's row; Tollgrim speaking from an empty bell on one page; Grindle's gulp notice word for word twice; a drop on a bust's head in the Grand Hall and a bust standing on Clangor's breastplate; the Glazer's ball of clay not drawn; the key's glow over the chasm drawn as a hard-edged disc | **fixed** (fix round H: the plates in a rack on their shelf, his eyes in the bell's mouth through both lines, a shorter second gulp, the Heartstitch and mid-fight hearts off the busts' heads and nothing landing on a bust's home, the clay drawn in its hands, the glow fading out ring by ring; tests/live5.test.mjs) |
| 81 | live run 5, picture review B (0226-0875): no blocker, nothing new above cosmetic; every fix of run 4 seen holding | Nits: notices in the Makings ignoring the people seen through the floor (0.5-0.8 s over Tuck or Otto); "Hesper" in a line that points the way (the main path never says Gran's first name); two notices in the ninth Little House with no focus; a mid-phrase page break; the giant's shadow a disc under him once he's up; the Slumberhouse Garden ford drawn deep; Jory's face behind the crossbar on "It's Jory up there"; a few gifts not held up | **fixed** (fix round H: notices count the people seen through the floor where they're drawn, both notices with a focus, "Your gran", two sentences, a flat shadow, the upright below his face; tests/live5.test.mjs). Left as they are (cosmetic, nothing a player needs): the ford drawn as the river's blue (the path runs up to it and on from the far bank; drawing it shallow would mean a new kind of water there), two finds told with nothing held up, the First Spinner's carved line near the screen's top |
| 82 | QA package preparation (12 November): the optional-content run (part E) | **A trap below the falls**: paddling the ferry over the falls and stepping ashore on the basin's beach makes it Wren's mark (region "Millwater", `checkRegion`); falling in (the bottle's own advice) brings her straight back; the ferry's gone home; outdoors there's no way back. Only Homeward to a Bedroll laid elsewhere, or loading an earlier save, gets out. Reproduced headless from T18 | **fixed** (fix round I: a region over the basin keeps the mark where it was, its way home the end of the road; a load there keeps the mark she saved with; tests/fixI_falls.test.mjs) |
| 83 | QA package preparation: guide part A | The goal line after the fifth Knot ("Home to Hollowell. (Somebody at the clinic...)") stays until the first reveal, even after the clinic and Gran naming Larkspur Fair; the map pin stays on the clinic | **fixed** (fix round I: the clinic visit or the leap into the fair moves the goal on to the fair, in Gran's own words, and the pin with it; old saves migrated; tests/fixI_goals.test.mjs) |
| 84 | QA package preparation: part E | The goal line after the optional Houses: after the Pile it stays "West of the Pile's room: Linnet's own room." even back in town; after Mr Ives's chair it's empty ("Wander."); the main goal isn't put back | **fixed** (fix round I: the story's goal kept aside and given back when each optional House is done; old saves migrated; tests/fixI_goals.test.mjs) |
| 85 | QA package preparation: part E | The Pile's Heartstitch can be walled in by its two leftover strays in a corner nook (leaving and coming back puts it mid-room) | **fixed** (fix round I: the Heartstitch lands on the nearest floor Wren can walk to; tests/fixI_places.test.mjs) |
| 86 | QA package preparation: part E | Linnet's note 4 appears only once the Belfry is built again (its condition is read at build time); notes 4, 5 and 8 use the outdoor wording ("carved into the ground", "tucked into the grass") for a tower room, a beach bottle and a floorboard | **fixed** (fix round I: notes 4, 5 and 8 found in words that fit their places, the notes themselves unchanged; note 4 shows as soon as its condition holds; tests/fixI_places.test.mjs) |
| 87 | QA package preparation: part B | The map's goal pin for "the broken bridge" (after Knot 2) is drawn at 126,96, about ten tiles north-east of the bridge, on solid ground | **fixed** (fix round I: on the bridge; every goal's pin now tested against the place it names) |
| 88 | QA package preparation: parts A and C | The Guild's key is described as opening the Loom but nothing reads it (the warp is the gate); Gundry's "Eight Little Houses" after the ninth Making (counted before the capstone: a decision); the Long Hook pulls the Washhouse tub straight over from the bank (the room's two stones not needed: a decision); the debug panel's Noclip changes nothing (debug only) | **done** (fix round I: the key does open the Loom's great doors, locked till Gundry hands it over; its words now say exactly that, with a test. Decided, kept: Gundry's "Eight Little Houses" counts Tuck's own eight; the Long Hook over the Washhouse is a late tool's reward in an optional room. The debug Noclip now works, debug only) |
| 89 | QA package preparation: the docs | SPOILERS.md's title-screen note (the code checks the save slots for a finished game, not a storage key), DUNGEON_TRACKER.md's Heart Patch in the Kiln's Potting Shed (there is none; the Kiln's are in the Long Way Round and the Chasm Gallery), WORLD_MAP.md calling the Loomwood weights strays (they're marked) | **fixed** (fix round I) |
| 90 | Outside QA (ChatGPT Work, 12-13 November; its report: 6 findings, 0 Blocker, 2 Critical, 1 Major, 2 Minor, 1 Cosmetic) F1, Major | Loading a save (or a New Wander after finishing) carries the previous game's per-place records into the new one: `Save.apply` enters the new place while `G.map` is still the old game's, and `Shears.remember` writes the old map's cut records into the fresh progress | **fixed** (fix round I: `Game.leave()` drops the old game's place, Wren and its scenes' leftovers before a load or a new game; the same fault found in a House's key tug and the attic trial's clock, fixed too; a migrate step drops records a save can't own; tests/fixI_load_isolation.test.mjs) |
| 91 | Outside QA F5, Critical | Rebinding Act and then resetting the controls with the new key leaves Act held (its keyup no longer maps to Act), so talking, reading and lifting stop working until the page is reloaded | **fixed** (fix round I: each key lets go of the button it went down as; a rebind or a reset drops what's held under the old mapping; the same fault with a held key, key repeat and a controller fixed too; tests/fixI_held_keys.test.mjs) |
| 92 | Outside QA F2, Critical (= finding 82) | The trap below the falls confirmed; the tester found a slow way out (sinking until Wren faints wakes her at home), so not permanent, but against the design | **fixed** (= 82) |
| 93 | Outside QA F3 and F4, Minor (= findings 83, 84) | The goal line after the fifth Knot, and after the optional Houses, confirmed | **fixed** (= 83, 84) |
| 94 | Outside QA F6, Cosmetic (= finding 86, part) | Linnet's note 8 introduced as "in the grass" on a floorboard, confirmed | **fixed** (= 86) |
| 95 | Outside QA, observations | The Hall of Busts' intended way worked once executed (the tester's early failures were its own timing); the ninth Making's three ideas held through a mid-setup reload; the menus, dialogue and full screen readable; audio and a controller not testable there. Not counted: the Pile's Heartstitch (85), note 4's timing (86), the bridge pin (87), the Guild key (88), not reproduced by the tester but known | noted |
| 96 | David, playing 1.0.0 (13 November): "what's clicking so much in town?" | The valley is one great place, and every sound a thing made was heard anywhere in it: the fair's two plates (about a hundred clicks in thirty seconds), a crate the wind keeps throwing off a ledge in the Heights, the vents' crate in Kilnridge, sheep and the ferry going home: about two hundred sounds in thirty seconds in the town square | **fixed** (1.0.1: a thing's sound is heard only while it's in sight or just past the screen's edge: `Sfx.src`, set by `Game.step` for each thing and by the vents for each flight; Wren's own sounds and a scene's always play; tests/fixJ_sounds.test.mjs) |
| 97 | David, playing 1.0.0: "Bram said something about smashing one of his pots" | Bram's first words hand Wren one of his pots to smash ("It comes back"), but there were none in town (the nearest were in Kilnridge) | **fixed** (1.0.1: two of his pots by his stall, off everyone's walking routes; a test lifts, throws and smashes one and sees it come home whole) |
| 98 | David, playing 1.0.1 (13 November): "stuck in a wall vs the wardrobe boss" | A heavy thing coming home shoves Wren a tile along (07_return.js), and in the first House's boss fight everything the boss yanks home comes back hard enough to. The shove kept where she stood within her tile, so standing off its middle she landed with part of her inside the wall beside the tile she was shoved into, and could move in no direction (she moves only where all of her would be clear) | **fixed** (1.0.2: shoved, she lands on the middle of the tile, `Player.shoved`; and whatever ends up over part of her, she's eased onto open floor within three quarters of a second, `inSolid`, `easeOut`; boxed in by things she isn't inside is left alone; tests/fixJ_sounds.test.mjs, each failing before its fix) |
| 99 | The whole game played through with every moment Wren was inside something logged (after 98) | Two more ways in, each a trap: a throw stopped before it was clear of her own tile (a wall, or a creature right in front of her) came down on her own tile, on top of her (found in the Belfry; at the fair's forecourt, whose pale crates never go home, a mistimed throw could have held her there for good); and stepping into another room, the walk-in carried her a little way in without looking, half into a thing standing just inside the doorway (found in the Spoolworks) | **fixed** (1.0.2: the throw comes down in front of her if there's room, else beside her, else behind her, `Thrown.land`; the walk-in goes only as far as she could walk, `Cam.update`; the same run again: nothing over her for longer than a quarter of a second, and those by design, the Gloves' pull and a shove; tests for both. The forecourt's own test never got its crate into the pen, its throw hitting the soldier and the crate landing on Wren: now timed as a player would, and it checks the pen) |
| 100 | David, playing 1.0.1: "When you visit a room in a dungeon can the whole room show up on the map and not the parts you walk around at?" | The Houses' maps showed only the stretches walked near (4x4 blocks), so rooms came out patchy | **done** (1.0.2: in a House, a room once been in shows whole, `mapSeen` in 22_menus.js; outdoors, still what's been walked near; a test) |
| 101 | David, playing 1.0.1: "I have an extra small key while fighting the first boss, is that normal?" | The first House has three small keys (each in a chest, opened once) and three locked doors, and two of the doors can be gone round: with either shut, the boss's door and every key's chest can still be reached. A key left over means one of those doors wasn't opened: the Hall's east door is only a shortcut, but behind the Foyer's east door are 137 tiles of the House and its plan's chest (`gPlan`), so the key is worth spending (keys stay with their House) | noted (as designed; David told it's normal and that a locked door is left, nothing more) |
| 102 | David, playing 1.0.2 (13 November), with a picture of the Millrace's Upstream room: "how do I get through the room with sign the blocks the way? I really want to go over there to see whats up" | Not a puzzle: the UPSTREAM sign stood on the only floor between the room's door and its west half, so that half, the Overflow and the Workshop beyond it (the House's signature room, a Heart Patch) could never be reached. There since the House was built (9 November): every test of those rooms began inside them, and no scripted run walks that way | **fixed** (1.0.3: the sign in the corner beside the door; a test walks from the door past it, through the Overflow's stones and up into the Workshop) |
| 103 | Every place at every stage checked for the same (`tests/reach_check.mjs`: a fixed thing on the only floor between two stretches of floor; now in the placement audit and a test) | Two more: the Belfry's Bell Ropes sign stood in front of the strip along that room's top wall (empty, but in plain sight and out of reach); and the Millrace's Shard Race Heart Patch stood in a corridor behind its gate that ran on down to the door, so the pot by the door carried up beside it let the chest be opened without the charms. The rest the check finds are barriers made to open (seals, painted flats, silk walls, the clay dam, knot locks) and the Stray House chest's alcove | **fixed** (1.0.3: the Bell Ropes sign beside the stair gate; the Shard Race chest walled in, reached only through the gate; tests, each failing before its fix) |
| 104 | David, playing 1.0.3 (13 November), in the Slumberhouse: "am i trapped?" (his game read from his page's own saves: in the Nursery, the playpen's little hole filled in and the toy block gone) | The playpen's little hole is the way out for anyone who drops into the playpen without the Bedroll laid up top. The toy block is too big for it (it can't be set down or pushed in), but falling, Wren set down what she carried where she stood: carried down the hole, the block went too and filled it for good. The room's toy was lost (the Nursery's north door and the Pillow Fort out of reach: optional by then, as the House's keys allow), and the next drop into the playpen had no way out but the menu's Back to the House's door | **fixed** (1.0.4: going down a little hole, a carried thing too big for it stays up beside it, `dropCarry`; a game that lost the toy down the hole has it back in its playpen and the hole open, `Save.migrate`; a toy used for its gap stays used; tests, each failing before the fix) |

## Work queue (helpers; at most three or four at once: twelve at once hit the usage limit)
Briefs are in the session scratchpad (house_brief.md, staging_brief.md, greatspool_brief.md, makings_brief.md,
overworld_brief.md); each helper reports, then the coordinator reviews, tests and commits.
- Done: House 1's and House 2's bosses in three beats, their mini-bosses two hits (coordinator); House 3 (Millrace:
  boss in three rounds, 40 s instead of 208; the Snapjaw two hits; two new rooms, the Lock and the Bell Race; a floor
  of its own); all music (two composers: every tune 24-110 s, a fight tune per House, the Great Spool's own theme).
- Done too: story staging (the festival with the whole town and the latecomers running in; the first reveal staged
  and heard out Maker by Maker, 25 pages to 15; the finale's last moment; the epilogue as shots; the Underside's first
  room drawn as described).
- Done too: House 7 (Spoolworks: the Tangle in three beats, 45 s instead of 161, the third combining the Bell and
  the Gloves with the Needle's new homes; Cog two hits and his defeat staged; two new rooms, the Practice Floor and the
  Ropewalk; the nine picture-review fixes; floors of its own above and below).
- Done too: House 4 (Belfry: Tollgrim in three beats, 29 s instead of 96; Clangor two hits; two new rooms, the Bell
  Frame and the Cistern; oak-and-brass floors and set dressing).
- Done too: House 6 (Marionette Hall: the Great Marionette in three acts; Captain Tin two hits; the Prop Store one
  short way; two new rooms, the Fly Tower and the Trap Room; stage boards, footlights, rigging).
- Done too: House 5 (Slumberhouse: Mother Sloth in three rounds, 50 s instead of 102; Matron two hits; two new rooms,
  the Milk Kitchen and the Dreaming Door; bed curtains and night-lights).
- Done too: House 8 (Loom: the Weaver in three beats, 28 s instead of 81; the Shuttle two hits; two new rooms, the
  Larder and the Warp Walk; the First Spinner's loom drawn, the Weaver's defeat shown). All eight Houses reworked.
- Done too: the Makings as an act (eight Little Houses instead of four, two of them the first House from underneath;
  a second child, Otto; 6 bot-minutes instead of 2.5).
- Done too: the Great Spool rebuilt (a new rule under the Pull: off its place, a thing is wound north into the drum and
  dropped back on its place once clear; the Bedroll the one stable place; seven rooms besides the Foot, the Climb and
  the top, each Knot room its House's grammar plus another House's tool, several steps; a ratchet by each door; the
  Climb's hit sends you back to the lane's start; walls of wound thread, the drum turning, each Knot room in its
  Maker's colours; its own tune). Tests 40/40 (greatspool, ending, review_end, review_opt); probe over LEG9 clean in
  the Spool (two false alarms in the epilogue fixed in the probe: a seated person, an engraved motto).
- Done too: overworld group A (Meadowfold, Kilnridge, Belfry Heights, Millwater): each its own ground and landmarks
  (meadow flowers, hedgerows and dry-stone walls; a red canyon of mesas with steam vents that fire pots and wet clay
  that holds what lands in it; heather, gorse and cairns with a chasm that has lips and mist; continuous reedy
  shallows); a landmark place each (the Old Fold, the sheep counted home; the Firing Ground; the Crags, one chasm
  crossed four ways; Heron Rock); revisits with later tools (the Bell, the Needle, the Shears); S17 built (the
  sheep); a find early on, the ringers' clapper, that wakes a sleeper on the Heights long before the Bell; the Kiln's
  forecourt gate wants a pot fired first; seams softened; a ripple when wading. Not done: Millwater's revisits.
  Tests 37/37 for its regions. Heart Patches in the world now about 40 (4 to a heart; the design said 16): the
  other helpers were asked to add few or none; the docs' count to be fixed at the end.
- Done too: the difficulty curve, round 1 (scratchpad difficulty/CURVE.md: every main-path room rated 1-5). Fixed:
  House 2's Sun, Moon, Star and House 3's Bell Race (the carved order could be followed one bell at a time with no
  idea needed; their rings now fade after a moment, so it takes the one flight or ride that rings them in reverse:
  the intended aha), House 7's Bobbin Loft (now the Needle's stitch and a knot below together), House 8's Offcut Yard
  (a short cut closed); five answer signs rewritten (the Laundry, the Weathercock Walk, the Reach, the Bell Frame, the
  Moonwalk). Curve after: H1 2 2 3 2 2 3 2 3; H2 2 3 3 3 3 3 3; H3 2 1 2 2 3 4 4; H4 1 2 3 3 3 3 4 4; H5 2 3 3 2 3 2 3 4
  5; H6 1 3 2 2 3 5 4; H7 2 3 2 1 3 4 5; H8 2 3 2 3 4 5 3. Round 2 running: 6-8 more rooms in Houses 5-8 raised.
- Done too: overworld group B (Hushwood, Larkspur Fair, the Loomwood and Frayed Edge, the Drift): their own ground and
  light; seams that fray (src/33x_soft_edges.js); the fog drawn as a bank of threads (src/33w_fog.js); the later
  Houses' roads as puzzles of several steps (House 5: three Snorelings asleep in their cradles; House 6: two toy
  soldiers trapped on drum pads with strays; House 8: a warp lifted by four stray weights, four ways through); revisits
  (the Crossbar's wooden Snoreling, Lantern Pond's four lanterns with the Needle and the Gloves); an old loom weight
  found on the first raft trip that fits a Loomwood socket; a balloon cut loose at the fair that turns up in the
  Drift; the Drift redrawn with an old mill whose pond drains for good. Heart Patches: net +1. The full-spoiler
  overview for a reviewer is done (a private doc, plus PDF and Markdown copies sent to David as download cards).
- Owed from the overworld work: Millwater's revisits; a Needle teaser in Larkspur; the Wander quilt (78c_polish.js)
  to count group B's and the town's new finds; the satchel past 24 things (its description can overlap the footer:
  make it fit for good); tests/review_opt.test.mjs "new 1/2" still looks for the Loom's old brW1; the Loomwood reads
  very pale (check in the picture reviews); the docs' Heart Patch count (about 41 now; the design said 16).
- Done too: the difficulty curve, round 2 (Houses 5-8): the Drying Loft 2->4 (a sleeper's empty place is the hook's
  target; ringing it awake, the obvious move, drops you in the pit), the Winding Hall below 3->5 (the Bell's snap
  planned against a counterweight's way home), the Practice Floor 3->4 (the Needle makes a plate a puppet's place),
  the Bridge Room 3->4 (stitched past a strand of silk, a weight hangs on its thread over the drop; an old save inside
  the Loom finishes by the new route); one more sign reworded. Curve now: H5 2 3 3 4 3 2 3 4 5; H6 1 3 2 2 3 5 4; H7 2 5
  2 1 4 4 5; H8 2 3 2 3 4 5 4. Left: H6's early rooms (each can be skipped: two of three key rooms for two locks), H8's
  Hanging Gallery (every harder version was a timing test, not an idea). Tests 117/117 for those Houses.
- Done too: portraits (src/35b_portraits.js: everyone with a look, 32 people, a 32x32 bust from the look in six
  expressions with a mouth that moves and eyes that blink; the side follows the speaker; 57 story lines marked how
  they're said; text beside a face wraps at 246 px; tests/portraits.test.mjs, a browser scenario). The box now keeps
  clear of whoever spoke just before too (an exchange keeps both in view), and the finale's lines to Gran keep her
  in view. The town between Houses (src/51b_town_life.js, 51c_town_favours.js): 52 new lines across the stages, said
  once at the newest stage; the town changes visibly; six favours, each problem in town from the start, chained
  (crates, string, kite, marble, Tuck), no Heart Patches; the journal lists what's open, newest first; the north gate's
  opening shown; a "You found the b30!" bug fixed; tests/town.test.mjs (26).
- Done too: bosses and combat (bosses_brief.md). Feel: a 2-frame hit-stop and spark on a strike's first contact;
  being hit flashes, knocks back both ways, then 70 frames of safety with a blink. A shared kit in src/20_enemies.js:
  tells by House (40 frames in House 1 down to 20 in House 8, shorter in later beats; a two-note warning), hazards
  drawn where a blow lands, flung things lying on their threads that fly home along them (the thrower too can be hit
  by its own rules), knocks to topple a downed boss (2 in Houses 4-6, 3 in 7-8), a heart dropped each beat. Damage:
  half to one heart in Houses 1-2, one in 3-6, one and a half in 7-8 (the Weaver's drop two). Each boss two to four
  moves, a new one in its last beat; every mini-boss one dangerous move. Fainting unchanged (David). Bot wins 23-52 s;
  a player who knows a late fight about 1.5-2.5 minutes. Probe over legs 1-8 drawn every step: 0 errors.
- Full suite at this point: 560/560 (npm test, everything combined).
- An outside review (11 November; full spoilers, kept out of the repository: scratchpad review_ext/REVIEW_EXTERNAL.md),
  from a reviewer who read the full-spoiler overview and asked David nine questions. What it adds about David: he
  loves meta-narratives that change how he understands the game, its conventions and his own earlier play (Outer
  Wilds' recognition, The Messenger's escalation: an intermediate reveal he can predict, then the bigger picture he
  didn't); long logical puzzle chains (15-30 minutes, sometimes very hard, never number-order or rainbow-order
  chores); dungeons that differ in structure, not skin; bosses that want deduction and execution; Nintendo-like
  lightness and restraint over earnest AI-written speeches; the current length is plenty (no manufactured hours). Its
  priorities: first audit the build (reveal pacing, House structure, the biggest puzzles, the final act); then one or
  two signature puzzle chains, three or four structurally distinct Houses, boss inference; then reveals made playable
  through mechanics-first clue/payoff loops; then identity, town, secrets, dialogue restraint. Its testing rule: never
  call an AI evaluation a human playtest, never claim a measured playtime that wasn't. Kept from David's own word
  over the review's doubt: no quick boss retry. Done at once: the journal no longer lists the town's favours before
  someone has asked in person. Running: a design audit against the review (audit_brief.md), read-only, which turns it
  into a scoped plan (effort, impact, risk) within about 15-25 helper hours.
- The design audit against the outside review is done (scratchpad audit/AUDIT.md; read-only; AI-checked, no human
  play). Agreed with the review: all eight Houses share one shape (keys, a mini-boss giving the tool, the Pattern, the
  big door, a three-beat boss; only House 7's two layers, the optional Houses and the Great Spool break it); the final
  choice changes one word; the bracelet's chain buys three fewer cuts; the top room is six of the same action; from
  the Loom on, the theme is said outright many times; the first reveal is given away in House 1 by the nudge voice.
  Out of date in the review: the bosses (now three beats with moves), the music (dungeon loops 58-82 s), signs and
  hints. Already strong: the mechanical clues (a pushed townsperson shows a thread from minute one; House threads in
  their Maker's colours; the town measurably stops moving as Knots are tied; strays carry Linnet's L).
  The plan, ranked (effort: S under 2 h, M 2-5, L over 5): 1 P2 falls, faints and fog-pulls counted on Wren's spool and
  in Gran's ledger, the respawn convention Gran's hand (S); 2 P1 hold on in the Hall of Names, the climax a hand held,
  not a menu (S-M); 3 P3 restraint: the twenty worst thesis lines, the motto, credits (S-M); 4 P5 the nudge voice by
  tics not names, the Well's creak a wordless shot (S); 5 P4 the Spool's top in three pairs, Gran adapting, the
  bracelet changing the shape (M-L); 6 P6 Linnet's note 5 made playable (S); 7 P7 the quilt growing while Gran's locked
  in, no denominator (S); 8 P8 a quiet post-ending discovery (S); 9 P9 one signature chain, the Slumberhouse's Long Way
  Home (M-L); then P10 the Makings' capstone, a Little House Wren designs (M); P12 small fairness fixes. About 23 h for
  1-9. Not to do: new cosmology or fourth-wall tricks, restructuring all eight Houses, changing the Return's core
  numbers, longer bosses or a quick retry, hints, required optional content, trimming the Makings blind, added hours.
- Done too: what was owed (owed_brief.md): Millwater's three later places (the Old Mill Pond with the Bedroll, Wick's
  Duck Pond with the Crossbar, Gulls' Rock with the Needle and the hook); Madame Rook's wheel of fortune at the fair
  (the Needle); the quilt counting groups B's finds and a row for the town's good turns; the satchel scrolling two
  rows at a time so any number of things fit with their descriptions (tests/ui_sweep); Heart Patches counted by a test
  (38; DESIGN_DOCUMENT §5 and SPOILERS item 36 must agree); faces on Linnet's first meeting, her lines using the
  player's chosen name. Suite 572/572 at its finish. Dressing for Houses 1 and 2 done (one colour script each, calm
  floors, a few big set pieces per room; the Tidyhouse in teal, cream, crimson and gilt; the Kiln in sooty brick, grey
  flags and fire). Contrast check of marks and threads on every new floor (CIELAB difference against the floor under
  each stroke): six floors recoloured (the potting shed, linen room, laundry, conservatory, the Kiln's brick paving
  and flags); now every floor gives at least 42 for the thread and empty mark and 39 for the patience ring.
- Done too: the story through play (meta_brief.md): P2 the tally (src/80b_tally.js: every time Wren is brought home
  without choosing it, by House or region; a card under her spool in the Hall, the ledger's last page, Gran on Tuck's
  yanks; old saves and presets get wording with no numbers); P5 the nudge voice by each Maker's tic, the Well's creak a
  wordless card of the winch winding the House's colour, Biscuit's line trimmed; P6 Linnet's note 5 playable where the
  river meets the fog in Meadowfold's south (src/80c_fog_hand.js); P1's Hall part (hold on and Gran waits; let go or
  never grip and the scene goes on as before). Its 11 tests fail on the old source and pass now.
- The private direction: done (see SPOILERS.md's section on it and scratchpad private_work/DECISION.md; its own tests,
  a 4,000-case sweep among them; nothing before the end; never named anywhere David reads).
- A private direction from David (11 November), kept in hollowell/private/ for him to read after the game; never
  shown, summarised or hinted to him. Considered against what the game already does; a helper is on it (scratchpad
  private_brief.md). Never named in the changelog, commit messages or anything he reads.
- Fix round A done (fixA_brief.md; tests/review_blind_a.test.mjs, 14; suite 604/604 at its finish; LEG7-9 play; probe
  over all nine legs 0 errors). Running now: the Spool's top and the climax (finale_brief.md: P4, P1's climax, P2's
  count at the Spool).
- Fix round B done (fixB_brief.md; suite 626/626 at its finish; LEG2, LEG5, LEG6, LEG8 play with the probe on).
  Running now: the signature chain (chain_brief.md: P9, the fifth House's Long Way Home).
- Done too: P10 "Make one" (src/68c_makings_capstone.js, Little House 9: Wren sets out an empty Little House with her
  own tools, hides the button, lets Tuck in; the existing Aha grading; at most three Makers react to what really
  happened; Jory's first-finish line pays off his Reveal 1 promise; can't strand the act; resets on demand; S30 now
  wants all nine; tests/capstone.test.mjs, 19) and P7 (the quilt: a count with no total, observation-only secrets
  off it, finds noticed while Gran is shut in); the Ballroom memo says which solution the player really used.
- Done too: the Spool's top and the climax (finale_brief.md): three pairs, the room changing after each (the crates;
  then Gran keeps the crates and throws at wherever Wren stands, each throw told; then the floor goes dark under the
  last pair and a crate left off its shelf hangs over the dark on its thread, the Glazing Gallery's rule); the
  bracelet quiets the room and Gran lets a pair go herself, with a new epilogue shot on the north road; the climax a
  held hand, Linnet taking the other, no menu; the tally said once; old saves carry on (flags gs_s1, gs_s2);
  tests/spooltop.test.mjs (9); LEG9 to the credits. Running now: the restraint pass (restraint_brief.md: P3).
- Done too: the late bosses (latebosses_brief.md): the Weaver's beat 1 read four ways (a plain post; a long thread
  pulled taut only when the Weaver swings back to spit; a knot cocooned asleep until rung awake within the drawn
  reach; a thread tied up into the loom, cut from the well's rim anywhere along it); the Tangle's wrong ring says why;
  lengths and tells unchanged; suite 662/662 at its finish.
- Done too: the signature chain (chain_brief.md, P9): the fifth House's Pattern from one Homeward flight that lights
  three rooms' good dreams and none of their bad, without crossing its own path (a laundry chute up to the Moonwalk and
  a hole in the Milk Kitchen's bank make the loop possible); each room latches on its own (a night-light in the room,
  over the Ward's door and over the big door); a folded route shows where it turned back; the Dreaming Door is now an
  optional reward; a flight gets 110 frames per room it crosses; tests/longway.test.mjs (11); LEG5 plays it. An AI
  helper's estimate for a first-timer: 20-35 minutes (not measured).
- Done too: the restraint pass (restraint_brief.md, P3): after-the-end lines 62 to 32, one each, about what the person
  is doing; the summing-up lines, the credits' summaries, the four new chalked Rules and the tapestry's caption gone;
  the re-carved motto now one new word under the old line ("AND"); a dozen explaining tags trimmed (Gundry's after the
  Tangle by the coordinator); tests/after_lines.test.mjs keeps the old summing-up lines out. Suite 668/668.
- The audit's plan is complete (P1-P13; P14 not planned). P13: `makings` (93 s, A minor, the Underside's motif in a
  skipping rhythm, a bridge on the boy's march, a quieter pass on the Tidyhouse minuet) and `unfinished` (96 s, the
  motif three times, finished a little more each pass, resolving to A major); long-stay thinning after 150 s in a room
  with nothing solved (one pass in three rests the melody; a new room, a cutscene or a progress sound brings it back);
  a one-sample click at note starts fixed; tests/music.test.mjs.
- Fix round C running (three helpers: the screen's text, fixC_ui_brief.md; staging and the Makings' repetition,
  fixC_scenes_brief.md; art, layering, contrast and frame spikes, fixC_art_brief.md), from the two picture reviews
  (scratchpad pictures2_a/report.md, pictures2_b/notes.md: no blockers; findings 43-54).
- 11 November, late: the screen's text done (findings 43-46, 51: over a whole run, pages hiding over half of Wren 30
  -> 0 and frames with a notice over her 915 -> 10; 11 new tests; before/after pairs reviewed by the coordinator);
  fix round D part 1 done (findings 55-57 and the grip, fixD1_brief.md; tests/review_blind_cd.test.mjs, 16, 15 of
  them failing before; the coordinator softened the near-miss line to say only what's seen). Fix round D part 2
  running (fixD2_brief.md: the two late bosses' feedback and the Great Spool, findings 58-60); staging and art still
  running.
- Then: staging done (findings 48, 49, 54: each scene shows what its words say; the Makings' Ahas a tally after the
  first; tests/scenes.test.mjs, each check failing on its own fix taken out) and art done (findings 42, 47, 50, 52, 53:
  a dark under-stroke under every thread, mark and ring, tests/contrast.test.mjs measuring each House's threads against
  its floors; the item held up clear of the chest; layering; frayed seams; a dozen small pieces; the valley's first
  frame 44-64 ms -> 12-17 ms; tests/art3.test.mjs); a frozen copy passed 728/728 and the browser checks and was
  published as a separate page for an outside tester (David's own idea: another AI playing it blind). Running now:
  fix round D part 2, the dialogue pass (dialogue_brief.md), the audio check (audio_brief.md), blind solvers E (Houses
  1-4) and F (the eighth House's rooms, the Little Houses 1-8) on frozen copies (blind3_brief.md).
- Verification started: live run 2 (all nine legs in Chromium, a picture at every room, line and notice; then contact
  sheets and picture reviews); two fresh AI blind solvers on the newest pieces (C: the way into House 5, House 5 with
  its chain, the ninth Little House; D: the two late bosses, the Spool's top and the end).
- Running now too (earlier line, for the record): inference for the two late bosses (latebosses_brief.md: the Weaver's beat 1 read four ways, the
  Tangle's beat 3 failing informatively).
- Running (earlier line, for the record): P10 "Make one", the Makings' capstone (a Little House Wren sets out and Tuck walks, graded by the existing
  Ahas; pays off Jory's line; the Making 5 memo says which solution she really used) with P7 (the quilt) in
  capstone_brief.md.
- Running (earlier line kept for the record): AI blind solver B; what's owed (owed_brief.md); dressing for Houses 1 and 2 (dressing_brief.md); fix round A
  (fixA_brief.md: findings 29-36); the story through play (meta_brief.md: P2, P5, P6, the Hall of Names part of P1).
  Queued: the Spool's top and the ending (P1's climax, P4, P2's count at the Spool, P8) after fix round A; the
  signature chain (P9); restraint (P3) and the quilt (P7) once the story files settle; P10 if the budget allows; fix
  round B (solver B's findings, the Trap Room, the Tangle's third beat).
- David's direction of 10 November (vibes, not a list; the game stays its own thing, not a copy): puzzles simple in
  the first House and the land open then, harder House by House up to real ahas that combine tools; no hints unless
  asked (the opt-in nudges stay as they are; no new hint character), no answer signs; the road to later Houses takes
  more effort, made of the game's own puzzles, not borrowed padding; each new tool used out in the world before the
  next House; things seen early that a later tool opens; something found by exploring that matters later; reasons
  to go back to town and talk after each beat. Folded into the two overworld helpers' briefs; running too: the
  difficulty curve over Houses 1-8 (scratchpad difficulty_brief.md). Queued: the town between Houses (town_brief.md:
  new lines at every stage, small favours with each new tool, chained).
- David's puzzle notes, later the same day (calibration, not content: his own examples must not appear, he'll be
  looking for them): the moments he loves are a known tool used where you didn't expect it (in plain sight, passed by
  before it clicks); noticing what the game doesn't point out (a pattern quietly broken); consequences that turn up
  somewhere else, discovered not announced; cause and effect planned ahead. Peaks, growing later in the game. Passed
  to the difficulty, overworld and town helpers.
- David, later still: boss fights may be longer and should be a real challenge, with moves to learn, some taking a few
  tries (not an easy game for anyone); combat should feel good. A helper is on it (bosses_brief.md): combat feel
  game-wide (hit-stop, knockback, invulnerable frames, telegraphs, fair hitboxes; fainting in a fight works as it does
  anywhere else: David asked for no quick boss retry),
  each boss a moveset of two to four telegraphed attacks escalating per phase alongside its three puzzle beats, the
  curve gentle in House 1 to hard in Houses 7-8; longer means more fighting, never more waiting.
- Owed by the coordinator: PROJECT_STATE.md's counts (rooms, Makings); SPOILERS.md and DESIGN_DOCUMENT.md for every
  House's new boss and rooms.
- Owed after the Houses: SPOILERS.md and DESIGN_DOCUMENT.md rewritten for every House's new boss and rooms; the
  browser scenarios' screenshot lists extended to the new rooms.
- Next: (the Great Spool started)
  rebuild; the Makings act; the overworld (two helpers by region); portraits for the dialogue (the design's promised
  portrait strip with expressions, generated from each person's look); dressing for Houses 1 and 2 (set pieces);
  then live run 2, picture reviews, blind solvers, the critic again, a writing pass.

## The critic's ranked list (review of 10 November; score 6.5/10)
Full review: scratchpad review_critic/REVIEW.md (spoilers; not in the repository). Plan and status, most impact first:
1. **Bosses that escalate** (every boss is "the trick three times"; one boss tune): each boss gets three different beats (phase 2 changes the arena or its rule; phase 3 wants an earlier tool too); mini-bosses two hits; a boss tune per House (each House's motif). **Done** (round 3: every House's boss in three beats, mini-bosses two hits, a fight tune per House; the late bosses read more ways since).
2. **The genre turn as an act** (four small Makings): more Makings, worked from underneath rooms Wren solved early on; a second child with different rules. **Done** (eight Little Houses, two of them the first House from underneath; Otto, the second child; a ninth, the capstone).
3. **Rebuild the Great Spool** (recap rooms, answer signs, one look, a harsh climb): new rule under the Pull, multi-step rooms, its own look and tune, a checkpoint per lane. **Done** (rebuilt with a rule of its own; fix rounds A, B and D since).
4. **Signs and hints**: **done** (finding 25; solvers A and B's signs too, finding 39).
5. **Synthesis rooms on the main path** (two late rooms in each of Houses 3-8 using earlier tools together). **Done** (round 3).
6. **Longer music**: two composers extending every tune (paused by the usage limit; to resume), plus House boss tunes and a Great Spool tune. **Done** (finding 10; the Makings' and the Unfinished House's own tunes, P13).
7. **Cut the waiting**: sit-and-wait and the patience ring done (finding 26); boss cycles (Grindle, the Snapjaw, the Tangle) with the House helpers. **Done** (the fights 29-50 s where they were 81-161).
8. **Break the House template**: shorter Knot ceremony after the first; per House where it helps (with the House helpers). **Done** (the ceremony quicker after the first, its aftermath different each time; each House reworked).
9. **An overworld worth exploring**: an art pass per region and one landmark puzzle place per region using its own physics; revisits with later tools that hold puzzles. **Done** (all eight regions reworked, a landmark place each, revisits; teasers and early finds used later, round 6).
10. **Map and journal that tell**: labels, a goal pin, what's new in town after each Knot. **Done** (the map names regions and doors and flags where next; the journal says what's new).
11. **Reveals you play**: the first reveal staged on the stage (the cast seen, walked into a line); the Hall of Names read spool by spool; the festival staged. **Done** (round 3, the meta pass and fix round C's staging).
12. **Dress the rooms**: set pieces per House, floors (three Houses and the Underside share planks), bigger bosses, busts; portraits for the main cast. *Art helper on the worst pieces now (the giant, the Great Marionette, busts, moons, the exit, weathervanes, seats, signs, doors, a counter, a rug); the rest planned.* **Done** (every House dressed, portraits for everyone who speaks, round 8; contrast measured, fix round C).
13. **Show the ending before telling it**. **Done** (the climax a held hand, the epilogue as shots, the restraint pass).
14. **Enemies as pieces of the law** (their threads shown, lured onto plates). **Done** (creatures keep a trace and show their way home; lured away, they walk home over plates).
15. **Small bugs**: **done** (findings 16-24, 27); playtime re-measured honestly (the scripted run's 68 minutes included an 11-minute wait on an open box: fixed in the autopilot).
