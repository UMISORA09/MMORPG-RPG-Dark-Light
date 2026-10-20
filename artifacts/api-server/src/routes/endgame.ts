import { Router } from "express";
import { and, eq } from "drizzle-orm";
import {
  db,
  charactersTable,
  characterItemsTable,
  gmAuditLogsTable,
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
// 2. RANKED ARENA PVP SYSTEM (Đấu Trường 1v1)
// ==============================================================================
const ARENA_RANKS = [
  { name: "Đồng IV", minPoints: 0, title: "Đấu Sĩ Tập Sự" },
  { name: "Đồng I", minPoints: 100, title: "Đấu Sĩ Dũng Cảm" },
  { name: "Bạc III", minPoints: 250, title: "Chiến Binh Ngân Bảng" },
  { name: "Bạc I", minPoints: 500, title: "Dũng Sĩ Tinh Anh" },
  { name: "Vàng III", minPoints: 800, title: "Hoàng Kim Chiến Tướng" },
  { name: "Vàng I", minPoints: 1200, title: "Đại Đấu Sĩ Hoàng Kim" },
  { name: "Kim Cương", minPoints: 1800, title: "Vương Giả Kim Cương" },
  { name: "Chiến Thần", minPoints: 2500, title: "★ Chiến Thần Vô Song ★" },
];

function getArenaRank(honorPoints: number) {
  let rank = ARENA_RANKS[0];
  for (const r of ARENA_RANKS) {
    if (honorPoints >= r.minPoints) {
      rank = r;
    }
  }
  return rank;
}

// In-memory rate limiting cho trận đấu PvP (tối đa 10 trận / phút / nhân vật)
const pvpMatchRateLimits = new Map<number, { count: number; resetAt: number }>();

router.post("/characters/:characterId/pvp/match", requireAuth, async (req, res): Promise<void> => {
  const characterId = Number(req.params.characterId);
  const userId = req.session.userId!;
  const { opponentName, victory = true } = req.body;

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

  const pointChange = victory ? 35 : 10;
  const newPoints = Math.max(0, Number(character.honorPoints || 0) + pointChange);
  const currentRankInfo = getArenaRank(newPoints);
  const prevRank = character.arenaRank || "Đồng IV";

  let newTitle = character.title;
  if (currentRankInfo.name !== prevRank && victory) {
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

  res.status(200).json({
    success: true,
    victory,
    opponentName: opponentName || "Cao Thủ Ảo Mộng",
    pointsGained: pointChange,
    honorPoints: newPoints,
    arenaRank: currentRankInfo.name,
    title: newTitle,
    isRankUp: currentRankInfo.name !== prevRank,
    message: victory
      ? `🎉 Chiến thắng vinh quang trước ${opponentName}! Nhận +${pointChange} Điểm Danh Vọng!`
      : `⚠️ Quyết đấu thất bại trước ${opponentName}. Nhận +${pointChange} Điểm Khích Lệ.`,
  });
});

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
  if (action === "add_gold_stones") {
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
