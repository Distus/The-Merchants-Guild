/**
 * The Merchant's Guild
 * A FoundryVTT module for procedural shop and shopkeeper generation (D&D 5e 2024)
 *
 * Main entry point — hooks, settings registration, and initialization
 */

import { ShopManager } from "./ui/shop-manager.js";

const MODULE_ID = "the-merchants-guild";

// ============================================================
// Module Settings
// ============================================================

function registerSettings() {
  game.settings.register(MODULE_ID, "playerShopVisibility", {
    name: game.i18n.localize("MERCHANTS_GUILD.Settings.PlayerVisibility.Name"),
    hint: game.i18n.localize("MERCHANTS_GUILD.Settings.PlayerVisibility.Hint"),
    scope: "world",
    config: true,
    type: String,
    choices: {
      "dm-only": game.i18n.localize("MERCHANTS_GUILD.Settings.PlayerVisibility.DMOnly"),
      "players-browse": game.i18n.localize("MERCHANTS_GUILD.Settings.PlayerVisibility.PlayersBrowse")
    },
    default: "dm-only",
    requiresReload: false
  });

  game.settings.register(MODULE_ID, "defaultBuybackRate", {
    name: game.i18n.localize("MERCHANTS_GUILD.Settings.BuybackRate.Name"),
    hint: game.i18n.localize("MERCHANTS_GUILD.Settings.BuybackRate.Hint"),
    scope: "world",
    config: true,
    type: Number,
    range: { min: 0, max: 1, step: 0.05 },
    default: 0.50,
    requiresReload: false
  });

  game.settings.register(MODULE_ID, "autoDetectPartyLevel", {
    name: game.i18n.localize("MERCHANTS_GUILD.Settings.AutoDetectPartyLevel.Name"),
    hint: game.i18n.localize("MERCHANTS_GUILD.Settings.AutoDetectPartyLevel.Hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: false
  });

  game.settings.register(MODULE_ID, "manualPartyLevel", {
    name: game.i18n.localize("MERCHANTS_GUILD.Settings.ManualPartyLevel.Name"),
    hint: game.i18n.localize("MERCHANTS_GUILD.Settings.ManualPartyLevel.Hint"),
    scope: "world",
    config: true,
    type: Number,
    range: { min: 1, max: 20, step: 1 },
    default: 1,
    requiresReload: false
  });

  game.settings.register(MODULE_ID, "enableShopkeeperBias", {
    name: game.i18n.localize("MERCHANTS_GUILD.Settings.EnableBias.Name"),
    hint: game.i18n.localize("MERCHANTS_GUILD.Settings.EnableBias.Hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: false
  });
}

// ============================================================
// Party Level Detection
// ============================================================

/**
 * Get the current effective party level based on module settings
 * @returns {number} Average party level (1-20)
 */
export function getPartyLevel() {
  const autoDetect = game.settings.get(MODULE_ID, "autoDetectPartyLevel");

  if (autoDetect) {
    // Get all player-owned characters
    const playerActors = game.actors.filter(a =>
      a.type === "character" && a.hasPlayerOwner
    );

    if (playerActors.length === 0) return 1;

    // Average their levels, rounded down
    const totalLevels = playerActors.reduce((sum, actor) => {
      // dnd5e stores level in system.details.level
      const level = actor.system?.details?.level || 1;
      return sum + level;
    }, 0);

    return Math.max(1, Math.floor(totalLevels / playerActors.length));
  }

  return game.settings.get(MODULE_ID, "manualPartyLevel") || 1;
}

// ============================================================
// Data Storage — Shops stored as world flags
// ============================================================

const SHOPS_FLAG_KEY = "shops";

/**
 * Get all saved shops
 * @returns {object} Map of shop ID -> shop object
 */
export function getAllShops() {
  return game.world.getFlag(MODULE_ID, SHOPS_FLAG_KEY) || {};
}

/**
 * Get a single shop by ID
 * @param {string} shopId
 * @returns {object|null}
 */
export function getShop(shopId) {
  const shops = getAllShops();
  return shops[shopId] || null;
}

/**
 * Save a shop (create or update)
 * @param {object} shop - Shop object with an id property
 */
export async function saveShop(shop) {
  const shops = getAllShops();
  shops[shop.id] = shop;
  await game.world.setFlag(MODULE_ID, SHOPS_FLAG_KEY, shops);
}

/**
 * Delete a shop by ID
 * @param {string} shopId
 */
export async function deleteShop(shopId) {
  const shops = getAllShops();
  delete shops[shopId];
  // Foundry requires setting the whole flag to persist deletion
  await game.world.unsetFlag(MODULE_ID, SHOPS_FLAG_KEY);
  if (Object.keys(shops).length > 0) {
    await game.world.setFlag(MODULE_ID, SHOPS_FLAG_KEY, shops);
  }
}

// ============================================================
// Data Loading — Load JSON data files
// ============================================================

let _itemPools = null;
let _magicItems = null;

/**
 * Load item pools and magic items JSON from module data directory
 */
async function loadDataFiles() {
  try {
    const poolsResponse = await fetch(`modules/${MODULE_ID}/data/item-pools.json`);
    _itemPools = await poolsResponse.json();

    const magicResponse = await fetch(`modules/${MODULE_ID}/data/magic-items.json`);
    _magicItems = await magicResponse.json();

    console.log(`The Merchant's Guild | Loaded ${_magicItems.items.length} magic items and ${Object.keys(_itemPools.pools).length} item pools`);
  } catch (err) {
    console.error("The Merchant's Guild | Failed to load data files:", err);
    _itemPools = { pools: {} };
    _magicItems = { items: [] };
  }
}

/**
 * Get loaded item pools data
 */
export function getItemPools() {
  return _itemPools;
}

/**
 * Get loaded magic items data
 */
export function getMagicItems() {
  return _magicItems;
}

// ============================================================
// Module ID accessor
// ============================================================

export function getModuleId() {
  return MODULE_ID;
}

// ============================================================
// Hooks
// ============================================================

Hooks.once("init", () => {
  console.log("The Merchant's Guild | Initializing module");
  registerSettings();
  registerHandlebarsHelpers();
});

/**
 * Register custom Handlebars helpers used in templates
 */
function registerHandlebarsHelpers() {
  // Equality check: {{#if (eq a b)}}
  Handlebars.registerHelper("eq", function (a, b) {
    return a === b;
  });

  // Not-equal check: {{#if (ne a b)}}
  Handlebars.registerHelper("ne", function (a, b) {
    return a !== b;
  });

  // Greater-than: {{#if (gt a b)}}
  Handlebars.registerHelper("gt", function (a, b) {
    return a > b;
  });
}

Hooks.once("ready", async () => {
  console.log("The Merchant's Guild | Module ready");

  // Load data files
  await loadDataFiles();

  // Only add GM controls
  if (!game.user.isGM) return;

  // Add sidebar button to Token Controls
  console.log("The Merchant's Guild | GM detected, shop manager available");
});

/**
 * Add a button to the scene controls for the GM
 * This appears in the left-side toolbar
 */
Hooks.on("getSceneControlButtons", (controls) => {
  if (!game.user.isGM) return;

  controls.push({
    name: "merchants-guild",
    title: "The Merchant's Guild",
    icon: "fas fa-store",
    layer: "controls",
    visible: true,
    tools: [
      {
        name: "shop-manager",
        title: "Shop Manager",
        icon: "fas fa-store",
        button: true,
        onClick: () => {
          ShopManager.open();
        }
      }
    ]
  });
});
