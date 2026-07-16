/**
 * Bias Tables
 * Shopkeeper bias targets, severity weights, race-based probabilities, RP cue templates
 *
 * The Merchant's Guild — FoundryVTT Module
 */

/**
 * Overall probability that any generated shopkeeper has a bias
 * This is checked first — if it fails, no bias is generated at all
 */
export const BIAS_CHANCE = 0.12;

/**
 * Severity distribution — when a bias IS generated, how severe is it?
 */
export const BIAS_SEVERITY = [
  { severity: "unfavorable", weight: 80 },
  { severity: "hostile", weight: 20 }
];

/**
 * Price markup ranges by severity
 * The generator picks a random value within the range
 */
export const BIAS_MARKUP = {
  unfavorable: { min: 10, max: 20 },
  hostile: null // No transaction — refuses service
};

/**
 * Bias target type distribution
 */
export const BIAS_TARGET_TYPE = [
  { type: "race", weight: 70 },
  { type: "class", weight: 30 }
];

/**
 * Race bias weights — indexed by shopkeeper race
 * Each entry lists possible target races and their relative probability
 * Biases are weighted toward traditional D&D racial tensions
 * A shopkeeper will never have a bias against their own race
 */
export const RACE_BIAS_TARGETS = {
  human: [
    { target: "tiefling", weight: 25 },
    { target: "half-orc", weight: 25 },
    { target: "dragonborn", weight: 15 },
    { target: "elf", weight: 10 },
    { target: "dwarf", weight: 5 },
    { target: "halfling", weight: 5 },
    { target: "gnome", weight: 5 }
  ],
  dwarf: [
    { target: "elf", weight: 30 },
    { target: "half-orc", weight: 25 },
    { target: "tiefling", weight: 15 },
    { target: "goblinoid", weight: 15 },
    { target: "dragonborn", weight: 10 }
  ],
  elf: [
    { target: "dwarf", weight: 20 },
    { target: "half-orc", weight: 25 },
    { target: "tiefling", weight: 15 },
    { target: "human", weight: 10 },
    { target: "dragonborn", weight: 10 },
    { target: "gnome", weight: 5 }
  ],
  halfling: [
    { target: "half-orc", weight: 30 },
    { target: "dragonborn", weight: 20 },
    { target: "tiefling", weight: 20 },
    { target: "human", weight: 10 },
    { target: "dwarf", weight: 5 }
  ],
  gnome: [
    { target: "half-orc", weight: 25 },
    { target: "dragonborn", weight: 20 },
    { target: "tiefling", weight: 15 },
    { target: "human", weight: 10 },
    { target: "dwarf", weight: 10 }
  ],
  "half-orc": [
    { target: "elf", weight: 25 },
    { target: "halfling", weight: 20 },
    { target: "human", weight: 15 },
    { target: "dwarf", weight: 15 },
    { target: "tiefling", weight: 10 }
  ],
  tiefling: [
    { target: "human", weight: 25 },
    { target: "dwarf", weight: 20 },
    { target: "halfling", weight: 15 },
    { target: "elf", weight: 15 },
    { target: "dragonborn", weight: 10 }
  ],
  dragonborn: [
    { target: "tiefling", weight: 25 },
    { target: "half-orc", weight: 20 },
    { target: "gnome", weight: 15 },
    { target: "elf", weight: 15 },
    { target: "human", weight: 10 }
  ]
};

/**
 * Class bias targets and weights
 * Biases tend toward classes with shady, supernatural, or intimidating reputations
 */
export const CLASS_BIAS_TARGETS = [
  { target: "Warlock", weight: 25 },
  { target: "Rogue", weight: 20 },
  { target: "Necromancer", weight: 15 },
  { target: "Sorcerer", weight: 10 },
  { target: "Barbarian", weight: 10 },
  { target: "Wizard", weight: 5 },
  { target: "Ranger", weight: 5 },
  { target: "Paladin", weight: 5 },
  { target: "Cleric", weight: 3 },
  { target: "Fighter", weight: 2 }
];

/**
 * RP Cue Templates — organized by target type and severity
 * {target} is replaced with the race or class name
 * {pronoun} / {pronounObj} / {pronounPos} for shopkeeper pronouns
 */
export const BIAS_RP_CUES = {
  race: {
    unfavorable: [
      "\"Hmph. Your coin spends the same as anyone's, I suppose. Prices are firm.\"",
      "\"We don't get many {target}s in here. Prices might be a bit... different for your kind.\"",
      "\"{pronounSubj} narrows {pronounPos} eyes when {target}s enter. Service is curt, prices inflated.\"",
      "\"I'll serve you, but don't expect me to smile about it. That'll be extra.\"",
      "\"{pronounSubj} makes a point of counting {pronounPos} inventory after {target}s browse.\"",
      "\"Nothing personal. My prices for {target}s just happen to be higher.\"",
      "\"Last {target} who came through here tried to haggle. I don't haggle with your kind.\""
    ],
    hostile: [
      "\"I think you'd best take your business elsewhere. We don't serve {target}s here.\"",
      "\"{pronounSubj} crosses {pronounPos} arms and shakes {pronounPos} head. 'Not today. Not for {target}s.'\"",
      "\"The door's behind you. I've got nothing for {target}s.\"",
      "\"{pronounSubj} points to a crudely lettered sign: 'No {target}s. No exceptions.'\"",
      "\"You've got some nerve walking in here. Get out before I call the guard.\""
    ]
  },
  class: {
    unfavorable: [
      "\"I can smell the {target} on you. Everything costs extra for the... risk.\"",
      "\"A {target}, eh? I'll do business, but you'll pay a premium for the privilege.\"",
      "\"{pronounSubj} eyes your {target} gear warily. Prices seem to climb as {pronounSubj} talks.\"",
      "\"Your kind has a reputation. My prices reflect that. Take it or leave it.\"",
      "\"Last {target} who came through cost me half my stock. So forgive the markup.\""
    ],
    hostile: [
      "\"I don't do business with {target}s. Had a bad experience. Door's that way.\"",
      "\"{pronounSubj} takes one look at you and shakes {pronounPos} head. 'No {target}s. Bad for business.'\"",
      "\"Get that {target} nonsense out of my shop. I won't have it under my roof.\"",
      "\"My shop, my rules. And rule one is no {target}s. Try the next town.\""
    ]
  }
};

/**
 * Pronoun sets for RP cue template filling
 */
export const PRONOUNS = {
  male: { pronounSubj: "He", pronounObj: "him", pronounPos: "his" },
  female: { pronounSubj: "She", pronounObj: "her", pronounPos: "her" }
};
