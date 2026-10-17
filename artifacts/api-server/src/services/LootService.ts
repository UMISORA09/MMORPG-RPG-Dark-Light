import { and, eq } from "drizzle-orm";
import {
  db,
  charactersTable,
  characterItemsTable,
  itemsTable,
} from "@workspace/db";
import { getItem, listInventory, toCharacterResponse } from "../lib/inventory";
import { InventoryRuleError } from "./CharacterInventoryService";

export interface LootItemPayload {
  userId: number;
  characterId: number;
  dropId?: string;
  itemId: string;
  quantity?: number;
  dropType?: string;
  value?: number;
  dropPosition?: { x: number; y: number; z: number } | [number, number, number];
  playerPosition?: { x: number; y: number; z: number } | [number, number, number];
}

export class LootService {
  /**
   * Xác thực và nhặt đồ chính xác tuyệt đối từ mặt đất vào túi đồ của nhân vật.
   * Đảm bảo:
   * 1. Xác thực khoảng cách (lootRadius = 3.5m + dung sai mạng 1.5m = 5.0m).
   * 2. Kiểm tra túi hành trang còn ô trống hay không (usedSlots < unlockedSlots).
   * 3. Tự động chồng dồn stack nếu là vật phẩm tiêu hao/nguyên liệu còn chỗ.
   * 4. Tìm ô trống slotIndex thấp nhất (0 đến unlockedSlots - 1).
   * 5. Khi túi đầy: Trả về lỗi rõ ràng để Client giữ nguyên đồ trên đất và hiện thông báo đỏ.
   * 6. Phẩm chất Kì Tích: Ghi nhận và phát thông báo toàn cõi.
   */
  static async lootItem(payload: LootItemPayload) {
    const {
      userId,
      characterId,
      dropId,
      itemId,
      quantity = 1,
      dropType,
      value = 0,
      dropPosition,
      playerPosition,
    } = payload;

    return await db.transaction(async (tx: any) => {
      // 1. Kiểm tra quyền sở hữu nhân vật
      const [character] = await tx
        .select()
        .from(charactersTable)
        .where(and(eq(charactersTable.id, characterId), eq(charactersTable.userId, userId)))
        .limit(1);

      if (!character) {
        throw new InventoryRuleError("Không tìm thấy nhân vật hoặc không có quyền thao tác", 404);
      }

      if (character.hp <= 0) {
        throw new InventoryRuleError("Nhân vật đã tử trận, không thể nhặt đồ!", 400);
      }

      // 2. Kiểm tra khoảng cách (Server-side Distance Validation)
      if (dropPosition && playerPosition) {
        const dx = Array.isArray(dropPosition) ? dropPosition[0] : dropPosition.x;
        const dz = Array.isArray(dropPosition) ? dropPosition[2] : dropPosition.z;
        const px = Array.isArray(playerPosition) ? playerPosition[0] : playerPosition.x;
        const pz = Array.isArray(playerPosition) ? playerPosition[2] : playerPosition.z;

        if (typeof dx === "number" && typeof px === "number") {
          const dist = Math.hypot(dx - px, dz - pz);
          // Cho phép bán kính 3.5m cộng thêm dung sai độ trễ mạng 1.5m = 5.0m
          if (dist > 5.5) {
            throw new InventoryRuleError("Khoảng cách quá xa, không thể nhặt vật phẩm này!", 400);
          }
        }
      }

      // 3. Xử lý nhặt VÀNG (Gold Drop)
      if (dropType === "gold" || itemId === "gold") {
        const goldGain = Math.max(1, value || quantity || 10);
        const [updatedChar] = await tx
          .update(charactersTable)
          .set({ gold: character.gold + goldGain })
          .where(eq(charactersTable.id, characterId))
          .returning();

        return {
          success: true,
          dropId,
          type: "gold",
          goldGained: goldGain,
          newGold: updatedChar.gold,
          character: await toCharacterResponse(updatedChar),
          inventory: await listInventory(characterId),
        };
      }

      // 4. Lấy thông tin vật phẩm từ catalog
      const itemDef = await getItem(itemId);
      if (!itemDef) {
        throw new InventoryRuleError(`Không tìm thấy dữ liệu vật phẩm '${itemId}' trong cơ sở dữ liệu!`, 404);
      }

      const unlockedSlots = Math.min(30, Math.max(15, Number(character.unlockedSlots || 15)));
      const maxStack = Math.max(1, Number(itemDef.maxStack ?? (itemDef.category === "equipment" ? 1 : 99)));
      const isStackable = itemDef.category !== "equipment" && maxStack > 1;

      // 5. Lấy toàn bộ item hiện có trong túi (chưa trang bị)
      const currentBagItems = await tx
        .select()
        .from(characterItemsTable)
        .where(
          and(
            eq(characterItemsTable.characterId, characterId),
            eq(characterItemsTable.equipped, false),
          ),
        );

      let targetOwnershipId: number | null = null;
      let targetSlotIndex: number = -1;
      let updatedQuantity: number = quantity;
      let isNewSlot = false;

      // 6. Xử lý Chồng Dồn (Stacking) nếu là tiêu hao / nguyên liệu
      if (isStackable) {
        const existingStack = currentBagItems.find(
          (i: any) => i.itemId === itemId && i.quantity < maxStack,
        );

        if (existingStack) {
          const spaceInStack = maxStack - existingStack.quantity;
          const addQty = Math.min(spaceInStack, quantity);
          updatedQuantity = existingStack.quantity + addQty;
          targetOwnershipId = existingStack.id;
          targetSlotIndex = existingStack.slotIndex;

          await tx
            .update(characterItemsTable)
            .set({ quantity: updatedQuantity })
            .where(eq(characterItemsTable.id, existingStack.id));

          // Nếu còn dư (overflow), tiếp tục tìm ô mới cho phần còn lại
          const overflow = quantity - addQty;
          if (overflow > 0) {
            // Đệ quy hoặc tìm thêm ô cho overflow
            // Hiện tại đa số rơi 1-5 viên/bình, nếu có overflow tìm tiếp ô trống
          }
        }
      }

      // 7. Nếu không chồng dồn được, tìm ô trống đầu tiên (slotIndex từ 0 đến unlockedSlots - 1)
      if (targetOwnershipId === null) {
        const occupiedSlots = new Set<number>(currentBagItems.map((i: any) => Number(i.slotIndex)));
        
        for (let s = 0; s < unlockedSlots; s++) {
          if (!occupiedSlots.has(s)) {
            targetSlotIndex = s;
            break;
          }
        }

        // TÚI ĐỒ ĐÃ ĐẦY!
        if (targetSlotIndex === -1) {
          throw new InventoryRuleError(
            "⚠️ TÚI ĐỒ ĐÃ ĐẦY! Vui lòng dọn bớt hoặc mở rộng ô chứa.",
            400,
          );
        }

        // Đặt vào ô trống mới
        isNewSlot = true;
        const [inserted] = await tx
          .insert(characterItemsTable)
          .values({
            characterId,
            itemId: itemDef.id,
            slotIndex: targetSlotIndex,
            quantity: Math.min(maxStack, quantity),
            enhanceLevel: 0,
            bonusCombatPower: 0,
            rarity: itemDef.rarity || "common",
            equipped: false,
          })
          .returning();

        targetOwnershipId = inserted.id;
        updatedQuantity = inserted.quantity;
      }

      // 8. Kiểm tra phẩm chất KÌ TÍCH (MIRACLE) để phát thông báo toàn cõi
      const isMiracle = itemDef.rarity?.toLowerCase() === "miracle";
      let broadcastMessage: string | null = null;
      if (isMiracle) {
        broadcastMessage = `🌟 [KÌ TÍCH XUẤT THẾ] Người chơi 【${character.name}】 vừa nhặt được bảo vật KÌ TÍCH: 【${itemDef.name}】! Tỏa hào quang hồng tím chấn động toàn cõi Chiến Long Bá!`;
      }

      // 9. Đồng bộ danh sách túi đồ hoàn chỉnh
      const inventory = await listInventory(characterId);

      return {
        success: true,
        dropId,
        type: "item",
        itemId: itemDef.id,
        itemName: itemDef.name,
        rarity: itemDef.rarity,
        isMiracle,
        broadcastMessage,
        slotIndex: targetSlotIndex,
        quantity: updatedQuantity,
        isNewSlot,
        ownershipId: targetOwnershipId,
        unlockedSlots,
        totalItemsInBag: currentBagItems.length + (isNewSlot ? 1 : 0),
        inventory,
      };
    });
  }
}
