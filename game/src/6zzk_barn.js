/* ---- 6zzk_barn.js ---- */
/* The barn is locked (David, 29 October): nobody ever gave Sarah a key when she moved in. The first neighbor (not Joe)
   she becomes friends with (two hearts) notices and mails her one the next morning; with it the barn opens, for good. */
ITEMS.q_barnkey = { name: 'Barn key', type: 'quest', price: 0, icon: 'ic_lost_keys', keep: true };
const BARN_KEY_HEARTS = 2;
function barnOpen() {
    if (!S || S.flags.barnKey) return true;
    if (pocketCount('q_barnkey') || (S.storage && S.storage.q_barnkey)) { S.flags.barnKey = Clock.dayNum(); Save.touch(); return true; }
    return false;
}
async function lockedBarn() {
    await UI.say(null, S.flags.barnKeySent ? "The barn's locked. The key came in the mail: it's waiting in Sarah's mailbox."
        : ["The barn's big doors are locked. A padlock the size of a sandwich hangs on the latch.", 'Come to think of it, nobody ever gave Sarah a key to the barn when she moved in. Maybe one of the neighbors has a spare?']);
}
const BARN_KEY_LINES = {
    default: n => `Sarah!\nI just realized: nobody ever gave you a key to the barn when you moved in! What kind of welcome is that?\nHere's the spare. It's yours now. The hayloft has the best view on the farm.\n- ${n}`,
    cuke: n => `SARAH!\nI was jogging past the barn and it hit me: you never got a key when you moved in! Unacceptable!\nHere's the spare. Go see the hayloft! It's a great place to stretch!\n- ${n}`,
    sully: n => `Kid,\nFound the spare barn key in my tackle box. Nobody ever gave you one when you moved in, did they? Typical.\nIt's yours. Don't lose it in the hay.\n- ${n}`,
    maki: n => `Sarah,\nThe island's records show that no barn key was ever issued to you. This has been corrected. The key is enclosed.\nPlease keep it somewhere orderly.\n- ${n}`,
    coco: n => `SARAH!!\nYou don't have a key to the BARN?? Everybody has a key to the barn! I have three! Here's one!\nThe goat says hi. Probably.\n- ${n}`,
};
/* each morning: once Sarah's friends with a neighbor other than Joe (and her family, who only visit), the friendliest
   of them mails the spare key */
function barnKeyTick() {
    if (!S || !S.started || S.flags.barnKey || S.flags.barnKeySent || Online.visitor()) return;
    let best = null, bestPts = -1;
    for (const id of Object.keys(NPC_DEFS)) {
        const d = NPC_DEFS[id], r = S.npcs[id];
        if (id === 'joe' || d.online || !r || !r.met || hearts(id) < BARN_KEY_HEARTS) continue;
        if (r.pts > bestPts) { best = id; bestPts = r.pts; }
    }
    if (!best) return;
    S.flags.barnKeySent = Clock.dayNum();
    const name = NPC_DEFS[best].name, L = BARN_KEY_LINES[best] || BARN_KEY_LINES.default;
    S.mail.push({ id: S.mailSeq++, from: best, subject: 'A key for you', read: false, claimed: false, gift: 'q_barnkey', gifts: null, day: Clock.dayNum(), body: L(name) });
    Save.touch();
}
