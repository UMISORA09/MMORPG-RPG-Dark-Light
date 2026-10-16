import { index, pgTable, serial, integer, text, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const battleLogsTable = pgTable("battle_logs", {
  id: serial("id").primaryKey(),
  characterId: integer("character_id").notNull(),
  encounterId: uuid("encounter_id"),
  monsterId: text("monster_id").notNull(),
  monsterName: text("monster_name").notNull(),
  victory: boolean("victory").notNull(),
  expGained: integer("exp_gained").notNull().default(0),
  goldGained: integer("gold_gained").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  characterIdIndex: index("battle_logs_character_id_idx").on(table.characterId),
  monsterIdIndex: index("battle_logs_monster_id_idx").on(table.monsterId),
  createdAtIndex: index("battle_logs_created_at_idx").on(table.createdAt),
}));

export const insertBattleLogSchema = createInsertSchema(battleLogsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertBattleLog = z.infer<typeof insertBattleLogSchema>;
export type BattleLog = typeof battleLogsTable.$inferSelect;
