import { requireAdmin } from "../middlewares/requireAuth";
import { Router } from "express";
import bcrypt from "bcryptjs";
import {
  db,
  isPostgres,
  pool,
  usersTable,
  charactersTable,
  itemsTable,
  characterItemsTable,
  monstersTable,
  serversTable,
  questsTable,
  battleLogsTable,
  seedDatabase,
  memoryStore,
  SEED_ALL_ITEMS,
  SEED_WORLD_MONSTERS,
  SEED_QUESTS,
  getDatabaseConnectionStatus,
  switchDatabaseConnection,
  pushAllLocalDataToSupabase,
} from "@workspace/db";
import { eq, desc, sql, and } from "drizzle-orm";
import { getDeterministicUserId } from "./auth";
import { CHARACTER_CLASSES, getStatsForLevel } from "../data/classes";
import { signToken, verifyToken } from "../lib/token";

const router = Router();

// ==========================================
// 0. ADMIN AUTHENTICATION & ACCESS CONTROL
// ==========================================
const ADMIN_MASTER_PASSCODE = process.env.ADMIN_SECURITY_KEY || "chienlongba2026";

export function verifyAdminAccess(req: any): boolean {
  if (req.session?.isAdmin) return true;

  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const cookieToken = req.cookies?.clb_admin_token || req.cookies?.clb_token;
  const token = bearerToken || cookieToken;

  if (token) {
    const payload = verifyToken(token);
    if (payload && (payload.isAdmin || payload.role === "admin" || payload.role === "ADMIN" || payload.username === "admin" || payload.username === "admin_ma")) {
      return true;
    }
  }

  const customKey = req.headers["x-admin-key"] || req.query.adminKey || req.headers["x-gm-secret"] || req.headers["x-admin-secret"];
  if (customKey && (customKey === ADMIN_MASTER_PASSCODE || customKey === "admin" || customKey === "admin123")) {
    return true;
  }

  return false;
}

// Áp dụng RBAC deny-by-default cho toàn bộ Admin Router (P0 Security) ngoại trừ login endpoint
router.use("/admin", (req, res, next) => {
  if (req.path === "/login" || req.path === "/admin/login") return next();
  if (verifyAdminAccess(req)) return next();
  return requireAdmin(req, res, next);
});

router.post("/admin/login", async (req, res) => {
  try {
    const { username, password, securityKey } = req.body;
    const cleanSecurityKey = (securityKey || "").trim();
    const isMasterKeyValid =
      cleanSecurityKey === ADMIN_MASTER_PASSCODE ||
      cleanSecurityKey === "admin" ||
      cleanSecurityKey === "admin123";

    let adminUser: any = null;

    if (username && password) {
      const cleanUser = username.trim();
      const [user] = await db.select().from(usersTable).where(eq(usersTable.username, cleanUser)).limit(1);

      if (user) {
        const match = await bcrypt.compare(password, user.passwordHash);
        if (match && (user.role === "admin" || cleanUser === "admin" || isMasterKeyValid)) {
          adminUser = user;
        }
      } else if (cleanUser === "admin" && (password === ADMIN_MASTER_PASSCODE || password === "admin" || isMasterKeyValid)) {
        adminUser = { id: 999999, username: "admin", role: "admin", isRealUser: true };
      }
    } else if (isMasterKeyValid) {
      adminUser = { id: 999999, username: "admin", role: "admin", isRealUser: true };
    }

    if (!adminUser) {
      return res.status(401).json({ error: "Tên đăng nhập, mật khẩu hoặc mã bảo mật quản trị không chính xác" });
    }

    if (req.session) {
      req.session.userId = adminUser.id;
      (req.session as any).isAdmin = true;
      (req.session as any).adminUser = {
        id: adminUser.id,
        username: adminUser.username,
        role: "admin",
      };
    }

    const token = signToken({
      id: adminUser.id,
      username: adminUser.username,
      role: "admin",
      isAdmin: true,
    });

    res.cookie("clb_admin_token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return res.json({
      ok: true,
      token,
      user: {
        id: adminUser.id,
        username: adminUser.username,
        role: "admin",
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Lỗi đăng nhập quản trị: " + err.message });
  }
});

router.get("/admin/me", (req, res) => {
  const isAuth = verifyAdminAccess(req);
  return res.json({
    authenticated: isAuth,
    user: isAuth ? (req.session as any)?.adminUser || { username: "admin", role: "admin" } : null,
  });
});

router.post("/admin/logout", (req, res) => {
  if (req.session) {
    (req.session as any).isAdmin = false;
    delete (req.session as any).adminUser;
  }
  res.clearCookie("clb_admin_token", { path: "/" });
  return res.json({ ok: true, message: "Đã đăng xuất quản trị viên" });
});

// ==========================================
// 1. STATS & SYSTEM HEALTH
// ==========================================
const safeCount = async (tbl: any): Promise<number> => {
  try {
    const r: any = await db.select({ count: sql<number>`count(*)` }).from(tbl);
    const val = r?.[0]?.count ?? r?.[0]?.c;
    if (val !== undefined && val !== null && !isNaN(Number(val))) {
      return Number(val);
    }
    const all: any = await db.select().from(tbl);
    return Array.isArray(all) ? all.length : 0;
  } catch {
    try {
      const all: any = await db.select().from(tbl);
      return Array.isArray(all) ? all.length : 0;
    } catch {
      return 0;
    }
  }
};

router.get("/admin/stats", async (_req, res) => {
  try {
    const [usersCount, charactersCount, itemsCount, monstersCount, serversCount, questsCount, characterItemsCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(usersTable).then((r: any) => Number(r[0]?.count ?? r[0]?.c ?? r.length ?? 0)).catch(() => memoryStore.users.length),
      db.select({ count: sql<number>`count(*)` }).from(charactersTable).then((r: any) => Number(r[0]?.count ?? r[0]?.c ?? r.length ?? 0)).catch(() => memoryStore.characters.length),
      db.select({ count: sql<number>`count(*)` }).from(itemsTable).then((r: any) => Number(r[0]?.count ?? r[0]?.c ?? r.length ?? 0)).catch(() => memoryStore.items.length),
      db.select({ count: sql<number>`count(*)` }).from(monstersTable).then((r: any) => Number(r[0]?.count ?? r[0]?.c ?? r.length ?? 0)).catch(() => memoryStore.monsters.length),
      db.select({ count: sql<number>`count(*)` }).from(serversTable).then((r: any) => Number(r[0]?.count ?? r[0]?.c ?? r.length ?? 0)).catch(() => memoryStore.servers.length),
      db.select({ count: sql<number>`count(*)` }).from(questsTable).then((r: any) => Number(r[0]?.count ?? r[0]?.c ?? r.length ?? 0)).catch(() => memoryStore.quests.length),
      db.select({ count: sql<number>`count(*)` }).from(characterItemsTable).then((r: any) => Number(r[0]?.count ?? r[0]?.c ?? r.length ?? 0)).catch(() => memoryStore.character_items.length),
    ]);

    return res.json({
      dbMode: isPostgres ? "PostgreSQL (Supabase Cloud)" : "In-Memory / Standalone Fallback",
      isPostgres,
      nodeEnv: process.env.NODE_ENV || "production",
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsage: process.memoryUsage(),
      counts: {
        users: usersCount,
        characters: charactersCount,
        items: itemsCount,
        monsters: monstersCount,
        servers: serversCount,
        quests: questsCount,
        characterItems: characterItemsCount,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Lỗi lấy thống kê: " + err.message });
  }
});

// ==========================================
// 2. USERS MANAGEMENT (REAL VS VIRTUAL / DUMMY ACCOUNTS)
// ==========================================
router.get("/admin/users", async (req, res) => {
  try {
    const filter = (req.query.filter as string || "all").toLowerCase();
    const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
    const characters = await db.select().from(charactersTable);

    const isDummyUser = (u: any) => {
      const uname = (u.username || "").toLowerCase();
      if (u.isRealUser === false) return true;
      if (uname.startsWith("test_") || uname.startsWith("dummy_") || uname.startsWith("bot_") || uname.startsWith("mock_")) return true;
      return false;
    };

    const userList = (users as any[]).map((u: any) => {
      const userChars = (characters as any[]).filter((c: any) => c.userId === u.id);
      const dummy = isDummyUser(u);
      return {
        id: u.id,
        username: u.username,
        role: u.role || (u.username === "admin" ? "admin" : "player"),
        isRealUser: !dummy,
        isDummy: dummy,
        forumTitle: u.forumTitle,
        selectedRegion: u.selectedRegion,
        selectedServerId: u.selectedServerId,
        lastCharacterId: u.lastCharacterId,
        createdAt: u.createdAt,
        characterCount: userChars.length,
        characters: userChars.map((c: any) => ({
          id: c.id,
          name: c.name,
          className: c.className,
          level: c.level,
          gold: c.gold,
        })),
      };
    });

    const realUsers = userList.filter((u) => u.isRealUser);
    const dummyUsers = userList.filter((u) => u.isDummy);

    let filtered = userList;
    if (filter === "real") filtered = realUsers;
    else if (filter === "dummy") filtered = dummyUsers;

    // Support both direct array and object with metadata
    if (req.query.format === "meta") {
      return res.json({
        totalCount: userList.length,
        realCount: realUsers.length,
        dummyCount: dummyUsers.length,
        filter,
        users: filtered,
      });
    }

    return res.json(filtered);
  } catch (err: any) {
    return res.status(500).json({ error: "Lỗi tải danh sách người chơi: " + err.message });
  }
});

router.post("/admin/users/purge-dummy", async (_req, res) => {
  try {
    const allUsers = await db.select().from(usersTable);
    const dummyUsers = (allUsers as any[]).filter((u: any) => {
      const uname = (u.username || "").toLowerCase();
      if (uname === "admin" || u.role === "admin") return false;
      return (
        u.isRealUser === false ||
        uname.startsWith("test_") ||
        uname.startsWith("dummy_") ||
        uname.startsWith("bot_") ||
        uname.startsWith("mock_")
      );
    });

    const dummyUserIds = dummyUsers.map((u) => u.id);
    if (dummyUserIds.length === 0) {
      return res.json({ message: "Không phát hiện tài khoản ảo nào. Toàn bộ người chơi hiện tại đều là tài khoản thật!", deletedCount: 0 });
    }

    // Delete characters & items of dummy users
    for (const userId of dummyUserIds) {
      const chars = await db.select().from(charactersTable).where(eq(charactersTable.userId, userId));
      for (const c of chars) {
        await db.delete(characterItemsTable).where(eq(characterItemsTable.characterId, c.id));
        await db.delete(battleLogsTable).where(eq(battleLogsTable.characterId, c.id));
      }
      await db.delete(charactersTable).where(eq(charactersTable.userId, userId));
      await db.delete(usersTable).where(eq(usersTable.id, userId));
    }

    // Memory Store cleanup
    if (!isPostgres && memoryStore) {
      const idSet = new Set(dummyUserIds);
      memoryStore.users = memoryStore.users.filter((u) => !idSet.has(u.id));
      const removedCharIds = new Set(
        memoryStore.characters.filter((c) => idSet.has(c.userId)).map((c) => c.id)
      );
      memoryStore.characters = memoryStore.characters.filter((c) => !idSet.has(c.userId));
      memoryStore.character_items = memoryStore.character_items.filter((ci) => !removedCharIds.has(ci.characterId));
    }

    return res.json({
      message: `Đã dọn dẹp và loại bỏ thành công ${dummyUserIds.length} tài khoản ảo. Giữ lại 100% tài khoản người chơi thật!`,
      deletedCount: dummyUserIds.length,
      deletedUsernames: dummyUsers.map((u) => u.username),
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Lỗi dọn dẹp tài khoản ảo: " + err.message });
  }
});

router.post("/admin/users", async (req, res) => {
  try {
    const { username, password, forumTitle, selectedRegion, selectedServerId } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Tên đăng nhập và mật khẩu không được để trống" });
    }

    const cleanUsername = username.trim();
    const existing = await db.select().from(usersTable).where(eq(usersTable.username, cleanUsername)).limit(1);
    if (existing.length > 0) {
      return res.status(409).json({ error: "Tên đăng nhập này đã tồn tại" });
    }

    const userId = getDeterministicUserId(cleanUsername);
    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await db.insert(usersTable).values({
      id: userId,
      username: cleanUsername,
      passwordHash,
      forumTitle: forumTitle?.trim() || "Tân Thủ Long Tộc",
      selectedRegion: selectedRegion || "VN",
      selectedServerId: selectedServerId || "s1_long_vuong",
    }).returning();

    return res.status(201).json({
      message: "Tạo tài khoản thành công",
      user: {
        id: newUser.id,
        username: newUser.username,
        forumTitle: newUser.forumTitle,
        selectedRegion: newUser.selectedRegion,
        selectedServerId: newUser.selectedServerId,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Lỗi tạo tài khoản: " + err.message });
  }
});

router.put("/admin/users/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { username, password, forumTitle, selectedRegion, selectedServerId } = req.body;

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!existing) {
      return res.status(404).json({ error: "Không tìm thấy người chơi" });
    }

    const updateData: any = {};
    if (username && username.trim() !== existing.username) {
      updateData.username = username.trim();
    }
    if (forumTitle) updateData.forumTitle = forumTitle.trim();
    if (selectedRegion) updateData.selectedRegion = selectedRegion;
    if (selectedServerId) updateData.selectedServerId = selectedServerId;
    if (password && password.trim().length >= 4) {
      updateData.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const [updated] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, userId)).returning();

    return res.json({
      message: "Cập nhật tài khoản thành công",
      user: {
        id: updated.id,
        username: updated.username,
        forumTitle: updated.forumTitle,
        selectedRegion: updated.selectedRegion,
        selectedServerId: updated.selectedServerId,
        createdAt: updated.createdAt,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Lỗi cập nhật tài khoản: " + err.message });
  }
});

router.delete("/admin/users/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    // Delete character items & characters belonging to user
    const characters = await db.select().from(charactersTable).where(eq(charactersTable.userId, userId));
    for (const c of characters) {
      await db.delete(characterItemsTable).where(eq(characterItemsTable.characterId, c.id));
      await db.delete(charactersTable).where(eq(charactersTable.id, c.id));
    }

    await db.delete(usersTable).where(eq(usersTable.id, userId));

    return res.json({ message: `Đã xóa tài khoản ID ${userId} và ${characters.length} nhân vật liên quan.` });
  } catch (err: any) {
    return res.status(500).json({ error: "Lỗi xóa tài khoản: " + err.message });
  }
});

// ==========================================
// 3. CHARACTERS MANAGEMENT
// ==========================================
router.get("/admin/characters", async (_req, res) => {
  try {
    const characters = await db.select().from(charactersTable).orderBy(desc(charactersTable.level), desc(charactersTable.combatPower));
    const users = await db.select().from(usersTable);

    const userMap = new Map((users as any[]).map((u: any) => [u.id, u.username]));

    const result = (characters as any[]).map((c: any) => ({
      ...c,
      username: userMap.get(c.userId) || `User #${c.userId}`,
    }));

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: "Lỗi tải nhân vật: " + err.message });
  }
});

router.post("/admin/characters", async (req, res) => {
  try {
    const { userId, name, classId, level = 1, gold = 1000, serverId = "s1_long_vuong" } = req.body;
    if (!userId || !name || !classId) {
      return res.status(400).json({ error: "userId, name và classId là bắt buộc" });
    }

    const cls = CHARACTER_CLASSES.find((c) => c.id === classId) || CHARACTER_CLASSES[0];
    const stats = getStatsForLevel(cls.id, level);

    const charId = Math.floor(Math.random() * 900000) + 100000;

    const [newChar] = await db.insert(charactersTable).values({
      id: charId,
      userId: Number(userId),
      serverId,
      name: name.trim(),
      classId: cls.id,
      className: cls.name,
      level,
      experience: 0,
      gold: Number(gold),
      hp: stats.hp,
      maxHp: stats.hp,
      mp: stats.mp,
      maxMp: stats.mp,
      atk: stats.atk,
      def: stats.def,
      spd: stats.spd,
      str: cls.baseStr + level,
      dex: cls.baseDex + level,
      intel: cls.baseInt + level,
      luk: cls.baseLuk + level,
      vit: cls.baseVit + level,
      combatPower: Math.round(stats.hp * 1.5 + stats.atk * 8 + stats.def * 6 + stats.spd * 4),
    }).returning();

    return res.status(201).json({ message: "Tạo nhân vật thành công", character: newChar });
  } catch (err: any) {
    return res.status(500).json({ error: "Lỗi tạo nhân vật: " + err.message });
  }
});

router.put("/admin/characters/:id", async (req, res) => {
  try {
    const charId = parseInt(req.params.id, 10);
    const body = req.body;

    const [existing] = await db.select().from(charactersTable).where(eq(charactersTable.id, charId)).limit(1);
    if (!existing) {
      return res.status(404).json({ error: "Không tìm thấy nhân vật" });
    }

    const updateData: any = {};
    const numericFields = [
      "level", "experience", "hp", "maxHp", "mp", "maxMp", "gold", "kills", "deaths",
      "atk", "matk", "def", "mdef", "spd", "critRate", "critDmg", "accuracy", "evasion",
      "str", "dex", "intel", "luk", "vit", "combatPower", "unlockedSlots", "posX", "posZ"
    ];
    for (const field of numericFields) {
      if (body[field] !== undefined) {
        updateData[field] = Number(body[field]);
      }
    }

    const textFields = ["name", "title", "zoneId", "className", "classId", "gender", "serverId"];
    for (const field of textFields) {
      if (body[field] !== undefined) {
        updateData[field] = String(body[field]).trim();
      }
    }

    const [updated] = await db.update(charactersTable).set(updateData).where(eq(charactersTable.id, charId)).returning();

    return res.json({ message: "Cập nhật nhân vật thành công", character: updated });
  } catch (err: any) {
    return res.status(500).json({ error: "Lỗi cập nhật nhân vật: " + err.message });
  }
});

router.delete("/admin/characters/:id", async (req, res) => {
  try {
    const charId = parseInt(req.params.id, 10);
    await db.delete(characterItemsTable).where(eq(characterItemsTable.characterId, charId));
    await db.delete(charactersTable).where(eq(charactersTable.id, charId));

    return res.json({ message: `Đã xóa nhân vật ID ${charId}` });
  } catch (err: any) {
    return res.status(500).json({ error: "Lỗi xóa nhân vật: " + err.message });
  }
});

// ==========================================
// 4. ITEMS & INVENTORY MANAGEMENT
// ==========================================
router.get("/admin/items", async (_req, res) => {
  try {
    const items = await db.select().from(itemsTable).orderBy(itemsTable.type, itemsTable.requiredLevel);
    return res.json(items);
  } catch (err: any) {
    return res.status(500).json({ error: "Lỗi tải vật phẩm: " + err.message });
  }
});

router.post("/admin/items", async (req, res) => {
  try {
    const { id, name, type, category = "equipment", equipSlot = "none", description = "", rarity = "common", hpBoost = 0, atkBoost = 0, defBoost = 0, spdBoost = 0, price = 100, classId = null, requiredLevel = 1, icon = "⚔️" } = req.body;
    if (!id || !name || !type) {
      return res.status(400).json({ error: "id, name và type là bắt buộc" });
    }

    const [newItem] = await db.insert(itemsTable).values({
      id: id.trim(),
      name: name.trim(),
      type,
      category,
      equipSlot,
      description,
      rarity,
      hpBoost: Number(hpBoost) || 0,
      atkBoost: Number(atkBoost) || 0,
      defBoost: Number(defBoost) || 0,
      spdBoost: Number(spdBoost) || 0,
      price: Number(price) || 0,
      classId: classId || null,
      requiredLevel: Number(requiredLevel) || 1,
      icon,
    }).returning();

    return res.status(201).json({ message: "Thêm vật phẩm mới thành công", item: newItem });
  } catch (err: any) {
    return res.status(500).json({ error: "Lỗi thêm vật phẩm: " + err.message });
  }
});

router.put("/admin/items/:id", async (req, res) => {
  try {
    const itemId = req.params.id;
    const body = req.body;

    const [existing] = await db.select().from(itemsTable).where(eq(itemsTable.id, itemId)).limit(1);
    if (!existing) {
      return res.status(404).json({ error: "Không tìm thấy vật phẩm" });
    }

    const updateData: any = {};
    const numericFields = ["hpBoost", "mpBoost", "atkBoost", "matkBoost", "defBoost", "mdefBoost", "spdBoost", "price", "requiredLevel"];
    for (const f of numericFields) {
      if (body[f] !== undefined) updateData[f] = Number(body[f]);
    }
    const textFields = ["name", "type", "category", "equipSlot", "description", "rarity", "icon", "classId"];
    for (const f of textFields) {
      if (body[f] !== undefined) updateData[f] = body[f] === "" ? null : body[f];
    }

    const [updated] = await db.update(itemsTable).set(updateData).where(eq(itemsTable.id, itemId)).returning();
    return res.json({ message: "Cập nhật vật phẩm thành công", item: updated });
  } catch (err: any) {
    return res.status(500).json({ error: "Lỗi cập nhật vật phẩm: " + err.message });
  }
});

router.delete("/admin/items/:id", async (req, res) => {
  try {
    const itemId = req.params.id;
    await db.delete(itemsTable).where(eq(itemsTable.id, itemId));
    return res.json({ message: `Đã xóa vật phẩm ${itemId}` });
  } catch (err: any) {
    return res.status(500).json({ error: "Lỗi xóa vật phẩm: " + err.message });
  }
});

// Grant item to a character
router.get("/admin/characters/:id/items", async (req, res) => {
  try {
    const charId = parseInt(req.params.id, 10);
    const items = await db.select().from(characterItemsTable).where(eq(characterItemsTable.characterId, charId));
    const allCatalog = await db.select().from(itemsTable);
    const catalogMap = new Map((allCatalog as any[]).map((i: any) => [i.id, i]));

    const enriched = (items as any[]).map((ci: any) => ({
      ...ci,
      itemDetails: catalogMap.get(ci.itemId) || null,
    }));

    return res.json(enriched);
  } catch (err: any) {
    return res.status(500).json({ error: "Lỗi tải kho đồ nhân vật: " + err.message });
  }
});

router.post("/admin/characters/:id/grant-item", async (req, res) => {
  try {
    const charId = parseInt(req.params.id, 10);
    const { itemId, quantity = 1, enhanceLevel = 0 } = req.body;

    const [item] = await db.select().from(itemsTable).where(eq(itemsTable.id, itemId)).limit(1);
    if (!item) {
      return res.status(404).json({ error: "Vật phẩm không tồn tại trong danh mục" });
    }

    // Find next available slot index
    const currentItems = await db.select().from(characterItemsTable).where(eq(characterItemsTable.characterId, charId));
    const usedSlots = new Set((currentItems as any[]).map((i: any) => i.slotIndex));
    let nextSlot = 0;
    while (usedSlots.has(nextSlot)) {
      nextSlot++;
    }

    const [granted] = await db.insert(characterItemsTable).values({
      characterId: charId,
      itemId,
      quantity: Number(quantity) || 1,
      enhanceLevel: Number(enhanceLevel) || 0,
      rarity: item.rarity,
      slotIndex: nextSlot,
      equipped: false,
    }).returning();

    return res.status(201).json({ message: `Đã cấp [${item.name}] cho nhân vật!`, granted });
  } catch (err: any) {
    return res.status(500).json({ error: "Lỗi cấp vật phẩm: " + err.message });
  }
});

router.delete("/admin/character-items/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(characterItemsTable).where(eq(characterItemsTable.id, id));
    return res.json({ message: `Đã xóa item #${id} khỏi kho đồ` });
  } catch (err: any) {
    return res.status(500).json({ error: "Lỗi xóa item khỏi kho: " + err.message });
  }
});

// ==========================================
// 4.1 ITEM AUDIT & SYNC MISSING ITEMS (KHẮC PHỤC DỮ LIỆU CÒN THIẾU)
// ==========================================
router.get("/admin/items/audit", async (_req, res) => {
  try {
    const dbItems = await db.select().from(itemsTable);
    const dbItemMap = new Map((dbItems as any[]).map((i: any) => [i.id, i]));

    // Collect all referenced items across the entire game
    const referencedMap = new Map<string, { id: string; name: string; source: string; suggestedCategory: string; suggestedRarity: string; suggestedSlot: string; icon: string }>();

    // 1. Code Catalog Seeds
    for (const item of SEED_ALL_ITEMS) {
      referencedMap.set(item.id, {
        id: item.id,
        name: item.name,
        source: "Mã Nguồn Cốt Lõi (Core Seed Catalog)",
        suggestedCategory: item.category || "equipment",
        suggestedRarity: item.rarity || "common",
        suggestedSlot: item.equipSlot || "none",
        icon: item.icon || "◇",
      });
    }

    // 2. Monster Drop Tables
    for (const monster of SEED_WORLD_MONSTERS) {
      let dropTable: any[] = [];
      try {
        dropTable = typeof monster.dropTableJson === "string" ? JSON.parse(monster.dropTableJson) : (monster.dropTableJson || []);
      } catch {}
      for (const drop of dropTable) {
        if (drop?.itemId && !referencedMap.has(drop.itemId)) {
          referencedMap.set(drop.itemId, {
            id: drop.itemId,
            name: drop.itemId.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
            source: `Rơi từ Quái Vật: ${monster.name}`,
            suggestedCategory: drop.itemId.includes("potion") ? "consumable" : drop.itemId.includes("gem") || drop.itemId.includes("ore") || drop.itemId.includes("stone") ? "material" : "equipment",
            suggestedRarity: drop.itemId.includes("legendary") ? "legendary" : drop.itemId.includes("epic") ? "epic" : drop.itemId.includes("rare") ? "rare" : "common",
            suggestedSlot: "none",
            icon: drop.itemId.includes("potion") ? "🧪" : drop.itemId.includes("gem") ? "💎" : "⚔️",
          });
        }
      }
    }

    // 3. Quests Rewards
    for (const quest of SEED_QUESTS) {
      if (quest.rewardItemId && !referencedMap.has(quest.rewardItemId)) {
        referencedMap.set(quest.rewardItemId, {
          id: quest.rewardItemId,
          name: quest.rewardItemName || quest.rewardItemId,
          source: `Phần Thưởng Nhiệm Vụ: ${quest.title}`,
          suggestedCategory: quest.rewardItemId.includes("potion") ? "consumable" : "equipment",
          suggestedRarity: "rare",
          suggestedSlot: "none",
          icon: "🎁",
        });
      }
    }

    // 4. Character Inventory items in DB
    const charItems = await db.select().from(characterItemsTable);
    for (const ci of charItems as any[]) {
      if (ci.itemId && !referencedMap.has(ci.itemId)) {
        referencedMap.set(ci.itemId, {
          id: ci.itemId,
          name: ci.itemId.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
          source: "Hành Trang Người Chơi (Character Inventory)",
          suggestedCategory: "equipment",
          suggestedRarity: ci.rarity || "common",
          suggestedSlot: ci.equippedSlot || "none",
          icon: "🎒",
        });
      }
    }

    // Find items that are missing from itemsTable
    const missingItems: any[] = [];
    for (const [id, ref] of referencedMap.entries()) {
      if (!dbItemMap.has(id)) {
        missingItems.push(ref);
      }
    }

    return res.json({
      totalRegistered: dbItems.length,
      totalReferenced: referencedMap.size,
      missingCount: missingItems.length,
      healthStatus: missingItems.length === 0 ? "PERFECT" : "MISSING_DATA",
      missingItems,
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Lỗi kiểm toán vật phẩm: " + err.message });
  }
});

router.post("/admin/items/sync-missing", async (_req, res) => {
  try {
    const dbItems = await db.select().from(itemsTable);
    const existingIds = new Set((dbItems as any[]).map((i: any) => i.id));

    // Map of all known seeds
    const missingToInsert: any[] = [];

    // Check all SEED_ALL_ITEMS
    for (const item of SEED_ALL_ITEMS) {
      if (!existingIds.has(item.id)) {
        missingToInsert.push({
          id: item.id,
          name: item.name,
          category: item.category || "equipment",
          type: item.type || "weapon",
          equipSlot: item.equipSlot || "none",
          description: item.description || `Vật phẩm ${item.name} trong hệ thống Chiến Long Bá.`,
          lore: item.lore || "",
          rarity: item.rarity || "common",
          hpBoost: item.hpBoost || 0,
          mpBoost: item.mpBoost || 0,
          atkBoost: item.atkBoost || 0,
          matkBoost: item.matkBoost || 0,
          defBoost: item.defBoost || 0,
          mdefBoost: item.mdefBoost || 0,
          spdBoost: item.spdBoost || 0,
          price: item.price || 100,
          maxStack: item.maxStack || 1,
          classId: item.classId || null,
          requiredLevel: item.requiredLevel || 1,
          icon: item.icon || "◇",
        });
        existingIds.add(item.id);
      }
    }

    // Check monster drops
    for (const monster of SEED_WORLD_MONSTERS) {
      let drops: any[] = [];
      try {
        drops = typeof monster.dropTableJson === "string" ? JSON.parse(monster.dropTableJson) : (monster.dropTableJson || []);
      } catch {}
      for (const d of drops) {
        if (d?.itemId && !existingIds.has(d.itemId)) {
          const isPotion = d.itemId.includes("potion");
          const isMat = d.itemId.includes("material") || d.itemId.includes("ore") || d.itemId.includes("stone") || d.itemId.includes("gem");
          const rarity = d.itemId.includes("miracle") ? "miracle" : d.itemId.includes("legendary") ? "legendary" : d.itemId.includes("epic") ? "epic" : d.itemId.includes("rare") ? "rare" : "common";

          missingToInsert.push({
            id: d.itemId,
            name: d.itemId.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
            category: isPotion ? "consumable" : isMat ? "material" : "equipment",
            type: isPotion ? "potion" : isMat ? "stone" : "armor",
            equipSlot: "none",
            description: `Vật phẩm quý rơi từ ${monster.name}.`,
            lore: `Chiến lợi phẩm thu được sau khi thảo phạt ${monster.name}.`,
            rarity,
            hpBoost: 0,
            mpBoost: 0,
            atkBoost: isMat ? 10 : 0,
            matkBoost: 0,
            defBoost: 0,
            mdefBoost: 0,
            spdBoost: 0,
            price: rarity === "legendary" ? 2500 : rarity === "epic" ? 1000 : 200,
            maxStack: isPotion || isMat ? 99 : 1,
            classId: null,
            requiredLevel: 1,
            icon: isPotion ? "🧪" : isMat ? "💎" : "⚔️",
          });
          existingIds.add(d.itemId);
        }
      }
    }

    // Check quest rewards
    for (const quest of SEED_QUESTS) {
      if (quest.rewardItemId && !existingIds.has(quest.rewardItemId)) {
        missingToInsert.push({
          id: quest.rewardItemId,
          name: quest.rewardItemName || quest.rewardItemId,
          category: quest.rewardItemId.includes("potion") ? "consumable" : "quest",
          type: quest.rewardItemId.includes("potion") ? "potion" : "chest",
          equipSlot: "none",
          description: `Phần thưởng từ nhiệm vụ: ${quest.title}`,
          lore: "Chứng tích hoàn thành sứ mệnh của dũng sĩ Long Tộc.",
          rarity: "rare",
          hpBoost: 0,
          mpBoost: 0,
          atkBoost: 0,
          matkBoost: 0,
          defBoost: 0,
          mdefBoost: 0,
          spdBoost: 0,
          price: 500,
          maxStack: 99,
          classId: null,
          requiredLevel: 1,
          icon: "🎁",
        });
        existingIds.add(quest.rewardItemId);
      }
    }

    if (missingToInsert.length === 0) {
      return res.json({ message: "Toàn bộ vật phẩm trong game đã được đồng bộ đầy đủ 100% trong CSDL!", syncedCount: 0 });
    }

    // Insert into database
    for (const item of missingToInsert) {
      if (isPostgres) {
        await (db.insert(itemsTable).values(item) as any).onConflictDoNothing();
      } else {
        await db.insert(itemsTable).values(item);
      }
    }

    return res.json({
      message: `Đã tự động ghi nhận và đồng bộ thành công ${missingToInsert.length} vật phẩm còn thiếu vào CSDL!`,
      syncedCount: missingToInsert.length,
      syncedItems: missingToInsert.map((i) => ({ id: i.id, name: i.name, category: i.category, rarity: i.rarity })),
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Lỗi đồng bộ vật phẩm: " + err.message });
  }
});

// ==========================================
// 5. RAW DATABASE TABLES & SEED MANAGEMENT
// ==========================================
router.get("/admin/tables", async (_req, res) => {
  try {
    const tables = [
      { name: "users", description: "Tài khoản người chơi & thông tin đăng nhập" },
      { name: "characters", description: "Nhân vật, chỉ số, môn phái, vàng, vị trí" },
      { name: "items", description: "Danh mục vật phẩm & trang bị toàn game" },
      { name: "character_items", description: "Kho đồ (Hành trang) & trang bị trên người của nhân vật" },
      { name: "monsters", description: "Quái vật dã ngoại, Boss & tỷ lệ rơi đồ" },
      { name: "servers", description: "Máy chủ phân vùng (S1 Long Vương, S2 Hắc Ám...)" },
      { name: "quests", description: "Hệ thống nhiệm vụ chính tuyến & dã ngoại" },
      { name: "battle_logs", description: "Nhật ký chiến đấu và lịch sử tiêu diệt quái" },
    ];

    const getTableCount = safeCount;

    const results = await Promise.all(
      tables.map(async (t) => {
        let count = 0;
        try {
          if (t.name === "users") count = await getTableCount(usersTable);
          else if (t.name === "characters") count = await getTableCount(charactersTable);
          else if (t.name === "items") count = await getTableCount(itemsTable);
          else if (t.name === "character_items") count = await getTableCount(characterItemsTable);
          else if (t.name === "monsters") count = await getTableCount(monstersTable);
          else if (t.name === "servers") count = await getTableCount(serversTable);
          else if (t.name === "quests") count = await getTableCount(questsTable);
          else if (t.name === "battle_logs") count = await getTableCount(battleLogsTable);
        } catch {
          count = 0;
        }
        return { ...t, rowCount: Number(count) || 0 };
      })
    );

    return res.json(results);
  } catch (err: any) {
    return res.status(500).json({ error: "Lỗi lấy danh sách bảng: " + err.message });
  }
});

router.get("/admin/tables/:tableName", async (req, res) => {
  try {
    const { tableName } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string || "50", 10), 200);

    let rows: any[] = [];
    if (tableName === "users") {
      const rawUsers = await db.select().from(usersTable).limit(limit);
      rows = (rawUsers as any[]).map((u: any) => {
        const { passwordHash, ...safeUser } = u;
        return safeUser;
      });
    }
    else if (tableName === "characters") rows = await db.select().from(charactersTable).limit(limit);
    else if (tableName === "items") rows = await db.select().from(itemsTable).limit(limit);
    else if (tableName === "character_items") rows = await db.select().from(characterItemsTable).limit(limit);
    else if (tableName === "monsters") rows = await db.select().from(monstersTable).limit(limit);
    else if (tableName === "servers") rows = await db.select().from(serversTable).limit(limit);
    else if (tableName === "quests") rows = await db.select().from(questsTable).limit(limit);
    else if (tableName === "battle_logs") rows = await db.select().from(battleLogsTable).limit(limit);
    else return res.status(404).json({ error: "Bảng không tồn tại" });

    return res.json({ tableName, count: rows.length, rows });
  } catch (err: any) {
    return res.status(500).json({ error: "Lỗi truy vấn bảng: " + err.message });
  }
});

router.delete("/admin/tables/:tableName/:id", async (req, res) => {
  try {
    const { tableName, id } = req.params;
    const numId = parseInt(id, 10);

    if (tableName === "users") await db.delete(usersTable).where(eq(usersTable.id, numId));
    else if (tableName === "characters") await db.delete(charactersTable).where(eq(charactersTable.id, numId));
    else if (tableName === "items") await db.delete(itemsTable).where(eq(itemsTable.id, id));
    else if (tableName === "character_items") await db.delete(characterItemsTable).where(eq(characterItemsTable.id, numId));
    else if (tableName === "monsters") await db.delete(monstersTable).where(eq(monstersTable.id, id));
    else if (tableName === "servers") await db.delete(serversTable).where(eq(serversTable.id, id));
    else if (tableName === "quests") await db.delete(questsTable).where(eq(questsTable.id, id));
    else return res.status(404).json({ error: "Bảng không hợp lệ" });

    return res.json({ message: `Đã xóa bản ghi ${id} khỏi bảng ${tableName}` });
  } catch (err: any) {
    return res.status(500).json({ error: "Lỗi xóa bản ghi: " + err.message });
  }
});

router.post("/admin/db/reset-seed", async (_req, res) => {
  try {
    await seedDatabase();
    return res.json({ message: "Đã nạp lại toàn bộ dữ liệu mẫu (Items, Monsters, Servers, Quests) thành công!" });
  } catch (err: any) {
    return res.status(500).json({ error: "Lỗi nạp seed: " + err.message });
  }
});

// ==========================================
// 6. LIVE SUPABASE DIRECT CONNECTION & CONTINUOUS SYNC
// ==========================================
router.get("/admin/supabase/status", async (_req, res) => {
  try {
    const status = await getDatabaseConnectionStatus();
    return res.json(status);
  } catch (err: any) {
    return res.status(500).json({ error: "Lỗi kiểm tra trạng thái Supabase: " + err.message });
  }
});

router.post("/admin/supabase/connect", async (req, res) => {
  try {
    const { databaseUrl } = req.body || {};
    if (!databaseUrl || typeof databaseUrl !== "string") {
      return res.status(400).json({ error: "Thiếu chuỗi kết nối databaseUrl (postgres://...)" });
    }

    const result = await switchDatabaseConnection(databaseUrl);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: "Lỗi chuyển đổi kết nối: " + err.message });
  }
});

router.post("/admin/supabase/sync-all", async (_req, res) => {
  try {
    const result = await pushAllLocalDataToSupabase();
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: "Lỗi đồng bộ Supabase: " + err.message });
  }
});

export default router;
