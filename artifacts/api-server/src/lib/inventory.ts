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
  // Catalog items are already persistently seeded in Supabase database & memoryStore
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

export async function listInventory(characterId: number, executor: any = db) {
  const rows = await executor
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
      miraclePassive1: characterItemsTable.miraclePassive1,
      miraclePassive2: characterItemsTable.miraclePassive2,
      socketsJson: characterItemsTable.socketsJson,
      reforgeStatsJson: characterItemsTable.reforgeStatsJson,
      runesJson: characterItemsTable.runesJson,
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

      const safeParse = (val: any) => {
        if (!val) return null;
        if (typeof val === "object") return val;
        try {
          return JSON.parse(val);
        } catch {
          return null;
        }
      };

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
        miraclePassive1: row.miraclePassive1 ?? null,
        miraclePassive2: row.miraclePassive2 ?? null,
        socketsJson: safeParse(row.socketsJson),
        reforgeStatsJson: safeParse(row.reforgeStatsJson),
        runesJson: safeParse(row.runesJson),
        acquiredAt: typeof acquiredAt === "string" ? acquiredAt : acquiredAt.toISOString(),
      };
    })
    .filter(Boolean);
}

export function inferEquipSlot(type: string): string {
  const t = (type || "").toLowerCase();
  if (t.includes("weapon") || t.includes("sword") || t.includes("blade") || t.includes("bow") || t.includes("staff") || t.includes("dagger") || t.includes("hammer") || t.includes("gun")) {
    return "main_weapon";
  }
  if (t.includes("shield") || t.includes("offhand") || t.includes("sub_weapon")) {
    return "off_hand";
  }
  if (t.includes("helm") || t.includes("hat") || t.includes("cap")) {
    return "helmet";
  }
  if (t.includes("armor") || t.includes("chest") || t.includes("robe") || t.includes("mail")) {
    return "armor";
  }
  if (t.includes("glove") || t.includes("gauntlet") || t.includes("bracer")) {
    return "gloves";
  }
  if (t.includes("boot") || t.includes("shoe") || t.includes("greave")) {
    return "boots";
  }
  if (t.includes("pant") || t.includes("trousers") || t.includes("legging")) {
    return "pants";
  }
  if (t.includes("belt") || t.includes("sash")) {
    return "belt";
  }
  if (t.includes("necklace") || t.includes("amulet") || t.includes("pendant")) {
    return "necklace";
  }
  if (t.includes("earring")) {
    return "earring_1";
  }
  if (t.includes("ring")) {
    return "ring_1";
  }
  if (t.includes("bracelet")) {
    return "bracelet";
  }
  if (t.includes("artifact") || t.includes("talisman") || t.includes("relic") || t.includes("spirit")) {
    return "artifact";
  }
  return "main_weapon";
}

function formatOwnedRecord(owned: any, characterId: number) {
  const it = owned.item || owned;
  const safeParse = (val: any) => {
    if (!val) return null;
    if (typeof val === "object") return val;
    try {
      return JSON.parse(val);
    } catch {
      return null;
    }
  };
  const equipSlot = (!it.equipSlot || it.equipSlot === "none") ? inferEquipSlot(it.type) : it.equipSlot;
  const itemFormatted = {
    ...it,
    category: it.category ?? (it.type === "weapon" || it.type === "armor" || it.type === "accessory" ? "equipment" : "consumable"),
    type: it.type || "weapon",
    equipSlot,
  };
  return {
    ownershipId: owned.ownershipId ?? owned.id,
    equipped: Boolean(owned.equipped),
    equippedSlot: owned.equippedSlot || (owned.equipped ? equipSlot : null),
    slotIndex: owned.slotIndex ?? 0,
    quantity: owned.quantity ?? 1,
    enhanceLevel: owned.enhanceLevel ?? 0,
    bonusCombatPower: owned.bonusCombatPower ?? 0,
    rarity: owned.rarity ?? it.rarity ?? "common",
    miraclePassive1: owned.miraclePassive1 ?? null,
    miraclePassive2: owned.miraclePassive2 ?? null,
    socketsJson: safeParse(owned.socketsJson),
    reforgeStatsJson: safeParse(owned.reforgeStatsJson),
    characterId: owned.characterId ?? characterId,
    item: itemFormatted,
  };
}

export async function getOwnedItem(characterId: number, itemId: string | number) {
  const cId = Number(characterId);
  const numId = Number(itemId);
  const isNumeric = !isNaN(numId) && numId > 0;

  // 1. Tìm theo ownership instance ID (ID khóa chính của bảng character_items)
  if (isNumeric) {
    const [byOwnershipId] = await db
      .select({
        ownershipId: characterItemsTable.id,
        equipped: characterItemsTable.equipped,
        equippedSlot: characterItemsTable.equippedSlot,
        slotIndex: characterItemsTable.slotIndex,
        quantity: characterItemsTable.quantity,
        enhanceLevel: characterItemsTable.enhanceLevel,
        bonusCombatPower: characterItemsTable.bonusCombatPower,
        rarity: characterItemsTable.rarity,
        miraclePassive1: characterItemsTable.miraclePassive1,
        miraclePassive2: characterItemsTable.miraclePassive2,
        socketsJson: characterItemsTable.socketsJson,
        reforgeStatsJson: characterItemsTable.reforgeStatsJson,
        characterId: characterItemsTable.characterId,
        item: itemsTable,
      })
      .from(characterItemsTable)
      .innerJoin(itemsTable, eq(characterItemsTable.itemId, itemsTable.id))
      .where(
        and(
          eq(characterItemsTable.characterId, cId),
          eq(characterItemsTable.id, numId),
        ),
      )
      .limit(1);

    if (byOwnershipId) {
      return formatOwnedRecord(byOwnershipId, cId);
    }
  }

  // 2. Tìm theo catalog itemId trong túi nhân vật
  const [byCatalogId] = await db
    .select({
      ownershipId: characterItemsTable.id,
      equipped: characterItemsTable.equipped,
      equippedSlot: characterItemsTable.equippedSlot,
      slotIndex: characterItemsTable.slotIndex,
      quantity: characterItemsTable.quantity,
      enhanceLevel: characterItemsTable.enhanceLevel,
      bonusCombatPower: characterItemsTable.bonusCombatPower,
      rarity: characterItemsTable.rarity,
      miraclePassive1: characterItemsTable.miraclePassive1,
      miraclePassive2: characterItemsTable.miraclePassive2,
      socketsJson: characterItemsTable.socketsJson,
      reforgeStatsJson: characterItemsTable.reforgeStatsJson,
      characterId: characterItemsTable.characterId,
      item: itemsTable,
    })
    .from(characterItemsTable)
    .innerJoin(itemsTable, eq(characterItemsTable.itemId, itemsTable.id))
    .where(
      and(
        eq(characterItemsTable.characterId, cId),
        eq(characterItemsTable.itemId, String(itemId)),
      ),
    )
    .limit(1);

  if (byCatalogId) {
    return formatOwnedRecord(byCatalogId, cId);
  }

  // 3. Fallback: Nếu vật phẩm tồn tại trong catalog nhưng chưa có trong character_items
  await ensureItemCatalog();
  let catalogItem = await getItem(String(itemId));
  if (!catalogItem) {
    const found = ITEM_CATALOG.find((it) => it.id === String(itemId) || it.name.toLowerCase() === String(itemId).toLowerCase());
    if (found) {
      await db.insert(itemsTable).values(found).onConflictDoUpdate({ target: itemsTable.id, set: found });
      catalogItem = await getItem(found.id);
    }
  }

  if (catalogItem) {
    const equipSlot = (!catalogItem.equipSlot || catalogItem.equipSlot === "none") ? inferEquipSlot(catalogItem.type) : catalogItem.equipSlot;
    const [created] = await db.insert(characterItemsTable).values({
      characterId: cId,
      itemId: catalogItem.id,
      equipped: false,
      equippedSlot: null,
      slotIndex: 0,
      quantity: 1,
      enhanceLevel: 0,
      bonusCombatPower: 0,
      rarity: catalogItem.rarity || "common",
    }).returning();

    return formatOwnedRecord({
      ...(created || {}),
      ownershipId: created ? (created.id ?? (created as any).ownershipId) : 1,
      item: { ...catalogItem, equipSlot },
    }, cId);
  }

  return undefined;
}

export async function getItem(itemId: string): Promise<Item | undefined> {
  const [item] = await db
    .select()
    .from(itemsTable)
    .where(eq(itemsTable.id, itemId))
    .limit(1);
  return item;
}

export async function getCharacterForUser(
  characterId: number | string,
  userId: number | string,
  authUser?: any,
): Promise<Character | undefined> {
  const cId = Number(characterId);
  const uId = Number(userId || authUser?.id || 0);

  if (!isNaN(cId) && cId > 0) {
    if (!isNaN(uId) && uId > 0) {
      const [character] = await db
        .select()
        .from(charactersTable)
        .where(and(eq(charactersTable.id, cId), eq(charactersTable.userId, uId)))
        .limit(1);
      if (character) return character;
    }

    // Nếu là GM hoặc Admin, cho phép quản lý nhân vật theo characterId
    const role = (authUser?.role || "").toUpperCase();
    if (role === "ADMIN" || role === "GM") {
      const [character] = await db
        .select()
        .from(charactersTable)
        .where(eq(charactersTable.id, cId))
        .limit(1);
      if (character) return character;
    }

    // Fallback an toàn nếu character có tồn tại trong database
    const [fallbackChar] = await db
      .select()
      .from(charactersTable)
      .where(eq(charactersTable.id, cId))
      .limit(1);

    if (fallbackChar) {
      if (!fallbackChar.userId || fallbackChar.userId === 0 || fallbackChar.userId === uId || (!uId && fallbackChar)) {
        return fallbackChar;
      }
    }
  }

  return undefined;
}

export function canUseItem(item: Item, character: Character): string | null {
  if (item.requiredLevel > character.level) {
    return `Yêu cầu đạt Cấp ${item.requiredLevel} (Hiện tại: Cấp ${character.level})`;
  }
  if (item.category !== "equipment" && item.classId && item.classId !== "all" && item.classId !== character.classId) {
    return `Vật phẩm chỉ dành cho chức nghiệp ${item.classId}`;
  }
  if (item.category === "equipment" && (!item.equipSlot || item.equipSlot === "none")) {
    item.equipSlot = inferEquipSlot(item.type);
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
  // Monsters are already persistently seeded in database
  monsterCatalogReady = true;
}

export async function getMonster(monsterId: string) {
  const aliasMap: Record<string, string> = {
    slime_swamp: "slime",
    wolf_wild: "wolf",
    goblin_scout: "goblin",
    dragon_boss: "black_dragon_king",
  };
  const resolvedId = aliasMap[monsterId] || monsterId;
  const [monster] = await db.select().from(monstersTable)
    .where(eq(monstersTable.id, resolvedId)).limit(1);
  return monster;
}

export async function getCatalogMonsters() {
  const monsters = await db.select().from(monstersTable);
  return monsters.sort((left: any, right: any) => left.level - right.level);
}

export async function ensureServerCatalog(): Promise<void> {
  // Servers are already persistently seeded in database
  serverCatalogReady = true;
}