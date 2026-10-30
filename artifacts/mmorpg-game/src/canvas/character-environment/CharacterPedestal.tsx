import { memo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { PedestalConfig, PedestalThemeId } from "./types";

export const PEDESTAL_CONFIGS: Record<PedestalThemeId, PedestalConfig> = {
  dark_fantasy_runic: {
    id: "dark_fantasy_runic",
    name: "Bục Cổ Ngữ Long Hồn",
    radius: 1.4,
    height: 0.16,
    baseColor: "#14111d",
    runeGlowColor: "#ef4444",
    outerRingColor: "#f97316",
    particles: {
      color: "#ef4444",
      count: 24,
      speed: 0.4,
    },
  },
  cyberpunk_hologram: {
    id: "cyberpunk_hologram",
    name: "Bục Hologram Lượng Tử",
    radius: 1.35,
    height: 0.12,
    baseColor: "#0b192c",
    runeGlowColor: "#00f2ff",
    outerRingColor: "#38bdf8",
    particles: {
      color: "#00f2ff",
      count: 30,
      speed: 0.6,
    },
  },
  celestial_altar: {
    id: "celestial_altar",
    name: "Tế Đàn Hoàng Kim",
    radius: 1.45,
    height: 0.2,
    baseColor: "#1f1d16",
    runeGlowColor: "#fbbf24",
    outerRingColor: "#fde047",
    particles: {
      color: "#ffd700",
      count: 20,
      speed: 0.35,
    },
  },
  cosmic_void: {
    id: "cosmic_void",
    name: "Bục Tinh Thể Không Gian Hư Không",
    radius: 1.5,
    height: 0.18,
    baseColor: "#050515",
    runeGlowColor: "#00f2ff",
    outerRingColor: "#c084fc",
    particles: {
      color: "#38bdf8",
      count: 45,
      speed: 0.5,
    },
  },
  minimal_studio: {
    id: "minimal_studio",
    name: "Sàn Studio Tối Giản",
    radius: 1.5,
    height: 0.05,
    baseColor: "#1e293b",
    runeGlowColor: "#64748b",
    outerRingColor: "#94a3b8",
    particles: {
      color: "#94a3b8",
      count: 0,
      speed: 0.0,
    },
  },
};

interface CharacterPedestalProps {
  themeId?: PedestalThemeId;
}

export const CharacterPedestal = memo(function CharacterPedestal({
  themeId = "dark_fantasy_runic",
}: CharacterPedestalProps) {
  const config = PEDESTAL_CONFIGS[themeId] || PEDESTAL_CONFIGS.dark_fantasy_runic;

  const innerRuneRingRef = useRef<THREE.Mesh>(null);
  const outerPulseRingRef = useRef<THREE.Mesh>(null);
  const glowLightRef = useRef<THREE.PointLight>(null);
  const cosmicRing1Ref = useRef<THREE.Group>(null);
  const cosmicRing2Ref = useRef<THREE.Group>(null);
  const cosmicRing3Ref = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // Rotate inner rune disk slowly
    if (innerRuneRingRef.current) {
      innerRuneRingRef.current.rotation.z += delta * 0.25;
    }

    // Pulse outer halo
    if (outerPulseRingRef.current) {
      const pulse = 1.0 + Math.sin(time * 2.2) * 0.04;
      outerPulseRingRef.current.scale.set(pulse, pulse, 1);
    }

    // Light breathing effect
    if (glowLightRef.current) {
      glowLightRef.current.intensity = 1.2 + Math.sin(time * 2.5) * 0.4;
    }

    // Gyroscopic Cosmic Orbital Rings
    if (themeId === "cosmic_void") {
      if (cosmicRing1Ref.current) {
        cosmicRing1Ref.current.rotation.z += delta * 0.45;
        cosmicRing1Ref.current.rotation.y += delta * 0.2;
      }
      if (cosmicRing2Ref.current) {
        cosmicRing2Ref.current.rotation.z -= delta * 0.35;
        cosmicRing2Ref.current.rotation.x += delta * 0.25;
      }
      if (cosmicRing3Ref.current) {
        cosmicRing3Ref.current.rotation.y += delta * 0.5;
        cosmicRing3Ref.current.rotation.z += delta * 0.15;
      }
    }
  });

  return (
    <group position={[0, 0, 0]} name="character-pedestal">
      {/* ── Main Podium Cylinder ── */}
      <mesh position={[0, config.height / 2, 0]} receiveShadow>
        <cylinderGeometry
          args={[config.radius, config.radius * 1.06, config.height, 48]}
        />
        <meshStandardMaterial
          color={config.baseColor}
          metalness={0.65}
          roughness={0.35}
        />
      </mesh>

      {/* ── Outer Metallic Bevel Ring ── */}
      <mesh position={[0, config.height + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[config.radius * 0.94, config.radius, 48]} />
        <meshStandardMaterial
          color="#334155"
          metalness={0.85}
          roughness={0.2}
        />
      </mesh>

      {/* ── Inner Rotating Energy Runes ── */}
      <mesh
        ref={innerRuneRingRef}
        position={[0, config.height + 0.004, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[config.radius * 0.55, config.radius * 0.88, 36]} />
        <meshBasicMaterial
          color={config.runeGlowColor}
          wireframe
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* ── Outer Pulsing Energy Halo Ring ── */}
      <mesh
        ref={outerPulseRingRef}
        position={[0, config.height + 0.006, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[config.radius * 0.9, config.radius * 0.93, 48]} />
        <meshBasicMaterial
          color={config.outerRingColor}
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* ── Center Pedestal Point Light (Underlight Glow) ── */}
      <pointLight
        ref={glowLightRef}
        position={[0, config.height + 0.15, 0]}
        color={config.runeGlowColor}
        intensity={1.2}
        distance={3.0}
        decay={2}
      />

      {/* ── Soft Ground Contact Shadow Plate ── */}
      <mesh position={[0, -0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[config.radius * 3.2, config.radius * 3.2]} />
        <shadowMaterial opacity={0.5} />
      </mesh>

      {/* ── Cosmic Void Gyroscopic Planetary Rings & Orbs ── */}
      {themeId === "cosmic_void" && (
        <group position={[0, config.height + 0.8, 0]}>
          {/* Ring 1 (Tilted 35 deg with glowing sapphire satellite) */}
          <group ref={cosmicRing1Ref} rotation={[0.6, 0, 0.4]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <torusGeometry args={[config.radius * 1.35, 0.018, 16, 64]} />
              <meshStandardMaterial
                color="#00f2ff"
                emissive="#00f2ff"
                emissiveIntensity={0.8}
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
            {/* Satellite Moon 1 */}
            <mesh position={[config.radius * 1.35, 0, 0]}>
              <sphereGeometry args={[0.07, 16, 16]} />
              <meshStandardMaterial
                color="#38bdf8"
                emissive="#00f2ff"
                emissiveIntensity={1.2}
              />
            </mesh>
          </group>

          {/* Ring 2 (Tilted -45 deg with glowing astral purple satellite) */}
          <group ref={cosmicRing2Ref} rotation={[-0.8, 0.5, -0.2]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <torusGeometry args={[config.radius * 1.6, 0.015, 16, 64]} />
              <meshStandardMaterial
                color="#c084fc"
                emissive="#a855f7"
                emissiveIntensity={0.9}
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
            {/* Satellite Moon 2 */}
            <mesh position={[-config.radius * 1.6, 0, 0]}>
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshStandardMaterial
                color="#e879f9"
                emissive="#c084fc"
                emissiveIntensity={1.2}
              />
            </mesh>
          </group>

          {/* Ring 3 (Outer Horizon Ring) */}
          <group ref={cosmicRing3Ref} rotation={[0.2, -0.7, 0.9]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <torusGeometry args={[config.radius * 1.85, 0.012, 16, 64]} />
              <meshStandardMaterial
                color="#f43f5e"
                emissive="#f43f5e"
                emissiveIntensity={0.6}
                metalness={0.9}
                roughness={0.2}
              />
            </mesh>
          </group>
        </group>
      )}
    </group>
  );
});

