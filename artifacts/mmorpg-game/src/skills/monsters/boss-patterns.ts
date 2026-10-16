// ==============================================================================
// Boss Raid Attack Patterns — Tactical Telegraphs & 2-Phase Enrage Mechanics
// Faster, Crisp Windups (650ms - 950ms) and 25% Wider Coverage
// ==============================================================================

import type { MonsterAttackPattern } from "./monster-ai.types";

// ── Phase 1 Patterns (HP > 50%) ─────────────────────────────────────────────
export const BOSS_GROUND_SLAM: MonsterAttackPattern = {
  id: "boss_ground_slam",
  name: "Trọng Kích Hủy Diệt",
  shape: "CIRCLE",
  range: 6.8,
  radiusOrWidth: 6.5, // +25%
  telegraphDurationMs: 850,
  damageMultiplier: 2.2,
  knockbackForce: 4.5,
  vfxPreset: "DRAGON_SHOCKWAVE",
  sfxPreset: "heavy_slam",
};

export const BOSS_FIRE_BREATH: MonsterAttackPattern = {
  id: "boss_fire_breath",
  name: "Hơi Thở Hắc Long",
  shape: "CONE",
  range: 10.5,
  radiusOrWidth: 11.2, // +25%
  angleDeg: 125,
  telegraphDurationMs: 900,
  damageMultiplier: 2.5,
  knockbackForce: 3.5,
  vfxPreset: "DRAGON_SHOCKWAVE",
  sfxPreset: "dragon_roar",
};

export const BOSS_RAMPAGE_CHARGE: MonsterAttackPattern = {
  id: "boss_rampage_charge",
  name: "Lao Tới Nghiền Nát",
  shape: "LINE_BOX",
  range: 13.0,
  radiusOrWidth: 3.25, // +25%
  length: 13.0,
  telegraphDurationMs: 750,
  damageMultiplier: 2.0,
  knockbackForce: 5.5,
  vfxPreset: "SLASH_ARC",
  sfxPreset: "heavy_slam",
};

// ── Phase 2 Enrage Patterns (HP <= 50%) ─────────────────────────────────────
export const BOSS_DEATH_SANCTUARY: MonsterAttackPattern = {
  id: "boss_death_sanctuary",
  name: "Lãnh Địa Tử Thần (Né Vào Chân Boss!)",
  shape: "DONUT_RING",
  range: 15.0,
  radiusOrWidth: 15.5, // +25%
  innerSafeRadius: 4.0, // Safe sanctuary core
  telegraphDurationMs: 950,
  damageMultiplier: 3.5,
  knockbackForce: 6.5,
  vfxPreset: "BOSS_METEOR_AOE",
  sfxPreset: "dragon_roar",
};

export const BOSS_METEOR_RAIN: MonsterAttackPattern = {
  id: "boss_meteor_rain",
  name: "Mưa Thiên Thạch Tận Thế",
  shape: "CIRCLE",
  range: 16.0,
  radiusOrWidth: 4.8, // +25%
  telegraphDurationMs: 650,
  damageMultiplier: 1.8,
  knockbackForce: 3.0,
  vfxPreset: "BOSS_METEOR_AOE",
  sfxPreset: "laser_pew",
};
