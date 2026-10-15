// ==============================================================================
// 3D World Boundary & Obstacle Colliders
// Circular boundary clamping (maxRadius = 85m) & physical cylinder obstacle colliders
// ==============================================================================

import * as THREE from "three";

export interface ObstacleCollider {
  x: number;
  z: number;
  radius: number;
}

// 8 Village Lantern Posts at r = 17.5m
const VILLAGE_LANTERNS: ObstacleCollider[] = [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
  const rad = (deg * Math.PI) / 180;
  return {
    x: Math.cos(rad) * 17.5,
    z: Math.sin(rad) * 17.5,
    radius: 0.9,
  };
});

// Central Dragon Fountain
const CENTRAL_FOUNTAIN: ObstacleCollider = {
  x: 0,
  z: 0,
  radius: 3.4,
};

// 6 Boss Altar Dragon Horn Obelisks at (0, -70)
const BOSS_OBELISKS: ObstacleCollider[] = [0, 60, 120, 180, 240, 300].map((deg) => {
  const rad = (deg * Math.PI) / 180;
  return {
    x: Math.cos(rad) * 16.5,
    z: -70 + Math.sin(rad) * 16.5,
    radius: 1.6,
  };
});

// Broken stone ruins in Wilderness
const WILDERNESS_PILLARS: ObstacleCollider[] = [
  { x: -22, z: -15, radius: 1.2 },
  { x: -28, z: 10, radius: 1.2 },
  { x: -18, z: 26, radius: 1.2 },
  { x: 24, z: -18, radius: 1.2 },
  { x: 32, z: 8, radius: 1.2 },
  { x: 20, z: 24, radius: 1.2 },
  { x: 0, z: 32, radius: 1.2 },
  { x: -14, z: 5, radius: 1.3 }, // Guardian tree west
  { x: 14, z: 5, radius: 1.3 },  // Guardian tree east
];

export const WORLD_OBSTACLES: ObstacleCollider[] = [
  CENTRAL_FOUNTAIN,
  ...VILLAGE_LANTERNS,
  ...BOSS_OBELISKS,
  ...WILDERNESS_PILLARS,
];

export const WORLD_MAX_RADIUS = 85.0;

/**
 * Resolves player position against map boundaries and solid obstacle colliders
 */
export function resolveWorldCollisions(pos: THREE.Vector3, playerRadius: number = 0.5): void {
  // 1. World outer boundary clamping
  const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
  if (dist > WORLD_MAX_RADIUS - playerRadius) {
    const scale = (WORLD_MAX_RADIUS - playerRadius) / (dist || 1);
    pos.x *= scale;
    pos.z *= scale;
  }

  // 2. Solid obstacle cylinder push-out
  for (let i = 0; i < WORLD_OBSTACLES.length; i++) {
    const obs = WORLD_OBSTACLES[i];
    const dx = pos.x - obs.x;
    const dz = pos.z - obs.z;
    const dSq = dx * dx + dz * dz;
    const minD = obs.radius + playerRadius;
    if (dSq < minD * minD && dSq > 0.0001) {
      const d = Math.sqrt(dSq);
      const push = (minD - d) / d;
      pos.x += dx * push;
      pos.z += dz * push;
    }
  }
}
