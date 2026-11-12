/* The mix: each tune's and each effect's level in dB, from rendering every one of them through the synth (offline,
   in Chromium) and measuring it: a tune's loudness integrated over two passes (BS.1770, LUFS), an effect's over its
   loudest 100 ms. At the default volumes every tune plays at about -28 LUFS. Under that, on purpose: Gran's lullaby,
   the Unfinished House, the Loom and the Slumberhouse 3 dB (tender, still, a music box winding down), Hushwood 2 (half
   asleep); the Tidyhouse 2 (its minuet is all short notes, so it peaks high for its loudness: it is held where its
   loudest beat only just reaches the limiter's knee with the volume at the top, as the loudest House tunes' do).
   Effects stand by what they mean against the tune under them: a find or a Knot 2-4 dB over it, a hit or a door about
   level, plates, threads and landings a little under, the menus 5-8 under, a letter of talk 14 under. Measured by
   tests/browser.mjs `audio`, which fails if one drifts out of its place. */

Object.assign(SONG_LEVEL, {
    title: -3.2, town: 0.6, home: -3.0, inn: 2.5, shop: 4.3, meadow: 0.9,
    tidy: 4.1, boss: -1.8, knot: -3.1, kiln: -0.1, kilnhouse: 2.2, water: 0.5,
    millrace: 0.5, heights: 1.4, belfry: 3.3, lullaby: -4.1, festival: 0.3, hush: -6.1,
    slumber: -2.8, fair: -1.1, marionette: 2.5, underside: 4.2, spoolworks: -0.2, loomwood: -1.7,
    loom: -2.3, drift: -2.2, pull: 0.6, boss_tidy: -2.2, boss_kiln: -1.6, boss_mill: -1.2,
    boss_belfry: -2.1, greatspool: 1.7, boss_slumber: -1.7, boss_marionette: -1.9, boss_spoolworks: -2.3, boss_loom: -1.7,
    makings: 4.7, unfinished: -0.7,
});

Object.assign(SFX_LEVEL, {
    push: 12.8, home: 6.9, pop: -6.3, twang: 9.1, click: 6.4, unclick: 10.1, door: -4.5, doorshut: -5.2,
    unlock: -2.6, chest: 8.2, item: -1.2, smallitem: 7.2, heart: 9.5, button: 8.5, swing: 4.8, hitthing: 6.0,
    hurt: 4.5, enemyhit: 4.6, unravel: 7.8, fall: -4.6, splash: -1.4, flight: 10.5, land: 17.7, lift: 6.2,
    throw: 5.9, shatter: -2.7, crystal: -1.0, appear: -3.8, blip: 5.5, blipLow: 5.8, menu: 7.4, select: 3.8,
    cancel: 6.1, bell: -5.9, knot: -4.5, hook: 7.2, hookhit: 4.4, step: 20.0, tug: -0.8, save: -1.8,
    boss: 5.4, rumble: 11.1, chime: -3.2, warn: 11.0, winch: 3.6, baa: 6.5, vent: -5.2, lay: -4.0,
    yawn: -6.5, boing: -7.0, crumble: -0.6, snort: 5.0, puff: 2.6, tie: 0.2, thud: -1.7, snip: 7.5,
    charm: -3.5,
});
