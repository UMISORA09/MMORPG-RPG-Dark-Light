// ==============================================================================
// 3D Canvas Modules (2.5D Billboard Sprites, World, Scenes, Entities, VFX)
// ==============================================================================

export { SpriteBillboard25D } from "./sprites/SpriteBillboard25D";
export { getOrCreateProceduralSpritesheet } from "./sprites/ProceduralSpriteFallback";
export { SeamlessWorldMap, ZoneDetector } from "./world";
export { PlayerEntity25D } from "./entities/PlayerEntity25D";
export { MonsterManager25D } from "./entities/MonsterManager25D";
export { LootManager3D } from "./loot/LootManager3D";
export * from "./loot/loot.types";

export { default as GameCamera } from "./camera/GameCamera";
export { default as MenuCamera } from "./camera/MenuCamera";

export { default as Player } from "./entities/Player";
export { default as Enemies } from "./entities/Enemies";
export { default as VillageNPCs } from "./entities/VillageNPCs";

export { default as Arena } from "./scenes/Arena";
export { default as Village } from "./scenes/Village";
export { default as SeamlessWorld } from "./scenes/SeamlessWorld";

export { default as Bullets } from "./vfx/Bullets";
export { default as Particles } from "./vfx/Particles";
export { default as SkillFX } from "./vfx/SkillFX";
export { VFXManager } from "./vfx/VFXManager";
export { SlashArcShader } from "./vfx/SlashArcShader";
export { ShockwaveRingShader } from "./vfx/ShockwaveRingShader";
export { CyberProjectileVFX } from "./vfx/CyberProjectileVFX";
export { HolyShieldDomeVFX } from "./vfx/HolyShieldDomeVFX";
