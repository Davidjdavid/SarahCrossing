/* ---- 6zzg_variety.js ---- */
/* More ways to say what's said most (the QA pass, 29 October): a gift's thanks (each neighbor's loveLine / likeLine and
   two more of their own, some naming the gift: giftThanks), a good friend's hello in their own words as well as the
   shared ones (OPEN_CLOSE_OWN), and the photo at five hearts, the gift for her house at four and the best-friend moment
   in each one's own words. Shrimpy and Muggy get the hellos, "too soon" lines, favorite spots, advice, house gift and
   best-friend moment the others had and they didn't. */

/* ---------------------------------------------------------------- thanks for a gift */
const GIFT_MORE = {
    maki: { love: ['This is exactly right. Not approximately. Exactly. Thank you, {name}.', "{A_item}. I had it on a list. The list was titled 'Someday.' Today is someday."],
        like: ['Thank you. It will go on the second shelf. The second shelf is for good things.', '{A_item}. Sensible. Well chosen. I approve.'] },
    kai: { love: ['NO WAY. {A_item}?! Best day since the big swell. Thank you, dude!', "Bro. BRO. You totally get me. This is going right next to my board."],
        like: ['Ooh, {a_item}! Righteous. Thanks, dude!', 'Nice! This is gonna make my whole afternoon. Gnarly.'] },
    basil: { love: ['Oh. Oh, {name}. {A_item}. I need to sit down. Not because of my legs. Because of my heart.', "This is the kind of gift that makes tomorrow's noodles taste better. I don't know how. It just does."],
        like: ["Thank you. I'll find a use for it. I always find a use.", '{A_item}. Nice. This goes well with a quiet evening.'] },
    wonton: { love: ['{A_item}! For me! I am so warm right now. Warmer than usual. Which is very warm.', "Oh, I love it. I'm keeping it right by the spring. Not in it. By it."],
        like: ['Thank you! I will keep it dry. Mostly dry. Dry-ish.', "{A_item}! You're very thoughtful. Not soup-thoughtful. Person-thoughtful."] },
    chili: { love: ["Okay. Okay. {A_item}. You nailed it. I'm not smiling. This is my normal face.", "Hottest gift anyone's ever given me. And I KNOW hot."],
        like: ['Huh. {A_item}. Nice pick. Could use some heat, but nice.', "Thanks. It's going behind the counter. Where the good stuff goes."] },
    coco: { love: ["Shut UP. {A_item}?! I'm wearing this smile all day. Everyone's going to ask. I'll say it was you.", 'Oh, you\'re GOOD. This is exactly my taste. Who told you? Nobody told you? Even better.'],
        like: ["Cute! I love {a_item}. I'll put it where people can see it.", "Aw, thank you! You're officially on my good list. It's a very exclusive list."] },
    cece: { love: ["For me?! {A_item}! I don't know what to say. I'm going to bake you something to say thank you for this.", 'Oh, {name}. I love it so much I might cry a little. Happy crying. The best kind.'],
        like: ["Oh, thank you! You didn't have to. I'm really glad you did, though.", "{A_item}! That's so kind. I'll take good care of it. Promise."] },
    clementine: { love: ["Darling. {A_item}. Impeccable taste. I'm almost jealous it wasn't my idea.", 'Oh, this is divine. You have an eye, {name}. A very good eye.'],
        like: ["Lovely, darling. It has a certain something. I'll find the right light for it.", '{A_item}. Tasteful. Thank you, darling.'] },
    cuke: { love: ["{A_item}! THE BEST! I'm so happy I could run a lap! I'm going to run a lap!", "This is AMAZING! You're amazing! Today is amazing!"],
        like: ['Thanks! This is great! Great great great!', "Ooh, {a_item}! It's going where I'll see it on my morning jog!"] },
    sully: { love: ["Kid. {A_item}. That's wicked thoughtful. C'mere. ...No, I'm fine. Got clay in my eye.", "Now that's a gift. Ya don't see that every day. Not even in Boston."],
        like: ["Thanks, kid. I'll put it somewhere good.", '{A_item}, huh? Not bad, kid. Not bad at all.'] },
    ginger: { love: ["{A_item}! Oh, I love it. It's going on a shelf I'm building just for it. A sturdy one.", 'Perfect! Well made, well picked. Like a good joint: it just fits.'],
        like: ["Thanks! This'll come in handy. Most things do, if you've got a toolbox.", '{A_item}! Nice. Solid choice.'] },
    brulee: { love: ['Magnifique! {A_item}. This belongs in a display case. My own, at home.', 'Oh, {name}. Something beautiful. I will look at it every morning with my coffee.'],
        like: ['Merci, {name}. A fine choice.', '{A_item}. Charming. It shall have a place of honor. A small place of honor.'] },
    mac: { love: ["{A_item}! Oh, you shouldn't have. You should have! I'm so glad you did!", "Wonderful! I'm making you something to say thank you. It'll have cheese in it."],
        like: ["Aw, thanks! This is going right in the kitchen.", "{A_item}! Lovely. You're a good egg, {name}."] },
    scampi: { love: ["{A_item}! Shiver me... well. Me everything. That's a fine gift, that is.", "Ye've a good eye for what an old salt likes. I'll stow it somewhere dry. A rare thing, for me."],
        like: ['Aye, that\'ll do. Thank ye kindly.', '{A_item}. Useful. Most things are, at sea. Or on a farm.'] },
    mug: { love: ["{A_item}?! Oh my gosh, my handle's shaking. Thank you thank you!", "Best thing anyone's given me in three hundred years! Okay, nobody gave me anything for three hundred years. Still!"],
        like: ["Ooh! For me? You're sweeter than a sugar cube.", "{A_item}! It's going right by the espresso machine. Place of honor."] },
};
/* what they say for a gift they love or like: their own line, or one of the two more */
function giftThanks(id, tier, itemId) {
    const t = TALK[id] || {}, own = tier === 'love' ? t.loveLine : t.likeLine, more = GIFT_MORE[id] && GIFT_MORE[id][tier === 'love' ? 'love' : 'like'];
    const all = [own].concat(more || []).filter(Boolean);
    return all.length ? fillItem(rpick(all), itemId) : 'Thank you!';
}

/* ---------------------------------------------------------------- a good friend's hello, in their own words */
const OPEN_CLOSE_OWN = {
    maki: ["{name}. I saved you a spot in today's schedule. A good spot. Right after tea.", 'Ah, {name}. Everything is in order now that you are here.'],
    kai: ["{name}! My favorite wave just rolled in. It's you. You're the wave.", 'Dude! I was literally just thinking about you. And waves. But mostly you.'],
    basil: ['{name}. Good. The day felt like it was missing an ingredient.', "There you are. I saved you a bowl in my head. It's a very good bowl."],
    wonton: ['{name}! I got all steamy when I saw you coming. Happy steam.', "Oh, hi! You're my favorite visitor. The spring agrees."],
    chili: ["Hey. You. I'm glad it's you. Don't tell anyone I said glad.", "{name}. Finally, someone worth turning my head for."],
    coco: ['{name}! You are the FIRST person I wanted to see today. I have SO much.', "Oh thank goodness, it's you. Sit. Stand. Whatever. Listen."],
    cece: ["{name}! Oh, I'm so happy it's you! I was hoping it would be you!", "Hi! You're here! That's the nicest thing that's happened all day!"],
    clementine: ['Darling! There you are. The day was dreadfully plain without you.', '{name}. You walk in and everything looks better styled.'],
    cuke: ["{name}!! My favorite running buddy! Even when you're walking!", "HI! You're here! That's worth a victory lap!"],
    sully: ["Kid! There's my favorite. Get over here.", "Hey, kid. Good to see ya. Wicked good."],
    ginger: ["{name}! Oh good, you're here. Everything's sturdier when you're around.", 'Hey you! Perfect timing. I was just about to take a break and hoping it would be with you.'],
    brulee: ['{name}! Mon amie. The best part of my day has arrived.', "Ah! There you are. The island's finest exhibit."],
    mac: ["{name}! Come here, come here. I was hoping you'd stop by.", "There's my favorite person! Hungry? Doesn't matter. I'm happy you're here."],
    scampi: ["Ahoy, {name}! There's the best sight on this whole island. Don't tell the sea.", 'Ah, me favorite landlubber. Come aboard. Er. Come over.'],
    mug: ["{name}! My favorite! You make me feel like a fresh pot!", "Oh, it's YOU! Hi hi hi! Best part of my day, every day!"],
};

/* ---------------------------------------------------------------- the photo at five hearts */
const PHOTO_GIVE = {
    maki: 'I want you to have this. My photo. It was taken at precisely the right moment. I checked.',
    kai: "Dude, here. My photo. Best angle I've got. Which is all of them.",
    basil: "I don't give these out. But you're not just anyone. Here. My photo.",
    wonton: 'Here! My photo! It is a little steamy. The camera fogged up. That is how you know it is me.',
    chili: "Here. My photo. Don't put it anywhere obvious. ...Okay, put it somewhere obvious.",
    coco: "I had THREE photos and I'm giving you the best one. Do you know what that means? It means a LOT.",
    cece: "Here, this is for you. It's my photo. I'm blinking in it. Sorry. I'm always blinking in them.",
    clementine: "Darling, a signed photo. Frame it in something orange. You'll know what's right.",
    cuke: "Here! My photo! I was mid-jog! You can tell because I'm a blur! That's me! Happy blur!",
    sully: "Here, kid. My photo. Don't make a fuss. ...Okay, a little fuss.",
    ginger: "Here! A photo of me. I made the frame myself. It's sturdy. It'll outlast us both.",
    brulee: 'For you, mon amie. My portrait. Hang it with care. In good light.',
    mac: "Here! My photo! I'm holding a spoon in it. I'm always holding a spoon. It's my good side.",
};
const PHOTO_GIVE_ANY = "Hey. I want you to have this. It's my photo. Don't make it weird.";

/* ---------------------------------------------------------------- the gift for her house at four hearts */
const HOUSE_GIFT_LINES = {
    maki: 'I sent you something for your house. In the mail. I chose it carefully. It will look correct anywhere. I measured your doorway in my head.',
    kai: 'Dude, check your mail! I sent you something for your place. Every house needs a little ocean in it.',
    basil: "I mailed you something for your home. A little light for late evenings. You'll know what I mean when you see it.",
    wonton: "I sent you something for your house! It's from the spring. Well, it reminds me of the spring. That's the same thing.",
    chili: "Check your mailbox. I sent you something for your house. It'll make the place a little warmer. Okay, a lot warmer.",
    coco: 'I sent you something for your house and you have to tell me where you put it. And send a photo. And tell everyone who gave it to you.',
    cece: "I sent you something for your house! I hope you like it. If you don't, that's okay! But I hope you do!",
    clementine: 'Darling, there is something for your home in the mail. Every room deserves one beautiful thing. Now yours has two: that, and you.',
    cuke: 'I sent you something for your house! It grows! You water it! Hydrate it! Like me!',
    sully: "Sent ya somethin' for the house, kid. It's in the mail. Don't go thankin' me. ...Okay, thank me a little.",
    ginger: "I sent you something for your house! I checked it over twice. Nothing wobbles. I'd never send you a wobbler.",
    brulee: 'I have mailed you something for your home. A small piece of art. Every home should have a little museum in it.',
    mac: "I sent you something for your house! For your table. So you remember to eat. You never eat enough.",
    scampi: "Sent ye somethin' for yer house, by post. Every home needs a bit o' the sea in it. Keeps ye honest.",
    mug: "Check your mail! I sent you something for your house! It's from the old days. Well, it's like the old days. It's cozy!",
};

/* ---------------------------------------------------------------- the best-friend moment at five hearts */
Object.assign(BEST_FRIEND, {
    basil: ['{name}. I have something to say, and I am going to say it slowly. You are my best friend.', 'There. Now it is said. I feel like a bowl of broth on a cold night. Thank you.'],
    wonton: ["{name}! You're my best friend! On the whole island! In the whole spring!", "I'm so warm right now. This is the good kind of warm. The best friend kind."],
    chili: ["Okay. I'm only saying this once. You're my best friend. There. Said it.", "If you tell anyone, I'll deny it. ...You can tell a few people."],
    coco: ["{name}. Okay. This is the biggest news I've ever had, and I'm telling YOU first. You're my best friend.", "I'm not going to tell anyone. ...I'm going to tell EVERYONE."],
    cece: ["{name}... you're my best friend. Is that okay? I hope that's okay. You don't have to say it back!", "Oh, I'm so glad I said it. I've been practicing on the oven for a week."],
    clementine: ["Darling. I don't say this lightly. You are my dearest friend on this island.", "There. Now I need a moment. And a very good scarf."],
    cuke: ["{name}! You're my BEST friend! Like, my best best friend! Best friend forever!", "I'm so happy I could run a marathon! I'm going to! Tomorrow! At 4 AM!"],
    ginger: ["{name}, I've built a lot of things on this island. But this friendship? It's the sturdiest one I've got.", "You're my best friend. Built to last. Measured twice."],
    brulee: ['{name}, mon amie. In all my years with the museum, nothing has been as precious as our friendship.', 'You are my best friend. That, I would never put behind glass.'],
    mac: ["{name}... you're my best friend. Like the cheese on a macaroni. You make everything better.", "Okay, that's enough mush. Come eat something. Best friends eat together."],
    scampi: ["{name}, I've sailed every sea there is, and I never found a friend like ye. Ye're me best mate.", "Now don't go blubberin'. Ye'll set me off. Har. ...It's sea spray. Again."],
    mug: ["{name}! I've been waiting three hundred years to say this to someone. You're my best friend!", "Okay, that's it. That's all. I'm going to go steam quietly in the corner. Happily!"],
});

/* ---------------------------------------------------------------- Shrimpy and Muggy: hellos, too soon, milestones */
OPENERS.scampi = ["Ahoy, {name}! Fine weather. Or foul. Can't tell on land.", "Ah, {name}. Me old shell's glad to see ye.", "Yarr, {name}. Mind the soil. I just turned it."];
OPENERS.mug = ["{name}! Hi! Hello! Good to see you! I've had three coffees!", "Oh! {name}! Come in! I mean, come over! I'm not a café right now!", "Hi hi! Perfect timing. I was just warming up."];
TOO_SOON.scampi = ["We just spoke, matey. Give an old salt a few minutes to think o' somethin'.", 'Still nothin\'. Me thoughts are adrift. Give \'em {min} {mins} to come back to port.', '*tips his hat and says nothing*'];
TOO_SOON.mug = ["We JUST talked! I'm still buzzing from the last time! Give me a few minutes!", "I need {min} more {mins} to brew something new. Good things take time. Like coffee.", "*steams politely*"];
FAV_SPOT.scampi = ['beach_far', "Want to know me favorite spot? The far beach, past the lighthouse road. Where I washed up.", "Ye can hear the open sea from there. It talks to me. Mostly it says 'come back.' I say 'later.'"];
FAV_SPOT.mug = ['bench_museum', "My favorite spot? The bench by the museum! That's where I got put back together. Well, inside. But the bench is close!", 'I sit there and wave at the pottery hall. Some of them might have been my neighbors.'];
FAV_NAMES.beach_far = 'The far beach, where he washed up';
FAV_NAMES.bench_museum = 'The bench by the museum';
ADVICE.scampi = { q: 'I need a second opinion. Should I plant me carrots in rows straight as a mast, or let \'em wander like the tide?', a: ['Straight rows', 'Let them wander'],
    r: ['Straight as a mast. Aye. A tidy deck is a happy deck. Even when the deck\'s made o\' dirt.', "Like the tide. Har! The carrots'll love it. Cuke'll faint. Worth it."] };
ADVICE.mug = { q: "Can I ask you something? Should the café play music? Back in my day the teapot sang. I don't want to replace her. But it's QUIET.", a: ['Play some music', 'Keep it cozy and quiet'],
    r: ["Music! Okay! Something gentle. Something the teapot would've hummed along to. Oh, I'm going to cry into the foam.", "Cozy and quiet. Yes. Just the steam and the cups clinking. That's a kind of music, isn't it? The best kind."] };
HOUSE_GIFT.scampi = 'anchor_deco';
HOUSE_GIFT.mug = 'teapot_lamp';

/* ---------------------------------------------------------------- Brulee and the pottery hall */
/* (Muggy's story waits for twenty gifts to the museum and a pot of Sarah's on every pedestal, and nothing said so: once
   she's given half, Brulee mentions the bare pedestals and how many gifts it's been, now and then) */
EXTRA_TOPICS.push(['pottery_hall', n => (n.id === 'brulee' && mugStage() === 0 && (S.stats.donated || 0) >= MUG_DONATED / 2 && !mugReady() ? 2 : 0), () => {
    const pots = new Set(artState().pots).size, left = MUSEUM_PEDESTALS.length - pots;
    return left > 0 ? `The pottery hall still has ${left} empty ${plural(left, 'pedestal')}. If you made something on Sully's wheel, I would be honored to show it. Every pedestal, ideally. I am a completionist.`
        : "Every pedestal in the pottery hall has one of your pieces now. And your gifts to the museum: so many! A few more and I may have something to tell you. An old story. Patience.";
}]);

/* ---------------------------------------------------------------- the small pools heard several times a day */
IDLE_HELLO.stars.push('There! A shooting star! ...Or a plane. Make a wish anyway.', "The moon's out. It looks like a big round rice cracker. Now I'm hungry.");
IDLE_HELLO.snack.push('The best ice cream is the one you eat outside. Scientific fact.', "I'm eating this slowly. It's melting quickly. It's a race.");
IDLE_HELLO.phone.push("I'm reading the island paper. Somebody grew a very big turnip. Big news.", 'Hold on, I\'m winning a game. ...I lost. Hi!');
IDLE_HELLO.book.push('Chapter twelve! Only forty more to go.', "This book has a map at the front. That's how you know it's a good one.");
IDLE_HELLO.ground.push("The ground's warm from the sun. Try it. Lie back. See?", 'I counted three bees and a ladybug. Busy afternoon down here.');
IDLE_HELLO.paint.push('Every painting needs a happy little goat. That\'s my rule.', "Hold still! ...Oh, you weren't in it. Carry on.");
IDLE_HELLO.cup.push("Cocoa from home. Not as fancy as the café's, but it's mine.", 'Steam is just warmth you can see. I read that somewhere. Or made it up.');
IDLE_HELLO.fish.push("I named the one that got away. Gerald. I'll get you, Gerald.", "Fishing's mostly sitting. I'm very good at sitting.");
IDLE_HELLO.sip.push('Water break! Very important. Hydration is a lifestyle.', 'This fountain has the best water on the island. I\'ve tried them all. There is one.');
IDLE_HELLO.scope.push('I can see the lighthouse from here. And a gull. The gull can see me too.', 'Somewhere out there is another island. I wave just in case.');
MISSED_LINES.push("Look who it is! I was starting to worry. Don't do that to me again. ...Unless it was a fun trip.", '{name}! The island wasn\'t the same without you. Even the gulls noticed.',
    'You\'re here! I saved up so many things to tell you. Sit. This might take a while.');
CHAT_HI.push("Oh, {name}! We were just saying how nice the day is. It's nicer now.", '{name}! Come join us. {B} was just telling me something very important. Probably.',
    'Hi, {name}! You caught us chatting. Ask {B}, it was all very interesting.');
FAVOR_ASK.push("Can I ask you something? I could use a hand with a little thing. If you've got a minute.",
    "{name}! You're just who I was hoping to see. Could you help me out with something?", "I hate to ask, but... actually, I don't hate it. You're good at this. Help me with something?");
