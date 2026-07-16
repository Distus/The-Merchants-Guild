/**
 * Shop Manager
 * DM sidebar panel — lists all shops, allows create/open/delete
 *
 * The Merchant's Guild — FoundryVTT Module
 */

import { getAllShops, deleteShop, getModuleId } from "../module.js";
import { STORE_TYPES, AFFLUENCE_TIERS } from "../shop-generator.js";
import { ShopConfig } from "./shop-config.js";
import { ShopViewDM } from "./shop-view-dm.js";

export class ShopManager extends Application {

  /** Singleton instance */
  static _instance = null;

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "merchants-guild-shop-manager",
      title: "The Merchant's Guild — Shop Manager",
      template: `modules/${getModuleId()}/templates/shop-manager.hbs`,
      width: 420,
      height: 550,
      resizable: true,
      classes: ["merchants-guild", "shop-manager"]
    });
  }

  /**
   * Open the shop manager (singleton pattern)
   */
  static open() {
    if (!ShopManager._instance) {
      ShopManager._instance = new ShopManager();
    }
    ShopManager._instance.render(true);
  }

  /**
   * Prepare data for the template
   */
  getData() {
    const allShops = getAllShops();

    // Convert to sorted array for display
    const shopList = Object.values(allShops)
      .map(shop => ({
        ...shop,
        typeLabel: STORE_TYPES[shop.type] || shop.type,
        affluenceLabel: AFFLUENCE_TIERS[shop.affluenceTier]?.label || "Unknown",
        shopkeeperName: shop.shopkeeper?.name || "Unknown"
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      shops: shopList,
      hasShops: shopList.length > 0,
      storeTypes: STORE_TYPES,
      affluenceTiers: AFFLUENCE_TIERS
    };
  }

  /**
   * Set up event listeners
   */
  activateListeners(html) {
    super.activateListeners(html);

    // Create New Shop button
    html.find(".create-shop-btn").click((ev) => {
      ev.preventDefault();
      new ShopConfig({}, {
        onSave: () => this.render(true)
      }).render(true);
    });

    // Open a shop
    html.find(".shop-open-btn").click((ev) => {
      ev.preventDefault();
      const shopId = ev.currentTarget.closest("[data-shop-id]").dataset.shopId;
      new ShopViewDM(shopId, {
        onUpdate: () => this.render(true)
      }).render(true);
    });

    // Delete a shop
    html.find(".shop-delete-btn").click(async (ev) => {
      ev.preventDefault();
      const shopId = ev.currentTarget.closest("[data-shop-id]").dataset.shopId;
      const shopName = ev.currentTarget.closest("[data-shop-id]").dataset.shopName;

      const confirmed = await Dialog.confirm({
        title: "Delete Shop",
        content: `<p>Are you sure you want to delete <strong>${shopName}</strong>? This cannot be undone.</p>`,
        yes: () => true,
        no: () => false,
        defaultYes: false
      });

      if (confirmed) {
        await deleteShop(shopId);
        ui.notifications.info(`Deleted shop: ${shopName}`);
        this.render(true);
      }
    });
  }
}
