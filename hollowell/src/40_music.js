/* The music. One token a step ("C5", "-" hold, "." rest; drums k s h). div: steps per beat.
   The Return motif (up and back: G A C A G) turns up in the title and the town, and comes back reversed
   at the very end. Gran's lullaby is Linnet's theme. */

SONGS.title = {
    bpm: 72, div: 2,
    ch: [
        { wave: 'p25', vol: 0.12, vib: true, n: 'G4 A4 C5 - A4 G4 - - | E5 - D5 C5 D5 - - - | C5 A4 G4 - A4 - C5 - | D5 - - - - - . . | G4 A4 C5 - A4 G4 - - | E5 - G5 - F5 E5 D5 - | C5 - D5 E5 D5 C5 A4 - | C5 - - - - - . .' },
        { wave: 'triangle', vol: 0.22, n: 'C3 - G3 - E3 - G3 - | F2 - C3 - A2 - C3 - | A2 - E3 - C3 - E3 - | G2 - D3 - G2 - B2 - | C3 - G3 - E3 - G3 - | A2 - E3 - C3 - E3 - | F2 - C3 - G2 - D3 - | C3 - G3 - C3 - - -' },
        { wave: 'p12', vol: 0.05, n: 'E4 . G4 . E4 . G4 . | A4 . C5 . A4 . C5 . | E4 . A4 . E4 . A4 . | D4 . G4 . B4 . G4 . | E4 . G4 . E4 . G4 . | E4 . A4 . E4 . A4 . | A4 . C5 . B4 . D5 . | E4 . G4 . C5 - - .' },
    ],
};
SONGS.town = {
    bpm: 104, div: 2,
    ch: [
        { wave: 'p25', vol: 0.11, n: 'G4 A4 C5 - A4 G4 - . | E4 G4 C5 - D5 - E5 - | F5 - E5 D5 C5 - A4 - | G4 - - - - - . . | G4 A4 C5 - A4 G4 - . | E4 G4 C5 - D5 - E5 - | F5 E5 D5 - G4 - B4 - | C5 - - - - - . . | E5 - E5 F5 G5 - E5 - | D5 - D5 E5 F5 - D5 - | C5 - C5 D5 E5 - C5 A4 | B4 - G4 - A4 - B4 - | E5 - E5 F5 G5 - E5 - | D5 - F5 - E5 - D5 - | C5 - E5 - D5 - B4 - | C5 - - - - - . .' },
        { wave: 'triangle', vol: 0.2, n: 'C3 . G3 . C3 . G3 . | C3 . G3 . E3 . G3 . | F2 . C3 . F2 . C3 . | G2 . D3 . G2 . B2 . | C3 . G3 . C3 . G3 . | A2 . E3 . A2 . E3 . | F2 . C3 . G2 . D3 . | C3 . G3 . C3 - - . | C3 . G3 . C3 . G3 . | D3 . A3 . D3 . A3 . | A2 . E3 . A2 . E3 . | G2 . D3 . G2 . D3 . | C3 . G3 . C3 . G3 . | F2 . C3 . F2 . C3 . | G2 . D3 . G2 . D3 . | C3 . G3 . C3 - - .' },
        { wave: 'p12', vol: 0.045, n: '. E4 . G4 . E4 . G4 | . E4 . G4 . G4 . C5 | . A4 . C5 . A4 . C5 | . B4 . D5 . B4 . D5 | . E4 . G4 . E4 . G4 | . E4 . A4 . E4 . A4 | . A4 . C5 . B4 . D5 | . E4 . G4 . E4 . . | . E4 . G4 . E4 . G4 | . F4 . A4 . F4 . A4 | . E4 . A4 . E4 . A4 | . D4 . G4 . B4 . G4 | . E4 . G4 . E4 . G4 | . A4 . C5 . A4 . C5 | . B4 . D5 . B4 . D5 | . E4 . G4 . C5 . .' },
        { drum: true, vol: 0.1, n: 'k . h . s . h . | k . h . s . h h | k . h . s . h . | k . h . s . h . ' },
    ],
};
SONGS.home = {
    bpm: 66, div: 2,
    ch: [
        { wave: 'triangle', vol: 0.2, vib: true, n: 'A4 - C5 - E5 - D5 C5 | A4 - G4 - - - - - | A4 - C5 - D5 - E5 G5 | E5 - - - - - - - | D5 - C5 - A4 - G4 A4 | C5 - A4 - G4 - E4 - | G4 - A4 - C5 - D5 C5 | A4 - - - - - - -' },
        { wave: 'p12', vol: 0.05, n: 'A3 - E4 - A4 - E4 - | F3 - C4 - F4 - C4 - | D3 - A3 - D4 - A3 - | E3 - B3 - E4 - B3 - | F3 - C4 - F4 - C4 - | C3 - G3 - C4 - G3 - | D3 - A3 - E3 - B3 - | A3 - E4 - A4 - - -' },
    ],
};
SONGS.inn = {
    bpm: 132, div: 3,
    ch: [
        { wave: 'p50', vol: 0.09, n: 'D5 - B4 G4 - B4 | D5 - G5 - - . | E5 - C5 A4 - C5 | E5 - A5 - - . | F#5 - D5 A4 - D5 | F#5 - A5 G5 - E5 | D5 - B4 A4 - F#4 | G4 - - - - .' },
        { wave: 'triangle', vol: 0.2, n: 'G2 . . D3 . . | G2 . . D3 . . | A2 . . E3 . . | A2 . . E3 . . | D3 . . A3 . . | D3 . . A2 . . | D3 . . D3 . . | G2 . . G2 . .' },
        { drum: true, vol: 0.08, n: 'k . h s . h | k . h s . h | k . h s . h | k . h s h h' },
    ],
};
SONGS.shop = {
    bpm: 112, div: 2,
    ch: [
        { wave: 'p25', vol: 0.09, n: 'C5 . E5 . G5 . E5 . | F5 . A5 . G5 - - . | E5 . C5 . D5 . B4 . | C5 - - . . . . . ' },
        { wave: 'triangle', vol: 0.18, n: 'C3 . . . G2 . . . | F2 . . . C3 . . . | A2 . . . G2 . . . | C3 . G2 . C3 . . .' },
    ],
};
SONGS.meadow = {
    bpm: 128, div: 2,
    ch: [
        { wave: 'p25', vol: 0.1, n: 'D5 - B4 - G4 - B4 - | C5 - A4 - F#4 - A4 - | B4 - G4 - D5 - G5 - | F#5 - - - E5 - D5 - | D5 - B4 - G4 - B4 - | C5 - E5 - A4 - C5 - | B4 - D5 - A4 - F#4 - | G4 - - - - - . . | E5 - G5 - E5 - D5 - | C5 - E5 - C5 - B4 - | A4 - C5 - B4 - G4 - | A4 - - - - - . . | E5 - G5 - B5 - G5 - | F#5 - D5 - A4 - C5 - | B4 - G4 - A4 - F#4 - | G4 - - - - - . .' },
        { wave: 'triangle', vol: 0.2, n: 'G2 . D3 . G2 . D3 . | D3 . A2 . D3 . A2 . | G2 . D3 . E2 . B2 . | D3 . A2 . D3 . A2 . | G2 . D3 . G2 . D3 . | A2 . E3 . A2 . E3 . | D3 . A2 . D3 . A2 . | G2 . D3 . G2 . . . | C3 . G3 . C3 . G3 . | A2 . E3 . A2 . E3 . | D3 . A3 . G2 . D3 . | D3 . A2 . D3 . A2 . | C3 . G3 . E3 . G3 . | D3 . A3 . D3 . A3 . | D3 . A2 . D3 . A2 . | G2 . D3 . G2 . . .' },
        { drum: true, vol: 0.09, n: 'k . h k s . h . | k . h . s . h h' },
    ],
};
SONGS.tidy = {
    bpm: 120, div: 3,
    ch: [
        { wave: 'p25', vol: 0.09, legato: 0.5, n: 'A4 . C5 . E5 . | D5 . C5 . B4 . | A4 . C5 . E5 . | G#4 - - . . . | A4 . C5 . E5 . | F5 . E5 . D5 . | C5 . B4 . A4 . | E5 - - . . . | F5 . E5 . D5 . | C5 . D5 . E5 . | D5 . C5 . B4 . | A4 . B4 . C5 . | B4 . A4 . G#4 . | A4 . B4 . C5 . | B4 . G#4 . E4 . | A4 - - . . .' },
        { wave: 'triangle', vol: 0.18, legato: 0.4, n: 'A2 . E3 . E3 . | D3 . F3 . F3 . | A2 . E3 . E3 . | E2 . G#2 . G#2 . | A2 . E3 . E3 . | D3 . F3 . F3 . | E2 . G#2 . B2 . | E2 . G#2 . B2 . | D3 . F3 . A3 . | C3 . E3 . G3 . | G2 . B2 . D3 . | A2 . C3 . E3 . | E2 . G#2 . B2 . | A2 . C3 . E3 . | E2 . G#2 . B2 . | A2 . E3 . A2 .' },
        { drum: true, vol: 0.06, n: 'k . h . h . | s . h . h .' },
    ],
};
SONGS.boss = {
    bpm: 150, div: 2,
    ch: [
        { wave: 'p50', vol: 0.08, n: 'E5 . E5 . G5 . E5 . | D#5 . F#5 . B4 . . . | E5 . E5 . G5 . A5 . | B5 - - - A5 . G5 . | C6 . B5 . A5 . G5 . | F#5 . G5 . A5 . F#5 . | E5 . D#5 . E5 . F#5 . | B4 - - - . . . .' },
        { wave: 'triangle', vol: 0.22, n: 'E2 E3 E2 E3 E2 E3 E2 E3 | B1 B2 B1 B2 B1 B2 B1 B2 | E2 E3 E2 E3 E2 E3 E2 E3 | G2 G3 G2 G3 A2 A3 A2 A3 | C3 C4 C3 C4 C3 C4 C3 C4 | D3 D4 D3 D4 D3 D4 D3 D4 | E2 E3 E2 E3 C3 C4 C3 C4 | B1 B2 B1 B2 B1 B2 B1 B2' },
        { wave: 'p25', vol: 0.04, n: 'B4 . G4 . B4 . G4 . | F#4 . D#4 . F#4 . D#4 . | B4 . G4 . B4 . G4 . | D5 . B4 . E5 . C5 . | E5 . C5 . E5 . C5 . | F#5 . D5 . F#5 . D5 . | B4 . G4 . A4 . E4 . | F#4 . D#4 . F#4 . D#4 .' },
        { drum: true, vol: 0.11, n: 'k . h k s . h . | k k h . s . h s' },
    ],
};
SONGS.knot = {
    bpm: 80, div: 2,
    ch: [
        { wave: 'triangle', vol: 0.2, vib: true, n: 'C5 - E5 - G5 - - - | A5 - G5 - E5 - - - | F5 - E5 - D5 - C5 - | C5 - - - - - - - ' },
        { wave: 'p12', vol: 0.05, n: 'C4 G4 E4 G4 C4 G4 E4 G4 | F4 A4 C5 A4 C4 G4 E4 G4 | F4 A4 D4 G4 B4 G4 D4 G4 | C4 G4 E4 G4 C5 - - -' },
    ],
};
SONGS.silence = { bpm: 60, div: 1, ch: [{ wave: 'p12', vol: 0, n: '.' }] };

/* Kilnridge: dry, bright, a bit of a swagger (D Dorian) */
SONGS.kiln = {
    bpm: 112, div: 2,
    ch: [
        { wave: 'p25', vol: 0.1, n: 'D5 - - E5 F5 - A5 - | G5 - F5 - E5 - C5 - | D5 - - E5 F5 - A5 - | B5 - A5 - G5 - - - | A5 - - G5 F5 - E5 - | D5 - C5 - A4 - C5 - | D5 - E5 - F5 - E5 - | D5 - - - - - . . ' },
        { wave: 'triangle', vol: 0.22, n: 'D3 . A3 . D3 . A3 . | C3 . G3 . C3 . G3 . | D3 . A3 . D3 . A3 . | G2 . D3 . G2 . B2 . | F2 . C3 . F2 . C3 . | C3 . G3 . A2 . E3 . | D3 . A3 . C3 . G3 . | D3 . A3 . D3 - - . ' },
        { wave: 'p12', vol: 0.045, n: '. F4 . A4 . F4 . A4 | . E4 . G4 . E4 . G4 | . F4 . A4 . F4 . A4 | . D4 . G4 . B4 . G4 | . F4 . A4 . F4 . A4 | . E4 . G4 . E4 . A4 | . F4 . A4 . E4 . G4 | . F4 . A4 . D4 . . ' },
        { drum: true, vol: 0.1, n: 'k . h h s . h . | k . h . s . h h | k k h . s . h . | k . h . s h h . ' },
    ],
};
/* the Kiln: hot, low, rhythmic (E Phrygian) */
SONGS.kilnhouse = {
    bpm: 96, div: 4,
    ch: [
        { wave: 'p50', vol: 0.07, legato: 0.6, n: 'E4 - . . F4 - . . E4 - . . . . B3 - | C4 - . . B3 - . . A3 - . . . . . . | E4 - . . F4 - . . G4 - . . . . F4 - | E4 - . . . . . . . . . . . . . . ' },
        { wave: 'triangle', vol: 0.24, n: 'E2 . . E2 . . E3 . E2 . . E2 . . F2 . | E2 . . E2 . . E3 . E2 . . D2 . . C2 . | E2 . . E2 . . E3 . E2 . . E2 . . F2 . | E2 . . . . . . . E2 . . F2 . . E2 . ' },
        { drum: true, vol: 0.09, n: 'k . . h . . s . k . h . s . h . | k . . h . . s . k . h . s h h . ' },
    ],
};

/* Millwater: a lilting boat song (F major, 6/8), the Return motif turning up as a ripple in the bass */
SONGS.water = {
    bpm: 96, div: 3,
    ch: [
        { wave: 'p25', vol: 0.09, vib: true, n: 'C5 - A4 F4 - A4 | C5 - D5 C5 - - | Bb4 - G4 E4 - G4 | Bb4 - C5 A4 - - | C5 - A4 F4 - A4 | F5 - E5 D5 - C5 | Bb4 - A4 G4 - A4 | F4 - - - . . | A4 - C5 F5 - E5 | D5 - C5 Bb4 - A4 | G4 - Bb4 D5 - C5 | Bb4 - A4 G4 - . | A4 - C5 F5 - G5 | A5 - G5 F5 - D5 | C5 - A4 G4 - E4 | F4 - - - . .' },
        { wave: 'triangle', vol: 0.2, n: 'F2 . C3 A3 . C3 | F2 . C3 A3 . C3 | C2 . G2 Bb2 . G2 | F2 . C3 A3 . C3 | F2 . C3 A3 . C3 | Bb2 . F3 D3 . F3 | C3 . G3 E3 . G3 | F2 . C3 F3 . . | D2 . A2 F3 . A2 | Bb2 . F3 D3 . F3 | G2 . D3 Bb2 . D3 | C3 . G3 E3 . G3 | F2 . C3 A3 . C3 | D3 . A3 F3 . A3 | C3 . G3 A3 . C3 | F2 . C3 F2 . .' },
        { wave: 'p12', vol: 0.04, n: '. . F4 . . A4 | . . F4 . . A4 | . . E4 . . G4 | . . F4 . . A4 | . . F4 . . A4 | . . D4 . . F4 | . . E4 . . G4 | . . A4 . . . | . . F4 . . A4 | . . D4 . . F4 | . . D4 . . G4 | . . E4 . . G4 | . . F4 . . A4 | . . F4 . . A4 | . . E4 . . G4 | . . A4 . . .' },
    ],
};
/* the Millrace: water and machinery (D Dorian), a steady wheel in the bass, the tune running over it */
SONGS.millrace = {
    bpm: 132, div: 2,
    ch: [
        { wave: 'p25', vol: 0.08, legato: 0.6, n: 'D5 - . F5 E5 - D5 - | C5 - A4 - B4 - C5 - | D5 - . F5 G5 - A5 - | G5 - F5 - E5 - - - | F5 - . E5 D5 - C5 - | B4 - G4 - A4 - B4 - | C5 - D5 - E5 - C5 - | D5 - - - . . . . ' },
        { wave: 'triangle', vol: 0.22, n: 'D2 . A2 D3 . A2 D3 . | C2 . G2 C3 . G2 C3 . | D2 . A2 D3 . A2 D3 . | A1 . E2 A2 . E2 A2 . | Bb1 . F2 Bb2 . F2 Bb2 . | G1 . D2 G2 . D2 G2 . | A1 . E2 A2 . C#3 A2 . | D2 . A2 D3 . A2 D2 . ' },
        { wave: 'p12', vol: 0.04, n: 'F4 A4 F4 A4 F4 A4 F4 A4 | E4 G4 E4 G4 E4 G4 E4 G4 | F4 A4 F4 A4 F4 A4 F4 A4 | E4 A4 E4 A4 C#4 E4 C#4 E4 | F4 Bb4 F4 Bb4 F4 Bb4 F4 Bb4 | D4 G4 D4 G4 D4 G4 B4 G4 | E4 A4 E4 A4 C#4 E4 G4 E4 | F4 A4 F4 A4 D4 F4 A4 . ' },
        { drum: true, vol: 0.08, n: 'k . h . s . h . | k . h k s . h h' },
    ],
};

/* Belfry Heights: wide open, windy (A mixolydian), a horn-call tune over open fifths */
SONGS.heights = {
    bpm: 100, div: 2,
    ch: [
        { wave: 'p25', vol: 0.09, vib: true, n: 'E5 - - - A5 - G5 - | E5 - D5 - E5 - - - | C#5 - E5 - A5 - B5 - | G5 - - - - - . . | A5 - - - G5 - E5 - | D5 - E5 - G5 - A5 - | B5 - A5 - G5 - E5 - | A5 - - - - - . . ' },
        { wave: 'triangle', vol: 0.2, n: 'A2 . E3 . A2 . E3 . | G2 . D3 . G2 . D3 . | A2 . E3 . A2 . E3 . | D2 . A2 . G2 . D3 . | A2 . E3 . A2 . E3 . | G2 . D3 . G2 . D3 . | D2 . A2 . E2 . B2 . | A2 . E3 . A2 . . . ' },
        { wave: 'p12', vol: 0.035, n: 'A4 . E4 . A4 . E4 . | G4 . D4 . G4 . D4 . | A4 . E4 . A4 . E4 . | F#4 . D4 . G4 . D4 . | A4 . E4 . A4 . E4 . | G4 . D4 . G4 . D4 . | F#4 . A4 . G4 . B4 . | A4 . E4 . A4 . . . ' },
    ],
};
/* the Belfry: a peal (G major), bells changing over a steady stroke */
SONGS.belfry = {
    bpm: 120, div: 2,
    ch: [
        { wave: 'p12', vol: 0.07, n: 'G5 . D5 . B4 . G4 . | A4 . B4 . D5 . G5 . | G5 . E5 . C5 . A4 . | B4 . D5 . G5 . D5 . | E5 . C5 . G4 . C5 . | D5 . B4 . G4 . B4 . | C5 . A4 . F#4 . A4 . | G4 . . . G5 . . . ' },
        { wave: 'p25', vol: 0.07, legato: 0.7, n: 'B4 - - - - - - - | C5 - - - - - - - | C5 - - - - - - - | B4 - - - - - - - | C5 - - - - - - - | B4 - - - - - - - | A4 - - - - - - - | G4 - - - - - - - ' },
        { wave: 'triangle', vol: 0.2, n: 'G2 . . . D3 . . . | D2 . . . G2 . . . | C3 . . . A2 . . . | G2 . . . D3 . . . | C3 . . . G2 . . . | G2 . . . D3 . . . | D3 . . . A2 . . . | G2 . . . G2 . . . ' },
        { drum: true, vol: 0.05, n: 'k . . . h . . . | k . . . s . . . ' },
    ],
};

/* Gran's lullaby (Linnet's theme): low, high, in between, high, low */
SONGS.lullaby = {
    bpm: 66, div: 2,
    ch: [
        { wave: 'triangle', vol: 0.16, vib: true, n: 'G4 - - - D5 - - - B4 - - - D5 - - - | G4 - - - - - - - . . . . . . . . ' },
        { wave: 'p12', vol: 0.04, n: 'G3 . D4 . B3 . D4 . G3 . D4 . B3 . D4 . | G3 . D4 . B3 . D4 . G3 . . . . . . . ' },
    ],
};

/* the Knotting Festival: a jig (D major), the town's tune dancing */
SONGS.festival = {
    bpm: 144, div: 3,
    ch: [
        { wave: 'p25', vol: 0.09, n: 'D5 . F#5 A5 . F#5 | E5 . D5 C#5 . A4 | B4 . D5 G5 . F#5 | E5 . C#5 A4 . . | D5 . F#5 A5 . B5 | A5 . F#5 D5 . F#5 | E5 . G5 F#5 . E5 | D5 . . D5 . . ' },
        { wave: 'triangle', vol: 0.2, n: 'D3 . A3 D3 . A3 | A2 . E3 A2 . E3 | G2 . D3 G2 . D3 | A2 . E3 A2 . C#3 | D3 . A3 D3 . A3 | D3 . A3 F#3 . A3 | A2 . E3 A2 . E3 | D3 . A2 D3 . . ' },
        { drum: true, vol: 0.08, n: 'k . h s . h | k . h s h h' },
    ],
};

/* Hushwood: a slow lullaby of a waltz (D dorian), half asleep itself */
SONGS.hush = {
    bpm: 80, div: 2,
    ch: [
        { wave: 'triangle', vol: 0.17, vib: true, n: 'D5 - - - F5 E5 | D5 - - - A4 - | C5 - - - E5 D5 | C5 - - - G4 - | Bb4 - - - D5 C5 | A4 - F4 - G4 - | A4 - - - - - | . . . . . . | D5 - - - F5 E5 | D5 - A4 - C5 - | Bb4 - - - A4 G4 | F4 - G4 - A4 - | Bb4 - A4 - G4 - | E4 - F4 - E4 - | D4 - - - - - | . . . . . . ' },
        { wave: 'triangle', vol: 0.18, n: 'D3 - - A3 - - | D3 - - A3 - - | C3 - - G3 - - | C3 - - G3 - - | Bb2 - - F3 - - | F2 - - C3 - - | A2 - - E3 - - | A2 - - - - - | D3 - - A3 - - | F2 - - C3 - - | G2 - - D3 - - | D3 - - A3 - - | G2 - - D3 - - | A2 - - E3 - - | D3 - - A3 - - | D3 - - - - - ' },
        { wave: 'p12', vol: 0.035, n: '. F4 A4 . F4 A4 | . F4 A4 . F4 A4 | . E4 G4 . E4 G4 | . E4 G4 . E4 G4 | . D4 F4 . D4 F4 | . C4 F4 . C4 F4 | . C#4 E4 . C#4 E4 | . C#4 E4 . . . | . F4 A4 . F4 A4 | . C4 F4 . C4 F4 | . D4 G4 . D4 G4 | . F4 A4 . F4 A4 | . D4 G4 . D4 G4 | . C#4 E4 . C#4 E4 | . F4 A4 . F4 A4 | . . . . . . ' },
    ],
};
/* the Slumberhouse: a music box winding down (F major), the hush of a clock that isn't there */
SONGS.slumber = {
    bpm: 92, div: 2,
    ch: [
        { wave: 'p12', vol: 0.075, n: 'C6 . A5 . F5 . | G5 . A5 . C6 . | Bb5 . G5 . E5 . | F5 . G5 . A5 . | D6 . Bb5 . G5 . | A5 . Bb5 . C6 . | A5 . F5 . G5 . | F5 . . . . . | C6 . A5 . F5 . | G5 . A5 . Bb5 . | A5 . F5 . D5 . | E5 . F5 . G5 . | Bb5 . A5 . G5 . | F5 . E5 . D5 . | C5 . E5 . G5 . | F5 . . . . . ' },
        { wave: 'triangle', vol: 0.16, legato: 0.8, n: 'F3 - - C4 - - | C3 - - G3 - - | C3 - - E3 - - | F3 - - C4 - - | Bb2 - - F3 - - | F2 - - C3 - - | C3 - - E3 - - | F3 - - - - - | F3 - - C4 - - | E3 - - C4 - - | D3 - - A3 - - | C3 - - G3 - - | G2 - - D3 - - | A2 - - D3 - - | C3 - - G3 - - | F2 - - - - - ' },
        { drum: true, vol: 0.03, n: 'h . . . h . | h . . . h . ' },
    ],
};
/* Larkspur Fair: a calliope waltz with nobody to dance to it (A minor, a little off) */
SONGS.fair = {
    bpm: 132, div: 1,
    ch: [
        { wave: 'p25', vol: 0.08, vib: true, n: 'E5 - - | C5 D5 E5 | A5 - - | G5 - - | F5 - E5 | D5 - C5 | B4 - - | E5 - - | E5 - - | C5 D5 E5 | A5 - - | C6 - - | B5 - A5 | G#5 - B5 | A5 - - | . . . ' },
        { wave: 'triangle', vol: 0.18, n: 'A2 E3 E3 | A2 E3 E3 | F2 C3 C3 | C3 G3 G3 | D3 A3 A3 | A2 E3 E3 | E2 B2 B2 | E2 G#2 B2 | A2 E3 E3 | A2 E3 E3 | F2 C3 C3 | A2 E3 E3 | D3 A3 A3 | E2 B2 B2 | A2 E3 A3 | A2 . . ' },
        { wave: 'p12', vol: 0.04, n: '. C4 E4 | . C4 E4 | . A3 C4 | . C4 E4 | . D4 F4 | . C4 E4 | . G#3 D4 | . G#3 B3 | . C4 E4 | . C4 E4 | . A3 C4 | . C4 E4 | . D4 F4 | . G#3 D4 | . C4 E4 | . . . ' },
        { drum: true, vol: 0.05, n: 'k . h | s . h ' },
    ],
};
/* the Marionette Hall: a music-hall overture on a toy piano (G major, then the minor for the dark wings) */
SONGS.marionette = {
    bpm: 112, div: 2,
    ch: [
        { wave: 'p12', vol: 0.08, n: 'G5 . B5 . D6 . B5 . | C6 . A5 . F#5 . A5 . | G5 . D5 . B4 . D5 . | E5 - - . D5 - - . | G5 . B5 . D6 . B5 . | E6 . C6 . A5 . C6 . | B5 . G5 . A5 . F#5 . | G5 - - - . . . . | Bb5 . G5 . D5 . G5 . | A5 . F5 . C5 . F5 . | G5 . Eb5 . Bb4 . Eb5 . | D5 - - . . . . . | B5 . G5 . D5 . G5 . | C6 . A5 . F#5 . A5 . | B5 . A5 . G5 . F#5 . | G5 - - - . . . . ' },
        { wave: 'triangle', vol: 0.18, n: 'G2 . D3 . G2 . D3 . | D2 . A2 . D2 . A2 . | G2 . D3 . G2 . D3 . | C3 . G2 . D3 . A2 . | G2 . D3 . G2 . D3 . | C3 . G3 . C3 . G3 . | D3 . A2 . D3 . A2 . | G2 . D3 . G2 . . . | G2 . D3 . G2 . D3 . | F2 . C3 . F2 . C3 . | Eb2 . Bb2 . Eb2 . Bb2 . | D2 . A2 . D2 . . . | G2 . D3 . G2 . D3 . | D2 . A2 . D2 . A2 . | D3 . C3 . B2 . A2 . | G2 . D3 . G2 . . . ' },
        { drum: true, vol: 0.05, n: 'k . h . s . h . | k . h . s . h h ' },
    ],
};
/* the Underside: a warm workshop under the floorboards, everything ticking (A minor, unhurried) */
SONGS.underside = {
    bpm: 96, div: 2,
    ch: [
        { wave: 'p25', vol: 0.06, n: 'A4 . C5 . E5 . D5 . | C5 . B4 . A4 . . . | G4 . B4 . D5 . C5 . | B4 . A4 . G4 . . . | F4 . A4 . C5 . B4 . | A4 . G4 . F4 . E4 . | E4 . G#4 . B4 . D5 . | C5 . B4 . A4 . . . ' },
        { wave: 'triangle', vol: 0.17, n: 'A2 . . . E3 . . . | A2 . . . E3 . . . | G2 . . . D3 . . . | G2 . . . D3 . . . | F2 . . . C3 . . . | F2 . . . C3 . . . | E2 . . . B2 . . . | A2 . . . E3 . . . ' },
        { drum: true, vol: 0.03, n: 'h . h . h . h . ' },
    ],
};
/* the Spoolworks: spindles and shuttles, a machine that never stops (E minor, driving) */
SONGS.spoolworks = {
    bpm: 120, div: 2,
    ch: [
        { wave: 'p12', vol: 0.07, n: 'E5 . . G5 . . F#5 . | E5 . D5 . B4 . . . | C5 . . E5 . . D5 . | C5 . B4 . A4 . . . | E5 . . G5 . . B5 . | A5 . G5 . F#5 . E5 . | D5 . F#5 . A5 . F#5 . | E5 - - - . . . . ' },
        { wave: 'triangle', vol: 0.17, n: 'E2 E3 B2 E3 E2 E3 B2 E3 | E2 E3 B2 E3 E2 E3 B2 E3 | C3 C4 G3 C4 C3 C4 G3 C4 | A2 A3 E3 A3 A2 A3 E3 A3 | E2 E3 B2 E3 E2 E3 B2 E3 | C3 C4 G3 C4 C3 C4 G3 C4 | D3 D4 A3 D4 D3 D4 A3 D4 | B2 B3 F#3 B3 B2 B3 F#3 B3 ' },
        { drum: true, vol: 0.06, n: 'k . h . s . h . | k . h k s . h h ' },
    ],
};

