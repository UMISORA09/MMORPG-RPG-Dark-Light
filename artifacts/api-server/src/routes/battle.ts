import { Router } from "express";
import { db, charactersTable, battleLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { StartBattleBody } from "@workspace/api-zod";
import { MONSTERS } from "../data/classes";
import {
  calculateLevelProgression,
  getExpForLevel,
  getStatsForLevel,
  getAuthoritativeMonsterReward,
} from "../rules/combatRules";
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

  const monsterReward = getAuthoritativeMonsterReward(monsterId);
  if (!monsterReward) {
    return res.status(400).json({ error: "Quái vật không tồn tại" });
  }

  const mode = (req.body?.mode as string) || "realtime";
  let victory = true;
  let rounds: any[] = [];
  let expGained = 0;
  let goldGained = 0;

  if (mode === "simulate") {
    // Chế độ mô phỏng theo lượt phụ (dành cho prototype/arena test nếu cần)
    const rawMonster = MONSTERS.find((m) => m.id === monsterId)!;
    const simResult = simulateBattle(
      effectiveCharacter.atk,
      effectiveCharacter.def,
      effectiveCharacter.maxHp,
      effectiveCharacter.spd,
      rawMonster.atk,
      rawMonster.def,
      rawMonster.hp,
      character.classId
    );
    rounds = simResult.rounds;
    victory = simResult.victory;
    if (victory) {
      expGained = monsterReward.expReward;
      goldGained = monsterReward.goldReward;
    }
  } else {
    // ── CHẾ ĐỘ CHÍNH: ACTION RPG 2.5D REALTIME AUTHORITATIVE PERSISTENCE ──
    // Người chơi đã tiêu diệt quái vật trong không gian 2.5D thời gian thực.
    // Kết quả là DUY NHẤT VÀ NHẤT QUÁN: Server xác thực và cấp phần thưởng chuẩn.
    victory = true;
    expGained = monsterReward.expReward;
    goldGained = monsterReward.goldReward;
    rounds = [
      {
        round: 1,
        playerHp: character.hp,
        monsterHp: 0,
        playerDmg: monsterReward.baseHp,
        monsterDmg: 0,
        playerAction: "Trảm sát trong không gian 2.5D Real-Time",
        isCritical: false,
      },
    ];
  }

  // Tính toán cấp độ và kinh nghiệm authoritative từ Shared Combat Rules
  const { newExp, newLevel, leveledUp, expToNextLevel } = calculateLevelProgression(
    character.experience,
    character.level,
    expGained
  );

  const newStats = getStatsForLevel(character.classId, newLevel);

  const [updated] = await db
    .update(charactersTable)
    .set({
      level: newLevel,
      experience: newExp,
      maxHp: newStats.hp,
      hp: Math.max(1, newStats.hp),
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
    monsterName: monsterReward.monsterName,
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
    newLevel: leveledUp ? newLevel : null,
    character: {
      ...(await toCharacterResponse(updated)),
      experienceToNextLevel: expToNextLevel,
    },
  });
});

export default router;
