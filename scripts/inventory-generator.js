/**
 * Inventory Generator
 * Combines item pools, affluence tiers, and party level gating
 * to build a shop's inventory
 *
 * The Merchant's Guild — FoundryVTT Module
 */

import { pick, weightedPick } from "./shop-generator.js";

// ============================================================
// Constants
// ============================================================

/**
 * Party tier definitions — maps level ranges to max item rarity
 */
const PARTY_TIERS = [
  { tier: 1, minLevel: 1,  maxLevel: 4,  maxRarity: "common",    consumableMax: "uncommon" },
  { tier: 2, minLevel: 5,  maxLevel: 10, maxRarity: "uncommon",  consumableMax: "rare" },
  { tier: 3, minLevel: 11, maxLevel: 16, maxRarity: "rare",      consumableMax: "very-rare" },
  { tier: 4, minLevel: 17, maxLevel: 20, maxRarity: "legendary", consumableMax: "legendary" }
];

/**
 * Rarity hierarchy for comparison
 */
const RARITY_ORDER = {
  "common": 1,
  "uncommon": 2,
  "rare": 3,
  "very-rare": 4,
  "legendary": 5
};

/**
 * Special item roll chances by affluence tier
 * Each entry: { chance: probability of at least one magic item, rolls: how many items to try }
 */
const MAGIC_ITEM_CHANCES = {
  1: { chance: 0.00, rolls: 0 },   // Hamlet: no magic items
  2: { chance: 0.05, rolls: 1 },   // Village: 5%, 1 item
  3: { chance: 0.15, rolls: 2 },   // Town: 15%, up to 2 items
  4: { chance: 0.30, rolls: 3 },   // City: 30%, up to 3 items
  5: { chance: 0.50, rolls: 4 }    // Metropolis: 50%, up to 4 items
};

/**
 * Rarity weights for magic item selection by affluence tier
 * Higher tiers have better chances at rarer items
 */
const RARITY_WEIGHTS_BY_AFFLUENCE = {
  1: [],
  2: [{ rarity: "common", weight: 80 }, { rarity: "uncommon", weight: 20 }],
  3: [{ rarity: "common", weight: 40 }, { rarity: "uncommon", weight: 55 }, { rarity: "rare", weight: 5 }],
  4: [{ rarity: "uncommon", weight: 50 }, { rarity: "rare", weight: 40 }, { rarity: "very-rare", weight: 10 }],
  5: [{ rarity: "uncommon", weight: 30 }, { rarity: "rare", weight: 40 }, { rarity: "very-rare", weight: 25 }, { rarity: "legendary", weight: 5 }]
};

/**
 * How many rotating items to generate (simulates 3d4)
 */
function rollRotatingCount() {
  return (Math.floor(Math.random() * 4) + 1)
       + (Math.floor(Math.random() * 4) + 1)
       + (Math.floor(Math.random() * 4) + 1);
}

/**
 * Consumable categories that allow one rarity tier higher than normal
 */
const CONSUMABLE_CATEGORIES = ["potions", "scrolls"];

// ============================================================
// Utility
// ============================================================

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get the party tier from average party level
 * @param {number} avgLevel
 * @returns {object} Party tier definition
 */
function getPartyTier(avgLevel) {
  for (const tier of PARTY_TIERS) {
    if (avgLevel >= tier.minLevel && avgLevel <= tier.maxLevel) {
      return tier;
    }
  }
  // Default to tier 1
  return PARTY_TIERS[0];
}

/**
 * Check if an item's rarity is allowed by the current party tier
 * Consumables get one rarity tier higher
 *
 * @param {string} itemRarity
 * @param {string} itemCategory
 * @param {object} partyTier
 * @returns {boolean}
 */
function isRarityAllowed(itemRarity, itemCategory, partyTier) {
  const itemRarityRank = RARITY_ORDER[itemRarity] || 1;
  const isConsumable = CONSUMABLE_CATEGORIES.includes(itemCategory);

  const maxRarity = isConsumable ? partyTier.consumableMax : partyTier.maxRarity;
  const maxRarityRank = RARITY_ORDER[maxRarity] || 1;

  return itemRarityRank <= maxRarityRank;
}

// ============================================================
// Inventory Generation
// ============================================================

/**
 * Build a shop's inventory from item pools, magic items, affluence, and party tier
 *
 * @param {object} options
 * @param {string} options.storeType - Store type ID
 * @param {number} options.affluenceTier - 1-5
 * @param {number} options.priceModifier - Affluence-based price multiplier
 * @param {number} options.partyLevel - Average party level (1-20)
 * @param {object} options.itemPools - The loaded item-pools.json data
 * @param {object} options.magicItems - The loaded magic-items.json data
 * @returns {Array} Array of ShopItemEntry objects
 */
export function generateInventory({
  storeType,
  affluenceTier,
  priceModifier,
  partyLevel,
  itemPools,
  magicItems
}) {
  const inventory = [];
  const partyTier = getPartyTier(partyLevel);

  // Get the pool for this store type
  const pool = itemPools.pools?.[storeType];
  if (!pool) {
    console.warn(`The Merchant's Guild | No item pool defined for store type: ${storeType}`);
    return inventory;
  }

  // --- Step 1: Add all base pool items (unlimited quantity) ---
  for (const item of (pool.base || [])) {
    inventory.push(buildStandardItem(item, priceModifier, null));
  }

  // --- Step 2: Add randomized rotating items ---
  const rotatingPool = pool.rotating || [];
  if (rotatingPool.length > 0) {
    const rotatingCount = Math.min(rollRotatingCount(), rotatingPool.length);
    const selectedRotating = pickNUnique(rotatingPool, rotatingCount);

    for (const item of selectedRotating) {
      // Rotating items may have limited quantity
      const quantity = (Math.random() < 0.3) ? randInt(1, 5) : null;
      inventory.push(buildStandardItem(item, priceModifier, quantity));
    }
  }

  // --- Step 3: Roll for magic/special items ---
  const magicChance = MAGIC_ITEM_CHANCES[affluenceTier] || MAGIC_ITEM_CHANCES[1];
  if (magicChance.chance > 0 && Math.random() < magicChance.chance) {
    const rarityWeights = RARITY_WEIGHTS_BY_AFFLUENCE[affluenceTier] || [];

    // Get eligible magic items for this store type
    const allMagicItems = magicItems.items || [];
    const eligibleByType = allMagicItems.filter(item =>
      item.storeTypes && item.storeTypes.includes(storeType)
    );

    if (eligibleByType.length > 0 && rarityWeights.length > 0) {
      const addedKeys = new Set();

      for (let i = 0; i < magicChance.rolls; i++) {
        // Pick a rarity
        const rarityPick = weightedPick(rarityWeights);
        const targetRarity = rarityPick.rarity;

        // Filter by rarity, tier gate, and not already added
        const candidates = eligibleByType.filter(item =>
          item.rarity === targetRarity &&
          isRarityAllowed(item.rarity, item.category, partyTier) &&
          item.tierRequired <= partyTier.tier &&
          !addedKeys.has(item.key)
        );

        if (candidates.length > 0) {
          const selected = pick(candidates);
          addedKeys.add(selected.key);
          inventory.push(buildMagicItem(selected, priceModifier));
        }
      }
    }
  }

  return inventory;
}

/**
 * Restock a shop's inventory — keeps base items, re-rolls rotating and magic
 *
 * @param {object} options
 * @param {Array} options.currentInventory - Current shop inventory
 * @param {string} options.storeType
 * @param {number} options.affluenceTier
 * @param {number} options.priceModifier
 * @param {number} options.partyLevel
 * @param {object} options.itemPools
 * @param {object} options.magicItems
 * @returns {Array} New inventory array
 */
export function restockInventory({
  currentInventory,
  storeType,
  affluenceTier,
  priceModifier,
  partyLevel,
  itemPools,
  magicItems
}) {
  // Just regenerate from scratch — base items will be the same,
  // rotating and magic items will be re-rolled
  const newInventory = generateInventory({
    storeType,
    affluenceTier,
    priceModifier,
    partyLevel,
    itemPools,
    magicItems
  });

  // Check for previously sold limited-quantity items that might return
  // (50% chance each)
  const previouslySold = (currentInventory || []).filter(item =>
    item.quantity !== null && item.quantity === 0
  );

  for (const soldItem of previouslySold) {
    if (Math.random() < 0.5) {
      // Item returns with limited stock
      const restored = { ...soldItem, quantity: randInt(1, 3) };
      // Only add if not already in new inventory
      const exists = newInventory.some(i => i.name === restored.name);
      if (!exists) {
        newInventory.push(restored);
      }
    }
  }

  return newInventory;
}

// ============================================================
// Item Building Helpers
// ============================================================

/**
 * Build a standard (non-magic) inventory item entry
 */
function buildStandardItem(poolItem, priceModifier, quantity) {
  const basePrice = normalizePrice(poolItem.price);
  const listedPrice = applyPriceModifier(basePrice, priceModifier);

  return {
    itemRef: null, // Will be mapped to compendium ID in Phase 5
    name: poolItem.name,
    descriptionDM: poolItem.name,
    descriptionPlayer: poolItem.name,
    basePrice,
    listedPrice,
    quantity,
    rarity: "common",
    category: poolItem.category || "adventuring-gear",
    requiresAttunement: false,
    tierRequired: 1
  };
}

/**
 * Build a magic item inventory entry from the magic items catalog
 */
function buildMagicItem(magicItem, priceModifier) {
  const basePrice = normalizePrice(magicItem.basePrice);
  const listedPrice = applyPriceModifier(basePrice, priceModifier);

  return {
    itemRef: magicItem.key,
    name: magicItem.name,
    descriptionDM: magicItem.descriptionDM,
    descriptionPlayer: magicItem.descriptionPlayer,
    basePrice,
    listedPrice,
    quantity: 1, // Magic items are always limited
    rarity: magicItem.rarity,
    category: magicItem.category,
    requiresAttunement: magicItem.requiresAttunement || false,
    tierRequired: magicItem.tierRequired || 1
  };
}

/**
 * Normalize a price object to always have gp, sp, cp
 */
function normalizePrice(price) {
  return {
    gp: price?.gp || 0,
    sp: price?.sp || 0,
    cp: price?.cp || 0
  };
}

/**
 * Apply the affluence price modifier
 * Converts everything to copper for math, then back
 */
function applyPriceModifier(basePrice, modifier) {
  const totalCopper = (basePrice.gp * 100) + (basePrice.sp * 10) + basePrice.cp;
  const modifiedCopper = Math.round(totalCopper * modifier);

  return {
    gp: Math.floor(modifiedCopper / 100),
    sp: Math.floor((modifiedCopper % 100) / 10),
    cp: modifiedCopper % 10
  };
}

/**
 * Pick N unique items from an array (Fisher-Yates partial shuffle)
 */
function pickNUnique(arr, n) {
  const copy = [...arr];
  const result = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

// Export for use in other modules
export { getPartyTier, isRarityAllowed, PARTY_TIERS, RARITY_ORDER };
