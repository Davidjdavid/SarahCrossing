/* What the townsfolk say. Lines move on with the Wander (flags d1..d6 and the rest). Before their usual lines, two
   things get their say: a favour of theirs (src/51c_town_favours.js) and anything new since the last turn of the Wander
   (src/51b_town_life.js), each said once. */

function cycle(id, lines) {
    const k = 'talk:' + id;
    const n = Progress.get(k) || 0; Progress.set(k, n + 1);
    return lines[n % lines.length];
}
function* firstThen(id, first, rest) {
    if (!Progress.flag('met:' + id)) { Progress.set('met:' + id); yield* say(id, first); return; }
    yield* say(id, cycle(id, rest));
}

TALK.quill = function* () {
    if (!Progress.flag('quiz1') && Progress.flag('ceremony')) {
        yield* say('quill', "Ah, the Wanderer! A quick question before you go, since you're here. When you push a block and walk away, what does it do?");
        const i = yield* ask('quill', 'Well?', ['Goes back the way it came', 'Goes straight home', 'Stays where I left it']);
        if (i === 0) {
            yield* say('quill', "Exactly right. The way it came, not the quickest way. People forget that. Here, a gold star. Well, a button.");
            Inv.buttons += 5; Sfx.play('button'); Progress.set('quiz1');
        } else if (i === 1) yield* say('quill', "Close, but no. It goes back the way it came: every step it took, in reverse. Think about it and come back.");
        else yield* say('quill', "Stays? In the Hollow? Goodness, no. Come back when you've thought it over.");
        return;
    }
    if (yield* Town.news('quill')) return;
    yield* firstThen('quill', "Miss Quill. I taught you your letters, and the Rules. The blackboard in the schoolhouse has them all, if you've forgotten any.",
        ["The schoolhouse is open, if you want to read the Rules again.", "A Wanderer who thinks before pushing is worth two who don't.", "Tuck has drawn eleven pictures of you this week. Eleven."]);
};
TALK.tuck = function* () {
    if ((yield* Favours.talk('tuck')) || (yield* Town.news('tuck'))) return;
    if (Progress.flag('d1')) { yield* say('tuck', cycle('tuck1', ["Was there a monster? Was it HUGE? I bet it was huge.", "When I do my Wander I'm going to do it faster than you. No offence.", "Mum says I'm too little. I'm NOT too little."])); return; }
    yield* firstThen('tuck', "Are you going? Are you going NOW? When I'm big I'm going on a Wander too! I'm going to do ALL the Houses!",
        ["I'm practising. Watch. *pushes the sand* ...It came back. It always comes back.", "Bring me something from the Tidyhouse! A spoon or something!", "My mum says the Houses are older than the town. Older than Gran even!"]);
};
TALK.hob = function* () {
    if (yield* Town.news('hob')) return;
    if (Progress.flag('d3')) { yield* say('hob', "Used to walk the bank every day. Now I just... stand here. The fish don't mind."); return; }
    if (Progress.flag('d2')) { yield* say('hob', cycle('hob2', ["Two Knots, they say. The river's running a touch slower this week. Could be nothing. Fish don't seem to mind.", "Caught the same fish three days running. Same fish, same rock. I've named him Gerald.", "Folks up at the Kiln, eh? Clay always did come down the river with the spring."])); return; }
    yield* firstThen('hob', "Morning, Wanderer. Fish come back too, you know. Throw one in, back it swims to its own rock. Never lost a fish yet.",
        ["The river comes down from the north, past the posts. Nobody's been up there. Nobody ever needs to.", "Mind the water. The deep bits'll send you home soaking.", "Best spot's right here. Always has been. Funny how a spot gets to be yours."]);
};
TALK.arlo = function* () {
    if (yield* Town.news('arlo')) return;
    yield* firstThen('arlo', "Sit down, sit down. Ah, the Wander. I remember mine. Long time ago now. Before the posts went up.",
        ["When I was a lad, folk used to walk about. Up the hills, down to the lake, just for the doing of it. Can't think why we stopped.",
            "Your aunt did her Wander from this very square. Your Gran won't talk of it, so I won't either.",
            "You know what I like about this bench? It's always here. I'm always here. Ha.",
            "I tried to walk to the lake last spring. Got as far as the bridge and turned round without meaning to. Old legs."]);
};
TALK.ives = function* () {
    if (Progress.flag('s28') && !Inv.has('tealscarf')) {
        yield* say('ives', "All three? ALL three? Oh, that's- that's very tidy of you. Here. I knit them. I always knit them in teal; it's the only colour that sits still.");
        yield* Story.getItem('tealscarf')();
        return;
    }
    if (Progress.flag('d1') && !Progress.flag('met:trials')) {
        Progress.set('met:trials');
        yield* say('ives', "You did it! I do hope it was tidy in there. Oh, and if you're ever at a loose end: up in the attic I've set out some tidying for anyone who's quick. Trials, I call them. The stairs are just there.");
        return;
    }
    if (yield* Town.news('ives')) return;
    if (Progress.flag('d1')) { yield* say('ives', cycle('ives1', ["Have you tried my Trials? Up the attic stairs. Quick hands, that's the thing.", "You did it! I do hope it was tidy in there. Was it tidy?", "A Knot! Well. That calls for a good sweep of the step.", "If you need a lie-down, the beds upstairs are made. They're always made."])); return; }
    yield* firstThen('ives', "Welcome to the Spool & Thimble! Wipe your— oh, it's you, {name}! Off to the Tidyhouse? You'll love it. Everyone does.",
        ["A place for everything and everything in its place, that's what I always say. What everybody says, I suppose.", "If you need a lie-down, the beds upstairs are made. They're always made.", "Busy, busy. I'm always busy when there's a Wander on."]);
};
TALK.bram = function* () {
    if (yield* Town.news('bram')) return;
    if (Progress.flag('d1') && !Progress.flag('d2')) { yield* say('bram', cycle('bram1', ["The Kiln? Hot place, I'd guess. Very hot. Bring water. Not that I've— ha! Go on.", "Smash a pot out there and watch the bits fly home. Prettiest thing in the Hollow.", "Big boulder in the canyon road, west of Meadowfold. Pushing won't do it. You'll want a grip on it."])); return; }
    yield* firstThen('bram', "HA! The Wanderer! Here, smash one of my pots. Go on! It comes back. That's the beauty of the Hollow: nothing's ever really broken.",
        ["Pots, jugs, bowls. All come home to the shelf. Makes the trade a bit slow, I'll grant you.", "Ever notice the bits fly back the way the pot went? Not the short way. The way it WENT.", "My dad made pots. His dad made pots. Same pots, some of them."]);
};
TALK.gundry = function* () {
    if (yield* Town.news('gundry')) return;
    yield* firstThen('gundry', "Gundry. I keep the Well. Oil the winch, sweep the step, that sort of thing.",
        ["This old winch turns by itself some nights. Wind, I expect.", "Don't go dropping things down the Well, Wanderer. They come back up, and they're not happy about it.", "Your Gran's the Warden. I just do the oiling. She does... the rest."]);
};
TALK.burr = function* () {
    if (yield* Town.news('burr')) return;
    yield* firstThen('burr', "Halt! Oh, it's the Wanderer. North Road's closed past the posts. Always has been. Warden's orders.",
        ["Nothing up there but fog and trees and more fog.", "Nobody's ever gone past the posts. Nobody's ever wanted to. That's how you know it's a good rule.", "I've stood at this post twenty years. Good post."]);
};
TALK.mallow = function* () {
    if (Progress.flag('d5') && !Progress.flag('mallow_d5')) {
        Progress.set('mallow_d5');
        yield* say('mallow', "Ah, the Wanderer. You've been out to the Slumberhouse, I hear. All the way through? Yaaawn. Good, good. Did you sleep? You should always sleep there. Beds are made to be used.");
        yield* say('mallow', "How do I know it's... comfy? Ha. Well. One hears things. A doctor hears everything. Here, let me look at you. Not a scratch. Splendid. Off you go.");
        Inv.hp = Inv.maxHp; return;
    }
    if (Inv.hp < Inv.maxHp) { Inv.hp = Inv.maxHp; Sfx.play('heart'); yield* say('mallow', "Yaaawn. Let's have a look... all better. Off you go. Doctor's orders: a nap, soon as you can."); return; }
    if (yield* Town.news('mallow')) return;
    yield* firstThen('mallow', "Doctor Mallow. Hurt? Tired? Both? Come and see me, I'll patch you up. Yaaawn. Long night. Very long night.",
        Progress.flag('d5') ? ["Matron Hush? Never heard of her. Strict sort, was she? Hm.", "If you ever need to come home in a hurry, lie down. That's my advice. Lie down, and think of home.", "Sleep is the best medicine. Also the second best."] : ["Sleep is the best medicine. Also the second best.", "You look healthy. Disgustingly healthy. Come back when you're not.", "If you ever feel a sort of... tug... behind the ribs? That's normal. Perfectly normal. Everyone has it."]);
};
TALK.mabel = function* () {
    if ((yield* Favours.talk('mabel')) || (yield* Town.news('mabel'))) return;
    yield* firstThen('mabel', "Lost and Found. Mostly Found. Nothing's ever lost in the Hollow, they say. And yet I keep this shop.",
        ["If you ever find a thing that doesn't go home, bring it here. A stray, we call it. I collect them.", "Strays are turning up more these days. Out by the edges, mostly. Odd little things.", "Everything in its place. Except my things. My things are in MY place."]);
};
TALK.thimble = function* () {
    if (!(yield* Favours.talk('thimble')) && !(yield* Town.news('thimble')))
        yield* firstThen('thimble', "Thimble & Things! Wander supplies, bandages, string, things. Mostly things.", ["Buttons spend fine here, Wanderer.", "Bandages, for the bumps. Everyone comes home with bumps.", "String's selling well this year. The Guild orders by the mile."]);
    yield* Shop.run('thimble');
};
TALK.rosa = function* () {
    if ((yield* Favours.talk('rosa')) || (yield* Town.news('rosa'))) return;
    yield* firstThen('rosa', "Hello love! Tuck won't stop talking about you. Eleven drawings. ELEVEN. Here, have a bun for the road.",
        ["Bread's warm, if you want some. A bun puts a bit of heart back in you.", "When Tuck's Wander comes I'll be a mess. Don't tell him.", "I bake the same loaves every morning. Same tins, same shelf. You'd think I'd get bored."]);
    if (!Progress.flag('rosaBun')) { Progress.set('rosaBun'); Inv.heal(4); Sfx.play('heart'); }
};
TALK.seam = function* () {
    if (yield* Town.news('seam')) return;
    yield* firstThen('seam', "Sebastian Seam, tailor. That scarf: red, of course. A Wanderer's colour. You wear it beautifully.",
        ["I'm working on something very big for a client. Very hush-hush.", "Everyone's thread is a different colour, you know. Figuratively. Mostly figuratively.", "Come back when you've a few buttons and I'll make you something with presence."]);
};
TALK.tess = function* () { yield* say('tess', "There's my bell-ringer's bairn! Listen to the bells when you're out: they'll tell you where you are."); };

/* what they say when Wren leans on them (S01: everyone has one) */
Object.assign(BUDGE, {
    gran: "Gran: \"Oh! Careful, love. I'll just... go back where I was.\"",
    quill: 'Miss Quill: "Rule two, {name}. I go back the way I came."',
    tuck: 'Tuck: "Hey! ...Whoa, I went back by myself!"',
    nell: 'Nell: "Oi! No pushing!"', otto: 'Otto: "Ha! Tagged!"', bea: 'Bea: "Not off the well-step!"',
    hob: 'Fisher Hob: "Easy there. The bank\'s that way."',
    arlo: 'Old Arlo: "Steady! I\'ve stood here sixty years."',
    ives: 'Mother Ives: "Don\'t shove, dear! A place for everything!"',
    bram: 'Bram: "HA! Like a boulder, me."',
    gundry: 'Gundry: "Mind the Well."',
    burr: 'Constable Burr: "Hold your horses!"',
    mallow: 'Doctor Mallow: "Mmf? Oh. Sleepwalking again."',
    mabel: 'Auntie Mabel: "Not a stray, dear. I go home."',
    thimble: 'Thimble: "Oof. Things!"',
    rosa: 'Rosa: "Whoops! Floury hands!"',
    seam: 'Seam: "Mind the hem!"',
});
CRITTER_TALK.biscuit = () => function* () {
    const n = (Progress.get('biscuitPets') || 0) + 1; Progress.set('biscuitPets', n);
    yield* say(null, n === 1 ? "Biscuit, the town cat." : n === 2 ? "Biscuit purrs and looks at you as if it knows something you don't. Cats always look like that." : "Biscuit. Purring.");
};
CRITTER_TALK.pudding = () => function* () {
    if (Progress.flag('d4') && !Progress.flag('unwound')) { yield* say(null, "Pudding lies with his nose on his paws, looking at his ball. He doesn't chase it any more. His tail thumps once when you crouch down, and then he goes back to looking."); return; }
    yield* say(null, "Pudding chases a ball. It rolls back to Pudding every time. Pudding has never once been surprised by this.");
};

/* the schoolhouse blackboard: the Rules */
Story.blackboard = function* () {
    const rules = [
        'THE RULES OF THE RETURN',
        '1. Everything has its place.',
        '2. Whatever is moved goes back the way it came.',
        '3. Nothing is ever lost in the Hollow.',
    ];
    if (Progress.flag('d1')) rules.push('4. Heavier shoves lighter.');
    if (Progress.flag('d2')) rules.push('5. Broken things come home in pieces.');
    yield* say(null, rules.join('\n'));
    if (Progress.flag('d4') && !Progress.flag('reveal1')) yield* say(null, "Under the rules, rubbed out but still faintly there: '6. You have a place too.'");
};
Story.cellarDoor = function* () {
    if (Progress.flag('reveal2')) { yield* say(null, "The cellar door. Locked from the inside now."); return; }
    yield* say(null, "The cellar door. Locked. Gran keeps the key on a string round her neck. If you put your ear to it, you can hear something turning, very slowly, far below.");
    Progress.set('heardCellar');
};
Story.sleepInBed = function* () {
    const i = yield* ask(null, 'Your bed. Rest a while?', ['Sleep (heal and save)', 'Not now']);
    if (i !== 0) return;
    const p = G.player;
    yield* fadeOut(30);
    Inv.hp = Inv.maxHp;
    p.setMark();
    Save.write();
    /* downstairs, Gran hums the old tune */
    Music.play('lullaby');
    yield* say(null, "From downstairs comes Gran's humming: the old bedtime tune, the one she's hummed for as long as you can remember. Low... high... in between... high... and low again.");
    yield 30;
    yield* fadeIn(30);
    Music.play(G.map.def.music || 'home');
    Sfx.play('save');
    yield* say(null, 'You feel rested. (Saved.)');
};

/* shops: a few things for buttons */
const SHOPS = {
    thimble: [
        { id: 'bandage', name: 'Bandage (heals 2 hearts)', price: 8, buy: () => { Inv.heal(4); Sfx.play('heart'); } },
        { id: 'shop_patch', name: 'Heart Patch', price: 120, once: true, buy: () => Script.run(Story.getItem('heartpatch', 'shop_patch')) },
        { id: 'string', name: 'A ball of string', price: 3, buy: () => { Inv.items.string = (Inv.items.string || 0) + 1; } },
    ],
};
ITEMS.string = { name: 'Ball of string', kind: 'quest', desc: "Thimble's best. It doesn't do anything. It's string." };
const Shop = {
    *run(id) {
        const list = SHOPS[id].filter(it => !(it.once && Progress.flag('bought:' + it.id)));
        const choices = list.map(it => `${it.name} - ${it.price}`).concat(['Nothing, thanks']);
        const i = yield* ask(id, 'Anything you fancy?', choices);
        if (i < 0 || i >= list.length) return;
        const it = list[i];
        if (Inv.buttons < it.price) { yield* say(id, "Not enough buttons, I'm afraid. Come back with a few more."); return; }
        Inv.buttons -= it.price; Progress.set('bought:' + it.id); Sfx.play('button');
        it.buy();
        yield* say(id, 'Thank you kindly!');
    },
};
SPAWN.staffdoor = (tx, ty) => {
    const pr = new Prop(tx, ty, { im: ART.staffdoor, solid: [[0, 0]], oy: -16 });
    pr.interact = () => { Script.run(function* () { yield* say(null, Progress.flag('reveal1') ? 'STAFF ONLY. The door is open for you now.' : 'A narrow door: STAFF ONLY. Locked. Something hums on the other side.'); }); return true; };
    pr.talkBox = (pl, f) => f.tx === tx && f.ty === ty;
    return pr;
};
SPAWN.shop = () => new Ent('none');
