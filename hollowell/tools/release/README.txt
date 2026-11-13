HOLLOWELL 1.0.2
===============

The whole game is in Hollowell.html. It works without the internet.

To play
-------
- Run ./play-hollowell.sh (or: sh play-hollowell.sh). It opens the game in a window of its own.
- Or just open Hollowell.html in any web browser.
- To put it in your applications menu, run ./add-to-menu.sh once.

Click the game once so the keyboard reaches it. The controls are listed beside the game, and
can be changed in the game's own menu (Options, then Controls). A controller works too.

Saves
-----
The game keeps your place by itself as you go, and you can save from its menu at any time,
in three save slots. They aren't separate files: the browser keeps them.
- Started with play-hollowell.sh and Chromium or Chrome, they're kept in their own folder,
  ~/.local/share/hollowell (copy that folder to back them up). A later version started the
  same way carries on with them.
- Opened in a normal browser window, they're kept with that browser's data for this file,
  so clearing the browser's site data would clear them too.
- The Save code button above the game turns your place into a line of text. Copy it somewhere
  safe as a backup, or paste it into another copy of the game (on another computer, or the
  online page) to carry on there.
