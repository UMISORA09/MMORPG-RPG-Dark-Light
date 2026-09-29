import { Router } from "express";
import { and, eq } from "drizzle-orm";
import {
  db,
  characterItemsTable,
  charactersTable,
  itemsTable,
} from "@workspace/db";
import {
  BuyItemParams,
  BuyItemResponse,
  EquipItemParams,
  EquipItemResponse,
  GetInventoryParams,
  GetInventoryResponse,
  GetItemsResponse,
  UnequipItemParams,
  UnequipItemResponse,
} from "@workspace/api-zod";
import {
  canUseItem,
  ensureItemCatalog,
  ensureStarterInventory,
  getCatalogItems,
  getCharacterForUser,
  getItem,
  getOwnedItem,
  listInventory,
  toCharacterResponse,
} from "../lib/inventory";
import { getExpForLevel } from "../data/classes";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!req.session.userId) {
    res.status(401).json({ error: "Chưa đăng nhập" });
    return;
  }
  next();
}

function withExperienceToNextLevel(character: Awaited<ReturnType<typeof toCharacterResponse>>) {
  return {
    ...character,
    experienceToNextLevel: getExpForLevel(character.level),
  };
}

router.get("/items", async (_req, res): Promise<void> => {
  const items = await getCatalogItems();
  res.status(200).json(
    GetItemsResponse.parse(
      items,
    ),
  );
});

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

router.post("/characters/:characterId/inventory/:itemId/buy", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const params = BuyItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Tham số không hợp lệ" });
    return;
  }

  await ensureItemCatalog();
  const character = await getCharacterForUser(params.data.characterId, userId);
  const item = await getItem(params.data.itemId);

  if (!character || !item) {
    res.status(404).json({ error: "Không tìm thấy nhân vật hoặc vật phẩm" });
    return;
  }

  const itemError = canUseItem(item, character);
  if (itemError) {
    res.status(400).json({ error: itemError });
    return;
  }

  if (item.price <= 0) {
    res.status(400).json({ error: "Vật phẩm này chỉ được cấp khi tạo nhân vật" });
    return;
  }

  const purchase = await db.transaction(async (tx) => {
    const [lockedCharacter] = await tx
      .select()
      .from(charactersTable)
      .where(and(eq(charactersTable.id, character.id), eq(charactersTable.userId, userId)))
      .limit(1);

    if (!lockedCharacter) {
      return { error: "Không tìm thấy nhân vật" as const };
    }
    if (lockedCharacter.gold < item.price) {
      return { error: "Không đủ vàng để mua vật phẩm" as const };
    }

    const [alreadyOwned] = await tx
      .select({ id: characterItemsTable.id })
      .from(characterItemsTable)
      .where(
        and(
          eq(characterItemsTable.characterId, character.id),
          eq(characterItemsTable.itemId, item.id),
        ),
      )
      .limit(1);

    if (alreadyOwned) {
      return { error: "Nhân vật đã sở hữu vật phẩm này" as const };
    }

    const [ownership] = await tx
      .insert(characterItemsTable)
      .values({ characterId: character.id, itemId: item.id })
      .returning();
    const [updatedCharacter] = await tx
      .update(charactersTable)
      .set({ gold: lockedCharacter.gold - item.price })
      .where(eq(charactersTable.id, character.id))
      .returning();

    return { ownership, updatedCharacter };
  });

  if ("error" in purchase) {
    res.status(400).json({ error: purchase.error });
    return;
  }

  const inventory = await listInventory(character.id);
  const inventoryItem = inventory.find((entry) => entry.ownershipId === purchase.ownership.id);
  if (!inventoryItem) {
    res.status(500).json({ error: "Không thể tải vật phẩm vừa mua" });
    return;
  }

  const response = {
    character: withExperienceToNextLevel(await toCharacterResponse(purchase.updatedCharacter)),
    inventoryItem,
  };
  res.status(201).json(BuyItemResponse.parse(response));
});

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

  await db.transaction(async (tx) => {
    const equippedInSlot = await tx
      .select({ id: characterItemsTable.id })
      .from(characterItemsTable)
      .innerJoin(itemsTable, eq(characterItemsTable.itemId, itemsTable.id))
      .where(
        and(
          eq(characterItemsTable.characterId, character.id),
          eq(characterItemsTable.equipped, true),
          eq(itemsTable.type, owned.item.type),
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
      .set({ equipped: true })
      .where(eq(characterItemsTable.id, owned.ownershipId));
  });

  res.status(200).json(
    EquipItemResponse.parse(
      withExperienceToNextLevel(await toCharacterResponse(character)),
    ),
  );
});

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
    .set({ equipped: false })
    .where(eq(characterItemsTable.id, owned.ownershipId));

  res.status(200).json(
    UnequipItemResponse.parse(
      withExperienceToNextLevel(await toCharacterResponse(character)),
    ),
  );
});

export default router;