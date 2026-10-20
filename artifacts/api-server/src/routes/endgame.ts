import { Router } from "express";
import { and, eq, desc } from "drizzle-orm";
import {
  db,
  charactersTable,
  characterItemsTable,
  gmAuditLogsTable,
  usersTable,
} from "@workspace/db";
import { requireAuth, requireGMOrAdmin } from "../middlewares/requireAuth";
import { recalculateCharacterStats } from "../services/CharacterInventoryService";

const router = Router();

// ==============================================================================
// 1. STAT ALLOCATION SYSTEM (Phân Bổ Điểm Tiềm Năng)
// ==============================================================================
router.post("/characters/:characterId/allocate-stats", requireAuth, async (req, res): Promise<void> => {
  const characterId = Number(req.params.characterId);
  const userId = req.session.userId!;
  const { str = 0, dex = 0, intel = 0, luk = 0, vit = 0 } = req.body;

  const totalPointsToSpend = Number(str) + Number(dex) + Number(intel) + Number(luk) + Number(vit);
  if (totalPointsToSpend <= 0) {
    res.status(400).json({ error: "Số điểm phân bổ phải lớn hơn 0" });
    return;
  }

  // Chống gian lận kết quả PvP vô lý
  const playerHpPct = req.body.playerHpPercent !== undefined ? Number(req.body.playerHpPercent) : null;
  if (Boolean(victory) && playerHpPct !== null && playerHpPct <= 0) {
    res.status(400).json({ error: "Không thể ghi nhận chiến thắng khi lượng máu bản thân bằng 0." });
    return;
  }

  const [character] = await db
    .select()
    .from(charactersTable)
    .where(and(eq(charactersTable.id, characterId), eq(charactersTable.userId, userId)))
    .limit(1);

  if (!character) {
    res.status(404).json({ error: "Không tìm thấy nhân vật hoặc không có quyền sở hữu" });
    return;
  }

  const availablePoints = Number(character.unallocatedStatPoints || 0);
  if (totalPointsToSpend > availablePoints) {
    res.status(400).json({
      error: `Không đủ điểm tiềm năng! Cần ${totalPointsToSpend} điểm, bạn có ${availablePoints} điểm.`,
    });
    return;
  }

  // Cập nhật các chỉ số cơ bản
  const newStr = Number(character.str || 15) + Number(str);
  const newDex = Number(character.dex || 15) + Number(dex);
  const newIntel = Number(character.intel || 15) + Number(intel);
  const newLuk = Number(character.luk || 10) + Number(luk);
  const newVit = Number(character.vit || 15) + Number(vit);
  const remainingPoints = availablePoints - totalPointsToSpend;

  await db
    .update(charactersTable)
    .set({
      str: newStr,
      dex: newDex,
      intel: newIntel,
      luk: newLuk,
      vit: newVit,
      unallocatedStatPoints: remainingPoints,
    })
    .where(eq(charactersTable.id, characterId));

  // Tính lại toàn bộ chỉ số thực chiến
  const updatedChar = await recalculateCharacterStats(characterId);

  res.status(200).json({
    success: true,
    message: `Phân bổ thành công ${totalPointsToSpend} điểm tiềm năng!`,
    unallocatedStatPoints: remainingPoints,
    stats: {
      str: newStr,
      dex: newDex,
      intel: newIntel,
      luk: newLuk,
      vit: newVit,
      atk: updatedChar.atk,
      matk: updatedChar.matk,
      def: updatedChar.def,
      hp: updatedChar.hp,
      maxHp: updatedChar.maxHp,
      mp: updatedChar.mp,
      maxMp: updatedChar.maxMp,
      combatPower: updatedChar.combatPower,
    },
    character: updatedChar,
  });
});

// ==============================================================================
// ==============================================================================
// 2. RANKED ARENA PVP SYSTEM (Đấu Trường 1v1 & Authentic ELO Ranking)
// ==============================================================================
export const ARENA_RANKS = [
  { name: "Đồng IV", minPoints: 0, title: "Đấu Sĩ Tập Sự" },
  { name: "Đồng I", minPoints: 100, title: "Đấu Sĩ Dũng Cảm" },
  { name: "Bạc III", minPoints: 250, title: "Chiến Binh Ngân Bảng" },
  { name: "Bạc I", minPoints: 500, title: "Dũng Sĩ Tinh Anh" },
  { name: "Vàng III", minPoints: 800, title: "Hoàng Kim Chiến Tướng" },
  { name: "Vàng I", minPoints: 1200, title: "Đại Đấu Sĩ Hoàng Kim" },
  { name: "Kim Cương", minPoints: 1800, title: "Vương Giả Kim Cương" },
  { name: "Chiến Thần", minPoints: 2500, title: "★ Chiến Thần Vô Song ★" },
];

export function getArenaRank(honorPoints: number) {
  let rank = ARENA_RANKS[0];
  for (const r of ARENA_RANKS) {
    if (honorPoints >= r.minPoints) {
      rank = r;
    }
  }
  return rank;
}

const BOT_OPPONENT_RATINGS: Record<string, number> = {
  champ_1: 400, // Chiến Vương Huyết Lôi (Bạc II)
  champ_2: 850, // Bóng Ma Đoạt Mệnh (Vàng III)
  champ_3: 1850, // Thần Khiên Kim Cang (Kim Cương)
  "Chiến Vương Huyết Lôi": 400,
  "Bóng Ma Đoạt Mệnh": 850,
  "Thần Khiên Kim Cang": 1850,
  "Hư Không Kiếm Khách": 800, // Test phase 5 gladiator
  "Chiến Binh Ảo Mộng": 400,
  "Ảo Ảnh": 400,
};

/**
 * Authentic ELO Rating Calculation for PvP Arena
 * Expected score: E = 1 / (1 + 10^((oppRating - playerRating) / 400))
 * Victory: rating increase scales based on opponent rating diff (+16 to +35)
 * Defeat: rating decrease penalty (-12 to -24, cannot fall below 0)
 */
export function calculateEloRatingChange(
  playerRating: number,
  opponentRating: number,
  victory: boolean,
): { pointChange: number; expectedScore: number } {
  const pRating = Math.max(0, playerRating);
  const oRating = Math.max(0, opponentRating);

  const exponent = (oRating - pRating) / 400;
  const expectedScore = 1 / (1 + Math.pow(10, exponent));

  let pointChange = 0;

  if (victory) {
    const kWin = 35;
    const rawDelta = Math.round(kWin * (1 - expectedScore));
    pointChange = Math.max(16, Math.min(35, rawDelta));
  } else {
    const kLoss = 24;
    const rawLoss = Math.round(kLoss * expectedScore);
    const penalty = Math.max(12, Math.min(24, rawLoss));
    pointChange = -penalty;
  }

  return { pointChange, expectedScore };
}

// In-memory rate limiting cho trận đấu PvP (tối đa 10 trận / phút / nhân vật)
const pvpMatchRateLimits = new Map<number, { count: number; resetAt: number }>();

async function handlePvPMatchRequest(req: any, res: any, characterId: number): Promise<void> {
  const userId = req.session.userId!;
  const { opponentId, opponentName, victory = true } = req.body;

  if (!characterId || isNaN(characterId)) {
    res.status(400).json({ error: "Thiếu mã nhân vật (characterId)" });
    return;
  }

  // Chống spam kết quả PvP giả mạo
  const now = Date.now();
  const rateLimit = pvpMatchRateLimits.get(characterId);
  if (!rateLimit || now > rateLimit.resetAt) {
    pvpMatchRateLimits.set(characterId, { count: 1, resetAt: now + 60000 });
  } else {
    if (rateLimit.count >= 10) {
      res.status(429).json({ error: "Thao tác quá nhanh. Vui lòng nghỉ giữa các trận đấu PvP." });
      return;
    }
    rateLimit.count++;
  }

  // Chống gian lận kết quả PvP vô lý khi máu bản thân bằng 0
  const playerHpPct = req.body.playerHpPercent !== undefined ? Number(req.body.playerHpPercent) : null;
  if (Boolean(victory) && playerHpPct !== null && playerHpPct <= 0) {
    res.status(400).json({ error: "Không thể ghi nhận chiến thắng khi lượng máu bản thân bằng 0." });
    return;
  }

  const [character] = await db
    .select()
    .from(charactersTable)
    .where(and(eq(charactersTable.id, characterId), eq(charactersTable.userId, userId)))
    .limit(1);

  if (!character) {
    res.status(404).json({ error: "Không tìm thấy nhân vật hoặc không có quyền sở hữu" });
    return;
  }

  if (character.hp <= 0) {
    res.status(400).json({ error: "Nhân vật đang tử trận, không thể tiếp tục thi đấu Đấu Trường." });
    return;
  }

  // Resolve opponent rating
  let opponentRating = Number(req.body.opponentRating);
  if (isNaN(opponentRating) || opponentRating <= 0) {
    if (opponentId && BOT_OPPONENT_RATINGS[String(opponentId)]) {
      opponentRating = BOT_OPPONENT_RATINGS[String(opponentId)];
    } else if (opponentName && BOT_OPPONENT_RATINGS[String(opponentName)]) {
      opponentRating = BOT_OPPONENT_RATINGS[String(opponentName)];
    } else if (opponentId && !isNaN(Number(opponentId))) {
      try {
        const [oppChar] = await db
          .select({ honorPoints: charactersTable.honorPoints })
          .from(charactersTable)
          .where(eq(charactersTable.id, Number(opponentId)))
          .limit(1);
        if (oppChar) {
          opponentRating = Number(oppChar.honorPoints || 0);
        }
      } catch {}
    }
  }

  if (isNaN(opponentRating) || opponentRating <= 0) {
    opponentRating = Math.max(400, Number(character.honorPoints || 0));
  }

  const prevPoints = Number(character.honorPoints || 0);
  const isVictory = Boolean(victory);
  const { pointChange } = calculateEloRatingChange(prevPoints, opponentRating, isVictory);
  const newPoints = Math.max(0, prevPoints + pointChange);
  const currentRankInfo = getArenaRank(newPoints);
  const prevRank = character.arenaRank || "Đồng IV";

  let newTitle = character.title;
  if (currentRankInfo.name !== prevRank) {
    newTitle = currentRankInfo.title;
  }

  await db
    .update(charactersTable)
    .set({
      honorPoints: newPoints,
      arenaRank: currentRankInfo.name,
      title: newTitle,
    })
    .where(eq(charactersTable.id, characterId));

  const resolvedOpponentName = opponentName || "Cao Thủ Ảo Mộng";
  const isRankUp = newPoints > prevPoints && currentRankInfo.name !== prevRank;
  const isRankDown = newPoints < prevPoints && currentRankInfo.name !== prevRank;

  res.status(200).json({
    success: true,
    victory: isVictory,
    opponentName: resolvedOpponentName,
    pointsGained: pointChange,
    honorAwarded: pointChange,
    oldRating: prevPoints,
    newRating: newPoints,
    honorPoints: newPoints,
    arenaRank: currentRankInfo.name,
    rankTitle: currentRankInfo.title,
    title: newTitle,
    isRankUp,
    isRankDown,
    message: isVictory
      ? `🎉 Chiến thắng vinh quang trước ${resolvedOpponentName}! Nhận +${pointChange} Điểm Danh Vọng!`
      : `⚠️ Quyết đấu thất bại trước ${resolvedOpponentName}. Trừ ${Math.abs(pointChange)} Điểm Danh Vọng.`,
  });
}

router.post("/characters/:characterId/pvp/match", requireAuth, async (req, res): Promise<void> => {
  const characterId = Number(req.params.characterId);
  await handlePvPMatchRequest(req, res, characterId);
});

router.post("/endgame/pvp/match", requireAuth, async (req, res): Promise<void> => {
  const characterId = Number((req.body as any)?.characterId || (req.params as any)?.characterId);
  await handlePvPMatchRequest(req, res, characterId);
});

router.post("/pvp/match", requireAuth, async (req, res): Promise<void> => {
  const characterId = Number((req.body as any)?.characterId || (req.params as any)?.characterId);
  await handlePvPMatchRequest(req, res, characterId);
});

// ==============================================================================
// 2.2. PVP LEADERBOARD ENDPOINT (Bảng Xếp Hạng Đấu Trường PvP ELO)
// ==============================================================================
async function handlePvPLeaderboardRequest(req: any, res: any): Promise<void> {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

  const topCharacters = await db
    .select({
      id: charactersTable.id,
      name: charactersTable.name,
      className: charactersTable.className,
      classId: charactersTable.classId,
      level: charactersTable.level,
      combatPower: charactersTable.combatPower,
      honorPoints: charactersTable.honorPoints,
      arenaRank: charactersTable.arenaRank,
      title: charactersTable.title,
      kills: charactersTable.kills,
      deaths: charactersTable.deaths,
      userId: charactersTable.userId,
    })
    .from(charactersTable)
    .orderBy(desc(charactersTable.honorPoints), desc(charactersTable.combatPower))
    .limit(limit);

  // Guarantee descending sort order across both PostgreSQL and in-memory mock storage
  topCharacters.sort((a: any, b: any) => {
    const diff = (Number(b.honorPoints) || 0) - (Number(a.honorPoints) || 0);
    if (diff !== 0) return diff;
    return (Number(b.combatPower) || 0) - (Number(a.combatPower) || 0);
  });

  const leaderboard = await Promise.all(
    topCharacters.map(async (c: any, idx: number) => {
      let username = "Vô Danh";
      if (c.userId) {
        try {
          const [u] = await db
            .select({ username: usersTable.username })
            .from(usersTable)
            .where(eq(usersTable.id, c.userId))
            .limit(1);
          if (u?.username) username = u.username;
        } catch {}
      }

      const rankInfo = getArenaRank(Number(c.honorPoints || 0));

      return {
        rank: idx + 1,
        characterId: c.id,
        characterName: c.name,
        name: c.name,
        className: c.className,
        classId: c.classId,
        level: c.level,
        combatPower: c.combatPower,
        honorPoints: c.honorPoints,
        rating: c.honorPoints,
        arenaRank: c.arenaRank || rankInfo.name,
        rankTitle: rankInfo.title,
        title: c.title || rankInfo.title,
        kills: c.kills,
        deaths: c.deaths,
        username,
      };
    })
  );

  res.status(200).json({
    success: true,
    total: leaderboard.length,
    leaderboard,
  });
}

router.get("/endgame/pvp/leaderboard", handlePvPLeaderboardRequest);
router.get("/pvp/leaderboard", handlePvPLeaderboardRequest);

// ==============================================================================
// 3. GM ADMIN PANEL COMMANDS (Yêu cầu quyền GM/Admin thực sự)
// ==============================================================================
router.post("/characters/:characterId/gm/action", requireAuth, requireGMOrAdmin, async (req, res): Promise<void> => {
  const characterId = Number(req.params.characterId);
  const userId = req.session.userId!;
  const { action } = req.body;

  const [character] = await db
    .select()
    .from(charactersTable)
    .where(and(eq(charactersTable.id, characterId), eq(charactersTable.userId, userId)))
    .limit(1);

  if (!character) {
    res.status(404).json({ error: "Không tìm thấy nhân vật hoặc không có quyền sở hữu" });
    return;
  }

  // Ghi Audit Log vào hệ thống nhật ký GM
  try {
    await db.insert(gmAuditLogsTable).values({
      userId,
      characterId,
      action: String(action || "unknown"),
      payloadJson: JSON.stringify(req.body || {}),
      ipAddress: req.ip || req.socket.remoteAddress || "unknown",
    });
  } catch (logErr) {
    console.warn("[GM Audit Log] Không thể ghi audit log:", logErr);
  }

  // 0. Set Level trực tiếp (Lv.500 / Lv.999)
  if (action === "set_level") {
    const targetLevel = Math.min(999, Math.max(1, Number(req.body.level) || 1));
    const lvDiff = Math.max(0, targetLevel - character.level);
    const bonusStats = lvDiff * 5;
    const bonusSkill = lvDiff * 1;
    const newPoints = Number(character.unallocatedStatPoints || 0) + bonusStats;
    const newSkillPoints = Number(character.skillPoints || 0) + bonusSkill;

    await db
      .update(charactersTable)
      .set({
        level: targetLevel,
        unallocatedStatPoints: newPoints,
        skillPoints: newSkillPoints,
      })
      .where(eq(charactersTable.id, characterId));

    const updated = await recalculateCharacterStats(characterId);
    res.status(200).json({
      success: true,
      action,
      message: `⭐ [GM ADMIN] Đã thăng cấp trực tiếp lên Lv.${targetLevel} (+${bonusStats} Điểm Tiềm Năng)!`,
      character: updated,
    });
    return;
  }

  // 1. Thêm 10 cấp độ ngay & 50 Điểm Tiềm Năng
  if (action === "add_levels") {
    const newLevel = Math.min(999, character.level + 10);
    const newPoints = Number(character.unallocatedStatPoints || 0) + 50;
    const newSkillPoints = Number(character.skillPoints || 0) + 10;

    await db
      .update(charactersTable)
      .set({
        level: newLevel,
        unallocatedStatPoints: newPoints,
        skillPoints: newSkillPoints,
      })
      .where(eq(charactersTable.id, characterId));

    const updated = await recalculateCharacterStats(characterId);
    res.status(200).json({
      success: true,
      action,
      message: `⚡ [GM ADMIN] Đã tăng cấp lên Lv.${newLevel} và trao 50 Điểm Tiềm Năng!`,
      character: updated,
    });
    return;
  }

  // 2. Thêm 50,000 Vàng & 10 Đá Cường Hóa
  if (action === "add_gold" || action === "add_gold_stones") {
    const newGold = character.gold + 50000;
    await db.update(charactersTable).set({ gold: newGold }).where(eq(charactersTable.id, characterId));

    const [existing] = await db
      .select()
      .from(characterItemsTable)
      .where(
        and(
          eq(characterItemsTable.characterId, characterId),
          eq(characterItemsTable.itemId, "material_enhance_stone"),
          eq(characterItemsTable.equipped, false),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(characterItemsTable)
        .set({ quantity: existing.quantity + 10 })
        .where(eq(characterItemsTable.id, existing.id));
    } else {
      await db.insert(characterItemsTable).values({
        characterId,
        itemId: "material_enhance_stone",
        quantity: 10,
        equipped: false,
        enhanceLevel: 0,
        bonusCombatPower: 0,
      });
    }

    res.status(200).json({
      success: true,
      action,
      message: "🪙 [GM ADMIN] Đã cấp +50,000 Vàng và +10 Đá Cường Hóa Tinh Khiết!",
      gold: newGold,
    });
    return;
  }

  // 3. Spawn Rương Thần Binh Legendary
  if (action === "spawn_legendary") {
    const legendaryWeaponId = `gear_${character.classId}_main_weapon_legendary`;

    await db.insert(characterItemsTable).values({
      characterId,
      itemId: legendaryWeaponId,
      quantity: 1,
      equipped: false,
      enhanceLevel: 7,
      bonusCombatPower: 840,
    });

    res.status(200).json({
      success: true,
      action,
      message: "💎 [GM ADMIN] Đã tạo Thần Binh Legendary (Cam) +7 vào hành trang của bạn!",
    });
    return;
  }

  // 4. Nâng Cấp Trang Bị Đang Mặc Lên +15 Phát Sáng
  if (action === "enhance_max") {
    const equippedGears = await db
      .select()
      .from(characterItemsTable)
      .where(
        and(
          eq(characterItemsTable.characterId, characterId),
          eq(characterItemsTable.equipped, true),
        ),
      );

    for (const gear of equippedGears) {
      await db
        .update(characterItemsTable)
        .set({
          enhanceLevel: 15,
          bonusCombatPower: 1800,
        })
        .where(eq(characterItemsTable.id, gear.id));
    }

    const updated = await recalculateCharacterStats(characterId);
    res.status(200).json({
      success: true,
      action,
      message: "🔥 [GM ADMIN] Toàn bộ trang bị đang mặc đã được cường hóa lên +15 Thần Cấp!",
      character: updated,
    });
    return;
  }

  res.status(400).json({ error: "Lệnh GM không xác định" });
});

export default router;
