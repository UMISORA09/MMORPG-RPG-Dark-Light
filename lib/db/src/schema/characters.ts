import { index, pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const charactersTable = pgTable("characters", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  serverId: text("server_id").notNull().default("s1_long_vuong"),
  name: text("name").notNull(),
  gender: text("gender").notNull().default("male"),
  classId: text("class_id").notNull(),
  className: text("class_name").notNull(),
  title: text("title").notNull().default("Thượng Cấp Chiến Sĩ"),
  zoneId: text("zone_id").notNull().default("SAFE_VILLAGE"),
  posX: integer("pos_x").notNull().default(0),
  posZ: integer("pos_z").notNull().default(0),
  level: integer("level").notNull().default(1),
  experience: integer("experience").notNull().default(0),
  hp: integer("hp").notNull(),
  maxHp: integer("max_hp").notNull(),
  mp: integer("mp").notNull().default(200),
  maxMp: integer("max_mp").notNull().default(200),
  str: integer("str").notNull().default(15),
  dex: integer("dex").notNull().default(15),
  intel: integer("intel").notNull().default(15),
  luk: integer("luk").notNull().default(10),
  vit: integer("vit").notNull().default(15),
  atk: integer("atk").notNull(),
  matk: integer("matk").notNull().default(20),
  def: integer("def").notNull(),
  mdef: integer("mdef").notNull().default(15),
  spd: integer("spd").notNull(),
  critRate: integer("crit_rate").notNull().default(15),
  critDmg: integer("crit_dmg").notNull().default(150),
  accuracy: integer("accuracy").notNull().default(95),
  evasion: integer("evasion").notNull().default(10),
  combatPower: integer("combat_power").notNull().default(500),
  gold: integer("gold").notNull().default(1000),
  kills: integer("kills").notNull().default(0),
  deaths: integer("deaths").notNull().default(0),
  unallocatedStatPoints: integer("unallocated_stat_points").notNull().default(0),
  honorPoints: integer("honor_points").notNull().default(0),
  arenaRank: text("arena_rank").notNull().default("Đồng IV"),
  activeMount: text("active_mount").notNull().default("shadow_steed"),
  activePet: text("active_pet").notNull().default("fairy_spirit"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIndex: index("characters_user_id_idx").on(table.userId),
  serverIdIndex: index("characters_server_id_idx").on(table.serverId),
  userServerIndex: index("characters_user_server_idx").on(table.userId, table.serverId),
}));

export const insertCharacterSchema = createInsertSchema(charactersTable).omit({
  id: true,
  createdAt: true,
});

export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type Character = typeof charactersTable.$inferSelect;
