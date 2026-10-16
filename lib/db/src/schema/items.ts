import { index, pgTable, integer, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const itemsTable = pgTable("items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull().default("equipment"),
  type: text("type").notNull(),
  equipSlot: text("equip_slot").notNull().default("none"),
  description: text("description").notNull(),
  lore: text("lore").notNull().default(""),
  rarity: text("rarity").notNull(),
  hpBoost: integer("hp_boost").notNull().default(0),
  mpBoost: integer("mp_boost").notNull().default(0),
  atkBoost: integer("atk_boost").notNull().default(0),
  matkBoost: integer("matk_boost").notNull().default(0),
  defBoost: integer("def_boost").notNull().default(0),
  mdefBoost: integer("mdef_boost").notNull().default(0),
  spdBoost: integer("spd_boost").notNull().default(0),
  strBoost: integer("str_boost").notNull().default(0),
  dexBoost: integer("dex_boost").notNull().default(0),
  intBoost: integer("int_boost").notNull().default(0),
  lukBoost: integer("luk_boost").notNull().default(0),
  vitBoost: integer("vit_boost").notNull().default(0),
  critRateBoost: integer("crit_rate_boost").notNull().default(0),
  healHpPercent: integer("heal_hp_percent").notNull().default(0),
  healMpPercent: integer("heal_mp_percent").notNull().default(0),
  buffType: text("buff_type"),
  price: integer("price").notNull().default(0),
  maxStack: integer("max_stack").notNull().default(1),
  classId: text("class_id"),
  requiredLevel: integer("required_level").notNull().default(1),
  icon: text("icon").notNull().default("◇"),
}, (table) => ({ classIdIndex: index("items_class_id_idx").on(table.classId) }));

export const insertItemSchema = createInsertSchema(itemsTable);
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof itemsTable.$inferSelect;