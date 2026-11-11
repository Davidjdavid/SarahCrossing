/* Wren's tally: every time she's been brought home without choosing it, counted from the start of the Wander. A fall,
   a sink or a doze flown home along her thread (by where it happened); a faint (to bed, or to a House's door); the fog
   turning her back; Gran's own pull in the Hall of Names. A Homeward flight to the Bedroll is Wren's doing, so it isn't
   counted; nor is a fall where nothing pulls (the Stray House, or once her thread is cut: she climbs out).
   The Hall of Names shows it (her spool, the ledger's last page, src/69_reveal2.js); the Spool can too.
   A Wander begun with this counting in place says so (Stats.c.tally); an older save hasn't the mark, nor has a preset
   (it skips the play before it), and then whatever reads the tally says it without a number: never a number that's
   short, never "not once" for someone who did. (Everything here lives in the save's own counters and flags: nothing
   for Save.migrate to change; an old save simply has none of it.) */

const Tally = {
    /* do the counts go back to the start of this Wander? */
    kept() { return !!(Stats.c && Stats.c.tally); },
    fogs() { return Progress.get('fogTries') || 0; },
    /* times brought home in all, or null if this save can't say */
    home() {
        if (!this.kept()) return null;
        const c = Stats.c;
        return (c['home:fall'] || 0) + (c.faints || 0) + this.fogs() + (c['home:yank'] || 0);
    },
    /* the rows of the tally, longest first: [heading, count]. Falls by the place they happened, then FAINTED, then THE
       FOG (null if this save can't say) */
    rows() {
        if (!this.kept()) return null;
        const rows = [];
        for (const [k, n] of Object.entries(Stats.c)) if (k.startsWith('home@') && n > 0) rows.push([this.heading(k.slice(5)), n]);
        if (Stats.c.faints) rows.push(['FAINTED', Stats.c.faints]);
        if (this.fogs()) rows.push(['THE FOG', this.fogs()]);
        return rows.sort((a, b) => b[1] - a[1]);
    },
    /* where a fall happened: a House by its name, the valley by its region ("hollow:millwater") */
    placeOf(area, tx, ty) {
        if (area.id !== 'hollow' || typeof OW === 'undefined') return area.id;
        const b = OW.blocks[Math.floor(tx / OW.bw) + ',' + Math.floor(ty / OW.bh)];
        return 'hollow:' + (b && b.id ? b.id : '');
    },
    heading(place) {
        const [id, blk] = place.split(':');
        const b = blk && typeof OW !== 'undefined' && Object.values(OW.blocks).find(q => q.id === blk);
        const name = (b && b.name) || (AREAS[id] && AREAS[id].name) || 'THE VALLEY';
        return name.replace(/^The /, '').toUpperCase();
    },
    /* Wren's pulls on Tuck's own thread in his Little Houses (src/68_makings.js counts them, from the day the Makings
       were built; but a preset skips them, so only a kept tally gives the number) */
    tuck() { return this.kept() ? (Stats.c['tuck:yanked'] || 0) : null; },
};

/* a number as Gran writes it (figures past a few hundred) */
function numWords(n) {
    const ONES = ['nought', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    if (n < 20) return ONES[n];
    if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
    if (n < 1000) return (n < 200 ? 'a hundred' : ONES[Math.floor(n / 100)] + ' hundred') + (n % 100 ? ' and ' + numWords(n % 100) : '');
    return String(n);
}
function numTimes(n) { return n === 1 ? 'once' : n === 2 ? 'twice' : numWords(n) + ' times'; }

/* a new Wander keeps the tally from its first step */
{
    const begin0 = Story.begin;
    Story.begin = function () { Stats.c.tally = 1; return begin0.apply(this, arguments); };
}
/* a fall, a sink or a doze, flown home along her thread (not a Homeward flight: that one she chose) */
{
    const fly0 = Player.prototype.flyHome;
    Player.prototype.flyHome = function (opts = {}) {
        if (this.state === 'fall' && !opts.homeward && this.area) { Stats.count('home:fall'); Stats.count('home@' + Tally.placeOf(this.area, this.tx, this.ty)); }
        return fly0.apply(this, arguments);
    };
}
