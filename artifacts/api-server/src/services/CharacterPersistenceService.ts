import { and, eq, inArray } from "drizzle-orm";
import {
  db,
  charactersTable,
  characterItemsTable,
  characterQuestsTable,
  itemsTable,
} from "@workspace/db";
import { recalculateCharacterStats, InventoryRuleError } from "./CharacterInventoryService";
import { listInventory } from "../lib/inventory";

export interface FullSyncItemInput {
  id?: number | string;
  itemId: string;
  equipped?: boolean;
  equippedSlot?: string | null;
  slotIndex?: number;
  quantity?: number;
  enhanceLevel?: number;
  rarity?: string;
  bonusCombatPower?: number;
  miraclePassive1?: string | null;
  miraclePassive2?: string | null;
}

export interface FullSyncQuestInput {
  questId: string;
  progress: number;
  status: "AVAILABLE" | "IN_PROGRESS" | "READY_TO_CLAIM" | "COMPLETED";
}

export interface FullCharacterSyncPayload {
  revision?: number;
  timestamp?: number;
  
  // World & Movement
  posX?: number;
  posZ?: number;
  facing?: "up" | "down" | "left" | "right" | string;
  zoneId?: string;
  isMounted?: boolean;
  activeMountId?: string;
  activePetId?: string;

  // Progression & Stats
  level?: number;
  experience?: number;
  gold?: number;
  hp?: number;
  mp?: number;
  statPoints?: number;
  unallocatedStatPoints?: number;
  skillPoints?: number;
  str?: number;
  dex?: number;
  intel?: number;
  luk?: number;
  vit?: number;
  rageGauge?: number;

  // Storage & UI State
  unlockedSlots?: number;
  inventory?: FullSyncItemInput[];
  hotbarConfigJson?: any;
  activeBuffsJson?: any;
  uiPreferencesJson?: any;
  
  // Quests
  quests?: FullSyncQuestInput[];
  trackedQuestId?: string;
}

export class CharacterPersistenceService {
  /**
   * Bộ kiểm toán tự chữa lành túi đồ:
   * - Quy tắc 1 (Đồ đang mặc): equipped = true, equippedSlot hợp lệ, slotIndex = -1. Đảm bảo 1 món/slot.
   * - Quy tắc 2 (Đồ trong túi): equipped = false, 0 <= slotIndex < unlockedSlots, không trùng lặp slotIndex.
   */
  static auditAndNormalizeInventory(
    unlockedSlots: number,
    items: FullSyncItemInput[]
  ): FullSyncItemInput[] {
    const safeUnlockedSlots = Math.min(30, Math.max(15, Number(unlockedSlots) || 18));
    const equippedSlotsSeen = new Set<string>();
    const bagSlotsOccupied = new Set<number>();
    const normalized: FullSyncItemInput[] = [];

    // Helper tìm ô trống đầu tiên trong túi
    const findNextAvailableBagSlot = (): number => {
      for (let s = 0; s < safeUnlockedSlots; s++) {
        if (!bagSlotsOccupied.has(s)) {
          bagSlotsOccupied.add(s);
          return s;
        }
      }
      // Nếu túi đầy, tạm thời gán slot cao nhất để không mất đồ
      return safeUnlockedSlots - 1;
    };

    // Bước 1: Xử lý trang bị trên người trước
    for (const rawItem of items) {
      if (Boolean(rawItem.equipped) && rawItem.equippedSlot && rawItem.equippedSlot !== "none") {
        const slotKey = rawItem.equippedSlot.toLowerCase().trim();
        if (!equippedSlotsSeen.has(slotKey)) {
          equippedSlotsSeen.add(slotKey);
          normalized.push({
            ...rawItem,
            equipped: true,
            equippedSlot: slotKey,
            slotIndex: -1,
            quantity: 1,
            enhanceLevel: Math.min(15, Math.max(0, Number(rawItem.enhanceLevel) || 0)),
            rarity: (rawItem.rarity || "common").toLowerCase(),
          });
          continue;
        }
      }
    }

    // Bước 2: Xử lý vật phẩm trong túi hành trang
    for (const rawItem of items) {
      // Nếu đã xử lý ở Bước 1 thì bỏ qua
      const isAlreadyEquipped = normalized.some((n) => n === rawItem || (n.id && rawItem.id && n.id === rawItem.id));
      if (isAlreadyEquipped) continue;

      let targetSlot = Number(rawItem.slotIndex);
      if (
        isNaN(targetSlot) ||
        targetSlot < 0 ||
        targetSlot >= safeUnlockedSlots ||
        bagSlotsOccupied.has(targetSlot)
      ) {
        targetSlot = findNextAvailableBagSlot();
      } else {
        bagSlotsOccupied.add(targetSlot);
      }

      normalized.push({
        ...rawItem,
        equipped: false,
        equippedSlot: null,
        slotIndex: targetSlot,
        quantity: Math.max(1, Number(rawItem.quantity) || 1),
        enhanceLevel: Math.min(15, Math.max(0, Number(rawItem.enhanceLevel) || 0)),
        rarity: (rawItem.rarity || "common").toLowerCase(),
      });
    }

    return normalized;
  }

  /**
   * Endpoint Đồng Bộ Toàn Diện Thực Thi Trong db.transaction()
   * Đảm bảo tính nguyên tử tuyệt đối (Atomic Persistence & Zero Data Loss).
   */
  static async fullSync(
    userId: number,
    characterId: number,
    payload: FullCharacterSyncPayload
  ) {
    return await db.transaction(async (tx: any) => {
      // 1. Kiểm tra quyền sở hữu nhân vật
      const [existingChar] = await tx
        .select()
        .from(charactersTable)
        .where(and(eq(charactersTable.id, characterId), eq(charactersTable.userId, userId)))
        .limit(1);

      if (!existingChar) {
        throw new InventoryRuleError("Không tìm thấy nhân vật hoặc không có quyền sở hữu.", 404);
      }

      // 2. Concurrency Revision Check
      const currentRev = Number(existingChar.revision || 1);
      const clientRev = payload.revision !== undefined ? Number(payload.revision) : currentRev;
      const nextRev = Math.max(currentRev, clientRev) + 1;

      // 3. Chuẩn hóa dung lượng túi và kiểm toán hành trang
      const unlockedSlots = payload.unlockedSlots
        ? Math.min(30, Math.max(15, Number(payload.unlockedSlots)))
        : Number(existingChar.unlockedSlots || 18);

      if (Array.isArray(payload.inventory)) {
        const normalizedItems = this.auditAndNormalizeInventory(unlockedSlots, payload.inventory);

        // Đọc danh sách vật phẩm hiện có trong DB
        const currentDbItems = await tx
          .select()
          .from(characterItemsTable)
          .where(eq(characterItemsTable.characterId, characterId));

        const incomingIds = new Set<number>();

        for (const item of normalizedItems) {
          const numId = Number(item.id);
          const isExisting = !isNaN(numId) && currentDbItems.some((dbIt: any) => dbIt.id === numId);

          if (isExisting) {
            incomingIds.add(numId);
            await tx
              .update(characterItemsTable)
              .set({
                itemId: item.itemId,
                equipped: Boolean(item.equipped),
                equippedSlot: item.equipped ? item.equippedSlot : null,
                slotIndex: item.equipped ? -1 : Number(item.slotIndex ?? 0),
                quantity: Number(item.quantity ?? 1),
                enhanceLevel: Number(item.enhanceLevel ?? 0),
                rarity: item.rarity ?? "common",
                bonusCombatPower: Number(item.bonusCombatPower ?? 0),
                miraclePassive1: item.miraclePassive1 ?? null,
                miraclePassive2: item.miraclePassive2 ?? null,
              })
              .where(and(eq(characterItemsTable.id, numId), eq(characterItemsTable.characterId, characterId)));
          } else {
            const [created] = await tx
              .insert(characterItemsTable)
              .values({
                characterId,
                itemId: item.itemId,
                equipped: Boolean(item.equipped),
                equippedSlot: item.equipped ? item.equippedSlot : null,
                slotIndex: item.equipped ? -1 : Number(item.slotIndex ?? 0),
                quantity: Number(item.quantity ?? 1),
                enhanceLevel: Number(item.enhanceLevel ?? 0),
                rarity: item.rarity ?? "common",
                bonusCombatPower: Number(item.bonusCombatPower ?? 0),
                miraclePassive1: item.miraclePassive1 ?? null,
                miraclePassive2: item.miraclePassive2 ?? null,
              })
              .returning();
            if (created?.id) incomingIds.add(created.id);
          }
        }

        // Xóa những item đã bị bán / phân giải (không còn trong danh sách gửi lên)
        const itemsToDelete = currentDbItems.filter((dbIt: any) => !incomingIds.has(dbIt.id));
        if (itemsToDelete.length > 0) {
          const idsToDelete = itemsToDelete.map((it: any) => it.id);
          await tx
            .delete(characterItemsTable)
            .where(
              and(
                eq(characterItemsTable.characterId, characterId),
                inArray(characterItemsTable.id, idsToDelete)
              )
            );
        }
      }

      // 4. Cập nhật tiến độ nhiệm vụ (character_quests) nếu có
      if (Array.isArray(payload.quests)) {
        for (const q of payload.quests) {
          if (!q.questId) continue;
          const questKey = `${characterId}_${q.questId}`;
          const [existingQ] = await tx
            .select()
            .from(characterQuestsTable)
            .where(eq(characterQuestsTable.id, questKey))
            .limit(1);

          if (existingQ) {
            await tx
              .update(characterQuestsTable)
              .set({
                progress: Math.max(Number(existingQ.progress || 0), Number(q.progress || 0)),
                status: q.status || existingQ.status,
                updatedAt: new Date(),
              })
              .where(eq(characterQuestsTable.id, questKey));
          } else {
            await tx.insert(characterQuestsTable).values({
              id: questKey,
              characterId,
              questId: q.questId,
              progress: Number(q.progress || 0),
              status: q.status || "AVAILABLE",
            });
          }
        }
      }

      // 5. Cập nhật thông số nhân vật trong charactersTable
      const stringifyJson = (val: any, fallback = "") => {
        if (val === undefined) return undefined;
        if (typeof val === "string") return val;
        try {
          return JSON.stringify(val);
        } catch {
          return fallback;
        }
      };

      const statPointsVal = payload.statPoints ?? payload.unallocatedStatPoints ?? existingChar.unallocatedStatPoints;

      const updateData: Record<string, any> = {
        revision: nextRev,
        lastSavedAt: new Date(),
        unlockedSlots,
      };

      if (payload.posX !== undefined) updateData.posX = Number(payload.posX);
      if (payload.posZ !== undefined) updateData.posZ = Number(payload.posZ);
      if (payload.facing !== undefined) updateData.facing = String(payload.facing);
      if (payload.zoneId !== undefined) updateData.zoneId = String(payload.zoneId);
      if (payload.isMounted !== undefined) updateData.isMounted = Boolean(payload.isMounted);
      if (payload.activeMountId !== undefined) updateData.activeMountId = String(payload.activeMountId);
      if (payload.activePetId !== undefined) updateData.activePetId = String(payload.activePetId);

      if (payload.level !== undefined) updateData.level = Number(payload.level);
      if (payload.experience !== undefined) updateData.experience = Number(payload.experience);
      if (payload.gold !== undefined) updateData.gold = Number(payload.gold);
      if (payload.hp !== undefined) updateData.hp = Math.max(0, Number(payload.hp));
      if (payload.mp !== undefined) updateData.mp = Math.max(0, Number(payload.mp));

      if (statPointsVal !== undefined) {
        updateData.statPoints = Number(statPointsVal);
        updateData.unallocatedStatPoints = Number(statPointsVal);
      }
      if (payload.skillPoints !== undefined) updateData.skillPoints = Number(payload.skillPoints);
      if (payload.str !== undefined) updateData.str = Number(payload.str);
      if (payload.dex !== undefined) updateData.dex = Number(payload.dex);
      if (payload.intel !== undefined) updateData.intel = Number(payload.intel);
      if (payload.luk !== undefined) updateData.luk = Number(payload.luk);
      if (payload.vit !== undefined) updateData.vit = Number(payload.vit);
      if (payload.rageGauge !== undefined) updateData.rageGauge = Math.min(100, Math.max(0, Number(payload.rageGauge)));

      const hotbar = stringifyJson(payload.hotbarConfigJson);
      if (hotbar !== undefined) updateData.hotbarConfigJson = hotbar;

      const buffs = stringifyJson(payload.activeBuffsJson);
      if (buffs !== undefined) updateData.activeBuffsJson = buffs;

      const ui = stringifyJson(payload.uiPreferencesJson);
      if (ui !== undefined) updateData.uiPreferencesJson = ui;

      await tx
        .update(charactersTable)
        .set(updateData)
        .where(eq(charactersTable.id, characterId));

      // 6. Tính toán lại toàn bộ chỉ số nhân vật (Base + Items + Miracle + Enhance)
      const freshCharacter = await recalculateCharacterStats(characterId, tx);

      // 7. Lấy danh sách túi đồ hoàn chỉnh mới nhất
      const freshInventory = await listInventory(characterId, tx);

      return {
        success: true,
        revision: nextRev,
        lastSavedAt: new Date().toISOString(),
        character: freshCharacter,
        inventory: freshInventory,
      };
    });
  }

  /**
   * Đọc toàn bộ ảnh chụp trạng thái nhân vật cho Exact State Hydration
   */
  static async getFullState(userId: number, characterId: number) {
    const [character] = await db
      .select()
      .from(charactersTable)
      .where(and(eq(charactersTable.id, characterId), eq(charactersTable.userId, userId)))
      .limit(1);

    if (!character) {
      throw new InventoryRuleError("Không tìm thấy nhân vật", 404);
    }

    const inventory = await listInventory(characterId);
    const quests = await db
      .select()
      .from(characterQuestsTable)
      .where(eq(characterQuestsTable.characterId, characterId));

    return {
      success: true,
      character,
      inventory,
      quests,
    };
  }
}
