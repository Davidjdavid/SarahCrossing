# Hollowell: how to run it

## Two copies of the same game
- **Online**: https://claude.ai/artifact/XhdJVk8HxshpfGDQuzxppa (the tester copy; open to anyone with the link, no
  sign-in needed). It has the test saves built in.
- **Offline**: `hollowell_qa.html` in this package: the whole game in one file. Open it in a desktop browser
  (Chrome or Chromium recommended; Firefox and Safari work). No internet needed. It also has the test saves built in,
  and it is the copy to use for the debug options below.

Both are the final version of the game. Each keeps its own saves (in that browser, for that page).

## The page
Above the game screen:
- **Play** gives the game the keyboard (or click the game screen). If keys do nothing, click the game screen.
- **Sound on/off**. Sound starts after your first key press.
- **Screen**: crisp pixels, or one of two old-television looks (the same setting as in the game's Options).
- **Full screen** (the browser may refuse).
- **Save code**: the game's current state as a line of text, to copy, keep or load (below).
- **Test saves** (this copy only): the list of prepared save states, to load any of them (below).

## Controls (the defaults)

| Action | Keyboard | Controller |
|---|---|---|
| Move | Arrow keys or WASD | D-pad or left stick |
| Talk, lift, read, pick up; next line of text | Z | A |
| Swing your stick | X | X |
| Use the tool in hand | C | B |
| Change the tool in hand | Q / E | LB / RB |
| Menu (and pause) | Enter | Start |
| Map | M | Back |

Every key and button can be changed in the game's menu: Options, then Controls. The game's own hints show whatever is
set. Hold a key for a moment (about a tenth of a second) rather than tapping it very briefly: the game reads the
keyboard 60 times a second.

## Starting
The title screen offers **Continue** (when there are saves), **New Wander** (a new game: it asks for a name; the
longest name allowed is a good edge case) and **Options**. The opening plays out by itself for a short while; the
talk button moves the text on.

## The menu
Enter opens it whenever you are free to move (not during a scene or while text is up). Its tabs: what you carry, the
map, the journal (with the current goal), Options, and Save. Inside dungeons the Save tab also has a way back to the
entrance (the guide's systems chapter says exactly what it does).

## Saving and loading
- **Slots**: three. The game saves by itself at certain moments (the guide lists them), and the Save tab saves at any
  time you could open the menu. Continue on the title screen loads a slot.
- **Where a load starts**: usually where you saved; in some places, at a fixed point of the room you were in. The
  guide's systems chapter gives the exact rules (they matter when you test save and load).
- **Save codes**: the **Save code** button shows the current state as text starting `HW1:`. **Copy** copies it. To
  load a code, paste it into the second box and press **Load this code**: the game jumps straight to that state (it
  goes into the current slot the next time the game saves). Put a code in every bug report: it lets the developer
  reproduce the exact state.
- **Test saves**: in the **Test saves** box, pick an ID (T01, T02, ...) and press **Load test save**. What each one is,
  and where it loads, is in `03_SAVE_STATES_CONFIDENTIAL.md`; the same codes are in `saves/codes/TNN.txt` and
  `saves/save_states.json`, and any of them can also be pasted into the Save code box.

## Debug options (for investigating only)
Open the offline file with `?debug` added to its address (for example `file:///.../hollowell_qa.html?debug`; add
`&notitle` to skip the title screen). Then **F1** opens the debug panel: jump to any place, set up a story point,
give every tool, extra health, no damage, walking through walls, extra currency and keys, and a tile grid. In the
browser's console, `HW.state()` says where you are and `HW.Save.snapshot()` gives the whole state as an object.

A state reached with the debug panel, the console or a story point it sets up is **not a legitimate state**: the game
can't otherwise get there that way, so what happens in it may not be possible in real play. Use these tools to
investigate, never as evidence: before reporting anything, reproduce it from a test save or normal play, with debug
off. Don't use the console to change the game.

## Limitations
- The game runs in real time. It pauses only in the menu.
- An automated tester may not be able to hear the sound. If you can't, say that audio wasn't evaluated rather than
  guessing.
- Saves live in the browser's storage for that page: the online and offline copies keep separate saves, and a
  private window forgets them when it closes. Use save codes to carry a state anywhere.
- The online copy runs inside a frame on claude.ai: click inside the game screen if keys don't reach it. A
  controller works only where the browser lets the page read it (the line under the game screen says so).
- The game is drawn at 320x180 pixels and scaled up in whole steps. It is designed to run at 60 frames a second; a
  slow machine or a browser without graphics acceleration can stutter (say which browser and machine when reporting
  performance).

## If something seems stuck
- Text on screen waits for the talk button (Z).
- If the menu won't open, a scene is playing: wait a moment.
- In a dungeon, the menu's Save tab can take you back to its entrance.
- As a last resort, reload the page and load the last save or a save code.
