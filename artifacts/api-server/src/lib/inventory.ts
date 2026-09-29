import { and, eq } from "drizzle-orm";
import {
  db,
  characterItemsTable,
  charactersTable,
  itemsTable,
  type Character,
  type Item,
} from "@workspace/db";
import { getStatsForLevel } from "../data/classes";
import { ITEM_CATALOG } from "../data/items";

export type EquipmentBonuses = {
  hpBoost: number;
  atkBoost: number;
  defBoost: number;
  spdBoost: number;
};

export async function ensureItemCatalog(): Promise<void> {
  await db
    .insert(itemsTable)
    .values(ITEM_CATALOG)
    .onConflictDoNothing({ target: itemsTable.id });
}

export async function ensureStarterInventory(characterId: number, classId: string): Promise<void> {
  const existing = await db
    .select({ id: characterItemsTable.id })
    .from(characterItemsTable)
    .where(eq(characterItemsTable.characterId, characterId))
    .limit(1);

  if (existing.length > 0) {
    return;
  }

  const starterItems = ITEM_CATALOG.filter(
    (item) => item.classId === classId && item.requiredLevel === 1 && item.price === 0,
  );

  if (starterItems.length === 0) {
    return;
  }

  await db.insert(characterItemsTable).values(
    starterItems.map((item) => ({
      characterId,
      itemId: item.id,
      equipped: true,
    })),
  ).onConflictDoNothing();
}

export async function getEquipmentBonuses(characterId: number): Promise<EquipmentBonuses> {
  const rows = await db
    .select({
      hpBoost: itemsTable.hpBoost,
      atkBoost: itemsTable.atkBoost,
      defBoost: itemsTable.defBoost,
      spdBoost: itemsTable.spdBoost,
    })
    .from(characterItemsTable)
    .innerJoin(itemsTable, eq(characterItemsTable.itemId, itemsTable.id))
    .where(
      and(
        eq(characterItemsTable.characterId, characterId),
        eq(characterItemsTable.equipped, true),
      ),
    );

  return rows.reduce(
    (bonuses, item) => ({
      hpBoost: bonuses.hpBoost + item.hpBoost,
      atkBoost: bonuses.atkBoost + item.atkBoost,
      defBoost: bonuses.defBoost + item.defBoost,
      spdBoost: bonuses.spdBoost + item.spdBoost,
    }),
    { hpBoost: 0, atkBoost: 0, defBoost: 0, spdBoost: 0 },
  );
}

export async function toCharacterResponse(character: Character) {
  const baseStats = getStatsForLevel(character.classId, character.level);
  const bonuses = await getEquipmentBonuses(character.id);
  const maxHp = baseStats.hp + bonuses.hpBoost;

  return {
    ...character,
    hp: Math.min(Math.max(character.hp + bonuses.hpBoost, 0), maxHp),
    maxHp,
    atk: baseStats.atk + bonuses.atkBoost,
    def: baseStats.def + bonuses.defBoost,
    spd: Math.max(1, baseStats.spd + bonuses.spdBoost),
  };
}

export async function listInventory(characterId: number) {
  const rows = await db
    .select({
      item: itemsTable,
      ownershipId: characterItemsTable.id,
      equipped: characterItemsTable.equipped,
      acquiredAt: characterItemsTable.acquiredAt,
    })
    .from(characterItemsTable)
    .innerJoin(itemsTable, eq(characterItemsTable.itemId, itemsTable.id))
    .where(eq(characterItemsTable.characterId, characterId));

  return rows.map(({ item, ownershipId, equipped, acquiredAt }) => ({
    id: item.id,
    name: item.name,
    type: item.type,
    description: item.description,
    rarity: item.rarity,
    hpBoost: item.hpBoost,
    atkBoost: item.atkBoost,
    defBoost: item.defBoost,
    spdBoost: item.spdBoost,
    price: item.price,
    classId: item.classId,
    requiredLevel: item.requiredLevel,
    icon: item.icon,
    ownershipId,
    equipped,
    acquiredAt,
  }));
}

export async function getOwnedItem(characterId: number, itemId: string) {
  const [owned] = await db
    .select({
      ownershipId: characterItemsTable.id,
      equipped: characterItemsTable.equipped,
      characterId: characterItemsTable.characterId,
      item: itemsTable,
    })
    .from(characterItemsTable)
    .innerJoin(itemsTable, eq(characterItemsTable.itemId, itemsTable.id))
    .where(
      and(
        eq(characterItemsTable.characterId, characterId),
        eq(characterItemsTable.itemId, itemId),
      ),
    )
    .limit(1);

  return owned;
}

export async function getItem(itemId: string): Promise<Item | undefined> {
  const [item] = await db
    .select()
    .from(itemsTable)
    .where(eq(itemsTable.id, itemId))
    .limit(1);
  return item;
}

export async function getCharacterForUser(characterId: number, userId: number) {
  const [character] = await db
    .select()
    .from(charactersTable)
    .where(and(eq(charactersTable.id, characterId), eq(charactersTable.userId, userId)))
    .limit(1);
  return character;
}

export function canUseItem(item: Item, character: Character): string | null {
  if (item.classId !== null && item.classId !== character.classId) {
    return "Vật phẩm không dành cho chức nghiệp này";
  }
  if (item.requiredLevel > character.level) {
    return `Cần đạt cấp ${item.requiredLevel} để sử dụng`;
  }
  return null;
}

export async function getCatalogItems() {
  await ensureItemCatalog();
  return db.select().from(itemsTable);
}