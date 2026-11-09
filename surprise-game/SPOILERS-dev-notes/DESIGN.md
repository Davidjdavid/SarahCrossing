# ⚠️ SPOILERS — DEVELOPMENT NOTES ⚠️

**Everything in this folder spoils the game. The player should not read it.**

---

## 1. Concept brainstorm (private)

Five-plus concepts were considered and scored 1–5 on: fit for the player's taste (T),
genuine discovery (D), mechanics independent of writing (M), feasibility/polish (F),
fair surprise (S).

| # | Concept | T | D | M | F | S | Notes |
|---|---------|---|---|---|---|---|-------|
| 1 | **Adjective thief** – take adjectives off objects ("HEAVY boulder") and put them on others | 4 | 4 | 4 | 4 | 4 | Property vocabulary (OPEN/SHUT/HOT/FLOAT…) lands too close to Baba Is You. |
| 2 | **Map is the territory** – editing the map (cells, legend, compass) edits the world | 5 | 5 | 5 | 3 | 4 | Core already done well by *Carto*; legend editing is fresh but the frame is not. |
| 3 | **Program-your-squad tactics** – units run visible if/then cards; later rewrite the enemy's | 4 | 3 | 5 | 3 | 4 | Risks feeling like a programming exercise; passive. |
| 4 | **Echolocation cave** – sound pulses reveal a dark ecosystem | 3 | 4 | 3 | 3 | 3 | Hard to make readable and cohesive. |
| 5 | **Indirect-control weather tactics** – armies fight on their own; you control weather | 4 | 3 | 4 | 2 | 3 | Emergent battles are hard to tune and can feel random. |
| 6 | **Hidden-rule rooms** (Zendo-style deduction) | 3 | 5 | 5 | 4 | 3 | Pure but dry; little personality. |
| 7 | **Numbers are physical (chosen)** – every number shown in the world can be carried and swapped | 5 | 5 | 5 | 4 | 5 | Fresh, systemic, RPG-flavoured without being an RPG clone. |

**Chosen: #7, "CARRY THE ONE".** It turns the thing this player loves about DQ / SRPGs
(numbers on everything) into the *physical* substance of a small world. One verb (swap a
digit you're carrying with a digit you're touching) gives a large, consistent, learnable
interaction space, and the surprises come from the mechanics themselves (a door number is
an address; a milestone *is* the road's length; the clock *is* the time; a counter carries).

## 2. The one rule

* You carry digits in a satchel (1 slot at the start, it holds a **1** — "carry the one").
* You can exchange a carried digit with any digit **on something you are touching**
  (the 4 neighbouring tiles, your own tile for loose digits) **or on yourself**.
* Numbers are only ever *exchanged*, never removed: you can't take a digit off something
  empty-handed. Loose digits on the ground can be picked up into an empty slot or dropped.
* Every number means the same thing wherever it lives. The icon on its tag tells what kind.

Nothing is explained in words. A "Z" key-cap bubble appears over the first number you
stand next to. Everything else is learned by watching what changes.

## 3. What numbers mean (systems)

| Tag | Where | Meaning |
|-----|-------|---------|
| ⚖ weight | crates, boulders, parcels, the cat, **you** | Push if total weight of the pushed row ≤ your strength. Weight ≥1 sinks into water (fills it: walkable, digits still there — set to 0 and it floats back up). Weight 0 floats: a pushable raft. **You** at weight 0 can walk on water (and sink if your weight changes there). Plates & cracked floors read weight. |
| ✊ strength | you, monsters | Push capacity and damage per bump. |
| ❤ health | you, monsters | 0 = defeated. A defeated monster leaves **all its digits** on the floor (its health is now a **0**). |
| ⌛ age | trees, old walls, bridges, the egg, the empty lot, (hidden) people and you | 0 = **not yet** (dotted outline, passable). Trees 1–2 sprout (passable), 3–9 solid. Walls 1–8 solid, 9 rubble (passable). Bridges 1–8 sound, 9 rotten (won't hold you). Egg 0, chick 1–2 (follows you), 3+ grown (flies to its nest). |
| door numbers | every door | The number **is the address**. A door leads to whatever room has that number. Unknown numbers lead *Nowhere*. No. 0 is the Lighthouse. |
| parcel "to" | parcels | Push a parcel into a door with the same number to deliver it. |
| hour | town clock, later your watch | The global time. Day / dusk / night change who is out, what is open, who is awake. Hours 24–99 are **the Hour That Isn't**. |
| milestones | Long Road | Two numbers: distance back to the village, distance on to the lighthouse. The road *is* those numbers. Set one to 0 on the road and you are there. |
| price / gold | shop, you | Gold must be ≥ price to buy. Prices are swappable. |
| plate need | pressure plates | Pressed if weight on it ≥ need. |
| crack hold | cracked floors | Breaks if weight on it > hold. You fall to the room below. |
| counters | mill wheel, the Great Count | Count up by themselves (wheel while water flows; bell for the Count). 9 → 0 **carries the one** into the next drum — including drums you can't reach. |
| cookies | jar | The number of cookies. Bumping eats one: +1 health. |

Time bands: day 06–17, dusk 18–19, night 20–05, eerie 24–99.

## 4. Structure

```
            [Fort Gate] [Fort Yard]
[Mirror]    [Deep Wood] [Wood Edge] [Clock Hill]
[Mere]      [West Lane] [ SQUARE  ] [East Lane] -> Long Road (99) -> [Cliff / Lighthouse]
[Mill]      [Quarry]    [Harbor]
```

**Goal:** The postmaster hands you a letter "To: No. 0 — the Keeper, end of the Long Road".
The Keeper explains that the lighthouse lamp is the top digit of the Great Count (ships come
home). It only lights when the count **carries over**. The count's four drums are on the
four floors of the tower. Set them all to 9, ring the bell at the top: 9999 → 10000. The
carried one rolls up the tower and lights the lamp. A ship comes home.

### Required abilities for the finale

| Ability | Where | Used for |
|---------|-------|----------|
| Satchel (2 slots) | Shop, price 300 (put a 0 in the hundreds) | Floor 2 needs two digits carried past a one-way ledge |
| Pocket watch | Mill — the counter has to reach 100 (hundreds drum is unreachable: carry) | Floor 3: sun gate / moon gate |
| Spectacles | Fort armory, room 15 (make a cell door read 15) | Floor 4: the top drum is hidden |

### Three ways to reach the lighthouse
1. Walk 99 screens of road (it works; there is a stamp at the halfway point for the patient).
2. Swap milestone digits.
3. Put a 0 on any door. (The letter literally says "No. 0".)

## 5. Secrets (stamps — the courier's collection, shown in the post office album)

1. **Hollow** – the ancient tree in Deep Wood at age 9 opens a hollow (squirrel's room).
2. **Mirror** – Mirror Pond's stone flips digits upside down (6↔9). The "9" lying on it is a 6.
3. **Hour That Isn't** – set the hour to 24–99: everyone vanishes; the old clock tower on
   Clock Hill grows a door. Inside: Satchel III + stamp.
4. **Nowhere** – any door with an address nobody has: the dead-letter office.
5. **Housewarming** – build the house on the empty lot (age 0 → anything) and visit No. 9.
6. **Cellar** – the Quarry's cracked floor under heavy feet drops you into the old dig.
7. **Far Shore** – with spectacles the sea at the Harbor shows its width: ∞. Swap it and a
   tiny far shore appears… and you are carrying ∞.
8. **Long Walk** – actually walking the Long Road to its halfway marker.

Smaller surprises: the chick companion; your own age (spectacles) — age 0 "not yet";
the guard leaves at night; the shopkeeper notices her prices; delivering the parcel to the
wrong door; ∞ in odd places.

## 6. Ending
Ring at 9999 → cascade animation outside the tower (each window rolls 9→0 bottom to top,
the one carried up into the lamp) → beam → a ship's light → Harbor: the Keeper's son
steps off. Title card, a few lines of credits, the island's numbers (steps, swaps, stamps).
Post-game: the world stays playable for the remaining stamps.

## 7. What changed during playtesting (changelog)

- **Rafts, not fill.** Heavy things sink and stay sunk (not a Sokoban bridge); only weight 0
  floats. Setting a sunk thing to 0 makes it rise — the Mere puzzle is built on that.
- **Monsters can't be pushed.** Bumping a monster always attacks; pushing the golem out of
  the gateway was confusing and dodged the fight.
- **The golem winds up** ("!") for one turn before it strikes, so stepping next to it isn't
  instant death and the player always gets one action to disarm it.
- **Rotten bridges just won't hold you** (they creak) instead of collapsing and destroying
  their digit.
- **Gifts drop beside you, not under you**, when your satchel is full (the first 0 tip was
  hidden under the player sprite).
- **Doors only exist while their house stands** (hidden house ages with spectacles), and
  people have hidden ages too; the guard steps aside as a child. The spectacles reveal felt
  thin with only a handful of hidden numbers.
- **"Walk home"** in the pause menu: the second floor's one-way ledge plus autosave could
  otherwise strand a player who reloads in the lower part.
- **A one-time undo tip** the first time something sinks or falls; the death screen already
  taught undo, a lost parcel didn't.
- **Stamp rumors.** Missing stamps show a cryptic one-liner in the album, so secrets are
  hinted without being explained.
- **Tock's line** about the clock was too explicit; now oblique ("It keeps it").
- Undo through doors didn't restore the destination room's return point — found by the fuzz
  test.
- **Independent review pass** (a separate reviewer reading only the code and notes) found 9
  defects, all fixed with regression tests: ∞ at the shop could make gold NaN and freeze the
  screen through the save (priceless items now refuse; endless gold stays one ∞; saves are
  sanitized on load); a held key could shove the Mere crate into the lake (reeds now block it;
  the plate's own need digit was always a fallback); "start this room over" duplicated things
  that had fallen into other rooms (restart now restores every room the room's actions touched,
  and undo remembers which room-start applies); ∞ milestones made the road unrepairable and
  didn't survive saving (milestones refuse ∞); R after the ending un-lit the lamp (the ending
  clears history); digits dropped on a road screen that then became the Cape were lost (they
  travel along); stairs could land you inside a boulder; an unbuilt bridge held a parcel up;
  the little guard's line never played.
