import { index, pgTable, serial, text, integer, timestamp, boolean, real } from "drizzle-orm/pg-core";
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

  // --- Versioning & Concurrency Protection ---
  revision: integer("revision").notNull().default(1),
  lastSavedAt: timestamp("last_saved_at").defaultNow().notNull(),

  // --- Precise World Position & Orientation (Real Precision) ---
  zoneId: text("zone_id").notNull().default("SAFE_VILLAGE"),
  posX: real("pos_x").notNull().default(0),
  posZ: real("pos_z").notNull().default(0),
  facing: text("facing").notNull().default("down"), // 'up' | 'down' | 'left' | 'right'
  isMounted: boolean("is_mounted").notNull().default(false),
  activeMountId: text("active_mount_id").notNull().default("dark_steed"),
  activePetId: text("active_pet_id").notNull().default("spirit_orb"),

  // --- Progression & Core Stats ---
  level: integer("level").notNull().default(1),
  experience: integer("experience").notNull().default(0),
  hp: integer("hp").notNull(),
  maxHp: integer("max_hp").notNull(),
  mp: integer("mp").notNull().default(65),
  maxMp: integer("max_mp").notNull().default(65),
  statPoints: integer("stat_points").notNull().default(0),
  skillPoints: integer("skill_points").notNull().default(0),
  str: integer("str").notNull().default(10),
  dex: integer("dex").notNull().default(7),
  intel: integer("intel").notNull().default(5),
  luk: integer("luk").notNull().default(5),
  vit: integer("vit").notNull().default(8),
  atk: integer("atk").notNull().default(10),
  matk: integer("matk").notNull().default(10),
  def: integer("def").notNull().default(4),
  mdef: integer("mdef").notNull().default(4),
  spd: integer("spd").notNull().default(10),
  critRate: integer("crit_rate").notNull().default(8),
  critDmg: integer("crit_dmg").notNull().default(150),
  accuracy: integer("accuracy").notNull().default(95),
  evasion: integer("evasion").notNull().default(6),
  combatPower: integer("combat_power").notNull().default(250),
  rageGauge: integer("rage_gauge").notNull().default(0),

  gold: integer("gold").notNull().default(1000),
  kills: integer("kills").notNull().default(0),
  deaths: integer("deaths").notNull().default(0),
  unallocatedStatPoints: integer("unallocated_stat_points").notNull().default(0),
  honorPoints: integer("honor_points").notNull().default(0),
  arenaRank: text("arena_rank").notNull().default("Đồng IV"),
  activeMount: text("active_mount").notNull().default("shadow_steed"),
  activePet: text("active_pet").notNull().default("fairy_spirit"),

  // --- Inventory & UI State Snapshots ---
  unlockedSlots: integer("unlocked_slots").notNull().default(18),
  hotbarConfigJson: text("hotbar_config_json").notNull().default(""),
  activeBuffsJson: text("active_buffs_json").notNull().default("[]"),
  uiPreferencesJson: text("ui_preferences_json").notNull().default(""),

  // --- Advanced MMORPG Systems (Awakening, Talents, Codex, Auto-Bot) ---
  awakeningTier: integer("awakening_tier").notNull().default(0),
  talentsJson: text("talents_json").notNull().default("{}"),
  codexUnlockedJson: text("codex_unlocked_json").notNull().default("[]"),
  autoCombatSettingsJson: text("auto_combat_settings_json").notNull().default("{\"hpThreshold\":45,\"mpThreshold\":30,\"lootFilterMinRarity\":\"rare\"}"),

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
