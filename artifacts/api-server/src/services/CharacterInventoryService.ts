import { and, eq } from "drizzle-orm";
import {
  db,
  characterItemsTable,
  charactersTable,
  itemsTable,
} from "@workspace/db";
import { getStatsForLevel, CHARACTER_CLASSES } from "../data/classes";

const ENHANCEMENT_LIMIT = 15;
const ENHANCEMENT_COST = 100;
const ENHANCEMENT_POWER = 100;
const ENHANCEMENT_MULTIPLIER = 0.12;

export class InventoryRuleError extends Error {
  constructor(message: string, public readonly statusCode = 400) {
    super(message);
    this.name = "InventoryRuleError";
  }
}

const numericItemStat = (item: any, property: string) => Number(item?.[property] ?? item?.[property.replace(/[A-Z]/g, (letter: string) => `_${letter.toLowerCase()}`)] ?? 0);

export async function recalculateCharacterStats(characterId: number, executor: any = db) {
  const [character] = await executor.select().from(charactersTable)
    .where(eq(charactersTable.id, characterId)).limit(1);
  if (!character) throw new InventoryRuleError("Không tìm thấy nhân vật để tính lại chỉ số", 404);

  const equippedRows = await executor.select({
    item: itemsTable,
    enhanceLevel: characterItemsTable.enhanceLevel,
    bonusCombatPower: characterItemsTable.bonusCombatPower,
  }).from(characterItemsTable)
    .innerJoin(itemsTable, eq(characterItemsTable.itemId, itemsTable.id))
    .where(and(
      eq(characterItemsTable.characterId, characterId),
      eq(characterItemsTable.equipped, true),
    ));

  const bonuses: Record<string, number> = {
    hpBoost: 0, mpBoost: 0, atkBoost: 0, matkBoost: 0, defBoost: 0, mdefBoost: 0,
    spdBoost: 0, strBoost: 0, dexBoost: 0, intBoost: 0, lukBoost: 0, vitBoost: 0,
    critRateBoost: 0, bonusCombatPower: 0,
  };

  for (const row of equippedRows) {
    const item = row.item ?? row;
    const multiplier = 1 + Number(row.enhanceLevel ?? 0) * ENHANCEMENT_MULTIPLIER;
    for (const stat of Object.keys(bonuses)) {
      if (stat === "bonusCombatPower") {
        bonuses[stat] += Number(row.bonusCombatPower ?? 0);
      } else {
        bonuses[stat] += Math.floor(numericItemStat(item, stat) * multiplier);
      }
    }
  }

  const baseCls = CHARACTER_CLASSES.find((c) => c.id === character.classId) || CHARACTER_CLASSES[0];
  const baseHp = baseCls.baseHp;
  const baseMp = baseCls.baseMp;
  const baseAtk = baseCls.baseAtk;
  const baseMatk = 10;
  const baseDef = baseCls.baseDef;
  const baseSpd = baseCls.baseSpd;
  const baseCrit = baseCls.critRate;
  const baseEva = baseCls.evasion;

  const str = Math.max((baseCls as any).baseStr || 8, character.str || 8);
  const dex = Math.max((baseCls as any).baseDex || 5, character.dex || 5);
  const intel = Math.max((baseCls as any).baseInt || 5, character.intel || 5);
  const luk = Math.max((baseCls as any).baseLuk || 5, character.luk || 5);
  const vit = Math.max((baseCls as any).baseVit || 5, character.vit || 5);

  const maxHp = baseHp + (vit * 18) + bonuses.hpBoost;
  const maxMp = baseMp + (intel * 10) + bonuses.mpBoost;
  const atk = baseAtk + Math.floor(str * 1.5 + dex * 0.5) + bonuses.atkBoost;
  const matk = baseMatk + Math.floor(intel * 1.8) + bonuses.matkBoost;
  const def = baseDef + Math.floor(vit * 0.8 + str * 0.4) + bonuses.defBoost;
  const spd = baseSpd + Math.min(8, Math.floor(dex * 0.15)) + bonuses.spdBoost;
  const critRate = Math.min(75, baseCrit + Math.floor(luk * 0.4 + dex * 0.1) + bonuses.critRateBoost);
  const evasion = Math.min(60, baseEva + Math.floor(dex * 0.3 + luk * 0.2));
  const combatPower = Math.floor(
    maxHp * 0.2 + maxMp * 0.1 + atk * 8 + matk * 6 + def * 10 + spd * 15 + critRate * 12 + bonuses.bonusCombatPower
  );

  const currentHpRatio = character.maxHp > 0 ? Math.min(1, Math.max(0, character.hp / character.maxHp)) : 1;
  const currentMpRatio = character.maxMp > 0 ? Math.min(1, Math.max(0, character.mp / character.maxMp)) : 1;

  const nextStats = {
    str,
    dex,
    intel,
    luk,
    vit,
    maxHp,
    hp: Math.min(maxHp, Math.round(currentHpRatio * maxHp)),
    maxMp,
    mp: Math.min(maxMp, Math.round(currentMpRatio * maxMp)),
    atk,
    matk,
    def,
    mdef: 15 + (character.level - 1) + bonuses.mdefBoost,
    spd,
    critRate,
    critDmg: 150,
    accuracy: 95,
    evasion,
    combatPower,
  };

  const [updated] = await executor.update(charactersTable)
    .set(nextStats)
    .where(eq(charactersTable.id, characterId))
    .returning();
  return updated ?? { ...character, ...nextStats };
}

export class CharacterInventoryService {
  static async recalculateCharacterStats(characterId: number, executor: any = db) {
    return recalculateCharacterStats(characterId, executor);
  }

  static async enhance(userId: number, characterId: number, ownershipId: number) {
    return db.transaction(async (tx: any) => {
      const [character] = await tx.select().from(charactersTable).where(and(
        eq(charactersTable.id, characterId),
        eq(charactersTable.userId, userId),
      )).limit(1);
      if (!character) throw new InventoryRuleError("Không tìm thấy nhân vật", 404);

      const [owned] = await tx.select().from(characterItemsTable).where(and(
        eq(characterItemsTable.id, ownershipId),
        eq(characterItemsTable.characterId, characterId),
      )).limit(1);
      if (!owned) throw new InventoryRuleError("Vật phẩm này không nằm trong túi nhân vật", 404);

      const [item] = await tx.select().from(itemsTable).where(eq(itemsTable.id, owned.itemId)).limit(1);
      if (!item) throw new InventoryRuleError("Danh mục vật phẩm không còn tồn tại", 404);
      if (item.category !== "equipment" || item.equipSlot === "none") {
        throw new InventoryRuleError("Chỉ có thể cường hóa trang bị");
      }
      if (Number(owned.enhanceLevel) >= ENHANCEMENT_LIMIT) {
        throw new InventoryRuleError(`Trang bị đã đạt giới hạn +${ENHANCEMENT_LIMIT}`);
      }

      const nextLevel = Number(owned.enhanceLevel) + 1;
      const goldCost = nextLevel * ENHANCEMENT_COST;
      if (character.gold < goldCost) throw new InventoryRuleError(`Cần ${goldCost} vàng để cường hóa`);

      const [updatedOwned] = await tx.update(characterItemsTable)
        .set({ enhanceLevel: nextLevel, bonusCombatPower: Number(owned.bonusCombatPower ?? 0) + nextLevel * ENHANCEMENT_POWER })
        .where(eq(characterItemsTable.id, ownershipId))
        .returning();
      const [chargedCharacter] = await tx.update(charactersTable)
        .set({ gold: character.gold - goldCost })
        .where(and(eq(charactersTable.id, characterId), eq(charactersTable.userId, userId)))
        .returning();
      if (!chargedCharacter) throw new InventoryRuleError("Không thể cập nhật vàng nhân vật", 409);

      const updatedCharacter = await recalculateCharacterStats(characterId, tx);
      return { character: updatedCharacter, item: updatedOwned, goldCost };
    });
  }

  static async use(userId: number, characterId: number, ownershipId: number) {
    return db.transaction(async (tx: any) => {
      const [character] = await tx.select().from(charactersTable).where(and(
        eq(charactersTable.id, characterId),
        eq(charactersTable.userId, userId),
      )).limit(1);
      if (!character) throw new InventoryRuleError("Không tìm thấy nhân vật", 404);

      const [owned] = await tx.select().from(characterItemsTable).where(and(
        eq(characterItemsTable.id, ownershipId),
        eq(characterItemsTable.characterId, characterId),
      )).limit(1);
      if (!owned || owned.quantity < 1) throw new InventoryRuleError("Vật phẩm không có trong túi", 404);

      const [item] = await tx.select().from(itemsTable).where(eq(itemsTable.id, owned.itemId)).limit(1);
      if (!item) throw new InventoryRuleError("Danh mục vật phẩm không còn tồn tại", 404);
      if (item.category !== "consumable") throw new InventoryRuleError("Vật phẩm này không thể sử dụng");

      if (item.type === "inventory_ticket" || item.id === "ticket_inventory_expand") {
        const quantityRemaining = Number(owned.quantity) - 1;
        if (quantityRemaining === 0) {
          await tx.delete(characterItemsTable).where(eq(characterItemsTable.id, ownershipId));
        } else {
          await tx.update(characterItemsTable).set({ quantity: quantityRemaining }).where(eq(characterItemsTable.id, ownershipId));
        }
        return {
          character,
          consumed: { ownershipId, itemId: item.id, quantityRemaining },
          effect: { inventoryExpanded: 5 },
        };
      }

      const healsHp = Number(item.healHpPercent ?? 0) > 0;
      const healsMp = Number(item.healMpPercent ?? 0) > 0;
      const hasBuff = Boolean(item.buffType);
      if (!healsHp && !healsMp && !hasBuff) throw new InventoryRuleError("Vật phẩm không có hiệu ứng sử dụng");

      const hp = Math.min(character.maxHp, character.hp + Math.ceil(character.maxHp * Number(item.healHpPercent ?? 0) / 100));
      const mp = Math.min(character.maxMp, character.mp + Math.ceil(character.maxMp * Number(item.healMpPercent ?? 0) / 100));
      if (hp === character.hp && mp === character.mp && !hasBuff) {
        throw new InventoryRuleError("Sinh lực và nội lực đang đầy");
      }

      const quantityRemaining = Number(owned.quantity) - 1;
      if (quantityRemaining === 0) {
        await tx.delete(characterItemsTable).where(eq(characterItemsTable.id, ownershipId));
      } else {
        await tx.update(characterItemsTable).set({ quantity: quantityRemaining }).where(eq(characterItemsTable.id, ownershipId));
      }
      const [updatedCharacter] = await tx.update(charactersTable).set({ hp, mp }).where(and(
        eq(charactersTable.id, characterId),
        eq(charactersTable.userId, userId),
      )).returning();
      if (!updatedCharacter) throw new InventoryRuleError("Không thể cập nhật nhân vật", 409);

      return {
        character: updatedCharacter,
        consumed: { ownershipId, itemId: item.id, quantityRemaining },
        effect: { hpRestored: hp - character.hp, mpRestored: mp - character.mp, buffType: item.buffType ?? null },
      };
    });
  }
}
