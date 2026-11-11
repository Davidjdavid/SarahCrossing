/* More music, a third set: a tune of its own for the Makings (the Little Houses, which had shared the Underside's)
   and an arrangement for the Unfinished House, both built on the Underside's motif (A C E D C B A) so they belong
   with it. Each song's channels are its full length, so the parts never drift apart. Both are long-stay songs
   (thin: true): after a while in one room with nothing solved, the tune rests for a pass (Music, 09_audio.js). */

/* the Makings: a Little House worked from underneath while a child plays it from above (A minor, on tiptoe).
   The Underside's own motif, skipping. A the motif from below (the lead), each phrase answered from above (the music
   box); B the boy's own march up top, in C major; A2 the other way round, the box calling and the lead answering
   from below, turning on E; C a quieter pass, the lead resting: the box plays the first Little House's minuet, in
   three; B2 the Underside's warmer strain on tiptoe; D a sulk (he sits down), and up again into A */
SONGS.makings = {
    bpm: 108, div: 4, thin: true,
    ch: [
        { wave: 'p25', vol: 0.072, legato: 0.7, n:
            /* A */ 'A4 - - C5 E5 - - D5 C5 - - B4 A4 - . . | . . . . . . . . . . . . . . . . | G4 - - B4 D5 - - C5 B4 - - A4 G4 - . . | . . . . . . . . . . . . . . . . | F4 - - A4 C5 - - B4 A4 - - G4 F4 - . . | . . . . . . . . . . . . . . . . | E4 - - G#4 B4 - - D5 C5 - - B4 A4 - . . | . . . . . . . . . . . . . . . . | ' +
            /* B */ 'E5 . E5 . G5 - - . E5 . E5 . G5 - - . | A5 . A5 . C6 - - . A5 . G5 . F5 - - . | D5 . D5 . G5 - - . F5 . E5 . D5 - - . | E5 . D5 . C5 - - . G4 - . . C5 - . . | C5 . C5 . E5 - - . C5 . C5 . A5 - - . | A5 . G5 . F5 - - . C5 . D5 . F5 - - . | G5 . F5 . E5 - - . D5 . E5 . F5 - - . | E5 - . . G5 - . . C6 - - - . . . . | ' +
            /* A2 */ '. . . . . . . . . . . . . . . . | E4 . C4 . A3 . . . E4 . . . A4 . . . | . . . . . . . . . . . . . . . . | D4 . B3 . G3 . . . D4 . . . G4 . . . | . . . . . . . . . . . . . . . . | C4 . A3 . F3 . . . C4 . . . F4 . . . | . . . . . . . . . . . . . . . . | E4 . G#4 . B4 . D5 . E5 - - - - - . . | ' +
            /* C */ '. . . . . . . . . . . . | . . . . . . . . . . . . | . . . . . . . . . . . . | . . . . . . . . . . . . | . . . . . . . . . . . . | . . . . . . . . . . . . | . . . . . . . . . . . . | . . . . . . . . . . . . | ' +
            /* B2 */ 'E5 - . . D5 - . . C5 - . . G4 - . . | B4 - . . C5 - . . D5 - - - . . . . | C5 - . . B4 - . . A4 - . . E5 - . . | G4 - . . A4 - . . B4 - - - . . . . | A4 - . . G4 - . . F4 - . . A4 - . . | G4 - . . E4 - . . C5 - - - . . . . | F4 - . . A4 - . . D5 - . . F5 - . . | E5 - . . D5 - . . B4 - . . G#4 - . . | ' +
            /* D */ 'A4 - - - - - G4 - F4 - - - . . . . | F4 - - - - - E4 - D4 - - - . . . . | D4 - - - - - C4 - B3 - - - . . . . | G#3 - - - . . . . E4 . G#4 . B4 . D5 .' },
        { wave: 'triangle', vol: 0.18, legato: 0.6, n:
            /* A */ 'A2 - . . E3 - . . A2 - . . E3 - . . | A2 - . . E3 - . . A2 - . . E3 - . G#2 | G2 - . . D3 - . . G2 - . . D3 - . . | G2 - . . D3 - . . G2 - . . D3 - . F#2 | F2 - . . C3 - . . F2 - . . C3 - . . | F2 - . . C3 - . . F2 - . . C3 - . F2 | E2 - . . B2 - . . A2 - . . E3 - . . | A2 - . . E3 - . . A2 - . . G2 - . . | ' +
            /* B */ 'C3 - . . G2 - . . C3 - . . G2 - . . | F2 - . . C3 - . . F2 - . . C3 - . . | G2 - . . D3 - . . G2 - . . B2 - . . | C3 - . . G2 - . . C3 - . . E3 - . . | A2 - . . E3 - . . A2 - . . E3 - . . | F2 - . . C3 - . . F2 - . . A2 - . . | G2 - . . D3 - . . G2 - . . B2 - . . | C3 - . . G2 - . . C3 - . . B2 - . . | ' +
            /* A2 */ 'A2 - . . E3 - . . A2 - . . E3 - . . | A2 - . . E3 - . . A2 - . . E3 - . G#2 | G2 - . . D3 - . . G2 - . . D3 - . . | G2 - . . D3 - . . G2 - . . D3 - . F#2 | F2 - . . C3 - . . F2 - . . C3 - . . | F2 - . . C3 - . . F2 - . . C3 - . F2 | E2 - . . B2 - . . A2 - . . E3 - . . | E2 - . . B2 - . . G#2 - . . B2 - . . | ' +
            /* C */ 'A2 - . . E3 . . . E3 . . . | D3 - . . F3 . . . A3 . . . | A2 - . . E3 . . . E3 . . . | E2 - . . G#2 . . . G#2 . . . | A2 - . . E3 . . . E3 . . . | D3 - . . A3 . . . F3 . . . | E2 - . . G#2 . . . B2 . . . | A2 - . . E3 . . . A2 . . . | ' +
            /* B2 */ 'C3 - . . G2 - . . C3 - . . G2 - . . | G2 - . . D3 - . . G2 - . . D3 - . . | A2 - . . E3 - . . A2 - . . E3 - . . | E2 - . . B2 - . . E2 - . . B2 - . . | F2 - . . C3 - . . F2 - . . C3 - . . | C3 - . . G2 - . . C3 - . . G2 - . . | D3 - . . A2 - . . D3 - . . A2 - . . | E2 - . . B2 - . . E2 - . . G#2 - . . | ' +
            /* D */ 'F2 - . . . . . . C3 - . . . . . . | D3 - . . . . . . A2 - . . . . . . | E2 - . . . . . . B2 - . . . . . . | E2 - . . B2 - . . E2 - . . G#2 - . .' },
        { wave: 'p12', vol: 0.045, legato: 0.8, n:
            /* A */ '. . . . . . . . . . . . . . . . | E5 . A5 . C6 . B5 . A5 - . . . . . . | . . . . . . . . . . . . . . . . | D5 . G5 . B5 . A5 . G5 - . . . . . . | . . . . . . . . . . . . . . . . | C5 . F5 . A5 . G5 . F5 - . . . . . . | . . . . . . . . . . . . . . . . | E5 . A5 . C6 . B5 . C6 . D6 . E6 - . . | ' +
            /* B */ '. . G4 . . . C5 . . . G4 . . . E5 . | . . A4 . . . C5 . . . A4 . . . F4 . | . . B4 . . . D5 . . . B4 . . . G4 . | . . G4 . . . E4 . . . . . . . G4 . | . . A4 . . . E4 . . . A4 . . . E4 . | . . A4 . . . F4 . . . A4 . . . C5 . | . . B4 . . . G4 . . . B4 . . . D5 . | . . G4 . . . E4 . . . C5 . . . . . | ' +
            /* A2 */ 'A4 - - C5 E5 - - D5 C5 - - B4 A4 - . . | . . . . . . . . . . . . . . . . | G4 - - B4 D5 - - C5 B4 - - A4 G4 - . . | . . . . . . . . . . . . . . . . | F4 - - A4 C5 - - B4 A4 - - G4 F4 - . . | . . . . . . . . . . . . . . . . | E4 - - G#4 B4 - - D5 C5 - - B4 A4 - . . | . . . . . . . . . . . . . . . . | ' +
            /* C */ 'A5 - . . C6 - . . E6 - . . | D6 - . . C6 - . . B5 - . . | A5 - . . C6 - . . E6 - . . | G#5 - - - - - - . . . . . | A5 - . . C6 - . . E6 - . . | F6 - . . E6 - . . D6 - . . | C6 - . . B5 - . . G#5 - . . | A5 - - - - - - . . . . . | ' +
            /* B2 */ '. . G4 . . . E4 . . . G4 . . . C5 . | . . . . . . . . . . . . D6 . B5 . | . . A4 . . . E4 . . . C5 . . . A4 . | . . . . . . . . . . . . B5 . G5 . | . . C5 . . . A4 . . . C5 . . . F4 . | . . . . . . . . . . . . G5 . E5 . | . . A4 . . . F4 . . . A4 . . . D5 . | . . . . . . . . . . . . . . . . | ' +
            /* D */ '. . . . . . . . . . . . . . . . | . . . . . . . . . . . . . . . . | . . . . . . . . . . . . . . . . | . . . . . . . . . . . . . . . .' },
        { drum: true, vol: 0.04, n:
            /* A */ 'k . . . h . . . k . . . h . . . | k . . . h . . . k . . . h . h . | k . . . h . . . k . . . h . . . | k . . . h . . . k . . . h . h . | k . . . h . . . k . . . h . . . | k . . . h . . . k . . . h . h . | k . . . h . . . k . . . h . . . | k . . . h . . . k . . . h . h . | ' +
            /* B */ 'k . . . s . . . k . . h s . . . | k . . . s . . . k . . h s . . . | k . . . s . . . k . . h s . . . | k . . . s . . . k . . h s . h . | k . . . s . . . k . . h s . . . | k . . . s . . . k . . h s . . . | k . . . s . . . k . . h s . . . | k . . . s . . . k . . . s . s s | ' +
            /* A2 */ 'k . . . h . . . k . . . h . . . | k . . . h . . . k . . . h . h . | k . . . h . . . k . . . h . . . | k . . . h . . . k . . . h . h . | k . . . h . . . k . . . h . . . | k . . . h . . . k . . . h . h . | k . . . h . . . k . . . h . . . | k . . . h . . . k . . . h . h . | ' +
            /* C */ 'h . . . h . . . h . . . | h . . . h . . . h . . . | h . . . h . . . h . . . | h . . . h . . . h . . . | h . . . h . . . h . . . | h . . . h . . . h . . . | h . . . h . . . h . . . | h . . . h . . . h . . . | ' +
            /* B2 */ 'k . . . h . . . k . . . h . . . | k . . . h . . . k . . . h . h . | k . . . h . . . k . . . h . . . | k . . . h . . . k . . . h . h . | k . . . h . . . k . . . h . . . | k . . . h . . . k . . . h . h . | k . . . h . . . k . . . h . . . | k . . . h . . . k . . . h . h . | ' +
            /* D */ 'k . . . . . . . . . . . . . . . | k . . . . . . . . . . . . . . . | k . . . . . . . . . . . . . . . | k . . . h . . . s . s . s s s s' },
    ],
};

/* the Unfinished House: a House drawn in chalk and never built (A minor, slow, tender). The Underside's
   motif, three times, finished a little more each time. A the plan in chalk: every phrase stops a note short and
   waits (a faint pencil mark where the note should go) over the open fifth; B the drafting table, a new line
   over a bass walking down (F E D C B flat A) to wait on E; A2 the motif mirrored, inked in under the chalk, every
   phrase finished but the last, left hanging on the seventh; C the motif whole at last, every voice in, and the
   cadence it kept waiting for, home to A major. Then the chalk again */
SONGS.unfinished = {
    bpm: 80, div: 2, thin: true,
    ch: [
        { wave: 'triangle', vol: 0.06, vib: true, n:
            /* A */ 'A4 - C5 - E5 - D5 - | C5 - B4 - . . . . | G4 - B4 - D5 - C5 - | B4 - A4 - . . . . | F4 - A4 - C5 - B4 - | A4 - G4 - . . . . | E4 - G#4 - B4 - D5 - | C5 - B4 - - - - - | ' +
            /* B */ 'A4 - - - C5 - - - | G4 - - - - - E4 - | F4 - - - A4 - - - | E4 - - - - - . . | D5 - - - - - C5 - | C5 - - - A4 - F4 - | A4 - - - F4 - D4 - | E4 - - - G#4 - B4 - | ' +
            /* A2 */ 'E5 - C5 - A4 - B4 - | C5 - D5 - E5 - - - | D5 - B4 - G4 - A4 - | B4 - C5 - D5 - - - | C5 - A4 - F4 - G4 - | A4 - C5 - F5 - E5 - | E5 - B4 - G#4 - B4 - | D5 - - - - - . . | ' +
            /* C */ 'A4 - C5 - E5 - D5 - | C5 - B4 - A4 - - - | G4 - B4 - D5 - C5 - | B4 - A4 - G4 - - - | F4 - A4 - C5 - B4 - | A4 - G4 - F4 - E4 - | E4 - G#4 - B4 - D5 - | C#5 - B4 - A4 - - -' },
        { wave: 'p25', vol: 0.03, legato: 0.85, thin: 'rest', n:
            /* A */ '. . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | ' +
            /* B */ '. . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | ' +
            /* A2 */ 'E4 - C4 - A3 - B3 - | C4 - D4 - E4 - - - | D4 - B3 - G3 - A3 - | B3 - C4 - D4 - - - | C4 - A3 - F3 - G3 - | A3 - C4 - F4 - E4 - | E4 - B3 - G#3 - B3 - | . . . . . . . . | ' +
            /* C */ 'A4 - C5 - E5 - D5 - | C5 - B4 - A4 - - - | G4 - B4 - D5 - C5 - | B4 - A4 - G4 - - - | F4 - A4 - C5 - B4 - | A4 - G4 - F4 - E4 - | E4 - G#4 - B4 - D5 - | C#5 - B4 - A4 - - -' },
        { wave: 'p12', vol: 0.03, n:
            /* A */ '. . . . . . . . | . . . . A5 - - . | . . . . . . . . | . . . . G5 - - . | . . . . . . . . | . . . . F5 - E5 - | . . . . . . . . | . . . . . . . . | ' +
            /* B */ 'F4 A4 C5 A4 F4 A4 C5 A4 | E4 G4 C5 G4 E4 G4 C5 G4 | D4 F4 A4 F4 D4 F4 A4 F4 | C4 E4 A4 E4 C4 E4 A4 E4 | D4 F4 Bb4 F4 D4 F4 Bb4 F4 | C4 F4 A4 F4 C4 F4 A4 F4 | D4 F4 A4 F4 D4 F4 A4 F4 | E4 G#4 B4 G#4 E4 G#4 B4 G#4 | ' +
            /* A2 */ '. . . A5 . . . E5 | . . . A5 . . . C6 | . . . G5 . . . D5 | . . . G5 . . . B5 | . . . F5 . . . C5 | . . . A5 . . . C6 | . . . B5 . . . G#5 | . . . . . . . . | ' +
            /* C */ 'A3 E4 A4 E4 A3 E4 A4 E4 | A3 E4 A4 E4 A3 E4 A4 E4 | G3 D4 G4 D4 G3 D4 G4 D4 | G3 D4 G4 D4 G3 D4 G4 D4 | F3 C4 F4 C4 F3 C4 A3 F3 | F3 C4 F4 C4 F3 C4 A3 C4 | E3 G#3 B3 E4 D4 B3 G#3 B3 | A3 C#4 E4 A4 E4 C#4 A3 .' },
        { wave: 'triangle', vol: 0.11, n:
            /* A */ 'A2 - - - - - - . | E2 - - - - - - . | G2 - - - - - - . | D2 - - - - - - . | F2 - - - - - - . | C2 - - - - - - . | E2 - - - - - - . | E2 - - - - - - . | ' +
            /* B */ 'F2 - - - - - - . | E2 - - - - - - . | D2 - - - - - - . | C2 - - - - - - . | Bb1 - - - - - - . | A1 - - - - - - . | F2 - - - D2 - - . | E2 - - - - - - . | ' +
            /* A2 */ 'A2 - - - E3 - - - | A2 - - - E3 - - - | G2 - - - D3 - - - | G2 - - - D3 - - - | F2 - - - C3 - - - | F2 - - - C3 - - - | E2 - - - B2 - - - | E2 - - - - - - . | ' +
            /* C */ 'A2 - - - E3 - - - | A2 - - - C3 - - - | G2 - - - D3 - - - | G2 - - - B2 - - - | F2 - - - C3 - . . | F2 - - - A2 - - - | E2 - - - B2 - D3 - | A2 - - - - - - .' },
        { drum: true, vol: 0.025, n:
            /* A */ '. . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | ' +
            /* B */ '. . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | ' +
            /* A2 */ 'h . . . . . . . | h . . . . . . . | h . . . . . . . | h . . . . . . . | h . . . . . . . | h . . . . . . . | h . . . . . . . | h . . . . . . . | ' +
            /* C */ 'k . . . h . . . | k . . . h . . . | k . . . h . . . | k . . . h . . . | k . . . h . . . | k . . . h . . . | k . . . h . . . | k . . . h . . .' },
    ],
};

/* the other long stays: the Houses' rooms, the Underside, the Drift (not the fights, which play tunes of their own, nor
   the town, the regions or the scenes) */
for (const id of ['tidy', 'kilnhouse', 'millrace', 'belfry', 'slumber', 'marionette', 'underside', 'spoolworks', 'loom', 'greatspool', 'drift']) if (SONGS[id]) SONGS[id].thin = true;
