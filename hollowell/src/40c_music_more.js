/* More music, the second half: longer loops for the title, the lullaby, the Knot, the regions and Houses of the
   north and east, the Underside, the Drift and the Pull; a theme for the Great Spool; and a fight tune for each of
   the last four Houses' keepers. Each extended song starts with its old tune exactly as it was (section A: the
   place's own motif), then new sections in the same key, tempo, instruments and volumes, coming back round to A at
   the loop. Every channel is the song's full length (a drum part may be a shorter pattern that divides it), so the
   parts never drift apart. Loaded after 40_music.js and 40b_music_more.js, so these definitions win. */

/* the title (C major): A as it was (the Return motif G A C A G, then its answer); B a new strain that climbs
   from F to A minor, then walks down F E D to the half close on G that the motif sets out from again */
SONGS.title = {
    bpm: 72, div: 2,
    ch: [
        { wave: 'p25', vol: 0.12, vib: true, n:
            /* A */ 'G4 A4 C5 - A4 G4 - - | E5 - D5 C5 D5 - - - | C5 A4 G4 - A4 - C5 - | D5 - - - - - . . | G4 A4 C5 - A4 G4 - - | E5 - G5 - F5 E5 D5 - | C5 - D5 E5 D5 C5 A4 - | C5 - - - - - . . | ' +
            /* B */ 'C5 - F5 - A5 - - - | G5 - F5 - D5 - - - | B4 - E5 - G5 - - - | A5 - G5 E5 C5 - - - | A5 - G5 - F5 - E5 - | G5 - - - E5 - B4 - | D5 - F5 - A5 - G5 F5 | D5 - - - - - . .' },
        { wave: 'triangle', vol: 0.22, n:
            /* A */ 'C3 - G3 - E3 - G3 - | F2 - C3 - A2 - C3 - | A2 - E3 - C3 - E3 - | G2 - D3 - G2 - B2 - | C3 - G3 - E3 - G3 - | A2 - E3 - C3 - E3 - | F2 - C3 - G2 - D3 - | C3 - G3 - C3 - - - | ' +
            /* B */ 'F2 - C3 - A2 - C3 - | G2 - D3 - B2 - D3 - | E2 - B2 - G2 - B2 - | A2 - E3 - C3 - E3 - | F2 - C3 - A2 - C3 - | E2 - B2 - G2 - B2 - | D2 - A2 - F2 - A2 - | G2 - D3 - G2 - B2 -' },
        { wave: 'p12', vol: 0.05, n:
            /* A */ 'E4 . G4 . E4 . G4 . | A4 . C5 . A4 . C5 . | E4 . A4 . E4 . A4 . | D4 . G4 . B4 . G4 . | E4 . G4 . E4 . G4 . | E4 . A4 . E4 . A4 . | A4 . C5 . B4 . D5 . | E4 . G4 . C5 - - . | ' +
            /* B */ 'A4 . C5 . A4 . C5 . | D4 . G4 . B4 . G4 . | E4 . G4 . B4 . G4 . | E4 . A4 . E4 . A4 . | A4 . C5 . A4 . C5 . | E4 . G4 . B4 . G4 . | D4 . F4 . A4 . F4 . | D4 . G4 . B4 . G4 .' },
    ],
};

/* Gran's lullaby (Linnet's theme), G major: A as it was (low, high, in between, high, low); B its answer, stepping
   down from E over C, G and A minor to rest on D; A' the first line again, closing by step (B A G) this time; C the
   first line turned over (high, low, in between, low, high), resting on D to rock back into A */
SONGS.lullaby = {
    bpm: 66, div: 2,
    ch: [
        { wave: 'triangle', vol: 0.16, vib: true, n:
            /* A */ 'G4 - - - D5 - - - | B4 - - - D5 - - - | G4 - - - - - - - | . . . . . . . . | ' +
            /* B */ 'E5 - - - D5 - - - | C5 - - - B4 - - - | A4 - - - - - - - | . . . . . . . . | ' +
            /* A' */ 'G4 - - - D5 - - - | B4 - - - A4 - - - | G4 - - - - - - - | . . . . . . . . | ' +
            /* C */ 'D5 - - - G4 - - - | B4 - - - G4 - - - | D5 - - - - - - - | . . . . . . . .' },
        { wave: 'p12', vol: 0.04, n:
            /* A */ 'G3 . D4 . B3 . D4 . | G3 . D4 . B3 . D4 . | G3 . D4 . B3 . D4 . | G3 . . . . . . . | ' +
            /* B */ 'C4 . G4 . B3 . G4 . | A3 . E4 . G3 . D4 . | F#3 . D4 . A3 . D4 . | F#3 . A3 . C4 . A3 . | ' +
            /* A' */ 'G3 . D4 . B3 . D4 . | G3 . D4 . F#3 . D4 . | G3 . D4 . B3 . D4 . | G3 . . . . . . . | ' +
            /* C */ 'B3 . D4 . G3 . D4 . | E3 . B3 . G3 . B3 . | F#3 . A3 . D4 . A3 . | F#3 . A3 . C4 . A3 .' },
    ],
};

/* a Knot tied (C major): A as it was (up C E G to A, and down home); B its answer over A minor, F and G, the
   same falling steps a tone higher (G F E D) coming home to C; C the climb again, higher, over F, G and E minor to A
   minor; D coming down by D minor and A minor to rest on G, the half close the motif sets out from */
SONGS.knot = {
    bpm: 80, div: 2,
    ch: [
        { wave: 'triangle', vol: 0.2, vib: true, n:
            /* A */ 'C5 - E5 - G5 - - - | A5 - G5 - E5 - - - | F5 - E5 - D5 - C5 - | C5 - - - - - - - | ' +
            /* B */ 'E5 - - - C5 - E5 - | F5 - - - A5 - - - | G5 - F5 - E5 - D5 - | C5 - - - - - . . | ' +
            /* C */ 'A4 - C5 - F5 - - - | G5 - F5 - D5 - - - | E5 - G5 - B5 - A5 G5 | A5 - - - - - . . | ' +
            /* D */ 'F5 - - - E5 - D5 - | E5 - - - C5 - A4 - | D5 - E5 - F5 - D5 - | G5 - - - - - . .' },
        { wave: 'p12', vol: 0.05, n:
            /* A */ 'C4 G4 E4 G4 C4 G4 E4 G4 | F4 A4 C5 A4 C4 G4 E4 G4 | F4 A4 D4 G4 B4 G4 D4 G4 | C4 G4 E4 G4 C5 - - - | ' +
            /* B */ 'A3 E4 C4 E4 A3 E4 C4 E4 | F4 A4 C5 A4 F4 A4 C5 A4 | D4 G4 B4 G4 D4 G4 B4 G4 | C4 G4 E4 G4 C5 - - . | ' +
            /* C */ 'F3 C4 A3 C4 F3 C4 A3 C4 | G3 D4 B3 D4 G3 D4 B3 D4 | E3 B3 G3 B3 E3 B3 G3 B3 | A3 E4 C4 E4 A3 E4 C4 E4 | ' +
            /* D */ 'D4 A4 F4 A4 D4 A4 F4 A4 | A3 E4 C4 E4 A3 E4 C4 E4 | F4 A4 D4 A4 B3 D4 F4 D4 | G3 D4 B3 D4 G3 B3 D4 F4' },
    ],
};

/* Hushwood: a slow lullaby of a waltz (D dorian), half asleep itself. A as it was; B a warmer strain on the
   F major side (F C Dm Am, Bb F Gm A), then climbing to its height and coming home to D; C a breakdown on the
   falling bass D C Bb A, the tune resting, then waking slowly (A, C, D, E) into A again */
SONGS.hush = {
    bpm: 80, div: 2,
    ch: [
        { wave: 'triangle', vol: 0.17, vib: true, n:
            /* A */ 'D5 - - - F5 E5 | D5 - - - A4 - | C5 - - - E5 D5 | C5 - - - G4 - | Bb4 - - - D5 C5 | A4 - F4 - G4 - | A4 - - - - - | . . . . . . | D5 - - - F5 E5 | D5 - A4 - C5 - | Bb4 - - - A4 G4 | F4 - G4 - A4 - | Bb4 - A4 - G4 - | E4 - F4 - E4 - | D4 - - - - - | . . . . . . | ' +
            /* B */ 'A4 - - - C5 - | E5 - - - D5 C5 | D5 - - - - - | C5 - - - A4 - | Bb4 - - - D5 - | C5 - - - A4 - | Bb4 - A4 - G4 - | A4 - - - - - | D5 - - - F5 - | E5 - - - G5 - | F5 - - - E5 D5 | C#5 - - - - - | D5 - - - C5 Bb4 | A4 - - - C5 - | E5 - - - C#5 - | D5 - - - - - | ' +
            /* C */ '. . . . . . | . . . . . . | . . . . . . | . . . . . . | A4 - - - - - | C5 - - - - - | D5 - - - - - | E5 - - - C#5 -' },
        { wave: 'triangle', vol: 0.18, n:
            /* A */ 'D3 - - A3 - - | D3 - - A3 - - | C3 - - G3 - - | C3 - - G3 - - | Bb2 - - F3 - - | F2 - - C3 - - | A2 - - E3 - - | A2 - - - - - | D3 - - A3 - - | F2 - - C3 - - | G2 - - D3 - - | D3 - - A3 - - | G2 - - D3 - - | A2 - - E3 - - | D3 - - A3 - - | D3 - - - - - | ' +
            /* B */ 'F2 - - C3 - - | C3 - - G3 - - | D3 - - A3 - - | A2 - - E3 - - | Bb2 - - F3 - - | F2 - - C3 - - | G2 - - D3 - - | A2 - - E3 - - | Bb2 - - F3 - - | C3 - - G3 - - | D3 - - A3 - - | A2 - - E3 - - | Bb2 - - F3 - - | F2 - - C3 - - | A2 - - E3 - - | D3 - - A3 - - | ' +
            /* C */ 'D3 - - A3 - - | C3 - - G3 - - | Bb2 - - F3 - - | A2 - - E3 - - | D3 - - A3 - - | C3 - - G3 - - | Bb2 - - F3 - - | A2 - - E3 - -' },
        { wave: 'p12', vol: 0.035, n:
            /* A */ '. F4 A4 . F4 A4 | . F4 A4 . F4 A4 | . E4 G4 . E4 G4 | . E4 G4 . E4 G4 | . D4 F4 . D4 F4 | . C4 F4 . C4 F4 | . C#4 E4 . C#4 E4 | . C#4 E4 . . . | . F4 A4 . F4 A4 | . C4 F4 . C4 F4 | . D4 G4 . D4 G4 | . F4 A4 . F4 A4 | . D4 G4 . D4 G4 | . C#4 E4 . C#4 E4 | . F4 A4 . F4 A4 | . . . . . . | ' +
            /* B */ '. C4 F4 . C4 F4 | . E4 G4 . E4 G4 | . F4 A4 . F4 A4 | . C4 E4 . C4 E4 | . D4 F4 . D4 F4 | . C4 F4 . C4 F4 | . D4 G4 . D4 G4 | . C#4 E4 . C#4 E4 | . D4 F4 . D4 F4 | . E4 G4 . E4 G4 | . F4 A4 . D4 A4 | . C#4 E4 . C#4 E4 | . D4 F4 . D4 F4 | . C4 F4 . C4 F4 | . C#4 E4 . C#4 E4 | . F4 A4 . F4 A4 | ' +
            /* C */ '. F4 A4 . F4 A4 | . E4 G4 . E4 G4 | . D4 F4 . D4 F4 | . C#4 E4 . C#4 E4 | . F4 A4 . F4 A4 | . E4 G4 . E4 G4 | . D4 F4 . D4 F4 | . C#4 E4 . C#4 E4' },
    ],
};

/* the Slumberhouse: a music box winding down (F major), the hush of a clock that isn't there. A as it was; B a
   cradle tune rocking between two notes (Bb F Gm Am, Dm Bb C7 F), then falling in thirds and home to F; C the box
   running down, one note a bar, then stopping (only the clock), and wound up again into A */
SONGS.slumber = {
    bpm: 92, div: 2,
    ch: [
        { wave: 'p12', vol: 0.075, n:
            /* A */ 'C6 . A5 . F5 . | G5 . A5 . C6 . | Bb5 . G5 . E5 . | F5 . G5 . A5 . | D6 . Bb5 . G5 . | A5 . Bb5 . C6 . | A5 . F5 . G5 . | F5 . . . . . | C6 . A5 . F5 . | G5 . A5 . Bb5 . | A5 . F5 . D5 . | E5 . F5 . G5 . | Bb5 . A5 . G5 . | F5 . E5 . D5 . | C5 . E5 . G5 . | F5 . . . . . | ' +
            /* B */ 'D6 . Bb5 . D6 . | C6 . A5 . C6 . | Bb5 . G5 . Bb5 . | A5 . E5 . A5 . | A5 . F5 . D6 . | D6 . Bb5 . F5 . | E5 . G5 . Bb5 . | A5 . . . . . | C6 . . . A5 . | G5 . . . E5 . | F5 . . . D5 . | D5 . F5 . Bb5 . | D6 . . . Bb5 . | C6 . . . G5 . | Bb5 . G5 . E5 . | F5 . . . . . | ' +
            /* C */ 'C6 . . . . . | G5 . . . . . | Bb5 . . . . . | F5 . . . . . | . . . . . . | . . . . . . | C5 D5 E5 F5 G5 A5 | Bb5 . G5 . E5 .' },
        { wave: 'triangle', vol: 0.16, legato: 0.8, n:
            /* A */ 'F3 - - C4 - - | C3 - - G3 - - | C3 - - E3 - - | F3 - - C4 - - | Bb2 - - F3 - - | F2 - - C3 - - | C3 - - E3 - - | F3 - - - - - | F3 - - C4 - - | E3 - - C4 - - | D3 - - A3 - - | C3 - - G3 - - | G2 - - D3 - - | A2 - - D3 - - | C3 - - G3 - - | F2 - - - - - | ' +
            /* B */ 'Bb2 - - F3 - - | F2 - - C3 - - | G2 - - D3 - - | A2 - - E3 - - | D3 - - A3 - - | Bb2 - - F3 - - | C3 - - E3 - - | F2 - - C3 - - | F3 - - C4 - - | C3 - - G3 - - | D3 - - A3 - - | Bb2 - - F3 - - | G2 - - D3 - - | C3 - - G3 - - | C3 - - E3 - - | F2 - - C3 - - | ' +
            /* C */ 'F3 - - C4 - - | C3 - - G3 - - | C3 - - E3 - - | F3 - - C4 - - | Bb2 - - F3 - - | F2 - - C3 - - | C3 - - G3 - - | C3 - - E3 - -' },
        { drum: true, vol: 0.03, n: 'h . . . h . | h . . . h .' },
    ],
};

/* Larkspur Fair: a calliope waltz with nobody to dance to it (A minor, a little off). A as it was; B a brighter
   strain in C major, then a chain of thirds down A minor, D minor, G, C; C the oom-pah going round on its own for a
   while (nobody on the floor), then the tune coming back a little off (D sharp, G sharp) and turning on E into A */
SONGS.fair = {
    bpm: 132, div: 1,
    ch: [
        { wave: 'p25', vol: 0.08, vib: true, n:
            /* A */ 'E5 - - | C5 D5 E5 | A5 - - | G5 - - | F5 - E5 | D5 - C5 | B4 - - | E5 - - | E5 - - | C5 D5 E5 | A5 - - | C6 - - | B5 - A5 | G#5 - B5 | A5 - - | . . . | ' +
            /* B */ 'E5 - G5 | C6 - - | B5 - A5 | G5 - - | A5 - F5 | E5 - G5 | D5 - F5 | E5 - - | C6 - - | A5 - E5 | F5 - - | D5 - A5 | B5 - - | A5 G5 F5 | E5 - - | C5 . . | ' +
            /* C */ '. . . | . . . | . . . | . . . | . . . | . . . | . . . | . . . | E5 - - | C5 D#5 E5 | A5 - - | G#5 - - | F5 - E5 | D5 - C5 | B4 - - | G#4 - B4' },
        { wave: 'triangle', vol: 0.18, n:
            /* A */ 'A2 E3 E3 | A2 E3 E3 | F2 C3 C3 | C3 G3 G3 | D3 A3 A3 | A2 E3 E3 | E2 B2 B2 | E2 G#2 B2 | A2 E3 E3 | A2 E3 E3 | F2 C3 C3 | A2 E3 E3 | D3 A3 A3 | E2 B2 B2 | A2 E3 A3 | A2 . . | ' +
            /* B */ 'C3 G3 G3 | C3 G3 G3 | G2 D3 D3 | G2 D3 D3 | F2 C3 C3 | C3 G3 G3 | G2 D3 D3 | C3 G3 G3 | A2 E3 E3 | A2 E3 E3 | D3 A3 A3 | D3 A3 A3 | G2 D3 D3 | G2 B2 D3 | C3 G3 G3 | C3 G3 G3 | ' +
            /* C */ 'A2 E3 E3 | A2 E3 E3 | F2 C3 C3 | F2 C3 C3 | D3 A3 A3 | D3 A3 A3 | E2 B2 B2 | E2 G#2 B2 | A2 E3 E3 | A2 E3 E3 | F2 C3 C3 | E2 B2 B2 | D3 A3 A3 | A2 E3 E3 | E2 B2 B2 | E2 G#2 B2' },
        { wave: 'p12', vol: 0.04, n:
            /* A */ '. C4 E4 | . C4 E4 | . A3 C4 | . C4 E4 | . D4 F4 | . C4 E4 | . G#3 D4 | . G#3 B3 | . C4 E4 | . C4 E4 | . A3 C4 | . C4 E4 | . D4 F4 | . G#3 D4 | . C4 E4 | . . . | ' +
            /* B */ '. E4 G4 | . E4 G4 | . B3 D4 | . B3 D4 | . A3 C4 | . E4 G4 | . B3 F4 | . E4 G4 | . C4 E4 | . C4 E4 | . D4 F4 | . D4 F4 | . B3 D4 | . B3 F4 | . E4 G4 | . E4 G4 | ' +
            /* C */ '. C4 E4 | . C4 E4 | . A3 C4 | . A3 C4 | . D4 F4 | . D4 F4 | . G#3 D4 | . G#3 B3 | . C4 E4 | . C4 E4 | . A3 C4 | . G#3 D4 | . D4 F4 | . C4 E4 | . G#3 D4 | . G#3 B3' },
        { drum: true, vol: 0.05, n: 'k . h | s . h' },
    ],
};

/* the Marionette Hall: a music-hall overture on a toy piano (G major, then the minor for the dark wings). A as
   it was; B a music-hall trio in C major, singing in held notes over C F G7, A minor D minor; C a dark wing in
   E minor (Em B7 Em Am, C D7 Am D7), turning on D7 back into the overture */
SONGS.marionette = {
    bpm: 112, div: 2,
    ch: [
        { wave: 'p12', vol: 0.08, n:
            /* A */ 'G5 . B5 . D6 . B5 . | C6 . A5 . F#5 . A5 . | G5 . D5 . B4 . D5 . | E5 - - . D5 - - . | G5 . B5 . D6 . B5 . | E6 . C6 . A5 . C6 . | B5 . G5 . A5 . F#5 . | G5 - - - . . . . | Bb5 . G5 . D5 . G5 . | A5 . F5 . C5 . F5 . | G5 . Eb5 . Bb4 . Eb5 . | D5 - - . . . . . | B5 . G5 . D5 . G5 . | C6 . A5 . F#5 . A5 . | B5 . A5 . G5 . F#5 . | G5 - - - . . . . | ' +
            /* B */ 'E5 - - . G5 . E5 . | F5 - - . A5 . F5 . | D5 - - . G5 . F5 . | E5 - - . C5 - - . | A5 - - . C6 . A5 . | F5 - - . A5 . D6 . | B5 . A5 . G5 . F5 . | E5 - - - . . . . | ' +
            /* C */ 'G5 . B5 . E6 . B5 . | B5 . F#5 . D#5 . F#5 . | E5 . G5 . B5 . G5 . | C6 - - . A5 - - . | E6 . C6 . G5 . C6 . | D6 . C6 . A5 . F#5 . | E5 . A5 . C6 . A5 . | F#5 - - . A5 . C6 .' },
        { wave: 'triangle', vol: 0.18, n:
            /* A */ 'G2 . D3 . G2 . D3 . | D2 . A2 . D2 . A2 . | G2 . D3 . G2 . D3 . | C3 . G2 . D3 . A2 . | G2 . D3 . G2 . D3 . | C3 . G3 . C3 . G3 . | D3 . A2 . D3 . A2 . | G2 . D3 . G2 . . . | G2 . D3 . G2 . D3 . | F2 . C3 . F2 . C3 . | Eb2 . Bb2 . Eb2 . Bb2 . | D2 . A2 . D2 . . . | G2 . D3 . G2 . D3 . | D2 . A2 . D2 . A2 . | D3 . C3 . B2 . A2 . | G2 . D3 . G2 . . . | ' +
            /* B */ 'C3 . G2 . C3 . G2 . | F2 . C3 . F2 . C3 . | G2 . D3 . G2 . D3 . | C3 . G2 . C3 . G2 . | A2 . E3 . A2 . E3 . | D3 . A2 . D3 . A2 . | G2 . D3 . G2 . B2 . | C3 . G2 . C3 . . . | ' +
            /* C */ 'E2 . B2 . E2 . B2 . | B2 . F#2 . B2 . F#2 . | E2 . B2 . E2 . B2 . | A2 . E3 . A2 . E3 . | C3 . G2 . C3 . G2 . | D3 . A2 . D3 . A2 . | A2 . E3 . A2 . E3 . | D2 . A2 . D3 . F#2 .' },
        { drum: true, vol: 0.05, n: 'k . h . s . h . | k . h . s . h h' },
    ],
};

/* the Underside: a warm workshop under the floorboards, everything ticking (A minor, unhurried). A as it was;
   B a warmer strain in C major (C G Am Em, F C Dm E); A2 the tune mirrored (down, then up) over its own chords; C a
   breakdown on F C Dm E, the tune resting while the bench ticks, then a tick-tock figure that leads into A */
SONGS.underside = {
    bpm: 96, div: 2,
    ch: [
        { wave: 'p25', vol: 0.06, n:
            /* A */ 'A4 . C5 . E5 . D5 . | C5 . B4 . A4 . . . | G4 . B4 . D5 . C5 . | B4 . A4 . G4 . . . | F4 . A4 . C5 . B4 . | A4 . G4 . F4 . E4 . | E4 . G#4 . B4 . D5 . | C5 . B4 . A4 . . . | ' +
            /* B */ 'E5 . D5 . C5 . G4 . | B4 . C5 . D5 . . . | C5 . B4 . A4 . E5 . | G4 . A4 . B4 . . . | A4 . G4 . F4 . A4 . | G4 . E4 . C5 . . . | F4 . A4 . D5 . F5 . | E5 . D5 . B4 . G#4 . | ' +
            /* A2 */ 'E5 . C5 . A4 . B4 . | C5 . D5 . E5 . . . | D5 . B4 . G4 . A4 . | B4 . C5 . D5 . . . | C5 . A4 . F4 . G4 . | A4 . C5 . F5 . E5 . | E5 . B4 . G#4 . B4 . | A4 . . . . . . . | ' +
            /* C */ '. . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | F4 . C5 . F4 . C5 . | G4 . C5 . G4 . C5 . | A4 . D5 . A4 . D5 . | G#4 . B4 . G#4 . B4 .' },
        { wave: 'triangle', vol: 0.17, n:
            /* A */ 'A2 . . . E3 . . . | A2 . . . E3 . . . | G2 . . . D3 . . . | G2 . . . D3 . . . | F2 . . . C3 . . . | F2 . . . C3 . . . | E2 . . . B2 . . . | A2 . . . E3 . . . | ' +
            /* B */ 'C3 . . . G2 . . . | G2 . . . D3 . . . | A2 . . . E3 . . . | E2 . . . B2 . . . | F2 . . . C3 . . . | C3 . . . G2 . . . | D3 . . . A2 . . . | E2 . . . B2 . . . | ' +
            /* A2 */ 'A2 . . . E3 . . . | A2 . . . E3 . . . | G2 . . . D3 . . . | G2 . . . D3 . . . | F2 . . . C3 . . . | F2 . . . C3 . . . | E2 . . . B2 . . . | A2 . . . E3 . . . | ' +
            /* C */ 'F2 . . . C3 . . . | C3 . . . G2 . . . | D3 . . . A2 . . . | E2 . . . B2 . . . | F2 . . . C3 . . . | C3 . . . G2 . . . | D3 . . . A2 . . . | E2 . . . B2 . . .' },
        { drum: true, vol: 0.03, n: 'h . h . h . h .' },
    ],
};

/* the Spoolworks: spindles and shuttles, a machine that never stops (E minor, driving). A as it was; A' its
   answer (G D Em C, Am C B7 Em), closing on E this time; B the machine changing gear, long notes over C D Bm Em,
   C D B7; C a breakdown (the bass and a bare beat, the tune resting), then the riff climbing back into A */
SONGS.spoolworks = {
    bpm: 120, div: 2,
    ch: [
        { wave: 'p12', vol: 0.07, n:
            /* A */ 'E5 . . G5 . . F#5 . | E5 . D5 . B4 . . . | C5 . . E5 . . D5 . | C5 . B4 . A4 . . . | E5 . . G5 . . B5 . | A5 . G5 . F#5 . E5 . | D5 . F#5 . A5 . F#5 . | E5 - - - . . . . | ' +
            /* A' */ 'D5 . . G5 . . B5 . | A5 . F#5 . D5 . . . | B5 . . G5 . . E5 . | G5 . E5 . C5 . . . | C5 . . E5 . . A5 . | G5 . E5 . C5 . E5 . | D#5 . F#5 . A5 . F#5 . | E5 - - - . . . . | ' +
            /* B */ 'E5 - - - G5 - - - | F#5 - - - A5 - - - | D5 - - - F#5 - - - | G5 - - - B5 - - - | C6 - - - B5 . A5 . | A5 - - - F#5 . D5 . | D#5 . F#5 . A5 . B5 . | A5 - - - F#5 . D#5 . | ' +
            /* C */ '. . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | B4 . . E5 . . G5 . | C5 . . E5 . . A5 . | D5 . . F#5 . . A5 . | B5 - - - A5 . F#5 .' },
        { wave: 'triangle', vol: 0.17, n:
            /* A */ 'E2 E3 B2 E3 E2 E3 B2 E3 | E2 E3 B2 E3 E2 E3 B2 E3 | C3 C4 G3 C4 C3 C4 G3 C4 | A2 A3 E3 A3 A2 A3 E3 A3 | E2 E3 B2 E3 E2 E3 B2 E3 | C3 C4 G3 C4 C3 C4 G3 C4 | D3 D4 A3 D4 D3 D4 A3 D4 | B2 B3 F#3 B3 B2 B3 F#3 B3 | ' +
            /* A' */ 'G2 G3 D3 G3 G2 G3 D3 G3 | D3 D4 A3 D4 D3 D4 A3 D4 | E2 E3 B2 E3 E2 E3 B2 E3 | C3 C4 G3 C4 C3 C4 G3 C4 | A2 A3 E3 A3 A2 A3 E3 A3 | C3 C4 G3 C4 C3 C4 G3 C4 | B2 B3 F#3 B3 B2 B3 F#3 B3 | E2 E3 B2 E3 E2 E3 B2 E3 | ' +
            /* B */ 'C3 C4 G3 C4 C3 C4 G3 C4 | D3 D4 A3 D4 D3 D4 A3 D4 | B2 B3 F#3 B3 B2 B3 F#3 B3 | E2 E3 B2 E3 E2 E3 B2 E3 | C3 C4 G3 C4 C3 C4 G3 C4 | D3 D4 A3 D4 D3 D4 A3 D4 | B2 B3 F#3 B3 B2 B3 F#3 B3 | B2 B3 F#3 B3 B2 B3 F#3 B3 | ' +
            /* C */ 'E2 E3 B2 E3 E2 E3 B2 E3 | E2 E3 B2 E3 E2 E3 B2 E3 | C3 C4 G3 C4 C3 C4 G3 C4 | D3 D4 A3 D4 D3 D4 A3 D4 | E2 E3 B2 E3 E2 E3 B2 E3 | C3 C4 G3 C4 C3 C4 G3 C4 | D3 D4 A3 D4 D3 D4 A3 D4 | B2 B3 F#3 B3 B2 B3 F#3 B3' },
        { drum: true, vol: 0.06, n:
            /* A */ 'k . h . s . h . | k . h k s . h h | k . h . s . h . | k . h k s . h h | k . h . s . h . | k . h k s . h h | k . h . s . h . | k . h k s . h h | ' +
            /* A' */ 'k . h . s . h . | k . h k s . h h | k . h . s . h . | k . h k s . h h | k . h . s . h . | k . h k s . h h | k . h . s . h . | k . h k s . s s | ' +
            /* B */ 'k . h . s . h . | k . h k s . h h | k . h . s . h . | k . h k s . h h | k . h . s . h . | k . h k s . h h | k . h . s . h . | k . h k s . s s | ' +
            /* C */ 'k . . . h . . . | k . . . h . . . | k . . . h . . . | k . h . h . h h | k . h . s . h . | k . h k s . h h | k . h . s . h . | k . h k s . s s' },
    ],
};

/* the Loomwood: thin, high, old: a shuttle going to and fro (D minor, sparse, a little cold). A as it was; B
   the F major side, falling thirds (F C Dm) and a cadence in F; B2 the tune's own shape over Bb F Gm Dm, turning on
   A7; C a breakdown, only the shuttle going to and fro over D C Bb A, then the tune climbing back up into A */
SONGS.loomwood = {
    bpm: 84, div: 2,
    ch: [
        { wave: 'triangle', vol: 0.12, vib: true, n:
            /* A */ 'A5 - - - . . F5 - | E5 - - - . . D5 - | C5 - - - E5 - D5 - | A4 - - - - - . . | A5 - - - . . C6 - | Bb5 - - - A5 - G5 - | F5 - E5 - D5 - C#5 - | D5 - - - - - . . | ' +
            /* B */ 'C6 - - - . . A5 - | G5 - - - . . E5 - | F5 - - - . . D5 - | D5 - - - F5 - A5 - | Bb5 - - - . . G5 - | C6 - - - Bb5 - G5 - | A5 - - - G5 - F5 - | F5 - - - - - . . | ' +
            /* B2 */ 'F5 - - - . . D5 - | C5 - - - . . A4 - | Bb4 - - - D5 - G5 - | F5 - - - - - . . | D5 - - - . . F5 - | G5 - - - . . Bb5 - | A5 - - - G5 - E5 - | C#5 - - - - - . . | ' +
            /* C */ '. . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | A4 - - - . . D5 - | E5 - - - . . G5 - | F5 - - - . . Bb5 - | C#5 - - - E5 - G5 -' },
        { wave: 'p12', vol: 0.03, n:
            /* A */ 'D4 F4 A4 D5 A4 F4 D4 F4 | C4 E4 A4 C5 A4 E4 C4 E4 | Bb3 D4 F4 Bb4 F4 D4 Bb3 D4 | A3 C#4 E4 A4 E4 C#4 A3 C#4 | D4 F4 A4 D5 A4 F4 D4 F4 | G3 Bb3 D4 G4 D4 Bb3 G3 Bb3 | A3 C#4 E4 A4 E4 C#4 A3 C#4 | D4 F4 A4 D5 A4 F4 D4 . | ' +
            /* B */ 'C4 F4 A4 C5 A4 F4 C4 F4 | C4 E4 G4 C5 G4 E4 C4 E4 | D4 F4 A4 D5 A4 F4 D4 F4 | Bb3 D4 F4 Bb4 F4 D4 Bb3 D4 | G3 Bb3 D4 G4 D4 Bb3 G3 Bb3 | C4 E4 G4 Bb4 G4 E4 C4 E4 | C4 F4 A4 C5 A4 F4 C4 F4 | C4 F4 A4 C5 A4 F4 C4 F4 | ' +
            /* B2 */ 'Bb3 D4 F4 Bb4 F4 D4 Bb3 D4 | A3 C4 F4 A4 F4 C4 A3 C4 | G3 Bb3 D4 G4 D4 Bb3 G3 Bb3 | D4 F4 A4 D5 A4 F4 D4 F4 | Bb3 D4 F4 Bb4 F4 D4 Bb3 D4 | G3 Bb3 D4 G4 D4 Bb3 G3 Bb3 | A3 C#4 E4 G4 E4 C#4 A3 C#4 | A3 C#4 E4 A4 E4 C#4 A3 C#4 | ' +
            /* C */ 'D4 F4 A4 D5 A4 F4 D4 F4 | C4 E4 G4 C5 G4 E4 C4 E4 | Bb3 D4 F4 Bb4 F4 D4 Bb3 D4 | A3 C#4 E4 A4 E4 C#4 A3 C#4 | D4 F4 A4 D5 A4 F4 D4 F4 | C4 E4 G4 C5 G4 E4 C4 E4 | Bb3 D4 F4 Bb4 F4 D4 Bb3 D4 | A3 C#4 E4 G4 E4 C#4 A3 C#4' },
        { wave: 'triangle', vol: 0.15, n:
            /* A */ 'D3 - - - - - - - | A2 - - - - - - - | Bb2 - - - - - - - | A2 - - - - - - - | D3 - - - - - - - | G2 - - - - - - - | A2 - - - - - - - | D3 - - - - - - - | ' +
            /* B */ 'F2 - - - - - - - | C3 - - - - - - - | D3 - - - - - - - | Bb2 - - - - - - - | G2 - - - - - - - | C3 - - - - - - - | F2 - - - - - - - | F2 - - - - - - - | ' +
            /* B2 */ 'Bb2 - - - - - - - | A2 - - - - - - - | G2 - - - - - - - | D3 - - - - - - - | Bb2 - - - - - - - | G2 - - - - - - - | A2 - - - - - - - | A2 - - - - - - - | ' +
            /* C */ 'D3 - - - - - - - | C3 - - - - - - - | Bb2 - - - - - - - | A2 - - - - - - - | D3 - - - - - - - | C3 - - - - - - - | Bb2 - - - - - - - | A2 - - - - - - -' },
    ],
};

/* the Loom: the First Spinner's, a great slow machine nobody has run in an age (D phrygian, very still). A as it
   was; B long notes falling in thirds over Bb Cm Gm D, then rising over Eb and C minor to the old close (E flat to
   D, B flat to A); C stiller still: the opening's D, E flat, D slowed to whole notes over the drone, then a few long
   notes home to A */
SONGS.loom = {
    bpm: 70, div: 2,
    ch: [
        { wave: 'triangle', vol: 0.13, n:
            /* A */ 'D5 - - - Eb5 - - - | D5 - - - C5 - - - | Bb4 - - - C5 - D5 - | A4 - - - - - - - | D5 - - - F5 - - - | Eb5 - - - D5 - - - | C5 - Bb4 - A4 - G4 - | A4 - - - - - - - | ' +
            /* B */ 'F5 - - - - - D5 - | Eb5 - - - - - C5 - | D5 - - - - - Bb4 - | A4 - - - - - - - | G4 - - - - - Bb4 - | C5 - - - - - Eb5 - | Bb4 - - - - - - - | A4 - - - - - - - | ' +
            /* C */ 'D5 - - - - - - - | . . . . . . . . | Eb5 - - - - - - - | D5 - - - - - - - | Bb4 - - - - - - - | C5 - - - - - - - | Bb4 - - - G4 - - - | A4 - - - - - - -' },
        { wave: 'p25', vol: 0.03, n:
            /* A */ 'D3 . A3 . D3 . A3 . | D3 . A3 . D3 . A3 . | Eb3 . Bb3 . Eb3 . Bb3 . | D3 . A3 . D3 . A3 . | D3 . A3 . D3 . A3 . | G2 . D3 . G2 . D3 . | Eb3 . Bb3 . Eb3 . Bb3 . | D3 . A3 . D3 . . . | ' +
            /* B */ 'Bb2 . F3 . Bb2 . F3 . | C3 . G3 . C3 . G3 . | G2 . D3 . G2 . D3 . | D3 . A3 . D3 . A3 . | Eb3 . Bb3 . Eb3 . Bb3 . | C3 . G3 . C3 . G3 . | Eb3 . Bb3 . Eb3 . Bb3 . | D3 . A3 . D3 . A3 . | ' +
            /* C */ 'D3 . A3 . D3 . A3 . | D3 . A3 . D3 . A3 . | Eb3 . Bb3 . Eb3 . Bb3 . | D3 . A3 . D3 . A3 . | G2 . D3 . G2 . D3 . | C3 . G3 . C3 . G3 . | Eb3 . Bb3 . Eb3 . Bb3 . | D3 . A3 . D3 . . .' },
        { drum: true, vol: 0.025, n: 'k . . . h . . . | . . h . . . h .' },
    ],
};

/* the Drift: open air, nothing tied down (G major, wide, unhurried; the lullaby's tune, freed). A as it was;
   B a wider strain (C G/B Am Em, then F, the flat seventh, C D); A' Gran's lullaby itself, low, high, in between,
   high, and then up instead of back down, ending on the high G; C a breakdown (only the arpeggio and the bass going
   round G C Em D) and a lead-in over C G Am D7 into A */
SONGS.drift = {
    bpm: 88, div: 2,
    ch: [
        { wave: 'triangle', vol: 0.14, vib: true, n:
            /* A */ 'D5 - - - B4 - D5 - | G5 - - - - - . . | E5 - - - C5 - E5 - | D5 - - - - - . . | B4 - - - G4 - B4 - | A4 - - - D5 - - - | G4 - - - - - - - | . . . . . . . . | ' +
            /* B */ 'E5 - - - G5 - - - | D5 - - - B4 - - - | C5 - - - E5 - A5 - | G5 - - - - - . . | A5 - - - F5 - C5 - | E5 - - - G5 - - - | A5 - - - F#5 - - - | D5 - - - - - . . | ' +
            /* A' */ 'G4 - - - D5 - - - | B4 - - - D5 - - - | G5 - - - - - E5 - | D5 - - - - - . . | G5 - - - E5 - B4 - | C5 - - - E5 - G5 - | A5 - - - F#5 - D5 - | G5 - - - - - - - | ' +
            /* C */ '. . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | G4 - - - C5 - E5 - | D5 - - - - - B4 - | C5 - - - A4 - C5 - | F#4 - - - A4 - C5 -' },
        { wave: 'p12', vol: 0.035, n:
            /* A */ 'G3 B3 D4 B3 G3 B3 D4 B3 | G3 B3 D4 B3 G3 B3 D4 B3 | C4 E4 G4 E4 C4 E4 G4 E4 | G3 B3 D4 B3 G3 B3 D4 B3 | E3 G3 B3 G3 E3 G3 B3 G3 | D3 F#3 A3 F#3 D3 F#3 A3 F#3 | G3 B3 D4 B3 G3 B3 D4 B3 | G3 . . . . . . . | ' +
            /* B */ 'C4 E4 G4 E4 C4 E4 G4 E4 | B3 D4 G4 D4 B3 D4 G4 D4 | A3 C4 E4 C4 A3 C4 E4 C4 | E3 G3 B3 G3 E3 G3 B3 G3 | F3 A3 C4 A3 F3 A3 C4 A3 | C4 E4 G4 E4 C4 E4 G4 E4 | D3 F#3 A3 F#3 D3 F#3 A3 F#3 | D3 F#3 A3 F#3 D3 F#3 A3 C4 | ' +
            /* A' */ 'G3 B3 D4 B3 G3 B3 D4 B3 | G3 B3 D4 B3 G3 B3 D4 B3 | C4 E4 G4 E4 C4 E4 G4 E4 | G3 B3 D4 B3 G3 B3 D4 B3 | E3 G3 B3 G3 E3 G3 B3 G3 | C4 E4 G4 E4 C4 E4 G4 E4 | D3 F#3 A3 F#3 D3 F#3 A3 F#3 | G3 B3 D4 B3 G3 B3 D4 B3 | ' +
            /* C */ 'G3 B3 D4 B3 G3 B3 D4 B3 | C4 E4 G4 E4 C4 E4 G4 E4 | E3 G3 B3 G3 E3 G3 B3 G3 | D3 F#3 A3 F#3 D3 F#3 A3 F#3 | C4 E4 G4 E4 C4 E4 G4 E4 | G3 B3 D4 B3 G3 B3 D4 B3 | A3 C4 E4 C4 A3 C4 E4 C4 | D3 F#3 A3 C4 A3 F#3 D3 F#3' },
        { wave: 'triangle', vol: 0.15, n:
            /* A */ 'G2 - - - - - - - | G2 - - - - - - - | C3 - - - - - - - | G2 - - - - - - - | E2 - - - - - - - | D2 - - - - - - - | G2 - - - - - - - | G2 - - - - - - - | ' +
            /* B */ 'C3 - - - - - - - | B2 - - - - - - - | A2 - - - - - - - | E2 - - - - - - - | F2 - - - - - - - | C3 - - - - - - - | D2 - - - - - - - | D2 - - - - - - - | ' +
            /* A' */ 'G2 - - - - - - - | G2 - - - - - - - | C3 - - - - - - - | G2 - - - - - - - | E2 - - - - - - - | C3 - - - - - - - | D2 - - - - - - - | G2 - - - - - - - | ' +
            /* C */ 'G2 - - - - - - - | C3 - - - - - - - | E2 - - - - - - - | D2 - - - - - - - | C3 - - - - - - - | G2 - - - - - - - | A2 - - - - - - - | D2 - - - - - - -' },
    ],
};

/* the Great Pull: everything wound in at once (C minor, relentless). A as it was; D the motif dragged round the
   relative major's chords (A flat, B flat, E flat, C minor) and up to the top, then home by F minor and G as A goes
   home; B darker still: F minor, G, C minor, A flat, then F minor and the Neapolitan D flat, held on G; C two bars of
   nothing but the bass and the drums, then the motif climbing (Ab Bb Cm Fm) to G7 and back into A */
SONGS.pull = {
    bpm: 132, div: 2,
    ch: [
        { wave: 'p25', vol: 0.07, n:
            /* A */ 'C5 . Eb5 . G5 . C6 . | B5 . G5 . D5 . B4 . | C5 . Eb5 . Ab5 . C6 . | Bb5 . G5 . Eb5 . D5 . | C5 . Eb5 . G5 . C6 . | D6 . B5 . G5 . F5 . | Eb5 . D5 . C5 . B4 . | C5 - - - . . . . | ' +
            /* D */ 'Ab5 . Eb5 . C5 . Eb5 . | Bb5 . F5 . D5 . F5 . | G5 . Eb5 . Bb4 . Eb5 . | C6 . G5 . Eb5 . G5 . | Ab5 . C6 . Eb6 . C6 . | Ab5 . F5 . C5 . F5 . | Eb5 . D5 . C5 . B4 . | C5 - - - . . . . | ' +
            /* B */ 'C6 . Ab5 . F5 . Ab5 . | B5 . G5 . D5 . G5 . | C6 . G5 . Eb5 . G5 . | Ab5 . Eb5 . C5 . Eb5 . | F5 . Ab5 . C6 . Ab5 . | F5 . Ab5 . Db6 . Ab5 . | D6 . B5 . G5 . D5 . | B4 - - - . . . . | ' +
            /* C */ '. . . . . . . . | . . . . . . . . | C5 . Eb5 . Ab5 . C6 . | D5 . F5 . Bb5 . D6 . | Eb5 . G5 . C6 . G5 . | F5 . Ab5 . C6 . Ab5 . | B5 . G5 . D6 . B5 . | G5 . F5 . D5 . B4 .' },
        { wave: 'triangle', vol: 0.18, n:
            /* A */ 'C2 C3 C2 C3 C2 C3 C2 C3 | G1 G2 G1 G2 G1 G2 G1 G2 | Ab1 Ab2 Ab1 Ab2 Ab1 Ab2 Ab1 Ab2 | Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 | C2 C3 C2 C3 C2 C3 C2 C3 | G1 G2 G1 G2 G1 G2 G1 G2 | Ab1 Ab2 Ab1 Ab2 G1 G2 G1 G2 | C2 C3 C2 C3 C2 . . . | ' +
            /* D */ 'Ab1 Ab2 Ab1 Ab2 Ab1 Ab2 Ab1 Ab2 | Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 | Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 | C2 C3 C2 C3 C2 C3 C2 C3 | Ab1 Ab2 Ab1 Ab2 Ab1 Ab2 Ab1 Ab2 | F2 F3 F2 F3 F2 F3 F2 F3 | G1 G2 G1 G2 G1 G2 G1 G2 | C2 C3 C2 C3 C2 . . . | ' +
            /* B */ 'F2 F3 F2 F3 F2 F3 F2 F3 | G1 G2 G1 G2 G1 G2 G1 G2 | C2 C3 C2 C3 C2 C3 C2 C3 | Ab1 Ab2 Ab1 Ab2 Ab1 Ab2 Ab1 Ab2 | F2 F3 F2 F3 F2 F3 F2 F3 | Db2 Db3 Db2 Db3 Db2 Db3 Db2 Db3 | G1 G2 G1 G2 G1 G2 G1 G2 | G1 G2 G1 G2 G1 G2 G1 G2 | ' +
            /* C */ 'C2 C3 C2 C3 C2 C3 C2 C3 | C2 C3 C2 C3 C2 C3 C2 C3 | Ab1 Ab2 Ab1 Ab2 Ab1 Ab2 Ab1 Ab2 | Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 | C2 C3 C2 C3 C2 C3 C2 C3 | F2 F3 F2 F3 F2 F3 F2 F3 | G1 G2 G1 G2 G1 G2 G1 G2 | G1 G2 G1 G2 G1 G2 G1 G2' },
        { drum: true, vol: 0.07, n:
            /* A */ 'k . h k s . h . | k k h . s . h h | k . h k s . h . | k k h . s . h h | k . h k s . h . | k k h . s . h h | k . h k s . h . | k k h . s . h h | ' +
            /* D */ 'k . h k s . h . | k k h . s . h h | k . h k s . h . | k k h . s . h h | k . h k s . h . | k k h . s . h h | k . h k s . h . | k k h . s . h h | ' +
            /* B */ 'k . h k s . h . | k k h . s . h h | k . h k s . h . | k k h . s . h h | k . h k s . h . | k k h . s . h h | k . h k s . h . | k k s . s s s s | ' +
            /* C */ 'k . h k s . h . | k k h . s . h h | k . h k s . h . | k k h . s . h h | k . h k s . h . | k k h . s . h h | k . h k s . h . | k k s . s s s s' },
    ],
};

/* the Great Spool: every House's thread wound onto one spool (C minor, solemn, building). Over one steady groove
   (the Millrace's wheel in the bass, the drums and a second voice gathering phrase by phrase), a phrase of each House in turn, brought into C minor: the Tidyhouse's minuet,
   the Kiln's phrygian turn, the Millrace's running line over its wheel, the Belfry's peal, the Slumberhouse's music
   box, the Marionette Hall's overture; then the Pull's own motif, broadened, and a close on G back into the first */
SONGS.greatspool = {
    bpm: 100, div: 2,
    ch: [
        { wave: 'p25', vol: 0.07, n:
            /* tidy */ 'C5 - Eb5 - G5 - - - | F5 - Eb5 - D5 - - - | C5 - Eb5 - G5 - - - | B4 - - - - - . . | ' +
            /* kiln */ 'C5 . Db5 . C5 . . G4 | Ab4 . G4 . F4 . . . | C5 . Db5 . Eb5 . . Db5 | C5 - - - . . . . | ' +
            /* mill */ 'C5 - . Eb5 D5 - C5 - | Bb4 - G4 - A4 - Bb4 - | C5 - . Eb5 F5 - G5 - | F5 - Eb5 - D5 - - - | ' +
            /* belfry */ 'C6 . G5 . Eb5 . C5 . | D5 . Eb5 . G5 . C6 . | C6 . Ab5 . F5 . D5 . | B4 . D5 . G5 . D5 . | ' +
            /* slumber */ 'G5 . Eb5 . C5 - - . | D5 . Eb5 . G5 - - . | F5 . D5 . B4 - - . | C5 . D5 . Eb5 - - . | ' +
            /* marionette */ 'G5 . C6 . Eb6 . C6 . | D6 . B5 . F5 . B5 . | G5 . Eb5 . C5 . Eb5 . | Ab5 - - . G5 - - . | ' +
            /* finale */ 'C5 - Eb5 - G5 - C6 - | B5 - G5 - D5 - B4 - | C5 - Eb5 - Ab5 - C6 - | Bb5 - G5 - Eb5 - D5 - | C6 - - - Ab5 - - - | Ab5 - - - F5 - - - | G5 - F5 - D5 - B4 - | B4 - - - - - . .' },
        { wave: 'triangle', vol: 0.18, n:
            /* tidy */ 'C2 . G2 C3 . G2 C3 . | F2 . C3 F3 . C3 F3 . | C2 . G2 C3 . G2 C3 . | G1 . D2 G2 . D2 G2 . | ' +
            /* kiln */ 'C2 . C2 C3 . C2 C3 . | Ab1 . Eb2 Ab2 . F2 Bb2 . | C2 . C2 C3 . C2 C3 . | C2 . C2 C3 . C2 C3 . | ' +
            /* mill */ 'C2 . G2 C3 . G2 C3 . | G1 . D2 G2 . D2 G2 . | C2 . G2 C3 . G2 C3 . | G1 . B1 G2 . D2 G2 . | ' +
            /* belfry */ 'C2 . G2 C3 . G2 C3 . | G1 . B1 G2 . G2 C3 . | F2 . C3 F3 . C3 F3 . | G1 . D2 G2 . D2 G2 . | ' +
            /* slumber */ 'C2 . G2 C3 . G2 C3 . | G1 . B1 G2 . B1 G2 . | G1 . D2 G2 . D2 G2 . | C2 . G2 C3 . G2 C3 . | ' +
            /* marionette */ 'C2 . G2 C3 . G2 C3 . | G1 . D2 G2 . D2 G2 . | C2 . G2 C3 . G2 C3 . | Ab1 . Eb2 Ab2 . D2 G2 . | ' +
            /* finale */ 'C2 . G2 C3 . G2 C3 . | G1 . D2 G2 . D2 G2 . | Ab1 . Eb2 Ab2 . Eb2 Ab2 . | Eb2 . Bb2 Eb3 . Bb2 Eb3 . | F2 . C3 F3 . C3 F3 . | Db2 . Ab2 Db3 . Ab2 Db3 . | G1 . D2 G2 . D2 G2 . | G1 . D2 G2 . . . .' },
        { wave: 'p12', vol: 0.04, n:
            /* tidy */ 'G4 - - - - - - - | Ab4 - - - - - - - | G4 - - - - - - - | G4 - - - - - - - | ' +
            /* kiln */ 'G4 . . G4 . . Eb4 . | Ab4 . . Ab4 . . F4 . | G4 . . G4 . . Eb4 . | G4 . . G4 . . C4 . | ' +
            /* mill */ 'G4 C5 G4 C5 G4 C5 G4 C5 | D4 G4 D4 G4 D4 G4 D4 G4 | G4 C5 G4 C5 G4 C5 G4 C5 | B3 G4 B3 G4 B3 D4 B3 D4 | ' +
            /* belfry */ 'Eb4 - - - - - - - | G4 - - - - - - - | F4 - - - - - - - | D4 - - - - - - - | ' +
            /* slumber */ 'C4 . G4 . C4 . G4 . | B3 . G4 . B3 . G4 . | B3 . F4 . B3 . F4 . | C4 . G4 . Eb4 . G4 . | ' +
            /* marionette */ 'Eb4 . G4 . Eb4 . G4 . | D4 . F4 . D4 . F4 . | Eb4 . G4 . Eb4 . G4 . | C4 . Eb4 . B3 . D4 . | ' +
            /* finale */ 'C5 G4 Eb4 G4 C5 G4 Eb4 G4 | B4 G4 D4 G4 B4 G4 D4 G4 | C5 Ab4 Eb4 Ab4 C5 Ab4 Eb4 Ab4 | Bb4 G4 Eb4 G4 Bb4 G4 Bb4 G4 | C5 Ab4 F4 Ab4 C5 Ab4 F4 Ab4 | Ab4 F4 Db4 F4 Ab4 F4 Db4 F4 | B4 G4 D4 G4 F4 D4 B3 D4 | D4 . . . B3 . . .' },
        { drum: true, vol: 0.07, n:
            /* tidy */ 'k . . . h . . . | k . . . h . . h | k . . . h . . . | k . . . h . . h | ' +
            /* kiln */ 'k . . k . . s . | k . . k . . s h | k . . k . . s . | k . . k . . s h | ' +
            /* mill */ 'k . h . s . h . | k . h . s . h h | k . h . s . h . | k . h . s . h h | ' +
            /* belfry */ 'k . h . s . H . | k . h . s . H h | k . h . s . H . | k . h . s . H h | ' +
            /* slumber */ 'k . h k s . h . | k . h . s . h h | k . h k s . h . | k . h . s . h h | ' +
            /* marionette */ 'k . h k s . h . | k k h . s . h h | k . h k s . h . | k k h . s . h h | ' +
            /* finale */ 'k . h k s . h . | k k h . s . h h | k . h k s . h . | k k h . s s s s | k . h k s . h . | k k h . s . h h | k . h k s . h . | k . . . s s s s' },
    ],
};

/* the Slumberhouse's keeper: the House's music box as a fight (F minor). A the whole Slumberhouse tune in the
   minor, folded into driving cells of three; D the box wound too tight: the same cells on the major side (A flat,
   E flat), then down by D flat and B flat minor to C7, closing as A closes; B its cradle-rocking turned to a clock
   ticking too fast (Bbm Ab, Eb Fm, C Db, C7); C the tune's head falling down F minor, E flat, D flat to C, then
   climbing back to C7 and round */
SONGS.boss_slumber = {
    bpm: 152, div: 2,
    ch: [
        { wave: 'p12', vol: 0.08, n:
            /* A */ 'C6 Ab5 F5 . G5 Ab5 C6 . | Bb5 G5 E5 . F5 G5 Ab5 . | Db6 Bb5 F5 . Ab5 Bb5 C6 . | Bb5 G5 E5 . F5 - - . | C6 Ab5 F5 . G5 Ab5 Bb5 . | Ab5 F5 Db5 . Eb5 F5 G5 . | Ab5 F5 Db5 . E5 F5 G5 . | C5 E5 G5 . F5 - - . | ' +
            /* D */ 'C6 Ab5 Eb5 . F5 Ab5 C6 . | Bb5 G5 Eb5 . F5 G5 Bb5 . | Ab5 F5 C5 . Db5 Eb5 F5 . | G5 E5 C5 . E5 - - . | Ab5 F5 Db5 . Eb5 F5 Ab5 . | Bb5 F5 Db5 . C5 Db5 F5 . | E5 G5 Bb5 . G5 E5 C5 . | C5 E5 G5 . F5 - - . | ' +
            /* B */ 'Db6 Bb5 Db6 Bb5 C6 Ab5 C6 Ab5 | Bb5 G5 Bb5 G5 Ab5 F5 Ab5 F5 | G5 E5 G5 E5 F5 Db5 F5 Db5 | E5 - - . G5 . Bb5 . | Db6 Bb5 Db6 Bb5 C6 Ab5 C6 Ab5 | Bb5 G5 Bb5 G5 Ab5 F5 Ab5 F5 | G5 E5 G5 E5 Bb5 G5 E5 C5 | F5 - - . . . . . | ' +
            /* C */ 'C6 Ab5 F5 . G5 Ab5 C6 . | Bb5 G5 Eb5 . F5 G5 Bb5 . | Ab5 F5 Db5 . Eb5 F5 Ab5 . | G5 E5 C5 . D5 E5 G5 . | Ab5 F5 C5 . F5 Ab5 C6 . | Db6 Bb5 F5 . F5 Bb5 Db6 . | C6 G5 E5 . G5 E5 C5 . | Bb5 G5 E5 . C5 - - .' },
        { wave: 'triangle', vol: 0.22, n:
            /* A */ 'F2 F3 F2 F3 C2 C3 C2 C3 | C2 C3 C2 C3 F2 F3 F2 F3 | Bb1 Bb2 Bb1 Bb2 F2 F3 F2 F3 | C2 C3 C2 C3 F2 F3 F2 F3 | F2 F3 F2 F3 E2 E3 E2 E3 | Db2 Db3 Db2 Db3 Eb2 Eb3 Eb2 Eb3 | Db2 Db3 Db2 Db3 C2 C3 C2 C3 | C2 C3 C2 C3 F2 F3 F2 F3 | ' +
            /* D */ 'Ab1 Ab2 Ab1 Ab2 Ab1 Ab2 Ab1 Ab2 | Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 | F2 F3 F2 F3 F2 F3 F2 F3 | C2 C3 C2 C3 C2 C3 C2 C3 | Db2 Db3 Db2 Db3 Db2 Db3 Db2 Db3 | Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 | C2 C3 C2 C3 C2 C3 C2 C3 | C2 C3 C2 C3 F2 F3 F2 F3 | ' +
            /* B */ 'Bb1 Bb2 Bb1 Bb2 Ab1 Ab2 Ab1 Ab2 | Eb2 Eb3 Eb2 Eb3 F2 F3 F2 F3 | C2 C3 C2 C3 Db2 Db3 Db2 Db3 | C2 C3 C2 C3 C2 C3 C2 C3 | Bb1 Bb2 Bb1 Bb2 Ab1 Ab2 Ab1 Ab2 | Eb2 Eb3 Eb2 Eb3 F2 F3 F2 F3 | C2 C3 C2 C3 C2 C3 C2 C3 | F2 F3 F2 F3 F2 F3 F2 F3 | ' +
            /* C */ 'F2 F3 F2 F3 F2 F3 F2 F3 | Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 | Db2 Db3 Db2 Db3 Db2 Db3 Db2 Db3 | C2 C3 C2 C3 C2 C3 C2 C3 | F2 F3 F2 F3 F2 F3 F2 F3 | Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 | C2 C3 C2 C3 C2 C3 C2 C3 | C2 C3 C2 C3 E2 E3 E2 E3' },
        { wave: 'p25', vol: 0.04, n:
            /* A */ 'F4 . Ab4 . E4 . G4 . | E4 . Bb4 . F4 . Ab4 . | F4 . Db5 . F4 . Ab4 . | E4 . Bb4 . F4 . Ab4 . | F4 . Ab4 . E4 . Bb4 . | F4 . Ab4 . G4 . Bb4 . | F4 . Ab4 . E4 . G4 . | E4 . Bb4 . F4 . C5 . | ' +
            /* D */ 'Eb4 . Ab4 . C4 . Eb4 . | Eb4 . G4 . Bb3 . Eb4 . | F4 . Ab4 . Ab3 . F4 . | E4 . G4 . C4 . E4 . | F4 . Ab4 . Db4 . F4 . | F4 . Bb4 . Bb3 . F4 . | E4 . Bb4 . G4 . Bb4 . | E4 . Bb4 . F4 . C5 . | ' +
            /* B */ 'F4 . Db5 . Eb4 . C5 . | Eb4 . G4 . F4 . Ab4 . | E4 . G4 . F4 . Ab4 . | E4 . G4 . Bb4 . G4 . | F4 . Db5 . Eb4 . C5 . | Eb4 . G4 . F4 . Ab4 . | E4 . G4 . E4 . Bb4 . | F4 . Ab4 . C5 . Ab4 . | ' +
            /* C */ 'F4 . Ab4 . F4 . Ab4 . | Eb4 . G4 . Eb4 . G4 . | F4 . Ab4 . F4 . Ab4 . | E4 . G4 . E4 . G4 . | F4 . Ab4 . F4 . Ab4 . | F4 . Db5 . F4 . Db5 . | E4 . G4 . E4 . G4 . | E4 . Bb4 . E4 . Bb4 .' },
        { drum: true, vol: 0.1, n:
            /* A */ 'k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s s s s | ' +
            /* D */ 'k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s s s s | ' +
            /* B */ 'k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s s s s | ' +
            /* C */ 'k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s s s s' },
    ],
};

/* the Marionette Hall's keeper: the House's overture as a fight. A the toy-piano tune turned to G minor at
   full tilt; D the music-hall trio come back in the minor's E flat, singing in held notes (E flat, A flat, B flat 7,
   C minor) and turning on D7 home; B the dark wing's falling G minor, F, E flat, D, answered in B flat; C the tune
   bright in G major for a moment, then pulled dark again (E flat, C minor) and hung on D7 to start over */
SONGS.boss_marionette = {
    bpm: 150, div: 2,
    ch: [
        { wave: 'p12', vol: 0.08, n:
            /* A */ 'G5 . Bb5 . D6 . Bb5 . | C6 . A5 . F#5 . A5 . | G5 . D5 . Bb4 . D5 . | Eb5 - - . D5 - - . | G5 . Bb5 . D6 . Bb5 . | Eb6 . C6 . G5 . C6 . | Bb5 . G5 . A5 . F#5 . | G5 - - - . . . . | ' +
            /* D */ 'G5 - - . Bb5 . G5 . | Ab5 - - . C6 . Ab5 . | F5 - - . Bb5 . Ab5 . | G5 - - . Eb5 - - . | C6 - - . Eb6 . C6 . | Ab5 - - . . C6 F#5 . | G5 . Bb5 . A5 . F#5 . | G5 - - - . . . . | ' +
            /* B */ 'Bb5 . G5 . D5 . G5 . | A5 . F5 . C5 . F5 . | G5 . Eb5 . Bb4 . Eb5 . | D5 - - . F#5 . A5 . | D6 . Bb5 . F5 . Bb5 . | C6 . A5 . F5 . A5 . | Bb5 . G5 . Eb5 . G5 . | F#5 - - . A5 . C6 . | ' +
            /* C */ 'G5 . B5 . D6 . B5 . | C6 . A5 . F#5 . A5 . | G5 . D5 . B4 . D5 . | E5 - - . D5 - - . | G5 . Eb5 . Bb4 . Eb5 . | C6 . G5 . Eb5 . G5 . | F#5 . A5 . C6 . A5 . | D6 - - . C6 . A5 .' },
        { wave: 'triangle', vol: 0.22, n:
            /* A */ 'G2 G3 G2 G3 G2 G3 G2 G3 | D2 D3 D2 D3 D2 D3 D2 D3 | G2 G3 G2 G3 G2 G3 G2 G3 | C2 C3 C2 C3 D2 D3 D2 D3 | G2 G3 G2 G3 G2 G3 G2 G3 | C2 C3 C2 C3 C2 C3 C2 C3 | G2 G3 G2 G3 D2 D3 D2 D3 | G2 G3 G2 G3 G2 G3 G2 G3 | ' +
            /* D */ 'Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 | Ab1 Ab2 Ab1 Ab2 Ab1 Ab2 Ab1 Ab2 | Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 | Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 | C2 C3 C2 C3 C2 C3 C2 C3 | Ab1 Ab2 Ab1 Ab2 D2 D3 D2 D3 | G2 G3 G2 G3 D2 D3 D2 D3 | G2 G3 G2 G3 G2 G3 G2 G3 | ' +
            /* B */ 'G2 G3 G2 G3 G2 G3 G2 G3 | F2 F3 F2 F3 F2 F3 F2 F3 | Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 | D2 D3 D2 D3 D2 D3 D2 D3 | Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 | F2 F3 F2 F3 F2 F3 F2 F3 | Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 | D2 D3 D2 D3 D2 D3 D2 D3 | ' +
            /* C */ 'G2 G3 G2 G3 G2 G3 G2 G3 | D2 D3 D2 D3 D2 D3 D2 D3 | G2 G3 G2 G3 G2 G3 G2 G3 | C2 C3 C2 C3 D2 D3 D2 D3 | Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 | C2 C3 C2 C3 C2 C3 C2 C3 | D2 D3 D2 D3 D2 D3 D2 D3 | D2 D3 D2 D3 D2 D3 F#2 F#3' },
        { wave: 'p25', vol: 0.04, n:
            /* A */ 'G4 . Bb4 . G4 . Bb4 . | F#4 . A4 . F#4 . C5 . | D4 . G4 . D4 . G4 . | Eb4 . G4 . D4 . F#4 . | G4 . Bb4 . G4 . Bb4 . | Eb4 . G4 . Eb4 . G4 . | G4 . Bb4 . F#4 . A4 . | G4 . Bb4 . D5 . Bb4 . | ' +
            /* D */ 'Eb4 . G4 . Bb4 . G4 . | Eb4 . Ab4 . C5 . Ab4 . | D4 . F4 . Ab4 . F4 . | Eb4 . G4 . Bb4 . G4 . | Eb4 . G4 . C5 . G4 . | Eb4 . Ab4 . D4 . F#4 . | G4 . Bb4 . F#4 . A4 . | G4 . Bb4 . D5 . Bb4 . | ' +
            /* B */ 'D4 . G4 . D4 . G4 . | C4 . F4 . A4 . F4 . | Eb4 . G4 . Bb4 . G4 . | D4 . F#4 . A4 . F#4 . | D4 . F4 . Bb4 . F4 . | C4 . F4 . A4 . F4 . | Eb4 . G4 . Bb4 . G4 . | D4 . F#4 . C5 . F#4 . | ' +
            /* C */ 'D4 . G4 . B4 . G4 . | D4 . F#4 . C5 . F#4 . | D4 . G4 . B4 . G4 . | E4 . G4 . D4 . F#4 . | Eb4 . G4 . Bb4 . G4 . | Eb4 . G4 . C5 . G4 . | D4 . F#4 . C5 . F#4 . | D4 . F#4 . A4 . C5 .' },
        { drum: true, vol: 0.1, n:
            /* A */ 'k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s s s s | ' +
            /* D */ 'k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s s s s | ' +
            /* B */ 'k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s s s s | ' +
            /* C */ 'k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s s s s' },
    ],
};

/* the Spoolworks' keeper: the House's machine as a fight (E minor). A the Spoolworks tune over its own spinning
   bass, its last suspended E falling to D sharp this time; D its answer, as the House plays it (G D Em C, Am C B7 Em),
   over the spinning bass; B the riff shifting gear up a fourth (A minor, F, D minor), then grinding back over E minor,
   A minor, D7 and B; C the shuttle running in eighths, then the riff once more */
SONGS.boss_spoolworks = {
    bpm: 156, div: 2,
    ch: [
        { wave: 'p12', vol: 0.08, n:
            /* A */ 'E5 . . G5 . . F#5 . | E5 . D5 . B4 . . . | C5 . . E5 . . D5 . | C5 . B4 . A4 . . . | E5 . . G5 . . B5 . | A5 . G5 . F#5 . E5 . | D5 . F#5 . A5 . F#5 . | E5 - - - D#5 - - - | ' +
            /* D */ 'D5 . . G5 . . B5 . | A5 . F#5 . D5 . . . | B5 . . G5 . . E5 . | G5 . E5 . C5 . . . | C5 . . E5 . . A5 . | G5 . E5 . C5 . E5 . | D#5 . F#5 . A5 . F#5 . | E5 - - - . . . . | ' +
            /* B */ 'A5 . . C6 . . B5 . | A5 . G5 . E5 . . . | F5 . . A5 . . G5 . | F5 . E5 . D5 . . . | E5 . . G5 . . B5 . | C6 . B5 . A5 . G5 . | F#5 . A5 . C6 . A5 . | B5 - - - . . . . | ' +
            /* C */ 'B4 E5 G5 E5 B4 E5 G5 E5 | B4 E5 G5 B5 G5 E5 B4 E5 | C5 E5 G5 E5 C5 E5 G5 E5 | A4 C5 E5 C5 A4 C5 E5 C5 | E5 . . G5 . . B5 . | C6 . B5 . A5 . G5 . | F#5 . A5 . D6 . A5 . | B5 - - - A5 . F#5 .' },
        { wave: 'triangle', vol: 0.22, n:
            /* A */ 'E2 E3 B2 E3 E2 E3 B2 E3 | E2 E3 B2 E3 E2 E3 B2 E3 | C3 C4 G3 C4 C3 C4 G3 C4 | A2 A3 E3 A3 A2 A3 E3 A3 | E2 E3 B2 E3 E2 E3 B2 E3 | A2 A3 E3 A3 A2 A3 E3 A3 | D3 D4 A3 D4 D3 D4 A3 D4 | B2 B3 F#3 B3 B2 B3 F#3 B3 | ' +
            /* D */ 'G2 G3 D3 G3 G2 G3 D3 G3 | D3 D4 A3 D4 D3 D4 A3 D4 | E2 E3 B2 E3 E2 E3 B2 E3 | C3 C4 G3 C4 C3 C4 G3 C4 | A2 A3 E3 A3 A2 A3 E3 A3 | C3 C4 G3 C4 C3 C4 G3 C4 | B2 B3 F#3 B3 B2 B3 F#3 B3 | E2 E3 B2 E3 E2 E3 B2 E3 | ' +
            /* B */ 'A2 A3 E3 A3 A2 A3 E3 A3 | A2 A3 E3 A3 A2 A3 E3 A3 | F2 F3 C3 F3 F2 F3 C3 F3 | D3 D4 A3 D4 D3 D4 A3 D4 | E2 E3 B2 E3 E2 E3 B2 E3 | A2 A3 E3 A3 A2 A3 E3 A3 | D3 D4 A3 D4 D3 D4 A3 D4 | B2 B3 F#3 B3 B2 B3 F#3 B3 | ' +
            /* C */ 'E2 E3 B2 E3 E2 E3 B2 E3 | E2 E3 B2 E3 E2 E3 B2 E3 | C3 C4 G3 C4 C3 C4 G3 C4 | A2 A3 E3 A3 A2 A3 E3 A3 | E2 E3 B2 E3 E2 E3 B2 E3 | A2 A3 E3 A3 A2 A3 E3 A3 | D3 D4 A3 D4 D3 D4 A3 D4 | B2 B3 F#3 B3 B2 B3 F#3 B3' },
        { wave: 'p25', vol: 0.04, n:
            /* A */ 'G4 . B4 . G4 . B4 . | G4 . B4 . G4 . B4 . | E4 . G4 . E4 . G4 . | E4 . A4 . E4 . A4 . | G4 . B4 . G4 . B4 . | E4 . A4 . E4 . A4 . | F#4 . A4 . F#4 . A4 . | F#4 . B4 . D#4 . F#4 . | ' +
            /* D */ 'G4 . B4 . G4 . B4 . | F#4 . A4 . F#4 . A4 . | G4 . B4 . G4 . B4 . | E4 . G4 . E4 . G4 . | E4 . A4 . E4 . A4 . | E4 . G4 . E4 . G4 . | F#4 . A4 . D#4 . F#4 . | G4 . B4 . G4 . B4 . | ' +
            /* B */ 'E4 . A4 . E4 . A4 . | E4 . A4 . E4 . A4 . | F4 . A4 . F4 . A4 . | F4 . A4 . D4 . F4 . | G4 . B4 . G4 . B4 . | E4 . A4 . E4 . A4 . | F#4 . C5 . F#4 . A4 . | F#4 . B4 . D#4 . F#4 . | ' +
            /* C */ 'E4 . G4 . E4 . G4 . | E4 . G4 . E4 . G4 . | E4 . G4 . E4 . G4 . | E4 . A4 . E4 . A4 . | G4 . B4 . G4 . B4 . | E4 . A4 . E4 . A4 . | F#4 . A4 . F#4 . A4 . | F#4 . B4 . D#4 . F#4 .' },
        { drum: true, vol: 0.1, n:
            /* A */ 'k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s s s s | ' +
            /* D */ 'k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s s s s | ' +
            /* B */ 'k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s s s s | ' +
            /* C */ 'k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s s s s' },
    ],
};

/* the Loom's keeper: the First Spinner's machine running at last (D phrygian). A the Loom's tune hammered out
   like a beater on the weft, its E flat a chord of its own; D the beater on new threads, down by G minor, F, E flat to
   D, then up by B flat and C minor to A7; B the House's second strain the same way (Bb Cm Gm D, Eb Cm Eb D); C the
   tune's long notes again over the shuttle flying in eighths, closing on A7 and D */
SONGS.boss_loom = {
    bpm: 144, div: 2,
    ch: [
        { wave: 'p25', vol: 0.08, n:
            /* A */ 'D5 - - A4 Eb5 - - Bb4 | D5 - - A4 C5 - - G4 | Bb4 - - Bb4 C5 - D5 - | A4 - - A4 - - A4 - | D5 - - D5 F5 - - F5 | Eb5 - - Eb5 D5 - - D5 | C5 - Bb4 - A4 - G4 - | A4 - - - - - . . | ' +
            /* D */ 'Bb4 - - Bb4 D5 - - D5 | C5 - - C5 A4 - - A4 | Bb4 - - Bb4 G4 - - G4 | A4 - - A4 D5 - - - | D5 - - D5 F5 - - F5 | Eb5 - - Eb5 G5 - - G5 | G5 - - Eb5 E5 - - C#5 | A4 - - - - - . . | ' +
            /* B */ 'F5 - - F5 D5 - - D5 | Eb5 - - Eb5 C5 - - C5 | D5 - - D5 Bb4 - - Bb4 | A4 - - Bb4 A4 - G4 - | G4 - - G4 Bb4 - - Bb4 | C5 - - C5 Eb5 - - Eb5 | Bb4 - - Eb5 G5 - - Eb5 | D5 - - - - - . . | ' +
            /* C */ 'D5 - - - - - - - | Eb5 - - - - - - - | D5 - - - C5 - - - | Bb4 - - - C5 - D5 - | Eb5 - - - G5 - - - | D5 - - - Bb4 - - - | C5 - Bb4 - A4 - G4 - | A4 - - - - - . .' },
        { wave: 'triangle', vol: 0.22, n:
            /* A */ 'D2 D3 D2 D3 Eb2 Eb3 Eb2 Eb3 | D2 D3 D2 D3 C2 C3 C2 C3 | Bb1 Bb2 Bb1 Bb2 C2 C3 C2 C3 | D2 D3 D2 D3 D2 D3 D2 D3 | D2 D3 D2 D3 Bb1 Bb2 Bb1 Bb2 | C2 C3 C2 C3 G1 G2 G1 G2 | C2 C3 C2 C3 A1 A2 A1 A2 | D2 D3 D2 D3 D2 D3 D2 D3 | ' +
            /* D */ 'G1 G2 G1 G2 G1 G2 G1 G2 | F2 F3 F2 F3 F2 F3 F2 F3 | Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 | D2 D3 D2 D3 D2 D3 D2 D3 | Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 | C2 C3 C2 C3 C2 C3 C2 C3 | Eb2 Eb3 Eb2 Eb3 A1 A2 A1 A2 | D2 D3 D2 D3 D2 D3 D2 D3 | ' +
            /* B */ 'Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 | C2 C3 C2 C3 C2 C3 C2 C3 | G1 G2 G1 G2 G1 G2 G1 G2 | D2 D3 D2 D3 D2 D3 D2 D3 | Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 | C2 C3 C2 C3 C2 C3 C2 C3 | Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 | D2 D3 D2 D3 D2 D3 D2 D3 | ' +
            /* C */ 'D2 D3 D2 D3 D2 D3 D2 D3 | Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 | D2 D3 D2 D3 D2 D3 D2 D3 | Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 | C2 C3 C2 C3 C2 C3 C2 C3 | G1 G2 G1 G2 G1 G2 G1 G2 | C2 C3 C2 C3 A1 A2 A1 A2 | D2 D3 D2 D3 D2 D3 D2 D3' },
        { wave: 'p12', vol: 0.04, n:
            /* A */ 'D4 . A4 . Eb4 . Bb4 . | D4 . A4 . C4 . G4 . | D4 . F4 . C4 . G4 . | D4 . A4 . D4 . A4 . | D4 . F4 . D4 . F4 . | Eb4 . G4 . D4 . G4 . | Eb4 . G4 . C#4 . G4 . | D4 . A4 . D4 . A4 . | ' +
            /* D */ 'D4 . G4 . D4 . G4 . | C4 . F4 . C4 . A4 . | Eb4 . G4 . Eb4 . G4 . | D4 . F4 . D4 . A4 . | D4 . F4 . D4 . Bb4 . | Eb4 . G4 . C4 . G4 . | Eb4 . Bb4 . C#4 . G4 . | D4 . A4 . D4 . A4 . | ' +
            /* B */ 'D4 . F4 . D4 . F4 . | Eb4 . G4 . Eb4 . G4 . | D4 . G4 . D4 . G4 . | D4 . A4 . D4 . A4 . | Eb4 . Bb4 . Eb4 . Bb4 . | Eb4 . G4 . Eb4 . G4 . | Eb4 . Bb4 . Eb4 . Bb4 . | D4 . A4 . D4 . A4 . | ' +
            /* C */ 'D4 A4 D5 A4 D4 A4 D5 A4 | Eb4 Bb4 Eb5 Bb4 Eb4 Bb4 Eb5 Bb4 | D4 A4 D5 A4 D4 A4 D5 A4 | Eb4 G4 Bb4 G4 Eb4 G4 Bb4 G4 | C4 G4 C5 G4 C4 G4 C5 G4 | D4 G4 Bb4 G4 D4 G4 Bb4 G4 | C4 G4 Eb4 G4 C#4 E4 G4 E4 | D4 A4 D5 A4 D4 A4 D5 A4' },
        { drum: true, vol: 0.1, n:
            /* A */ 'k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s s s s | ' +
            /* D */ 'k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s s s s | ' +
            /* B */ 'k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s s s s | ' +
            /* C */ 'k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s . h s | k . h k s . h . | k k h . s s s s' },
    ],
};
