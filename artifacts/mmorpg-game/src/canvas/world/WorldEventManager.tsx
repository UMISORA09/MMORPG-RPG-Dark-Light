// ==============================================================================
// WorldEventManager.tsx — Hệ Thống Sự Kiện Thế Giới Động (Dynamic World Events)
// 3 Sự kiện xoay vòng: Binh Đoàn Công Thành, Mưa Sao Băng Kho Báu & Hắc Long Vương Giáng Thế
// ==============================================================================

import { memo, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameWorldStore } from "@/stores/useGameWorldStore";

export const WorldEventManager = memo(function WorldEventManager() {
  const activeWorldEvent = useGameWorldStore((s) => s.activeWorldEvent);
  const worldEventTimer = useGameWorldStore((s) => s.worldEventTimer);
  const triggerWorldEvent = useGameWorldStore((s) => s.triggerWorldEvent);
  const clearWorldEvent = useGameWorldStore((s) => s.clearWorldEvent);

  const beaconGroupRef = useRef<THREE.Group>(null);
  const intervalTimerRef = useRef<number>(0);

  // Vòng lặp tự kích hoạt sự kiện ngẫu nhiên mỗi 4 phút nếu chưa có sự kiện nào
  useFrame((_, delta) => {
    if (activeWorldEvent) {
      const nextTimer = worldEventTimer - delta;
      if (nextTimer <= 0) {
        clearWorldEvent();
      } else {
        useGameWorldStore.setState({ worldEventTimer: nextTimer });
      }

      // Quay tia sáng chỉ điểm sự kiện
      if (beaconGroupRef.current) {
        beaconGroupRef.current.rotation.y += delta * 1.5;
      }
    } else {
      intervalTimerRef.current += delta;
      // Mỗi 240 giây (4 phút), tự kích hoạt 1 sự kiện ngẫu nhiên
      if (intervalTimerRef.current > 240) {
        intervalTimerRef.current = 0;
        const events: ("village_siege" | "meteor_shower" | "world_boss_invasion")[] = [
          "village_siege",
          "meteor_shower",
          "world_boss_invasion",
        ];
        const nextEv = events[Math.floor(Math.random() * events.length)];
        triggerWorldEvent(nextEv);
      }
    }
  });

  if (!activeWorldEvent) return null;

  const { targetPos, id } = activeWorldEvent;
  const beamColor = id === "world_boss_invasion" ? "#ef4444" : id === "meteor_shower" ? "#eab308" : "#8b5cf6";

  return (
    <group position={[targetPos.x, 0, targetPos.z]} ref={beaconGroupRef}>
      {/* Cột sáng vũ trụ định vị sự kiện */}
      <mesh position={[0, 15, 0]}>
        <cylinderGeometry args={[0.8, 2.5, 30, 16, 1, true]} />
        <meshBasicMaterial color={beamColor} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

      {/* Vòng hào quang mặt đất */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <ringGeometry args={[2.5, 3.8, 32]} />
        <meshBasicMaterial color={beamColor} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
});
