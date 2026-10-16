import { integer, pgTable, text } from "drizzle-orm/pg-core";

export const serversTable = pgTable("servers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  region: text("region").notNull(),
  status: text("status").notNull().default("GOOD"),
  expMultiplier: integer("exp_multiplier").notNull().default(1),
  goldMultiplier: integer("gold_multiplier").notNull().default(1),
  maxPlayers: integer("max_players").notNull().default(1000),
});

export type Server = typeof serversTable.$inferSelect;