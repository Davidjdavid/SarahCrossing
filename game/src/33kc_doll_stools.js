/* ---- 33kc_doll_stools.js ---- */
/* A food folk working behind a counter stands on a stool, or its face would be hidden by the counter (David, 26 October:
   "give them chairs or stools in those scenarios for them to stand on"): a room whose staff is a folk has a wooden step
   stool at the staff's spot (style_stool, tools/blender/props2.py), and the folk stands on it while it's there. */
const EnvStools = {
    H: 0.3,
    /* where a room's staff stands (tiles), if the staff is a folk */
    spot(a) {
        const R = a && a.room;
        if (!R || !R.staffAt || !R.staff) return null;
        const d = NPC_DEFS[R.staff];
        if (!d || d.human) return null;
        const [x, y] = toArea(...R.staffAt);
        return [x + 0.5, y + 0.5 + 4 / TILE];
    },
    /* how high a folk stands: on the stool while it's at the spot */
    height(e) {
        const a = G.area, s = this.spot(a);
        // (only while the stool is there: it comes with the style test's models, maybe after the room was first built)
        if (!s || !e.def || e.def.human || e.area !== a.id || typeof EnvModels === 'undefined' || !EnvModels.has('style_stool')) return 0;
        return Math.hypot(e.x / TILE - s[0], e.y / TILE - s[1]) < 0.45 ? this.H : 0;
    },
    /* the stool itself, among the room's furniture (EnvRoom.furniture) */
    build(g, a) {
        const s = this.spot(a);
        if (!s || typeof EnvModels === 'undefined' || !EnvModels.has('style_stool')) return;
        EnvModels.instances(g, 'style_stool', [new THREE.Matrix4().makeTranslation(s[0], 0, s[1] * R3_ZS)]);
    },
};
