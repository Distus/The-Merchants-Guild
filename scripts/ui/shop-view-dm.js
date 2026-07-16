/**
 * Shop View (DM)
 * DM shop detail view — tabbed interface with Inventory, Shopkeeper, and Transactions
 *
 * The Merchant's Guild — FoundryVTT Module
 */

import { saveShop, getShop, getPartyLevel, getItemPools, getMagicItems, getModuleId } from "../module.js";
import { STORE_TYPES, AFFLUENCE_TIERS } from "../shop-generator.js";
import { restockInventory } from "../inventory-generator.js";
import { ShopViewPlayer } from "./shop-view-player.js";

export class ShopViewDM extends Application {

  constructor(shopId, options = {}) {
    super(options);
    this._shopId = shopId;
    this._activeTab = "inventory";
    this._onUpdate = options.onUpdate || (() => {});
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "merchants-guild-shop-view-dm",
      title: "Shop Detail",
      template: `modules/${getModuleId()}/templates/shop-view-dm.hbs`,
      width: 650,
      height: 720,
      resizable: true,
      classes: ["merchants-guild", "shop-view-dm"]
    });
  }

  get title() {
    const shop = getShop(this._shopId);
    return shop ? `${shop.name} — DM View` : "Shop Detail";
  }

  getData() {
    const shop = getShop(this._shopId);
    if (!shop) return { error: true };

    const keeper = shop.shopkeeper || {};
    const stats = keeper.statBlock || {};
    const dcs = keeper.socialDCs || {};
    const bias = keeper.bias;

    // Build inventory with index for referencing
    const inventory = (shop.inventory || []).map((item, idx) => ({
      ...item,
      idx,
      priceDisplay: formatPrice(item.listedPrice),
      basePriceDisplay: formatPrice(item.basePrice),
      quantityDisplay: item.quantity === null ? "∞" : item.quantity,
      isOutOfStock: item.quantity !== null && item.quantity <= 0,
      isMagic: item.rarity && item.rarity !== "common"
    }));

    // Get player actors for transaction dropdown
    const playerActors = game.actors.filter(a =>
      a.type === "character" && a.hasPlayerOwner
    ).map(a => ({
      id: a.id,
      name: a.name,
      img: a.img
    }));

    // Transaction log
    const transactions = shop.transactions || [];

    return {
      shop,
      typeLabel: STORE_TYPES[shop.type] || shop.type,
      affluenceLabel: AFFLUENCE_TIERS[shop.affluenceTier]?.label || "Unknown",
      keeper,
      stats,
      dcs,
      bias,
      inventory,
      inventoryCount: inventory.length,
      magicItemCount: inventory.filter(i => i.isMagic).length,
      playerActors,
      transactions: transactions.slice().reverse(), // Most recent first
      transactionCount: transactions.length,
      activeTab: this._activeTab,
      isInventoryTab: this._activeTab === "inventory",
      isShopkeeperTab: this._activeTab === "shopkeeper",
      isTransactionsTab: this._activeTab === "transactions",
      canShareToPlayers: game.settings.get(getModuleId(), "playerShopVisibility") === "players-browse"
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Tab switching
    html.find(".mg-tab-btn").click((ev) => {
      ev.preventDefault();
      this._activeTab = ev.currentTarget.dataset.tab;
      this.render(true);
    });

    // Restock button
    html.find(".restock-btn").click(async (ev) => {
      ev.preventDefault();
      await this._restockShop();
    });

    // Add Item button (manual add)
    html.find(".add-item-btn").click((ev) => {
      ev.preventDefault();
      this._showAddItemDialog();
    });

    // Inline price editing
    html.find(".mg-edit-price").on("change", async (ev) => {
      const idx = Number(ev.currentTarget.dataset.idx);
      const newPrice = Number(ev.currentTarget.value);
      await this._updateItemPrice(idx, newPrice);
    });

    // Remove item
    html.find(".mg-remove-item").click(async (ev) => {
      ev.preventDefault();
      const idx = Number(ev.currentTarget.dataset.idx);
      await this._removeItem(idx);
    });

    // Buy transaction (sell to player)
    html.find(".mg-sell-to-player").click(async (ev) => {
      ev.preventDefault();
      const idx = Number(ev.currentTarget.dataset.idx);
      this._initiateSellToPlayer(idx, html);
    });

    // Open shop for players
    html.find(".share-to-players-btn").click((ev) => {
      ev.preventDefault();
      this._shareToPlayers();
    });
  }

  // ============================================================
  // Restock
  // ============================================================

  async _restockShop() {
    const shop = getShop(this._shopId);
    if (!shop) return;

    const confirmed = await Dialog.confirm({
      title: "Restock Shop",
      content: `<p>Re-roll rotating and magic items for <strong>${shop.name}</strong>? Base stock will remain unchanged.</p>`,
      yes: () => true,
      no: () => false,
      defaultYes: false
    });

    if (!confirmed) return;

    const newInventory = restockInventory({
      currentInventory: shop.inventory,
      storeType: shop.type,
      affluenceTier: shop.affluenceTier,
      priceModifier: shop.priceModifier,
      partyLevel: getPartyLevel(),
      itemPools: getItemPools(),
      magicItems: getMagicItems()
    });

    shop.inventory = newInventory;
    shop.lastRestocked = Date.now();
    await saveShop(shop);

    ui.notifications.info(`${shop.name} has been restocked.`);
    this.render(true);
    this._onUpdate();
  }

  // ============================================================
  // Item Management
  // ============================================================

  async _updateItemPrice(idx, newGP) {
    const shop = getShop(this._shopId);
    if (!shop || !shop.inventory[idx]) return;

    shop.inventory[idx].listedPrice = { gp: newGP, sp: 0, cp: 0 };
    await saveShop(shop);
    // Don't re-render for inline edits to avoid losing focus
  }

  async _removeItem(idx) {
    const shop = getShop(this._shopId);
    if (!shop || !shop.inventory[idx]) return;

    const itemName = shop.inventory[idx].name;
    shop.inventory.splice(idx, 1);
    await saveShop(shop);

    ui.notifications.info(`Removed ${itemName} from ${shop.name}.`);
    this.render(true);
  }

  _showAddItemDialog() {
    // Build a list of all available magic items
    const magicItems = getMagicItems();
    const options = (magicItems.items || []).map(item =>
      `<option value="${item.key}">${item.name} (${item.rarity})</option>`
    ).join("");

    new Dialog({
      title: "Add Item to Shop",
      content: `
        <div class="mg-form-group">
          <label>Select a magic item to add:</label>
          <select id="mg-add-item-select" style="width:100%;margin-top:4px;">
            ${options}
          </select>
          <p style="font-size:0.85em;color:#666;margin-top:6px;">
            <i class="fas fa-info-circle"></i> Manual adds bypass party tier gating.
          </p>
        </div>
      `,
      buttons: {
        add: {
          icon: '<i class="fas fa-plus"></i>',
          label: "Add",
          callback: async (html) => {
            const key = html.find("#mg-add-item-select").val();
            await this._addMagicItem(key);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel"
        }
      },
      default: "add"
    }).render(true);
  }

  async _addMagicItem(key) {
    const shop = getShop(this._shopId);
    if (!shop) return;

    const magicItems = getMagicItems();
    const item = (magicItems.items || []).find(i => i.key === key);
    if (!item) return;

    const basePrice = {
      gp: item.basePrice?.gp || 0,
      sp: item.basePrice?.sp || 0,
      cp: item.basePrice?.cp || 0
    };

    shop.inventory.push({
      itemRef: item.key,
      name: item.name,
      descriptionDM: item.descriptionDM,
      descriptionPlayer: item.descriptionPlayer,
      basePrice,
      listedPrice: { ...basePrice }, // No modifier for manual adds
      quantity: 1,
      rarity: item.rarity,
      category: item.category,
      requiresAttunement: item.requiresAttunement || false,
      tierRequired: item.tierRequired || 1
    });

    await saveShop(shop);
    ui.notifications.info(`Added ${item.name} to ${shop.name}.`);
    this.render(true);
  }

  // ============================================================
  // Sell to Player
  // ============================================================

  _initiateSellToPlayer(itemIdx, html) {
    const shop = getShop(this._shopId);
    if (!shop || !shop.inventory[itemIdx]) return;

    const item = shop.inventory[itemIdx];
    if (item.isOutOfStock) {
      ui.notifications.warn(`${item.name} is out of stock.`);
      return;
    }

    const playerActors = game.actors.filter(a =>
      a.type === "character" && a.hasPlayerOwner
    );

    const actorOptions = playerActors.map(a =>
      `<option value="${a.id}">${a.name}</option>`
    ).join("");

    const defaultPrice = (item.listedPrice?.gp || 0)
      + (item.listedPrice?.sp || 0) / 10
      + (item.listedPrice?.cp || 0) / 100;

    new Dialog({
      title: `Sell: ${item.name}`,
      content: `
        <div class="mg-form-group">
          <label>Sell to:</label>
          <select id="mg-sell-actor">${actorOptions}</select>
        </div>
        <div class="mg-form-group" style="margin-top:8px;">
          <label>Price (GP):</label>
          <input type="number" id="mg-sell-price" value="${defaultPrice}" step="0.01" min="0" style="width:100%;">
        </div>
        <p style="font-size:0.85em;color:#666;margin-top:6px;">
          Adjust the price for haggling. The listed price is ${formatPrice(item.listedPrice)}.
        </p>
      `,
      buttons: {
        sell: {
          icon: '<i class="fas fa-coins"></i>',
          label: "Complete Sale",
          callback: async (dialogHtml) => {
            const actorId = dialogHtml.find("#mg-sell-actor").val();
            const price = Number(dialogHtml.find("#mg-sell-price").val());
            await this._completeSale(itemIdx, actorId, price);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel"
        }
      },
      default: "sell"
    }).render(true);
  }

  async _completeSale(itemIdx, actorId, priceGP) {
    const shop = getShop(this._shopId);
    if (!shop || !shop.inventory[itemIdx]) return;

    const actor = game.actors.get(actorId);
    if (!actor) {
      ui.notifications.error("Actor not found.");
      return;
    }

    const item = shop.inventory[itemIdx];

    // Convert price to copper for math
    const priceCopperTotal = Math.round(priceGP * 100);

    // Get actor's currency
    const currency = actor.system?.currency || {};
    const actorCopper =
      (currency.pp || 0) * 1000 +
      (currency.gp || 0) * 100 +
      (currency.ep || 0) * 50 +
      (currency.sp || 0) * 10 +
      (currency.cp || 0);

    if (actorCopper < priceCopperTotal) {
      ui.notifications.warn(`${actor.name} can't afford ${item.name} (needs ${priceGP} GP, has ${(actorCopper / 100).toFixed(2)} GP equivalent).`);
      return;
    }

    // Deduct currency — convert everything to copper, subtract, convert back
    const remainingCopper = actorCopper - priceCopperTotal;
    const newCurrency = copperToCurrency(remainingCopper);

    await actor.update({ "system.currency": newCurrency });

    // Decrement shop quantity if limited
    if (item.quantity !== null) {
      shop.inventory[itemIdx].quantity = Math.max(0, item.quantity - 1);
    }

    // Log transaction
    if (!shop.transactions) shop.transactions = [];
    shop.transactions.push({
      type: "sale",
      itemName: item.name,
      actorName: actor.name,
      actorId: actor.id,
      price: priceGP,
      timestamp: Date.now()
    });

    await saveShop(shop);

    // Add item to actor's inventory
    // Try to find the item in compendium first, otherwise create a basic item
    await this._addItemToActor(actor, item);

    ui.notifications.info(`${actor.name} purchased ${item.name} for ${priceGP} GP.`);
    this.render(true);
  }

  async _addItemToActor(actor, shopItem) {
    // Try to create a basic item on the actor
    // In a full implementation, this would map to compendium items
    try {
      await actor.createEmbeddedDocuments("Item", [{
        name: shopItem.name,
        type: "loot", // Default type; magic items might be weapon/equipment
        system: {
          description: { value: shopItem.descriptionDM || shopItem.name },
          price: {
            value: shopItem.basePrice?.gp || 0,
            denomination: "gp"
          },
          rarity: shopItem.rarity || "common"
        }
      }]);
    } catch (err) {
      console.warn("The Merchant's Guild | Could not auto-add item to actor:", err);
      ui.notifications.info(`Note: ${shopItem.name} couldn't be auto-added to ${actor.name}'s sheet. Add it manually.`);
    }
  }

  // ============================================================
  // Buy from Player (sell-back)
  // ============================================================

  // Phase 5 will expand this — for now, the UI placeholder exists

  // ============================================================
  // Share to Players
  // ============================================================

  _shareToPlayers() {
    const shop = getShop(this._shopId);
    if (!shop) return;

    // Emit a socket message to open the player view
    // For now, we'll open it locally as a preview
    new ShopViewPlayer(this._shopId).render(true);
    ui.notifications.info(`Opened player view for ${shop.name}.`);
  }
}

// ============================================================
// Helpers
// ============================================================

/**
 * Format a price object for display
 */
function formatPrice(price) {
  if (!price) return "0 gp";
  const parts = [];
  if (price.gp) parts.push(`${price.gp} gp`);
  if (price.sp) parts.push(`${price.sp} sp`);
  if (price.cp) parts.push(`${price.cp} cp`);
  return parts.length > 0 ? parts.join(" ") : "0 gp";
}

/**
 * Convert a total copper amount to D&D currency denominations
 * Uses largest denominations first
 */
function copperToCurrency(totalCopper) {
  let remaining = totalCopper;
  const pp = Math.floor(remaining / 1000);
  remaining %= 1000;
  const gp = Math.floor(remaining / 100);
  remaining %= 100;
  const ep = 0; // Don't use EP for change-making
  const sp = Math.floor(remaining / 10);
  remaining %= 10;
  const cp = remaining;

  return { pp, gp, ep, sp, cp };
}

export { formatPrice, copperToCurrency };
