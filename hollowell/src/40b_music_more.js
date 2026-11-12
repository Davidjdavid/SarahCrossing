/* More music: longer loops for the places where a player stays a while (the town, the regions, the Houses,
   the boss, the shop, the inn, the festival, home), and a fight tune for each of the first four Houses' bosses.
   Each song below starts with its old tune exactly as it was (section A: the place's own motif), then new sections
   in the same key, tempo, instruments and volumes, coming back round to A at the loop. Every channel is the
   song's full length, so the parts never drift apart. Loaded after 40_music.js, so these definitions win.
   The fights, the inn, the Knot, the lullaby and the Pull were lengthened again later (none loops in under 45 s): a
   section added then is lettered after the others but plays where it stands (the fights' D comes after A, so the
   last section still turns back into A). */

/* Hollowell and the Hollow (C major): A as it was (the Return motif G A C A G, then its answer); B a new lilting tune on
   F G Em Am; C the motif visiting F, G and A minor; D a breakdown, the motif heard far off while the lead rests,
   and a swell that runs down into the motif again */
SONGS.town = {
    bpm: 104, div: 2,
    ch: [
        { wave: 'p25', vol: 0.11, n:
            /* A */ 'G4 A4 C5 - A4 G4 - . | E4 G4 C5 - D5 - E5 - | F5 - E5 D5 C5 - A4 - | G4 - - - - - . . | G4 A4 C5 - A4 G4 - . | E4 G4 C5 - D5 - E5 - | F5 E5 D5 - G4 - B4 - | C5 - - - - - . . | E5 - E5 F5 G5 - E5 - | D5 - D5 E5 F5 - D5 - | C5 - C5 D5 E5 - C5 A4 | B4 - G4 - A4 - B4 - | E5 - E5 F5 G5 - E5 - | D5 - F5 - E5 - D5 - | C5 - E5 - D5 - B4 - | C5 - - - - - . . | ' +
            /* B */ 'A4 - - C5 - - F5 - | E5 - - D5 - - B4 - | G4 - - B4 - - D5 - | C5 - - - - - . . | D5 - - F5 - - A5 - | G5 - - - F5 - D5 - | E5 - - - D5 - B4 - | A4 - - - - - . . | C5 - - F5 - - A5 - | G5 - - D5 - - B4 - | B4 - - E5 - - G5 - | E5 - - - - - . . | F5 - - E5 - - D5 - | B4 - - D5 - - F5 - | E5 - - - - - D5 - | C5 - - - - - . . | ' +
            /* C */ 'C5 D5 F5 - D5 C5 - . | A4 C5 F5 - G5 - A5 - | D5 E5 G5 - E5 D5 - . | G4 B4 E5 - D5 - B4 - | E5 F5 A5 - F5 E5 - . | C5 E5 A5 - G5 - E5 - | F5 - E5 D5 C5 - A4 - | G4 - - - - - . . | ' +
            /* D */ '. . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | A4 - - - C5 - - - | B4 - - - D5 - - - | E5 - - - C5 - - - | D5 - - - F5 E5 D5 B4' },
        { wave: 'triangle', vol: 0.2, n:
            /* A */ 'C3 . G3 . C3 . G3 . | C3 . G3 . E3 . G3 . | F2 . C3 . F2 . C3 . | G2 . D3 . G2 . B2 . | C3 . G3 . C3 . G3 . | A2 . E3 . A2 . E3 . | F2 . C3 . G2 . D3 . | C3 . G3 . C3 - - . | C3 . G3 . C3 . G3 . | D3 . A3 . D3 . A3 . | A2 . E3 . A2 . E3 . | G2 . D3 . G2 . D3 . | C3 . G3 . C3 . G3 . | F2 . C3 . F2 . C3 . | G2 . D3 . G2 . D3 . | C3 . G3 . C3 - - . | ' +
            /* B */ 'F2 . C3 . F2 . C3 . | G2 . D3 . G2 . D3 . | E2 . B2 . E2 . B2 . | A2 . E3 . A2 . E3 . | D3 . A3 . D3 . A3 . | G2 . D3 . G2 . F3 . | E2 . B2 . E2 . D3 . | A2 . E3 . A2 . G2 . | F2 . A2 . C3 . A2 . | G2 . B2 . D3 . B2 . | E2 . G2 . B2 . G2 . | A2 . C3 . E3 . C3 . | D3 . F3 . A3 . F3 . | G2 . B2 . D3 . F3 . | C3 . G3 . E3 . G3 . | C3 . G3 . C3 - - . | ' +
            /* C */ 'F2 . C3 . F2 . C3 . | F2 . C3 . A2 . C3 . | G2 . D3 . G2 . D3 . | E2 . B2 . E2 . B2 . | A2 . E3 . A2 . E3 . | A2 . E3 . C3 . E3 . | D3 . A3 . D3 . A3 . | G2 . D3 . G2 . B2 . | ' +
            /* D */ 'C3 . G3 . C3 . G3 . | A2 . E3 . A2 . E3 . | F2 . C3 . F2 . C3 . | G2 . D3 . G2 . D3 . | F2 . C3 . F2 . C3 . | G2 . D3 . G2 . D3 . | E2 . B2 . A2 . E3 . | D3 . A2 . G2 . B2 .' },
        { wave: 'p12', vol: 0.045, n:
            /* A */ '. E4 . G4 . E4 . G4 | . E4 . G4 . G4 . C5 | . A4 . C5 . A4 . C5 | . B4 . D5 . B4 . D5 | . E4 . G4 . E4 . G4 | . E4 . A4 . E4 . A4 | . A4 . C5 . B4 . D5 | . E4 . G4 . E4 . . | . E4 . G4 . E4 . G4 | . F4 . A4 . F4 . A4 | . E4 . A4 . E4 . A4 | . D4 . G4 . B4 . G4 | . E4 . G4 . E4 . G4 | . A4 . C5 . A4 . C5 | . B4 . D5 . B4 . D5 | . E4 . G4 . C5 . . | ' +
            /* B */ '. A4 . C5 . A4 . C5 | . B4 . D5 . B4 . D5 | . G4 . B4 . G4 . B4 | . E4 . A4 . E4 . A4 | . F4 . A4 . F4 . A4 | . B4 . D5 . F4 . B4 | . G4 . B4 . G4 . B4 | . E4 . A4 . E4 . A4 | . A4 . C5 . A4 . C5 | . B4 . D5 . B4 . D5 | . G4 . B4 . G4 . B4 | . E4 . A4 . E4 . A4 | . F4 . A4 . A4 . F4 | . B4 . D5 . F4 . B4 | . E4 . G4 . E4 . G4 | . E4 . G4 . C5 . . | ' +
            /* C */ '. A4 . C5 . A4 . C5 | . A4 . C5 . C5 . F5 | . B4 . D5 . B4 . D5 | . G4 . B4 . G4 . B4 | . C5 . A4 . E4 . A4 | . E4 . A4 . A4 . C5 | . F4 . A4 . F4 . A4 | . B4 . D5 . B4 . D5 | ' +
            /* D */ 'G4 A4 C5 - A4 G4 - . | E4 G4 C5 - D5 - E5 - | . A4 . C5 . A4 . C5 | . B4 . D5 . B4 . D5 | . A4 . C5 . A4 . C5 | . B4 . D5 . B4 . D5 | . G4 . B4 . E4 . A4 | . F4 . A4 . B4 . D5' },
        { drum: true, vol: 0.1, n:
            /* A */ 'k . h . s . h . | k . h . s . h h | k . h . s . h . | k . h . s . h . | k . h . s . h . | k . h . s . h h | k . h . s . h . | k . h . s . h . | k . h . s . h . | k . h . s . h h | k . h . s . h . | k . h . s . h . | k . h . s . h . | k . h . s . h h | k . h . s . h . | k . h . s . h . | ' +
            /* B */ 'k . h . s . h . | k . h . s . h h | k . h . s . h . | k . h . s . h . | k . h . s . h . | k . h . s . h h | k . h . s . h . | k . h . s . h . | k . h . s . h . | k . h . s . h h | k . h . s . h . | k . h . s . h . | k . h . s . h . | k . h . s . h h | k . h . s . h . | k . h . s . s s | ' +
            /* C */ 'k . h . s . h . | k . h . s . h h | k . h . s . h . | k . h . s . h . | k . h . s . h . | k . h . s . h h | k . h . s . h . | k . h . s . h . | ' +
            /* D */ 'k . . . h . . . | k . . . h . . . | k . . . h . . . | k . h . h . h h | k . h . s . h . | k . h . s . h h | k . h . s . h . | k . h . s . s s' },
    ],
};

/* Meadowfold (G major, bouncing): A as it was; B a longer-breathed strain in E minor that finds its way home;
   C running eighths on C major; D a breakdown (the lead resting over the bass) and a rising swell into A */
SONGS.meadow = {
    bpm: 128, div: 2,
    ch: [
        { wave: 'p25', vol: 0.1, n:
            /* A */ 'D5 - B4 - G4 - B4 - | C5 - A4 - F#4 - A4 - | B4 - G4 - D5 - G5 - | F#5 - - - E5 - D5 - | D5 - B4 - G4 - B4 - | C5 - E5 - A4 - C5 - | B4 - D5 - A4 - F#4 - | G4 - - - - - . . | E5 - G5 - E5 - D5 - | C5 - E5 - C5 - B4 - | A4 - C5 - B4 - G4 - | A4 - - - - - . . | E5 - G5 - B5 - G5 - | F#5 - D5 - A4 - C5 - | B4 - G4 - A4 - F#4 - | G4 - - - - - . . | ' +
            /* B */ 'E5 - - F#5 G5 - - - | E5 - - D5 C5 - - - | D5 - - E5 F#5 - A5 - | G5 - - - D5 - B4 - | E5 - - F#5 G5 - B5 - | A5 - - G5 E5 - - - | G5 - - E5 C5 - - - | B4 - - - D#5 - F#5 - | G5 - - F#5 E5 - - - | C5 - - D5 E5 - - - | F#5 - - E5 D5 - A4 - | B4 - - - D5 - G5 - | E5 - - D5 C5 - E5 - | A4 - - B4 C5 - E5 - | D5 - - - F#5 - C5 - | B4 - - - - - . . | ' +
            /* C */ 'E5 D5 C5 D5 E5 - G5 - | D5 C5 B4 C5 D5 - G5 - | C5 B4 A4 B4 C5 - E5 - | D5 - - - F#5 - A5 - | G5 - E5 - C5 - E5 - | D5 - B4 - G4 - B4 - | C5 - E5 - D5 - C5 - | B4 - - - - - . . | ' +
            /* D */ '. . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . A4 - C5 - | B4 - D5 - G5 - - - | E5 - - - G5 - B5 - | A5 - - - E5 - C5 - | D5 - - - A4 - C5 -' },
        { wave: 'triangle', vol: 0.2, n:
            /* A */ 'G2 . D3 . G2 . D3 . | D3 . A2 . D3 . A2 . | G2 . D3 . E2 . B2 . | D3 . A2 . D3 . A2 . | G2 . D3 . G2 . D3 . | A2 . E3 . A2 . E3 . | D3 . A2 . D3 . A2 . | G2 . D3 . G2 . . . | C3 . G3 . C3 . G3 . | A2 . E3 . A2 . E3 . | D3 . A3 . G2 . D3 . | D3 . A2 . D3 . A2 . | C3 . G3 . E3 . G3 . | D3 . A3 . D3 . A3 . | D3 . A2 . D3 . A2 . | G2 . D3 . G2 . . . | ' +
            /* B */ 'E2 . B2 . E2 . B2 . | C3 . G3 . C3 . G3 . | D3 . A2 . D3 . A2 . | G2 . D3 . G2 . D3 . | E2 . B2 . E2 . B2 . | A2 . E3 . A2 . E3 . | C3 . G3 . C3 . G3 . | B2 . F#3 . B2 . D#3 . | E2 . B2 . E2 . B2 . | C3 . G3 . C3 . G3 . | D3 . A2 . D3 . A2 . | G2 . D3 . G2 . D3 . | C3 . G3 . E3 . G3 . | A2 . E3 . C3 . E3 . | D3 . A2 . F#2 . A2 . | G2 . D3 . G2 . . . | ' +
            /* C */ 'C3 . G3 . C3 . G3 . | B2 . G3 . B2 . G3 . | A2 . E3 . A2 . E3 . | D3 . A2 . D3 . F#3 . | C3 . G3 . C3 . G3 . | G2 . D3 . G2 . D3 . | A2 . E3 . D3 . A2 . | G2 . D3 . G2 . . . | ' +
            /* D */ 'E2 . G2 . B2 . G2 . | C3 . E3 . G3 . E3 . | A2 . C3 . E3 . C3 . | D3 . F#3 . A3 . F#3 . | G2 . D3 . G2 . D3 . | E2 . B2 . E2 . B2 . | A2 . E3 . A2 . E3 . | D3 . A2 . F#2 . A2 .' },
        { drum: true, vol: 0.09, n:
            /* A */ 'k . h k s . h . | k . h . s . h h | k . h k s . h . | k . h . s . h h | k . h k s . h . | k . h . s . h h | k . h k s . h . | k . h . s . h h | k . h k s . h . | k . h . s . h h | k . h k s . h . | k . h . s . h h | k . h k s . h . | k . h . s . h h | k . h k s . h . | k . h . s . h h | ' +
            /* B */ 'k . h k s . h . | k . h . s . h h | k . h k s . h . | k . h . s . h h | k . h k s . h . | k . h . s . h h | k . h k s . h . | k . h . s . h h | k . h k s . h . | k . h . s . h h | k . h k s . h . | k . h . s . h h | k . h k s . h . | k . h . s . h h | k . h k s . h . | k . h k s . s s | ' +
            /* C */ 'k . h k s . h . | k . h . s . h h | k . h k s . h . | k . h . s . h h | k . h k s . h . | k . h . s . h h | k . h k s . h . | k . h k s . s s | ' +
            /* D */ 'k . . . h . . . | k . . . h . . . | k . . . h . . . | k . h . h . h h | k . h k s . h . | k . h . s . h h | k . h k s . h . | k . h k s . s s' },
    ],
};

/* the Tidyhouse: a neat little minuet (A minor). A as it was; B a trio in C major (running eighths); C a strain in
   D minor with a dotted step, turning back toward A minor; D a breakdown over a falling bass (A G# G F# F E), the
   lead resting, then answering it down to E for the return */
SONGS.tidy = {
    bpm: 120, div: 3,
    ch: [
        { wave: 'p25', vol: 0.09, legato: 0.5, n:
            /* A */ 'A4 . C5 . E5 . | D5 . C5 . B4 . | A4 . C5 . E5 . | G#4 - - . . . | A4 . C5 . E5 . | F5 . E5 . D5 . | C5 . B4 . A4 . | E5 - - . . . | F5 . E5 . D5 . | C5 . D5 . E5 . | D5 . C5 . B4 . | A4 . B4 . C5 . | B4 . A4 . G#4 . | A4 . B4 . C5 . | B4 . G#4 . E4 . | A4 - - . . . | ' +
            /* B */ 'G4 . C5 . E5 . | D5 C5 B4 C5 D5 . | E5 . G5 . E5 . | D5 - - . . . | A4 . C5 . F5 . | E5 D5 C5 D5 E5 . | F5 . D5 . B4 . | C5 - - . . . | E5 D5 C5 B4 A4 . | G#4 . B4 . E5 . | C5 B4 A4 B4 C5 . | B4 - - . . . | F5 . C5 . A4 . | D5 E5 F5 E5 D5 . | B4 . D5 . F5 . | E5 - - . . . | ' +
            /* C */ 'F5 - - E5 D5 . | C#5 - - D5 E5 . | A4 - - D5 F5 . | E5 - - . . . | D5 - - C5 Bb4 . | A4 - - Bb4 A4 . | G#4 - - A4 B4 . | A4 - - . . . | F5 - - E5 D5 . | C#5 - - D5 E5 . | F5 - - D5 Bb4 . | A4 - - C#5 E5 . | F5 - - E5 D5 . | C5 - - B4 A4 . | B4 - - C5 D5 . | E5 - - . . . | ' +
            /* D */ '. . . . . . | . . . . . . | . . . . . . | . . . . . . | A4 - - . C5 . | B4 - - . G#4 . | C5 - - . E5 . | B4 - - . . . | E5 - - . C5 . | D5 - - . B4 . | C5 - - . G4 . | A4 - - . F#4 . | F4 - - . A4 . | G#4 - - . B4 . | C5 . B4 . A4 . | B4 . G#4 . E4 .' },
        { wave: 'triangle', vol: 0.18, legato: 0.4, n:
            /* A */ 'A2 . E3 . E3 . | D3 . F3 . F3 . | A2 . E3 . E3 . | E2 . G#2 . G#2 . | A2 . E3 . E3 . | D3 . F3 . F3 . | E2 . G#2 . B2 . | E2 . G#2 . B2 . | D3 . F3 . A3 . | C3 . E3 . G3 . | G2 . B2 . D3 . | A2 . C3 . E3 . | E2 . G#2 . B2 . | A2 . C3 . E3 . | E2 . G#2 . B2 . | A2 . E3 . A2 . | ' +
            /* B */ 'C3 . G3 . G3 . | G2 . D3 . D3 . | C3 . G3 . G3 . | G2 . B2 . D3 . | F2 . C3 . C3 . | C3 . E3 . G3 . | G2 . B2 . F3 . | C3 . G2 . C3 . | A2 . E3 . E3 . | E2 . G#2 . B2 . | A2 . C3 . E3 . | E2 . G#2 . B2 . | F2 . C3 . C3 . | D3 . F3 . A3 . | G2 . B2 . D3 . | C3 . G2 . C3 . | ' +
            /* C */ 'D3 . A3 . A3 . | A2 . E3 . G3 . | D3 . F3 . A3 . | A2 . C#3 . E3 . | G2 . Bb2 . D3 . | D3 . A3 . A3 . | E2 . G#2 . D3 . | A2 . C3 . E3 . | D3 . A3 . A3 . | A2 . E3 . G3 . | Bb2 . F3 . F3 . | A2 . E3 . C#3 . | D3 . F3 . A3 . | A2 . E3 . E3 . | E2 . G#2 . D3 . | E2 . B2 . E2 . | ' +
            /* D */ 'A2 . E3 . A3 . | G#2 . E3 . B2 . | G2 . E3 . C3 . | F#2 . D3 . A2 . | F2 . C3 . A2 . | E2 . B2 . G#2 . | A2 . E3 . C3 . | E2 . B2 . E2 . | A2 . E3 . A3 . | G#2 . E3 . B2 . | G2 . E3 . C3 . | F#2 . D3 . A2 . | F2 . C3 . A2 . | E2 . B2 . G#2 . | A2 . E3 . A2 . | E2 . G#2 . B2 .' },
        { drum: true, vol: 0.06, n:
            /* A */ 'k . h . h . | s . h . h . | k . h . h . | s . h . h . | k . h . h . | s . h . h . | k . h . h . | s . h . h . | k . h . h . | s . h . h . | k . h . h . | s . h . h . | k . h . h . | s . h . h . | k . h . h . | s . h . h . | ' +
            /* B */ 'k . h . h . | s . h . h . | k . h . h . | s . h . h . | k . h . h . | s . h . h . | k . h . h . | s . h . h . | k . h . h . | s . h . h . | k . h . h . | s . h . h . | k . h . h . | s . h . h . | k . h . h . | s . h . h . | ' +
            /* C */ 'k . h . h . | s . h . h . | k . h . h . | s . h . h . | k . h . h . | s . h . h . | k . h . h . | s . h . h . | k . h . h . | s . h . h . | k . h . h . | s . h . h . | k . h . h . | s . h . h . | k . h . h . | s . h . h . | ' +
            /* D */ '. . h . h . | . . h . h . | . . h . h . | . . h . h . | k . h . h . | . . h . h . | k . h . h . | . . h . h h | k . h . h . | s . h . h . | k . h . h . | s . h . h . | k . h . h . | s . h . h . | k . h . h . | s . h . s s' },
    ],
};

/* Kilnridge: dry, bright, a bit of a swagger (D Dorian). A as it was; B a strut on the bright side (G, C, F) in a
   lower voice; C a breakdown on the Dorian vamp (D minor, G) and long notes shimmering high over it; D a closing
   strain that comes home by way of C, the way A always does */
SONGS.kiln = {
    bpm: 112, div: 2,
    ch: [
        { wave: 'p25', vol: 0.1, n:
            /* A */ 'D5 - - E5 F5 - A5 - | G5 - F5 - E5 - C5 - | D5 - - E5 F5 - A5 - | B5 - A5 - G5 - - - | A5 - - G5 F5 - E5 - | D5 - C5 - A4 - C5 - | D5 - E5 - F5 - E5 - | D5 - - - - - . . | ' +
            /* B */ 'B4 B4 - D5 - B4 G4 - | C5 C5 - E5 - C5 G4 - | B4 B4 - D5 - G5 - - | A5 - - G5 E5 - C5 - | A4 A4 - C5 - A4 F4 - | G4 G4 - C5 - E5 - - | D5 - - B4 - - G4 - | C5 - - - - - . . | ' +
            /* C */ '. . . . . . . . | . . . . . . . . | A5 - - - - - - - | B5 - - - G5 - D5 - | F5 - - - - - E5 - | D5 - - - B4 - - - | C5 - - - F5 - A5 - | G5 - - - - - . . | ' +
            /* D */ 'E5 - - F5 G5 - A5 - | B5 - A5 - G5 - D5 - | A4 - - B4 C5 - F5 - | E5 - D5 - C5 - G4 - | A4 - - C5 D5 - F5 - | G5 - - - B4 - D5 - | C5 - - - E5 - A5 - | G5 - - - - - E5 -' },
        { wave: 'triangle', vol: 0.22, n:
            /* A */ 'D3 . A3 . D3 . A3 . | C3 . G3 . C3 . G3 . | D3 . A3 . D3 . A3 . | G2 . D3 . G2 . B2 . | F2 . C3 . F2 . C3 . | C3 . G3 . A2 . E3 . | D3 . A3 . C3 . G3 . | D3 . A3 . D3 - - . | ' +
            /* B */ 'G2 . B2 . D3 . B2 . | C3 . E3 . G3 . E3 . | G2 . B2 . D3 . G2 . | A2 . C3 . E3 . C3 . | F2 . A2 . C3 . A2 . | C3 . E3 . G3 . E3 . | G2 . D3 . B2 . D3 . | C3 . G3 . C3 - - . | ' +
            /* C */ 'D3 . A3 . D3 . A3 . | G2 . D3 . G2 . B2 . | D3 . A3 . D3 . A3 . | G2 . D3 . G2 . B2 . | D3 . A3 . D3 . A3 . | G2 . D3 . G2 . D3 . | F2 . C3 . F2 . C3 . | C3 . G3 . C3 . G3 . | ' +
            /* D */ 'A2 . E3 . A2 . E3 . | G2 . D3 . G2 . D3 . | F2 . C3 . F2 . C3 . | C3 . G3 . C3 . G3 . | D3 . A3 . D3 . A3 . | G2 . D3 . G2 . B2 . | A2 . E3 . A2 . E3 . | C3 . G3 . E3 . C3 .' },
        { wave: 'p12', vol: 0.045, n:
            /* A */ '. F4 . A4 . F4 . A4 | . E4 . G4 . E4 . G4 | . F4 . A4 . F4 . A4 | . D4 . G4 . B4 . G4 | . F4 . A4 . F4 . A4 | . E4 . G4 . E4 . A4 | . F4 . A4 . E4 . G4 | . F4 . A4 . D4 . . | ' +
            /* B */ '. D4 . G4 . B4 . G4 | . E4 . G4 . C5 . G4 | . D4 . G4 . B4 . D5 | . E4 . A4 . E4 . A4 | . C4 . F4 . A4 . F4 | . E4 . G4 . C5 . G4 | . D4 . G4 . B4 . D5 | . E4 . G4 . C5 . . | ' +
            /* C */ '. F4 . A4 . F4 . A4 | . D4 . G4 . B4 . G4 | . F4 . A4 . F4 . A4 | . D4 . G4 . B4 . G4 | . F4 . A4 . F4 . A4 | . D4 . G4 . B4 . G4 | . A4 . C5 . A4 . C5 | . E4 . G4 . C5 . G4 | ' +
            /* D */ '. E4 . A4 . E4 . A4 | . D4 . G4 . B4 . G4 | . C4 . A4 . C5 . A4 | . E4 . G4 . E4 . G4 | . F4 . A4 . F4 . A4 | . D4 . G4 . B4 . G4 | . E4 . A4 . C5 . A4 | . E4 . G4 . C5 . G4' },
        { drum: true, vol: 0.1, n:
            /* A */ 'k . h h s . h . | k . h . s . h h | k k h . s . h . | k . h . s h h . | k . h h s . h . | k . h . s . h h | k k h . s . h . | k . h . s h h . | ' +
            /* B */ 'k . h h s . h . | k . h . s . h h | k k h . s . h . | k . h . s h h . | k . h h s . h . | k . h . s . h h | k k h . s . h . | k . h . s h h . | ' +
            /* C */ 'k . h h . . h . | k . h . . . h h | k . h h s . h . | k . h . s . h h | k . h h s . h . | k . h . s . h h | k k h . s . h . | k . h . s h h . | ' +
            /* D */ 'k . h h s . h . | k . h . s . h h | k k h . s . h . | k . h . s h h . | k . h h s . h . | k . h . s . h h | k k h . s . h . | k k h . s . s s' },
    ],
};

/* the Kiln: hot, low, rhythmic (E Phrygian). A as it was; B the old falling bass of the south (A G F E) with the
   tune in A's own rhythm; C a breakdown, then long notes over the fire; D the House motif an octave up; E the falling
   bass again in arpeggios, ending bright; F low again, sighing down into A */
SONGS.kilnhouse = {
    bpm: 96, div: 4,
    ch: [
        { wave: 'p50', vol: 0.07, legato: 0.6, n:
            /* A */ 'E4 - . . F4 - . . E4 - . . . . B3 - | C4 - . . B3 - . . A3 - . . . . . . | E4 - . . F4 - . . G4 - . . . . F4 - | E4 - . . . . . . . . . . . . . . | ' +
            /* B */ 'E4 - . . A4 - . . C5 - . . . . B4 - | B4 - . . A4 - . . G4 - . . . . A4 - | A4 - . . G4 - . . F4 - . . . . G4 - | G4 - . . F4 - . . E4 - - - - - . . | ' +
            /* C */ '. . . . . . . . . . . . . . . . | . . . . . . . . . . . . . . . . | B4 - - - - - - - C5 - - - - - - - | B4 - - - C5 - - - D5 - - - F5 - - - | ' +
            /* D */ 'E5 - . . F5 - . . E5 - . . . . B4 - | C5 - . . B4 - . . A4 - . . . . . . | E5 - . . F5 - . . G5 - . . . . A5 - | G5 - . . F5 - . . E5 - . . . . . . | ' +
            /* E */ 'A4 - C5 - E5 - C5 - A4 - C5 - E5 - D5 - | G4 - B4 - D5 - B4 - G4 - B4 - D5 - C5 - | F4 - A4 - C5 - A4 - F4 - A4 - C5 - B4 - | G#4 - B4 - E5 - B4 - G#4 - - - . . . . | ' +
            /* F */ 'E4 - . . F4 - . . G4 - . . A4 - . . | A4 - . . G4 - . . F4 - . . . . . . | G4 - . . F4 - . . E4 - . . . . D4 - | C4 - . . B3 - - - - - - - . . . .' },
        { wave: 'triangle', vol: 0.24, n:
            /* A */ 'E2 . . E2 . . E3 . E2 . . E2 . . F2 . | E2 . . E2 . . E3 . E2 . . D2 . . C2 . | E2 . . E2 . . E3 . E2 . . E2 . . F2 . | E2 . . . . . . . E2 . . F2 . . E2 . | ' +
            /* B */ 'A2 . . A2 . . A3 . A2 . . A2 . . G2 . | G2 . . G2 . . G3 . G2 . . G2 . . F2 . | F2 . . F2 . . F3 . F2 . . F2 . . E2 . | E2 . . E2 . . E3 . E2 . . D2 . . C2 . | ' +
            /* C */ 'E2 . . E3 . . E2 . E2 . . E3 . . E2 . | E2 . . E3 . . E2 . F2 . . F3 . . F2 . | E2 . . E2 . . E3 . F2 . . F2 . . F3 . | E2 . . E2 . . E3 . E2 . . E2 . . F2 . | ' +
            /* D */ 'E2 . . E2 . . E3 . E2 . . E2 . . F2 . | A2 . . A2 . . A3 . A2 . . G2 . . F2 . | E2 . . E2 . . E3 . C2 . . C2 . . D2 . | E2 . . . . . . . E2 . . F2 . . E2 . | ' +
            /* E */ 'A2 . . A2 . . A3 . A2 . . A2 . . G2 . | G2 . . G2 . . G3 . G2 . . G2 . . F2 . | F2 . . F2 . . F3 . F2 . . F2 . . E2 . | E2 . . E2 . . E3 . E2 . . E2 . . E2 . | ' +
            /* F */ 'E2 . . E2 . . E3 . E2 . . E2 . . F2 . | F2 . . F2 . . F3 . F2 . . F2 . . E2 . | E2 . . E2 . . E3 . E2 . . D2 . . C2 . | E2 . . . . . . . E2 . . F2 . . E2 .' },
        { drum: true, vol: 0.09, n:
            /* A */ 'k . . h . . s . k . h . s . h . | k . . h . . s . k . h . s h h . | k . . h . . s . k . h . s . h . | k . . h . . s . k . h . s h h . | ' +
            /* B */ 'k . . h . . s . k . h . s . h . | k . . h . . s . k . h . s h h . | k . . h . . s . k . h . s . h . | k . . h . . s . k . h . s h h . | ' +
            /* C */ 'k . . h . . k . k . . h . . h . | k . . h . . k . k . . h . h h . | k . . h . . s . k . h . s . h . | k . . h . . s . k . h . s h h . | ' +
            /* D */ 'k . . h . . s . k . h . s . h . | k . . h . . s . k . h . s h h . | k . . h . . s . k . h . s . h . | k . . h . . s . k . h . s h h . | ' +
            /* E */ 'k . . h . . s . k . h . s . h . | k . . h . . s . k . h . s h h . | k . . h . . s . k . h . s . h . | k . . h . . s . k . h . s h h . | ' +
            /* F */ 'k . . h . . s . k . h . s . h . | k . . h . . s . k . h . s h h . | k . . h . . s . k . h . s . h . | k . . h . . s . k . h . s h h .' },
    ],
};

/* Millwater: a lilting boat song (F major, 6/8). A as it was; B into D minor, slower steps, finding its way home;
   C out on open water on the B flat side, a phrase falling and its answer rising; D a breakdown, the harmony voice
   rippling while the lead rests, then a short phrase that leans on C into A */
SONGS.water = {
    bpm: 96, div: 3,
    ch: [
        { wave: 'p25', vol: 0.09, vib: true, n:
            /* A */ 'C5 - A4 F4 - A4 | C5 - D5 C5 - - | Bb4 - G4 E4 - G4 | Bb4 - C5 A4 - - | C5 - A4 F4 - A4 | F5 - E5 D5 - C5 | Bb4 - A4 G4 - A4 | F4 - - - . . | A4 - C5 F5 - E5 | D5 - C5 Bb4 - A4 | G4 - Bb4 D5 - C5 | Bb4 - A4 G4 - . | A4 - C5 F5 - G5 | A5 - G5 F5 - D5 | C5 - A4 G4 - E4 | F4 - - - . . | ' +
            /* B */ 'A4 - - D5 - - | E5 - - C#5 - - | D5 - E5 F5 - D5 | E5 - - - . . | F5 - - D5 - - | C5 - - A4 - - | Bb4 - C5 D5 - Bb4 | A4 - - - . . | D5 - - F5 - - | E5 - - G5 - - | F5 - E5 D5 - C5 | C5 - - A4 - - | Bb4 - - D5 - - | G5 - - F5 - D5 | C5 - - E5 - G5 | F5 - - - . . | ' +
            /* C */ 'D5 - C5 Bb4 - D5 | C5 - Bb4 A4 - C5 | Bb4 - A4 G4 - Bb4 | A4 - - - . . | F5 - D5 Bb4 - D5 | A4 - C5 F5 - C5 | Bb4 - D5 F5 - D5 | E5 - - - . . | Bb4 - C5 D5 - Bb4 | A4 - Bb4 C5 - A4 | G4 - A4 Bb4 - G4 | F4 - - A4 - - | Bb4 - - D5 - - | C5 - - F5 - - | D5 - - F5 - - | E5 - - G5 - - | ' +
            /* D */ '. . . . . . | . . . . . . | . . . . . . | . . . . . . | A4 - - C5 - - | F5 - - D5 - - | D5 - - Bb4 - - | G4 - - Bb4 - -' },
        { wave: 'triangle', vol: 0.2, n:
            /* A */ 'F2 . C3 A3 . C3 | F2 . C3 A3 . C3 | C2 . G2 Bb2 . G2 | F2 . C3 A3 . C3 | F2 . C3 A3 . C3 | Bb2 . F3 D3 . F3 | C3 . G3 E3 . G3 | F2 . C3 F3 . . | D2 . A2 F3 . A2 | Bb2 . F3 D3 . F3 | G2 . D3 Bb2 . D3 | C3 . G3 E3 . G3 | F2 . C3 A3 . C3 | D3 . A3 F3 . A3 | C3 . G3 A3 . C3 | F2 . C3 F2 . . | ' +
            /* B */ 'D2 . A2 F3 . A2 | A2 . E3 C#3 . E3 | D3 . A3 F3 . A3 | A2 . E3 C#3 . . | Bb2 . F3 D3 . F3 | F2 . C3 A3 . C3 | G2 . D3 Bb2 . D3 | A2 . E3 C#3 . G3 | D2 . A2 F3 . A2 | C3 . G3 E3 . G3 | Bb2 . F3 D3 . F3 | F2 . C3 A3 . C3 | G2 . D3 Bb2 . D3 | G2 . D3 Bb2 . D3 | C3 . G3 E3 . G3 | F2 . C3 A3 . C3 | ' +
            /* C */ 'Bb2 . F3 D3 . F3 | F2 . C3 A3 . C3 | G2 . D3 Bb2 . D3 | D3 . A3 F3 . A3 | Bb2 . F3 D3 . F3 | F2 . C3 A3 . C3 | G2 . D3 F3 . D3 | C3 . G3 E3 . G3 | Bb2 . F3 D3 . F3 | F2 . C3 A3 . C3 | G2 . D3 Bb2 . D3 | D3 . A3 F3 . A3 | Bb2 . F3 D3 . F3 | F2 . C3 A3 . C3 | G2 . D3 F3 . D3 | C3 . G3 E3 . Bb2 | ' +
            /* D */ 'F2 . C3 A3 . C3 | Bb2 . F3 D3 . F3 | G2 . D3 Bb2 . D3 | C3 . G3 E3 . G3 | F2 . C3 A3 . C3 | D3 . A3 F3 . A3 | Bb2 . F3 D3 . F3 | C3 . G3 E3 . G3' },
        { wave: 'p12', vol: 0.04, n:
            /* A */ '. . F4 . . A4 | . . F4 . . A4 | . . E4 . . G4 | . . F4 . . A4 | . . F4 . . A4 | . . D4 . . F4 | . . E4 . . G4 | . . A4 . . . | . . F4 . . A4 | . . D4 . . F4 | . . D4 . . G4 | . . E4 . . G4 | . . F4 . . A4 | . . F4 . . A4 | . . E4 . . G4 | . . A4 . . . | ' +
            /* B */ '. . F4 . . A4 | . . E4 . . G4 | . . D4 . . A4 | . . C#4 . . E4 | . . D4 . . F4 | . . F4 . . A4 | . . D4 . . G4 | . . C#4 . . E4 | . . F4 . . A4 | . . E4 . . G4 | . . D4 . . F4 | . . F4 . . A4 | . . D4 . . G4 | . . Bb3 . . D4 | . . E4 . . Bb4 | . . A4 . . . | ' +
            /* C */ '. . D4 . . F4 | . . F4 . . A4 | . . D4 . . G4 | . . F4 . . A4 | . . D4 . . F4 | . . F4 . . A4 | . . D4 . . G4 | . . E4 . . G4 | . . D4 . . F4 | . . F4 . . C5 | . . D4 . . D5 | . . D4 . . F4 | . . D4 . . Bb4 | . . F4 . . A4 | . . D4 . . G4 | . . E4 . . Bb4 | ' +
            /* D */ 'F4 A4 C5 A4 F4 A4 | F4 Bb4 D5 Bb4 F4 Bb4 | G4 Bb4 D5 Bb4 G4 Bb4 | G4 C5 E5 C5 G4 C5 | F4 A4 C5 A4 F4 A4 | F4 A4 D5 A4 F4 A4 | F4 Bb4 D5 Bb4 F4 Bb4 | G4 C5 E5 C5 Bb4 G4' },
    ],
};

/* the Millrace: water and machinery (D Dorian), a steady wheel in the bass, the tune running over it. A as it was;
   B long notes in F major, each with a little turn, floating over the wheel; C a breakdown, only the machinery
   turning, then the lead back in falling staccato arpeggios like gears; D a closing strain that climbs and comes
   round on A */
SONGS.millrace = {
    bpm: 132, div: 2,
    ch: [
        { wave: 'p25', vol: 0.08, legato: 0.6, n:
            /* A */ 'D5 - . F5 E5 - D5 - | C5 - A4 - B4 - C5 - | D5 - . F5 G5 - A5 - | G5 - F5 - E5 - - - | F5 - . E5 D5 - C5 - | B4 - G4 - A4 - B4 - | C5 - D5 - E5 - C5 - | D5 - - - . . . . | ' +
            /* B */ 'C5 - - - - - D5 C5 | E5 - - - - - D5 C5 | F5 - - - - - E5 D5 | E5 - - - - - . . | D5 - - - - - C5 D5 | C5 - - - - - Bb4 A4 | Bb4 - - - - - A4 G4 | A4 - - - - - . . | ' +
            /* C */ '. . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | A5 . F5 . D5 . F5 . | G5 . E5 . C5 . E5 . | F5 . D5 . Bb4 . D5 . | E5 . C#5 . A4 . C#5 . | ' +
            /* D */ 'A5 - . G5 F5 - D5 - | E5 - . D5 C5 - E5 - | F5 - . D5 Bb4 - D5 - | E5 - - - C#5 - - - | D5 - . E5 F5 - G5 - | D5 - . B4 G4 - B4 - | C#5 - . E5 G5 - E5 - | A4 - - - . . . .' },
        { wave: 'triangle', vol: 0.22, n:
            /* A */ 'D2 . A2 D3 . A2 D3 . | C2 . G2 C3 . G2 C3 . | D2 . A2 D3 . A2 D3 . | A1 . E2 A2 . E2 A2 . | Bb1 . F2 Bb2 . F2 Bb2 . | G1 . D2 G2 . D2 G2 . | A1 . E2 A2 . C#3 A2 . | D2 . A2 D3 . A2 D2 . | ' +
            /* B */ 'F1 . C2 F2 . C2 F2 . | C2 . G2 C3 . G2 C3 . | D2 . A2 D3 . A2 D3 . | A1 . E2 A2 . E2 A2 . | Bb1 . F2 Bb2 . F2 Bb2 . | F1 . C2 F2 . C2 F2 . | G1 . D2 G2 . D2 G2 . | A1 . E2 A2 . C#3 A2 . | ' +
            /* C */ 'D2 . A2 D3 . A2 D3 . | C2 . G2 C3 . G2 C3 . | Bb1 . F2 Bb2 . F2 Bb2 . | A1 . E2 A2 . C#3 A2 . | D2 . A2 D3 . A2 D3 . | C2 . G2 C3 . G2 C3 . | Bb1 . F2 Bb2 . F2 Bb2 . | A1 . E2 A2 . C#3 A2 . | ' +
            /* D */ 'D2 . A2 D3 . A2 D3 . | C2 . G2 C3 . G2 C3 . | Bb1 . F2 Bb2 . F2 Bb2 . | A1 . E2 A2 . C#3 A2 . | D2 . A2 D3 . A2 D3 . | G1 . D2 G2 . D2 G2 . | A1 . E2 A2 . E2 G2 . | A1 . E2 A2 . C#3 A2 .' },
        { wave: 'p12', vol: 0.04, n:
            /* A */ 'F4 A4 F4 A4 F4 A4 F4 A4 | E4 G4 E4 G4 E4 G4 E4 G4 | F4 A4 F4 A4 F4 A4 F4 A4 | E4 A4 E4 A4 C#4 E4 C#4 E4 | F4 Bb4 F4 Bb4 F4 Bb4 F4 Bb4 | D4 G4 D4 G4 D4 G4 B4 G4 | E4 A4 E4 A4 C#4 E4 G4 E4 | F4 A4 F4 A4 D4 F4 A4 . | ' +
            /* B */ 'F4 A4 F4 A4 F4 A4 F4 A4 | E4 G4 E4 G4 E4 G4 E4 G4 | F4 A4 F4 A4 F4 A4 D4 A4 | E4 A4 C5 A4 E4 A4 C5 A4 | F4 Bb4 F4 Bb4 F4 Bb4 F4 Bb4 | F4 A4 F4 A4 F4 A4 F4 A4 | D4 G4 D4 G4 D4 G4 D4 G4 | E4 A4 E4 A4 C#4 E4 C#4 E4 | ' +
            /* C */ 'F4 A4 F4 A4 F4 A4 F4 A4 | E4 G4 E4 G4 E4 G4 E4 G4 | F4 Bb4 F4 Bb4 F4 Bb4 F4 Bb4 | E4 A4 E4 A4 C#4 E4 G4 E4 | F4 A4 F4 A4 F4 A4 F4 A4 | E4 G4 E4 G4 E4 G4 E4 G4 | F4 Bb4 F4 Bb4 F4 Bb4 F4 Bb4 | E4 A4 E4 A4 C#4 E4 C#4 E4 | ' +
            /* D */ 'D4 A4 D4 A4 F4 A4 D4 A4 | E4 G4 E4 G4 E4 G4 E4 G4 | F4 Bb4 F4 Bb4 F4 Bb4 F4 Bb4 | E4 A4 E4 A4 C#4 E4 C#4 E4 | F4 A4 F4 A4 F4 A4 F4 A4 | D4 G4 D4 G4 D4 G4 B4 G4 | E4 A4 E4 A4 C#4 E4 G4 E4 | E4 A4 E4 A4 C#4 E4 C#4 E4' },
        { drum: true, vol: 0.08, n:
            /* A */ 'k . h . s . h . | k . h k s . h h | k . h . s . h . | k . h k s . h h | k . h . s . h . | k . h k s . h h | k . h . s . h . | k . h k s . h h | ' +
            /* B */ 'k . h . s . h . | k . h k s . h h | k . h . s . h . | k . h k s . h h | k . h . s . h . | k . h k s . h h | k . h . s . h . | k . h k s . h h | ' +
            /* C */ 'k . h . . . h . | k . h . . . h h | k . h . . . h . | k . h k . . h h | k . h . s . h . | k . h k s . h h | k . h . s . h . | k . h k s . h h | ' +
            /* D */ 'k . h . s . h . | k . h k s . h h | k . h . s . h . | k . h k s . h h | k . h . s . h . | k . h k s . h h | k . h . s . h . | k . h k s . s s' },
    ],
};

/* Belfry Heights: wide open, windy (A mixolydian), a horn-call tune over open fifths. A as it was; B a broad line
   coming down off the heights on the D side; C horn calls, each answered by its echo an octave down in the quiet
   voice; D a high closing strain that comes home by way of G, the mode's own step back to A */
SONGS.heights = {
    bpm: 100, div: 2,
    ch: [
        { wave: 'p25', vol: 0.09, vib: true, n:
            /* A */ 'E5 - - - A5 - G5 - | E5 - D5 - E5 - - - | C#5 - E5 - A5 - B5 - | G5 - - - - - . . | A5 - - - G5 - E5 - | D5 - E5 - G5 - A5 - | B5 - A5 - G5 - E5 - | A5 - - - - - . . | ' +
            /* B */ 'F#5 - - - - - E5 D5 | E5 - - - - - C#5 A4 | D5 - - - - - B4 G4 | A4 - - - - - . . | A4 - - - C#5 - F#5 - | G5 - - - - - A5 B5 | A5 - - - F#5 - D5 - | B4 - - - - - . . | ' +
            /* C */ 'E5 - - - A5 - - - | . . . . . . . . | D5 - - - G5 - - - | . . . . . . . . | A4 - - - D5 - F#5 - | . . . . . . . . | B4 - - - E5 - G5 - | . . . . . . . . | ' +
            /* D */ 'F#5 - - - A5 - - - | C#5 - - - E5 - A5 - | B5 - - - G5 - D5 - | F#5 - - - - - . . | C#5 - - - F#5 - A5 - | G5 - - - E5 - B4 - | A4 - - - D5 - F#5 - | G5 - - - - - D5 -' },
        { wave: 'triangle', vol: 0.2, n:
            /* A */ 'A2 . E3 . A2 . E3 . | G2 . D3 . G2 . D3 . | A2 . E3 . A2 . E3 . | D2 . A2 . G2 . D3 . | A2 . E3 . A2 . E3 . | G2 . D3 . G2 . D3 . | D2 . A2 . E2 . B2 . | A2 . E3 . A2 . . . | ' +
            /* B */ 'D2 . A2 . D2 . A2 . | A2 . E3 . A2 . E3 . | G2 . D3 . G2 . D3 . | D2 . A2 . D2 . A2 . | F#2 . C#3 . F#2 . C#3 . | G2 . D3 . G2 . D3 . | D2 . A2 . D2 . A2 . | E2 . B2 . E2 . B2 . | ' +
            /* C */ 'A2 . E3 . A2 . E3 . | A2 . E3 . A2 . E3 . | G2 . D3 . G2 . D3 . | G2 . D3 . G2 . D3 . | D2 . A2 . D2 . A2 . | D2 . A2 . D2 . A2 . | E2 . B2 . E2 . B2 . | E2 . B2 . E2 . B2 . | ' +
            /* D */ 'D2 . A2 . D2 . A2 . | A2 . E3 . A2 . E3 . | G2 . D3 . G2 . D3 . | D2 . A2 . D2 . A2 . | F#2 . C#3 . F#2 . C#3 . | E2 . B2 . E2 . B2 . | D2 . A2 . D2 . A2 . | G2 . D3 . G2 . D3 .' },
        { wave: 'p12', vol: 0.035, n:
            /* A */ 'A4 . E4 . A4 . E4 . | G4 . D4 . G4 . D4 . | A4 . E4 . A4 . E4 . | F#4 . D4 . G4 . D4 . | A4 . E4 . A4 . E4 . | G4 . D4 . G4 . D4 . | F#4 . A4 . G4 . B4 . | A4 . E4 . A4 . . . | ' +
            /* B */ 'A4 . D4 . A4 . D4 . | A4 . E4 . A4 . E4 . | G4 . D4 . G4 . D4 . | F#4 . D4 . F#4 . D4 . | F#4 . C#4 . F#4 . C#4 . | G4 . D4 . G4 . D4 . | F#4 . D4 . A4 . D4 . | G4 . E4 . G4 . B4 . | ' +
            /* C */ 'A4 . E4 . A4 . E4 . | E4 - - - A4 - - - | G4 . D4 . G4 . D4 . | D4 - - - G4 - - - | F#4 . D4 . F#4 . D4 . | A3 - - - D4 - F#4 - | G4 . E4 . G4 . B4 . | B3 - - - E4 - G4 - | ' +
            /* D */ 'F#4 . D4 . A4 . D4 . | A4 . E4 . A4 . E4 . | G4 . D4 . G4 . D4 . | F#4 . D4 . A4 . D4 . | F#4 . C#4 . F#4 . C#4 . | G4 . E4 . G4 . B4 . | F#4 . D4 . A4 . D4 . | G4 . D4 . G4 . B4 .' },
    ],
};

/* the Belfry: a peal (G major), bells changing over a steady stroke. A as it was; B real change ringing, each bar
   the chord's four bells in the next row of a plain hunt (1234 2143 2413 4231 4321 3412 3142 1324); C the bells
   rung slowly down the scale and back up, the stroke almost still; D the full peal in eighths, settling into
   quarters and climbing to the first bell of A */
SONGS.belfry = {
    bpm: 120, div: 2,
    ch: [
        { wave: 'p12', vol: 0.07, n:
            /* A */ 'G5 . D5 . B4 . G4 . | A4 . B4 . D5 . G5 . | G5 . E5 . C5 . A4 . | B4 . D5 . G5 . D5 . | E5 . C5 . G4 . C5 . | D5 . B4 . G4 . B4 . | C5 . A4 . F#4 . A4 . | G4 . . . G5 . . . | ' +
            /* B */ 'E5 . B4 . G4 . E4 . | E5 . G5 . G4 . C5 . | D5 . G4 . G5 . B4 . | F#4 . D5 . A4 . F#5 . | E4 . G4 . B4 . E5 . | C5 . G4 . G5 . E5 . | A4 . E5 . E4 . C5 . | F#5 . A4 . D5 . F#4 . | ' +
            /* C */ 'G5 . . . F#5 . . . | E5 . . . D5 . . . | C5 . . . B4 . . . | A4 . . . G4 . . . | G4 . . . A4 . . . | B4 . . . C5 . . . | D5 . . . E5 . . . | F#5 . . . . . . . | ' +
            /* D */ 'G5 D5 B4 G4 B4 D5 G5 D5 | G5 E5 C5 G4 C5 E5 G5 E5 | E5 C5 A4 E4 A4 C5 E5 C5 | F#5 D5 A4 F#4 A4 D5 F#5 D5 | B4 . E5 . G5 . E5 . | C5 . E5 . G5 . E5 . | A4 . C5 . E5 . C5 . | A4 . D5 . F#5 . . .' },
        { wave: 'p25', vol: 0.07, legato: 0.7, n:
            /* A */ 'B4 - - - - - - - | C5 - - - - - - - | C5 - - - - - - - | B4 - - - - - - - | C5 - - - - - - - | B4 - - - - - - - | A4 - - - - - - - | G4 - - - - - - - | ' +
            /* B */ 'B4 - - - - - - - | C5 - - - - - - - | B4 - - - - - - - | A4 - - - - - - - | B4 - - - - - - - | C5 - - - - - - - | C5 - - - - - - - | A4 - - - - - - - | ' +
            /* C */ 'B4 - - - A4 - - - | C5 - - - B4 - - - | A4 - - - G4 - - - | F#4 - - - G4 - - - | B4 - - - A4 - - - | G4 - - - A4 - - - | B4 - - - C5 - - - | A4 - - - - - - - | ' +
            /* D */ 'B4 - - - - - - - | C5 - - - - - - - | C5 - - - - - - - | A4 - - - - - - - | B4 - - - - - - - | C5 - - - - - - - | C5 - - - - - - - | A4 - - - - - - -' },
        { wave: 'triangle', vol: 0.2, n:
            /* A */ 'G2 . . . D3 . . . | D2 . . . G2 . . . | C3 . . . A2 . . . | G2 . . . D3 . . . | C3 . . . G2 . . . | G2 . . . D3 . . . | D3 . . . A2 . . . | G2 . . . G2 . . . | ' +
            /* B */ 'E2 . . . B2 . . . | C3 . . . G2 . . . | G2 . . . D3 . . . | D3 . . . A2 . . . | E2 . . . B2 . . . | C3 . . . G2 . . . | A2 . . . E3 . . . | D3 . . . A2 . . . | ' +
            /* C */ 'G2 . . . D3 . . . | C3 . . . G2 . . . | A2 . . . E2 . . . | D3 . . . G2 . . . | G2 . . . F#2 . . . | E2 . . . A2 . . . | B2 . . . C3 . . . | D3 . . . A2 . . . | ' +
            /* D */ 'G2 . . . D3 . . . | C3 . . . G2 . . . | A2 . . . E3 . . . | D3 . . . A2 . . . | E2 . . . B2 . . . | C3 . . . G2 . . . | A2 . . . E3 . . . | D3 . . . A2 . . .' },
        { drum: true, vol: 0.05, n:
            /* A */ 'k . . . h . . . | k . . . s . . . | k . . . h . . . | k . . . s . . . | k . . . h . . . | k . . . s . . . | k . . . h . . . | k . . . s . . . | ' +
            /* B */ 'k . . . h . . . | k . . . s . . . | k . . . h . . . | k . . . s . . . | k . . . h . . . | k . . . s . . . | k . . . h . . . | k . . . s . . . | ' +
            /* C */ 'k . . . . . . . | k . . . . . . . | k . . . . . . . | k . . . h . . . | k . . . h . . . | k . . . s . . . | k . . . h . . . | k . . . s . s . | ' +
            /* D */ 'k . . . h . . . | k . . . s . . . | k . . . h . . . | k . . . s . . . | k . . . h . . . | k . . . s . . . | k . . . h . . . | k . . . s . s s' },
    ],
};

/* the boss (E minor): A as it was; D its riff with the bass in unison, the lead and bass running down together
   from E, from C, from A, held each time on a long note; B a long heroic line climbing over C, D, E minor; C arpeggios
   driving over a bass that falls a half step at a time (E D# D C# C, A, B) into the turn back to A */
SONGS.boss = {
    bpm: 150, div: 2,
    ch: [
        { wave: 'p50', vol: 0.08, n:
            /* A */ 'E5 . E5 . G5 . E5 . | D#5 . F#5 . B4 . . . | E5 . E5 . G5 . A5 . | B5 - - - A5 . G5 . | C6 . B5 . A5 . G5 . | F#5 . G5 . A5 . F#5 . | E5 . D#5 . E5 . F#5 . | B4 - - - . . . . | ' +
            /* D */ 'E5 . G5 F#5 . E5 D5 . | E5 - - - B4 . . . | E5 . G5 F#5 . E5 D5 . | G5 - - - F#5 . . . | C6 . B5 A5 . G5 F#5 . | G5 - - - E5 . . . | A5 . G5 F#5 . E5 D#5 . | E5 - - - F#5 . D#5 . | ' +
            /* B */ 'E5 - - - G5 - - - | F#5 - - - A5 - - - | G5 - - - B5 - - - | B5 - - - G5 . E5 . | C6 - - - G5 . E5 . | A5 - - - F#5 . D5 . | D#5 - - - F#5 . B5 . | A5 - - - - - . . | ' +
            /* C */ 'B4 . E5 . G5 . B5 . | F#5 . D#5 . B4 . D#5 . | G5 . E5 . B4 . E5 . | A5 . E5 . C#5 . E5 . | G5 . E5 . C5 . E5 . | A5 . E5 . C5 . E5 . | B5 . F#5 . D#5 . F#5 . | A5 . F#5 . D#5 . B4 .' },
        { wave: 'triangle', vol: 0.22, n:
            /* A */ 'E2 E3 E2 E3 E2 E3 E2 E3 | B1 B2 B1 B2 B1 B2 B1 B2 | E2 E3 E2 E3 E2 E3 E2 E3 | G2 G3 G2 G3 A2 A3 A2 A3 | C3 C4 C3 C4 C3 C4 C3 C4 | D3 D4 D3 D4 D3 D4 D3 D4 | E2 E3 E2 E3 C3 C4 C3 C4 | B1 B2 B1 B2 B1 B2 B1 B2 | ' +
            /* D */ 'E2 . G2 F#2 . E2 D2 . | E2 E3 E2 E3 B1 B2 B1 B2 | E2 . G2 F#2 . E2 D2 . | G2 G3 G2 G3 F#2 F#3 F#2 F#3 | C3 . B2 A2 . G2 F#2 . | G2 G3 G2 G3 E2 E3 E2 E3 | A2 . G2 F#2 . E2 D#2 . | E2 E3 E2 E3 B1 B2 B1 B2 | ' +
            /* B */ 'C3 C4 C3 C4 C3 C4 C3 C4 | D3 D4 D3 D4 D3 D4 D3 D4 | E2 E3 E2 E3 E2 E3 E2 E3 | E2 E3 E2 E3 E2 E3 E2 E3 | C3 C4 C3 C4 C3 C4 C3 C4 | D3 D4 D3 D4 D3 D4 D3 D4 | B1 B2 B1 B2 B1 B2 B1 B2 | B1 B2 B1 B2 B1 B2 B1 B2 | ' +
            /* C */ 'E2 E3 E2 E3 E2 E3 E2 E3 | D#2 D#3 D#2 D#3 D#2 D#3 D#2 D#3 | D2 D3 D2 D3 D2 D3 D2 D3 | C#2 C#3 C#2 C#3 C#2 C#3 C#2 C#3 | C2 C3 C2 C3 C2 C3 C2 C3 | A1 A2 A1 A2 A1 A2 A1 A2 | B1 B2 B1 B2 B1 B2 B1 B2 | B1 B2 B1 B2 B1 B2 B1 B2' },
        { wave: 'p25', vol: 0.04, n:
            /* A */ 'B4 . G4 . B4 . G4 . | F#4 . D#4 . F#4 . D#4 . | B4 . G4 . B4 . G4 . | D5 . B4 . E5 . C5 . | E5 . C5 . E5 . C5 . | F#5 . D5 . F#5 . D5 . | B4 . G4 . A4 . E4 . | F#4 . D#4 . F#4 . D#4 . | ' +
            /* D */ 'B4 - - - - - - - | G4 . B4 . G4 . B4 . | B4 - - - - - - - | D5 . B4 . D5 . A4 . | E5 - - - - - - - | D5 . B4 . G4 . B4 . | A4 - - - F#4 - - - | B4 . G4 . F#4 . D#4 . | ' +
            /* B */ 'G4 . E4 . G4 . E4 . | A4 . F#4 . A4 . F#4 . | B4 . G4 . B4 . G4 . | B4 . G4 . B4 . G4 . | E5 . C5 . E5 . C5 . | F#5 . D5 . F#5 . D5 . | F#4 . D#4 . F#4 . D#4 . | F#4 . D#4 . A4 . D#4 . | ' +
            /* C */ 'G4 . B4 . G4 . B4 . | D#4 . F#4 . D#4 . F#4 . | E4 . G4 . E4 . G4 . | C#4 . E4 . C#4 . E4 . | E4 . G4 . E4 . G4 . | C5 . A4 . C5 . A4 . | D#5 . B4 . D#5 . B4 . | D#5 . A4 . D#5 . A4 .' },
        { drum: true, vol: 0.11, n:
            /* A */ 'k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | ' +
            /* D */ 'k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | ' +
            /* B */ 'k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | ' +
            /* C */ 'k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s s s s' },
    ],
};

/* the shops (C major): A as it was; A2 its answer, mirrored; B a singing tune stepping down from the F side; C the
   bass walking on its own for two bars, then the jingle broken into arpeggios round the circle back to C */
SONGS.shop = {
    bpm: 112, div: 2,
    ch: [
        { wave: 'p25', vol: 0.09, n:
            /* A */ 'C5 . E5 . G5 . E5 . | F5 . A5 . G5 - - . | E5 . C5 . D5 . B4 . | C5 - - . . . . . | ' +
            /* A2 */ 'G5 . E5 . C5 . E5 . | F5 . D5 . B4 - - . | C5 . E5 . A5 . E5 . | D5 . B4 . C5 - - . | ' +
            /* B */ 'A5 - G5 - F5 - C5 - | E5 - D5 - C5 - G5 - | F5 - E5 - D5 - A4 - | B4 - - - D5 - - . | A5 - G5 - F5 - A5 - | G5 - E5 - C5 - E5 - | F5 - D5 - B4 - D5 - | C5 - - - . . . . | ' +
            /* C */ '. . . . . . . . | . . . . . . . . | F5 . A5 . F5 . C5 . | D5 . G5 . D5 . B4 . | E5 . G5 . B4 . E5 . | C5 . E5 . A5 . E5 . | F5 . D5 . A4 . D5 . | G5 . F5 . D5 . B4 .' },
        { wave: 'triangle', vol: 0.18, n:
            /* A */ 'C3 . . . G2 . . . | F2 . . . C3 . . . | A2 . . . G2 . . . | C3 . G2 . C3 . . . | ' +
            /* A2 */ 'C3 . . . G2 . . . | D3 . . . G2 . . . | C3 . . . A2 . . . | G2 . . . C3 . . . | ' +
            /* B */ 'F2 . . . C3 . . . | C3 . . . G2 . . . | D3 . . . A2 . . . | G2 . . . D3 . . . | F2 . . . C3 . . . | E2 . . . C3 . . . | D3 . . . G2 . . . | C3 . G2 . C3 . . . | ' +
            /* C */ 'C3 . E3 . G3 . E3 . | A2 . C3 . E3 . C3 . | F2 . . . C3 . . . | G2 . . . D3 . . . | E2 . . . B2 . . . | A2 . . . E3 . . . | D3 . . . A2 . . . | G2 . . . B2 . . .' },
    ],
};

/* the inn: a tavern jig (G major, 6/8). A as it was; B a second strain from up high; A' the tune again as a fiddler
   would play it the second time round, every gap filled; B' the second strain's answer through E minor; D a strain
   in D major; D' its answer back in G, every gap filled again, ending on D so that C comes as a surprise; C a strain
   in E minor; C' its way home, by A's own D major bar */
SONGS.inn = {
    bpm: 132, div: 3,
    ch: [
        { wave: 'p50', vol: 0.09, n:
            /* A */ 'D5 - B4 G4 - B4 | D5 - G5 - - . | E5 - C5 A4 - C5 | E5 - A5 - - . | F#5 - D5 A4 - D5 | F#5 - A5 G5 - E5 | D5 - B4 A4 - F#4 | G4 - - - - . | ' +
            /* B */ 'G5 - D5 B4 - D5 | E5 - C5 G4 - C5 | D5 - A4 F#4 - A4 | B4 - - D5 - - | G5 - D5 B4 - D5 | E5 - G5 E5 - C5 | D5 - F#5 A5 - F#5 | G5 - - - - . | ' +
            /* A' */ 'D5 C5 B4 G4 A4 B4 | D5 E5 D5 G5 - . | E5 D5 C5 A4 B4 C5 | E5 G5 F#5 A5 - . | F#5 E5 D5 A4 B4 C5 | F#5 G5 A5 G5 F#5 E5 | D5 C5 B4 A4 G4 F#4 | G4 - - - - . | ' +
            /* B' */ 'G5 - E5 B4 - E5 | G5 - E5 C5 - E5 | A4 - C5 E5 - C5 | D5 - - F#5 - - | B4 - E5 G5 - E5 | C5 - E5 G5 - E5 | A5 - F#5 D5 - F#5 | G5 - - - - . | ' +
            /* D */ 'A5 - F#5 D5 - F#5 | A5 - G5 F#5 - E5 | G5 - E5 C#5 - E5 | G5 - F#5 E5 - C#5 | D5 - F#5 A5 - F#5 | G5 - D5 B4 - D5 | F#5 - E5 D5 - C#5 | D5 - - - - . | ' +
            /* D' */ 'G5 - D5 B4 - D5 | A5 - E5 C5 - E5 | G5 - D5 B4 - G4 | A4 - - D5 - - | B4 C5 D5 G5 F#5 E5 | D5 E5 F#5 A5 - F#5 | G5 - E5 D5 - B4 | A4 - - - - . | ' +
            /* C */ 'E5 - F#5 G5 - E5 | F#5 - E5 D5 - A4 | E5 - D5 C5 - G4 | D#5 - - B4 - - | E5 - F#5 G5 - A5 | A5 - F#5 D5 - F#5 | E5 - C5 B4 - A4 | B4 - - - - . | ' +
            /* C' */ 'C5 - E5 G5 - E5 | F#5 - D5 A4 - D5 | D5 - B4 F#4 - B4 | E5 - - B4 - - | C5 - E5 A5 - E5 | F#5 - A5 F#5 - D5 | C5 - A4 F#4 - A4 | G4 - - - - .' },
        { wave: 'triangle', vol: 0.2, n:
            /* A */ 'G2 . . D3 . . | G2 . . D3 . . | A2 . . E3 . . | A2 . . E3 . . | D3 . . A3 . . | D3 . . A2 . . | D3 . . D3 . . | G2 . . G2 . . | ' +
            /* B */ 'G2 . . D3 . . | C3 . . G2 . . | D3 . . A2 . . | G2 . . D3 . . | G2 . . D3 . . | C3 . . G2 . . | D3 . . A2 . . | G2 . . G2 . . | ' +
            /* A' */ 'G2 . . D3 . . | G2 . . D3 . . | A2 . . E3 . . | A2 . . E3 . . | D3 . . A3 . . | D3 . . A2 . . | D3 . . D3 . . | G2 . . G2 . . | ' +
            /* B' */ 'E2 . . B2 . . | C3 . . G2 . . | A2 . . E3 . . | D3 . . A2 . . | E2 . . B2 . . | C3 . . G2 . . | D3 . . A2 . . | G2 . . G2 . . | ' +
            /* D */ 'D3 . . A2 . . | D3 . . A2 . . | A2 . . E3 . . | A2 . . E3 . . | D3 . . A2 . . | G2 . . D3 . . | A2 . . A2 . . | D3 . . D3 . . | ' +
            /* D' */ 'G2 . . D3 . . | C3 . . G2 . . | G2 . . D3 . . | D3 . . A2 . . | G2 . . D3 . . | D3 . . A2 . . | C3 . . G2 . . | D3 . . A2 . . | ' +
            /* C */ 'E2 . . B2 . . | D3 . . A2 . . | C3 . . G2 . . | B2 . . F#2 . . | E2 . . B2 . . | D3 . . A2 . . | C3 . . B2 . . | E2 . . E2 . . | ' +
            /* C' */ 'C3 . . G2 . . | D3 . . A2 . . | B2 . . F#2 . . | E2 . . B2 . . | A2 . . E3 . . | D3 . . A2 . . | D3 . . A2 . . | G2 . . G2 . .' },
        { drum: true, vol: 0.08, n:
            /* A */ 'k . h s . h | k . h s . h | k . h s . h | k . h s h h | k . h s . h | k . h s . h | k . h s . h | k . h s h h | ' +
            /* B */ 'k . h s . h | k . h s . h | k . h s . h | k . h s h h | k . h s . h | k . h s . h | k . h s . h | k . h s h h | ' +
            /* A' */ 'k . h s . h | k . h s . h | k . h s . h | k . h s h h | k . h s . h | k . h s . h | k . h s . h | k . h s h h | ' +
            /* B' */ 'k . h s . h | k . h s . h | k . h s . h | k . h s h h | k . h s . h | k . h s . h | k . h s . h | k . h s h h | ' +
            /* D */ 'k . h s . h | k . h s . h | k . h s . h | k . h s h h | k . h s . h | k . h s . h | k . h s . h | k . h s h h | ' +
            /* D' */ 'k . h s . h | k . h s . h | k . h s . h | k . h s h h | k . h s . h | k . h s . h | k . h s . h | k . h s h h | ' +
            /* C */ 'k . h s . h | k . h s . h | k . h s . h | k . h s h h | k . h s . h | k . h s . h | k . h s . h | k . h s h h | ' +
            /* C' */ 'k . h s . h | k . h s . h | k . h s . h | k . h s h h | k . h s . h | k . h s . h | k . h s . h | k . h s h h' },
    ],
};

/* the Knotting Festival: a jig (D major), the town's tune dancing. A as it was; A' the jig again with every gap
   filled; B and B' a second strain by way of B minor; C and C' the town's own tune (the Return motif, A B D B A)
   as a jig; D a break for the drums and the bass, then the fiddle climbing back in */
SONGS.festival = {
    bpm: 144, div: 3,
    ch: [
        { wave: 'p25', vol: 0.09, n:
            /* A */ 'D5 . F#5 A5 . F#5 | E5 . D5 C#5 . A4 | B4 . D5 G5 . F#5 | E5 . C#5 A4 . . | D5 . F#5 A5 . B5 | A5 . F#5 D5 . F#5 | E5 . G5 F#5 . E5 | D5 . . D5 . . | ' +
            /* A' */ 'D5 E5 F#5 A5 G5 F#5 | E5 F#5 D5 C#5 B4 A4 | B4 C#5 D5 G5 A5 F#5 | E5 D5 C#5 A4 - . | D5 E5 F#5 A5 . B5 | A5 G5 F#5 D5 E5 F#5 | E5 F#5 G5 F#5 G5 E5 | D5 - - - . . | ' +
            /* B */ 'F#5 . D5 B4 . D5 | G5 . D5 B4 . D5 | A5 . F#5 D5 . F#5 | E5 . C#5 A4 . . | F#5 . D5 B4 . D5 | G5 . B5 G5 . D5 | E5 . G5 C#5 . E5 | D5 . . D5 . . | ' +
            /* B' */ 'B4 . D5 G5 . D5 | C#5 . E5 A5 . E5 | A5 . F#5 C#5 . F#5 | B5 . F#5 D5 . . | G5 . D5 B4 . D5 | A5 . F#5 D5 . F#5 | G5 . E5 E5 . C#5 | D5 . . D5 . . | ' +
            /* C */ 'A4 B4 D5 - B4 A4 | F#4 A4 D5 - E5 F#5 | G5 - F#5 E5 D5 B4 | A4 - - - . . | A4 B4 D5 - B4 A4 | F#4 A4 D5 - E5 F#5 | G5 F#5 E5 - A4 C#5 | D5 - - - . . | ' +
            /* C' */ 'F#5 F#5 G5 A5 - F#5 | E5 E5 F#5 G5 - E5 | D5 D5 E5 F#5 D5 B4 | C#5 - B4 A4 - C#5 | F#5 F#5 G5 A5 - F#5 | E5 - G5 F#5 - E5 | D5 - F#5 E5 - C#5 | D5 - - - - . | ' +
            /* D */ '. . . . . . | . . . . . . | D5 . G5 B5 . G5 | C#5 . E5 A5 . E5 | F#5 . A5 D5 . F#5 | D5 . F#5 B5 . F#5 | G5 . E5 C#5 . A4 | E5 . . C#5 . .' },
        { wave: 'triangle', vol: 0.2, n:
            /* A */ 'D3 . A3 D3 . A3 | A2 . E3 A2 . E3 | G2 . D3 G2 . D3 | A2 . E3 A2 . C#3 | D3 . A3 D3 . A3 | D3 . A3 F#3 . A3 | A2 . E3 A2 . E3 | D3 . A2 D3 . . | ' +
            /* A' */ 'D3 . A3 D3 . A3 | A2 . E3 A2 . E3 | G2 . D3 G2 . D3 | A2 . E3 A2 . C#3 | D3 . A3 D3 . A3 | D3 . A3 F#3 . A3 | A2 . E3 A2 . E3 | D3 . A2 D3 . . | ' +
            /* B */ 'B2 . F#3 B2 . F#3 | G2 . D3 G2 . D3 | D3 . A3 D3 . A3 | A2 . E3 A2 . C#3 | B2 . F#3 B2 . F#3 | G2 . D3 G2 . D3 | E3 . B2 A2 . E3 | D3 . A2 D3 . . | ' +
            /* B' */ 'G2 . D3 G2 . D3 | A2 . E3 A2 . E3 | F#2 . C#3 F#2 . C#3 | B2 . F#3 B2 . F#3 | G2 . D3 G2 . D3 | F#2 . A2 D3 . A2 | E3 . B2 A2 . E3 | D3 . A2 D3 . . | ' +
            /* C */ 'D3 . A3 D3 . A3 | D3 . A3 F#3 . A3 | E3 . B2 E3 . B2 | A2 . E3 A2 . C#3 | D3 . A3 D3 . A3 | B2 . F#3 B2 . F#3 | G2 . D3 A2 . E3 | D3 . A2 D3 . . | ' +
            /* C' */ 'D3 . A3 D3 . A3 | E3 . B2 E3 . B2 | B2 . F#3 B2 . F#3 | A2 . E3 A2 . E3 | D3 . A3 D3 . A3 | E3 . B2 E3 . B2 | G2 . D3 A2 . E3 | D3 . A2 D3 . . | ' +
            /* D */ 'D3 . A3 D3 . A3 | A2 . E3 A2 . E3 | G2 . D3 G2 . D3 | A2 . E3 A2 . E3 | D3 . A3 D3 . A3 | B2 . F#3 B2 . F#3 | G2 . D3 A2 . E3 | A2 . E3 A2 . C#3' },
        { drum: true, vol: 0.08, n:
            /* A */ 'k . h s . h | k . h s h h | k . h s . h | k . h s h h | k . h s . h | k . h s h h | k . h s . h | k . h s h h | ' +
            /* A' */ 'k . h s . h | k . h s h h | k . h s . h | k . h s h h | k . h s . h | k . h s h h | k . h s . h | k . h s h h | ' +
            /* B */ 'k . h s . h | k . h s h h | k . h s . h | k . h s h h | k . h s . h | k . h s h h | k . h s . h | k . h s h h | ' +
            /* B' */ 'k . h s . h | k . h s h h | k . h s . h | k . h s h h | k . h s . h | k . h s h h | k . h s . h | k . h s h h | ' +
            /* C */ 'k . h s . h | k . h s h h | k . h s . h | k . h s h h | k . h s . h | k . h s h h | k . h s . h | k . h s h h | ' +
            /* C' */ 'k . h s . h | k . h s h h | k . h s . h | k . h s h h | k . h s . h | k . h s h h | k . h s . h | k . h s h h | ' +
            /* D */ '. . h . . h | . . h . h h | k . h s . h | k . h s h h | k . h s . h | k . h s h h | k . h s . h | k . s s s s' },
    ],
};

/* home (A minor): A as it was; B an answer in C major, warmer, stepping down to rest on E minor and rising into A */
SONGS.home = {
    bpm: 66, div: 2,
    ch: [
        { wave: 'triangle', vol: 0.2, vib: true, n:
            /* A */ 'A4 - C5 - E5 - D5 C5 | A4 - G4 - - - - - | A4 - C5 - D5 - E5 G5 | E5 - - - - - - - | D5 - C5 - A4 - G4 A4 | C5 - A4 - G4 - E4 - | G4 - A4 - C5 - D5 C5 | A4 - - - - - - - | ' +
            /* B */ 'E5 - - - D5 - C5 - | D5 - - - B4 - G4 - | C5 - - - E5 - G5 E5 | B4 - - - - - - - | A4 - C5 - F5 - E5 D5 | E5 - - - C5 - G4 - | D5 - - - A4 - C5 B4 | G4 - - - - - - -' },
        { wave: 'p12', vol: 0.05, n:
            /* A */ 'A3 - E4 - A4 - E4 - | F3 - C4 - F4 - C4 - | D3 - A3 - D4 - A3 - | E3 - B3 - E4 - B3 - | F3 - C4 - F4 - C4 - | C3 - G3 - C4 - G3 - | D3 - A3 - E3 - B3 - | A3 - E4 - A4 - - - | ' +
            /* B */ 'C3 - G3 - C4 - G3 - | G3 - D4 - G4 - D4 - | A3 - E4 - A4 - E4 - | E3 - B3 - E4 - B3 - | F3 - C4 - F4 - C4 - | C3 - G3 - C4 - G3 - | D3 - A3 - D4 - A3 - | E3 - B3 - E4 - B3 -' },
    ],
};

/* the Tidyhouse's keeper: the House's minuet as a fight (A minor). A the whole Tidyhouse tune folded into driving
   cells of three; D the minuet's falling bass (A G# G F# F E) under the same cells, twice, closing as A closes; B its
   trio in C major; C its D minor strain, coming back by the tune's own cadence */
SONGS.boss_tidy = {
    bpm: 156, div: 2,
    ch: [
        { wave: 'p25', vol: 0.085, legato: 0.6, n:
            /* A */ 'A4 C5 E5 . D5 C5 B4 . | A4 C5 E5 . G#4 - - . | A4 C5 E5 . F5 E5 D5 . | C5 B4 A4 . E5 - - . | F5 E5 D5 . C5 D5 E5 . | D5 C5 B4 . A4 B4 C5 . | B4 A4 G#4 . A4 B4 C5 . | B4 G#4 E4 . A4 - - . | ' +
            /* D */ 'E5 D5 C5 . B4 D5 E5 . | E5 C5 G4 . A4 D5 F#5 . | F5 D5 A4 . G#4 B4 E5 . | C5 B4 A4 . B4 - - . | A4 C5 E5 . G#4 B4 E5 . | G4 C5 E5 . F#4 A4 D5 . | F4 A4 C5 . E4 G#4 B4 . | B4 G#4 E4 . A4 - - . | ' +
            /* B */ 'G4 C5 E5 . D5 C5 B4 C5 | E5 G5 E5 . D5 - - . | A4 C5 F5 . E5 D5 C5 D5 | F5 D5 B4 . C5 - - . | E5 D5 C5 . G#4 B4 E5 . | C5 B4 A4 . B4 - - . | F5 C5 A4 . D5 E5 F5 . | B4 D5 F5 . E5 - - . | ' +
            /* C */ 'F5 - E5 D5 C#5 - D5 E5 | A4 - D5 F5 E5 - - . | D5 - C5 Bb4 A4 - Bb4 A4 | G#4 - A4 B4 A4 - - . | F5 - E5 D5 C#5 - D5 E5 | F5 - D5 Bb4 A4 - C#5 E5 | F5 - E5 D5 C5 - B4 A4 | B4 - G#4 - E4 - - .' },
        { wave: 'triangle', vol: 0.22, n:
            /* A */ 'A2 A3 A2 A3 D3 D4 D3 D4 | A2 A3 A2 A3 E2 E3 E2 E3 | A2 A3 A2 A3 D3 D4 D3 D4 | A2 A3 A2 A3 E2 E3 E2 E3 | D3 D4 D3 D4 C3 C4 C3 C4 | G2 G3 G2 G3 A2 A3 A2 A3 | E2 E3 E2 E3 A2 A3 A2 A3 | E2 E3 E2 E3 A2 A3 A2 A3 | ' +
            /* D */ 'A2 A3 A2 A3 G#2 G#3 G#2 G#3 | G2 G3 G2 G3 F#2 F#3 F#2 F#3 | F2 F3 F2 F3 E2 E3 E2 E3 | A2 A3 A2 A3 E2 E3 E2 E3 | A2 A3 A2 A3 G#2 G#3 G#2 G#3 | G2 G3 G2 G3 F#2 F#3 F#2 F#3 | F2 F3 F2 F3 E2 E3 E2 E3 | E2 E3 E2 E3 A2 A3 A2 A3 | ' +
            /* B */ 'C3 C4 C3 C4 G2 G3 G2 G3 | C3 C4 C3 C4 G2 G3 G2 G3 | F2 F3 F2 F3 C3 C4 C3 C4 | G2 G3 G2 G3 C3 C4 C3 C4 | A2 A3 A2 A3 E2 E3 E2 E3 | A2 A3 A2 A3 E2 E3 E2 E3 | F2 F3 F2 F3 D3 D4 D3 D4 | G2 G3 G2 G3 C3 C4 C3 C4 | ' +
            /* C */ 'D3 D4 D3 D4 A2 A3 A2 A3 | D3 D4 D3 D4 A2 A3 A2 A3 | G2 G3 G2 G3 D3 D4 D3 D4 | E2 E3 E2 E3 A2 A3 A2 A3 | D3 D4 D3 D4 A2 A3 A2 A3 | Bb2 Bb3 Bb2 Bb3 A2 A3 A2 A3 | D3 D4 D3 D4 A2 A3 A2 A3 | E2 E3 E2 E3 E2 E3 E2 E3' },
        { wave: 'p12', vol: 0.04, n:
            /* A */ 'E4 . A4 . F4 . A4 . | E4 . A4 . E4 . B4 . | E4 . A4 . F4 . A4 . | E4 . A4 . G#4 . B4 . | F4 . A4 . E4 . G4 . | D4 . G4 . E4 . A4 . | E4 . B4 . E4 . A4 . | G#4 . E4 . C5 . A4 . | ' +
            /* D */ 'A4 . E4 . G#4 . E4 . | G4 . C5 . F#4 . A4 . | F4 . A4 . E4 . G#4 . | E4 . A4 . E4 . G#4 . | E4 . A4 . E4 . B4 . | E4 . G4 . D4 . F#4 . | C4 . F4 . B3 . E4 . | G#4 . E4 . C5 . A4 . | ' +
            /* B */ 'E4 . G4 . D4 . G4 . | E4 . G4 . D4 . B4 . | F4 . A4 . E4 . G4 . | D4 . F4 . E4 . G4 . | A4 . C5 . G#4 . B4 . | A4 . E4 . G#4 . E4 . | A4 . C5 . F4 . A4 . | D4 . F4 . E4 . G4 . | ' +
            /* C */ 'D4 . A4 . E4 . G4 . | D4 . F4 . C#4 . E4 . | G4 . Bb4 . F4 . D4 . | E4 . D4 . E4 . C5 . | D4 . A4 . E4 . G4 . | D4 . F4 . C#4 . E4 . | D4 . A4 . E4 . A4 . | E4 . G#4 . D4 . B4 .' },
        { drum: true, vol: 0.1, n:
            /* A */ 'k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | ' +
            /* D */ 'k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | ' +
            /* B */ 'k . h k s . h k | k k h . s . h s | k . h k s . h k | k k h . s . h s | k . h k s . h k | k k h . s . h s | k . h k s . h k | k k h . s s s s | ' +
            /* C */ 'k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k s . s s s s' },
    ],
};

/* the Kiln's keeper: the House's motif as a fight (E Phrygian). A the Kiln's tune as a riff, lead and bass together,
   then over the hot three-three-two; D long notes high over the three-three-two (the mode's own turn, C to B), then
   the riff a step up on F, lead and bass together, climbing back into A's last bar; B the old falling bass of the
   south (A G F E), ending bright; C long notes over the fire, then the riff climbing E, F, G and crashing back down
   into A */
SONGS.boss_kiln = {
    bpm: 144, div: 2,
    ch: [
        { wave: 'p50', vol: 0.08, n:
            /* A */ 'E5 - F5 - E5 - - B4 | C5 - B4 - A4 - - - | E5 - F5 - G5 - - F5 | E5 - - - . . . . | E5 - F5 G5 - - A5 - | A5 - G5 - F5 - - - | G5 - F5 E5 - - D5 - | C5 - - - B4 - - - | ' +
            /* D */ 'B5 - - - C6 - B5 - | A5 - - - G5 - F5 - | G5 - - - F5 - E5 - | F5 - E5 - D5 - E5 - | F5 - G5 - F5 - - C5 | D5 - C5 - B4 - - - | E5 - F5 - G5 - - A5 | C5 - - - B4 - - - | ' +
            /* B */ 'E5 - A5 - C6 - - A5 | B5 - A5 - G5 - - B5 | A5 - G5 - F5 - - G5 | G#5 - F5 E5 - - - - | C6 - B5 - A5 - E5 - | B5 - A5 - G5 - D5 - | A5 - G5 - F5 - C5 - | E5 - F5 E5 - - - - | ' +
            /* C */ 'B5 - - - - - - - | C6 - - - - - - - | B5 - - - G5 - - - | A5 - - - F5 - - - | E5 - F5 - E5 - B4 - | F5 - G5 - F5 - C5 - | G5 - A5 - G5 - D5 - | A5 - G5 - F5 - E5 -' },
        { wave: 'triangle', vol: 0.24, n:
            /* A */ 'E2 E3 F2 F3 E2 E3 E2 B1 | C2 C3 B1 B2 A1 A2 A1 A2 | E2 E3 F2 F3 G2 G3 G2 F2 | E2 E3 E2 E3 F2 F3 E2 E3 | E2 . . E2 . . E2 E3 | F2 . . F2 . . F2 F3 | E2 . . E2 . . E2 E3 | E2 . . E2 . . D2 D3 | ' +
            /* D */ 'E2 . . E2 . . E2 E3 | F2 . . F2 . . F2 F3 | E2 . . E2 . . E2 E3 | D2 . . D2 . . E2 E3 | F2 F3 G2 G3 F2 F3 F2 C2 | D2 D3 C2 C3 B1 B2 B1 B2 | E2 E3 F2 F3 G2 G3 G2 A2 | E2 . . E2 . . D2 D3 | ' +
            /* B */ 'A2 A3 A2 A3 A2 A3 A2 A3 | G2 G3 G2 G3 G2 G3 G2 G3 | F2 F3 F2 F3 F2 F3 F2 F3 | E2 . . E2 . . E2 E3 | A2 A3 A2 A3 A2 A3 A2 A3 | G2 G3 G2 G3 G2 G3 G2 G3 | F2 F3 F2 F3 F2 F3 F2 F3 | E2 . . E2 . . E2 E3 | ' +
            /* C */ 'E2 . . E2 . . E2 E3 | F2 . . F2 . . F2 F3 | E2 . . E2 . . E2 E3 | F2 . . F2 . . F2 F3 | E2 E3 F2 F3 E2 E3 B1 B2 | F2 F3 G2 G3 F2 F3 C2 C3 | G2 G3 A2 A3 G2 G3 D2 D3 | A2 A3 G2 G3 F2 F3 E2 E3' },
        { wave: 'p25', vol: 0.04, n:
            /* A */ 'E4 . . . B4 . E4 . | E4 . . . E4 . E4 . | E4 . . . B4 . E4 . | E4 . . . B4 . . . | G4 . . . B4 . G4 . | A4 . . . F4 . A4 . | G4 . . . B4 . G4 . | G4 . . . B4 . G4 . | ' +
            /* D */ 'E4 . . . G4 . B4 . | F4 . . . A4 . C5 . | E4 . . . G4 . B4 . | D4 . . . F4 . E4 . | A4 . . . C5 . A4 . | F4 . . . E4 . D4 . | G4 . . . B4 . E4 . | G4 . . . B4 . G4 . | ' +
            /* B */ 'E4 . A4 . C5 . A4 . | D4 . G4 . B4 . G4 . | C4 . F4 . A4 . F4 . | B3 . . G#4 . . B4 . | E4 . A4 . C5 . A4 . | D4 . G4 . B4 . G4 . | C4 . F4 . A4 . F4 . | B3 . . E4 . . G#4 . | ' +
            /* C */ 'E4 . . . B4 . . . | F4 . . . C5 . . . | E4 . . . B4 . . . | F4 . . . C5 . . . | B4 . . . B4 . . . | C5 . . . C5 . . . | D5 . . . D5 . . . | E5 . . . C5 . . .' },
        { drum: true, vol: 0.11, n:
            /* A */ 'k . h k s . h . | k . h k s h h s | k . h k s . h . | k . h k s h h s | k . h k s . h . | k . h k s h h s | k . h k s . h . | k . h k s h h s | ' +
            /* D */ 'k . . k . . k . | k . . k s . h s | k . . k . . k . | k . . k s h s s | k . h k s . h . | k . h k s h h s | k . h k s . h . | k . h k s h h s | ' +
            /* B */ 'k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | ' +
            /* C */ 'k . . k . . k . | k . . k . . k . | k . . k . . k . | k . . k s . s s | k . h k s . h . | k . h k s h h s | k . h k s . h . | k k s . s s s s' },
    ],
};

/* the Millrace's keeper: the House's tune as a fight (D Dorian). A the Millrace tune made sharp over a wheel turning
   in eighths; D the race in running eighths down the wheel's chords (D minor, C, B flat, A), then long notes on the
   mode's bright side (G, C) and A7, closing as A closes; B gears, falling and then climbing; C the House's long notes
   over the race at full tilt */
SONGS.boss_mill = {
    bpm: 152, div: 2,
    ch: [
        { wave: 'p25', vol: 0.08, legato: 0.7, n:
            /* A */ 'D5 . D5 F5 E5 . D5 . | C5 . A4 . B4 . C5 . | D5 . D5 F5 G5 . A5 . | G5 . F5 . E5 - - - | F5 . F5 E5 D5 . C5 . | B4 . G4 . A4 . B4 . | C#5 . D5 . E5 . C#5 . | D5 - - - . . E5 . | ' +
            /* D */ 'F5 E5 D5 E5 F5 G5 A5 F5 | E5 D5 C5 D5 E5 F5 G5 E5 | D5 C5 Bb4 C5 D5 E5 F5 D5 | C#5 D5 E5 C#5 A4 - - . | G5 - - - B5 - A5 G5 | E5 - - - G5 - F5 E5 | C#5 - - - E5 - G5 - | D5 - - - . . E5 . | ' +
            /* B */ 'A5 . F5 . D5 . F5 . | G5 . E5 . C5 . E5 . | F5 . D5 . Bb4 . D5 . | E5 . C#5 . A4 . C#5 . | Bb4 . D5 . F5 . Bb5 . | A5 . F5 . C5 . A4 . | G4 . Bb4 . D5 . G5 . | A5 . E5 . C#5 . A4 . | ' +
            /* C */ 'C5 - - - - - D5 C5 | E5 - - - - - D5 C5 | F5 - - - - - E5 D5 | E5 - - - - - . . | D5 - - - - - C5 D5 | C5 - - - - - Bb4 A4 | Bb4 - - - - - A4 G4 | A4 - - - C#5 - E5 -' },
        { wave: 'triangle', vol: 0.22, n:
            /* A */ 'D2 A2 D3 D2 A2 D3 D2 A2 | C2 G2 C3 C2 G2 C3 C2 G2 | D2 A2 D3 D2 A2 D3 D2 A2 | A1 E2 A2 A1 E2 A2 A1 E2 | Bb1 F2 Bb2 Bb1 F2 Bb2 Bb1 F2 | G1 D2 G2 G1 D2 G2 G1 D2 | A1 E2 A2 A1 E2 A2 A1 E2 | D2 A2 D3 D2 A2 D3 D2 A2 | ' +
            /* D */ 'D2 A2 D3 D2 A2 D3 D2 A2 | C2 G2 C3 C2 G2 C3 C2 G2 | Bb1 F2 Bb2 Bb1 F2 Bb2 Bb1 F2 | A1 E2 A2 A1 E2 A2 A1 E2 | G1 D2 G2 G1 D2 G2 G1 D2 | C2 G2 C3 C2 G2 C3 C2 G2 | A1 E2 A2 A1 E2 A2 A1 E2 | D2 A2 D3 D2 A2 D3 D2 A2 | ' +
            /* B */ 'D2 A2 D3 D2 A2 D3 D2 A2 | C2 G2 C3 C2 G2 C3 C2 G2 | Bb1 F2 Bb2 Bb1 F2 Bb2 Bb1 F2 | A1 E2 A2 A1 E2 A2 A1 E2 | Bb1 F2 Bb2 Bb1 F2 Bb2 Bb1 F2 | F1 C2 F2 F1 C2 F2 F1 C2 | G1 D2 G2 G1 D2 G2 G1 D2 | A1 E2 A2 A1 E2 A2 A1 E2 | ' +
            /* C */ 'F2 F3 F2 F3 F2 F3 F2 F3 | C2 C3 C2 C3 C2 C3 C2 C3 | D2 D3 D2 D3 D2 D3 D2 D3 | A1 A2 A1 A2 A1 A2 A1 A2 | Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 | F2 F3 F2 F3 F2 F3 F2 F3 | G1 G2 G1 G2 G1 G2 G1 G2 | A1 A2 A1 A2 A1 A2 A1 A2' },
        { wave: 'p12', vol: 0.04, n:
            /* A */ 'F4 A4 F4 A4 D4 A4 F4 A4 | E4 G4 E4 G4 E4 G4 E4 G4 | F4 A4 F4 A4 F4 A4 F4 A4 | E4 A4 C#4 A4 C#4 E4 C#4 E4 | F4 Bb4 F4 D4 F4 Bb4 F4 Bb4 | D4 G4 D4 G4 D4 G4 B4 G4 | E4 A4 E4 A4 C#4 E4 G4 E4 | F4 A4 F4 A4 D4 F4 A4 . | ' +
            /* D */ 'A4 D4 A4 D4 A4 D4 A4 D4 | G4 C4 G4 C4 G4 C4 G4 C4 | F4 Bb3 F4 Bb3 F4 Bb3 F4 Bb3 | E4 A3 E4 A3 C#4 E4 A3 E4 | D4 G4 B4 G4 D4 G4 B4 G4 | E4 G4 C5 G4 E4 G4 C5 G4 | E4 A4 C#5 A4 E4 A4 C#5 A4 | F4 A4 F4 A4 D4 F4 A4 . | ' +
            /* B */ 'F4 A4 F4 A4 F4 A4 F4 A4 | E4 G4 E4 G4 E4 G4 E4 G4 | F4 Bb4 F4 Bb4 F4 Bb4 F4 Bb4 | E4 A4 E4 A4 C#4 E4 C#4 E4 | D4 F4 D4 F4 D4 F4 D4 F4 | C4 F4 C4 F4 C4 F4 C4 F4 | D4 G4 D4 G4 D4 G4 D4 G4 | C#4 E4 C#4 E4 C#4 E4 C#4 E4 | ' +
            /* C */ 'F4 A4 F4 A4 F4 A4 F4 A4 | E4 G4 E4 G4 E4 G4 E4 G4 | F4 A4 F4 A4 F4 A4 D4 A4 | E4 A4 C5 A4 E4 A4 C5 A4 | F4 Bb4 F4 Bb4 F4 Bb4 F4 Bb4 | F4 A4 F4 A4 F4 A4 F4 A4 | D4 G4 D4 G4 D4 G4 D4 G4 | E4 A4 E4 A4 C#4 E4 C#4 E4' },
        { drum: true, vol: 0.1, n:
            /* A */ 'k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | ' +
            /* D */ 'k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | ' +
            /* B */ 'k . h k s . h k | k k h . s . h s | k . h k s . h k | k k h . s . h s | k . h k s . h k | k k h . s . h s | k . h k s . h k | k k h . s . h s | ' +
            /* C */ 'k . h . s . h k | k . h k s . h s | k . h . s . h k | k . h k s . h s | k . h . s . h k | k . h k s . h s | k . h . s . h k | k k s . s s s s' },
    ],
};

/* the Belfry's keeper: the House's peal as a fight. A the peal in G minor at twice the speed, then its bells changing
   wildly; D rounds: the eight bells rung straight down the scale, then changes on C minor, E flat and D, over a long
   bell that never rubs against them; B tolling on E flat, B flat, C minor and D under a long line; C the peal as it
   was in G major, and the change ringing, turning on D back into the minor */
SONGS.boss_belfry = {
    bpm: 150, div: 2,
    ch: [
        { wave: 'p12', vol: 0.08, n:
            /* A */ 'G5 D5 Bb4 G4 A4 Bb4 D5 G5 | G5 Eb5 C5 A4 Bb4 D5 G5 D5 | Eb5 C5 G4 C5 D5 Bb4 G4 Bb4 | C5 A4 F#4 A4 G4 - G5 - | D5 G5 G4 Bb4 D5 G4 G5 Bb4 | G4 Eb5 C5 G5 G4 C5 Eb5 G5 | A4 F#4 F#5 D5 A4 F#5 F#4 D5 | G5 Bb4 D5 G4 G5 D5 Bb4 G4 | ' +
            /* D */ 'G5 F5 Eb5 D5 C5 Bb4 A4 G4 | G5 Eb5 F5 D5 Eb5 C5 D5 Bb4 | Bb5 G5 Eb5 Bb4 G5 Eb5 Bb4 G4 | A5 F#5 D5 A4 F#5 D5 A4 F#4 | G5 F5 Eb5 D5 C5 Bb4 A4 G4 | Eb5 G5 Bb5 G5 F5 A5 C6 A5 | Eb5 C5 G4 C5 D5 A4 F#4 A4 | G5 Bb4 D5 G4 G5 D5 Bb4 G4 | ' +
            /* B */ 'G5 . Eb5 . Bb4 . Eb5 . | F5 . D5 . Bb4 . D5 . | G5 . Eb5 . C5 . Eb5 . | F#5 . D5 . A4 . D5 . | Bb5 . G5 . Eb5 . G5 . | F5 . D5 . Bb4 . F5 . | Eb5 . C5 . G4 . C5 . | F#5 . D5 . A4 . F#5 . | ' +
            /* C */ 'G5 D5 B4 G4 A4 B4 D5 G5 | G5 E5 C5 A4 B4 D5 G5 D5 | E5 C5 G4 C5 D5 B4 G4 B4 | C5 A4 F#4 A4 G4 - G5 - | E5 B4 G4 E4 E5 G5 G4 C5 | D5 G4 G5 B4 F#4 D5 A4 F#5 | E4 G4 B4 E5 C5 G4 G5 E5 | A4 E5 E4 C5 D5 A4 F#5 D5' },
        { wave: 'p25', vol: 0.05, legato: 0.7, n:
            /* A */ 'Bb4 - - - C5 - - - | C5 - - - Bb4 - - - | C5 - - - Bb4 - - - | A4 - - - G4 - - - | D5 - - - - - - - | Eb5 - - - - - - - | D5 - - - A4 - - - | Bb4 - - - - - - - | ' +
            /* D */ 'G4 - - - - - - - | C5 - - - - - - - | G4 - - - - - - - | A4 - - - - - - - | G4 - - - - - - - | G4 - - - F4 - - - | C5 - - - A4 - - - | Bb4 - - - - - - - | ' +
            /* B */ 'G5 - - - - - - - | F5 - - - - - - - | Eb5 - - - - - - - | D5 - - - - - - - | Eb5 - - - G5 - - - | F5 - - - D5 - - - | Eb5 - - - C5 - - - | D5 - - - C5 - - - | ' +
            /* C */ 'B4 - - - D5 - - - | C5 - - - B4 - - - | C5 - - - B4 - - - | A4 - - - G4 - - - | B4 - - - C5 - - - | B4 - - - A4 - - - | B4 - - - C5 - - - | C5 - - - A4 - - -' },
        { wave: 'triangle', vol: 0.22, n:
            /* A */ 'G2 G3 G2 G3 G2 G3 G2 G3 | C3 C4 C3 C4 G2 G3 G2 G3 | C3 C4 C3 C4 G2 G3 G2 G3 | D3 D4 D3 D4 G2 G3 G2 G3 | G2 G3 G2 G3 G2 G3 G2 G3 | C3 C4 C3 C4 C3 C4 C3 C4 | D3 D4 D3 D4 D3 D4 D3 D4 | G2 G3 G2 G3 G2 G3 G2 G3 | ' +
            /* D */ 'G2 G3 G2 G3 G2 G3 G2 G3 | C3 C4 C3 C4 C3 C4 C3 C4 | Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 | D2 D3 D2 D3 D2 D3 D2 D3 | G2 G3 G2 G3 G2 G3 G2 G3 | Eb2 Eb3 Eb2 Eb3 F2 F3 F2 F3 | C3 C4 C3 C4 D3 D4 D3 D4 | G2 G3 G2 G3 G2 G3 G2 G3 | ' +
            /* B */ 'Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 | Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 | C2 C3 C2 C3 C2 C3 C2 C3 | D2 D3 D2 D3 D2 D3 D2 D3 | Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 | D2 D3 D2 D3 D2 D3 D2 D3 | C2 C3 C2 C3 C2 C3 C2 C3 | D2 D3 D2 D3 D2 D3 D2 D3 | ' +
            /* C */ 'G2 G3 G2 G3 G2 G3 G2 G3 | C3 C4 C3 C4 G2 G3 G2 G3 | C3 C4 C3 C4 G2 G3 G2 G3 | D3 D4 D3 D4 G2 G3 G2 G3 | E2 E3 E2 E3 C3 C4 C3 C4 | G2 G3 G2 G3 D3 D4 D3 D4 | E2 E3 E2 E3 C3 C4 C3 C4 | A2 A3 A2 A3 D3 D4 D3 D4' },
        { drum: true, vol: 0.1, n:
            /* A */ 'k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | ' +
            /* D */ 'k . h k s . h . | k k h . s . H s | k . h k s . h . | k k h . s . H s | k . h k s . h . | k k h . s . H s | k . h k s . h . | k k h . s . H s | ' +
            /* B */ 'k . h k s . h . | k k h . s . H s | k . h k s . h . | k k h . s . H s | k . h k s . h . | k k h . s . H s | k . h k s . h . | k k h . s . H s | ' +
            /* C */ 'k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k s . s s s s' },
    ],
};
