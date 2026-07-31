import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const router = Router();

router.post("/auth/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Tên đăng nhập và mật khẩu không hợp lệ" });
  }

  const { username, password } = parsed.data;

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  if (existing.length > 0) {
    return res.status(409).json({ error: "Tên đăng nhập đã tồn tại" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(usersTable)
    .values({ username, passwordHash })
    .returning();

  req.session.userId = user.id;

  return res.status(201).json({
    user: {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
    },
  });
});

router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Dữ liệu không hợp lệ" });
  }

  const { username, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  if (!user) {
    return res.status(401).json({ error: "Tên đăng nhập hoặc mật khẩu không đúng" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Tên đăng nhập hoặc mật khẩu không đúng" });
  }

  req.session.userId = user.id;

  return res.status(200).json({
    user: {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
    },
  });
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {});
  return res.status(200).json({ success: true });
});

router.get("/auth/me", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Chưa đăng nhập" });
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId))
    .limit(1);

  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: "Phiên đăng nhập không hợp lệ" });
  }

  return res.status(200).json({
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
  });
});

export default router;
