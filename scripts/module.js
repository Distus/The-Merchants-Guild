/**
 * The Merchant's Guild
 * A FoundryVTT module for procedural shop and shopkeeper generation (D&D 5e 2024)
 *
 * Main entry point — hooks, settings registration, and initialization
 */

import { ShopManager } from "./ui/shop-manager.js";
import { ShopViewPlayer } from "./ui/shop-view-player.js";

const MODULE_ID = "the-merchants-guild";

// ============================================================
// Module Settings
// ============================================================

function registerSettings() {
  // --- Hidden setting for shop data storage ---
  game.settings.register(MODULE_ID, "shopData", {
    name: "Shop Data",
    hint: "Internal storage for shop data. Do not modify.",
    scope: "world",
    config: false,
    type: Object,
    default: {},
    requiresReload: false
  });

  // --- Menu button to open Shop Manager from Settings ---
  game.settings.registerMenu(MODULE_ID, "shopManagerMenu", {
    name: "Open Shop Manager",
    label: "Shop Manager",
    hint: "Open the Shop Manager to create, view, and manage shops.",
    icon: "fas fa-store",
    type: ShopManagerMenuApp,
    restricted: true // GM only
  });

  // --- Visible settings ---
  game.settings.register(MODULE_ID, "playerShopVisibility", {
    name: game.i18n?.localize("MERCHANTS_GUILD.Settings.PlayerVisibility.Name") || "Player Shop Visibility",
    hint: game.i18n?.localize("MERCHANTS_GUILD.Settings.PlayerVisibility.Hint") || "Controls whether players can browse shop inventory directly.",
    scope: "world",
    config: true,
    type: String,
    choices: {
      "dm-only": "DM Only",
      "players-browse": "Players Can Browse"
    },
    default: "dm-only",
    requiresReload: false
  });

  game.settings.register(MODULE_ID, "defaultBuybackRate", {
    name: game.i18n?.localize("MERCHANTS_GUILD.Settings.BuybackRate.Name") || "Default Buyback Rate",
    hint: game.i18n?.localize("MERCHANTS_GUILD.Settings.BuybackRate.Hint") || "Default percentage of base price offered when players sell items.",
    scope: "world",
    config: true,
    type: Number,
    range: { min: 0, max: 1, step: 0.05 },
    default: 0.50,
    requiresReload: false
  });

  game.settings.register(MODULE_ID, "autoDetectPartyLevel", {
    name: game.i18n?.localize("MERCHANTS_GUILD.Settings.AutoDetectPartyLevel.Name") || "Auto-Detect Party Level",
    hint: game.i18n?.localize("MERCHANTS_GUILD.Settings.AutoDetectPartyLevel.Hint") || "Automatically calculate average party level from active player characters.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: false
  });

  game.settings.register(MODULE_ID, "manualPartyLevel", {
    name: game.i18n?.localize("MERCHANTS_GUILD.Settings.ManualPartyLevel.Name") || "Manual Party Level",
    hint: game.i18n?.localize("MERCHANTS_GUILD.Settings.ManualPartyLevel.Hint") || "Set party level manually when auto-detect is disabled.",
    scope: "world",
    config: true,
    type: Number,
    range: { min: 1, max: 20, step: 1 },
    default: 1,
    requiresReload: false
  });

  game.settings.register(MODULE_ID, "enableShopkeeperBias", {
    name: game.i18n?.localize("MERCHANTS_GUILD.Settings.EnableBias.Name") || "Enable Shopkeeper Bias",
    hint: game.i18n?.localize("MERCHANTS_GUILD.Settings.EnableBias.Hint") || "Allow shopkeepers to occasionally generate with negative biases.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: false
  });
}

/**
 * Dummy FormApplication class used by registerMenu to open the Shop Manager
 * registerMenu requires a FormApplication type, so this just opens ShopManager and closes itself
 */
class ShopManagerMenuApp extends FormApplication {
  constructor(...args) {
    super(...args);
    ShopManager.open();
    this.close();
  }

  async _updateObject() {}

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "merchants-guild-menu-launcher",
      title: "Shop Manager",
      template: `modules/${MODULE_ID}/templates/shop-manager.hbs`,
      width: 1,
      height: 1
    });
  }
}

// ============================================================
// Handlebars Helpers
// ============================================================

function registerHandlebarsHelpers() {
  Handlebars.registerHelper("eq", function (a, b) {
    return a === b;
  });

  Handlebars.registerHelper("ne", function (a, b) {
    return a !== b;
  });

  Handlebars.registerHelper("gt", function (a, b) {
    return a > b;
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
    const playerActors = game.actors.filter(a =>
      a.type === "character" && a.hasPlayerOwner
    );

    if (playerActors.length === 0) return 1;

    const totalLevels = playerActors.reduce((sum, actor) => {
      const level = actor.system?.details?.level || 1;
      return sum + level;
    }, 0);

    return Math.max(1, Math.floor(totalLevels / playerActors.length));
  }

  return game.settings.get(MODULE_ID, "manualPartyLevel") || 1;
}

// ============================================================
// Data Storage — Shops stored as a world-scoped setting
// ============================================================

/**
 * Get all saved shops
 * @returns {object} Map of shop ID -> shop object
 */
export function getAllShops() {
  try {
    return game.settings.get(MODULE_ID, "shopData") || {};
  } catch (err) {
    console.warn("The Merchant's Guild | Could not load shop data:", err);
    return {};
  }
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
  await game.settings.set(MODULE_ID, "shopData", shops);
}

/**
 * Delete a shop by ID
 * @param {string} shopId
 */
export async function deleteShop(shopId) {
  const shops = getAllShops();
  delete shops[shopId];
  await game.settings.set(MODULE_ID, "shopData", shops);
}

// ============================================================
// Data Loading — Load JSON data files
// ============================================================

let _itemPools = null;
let _magicItems = null;

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

export function getItemPools() {
  return _itemPools;
}

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

Hooks.once("ready", async () => {
  console.log("The Merchant's Guild | Module ready");

  await loadDataFiles();

  // Register socket listener for all clients (players receive shop open events)
  game.socket.on(`module.${MODULE_ID}`, (data) => {
    if (data.action === "openShop" && !game.user.isGM) {
      const visibility = game.settings.get(MODULE_ID, "playerShopVisibility");
      if (visibility === "players-browse") {
        new ShopViewPlayer(data.shopId).render(true);
      }
    }
  });

  if (!game.user.isGM) return;
  console.log("The Merchant's Guild | GM detected, shop manager available");
});

/**
 * Add a button to the scene controls for the GM
 * Compatible with Foundry v11-v14
 */
Hooks.on("getSceneControlButtons", (controls) => {
  if (!game.user.isGM) return;

  // v14+: controls is an object with named groups
  if (!Array.isArray(controls)) {
    try {
      const targetGroup = controls.tokens || controls.token;
      if (targetGroup && targetGroup.tools) {
        const toolName = "merchantsGuild";
        targetGroup.tools[toolName] = {
          name: toolName,
          title: "The Merchant's Guild",
          icon: "fa-solid fa-store",
          order: 100,
          button: true,
          visible: true,
          onChange: (active) => {
            ShopManager.open();
          }
        };
      }
    } catch (err) {
      console.warn("The Merchant's Guild | Could not add scene control button:", err);
    }
    return;
  }

  // v11-v12: controls is an array
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
