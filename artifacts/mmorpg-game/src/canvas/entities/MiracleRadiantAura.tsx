// ==============================================================================
// Hiệu Ứng Hào Quang Ánh Sáng Hồng Tím Rực Rỡ — Phẩm Chất Tối Cao Kì Tích (Miracle)
// Radiant Rose-Purple & Shimmering Pink-Gold Celestial Aura
// ==============================================================================

import { memo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface MiracleRadiantAuraProps {
  position: THREE.Vector3;
}

export const MiracleRadiantAura = memo(function MiracleRadiantAura({
  position,
}: MiracleRadiantAuraProps) {
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const pillarRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    if (outerRingRef.current) {
      outerRingRef.current.rotation.z += delta * 1.8;
      const scale = 1.0 + Math.sin(time * 3.0) * 0.08;
      outerRingRef.current.scale.set(scale, scale, 1);
    }

    if (innerRingRef.current) {
      innerRingRef.current.rotation.z -= delta * 2.6;
    }

    if (pillarRef.current) {
      pillarRef.current.rotation.y += delta * 1.2;
    }

    if (lightRef.current) {
      lightRef.current.intensity = 2.8 + Math.sin(time * 4.0) * 0.8;
    }
  });

  return (
    <group position={[position.x, position.y + 0.05, position.z]}>
      {/* ── 1. Pulsating Radiant Light (Hồng Tím Ánh Kim) ── */}
      <pointLight ref={lightRef} color="#ff007f" intensity={3.0} distance={7.5} />

      {/* ── 2. Outer Rotating Miracle Petal Ring ── */}
      <mesh ref={outerRingRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.1, 1.55, 32]} />
        <meshBasicMaterial
          color="#ff2d75"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* ── 3. Inner Counter-Rotating Celestial Gold-Pink Ring ── */}
      <mesh ref={innerRingRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.7, 1.05, 24]} />
        <meshBasicMaterial
          color="#ffd166"
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* ── 4. Vertical Radiant Soft Light Pillar ── */}
      <mesh ref={pillarRef} position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.45, 0.75, 2.0, 16, 1, true]} />
        <meshBasicMaterial
          color="#ff007f"
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
});
