import { index, integer, pgTable, text } from "drizzle-orm/pg-core";

export const monstersTable = pgTable("monsters", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull().default(""),
  archetype: text("archetype").notNull().default("MELEE_RUSHER"),
  zoneId: text("zone_id").notNull().default("WILDERNESS"),
  level: integer("level").notNull().default(1),
  hp: integer("hp").notNull(),
  atk: integer("atk").notNull(),
  def: integer("def").notNull(),
  spd: integer("spd").notNull().default(10),
  critRate: integer("crit_rate").notNull().default(5),
  staggerThreshold: integer("stagger_threshold").notNull().default(100),
  aggroRadius: integer("aggro_radius").notNull().default(8),
  leashRadius: integer("leash_radius").notNull().default(18),
  expReward: integer("exp_reward").notNull().default(0),
  goldReward: integer("gold_reward").notNull().default(0),
  emoji: text("emoji").notNull().default("👹"),
  spriteType: text("sprite_type").notNull().default("goblin"),
  description: text("description").notNull().default(""),
  dropTableJson: text("drop_table_json").notNull().default("[]"),
}, (table) => ({
  zoneIdIndex: index("monsters_zone_id_idx").on(table.zoneId),
  levelIndex: index("monsters_level_idx").on(table.level),
}));

export type Monster = typeof monstersTable.$inferSelect;