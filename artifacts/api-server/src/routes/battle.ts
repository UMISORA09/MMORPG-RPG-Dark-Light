import { Router } from "express";
import { db, charactersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { StartBattleBody } from "@workspace/api-zod";
import {
  ensureItemCatalog,
  getMonster,
  toCharacterResponse,
} from "../lib/inventory";
import { requireAuth } from "../middlewares/requireAuth";
import { CombatService } from "../services/CombatService";
import { calculateDamage } from "../rules/combatRules";

const router = Router();

const lastBattleTimestamp = new Map<number, number>();

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
  let pHp = Math.max(1, playerHp);
  let mHp = Math.max(1, monsterHp);
  let round = 0;
  const MAX_ROUNDS = 50;

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
    let playerDmg = Math.max(1, playerAtk - Math.floor(monsterDef * 0.4));
    if (isCritical) playerDmg = Math.floor(playerDmg * 1.8);
    playerDmg = Math.max(1, Math.floor(playerDmg * (0.85 + Math.random() * 0.3)));

    let monsterDmg = Math.max(1, monsterAtk - Math.floor(playerDef * 0.4));
    monsterDmg = Math.max(1, Math.floor(monsterDmg * (0.85 + Math.random() * 0.3)));

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

    const skillIdx = (round - 1) % classSkills.length;
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

  const victory = mHp <= 0 && pHp > 0;
  return { rounds, victory, finalPlayerHp: pHp };
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

  if (character.hp <= 0) {
    return res.status(400).json({ error: "Nhân vật đang tử trận, không thể tiếp tục chiến đấu." });
  }

  const now = Date.now();
  const lastTime = lastBattleTimestamp.get(characterId) || 0;
  if (now - lastTime < 450) {
    return res.status(429).json({ error: "Thao tác chiến đấu quá nhanh. Vui lòng thử lại sau giây lát." });
  }
  lastBattleTimestamp.set(characterId, now);
  res.on("finish", () => {
    lastBattleTimestamp.set(characterId, Date.now());
  });

  await ensureItemCatalog();
  const effectiveCharacter = await toCharacterResponse(character);

  const monsterReward = await getMonster(monsterId);
  if (!monsterReward) {
    return res.status(400).json({ error: "Quái vật không tồn tại" });
  }

  const rawMonster = monsterReward;
  const simResult = simulateBattle(
    effectiveCharacter.atk,
    effectiveCharacter.def,
    effectiveCharacter.hp,
    effectiveCharacter.spd,
    rawMonster.atk,
    rawMonster.def,
    rawMonster.hp,
    character.classId
  );

  let victory = simResult.victory;
  let rounds = simResult.rounds;
  let finalPlayerHp = simResult.finalPlayerHp;

  // Real-time combat verification: Server Authoritative Metrics & Anti-Speedhack
  const metrics = req.body?.metrics;
  if (metrics && typeof metrics === "object") {
    const duration = Number(metrics.durationSeconds) || 0;
    const dmgDealt = Number(metrics.totalDamageDealt) || 0;
    const hitsTaken = Math.max(0, Number(metrics.hitsTaken) || 0);

    // 1. Tính toán sát thương tối đa trên 1 đòn đánh thực tế (kết hợp crit x1.8 và stagger x1.5)
    const maxSingleHitDmg = calculateDamage(effectiveCharacter.atk, rawMonster.def, {
      multiplier: 2.5,
      isCritical: true,
      isStaggered: true,
    }).damage;

    // 2. Tốc độ tấn công vật lý tối đa (hits/giây) dựa trên tốc độ của nhân vật
    const maxAttackRate = Math.min(3.5, Math.max(1.0, (effectiveCharacter.spd || 6) / 5));
    const realisticMaxDps = Math.max(1, maxSingleHitDmg * maxAttackRate);
    const minRealisticDuration = rawMonster.hp / realisticMaxDps;

    // 3. Sát thương quái vật gây ra cho người chơi trên mỗi đòn đánh
    const monsterDmgPerHit = Math.max(1, rawMonster.atk - Math.floor(effectiveCharacter.def * 0.4));
    const monsterAttackRateSec = rawMonster.archetype === "WORLD_BOSS" ? 1.8 : 2.5;
    const minMonsterHitsExpected = duration > 1.5 ? Math.floor(duration / monsterAttackRateSec) : 0;
    const effectiveHitsTaken = Math.max(hitsTaken, Math.floor(minMonsterHitsExpected * 0.5));
    const totalDmgTaken = effectiveHitsTaken * monsterDmgPerHit;
    finalPlayerHp = Math.max(0, effectiveCharacter.hp - totalDmgTaken);

    // 4. Kiểm định tính hợp lệ: Sát thương đủ, thời gian đủ vật lý, và người chơi còn sống
    const isDurationValid = duration >= minRealisticDuration * 0.35 || rawMonster.hp <= 100;
    const isDamageValid = dmgDealt >= rawMonster.hp;
    const isPlayerAlive = finalPlayerHp > 0;

    if (isDamageValid && isDurationValid && isPlayerAlive) {
      victory = true;
      rounds = [
        {
          round: 1,
          playerHp: finalPlayerHp,
          monsterHp: 0,
          playerDmg: dmgDealt,
          monsterDmg: totalDmgTaken,
          playerAction: "Trảm sát trong không gian 2.5D Real-Time",
          isCritical: true,
        },
      ];
    } else {
      // Cheating attempt hoặc người chơi bị hạ gục trước sức mạnh quái vật
      victory = false;
      finalPlayerHp = 0;
      rounds = [
        {
          round: 1,
          playerHp: 0,
          monsterHp: Math.max(0, rawMonster.hp - dmgDealt),
          playerDmg: dmgDealt,
          monsterDmg: totalDmgTaken,
          playerAction: "Thất bại trước uy lực quái vật",
          isCritical: false,
        },
      ];
    }
  }

  let expGained = 0;
  let goldGained = 0;
  if (victory) {
    expGained = monsterReward.expReward;
    goldGained = monsterReward.goldReward;
  } else {
    expGained = 0;
    goldGained = 0;
    finalPlayerHp = 0;
  }

  const savedResult = await CombatService.persistBattleResult({
    userId: req.session.userId!,
    characterId,
    monsterId,
    monsterName: monsterReward.name,
    victory,
    expGained,
    goldGained,
    playerFinalHp: finalPlayerHp,
  });

  return res.status(200).json({
    victory,
    rounds,
    expGained,
    goldGained,
    drops: savedResult.drops || [],
    leveledUp: savedResult.leveledUp,
    newLevel: savedResult.leveledUp ? savedResult.newLevel : null,
    character: {
      ...(await toCharacterResponse(savedResult.character)),
      experienceToNextLevel: savedResult.expToNextLevel,
    },
  });
});

export default router;
