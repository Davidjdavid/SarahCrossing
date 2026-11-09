# HOLLOWELL: Dungeon Tracker

> Spoilers. Every dungeon, its grammar, rooms, secrets and status. Status keys:
> `planned` → `built` (playable) → `tested` (scripted solution passes in tests/) → `polished`.

| Id | Dungeon | Region | Grammar | Tool | Boss | Status |
|---|---|---|---|---|---|---|
| D1 | Tidyhouse | Meadowfold | The Return (timing, passing plates, ramming, path shape) | Gloves | Grand Housekeeper | tested |
| D2 | Kiln | Kilnridge | Shards retrace the carried path | Hookline | Kilnwyrm | planned |
| D3 | Millrace | Millwater | Currents vs the Return; rafts | Paddle | Old Grindle | planned |
| D4 | Belfry | Belfry Heights | Wind displaces; bells snap home; sleepers | Recall Bell | Tollgrim | planned |
| D5 | Slumberhouse | Hushwood | Your own mark; falls as travel | Bedroll | Mother Sloth | planned |
| D6 | Marionette Hall | Larkspur Fair | Remote bodies; synchronised puppets; flats | Crossbar | Great Marionette | planned |
| D7 | Spoolworks | Underside | Two layers; cords; counterweights; linking | Needle | The Tangle | planned |
| D8 | Loom | Loomwood | Permanence; warp threads; cutting | Shears | The Weaver | planned |
| F | Great Spool | under the Well | Six Knot-locks remixing every House | – | The Spool | planned |
| O1 | Stray House | Frayed Edge | Nothing returns | Twin Bedroll | The Pile | planned |
| O2 | Unfinished House | Hollowell hills | Finish chalk rooms with the Needle | Long Hook | – | planned |
| M | The Makings (×3) | Underside | Indirect control: Tuck | – | – | planned |

## Per-dungeon structure (every House)

1. Entrance hall: the grammar in a safe, curious encounter.
2. Experiment rooms (2–3).
3. Escalation rooms (2–3).
4. The tool (mid-dungeon), a room that teaches it, rooms that combine it with the House's grammar.
5. Combination rooms with earlier grammars.
6. Hidden Maker's signature room (S06) and at least one other secret.
7. The Pattern (big key) chest, the culminating puzzle.
8. Boss. Knot hoop. Heartstitch.

## D1 Tidyhouse (`src/42_tidyhouse.js`, tests `tests/tidy.test.mjs`) - tested

Cells are 20x11 rooms on a 4x4 grid; (cx,cy). Entry from Meadowfold (overworld 108,92) into the Foyer.

| Room | Cell | Teaches / puzzle | Solution | Reward | Test |
|---|---|---|---|---|---|
| Foyer | 1,3 | Patience as a timer | Push the wood block (5,5) 2 right onto the plate (7,5) (standard patience), walk to the north gate before it goes home; gate stays open once passed | way north | yes |
| Kitchen | 0,3 | Lift/throw, shatter and reform, crystals | Throw a pot over the low counter at the crystal (4,1); key chest appears. Warm pie (S05) on the table | key 1 | yes |
| Gallery | 2,3 | "A thing at home blocks the way home" | Push the bust (9,5) up into the pocket, push the block (8,5) 2 right through the bust's home onto the plate (walls at (10,6),(11,5),(11,6) so it can't be taken off another way); the bust comes home behind it and holds it there. Standard patience: about a second to spare | Plan | yes |
| Hall of Busts | 1,2 | Heavier shoves lighter | Push the bust (9,6) up 3 (standing on the plate), push the block (8,4) into the lane; the bust coming home shoves the block onto the plate (9,7) and blocks its return. Pushing the block on alone isn't enough (tested) | way to the Ballroom | yes |
| Pantry | 0,2 | Thrown traces cross pits | Throw a crate from (8,5) west onto the island plate; the nook gate opens while it sits there. Staff Only door (S04): push the cupboard aside and stand where it lives | key 2 | yes |
| Parlor | 2,2 | Plates pressed in passing (pulse) | Push the block past the pulse plate; walk to the far door; the block going home over the plate opens it. Standing on the plate and running is too slow | way to the Linen Closets | yes |
| Conservatory | 3,2 | Parity: returns press plates too (toggle plates have a lamp: lit on, dark off) | Carry a crate up the corridor (toggle A on), step on B, throw it back, walk out (A off); the crate going home toggles A on | Heart Patch | yes |
| Linen Closets | 2,1 | Mini-boss: the Dust Monger (armored: only thrown things, shards and coming-home furniture hurt it) | Push the busts so their way home crosses it; throw pots | Gloves | yes (fight by helper) |
| Laundry | 3,1 | Pull (Gloves) | Pull the block out of the cubby 2 tiles, slip in round it, open the chest; push the block out of your way after | key 3 | yes |
| Ballroom | 1,1 | Finale: tidy up. Two busts set out (heavy: they shove Wren aside, so standing in the way does nothing) whose ways home run head-on through one corridor; B's way out of its corner floats over pits | Pull the lever; grip B with the Gloves over the pits (from (5,7) or (3,6)) while A goes through, let go; or after a jam, pull B back out of the corridor and up out of the line. The lever pulled again sets them out again | Pattern | yes (4 tests) |
| Library | 0,1 | Pull a heavy shelf | Pull the tall bookcase (9,1) out: a passage to the Attic. Once the Attic's been found, the bookcase stands aside at (10,2) for good | way to the Attic | yes |
| Attic | 0,0 | Maker's signature room (S06) | Teal M.I. monogram, sampler, a teapot and two cups set out | Heart Patch | yes |
| Antechamber | 2,0 | Rest | Pots (two drop hearts), big door with the Pattern | - | yes |
| The Grand Hall | 1,0 | Boss: the Grand Housekeeper | It guards its own mark; heavy furniture out of place in its hall makes it say "Tsk!" (a ! over it) and go and yank it home; push a bust out toward the wall so it stands on the bust's way home when it yanks: slammed, doors open, hit its heart (3x). Pots just bounce off it | Knot, Heartstitch | yes (real slam test) |

Nudges (Hints): every puzzle room has one (`nudge` in the room def), after 2-4 minutes stuck.
Secrets: S04 Staff Only (pantry), S05 pie (kitchen), S06 signature (attic), Heart Patches in the Conservatory and the Attic.
The shortcut lever by the Ballroom's east door opens the Linen Closets' west door from then on.

## Overworld secrets and Heart Patches

| Secret | Where | How | Status |
|---|---|---|---|
| Heart Patch | Meadowfold, behind the windmill (84,84) | walk round behind it | built |
| Linnet note 2 | Meadowfold, under the stray hay bale (100,110) | push the bale: it doesn't come back | built |
| Linnet note 1, portrait (S02) | Gran's house | with the Gloves, Z at the turned picture | built |
| S01 budging | everyone in town | lean on them | built (lines for 17) |
| Heart Patch | Thimble's shop | 120 buttons | built |
| S12 Kids' Housekeeper | the town square, after Knot 1 (Otto's chalk X at hub 38,18) | push a crate straight away from his X and step aside: he comes at it from his side, which is the way it goes home, and his own yank bowls him over. Playground badge | built, tested |
| S28 Tidiness Trials | the Inn's attic, after Knot 1 (`src/53_trials.js`) | 1: block into a pocket, second block on its mouth (20 s); 2: a pot with a 112-tile way home: smash it or carry it back over its own path (15 s); 3: ring the bell, fall into the pit, fly home onto the plate (4 s). 20 + 30 buttons, a Heart Patch; Ives then gives the teal scarf | built, tested |
