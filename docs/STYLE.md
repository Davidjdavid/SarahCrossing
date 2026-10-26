# The style guide: characters and props (style test, 26 October)

David asked for the 3D characters and props to be redone as cozy, handcrafted miniatures, after Animal Crossing: New
Horizons (his notes, 26 October). Before redoing everything, a test set was made and put in the test area (`?lab`):
Sarah, three food folks (Maki, Kai, Ginger), five props (a bench, a street lamp, an armchair, a strawberry shortcake, the
shovel) and how they act. These are the rules that test settled on, for everything that follows once David approves it.

## What matters at playing size

People stand 60 to 100 pixels tall on screen. At that size what reads is the silhouette, the eyes, the expression,
color contrast, an accessory and how it moves, not small detail. So, in this order:

1. **Silhouette.** Each character has a shape you could tell in black: Sarah's big head of wavy hair, Maki's tall roll,
   Kai's wide bowl with its heap of toppings, Ginger's cookie star under a hard hat.
2. **Eyes.** Big and glossy: a person's eye is about a quarter of the face's height, with two white shines. They read
   from across the square.
3. **Expressions.** Sixteen faces per character (`FACES`): idle, blink, talk, happy, happy talking, joy, surprised, sad,
   cry, excited, determined, worried, sleepy, wink, love, annoyed. Eyes carry most of it (happy is `^ ^`, surprised is
   tall round eyes, sad has drooping lids), the mouth and brows back them up.
4. **Contrast.** Features in a color that stands off the body: dark eyes on skin and cookie, white eyes and rice-white
   brows on Maki's dark nori, navy on Kai's blue glaze. Clothes a different value from the skin and hair.
5. **One accessory each**, big enough to see: Sarah's round glasses, Maki's red bow tie, Kai's hibiscus, Ginger's hard
   hat and tool belt.
6. **Movement** (below): as important as the model.

## Shapes and proportions

- **People are chibi**: the head about 43% of the height (with hair, nearly half), a short body, short limbs. Head
  radius 0.215 of the doll's height, its middle at 0.78; shoulders at 0.52, hips at 0.30, ankles at 0.06.
- **Everything is rounded**: no hard edges anywhere; rounded boxes, capsules, swollen shapes (a sweater flares at the
  hem, a cushion bulges, a sponge layer rounds over its edge).
- **Nothing too thin to see**: about 0.05 of a tile is the thinnest part that should read (a lamp post, a bench leg is
  thicker than life). Thin real-world parts are made chunky.
- **The part that says what it is, a little bigger**: the bench's scrolled arms, the lamp's lantern, the chair's rolled
  arms and tufted back, the cake's berries and swirls, the shovel's D-grip.
- **Hair is sculpted**: chunky locks melted into one soft mass (voxel remeshed), the grooves between locks pressed in so
  each lock shows (`tools/blender/dolls.py`: `lock`, `melt`, `grooves`), a soft shine band, dyed tips along each lock.
  Never a smooth helmet.
- **Clothes have thickness**: a ribbed hem, collar and cuffs that stand proud, rolled jeans cuffs showing the paler
  inside, shoes with a contrasting sole.
- **Hands are round mittens with a thumb; feet are chunky shoes.**
- **Food folks keep their food**: Maki's nori sheet with its seam, rice grain by grain, salmon with fat lines; Kai's
  glazed bowl with a row of dots and a messy heap swept to one side like a surfer's hair; Ginger's bake (darker at the
  edges, specks of spice), piped icing, gumdrop buttons. Each has its own arms and feet (Maki's short nori arms with
  rice-ball hands, Kai's chunky glazed arms with white cuffs, Ginger's cookie limbs), never the same limbs twice.

## Color and material

- Warm, a little saturated; neutrals leaning warm. Painted, not realistic: no photo textures.
- Every part is a shade darker underneath and in its creases (contact shading baked into the mesh's colors), a touch
  lighter on top.
- Matte, slightly soft (roughness about 0.6 to 0.75); glaze, cream and painted metal a little glossier (`*_gloss`).
- People's parts carry greys, not colors, named for the role that paints them (`<part>__<role>`: top, trim, bottom,
  bottom2, shoes, sole, skin, hair), so the tailor's and the salon's colors still dress them.

## Faces

- Painted on a patch of the head (or of a folk's body: a part named `face`), sixteen expressions on one sheet per
  look or folk (`EnvDolls.faceSheet`, `folkSheet`; the styles in `personFace` and `FOLK_FACES`), chosen by moving the
  patch's UVs, so changing a face costs nothing.
- A person: dark oval eyes with the iris in their eye color, two shines, a lash line flicked at the corner; brows a
  shade darker than the hair; a small mouth; blush.
- A folk's eyes are its own kind: white with a pupil (Maki, half-lidded and precise; Kai, big and ringed), or chocolate
  chips (Ginger); brows and mouth in a color that reads on its body.

## Movement and acting (33kb_doll_act.js)

- **Standing** is never still: breathing, weight shifting from one leg to the other, a look round now and then.
- **Walking**: legs swing from the hips and bend at the knees coming forward, arms swing against them and bend at the
  elbows, the body bobs.
- **Sarah runs with her arms out**, like a happy kid, squinting with joy.
- **Faces follow what's happening**: the mouth moves while a line types; a line's mood shows (a gift loved, a boot
  given...); the game's emotes become faces (heart, sparkle, bang, sweat, laugh...).
- **Games have acting**: in tag, whoever runs away is thrilled, glances back over the shoulder, now and then
  stumbles, and celebrates a close escape with a jump and a spin; whoever's it sets their brows and leans in.
- **Each folk moves its own way** (`FOLK_ACT`): Maki small and precise, Kai loose and bouncy with his arms flying,
  Ginger sturdy.
- Easing is the same however fast frames come (slow phones included).

## Budget

- A person: about 20,000 vertices (kit and hair) in a handful of draws (one mesh per joint, the face patch).
- A folk: under 20,000; a prop on the ground: under 8,000; a little thing on a table: a few thousand.
- The test models are full detail; the rollout makes lighter versions where a model is placed many times or phones
  need it (`_lod1`).
