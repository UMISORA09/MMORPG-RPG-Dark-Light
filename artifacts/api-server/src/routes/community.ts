import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import {
  db,
  forumCommentsTable,
  forumPostsTable,
  serversTable,
  usersTable,
  worldChatsTable,
} from "@workspace/db";
import {
  CreateForumPostBody,
  CreateWorldChatBody,
  CommunityListQuery,
  ForumCommentBody,
  ForumLikeBody,
  ForumPostParams,
} from "@workspace/api-zod";
import { requireAuth, getAuthUserId } from "../middlewares/requireAuth";
import { ensureServerCatalog, getCharacterForUser } from "../lib/inventory";

const router = Router();
async function validateServer(serverId: string) {
  await ensureServerCatalog();
  const [server] = await db.select().from(serversTable).where(eq(serversTable.id, serverId)).limit(1);
  return server;
}

async function validateOptionalCharacter(userId: number, characterId?: number, serverId?: string) {
  if (characterId === undefined) return { character: undefined as any, error: null as string | null };
  const character = await getCharacterForUser(characterId, userId);
  if (!character) return { character: undefined, error: "Nhân vật không tồn tại hoặc không thuộc tài khoản" };
  if (serverId && character.serverId !== serverId) return { character: undefined, error: "Nhân vật không thuộc máy chủ đã chọn" };
  return { character, error: null };
}

router.get("/community/posts", requireAuth, async (req, res) => {
  const parsed = CommunityListQuery.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Bộ lọc diễn đàn không hợp lệ" });
  const filters = [];
  if (parsed.data.serverId) filters.push(eq(forumPostsTable.serverId, parsed.data.serverId));
  if (parsed.data.category) filters.push(eq(forumPostsTable.category, parsed.data.category));
  const query = db.select().from(forumPostsTable);
  const posts = filters.length ? await query.where(and(...filters)).orderBy(desc(forumPostsTable.createdAt)).limit(parsed.data.limit)
    : await query.orderBy(desc(forumPostsTable.createdAt)).limit(parsed.data.limit);
  return res.status(200).json(posts);
});

router.post("/community/posts", requireAuth, async (req, res) => {
  const parsed = CreateForumPostBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Nội dung bài viết không hợp lệ" });
  const userId = getAuthUserId(req);
  const serverId = parsed.data.serverId;
  const server = await validateServer(serverId);
  if (!server) return res.status(400).json({ error: "Máy chủ không tồn tại" });
  const { character, error } = await validateOptionalCharacter(userId, parsed.data.characterId, serverId);
  if (error) return res.status(400).json({ error });

  const [post] = await db.insert(forumPostsTable).values({
    userId,
    characterId: character?.id ?? null,
    serverId,
    title: parsed.data.title,
    category: parsed.data.category,
    body: parsed.data.body,
    likes: [],
  }).returning();
  return res.status(201).json(post);
});

router.post("/community/posts/:postId/like", requireAuth, async (req, res) => {
  const params = ForumPostParams.safeParse(req.params);
  const body = ForumLikeBody.safeParse(req.body);
  if (!params.success || !body.success) return res.status(400).json({ error: "Thao tác thích không hợp lệ" });
  const [post] = await db.select().from(forumPostsTable).where(eq(forumPostsTable.id, params.data.postId)).limit(1);
  if (!post) return res.status(404).json({ error: "Không tìm thấy bài viết" });
  const likes: number[] = Array.isArray(post.likes) ? post.likes.map((like: unknown) => Number(like)) : [];
  const userId = getAuthUserId(req);
  const nextLikes = body.data.liked
    ? (likes.includes(userId) ? likes : [...likes, userId])
    : likes.filter((id) => id !== userId);
  const [updated] = await db.update(forumPostsTable).set({ likes: nextLikes, updatedAt: new Date() })
    .where(eq(forumPostsTable.id, post.id)).returning();
  return res.status(200).json({ postId: post.id, liked: body.data.liked, likesCount: nextLikes.length, post: updated });
});

router.get("/community/posts/:postId/comments", requireAuth, async (req, res) => {
  const params = ForumPostParams.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "ID bài viết không hợp lệ" });
  const [post] = await db.select({ id: forumPostsTable.id }).from(forumPostsTable)
    .where(eq(forumPostsTable.id, params.data.postId)).limit(1);
  if (!post) return res.status(404).json({ error: "Không tìm thấy bài viết" });
  const comments = await db.select().from(forumCommentsTable)
    .where(eq(forumCommentsTable.postId, post.id)).orderBy(desc(forumCommentsTable.createdAt)).limit(100);
  return res.status(200).json(comments);
});

router.post("/community/posts/:postId/comments", requireAuth, async (req, res) => {
  const params = ForumPostParams.safeParse(req.params);
  const body = ForumCommentBody.safeParse(req.body);
  if (!params.success || !body.success) return res.status(400).json({ error: "Bình luận không hợp lệ" });
  const [post] = await db.select({ id: forumPostsTable.id }).from(forumPostsTable)
    .where(eq(forumPostsTable.id, params.data.postId)).limit(1);
  if (!post) return res.status(404).json({ error: "Không tìm thấy bài viết" });
  const [comment] = await db.insert(forumCommentsTable).values({
    postId: post.id,
    userId: getAuthUserId(req),
    comment: body.data.comment,
  }).returning();
  return res.status(201).json(comment);
});

router.get("/community/chats", requireAuth, async (req, res) => {
  const parsed = CommunityListQuery.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Bộ lọc chat không hợp lệ" });
  const filters = [];
  if (parsed.data.serverId) filters.push(eq(worldChatsTable.serverId, parsed.data.serverId));
  if (parsed.data.channel) filters.push(eq(worldChatsTable.channel, parsed.data.channel));
  const query = db.select().from(worldChatsTable);
  const messages = filters.length ? await query.where(and(...filters)).orderBy(desc(worldChatsTable.createdAt)).limit(parsed.data.limit)
    : await query.orderBy(desc(worldChatsTable.createdAt)).limit(parsed.data.limit);
  return res.status(200).json(messages.reverse());
});

router.post("/community/chats", requireAuth, async (req, res) => {
  const parsed = CreateWorldChatBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Tin nhắn không hợp lệ" });
  const userId = getAuthUserId(req);

  const [user] = await db.select({ selectedServerId: usersTable.selectedServerId }).from(usersTable)
    .where(eq(usersTable.id, userId)).limit(1);
  const serverId = parsed.data.serverId ?? user?.selectedServerId ?? "s1_long_vuong";

  const server = await validateServer(serverId);
  if (!server) return res.status(400).json({ error: "Máy chủ không tồn tại" });
  const { character, error } = await validateOptionalCharacter(userId, parsed.data.characterId, serverId);
  if (error) return res.status(400).json({ error });
  const [message] = await db.insert(worldChatsTable).values({
    userId,
    characterId: character?.id ?? null,
    serverId: server.id,
    channel: parsed.data.channel,
    message: parsed.data.message,
  }).returning();
  return res.status(201).json(message);
});

export default router;
