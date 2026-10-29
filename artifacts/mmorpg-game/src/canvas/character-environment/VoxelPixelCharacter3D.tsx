import { memo, useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type {
  CharacterClassId,
  CharacterGender,
  CharacterAnimationState,
} from "./types";

interface VoxelPixelCharacter3DProps {
  classId: CharacterClassId;
  gender: CharacterGender;
  animState: CharacterAnimationState;
  showWeapon?: boolean;
}

export const VoxelPixelCharacter3D = memo(function VoxelPixelCharacter3D({
  classId,
  gender,
  animState,
  showWeapon = true,
}: VoxelPixelCharacter3DProps) {
  const rootRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const swordRef = useRef<THREE.Group>(null);
  const scarfRef = useRef<THREE.Group>(null);

  const isFemale = gender === "female";

  const palette = useMemo(() => {
    switch (classId) {
      case "tank":
        return {
          armor: "#231e2b",
          highlight: "#ef4444",
          gold: "#eab308",
          hair: isFemale ? "#fef08a" : "#1a1622",
          skin: isFemale ? "#fff1e6" : "#fbe2c5",
          eye: "#ef4444",
        };
      case "assassin":
        return {
          armor: "#1f1728",
          highlight: "#a855f7",
          gold: "#f43f5e",
          hair: isFemale ? "#9333ea" : "#f97316",
          skin: isFemale ? "#fff5ee" : "#fae0c8",
          eye: "#c084fc",
        };
      case "gunner":
        return {
          armor: "#1e293b",
          highlight: "#00f2ff",
          gold: "#38bdf8",
          hair: isFemale ? "#00f2ff" : "#e2e8f0",
          skin: isFemale ? "#fff0f5" : "#fce7d2",
          eye: "#00f2ff",
        };
      case "fighter":
      default:
        return {
          armor: "#b91c1c",
          highlight: "#10b981",
          gold: "#f59e0b",
          hair: isFemale ? "#fbbf24" : "#f59e0b",
          skin: isFemale ? "#fff1e6" : "#fbe2c5",
          eye: "#38bdf8",
        };
    }
  }, [classId, isFemale]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    if (animState === "idle") {
      const breath = Math.sin(t * 3.5) * 0.025;
      if (torsoRef.current) torsoRef.current.position.y = 0.95 + breath;
      if (headRef.current) headRef.current.position.y = 1.6 + breath * 1.2;
      if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * 1.8) * 0.04;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.15 + Math.sin(t * 1.8) * 0.04;
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (scarfRef.current) scarfRef.current.rotation.y = Math.sin(t * 4.0) * 0.15;
    } else if (animState === "run") {
      const stride = Math.sin(t * 13.0) * 0.6;
      const bounce = Math.abs(Math.sin(t * 13.0)) * 0.08;
      if (torsoRef.current) {
        torsoRef.current.position.y = 0.95 + bounce;
        torsoRef.current.rotation.x = 0.15;
      }
      if (headRef.current) headRef.current.position.y = 1.6 + bounce;
      if (leftLegRef.current) leftLegRef.current.rotation.x = stride;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -stride;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -stride * 0.75;
      if (rightArmRef.current) rightArmRef.current.rotation.x = stride * 0.75;
    } else if (animState === "attack_slash") {
      const slash = Math.sin(t * 18.0) * 1.3;
      if (torsoRef.current) torsoRef.current.rotation.y = Math.sin(t * 18.0) * 0.4;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.PI / 3 + slash;
      if (swordRef.current) swordRef.current.rotation.x = slash * 0.6;
    } else if (animState === "skill_cast") {
      const charge = Math.sin(t * 8.0) * 0.06;
      if (torsoRef.current) torsoRef.current.position.y = 0.92 + charge;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -Math.PI / 2.5;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.PI / 2.5;
    } else if (animState === "death") {
      if (rootRef.current) {
        rootRef.current.rotation.z = THREE.MathUtils.lerp(rootRef.current.rotation.z, Math.PI / 2, 0.1);
        rootRef.current.position.y = THREE.MathUtils.lerp(rootRef.current.position.y, -0.15, 0.1);
      }
    }
  });

  return (
    <group ref={rootRef} name="voxel-pixel-character-3d">
      {/* ── VOXEL HEAD & PIXEL SPIKY HAIR ── */}
      <group ref={headRef} position={[0, 1.6, 0]}>
        {/* Head Core Cube */}
        <mesh castShadow>
          <boxGeometry args={[0.36, 0.36, 0.36]} />
          <meshStandardMaterial color={palette.skin} roughness={0.7} />
        </mesh>

        {/* ── Big Pixel Eyes (Catchlight Pixel) ── */}
        {/* Left Pixel Eye */}
        <group position={[-0.09, 0.02, 0.185]}>
          <mesh>
            <boxGeometry args={[0.07, 0.09, 0.01]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, -0.01, 0.005]}>
            <boxGeometry args={[0.05, 0.06, 0.01]} />
            <meshBasicMaterial color={palette.eye} />
          </mesh>
          <mesh position={[-0.015, 0.02, 0.01]}>
            <boxGeometry args={[0.02, 0.02, 0.01]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>

        {/* Right Pixel Eye */}
        <group position={[0.09, 0.02, 0.185]}>
          <mesh>
            <boxGeometry args={[0.07, 0.09, 0.01]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, -0.01, 0.005]}>
            <boxGeometry args={[0.05, 0.06, 0.01]} />
            <meshBasicMaterial color={palette.eye} />
          </mesh>
          <mesh position={[-0.015, 0.02, 0.01]}>
            <boxGeometry args={[0.02, 0.02, 0.01]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>

        {/* ── Stepped Voxel Anime Hair Spikes (Tóc Gai Pixel Xếp Tầng) ── */}
        <group position={[0, 0.1, 0]}>
          {/* Top Hair Cap */}
          <mesh position={[0, 0.14, 0]} castShadow>
            <boxGeometry args={[0.42, 0.12, 0.42]} />
            <meshStandardMaterial color={palette.hair} roughness={0.5} />
          </mesh>
          {/* Top Middle Hair Spike */}
          <mesh position={[0, 0.26, 0.04]} castShadow>
            <boxGeometry args={[0.16, 0.16, 0.18]} />
            <meshStandardMaterial color={palette.hair} roughness={0.5} />
          </mesh>
          {/* Left Hair Spike */}
          <mesh position={[-0.18, 0.22, 0]} castShadow>
            <boxGeometry args={[0.14, 0.14, 0.16]} />
            <meshStandardMaterial color={palette.hair} roughness={0.5} />
          </mesh>
          {/* Right Hair Spike */}
          <mesh position={[0.18, 0.22, 0]} castShadow>
            <boxGeometry args={[0.14, 0.14, 0.16]} />
            <meshStandardMaterial color={palette.hair} roughness={0.5} />
          </mesh>

          {/* Front Pixel Bangs (Mái Tóc Nhọn Nhấp Nhô) */}
          <mesh position={[0, 0.06, 0.22]} castShadow>
            <boxGeometry args={[0.1, 0.12, 0.08]} />
            <meshStandardMaterial color={palette.hair} roughness={0.5} />
          </mesh>
          <mesh position={[-0.12, 0.04, 0.22]} castShadow>
            <boxGeometry args={[0.08, 0.1, 0.08]} />
            <meshStandardMaterial color={palette.hair} roughness={0.5} />
          </mesh>
          <mesh position={[0.12, 0.04, 0.22]} castShadow>
            <boxGeometry args={[0.08, 0.1, 0.08]} />
            <meshStandardMaterial color={palette.hair} roughness={0.5} />
          </mesh>

          {/* Tank Special: Voxel Crimson Flame Horns */}
          {classId === "tank" && (
            <group position={[0, 0.18, 0.05]}>
              <mesh position={[-0.18, 0.14, 0]} castShadow>
                <boxGeometry args={[0.08, 0.22, 0.08]} />
                <meshStandardMaterial color="#ef4444" emissive="#ff2244" emissiveIntensity={2.0} />
              </mesh>
              <mesh position={[0.18, 0.14, 0]} castShadow>
                <boxGeometry args={[0.08, 0.22, 0.08]} />
                <meshStandardMaterial color="#ef4444" emissive="#ff2244" emissiveIntensity={2.0} />
              </mesh>
            </group>
          )}
        </group>
      </group>

      {/* ── VOXEL TORSO (Chest Armor & Sculpted 6-Pack Pixel Abs) ── */}
      <group ref={torsoRef} position={[0, 0.95, 0]}>
        {/* Chest Upper Plate */}
        <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.48, 0.28, 0.28]} />
          <meshStandardMaterial color={palette.armor} roughness={0.4} />
        </mesh>

        {/* ── MALE 6-PACK PIXEL ABS (Cơ Bụng 6 Múi Khối Pixel) ── */}
        {!isFemale ? (
          <group position={[0, 0.02, 0.08]}>
            {/* Mid Torso Skin Base */}
            <mesh castShadow>
              <boxGeometry args={[0.34, 0.32, 0.16]} />
              <meshStandardMaterial color={palette.skin} roughness={0.65} />
            </mesh>
            {/* Top Abs (Voxel Pack 1) */}
            <mesh position={[-0.075, 0.08, 0.08]} castShadow>
              <boxGeometry args={[0.11, 0.07, 0.03]} />
              <meshStandardMaterial color={palette.skin} roughness={0.6} />
            </mesh>
            <mesh position={[0.075, 0.08, 0.08]} castShadow>
              <boxGeometry args={[0.11, 0.07, 0.03]} />
              <meshStandardMaterial color={palette.skin} roughness={0.6} />
            </mesh>
            {/* Mid Abs (Voxel Pack 2) */}
            <mesh position={[-0.075, -0.01, 0.08]} castShadow>
              <boxGeometry args={[0.11, 0.07, 0.03]} />
              <meshStandardMaterial color={palette.skin} roughness={0.6} />
            </mesh>
            <mesh position={[0.075, -0.01, 0.08]} castShadow>
              <boxGeometry args={[0.11, 0.07, 0.03]} />
              <meshStandardMaterial color={palette.skin} roughness={0.6} />
            </mesh>
            {/* Lower Abs (Voxel Pack 3) */}
            <mesh position={[-0.075, -0.1, 0.08]} castShadow>
              <boxGeometry args={[0.11, 0.07, 0.03]} />
              <meshStandardMaterial color={palette.skin} roughness={0.6} />
            </mesh>
            <mesh position={[0.075, -0.1, 0.08]} castShadow>
              <boxGeometry args={[0.11, 0.07, 0.03]} />
              <meshStandardMaterial color={palette.skin} roughness={0.6} />
            </mesh>
          </group>
        ) : (
          /* Female Voxel Waist */
          <mesh position={[0, -0.02, 0.04]} castShadow>
            <boxGeometry args={[0.36, 0.26, 0.22]} />
            <meshStandardMaterial color={palette.skin} roughness={0.65} />
          </mesh>
        )}

        {/* Voxel Golden Belt */}
        <mesh position={[0, -0.2, 0]} castShadow>
          <boxGeometry args={[0.42, 0.09, 0.3]} />
          <meshStandardMaterial color={palette.gold} metalness={0.8} />
        </mesh>
        {/* Belt Buckle */}
        <mesh position={[0, -0.2, 0.16]} castShadow>
          <boxGeometry args={[0.1, 0.09, 0.04]} />
          <meshStandardMaterial color="#fef08a" metalness={0.9} />
        </mesh>

        {/* Fighter Scarf */}
        {classId === "fighter" && (
          <group ref={scarfRef} position={[0, 0.36, -0.14]}>
            <mesh position={[0, -0.16, -0.05]} castShadow>
              <boxGeometry args={[0.22, 0.35, 0.06]} />
              <meshStandardMaterial color={palette.highlight} roughness={0.6} />
            </mesh>
          </group>
        )}
      </group>

      {/* ── VOXEL ARMS & PIXEL WEAPONS ── */}
      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.32, 1.3, 0]}>
        <mesh position={[0, 0.04, 0]} castShadow>
          <boxGeometry args={[0.16, 0.14, 0.16]} />
          <meshStandardMaterial color={palette.gold} metalness={0.7} />
        </mesh>
        <mesh position={[0, -0.18, 0]} castShadow>
          <boxGeometry args={[0.12, 0.28, 0.12]} />
          <meshStandardMaterial color={palette.skin} />
        </mesh>
        <mesh position={[0, -0.38, 0]} castShadow>
          <boxGeometry args={[0.14, 0.18, 0.14]} />
          <meshStandardMaterial color={palette.armor} />
        </mesh>

        {/* Tank Shield Voxel */}
        {classId === "tank" && showWeapon && (
          <group position={[-0.1, -0.24, 0.12]}>
            <mesh castShadow>
              <boxGeometry args={[0.45, 0.72, 0.06]} />
              <meshStandardMaterial color="#1a1624" metalness={0.8} />
            </mesh>
            <mesh position={[0, 0, 0.035]}>
              <boxGeometry args={[0.4, 0.68, 0.02]} />
              <meshStandardMaterial color={palette.gold} metalness={0.9} />
            </mesh>
          </group>
        )}
      </group>

      {/* Right Arm & Voxel Weapon */}
      <group ref={rightArmRef} position={[0.32, 1.3, 0]}>
        <mesh position={[0, 0.04, 0]} castShadow>
          <boxGeometry args={[0.16, 0.14, 0.16]} />
          <meshStandardMaterial color={palette.gold} metalness={0.7} />
        </mesh>
        <mesh position={[0, -0.18, 0]} castShadow>
          <boxGeometry args={[0.12, 0.28, 0.12]} />
          <meshStandardMaterial color={palette.skin} />
        </mesh>
        <mesh position={[0, -0.38, 0]} castShadow>
          <boxGeometry args={[0.14, 0.18, 0.14]} />
          <meshStandardMaterial color={palette.armor} />
        </mesh>

        {/* ── VOXEL BROADSWORD (Kiếm Răng Cưa Pixel) ── */}
        {showWeapon && classId === "fighter" && (
          <group ref={swordRef} position={[0, -0.4, 0.12]} rotation={[-Math.PI / 3, 0, 0]}>
            {/* Stepped Pixel Blade */}
            <mesh position={[0, 0.55, 0]} castShadow>
              <boxGeometry args={[0.11, 0.95, 0.03]} />
              <meshStandardMaterial color="#f1f5f9" metalness={0.9} roughness={0.15} />
            </mesh>
            {/* Red Dragon Pixel Rune */}
            <mesh position={[0, 0.55, 0.02]}>
              <boxGeometry args={[0.03, 0.8, 0.01]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
            {/* Pixel Crossguard */}
            <mesh position={[0, 0.04, 0]} castShadow>
              <boxGeometry args={[0.32, 0.07, 0.07]} />
              <meshStandardMaterial color={palette.gold} metalness={0.9} />
            </mesh>
            {/* Pixel Grip & Pommel */}
            <mesh position={[0, -0.12, 0]} castShadow>
              <boxGeometry args={[0.05, 0.24, 0.05]} />
              <meshStandardMaterial color="#18181b" />
            </mesh>
            <mesh position={[0, -0.26, 0]} castShadow>
              <boxGeometry args={[0.08, 0.06, 0.08]} />
              <meshStandardMaterial color={palette.gold} metalness={0.9} />
            </mesh>
          </group>
        )}
      </group>

      {/* ── VOXEL LEGS & ARMORED BOOTS ── */}
      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.14, 0.72, 0]}>
        <mesh position={[0, -0.16, 0]} castShadow>
          <boxGeometry args={[0.15, 0.32, 0.16]} />
          <meshStandardMaterial color={palette.armor} />
        </mesh>
        <mesh position={[0, -0.38, 0.02]} castShadow>
          <boxGeometry args={[0.16, 0.12, 0.18]} />
          <meshStandardMaterial color={palette.gold} metalness={0.8} />
        </mesh>
        <mesh position={[0, -0.56, 0.04]} castShadow>
          <boxGeometry args={[0.15, 0.26, 0.24]} />
          <meshStandardMaterial color="#110e17" roughness={0.7} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.14, 0.72, 0]}>
        <mesh position={[0, -0.16, 0]} castShadow>
          <boxGeometry args={[0.15, 0.32, 0.16]} />
          <meshStandardMaterial color={palette.armor} />
        </mesh>
        <mesh position={[0, -0.38, 0.02]} castShadow>
          <boxGeometry args={[0.16, 0.12, 0.18]} />
          <meshStandardMaterial color={palette.gold} metalness={0.8} />
        </mesh>
        <mesh position={[0, -0.56, 0.04]} castShadow>
          <boxGeometry args={[0.15, 0.26, 0.24]} />
          <meshStandardMaterial color="#110e17" roughness={0.7} />
        </mesh>
      </group>

      {/* Foot Shadow */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.45, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.4} />
      </mesh>
    </group>
  );
});

