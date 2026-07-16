# Changelog

All notable changes to The Merchant's Guild will be documented in this file.

## [0.1.0] - 2026-07-16

### Added
- **Core Generation Engine**
  - Random generation tables: 400+ shop name fragments, 250+ shopkeeper names across 8 races, 25 personality traits with DC nudges, 35 physical quirks, bias tables
  - Shop name generator with 3 naming patterns and type-specific prefixes/nouns
  - Shop description generator with 13 templates and 150+ fragment entries across 10 categories, plus store-type-specific flavor lines
  - Shopkeeper generator: name, race, gender, personality, quirks, physical description, light stat block, social DCs, optional bias
  - Inventory generator with base/rotating item pools, party tier gating, affluence-based magic item probability, and price modifiers
  - Magic item catalog: 66 curated items across 5 rarity tiers with dual descriptions (DM/player)

- **Store Types**: General Goods, Blacksmith, Armorer, Apothecary, Fletcher, Magic Shop, Tavern, Stables, Jeweler, Clothier

- **Affluence System**: 5 tiers (Hamlet through Metropolis) affecting inventory depth, pricing, magic item availability, and shopkeeper power level

- **Party Level Gating**: 4 tiers capping item rarity by average party level, with consumables allowed one tier higher

- **Shopkeeper Features**
  - Light stat blocks scaling by affluence (Commoner → Archmage for magic shops)
  - Social DCs: Haggle, Intimidate, Theft, Passive Perception, Passive Insight
  - Personality-driven DC nudges (e.g., "Paranoid about thieves" → +2 Perception)
  - Rare negative bias system (~12% chance) against races or classes with RP cues
  - Bias-aware transaction pricing with auto-adjustment and hostile refusal

- **DM Interface**
  - Module settings: player visibility, buyback rate, party level detection, bias toggle
  - Shop Manager panel with full shop list, create/delete controls
  - Create Shop dialog with type/affluence selection, full preview, editable fields
  - Shop Detail View with 3 tabs:
    - Inventory: full item table, inline price editing, add/remove items, restock
    - Shopkeeper: stat block, social DCs, personality, bias details
    - Transactions: chronological sale/buyback log

- **Player Interface**
  - Read-only browse view (gated by module setting)
  - Vague item descriptions only — no stats, attunement, or rarity visible
  - Player coin purse display
  - Expandable item descriptions on click

- **Transaction System**
  - Sell to player: actor selection, bias-aware price auto-adjustment, currency deduction with coin conversion, item added to actor sheet
  - Buy from player (sell-back): browse actor inventory, configurable buyback rate, optional add-to-shop-stock
  - Hostile bias blocks transactions with RP notification
  - Full transaction logging

- **Persistence**: All shops stored as world-level flags, persistent across sessions

- **GitHub Distribution**: Installable via Foundry manifest URL
