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
}

const INITIAL_MONSTERS_DATA = [
  // Wilderness: Slimes
  {
    id: 1,
    monsterId: "slime",
    name: "Slime Rừng Sâu",
    level: 1,
    hp: 80,
    maxHp: 80,
    atk: 10,
    color: "#22c55e",
    weaponType: "claws" as const,
    isBoss: false,
    spawnPos: new THREE.Vector3(-18, 0, -18),
  },
  {
    id: 2,
    monsterId: "slime",
    name: "Slime Đầm Lầy",
    level: 2,
    hp: 95,
    maxHp: 95,
    atk: 12,
    color: "#16a34a",
    weaponType: "claws" as const,
    isBoss: false,
    spawnPos: new THREE.Vector3(18, 0, -18),
  },
  // Wilderness: Wolves
  {
    id: 3,
    monsterId: "wolf",
    name: "Sói Hoang Hoang Dã",
    level: 3,
    hp: 140,
    maxHp: 140,
    atk: 18,
    color: "#94a3b8",
    weaponType: "claws" as const,
    isBoss: false,
    spawnPos: new THREE.Vector3(-24, 0, 14),
  },
  // Wilderness: Goblins
  {
    id: 4,
    monsterId: "goblin",
    name: "Yêu Tinh Đao Phủ",
    level: 5,
    hp: 220,
    maxHp: 220,
    atk: 25,
    color: "#84cc16",
    weaponType: "sword" as const,
    isBoss: false,
    spawnPos: new THREE.Vector3(25, 0, 16),
  },
  // Wilderness: Orcs
  {
    id: 5,
    monsterId: "orc",
    name: "Chiến Binh Orc Cổ",
    level: 8,
    hp: 360,
    maxHp: 360,
    atk: 38,
    color: "#dc2626",
    weaponType: "sword" as const,
    isBoss: false,
    spawnPos: new THREE.Vector3(0, 0, 32),
  },
  // Wilderness: Skeleton Knight
  {
    id: 6,
    monsterId: "skeleton",
    name: "Kỵ Sĩ Xương Cổ Đại",
    level: 12,
    hp: 520,
    maxHp: 520,
    atk: 50,
    color: "#cbd5e1",
    weaponType: "sword" as const,
    isBoss: false,
    spawnPos: new THREE.Vector3(0, 0, -32),
  },
  // Boss Altar: Ancient Fire Dragon
  {
    id: 10,
    monsterId: "dragon",
    name: "Rồng Lửa Cổ Đại (Boss Cấp 20)",
    level: 20,
    hp: 1600,
    maxHp: 1600,
    atk: 75,
    color: "#ef4444",
    weaponType: "dragon" as const,
    isBoss: true,
    spawnPos: new THREE.Vector3(0, 0, -70),
  },
];

let nextTelegraphId = 8000;

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

  const bullets = useGameWorldStore((s) => s.bullets);
  const slashEffects = useGameWorldStore((s) => s.slashEffects);
  const floatingTexts = useGameWorldStore((s) => s.floatingTexts);

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
      };
    })
  );

  // Active ground telegraph zones
  const [activeTelegraphs, setActiveTelegraphs] = useState<ActiveTelegraphZone[]>([]);
  const activeTelegraphsRef = useRef<ActiveTelegraphZone[]>([]);
  activeTelegraphsRef.current = activeTelegraphs;

  const [, setRenderTrigger] = useState(0);

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
          const finalDamage = Math.round(baseAtk * pattern.damageMultiplier * enrageBonus);

          // Calculate knockback direction
          const [zx, , zz] = zone.position;
          const knockbackDir = new THREE.Vector3(playerPos.x - zx, 0, playerPos.z - zz).normalize();
          if (knockbackDir.length() < 0.1) knockbackDir.set(1, 0, 0);

          damagePlayer(finalDamage, knockbackDir);

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

    let stateChanged = false;

    // ── 1. Bullets update and hit detection ──────────────────────────────────
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.position.addScaledVector(b.velocity, dt);
      b.lifetime -= dt;

      for (const m of monsters) {
        if (!m.isAlive) continue;
        const dist = b.position.distanceTo(m.currentPos);
        const hitRadius = m.isBoss ? 2.5 : 1.4;

        if (dist <= hitRadius) {
          // Stagger vulnerability: 1.5x damage if monster is staggered!
          const dmgMultiplier = m.aiState === "STAGGERED" ? 1.5 : 1.0;
          const actualDamage = Math.round(b.damage * dmgMultiplier);

          m.hp = Math.max(0, m.hp - actualDamage);
          m.state = "hurt";
          b.lifetime = -1; // Destroy bullet

          // Accumulate Stagger Gauge
          m.staggerGauge = Math.min(m.staggerMax, m.staggerGauge + actualDamage * 0.7);

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

    // ── 2. Slash Effects hit detection ──────────────────────────────────────
    for (const sl of slashEffects) {
      for (const m of monsters) {
        if (!m.isAlive) continue;
        const dist = sl.position.distanceTo(m.currentPos);
        if (dist <= sl.radius) {
          const dmgMultiplier = m.aiState === "STAGGERED" ? 1.5 : 1.0;
          const baseSlashDmg = 75;
          const actualDamage = Math.round(baseSlashDmg * dmgMultiplier);

          m.hp = Math.max(0, m.hp - actualDamage);
          m.state = "hurt";

          m.staggerGauge = Math.min(m.staggerMax, m.staggerGauge + actualDamage * 0.8);

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

      // Leash Check: Return home if pulled too far or player enters Safe Village
      if (distFromSpawn > m.blueprint.leashRadius || (isPlayerInSafeZone && distToPlayer < 14)) {
        m.aiState = "RETURNING_HOME";
      }

      switch (m.aiState) {
        case "PATROL": {
          if (distToPlayer <= m.blueprint.aggroRadius && !isPlayerInSafeZone) {
            m.aiState = "AGGRO_CHASE";
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

          const dir = playerPos.clone().sub(m.currentPos);
          dir.y = 0;
          const chaseDir = dir.clone().normalize();
          m.direction = Math.atan2(chaseDir.x, chaseDir.z);
          m.facingLeft = chaseDir.x < -0.05;

          // Select candidate attack pattern
          const patterns =
            m.isBoss && m.phase === 2 && m.blueprint.phase2Patterns
              ? [...m.blueprint.phase2Patterns, ...m.blueprint.attackPatterns]
              : m.blueprint.attackPatterns;

          const chosenPattern = patterns[Math.floor(Math.random() * patterns.length)];

          // Trigger Ground Telegraph Windup if in range and off cooldown
          if (distToPlayer <= chosenPattern.range && m.attackCooldown <= 0) {
            m.aiState = "TELEGRAPH_WINDUP";
            m.currentPattern = chosenPattern;
            m.state = "attack";

            // Boss Enrage speed boost: 30% faster telegraph duration!
            const duration =
              m.isBoss && m.phase === 2
                ? Math.round(chosenPattern.telegraphDurationMs * 0.7)
                : chosenPattern.telegraphDurationMs;

            const zoneId = nextTelegraphId++;
            m.currentTelegraphId = zoneId;

            const newZone: ActiveTelegraphZone = {
              id: zoneId,
              monsterInstanceId: m.id,
              pattern: chosenPattern,
              position: [m.currentPos.x, 0.03, m.currentPos.z],
              direction: m.direction,
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
          } else {
            // Chase towards player
            m.currentPos.addScaledVector(chaseDir, m.blueprint.moveSpeed * dt);
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

    // ── Generate 3D Loot Drops ──────────────────────────────────────────────
    const drops: DroppedItem[] = [];
    const basePos = m.currentPos;

    const createDropVelocity = (): [number, number, number] => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.2 + Math.random() * 3.5;
      return [
        Math.cos(angle) * speed,
        5.5 + Math.random() * 3.5,
        Math.sin(angle) * speed,
      ];
    };

    if (m.isBoss) {
      // 1. World Boss Drops: Multiple Gold Bundles + Guaranteed Legendary + Epic Gear
      for (let i = 0; i < 4; i++) {
        drops.push({
          id: `drop-${Date.now()}-gold-${i}`,
          itemId: "gold_pile",
          name: "Rương Vàng Khổng Lồ",
          type: "gold",
          rarity: "rare",
          position: [basePos.x + (Math.random() - 0.5) * 2, 0.5, basePos.z + (Math.random() - 0.5) * 2],
          velocity: createDropVelocity(),
          value: 120 + Math.floor(Math.random() * 60),
          icon: "🪙",
          color: "#fbbf24",
          bounceCount: 0,
          isGrounded: false,
          lifetime: 60,
        });
      }

      // Guaranteed Legendary Dragon Blade
      drops.push({
        id: `drop-${Date.now()}-legendary`,
        itemId: "dragon_blade",
        name: "Long Thần Kiếm",
        type: "weapon",
        rarity: "legendary",
        position: [basePos.x, 0.6, basePos.z],
        velocity: createDropVelocity(),
        value: 85,
        icon: "🔥",
        color: "#fbbf24",
        statText: "ATK +85, MAG +35",
        bounceCount: 0,
        isGrounded: false,
        lifetime: 120,
      });

      // Guaranteed Epic Dragon Armor
      drops.push({
        id: `drop-${Date.now()}-epic`,
        itemId: "dragon_armor",
        name: "Long Thần Hoàng Giáp",
        type: "armor",
        rarity: "epic",
        position: [basePos.x, 0.6, basePos.z],
        velocity: createDropVelocity(),
        value: 65,
        icon: "🛡️",
        color: "#c084fc",
        statText: "HP +180, DEF +26",
        bounceCount: 0,
        isGrounded: false,
        lifetime: 120,
      });

      // Divine Healing Potions
      drops.push({
        id: `drop-${Date.now()}-potion`,
        itemId: "potion_divine",
        name: "Thánh Thủy Hồi Phục",
        type: "potion",
        rarity: "rare",
        position: [basePos.x, 0.6, basePos.z],
        velocity: createDropVelocity(),
        value: 350,
        icon: "🧪",
        color: "#22c55e",
        statText: "Hồi 350 HP",
        bounceCount: 0,
        isGrounded: false,
        lifetime: 60,
      });
    } else if (m.level >= 5) {
      // 2. Elite Monsters: 2 Gold Drops + Rare/Epic Equipment + Health Potion
      for (let i = 0; i < 2; i++) {
        drops.push({
          id: `drop-${Date.now()}-gold-${i}`,
          itemId: "gold_coin",
          name: "Túi Vàng Tinh Anh",
          type: "gold",
          rarity: "common",
          position: [basePos.x, 0.5, basePos.z],
          velocity: createDropVelocity(),
          value: 45 + Math.floor(Math.random() * 35),
          icon: "🪙",
          color: "#fbbf24",
          bounceCount: 0,
          isGrounded: false,
          lifetime: 45,
        });
      }

      // Rare/Epic Gear
      drops.push({
        id: `drop-${Date.now()}-elite-gear`,
        itemId: "steel_sword",
        name: "Kiếm Thép Tinh Luyện",
        type: "weapon",
        rarity: "rare",
        position: [basePos.x, 0.6, basePos.z],
        velocity: createDropVelocity(),
        value: 28,
        icon: "🗡️",
        color: "#00f2ff",
        statText: "ATK +28, SPD +0.3",
        bounceCount: 0,
        isGrounded: false,
        lifetime: 90,
      });

      drops.push({
        id: `drop-${Date.now()}-potion`,
        itemId: "potion_hp",
        name: "Bình Huyết Dược",
        type: "potion",
        rarity: "common",
        position: [basePos.x, 0.5, basePos.z],
        velocity: createDropVelocity(),
        value: 160,
        icon: "🧪",
        color: "#22c55e",
        statText: "Hồi 160 HP",
        bounceCount: 0,
        isGrounded: false,
        lifetime: 45,
      });
    } else {
      // 3. Minion Slime / Wolves: Gold Coin + Chance for Potion or Basic Weapon
      drops.push({
        id: `drop-${Date.now()}-gold`,
        itemId: "gold_coin",
        name: "Tiền Vàng",
        type: "gold",
        rarity: "common",
        position: [basePos.x, 0.4, basePos.z],
        velocity: createDropVelocity(),
        value: 18 + Math.floor(Math.random() * 20),
        icon: "🪙",
        color: "#fbbf24",
        bounceCount: 0,
        isGrounded: false,
        lifetime: 35,
      });

      if (Math.random() > 0.4) {
        drops.push({
          id: `drop-${Date.now()}-potion`,
          itemId: "potion_hp",
          name: "Bình Huyết Dược Nhỏ",
          type: "potion",
          rarity: "common",
          position: [basePos.x, 0.4, basePos.z],
          velocity: createDropVelocity(),
          value: 100,
          icon: "🧪",
          color: "#22c55e",
          statText: "Hồi 100 HP",
          bounceCount: 0,
          isGrounded: false,
          lifetime: 35,
        });
      }

      if (Math.random() > 0.7) {
        drops.push({
          id: `drop-${Date.now()}-common-gear`,
          itemId: "iron_sword",
          name: "Kiếm Sắt Rừng Sâu",
          type: "weapon",
          rarity: "common",
          position: [basePos.x, 0.4, basePos.z],
          velocity: createDropVelocity(),
          value: 12,
          icon: "⚔️",
          color: "#94a3b8",
          statText: "ATK +12",
          bounceCount: 0,
          isGrounded: false,
          lifetime: 45,
        });
      }
    }

    // Spawn generated drops to 3D world scene
    spawnLoot(drops);

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

      {/* ── Render 2.5D Billboard Sprites for All Living Monsters ── */}
      {monstersRef.current.map((monster) => {
        if (!monster.isAlive) return null;
        return (
          <group key={`mob-grp-${monster.id}`}>
            {/* Monster State Overhead Icon: ! for Aggro / Warning for Cast */}
            {monster.aiState === "AGGRO_CHASE" && (
              <Text
                position={[monster.currentPos.x, monster.currentPos.y + (monster.isBoss ? 3.6 : 2.2), monster.currentPos.z]}
                fontSize={0.4}
                color="#ef4444"
                outlineWidth={0.04}
                outlineColor="#000000"
              >
                !
              </Text>
            )}
            {monster.aiState === "TELEGRAPH_WINDUP" && (
              <Text
                position={[monster.currentPos.x, monster.currentPos.y + (monster.isBoss ? 3.6 : 2.2), monster.currentPos.z]}
                fontSize={0.35}
                color="#f59e0b"
                outlineWidth={0.04}
                outlineColor="#000000"
              >
                ⚠️ GỒNG CHIÊU
              </Text>
            )}
            {monster.aiState === "STAGGERED" && (
              <Text
                position={[monster.currentPos.x, monster.currentPos.y + (monster.isBoss ? 3.6 : 2.2), monster.currentPos.z]}
                fontSize={0.35}
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
              textureKey={`mob_${monster.monsterId}`}
              color={monster.color}
              weaponType={monster.weaponType}
              name={monster.name}
              level={monster.level}
              hp={monster.hp}
              maxHp={monster.maxHp}
              isBoss={monster.isBoss}
            />
          </group>
        );
      })}

      {/* ── 3D Energy Bullets Render ── */}
      {bullets.map((b) => (
        <mesh key={`bullet-${b.id}`} position={b.position}>
          <sphereGeometry args={[0.22, 8, 8]} />
          <meshBasicMaterial color={b.color} />
        </mesh>
      ))}

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
