/* ---- 2d_life.js ---- */
/* Neighbors living their lives: sitting on benches, and stopping to chat with each other (little speech bubbles
   over their heads). Sarah can sit on benches too. */

/* ---------------------------------------------------------------- benches */
function benches() {
    if (benches.c) return benches.c;
    // (a placed seat two tiles wide is a bench the neighbors sit on too)
    const placed = (S && S.deco && S.deco.placed || []).filter(p => { const d = typeof dispDef === 'function' && dispDef(p.id); return d && d.seat && d.w >= 2; })
        .map(p => ({ kind: 'bench', x: p.x, y: p.y, rot: p.rot & 3, placed: true }));
    // (and the seats two wide the designer set down: kind disp in the island's props, with their turn)
    const design = W0.props.filter((p, i) => { if (p.kind !== 'disp' || (typeof propGone === 'function' && propGone(i))) return false; const d = typeof dispDef === 'function' && dispDef(p.disp); return d && d.seat && d.w >= 2; })
        .map(p => ({ kind: 'bench', x: p.x, y: p.y, rot: p.rot & 3, placed: true }));
    return (benches.c = W0.props.filter((p, i) => (p.kind === 'bench' || p.kind === 'log') && !(typeof propGone === 'function' && propGone(i))).concat(placed, design));
}
function nearestBench(tx, ty, maxD) {
    let best = null, bd = maxD || 4;
    for (const b of benches()) { const odd = b.rot & 1, d = Math.hypot(b.x + (odd ? 0.5 : 1) - tx, b.y + (odd ? 0.5 : 0) - ty); if (d < bd) { bd = d; best = b; } }
    return best;
}
/* a bench's two seats, whichever way it faces (b.rot: the designer's quarter turns, its front to the east, the back, the
   west; turned on its side it's one tile across and two deep): where she sits, `rot` the way she faces and benchY, where
   the flat views hide her feet. (A turned bench's model stands further forward on its footprint: EnvBuild.turned) */
function benchSeatPos(b, seat) {
    const r = (b.rot || 0) & 3, odd = r & 1, fx = [0, 1, 0, -1][r], fy = [1, 0, -1, 0][r], s = seat - 0.5, out = r ? 0.44 : 0.5 - 3 / TILE;
    const x = (b.x + (odd ? 0.5 : 1) + fy * s + fx * out) * TILE, y = (b.y + (odd ? 1 : 0.5) - fx * s + fy * out) * TILE;
    return { x, y, benchY: y + 1, rot: r };
}
const SIT_DIR = ['down', 'right', 'up', 'left'];
/* where a seated person sorts among the things drawn: in front of the bench, or behind it when its back is to the camera
   (the backrest hides her), turned on its side the nearer seat in front of the further one */
function benchSortY(b, pos) { return pos.rot === 2 ? pos.benchY + 0.5 : pos.rot ? (b.y + 2) * TILE - 1.5 + (pos.y - b.y * TILE) / 100 : pos.benchY + 0.5; }
/* the flat views' sitting frame faces the front; on a turned bench they stand side on or with their back to us, the seat
   hiding their legs (the line the flat views clip at) */
function sitClipY(sit) { return sit.rot & 1 ? sit.benchY - 3 : sit.benchY; }
function seatTaken(b, seat, self) {
    const p = G.player;
    if (p && p.sit && p.sit.b === b && p.sit.seat === seat) return true;
    return NPCs.list.some(o => o !== self && !o.sleeping && o.want && o.want.sit && o.want.sit.b === b && o.want.sit.seat === seat);
}
/* a plan spot next to a bench means sitting on it, if there's room */
function benchSpot(n, spot) {
    const s = W0.spots[spot];
    if (!s || n.def.goat) return null;
    const b = nearestBench(s.x, s.y, 4);
    if (!b) return null;
    const first = hash32(n.id + ':' + Clock.dayNum()) % 2;
    for (const seat of [first, 1 - first]) {
        if (seatTaken(b, seat, n)) continue;
        const p = benchSeatPos(b, seat);
        return { area: 'island', x: p.x, y: p.y, fixed: true, face: SIT_DIR[p.rot], sit: { b, seat, benchY: p.benchY, rot: p.rot } };
    }
    return null;
}
function isSeated(n) {
    const w = n.want;
    return !!(w && w.sit && !n.path && n.area === 'island' && Math.abs(n.x - w.x) < 1 && Math.abs(n.y - w.y) < 1);
}
/* sitting: the food folks sink into the seat a little and the bench hides their feet (people have real sitting frames) */
function drawSeated(ctx, benchY, fn) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-100000, -100000, 200000, benchY - 5 + 100000);
    ctx.clip();
    fn();
    ctx.restore();
}
/* Sarah sits down on the nearest free seat and stays there until she moves */
async function sitOnBench(e) {
    const b = benches().find(q => q.x === e.px && q.y === e.py);
    const p = G.player;
    if (b) {
        const far = s => { const q = benchSeatPos(b, s); return Math.hypot(q.x - p.x, q.y - p.y); };
        const seats = [0, 1].filter(s => !seatTaken(b, s)).sort((s1, s2) => far(s1) - far(s2));
        if (seats.length) {
            const pos = benchSeatPos(b, seats[0]);
            p.x = pos.x; p.y = pos.y; p.dir = SIT_DIR[pos.rot]; p.path = null;
            p.sit = { b, seat: seats[0], benchY: pos.benchY, rot: pos.rot };
            p.sy = benchSortY(b, pos);
        }
    }
    const buddy = p.sit && NPCs.here().find(n => isSeated(n) && n.want.sit.b === p.sit.b);
    if (buddy && TALK[buddy.id]) {
        buddy.emote = 'heart'; buddy.emoteT = 60;
        await UI.say(buddy.id, voiced(buddy.id, rpick(BENCH_BUDDY)));
        const r = rel(buddy.id), day = Clock.dayNum();
        remember(buddy.id, 'bench');
        if (r.met && r.benchDay !== day) { r.benchDay = day; const up = addPts(buddy.id, 2); if (up) await heartUp(buddy, up); }
        return;
    }
    // (she just sits: no line about it, David, 28 October)
}
const BENCH_BUDDY = ['Oh, hi! Sit, sit. This is the best bench. I would know. I have tried them all.', 'Bench buddies! We just sit. That is the whole activity.',
    "Nice, right? I come here to think. Mostly about snacks.", "Shh. Listen. ...That's the island. It's doing nothing. I love it."];
function standUp(p) {
    const b = p.sit.b, r = p.sit.rot || 0;
    p.sit = null; p.sy = undefined;
    // (up off the seat to the tile in front of it)
    if (!r) p.y = (b.y + 1.5) * TILE + 4;
    else { p.x += [0, 1, 0, -1][r] * 15; p.y += [1, 0, -1, 0][r] * 15; }
}

/* a bench the designer turned, in the flat views (its picture faces the front): from behind it's the same planks with
   the iron frame over them; side on, the seat's planks run up the screen with the backrest standing along its back */
function drawBenchTurned(ctx, e) {
    const x0 = e.px * TILE, y0 = e.py * TILE, ink = '#2d2230', mid = '#b07a4a', hi = '#c98a55', lo = '#8a5a33', iron = '#4a4450';
    if (e.rot === 2) {
        spr(ctx, 'bench', e.x, e.y);
        ctx.fillStyle = iron;
        for (const dx of [5, 25]) ctx.fillRect(x0 + dx, e.y - 15, 2, 12);
        return;
    }
    const east = e.rot === 1;
    const box = (dx, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(east ? x0 + dx : x0 + TILE - dx - w, y, w, h); };
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(x0 + 2, y0 + 5, TILE - 4, 26);
    // the backrest, edge on along the back, standing a plank higher than the seat
    box(2, y0 - 15, 5, 36, ink); box(3, y0 - 14, 3, 34, mid); box(3, y0 - 14, 3, 2, hi);
    // the seat: its planks run the bench's length
    box(5, y0 - 6, 10, 28, ink); box(6, y0 - 5, 8, 26, mid);
    box(9, y0 - 5, 1, 26, lo); box(6, y0 - 5, 8, 2, hi); box(6, y0 + 19, 8, 2, lo);
    // the two front legs (the back ones are hidden by the seat)
    box(6, y0 + 22, 2, 7, iron); box(12, y0 + 22, 2, 7, iron);
}

/* ---------------------------------------------------------------- chatting */
/* lines alternate between the two people, starting with whoever walked up */
const CHAT_LINES = [
    ['Nice day, huh?', 'The nicest. So far.', 'Bold of you.'],
    ["Did you see Sarah's house?", 'Cutest on the island.', "Don't tell the Cozy Council."],
    ['What are you up to?', 'Absolutely nothing.', 'Can I join?', 'Obviously.'],
    ["Have you been to Mac's today?", 'Twice.', 'Respect.'],
    ['I had the weirdest dream.', 'Was it about soup?', '...How did you know?'],
    ['Is it early or late?', 'Yes.'],
    ['Joe read me a poem today.', 'Frog or spoon?', 'Both.', 'A classic.'],
    ['The goat looked at me.', "It looked at me too.", 'We should compare notes.'],
    ['Noodles later?', "Basil's cart? Always."],
    ['I bought a hat.', 'Where is it?', 'In my heart.', '...Okay.'],
    ['The museum has new art!', 'Is it the goat again?', 'Not ONLY the goat.'],
    ['Ginger fixed my door.', 'Was it broken?', "No. It's perfect now, though."],
    ['Have you seen Wonton?', 'In the hot spring.', 'Is that soup?', "Don't."],
    ['I love this island.', 'Me too.', 'Group hug?', 'Group of two hug.'],
    ["What's your favorite time of day?", '2 AM.', 'Same.'],
    ['Coco told me a secret.', 'Everyone knows it.', '...Everyone?', 'Everyone.'],
    ['That cloud looks like a cheesecake.', 'Cece will cry.', 'Happy tears, though.'],
    ["I'm going to try pottery.", "Sully's going to call you kid.", "I'm ready."],
    ['The windmill hums now.', 'Ginger tuned it.', 'Ginger tunes everything.'],
    ["I've been thinking.", 'Uh oh.', 'About snacks.', 'Oh, good.'],
    ['Wanna race to the pier?', 'No.', 'Fair.'],
    ['Hi!', 'Hi!', "I'm going to stop while it's going well.", 'Perfect conversation.'],
    ["Fortune's cookie said 'good things.'", "Mine said 'more good things.'", "We're set."],
    ['Sarah waved at me!', 'She waved at me too!', "We're so popular."],
    ['I found a star fragment.', 'Did you make a wish?', 'For a nap.', 'Good wish.'],
    ["The flowers by the pond are blooming.", 'I picked one for my table.', 'So fancy.'],
    ["Brulee called my scarf 'a statement.'", 'Good or bad?', 'Unclear.'],
    ["What's for dinner?", 'Whatever Mac is making.', 'Perfect.'],
    ['Did you hear the waterfall?', 'I can hear it from here.', 'Relatable.'],
    ['I tried the claw machine.', 'Win anything?', 'Humility.'],
    ['Do you ever just sit?', "I set aside a whole afternoon.", 'Same.'],
    ['I read a whole book today.', 'Which one?', 'The menu at Mac\'s.'],
    ['Do you think fish know they live in the ocean?', 'I think they suspect.', 'Deep.'],
    ['Jump rope this afternoon?', "Cuke's turning. He's a menace.", 'A wonderful menace.'],
    ['Club tonight?', 'Every night is club night.', "Wasabi's playing the good one."],
    ["I finally cleaned my house.", 'Wow!', 'I put everything under the bed.', 'Classic.'],
    ['Karaoke tonight?', "Only if Joe does the frog poem.", 'He always does the frog poem.'],
    ["I'm learning to paint.", 'What are you painting?', 'The goat.', 'Everyone paints the goat.'],
    ['Have you tried the farm veggies?', "The cabbage looked at me funny.", "That's just how cabbages look."],
    ['I climbed the mountain!', 'How was the view?', 'Tall.'],
    ['I saw a dolphin from the pier!', 'Did it wave?', 'It did a flip.', "That's basically a wave."],
    ['Do you think the lighthouse is really haunted?', 'I think the ghost is just lonely.', "Let's bring it snacks."],
    ["I've been practicing my karaoke.", 'Which song?', "All of them. At once.", "Wasabi's going to love that."],
    ['I planted a sapling today.', 'What kind?', 'The tree kind.', 'Good choice.'],
    ['Have you tried the hot spring?', "Wonton's always in it.", "He says it's NOT soup.", "It's a little bit soup."],
    ['I got a letter in the mail!', 'From who?', 'Me. I mailed it to myself.', 'Did you like it?', 'Very much.'],
    ['Is it just me, or is the grass greener today?', "Ginger's been out with a watering can.", 'Of course she has.'],
    ['I lost a sock.', "Check Coco's house.", 'Why would Coco have it?', "Coco has everything. Eventually."],
    ['I tried meditating.', 'How did it go?', 'I thought about noodles the whole time.', "That's meditating."],
    ['Do you ever wonder what the goat thinks about?', 'Grass.', 'Just grass?', 'Grass and secrets.'],
    ["I finished my puzzle!", 'How many pieces?', 'Twelve.', 'Impressive.'],
    ["The bakery smells amazing today.", "Waffle's trying a new recipe.", 'Is it waffles?', "It's always waffles."],
    ['I found a shell shaped like a heart.', 'Who are you giving it to?', 'Myself. Self-love.'],
    ["Have you seen the new flowers?", 'The purple ones?', "They're new! Somebody's been watering.", 'Mysterious.'],
    ["I'm thinking of redecorating.", "Ginger's free on Tuesday.", "Ginger's free every day. She just shows up."],
    ['What would you do with a million sand dollars?', 'Buy one really nice chair.', 'Just one?', 'A REALLY nice one.'],
    ["I wrote my name in the sand.", 'And then?', 'The sea read it.', 'Beautiful.'],
    ['Did you hear the owl last night?', 'Hoo?', '...The owl.', 'I know. I was doing the owl.'],
    ["I'm going to the arcade later.", "Chili's prize counter?", "I've got eleven tickets.", "That's a pencil. A nice pencil."],
    ['My plant grew a new leaf!', 'Congratulations!', "I'm so proud of it.", 'You should be.'],
    ['Do you think Sarah likes it here?', 'She waters our flowers.', "That's a yes."],
    ['I had pancakes for breakfast.', 'And lunch?', 'Also pancakes.', 'Living the dream.'],
    ["I can't decide what to wear tomorrow.", 'The orange one.', "Clementine said that too.", 'Clementine is always right.'],
    ["I tried to fish today.", 'Catch anything?', 'A boot.', 'Boots count.'],
    ['Have you been to the museum lately?', "Brulee moved one painting an inch.", 'Big week.'],
    ['The sunset was so pretty yesterday.', 'Pink?', 'So pink.', 'The best kind.'],
    ['I made a sandcastle.', 'With towers?', 'With a moat.', 'Fancy.', 'The sea took it. It was beautiful while it lasted.'],
    ["I'm going on a walk.", 'Where to?', 'Nowhere. On purpose.', 'The best walks.'],
    ['I heard a rumor.', 'From Coco?', "From Coco's cousin.", "Coco doesn't have a cousin.", 'Exactly.'],
    ["Is that a new hat?", 'Since Tuesday.', 'It suits you.', 'I know.'],
    ['Do you remember your first day on the island?', 'I got lost.', 'The island is small.', 'I got lost twice.'],
    ['Snowball fight this winter?', "You're on.", "I've been training.", 'Since when?', 'Since right now.'],
    ["I named a cloud.", 'What did you name it?', 'Gerald.', 'Where is Gerald now?', 'He moved on.'],
    ['Have you seen the new boat at the pier?', "That's Sarah's.", "It's so big!", 'She came a long way.'],
    ["I've been reading about stars.", 'Which star?', 'All of them. I skimmed.'],
    ["I made a friendship bracelet.", 'For who?', 'For you!', "I'll wear it forever.", 'Or until bath time.'],
    ["The farm's veggies look great this year.", 'The carrots are huge.', 'One looked at me.', "That's the cabbage again."],
    ['What do you think is at the bottom of the sea?', 'More sea.', 'And then?', 'Sand. Probably a sock.'],
    ["I'm going to bake something.", 'Will it crack?', "Only if Cece's watching.", "She's always watching."],
    ['Want to hear a joke?', 'Sure.', "Why did the dumpling cross the road?", 'Why?', 'To get away from the soup.'],
    ["The fountain's so pretty at night.", 'All the lights.', 'I made a wish in it.', 'What for?', "More fountains."],
    ["I learned a new word today.", 'What is it?', "'Splendiferous.'", 'Use it in a sentence.', 'This conversation is splendiferous.'],
    ['Did you see the hot air balloon?', 'It waved!', 'Balloons can\'t wave.', 'This one did.'],
    ["I'm going to write a letter to the Town Hall.", 'About what?', 'More benches.', "There are so many benches.", 'Not enough.'],
    ['The bank says my savings grew.', 'By how much?', 'One sand dollar.', 'Rich!'],
    ['Do you know what day it is?', 'A good one.', 'Correct.'],
    ["I saw Sarah running with her arms out.", 'Like a happy kid?', 'Exactly like that.', 'Same, honestly.'],
    ["I'm making a scrapbook.", "What's in it?", 'Photos of my lunch.', 'Every lunch?', 'Every lunch.'],
    ['Should we start a book club?', 'What would we read?', "Joe's poems.", 'All of them?', 'There are SO many.'],
    ['I think I saw a fairy ring in the woods.', 'Glowing mushrooms?', 'At night!', "Don't step in it.", "I didn't. I'm not a monster."],
    ["My umbrella flipped inside out.", 'In the wind?', 'In my house.', 'How?', "I don't want to talk about it."],
    ["There's a new sign on Market Lane.", 'Coming soon!', 'Coming soon WHAT?', 'Coffee, I hope.', 'Sully would cry.'],
    ['Somebody bought land by the woods!', 'Who?', 'Nobody yet. The sign says for sale.', 'New neighbors!', 'I should bake.'],
    ["I've been practicing my wave.", "Let's see it.", '*waves*', 'Ten out of ten.'],
    ['Do you like rain or sun?', 'Sun.', 'Rain.', '...We can still be friends.'],
    ["I organized my closet by color.", 'Even the orange?', "There's SO much orange.", "Clementine's been gifting again."],
    ['What are you doing tonight?', 'Stargazing.', 'Can I come?', "Bring cocoa."],
    ["I'm on my third nap.", "It's noon.", "I'm efficient."],
];
const CHAT_RAIN = [['Rain again!', 'Great napping weather.', 'Every weather is napping weather.'], ['My hair is doing a thing.', 'The rain thing.', 'The rain thing.'],
    ['Puddle jumping later?', 'Obviously.'], ["The frogs are so happy.", 'Listen to them!', "They're singing.", "They're Joe's backup band."],
    ['I forgot my umbrella.', 'Share mine.', "It's tiny.", "It's a cocktail umbrella.", 'Cozy.'], ["The flowers love this.", 'Free watering!', "Sarah's day off."],
    ['Rain on the roof is the best sound.', 'Better than karaoke?', "Better than Wasabi's karaoke."], ["I'm soaked.", 'Me too.', 'Hot spring?', "Wonton's going to say it's soup."]];
const CHAT_SNOW = [['Snow!', 'Snowball fight?', 'Gently.'], ['I made a snow dumpling.', 'Does Wonton know?', 'He must never know.'],
    ['I built a snowman by the square.', 'Does it have a name?', 'Snowjoe.', 'Does Joe know?', 'Joe made the hat.'], ['My nose is cold.', 'Mine too.', "Let's get cocoa."],
    ['The island looks like a cake.', 'Cece would frost it.', "And then apologize."], ['I caught a snowflake on my tongue!', 'What did it taste like?', 'Winter.']];
const CHAT_NIGHT = [['Up late too?', 'Late? It\'s early.', 'Island time.'], ['Look at that bright one.', 'Show-offs.'], ["Cuke's been asleep for hours.", 'Weird of him.'],
    ["Look, a shooting star!", 'Make a wish!', "I wished for pancakes.", 'Bold.'], ['The lighthouse is so pretty at night.', 'And spooky.', 'Pretty spooky.'],
    ["Can't sleep?", 'Too many thoughts.', 'About what?', 'Mostly snacks.'], ['Is the club still open?', "It's always open.", "Does Wasabi sleep?", 'Nobody knows.'],
    ['The moon is huge tonight.', "It's showing off.", 'Let it.']];
const CHAT_MORNING = [['Morning!', 'Is it? Barely.'], ['Coffee?', 'Coffee.'], ['Did you sleep well?', 'Like a log.', "Ginger's going to chop you."],
    ["Cuke's already jogged twice.", "It's seven.", "He's been up since four."], ['Breakfast?', "Mac's?", 'Pancakes.', 'Say no more.'],
    ['The dew on the grass is so sparkly.', 'Nature glitter.', "David would approve."], ["I'm not awake yet.", "You're talking.", "That's my body. I'm still in bed."],
    ['Good morning, sunshine!', "Who, me?", "You and the sun."]];
const CHAT_EVENING = [['What a day.', 'What a day.', 'Same day?', 'Same day.'], ['Sunset walk?', 'To the pier?', 'Best view on the island.'],
    ["Dinner at Mac's?", "He's making soup.", "He's always making soup.", 'Good soup though.'], ['The lamps are coming on.', 'My favorite part.', "It's like the island's going to bed."],
    ['Karaoke tonight?', "Joe's doing the frog poem.", "He does it every night.", "It's a classic."], ["I'm so tired.", 'From what?', 'Thinking about tomorrow.']];
/* and a few that belong to the season */
const CHAT_SEASON = {
    spring: [['The cherry trees are blooming!', 'So pink.', "Clementine says it's not orange enough.", 'Nothing is.'], ['Spring cleaning?', 'I moved one chair.', "That's a start."],
        ['The bunnies are out!', 'They hopped right past me.', 'Rude.', 'Adorable.'], ["I'm planting tulips.", 'What color?', 'All of them.']],
    summer: [["It's so hot!", "Chili's fault.", "It's always Chili's fault."], ['Beach day?', 'Every day is beach day.', "Kai's already there."],
        ['Ice cream?', 'Two scoops.', 'Three.', "You're my favorite."], ['The fireflies are back!', 'Tiny lanterns.', 'Tiny flying lanterns.']],
    fall: [['The leaves are turning!', 'Red, orange, gold.', 'Clementine is THRILLED.'], ['Pumpkin everything?', 'Pumpkin everything.'],
        ['Sweater weather!', 'Finally.', "I've been wearing one since July."], ['I jumped in a leaf pile.', 'Whose?', "Ginger's. She raked it.", 'Uh oh.']],
    winter: [['Cocoa season!', 'With marshmallows?', 'With SO many marshmallows.'], ['The big tree has lights on it!', 'And a star!', 'Fancy.'],
        ['Brr!', 'Brr!', 'We should go inside.', 'Brr.'], ['What do you want for the holidays?', 'Socks.', 'Exciting.', 'Warm socks.']],
};
/* how each neighbor starts a conversation */
const CHAT_BY = {
    coco: [['Okay, so. Did you hear?', 'Hear what?', "Nothing yet. I'm starting it."], ['I have NEWS.', 'Is it big?', 'It is medium. Medium news.']],
    cuke: [['I jogged six miles!', "It's afternoon.", 'Before breakfast!'], ['Did you drink water today?', 'Some.', 'MORE.']],
    sully: [['Wicked nice day, huh?', 'Wicked?', 'Very. It means very, kid.'], ["Ya want a frappe?", "A milkshake?", "A FRAPPE."]],
    chili: [['Is it hot out, or is it me?', "It's you.", 'Thought so.']],
    clementine: [['Darling. Orange is back.', 'Did it leave?', 'Never.']],
    kai: [["Surf's up, dude!", "We're on land.", "Mentally, surf's up."]],
    basil: [['Noodles tonight?', 'Always.', 'Balance.']],
    maki: [['You are standing very neatly.', 'Thank you?', 'Don\'t move. You\'re getting it.']],
    cece: [['Sorry! Hi! Sorry.', 'Why are you sorry?', "I don't know! Sorry!"]],
    ginger: [['Your porch is a little crooked.', "I don't have a porch.", '...Want one?']],
    brulee: [['You have the face of a painting.', 'Which one?', 'A good one.']],
    mac: [['Have you eaten?', 'Yes.', 'Eat again.'], ['I made too much soup.', 'Again?', 'Always.']],
    joe: [['Want to hear a poem?', 'Is it about a frog?', "It's about a different frog."], ['I rhymed "orange" today.', 'With what?', "Don't ask. It wasn't good."],
        ["I'm reading a book about poems.", 'Is it good?', "It's missing frogs.", 'Tragic.'], ["Have you seen {name}?", 'She was by the pond.', "Okay. No reason. Bye."],
        ["I wrote you a haiku.", 'Read it!', 'Hello friend, hello. / This is a haiku for you. / It has a frog in it.']],
    wonton: [['The water is perfect today.', 'Is it soup?', 'It is NOT soup.', 'A little soup.', '...A little.'], ["I'm a dumpling. I belong in the water.", 'Like soup?', 'NOT LIKE SOUP.'],
        ['Come relax in the spring!', "I'll get wet.", "That's the point.", 'Fair.']],
};
// (more of each neighbor's own: added here so each list above stays short to read)
const CHAT_BY_MORE = {
    coco: [["Okay, don't tell anyone, but...", "I won't.", "Joe bought a NEW notebook.", 'Scandalous.'], ['Guess who I saw at the pier?', 'Who?', 'The goat.', 'Again?', 'AGAIN.'],
        ["I'm not a gossip. I'm a news reporter.", 'Okay.', 'Breaking news: you look nice today.']],
    cuke: [["Let's do push-ups!", 'Right now?', 'Right now! One! ...Okay, one is good.'], ["I eat a vegetable every day.", "You ARE a vegetable.", 'So I eat ME?! No. No no.'],
        ['Stretch with me!', 'Okay.', 'Reach for the sky!', "I'm reaching!", 'Higher!']],
    sully: [["Back in Boston, we had REAL snow.", 'We have snow.', 'This is a light dusting, kid.'], ['Ya want a coffee?', 'Sure.', "Good, 'cause I made a pot the size of a car."],
        ["I'm not a pie. I'm a cake.", "Nobody said you're a pie.", '...Good. Good.']],
    chili: [["I'm a little spicy today.", 'Only today?', '...Okay, always.'], ['Want a hot sauce?', 'How hot?', 'Yes.'],
        ["The arcade's busy today!", 'Who won the claw?', 'Nobody. Nobody ever wins the claw.']],
    clementine: [["Darling, that outfit.", 'Is it good?', 'It is BRAVE.'], ['I made a new pattern.', 'Is it orange?', 'It is citrus-adjacent.'],
        ["Fashion is about confidence.", "And orange?", "Confidence AND orange."]],
    kai: [['Dude, the waves today!', "They're tiny.", 'Tiny but TUBULAR.'], ["I'm a poke bowl, dude.", 'We know.', 'Just reminding the universe.'],
        ['Wanna build a sandcastle?', 'Sure!', "It's gonna be a sand-BOWL."]],
    basil: [['Slow down. Smell the noodles.', 'I can smell them from here.', 'Balance.'], ["My cart's open late tonight.", "I'll be there.", 'Bring an appetite. And chopsticks.'],
        ['Life is like a noodle.', 'How so?', 'Long. And better with friends.']],
    maki: [["I arranged my shelf by height.", 'Nice.', 'Then by color. Then by height again.'], ["You're two minutes early.", 'Is that bad?', "It's precise. Excellent."],
        ['I trimmed my garden today.', 'How much?', 'Exactly one centimeter.']],
    cece: [["I baked you a cheesecake!", 'Thank you!', 'It cracked! Sorry! It still tastes good! Sorry!'], ['Sorry, am I in your way?', "We're outside.", 'Sorry about outside!'],
        ["I'm trying not to apologize today.", 'How is it going?', 'Sorry. I mean, great!']],
    ginger: [["I fixed the bench by the square.", 'Was it broken?', 'It wobbled. A little. In my heart.'], ['I could build you a gazebo.', 'I live in a house.', 'A gazebo INSIDE the house.'],
        ["Hammer's my best friend.", 'Not me?', 'You are tied with the hammer.']],
    brulee: [["The light today is very... museum.", 'What does that mean?', 'It means you should frame it.'], ["I'm curating a new exhibit.", 'Of what?', 'Spoons. Through the ages.'],
        ["Art is everywhere.", 'Even here?', 'Especially here. You are standing very artistically.']],
    mac: [["You look hungry.", "I just ate.", "You look hungry AGAIN."], ['Soup of the day is soup.', 'What kind?', 'The good kind.'],
        ["Nobody leaves my restaurant hungry.", 'What if they do?', 'They come back. They always come back.']],
    joe: [['I saw a frog by the pond today.', 'Was it a poem frog?', 'Every frog is a poem frog.']],
};
for (const [id, list] of Object.entries(CHAT_BY_MORE)) (CHAT_BY[id] = CHAT_BY[id] || []).push(...list);
/* the island's favorite topic: {name} and Joe. Very schoolyard. */
const CHAT_JOE = [
    ['Did you know {name} and Joe like like each other?', "You two are the last to notice."],
    ['I saw {name} and Joe holding hands when they thought no one was looking!', "Aw. Good place for it."],
    ["Joe turned bright red when I said {name}'s name.", 'Oh no way!', 'I said it three more times.', "That's crazy!"],
    ['{name} and Joe sat on the SAME bench. The same one.', "Did they leave room for you?"],
    ['Joe saved {name} the last cookie.', "That's serious, then.", 'It was a BIG cookie.', 'Wow.'],
    ['Do you think {name} LIKE likes Joe?', 'Everybody knows she does.', "I'd ask her, if I were you."],
    ['Joe wrote a poem with a heart on it.', 'Who was it for?', 'Guess.', "I think I can guess."],
];
/* and when Joe's in the chat, somebody always asks (they go first, Joe answers) */
const CHAT_WITH_JOE = [
    ['So, Joe... do you LIKE like {name}?', 'I... have to go write a poem. Right now. Bye.'],
    ['Joe, your face is all red.', "It's the sun.", "It's cloudy.", "It's... a different sun."],
    ['Joe! {name} was looking for you!', 'She was?! I mean. Cool. Cool cool cool.'],
];
/* extra lines for today's holiday (holidays fill this in) */
const CHAT_TODAY = [];

const CHAT_HI = ["Oh! Hi, {name}! We were just talking.", "Oh, hey {name}! Did you hear all that? Ha!", "{name}! Perfect timing. {B} and I were just catching up.",
    "Hi {name}! Don't mind us. Just island gossip.", "Oh! {name}! How long have you been standing there? Hi!"];
const Chats = {
    list: [],
    cool: {},
    free(n) {
        const w = n.want, d = n.def;
        if (n.chat || n.idle || n.talking || n.script || n.path || n.sleeping || d.goat || d.spring || d.dj || d.shop || n.dancer) return false;
        if (w && w.playing) return false;
        if (n.fixed && !(w && (w.seat || w.sit))) return false;
        if ((n.chatCool || 0) > G.frame) return false;
        return !!(TALK[n.id] || d.human);
    },
    pick(A, B) {
        const pool = [], add = (list, wt) => { for (const s of list || []) pool.push([s, wt]); };
        add(CHAT_LINES, 1);
        add(CHAT_BY[A.id], 4);
        const w = G.weather, h = Clock.hourF();
        if (w === 'rain') add(CHAT_RAIN, 6);
        if (w === 'snow') add(CHAT_SNOW, 6);
        if (h >= 21 || h < 4) add(CHAT_NIGHT, 4);
        if (h >= 5 && h < 11) add(CHAT_MORNING, 3);
        if (h >= 17 && h < 21) add(CHAT_EVENING, 3);
        add(CHAT_SEASON[Clock.season()], 2);
        add(CHAT_TODAY, 10);
        for (const [l, w] of bondChats(A, B)) pool.push([l, w]);       // (close friends, or just made up: 6zn_bonds.js)
        if (S.flags.metJoe) {
            if (A.id === 'joe' || B.id === 'joe') add(CHAT_WITH_JOE, 3);
            else add(CHAT_JOE, 1.2);
        }
        // (what was heard lately waits its turn: hearing the same thing twice should be rare; a chat that names one of the two
        // having it is somebody else's, and the café's sign and the plots for sale are news only till they're not, QA, 29 October)
        const stale = l => { const s = [].concat(l).join(' '); return namesSelf(A.id, s) || namesSelf(B.id, s) || (/new sign on Market Lane/.test(s) && cafeOpen())
            || (/sign says for sale/.test(s) && (seafarerHere() || mugHere())); };
        const fresh = pool.filter(([l]) => !this.recent.includes(l) && !stale(l));
        return weighted(fresh.length ? fresh : pool, R);
    },
    recent: [],
    start(A, B) {
        const lines = this.pick(A, B);
        this.recent.push(lines);
        if (this.recent.length > 40) this.recent.shift();
        if (CHAT_WITH_JOE.includes(lines) && A.id === 'joe') { const t = A; A = B; B = t; }
        const c = { a: A, b: B, lines, i: -1, t: 0 };
        A.chat = c; B.chat = c;
        if (!A.want || !(A.want.seat || A.want.sit)) faceNpc(A, B);
        if (!B.want || !(B.want.seat || B.want.sit)) faceNpc(B, A);
        this.list.push(c);
        this.next(c);
    },
    /* (no bubbles over their heads: David, 29 October. They act it out, and what they're saying is heard by walking up
       to them and talking: overhear) */
    next(c) {
        c.i++;
        if (c.i >= c.lines.length) { this.end(c); return; }
        const sp = c.i % 2 === 0 ? c.a : c.b, text = this.lineText(c, c.i);
        sp.hop = 2;
        c.t = c.dur = Math.min(260, 110 + text.length * 2.2); c.text = text;
    },
    lineText(c, i) { const sp = i % 2 === 0 ? c.a : c.b; return voiced(sp.id, fillText(c.lines[i]).replace(/\{A\}/g, c.a.def.name).replace(/\{B\}/g, c.b.def.name)); },
    /* Sarah walks up to two neighbors chatting and talks to one: she hears their whole conversation, the chat waiting on
       each line, and the one she spoke to says hello after */
    async overhear(c, n) {
        c.held = true;
        faceToward(G.player, n);
        for (let i = 0; i < c.lines.length; i++) {
            const sp = i % 2 === 0 ? c.a : c.b;
            c.i = i; c.text = this.lineText(c, i); c.t = c.dur = 200;
            await UI.say(sp.id, c.text, { keep: true });
        }
        const other = n === c.a ? c.b : c.a;
        faceToward(n, G.player);
        await UI.say(n.id, voiced(n.id, fillText(rpick(CHAT_HI)).replace(/\{B\}/g, other.def.name)), { keep: true });
        this.end(c);
    },
    /* two who've fallen out don't stop to chat (6zn_bonds.js) */
    ok(A, B) { return bond(A.id, B.id) > BOND_OUT; },
    end(c) {
        for (const n of [c.a, c.b]) { Bubbles.hide(n); n.chat = null; n.chatCool = G.frame + 60 * 15; }
        if (c.i >= 1) bondChat(c.a, c.b);
        this.cool[[c.a.id, c.b.id].sort().join('+')] = G.frame + 60 * 60;
        this.list = this.list.filter(x => x !== c);
    },
    endAll() { for (const c of this.list.slice()) this.end(c); },
    update() {
        if (G.mode !== 'play') { if (this.list.length) this.endAll(); return; }
        for (const c of this.list.slice()) {
            const gone = [c.a, c.b].some(n => n.talking || n.script || n.path || n.sleeping || n.area !== G.area.id);
            if (gone) { this.end(c); continue; }
            if (!c.held && --c.t <= 0) this.next(c);
        }
        const spirit = townOrd() === 'spirit';         // (Community Spirit: they stop to chat more)
        if (G.frame % (spirit ? 20 : 40) !== 0 || UI.modal || G.busy) return;
        const here = NPCs.here().filter(n => this.free(n));
        if (here.length < 2) return;
        // two people close together start talking
        for (let i = 0; i < here.length; i++) for (let j = i + 1; j < here.length; j++) {
            const A = here[i], B = here[j];
            if (A.chat || B.chat) continue;
            const seated = (A.want && (A.want.seat || A.want.sit)) && (B.want && (B.want.seat || B.want.sit));
            const d = Math.hypot(A.x - B.x, A.y - B.y);
            if (d > (seated ? 52 : 40)) continue;
            if ((this.cool[[A.id, B.id].sort().join('+')] || 0) > G.frame || !this.ok(A, B)) continue;
            if (R() < (bond(A.id, B.id) >= BOND_CLOSE ? 0.85 : 0.6)) { R() < 0.5 ? this.start(A, B) : this.start(B, A); return; }
        }
        // or somebody spots a friend a little way off and walks over
        if (R() < (spirit ? 0.85 : 0.55)) {
            const A = rpick(here.filter(n => !n.fixed && n.anchor));
            if (!A) return;
            // (a close friend first, if one's about)
            const near = n => Math.hypot(n.x - A.x, n.y - A.y) - Math.max(0, bond(A.id, n.id)) * 12;
            const B = here.filter(n => n !== A && !n.chat && this.ok(A, n) && Math.hypot(n.x - A.x, n.y - A.y) < 170 && Math.hypot(n.x - A.x, n.y - A.y) > 34)
                .sort((p, q) => near(p) - near(q))[0];
            if (!B || (this.cool[[A.id, B.id].sort().join('+')] || 0) > G.frame) return;
            const a = G.area, bx = Math.floor(B.x / TILE), by = Math.floor((B.y - 2) / TILE);
            const side = A.x < B.x ? -1 : 1;
            for (const [tx, ty] of [[bx + side, by], [bx - side, by], [bx, by + 1]]) {
                if (a.blockedAt(tx, ty)) continue;
                const path = findPath(a, Math.floor(A.x / TILE), Math.floor((A.y - 2) / TILE), tx, ty, 1500);
                if (!path || !path.length || path.length > 16) continue;
                A.path = path; A.dest = [(tx + 0.5) * TILE, (ty + 0.5) * TILE + 4];
                A.onArrive = () => { if (this.free(A) && this.free(B) && Math.hypot(A.x - B.x, A.y - B.y) < 48) this.start(A, B); };
                A.chatCool = G.frame + 60 * 8;
                return;
            }
        }
    },
};

/* now and then a neighbor wanders over to a fruit tree, gives it a shake and picks up what falls (David, 27 October):
   fruit only, never anything that matters, a couple of times a day at most, and only once the island has more than one
   fruit tree with fruit on it */
const TreeShakers = {
    day: -1, n: 0,
    LINES: ['Snack time!', 'Ooh, ripe ones!', "Don't mind me!", 'Just one or two...', 'Yum!'],
    update() {
        if (G.mode !== 'play' || G.area.id !== 'island' || UI.modal || G.busy || G.frame % 300 !== 150) return;
        const day = Clock.dayNum();
        if (this.day !== day) { this.day = day; this.n = 0; }
        if (this.n >= 2 || R() > 0.3) return;
        const a = G.area, trees = a.ents.filter(e => e.kind === 'fruittree' && e.fruit && e.id && treeHasFruit(e));
        if (trees.length < 2) return;
        const who = NPCs.here().filter(n => Chats.free(n) && !n.fixed && n.anchor && !n.def.human);
        if (!who.length) return;
        const n = rpick(who), p = G.player;
        // (a tree near them, but not the one Sarah's standing at)
        const t = trees.filter(e => Math.hypot(e.x - n.x, e.y - n.y) < 12 * TILE && Math.hypot(e.x - p.x, e.y - p.y) > 3 * TILE)
            .sort((u, v) => Math.hypot(u.x - n.x, u.y - n.y) - Math.hypot(v.x - n.x, v.y - n.y))[0];
        if (!t) return;
        const tx = Math.floor(t.x / TILE), ty = Math.floor((t.y - 2) / TILE);
        for (const [cx, cy] of [[tx, ty + 1], [tx - 1, ty], [tx + 1, ty]]) {
            if (a.blockedAt(cx, cy)) continue;
            const path = findPath(a, Math.floor(n.x / TILE), Math.floor((n.y - 2) / TILE), cx, cy, 2000);
            if (!path || path.length > 24) continue;
            this.n++;
            n.path = path; n.dest = [(cx + 0.5) * TILE, (cy + 0.5) * TILE + 4];
            n.chatCool = G.frame + 60 * 40;
            n.onArrive = () => { if (!n.talking && !n.chat && treeHasFruit(t)) this.shake(n, t); };
            return;
        }
    },
    async shake(n, t) {
        n.script = true; n.moving = false;
        faceNpc(n, t);
        n.pose = 'shake';
        await waitFrames(6);
        t.shake = 28;
        const p = G.player, near = Math.hypot(t.x - p.x, t.y - p.y) < 10 * TILE;
        if (near) Sfx.play('rustle');
        await waitFrames(20);
        if (!treeHasFruit(t)) { n.pose = null; n.script = false; return; }
        S.trees[t.id] = Clock.dayNum();
        Save.touch();
        const drops = [[-8, 12], [8, 13]].map(([ox, oy]) => G.area.solidPx(t.x + ox, t.y + oy - 2) ? null : spawnDrop(t.fruit, t.x + ox, t.y + oy, false, TREE_FALL)).filter(Boolean);
        n.pose = null;
        await waitFrames(30);
        // (whatever Sarah hasn't got to first)
        n.pose = 'pick';
        await waitFrames(16);
        for (const d of drops) if (G.area.ents.includes(d)) G.area.remove(d);
        n.pose = null; n.emote = 'heart'; n.emoteT = 50;
        if (near && !n.chat) { Bubbles.show(n, voiced(n.id, rpick(this.LINES))); setTimeout(() => { if (!n.chat) Bubbles.hide(n); }, 2200); }
        n.script = false;
    },
};

/* speech bubbles are little HTML labels over the canvas, so the text stays sharp */
const Bubbles = {
    root: null, map: new Map(),
    ensure() {
        if (this.root) return this.root;
        const r = document.createElement('div');
        r.id = 'bubbles';
        r.setAttribute('aria-live', 'polite');
        $('#game').after(r);
        this.root = r;
        return r;
    },
    show(n, text) {
        this.hide(n);
        const b = document.createElement('div');
        b.className = 'chatb';
        b.textContent = text;
        this.ensure().appendChild(b);
        this.map.set(n, b);
        this.place(n, b);
    },
    hide(n) { const b = this.map.get(n); if (b) { b.remove(); this.map.delete(n); } },
    clear() { for (const b of this.map.values()) b.remove(); this.map.clear(); },
    place(n, b) {
        const lift = (n.def.human ? 30 : (n.def.h || 16) + 8) + (isSeated(n) ? -4 : 0);
        const [sx, sy] = screenOf(n.x, n.y, lift);
        b.style.transform = `translate(${Math.round(sx)}px, ${Math.round(sy)}px) translate(-50%, -100%)`;
    },
    update() {
        if (!this.map.size) return;
        const hideAll = UI.modal || G.fade > 0.5;
        for (const [n, b] of this.map) {
            if (n.area !== G.area.id || n.sleeping) { this.hide(n); continue; }
            b.style.visibility = hideAll ? 'hidden' : '';
            this.place(n, b);
        }
    },
};

