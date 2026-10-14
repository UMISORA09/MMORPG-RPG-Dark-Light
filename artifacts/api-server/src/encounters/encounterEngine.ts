/**
 * EncounterEngine: Mô phỏng chiến đấu thời gian thực phía Server (Authoritative Simulation)
 * Chạy trên fixed tick 20 Hz (50ms).
 * Xác thực input intent, di chuyển, cự ly hitbox, AI quái và sát thương.
 */

import { calculateDamage } from "../rules/combatRules";
import type {
  PlayerInputPacket,
  PlayerCombatState,
  EnemyCombatState,
  EncounterSnapshotPacket,
  EncounterEventPacket,
} from "./encounterTypes";

export interface EncounterEngineInitOptions {
  encounterId: string;
  characterId: number;
  userId: number;
  playerStats: {
    hp: number;
    maxHp: number;
    atk: number;
    def: number;
    spd: number;
  };
  monster: {
    id: string;
    name: string;
    hp: number;
    atk: number;
    def: number;
  };
  spawnPos?: [number, number, number];
}

export class EncounterEngine {
  public encounterId: string;
  public characterId: number;
  public userId: number;
  public serverTick: number = 0;
  public lastAckSeq: number = 0;
  public isCompleted: boolean = false;
  public outcome: "victory" | "defeat" | "aborted" | null = null;

  // Player State
  private playerPos: [number, number, number] = [0, 0, 0];
  private playerVel: [number, number, number] = [0, 0, 0];
  private playerHp: number;
  private playerMaxHp: number;
  private playerAtk: number;
  private playerDef: number;
  private playerSpd: number;
  private playerFacing: number = 0;
  private playerAlive: boolean = true;
  private lastAttackPressed: boolean = false;
  private attackCooldownTicks: number = 0;
  private skillCooldowns: Record<string, number> = {
    skill1: 0,
    skill2: 0,
    skill3: 0,
  };

  // Enemy State
  private enemyId: string;
  private enemyMonsterId: string;
  private enemyName: string;
  private enemyPos: [number, number, number];
  private enemyHp: number;
  private enemyMaxHp: number;
  private enemyAtk: number;
  private enemyDef: number;
  private enemyState: "patrol" | "chase" | "windup" | "attack" | "cooldown" | "hurt" | "dead" = "chase";
  private enemyAlive: boolean = true;
  private enemyAttackCooldownTicks: number = 20; // 1s initial windup

  // Pending inputs and event queue
  private inputQueue: PlayerInputPacket[] = [];
  private pendingEvents: EncounterEventPacket[] = [];

  // Arena bounds
  private readonly ARENA_RADIUS = 25.0;

  constructor(options: EncounterEngineInitOptions) {
    this.encounterId = options.encounterId;
    this.characterId = options.characterId;
    this.userId = options.userId;

    this.playerHp = options.playerStats.hp;
    this.playerMaxHp = options.playerStats.maxHp;
    this.playerAtk = options.playerStats.atk;
    this.playerDef = options.playerStats.def;
    this.playerSpd = options.playerStats.spd;

    this.enemyId = `enemy-${options.monster.id}-1`;
    this.enemyMonsterId = options.monster.id;
    this.enemyName = options.monster.name;
    this.enemyHp = options.monster.hp;
    this.enemyMaxHp = options.monster.hp;
    this.enemyAtk = options.monster.atk;
    this.enemyDef = options.monster.def;
    this.enemyPos = options.spawnPos ?? [4.5, 0, 0];
  }

  /**
   * Đẩy gói tin input intent từ client vào hàng đợi xử lý
   */
  public enqueueInput(packet: PlayerInputPacket) {
    if (this.isCompleted) return;
    // Bỏ qua gói tin seq không tăng (chống duplicate/replay)
    if (packet.seq <= this.lastAckSeq && this.inputQueue.length > 0) {
      return;
    }
    this.inputQueue.push(packet);
    if (this.inputQueue.length > 10) {
      this.inputQueue.shift(); // Throttle queue size
    }
  }

  /**
   * Một bước mô phỏng cố định 50ms (20 Hz Tick)
   */
  public tick(): {
    snapshot: EncounterSnapshotPacket;
    events: EncounterEventPacket[];
    isTerminal: boolean;
    outcome: "victory" | "defeat" | "aborted" | null;
  } {
    if (this.isCompleted) {
      return {
        snapshot: this.getSnapshot(),
        events: [],
        isTerminal: true,
        outcome: this.outcome,
      };
    }

    this.serverTick++;
    const dt = 0.05; // 50ms fixed timestep

    // Cập nhật cooldowns
    if (this.attackCooldownTicks > 0) this.attackCooldownTicks--;
    if (this.enemyAttackCooldownTicks > 0) this.enemyAttackCooldownTicks--;
    for (const key of Object.keys(this.skillCooldowns)) {
      if (this.skillCooldowns[key] > 0) {
        this.skillCooldowns[key] = Math.max(0, +(this.skillCooldowns[key] - dt).toFixed(2));
      }
    }

    // ── 1. Xử lý Input Intents của người chơi ──
    let moveX = 0;
    let moveZ = 0;
    let attackIntent = false;

    if (this.inputQueue.length > 0) {
      // Lấy input mới nhất
      const latestInput = this.inputQueue[this.inputQueue.length - 1];
      this.lastAckSeq = latestInput.seq;

      const btn = latestInput.buttons;
      if (btn.forward) moveZ -= 1;
      if (btn.back) moveZ += 1;
      if (btn.left) moveX -= 1;
      if (btn.right) moveX += 1;

      // Attack trigger: chém khi nút attack được giữ hoặc nhấn và đã hồi chiêu
      if (btn.attack && this.attackCooldownTicks <= 0) {
        attackIntent = true;
      }
      this.lastAttackPressed = !!btn.attack;

      if (latestInput.aim?.yaw !== undefined) {
        this.playerFacing = latestInput.aim.yaw;
      }

      this.inputQueue = [];
    }

    // ── 2. Mô phỏng di chuyển người chơi (Normalized Diagonal) ──
    if (this.playerAlive && (moveX !== 0 || moveZ !== 0)) {
      const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
      const normX = moveX / len;
      const normZ = moveZ / len;

      const speedMps = (this.playerSpd / 70) * 4.8; // ~4.8 m/s
      const deltaX = normX * speedMps * dt;
      const deltaZ = normZ * speedMps * dt;

      this.playerPos[0] += deltaX;
      this.playerPos[2] += deltaZ;

      // Giới hạn trong sàn đấu tròn (Clamp inside Arena)
      const distFromCenter = Math.sqrt(
        this.playerPos[0] * this.playerPos[0] + this.playerPos[2] * this.playerPos[2]
      );
      if (distFromCenter > this.ARENA_RADIUS) {
        const factor = this.ARENA_RADIUS / distFromCenter;
        this.playerPos[0] *= factor;
        this.playerPos[2] *= factor;
      }

      this.playerVel = [deltaX / dt, 0, deltaZ / dt];
    } else {
      this.playerVel = [0, 0, 0];
    }

    // ── 3. Sát thương Người Chơi -> Quái Vật ──
    if (this.playerAlive && this.enemyAlive && attackIntent && this.attackCooldownTicks <= 0) {
      this.attackCooldownTicks = 6; // 0.3s cooldown giữa các đòn đánh thường

      this.pendingEvents.push({
        type: "event",
        eventId: `evt-${this.serverTick}-atk-start`,
        serverTick: this.serverTick,
        name: "attack.started",
        data: { attackerId: "player" },
      });

      const distToEnemy = this.getDistance(this.playerPos, this.enemyPos);
      const ATTACK_RANGE = 2.6; // mét

      if (distToEnemy <= ATTACK_RANGE) {
        const hit = calculateDamage(this.playerAtk, this.enemyDef, { multiplier: 1.0 });
        this.enemyHp = Math.max(0, this.enemyHp - hit.damage);
        this.enemyState = "hurt";

        this.pendingEvents.push({
          type: "event",
          eventId: `evt-${this.serverTick}-hit-${this.enemyId}`,
          serverTick: this.serverTick,
          name: "attack.hit",
          data: {
            attackerId: "player",
            targetId: this.enemyId,
            damage: hit.damage,
            critical: hit.isCritical,
            remainingHp: this.enemyHp,
          },
        });

        // Kiểm tra quái chết
        if (this.enemyHp <= 0) {
          this.enemyAlive = false;
          this.enemyState = "dead";
          this.isCompleted = true;
          this.outcome = "victory";

          this.pendingEvents.push({
            type: "event",
            eventId: `evt-${this.serverTick}-mob-defeat`,
            serverTick: this.serverTick,
            name: "enemy.defeated",
            data: { enemyId: this.enemyId, monsterId: this.enemyMonsterId },
          });
        }
      }
    }

    // ── 4. Mô phỏng AI Quái Vật (20 Hz) ──
    if (this.enemyAlive && this.playerAlive) {
      const distToPlayer = this.getDistance(this.enemyPos, this.playerPos);
      const ENEMY_ATTACK_RANGE = 1.6; // mét

      if (distToPlayer > ENEMY_ATTACK_RANGE) {
        // Đuổi theo người chơi
        const dirX = (this.playerPos[0] - this.enemyPos[0]) / distToPlayer;
        const dirZ = (this.playerPos[2] - this.enemyPos[2]) / distToPlayer;
        const enemySpeed = 2.2; // 2.2 m/s

        this.enemyPos[0] += dirX * enemySpeed * dt;
        this.enemyPos[2] += dirZ * enemySpeed * dt;
        this.enemyState = "chase";
      } else {
        // Trong tầm tấn công
        if (this.enemyAttackCooldownTicks <= 0) {
          this.enemyAttackCooldownTicks = 30; // 1.5s hồi chiêu đòn đánh quái
          this.enemyState = "attack";

          const enemyHit = calculateDamage(this.enemyAtk, this.playerDef);
          this.playerHp = Math.max(0, this.playerHp - enemyHit.damage);

          this.pendingEvents.push({
            type: "event",
            eventId: `evt-${this.serverTick}-mob-hit`,
            serverTick: this.serverTick,
            name: "enemy.hit",
            data: {
              attackerId: this.enemyId,
              targetId: "player",
              damage: enemyHit.damage,
              remainingHp: this.playerHp,
            },
          });

          // Người chơi tử trận
          if (this.playerHp <= 0) {
            this.playerAlive = false;
            this.isCompleted = true;
            this.outcome = "defeat";

            this.pendingEvents.push({
              type: "event",
              eventId: `evt-${this.serverTick}-player-defeat`,
              serverTick: this.serverTick,
              name: "player.defeated",
              data: { characterId: this.characterId },
            });
          }
        } else {
          this.enemyState = "cooldown";
        }
      }
    }

    const eventsToEmit = [...this.pendingEvents];
    this.pendingEvents = [];

    return {
      snapshot: this.getSnapshot(),
      events: eventsToEmit,
      isTerminal: this.isCompleted,
      outcome: this.outcome,
    };
  }

  /**
   * Tạo bản sao trạng thái Authoritative cho Client
   */
  public getSnapshot(): EncounterSnapshotPacket {
    return {
      type: "snapshot",
      encounterId: this.encounterId,
      serverTick: this.serverTick,
      ackInputSeq: this.lastAckSeq,
      serverTime: new Date().toISOString(),
      state: {
        player: {
          position: [this.playerPos[0], this.playerPos[1], this.playerPos[2]],
          velocity: [this.playerVel[0], this.playerVel[1], this.playerVel[2]],
          hp: this.playerHp,
          maxHp: this.playerMaxHp,
          facing: this.playerFacing,
          cooldowns: { ...this.skillCooldowns },
          isAlive: this.playerAlive,
        },
        enemies: [
          {
            id: this.enemyId,
            monsterId: this.enemyMonsterId,
            name: this.enemyName,
            hp: this.enemyHp,
            maxHp: this.enemyMaxHp,
            position: [this.enemyPos[0], this.enemyPos[1], this.enemyPos[2]],
            state: this.enemyState,
            isAlive: this.enemyAlive,
          },
        ],
      },
    };
  }

  public getPlayerHp(): number {
    return this.playerHp;
  }

  private getDistance(a: [number, number, number], b: [number, number, number]): number {
    const dx = a[0] - b[0];
    const dz = a[2] - b[2];
    return Math.sqrt(dx * dx + dz * dz);
  }
}
