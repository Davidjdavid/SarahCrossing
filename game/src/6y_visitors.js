/* ---- 6y_visitors.js ---- */
/* What the neighbors say to Sarah's visitors (David, James, John and Joe, when one of them is playing): their own
   hellos, chats and first meetings, and news about what Sarah's been up to, read from her island. Lines can use
   {who} (the visitor), {island}, {time}. A pool is { david: [...], james: [...], john: [...], joe: [...], any: [...] };
   the visitor's own lines come up twice as often as the "any" ones. Sarah's own conversations are in 50_talk.js. */
const VISIT_TALK = {
    maki: {
        meet: { any: ["Oh. A new face. Hello. I'm Maki. I've been rolled very tightly. You must be one of Sarah's.", 'Please keep your shoes on the path. The grass has a system.'],
            david: ["Oh. You're David. Sarah said you'd arrive 'with energy.' I see she was being precise.", "I'm Maki. Please don't skate on the rice paper. Or near me. Or at me."],
            james: ["Hello. I'm Maki. You must be James. Sarah said you'd ask where to tee off. Please don't.", 'The beach is not a fairway. I have measured.'],
            john: ["Hello. Maki. You're John, the lawyer. Good. I have questions about the noise ordinance.", 'Specifically Chili. Specifically after 10 PM.'] },
        hi: { any: ['Hello, {who}. You are standing at an excellent angle today.', 'Good {part}. I have already alphabetized my morning.'],
            david: ['David. Your shoelaces are uneven. I noticed. I will survive.', "You're very sparkly today. I'm adjusting."],
            james: ['James. You walk at a very consistent pace. I respect that.', 'Mr. Manager. Have you managed anything today? I have managed my rice.'],
            john: ["John. You're the only person here who reads the fine print. I feel seen.", 'Counselor. Good {part}.'],
            joe: ['Joe. Your poem about the pond had perfect meter. I checked. Twice.', "Joe. You're early. Or late. I can never tell with poets."] },
        chat: { any: ["Sarah once helped me fold four hundred napkins. Perfect corners. She's my kind of person.", 'I like visitors. They make the island tidier by comparison.', 'Soy sauce is a lifestyle. Too much is also a lifestyle. A worse one.'],
            david: ['Is it true you skated the whole Boardwalk without stopping? I timed it. In my head. It was very fast.', 'You skate everywhere. Do your ankles have opinions about that?'],
            james: ['Golf is just very precise walking. I could get into golf. Quietly.', 'I asked Kai about your golf ball. He said it was "a gift from the sea."'],
            john: ["If I were to, hypothetically, sue the wind for messing up my rice, would I win? ...I didn't think so.", 'I organized my documents by grain size. Like rice. Is that legal?'],
            joe: ['Your handwriting is very... free. I like it more than I should.', 'Write me a poem with exactly fourteen lines, please. Not thirteen. I will count.'] },
    },
    kai: {
        meet: { any: ["Whoa, a new bro! Or bro-ette! Or bro-person! I'm Kai. Poke bowl. Toppings and good vibes.", "You're one of Sarah's? Sarah is the BEST. She caught a moonfish once. I screamed."],
            david: ["DAVID?! Sarah's brother? The roller disco guy? Dude! Can you skate on the boardwalk? Show me!", "I'm Kai. Poke bowl. I'm not a good skater. I'm a good watcher of skaters."],
            james: ["James! Whoa, I caught your golf ball off the pier once! With my toppings! I still have it!", "Is it a good luck ball? I've been treating it like a good luck ball."],
            john: ['Dude, a real lawyer! Can you get me out of a parking ticket? I don\'t have a car. Hypothetically.', "I'm Kai. Poke bowl. Mostly toppings, legally speaking."] },
        hi: { any: ['Aloha, {who}! Well. Bowl-oha.', 'The surf is mellow today. Like me. Mellow bowl.'],
            david: ['David! Rainbow trail! I saw it from the water!', "Bro, your jacket is SO pink. I'm into it."],
            james: ["James! Fore! ...That's how you say hi in golf, right?", 'Mr. Manager! Manage me a wave, bro.'],
            john: ['Counselor! Objection! ...To bad vibes. Sustained, right?', 'John! You brought a briefcase to the beach again. Iconic.'],
            joe: ["Joe! Poet bro! Write me a poem about tuna. Not about eating it. Just tuna, living.", 'Yo Joe. The sunset tonight is gonna be poem-level.'] },
        chat: { any: ['The moonfish only come out super late. After 10 PM. Night owl fish.', "I'm like 40% tuna, 40% vibes, 20% sesame. Maki says that's not a recipe.", 'Sarah fishes better than me. I said it. Out loud. It hurt.'],
            david: ['Could you teach me to roller skate? I have a lot of balance. In the water. Out of it, unclear.', "Is the club open tonight? I'm a terrible dancer. I'm a VERY enthusiastic terrible dancer."],
            james: ['Have you ever tried golf with a surfboard? ...No? Me neither. Yet.', "You have very manager energy. I mean that as the nicest thing."],
            john: ['Is it illegal to be this relaxed? Asking for me.', 'If a fish bites my toe, can I press charges? Against the ocean?'],
            joe: ['Your sock poem made me cry, bro. Good cry. Salty cry. Ocean cry.', 'You and Sarah should come fishing at sunset. Super romantic. I mean, super scenic.'] },
    },
    basil: {
        meet: { any: ["Hello. I'm Basil. Pad thai. You're visiting? Then you're hungry. That's science.", 'The noodle cart opens at 8 PM. I save a bowl for guests.'],
            david: ['David! Sarah said you like things spicy. Thai spicy or club spicy?', "I'm Basil. Pad thai. My noodles are wavy, like your hair. Respectfully."],
            james: ['You must be James. You look like a man who eats lunch at exactly noon.', "I'm Basil. Pad thai. Come by the cart. I'll manage your hunger, Mr. Manager."],
            john: ['John. I have a contract question. If someone says "no peanuts," is that binding? Asking about Cece.', "I'm Basil. Pad thai. Peanut-optional, legally."] },
        hi: { any: ['Hey, {who}. Hungry? You look hungry. Everyone looks hungry at {time}.', 'A squeeze of lime fixes most things. Not taxes. Most things.'],
            david: ['David. Second dinner tonight? You seem like a second dinner person.', "Your sparkle is very balanced. Salty, sweet, a little loud. Like a good sauce."],
            james: ["James. Eat something green today. That's management advice.", 'Mr. Manager. Lunch at noon, like always?'],
            john: ["Counselor. The cart's open tonight. No fine print, just noodles.", "John. You work too hard. Sit. Eat. That's an order. Not a legal one."],
            joe: ["Joe! Your usual? Extra lime, no judgment.", "Joe. You wrote a haiku on my menu board again. It's staying."] },
        chat: { any: ["Sarah ate Thai spicy without water. I've never respected anyone more.", 'My noodles are wavy because I\'m relaxed. Maki\'s rice is tight because he\'s Maki.'],
            david: ['Is it true you ran a roller disco? Did it have a snack bar? Asking professionally.'],
            james: ['Can you manage the noodle line on Saturdays? It gets wild. Cuke cuts.'],
            john: ['Is it legal to call it "the best pad thai on the island" if it\'s the only one? Asking for my sign.'],
            joe: ['Write me a poem for the cart. Short. Like, fits-on-a-napkin short.'] },
    },
    wonton: {
        meet: { any: ["Oh! Hi! I'm Wonton. Welcome to my hot spring. It is a SPRING. It is NOT soup.", 'You can sit by the edge. Please do not bring broth.'],
            david: ["David! Sarah's brother! You're very shiny. Please don't bring glitter into the spring. It never comes out.", 'It is a spa. It is not soup. Please tell your friends.'],
            james: ['James! Hi! Sarah said you golf. Please do not putt into the spring. It happened once. Not you. Ginger.', 'I am Wonton. I am warm. Spa warm, not soup warm.'],
            john: ['A lawyer! Can you make it official? That the spring is a spring? I want a certificate.', 'I am Wonton. Not soup. Legally, I hope.'] },
        hi: { any: ['Hi, {who}! The water is 104 degrees. Relaxing, not cooking.', 'Welcome back! Towels are on the rock. The rock is also warm.'],
            david: ['David! Sit by the spring! Just by it! Your outfit is too fancy to get wet.', 'Hi David! You smell like the club. And confidence.'],
            james: ['James! Relax! Your shoulders are very managed today.', 'Hi James! No golf balls in the spring, okay? Promise?'],
            john: ['John! Did you write the certificate? The NOT soup one?', 'Hi John! You look stressed. The spring fixes that. Not soup fixes that.'],
            joe: ['Joe! Read me a poem by the spring! The acoustics are very steamy.', "Joe! You're the only one who never says 'soup.' Thank you."] },
        chat: { any: ['Basil says "soup" sometimes. By accident. I still flinch.', 'Sarah sits by the spring when she needs to think. I give her the good rock.', 'Please do not bring green onions near me. I have trust issues.'],
            david: ['Do you think the spring needs disco lights? Just a few? For ambience?'],
            james: ['If you managed a spa, would you manage mine? I need help with Cuke. He jogs through.'],
            john: ['If someone calls me soup in writing, is that libel? I think it is.'],
            joe: ['You wrote "Ode to a Dumpling." I cried. Into the spring. Please don\'t tell anyone.'] },
    },
    chili: {
        meet: { any: ["Oh, you like spicy? That's cute. Everyone says that. I'm Chili. I AM spicy.", "Don't mind the blushing. Pepper. Always like this."],
            david: ["David, right? The one with the sunglasses. I've got sunglasses too. In my heart. They're very dark.", "I run the arcade's prize counter. Beat my high score and maybe I'll stop blushing. (I won't.)"],
            james: ['James. The golfer. I bet you think you can beat me at the arcade. Cute.', "I'm Chili. I'm spicy. I'm also VERY good at Fruit Catch."],
            john: ['A lawyer, huh? Everything I said at the arcade last week was a joke. Allegedly.', "I'm Chili. Spicy. Not liable."] },
        hi: { any: ['Hey, {who}. Ready to lose at the arcade?', 'Mornings are for people who hate themselves. So, Cuke.'],
            david: ["David. Club tonight? I'll out-dance you. I'm a pepper. We have moves.", "Nice jacket. It's almost as red as me. Almost."],
            james: ['James. Fore yourself. I mean, brace yourself. Arcade. Now.', "Mr. Manager. Manage THIS high score."],
            john: ['Counselor. I plead spicy.', "John. You look like you've never had a jalapeño. Let's fix that."],
            joe: ["Joe. Write me a poem about how spicy I am. It better rhyme with 'scorching.'", "Joe! The arcade misses you. Your Snack Stack score is very sad."] },
        chat: { any: ["Sarah ate Thai spicy without water. I'm still recovering.", "Scoville units aren't a scale. They're a lifestyle."],
            david: ['If you skate past the arcade one more time without coming in, I take it personally.'],
            james: ["Golf is just slow arcade. Fight me. Respectfully."],
            john: ["If I win the claw machine every time, is that a monopoly? Don't answer."],
            joe: ['Your Valentine poem for Sarah was so sweet my peppers went mild. Disgusting. I loved it.'] },
    },
    coco: {
        meet: { any: ["Oh my GOD. Hi. You're new. I'm Coco. I'm who everyone talks TO.", "Tell me everything. Start with how you know Sarah. Then everything else."],
            david: ["DAVID. Oh my god. Sarah's brother. The icon. The roller skates. I have so many questions. Sit.", "First question: is the finger-pointing pose real? Second question: who did your highlights?"],
            james: ["You're James! Mr. Manager! Sarah says you're the responsible one. Prove it. Tell me a secret.", "I'm Coco. Truffle. Chocolate. Information."],
            john: ["The lawyer! Okay, hypothetically, if someone told everyone about Sarah and Joe holding hands, that's not illegal, right?", "I'm Coco. Asking for a friend. The friend is me."] },
        hi: { any: ['{who}! Finally. Gossip. Go.', "Okay, I have news. You didn't hear it from me. You did, though."],
            david: ["David! Your outfit today? Iconic. Who else is talking about it? Everyone. Me.", "David! I need your opinion on Clementine's sunglasses. Too much? Not enough?"],
            james: ["James! Tell me who you're managing these days. Names, please.", "Mr. Manager! Manage this: I know something about Kai."],
            john: ["John! I've been very good. Legally. Mostly.", "Counselor. I have a hypothetical. It's about Basil and Mac."],
            joe: ["Joe. Joe. JOE. Is it true you wrote Sarah a poem with forty stanzas? Don't answer. I know.", "Joe! Read me the frog poem. The one about the log. Again."] },
        chat: { any: ["Sarah is the main character of this island. I'm the narrator.", "Cece cried at a cheesecake yesterday. It wasn't even hers. We love her.", "Kai likes someone. I won't say who. It's me. It's probably me."],
            david: ["Teach me to roller skate. I'll fall. I'll make it look intentional."],
            james: ["You and Sarah used to fight over the remote? Tell me who won. It was Sarah, right?"],
            john: ["Is gossip protected speech? Asking because I've been very protected."],
            joe: ["When are you and Sarah moving in together? I'm asking for the whole island. We have a group chat."] },
    },
    cece: {
        meet: { any: ["Hi! Sorry! Hi! I'm Cece. Is my top cracked? Don't answer.", 'I baked something for new people. It might be a little cracked. Like me. Sorry!'],
            david: ["Oh! David! You're so confident! I'm... cheesecake. Hi. Sorry. Hi.", "Sarah said you like sparkly things. I have sprinkles. Is that close?"],
            james: ['James! You seem so calm. How? Teach me. No, don\'t, I\'ll get nervous.', "I'm Cece. I bake when I'm nervous. You'll get a lot of cake."],
            john: ["A lawyer! Oh no. Am I in trouble? I'm sorry. For whatever it was.", "I'm Cece. I didn't do it. Whatever it is. Sorry!"] },
        hi: { any: ['{who}! Hi! Sorry, you startled me. I startle easily. Hi!', 'I made fourteen cheesecakes. Do you want one? Please take one.'],
            david: ["David! You look amazing. I'm going to bake about it.", "Hi David! Is my top cracked? You'd tell me. You're honest. Oh no."],
            james: ['James! You always say good morning at the right volume. Thank you.', "Hi James! I won't crack today. That's my goal. Manage me."],
            john: ["John! Hi! I'm not in trouble, right? Okay. Good. Sorry.", "Hi John! I read the fine print on a cake mix for you. It was fine."],
            joe: ['Joe! Your poems make me cry. In a good way. In a cheesecake way.', "Joe! I baked you a poem. It's a cake with words on it."] },
        chat: { any: ["Water bath. Low heat. No sudden movements. That's how you keep a cheesecake from cracking. And a person.", "Sarah told me my cheesecake was perfect. I've been fine for three days."],
            david: ['How do you walk into a room like that? Like you belong? Can I borrow it?'],
            james: ["Could you manage my baking schedule? I have fourteen cheesecakes a night. That's too many, right?"],
            john: ['Is it legal to apologize too much? I think I break that law daily.'],
            joe: ["Write a poem about a cheesecake that doesn't crack. For inspiration. For me."] },
    },
    clementine: {
        meet: { any: ['Darling. Clementine. Like the fruit, but more expensive.', 'You must be one of Sarah\'s. You can tell by the good taste.'],
            david: ['David. Finally, someone on this island who understands a jacket.', 'Clementine. I run the boutique. You and I will be friends. Or rivals. Both are chic.'],
            james: ['James. Golf polo. Brave. We can work with that.', 'Clementine. Boutique. Bring your wallet and an open mind.'],
            john: ['A lawyer in a suit. On an island. Darling, that is commitment.', 'Clementine. I peel for no one. Not even counsel.'] },
        hi: { any: ['{who}, darling. Turn around. ...Yes. Okay. Acceptable.', 'Orange is the new orange.'],
            david: ['David. That pink. Bold. I approve. Quietly. Very quietly.', "David, darling, we should do a runway on the boardwalk. You and me. Kai can clap."],
            james: ['James. A new hat? No? Get a new hat.', "James. You're very... pressed. Like a nice shirt."],
            john: ['John. The tie. Red. Power. I see you.', "Counselor. Your suit is very serious. I'd add a pocket square. Orange."],
            joe: ["Joe, darling. Those curls. Twelve out of ten. Don't touch them. Ever.", "Joe. A poem about my sunglasses. You owe me."] },
        chat: { any: ["Sunglasses at night aren't a choice. They're a responsibility.", "Sarah's style? Effortless. I hate it. I love it."],
            david: ["Your rainbow trail. Is it a look or a lifestyle? ...Both. Of course both."],
            james: ["Golf fashion is the last frontier. I could save it. Give me a season."],
            john: ['If I trademark "orange," can I stop Chili from wearing red? No? Tragic.'],
            joe: ["Sarah's lucky. You write poems AND you have good hair. That's illegal in some islands."] },
    },
    cuke: {
        meet: { any: ["HI!! I'm Cuke! I've been up since 4 AM! I already jogged, stretched and alphabetized my water bottles!", "I'm not a pickle. Never been a pickle. Nobody asked."],
            david: ["DAVID! You skate?! Do you skate at 4 AM? We could skate-jog! Skog!", "I'm Cuke! Cool as a cucumber! Unless someone says pickle."],
            james: ['JAMES! Golf is great cardio if you run between holes! Do you run? You should run!', "I'm Cuke! Good morning! It's always morning somewhere!"],
            john: ['JOHN! Lawyers get up early, right? 4 AM? 3? I respect it either way!', "I'm Cuke! Please confirm, legally, I am not a pickle."] },
        hi: { any: ['GOOD MORNING, {who}! Is it morning? It\'s morning in my heart!', 'Stretch with me! Reach for the sun! Reach for it!'],
            david: ['DAVID! Skate race to the pier! I\'ll run! Ready, set, I already started!', 'David! Your energy! It matches mine! It almost matches mine!'],
            james: ['James! Lap around the island before lunch? Manager pace!', 'JAMES! Hydrate! Have you hydrated? I have hydrated four times!'],
            john: ['JOHN! Jog with me! You can bring the briefcase! Extra weight! Extra gains!', "John! I read a contract once! It was a gym membership! I loved it!"],
            joe: ["JOE! Morning poem! Something with sunrise! And legs! Running legs!", "Joe! Wake up earlier! Poets need sunrises! I'll knock at 4!"] },
        chat: { any: ['I saw the sunrise snapper once. At 5 AM. It looked right at me. I felt so alive.', "Sarah jogged with me once! For eleven seconds! A personal best! Hers!"],
            david: ['Can you teach me a dance move? A FAST one? Cardio dance?'],
            james: ["If you managed my schedule, what would you cut? Not the 4 AM jog. Anything but that."],
            john: ['Is it illegal to be THIS excited before sunrise? Asking for me!'],
            joe: ["Write a poem I can jog to! With a beat! Left, right, left, right, POEM!"] },
    },
    sully: {
        meet: { any: ["How ya doin'. Name's Sully. Boston cream pie. Don't weah it out.", "I run the pottery studio. Come make somethin' sometime, kid."],
            david: ["You're the brothah. The flashy one. Sully. Don't touch the kiln, it's wicked hot.", "Your sistah makes a mean vase. Runs in the family? We'll see."],
            james: ["James, right? The golf guy. I golf. Badly. Wicked badly. Sully.", "Come by the studio. We'll make ya a trophy. Fah golf."],
            john: ["A lawyah. Huh. Sully. I didn't do nothin'. Whatevah it was.", "You evah need a mug that says 'Objection,' I got ya covahed."] },
        hi: { any: ["How ya doin', {who}.", "Wicked nice day, huh? Kiln's hot. Come by."],
            david: ["David. You're shiny. Don't stand neah the kiln, ya'll melt.", "Kid, ya skated through my studio again. I found glittah in the clay."],
            james: ["James. How's the swing? Mine's terrible. Thanks fah askin'.", "Mistah Managah. Manage this lump a clay inta a bowl."],
            john: ["Counselah. How's the lawyerin'?", "John. Ya wanna make a gavel? Out a clay? Wicked fun."],
            joe: ["Joe. Ya wrote a poem on my mug. It's my fav'rite mug now. Don't tell nobody.", "Joe. The poet. How's the rhymin'?"] },
        chat: { any: ["Pahk the cah in Hahvahd Yahd. I say it every mornin'. I don't even got a cah.", "Your Sarah's got good hands. Clay listens to her. Clay don't listen to me."],
            david: ["Make a disco ball outta clay. Do it. I dare ya."],
            james: ["Golf trophies are just fancy cups. I make cups. We should talk."],
            john: ["Chowdah. Not chow-DER. That's the law. I checked. I'm the law."],
            joe: ["A poem's like a pot. Ya gotta center it. Then don't ovahthink it."] },
    },
    ginger: {
        meet: { any: ["Hiya! Ginger. Gingerbread. I build things. Mostly houses. Also porches. I love a porch.", "You're visiting Sarah? Her house has my best roof. Go look."],
            david: ["David! Sarah's brother! I could build you a stage. Sturdy. Like your confidence.", "If you ever want a house here, I'll build it. Pink, I assume."],
            james: ["James! A manager! I could use one. My schedule is all frosting and no plan.", "Ginger. Builder. If you want a putting green, I'll consider it."],
            john: ["John! Building permits. Do we need those? Please say no.", "Ginger. I build by feel. And by gingerbread code. Is that a real code?"] },
        hi: { any: ['Hiya, {who}! Measure twice, cut once. Frost twice, eat once.', "Every house here has a story. Most of them are 'Ginger fixed the roof.'"],
            david: ["David! Those skates holding up okay? I could fix a wheel. I can fix anything with a wheel.", "David! Want a balcony on your tent? I can do a balcony on a tent."],
            james: ["James! Have you thought about a porch? Everyone should think about porches.", "Mr. Manager! I finished a roof early. Write that down somewhere."],
            john: ["John! Is a porch legally part of a house? I say yes. Morally yes.", "Counselor! I built a little courthouse out of gingerbread. For fun. It's delicious."],
            joe: ["Joe! Your house is holding up great. The poems on the walls really insulate.", "Joe! Need more shelves? For notebooks? You need more shelves."] },
        chat: { any: ["Sarah asked me to redo her house and I almost cried. In a good way. In a porch way.", "I've got a hammer, a level and a very good attitude. That's the whole kit."],
            david: ['If you built a house here, would it have a disco floor? It would, right? I need to plan the joists.'],
            james: ['If you managed construction, would you let me do porches on everything? Please?'],
            john: ['Do gingerbread houses need fire insurance? Asking because of the oven.'],
            joe: ["Want a writing nook? Little window, big chair? I'll build it. Free. For poems."] },
    },
    brulee: {
        meet: { any: ['Bonjour! I am Brulee. Crème brûlée. Please do not tap my top.', 'Welcome to the island. The museum is my pride. Come see the art.'],
            david: ["David! Bonjour! Your famous pose is in the museum's sketchbook. Very dramatic.", "I am Brulee. I curate. I do not crack. Under pressure. Usually."],
            james: ["James! Bonjour. Do you like art? It is fine if not. I will change your mind.", "I am Brulee. The museum is free. The wisdom is also free."],
            john: ["A lawyer! Bonjour! Can a painting be guilty? I think some of them are.", "I am Brulee. Curator. Please do not tap. Legally or otherwise."] },
        hi: { any: ['Bonjour, {who}! Art is like caramel: it is all about the crack.', 'Welcome back! The museum has a new frame. I dusted it twice.'],
            david: ["David! Bonjour! Your rainbow trail is a living artwork. I've written a placard.", "Bonjour, David! Pose for a painting? Already you are posing."],
            james: ['James! Bonjour! Your consistency is very... modern art. Minimalist.', 'Bonjour, James. Manage a visit to the museum today, oui?'],
            john: ["John! Bonjour! Your tie is a very strong red. Very Rothko.", "Bonjour, counselor. Have you come to inspect the museum? It passes. I hope."],
            joe: ["Joe! Bonjour! I made room for poem number twelve.", "Bonjour, Joe! Your poems are the most visited wall. Do not tell the paintings."] },
        chat: { any: ["Someone asked me my favorite painting. I said: the next one. I do not have a favorite.", "Sarah donated something lovely last week. I cried a little caramel."],
            david: ["Would you model for a sculpture? Sully says he can do it. In clay. Life-size."],
            james: ["You could manage the gift shop. We do not have one. You could manage that we don't."],
            john: ["If a painting is upside down for a hundred years, does it become right side up? Legally?"],
            joe: ['A poem is a painting with words. You paint with words. Please donate more.'] },
    },
    mac: {
        meet: { any: ["Welcome, welcome! I'm Mac. Mac and cheese. Mostly cheese, emotionally.", "You look hungry. Everybody looks hungry to me. It's a gift."],
            david: ['David! Sarah talks about you all the time! You want a table by the window? You want ALL the windows?', "I'm Mac. I run the restaurant. Come eat. Come eat twice."],
            james: ['James! The responsible one! Responsible people need comfort food the most. Sit.', "I'm Mac. Extra cheese is on the house. Always."],
            john: ['John! The lawyer! You look like you skip lunch. Not anymore. I am the law of lunch.', "I'm Mac. Mac and cheese. No fine print. Just cheese."] },
        hi: { any: ["{who}! Have you eaten? You haven't. I can tell. Come in.", "My secret ingredient is more cheese. It's not a secret."],
            david: ["David! Your usual? Something fabulous and also with cheese?", "David! I named a dish after you. It's very cheesy. It's a compliment."],
            james: ['James! Table for one? Table for one manager?', "James! You look like you need tomato soup. Everyone needs tomato soup."],
            john: ['John! Come eat! You can bill me for the time. I won\'t pay. But you can bill me.', 'Counselor! Lunch! That\'s my ruling.'],
            joe: ["Joe! Takeout for two? For you and Sarah? I'll add a cookie. Two cookies.", "Joe! You're my best customer. Don't tell Sarah. She's my best customer too."] },
        chat: { any: ["Basil does noodles at night, I do noodles in the day. Noodle relay team.", "Sarah brought me a recipe once. I framed it. Then I made it eleven times."],
            david: ["Would you host a dinner party here? With dancing? I'll move the tables."],
            james: ["If you managed the restaurant, would we still do unlimited cheese? Say yes."],
            john: ["Is 'too much cheese' a legal concept? Because I'd like to fight it."],
            joe: ['You and Sarah, dinner at sunset, my best table. I\'ll hum. Quietly.'] },
    },
    joe: {
        meet: { any: ["Hey! You're here! I'm Joe. I live here. And write poems. Mostly poems.", "Any friend of Sarah's is a friend of mine. Even the goat."] },
        hi: { any: ['Hey, {who}! Good to see you on the island.', "{who}! I wrote a poem this morning. It's about breakfast. It's very short."],
            david: ["David! You made it! Sarah's going to scream. In a happy way.", "David. Your jacket is a poem. A loud one. I love it."],
            james: ['James! Fore! ...Did I do that right?', "Mr. Manager! You'd be proud: I organized my notebooks. By feeling."],
            john: ["John! Counselor! I need you to look at a poem for libel. It's about a duck.", "John. Siblings in Law. I'm in it now, right? I'm in the contract?"] },
        chat: { any: ["Sarah's around somewhere. Probably fishing. Or at the museum. Or both, somehow.", 'I wrote a poem about this island. It was too long. Like, island-sized.'],
            david: ["David, I wrote you a poem. It's about roller skates. It rolls. Mostly.", "Club tonight? I'll dance. Badly. Lovingly."],
            james: ['Golf, but with poems instead of balls. Hole in one stanza. Patent pending.', "You're the calmest person in the family. How? Tell me your secrets."],
            john: ["Is it legal to rhyme 'orange' with 'door hinge'? I've been doing it.", 'Your briefcase at the beach is the funniest thing on this island. And I live with a goat.'] },
    },
    david: {
        meet: { any: ["Oh hello! I'm David. Sarah's brother. Visiting. You'll know me by the skates."] },
        hi: { any: ['{who}! You look amazing. I look amazing. Everybody looks amazing.'],
            james: ["James! My favorite manager! Club tonight. I've already put you on the list.", 'Mr. Manager. The flags on the golf course have to be rainbow. We agreed.'],
            john: ["John! Siblings in Law! The reunion tour!", "Counselor. Is it illegal to be this fabulous? Don't answer, I'll go to jail happily."],
            joe: ["Joe! My favorite poet. Read me the cheekbone poem. The sandwich one.", "Joe! Is Sarah okay? Is she happy? She's happy. Good. I'm happy."] },
        chat: { any: ["I'm not a neighbor, I'm a special guest. The difference is the sunglasses."],
            james: ["Remember when we got into the sequel? We were icons. We still are."],
            john: ['If I sue the pigeon that stole my sandwich, will you represent me?'],
            joe: ["You make my sister so happy. I'm going to cry. I'm crying. It's the glitter."] },
    },
    james: {
        meet: { any: ["Hey. James. Sarah's brother. Nice island. Great par 4 potential."] },
        hi: { any: ["{who}. Good to see you. Nice day for nine holes."],
            david: ["David. You're sparkling. Is that new? It's always new.", "David. The flags will be rainbow. I've agreed. It's in writing."],
            john: ["John. The contract. Is the beach still not a golf course? Okay.", "John! Brothers! In law!"],
            joe: ["Joe. Hole in one stanza. I've been thinking about it.", "Joe, buddy. You treating my sister right? I know you are. Just checking."] },
        chat: { any: ["They called me Mr. Manager in the last game. I kept the title."],
            david: ["You ever think about how we're in a video game? I think about it every time I golf."],
            john: ["You should really take the briefcase off at the beach. It's a lot."],
            joe: ["Write a poem about golf. Make it rhyme. 'Ball' and 'ball' is fine. Twice."] },
    },
    john: {
        meet: { any: ["John. Sarah's brother. I've reviewed the island. Legally adorable."] },
        hi: { any: ["{who}. Good {part}. Noted for the record."],
            david: ["David. You're glowing. Is that legal? Allegedly.", "David, the skating on the pier. Is there a permit for that? Never mind. I'll handle it."],
            james: ["James. Mr. Manager. Have you managed your sunscreen?", "James. The beach is still not a golf course. I'm sorry."],
            joe: ["Joe. The duck poem cleared review. No defamation.", "Joe. You're in the contract now. Siblings in Law. Congratulations, I guess."] },
        chat: { any: ["Objection. Sustained. I did both. Very efficient."],
            david: ["I've drafted terms with the pigeon that keeps following you. It agreed to nothing."],
            james: ["The goat has retained counsel. It's me. The goat has not paid."],
            joe: ["I have reason to believe you LIKE like Sarah. Exhibit A: everything."] },
    },
    elizabeth: {
        meet: { any: ["Hi! Elizabeth. Sarah's sister. Jackbox tonight, Sarah's place, 9 PM. Those are the rules."] },
        hi: { any: ['{who}! Jackbox tonight. Be there.'],
            david: ["David! You're coming to Jackbox. You always win the drawing ones. It's suspicious."],
            james: ["James! Jackbox. You're on my team. Manage us to victory."],
            john: ["John! You can't object during Jackbox. I made a rule."],
            joe: ["Joe! You write the funniest answers. Sarah laughs so hard she snorts. Every time."] },
        chat: { any: ['Remember when we hijacked the sequel? Good times. Great crimes.'],
            david: ["We need a family photo on the pier. Before Sarah gets too famous."],
            james: ["You're the only one who reads the Jackbox rules out loud. We love you for it."],
            john: ["If Jackbox night goes to court, I want you as my lawyer. Unless you're on the other team."],
            joe: ["I told Coco I saw you and Sarah holding hands. She told everyone. My bad. (Not sorry.)"] },
    },
    fortune: {
        hi: { any: ["Hello hello, {who}! Welcome to Fortune's Goods! Everything's fresh. Including me."],
            david: ["David! My most fabulous customer! The cookie said you'd come in today!"],
            james: ["James! The cookie says: buy something responsible today. Like seeds."],
            john: ["John! Every sale is final. That's legal, right? The cookie says it's legal."],
            joe: ["Joe! My first customer ever! Well, Sarah was. You were second. A very good second."] },
    },
    floss: {
        hi: { any: ["Sugar! Welcome to Floss & Gloss! Visitors get a free spin in the chair. The chair spins. That's it."],
            david: ["David, sugar! That hair! Who did it? ...I want to meet them. I want to BE them."],
            james: ["James, sugar! Nice and neat. A little product and you'd be a whole manager."],
            john: ["John, sugar! Very lawyerly hair. Very sensible. Let me add a swoop."],
            joe: ["Joe! The curls! Don't let anybody touch them. Except me. For science."] },
    },
    waffle: {
        hi: { any: ["Welcome to the display shop! Look at everything! Touch nothing! Okay, touch a little."],
            joe: ["Joe! I have a shelf with your name on it. Literally. I wrote JOE on it."] },
    },
    wasabi: {
        hi: { any: ["YOOO {who}! Welcome to Club Wasabi! The beat never stops! Neither do I!"],
            david: ["DAVID! The legend! The floor's yours! It was always yours!"],
            james: ["JAMES! Manager on the dance floor! Let's go! Manage those moves!"],
            john: ["JOHN! No objections on my dance floor! Only grooves!"],
            joe: ["JOE! Karaoke king! Your poems are the best songs I've got!"] },
    },
    goat: {
        hi: { any: ["The goat looks at {who}. It's a goat. It knows exactly who you are."] },
    },
};
/* when the neighbor has nothing particular to say: what they ask, how they say goodbye */
const GUEST_PROMPT = ['What can I do for you, {who}?', 'So! What brings you by?', 'Anything else, {who}?'];
const GUEST_BYE = ['See you around, {who}!', 'Come back soon!', 'Say hi to Sarah for me!', 'Bye, {who}! Enjoy the island!'];

/* the visitor's lines twice over, plus anybody's */
function pickFor(pool, who) {
    if (!pool) return '';
    const own = pool[who] || [];
    return rpick(own.concat(own, pool.any || []).filter(Boolean)) || rpick(pool.any || ['Hi!']);
}
function fillVisit(line) {
    return String(line).replace(/\{who\}/g, Online.name(Online.who())).replace(/\{part\}/g, partOfDay());
}

/* news about Sarah, from her island as she last saved it (a visitor's game has it in Online.island) */
function sarahNews(id) {
    const H = Online.island || {}, out = [];
    const r = H.npcs && H.npcs[id];
    const pts = r ? r.pts : 0;
    if (r && r.met) out.push(pts >= 100 ? "Sarah and I? Best friends. Five hearts. I'd do anything for her." : pts >= 45 ? "Sarah and I are good friends. She stops by a lot. I like that." : "I'm still getting to know Sarah. She seems wonderful.");
    else out.push("I haven't really met Sarah yet. Tell her to come say hi!");
    const st = H.stats || {};
    if (st.fish) out.push(`Sarah has caught ${fmtNum(st.fish)} ${plural(st.fish, 'fish', 'fish')}. ${st.fish > 50 ? 'Kai is so jealous.' : 'She is getting good at it.'}`);
    if (H.house && H.house.level >= 2) out.push(H.house.level >= 4 ? "Have you seen Sarah's house? Biggest on the island. Ginger outdid herself." : "Sarah's house keeps getting bigger. Ginger's very proud.");
    if (H.money >= 50000) out.push("Sarah has a LOT of sand dollars. Don't tell her I said that. Everyone knows.");
    if (H.recipes && H.recipes.length > 10) out.push(`Sarah knows ${H.recipes.length} recipes now. Mac wants to hire her.`);
    const days = H.day && H.startDay ? H.day - H.startDay + 1 : 0;
    if (days > 1) out.push(`Sarah's been on the island ${fmtNum(days)} days now. Feels like she's always been here.`);
    if (H.npcs && H.npcs.joe && id !== 'joe') out.push("Sarah and Joe? Inseparable. Coco has a whole theory.");
    return rpick(out);
}

/* talking to a neighbor as a visitor: true if it was handled here (otherwise 50_talk.js carries on as usual) */
async function visitorTalk(n) {
    const id = n.id, who = Online.who(), V = VISIT_TALK[id];
    if (!V) return false;
    const r = rel(id), day = Clock.dayNum();
    // shops, the club, the goat: a hello of their own, then business as usual
    if (n.def.shop || n.def.dj || n.def.goat) {
        if (r.talkDay !== day) { r.talkDay = day; r.met = true; heartPop(n); addPts(id, 2); await UI.say(id, fillVisit(pickFor(V.hi, who)), { keep: true }); }
        return false;
    }
    if (!r.met) {
        r.met = true; r.talkDay = day; r.talkAt = Date.now();
        addPts(id, 4);
        await UI.say(id, ((V.meet && (V.meet[who] || V.meet.any)) || [pickFor(V.hi, who)]).map(fillVisit));
        Save.touch();
        return true;
    }
    if (r.talkDay !== day) {
        r.talkDay = day;
        const up = addPts(id, 2 + bonusCharm());
        heartPop(n);
        await UI.say(id, fillVisit(pickFor(V.hi, who)), { keep: true });
        if (up) await heartUp(n, up);
    }
    for (;;) {
        const k = await UI.ask(id, fillVisit(rpick(GUEST_PROMPT)), ['Chat', 'How is Sarah?', 'Give a gift', 'Bye'], { keep: true });
        if (k === 0) await UI.say(id, fillVisit(pickFor(V.chat || V.hi, who)), { keep: true });
        else if (k === 1) await UI.say(id, fillVisit(sarahNews(id)), { keep: true });
        else if (k === 2) { UI.hideDialog(); await giftFlow(n); break; }
        else { await UI.say(id, fillVisit(rpick(GUEST_BYE))); break; }
    }
    Save.touch();
    return true;
}
