import { index, integer, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";

// ==============================================================================
// Quests Table (Template & Story Quest Catalog)
// ZERO Physical Foreign Keys Rule: Only index() used, relational checks in TS code.
// ==============================================================================
export const questsTable = pgTable("quests", {
  id: text("id").primaryKey(), // e.g. "q1_tan_thu", "q2_diet_slime"
  title: text("title").notNull(),
  type: text("type").notNull().default("MAIN"), // 'MAIN' | 'DAILY' | 'BOUNTY'
  npcId: text("npc_id").notNull(), // 'npc_truong_lang', 'npc_tho_ren', 'npc_thuong_nhan', 'npc_gac_cong'
  npcName: text("npc_name").notNull().default("Trưởng Làng"),
  description: text("description").notNull(),
  objectiveType: text("objective_type").notNull(), // 'KILL_MONSTER' | 'COLLECT_ITEM' | 'ENHANCE_ITEM' | 'REACH_LEVEL' | 'CLEAR_DUNGEON' | 'TALK_NPC'
  targetId: text("target_id").notNull(), // monster id, item id, or npc id
  targetName: text("target_name").notNull(), // e.g. "Slime Đầm Lầy"
  requiredCount: integer("required_count").notNull().default(1),
  rewardExp: integer("reward_exp").notNull().default(0),
  rewardGold: integer("reward_gold").notNull().default(0),
  rewardItemId: text("reward_item_id"),
  rewardItemName: text("reward_item_name"),
  rewardItemCount: integer("reward_item_count").default(1),
  nextQuestId: text("next_quest_id"),
  targetPosX: real("target_pos_x").notNull().default(0),
  targetPosZ: real("target_pos_z").notNull().default(0),
  targetZone: text("target_zone").notNull().default("SAFE_VILLAGE"),
  orderIndex: integer("order_index").notNull().default(0),
}, (table) => ({
  typeIdx: index("quests_type_idx").on(table.type),
  npcIdIdx: index("quests_npc_id_idx").on(table.npcId),
  orderIdx: index("quests_order_idx").on(table.orderIndex),
}));

export type Quest = typeof questsTable.$inferSelect;
export type InsertQuest = typeof questsTable.$inferInsert;

// ==============================================================================
// Character Quests Table (Player Quest Progress & Status)
// ZERO Physical Foreign Keys Rule: Only index() used, relational checks in TS code.
// ==============================================================================
export const characterQuestsTable = pgTable("character_quests", {
  id: text("id").primaryKey(), // `${characterId}_${questId}`
  characterId: integer("character_id").notNull(),
  questId: text("quest_id").notNull(),
  progress: integer("progress").notNull().default(0),
  status: text("status").notNull().default("AVAILABLE"), // 'AVAILABLE' | 'IN_PROGRESS' | 'READY_TO_CLAIM' | 'COMPLETED'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  characterIdIdx: index("char_quests_char_id_idx").on(table.characterId),
  questIdIdx: index("char_quests_quest_id_idx").on(table.questId),
  statusIdx: index("char_quests_status_idx").on(table.status),
}));

export type CharacterQuest = typeof characterQuestsTable.$inferSelect;
export type InsertCharacterQuest = typeof characterQuestsTable.$inferInsert;

