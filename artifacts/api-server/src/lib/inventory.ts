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
    (bonuses: EquipmentBonuses, item: any) => ({
      hpBoost: bonuses.hpBoost + (item.hpBoost || 0),
      atkBoost: bonuses.atkBoost + (item.atkBoost || 0),
      defBoost: bonuses.defBoost + (item.defBoost || 0),
      spdBoost: bonuses.spdBoost + (item.spdBoost || 0),
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

  return rows
    .map((row: any) => {
      const it = row.item || row;
      const ownershipId = row.ownershipId ?? row.id;
      const equipped = Boolean(row.equipped);
      const acquiredAt = row.acquiredAt ?? row.acquired_at ?? new Date();

      if (!it || !it.id) return null;

      return {
        id: it.id,
        name: it.name || "Vật phẩm",
        type: it.type || "weapon",
        description: it.description || "",
        rarity: it.rarity || "common",
        hpBoost: it.hpBoost ?? it.hp_boost ?? 0,
        atkBoost: it.atkBoost ?? it.atk_boost ?? 0,
        defBoost: it.defBoost ?? it.def_boost ?? 0,
        spdBoost: it.spdBoost ?? it.spd_boost ?? 0,
        price: it.price ?? 0,
        classId: it.classId ?? it.class_id ?? null,
        requiredLevel: it.requiredLevel ?? it.required_level ?? 1,
        icon: it.icon || "◇",
        ownershipId,
        equipped,
        acquiredAt: typeof acquiredAt === "string" ? acquiredAt : acquiredAt.toISOString(),
      };
    })
    .filter(Boolean);
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

  if (!owned) return undefined;
  const item = owned.item || owned;
  return {
    ownershipId: owned.ownershipId ?? owned.id,
    equipped: Boolean(owned.equipped),
    characterId: owned.characterId ?? characterId,
    item,
  };
}

export async function getItem(itemId: string): Promise<Item | undefined> {
  const [item] = await db
    .select()
    .from(itemsTable)
    .where(eq(itemsTable.id, itemId))
    .limit(1);
  return item;
}

export async function getCharacterForUser(characterId: number, userId: number): Promise<Character | undefined> {
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

export async function getCatalogItems(): Promise<Item[]> {
  await ensureItemCatalog();
  return db.select().from(itemsTable);
}