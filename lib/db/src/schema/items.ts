import { pgTable, integer, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const itemsTable = pgTable("items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  rarity: text("rarity").notNull(),
  hpBoost: integer("hp_boost").notNull().default(0),
  atkBoost: integer("atk_boost").notNull().default(0),
  defBoost: integer("def_boost").notNull().default(0),
  spdBoost: integer("spd_boost").notNull().default(0),
  price: integer("price").notNull().default(0),
  classId: text("class_id"),
  requiredLevel: integer("required_level").notNull().default(1),
  icon: text("icon").notNull().default("◇"),
});

export const insertItemSchema = createInsertSchema(itemsTable);
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof itemsTable.$inferSelect;