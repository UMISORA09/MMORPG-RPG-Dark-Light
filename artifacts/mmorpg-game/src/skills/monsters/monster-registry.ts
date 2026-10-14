// ==============================================================================
// Monster Blueprint Registry & Tactical AI Mapping
// Automatically assigns AI Behavior, Telegraph Shapes & Stagger Thresholds
// ==============================================================================

import type { MonsterBlueprint, MonsterAttackPattern } from "./monster-ai.types";
import {
  BOSS_GROUND_SLAM,
  BOSS_FIRE_BREATH,
  BOSS_RAMPAGE_CHARGE,
  BOSS_DEATH_SANCTUARY,
  BOSS_METEOR_RAIN,
} from "./boss-patterns";

// ── Common Minion Attack Patterns ───────────────────────────────────────────
const SLIME_SPLASH: MonsterAttackPattern = {
  id: "slime_splash",
  name: "Bắn Axit Ăn Mòn",
  shape: "CIRCLE",
  range: 3.5,
  radiusOrWidth: 2.2,
  telegraphDurationMs: 850,
  damageMultiplier: 1.0,
  knockbackForce: 1.2,
  vfxPreset: "CYBER_PROJECTILE",
  sfxPreset: "laser_pew",
};

const WOLF_BITE: MonsterAttackPattern = {
  id: "wolf_bite",
  name: "Chồm Cắn Xé Rách",
  shape: "CIRCLE",
  range: 3.2,
  radiusOrWidth: 2.0,
  telegraphDurationMs: 750,
  damageMultiplier: 1.2,
  knockbackForce: 1.5,
  vfxPreset: "SLASH_ARC",
  sfxPreset: "blade_slash",
};

const ELITE_CHARGE: MonsterAttackPattern = {
  id: "elite_charge",
  name: "Thiết Giáp Thiết Đột",
  shape: "LINE_BOX",
  range: 8.5,
  radiusOrWidth: 2.0,
  length: 8.0,
  telegraphDurationMs: 900,
  damageMultiplier: 1.6,
  knockbackForce: 3.2,
  vfxPreset: "SLASH_ARC",
  sfxPreset: "heavy_slam",
};

const ELITE_CONE_SLAM: MonsterAttackPattern = {
  id: "elite_cone_slam",
  name: "Trảm Kích Nón 90°",
  shape: "CONE",
  range: 5.5,
  radiusOrWidth: 5.5,
  angleDeg: 90,
  telegraphDurationMs: 1000,
  damageMultiplier: 1.8,
  knockbackForce: 2.8,
  vfxPreset: "DRAGON_SHOCKWAVE",
  sfxPreset: "heavy_slam",
};

// ── Master Blueprint Registry ───────────────────────────────────────────────
export const MONSTER_BLUEPRINTS: Record<string, MonsterBlueprint> = {
  slime: {
    id: "slime",
    name: "Slime Rừng Sâu",
    archetype: "MELEE_RUSHER",
    aggroRadius: 7.0,
    leashRadius: 16.0,
    moveSpeed: 3.2,
    staggerThreshold: 120,
    attackCooldown: 2.8,
    attackPatterns: [SLIME_SPLASH],
  },
  wolf: {
    id: "wolf",
    name: "Sói Hoang Hoang Dã",
    archetype: "MELEE_RUSHER",
    aggroRadius: 8.5,
    leashRadius: 18.0,
    moveSpeed: 5.0,
    staggerThreshold: 180,
    attackCooldown: 2.4,
    attackPatterns: [WOLF_BITE],
  },
  goblin: {
    id: "goblin",
    name: "Yêu Tinh Đao Phủ",
    archetype: "ELITE_CHARGER",
    aggroRadius: 9.0,
    leashRadius: 20.0,
    moveSpeed: 4.4,
    staggerThreshold: 260,
    attackCooldown: 3.0,
    attackPatterns: [ELITE_CONE_SLAM, ELITE_CHARGE],
  },
  orc: {
    id: "orc",
    name: "Chiến Binh Orc Cổ",
    archetype: "ELITE_CHARGER",
    aggroRadius: 9.5,
    leashRadius: 22.0,
    moveSpeed: 4.0,
    staggerThreshold: 380,
    attackCooldown: 3.2,
    attackPatterns: [ELITE_CHARGE, ELITE_CONE_SLAM],
  },
  skeleton: {
    id: "skeleton",
    name: "Kỵ Sĩ Xương Cổ Đại",
    archetype: "ELITE_CHARGER",
    aggroRadius: 10.0,
    leashRadius: 24.0,
    moveSpeed: 4.2,
    staggerThreshold: 450,
    attackCooldown: 3.0,
    attackPatterns: [ELITE_CONE_SLAM, ELITE_CHARGE],
  },
  dragon: {
    id: "dragon",
    name: "Rồng Lửa Cổ Đại",
    archetype: "WORLD_BOSS",
    aggroRadius: 18.0,
    leashRadius: 40.0,
    moveSpeed: 4.8,
    staggerThreshold: 800,
    attackCooldown: 2.5,
    attackPatterns: [BOSS_GROUND_SLAM, BOSS_FIRE_BREATH, BOSS_RAMPAGE_CHARGE],
    phase2Patterns: [BOSS_DEATH_SANCTUARY, BOSS_METEOR_RAIN, BOSS_FIRE_BREATH],
  },
};

export function getMonsterBlueprint(monsterId?: string | null, level: number = 1): MonsterBlueprint {
  if (!monsterId) return MONSTER_BLUEPRINTS.slime;
  const key = monsterId.toLowerCase();

  // Exact match
  if (MONSTER_BLUEPRINTS[key]) {
    return MONSTER_BLUEPRINTS[key];
  }

  // Level-based intelligent fallback
  if (level >= 10 || key.includes("boss") || key.includes("dragon")) {
    return MONSTER_BLUEPRINTS.dragon;
  }
  if (level >= 5 || key.includes("orc") || key.includes("knight") || key.includes("goblin")) {
    return MONSTER_BLUEPRINTS.orc;
  }
  if (level >= 3) {
    return MONSTER_BLUEPRINTS.wolf;
  }
  return MONSTER_BLUEPRINTS.slime;
}
