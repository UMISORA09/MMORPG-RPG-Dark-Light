// ==============================================================================
// 3D Real-Time Loot Drops Manager
// Parabolic Bounce Physics, Vertical Rarity Beams & Proximity Magnet Auto-Pickup
// ==============================================================================

import { memo, useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { playCombatSFX } from "@/audio/CombatSoundSynth";
import { RARITY_COLORS, type DroppedItem } from "./loot.types";

export const LootManager3D = memo(function LootManager3D() {
  const droppedLoot = useGameWorldStore((s) => s.droppedLoot);
  const playerPosition = useGameWorldStore((s) => s.playerPosition);
  const pickUpLoot = useGameWorldStore((s) => s.pickUpLoot);

  // Group reference for local animations
  const groupRef = useRef<THREE.Group>(null);

  // Reusable vector objects to avoid GC pressure
  const tempPlayerPos = useMemo(() => new THREE.Vector3(), []);
  const tempItemPos = useMemo(() => new THREE.Vector3(), []);
  const tempDir = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const time = state.clock.getElapsedTime();
    tempPlayerPos.copy(playerPosition);

    for (let i = droppedLoot.length - 1; i >= 0; i--) {
      const item = droppedLoot[i];

      // ── 1. Parabolic Arc Bounce Physics ───────────────────────────────────
      if (!item.isGrounded) {
        // Apply Gravity
        item.velocity[1] -= 22.0 * dt;

        // Apply Velocity
        item.position[0] += item.velocity[0] * dt;
        item.position[1] += item.velocity[1] * dt;
        item.position[2] += item.velocity[2] * dt;

        // Ground Collision
        if (item.position[1] <= 0.18) {
          item.position[1] = 0.18;
          item.bounceCount++;

          if (item.bounceCount < 3) {
            // Bounce up with energy damping
            item.velocity[1] = -item.velocity[1] * 0.45;
            item.velocity[0] *= 0.6;
            item.velocity[2] *= 0.6;
          } else {
            // Settle on ground
            item.isGrounded = true;
            item.velocity = [0, 0, 0];
          }
        }
      } else {
        // Idle hover bobbing
        const seed = item.position[0] * 12.3 + item.position[2] * 45.6;
        item.position[1] = 0.28 + Math.sin(time * 3.5 + seed) * 0.08;
      }

      // ── 2. Proximity Magnet Auto-Pickup ───────────────────────────────────
      tempItemPos.set(item.position[0], item.position[1], item.position[2]);
      const distToPlayer = tempItemPos.distanceTo(tempPlayerPos);

      // Proximity threshold: 3.8 meters
      if (distToPlayer <= 3.8) {
        tempDir.copy(tempPlayerPos).sub(tempItemPos).normalize();
        const magnetSpeed = Math.min(22.0, 8.0 + (3.8 - distToPlayer) * 5.0);

        item.position[0] += tempDir.x * magnetSpeed * dt;
        item.position[1] += (tempPlayerPos.y + 0.8 - item.position[1]) * 6.0 * dt;
        item.position[2] += tempDir.z * magnetSpeed * dt;

        // Contact Pickup Threshold: 0.65 meters
        if (distToPlayer <= 0.65) {
          // Play Synthesized Audio based on item rarity
          if (item.type === "gold") {
            playCombatSFX("coin_chime", 0.4);
          } else if (item.rarity === "legendary" || item.rarity === "epic") {
            playCombatSFX("level_up_fanfare", 0.5);
          } else {
            playCombatSFX("coin_chime", 0.35);
          }

          // Trigger store pickup callback
          pickUpLoot(item);
        }
      }
    }
  });

  return (
    <group ref={groupRef}>
      {droppedLoot.map((item) => (
        <LootItemInstance
          key={`loot-${item.id}`}
          item={item}
          playerPos={playerPosition}
        />
      ))}
    </group>
  );
});

// ── Sub-component for Individual Dropped Loot Item ───────────────────────────
interface LootItemInstanceProps {
  item: DroppedItem;
  playerPos: THREE.Vector3;
}

const LootItemInstance = memo(function LootItemInstance({
  item,
  playerPos,
}: LootItemInstanceProps) {
  const colors = RARITY_COLORS[item.rarity];
  const beamHeight = item.rarity === "legendary" ? 7.0 : item.rarity === "epic" ? 5.5 : 4.0;
  const beamOpacity = item.rarity === "legendary" ? 0.75 : item.rarity === "epic" ? 0.6 : 0.45;

  // Calculate distance for tooltip display
  const dx = item.position[0] - playerPos.x;
  const dz = item.position[2] - playerPos.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  const showTooltip = dist <= 4.2;

  return (
    <group position={item.position}>
      {/* ── 1. Vertical Luminous Rarity Beam ── */}
      <mesh position={[0, beamHeight / 2, 0]}>
        <cylinderGeometry args={[0.08, 0.28, beamHeight, 16, 1, true]} />
        <meshBasicMaterial
          color={colors.beam}
          transparent
          opacity={beamOpacity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* ── 2. Ground Contact Light Ring ── */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.85, 24]} />
        <meshBasicMaterial
          color={colors.glow}
          transparent
          opacity={0.65}
          depthWrite={false}
        />
      </mesh>

      {/* ── 3. Rotating 3D Item Crystal & Icon Billboard ── */}
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <Text
          position={[0, 0.45, 0]}
          fontSize={0.52}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          {item.icon}
        </Text>
      </Billboard>

      {/* ── 4. Floating Name & Stats Tooltip (Near Player) ── */}
      {showTooltip && (
        <Billboard position={[0, 1.25, 0]} follow>
          {/* Glassmorphic Background Card */}
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[2.4, 0.7]} />
            <meshBasicMaterial color="#020617" transparent opacity={0.88} />
          </mesh>
          {/* Border Outline */}
          <mesh position={[0, 0, -0.02]}>
            <planeGeometry args={[2.45, 0.75]} />
            <meshBasicMaterial color={colors.beam} transparent opacity={0.8} />
          </mesh>

          {/* Item Name */}
          <Text
            position={[0, 0.14, 0.01]}
            fontSize={0.2}
            color={colors.beam}
            anchorX="center"
            anchorY="middle"
            font="sans-serif"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {item.name}
          </Text>

          {/* Rarity & Stat Text */}
          <Text
            position={[0, -0.14, 0.01]}
            fontSize={0.15}
            color="#e2e8f0"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.015}
            outlineColor="#000000"
          >
            {item.statText ? `[${colors.text}] ${item.statText}` : `[${colors.text}] +${item.value} Vàng`}
          </Text>
        </Billboard>
      )}
    </group>
  );
});
