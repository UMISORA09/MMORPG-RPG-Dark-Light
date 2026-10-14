import { Router } from "express";
import { db, charactersTable, battleLogsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateCharacterBody } from "@workspace/api-zod";
import { CHARACTER_CLASSES, getStatsForLevel } from "../data/classes";
import {
  ensureItemCatalog,
  ensureStarterInventory,
  toCharacterResponse,
} from "../lib/inventory";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Chưa đăng nhập" });
  }
  next();
}

router.get("/characters", requireAuth, async (req, res) => {
  const characters = await db
    .select()
    .from(charactersTable)
    .where(eq(charactersTable.userId, req.session.userId!))
    .orderBy(desc(charactersTable.createdAt));

  await ensureItemCatalog();
  const expToNext = await Promise.all(
    characters.map(async (character: any) => {
      await ensureStarterInventory(character.id, character.classId);
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
  const cls = CHARACTER_CLASSES.find((c) => c.id === classId);
  if (!cls) {
    return res.status(400).json({ error: "Chức nghiệp không hợp lệ" });
  }

  const stats = getStatsForLevel(classId, 1);
  await ensureItemCatalog();

  const [character] = await db
    .insert(charactersTable)
    .values({
      userId: req.session.userId!,
      name,
      classId,
      className: cls.name,
      level: 1,
      experience: 0,
      hp: stats.hp,
      maxHp: stats.hp,
      atk: stats.atk,
      def: stats.def,
      spd: stats.spd,
      gold: 100,
      kills: 0,
      deaths: 0,
    })
    .returning();

  await ensureStarterInventory(character.id, character.classId);
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
  await ensureStarterInventory(character.id, character.classId);
  return res.status(200).json({
    ...(await toCharacterResponse(character)),
    experienceToNextLevel: getExpForLevel(character.level),
  });
});

router.get("/characters/:characterId/battle-log", requireAuth, async (req, res) => {
  const characterId = parseInt(req.params.characterId);
  if (isNaN(characterId)) {
    return res.status(400).json({ error: "ID không hợp lệ" });
  }

  const logs = await db
    .select()
    .from(battleLogsTable)
    .where(eq(battleLogsTable.characterId, characterId))
    .orderBy(desc(battleLogsTable.createdAt))
    .limit(20);

  return res.status(200).json(logs);
});

router.post("/characters/:characterId/3d-reward", requireAuth, async (req, res) => {
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

  const expGained = Math.max(0, parseInt(req.body.expGained) || 0);
  const goldGained = Math.max(0, parseInt(req.body.goldGained) || 0);
  const killsGained = Math.max(0, parseInt(req.body.kills) || 0);

  let newExp = character.experience + expGained;
  let currentLevel = character.level;
  let expToNext = getExpForLevel(currentLevel);
  let leveledUp = false;

  while (newExp >= expToNext) {
    newExp -= expToNext;
    currentLevel++;
    leveledUp = true;
    expToNext = getExpForLevel(currentLevel);
  }

  const newStats = getStatsForLevel(character.classId, currentLevel);

  const [updated] = await db
    .update(charactersTable)
    .set({
      level: currentLevel,
      experience: newExp,
      maxHp: newStats.hp,
      hp: newStats.hp,
      atk: newStats.atk,
      def: newStats.def,
      spd: newStats.spd,
      gold: character.gold + goldGained,
      kills: character.kills + killsGained,
    })
    .where(eq(charactersTable.id, characterId))
    .returning();

  return res.status(200).json({
    leveledUp,
    character: {
      ...(await toCharacterResponse(updated)),
      experienceToNextLevel: getExpForLevel(currentLevel),
    },
  });
});

function getExpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export default router;
