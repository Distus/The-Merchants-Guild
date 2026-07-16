/**
 * Description Tables
 * Shop description templates and fragment tables
 *
 * The Merchant's Guild — FoundryVTT Module
 */

/**
 * Description template patterns
 * Tokens in {braces} are replaced with random picks from the fragment tables below.
 * Templates are organized by style — the generator picks one at random.
 */
export const DESCRIPTION_TEMPLATES = [
  // Pattern A: Exterior + Interior
  "A {exteriorCondition} {buildingType} with {exteriorFeature}. Inside, {interiorDescription}, and {atmosphereDetail}.",
  "This {exteriorCondition} {buildingType} is marked by {exteriorFeature}. {interiorDescription}, while {atmosphereDetail}.",
  "You find a {exteriorCondition} {buildingType}, {exteriorFeature}. Beyond the threshold, {interiorDescription}.",
  "The shop is housed in a {exteriorCondition} {buildingType} with {exteriorFeature}. Within, {interiorDescription}, and {atmosphereDetail}.",

  // Pattern B: Sensory-focused
  "The smell of {scent} hits you as you push open the {doorType} door. {interiorDescription}. {atmosphereDetail}.",
  "A wave of {scent} greets you at the door. Inside, {interiorDescription}, and {atmosphereDetail}.",
  "Even from outside, you catch the scent of {scent}. The {doorType} door opens onto a space where {interiorDescription}.",
  "The {doorType} door creaks open, releasing the mingled smell of {scent}. {interiorDescription}.",

  // Pattern C: Character-focused
  "{shopkeeperName} {greetingAction} from behind a {counterType} counter. The shop is {shopCondition}, with {interiorDescription}.",
  "A voice calls out from the back as you enter. {shopkeeperName} appears, {greetingAction}. {interiorDescription}, and {atmosphereDetail}.",
  "{shopkeeperName} barely looks up as you enter, {greetingAction}. Around {pronounObj}, {interiorDescription}.",

  // Pattern D: Atmosphere-first
  "{atmosphereDetail}. That's the first thing you notice about this {exteriorCondition} {buildingType}. {interiorDescription}.",
  "It's the kind of place where {atmosphereDetail}. The {exteriorCondition} {buildingType} holds {interiorDescription}."
];

/**
 * Fragment tables — each array provides options for one token type
 */

export const EXTERIOR_CONDITIONS = [
  "weathered", "freshly painted", "crooked", "narrow", "sturdy", "crumbling",
  "ivy-covered", "well-maintained", "sagging", "cheerful", "imposing", "humble",
  "cramped", "sprawling", "tidy", "soot-stained", "sun-bleached", "moss-covered",
  "whitewashed", "timber-dark", "stone-faced", "brightly colored", "shadowy",
  "rain-streaked", "lantern-lit", "vine-wrapped", "dust-covered", "newly built",
  "ancient-looking", "oddly leaning"
];

export const BUILDING_TYPES = [
  "stone building", "timber-framed shop", "converted house", "market stall",
  "underground cellar", "repurposed barn", "tower base", "corner shop",
  "warehouse", "mud-brick hut", "half-timbered storefront", "stone cottage",
  "wooden shack", "grand hall", "narrow townhouse", "converted chapel",
  "squat bunker of a building", "two-story workshop", "thatched-roof shop",
  "brick-walled establishment"
];

export const EXTERIOR_FEATURES = [
  "a hand-painted sign swinging in the wind", "a battered wooden sign over the door",
  "a colorful awning shading the entrance", "weapon racks flanking the door",
  "dried herbs hanging in the window", "a suit of armor standing by the entrance",
  "a bubbling cauldron out front", "iron bars on the windows",
  "flower boxes on the sills", "a chalk menu board propped by the door",
  "a cat dozing on the windowsill", "smoke curling from a crooked chimney",
  "a worn welcome mat", "a brass bell hanging above the door",
  "lanterns glowing on either side of the entrance", "a wooden bench out front",
  "crates stacked against the outer wall", "a faded flag fluttering above",
  "a small garden growing by the entrance", "a pair of boots left by the door",
  "an old wagon wheel leaning against the wall", "a hand-carved door frame",
  "shutters painted in bright colors", "a wind chime tinkling softly",
  "a wooden sign carved in the shape of the shop's wares"
];

export const INTERIOR_DESCRIPTIONS = [
  "shelves are packed floor to ceiling with goods",
  "the space is surprisingly organized despite its size",
  "crates and barrels fill every corner",
  "glass display cases line the walls",
  "the room is dimly lit by lantern light",
  "a forge blazes in the back room",
  "dried herbs hang from every rafter",
  "books and scrolls overflow from every surface",
  "weapons line the walls in neat rows",
  "the shop is barely bigger than a closet",
  "everything is meticulously labeled and sorted",
  "goods are piled in seemingly random heaps",
  "polished wooden shelves hold carefully arranged wares",
  "the floor is worn smooth from years of foot traffic",
  "a long oak counter divides the room in two",
  "narrow aisles wind between overstuffed shelves",
  "a single display table dominates the center of the room",
  "the walls are lined with hooks, pegs, and hanging merchandise",
  "a spiral staircase in the corner leads to a second level of stock",
  "rugs and tapestries soften an otherwise austere stone interior",
  "glass jars of every size crowd the shelves",
  "the space has the organized chaos of someone who knows exactly where everything is",
  "a thick layer of dust coats the less popular items on the top shelves",
  "a curtain of beads separates the shop floor from the back room",
  "every surface gleams as if recently polished"
];

export const ATMOSPHERE_DETAILS = [
  "a cat sleeps on a pile of rope",
  "dust motes dance in the light from a single window",
  "the clang of a hammer echoes from the back room",
  "a small fire crackles in a pot-bellied stove",
  "somewhere a clock ticks loudly",
  "a faint magical hum fills the air",
  "the floorboards creak with every step",
  "a bell chimes as the door closes behind you",
  "incense smoke curls near the ceiling",
  "the sound of bubbling liquid comes from somewhere unseen",
  "a parrot squawks from a perch in the corner",
  "the gentle clink of glass bottles punctuates the silence",
  "the warmth of a nearby hearth takes the edge off the chill",
  "a dog raises its head from the floor, decides you're not interesting, and goes back to sleep",
  "wind whistles through a crack in the window frame",
  "a candle gutters on the counter, wax pooled around its base",
  "somewhere in the back, someone is humming an old tune",
  "the creak of a rocking chair comes from behind the counter",
  "cobwebs occupy the upper corners but the merchandise is spotless",
  "a pair of spectacles sits abandoned on an open ledger",
  "the faint scratch of a quill on parchment comes from the back",
  "mounted antlers above the door frame cast odd shadows",
  "a kettle whistles softly on a small stove behind the counter",
  "the smell of fresh sawdust mingles with the merchandise",
  "a heavily annotated map is pinned to the wall behind the counter"
];

export const SCENTS = [
  "leather and oil", "dried lavender and dust", "hot metal and coal",
  "old parchment", "pine resin and sawdust", "strange spices",
  "animal feed and hay", "fresh bread from next door",
  "something chemical and sharp", "beeswax and woodsmoke",
  "cinnamon and clove", "damp stone and moss", "tobacco and cedar",
  "tallow candles", "fresh ink", "roasting meat from the kitchen",
  "wildflowers and honey", "vinegar and pickling brine",
  "sulfur and something unidentifiable", "clean linen and soap",
  "old wood and varnish", "copper and rust", "earth and roots",
  "burnt sugar", "sea salt and driftwood"
];

export const DOOR_TYPES = [
  "heavy oak", "creaky wooden", "iron-banded", "thin", "painted",
  "weathered", "half-open", "curtained", "beaded", "reinforced",
  "dented", "freshly oiled", "carved", "narrow", "wide double"
];

export const GREETING_ACTIONS = [
  "waves you in", "looks up with a nod", "eyes you suspiciously",
  "greets you with a wide grin", "barely glances your way",
  "beckons you closer", "slams down a ledger and turns to face you",
  "peers over a pair of half-moon spectacles", "wipes their hands on an apron",
  "holds up a finger — one moment", "pushes aside a pile of inventory",
  "squints as if trying to place your face", "is mid-bite of something and waves apologetically",
  "straightens up from behind the counter", "calls out a cheerful greeting"
];

export const COUNTER_TYPES = [
  "scarred wooden", "polished oak", "cluttered", "immaculate glass-topped",
  "stone slab", "waist-high", "towering", "tiny", "L-shaped",
  "iron-reinforced", "stained and sticky", "freshly wiped",
  "covered in papers", "bare and functional", "ornately carved"
];

export const SHOP_CONDITIONS = [
  "cramped but cozy", "surprisingly spacious", "dimly lit and cluttered",
  "well-organized and brightly lit", "dusty but functional",
  "immaculately clean", "a chaotic mess that somehow works",
  "sparse and utilitarian", "warmly decorated", "cold and businesslike",
  "packed to bursting", "half-empty and echoing", "pleasantly cluttered",
  "meticulously arranged", "homey and inviting"
];

/**
 * Store-type-specific flavor additions
 * These get appended to the base description for thematic color
 */
export const STORE_TYPE_FLAVOR = {
  "general-goods": [
    "Sacks of grain lean against barrels of salt near the entrance.",
    "A hand-lettered sign reads: 'If we don't have it, you don't need it.'",
    "Rope, candles, and cookware compete for shelf space.",
    "A scale sits on the counter next to a jar of hard candy."
  ],
  "blacksmith": [
    "The ring of hammer on steel is constant.",
    "Sparks occasionally drift through the doorway to the forge.",
    "Half-finished blades cool on a rack near the wall.",
    "The heat from the forge makes the shop uncomfortable in summer."
  ],
  "armorer": [
    "A battered training dummy stands in the corner wearing mismatched armor.",
    "Shields of every size hang from the walls like trophies.",
    "Dents and scratches in the floor suggest heavy items are moved often.",
    "A set of calipers and measuring tape sit ready on the counter."
  ],
  "apothecary": [
    "Bundles of dried herbs hang upside down from the ceiling in neat rows.",
    "Colorful liquids in glass bottles catch the light from the window.",
    "A mortar and pestle sit on the counter, freshly used.",
    "Small clay pots are labeled in a precise but cramped hand."
  ],
  "fletcher": [
    "Bundles of arrow shafts lean in barrels like wooden bouquets.",
    "Feathers of every color and size fill baskets along the wall.",
    "A target riddled with arrows hangs on the back wall.",
    "The sharp smell of fresh-cut wood fills the air."
  ],
  "magic-shop": [
    "Something on a high shelf glows faintly blue.",
    "The air feels heavy, as if charged before a storm.",
    "Crystal orbs of various sizes sit in velvet-lined cases.",
    "A sign near the door reads: 'You break it, you're cursed with it.'"
  ],
  "tavern": [
    "The sound of laughter and clinking mugs drifts from the common room.",
    "A chalkboard lists today's fare and drink specials.",
    "A bard's lute leans against a stool in the corner, unattended.",
    "The sticky floor tells a story of many late nights."
  ],
  "stables": [
    "The sound of horses nickering comes from the stalls beyond.",
    "Hay dust drifts in the sunlight streaming through the barn doors.",
    "Saddles hang on pegs along the wall, sorted by size.",
    "A large grey mare watches you with intelligent eyes from the nearest stall."
  ],
  "jeweler": [
    "Velvet-lined trays in the display case catch and scatter the light.",
    "A jeweler's loupe and a set of fine tools sit ready on the workbench.",
    "Every surface is locked behind glass — the shopkeeper has the only key.",
    "Tiny gemstones are sorted by color in compartmented wooden boxes."
  ],
  "clothier": [
    "Bolts of fabric in every color lean against the walls.",
    "A dress form in the corner wears an unfinished garment.",
    "Spools of thread line the shelf behind the counter like a rainbow.",
    "A pair of shears and a pincushion sit on a cutting table."
  ]
};
