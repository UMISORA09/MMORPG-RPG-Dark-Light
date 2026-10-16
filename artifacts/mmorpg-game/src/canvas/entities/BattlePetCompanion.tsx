import { memo, useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { playCombatSFX } from "@/audio/CombatSoundSynth";

export const BattlePetCompanion = memo(function BattlePetCompanion() {
  const petActive = useGameWorldStore((s) => s.petActive);
  const playerPosition = useGameWorldStore((s) => s.playerPosition);
  const droppedLoot = useGameWorldStore((s) => s.droppedLoot);
  const pickUpLoot = useGameWorldStore((s) => s.pickUpLoot);
  const addFloatingText = useGameWorldStore((s) => s.addFloatingText);

  const petGroupRef = useRef<THREE.Group>(null);
  const currentPetPos = useRef(new THREE.Vector3(0, 1.8, 0));
  const isFetchingLoot = useRef(false);
  const targetLootPos = useRef(new THREE.Vector3());

  // Temp vectors to prevent GC
  const tempOffset = useMemo(() => new THREE.Vector3(), []);
  const tempLootPos = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    if (!petActive || !petGroupRef.current) return;
    const time = state.clock.getElapsedTime();
    const dt = Math.min(delta, 0.05);

    // ── 1. Auto-Magnet Scan for Dropped Loot within 6.0 meters ──
    let nearestLoot: any = null;
    let nearestDist = 6.0;

    for (const item of droppedLoot) {
      tempLootPos.set(item.position[0], item.position[1], item.position[2]);
      const dist = tempLootPos.distanceTo(playerPosition);
      if (dist <= nearestDist) {
        nearestDist = dist;
        nearestLoot = item;
      }
    }

    if (nearestLoot) {
      isFetchingLoot.current = true;
      targetLootPos.current.set(nearestLoot.position[0], nearestLoot.position[1] + 0.3, nearestLoot.position[2]);

      // Fly swiftly towards the loot
      currentPetPos.current.lerp(targetLootPos.current, dt * 10.0);

      // When close enough, absorb loot
      if (currentPetPos.current.distanceTo(targetLootPos.current) <= 0.8) {
        playCombatSFX("holy_bell", 0.3);
        addFloatingText(`✨ Pet Hút Đồ: ${nearestLoot.name}!`, currentPetPos.current.clone().add(new THREE.Vector3(0, 0.8, 0)), "#00f2ff");
        pickUpLoot(nearestLoot);
      }
    } else {
      isFetchingLoot.current = false;
      // Default companion position: floating smoothly over player's right shoulder
      const hoverY = Math.sin(time * 3.5) * 0.15;
      tempOffset.set(
        playerPosition.x + 0.9 + Math.cos(time * 1.5) * 0.15,
        playerPosition.y + 1.6 + hoverY,
        playerPosition.z - 0.4 + Math.sin(time * 1.5) * 0.15,
      );
      currentPetPos.current.lerp(tempOffset, dt * 6.0);
    }

    petGroupRef.current.position.copy(currentPetPos.current);
  });

  if (!petActive) return null;

  return (
    <group ref={petGroupRef}>
      {/* ── Soft Point Light Emission from Spirit Pet ── */}
      <pointLight color="#38bdf8" intensity={1.5} distance={3.5} />

      {/* ── Spirit Glowing Ring Halo ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.25, 0.38, 16]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── Spirit Body Billboard ── */}
      <Billboard follow={true}>
        {/* Core Glowing Orb */}
        <mesh>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color="#e0f2fe" />
        </mesh>

        {/* Outer Pulsing Corona */}
        <mesh>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial
            color="#0ea5e9"
            transparent
            opacity={0.45}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Cute Fairy Wings */}
        <group position={[-0.22, 0.08, 0]} rotation={[0, 0, 0.3]}>
          <mesh>
            <planeGeometry args={[0.22, 0.35]} />
            <meshBasicMaterial
              color="#7dd3fc"
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
        <group position={[0.22, 0.08, 0]} rotation={[0, 0, -0.3]}>
          <mesh>
            <planeGeometry args={[0.22, 0.35]} />
            <meshBasicMaterial
              color="#7dd3fc"
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      </Billboard>
    </group>
  );
});

