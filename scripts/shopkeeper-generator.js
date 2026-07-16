/**
 * Shopkeeper Generator
 * Generates complete shopkeeper NPCs: name, personality, appearance,
 * stat block, social DCs, and optional bias
 *
 * The Merchant's Guild — FoundryVTT Module
 */

import {
  FIRST_NAMES,
  SURNAMES,
  NICKNAMES,
  NICKNAME_CHANCE,
  SHOPKEEPER_RACES,
  GENDERS
} from "./tables/names.js";
import {
  PERSONALITY_TRAITS,
  PHYSICAL_QUIRKS,
  TRAIT_COUNT,
  QUIRK_COUNT
} from "./tables/personalities.js";
import {
  BIAS_CHANCE,
  BIAS_SEVERITY,
  BIAS_MARKUP,
  BIAS_TARGET_TYPE,
  RACE_BIAS_TARGETS,
  CLASS_BIAS_TARGETS,
  BIAS_RP_CUES,
  PRONOUNS
} from "./tables/bias-tables.js";

// ============================================================
// Utility Functions (local copies to avoid circular imports)
// ============================================================

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedPick(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

/**
 * Random integer between min and max (inclusive)
 */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Pick N unique random elements from an array
 */
function pickN(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

// ============================================================
// Name Generation
// ============================================================

/**
 * Generate a shopkeeper name
 *
 * @param {string} race - Shopkeeper race
 * @param {string} gender - "male" or "female"
 * @returns {object} { fullName, firstName, surname, nickname }
 */
function generateName(race, gender) {
  // Get first name pool for this race/gender
  const raceNames = FIRST_NAMES[race];
  if (!raceNames || !raceNames[gender]) {
    // Fallback to human if race not found
    const fallback = FIRST_NAMES.human[gender];
    return buildName(pick(fallback), race);
  }

  const firstName = pick(raceNames[gender]);
  return buildName(firstName, race);
}

/**
 * Assemble the full name with optional nickname
 */
function buildName(firstName, race) {
  // Pick surname — use race-specific if available, otherwise common
  const raceSurnames = SURNAMES[race] || [];
  const commonSurnames = SURNAMES.common;

  // 60% chance to use race-specific surname if available, 40% common
  const surname = (raceSurnames.length > 0 && Math.random() < 0.6)
    ? pick(raceSurnames)
    : pick(commonSurnames);

  // Optional nickname
  let nickname = null;
  if (Math.random() < NICKNAME_CHANCE) {
    nickname = pick(NICKNAMES);
  }

  const fullName = nickname
    ? `${firstName} "${nickname}" ${surname}`
    : `${firstName} ${surname}`;

  return { fullName, firstName, surname, nickname };
}

// ============================================================
// Personality & Quirks
// ============================================================

/**
 * Generate personality traits and physical quirks
 *
 * @returns {object} { traits: Array, quirks: Array, dcNudges: object }
 */
function generatePersonality() {
  // Pick 1-2 personality traits
  const traitCount = randInt(TRAIT_COUNT.min, TRAIT_COUNT.max);
  const traits = pickN(PERSONALITY_TRAITS, traitCount);

  // Pick physical quirks
  const quirks = pickN(PHYSICAL_QUIRKS, QUIRK_COUNT);

  // Aggregate DC nudges from all traits
  const dcNudges = {
    haggle: 0,
    intimidate: 0,
    theft: 0,
    perception: 0,
    insight: 0
  };

  for (const trait of traits) {
    if (trait.dcNudges) {
      for (const [key, value] of Object.entries(trait.dcNudges)) {
        if (dcNudges.hasOwnProperty(key)) {
          dcNudges[key] += value;
        }
      }
    }
  }

  return {
    traits,
    quirks,
    dcNudges
  };
}

// ============================================================
// Stat Block Generation
// ============================================================

/**
 * Base NPC stat templates by affluence tier
 * These define the baseline — the generator adds minor variance
 */
const STAT_TEMPLATES = {
  1: { // Hamlet
    baseNPC: "Commoner",
    cr: "0",
    ac: 10, hp: 4,
    str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
    abilities: []
  },
  2: { // Village
    baseNPC: "Commoner",
    cr: "0",
    ac: 10, hp: 6,
    str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 11,
    abilities: []
  },
  3: { // Town
    baseNPC: "Guard",
    cr: "1/8",
    ac: 14, hp: 16,
    str: 13, dex: 12, con: 12, int: 10, wis: 11, cha: 12,
    abilities: ["Carries a weapon behind the counter"]
  },
  4: { // City
    baseNPC: "Veteran",
    cr: "3",
    ac: 15, hp: 38,
    str: 14, dex: 13, con: 14, int: 11, wis: 12, cha: 14,
    abilities: ["Likely has a guard or two nearby", "Carries a concealed weapon"]
  },
  5: { // Metropolis
    baseNPC: "Knight",
    cr: "3",
    ac: 16, hp: 52,
    str: 14, dex: 12, con: 14, int: 12, wis: 13, cha: 16,
    abilities: ["Has guards on retainer", "May have magical protections or wards"]
  }
};

/**
 * Special stat templates for magic shop owners at higher affluence
 */
const MAGIC_SHOP_STAT_OVERRIDES = {
  4: { // City magic shop
    baseNPC: "Mage",
    cr: "6",
    ac: 12, hp: 40,
    str: 9, dex: 14, con: 11, int: 17, wis: 12, cha: 14,
    abilities: ["Spellcasting (9th level)", "May have magical wards on merchandise"]
  },
  5: { // Metropolis magic shop
    baseNPC: "Archmage",
    cr: "12",
    ac: 15, hp: 99,
    str: 10, dex: 14, con: 12, int: 20, wis: 15, cha: 16,
    abilities: ["Spellcasting (18th level)", "Magical wards throughout the shop", "Likely has arcane defenses"]
  }
};

/**
 * Generate a light stat block for the shopkeeper
 *
 * @param {number} affluenceTier - 1-5
 * @param {string} [storeType] - Optional store type for special overrides
 * @returns {object} Stat block object matching the spec
 */
function generateStatBlock(affluenceTier, storeType) {
  // Check for magic shop overrides
  let template;
  if (storeType === "magic-shop" && MAGIC_SHOP_STAT_OVERRIDES[affluenceTier]) {
    template = { ...MAGIC_SHOP_STAT_OVERRIDES[affluenceTier] };
  } else {
    template = { ...STAT_TEMPLATES[affluenceTier] || STAT_TEMPLATES[1] };
  }

  // Add minor variance to ability scores (±1) for non-commoners
  if (affluenceTier > 1) {
    for (const stat of ["str", "dex", "con", "int", "wis", "cha"]) {
      template[stat] += randInt(-1, 1);
      // Floor at 8
      template[stat] = Math.max(8, template[stat]);
    }
    // Minor HP variance
    template.hp += randInt(-2, 4);
    template.hp = Math.max(1, template.hp);
  }

  return {
    ac: template.ac,
    hp: template.hp,
    str: template.str,
    dex: template.dex,
    con: template.con,
    int: template.int,
    wis: template.wis,
    cha: template.cha,
    cr: template.cr,
    abilities: [...template.abilities],
    baseNPC: template.baseNPC
  };
}

// ============================================================
// Social DC Generation
// ============================================================

/**
 * Base social DCs by affluence tier
 * These are the starting point — personality nudges are applied on top
 */
const BASE_SOCIAL_DCS = {
  1: { haggleDC: 8,  intimidateDC: 8,  theftDC: 10, perceptionPassive: 10, insightPassive: 9  },
  2: { haggleDC: 10, intimidateDC: 10, theftDC: 12, perceptionPassive: 11, insightPassive: 10 },
  3: { haggleDC: 13, intimidateDC: 13, theftDC: 14, perceptionPassive: 13, insightPassive: 12 },
  4: { haggleDC: 15, intimidateDC: 16, theftDC: 16, perceptionPassive: 15, insightPassive: 14 },
  5: { haggleDC: 18, intimidateDC: 20, theftDC: 19, perceptionPassive: 17, insightPassive: 16 }
};

/**
 * Maps personality DC nudge keys to social DC field names
 */
const DC_NUDGE_MAP = {
  haggle: "haggleDC",
  intimidate: "intimidateDC",
  theft: "theftDC",
  perception: "perceptionPassive",
  insight: "insightPassive"
};

/**
 * Generate social DCs for a shopkeeper
 *
 * @param {number} affluenceTier - 1-5
 * @param {object} personalityDCNudges - Aggregated DC nudges from personality traits
 * @returns {object} Social DCs object matching the spec
 */
function generateSocialDCs(affluenceTier, personalityDCNudges) {
  const baseDCs = { ...(BASE_SOCIAL_DCS[affluenceTier] || BASE_SOCIAL_DCS[1]) };

  // Apply random variance (±1-2)
  for (const key of Object.keys(baseDCs)) {
    baseDCs[key] += randInt(-1, 1);
  }

  // Apply personality nudges
  for (const [nudgeKey, nudgeValue] of Object.entries(personalityDCNudges)) {
    const dcField = DC_NUDGE_MAP[nudgeKey];
    if (dcField && baseDCs.hasOwnProperty(dcField)) {
      baseDCs[dcField] += nudgeValue;
    }
  }

  // Floor all DCs at 5 (can't be trivially easy)
  for (const key of Object.keys(baseDCs)) {
    baseDCs[key] = Math.max(5, baseDCs[key]);
  }

  return baseDCs;
}

// ============================================================
// Bias Generation
// ============================================================

/**
 * Generate a shopkeeper bias (or null if none)
 *
 * @param {string} shopkeeperRace - The shopkeeper's race
 * @param {string} shopkeeperGender - The shopkeeper's gender
 * @param {boolean} biasEnabled - Whether the bias system is active
 * @returns {object|null} Bias object or null
 */
function generateBias(shopkeeperRace, shopkeeperGender, biasEnabled) {
  // Check if bias system is enabled
  if (!biasEnabled) return null;

  // Roll for bias chance
  if (Math.random() > BIAS_CHANCE) return null;

  // Determine severity
  const severityResult = weightedPick(BIAS_SEVERITY);
  const severity = severityResult.severity;

  // Determine target type (race or class)
  const targetTypeResult = weightedPick(BIAS_TARGET_TYPE);
  const targetType = targetTypeResult.type;

  let targetValue;

  if (targetType === "race") {
    // Get race-specific bias targets
    const raceTargets = RACE_BIAS_TARGETS[shopkeeperRace] || RACE_BIAS_TARGETS.human;

    // Filter out the shopkeeper's own race
    const validTargets = raceTargets.filter(t => t.target !== shopkeeperRace);

    if (validTargets.length === 0) return null;

    targetValue = weightedPick(validTargets).target;
  } else {
    // Class bias
    targetValue = weightedPick(CLASS_BIAS_TARGETS).target;
  }

  // Calculate price markup for unfavorable biases
  let priceMarkup = null;
  if (severity === "unfavorable") {
    const range = BIAS_MARKUP.unfavorable;
    priceMarkup = randInt(range.min, range.max);
  }

  // Generate RP cue
  const rpCue = generateBiasRPCue(targetType, severity, targetValue, shopkeeperGender);

  return {
    targetType,
    targetValue,
    severity,
    priceMarkup,
    rpCue
  };
}

/**
 * Fill in an RP cue template with actual values
 */
function generateBiasRPCue(targetType, severity, targetValue, shopkeeperGender) {
  const cueTemplates = BIAS_RP_CUES[targetType]?.[severity];
  if (!cueTemplates || cueTemplates.length === 0) {
    return `The shopkeeper has issues with ${targetValue}s.`;
  }

  const template = pick(cueTemplates);
  const pronouns = PRONOUNS[shopkeeperGender] || PRONOUNS.male;

  return template
    .replace(/\{target\}/g, targetValue)
    .replace(/\{pronounSubj\}/g, pronouns.pronounSubj)
    .replace(/\{pronounObj\}/g, pronouns.pronounObj)
    .replace(/\{pronounPos\}/g, pronouns.pronounPos);
}

// ============================================================
// Physical Description Generation
// ============================================================

/**
 * Generate a brief physical description for the shopkeeper
 * Combines race, gender, and quirk into a readable sentence
 *
 * @param {string} race
 * @param {string} gender
 * @param {Array<string>} quirks
 * @returns {string}
 */
function generatePhysicalDescription(race, gender, quirks) {
  const ages = [
    "young", "middle-aged", "older", "elderly", "weathered",
    "seasoned", "youthful-looking", "gray-haired", "aged but spry"
  ];

  const builds = [
    "stocky", "lean", "broad-shouldered", "wiry", "heavyset",
    "slight", "muscular", "stout", "tall and thin", "compact"
  ];

  const age = pick(ages);
  const build = pick(builds);
  const quirkText = quirks.length > 0 ? ` ${quirks[0]}.` : "";

  // Capitalize race for display
  const raceDisplay = race.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("-");

  return `A ${age}, ${build} ${raceDisplay}.${quirkText}`;
}

// ============================================================
// Main Shopkeeper Generation
// ============================================================

/**
 * Generate a complete shopkeeper
 *
 * @param {object} options
 * @param {number} options.affluenceTier - 1-5
 * @param {boolean} [options.biasEnabled=true] - Whether bias generation is active
 * @param {string} [options.storeType] - Store type for stat block overrides
 * @returns {object} Complete shopkeeper object matching the spec
 */
export function generateShopkeeper({ affluenceTier, biasEnabled = true, storeType = null }) {
  // Pick race and gender
  const raceResult = weightedPick(SHOPKEEPER_RACES);
  const race = raceResult.race;
  const genderResult = weightedPick(GENDERS);
  const gender = genderResult.gender;

  // Generate name
  const nameData = generateName(race, gender);

  // Generate personality
  const personality = generatePersonality();
  const personalityLabel = personality.traits.map(t => t.label).join("; ");
  const rpHints = personality.traits.map(t => t.rpHint).join(" ");

  // Generate stat block
  const statBlock = generateStatBlock(affluenceTier, storeType);

  // Generate social DCs (base + random variance + personality nudges)
  const socialDCs = generateSocialDCs(affluenceTier, personality.dcNudges);

  // Generate bias
  const bias = generateBias(race, gender, biasEnabled);

  // Generate physical description
  const physicalDescription = generatePhysicalDescription(race, gender, personality.quirks);

  return {
    name: nameData.fullName,
    firstName: nameData.firstName,
    surname: nameData.surname,
    nickname: nameData.nickname,
    race,
    gender,
    personality: personalityLabel,
    rpHints,
    quirk: personality.quirks.length > 0 ? personality.quirks[0] : "",
    physicalDescription,
    statBlock,
    socialDCs,
    bias
  };
}
