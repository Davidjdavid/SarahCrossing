## Known open issues (found while this package was being prepared)

The game was left exactly as it is while this package was prepared, so that what you test is what will ship. These
issues turned up along the way and have **not** been fixed yet. Please confirm each (or say it doesn't reproduce), and
include them in the developer report with your severity: they will be fixed together with what you find. They are not
the only issues: treat this list as a sample of the kind of thing still to be found, not as the boundary of your search.

1. **A trap below the falls (softlock).** Ride the ferry downstream over the falls with the Paddle and step ashore on
   the beach below them (the basin: the chest of buttons and the bottle with Linnet's note). Stepping onto the beach
   makes it Wren's mark: the beach lies in the region "Millwater", which sets the mark on arrival (src/16_world.js,
   `checkRegion`). The beach is shut in, so falling in on purpose (the bottle's own advice: "I fell in on purpose and
   went home the quick way") only brings her straight back to it, the ferry has gone home, and the overworld's Save tab
   has no way back. The only ways out: load an earlier save, or Homeward to a Bedroll laid somewhere else first (from
   the fifth House on). Reproduce from T18 (no Bedroll yet): board the ferry at the end of the road, paddle south over the
   falls, step ashore at 170,115, fall in: she is back at 170,115 every time. **Don't save on that beach** except on
   purpose to test it (a save there, without a Bedroll laid elsewhere, can't get out). Expected by the design: falling in
   takes her home to where she was before the ride.
2. **A goal line that stops saying where next (after the fifth House).** After the fifth Knot the goal line reads "Home
   to Hollowell. (Somebody at the clinic will want to hear all about it.)", and it stays that way until the first reveal,
   even after the clinic visit and after Gran, at the Well, names Larkspur Fair as the next place; the map's goal pin
   still points at the clinic. Reproduce: load T28 (or T62, the clinic already visited), then talk to Gran by the Well;
   the goal line and the map pin are unchanged. (The design's rule: the goal line always says where next.)
3. **The goal line after the optional Houses.** After the Pile (the Stray House's end) the goal stays "West of the Pile's
   room: Linnet's own room." even once she's been there and is back in town (T67-T69); after Mr Ives's chair (the
   Unfinished House's end) it's empty, and the menu shows only "Wander." (T70). The main story's goal line isn't put back
   in either case.
4. **The Pile's Heartstitch walled in.** When the Pile comes apart in a corner nook, its two leftover strays and the walls
   can close round its Heartstitch, so it can't be reached. Leaving the House and coming back puts the Heartstitch in the
   middle of the room, so it isn't lost.
5. **Linnet's note 4 appears late.** It shows only once the Belfry is built again (leave the area and come back, or
   reload), because the condition for it is read when the place is built.
6. **Linnet's notes 4, 5 and 8: the wording of where they are.** They use the outdoor notes' wording ("carved into the
   ground", "tucked into the grass") for a tower room, a bottle on a beach and a floorboard.
7. **A map pin that misses its place.** With the goal naming "the broken bridge" (after the second Knot: T13, and the
   saves after it until the bridge is crossed), the map's goal pin is drawn about ten tiles north-east of the bridge, on
   solid ground (the bridge is at tiles 113-118, 106-107 of the valley; the pin at 126, 96). Cosmetic.
8. **The Guild's key's description.** The key Gundry hands over after the second reveal (T44) is described as opening
   the Loom, but nothing in the game uses it: the way into the Loom is the silk warp across its door, lifted when its four
   sockets hold weights. A text mismatch, not a blocker.
9. **"Eight Little Houses."** After the ninth Making, Gundry says "Eight Little Houses...". His count is fixed before
   the ninth (the capstone) is added and matches his earlier job speech, so it may be meant; say whether it reads as a slip.
10. **The Long Hook and the Washhouse's tub** (the Stray House). The Long Hook pulls the tub straight over from the bank,
    so the two stones the room is built round aren't needed. This follows the rules; say whether it reads as skipping the
    room's idea (an observation, for the developer to decide).
11. **The debug panel's Noclip** (debug only: `?debug`, F1) doesn't let Wren walk through walls: only an internal checker
    reads it. Not part of the game; mentioned so it isn't mistaken for a game fault.
