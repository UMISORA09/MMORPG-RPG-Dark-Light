// ==============================================================================
// Game Constants & Map Zone Boundaries
// ==============================================================================

// Player Movement & Combat
export const PLAYER_SPEED = 6.5;
export const PLAYER_JUMP_FORCE = 8;
export const GRAVITY = -20;
export const GROUND_Y = 0;
export const PLAYER_MAX_HEALTH = 500;
export const PLAYER_ATTACK_DAMAGE = 35;
export const PLAYER_ATTACK_RANGE = 2.8;
export const PLAYER_ATTACK_COOLDOWN = 0.35;
export const PLAYER_INVINCIBLE_TIME = 0.8;

// Bullets / Projectiles
export const BULLET_SPEED = 16;
export const BULLET_LIFETIME = 2.0;
export const BULLET_DAMAGE = 30;

// Enemies AI & Speeds
export const ENEMY_SPEED = 3.2;
export const ENEMY_ALERT_RADIUS = 8.5;
export const ENEMY_ATTACK_RADIUS = 2.0;
export const ENEMY_ATTACK_COOLDOWN = 1.4;
export const ENEMY_DAMAGE = 18;

// Camera
export const CAMERA_DISTANCE = 11;
export const CAMERA_HEIGHT = 6.5;

// ==============================================================================
// 3 Seamless Map Zones
// ==============================================================================
// Vùng 1: Làng Long Tộc (Safe Zone) — Tâm tại (0, 0, 0), bán kính < 18m
export const SAFE_ZONE_RADIUS = 18;

// Vùng 2: Đấu Trường Hoang Dã (Wilderness Zone) — Bán kính 18m <= r < 45m (z >= -45)
export const WILDERNESS_RADIUS = 45;

// Vùng 3: Cấm Địa Săn Boss (Boss Raid Zone) — Phía Bắc z < -45
export const BOSS_ZONE_Z = -45;

// Spawn trung tâm Làng
export const VILLAGE_SPAWN = Object.freeze({ x: 0, y: 0, z: 0 });

// Tọa độ Boss Altar
export const BOSS_SPAWN = Object.freeze({ x: 0, y: 0, z: -68 });

// Tọa độ các NPC trong Làng
export const NPC_SHOP_POS = Object.freeze({ x: -7, y: 0, z: -4 });
export const NPC_LEADERBOARD_POS = Object.freeze({ x: 7, y: 0, z: -4 });
export const NPC_ELDER_POS = Object.freeze({ x: 0, y: 0, z: -8 });

// Compatibility aliases for legacy views
export const ARENA_SIZE = 90;
export const VILLAGE_SIZE = 36;
export const PORTAL_POSITION = Object.assign([0, 0, -45] as [number, number, number], { x: 0, y: 0, z: -45 });
