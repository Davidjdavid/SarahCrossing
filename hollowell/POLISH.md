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
- Running now too: inference for the two late bosses (latebosses_brief.md: the Weaver's beat 1 read four ways, the
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
1. **Bosses that escalate** (every boss is "the trick three times"; one boss tune): each boss gets three different beats (phase 2 changes the arena or its rule; phase 3 wants an earlier tool too); mini-bosses two hits; a boss tune per House (each House's motif). *Planned: one helper per House, two at a time.*
2. **The genre turn as an act** (four small Makings): more Makings, worked from underneath rooms Wren solved early on; a second child with different rules. *Planned after the Houses.*
3. **Rebuild the Great Spool** (recap rooms, answer signs, one look, a harsh climb): new rule under the Pull, multi-step rooms, its own look and tune, a checkpoint per lane. *Planned after the Houses.*
4. **Signs and hints**: done (findings 25).
5. **Synthesis rooms on the main path** (two late rooms in each of Houses 3-8 using earlier tools together). *With the House helpers.*
6. **Longer music**: two composers extending every tune (paused by the usage limit; to resume), plus House boss tunes and a Great Spool tune.
7. **Cut the waiting**: sit-and-wait and the patience ring done (finding 26); boss cycles (Grindle, the Snapjaw, the Tangle) with the House helpers.
8. **Break the House template**: shorter Knot ceremony after the first; per House where it helps (with the House helpers).
9. **An overworld worth exploring**: an art pass per region and one landmark puzzle place per region using its own physics; revisits with later tools that hold puzzles. *Planned.*
10. **Map and journal that tell**: labels, a goal pin, what's new in town after each Knot. *Planned.*
11. **Reveals you play**: the first reveal staged on the stage (the cast seen, walked into a line); the Hall of Names read spool by spool; the festival staged. *Planned.*
12. **Dress the rooms**: set pieces per House, floors (three Houses and the Underside share planks), bigger bosses, busts; portraits for the main cast. *Art helper on the worst pieces now (the giant, the Great Marionette, busts, moons, the exit, weathervanes, seats, signs, doors, a counter, a rug); the rest planned.*
13. **Show the ending before telling it**. *Planned.*
14. **Enemies as pieces of the law** (their threads shown, lured onto plates). *Planned.*
15. **Small bugs**: done (findings 16-24, 27); playtime re-measured honestly (the scripted run's 68 minutes included an 11-minute wait on an open box: fixed in the autopilot).
