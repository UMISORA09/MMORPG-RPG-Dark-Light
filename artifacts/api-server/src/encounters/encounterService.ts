/**
 * EncounterService: Quản lý vòng đời Encounter (Start, Authoritative Engine, Finalize, Recovery)
 * Đảm bảo tính toàn vẹn Idempotency và bảo mật phần thưởng tối cao phía Server.
 */

import crypto from "node:crypto";
import {
  db,
  charactersTable,
  battleLogsTable,
  encountersTable,
  rewardGrantsTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { MONSTERS } from "../data/classes";
import {
  getAuthoritativeMonsterReward,
  calculateLevelProgression,
  getStatsForLevel,
} from "../rules/combatRules";
import { toCharacterResponse } from "../lib/inventory";
import { EncounterEngine } from "./encounterEngine";
import type {
  EncounterSnapshotPacket,
  EncounterTerminalResultPacket,
} from "./encounterTypes";

export class EncounterService {
  private static activeEngines = new Map<string, EncounterEngine>();

  /**
   * Khởi tạo Encounter mới với cơ chế Idempotency
   */
  public static async createEncounter(params: {
    userId: number;
    characterId: number;
    monsterId: string;
    spawnId: string;
    clientRequestId: string;
  }): Promise<{
    encounterId: string;
    protocolVersion: number;
    tickRate: number;
    serverTime: string;
    expiresAt: string;
    snapshot: EncounterSnapshotPacket;
    socketPath: string;
  }> {
    const { userId, characterId, monsterId, spawnId, clientRequestId } = params;

    // 1. Kiểm tra quyền sở hữu nhân vật
    const [character] = await db
      .select()
      .from(charactersTable)
      .where(eq(charactersTable.id, characterId))
      .limit(1);

    if (!character || character.userId !== userId) {
      const err: any = new Error("Không tìm thấy nhân vật hoặc không có quyền truy cập");
      err.statusCode = 404;
      throw err;
    }

    // 2. Tra cứu quái vật hợp lệ
    const monsterReward = getAuthoritativeMonsterReward(monsterId);
    const rawMonster = MONSTERS.find((m) => m.id === monsterId);
    if (!monsterReward || !rawMonster) {
      const err: any = new Error("Quái vật không tồn tại trong danh mục hệ thống");
      err.statusCode = 422;
      throw err;
    }

    // 3. Kiểm tra Idempotency: Nếu trùng clientRequestId, trả về encounter đã tạo
    const existingReq = await db
      .select()
      .from(encountersTable)
      .where(
        and(
          eq(encountersTable.characterId, characterId),
          eq(encountersTable.clientRequestId, clientRequestId)
        )
      )
      .limit(1);

    if (existingReq.length > 0) {
      const enc = existingReq[0];
      const engine = this.activeEngines.get(enc.id);
      return {
        encounterId: enc.id,
        protocolVersion: 1,
        tickRate: 20,
        serverTime: new Date().toISOString(),
        expiresAt: enc.expiresAt.toISOString(),
        snapshot: engine
          ? engine.getSnapshot()
          : (enc.finalStateJson as EncounterSnapshotPacket) ?? {
              type: "snapshot",
              encounterId: enc.id,
              serverTick: 0,
              ackInputSeq: 0,
              serverTime: new Date().toISOString(),
              state: {
                player: {
                  position: [0, 0, 0],
                  velocity: [0, 0, 0],
                  hp: character.hp,
                  maxHp: character.maxHp,
                  facing: 0,
                  cooldowns: {},
                  isAlive: true,
                },
                enemies: [],
              },
            },
        socketPath: "/api/realtime",
      };
    }

    // 4. Kiểm tra Character có đang kẹt trong một trận đánh active khác không
    const activeEncounter = await db
      .select()
      .from(encountersTable)
      .where(
        and(
          eq(encountersTable.characterId, characterId),
          eq(encountersTable.status, "active")
        )
      )
      .limit(1);

    if (activeEncounter.length > 0) {
      // Nếu đã hết hạn (expiresAt < now), tự động dọn dẹp chuyển sang 'expired'
      const activeEnc = activeEncounter[0];
      if (new Date() > new Date(activeEnc.expiresAt)) {
        await db
          .update(encountersTable)
          .set({ status: "expired", endedAt: new Date() })
          .where(eq(encountersTable.id, activeEnc.id));
        this.activeEngines.delete(activeEnc.id);
      } else {
        const err: any = new Error("Nhân vật đang trong một trận đấu khác chưa kết thúc");
        err.statusCode = 409;
        throw err;
      }
    }

    // 5. Khởi tạo Encounter và Engine mới
    const encounterId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Hết hạn sau 5 phút

    const engine = new EncounterEngine({
      encounterId,
      characterId,
      userId,
      playerStats: {
        hp: character.hp,
        maxHp: character.maxHp,
        atk: character.atk,
        def: character.def,
        spd: character.spd,
      },
      monster: {
        id: rawMonster.id,
        name: rawMonster.name,
        hp: rawMonster.hp,
        atk: rawMonster.atk,
        def: rawMonster.def,
      },
    });

    this.activeEngines.set(encounterId, engine);

    const snapshot = engine.getSnapshot();

    await db.insert(encountersTable).values({
      id: encounterId,
      characterId,
      userId,
      monsterId,
      spawnId,
      zoneId: "WILDERNESS",
      status: "active",
      rulesVersion: 1,
      contentVersion: 1,
      rngSeed: 1337,
      clientRequestId,
      expiresAt,
      finalStateJson: snapshot,
    });

    return {
      encounterId,
      protocolVersion: 1,
      tickRate: 20,
      serverTime: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      snapshot,
      socketPath: "/api/realtime",
    };
  }

  /**
   * Lấy động cơ mô phỏng đang hoạt động trong bộ nhớ
   */
  public static getActiveEngine(encounterId: string): EncounterEngine | undefined {
    return this.activeEngines.get(encounterId);
  }

  /**
   * Truy vấn thông tin Encounter và kết quả terminal đã commit
   */
  public static async getEncounter(
    characterId: number,
    encounterId: string
  ): Promise<any> {
    const [encounter] = await db
      .select()
      .from(encountersTable)
      .where(
        and(
          eq(encountersTable.id, encounterId),
          eq(encountersTable.characterId, characterId)
        )
      )
      .limit(1);

    if (!encounter) {
      const err: any = new Error("Không tìm thấy trận đấu");
      err.statusCode = 404;
      throw err;
    }

    const engine = this.activeEngines.get(encounterId);

    return {
      encounterId: encounter.id,
      status: encounter.status,
      expiresAt: encounter.expiresAt,
      snapshot: engine ? engine.getSnapshot() : encounter.finalStateJson,
      terminalResult: encounter.resultJson,
    };
  }

  /**
   * Hoàn tất Encounter và cam kết phần thưởng Idempotent vào Cơ sở dữ liệu
   */
  public static async finalizeEncounter(
    encounterId: string,
    outcome: "victory" | "defeat" | "aborted"
  ): Promise<EncounterTerminalResultPacket> {
    const [encounter] = await db
      .select()
      .from(encountersTable)
      .where(eq(encountersTable.id, encounterId))
      .limit(1);

    if (!encounter) {
      throw new Error("Không tìm thấy encounter");
    }

    // Nếu đã ở trạng thái terminal, trả về kết quả đã commit trước đó (Idempotency)
    if (encounter.status !== "active" && encounter.resultJson) {
      return encounter.resultJson as EncounterTerminalResultPacket;
    }

    const [character] = await db
      .select()
      .from(charactersTable)
      .where(eq(charactersTable.id, encounter.characterId))
      .limit(1);

    const monsterReward = getAuthoritativeMonsterReward(encounter.monsterId)!;
    const isVictory = outcome === "victory";

    let expGained = 0;
    let goldGained = 0;
    if (isVictory) {
      expGained = monsterReward.expReward;
      goldGained = monsterReward.goldReward;
    }

    const engine = this.activeEngines.get(encounterId);
    const finalTick = engine ? engine.serverTick : 0;
    const finalPlayerHp = isVictory
      ? engine
        ? engine.getPlayerHp()
        : character.hp
      : character.maxHp; // Khi chết, hồi sinh về làng đầy bình máu

    // Authoritative Level & Stats Progression
    const { newExp, newLevel, expToNextLevel } = calculateLevelProgression(
      character.experience,
      character.level,
      expGained
    );
    const newStats = getStatsForLevel(character.classId, newLevel);

    // 1. Cập nhật nhân vật
    const [updatedChar] = await db
      .update(charactersTable)
      .set({
        level: newLevel,
        experience: newExp,
        maxHp: newStats.hp,
        hp: Math.max(1, finalPlayerHp),
        atk: newStats.atk,
        def: newStats.def,
        spd: newStats.spd,
        gold: character.gold + goldGained,
        kills: character.kills + (isVictory ? 1 : 0),
        deaths: character.deaths + (isVictory ? 0 : 1),
      })
      .where(eq(charactersTable.id, character.id))
      .returning();

    // 2. Ghi nhận Battle Log liên kết với encounterId
    const [battleLog] = await db
      .insert(battleLogsTable)
      .values({
        characterId: character.id,
        encounterId,
        monsterId: encounter.monsterId,
        monsterName: monsterReward.monsterName,
        victory: isVictory,
        expGained,
        goldGained,
      })
      .returning();

    // 3. Nếu chiến thắng, ghi nhận Reward Grant độc bản
    if (isVictory) {
      await db.insert(rewardGrantsTable).values({
        encounterId,
        characterId: character.id,
        expGranted: expGained,
        goldGranted: goldGained,
        itemsGranted: [],
      });
    }

    // 4. Tạo gói tin kết quả Terminal
    const terminalResult: EncounterTerminalResultPacket = {
      type: "encounter.result",
      encounterId,
      status: outcome,
      resultVersion: 1,
      serverTick: finalTick,
      reward: {
        exp: expGained,
        gold: goldGained,
        items: [],
      },
      character: {
        level: updatedChar.level,
        experience: updatedChar.experience,
        gold: updatedChar.gold,
        hp: updatedChar.hp,
        maxHp: updatedChar.maxHp,
        kills: updatedChar.kills,
      },
      logId: battleLog?.id ?? null,
    };

    // 5. Cập nhật encounter sang trạng thái hoàn tất
    await db
      .update(encountersTable)
      .set({
        status: outcome,
        endedAt: new Date(),
        finalServerTick: finalTick,
        resultJson: terminalResult,
        logId: battleLog?.id ?? null,
      })
      .where(eq(encountersTable.id, encounterId));

    // Dọn dẹp engine khỏi RAM
    this.activeEngines.delete(encounterId);

    return terminalResult;
  }
}
