// ==============================================================================
// Master Monster Blueprint & Pattern Registry
// Defines base AI behaviors, aggro, telegraph patterns, and phase mechanics
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
  range: 3.8,
  radiusOrWidth: 2.75, // +25% radius
  telegraphDurationMs: 700, // Faster windup
  damageMultiplier: 1.0,
  knockbackForce: 1.2,
  vfxPreset: "CYBER_PROJECTILE",
  sfxPreset: "laser_pew",
  debuff: {
    type: "SLOW",
    name: "Làm Chậm Axit",
    icon: "🐌",
    durationSeconds: 3.0,
    magnitude: 0.4, // -40% speed
  },
};

const WOLF_BITE: MonsterAttackPattern = {
  id: "wolf_bite",
  name: "Chồm Cắn Xé Rách",
  shape: "CIRCLE",
  range: 3.5,
  radiusOrWidth: 2.5, // +25% radius
  telegraphDurationMs: 650, // Rapid bite
  damageMultiplier: 1.2,
  knockbackForce: 1.5,
  vfxPreset: "SLASH_ARC",
  sfxPreset: "blade_slash",
  debuff: {
    type: "BLEED",
    name: "Xé Rách Chảy Máu",
    icon: "🩸",
    durationSeconds: 3.0,
    tickInterval: 0.5,
    tickDamage: 12,
  },
};

const VOID_MAGE_ORB: MonsterAttackPattern = {
  id: "void_mage_orb",
  name: "Cầu Ma Pháp Hư Không",
  shape: "CIRCLE",
  range: 7.5,
  radiusOrWidth: 2.8,
  telegraphDurationMs: 750,
  damageMultiplier: 1.4,
  knockbackForce: 1.0,
  vfxPreset: "CYBER_PROJECTILE",
  sfxPreset: "laser_pew",
  debuff: {
    type: "POISON",
    name: "Kịch Độc Ma Thuật",
    icon: "☠️",
    durationSeconds: 3.0,
    tickInterval: 0.5,
    tickDamage: 15,
  },
};

const ELITE_CHARGE: MonsterAttackPattern = {
  id: "elite_charge",
  name: "Thiết Giáp Thiết Đột",
  shape: "LINE_BOX",
  range: 10.0,
  radiusOrWidth: 2.5, // +25% width
  length: 10.0, // +25% length
  telegraphDurationMs: 800, // Faster charge windup
  damageMultiplier: 1.6,
  knockbackForce: 3.5,
  vfxPreset: "SLASH_ARC",
  sfxPreset: "heavy_slam",
  debuff: {
    type: "STUN",
    name: "Choáng Thiết Đột",
    icon: "💫",
    durationSeconds: 1.2,
  },
};

const ELITE_CONE_SLAM: MonsterAttackPattern = {
  id: "elite_cone_slam",
  name: "Trảm Kích Nón 100°",
  shape: "CONE",
  range: 6.8,
  radiusOrWidth: 6.8, // +25% radius
  angleDeg: 100, // +10 deg
  telegraphDurationMs: 850,
  damageMultiplier: 1.8,
  knockbackForce: 3.0,
  vfxPreset: "DRAGON_SHOCKWAVE",
  sfxPreset: "heavy_slam",
  debuff: {
    type: "SLOW",
    name: "Chấn Động Tê Liệt",
    icon: "🌪️",
    durationSeconds: 2.5,
    magnitude: 0.35,
  },
};

// ── Master Blueprint Registry ───────────────────────────────────────────────
export const MONSTER_BLUEPRINTS: Record<string, MonsterBlueprint> = {
  slime: {
    id: "slime",
    name: "Slime Rừng Sâu",
    archetype: "SWARM_PACK",
    aggroRadius: 7.0,
    leashRadius: 16.0,
    moveSpeed: 3.2,
    staggerThreshold: 120,
    attackCooldown: 2.2,
    attackPatterns: [SLIME_SPLASH],
  },
  wolf: {
    id: "wolf",
    name: "Sói Hoang Hoang Dã",
    archetype: "SWARM_PACK",
    aggroRadius: 8.5,
    leashRadius: 18.0,
    moveSpeed: 5.0,
    staggerThreshold: 180,
    attackCooldown: 2.0,
    attackPatterns: [WOLF_BITE],
  },
  goblin: {
    id: "goblin",
    name: "Yêu Tinh Đao Phủ",
    archetype: "SWARM_PACK",
    aggroRadius: 9.0,
    leashRadius: 20.0,
    moveSpeed: 4.4,
    staggerThreshold: 260,
    attackCooldown: 2.4,
    attackPatterns: [ELITE_CONE_SLAM, ELITE_CHARGE],
  },
  orc: {
    id: "orc",
    name: "Chiến Binh Orc Cổ",
    archetype: "LONE_PREDATOR",
    aggroRadius: 9.5,
    leashRadius: 22.0,
    moveSpeed: 4.0,
    staggerThreshold: 380,
    attackCooldown: 2.6,
    attackPatterns: [ELITE_CHARGE, ELITE_CONE_SLAM],
  },
  skeleton: {
    id: "skeleton",
    name: "Kỵ Sĩ Xương Cổ Đại",
    archetype: "LONE_PREDATOR",
    aggroRadius: 10.0,
    leashRadius: 24.0,
    moveSpeed: 4.2,
    staggerThreshold: 450,
    attackCooldown: 2.5,
    attackPatterns: [ELITE_CONE_SLAM, ELITE_CHARGE, VOID_MAGE_ORB],
  },
  dragon: {
    id: "dragon",
    name: "Rồng Lửa Cổ Đại",
    archetype: "WORLD_BOSS",
    aggroRadius: 18.0,
    leashRadius: 40.0,
    moveSpeed: 4.8,
    staggerThreshold: 800,
    attackCooldown: 2.2,
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
