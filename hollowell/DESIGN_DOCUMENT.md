# HOLLOWELL: Design Document

> SPOILERS. This is the internal design. Never quote any of it in progress updates to David.
> Companion files: SPOILERS.md (reveals, solutions, ending), WORLD_MAP.md (geography and connections),
> DUNGEON_TRACKER.md (every dungeon, room by room, with status).

## 0. One-paragraph pitch (internal)

A cozy top-down adventure in a valley town where **everything returns**: every object has a *place* (a
small stitched cross, its **mark**), and anything moved from it leaves a thin thread (its **trace**) and,
left alone for a moment, goes **back the way it came**. The child Wren sets out on the **Wander**, the
town's coming-of-age journey through six **Houses** (dungeons), to tie six **Knots** that keep the valley's
marks strong. Every Zelda convention the player takes for granted (puzzle rooms that reset, pots that come
back, enemies that respawn, townsfolk who stand on the same spot all day, the player being "respawned" at a
room's door after a fall, an invisible wall at the edge of the world, a map that already shows places you
haven't been, a hint system) turns out to be the same single law, and that law turns out to be *people*:
the Houses are built for Wren by the townsfolk (the **Makers**), who work them from a hidden world of
pulleys and spools under the floor (the **Underside**), and the whole valley is held in place by Wren's
grandmother, the **Spinner**, who tied everyone down (Wren included) after her daughter walked away into
the fog. The game turns from playing the Wander, to *making* it for the next child from below, to cutting
the threads, leaving, and coming back by choice.

## 1. Pillars

1. **One law, everywhere.** The Return applies to objects, enemies, townsfolk and the player, with the same
   visible rules. Nothing is a special case; puzzles are built from the law, not around it.
2. **Every convention is evidence.** Each genre convention the player shrugs at is a clue that later means
   something (see SPOILERS.md, "the convention ledger").
3. **Bursts of mechanics.** Each dungeon introduces one strong new grammar, explores it, then folds earlier
   ones in.
4. **Cozy, readable, generous.** No grinding, fast movement, forgiving respawns, optional hints that are
   themselves part of the story.
5. **The player's role changes.** Player → Maker → Unmaker → free person.

## 2. Technology

- **HTML5 canvas + vanilla JavaScript**, no dependencies, built into one self-contained file
  `hollowell/play.html` that opens by double-click in any desktop browser (Chrome, Edge, Firefox, Safari).
- Why not Godot 4 (preferred "if appropriate"): this studio works headless in a container with no editor and
  no display; Godot exports need export templates and give the player an executable to trust; and the
  game must be tested end to end by scripted bots and screenshots, which Playwright + Chromium (installed
  here) does very well for a web game. A single HTML file is also the easiest possible launch.
- Internal resolution 320×180 (16:9), 16×16 tiles, integer-scaled with crisp pixels. 60 steps a second,
  fixed timestep, deterministic (seeded RNG) so scripted playthroughs replay exactly.
- The simulation never touches the DOM, so tests run the real game code headless in Node (`vm`).
- Saving: three slots in `localStorage` plus export/import save codes.
- Audio: WebAudio chiptune synthesizer (two pulse channels, triangle, noise) with a small tracker format;
  every track and sound effect is written in code.
- Art: pixel art drawn in code: tiles painted procedurally per theme with seeded noise, characters and
  objects as hand-written pixel grids with palettes; townsfolk assembled from a body base plus hair,
  clothes and accessories.

## 3. Controls

| Action | Keyboard | Gamepad |
|---|---|---|
| Move | Arrows / WASD | D-pad / left stick |
| Action (talk, read, lift, throw, open, grip) | Z / J / Space | A |
| Swing the stick | X / K | X |
| Use equipped tool | C / L | B / Y |
| Cycle tools | Q / E | LB / RB |
| Menu (tools, map, journal, options, save) | Enter / Esc | Start |
| Map | Tab / M | Select |

Holding Action against a block with the Gloves pulls it; holding Action on a displaced thing grips it.

## 4. The core law: the Return

In-world names: *the Return*, *the Way*. Children's rhyme: "Push it, pull it, toss it, drop it, back it
comes and none can stop it." Town motto, carved on the Well: **EVERYTHING IN ITS PLACE**.

### 4.1 Rules (all discoverable by play)

1. **Marked things return.** Anything with a mark (a stitched cross on the ground under its home spot)
   that is moved off it will, after its **patience** (a pause after it was last disturbed), go home.
2. **Back the way it came.** While away from home it lays a **trace**: the tiles it passed through, in
   order, with loops erased (a thread cannot knot on itself: returning to a tile cuts the trace back to it).
   Returning, it travels the trace in reverse at a steady pace.
3. **Held things wait.** Carried, gripped, ridden-and-paddled, tied off, or otherwise held things do not
   return while held; their patience restarts when let go.
4. **Heavier shoves lighter.** A returning thing shoves anything lighter than itself out of the way (one
   tile along its direction) and waits behind anything as heavy or heavier, or anything that can't move.
   Weights: light (pots, small crates, keys, critters), medium (wooden blocks, barrels, the player,
   townsfolk, most enemies), heavy (stone blocks, boulders, statues), fixed. A heavy returning block shoves
   the player, including into a pit.
5. **Falls and sinks go home at once.** A marked thing that drops into a pit or sinks in deep water is
   snapped straight home (it reappears at its mark with a pop). So marked blocks can't fill pits.
6. **Breaking doesn't stop it.** A marked thing that breaks flies home in pieces along its trace, the pieces
   striking whatever they meet at head height, and reassembles at its mark.
7. **Strays stay put.** Unmarked things (rare early on) never return: they fill pits for good, stay
   where pushed, can be carried anywhere.
8. **You have a place too.** Falls, drowning and fainting send the player home along their own trace
   (shown as a red thread during the flight). In dungeons the player's mark is the doorway of the room
   they entered by; outdoors it is the last place they rested; fainting sends them to their bed.
9. **The colour of a thread** says who made the mark (a Maker's colour). Never explained until Act III.

Tuning (defaults, per kind overridable): patience light 1.5 s, medium 2 s, heavy 2.5 s; return pace
10 frames per tile; snap-return (bell, yank) 3 frames per tile; push 16 frames per tile.

Tells: a displaced thing's trace is drawn on the floor as a thin line in its thread colour from its mark;
its mark (an X stitch) shows while it is away; in its last half-second of patience the thread brightens
and the thing shivers. A thing reaching home clicks into place with a little sparkle.

### 4.2 Systemic consequences the engine must support (not hand-scripted)

- Returning things press pressure plates and trip switches *in passing*.
- Returning things carry what rides them (a raft carries the player; a block carries a bedroll on top).
- A thing's trace can run through rooms and doorways; carried out of its room it still comes back through
  the door. Things displaced on another map return in the background (time = patience + trace length).
- Enemies are marked to their nests: knocked back, they return; defeated, they unravel into yarn that
  returns and re-forms after the player leaves the room.
- Townsfolk are marked: push one for a while and they shuffle off their spot, then shuffle back.
- Keys taken out of their House fly back to it at the exit ("the key tugs toward the Tidyhouse").
- Shop goods dropped return to their shelf.
- The edge of the valley (the fog) pulls the player back along their trace.

## 5. Player kit and progression

Start: walk (fast, 8-way), Action (talk, read, lift light things, throw, open chests), push (walk into a
block), **Wanderstaff** (the stick: a short swing that damages enemies, hits crystal switches and knocks
light things back one tile, which displaces them).

| # | Tool | From | What it does | Opens in the world |
|---|---|---|---|---|
| 1 | **Gloves** | D1 Tidyhouse | Pull blocks (hold Action, step back). Grip a displaced thing to hold it where it is. | Blocks in niches, returning gates held open, pulling things out of walls. |
| 2 | **Hookline** | D2 Kiln | Throw a hook 6 tiles. On an empty mark or an eyelet: reels you to it. On a light/medium thing: reels it to you (displacing it). On heavy: reels you to it. Fetches small items. | Chasms and rivers with eyelets or empty marks; islands. |
| 3 | **Paddle** | D3 Millrace | Stand on any floating thing (raft, crate, barrel, log, lily pad) and steer it. Paddling counts as holding. | Lakes, rivers, the Reaches, the flooded cave. |
| 4 | **Recall Bell** | D4 Belfry | Ring: every displaced marked thing within 7 tiles snaps home at once (fast, shoving harder). Wakes sleepers. Sounds bell-stones. | Sleeping giant on the east road, bell-locks, snapping stuck boulders home to open caves. |
| 5 | **Bedroll** | D5 Slumberhouse | Lay it to make your own mark anywhere (one at a time). Hold the tool to go **Homeward**: fly back along your own trace to it, over anything you crossed even if it's gone. Falls return you to it. | One-way drops, paths that no longer exist, fast travel. |
| 6 | **Crossbar** | D6 Marionette Hall | Take the strings of a marionette or puppet statue in sight and walk it (you stand still). Some crossbars move several puppets at once. Released, a puppet goes home. | Puppet statues that press far plates, crawl through small holes, cross spikes. |
| 7 | **Needle** | D7 Spoolworks | Re-mark: pick a marked thing, choose a new spot within 4 tiles in sight; it moves there and that is now its place. Up to 3 re-marks at a time (a 4th undoes the oldest); Unpick puts one back. A stray can be given a mark. | Moving obstacles for good, shortcuts, the stone gate, finishing the Unfinished House. |
| 8 | **Shears** | D8 Loom | Cut a thread: the thing becomes a stray, for good. Cut townsfolk free. | Strays fill pits; freed people; the fog at the edge. |

Other progression: **hearts** (stitched patches; 3 to start, +1 per boss, +1 per 4 Heart Patches: 16
patches in the world), **buttons** (money), dungeon **keys**, each House's **Pattern** (its master key)
and **Plan** (its map), **Knots** (one per House). Optional upgrades: Long Hook (O2), Linnet's bracelet and a Heartstitch (O1),
Stray Charm (Lost & Found).

## 6. Story and acts (summary; details in SPOILERS.md)

**Prologue (Hollowell).** Wren wakes in their bed (a red stitched X under it) on the morning of the Wander.
Gran Hesper, Warden of the Well, gives Wren the Wanderstaff at the Well in front of the town. Miss Quill
reads the Rules of the Return. The task: the six Houses, six Knots, "so the valley keeps its shape".

**Act I, The Wander (D1–D4).** Meadowfold and the Tidyhouse; Kilnridge and the Kiln; Millwater and the
Millrace (Dad's mill nearby); Belfry Heights and the Belfry (Mum's bell tower). The Knotting Festival in town.

**Act II, The Seams (D5–D6).** Hushwood and the Slumberhouse (the player's own mark); Larkspur Fair and the
Marionette Hall (puppets; a puppet of Wren rehearsing the Tidyhouse on a stage set). The Great Marionette
falls and the toymaker Jory is caught at its controls: **Reveal 1, the Houses are made**.

**Act III, Below (D7 + the Makings).** The Makers take Wren under the Inn into the Underside: the Seams
(tunnels), the workshops under each House, the Spoolworks (D7, the Needle). Wren is made an apprentice and
runs little Tuck's first Wander from below (eight Makings: the later ones rooms of Wren's own Tidyhouse seen from
underneath, and Otto along as the Housekeeper, tidying whatever Tuck pushes). Deep in the Underside: the Hall of Names, a
spool for every person in the valley (Wren's too) and Linnet's, cut, and Gran's ledger: **Reveal 2, the
Return holds people, and Gran has been tightening it**. Gran yanks Wren home to bed.

**Act IV, Loose Ends (D8, the cutting, the Drift, the Great Spool).** Through the north stone gate to the
Loomwood and the Loom (D8), the First Spinner's own ancient place, where nobody helps (no nudges): the
Shears. Wren cuts townsfolk free (the hub comes alive), then cuts their own thread at the fog and walks
into the **Drift**, the unmarked world, and finds Aunt Linnet. Coming back on foot, Wren finds Gran pulling
the whole valley home: the **Great Pull**. Down the Well into the **Great Spool** (final dungeon): untie
the six Knots and climb the Spool to Gran. Linnet arrives; Gran lets go. The Unwinding.

**Epilogue.** Threads go slack, the fog thins, birds fly away and come back, people walk where they like.
The Makers keep their Houses' threads, by choice, for play. The title screen changes. Post-game: the free
valley and the Drift.

## 7. Genre transformation

1. **Hours 0–7: a Zelda-like** with a physics quirk. Direct control, conventional structure, conventions
   (reset rooms, respawn, fixed townsfolk, edge walls, pre-drawn map, hints) everywhere.
2. **Hours 7–10: the Maker game.** Wren works *below* the world: the Underside is shown under a see-through
   overlay of the room above, threads hang down as cords at each mark, and the verbs become tug, re-thread
   (Needle), hold and tie off. In the Makings the player no longer controls the hero: Tuck walks on his own
   by simple visible rules (heads for the exit; walks over to whatever just moved and pushes it; backs away
   from danger; sits down if stuck) and the player arranges the House from below so he gets through, and
   ideally solves something himself (the Makers grade "Aha!" moments). The player now understands every
   nudge, reset and conveniently placed block of the first half from the other side.
3. **Hours 10–13: unmaking.** The Shears break conventions on purpose: cut people walk on schedules, cut
   enemies stop re-forming, cut blocks stay in pits; cutting Wren's own thread removes the hearts from the
   screen (there is nothing left to pull Wren home), the map of the Drift starts blank and is drawn as Wren
   walks, saving becomes "remembering", and nothing in the Drift ever returns.
4. **Ending: return by choice.** The Bedroll still works after the cut ("a place you choose isn't a leash"),
   the cat that came back of its own accord, Linnet coming home: the last act is choosing to come back.

## 8. Meta narrative (connections required by the brief)

| Area | How the hidden truth touches it |
|---|---|
| Overworld | The fog at the edge (taut threads seen from afar); strays near the edges (Linnet cutting from outside); landmarks that are Maker hatches (painted stumps, round doors); the north stone gate held by counterweights below. |
| Hub | Townsfolk on fixed spots; pushing them; Old Arlo remembers "walking about"; the turned portrait; the locked well cellar; the Inn's Staff door; the empty pedestal "the Wanderer's Knot"; the town grows stiller after each Knot; Biscuit the cat is the one free creature. |
| Dungeons | Thread colours = Makers' clothes; warm pie; chalk outlines of unfinished rooms; Staff Only doors; noises behind walls; bosses unravel into yarn that drains *down*; the Wren puppet; painted-flat walls; nudges. |
| NPCs | Makers know things they shouldn't; Mum and Dad "busy before a Wander"; Dr Mallow's long nights; the tailor's costume; Hesper's thread calluses. |
| Environmental details | The Well's winch turns by itself; marks everywhere; "EVERYTHING IN ITS PLACE". |
| Gameplay systems | The Return itself (the "physics" is labour); respawn = Wren's own thread; enemy respawn = yarn going home; keys fly back; shops restock. |
| Optional secrets | Linnet's Trail; the Lost & Found's strays (scratched "L"); pushing every townsperson; Maker signature rooms; the logbooks (real play data). |
| Interface | Stitched hearts (thread strength; they unravel when cut); a little red spool in the HUD (Wren's thread); "Tie off here?" saving; a map that shows unvisited places (Maker-drawn) and a blank Drift; the Options' **Hints** toggle that is the Makers' nudges (renamed "Makers' nudges" after Reveal 1); the title screen changing per act. |
| Progression | Each Knot tightens the valley (hub gets stiller, fog closer); the six Knots are untied in the final dungeon. |
| Ending | The Unwinding; credits list the Makers and "Wanderer: <name>"; Continue becomes "Carry on". |

**The Makers' logbooks.** The game records real play data (time in each room, falls, faints, hits, which
nudges fired, secrets found or missed, boss solutions used, whether hints were off). In Act III each
Maker's workshop has a logbook that reports it in that Maker's voice. Nudges in Act I/II are logged as
interventions.

## 9. Hub: Hollowell (see WORLD_MAP.md for layout)

Buildings: Gran's house (Wren's room; Gran's study; the locked well cellar), the Well (centre square; winch,
motto), the Spool & Thimble Inn (Mother Ives; attic: Tidiness Trials; Staff door → Underside in Act III),
Thimble & Things (general store), Bram's pottery stall, Rosa's bakery, Seam's tailor shop (cosmetic
scarves; back room), Dr Mallow's clinic (heals), the Lost & Found (Auntie Mabel), the schoolhouse (Miss
Quill's blackboard: the Rules, changing per act), Jory's toy shop (closed "for the season" until Act II),
the playground (kids), the river bridge (Fisher Hob), Old Arlo's bench, Constable Burr's posts (the fog
edge NE of town is far; Burr guards the north stone gate road), Tuck's house.

Evolution (by flag): see SPOILERS.md "Hub timeline". New activities over time: Tidiness Trials (after D1),
Returnball at the festival (after D4), kids' pretend Wander (after D1; a tiny puzzle they built), the
Underside peepholes (Act III), Tuck's Little Wander (Act III), freed townsfolk on schedules (Act IV), the
Unwinding festival and the open road (epilogue).

## 10. Regions (summary; geography in WORLD_MAP.md)

| Region | Identity | Environmental interactions | Dungeon |
|---|---|---|---|
| Hollowell (hub) | Timber town round a great well, cobbles, bunting, a river | Townsfolk, shops, the Well | (Underside entrance, final dungeon) |
| Meadowfold | Rolling fields, hedges, sheep, a windmill, flower meadows | Marked sheep that return to pens (herding), hay bales, the windmill | D1 Tidyhouse |
| Kilnridge | Red clay canyons, mesas, kilns' smoke, cracked earth | Pots everywhere (shatter and reform), heat vents, wet clay | D2 Kiln |
| Millwater (the Reaches) | River delta, reeds, piers, mills, a big lake | Currents, floating things, rafts | D3 Millrace |
| Belfry Heights | Windswept cliffs, heather, bell shrines, stone stairs | Wind gusts, bells, eyelets on cliffs | D4 Belfry |
| Hushwood | Dim forest of giant mushrooms and moss, sleeping beasts | Sleep puffs (breathe the spores and you wake on your mark), Snorelings, bouncy moss, a sleeping giant across the road | D5 Slumberhouse |
| Larkspur Fair | An abandoned fairground in a glade: tents, carousel, painted signs | Puppet statues, carnival props | D6 Marionette Hall |
| Loomwood (with the Frayed Edge) | Silver birches, silk strands, moths, fog close by, strays | Taut silk lines, strays, moths | D8 Loom; O1 Stray House |
| The Underside | Beneath everything: tunnels, workshops, spools, cords | Cords from above, counterweights, hatches | D7 Spoolworks; the Makings |
| The Drift | Beyond the fog: open wild country, nothing returns | Strays only, blank map | Linnet's cottage |

## 11. Dungeons (summary; room-by-room in DUNGEON_TRACKER.md)

| # | House | Maker | Grammar (new) | Tool | Boss |
|---|---|---|---|---|---|
| D1 | Tidyhouse | Mother Ives (teal) | The Return itself: timing by patience, plates pressed in passing, ramming, path shape, carrying traces | Gloves | The Grand Housekeeper (an armoire that charges; slam it with returning furniture) |
| D2 | Kiln | Bram (ochre) | Shards fly back along the trace: *you lay the shards' path by where you carry the pot* | Hookline | The Kilnwyrm (a ceramic serpent of marked segments) |
| D3 | Millrace | Ambrose (blue) | Currents vs the Return: drift, tug-of-war, rafts as round-trip rides, dams, waterwheels | Paddle | Old Grindle (a pike-shaped mill automaton in the millpond) |
| D4 | Belfry | Tess (brass) | Wind gusts displace things remotely; bells' shockwaves snap things home; sleepers | Recall Bell | The Tollgrim (a gargoyle living in a great bell) |
| D5 | Slumberhouse | Dr Mallow (lavender) | Your own mark: beds set it, falls are travel, your trace remembers paths that are gone | Bedroll | Mother Sloth (pulls you to *its* bed) |
| D6 | Marionette Hall | Jory (crimson) | Remote bodies: puppets, synchronised puppets, painted flats that are cardboard | Crossbar | The Great Marionette → Reveal 1 |
| D7 | Spoolworks | The Guild / Gundry (umber) | Two layers: cords from above, tug, tie-off, counterweights, linked cords, hatches | Needle | The Tangle |
| D8 | Loom | the First Spinner (silver) | Permanence: strays, warp threads as bridges and walls, cutting | Shears | The Weaver (binds you to its web) |
| F | Great Spool | Gran Hesper (all colours) | One new rule, the Pull (whatever is off its place is wound in toward the drum, not home; the Bedroll the one place that stays); six Knot rooms, each its House's grammar with another House's tool, several steps and an aha, any order; a ratchet by each door lays a room back; the Climb with a checkpoint per lane; the Great Pull at the top | – | The Spool |
| O1 | Stray House | Linnet (no thread) | Nothing returns: real Sokoban with strays; build your own bridges | Linnet's bracelet, Heartstitch | The Pile |
| O2 | Unfinished House | Mr Ives (chalk) | Finish chalk-outlined rooms with the Needle; design a room for its Maker | Long Hook | – (Mr Ives walks it) |

Each House: an entrance hall that introduces its grammar safely; 4–6 rooms of experimentation; the tool
around the middle; rooms that fold in earlier grammars; a hidden **Maker's signature room**; a culminating
puzzle; the boss; the Knot hoop.

## 12. Enemies (overworld and dungeons)

All marked to nests unless noted. Light combat; the stick does 1 damage. Enemies telegraph clearly.

- **Nibblers** (moth larvae, Meadowfold/D1): wander, 1 HP, light.
- **Dust bunnies** (D1): hop toward you, 2 HP, scatter into fluff that returns.
- **Clay pots with legs, "Crocks"** (Kilnridge/D2): shatter when hit; shards fly home and hurt what's in the way.
- **Kiln imps** (D2): throw embers.
- **Reed snappers** (Millwater/D3): pop out of water.
- **Bobbers** (D3): float on currents, explode into spray.
- **Gustlings** (Heights/D4): push you with wind.
- **Belfry bats** (D4): asleep until a bell rings.
- **Snorelings** (Hushwood/D5): asleep; awake they chase; spores.
- **Toy soldiers** (Larkspur/D6): march straight on and turn at anything in their way (about-turn, or always
  right); they weigh on plates as they pass and can be steered by putting things in their beat.
- **Cord-snakes** (Underside/D7): slither along cords.
- **Moths** (Loomwood/D8): drawn to movement, bind with silk.
- **Strays** (the Drift): critters that don't return; peaceful.

## 13. Secrets (target ≥ 30; solutions in SPOILERS.md)

Kinds: environmental, hidden rooms, optional puzzles, unusual interactions, multi-region chains, NPC
discoveries, hidden uses of mechanics, optional dungeons, the major secret quest (Linnet's Trail).
Numbered list in SPOILERS.md §4 with locations and solutions; tracked in DUNGEON_TRACKER.md and tested.

## 14. Presentation

- Palette: warm, saturated, Nintendo/Dragon Quest-bright, with a textile theme: stitched borders on dialogue
  boxes and menus, embroidered hearts, a spool for the player's thread, buttons as money.
- Each region and House has its own palette, tiles and music (see DUNGEON_TRACKER.md and WORLD_MAP.md).
- Characters: 16×16 sprites with dark outlines, 4 directions, walk cycles, expressions in dialogue (a
  portrait strip with emotion frames for main characters).
- Feedback: dust puffs on pushes, sparkles at homecoming, screen shake on heavy slams, hit-stop on hits,
  little sound for every interaction, a thread "twang" before a return.
- Music: a theme per region and House, boss theme, Underside theme, the Drift, the Great Spool, ending.
  Gran's theme and Linnet's theme share a melody (mother and daughter); the Return motif (four notes that
  go up and come back down) is in the title theme and returns, reversed, in the ending.

## 15. Accessibility and comfort

Rebindable keys (Options), volume sliders (music, effects), screen shake on/off, text speed, Hints on/off,
colour-safe tells (traces are also dotted/patterned per Maker, not only coloured).
