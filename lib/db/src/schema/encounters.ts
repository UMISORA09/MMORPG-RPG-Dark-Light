import { index, pgTable, uuid, integer, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const encountersTable = pgTable("encounters", {
  id: uuid("id").primaryKey().defaultRandom(),
  characterId: integer("character_id").notNull(),
  userId: integer("user_id").notNull(),
  monsterId: text("monster_id").notNull(),
  spawnId: text("spawn_id").notNull(),
  zoneId: text("zone_id").notNull().default("WILDERNESS"),
  status: text("status").notNull().default("active"), // 'active' | 'victory' | 'defeat' | 'aborted' | 'expired'
  rulesVersion: integer("rules_version").notNull().default(1),
  contentVersion: integer("content_version").notNull().default(1),
  rngSeed: integer("rng_seed").notNull().default(1337),
  clientRequestId: text("client_request_id").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  expiresAt: timestamp("expires_at").notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  finalServerTick: integer("final_server_tick"),
  finalStateJson: jsonb("final_state_json"),
  resultJson: jsonb("result_json"),
  logId: integer("log_id"),
}, (table) => ({
  characterIdIndex: index("encounters_character_id_idx").on(table.characterId),
  userIdIndex: index("encounters_user_id_idx").on(table.userId),
  monsterIdIndex: index("encounters_monster_id_idx").on(table.monsterId),
}));

export const insertEncounterSchema = createInsertSchema(encountersTable).omit({
  id: true,
  startedAt: true,
  lastSeenAt: true,
});

export type InsertEncounter = z.infer<typeof insertEncounterSchema>;
export type Encounter = typeof encountersTable.$inferSelect;
