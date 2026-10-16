import { memo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useGameWorldStore } from "@/stores/useGameWorldStore";

export const QuestWaypointArrow = memo(function QuestWaypointArrow() {
  const trackedQuest = useGameWorldStore((s) => s.trackedQuest);
  const playerPosition = useGameWorldStore((s) => s.playerPosition);
  const arrowRef = useRef<THREE.Group>(null);
  const distDomRef = useRef<HTMLSpanElement>(null);

  useFrame(() => {
    if (!trackedQuest || !arrowRef.current) return;

    const targetX = trackedQuest.targetPosX ?? 0;
    const targetZ = trackedQuest.targetPosZ ?? -4;

    const dx = targetX - playerPosition.x;
    const dz = targetZ - playerPosition.z;
    const dist = Math.hypot(dx, dz);

    if (distDomRef.current) {
      distDomRef.current.innerText = `${Math.round(dist)}m`;
    }

    // Rotate arrow towards target on Y-axis
    const angle = Math.atan2(dx, dz);
    arrowRef.current.rotation.y = angle;
  });

  if (!trackedQuest) return null;

  return (
    <group position={[playerPosition.x, 0.08, playerPosition.z]}>
      {/* ── Rotating Compass Arrow under player's feet ── */}
      <group ref={arrowRef}>
        {/* Forward Pointer Cone / Chevron */}
        <mesh position={[0, 0, 1.4]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.35, 0.9, 16]} />
          <meshBasicMaterial
            color="#00f2ff"
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Tail Line */}
        <mesh position={[0, 0, 0.7]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.8, 8]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.7}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* ── Distance Indicator Tag ── */}
      <Html center position={[0, -0.4, 1.2]} style={{ pointerEvents: "none" }}>
        <div className="px-2 py-0.5 rounded-full bg-slate-950/80 border border-cyan-400 text-cyan-300 font-bold text-[10px] whitespace-nowrap shadow-[0_0_10px_rgba(0,242,255,0.4)] backdrop-blur-sm flex items-center gap-1">
          <span>📍 {trackedQuest.targetName || "Mục tiêu"}</span>
          <span>(</span>
          <span ref={distDomRef} className="font-mono font-bold text-amber-300">0m</span>
          <span>)</span>
        </div>
      </Html>
    </group>
  );
});

