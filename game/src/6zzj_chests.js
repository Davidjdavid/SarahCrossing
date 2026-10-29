/* ---- 6zzj_chests.js ---- */
/* Chests (David, 29 October): one Sarah has opened stays open from then on (the barn's old trunk, the lighthouse keeper's
   sea chest: their models in furn_l.py with the lid thrown back, Quests.barnTrunk and lighthouseChest), and the Bank's
   chests are shut with big padlocks (bank_chest, bank_trunk, in its vault corner). */
const CHEST_FURN = { lh_trunk_open: 'Sea chest', old_trunk_open: 'Old trunk', bank_chest: 'Vault chest', bank_trunk: 'Vault trunk' };
for (const [id, name] of Object.entries(CHEST_FURN)) {
    ITEMS[id] = { name, type: 'furniture', price: 0, icon: 'f_' + id };
    FURN[id] = { id, name, w: 1, h: 1, kind: 'floor', price: 0, sets: ['fixture'], fixture: 1 };
}
/* the barn's old trunk: open once Sarah has found the note in it */
function barnTrunkId() { return S && (Quests.stage('treasure') >= 1 || Quests.done('treasure')) ? 'old_trunk_open' : 'old_trunk'; }
