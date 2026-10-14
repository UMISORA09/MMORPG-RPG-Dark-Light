import { memo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGameWorldStore, type WorldZone } from "@/stores/useGameWorldStore";
import { playCombatSFX } from "@/audio/CombatSoundSynth";

// ==============================================================================
// ZoneDetector: Real-time Coordinate Tracker & Zone Transition Manager
// ==============================================================================
// 1. Safe Zone: Làng Long Tộc (Center: [0, 0, 0], Radius < 18m)
// 2. Wilderness: Đấu Trường Hoang Dã (Radius >= 18m and z >= -48m)
// 3. Boss Altar: Cấm Địa Săn Boss (North Sector: z < -48m)
// ==============================================================================

export interface ZoneDetectorProps {
  onZoneChange?: (newZone: WorldZone, oldZone: WorldZone) => void;
  showBoundaryIndicator?: boolean;
}

export const ZoneDetector = memo(function ZoneDetector({
  onZoneChange,
  showBoundaryIndicator = true,
}: ZoneDetectorProps) {
  const currentZoneRef = useRef<WorldZone>("SAFE_VILLAGE");
  const boundaryRingRef = useRef<THREE.Mesh>(null);
  const boundaryPulseRef = useRef<number>(0);

  // Sync with store initial zone
  useEffect(() => {
    currentZoneRef.current = useGameWorldStore.getState().currentZone;
  }, []);

  useFrame((_, delta) => {
    const playerPos = useGameWorldStore.getState().playerPosition;
    if (!playerPos) return;

    // Boundary check
    let detectedZone: WorldZone;
    if (playerPos.z < -48) {
      detectedZone = "BOSS_ALTAR";
    } else {
      const distFromCenter = Math.hypot(playerPos.x, playerPos.z);
      if (distFromCenter < 18) {
        detectedZone = "SAFE_VILLAGE";
      } else {
        detectedZone = "WILDERNESS";
      }
    }

    // Check transition
    if (detectedZone !== currentZoneRef.current) {
      const oldZone = currentZoneRef.current;
      currentZoneRef.current = detectedZone;

      // Determine audio & notification message
      let soundPreset: "holy_bell" | "dragon_roar" | "blade_slash" = "blade_slash";
      let notif = "";

      switch (detectedZone) {
        case "SAFE_VILLAGE":
          soundPreset = "holy_bell";
          notif = "🛡️ Làng Long Tộc — Khu Vực An Toàn (Tự động hồi máu 5%/giây)";
          break;
        case "BOSS_ALTAR":
          soundPreset = "dragon_roar";
          notif = "🔥 Cấm Địa Săn Boss — Rồng Lửa Cổ Đại Thức Tỉnh (Boss Cấp 20)!";
          break;
        case "WILDERNESS":
          soundPreset = "blade_slash";
          notif = "⚔️ Đấu Trường Hoang Dã — Vùng Nguy Hiểm (Quái vật lang thang)";
          break;
      }

      // Audio cue
      playCombatSFX(soundPreset, 0.45);

      // Store update
      useGameWorldStore.getState().setZone(detectedZone, notif);

      // External callback if provided
      if (onZoneChange) {
        onZoneChange(detectedZone, oldZone);
      }
    }

    // Boundary visual pulsation
    if (boundaryRingRef.current) {
      boundaryPulseRef.current += delta * 2;
      const scale = 1 + Math.sin(boundaryPulseRef.current) * 0.02;
      boundaryRingRef.current.scale.set(scale, scale, 1);
    }
  });

  return (
    <group>
      {/* Visual glowing rune ring on the safe zone boundary (r = 18m) */}
      {showBoundaryIndicator && (
        <group position={[0, 0.04, 0]}>
          <mesh ref={boundaryRingRef} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[17.85, 18.15, 64]} />
            <meshBasicMaterial
              color="#06b6d4"
              transparent
              opacity={0.45}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      )}
    </group>
  );
});

export default ZoneDetector;
