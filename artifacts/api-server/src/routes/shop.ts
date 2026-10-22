import { Router } from "express";
import { and, eq } from "drizzle-orm";
import {
  db,
  characterItemsTable,
  charactersTable,
} from "@workspace/db";
import {
  BuyItemParams,
  BuyItemResponse,
  GetItemsResponse,
} from "@workspace/api-zod";
import {
  canUseItem,
  ensureItemCatalog,
  getCatalogItems,
  getCharacterForUser,
  getItem,
  listInventory,
  toCharacterResponse,
} from "../lib/inventory";
import { getExpForLevel } from "../data/classes";
import { requireAuth, getAuthUserId } from "../middlewares/requireAuth";

const router = Router();

function withExperienceToNextLevel(character: Awaited<ReturnType<typeof toCharacterResponse>>) {
  return {
    ...character,
    experienceToNextLevel: getExpForLevel(character.level),
  };
}

// Lấy danh mục vật phẩm bày bán trong Cửa Hàng (Shop)
router.get("/items", async (_req, res): Promise<void> => {
  const items = await getCatalogItems();
  res.status(200).json(GetItemsResponse.parse(items));
});

router.get("/shop/items", async (_req, res): Promise<void> => {
  const items = await getCatalogItems();
  res.status(200).json(GetItemsResponse.parse(items));
});

// Mua vật phẩm từ Cửa Hàng
router.post("/characters/:characterId/inventory/:itemId/buy", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req);
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

  const purchase = await db.transaction(async (tx: any) => {
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

    const ownedRows = await tx
      .select()
      .from(characterItemsTable)
      .where(eq(characterItemsTable.characterId, character.id));
    const maxStack = Math.max(1, Number(item.maxStack ?? 1));
    const stack = item.category !== "equipment"
      ? ownedRows.find((owned: any) => owned.itemId === item.id && owned.quantity < maxStack)
      : undefined;
    let ownership;

    if (stack) {
      [ownership] = await tx.update(characterItemsTable)
        .set({ quantity: Number(stack.quantity) + 1 })
        .where(eq(characterItemsTable.id, stack.id))
        .returning();
    } else {
      if (ownedRows.length >= 30) return { error: "Hành trang đã đầy (30 ô)" as const };
      const occupiedSlots = new Set(ownedRows.map((owned: any) => Number(owned.slotIndex ?? 0)));
      let slotIndex = 0;
      while (occupiedSlots.has(slotIndex) && slotIndex < 30) slotIndex++;
      if (slotIndex >= 30) return { error: "Hành trang đã đầy (30 ô)" as const };
      [ownership] = await tx.insert(characterItemsTable)
        .values({ characterId: character.id, itemId: item.id, slotIndex, quantity: 1, equipped: false })
        .returning();
    }

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
  const inventoryItem = inventory.find((entry: any) => entry.ownershipId === purchase.ownership.id);
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

export default router;
