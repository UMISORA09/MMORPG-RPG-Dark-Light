// ==============================================================================
// Boss Raid Attack Patterns — Tactical Telegraphs & 2-Phase Enrage Mechanics
// ==============================================================================

import type { MonsterAttackPattern } from "./monster-ai.types";

// ── Phase 1 Patterns (HP > 50%) ─────────────────────────────────────────────
export const BOSS_GROUND_SLAM: MonsterAttackPattern = {
  id: "boss_ground_slam",
  name: "Trọng Kích Hủy Diệt",
  shape: "CIRCLE",
  range: 5.5,
  radiusOrWidth: 5.2,
  telegraphDurationMs: 1100,
  damageMultiplier: 2.2,
  knockbackForce: 4.0,
  vfxPreset: "DRAGON_SHOCKWAVE",
  sfxPreset: "heavy_slam",
};

export const BOSS_FIRE_BREATH: MonsterAttackPattern = {
  id: "boss_fire_breath",
  name: "Hơi Thở Hắc Long",
  shape: "CONE",
  range: 8.5,
  radiusOrWidth: 9.0,
  angleDeg: 120,
  telegraphDurationMs: 1200,
  damageMultiplier: 2.5,
  knockbackForce: 3.0,
  vfxPreset: "DRAGON_SHOCKWAVE",
  sfxPreset: "dragon_roar",
};

export const BOSS_RAMPAGE_CHARGE: MonsterAttackPattern = {
  id: "boss_rampage_charge",
  name: "Lao Tới Nghiền Nát",
  shape: "LINE_BOX",
  range: 11.0,
  radiusOrWidth: 2.6,
  length: 10.5,
  telegraphDurationMs: 950,
  damageMultiplier: 2.0,
  knockbackForce: 5.0,
  vfxPreset: "SLASH_ARC",
  sfxPreset: "heavy_slam",
};

// ── Phase 2 Enrage Patterns (HP <= 50%) ─────────────────────────────────────
export const BOSS_DEATH_SANCTUARY: MonsterAttackPattern = {
  id: "boss_death_sanctuary",
  name: "Lãnh Địa Tử Thần (Né Vào Chân Boss!)",
  shape: "DONUT_RING",
  range: 12.0,
  radiusOrWidth: 12.5,
  innerSafeRadius: 4.2, // SAFE ZONE inside core 4.2m!
  telegraphDurationMs: 1350,
  damageMultiplier: 3.5,
  knockbackForce: 6.0,
  vfxPreset: "BOSS_METEOR_AOE",
  sfxPreset: "dragon_roar",
};

export const BOSS_METEOR_RAIN: MonsterAttackPattern = {
  id: "boss_meteor_rain",
  name: "Mưa Thiên Thạch Tận Thế",
  shape: "CIRCLE",
  range: 14.0,
  radiusOrWidth: 3.8,
  telegraphDurationMs: 800,
  damageMultiplier: 1.8,
  knockbackForce: 2.5,
  vfxPreset: "BOSS_METEOR_AOE",
  sfxPreset: "laser_pew",
};
