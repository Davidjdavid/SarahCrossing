// New lines for features that aren't in the game yet: the zip code (the real world's time, weather and news), the Post
// Office, the Bank and the Town Hall, written for every way each can go (it worked, still loading, no internet, the
// news / weather / stock service is down, no zip code yet, the market's closed...) so the screens and the people behind
// the counters are ready before the features are hooked up. Who's behind each counter is a proposal for David to
// change: the Town Hall is the Cozy Council's (Sir Floret, Dame Stalk, Little Sprout, who exist already); the Post
// Office and the Bank need keepers, written here as Pita (a pita pocket, full of letters) and Penny (a chocolate coin
// in gold foil).
//
// Fill-ins: {name} Sarah's name, {island} the island's name, {zip}, {town} (the zip code's town), {temp} {high} {low}
// {sky} (the forecast), {headline}, {amount}, {balance}, {rate}, {stock}, {price}, {change}, {shares}, {goal}, {item},
// {days}, {holiday}, {who}, {landmark}, {newname}, {when}, {count}.

const L = [];
let cur = null;
function sec(feature, prefix) { cur = { feature, prefix, n: 0 }; }
// one line: who, state (how things went), when (plain words), the line
function l(who, state, when, line) { cur.n++; L.push({ id: `NEW-${cur.prefix}-${String(cur.n).padStart(3, '0')}`, feature: cur.feature, who, state, when, line }); }

/* ============================================================== the zip code */
sec('Zip code', 'ZIP');
l('Sir Floret', 'Works', "Sarah asks at the Town Hall's front desk to register her address", 'Ah, a resident wishes to register! Splendid. The Council requires only one thing: your zip code. Five digits. No more, no less.');
l('Dame Stalk', 'Works', 'Asking for the zip code', 'Your zip code, please. It tells the island where you are in the big world: your time, your weather, your news. I will file it under "important."');
l('Little Sprout', 'Works', 'Asking for the zip code', "I get to find your town on the map! Dame Stalk gave me one little flag. I've been saving it for somewhere important.");
l('On screen', 'Works', 'The zip code box', 'Your zip code (5 digits)');
l('On screen', 'Works', 'Under the zip code box', "Used for your time zone, local weather, and local news. Saved with your island.");
l('On screen', 'Loading', 'While the zip code is being looked up', 'Looking it up...');
l('Dame Stalk', 'Loading', 'While the zip code is being looked up', 'One moment. I am consulting the big map. It is very big. It is a map.');
l('Sir Floret', 'Works', 'The zip code was found', '{town}! A fine place. The Council has heard nothing but good things. The Council has heard nothing at all, but we assume.');
l('Dame Stalk', 'Works', 'The zip code was found: the time zone is set', "Noted. The island's clocks now keep {town} time. It is {time} there. Which is to say: here.");
l('Little Sprout', 'Works', 'The zip code was found', "{town}! I'm going to put a pin in it! On the map! With my head! (I don't have hands.)");
l('On screen', 'Works', 'The zip code was found', 'Your island now keeps {town} time. Weather and news will come from {town}.');
l('Dame Stalk', 'Bad zip code', 'Sarah typed something that is not five digits', 'That is not five digits. I counted. Twice. Try again, please.');
l('Dame Stalk', 'Bad zip code', 'Five digits, but no such zip code', 'I cannot find {zip} anywhere. Not on the map, not under the map. Could there be a typo?');
l('Little Sprout', 'Bad zip code', 'No such zip code', 'Is {zip} a real place? It SOUNDS like a real place. Maybe it moved.');
l('On screen', 'Bad zip code', 'No such zip code', "We couldn't find that zip code. Check the numbers and try again.");
l('Dame Stalk', 'No internet', "Sarah registers a zip code but there's no internet connection", 'We\'re offline. I\'ve saved your zip code and will look it up when the connection returns.');
l('On screen', 'No internet', "Can't look the zip code up", "No internet connection. Your zip code is saved and the island will look it up when it's back online. Until then it keeps your device's time.");
l('Dame Stalk', 'Service down', "The place lookup service isn't answering", 'The address service isn\'t answering. Your number is saved. I\'ll try again tomorrow morning.');
l('On screen', 'Service down', "The place lookup service isn't answering", "The zip code service isn't available. Your number is saved; we'll try again later.");
l('Sir Floret', 'Works', 'Sarah changes her zip code later', 'Moving, are we? Spiritually, at least. The Council will update its records. Dame Stalk will update the Council.');
l('Dame Stalk', 'Works', 'Sarah removes her zip code', 'Removed. Back to your device\'s clock. No local weather or news until you register again. I shall leave a space in the filing cabinet. It will bother me.');
l('Sir Floret', 'No zip code', 'A neighbor sends Sarah to the Town Hall because she has no zip code yet', 'Without a zip code, the island does not know where in the world it is. Philosophically troubling. Practically: no weather, no news. Visit the Town Hall!');
l('Any neighbor', 'No zip code', "A neighbor mentions the newspaper's missing local section", "The paper didn't have any local news for you! You should tell the Town Hall your zip code. Dame Stalk LOVES filing things.");
l('On screen', 'No zip code', 'Settings: the zip code line when none is set', 'Zip code: not set. Register one at the Town Hall.');
l('On screen', 'Works', 'Settings: the zip code line', 'Zip code: {zip} ({town}). Change it at the Town Hall.');
l('On screen', 'Works', 'The Today app: the time line, when the zip code sets the time zone', "{time} in {town} (from your zip code)");

/* ---- the weather forecast (the day's prediction, fetched once in the morning) */
sec('Weather forecast', 'WX');
l('Island board', 'Works', "The island board: today's forecast", "Today in {town}: {sky}, a high of {high}° and a low of {low}°. The island's weather follows the forecast.");
l('Island board', 'Works', 'The island board: a rainy forecast', 'Today in {town}: rain is likely ({chance}%). Umbrellas recommended. Ducks delighted.');
l('Island board', 'Works', 'The island board: a snowy forecast', 'Today in {town}: snow! A high of {high}°. Bundle up. Build something.');
l('Island board', 'Works', 'The island board: a hot forecast', 'Today in {town}: hot, up to {high}°. Wonton recommends the hot spring anyway.');
l('Island board', 'Works', 'The island board: a stormy forecast', '{town}: thunderstorms possible. Check the sky before a long outing.');
l('Island board', 'Loading', 'The island board, while the forecast is still on its way', 'Checking the forecast...');
l('Island board', 'No internet', "The island board, when the forecast couldn't be fetched (no internet)", "No forecast available. We couldn't reach the weather service. The island is using its own weather today.");
l('Island board', 'Service down', "The island board, when the weather service didn't answer", "The weather service didn't answer this morning. Today's weather is the island's own. (It's doing great.)");
l('Island board', 'Old data', "The island board, using yesterday's forecast", "Yesterday's forecast for {town}: {sky}, {high}°. Today's update hasn't arrived.");
l('Island board', 'No zip code', 'The island board when no zip code is set', 'Want the real forecast? Register your zip code at the Town Hall.');
l('Kai', 'Works', 'A neighbor mentions the forecast: rain', 'Forecast says rain, dude. Rain is just the ocean visiting. Be nice to it.');
l('Wonton', 'Works', 'A neighbor mentions the forecast: cold', 'It says it gets down to {low} tonight. The spring will be PERFECT. Come by. Bring a towel. Or don\'t. I\'m not your mom.');
l('Cuke', 'Works', 'A neighbor mentions the forecast: sunny', "Sunny and {high}! PERFECT jogging weather! Every weather is perfect jogging weather, but THIS ONE ESPECIALLY!");
l('Cece', 'Works', 'A neighbor mentions the forecast: hot', "It's going to be {high} today. I'm a cheesecake. That's a lot for me. Sorry. I'm just telling you. In case I melt.");
l('Coco', 'Works', 'A neighbor mentions the forecast: storms', "The paper says storms. I LOVE storms. Everybody stays in and tells secrets. Come over. Bring secrets.");
l('Chili', 'Works', 'A neighbor mentions the forecast: hot', "{high} degrees? Pfff. That's a breeze. That's a nice cool breeze, for me.");
l('Maki', 'Works', 'A neighbor mentions the forecast', 'I have read the forecast. I have planned my day around the forecast. If the forecast is wrong, I will be calm about it. Probably.');
l('Sully', 'Works', 'A neighbor mentions the forecast: snow', "Snow, kid! In Boston we'd call this a light dustin'. Then we'd complain about it for six months.");
l('Any neighbor', 'Service down', 'A neighbor notices there was no forecast', 'The board had no forecast today. So the weather is a surprise! I love a surprise. Mostly.');

/* ---- the newspaper (the Post Office mails one every morning) */
sec('Newspaper', 'NEWS');
l('On screen', 'Works', "The newspaper's name, at the top of the front page", 'The {island} Gazette');
l('On screen', 'Works', 'Under the name', 'Delivered every morning by the {island} Post Office · {date}');
l('On screen', 'Works', 'Section heading', 'News from {town}');
l('On screen', 'Works', 'Section heading', 'World news');
l('On screen', 'Works', 'Section heading', "Today's weather");
l('On screen', 'Works', 'Section heading', 'Island news');
l('On screen', 'Works', 'Section heading', "Coco's Corner");
l('On screen', 'Works', 'Section heading', 'The markets (from the Bank)');
l('On screen', 'Works', 'Under a real news story', 'Read the full story');
l('On screen', 'Works', 'The bottom of the front page', "Headlines from the wider world, alongside stories from the island.");
l('Narration', 'Works', 'The newspaper arrives in the mailbox in the morning', "This morning's paper is in the mailbox. It's still a little warm. Pita must have run.");
l('On screen', 'Works', 'The mailbox: the paper in the list', "The {island} Gazette, {date}");
l('Narration', 'Works', 'Island news: Sarah caught a lot of fish yesterday', 'LOCAL ANGLER STRIKES AGAIN. {name} reeled in {count} fish yesterday. Kai calls it "honestly kind of rude, bro (proud)."');
l('Narration', 'Works', 'Island news: a big fish', 'WHOPPER AT THE PIER. A {item} the size of a canoe (Kai measured with his arms) was caught off the island yesterday.');
l('Narration', 'Works', 'Island news: Sarah cooked', 'KITCHEN NEWS. {name} cooked {item} yesterday. Mac is "not threatened. Inspired. Slightly threatened."');
l('Narration', 'Works', 'Island news: a new painting in the museum', 'ART WORLD STUNNED. A new work, "{item}," now hangs in the museum. Brulee wept. Brulee always weeps. This time it was more.');
l('Narration', 'Works', 'Island news: a neighbor\'s house was redone', "HOME MAKEOVER. {who}'s house got a new look from Ginger yesterday. {who} has walked past it {count} times.");
l('Narration', 'Works', 'Island news: a holiday today', "TODAY: {holiday}! The square is decorated. Bring your best mood.");
l('Narration', 'Works', 'Island news: a neighbor\'s birthday or day', "HAPPY {holiday}! It's {who}'s day. {who} has been instructed to enjoy the attention. Please assist.");
l('Narration', 'Works', 'Island news: an arcade record', 'NEW RECORD AT THE ARCADE. {name} scored {count} at {item}. Chili has been informed. Chili is "fine."');
l('Narration', 'Works', 'Island news: a drama storyline (from the drama engine)', 'SOURCES SAY: things are tense between {A} and {B}. More as it develops. (Coco is on it.)');
l('Narration', 'Works', 'Island news: a quiet day', 'A QUIET DAY. Nothing happened on {island} yesterday, and everybody enjoyed it very much.');
l('Narration', 'Works', 'Island news: a mystery solved', 'MYSTERY SOLVED! The old {item} is a mystery no more, thanks to {name}. Sully says he "knew the whole time." He did not.');
l('Coco', 'Works', "Coco's Corner: gossip about Sarah and Joe", 'Spotted: a certain poet and a certain {name}, sharing a bench at sunset. Nobody was close enough to hear. I was close enough to hear. It was about a spoon.');
l('Coco', 'Works', "Coco's Corner: general gossip", "Who has two thumbs and knows everything? Me. I don't have thumbs. I still know everything. Read on.");
l('Coco', 'Works', "Coco's Corner: Sarah's outfit", "Fashion watch: {name} wore the {item} yesterday. Clementine said 'hm.' From Clementine, that is a standing ovation.");
l('Coco', 'Works', "Coco's Corner: a slow day", "Nothing to report. NOTHING. I'm as upset as you are. Somebody do something. Anything. Please.");
l('Narration', 'No internet', "The paper when the island couldn't reach the news (no internet)", "We couldn't connect to the news service today. Island stories are available below.");
l('Narration', 'Service down', "The paper when the news service didn't answer", "Our news service didn't answer this morning, so the world news is taking a day off. The island news never does.");
l('Narration', 'Old data', "The paper using yesterday's headlines", "These headlines are from yesterday: today's didn't arrive in time. Old news is still news. It's just older.");
l('Narration', 'No zip code', 'The paper when no zip code is set', 'Want news from your town? Register your zip code at the Town Hall and the Gazette will find it.');
l('Narration', 'Service down', 'The paper when the weather service was down too', "No forecast this morning. Look out the window. That's the forecast.");
l('Narration', 'Works', 'The paper on a day with no real headlines to show', 'No new headlines were returned today. The island edition is below.');
l('Pita', 'Works', "Pita, if Sarah asks why the paper's late", "The paper's late. I'm still delivering it. I can't run and say 'sorry' at the same time. I'll do both when I get there.");
l('Any neighbor', 'Works', 'A neighbor talks about the morning paper', "Did you read the paper this morning? I read it twice. Once for the news and once for Coco's Corner. Mostly for Coco's Corner.");
l('Joe', 'Works', 'Joe on the morning paper', "I read the paper this morning. There was a story about you. I cut it out. It's on my fridge. Is that weird? It's on my fridge.");
l('Maki', 'Works', 'Maki on the morning paper', 'I read the paper in order. Front to back. Every word. Then I fold it into a very precise square. The square is the best part.');
l('Kai', 'Works', 'Kai on the morning paper', "I only read the weather and the fishing news, bro. And the comics. Wait, are there comics? There should be comics.");
l('Brulee', 'Works', 'Brulee on the paper, after Sarah\'s painting made the news', 'Did you SEE? The Gazette! Your painting! I have bought fourteen copies. I have one copy. Pita only prints one. I have read it fourteen times.');
l('Sully', 'Works', 'Sully on the paper', "Back in my day the paper was one page and the headline was always 'FOG.' This is way bettah, kid.");

/* ============================================================== the Post Office (Pita) */
sec('Post Office', 'PO');
l('Pita', 'Works', 'Sarah walks into the Post Office (first time)', "Oh! A customer! Welcome to the {island} Post Office! I'm Pita. I'm a pita pocket. Everything fits in my pocket. Letters, packages, my lunch. It's a very good pocket.");
l('Pita', 'Works', 'Walking in, everyday', ['Hi hi! Sending, collecting, or just visiting the stamps?', "Welcome back! The mail's all sorted. I sorted it twice. Once by name and once by smell.", "{name}! My favorite address!"].join(' | '));
l('Pita', 'Works', 'Walking in, in the morning', "Morning! The papers went out at dawn. I ran the whole route. My pocket is empty and my heart is full.");
l('Pita', 'Works', 'Walking in, in the rain', "Rain! Don't worry, every letter's dry. I keep them deep in the pocket. The pocket is waterproof. The pita is not.");
l('Pita', 'Works', 'Pita\'s menu', 'What can I do for you?');
l('Sarah', 'Works', "Pita's menu: a choice", 'Send a letter');
l('Sarah', 'Works', "Pita's menu: a choice", 'Newspaper archive');
l('Sarah', 'Works', "Pita's menu: a choice", 'My postcards');
l('Sarah', 'Works', "Pita's menu: a choice", 'Track a package');
l('Sarah', 'Works', "Pita's menu: a choice", 'Mailbox style');
l('Sarah', 'Works', "Pita's menu: a choice", 'Any lost mail?');
l('Sarah', 'Works', "Pita's menu: a choice", 'Just saying hi');
l('Pita', 'Works', 'Sarah picks "Just saying hi"', 'Hi! That was nice. Nobody ever comes in just to say hi. I\'m going to write it down. In a letter. To myself.');
l('Narration', 'Works', 'The Post Office door when it\'s closed', 'THE {island} POST OFFICE. Open {hours}. A note on the door: "Out delivering. Or asleep. Probably asleep. -Pita"');
l('Pita', 'Works', 'Sarah comes in just before closing', "We're closing in a few minutes! But I'll never close on a letter. Letters are family.");

/* sending letters (with presents) */
l('Pita', 'Works', 'Sending a letter: who to', 'Who\'s it for? I know every address on the island. I know every address by heart. Some of them by stomach.');
l('On screen', 'Works', 'Sending a letter: the letter screen', 'Write your letter. Attach a present if you like.');
l('On screen', 'Works', 'Sending a letter: the stamp price', 'Postage: {amount} sand dollars (free on Sundays)');
l('Pita', 'Works', 'Sending a letter: done', "Into the pocket! It'll reach {who}'s mailbox tomorrow morning. I've written 'DON'T FORGET' on my hand. That's made sorting a bit slower.");
l('Pita', 'Works', 'Sending a letter with a present attached', 'A present, too! Oh, they\'re going to love it. I can tell. I\'m not peeking. I\'m a little peeking.');
l('Pita', 'Not enough money', "Sending a letter without enough sand dollars for the stamp", "Oh, a stamp's {amount}, and your pocket's a bit light. Come back after some fishing! The letter will wait. Letters are patient.");
l('Pita', 'Empty', 'Sending a letter with nothing written', "It's empty! That's a very mysterious letter. Want to write something first? Even just 'hi'?");
l('Pita', 'Works', "Sending a letter to someone who's off the island (David, the family)", "Mainland post. That takes two days. I'll put it in the next boat's sack.");
l('Any neighbor', 'Works', 'A neighbor gets a letter from Sarah (when they next see her)', "I got your letter! I read it three times. Then I put it under my pillow. Is that what you do with letters? That's what I do now.");
l('Any neighbor', 'Works', 'A neighbor gets a letter with a present', "Your letter came with a present! A letter AND a present! That's two things! I counted!");
l('Maki', 'Works', 'Maki gets a letter from Sarah', 'Your letter arrived. I have filed it. Under "S," for "Sarah," and also under "L," for "lovely." It is the first thing filed twice.');
l('Kai', 'Works', 'Kai gets a letter from Sarah', 'Dude! You sent me MAIL! Real mail! I\'ve never gotten real mail! I\'ve gotten sand in the mailbox! This is better!');
l('Coco', 'Works', 'Coco gets a letter from Sarah', "A LETTER! From YOU! I've read it. I've read it to my mirror. Is there a secret code? There's a secret code, right? I'll find it.");
l('Joe', 'Works', 'Joe gets a letter from Sarah', "You wrote me a letter. I wrote one back. Then I wrote one back to that. They're all in your mailbox now. Sorry. Not sorry.");
l('Sully', 'Works', 'Sully gets a letter from Sarah', "Got your lettah, kid. Haven't gotten a real lettah since 1987. Stuck it on the fridge. Right next to the other one.");
l('Cece', 'Works', 'Cece gets a letter from Sarah', 'You wrote me a letter! I cried on it a little. Sorry. The ink ran. I can still read it. I memorized it before it ran.');

/* newspaper archive */
l('Pita', 'Works', 'The newspaper archive', 'Every paper since you got here! I keep them all. In the back. In the other pocket.');
l('On screen', 'Works', 'The archive screen: heading', 'The Gazette archive');
l('On screen', 'Works', 'The archive screen: under the heading', '{count} papers kept. Tap one to read it again.');
l('On screen', 'Empty', 'The archive with no papers yet', 'No papers yet. The first one comes tomorrow morning.');
l('On screen', 'Works', 'The archive: search box', 'Find a day or a word');
l('On screen', 'Empty', 'The archive: a search that found nothing', 'No papers mention that. Yet.');
l('On screen', 'Old data', "The archive: a paper whose world news couldn't be kept", 'The world news on this day was only kept as headlines.');

/* postcards */
l('Pita', 'Works', 'Postcards', 'Postcards from all over! Places I\'ve never been. Places nobody\'s been. Some of them I think are made up. They\'re still beautiful.');
l('On screen', 'Works', 'The postcard album: heading', 'Postcards');
l('On screen', 'Works', 'The postcard album: count', '{count} of {total} postcards collected');
l('On screen', 'Empty', 'The postcard album when empty', 'No postcards yet. Neighbors who go on trips send them, and some just turn up in the mail.');
l('Narration', 'Works', 'A postcard arrives in the mail', 'A postcard! The picture on the front is {item}. On the back, in tiny writing: "Wish you were here. Wish I was there. Wait, I am there."');
l('Narration', 'Works', 'A postcard from a neighbor on an outing', 'A postcard from {who}, from the lookout: "The view is huge. Bigger than the postcard. Weird, right?"');
l('Narration', 'Works', 'A postcard from David', 'A postcard from David: "Honey, the mainland is NOTHING compared to your island. Also, I bought a hat. It\'s for you. It\'s for me."');
l('On screen', 'Works', 'Postcard names (made-up places)', ['Cinnamon Falls', 'The Great Gumdrop Desert', 'Pancake Peaks', 'Lake Lemonade', 'The Marshmallow Moors', 'Port Pretzel', 'The Licorice Cliffs', 'Mount Meringue'].join(' | '));

/* package tracking (orders from the laptop) */
l('Pita', 'Works', 'Tracking: Sarah has orders on the way', 'You have {count} on the way! Let me check the pocket... yep. Right here. I mean, at the warehouse. Which is also the pocket.');
l('On screen', 'Works', 'Tracking: heading', 'Your packages');
l('On screen', 'Works', 'Tracking: ordered', 'Ordered {when} · Packing at IslandMart');
l('On screen', 'Works', 'Tracking: on the boat', 'On the boat · Arriving tomorrow morning');
l('On screen', 'Works', 'Tracking: out for delivery', "Out for delivery · Pita's on the way");
l('On screen', 'Works', 'Tracking: delivered', 'Delivered {when} · In your mailbox');
l('On screen', 'Works', 'Tracking: a special delivery (no tracking)', "A special delivery. No tracking. Very mysterious. Pita won't say.");
l('On screen', 'Empty', 'Tracking: nothing on the way', 'Nothing on the way. Order from IslandMart on your laptop and it arrives in the next morning\'s mail.');
l('Pita', 'Empty', 'Tracking: nothing on the way', "Nothing in the pocket for you right now! Order something on your laptop and I'll bring it first thing.");
l('Pita', 'Works', 'Tracking: a big order', 'A big box! I can carry it. I can definitely carry it. I\'m going to need a running start.');
l('Pita', 'Works', 'Tracking: a storm delays the boat', "The boat's waiting out the storm. Your package is safe and dry, but a day late. I'll deliver it when the boat arrives.");

/* lost mail quests */
l('Pita', 'Works', 'Lost mail: a letter needs delivering (a quest)', "Oh no, oh no. I found a letter in the bottom of my pocket. It's for {who}. It's from... last week. Could you take it to them? I can't face them. I'm too crumbly.");
l('Pita', 'Works', 'Lost mail: a package with a smudged address', "This package got rained on and I can't read the name! It smells like {item}. Who on the island loves {item}? Could you find out?");
l('Pita', 'Works', 'Lost mail: Sarah delivered it', "You found them! Thank you! Here, a stamp for your trouble. A special one. It has a picture of me on it. I'm very handsome on stamps.");
l('Pita', 'Empty', 'Lost mail: nothing lost today', 'Nothing lost today! Every letter where it belongs. I checked the pocket three times. It echoes.');
l('Any neighbor', 'Works', 'Sarah hands over lost mail', 'Is this for me? From last WEEK? Oh, Pita. Bless that pocket. Thank you for bringing it!');
l('Any neighbor', 'Works', 'Sarah takes lost mail to the wrong neighbor', "This isn't for me. I wish it was! It smells nice. Try someone else?");

/* special deliveries */
l('Narration', 'Works', 'A special delivery arrives (now and then)', 'A package in the mailbox. No stamp. No return address. Just a little drawing of a star. It hums very quietly.');
l('Pita', 'Works', 'Asked about a special delivery', "I don't know who sent it! It was just in the pocket this morning. That's never happened. Okay, it's happened twice. Both times it was nice!");
l('Narration', 'Works', 'Opening a special delivery', 'Inside, wrapped in old newspaper: {item}! A note says only "For the island\'s favorite."');

/* mailbox customization */
l('Pita', 'Works', 'Mailbox style', "Your mailbox is your face to the world! Well, your house's face. Your house's mouth. Let's make it pretty.");
l('On screen', 'Works', 'Mailbox style: heading', 'Mailbox style');
l('On screen', 'Works', 'Mailbox style: choices', ['Classic', 'Cottage', 'Fish', 'Birdhouse', 'Lighthouse', 'Mushroom', 'Rocket', 'Cake'].join(' | '));
l('On screen', 'Works', 'Mailbox style: color', 'Color');
l('On screen', 'Works', 'Mailbox style: price', 'A new mailbox costs {amount} sand dollars. Changing the color is free.');
l('Pita', 'Works', 'Sarah picks a new mailbox', "Ooh! I'll put it up tonight. I'll deliver to it first thing tomorrow. I'll be so gentle with it.");
l('Pita', 'Not enough money', "Sarah can't afford the mailbox", 'That one\'s {amount}. Save up a little! I\'ll keep it in the pocket for you. Not literally. It wouldn\'t fit. Probably.');
l('Any neighbor', 'Works', "A neighbor notices Sarah's new mailbox", 'New mailbox! I walked past it and said "hello, mailbox." It didn\'t answer. It\'s very cool, though.');

/* the Post Office and the internet */
l('Pita', 'No internet', 'Sarah asks about the paper on a day the island was offline', "The news wire was all quiet this morning. No world news. But I wrote the island news myself! Pita's Pocket Edition. It's mostly about the weather. And you.");
l('Pita', 'Service down', 'Sarah asks about the paper on a day the news service was down', "The news service hasn't answered. I'll try again with tomorrow's edition. Today's island stories are ready.");

/* ============================================================== the Bank (Penny) */
sec('Bank', 'BANK');
l('Penny', 'Works', 'Sarah walks into the Bank (first time)', "Welcome to the Bank of {island}. I'm Penny. I'm a chocolate coin. The gold is foil. Please don't unwrap me. Now, how can I help your sand dollars grow?");
l('Penny', 'Works', 'Walking in, everyday', ['Good day! Every sand dollar counts. I count them. All of them.', "{name}! Your account and I have both missed you.", 'Welcome back. Please wipe your feet. Sand is our currency, but not on the carpet.'].join(' | '));
l('Penny', 'Works', 'Walking in on a hot day', "It's warm today. I'm keeping cool behind the counter. If I start to look shiny, it's the foil. It's definitely the foil.");
l('Penny', 'Works', "Penny's menu", 'What can the Bank do for you today?');
l('Sarah', 'Works', "Penny's menu: a choice", 'Savings');
l('Sarah', 'Works', "Penny's menu: a choice", 'Stocks');
l('Sarah', 'Works', "Penny's menu: a choice", 'House loan');
l('Sarah', 'Works', "Penny's menu: a choice", 'Savings goals');
l('Sarah', 'Works', "Penny's menu: a choice", 'My statement');
l('Sarah', 'Works', "Penny's menu: a choice", 'Safe deposit box');
l('Sarah', 'Works', "Penny's menu: a choice", 'Never mind');
l('Narration', 'Works', "The Bank door when it's closed", 'THE BANK OF {island}. Open {hours}. A sign: "Closed. Your money is asleep. Let it rest."');

/* savings */
l('On screen', 'Works', 'Savings: heading', 'Savings account');
l('On screen', 'Works', 'Savings: the balance', 'In savings: {balance} sand dollars');
l('On screen', 'Works', "Savings: this week's rate", "This week's interest: {rate}% a day, paid every morning");
l('On screen', 'Works', 'Savings: what Sarah earned', 'Interest earned so far: {amount} sand dollars');
l('Sarah', 'Works', 'Savings: a choice', 'Deposit');
l('Sarah', 'Works', 'Savings: a choice', 'Withdraw');
l('Penny', 'Works', 'Opening a savings account', 'A savings account! Wise. Very wise. Your money will sit here, safe and cozy, and every morning it gets a tiny bit bigger. Like bread dough. But money.');
l('Penny', 'Works', 'Deposit: done', '{amount} sand dollars, safely tucked in. Your balance is now {balance}. They\'re very happy here.');
l('Penny', 'Works', 'Deposit: a big one', 'Oh my. {amount}! I need to sit down. I am sitting down. I need to sit down more.');
l('Penny', 'Not enough money', 'Deposit: more than Sarah has', "You only have {amount} in your pocket. I can't deposit sand dollars that aren't there. Believe me, I've tried. With my own.");
l('Penny', 'Works', 'Withdraw: done', 'Here you are: {amount} sand dollars. Spend them well. Or spend them on something fun. Fun is a kind of well.');
l('Penny', 'Empty', 'Withdraw: savings are empty', 'Your savings are empty right now. Nothing to take out! Put a little in, and watch it grow.');
l('Penny', 'Not enough money', 'Withdraw: more than is saved', "You have {balance} saved. I can give you all of it, but not more. That would be a loan. Loans are a whole other counter.");
l('Narration', 'Works', 'The morning interest (a line in the mail or a toast)', 'The Bank paid {amount} sand dollars of interest overnight. Your savings: {balance}.');
l('Penny', 'Works', 'The weekly rate goes up (Monday)', "Good news! This week's interest is {rate}% a day. Up from last week. The sand dollars are feeling generous.");
l('Penny', 'Works', 'The weekly rate goes down (Monday)', "This week's interest is {rate}% a day. A little lower. Even money needs a nap sometimes.");
l('Penny', 'Works', 'Asked how interest works', 'Every morning, the Bank adds a little to whatever you have saved. The more you save, the more it adds. The rate changes every Monday. It\'s posted right here. In gold. Like me.');

/* stocks */
l('Penny', 'Works', 'Stocks: the first time', "These stocks follow company prices from the wider world. The prices can rise or fall. Let's see what your island portfolio looks like.");
l('Penny', 'Works', 'Stocks: a warning, the first time', "You use island sand dollars here. Prices come from the real market, but these shares stay inside the game. Their value can go down as well as up.");
l('On screen', 'Works', 'Stocks: heading', 'The market');
l('On screen', 'Works', 'Stocks: a stock in the list', '{stock} · {price} · {change} today');
l('On screen', 'Works', 'Stocks: your portfolio heading', 'Your portfolio');
l('On screen', 'Works', 'Stocks: a holding', '{shares} shares of {stock} · worth {amount} · {change} since you bought');
l('On screen', 'Works', 'Stocks: the graph buttons', ['1 week', '1 month', '1 year', 'Since you bought'].join(' | '));
l('On screen', 'Works', 'Stocks: under the graph', "Real market prices, converted to sand dollars and updated daily. Quotes may be up to a day old.");
l('Sarah', 'Works', 'Stocks: a choice', 'Buy');
l('Sarah', 'Works', 'Stocks: a choice', 'Sell');
l('Penny', 'Works', 'Buying shares', '{shares} shares of {stock}, at {price} each. That\'s {amount} sand dollars. Shall I?');
l('Penny', 'Works', 'Bought', "Done! You own a little piece of {stock} now. Tell your friends. Or don't. Some people are weird about it.");
l('Penny', 'Works', 'Sold at a gain', 'Sale complete. {amount} sand dollars. I\'ll enter that in the ledger. I do enjoy a number that needs extra room.');
l('Penny', 'Works', 'Sold at a loss', "Sold at a loss of {amount}. Unfortunate. I've recorded it in ordinary ink. No need to give it gold ink as well.");
l('Penny', 'Not enough money', "Buying more than Sarah can afford", "That's {amount}, and your pocket has {balance}. Try fewer shares, or come back after a good day of fishing.");
l('Penny', 'Empty', 'Selling a stock Sarah has none of', "You don't own any {stock} yet. I can only sell shares you have. A surprisingly important distinction in banking.");
l('Penny', 'Works', 'A dividend is paid', '{stock} paid a dividend! That\'s a little thank-you for owning it: {amount} sand dollars, added to your savings.');
l('Narration', 'Works', 'A dividend arrives (a line in the mail)', 'A letter from the Bank: {stock} paid you a dividend of {amount} sand dollars. It\'s in your savings.');
l('Penny', 'Works', 'The portfolio is up a lot', "Your portfolio is up {change}! You have a real knack for this. Or real luck. Luck is also a knack.");
l('Penny', 'Works', 'The portfolio is down a lot', "Your portfolio is down {change}. Here are the figures. I'll get the biscuit tin. It's the one without the lock.");
l('Penny', 'Market closed', 'Stocks: the market is closed (night)', "The market's closed for the night, dear. Prices are what they were at closing. You can still look! Buying and selling opens again at {when}.");
l('Penny', 'Market closed', 'Stocks: the market is closed (weekend)', "It's the weekend. The market's closed until Monday. Even money rests. Especially money.");
l('Penny', 'Market closed', 'Stocks: the market is closed (holiday)', 'The market is closed today for a holiday out in the big world. Here, too, everybody gets a day off.');
l('On screen', 'Market closed', 'Stocks: the closed banner', 'Market closed · Prices from {when} · Opens {opens}');
l('On screen', 'Loading', 'Stocks: while prices load', 'Getting the latest prices...');
l('Penny', 'Loading', 'Stocks: while prices load', 'One moment. I\'m reading the ticker. It\'s very long. It\'s mostly numbers. I love numbers.');
l('Penny', 'No internet', 'Stocks: no internet', "I can't get new market prices. Your last portfolio values are available, but trades will have to wait for a fresh quote.");
l('On screen', 'No internet', 'Stocks: no internet banner', "No internet connection: showing the last prices we have ({when}). Buying and selling are paused.");
l('Penny', 'Service down', "Stocks: the market data service isn't answering", "The market service is unavailable. Your holdings haven't changed. Trading will resume when prices are available again.");
l('On screen', 'Service down', "Stocks: the market data service isn't answering", "The market data service isn't answering. Showing the last prices we have ({when}). Trading is paused.");
l('On screen', 'Old data', 'Stocks: prices are more than a day old', 'Prices as of {when}. A new update hasn\'t arrived yet.');
l('On screen', 'Works', 'Stocks: the list of companies (placeholder until picked)', 'A selection of companies from the real market. Choose one to see its price history and your holdings.');
l('Kai', 'Works', 'A neighbor on stocks', 'I asked Penny if I could buy stock in waves. She said no. I said what about seaweed. She said no. I bought nothing. Peaceful.');
l('Maki', 'Works', 'A neighbor on stocks', 'I have a portfolio. It is very balanced. Each stock gets exactly the same amount. When one grows, I sell a tiny bit. Penny says I am "her favorite kind of difficult."');
l('Coco', 'Works', 'A neighbor on stocks', "I don't know anything about stocks. I know EVERYTHING about who owns which stocks. That's worth more, honestly.");
l('Chili', 'Works', 'A neighbor on stocks', 'I only buy hot stocks. Is that how it works? Penny says that\'s not how it works. I bought them anyway. They\'re very hot.');
l('Sully', 'Works', 'A neighbor on stocks', "I bought one share of somethin' in 1987. Still got it. Never checked. Don't tell me, kid. I like the mystery.");
l('Mac', 'Works', 'A neighbor on stocks', 'Penny told me to diversify. So now I make mac and cheese with three cheeses instead of two. That\'s what she meant, right?');

/* house loans */
l('Penny', 'Works', 'House loan: Ginger made the house bigger on a loan', "Ginger tells me your house is bigger! Congratulations. The Bank covered it: you owe {amount} sand dollars. No interest. Pay a little whenever you like. We trust you. Mostly the goat vouched.");
l('On screen', 'Works', 'House loan: heading', 'House loan');
l('On screen', 'Works', 'House loan: what\'s owed', 'Still owed: {amount} sand dollars ({count}% paid)');
l('Sarah', 'Works', 'House loan: a choice', 'Pay some');
l('Sarah', 'Works', 'House loan: a choice', 'Pay it all');
l('Penny', 'Works', 'House loan: a payment', '{amount} toward your house. Only {balance} left. Every room is a little more yours.');
l('Penny', 'Works', 'House loan: paid off', "That's it! Your house is paid off. Every nail, every board, every window. It's all yours. I'm going to stamp this. I love stamping. *stamp*");
l('Penny', 'Empty', 'House loan: nothing owed', "You don't owe the Bank anything! Your house is all yours. Want me to stamp something anyway? I'll find something.");
l('Penny', 'Not enough money', 'House loan: Sarah tries to pay more than she has', 'You have {amount} in your pocket. Pay what you can! There\'s no rush. The house isn\'t going anywhere. Unless Ginger moves it.');
l('Ginger', 'Works', 'Ginger, when Sarah can\'t afford a house upgrade (offering the loan)', 'Not quite enough? The Bank can cover it, and you pay Penny back bit by bit. No interest. She\'s a softie. Don\'t tell her I said that.');

/* savings goals */
l('Penny', 'Works', 'Savings goals: the first time', "Saving for something special? Tell me what, and how much, and I'll keep track. I'll keep a little chart. I love a little chart.");
l('On screen', 'Works', 'Savings goals: heading', 'Savings goals');
l('On screen', 'Works', 'Savings goals: a goal', '{goal} · {amount} of {total} ({count}%)');
l('On screen', 'Works', 'Savings goals: new goal button', 'New goal');
l('On screen', 'Works', 'Savings goals: the goal name box', 'What are you saving for?');
l('On screen', 'Empty', 'Savings goals: none yet', 'No goals yet. Add something you\'d like to save for, and an amount to aim toward.');
l('Penny', 'Works', 'A goal set', '{goal}! A fine thing to save for. I\'ve written it down. In gold ink. It\'s the only ink I have.');
l('Penny', 'Works', 'Halfway to a goal', "Halfway to your {goal}! Keep going! I'm not allowed to cheer in the Bank. *very quiet cheering*");
l('Penny', 'Works', 'A goal reached', 'You did it! You saved {total} for your {goal}! Go! Buy it! Run! Walk. No running in the Bank.');

/* statements */
l('On screen', 'Works', 'Statement: heading', 'Your statement');
l('On screen', 'Works', 'Statement: lines', ['Earned all time', 'Spent all time', 'Biggest day', 'Money from fishing', 'Money from selling', 'Money from the arcade', 'Interest and dividends', 'In savings', 'In stocks', 'Still owed on the house'].join(' | '));
l('On screen', 'Works', 'Statement: a chart', 'Where your sand dollars came from');
l('On screen', 'Works', 'Statement: a chart', 'Where your sand dollars went');
l('Penny', 'Works', 'Statement: opened', "Here's everything. Every sand dollar in, every sand dollar out. It's a beautiful story. Mostly about fish.");
l('Penny', 'Works', 'Statement: Sarah spends a lot on one thing', 'You\'ve spent {amount} on {item}. I\'ll leave that figure here for you. I was going to ask if you liked {item}, but the statement has answered.');

/* safety deposit box */
l('Penny', 'Works', 'Safety deposit box: first time', "Your very own safety deposit box. For the precious things. The things you'd never sell. They'll be safe here. I'll guard them with my life. And my foil.");
l('On screen', 'Works', 'Safety deposit box: heading', 'Safe deposit box');
l('On screen', 'Works', 'Safety deposit box: count', '{count} of {total} spaces used');
l('On screen', 'Empty', 'Safety deposit box: empty', 'Nothing in here yet. Keep keepsakes, photos and one-of-a-kind gifts safe here.');
l('Penny', 'Works', 'Putting something in the box', "The {item}. Safe and sound. I'll dust it on Tuesdays.");
l('Penny', 'Works', 'Taking something out', 'Here\'s your {item}. Take good care of it. It\'s been very well looked after.');
l('Penny', 'Empty', 'The box is full', "The box is full! Take something out first, or... I could find you a bigger box. For a little fee. {amount} sand dollars.");

/* the Bank and the internet */
l('Penny', 'No internet', "Sarah asks about savings on a day the island's offline", "Your savings are right here, safe. Savings don't need the internet. Only the stocks do. The stocks are needy.");

/* ============================================================== the Town Hall (the Cozy Council) */
sec('Town Hall', 'TH');
l('Sir Floret', 'Works', 'Sarah walks into the Town Hall (first time)', "Welcome to the Town Hall! The Cozy Council has moved in. We needed a bigger room. For our ambitions. And Little Sprout's naps.");
l('Dame Stalk', 'Works', 'Walking in (first time)', 'The Town Hall is where the island keeps its records, its rules and its flag. Also its lost umbrellas. Mostly its lost umbrellas.');
l('Little Sprout', 'Works', 'Walking in (first time)', "HI! This is my desk! It's the little one! I stamp things! Do you have anything that needs stamping?");
l('Sir Floret', 'Works', 'Walking in, everyday', ['The Council recognizes {name}! Please, approach the bench.', 'Ah, our most distinguished resident. What business brings you before the Council?', 'Order, order! Oh, it\'s you. Disorder, then. You are always welcome.'].join(' | '));
l('Sir Floret', 'Works', 'The Town Hall menu', 'How may the Council serve the island today?');
l('Sarah', 'Works', 'Town Hall menu: a choice', 'My zip code');
l('Sarah', 'Works', 'Town Hall menu: a choice', 'The island flag');
l('Sarah', 'Works', 'Town Hall menu: a choice', 'Ordinances');
l('Sarah', 'Works', 'Town Hall menu: a choice', 'Census');
l('Sarah', 'Works', 'Town Hall menu: a choice', 'Island history');
l('Sarah', 'Works', 'Town Hall menu: a choice', 'Records and stats');
l('Sarah', 'Works', 'Town Hall menu: a choice', 'Rename a place');
l('Sarah', 'Works', 'Town Hall menu: a choice', 'Residents');
l('Sarah', 'Works', 'Town Hall menu: a choice', 'A missed holiday');
l('Sarah', 'Works', 'Town Hall menu: a choice', 'Island jobs');
l('Sarah', 'Works', 'Town Hall menu: a choice', 'Island backups');
l('Sarah', 'Works', 'Town Hall menu: a choice', 'Just visiting');
l('Narration', 'Works', "The Town Hall door when it's closed", 'TOWN HALL. Open {hours}. A note: "The Council is in recess. The Council is asleep. Please knock softly. Little Sprout is a light sleeper."');

/* the flag */
l('Sir Floret', 'Works', 'The flag: the first time', "Every great island needs a flag! Ours is currently a napkin. A very nice napkin. But a napkin. Will you design something worthy?");
l('On screen', 'Works', 'Flag designer: heading', 'Design the island flag');
l('On screen', 'Works', 'Flag designer: the tools', ['Pencil', 'Fill', 'Eraser', 'Mirror', 'Undo', 'Clear'].join(' | '));
l('On screen', 'Works', 'Flag designer: the buttons', ['Raise it!', 'Keep drawing', 'Start over'].join(' | '));
l('Little Sprout', 'Works', 'The flag: Sarah raises a new one', "IT'S GOING UP! IT'S GOING UP! Everyone salute! I can't salute. I'm going to wiggle. That's my salute.");
l('Sir Floret', 'Works', 'The flag: raised', 'Magnificent. It flies over the Town Hall, the pier and the lighthouse. The island has never looked more like itself.');
l('Dame Stalk', 'Works', 'The flag: Sarah tries to raise an empty flag', 'That flag is blank. I admire a concise design, but this has gone too far. Please draw something before we raise it.');
l('Any neighbor', 'Works', 'A neighbor notices the new flag', "New flag! I saw it from the beach! I stood up and put my hand on my heart. I don't know where my heart is. I put it somewhere.");
l('Joe', 'Works', 'Joe notices the new flag', "Wrote a flag poem. 'Flag. Flag. Flag.' The fourth line needs work. Possibly another flag.");
l('Clementine', 'Works', 'Clementine notices the new flag', 'The new flag. Hm. Bold. I would have done it in orange. Everything is better in orange. But I respect it.');

/* ordinances */
l('Dame Stalk', 'Works', 'Ordinances: the first time', 'An ordinance changes the island\'s routine. We can keep one active at a time. There\'s a fee to change it and a week between changes.');
l('On screen', 'Works', 'Ordinances: heading', 'Island ordinance');
l('On screen', 'Works', 'Ordinance: Early Bird', 'Early Bird · Shops open and neighbors wake up earlier.');
l('On screen', 'Works', 'Ordinance: Night Owl', 'Night Owl · Shops stay open later and neighbors stay up later.');
l('On screen', 'Works', 'Ordinance: Community Spirit', 'Community Spirit · Neighbors chat, visit and go on outings more.');
l('On screen', 'Works', 'Ordinance: Nature Conservation', 'Nature Conservation · More wildlife, trees grow faster, and neighbors plant flowers where there aren\'t enough.');
l('On screen', 'Works', 'Ordinance: none', 'No ordinance · The island as it is.');
l('On screen', 'Works', 'Ordinances: the price', 'Enacting an ordinance costs {amount} sand dollars. It starts tomorrow morning.');
l('Sir Floret', 'Works', 'Early Bird enacted', "Early Bird it is! From tomorrow, the island rises with the sun. Cuke has already cried twice. Happy tears.");
l('Sir Floret', 'Works', 'Night Owl enacted', 'Night Owl it is! From tomorrow, the island stays up late. DJ Wasabi has requested a moment of silence. Then an air horn.');
l('Sir Floret', 'Works', 'Community Spirit enacted', 'Community Spirit it is! From tomorrow, everyone will be much more... around. Coco is thrilled. Maki is preparing.');
l('Sir Floret', 'Works', 'Nature Conservation enacted', 'Nature Conservation it is! From tomorrow, the island grows greener. The Council, being vegetables, abstained from the vote. We were moved.');
l('Dame Stalk', 'Works', 'Ordinances: changed too soon', 'You changed the ordinance {days} days ago. The paperwork is still drying. Come back in {count} days.');
l('Dame Stalk', 'Not enough money', "Ordinances: Sarah can't pay the fee", 'The fee is {amount} sand dollars. The Council does not accept IOUs. Little Sprout accepts IOUs. Little Sprout is not in charge.');
l('Cuke', 'Works', 'Cuke when Early Bird is on', 'EARLY BIRD! The best ordinance! I\'ve been an early bird my whole life! Now EVERYBODY is! Nobody is happy about it! I\'M happy about it!');
l('DJ Wasabi', 'Works', 'DJ Wasabi when Night Owl is on', 'NIGHT OWL, BABY! The club stays open till the sun complains! Spicy hours all night!');
l('Coco', 'Works', 'Coco when Community Spirit is on', 'Everyone is out and talking all day now. I can barely keep up. I\'ve never been happier. I need a bigger notebook.');
l('Basil', 'Works', 'Basil when Nature Conservation is on', 'I planted basil by the cart. Nature Conservation said I should. The basil is doing great. That\'s my cousin.');
l('Maki', 'Works', 'Maki when Early Bird is on', 'Earlier hours. I\'ve adjusted the schedule. Moving everything on paper was considerably easier than moving myself.');

/* census */
l('Dame Stalk', 'Works', 'Census: opened', 'The census. Every resident, counted and noted. I counted them myself. Some of them twice, because they moved.');
l('On screen', 'Works', 'Census: heading', 'Island census · {count} residents');
l('On screen', 'Works', 'Census: a resident card', ['Birthday', 'Moved in', 'Personality', 'Favorite thing', 'Friendship', 'Lives', 'Works at', 'Usually up', 'Usually in bed'].join(' | '));
l('On screen', 'Works', 'Census: the goat', 'The goat · Birthday: unknown · Personality: goat · Favorite thing: everything, eaten');
l('Little Sprout', 'Works', 'Census: Sarah looks at her own card', "That's YOU! You're in the census! Do you want to see your card? It has a gold star. I put the gold star on. I put a gold star on everybody's. Don't tell.");

/* history, records, stats, achievements */
l('Dame Stalk', 'Works', 'History: opened', 'The island\'s history. Every milestone, in order. I write in it every day. Some days I just write "nice weather." Those are good days.');
l('On screen', 'Works', 'History: heading', 'Island history');
l('On screen', 'Works', 'History: entries', ['{name} arrives on the island', '{who} moves in', 'The first fish', 'The house gets bigger', 'The museum opens a new wing', 'The lighthouse shines again', 'The back room opens', 'The first holiday', 'The flag is raised', 'A year on the island'].join(' | '));
l('On screen', 'Empty', 'History: just started', 'The island\'s story is just beginning.');
l('On screen', 'Works', 'Records: heading', 'Island records');
l('On screen', 'Works', 'Records: lines', ['Biggest fish', 'Best day (sand dollars)', 'Most fish in a day', 'Longest friendship', 'Highest arcade score', 'Most hugs in a day', 'Best cooking medal streak', 'Most poems heard'].join(' | '));
l('On screen', 'Works', 'Stats: heading', 'Island statistics');
l('On screen', 'Works', 'Stats: lines', ['Days played', 'Hours on the island', 'Fish caught', 'Fruit picked', 'Dishes cooked', 'Paintings painted', 'Pottery made', 'Sand dollars earned', 'Hugs given', 'Letters sent'].join(' | '));
l('On screen', 'Works', 'Achievements: heading', 'Town achievements');
l('On screen', 'Works', 'Achievements: a locked one', 'Not yet. Keep going!');
l('Sir Floret', 'Works', 'Achievements: one earned (the Council presents a reward)', 'The Council hereby recognizes this achievement: {item}! Please accept this commemorative {reward}. Display it with pride. Or with a lamp. Lamps are pride.');
l('Little Sprout', 'Works', 'Achievements: one earned', "YOU DID IT! I knew you would! I didn't know what it was, but I knew you would!");

/* rename landmarks */
l('Dame Stalk', 'Works', 'Rename a place: opened', 'You may rename the island\'s landmarks. The beaches, the mountain, the forest, the falls. Names matter. Choose ones you\'ll be happy to say every day.');
l('On screen', 'Works', 'Rename a place: heading', 'Rename a place');
l('On screen', 'Works', 'Rename a place: the name box', 'New name for {landmark}');
l('Sir Floret', 'Works', 'Rename a place: done', 'Hear ye! {landmark} shall henceforth be known as {newname}! The maps will be updated. Little Sprout will update the maps. With crayons.');
l('Dame Stalk', 'Bad name', 'Rename a place: the name is empty or too long', 'A name needs at least one letter and at most twenty. I don\'t make the rules. I did make that rule.');
l('Any neighbor', 'Works', 'A neighbor uses a renamed place\'s new name', "I was at {newname} this morning! I still call it {landmark} in my head. I'll get there. It's a nice name.");

/* residents (catchphrases, clothes, schedules) */
l('Dame Stalk', 'Works', 'Residents: opened', 'Here you may help a resident with a new catchphrase, a change of clothes or a new schedule. With their permission. They will be asked. Politely.');
l('On screen', 'Works', 'Residents: heading', 'Residents');
l('On screen', 'Works', 'Residents: choices', ['New catchphrase', 'Change clothes', 'Back to their usual clothes', 'Schedule'].join(' | '));
l('On screen', 'Works', 'Residents: schedule options', ['Wakes up', 'Goes home', 'Favorite spot'].join(' | '));
l('On screen', 'Works', 'Residents: needs friendship', 'They need to be good friends with you first (three hearts).');
l('Any neighbor', 'Works', 'A neighbor agrees to a new catchphrase', '"{newname}"? I love it! I\'m going to say it all the time. {newname}! See? Already did.');
l('Maki', 'Works', 'Maki agrees to a new schedule', 'A new schedule. Very well. I have printed it. I have laminated it. I have laminated the lamination.');
l('Kai', 'Works', 'Kai agrees to new clothes', 'New fit? Dude. Nice! I should stand up straighter. ...Whoa. There\'s a lot of outfit when I do that.');
l('Any neighbor', 'Works', 'A neighbor declines (not close enough yet)', "Hmm, I'd rather not yet. Let's be better friends first! Then you can pick my clothes. Probably. Maybe not my socks.");

/* missed holidays */
l('Sir Floret', 'Works', 'A missed holiday: offered (Sarah missed a big holiday within the last week)', 'The Council noticed you missed {holiday}! Fear not. By special decree, the island can celebrate it today instead. Shall we?');
l('Sarah', 'Works', 'A missed holiday: a choice', 'Celebrate today!');
l('Sarah', 'Works', 'A missed holiday: a choice', 'Maybe tomorrow');
l('Sir Floret', 'Works', 'A missed holiday: celebrated', 'So decreed! Today is {holiday}! Little Sprout, ring the bell!');
l('Little Sprout', 'Works', 'A missed holiday: celebrated', "*ding ding ding* IT'S {holiday}! AGAIN! FOR THE FIRST TIME!");
l('Any neighbor', 'Works', 'A neighbor on a rescheduled holiday', "{holiday}, today? The Council said so! I already had mine but I'm having it again. Twice the fun!");
l('Dame Stalk', 'Works', 'A missed holiday: "Maybe tomorrow"', 'Very well. The offer stands for {days} more days. After that, the holiday goes back to the calendar where it lives.');
l('Dame Stalk', 'Expired', 'A missed holiday: more than a week ago', "{holiday} was more than a week ago. We can't move it now. It'll return next year. I admire its punctuality.");
l('Dame Stalk', 'Not today', 'A missed holiday: today is already another holiday', "Today's already {other}. One celebration at a time. The decorations cupboard requires it.");
l('On screen', 'Works', 'The island board: a rescheduled holiday', "Today: {holiday}, rescheduled for {name} by the Town Hall.");
l('On screen', 'Empty', 'A missed holiday: none missed', 'No missed holidays. You were here for all of them!');

/* the monthly anniversary */
l('Sir Floret', 'Works', 'The island\'s monthly anniversary (the day of the month Sarah arrived)', 'Today marks {count} months since {name} came to {island}! The Council declares it Island Day. There will be cake. Cece is making the cake. Cece is apologizing to the cake.');
l('Any neighbor', 'Works', 'A neighbor on the monthly anniversary', "It's been {count} months since you got here! Happy island-versary! Is that a word? It's a word today.");
l('Joe', 'Works', 'Joe on the monthly anniversary', "{count} months! I wrote you a poem for every month. They're short. They're mostly about the boat you came in on. It's a good boat.");

/* island jobs (civic jobs: a little work for a few sand dollars) */
l('Dame Stalk', 'Works', 'Island jobs: opened', 'The island has odd jobs, for residents who want to help. Sorting mail with Pita, counting coins with Penny, tidying the Town Hall. Small work. Small pay. Large gratitude.');
l('On screen', 'Works', 'Island jobs: heading', 'Island jobs');
l('On screen', 'Works', 'Island jobs: the list', ['Sort the mail (Post Office, mornings)', 'Deliver a sack of letters (Post Office)', 'Count the coins (Bank, afternoons)', 'Tidy the Town Hall (evenings)', 'Raise the flag (Town Hall, at sunrise)', "Read the news to the goat (it's a job)"].join(' | '));
l('On screen', 'Works', 'Island jobs: the pay', 'Pays {amount} sand dollars · about {count} minutes');
l('On screen', 'Empty', 'Island jobs: all done today', 'No more jobs today. Come back tomorrow!');
l('Pita', 'Works', 'Job: sorting mail starts', 'You\'re helping! Okay. Letters go in the cubbies by name. Packages on the shelf. Anything that smells like cheese goes to Mac.');
l('Pita', 'Works', 'Job: sorting mail done', 'All sorted! Faster than me! Don\'t tell anyone. Here: {amount} sand dollars. And a stamp. I give everyone a stamp.');
l('Penny', 'Works', 'Job: counting coins starts', 'Coins in piles of ten, please. I\'ll check afterward. Checking twice is one of the few hobbies I can do at work.');
l('Penny', 'Works', 'Job: counting coins done', 'Every pile exactly ten. You have a banker\'s heart. Here\'s {amount} for your trouble.');
l('Little Sprout', 'Works', 'Job: tidying the Town Hall done', "It's so clean! I can see my reflection in the floor! I'm SO green! Thank you! Here's {amount} sand dollars from the Council's jar!");
l('Narration', 'Works', 'Job: reading the news to the goat', 'Sarah reads the goat the front page. The goat eats the sports section. It seems informed.');

/* backups (save management) */
l('Dame Stalk', 'Works', 'Backups: opened', 'An automatic island backup is made every hour while you play, and several days are kept. Choose a copy here if you need to restore one.');
l('On screen', 'Works', 'Backups: heading', 'Island backups');
l('On screen', 'Works', 'Backups: a backup in the list', '{when} · day {count} · {amount} sand dollars');
l('On screen', 'Works', 'Backups: buttons', ['Make a backup now', 'Go back to this one'].join(' | '));
l('Dame Stalk', 'Works', 'Backups: made one', 'A copy, made and filed. Labeled with today\'s date. Lovely.');
l('Dame Stalk', 'Works', 'Backups: asking before going back', 'Restore the island to {when}? All progress since then will be undone. A copy of the current island will be kept first.');
l('Dame Stalk', 'Works', 'Backups: went back', 'Restored to {when}. Everything since then has been undone. I have filed the paperwork under \'Did Not Happen.\'');
l('On screen', 'Loading', 'Backups: loading the list', 'Fetching the backups...');
l('Dame Stalk', 'No internet', 'Backups: no internet', 'I can\'t reach the backup server. Your current island is still saved on this device. Please try again when you\'re online.');
l('On screen', 'No internet', 'Backups: no internet', "Can't reach the island server. Backups need a connection.");
l('Dame Stalk', 'Service down', 'Backups: the server had a problem', 'The backup service couldn\'t finish the request. Nothing has changed. Please try again in a minute.');
l('On screen', 'Service down', 'Backups: the server had a problem', 'Something went wrong on the island server. Nothing was changed. Try again in a minute.');
l('Dame Stalk', 'Not allowed', 'Backups: a visitor (not Sarah) tries it', 'Only {island}\'s own resident can roll the island back. Visitors are very welcome. Visitors do not get the big lever.');

/* the Town Hall and the internet */
l('Dame Stalk', 'No internet', 'Town Hall: anything that needs the outside world, offline', 'The outside services aren\'t answering. You can continue on the island; news, weather updates, and market prices will have to wait.');

/* ============================================================== neighbors about the new buildings */
sec('Around the new buildings', 'AROUND');
l('Any neighbor', 'Works', 'A neighbor, after the Post Office opens', 'The Post Office is open! I sent a letter to myself just to see. It came the next morning. I was so surprised. I knew it was coming.');
l('Any neighbor', 'Works', 'A neighbor, after the Bank opens', 'The Bank is open! Penny gave me a lollipop. It was a coin. It was chocolate. It was a very confusing lollipop.');
l('Any neighbor', 'Works', 'A neighbor, after the Town Hall opens', 'The Council has a real hall now! Sir Floret gave a speech on the steps. It was forty minutes. It was about lamps.');
l('Maki', 'Works', 'Maki on the Post Office', 'Pita and I have an understanding. I bring my letters pre-sorted. Pita cries a little. Good tears.');
l('Kai', 'Works', 'Kai on the Bank', 'Penny said I should save for a rainy day. Bro, rainy days are the BEST days. Waves are huge. I spent it all on wax.');
l('Basil', 'Works', 'Basil on the Town Hall', 'The Council asked me to cater their meetings. They only eat... no, I won\'t say it. They\'re broccoli. I serve noodles. We have an arrangement.');
l('Wonton', 'Works', 'Wonton on the Post Office', 'Pita delivers to the hot spring. In a little waterproof bag. On a little stick. It\'s the best service I\'ve ever had.');
l('Chili', 'Works', 'Chili on the Bank', "Penny won't let me stand near the vault. Something about 'the chocolate.' I'm not THAT hot. I'm pretty hot.");
l('Coco', 'Works', 'Coco on the Post Office', "I asked Pita if any interesting letters came today. Pita handed me a blank sheet and said, 'Write one.' Not what I meant. Quite good advice, annoyingly.");
l('Cece', 'Works', 'Cece on the Bank', "I opened a savings account and then I apologized to Penny for taking up her time. She said that's what she's there for. Then I apologized for apologizing.");
l('Clementine', 'Works', 'Clementine on the Town Hall', 'I offered to redesign the Council\'s robes. They said they don\'t wear robes. I said exactly. They\'re thinking about it.');
l('Cuke', 'Works', 'Cuke on the Post Office', "I asked Pita if I could jog the mail route with them! They said yes! Pita is VERY slow! I jogged in circles around Pita! It was the best morning!");
l('Sully', 'Works', 'Sully on the Town Hall', "The Town Hall used to be a fish market. Before that, a fish market. Before that, a different fish market. Good to see it doin' somethin' new, kid.");
l('Ginger', 'Works', 'Ginger on the new buildings', "I fixed up all three. The Post Office had a leak. The Bank had a squeak. The Town Hall had a goat. The goat's gone. Mostly.");
l('Brulee', 'Works', 'Brulee on the Town Hall', 'The Council has asked me to hang a portrait of them in the hall. All three. Together. Very serious. I painted them smiling. They have not noticed.');
l('Mac', 'Works', 'Mac on the Bank', 'Penny came for lunch. She ordered something cold. She always orders something cold. I made her a cheese plate. She looked so relieved.');
l('Joe', 'Works', 'Joe on the Post Office', "I write you a letter every day now. Pita says I'm their best customer. Pita also says please, a smaller envelope.");
l('David', 'Works', 'David on the Bank', "Honey, I opened an account. I deposited one sand dollar and a selfie. Penny kept the selfie. In the vault. As she should.");
l('Fortune', 'Works', 'Fortune on the Bank', "Penny and I go way back. We're both cookies, kind of. She's a coin. I'm a cookie. We don't talk about who's more valuable. (It's me.)");
l('The goat', 'Works', 'The goat at the Post Office', 'The goat is standing very close to the mail sack. Pita is standing very close to the goat. Nobody is blinking.');

export const NEW_LINES = L;
