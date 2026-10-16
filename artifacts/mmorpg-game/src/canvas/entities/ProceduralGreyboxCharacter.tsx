import { memo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { WeaponSocket3D, type WeaponType } from "./WeaponSocket3D";
import type { EntityAnimationState } from "../sprites/SpriteBillboard25D";

export interface ProceduralGreyboxCharacterProps {
  classId?: string;
  animState?: EntityAnimationState;
  color?: string;
  weaponType?: WeaponType;
  facingLeft?: boolean;
}

export const ProceduralGreyboxCharacter = memo(function ProceduralGreyboxCharacter({
  classId = "fighter",
  animState = "idle",
  color = "#f97316",
  weaponType = "sword",
  facingLeft = false,
}: ProceduralGreyboxCharacterProps) {
  const rootRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const weaponHolderRef = useRef<THREE.Group>(null);
  const scarfRef = useRef<THREE.Group>(null);

  const isGunner = classId === "gunner" || weaponType === "gun";
  const isAssassin = classId === "assassin" || weaponType === "daggers";
  const isTank = classId === "tank" || weaponType === "shield";
  const isFighter = !isGunner && !isAssassin && !isTank;

  const animTimer = useRef(0);

  useFrame((_, delta) => {
    animTimer.current += delta;
    const t = animTimer.current;

    // Apply facing rotation
    if (rootRef.current) {
      const targetRotY = facingLeft ? -Math.PI / 2 : Math.PI / 2;
      rootRef.current.rotation.y = THREE.MathUtils.lerp(
        rootRef.current.rotation.y,
        targetRotY,
        0.2
      );
    }

    // Dynamic wave physics for Assassin's trailing scarf
    if (scarfRef.current) {
      scarfRef.current.rotation.y = Math.sin(t * 6) * 0.25;
      scarfRef.current.rotation.z = Math.cos(t * 4) * 0.15;
    }

    // ── 1. IDLE ANIMATION (Breathing cycle) ──
    if (animState === "idle") {
      const breath = Math.sin(t * 3) * 0.03;
      if (torsoRef.current) {
        torsoRef.current.position.y = 0.9 + breath;
      }
      if (headRef.current) {
        headRef.current.position.y = 1.6 + breath * 1.2;
        headRef.current.rotation.x = Math.sin(t * 1.5) * 0.02;
      }
      if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * 3) * 0.08;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.sin(t * 3) * 0.08;
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (weaponHolderRef.current) weaponHolderRef.current.rotation.x = 0;
    }

    // ── 2. RUN / WALK ANIMATION ──
    else if (animState === "run" || animState === "walk") {
      const strideSpeed = animState === "run" ? 14 : 9;
      const legSwing = Math.sin(t * strideSpeed) * 0.55;
      const bounce = Math.abs(Math.sin(t * strideSpeed)) * 0.08;

      if (torsoRef.current) {
        torsoRef.current.position.y = 0.9 + bounce;
        torsoRef.current.rotation.x = 0.12; // lean forward
      }
      if (headRef.current) {
        headRef.current.position.y = 1.6 + bounce;
      }

      if (leftLegRef.current) leftLegRef.current.rotation.x = legSwing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -legSwing;

      if (leftArmRef.current) leftArmRef.current.rotation.x = -legSwing * 0.8;
      if (rightArmRef.current) rightArmRef.current.rotation.x = legSwing * 0.8;
    }

    // ── 3. ATTACK COMBO ANIMATION ──
    else if (
      animState === "attack" ||
      animState === "attack1" ||
      animState === "attack2" ||
      animState === "attack3" ||
      animState === "air_attack"
    ) {
      const attackSwing = Math.sin(t * 22) * 1.2;
      if (torsoRef.current) {
        torsoRef.current.rotation.y = Math.sin(t * 22) * 0.4;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -Math.PI / 3 + attackSwing;
      }
      if (weaponHolderRef.current) {
        weaponHolderRef.current.rotation.x = attackSwing * 0.5;
      }
    }

    // ── 4. DEATH ANIMATION ──
    else if (animState === "death") {
      if (rootRef.current) {
        rootRef.current.rotation.z = THREE.MathUtils.lerp(
          rootRef.current.rotation.z,
          Math.PI / 2,
          0.1
        );
      }
    }
  });

  return (
    <group ref={rootRef}>
      {/* ── Torso (Chest Armor) ── */}
      <group ref={torsoRef} position={[0, 0.9, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[isTank ? 0.62 : 0.5, 0.55, isTank ? 0.38 : 0.3]} />
          <meshStandardMaterial
            color={
              isGunner
                ? "#0f172a"
                : isAssassin
                ? "#581c87"
                : isTank
                ? "#ca8a04"
                : "#dc2626"
            }
            roughness={0.4}
            metalness={isTank ? 0.7 : 0.3}
          />
        </mesh>

        {/* Gunner: Arc Reactor Core & Back Jetpack */}
        {isGunner && (
          <group>
            {/* Chest Arc Reactor */}
            <mesh position={[0, 0.05, 0.16]}>
              <cylinderGeometry args={[0.08, 0.08, 0.04, 16]} />
              <meshStandardMaterial color="#00f2ff" emissive="#00f2ff" emissiveIntensity={1.8} />
            </mesh>
            {/* Back Jetpack Thrusters */}
            <group position={[0, 0.08, -0.2]}>
              <mesh position={[-0.12, 0, 0]}>
                <cylinderGeometry args={[0.06, 0.06, 0.35, 8]} />
                <meshStandardMaterial color="#1e293b" metalness={0.8} />
              </mesh>
              <mesh position={[-0.12, -0.2, 0]}>
                <cylinderGeometry args={[0.04, 0.02, 0.1, 8]} />
                <meshStandardMaterial color="#00f2ff" emissive="#00f2ff" emissiveIntensity={2.0} />
              </mesh>
              <mesh position={[0.12, 0, 0]}>
                <cylinderGeometry args={[0.06, 0.06, 0.35, 8]} />
                <meshStandardMaterial color="#1e293b" metalness={0.8} />
              </mesh>
              <mesh position={[0.12, -0.2, 0]}>
                <cylinderGeometry args={[0.04, 0.02, 0.1, 8]} />
                <meshStandardMaterial color="#00f2ff" emissive="#00f2ff" emissiveIntensity={2.0} />
              </mesh>
            </group>
          </group>
        )}

        {/* Assassin: Trailing Flowing Ninja Scarf */}
        {isAssassin && (
          <group ref={scarfRef} position={[0, 0.22, -0.16]}>
            <mesh position={[0, 0, -0.12]}>
              <boxGeometry args={[0.16, 0.08, 0.22]} />
              <meshStandardMaterial color="#f97316" roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.12, -0.26]}>
              <boxGeometry args={[0.14, 0.06, 0.25]} />
              <meshStandardMaterial color="#f43f5e" roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.26, -0.42]}>
              <boxGeometry args={[0.1, 0.04, 0.22]} />
              <meshStandardMaterial color="#fb7185" roughness={0.7} />
            </mesh>
          </group>
        )}

        {/* Fighter: Gold Dragon Sash / Belt */}
        {isFighter && (
          <mesh position={[0, -0.2, 0.02]}>
            <boxGeometry args={[0.54, 0.12, 0.32]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.3} />
          </mesh>
        )}

        {/* Tank: Heavy Spiked Golden Shoulder Pauldrons & Crimson Cape */}
        {isTank && (
          <group>
            {/* Left Pauldron */}
            <mesh position={[-0.38, 0.24, 0]}>
              <boxGeometry args={[0.22, 0.18, 0.28]} />
              <meshStandardMaterial color="#eab308" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Right Pauldron */}
            <mesh position={[0.38, 0.24, 0]}>
              <boxGeometry args={[0.22, 0.18, 0.28]} />
              <meshStandardMaterial color="#eab308" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Holy Solar Breastplate Emblem */}
            <mesh position={[0, 0.08, 0.2]}>
              <cylinderGeometry args={[0.1, 0.1, 0.04, 8]} />
              <meshStandardMaterial color="#fef08a" emissive="#fbbf24" emissiveIntensity={0.8} />
            </mesh>
            {/* Royal Crimson Knight Cape */}
            <mesh position={[0, -0.15, -0.22]}>
              <boxGeometry args={[0.52, 0.75, 0.04]} />
              <meshStandardMaterial color="#991b1b" roughness={0.8} />
            </mesh>
          </group>
        )}
      </group>

      {/* ── Head / Helmet ── */}
      <group ref={headRef} position={[0, 1.55, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.32, 0.35, 0.32]} />
          <meshStandardMaterial
            color={
              isGunner
                ? "#1e293b"
                : isAssassin
                ? "#3b0764"
                : isTank
                ? "#eab308"
                : "#18181b"
            }
            roughness={0.4}
            metalness={isTank ? 0.8 : 0.2}
          />
        </mesh>

        {/* Gunner: Spiky Ice Blue Hair & Cyan Cyber Visor */}
        {isGunner && (
          <group>
            {/* Glowing Visor */}
            <mesh position={[0.17, 0.02, 0]}>
              <boxGeometry args={[0.04, 0.08, 0.28]} />
              <meshStandardMaterial color="#00f2ff" emissive="#00f2ff" emissiveIntensity={2.0} />
            </mesh>
            {/* Spiky Ice Blue Hair Crown */}
            <mesh position={[0, 0.22, 0]}>
              <boxGeometry args={[0.34, 0.12, 0.34]} />
              <meshStandardMaterial color="#38bdf8" roughness={0.6} />
            </mesh>
          </group>
        )}

        {/* Assassin: Purple Cowl & Crimson Eyes */}
        {isAssassin && (
          <group>
            <mesh position={[0.17, 0.02, 0]}>
              <boxGeometry args={[0.04, 0.06, 0.24]} />
              <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={1.8} />
            </mesh>
            <mesh position={[-0.04, 0.18, 0]}>
              <boxGeometry args={[0.36, 0.1, 0.36]} />
              <meshStandardMaterial color="#3b0764" roughness={0.8} />
            </mesh>
          </group>
        )}

        {/* Fighter: Flame-Red Hair & Crimson Headband */}
        {isFighter && (
          <group>
            {/* Headband */}
            <mesh position={[0, 0.05, 0]}>
              <boxGeometry args={[0.34, 0.08, 0.34]} />
              <meshStandardMaterial color="#991b1b" roughness={0.7} />
            </mesh>
            {/* Spiky Flame Hair */}
            <mesh position={[0, 0.22, 0]}>
              <boxGeometry args={[0.34, 0.14, 0.34]} />
              <meshStandardMaterial color="#ef4444" emissive="#ea580c" emissiveIntensity={0.6} />
            </mesh>
          </group>
        )}

        {/* Tank: Winged Golden Helmet Crest & Glowing Visor Slit */}
        {isTank && (
          <group>
            {/* Glowing Golden Eye Slit */}
            <mesh position={[0.17, 0.02, 0]}>
              <boxGeometry args={[0.04, 0.05, 0.26]} />
              <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={2.0} />
            </mesh>
            {/* Winged Golden Crest Horns */}
            <mesh position={[0, 0.24, 0]}>
              <boxGeometry args={[0.12, 0.16, 0.4]} />
              <meshStandardMaterial color="#fde047" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        )}
      </group>

      {/* ── Left Arm ── */}
      <group ref={leftArmRef} position={[0, 1.15, -0.32]}>
        <mesh castShadow position={[0, -0.22, 0]}>
          <boxGeometry args={[0.14, 0.45, 0.14]} />
          <meshStandardMaterial color={isTank ? "#ca8a04" : "#334155"} />
        </mesh>
      </group>

      {/* ── Right Arm & Weapon Socket ── */}
      <group ref={rightArmRef} position={[0, 1.15, 0.32]}>
        <mesh castShadow position={[0, -0.22, 0]}>
          <boxGeometry args={[0.14, 0.45, 0.14]} />
          <meshStandardMaterial color={isTank ? "#ca8a04" : "#334155"} />
        </mesh>

        {/* Dynamic Weapon Socket mounted at hand */}
        <group ref={weaponHolderRef} position={[0.08, -0.42, 0]}>
          <WeaponSocket3D weaponType={weaponType} />
        </group>
      </group>

      {/* ── Left Leg ── */}
      <group ref={leftLegRef} position={[0, 0.65, -0.15]}>
        <mesh castShadow position={[0, -0.3, 0]}>
          <boxGeometry args={[isTank ? 0.2 : 0.16, 0.6, isTank ? 0.2 : 0.16]} />
          <meshStandardMaterial color={isTank ? "#78350f" : "#0f172a"} roughness={0.8} />
        </mesh>
      </group>

      {/* ── Right Leg ── */}
      <group ref={rightLegRef} position={[0, 0.65, 0.15]}>
        <mesh castShadow position={[0, -0.3, 0]}>
          <boxGeometry args={[isTank ? 0.2 : 0.16, 0.6, isTank ? 0.2 : 0.16]} />
          <meshStandardMaterial color={isTank ? "#78350f" : "#0f172a"} roughness={0.8} />
        </mesh>
      </group>

      {/* Ground Shadow */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[isTank ? 0.7 : 0.55, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} />
      </mesh>
    </group>
  );
});

export default ProceduralGreyboxCharacter;
