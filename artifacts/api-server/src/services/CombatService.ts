import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import {
  db,
  battleLogsTable,
  charactersTable,
  characterItemsTable,
  itemsTable,
  monstersTable,
} from "@workspace/db";
import { calculateLevelProgression, getStatsForLevel } from "../rules/combatRules";
import { recalculateCharacterStats } from "./CharacterInventoryService";
import { playerPartyMap } from "../routes/multiplayer";

export interface PersistBattleInput {
  userId: number;
  characterId: number;
  monsterId: string;
  monsterName: string;
  victory: boolean;
  expGained: number;
  goldGained: number;
  playerFinalHp?: number;
  dropItems?: boolean;
  encounterId?: string;
}

export interface GrantedLootItem {
  itemId: string;
  name: string;
  rarity: string;
  quantity: number;
  slotIndex: number;
}

export class CombatService {
  static async getMonster(monsterId: string) {
    const [monster] = await db.select().from(monstersTable).where(eq(monstersTable.id, monsterId)).limit(1);
    return monster;
  }

  static async persistBattleResult(input: PersistBattleInput) {
    return db.transaction(async (tx: any) => {
      const [character] = await tx.select().from(charactersTable).where(and(
        eq(charactersTable.id, input.characterId),
        eq(charactersTable.userId, input.userId),
      )).limit(1);
      if (!character) throw new Error("Không tìm thấy nhân vật hoặc không có quyền chiến đấu");

      // Party System: Nếu nhân vật thuộc tổ đội đang hoạt động, nhận Buff +15% EXP
      const inParty = playerPartyMap.has(input.characterId);
      const effectiveExp = (inParty && input.expGained > 0 && input.victory)
        ? Math.round(input.expGained * 1.15)
        : (input.victory ? input.expGained : 0);

      const effectiveGold = input.victory ? input.goldGained : 0;

      const progression = calculateLevelProgression(character.experience, character.level, effectiveExp);
      const levelStats = getStatsForLevel(character.classId, progression.newLevel);

      let targetHp: number;
      if (input.victory) {
        if (progression.leveledUp) {
          targetHp = levelStats.hp; // Level up restores full health
        } else if (input.playerFinalHp !== undefined) {
          targetHp = Math.min(levelStats.hp, Math.max(1, input.playerFinalHp));
        } else {
          targetHp = Math.max(1, character.hp);
        }
      } else {
        // Player defeated: resurrected at safe town with partial health
        targetHp = Math.max(1, Math.floor(character.maxHp * 0.2));
      }

      const [updatedBase] = await tx.update(charactersTable).set({
        level: progression.newLevel,
        experience: progression.newExp,
        maxHp: levelStats.hp,
        hp: targetHp,
        atk: levelStats.atk,
        def: levelStats.def,
        spd: levelStats.spd,
        gold: character.gold + effectiveGold,
        unallocatedStatPoints: (character.unallocatedStatPoints || 0) + (input.victory ? progression.statPointsGained : 0),
        skillPoints: (character.skillPoints || 0) + (input.victory ? progression.skillPointsGained : 0),
        kills: character.kills + (input.victory ? 1 : 0),
        deaths: character.deaths + (input.victory ? 0 : 1),
      }).where(and(
        eq(charactersTable.id, input.characterId),
        eq(charactersTable.userId, input.userId),
      )).returning();
      if (!updatedBase) throw new Error("Không thể ghi kết quả chiến đấu");

      // Roll Authoritative Loot Drops
      const dropsGranted: GrantedLootItem[] = [];
      if (input.victory && input.dropItems !== false && input.monsterId) {
        const [monster] = await tx
          .select()
          .from(monstersTable)
          .where(eq(monstersTable.id, input.monsterId))
          .limit(1);

        if (monster && monster.dropTableJson) {
          try {
            const dropTable: Array<{ itemId: string; chancePercent: number }> =
              JSON.parse(monster.dropTableJson);

            if (Array.isArray(dropTable) && dropTable.length > 0) {
              const existingItems = await tx
                .select({ slotIndex: characterItemsTable.slotIndex })
                .from(characterItemsTable)
                .where(eq(characterItemsTable.characterId, input.characterId));

              const takenSlots = new Set<number>(existingItems.map((i: any) => i.slotIndex));
              const maxSlots = character.unlockedSlots || 18;

              for (const drop of dropTable) {
                if ((crypto.randomInt(0, 10000) / 100) < drop.chancePercent) {
                  let freeSlot: number | null = null;
                  for (let s = 0; s < maxSlots; s++) {
                    if (!takenSlots.has(s)) {
                      freeSlot = s;
                      break;
                    }
                  }

                  if (freeSlot !== null) {
                    const [itemDef] = await tx
                      .select()
                      .from(itemsTable)
                      .where(eq(itemsTable.id, drop.itemId))
                      .limit(1);

                    if (itemDef) {
                      await tx.insert(characterItemsTable).values({
                        characterId: input.characterId,
                        itemId: itemDef.id,
                        equipped: false,
                        slotIndex: freeSlot,
                        quantity: 1,
                        enhanceLevel: 0,
                        rarity: itemDef.rarity || "common",
                      });
                      takenSlots.add(freeSlot);
                      dropsGranted.push({
                        itemId: itemDef.id,
                        name: itemDef.name,
                        rarity: itemDef.rarity || "common",
                        quantity: 1,
                        slotIndex: freeSlot,
                      });
                    }
                  }
                }
              }
            }
          } catch {
            // Silently ignore drop parsing errors to not abort combat commit
          }
        }
      }

      const updatedCharacter = await recalculateCharacterStats(input.characterId, tx);
      await tx.insert(battleLogsTable).values({
        characterId: input.characterId,
        encounterId: (input.encounterId as any) || null,
        monsterId: input.monsterId,
        monsterName: input.monsterName,
        victory: input.victory,
        expGained: effectiveExp,
        goldGained: effectiveGold,
      });

      return {
        character: updatedCharacter,
        newLevel: progression.newLevel,
        leveledUp: input.victory && progression.leveledUp,
        expToNextLevel: progression.expToNextLevel,
        expGained: effectiveExp,
        goldGained: effectiveGold,
        victory: input.victory,
        drops: dropsGranted,
        partyBuffActive: inParty,
      };
    });
  }
}
