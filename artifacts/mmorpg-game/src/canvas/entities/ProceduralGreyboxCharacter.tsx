import { memo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { WeaponSocket3D, type WeaponType } from "./WeaponSocket3D";
import type { EntityAnimationState } from "../sprites/SpriteBillboard25D";

export interface ProceduralGreyboxCharacterProps {
  animState?: EntityAnimationState;
  color?: string;
  weaponType?: WeaponType;
  facingLeft?: boolean;
}

export const ProceduralGreyboxCharacter = memo(function ProceduralGreyboxCharacter({
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
          <boxGeometry args={[0.5, 0.55, 0.3]} />
          <meshStandardMaterial color={color} roughness={0.5} metalness={0.3} />
        </mesh>
        {/* Core emblem */}
        <mesh position={[0, 0.05, 0.16]}>
          <boxGeometry args={[0.2, 0.2, 0.04]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.8} />
        </mesh>
      </group>

      {/* ── Head / Helmet ── */}
      <group ref={headRef} position={[0, 1.55, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.32, 0.35, 0.32]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} />
        </mesh>
        {/* Glowing Visor */}
        <mesh position={[0.16, 0.02, 0]}>
          <boxGeometry args={[0.04, 0.08, 0.24]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={1.5} />
        </mesh>
      </group>

      {/* ── Left Arm ── */}
      <group ref={leftArmRef} position={[0, 1.15, -0.3]}>
        <mesh castShadow position={[0, -0.22, 0]}>
          <boxGeometry args={[0.14, 0.45, 0.14]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      </group>

      {/* ── Right Arm & Weapon Socket ── */}
      <group ref={rightArmRef} position={[0, 1.15, 0.3]}>
        <mesh castShadow position={[0, -0.22, 0]}>
          <boxGeometry args={[0.14, 0.45, 0.14]} />
          <meshStandardMaterial color="#334155" />
        </mesh>

        {/* Dynamic Weapon Socket mounted at hand */}
        <group ref={weaponHolderRef} position={[0.08, -0.42, 0]}>
          <WeaponSocket3D weaponType={weaponType} />
        </group>
      </group>

      {/* ── Left Leg ── */}
      <group ref={leftLegRef} position={[0, 0.65, -0.14]}>
        <mesh castShadow position={[0, -0.3, 0]}>
          <boxGeometry args={[0.16, 0.6, 0.16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
      </group>

      {/* ── Right Leg ── */}
      <group ref={rightLegRef} position={[0, 0.65, 0.14]}>
        <mesh castShadow position={[0, -0.3, 0]}>
          <boxGeometry args={[0.16, 0.6, 0.16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
      </group>

      {/* Ground Shadow */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} />
      </mesh>
    </group>
  );
});

export default ProceduralGreyboxCharacter;
