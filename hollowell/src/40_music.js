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
