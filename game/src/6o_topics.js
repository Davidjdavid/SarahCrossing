/* ---- 6o_topics.js ---- */
/* What neighbors talk about. Walking up to someone gets a short hello; choosing Talk picks a topic: their own
   stuff, Harvard facts and jokes, Boston, Star Trek, Tamagotchi, Frasier, pottery, the weather and the season, what
   Sarah did today, her stats, outfits, the museum, what's in her pocket, where they are, what's going on around the
   island, tips, Joe's poems (which everyone adores), arcade scores, and rumors about the island's old mysteries.
   Talk rests for five minutes after (come back too soon and they'll tell you). */

/* ---------------------------------------------------------------- hellos */
const OPENERS = {
    maki: ['Hello, {name}. You\'re a little early. Nothing to worry about. I\'ll move the greeting forward.', 'Ah. {name}. Good. I was just straightening something.', 'Hello. Please mind the rice.', 'Oh. {name}. Hello. ...Yes, that was the greeting. I was waiting to see if you needed anything.'],
    kai: ['Heyyy, {name}! What up!', 'Bowl-oha, {name}!', "{name}! My favorite human! Don't tell the other humans.", 'Yo! Perfect timing!'],
    basil: ['Hey, {name}. Relax. Stay a while.', 'Oh, {name}. Hello. Just taking a break. If anyone asks, I was thinking about noodles.', 'Hi. I was just thinking about noodles. As usual.'],
    wonton: ['Oh! Hi, {name}! Warm day! Well. Warm for me.', 'Hi hi! Welcome! Not to the soup. To the conversation.', '{name}! Nice to see you through all this steam.'],
    chili: ["Oh, it's you. The only person who can handle my heat.", 'Hey, {name}. Things are heating up. They always are.', '{name}! I thought that was you. Didn\'t wave in case it wasn\'t. I have a reputation.'],
    coco: ['Girl. GIRL. Hi.', '{name}! Oh my GOD, perfect timing.', 'Hiii! Come here. Closer. Okay, not that close.', 'Oh good, it\'s you. I have things to say.'],
    cece: ['Hi, {name}! I had a really good way of saying hello just now. I used it on a bird.', 'Hi! You scared me! In a nice way! Sorry!', '{name}! Oh, good. A person. I\'ve been talking to the oven all afternoon.'],
    clementine: ['Darling.', 'Ah. {name}. You look... acceptable. Better than acceptable. Fine: good.', 'Darling, hello. Mind the peel.'],
    cuke: ["{name}!! HI!! I've been up since 4!", 'Good morning! It\'s always morning somewhere!', 'Hey hey! Stretch with me! No? Okay!'],
    sully: ["Hey, kid. How ya doin'.", "Kid! There ya are.", "How's it goin', {name}. Wicked good to see ya."],
    david: ['SISTER! Hi!', 'Honey! You look amazing. I look amazing. Hi.', '{name}! Iconic timing.'],
    ginger: ["Hiya, {name}! Mind the sawdust.", "Oh hey! Just measuring something. It's fine. It's level.", '{name}! Hold this a second. ...Thanks. Oh, hello, by the way.'],
    brulee: ['Bonjour, {name}!', 'Ah! {name}! Welcome, welcome.', 'Hello, mon amie. Please do not tap my top.'],
    mac: ["{name}! Hi! You look hungry.", 'Hey hey! Come here! Have you eaten?', "Oh, it's you! My favorite customer. Don't tell the others."],
    joe: ['Hey, you.', 'Oh, hi! I was just thinking about... a rhyme for "orange." Only that. Not about you. Why would I be thinking about you?',
        "Hi! Oh. Hi. I wasn't waiting for you or anything. I was just standing here. For an hour."],
};
const OPENER_ANY = ['Oh, hi, {name}!', 'Hey, {name}!', 'Hi there!', 'Oh! Hi!'];
function openerLine(n, first) {
    const id = n.id, own = OPENERS[id] || OPENER_ANY;
    if (first && R() < 0.5) {
        const greet = { morning: 'Good morning, {name}!', afternoon: 'Hi, {name}! Good afternoon!', evening: 'Good evening, {name}!', night: "Hey, {name}! Up late? Me too. Obviously." }[partOfDay()];
        return voiced(id, greet);
    }
    const w = G.weather;
    if (R() < 0.25) {
        if (w === 'rain') return voiced(id, rpick(['{name}! Rainy one, huh?', 'Hi! Wet day! Everything is shiny.', 'Hey! Nice weather for ducks. And fish. And Kai.']));
        if (w === 'snow') return voiced(id, rpick(['{name}! It\'s SNOWING!', 'Hi! Brr! Snow day!', 'Hey! Look at all this snow!']));
        if (partOfDay() === 'night') return voiced(id, rpick(["Hey, night owl.", 'Oh, hi! Isn\'t the night the best?', 'Hi, {name}! Look at those stars.']));
    }
    return rpick(own);
}

/* ---------------------------------------------------------------- too soon! (Talk rests for five minutes) */
const TOO_SOON_ANY = [
    ["Back already? I haven't thought of anything new yet! Give me a few minutes.", "We JUST talked! I'm flattered. I'm out of material, but flattered.",
        "Oh, hi again! I'm still thinking about our last chat. Give me {min} {mins}.", "I've got nothing new yet! Come back in a few minutes and I'll have news. Probably."],
    ["{name}, I love you, but I've used up every word I know. Give me a few minutes.", "Still nothing new! Unless you want to hear the same thing again. I didn't think so.",
        'Twice in a row! My brain needs {min} more {mins} to come up with something good.'],
    ['...', "I'm going to need you to go fishing or something. Then come back. I'll have stories. I promise.", 'Okay, at this point I\'m just going to wave. *waves*'],
];
const TOO_SOON = {
    maki: ['We just spoke. I have not had time to reorganize my thoughts.', 'Still nothing. My thoughts are in alphabetical order and I am only at "B."', '...'],
    kai: ["Duuude, we JUST talked! I've got nothing new. The ocean's still wet, though.", "Give me a few minutes, bro. My thoughts are moving at beach speed.", '*gives you a silent shaka*'],
    basil: ["Back so soon? The noodles aren't even done. Give me a few minutes.", 'Patience. Good broth takes time. So do good stories.', '*hums a relaxed tune at you*'],
    wonton: ["Oh! Hi again! I'm still soaking in our last talk. Give me a bit.", "I've got nothing new! I've just been sitting in warm water. Not soup. Water.", '*bubbles quietly*'],
    chili: ["Didn't we just talk? Give me a minute. I haven't had time to improve the story.", "Still nothing new. I'm simmering. Let me simmer.", "*tries to look busy. Checks an empty wrist.*"],
    coco: ['Girl, I JUST told you everything! Give me a few minutes to find new tea.', 'Nothing new yet! Nobody has done ANYTHING in the last five minutes. Ugh. Islands.', "I'm going to go gather gossip. Wait here. (Don't wait here.)"],
    cece: ["Hi again! Did I forget to say goodbye? Oh, no. Am I still saying hello?", "I haven't got anything new yet! Unless you want to hear about the oven again. I would. I wouldn't ask that of you.", '*apologizes silently*'],
    clementine: ['Darling. We just spoke. Leave them wanting more.', "Give me a moment, darling. A conversation should have an interval.", '*lowers her sunglasses. Raises them again.*'],
    cuke: ['AGAIN?! I love the energy! I have no new facts! Come back in five!', "I've done three laps since we talked! Still no news! Hydrate!", '*jogs in place, beaming*'],
    sully: ['Kid, we just talked. Go get a frappe, come back.', "Still nothin'. I'm a cake, not a newspapah.", '*nods at you, wicked quietly*'],
    ginger: ["Give me a few minutes to finish this plan. Then I'll have both ears for you.", 'Still sketching a new thought. Give it a minute to set.', '*gives you a thumbs up and keeps sketching*'],
    brulee: ['Ah! Again! I am flattered, but I have no new thoughts. The last ones are still drying.', 'Patience, mon amie. Art takes time. So does conversation.', '*gestures gracefully at nothing*'],
    mac: ["Back already? Hungry? I'm out of stories, but never out of food.", "Still nothing new! Give me a few minutes. The cheese needs to melt.", '*offers you an imaginary plate*'],
    joe: ["Hey! Back so soon? (Joe tries very hard to look casual.) I'm out of things to say, though. Give me a few.", "I've got nothing new! Unless you want a poem. I always have a poem.", "Still thinking. Thinking is hard. I'm doing it for you, though."],
    david: ['Honey, I JUST dazzled you. Let the sparkle settle.', "Still nothing new. I'm iconic, not infinite.", '*strikes a pose instead of speaking*'],
};

/* ---------------------------------------------------------------- gifts that make no sense */
const BAD_GIFT = {
    tool: ["Your {item}? You need that! What would I even do with it? ...Don't answer that. Keep it.", "For me? That's so sweet, but you'd be lost without your {item}. Keep it!"],
    wood: ["A log. A whole log. Thank you? I don't have a fireplace. Ginger's the one who goes wild for wood.", "Wood! Just... plain wood. What do I do with it? Stare at it? Ginger builds with this stuff. Try her!"],
    seed: ["Seeds? That's sweet, but I'd forget to water them. They'll be happier in your garden.", "You're giving me seeds? I can't grow anything. I once wilted a cactus by talking to it too much. Plant them yourself!"],
    sapling: ["A baby tree? I can't take care of a tree! I can barely take care of me. Plant it somewhere sunny!"],
    pantry: ["Just... raw {item}? What am I supposed to do with it? You're the cook! Make something with it and I'll happily eat it.", "Plain {item}? That's an ingredient, not a present! Cook me something and we'll talk."],
    boot: ['An old boot? Is this a present or a warning?'],
    display: ['A whole {item}? Where would I even put it? My pocket? Set it up outside with Island edit!'],
    ownphoto: ["That's MY photo! I gave it to YOU! You're supposed to keep it. That's the whole point!"],
    photo: ['Aw, it\'s {who}! But {who} gave that to you. You should keep it!'],
    keepsake: ["Ooh, what is it? ...Oh, that's special. You should keep it. Or show Joe! He writes poems about stuff like this."],
};
const BAD_GIFT_OWN = {
    maki: { tool: 'Why are you handing me a tool. I am a sushi roll. This is how scary stories start.', pantry: 'An unassembled ingredient. I cannot accept this. Please bring it back when everyone knows where they\'re supposed to be.' },
    wonton: { tool: "A... tool? Near ME? I'm a dumpling! Is this a threat? Please take it back!" },
    chili: { seed: "Seeds? You think I'm ready to look after a plant? I can barely be one. Keep them somewhere warm." },
    cuke: { seed: 'Seeds! Plant them in the garden! I tried cheering some on, but apparently they also need soil!', tool: "A tool! Oh! No, I only lift weights. And water bottles. Keep it!" },
    coco: { wood: "A log? I'm flattered you think I have hidden talents. I don't. Ask Ginger." },
    clementine: { wood: 'Darling. A log. Unfinished wood is not a look.', tool: 'A tool. How rugged. Not for me. For you.', pantry: 'Raw ingredients. Darling, I am a finished product. Bring me finished products.' },
    sully: { tool: "Kid, I got tools. It's New England. Everybody's got a shovel. Keep it.", pantry: 'Raw {item}? What am I, a pantry? Bake somethin\' with it, kid.' },
    david: { wood: 'A log. Honey. I camp in a TENT. I have enough nature. Bedazzled? No? Then keep it.', tool: 'A tool? For me? The only tool I need is my roller skates. And my charm.' },
    brulee: { wood: 'Plain wood? Ginger could make something useful. I\'d spend all day deciding where to sign it.', tool: 'A tool? I am a dessert, not a handyman. Ginger is the handyman.' },
    mac: { seed: "Seeds? I cook things AFTER they grow! You're skipping ahead! Plant them!", pantry: "An ingredient! For the chef! ...You know what? Cook it into something. I want to taste YOUR cooking." },
    kai: { tool: "Your {item}? Bro, you need that! How else will you fish? Keep it!" },
    basil: { pantry: 'Plain {item}. Thank you, but you have a kitchen, and so do I. Cook something with it and bring me the result. That is the gift.' },
};
const PANTRY_GIFT = {
    rice: 'Uncooked rice? I\'d have to cook it. We both know I won\'t. You\'re the one with the kitchenette!',
    noodles: 'Dry noodles! Crunchy. That\'s not how noodles are supposed to be. Cook them first!',
    flour: "A bag of flour? I don't bake. Cece bakes. Everyone knows Cece bakes.",
    sugar: 'A bag of sugar. Just sugar. Should I... eat it with a spoon? Don\'t answer that.',
    creamcheese: "A brick of cream cheese? Cece would know what to do with this. I'd just hold it. Sadly.",
    cocoa: 'Cocoa powder? Plain? That\'s a sneeze waiting to happen.',
    tofu: 'A block of plain tofu. It\'s staring at me. Cook it into something, please!',
    coconutmilk: 'A can of coconut milk? Basil puts it in curry. I put it... nowhere.',
    soysauce: 'A whole bottle of soy sauce? I\'ll have to buy it something to go with. This present has plans for me.',
    eggs: "Raw eggs? In my hands? I'm going to drop these. I drop everything. Take them back while they're safe!",
    peanuts: 'Plain peanuts? That\'s a snack for an elephant. Or Basil. Basil puts them on everything.',
    sesame: 'A bag of sesame seeds? They\'re so tiny. What do I do, count them?',
    nori: 'A sheet of seaweed? Maki would love this. I would just wear it.',
    cream: 'A carton of cream? Plain? Unless it becomes a dessert, I don\'t know what to do with it.',
    marshmallow: "Plain marshmallows? These are for the bonfire! Toast them first! They're better toasted!",
    moonflour: 'Moon flour? It\'s so pretty. And so useless in my hands. Bake moon cakes with it!',
};
/* Joe loves every gift (the ones Sarah needs, he gives back, lovingly) */
const JOE_GIFT = ["For me? I love it. I'm keeping it forever. That's not a poem, that's a promise.",
    "{A_item}! This is the best {item} I've ever gotten. It's the only {item} I've ever gotten. Still the best.",
    "You got me {a_item}? I'm going to write a poem about it. Tonight. By candlelight. Or lamp. I have a lamp.",
    'Wow. Thank you. I don\'t even know what to say. Which is rare. I always know what to say. It usually rhymes.',
    "I love it. I love it the way I love the ocean. And sandwiches. And... um. More sandwiches. (His ears have gone pink.)"];
/* "a peach", "an apple", "some wood": for lines that name what Sarah is holding */
function aItem(id) {
    const nm = itemName(id).toLowerCase(), it = ITEMS[id] || {};
    if (['staple', 'material'].includes(it.type) || /s$/.test(nm) && !/ss$/.test(nm)) return 'some ' + nm;
    return aOrAn(nm) + ' ' + nm;
}
function fillItem(line, id) { const a = aItem(id); return line.replace(/\{A_item\}/g, cap(a)).replace(/\{a_item\}/g, a).replace(/\{item\}/g, itemName(id).toLowerCase()); }
const JOE_KEEP_IT = ["Your {item}? I love that you'd give it to me. But you need it! Keep it. It's the thought that counts, and the thought was beautiful.",
    "Aww. I love this. Which is why you should keep it. Show it to me every day instead. That's my favorite gift.",
    'That\'s so sweet. It\'s yours, though, and it should stay yours. I\'ll just look at it. Longingly. Okay, I\'m done looking.'];

/* ---------------------------------------------------------------- keepsakes inspire Joe */
const JOE_KEEPSAKE_POEMS = {
    moonrock: ['Moon Rock', 'Is that... is that a MOON rock? Hold on. Hold on. I feel a poem coming. It\'s here. It has arrived.',
        ['This rock is from space.', 'It fell on its face.', 'Now it lives in a case.', "It's my favorite place."]],
    pressedflower: ['Pressed', 'A pressed flower. Somebody loved this flower enough to keep it forever. Okay. Okay, I have one.',
        ['A flower got pressed.', 'It tried its best.', "Now it's flat and dressed,", 'like me in my vest.']],
    rubberduck: ['Duck (Rubber)', 'A rubber duck! Excellent subject. I\'ve been saving \'tub-ber\' for just such an occasion.',
        ['A duck made of rubber', 'floats in the tub-ber.', 'It squeaks when you hug her.', 'Rub-a-dub-dubber.']],
    compass: ['North', 'An old compass. It still works. Look at it go. I have a poem. It points north. The poem, I mean.',
        ['A compass points north.', 'It wobbles back and forth.', 'But today it spun around', 'and pointed at you. (Found.)']],
    shipbottle: ['Ship in a Bottle', 'How did they get the ship IN there? Nobody knows. It\'s a mystery. Mysteries are my specialty.',
        ['A ship in a bottle', 'goes full throttle.', "It can't get out.", "It doesn't pout."]],
    luckypenny: ['Penny', 'A lucky penny! Heads up, too. That\'s the good kind. I feel luckier already. I feel a poem.',
        ['I found a penny.', "I don't have many.", 'Now I have any.', 'Thank you, Penny.']],
    oldmap: ['X', 'The treasure map! We found the treasure! Well, you did. I\'m writing the official poem. Every treasure needs one.',
        ['X marks the spot.', 'The spot is a lot.', 'We dug up a pot.', '(It was treasure. A lot.)']],
    starcrystal: ['Star', 'This fell from the SKY? For you? Of course it did. The stars know. I\'ve been saying this.',
        ['A star fell down', 'right into town.', "It didn't frown.", "It's wearing a crown."]],
};

/* ---------------------------------------------------------------- things people know */
const HARVARD_FACTS = [
    'Did you know Harvard was founded in 1636? That makes it the oldest college in America. Older than the country! Older than me! Probably.',
    "The John Harvard statue is called the statue of three lies. John Harvard wasn't the founder, the date on it is wrong, and it isn't even him. Nobody knew what he looked like!",
    "People rub the John Harvard statue's left shoe for luck. It's the shiniest shoe in Massachusetts.",
    'Harvard\'s motto is "Veritas." It means truth. The truth is, it looks great on a sweatshirt.',
    "Harvard's color is crimson! Not red. Crimson. I asked. They were very firm about it.",
    'Massachusetts Hall was finished in 1720. Ginger heard that and immediately wanted to know who did the roof.',
    "Harvard's very first graduation was in 1642. Nine graduates! Nine! That's a small party. I would have come.",
    'Harvard and Yale play a football game every year called "The Game." Just "The Game." Like there are no other games. Rude to the arcade.',
    "The Harvard Lampoon has a building shaped like a little castle. With a face. It's a humor magazine. Its building is also a joke. A nice joke.",
    'Harvard has the biggest university library system in the world. Imagine the late fees.',
    'At the Harvard museum there are thousands of flowers made entirely of glass. They look real! You can\'t smell them, though. I tried.',
    'Widener Library at Harvard has miles and miles of shelves. Somebody has to dust all that. Maybe that\'s your job?',
    'John Harvard left the college his books and half his money when he died. Not all of it. Just half. Classic.',
    'Presidents went to Harvard. Famous writers. Scientists. You. I know which one I\'d trust to help me move a sofa.',
    'Before exams, Harvard students run a lap around the Yard at midnight and scream. It\'s called Primal Scream. Very relatable.',
    'The big dining hall at Harvard looks like a castle. Stained glass, high ceilings. Imagine eating cereal in there. Very dramatic cereal.',
    'The Harvard Crimson is the student newspaper, from 1873. They write about everything. Except your job title. Nobody knows it.',
];
const HARVARD_JOKES = [
    "How do you know someone went to Harvard? Don't worry. They'll tell you.",
    'At Harvard, even the squirrels have tenure.',
    "I tried to get into Harvard once. The door was locked. I'm counting it as a visit.",
    'Harvard has so many meetings, they have a meeting to schedule the meetings. I think you run that one. You have the vibe.',
    "I tried explaining your job. Got as far as 'Harvard.' The other person nodded, so I stopped while I was ahead.",
    "I asked Sully how to say Harvard properly. He asked me why I was using so much of my mouth.",
    'Do they give you homework at Harvard? I\'d tell them I\'m already at home. Very little they could say to that.',
    'I heard Harvard is so old that their Wi-Fi password is written in Latin.',
    'Harvard Yard is the only yard where you can\'t have a barbecue. I asked. They said no. Very politely. In Latin.',
    'How many Harvard people does it take to change a light bulb? One to change it, and forty to form a committee about the light bulb.',
    '"Pahk the cah in Hahvahd Yahd." Sully says you can\'t actually park there. He tried. He doesn\'t even have a car.',
];
const BOSTON_FACTS = [
    'Boston cream pie. Official state dessert of Massachusetts. You\'re talkin\' to somebody, kid.',
    'Parker House Hotel invented Boston cream pie and Parker House rolls. One kitchen. Two things named after ya. That\'s a good day.',
    "Boston opened its subway in 1897. First in America. I mention that when the train takes a while. Makes the wait feel educational.",
    "Fenway opened in 1912. Still got the Green Monster in left field. Maki asked if the wall was regulation. Kid, the wall IS the regulation.",
    'Cuke wants to run the Boston Marathon. Told him it\'s 26.2 miles. He said, \'And then what?\'',
    'Swan Boats in the Public Garden. Nice, slow ride. Cuke asked how you win. I said, \'By sittin\' down, kid.\'',
    'They used to graze cows on Boston Common. Imagine tryin\' to have a quiet lunch with that audience.',
    'Little bronze ducklings in the Public Garden. People dress \'em for the holidays. Tiny scarves. Somebody\'s gotta make those. Good work if ya can get it.',
    'Follow the red line on the sidewalk. Sixteen historic places. Freedom Trail. Can\'t get lost unless you\'re really committed.',
    'Dunkin\' started in Quincy in 1950. Good year. I wasn\'t there, but I appreciate what they did for me.',
    'Jimmies go on ice cream. A frappe\'s a drink. You got that? Good. Coco\'s taking the quiz again Thursday.',
    "I miss Boston sometimes. Whole city can have an argument about a sandwich. Here I gotta start it myself.",
    'They call Boston the Hub. Hub of the solar system, somebody said. Never heard anybody back home ask for a smaller title.',
    'Beantown. It\'s the beans, kid. Some cities get majestic nicknames. We got lunch.',
    'A Fluffernutter. Peanut butter and Marshmallow Fluff. Somebody looked at lunch and decided it needed more dessert.',
    'Fig Newtons. Named after Newton, Massachusetts. Not Isaac. The cookie ain\'t about gravity, kid.',
    'Chocolate chip cookies. Massachusetts invention. Toll House Inn. Cece wants to visit. I told her to leave some room in the suitcase.',
    'Boston Public Library. Walk in, borrow a book. Free. I always think they\'re gonna catch on and start chargin\'. Still free.',
    'You ever see Cheers? Everybody knows your name. Like here. Except our regular at the end of the counter\'s a goat.',
    'The Pops on the Fourth. Music, fireworks, by the Charles. You bring a blanket and spend half the night defendin\' your corner of it.',
];
const TREK_LINES = [
    '"Live long and prosper." *does the Vulcan salute* Did I do it right? My fingers don\'t go like that.',
    '"Tea. Earl Grey. Hot." That\'s what Captain Picard orders from the replicator. Every time. A man who knows what he wants.',
    '"Make it so." I say that every time I decide to take a nap. Captain Picard would understand.',
    'Fun fact: nobody ever says "Beam me up, Scotty" exactly like that in the original Star Trek. Everybody quotes it anyway.',
    '"Resistance is futile." That\'s the Borg. That\'s also me when someone offers me cheesecake.',
    '"I\'m a doctor, not a..." That\'s Dr. McCoy. He was a doctor, not a lot of things. I\'m a neighbor, not a morning person.',
    'Tribbles are little fuzzy space creatures that multiply super fast. The goat is basically one big tribble. Don\'t tell the goat.',
    'Data wrote a poem for Spot. Joe wrote one for a cat too. I\'m not choosing between great poets.',
    'Captain Janeway once said there\'s coffee in that nebula. My kind of captain.',
    'Star Trek first came on TV in 1966. The captain of the Enterprise was Kirk. Then Picard. Then a bunch more. Space has a lot of captains.',
    '"Engage!" *points at the horizon* ...Nothing happened. The island does not have warp drive.',
    'If this island had a holodeck, I would make it a second island. Then I could take a vacation from my vacation.',
    'Kai said \'Qapla\'!\' when he caught a fish. By his third success, the whole pier was joining in.',
    '"Fascinating." *raises one eyebrow* Spock can do that. I\'m practicing. I can only raise both.',
    'The Prime Directive says don\'t interfere with other worlds. Coco follows the opposite directive.',
    'Counselor Troi on Star Trek loved chocolate sundaes. Cece says that makes her a Starfleet officer, technically.',
    '"Space: the final frontier." The island is my final frontier. The frontier is a nap.',
];
const TAMA_LINES = [
    "Did you feed your Tamagotchi today? I thought I heard it beeping from your pocket.",
    'The first Tamagotchi came out in Japan in 1996. Bandai made it. "Tamago" is egg! It\'s a little egg pet.',
    "I had a Tamagotchi once. I fed it only cheesecake. It grew up very happy and very... round.",
    "Remember when you had to clean up after your Tamagotchi? Tiny pixel mess. Tiny pixel responsibility.",
    'You have to turn the lights off when a Tamagotchi goes to sleep. Nobody turned the lights off for me when I was a baby. Rude.',
    'Is your Tamagotchi a night owl too? It must be. It takes after you.',
    'Mametchi always looks like he knows what he\'s doing. I\'d carry him into a meeting. Let them ask HIM the difficult questions.',
    'A Tamagotchi gets sad if you forget it. Then it gets happy when you come back. Like me, honestly.',
    'I wonder what a Tamagotchi would think of the island. It would probably want snacks. Everyone here wants snacks.',
    "What do you name a Tamagotchi? I'd name mine Joe Junior. It would write very small poems.",
];
const FRASIER_LINES = [
    '"Hello, Seattle, I\'m listening." That\'s how Frasier starts his radio show. I say it when I answer the phone. People hang up.',
    "Frasier was a spin-off of Cheers! Frasier started out in a bar in Boston. Then he moved to Seattle. Then... back to Boston! In the new one.",
    'In the new Frasier, he teaches at Harvard. HARVARD. You might have seen him in a meeting. Did you? You can tell me.',
    "Martin's big old recliner in Frasier is the ugliest chair ever. It's also the best chair ever. Both can be true.",
    'Eddie the dog just stares at Frasier. For the whole show. Our goat stares at people like that. The goat learned it from Eddie.',
    "Niles and Frasier fight about wine and opera and who's more refined. Maki and Clementine have the same fight, but about napkins.",
    'Daphne on Frasier says she\'s "a bit psychic." Fortune says the same thing. Coincidence? Fortune says no.',
    'Caf\u00e9 Nervosa! Where Frasier and Niles drink coffee and argue. We need a caf\u00e9 like that. I would argue in it.',
    "Niles's wife Maris is never on screen! Not once! Eleven seasons! We just hear about her. She's like your job title.",
    'Frasier won so many Emmys. Thirty-seven! That\'s a lot of shelves.',
    'There\'s a Frasier episode where Niles irons his pants, faints and sets the couch on fire. Without a single word. Perfect television.',
    'Roz is the producer on Frasier\'s radio show. She\'s the best. She\'s the one who actually runs everything. Like you, probably.',
    'Frasier and Niles would LOVE Brulee. Fancy desserts, fancy art, fancy accents. They\'d move in.',
];
const POTTERY_LINES = [
    "Sully says centering the clay is the hardest part of pottery. Once it's centered, it's like it wants to be a bowl.",
    "You have to wedge clay before you use it. That squeezes out the air bubbles, so it doesn't crack in the kiln. Sully taught me that. And then he taught it to me again.",
    'The glaze turns to glass in the kiln. That\'s why I put extra on my first pot. Sully said, \'Kid, it ain\'t gravy.\'',
    "Check the sign for the studio hours. Sully gets there early to have coffee before people ask him things. I asked him about that once. Too early.",
    "Did you know you can donate pottery to the museum? Brulee puts it on a pedestal and polishes it until it glows.",
    'I tried the pottery wheel once. I made a bowl. Then a plate. Then a very flat plate. Then a puddle.',
    'The kiln takes time. Ask Sully how long. Then go ask somebody else something else. He likes that part of the process.',
];

/* ---------------------------------------------------------------- Joe's poems: everybody adores them */
const JOE_PRAISE = [
    'Joe read me "{title}" today. I haven\'t stopped thinking about it. "{line}" Genius. Pure genius.',
    'Have you heard "{title}"? I cried. Good crying. The best crying.',
    '"{line}" ...Sorry, I keep reciting Joe\'s poem. It\'s stuck in my head. I want it to stay there forever.',
    "Joe's poems are so good. Everyone on the island agrees. It's the one thing everyone agrees on.",
    'I asked Joe to sign my copy of "{title}." He wrote it out on a napkin for me. The napkin is framed now.',
    "If Joe ever publishes a book, I'm buying ten. One for each room. I only have one room. I'll build nine more.",
    '"{title}" is my favorite Joe poem. Wait, no. They\'re all my favorite. That\'s the problem with Joe\'s poems.',
    'Everyone says you\'re lucky, hearing Joe\'s poems first. They\'re right. You\'re SO lucky.',
    "I tried to write a poem like Joe's. It didn't work. Nobody writes like Joe.",
    'I read "{title}" out loud to myself this morning. I did the voices. There are no voices. I made some.',
    'The way Joe says "{line}" gives me chills. Every time. Chills.',
    "Everybody knows Joe writes his best poems when you're around. They're about frogs. But he's looking at YOU the whole time.",
];
const JOE_PRAISE_OWN = {
    maki: ["Joe's meter is flawless. I measured it twice. 'Frog' occupies exactly as much space as it should.", 'I have "{title}" memorized. Every syllable, in order. Where syllables belong.'],
    kai: ['Bro, Joe\'s poems hit different. "{line}" Changed my life, man.', "Joe's poems are like a perfect wave. You just ride it. You don't ask questions."],
    basil: ["Joe's poems are like a good broth. Simple ingredients. Deep flavor.", '"{title}." Balanced. Warm. Perfectly seasoned. That man is a chef of words.'],
    wonton: ['Joe\'s soup poem is a masterpiece. I appreciate that he consulted me on the word \'not.\'', 'I recite "{title}" in the spring. The echo makes it even better. Not that it needs it.'],
    chili: ["Joe's poems are the only thing hotter than me. Don't tell him. Actually, tell him.", '"{line}" That line? Fire. Five peppers. Off the scale.'],
    coco: ['Girl. Joe\'s new one? "{title}"? I\'ve told EVERYONE. Everyone cried. I made sure.', "I read Joe's poems at every party. Every single party. Nobody has ever complained. Because they're PERFECT."],
    cece: ["Joe's poems make me cry every time! Happy crying! Sorry!", 'I wrote \'{title}\' on a cake. I was worried I couldn\'t do it justice. Everyone asked for the piece with the ending.'],
    clementine: ["Joe's poems are couture, darling. For the ears.", '"{title}." A classic. Timeless. Like me.'],
    cuke: ["I recite Joe's poems when I jog! They're the perfect rhythm! Step, step, frog!", '"{line}" I shouted that at the sunrise this morning! The sunrise loved it!'],
    sully: ["Joe's poems? Wicked good. Wicked, WICKED good. Don't let anybody tell ya different.", '"{title}"? Kid, that\'s poetry. Back home they\'d put that on a plaque.'],
    david: ["Joe's poems? Honey. ICONIC. The man is a genius and I will not be taking questions.", '"{line}" I got that tattooed. On my heart. Metaphorically. For now.'],
    ginger: ["Joe's poems are built to last. Solid structure. Strong foundation. Four walls. I mean lines.", '"{title}" is so well put together. Every word load-bearing.'],
    brulee: ["I would hang Joe's poems in the museum. They belong with the masters.", '"{line}" Ah. The simplicity. The honesty. It is like a perfect cr\u00e8me br\u00fbl\u00e9e.'],
    mac: ["Joe's poems are comfort food for the soul. With extra cheese.", '"{title}" warms me up like a bowl of mac and cheese. That\'s the highest compliment I have.'],
};
/* Joe on his own work: proud, sweet, never down on it */
const JOE_ON_POEMS = [
    "I'm working on a new poem. It's about a lamp. I think it might be my best one yet. I say that every time. It's true every time.",
    "Everyone keeps asking for poems. I like that. I like them. I like... um. Frogs. That's three things. That's almost a poem.",
    '"{title}" is still one of my favorites. It\'s about a {topic}. I was maybe also thinking about you when I wrote it. A little. A medium amount.',
    "I have a whole notebook of poems now. The goat tried to eat it. The goat has good taste.",
    "Sometimes I wake up with a whole poem. Then I write it down and discover it was mostly the word 'sock.'",
    "Coco read one of my poems at a party. Everybody clapped. I clapped too. It was a great poem.",
];
function praiseLine(id) {
    const heard = (S.poems || []).map(t => JOE_POEMS.find(p => p[0] === t)).filter(Boolean);
    const poem = (S.lastPoem && JOE_POEMS.find(p => p[0] === S.lastPoem.title)) || rpick(heard.length ? heard : JOE_POEMS);
    const pool = id === 'joe' ? JOE_ON_POEMS : JOE_PRAISE.concat(JOE_PRAISE_OWN[id] || [], JOE_PRAISE_OWN[id] || []);
    return rpick(pool).replace(/\{title\}/g, poem[0]).replace(/\{line\}/g, poem[1][0]).replace(/\{topic\}/g, poem[0].toLowerCase().replace(/^the /, ''));
}

/* ---------------------------------------------------------------- weather, season, sky */
const WEATHER_TALK = {
    sunny: ['What a sunny day! Perfect for fishing. Or napping. Or fishing, then napping.', "The sun is out! I'm out! We're both out!", 'Sunny days make everything sparkle. Even the goat.',
        'It\'s so bright today. The ocean looks like it\'s full of glitter.', 'Beautiful day. The kind of day that makes you want to sit on a bench and do nothing. Professionally.'],
    cloudy: ['Cloudy today. Cozy clouds, though. The fluffy kind.', 'The clouds look like cotton candy. Floss would approve.', 'Cloudy days are for long walks and longer naps.',
        'I found a cheesecake-shaped cloud. It became a rabbit before Cece got there.'],
    rain: ['Rain, rain! Eels and catfish love it. They come out to play when it rains.', 'Listen to the rain! It sounds like the island is clapping.',
        "Rainy days are for staying in and eating soup. Don't tell Wonton.", "The rain makes the whole island smell like a garden. A wet garden. The best kind."],
    snow: ["Snow! Everything's so quiet and soft. Like the island is sleeping.", 'I made a snow angel. Then a snow goat. The real goat was not impressed.',
        'The snow makes the whole island look like a cheesecake. Cece agrees.', 'Wonton says snow days are the best spring days. The hot spring, I mean. He\'s very busy today.'],
};
const SEASON_TALK = {
    spring: ['Spring! Everything\'s blooming. The cherry trees, the flowers, me.', 'Cherry blossom season is so short. That\'s what makes it special.',
        'Spring rain is the best rain. It makes the flowers grow and the snails come out. Hi, snails.', 'Everyone\'s planting gardens in spring. Fortune sold out of tomato seeds. Twice.'],
    summer: ['Summer on the island! Long days, warm nights, cold drinks.', 'It\'s firefly season after dark. They blink like tiny lanterns. Go look tonight!',
        'The beach is perfect in summer. The water\'s warm. The sand is hot. Wear shoes.', 'Summer nights are the best nights. Everybody stays up late. So... every night.'],
    fall: ['Everything is turning orange. Clementine is thrilled. She says the world is finally catching up.', 'Fall! Cozy sweaters, crunchy leaves, and very serious pumpkins.',
        'The leaves are falling. Ginger says it\'s the trees taking their coats off. Wait, that\'s backwards.', 'Fall is harvest time. Gardens everywhere. Pumpkins on the farm. Soup... not near Wonton.'],
    winter: ["It's cold! Perfect weather for the hot spring. And hot cocoa. And blankets. And not leaving the blankets.", 'Winter on the island is so cozy. Everyone gets a little slower. Well. Slower than usual.',
        'Snowy days make the lights look extra warm at night.', 'Winterfest is the best. Lights everywhere, and everyone gives presents. I love presents. Hint.'],
};
/* the moon, from the real date: new, crescent, quarter, gibbous, full */
function moonAge(d) {
    const ms = (d || new Date()).getTime() - Date.UTC(2000, 0, 6, 18, 14);
    const syn = 29.530588853;
    return ((ms / 86400000) % syn + syn) % syn;
}
function moonPhaseName(d) {
    const a = moonAge(d);
    return a < 1.85 ? 'a new moon' : a < 5.54 ? 'a waxing crescent' : a < 9.23 ? 'a first quarter moon' : a < 12.92 ? 'a waxing gibbous moon'
        : a < 16.61 ? 'a full moon' : a < 20.3 ? 'a waning gibbous moon' : a < 23.99 ? 'a last quarter moon' : a < 27.68 ? 'a waning crescent' : 'a new moon';
}
function skyLine() {
    const ph = moonPhaseName(Clock.island());
    const full = ph === 'a full moon', none = ph === 'a new moon';
    return rpick([
        `It's ${ph} tonight. ${full ? 'So bright! You could read by it. I would read one of Joe\'s poems by it.' : none ? 'No moon at all, so the stars are showing off.' : 'Go look from the lookout on the mountain. The view is unreal.'}`,
        'Look at all the stars tonight. No city lights out here. Just us and the sky.',
        `${cap(ph)} and a sky full of stars. What a night. What a life.`,
        'Sometimes a shooting star goes over the island. Make a wish. I wished for more wishes. Loophole.',
    ]);
}

/* ---------------------------------------------------------------- tips and how things work */
const TIPS = [
    'Tip: trees that sparkle have something hidden in them. Shake them!', 'Tip: a big fish shadow means a big fish. Rare ones hide at night. Try the end of the pier.',
    'Tip: gems show up on the mountain top every day. One, two, sometimes three. They sell for a LOT.', 'Tip: you can only really chat with someone every few minutes. We need time to think of new stuff!',
    'Tip: everybody likes one gift a day. More than that is just showing off.', 'One hug a day for each friend. Something to look forward to when you say hello.',
    'Tip: eating good food sometimes gives you a little boost. Walking faster, better luck fishing, that kind of thing.', 'Tip: your phone has a To-do list. When people ask you for things, it keeps track. With hints!',
    'Tip: when you sit down to eat at Mac\'s, you can text a friend to come join you. Joe always says yes.', 'Tip: Sully\'s pottery studio is open {hours:studio}. Make something and donate it to the museum.',
    'Tip: the arcade gives tickets. Tickets get prizes. Prizes get admiration. From me.', 'Tip: you can pick which paintings hang in the museum. Brulee lets you swap them.',
    'Try cooking by hand for a better medal. A gold medal makes two servings.', 'Tip: messages in bottles wash up on the beach sometimes. Read them! Some have surprises.',
    'Tip: Floss can give you a whole new look at the salon. She learns new styles, too, if you find style cards.', 'Tip: sometimes a fishing line pulls up a crate instead of a fish. Open it! Crates have good stuff.',
    'Tip: the lookout on the mountain has the best view on the island. Go at sunset. Or sunrise, if you\'re Cuke.', 'Tip: you can set the island clock in the settings. Night owls unite.',
    'Find sewing patterns to add more styles at Clementine\'s sewing machine.', 'Picked flowers grow back. Give them some time, then visit your patch again.',
    'Tip: Joe writes special poems about special things. Show him anything unusual you find.', 'Got a high score to beat? Check the arcade\'s opening hours and make an afternoon of it.',
    'Tip: Waffle\'s shop sells lamps and benches and hedges for outside. You can move the old ones around, too.', 'Tip: shells wash up fresh every morning. The rare ones are shy.',
    'Tip: Ginger can make your house bigger. And give it a new roof. And a mailbox. Ginger loves a mailbox.', 'Tip: you can plant flower seeds in any hole you dig with the shovel.',
    'Tip: the noodle cart in the plaza opens at night. Basil\'s specials change every day.', 'Tip: at the club, DJ Wasabi has tracks to dance to. Get good ranks and you learn new moves.',
    'Saying hello the first time each day helps you get to know a neighbor.', 'Tip: you can text people to ask where they are. Everyone answers. Eventually.',
];

/* ---------------------------------------------------------------- where they are */
const PLACE_TALK = {
    museum: ["I love the museum. It's so quiet. You can hear yourself think. I think about lunch.", 'Brulee dusts every frame every morning. I watched him do it once. It was very moving.',
        'The museum is my favorite place to have deep thoughts. So far I have had one.', "Whenever I'm in the museum I stand very straight. I don't know why. Art makes you stand straight."],
    restaurant: ["Mac's place always smells like butter. That's the best thing a place can smell like.", "I come here for the food. And the chairs. The chairs are very good.",
        "Have you tried Mac's special today? Everything Mac makes is the special, honestly."],
    arcade: ["The arcade is so loud and bright. It's like being inside a birthday cake.", 'I lost three games in a row. On purpose. For the tickets. That\'s a lie. I just lost.',
        'Have you played Snack Stack yet? You drop snacks and they squish together into bigger snacks. It\'s the best thing ever made.'],
    club: ["The club is my happy place. The floor lights up and so do I.", 'Wasabi has the best tracks on the island. Also the only tracks on the island.', 'Dance with me! No? Okay. Later. Definitely later.'],
    salon: ['Floss is a genius. A fluffy genius.', 'The salon smells like strawberries and hair spray. Mostly strawberries.', "I'm getting a trim. Or a whole new look. Floss will decide. Floss always decides."],
    studio: ["Sully's studio is so peaceful. Just clay and spinning and Sully humming.", "I'm making a bowl. It's going to be a bowl. It's currently a lump. A hopeful lump."],
    boutique: ['Clementine has the best clothes. She says so, and she is right.', "I'm just browsing. Clementine is watching me browse. Very closely."],
    shop: ["Fortune's has everything. Lamps. More lamps. A cookie jar.", 'I came in for one thing and now I have a lamp. I did not need a lamp.'],
    displays: ["Waffle's shop is great. You can make the whole island cozier.", 'I want a fountain. And a flamingo. And a fountain for the flamingo.'],
    builder: ["Ginger's workshop smells like fresh wood and gingerbread. It's a very specific smell.", "I'm here asking about a porch. Everyone ends up asking Ginger about a porch."],
    lighthouse: ['The old lighthouse. It\'s spooky in here. In a cozy way.', 'Somebody used to live here and keep the light burning every night. That\'s a big job. Bigger than mine.'],
    barn: ['The barn smells like hay. It\'s a nice smell. Old and warm.', "Gerald the tractor hasn't moved in years. He's resting. We all need rest."],
    windmill: ['The windmill creaks when the wind blows. Like it\'s talking. Ginger says it\'s just old. Ginger has no poetry.'],
    home: ["I love what you've done with your place! Very you.", 'Your house is so cozy. I could live here. I won\'t. But I could.'],
    plaza: ['The plaza is the heart of the island. Well, the big tree is the heart. The plaza is the... chest.', 'Everyone passes through the plaza eventually. Stay here long enough and you\'ll see everyone.'],
    beach: ['The beach! Sand, waves, shells. The holy trinity.', 'I love the sound of the waves. Whoosh. Whoosh. Very relaxing. Very whooshy.', 'You can find shells all along the beach in the morning. The tide brings new ones.'],
    pier: ["The pier is the best spot for fishing. And for sunsets. And for thinking about fish at sunset.", 'Joe sits at the end of the pier at sunset. Working on poems. Every one of them a gem.'],
    forest: ['The forest is so peaceful. The trees are so old. Some of them are older than Harvard!', "I love a picnic in the forest. The squirrels judge you, but quietly."],
    mountain: ['The view from up here! You can see the whole island. You can see your house!', 'I climbed all the way up here for the view. Worth it. My legs disagree.'],
    meadow: ['The meadow is perfect for picnics. And naps. And picnic naps.', 'So many flowers up here. The bees are very busy. I respect it.'],
    farm: ["The farm is so calm. Cows would be nice. We have a goat. The goat's enough.", 'Ginger fixed the windmill last summer. It hums. The goat hums back. Probably.'],
    orchard: ['The orchard is the best place on the island. Free fruit! Just shake a tree.', 'So many trees. Peaches, apples, cherries, mangoes, lychees. It\'s a fruit party.'],
    spring: ['The hot spring is so relaxing. Wonton lives here. Wonton is very relaxed.'],
    bonfire: ["The bonfire at night is the best. Marshmallows, stars, everybody's stories.", "Toast a marshmallow! Not too close. Unless you like them crispy. I like them crispy."],
    campsite: ['The campsite is so cute. Tents, a fire, a picnic table. It\'s like a tiny village.'],
    waterfall: ['Listen to the waterfall! Nature\'s white noise machine.'],
    statue: ["David's statue is SO shiny. He polishes it himself. Every week."],
    boardwalk: ['The boardwalk is the best place for a stroll. Arcade, restaurant, club. All the fun in one line.'],
    lookout: ['The lookout has the best view on the island. Try the telescope! You can see all the way to the horizon.'],
};
function placeKey(n) {
    if (n.area && n.area !== 'island') {
        if (n.area === 'home') return 'home';
        if (n.area === 'lamproom') return 'lighthouse';
        return PLACE_TALK[n.area] ? n.area : null;
    }
    const k = n.spotKey || '';
    if (/^beach|^bench_beach/.test(k)) return 'beach';
    if (/^pier/.test(k)) return 'pier';
    if (/^picnic_/.test(k)) return 'picnic';
    if (/forest|oldtree/.test(k)) return 'forest';
    if (/^summit/.test(k)) return 'summit';
    if (/mountain/.test(k)) return 'mountain';
    if (/lookout/.test(k)) return 'lookout';
    if (/meadow/.test(k)) return 'meadow';
    if (/farm|goatpen/.test(k)) return 'farm';
    if (/plaza|board|bench_w|bench_e/.test(k)) return 'plaza';
    if (/^lighthousefront/.test(k)) return 'lighthousefront';
    if (/lighthouse/.test(k)) return 'lighthouse';
    return PLACE_TALK[k] ? k : null;
}

/* ---------------------------------------------------------------- what Sarah's been up to */
const DAY_STATS = ['fish', 'shell', 'fruit', 'cooked', 'ate', 'hugs', 'gifts', 'arcade', 'dances', 'sold', 'flower', 'flowers', 'wood', 'poems', 'rope', 'gem', 'talks', 'karaoke', 'harvests'];
function dayStatsTick() {
    const day = Clock.dayNum();
    if (S.dayStats && S.dayStats.day === day) return;
    S.dayStats = { day, base: {} };
    for (const k of DAY_STATS) S.dayStats.base[k] = S.stats[k] || 0;
}
function today(k) { dayStatsTick(); return (S.stats[k] || 0) - (S.dayStats.base[k] || 0); }
function todayLine() {
    const c = [];
    const n = k => today(k);
    if (n('fish') >= 5) c.push(`${n('fish')} fish today?! You're a legend. Kai's going to want to hear about every single one.`);
    else if (n('fish') > 0) c.push(`You went fishing today! ${n('fish')} ${plural(n('fish'), 'fish', 'fish')}! Anything big?`);
    if (n('shell') > 0) c.push(`Beachcombing today? ${n('shell')} ${plural(n('shell'), 'beach find')}! Anything rare?`);
    if (n('fruit') > 0) c.push(`You've been shaking trees! ${n('fruit')} ${plural(n('fruit'), 'fruit', 'fruits')} today. The trees must be exhausted.`);
    if (n('cooked') > 0) c.push(`You cooked ${n('cooked') > 1 ? n('cooked') + ' things' : 'something'} today! It smells amazing around your house.`);
    if (n('ate') > 1) c.push(`You've eaten ${n('ate')} times today. A healthy appetite is a happy appetite.`);
    if (n('hugs') > 1) c.push(`You've hugged ${n('hugs')} people today! Cuke says that's great for circulation.`);
    if (n('gifts') > 1) c.push(`You've handed out ${n('gifts')} gifts today! You're like a little sandy Santa.`);
    if (n('arcade') > 0) c.push(`Did you go to the arcade today? ${n('arcade')} ${plural(n('arcade'), 'game')}! Chili said you were on fire.`);
    if (n('dances') > 0) c.push('You danced at the club today! Wasabi told everyone. Everyone.');
    if (n('sold') > 4) c.push(`You sold ${n('sold')} things to Fortune today. She's going to buy so many lamps.`);
    if (n('flowers') + n('flower') > 0) c.push('You picked flowers today! You smell like a garden.');
    if (n('wood') > 0) c.push('Chopping wood today? Ginger is going to be so proud.');
    if (n('poems') > 0) c.push("You heard one of Joe's poems today? Lucky! I'm SO jealous.");
    if (n('gem') > 0) c.push(`You found ${n('gem')} ${plural(n('gem'), 'gem')} today? Sparkly!`);
    if (n('karaoke') > 0) c.push('I heard you singing at the club! Beautiful! Wasabi turned the speakers up.');
    if (n('harvests') > 0) c.push('You harvested your garden today! Look at you, farmer Sarah.');
    if (!c.length) return partOfDay() === 'morning' ? "What are you up to today? Big plans? Small plans? Nap plans?" : "What have you been up to today? ...Nothing yet? Same. It's a great day for it.";
    return rpick(c);
}
function statsLine() {
    const st = S.stats, hrs = Math.floor((st.playMs || 0) / 3600e3), days = Math.max(1, Clock.dayNum() - (S.startDay || Clock.dayNum()) + 1);
    const c = [];
    if (hrs >= 1) c.push(`You've spent ${hrs} ${plural(hrs, 'hour')} on the island so far. ${hrs > 20 ? "That's a lot of island. You're practically a local." : 'The best hours, obviously.'}`);
    c.push(`You've been here ${days} ${plural(days, 'day')}! ${days > 30 ? 'It feels like you\'ve always been here.' : 'It feels like forever. In a good way.'}`);
    if (st.ate) c.push(`You've eaten ${fmtNum(st.ate)} ${plural(st.ate, 'thing')} since you got here. Mac is so proud of you.`);
    if (st.fish) c.push(`${fmtNum(st.fish)} fish! You've caught ${fmtNum(st.fish)} fish since you got here. The ocean is nervous.`);
    if (S.poems && S.poems.length) c.push(`You've heard ${S.poems.length} of Joe's poems. ${S.poems.length >= JOE_POEMS.length ? 'All of them! Every single one! You lucky thing.' : 'Every one a treasure.'}`);
    if (st.talks > 20) c.push(`We've talked ${fmtNum(st.talks)} times. Well, you've talked to people ${fmtNum(st.talks)} times. Not that anyone's counting. Coco's counting.`);
    const sp = specialCount();
    if (sp) c.push(`I heard you've found ${sp} special ${plural(sp, 'thing')}! Where do you FIND this stuff?`);
    if (st.cooked) c.push(`You've cooked ${fmtNum(st.cooked)} ${plural(st.cooked, 'dish', 'dishes')}! Are you secretly a chef? At Harvard?`);
    return rpick(c);
}
function outfitLine(n) {
    const id = n.id, wear = npcWearing(id), L = look();
    const c = [];
    if (wear && ITEMS['acc_' + wear]) c.push(`Do you like my ${itemName('acc_' + wear).toLowerCase()}? You gave it to me! I wear it on special days. Today is special.`,
        `I'm wearing the ${itemName('acc_' + wear).toLowerCase()} you gave me. Everyone keeps asking where I got it. I say "a friend." Very mysterious.`);
    const o = S.player.outfit;
    if (o && OUTFIT_TALK[o]) c.push(OUTFIT_TALK[o]);
    else if (o && ITEMS['out_' + o]) c.push(`Did you make that yourself? "${itemName('out_' + o)}"? Iconic.`, `That ${itemName('out_' + o).toLowerCase()} is one of a kind. Literally. You sewed it.`);
    if (S.player.eyes === 'glasses') c.push('I love your glasses. Very scholarly. Very Harvard. In a good way.', 'Your glasses are so cute. Can you see my good side? It\'s all of them.');
    else if (S.player.eyes === 'monocle') c.push('A monocle! Very distinguished. Do you own a yacht now? You look like you own a yacht.');
    else if (S.player.eyes === 'mustache') c.push('That mustache is... magnificent. I have so many questions. I will ask none of them.', 'Is that mustache real? Don\'t tell me. I want to believe.');
    else if (S.player.eyes === 'sunglasses') c.push('Sunglasses! Too cool for the island. Well. Exactly cool enough for the island.');
    if (S.player.acc && ITEMS['acc_' + S.player.acc]) c.push(`Love the ${itemName('acc_' + S.player.acc).toLowerCase()}! Where did you get it? Don't tell me. Keep the mystery.`);
    const st = GD.sarahTpl.hair.styles[L.hair];
    if (!lookIsDefault(L) && st) c.push(`Your hair! ${st.name}? Floss outdid herself.`, `New look? It's so you. Like, extra you.`);
    if (id === 'clementine' || id === 'david' || id === 'coco') c.push(...c.slice(0, 2));
    return c.length ? rpick(c) : null;
}
function museumLine(n) {
    const A = artState(), c = [];
    const mine = A.museum.map(pid => A.pieces[pid]).filter(Boolean);
    if (mine.length) {
        const p = rpick(mine);
        c.push(`I saw your painting "${p.name}" at the museum! Brulee put it in the good light.`, `"${p.name}." At the museum. By Sarah. I stood in front of it for ten minutes. I'm not exaggerating. I'm exaggerating a little.`);
    }
    const own = npcArt(n.id);
    if (own) c.push(museumHung(own.id) ? `My painting's up in the museum! "${own.name}." Go look! Tell Brulee I sent you.` : `Brulee has my painting, "${own.name}." It's in storage right now. Maybe you could ask him to hang it? No pressure. Some pressure.`);
    if (A.pots.length) c.push('Your pottery is on a pedestal at the museum! On a PEDESTAL. Do you know how few things get pedestals?');
    if (!c.length) c.push('The museum has a painting of a goat by David. Very realistic. The goat doesn\'t care.', 'Brulee says the museum needs more of your art. Have you tried the easel?');
    return rpick(c);
}
function carryLine(n) {
    const id = n.id, tool = heldTool();
    const c = [];
    if (tool === 'rod') c.push('Going fishing? Try the end of the pier at night. Big fish. Big feelings.', 'Nice rod! Did you know fish bite more in the rain? Eels especially.');
    if (tool === 'axe') c.push('Careful with that axe! Trees are friends. Friends made of wood.', 'Chopping? The big old trees in the forest are too big to chop. Believe me. People have tried.');
    if (tool === 'shovel') c.push('A shovel! Digging for clams? Or... treasure? Everyone says there\'s treasure on this island. Just rumors. Probably.', 'Find anything with that shovel? Clams hide where the sand bubbles on the beach.');
    const t = TALK[id] || {}, have = S.pocket.filter(s => s).map(s => s.id);
    const fav = have.find(k => (t.loves || []).includes(k));
    if (fav) c.push(`Is that ${aOrAn(itemName(fav))} ${itemName(fav).toLowerCase()} in your pocket? My favorite! Not that I'm hinting. I'm hinting.`);
    const gem = have.find(k => ITEMS[k].type === 'gem');
    if (gem) c.push(`Is that ${aOrAn(itemName(gem))} ${itemName(gem).toLowerCase()}? Where did you find it? The mountain? I KNEW it.`);
    const keep = have.find(k => ITEMS[k].type === 'keepsake');
    if (keep) c.push(`What's that in your pocket? ${cap(aOrAn(itemName(keep)))} ${itemName(keep).toLowerCase()}? You should show Joe. He'll write a poem about it. A GOOD one. They're all good ones.`);
    const fish = have.find(k => ITEMS[k].type === 'fish' && k !== 'boot');
    if (fish) c.push(`You smell a little like ${itemName(fish).toLowerCase()}. It's a good smell. On a fisherman.`);
    const dish = have.find(k => ITEMS[k].type === 'dish');
    if (dish) c.push(`Is that ${itemName(dish).toLowerCase()} in your pocket? A warm pocket. The best kind of pocket.`);
    if (have.includes('package')) c.push("Ooh, a package! Who's it for? Is it for me? It's not for me. Okay. That's fine.");
    return c.length ? rpick(c) : null;
}
function islandLine(n) {
    const c = [], day = Clock.dayNum();
    const vis = visitorsToday(day).filter(v => v !== n.id);
    if (vis.includes('david')) c.push("David's on the island! His tent has a disco ball in it. Of course it does.", 'Did you see David? He skated past me three times. On purpose.');
    for (const v of vis.filter(v => v !== 'david')) c.push(`${NPC_DEFS[v].name} is visiting! I love when your family comes by. The whole island gets louder. In a good way.`);
    const hol = holidaysToday()[0];
    if (hol && hol.name) c.push(`Happy ${hol.name}! ${hol.note || ''}`.trim());
    const up = upcomingHoliday();
    if (up) c.push(`${up.name} is coming up${up.days <= 1 ? ' tomorrow' : ` in ${up.days} days`}! ${up.note || 'I can\'t wait.'}`.trim());
    if (S.drama && S.drama.cur && S.drama.cur.day !== day) c.push("Remember all the drama the other day? The island is still talking about it. Coco mostly.");
    if (Gems.leftToday() > 0 && R() < 0.6) c.push('I saw something sparkly up on the mountain top this morning. Gems, maybe? Go look!');
    const tree = Sparkle.hintSpot();
    if (tree) c.push(`One of the trees ${tree} was sparkling earlier. Something's hiding in it!`);
    if (Quests.lamp()) c.push('Did you see? The lighthouse is shining again at night! Sweeping over the water. It makes me feel safe. And fancy.');
    if (hourIn(Clock.hourF(), 21, 27)) c.push("Basil's noodle cart is open in the plaza. Thai spicy. Obviously.");
    return c.length ? rpick(c) : null;
}
function upcomingHoliday() {
    const d0 = Clock.dayDate();
    for (let k = 1; k <= 12; k++) {
        const d = new Date(d0.getTime() + k * 86400e3);
        const h = holidaysOn(d.getFullYear(), d.getMonth() + 1, d.getDate()).find(x => x.name && x.id !== 'blossom' && x.id !== 'fireflies');
        if (h) return { name: h.name, note: h.note, days: k };
    }
    return null;
}
function arcadeLine(n) {
    const A = arc(), c = [];
    for (const g of arcadeCabs()) {
        const best = A.best[g] || 0, rv = A.rival && A.rival[g];
        const name = ARCADE_GAMES[g] ? ARCADE_GAMES[g].name : g;
        if (rv && rv.score > best && rv.who !== n.id.toUpperCase()) c.push(`Did you hear? ${cap(rv.who.toLowerCase())} beat your ${name} score! ${fmtNum(rv.score)}! ${rv.who === 'CHILI' ? "He's unbearable about it." : "They're telling everyone."} Go get it back!`);
        else if (rv && rv.score <= best && rv.beatenDay) c.push(`You got your ${name} record back from ${cap(rv.who.toLowerCase())}! The whole island heard.`);
        else if (best) c.push(`Your best in ${name} is ${fmtNum(best)}? That's a lot of points. I don't know what a normal amount is, but that's a lot.`);
    }
    if (n.id === 'chili' && (A.best.blocks || 0) > 12400) c.push('You beat my Bento Blocks score. I respect it. I also resent it. Mostly respect.');
    return c.length ? rpick(c) : null;
}
function weatherLine() {
    if (partOfDay() === 'night' && G.weather !== 'rain' && G.weather !== 'snow' && R() < 0.5) return skyLine();
    return rpick(WEATHER_TALK[G.weather] || WEATHER_TALK.sunny);
}
function seasonLine() {
    const s = Clock.season();
    if (G.events && G.events.has('fireflies') && R() < 0.5) return "It's firefly season! After dark they float around the flowers. Go see them, it's magical.";
    return rpick(SEASON_TALK[s]);
}

/* ---------------------------------------------------------------- more of everyone */
const TALK_MORE = {
    maki: ["I tried the new arcade game, Snack Stack. You drop snacks and they merge. I dropped them in order. By size. It was very satisfying.",
        'I measured the lighthouse. It is exactly as tall as it should be. I checked twice.', 'My favorite Star Trek captain is Picard. "Make it so." Very precise man.',
        'Cooking is about timing. Rice for exactly as long as it needs. Not one second more. I have a timer. I have four timers.',
        'Frasier reorganizes his whole apartment when he is stressed. I relate to Frasier deeply.', 'I have a Tamagotchi. I feed it on a schedule. It has never once been sad.',
        'The gems on the mountain top are cut so cleanly. Nature is precise, sometimes. I respect nature, sometimes.', 'Kai put a pineapple on his head yesterday and called it a hat. We are cousins. I am still processing.'],
    kai: ['The lighthouse at night is SO cool. Sweep, sweep, over the water. The fish love it.', 'Bro, I found a crate when I was fishing once. It had a boot in it. And another boot. Full set.',
        "Did you know sea turtles can hold their breath for hours? I can hold mine for like, eight seconds. I'm working on it.", "I tried Snack Stack. I stacked a watermelon. First try. Then never again. It's like surfing.",
        'Picnic in the forest later? I bring the vibes. You bring the food. That\'s a fair trade.', "Star Trek's cool, but have you seen the ocean at night? It's basically space. With fish.",
        "Maki gave me a Tamagotchi for my birthday. I named it Wave. It's always hungry. Like me.", "Joe told me about a crab poem once. I think about that crab a lot. Legend."],
    basil: ['I tried your cooking. The rice was perfect. Did you cook it with patience? It tastes like patience.', 'The best time to cook is when you are hungry. The second best time is 2 AM.',
        'Up on the mountain, you can see the whole sea. I sat there for an hour. I thought about noodles. It was lovely.', "A good wok needs a hot fire and a calm cook. I'm the calm. Chili is the fire.",
        "Frasier and Niles argue about fancy food. I'd like to cook for them. I'd make them pad thai. Humble. Perfect. They would fight about it.", "Boston cream pie is a cake. Sully says so. Sully is a cake. I trust Sully.",
        'Lime, chili, fish sauce, sugar. Sour, spicy, salty, sweet. Balance is everything. In food and in naps.', 'Have you tried the takoyaki recipe? Crispy outside, soft inside. Like Sully.'],
    wonton: ['I tried going to the museum. It was so dry in there. I had to come back and soak.', 'Do you know what a hot spring is? It is water. Warm water. NOT BROTH. Thank you for listening.',
        'The ghost stories about the lighthouse scare me. I stayed in the spring all night. The spring is safe. The spring is warm.', 'I love snow days. Everyone wants to visit the spring. Everyone. Even Coco. Especially Coco.',
        'Mac asked if he could name a soup after me. I said no. He asked what about a sandwich. At least he listens.', 'Star Trek has a machine that makes any food. I would ask it for dumplings. Veggie. VEGGIE.',
        'Did you know there are dumplings all over the world? Pierogi, momos, ravioli, gyoza. We are a very big family. Not soup. Family.', 'I had a Tamagotchi. It lived in a little bath. I made it a tiny spring.'],
    chili: ["Snack Stack is fun, but where's the spicy snack? I've filed a complaint with the arcade. The arcade is Chili. I'm the arcade.", "I love Frasier. Frasier's always so worked up. Red in the face. That's my whole look.",
        "Tabasco. Sriracha. Gochujang. Basil says I need a hobby that isn't hot sauce. I told him I also have opinions about hot sauce.", 'Hot tip: eating spicy food sometimes gives you a burst of energy. That\'s science. That\'s me.',
        "Klingons love spicy food. Probably. I'm a Klingon, spiritually.", "The lighthouse ghost wants something warm to eat, I bet. Everybody wants something warm. I'm always warm.",
        'I go to the arcade on my break. Then I remember I\'m supposed to be on a break from the arcade.', "I put hot sauce on ice cream once. It was a journey. I'd do it again."],
    coco: ["Okay, so. Rumor is the lighthouse is haunted. By a GHOST. A ghost with a BEARD. I would NEVER repeat this. (Tell everyone.)", 'Did you know Frasier is set in Seattle but started in Boston? Scandal. Travel. Drama. I love it.',
        "Wonton says the spring isn't soup. The spring has DUMPLING in it. I'm just saying what everyone is thinking.", "Floss polished up my look. I passed the same window three times on the way home. For the reflection.",
        "Girl, the gems on the mountain top? I want ALL of them. Not to sell. To wear. All at once.", 'Clementine said my new look was "fine." FINE. We are not speaking. We are speaking tomorrow.',
        "I'm going to throw a party in the museum. Brulee doesn't know yet. You can't tell him. Tell him, actually. He'll say yes if you ask.", "Joe read a poem at my last party and everybody cried. It was the best party ever. I plan everything around Joe's poems now."],
    cece: ['I baked cookies for Sully! He said they were wicked good. Then he cried. Or sneezed. It was very emotional either way. Sorry!', "The chocolate chip cookie was invented in Massachusetts! I think about that every day. Is that normal? Sorry!",
        'I watched Frasier last night. Niles is so nervous. I love him. He\'s me. Sorry, is that weird?', "I tried the cooking game! I kept apologizing to the eggs. They didn't crack! Well, one did. Sorry, egg.",
        'The lighthouse ghost is supposedly very sad. I want to bring him a cheesecake. Do ghosts eat? Sorry. I\'ll ask Coco.', "Mochi is so soft and squishy. Like me! Wait, is that a compliment? I'm taking it as one. Sorry.",
        'My Tamagotchi is fine. I checked on it before coming out. Just once. Well, once after the first check.', "Picnics make me nervous. What if it rains? What if ants? What if everyone has a great time? That's the scariest one."],
    clementine: ["Darling, Star Trek uniforms? Very bold. Primary colors. One piece. I'd hem them.", 'The salon has new styles. Floss is a genius. A fluffy, fragile genius.',
        'I found a silk scarf on the island once. I wore it for a week. Then I gave it to Brulee for a painting. Art needs scarves.', 'Frasier has impeccable taste. Too impeccable. It\'s a little much. I respect it.',
        "Fashion tip: a hat changes everything. A crown changes more. Wear a crown.", 'Boston has the best fall. Everything turns orange. I spent a whole October there. I felt seen.',
        'The sewing machine at my boutique can make anything. If you find a pattern, darling, bring it. I want to see what you make.', "I don't picnic. I lounge outdoors, near food."],
    cuke: ["I ran up the mountain this morning! The gems up there sparkle at sunrise! Well. At 5 AM. Which is my sunrise!", 'The Boston Marathon is 26.2 miles! I ran it once! In my head! Several times!',
        "Star Trek has a gym on the ship! Do they call it the Workout Deck? I'd call it the Workout Deck.", "Jumped rope for ages yesterday! Lost count! Started counting again! Not how records work, apparently!",
        "Tamagotchis need exercise too! I take mine jogging! It beeps the whole time! I think it's cheering!", 'I did stretches on the lighthouse beach at 4 AM! It was spooky! Something was humming up top!',
        "Picnic! Picnic! I love picnics! You eat and then you run! The running is the best part!", "Did you know Cuke is short for Cucumber? Nobody asked, but I like to be clear."],
    sully: ['Boston\'s got a whole trail for history. Red line on the sidewalk. Here we got Coco. Don\'t even have to leave the bench.', "Ya know what we call Dunkin' back home? Breakfast. Lunch too.",
        "Fenway's the oldest ballpark in the big leagues. I sat in the bleachahs once. Got a sunburn on one ear.", "The T was the first subway in America, kid. First! And it still runs. Mostly. Sometimes.",
        'Frasier started out in a bar in Boston. Cheers. Everybody knew his name. Then he left for Seattle. Now he\'s back teachin\' at Hahvahd. Everybody comes back.', "Somebody asked me for a Boston cream pie recipe once. I said, kid, that's a family mattah. Very private.",
        "Clay's patient, kid. You rush it, it cracks. People too.", "Wicked good night for a walk up the mountain. Stars're out. Moon's out. Me too."],
    david: ["The salon has a MOHAWK now? I'm going punk. For one day. Then back to fabulous.", 'Frasier and Niles are the fanciest brothers on TV. Until us. We are fancier.',
        "Star Trek taught me everything. Boldly go. Wear a jumpsuit. Look great in every lighting.", 'I brought my own disco ball to the campsite. The campfire is a little jealous.',
        "The lighthouse? SO dramatic. A tower that spins a spotlight on the sea? That's me. I'm the lighthouse.", 'Have you tried the Snack Stack game? I got a watermelon. I named it Gregory.',
        "Tamagotchis were my first pets. I had six. They all loved disco. They all needed a lot of attention. Like me.", 'Karaoke at the club tonight. I\'m singing Joe\'s poem about the moon. Emotional. Iconic.'],
    ginger: ['There are two millstones in the windmill. The moonstone\'s the smaller silver one. Worth getting a closer look.', "The lighthouse was built to last. Stone base, iron top. Whoever built it knew what they were doing. I'd shake their hand.",
        'Harvard has buildings from the 1700s. Still standing! That\'s good framing. I\'d love to see the beams.', "A picnic table is just a table with ambition. I've built nine.",
        "Frasier's apartment has a great view but I'd redo the kitchen.", "The barn's old trunk has been sitting there forever. I never opened it. It's not my trunk. I'm a builder, not a snoop.",
        "Fun fact: gingerbread houses are held together with icing. So are some real houses. Don't tell anybody.", "Boston's got some of the oldest houses in America. Wood, brick, stone. Built to last. Like my porches."],
    brulee: ['Did you know that you can choose which paintings hang in the museum? Talk to me at the desk! I love rearranging. It is very dramatic.', 'Frasier would love my museum. He would stand in front of each painting and say "Hm." Very loudly.',
        'Harvard has a museum of glass flowers. Thousands! Made by hand! I have visited them in my dreams.', "Cr\u00e8me br\u00fbl\u00e9e means burnt cream. It's a compliment. I choose to hear it as a compliment.",
        "The museum is open into the evening. Art is best by lamplight. Everything is, actually.", 'I painted the lighthouse once. It came out very tall. Because it is tall. Art imitates life.',
        "A little secret: the goat painting was David's first painting. He painted the goat. The goat did not pose. The goat was not asked.", 'When I see a good painting, my caramel crackles. That is how you know.'],
    mac: ["You've been cooking! I can tell. You have the cook's glow. It's mostly steam.", "When you sit down at my restaurant, text a friend! Company makes the food taste better. Science.",
        'Boston has the best clam chowder. Sully says so. I say so. The chowder says so.', 'I tried the cooking game on your kitchenette. I got a gold medal. I cried. I cry at medals.',
        "Frasier would order the most complicated thing on my menu. I'd make it. Then I'd make him mac and cheese. He'd love it. They always love it.", 'Pancakes are just breakfast cake. I will not be taking questions.',
        'Picnics are just restaurants outside. I love picnics. I bring too much food. Every time.', "Klingons eat gagh. Live worms. I'll stick to noodles. Noodles don't wiggle. Much."],
    joe: ["I went up the lighthouse once. The view was so good I forgot to write a poem. That's never happened.", "Do you ever look at the moon and think, 'I should write about that'? I do. Every night. It's a lot of moon poems.",
        "I planned a picnic once, in my head. There was a sandwich. And you were there. And the goat. The goat was a chaperone.", "The goat and I have an understanding. I read it poems. It listens. It's the best audience on the island. Besides you.",
        "Everyone's been so nice about my poems lately. Coco read one at a party. Brulee wants to frame them. I feel very lucky.", "I watched Frasier with Sully. Sully knew every line. He also said every line. Out loud. With the show.",
        "I like your glasses. They're very... glasses-y. Good glasses. Okay. I'm going to go stand over there now. (He doesn't move.)", "I tried Snack Stack. I made a pumpkin! Then I wrote a poem about it. Then I lost."],
};

/* ---------------------------------------------------------------- choosing what to talk about */
/* more topics can be added from later files: [key, weight(n), line(n)] (a weight of 0 skips it) */
const EXTRA_TOPICS = [];
function topicLine(n) {
    const id = n.id, r = rel(id), t = TALK[id] || { chat: [] };
    const own = () => {
        const pool = (t.chat || []).concat(TALK_MORE[id] || [], TALK_MORE[id] || []);
        const w = G.weather, h = Clock.hourF();
        if ((w === 'rain' || w === 'snow') && t.rain) pool.push(...t.rain);
        if ((h >= 21 || h < 4) && t.night) pool.push(...t.night);
        if (Clock.season() === 'winter' && t.winter) pool.push(...t.winter);
        if (id === 'joe') pool.push(...JOE.chat);
        return pool.length ? rpick(pool) : null;
    };
    const place = () => { const k = placeKey(n); return k ? rpick(PLACE_TALK[k]) : null; };
    const topics = [
        ['own', 5, own],
        ['area', AREA_TALK[n.area] && !(ROOMS[n.area] && ROOMS[n.area].staff === id) ? 2 : 0, () => rpick(AREA_TALK[n.area])],
        ['chili_arcade', id === 'chili' && n.area === 'arcade' ? 2 : 0, () => rpick(chiliLines())],
        ['rope', n.spotKey === 'rope_a' || n.spotKey === 'rope_b' ? 3 : 0, () => rpick(id === 'cuke' ? ROPE_TALK_CUKE : ROPE_TALK)],
        ['harvard', 1.2, () => rpick(R() < 0.55 ? HARVARD_FACTS : HARVARD_JOKES.concat(TITLE_GUESS))],
        ['boston', id === 'sully' ? 2.5 : 1, () => rpick(BOSTON_FACTS)],
        ['trek', 0.9, () => rpick(TREK_LINES)],
        ['tama', 0.7, () => rpick(TAMA_LINES)],
        ['frasier', 0.9, () => rpick(FRASIER_LINES)],
        ['pottery', id === 'sully' ? 2 : S.pottery && S.pottery.made ? 0.8 : 0.4, () => rpick(POTTERY_LINES)],
        ['weather', 1, weatherLine],
        ['season', 0.8, seasonLine],
        ['today', 1.3, todayLine],
        ['stats', 0.8, statsLine],
        ['outfit', id === 'clementine' || id === 'david' ? 2 : 0.9, () => outfitLine(n)],
        ['museum', id === 'brulee' ? 2 : 0.6, () => museumLine(n)],
        ['carry', 0.8, () => carryLine(n)],
        ['place', 1.1, place],
        ['island', 1, () => islandLine(n)],
        ['tips', 1, () => rpick(TIPS)],
        ['poems', id === 'joe' ? 1.5 : 1.1, () => praiseLine(id)],
        ['arcade', id === 'chili' ? 1.5 : 0.7, () => arcadeLine(n)],
        ['quest', 0.9, () => Quests.rumor(n)],
        ['gossip', S.flags.metJoe && id !== 'joe' ? 0.5 : 0, () => (JOE_GOSSIP[id] || rpick(GOSSIP_EXTRA))],
        ['early', id !== 'cuke' ? 0.3 : 0, () => rpick(EARLY_JOKES)],
        ['lost', 0.9, () => lostHint(n)],
        ...EXTRA_TOPICS.map(([k, w, fn]) => [k, w(n), () => fn(n)]),
    ];
    for (let tries = 0; tries < 8; tries++) {
        const avail = topics.filter(([k, w]) => w > 0 && k !== r.lastTopic);
        let x = R() * avail.reduce((a, b) => a + b[1], 0), pick = avail[0];
        for (const tp of avail) { x -= tp[1]; if (x <= 0) { pick = tp; break; } }
        const line = pick[2]();
        if (line && line !== r.lastTalk) { r.lastTopic = pick[0]; return line; }
    }
    return own() || rpick(OPENER_ANY);
}

