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
    const inventory = (shop.inventory || []).map((item, idx) => {
      const isMagic = item.rarity && item.rarity !== "common";
      // Build tooltip data as escaped JSON for data attribute
      let tooltipData = "";
      if (isMagic) {
        const tooltipObj = {
          name: item.name || "",
          rarity: item.rarity || "",
          desc: item.descriptionDM || item.name || "",
          attune: item.requiresAttunement || false
        };
        // Escape for HTML attribute embedding
        tooltipData = JSON.stringify(tooltipObj).replace(/&/g, "&amp;").replace(/'/g, "&#39;").replace(/"/g, "&quot;");
      }
      return {
        ...item,
        idx,
        priceDisplay: formatPrice(item.listedPrice),
        basePriceDisplay: formatPrice(item.basePrice),
        priceDecimalGP: priceToGP(item.listedPrice),
        quantityDisplay: item.quantity === null ? "∞" : item.quantity,
        isOutOfStock: item.quantity !== null && item.quantity <= 0,
        isMagic,
        tooltipData
      };
    });

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

    // Price editing — click to open edit dialog
    html.find(".mg-price-display").click(async (ev) => {
      ev.preventDefault();
      const idx = Number(ev.currentTarget.dataset.idx);
      this._showEditPriceDialog(idx);
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

    // JS-powered tooltips — float above everything, no clipping
    html.find(".mg-has-tooltip").on("mouseenter", (ev) => {
      const el = ev.currentTarget;
      const tooltipData = el.dataset.tooltipDm;
      if (!tooltipData) return;

      const parsed = JSON.parse(tooltipData);
      const tooltip = document.createElement("div");
      tooltip.className = "mg-floating-tooltip";
      tooltip.innerHTML = `
        <div class="mg-tooltip-title">${parsed.name}</div>
        <div class="mg-tooltip-rarity">${parsed.rarity}</div>
        <div class="mg-tooltip-desc">${parsed.desc}</div>
        ${parsed.attune ? '<div class="mg-tooltip-attune"><i class="fas fa-link"></i> Requires Attunement</div>' : ''}
      `;
      document.body.appendChild(tooltip);

      const rect = el.getBoundingClientRect();
      tooltip.style.left = `${rect.left}px`;
      tooltip.style.top = `${rect.bottom + 4}px`;

      // If tooltip goes off-screen bottom, show above instead
      const tooltipRect = tooltip.getBoundingClientRect();
      if (tooltipRect.bottom > window.innerHeight) {
        tooltip.style.top = `${rect.top - tooltipRect.height - 4}px`;
      }

      el._mgTooltip = tooltip;
    });

    html.find(".mg-has-tooltip").on("mouseleave", (ev) => {
      const el = ev.currentTarget;
      if (el._mgTooltip) {
        el._mgTooltip.remove();
        el._mgTooltip = null;
      }
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

  _showEditPriceDialog(idx) {
    const shop = getShop(this._shopId);
    if (!shop || !shop.inventory[idx]) return;

    const item = shop.inventory[idx];
    const price = item.listedPrice || { gp: 0, sp: 0, cp: 0 };

    new Dialog({
      title: `Edit Price: ${item.name}`,
      content: `
        <div style="display:flex;gap:8px;align-items:center;padding:8px 0;">
          <div class="mg-form-group" style="flex:1;">
            <label>GP</label>
            <input type="number" id="mg-price-gp" value="${price.gp || 0}" min="0" step="1" style="width:100%;">
          </div>
          <div class="mg-form-group" style="flex:1;">
            <label>SP</label>
            <input type="number" id="mg-price-sp" value="${price.sp || 0}" min="0" step="1" style="width:100%;">
          </div>
          <div class="mg-form-group" style="flex:1;">
            <label>CP</label>
            <input type="number" id="mg-price-cp" value="${price.cp || 0}" min="0" step="1" style="width:100%;">
          </div>
        </div>
      `,
      buttons: {
        save: {
          icon: '<i class="fas fa-check"></i>',
          label: "Save",
          callback: async (dialogHtml) => {
            const gp = Number(dialogHtml.find("#mg-price-gp").val()) || 0;
            const sp = Number(dialogHtml.find("#mg-price-sp").val()) || 0;
            const cp = Number(dialogHtml.find("#mg-price-cp").val()) || 0;
            await this._updateItemPrice(idx, { gp, sp, cp });
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel"
        }
      },
      default: "save"
    }).render(true);
  }

  async _updateItemPrice(idx, newPrice) {
    const shop = getShop(this._shopId);
    if (!shop || !shop.inventory[idx]) return;

    shop.inventory[idx].listedPrice = {
      gp: newPrice.gp || 0,
      sp: newPrice.sp || 0,
      cp: newPrice.cp || 0
    };
    await saveShop(shop);
    this.render(true);
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
    const allItems = (magicItems.items || []);
    const options = allItems.map(item =>
      `<option value="${item.key}" data-rarity="${item.rarity}">${item.name} (${item.rarity})</option>`
    ).join("");

    new Dialog({
      title: "Add Item to Shop",
      content: `
        <div class="mg-add-item-tabs" style="display:flex;gap:4px;margin-bottom:10px;">
          <button type="button" class="mg-add-tab active" data-tab="magic" style="flex:1;padding:6px;">Magic Item</button>
          <button type="button" class="mg-add-tab" data-tab="custom" style="flex:1;padding:6px;">Custom Item</button>
        </div>

        <div id="mg-add-magic-panel">
          <div class="mg-form-group">
            <label>Search:</label>
            <input type="text" id="mg-item-search" placeholder="Type to filter..." style="width:100%;margin-bottom:6px;">
          </div>
          <div class="mg-form-group">
            <label>Rarity Filter:</label>
            <select id="mg-rarity-filter" style="width:100%;margin-bottom:6px;">
              <option value="all">All Rarities</option>
              <option value="common">Common</option>
              <option value="uncommon">Uncommon</option>
              <option value="rare">Rare</option>
              <option value="very-rare">Very Rare</option>
              <option value="legendary">Legendary</option>
            </select>
          </div>
          <div class="mg-form-group">
            <label>Item:</label>
            <select id="mg-add-item-select" size="8" style="width:100%;">
              ${options}
            </select>
          </div>
          <p style="font-size:0.85em;color:#666;margin-top:4px;">
            <i class="fas fa-info-circle"></i> Manual adds bypass party tier gating.
          </p>
        </div>

        <div id="mg-add-custom-panel" style="display:none;">
          <div class="mg-form-group">
            <label>Item Name:</label>
            <input type="text" id="mg-custom-name" placeholder="e.g. Enchanted Rope" style="width:100%;">
          </div>
          <div class="mg-form-group" style="margin-top:6px;">
            <label>DM Description:</label>
            <textarea id="mg-custom-desc-dm" rows="2" placeholder="Full mechanical description (DM only)" style="width:100%;"></textarea>
          </div>
          <div class="mg-form-group" style="margin-top:6px;">
            <label>Player Description:</label>
            <textarea id="mg-custom-desc-player" rows="2" placeholder="Vague flavor text (players see this)" style="width:100%;"></textarea>
          </div>
          <div style="display:flex;gap:6px;margin-top:6px;">
            <div class="mg-form-group" style="flex:1;">
              <label>GP</label>
              <input type="number" id="mg-custom-gp" value="0" min="0" style="width:100%;">
            </div>
            <div class="mg-form-group" style="flex:1;">
              <label>SP</label>
              <input type="number" id="mg-custom-sp" value="0" min="0" style="width:100%;">
            </div>
            <div class="mg-form-group" style="flex:1;">
              <label>CP</label>
              <input type="number" id="mg-custom-cp" value="0" min="0" style="width:100%;">
            </div>
          </div>
          <div style="display:flex;gap:6px;margin-top:6px;">
            <div class="mg-form-group" style="flex:1;">
              <label>Rarity:</label>
              <select id="mg-custom-rarity" style="width:100%;">
                <option value="common">Common</option>
                <option value="uncommon">Uncommon</option>
                <option value="rare">Rare</option>
                <option value="very-rare">Very Rare</option>
                <option value="legendary">Legendary</option>
              </select>
            </div>
            <div class="mg-form-group" style="flex:1;">
              <label>Quantity:</label>
              <input type="number" id="mg-custom-qty" value="1" min="1" style="width:100%;">
            </div>
          </div>
          <div class="mg-form-group" style="margin-top:6px;">
            <label><input type="checkbox" id="mg-custom-attunement"> Requires Attunement</label>
          </div>
        </div>
      `,
      buttons: {
        add: {
          icon: '<i class="fas fa-plus"></i>',
          label: "Add",
          callback: async (html) => {
            const activeTab = html.find(".mg-add-tab.active").data("tab");
            if (activeTab === "magic") {
              const key = html.find("#mg-add-item-select").val();
              if (key) await this._addMagicItem(key);
            } else {
              await this._addCustomItem(html);
            }
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel"
        }
      },
      default: "add",
      render: (html) => {
        // Tab switching
        html.find(".mg-add-tab").on("click", (ev) => {
          html.find(".mg-add-tab").removeClass("active");
          ev.currentTarget.classList.add("active");
          const tab = ev.currentTarget.dataset.tab;
          html.find("#mg-add-magic-panel").toggle(tab === "magic");
          html.find("#mg-add-custom-panel").toggle(tab === "custom");
        });

        // Search filter
        html.find("#mg-item-search").on("input", () => {
          const search = html.find("#mg-item-search").val().toLowerCase();
          const rarity = html.find("#mg-rarity-filter").val();
          this._filterItemList(html, search, rarity);
        });

        // Rarity filter
        html.find("#mg-rarity-filter").on("change", () => {
          const search = html.find("#mg-item-search").val().toLowerCase();
          const rarity = html.find("#mg-rarity-filter").val();
          this._filterItemList(html, search, rarity);
        });
      }
    }).render(true);
  }

  _filterItemList(html, search, rarity) {
    const options = html.find("#mg-add-item-select option");
    options.each(function () {
      const name = this.text.toLowerCase();
      const itemRarity = this.dataset.rarity;
      const matchesSearch = !search || name.includes(search);
      const matchesRarity = rarity === "all" || itemRarity === rarity;
      this.style.display = (matchesSearch && matchesRarity) ? "" : "none";
    });
  }

  async _addCustomItem(html) {
    const shop = getShop(this._shopId);
    if (!shop) return;

    const name = html.find("#mg-custom-name").val();
    if (!name) {
      ui.notifications.warn("Item name is required.");
      return;
    }

    const gp = Number(html.find("#mg-custom-gp").val()) || 0;
    const sp = Number(html.find("#mg-custom-sp").val()) || 0;
    const cp = Number(html.find("#mg-custom-cp").val()) || 0;
    const price = { gp, sp, cp };

    shop.inventory.push({
      itemRef: null,
      name,
      descriptionDM: html.find("#mg-custom-desc-dm").val() || name,
      descriptionPlayer: html.find("#mg-custom-desc-player").val() || name,
      basePrice: { ...price },
      listedPrice: { ...price },
      quantity: Number(html.find("#mg-custom-qty").val()) || 1,
      rarity: html.find("#mg-custom-rarity").val() || "common",
      category: "custom",
      requiresAttunement: html.find("#mg-custom-attunement").is(":checked"),
      tierRequired: 1
    });

    await saveShop(shop);
    ui.notifications.info(`Added ${name} to ${shop.name}.`);
    this.render(true);
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
        <div id="mg-sell-coins" style="font-size:0.85em;background:rgba(0,0,0,0.05);padding:6px 8px;border-radius:3px;margin-top:6px;"></div>
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
        const updateActorInfo = () => {
          const actorId = html.find("#mg-sell-actor").val();
          const actor = game.actors.get(actorId);
          if (!actor) return;

          // Show player's purse
          const currency = actor.system?.currency || {};
          const coinParts = [];
          if (currency.pp) coinParts.push(`${currency.pp} pp`);
          coinParts.push(`${currency.gp || 0} gp`);
          if (currency.ep) coinParts.push(`${currency.ep} ep`);
          coinParts.push(`${currency.sp || 0} sp`);
          coinParts.push(`${currency.cp || 0} cp`);
          const totalGP = ((currency.pp || 0) * 10 + (currency.gp || 0) + (currency.ep || 0) * 0.5 + (currency.sp || 0) * 0.1 + (currency.cp || 0) * 0.01).toFixed(2);
          html.find("#mg-sell-coins")[0].innerHTML = `<i class="fas fa-coins"></i> <strong>${actor.name}'s Purse:</strong> ${coinParts.join(" · ")} <span style="color:#888;">(${totalGP} GP total)</span>`;

          // Bias check
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
        };

        html.find("#mg-sell-actor").on("change", updateActorInfo);
        updateActorInfo();
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

    // Get actor's currency and deduct smartly (preserves coin distribution)
    const currency = actor.system?.currency || {};
    const newCurrency = deductCurrency(currency, priceCopperTotal);

    if (!newCurrency) {
      const actorCopper = (currency.pp || 0) * 1000 + (currency.gp || 0) * 100 + (currency.ep || 0) * 50 + (currency.sp || 0) * 10 + (currency.cp || 0);
      ui.notifications.warn(`${actor.name} can't afford ${item.name} (needs ${priceGP} GP, has ${(actorCopper / 100).toFixed(2)} GP equivalent).`);
      return;
    }

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
    const addGP = Math.floor(addedCopper / 100);
    const addSP = Math.floor((addedCopper % 100) / 10);
    const addCP = addedCopper % 10;

    const newCurrency = {
      pp: currency.pp || 0,
      gp: (currency.gp || 0) + addGP,
      ep: currency.ep || 0,
      sp: (currency.sp || 0) + addSP,
      cp: (currency.cp || 0) + addCP
    };
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

    // Emit socket event to all clients to open the player view
    game.socket.emit(`module.${getModuleId()}`, {
      action: "openShop",
      shopId: this._shopId
    });

    // Also open DM's own preview
    new ShopViewPlayer(this._shopId).render(true);
    ui.notifications.info(`Opened ${shop.name} for all players.`);
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
 * Convert total copper to D&D currency denominations (used for adding currency only)
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

/**
 * Deduct a price from an actor's currency, preserving their coin distribution.
 * Only breaks larger coins when smaller denominations can't cover the cost.
 *
 * @param {object} currency - Actor's current currency { pp, gp, ep, sp, cp }
 * @param {number} priceCopperTotal - Total cost in copper pieces
 * @returns {object|null} New currency object, or null if can't afford
 */
function deductCurrency(currency, priceCopperTotal) {
  // Work with copies
  let pp = currency.pp || 0;
  let gp = currency.gp || 0;
  let ep = currency.ep || 0;
  let sp = currency.sp || 0;
  let cp = currency.cp || 0;

  let remaining = priceCopperTotal;

  // Step 1: Pay with copper first
  const cpUsed = Math.min(cp, remaining);
  cp -= cpUsed;
  remaining -= cpUsed;
  if (remaining <= 0) return { pp, gp, ep, sp, cp };

  // Step 2: Pay with silver (each sp = 10 cp)
  const spNeeded = Math.ceil(remaining / 10);
  const spUsed = Math.min(sp, spNeeded);
  const spValue = spUsed * 10;
  sp -= spUsed;
  if (spValue >= remaining) {
    // Overpaid with silver, give change back as copper
    cp += (spValue - remaining);
    return { pp, gp, ep, sp, cp };
  }
  remaining -= spValue;

  // Step 3: Pay with electrum (each ep = 50 cp)
  const epNeeded = Math.ceil(remaining / 50);
  const epUsed = Math.min(ep, epNeeded);
  const epValue = epUsed * 50;
  ep -= epUsed;
  if (epValue >= remaining) {
    // Give change back as silver and copper
    let change = epValue - remaining;
    sp += Math.floor(change / 10);
    cp += change % 10;
    return { pp, gp, ep, sp, cp };
  }
  remaining -= epValue;

  // Step 4: Pay with gold (each gp = 100 cp)
  const gpNeeded = Math.ceil(remaining / 100);
  const gpUsed = Math.min(gp, gpNeeded);
  const gpValue = gpUsed * 100;
  gp -= gpUsed;
  if (gpValue >= remaining) {
    // Give change back as silver and copper
    let change = gpValue - remaining;
    sp += Math.floor(change / 10);
    cp += change % 10;
    return { pp, gp, ep, sp, cp };
  }
  remaining -= gpValue;

  // Step 5: Pay with platinum (each pp = 1000 cp)
  const ppNeeded = Math.ceil(remaining / 1000);
  const ppUsed = Math.min(pp, ppNeeded);
  const ppValue = ppUsed * 1000;
  pp -= ppUsed;
  if (ppValue >= remaining) {
    // Give change back as gold, silver, and copper
    let change = ppValue - remaining;
    gp += Math.floor(change / 100);
    change %= 100;
    sp += Math.floor(change / 10);
    cp += change % 10;
    return { pp, gp, ep, sp, cp };
  }

  // Can't afford
  return null;
}

export { formatPrice, copperToCurrency };
