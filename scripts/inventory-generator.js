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
 * maxRarity: items that generate freely at this tier
 * stretchRarity: items one step above that CAN appear but are rare
 * consumableMax: consumables are always one tier more generous
 */
const PARTY_TIERS = [
  { tier: 1, minLevel: 1,  maxLevel: 4,  maxRarity: "common",    stretchRarity: "uncommon",  consumableMax: "uncommon" },
  { tier: 2, minLevel: 5,  maxLevel: 10, maxRarity: "uncommon",  stretchRarity: "rare",      consumableMax: "rare" },
  { tier: 3, minLevel: 11, maxLevel: 16, maxRarity: "rare",      stretchRarity: "very-rare", consumableMax: "very-rare" },
  { tier: 4, minLevel: 17, maxLevel: 20, maxRarity: "legendary", stretchRarity: "legendary", consumableMax: "legendary" }
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
 * Even small towns can have the occasional magic item — you never know what a shopkeeper might acquire
 */
const MAGIC_ITEM_CHANCES = {
  1: { chance: 0.10, rolls: 1 },   // Hamlet: 10%, 1 item — rare but possible
  2: { chance: 0.25, rolls: 2 },   // Village: 25%, up to 2 items
  3: { chance: 0.45, rolls: 3 },   // Town: 45%, up to 3 items
  4: { chance: 0.65, rolls: 4 },   // City: 65%, up to 4 items
  5: { chance: 0.85, rolls: 5 }    // Metropolis: 85%, up to 5 items
};

/**
 * Rarity weights for magic item selection by affluence tier
 * Higher tiers have better chances at rarer items
 * All tiers can potentially get items slightly above their "normal" range
 */
const RARITY_WEIGHTS_BY_AFFLUENCE = {
  1: [{ rarity: "common", weight: 85 }, { rarity: "uncommon", weight: 15 }],
  2: [{ rarity: "common", weight: 50 }, { rarity: "uncommon", weight: 40 }, { rarity: "rare", weight: 10 }],
  3: [{ rarity: "common", weight: 25 }, { rarity: "uncommon", weight: 45 }, { rarity: "rare", weight: 25 }, { rarity: "very-rare", weight: 5 }],
  4: [{ rarity: "uncommon", weight: 30 }, { rarity: "rare", weight: 40 }, { rarity: "very-rare", weight: 25 }, { rarity: "legendary", weight: 5 }],
  5: [{ rarity: "uncommon", weight: 15 }, { rarity: "rare", weight: 35 }, { rarity: "very-rare", weight: 35 }, { rarity: "legendary", weight: 15 }]
};

/**
 * Cross-pollination rules — which store types borrow items from others
 * Higher affluence = more cross-pollination items
 * Each entry lists source store types and which items to pull (from their base pools)
 */
const CROSS_POLLINATION = {
  "general-goods": {
    sources: [
      { type: "apothecary", itemNames: ["Antitoxin (vial)", "Healer's Kit", "Component Pouch"] },
      { type: "fletcher", itemNames: ["Arrows (20)", "Crossbow Bolts (20)", "Shortbow", "Light Crossbow"] },
      { type: "blacksmith", itemNames: ["Dagger", "Handaxe", "Quarterstaff", "Spear"] },
      { type: "armorer", itemNames: ["Padded Armor", "Leather Armor", "Shield"] },
      { type: "clothier", itemNames: ["Common Clothes", "Traveler's Clothes", "Cloak"] }
    ],
    baseCount: 2,   // Hamlet/Village: pick this many cross items
    scalePer: 2     // Additional items per affluence tier above 1
  },
  "tavern": {
    sources: [
      { type: "apothecary", itemNames: ["Antitoxin (vial)", "Healer's Kit"] },
      { type: "general-goods", itemNames: ["Rope, Hempen (50 feet)", "Torch", "Rations (1 day)", "Bedroll"] }
    ],
    baseCount: 1,
    scalePer: 1
  },
  "blacksmith": {
    sources: [
      { type: "armorer", itemNames: ["Leather Armor", "Shield", "Chain Shirt"] },
      { type: "fletcher", itemNames: ["Arrows (20)", "Crossbow Bolts (20)"] }
    ],
    baseCount: 0,
    scalePer: 1
  },
  "armorer": {
    sources: [
      { type: "blacksmith", itemNames: ["Longsword", "Shortsword", "Dagger"] }
    ],
    baseCount: 0,
    scalePer: 1
  },
  "fletcher": {
    sources: [
      { type: "blacksmith", itemNames: ["Dagger"] },
      { type: "general-goods", itemNames: ["Rope, Hempen (50 feet)"] }
    ],
    baseCount: 0,
    scalePer: 1
  },
  "stables": {
    sources: [
      { type: "general-goods", itemNames: ["Rope, Hempen (50 feet)", "Rations (1 day)", "Waterskin"] }
    ],
    baseCount: 1,
    scalePer: 1
  },
  "magic-shop": {
    sources: [
      { type: "apothecary", itemNames: ["Component Pouch", "Vial"] }
    ],
    baseCount: 0,
    scalePer: 1
  }
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
 * Stretch rarity allows items slightly above the party's normal max
 *
 * @param {string} itemRarity
 * @param {string} itemCategory
 * @param {object} partyTier
 * @returns {boolean}
 */
function isRarityAllowed(itemRarity, itemCategory, partyTier) {
  const itemRarityRank = RARITY_ORDER[itemRarity] || 1;
  const isConsumable = CONSUMABLE_CATEGORIES.includes(itemCategory);

  // Consumables use consumableMax, others use stretchRarity (which allows one step above normal)
  const maxRarity = isConsumable ? partyTier.consumableMax : partyTier.stretchRarity;
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

  // --- Step 3: Cross-pollination — borrow items from other store types ---
  const crossRules = CROSS_POLLINATION[storeType];
  if (crossRules) {
    const crossCount = Math.max(0, crossRules.baseCount + crossRules.scalePer * (affluenceTier - 1));
    if (crossCount > 0) {
      // Build a flat pool of all borrowable items
      const crossPool = [];
      for (const source of crossRules.sources) {
        const sourcePool = itemPools.pools?.[source.type];
        if (!sourcePool) continue;
        const allSourceItems = [...(sourcePool.base || []), ...(sourcePool.rotating || [])];
        for (const item of allSourceItems) {
          if (source.itemNames.includes(item.name)) {
            crossPool.push(item);
          }
        }
      }

      if (crossPool.length > 0) {
        // Pick unique cross items, skip any already in inventory
        const existingNames = new Set(inventory.map(i => i.name));
        const availableCross = crossPool.filter(i => !existingNames.has(i.name));
        const selectedCross = pickNUnique(availableCross, Math.min(crossCount, availableCross.length));

        for (const item of selectedCross) {
          // Cross-pollinated items have limited quantity in non-specialty shops
          const quantity = randInt(1, 5);
          inventory.push(buildStandardItem(item, priceModifier, quantity));
        }
      }
    }
  }

  // --- Step 4: Roll for magic/special items ---
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

        // Filter by rarity, tier gate (with +1 stretch), and not already added
        const candidates = eligibleByType.filter(item =>
          item.rarity === targetRarity &&
          isRarityAllowed(item.rarity, item.category, partyTier) &&
          item.tierRequired <= partyTier.tier + 1 &&
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
