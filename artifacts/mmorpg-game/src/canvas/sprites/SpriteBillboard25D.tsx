import { memo, useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import { loadOrFallbackSpritesheet } from "./ProceduralSpriteFallback";
import { useGameWorldStore } from "@/stores/useGameWorldStore";

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
  hitFlash?: boolean;
  debuffBadges?: string[];
  showOverhead?: boolean;
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
  hitFlash = false,
  debuffBadges = [],
  showOverhead = true,
  onClick,
}: SpriteBillboard25DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const overheadRef = useRef<THREE.Group>(null);

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
  const prevState = useRef(state);
  const prevFacing = useRef(facingLeft);

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

  const applyUV = (col: number, row: number, isFacingLeft: boolean) => {
    const uStep = 1 / TOTAL_COLS;
    const vStep = 1 / TOTAL_ROWS;
    const vOffset = (TOTAL_ROWS - 1 - row) * vStep;

    if (isFacingLeft) {
      texture.repeat.x = -uStep;
      texture.offset.x = (col + 1) * uStep;
    } else {
      texture.repeat.x = uStep;
      texture.offset.x = col * uStep;
    }
    texture.offset.y = vOffset;
  };

  useFrame((_, delta) => {
    // 1. Immediately reset animation frame when state changes
    if (prevState.current !== state || prevFacing.current !== facingLeft) {
      prevState.current = state;
      prevFacing.current = facingLeft;
      currentFrame.current = 0;
      frameTimer.current = 0;
      applyUV(0, rowIndex, facingLeft);
    }

    // 2. Animation frame advancement FPS tuning
    const fps =
      state === "run" || state === "walk"
        ? 12
        : state.startsWith("attack") || state === "air_attack"
        ? 14
        : state === "death"
        ? 8
        : 8;

    frameTimer.current += delta;
    const frameInterval = 1 / fps;

    if (frameTimer.current >= frameInterval) {
      frameTimer.current -= frameInterval;

      // Death clamp at last frame; loop other states
      if (state === "death") {
        currentFrame.current = Math.min(currentFrame.current + 1, TOTAL_COLS - 1);
      } else {
        currentFrame.current = (currentFrame.current + 1) % TOTAL_COLS;
      }

      applyUV(currentFrame.current, rowIndex, facingLeft);
    }

    // Hurt flashing emissive effect
    if (materialRef.current) {
      if (state === "hurt" || isInvincible || hitFlash) {
        materialRef.current.emissive.set("#ff2222");
        materialRef.current.emissiveIntensity = 0.95 + Math.sin(Date.now() * 0.03) * 0.35;
      } else {
        materialRef.current.emissive.set("#000000");
        materialRef.current.emissiveIntensity = 0;
      }
    }

    // Distance check & Player Overhead Visibility
    if (overheadRef.current) {
      if (isPlayer) {
        // Player already has top-left player frame; hide overhead badge to keep view clean
        overheadRef.current.visible = false;
      } else {
        const playerPos = useGameWorldStore.getState().playerPosition;
        const dx = posArray[0] - playerPos.x;
        const dy = posArray[1] - playerPos.y;
        const dz = posArray[2] - playerPos.z;
        const distSq = dx * dx + dy * dy + dz * dz;
        // Auto hide if distance > 22m (22 * 22 = 484)
        overheadRef.current.visible = distSq <= 484;
      }
    }
  });

  // Floating HP bar percentage
  const hpPct = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));
  const barWidth = isBoss ? 2.4 : 1.3;
  const hpColor =
    hpPct > 0.5 ? "#10b981" : hpPct > 0.25 ? "#f59e0b" : "#ef4444";

  // Bottom-anchored plane geometry (pivot at bottom feet)
  const planeGeom = useMemo(() => {
    const geom = new THREE.PlaneGeometry(entityWidth, entityHeight);
    geom.translate(0, entityHeight * 0.5, 0);
    return geom;
  }, [entityWidth, entityHeight]);

  useEffect(() => {
    return () => {
      planeGeom.dispose();
    };
  }, [planeGeom]);

  // Position vector
  const posArray: [number, number, number] = Array.isArray(position)
    ? position
    : [position.x, position.y, position.z];

  return (
    <group position={posArray} onClick={onClick}>
      {/* Contact Ground Shadow decal (z-fighting free) */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[entityWidth * 0.35, 20]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.35}
          depthWrite={false}
          polygonOffset={true}
          polygonOffsetFactor={-1}
        />
      </mesh>

      {/* 2.5D Billboard Mesh that always faces the camera */}
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
        position={[0, 0, 0]}
      >
        <mesh ref={meshRef} geometry={planeGeom} castShadow receiveShadow>
          <meshStandardMaterial
            ref={materialRef}
            map={texture}
            transparent={true}
            alphaTest={0.45}
            side={THREE.DoubleSide}
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>

        {/* --- Overhead Floating HUD: Single-line Name & Compact HP Bar (Pill Background) --- */}
        {showOverhead && (
          <group ref={overheadRef} position={[0, entityHeight + 0.32, 0]}>
            {/* Black Translucent Background Pill */}
            <mesh position={[0, 0.1, -0.02]}>
              <planeGeometry args={[barWidth + 0.3, 0.34]} />
              <meshBasicMaterial color="#000000" transparent opacity={0.72} depthWrite={false} />
            </mesh>

            {/* Active Debuff Badges */}
            {debuffBadges && debuffBadges.length > 0 && (
              <Text
                position={[0, 0.35, 0]}
                fontSize={0.16}
                anchorX="center"
                anchorY="middle"
              >
                {debuffBadges.join(" ")}
              </Text>
            )}

            {/* Single-line Entity Name & Level */}
            {name && (
              <Text
                position={[0, 0.17, 0]}
                fontSize={isBoss ? 0.26 : 0.18}
                color={isBoss ? "#ef4444" : "#ffffff"}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.025}
                outlineColor="#020617"
              >
                {level ? `Lv.${level} ` : ""}
                {name}
              </Text>
            )}

            {/* Compact HP Bar Track */}
            <mesh position={[0, 0.03, -0.01]}>
              <planeGeometry args={[barWidth, 0.06]} />
              <meshBasicMaterial color="#1a202c" />
            </mesh>

            {/* Compact HP Bar Fill */}
            <mesh position={[(-barWidth * (1 - hpPct)) / 2, 0.03, 0]}>
              <planeGeometry args={[Math.max(0.01, barWidth * hpPct), 0.06]} />
              <meshBasicMaterial color={hpColor} />
            </mesh>
          </group>
        )}
      </Billboard>
    </group>
  );
});
