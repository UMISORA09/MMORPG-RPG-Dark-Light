import { Router } from "express";
import { db, charactersTable, battleLogsTable, usersTable, serversTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { CreateCharacterBody } from "@workspace/api-zod";
import { CHARACTER_CLASSES, getStatsForLevel } from "../data/classes";
import { requireAuth } from "../middlewares/requireAuth";
import { recalculateCharacterStats } from "../services/CharacterInventoryService";
import { CharacterPersistenceService } from "../services/CharacterPersistenceService";
import { rollFullDestiny } from "../services/destinyGenerator";
import {
  ensureItemCatalog,
  ensureServerCatalog,
  toCharacterResponse,
} from "../lib/inventory";

const router = Router();

// Endpoint for client-side localStorage bulk restoration & synchronization (Chỉ khôi phục nếu chưa tồn tại)
router.post("/characters/sync", requireAuth, async (req, res) => {
  const characters = Array.isArray(req.body.characters) ? req.body.characters : [];
  const restored: any[] = [];
  const userId = req.session.userId!;

  for (const c of characters) {
    if (!c || !c.name || !c.classId) continue;
    const cleanName = String(c.name).trim().slice(0, 24);
    if (cleanName.length < 2) continue;
    const classConfig = (CHARACTER_CLASSES as any).find((cls: any) => cls.id === c.classId);
    if (!classConfig) continue;

    const existing = await db.select().from(charactersTable).where(eq(charactersTable.id, c.id)).limit(1);
    if (existing.length === 0) {
      // 🛡️ BẢO VỆ TIẾN TRÌNH KHỞI TẠO (CHARACTER RECOVERY AUTHORITY):
      // Tuyệt đối KHÔNG nhận level, gold, exp, stats tùy ý từ localStorage của client.
      // Nhân vật mới khôi phục bắt buộc phải được chuẩn hóa từ hệ thống chỉ số gốc Level 1 của môn phái.
      const baseStats = getStatsForLevel(c.classId, 1);
      const cp = Math.round(baseStats.hp * 0.5 + baseStats.atk * 2.5 + baseStats.def * 1.5 + baseStats.spd * 1.0);
      const [inserted] = await db.insert(charactersTable).values({
        userId,
        serverId: c.serverId || "s1_long_vuong",
        name: cleanName,
        classId: c.classId,
        className: classConfig.name || c.classId,
        gender: c.gender === "female" ? "female" : "male",
        hairStyle: c.hairStyle || "phong_van",
        hairColor: c.hairColor || "#1e1e1e",
        outfitId: c.outfitId || "basic",
        destinyRolled: false,
        level: 1,
        experience: 0,
        hp: baseStats.hp,
        maxHp: baseStats.hp,
        mp: baseStats.mp,
        maxMp: baseStats.mp,
        atk: baseStats.atk,
        def: baseStats.def,
        spd: baseStats.spd,
        gold: 100, // Khởi đầu chuẩn 100 vàng
        kills: 0,
        deaths: 0,
        unlockedSlots: 18,
        combatPower: cp,
        revision: 1,
      }).returning();
      restored.push(inserted);
    } else if (existing[0].userId === userId) {
      // Nếu nhân vật đã tồn tại và thuộc về user, trả về dữ liệu server chuẩn xác
      restored.push(existing[0]);
    }
  }
  return res.status(200).json({ success: true, count: restored.length, characters: restored });
});

router.get("/characters", requireAuth, async (req, res) => {
  const userId = req.session.userId!;

  // Phục hồi dữ liệu nếu là nhân vật của chính user
  if (req.headers["x-clb-client-characters"]) {
    try {
      const decoded = decodeURIComponent(req.headers["x-clb-client-characters"] as string);
      const clientChars = JSON.parse(decoded);
      if (Array.isArray(clientChars)) {
        for (const c of clientChars) {
          if (!c?.id || !c?.name) continue;
          const [exists] = await db.select().from(charactersTable).where(eq(charactersTable.id, c.id)).limit(1);
          if (!exists) {
            await db.insert(charactersTable).values({
              id: c.id,
              userId,
              serverId: c.serverId || "s1_long_vuong",
              name: c.name,
              classId: c.classId || "fighter",
              className: c.className || "Kiếm Khách",
              gender: c.gender || "male",
              level: c.level || 1,
              experience: c.experience || 0,
              hp: c.hp || 100,
              maxHp: c.maxHp || 100,
              mp: c.mp || 100,
              maxMp: c.maxMp || 100,
              atk: c.atk || 20,
              def: c.def || 10,
              spd: c.spd || 10,
              gold: c.gold || 100,
              kills: c.kills || 0,
              deaths: c.deaths || 0,
              unlockedSlots: c.unlockedSlots || 15,
              combatPower: c.combatPower || 500,
            });
          }
          // Tuyệt đối không thay đổi userId của nhân vật đã tồn tại
        }
      }
    } catch {}
  }

  const characters = await db
    .select()
    .from(charactersTable)
    .where(eq(charactersTable.userId, userId))
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

  const baseStr = (cls as any).baseStr || 8;
  const baseDex = (cls as any).baseDex || 5;
  const baseInt = (cls as any).baseInt || 5;
  const baseLuk = (cls as any).baseLuk || 5;
  const baseVit = (cls as any).baseVit || 5;
  const combatPower = Math.floor(
    stats.hp * 0.2 + stats.mp * 0.1 + stats.atk * 8 + 10 * 6 + stats.def * 10 + stats.spd * 15 + stats.critRate * 12
  );

  const hairStyle = typeof req.body.hairStyle === "string" ? req.body.hairStyle : "phong_van";
  const hairColor = typeof req.body.hairColor === "string" ? req.body.hairColor : "#1e1e1e";
  const outfitId = typeof req.body.outfitId === "string" ? req.body.outfitId : "basic";
  const destinyRolled = Boolean(req.body.destinyRolled);
  const talentIds = Array.isArray(req.body.talentIds) ? JSON.stringify(req.body.talentIds) : (typeof req.body.talentIds === "string" ? req.body.talentIds : "[]");
  const auraIds = Array.isArray(req.body.auraIds) ? JSON.stringify(req.body.auraIds) : (typeof req.body.auraIds === "string" ? req.body.auraIds : "[]");

  const [character] = await db
    .insert(charactersTable)
    .values({
      userId: req.session.userId!,
      serverId: server.id,
      name,
      classId,
      className: cls.name,
      gender,
      hairStyle,
      hairColor,
      outfitId,
      destinyRolled,
      talentIds,
      auraIds,
      level: 1,
      experience: 0,
      hp: stats.hp,
      maxHp: stats.hp,
      mp: stats.mp,
      maxMp: stats.mp,
      str: baseStr,
      dex: baseDex,
      intel: baseInt,
      luk: baseLuk,
      vit: baseVit,
      atk: stats.atk,
      matk: 10,
      def: stats.def,
      spd: stats.spd,
      critRate: stats.critRate,
      evasion: stats.evasion,
      gold: 100,
      kills: 0,
      deaths: 0,
      unallocatedStatPoints: 5,
      unlockedSlots: 15,
      combatPower,
      revision: 1,
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

// Endpoint gacha Thiên Mệnh 1 lần duy nhất cho nhân vật
router.post("/characters/roll-destiny", requireAuth, async (req, res) => {
  const characterId = Number(req.body.characterId);
  if (!characterId) {
    // Roll ngẫu nhiên khi đang ở màn hình tạo nhân vật
    const result = rollFullDestiny();
    return res.status(200).json({ success: true, ...result });
  }

  const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId)).limit(1);
  if (!char) {
    return res.status(404).json({ error: "Không tìm thấy nhân vật" });
  }
  if (char.userId !== req.session.userId) {
    return res.status(403).json({ error: "Từ chối truy cập: Bạn không sở hữu nhân vật này" });
  }
  if (char.destinyRolled) {
    return res.status(400).json({ error: "Bạn chỉ được xúc xắc Thiên Mệnh một lần duy nhất!" });
  }

  const rollResult = rollFullDestiny();
  await db.transaction(async (tx: any) => {
    await tx.update(charactersTable).set({
      destinyRolled: true,
      talentIds: JSON.stringify(rollResult.talentIds),
      auraIds: JSON.stringify(rollResult.auraIds),
    }).where(eq(charactersTable.id, characterId));
  });

  return res.status(200).json({
    success: true,
    ...rollResult,
    message: "Thiên Mệnh và Khí Linh đã được định đoạt và khóa vĩnh viễn!",
  });
});

router.post("/characters/:id/roll-destiny", requireAuth, async (req, res) => {
  const characterId = Number(req.params.id);
  if (!characterId) {
    return res.status(400).json({ error: "ID nhân vật không hợp lệ" });
  }
  const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, characterId)).limit(1);
  if (!char) {
    return res.status(404).json({ error: "Không tìm thấy nhân vật" });
  }
  if (char.userId !== req.session.userId) {
    return res.status(403).json({ error: "Từ chối truy cập: Bạn không sở hữu nhân vật này" });
  }
  if (char.destinyRolled) {
    return res.status(400).json({ error: "Bạn chỉ được xúc xắc Thiên Mệnh một lần duy nhất!" });
  }

  const rollResult = rollFullDestiny();
  await db.transaction(async (tx: any) => {
    await tx.update(charactersTable).set({
      destinyRolled: true,
      talentIds: JSON.stringify(rollResult.talentIds),
      auraIds: JSON.stringify(rollResult.auraIds),
    }).where(eq(charactersTable.id, characterId));
  });

  return res.status(200).json({
    success: true,
    ...rollResult,
    message: "Thiên Mệnh và Khí Linh đã được định đoạt và khóa vĩnh viễn!",
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

  if (!character) {
    return res.status(404).json({ error: "Không tìm thấy nhân vật" });
  }

  // Bảo vệ Ownership: Tuyệt đối không cho phép xem hoặc chiếm đoạt nhân vật của người khác!
  if (character.userId !== req.session.userId) {
    return res.status(403).json({ error: "Từ chối truy cập: Bạn không phải chủ sở hữu của nhân vật này." });
  }

  await ensureItemCatalog();
  return res.status(200).json({
    ...(await toCharacterResponse(character)),
    experienceToNextLevel: getExpForLevel(character.level),
  });
});

// Auto-Save character state (Heartbeat, on-event and beforeunload)
// P0 FIX: Server-authoritative progression fields (Gold, EXP, Level, Kills, Stats, Slots) are strictly protected.
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

  if (!character) {
    return res.status(404).json({ error: "Không tìm thấy nhân vật để lưu" });
  }

  // Bảo vệ Ownership: Không cho phép lưu trạng thái vào nhân vật của người khác!
  if (character.userId !== req.session.userId) {
    return res.status(403).json({ error: "Từ chối truy cập: Bạn không có quyền lưu dữ liệu cho nhân vật này." });
  }

  const body = req.body || {};
  const updateData: any = {};

  // 1. Current HP / MP: Clamped within authoritative max limits
  if (typeof body.hp === "number" && !isNaN(body.hp)) {
    updateData.hp = Math.min(Number(character.maxHp || 100), Math.max(0, Math.round(body.hp)));
  }
  if (typeof body.mp === "number" && !isNaN(body.mp)) {
    updateData.mp = Math.min(Number(character.maxMp || 100), Math.max(0, Math.round(body.mp)));
  }

  // 2. Position & Movement: Validate bounded coordinates (-10000 to 10000)
  if (typeof body.posX === "number" && Number.isFinite(body.posX)) {
    updateData.posX = Math.min(10000, Math.max(-10000, Math.round(body.posX)));
  }
  if (typeof body.posZ === "number" && Number.isFinite(body.posZ)) {
    updateData.posZ = Math.min(10000, Math.max(-10000, Math.round(body.posZ)));
  }
  if (typeof body.facing === "string" && ["left", "right", "up", "down"].includes(body.facing)) {
    updateData.facing = body.facing;
  }
  if (typeof body.zoneId === "string" && body.zoneId.trim() && body.zoneId.trim().length <= 64) {
    updateData.zoneId = body.zoneId.trim();
  }

  // 3. Mount & Pet visual toggles
  if (typeof body.isMounted === "boolean") {
    updateData.isMounted = body.isMounted;
  }
  if (typeof body.activeMountId === "string" && body.activeMountId.trim().length <= 64) {
    updateData.activeMountId = body.activeMountId.trim();
  }
  if (typeof body.activePetId === "string" && body.activePetId.trim().length <= 64) {
    updateData.activePetId = body.activePetId.trim();
  }

  // 4. UI Preferences & Hotbar Configuration (Safe non-economic client settings)
  if (body.uiPreferencesJson !== undefined) {
    updateData.uiPreferencesJson = typeof body.uiPreferencesJson === "string"
      ? body.uiPreferencesJson
      : JSON.stringify(body.uiPreferencesJson);
  }
  if (body.hotbarConfigJson !== undefined) {
    updateData.hotbarConfigJson = typeof body.hotbarConfigJson === "string"
      ? body.hotbarConfigJson
      : JSON.stringify(body.hotbarConfigJson);
  }

  // 🛡️ SECURITY & INTEGRITY ENFORCEMENT:
  // Server-authoritative progression fields (Gold, EXP, Level, Kills, UnlockedSlots, Stats, Base attributes)
  // are STRICTLY EXCLUDED from updateData. Any attempt by client to inject gold/level/stats is ignored.
  updateData.lastSavedAt = new Date();

  if (Object.keys(updateData).length > 0) {
    await db.update(charactersTable)
      .set(updateData)
      .where(eq(charactersTable.id, characterId));
  }

  // Ghi nhận nhân vật hoạt động gần nhất của người dùng
  await db.update(usersTable)
    .set({ lastCharacterId: characterId })
    .where(eq(usersTable.id, req.session.userId!));

  const [latestChar] = await db
    .select()
    .from(charactersTable)
    .where(eq(charactersTable.id, characterId))
    .limit(1);

  const updatedChar = await toCharacterResponse(latestChar || { ...character, ...updateData });
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

// Phân bổ điểm tiềm năng (Stats allocation)
const handleAllocateStats = async (req: any, res: any) => {
  const characterId = parseInt(req.params.characterId);
  if (isNaN(characterId)) {
    return res.status(400).json({ error: "ID không hợp lệ" });
  }

  const [character] = await db
    .select()
    .from(charactersTable)
    .where(eq(charactersTable.id, characterId))
    .limit(1);

  if (!character) {
    return res.status(404).json({ error: "Không tìm thấy nhân vật" });
  }

  // Bảo vệ Ownership
  if (character.userId !== req.session.userId) {
    return res.status(403).json({ error: "Từ chối truy cập: Bạn không có quyền phân bổ chỉ số cho nhân vật này." });
  }

  const body = req.body || {};
  const addStr = Math.max(0, Number(body.str ?? 0));
  const addDex = Math.max(0, Number(body.dex ?? 0));
  const addInt = Math.max(0, Number(body.intel ?? body.int ?? 0));
  const addLuk = Math.max(0, Number(body.luk ?? 0));
  const addVit = Math.max(0, Number(body.vit ?? 0));
  const totalAllocated = addStr + addDex + addInt + addLuk + addVit;

  if (totalAllocated <= 0) {
    return res.status(400).json({ error: "Số điểm cần phân bổ phải lớn hơn 0" });
  }

  const currentAvailablePoints = Number(character.unallocatedStatPoints || 0);
  if (totalAllocated > currentAvailablePoints) {
    return res.status(400).json({
      error: `Không đủ điểm tiềm năng! Cần ${totalAllocated} điểm nhưng chỉ còn ${currentAvailablePoints} điểm.`,
    });
  }

  const newStatPoints = currentAvailablePoints - totalAllocated;

  const baseCls = CHARACTER_CLASSES.find((c) => c.id === character.classId) || CHARACTER_CLASSES[0];
  const newStr = (character.str || (baseCls as any).baseStr || 8) + addStr;
  const newDex = (character.dex || (baseCls as any).baseDex || 5) + addDex;
  const newInt = (character.intel || (baseCls as any).baseInt || 5) + addInt;
  const newLuk = (character.luk || (baseCls as any).baseLuk || 5) + addLuk;
  const newVit = (character.vit || (baseCls as any).baseVit || 5) + addVit;

  await db.update(charactersTable)
    .set({
      str: newStr,
      dex: newDex,
      intel: newInt,
      luk: newLuk,
      vit: newVit,
      unallocatedStatPoints: newStatPoints,
    })
    .where(eq(charactersTable.id, characterId));

  const updatedChar = await recalculateCharacterStats(characterId);
  return res.status(200).json({
    success: true,
    message: `✨ Đã lưu chỉ số! Lực chiến tăng lên: ${updatedChar.combatPower}`,
    combatPower: updatedChar.combatPower,
    character: {
      ...updatedChar,
      experienceToNextLevel: getExpForLevel(updatedChar.level),
    },
  });
};

router.put("/characters/:characterId/stats", requireAuth, handleAllocateStats);
router.post("/characters/:characterId/stats", requireAuth, handleAllocateStats);
router.post("/characters/:characterId/allocate-stats", requireAuth, handleAllocateStats);

router.get("/characters/:characterId/battle-log", requireAuth, async (req, res) => {
  const characterId = parseInt(req.params.characterId);
  if (isNaN(characterId)) {
    return res.status(400).json({ error: "ID không hợp lệ" });
  }

  const [character] = await db
    .select({ id: charactersTable.id })
    .from(charactersTable)
    .where(and(eq(charactersTable.id, characterId), eq(charactersTable.userId, req.session.userId!)))
    .limit(1);

  if (!character) return res.status(404).json({ error: "Không tìm thấy nhân vật hoặc không có quyền truy cập" });

  const logs = await db
    .select()
    .from(battleLogsTable)
    .where(eq(battleLogsTable.characterId, characterId))
    .orderBy(desc(battleLogsTable.createdAt))
    .limit(20);

  return res.status(200).json(logs);
});

router.post("/characters/:characterId/3d-reward", requireAuth, async (_req, res) => {
  // Khóa phần thưởng client tự khai báo
  return res.status(403).json({
    error: "Lỗi bảo mật: Không chấp nhận phần thưởng client tự khai báo.",
    message: "Endpoint /3d-reward đã bị khóa. Mọi tiến trình phải được server xác thực qua POST /characters/:characterId/battle hoặc Encounters.",
  });
});

const handleFullSync = async (req: any, res: any) => {
  const characterId = parseInt(req.params.characterId);
  if (isNaN(characterId)) {
    return res.status(400).json({ error: "ID nhân vật không hợp lệ" });
  }

  try {
    const result = await CharacterPersistenceService.fullSync(
      req.session.userId!,
      characterId,
      req.body
    );
    return res.status(200).json(result);
  } catch (err: any) {
    console.error(`[FullSync] Error syncing character ${characterId}:`, err);
    return res.status(err.statusCode || 500).json({
      error: err.message || "Không thể đồng bộ trạng thái nhân vật",
    });
  }
};

router.put("/characters/:characterId/full-sync", requireAuth, handleFullSync);
router.post("/characters/:characterId/full-sync", requireAuth, handleFullSync);

router.get("/characters/:characterId/full-state", requireAuth, async (req, res) => {
  const characterId = parseInt(req.params.characterId);
  if (isNaN(characterId)) {
    return res.status(400).json({ error: "ID nhân vật không hợp lệ" });
  }

  try {
    const result = await CharacterPersistenceService.getFullState(
      req.session.userId!,
      characterId
    );
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(err.statusCode || 500).json({
      error: err.message || "Không thể tải trạng thái nhân vật",
    });
  }
});

function getExpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export default router;
