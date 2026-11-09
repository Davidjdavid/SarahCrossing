/* the songs. Each is played by something on the island. */
song('village', {
    bpm: 108, parts: [
        { wave: 'pulse', vol: 0.22, notes: `
E5 . G5 . A5 . G5 . E5 . D5 . C5 . . .   D5 . E5 . F5 . E5 . D5 . C5 . A4 . . .
E5 . G5 . A5 . C6 . B5 . A5 . G5 . . .   F5 . E5 . D5 . G5 . C5 . . . - - - -
A4 . C5 . E5 . D5 . C5 . A4 . G4 . . .   F4 . A4 . C5 . B4 . A4 . G4 . E4 . . .
F4 . A4 . C5 . F5 . E5 . D5 . C5 . . .   D5 . . . B4 . . . C5 . . . - - - -` },
        { wave: 'triangle', vol: 0.32, notes: `
C3 . . . G3 . . . C3 . . . G3 . . .   F3 . . . C3 . . . F3 . . . C3 . . .
A2 . . . E3 . . . F3 . . . C3 . . .   F3 . . . G3 . . . C3 . G3 . C3 . . .
A2 . . . E3 . . . A2 . . . E3 . . .   F2 . . . C3 . . . C3 . . . E3 . . .
F2 . . . C3 . . . F2 . . . A2 . . .   G2 . . . G2 . . . C3 . G2 . C3 . . .` },
        { wave: 'pulse', vol: 0.08, notes: `
- - G4 - - - E4 - - - G4 - - - E4 -   - - A4 - - - F4 - - - A4 - - - E4 -
- - C5 - - - A4 - - - C5 - - - A4 -   - - A4 - - - B4 - - - G4 - - - - -
- - E4 - - - C4 - - - E4 - - - C4 -   - - C4 - - - A3 - - - G4 - - - E4 -
- - A4 - - - F4 - - - C5 - - - A4 -   - - F4 - - - D4 - - - E4 - - - - -` },
        { wave: 'noise', vol: 0.6, notes: `
k - h - s - h - k - h - s - h h   k - h - s - h - k - h - s - h h
k - h - s - h - k - h - s - h h   k - h - s - h - k k h - s - - -
k - h - s - h - k - h - s - h h   k - h - s - h - k - h - s - h h
k - h - s - h - k - h - s - h h   k - h - s - h - k - s - s s s -` },
    ],
});
/* Pan's pipe, out in the pasture */
song('pasture', {
    bpm: 120, parts: [
        { wave: 'triangle', vol: 0.3, oct: 1, notes: `
G4 . A4 B4 D5 . B4 . A4 . G4 . E4 . D4 .   E4 . G4 . A4 . B4 . A4 . G4 . A4 . . .
G4 . A4 B4 D5 . E5 . D5 . B4 . A4 . G4 .   E4 . D4 . E4 . G4 . G4 . . . - - - -` },
        { wave: 'triangle', vol: 0.3, notes: `
G2 . D3 . G2 . D3 . C3 . G3 . C3 . G3 .   C3 . G3 . C3 . G3 . D3 . A3 . D3 . . .
G2 . D3 . G2 . D3 . E3 . B3 . C3 . G3 .   C3 . D3 . G2 . D3 . G2 . . . - - - -` },
        { wave: 'noise', vol: 0.4, notes: `
h - - h - - s - h - - h - - s -   h - - h - - s - h - - h - - s -
h - - h - - s - h - - h - - s -   h - - h - - s - h - - - - - - -` },
    ],
});
/* the falls hum in the quarry */
song('quarry', {
    bpm: 92, parts: [
        { wave: 'pulse', vol: 0.12, notes: `
A4 C5 E5 A5 E5 C5 A4 C5 E5 A5 E5 C5   G4 B4 D5 G5 D5 B4 G4 B4 D5 G5 D5 B4
F4 A4 C5 F5 C5 A4 F4 A4 C5 F5 C5 A4   E4 G#4 B4 E5 B4 G#4 E4 G#4 B4 E5 B4 G#4` },
        { wave: 'triangle', vol: 0.34, notes: `
A2 . . . . . . . . . . .   G2 . . . . . . . . . . .
F2 . . . . . . . . . . .   E2 . . . . . . . . . . .` },
        { wave: 'triangle', vol: 0.22, oct: 1, notes: `
- - - - E4 . . . D4 . C4 .   B3 . . . . . G3 . . . . .
A3 . . . C4 . . . F4 . . .   E4 . . . . . . . . . . .` },
    ],
});
/* the wind chimes in the woods: a music-box waltz */
song('woods', {
    bpm: 100, parts: [
        { wave: 'pulse', vol: 0.16, oct: 1, notes: `
D5 . A4 . F#4 . A4 . D5 . E5 .   F#5 . . . E5 . D5 . C#5 . A4 .
B4 . G4 . D4 . G4 . B4 . D5 .   A4 . . . . . . . . . . .
D5 . A4 . F#4 . A4 . D5 . E5 .   F#5 . . . A5 . G5 . F#5 . E5 .
D5 . B4 . G4 . A4 . . . C#5 .   D5 . . . . . . . - - - -` },
        { wave: 'triangle', vol: 0.3, notes: `
D3 . . . A3 . . . A3 . . .   D3 . . . A3 . . . A3 . . .
G2 . . . D3 . . . D3 . . .   A2 . . . E3 . . . E3 . . .
D3 . . . A3 . . . A3 . . .   D3 . . . A3 . . . A3 . . .
G2 . . . D3 . . . A2 . . .   D3 . . . A3 . . . D3 . . .` },
    ],
});
/* the Faded, and the chapel's organ */
song('hollow', {
    bpm: 66, parts: [
        { wave: 'sine', vol: 0.2, notes: `
E4 . . . . . . . G4 . . . . . . .   F#4 . . . . . . . D#4 . . . . . . .
E4 . . . . . . . C5 . . . . . . .   B4 . . . . . . . . . . . . . . .` },
        { wave: 'sine', vol: 0.16, notes: `
B3 . . . . . . . E4 . . . . . . .   D4 . . . . . . . B3 . . . . . . .
G3 . . . . . . . A3 . . . . . . .   F#3 . . . . . . . D#4 . . . . . . .` },
        { wave: 'triangle', vol: 0.24, oct: -1, notes: `
E3 . . . . . . . C3 . . . . . . .   B2 . . . . . . . B2 . . . . . . .
C3 . . . . . . . A2 . . . . . . .   B2 . . . . . . . B2 . . . . . . .` },
        { wave: 'triangle', vol: 0.14, oct: 1, notes: `
- - - - B4 . A4 . G4 . . . F#4 . E4 .   F#4 . . . . . . . - - - - - - - -
- - - - E4 . F#4 . G4 . . . A4 . B4 .   B4 . . . . . . . - - - - - - - -` },
    ],
});
/* the Eye's own (the last act) */
song('eye', {
    bpm: 84, parts: [
        { wave: 'sine', vol: 0.14, oct: 1, notes: `
C4 E4 G4 C5 E4 G4 C5 E5   A3 C4 E4 A4 C4 E4 A4 C5   F3 A3 C4 F4 A3 C4 F4 A4   G3 B3 D4 G4 B3 D4 G4 B4` },
        { wave: 'triangle', vol: 0.26, notes: `
C3 . . . . . . .   A2 . . . . . . .   F2 . . . . . . .   G2 . . . . . . .` },
        { wave: 'triangle', vol: 0.2, oct: 1, notes: `
G4 . . . E4 . . .   C5 . . . . . . .   A4 . . . F4 . . .   D4 . . . . . . .` },
    ],
});
/* a little music box (home), and the lit lighthouse */
song('lullaby', {
    bpm: 76, parts: [
        { wave: 'pulse', vol: 0.14, oct: 1, notes: `
E5 . C5 . G4 . C5 . E5 . G5 . E5 . . .   F5 . D5 . A4 . D5 . F5 . A5 . F5 . . .
E5 . C5 . G4 . C5 . E5 . D5 . C5 . . .   D5 . B4 . G4 . B4 . C5 . . . . . . .` },
        { wave: 'triangle', vol: 0.24, notes: `
C3 . . . G3 . . . C3 . . . G3 . . .   D3 . . . A3 . . . D3 . . . A3 . . .
C3 . . . G3 . . . A2 . . . E3 . . .   G2 . . . D3 . . . C3 . . . . . . .` },
    ],
});
