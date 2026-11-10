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
- Running: the town between Houses, the bosses and combat, portraits; blind solvers next (fresh eyes on the late
  puzzles and the new places, nobody told the answers).
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
