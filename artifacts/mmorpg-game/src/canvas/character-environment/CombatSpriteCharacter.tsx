import { memo, useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { loadOrFallbackSpritesheet } from "../sprites/ProceduralSpriteFallback";
import type {
  CharacterClassId,
  CharacterGender,
  CharacterAnimationState,
} from "./types";

interface CombatSpriteCharacterProps {
  classId: CharacterClassId;
  gender?: CharacterGender;
  animState: CharacterAnimationState;
  facingLeft?: boolean;
}

const TOTAL_COLS = 8;
const TOTAL_ROWS = 9;

const CLASS_PALETTES: Record<CharacterClassId, { color: string; weapon: "sword" | "shield" | "daggers" | "gun" }> = {
  fighter: { color: "#f97316", weapon: "sword" },
  tank: { color: "#fbbf24", weapon: "shield" },
  assassin: { color: "#f43f5e", weapon: "daggers" },
  gunner: { color: "#00f2ff", weapon: "gun" },
  hero_base: { color: "#94a3b8", weapon: "sword" },
};

export const CombatSpriteCharacter = memo(function CombatSpriteCharacter({
  classId,
  gender = "male",
  animState,
  facingLeft = false,
}: CombatSpriteCharacterProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const shadowRef = useRef<THREE.Mesh>(null);

  const palette = CLASS_PALETTES[classId] || CLASS_PALETTES.fighter;

  // Row index mapping according to clb-combat-animation 9-row grid
  const rowIndex = useMemo(() => {
    switch (animState) {
      case "idle":
        return 0; // Row 0
      case "run":
        return 1; // Row 1
      case "attack_slash":
        return 3; // Row 3: attack1
      case "skill_cast":
        return 7; // Row 7: attack4 / ultimate
      case "death":
        return 8; // Row 8: death
      default:
        return 0;
    }
  }, [animState]);

  // Texture creation: Load authentic 9-row pixel combat sheet
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const sheetUrl = `/assets/sprites/${classId}_${gender}_combat_sheet.png`;
    const tex = loader.load(sheetUrl, undefined, undefined, () => {
      // Fallback if specific gender sheet fails
      loader.load(`/assets/sprites/${classId}_combat_sheet.png`, (fb) => {
        fb.magFilter = THREE.NearestFilter;
        fb.minFilter = THREE.NearestFilter;
        fb.generateMipmaps = false;
        fb.colorSpace = THREE.SRGBColorSpace;
        fb.wrapS = THREE.RepeatWrapping;
        fb.wrapT = THREE.RepeatWrapping;
        fb.repeat.set(1 / TOTAL_COLS, 1 / TOTAL_ROWS);
        tex.image = fb.image;
        tex.needsUpdate = true;
      });
    });

    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1 / TOTAL_COLS, 1 / TOTAL_ROWS);
    return tex;
  }, [classId, gender]);

  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  const frameTimer = useRef(0);
  const currentFrame = useRef(0);

  // Play animation frames
  useFrame((_, delta) => {
    const fps = animState === "attack_slash" || animState === "skill_cast" ? 14 : animState === "run" ? 12 : 8;
    const interval = 1 / fps;

    frameTimer.current += delta;
    if (frameTimer.current >= interval) {
      frameTimer.current = 0;
      if (animState === "death" && currentFrame.current >= TOTAL_COLS - 1) {
        currentFrame.current = TOTAL_COLS - 1; // Clamp at last frame for death
      } else {
        currentFrame.current = (currentFrame.current + 1) % TOTAL_COLS;
      }

      // UV coordinates in Three.js (0,0 is bottom-left, row 0 is top)
      const uOffset = currentFrame.current * (1 / TOTAL_COLS);
      const vOffset = (TOTAL_ROWS - 1 - rowIndex) * (1 / TOTAL_ROWS);

      texture.offset.set(uOffset, vOffset);
      if (facingLeft) {
        texture.repeat.x = -1 / TOTAL_COLS;
        texture.offset.x = (currentFrame.current + 1) * (1 / TOTAL_COLS);
      } else {
        texture.repeat.x = 1 / TOTAL_COLS;
      }
    }
  });

  return (
    <group position={[0, 0, 0]} name="combat-sprite-character-25d">
      {/* ── Drop Shadow ── */}
      <mesh
        ref={shadowRef}
        position={[0, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[0.38, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.4} />
      </mesh>

      {/* ── Animated 64x64 Pixel Frame Quad ── */}
      <mesh
        ref={meshRef}
        position={[0, 0.95, 0]}
        castShadow
        receiveShadow
      >
        <planeGeometry args={[1.9, 1.9]} />
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.05}
          roughness={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
});

