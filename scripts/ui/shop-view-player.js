/**
 * Shop View (Player)
 * Read-only browse view with vague item descriptions
 * No stats, no attunement info, no rarity tags, no buy buttons
 *
 * The Merchant's Guild — FoundryVTT Module
 */

import { getShop, getModuleId } from "../module.js";
import { STORE_TYPES } from "../shop-generator.js";

export class ShopViewPlayer extends Application {

  constructor(shopId, options = {}) {
    super(options);
    this._shopId = shopId;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "merchants-guild-shop-view-player",
      title: "Shop",
      template: `modules/${getModuleId()}/templates/shop-view-player.hbs`,
      width: 450,
      height: 600,
      resizable: true,
      classes: ["merchants-guild", "shop-view-player"]
    });
  }

  get title() {
    const shop = getShop(this._shopId);
    return shop ? shop.name : "Shop";
  }

  getData() {
    const shop = getShop(this._shopId);
    if (!shop) return { error: true };

    const keeper = shop.shopkeeper || {};

    // Build player-safe inventory — vague descriptions only
    const inventory = (shop.inventory || []).map(item => ({
      name: item.name,
      // For common mundane items, use the name as description
      // For magic/special items, use the player description
      description: (item.rarity && item.rarity !== "common")
        ? (item.descriptionPlayer || item.name)
        : item.name,
      priceDisplay: formatPlayerPrice(item.listedPrice),
      inStock: item.quantity === null || item.quantity > 0,
      isMagic: item.rarity && item.rarity !== "common"
    }));

    // Get the viewing player's character for coin display
    const playerActor = game.user.character;
    let playerCoins = null;
    if (playerActor) {
      const currency = playerActor.system?.currency || {};
      playerCoins = {
        pp: currency.pp || 0,
        gp: currency.gp || 0,
        ep: currency.ep || 0,
        sp: currency.sp || 0,
        cp: currency.cp || 0
      };
    }

    return {
      shop,
      shopName: shop.name,
      description: shop.description,
      keeperName: keeper.name || "The Shopkeeper",
      keeperDescription: keeper.physicalDescription || "",
      keeperPersonality: keeper.personality || "",
      inventory: inventory.filter(i => i.inStock), // Only show in-stock items
      outOfStockCount: inventory.filter(i => !i.inStock).length,
      playerCoins,
      hasPlayerActor: !!playerActor,
      playerActorName: playerActor?.name || ""
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Item click to expand description
    html.find(".mg-player-item").click((ev) => {
      const descEl = ev.currentTarget.querySelector(".mg-player-item-desc");
      if (descEl) {
        descEl.classList.toggle("expanded");
      }
    });
  }
}

/**
 * Format price for player display — simple, no breakdown needed
 */
function formatPlayerPrice(price) {
  if (!price) return "Price unknown";
  const parts = [];
  if (price.gp) parts.push(`${price.gp} gp`);
  if (price.sp) parts.push(`${price.sp} sp`);
  if (price.cp) parts.push(`${price.cp} cp`);
  return parts.length > 0 ? parts.join(" ") : "Free";
}
