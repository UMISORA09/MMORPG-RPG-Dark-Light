import { memo, useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useCharacterStudioStore } from "./useCharacterStudioStore";
import type {
  CharacterClassId,
  CharacterGender,
  CharacterAnimationState,
  BodyPartId,
} from "./types";

interface ModularPixelCharacterRigProps {
  classId: CharacterClassId;
  gender: CharacterGender;
  animState: CharacterAnimationState;
  showWeapon?: boolean;
}

// ── Joint Pivot Specs in 3D Canvas Space (Canvas 360x360 mapped to [2.0, 2.0] at Y=1.0) ──
const PIVOTS = {
  head: [0.0, 1.194, 0.0] as const,
  hair: [0.0, 1.444, 0.0] as const,
  torso: [0.0, 1.027, 0.0] as const,
  abs: [0.0, 0.888, 0.0] as const,
  hips: [0.0, 0.722, 0.0] as const,
  leftShoulder: [-0.333, 1.194, 0.0] as const,
  leftElbow: [-0.472, 0.944, 0.0] as const,
  offhand: [-0.600, 0.944, 0.0] as const,
  rightShoulder: [0.333, 1.194, 0.0] as const,
  rightElbow: [0.444, 0.972, 0.0] as const,
  mainWeapon: [0.500, 1.111, 0.0] as const,
  leftHip: [-0.138, 0.638, 0.0] as const,
  leftKnee: [-0.138, 0.416, 0.0] as const,
  rightHip: [0.138, 0.638, 0.0] as const,
  rightKnee: [0.138, 0.416, 0.0] as const,
  scarf: [0.0, 1.080, 0.0] as const,
};

// ── Bone Link Gizmo Component ──
function BoneLink({
  start,
  end,
  active = false,
}: {
  start: readonly [number, number, number];
  end: readonly [number, number, number];
  active?: boolean;
}) {
  const points = useMemo(() => {
    return [new THREE.Vector3(...start), new THREE.Vector3(...end)];
  }, [start, end]);

  const lineGeo = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  return (
    <group>
      <mesh position={start}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshBasicMaterial color={active ? "#fbbf24" : "#00f2ff"} />
      </mesh>
      <mesh position={end}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color={active ? "#fbbf24" : "#00f2ff"} />
      </mesh>
      {/* @ts-ignore */}
      <line geometry={lineGeo}>
        <lineBasicMaterial color={active ? "#fbbf24" : "#38bdf8"} transparent opacity={0.7} linewidth={2} />
      </line>
    </group>
  );
}

// ── Pixel Art Sprite Cutout Layer Component with 2.5D Thickness ──
function PixelPartLayer({
  texture,
  pivot,
  zOffset = 0,
  isSelected = false,
  label,
  onClick,
}: {
  texture: THREE.Texture;
  pivot: readonly [number, number, number];
  zOffset?: number;
  isSelected?: boolean;
  label?: string;
  onClick: (e: any) => void;
}) {
  const [px, py] = pivot;

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
    >
      {/* Front Pixel Art Plane (Sharp NearestFilter) */}
      <mesh position={[-px, 1.0 - py, zOffset + 0.005]}>
        <planeGeometry args={[2.0, 2.0]} />
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.08}
          side={THREE.DoubleSide}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Back Pixel Art Plane for 2.5D Volumetric Substance */}
      <mesh position={[-px, 1.0 - py, zOffset - 0.005]}>
        <planeGeometry args={[2.0, 2.0]} />
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.08}
          side={THREE.DoubleSide}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Selection Glow Indicator */}
      {isSelected && (
        <>
          <mesh position={[-px, 1.0 - py, zOffset]}>
            <planeGeometry args={[2.02, 2.02]} />
            <meshBasicMaterial
              color="#fbbf24"
              transparent
              opacity={0.35}
              wireframe
              side={THREE.DoubleSide}
            />
          </mesh>
          {label && (
            <Html center position={[0, 0.15, zOffset + 0.08]} style={{ pointerEvents: "none" }}>
              <div className="px-2.5 py-1 rounded-xl bg-amber-500/90 text-slate-950 font-black text-[11px] whitespace-nowrap shadow-xl border border-amber-300">
                {label}
              </div>
            </Html>
          )}
        </>
      )}
    </group>
  );
}

export const ModularPixelCharacterRig = memo(function ModularPixelCharacterRig({
  classId,
  gender,
  animState,
  showWeapon = true,
}: ModularPixelCharacterRigProps) {
  const explode = useCharacterStudioStore((s) => s.explodeDistance);
  const showGizmos = useCharacterStudioStore((s) => s.showBoneGizmos);
  const selectedPart = useCharacterStudioStore((s) => s.selectedBodyPart);
  const setSelectedPart = useCharacterStudioStore((s) => s.setSelectedBodyPart);
  const customPose = useCharacterStudioStore((s) => s.customPose);
  const isCustomActive = useCharacterStudioStore((s) => s.isCustomActive);
  const customPartsUrls = useCharacterStudioStore((s) => s.customPartsUrls);

  const rootRef = useRef<THREE.Group>(null);
  const hipsGroupRef = useRef<THREE.Group>(null);
  const torsoGroupRef = useRef<THREE.Group>(null);
  const absGroupRef = useRef<THREE.Group>(null);
  const headGroupRef = useRef<THREE.Group>(null);
  const hairGroupRef = useRef<THREE.Group>(null);
  const scarfGroupRef = useRef<THREE.Group>(null);
  const leftArmGroupRef = useRef<THREE.Group>(null);
  const leftForearmGroupRef = useRef<THREE.Group>(null);
  const offhandGroupRef = useRef<THREE.Group>(null);
  const rightArmGroupRef = useRef<THREE.Group>(null);
  const rightForearmGroupRef = useRef<THREE.Group>(null);
  const mainWeaponGroupRef = useRef<THREE.Group>(null);
  const leftLegGroupRef = useRef<THREE.Group>(null);
  const leftShinGroupRef = useRef<THREE.Group>(null);
  const rightLegGroupRef = useRef<THREE.Group>(null);
  const rightShinGroupRef = useRef<THREE.Group>(null);

  // Character folder path for authentic pixel parts
  const charKey = `${classId}_${gender}`;
  const basePath = `/assets/character-environment/modular-parts/${charKey}`;

  // Load genuine pixel art cutouts with NearestFilter
  const textures = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const load = (name: string) => {
      const customUrl = isCustomActive && customPartsUrls ? customPartsUrls[name] : null;
      const src = customUrl || `${basePath}/part_${name}.png`;
      const tex = loader.load(src, undefined, undefined, () => {
        // Fallback to default parts if class-specific folder is missing
        if (!customUrl) {
          loader.load(`/assets/character-environment/modular-parts/part_${name}.png`, (fb) => {
            fb.magFilter = THREE.NearestFilter;
            fb.minFilter = THREE.NearestFilter;
            fb.generateMipmaps = false;
            fb.colorSpace = THREE.SRGBColorSpace;
            tex.image = fb.image;
            tex.needsUpdate = true;
          });
        }
      });
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    return {
      head: load("head"),
      hair: load("hair_spikes"),
      torso: load("torso"),
      abs: load("abs"),
      hips: load("hips"),
      armLeftUpper: load("arm_left_upper"),
      armLeftForearm: load("arm_left_forearm"),
      armRightUpper: load("arm_right_upper"),
      armRightForearm: load("arm_right_forearm"),
      mainWeapon: load("main_weapon"),
      offhandWeapon: load("offhand_weapon"),
      legLeftThigh: load("leg_left_thigh"),
      legLeftFoot: load("leg_left_foot"),
      legRightThigh: load("leg_right_thigh"),
      legRightFoot: load("leg_right_foot"),
      scarf: load("scarf"),
    };
  }, [basePath, isCustomActive, customPartsUrls]);

  useEffect(() => {
    return () => {
      Object.values(textures).forEach((tex) => tex.dispose());
    };
  }, [textures]);

  // ── Articulation & Animation Loop ─────────────────────────────────────────
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // ── A. CUSTOM POSE SLIDERS OVERRIDE ──
    if (animState === "custom_pose") {
      if (headGroupRef.current) {
        headGroupRef.current.rotation.x = customPose.headPitch;
        headGroupRef.current.rotation.y = customPose.headYaw;
      }
      if (torsoGroupRef.current) {
        torsoGroupRef.current.rotation.x = customPose.torsoLean;
        torsoGroupRef.current.rotation.y = customPose.torsoTwist;
      }
      if (leftArmGroupRef.current) {
        leftArmGroupRef.current.rotation.x = customPose.leftShoulderPitch;
        leftArmGroupRef.current.rotation.z = customPose.leftShoulderRoll;
      }
      if (leftForearmGroupRef.current) {
        leftForearmGroupRef.current.rotation.x = customPose.leftElbow;
      }
      if (rightArmGroupRef.current) {
        rightArmGroupRef.current.rotation.x = customPose.rightShoulderPitch;
        rightArmGroupRef.current.rotation.z = customPose.rightShoulderRoll;
      }
      if (rightForearmGroupRef.current) {
        rightForearmGroupRef.current.rotation.x = customPose.rightElbow;
      }
      if (mainWeaponGroupRef.current) {
        mainWeaponGroupRef.current.rotation.x = customPose.weaponAngle;
      }
      if (leftLegGroupRef.current) {
        leftLegGroupRef.current.rotation.x = customPose.leftHipPitch;
      }
      if (leftShinGroupRef.current) {
        leftShinGroupRef.current.rotation.x = customPose.leftKnee;
      }
      if (rightLegGroupRef.current) {
        rightLegGroupRef.current.rotation.x = customPose.rightHipPitch;
      }
      if (rightShinGroupRef.current) {
        rightShinGroupRef.current.rotation.x = customPose.rightKnee;
      }
      if (scarfGroupRef.current) {
        scarfGroupRef.current.rotation.y = customPose.scarfWave;
      }
      return;
    }

    // ── B. IDLE BREATHING CYCLE (8 FPS Organic Breathing) ──
    if (animState === "idle") {
      const breath = Math.sin(t * 3.5) * 0.035;
      if (torsoGroupRef.current) {
        torsoGroupRef.current.position.y = (PIVOTS.torso[1] - PIVOTS.hips[1]) + breath * 0.6 + explode * 0.15;
        torsoGroupRef.current.rotation.set(0, 0, 0);
      }
      if (headGroupRef.current) {
        headGroupRef.current.position.y = (PIVOTS.head[1] - PIVOTS.torso[1]) + breath * 1.1 + explode * 0.45;
        headGroupRef.current.rotation.x = Math.sin(t * 1.8) * 0.02;
        headGroupRef.current.rotation.y = 0;
      }
      if (leftArmGroupRef.current) {
        leftArmGroupRef.current.rotation.x = Math.sin(t * 2.0) * 0.04;
        leftArmGroupRef.current.rotation.z = 0.08;
      }
      if (rightArmGroupRef.current) {
        rightArmGroupRef.current.rotation.x = -0.15 + Math.sin(t * 2.0) * 0.04;
        rightArmGroupRef.current.rotation.z = -0.08;
      }
      if (leftForearmGroupRef.current) leftForearmGroupRef.current.rotation.x = 0.1;
      if (rightForearmGroupRef.current) rightForearmGroupRef.current.rotation.x = 0.2;
      if (leftLegGroupRef.current) leftLegGroupRef.current.rotation.x = 0;
      if (rightLegGroupRef.current) rightLegGroupRef.current.rotation.x = 0;
      if (scarfGroupRef.current) {
        scarfGroupRef.current.rotation.y = Math.sin(t * 4.0) * 0.25;
      }
    }

    // ── C. RUN CYCLE (12 FPS Combat Run) ──
    else if (animState === "run") {
      const strideSpeed = 13.0;
      const legStride = Math.sin(t * strideSpeed) * 0.65;
      const bounce = Math.abs(Math.sin(t * strideSpeed)) * 0.06;

      if (torsoGroupRef.current) {
        torsoGroupRef.current.position.y = (PIVOTS.torso[1] - PIVOTS.hips[1]) + bounce + explode * 0.15;
        torsoGroupRef.current.rotation.x = 0.14;
      }
      if (headGroupRef.current) {
        headGroupRef.current.position.y = (PIVOTS.head[1] - PIVOTS.torso[1]) + bounce + explode * 0.45;
      }

      if (leftLegGroupRef.current) leftLegGroupRef.current.rotation.x = legStride;
      if (leftShinGroupRef.current) leftShinGroupRef.current.rotation.x = Math.max(0, -legStride * 0.8);

      if (rightLegGroupRef.current) rightLegGroupRef.current.rotation.x = -legStride;
      if (rightShinGroupRef.current) rightShinGroupRef.current.rotation.x = Math.max(0, legStride * 0.8);

      if (leftArmGroupRef.current) leftArmGroupRef.current.rotation.x = -legStride * 0.8;
      if (rightArmGroupRef.current) rightArmGroupRef.current.rotation.x = legStride * 0.8;
    }

    // ── D. ATTACK SLASH ──
    else if (animState === "attack_slash") {
      const slash = Math.sin(t * 18.0) * 1.4;
      if (torsoGroupRef.current) {
        torsoGroupRef.current.position.y = (PIVOTS.torso[1] - PIVOTS.hips[1]) + explode * 0.15;
        torsoGroupRef.current.rotation.y = Math.sin(t * 18.0) * 0.45;
        torsoGroupRef.current.rotation.x = 0.15;
      }
      if (headGroupRef.current) {
        headGroupRef.current.position.y = (PIVOTS.head[1] - PIVOTS.torso[1]) + explode * 0.45;
      }
      if (rightArmGroupRef.current) {
        rightArmGroupRef.current.rotation.x = -Math.PI / 3 + slash;
      }
      if (mainWeaponGroupRef.current) {
        mainWeaponGroupRef.current.rotation.x = slash * 0.8;
      }
    }

    // ── E. SKILL CAST ──
    else if (animState === "skill_cast") {
      const charge = Math.sin(t * 8.0) * 0.06;
      if (torsoGroupRef.current) {
        torsoGroupRef.current.position.y = (PIVOTS.torso[1] - PIVOTS.hips[1]) + charge + explode * 0.15;
      }
      if (headGroupRef.current) {
        headGroupRef.current.position.y = (PIVOTS.head[1] - PIVOTS.torso[1]) + charge + explode * 0.45;
      }
      if (leftArmGroupRef.current) leftArmGroupRef.current.rotation.x = -Math.PI / 2.5;
      if (rightArmGroupRef.current) rightArmGroupRef.current.rotation.x = -Math.PI / 2.5;
    }

    // ── F. DEATH ──
    else if (animState === "death") {
      if (rootRef.current) {
        rootRef.current.rotation.z = THREE.MathUtils.lerp(rootRef.current.rotation.z, Math.PI / 2.2, 0.08);
        rootRef.current.position.y = THREE.MathUtils.lerp(rootRef.current.position.y, -0.2, 0.08);
      }
    }
  });

  return (
    <group ref={rootRef} name="modular-pixel-character-rig" position={[0, 0, 0]}>
      {/* ── BONE GIZMOS (When enabled) ── */}
      {showGizmos && (
        <group name="bone-gizmos">
          <BoneLink start={PIVOTS.hips} end={PIVOTS.torso} active={selectedPart === "hips" || selectedPart === "torso"} />
          <BoneLink start={PIVOTS.torso} end={PIVOTS.head} active={selectedPart === "head"} />
          <BoneLink start={PIVOTS.torso} end={PIVOTS.leftShoulder} active={selectedPart === "left_arm"} />
          <BoneLink start={PIVOTS.leftShoulder} end={PIVOTS.leftElbow} active={selectedPart === "left_arm"} />
          <BoneLink start={PIVOTS.torso} end={PIVOTS.rightShoulder} active={selectedPart === "right_arm"} />
          <BoneLink start={PIVOTS.rightShoulder} end={PIVOTS.rightElbow} active={selectedPart === "right_arm"} />
          <BoneLink start={PIVOTS.rightElbow} end={PIVOTS.mainWeapon} active={selectedPart === "weapon_main"} />
          <BoneLink start={PIVOTS.hips} end={PIVOTS.leftHip} active={selectedPart === "left_thigh"} />
          <BoneLink start={PIVOTS.leftHip} end={PIVOTS.leftKnee} active={selectedPart === "left_shin"} />
          <BoneLink start={PIVOTS.hips} end={PIVOTS.rightHip} active={selectedPart === "right_thigh"} />
          <BoneLink start={PIVOTS.rightHip} end={PIVOTS.rightKnee} active={selectedPart === "right_shin"} />
        </group>
      )}

      {/* ── 1. HIPS & PELVIS LAYER ── */}
      <group
        ref={hipsGroupRef}
        position={[0, PIVOTS.hips[1] - explode * 0.15, 0.00]}
      >
        <PixelPartLayer
          texture={textures.hips}
          pivot={PIVOTS.hips}
          zOffset={0.00}
          isSelected={selectedPart === "hips"}
          label="Hông & Thắt Lưng Rồng (Hips)"
          onClick={() => setSelectedPart("hips")}
        />

        {/* ── 2. TORSO & CHEST LAYER (Child of Hips) ── */}
        <group
          ref={torsoGroupRef}
          position={[0, PIVOTS.torso[1] - PIVOTS.hips[1] + explode * 0.15, 0.015]}
        >
          <PixelPartLayer
            texture={textures.torso}
            pivot={PIVOTS.torso}
            zOffset={0.015}
            isSelected={selectedPart === "torso"}
            label="Thân & Giáp Ngực (Torso)"
            onClick={() => setSelectedPart("torso")}
          />

          {/* ── 3. DETACHABLE 6-PACK ABS LAYER (Lớp Cơ Bụng Rời) ── */}
          <group
            ref={absGroupRef}
            position={[0, PIVOTS.abs[1] - PIVOTS.torso[1], 0.025 + explode * 0.4]}
          >
            <PixelPartLayer
              texture={textures.abs}
              pivot={PIVOTS.abs}
              zOffset={0.025}
              isSelected={selectedPart === "abs"}
              label="Cơ Bụng 6 Múi Tách Rời (Abs Layer)"
              onClick={() => setSelectedPart("abs")}
            />
          </group>

          {/* ── 4. FLUTTERING SCARF LAYER ── */}
          <group
            ref={scarfGroupRef}
            position={[0, PIVOTS.scarf[1] - PIVOTS.torso[1], -0.04 - explode * 0.45]}
          >
            <PixelPartLayer
              texture={textures.scarf}
              pivot={PIVOTS.scarf}
              zOffset={-0.04}
              isSelected={selectedPart === "scarf_cape"}
              label="Khăn Quàng Lửa (Scarf)"
              onClick={() => setSelectedPart("scarf_cape")}
            />
          </group>

          {/* ── 5. HEAD & HAIR LAYER (Child of Torso) ── */}
          <group
            ref={headGroupRef}
            position={[0, PIVOTS.head[1] - PIVOTS.torso[1] + explode * 0.45, explode * 0.15]}
          >
            <PixelPartLayer
              texture={textures.head}
              pivot={PIVOTS.head}
              zOffset={0.03}
              isSelected={selectedPart === "head"}
              label="Đầu & Mặt Anime (Head)"
              onClick={() => setSelectedPart("head")}
            />

            {/* Hair Layer (detaches higher when exploded) */}
            <group
              ref={hairGroupRef}
              position={[0, PIVOTS.hair[1] - PIVOTS.head[1] + explode * 0.25, -explode * 0.1]}
            >
              <PixelPartLayer
                texture={textures.hair}
                pivot={PIVOTS.hair}
                zOffset={0.035}
                isSelected={selectedPart === "hair"}
                label="Mái Tóc Gai (Hair Spikes)"
                onClick={() => setSelectedPart("hair")}
              />
            </group>
          </group>

          {/* ── 6. LEFT ARM & FOREARM & SHIELD ── */}
          <group
            ref={leftArmGroupRef}
            position={[
              PIVOTS.leftShoulder[0] - explode * 0.55,
              PIVOTS.leftShoulder[1] - PIVOTS.torso[1] + explode * 0.1,
              -0.01,
            ]}
          >
            <PixelPartLayer
              texture={textures.armLeftUpper}
              pivot={PIVOTS.leftShoulder}
              zOffset={-0.01}
              isSelected={selectedPart === "left_arm"}
              label="Bắp Tay & Giáp Vai Trái"
              onClick={() => setSelectedPart("left_arm")}
            />

            <group
              ref={leftForearmGroupRef}
              position={[
                PIVOTS.leftElbow[0] - PIVOTS.leftShoulder[0] - explode * 0.35,
                PIVOTS.leftElbow[1] - PIVOTS.leftShoulder[1],
                explode * 0.15,
              ]}
            >
              <PixelPartLayer
                texture={textures.armLeftForearm}
                pivot={PIVOTS.leftElbow}
                zOffset={-0.01}
                isSelected={selectedPart === "left_forearm"}
                label="Cẳng Tay & Bàn Tay Trái"
                onClick={() => setSelectedPart("left_forearm")}
              />

              {/* Offhand Weapon / Shield */}
              <group
                ref={offhandGroupRef}
                position={[
                  PIVOTS.offhand[0] - PIVOTS.leftElbow[0] - explode * 0.3,
                  PIVOTS.offhand[1] - PIVOTS.leftElbow[1],
                  explode * 0.2,
                ]}
              >
                <PixelPartLayer
                  texture={textures.offhandWeapon}
                  pivot={PIVOTS.offhand}
                  zOffset={-0.015}
                  isSelected={selectedPart === "weapon_offhand"}
                  label="Binh Khí Phụ / Khiên"
                  onClick={() => setSelectedPart("weapon_offhand")}
                />
              </group>
            </group>
          </group>

          {/* ── 7. RIGHT ARM & FOREARM & MAIN WEAPON ── */}
          <group
            ref={rightArmGroupRef}
            position={[
              PIVOTS.rightShoulder[0] + explode * 0.55,
              PIVOTS.rightShoulder[1] - PIVOTS.torso[1] + explode * 0.1,
              0.04,
            ]}
          >
            <PixelPartLayer
              texture={textures.armRightUpper}
              pivot={PIVOTS.rightShoulder}
              zOffset={0.04}
              isSelected={selectedPart === "right_arm"}
              label="Bắp Tay & Giáp Vai Phải"
              onClick={() => setSelectedPart("right_arm")}
            />

            <group
              ref={rightForearmGroupRef}
              position={[
                PIVOTS.rightElbow[0] - PIVOTS.rightShoulder[0] + explode * 0.35,
                PIVOTS.rightElbow[1] - PIVOTS.rightShoulder[1],
                explode * 0.15,
              ]}
            >
              <PixelPartLayer
                texture={textures.armRightForearm}
                pivot={PIVOTS.rightElbow}
                zOffset={0.045}
                isSelected={selectedPart === "right_forearm"}
                label="Cẳng Tay & Chuôi Kiếm Phải"
                onClick={() => setSelectedPart("right_forearm")}
              />

              {/* Main Weapon (Greatsword / Blade) */}
              {showWeapon && (
                <group
                  ref={mainWeaponGroupRef}
                  position={[
                    PIVOTS.mainWeapon[0] - PIVOTS.rightElbow[0] + explode * 0.35,
                    PIVOTS.mainWeapon[1] - PIVOTS.rightElbow[1] + explode * 0.25,
                    0.05 + explode * 0.4,
                  ]}
                >
                  <PixelPartLayer
                    texture={textures.mainWeapon}
                    pivot={PIVOTS.mainWeapon}
                    zOffset={0.05}
                    isSelected={selectedPart === "weapon_main"}
                    label="Đại Đao Cuồng Long (Greatsword)"
                    onClick={() => setSelectedPart("weapon_main")}
                  />
                </group>
              )}
            </group>
          </group>
        </group>

        {/* ── 8. LEFT THIGH & FOOT ── */}
        <group
          ref={leftLegGroupRef}
          position={[
            PIVOTS.leftHip[0] - explode * 0.2,
            PIVOTS.leftHip[1] - PIVOTS.hips[1] - explode * 0.35,
            -0.015,
          ]}
        >
          <PixelPartLayer
            texture={textures.legLeftThigh}
            pivot={PIVOTS.leftHip}
            zOffset={-0.015}
            isSelected={selectedPart === "left_thigh"}
            label="Bắp Đùi Trái (Left Thigh)"
            onClick={() => setSelectedPart("left_thigh")}
          />

          <group
            ref={leftShinGroupRef}
            position={[
              PIVOTS.leftKnee[0] - PIVOTS.leftHip[0] - explode * 0.15,
              PIVOTS.leftKnee[1] - PIVOTS.leftHip[1] - explode * 0.3,
              0,
            ]}
          >
            <PixelPartLayer
              texture={textures.legLeftFoot}
              pivot={PIVOTS.leftKnee}
              zOffset={-0.015}
              isSelected={selectedPart === "left_foot" || selectedPart === "left_shin"}
              label="Cẳng Chân & Ủng Trái (Left Boot)"
              onClick={() => setSelectedPart("left_foot")}
            />
          </group>
        </group>

        {/* ── 9. RIGHT THIGH & FOOT ── */}
        <group
          ref={rightLegGroupRef}
          position={[
            PIVOTS.rightHip[0] + explode * 0.2,
            PIVOTS.rightHip[1] - PIVOTS.hips[1] - explode * 0.35,
            0.01,
          ]}
        >
          <PixelPartLayer
            texture={textures.legRightThigh}
            pivot={PIVOTS.rightHip}
            zOffset={0.01}
            isSelected={selectedPart === "right_thigh"}
            label="Bắp Đùi Phải (Right Thigh)"
            onClick={() => setSelectedPart("right_thigh")}
          />

          <group
            ref={rightShinGroupRef}
            position={[
              PIVOTS.rightKnee[0] - PIVOTS.rightHip[0] + explode * 0.15,
              PIVOTS.rightKnee[1] - PIVOTS.rightHip[1] - explode * 0.3,
              0,
            ]}
          >
            <PixelPartLayer
              texture={textures.legRightFoot}
              pivot={PIVOTS.rightKnee}
              zOffset={0.015}
              isSelected={selectedPart === "right_foot" || selectedPart === "right_shin"}
              label="Cẳng Chân & Ủng Phải (Right Boot)"
              onClick={() => setSelectedPart("right_foot")}
            />
          </group>
        </group>
      </group>
    </group>
  );
});
