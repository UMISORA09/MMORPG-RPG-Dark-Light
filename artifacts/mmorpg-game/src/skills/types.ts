// ==============================================================================
// AAA Production-Ready Character & Skill Factory Architecture
// Compatible with @workspace/api-zod and PostgreSQL @workspace/db
// ==============================================================================

import type { CharacterClass, Skill } from "@workspace/api-zod";

export type VFXType =
  | "SLASH_ARC"
  | "TWIN_SLASH"
  | "CYBER_PROJECTILE"
  | "LASER_BARRAGE"
  | "DRAGON_SHOCKWAVE"
  | "HOLY_SHIELD_DOME"
  | "DASH_AFTERIMAGE"
  | "BOSS_METEOR_AOE"
  | "explosion";

export interface SkillVFXConfig {
  type: VFXType;
  primaryColor: string;
  secondaryColor: string;
  scale: number;
  duration: number; // in seconds
  soundFreq?: number;
}

export type SkillSlot =
  | "BASIC_1"
  | "BASIC_2"
  | "BASIC_3"
  | "SKILL_1"
  | "SKILL_2"
  | "SKILL_3"
  | "ULTIMATE";

export interface MovementPhysics {
  selfMovement:
    | "NONE"
    | "STEP_FORWARD"
    | "DASH_THROUGH_TARGET"
    | "BACKFLIP_EVADE"
    | "LEAP_TO_TARGET";
  moveDistance: number; // in meters
  grantInvulnerabilityMs?: number; // i-frame duration in milliseconds
}

export type HitShapeType =
  | "CIRCLE_AOE"
  | "CONE_120"
  | "CONE_FRONT"
  | "ARC_SWEEP"
  | "LINE_PIERCE"
  | "PROJECTILE_SINGLE"
  | "PROJECTILE_SPREAD";

export interface CrowdControlEffect {
  type: "NONE" | "KNOCKBACK" | "PULL_VORTEX" | "STUN" | "SLOW" | "AIRBORNE" | "TAUNT";
  value: number; // distance in meters or slow percentage (0.0 to 1.0)
  durationMs: number;
}

export interface TargetImpact {
  hitShape: HitShapeType;
  range: number;
  aoeRadius: number;
  damageMultiplier: number;
  critBonus: number; // e.g. 0.2 = +20% crit chance
  crowdControl: CrowdControlEffect;
}

export type SFXSynthPreset =
  | "laser_pew"
  | "blade_slash"
  | "heavy_slam"
  | "dragon_roar"
  | "holy_bell"
  | "coin_chime"
  | "loot_drop"
  | "rarity_chime"
  | "level_up_fanfare"
  | "button_click"
  | "teleport"
  | "buff"
  | "chest_open";

export interface GameFeelSpec {
  cameraShake: number; // 0.0 to 1.0 (screen impulse)
  hitStopMs: number; // micro-pause impact feeling in ms (e.g. 35ms)
  vfxPreset: string;
  sfxSynthPreset: SFXSynthPreset;
}

export interface CombatSkillSpec {
  id: string;
  name: string;
  description: string;
  slot: SkillSlot;
  keybind: "J" | "K" | "L" | "U" | "1" | "2" | "3" | "4" | "Q" | "E" | "R" | "F" | string;
  windupMs: number;
  activeMs: number;
  recoveryMs: number;
  cooldown: number; // in seconds
  movementPhysics: MovementPhysics;
  targetImpact: TargetImpact;
  gameFeel: GameFeelSpec;
  vfx: SkillVFXConfig;
}

// ── Backward-compatible SkillBlueprint alias ──────────────────────────────────
export interface SkillBlueprint {
  id: string;
  name: string;
  description: string;
  keybind: "J" | "K" | "L" | "U" | "1" | "2" | "3" | "4" | "Q" | "E" | "R" | "F" | string;
  damageMultiplier: number;
  cooldown: number;
  range: number;
  aoeRadius: number;
  vfx: SkillVFXConfig;
  movementEffect?: {
    type: "DASH_FORWARD" | "LEAP" | "KNOCKBACK";
    distance: number;
  };
}

export interface CharacterVisualAnatomy {
  silhouette: "slim_agile" | "tactical_medium" | "muscular_heavy" | "colossus_armored";
  palette: {
    armorPrimary: string;
    armorSecondary: string;
    clothTrim: string;
    eyeGlow: string;
    energyCore: string;
    skinTone: string;
  };
  headgear:
    | "cyber_visor"
    | "shadow_hood_mask"
    | "dragon_horned_helm"
    | "paladin_winged_crown"
    | "none";
  backAttachment:
    | "energy_jetpack"
    | "tattered_shadow_scarf"
    | "twin_dragon_banners"
    | "floating_holy_halo"
    | "none";
  weaponVisual: {
    type:
      | "dual_pistols"
      | "twin_katana_daggers"
      | "blazing_gauntlets"
      | "tower_shield_warhammer";
    trailColor: string;
    glowIntensity: number;
    dynamicallyTintByEquippedItem: boolean;
  };
  hitbox: {
    radius: number;
    height: number;
    shadowScale: number;
  };
}

export interface ClassPassiveSpec {
  id: string;
  name: string;
  description: string;
  icon: string;
  triggerCondition: string;
  effectDescription: string;
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
  emoji: string;
  color: string;
  anatomy: CharacterVisualAnatomy;
  passive: ClassPassiveSpec;
  baseStats: CharacterBaseStats;
  comboAttacks: [CombatSkillSpec, CombatSkillSpec, CombatSkillSpec];
  skills: CombatSkillSpec[];

  // Legacy compatibility getters / properties
  visual: {
    primaryColor: string;
    glowColor: string;
    weaponType: "dual_guns" | "twin_blades" | "dragon_fists" | "shield_hammer";
    spriteSheetUrl: string;
  };
  basicAttack: SkillBlueprint;
}

// ── Converter to API Schema (CharacterClass from @workspace/api-zod) ─────────
export function toApiCharacterClass(bp: CharacterClassBlueprint): CharacterClass {
  const apiSkills: Skill[] = [
    {
      name: bp.comboAttacks[0].name,
      description: bp.comboAttacks[0].description,
      damage: Math.round(bp.baseStats.atk * bp.comboAttacks[0].targetImpact.damageMultiplier),
      cooldown: bp.comboAttacks[0].cooldown,
    },
    ...bp.skills.map((s) => ({
      name: s.name,
      description: s.description,
      damage: Math.round(bp.baseStats.atk * s.targetImpact.damageMultiplier),
      cooldown: s.cooldown,
    })),
  ];

  return {
    id: bp.classId,
    name: bp.className,
    description: `${bp.title} — ${bp.role}. Nội tại: [${bp.passive.name}] ${bp.passive.description}`,
    role: bp.role,
    baseHp: bp.baseStats.hp,
    baseAtk: bp.baseStats.atk,
    baseDef: bp.baseStats.def,
    baseSpd: bp.baseStats.spd,
    skills: apiSkills,
    color: bp.color,
    emoji: bp.emoji,
  };
}
