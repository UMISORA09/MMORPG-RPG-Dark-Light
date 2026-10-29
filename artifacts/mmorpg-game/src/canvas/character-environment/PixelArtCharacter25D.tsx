import { memo, useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useCharacterStudioStore } from "./useCharacterStudioStore";
import type {
  CharacterClassId,
  CharacterGender,
  CharacterAnimationState,
} from "./types";

interface PixelArtCharacter25DProps {
  classId: CharacterClassId;
  gender: CharacterGender;
  animState: CharacterAnimationState;
  facingLeft?: boolean;
}

const CHARACTER_ASSET_PATHS: Record<string, { male: string; female: string }> = {
  tank: {
    male: "/assets/characters/tank_male.png",
    female: "/assets/characters/tank_female.png",
  },
  fighter: {
    male: "/assets/characters/fighter_male.png",
    female: "/assets/characters/fighter_female.png",
  },
  assassin: {
    male: "/assets/characters/assassin_male.png",
    female: "/assets/characters/assassin_female.png",
  },
  gunner: {
    male: "/assets/characters/gunner_male.png",
    female: "/assets/characters/gunner_female.png",
  },
  hero_base: {
    male: "/assets/characters/fighter_male.png",
    female: "/assets/characters/fighter_female.png",
  },
};

const CLASS_AURA_COLORS: Record<CharacterClassId, { glow: string; rune: string }> = {
  fighter: { glow: "#ef4444", rune: "#f59e0b" },
  tank: { glow: "#f59e0b", rune: "#ffd700" },
  assassin: { glow: "#a855f7", rune: "#ec4899" },
  gunner: { glow: "#00f2ff", rune: "#38bdf8" },
  hero_base: { glow: "#94a3b8", rune: "#cbd5e1" },
};

export const PixelArtCharacter25D = memo(function PixelArtCharacter25D({
  classId,
  gender,
  animState,
  facingLeft = false,
}: PixelArtCharacter25DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const auraHaloRef = useRef<THREE.Mesh>(null);

  const isCustomActive = useCharacterStudioStore((s) => s.isCustomActive);
  const customStandeeUrl = useCharacterStudioStore((s) => s.customStandeeUrl);

  const aura = CLASS_AURA_COLORS[classId] || CLASS_AURA_COLORS.fighter;
  const imagePath =
    isCustomActive && customStandeeUrl
      ? customStandeeUrl
      : CHARACTER_ASSET_PATHS[classId]?.[gender] ||
        CHARACTER_ASSET_PATHS.fighter.male;

  // Load texture with NearestFilter for crisp pixel precision
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load(imagePath);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [imagePath]);

  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    if (meshRef.current) {
      // ── Fluid Pixel Art Animation Dynamics ──
      if (animState === "idle") {
        // Subtle breathing bounce (head/chest rising)
        const breath = Math.sin(t * 3.5) * 0.035;
        meshRef.current.position.y = 1.05 + breath;
        meshRef.current.scale.y = 1.0 + Math.sin(t * 3.5) * 0.012;
        meshRef.current.rotation.z = Math.sin(t * 1.8) * 0.015;
      } else if (animState === "run") {
        // Fast running step bounce & forward tilt
        const runBounce = Math.abs(Math.sin(t * 12.0)) * 0.08;
        meshRef.current.position.y = 1.05 + runBounce;
        meshRef.current.rotation.z = Math.sin(t * 12.0) * 0.05;
      } else if (animState === "attack_slash") {
        // Slash dash forward & recoil
        const slash = Math.sin(t * 16.0) * 0.12;
        meshRef.current.position.y = 1.02;
        meshRef.current.position.z = slash;
        meshRef.current.rotation.z = -slash * 0.3;
      } else if (animState === "skill_cast") {
        // Skill charge pulse
        const charge = Math.sin(t * 8.0) * 0.06;
        meshRef.current.position.y = 1.08 + charge;
        meshRef.current.scale.set(
          (facingLeft ? -1 : 1) * (1.0 + charge * 0.5),
          1.0 + charge * 0.5,
          1
        );
      } else if (animState === "death") {
        // Fall to the ground
        meshRef.current.rotation.z = THREE.MathUtils.lerp(
          meshRef.current.rotation.z,
          Math.PI / 2.2,
          0.1
        );
        meshRef.current.position.y = THREE.MathUtils.lerp(
          meshRef.current.position.y,
          0.2,
          0.1
        );
      }

      // Horizontal flip based on facing
      if (animState !== "skill_cast") {
        meshRef.current.scale.x = facingLeft ? -1 : 1;
      }
    }

    // Foot aura rotation
    if (auraHaloRef.current) {
      auraHaloRef.current.rotation.z += delta * 1.2;
    }

    // Drop shadow pulse
    if (shadowRef.current) {
      const breath = 1.0 - (meshRef.current?.position.y || 1.05 - 1.05) * 0.4;
      shadowRef.current.scale.set(breath, breath, 1);
    }
  });

  return (
    <group position={[0, 0, 0]} name="pixel-art-character-25d">
      {/* ── Foot Elemental Pixel Halo Ring ── */}
      <mesh
        ref={auraHaloRef}
        position={[0, 0.015, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.55, 0.72, 32]} />
        <meshBasicMaterial
          color={aura.rune}
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── Oval Pixel Drop Shadow (Bóng đổ pixel dẹt chuẩn skill clb-character-art-style) ── */}
      <mesh
        ref={shadowRef}
        position={[0, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[0.42, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.42} />
      </mesh>

      {/* ── Main HD Pixel Art Sprite Plane (360x360 Nearest-Neighbor Texture) ── */}
      <mesh
        ref={meshRef}
        position={[0, 1.05, 0]}
        castShadow
        receiveShadow
      >
        <planeGeometry args={[2.0, 2.0]} />
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.05}
          roughness={0.8}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
});

