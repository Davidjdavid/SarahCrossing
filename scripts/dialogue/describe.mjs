// Who says each line and when, in plain words, from where it sits in the code (extract.mjs): the table it's in and the
// keys on the way to it, the function round it, the call it's passed to. The tables below are written by hand from
// reading the game; anything they don't know gets a description made from the function's name.
import { NPCS } from './extract.mjs';

const VISITORS = { david: 'David', james: 'James', john: 'John', joe: 'Joe', elizabeth: 'Elizabeth', sarah: 'Sarah' };
const EXTRA = { sign: 'A sign', board: 'Island board', phone: 'Phone', council: 'The Cozy Council', floret: 'Sir Floret', stalk: 'Dame Stalk', sprout: 'Little Sprout', everyone: 'Everyone', plaque: 'The plaque', ghost: 'The old keeper', sarah: 'Sarah', goat: 'The goat' };
const nameOf = id => NPCS[id] || EXTRA[id] || VISITORS[id] || id;

/* the part of the game each file is */
const AREA = {
    '02_data': 'Items', '03_text': 'Talking', '20_world': 'Around the island', '22_npc': 'Neighbors', '23_items': 'Items',
    '24_places': 'Buildings', '24b_civic': 'Town Hall, Post Office, Bank', '25_house': "Sarah's house", '26_rooms': 'Inside buildings',
    '28_visits': 'Neighbors visiting Sarah', '29_forest': 'Trees and digging', '2a_flowers': 'Flowers', '2b_exterior': 'Houses',
    '2c_builder': "Ginger's workshop", '2d_life': "Neighbors' days", '40_ui': 'Screens', '41_menus': 'The phone', '50_talk': 'Talking',
    '51_fishing': 'Fishing', '52_dance': 'Club Wasabi', '53_council': 'The Cozy Council', '54_events': 'Island events',
    '55_photo': 'Photos', '56_drama': 'Island drama', '57_pottery': "Sully's pottery studio", '58_potterygames': 'Pottery',
    '59_arcade': 'The arcade', '60_audio': 'Music', '61_arcadegames': 'Arcade games', '62_rope': 'Jump rope', '63_karaoke': 'Karaoke',
    '64_restaurant': "Mac's restaurant", '65_museum': 'The museum', '66_holidays': 'Holidays', '67_laptop': "Sarah's laptop",
    '68_rescue': 'Going home', '69_texts': 'Texting', '6a_bigmap': 'The map', '6b_farm': 'The farm', '6c_lost': 'Lost and found',
    '6d_colors': 'Colors', '6e_sewing': 'Sewing', '6f_paths': 'Paths', '6g_move': 'Moving buildings', '6h_camp': 'Statue, bonfire, campsite',
    '6i_salon': 'The salon', '6j_displays': "Waffle's displays", '6l_intro': 'The opening', '6m_specials': 'Specials',
    '6n_requests': 'Favors', '6o_topics': 'Talking', '6p_quests': 'Mysteries', '6q_world': 'Around the island', '6r_seaview': 'The sea view',
    '6t_cooking': 'Cooking', '6u_outings': 'Outings', '6v_stack': 'Snack Stack (arcade)', '6w_extras': 'Extras', '6y_visitors': 'Visitors',
    '6z_arcade2': "Arcade games (the back room's classics)", '6z_back_dumpling': 'Dumpling Drop (arcade)', '6z_back_fortune': 'Fortune Falls (arcade)',
    '6z_back_sushi': 'Sushi Swap (arcade)', '6z_backroom': "The arcade's back room", '6z_festivals': 'Festivals', '6z_shops': 'Shop upgrades',
    '6z_talk_more': 'Talking', '6zgb_projects': 'Town projects', '6zr_seafarer': 'Captain Shrimpy', '6zs_mug': "Muggy and the café",
    '6zgc_statue': 'The statue on the square',
    '6zgd_lostfound': "The Town Hall's Lost and Found",
};

/* what a key on the way to a line means */
const KEY = {
    intro: 'the first time Sarah talks to them', chat: 'everyday chat', rain: 'when it rains', night: 'at night', winter: 'in winter',
    asleep: 'when Sarah finds them asleep', loveLine: 'given a gift they love', likeLine: 'given a gift they like', dislikeLine: 'given a gift they dislike',
    letter: 'a letter they mail Sarah', greet: 'saying hello', bye: 'saying goodbye', hug: 'hugged', meet: 'meeting this visitor for the first time',
    hi: 'saying hello to this visitor', dawn: 'early morning (4 to 8 AM)', morning: 'in the morning (8 AM to noon)', afternoon: 'in the afternoon (noon to 5 PM)',
    evening: 'in the evening (5 to 9 PM)', late: 'late at night (9 PM to 4 AM)', sunny: 'on a sunny day', cloudy: 'on a cloudy day', snow: 'when it snows',
    spring: 'in spring', summer: 'in summer', fall: 'in fall', myhome: 'at their own home', doorstep: 'on their doorstep', work: 'at their work',
    sum: "(the storyline's summary in the Drama list)", gossip: 'a bystander gossiping about it', label: "(Sarah's choice)", say: 'after Sarah picks this',
    text: '', react: 'reacting to what Sarah passed on', name: '(its name)', note: '(the note on the island board)', hello: 'saying hello that day',
    title: '(a title)', desc: '(a description)', hint: '(a hint)', how: '(how to get it)', what: '(what it is)', about: '(what it is)',
    house: 'about his house', sunset: 'at sunset', beforePoem: 'before reading a poem', afterPoem: 'after reading a poem', pda: 'with Sarah, sweetly',
    takeout: 'bringing takeout', gift: 'giving a gift', any: '', david: 'to David', james: 'to James', john: 'to John', joe: 'to Joe', elizabeth: 'to Elizabeth',
};
const SPOT = { spring: 'at the hot spring', pond: 'by the pond', statue: "by David's statue", forest: 'in the forest', meadow: 'in the meadow', board: 'by the island board',
    studio: 'at the pottery studio', restaurant: "at Mac's", museum: 'in the museum', museumfront: 'outside the museum', arcade: 'in the arcade', shop: "in Fortune's shop",
    beach: 'on the beach', pier: 'on the pier', waterfall: 'by the waterfall', harbor: 'at the harbor', bonfire: 'by the bonfire', boardwalk: 'on the boardwalk',
    river: 'by the river', club: 'in the club', garden: 'in the garden', plaza: 'in the square', farm: 'on the farm', work: 'at their work', clubfront: 'outside the club',
    lookout: 'at the lookout', boutiquefront: "outside Clementine's", salon: 'in the salon', salonfront: 'outside the salon', jog: 'out jogging', orchard: 'in the orchard',
    mountain: 'on the mountain', bridge: 'on a bridge', campsite: 'at the campsite', arcadefront: 'outside the arcade', goatpen: "by the goat's pen",
    displaysfront: "outside Waffle's", boutique: "in Clementine's", shopfront: "outside Fortune's", restaurantfront: "outside Mac's", home: 'at home',
    builder: "at Ginger's workshop", displays: "at Waffle's", lighthouse: 'at the lighthouse', barn: 'in the barn', windmill: 'by the windmill',
    myhome: 'at their own home', doorstep: 'on their doorstep' };
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const words = k => KEY[k] != null ? KEY[k] : k.replace(/^acc:|^eyes:/, '').replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
const idx = (ch, n) => { const a = ch.filter(c => /^\[\d+\]$/.test(c)).map(c => +c.slice(1, -1)); return a[n] != null ? a[n] : null; };

/* the tables: who says their lines (an id, 'npc' for the neighbor named in the keys, 'narr', 'any', 'label', 'sarah'...) and when */
const T = {
    FORTUNES: ['narr', 'A fortune cookie or fortune message'],
    TALK: ['npc', (r, k) => k.map(words).filter(Boolean).join(', ') || 'everyday chat'],
    JOE_GOSSIP: ['any', 'Teasing Sarah about her and Joe (very schoolyard)'],
    GOSSIP_EXTRA: ['any', 'Extra gossip about Sarah and Joe'],
    TITLE_GUESS: ['any', "Guessing what Sarah's new title means"],
    EARLY_JOKES: ['any', 'A joke about being up early'],
    OUTFIT_TALK: ['any', (r, k) => `Noticing Sarah's outfit: ${k.map(words).join(' ')}`],
    JOE: ['joe', (r, k) => 'Joe: ' + (k.map(words).filter(Boolean).join(', ') || 'chat')],
    JOE_POEMS: ['joe', (r, k, ch) => idx(ch, 1) === 0 ? `Joe's poem #${idx(ch, 0) + 1}: its title (he reads a poem when Sarah asks)` : `Joe's poem #${idx(ch, 0) + 1}, line ${idx(ch, 2) + 1}`],
    JOE_SUNSET_POEM: ['joe', "Joe's sunset poem"],
    JOE_FRAMED: ['joe', "The framed poem Joe gives Sarah"],
    BIRTHDAY_POEM: ['joe', "Joe's birthday poem for Sarah"],
    PHOTO_NOTES: ['narr', 'The note on a photo a neighbor gives Sarah'],
    FAMILY: ['npc', (r, k) => "Sarah's family visiting on the boat: " + (k.map(words).filter(Boolean).join(', ') || 'chat')],
    GOAT_PETS: ['narr', 'Sarah pets the goat'],
    IG_ASK: ['npc', 'Now and then, asking Sarah to play a game when she talks to them'],
    IG_ASK_VS: ['npc', 'Asking Sarah to play an arcade game against them on their handheld'],
    IG_ASK_ROPE: ['npc', 'Asking Sarah to jump rope, with a friend of theirs turning'],
    PROJECTS: ['label', 'A town project at the Town Hall: its name, where it goes and a line about it'],
    PROJECT_DONE_LOG: ['label', "A line in the island's history when a town project is built"],
    PROJECT_MAIL: ['floret', "The Cozy Council's letter the morning a town project is finished"],
    WEAR_LINES: ['any', 'A neighbor puts on an accessory Sarah gave them'],
    HARVARD_MAIL: ['narr', 'A letter from Harvard in the mail'],
    PROP_TALK: ['narr', (r, k) => `Sarah looks at something on the island: ${k.map(words).join(' ')}`],
    BOAT_TALK: ['narr', "Sarah looks at her sailboat at the pier"],
    sights: ['narr', 'Something Sarah sees through the telescope'],
    NPC_DEFS: ['narr', "A neighbor's description"],
    KNOCK: ['narr', (r, k) => `Sarah knocks on ${nameOf(k[0])}'s door while they're out`],
    SIGNS: ['sign', 'A sign Sarah reads'],
    CIVIC_SIGNS: ['sign', 'The sign on the Town Hall, Post Office or Bank door (for now)'],
    HOUSE_HELLO: ['npc', 'Welcoming Sarah into their house'],
    HONOR: ['narr', "Nobody's at the shop counter, so it runs on the honor system"],
    FURN_GIFT: ['npc', 'Sarah gives them furniture for their house'],
    VISIT_KNOCK: ['npc', "Knocking on Sarah's door to visit her"],
    VISIT_LOVE: ['npc', "Visiting Sarah's house: what they think of it"],
    VISIT_BYE: ['npc', "Leaving Sarah's house after a visit"],
    Visits: ['npc', "Visiting Sarah's house"],
    HOUSE_TIPS: ['narr', "Tips in Ginger's house editor"],
    ExtEditor: ['narr', "Ginger's house editor"],
    HOUSE_LOVE_LINE: ['npc', 'Seeing their house after Sarah had Ginger redo it'],
    BENCH_BUDDY: ['npc', 'Sitting on a bench next to Sarah'],
    CHAT_LINES: ['any', 'Two neighbors chatting with each other (speech bubbles; lines take turns)'],
    CHAT_RAIN: ['any', 'Two neighbors chatting in the rain (speech bubbles)'],
    CHAT_SNOW: ['any', 'Two neighbors chatting in the snow (speech bubbles)'],
    CHAT_NIGHT: ['any', 'Two neighbors chatting at night (speech bubbles)'],
    CHAT_MORNING: ['any', 'Two neighbors chatting in the morning (speech bubbles)'],
    CHAT_EVENING: ['any', 'Two neighbors chatting in the evening (speech bubbles)'],
    CHAT_SEASON: ['any', 'Two neighbors chatting about the season (speech bubbles)'],
    CHAT_BY_MORE: ['npc', 'Starting a chat with another neighbor (speech bubbles)'],
    IDLE_HELLO: ['any', 'A neighbor Sarah walks up to in the middle of something of their own (stargazing, an ice cream, their phone, a book, sitting on the grass, painting, a mug of cocoa)'],
    VAC: ['npc', "A neighbor's postcard from their vacation (mail)"],
    CATCH: ['npc', "A neighbor's own catchphrase, said at the end of some of their lines"],
    CATCH_REACT: ['npc', 'A good friend takes the new catchphrase Sarah gave them ({c} is the catchphrase)'],
    NICK_IDEAS: ['npc', 'The nickname a good friend would like to call Sarah'],
    MEM_LINES: ['any', 'A neighbor brings up something they did with Sarah in the last week ({when} is yesterday, the other day or last week; {item} the present, {game} the game, {what} the thing she found for them)'],
    GAME_WORDS: ['any', 'The name of a game a neighbor played with Sarah, as they remember it'],
    MISSED_LINES: ['any', "A neighbor greets Sarah after she hasn't been by for more than three weeks"],
    WHALE_TALK: ['npc', 'Some winter and spring days, when a whale is out at sea, a neighbor talks about it (_ is everyone without their own)'],
    FAV_SPOT: ['npc', 'At two hearts a neighbor tells Sarah their favorite spot on the island (once; then they invite her there to hang out)'],
    ADVICE: ['npc', 'At three hearts a neighbor asks Sarah for advice (once): the question, her two answers, their reaction to each'],
    CHAT_CLOSE: ['any', 'Two close friends chatting with each other (speech bubbles; lines take turns)'],
    CHAT_MENDED: ['any', "Two neighbors chatting in the days after they made up from a falling-out (speech bubbles)"],
    BOND_BEST: ['any', "A neighbor mentions their best friend on the island ({B})"],
    BOND_SPAT: ['any', "A neighbor mentions the neighbor they've fallen out with ({B}); it mends in a few days"],
    LUNAR_LINES: ['any', 'A neighbor hands Sarah a red envelope on Lunar New Year (the first time they see her that day)'],
    VAL_LINES: ['npc', "A neighbor takes the valentine Sarah gives them on Valentine's Day (_ is everyone without their own)"],
    GATHER_LINES: ['any', "A neighbor out with everyone on New Year's Eve, the Fourth of July or Stargazing Night, when Sarah comes by (speech bubble)"],
    NYE_LINES: ['any', "A neighbor on the square just after the New Year's countdown (speech bubble)"],
    HOUSE_GIFT_LINE: ['any', 'At four hearts a neighbor says they mailed Sarah something for her house (once)'],
    BEST_FRIEND: ['npc', 'At five hearts a neighbor tells Sarah she is their best friend (once; _ is everyone without their own)'],
    AQUARIUM: ['sign', "The card on one of the museum aquarium's tanks (the tank's name and a line about it)"],
    MUSEUM_HISTORY: ['sign', "The card in a glass case in the museum's island history wing, once that old mystery is solved"],
    CHAT_BY: ['npc', 'Starting a chat with another neighbor (speech bubbles)'],
    CHAT_JOE: ['any', 'Two neighbors chatting about Sarah and Joe (speech bubbles)'],
    CHAT_WITH_JOE: ['any', "A neighbor asks Joe about Sarah, Joe answers (speech bubbles)"],
    Bubbles: ['any', 'A speech bubble'],
    FORTUNE_CHAT: ['fortune', "Fortune chatting at the shop"],
    FISH_QUIPS: ['narr', 'Catching a fish'],
    Fishing: ['narr', 'Fishing'],
    MOVES: ['label', 'A dance move at Club Wasabi'],
    SONGS: ['label', 'A song at Club Wasabi'],
    Dance: ['wasabi', 'The dance game at Club Wasabi'],
    TIER_NAMES: ['label', "The Cozy Council's ratings"],
    Sky: ['narr', 'Shooting stars and fireworks'],
    FILTERS: ['label', 'A photo filter'],
    Photo: ['narr', 'Taking photos'],
    TRAIT: ['label', 'Words for each neighbor in drama lines'],
    DRAMA_BITS: ['label', 'Fill-ins for the drama storylines (what they argue about, what was borrowed...)'],
    DRAMAS: ['drama', null],
    PARTY_LINES: ['everyone', 'At a surprise party'],
    Drama: ['any', 'Island drama'],
    POTTERY_TIPS: ['sully', 'Pottery tips at the studio'],
    POT_LOVES: ['npc', 'Sarah gives them pottery she made'],
    Wheel: ['narr', 'The pottery wheel'],
    Sculpt: ['narr', 'Hand-building and sculpting pottery'],
    Glaze: ['narr', 'Glazing pottery'],
    CHILI_ARCADE: ['chili', 'Chili at the arcade'],
    CHILI_BACK: ['chili', "Chili at the arcade, once the back room's open"],
    BACK_CHAT: ['npc', "Talking about the back room's old games, once it's open"],
    PLUSH_SELF: ['npc', 'Seeing a plush of themselves'],
    ARCADE_CHAT: ['npc', 'Talking about the arcade'],
    Arcade: ['narr', 'An arcade cabinet'],
    HISCORE_RIVALS: ['npc', "The arcade's high score board: who holds the records"],
    DANCE_TUNES: ['label', 'A dance tune'],
    ROPE_TALK_CUKE: ['cuke', 'Jump rope with Cuke'],
    ROPE_TALK: ['npc', 'Jump rope'],
    Rope: ['narr', 'Jump rope'],
    JOE_KARAOKE: ['joe', 'Karaoke night'],
    Karaoke: ['narr', 'Karaoke'],
    INVITE_YES: ['npc', "Sarah texts them to join her at Mac's, and they say yes"],
    INVITE_NO: ['npc', "Sarah texts them to join her at Mac's, and they can't"],
    INVITE_DINE: ['npc', "Eating with Sarah at Mac's"],
    DINE_TALK: ['npc', "Eating with Sarah at Mac's"],
    ART_IDEAS: ['brulee', 'Ideas for a painting'],
    ART_STARTERS: ['label', 'Paintings in the museum'],
    NPC_ART: ['label', "A neighbor's painting in the museum (its title and card)"],
    Painter: ['narr', 'Painting at the easel'],
    WALL_SPOT_NAMES: ['label', 'Places on the museum walls'],
    HOLIDAYS: ['holiday', null],
    NPC_DAY: ['npc', "Their own holiday: giving Sarah something"],
    PLACE_HOURS: ['label', "Opening hours on the island board"],
    PLACE_NAMES: ['label', 'Where someone is, in a text'],
    ROOM_PLACE: ['label', 'Where someone is, in a text'],
    TEXT_ASK: ['label', 'What Sarah can text a neighbor'],
    TEXT_REPEAT: ['any', 'Sarah texts the same question again'],
    TEXT_REPEAT_OWN: ['npc', 'Sarah texts them the same question again'],
    BigMap: ['narr', 'The big map'],
    FARM_LINES: ['narr', (r, k) => `Sarah looks at something on the farm: ${k.map(words).join(' ')}`],
    SNOOP_IN: ['narr', "Sarah lets herself into a neighbor's house while they're out"],
    CAUGHT: ['npc', 'Coming home to find Sarah in their house'],
    NAME_IDEAS: ['label', 'Names for colors'],
    SEW_STYLES: ['label', 'Sewing styles'],
    SEW_NOTES: ['narr', 'Sewing'],
    Sewing: ['clementine', 'Sewing at the sewing machine'],
    PathTool: ['narr', 'Laying paths'],
    BLD_NAMES: ['label', 'Building names'],
    Mover: ['narr', 'Moving a building'],
    PLAQUE_LINES: ['plaque', "David's statue's plaque"],
    TIP_COLORS: ['label', 'Hair colors at the salon'],
    Salon: ['floss', 'The salon chair'],
    FLOSS_CHAT: ['floss', 'Floss chatting at the salon'],
    DISPLAYS: ['narr', (r, k) => "Waffle's displays: " + k.map(words).filter(Boolean).join(', ')],
    WAFFLE_CHAT: ['waffle', "Waffle chatting at the shop"],
    IslandEdit: ['narr', 'Island edit mode'],
    IntroScene: ['narr', 'The opening scene'],
    SPECIAL_BLURB: ['label', 'Describing a special'],
    QUEST_ITEM_DESC: ['label', "A mystery's item, described"],
    FRUIT_HINT: ['any', 'A favor: asking for fruit'],
    DELIVER_THINGS: ['label', 'Things to deliver in a favor'],
    TELL_MSGS: ['any', 'A favor: a message to pass on'],
    Requests: ['any', (r, k) => 'A favor a neighbor asks: ' + k.map(words).filter(Boolean).join(', ')],
    OPENERS: ['npc', 'Saying hello when Sarah starts talking to them'],
    greet: ['any', 'Saying hello'],
    TOO_SOON_ANY: ['any', 'Sarah talks to them again too soon (talk rests 5 minutes)'],
    TOO_SOON: ['npc', 'Sarah talks to them again too soon (talk rests 5 minutes)'],
    BAD_GIFT: ['any', 'A gift that makes no sense'],
    BAD_GIFT_OWN: ['npc', (r, k) => "A gift that makes no sense: " + k.map(words).filter(Boolean).join(', ')],
    PANTRY_GIFT: ['any', (r, k) => "Given a pantry basic as a gift: " + k.map(words).join(', ')],
    JOE_GIFT: ['joe', 'Any gift (he loves them all)'],
    JOE_KEEP_IT: ['joe', 'Given something Sarah needs (he gives it back, lovingly)'],
    JOE_KEEPSAKE_POEMS: ['joe', 'A keepsake inspires a poem'],
    HARVARD_FACTS: ['any', 'Harvard facts'],
    HARVARD_JOKES: ['any', 'Harvard jokes'],
    BOSTON_FACTS: ['sully', 'Boston facts'],
    TREK_LINES: ['any', 'Star Trek talk'],
    TAMA_LINES: ['any', 'Tamagotchi talk'],
    FRASIER_LINES: ['any', 'Frasier talk'],
    POTTERY_LINES: ['any', 'Talking about pottery'],
    JOE_PRAISE: ['any', "Praising Joe's poems"],
    JOE_PRAISE_OWN: ['npc', "Praising Joe's poems"],
    JOE_ON_POEMS: ['joe', 'Joe on his own poems'],
    WEATHER_TALK: ['any', (r, k) => 'The weather: ' + k.map(words).join(', ')],
    SEASON_TALK: ['any', (r, k) => 'The season: ' + k.map(words).join(', ')],
    TIPS: ['any', 'A tip about how something works'],
    PLACE_TALK: ['any', (r, k) => 'Talking to Sarah ' + k.map(x => SPOT[x] || words(x)).join(', ')],
    TALK_MORE: ['npc', 'Everyday chat'],
    QUEST_INFO: ['label', "A mystery's title and notes"],
    QUEST_RUMORS: ['any', 'Rumors about the island mysteries'],
    TRADE_LINES: ['any', "The goat's trading quest"],
    Quests: ['narr', 'The island mysteries'],
    LH_LINES: ['narr', 'The lighthouse'],
    BONUSES: ['label', 'Food boosts'],
    SeaView: ['narr', 'Looking out to sea'],
    CK: ['narr', 'Cooking steps'],
    COOK_PLANS: ['label', 'Recipe steps'],
    COOK_LINES: ['narr', 'Cooking'],
    OUTING_PLACE: ['label', 'Outing places'],
    OUTING_TALK: ['any', 'Found out on an outing with friends'],
    TRACK_NAMES: ['label', 'Music app track names'],
    MUSIC_PLACES: ['label', 'Music app places'],
    QUEST_GUIDE: ['narr', 'The spoiler guide'],
    INV_LINES: ['npc', (r, k) => 'Texting Sarah to invite her: ' + k.filter(x => x !== '_').map(words).join(', ')],
    INV_YES: ['npc', 'Sarah says yes to an invite'],
    INV_NO: ['npc', 'Sarah says no to an invite'],
    INV_MISS: ['npc', "Sarah said yes but didn't come"],
    INV_SCENE: ['npc', (r, k) => 'Sarah came to the invite: ' + k.filter(x => x !== '_').map(words).join(', ')],
    Invites: ['narr', 'Invites by text'],
    VISIT_TALK: ['npc', (r, k) => 'Talking to a visitor (David, James, John, Joe or Elizabeth playing): ' + k.map(words).filter(Boolean).join(', ')],
    GUEST_PROMPT: ['any', "Talking to a visitor: nothing particular to say"],
    GUEST_BYE: ['any', 'Saying goodbye to a visitor'],
    FF_SLIPS: ['label', 'Fortune Falls slips'],
    FF_BOARDS: ['label', 'Fortune Falls boards'],
    SUSHI_SAY: ['label', 'Sushi Swap'],
    FEST_PRIZES: ['label', 'Festival prizes'],
    FishOff: ['kai', 'The Fish-Off'],
    COSTUMES: ['label', "Neighbors' Halloween costumes"],
    TOY_THANKS: ['npc', 'Toy Day: Sarah delivers their present'],
    SHOP_UP: ['narr', 'A shop grows'],
    RENO_MAIL: ['narr', 'A letter about a shop growing'],
    ITEM_TYPES: ['label', 'Kinds of items'],
    JOB_TITLES: ['label', 'Job titles'],
    TM_MORE: ['npc', 'Everyday chat'],
    TM_HOUR: ['npc', (r, k) => 'Chat ' + k.map(words).join(' ')],
    TM_WEATHER: ['npc', (r, k) => 'Chat ' + k.map(words).join(' ')],
    TM_SEASON: ['npc', (r, k) => 'Chat ' + k.map(words).join(' ')],
    TM_SPOT: ['npc', (r, k) => 'Talking to Sarah ' + k.map(x => SPOT[x] || words(x)).join(' ')],
    TM_FRIEND: ['npc', (r, k, ch) => `How good friends they are: ${['0 to 1', '2 to 3', '4 to 5'][idx(ch, 0)] || ''} hearts`],
    TM_SHARE: ['npc', (r, k, ch) => `Something personal they share once, at ${idx(ch, 0) ? 'five' : 'four'} hearts (lines in order)`],
    TM_WEAR: ['npc', (r, k) => "What Sarah's wearing: " + k.map(words).join(' ')],
    TM_DAYS: ['npc', (r, k, ch) => `How long Sarah has lived here: ${['the first week', 'a week to two months', 'over two months'][idx(ch, 0)] || ''}`],
    TM_HOUSE: ['npc', (r, k, ch) => `Sarah's house: ${['still the first house', 'made bigger once or twice', 'made bigger three times or more'][idx(ch, 0)] || ''}`],
    TM_TODAY: ['npc', (r, k) => 'What Sarah did today: ' + k.map(words).join(' ')],
    TM_MY_DAY: ['npc', 'Their own holiday'],
    TM_THEIR_DAY: ['any', (r, k) => `On ${nameOf(k[0])}'s day, others talk about it`],
    TM_HOL: ['npc', (r, k) => 'On a holiday: ' + k.map(words).join(' ')],
    TM_SOLVED: ['npc', (r, k) => 'After Sarah solved a mystery: ' + k.map(words).join(' ')],
    TM_WEEK: ['npc', (r, k) => 'On a ' + (DAYS[k.find(x => /^\d$/.test(x))] || 'day of the week')],
    TM_ABOUT: ['npc', (r, k) => k[0] && k[0] !== 'any' ? `${nameOf(k[0])} is nearby` : 'Someone else is nearby ({who})'],
    lines: ['npc', null], special: ['narr', null], opts: ['label', null], hi: ['npc', null], use: ['narr', null], what: ['label', null],
    map: ['label', null], notes: ['narr', null], cost: ['label', null], fam: ['npc', null], inside: ['narr', null], how: ['label', null], Decor: ['narr', 'Decorating'],
    HUD: ['label', 'The HUD'], SPEAKERS: ['label', 'Speaker names'],
    AREA_TALK: ['any', (r, k) => 'A neighbor who happens to be ' + k.map(x => SPOT[x] || words(x)).join(' ')],
};

/* functions (when no table says): who and when */
const F = {
    lookoutTelescope: ['narr', 'Looking through the telescope at the lookout'], useTelescope: ['narr', 'Using the lookout telescope'],
    boardedLighthouse: ['sign', 'The lighthouse door, boarded up until the town restores it'], swingOn: ['narr', 'Swinging on the swing set (a town project)'],
    hammock: ['narr', 'Lying in the hammock on the beach (a town project)'], clock: ['narr', 'Looking at the park clock (a town project)'],
    shrine: ['narr', 'The stone tablet on the mountain top: reading it, making a wish once a day (a town project)'], statue: ['narr', "Sarah's statue on the square (the last town project)"],
    seaTalk: ['scampi', "Captain Shrimpy's story: found washed up, the day's job for his new ship (logs, meals, gems), asking to stay"],
    seaDepart: ['scampi', 'Captain Shrimpy sails off in his new ship, with a parting gift (or a letter if Sarah missed it)'],
    seaMoveIn: ['scampi', "Captain Shrimpy's letter the morning he moves in"], seaRefresh: ['narr', "Looking at Captain Shrimpy's wreck or his ship taking shape on the beach"],
    pickSea: ['scampi', 'Captain Shrimpy, while his ship is being built'],
    mugTick: ['brulee', "Brulee's letter once the museum has twenty gifts and a full pottery hall"], mugStory: ['brulee', "Brulee tells of the island's old dig and asks Sarah to find the pot's pieces"],
    mugOptions: ['brulee', "Asking Brulee about the museum's old pot"], mugDig: ['narr', 'Digging up an X in the ground: a piece of the old pot'],
    mugMend: ['brulee', 'Brulee fetches Sully, who mends the five pieces with gold: a giant mug'], mugVisit: ['mug', 'The day after it is mended, the mug comes to find Sarah: it was alive all along'],
    mugAsk: ['mug', 'The mug asks to stay and open a coffee shop'], mugTalk: ['mug', 'The mug, before it moves in'], mugMoveIn: ['mug', "Muggy's letter the morning the café opens"],
    cafeMenu: ['mug', "Buying a coffee at Muggy's"], buildCafeRoom: ['narr', "Looking at things in Muggy's café"], coffeeBoost: ['narr', 'A coffee perks Sarah up'],
    addMugX: ['narr', 'An X scratched in the ground'],
    seaStall: ['scampi', "Shrimpy's stall at the farm: the season's seeds and one of his recipes"],
    cafeInvite: ['narr', "Texting a friend to come for a coffee at Muggy's (their answers)"], cafeSit: ['narr', "A coffee at the table by the window in Muggy's, with a friend or alone"],
    statueCongrats: ['floret', 'The Council at the Town Hall, the day after the statue goes up: congratulations, and a new one any time'],
    statueWords: ['narr', "The statue's plaque, for whoever is up there"], STATUE_MAIL: ['floret', "Sir Floret's letter the morning a new statue goes up"],
    statueTick: ['narr', 'The town history, when a new statue goes up'],
    lostFoundTick: ['floret', "Sir Floret's letter the morning the Council finds things left out on the island"], shopOrderTalk: ['fortune', 'Fortune puts the order in for a bigger shop (a week in, and later)'],
    historyCase: ['narr', "An island history case in the museum, looked into"],
    buildIsland: ['narr', 'Trying to chop the big tree'], visitNote: ['label', 'A note that someone is visiting'],
    addItem: ['narr', 'Getting an item'], addMoney: ['narr', 'Getting sand dollars'], receive: ['narr', 'Pockets full'], shakeTree: ['narr', 'Shaking a tree'],
    usePlot: ['narr', 'A garden plot'], enterBuilding: ['narr', 'Going into a building'], knock: ['narr', "Knocking on a neighbor's door"],
    useFurniture: ['narr', "Using furniture in Sarah's house"], accTable: ['clementine', "The accessories table at Clementine's"],
    buildBoutiqueRoom: ['clementine', "Inside Clementine's boutique"], buyItemAsk: ['narr', 'Buying something in a shop'], buyNow: ['narr', 'Buying something'],
    buyTools: ['narr', "The tool rack at Fortune's"], furnitureGift: ['npc', 'Giving furniture as a gift'], honorShop: ['narr', 'The honor-system shop'],
    mannequinAsk: ['narr', 'The mannequin in the boutique'], roomChecks: ['npc', 'Visiting at their bedtime'], roomFurniture: ['narr', 'Looking at furniture'],
    roomUse: ['narr', 'Using something in a room'], staffAway: ['narr', 'Nobody at the counter'], visitHouse: ['narr', "Visiting a neighbor's house"],
    addClamSpot: ['narr', 'A clam spot on the beach'], addGlow: ['narr', 'Something glinting in the grass'], addStump: ['narr', 'A stump'],
    chopTree: ['narr', 'Chopping a tree'], cycleTool: ['narr', 'Switching tools'], digAt: ['narr', 'Digging'], fellTree: ['narr', 'A tree falls'],
    holeMenu: ['narr', 'A dug hole: what to do with it'], flowerPlantMenu: ['narr', 'Planting flowers'], plantFlowersInHole: ['narr', 'Planting flowers'],
    applyExteriors: ['narr', "A neighbor's mailbox"], buildBuilderRoom: ['narr', "Inside Ginger's workshop"], builderMenu: ['ginger', "Talking to Ginger at the workshop"],
    constructionTime: ['narr', 'Ginger works on a house'], homeRedoLine: ['npc', "Noticing Sarah's house moved or changed"], houseExpand: ['ginger', "Making Sarah's house bigger"],
    houseReaction: ['npc', 'Seeing their house changed or moved'], offerLook: ['ginger', 'After redoing a house'], pickNeighborHouse: ['ginger', "Picking a neighbor's house to redo"],
    redoHouse: ['ginger', 'Redoing a house'], sitOnBench: ['narr', 'Sitting on a bench'], eventLabel: ['label', 'An event'],
    appArcade: ['label', 'The Arcade app'], appCollection: ['label', 'The Collection app'], appFriends: ['label', 'The Friends app'], appMail: ['label', 'The mailbox (the letters)'],
    appMoves: ['label', 'The Moves app'], appPoems: ['label', 'The Poems app'], appRecipes: ['label', 'The Recipes app'], appSettings: ['label', 'Settings'],
    appToday: ['label', 'The Today app'], clockSetting: ['label', 'Setting the clock'], eatItem: ['narr', 'Eating something'], edit: ['label', 'Island edit'],
    fishNote: ['label', 'A fish in the Collection'], fortuneTalk: ['fortune', "Talking to Fortune at the shop"], go: ['narr', 'Cooking'], home: ['label', 'Decorating'],
    lovesText: ['label', "What a neighbor loves (Friends app)"], openBottle: ['narr', 'A message in a bottle'], openMailbox: ['narr', 'Opening the mailbox'],
    pickFromPocket: ['narr', 'Picking from the pocket'], pocketActions: ['label', 'Pocket item actions'], slotBtn: ['label', 'Collection'], specialsTab: ['label', 'Specials'],
    familyTalk: ['npc', "Sarah's family"], giftFlow: ['npc', 'Giving a gift'], goatTalk: ['goat', 'Talking to the goat'], heartUp: ['label', 'Friendship goes up'],
    holidayLine: ['any', 'A holiday'], petGoat: ['narr', 'Petting the goat'], joeKeepsakePoem: ['joe', 'A keepsake poem'], joeTalk: ['joe', 'Talking to Joe'],
    neighborTalk: ['npc', 'Talking to a neighbor'], igMaybeAsk: ['npc', 'Asking Sarah to play a game'], igBegin: ['npc', 'Starting a game they asked for'], igAskLine: ['npc', 'Asking Sarah to play a game'], igHandheld: ['npc', 'An arcade game on their handheld'], igRope: ['npc', 'Jump rope they asked for'], noodleCart: ['basil', "Basil's noodle cart"], offerWear: ['narr', 'Offering an accessory'],
    recitePoem: ['narr', 'Joe reads a poem'], teachRecipe: ['npc', 'Teaching Sarah a recipe'], startFishing: ['narr', 'Fishing'], wasabiTalk: ['wasabi', 'DJ Wasabi at the club'],
    appCouncil: ['label', 'The Cozy Council app'], councilVisit: ['council', "The Cozy Council judges Sarah's house"], birthdayParty: ['everyone', "Sarah's birthday party"],
    dailyCheck: ['narr', 'Something that happens each morning'], jackboxNight: ['narr', 'Jackbox night'], newsCheck: ['narr', 'Big island news'], newsCheck10: ['narr', 'Island news'],
    inviteSarah: ['npc', 'Inviting Sarah to a surprise party'], partyScene: ['everyone', 'A surprise party'], voiced: ['npc', 'Island drama'],
    afterMaking: ['sully', 'After making pottery'], appPottery: ['label', 'The Pottery app'], buildStudioRoom: ['sully', 'Inside the pottery studio'], fireNow: ['label', 'Firing the kiln'],
    glazePiece: ['sully', 'Glazing'], glazeStation: ['sully', 'The glaze station'], handBuild: ['sully', 'Hand-building'], kilnStation: ['sully', 'The kiln'],
    pickTemplate: ['narr', 'Picking a pottery shape'], potteryGiftLine: ['npc', 'Given pottery'], potteryTick: ['narr', 'The kiln is done'], potteryWheel: ['sully', 'The wheel'],
    nameStep: ['narr', 'Naming pottery'], addTickets: ['narr', 'Getting tickets'], afterArcade: ['narr', 'After an arcade game'], arcadeCabinet: ['narr', 'An arcade cabinet'],
    buildArcadeRoom: ['narr', 'Inside the arcade'], clawMachine: ['chili', 'The claw machine'], homeArcade: ['narr', "An arcade cabinet in Sarah's house"],
    prizeDesk: ['chili', 'The prize counter'], prizeNote: ['label', 'A prize at the prize counter'], result: ['narr', 'A game ends'], showHiScores: ['label', 'High scores'],
    snackMachine: ['narr', 'The snack machine'], got: ['narr', 'Scoring'], nextRound: ['narr', 'A new round'], karaokeMenu: ['narr', 'Picking a karaoke song'],
    karaokeNight: ['wasabi', 'Karaoke night'], buildRestaurantRoom: ['narr', "Inside Mac's"], eatHere: ['narr', "Eating at Mac's"], maybeInvite: ['narr', "Inviting a friend to eat at Mac's"],
    orderFood: ['mac', "Ordering at Mac's"], pickDish: ['label', "Mac's menu"], pickInvitee: ['label', 'Inviting a friend'], readMenuBoard: ['narr', "Mac's menu board"],
    artInfo: ['label', 'About a painting'], buildMuseumRoom: ['narr', 'Inside the museum'], critique: ['brulee', "Brulee judges Sarah's painting"],
    donationThanks: ['brulee', 'Sarah donates to the museum'], hungNpcArt: ['brulee', "A neighbor's painting is hung"], id: ['label', 'The museum'],
    museumEasel: ['brulee', 'The easel'], museumMenu: ['brulee', 'Talking to Brulee at the museum'], museumTakeHome: ['narr', 'Taking something home from the museum'],
    paintAtEasel: ['brulee', 'Painting at the easel'], boardTodayLines: ['board', 'The island board: today'], dayEvents: ['board', "The island board: today's events"],
    holidayHello: ['any', "A neighbor's day"], holidaysOn: ['label', 'Holidays'], npcDayGift: ['npc', 'Their own day'], refreshHolidayChat: ['any', "A neighbor's day"],
    laptopOrder: ['narr', 'Ordering on the laptop'], useLaptop: ['narr', "Sarah's laptop"], askGoHome: ['narr', 'Going home'], goHome: ['narr', 'Going home'],
    homeKey: ['narr', 'Going home'], appTexts: ['label', 'The Texts app'], placeName: ['label', 'Where someone is'], repeatReply: ['npc', 'Asked the same thing twice'],
    textReply: ['npc', 'Answering a text: where they are and where they go next'], textThread: ['label', 'A text thread'], zoomSetting: ['label', 'Zoom'],
    farmUse: ['narr', 'The farm'], flourBin: ['narr', 'The flour bin at the windmill'], jumpInHay: ['narr', 'Jumping in the hay'], snoopChecks: ['npc', 'Finding Sarah in their house'],
    snoopIn: ['narr', "Going into a neighbor's house"], lostDaily: ['npc', 'Lost something'], lostHint: ['any', 'A hint about something lost'], lostLetter: ['npc', 'A letter about something lost'],
    lostWhere: ['label', 'Where something was lost'], ownerLostLine: ['npc', 'Hearing Sarah found their lost thing'], returnLost: ['npc', 'Sarah returns something they lost'],
    colorForm: ['label', 'Picking a color'], mySwatches: ['label', 'Colors'], pickDesign: ['narr', 'Sewing'], sewingMachine: ['narr', 'The sewing machine'],
    addMarker: ['narr', 'A building is moving tonight'], checkMove: ['ginger', "Can't move a building there"], moveBuildingFlow: ['ginger', 'Moving a building'],
    movesDaily: ['narr', 'A building moved overnight'], pickBuilding: ['label', 'Moving a building'], davidStatue: ['david', "David's statue"], oldTreeTalk: ['narr', 'An old giant tree'],
    roastMarshmallow: ['narr', 'Roasting a marshmallow'], useBonfire: ['narr', 'The bonfire'], useCampfire: ['narr', 'The campfire'], useTent: ['narr', 'A tent'],
    buildSalonRoom: ['narr', 'Inside the salon'], colorWord: ['label', 'A color'], flossTalk: ['floss', 'Talking to Floss at the salon'], salonChair: ['floss', 'The salon chair'],
    addDisplay: ['narr', 'A display'], displaysShop: ['label', "Waffle's shop"], waffleTalk: ['waffle', "Talking to Waffle"], checkSpecialMilestones: ['narr', 'Earning a special'],
    itemDesc: ['label', 'Describing an item'], specialCard: ['label', 'Specials'], specialHint: ['label', 'A hint for a special'], appTasks: ['label', 'The Favors app'],
    whereIs: ['label', 'Where someone is'], arcadeLine: ['any', 'An arcade record'], carryLine: ['any', 'What Sarah is carrying'], islandLine: ['any', "What's happening on the island"],
    moonPhaseName: ['label', 'The moon'], museumLine: ['any', "Sarah's painting in the museum"], openerLine: ['npc', 'Saying hello'], onTheWay: ['npc', 'Stopped on the way somewhere: where they are headed'], outfitLine: ['npc', 'Wearing a gift from Sarah'],
    skyLine: ['any', 'The night sky'], statsLine: ['any', "Sarah's stats"], todayLine: ['any', 'What Sarah did today'], addQuestWorld: ['narr', 'A mystery'],
    buildLighthouseRoom: ['narr', 'Inside the lighthouse'], climbLighthouse: ['narr', 'Climbing the lighthouse'], bonusTick: ['narr', 'A food boost'], foodBonus: ['narr', 'A food boost'],
    openCrate: ['narr', 'Fishing up a crate'], ckHow: ['narr', 'How to do a cooking step'], cookDish: ['narr', 'Cooking'], plate: ['narr', 'Plating a dish'], next: ['narr', 'The next cooking step'],
    appMusic: ['label', 'The Music app'], appSaveQuit: ['label', 'Save and quit'], cheatGate: ['label', 'Cheat mode'], clubList: ['label', "The club's lists"], clubMenu: ['wasabi', 'At the club'],
    editLabel: ['label', 'Naming something'], holdToConfirm: ['label', 'Holding to confirm'], islandNameSetting: ['label', "The island's name"], moveHow: ['label', 'How to learn a move'],
    saveGameFile: ['narr', 'Saving a file'], secretsSection: ['label', 'Secrets'], songHow: ['label', 'How to unlock a song'], spoilerEntries: ['label', 'The spoiler guide'],
    spoilerGate: ['label', 'The spoiler guide'], spoilerGuide: ['label', 'The spoiler guide'], stop: ['label', 'Holding to confirm'], sarahNews: ['npc', 'A visitor asks how Sarah is'],
    visitorTalk: ['label', 'Talking to a neighbor as a visitor'], update: ['narr', 'In the game'], levelUp: ['narr', 'Level up'], step: ['narr', 'In the game'], addScore: ['narr', 'Scoring'],
    drawHud: ['label', 'The game screen'], backCab: ['narr', 'The covered cabinet'], backDoor: ['narr', 'The back room door'], backHint: ['narr', 'A hint about the back room'],
    backKeyHunt: ['narr', "The keeper's desk"], backOptions: ['label', 'The back room'], buildBackRoom: ['narr', 'Inside the back room'], addEggSpot: ['narr', 'An egg spot'],
    cookOff: ['mac', 'The Feast Cook-Off'], eggsToCece: ['cece', 'Bringing Cece painted eggs'], festOptions: ['label', 'Festival'], festShake: ['narr', 'An egg falls out of a tree'],
    litterToCuke: ['cuke', 'Bringing Cuke litter from the beach'], toyFromFortune: ['fortune', 'Toy Day'], toyOption: ['label', 'Toy Day'], toyThanks: ['fortune', 'Toy Day'],
    trickOption: ['label', 'Trick or treat'], priceNote: ['label', 'A price'], shopPaid: ['narr', 'A grand-opening gift'], shopTalk: ['npc', 'Their shop is doing well'],
    tmRecordLines: ['npc', "Sarah's records"], draw: ['label', 'On screen'], add: ['label', 'On screen'], liveField: ['label', ''], openPhone: ['label', 'The phone'],
};

/* the drama storylines (56_drama.js): who's who in each */
const DRAMA_ROLE = { A: 'A (first in the story)', B: 'B (second in the story)', gossip: 'Any bystander' };
function dramaWhen(k) {
    const story = k[0], st = k.find((x, i) => k[i - 1] === 'states') || '';
    return `Drama "${story}", ${st ? 'stage "' + st + '"' : ''}${k.includes('opts') ? ', a choice Sarah makes' : ''}${k.includes('tell') ? ', when Sarah passes it on' : ''}`;
}

const SAY_FN = /(\w+)Voice\(\)/, VOICE = { boutique: 'clementine', builder: 'ginger' };
function sayWho(a0, keys) {
    if (a0 == null) return null;
    if (/^null$/.test(a0)) return 'narr';
    const q = a0.match(/^'(\w+)'$/); if (q) return q[1];
    const v = a0.match(SAY_FN); if (v) return VOICE[v[1]] || v[1];
    const any = [...a0.matchAll(/'(\w+)'/g)].map(m => m[1]).find(x => NPCS[x] || EXTRA[x]);
    if (/c\.A|\bA\.id/.test(a0)) return 'A';
    if (/c\.B|\bB\.id/.test(a0)) return 'B';
    const n = keys.find(x => NPCS[x]); if (n) return n;
    if (any && !/null/.test(a0)) return any;
    return 'them';
}

const WHO_NAME = { owner: "The shop's owner", narr: 'Narration', any: 'Any neighbor', label: 'On screen', them: 'The neighbor Sarah is talking to', npc: 'The neighbor', A: DRAMA_ROLE.A, B: DRAMA_ROLE.B, everyone: 'Everyone', board: 'Island board' };
function show(who) { return WHO_NAME[who] || nameOf(who); }
const fnWords = f => f ? f.replace(/^(app|build|use)([A-Z])/, (m, a, b) => ({ app: 'the ', build: 'inside ', use: 'using ' }[a] + b)).replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase() : '';

export function describe(row) {
    const ch = row.chain.slice();
    // (lines pushed onto a table later count as that table's)
    const pushed = /^([A-Z][A-Z_]+)\.push$/.exec(row.call || '');
    if (pushed && !ch.length) ch.push(pushed[1]);
    const keys = ch.filter(c => !/^\[\d+\]$/.test(c) && !c.startsWith('@')), root = keys[0];
    row = Object.assign({}, row, { chain: ch });
    const rest = keys.slice(1), ids = ch.filter(c => c.startsWith('@')).map(c => c.slice(1));
    const t = T[root], f = F[row.fn] || F[row.fns.find(x => F[x])];
    const area = AREA[row.file.replace('.js', '')] || '';
    let who = null, to = null, when = '', kind = 'Line';
    // who: a table's rule, then a neighbor named on the way in
    const npcIn = rest.filter(x => NPCS[x] || VISITORS[x]);
    if (t) {
        const w = t[0];
        if (w === 'npc') who = npcIn[0] || 'any';
        else if (w === 'drama') { const r = rest.find(x => DRAMA_ROLE[x]); who = r === 'gossip' ? 'any' : r || 'narr'; }
        else if (w === 'holiday') who = rest.includes('hello') || rest.includes('chat') ? 'any' : 'label';
        else who = w;
        if (w === 'npc' && npcIn[1] && npcIn[1] !== who) to = npcIn[1];
        if (root === 'TM_ABOUT' || root === 'TM_THEIR_DAY' || root === 'TM_TODAY' || root === 'TM_HOL') to = null;
        if (root === 'TM_THEIR_DAY') who = 'any';
        const k = rest.filter(x => !(NPCS[x] && x === who) && !(VISITORS[x] && x === to));
        when = root === 'DRAMAS' ? dramaWhen(rest) : root === 'HOLIDAYS' ? `Holiday "${ids[0] || ''}": ${rest.map(words).filter(Boolean).join(', ') || 'its name'}` : typeof t[1] === 'function' ? t[1](row, k, ch) : t[1] || '';
        if (!when) when = (f ? f[1] : fnWords(row.fn)) + (k.length ? ' (' + k.map(words).filter(Boolean).join(', ') + ')' : '');
    } else if (f) { who = f[0] === 'npc' ? (npcIn[0] || 'them') : f[0]; when = f[1] + (rest.length ? ' (' + rest.map(words).filter(Boolean).join(', ') + ')' : ''); }
    else { who = npcIn[0] || null; when = (fnWords(row.fn) || fnWords(root) || 'In the game') + (rest.length ? ' (' + rest.map(words).filter(Boolean).join(', ') + ')' : ''); }
    // a line passed to UI.say / UI.ask names its speaker first; UI.ask's third argument is Sarah's choices; toasts are messages
    if (/UI\.(say|ask)$/.test(row.call || '') && row.arg >= 1) {
        const s = sayWho(row.arg0, keys);
        if (row.call === 'UI.ask' && row.arg === 2) { who = 'sarah'; kind = 'Choice'; }
        else if (s) who = s === 'them' && who && who !== 'label' && who !== 'narr' ? who : s;
    }
    if (/toast$/.test(row.call || '')) { who = 'label'; kind = 'Message'; }
    if (who === 'npc') who = npcIn[0] || 'them';
    if (!who) who = 'label';
    if (who === 'label' && kind === 'Line') kind = 'Screen text';
    else if (who === 'narr' && kind === 'Line') kind = 'Narration';
    else if (kind === 'Line') kind = 'Dialogue';
    if (row.call && /btn|chip|stLabel|addRow/.test(row.call) && kind !== 'Choice') kind = 'Button or label';
    if (/letter|Mail|mail/.test(row.fn || '') || /letter|MAIL/.test(root || '')) kind = kind === 'Dialogue' || kind === 'Narration' ? 'Letter' : kind;
    if (/text(Reply|Thread)|TEXT_|INV_LINES|INV_YES|INV_NO|INV_MISS/.test((row.fn || '') + ' ' + (root || ''))) kind = 'Text message';
    if (when.startsWith('In the game') || !when) {
        const tour = { '64_restaurant.js': "Walking into Mac's for the first time: the welcome", '2c_builder.js': "Walking into Ginger's workshop for the first time: the welcome",
            '57_pottery.js': 'Walking into the pottery studio for the first time: the welcome', '59_arcade.js': 'Walking into the arcade for the first time: the welcome',
            '65_museum.js': 'Walking into the museum for the first time: the welcome', '54_events.js': "Walking into Sarah's house for the first time",
            '6z_shops.js': "Walking in on a shop's grand reopening (Fortune's or Clementine's)" }[row.file];
        if (tour && /UI\.say|bostonize|Bus\.on/.test(row.call || '')) { when = tour; if (row.file === '6z_shops.js') who = 'owner'; if (row.file === '57_pottery.js') who = 'sully'; }
        else if (row.call === 'defSpecial') { when = 'A special in the Collection: its name, how to get it, or its hint'; who = 'label'; kind = 'Screen text'; }
        else if (/pops\.push/.test(row.call || '')) { when = 'A word that pops up during the game'; who = 'label'; kind = 'Screen text'; }
        else if (/^\[\d+\]$/.test(ch[0] || '') && /6z_back_/.test(row.file)) { when = "A note beside a record on the cabinet's high score list"; who = 'label'; kind = 'Screen text'; }
    }
    when = when.replace(/\s+/g, ' ').replace(/\(\s*\)/g, '').replace(/: ?$/, '').trim();
    return { who: show(who), whoId: who, to: to ? nameOf(to) : '', when: when.charAt(0).toUpperCase() + when.slice(1), area, kind };
}
