import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, serversTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterBody, LoginBody, SetServerBody } from "@workspace/api-zod";
import { requireAuth, extractAuthUser } from "../middlewares/requireAuth";
import { ensureServerCatalog } from "../lib/inventory";
import { signToken } from "../lib/token";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const router = Router();

router.post("/auth/server", requireAuth, async (req, res) => {
  const parsed = SetServerBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Vùng hoặc máy chủ không hợp lệ" });

  await ensureServerCatalog();
  const [server] = await db.select().from(serversTable).where(eq(serversTable.id, parsed.data.serverId)).limit(1);
  if (!server || server.region !== parsed.data.region) {
    return res.status(400).json({ error: "Máy chủ không thuộc cụm vùng đã chọn" });
  }

  const [user] = await db.update(usersTable).set({
    selectedRegion: server.region,
    selectedServerId: server.id,
  }).where(eq(usersTable.id, req.session.userId!)).returning();
  if (!user) return res.status(401).json({ error: "Tài khoản không còn tồn tại" });

  return res.status(200).json({ selectedRegion: user.selectedRegion, selectedServerId: user.selectedServerId });
});

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

  if (req.session) {
    req.session.userId = user.id;
  }

  const token = signToken({
    id: user.id,
    username: user.username,
    selectedRegion: user.selectedRegion,
    selectedServerId: user.selectedServerId,
  });

  res.cookie("clb_token", token, {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return res.status(201).json({
    token,
    user: {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
      selectedRegion: user.selectedRegion,
      selectedServerId: user.selectedServerId,
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

  if (req.session) {
    req.session.userId = user.id;
  }

  const token = signToken({
    id: user.id,
    username: user.username,
    selectedRegion: user.selectedRegion,
    selectedServerId: user.selectedServerId,
  });

  res.cookie("clb_token", token, {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return res.status(200).json({
    token,
    user: {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
      selectedRegion: user.selectedRegion,
      selectedServerId: user.selectedServerId,
    },
  });
});

router.post("/auth/logout", (req, res) => {
  if (req.session?.destroy) {
    req.session.destroy(() => {});
  }
  res.clearCookie("clb_token", { path: "/" });
  return res.status(200).json({ success: true });
});

router.get("/auth/me", async (req, res) => {
  const user = await extractAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Chưa đăng nhập" });
  }

  return res.status(200).json({
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
    selectedRegion: user.selectedRegion,
    selectedServerId: user.selectedServerId,
  });
});

export default router;
