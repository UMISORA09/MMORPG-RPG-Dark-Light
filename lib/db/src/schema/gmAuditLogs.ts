import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gmAuditLogsTable = pgTable("gm_audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  characterId: integer("character_id"),
  action: text("action").notNull(),
  payloadJson: text("payload_json"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGmAuditLogSchema = createInsertSchema(gmAuditLogsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertGmAuditLog = z.infer<typeof insertGmAuditLogSchema>;
export type GmAuditLog = typeof gmAuditLogsTable.$inferSelect;
