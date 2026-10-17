// ==============================================================================
// 2.5D Tactical Monster & Boss Raid Manager
// State Machine AI, 4-Shape Ground Telegraph Zones, Stagger System & 2-Phase Boss
// ==============================================================================

import { memo, useRef, useState, useEffect, useCallback } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { SpriteBillboard25D } from "../sprites/SpriteBillboard25D";
import { TelegraphZoneItem, isPlayerInsideTelegraphZone } from "../vfx/TelegraphZoneShader";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { playCombatSFX } from "@/audio/CombatSoundSynth";
import {
  getMonsterBlueprint,
  type MonsterBlueprint,
  type MonsterAttackPattern,
  type ActiveTelegraphZone,
  type AIState,
} from "@/skills";
import type { DroppedItem } from "../loot/loot.types";
import { rollMonsterLootDrops } from "../loot/lootRollService";
import { resolveWorldCollisions } from "../world/worldColliders";

interface MonsterInstance {
  id: number;
  monsterId: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  atk: number;
  color: string;
  weaponType: "claws" | "sword" | "dragon";
  isBoss: boolean;
  archetype: "SWARM_PACK" | "LONE_PREDATOR" | "WORLD_BOSS";
  packId?: string;
  packIndex?: number;
  packSize?: number;
  scale: number;
  spawnPos: THREE.Vector3;
  currentPos: THREE.Vector3;
  state: "idle" | "run" | "attack" | "hurt";
  aiState: AIState;
  facingLeft: boolean;
  direction: number; // Yaw in radians
  isAlive: boolean;
  respawnTimer: number;
  attackCooldown: number;
  patrolTimer: number;
  patrolDir: number;

  // Stagger & Boss Mechanics
  blueprint: MonsterBlueprint;
  staggerGauge: number;
  staggerMax: number;
  staggerTimer: number;
  phase: 1 | 2;
  currentPattern: MonsterAttackPattern | null;
  currentTelegraphId: number | null;

  // Reaction & Lone Predator Special States
  hitFlashTimer?: number;
  hasBarrier?: boolean;
  barrierHp?: number;
  isEnraged?: boolean;
  blinkCooldown?: number;
  territoryHealAcc?: number;
}

const INITIAL_MONSTERS_DATA = [
  // ── 1. KHU VỰC 2: RỪNG NGUYÊN SINH (TÂY BẮC) — SWARM PACK: Slimes (Lv.1 - Lv.2) ──
  {
    id: 1,
    monsterId: "slime",
    name: "Slime Đầm Lầy",
    level: 2,
    hp: 130,
    maxHp: 130,
    atk: 16,
    color: "#e6192e",
    weaponType: "claws" as const,
    isBoss: false,
    archetype: "SWARM_PACK" as const,
    packId: "pack_slime",
    packIndex: 0,
    packSize: 3,
    scale: 1.05,
    spawnPos: new THREE.Vector3(-26, 0, -22),
  },
  {
    id: 2,
    monsterId: "slime",
    name: "Slime Đỏ Rừng Sâu",
    level: 1,
    hp: 85,
    maxHp: 85,
    atk: 12,
    color: "#e6192e",
    weaponType: "claws" as const,
    isBoss: false,
    archetype: "SWARM_PACK" as const,
    packId: "pack_slime",
    packIndex: 1,
    packSize: 3,
    scale: 0.95,
    spawnPos: new THREE.Vector3(-28.5, 0, -20.5),
  },
  {
    id: 3,
    monsterId: "slime",
    name: "Slime Đỏ Bãi Cỏ",
    level: 1,
    hp: 85,
    maxHp: 85,
    atk: 12,
    color: "#e6192e",
    weaponType: "claws" as const,
    isBoss: false,
    archetype: "SWARM_PACK" as const,
    packId: "pack_slime",
    packIndex: 2,
    packSize: 3,
    scale: 0.95,
    spawnPos: new THREE.Vector3(-24.5, 0, -24.0),
  },

  // ── 2. KHU VỰC 2: RỪNG NGUYÊN SINH (TÂY NAM) — SWARM PACK: Wolves (Lv.5) ──
  {
    id: 4,
    monsterId: "wolf",
    name: "Sói Đầu Đàn Hoang Dã",
    level: 5,
    hp: 480,
    maxHp: 480,
    atk: 42,
    color: "#94a3b8",
    weaponType: "claws" as const,
    isBoss: false,
    archetype: "SWARM_PACK" as const,
    packId: "pack_wolf",
    packIndex: 0,
    packSize: 3,
    scale: 1.15,
    spawnPos: new THREE.Vector3(-27, 0, 16),
  },
  {
    id: 5,
    monsterId: "wolf",
    name: "Sói Hoang Hung Hãn",
    level: 5,
    hp: 480,
    maxHp: 480,
    atk: 42,
    color: "#94a3b8",
    weaponType: "claws" as const,
    isBoss: false,
    archetype: "SWARM_PACK" as const,
    packId: "pack_wolf",
    packIndex: 1,
    packSize: 3,
    scale: 1.0,
    spawnPos: new THREE.Vector3(-29.5, 0, 18.5),
  },
  {
    id: 6,
    monsterId: "wolf",
    name: "Sói Hoang Nanh Băng",
    level: 5,
    hp: 480,
    maxHp: 480,
    atk: 42,
    color: "#94a3b8",
    weaponType: "claws" as const,
    isBoss: false,
    archetype: "SWARM_PACK" as const,
    packId: "pack_wolf",
    packIndex: 2,
    packSize: 3,
    scale: 1.0,
    spawnPos: new THREE.Vector3(-25.2, 0, 14.2),
  },

  // ── 3. KHU VỰC 3: VÙNG ĐẤT CHẾT & ĐẦM LẦY (ĐÔNG NAM) — SWARM PACK: Goblins (Lv.5 - Lv.6) ──
  {
    id: 7,
    monsterId: "goblin",
    name: "Yêu Tinh Đao Phủ Trưởng",
    level: 6,
    hp: 550,
    maxHp: 550,
    atk: 46,
    color: "#84cc16",
    weaponType: "sword" as const,
    isBoss: false,
    archetype: "SWARM_PACK" as const,
    packId: "pack_goblin",
    packIndex: 0,
    packSize: 3,
    scale: 1.12,
    spawnPos: new THREE.Vector3(28, 0, 16),
  },
  {
    id: 8,
    monsterId: "goblin",
    name: "Yêu Tinh Dao Găm",
    level: 5,
    hp: 480,
    maxHp: 480,
    atk: 42,
    color: "#84cc16",
    weaponType: "sword" as const,
    isBoss: false,
    archetype: "SWARM_PACK" as const,
    packId: "pack_goblin",
    packIndex: 1,
    packSize: 3,
    scale: 1.0,
    spawnPos: new THREE.Vector3(30.5, 0, 18.0),
  },
  {
    id: 9,
    monsterId: "goblin",
    name: "Yêu Tinh Tiễu Phỉ",
    level: 5,
    hp: 480,
    maxHp: 480,
    atk: 42,
    color: "#84cc16",
    weaponType: "sword" as const,
    isBoss: false,
    archetype: "SWARM_PACK" as const,
    packId: "pack_goblin",
    packIndex: 2,
    packSize: 3,
    scale: 1.0,
    spawnPos: new THREE.Vector3(26.2, 0, 14.5),
  },

  // ── 4. KHU VỰC 3: VÙNG ĐẤT CHẾT & ĐẦM LẦY (ĐÔNG TÂM) — LONE PREDATOR: Orc Warrior (Lv.8) ──
  {
    id: 10,
    monsterId: "orc",
    name: "Chiến Binh Orc Cổ (Tinh Anh)",
    level: 8,
    hp: 850,
    maxHp: 850,
    atk: 68,
    color: "#dc2626",
    weaponType: "sword" as const,
    isBoss: false,
    archetype: "LONE_PREDATOR" as const,
    scale: 1.35,
    spawnPos: new THREE.Vector3(32, 0, -8),
  },

  // ── 5. KHU VỰC 3: VÙNG ĐẤT CHẾT & ĐẦM LẦY (ĐÔNG BẮC) — LONE PREDATOR: Skeleton Knight (Lv.12) ──
  {
    id: 11,
    monsterId: "skeleton",
    name: "Kỵ Sĩ Xương Cổ Đại (Tinh Anh)",
    level: 12,
    hp: 1200,
    maxHp: 1200,
    atk: 95,
    color: "#cbd5e1",
    weaponType: "sword" as const,
    isBoss: false,
    archetype: "LONE_PREDATOR" as const,
    scale: 1.35,
    spawnPos: new THREE.Vector3(35, 0, 6),
  },

  // ── 6. KHU VỰC 4: CẤM ĐỊA SÀO HUYỆT (BẮC SÂU) — WORLD BOSS: Ancient Fire Dragon (Lv.20) ──
  {
    id: 20,
    monsterId: "dragon",
    name: "Rồng Lửa Cổ Đại (Boss Cấp 20)",
    level: 20,
    hp: 4500,
    maxHp: 4500,
    atk: 130,
    color: "#ef4444",
    weaponType: "dragon" as const,
    isBoss: true,
    archetype: "WORLD_BOSS" as const,
    scale: 2.2,
    spawnPos: new THREE.Vector3(0, 0, -70),
  },
];

let nextTelegraphId = 8000;

// Scratch vectors for zero GC allocation in frame loop
const _scratchVel = new THREE.Vector3();
const _scratchHitDir = new THREE.Vector3();

export const MonsterManager25D = memo(function MonsterManager25D() {
  const playerPosition = useGameWorldStore((s) => s.playerPosition);
  const currentZone = useGameWorldStore((s) => s.currentZone);
  const isInvincible = useGameWorldStore((s) => s.isInvincible);
  const damagePlayer = useGameWorldStore((s) => s.damagePlayer);
  const addFloatingText = useGameWorldStore((s) => s.addFloatingText);
  const setBossRaidState = useGameWorldStore((s) => s.setBossRaidState);
  const onDefeatMonsterCallback = useGameWorldStore((s) => s.onDefeatMonsterCallback);
  const spawnVFX = useGameWorldStore((s) => s.spawnVFX);
  const spawnLoot = useGameWorldStore((s) => s.spawnLoot);
  const applyPlayerDebuff = useGameWorldStore((s) => s.applyPlayerDebuff);
  const playerLevel = useGameWorldStore((s) => s.playerLevel);
  const weather = useGameWorldStore((s) => s.weather);
  const isDead = useGameWorldStore((s) => s.isDead);
  const respawnTriggerCount = useGameWorldStore((s) => s.respawnTriggerCount);

  const bullets = useGameWorldStore((s) => s.bullets);
  const slashEffects = useGameWorldStore((s) => s.slashEffects);
  const floatingTexts = useGameWorldStore((s) => s.floatingTexts);

  // Velocity tracking for Predictive Targeting
  const prevPlayerPos = useRef(playerPosition.clone());
  const playerVelRef = useRef(new THREE.Vector3());

  // Initialize monster instances with blueprints and stagger gauge
  const monstersRef = useRef<MonsterInstance[]>(
    INITIAL_MONSTERS_DATA.map((m) => {
      const bp = getMonsterBlueprint(m.monsterId, m.level);
      return {
        ...m,
        blueprint: bp,
        currentPos: m.spawnPos.clone(),
        state: "idle",
        aiState: "PATROL",
        facingLeft: false,
        direction: 0,
        isAlive: true,
        respawnTimer: 0,
        attackCooldown: 1.5,
        patrolTimer: 2.0,
        patrolDir: 0,
        staggerGauge: 0,
        staggerMax: bp.staggerThreshold,
        staggerTimer: 0,
        phase: 1,
        currentPattern: null,
        currentTelegraphId: null,
        hitFlashTimer: 0,
        hasBarrier: false,
        barrierHp: 0,
        isEnraged: false,
        blinkCooldown: 0,
      };
    })
  );

  // Active ground telegraph zones
  const [activeTelegraphs, setActiveTelegraphs] = useState<ActiveTelegraphZone[]>([]);
  const activeTelegraphsRef = useRef<ActiveTelegraphZone[]>([]);
  activeTelegraphsRef.current = activeTelegraphs;

  const [, setRenderTrigger] = useState(0);
  const markerSyncTimer = useRef(0);

  // Sync initial Boss state
  useEffect(() => {
    const boss = monstersRef.current.find((m) => m.isBoss);
    if (boss) {
      setBossRaidState({
        health: boss.hp,
        maxHealth: boss.maxHp,
        phase: boss.phase,
        stagger: 0,
        isStaggered: false,
        castingSpell: null,
      });
    }
  }, [setBossRaidState]);

  // Reset Aggro toàn bộ quái vật khi người chơi tử trận hoặc hồi sinh về Làng
  useEffect(() => {
    if (isDead || respawnTriggerCount > 0) {
      monstersRef.current.forEach((m) => {
        if (m.aiState === "AGGRO_CHASE" || m.aiState === "TELEGRAPH_WINDUP") {
          m.aiState = "RETURNING_HOME";
          m.currentPattern = null;
          m.currentTelegraphId = null;
        }
      });
      setActiveTelegraphs([]);
    }
  }, [isDead, respawnTriggerCount]);

  // ── Handle Ground Telegraph Detonation & Damage Calculation ────────────────
  const handleTelegraphDetonate = useCallback(
    (zone: ActiveTelegraphZone) => {
      const pattern = zone.pattern;
      const playerPos = playerPosition;
      const isPlayerSafeInVillage = currentZone === "SAFE_VILLAGE";

      // Trigger SFX & 3D Shader VFX
      playCombatSFX(pattern.sfxPreset, 0.45);

      spawnVFX(
        {
          type: pattern.vfxPreset as any,
          primaryColor: "#ef4444",
          secondaryColor: "#fbbf24",
          scale: pattern.radiusOrWidth * 0.9,
          duration: 0.8,
        },
        new THREE.Vector3(...zone.position),
        zone.direction
      );

      // Check if player is caught in detonation
      const isHit = isPlayerInsideTelegraphZone(
        { x: playerPos.x, z: playerPos.z },
        zone
      );

      if (isHit && !isPlayerSafeInVillage) {
        if (!isInvincible) {
          const monster = monstersRef.current.find((m) => m.id === zone.monsterInstanceId);
          const baseAtk = monster ? monster.atk : 40;
          const enrageBonus = monster?.isBoss && monster.phase === 2 ? 1.25 : 1.0;
          const levelDiff = (monster?.level || 1) - playerLevel;
          const isSuppressed = levelDiff >= 3;
          const suppressionMult = isSuppressed ? 2.5 : 1.0;
          const weatherMult = weather === "BLOOD_MOON" ? 1.2 : 1.0;
          const finalDamage = Math.round(baseAtk * pattern.damageMultiplier * enrageBonus * suppressionMult * weatherMult);

          // Calculate knockback direction (enhanced if boss in territory)
          const [zx, , zz] = zone.position;
          const knockbackDir = new THREE.Vector3(playerPos.x - zx, 0, playerPos.z - zz).normalize();
          if (knockbackDir.length() < 0.1) knockbackDir.set(1, 0, 0);

          if (isSuppressed) {
            addFloatingText("💥 ÁP CHẾ BẠO KÍCH (2.5X)!", playerPos.clone().add(new THREE.Vector3(0, 3.0, 0)), "#ef4444");
          }

          damagePlayer(finalDamage, knockbackDir);

          // Apply Debuff (Slow, Bleed, Stun, Poison)
          if (pattern.debuff) {
            applyPlayerDebuff({
              type: pattern.debuff.type,
              name: pattern.debuff.name || "Bất Lợi",
              icon: pattern.debuff.icon || "⚠️",
              duration: pattern.debuff.durationSeconds,
              magnitude: pattern.debuff.magnitude,
              tickInterval: pattern.debuff.tickInterval,
              tickDamage: pattern.debuff.tickDamage,
            });
          }

          addFloatingText(
            `-${finalDamage} TRÚNG CHIÊU!`,
            playerPos.clone().add(new THREE.Vector3(0, 2.4, 0)),
            "#ef4444"
          );
        }
      } else {
        // Player successfully dodged ground decal!
        const [zx, , zz] = zone.position;
        const distFromCenter = Math.sqrt(
          (playerPos.x - zx) * (playerPos.x - zx) + (playerPos.z - zz) * (playerPos.z - zz)
        );
        if (distFromCenter <= pattern.radiusOrWidth + 3.0 && !isPlayerSafeInVillage) {
          addFloatingText(
            `NÉ ĐÒN! (DODGED)`,
            playerPos.clone().add(new THREE.Vector3(0, 2.5, 0)),
            "#00f2ff"
          );
        }
      }

      // Cleanup finished telegraph
      setActiveTelegraphs((prev) => prev.filter((t) => t.id !== zone.id));

      // Reset monster to recovery state
      const caster = monstersRef.current.find((m) => m.id === zone.monsterInstanceId);
      if (caster) {
        caster.currentPattern = null;
        caster.currentTelegraphId = null;
        caster.attackCooldown = caster.blueprint.attackCooldown;
        caster.aiState = "COOLDOWN_RECOVERY";
        caster.state = "idle";
        if (caster.isBoss) {
          setBossRaidState({ castingSpell: null, castingTimer: 0 });
        }
      }
    },
    [playerPosition, currentZone, isInvincible, damagePlayer, addFloatingText, spawnVFX, setBossRaidState]
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const monsters = monstersRef.current;
    const playerPos = playerPosition;
    const isPlayerInSafeZone = currentZone === "SAFE_VILLAGE";

    // Track instant player velocity for Predictive Targeting (Zero-allocation scratch vector)
    _scratchVel.copy(playerPos).sub(prevPlayerPos.current).divideScalar(dt > 0.001 ? dt : 0.016);
    playerVelRef.current.copy(_scratchVel);
    prevPlayerPos.current.copy(playerPos);

    let stateChanged = false;

    // Helper: Social Aggro (Pack Call within 10m or same packId)
    const callSocialAggro = (triggerMob: MonsterInstance) => {
      for (const other of monsters) {
        if (!other.isAlive) continue;
        if (other.id === triggerMob.id) {
          if (other.aiState === "PATROL") other.aiState = "AGGRO_CHASE";
          continue;
        }
        if (other.packId && other.packId === triggerMob.packId) {
          if (other.aiState === "PATROL") {
            other.aiState = "AGGRO_CHASE";
            addFloatingText("🐺 Hú Gọi Bầy!", other.currentPos.clone().add(new THREE.Vector3(0, 2.2, 0)), "#f59e0b");
          }
        } else if (other.currentPos.distanceTo(triggerMob.currentPos) <= 10.0) {
          if (other.aiState === "PATROL") {
            other.aiState = "AGGRO_CHASE";
          }
        }
      }
    };

    // ── 1. Bullets update and hit detection ──────────────────────────────────
    let bulletsCleaned = false;
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (b.lifetime <= 0) {
        bulletsCleaned = true;
        continue;
      }
      b.position.addScaledVector(b.velocity, dt);
      b.lifetime -= dt;

      for (const m of monsters) {
        if (!m.isAlive) continue;
        const dist = b.position.distanceTo(m.currentPos);
        const hitRadius = m.isBoss ? 2.5 : (m.scale || 1.0) * 1.4;

        if (dist <= hitRadius) {
          // Check Level Suppression: High Level Monsters have +25% evasion against lower level players
          const isSuppressedMob = m.level > playerLevel + 2;
          if (isSuppressedMob && Math.random() < 0.25) {
            addFloatingText("💨 NÉ TRÁNH CẤP CAO!", m.currentPos.clone().add(new THREE.Vector3(0, 2.5, 0)), "#00f2ff");
            b.lifetime = -1;
            bulletsCleaned = true;
            break;
          }

          // Stagger vulnerability: 1.5x damage if monster is staggered!
          const dmgMultiplier = m.aiState === "STAGGERED" ? 1.5 : 1.0;
          let actualDamage = Math.round(b.damage * dmgMultiplier);

          // Level Suppression: -22% damage per level diff (up to 85% max reduction)
          const levelDiff = m.level - playerLevel;
          if (levelDiff >= 2) {
            const reductionPercent = Math.min(0.85, levelDiff * 0.22);
            actualDamage = Math.max(1, Math.round(actualDamage * (1 - reductionPercent)));
          }

          // Boss Territory Buff: -25% damage taken when in Boss Altar / Dungeon unless staggered
          if (m.isBoss && (currentZone === "BOSS_ALTAR" || currentZone === "DUNGEON") && m.aiState !== "STAGGERED") {
            actualDamage = Math.round(actualDamage * 0.75);
          }

          // Weather Effect: +25% player damage in Rain
          if (weather === "RAIN") {
            actualDamage = Math.round(actualDamage * 1.25);
          }

          // Lone Predator Barrier Absorption
          if (m.hasBarrier && m.barrierHp && m.barrierHp > 0) {
            const absorbed = Math.min(m.barrierHp, actualDamage);
            m.barrierHp -= absorbed;
            actualDamage -= absorbed;
            addFloatingText(`🛡️ HẤP THỤ ${absorbed}`, m.currentPos.clone().add(new THREE.Vector3(0, 2.5, 0)), "#a855f7");
            if (m.barrierHp <= 0) {
              m.hasBarrier = false;
              addFloatingText(`💥 VỠ GIÁP!`, m.currentPos.clone().add(new THREE.Vector3(0, 2.8, 0)), "#ef4444");
            }
          }

          m.hp = Math.max(0, m.hp - actualDamage);
          m.state = "hurt";
          m.hitFlashTimer = 0.12;
          b.lifetime = -1; // Destroy bullet immediately
          bulletsCleaned = true;

          // Micro-stagger knockback away from bullet
          const hitDir = m.currentPos.clone().sub(b.position);
          hitDir.y = 0;
          if (hitDir.length() > 0.05) {
            hitDir.normalize();
            m.currentPos.addScaledVector(hitDir, m.isBoss ? 0.05 : 0.22);
          }

          // Social Aggro: Alert pack
          callSocialAggro(m);

          // Accumulate Stagger Gauge
          m.staggerGauge = Math.min(m.staggerMax, m.staggerGauge + actualDamage * 0.7);
          useGameWorldStore.getState().recordCombatHit(actualDamage, false);

          addFloatingText(
            `-${actualDamage}${m.aiState === "STAGGERED" ? " (1.5x)" : ""}`,
            m.currentPos.clone().add(new THREE.Vector3(0, 2.2, 0)),
            m.aiState === "STAGGERED" ? "#facc15" : "#38bdf8"
          );

          handleStaggerAndBossCheck(m);

          if (m.hp <= 0) {
            handleMonsterDefeat(m);
          }
          stateChanged = true;
          break;
        }
      }
    }

    if (bulletsCleaned) {
      const activeBullets = bullets.filter((b) => b.lifetime > 0);
      if (activeBullets.length !== bullets.length) {
        useGameWorldStore.setState({ bullets: activeBullets });
      }
    }

    // ── 2. Slash Effects hit detection (Live playerAtk + Level Suppression) ──
    for (const sl of slashEffects) {
      for (const m of monsters) {
        if (!m.isAlive) continue;
        const dist = sl.position.distanceTo(m.currentPos);
        if (dist <= sl.radius) {
          // Check Level Suppression: High Level Monsters have +25% evasion against lower level players
          const isSuppressedMob = m.level > playerLevel + 2;
          if (isSuppressedMob && Math.random() < 0.25) {
            addFloatingText("💨 NÉ TRÁNH CẤP CAO!", m.currentPos.clone().add(new THREE.Vector3(0, 2.5, 0)), "#00f2ff");
            continue;
          }

          const dmgMultiplier = m.aiState === "STAGGERED" ? 1.5 : 1.0;
          // Đọc trực tiếp từ chỉ số thực tế playerAtk & playerCritRate đã lưu trong store
          const livePlayerAtk = useGameWorldStore.getState().playerAtk || 10;
          const liveCritRate = useGameWorldStore.getState().playerCritRate || 5;
          const isCrit = Math.random() * 100 < liveCritRate;
          const baseSlashDmg = isCrit ? Math.floor(livePlayerAtk * 1.5) : livePlayerAtk;
          let actualDamage = Math.max(1, Math.round(baseSlashDmg * dmgMultiplier));

          // Level Suppression: -22% damage per level diff (up to 85% reduction) if m.level - playerLevel >= 2
          const levelDiff = m.level - playerLevel;
          if (levelDiff >= 2) {
            const reductionPercent = Math.min(0.85, levelDiff * 0.22);
            actualDamage = Math.max(1, Math.round(actualDamage * (1 - reductionPercent)));
          }

          // Boss Territory Buff: -25% damage taken when in Boss Altar / Dungeon unless staggered
          if (m.isBoss && (currentZone === "BOSS_ALTAR" || currentZone === "DUNGEON") && m.aiState !== "STAGGERED") {
            actualDamage = Math.round(actualDamage * 0.75);
          }

          // Weather Effect: +25% player damage in Rain
          if (weather === "RAIN") {
            actualDamage = Math.round(actualDamage * 1.25);
          }

          // Lone Predator Barrier Absorption
          if (m.hasBarrier && m.barrierHp && m.barrierHp > 0) {
            const absorbed = Math.min(m.barrierHp, actualDamage);
            m.barrierHp -= absorbed;
            actualDamage -= absorbed;
            addFloatingText(`🛡️ HẤP THỤ ${absorbed}`, m.currentPos.clone().add(new THREE.Vector3(0, 2.5, 0)), "#a855f7");
            if (m.barrierHp <= 0) {
              m.hasBarrier = false;
              addFloatingText(`💥 VỠ GIÁP!`, m.currentPos.clone().add(new THREE.Vector3(0, 2.8, 0)), "#ef4444");
            }
          }

          m.hp = Math.max(0, m.hp - actualDamage);
          m.state = "hurt";
          m.hitFlashTimer = 0.12;

          // Micro-stagger knockback away from slash center
          const hitDir = m.currentPos.clone().sub(sl.position);
          hitDir.y = 0;
          if (hitDir.length() > 0.05) {
            hitDir.normalize();
            m.currentPos.addScaledVector(hitDir, m.isBoss ? 0.05 : 0.22);
          }

          // Social Aggro: Alert pack
          callSocialAggro(m);

          m.staggerGauge = Math.min(m.staggerMax, m.staggerGauge + actualDamage * 0.8);
          useGameWorldStore.getState().recordCombatHit(actualDamage, Math.random() < 0.2);

          addFloatingText(
            `-${actualDamage}${m.aiState === "STAGGERED" ? " (1.5x)" : ""}`,
            m.currentPos.clone().add(new THREE.Vector3(0, 2.2, 0)),
            m.aiState === "STAGGERED" ? "#facc15" : sl.color
          );

          handleStaggerAndBossCheck(m);

          if (m.hp <= 0) {
            handleMonsterDefeat(m);
          }
          stateChanged = true;
        }
      }
    }

    // ── 3. Monster State Machine AI Behaviors ────────────────────────────────
    for (const m of monsters) {
      if (m.attackCooldown > 0) m.attackCooldown -= dt;
      if (m.hitFlashTimer && m.hitFlashTimer > 0) m.hitFlashTimer -= dt;
      if (m.blinkCooldown && m.blinkCooldown > 0) m.blinkCooldown -= dt;

      // Respawn timer
      if (!m.isAlive) {
        m.respawnTimer -= dt;
        if (m.respawnTimer <= 0) {
          m.isAlive = true;
          m.hp = m.maxHp;
          m.currentPos.copy(m.spawnPos);
          m.state = "idle";
          m.aiState = "PATROL";
          m.phase = 1;
          m.staggerGauge = 0;
          m.hasBarrier = false;
          m.barrierHp = 0;
          m.isEnraged = false;
          if (m.isBoss) {
            setBossRaidState({
              health: m.maxHp,
              maxHealth: m.maxHp,
              phase: 1,
              stagger: 0,
              isStaggered: false,
              castingSpell: null,
            });
          }
          stateChanged = true;
        }
        continue;
      }

      // Handle Stagger Recovery
      if (m.aiState === "STAGGERED") {
        m.staggerTimer -= dt;
        m.state = "hurt";
        if (m.staggerTimer <= 0) {
          m.aiState = "PATROL";
          m.staggerGauge = 0;
          m.state = "idle";
          if (m.isBoss) {
            setBossRaidState({ isStaggered: false, stagger: 0 });
          }
        }
        continue;
      }

      const distToPlayer = m.currentPos.distanceTo(playerPos);
      const distFromSpawn = m.currentPos.distanceTo(m.spawnPos);

      // Leash Check: Return home if pulled too far, player is dead, or player enters Safe Village
      if (isDead || isPlayerInSafeZone || distFromSpawn > m.blueprint.leashRadius) {
        if (m.aiState === "AGGRO_CHASE" || m.aiState === "TELEGRAPH_WINDUP") {
          m.aiState = "RETURNING_HOME";
          m.currentPattern = null;
          m.currentTelegraphId = null;
          stateChanged = true;
        }
      }

      // Lone Predator Special: Heavy Melee 30% Barrier & Enrage at <30% HP
      if (m.archetype === "LONE_PREDATOR" && m.hp <= m.maxHp * 0.30 && !m.hasBarrier) {
        m.hasBarrier = true;
        m.barrierHp = Math.round(m.maxHp * 0.30);
        m.atk = Math.round(m.atk * 1.25);
        m.isEnraged = true;
        addFloatingText("🛡️ THIẾT GIÁP CUỒNG NỘ (+30% Giáp, +25% Công)!", m.currentPos.clone().add(new THREE.Vector3(0, 3.2, 0)), "#a855f7");
        playCombatSFX("heavy_slam", 0.6);
      }

      // Lone Predator Special: Ranged / Mage Kiting / Blinking 4.5m backwards when player is too close
      if (m.archetype === "LONE_PREDATOR" && m.monsterId === "skeleton" && distToPlayer < 3.5 && (m.blinkCooldown || 0) <= 0) {
        const awayDir = m.currentPos.clone().sub(playerPos).normalize();
        awayDir.y = 0;
        m.currentPos.addScaledVector(awayDir, 4.5);
        m.blinkCooldown = 6.0;
        addFloatingText("💨 TỐC BIẾN NÉ TRÁNH!", m.currentPos.clone().add(new THREE.Vector3(0, 2.5, 0)), "#c084fc");
        playCombatSFX("laser_pew", 0.4);
      }

      // Boss Territory Advantage: 1% Max HP auto-heal per second in Boss Altar or Dungeon
      if (m.isBoss && (currentZone === "BOSS_ALTAR" || currentZone === "DUNGEON") && m.hp < m.maxHp) {
        m.territoryHealAcc = (m.territoryHealAcc || 0) + m.maxHp * 0.01 * dt;
        if (m.territoryHealAcc >= 1) {
          const heal = Math.floor(m.territoryHealAcc);
          m.hp = Math.min(m.maxHp, m.hp + heal);
          m.territoryHealAcc -= heal;
        }
      }

      switch (m.aiState) {
        case "PATROL": {
          const weatherAggroMult = weather === "RAIN" ? 0.8 : weather === "DARK_FOG" ? 0.65 : 1.0;
          if (distToPlayer <= m.blueprint.aggroRadius * weatherAggroMult && !isPlayerInSafeZone) {
            m.aiState = "AGGRO_CHASE";
            callSocialAggro(m);
            stateChanged = true;
            break;
          }

          m.patrolTimer -= dt;
          if (m.patrolTimer <= 0) {
            m.patrolDir = Math.random() * Math.PI * 2;
            m.patrolTimer = 2.5 + Math.random() * 2;
          }

          if (distFromSpawn > 5.5) {
            const retDir = m.spawnPos.clone().sub(m.currentPos).normalize();
            retDir.y = 0;
            m.currentPos.addScaledVector(retDir, 1.8 * dt);
            m.facingLeft = retDir.x < -0.05;
          } else {
            m.currentPos.x += Math.cos(m.patrolDir) * 1.2 * dt;
            m.currentPos.z += Math.sin(m.patrolDir) * 1.2 * dt;
            m.facingLeft = Math.cos(m.patrolDir) < -0.05;
          }
          m.state = "idle";
          break;
        }

        case "AGGRO_CHASE": {
          if (distToPlayer > m.blueprint.aggroRadius * 1.4) {
            m.aiState = "PATROL";
            break;
          }

          // ── Flanking & Encircling Algorithm for Swarm Pack ──
          let targetMovePos = playerPos;
          if (m.archetype === "SWARM_PACK") {
            const packIndex = m.packIndex ?? 0;
            const packSize = m.packSize ?? 3;
            const flankAngle = (packIndex / packSize) * Math.PI * 2;
            const flankRadius = 2.6;
            targetMovePos = playerPos.clone().add(new THREE.Vector3(
              Math.cos(flankAngle) * flankRadius,
              0,
              Math.sin(flankAngle) * flankRadius
            ));
          }

          // ── Coordination Buff: +20% Atk Speed if >= 3 Swarm Monsters surround player ──
          const surroundingSwarmCount = monsters.filter(
            (other) => other.isAlive && other.archetype === "SWARM_PACK" && other.currentPos.distanceTo(playerPos) <= 4.0
          ).length;
          const hasCoordinationBuff = m.archetype === "SWARM_PACK" && surroundingSwarmCount >= 3;

          const dir = targetMovePos.clone().sub(m.currentPos);
          dir.y = 0;
          const distToTarget = dir.length();
          const chaseDir = distToTarget > 0.05 ? dir.clone().normalize() : new THREE.Vector3(1, 0, 0);
          m.direction = Math.atan2(chaseDir.x, chaseDir.z);
          m.facingLeft = chaseDir.x < -0.05;

          // Select candidate attack pattern
          // Candidate attack patterns
          const patterns =
            m.isBoss && m.phase === 2 && m.blueprint.phase2Patterns
              ? [...m.blueprint.phase2Patterns, ...m.blueprint.attackPatterns]
              : m.blueprint.attackPatterns;

          const chosenPattern = patterns[Math.floor(Math.random() * patterns.length)];

          // Trigger Ground Telegraph Windup if in range and off cooldown
          // ── Trigger Ground Telegraph with Velocity Lead Prediction ──
          if (distToPlayer <= chosenPattern.range && m.attackCooldown <= 0) {
            m.aiState = "TELEGRAPH_WINDUP";
            m.currentPattern = chosenPattern;
            m.state = "attack";

            // Boss Enrage speed boost: 30% faster telegraph duration!
            const speedMultiplier = hasCoordinationBuff ? 0.8 : 1.0;
            const duration =
              m.isBoss && m.phase === 2
                ? Math.round(chosenPattern.telegraphDurationMs * 0.7)
                : Math.round(chosenPattern.telegraphDurationMs * speedMultiplier);

            const zoneId = nextTelegraphId++;
            m.currentTelegraphId = zoneId;

            // Predictive Targeting: Lead player running trajectory
            const leadTime = (duration / 1000) * 0.65;
            const predictedPos = playerPos.clone().addScaledVector(playerVelRef.current, leadTime);

            let zonePos: [number, number, number];
            let zoneDir: number;

            if (chosenPattern.shape === "LINE_BOX" || chosenPattern.shape === "CONE") {
              const toPredicted = predictedPos.clone().sub(m.currentPos);
              toPredicted.y = 0;
              if (toPredicted.length() > 0.1) toPredicted.normalize();
              zoneDir = Math.atan2(toPredicted.x, toPredicted.z);
              zonePos = [m.currentPos.x, 0.03, m.currentPos.z];
            } else {
              zonePos = [predictedPos.x, 0.03, predictedPos.z];
              zoneDir = m.direction;
            }

            const newZone: ActiveTelegraphZone = {
              id: zoneId,
              monsterInstanceId: m.id,
              pattern: chosenPattern,
              position: zonePos,
              direction: zoneDir,
              elapsedMs: 0,
              durationMs: duration,
              triggered: false,
            };

            setActiveTelegraphs((prev) => [...prev, newZone]);

            if (m.isBoss) {
              setBossRaidState({
                castingSpell: chosenPattern.name,
                castingTimer: duration / 1000,
              });
            }

            stateChanged = true;
          } else if (distToPlayer <= 2.2 && m.attackCooldown <= 0 && !isPlayerInSafeZone) {
            // ── 92-96% Hit Accuracy Basic Melee Strike ──
            m.attackCooldown = (hasCoordinationBuff ? 0.8 : 1.0) * m.blueprint.attackCooldown;
            m.state = "attack";

            const isEvaded = Math.random() > 0.94; // 94% accuracy
            if (isInvincible) {
              addFloatingText("I-FRAME! (LƯỚT NÉ)", playerPos.clone().add(new THREE.Vector3(0, 2.3, 0)), "#38bdf8");
            } else if (isEvaded) {
              addFloatingText("NÉ TRÁNH! (DODGED)", playerPos.clone().add(new THREE.Vector3(0, 2.3, 0)), "#00f2ff");
            } else {
              const levelDiff = m.level - playerLevel;
              const isSuppressed = levelDiff >= 3;
              const suppressionCrit = isSuppressed ? 2.5 : 1.0;
              const weatherBuff = weather === "BLOOD_MOON" ? 1.2 : 1.0;
              const basicDmg = Math.round(m.atk * (m.isEnraged ? 1.25 : 1.0) * suppressionCrit * weatherBuff);
              if (m.isBoss && (currentZone === "BOSS_ALTAR" || currentZone === "DUNGEON")) {
                damagePlayer(basicDmg, chaseDir.clone().multiplyScalar(2.2));
                applyPlayerDebuff({
                  type: "STUN",
                  name: "Choáng Lãnh Địa",
                  icon: "⚡",
                  duration: 1.2,
                });
                addFloatingText("⚡ CHOÁNG LÃNH ĐỊA (1.2S)!", playerPos.clone().add(new THREE.Vector3(0, 3.0, 0)), "#fbbf24");
              } else {
                damagePlayer(basicDmg, chaseDir);
              }
              if (isSuppressed) {
                addFloatingText("💥 ÁP CHẾ BẠO KÍCH (2.5X)!", playerPos.clone().add(new THREE.Vector3(0, 2.7, 0)), "#ef4444");
              }
              addFloatingText(`-${basicDmg}`, playerPos.clone().add(new THREE.Vector3(0, 2.3, 0)), "#ef4444");
            }
          } else {
            // Chase towards target position
            const moveSpd = m.blueprint.moveSpeed * (hasCoordinationBuff ? 1.15 : 1.0);
            m.currentPos.addScaledVector(chaseDir, moveSpd * dt);
            m.state = "run";
          }
          break;
        }

        case "TELEGRAPH_WINDUP": {
          // Locked in place while channeling/winding up
          m.state = "attack";
          break;
        }

        case "COOLDOWN_RECOVERY": {
          if (m.attackCooldown <= 0) {
            m.aiState = "AGGRO_CHASE";
          }
          m.state = "idle";
          break;
        }

        case "RETURNING_HOME": {
          const retDir = m.spawnPos.clone().sub(m.currentPos);
          retDir.y = 0;
          const len = retDir.length();
          if (len < 1.0) {
            m.hp = m.maxHp; // Reset health upon escaping leashed area
            m.staggerGauge = 0;
            m.hasBarrier = false;
            m.barrierHp = 0;
            m.isEnraged = false;
            m.aiState = "PATROL";
            m.state = "idle";
            if (m.isBoss) {
              setBossRaidState({ health: m.maxHp, stagger: 0, castingSpell: null });
            }
          } else {
            retDir.normalize();
            m.currentPos.addScaledVector(retDir, m.blueprint.moveSpeed * 1.5 * dt);
            m.facingLeft = retDir.x < -0.05;
            m.state = "run";
          }
          break;
        }
      }

      // Physical obstacle collisions for monsters (trees, houses, rocks, barriers)
      resolveWorldCollisions(m.currentPos, (m.scale || 1.0) * 0.45);

      // Prevent non-boss monsters from entering Safe Village (r < 21.2m)
      if (!m.isBoss) {
        const dFromCenter = Math.hypot(m.currentPos.x, m.currentPos.z);
        if (dFromCenter < 21.2) {
          const pushScale = 21.2 / (dFromCenter || 1);
          m.currentPos.x *= pushScale;
          m.currentPos.z *= pushScale;
        }
      }
    }

    // Keep Boss HUD updated
    const boss = monsters.find((m) => m.isBoss && m.isAlive);
    if (boss) {
      setBossRaidState({
        health: boss.hp,
        maxHealth: boss.maxHp,
        phase: boss.phase,
        stagger: (boss.staggerGauge / boss.staggerMax) * 100,
        isStaggered: boss.aiState === "STAGGERED",
      });
    }

    // Periodically sync alive monster markers to MinimapRadar (every ~0.15s)
    markerSyncTimer.current += dt;
    if (markerSyncTimer.current >= 0.15) {
      markerSyncTimer.current = 0;
      const markers = monsters
        .filter((m) => m.isAlive)
        .map((m) => ({
          id: m.id,
          x: m.currentPos.x,
          z: m.currentPos.z,
          isBoss: m.isBoss,
          name: m.name,
        }));
      useGameWorldStore.getState().updateMonsterMarkers(markers);

      // Sync closest enemies for Bottom-Right HUD Bars
      const nearbyEnemies = monsters
        .filter((m) => m.isAlive)
        .map((m) => ({
          id: m.id,
          name: m.name,
          hp: m.hp,
          maxHp: m.maxHp,
          dist: m.currentPos.distanceTo(playerPos),
          color: m.color,
        }))
        .filter((m) => m.dist < 25)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 3);
      useGameWorldStore.getState().updateNearbyTargetEnemies(nearbyEnemies);
    }

    if (stateChanged) {
      setRenderTrigger((prev) => (prev + 1) % 1000);
    }
  });

  // ── Helper: Stagger Break & Boss Enrage Phase Check ───────────────────────
  const handleStaggerAndBossCheck = (m: MonsterInstance) => {
    // 1. Stagger Trigger
    if (m.staggerGauge >= m.staggerMax && m.aiState !== "STAGGERED") {
      m.aiState = "STAGGERED";
      m.staggerTimer = 4.0; // 4 seconds vulnerability
      m.state = "hurt";

      // Cancel ongoing telegraph cast
      if (m.currentTelegraphId) {
        setActiveTelegraphs((prev) => prev.filter((t) => t.id !== m.currentTelegraphId));
        m.currentTelegraphId = null;
        m.currentPattern = null;
      }

      playCombatSFX("heavy_slam", 0.5);
      addFloatingText(
        `⚡ PHÁ GIÁP! (STAGGERED 1.5x)`,
        m.currentPos.clone().add(new THREE.Vector3(0, 3.0, 0)),
        "#facc15"
      );

      if (m.isBoss) {
        setBossRaidState({
          isStaggered: true,
          stagger: 100,
          castingSpell: null,
          castingTimer: 0,
        });
      }
    }

    // 2. Boss Phase 2 Enrage Check (HP <= 50%)
    if (m.isBoss && m.phase === 1 && m.hp <= m.maxHp * 0.5) {
      m.phase = 2;
      playCombatSFX("dragon_roar", 0.7);

      addFloatingText(
        `🔥 CUỒNG NỘ! PHASE 2 KÍCH HOẠT!`,
        m.currentPos.clone().add(new THREE.Vector3(0, 3.5, 0)),
        "#ef4444"
      );

      setBossRaidState({
        phase: 2,
      });
    }
  };

  const handleMonsterDefeat = (m: MonsterInstance) => {
    m.isAlive = false;
    m.respawnTimer = m.isBoss ? 15.0 : 6.0;

    // Remove any active telegraph from this dead monster
    if (m.currentTelegraphId) {
      setActiveTelegraphs((prev) => prev.filter((t) => t.id !== m.currentTelegraphId));
    }

    addFloatingText(
      `🏆 +EXP +VÀNG!`,
      m.currentPos.clone().add(new THREE.Vector3(0, 2.8, 0)),
      "#fbbf24"
    );

    // ── Generate Authoritative MMORPG Loot Drops ─────────────────────────────
    const lootResult = rollMonsterLootDrops({
      id: m.id,
      monsterId: m.monsterId,
      name: m.name,
      level: m.level,
      isBoss: m.isBoss,
      aiArchetype: m.archetype,
      position: { x: m.currentPos.x, y: 0.5, z: m.currentPos.z },
    });

    // Spawn authoritative drops
    spawnLoot(lootResult.drops);
    if (lootResult.drops.length > 0) {
      playCombatSFX("loot_drop", 0.45);
    }

    if (lootResult.hasRareDrop) {
      playCombatSFX("rarity_chime", 0.85);
      playCombatSFX("holy_bell", 0.85);
      playCombatSFX("level_up_fanfare", 0.75);
      useGameWorldStore.setState({
        zoneNotification: `📢 [TOÀN SERVER] Người chơi vừa hạ gục ${m.name} và nhặt được bảo vật ${
          lootResult.highestRarity === "legendary" ? "🔥 HUYỀN THOẠI (LEGENDARY)" : "💜 SỬ THI (EPIC)"
        }: ${lootResult.rareItemName}!`,
        zoneNotificationTimer: 6.5,
      });
      addFloatingText(
        `✨ ${lootResult.rareItemName} (${lootResult.highestRarity?.toUpperCase()})!`,
        m.currentPos.clone().add(new THREE.Vector3(0, 3.2, 0)),
        lootResult.highestRarity === "legendary" ? "#fbbf24" : "#c084fc"
      );
    }

    // Quest Progress: Monster Kill & Dungeon Clear
    useGameWorldStore.getState().progressQuest("KILL_MONSTER", m.monsterId, 1);
    if (m.isBoss) {
      useGameWorldStore.getState().progressQuest("CLEAR_DUNGEON", "dragon", 1);
    }

    // Battle Report: Epic Boss gets full modal, Regular Monsters get compact auto-dismiss tab
    const worldStore = useGameWorldStore.getState();
    const dmgDealt = Math.max(m.maxHp, worldStore.currentFightDamageDealt);
    const crits = Math.max(1, worldStore.currentFightCritHits);
    const duration = Math.max(2, Math.round((Date.now() - worldStore.currentFightStartTime) / 1000));
    const expGain = m.isBoss ? 450 : m.level * 35;
    const goldGain = m.isBoss ? 280 : m.level * 18;

    const reportData = {
      victory: true,
      monsterName: m.name,
      monsterLevel: m.level,
      isBoss: m.isBoss,
      totalDamageDealt: dmgDealt,
      critHits: crits,
      durationSeconds: duration,
      expGained: expGain,
      goldGained: goldGain,
      drops: lootResult.drops,
      highestRarity: lootResult.highestRarity,
    };

    if (m.isBoss) {
      // Chỉ khi tiêu diệt BOSS lớn mới hiển thị Bảng Báo Cáo Chiến Đấu toàn màn hình
      worldStore.openBattleReport(reportData);
    } else {
      // Quái nhỏ: Chỉ hiện tab thông báo nhỏ gọn gàng, tự động biến mất nhanh sau 2.5s không che tầm nhìn
      worldStore.showCombatKillToast(reportData);
    }
    worldStore.resetCombatMetrics();

    // Call backend mutation to sync database
    if (onDefeatMonsterCallback) {
      onDefeatMonsterCallback(m.monsterId);
    }
  };

  return (
    <group>
      {/* ── Ground Telegraph Warning Decals ── */}
      {activeTelegraphs.map((zone) => (
        <TelegraphZoneItem
          key={`telegraph-${zone.id}`}
          zone={zone}
          onDetonate={handleTelegraphDetonate}
        />
      ))}

      {/* ── Render 2.5D Billboard Sprites for All Living Monsters with Overhead Culling ── */}
      {(() => {
        const aliveMobs = monstersRef.current.filter((m) => m.isAlive);
        const playerPos = playerPosition;
        // Optimization: Only top 4 nearest entities within 12m or boss / active hit get overhead HUD mounted
        const visibleOverheadSet = new Set(
          aliveMobs
            .filter((m) => m.isBoss || (m.hitFlashTimer && m.hitFlashTimer > 0) || m.currentPos.distanceTo(playerPos) <= 12)
            .sort((a, b) => a.currentPos.distanceTo(playerPos) - b.currentPos.distanceTo(playerPos))
            .slice(0, 4)
            .map((m) => m.id)
        );

        return aliveMobs.map((monster) => {
          const overheadY = monster.currentPos.y + (monster.isBoss ? 4.9 : (monster.scale || 1.0) * 2.3);
          const showOverhead = monster.isBoss || visibleOverheadSet.has(monster.id);

          return (
            <group key={`mob-grp-${monster.id}`}>
              {/* Lone Predator Ground Purple Aura Decal */}
              {monster.archetype === "LONE_PREDATOR" && (
                <mesh position={[monster.currentPos.x, 0.025, monster.currentPos.z]} rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[1.0, 1.8, 32]} />
                  <meshBasicMaterial color="#a855f7" transparent opacity={0.55} side={THREE.DoubleSide} depthWrite={false} />
                </mesh>
              )}

              {/* Lone Predator Barrier Shield Bubble when enrage shield is active */}
              {monster.hasBarrier && (monster.barrierHp ?? 0) > 0 && (
                <mesh position={[monster.currentPos.x, monster.currentPos.y + 1.1, monster.currentPos.z]}>
                  <sphereGeometry args={[1.35, 16, 16]} />
                  <meshBasicMaterial color="#a855f7" transparent opacity={0.28} wireframe={true} />
                </mesh>
              )}

              {/* Monster State Overhead Icon: ! for Aggro / Warning for Cast (Positioned safely above name HUD, culled for distant mobs) */}
              {showOverhead && monster.aiState === "AGGRO_CHASE" && (
                <Text
                  position={[monster.currentPos.x, overheadY, monster.currentPos.z]}
                  fontSize={0.36}
                  color="#ef4444"
                  outlineWidth={0.04}
                  outlineColor="#000000"
                >
                  !
                </Text>
              )}
              {showOverhead && monster.aiState === "TELEGRAPH_WINDUP" && (
                <Text
                  position={[monster.currentPos.x, overheadY, monster.currentPos.z]}
                  fontSize={0.28}
                  color="#f59e0b"
                  outlineWidth={0.04}
                  outlineColor="#000000"
                >
                  ⚠️ GỒNG CHIÊU
                </Text>
              )}
              {showOverhead && monster.aiState === "STAGGERED" && (
                <Text
                  position={[monster.currentPos.x, overheadY, monster.currentPos.z]}
                  fontSize={0.28}
                  color="#facc15"
                  outlineWidth={0.04}
                  outlineColor="#000000"
                >
                  ⚡ CHOÁNG (1.5x)
                </Text>
              )}

              <SpriteBillboard25D
                position={monster.currentPos}
                state={monster.state}
                facingLeft={monster.facingLeft}
                width={monster.isBoss ? 3.4 : (monster.scale || 1.0) * 1.5}
                height={monster.isBoss ? 3.8 : (monster.scale || 1.0) * 1.8}
                textureKey={`mob_${monster.monsterId}`}
                color={monster.color}
                weaponType={monster.weaponType}
                name={monster.name}
                level={monster.level}
                hp={monster.hp}
                maxHp={monster.maxHp}
                isBoss={monster.isBoss}
                showOverhead={showOverhead}
                hitFlash={Boolean(monster.hitFlashTimer && monster.hitFlashTimer > 0)}
                debuffBadges={
                  monster.aiState === "STAGGERED"
                    ? ["⚡"]
                    : monster.hasBarrier
                    ? ["🛡️", "🔥"]
                    : []
                }
              />
            </group>
          );
        });
      })()}

      {/* ── 3D Melee Slash Effects Render ── */}
      {slashEffects.map((sl) => (
        <mesh key={`slash-${sl.id}`} position={sl.position} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[sl.radius * 0.6, sl.radius, 16]} />
          <meshBasicMaterial color={sl.color} transparent opacity={0.65} />
        </mesh>
      ))}

      {/* ── Floating Damage & Reward Texts Render ── */}
      {floatingTexts.map((ft) => (
        <Text
          key={`txt-${ft.id}`}
          position={ft.position}
          fontSize={0.48}
          color={ft.color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.06}
          outlineColor="#000000"
          letterSpacing={0.05}
        >
          {ft.text}
        </Text>
      ))}
    </group>
  );
});
