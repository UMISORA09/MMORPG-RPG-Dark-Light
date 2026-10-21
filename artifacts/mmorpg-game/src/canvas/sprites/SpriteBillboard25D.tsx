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
  hairStyle?: string;
  hairColor?: string;
  outfitId?: string;
  auraIds?: string[];
}

const TOTAL_COLS = 8;
const TOTAL_ROWS = 9;

const RELIC_AURA_MAP: Record<string, { color: string; emissive: string; intensity: number; size: number }> = {
  aura_miracle_celestial: { color: "#ec4899", emissive: "#f43f5e", intensity: 2.2, size: 0.16 },
  aura_miracle_phoenix: { color: "#f43f5e", emissive: "#fb7185", intensity: 2.2, size: 0.16 },
  aura_legend_dragon: { color: "#f59e0b", emissive: "#fbbf24", intensity: 1.8, size: 0.13 },
  aura_legend_thunderbird: { color: "#a855f7", emissive: "#c084fc", intensity: 1.8, size: 0.13 },
  aura_legend_whitetiger: { color: "#ef4444", emissive: "#f87171", intensity: 1.8, size: 0.13 },
  aura_epic_dragon: { color: "#0284c7", emissive: "#38bdf8", intensity: 1.4, size: 0.11 },
  aura_epic_thunder: { color: "#8b5cf6", emissive: "#a78bfa", intensity: 1.4, size: 0.11 },
  aura_epic_tiger: { color: "#f43f5e", emissive: "#fb7185", intensity: 1.4, size: 0.11 },
  aura_epic_tortoise: { color: "#10b981", emissive: "#34d399", intensity: 1.4, size: 0.11 },
  dragon: { color: "#f59e0b", emissive: "#fbbf24", intensity: 1.5, size: 0.12 },
  thunder: { color: "#a855f7", emissive: "#c084fc", intensity: 1.5, size: 0.12 },
  tiger: { color: "#ef4444", emissive: "#f87171", intensity: 1.5, size: 0.12 },
  tortoise: { color: "#10b981", emissive: "#34d399", intensity: 1.5, size: 0.12 },
};

function OrbitingRelicAura({ auraIds }: { auraIds?: string[] }) {
  const orbRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const activeKey = useMemo(() => {
    if (!auraIds || auraIds.length === 0) return null;
    const miracle = auraIds.find((id) => id.includes("miracle"));
    if (miracle) return miracle;
    const legend = auraIds.find((id) => id.includes("legend"));
    if (legend) return legend;
    const epic = auraIds.find((id) => id.includes("epic"));
    if (epic) return epic;
    return auraIds[0];
  }, [auraIds]);

  const cfg = activeKey ? RELIC_AURA_MAP[activeKey] || RELIC_AURA_MAP.dragon : null;

  useFrame((state, delta) => {
    if (!orbRef.current) return;
    const t = state.clock.getElapsedTime();
    const radius = 0.82;
    orbRef.current.position.x = Math.cos(t * 2.4) * radius;
    orbRef.current.position.z = Math.sin(t * 2.4) * radius;
    orbRef.current.position.y = 0.85 + Math.sin(t * 3.6) * 0.12;

    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 1.5;
    }
  });

  if (!cfg) return null;

  return (
    <group>
      {/* Orbiting Celestial Sphere */}
      <group ref={orbRef}>
        <mesh>
          <sphereGeometry args={[cfg.size, 16, 16]} />
          <meshStandardMaterial
            color={cfg.color}
            emissive={cfg.emissive}
            emissiveIntensity={cfg.intensity}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
        {/* Emissive material provides clean visual glow with zero light-recompile overhead */}
      </group>

      {/* Gentle Foot Halo Ring in Relic Color */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[0.55, 0.62, 32]} />
        <meshBasicMaterial color={cfg.emissive} transparent opacity={0.45} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

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
  hairStyle,
  hairColor,
  outfitId,
  auraIds,
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

  useFrame((threeState, delta) => {
    const time = threeState.clock.getElapsedTime();

    // 1. Immediately update UV when state or facing changes (DO NOT reset frame on facing change alone!)
    const stateChanged = prevState.current !== state;
    const facingChanged = prevFacing.current !== facingLeft;

    if (stateChanged || facingChanged) {
      prevState.current = state;
      prevFacing.current = facingLeft;
      if (stateChanged) {
        currentFrame.current = 0;
        frameTimer.current = 0;
      }
      applyUV(currentFrame.current, rowIndex, facingLeft);
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

    // 3. Subtle Life & Advanced Movement Physics (Fluid Stride, Lean, Squash & Stretch)
    if (meshRef.current) {
      if (state === "idle") {
        // Dual-harmonic organic chest breathing & subtle posture sway
        const breath = Math.sin(time * 3.2);
        const microSway = Math.sin(time * 1.6) * 0.015;
        meshRef.current.position.y = breath * 0.035;
        meshRef.current.position.x = microSway;
        meshRef.current.rotation.z = microSway * 0.5;
        meshRef.current.scale.set(1.0 - breath * 0.012, 1.0 + breath * 0.022, 1.0);
      } else if (state === "run" || state === "walk") {
        // High-speed lean, dynamic stride bobbing & running squash-stretch
        const runCycle = time * (state === "run" ? 13 : 8.5);
        const stride = Math.sin(runCycle);
        const squashStretch = Math.cos(runCycle * 2) * 0.035;
        meshRef.current.position.y = Math.abs(stride) * 0.06;
        meshRef.current.position.x = 0;
        // Dynamic banking / tilt in running direction
        meshRef.current.rotation.z = stride * 0.045 * (facingLeft ? -1 : 1);
        meshRef.current.scale.set(1.0 - squashStretch, 1.0 + squashStretch, 1.0);
      } else if (state === "jump") {
        // Aerodynamic vertical stretch during ascent
        meshRef.current.position.set(0, 0.04, 0);
        meshRef.current.rotation.z = 0;
        meshRef.current.scale.set(0.92, 1.08, 1.0);
      } else if (state === "fall") {
        // Broadening / parachute squash during descent
        meshRef.current.position.set(0, 0, 0);
        meshRef.current.rotation.z = 0;
        meshRef.current.scale.set(1.06, 0.94, 1.0);
      } else if (state.startsWith("attack") || state === "air_attack") {
        // Dramatic Attack Slash Pose - Dynamic forward thrust & weapon follow-through
        const attackPhase = (currentFrame.current / 8) * Math.PI;
        const forwardLunge = Math.sin(attackPhase) * 0.16 * (facingLeft ? -1 : 1);
        meshRef.current.position.x = forwardLunge;
        meshRef.current.position.y = 0.03 + Math.sin(attackPhase) * 0.05;
        meshRef.current.rotation.z = Math.sin(attackPhase) * 0.09 * (facingLeft ? -1 : 1);
        const isImpactFrame = currentFrame.current >= 2 && currentFrame.current <= 4;
        const attackScale = isImpactFrame ? 1.15 : 1.06;
        meshRef.current.scale.set(attackScale, attackScale * 0.96, 1.0);
      } else if (state === "hurt") {
        // Erratic horizontal hit stagger shaking
        meshRef.current.position.x = Math.sin(time * 45) * 0.04;
        meshRef.current.rotation.z = 0;
        meshRef.current.scale.set(1, 1, 1);
      } else {
        meshRef.current.position.set(0, 0, 0);
        meshRef.current.rotation.z = 0;
        meshRef.current.scale.set(1, 1, 1);
      }
    }

    // 4. Hit-Flash (pure white/red 120ms) & Status Effect Tints (Cold Blue for Slow, Crimson for Bleed)
    if (materialRef.current) {
      const isSlow = debuffBadges.includes("🐌");
      const isBleed = debuffBadges.includes("🩸") || debuffBadges.includes("☠️");

      if (hitFlash) {
        // Pure white impact flash
        materialRef.current.emissive.set("#ffffff");
        materialRef.current.emissiveIntensity = 1.6;
      } else if (state === "hurt" || isInvincible) {
        // Red hurt / invincibility pulse
        materialRef.current.emissive.set("#ff2222");
        materialRef.current.emissiveIntensity = 0.95 + Math.sin(Date.now() * 0.03) * 0.35;
      } else if (state.startsWith("attack")) {
        // High-energy combat weapon blade gleam
        materialRef.current.emissive.set(color);
        materialRef.current.emissiveIntensity = 0.55;
      } else if (isBleed) {
        // Crimson dripping bleed pulse
        materialRef.current.emissive.set("#dc2626");
        materialRef.current.emissiveIntensity = 0.6 + Math.sin(time * 8) * 0.4;
      } else if (isSlow) {
        // Cold frost blue tint
        materialRef.current.emissive.set("#38bdf8");
        materialRef.current.emissiveIntensity = 0.45 + Math.sin(time * 4) * 0.2;
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

      {/* Orbiting Celestial Spirit / Relic Aura if equipped */}
      <OrbitingRelicAura auraIds={auraIds} />

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
            color={outfitId === "shadow" ? "#94a3b8" : outfitId === "crimson" ? "#fca5a5" : outfitId === "frost" ? "#bae6fd" : "#ffffff"}
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
