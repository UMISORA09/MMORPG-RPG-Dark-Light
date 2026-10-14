// ==============================================================================
// Skill & Character Factory Types (Data-Driven Architecture)
// ==============================================================================

export type VFXType =
  | "SLASH_ARC"
  | "TWIN_SLASH"
  | "CYBER_PROJECTILE"
  | "LASER_BARRAGE"
  | "DRAGON_SHOCKWAVE"
  | "HOLY_SHIELD_DOME"
  | "DASH_AFTERIMAGE"
  | "BOSS_METEOR_AOE";

export interface SkillVFXConfig {
  type: VFXType;
  primaryColor: string;
  secondaryColor: string;
  scale: number;
  duration: number; // in seconds
  soundFreq?: number;
}

export interface SkillMovementEffect {
  type: "DASH_FORWARD" | "LEAP" | "KNOCKBACK";
  distance: number;
}

export interface SkillBlueprint {
  id: string;
  name: string;
  description: string;
  keybind: "J" | "K" | "L" | "U" | "1" | "2" | "3" | "4";
  damageMultiplier: number;
  cooldown: number; // in seconds
  range: number; // in meters
  aoeRadius: number; // in meters, 0 for single-target
  vfx: SkillVFXConfig;
  movementEffect?: SkillMovementEffect;
}

export interface CharacterVisualConfig {
  primaryColor: string;
  glowColor: string;
  weaponType: "dual_guns" | "twin_blades" | "dragon_fists" | "shield_hammer";
  spriteSheetUrl: string;
}

export interface CharacterBaseStats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
  attackRange: number;
}

export interface CharacterClassBlueprint {
  classId: "gunner" | "assassin" | "fighter" | "tank" | string;
  className: string;
  title: string;
  role: string;
  visual: CharacterVisualConfig;
  baseStats: CharacterBaseStats;
  basicAttack: SkillBlueprint;
  skills: SkillBlueprint[];
}
