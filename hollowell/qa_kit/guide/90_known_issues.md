## Known open issues (found while this package was being prepared)

The game was left exactly as it is while this package was prepared, so that what you test is what will ship. These
issues turned up along the way and have **not** been fixed yet. Please confirm each (or say it doesn't reproduce), and
include them in the developer report with your severity: they will be fixed together with what you find. They are not
the only issues: treat this list as a sample of the kind of thing still to be found, not as the boundary of your search.

1. **A goal line that stops saying where next (after the fifth House).** After the fifth Knot the goal line reads "Home
   to Hollowell. (Somebody at the clinic will want to hear all about it.)", and it stays that way until the first reveal,
   even after the clinic visit and after Gran, at the Well, names Larkspur Fair as the next place; the map's goal pin
   still points at the clinic. Elsewhere the goal line always names where to go next. Reproduce: load T28, go to the
   clinic and talk to Doctor Mallow, then talk to Gran by the Well; the goal line and the map pin are unchanged. (The
   design's rule: the goal line always says where next.)
2. **A map pin that misses its place.** With the goal naming "the broken bridge" (after the second Knot: T13, and the
   saves after it until the bridge is crossed), the map's goal pin is drawn about ten tiles north-east of the bridge, on
   solid ground (the bridge is at tiles 113-118, 106-107 of the valley; the pin at 126, 96). Cosmetic.
3. **The Guild's key's description.** The key Gundry hands over after the second reveal (T44) is described as opening
   the Loom, but nothing in the game uses it: the way into the Loom is the silk warp across its door, lifted when its four
   sockets hold weights. A text mismatch, not a blocker (the warp is the real gate, and the guide's Loom section
   describes it).
4. **"Eight Little Houses."** After the ninth Making, Gundry says "Eight Little Houses...". His count is fixed before
   the ninth (the capstone) is added and matches his earlier job speech, so it may be meant; judge it as a reader would
   and say whether it reads as a slip.
5. **The debug panel's Noclip** (debug only: `?debug`, F1) doesn't let Wren walk through walls: only an internal
   checker reads it. Not part of the game; mentioned so it isn't mistaken for a game fault.
