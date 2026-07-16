/**
 * Shop Generator
 * Handles shop creation, name generation, and description generation
 *
 * The Merchant's Guild — FoundryVTT Module
 */

import { SHOP_NAME_PREFIXES, SHOP_NAME_NOUNS } from "./tables/names.js";
import {
  DESCRIPTION_TEMPLATES,
  EXTERIOR_CONDITIONS,
  BUILDING_TYPES,
  EXTERIOR_FEATURES,
  INTERIOR_DESCRIPTIONS,
  ATMOSPHERE_DETAILS,
  SCENTS,
  DOOR_TYPES,
  GREETING_ACTIONS,
  COUNTER_TYPES,
  SHOP_CONDITIONS,
  STORE_TYPE_FLAVOR
} from "./tables/descriptions.js";
import { generateShopkeeper } from "./shopkeeper-generator.js";

/**
 * Store type definitions — maps internal IDs to display labels
 */
export const STORE_TYPES = {
  "general-goods": "General Goods",
  "blacksmith": "Blacksmith / Weaponsmith",
  "armorer": "Armorer",
  "apothecary": "Apothecary / Herbalist",
  "fletcher": "Fletcher",
  "magic-shop": "Magic Shop / Arcane Curiosities",
  "tavern": "Tavern / Inn",
  "stables": "Stables",
  "jeweler": "Jeweler",
  "clothier": "Clothier / Tailor"
};

/**
 * Affluence tier definitions
 */
export const AFFLUENCE_TIERS = {
  1: { label: "Hamlet",     priceModifier: 1.20 },
  2: { label: "Village",    priceModifier: 1.00 },
  3: { label: "Town",       priceModifier: 1.00 },
  4: { label: "City",       priceModifier: 0.90 },
  5: { label: "Metropolis", priceModifier: 0.85 }
};

// ============================================================
// Utility Functions
// ============================================================

/**
 * Pick a random element from an array
 * @param {Array} arr
 * @returns {*}
 */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Pick a random element using weighted probabilities
 * @param {Array<{weight: number}>} items - Array of objects with a weight property
 * @returns {*} The selected item
 */
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
 * Generate a v4 UUID
 * @returns {string}
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ============================================================
// Shop Name Generation
// ============================================================

/**
 * Map store type IDs to their noun list key
 * Some types use "general" nouns as fallback
 */
const NOUN_KEY_MAP = {
  "general-goods": "general",
  "blacksmith": "blacksmith",
  "armorer": "armorer",
  "apothecary": "apothecary",
  "fletcher": "fletcher",
  "magic-shop": "magic-shop",
  "tavern": "tavern",
  "stables": "stables",
  "jeweler": "jeweler",
  "clothier": "clothier"
};

/**
 * Generate a shop name based on store type
 *
 * Patterns:
 *  - "The {prefix} {noun}"       (40% chance)
 *  - "{prefix} {noun}"           (40% chance)
 *  - "{prefix}'s {noun}"         (20% chance — possessive, works well for some types)
 *
 * Taverns always use "The {prefix} {noun}" pattern
 *
 * @param {string} storeType - Store type ID
 * @returns {string} Generated shop name
 */
export function generateShopName(storeType) {
  const prefixes = SHOP_NAME_PREFIXES[storeType] || SHOP_NAME_PREFIXES["general-goods"];
  const nounKey = NOUN_KEY_MAP[storeType] || "general";
  const typeNouns = SHOP_NAME_NOUNS[nounKey] || [];
  const generalNouns = SHOP_NAME_NOUNS.general || [];

  // 70% chance to use type-specific noun, 30% to use a general noun
  // (only if type-specific nouns exist)
  const noun = (typeNouns.length > 0 && Math.random() < 0.7)
    ? pick(typeNouns)
    : pick(generalNouns);

  const prefix = pick(prefixes);

  // Taverns always use "The X Y" pattern
  if (storeType === "tavern") {
    return `The ${prefix} ${noun}`;
  }

  // Other shops pick a pattern
  const roll = Math.random();
  if (roll < 0.4) {
    return `The ${prefix} ${noun}`;
  } else if (roll < 0.8) {
    return `${prefix} ${noun}`;
  } else {
    // Possessive — trim trailing 's if the prefix already has one
    const possPrefix = prefix.endsWith("'s") ? prefix : `${prefix}'s`;
    return `${possPrefix} ${noun}`;
  }
}

// ============================================================
// Shop Description Generation
// ============================================================

/**
 * Token replacement map — maps template tokens to fragment arrays
 */
const FRAGMENT_MAP = {
  exteriorCondition: EXTERIOR_CONDITIONS,
  buildingType: BUILDING_TYPES,
  exteriorFeature: EXTERIOR_FEATURES,
  interiorDescription: INTERIOR_DESCRIPTIONS,
  atmosphereDetail: ATMOSPHERE_DETAILS,
  scent: SCENTS,
  doorType: DOOR_TYPES,
  greetingAction: GREETING_ACTIONS,
  counterType: COUNTER_TYPES,
  shopCondition: SHOP_CONDITIONS
};

/**
 * Generate a shop description by filling a random template with random fragments
 *
 * @param {string} storeType - Store type ID
 * @param {object} shopkeeper - Generated shopkeeper object (for character-focused templates)
 * @returns {string} Generated description
 */
export function generateShopDescription(storeType, shopkeeper) {
  // Pick a random template
  let template = pick(DESCRIPTION_TEMPLATES);

  // Replace all tokens with random fragment picks
  const description = template.replace(/\{(\w+)\}/g, (match, token) => {
    // Special tokens that come from the shopkeeper object
    if (token === "shopkeeperName") {
      return shopkeeper?.name || "The shopkeeper";
    }
    if (token === "pronounObj") {
      return shopkeeper?.gender === "female" ? "her" : "him";
    }
    if (token === "pronounSubj") {
      return shopkeeper?.gender === "female" ? "she" : "he";
    }
    if (token === "pronounPos") {
      return shopkeeper?.gender === "female" ? "her" : "his";
    }

    // Standard fragment replacement
    const fragments = FRAGMENT_MAP[token];
    if (fragments && fragments.length > 0) {
      return pick(fragments);
    }

    // Unknown token — leave as-is (shouldn't happen)
    return match;
  });

  // Append a store-type-specific flavor line (if available)
  const flavorLines = STORE_TYPE_FLAVOR[storeType];
  const flavor = flavorLines ? ` ${pick(flavorLines)}` : "";

  return description + flavor;
}

// ============================================================
// Full Shop Generation
// ============================================================

/**
 * Generate a complete shop object
 *
 * @param {object} options
 * @param {string} options.storeType - Store type ID (e.g., "blacksmith")
 * @param {number} options.affluenceTier - Affluence tier (1-5)
 * @param {boolean} [options.biasEnabled=true] - Whether shopkeeper bias system is active
 * @returns {object} Complete shop object matching the spec's Shop Object schema
 */
export function generateShop({ storeType, affluenceTier, biasEnabled = true }) {
  const tier = AFFLUENCE_TIERS[affluenceTier] || AFFLUENCE_TIERS[2];

  // Generate the shopkeeper first (needed for character-focused description templates)
  const shopkeeper = generateShopkeeper({
    affluenceTier,
    biasEnabled
  });

  // Generate shop name and description
  const name = generateShopName(storeType);
  const description = generateShopDescription(storeType, shopkeeper);

  const now = Date.now();

  return {
    id: generateUUID(),
    name,
    type: storeType,
    affluenceTier,
    description,
    shopkeeper,
    inventory: [],  // Populated by inventory-generator.js in a later phase
    priceModifier: tier.priceModifier,
    createdAt: now,
    lastRestocked: now
  };
}

// Make utility functions available to other modules
export { pick, weightedPick, generateUUID };
