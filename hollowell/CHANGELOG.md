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
