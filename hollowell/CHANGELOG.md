# HOLLOWELL: Changelog

## 2026-11-09
- Project started: brief recorded, concept chosen, design documents written, four-hourly check-ins
  scheduled.
- Engine foundation: the Return, player, things, areas, scripts, UI, saves, audio, debug API, tests.
- Hollowell (hub) with interiors and townsfolk; prologue and ceremony.
- Meadowfold region.
- The Tidyhouse (D1): 14 rooms, the Gloves, the Dust Monger, the Grand Housekeeper, the first Knot.
- Tests: the Return's rules, every D1 room, the D1 boss, and a scripted playthrough from a fresh game.
- Fixed: a softlock in the Pantry's key nook (its gate now stays open once you go through).
- Second region and the second dungeon (13 rooms, mini-boss, boss), a new tool, room-by-room tests and a
  scripted playthrough from the first Knot to the second.
- Fresh-eyes review of the first two dungeons, fixed: keys stay in your pocket when you leave a House; levers
  that set things out can be pulled again to reset; a creature in a returning thing's way takes the knock
  before you do; throws start from the middle of your tile; text wraps by measured width; toasts sit below
  banners; the HUD fades when you walk under it.
- First dungeon: the finale now needs the dungeon's tool (and can be reset); the first rooms run on standard
  timings; the boss tells you what it's reacting to, only to things in its own hall, and no longer has an
  easy way round its weak spot; a secret passage stays open once found; a gap in a wall no longer peeks out
  from behind a bookcase.
- Art: new pressure plates (toggle plates show their state); the first dungeon's building has its own front.
- Writing: early hints toned down; townsfolk lines change as the story moves on.
- Two optional activities in town after the first dungeon, each with tests: a kids' game in the square and
  three timed trials upstairs at the inn.
- Water: currents carry floating things off and the Return brings them back the long way; rafts carry the
  player; waterwheels; a new tool. Deep water can be stepped into on purpose (you go home).
- The third region (a lake, a river with falls, a self-running ferry, the player's father's mill, two
  secrets behind and below the falls) and the third dungeon (11 rooms, a mini-boss, a boss), with room tests
  and a scripted playthrough from the second dungeon to the third.
- Fixed: marks set in doorways move one step into the room (a door could shut on them).
- Fixes from the third dungeon's review: a key-order softlock, marks set on deep water (a sinking loop),
  stepping onto moving floats, the hook catching your own raft, flowing water drawn on filled tiles, a
  tougher mini-boss, distinct "hold" wheels, and more. Regression tests for each.
- Bells and wind: a ring calls everything nearby home at once; sleepers; gusts; a new tool.
- The fourth region (the lake crossing, a cliff stair, three windy terraces, a chasm) and the fourth dungeon
  (12 rooms, a mini-boss, a boss, a musical secret), with room tests and a playthrough leg.
- Engine: things placed in an overworld region with a set path now get it in the right place.
- A town festival after the fourth dungeon, with an optional ball game.
- Fixes from the fourth dungeon's review: a ledge that dropped you inside the cliff, sleeping things falling
  asleep again on a reload (or being moved without waking them), the hook passing through shut gates and
  swinging on chests, bells heard through walls, a chest appearing on top of you, a room that solved itself,
  two puzzles beatable backwards, an easy boss, and the ball game keeping half-scores. Regression tests for each.
- Room hints no longer pop up after a room is already done.
- The fifth tool and its kit: beds, a place of your own, crumbling boards, dreamcatchers, bouncy moss, sleep
  puffs, a new sleepy creature; a lab room and tests.
- The fifth region (a road blocked by a sleeping giant, a mushroom wood, a camp, a pond with a channel down to
  the lake, a plateau, a hidden hollow) and the fifth dungeon (11 rooms, a mini-boss, a boss), with tests for
  every room and a playthrough leg from the fourth Knot to the fifth. New music for both.
- The sixth tool's kit: puppets worked from a distance, racks of puppets in step, marching toy soldiers, painted
  scenery; a lab room and tests.
- The sixth region (a fairground under the canyon's high mesa: a jump in, a bolted gate out, a carousel, a pen, a
  lift, a hidden nook, the valley's foggy edge) and the sixth dungeon (10 rooms, a mini-boss, a boss), with tests for
  every room and a playthrough leg from the fifth Knot to the sixth. New music for both.
- The story's first big turn.
- Fixes from the fifth dungeon's review: never stuck inside things after loading or flying home; the room's own place
  comes back when the bedroll is rolled up; a "back to the door" option in every dungeon's pause menu; several ways
  to cheese or lose rooms closed.
- Fixes from the sixth dungeon's review: a dungeon's prize and story scene can no longer be lost by leaving early; no
  key order can shut a room for good; a too-easy room made to need its idea; several shortcuts closed; a boss warning
  made visible.
- The seventh tool's kit: two layers, cords, knots, hatches, and giving things a new place; a lab room and tests.
- The seventh area and dungeon: a place under the town (a guild hall, workshops with logbooks of your real play,
  tunnels with peepholes) and a two-layer dungeon (seven room pairs, a mid-boss, a boss) with the seventh tool; tests
  for every room and a playthrough leg; music for both.
- Fixed: the road from the fair's gate into town was blocked by a fence that never opened.
- The genre turn: three small houses run from underneath, for someone else (nine "Aha" moments to earn), with tests.
- The third act's story turn, its new hall, and what changes after it; two more secrets; tests.
- Fixes from the seventh dungeon's review: its under-layer shortcuts closed; rooms that could be beaten without their
  idea made to need it; a few stale states fixed; regression tests.
- The final act begins: the last tool; the northern woods behind a gate; the last main dungeon (eight rooms, a mid-boss,
  a boss, no hints); townsfolk can be freed and go their own ways; tests for all of it.

- The end of the game: the last act's second half, a final dungeon of ten rooms that recombines every House, the
  ending scenes, credits, what changes afterwards, two more secrets; presets and tests for all of it.
- Fixes from the third/fourth-act review (12 findings): a crash, an early way into the last main dungeon closed, two
  of its rooms made to need their idea, a way out of the small houses, kinder timing in one of them, a boss that can
  now actually hurt you, and smaller things; regression tests.
- The first optional dungeon: nine rooms and a boss, opened by the long secret chain (two of its links fixed so they
  count), with its reward feeding the ending; a small rule change (a loose block used to fill a hole is gone for good);
  tests for every room and screenshots.
- The second optional dungeon: six rooms built around a new use of a late tool, with an old character's last walk as
  its finale and a tool upgrade as its reward; tests for every room and screenshots.
- Long notices wrap onto more lines instead of running off the screen.
- Nine more secrets around the valley (one of them reached only with the new tool upgrade); tests.
- Fixes from the final act's review (one way to make the ending impossible, a way to get stuck, several story and text
  inconsistencies, saving inside the last dungeon); regression tests.
- The final dungeon rebuilt: six new rooms, each pairing an earlier dungeon's idea with a later tool, and a gauntlet on
  the way to the top; tests.
- The scripted playthrough reaches the credits (two more legs); three bugs it found fixed (two ways to get stuck on the
  way, a blocked doorway).
- One whole game played through by the tests from the title to the credits on a single save; an engine bug it found fixed.
- The final encounter reworked into a puzzle that uses the game's own rules, with a second way through for those who
  found the long secret chain; the climax's look strengthened; clues placed where the story promised them.
- The end shown, not only told; a tally of discoveries kept somewhere you can read it; three early places that only the
  late game opens; small touches in the optional houses and past the edge.
- A new room in the last main dungeon, built on a new use of its tool.
- Fixes from the optional dungeons' bug hunt (11 findings: two ways to get stuck for good, a way to skip a dungeon's
  finale, a crash, a secret that couldn't be finished, wandering townsfolk and animals heading the wrong way, and smaller
  things); regression tests.
- A fourth part to the third act's change of pace (three rooms that turn one of its rules round), with tests.
- Art: more variety in the last main dungeon (worn floors, small things on the walls) and movement in the air past the fog.
- Fixes from a second fresh look at the newest pieces (7 findings: a freeze in the finale, an invisible wall left behind,
  a secret reachable the wrong way, and smaller things); regression tests.
- Final verification passed; the project is marked complete.

## 2026-11-10 (polish campaign)
- Smoother: the game now takes exactly one step per screen refresh on ordinary 60 Hz screens (it used to stutter);
  the screen is sized in real pixels on scaled screens (no shimmer at 125% or 150%); a place's floor is painted as you
  enter it (no stall on the first look); thread lines draw much faster.
- A controller works, every key and button can be changed in Options, and the game's hints name what you've set; the
  name screen takes a controller too. A screen filter option (crisp, or two old-television looks).
- Text checked everywhere for running out of its box, off the screen or onto other text; the menus fixed where it did.
  The satchel shows everything you carry (pick a thing to read about it); the journal's notes can be read again.
- Fixes found by running the whole game in a real browser: the first line of the game was hidden under the fade;
  answers to a question could appear above the top of the screen; an animal that blinked out every other step; ten
  found things that showed no picture; animals walking over roofs and fences; a missing character in the font; words
  from the room above never shown when you work from underneath; floating words stacking on each other.
- The game in its own page with instructions beside it (a private link).
- Music changes with a short crossfade instead of a cut.

### Polish round 2 (a critic's review and four picture reviews of a full run)
- The dialogue box goes to the side of the screen that hides least (never over the person speaking or a boss coming
  on); people turn to face whoever they're talking to; pages end where sentences end.
- Notices, name tags and the HUD's words redrawn to read clearly on anything; the HUD steps back over puzzle pieces.
- Signs describe how things work, never the answer; the first time a hint would come, the House asks whether you'd
  like hints at all.
- In a House: "Sit and wait for things to come home" in the menu, and a ring round a moved thing's place shows how
  long it will stay put.
- The map names the regions, marks the Houses' doors and the Well, and flags where you're headed; the journal says
  what's new in town.
- Longer music: fourteen tunes now loop over 45 to 110 seconds instead of 7 to 37; the first four Houses' bosses have
  their own fight tunes.
- Art redrawn where it looked unfinished (a sleeping giant, a giant puppet, busts, moons, doors, signs, seats...).
- Scenes staged to match their words (asleep in bed, lying down, the camera on what's being told, her own thread).
- The Knot ceremony is quicker after the first, and what you hear after it changes each time.

### Polish round 3 (the critic's bigger list, under way)
- Every House's boss now has three different beats (the second changes the arena or the rule, the third wants
  something learnt earlier too), with nothing to set up again between them; fights that took a never-hesitating
  player 100-200 seconds now take 25-50. Every mini-boss falls in two hits.
- New rooms on the main path in Houses 3 to 7 that need two or three earlier ideas together; the fiddliest old room
  (a long rack sequence) has one short way through.
- Each House has its own floor and some set pieces (sluices, bell frames, bed curtains, stage rigging, a hoist).
- All the music is longer (every tune loops over 24 to 110 seconds), with a fight tune per House and a theme of its
  own for the last House.
- Story scenes show what they tell: the festival's crowd and latecomers, the first big moment staged and heard out
  person by person (about half the boxes), the last moments and the epilogue as a sequence of shots.
- Creatures show their threads home; a smashed thing's thread no longer runs off sideways; a carried thing is no
  longer drawn twice; the camera eases all the way to what a scene shows.
- House 8 reworked like the others; the act after the first big moment is twice as long, with new kinds of rooms.
- The last dungeon rebuilt: a rule of its own, shown before it's needed; rooms that each want several steps and an
  idea, in any order; a look and a tune of its own; a long climb that no longer sends you all the way back down.
- Four regions of the valley redrawn with their own ground and landmarks, each with a puzzle place of its own and
  spots that later tools open; the seams where regions meet are gone. Then the other four the same way, with the
  roads to the later Houses made of puzzles, finds that matter later, and the fog drawn as a bank of threads.
- Every puzzle room rated for difficulty against a curve that starts gentle and ends hard; rooms that could be
  solved without their idea now want it, and signs that described a step now say only how the place behaves.

