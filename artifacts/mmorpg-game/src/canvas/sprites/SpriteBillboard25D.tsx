import { memo, useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import { loadOrFallbackSpritesheet } from "./ProceduralSpriteFallback";

export type EntityAnimationState =
  | "idle"
  | "walk"
  | "run"
  | "jump"
  | "fall"
  | "attack"
  | "attack1"
  | "attack2"
  | "attack3"
  | "attack4"
  | "air_attack"
  | "hurt"
  | "death";

export interface SpriteBillboard25DProps {
  position: [number, number, number] | THREE.Vector3;
  state?: EntityAnimationState;
  facingLeft?: boolean;
  width?: number;
  height?: number;
  textureKey: string;
  customTexture?: THREE.Texture | null;
  color?: string;
  secondaryColor?: string;
  weaponType?: "gun" | "daggers" | "sword" | "shield" | "claws" | "dragon";
  name?: string;
  level?: number;
  hp: number;
  maxHp: number;
  isBoss?: boolean;
  isPlayer?: boolean;
  isInvincible?: boolean;
  onClick?: () => void;
}

const TOTAL_COLS = 8;
const TOTAL_ROWS = 9;

export const SpriteBillboard25D = memo(function SpriteBillboard25D({
  position,
  state = "idle",
  facingLeft = false,
  width,
  height,
  textureKey,
  customTexture,
  color = "#38bdf8",
  secondaryColor = "#ffffff",
  weaponType = "sword",
  name,
  level,
  hp,
  maxHp,
  isBoss = false,
  isPlayer = false,
  isInvincible = false,
  onClick,
}: SpriteBillboard25DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  // Computed dimensions
  const entityWidth = width ?? (isBoss ? 4.2 : 2.2);
  const entityHeight = height ?? (isBoss ? 4.2 : 2.2);

  // Obtain or generate procedural or combat spritesheet
  const baseTexture = useMemo(() => {
    if (customTexture) return customTexture;
    return loadOrFallbackSpritesheet({
      key: textureKey,
      color,
      secondaryColor,
      weaponType,
      isBoss,
    });
  }, [customTexture, textureKey, color, secondaryColor, weaponType, isBoss]);

  // Clone texture to have independent UV offset & repeat per instance
  const texture = useMemo(() => {
    const cloned = baseTexture.clone();
    cloned.magFilter = THREE.NearestFilter;
    cloned.minFilter = THREE.NearestFilter;
    cloned.generateMipmaps = false;
    cloned.colorSpace = THREE.SRGBColorSpace;
    cloned.wrapS = THREE.RepeatWrapping;
    cloned.wrapT = THREE.RepeatWrapping;
    cloned.repeat.set(1 / TOTAL_COLS, 1 / TOTAL_ROWS);
    cloned.needsUpdate = true;
    return cloned;
  }, [baseTexture]);

  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  // Frame timing state
  const frameTimer = useRef(0);
  const currentFrame = useRef(0);

  // UV row mapping for 9-row combat sheet:
  // Row 0: Idle, Row 1: Walk/Run, Row 2: Jump/Fall, Row 3: Attack 1, Row 4: Attack 2,
  // Row 5: Air Attack, Row 6: Attack 3, Row 7: Attack 4, Row 8: Death / Hurt
  const rowIndex = useMemo(() => {
    switch (state) {
      case "idle":
        return 0;
      case "walk":
      case "run":
        return 1;
      case "jump":
      case "fall":
        return 2;
      case "attack":
      case "attack1":
        return 3;
      case "attack2":
        return 4;
      case "air_attack":
        return 5;
      case "attack3":
        return 6;
      case "attack4":
        return 7;
      case "death":
      case "hurt":
        return 8;
      default:
        return 0;
    }
  }, [state]);

  useFrame((_, delta) => {
    // Animation frame advancement FPS tuning
    const fps =
      state === "run" || state === "walk"
        ? 12
        : state.startsWith("attack") || state === "air_attack"
        ? 14
        : state === "death"
        ? 8
        : 8;
    frameTimer.current += delta;

    if (frameTimer.current >= 1 / fps) {
      frameTimer.current = 0;
      currentFrame.current = (currentFrame.current + 1) % TOTAL_COLS;

      const col = currentFrame.current;
      const uStep = 1 / TOTAL_COLS;
      const vStep = 1 / TOTAL_ROWS;

      // In Three.js, UV origin (0, 0) is bottom-left
      // Row 0 is at top -> vOffset = (TOTAL_ROWS - 1 - rowIndex) * vStep
      const vOffset = (TOTAL_ROWS - 1 - rowIndex) * vStep;

      if (facingLeft) {
        texture.repeat.x = -uStep;
        texture.offset.x = (col + 1) * uStep;
      } else {
        texture.repeat.x = uStep;
        texture.offset.x = col * uStep;
      }

      texture.offset.y = vOffset;
    }

    // Hurt flashing emissive effect
    if (materialRef.current) {
      if (state === "hurt" || isInvincible) {
        materialRef.current.emissive.set("#ff0044");
        materialRef.current.emissiveIntensity = 0.85 + Math.sin(Date.now() * 0.02) * 0.4;
      } else {
        materialRef.current.emissive.set("#000000");
        materialRef.current.emissiveIntensity = 0;
      }
    }
  });

  // Floating HP bar percentage
  const hpPct = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));
  const barWidth = isBoss ? 3.0 : 1.5;
  const hpColor =
    hpPct > 0.5 ? "#10b981" : hpPct > 0.25 ? "#f59e0b" : "#ef4444";

  // Position vector
  const posArray: [number, number, number] = Array.isArray(position)
    ? position
    : [position.x, position.y, position.z];

  return (
    <group position={posArray} onClick={onClick}>
      {/* 2.5D Billboard Mesh that always faces the camera */}
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
        position={[0, entityHeight * 0.5, 0]}
      >
        <mesh ref={meshRef} castShadow receiveShadow>
          <planeGeometry args={[entityWidth, entityHeight]} />
          <meshStandardMaterial
            ref={materialRef}
            map={texture}
            transparent={true}
            alphaTest={0.4}
            side={THREE.DoubleSide}
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>

        {/* --- Overhead Floating HUD: Name, Level, and HP Bar --- */}
        <group position={[0, entityHeight * 0.5 + 0.35, 0]}>
          {/* Entity Name & Level */}
          {name && (
            <Text
              position={[0, 0.28, 0]}
              fontSize={isBoss ? 0.32 : 0.2}
              color={isPlayer ? "#38bdf8" : isBoss ? "#ef4444" : "#f1f5f9"}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.03}
              outlineColor="#020617"
            >
              {level ? `Lv.${level} ` : ""}
              {name}
            </Text>
          )}

          {/* HP Bar Background */}
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[barWidth + 0.08, 0.16]} />
            <meshBasicMaterial color="#090d16" />
          </mesh>

          {/* HP Bar Foreground Fill */}
          <mesh position={[(-barWidth * (1 - hpPct)) / 2, 0, 0]}>
            <planeGeometry args={[Math.max(0.01, barWidth * hpPct), 0.12]} />
            <meshBasicMaterial color={hpColor} />
          </mesh>
        </group>
      </Billboard>
    </group>
  );
});
