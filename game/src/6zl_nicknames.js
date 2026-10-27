/* ---- 6zl_nicknames.js ---- */
/* Nicknames (David's friendship notes, 27 October: "once a neighbor is a good enough friend they ask if they can call Sarah
   something (their own idea, or she suggests one), and use it from then on; she can ask them to change it"). At four hearts
   a neighbor asks once, the first time they see her that day (nickAsk); from then on their lines call her by it (nickIn,
   in UI._line: only that neighbor's lines), and "Call me something else?" in the talk menu changes it or goes back to her
   name. Kept on the neighbor (S.npcs[id].nick; nickAsked once they've asked). */
const NICK_IDEAS = {
    maki: 'Precise One', kai: 'Dude', basil: 'Noodle', wonton: 'Little Dumpling', chili: 'Hot Stuff', coco: 'Bestie', cece: 'Sweetie',
    clementine: 'Darling', cuke: 'Champ', sully: 'Kiddo', ginger: 'Boss', brulee: 'Muse', mac: 'Sugar',
};
function nickOf(id) { const r = S && S.npcs && S.npcs[id]; return (r && r.nick) || null; }
/* a line as this neighbor says it: her name as they call her */
function nickIn(sp, text) {
    const nick = typeof sp === 'string' && sp !== 'sarah' && nickOf(sp);
    if (!nick) return text;
    const nm = (S.playerName || 'Sarah').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return String(text).replace(/\{name\}/g, nick).replace(new RegExp('\\b' + nm + '\\b', 'g'), nick);
}
/* a good friend asks (once) */
async function nickAsk(n) {
    const id = n.id, r = rel(id), idea = NICK_IDEAS[id];
    if (!idea) return;
    r.nickAsked = true;
    Save.touch();
    const k = await UI.ask(id, voiced(id, `Hey, {name}... we're good friends now, right? Can I call you something? Like... '${idea}'?`), ["Sure, I love it!", 'How about something else?', 'Just {name} is fine'].map(fillText), { keep: true });
    if (k === 0) { r.nick = idea; n.emote = 'heart'; n.emoteT = 60; await UI.say(id, `Yay! ${idea} it is! Hi, ${idea}!`, { keep: true }); }
    else if (k === 1) {
        UI.hideDialog();
        const v = await askText(`What should ${NPC_DEFS[id].name} call you?`, 'A name', '', 16, null, "That's me");
        if (v) { r.nick = v; n.emote = 'heart'; n.emoteT = 60; await UI.say(id, `${v}! Perfect. I'll never forget it. I'm writing it down, just in case.`, { keep: true }); }
        else await UI.say(id, "Oh, okay! I'll keep thinking. You're {name} for now.", { keep: true });
    } else await UI.say(id, "{name} it is! It's a great name anyway.", { keep: true });
    Save.touch();
}
/* Sarah asks them to call her something else (or just her name) */
async function nickFlow(n) {
    const id = n.id, r = rel(id), nm = S.playerName || 'Sarah';
    r.nickDay = Clock.dayNum();
    const v = await askText(`What should ${NPC_DEFS[id].name} call you?`, 'A name', r.nick || '', 16, r.nick ? 'Just ' + nm : null, "That's me");
    if (v === null) return;
    if (v === '') { delete r.nick; await UI.say(id, `Back to ${nm}! Classic.`, { keep: true }); }
    else { r.nick = v; n.emote = 'heart'; n.emoteT = 60; await UI.say(id, `${v}? I love it. Hi, ${v}!`, { keep: true }); }
    Save.touch();
}
