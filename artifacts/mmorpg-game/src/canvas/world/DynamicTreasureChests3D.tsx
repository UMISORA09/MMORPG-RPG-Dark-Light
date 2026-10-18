// ==============================================================================
// 3D Dynamic Respawing Treasure Chests Visual Component (Chiến Long Bá MMORPG)
// Active Zone Culling, Hinged Lid Animation, Beacon Beams & [F] Interaction
// ==============================================================================

import { memo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGameWorldStore } from "@/stores/useGameWorldStore";
import {
  type ActiveTreasureChest,
  CHEST_TIER_CONFIGS,
} from "./TreasureChestSpawnerEngine";

export const DynamicTreasureChests3D = memo(function DynamicTreasureChests3D() {
  const activeChests = useGameWorldStore((s) => s.activeTreasureChests);
  const playerPosition = useGameWorldStore((s) => s.playerPosition);
  const openTreasureChestById = useGameWorldStore((s) => s.openTreasureChestById);
  const lastNearestIdRef = useRef<string | null>(null);

  useFrame(() => {
    let closestChest: ActiveTreasureChest | null = null;
    let minD = 3.5;

    for (const chest of activeChests) {
      if (chest.isOpened) continue;
      const d = Math.hypot(
        playerPosition.x - chest.position[0],
        playerPosition.z - chest.position[2]
      );
      if (d < minD) {
        minD = d;
        closestChest = chest;
      }
    }
    const closestId = closestChest ? closestChest.id : null;
    if (closestId !== lastNearestIdRef.current) {
      lastNearestIdRef.current = closestId;
      useGameWorldStore.getState().setNearbyTreasureChest(closestChest);
    }
  });

  // Handle interaction key 'F'
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyF" && !e.altKey && !e.ctrlKey && !e.metaKey) {
        // Prevent key conflict if typing in input
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea") return;

        const near = useGameWorldStore.getState().nearbyTreasureChest;
        if (near && !near.isOpened) {
          e.preventDefault();
          openTreasureChestById(near.id);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openTreasureChestById]);

  return (
    <group name="DynamicTreasureChestsLayer">
      {activeChests.map((chest) => (
        <SingleTreasureChest3D
          key={chest.id}
          chest={chest}
          onInteract={() => openTreasureChestById(chest.id)}
        />
      ))}
    </group>
  );
});

interface SingleChestProps {
  chest: ActiveTreasureChest;
  onInteract: () => void;
}

const SingleTreasureChest3D = memo(function SingleTreasureChest3D({
  chest,
  onInteract,
}: SingleChestProps) {
  const lidRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const cfg = CHEST_TIER_CONFIGS[chest.tier];

  useFrame((state, delta) => {
    // 1. Rotating foot aura ring
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * (chest.tier === "MIRACLE_CHEST" ? 1.5 : 0.8);
    }

    // 2. Beacon beam pulsing
    if (beamRef.current) {
      const pulse = 1.0 + Math.sin(state.clock.getElapsedTime() * 3.0) * 0.15;
      beamRef.current.scale.set(pulse, 1.0, pulse);
    }

    // 3. Smooth lid opening animation
    if (lidRef.current && chest.openProgress > 0) {
      // Rotate lid backward around hinge (X axis) up to -1.35 rad (~77 degrees)
      const targetAngle = -1.35 * Math.min(1.0, chest.openProgress);
      lidRef.current.rotation.x = THREE.MathUtils.lerp(
        lidRef.current.rotation.x,
        targetAngle,
        0.2
      );
    }
  });

  const [cx, cy, cz] = chest.position;
  const isMiracle = chest.tier === "MIRACLE_CHEST";
  const isGolden = chest.tier === "GOLDEN";

  return (
    <group position={[cx, cy, cz]}>
      {/* ── 1. CHEST BODY (BASE BOX) ── */}
      <mesh
        position={[0, 0.22, 0]}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onInteract();
        }}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <boxGeometry args={[0.9, 0.44, 0.6]} />
        <meshStandardMaterial
          color={chest.color}
          roughness={isMiracle ? 0.2 : isGolden ? 0.35 : 0.65}
          metalness={isMiracle ? 0.85 : isGolden ? 0.75 : 0.3}
          emissive={isMiracle ? "#ff007f" : isGolden ? "#b45309" : "#000000"}
          emissiveIntensity={isMiracle ? 0.45 : isGolden ? 0.25 : 0.0}
        />
      </mesh>

      {/* Decorative Gold Rim Bands */}
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[0.92, 0.46, 0.22]} />
        <meshStandardMaterial
          color={isMiracle ? "#ff2d75" : "#fbbf24"}
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* Front Lock Latch */}
      <mesh position={[0, 0.22, 0.31]}>
        <boxGeometry args={[0.12, 0.16, 0.04]} />
        <meshStandardMaterial
          color={isMiracle ? "#ff007f" : "#f59e0b"}
          metalness={0.95}
          roughness={0.15}
          emissive={isMiracle ? "#ff2d75" : "#f59e0b"}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* ── 2. HINGED LID (ROTATES BACKWARDS) ── */}
      {/* Hinge anchor placed at the back edge of the chest top: [0, 0.44, -0.3] */}
      <group ref={lidRef} position={[0, 0.44, -0.3]}>
        {/* Lid mesh centered relative to hinge pivot */}
        <mesh position={[0, 0.1, 0.3]} castShadow>
          <boxGeometry args={[0.94, 0.2, 0.64]} />
          <meshStandardMaterial
            color={chest.color}
            roughness={isMiracle ? 0.2 : isGolden ? 0.35 : 0.65}
            metalness={isMiracle ? 0.85 : isGolden ? 0.75 : 0.3}
            emissive={isMiracle ? "#ff2d75" : isGolden ? "#d97706" : "#000000"}
            emissiveIntensity={isMiracle ? 0.4 : isGolden ? 0.2 : 0.0}
          />
        </mesh>
      </group>

      {/* ── 3. ROTATING RARITY FOOT AURA RING ── */}
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.03, 0]}
      >
        <ringGeometry args={[0.75, 1.15, 32]} />
        <meshBasicMaterial
          color={chest.beamColor}
          transparent
          opacity={isMiracle ? 0.85 : 0.55}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── 4. VERTICAL BEACON BEAM (GOLDEN & MIRACLE CHESTS) ── */}
      {(isGolden || isMiracle) && (
        <mesh
          ref={beamRef}
          position={[0, chest.beamHeight / 2, 0]}
        >
          <cylinderGeometry args={[0.08, 0.32, chest.beamHeight, 16]} />
          <meshBasicMaterial
            color={chest.beamColor}
            transparent
            opacity={isMiracle ? 0.5 : 0.32}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* ── 5. POINT LIGHT ILLUMINATION ── */}
      <pointLight
        color={chest.beamColor}
        intensity={cfg.glowIntensity * 1.5}
        distance={6.5}
        decay={2}
        position={[0, 0.8, 0]}
      />

    </group>
  );
});
