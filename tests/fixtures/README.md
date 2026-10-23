# Test saves

Both were made by the original one-page game (Sarah_Crossing2.html, before it was
split into this repository), with its own **Make save code** (`Save.exportCode()`):

- `old-game-save.txt`: a quick-started island named "Imported Isle" with 12,345
  bells, some peaches and clams, and one handmade frog pot.
- `old-game-unlocked.txt`: the same island after the Secrets > Unlock everything
  cheat (every item, outfit, recipe...), the biggest kind of save.

The tests import them the way a player would, so they check that saves from the
old version keep working.
