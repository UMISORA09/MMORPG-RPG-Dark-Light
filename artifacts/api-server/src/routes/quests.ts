import { Router } from "express";
import { and, eq } from "drizzle-orm";
import {
  db,
  charactersTable,
  questsTable,
  characterQuestsTable,
  characterItemsTable,
  itemsTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { getExpForLevel } from "../data/classes";
import { recalculateCharacterStats } from "../services/CharacterInventoryService";

const router = Router();

// ── GET: Lấy toàn bộ danh sách nhiệm vụ và trạng thái của nhân vật ──
router.get("/characters/:characterId/quests", requireAuth, async (req, res): Promise<void> => {
  const characterId = Number(req.params.characterId);
  const userId = req.session.userId!;

  const [character] = await db
    .select()
    .from(charactersTable)
    .where(and(eq(charactersTable.id, characterId), eq(charactersTable.userId, userId)))
    .limit(1);

  if (!character) {
    res.status(404).json({ error: "Không tìm thấy nhân vật" });
    return;
  }

  // Lấy tất cả template nhiệm vụ sắp xếp theo orderIndex
  const allQuests = await db.select().from(questsTable).orderBy(questsTable.orderIndex);

  // Lấy tất cả tiến độ nhiệm vụ đã có của nhân vật
  const playerQuests = await db
    .select()
    .from(characterQuestsTable)
    .where(eq(characterQuestsTable.characterId, characterId));

  const questMap = new Map<string, any>(playerQuests.map((pq: any) => [pq.questId, pq]));

  // Duyệt và tính trạng thái chuẩn
  const result = allQuests.map((q: any, idx: number) => {
    const existing = questMap.get(q.id);
    if (existing) {
      return {
        ...q,
        progress: existing.progress,
        status: existing.status,
      };
    }

    // Nếu chưa có trong DB:
    // Nhiệm vụ đầu tiên (idx === 0) mặc định là AVAILABLE
    // Các nhiệm vụ sau: nếu nhiệm vụ trước đó đã COMPLETED thì AVAILABLE, ngược lại LOCKED
    let calculatedStatus = "LOCKED";
    if (idx === 0) {
      calculatedStatus = "AVAILABLE";
    } else {
      const prevQuest = allQuests[idx - 1];
      const prevProgress = questMap.get(prevQuest.id);
      if (prevProgress && prevProgress.status === "COMPLETED") {
        calculatedStatus = "AVAILABLE";
      }
    }

    return {
      ...q,
      progress: 0,
      status: calculatedStatus,
    };
  });

  res.status(200).json(result);
});

// ── POST: Tiếp nhận nhiệm vụ mới ──
router.post("/characters/:characterId/quests/:questId/accept", requireAuth, async (req, res): Promise<void> => {
  const characterId = Number(req.params.characterId);
  const questId = req.params.questId;
  const userId = req.session.userId!;

  const [character] = await db
    .select()
    .from(charactersTable)
    .where(and(eq(charactersTable.id, characterId), eq(charactersTable.userId, userId)))
    .limit(1);

  if (!character) {
    res.status(404).json({ error: "Không tìm thấy nhân vật" });
    return;
  }

  const [quest] = await db.select().from(questsTable).where(eq(questsTable.id, questId)).limit(1);
  if (!quest) {
    res.status(404).json({ error: "Nhiệm vụ không tồn tại" });
    return;
  }

  const recordId = `${characterId}_${questId}`;
  const [existing] = await db
    .select()
    .from(characterQuestsTable)
    .where(eq(characterQuestsTable.id, recordId))
    .limit(1);

  if (existing && existing.status !== "AVAILABLE") {
    res.status(400).json({ error: `Nhiệm vụ đang ở trạng thái ${existing.status}` });
    return;
  }

  // Tự động hoàn thành ngay nếu là dạng nói chuyện NPC
  const isTalkNPC = quest.objectiveType === "TALK_NPC";
  const newStatus = isTalkNPC ? "READY_TO_CLAIM" : "IN_PROGRESS";
  const newProgress = isTalkNPC ? 1 : 0;

  if (existing) {
    await db
      .update(characterQuestsTable)
      .set({ status: newStatus, progress: newProgress, updatedAt: new Date() })
      .where(eq(characterQuestsTable.id, recordId));
  } else {
    await db.insert(characterQuestsTable).values({
      id: recordId,
      characterId,
      questId,
      progress: newProgress,
      status: newStatus,
      updatedAt: new Date(),
    });
  }

  res.status(200).json({
    success: true,
    questId,
    status: newStatus,
    progress: newProgress,
    message: isTalkNPC
      ? "Đã trò chuyện thành công! Hãy nhận phần thưởng."
      : "Đã tiếp nhận nhiệm vụ thành công!",
  });
});

// ── POST: Cập nhật tiến độ nhiệm vụ (Đánh quái, Nhặt đồ, Cường hóa, Chế tạo) ──
router.post("/characters/:characterId/quests/progress", requireAuth, async (req, res): Promise<void> => {
  const characterId = Number(req.params.characterId);
  const userId = req.session.userId!;
  const { objectiveType, targetId, count = 1 } = req.body;

  const [character] = await db
    .select()
    .from(charactersTable)
    .where(and(eq(charactersTable.id, characterId), eq(charactersTable.userId, userId)))
    .limit(1);

  if (!character) {
    res.status(404).json({ error: "Không tìm thấy nhân vật" });
    return;
  }

  // Tìm các nhiệm vụ đang IN_PROGRESS khớp với objectiveType
  const activeQuests = await db
    .select({
      progressId: characterQuestsTable.id,
      currentProgress: characterQuestsTable.progress,
      status: characterQuestsTable.status,
      questId: questsTable.id,
      title: questsTable.title,
      targetId: questsTable.targetId,
      requiredCount: questsTable.requiredCount,
      objectiveType: questsTable.objectiveType,
    })
    .from(characterQuestsTable)
    .innerJoin(questsTable, eq(characterQuestsTable.questId, questsTable.id))
    .where(
      and(
        eq(characterQuestsTable.characterId, characterId),
        eq(characterQuestsTable.status, "IN_PROGRESS"),
      ),
    );

  const updatedQuests = [];

  for (const q of activeQuests) {
    // Kiểm tra khớp objectiveType
    let isMatch = false;
    if (q.objectiveType === objectiveType) {
      if (q.targetId === "any_equipment" || q.targetId === "rare_gear") {
        isMatch = true;
      } else if (!targetId || q.targetId === targetId) {
        isMatch = true;
      }
    }

    if (isMatch) {
      const nextProgress = Math.min(q.requiredCount, q.currentProgress + Number(count));
      const isComplete = nextProgress >= q.requiredCount;
      const nextStatus = isComplete ? "READY_TO_CLAIM" : "IN_PROGRESS";

      await db
        .update(characterQuestsTable)
        .set({ progress: nextProgress, status: nextStatus, updatedAt: new Date() })
        .where(eq(characterQuestsTable.id, q.progressId));

      updatedQuests.push({
        questId: q.questId,
        title: q.title,
        progress: nextProgress,
        requiredCount: q.requiredCount,
        status: nextStatus,
      });
    }
  }

  res.status(200).json({ success: true, updatedQuests });
});

// ── POST: Nhận thưởng hoàn thành nhiệm vụ ──
router.post("/characters/:characterId/quests/:questId/claim", requireAuth, async (req, res): Promise<void> => {
  const characterId = Number(req.params.characterId);
  const questId = req.params.questId;
  const userId = req.session.userId!;

  const [character] = await db
    .select()
    .from(charactersTable)
    .where(and(eq(charactersTable.id, characterId), eq(charactersTable.userId, userId)))
    .limit(1);

  if (!character) {
    res.status(404).json({ error: "Không tìm thấy nhân vật" });
    return;
  }

  const [quest] = await db.select().from(questsTable).where(eq(questsTable.id, questId)).limit(1);
  if (!quest) {
    res.status(404).json({ error: "Nhiệm vụ không tồn tại" });
    return;
  }

  const recordId = `${characterId}_${questId}`;
  const [existing] = await db
    .select()
    .from(characterQuestsTable)
    .where(eq(characterQuestsTable.id, recordId))
    .limit(1);

  if (!existing || existing.status !== "READY_TO_CLAIM") {
    res.status(400).json({ error: "Nhiệm vụ chưa hoàn thành hoặc đã được nhận thưởng!" });
    return;
  }

  // 1. Cập nhật trạng thái nhiệm vụ hiện tại thành COMPLETED
  await db
    .update(characterQuestsTable)
    .set({ status: "COMPLETED", updatedAt: new Date() })
    .where(eq(characterQuestsTable.id, recordId));

  // 2. Mở khóa nhiệm vụ kế tiếp (nếu có) thành AVAILABLE
  if (quest.nextQuestId) {
    const nextRecordId = `${characterId}_${quest.nextQuestId}`;
    const [nextExist] = await db
      .select()
      .from(characterQuestsTable)
      .where(eq(characterQuestsTable.id, nextRecordId))
      .limit(1);

    if (!nextExist) {
      await db.insert(characterQuestsTable).values({
        id: nextRecordId,
        characterId,
        questId: quest.nextQuestId,
        progress: 0,
        status: "AVAILABLE",
        updatedAt: new Date(),
      });
    }
  }

  // 3. Tính EXP & Vàng nhận thưởng, thăng cấp nếu đủ điều kiện
  let newExp = character.experience + quest.rewardExp;
  let newLevel = character.level;
  let expRequired = getExpForLevel(newLevel);

  while (newExp >= expRequired && newLevel < 50) {
    newExp -= expRequired;
    newLevel += 1;
    expRequired = getExpForLevel(newLevel);
  }

  const newGold = character.gold + quest.rewardGold;

  // 4. Trao vật phẩm thưởng vào túi đồ (nếu có)
  let rewardedItem = null;
  if (quest.rewardItemId) {
    const count = quest.rewardItemCount || 1;
    const [existingItem] = await db
      .select()
      .from(characterItemsTable)
      .where(
        and(
          eq(characterItemsTable.characterId, characterId),
          eq(characterItemsTable.itemId, quest.rewardItemId),
          eq(characterItemsTable.equipped, false),
        ),
      )
      .limit(1);

    if (existingItem) {
      await db
        .update(characterItemsTable)
        .set({ quantity: existingItem.quantity + count })
        .where(eq(characterItemsTable.id, existingItem.id));
    } else {
      await db.insert(characterItemsTable).values({
        characterId,
        itemId: quest.rewardItemId,
        quantity: count,
        equipped: false,
        enhanceLevel: 0,
        bonusCombatPower: 0,
      });
    }

    rewardedItem = {
      itemId: quest.rewardItemId,
      name: quest.rewardItemName || quest.rewardItemId,
      count,
    };
  }

  // Cập nhật nhân vật
  await db
    .update(charactersTable)
    .set({
      experience: newExp,
      level: newLevel,
      gold: newGold,
    })
    .where(eq(charactersTable.id, characterId));

  const updatedCharacter = await recalculateCharacterStats(characterId);

  res.status(200).json({
    success: true,
    questId,
    rewards: {
      exp: quest.rewardExp,
      gold: quest.rewardGold,
      item: rewardedItem,
      levelUp: newLevel > character.level,
      newLevel,
    },
    character: {
      id: updatedCharacter.id,
      level: updatedCharacter.level,
      experience: updatedCharacter.experience,
      gold: updatedCharacter.gold,
      combatPower: updatedCharacter.combatPower,
    },
  });
});

export default router;
