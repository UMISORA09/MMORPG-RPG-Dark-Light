import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { db, charactersTable } from "@workspace/db";
import { requireAuth, getAuthUserId } from "../middlewares/requireAuth";
import { recalculateCharacterStats } from "../services/CharacterInventoryService";

const router = Router();

// ── 1. ĐỌC THÔNG TIN ĐỒ GIÁM CỦA NHÂN VẬT ──
router.get("/characters/:characterId/codex", requireAuth, async (req, res): Promise<void> => {
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

  let codexUnlocked: string[] = [];
  try {
    codexUnlocked = typeof char.codexUnlockedJson === "string" ? JSON.parse(char.codexUnlockedJson) : (char.codexUnlockedJson || []);
  } catch {
    codexUnlocked = [];
  }

  res.status(200).json({
    success: true,
    codexUnlocked,
  });
});

// ── 2. KÍCH HOẠT NHẬN THƯỞNG ĐỒ GIÁM VĨNH VIỄN ──
router.post("/characters/:characterId/codex/claim", requireAuth, async (req, res): Promise<void> => {
  const characterId = Number(req.params.characterId);
  const userId = getAuthUserId(req);
  const { codexEntryId } = req.body;

  if (!codexEntryId) {
    res.status(400).json({ error: "Thiếu codexEntryId" });
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

  let codexUnlocked: string[] = [];
  try {
    codexUnlocked = typeof char.codexUnlockedJson === "string" ? JSON.parse(char.codexUnlockedJson) : (char.codexUnlockedJson || []);
  } catch {
    codexUnlocked = [];
  }

  if (codexUnlocked.includes(codexEntryId)) {
    res.status(400).json({ error: "Mục đồ giám này đã được kích hoạt trước đó!" });
    return;
  }

  codexUnlocked.push(codexEntryId);

  await db
    .update(charactersTable)
    .set({ codexUnlockedJson: JSON.stringify(codexUnlocked) })
    .where(eq(charactersTable.id, characterId));

  const updatedChar = await recalculateCharacterStats(characterId);

  res.status(200).json({
    success: true,
    message: `✨ Đã kích hoạt Đồ Giám [${codexEntryId}]! Nhận vĩnh viễn +20 HP, +3 ATK, +3 DEF và +100 Lực Chiến!`,
    codexUnlocked,
    character: updatedChar,
  });
});

export default router;
