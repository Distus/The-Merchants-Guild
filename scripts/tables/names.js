/**
 * Name Tables
 * First names by race/gender, surnames, nicknames, shop name prefixes/nouns
 *
 * The Merchant's Guild — FoundryVTT Module
 */

/**
 * Shop Name Prefixes — organized by store type
 * Used in patterns like "{prefix} {noun}" or "The {prefix} {noun}"
 */
export const SHOP_NAME_PREFIXES = {
  "general-goods": [
    "Lucky", "Dusty", "Fair", "Honest", "Wanderer's", "Traveler's", "Old", "Crossroads",
    "Hearthside", "Sundry", "Penny", "Wayward", "Tinker's", "Peddler's", "Thrifty",
    "Corner", "Market", "Reliable", "Humble", "Roadside", "Everyday", "Ramble", "Merry",
    "Goodly", "Last Stop", "Frontier", "Handy", "Cheerful", "Sturdy", "Fieldstone",
    "Pilgrim's", "Wayside", "Homestead", "Greenfield", "Oakwood", "Bargain", "Trusty",
    "Wellspring", "Caravan", "Patchwork"
  ],
  "blacksmith": [
    "Iron", "Steel", "Anvil", "Ember", "Forge", "Hammer", "Spark", "Molten", "Copper",
    "Crimson", "Thunder", "Stone", "Obsidian", "Coal", "Bronzed", "Tempered", "Soot",
    "Blazing", "Midnight", "Dwarven", "Rusted", "Hardened", "Folded", "Bright", "Heavy",
    "Slag", "Whitehot", "Cinder", "Smoldering", "True", "Ringing", "Black", "Red",
    "Bellows", "Crucible", "Ingot", "Riveted", "Burnished", "Wrought", "Keen"
  ],
  "armorer": [
    "Iron", "Guardian", "Sentinel", "Shielded", "Plated", "Fortress", "Bastion", "Tower",
    "Bulwark", "Warden's", "Steadfast", "Stonewall", "Reinforced", "Riveted", "Chainlink",
    "Breastplate", "Gauntlet", "Vanguard", "Rampart", "Stalwart", "Aegis", "Ironbound",
    "Tempered", "Burnished", "Polished", "Cobalt", "Sterling", "Galvanized", "Hardened",
    "Vigilant", "Battleworn", "Steelclad", "Adamant", "Unyielding", "Crowned"
  ],
  "apothecary": [
    "Green", "Bitter", "Silver", "Moonlit", "Bubbling", "Fragrant", "Willow", "Sage",
    "Thistle", "Foxglove", "Crimson", "Mending", "Golden", "Serpent's", "Dewdrop",
    "Nightshade", "Feverfew", "Crystal", "Verdant", "Briar", "Hemlock", "Soothing",
    "Dried", "Elixir", "Herbal", "Rooted", "Steeped", "Distilled", "Pungent", "Living",
    "Tincture", "Mortar", "Pestle", "Poultice", "Balm", "Seedling", "Thornberry",
    "Mistletoe", "Clover", "Bottled"
  ],
  "fletcher": [
    "Swift", "True", "Eagle's", "Hawk's", "Feathered", "Silver", "Straight", "Keen",
    "Wind", "Whistling", "Quiver", "Sharpened", "Barbed", "Hunting", "Ranger's",
    "Longbow", "Crosswind", "Falcon's", "Raven's", "Ashwood", "Yew", "Elm", "Birch",
    "Steady", "Split", "Nocked", "Flighted", "Piercing", "Arrowhead", "Bullseye",
    "Marksman's", "Taut", "Sinew", "Strung", "Woodland", "Thorned", "Pointed",
    "Notched", "Recurve", "Bowstring"
  ],
  "magic-shop": [
    "Arcane", "Mystic", "Eldritch", "Enchanted", "Starlit", "Shadow", "Crystal",
    "Ethereal", "Runed", "Twilight", "Prismatic", "Astral", "Celestial", "Void",
    "Shimmering", "Cobalt", "Forbidden", "Gilded", "Phantasmal", "Wyrd", "Veiled",
    "Luminous", "Spellbound", "Iridescent", "Enigma", "Dweomer", "Occult", "Aether",
    "Fey", "Leyline", "Conjured", "Spectral", "Waning Moon", "Flickering", "Glimmering",
    "Charmed", "Sigil", "Hex", "Cantrip", "Bewildering"
  ],
  "tavern": [
    "Rusty", "Golden", "Silver", "Merry", "Jolly", "Drunken", "Stumbling", "Crooked",
    "Roaring", "Sleeping", "Wandering", "Lucky", "Prancing", "Limping", "Dancing",
    "Howling", "Laughing", "Weeping", "Singing", "Hungry", "Thirsty", "Bawdy",
    "Crimson", "Copper", "Pewter", "Foaming", "Broken", "Tarnished", "Gilded",
    "Leaky", "Smoky", "Rowdy", "Quiet", "Hidden", "Mossy", "Dusty", "Flickering",
    "Cobblestone", "Hearthfire", "Last Call"
  ],
  "stables": [
    "Galloping", "Ironshoe", "Swift", "Muddy", "Whispering", "Dusty", "Sunlit",
    "Meadow", "Golden", "Weathered", "Stamping", "Trotting", "Bridled", "Saddled",
    "Hitching", "Pasture", "Paddock", "Farrier's", "Canter", "Stallion's",
    "Mare's", "Hoofbeat", "Barn", "Haystack", "Clover", "Rolling", "Greenfield",
    "Oaken", "Fenceline", "Trailhead", "Waystation", "Livery", "Corral",
    "Horseshoe", "Mounting", "Harness", "Carriage", "Thornhill", "Grazing", "Ranger's"
  ],
  "jeweler": [
    "Glittering", "Golden", "Silver", "Diamond", "Ruby", "Sapphire", "Emerald",
    "Opal", "Amber", "Crystal", "Polished", "Faceted", "Brilliant", "Lustrous",
    "Gilded", "Precious", "Gleaming", "Radiant", "Dazzling", "Sparkling",
    "Crowned", "Jeweled", "Gemstone", "Moonstone", "Sunstone", "Pearl",
    "Topaz", "Onyx", "Jade", "Garnet", "Filigree", "Etched", "Engraved",
    "Hallmarked", "Sterling", "Platinum", "Burnished", "Prism", "Starfire", "Twilight"
  ],
  "clothier": [
    "Silken", "Threaded", "Woven", "Velvet", "Linen", "Cotton", "Embroidered",
    "Tailored", "Fitted", "Stitched", "Hemmed", "Dyed", "Patterned", "Elegant",
    "Flowing", "Draped", "Layered", "Crimson", "Golden", "Midnight", "Fineweave",
    "Spinner's", "Loom", "Needle", "Thimble", "Bobbin", "Spool", "Brocade",
    "Damask", "Taffeta", "Gossamer", "Quilted", "Ruffled", "Buttoned", "Cloaked",
    "Scarlet", "Azure", "Ivory", "Sable", "Patchwork"
  ]
};

/**
 * Shop Name Nouns — organized by store type for better thematic matches
 * The generator picks from the type-specific list first, falling back to general
 */
export const SHOP_NAME_NOUNS = {
  general: [
    "Emporium", "Trading Post", "Supply", "Outfitters", "Provisions", "Goods & Wares",
    "Marketplace", "Shoppe", "Bazaar", "Exchange", "Depot", "Mercantile", "Storehouse",
    "Pantry", "Cache", "Haven", "Corner", "Shelf", "Nook", "Trove", "Alcove"
  ],
  blacksmith: [
    "Forge", "Anvil", "Smithy", "Ironworks", "Metalworks", "Workshop", "Armory",
    "Foundry", "Hammer", "Steelworks"
  ],
  armorer: [
    "Armory", "Arsenal", "Shield Wall", "Garrison", "Outfitters", "Defense",
    "Ironworks", "Plate & Mail", "Guard Post", "Wardroom"
  ],
  apothecary: [
    "Apothecary", "Remedies", "Herbalist", "Pharmacy", "Tonics", "Cures",
    "Botanica", "Salves & Tinctures", "Elixirs", "Greenhouse"
  ],
  fletcher: [
    "Quiver", "Archery", "Bowyer", "Arrows", "Fletcher", "Range",
    "Marksman", "Shafts & Points", "Bow & Arrow", "Feather & Flint"
  ],
  "magic-shop": [
    "Vault", "Sanctum", "Gallery", "Reliquary", "Curiosities", "Wonders",
    "Athenaeum", "Repository", "Mysteries", "Arcanum", "Oddities", "Spellworks"
  ],
  tavern: [
    "Tankard", "Flagon", "Dragon", "Griffin", "Boar", "Stag", "Hound", "Pony",
    "Barrel", "Goblet", "Helm", "Shield", "Sword", "Fox", "Raven", "Goose",
    "Bear", "Lion", "Crow", "Maiden", "Knight", "Jester", "Pilgrim", "Beggar"
  ],
  stables: [
    "Stables", "Livery", "Paddock", "Corral", "Ranch", "Pastures",
    "Barn", "Riding Post", "Horse & Hound", "Mounts"
  ],
  jeweler: [
    "Jewelers", "Gemworks", "Treasury", "Crown", "Facets", "Settings",
    "Brilliance", "Vault", "Collection", "Finery"
  ],
  clothier: [
    "Threads", "Tailoring", "Garments", "Clothiers", "Textiles", "Fabrics",
    "Fashion", "Finery", "Attire", "Wardrobe", "Haberdashery", "Dressworks"
  ]
};

/**
 * Shopkeeper First Names — organized by race and gender
 * Target: 30+ per race/gender combination
 */
export const FIRST_NAMES = {
  human: {
    male: [
      "Aldric", "Bram", "Corwin", "Dorian", "Edmund", "Fenton", "Garrick", "Hale",
      "Isen", "Jorin", "Kellan", "Luth", "Merrick", "Nolan", "Osric", "Phelan",
      "Quinn", "Roderick", "Soren", "Theron", "Ulric", "Voss", "Willem", "Yorick",
      "Zander", "Alaric", "Cedric", "Damon", "Emeric", "Florian", "Godwin", "Hugo",
      "Ivan", "Jasper", "Konrad", "Leander", "Magnus", "Nestor", "Otto", "Percival"
    ],
    female: [
      "Adara", "Brenna", "Calla", "Dessa", "Elara", "Faye", "Greta", "Hild",
      "Ilena", "Jessa", "Kira", "Lyssa", "Maren", "Neve", "Orina", "Petra",
      "Rhea", "Senna", "Talia", "Una", "Viera", "Wren", "Yara", "Zara",
      "Astrid", "Brigid", "Cordelia", "Daphne", "Etta", "Freya", "Gwendolyn",
      "Helena", "Ingrid", "Juliana", "Katrina", "Lenora", "Mirabel", "Nadine"
    ]
  },
  dwarf: {
    male: [
      "Balin", "Dain", "Flint", "Gundren", "Harbek", "Kildrak", "Morgran", "Orsik",
      "Rurik", "Thoradin", "Vondal", "Brottor", "Darrak", "Eberk", "Fargrim",
      "Gardain", "Helm", "Adrik", "Bruenor", "Connerad", "Duergin", "Emerus",
      "Ghelryn", "Hundrin", "Kettil", "Nundro", "Rangrim", "Storn", "Tordek",
      "Ulfgar", "Vonbin", "Whurbin", "Dolgrin", "Grumbar", "Thordak"
    ],
    female: [
      "Amber", "Bardryn", "Dagnal", "Eldeth", "Gunnloda", "Helja", "Kathra",
      "Mardred", "Riswynn", "Sannl", "Torbera", "Vistra", "Audhild", "Diesa",
      "Falkrunn", "Gurdis", "Hlin", "Ilde", "Kotri", "Liftrasa", "Nora",
      "Kristryd", "Torgga", "Agna", "Bodill", "Dalkrunn", "Eridra", "Grelda",
      "Huldra", "Ingra", "Jennra", "Kordra", "Lastrid", "Magnild"
    ]
  },
  elf: {
    male: [
      "Adran", "Aramil", "Berrian", "Erevan", "Galinndan", "Heian", "Ivellios",
      "Laucian", "Quarion", "Riardon", "Soveliss", "Thamior", "Varis", "Aeson",
      "Caladrel", "Daeron", "Elion", "Faelar", "Galadon", "Hadarai", "Immeral",
      "Kyron", "Letharian", "Merethyl", "Naelen", "Paelias", "Rolen", "Sylvorn",
      "Tharivol", "Vaelith", "Zaos", "Aelindor", "Cirion", "Fenarel"
    ],
    female: [
      "Adrie", "Althaea", "Caelynn", "Drusilia", "Enna", "Ielenia", "Jelenneth",
      "Keyleth", "Lia", "Meriele", "Naivara", "Sariel", "Shanairra", "Thia",
      "Valanthe", "Aelene", "Birel", "Chaedi", "Daelynn", "Elowen", "Faelith",
      "Galadria", "Holone", "Ilanis", "Kaelas", "Lithiel", "Mylaela", "Nueleth",
      "Quelenna", "Silaqui", "Tessara", "Vaeril", "Yaelith"
    ]
  },
  halfling: {
    male: [
      "Alton", "Cade", "Eldon", "Garret", "Lyle", "Merric", "Osborn", "Roscoe",
      "Wellby", "Corrin", "Finnan", "Milo", "Bartho", "Dannad", "Errich", "Fildo",
      "Grover", "Hildo", "Jebeddo", "Kettleby", "Ludo", "Modo", "Norro", "Paxter",
      "Reed", "Stumpy", "Tegan", "Ulmo", "Wendel", "Yarro", "Bingo", "Drogo"
    ],
    female: [
      "Andry", "Bree", "Callie", "Cora", "Euphemia", "Kithri", "Lavinia", "Lidda",
      "Nedda", "Paela", "Portia", "Seraphina", "Shaena", "Vani", "Amaryllis",
      "Belinda", "Charmaine", "Dora", "Eglantine", "Fern", "Gilly", "Hilda",
      "Isolde", "Jillian", "Kestrel", "Linnet", "Marigold", "Nessa", "Olive",
      "Pearl", "Rosie", "Tansy"
    ]
  },
  gnome: {
    male: [
      "Alston", "Boddynock", "Brocc", "Dimble", "Eldon", "Frug", "Gerbo",
      "Gimble", "Glim", "Jebeddo", "Namfoodle", "Roondar", "Seebo", "Warryn",
      "Zook", "Addlewick", "Bimpnottin", "Cogsworth", "Dabble", "Erky",
      "Fibblestib", "Grickle", "Herbie", "Izzik", "Jorby", "Knibblet",
      "Lixto", "Mumbly", "Nackle", "Orryn", "Poog", "Quillby"
    ],
    female: [
      "Bimpnottin", "Breena", "Caramip", "Carlin", "Donella", "Duvamil",
      "Ellywick", "Lini", "Loopmottin", "Nissa", "Nyx", "Oda", "Orla",
      "Roywyn", "Shamil", "Tana", "Waywocket", "Zanna", "Abalaba", "Bixby",
      "Calliope", "Dabbledob", "Etti", "Fizzle", "Gwynna", "Hizzle",
      "Iva", "Jinka", "Kelby", "Lilbet", "Mipsy", "Nixie"
    ]
  },
  "half-orc": {
    male: [
      "Dench", "Feng", "Gell", "Henk", "Holg", "Imsh", "Keth", "Krusk",
      "Ront", "Shump", "Thokk", "Mhurren", "Agar", "Brughor", "Dral",
      "Grul", "Hrak", "Karg", "Lurtz", "Murak", "Narg", "Ohr", "Prog",
      "Rendar", "Skarr", "Tarak", "Ugarth", "Vrog", "Yurk", "Zornak",
      "Brug", "Crusk"
    ],
    female: [
      "Baggi", "Emen", "Engong", "Kansif", "Myev", "Neega", "Ovak", "Ownka",
      "Shautha", "Sutha", "Vola", "Yevelda", "Aggra", "Brekka", "Durga",
      "Ekra", "Grula", "Harsha", "Ilka", "Jazga", "Kulva", "Lurra",
      "Mogra", "Nula", "Orsha", "Pruda", "Ragga", "Shegra", "Tugra",
      "Ulka", "Vreka", "Zugga"
    ]
  },
  tiefling: {
    male: [
      "Akmenos", "Amnon", "Barakas", "Damakos", "Ekemon", "Iados", "Kairon",
      "Leucis", "Melech", "Mordai", "Morthos", "Pelaios", "Skamos", "Therai",
      "Arannis", "Castiel", "Draven", "Erasmus", "Fenriz", "Ghalen", "Haeron",
      "Ixion", "Jareth", "Khael", "Lazarus", "Malachai", "Nethys", "Orpheus",
      "Pyrrhus", "Ravos", "Sethis", "Thanael"
    ],
    female: [
      "Akta", "Bryseis", "Criella", "Damaia", "Ea", "Kallista", "Lerissa",
      "Makaria", "Nemeia", "Orianna", "Phelaia", "Rieta", "Anakis", "Belhara",
      "Cressida", "Delphine", "Euphoria", "Fenestra", "Galadria", "Helixia",
      "Ilvara", "Jessamine", "Kylessa", "Lilura", "Morrigan", "Nythara",
      "Ozara", "Persepha", "Ravenna", "Sylarise", "Tethys", "Vaelith"
    ]
  },
  dragonborn: {
    male: [
      "Arjhan", "Balasar", "Bharash", "Donaar", "Ghesh", "Heskan", "Kriv",
      "Medrash", "Mehen", "Nadarr", "Pandjed", "Patrin", "Rhogar", "Shamash",
      "Shedinn", "Tarhun", "Torinn", "Aral", "Biri", "Daar", "Errich",
      "Farideh", "Gorath", "Harann", "Ildrex", "Jarash", "Kaladan", "Lorash",
      "Mordrin", "Nithral", "Ophinax", "Razaan"
    ],
    female: [
      "Akra", "Biri", "Daar", "Farideh", "Harann", "Havilar", "Jheri",
      "Kava", "Korinn", "Mishann", "Nala", "Perra", "Raiann", "Sora",
      "Surina", "Thava", "Uadjit", "Anara", "Belthara", "Clethra",
      "Drathira", "Essendra", "Fendira", "Geshana", "Hileli", "Irthara",
      "Jezira", "Khaless", "Lithira", "Myathethil", "Neheri", "Othiria"
    ]
  }
};

/**
 * Shopkeeper Surnames / Clan Names
 * Organized by race affinity — generator picks from race-specific first, then common
 */
export const SURNAMES = {
  common: [
    "Ashford", "Blackwood", "Copperkettle", "Dunwall", "Farrow", "Greenbottle",
    "Hammerfall", "Ironbark", "Kettleburn", "Longstride", "Mossgrove", "Nighthollow",
    "Oakbarrel", "Pinchpenny", "Quickfoot", "Redforge", "Silverstream", "Thornwall",
    "Underhill", "Warmhearth", "Brightmantle", "Coalvein", "Deepdelve", "Emberglow",
    "Flintshire", "Goldweaver", "Hearthstone", "Inkwell", "Jadehelm", "Keenedge",
    "Larkspur", "Millstone", "Northgate", "Overdale", "Proudfoot", "Ravenscroft",
    "Stonebridge", "Tallowmere", "Underwood", "Valewood", "Whitmore", "Yarrow"
  ],
  dwarf: [
    "Battlehammer", "Brawnanvil", "Dankil", "Fireforge", "Frostbeard", "Gorunn",
    "Holderhek", "Ironfist", "Loderr", "Lutgehr", "Rumnaheim", "Strakeln",
    "Torunn", "Ungart", "Balderk", "Berylore", "Coppermantle", "Deepmug",
    "Earthbreaker", "Flintlock", "Granitehelm", "Hammerbane", "Ironshield",
    "Kragstone", "Mithralvein", "Onyxbeard", "Steelspine", "Thunderbelch"
  ],
  elf: [
    "Amakiir", "Amastacia", "Galanodel", "Holimion", "Liadon", "Meliamne",
    "Nailo", "Siannodel", "Ilphelkiir", "Xiloscient", "Alenuath", "Brightsong",
    "Dawnwhisper", "Evenstar", "Featherfall", "Gladewalker", "Highbreeze",
    "Ivywood", "Leafshadow", "Moonbrook", "Nightbloom", "Starweaver",
    "Sunsorrow", "Thornvale", "Whisperwind", "Winterglen"
  ],
  halfling: [
    "Brushgather", "Goodbarrel", "Greenbottle", "Highhill", "Hilltopple",
    "Leagallow", "Tealeaf", "Thorngage", "Tosscobble", "Underbough",
    "Appleblossom", "Brightmoon", "Cherrydale", "Dewfoot", "Elderberry",
    "Fairweather", "Goldworthy", "Honeywell", "Kettleworth", "Lightfoot",
    "Merryweather", "Nimblefingers", "Pebblebrook", "Sweetwater", "Thistledown"
  ]
};

/**
 * Shopkeeper Nicknames — optional, added between first and last name
 * e.g. Aldric "Silvertongue" Copperkettle
 */
export const NICKNAMES = [
  "Fingers", "The Honest", "Old Sly", "Bargain", "Penny", "The Bear",
  "Silvertongue", "One-Eye", "The Fox", "Coppermouth", "Grumbles", "Smiles",
  "Lucky", "The Wall", "Whiskers", "Haggle", "Two-Coins", "Red", "Patches",
  "The Miser", "Goldfist", "Scales", "The Crow", "Weasel", "The Badger",
  "Iron Jaw", "Lockbox", "The Mule", "Nimble", "Quick Count", "The Ox",
  "Pockets", "Sharp Eye", "The Rat", "Tallyman", "Thumbs", "The Gull",
  "Half-Price", "No-Refund", "Coin Bite"
];

/**
 * Nickname chance — probability of a shopkeeper getting a nickname
 */
export const NICKNAME_CHANCE = 0.2;

/**
 * Available shopkeeper races and their relative generation weights
 * Higher weight = more likely to appear
 */
export const SHOPKEEPER_RACES = [
  { race: "human", weight: 30 },
  { race: "dwarf", weight: 20 },
  { race: "elf", weight: 12 },
  { race: "halfling", weight: 15 },
  { race: "gnome", weight: 10 },
  { race: "half-orc", weight: 5 },
  { race: "tiefling", weight: 4 },
  { race: "dragonborn", weight: 4 }
];

/**
 * Gender options and weights for generation
 */
export const GENDERS = [
  { gender: "male", weight: 50 },
  { gender: "female", weight: 50 }
];
