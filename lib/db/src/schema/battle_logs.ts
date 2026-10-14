import { pgTable, serial, integer, text, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { charactersTable } from "./characters";

export const battleLogsTable = pgTable("battle_logs", {
  id: serial("id").primaryKey(),
  characterId: integer("character_id")
    .notNull()
    .references(() => charactersTable.id, { onDelete: "cascade" }),
  encounterId: uuid("encounter_id"),
  monsterId: text("monster_id").notNull(),
  monsterName: text("monster_name").notNull(),
  victory: boolean("victory").notNull(),
  expGained: integer("exp_gained").notNull().default(0),
  goldGained: integer("gold_gained").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBattleLogSchema = createInsertSchema(battleLogsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertBattleLog = z.infer<typeof insertBattleLogSchema>;
export type BattleLog = typeof battleLogsTable.$inferSelect;
