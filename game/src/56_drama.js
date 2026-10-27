/* ---- 56_drama.js ---- */
/* Island drama: small storylines between neighbors. One at a time, each lasting a few days to a week, with a
   quiet stretch in between. Bystanders gossip about it; Sarah can pass things on, clear things up, or keep quiet.
   Rules: there is never drama at Sarah, humans never date anyone, and at most one human is in a storyline. */
const DRAMA_FOOD = ['maki', 'kai', 'basil', 'wonton', 'chili', 'coco', 'cece', 'clementine', 'cuke', 'sully', 'ginger', 'brulee', 'mac'];
const DRAMA_HUMAN = ['joe'];                     // David and the siblings only visit now and then, so they stay out of it
const TRAIT = {
    maki: ['rice', 'sushi roll'], kai: ['toppings', 'poke bowl'], basil: ['noodles', 'pad thai'], wonton: ['hot spring', 'dumpling'],
    chili: ['stem', 'pepper'], coco: ['bow', 'truffle'], cece: ['crust', 'cheesecake'], clementine: ['peel', 'clementine'],
    cuke: ['jogging', 'cucumber'], sully: ['accent', 'Boston cream pie'], david: ['roller skates', 'icon'], joe: ['curls', 'poet'],
    ginger: ['hard hat', 'gingerbread builder'], brulee: ['caramel top', 'cr\u00e8me br\u00fbl\u00e9e'], mac: ['cooking', 'mac and cheese'],
    james: ['golf swing', 'golfer'], john: ['briefcase', 'lawyer'], elizabeth: ['Jackbox strategy', 'gamer'],
};
const DRAMA_BITS = {
    thing: ['who ate the last dumpling', 'whether a hot dog is a sandwich', 'the right way to hold chopsticks', "a text that just said 'k'",
        'whose turn it was to water the plants', 'the best spot to watch the sunset', 'how spicy is too spicy', 'which way the toilet paper goes'],
    contest: ['bake-off', 'dance-off', 'sandcastle contest', 'staring contest', 'fishing contest', 'hat contest'],
    item: ['umbrella', 'good scissors', 'favorite mug', 'beach chair', 'cookbook', 'ladder', 'record player', 'fancy spatula'],
    place: ['plaza', 'beach', 'pond'],
    reason: [["I wasn't wearing my contacts yesterday. I waved at a bush instead. The bush did not wave back.", "They just weren't wearing their contacts", 'blind as a bat without my contacts'],
        ["I was practicing lines for a play in my head. I didn't see anybody all day.", 'They were practicing lines for a play', 'very focused on my acting career'],
        ['I was counting my steps. I lost count. I had to start over. It was a whole thing.', 'They were just counting their steps', 'bad at counting'],
        ['I had headphones in. It was a really good song. I did not see anything for four whole minutes.', 'They had headphones in', 'very into that song']],
    lost: [['stuck in a bush by the plaza', 'plaza_e'], ['on the beach, a little damp', 'beach'], ['under a rock by the river', 'river'], ['in the orchard', 'orchard'], ['by the pond', 'pond']],
};

/* ---------------------------------------------------------------- the storylines */
const DRAMAS = {
    crush: {
        romance: true, roles: ['food', 'food'], weight: 3,
        ok: c => !coupleOf(c.A) && !coupleOf(c.B),
        start: 'start',
        states: {
            start: {
                days: 3, auto: d => d.spread >= 2 ? 'found' : 'fizzle',
                sum: '{A} might have a crush on {B}.',
                gossip: ["{A} keeps 'accidentally' walking past {B}'s house. Four times today. Four.",
                    '{A} was practicing a greeting for {B}. I pretended not to notice the part where the rock was answering.',
                    'Everyone knows {A} has a crush on {B}. Except {B}. {B} has no idea.'],
                A: ["Oh, hi, {name}. Have you seen {B} today? No reason. I'm asking for a friend. The friend is me.",
                    'Do you think {B} likes... things? Like, in general? Like, me? Forget I said that.'],
                B: ['Is it just me, or is {A} acting weird? They waved at me three times today. Who needs three waves?',
                    '{A} gave me a flower yesterday. Then ran away. Is that a thing people do?'],
                opts: {
                    A: [{ label: 'Just tell {B} how you feel!', say: ["You think? ...Okay. Okay! I'm doing it. Today. Probably. Definitely. Maybe."], go: 'confess', helped: true }],
                    B: [{ label: 'I think {A} likes you.', need: 'heard', say: ["Wait. Like, LIKES likes? ...Oh. Oh! Huh. I need to go sit down somewhere and think about it."],
                        go: d => d.rand < 0.7 ? 'mutual' : 'kindno', helped: true }],
                },
                tell: { text: '{A} has a crush on {B}.', react: ['No WAY. {A} and {B}? ...Actually, I can see it.', "I KNEW it. I didn't know it. But I felt it."] },
            },
            confess: {
                days: 1, auto: d => d.rand < 0.75 ? 'couple' : 'kindno',
                sum: '{A} is going to tell {B} how they feel.',
                gossip: ["{A} is telling {B} today. I'm trying very hard not to hover nearby."],
                A: ["I'm telling {B} today. My knees are shaking. I don't have knees. Something is shaking."],
                B: ['{A} said they need to "talk to me about something." Is it bad? Did I do something?'],
            },
            found: {
                days: 1, auto: d => d.rand < 0.6 ? 'couple' : 'kindno',
                sum: 'Everybody told {B} about {A}\'s crush.',
                gossip: ["So the whole island told {B} that {A} has a crush on them. {B} is 'thinking about it.' Stay tuned."],
                A: ['Everyone knows. EVERYONE. Even the goat looked at me funny. I am going to go live in the ocean.'],
                B: ["So apparently {A} likes me? Everybody told me. Like, everybody. I'm thinking about it."],
            },
            mutual: {
                days: 1, auto: 'couple',
                sum: '{B} likes {A} back!',
                gossip: ['{B} likes {A} back! It is happening. I need everyone to be calm. I am not calm.'],
                A: ["{B} wants to go to the pier with me tonight. Just the two of us. Is this a date? This is a date. Help."],
                B: ["I'm going to the pier with {A} tonight. Don't make it a big deal. (It's a big deal.)"],
            },
            couple: {
                days: 5, end: true, date: true, enter: d => addCouple(d.cast.A, d.cast.B),
                sum: '{A} and {B} are dating!',
                gossip: ['{A} and {B} are DATING. I called it. Did I call it? I called it.',
                    'I passed {A} and {B} watching the sunset. They didn\'t even notice me waving.'],
                A: ['{B} and I are dating, {name}. Thanks for helping me find the courage to ask.', "Is it too soon to say {B} is perfect? It's not too soon. I checked."],
                B: ['{A} and I are dating! I know! Me! Dating!', "{A} left me a note. It just said 'hi.' I kept it."],
            },
            kindno: {
                days: 3, end: true,
                sum: '{A} told {B} how they feel. They\'re staying friends.',
                gossip: ["{A} told {B} how they feel. {B} said they'd rather stay friends. They're still friends! Very mature. I'm furious."],
                A: ["A little disappointed, but I'll be all right. {B} matters to me as a friend, too."],
                B: ["I hope {A} is okay. I made them a card. It says 'friends!!' with two exclamation points. Is that too many?"],
            },
            fizzle: {
                days: 2, end: true,
                sum: '{A} still hasn\'t said anything to {B}.',
                gossip: ["{A} STILL hasn't said anything to {B}. The suspense is killing me. I'm going to lie down."],
                A: ["I'm waiting for the right moment. Like a slow cooker. Good things take time."],
                B: ['{A} seems happier lately. Good for them.'],
            },
        },
    },
    breakup: {
        romance: true, roles: ['food', 'food'], weight: 2, needsCouple: true,
        start: 'fight',
        states: {
            fight: {
                days: 2, auto: d => d.rand < 0.55 ? 'makeup' : 'split',
                sum: '{A} and {B} had a fight about {thing}.',
                gossip: ["{A} and {B} disagreed about {thing}. I've never heard a {Ak} get so worked up about it.",
                    '{A} and {B} passed without a word. I was halfway through waving and didn\'t know where to put my hand.'],
                A: ["I'm not upset. I'm fine. I'm going to stand here and be fine at the ocean for a while.",
                    "{B} thinks they're right about {thing}. They're not. I'm not upset. Why would I be upset."],
                B: ['Did {A} say anything about me? ...Not that I care. I care a normal amount.',
                    "I'm not the one who started it. Well. I sort of started it. But I didn't START it."],
                opts: {
                    A: [{ label: 'Want me to talk to {B}?', need: f => !f.msgA && !f.msgB, say: ["...Maybe tell {B} I'm sorry about {thing}? Only if it comes up. Casually."], flag: 'msgA' },
                        { label: '{B} misses you.', need: f => f.msgB, say: ["They DO? ...I miss them too. I'm going over there. Right now. Let's go. Well, I'm going."], go: 'makeup', helped: true }],
                    B: [{ label: '{A} says sorry.', need: f => f.msgA, say: ["They said that? ...Okay. I'm sorry too. I'm going to go find them. Slowly. With dignity."], go: 'makeup', helped: true },
                        { label: 'Want me to talk to {A}?', need: f => !f.msgA && !f.msgB, say: ["Tell {A} I miss them. Don't tell {A} I said that. Tell them."], flag: 'msgB' }],
                },
                tell: { text: '{A} and {B} had a fight about {thing}.', react: ['Oh no. Not {A} and {B}! They were my favorite couple. Don\'t tell the other couples.'] },
            },
            makeup: {
                days: 3, end: true, date: true,
                sum: '{A} and {B} made up.',
                gossip: ["{A} and {B} made up! They're holding hands at the pier. It's disgusting. I love it."],
                A: ["{B} and I talked about {thing}. We still disagree, but we're listening to each other now."],
                B: ["{A} and I are good again. Better than good. Don't tell anyone I said 'better than good.'"],
            },
            split: {
                days: 4, end: true, enter: d => removeCouple(d.cast.A, d.cast.B),
                sum: '{A} and {B} broke up (very nicely).',
                gossip: ["{A} and {B} broke up. They say they're better as friends. They split the houseplants fifty-fifty."],
                A: ["We're better as friends. It's fine. I'm eating ice cream about it. A normal amount of ice cream."],
                B: ["{A} and I are just friends now. It's actually nice. We still wave. Two waves. That's the friend amount."],
            },
        },
    },
    backtalk: {
        roles: ['any', 'any'], weight: 3,
        start: 'start',
        states: {
            start: {
                days: 3, auto: 'blowsover', spreadTo: [3, 'hurt'],
                sum: "{A} said {B}'s {Bf} is 'a lot.' {B} doesn't know.",
                gossip: ["Okay, so {A} said {B}'s {Bf} is 'a lot.' {B} doesn't know yet. DON'T tell {B}.",
                    "Did you hear what {A} said about {B}'s {Bf}? I'm not repeating it. It was 'a lot.' That's what they said. 'A lot.'"],
                A: ['Oh, hey. Nice day. I definitely have not said anything about anybody. Why? What did you hear?',
                    'Sometimes things come out wrong. Hypothetically. Did something come out wrong? Hypothetically?'],
                B: ["Everyone's being weird today. They keep looking at my {Bf}. Is something on it?"],
                opts: {
                    B: [{ label: "So... {A} said your {Bf} is 'a lot.'", need: 'heard', say: ["'A LOT'? My {Bf} is a normal amount! ...Is it a lot? It's not a lot. I'm going to go think about my {Bf}."], go: 'hurt' }],
                    A: [{ label: 'People are talking about what you said about {B}.', need: 'heard', say: ["Oh no. It came out wrong! I meant 'a lot' like 'a lot of FUN.' I have to fix this."], go: 'apology', helped: true }],
                },
                tell: { text: "{A} said {B}'s {Bf} is 'a lot.'", react: ["They said WHAT? About the {Bf}? Oh, that's going to be a thing.", "That might sound worse each time somebody repeats it. I'd rather they talked to each other."] },
            },
            hurt: {
                days: 2, auto: 'apology',
                sum: '{B} heard what {A} said. They\'re not speaking.',
                gossip: ['{B} found out what {A} said. They waved at each other in a very cold way.'],
                A: ["{B} is upset with me. I didn't mean it like that! I meant a GOOD 'a lot.'"],
                B: ["I heard what {A} said about my {Bf}. I'd rather be left to be a {Bk} in peace for a while."],
                opts: { A: [{ label: '{B} is really hurt.', say: ["You're right. I'm going to apologize. With a card. With glitter. Glitter means it's serious."], go: 'apology', helped: true }] },
                tell: { text: '{B} is upset about what {A} said.', react: ['Poor {B}. Poor {A}, too, honestly. Words are hard.'] },
            },
            apology: {
                days: 3, end: true,
                sum: '{A} apologized to {B}. All good now.',
                gossip: ['{A} apologized to {B}! With a card! A handmade card! It had GLITTER.'],
                A: ["I apologized to {B}. They forgave me. I'm never saying anything about anyone again. Starting tomorrow."],
                B: ["{A} said sorry. They said my {Bf} is 'a lot' in a GOOD way. I'll allow it."],
            },
            blowsover: {
                days: 2, end: true,
                sum: 'Everyone forgot what {A} said about {B}.',
                gossip: ["Remember when {A} said the thing about {B}'s {Bf}? Nobody does. We're talking about clouds now."],
                A: ['I think everyone forgot the thing I said. Good. I said nothing. I never say anything.'],
            },
        },
    },
    mixup: {
        roles: ['any', 'any'], weight: 3,
        start: 'start',
        states: {
            start: {
                days: 3, auto: 'clear',
                sum: '{A} thinks {B} is mad at them.',
                gossip: ["{A} thinks {B} is mad at them. {B} walked right past them and didn't wave. The island is in shambles."],
                A: ["{B} walked right past me yesterday. Didn't wave. Didn't look. Are they mad at me? What did I do? I did something.",
                    "I've been going over it all night. Was it the thing I said about the weather? It was the weather thing."],
                B: ["Oh, hi! Sorry if I've been out of it. {reason}"],
                truthFrom: 'B',
                opts: {
                    A: [{ label: "{B} isn't mad at you!", need: f => f.truth, say: ["Oh! {reasonShort}? That's a relief. I made an apology cake. We can just enjoy the cake, then."], go: 'clear', helped: true }],
                    B: [{ label: '{A} thinks you\'re mad at them.', say: ["What?! I'm not mad! I have to go say hi. Loudly. With both arms."], go: 'clear', helped: true }],
                },
                tell: { text: '{A} thinks {B} is mad at them.', react: ["{B}? Mad? {B} doesn't get mad. {B} gets quiet. Oh no. Quiet is worse."] },
            },
            clear: {
                days: 2, end: true,
                sum: '{A} and {B} cleared it up.',
                gossip: ['{B} finally waved at {A}. With both hands. Crisis over. The island can breathe again.'],
                A: ["{B} isn't mad at me! I overthought it. I overthink everything. It's my cardio."],
                B: ["I can't believe {A} thought I was mad. I'm never mad. I was just {reasonMe}."],
            },
        },
    },
    party: {
        roles: ['any'], weight: 2, party: 2,
        start: 'announce',
        states: {
            announce: {
                days: 2, auto: 'party', enter: d => inviteSarah(d),
                sum: '{A} is throwing a party on {pday} at the {place}, 8 PM.',
                gossip: ["{A} is throwing a party on {pday} at the {place}! I'm bringing a dip. I don't know what kind yet. Emotionally, it's a queso."],
                A: ["Party! {pday}, the {place}, 8 PM. You're coming. You're on the list. The list is you and snacks."],
                tell: { text: '{A} is throwing a party on {pday}.', react: ["A party? I'm going. I'm already going. I'm bringing my good shoes."] },
            },
            party: {
                days: 1, auto: 'after', gathering: true,
                sum: "{A}'s party is tonight at the {place}, 8 PM.",
                gossip: ["The party's tonight! The {place}, 8 PM. I've been getting ready since noon."],
                A: ["Party tonight! The {place}, 8 PM. Don't be late. Actually, be a little late. It's cooler."],
            },
            after: {
                days: 2, end: true,
                sum: "{A}'s party was a hit.",
                gossip: ["{A}'s party was lovely. {C} danced on a bench. I hadn't known that was an option."],
                A: ['Thanks for coming to my party! Or, if you missed it, thanks for existing. Either way.'],
            },
        },
    },
    lostinvite: {
        roles: ['any', 'any'], weight: 2, party: 2,
        start: 'announce',
        states: {
            announce: {
                days: 2, auto: 'party', enter: d => { inviteSarah(d); dropLostInvite(d); },
                sum: "{B} wasn't invited to {A}'s party... or were they?",
                gossip: ["{A} is having a party and {B} wasn't invited?! {B} is devastated. Well. Mildly devastated. They're eating ice cream about it."],
                A: ['Did {B} say anything to you? I invited them to my party! They never answered. Is that rude? It feels a little rude.'],
                B: ["Everyone's going to {A}'s party. I wasn't invited. It's fine. I'll be at home. Alone. With my hobbies. I don't have hobbies."],
                opts: {
                    B: [{ label: 'I found your invite!', need: 'item:lost_invite', take: 'lost_invite', say: ['My invite?! It was {lostWhere}? So {A} DID invite me! I need an outfit. I need ALL the outfits!'], go: 'fixed', helped: true },
                        { label: '{A} did invite you! It got lost.', need: f => f.toldA, say: ["Really?! Oh, that's such a relief. I'll be there! I'm bringing a cake. A small one. For being dramatic."], go: 'fixed', helped: true }],
                    A: [{ label: '{B} never got the invite.', need: f => !f.toldA, say: ["They never GOT it? Oh no. The mail! Please tell {B} they're invited. Tell them twice."], flag: 'toldA' }],
                },
                tell: { text: "{B} wasn't invited to {A}'s party.", react: ["Not invited? That doesn't sound like {A}. Something's off. I can feel it."] },
            },
            fixed: {
                days: d => Math.max(1, d.pday - Drama.today()), auto: 'partyfixed',
                sum: '{B} got the lost invite. Party on {pday}!',
                gossip: ["{B}'s invite to {A}'s party got lost! And then FOUND. {B} is going! Everyone's going!"],
                A: ['{B} is coming to my party! Their invite got lost. Can you imagine? Mail is chaos.'],
                B: ["I'm going to {A}'s party after all! I've tried on nine outfits. I'm wearing the first one."],
            },
            party: {
                days: 1, auto: 'found', gathering: true, without: 'B',
                sum: "{A}'s party is tonight. {B} still thinks they weren't invited.",
                gossip: ["{A}'s party is tonight. {B} still thinks they weren't invited. This is a tragedy. A small one. With snacks."],
                A: ['The party is tonight! {B} still hasn\'t answered. I saved them a plate anyway.'],
                B: ["I hear music from the {place}. It's fine. I'm fine. I'm fine at home."],
            },
            partyfixed: {
                days: 1, auto: 'after', gathering: true,
                sum: "{A}'s party is tonight, and {B} is going.",
                gossip: ["{A}'s party is tonight! {B}'s coming after all. I've been told to act normal about it. I'm not good at that."],
                A: ['Party tonight! Everyone is coming. EVERYONE. Even {B}. Especially {B}.'],
                B: ["I'm going to {A}'s party tonight! I found an outfit! It's the first one I tried on."],
            },
            found: {
                days: 2, end: true,
                sum: "{B}'s invite turned up {lostWhere}. They laughed about it.",
                gossip: ["Turns out {B}'s invite was {lostWhere} the whole time. {A} and {B} laughed about it for an hour. Another party is already planned."],
                A: ["{B}'s invite was {lostWhere}! I'm throwing a make-up party. The parties never end."],
                B: ['My invite was {lostWhere}! I felt so silly. {A} saved me a plate. {A} is the best.'],
            },
            after: {
                days: 2, end: true,
                sum: "{A}'s party was great. {B} made it!",
                gossip: ["{A}'s party was so fun. {B} almost didn't come! Their invite got lost! They danced the most out of anyone."],
                A: ['Thanks for helping {B} find their invite. The party would not have been the same.'],
                B: ['I almost missed the party! Thank you, {name}. I danced so much. My legs are tired. I have legs now, apparently.'],
            },
        },
    },
    rivalry: {
        roles: ['any', 'food'], weight: 2,
        start: 'start',
        states: {
            start: {
                days: 2, auto: 'contest', enter: d => { d.cday = Drama.today() + 2; },
                sum: '{A} challenged {B} to a {contest}. It happens on {cdayName}.',
                gossip: ['{A} challenged {B} to a {contest}. They\'ve already begun discussing what counts as winning.'],
                A: ["I'm going to win the {contest}. {B} doesn't stand a chance. Nothing personal. It's very personal."],
                B: ['{A} thinks they can beat me at a {contest}. Well, I\'d hate to disappoint an audience.'],
                opts: {
                    A: [{ label: 'Can I be the judge?', need: f => !f.judge, say: ["YES. You're the judge. Be fair. Be fair to me specifically."], flag: 'judge' }],
                    B: [{ label: 'Can I be the judge?', need: f => !f.judge, say: ["You'd be a good judge. I've complete faith in your judgment. For now."], flag: 'judge' }],
                },
                tell: { text: '{A} challenged {B} to a {contest}.', react: ["A {contest}? I'm bringing snacks. I don't have a side. I have snacks."] },
            },
            contest: {
                days: 1, auto: d => d.flags.winner ? 'result' : 'tie', contest: true,
                sum: 'The {contest} is today.',
                gossip: ['{A} versus {B} in the {contest} today. I think both have prepared a victory speech.'],
                A: ['Today is the {contest}. I have been training. Mentally.'],
                B: ["It's {contest} day. I'm a very patient {Bk}. Right up until we find out who won."],
                opts: {
                    A: [{ label: 'Time to pick a winner!', need: f => f.judge && !f.winner, judge: true }],
                    B: [{ label: 'Time to pick a winner!', need: f => f.judge && !f.winner, judge: true }],
                },
            },
            result: {
                days: 2, end: true,
                sum: '{W} won the {contest}!',
                gossip: ["{W} won the {contest}! {L} said 'rematch next season.' They shook hands. Then {W} did a little dance."],
                W: ['I won! Did you see? Of course you saw. You were the judge. Thank you for your excellent judgment.'],
                L: ['{W} won, fair and square. Next season, though. Next season.'],
            },
            tie: {
                days: 2, end: true,
                sum: 'The {contest} ended in a tie.',
                gossip: ['A tie in the {contest}. Coco says the audience won. She was most of the audience.'],
                A: ['A tie. A TIE. I will accept this. For now.'],
                B: ['We tied. Honestly? Fair. We are both incredible.'],
            },
        },
    },
    borrowed: {
        roles: ['any', 'any'], weight: 2,
        start: 'start',
        states: {
            start: {
                days: 3, auto: 'returned',
                sum: "{A} borrowed {B}'s {item} and never gave it back.",
                gossip: ["{A} borrowed {B}'s {item} two weeks ago. {B} has begun finding reasons to mention it."],
                A: ["Hey, {name}! I've been using this {item} as a doorstop. Works great. I think it's {B}'s? I should probably... no, it's fine."],
                B: ["{A} borrowed my {item} two weeks ago. I'm not saying anything. I'm just saying it. Out loud. To you."],
                opts: { A: [{ label: '{B} wants their {item} back.', say: ["OH NO. I totally forgot! It's holding my door open! I'll bring it back right now. With a snack. An apology snack."], go: 'returned', helped: true }] },
                tell: { text: "{A} never gave back {B}'s {item}.", react: ['The {item}? Still? Oh, that is a classic. That is an island classic.'] },
            },
            returned: {
                days: 2, end: true,
                sum: "{A} gave back {B}'s {item}.",
                gossip: ["{A} finally gave back {B}'s {item}! With a snack! {B} is pretending they weren't upset. We all saw them be upset."],
                A: ["I gave {B} their {item} back. I got a new doorstop. It's a rock. It's a good rock."],
                B: ['I got my {item} back! And a snack. The snack was an apology snack. It tasted like sorry. Delicious.'],
            },
        },
    },
    surprise: {
        roles: ['any', 'food'], weight: 2, party: 2, honoree: 'B',
        start: 'plan',
        states: {
            plan: {
                days: 2, auto: 'party',
                sum: '{A} is throwing {B} a surprise party on {pday} at the {place}. Shh.',
                gossip: ["{A} is arranging a surprise for {B} on {pday}, at the {place}. I've been trusted with the bunting."],
                A: ["Shh! I'm throwing {B} a surprise party on {pday}, at the {place}, 8 PM. Don't tell {B}! Can you keep a secret?"],
                B: ['Everyone stops talking when I arrive. I checked my {Bf}. Nothing on it. Still no explanation.'],
                opts: {
                    A: [{ label: "I'll keep it a secret.", need: f => !f.promised, say: ["Thank you. I nearly told them myself yesterday. Had to change the subject to curtains."], flag: 'promised' }],
                    B: [{ label: 'Nothing is happening on {pday}.', need: f => !f.spoiled && !f.lured, say: ["Nothing on {pday}? That's an unusual thing to announce. Perhaps I'll stop by the {place} and see this nothing."], flag: 'lured' },
                        { label: '{A} is planning you a surprise party!', need: f => !f.spoiled, say: ["WHAT? For me? ...Okay. I'm going to act SO surprised. Watch. *gasp* Like that? Too much?"], flag: 'spoiled' }],
                },
                tell: { text: '{A} is throwing {B} a surprise party on {pday}.', react: ["A SURPRISE party? I'm going. I'm terrible at surprises. I'm going to yell 'surprise' too early."] },
            },
            party: {
                days: 1, auto: 'after', gathering: true,
                sum: "{B}'s surprise party is tonight at the {place}.",
                gossip: ["Surprise party for {B} tonight. The {place}, at 8 PM. I've hidden the decorations badly. Don't look behind me."],
                A: ["Bring {B} to the {place} at eight if you see them. Everything else is ready. Except me. Give me a minute."],
                B: ['Everyone keeps telling me to go to the {place} tonight. For no reason. Okay!'],
            },
            after: {
                days: 2, end: true,
                sum: "{B}'s surprise party was perfect.",
                gossip: ["{B}'s surprise party was perfect. {B} screamed. In a good way. Then cried. Also in a good way."],
                A: ['The surprise worked! Mostly! Thank you for helping. Or for not helping. Either way, it worked.'],
                B: ['Did you know about my surprise party? Everyone knew! I had no idea! (I had some idea.)'],
            },
        },
    },
};
const PARTY_LINES = ["This is the best party on the island. It's the only party on the island. Still counts.",
    '{A} made a playlist. It is one song. It is a great song.', "I'm having so much fun. Is it too much fun? It's the right amount.",
    'Somebody put hot sauce in the punch. It was Chili. It is always Chili.', "These are good snacks. I keep going over to check they're still good.",
    'Wasabi\'s playing music from his phone. He\'s still making all the introductions.'];

/* ---------------------------------------------------------------- couples + helpers */
function coupleOf(id) {
    const c = (S.drama && S.drama.couples || []).find(p => p[0] === id || p[1] === id);
    return c ? (c[0] === id ? c[1] : c[0]) : null;
}
function addCouple(a, b) { const st = Drama.st(); if (!coupleOf(a) && !coupleOf(b)) st.couples.push([a, b, Clock.dayNum()]); }
function removeCouple(a, b) { const st = Drama.st(); st.couples = st.couples.filter(p => !(p.includes(a) && p.includes(b))); }
function inviteSarah(d) {
    const host = NPC_DEFS[d.cast.A].name;
    const surprise = d.tpl === 'surprise';
    sendMail({ from: d.cast.A, subject: surprise ? 'Top secret' : 'You\'re invited!',
        body: surprise ? `{name}!\nSurprise party for ${NPC_DEFS[d.cast.B].name}. ${d.pdayName}, 8 PM, the ${d.place}.\nDon't tell. Seriously.\n- ${host}`
            : `{name}!\nParty! ${d.pdayName}, 8 PM, the ${d.place}.\nBring yourself. Snacks optional. Snacks encouraged.\n- ${host}` });
}
function dropLostInvite(d) {
    const s = W0.spots[d.lostSpot] || W0.spots.plaza;
    const a = G.areas.island;
    const f = a ? a.nearestFree(s.x + 1, s.y + 1, 4) : [s.x, s.y];
    const drop = { area: 'island', id: 'lost_invite', x: (f[0] + 0.5) * TILE, y: (f[1] + 0.8) * TILE, dramaId: d.id };
    S.drops.push(drop);
    if (a) { const e = makeItemEnt('lost_invite', drop.x, drop.y); e.dropRef = drop; e.twinkle = true; a.add(e); }
}

/* voices: the same storyline line sounds different coming from each neighbor */
const BOSTON = { car: 'cah', cars: 'cahs', park: 'pahk', party: 'pahty', parties: 'pahties', hard: 'hahd', smart: 'smaht', heart: 'haht', start: 'staht',
    started: 'stahted', part: 'paht', yard: 'yahd', dark: 'dahk', far: 'fah', bar: 'bah', star: 'stah', are: 'ah', harvard: 'Hahvahd', never: 'nevah',
    ever: 'evah', whatever: 'whatevah', over: 'ovah', after: 'aftah', better: 'bettah', water: 'watah', dinner: 'dinnah', sister: 'sistah', weather: 'weathah',
    forever: 'forevah', together: 'togethah', remember: 'remembah', number: 'numbah', summer: 'summah', winter: 'wintah', here: 'heah', there: 'theah',
    where: 'wheah', more: 'moah', door: 'doah', floor: 'floah', four: 'foah', very: 'wicked', really: 'wicked', sure: 'shuah', card: 'cahd', guard: 'guahd',
    hear: 'heah', near: 'neah', year: 'yeah', dear: 'deah', idea: 'idear', water_: 'watah', corner: 'cornah', order: 'ordah', paper: 'papah', super: 'supah' };
function bostonize(s) {
    return s.replace(/[A-Za-z']+/g, w => {
        const lw = w.toLowerCase();
        let out = BOSTON[lw];
        if (!out && /^[a-z]{3,}ing$/i.test(w) && !/^(thing|king|ring|sing|wing|bring|spring|string|sling|swing|sting)$/i.test(lw)) out = lw.slice(0, -3) + "in'";
        if (!out) return w;
        if (w[0] === w[0].toUpperCase()) out = out[0].toUpperCase() + out.slice(1);
        if (w === w.toUpperCase() && w.length > 1) out = out.toUpperCase();
        return out;
    });
}
function voiced(id, text, gossip) {
    const r = mulberry(hash32(id + ':' + text.length + ':' + Clock.dayNum()));
    const roll = r();
    if (G.events && G.events.has('pirateday') && r() < 0.6) text = rpick(['Arr! ', 'Ahoy! ', 'Yarr. ']) + text + (r() < 0.4 ? ' Matey.' : '');
    // (each neighbor's catchphrase at the end of some lines, catchTail: their own, or one Sarah gave them, 6zk_catchphrases.js)
    switch (id) {
        case 'sully': text = bostonize(text); if (roll < 0.3) text = 'Kid. ' + text; else if (roll < 0.45) text += catchTail(id); break;
        case 'coco': if (roll < 0.35) text = 'Okay, so. ' + text; else if (gossip && roll < 0.65) text += ' I would NEVER repeat this. (I have repeated it six times.)'; else if (roll < 0.5) text += catchTail(id); break;
        case 'kai': if (roll < 0.4) text += catchTail(id); else if (roll < 0.6) text = text.replace(/very /g, 'super '); break;
        case 'chili': if (roll < 0.3) text += catchTail(id); break;
        case 'cece': if (roll < 0.3) text = 'Sorry! ' + text; else if (roll < 0.55) text += catchTail(id); break;
        case 'clementine': if (roll < 0.4) text = 'Darling. ' + text; else if (roll < 0.55) text += catchTail(id); break;
        case 'cuke': text = text.replace(/\.(\s|$)/g, '!$1'); if (roll < 0.25) text += catchTail(id); break;
        case 'maki': if (roll < 0.3) text = 'To be precise: ' + text; else if (roll < 0.45) text += catchTail(id); break;
        case 'basil': if (roll < 0.25) text += ' Anyway. Noodles later?'; else if (roll < 0.4) text += catchTail(id); break;
        case 'wonton': if (roll < 0.2) text += catchTail(id); break;
        case 'david': if (roll < 0.25) text = 'Honey. ' + text; else if (roll < 0.45) text += catchTail(id); break;
        case 'ginger': if (roll < 0.3) text += catchTail(id); else if (roll < 0.45) text = 'Okay, structurally? ' + text; break;
        case 'brulee': if (roll < 0.3) text = 'Ah. ' + text; else if (roll < 0.5) text += catchTail(id); break;
        case 'mac': if (roll < 0.3) text += ' Anyway, are you hungry?'; else if (roll < 0.42) text += catchTail(id); break;
        case 'joe': if (roll < 0.12) text += catchTail(id); break;
    }
    return text;
}

/* ---------------------------------------------------------------- the engine */
const Drama = {
    version: 0,
    st() {
        if (!S.drama) S.drama = { cur: null, quietUntil: Clock.dayNum() + 2, couples: [], seq: 0, lastCast: [], lastDay: Clock.dayNum() };
        return S.drama;
    },
    cur() { return S && S.drama ? S.drama.cur : null; },
    tpl(d) { return DRAMAS[d.tpl]; },
    state(d) { return this.tpl(d).states[d.state]; },
    /* fill a line with the storyline's names and details */
    fill(d, text) {
        const nm = id => (id && NPC_DEFS[id] ? NPC_DEFS[id].name : '');
        const c = d.cast;
        const W = d.flags.winner === 'B' ? c.B : c.A, L = d.flags.winner === 'B' ? c.A : c.B;
        const rs = d.reason || ['', '', ''];
        return fillText(text.replace(/\{A\}/g, nm(c.A)).replace(/\{B\}/g, nm(c.B)).replace(/\{C\}/g, nm(d.extra || c.C || 'coco'))
            .replace(/\{W\}/g, nm(W)).replace(/\{L\}/g, nm(L))
            .replace(/\{Af\}/g, TRAIT[c.A] ? TRAIT[c.A][0] : '').replace(/\{Bf\}/g, TRAIT[c.B] ? TRAIT[c.B][0] : '')
            .replace(/\{Ak\}/g, TRAIT[c.A] ? TRAIT[c.A][1] : '').replace(/\{Bk\}/g, TRAIT[c.B] ? TRAIT[c.B][1] : '')
            .replace(/\{thing\}/g, d.thing || '').replace(/\{contest\}/g, d.contest || '').replace(/\{item\}/g, d.item || '')
            .replace(/\{place\}/g, d.place || 'plaza').replace(/\{pday\}/g, d.pdayName || '').replace(/\{cdayName\}/g, d.cdayName || '')
            .replace(/\{reason\}/g, rs[0]).replace(/\{reasonShort\}/g, rs[1]).replace(/\{reasonMe\}/g, rs[2])
            .replace(/\{lostWhere\}/g, d.lostWhere || ''));
    },
    roleOf(d, id) {
        if (!d) return null;
        for (const [k, v] of Object.entries(d.cast)) if (v === id) {
            const st = this.state(d);
            if (st.W || st.L) { const winner = d.flags.winner === 'B' ? d.cast.B : d.cast.A; return id === winner ? 'W' : 'L'; }
            return k;
        }
        return null;
    },
    /* a new island day: move the current storyline along, or maybe start one */
    now: null,
    today() { return this.now != null ? this.now : Clock.dayNum(); },
    /* called when a new island day starts; catches up if Sarah was away for a few days */
    daily(day) {
        const st = this.st();
        const from = Math.max((st.lastDay || day - 1) + 1, day - 10);
        for (let dd = from; dd <= day; dd++) { this.now = dd; this.step(dd); }
        this.now = null;
        st.lastDay = day;
    },
    step(day) {
        const st = this.st();
        const d = st.cur;
        if (d) {
            const s = this.state(d);
            if (day - d.stateDay >= (d.stateLen || 1)) {
                if (s.end) this.finish(d);
                else this.setState(d, this.resolve(d, s.auto));
            }
            return;
        }
        if (day < st.quietUntil) return;
        const r = mulberry(hash32(S.seed + ':drama:' + day));
        if (r() < 0.4) this.begin(r);
    },
    resolve(d, next) { d.rand = R(); return typeof next === 'function' ? next(d) : next; },
    begin(r, force) {
        const st = this.st();
        const met = id => S.npcs[id] && S.npcs[id].met;
        // (nobody about to go on vacation: 6zj_vacations.js)
        const here = id => force || !vacationSoon(id);
        const food = DRAMA_FOOD.filter(met).filter(here), humans = DRAMA_HUMAN.filter(met);
        if (food.length + humans.length < 4 && !force) return null;
        const ids = Object.keys(DRAMAS).filter(k => k !== st.lastTpl || force);
        const couples = st.couples.filter(p => DRAMA_FOOD.includes(p[0]) && DRAMA_FOOD.includes(p[1]) && here(p[0]) && here(p[1]));
        const pick = force ? force.tpl : weighted(ids.filter(k => !DRAMAS[k].needsCouple || couples.length).map(k => [k, DRAMAS[k].weight]), r);
        const T = DRAMAS[pick];
        const cast = {};
        const allowHuman = force ? true : r() < 0.15;
        let humanUsed = false;
        const recent = new Set(st.lastCast || []);
        if (T.needsCouple) {
            const c = force && force.cast ? [force.cast.A, force.cast.B] : rpick(couples, r);
            if (!c) return null;
            cast.A = c[0]; cast.B = c[1];
        } else {
            T.roles.forEach((kind, i) => {
                const role = 'ABC'[i];
                if (force && force.cast && force.cast[role]) { cast[role] = force.cast[role]; if (DRAMA_HUMAN.includes(cast[role])) humanUsed = true; return; }
                let pool = food.slice();
                if (kind === 'any' && allowHuman && !humanUsed && !T.romance) pool = pool.concat(humans);
                pool = pool.filter(id => !Object.values(cast).includes(id));
                const fresh = pool.filter(id => !recent.has(id));
                const who = rpick(fresh.length ? fresh : pool, r);
                if (!who) return;
                cast[role] = who;
                if (DRAMA_HUMAN.includes(who)) humanUsed = true;
            });
        }
        if (Object.keys(cast).length < T.roles.length) return null;
        if (T.ok && !T.ok(cast) && !force) return null;
        // bystanders who'll talk about it (Coco is very likely one of them)
        const others = food.filter(id => !Object.values(cast).includes(id));
        const gossipers = [];
        if (others.includes('coco') && r() < 0.8) gossipers.push('coco');
        for (const id of shuffled(others, r)) { if (gossipers.length >= 3) break; if (!gossipers.includes(id)) gossipers.push(id); }
        const day = this.today();
        const d = { id: ++st.seq, tpl: pick, cast, state: null, stateDay: day, start: day, flags: {}, knows: {}, said: {}, spread: 0,
            heard: null, used: {}, helped: false };
        for (const g of gossipers) d.knows[g] = true;
        d.gossipers = gossipers;
        d.thing = rpick(DRAMA_BITS.thing, r); d.contest = rpick(DRAMA_BITS.contest, r); d.item = rpick(DRAMA_BITS.item, r);
        d.place = rpick(DRAMA_BITS.place, r); d.reason = rpick(DRAMA_BITS.reason, r);
        const lost = rpick(DRAMA_BITS.lost, r); d.lostWhere = lost[0]; d.lostSpot = lost[1];
        if (T.party) {
            d.pday = day + T.party;
            d.pdayName = WEEKDAYS[(Clock.weekday() + (day - Clock.dayNum()) + T.party + 70) % 7];
            d.guests = shuffled(food.concat(humans).filter(id => !Object.values(cast).includes(id)), r).slice(0, 5);
            if (T.honoree) d.guests = d.guests.filter(id => id !== cast[T.honoree]);
        }
        d.cdayName = WEEKDAYS[(Clock.weekday() + (day - Clock.dayNum()) + 2 + 70) % 7];
        st.cur = d;
        st.lastTpl = pick;
        st.lastCast = Object.values(cast);
        this.setState(d, T.start);
        return d;
    },
    setState(d, name) {
        d.state = name;
        d.stateDay = this.today();
        d.said = {};
        const s = this.state(d);
        d.stateLen = typeof s.days === 'function' ? s.days(d) : s.days;
        if (s.enter) s.enter(d);
        bondDrama(d);             // (the neighbors' own friendships move with it: 6zn_bonds.js)
        if (name === 'after') { const g = (d.guests || []).filter(Boolean); d.extra = g.length ? rpick(g) : null; }
        this.version++;
        Save.touch();
    },
    finish(d) {
        const st = this.st();
        const r = mulberry(hash32(S.seed + ':quiet:' + d.id));
        st.cur = null;
        st.quietUntil = this.today() + 5 + Math.floor(r() * 5);
        S.drops = S.drops.filter(x => x.dramaId !== d.id);
        const a = G.areas && G.areas.island;
        if (a) a.ents = a.ents.filter(e => !(e.dropRef && e.dropRef.dramaId === d.id));
        this.version++;
        Save.touch();
    },
    /* Sarah has heard about it (that's what lets her pass it on) */
    note(d) {
        if (d.heard === d.state) return;
        d.heard = d.state;
    },
    /* what n says about it today (once a day each), or null */
    lineFor(n) {
        const d = this.cur();
        if (!d) return null;
        const id = n.id, day = Clock.dayNum();
        if (d.said[id] === day) return null;
        const s = this.state(d);
        const role = this.roleOf(d, id);
        let pool = null, gossip = false;
        if (role && s[role]) pool = s[role];
        else if (!role && d.knows[id] && s.gossip) {
            const r = mulberry(hash32(id + ':tea:' + d.id + ':' + day));
            if (r() < 0.7) { pool = s.gossip; gossip = true; }
        }
        if (!pool) return null;
        d.said[id] = day;
        const r = mulberry(hash32(id + ':' + d.state + ':' + day));
        const line = this.fill(d, pool[Math.floor(r() * pool.length)]);
        if (s.truthFrom === role) d.flags.truth = true;
        this.note(d);
        return voiced(id, line, gossip);
    },
    /* Sarah's choices with n right now */
    options(n) {
        const d = this.cur();
        if (!d) return [];
        const s = this.state(d);
        const role = this.roleOf(d, n.id);
        const out = [];
        const party = this.partyNow();
        if (party && (role || (d.guests || []).includes(n.id)) && !d.flags.sarahCame) out.push({ label: 'Party time!', party: true });
        if (role && s.opts && s.opts[role]) {
            for (const o of s.opts[role]) {
                const key = d.state + ':' + role + ':' + o.label;
                if (d.used[key]) continue;
                if (o.need === 'heard' && !d.heard) continue;
                if (typeof o.need === 'string' && o.need.startsWith('item:') && !pocketCount(o.need.slice(5))) continue;
                if (typeof o.need === 'function' && !o.need(d.flags)) continue;
                out.push(Object.assign({ key, label: this.fill(d, o.label) }, { o }));
            }
        } else if (!role && s.tell && d.heard && !d.knows[n.id] && n.id !== 'goat') {
            out.push({ label: 'Did you hear...?', tell: true });
        }
        return out.slice(0, 2);
    },
    async choose(n, opt) {
        const d = this.cur();
        if (!d) return;
        const s = this.state(d);
        const id = n.id;
        if (opt.party) { await partyScene(d); return; }
        if (opt.tell) {
            UI.hideDialog();
            await UI.say(null, `Sarah tells ${n.def.name}: "${this.fill(d, s.tell.text)}"`, { keep: true });
            d.knows[id] = true;
            d.spread++;
            n.emote = 'bang'; n.emoteT = 60;
            await UI.say(id, voiced(id, this.fill(d, rpick(s.tell.react)), true), { keep: true });
            if (s.spreadTo && d.spread >= s.spreadTo[0]) this.setState(d, s.spreadTo[1]);
            Save.touch();
            return;
        }
        const o = opt.o;
        d.used[opt.key] = true;
        if (o.take) removeItem(o.take, 1);
        if (o.judge) {
            const c = d.cast;
            const k = await UI.ask(null, this.fill(d, 'Who wins the {contest}?'), [NPC_DEFS[c.A].name, NPC_DEFS[c.B].name, "It's a tie!"], { keep: true });
            d.flags.winner = k === 0 ? 'A' : k === 1 ? 'B' : 'tie';
            Sfx.play('fanfare');
            confetti(n.x, n.y - 20, 30);
            this.setState(d, k === 2 ? 'tie' : 'result');
            await UI.say(null, k === 2 ? 'Sarah declares a tie. Everyone claps. Coco claps loudest.' : `Sarah declares ${NPC_DEFS[k === 0 ? c.A : c.B].name} the winner!`, { keep: true });
            return;
        }
        if (o.say) await UI.say(id, voiced(id, this.fill(d, rpick(o.say))), { keep: true });
        if (o.flag) d.flags[o.flag] = true;
        if (o.helped) { d.helped = true; addPts(id, 2); }
        if (o.go) this.setState(d, this.resolve(d, o.go));
        Save.touch();
    },
    /* storylines move people around: dates at the pier, parties, contests */
    override(id, day) {
        const d = this.cur();
        if (!d || !S) return null;
        const s = this.state(d);
        const role = this.roleOf(d, id);
        const out = [];
        if (s.date && (role === 'A' || role === 'B')) out.push(['pier', 19, 20.6]);
        if (s.gathering && d.pday === day) {
            const skip = s.without ? d.cast[s.without] : null;
            if ((role && id !== skip) || (d.guests || []).includes(id)) out.push(['party:' + d.place, 20, 23]);
        }
        if (s.contest && (role === 'A' || role === 'B')) out.push(['party:beach', 16, 18.5]);
        return out.length ? out : null;
    },
    partyNow() {
        const d = this.cur();
        if (!d) return false;
        const s = this.state(d);
        const dh = dayHour();
        return !!(s.gathering && d.pday === Clock.dayNum() && dh >= 20 && dh < 23 && G.area.id === 'island');
    },
};
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/* ---------------------------------------------------------------- the party itself */
async function partyScene(d) {
    const c = d.cast, p = G.player;
    d.flags.sarahCame = true;
    UI.hideDialog();
    const guests = NPCs.here().filter(n => (d.guests || []).includes(n.id) || Object.values(c).includes(n.id));
    Sfx.play('party');
    confetti(p.x, p.y - 24, 70);
    for (const n of guests) { n.emote = rpick(['note', 'heart', 'laugh']); n.emoteT = 120; }
    if (d.tpl === 'surprise') {
        await UI.say('everyone', `SURPRISE, ${NPC_DEFS[c.B].name.toUpperCase()}!`, { keep: true });
        await UI.say(c.B, d.flags.spoiled ? "Surprise! Oh, wait, that's your bit. Sarah told me, but I still got excited." : "WHAT?! For ME? I had NO idea! (I had a little idea.) I love you all!", { keep: true });
    } else {
        await UI.say(c.A, voiced(c.A, rpick(["You made it! Welcome to the party! There's dip!", "{name}! Yes! Now it's a party. Snacks are over there. Music is everywhere."].map(t => Drama.fill(d, t)))), { keep: true });
    }
    for (const n of shuffled(guests).slice(0, 3)) {
        if (n.id === c.A) continue;
        await UI.say(n.id, voiced(n.id, Drama.fill(d, rpick(PARTY_LINES)), false), { keep: true });
    }
    // everyone dances for a moment
    UI.hideDialog();
    p.pose = 'cheer'; p.poseT = 60;
    for (let i = 0; i < 50; i++) { for (const n of guests) n.hop = Math.abs(Math.sin(i / 3 + n.x)) * 4; if (i % 12 === 0) confetti(p.x + rint(-40, 40), p.y - 30, 12); await waitFrames(2); }
    for (const n of guests) n.hop = 0;
    const favor = !S.wardrobe.accs.includes('partyhat') && !pocketCount('acc_partyhat') ? 'acc_partyhat' : rpick(['cheesecake', 'truffles', 'fruit_salad', 'lychee_ice']);
    await UI.say(null, 'Everyone dances. Somebody hands Sarah a party favor.', { keep: true });
    receive(favor, 1);
    for (const n of guests) addPts(n.id, 1);
    Save.touch();
}

/* finding the lost invite */
Bus.on('got', id => {
    const d = Drama.cur();
    if (id !== 'lost_invite' || !d || d.tpl !== 'lostinvite') return;
    setTimeout(() => { if (!G.busy) UI.say(null, Drama.fill(d, "A party invitation. It's addressed to {B}, from {A}. It must have blown away.")); }, 400);
    Drama.note(d);
});

