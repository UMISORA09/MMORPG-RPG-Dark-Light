import { create } from "zustand";
import type {
  CharacterClassId,
  CharacterGender,
  CharacterAnimationState,
  StudioLightingPresetId,
  StudioCameraPresetId,
  PedestalThemeId,
  CharacterDisplayMode,
  BodyPartId,
  ModularRigPose,
  BlenderModelStats,
} from "./types";
import {
  type CustomCharacterConfig,
  PRESET_CUSTOM_CHARACTERS,
} from "./proceduralPixelGenerator";

interface CharacterStudioState {
  // Character Selection
  selectedClass: CharacterClassId;
  gender: CharacterGender;
  animationState: CharacterAnimationState;
  displayMode: CharacterDisplayMode;

  // Blender 3D Model Integration State
  blenderModelUrl: string | null;
  blenderCustomFile: File | null;
  blenderModelStats: BlenderModelStats | null;
  showWireframe: boolean;
  showSkeletonHelper: boolean;
  cosmicEnvironmentActive: boolean;

  // Custom Character Creator & Procedural State
  customConfig: CustomCharacterConfig;
  customStandeeUrl: string | null;
  customPartsUrls: Record<string, string> | null;
  isCustomActive: boolean;

  // Modular Rig & Animation Splitting Controls
  explodeDistance: number;          // 0.0 (ráp liền) đến 1.0 (tách rời hoàn toàn các bộ phận)
  showBoneGizmos: boolean;          // Hiển thị khung xương / đường nối khớp
  selectedBodyPart: BodyPartId | null; // Bộ phận đang được chọn để chỉnh góc xoay
  customPose: ModularRigPose;       // Các góc xoay của từng khớp xương

  // Environment Settings
  lightingPreset: StudioLightingPresetId;
  cameraPreset: StudioCameraPresetId;
  pedestalTheme: PedestalThemeId;

  // Visual Controls
  isAutoRotating: boolean;
  rotationSpeed: number;
  showWeapon: boolean;
  showParticles: boolean;
  showAura: boolean;
  turntableAngle: number;

  // Actions
  setSelectedClass: (classId: CharacterClassId) => void;
  setGender: (gender: CharacterGender) => void;
  setAnimationState: (anim: CharacterAnimationState) => void;
  setDisplayMode: (mode: CharacterDisplayMode) => void;
  setCustomConfig: (cfg: Partial<CustomCharacterConfig>) => void;
  setCustomGeneratedAssets: (
    standee: string | null,
    parts: Record<string, string> | null
  ) => void;
  setIsCustomActive: (active: boolean) => void;
  setExplodeDistance: (distance: number) => void;
  setShowBoneGizmos: (show: boolean) => void;
  setSelectedBodyPart: (part: BodyPartId | null) => void;
  setCustomPosePart: (key: keyof ModularRigPose, value: number) => void;
  applyFullPose: (pose: Partial<ModularRigPose>) => void;
  resetCustomPose: () => void;
  setLightingPreset: (preset: StudioLightingPresetId) => void;
  setCameraPreset: (preset: StudioCameraPresetId) => void;
  setPedestalTheme: (theme: PedestalThemeId) => void;
  setIsAutoRotating: (rotating: boolean) => void;
  setRotationSpeed: (speed: number) => void;
  setShowWeapon: (show: boolean) => void;
  setShowParticles: (show: boolean) => void;
  setShowAura: (show: boolean) => void;
  setTurntableAngle: (angle: number) => void;
  setBlenderModelUrl: (url: string | null) => void;
  setBlenderCustomFile: (file: File | null) => void;
  setBlenderModelStats: (stats: BlenderModelStats | null) => void;
  setShowWireframe: (show: boolean) => void;
  setShowSkeletonHelper: (show: boolean) => void;
  setCosmicEnvironmentActive: (active: boolean) => void;
  resetStudio: () => void;
}

const DEFAULT_POSE: ModularRigPose = {
  headPitch: 0,
  headYaw: 0,
  torsoLean: 0,
  torsoTwist: 0,
  leftShoulderPitch: 0.1,
  leftShoulderRoll: 0.15,
  leftElbow: 0.2,
  rightShoulderPitch: -0.2,
  rightShoulderRoll: -0.15,
  rightElbow: 0.35,
  weaponAngle: -0.8,
  leftHipPitch: 0,
  leftKnee: 0,
  rightHipPitch: 0,
  rightKnee: 0,
  scarfWave: 0,
};

const DEFAULT_STATE = {
  selectedClass: "fighter" as CharacterClassId,
  gender: "male" as CharacterGender,
  animationState: "idle" as CharacterAnimationState,
  displayMode: "modular_pixel_rig" as CharacterDisplayMode, // MẶC ĐỊNH: Tách từng bộ phận khớp xương để dễ tạo hoạt ảnh!
  blenderModelUrl: null as string | null,
  blenderCustomFile: null as File | null,
  blenderModelStats: null as BlenderModelStats | null,
  showWireframe: false,
  showSkeletonHelper: false,
  cosmicEnvironmentActive: true,
  customConfig: { ...PRESET_CUSTOM_CHARACTERS[0] },
  customStandeeUrl: null as string | null,
  customPartsUrls: null as Record<string, string> | null,
  isCustomActive: false,
  explodeDistance: 0.0,
  showBoneGizmos: true,
  selectedBodyPart: null as BodyPartId | null,
  customPose: { ...DEFAULT_POSE },
  lightingPreset: "cosmic_nebula" as StudioLightingPresetId,
  cameraPreset: "full_body" as StudioCameraPresetId,
  pedestalTheme: "cosmic_void" as PedestalThemeId,
  isAutoRotating: false, // Dừng xoay để người dùng dễ thao tác khớp xương
  rotationSpeed: 0.5,
  showWeapon: true,
  showParticles: true,
  showAura: true,
  turntableAngle: 0,
};

export const useCharacterStudioStore = create<CharacterStudioState>((set) => ({
  ...DEFAULT_STATE,

  setSelectedClass: (selectedClass) => set({ selectedClass }),
  setGender: (gender) => set({ gender }),
  setAnimationState: (animationState) => set({ animationState }),
  setDisplayMode: (displayMode) => set({ displayMode }),
  setBlenderModelUrl: (blenderModelUrl) => set({ blenderModelUrl, displayMode: "blender_3d" }),
  setBlenderCustomFile: (blenderCustomFile) => set({ blenderCustomFile, displayMode: "blender_3d" }),
  setBlenderModelStats: (blenderModelStats) => set({ blenderModelStats }),
  setShowWireframe: (showWireframe) => set({ showWireframe }),
  setShowSkeletonHelper: (showSkeletonHelper) => set({ showSkeletonHelper }),
  setCosmicEnvironmentActive: (cosmicEnvironmentActive) => set({ cosmicEnvironmentActive }),
  setCustomConfig: (cfg) =>
    set((state) => ({
      customConfig: { ...state.customConfig, ...cfg },
      isCustomActive: true,
    })),
  setCustomGeneratedAssets: (customStandeeUrl, customPartsUrls) =>
    set({ customStandeeUrl, customPartsUrls, isCustomActive: true }),
  setIsCustomActive: (isCustomActive) => set({ isCustomActive }),
  setExplodeDistance: (explodeDistance) => set({ explodeDistance }),
  setShowBoneGizmos: (showBoneGizmos) => set({ showBoneGizmos }),
  setSelectedBodyPart: (selectedBodyPart) => set({ selectedBodyPart }),
  setCustomPosePart: (key, value) =>
    set((state) => ({
      customPose: {
        ...state.customPose,
        [key]: value,
      },
    })),
  applyFullPose: (pose) =>
    set((state) => ({
      customPose: {
        ...state.customPose,
        ...pose,
      },
      animationState: "custom_pose",
      displayMode: "modular_pixel_rig",
    })),
  resetCustomPose: () => set({ customPose: { ...DEFAULT_POSE } }),
  setLightingPreset: (lightingPreset) => set({ lightingPreset }),
  setCameraPreset: (cameraPreset) => set({ cameraPreset }),
  setPedestalTheme: (pedestalTheme) => set({ pedestalTheme }),
  setIsAutoRotating: (isAutoRotating) => set({ isAutoRotating }),
  setRotationSpeed: (rotationSpeed) => set({ rotationSpeed }),
  setShowWeapon: (showWeapon) => set({ showWeapon }),
  setShowParticles: (showParticles) => set({ showParticles }),
  setShowAura: (showAura) => set({ showAura }),
  setTurntableAngle: (turntableAngle) => set({ turntableAngle }),
  resetStudio: () => set(DEFAULT_STATE),
}));
