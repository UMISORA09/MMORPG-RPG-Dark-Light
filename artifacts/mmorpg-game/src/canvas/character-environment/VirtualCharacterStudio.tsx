import { memo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { StudioLighting } from "./StudioLighting";
import { CharacterPedestal } from "./CharacterPedestal";
import { AtmosphericEffects } from "./AtmosphericEffects";
import { CharacterCameraRig } from "./CharacterCameraRig";
import { ModularPixelCharacterRig } from "./ModularPixelCharacterRig";
import { PixelArtCharacter25D } from "./PixelArtCharacter25D";
import { CombatSpriteCharacter } from "./CombatSpriteCharacter";
import { VoxelPixelCharacter3D } from "./VoxelPixelCharacter3D";
import { useCharacterStudioStore } from "./useCharacterStudioStore";
import type {
  CharacterClassId,
  CharacterGender,
  CharacterAnimationState,
  StudioLightingPresetId,
  StudioCameraPresetId,
  PedestalThemeId,
  CharacterDisplayMode,
} from "./types";

export interface VirtualCharacterStudioProps {
  classId?: CharacterClassId;
  gender?: CharacterGender;
  animationState?: CharacterAnimationState;
  displayMode?: CharacterDisplayMode;
  lightingPreset?: StudioLightingPresetId;
  cameraPreset?: StudioCameraPresetId;
  pedestalTheme?: PedestalThemeId;
  autoRotate?: boolean;
  showWeapon?: boolean;
}

export const VirtualCharacterStudio = memo(function VirtualCharacterStudio({
  classId: overrideClass,
  gender: overrideGender,
  animationState: overrideAnim,
  displayMode: overrideDisplayMode,
  lightingPreset: overrideLight,
  cameraPreset: overrideCam,
  pedestalTheme: overridePedestal,
  autoRotate: overrideAutoRotate,
  showWeapon: overrideShowWeapon,
}: VirtualCharacterStudioProps) {
  const store = useCharacterStudioStore();

  const classId = overrideClass ?? store.selectedClass;
  const gender = overrideGender ?? store.gender;
  const animState = overrideAnim ?? store.animationState;
  const displayMode = overrideDisplayMode ?? store.displayMode;
  const lightingPreset = overrideLight ?? store.lightingPreset;
  const cameraPreset = overrideCam ?? store.cameraPreset;
  const pedestalTheme = overridePedestal ?? store.pedestalTheme;
  const isAutoRotating = overrideAutoRotate ?? store.isAutoRotating;
  const showWeapon = overrideShowWeapon ?? store.showWeapon;

  const pedestalGroupRef = useRef<THREE.Group>(null);
  const characterGroupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (isAutoRotating) {
      if (pedestalGroupRef.current) {
        pedestalGroupRef.current.rotation.y += delta * store.rotationSpeed;
      }
      if (
        (displayMode === "modular_pixel_rig" || displayMode === "3d_voxel_pixel") &&
        characterGroupRef.current
      ) {
        characterGroupRef.current.rotation.y += delta * store.rotationSpeed;
      }
    }
  });

  return (
    <group name="virtual-character-studio-root">
      {/* ── Environment Lighting ── */}
      <StudioLighting presetId={lightingPreset} />

      {/* ── Interactive Pedestal (Rotates smoothly on turntable) ── */}
      <group ref={pedestalGroupRef}>
        <CharacterPedestal themeId={pedestalTheme} />
      </group>

      {/* ── Atmospheric Motes & Particles ── */}
      <AtmosphericEffects themeId={pedestalTheme} enabled={store.showParticles} />

      {/* ── Center Stage: Modular Pixel Character Rig / Pixel Art Modes ── */}
      <group ref={characterGroupRef} position={[0, 0.16, 0]}>
        {displayMode === "modular_pixel_rig" && (
          /* 1. Modular Pixel Character Rig (Tách từng bộ phận khớp xương để dễ tạo hoạt ảnh) */
          <ModularPixelCharacterRig
            classId={classId}
            gender={gender}
            animState={animState}
            showWeapon={showWeapon}
          />
        )}

        {displayMode === "2d_pixel_hd" && (
          /* 2. Official HD Pixel Art Hero (360x360 Nearest-Neighbor Texture with 6-pack abs & anime hair) */
          <PixelArtCharacter25D
            classId={classId}
            gender={gender}
            animState={animState}
          />
        )}

        {displayMode === "2d_combat_anim" && (
          /* 3. 9-Row Animated Combat Spritesheet Cycling Frame-by-Frame */
          <CombatSpriteCharacter
            classId={classId}
            gender={gender}
            animState={animState}
          />
        )}

        {displayMode === "3d_voxel_pixel" && (
          /* 4. True 3D Voxel Pixel Character (Stepped Pixel Cubes) */
          <VoxelPixelCharacter3D
            classId={classId}
            gender={gender}
            animState={animState}
            showWeapon={showWeapon}
          />
        )}
      </group>

      {/* ── Camera Rig & Orbit Controls ── */}
      <CharacterCameraRig presetId={cameraPreset} />
    </group>
  );
});
