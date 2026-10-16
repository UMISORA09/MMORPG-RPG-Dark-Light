import { memo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import { useGameWorldStore } from "@/stores/useGameWorldStore";

interface MountVisual25DProps {
  position: THREE.Vector3;
  facingLeft: boolean;
  isRunning: boolean;
}

export const MountVisual25D = memo(function MountVisual25D({
  position,
  facingLeft,
  isRunning,
}: MountVisual25DProps) {
  const activeMountId = useGameWorldStore((s) => s.activeMountId);
  const mountGroupRef = useRef<THREE.Group>(null);
  const dustParticlesRef = useRef<THREE.Points>(null);

  const mountConfig = {
    shadow_steed: {
      name: "Chiến Mã Hắc Ám",
      bodyColor: "#1e1b4b",
      accentColor: "#a855f7",
      auraColor: "#c084fc",
      emoji: "🐎",
      size: 1.5,
    },
    frost_wolf: {
      name: "Sói Băng Tốc Hướng",
      bodyColor: "#082f49",
      accentColor: "#38bdf8",
      auraColor: "#7dd3fc",
      emoji: "🐺",
      size: 1.6,
    },
    dragon_beast: {
      name: "Hỏa Long Thần Thú",
      bodyColor: "#450a0a",
      accentColor: "#f97316",
      auraColor: "#fbbf24",
      emoji: "🐉",
      size: 1.8,
    },
  }[activeMountId || "shadow_steed"];

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    if (!mountGroupRef.current) return;

    // Gallop bobbing motion when running, gentle breathing when standing
    if (isRunning) {
      const gallop = Math.abs(Math.sin(time * 12)) * 0.18;
      mountGroupRef.current.position.y = gallop;
      mountGroupRef.current.rotation.z = Math.sin(time * 12) * 0.08 * (facingLeft ? -1 : 1);
    } else {
      mountGroupRef.current.position.y = Math.sin(time * 2.5) * 0.04;
      mountGroupRef.current.rotation.z = 0;
    }

    // Dust particles drift backwards when moving
    if (dustParticlesRef.current && isRunning) {
      dustParticlesRef.current.rotation.y += delta * 3;
    }
  });

  return (
    <group position={[position.x, position.y - 0.25, position.z]}>
      {/* ── Ground Glowing Mount Pedestal ── */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.25, 32]} />
        <meshBasicMaterial
          color={mountConfig.auraColor}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>

      {/* ── Running Dust Trail ── */}
      {isRunning && (
        <group position={[facingLeft ? 0.6 : -0.6, 0.15, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.35, 8]} />
            <meshBasicMaterial
              color="#fbbf24"
              transparent
              opacity={0.25}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}

      {/* ── 2.5D Mount Body Billboard ── */}
      <group ref={mountGroupRef}>
        <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
          <group scale={[facingLeft ? -1 : 1, 1, 1]}>
            {/* Mount Aura Sprite Backing */}
            <mesh position={[0, 0.45, -0.05]}>
              <planeGeometry args={[1.7, 1.3]} />
              <meshBasicMaterial
                color={mountConfig.accentColor}
                transparent
                opacity={0.35}
                depthWrite={false}
              />
            </mesh>

            {/* Mount Base Shadow */}
            <mesh position={[0, 0.1, -0.02]}>
              <ellipseCurve args={[0, 0, 0.8, 0.35, 0, 2 * Math.PI, false, 0]} />
            </mesh>

            {/* Mount Creature Representation */}
            <mesh position={[0, 0.5, 0]}>
              <planeGeometry args={[1.5, 1.1]} />
              <meshBasicMaterial
                color={mountConfig.bodyColor}
                transparent
                opacity={0.85}
              />
            </mesh>

            {/* Glowing Eyes / Runes on Mount */}
            <mesh position={[0.4, 0.65, 0.02]}>
              <circleGeometry args={[0.08, 12]} />
              <meshBasicMaterial color={mountConfig.auraColor} />
            </mesh>
            <mesh position={[0.2, 0.65, 0.02]}>
              <circleGeometry args={[0.06, 12]} />
              <meshBasicMaterial color={mountConfig.auraColor} />
            </mesh>
          </group>
        </Billboard>
      </group>
    </group>
  );
});

