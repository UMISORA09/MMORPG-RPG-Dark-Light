import { and, eq, inArray } from "drizzle-orm";
import {
  db,
  charactersTable,
  characterItemsTable,
  characterQuestsTable,
  itemsTable,
} from "@workspace/db";
import { recalculateCharacterStats, InventoryRuleError } from "./CharacterInventoryService";
import { listInventory, getItem } from "../lib/inventory";

export interface FullSyncItemInput {
  ownershipId?: number | string;
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
  socketsJson?: any;
  reforgeStatsJson?: any;
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

  // MMORPG Core Systems: Awakening, Talents, Codex, Auto-Combat
  awakeningTier?: number;
  talentsJson?: any;
  codexUnlockedJson?: any;
  autoCombatSettingsJson?: any;

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

      // 2. Concurrency Revision Check (Optimistic Concurrency Control - Strict CAS)
      const currentRev = Number(existingChar.revision || 1);
      if (payload.revision !== undefined) {
        const clientRev = Number(payload.revision);
        if (!Number.isInteger(clientRev) || clientRev !== currentRev) {
          throw new InventoryRuleError(
            `Xung đột phiên bản dữ liệu (Optimistic Concurrency Conflict): Máy chủ đang ở rev ${currentRev}, dữ liệu gửi lên ở rev ${payload.revision}. Vui lòng đồng bộ lại trạng thái.`,
            409
          );
        }
      }
      const nextRev = currentRev + 1;

      // 3. Chuẩn hóa dung lượng túi và kiểm toán hành trang (Server Authority)
      // Dung lượng túi do server kiểm soát, client không thể tự hack unlockedSlots
      const unlockedSlots = Number(existingChar.unlockedSlots || 18);

      if (Array.isArray(payload.inventory)) {
        // Đọc danh sách vật phẩm hiện có thực tế trong DB của nhân vật
        const currentDbItems = await tx
          .select()
          .from(characterItemsTable)
          .where(eq(characterItemsTable.characterId, characterId));

        const dbItemMap = new Map((currentDbItems as any[]).map((it: any) => [it.id, it]));

        // 🛡️ BẢO VỆ TOÀN VẸN TÚI ĐỒ (INVENTORY INTEGRITY):
        // 1. Tuyệt đối KHÔNG INSERT vật phẩm mới từ client (Chặn Fake Item Injection).
        // 2. Tuyệt đối KHÔNG thay đổi itemId, quantity, enhanceLevel, rarity từ client (Chặn Item Tampering).
        // 3. Tuyệt đối KHÔNG DELETE vật phẩm khi snapshot thiếu bản ghi (Chặn Stale Snapshot Loss).
        // 4. Chỉ cho phép cập nhật vị trí sắp xếp (slotIndex) và trạng thái trang bị (equipped) của các item ĐÃ TỒN TẠI.
        for (const rawItem of payload.inventory) {
          const numId = Number(rawItem.ownershipId !== undefined ? rawItem.ownershipId : rawItem.id);
          if (isNaN(numId) || !dbItemMap.has(numId)) {
            continue;
          }

          const existingDbItem = dbItemMap.get(numId);
          const isEquipped = Boolean(rawItem.equipped);
          let targetSlot = Number(rawItem.slotIndex);

          if (isEquipped) {
            targetSlot = -1;
          } else if (isNaN(targetSlot) || targetSlot < 0 || targetSlot >= unlockedSlots) {
            targetSlot = existingDbItem.slotIndex;
          }

          const updateItemPayload: Record<string, any> = {
            equipped: isEquipped,
            slotIndex: targetSlot,
          };

          if (isEquipped && rawItem.equippedSlot && rawItem.equippedSlot !== "none") {
            updateItemPayload.equippedSlot = String(rawItem.equippedSlot).toLowerCase().trim();
          } else if (!isEquipped) {
            updateItemPayload.equippedSlot = null;
          }

          await tx
            .update(characterItemsTable)
            .set(updateItemPayload)
            .where(
              and(
                eq(characterItemsTable.id, numId),
                eq(characterItemsTable.characterId, characterId)
              )
            );
        }
      }

      // 4. Quản lý nhiệm vụ (Quest Authority)
      // 🛡️ BẢO VỆ TIẾN TRÌNH NHIỆM VỤ:
      // Tuyệt đối KHÔNG cho phép client tự thay đổi trạng thái (COMPLETED/READY_TO_CLAIM) hoặc progress qua FullSync.
      // Tiến độ nhiệm vụ chỉ được ghi nhận bởi server khi tiêu diệt quái (CombatService) hoặc trả thưởng (quests.ts).
      
      // 5. Cập nhật thông số nhân vật trong charactersTable
      // Server-authoritative progression fields (Gold, EXP, Level, Kills, Stats, Slots) are strictly protected
      const stringifyJson = (val: any, fallback = "") => {
        if (val === undefined) return undefined;
        if (typeof val === "string") return val;
        try {
          return JSON.stringify(val);
        } catch {
          return fallback;
        }
      };

      const updateData: Record<string, any> = {
        revision: nextRev,
        lastSavedAt: new Date(),
      };

      if (payload.posX !== undefined && Number.isFinite(Number(payload.posX))) {
        updateData.posX = Math.min(10000, Math.max(-10000, Math.round(Number(payload.posX))));
      }
      if (payload.posZ !== undefined && Number.isFinite(Number(payload.posZ))) {
        updateData.posZ = Math.min(10000, Math.max(-10000, Math.round(Number(payload.posZ))));
      }
      if (payload.facing !== undefined) updateData.facing = String(payload.facing);
      if (payload.zoneId !== undefined && String(payload.zoneId).trim()) {
        updateData.zoneId = String(payload.zoneId).trim().slice(0, 64);
      }
      if (payload.isMounted !== undefined) updateData.isMounted = Boolean(payload.isMounted);
      if (payload.activeMountId !== undefined) updateData.activeMountId = String(payload.activeMountId).slice(0, 64);
      if (payload.activePetId !== undefined) updateData.activePetId = String(payload.activePetId).slice(0, 64);

      if (payload.hp !== undefined && !isNaN(Number(payload.hp))) {
        updateData.hp = Math.min(Number(existingChar.maxHp || 100), Math.max(0, Math.round(Number(payload.hp))));
      }
      if (payload.mp !== undefined && !isNaN(Number(payload.mp))) {
        updateData.mp = Math.min(Number(existingChar.maxMp || 100), Math.max(0, Math.round(Number(payload.mp))));
      }

      const hotbar = stringifyJson(payload.hotbarConfigJson);
      if (hotbar !== undefined) updateData.hotbarConfigJson = hotbar;

      const uiPref = stringifyJson(payload.uiPreferencesJson);
      if (uiPref !== undefined) updateData.uiPreferencesJson = uiPref;

      const autoCombat = stringifyJson(payload.autoCombatSettingsJson);
      if (autoCombat !== undefined) updateData.autoCombatSettingsJson = autoCombat;

      // 🛡️ ATOMIC COMPARE-AND-SWAP: Chỉ cập nhật nếu revision hiện tại trong DB vẫn đúng là currentRev
      const updatedChars = await tx
        .update(charactersTable)
        .set(updateData)
        .where(
          and(
            eq(charactersTable.id, characterId),
            eq(charactersTable.userId, userId),
            eq(charactersTable.revision, currentRev)
          )
        )
        .returning();

      if (!updatedChars || updatedChars.length === 0) {
        throw new InventoryRuleError(
          "Xung đột phiên bản đồng thời (Atomic CAS Collision): Dữ liệu nhân vật đã bị thay đổi bởi tiến trình khác.",
          409
        );
      }

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
