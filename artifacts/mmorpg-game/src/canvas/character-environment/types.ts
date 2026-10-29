export type StudioLightingPresetId =
  | "cinematic_dark_fantasy"
  | "cyberpunk_neon"
  | "celestial_gold"
  | "neutral_studio";

export type StudioCameraPresetId =
  | "full_body"
  | "portrait"
  | "three_quarter_action"
  | "weapon_inspect"
  | "back_profile";

export type PedestalThemeId =
  | "dark_fantasy_runic"
  | "cyberpunk_hologram"
  | "celestial_altar"
  | "minimal_studio";

export type CharacterClassId =
  | "fighter"
  | "tank"
  | "assassin"
  | "gunner"
  | "hero_base";

export type CharacterGender = "male" | "female";

export type CharacterAnimationState =
  | "idle"
  | "run"
  | "attack_slash"
  | "skill_cast"
  | "death"
  | "custom_pose";

export type CharacterDisplayMode =
  | "modular_pixel_rig" // Chế độ tách từng bộ phận khớp xương để dễ tạo hoạt ảnh
  | "2d_pixel_hd"        // Chân dung pixel HD gốc
  | "2d_combat_anim"     // Ảnh động combat 9 hàng
  | "3d_voxel_pixel"     // Voxel 3D pixel cubes
  | "custom_creator";    // Phòng tự tạo & thiết kế nhân vật pixel trực tiếp

export type BodyPartId =
  | "head"
  | "hair"
  | "torso"
  | "abs"
  | "hips"
  | "left_arm"
  | "left_forearm"
  | "right_arm"
  | "right_forearm"
  | "weapon_main"
  | "weapon_offhand"
  | "left_thigh"
  | "left_shin"
  | "left_foot"
  | "right_thigh"
  | "right_shin"
  | "right_foot"
  | "scarf_cape";

export interface ModularRigPose {
  headPitch: number;       // Cúi / Ngửa đầu (X)
  headYaw: number;         // Quay đầu trái / phải (Y)
  torsoLean: number;       // Nghiêng người tới / lui (X)
  torsoTwist: number;      // Vặn eo (Y)
  leftShoulderPitch: number;
  leftShoulderRoll: number;
  leftElbow: number;
  rightShoulderPitch: number;
  rightShoulderRoll: number;
  rightElbow: number;
  weaponAngle: number;
  leftHipPitch: number;
  leftKnee: number;
  rightHipPitch: number;
  rightKnee: number;
  scarfWave: number;
}

export interface LightingConfig {
  id: StudioLightingPresetId;
  name: string;
  description: string;
  ambient: {
    color: string;
    intensity: number;
  };
  keyLight: {
    color: string;
    intensity: number;
    position: [number, number, number];
    castShadow?: boolean;
  };
  fillLight: {
    color: string;
    intensity: number;
    position: [number, number, number];
  };
  rimLight: {
    color: string;
    intensity: number;
    position: [number, number, number];
  };
  groundBounce?: {
    color: string;
    intensity: number;
  };
  fog: {
    color: string;
    near: number;
    far: number;
  };
}

export interface CameraPresetConfig {
  id: StudioCameraPresetId;
  name: string;
  description: string;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  minDistance: number;
  maxDistance: number;
}

export interface PedestalConfig {
  id: PedestalThemeId;
  name: string;
  radius: number;
  height: number;
  baseColor: string;
  runeGlowColor: string;
  outerRingColor: string;
  particles: {
    color: string;
    count: number;
    speed: number;
  };
}
