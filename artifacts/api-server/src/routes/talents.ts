import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { db, charactersTable } from "@workspace/db";
import { requireAuth, getAuthUserId } from "../middlewares/requireAuth";
import { recalculateCharacterStats } from "../services/CharacterInventoryService";

const router = Router();

// Định nghĩa danh xưng chuyển chức theo từng hệ phái & bậc
export const AWAKENING_TITLES: Record<string, string[]> = {
  assassin: ["Thích Khách", "Ảnh Vũ Sát Thần", "Huyết Nguyệt Ma Tôn", "Chân Thần Huyết Nguyệt"],
  warrior: ["Võ Sĩ", "Cuồng Long Chiến Tướng", "Chiến Thần Bất Bại", "Chân Thần Chiến Long"],
  tank: ["Hộ Vệ", "Kim Cương Thiết Giáp", "Thánh Khiên Bất Diệt", "Chân Thần Bất Hoại"],
  gunner: ["Thiện Xạ", "Pháo Thủ Quỹ Đạo", "Thiên Phạt Thần Cơ", "Chân Thần Tinh Tú"],
};

export function getAwakeningTitle(classId: string, tier: number): string {
  const titles = AWAKENING_TITLES[classId] || AWAKENING_TITLES.warrior;
  return titles[Math.min(titles.length - 1, Math.max(0, tier))] || "Chiến Binh";
}

// ── 1. ĐỘT PHÁ THỨC TỈNH CHUYỂN CHỨC ──
router.post("/characters/:characterId/awakening/upgrade", requireAuth, async (req, res): Promise<void> => {
  const characterId = Number(req.params.characterId);
  const userId = getAuthUserId(req);

  const [char] = await db
    .select()
    .from(charactersTable)
    .where(and(eq(charactersTable.id, characterId), eq(charactersTable.userId, userId)))
    .limit(1);

  if (!char) {
    res.status(404).json({ error: "Không tìm thấy nhân vật" });
    return;
  }

  const currentTier = Math.min(3, Math.max(0, Number(char.awakeningTier) || 0));
  if (currentTier >= 3) {
    res.status(400).json({ error: "Nhân vật đã đạt cảnh giới Thức Tỉnh tối cao (Bậc 3 - Thần Hóa)!" });
    return;
  }

  const nextTier = currentTier + 1;
  const requiredLevel = nextTier * 5; // Bậc 1: Lv.5, Bậc 2: Lv.10, Bậc 3: Lv.15
  if (char.level < requiredLevel) {
    res.status(400).json({ error: `Cần đạt cấp độ ${requiredLevel} để đột phá Chuyển Chức Bậc ${nextTier} (Cấp hiện tại: ${char.level})` });
    return;
  }

  const goldCosts = [0, 1000, 5000, 15000];
  const cost = goldCosts[nextTier] || 5000;
  if (char.gold < cost) {
    res.status(400).json({ error: `Không đủ Vàng để đột phá (Cần ${cost.toLocaleString()} Vàng)` });
    return;
  }

  await db
    .update(charactersTable)
    .set({
      awakeningTier: nextTier,
      gold: char.gold - cost,
    })
    .where(eq(charactersTable.id, characterId));

  const updatedChar = await recalculateCharacterStats(characterId);
  const title = getAwakeningTitle(char.classId, nextTier);

  res.status(200).json({
    success: true,
    message: `⚡ CHÚC MỪNG! Đột phá thành công Bậc ${nextTier} — Danh hiệu [${title}], toàn bộ chỉ số tăng +20%!`,
    awakeningTier: nextTier,
    title,
    character: updatedChar,
  });
});

// ── 2. CỘNG ĐIỂM CÂY THIÊN PHÚ ──
router.post("/characters/:characterId/talents/allocate", requireAuth, async (req, res): Promise<void> => {
  const characterId = Number(req.params.characterId);
  const userId = getAuthUserId(req);
  const { talentKey } = req.body;

  if (!talentKey) {
    res.status(400).json({ error: "Thiếu talentKey" });
    return;
  }

  const [char] = await db
    .select()
    .from(charactersTable)
    .where(and(eq(charactersTable.id, characterId), eq(charactersTable.userId, userId)))
    .limit(1);

  if (!char) {
    res.status(404).json({ error: "Không tìm thấy nhân vật" });
    return;
  }

  const availablePoints = Number(char.skillPoints) || 0;
  if (availablePoints <= 0) {
    res.status(400).json({ error: "Không còn điểm Thiên Phú để nâng cấp! Hãy lên cấp để nhận thêm điểm." });
    return;
  }

  let talents: Record<string, number> = {};
  try {
    talents = typeof char.talentsJson === "string" ? JSON.parse(char.talentsJson) : (char.talentsJson || {});
  } catch {
    talents = {};
  }

  const currentPoints = Number(talents[talentKey]) || 0;
  if (currentPoints >= 5) {
    res.status(400).json({ error: "Kỹ năng thiên phú này đã đạt cấp tối đa (5/5)!" });
    return;
  }

  talents[talentKey] = currentPoints + 1;

  await db
    .update(charactersTable)
    .set({
      skillPoints: availablePoints - 1,
      talentsJson: JSON.stringify(talents),
    })
    .where(eq(charactersTable.id, characterId));

  const updatedChar = await recalculateCharacterStats(characterId);

  res.status(200).json({
    success: true,
    message: `🌟 Nâng cấp thiên phú [${talentKey}] lên cấp ${currentPoints + 1}!`,
    talents,
    skillPoints: availablePoints - 1,
    character: updatedChar,
  });
});

// ── 3. TẨY ĐIỂM CÂY THIÊN PHÚ ──
router.post("/characters/:characterId/talents/reset", requireAuth, async (req, res): Promise<void> => {
  const characterId = Number(req.params.characterId);
  const userId = getAuthUserId(req);

  const [char] = await db
    .select()
    .from(charactersTable)
    .where(and(eq(charactersTable.id, characterId), eq(charactersTable.userId, userId)))
    .limit(1);

  if (!char) {
    res.status(404).json({ error: "Không tìm thấy nhân vật" });
    return;
  }

  const resetCost = 500;
  if (char.gold < resetCost) {
    res.status(400).json({ error: `Cần ${resetCost} Vàng để tẩy điểm thiên phú!` });
    return;
  }

  let talents: Record<string, number> = {};
  try {
    talents = typeof char.talentsJson === "string" ? JSON.parse(char.talentsJson) : (char.talentsJson || {});
  } catch {
    talents = {};
  }

  // Thu hồi toàn bộ điểm đã cộng
  let refundedPoints = 0;
  for (const k of Object.keys(talents)) {
    refundedPoints += Number(talents[k]) || 0;
  }

  const totalSkillPoints = (Number(char.skillPoints) || 0) + refundedPoints;

  await db
    .update(charactersTable)
    .set({
      skillPoints: totalSkillPoints,
      talentsJson: "{}",
      gold: char.gold - resetCost,
    })
    .where(eq(charactersTable.id, characterId));

  const updatedChar = await recalculateCharacterStats(characterId);

  res.status(200).json({
    success: true,
    message: `🔄 Đã tẩy toàn bộ điểm thiên phú! Hoàn lại ${refundedPoints} điểm vào quỹ điểm tự do.`,
    talents: {},
    skillPoints: totalSkillPoints,
    character: updatedChar,
  });
});

export default router;
