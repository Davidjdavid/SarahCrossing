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

