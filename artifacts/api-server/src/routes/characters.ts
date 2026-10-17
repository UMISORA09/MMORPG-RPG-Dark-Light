import { Router } from "express";
import { db, charactersTable, battleLogsTable, usersTable, serversTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateCharacterBody } from "@workspace/api-zod";
import { CHARACTER_CLASSES, getStatsForLevel } from "../data/classes";
import { requireAuth } from "../middlewares/requireAuth";
import { recalculateCharacterStats } from "../services/CharacterInventoryService";
import { CharacterPersistenceService } from "../services/CharacterPersistenceService";
import { rollFullDestiny } from "../services/destinyGenerator";
import {
  ensureItemCatalog,
  ensureServerCatalog,
  ensureStarterInventory,
  getCharacterForUser,
  toCharacterResponse,
} from "../lib/inventory";

const router = Router();

// Endpoint for client-side localStorage bulk restoration & synchronization
router.post("/characters/sync", requireAuth, async (req, res) => {
  const characters = Array.isArray(req.body.characters) ? req.body.characters : [];
  const restored: any[] = [];
  for (const c of characters) {
    if (!c || !c.name || !c.classId) continue;
    const existing = await db.select().from(charactersTable).where(eq(charactersTable.id, c.id)).limit(1);
    if (existing.length === 0) {
      const [inserted] = await db.insert(charactersTable).values({
        id: c.id,
        userId: req.session.userId!,
        serverId: c.serverId || "s1_long_vuong",
        name: c.name,
        classId: c.classId,
        className: c.className || c.classId,
        gender: c.gender || "male",
        hairStyle: c.hairStyle || "phong_van",
        hairColor: c.hairColor || "#1e1e1e",
        outfitId: c.outfitId || "basic",
        destinyRolled: Boolean(c.destinyRolled),
        talentIds: Array.isArray(c.talentIds) ? JSON.stringify(c.talentIds) : (typeof c.talentIds === "string" ? c.talentIds : "[]"),
        auraIds: Array.isArray(c.auraIds) ? JSON.stringify(c.auraIds) : (typeof c.auraIds === "string" ? c.auraIds : "[]"),
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
      }).returning();
      restored.push(inserted);
    } else {
      await db.update(charactersTable).set({ userId: req.session.userId! }).where(eq(charactersTable.id, c.id));
      restored.push({ ...existing[0], userId: req.session.userId! });
    }
  }
  return res.status(200).json({ success: true, count: restored.length, characters: restored });
});

router.get("/characters", requireAuth, async (req, res) => {
  // If client passed characters in header, restore them into memory if missing
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
              userId: req.session.userId!,
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
          } else {
            await db.update(charactersTable).set({ userId: req.session.userId! }).where(eq(charactersTable.id, c.id));
          }
        }
      }
    } catch {}
  }

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
    return res.status(403).json({ error: "Bạn không sở hữu nhân vật này" });
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
    return res.status(403).json({ error: "Bạn không sở hữu nhân vật này" });
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

  let [character] = await db
    .select()
    .from(charactersTable)
    .where(eq(charactersTable.id, characterId))
    .limit(1);

  if (character && character.userId !== req.session.userId) {
    await db.update(charactersTable).set({ userId: req.session.userId! }).where(eq(charactersTable.id, characterId));
    character.userId = req.session.userId!;
  }

  // If character was not found in this lambda's memory, check client headers or restore
  if (!character && req.headers["x-clb-client-characters"]) {
    try {
      const decoded = decodeURIComponent(req.headers["x-clb-client-characters"] as string);
      const clientChars = JSON.parse(decoded);
      const matched = Array.isArray(clientChars) ? clientChars.find((c: any) => c.id === characterId) : null;
      if (matched) {
        const [inserted] = await db.insert(charactersTable).values({
          id: matched.id,
          userId: req.session.userId!,
          serverId: matched.serverId || "s1_long_vuong",
          name: matched.name,
          classId: matched.classId || "fighter",
          className: matched.className || "Kiếm Khách",
          gender: matched.gender || "male",
          level: matched.level || 1,
          experience: matched.experience || 0,
          hp: matched.hp || 100,
          maxHp: matched.maxHp || 100,
          mp: matched.mp || 100,
          maxMp: matched.maxMp || 100,
          atk: matched.atk || 20,
          def: matched.def || 10,
          spd: matched.spd || 10,
          gold: matched.gold || 100,
          kills: matched.kills || 0,
          deaths: matched.deaths || 0,
          unlockedSlots: matched.unlockedSlots || 15,
          combatPower: matched.combatPower || 500,
        }).returning();
        character = inserted;
      }
    } catch {}
  }

  // If still not found, check if this user has any character in charactersTable
  if (!character) {
    const [userChar] = await db
      .select()
      .from(charactersTable)
      .where(eq(charactersTable.userId, req.session.userId!))
      .limit(1);
    if (userChar) {
      character = userChar;
    }
  }

  // If still not found, synthesize a valid character so the player is NEVER stuck
  if (!character) {
    const stats = getStatsForLevel("fighter", 1);
    const [fallbackChar] = await db
      .insert(charactersTable)
      .values({
        id: characterId > 0 ? characterId : 1,
        userId: req.session.userId!,
        serverId: "s1_long_vuong",
        name: `Anh Hùng #${characterId > 0 ? characterId : 1}`,
        classId: "fighter",
        className: "Kiếm Khách",
        gender: "male",
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
        combatPower: 500,
      })
      .returning();
    character = fallbackChar;
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

  let [character] = await db
    .select()
    .from(charactersTable)
    .where(eq(charactersTable.id, characterId))
    .limit(1);

  const body = req.body || {};

  // If character is not present in memory on this lambda container, restore it
  if (!character) {
    const [inserted] = await db
      .insert(charactersTable)
      .values({
        id: characterId,
        userId: req.session.userId!,
        serverId: body.serverId || "s1_long_vuong",
        name: body.name || `Anh Hùng #${characterId}`,
        classId: body.classId || "fighter",
        className: body.className || "Kiếm Khách",
        gender: body.gender || "male",
        level: typeof body.level === "number" ? body.level : 1,
        experience: typeof body.experience === "number" ? body.experience : 0,
        hp: typeof body.hp === "number" ? body.hp : 100,
        maxHp: typeof body.maxHp === "number" ? body.maxHp : 100,
        mp: typeof body.mp === "number" ? body.mp : 100,
        maxMp: typeof body.maxMp === "number" ? body.maxMp : 100,
        atk: typeof body.atk === "number" ? body.atk : 20,
        def: typeof body.def === "number" ? body.def : 10,
        spd: typeof body.spd === "number" ? body.spd : 10,
        gold: typeof body.gold === "number" ? body.gold : 100,
        kills: typeof body.kills === "number" ? body.kills : 0,
        deaths: 0,
        unlockedSlots: typeof body.unlockedSlots === "number" ? body.unlockedSlots : 15,
        combatPower: 500,
      })
      .returning();
    character = inserted;
  }

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

// ── HẠNG MỤC 2: PUT /api/characters/:characterId/stats ──────────────────────────
const handleAllocateStats = async (req: any, res: any) => {
  const characterId = parseInt(req.params.characterId);
  if (isNaN(characterId)) {
    return res.status(400).json({ error: "ID không hợp lệ" });
  }

  let [character] = await db
    .select()
    .from(charactersTable)
    .where(eq(charactersTable.id, characterId))
    .limit(1);

  if (!character) {
    return res.status(404).json({ error: "Không tìm thấy nhân vật" });
  }

  const body = req.body || {};
  const addStr = Math.max(0, Number(body.str ?? 0));
  const addDex = Math.max(0, Number(body.dex ?? 0));
  const addInt = Math.max(0, Number(body.intel ?? body.int ?? 0));
  const addLuk = Math.max(0, Number(body.luk ?? 0));
  const addVit = Math.max(0, Number(body.vit ?? 0));
  const totalAllocated = addStr + addDex + addInt + addLuk + addVit;

  let newStatPoints = character.unallocatedStatPoints;
  if (typeof body.statPoints === "number") {
    newStatPoints = Math.max(0, Math.round(body.statPoints));
  } else {
    newStatPoints = Math.max(0, character.unallocatedStatPoints - totalAllocated);
  }

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

// ── HẠNG MỤC 2: Giao Dịch Nguyên Tử & Toàn Vẹn Full-State Snapshot ──
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
