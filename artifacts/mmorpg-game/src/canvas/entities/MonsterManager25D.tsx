import { memo, useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { SpriteBillboard25D } from "../sprites/SpriteBillboard25D";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { useGetMonsters } from "@workspace/api-client-react";

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
  facingLeft: boolean;
  isAlive: boolean;
  respawnTimer: number;
  attackCooldown: number;
  patrolTimer: number;
  patrolDir: number;
}

const INITIAL_MONSTERS: Omit<MonsterInstance, "currentPos">[] = [
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
    weaponType: "claws",
    isBoss: false,
    spawnPos: new THREE.Vector3(-18, 0, -18),
    state: "idle",
    facingLeft: false,
    isAlive: true,
    respawnTimer: 0,
    attackCooldown: 0,
    patrolTimer: 2,
    patrolDir: 0,
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
    weaponType: "claws",
    isBoss: false,
    spawnPos: new THREE.Vector3(18, 0, -18),
    state: "idle",
    facingLeft: false,
    isAlive: true,
    respawnTimer: 0,
    attackCooldown: 0,
    patrolTimer: 3,
    patrolDir: 0,
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
    weaponType: "claws",
    isBoss: false,
    spawnPos: new THREE.Vector3(-24, 0, 14),
    state: "idle",
    facingLeft: false,
    isAlive: true,
    respawnTimer: 0,
    attackCooldown: 0,
    patrolTimer: 2.5,
    patrolDir: 0,
  },
  // Wilderness: Goblins
  {
    id: 4,
    monsterId: "goblin",
    name: "Yêu Tinh Đao Phủ",
    level: 5,
    hp: 200,
    maxHp: 200,
    atk: 25,
    color: "#84cc16",
    weaponType: "sword",
    isBoss: false,
    spawnPos: new THREE.Vector3(25, 0, 16),
    state: "idle",
    facingLeft: false,
    isAlive: true,
    respawnTimer: 0,
    attackCooldown: 0,
    patrolTimer: 3,
    patrolDir: 0,
  },
  // Wilderness: Orcs
  {
    id: 5,
    monsterId: "orc",
    name: "Chiến Binh Orc Cổ",
    level: 8,
    hp: 350,
    maxHp: 350,
    atk: 38,
    color: "#dc2626",
    weaponType: "sword",
    isBoss: false,
    spawnPos: new THREE.Vector3(0, 0, 32),
    state: "idle",
    facingLeft: false,
    isAlive: true,
    respawnTimer: 0,
    attackCooldown: 0,
    patrolTimer: 3.5,
    patrolDir: 0,
  },
  // Wilderness: Skeleton Knight
  {
    id: 6,
    monsterId: "skeleton",
    name: "Kỵ Sĩ Xương Cổ Đại",
    level: 12,
    hp: 500,
    maxHp: 500,
    atk: 50,
    color: "#cbd5e1",
    weaponType: "sword",
    isBoss: false,
    spawnPos: new THREE.Vector3(0, 0, -32),
    state: "idle",
    facingLeft: false,
    isAlive: true,
    respawnTimer: 0,
    attackCooldown: 0,
    patrolTimer: 4,
    patrolDir: 0,
  },
  // Boss Altar: Ancient Fire Dragon
  {
    id: 10,
    monsterId: "dragon",
    name: "Rồng Lửa Cổ Đại (Boss Cấp 20)",
    level: 20,
    hp: 1500,
    maxHp: 1500,
    atk: 75,
    color: "#ef4444",
    weaponType: "dragon",
    isBoss: true,
    spawnPos: new THREE.Vector3(0, 0, -70),
    state: "idle",
    facingLeft: false,
    isAlive: true,
    respawnTimer: 0,
    attackCooldown: 0,
    patrolTimer: 5,
    patrolDir: 0,
  },
];

export const MonsterManager25D = memo(function MonsterManager25D() {
  const { data: apiMonsters } = useGetMonsters();

  const playerPosition = useGameWorldStore((s) => s.playerPosition);
  const currentZone = useGameWorldStore((s) => s.currentZone);
  const damagePlayer = useGameWorldStore((s) => s.damagePlayer);
  const addFloatingText = useGameWorldStore((s) => s.addFloatingText);
  const setBossHealth = useGameWorldStore((s) => s.setBossHealth);
  const onDefeatMonsterCallback = useGameWorldStore((s) => s.onDefeatMonsterCallback);

  const bullets = useGameWorldStore((s) => s.bullets);
  const slashEffects = useGameWorldStore((s) => s.slashEffects);
  const floatingTexts = useGameWorldStore((s) => s.floatingTexts);

  // Initialize monster instances
  const monstersRef = useRef<MonsterInstance[]>(
    INITIAL_MONSTERS.map((m) => ({
      ...m,
      currentPos: m.spawnPos.clone(),
    }))
  );

  const [, setRenderTrigger] = useState(0);

  // Sync Boss HP to HUD
  useEffect(() => {
    const boss = monstersRef.current.find((m) => m.isBoss);
    if (boss) {
      setBossHealth(boss.hp, boss.maxHp);
    }
  }, [setBossHealth]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const monsters = monstersRef.current;
    const playerPos = playerPosition;
    const isPlayerInSafeZone = currentZone === "SAFE_VILLAGE";

    let stateChanged = false;

    // ── 1. Bullets update and hit detection ──
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.position.addScaledVector(b.velocity, dt);
      b.lifetime -= dt;

      // Check collision with live monsters
      for (const m of monsters) {
        if (!m.isAlive) continue;
        const dist = b.position.distanceTo(m.currentPos);
        const hitRadius = m.isBoss ? 2.5 : 1.4;

        if (dist <= hitRadius) {
          // Monster Hit
          m.hp = Math.max(0, m.hp - b.damage);
          m.state = "hurt";
          b.lifetime = -1; // Destroy bullet

          addFloatingText(`-${b.damage}`, m.currentPos.clone().add(new THREE.Vector3(0, 2.2, 0)), "#38bdf8");

          if (m.isBoss) {
            setBossHealth(m.hp, m.maxHp);
          }

          if (m.hp <= 0) {
            handleMonsterDefeat(m);
          }
          stateChanged = true;
          break;
        }
      }
    }

    // ── 2. Slash Effects hit detection ──
    for (const sl of slashEffects) {
      for (const m of monsters) {
        if (!m.isAlive) continue;
        const dist = sl.position.distanceTo(m.currentPos);
        if (dist <= sl.radius) {
          const dmg = 65;
          m.hp = Math.max(0, m.hp - dmg);
          m.state = "hurt";

          addFloatingText(`-${dmg}`, m.currentPos.clone().add(new THREE.Vector3(0, 2.2, 0)), sl.color);

          if (m.isBoss) {
            setBossHealth(m.hp, m.maxHp);
          }

          if (m.hp <= 0) {
            handleMonsterDefeat(m);
          }
          stateChanged = true;
        }
      }
    }

    // ── 3. Monster AI Behaviors ──
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
          if (m.isBoss) setBossHealth(m.maxHp, m.maxHp);
          stateChanged = true;
        }
        continue;
      }

      const distToPlayer = m.currentPos.distanceTo(playerPos);

      // AI Decision: Chase or Patrol
      if (distToPlayer <= 8.5 && !isPlayerInSafeZone) {
        // Chase player
        const chaseSpeed = m.isBoss ? 3.0 : 3.5;
        const dir = playerPos.clone().sub(m.currentPos).normalize();
        dir.y = 0;

        m.currentPos.addScaledVector(dir, chaseSpeed * dt);
        m.facingLeft = dir.x < -0.05;
        m.state = "run";

        // Attack player if within attack distance (2.2m)
        if (distToPlayer <= 2.2 && m.attackCooldown <= 0) {
          m.attackCooldown = 1.4;
          m.state = "attack";

          // Damage player
          damagePlayer(m.atk, dir);
        }
      } else {
        // Patrol around spawn location
        m.patrolTimer -= dt;
        if (m.patrolTimer <= 0) {
          m.patrolDir = Math.random() * Math.PI * 2;
          m.patrolTimer = 2.5 + Math.random() * 2;
        }

        const distFromSpawn = m.currentPos.distanceTo(m.spawnPos);
        if (distFromSpawn > 6) {
          // Return towards spawn point
          const returnDir = m.spawnPos.clone().sub(m.currentPos).normalize();
          returnDir.y = 0;
          m.currentPos.addScaledVector(returnDir, 1.8 * dt);
          m.facingLeft = returnDir.x < -0.05;
        } else {
          // Wander slowly
          m.currentPos.x += Math.cos(m.patrolDir) * 1.2 * dt;
          m.currentPos.z += Math.sin(m.patrolDir) * 1.2 * dt;
          m.facingLeft = Math.cos(m.patrolDir) < -0.05;
        }
        m.state = "idle";
      }
    }

    if (stateChanged) {
      setRenderTrigger((prev) => (prev + 1) % 1000);
    }
  });

  const handleMonsterDefeat = (m: MonsterInstance) => {
    m.isAlive = false;
    m.respawnTimer = 6.0; // Respawn in 6 seconds

    addFloatingText(
      `🏆 +EXP +VÀNG!`,
      m.currentPos.clone().add(new THREE.Vector3(0, 2.8, 0)),
      "#fbbf24"
    );

    // Call database synchronization callback to trigger backend mutation
    if (onDefeatMonsterCallback) {
      onDefeatMonsterCallback(m.monsterId);
    }
  };

  return (
    <group>
      {/* ── Render 2.5D Billboard Sprites for All Living Monsters ── */}
      {monstersRef.current.map((monster) => {
        if (!monster.isAlive) return null;
        return (
          <SpriteBillboard25D
            key={`mob-${monster.id}`}
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
          fontSize={0.42}
          color={ft.color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.04}
          outlineColor="#000000"
        >
          {ft.text}
        </Text>
      ))}
    </group>
  );
});
