import { index, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const forumPostsTable = pgTable("forum_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  characterId: integer("character_id"),
  serverId: text("server_id").notNull().default("s1_long_vuong"),
  title: text("title").notNull(),
  category: text("category").notNull().default("general"),
  body: text("body").notNull(),
  likes: jsonb("likes").notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIndex: index("forum_posts_user_id_idx").on(table.userId),
  characterIdIndex: index("forum_posts_character_id_idx").on(table.characterId),
  serverIdIndex: index("forum_posts_server_id_idx").on(table.serverId),
}));

export const worldChatsTable = pgTable("world_chats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  characterId: integer("character_id"),
  serverId: text("server_id").notNull().default("s1_long_vuong"),
  channel: text("channel").notNull().default("world"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIndex: index("world_chats_user_id_idx").on(table.userId),
  characterIdIndex: index("world_chats_character_id_idx").on(table.characterId),
  serverIdIndex: index("world_chats_server_id_idx").on(table.serverId),
}));

export const forumCommentsTable = pgTable("forum_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  characterId: integer("character_id"),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  postIdIndex: index("forum_comments_post_id_idx").on(table.postId),
  userIdIndex: index("forum_comments_user_id_idx").on(table.userId),
  characterIdIndex: index("forum_comments_character_id_idx").on(table.characterId),
}));

export type ForumPost = typeof forumPostsTable.$inferSelect;
export type WorldChatMessage = typeof worldChatsTable.$inferSelect;
export type ForumComment = typeof forumCommentsTable.$inferSelect;