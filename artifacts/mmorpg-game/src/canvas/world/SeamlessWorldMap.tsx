// ==============================================================================
// 3 Seamless Interconnected Zones in 1 Scene
// Zone 1: Safe Village (r < 18m) — Ancient Carved Dragon Plaza & Healing Fountain
// Zone 2: Wilderness Arena (18m <= r < 50m) — Night Indigo Grass & Glowing Crystals
// Zone 3: Boss Raid Altar (z < -48m) — Obsidian Arena with Molten Lava Veins
// ==============================================================================

import { memo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { SpriteBillboard25D } from "../sprites/SpriteBillboard25D";
import { ZoneDetector } from "./ZoneDetector";
import { ProceduralTerrain } from "./ProceduralTerrain";
import { WorldAtmosphere } from "./WorldAtmosphere";
import { WorldEnvironmentProps } from "./WorldEnvironmentProps";
import { useGameStore } from "@/game/useGameStore";
import { useGameWorldStore } from "@/stores/useGameWorldStore";

export const SeamlessWorldMap = memo(function SeamlessWorldMap() {
  const bossRingRef = useRef<THREE.Mesh>(null);
  const portalRuneRef = useRef<THREE.Mesh>(null);

  const openModal = (modal: "shop" | "leaderboard") => {
    useGameWorldStore.getState().setActiveModal(modal);
    useGameStore.getState().setActiveModal(modal);
  };

  // Rotating Magic Runes at Boss Altar
  useFrame((_, delta) => {
    if (bossRingRef.current) {
      bossRingRef.current.rotation.z += delta * 0.35;
    }
    if (portalRuneRef.current) {
      portalRuneRef.current.rotation.z -= delta * 0.22;
    }
  });

  return (
    <group>
      {/* ── 1. PROCEDURAL BIOME BLENDED GROUND TERRAIN ── */}
      <ProceduralTerrain />

      {/* ── 2. CINEMATIC ATMOSPHERE, LIGHTING & SPARKLES ── */}
      <WorldAtmosphere />

      {/* ── 3. INSTANCED ENVIRONMENT PROPS (GATES, LANTERNS, BRIDGE, OBELISKS) ── */}
      <WorldEnvironmentProps />

      {/* ── 4. REAL-TIME ZONE DETECTOR (AUDIO & HUD ANNOUNCEMENTS) ── */}
      <ZoneDetector />

      {/* ── 5. VILLAGE INTERACTIVE NPCS ── */}
      {/* Safe Zone Boundary Ring Decal (Z-Fighting Free) */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[17.6, 18.2, 48]} />
        <meshBasicMaterial
          color="#00f2ff"
          transparent
          opacity={0.5}
          depthWrite={false}
          polygonOffset={true}
          polygonOffsetFactor={-1}
        />
      </mesh>

      {/* NPC 1: Thương Gia Long Tộc (Opens Shop Modal) */}
      <group position={[-7, 0, -4]}>
        <SpriteBillboard25D
          position={[0, 0, 0]}
          textureKey="npc_shop"
          color="#f59e0b"
          secondaryColor="#fbbf24"
          weaponType="shield"
          name="🪙 Thương Nhân Bảo Khố"
          level={99}
          hp={9999}
          maxHp={9999}
          onClick={() => openModal("shop")}
        />
        <Text
          position={[0, 2.9, 0]}
          fontSize={0.24}
          color="#fbbf24"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#000"
        >
          [Bấm chuột hoặc phím P: Cửa Hàng]
        </Text>
      </group>

      {/* NPC 2: Bia Vinh Danh Long Tộc (Opens Leaderboard Modal) */}
      <group position={[7, 0, -4]}>
        <SpriteBillboard25D
          position={[0, 0, 0]}
          textureKey="npc_leaderboard"
          color="#a855f7"
          secondaryColor="#c084fc"
          weaponType="sword"
          name="🏆 Đại Sứ Vinh Danh"
          level={99}
          hp={9999}
          maxHp={9999}
          onClick={() => openModal("leaderboard")}
        />
        <Text
          position={[0, 2.9, 0]}
          fontSize={0.24}
          color="#c084fc"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#000"
        >
          [Bấm chuột hoặc phím L/O: Vinh Danh]
        </Text>
      </group>

      {/* NPC 3: Trưởng Lão Làng Long Tộc */}
      <group position={[0, 0, -7.5]}>
        <SpriteBillboard25D
          position={[0, 0, 0]}
          textureKey="npc_elder"
          color="#10b981"
          secondaryColor="#34d399"
          weaponType="gun"
          name="📜 Trưởng Lão Làng"
          level={100}
          hp={9999}
          maxHp={9999}
        />
      </group>

      {/* ── 6. BOSS ALTAR RUNIC SEALS (Z-FIGHTING FREE AT Y = 0.05) ── */}
      <group position={[0, 0, -70]}>
        {/* Spinning Fiery Magic Rune Ring */}
        <mesh
          ref={bossRingRef}
          position={[0, 0.045, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[8.5, 14.5, 36]} />
          <meshBasicMaterial
            color="#ff2244"
            transparent
            opacity={0.65}
            depthWrite={false}
            polygonOffset={true}
            polygonOffsetFactor={-1}
          />
        </mesh>

        {/* Inner Dragon Seal Pentagram */}
        <mesh
          ref={portalRuneRef}
          position={[0, 0.055, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[5.2, 6]} />
          <meshBasicMaterial
            color="#a855f7"
            transparent
            opacity={0.5}
            wireframe
            depthWrite={false}
            polygonOffset={true}
            polygonOffsetFactor={-1}
          />
        </mesh>

        {/* Ambient Boss Altar Red Core Point Light */}
        <pointLight position={[0, 4.0, 0]} color="#ef4444" intensity={5.0} distance={35} />
      </group>
    </group>
  );
});
