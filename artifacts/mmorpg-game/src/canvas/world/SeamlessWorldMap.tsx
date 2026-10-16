// ==============================================================================
// 3 Seamless Interconnected Zones in 1 Scene
// Zone 1: Safe Village (r < 18m) — Ancient Carved Dragon Plaza & Healing Fountain
// Zone 2: Wilderness Arena (18m <= r < 50m) — Night Indigo Grass & Glowing Crystals
// Zone 3: Boss Raid Altar (z < -48m) — Obsidian Arena with Molten Lava Veins
// ==============================================================================

import { memo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { SpriteBillboard25D } from "../sprites/SpriteBillboard25D";
import { ZoneDetector } from "./ZoneDetector";
import { ProceduralTerrain } from "./ProceduralTerrain";
import { WorldAtmosphere } from "./WorldAtmosphere";
import { WorldEnvironmentProps } from "./WorldEnvironmentProps";
import { PixelWorldEnvironmentProps } from "./PixelWorldEnvironmentProps";
import { DynamicWeatherSystem } from "./DynamicWeatherSystem";
import { NPCEntities } from "./NPCEntities";
import { QuestWaypointArrow } from "./QuestWaypointArrow";
import { MultiplayerSyncManager } from "./MultiplayerSyncManager";
import { PvPCombatArena } from "./PvPCombatArena";
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

      {/* ── 2.5 DYNAMIC WEATHER SYSTEM (SUNNY STARDUST, HEAVY RAIN & BLOOD MOON) ── */}
      <DynamicWeatherSystem />

      {/* ── 3. PIXEL ART ENVIRONMENTAL PROPS (ANCIENT TREES, FALLING LEAVES, GROUNDED ROCKS, GRASS TUFTS) ── */}
      <PixelWorldEnvironmentProps />

      {/* ── 4. INSTANCED ENVIRONMENT PROPS (GATES, LANTERNS, BRIDGE, OBELISKS) ── */}
      <WorldEnvironmentProps />

      {/* ── 5. REAL-TIME ZONE DETECTOR (AUDIO & HUD ANNOUNCEMENTS) ── */}
      <ZoneDetector />

      {/* ── 6. VILLAGE INTERACTIVE NPCS & SANCTUARY BOUNDARY ── */}
      {/* Safe Zone Boundary Ring Decal (r = 21.5m, Z-Fighting Free) */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[21.2, 21.8, 64]} />
        <meshBasicMaterial
          color="#00f2ff"
          transparent
          opacity={0.45}
          depthWrite={false}
          polygonOffset={true}
          polygonOffsetFactor={-1}
        />
      </mesh>

      {/* ── 6. VILLAGE INTERACTIVE NPCS & QUEST GIVERS ── */}
      <NPCEntities />

      {/* ── 7. 3D COMPASS QUEST WAYPOINT ARROW ── */}
      <QuestWaypointArrow />

      {/* ── 8. REAL-TIME MULTIPLAYER SYNC & REMOTE PLAYERS ── */}
      <MultiplayerSyncManager />

      {/* ── 9. RANKED 1v1 PVP DUEL COMBAT ARENA ── */}
      <PvPCombatArena />

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
