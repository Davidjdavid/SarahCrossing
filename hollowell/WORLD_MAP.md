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
| `millwater` | Millwater (the Reaches) | x 50–200, y 112–150 and x 150–200, y 78–112 | `water` | The river delta, Dad's mill, piers, reeds, the big lake; the broken bridge (Hookline eyelets); the Millrace (D3) on the falls of the lake's outlet; the hidden channel behind the falls (S19). |
| `heights` | Belfry Heights | x 150–200, y 0–60 | `heights` | Reached across the lake by raft (Paddle) to the cliff stair, or later the high path from Loomwood; wind gusts; bell shrines; eyelets up the cliffs; the Belfry (D4) at the top; the river's source falls. |
| `hush` | Hushwood | x 150–200, y 60–112 | `hush` | East road from town blocked by the sleeping giant (Bell); giant mushrooms, moss, sleeping beasts; the Slumberhouse (D5); a river channel to Millwater (Paddle shortcut); the giant's hollow (S16). |
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
