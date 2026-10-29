# QA log

The testing before Sarah Crossing goes live (from 29 October). Every problem found goes here, with where it is, how to
make it happen, what shows it, how bad it is, and whether it's fixed and checked again.

- **Severity:** blocker (can't play on, or a save is hurt) · major (something doesn't work, or looks badly wrong) ·
  medium (works, but wrong or confusing) · minor (a small look or wording thing).
- **Checked:** how a fix was confirmed: *browser* (played or looked at in a real browser, with a screenshot or a test
  that drives the page), *code* (a test or script checks it, nothing looked at), or *not yet*.
- The QA room (`?qa` on beta) is where it's tested: a throwaway island with tools to go anywhere and set any time, day,
  weather, friendship or unlock. Its Notes tab keeps problems found while playing, with where and when; they're copied here.

| # | Problem | Where | How to make it happen | Evidence | Severity | Fixed | Checked |
|---|---------|-------|-----------------------|----------|----------|-------|---------|
| 1 | A merge left conflict markers in the game's code, so the game wouldn't run | 6m_specials.js (the specials' unlock check) | Build after merging the arcade work | `npm test`: "the game code ... is valid JavaScript" failed | blocker | yes (61c9585) | code: `npm test` 59/59 |
| 2 | Four tests still expected the game as it was before 29 October (neighbors with no likes of their own; every outdoor piece in four colors; over 90 talk options, before "Need anything?" went) | tests/e2e.test.mjs | Run the whole e2e file after the merges | 98/102 passed | minor (tests only) | yes (b7c4663) | code: the four tests pass |
| 3 | The talk prompt check could miss when another neighbor walked over to say hello and stood in front for a frame | tests/e2e.test.mjs, the head icons test | Only in a full run, now and then | 101/102 passed; it passes alone | minor (test only) | yes (2635754) | code: passes alone and in full runs since |
| 4 | Sarah's sweater: the sleeve's rounded end ran on past the cuff into the mitten hand and showed through it | 33ka_doll_kit.js (the doll kit's long sleeves) | Any long-sleeved outfit in the new look, close up | David's note; the kit's geometry (the sleeve's end cap reaches 2 cm under the cuff's bottom) | medium | yes (83e5725: the sleeve stops inside the cuff) | browser: close-ups standing, cheering and watering, the hands come cleanly out of the cuffs |
| 5 | Footprints in the sand were made but too small and faint to see (7 by 4 pixels, dark at 42% on the rippled sand) | 33x_env_steps.js | Walk on the beach in the new look | A probe kept the prints: 14 made, nothing visible until drawn in solid red | major (the feature looked missing) | yes: half as big again, stronger, a paler rim like sand pressed in | browser: a trail of left and right prints behind Sarah |
| 6 | The To-do app, with no favors, still said to ask around with "Need anything?", which went on 29 October | 6n_requests.js `appTasks` | Open the phone's To-do with no favor going | QA sweep 1 screenshot (005-app_tasks) | minor | yes: "Neighbors ask when they need a hand, so stop and chat now and then." | code: the text; sweep 1 rerun |
| 7 | A neighbor still asleep in the morning said "It's my bedtime!" to Sarah in their house | 26_rooms.js `roomChecks` | Only by the QA room's go-anywhere (the door's locked while they sleep): any house before they're up | QA sweep 1 (049-room_h_maki: Maki not there, "*yawn* Oh, look at the time") | minor | yes: a morning line ("I'm not up yet. Come back in a little while?") | browser: a phone in Maki's house at 7 AM |
| 8 | On a phone, the bottom dock's edge peeked out under the dialogue box | style.css | Any dialogue on a narrow screen | QA sweep 1 phone screenshots (051-room_h_basil) | minor | yes: the dock is hidden while a dialogue is up, up to 1240 px wide | browser: hidden during, visible after; screenshot |
| 9 | Hugs went on 27 October but a tip still said "One hug a day", the Town Hall's statistics had a Hugs count that never moved, and a best friend asked "Okay. Hug?" | 6o_topics.js, 6zg_townhall.js, 6zm_friendship.js | Hear the tips; Town Hall, Statistics; a best-friend moment | Code search for the removed features | minor | yes: a talking tip, Flowers watered in the statistics, "Okay. Carry on!" | code |
| 10 | The help's Bigger shops said both shops grow twice (Fortune's grows three times) and "after 7 days and 0 sand dollars"; its tick could never come; Fortune's perk said "twelve stages of furniture" | 6w_extras.js, 6z_shops.js | Phone, Help, Secrets | Reading the help against `SHOP_UP` | minor | yes | browser: the text read back |
| 11 | The pirate treasure's note says west from the pier past three palms, then four steps toward the sea: on this island it was nine palms on and three steps | scripts/island/layout.mjs (the treasure at the westmost palm) | Follow the note from the barn's trunk | world.json's palms and treasure | medium | yes: the generator puts it on the sand below the third palm west of the pier, and the note and hints say to walk down to the dark sand (no step count); the island made again, only the treasure moved (44,120 to 91,129) | browser: the spot walkable, where the note says |
| 12 | **Live site: the lighthouse was boarded for good.** Its restoration is paid at the Town Hall's rooms, which only beta has, so the ghost, the blinking star, the windmill's third cog and the arcade back room (four games, about thirteen specials) could never be done | 6zgb_projects.js `lighthouseOpen` | Live: go to the lighthouse | Gameplay review; `lighthouseOpen()` false with no way to pay | blocker (live) | yes: open wherever the civic rooms are off; on beta the four mysteries' hints and guide say it's boarded until restored | browser + e2e (the town projects test checks both) |
| 13 | Shrimpy and Muggy at five hearts gave a photo that doesn't exist ("Pockets full! photo_scampi went home") | 50_talk.js | Five hearts with either | Gameplay review; no `photo_scampi`/`photo_mug` | major | yes: only those with a photo give one (theirs need pictures: David's) | browser |
| 14 | Shrimpy's and Muggy's catchphrases ("yarr", "brew-tiful") were never said, even one Sarah gave them | 56_drama.js `voiced` | Talk to either | Gameplay review | medium | yes | browser: about a third of their lines end with it |
| 15 | Shrimpy and Muggy had no hellos or "too soon" lines of their own and no friendship milestones (no favorite spot, so no advice, house gift or best-friend moment) | 6zzg_variety.js | Make friends with either | Gameplay review; `nextMilestone` null without `FAV_SPOT` | medium | yes: all of them (favorite spots the far beach and the museum bench; an anchor and a teapot lamp by mail) | browser: Shrimpy's gift arrives |
| 16 | The most-heard lines repeated: a gift's thanks was one line per neighbor every day; a good friend's hello was mostly five shared lines; the five-heart photo, the four-heart house gift and most best-friend moments were the same words from everyone | 50_talk.js, 6zzc_greet.js, 6zm_friendship.js | Daily gifts; four hearts and up | Gameplay review | medium | yes: two more thanks each (some naming the gift), their own close-friend hellos (and shared ones less often), their own photo, house gift and best-friend words | browser |
| 17 | Shared lines that named whoever was saying them ("Sully said..." from Sully, "Brulee put it in the good light" from Brulee), Boston lines in Sully's voice ("kid", "back home") from anyone, and chats naming one of the two having them | 6o_topics.js, 2d_life.js | Talk to anyone a while; overhear chats | Gameplay review | medium | yes: such lines are passed over; Boston is Sully's | browser: 400 topics from each neighbor, none naming the speaker, Boston only from Sully; 2,000 chats, none naming a speaker |
| 18 | Cece said sorry twice in a line ("Sorry! Sorry, I...") | 56_drama.js | Talk to Cece | Gameplay review | minor | yes: no extra sorry when the line has one | browser |
| 19 | Lines about things gone or changed: Maki's "bench by the statue", thirteen lines to and from David online about his statue, a chat wondering what the café sign means after the café opens, "nobody yet" about the plots after a newcomer moves in | 6z_talk_more.js, 6y_visitors.js, 2d_life.js | Hear them | Gameplay review; code search | minor | yes | code |
| 20 | Gopher Garden's wizard hat at 20,000: about 15% of runs reach it even hitting nine gophers in ten | 6m_specials.js, 59_arcade.js | Play Gopher Garden | Gameplay review's simulation | medium | yes: 8,000 (David's record 7,998) | code |
| 21 | Nothing pointed at two things: the watering can's description was "A tool." (breeding flowers was only in the collection), and Muggy's story waits for twenty museum gifts and a pot on every pedestal with no hint | 6m_specials.js, 6o_topics.js, 6zzg_variety.js | Look at the can; play for weeks | Gameplay review | minor | yes: the can says what watering does, a tip about breeding; Brulee mentions the bare pedestals once half the gifts are in | browser |
| 22 | Small shared pools heard several times a day (what an idle neighbor says, "I missed you", the hello after an overheard chat, asking a favor) | 6zzg_variety.js | Play a few days | Gameplay review | minor | yes: more lines in each | code |
| 23 | The 29 October list's test failed once the real date passed the 28th: it set the island to 28 October before looking at the starter crop, planted two days before the real date | tests/e2e.test.mjs | The full e2e run on 29 October | 101/102; fails alone too | minor (test only) | yes: the starter is checked before the clock moves | code: passes alone and in the full run |
| 24 | Read letters were kept for good: a year of play is about 400 letters, a hundred KB more in a save sent whole every 20 seconds | 41_menus.js `sendMail` | Play for months | The 120-day soak: the save grew from 7 to 82 KB, 47 KB of it letters | minor | yes: the mailbox keeps the newest 250 letters that are read with nothing left to take (unread letters and presents always stay) | code |
| 25 | The karaoke voice test failed now and then: a crack drops in pitch one time in four, and one close to an octave down reads as the same note to the test's pitch finder | tests/e2e.test.mjs | The full e2e run, by chance | 101/102 once; passes on its own | minor (test only) | yes: up to four renders of the crack | code: passes three runs in a row |

## For David to decide (found, not changed)

- **Fortune's shop growth** counts only what's spent at Fortune's counter (80,000, then 200,000). Buying a piece or two a
  day, the Emporium comes around day 45 and the Department Store around day 100, and it rewards buying things Sarah
  doesn't want (furniture sells back at a quarter). Count every island shop, or lower it to 40,000 and 100,000?
- **Cuke's hours** (4 AM to 8 PM): someone who plays in the evenings never finds him awake, so his friendship stalls.
- **Shrimpy's ten logs** mean felling ten trees, which don't come back unless Sarah plants more.
- **Shrimpy's and Muggy's photos** at five hearts need pictures drawn; until then they don't give one.

## What's been checked and found fine

- **Sweep 1, the classic view** (a browser driving the game, a laptop and a phone): every phone app, every civic screen,
  every room (no one stuck on arrival), every arcade cabinet, every holiday on the square, night, rain, snow and storm,
  thirty days run forward: no script errors, no screen wider or taller than the window.
- **The 3D look** (beta's): the first twelve places of the island at 1 PM look right (buildings, stairs, the falls and
  their bridge, rain); the rest of the 3D sweep is still to run.
- **The 120-day soak** (classic view): every day a morning, four places at four hours, a talk, a room: no errors, memory
  steady at 17-19 MB, each new day's work 22-58 ms.
- **Edge cases**: a full pocket (things go home to storage, with a toast), no money (Fortune says so kindly), the day
  turning over mid-talk, talking tapped over and over (ignored while a talk is on), resizing the window mid-dialogue,
  two dialogues at once, a save code round trip, a phone turned sideways (the phone, a dialogue and the shop all fit).
- **The gameplay review** (reading the game: lines per neighbor, the economy, unlocks, schedules): the economy's pace
  (the house and town projects take about 45-55 days at fifteen minutes' fishing a day), friendship's pace (five hearts
  in about two weeks of daily gifts), the conveniences (sell all, buy five, quick cook, the mailbox's take-all), and
  every step of Shrimpy's and the back room's quests can be done.

