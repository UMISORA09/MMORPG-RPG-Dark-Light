import { Router } from "express";
import { and, eq } from "drizzle-orm";
import {
  db,
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
  await ensureStarterInventory(character.id, character.classId);
  res.status(200).json(GetInventoryResponse.parse(await listInventory(character.id)));
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
    const equippedInSlot = await tx
      .select({ id: characterItemsTable.id })
      .from(characterItemsTable)
      .innerJoin(itemsTable, eq(characterItemsTable.itemId, itemsTable.id))
      .where(
        and(
          eq(characterItemsTable.characterId, character.id),
          eq(characterItemsTable.equipped, true),
          eq(itemsTable.equipSlot, owned.item.equipSlot),
        ),
      );
    for (const equippedItem of equippedInSlot) {
      await tx
        .update(characterItemsTable)
        .set({ equipped: false })
        .where(eq(characterItemsTable.id, equippedItem.id));
    }
    await tx
      .update(characterItemsTable)
      .set({ equipped: true, equippedSlot: owned.item.equipSlot })
      .where(eq(characterItemsTable.id, owned.ownershipId));
  });

  res.status(200).json(
    EquipItemResponse.parse(
      withExperienceToNextLevel(await toCharacterResponse(character)),
    ),
  );
});

// Tháo trang bị về túi đồ
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

  await db
    .update(characterItemsTable)
    .set({ equipped: false, equippedSlot: null })
    .where(eq(characterItemsTable.id, owned.ownershipId));

  res.status(200).json(
    UnequipItemResponse.parse(
      withExperienceToNextLevel(await toCharacterResponse(character)),
    ),
  );
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

export default router;