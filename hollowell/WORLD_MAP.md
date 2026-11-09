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
| `hollowell` | Hollowell (hub) | x 50–150, y 38–78 | `town` (fuller after D4, open after the ending) | The Well in the square; river through the east side; bridge; school; playground; shops; Gran's house NW of the square; the Inn E; the north road to the stone gate; the hills (O2) N. |
| `meadow` | Meadowfold | x 100–150, y 78–112 | `meadow` | Sheep pens, windmill, hedge maze, the Tidyhouse (D1) on a rise SE; a cave to Kilnridge (opens from the Kiln side). |
| `kiln` | Kilnridge | x 0–100, y 78–150 (west part) | `kiln` | Red canyon; the pass from town is blocked by a boulder in a niche (Gloves); kilns, mesas, a hawk's nest cliff path; the Kiln (D2) built into a mesa; a high mesa overlooking Larkspur (one-way drop). |
| `millwater` | Millwater (the Reaches) | block 2,2: x 128–191, y 80–119 (`src/48_millwater.js`) | `water` | The big lake (north half), Dad's mill on its shore, reeds and snappers, Fen and Wick; the road in from the broken bridge (rows 106-107); the outlet river south over the falls; the self-running ferry at the end of the road (167,106) across to Millrace Falls, the far bank (only reached by water) with the Millrace door (175,105); the hidden pool behind the falls (S19, 171,110) and the basin below. |
| `heights` | Belfry Heights | block 2,0: x 128–191, y 0–39 (`src/55_heights.js`) | `heights` | Reached across the lake by raft (Paddle) to the cliff stair, or later the high path from Loomwood; wind gusts; bell shrines; eyelets up the cliffs; the Belfry (D4) at the top; the river's source falls. |
| `hush` | Hushwood | block 2,1: x 128–167, y 40–79 (`src/59_hushwood.js`; the cliff stair ravine x 168–174 stays walled off) | `hush` | The Sleeping Road in from town (rows 59–60), blocked by Old Hummock until the Recall Bell; giant mushrooms, glowcaps, sleep puffs (Puffball Hollow) and Snorelings; the stream crossed by bouncy moss (one pad each way) to the Slumberhouse (D5, door 147,48); Hummock's own bed NW; Hettie's camp SW; Lantern Pond with a raft and a weir (wound from this side) down a channel (x 157–158, a current) into the Millwater lake; the far bank over a log bridge, its plateau (moss up, ledge down, Heart Patch); the giant's hollow (S16, 131,56). |
| `larkspur` | Larkspur Fair | x 0–50, y 38–78 | `fair` | Below the Kilnridge high mesa: drop down (one-way), set the Bedroll, explore; the carousel; tents; puppet statues; the Marionette Hall (D6); a lift back up to the mesa (Crossbar). |
| `loom` | Loomwood & Frayed Edge | x 0–150, y 0–38 | `loom` | Behind the north stone gate (opened from the Underside in Act III). Silver birches, silk strands, moths, the fog close; the Loom (D8); the Moth Matron's birch (S31); the Frayed Edge NW with the Stray House (O1), reachable early by a hidden route from Larkspur (Bedroll + Hookline) for Linnet's Trail. |

### Gates (what opens what)

| Gate | Where | Needs | Leads to |
|---|---|---|---|
| Meadow road | Hollowell S | – | Meadowfold, Tidyhouse (D1) |
| Canyon boulder | Hollowell SW → Kilnridge | Gloves (pull it into the side niche; it's held there by a stop) | Kilnridge, Kiln (D2) |
| Broken bridge | Meadowfold E → Millwater | Hookline (eyelets on the far piers) | Millwater, Millrace (D3) |
| The lake | Millwater → Heights cliff stair | Paddle | Belfry Heights, Belfry (D4) |
| Sleeping giant | Hollowell E road → Hushwood | Recall Bell (wakes it) | Hushwood, Slumberhouse (D5) |
| The weir | Hushwood's Lantern Pond ↔ the Millwater lake | wound from the Hushwood side (one-way until then) | a raft down the channel to the lake; back up by paddling or riding a raft home |
| The high mesa | Kilnridge NW → Larkspur | Bedroll (drop; come back by Homeward) or the lift (Crossbar) | Larkspur Fair, Marionette Hall (D6) |
| Inn Staff door | Hollowell Inn | Reveal 1 | The Underside, Spoolworks (D7) |
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

## The Underside (maps `under_*`)

- `under_hub`: beneath Hollowell: the Guild Hall (entrance from the Inn cellar), peepholes up into homes
  (S23), the Hall of Names (Reveal 2), the Well shaft.
- `under_d1`…`under_d6`: workshops beneath each House (logbooks, reset levers, signature props), joined by
  `seams` tunnels.
- `spoolworks` (D7): the Guild's own dungeon, two layers.
- `making_1..3`: the rooms where Wren runs Tuck's Little Wander from below.

## The Drift (map `drift`)
Beyond the north-west fog (entered from the Frayed Edge after cutting). Open wild country drawn blank on
the map until walked. Linnet's cottage, a meadow of Drift-blooms, a stream, ruins of the old valley edge.
Nothing returns.

## Interiors
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
