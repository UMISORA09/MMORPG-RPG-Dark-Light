import { index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  forumTitle: text("forum_title").notNull().default("Tân Thủ Long Tộc"),
  selectedRegion: text("selected_region").notNull().default("VN"),
  selectedServerId: text("selected_server_id").notNull().default("s1_long_vuong"),
  lastCharacterId: integer("last_character_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  selectedServerIdIndex: index("users_selected_server_id_idx").on(table.selectedServerId),
}));

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
