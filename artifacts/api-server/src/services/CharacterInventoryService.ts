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
const ENHANCEMENT_MULTIPLIER = 0.10; // Chuẩn +10% mỗi cấp cường hóa

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
    rarity: characterItemsTable.rarity,
    socketsJson: characterItemsTable.socketsJson,
    reforgeStatsJson: characterItemsTable.reforgeStatsJson,
    runesJson: characterItemsTable.runesJson,
  }).from(characterItemsTable)
    .innerJoin(itemsTable, eq(characterItemsTable.itemId, itemsTable.id))
    .where(and(
      eq(characterItemsTable.characterId, characterId),
      eq(characterItemsTable.equipped, true),
    ));

  const bonuses: Record<string, number> = {
    hpBoost: 0, mpBoost: 0, atkBoost: 0, matkBoost: 0, defBoost: 0, mdefBoost: 0,
    spdBoost: 0, strBoost: 0, dexBoost: 0, intBoost: 0, lukBoost: 0, vitBoost: 0,
    critRateBoost: 0, bonusCombatPower: 0, evasionBoost: 0, critDmgBoost: 0,
  };

  let hasMiracleEquipped = false;

  for (const row of equippedRows) {
    const item = row.item ?? row;
    const isMiracle = (item.rarity || row.rarity || "").toLowerCase() === "miracle";
    if (isMiracle) hasMiracleEquipped = true;

    // Check Class Affinity (Ràng Buộc Đúng Chức Nghiệp / Hệ Phái)
    // Nếu mặc TRÁI Chức Nghiệp: bị phạt giảm 50% chỉ số & vô hiệu hóa Phù Văn
    const isClassMatch =
      !item.classId ||
      item.classId === "all" ||
      item.classId.toLowerCase() === (character.classId || "").toLowerCase() ||
      (item.classId.includes("assassin") && (character.classId || "").includes("sat_thu")) ||
      (item.classId.includes("sat_thu") && (character.classId || "").includes("assassin")) ||
      (item.classId.includes("fighter") && (character.classId || "").includes("chien_binh")) ||
      (item.classId.includes("tank") && (character.classId || "").includes("ho_ve")) ||
      (item.classId.includes("gunner") && (character.classId || "").includes("xa_thu"));

    const classMultiplier = isClassMatch ? 1.0 : 0.5;

    // Phẩm chất Kì Tích: Chỉ số vượt trội +250% so với thông thường
    const miracleMult = isMiracle ? 3.5 : 1.0;
    const multiplier = (1 + Number(row.enhanceLevel ?? 0) * ENHANCEMENT_MULTIPLIER) * miracleMult * classMultiplier;

    for (const stat of Object.keys(bonuses)) {
      if (stat === "bonusCombatPower") {
        bonuses[stat] += Math.floor((Number(row.bonusCombatPower ?? 0) + (isMiracle ? 2500 : 0)) * classMultiplier);
      } else if (stat in item || (item as any)[stat]) {
        bonuses[stat] += Math.floor(numericItemStat(item, stat) * multiplier);
      }
    }

    // ── Phù Văn Trang Bị (Equipment Runes: 3-4 Dòng) ──
    // Kích hoạt 100% và cộng Lực Chiến nếu ĐÚNG chức nghiệp; Vô hiệu hóa nếu TRÁI chức nghiệp
    if (isClassMatch) {
      const runes = typeof (row as any).runesJson === "string" ? (() => { try { return JSON.parse((row as any).runesJson); } catch { return []; } })() : ((row as any).runesJson || []);
      if (Array.isArray(runes)) {
        for (const r of runes) {
          if (!r) continue;
          if (r.combatPower) bonuses.bonusCombatPower += Number(r.combatPower);
        }
      }
    }

    // ── Khảm Bảo Thạch (Gem Sockets) ──
    const sockets = typeof row.socketsJson === "string" ? (() => { try { return JSON.parse(row.socketsJson); } catch { return []; } })() : (row.socketsJson || []);
    if (Array.isArray(sockets)) {
      for (const sock of sockets) {
        if (!sock || !sock.gemType) continue;
        const lvl = Math.min(5, Math.max(1, Number(sock.level) || 1));
        const idx = lvl - 1;
        if (sock.gemType === "ruby") {
          const atkVals = [15, 35, 70, 120, 200];
          bonuses.atkBoost += atkVals[idx] || 15;
          bonuses.bonusCombatPower += (idx + 1) * 150;
        } else if (sock.gemType === "sapphire") {
          const defVals = [12, 28, 55, 95, 160];
          const mdefVals = [10, 22, 45, 80, 135];
          const hpVals = [80, 200, 450, 900, 1800];
          bonuses.defBoost += defVals[idx] || 12;
          bonuses.mdefBoost += mdefVals[idx] || 10;
          bonuses.hpBoost += hpVals[idx] || 80;
          bonuses.bonusCombatPower += (idx + 1) * 150;
        } else if (sock.gemType === "topaz") {
          const critVals = [2, 4, 7, 11, 16];
          const critDmgVals = [5, 10, 18, 28, 45];
          bonuses.critRateBoost += critVals[idx] || 2;
          bonuses.critDmgBoost += critDmgVals[idx] || 5;
          bonuses.bonusCombatPower += (idx + 1) * 160;
        } else if (sock.gemType === "emerald") {
          const spdVals = [1, 2, 3, 5, 8];
          const evaVals = [2, 4, 7, 11, 18];
          bonuses.spdBoost += spdVals[idx] || 1;
          bonuses.evasionBoost += evaVals[idx] || 2;
          bonuses.bonusCombatPower += (idx + 1) * 140;
        }
      }
    }

    // ── Tẩy Luyện Dòng Ẩn (Sub-stat Reforging) ──
    const reforgeLines = typeof row.reforgeStatsJson === "string" ? (() => { try { return JSON.parse(row.reforgeStatsJson); } catch { return []; } })() : (row.reforgeStatsJson || []);
    if (Array.isArray(reforgeLines)) {
      for (const line of reforgeLines) {
        if (!line || !line.key || line.value === undefined) continue;
        const val = Number(line.value) || 0;
        if (line.key === "atk" || line.key === "bonus_atk") bonuses.atkBoost += val;
        else if (line.key === "def" || line.key === "bonus_def") bonuses.defBoost += val;
        else if (line.key === "hp" || line.key === "bonus_hp") bonuses.hpBoost += val;
        else if (line.key === "crit" || line.key === "crit_rate") bonuses.critRateBoost += val;
        else if (line.key === "spd") bonuses.spdBoost += val;
        
        // Combat power bonus based on rank
        const rankBonus = line.rank === "SS" ? 500 : line.rank === "S" ? 300 : line.rank === "A" ? 180 : line.rank === "B" ? 100 : 50;
        bonuses.bonusCombatPower += rankBonus;
      }
    }
  }

  // ── Thức Tỉnh Chuyển Chức: +20% mỗi Bậc (Tier 1-3) ──
  const awakeningTier = Math.min(3, Math.max(0, Number(character.awakeningTier) || 0));
  const awakeningMult = 1.0 + (awakeningTier * 0.20);

  // ── Cây Thiên Phú (Talent Tree) ──
  let talents: Record<string, number> = {};
  try {
    talents = typeof character.talentsJson === "string" ? JSON.parse(character.talentsJson) : (character.talentsJson || {});
  } catch {
    talents = {};
  }
  // Nhánh Cuồng Nộ:
  bonuses.atkBoost += (Number(talents.fury_1) || 0) * 8; // Cuồng Long Trảm (+8 ATK/point)
  bonuses.critRateBoost += (Number(talents.fury_2) || 0) * 2; // Tử Thần Chi Nhãn (+2% Crit/point)
  bonuses.bonusCombatPower += (Number(talents.fury_3) || 0) * 250; // Thiên Băng Trảm (+250 CP)
  // Nhánh Kiên Cường:
  bonuses.defBoost += (Number(talents.fort_1) || 0) * 8; // Kim Cương Hộ Thể (+8 DEF/point)
  bonuses.hpBoost += (Number(talents.fort_2) || 0) * 120; // Bất Diệt Sinh Mệnh (+120 HP/point)
  bonuses.mdefBoost += (Number(talents.fort_3) || 0) * 10; // Thánh Thuẫn (+10 MDEF)
  // Nhánh Linh Hoạt:
  bonuses.spdBoost += (Number(talents.agility_1) || 0) * 1; // Thần Tốc Du Long (+1 SPD)
  bonuses.evasionBoost += (Number(talents.agility_2) || 0) * 2; // Thời Khắc Tinh Thông (+2% EVA)

  // ── Sách Đồ Giám Sưu Tầm (Codex Permanent Buffs) ──
  let codexUnlocked: string[] = [];
  try {
    codexUnlocked = typeof character.codexUnlockedJson === "string" ? JSON.parse(character.codexUnlockedJson) : (character.codexUnlockedJson || []);
  } catch {
    codexUnlocked = [];
  }
  if (Array.isArray(codexUnlocked) && codexUnlocked.length > 0) {
    bonuses.hpBoost += codexUnlocked.length * 20; // +20 HP mỗi mốc đồ giám
    bonuses.atkBoost += codexUnlocked.length * 3; // +3 ATK mỗi mốc đồ giám
    bonuses.defBoost += codexUnlocked.length * 3; // +3 DEF mỗi mốc đồ giám
    bonuses.bonusCombatPower += codexUnlocked.length * 100;
  }

  const levelStats = getStatsForLevel(character.classId, character.level || 1);
  const baseHp = Math.floor(levelStats.hp * awakeningMult);
  const baseMp = Math.floor(levelStats.mp * awakeningMult);
  const baseAtk = Math.floor(levelStats.atk * awakeningMult);
  const baseMatk = Math.floor((10 + Math.max(0, (character.level || 1) - 1) * 3) * awakeningMult);
  const baseDef = Math.floor(levelStats.def * awakeningMult);
  const baseSpd = levelStats.spd;
  const baseCrit = levelStats.critRate;
  const baseEva = levelStats.evasion;

  const baseCls = CHARACTER_CLASSES.find((c) => c.id === character.classId) || CHARACTER_CLASSES[0];

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
  const spd = baseSpd + Math.min(10, Math.floor(dex * 0.15)) + bonuses.spdBoost;
  const critRate = Math.min(85, baseCrit + Math.floor(luk * 0.4 + dex * 0.1) + bonuses.critRateBoost);
  const evasion = Math.min(65, baseEva + Math.floor(dex * 0.3 + luk * 0.2) + (bonuses.evasionBoost || 0));
  const critDmg = 150 + (bonuses.critDmgBoost || 0);
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
    critDmg,
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
        const curSlots = Number(character.unlockedSlots || 15);
        if (curSlots >= 30) {
          throw new InventoryRuleError("Hành trang đã đạt giới hạn tối đa (30 ô)!");
        }
        const newSlots = Math.min(30, curSlots + 5);

        const quantityRemaining = Number(owned.quantity) - 1;
        if (quantityRemaining === 0) {
          await tx.delete(characterItemsTable).where(eq(characterItemsTable.id, ownershipId));
        } else {
          await tx.update(characterItemsTable).set({ quantity: quantityRemaining }).where(eq(characterItemsTable.id, ownershipId));
        }

        const [updatedChar] = await tx
          .update(charactersTable)
          .set({ unlockedSlots: newSlots })
          .where(eq(charactersTable.id, characterId))
          .returning();

        return {
          character: updatedChar ?? character,
          consumed: { ownershipId, itemId: item.id, quantityRemaining },
          effect: { inventoryExpanded: 5, unlockedSlots: newSlots },
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
