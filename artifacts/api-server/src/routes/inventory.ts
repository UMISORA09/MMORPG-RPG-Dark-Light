import { Router } from "express";
import { and, eq } from "drizzle-orm";
import {
  db,
  charactersTable,
  characterItemsTable,
  itemsTable,
} from "@workspace/db";
import {
  EquipItemParams,
  EquipItemResponse,
  GetInventoryParams,
  GetInventoryResponse,
  UnequipItemParams,
  UnequipItemResponse,
  EnhanceItemResponse,
  InventoryActionParams,
  UseItemResponse,
} from "@workspace/api-zod";
import {
  canUseItem,
  ensureItemCatalog,
  ensureStarterInventory,
  getCharacterForUser,
  getOwnedItem,
  listInventory,
  toCharacterResponse,
} from "../lib/inventory";
import { getExpForLevel } from "../data/classes";
import { requireAuth } from "../middlewares/requireAuth";
import { CharacterInventoryService, InventoryRuleError } from "../services/CharacterInventoryService";
import { LootService } from "../services/LootService";

const router = Router();

function withExperienceToNextLevel(character: Awaited<ReturnType<typeof toCharacterResponse>>) {
  return {
    ...character,
    experienceToNextLevel: getExpForLevel(character.level),
  };
}

// Lấy danh sách vật phẩm trong túi đồ của nhân vật
router.get("/characters/:characterId/inventory", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const params = GetInventoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "ID không hợp lệ" });
    return;
  }

  const character = await getCharacterForUser(params.data.characterId, userId);
  if (!character) {
    res.status(404).json({ error: "Không tìm thấy nhân vật" });
    return;
  }

  await ensureItemCatalog();
  const rawList = await listInventory(character.id);
  const parsed = GetInventoryResponse.safeParse(rawList);
  res.status(200).json(parsed.success ? parsed.data : rawList);
});

// Trang bị vật phẩm vào người
router.post("/characters/:characterId/inventory/:itemId/equip", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const params = EquipItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Tham số không hợp lệ" });
    return;
  }

  const character = await getCharacterForUser(params.data.characterId, userId);
  const owned = await getOwnedItem(params.data.characterId, params.data.itemId);
  if (!character || !owned) {
    res.status(404).json({ error: "Không tìm thấy nhân vật hoặc vật phẩm trong túi đồ" });
    return;
  }

  const itemError = canUseItem(owned.item, character);
  if (itemError) {
    res.status(400).json({ error: itemError });
    return;
  }

  await db.transaction(async (tx: any) => {
    const slot = owned.item.equipSlot;
    const equippedInSlot = await tx
      .select({ id: characterItemsTable.id })
      .from(characterItemsTable)
      .innerJoin(itemsTable, eq(characterItemsTable.itemId, itemsTable.id))
      .where(
        and(
          eq(characterItemsTable.characterId, character.id),
          eq(characterItemsTable.equipped, true),
          eq(itemsTable.equipSlot, slot),
        ),
      );

    // If an item was previously equipped in that slot, unequip it into the bag
    for (const equippedItem of equippedInSlot) {
      await tx
        .update(characterItemsTable)
        .set({ equipped: false, equippedSlot: null, slotIndex: owned.slotIndex ?? 0 })
        .where(eq(characterItemsTable.id, equippedItem.id));
    }

    // Newly equipped gear occupies character equipment slot, freed from bag grid
    await tx
      .update(characterItemsTable)
      .set({ equipped: true, equippedSlot: slot, slotIndex: -1 })
      .where(eq(characterItemsTable.id, owned.ownershipId));
  });

  res.status(200).json(
    EquipItemResponse.parse(
      withExperienceToNextLevel(await toCharacterResponse(character)),
    ),
  );
});

// Tháo trang bị về túi đồ (kiểm tra dung lượng túi đồ unlockedSlots)
router.post("/characters/:characterId/inventory/:itemId/unequip", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const params = UnequipItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Tham số không hợp lệ" });
    return;
  }

  const character = await getCharacterForUser(params.data.characterId, userId);
  const owned = await getOwnedItem(params.data.characterId, params.data.itemId);
  if (!character || !owned) {
    res.status(404).json({ error: "Không tìm thấy nhân vật hoặc vật phẩm trong túi đồ" });
    return;
  }

  const allOwned = await db
    .select({
      id: characterItemsTable.id,
      equipped: characterItemsTable.equipped,
      slotIndex: characterItemsTable.slotIndex,
    })
    .from(characterItemsTable)
    .where(eq(characterItemsTable.characterId, character.id));

  const unlockedSlots = character.unlockedSlots ?? 15;
  const usedBagSlots = allOwned.filter((it: any) => !it.equipped).length;

  if (usedBagSlots >= unlockedSlots) {
    res.status(400).json({ error: "Túi hành trang đã đầy, vui lòng dọn bớt hoặc mở khóa thêm ô!" });
    return;
  }

  // Find lowest free slotIndex in 0 .. unlockedSlots - 1
  const occupiedSlots = new Set(
    allOwned
      .filter((it: any) => !it.equipped && it.slotIndex >= 0)
      .map((it: any) => it.slotIndex),
  );
  let freeSlotIndex = 0;
  while (freeSlotIndex < unlockedSlots && occupiedSlots.has(freeSlotIndex)) {
    freeSlotIndex++;
  }

  await db
    .update(characterItemsTable)
    .set({ equipped: false, equippedSlot: null, slotIndex: freeSlotIndex })
    .where(eq(characterItemsTable.id, owned.ownershipId));

  res.status(200).json(
    UnequipItemResponse.parse(
      withExperienceToNextLevel(await toCharacterResponse(character)),
    ),
  );
});

// Mở khóa thêm ô Hành trang (tối đa 30 ô) với giá 500 Vàng
router.post("/characters/:characterId/inventory/unlock-slot", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const characterId = parseInt(req.params.characterId);
  if (isNaN(characterId)) {
    res.status(400).json({ error: "ID không hợp lệ" });
    return;
  }

  const character = await getCharacterForUser(characterId, userId);
  if (!character) {
    res.status(404).json({ error: "Không tìm thấy nhân vật" });
    return;
  }

  const currentUnlocked = character.unlockedSlots ?? 15;
  if (currentUnlocked >= 30) {
    res.status(400).json({ error: "Hành trang đã đạt giới hạn tối đa (30 ô)!" });
    return;
  }

  const UNLOCK_COST = 500;
  if (character.gold < UNLOCK_COST) {
    res.status(400).json({ error: `Không đủ vàng! Cần ${UNLOCK_COST} Vàng để mở khóa thêm 1 ô.` });
    return;
  }

  const [updatedChar] = await db
    .update(charactersTable)
    .set({
      gold: character.gold - UNLOCK_COST,
      unlockedSlots: currentUnlocked + 1,
    })
    .where(eq(charactersTable.id, characterId))
    .returning();

  res.status(200).json({
    success: true,
    unlockedSlots: updatedChar.unlockedSlots,
    gold: updatedChar.gold,
    character: withExperienceToNextLevel(await toCharacterResponse(updatedChar)),
  });
});

// Sắp xếp tự động Túi Đồ (Auto-Sort & Stack)
router.post("/characters/:characterId/inventory/sort", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const characterId = parseInt(req.params.characterId);
  if (isNaN(characterId)) {
    res.status(400).json({ error: "ID không hợp lệ" });
    return;
  }

  const character = await getCharacterForUser(characterId, userId);
  if (!character) {
    res.status(404).json({ error: "Không tìm thấy nhân vật" });
    return;
  }

  await db.transaction(async (tx: any) => {
    const bagItems = await tx
      .select({
        ownershipId: characterItemsTable.id,
        itemId: characterItemsTable.itemId,
        quantity: characterItemsTable.quantity,
        enhanceLevel: characterItemsTable.enhanceLevel,
        slotIndex: characterItemsTable.slotIndex,
        item: itemsTable,
      })
      .from(characterItemsTable)
      .innerJoin(itemsTable, eq(characterItemsTable.itemId, itemsTable.id))
      .where(and(eq(characterItemsTable.characterId, characterId), eq(characterItemsTable.equipped, false)));

    // Group and stack duplicate consumables/materials
    const stackMap = new Map<string, any>();
    const nonStackable: any[] = [];

    for (const entry of bagItems) {
      const it = entry.item;
      const isStackable = it.category !== "equipment" && Number(it.maxStack ?? 99) > 1 && entry.enhanceLevel === 0;
      if (isStackable) {
        if (stackMap.has(entry.itemId)) {
          const existing = stackMap.get(entry.itemId);
          existing.quantity += entry.quantity;
          await tx.delete(characterItemsTable).where(eq(characterItemsTable.id, entry.ownershipId));
        } else {
          stackMap.set(entry.itemId, { ...entry });
        }
      } else {
        nonStackable.push(entry);
      }
    }

    const consolidated = [...stackMap.values(), ...nonStackable];
    for (const entry of stackMap.values()) {
      await tx
        .update(characterItemsTable)
        .set({ quantity: entry.quantity })
        .where(eq(characterItemsTable.id, entry.ownershipId));
    }

    const rarityWeight: Record<string, number> = {
      miracle: 6,
      mythic: 5,
      legendary: 4,
      epic: 3,
      rare: 2,
      common: 1,
    };
    const categoryWeight: Record<string, number> = {
      equipment: 4,
      consumable: 3,
      material: 2,
      quest: 1,
    };

    consolidated.sort((a, b) => {
      const rA = rarityWeight[a.item.rarity?.toLowerCase()] || 0;
      const rB = rarityWeight[b.item.rarity?.toLowerCase()] || 0;
      if (rB !== rA) return rB - rA;

      const cA = categoryWeight[a.item.category?.toLowerCase()] || 0;
      const cB = categoryWeight[b.item.category?.toLowerCase()] || 0;
      if (cB !== cA) return cB - cA;

      if ((b.enhanceLevel ?? 0) !== (a.enhanceLevel ?? 0)) {
        return (b.enhanceLevel ?? 0) - (a.enhanceLevel ?? 0);
      }
      return (a.item.name || "").localeCompare(b.item.name || "");
    });

    for (let i = 0; i < consolidated.length; i++) {
      await tx
        .update(characterItemsTable)
        .set({ slotIndex: i })
        .where(eq(characterItemsTable.id, consolidated[i].ownershipId));
    }
  });

  const rawList = await listInventory(characterId);
  res.status(200).json(rawList);
});

// Bán vật phẩm trong túi đồ lấy Vàng
router.post("/characters/:characterId/inventory/:itemId/sell", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const characterId = parseInt(req.params.characterId);
  const itemId = req.params.itemId;

  if (isNaN(characterId) || !itemId) {
    res.status(400).json({ error: "Tham số không hợp lệ" });
    return;
  }

  const character = await getCharacterForUser(characterId, userId);
  if (!character) {
    res.status(404).json({ error: "Không tìm thấy nhân vật" });
    return;
  }

  // 1. Tìm theo itemId
  let owned = await getOwnedItem(characterId, itemId);
  // 2. Nếu không thấy theo itemId, tìm theo ownershipId
  if (!owned && !isNaN(Number(itemId))) {
    const [byOwnership] = await db
      .select({
        ownershipId: characterItemsTable.id,
        equipped: characterItemsTable.equipped,
        characterId: characterItemsTable.characterId,
        quantity: characterItemsTable.quantity,
        item: itemsTable,
      })
      .from(characterItemsTable)
      .innerJoin(itemsTable, eq(characterItemsTable.itemId, itemsTable.id))
      .where(and(eq(characterItemsTable.characterId, characterId), eq(characterItemsTable.id, Number(itemId))))
      .limit(1);
    if (byOwnership) {
      owned = {
        ownershipId: byOwnership.ownershipId,
        equipped: Boolean(byOwnership.equipped),
        characterId: byOwnership.characterId,
        item: byOwnership.item,
      } as any;
    }
  }

  if (!owned) {
    // Nếu vật phẩm đã được bán hoặc không còn tồn tại trên server, trả về thành công để đồng bộ client
    res.status(200).json({ success: true, message: "Vật phẩm đã được thanh lý", goldGained: 50 });
    return;
  }

  if (owned.equipped) {
    res.status(400).json({ error: "Hãy tháo trang bị ra trước khi bán!" });
    return;
  }

  const sellPrice = Math.max(10, Number(owned.item?.price || 50));
  await db.delete(characterItemsTable).where(eq(characterItemsTable.id, owned.ownershipId));
  const [updatedCharacter] = await db
    .update(charactersTable)
    .set({ gold: character.gold + sellPrice })
    .where(eq(charactersTable.id, characterId))
    .returning();

  res.status(200).json({
    success: true,
    soldItemId: itemId,
    goldGained: sellPrice,
    character: withExperienceToNextLevel(await toCharacterResponse(updatedCharacter || character)),
  });
});

router.post("/characters/:characterId/inventory/:ownershipId/enhance", requireAuth, async (req, res): Promise<void> => {
  const params = InventoryActionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Tham số cường hóa không hợp lệ" });
    return;
  }

  try {
    const result = await CharacterInventoryService.enhance(
      req.session.userId!, params.data.characterId, params.data.ownershipId,
    );
    const character = await toCharacterResponse(result.character);
    res.status(200).json(EnhanceItemResponse.parse({
      character: { id: character.id, gold: character.gold, combatPower: character.combatPower },
      item: {
        ownershipId: result.item.id,
        itemId: result.item.itemId,
        enhanceLevel: result.item.enhanceLevel,
        bonusCombatPower: result.item.bonusCombatPower,
      },
    }));
  } catch (error) {
    if (error instanceof InventoryRuleError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    throw error;
  }
});

router.post("/characters/:characterId/inventory/:ownershipId/use", requireAuth, async (req, res): Promise<void> => {
  const params = InventoryActionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Tham số sử dụng vật phẩm không hợp lệ" });
    return;
  }

  try {
    const result = await CharacterInventoryService.use(
      req.session.userId!, params.data.characterId, params.data.ownershipId,
    );
    res.status(200).json(UseItemResponse.parse({
      character: {
        id: result.character.id,
        hp: result.character.hp,
        maxHp: result.character.maxHp,
        mp: result.character.mp,
        maxMp: result.character.maxMp,
      },
      consumed: result.consumed,
    }));
  } catch (error) {
    if (error instanceof InventoryRuleError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    throw error;
  }
});
// ── NHẶT ĐỒ CHÍNH XÁC (Looting API) ───────────────────────────────────────────
router.post("/characters/:characterId/loot", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const characterId = parseInt(req.params.characterId);
  if (isNaN(characterId)) {
    res.status(400).json({ error: "ID nhân vật không hợp lệ" });
    return;
  }

  const {
    dropId,
    itemId,
    quantity = 1,
    dropType,
    value,
    dropPosition,
    playerPosition,
  } = req.body;

  if (!itemId && dropType !== "gold") {
    res.status(400).json({ error: "Thiếu thông tin itemId của vật phẩm rơi" });
    return;
  }

  try {
    const result = await LootService.lootItem({
      userId,
      characterId,
      dropId,
      itemId: itemId || "gold",
      quantity,
      dropType,
      value,
      dropPosition,
      playerPosition,
    });
    res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof InventoryRuleError) {
      res.status(error.statusCode).json({
        error: error.message,
        inventoryFull: error.message.includes("TÚI ĐỒ ĐÃ ĐẦY"),
      });
      return;
    }
    console.error("Loot error:", error);
    res.status(500).json({ error: error.message || "Lỗi nhặt vật phẩm" });
  }
});

router.post("/characters/:characterId/loot/:dropId", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const characterId = parseInt(req.params.characterId);
  const dropId = req.params.dropId;
  if (isNaN(characterId) || !dropId) {
    res.status(400).json({ error: "Tham số không hợp lệ" });
    return;
  }

  const {
    itemId,
    quantity = 1,
    dropType,
    value,
    dropPosition,
    playerPosition,
  } = req.body;

  try {
    const result = await LootService.lootItem({
      userId,
      characterId,
      dropId,
      itemId: itemId || dropId,
      quantity,
      dropType,
      value,
      dropPosition,
      playerPosition,
    });
    res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof InventoryRuleError) {
      res.status(error.statusCode).json({
        error: error.message,
        inventoryFull: error.message.includes("TÚI ĐỒ ĐÃ ĐẦY"),
      });
      return;
    }
    console.error("Loot dropId error:", error);
    res.status(500).json({ error: error.message || "Lỗi nhặt vật phẩm" });
  }
});

// ── MỞ RƯƠNG KHO BÁU TỰ SINH (Dynamic Respawing Treasure Chest) ────────────────
router.post("/characters/:characterId/open-chest", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const characterId = parseInt(req.params.characterId);
  if (isNaN(characterId)) {
    res.status(400).json({ error: "ID nhân vật không hợp lệ" });
    return;
  }

  const { chestId, tier, chestPosition, playerPosition } = req.body;

  const character = await getCharacterForUser(characterId, userId);
  if (!character) {
    res.status(404).json({ error: "Không tìm thấy nhân vật" });
    return;
  }

  if (character.hp <= 0) {
    res.status(400).json({ error: "Nhân vật đã tử trận, không thể mở rương!" });
    return;
  }

  // Distance validation (loot radius 3.5m + ping tolerance 2.0m = 5.5m)
  if (
    Array.isArray(chestPosition) &&
    Array.isArray(playerPosition) &&
    chestPosition.length >= 3 &&
    playerPosition.length >= 3
  ) {
    const dist = Math.hypot(
      playerPosition[0] - chestPosition[0],
      playerPosition[2] - chestPosition[2]
    );
    if (dist > 5.5) {
      res.status(400).json({ error: "Khoảng cách đến rương quá xa (> 5.5m)" });
      return;
    }
  }

  res.status(200).json({
    success: true,
    message: "Mở rương kho báu thành công!",
    chestId,
    tier,
    characterLevel: character.level,
  });
});


// ── ĐỔI VỊ TRÍ Ô ĐỒ / DRAG-AND-DROP (Swap Slots) ──────────────────────────────
router.post("/characters/:characterId/inventory/swap-slots", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const characterId = parseInt(req.params.characterId);
  const { fromSlot, toSlot } = req.body;

  if (isNaN(characterId) || typeof fromSlot !== "number" || typeof toSlot !== "number") {
    res.status(400).json({ error: "Vị trí ô đồ không hợp lệ" });
    return;
  }

  const character = await getCharacterForUser(characterId, userId);
  if (!character) {
    res.status(404).json({ error: "Không tìm thấy nhân vật" });
    return;
  }

  const unlockedSlots = character.unlockedSlots ?? 15;
  if (fromSlot < 0 || fromSlot >= unlockedSlots || toSlot < 0 || toSlot >= unlockedSlots) {
    res.status(400).json({ error: "Vị trí ô nằm ngoài giới hạn ô mở khóa (🔒)" });
    return;
  }

  await db.transaction(async (tx: any) => {
    const [itemA] = await tx
      .select()
      .from(characterItemsTable)
      .where(
        and(
          eq(characterItemsTable.characterId, characterId),
          eq(characterItemsTable.equipped, false),
          eq(characterItemsTable.slotIndex, fromSlot),
        ),
      )
      .limit(1);

    const [itemB] = await tx
      .select()
      .from(characterItemsTable)
      .where(
        and(
          eq(characterItemsTable.characterId, characterId),
          eq(characterItemsTable.equipped, false),
          eq(characterItemsTable.slotIndex, toSlot),
        ),
      )
      .limit(1);

    if (itemA && itemB) {
      await tx
        .update(characterItemsTable)
        .set({ slotIndex: -99 })
        .where(eq(characterItemsTable.id, itemA.id));

      await tx
        .update(characterItemsTable)
        .set({ slotIndex: fromSlot })
        .where(eq(characterItemsTable.id, itemB.id));

      await tx
        .update(characterItemsTable)
        .set({ slotIndex: toSlot })
        .where(eq(characterItemsTable.id, itemA.id));
    } else if (itemA && !itemB) {
      await tx
        .update(characterItemsTable)
        .set({ slotIndex: toSlot })
        .where(eq(characterItemsTable.id, itemA.id));
    }
  });

  const rawList = await listInventory(characterId);
  res.status(200).json({ success: true, inventory: rawList });
});

export default router;