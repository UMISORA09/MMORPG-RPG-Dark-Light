import { and, eq } from "drizzle-orm";
import {
  db,
  characterItemsTable,
  charactersTable,
  itemsTable,
  monstersTable,
  serversTable,
  SEED_WORLD_MONSTERS,
  SEED_SERVERS,
  type Character,
  type Item,
} from "@workspace/db";
import { ITEM_CATALOG } from "../data/items";
import { recalculateCharacterStats } from "../services/CharacterInventoryService";

let itemCatalogReady = false;
let monsterCatalogReady = false;
let serverCatalogReady = false;

export async function ensureItemCatalog(): Promise<void> {
  if (itemCatalogReady) return;
  for (const item of ITEM_CATALOG) {
    const { id, ...updates } = item;
    await db.insert(itemsTable).values(item)
      .onConflictDoUpdate({ target: itemsTable.id, set: updates });
  }
  itemCatalogReady = true;
}

export async function ensureStarterInventory(_characterId: number, _classId: string): Promise<void> {
  // HẠNG MỤC 2: Nhân vật mới tạo có hành trang rỗng 100% (Empty Starter Inventory).
  // Không tự động chèn bất kỳ món trang bị hay vật phẩm tân thủ nào vào character_items.
  return;
}

export async function toCharacterResponse(character: Character) {
  return recalculateCharacterStats(character.id);
}

export async function listInventory(characterId: number) {
  const rows = await db
    .select({
      item: itemsTable,
      ownershipId: characterItemsTable.id,
      equipped: characterItemsTable.equipped,
      equippedSlot: characterItemsTable.equippedSlot,
      slotIndex: characterItemsTable.slotIndex,
      quantity: characterItemsTable.quantity,
      enhanceLevel: characterItemsTable.enhanceLevel,
      bonusCombatPower: characterItemsTable.bonusCombatPower,
      rarity: characterItemsTable.rarity,
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
        category: (["equipment", "consumable", "material", "quest"].includes(it.category) ? it.category : "equipment"),
        type: (["weapon", "armor", "accessory", "potion", "scroll", "food", "stone", "chest"].includes(it.type) ? it.type : (it.category === "consumable" ? "scroll" : "weapon")),
        equipSlot: it.equipSlot ?? it.equip_slot ?? "none",
        description: it.description || "",
        lore: it.lore ?? "",
        rarity: it.rarity || "common",
        hpBoost: it.hpBoost ?? it.hp_boost ?? 0,
        mpBoost: it.mpBoost ?? it.mp_boost ?? 0,
        atkBoost: it.atkBoost ?? it.atk_boost ?? 0,
        matkBoost: it.matkBoost ?? it.matk_boost ?? 0,
        defBoost: it.defBoost ?? it.def_boost ?? 0,
        mdefBoost: it.mdefBoost ?? it.mdef_boost ?? 0,
        spdBoost: it.spdBoost ?? it.spd_boost ?? 0,
        strBoost: it.strBoost ?? it.str_boost ?? 0,
        dexBoost: it.dexBoost ?? it.dex_boost ?? 0,
        intBoost: it.intBoost ?? it.int_boost ?? 0,
        lukBoost: it.lukBoost ?? it.luk_boost ?? 0,
        vitBoost: it.vitBoost ?? it.vit_boost ?? 0,
        critRateBoost: it.critRateBoost ?? it.crit_rate_boost ?? 0,
        healHpPercent: it.healHpPercent ?? it.heal_hp_percent ?? 0,
        healMpPercent: it.healMpPercent ?? it.heal_mp_percent ?? 0,
        buffType: it.buffType ?? it.buff_type ?? null,
        price: it.price ?? 0,
        maxStack: it.maxStack ?? it.max_stack ?? 99,
        classId: it.classId ?? it.class_id ?? null,
        requiredLevel: it.requiredLevel ?? it.required_level ?? 1,
        icon: it.icon || "◇",
        ownershipId,
        equipped,
        equippedSlot: row.equippedSlot ?? row.equipped_slot ?? null,
        slotIndex: row.slotIndex ?? row.slot_index ?? 0,
        quantity: row.quantity ?? 1,
        enhanceLevel: row.enhanceLevel ?? row.enhance_level ?? 0,
        bonusCombatPower: row.bonusCombatPower ?? row.bonus_combat_power ?? 0,
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
      equippedSlot: characterItemsTable.equippedSlot,
      slotIndex: characterItemsTable.slotIndex,
      quantity: characterItemsTable.quantity,
      enhanceLevel: characterItemsTable.enhanceLevel,
      bonusCombatPower: characterItemsTable.bonusCombatPower,
      rarity: characterItemsTable.rarity,
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
    ownershipId: owned.ownershipId ?? (owned as any).id,
    equipped: Boolean(owned.equipped),
    equippedSlot: owned.equippedSlot,
    slotIndex: owned.slotIndex ?? 0,
    quantity: owned.quantity ?? 1,
    enhanceLevel: owned.enhanceLevel ?? 0,
    bonusCombatPower: owned.bonusCombatPower ?? 0,
    rarity: owned.rarity ?? item.rarity ?? "common",
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
  if (item.category === "equipment" && item.equipSlot === "none") {
    return "Trang bị chưa được gán ô mặc hợp lệ";
  }
  return null;
}

export async function getCatalogItems(): Promise<Item[]> {
  await ensureItemCatalog();
  const rows = await db.select().from(itemsTable);
  return rows.map((it: any) => ({
    ...it,
    category: it.category ?? (it.type === "weapon" || it.type === "armor" || it.type === "accessory" ? "equipment" : "consumable"),
    type: it.type || "weapon",
    equipSlot: it.equipSlot ?? it.equip_slot ?? (it.type === "weapon" ? "main_weapon" : it.type === "armor" ? "armor" : "none"),
    description: it.description || "",
    lore: it.lore ?? it.description ?? "",
    rarity: it.rarity || "common",
    hpBoost: it.hpBoost ?? it.hp_boost ?? 0,
    mpBoost: it.mpBoost ?? it.mp_boost ?? 0,
    atkBoost: it.atkBoost ?? it.atk_boost ?? 0,
    matkBoost: it.matkBoost ?? it.matk_boost ?? 0,
    defBoost: it.defBoost ?? it.def_boost ?? 0,
    mdefBoost: it.mdefBoost ?? it.mdef_boost ?? 0,
    spdBoost: it.spdBoost ?? it.spd_boost ?? 0,
    strBoost: it.strBoost ?? it.str_boost ?? 0,
    dexBoost: it.dexBoost ?? it.dex_boost ?? 0,
    intBoost: it.intBoost ?? it.int_boost ?? 0,
    lukBoost: it.lukBoost ?? it.luk_boost ?? 0,
    vitBoost: it.vitBoost ?? it.vit_boost ?? 0,
    critRateBoost: it.critRateBoost ?? it.crit_rate_boost ?? 0,
    healHpPercent: it.healHpPercent ?? it.heal_hp_percent ?? 0,
    healMpPercent: it.healMpPercent ?? it.heal_mp_percent ?? 0,
    buffType: it.buffType ?? it.buff_type ?? null,
    price: it.price ?? 0,
    maxStack: it.maxStack ?? it.max_stack ?? 99,
    classId: it.classId ?? it.class_id ?? null,
    requiredLevel: it.requiredLevel ?? it.required_level ?? 1,
    icon: it.icon || "◇",
  })) as Item[];
}

export async function ensureMonsterCatalog(): Promise<void> {
  if (monsterCatalogReady) return;
  for (const monster of SEED_WORLD_MONSTERS) {
    const { sortOrder: _sortOrder, ...row } = monster;
    await db.insert(monstersTable).values(row)
      .onConflictDoUpdate({ target: monstersTable.id, set: row });
  }
  monsterCatalogReady = true;
}

export async function getMonster(monsterId: string) {
  await ensureMonsterCatalog();
  const [monster] = await db.select().from(monstersTable)
    .where(eq(monstersTable.id, monsterId)).limit(1);
  return monster;
}

export async function getCatalogMonsters() {
  await ensureMonsterCatalog();
  const monsters = await db.select().from(monstersTable);
  return monsters.sort((left: any, right: any) => left.level - right.level);
}

export async function ensureServerCatalog(): Promise<void> {
  if (serverCatalogReady) return;
  for (const server of SEED_SERVERS) {
    const { id, ...updates } = server;
    await db.insert(serversTable).values(server)
      .onConflictDoUpdate({ target: serversTable.id, set: updates });
  }
  serverCatalogReady = true;
}