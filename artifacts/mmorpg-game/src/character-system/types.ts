/**
 * Chiến Long Bá — Hệ Thống Định Nghĩa Nhân Vật Pixel Art Toàn Diện
 * (Unified Pixel Art Character System)
 */

export type PixelCharacterClassId = "fighter" | "tank" | "assassin" | "gunner";

export type PixelCharacterGender = "male" | "female";

export type PixelAnimationState =
  | "idle"
  | "run"
  | "walk"
  | "jump"
  | "fall"
  | "attack1"
  | "attack2"
  | "attack3"
  | "attack4"
  | "air_attack"
  | "hurt"
  | "death";

export interface PixelCharacterAssets {
  standeeHD: string;              // 360x360 px HD Pixel Art Standee
  combatSpritesheet: string;      // 512x576 px 9-Row Combat Spritesheet
  modularPartsDir: string;        // Directory containing 16 sliced PNG parts
}

export interface PixelCharacterStats {
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseSpd: number;
  baseCrit: number;
}

export interface PixelCharacterTheme {
  primaryColor: string;
  accentColor: string;
  glowColor: string;
  runeColor: string;
  vfxSlashColor: string;
}

export interface PixelCharacterDefinition {
  classId: PixelCharacterClassId;
  gender: PixelCharacterGender;
  id: string; // e.g. "fighter_male"
  className: string;
  title: string;
  role: string;
  lore: string;
  passiveName: string;
  passiveDesc: string;
  weaponName: string;
  weaponType: "greatsword" | "twin_blades" | "sword_shield" | "dual_daggers" | "rifle" | "dual_blasters";
  stats: PixelCharacterStats;
  theme: PixelCharacterTheme;
  assets: PixelCharacterAssets;
}

