/* Starting a Wander, place names, and the content hook. The prologue and everyone's lines live in the
   content files; this is what ties them together. */

Story.begin = function (opts = {}) {
    if (opts.area) { World.enter(opts.area, opts.x, opts.y); return; }
    if (typeof Prologue !== 'undefined' && !opts.skipIntro) { Prologue.start(); return; }
    World.enter(START.area, START.x, START.y, { dir: DOWN });
};
Story.placeName = function (id) {
    if (!id || !AREAS[id]) return '';
    return AREAS[id].place || AREAS[id].name || '';
};

function initContent() {
    for (const f of CONTENT_INIT) f();
}
