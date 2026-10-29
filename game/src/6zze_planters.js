/* ---- 6zze_planters.js ---- */
/* Sarah's planter boxes (David, 29 October): no longer fixed by her house. Six come in the mail from Fortune after her
   first visit to the shop, to set down wherever she likes in Island edit, and pick up again while nothing's growing in
   them. Each is one of her garden plots: S.plots[i] is what grows in it, S.planters[i] where it stands ([x, y], or null
   while it's in storage). The community garden's beds keep their numbers after hers (W0.plots with c). */
const PLANTERS = 6;
DISPLAYS.dp_planterbox = { name: 'Planter box', price: 600, w: 1, frame: 'plot_0', plot: true };
ITEMS.dp_planterbox = { name: 'Planter box', type: 'display', price: 600, icon: 'plot_0', keep: true };
function planters() { if (!S.planters) S.planters = []; return S.planters; }
function addPlanters(a) { if (S) planters().forEach((xy, i) => { if (xy && i < PLANTERS) addPlotEnt(a, i, xy[0], xy[1], false); }); }
function freePlanter() { const P = planters(); for (let i = 0; i < PLANTERS; i++) if (!P[i]) return i; return -1; }
/* the first time Sarah's been in Fortune's shop: the planters come in the mail */
function planterMail() {
    if (!S || !S.started || S.flags.planterMail || Online.visitor()) return;
    S.flags.planterMail = 1;
    S.mail.push({ id: S.mailSeq++, from: 'fortune', subject: 'For your garden', read: false, claimed: false, gift: null, gifts: new Array(PLANTERS).fill('dp_planterbox'), day: Clock.dayNum(),
        body: `Sarah! Thanks for stopping by the shop. Every new islander gets a garden, so here are ${PLANTERS} planter boxes. `
            + 'Set them down wherever you like (on your phone: Island edit), then plant seeds from the shop in them. '
            + 'Two days and they\'re ready to pick. No watering needed. This island doesn\'t do chores.\n- Fortune' });
    Save.touch();
    HUD.update();
}
Bus.on('enter', id => { if (id === 'shop') planterMail(); });
