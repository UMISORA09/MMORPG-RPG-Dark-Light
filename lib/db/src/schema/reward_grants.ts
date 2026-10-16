import { index, pgTable, uuid, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const rewardGrantsTable = pgTable("reward_grants", {
  encounterId: uuid("encounter_id").primaryKey(),
  characterId: integer("character_id").notNull(),
  expGranted: integer("exp_granted").notNull(),
  goldGranted: integer("gold_granted").notNull(),
  itemsGranted: jsonb("items_granted"),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
}, (table) => ({ characterIdIndex: index("reward_grants_character_id_idx").on(table.characterId) }));

export const insertRewardGrantSchema = createInsertSchema(rewardGrantsTable).omit({
  grantedAt: true,
});

export type InsertRewardGrant = z.infer<typeof insertRewardGrantSchema>;
export type RewardGrant = typeof rewardGrantsTable.$inferSelect;
