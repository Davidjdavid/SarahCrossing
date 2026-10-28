/* ---- 6zk_catchphrases.js ---- */
/* Catchphrases (David's friendship notes, 27 October: "every neighbor has one, said at the end of lines; after raising
   friendship Sarah can give them a new one, and they react to it in their own way"). Each neighbor's word comes at the end
   of some of their lines (voiced, 56_drama.js: catchTail); a good friend (four hearts) can be asked to take a new one in
   the talk menu, and the Town Hall's Residents screen sets it too. It's kept on the neighbor (S.npcs[id].catch: missing
   means their own). */
const CATCH = {
    maki: 'precisely', kai: 'bro', basil: 'slurp', wonton: '(Not soup.)', chili: 'spicy', coco: 'obviously', cece: 'sorry!',
    clementine: 'très chic', cuke: 'hydrate!', sully: 'wicked', ginger: 'sturdy', brulee: 'magnifique', mac: 'eat up!',
    joe: 'ribbit', scampi: 'yarr', mug: 'brew-tiful',
};
/* how each takes to a new one ({c} is it) */
const CATCH_REACT = {
    maki: ["'{c}.' Hm. It is short. It is clear. I accept it. Precisely. ...I mean, {c}.", "I will practice it at exactly 7 AM tomorrow."],
    kai: ["'{c}'?! Dude. DUDE. That's SO good. {c}!", "I'm gonna say it to the waves. They're gonna love it."],
    basil: ["'{c}.' Hmm. It has a nice balance to it. Like a good broth.", "I'll try it out on my customers. Slowly. Like noodles."],
    wonton: ["'{c}'... I like it. It is NOT about soup. Good.", "I will say it from the spring. It echoes nicely."],
    chili: ["'{c}'! Ooh, that's got some heat to it. {c}!", "I'm gonna say it so much. Like, a medium amount. Okay, a LOT."],
    coco: ["'{c}'?! Oh, everyone is going to hear about this. From me. Obviously. I mean... {c}.", "I'm telling Joe first. No, Cece. No, everyone."],
    cece: ["'{c}'! Oh, I love it! Sorry, is it okay that I love it? {c}!", "I'll try not to say sorry after it. Sorry. {c}!"],
    clementine: ["'{c}.' Darling. It's divine. It goes with everything I own.", "I'll wear it out tonight. Words can be worn. Ask anyone."],
    cuke: ["'{c}'! LOVE IT! I'm gonna say it on my run! All six miles!", "{c}! {c}! Okay, I'm warmed up."],
    sully: ["'{c}', huh? Kid, that's wicked good. ...I mean, {c}.", "Back in Boston we'd say it louder. I'll work on it."],
    ginger: ["'{c}.' Solid. Load-bearing. I'll build my sentences round it.", "Measured it twice. It fits."],
    brulee: ["'{c}.' Ah. There's a certain... je ne sais quoi to it. Exquisite.", "I'll hang it in the museum of my mouth. Metaphorically."],
    mac: ["'{c}'! Ha! I love it. Now eat something. {c}!", "I'll say it to everyone who comes in. And then feed them."],
    scampi: ["'{c}'? Har! That's got salt in it, that does. {c}!", "I'll bellow it off the end o' the pier at dawn. Scare the gulls."],
    mug: ["'{c}'?! Oh my gosh. That's so good. I'm vibrating. Is it the coffee? It's the catchphrase. {c}!", "I'm going to say it to every customer. Twice. Three times if they look sleepy."],
    joe: ["'{c}'... Oh! I could rhyme with that. I'm going to write a poem about it.", "Thanks, {name}. It's the best one I've ever had. It's the only one I've ever had. Still."],
};
function catchOf(id) { const r = S && S.npcs && S.npcs[id]; return (r && r.catch) || CATCH[id] || null; }
/* the end of a line: their catchphrase, capitalized, with a full stop unless it has its own */
function catchTail(id) {
    const c = catchOf(id);
    if (!c) return '';
    const t = cap(c);
    return ' ' + (/[.!?)…]$/.test(t) ? t : t + '.');
}
/* keep what Sarah types tidy: a word or two, no strange characters, sixteen letters at most (or as many as the box takes) */
function catchClean(v, max) { return String(v || '').replace(/[^\p{L}\p{N} '!?.,-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, max || 16); }
/* a little text box over the game: resolves with what was typed, '' for "their own", or null when closed */
function askText(title, label, value, max, own, go) {
    return new Promise(res => {
        let done = false;
        const fin = v => { if (done) return; done = true; UI.close(true); res(v); };
        const P = UI.open({ title, onClose: () => { if (!done) { done = true; res(null); } } });
        const f = el('label', 'field');
        f.appendChild(el('span', null, label));
        const inp = el('input');
        inp.maxLength = max; inp.value = value || ''; inp.autocomplete = 'off'; inp.id = 'asktext';
        f.appendChild(inp);
        P.body.appendChild(f);
        const row = el('div', 'st-row');
        row.appendChild(chip(go || 'Teach it', () => fin(catchClean(inp.value, max) || null), 'go'));
        if (own) row.appendChild(chip(own, () => fin('')));
        row.appendChild(chip('Never mind', () => fin(null)));
        P.body.appendChild(row);
        inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') fin(catchClean(inp.value, max) || null); });
        setTimeout(() => { try { inp.focus(); inp.select(); } catch (e) { /* fine */ } }, 60);
    });
}
/* in the talk menu, for a good friend: a new catchphrase, and how they take it */
async function catchFlow(n) {
    const id = n.id, d = NPC_DEFS[id], r = rel(id);
    await UI.say(id, voiced(id, `A new catchphrase? For me? Right now I say '${catchOf(id)}'. What should I say?`), { keep: true });
    UI.hideDialog();
    const v = await askText(`A catchphrase for ${d.name}`, 'A word or two', '', 16, r.catch ? 'Their old one' : null);
    if (v === null) { await UI.say(id, "Oh. Okay! Maybe another time.", { keep: true }); return; }
    r.catchDay = Clock.dayNum();
    if (v === '') { delete r.catch; await UI.say(id, `Back to '${catchOf(id)}'! Like an old sweater. Comfy.`, { keep: true }); Save.touch(); return; }
    r.catch = v;
    Save.touch();
    n.emote = 'sparkle'; n.emoteT = 60; n.hop = 3;
    for (const line of CATCH_REACT[id] || ["'{c}'! I love it. {c}!"]) await UI.say(id, fillText(line.replace(/\{c\}/g, cap(v))), { keep: true });
}
