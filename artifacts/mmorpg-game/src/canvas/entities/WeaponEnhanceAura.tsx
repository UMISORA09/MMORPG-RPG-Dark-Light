import { memo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface WeaponEnhanceAuraProps {
  enhanceLevel: number;
  position: THREE.Vector3;
}

export const WeaponEnhanceAura = memo(function WeaponEnhanceAura({
  enhanceLevel,
  position,
}: WeaponEnhanceAuraProps) {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += delta * 1.5;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z -= delta * 2.2;
    }
  });

  if (!enhanceLevel || enhanceLevel < 7) return null;

  // Level 13-15: Dragon Fire & Golden Embers
  if (enhanceLevel >= 13) {
    return (
      <group position={[position.x, position.y + 0.08, position.z]}>
        <pointLight color="#ff5500" intensity={2.8} distance={5.0} />

        {/* Dragon Fire Rotating Runic Ring */}
        <mesh ref={ring1Ref} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.0, 1.35, 32]} />
          <meshBasicMaterial
            color="#ffaa00"
            transparent
            opacity={0.65}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Inner Counter-Rotating Flame Ring */}
        <mesh ref={ring2Ref} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.65, 0.95, 24]} />
          <meshBasicMaterial
            color="#ff3366"
            transparent
            opacity={0.55}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>
    );
  }

  // Level 10-12: Lightning Purple Sparks
  if (enhanceLevel >= 10) {
    return (
      <group position={[position.x, position.y + 0.06, position.z]}>
        <pointLight color="#a855f7" intensity={2.0} distance={4.0} />

        <mesh ref={ring1Ref} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 1.2, 24]} />
          <meshBasicMaterial
            color="#c084fc"
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>
    );
  }

  // Level 7-9: Radiant Ice Cyan Glow
  return (
    <group position={[position.x, position.y + 0.05, position.z]}>
      <pointLight color="#00f2ff" intensity={1.5} distance={3.5} />

      <mesh ref={ring1Ref} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1.05, 24]} />
        <meshBasicMaterial
          color="#00f2ff"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
});

