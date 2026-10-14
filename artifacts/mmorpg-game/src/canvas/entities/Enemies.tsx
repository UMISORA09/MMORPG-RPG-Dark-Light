import { useRef, memo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "../../stores";
import type { EnemyState, FloatingDamage } from "../../game/types";

const Enemies = memo(function Enemies() {
  const enemies = useGameStore((s) => s.enemies);
  const floatingDamages = useGameStore((s) => s.floatingDamages);

  return (
    <group>
      {/* Alive Enemies */}
      {enemies.map((e) => e.isAlive && <Enemy key={e.id} enemy={e} />)}

      {/* 3D Floating Damage Numbers */}
      {floatingDamages.map((fd) => (
        <FloatingDamageItem key={fd.id} item={fd} />
      ))}
    </group>
  );
});

export default Enemies;

// ==============================================================================
// Enemy Entity Controller
// ==============================================================================
function Enemy({ enemy }: { enemy: EnemyState }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.copy(enemy.position);

    // Face towards player when chasing or attacking
    const player = useGameStore.getState().player;
    const dir = player.position.clone().sub(enemy.position);
    if (dir.length() > 0.1) {
      groupRef.current.rotation.y = Math.atan2(dir.x, dir.z);
    }
  });

  const isAlert = enemy.state === "chase" || enemy.state === "attack";

  if (enemy.isBoss || enemy.type === "dragon") {
    return <DragonBossMesh groupRef={groupRef} enemy={enemy} isAlert={isAlert} />;
  }
  if (enemy.type === "slime") {
    return <SlimeMesh groupRef={groupRef} enemy={enemy} isAlert={isAlert} />;
  }
  if (enemy.type === "wolf") {
    return <WolfMesh groupRef={groupRef} enemy={enemy} isAlert={isAlert} />;
  }
  if (enemy.type === "orc") {
    return <OrcMesh groupRef={groupRef} enemy={enemy} isAlert={isAlert} />;
  }
  if (enemy.type === "goblin") {
    return <GoblinMesh groupRef={groupRef} enemy={enemy} isAlert={isAlert} />;
  }
  return <SkeletonMesh groupRef={groupRef} enemy={enemy} isAlert={isAlert} />;
}

// ==============================================================================
// Health Bar Component
// ==============================================================================
function HealthBar({ health, maxHealth, isBoss }: { health: number; maxHealth: number; isBoss?: boolean }) {
  const pct = Math.max(0, health / maxHealth);
  const barColor = pct > 0.6 ? "#22c55e" : pct > 0.3 ? "#eab308" : "#ef4444";
  const width = isBoss ? 2.8 : 1.2;
  const height = isBoss ? 0.22 : 0.14;
  const yPos = isBoss ? 4.8 : 2.4;

  return (
    <group position={[0, yPos, 0]}>
      {/* Background Frame */}
      <mesh>
        <boxGeometry args={[width, height, 0.06]} />
        <meshBasicMaterial color="#09090b" />
      </mesh>
      {/* Fill Bar */}
      <mesh position={[-(width * (1 - pct)) / 2, 0, 0.04]}>
        <boxGeometry args={[width * pct, height, 0.06]} />
        <meshBasicMaterial color={barColor} />
      </mesh>
    </group>
  );
}

// ==============================================================================
// Dragon Boss 3D Mesh
// ==============================================================================
function DragonBossMesh({
  groupRef,
  enemy,
  isAlert,
}: {
  groupRef: React.RefObject<THREE.Group | null>;
  enemy: EnemyState;
  isAlert: boolean;
}) {
  const leftWingRef = useRef<THREE.Group>(null);
  const rightWingRef = useRef<THREE.Group>(null);
  const breathLightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 4;
    const flap = Math.sin(t) * 0.35;
    if (leftWingRef.current) leftWingRef.current.rotation.z = flap;
    if (rightWingRef.current) rightWingRef.current.rotation.z = -flap;
    if (breathLightRef.current) {
      breathLightRef.current.intensity = 2.5 + Math.sin(t * 2) * 1.5;
    }
  });

  return (
    <group ref={groupRef}>
      <HealthBar health={enemy.health} maxHealth={enemy.maxHealth} isBoss={true} />

      {/* Main Massive Dragon Body */}
      <mesh position={[0, 2.2, 0]} castShadow>
        <capsuleGeometry args={[1.4, 2.2, 12, 24]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Golden Dragon Chest Scales */}
      <mesh position={[0, 2.0, 0.9]}>
        <boxGeometry args={[1.5, 1.8, 0.4]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Dragon Head */}
      <group position={[0, 3.4, 1.4]}>
        <mesh castShadow>
          <boxGeometry args={[1.2, 1.1, 1.8]} />
          <meshStandardMaterial color="#991b1b" roughness={0.4} metalness={0.5} />
        </mesh>
        {/* Glowing Fiery Eyes */}
        <mesh position={[-0.45, 0.25, 0.8]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
        <mesh position={[0.45, 0.25, 0.8]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
        {/* Dragon Horns */}
        <mesh position={[-0.5, 0.8, -0.2]} rotation={[-0.4, 0, -0.3]}>
          <coneGeometry args={[0.25, 1.2, 6]} />
          <meshStandardMaterial color="#1c1917" />
        </mesh>
        <mesh position={[0.5, 0.8, -0.2]} rotation={[-0.4, 0, 0.3]}>
          <coneGeometry args={[0.25, 1.2, 6]} />
          <meshStandardMaterial color="#1c1917" />
        </mesh>
        {/* Fire Breath Light */}
        <pointLight ref={breathLightRef} position={[0, -0.2, 1.2]} color="#ff4500" intensity={3} distance={8} decay={2} />
      </group>

      {/* Left Wing */}
      <group ref={leftWingRef} position={[-1.2, 2.8, -0.2]}>
        <mesh position={[-2.2, 0.5, 0]} rotation={[0, 0, 0.2]}>
          <boxGeometry args={[3.8, 0.1, 2.2]} />
          <meshStandardMaterial color="#450a0a" roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Right Wing */}
      <group ref={rightWingRef} position={[1.2, 2.8, -0.2]}>
        <mesh position={[2.2, 0.5, 0]} rotation={[0, 0, -0.2]}>
          <boxGeometry args={[3.8, 0.1, 2.2]} />
          <meshStandardMaterial color="#450a0a" roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Boss Aura Light */}
      <pointLight position={[0, 2.5, 0]} color="#ef4444" intensity={4} distance={12} decay={2} />
    </group>
  );
}

// ==============================================================================
// Slime 3D Mesh
// ==============================================================================
function SlimeMesh({ groupRef, enemy }: { groupRef: React.RefObject<THREE.Group | null>; enemy: EnemyState; isAlert: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.getElapsedTime() * 6;
      meshRef.current.scale.y = 1 + Math.sin(t) * 0.15;
      meshRef.current.scale.x = 1 - Math.sin(t) * 0.1;
      meshRef.current.scale.z = 1 - Math.sin(t) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      <HealthBar health={enemy.health} maxHealth={enemy.maxHealth} />
      <mesh ref={meshRef} position={[0, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshStandardMaterial color="#22c55e" roughness={0.2} transparent opacity={0.88} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.2, 0.6, 0.55]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.2, 0.6, 0.55]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

// ==============================================================================
// Wolf 3D Mesh
// ==============================================================================
function WolfMesh({ groupRef, enemy }: { groupRef: React.RefObject<THREE.Group | null>; enemy: EnemyState; isAlert: boolean }) {
  return (
    <group ref={groupRef}>
      <HealthBar health={enemy.health} maxHealth={enemy.maxHealth} />
      {/* Wolf Body */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <boxGeometry args={[0.7, 0.7, 1.6]} />
        <meshStandardMaterial color="#475569" roughness={0.8} />
      </mesh>
      {/* Wolf Head */}
      <mesh position={[0, 1.1, 0.9]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.7]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      {/* Red Eyes */}
      <mesh position={[-0.15, 1.18, 1.25]}>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshBasicMaterial color="#00f2ff" />
      </mesh>
      <mesh position={[0.15, 1.18, 1.25]}>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshBasicMaterial color="#00f2ff" />
      </mesh>
    </group>
  );
}

// ==============================================================================
// Goblin 3D Mesh
// ==============================================================================
function GoblinMesh({ groupRef, enemy }: { groupRef: React.RefObject<THREE.Group | null>; enemy: EnemyState; isAlert: boolean }) {
  return (
    <group ref={groupRef}>
      <HealthBar health={enemy.health} maxHealth={enemy.maxHealth} />
      {/* Body */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <capsuleGeometry args={[0.35, 0.6, 6, 12]} />
        <meshStandardMaterial color="#15803d" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color="#16a34a" />
      </mesh>
      {/* Dagger */}
      <mesh position={[0.45, 0.6, 0.3]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.08, 0.6, 0.08]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.7} />
      </mesh>
    </group>
  );
}

// ==============================================================================
// Orc 3D Mesh
// ==============================================================================
function OrcMesh({ groupRef, enemy }: { groupRef: React.RefObject<THREE.Group | null>; enemy: EnemyState; isAlert: boolean }) {
  return (
    <group ref={groupRef}>
      <HealthBar health={enemy.health} maxHealth={enemy.maxHealth} />
      {/* Heavy Body */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <boxGeometry args={[1.1, 1.4, 0.8]} />
        <meshStandardMaterial color="#365314" roughness={0.8} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.9, 0]} castShadow>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#4d7c0f" />
      </mesh>
      {/* Club Weapon */}
      <mesh position={[0.8, 1.2, 0.2]} rotation={[0.2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.1, 1.4, 8]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
    </group>
  );
}

// ==============================================================================
// Skeleton 3D Mesh
// ==============================================================================
function SkeletonMesh({ groupRef, enemy }: { groupRef: React.RefObject<THREE.Group | null>; enemy: EnemyState; isAlert: boolean }) {
  return (
    <group ref={groupRef}>
      <HealthBar health={enemy.health} maxHealth={enemy.maxHealth} />
      {/* Ribcage */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[0.6, 0.8, 0.3]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
      </mesh>
      {/* Skull */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <sphereGeometry args={[0.28, 8, 8]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      {/* Glowing Eye Sockets */}
      <mesh position={[-0.1, 1.52, 0.22]}>
        <sphereGeometry args={[0.05, 4, 4]} />
        <meshBasicMaterial color="#a855f7" />
      </mesh>
      <mesh position={[0.1, 1.52, 0.22]}>
        <sphereGeometry args={[0.05, 4, 4]} />
        <meshBasicMaterial color="#a855f7" />
      </mesh>
    </group>
  );
}

// ==============================================================================
// 3D Floating Damage Numbers
// ==============================================================================
function FloatingDamageItem({ item }: { item: FloatingDamage }) {
  const meshRef = useRef<THREE.Group>(null);
  const opacity = Math.min(1, item.lifetime / (item.maxLifetime * 0.4));

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(item.position);
    }
  });

  return (
    <group ref={meshRef} position={[item.position.x, item.position.y, item.position.z]}>
      {/* Small glowing sphere indicator for damage point */}
      <mesh>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color={item.color} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}
