import { Router } from "express";
import { db, charactersTable, battleLogsTable, usersTable, serversTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateCharacterBody } from "@workspace/api-zod";
import { CHARACTER_CLASSES, getStatsForLevel } from "../data/classes";
import { requireAuth } from "../middlewares/requireAuth";
import {
  ensureItemCatalog,
  ensureServerCatalog,
  ensureStarterInventory,
  getCharacterForUser,
  toCharacterResponse,
} from "../lib/inventory";

const router = Router();

router.get("/characters", requireAuth, async (req, res) => {
  const characters = await db
    .select()
    .from(charactersTable)
    .where(eq(charactersTable.userId, req.session.userId!))
    .orderBy(desc(charactersTable.createdAt));

  await ensureItemCatalog();
  const expToNext = await Promise.all(
    characters.map(async (character: any) => {
      return {
        ...(await toCharacterResponse(character)),
        experienceToNextLevel: getExpForLevel(character.level),
      };
    }),
  );

  return res.status(200).json(expToNext);
});

router.post("/characters", requireAuth, async (req, res) => {
  const parsed = CreateCharacterBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Dữ liệu không hợp lệ" });
  }

  const { name, classId } = parsed.data;
  const gender = (req.body.gender === "female" ? "female" : "male") as "male" | "female";
  const cls = CHARACTER_CLASSES.find((c) => c.id === classId);
  if (!cls) {
    return res.status(400).json({ error: "Chức nghiệp không hợp lệ" });
  }

  const existingCharacters = await db.select({ id: charactersTable.id }).from(charactersTable)
    .where(eq(charactersTable.userId, req.session.userId!));
  if (existingCharacters.length >= 4) {
    return res.status(409).json({ error: "Tài khoản đã đạt giới hạn 4 nhân vật" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
  await ensureServerCatalog();
  const selectedServerId = user?.selectedServerId ?? "s1_long_vuong";
  const [server] = await db.select().from(serversTable).where(eq(serversTable.id, selectedServerId)).limit(1);
  if (!server) return res.status(409).json({ error: "Máy chủ đã chọn không còn khả dụng" });

  const stats = getStatsForLevel(classId, 1);
  await ensureItemCatalog();

  const [character] = await db
    .insert(charactersTable)
    .values({
      userId: req.session.userId!,
      serverId: server.id,
      name,
      classId,
      className: cls.name,
      gender,
      level: 1,
      experience: 0,
      hp: stats.hp,
      maxHp: stats.hp,
      mp: 200,
      maxMp: 200,
      atk: stats.atk,
      def: stats.def,
      spd: stats.spd,
      gold: 100,
      kills: 0,
      deaths: 0,
      unlockedSlots: 15,
      combatPower: Math.round(stats.hp * 0.5 + stats.atk * 3 + stats.def * 2 + stats.spd * 2 + 15 * 8 + 10),
    })
    .returning();

  // Persist as last active character on user profile
  await db.update(usersTable)
    .set({ lastCharacterId: character.id })
    .where(eq(usersTable.id, req.session.userId!));

  return res.status(201).json({
    ...(await toCharacterResponse(character)),
    experienceToNextLevel: getExpForLevel(1),
  });
});

router.get("/characters/:characterId", requireAuth, async (req, res) => {
  const characterId = parseInt(req.params.characterId);
  if (isNaN(characterId)) {
    return res.status(400).json({ error: "ID không hợp lệ" });
  }

  const [character] = await db
    .select()
    .from(charactersTable)
    .where(eq(charactersTable.id, characterId))
    .limit(1);

  if (!character || character.userId !== req.session.userId) {
    return res.status(404).json({ error: "Không tìm thấy nhân vật" });
  }

  await ensureItemCatalog();
  return res.status(200).json({
    ...(await toCharacterResponse(character)),
    experienceToNextLevel: getExpForLevel(character.level),
  });
});

// Auto-Save character state (Heartbeat, on-event and beforeunload)
const handleCharacterAutoSave = async (req: any, res: any) => {
  const characterId = parseInt(req.params.characterId);
  if (isNaN(characterId)) {
    return res.status(400).json({ error: "ID không hợp lệ" });
  }

  const [character] = await db
    .select()
    .from(charactersTable)
    .where(eq(charactersTable.id, characterId))
    .limit(1);

  if (!character || character.userId !== req.session.userId) {
    return res.status(404).json({ error: "Không tìm thấy nhân vật" });
  }

  const body = req.body || {};
  const updateData: any = {};

  if (typeof body.hp === "number") updateData.hp = Math.max(0, Math.round(body.hp));
  if (typeof body.maxHp === "number" && body.maxHp > 0) updateData.maxHp = Math.round(body.maxHp);
  if (typeof body.mp === "number") updateData.mp = Math.max(0, Math.round(body.mp));
  if (typeof body.maxMp === "number" && body.maxMp > 0) updateData.maxMp = Math.round(body.maxMp);
  if (typeof body.level === "number" && body.level >= 1) updateData.level = Math.round(body.level);
  if (typeof body.experience === "number") updateData.experience = Math.max(0, Math.round(body.experience));
  if (typeof body.gold === "number") updateData.gold = Math.max(0, Math.round(body.gold));
  if (typeof body.kills === "number") updateData.kills = Math.max(0, Math.round(body.kills));
  if (typeof body.posX === "number") updateData.posX = Math.round(body.posX);
  if (typeof body.posZ === "number") updateData.posZ = Math.round(body.posZ);
  if (typeof body.zoneId === "string" && body.zoneId.trim()) updateData.zoneId = body.zoneId.trim();
  if (typeof body.str === "number") updateData.str = Math.round(body.str);
  if (typeof body.dex === "number") updateData.dex = Math.round(body.dex);
  if (typeof body.intel === "number") updateData.intel = Math.round(body.intel);
  if (typeof body.luk === "number") updateData.luk = Math.round(body.luk);
  if (typeof body.vit === "number") updateData.vit = Math.round(body.vit);
  if (typeof body.unlockedSlots === "number") {
    updateData.unlockedSlots = Math.min(30, Math.max(15, Math.round(body.unlockedSlots)));
  }

  if (Object.keys(updateData).length > 0) {
    await db.update(charactersTable)
      .set(updateData)
      .where(eq(charactersTable.id, characterId));
  }

  // Record as last active character
  await db.update(usersTable)
    .set({ lastCharacterId: characterId })
    .where(eq(usersTable.id, req.session.userId!));

  const updatedChar = await toCharacterResponse(character);
  return res.status(200).json({
    success: true,
    savedAt: new Date().toISOString(),
    character: {
      ...updatedChar,
      experienceToNextLevel: getExpForLevel(updatedChar.level),
    },
  });
};

router.put("/characters/:characterId/autosave", requireAuth, handleCharacterAutoSave);
router.post("/characters/:characterId/autosave", requireAuth, handleCharacterAutoSave);
router.patch("/characters/:characterId/autosave", requireAuth, handleCharacterAutoSave);

router.get("/characters/:characterId/battle-log", requireAuth, async (req, res) => {
  const characterId = parseInt(req.params.characterId);
  if (isNaN(characterId)) {
    return res.status(400).json({ error: "ID không hợp lệ" });
  }

  const character = await getCharacterForUser(characterId, req.session.userId!);
  if (!character) return res.status(404).json({ error: "Không tìm thấy nhân vật" });

  const logs = await db
    .select()
    .from(battleLogsTable)
    .where(eq(battleLogsTable.characterId, characterId))
    .orderBy(desc(battleLogsTable.createdAt))
    .limit(20);

  return res.status(200).json(logs);
});

router.post("/characters/:characterId/3d-reward", requireAuth, async (_req, res) => {
  // ── KHÓA PHẦN THƯỞNG CLIENT TỰ KHAI BÁO (REWARD LOCKDOWN) ──
  // Loại bỏ hoàn toàn việc server tin tưởng các giá trị EXP/Vàng/Kills do client tự gửi lên.
  // Mọi kết quả chiến đấu và thăng cấp phải đi qua /characters/:characterId/battle để server tự tra cứu và xác thực.
  return res.status(403).json({
    error: "Lỗi bảo mật: Không chấp nhận phần thưởng client tự khai báo.",
    message: "Endpoint /3d-reward đã bị khóa. Mọi tiến trình phải được server xác thực qua POST /characters/:characterId/battle.",
  });
});

function getExpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export default router;
