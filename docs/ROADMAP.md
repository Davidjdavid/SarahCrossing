# Roadmap: Sarah Crossing, the real game

The one-page game was a gag gift that Sarah loved. This is everything David asked for to turn
it into a polished, much bigger game. **Nothing goes to the live site (Sarah's island) until it's
all done**; it's built and tried on https://beta.sarahcrossing.com.

Sarah's island must keep loading through every change (see CLAUDE.md, "Old saves must always
load"). Where a change can't keep something (a new map can't keep things placed on the old
ground), the save migration says what starts fresh, as the one-page game did when the island
first grew: her house, money, friends, collections and everything she made always stay.

Status: [x] done, [~] in progress, [ ] not started.

## Online
- [x] On a server with its own address, password, saves online, backups, save import
- [x] Beta site for trying things (pushes go there; live only when asked)
- [x] **Multiplayer**: play as Sarah, David, James, John or Joe (picked per device on the title screen)
  - each visitor has their own save on the island: pocket, money, friendships, mail, collections;
    the island itself is Sarah's (only her game changes it; visitors are told so, kindly)
  - visitors arrive at the boat; Joe starts at his house; their NPC selves step aside while they play
  - see each other live with name tags, chat bubbles, dance moves; give gifts; write letters
  - neighbors greet and chat with each person in their own way, and tell visitors how Sarah's doing
  - placeholders: everyone uses their current sprite until the new art
  - [ ] later: doing things together (fishing, minigames), more lines for everyone

## Art (pick a style first)
- [x] Six sample styles to compare: Stardew-like, handheld classic, tamagotchi-colorful, 3D
  diorama, classic cozy, experimental storybook paper (David liked Stardew-like and classic cozy;
  the 3D and the portraits were too cutesy, and the game needs Animal Crossing's camera to work on
  phones: placing decor, finding dig spots, seeing decor behind buildings)
- [~] Three more samples with Animal Crossing's perspective in 2D: rolling-log pixel art, clean flat
  illustration, cozy pixel art with the Animal Crossing camera (no portraits, less cutesy)
- [ ] Redraw everything in the chosen style: real pixel art with shading, much larger characters
  (room to design clothes), character portraits in conversations
- [ ] Must look good on phone, laptop and desktop (layout, text size, touch and mouse/keyboard)

## The island
- [ ] A much larger island, laid out in districts: shopping/commercial, residential, forest,
  mountain, beach, a dedicated farm area (crops grow there, not in scattered squares), and more
- [ ] Everything on a grid (placing things, walking, collisions)
- [ ] Less clutter: fewer, better placed things by default
- [ ] Shop upgrades after a number of days played and money spent

## Neighbors and story
- [ ] New people: meet new vendors by meeting requirements; after some days and play time, new
  characters visit and ask to move in, and Sarah picks where their house goes
- [ ] A secret character
- [ ] Way more dialogue, better dialogue, conversations that react to what's going on
- [ ] Way more holiday events
- [ ] Way, way more content

## Games
- [x] A few more arcade games: Surf's Up (Kai's wave: jump rocks, grab shells), Gopher Garden (bonk
  the gophers, never Cuke) and Noodle Slurp (Basil's noodle grows as it slurps); the arcade is wider
  to fit their cabinets, which can be won at the prize counter like the others
- [x] Remake the fruit catching game so it's actually fun: trees shake before they drop, a shadow shows
  where things land, fruits fall their own ways, juice meter and Fruit Fever, power-ups, rounds with
  Perfect bonuses, snappier movement

## Bugs
- [x] Talking to Wonton in the hot spring: the spot you have to stand in is too hard to hit (fixed: any side of the rim works, and a tap walks below it)
- [ ] A light test pass at the very end (David played it for a week and reported bugs as he went)
