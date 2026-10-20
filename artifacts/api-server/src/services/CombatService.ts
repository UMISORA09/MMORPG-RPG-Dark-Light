import { and, eq } from "drizzle-orm";
import { db, battleLogsTable, charactersTable, monstersTable } from "@workspace/db";
import { calculateLevelProgression, getStatsForLevel } from "../rules/combatRules";
import { recalculateCharacterStats } from "./CharacterInventoryService";
import { playerPartyMap } from "../routes/multiplayer";

export class CombatService {
  static async getMonster(monsterId: string) {
    const [monster] = await db.select().from(monstersTable).where(eq(monstersTable.id, monsterId)).limit(1);
    return monster;
  }

  static async persistBattleResult(input: {
    userId: number;
    characterId: number;
    monsterId: string;
    monsterName: string;
    victory: boolean;
    expGained: number;
    goldGained: number;
  }) {
    return db.transaction(async (tx: any) => {
      const [character] = await tx.select().from(charactersTable).where(and(
        eq(charactersTable.id, input.characterId),
        eq(charactersTable.userId, input.userId),
      )).limit(1);
      if (!character) throw new Error("Không tìm thấy nhân vật hoặc không có quyền chiến đấu");

      // Party System: Nếu nhân vật thuộc tổ đội đang hoạt động, nhận Buff +15% EXP
      const inParty = playerPartyMap.has(input.characterId);
      const effectiveExp = (inParty && input.expGained > 0)
        ? Math.round(input.expGained * 1.15)
        : input.expGained;

      const progression = calculateLevelProgression(character.experience, character.level, effectiveExp);
      const levelStats = getStatsForLevel(character.classId, progression.newLevel);
      const [updatedBase] = await tx.update(charactersTable).set({
        level: progression.newLevel,
        experience: progression.newExp,
        maxHp: levelStats.hp,
        hp: Math.max(1, levelStats.hp),
        atk: levelStats.atk,
        def: levelStats.def,
        spd: levelStats.spd,
        gold: character.gold + input.goldGained,
        unallocatedStatPoints: (character.unallocatedStatPoints || 0) + progression.statPointsGained,
        skillPoints: (character.skillPoints || 0) + progression.skillPointsGained,
        kills: character.kills + (input.victory ? 1 : 0),
        deaths: character.deaths + (input.victory ? 0 : 1),
      }).where(and(
        eq(charactersTable.id, input.characterId),
        eq(charactersTable.userId, input.userId),
      )).returning();
      if (!updatedBase) throw new Error("Không thể ghi kết quả chiến đấu");

      const updatedCharacter = await recalculateCharacterStats(input.characterId, tx);
      await tx.insert(battleLogsTable).values({
        characterId: input.characterId,
        monsterId: input.monsterId,
        monsterName: input.monsterName,
        victory: input.victory,
        expGained: effectiveExp,
        goldGained: input.goldGained,
      });

      return {
        character: updatedCharacter,
        newLevel: progression.newLevel,
        leveledUp: progression.leveledUp,
        expToNextLevel: progression.expToNextLevel,
        expGained: effectiveExp,
        partyBuffActive: inParty,
      };
    });
  }
}
