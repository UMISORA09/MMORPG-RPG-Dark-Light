import { Router } from "express";
import { db, charactersTable, battleLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { StartBattleBody } from "@workspace/api-zod";
import { MONSTERS, getExpForLevel, getStatsForLevel } from "../data/classes";
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

function simulateBattle(
  playerAtk: number,
  playerDef: number,
  playerHp: number,
  playerSpd: number,
  monsterAtk: number,
  monsterDef: number,
  monsterHp: number,
  classId: string
) {
  const rounds = [];
  let pHp = playerHp;
  let mHp = monsterHp;
  let round = 0;
  const MAX_ROUNDS = 20;

  const skills: Record<string, string[]> = {
    gunner: ["Đạn Xuyên Giáp", "Nổ Súng Liên Hoàn", "Tên Lửa Hủy Diệt"],
    assassin: ["Đâm Từ Bóng Tối", "Độc Tố", "Lưỡi Tử Thần"],
    fighter: ["Đấm Sấm Sét", "Cơn Bão Quyền", "Đỉnh Cao Hùng Lực"],
    tank: ["Khiên Thần Thánh", "Đập Đất", "Pháo Đài Bất Bại"],
  };

  const classSkills = skills[classId] ?? skills["fighter"];

  while (pHp > 0 && mHp > 0 && round < MAX_ROUNDS) {
    round++;

    // Player attacks first if faster
    const playerFirst = playerSpd >= (monsterAtk / 2);

    const isCritical = Math.random() < 0.15;
    let playerDmg = Math.max(1, playerAtk - monsterDef / 2);
    if (isCritical) playerDmg = Math.floor(playerDmg * 1.8);
    playerDmg = Math.floor(playerDmg * (0.85 + Math.random() * 0.3));

    let monsterDmg = Math.max(1, monsterAtk - playerDef / 2);
    monsterDmg = Math.floor(monsterDmg * (0.85 + Math.random() * 0.3));

    if (playerFirst) {
      mHp = Math.max(0, mHp - playerDmg);
      if (mHp > 0) {
        pHp = Math.max(0, pHp - monsterDmg);
      }
    } else {
      pHp = Math.max(0, pHp - monsterDmg);
      if (pHp > 0) {
        mHp = Math.max(0, mHp - playerDmg);
      }
    }

    const skillIdx = round % 3;
    rounds.push({
      round,
      playerHp: pHp,
      monsterHp: mHp,
      playerDmg,
      monsterDmg,
      playerAction: classSkills[skillIdx] ?? "Tấn Công",
      isCritical,
    });
  }

  return { rounds, victory: mHp <= 0 };
}

router.post("/characters/:characterId/battle", requireAuth, async (req, res) => {
  const characterId = parseInt(req.params.characterId);
  if (isNaN(characterId)) {
    return res.status(400).json({ error: "ID không hợp lệ" });
  }

  const parsed = StartBattleBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Dữ liệu không hợp lệ" });
  }

  const { monsterId } = parsed.data;

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
  const effectiveCharacter = await toCharacterResponse(character);

  const monster = MONSTERS.find((m) => m.id === monsterId);
  if (!monster) {
    return res.status(400).json({ error: "Quái vật không tồn tại" });
  }

  const { rounds, victory } = simulateBattle(
    effectiveCharacter.atk,
    effectiveCharacter.def,
    effectiveCharacter.maxHp,
    effectiveCharacter.spd,
    monster.atk,
    monster.def,
    monster.hp,
    character.classId
  );

  let expGained = 0;
  let goldGained = 0;
  let leveledUp = false;
  let newLevel: number | null = null;

  if (victory) {
    expGained = monster.expReward;
    goldGained = monster.goldReward;
  }

  // Update character
  let newExp = character.experience + expGained;
  let currentLevel = character.level;
  let expToNext = getExpForLevel(currentLevel);

  while (newExp >= expToNext) {
    newExp -= expToNext;
    currentLevel++;
    leveledUp = true;
    newLevel = currentLevel;
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
      kills: character.kills + (victory ? 1 : 0),
      deaths: character.deaths + (victory ? 0 : 1),
    })
    .where(eq(charactersTable.id, characterId))
    .returning();

  await db.insert(battleLogsTable).values({
    characterId,
    monsterId,
    monsterName: monster.name,
    victory,
    expGained,
    goldGained,
  });

  return res.status(200).json({
    victory,
    rounds,
    expGained,
    goldGained,
    leveledUp,
    newLevel,
    character: {
      ...(await toCharacterResponse(updated)),
      experienceToNextLevel: getExpForLevel(currentLevel),
    },
  });
});

export default router;
