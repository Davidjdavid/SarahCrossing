/* what people say, and the small rules that live in particular places */

const F = () => G.flags;
/* cycle through lines on repeated talks */
function cycle(id, sets) { const n = (F()['talk_' + id] || 0); F()['talk_' + id] = n + 1; return sets[n % sets.length]; }
const gotParcel = () => F().got_parcel5;

TALK.postmaster = () => {
    if (!F().letter) {
        F().letter = true;
        getItem('letter');
        return ['Morning! You\'re up early.', 'There\'s a parcel for No. 5. The cart broke down at the West Lane bridge, so it\'s sitting there.', 'And this letter is for the Keeper. The lighthouse. That\'s No. 0, at the end of the Long Road.'];
    }
    if (F().lit) return ['The light\'s back! The boats will be coming home.'];
    if (gotParcel() === 'seven') return ['Old Sev says he got a parcel. Strange. It wasn\'t for him.'];
    if (!gotParcel()) return cycle('pm', [['No. 5\'s parcel is by the West Lane bridge.'], ['The album by the window has your stamps in it. Every courier keeps one.']]);
    if (!F().letterRead) return cycle('pm2', [['Parcel delivered! You\'re a natural.', 'Now, the Keeper\'s letter. No. 0. It\'s a long road, mind.'], ['No. 0, end of the Long Road. Or so they say. I\'ve never been.']]);
    return ['You found the Keeper! Good.', 'The album by the window has your stamps in it.'];
};
TALK.gran = () => {
    if (isEerie()) return null;
    if (F().lit) return ['I saw the light from my window last night. Like when I was a girl.'];
    return cycle('gran', [['That town clock has never once been wrong.', 'Not once. Whatever it says, that\'s the time.'], ['When I was a girl, the lighthouse never went out.']]);
};
function ageLine(e, base) {
    const a = dval(e.s.age);
    return a;
}
TALK.pip = e => {
    const a = dval(e.s.age);
    if (a !== 8) {
        if (a < 8) return ['I\'m little again! Weird. I liked being eight.'];
        if (a === 9) return ['I\'m NINE! Finally! Thank you!'];
        if (a < 20) return ['I\'m a teenager now. Please go away.'];
        if (a < 60) return ['Have you seen my keys? I have keys now. And worries.'];
        return ['Back in my day, I was eight.'];
    }
    return cycle('pip', [['I\'m gonna be nine soon. Then ten. Then a hundred!'], ['Dot sells numbers. I want a nine. Then I\'d be nine.'], ['The milestone on East Lane says the lighthouse is ninety-nine away. That\'s so far.']]);
};
TALK.dot = () => {
    if (!shopOpen()) return ['Zzz... we open at eight...'];
    const sh = rs('shop').ents;
    const orig = { sh_satchel: 300, sh_nine: 90, sh_map: 40 };
    const tampered = sh.some(e => e.k === 'shelf' && !e.sold && dval(e.s.price) !== orig[e.id]);
    if (tampered && !F().dotNoticed) { F().dotNoticed = true; return ['Hm. I could have sworn that price said something else.', '...Well. A price is a price.']; }
    if (G.items.satchel) return cycle('dot2', [['A bigger bag! You\'ll be carrying all sorts now.'], ['Everything\'s priced to the digit.']]);
    return cycle('dot', [['Welcome to Dot\'s! Everything\'s priced to the digit.'], ['That satchel would hold another number for you. Three hundred, though. Steep.']]);
};
HOOK.cantAfford = () => say(['That\'s more than you\'ve got, love.']);
TALK.fife = () => {
    if (gotParcel() === 'five') {
        if (!F().fifeTip) { F().fifeTip = true; giveDigit(0); return ['My parcel! You\'re a dear.', 'Here, have this. It\'s nothing, really.']; }
        return ['The wool is lovely. Thank you again.'];
    }
    if (gotParcel()) return ['My parcel never came. Typical.'];
    return ['Is that the post? I\'m waiting on a parcel. Wool, mostly.'];
};
TALK.sev = e => {
    const a = e.s && e.s.age ? dval(e.s.age) : 77;
    if (a < 20) return ['I feel... springy. Don\'t tell anyone.'];
    if (gotParcel() === 'seven') return ['A parcel! For me! ...It\'s wool. I don\'t knit.'];
    if (F().lit) return ['Light\'s on, then. About time.'];
    return cycle('sev', [['Hmph. That bridge was old when I was young.', 'And I was young a long time ago.'], ['Nine is old for a bridge. Very old. Rotten, even.']]);
};
TALK.sev_in = TALK.sev;
TALK.tock = () => cycle('tock', [
    ['Tock\'s Clocks. I don\'t fix them. I listen to them.'],
    ['That town clock doesn\'t tell the time, you know. It keeps it.', 'Big difference.'],
    ['They say the old tower on the hill keeps an hour that isn\'t on any clock.', 'Twenty-five o\'clock. Ninety o\'clock. Nonsense, of course.'],
]);
TALK.marlo = () => {
    if (F().lit) return ['Boats! Boats again! I\'d nearly forgotten what they look like.'];
    if (G.items.specs) return ['You\'re looking at the sea funny. It\'s wide.', 'Always has been. Wide as anything.'];
    return cycle('marlo', [['No boats since the lighthouse went dark. They can\'t find their way in.'], ['The Keeper\'s boy is out there somewhere. Sailor.']]);
};
TALK.marlo_in = () => ['Mm? Late, isn\'t it? Go home.'];
TALK.grist = () => {
    const open = HOOK.millFlow();
    if (G.items.watch) return ['That watch was always a bit fast.', 'It keeps whatever time you tell it.'];
    if (!open) return ['The wheel\'s stuck. The sluice up at the Mere is shut.', 'It needs something heavy on its plate.'];
    return cycle('grist', [['She\'s turning! Listen to her count.'], ['Grandad wired his strongbox to that counter. It opens at a hundred.', 'Never had the patience myself.']]);
};
TALK.grist_in = () => ['Zzz... a hundred... and one...'];
TALK.squirrel = () => cycle('sq', [['Don\'t touch the acorns. They\'re counted.'], ['You found the hollow! Old trees open up, if they\'re old enough.']]);
TALK.prisoner = () => cycle('pr', [['They locked me in when the war started. Then forgot to say it ended.'], ['The armory was number fifteen. They bricked it up after.', 'Shame. There were good spectacles in there.']]);
TALK.clerk = () => cycle('clerk', [['Dead letters. Addressed to numbers where nobody lives.'], ['You\'re the first to arrive here on purpose. Or by accident. Hard to tell, here.']]);
TALK.hourling = () => cycle('hl', [['...'], ['You found an hour that isn\'t. Most people only ever get twenty-four.', 'Take what\'s in the chest. Nobody else will.']]);
TALK.miner = () => cycle('miner', [['Heavy, are you? Me too, once.'], ['I left some nines down here. Nobody digs for nines any more.']]);
TALK.walker = () => cycle('walker', [['Halfway! I think. I\'ve been walking a while.'], ['The milestones are only numbers, you know.', 'I never had the heart to change one.']]);
TALK.son = () => cycle('son', [['Mum says you climbed the whole tower. Thank you.'], ['Ten thousand ships. And I was the one that carried it over.']]);
TALK.keeper2 = () => cycle('keeper2', [['I\'ll leave it on now. Always.'], ['Go and see the town, dear. They\'ll want to thank you.']]);
TALK.keeper = () => {
    if (F().lit) return ['There. Ten thousand.', 'He\'ll see it.'];
    const lines = [];
    if (!F().met) { F().met = true; lines.push('A visitor! I don\'t get many. The road is so long.'); }
    if (G.items.letter && !F().letterRead) {
        F().letterRead = true;
        lines.push('A letter? ...From my boy!', '"Coming home soon. Leave the light on."', 'The light. Oh, dear.');
    }
    if (lines.length) {
        lines.push('The lamp only lights when the count carries over. Ten thousand ships home, and it shines.', 'Four drums, one on each floor. Then the bell at the top.', 'My knees won\'t do the stairs any more.');
        return lines;
    }
    const hint = [];
    if (!G.items.specs) hint.push(['The top drum... I can\'t even see it any more. My eyes aren\'t what they were.']);
    if (!G.items.watch) hint.push(['The third floor\'s gates keep the sun\'s hours and the moon\'s.', 'You\'d have to bring the time up with you.']);
    hint.push(['When the count carries over, the lamp takes the one.', 'That\'s how it\'s always been.']);
    hint.push(['Ring the bell at the top when the drums are ready.']);
    return cycle('keeper', hint);
};

/* ---------- small rules in particular places ---------- */
HOOK.millFlow = () => { const s = entById('sluice', 'mere'); return !!(s && s.open); };
HOOK.millLock = () => { const c = entById('millcount', 'mill'); return c && c.s.cnt[0] >= 1; };
HOOK.delivered = (parcel, room) => {
    const words = {
        five: ['(From inside:) Oh! My parcel! Do come in, dear!'],
        seven: ['(From inside:) Hm? A parcel? Mine now.'],
        home: ['You delivered a parcel to yourself.', 'It\'s wool.'],
        post: ['(From inside:) Back to sender? Well, all right.'],
    };
    say(words[room] || ['Delivered.']);
};
HOOK.lit = () => { F().lit = true; EV.push({ t: 'ending' }); };
const WHEN = {
    shore: () => { const s = entById('sea', 'harbor'); return !!s && dval(s.s.d) <= 1; },
    walk: () => G.road.p === 50 && !!F().honest && G.road.e !== Infinity,
    lit: () => !!F().lit,
};
HOOK.swapped = (e, key, took, gave) => {
    if (e.k === 'milestone') F().honest = false;
};
HOOK.onRoom = (id, from) => {
    if (id === 'road' && from === 'eastlane') F().honest = true;
    if (id === 'eastlane' || id === 'cliff') F().honest = false;
    if (!F().seen) F().seen = {};
    F().seen[id] = true;
};
HOOK.selfAge = () => {
    const a = dval(G.p.s.age);
    if (a === 0) die('unborn');
};
TALK.hillscope = () => F().lit ? ['Far off to the east, the lighthouse. Shining!'] : ['Far off to the east: a lighthouse, standing dark.', 'Its windows have numbers in them.'];
TALK.guard = () => {
    const g = entById('guard');
    if (g && g.s && dval(g.s.age) < 16) return ['I\'m off duty! I\'m only little!'];
    return cycle('guard', [['Clock Hill\'s closed. Orders.', 'I\'m off at sundown, mind. Not that I\'m telling you anything.'], ['Nothing up there but an old tower with no door.']]);
};
TALK.mirror = () => G.items.specs ? ['You. Age ' + dstr(G.p.s.age) + '.'] : ['You.'];
TALK.album = () => { EV.push({ t: 'album' }); return null; };
