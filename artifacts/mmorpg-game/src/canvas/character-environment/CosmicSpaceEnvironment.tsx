import { memo, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface CosmicSpaceEnvironmentProps {
  enabled?: boolean;
}

export const CosmicSpaceEnvironment = memo(function CosmicSpaceEnvironment({
  enabled = true,
}: CosmicSpaceEnvironmentProps) {
  const starsGroupRef = useRef<THREE.Group>(null);
  const planetRef = useRef<THREE.Group>(null);
  const nebulaGroupRef = useRef<THREE.Group>(null);

  // Generate 1200 static/twinkling stars distributed in deep 3D sphere
  const [starPositions, starColors] = useMemo(() => {
    const count = 1200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const palette = [
      new THREE.Color("#ffffff"),
      new THREE.Color("#38bdf8"), // Cyan / Blue
      new THREE.Color("#c084fc"), // Astral Purple
      new THREE.Color("#fef08a"), // Solar Gold
      new THREE.Color("#f43f5e"), // Nebula Rose
    ];

    for (let i = 0; i < count; i++) {
      // Spherical distribution between 25 and 75 units away
      const radius = 25 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    return [positions, colors];
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // Very slow cosmic drift of the entire starfield
    if (starsGroupRef.current) {
      starsGroupRef.current.rotation.y += delta * 0.015;
      starsGroupRef.current.rotation.x = Math.sin(time * 0.05) * 0.03;
    }

    // Slow rotation of distant celestial gas giant
    if (planetRef.current) {
      planetRef.current.rotation.y += delta * 0.04;
    }

    // Nebula breathing
    if (nebulaGroupRef.current) {
      nebulaGroupRef.current.rotation.z += delta * 0.008;
    }
  });

  if (!enabled) return null;

  return (
    <group name="cosmic-space-environment">
      {/* ── 1. Infinite Deep 3D Starfield ── */}
      <group ref={starsGroupRef}>
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[starPositions, 3]}
            />
            <bufferAttribute
              attach="attributes-color"
              args={[starColors, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.65}
            vertexColors
            transparent
            opacity={0.88}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      </group>

      {/* ── 2. Distant Celestial Ringed Planet (Astral Horizon) ── */}
      <group ref={planetRef} position={[22, 14, -38]} rotation={[0.4, 0.2, 0.35]}>
        {/* Planet Core Sphere */}
        <mesh>
          <sphereGeometry args={[4.2, 32, 32]} />
          <meshStandardMaterial
            color="#1e1b4b"
            emissive="#312e81"
            emissiveIntensity={0.6}
            roughness={0.7}
            metalness={0.2}
          />
        </mesh>

        {/* Planet Atmosphere Rim Halo */}
        <mesh scale={[1.08, 1.08, 1.08]}>
          <sphereGeometry args={[4.2, 32, 32]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.25}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Planetary Rings */}
        <mesh rotation={[-Math.PI / 2.3, 0.2, 0]}>
          <ringGeometry args={[5.2, 8.8, 64]} />
          <meshBasicMaterial
            color="#818cf8"
            transparent
            opacity={0.45}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* ── 3. Distant Stellar Singularity / Pulsar Glow ── */}
      <group position={[-25, 18, -42]}>
        <mesh>
          <sphereGeometry args={[1.4, 16, 16]} />
          <meshBasicMaterial color="#00f2ff" />
        </mesh>
        <pointLight color="#00f2ff" intensity={3.5} distance={70} decay={2} />
      </group>

      {/* ── 4. Swirling Nebula Space Dust Clouds ── */}
      <group ref={nebulaGroupRef} position={[0, 6, -20]}>
        {/* Violet Nebula Cloud */}
        <mesh position={[-8, 4, -5]} rotation={[0, 0, 0.4]}>
          <planeGeometry args={[26, 18]} />
          <meshBasicMaterial
            color="#581c87"
            transparent
            opacity={0.16}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Cyan Space Aurora Cloud */}
        <mesh position={[10, -2, -8]} rotation={[0, 0, -0.3]}>
          <planeGeometry args={[28, 16]} />
          <meshBasicMaterial
            color="#083344"
            transparent
            opacity={0.22}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Rose/Magenta Starburst Nebula */}
        <mesh position={[2, 8, -12]} rotation={[0, 0, 0.7]}>
          <planeGeometry args={[22, 14]} />
          <meshBasicMaterial
            color="#831843"
            transparent
            opacity={0.14}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
});
