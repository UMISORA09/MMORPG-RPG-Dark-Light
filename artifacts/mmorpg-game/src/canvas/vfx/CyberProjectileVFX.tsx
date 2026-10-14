import { memo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export interface CyberProjectileVFXProps {
  position: [number, number, number] | THREE.Vector3;
  velocity: [number, number, number] | THREE.Vector3;
  primaryColor?: string;
  secondaryColor?: string;
  scale?: number;
  duration?: number;
  onHit?: () => void;
}

export const CyberProjectileVFX = memo(function CyberProjectileVFX({
  position,
  velocity,
  primaryColor = "#00f2ff",
  secondaryColor = "#38bdf8",
  scale = 1.0,
  duration = 1.5,
  onHit,
}: CyberProjectileVFXProps) {
  const meshRef = useRef<THREE.Group>(null);
  const currentPos = useRef(
    Array.isArray(position)
      ? new THREE.Vector3(...position)
      : position.clone()
  );
  const vel = useRef(
    Array.isArray(velocity)
      ? new THREE.Vector3(...velocity)
      : velocity.clone()
  );
  const lifeRef = useRef(duration);

  useFrame((_, delta) => {
    lifeRef.current -= delta;
    currentPos.current.addScaledVector(vel.current, delta);

    if (meshRef.current) {
      meshRef.current.position.copy(currentPos.current);
    }

    if (lifeRef.current <= 0 && onHit) {
      onHit();
    }
  });

  return (
    <group ref={meshRef} position={currentPos.current}>
      {/* Radiant Plasma Core */}
      <mesh>
        <sphereGeometry args={[0.22 * scale, 12, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Primary Cyber Energy Aura */}
      <mesh>
        <sphereGeometry args={[0.38 * scale, 12, 12]} />
        <meshBasicMaterial color={primaryColor} transparent opacity={0.8} />
      </mesh>

      {/* Trailing Tail Beam */}
      <mesh position={[-0.6 * scale, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08 * scale, 0.28 * scale, 1.2 * scale, 8]} />
        <meshBasicMaterial color={secondaryColor} transparent opacity={0.6} />
      </mesh>

      {/* Point Light Casting Realtime Illumination */}
      <pointLight color={primaryColor} intensity={2.5 * scale} distance={6 * scale} />
    </group>
  );
});
