import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, isPostgres, usersTable, serversTable, wipeAllAccountsAndUserData } from "@workspace/db";
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

const handleSetServer = async (req: any, res: any) => {
  const parsed = SetServerBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Vùng hoặc máy chủ không hợp lệ" });

  await ensureServerCatalog();
  // Allow matching by id directly or normal lookup
  let [server] = await db.select().from(serversTable).where(eq(serversTable.id, parsed.data.serverId)).limit(1);
  if (!server) {
    // If client sent short id like 's1', map to 's1_long_vuong'
    const fallbackId = parsed.data.serverId === "s1" ? "s1_long_vuong"
      : parsed.data.serverId === "s2" ? "s2_hac_am"
      : parsed.data.serverId === "s3" ? "s3_thien_phat"
      : parsed.data.serverId === "s4" ? "s4_huyet_nguyet" : parsed.data.serverId;
    [server] = await db.select().from(serversTable).where(eq(serversTable.id, fallbackId)).limit(1);
  }

  const region = server ? server.region : parsed.data.region;
  const serverId = server ? server.id : parsed.data.serverId;

  const updateData: any = {
    selectedRegion: region,
    selectedServerId: serverId,
  };
  if (parsed.data.lastCharacterId) {
    updateData.lastCharacterId = parsed.data.lastCharacterId;
  }

  const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, req.session.userId!)).returning();
  if (!user) return res.status(401).json({ error: "Tài khoản không còn tồn tại" });

  return res.status(200).json({
    selectedRegion: user.selectedRegion,
    selectedServerId: user.selectedServerId,
    lastCharacterId: user.lastCharacterId ?? null,
  });
};

router.post("/auth/server", requireAuth, handleSetServer);
router.post("/users/me/server", requireAuth, handleSetServer);
router.patch("/users/me/server", requireAuth, handleSetServer);
router.patch("/api/users/me/server", requireAuth, handleSetServer);

export function getDeterministicUserId(username: string): number {
  let hash = 0;
  const clean = username.trim().toLowerCase();
  for (let i = 0; i < clean.length; i++) {
    hash = ((hash << 5) - hash) + clean.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 2000000000) + 1;
}

router.post("/auth/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Tên đăng nhập và mật khẩu không hợp lệ" });
  }

  const { username, password } = parsed.data;
  const cleanUsername = username.trim();

  let [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, cleanUsername))
    .limit(1);

  if (user) {
    if (!isPostgres) {
      // In serverless standalone mode, gracefully log in and refresh password
      const passwordHash = await bcrypt.hash(password, 10);
      await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, user.id));
    } else {
      return res.status(409).json({ error: "Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác." });
    }
  } else {
    const userId = getDeterministicUserId(cleanUsername);
    const passwordHash = await bcrypt.hash(password, 10);
    const [inserted] = await db
      .insert(usersTable)
      .values({
        id: userId,
        username: cleanUsername,
        passwordHash,
        role: "player",
        isRealUser: true,
        selectedRegion: "VN",
        selectedServerId: "s1_long_vuong",
      })
      .returning();
    user = inserted;
  }

  if (req.session) {
    req.session.userId = user.id;
  }

  const token = signToken({
    id: user.id,
    username: user.username,
    role: user.role || "player",
    isAdmin: user.role === "admin",
    selectedRegion: user.selectedRegion || "VN",
    selectedServerId: user.selectedServerId || "s1_long_vuong",
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
      role: user.role || "player",
      isRealUser: user.isRealUser ?? true,
      createdAt: user.createdAt,
      selectedRegion: user.selectedRegion,
      selectedServerId: user.selectedServerId,
      lastCharacterId: user.lastCharacterId ?? null,
    },
  });
});

router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Dữ liệu không hợp lệ" });
  }

  const { username, password } = parsed.data;
  const cleanUsername = username.trim();

  let [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, cleanUsername))
    .limit(1);

  if (!user) {
    if (!isPostgres) {
      // Auto-provision user with deterministic ID so user ID is 100% consistent across all lambdas
      const userId = getDeterministicUserId(cleanUsername);
      const passwordHash = await bcrypt.hash(password, 10);
      const [inserted] = await db
        .insert(usersTable)
        .values({
          id: userId,
          username: cleanUsername,
          passwordHash,
          selectedRegion: "VN",
          selectedServerId: "s1_long_vuong",
        })
        .returning();
      user = inserted;
    } else {
      return res.status(401).json({ error: "Tên đăng nhập hoặc mật khẩu không chính xác." });
    }
  } else {
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      if (!isPostgres) {
        // Sync password in memory mode so user is never locked out
        const passwordHash = await bcrypt.hash(password, 10);
        await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, user.id));
      } else {
        return res.status(401).json({ error: "Tên đăng nhập hoặc mật khẩu không chính xác." });
      }
    }
  }

  if (req.session) {
    req.session.userId = user.id;
  }

  const token = signToken({
    id: user.id,
    username: user.username,
    role: user.role || "player",
    isAdmin: user.role === "admin",
    selectedRegion: user.selectedRegion || "VN",
    selectedServerId: user.selectedServerId || "s1_long_vuong",
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
      role: user.role || "player",
      isRealUser: user.isRealUser ?? true,
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

const handleGetMe = async (req: any, res: any) => {
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
    lastCharacterId: user.lastCharacterId ?? null,
  });
};

router.get("/auth/me", handleGetMe);
router.get("/users/me", handleGetMe);
router.get("/api/users/me", handleGetMe);

const handleResetAllAccounts = async (_req: any, res: any) => {
  try {
    await wipeAllAccountsAndUserData();
    return res.status(200).json({
      success: true,
      message: "Đã xóa toàn bộ tài khoản cũ và đưa dữ liệu máy chủ về trạng thái ban đầu sạch sẽ.",
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Lỗi khi xóa tài khoản",
    });
  }
};

router.post("/auth/reset-all-accounts", handleResetAllAccounts);
router.post("/admin/reset-database", handleResetAllAccounts);
router.post("/api/auth/reset-all-accounts", handleResetAllAccounts);
router.post("/api/admin/reset-database", handleResetAllAccounts);

export default router;
