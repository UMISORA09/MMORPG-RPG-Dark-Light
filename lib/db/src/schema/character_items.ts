import { index, pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const characterItemsTable = pgTable("character_items", {
    id: serial("id").primaryKey(),
    characterId: integer("character_id").notNull(),
    itemId: text("item_id").notNull(),
    equipped: boolean("equipped").notNull().default(false),
    equippedSlot: text("equipped_slot"),
    slotIndex: integer("slot_index").notNull().default(0),
    quantity: integer("quantity").notNull().default(1),
    enhanceLevel: integer("enhance_level").notNull().default(0),
    rarity: text("rarity").notNull().default("common"),
    bonusCombatPower: integer("bonus_combat_power").notNull().default(0),
    miraclePassive1: text("miracle_passive_1"),
    miraclePassive2: text("miracle_passive_2"),
    acquiredAt: timestamp("acquired_at").defaultNow().notNull(),
  }, (table) => ({
    characterIdIndex: index("character_items_character_id_idx").on(table.characterId),
    itemIdIndex: index("character_items_item_id_idx").on(table.itemId),
    characterSlotIndex: index("character_items_character_slot_idx").on(table.characterId, table.equippedSlot),
    characterBagIndex: index("character_items_character_bag_idx").on(table.characterId, table.slotIndex),
  }));

export const insertCharacterItemSchema = createInsertSchema(characterItemsTable).omit({
  id: true,
  acquiredAt: true,
});

export type InsertCharacterItem = z.infer<typeof insertCharacterItemSchema>;
export type CharacterItem = typeof characterItemsTable.$inferSelect;