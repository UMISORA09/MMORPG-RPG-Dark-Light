import { pgTable, uuid, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { encountersTable } from "./encounters";
import { charactersTable } from "./characters";

export const rewardGrantsTable = pgTable("reward_grants", {
  encounterId: uuid("encounter_id")
    .primaryKey()
    .references(() => encountersTable.id, { onDelete: "cascade" }),
  characterId: integer("character_id")
    .notNull()
    .references(() => charactersTable.id, { onDelete: "cascade" }),
  expGranted: integer("exp_granted").notNull(),
  goldGranted: integer("gold_granted").notNull(),
  itemsGranted: jsonb("items_granted"),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
});

export const insertRewardGrantSchema = createInsertSchema(rewardGrantsTable).omit({
  grantedAt: true,
});

export type InsertRewardGrant = z.infer<typeof insertRewardGrantSchema>;
export type RewardGrant = typeof rewardGrantsTable.$inferSelect;
