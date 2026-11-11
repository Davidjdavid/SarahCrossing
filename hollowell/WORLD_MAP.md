# HOLLOWELL: World Map

> Spoilers. Geography, connections, gates and landmarks. Tile-exact layouts live in `src/data/world_*.js`;
> this file is the plan they follow. Update both together.

## The Hollow (overworld map `hollow`)

One continuous map, ~200 × 150 tiles (16 px tiles), north up. The fog (the Drift) rings it on every side;
walking into the fog pulls Wren back along their trace (until Act IV).

```
            0          50          100         150         200
          0 +-----------+-----------------------+-----------+
            |  FRAYED   |        LOOMWOOD        |  BELFRY   |
            |   EDGE    |     (the Loom, D8)     |  HEIGHTS  |
            | (O1 Stray |  silver birch, silk    | (Belfry,  |
            |   House)  |   ..stone gate (N)..   |    D4)    |
         38 +-----------+----------+------------+  cliffs,  |
            | LARKSPUR  |       HOLLOWELL       |  falls ↓  |
            |   FAIR    |   (hub, the Well)     +-----------+
            | (Marion.  |   river runs N→S       | HUSHWOOD  |
            | Hall, D6) |   (O2 hills N of town) | (Slumber- |
         78 +-----------+----------+------------+ house D5) |
            |       KILNRIDGE      | MEADOWFOLD |           |
            |   red canyons, mesas | (Tidyhouse,+-----------+
            |     (Kiln, D2)       |    D1)     |           |
        112 |           +----------+------------+ MILLWATER |
            |           |   MILLWATER: the Reaches, lake,    |
            |           |   delta, mills (Millrace, D3)      |
        150 +-----------+------------------------------------+
```

### Regions

| Id | Region | Approx. tiles | Music | Notes |
|---|---|---|---|---|
| `hollowell` | Hollowell (hub) | x 50–150, y 38–78 | `town` (fuller after D4, open after the ending) | The Well in the square; river through the east side; bridge; school; playground; shops; Gran's house NW of the square; the Inn E; the north road to the stone gate; the hills (O2) N. The town's favours (`src/51c_town_favours.js`, hub tiles): the Guild's crates in the lane by Thimble's (22,27-30, the gap in its fence at 23,28); the kite's tree by the Inn (46,15) and its peg (45,17); Rosa's saucer on the bakery's front sill (40,32), its back step by Biscuit's crawlspace (40,27); Tuck's marble, wherever he last put it. Burr's post moves in from (32,3) to (32,7) after the fifth Knot; Pudding lies by his ball at (40,25) from the fourth. |
| `meadow` | Meadowfold | block 1,2: x 64–127, y 80–119 (`src/43_meadowfold.js`) | `meadow` | Hay meadow, wheat, hedgerows and dry-stone walls; the pen by the pond (sheep that shy from Wren and amble home the way they were driven); windmill; the Tidyhouse (D1) on a rise SE; the Old Fold (68–82, 90–98: counting stones, Old Tup's bothy); Lucky the lamb across the river (S17, 119,112); the canyon west to Kilnridge, red rock both sides. |
| `kiln` | Kilnridge | block 0,2: x 0–63, y 80–119 (`src/46_kilnridge.js`) | `kiln` | Red canyon of level mesas; steam vents (fire what's in their mouths) and wet clay (holds what lands in it); the pass from town is blocked by a boulder in a niche (Gloves); the Kiln (D2) in the Kiln Mesa, its forecourt gate shut till the firing hole by the road is fired (22,96); the Firing Ground (pit 11–28, 108–114); the sleeping vent and the mesa's chimney (14,94 / 14,88); the clay dam in the slot (60,96); a hawk's nest cliff path; a high mesa overlooking Larkspur (one-way drop). |
| `millwater` | Millwater (the Reaches) | block 2,2: x 128–191, y 80–119 (`src/48_millwater.js`) | `water` | The big lake (north half), Dad's mill on its shore, reeds and snappers, Fen and Wick; the road in from the broken bridge (rows 106-107); the outlet river south over the falls; the self-running ferry at the end of the road (167,106) across to Millrace Falls, the far bank (only reached by water) with the Millrace door (175,105); the hidden pool behind the falls (S19, 171,110) and the basin below; a band of shallows and reeds all round the lake, lily pads; Heron Rock off the east reach's south shore (177–181, 91–95); Wick's Duck Pond (132–140, 97–103), the Old Mill Pond walled in by the mill (159–165, 98–103), the Gulls' Rock (183–187, 87–91) with the eel-catcher's ledge along the north cliffs (172–185, 83) and his pier (184–186, 84–85). |
| `heights` | Belfry Heights | block 2,0: x 128–191, y 0–39 (`src/55_heights.js`) | `heights` | Reached across the lake by raft (Paddle) to the cliff stair, or later the high path from Loomwood; wind gusts; bell shrines; eyelets up the cliffs; heather, gorse and wind-bent trees; the Crags west of the Bluster (131–152, 11–17); the Eyrie NE (183–188, 1–3); the ringers' old bell, dumb (161,32); the Belfry (D4) at the top; the river's source falls. |
| `hush` | Hushwood | block 2,1: x 128–167, y 40–79 (`src/59_hushwood.js`; the cliff stair ravine x 168–174 stays walled off) | `hush` | The Sleeping Road in from town (rows 59–60), blocked by Old Hummock until the Recall Bell; giant mushrooms, glowcaps, sleep puffs (Puffball Hollow) and Snorelings; the stream crossed by bouncy moss (one pad each way) to the Slumberhouse (D5, door 147,48); Hummock's own bed NW; Hettie's camp SW; Lantern Pond with a raft and a weir (wound from this side) down a channel (x 157–158, a current) into the Millwater lake; the far bank over a log bridge, its plateau (moss up, ledge down, Heart Patch); the giant's hollow (S16, 131,56). |
| `larkspur` | Larkspur Fair | block 0,1: x 0–63, y 40–79 (`src/62_larkspur.js`) | `fair` | Under Kilnridge's high mesa (the jump at 12,83 needs a Bedroll laid up top; the straw at 12,74); the midway and carousel (Linnet's note 7); the fortune teller and a painted hedge (nook); the fakir's pen (Heart Patch, Crossbar); toy soldiers; the Marionette Hall (D6, door 31,49); the lift up to the mesa (the stagehand on the winch, Crossbar); the east gate to town's west road (bolted on the fair's side); the fog close on the west (S11); Madame Rook's wheel of fortune by her tent (14–17, 50–53). |
| `loomwood` | The Loomwood & Frayed Edge | block 1,0: x 64–127, y 0–39 (`src/71_loomwood.js`) | `loom` | Behind the north stone gate (rows 36-37, x 94-97; opened by its counterweight in the Seams). Silver birches, moths, silk strands (one hides a clearing with a Heart Patch, 120,10), a stream with a log bridge; the Loom (D8, door 95,9) in the north; the Frayed Edge (west, x 67-78): strays, the Stray House (O1, door 72,6); fog north and west. |

### Gates (what opens what)

| Gate | Where | Needs | Leads to |
|---|---|---|---|
| Meadow road | Hollowell S | – | Meadowfold, Tidyhouse (D1) |
| Canyon boulder | Hollowell SW → Kilnridge | Gloves (pull it into the side niche; it's held there by a stop) | Kilnridge, Kiln (D2) |
| Broken bridge | Meadowfold E → Millwater | Hookline (eyelets on the far piers) | Millwater, Millrace (D3) |
| The lake | Millwater → Heights cliff stair | Paddle | Belfry Heights, Belfry (D4) |
| Sleeping giant | Hollowell E road → Hushwood | Recall Bell (wakes it) | Hushwood, Slumberhouse (D5) |
| The weir | Hushwood's Lantern Pond ↔ the Millwater lake | wound from the Hushwood side (one-way until then) | a raft down the channel to the lake; back up by paddling or riding a raft home |
| The high mesa | Kilnridge NW → Larkspur | Bedroll laid up top (a jump into the straw; back by Homeward) | Larkspur Fair, Marionette Hall (D6) |
| The fair gate | Larkspur E ↔ Hollowell's west road | the bolt on the fair's side | a short way home from the fair |
| The fair lift | Larkspur ↔ the high mesa | the Crossbar: the stagehand puppet onto the winch | up and down the cliff |
| Inn Staff door | Hollowell Inn | Reveal 1 | The Underside (and through the Guild Hall, the Spoolworks, D7) |
| West Gate | Hollowell's west road ↔ Larkspur | the bolt on the fair's side (opens the town's fence too) | the fair from town |
| North stone gate | Hollowell N road | Needle (re-thread its counterweights from below) | Loomwood, Loom (D8) |
| The fog | Every edge | Shears (cut your own thread) | The Drift |
| The Well | Hollowell square | The Great Pull (Act IV) | The Great Spool (final) |

### Loops and shortcuts
- Kilnridge ↔ Meadowfold cave (opened from the Kilnridge side with the Hookline).
- Millwater ↔ Hushwood river channel (Paddle).
- Belfry Heights ↔ Loomwood high path (Hookline eyelets; opens after the stone gate or from Heights).
- Larkspur ↔ Kilnridge lift (Crossbar).
- Larkspur → Frayed Edge hidden route (Bedroll + Hookline).
- The Seams (Underside tunnels) link the workshops under every House and the Guild Hall (Act III fast travel).
- Bedroll Homeward: fast travel to wherever the Bedroll lies.

## The Underside (as built: area `underside`, `src/66_underside.js`; cells of 20x11)

- 1,1 The Staff Stairs (from the Inn's Staff door; arrival 29,19; stairs up at 29,20).
- 1,0 The Guild Hall: Gundry; the big door north to the Spoolworks (29,0); the apprentice cot after D7; east, the
  Making Floor (open after D7).
- 0,0 The Workshops: each Maker at their bench with their logbook (S22), the Kilnwyrm in pieces, a model Tidyhouse.
- 0,1 and 2,1 The Seams: tunnels under the town, four peepholes each in the walls (S23); the north gate's
  counterweight (S32, Act IV) at the east end; the S23 chest.
- 2,0 The Making Floor: Tuck's Little Wander (src/68_makings.js, next).
- Later: the Way Down to the Hall of Names (Reveal 2), the Well shaft.

## The Spoolworks (area `spoolworks`, D7, `src/67_spoolworks.js`)
Two layers: the Works floor on rows 0–2 of cells, the Under-works on rows 3–5 (each below room is 33 tiles under its
room, `above` in its cell). Entrance from the Guild Hall into the Gatehouse (29,31); out the same way.

## The Drift (map `drift`)
Beyond the north-west fog (entered from the Frayed Edge after cutting: walk into the fog at x <= 65, come out at
58,y). Open wild country drawn blank on the map until walked (`blankMap`): a wild meadow in soft patches, wildflowers in
drifts of one kind, heather (NW, along the fog, SE), groves of oak, rowan, birch and pine, an old cart track (rows
18-19) whose bridge is gone (its ends either side of the stream at x 40), a dry-stone wall (x 52-53) with gaps. Linnet's
cottage (14-21, 12-16) and her fenced garden (10-26, 20-27, gate 21-22,20; Drift-blooms, Linnet at 18,21), the stream
(x 40 past the track, wandering south) with stray boulders (43,16 and 46,21: pushed in, they fill it for good), the old
marker stone (THE HOLLOW ENDS HERE, 55,17), a rest stump (30,20). The old mill (37-42, 3-7) on a race out of the north
woods (x 44, a current, walled; gaps in its east wall at 45,3 and 45,7; it ends at a grating, 44,9): its wheel (43,6)
winds up the sluice (40,13) in the dam of the mill pond (35-42, 9-12) while it turns; two barrels and a stray boulder on
the east bank. The pond, run out, shows the old road (row 11, in from 24,11) with its milestone (37,10) and a toll box
(41,10). A lone rowan by the wall (56,4): the fair's balloon in it, if it was cut loose (basket 58,6). East (x >= 60)
walks you back into the fog and out at the Hollow (67,19/20). Nothing returns. After the Unwinding Linnet lives in Gran's
garden instead.

## The Great Spool (map `greatspool`, the final dungeon)
Down the Well (Hollowell square, 95,59) once the Great Pull begins. A 3x4 grid of rooms: the foot (1,3), the six
Knot rooms either side of the Winding Room (1,2) and the Climb (1,1), the Top (1,0). Up the foot's stair: back to the
square (95,60).

## The Stray House (map `strayhouse`, O1)
Through the green door at the Frayed Edge (72,6), once Linnet's seven notes are posted. A 3x4 grid of rooms: the Porch
(1,3, in and out), the Parlour (1,2) with the Pantry west and the Bridge Garden east, the Stair Hall (1,1, locked from
the Parlour) with the Washhouse west and the Mending Room east (locked), the Pile (1,0, up the stairs), Linnet's Room
(0,0, west of the Pile).

## The Unfinished House (map `unfinished`, O2)
Mr Ives's, in Hollowell up the east bank (hub 54-58, 3-5; door at 120,45). A 3x4 grid of rooms: the Front Room (1,3,
in and out), the Drafting Hall (1,2), the Long Gap (0,2) with the Far Shelf (0,1) north of it, the Loading Bay (2,2),
the Gallery (1,1, up the stairs).

## Interiors
(The Lost & Found is 12x9 now: Mabel's counter, her shelves and her floor of strays, the sewing tin's little table by the
counter at 1,3. Jory's Toys is 12x10: the front shop, and behind a wall with a door at 3,4 and a little hole at 8,4, the
back room with the latch plate at 10,2, Jory's note and a chest.)
Gran's house (Wren's room, study, well cellar), Inn (ground, attic, cellar), shops, school, clinic,
Lost & Found, Jory's toy shop, Tuck's house, Dad's mill house, Mum's bell-keeper's lodge, Linnet's cottage.

### Belfry Heights as built (block 2,0) and the cliff stair (block 2,1, east side)
Three terraces stepping up north. Terrace 1 (rows 30-38): the way in from the cliff stair (x 171), the shrine bell
and the boulder asleep on the first stair (x 140), a little cave (158,28-29) stopped up by another sleeper.
Terrace 2 (rows 20-27): the Bluster, a ledge the gusts blow toward a drop back to terrace 1. Terrace 3 (rows
11-17): a chasm (x 168-172) crossed on the Hookline (eyelets 166,12 and 174,12). The top: the Belfry (door 158,7),
Mum outside. The cliff stair is a ravine up the east side of block 2,1 (x 170-172), reached from Millwater's
north-east shore (x 166-172, y 82), which is only reached by water: two rafts, one at Wick's pier and one at
the north shore, each going home to its own side (the Paddle).

### Off the roads in the south and on the Heights (group A additions)
- **Meadowfold, the Old Fold** (68–82, 90–98, way in 75,98): a ring of dry-stone walls round Old Tup's bothy (door 75,95),
  three bands of counting stones across it (yan 78–81,94; tan 75,91–92; tethera 69–72,94). Nettle the ewe (home 70,96).
  The stones count a sheep walking home: drive her round one way and leave her; she counts herself home yan, tan,
  tethera, and Grandad's tally box opens (81,91: the ringers' clapper). Old Tup asleep in the bothy door till the Recall
  Bell (the bothy's Heart Patch, 76,94). Lucky across the river (119,112): hooked over she goes home; the Needle gives
  her a place on this side (S17, Pip).
- **Kilnridge**: the forecourt gate (22,96) on the road to the Kiln, opened by firing the hole in the rock by the road
  (vent 25,97, hole 25,99); the Firing Ground (pit 11–28, 108–114): the vent at its west end (14,111) fires a pot east along
  the row, through a gate open only while Wren stands on the plate (12,113), into the kiln-charm (25,111); the crate on
  that row shoved off it into the wet clay, where it sticks; Heart Patch (27,112), Bram's first pot (24,113). The sleeping vent (14,94): a boulder asleep on it (Recall Bell), then a pot fired up the Kiln Mesa's chimney
  (14,88): 50 buttons (17,90). The clay dam in the slot (60,96): only a pot given its place in the vent's mouth below
  (the Needle) breaks it; Heart Patch at the slot's head (60,86).
- **Millwater, Heron Rock** (177–181, 91–95): a barrel lives on the rock, low rocks round it but on the south. Reeled
  ashore (the Hookline from 179,98) it leaves its mark empty; set it out of the line and hook the mark: over to the rock,
  Heart Patch (179,93). The eel-catcher's post on the shore (178,99) is the way back.
- **Belfry Heights, the Crags** (131–152, 11–17, west of the Bluster): a chasm with stacks in it, crossed on the
  Hookline four ways (an eyelet; a crate's mark the gust empties; a boulder's mark, asleep elsewhere; a pot's mark you
  empty yourself); the Ringers' Stone to carve (134,15) and a Heart Patch (134,16). **The Eyrie** (183–188, 1–3): the
  draught blows a crate into the crevice and it pops home; cut loose (the Shears) it fills it for good: Heart Patch
  (187,2). **The ringers' old bell** (161,32): dumb without its clapper (from the Old Fold); hung, a strike wakes the
  cave's boulder (158,29) long before the Recall Bell.

### Hushwood, Larkspur, the Loomwood (group B additions)
- **Hushwood** (block 2,1; +128, +40): its own floor (moss, mushroom loam, a lane of dusk) frayed into the town's at the
  seam (`blobSeam`). Mallow's nursery before the Slumberhouse door (147,48): three cradles on the bank (144/148/152,54),
  a puffball by each (143/147/151,54), three Snorelings asleep on the green below (136/144/148,56); the door opens while all
  three sleep in the cradles (or once the Slumberhouse is open). Bouncy moss over the stream (140,55 up; 138,51 down).
  A fourth cradle by the house behind a little round hole in the hedge (142,47), the wooden one (145,50): 30 buttons
  (141,49) with all four asleep. **Lantern Pond**: four lanterns on the shore (158,66; 165,67; 160,73; 151,66), each lit
  while its stone plate (heavy) is held down; four mossy stones; all four lit, the isle's chest (158,68: Heart Patch);
  the old loom weight on the isle (159,69).
- **Larkspur Fair** (block 0,1; +0, +40): trampled meadow and sawdust walks, bunting over the square. The parade
  forecourt before the Marionette Hall: a portcullis (31,51) wound up by two drum pads (29,52 and 33,52) while held, a
  toy soldier marching over each in its pen; Pell (36,52). The fair's own crates (25,52; 37,54) go home; two pale stray
  crates out west (4,54; 4,73) stay where they're put. The balloon ascent by the fog (5,70), held by one thread. The big
  wheel (15,62).
- **The Loomwood** (block 1,0; +64, +0): birch wood with silk between the trees, frayed thread-ends by the fog. The warp
  across the Loom's door (94-96,10) lifts while all four sockets (90,12; 100,11; 88,17; 121,17) hold a weight; the
  weights (90,14; 102,11; 88,19; 119,17) are strays. The old weight from Lantern Pond fits any socket for good.
### By the lake, and at the fair (the revisits owed)
- **Wick's Duck Pond** (Millwater, 132–140, 97–103; the Crossbar): walled round with dry-stone; three duck houses in its north
  wall (133/136/139, 97), each watching the water below it; three wooden ducks on their stands (134/136/138, 102) and their
  crossbar in the east wall (140,100), taken from 141,100 (the whole pond in view); low rocks in the water at 138,100 and
  134,101. Fen's beat moved east (142–147, 101).
- **The Old Mill Pond** (Millwater, 159–165, 98–103; the Bedroll): Dad's mill wheel turns in the race at its corner (159,98);
  the race runs in from the lake (160,98) under a grating (160,99) into the pond (160–164, 100–102); the mill's barrel moored
  at 162,97 (shallows to step off at 161,98); the inner bank (164,101–102), the boat (162–163,102), the gate (164,103),
  bolted inside.
- **The Gulls' Rock** (Millwater, 183–187, 87–91; the Needle): a ring of low rocks, the rock inside (184–186, 88–90), the cleft
  in the ring's north side (185,87); the eel-catcher's float moored at 185,86, under his pier (184–186, 84–85) at the end of
  his ledge, shingle along the foot of the north cliffs from the North Shore (172–185, 83); the gulls' nest (184,90); the way
  off, his post on the pier (186,84): hooked from 186,88, it lands you on 186,85.
- **Madame Rook's wheel** (Larkspur, 14–17, 50–53; the Needle): twelve fortunes on the rim of a 4x4, the hub solid
  (15–16, 51–52); the pointer's place NOTHING (15,50), THE TRUTH opposite (16,53); a sign at 18,53.
- **The fog** (`src/33w_fog.js`): drawn as a bank of threads, billowing, its edge spilling over the ground in tongues
  that come and go; the threads glint, tremble during the Pull and are gone after the Unwinding.

