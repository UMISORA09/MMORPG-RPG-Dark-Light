import { memo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGameWorldStore, type WorldZone } from "@/stores/useGameWorldStore";
import { playCombatSFX } from "@/audio/CombatSoundSynth";

// ==============================================================================
// ZoneDetector: Real-time Coordinate Tracker, Zone Transition & Level Suppression
// ==============================================================================
// 1. Safe Zone: Làng Long Tộc (Center: [0, 0, 0], Radius < 21.5m)
// 2. Wilderness: Rừng Nguyên Sinh & Bãi Săn (Radius >= 21.5m, x <= 22m, z >= -45m)
// 3. Dead Marsh: Vùng Đất Chết & Đầm Lầy Hoang Dã (East Sector: x > 22m, z >= -45m)
// 4. Boss Altar / Dungeon: Cấm Địa & Hang Động Phó Bản (North Sector: z < -45m)
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
  const suppressionCheckTimer = useRef<number>(0);

  // Sync with store initial zone
  useEffect(() => {
    currentZoneRef.current = useGameWorldStore.getState().currentZone;
  }, []);

  useFrame((_, delta) => {
    const store = useGameWorldStore.getState();
    const playerPos = store.playerPosition;
    if (!playerPos) return;

    // Detect Active Zone
    let detectedZone: WorldZone;
    if (store.currentZone === "DUNGEON") {
      detectedZone = "DUNGEON";
    } else if (playerPos.z < -45) {
      detectedZone = "BOSS_ALTAR";
    } else {
      const distFromCenter = Math.hypot(playerPos.x, playerPos.z);
      if (distFromCenter < 21.5) {
        detectedZone = "SAFE_VILLAGE";
      } else if (playerPos.x > 22.0) {
        detectedZone = "DEAD_MARSH";
      } else {
        detectedZone = "WILDERNESS";
      }
    }

    // Check Zone Transition
    if (detectedZone !== currentZoneRef.current) {
      const oldZone = currentZoneRef.current;
      currentZoneRef.current = detectedZone;

      let soundPreset: "holy_bell" | "dragon_roar" | "blade_slash" = "blade_slash";
      let notif = "";

      switch (detectedZone) {
        case "SAFE_VILLAGE":
          soundPreset = "holy_bell";
          notif = "🛡️ Làng Long Tộc — Khu Vực An Toàn (Tự động hồi 5% HP/MP mỗi giây)";
          store.setWeather("SUNNY");
          break;
        case "DEAD_MARSH":
          soundPreset = "blade_slash";
          notif = "☠️ Vùng Đất Chết & Đầm Lầy Hoang Dã (Lv.6 - Lv.10) — Quái Tinh Anh!";
          store.setWeather("RAIN");
          break;
        case "BOSS_ALTAR":
          soundPreset = "dragon_roar";
          notif = "🔥 Cấm Địa Săn Boss — Rồng Lửa Cổ Đại Thức Tỉnh (Boss Lv.20)!";
          store.setWeather("BLOOD_MOON");
          break;
        case "DUNGEON":
          soundPreset = "dragon_roar";
          notif = "🏰 Hang Động Phó Bản — Quái Vật Tinh Anh & Phần Thưởng Hậu Hĩnh!";
          store.setWeather("BLOOD_MOON");
          break;
        case "WILDERNESS":
        default:
          soundPreset = "blade_slash";
          notif = "⚔️ Rừng Nguyên Sinh — Bãi Săn Tân Thủ (Lv.1 - Lv.5)";
          store.setWeather("SUNNY");
          break;
      }

      // Audio cue & Store update
      playCombatSFX(soundPreset, 0.45);
      store.setZone(detectedZone, notif);

      // Warning when entering a dangerous zone exceeding level
      const playerLevel = store.playerLevel || 1;
      let highestMonsterLv = 1;
      if (detectedZone === "SAFE_VILLAGE") highestMonsterLv = 0;
      else if (detectedZone === "WILDERNESS") highestMonsterLv = 5;
      else if (detectedZone === "DEAD_MARSH") highestMonsterLv = 10;
      else if (detectedZone === "BOSS_ALTAR" || detectedZone === "DUNGEON") highestMonsterLv = 15;

      if (highestMonsterLv > playerLevel + 3) {
        store.triggerZoneWarning(
          `⚠️ CẢNH BÁO: BẠN ĐANG TIẾN VÀO VÙNG NGUY HIỂM (QUÁI CẤP CAO - KHUYẾN NGHỊ LV.${highestMonsterLv})`
        );
        playCombatSFX("heavy_slam", 0.6);
      }

      if (onZoneChange) {
        onZoneChange(detectedZone, oldZone);
      }
    }

    // Level Suppression Periodic Check (every 0.5s)
    suppressionCheckTimer.current += delta;
    if (suppressionCheckTimer.current >= 0.5) {
      suppressionCheckTimer.current = 0;

      const playerLevel = store.playerLevel || 1;
      let highestMonsterLv = 1;

      if (detectedZone === "SAFE_VILLAGE") {
        highestMonsterLv = 0;
      } else if (detectedZone === "WILDERNESS") {
        highestMonsterLv = 5;
      } else if (detectedZone === "DEAD_MARSH") {
        highestMonsterLv = 10;
      } else if (detectedZone === "BOSS_ALTAR" || detectedZone === "DUNGEON") {
        highestMonsterLv = 15;
      }

      const isSuppressed = highestMonsterLv > playerLevel + 3;
      if (isSuppressed !== store.isLevelSuppressed) {
        store.setIsLevelSuppressed(isSuppressed);
        if (isSuppressed) {
          store.triggerZoneWarning(
            `⚠️ CẢNH BÁO: BẠN ĐANG TIẾN VÀO VÙNG NGUY HIỂM (QUÁI CẤP CAO - KHUYẾN NGHỊ LV.${highestMonsterLv})`
          );
        }
      }
    }

    // Boundary visual pulsation
    if (boundaryRingRef.current) {
      boundaryPulseRef.current += delta * 2;
      const scale = 1 + Math.sin(boundaryPulseRef.current) * 0.015;
      boundaryRingRef.current.scale.set(scale, scale, 1);
    }
  });

  return (
    <group>
      {/* Visual glowing rune ring on the safe zone boundary (r = 21.5m) */}
      {showBoundaryIndicator && (
        <group position={[0, 0.04, 0]}>
          <mesh ref={boundaryRingRef} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[21.2, 21.6, 64]} />
            <meshBasicMaterial
              color="#06b6d4"
              transparent
              opacity={0.55}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}
    </group>
  );
});

export default ZoneDetector;
