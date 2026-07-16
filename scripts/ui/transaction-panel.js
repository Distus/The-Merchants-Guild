/**
 * Transaction Panel
 *
 * Transaction logic is integrated directly into ShopViewDM (shop-view-dm.js)
 * rather than as a separate component. The sell-to-player and buy-from-player
 * workflows live there for simplicity.
 *
 * This file is kept as a placeholder for potential future extraction
 * if the transaction UI grows complex enough to warrant separation.
 */

// Re-export helpers from shop-view-dm for external use
export { formatPrice, copperToCurrency } from "./shop-view-dm.js";
