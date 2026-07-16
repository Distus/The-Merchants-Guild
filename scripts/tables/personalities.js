/**
 * Personality Tables
 * Personality traits, physical quirks, and DC nudge mappings
 *
 * The Merchant's Guild — FoundryVTT Module
 */

/**
 * Personality Traits — pick 1-2 per shopkeeper
 * Each trait has an id, display label, and optional DC nudges
 *
 * DC nudges modify the base social DCs for this shopkeeper:
 *   haggle, intimidate, theft, perception, insight
 *   Positive = harder, Negative = easier
 */
export const PERSONALITY_TRAITS = [
  {
    id: "gruff-but-fair",
    label: "Gruff but fair",
    rpHint: "Short on pleasantries, but always gives honest prices.",
    dcNudges: {}
  },
  {
    id: "cheerful-chatty",
    label: "Cheerful and chatty",
    rpHint: "Talks endlessly about nothing. Will keep you here all day if you let them.",
    dcNudges: { haggle: -1 }
  },
  {
    id: "suspicious-adventurers",
    label: "Suspicious of adventurers",
    rpHint: "Eyes every weapon and spell component pouch with distrust.",
    dcNudges: { insight: 2, theft: 1 }
  },
  {
    id: "overly-friendly",
    label: "Overly friendly",
    rpHint: "Treats every customer like a long-lost friend. Uncomfortably so.",
    dcNudges: { theft: -1, haggle: -1 }
  },
  {
    id: "shrewd-negotiator",
    label: "Shrewd negotiator",
    rpHint: "Knows the value of every coin and won't let one slip.",
    dcNudges: { haggle: 2, insight: 1 }
  },
  {
    id: "absent-minded",
    label: "Absent-minded",
    rpHint: "Frequently loses track of conversations, inventory, and sometimes customers.",
    dcNudges: { theft: -2, perception: -2 }
  },
  {
    id: "boastful",
    label: "Boastful about their wares",
    rpHint: "Every item is 'the finest you'll find this side of Waterdeep.'",
    dcNudges: { haggle: 1 }
  },
  {
    id: "quiet-watchful",
    label: "Quiet and watchful",
    rpHint: "Says little. Sees everything.",
    dcNudges: { perception: 2, insight: 1 }
  },
  {
    id: "flirtatious",
    label: "Flirtatious",
    rpHint: "Winks, compliments, and leans on the counter. All part of the sales pitch.",
    dcNudges: { haggle: -1 }
  },
  {
    id: "nervous-jumpy",
    label: "Nervous and jumpy",
    rpHint: "Flinches at loud noises. Keeps glancing at the door.",
    dcNudges: { intimidate: -2, perception: 1 }
  },
  {
    id: "fiercely-proud",
    label: "Fiercely proud",
    rpHint: "Insult their shop and you insult their bloodline.",
    dcNudges: { intimidate: 2, haggle: 1 }
  },
  {
    id: "sarcastic",
    label: "Sarcastic",
    rpHint: "Has a cutting remark for every question. Somehow still likeable.",
    dcNudges: {}
  },
  {
    id: "parental",
    label: "Maternal/Paternal",
    rpHint: "Fusses over customers like they're wayward children. 'Have you eaten today?'",
    dcNudges: { intimidate: 1 }
  },
  {
    id: "storyteller",
    label: "Tells long stories",
    rpHint: "Every item has a backstory. Every backstory has three tangents.",
    dcNudges: { theft: -1 }
  },
  {
    id: "deeply-religious",
    label: "Deeply religious",
    rpHint: "Invokes their deity in every other sentence. Prices are 'blessed.'",
    dcNudges: { insight: 1 }
  },
  {
    id: "paranoid-thieves",
    label: "Paranoid about thieves",
    rpHint: "Watches hands constantly. Everything valuable is behind the counter.",
    dcNudges: { perception: 2, theft: 2 }
  },
  {
    id: "competitive",
    label: "Competitive with rival shops",
    rpHint: "Will badmouth the competition at every opportunity.",
    dcNudges: { haggle: -1 }
  },
  {
    id: "nostalgic",
    label: "Nostalgic for the old days",
    rpHint: "'Back in my day, a healing potion cost two silver and a handshake.'",
    dcNudges: {}
  },
  {
    id: "scholarly-curious",
    label: "Scholarly and curious",
    rpHint: "More interested in where you've been than what you're buying.",
    dcNudges: { insight: 1 }
  },
  {
    id: "impatient",
    label: "Impatient with indecision",
    rpHint: "'Buy something or move along — you're blocking the door.'",
    dcNudges: { intimidate: -1 }
  },
  {
    id: "world-weary",
    label: "World-weary",
    rpHint: "Has seen it all and is deeply unimpressed by adventurers.",
    dcNudges: { intimidate: 1, insight: 1 }
  },
  {
    id: "bumbling",
    label: "Bumbling but well-meaning",
    rpHint: "Knocks things over, misquotes prices, but genuinely tries to help.",
    dcNudges: { theft: -1, haggle: -1, perception: -1 }
  },
  {
    id: "secretive",
    label: "Secretive",
    rpHint: "Speaks in low tones and keeps the good stuff under the counter.",
    dcNudges: { insight: 2 }
  },
  {
    id: "jolly",
    label: "Jolly and loud",
    rpHint: "Laughs at everything, slaps the counter, and calls everyone 'friend.'",
    dcNudges: { perception: -1 }
  },
  {
    id: "meticulous",
    label: "Meticulous and precise",
    rpHint: "Counts every coin twice. Wraps purchases with unnecessary care.",
    dcNudges: { haggle: 1, perception: 1 }
  }
];

/**
 * Physical Quirks — pick 1 per shopkeeper
 * Pure flavor, no mechanical effect
 */
export const PHYSICAL_QUIRKS = [
  "Missing a finger on their left hand",
  "Has a prominent scar across one cheek",
  "Wears an eyepatch over their right eye",
  "Constantly polishing something — a glass, a blade, the counter",
  "Smokes a long-stemmed pipe that never seems to go out",
  "Has a small pet on the counter — a cat, a raven, or a lizard",
  "Wears far too much jewelry for their station",
  "Has ink-stained hands that never quite come clean",
  "Wears a flour-dusted apron regardless of what they sell",
  "Sports an enormous mustache, meticulously waxed",
  "Unusually tall for their race",
  "Unusually short for their race",
  "Speaks with a noticeable lisp",
  "Hums constantly while working",
  "Squints at everything as if perpetually suspicious or nearsighted",
  "Missing several teeth, smiles anyway",
  "Always eating something — jerky, an apple, bread",
  "Has a tattoo on their neck that they try to keep covered",
  "Wears mismatched boots and doesn't seem to notice",
  "Hands that never stop moving — fidgeting, tapping, adjusting",
  "Smells faintly of herbs regardless of what they sell",
  "Smells permanently of smoke",
  "Has a raspy voice as if they once breathed too much forge smoke",
  "Walks with a pronounced limp",
  "Has an enormous beard braided with small beads or coins",
  "Wears spectacles perched on the very tip of their nose",
  "Has a nervous habit of cracking their knuckles",
  "One eye is a distinctly different color from the other",
  "Always has a measuring tape draped around their neck",
  "Has burn scars on their forearms",
  "Chews on a wooden toothpick at all times",
  "Keeps a dagger visible on the counter — 'just in case'",
  "Wears a faded military medal pinned to their chest",
  "Hair is a completely unnatural color — bright red, white, deep blue",
  "Whistles tunelessly through a gap in their teeth"
];

/**
 * How many personality traits to assign per shopkeeper
 */
export const TRAIT_COUNT = { min: 1, max: 2 };

/**
 * How many physical quirks to assign per shopkeeper
 */
export const QUIRK_COUNT = 1;
