/**
 * Route quản lý Authoritative Encounters (Start, Query Status & Abort)
 */

import { Router } from "express";
import { EncounterService } from "../encounters/encounterService";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

/**
 * Khởi tạo một trận đấu Authoritative Encounter mới
 * POST /api/characters/:characterId/encounters
 */
router.post("/characters/:characterId/encounters", requireAuth, async (req, res) => {
  const characterId = parseInt(req.params.characterId);
  if (isNaN(characterId)) {
    return res.status(400).json({ error: "ID nhân vật không hợp lệ" });
  }

  const { monsterId, spawnId, clientRequestId } = req.body || {};
  if (!monsterId || !spawnId || !clientRequestId) {
    return res.status(400).json({
      error: "Thiếu dữ liệu bắt buộc: monsterId, spawnId, clientRequestId",
    });
  }

  try {
    const result = await EncounterService.createEncounter({
      userId: req.session.userId!,
      characterId,
      monsterId,
      spawnId,
      clientRequestId,
    });

    return res.status(201).json(result);
  } catch (err: any) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message || "Lỗi máy chủ" });
  }
});

/**
 * Tra cứu trạng thái hoặc kết quả terminal của trận đấu
 * GET /api/characters/:characterId/encounters/:encounterId
 */
router.get("/characters/:characterId/encounters/:encounterId", requireAuth, async (req, res) => {
  const characterId = parseInt(req.params.characterId);
  const encounterId = req.params.encounterId;

  if (isNaN(characterId) || !encounterId) {
    return res.status(400).json({ error: "Tham số không hợp lệ" });
  }

  try {
    const result = await EncounterService.getEncounter(characterId, encounterId);
    return res.status(200).json(result);
  } catch (err: any) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message || "Lỗi máy chủ" });
  }
});

/**
 * Hủy bỏ trận đấu thủ công (Abort)
 * POST /api/characters/:characterId/encounters/:encounterId/abort
 */
router.post("/characters/:characterId/encounters/:encounterId/abort", requireAuth, async (req, res) => {
  const characterId = parseInt(req.params.characterId);
  const encounterId = req.params.encounterId;

  if (isNaN(characterId) || !encounterId) {
    return res.status(400).json({ error: "Tham số không hợp lệ" });
  }

  try {
    const result = await EncounterService.finalizeEncounter(encounterId, "aborted");
    return res.status(200).json(result);
  } catch (err: any) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message || "Lỗi máy chủ" });
  }
});

export default router;
