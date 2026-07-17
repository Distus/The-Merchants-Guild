/**
 * Shop Config
 * Create/edit shop dialog — DM selects store type and affluence,
 * generates a preview, and saves the shop
 *
 * The Merchant's Guild — FoundryVTT Module
 */

import { saveShop, getPartyLevel, getItemPools, getMagicItems, getModuleId } from "../module.js";
import { generateShop, STORE_TYPES, AFFLUENCE_TIERS } from "../shop-generator.js";
import { generateInventory } from "../inventory-generator.js";
import { getPartyTier, PARTY_TIERS } from "../inventory-generator.js";

export class ShopConfig extends Application {

  /**
   * @param {object} existingShop - If editing, the existing shop data. Empty object for new.
   * @param {object} options
   * @param {Function} options.onSave - Callback when a shop is saved
   */
  constructor(existingShop = {}, options = {}) {
    super(options);
    this._existingShop = existingShop;
    this._onSave = options.onSave || (() => {});
    this._generatedShop = null;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "merchants-guild-shop-config",
      title: "Create New Shop",
      template: `modules/${getModuleId()}/templates/shop-config.hbs`,
      width: 550,
      height: 700,
      resizable: true,
      classes: ["merchants-guild", "shop-config"]
    });
  }

  getData() {
    const partyLevel = getPartyLevel();
    const partyTier = getPartyTier(partyLevel);

    // Build store type options
    const storeTypeOptions = Object.entries(STORE_TYPES).map(([id, label]) => ({
      id, label
    }));

    // Build affluence tier options
    const affluenceOptions = Object.entries(AFFLUENCE_TIERS).map(([tier, data]) => ({
      tier: Number(tier),
      label: `${data.label} (×${data.priceModifier})`
    }));

    // Rarity info for current party tier
    const tierInfo = PARTY_TIERS.find(t => t.tier === partyTier.tier);

    return {
      storeTypes: storeTypeOptions,
      affluenceTiers: affluenceOptions,
      partyLevel,
      partyTier: partyTier.tier,
      maxRarity: tierInfo?.maxRarity || "common",
      consumableMax: tierInfo?.consumableMax || "uncommon",
      generatedShop: this._generatedShop,
      hasPreview: !!this._generatedShop
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Generate button
    html.find(".generate-shop-btn").click((ev) => {
      ev.preventDefault();
      this._generatePreview(html);
    });

    // Save button
    html.find(".save-shop-btn").click(async (ev) => {
      ev.preventDefault();
      await this._saveShop(html);
    });

    // Make editable fields work
    html.find(".edit-shop-name").on("change", (ev) => {
      if (this._generatedShop) {
        this._generatedShop.name = ev.target.value;
      }
    });

    html.find(".edit-shop-description").on("change", (ev) => {
      if (this._generatedShop) {
        this._generatedShop.description = ev.target.value;
      }
    });
  }

  /**
   * Generate a shop preview from the selected options
   */
  _generatePreview(html) {
    const storeType = html.find("select[name='storeType']").val();
    const affluenceTier = Number(html.find("select[name='affluenceTier']").val());
    const location = html.find("input[name='location']").val() || "";
    const biasEnabled = game.settings.get(getModuleId(), "enableShopkeeperBias");

    // Generate the shop
    this._generatedShop = generateShop({
      storeType,
      affluenceTier,
      biasEnabled,
      location
    });

    // Generate inventory
    const partyLevel = getPartyLevel();
    const itemPools = getItemPools();
    const magicItems = getMagicItems();

    this._generatedShop.inventory = generateInventory({
      storeType,
      affluenceTier,
      priceModifier: this._generatedShop.priceModifier,
      partyLevel,
      itemPools,
      magicItems
    });

    // Re-render to show the preview
    this.render(true);
  }

  /**
   * Save the generated shop
   */
  async _saveShop(html) {
    if (!this._generatedShop) {
      ui.notifications.warn("Generate a shop first before saving.");
      return;
    }

    // Pick up any edits from the form
    const editedName = html.find(".edit-shop-name").val();
    const editedDesc = html.find(".edit-shop-description").val();
    const editedLocation = html.find("input[name='location']").val();

    if (editedName) this._generatedShop.name = editedName;
    if (editedDesc) this._generatedShop.description = editedDesc;
    if (editedLocation !== undefined) this._generatedShop.location = editedLocation;

    // Pick up edited shopkeeper name
    const editedKeeperName = html.find(".edit-keeper-name").val();
    if (editedKeeperName && this._generatedShop.shopkeeper) {
      this._generatedShop.shopkeeper.name = editedKeeperName;
    }

    // Save to world flags
    await saveShop(this._generatedShop);

    ui.notifications.info(`Shop saved: ${this._generatedShop.name}`);

    // Callback and close
    this._onSave(this._generatedShop);
    this.close();
  }
}
