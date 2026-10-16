import { z } from "zod/v4";

export const EquipmentSlotSchema = z.enum([
  "helm", "armor", "greaves", "boots", "pauldrons", "gauntlets",
  "main_weapon", "off_weapon", "earring", "amulet", "ring", "relic", "none",
]);

export const InventoryActionParams = z.object({
  characterId: z.coerce.number().int().positive(),
  ownershipId: z.coerce.number().int().positive(),
});

export const CreateForumPostBody = z.object({
  title: z.string().trim().min(4).max(120),
  category: z.enum(["general", "build", "boss", "notice"]).default("general"),
  body: z.string().trim().min(1).max(5000),
  characterId: z.coerce.number().int().positive().optional(),
  serverId: z.string().trim().min(2).max(64).default("s1_long_vuong"),
});

export const ForumCommentBody = z.object({ comment: z.string().trim().min(1).max(1000) });
export const ForumLikeBody = z.object({ liked: z.boolean() });
export const CommunityListQuery = z.object({
  serverId: z.string().trim().min(2).max(64).optional(),
  category: z.enum(["general", "build", "boss", "notice"]).optional(),
  channel: z.enum(["world", "server", "party"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export const ForumPostParams = z.object({ postId: z.coerce.number().int().positive() });

export const SetServerBody = z.object({
  serverId: z.string().trim().min(2).max(64),
  region: z.enum(["VN", "SEA", "TEST"]),
});