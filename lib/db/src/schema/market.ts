import { index, pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ==============================================================================
// Market Listings Table (Zero Physical Foreign Keys Rule)
// All relational integrity managed by TypeScript + db.transaction()
// ==============================================================================
export const marketListingsTable = pgTable("market_listings", {
  id: serial("id").primaryKey(),
  sellerCharacterId: integer("seller_character_id").notNull(),
  sellerName: text("seller_name").notNull(),
  sellerServerId: text("seller_server_id").notNull().default("s1_long_vuong"),
  itemId: text("item_id").notNull(),
  itemName: text("item_name").notNull(),
  itemRarity: text("item_rarity").notNull().default("common"),
  itemCategory: text("item_category").notNull().default("equipment"),
  itemClassId: text("item_class_id"),
  equipSlot: text("equip_slot"),
  enhanceLevel: integer("enhance_level").notNull().default(0),
  socketsJson: text("sockets_json").notNull().default("[]"),
  reforgeStatsJson: text("reforge_stats_json").notNull().default("[]"),
  quantity: integer("quantity").notNull().default(1),
  priceGold: integer("price_gold").notNull(),
  status: text("status").notNull().default("active"), // "active" | "sold" | "cancelled"
  buyerCharacterId: integer("buyer_character_id"),
  listedAt: timestamp("listed_at").defaultNow().notNull(),
  soldAt: timestamp("sold_at"),
}, (table) => ({
  statusIdx: index("market_listings_status_idx").on(table.status),
  sellerCharIdx: index("market_listings_seller_char_idx").on(table.sellerCharacterId),
  itemIdIdx: index("market_listings_item_id_idx").on(table.itemId),
  categoryIdx: index("market_listings_category_idx").on(table.itemCategory),
  rarityIdx: index("market_listings_rarity_idx").on(table.itemRarity),
  serverIdx: index("market_listings_server_idx").on(table.sellerServerId),
}));

export const insertMarketListingSchema = createInsertSchema(marketListingsTable).omit({
  id: true,
  listedAt: true,
});

export type InsertMarketListing = z.infer<typeof insertMarketListingSchema>;
export type MarketListing = typeof marketListingsTable.$inferSelect;
