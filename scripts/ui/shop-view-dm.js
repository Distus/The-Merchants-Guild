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

    // Buyback rate
    const buybackRate = game.settings.get(getModuleId(), "defaultBuybackRate");

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
      transactions: transactions.slice().reverse(),
      transactionCount: transactions.length,
      buybackRate: Math.round(buybackRate * 100),
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

    // Add Item button
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

    // Sell to player
    html.find(".mg-sell-to-player").click(async (ev) => {
      ev.preventDefault();
      const idx = Number(ev.currentTarget.dataset.idx);
      this._initiateSellToPlayer(idx);
    });

    // Buy from player (sell-back)
    html.find(".buy-from-player-btn").click((ev) => {
      ev.preventDefault();
      this._initiateBuyFromPlayer();
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
      listedPrice: { ...basePrice },
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
  // Sell to Player (shop sells item to player)
  // ============================================================

  _initiateSellToPlayer(itemIdx) {
    const shop = getShop(this._shopId);
    if (!shop || !shop.inventory[itemIdx]) return;

    const item = shop.inventory[itemIdx];
    if (item.quantity !== null && item.quantity <= 0) {
      ui.notifications.warn(`${item.name} is out of stock.`);
      return;
    }

    const playerActors = game.actors.filter(a =>
      a.type === "character" && a.hasPlayerOwner
    );

    if (playerActors.length === 0) {
      ui.notifications.warn("No player characters found.");
      return;
    }

    const bias = shop.shopkeeper?.bias;
    const actorOptions = playerActors.map(a => {
      const biasInfo = getBiasInfoForActor(a, bias);
      const biasLabel = biasInfo.matches ? ` ⚠ ${biasInfo.label}` : "";
      return `<option value="${a.id}">${a.name}${biasLabel}</option>`;
    }).join("");

    const baseGP = priceToGP(item.listedPrice);

    new Dialog({
      title: `Sell: ${item.name}`,
      content: `
        <div class="mg-form-group">
          <label>Sell to:</label>
          <select id="mg-sell-actor" style="width:100%;">${actorOptions}</select>
        </div>
        <div class="mg-form-group" style="margin-top:8px;">
          <label>Price (GP):</label>
          <input type="number" id="mg-sell-price" value="${baseGP}" step="0.01" min="0" style="width:100%;">
        </div>
        <div id="mg-sell-bias-note" style="font-size:0.85em;margin-top:6px;"></div>
        <p style="font-size:0.85em;color:#666;margin-top:4px;">
          Listed price: ${formatPrice(item.listedPrice)}. Adjust for haggling.
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
      default: "sell",
      render: (html) => {
        // Auto-adjust price when actor selection changes (bias)
        html.find("#mg-sell-actor").on("change", () => {
          const actorId = html.find("#mg-sell-actor").val();
          const actor = game.actors.get(actorId);
          if (!actor) return;

          const biasInfo = getBiasInfoForActor(actor, bias);
          const noteEl = html.find("#mg-sell-bias-note")[0];

          if (biasInfo.matches && biasInfo.severity === "hostile") {
            html.find("#mg-sell-price").val(baseGP);
            noteEl.innerHTML = `<span style="color:#c0392b;"><i class="fas fa-ban"></i> <strong>Hostile bias vs ${biasInfo.target}.</strong> Shopkeeper refuses service. ${biasInfo.rpCue}</span>`;
          } else if (biasInfo.matches && biasInfo.severity === "unfavorable") {
            const adjustedPrice = Math.round(baseGP * (1 + biasInfo.markup / 100) * 100) / 100;
            html.find("#mg-sell-price").val(adjustedPrice);
            noteEl.innerHTML = `<span style="color:#e67e22;"><i class="fas fa-exclamation-triangle"></i> <strong>Unfavorable bias vs ${biasInfo.target} (+${biasInfo.markup}%).</strong> ${biasInfo.rpCue}</span>`;
          } else {
            html.find("#mg-sell-price").val(baseGP);
            noteEl.innerHTML = "";
          }
        });
        // Trigger once on open
        html.find("#mg-sell-actor").trigger("change");
      }
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

    // Check for hostile bias — block the sale
    const bias = shop.shopkeeper?.bias;
    const biasInfo = getBiasInfoForActor(actor, bias);
    if (biasInfo.matches && biasInfo.severity === "hostile") {
      ui.notifications.warn(`${shop.shopkeeper.name} refuses to serve ${actor.name}. ${biasInfo.rpCue}`);
      return;
    }

    // Convert price to copper
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

    // Deduct currency
    const remainingCopper = actorCopper - priceCopperTotal;
    const newCurrency = copperToCurrency(remainingCopper);
    await actor.update({ "system.currency": newCurrency });

    // Decrement shop quantity
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

    // Add item to actor
    await this._addItemToActor(actor, item);

    ui.notifications.info(`${actor.name} purchased ${item.name} for ${priceGP} GP.`);
    this.render(true);
  }

  async _addItemToActor(actor, shopItem) {
    try {
      await actor.createEmbeddedDocuments("Item", [{
        name: shopItem.name,
        type: "loot",
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
  // Buy from Player (player sells item to shop)
  // ============================================================

  _initiateBuyFromPlayer() {
    const shop = getShop(this._shopId);
    if (!shop) return;

    const playerActors = game.actors.filter(a =>
      a.type === "character" && a.hasPlayerOwner
    );

    if (playerActors.length === 0) {
      ui.notifications.warn("No player characters found.");
      return;
    }

    const actorOptions = playerActors.map(a =>
      `<option value="${a.id}">${a.name}</option>`
    ).join("");

    const buybackRate = game.settings.get(getModuleId(), "defaultBuybackRate");

    new Dialog({
      title: "Buy from Player",
      content: `
        <div class="mg-form-group">
          <label>Buy from:</label>
          <select id="mg-buy-actor" style="width:100%;">${actorOptions}</select>
        </div>
        <div class="mg-form-group" style="margin-top:8px;">
          <label>Select item from their inventory:</label>
          <select id="mg-buy-item" style="width:100%;"></select>
        </div>
        <div class="mg-form-group" style="margin-top:8px;">
          <label>Offer Price (GP):</label>
          <input type="number" id="mg-buy-price" value="0" step="0.01" min="0" style="width:100%;">
        </div>
        <div class="mg-form-group" style="margin-top:8px;">
          <label>
            <input type="checkbox" id="mg-buy-add-to-stock" checked>
            Add item to shop inventory
          </label>
        </div>
        <p style="font-size:0.85em;color:#666;margin-top:6px;">
          Default buyback rate: ${Math.round(buybackRate * 100)}% of base price.
        </p>
      `,
      buttons: {
        buy: {
          icon: '<i class="fas fa-hand-holding-usd"></i>',
          label: "Complete Purchase",
          callback: async (dialogHtml) => {
            const actorId = dialogHtml.find("#mg-buy-actor").val();
            const itemId = dialogHtml.find("#mg-buy-item").val();
            const price = Number(dialogHtml.find("#mg-buy-price").val());
            const addToStock = dialogHtml.find("#mg-buy-add-to-stock").is(":checked");
            await this._completeBuyback(actorId, itemId, price, addToStock);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel"
        }
      },
      default: "buy",
      render: (html) => {
        // Populate item list when actor changes
        const updateItems = () => {
          const actorId = html.find("#mg-buy-actor").val();
          const actor = game.actors.get(actorId);
          if (!actor) return;

          const items = actor.items.filter(i =>
            ["weapon", "equipment", "consumable", "loot", "tool"].includes(i.type)
          );

          const itemOptions = items.map(i => {
            const price = i.system?.price?.value || 0;
            return `<option value="${i.id}" data-price="${price}">${i.name} (${price} gp base)</option>`;
          }).join("");

          html.find("#mg-buy-item").html(itemOptions);
          updatePrice();
        };

        const updatePrice = () => {
          const selectedOption = html.find("#mg-buy-item option:selected");
          const basePrice = Number(selectedOption.data("price") || 0);
          const offerPrice = Math.round(basePrice * buybackRate * 100) / 100;
          html.find("#mg-buy-price").val(offerPrice);
        };

        html.find("#mg-buy-actor").on("change", updateItems);
        html.find("#mg-buy-item").on("change", updatePrice);

        // Initial populate
        updateItems();
      }
    }).render(true);
  }

  async _completeBuyback(actorId, itemId, priceGP, addToStock) {
    const shop = getShop(this._shopId);
    if (!shop) return;

    const actor = game.actors.get(actorId);
    if (!actor) {
      ui.notifications.error("Actor not found.");
      return;
    }

    const item = actor.items.get(itemId);
    if (!item) {
      ui.notifications.error("Item not found in actor's inventory.");
      return;
    }

    const itemName = item.name;

    // Add currency to actor
    const currency = actor.system?.currency || {};
    const currentCopper =
      (currency.pp || 0) * 1000 +
      (currency.gp || 0) * 100 +
      (currency.ep || 0) * 50 +
      (currency.sp || 0) * 10 +
      (currency.cp || 0);

    const addedCopper = Math.round(priceGP * 100);
    const newCurrency = copperToCurrency(currentCopper + addedCopper);
    await actor.update({ "system.currency": newCurrency });

    // Remove item from actor
    await actor.deleteEmbeddedDocuments("Item", [itemId]);

    // Optionally add to shop inventory
    if (addToStock) {
      shop.inventory.push({
        itemRef: null,
        name: itemName,
        descriptionDM: item.system?.description?.value || itemName,
        descriptionPlayer: itemName,
        basePrice: { gp: item.system?.price?.value || 0, sp: 0, cp: 0 },
        listedPrice: { gp: item.system?.price?.value || 0, sp: 0, cp: 0 },
        quantity: 1,
        rarity: item.system?.rarity || "common",
        category: item.type || "loot",
        requiresAttunement: false,
        tierRequired: 1
      });
    }

    // Log transaction
    if (!shop.transactions) shop.transactions = [];
    shop.transactions.push({
      type: "buyback",
      itemName: itemName,
      actorName: actor.name,
      actorId: actor.id,
      price: priceGP,
      timestamp: Date.now()
    });

    await saveShop(shop);

    ui.notifications.info(`Purchased ${itemName} from ${actor.name} for ${priceGP} GP.`);
    this.render(true);
  }

  // ============================================================
  // Share to Players
  // ============================================================

  _shareToPlayers() {
    const shop = getShop(this._shopId);
    if (!shop) return;

    new ShopViewPlayer(this._shopId).render(true);
    ui.notifications.info(`Opened player view for ${shop.name}.`);
  }
}

// ============================================================
// Bias Helpers
// ============================================================

/**
 * Check if an actor matches a shopkeeper's bias
 * @param {Actor} actor - The player actor
 * @param {object|null} bias - The shopkeeper's bias object
 * @returns {object} { matches, severity, target, markup, rpCue, label }
 */
function getBiasInfoForActor(actor, bias) {
  const noBias = { matches: false, severity: null, target: null, markup: 0, rpCue: "", label: "" };
  if (!bias) return noBias;

  if (bias.targetType === "race") {
    // Get actor's race from dnd5e data
    const actorRace = (actor.system?.details?.race?.name || actor.system?.details?.race || "").toLowerCase();
    const biasTarget = bias.targetValue.toLowerCase();

    if (actorRace.includes(biasTarget)) {
      return {
        matches: true,
        severity: bias.severity,
        target: bias.targetValue,
        markup: bias.priceMarkup || 0,
        rpCue: bias.rpCue || "",
        label: `Bias: ${bias.severity} vs ${bias.targetValue}`
      };
    }
  }

  if (bias.targetType === "class") {
    // Get actor's class(es) from dnd5e data
    const classes = actor.system?.classes || {};
    const classNames = Object.keys(classes).map(c => c.toLowerCase());
    // Also check the items for class items
    const classItems = actor.items.filter(i => i.type === "class").map(i => i.name.toLowerCase());
    const allClasses = [...classNames, ...classItems];

    const biasTarget = bias.targetValue.toLowerCase();

    if (allClasses.some(c => c.includes(biasTarget))) {
      return {
        matches: true,
        severity: bias.severity,
        target: bias.targetValue,
        markup: bias.priceMarkup || 0,
        rpCue: bias.rpCue || "",
        label: `Bias: ${bias.severity} vs ${bias.targetValue}`
      };
    }
  }

  return noBias;
}

// ============================================================
// Currency Helpers
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
 * Convert a price object to a single GP value (for form fields)
 */
function priceToGP(price) {
  if (!price) return 0;
  return (price.gp || 0) + (price.sp || 0) / 10 + (price.cp || 0) / 100;
}

/**
 * Convert total copper to D&D currency denominations
 */
function copperToCurrency(totalCopper) {
  let remaining = Math.max(0, Math.round(totalCopper));
  const pp = Math.floor(remaining / 1000);
  remaining %= 1000;
  const gp = Math.floor(remaining / 100);
  remaining %= 100;
  const ep = 0;
  const sp = Math.floor(remaining / 10);
  remaining %= 10;
  const cp = remaining;

  return { pp, gp, ep, sp, cp };
}

export { formatPrice, copperToCurrency };
