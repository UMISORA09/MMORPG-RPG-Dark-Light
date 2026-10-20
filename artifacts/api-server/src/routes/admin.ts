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
} from "@workspace/db";
import { eq, desc, sql, and } from "drizzle-orm";
import { getDeterministicUserId } from "./auth";
import { CHARACTER_CLASSES, getStatsForLevel } from "../data/classes";

const router = Router();

// Áp dụng RBAC deny-by-default cho toàn bộ Admin Router (P0 Security)
router.use("/admin", requireAdmin);

// ==========================================
// 1. STATS & SYSTEM HEALTH
// ==========================================
router.get("/admin/stats", async (_req, res) => {
  try {
    const [usersCount, charactersCount, itemsCount, monstersCount, serversCount, questsCount, characterItemsCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(usersTable).then((r: any) => Number(r[0]?.count || 0)).catch(() => 0),
      db.select({ count: sql<number>`count(*)` }).from(charactersTable).then((r: any) => Number(r[0]?.count || 0)).catch(() => 0),
      db.select({ count: sql<number>`count(*)` }).from(itemsTable).then((r: any) => Number(r[0]?.count || 0)).catch(() => 0),
      db.select({ count: sql<number>`count(*)` }).from(monstersTable).then((r: any) => Number(r[0]?.count || 0)).catch(() => 0),
      db.select({ count: sql<number>`count(*)` }).from(serversTable).then((r: any) => Number(r[0]?.count || 0)).catch(() => 0),
      db.select({ count: sql<number>`count(*)` }).from(questsTable).then((r: any) => Number(r[0]?.count || 0)).catch(() => 0),
      db.select({ count: sql<number>`count(*)` }).from(characterItemsTable).then((r: any) => Number(r[0]?.count || 0)).catch(() => 0),
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
// 2. USERS MANAGEMENT
// ==========================================
router.get("/admin/users", async (_req, res) => {
  try {
    const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
    const characters = await db.select().from(charactersTable);

    const userList = (users as any[]).map((u: any) => {
      const userChars = (characters as any[]).filter((c: any) => c.userId === u.id);
      return {
        id: u.id,
        username: u.username,
        role: u.role || "PLAYER",
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

    return res.json(userList);
  } catch (err: any) {
    return res.status(500).json({ error: "Lỗi tải danh sách người chơi: " + err.message });
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

    const results = await Promise.all(
      tables.map(async (t) => {
        let count = 0;
        try {
          if (t.name === "users") count = (await db.select({ c: sql`count(*)` }).from(usersTable))[0]?.c as number;
          else if (t.name === "characters") count = (await db.select({ c: sql`count(*)` }).from(charactersTable))[0]?.c as number;
          else if (t.name === "items") count = (await db.select({ c: sql`count(*)` }).from(itemsTable))[0]?.c as number;
          else if (t.name === "character_items") count = (await db.select({ c: sql`count(*)` }).from(characterItemsTable))[0]?.c as number;
          else if (t.name === "monsters") count = (await db.select({ c: sql`count(*)` }).from(monstersTable))[0]?.c as number;
          else if (t.name === "servers") count = (await db.select({ c: sql`count(*)` }).from(serversTable))[0]?.c as number;
          else if (t.name === "quests") count = (await db.select({ c: sql`count(*)` }).from(questsTable))[0]?.c as number;
          else if (t.name === "battle_logs") count = (await db.select({ c: sql`count(*)` }).from(battleLogsTable))[0]?.c as number;
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

export default router;
