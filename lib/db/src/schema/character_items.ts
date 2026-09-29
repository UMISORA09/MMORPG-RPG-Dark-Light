import { pgTable, serial, integer, text, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { charactersTable } from "./characters";
import { itemsTable } from "./items";

export const characterItemsTable = pgTable(
  "character_items",
  {
    id: serial("id").primaryKey(),
    characterId: integer("character_id")
      .notNull()
      .references(() => charactersTable.id, { onDelete: "cascade" }),
    itemId: text("item_id")
      .notNull()
      .references(() => itemsTable.id, { onDelete: "cascade" }),
    equipped: boolean("equipped").notNull().default(false),
    acquiredAt: timestamp("acquired_at").defaultNow().notNull(),
  },
  (table) => ({
    characterItemUnique: uniqueIndex("character_item_unique").on(table.characterId, table.itemId),
  }),
);

export const insertCharacterItemSchema = createInsertSchema(characterItemsTable).omit({
  id: true,
  acquiredAt: true,
});

export type InsertCharacterItem = z.infer<typeof insertCharacterItemSchema>;
export type CharacterItem = typeof characterItemsTable.$inferSelect;