// ==============================================================================
// 3D World Boundary & Realistic Physical Obstacle Colliders
// Circular boundary clamping (maxRadius = 85m) & physical cylinder + AABB box obstacle colliders
// Prevents tunneling, jitter, and walking through trees, houses, fences, and rocks
// ==============================================================================

import * as THREE from "three";

export type ObstacleCollider =
  | {
      type?: "cylinder";
      x: number;
      z: number;
      radius: number;
    }
  | {
      type: "box";
      x: number;
      z: number;
      width: number;
      depth: number;
    };

// ── 1. Central Dragon Healing Fountain ──
const CENTRAL_FOUNTAIN: ObstacleCollider = {
  type: "cylinder",
  x: 0,
  z: 0,
  radius: 3.4,
};

// ── 2. Village Dark Fantasy Wooden Houses (Solid Box Colliders) ──
export const VILLAGE_HOUSES: ObstacleCollider[] = [
  { type: "box", x: -11.5, z: -10.5, width: 6.2, depth: 5.6 }, // Nhà Thợ Rèn (Tây Bắc)
  { type: "box", x: 11.5, z: -10.5, width: 6.2, depth: 5.6 },  // Nhà Giả Kim (Đông Bắc)
  { type: "box", x: -12.0, z: 9.5, width: 5.8, depth: 5.2 },   // Quán Trọ Nhà Rơm (Tây Nam)
  { type: "box", x: 12.0, z: 9.5, width: 5.8, depth: 5.2 },    // Kho Quân Nhu (Đông Nam)
];

// ── 3. Village Wooden Fence Perimeter with 4 Gates (r = 21.5m) ──
// 16 Fence segments around circumference, leaving 4m gaps at North, South, East, West gates
const VILLAGE_FENCE_POSTS: ObstacleCollider[] = [];
for (let deg = 0; deg < 360; deg += 15) {
  // Omit angles around Cardinal Gates (N: 270°, S: 90°, E: 0°, W: 180° in standard math)
  // In 3D (x, z): North is z < 0 (270°), South is z > 0 (90°), East is x > 0 (0°), West is x < 0 (180°)
  const isNearEastGate = Math.abs(deg - 0) <= 8 || Math.abs(deg - 360) <= 8;
  const isNearSouthGate = Math.abs(deg - 90) <= 8;
  const isNearWestGate = Math.abs(deg - 180) <= 8;
  const isNearNorthGate = Math.abs(deg - 270) <= 8;

  if (!isNearEastGate && !isNearSouthGate && !isNearWestGate && !isNearNorthGate) {
    const rad = (deg * Math.PI) / 180;
    VILLAGE_FENCE_POSTS.push({
      type: "cylinder",
      x: Math.cos(rad) * 21.5,
      z: Math.sin(rad) * 21.5,
      radius: 1.0,
    });
  }
}

// ── 4. Village Lantern Posts at r = 17.5m ──
const VILLAGE_LANTERNS: ObstacleCollider[] = [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
  const rad = (deg * Math.PI) / 180;
  return {
    type: "cylinder" as const,
    x: Math.cos(rad) * 17.5,
    z: Math.sin(rad) * 17.5,
    radius: 0.8,
  };
});

// ── 5. Ancient Lush Trees in Wilderness ──
const LUSH_TREES: ObstacleCollider[] = [
  [-22, -26],
  [-32, -18],
  [22, -28],
  [30, -16],
  [-26, 12],
  [-36, 24],
  [24, 18],
  [34, 26],
  [-12, -32],
  [14, -34],
  [-40, 2],
  [38, 4],
].map(([x, z]) => ({
  type: "cylinder" as const,
  x,
  z,
  radius: 1.1,
}));

// ── 6. Gnarled Dead Trees (Dead Marsh & North Pass) ──
const DEAD_TREES: ObstacleCollider[] = [
  [-18, -48],
  [18, -48],
  [-24, -60],
  [24, -60],
  [-8, -56],
  [8, -56],
  [28, -2],   // Dead Marsh entrance
  [35, -12],  // Deep Dead Marsh
  [38, -25],  // North Dead Marsh
].map(([x, z]) => ({
  type: "cylinder" as const,
  x,
  z,
  radius: 0.95,
}));

// ── 7. Grounded Rocks & Ancient Boulders ──
const SOLID_ROCKS: ObstacleCollider[] = [
  [-16, -14, 1.4],
  [-28, 6, 1.5],
  [20, -12, 1.3],
  [28, 8, 1.6],
  [-14, 28, 1.3],
  [16, 26, 1.4],
  [-34, -24, 1.5],
  [32, -20, 1.4],
].map(([x, z, r]) => ({
  type: "cylinder" as const,
  x,
  z,
  radius: r,
}));

// ── 8. Ancient Archway Gates & Bridge Guard Posts ──
const ARCHWAY_PILLARS: ObstacleCollider[] = [
  // North Gate
  { type: "cylinder", x: -3.2, z: -17.5, radius: 0.8 },
  { type: "cylinder", x: 3.2, z: -17.5, radius: 0.8 },
  // South Gate
  { type: "cylinder", x: -3.2, z: 17.5, radius: 0.8 },
  { type: "cylinder", x: 3.2, z: 17.5, radius: 0.8 },
  // Dungeon Portal Gate at z = -48
  { type: "cylinder", x: -3.8, z: -48.0, radius: 1.1 },
  { type: "cylinder", x: 3.8, z: -48.0, radius: 1.1 },
];

// ── 9. Broken Ruins Pillars in Wilderness ──
const WILDERNESS_PILLARS: ObstacleCollider[] = [
  { type: "cylinder", x: -22, z: -15, radius: 1.2 },
  { type: "cylinder", x: -28, z: 10, radius: 1.2 },
  { type: "cylinder", x: -18, z: 26, radius: 1.2 },
  { type: "cylinder", x: 24, z: -18, radius: 1.2 },
  { type: "cylinder", x: 32, z: 8, radius: 1.2 },
  { type: "cylinder", x: 20, z: 24, radius: 1.2 },
  { type: "cylinder", x: 0, z: 32, radius: 1.2 },
];

// ── 10. 6 Boss Altar Dragon Horn Obelisks at (0, -70) ──
const BOSS_OBELISKS: ObstacleCollider[] = [0, 60, 120, 180, 240, 300].map((deg) => {
  const rad = (deg * Math.PI) / 180;
  return {
    type: "cylinder" as const,
    x: Math.cos(rad) * 16.5,
    z: -70 + Math.sin(rad) * 16.5,
    radius: 1.6,
  };
});

// ── 11. Memorial & Leaderboard Tablet at [6.5, 4.5] ──
const MEMORIAL_TABLET: ObstacleCollider = {
  type: "cylinder",
  x: 6.5,
  z: 4.5,
  radius: 1.4,
};

// ── 12. Side Dungeon Portals ──
const SIDE_PORTAL_COLLIDERS: ObstacleCollider[] = [
  { type: "cylinder", x: -22.0, z: -48.0, radius: 1.8 },
  { type: "cylinder", x: 22.0, z: -48.0, radius: 1.8 },
];

// ── 13. Dead Marsh Tombstones & Skeletal Remains (East Sector) ──
const DEAD_MARSH_OBSTACLES: ObstacleCollider[] = [
  { type: "cylinder", x: 26, z: -8, radius: 1.2 },
  { type: "cylinder", x: 34, z: -4, radius: 1.3 },
  { type: "cylinder", x: 28, z: 12, radius: 1.4 },
  { type: "cylinder", x: 36, z: 18, radius: 1.3 },
  { type: "cylinder", x: 42, z: 2, radius: 1.5 },
];

// Complete Obstacle Registry
export const WORLD_OBSTACLES: ObstacleCollider[] = [
  MEMORIAL_TABLET,
  ...VILLAGE_HOUSES,
  ...VILLAGE_FENCE_POSTS,
  ...VILLAGE_LANTERNS,
  ...LUSH_TREES,
  ...DEAD_TREES,
  ...SOLID_ROCKS,
  ...ARCHWAY_PILLARS,
  ...WILDERNESS_PILLARS,
  ...BOSS_OBELISKS,
  ...SIDE_PORTAL_COLLIDERS,
  ...DEAD_MARSH_OBSTACLES,
];

export const WORLD_MAX_RADIUS = 85.0;

/**
 * Resolves entity position against map boundaries and solid obstacle colliders
 * Supports both Cylinder (circle) and Box (AABB) colliders with smooth tangential slide
 */
export function resolveWorldCollisions(pos: THREE.Vector3, entityRadius: number = 0.5): void {
  // 1. World outer circular boundary clamping
  const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
  if (dist > WORLD_MAX_RADIUS - entityRadius) {
    const scale = (WORLD_MAX_RADIUS - entityRadius) / (dist || 1);
    pos.x *= scale;
    pos.z *= scale;
  }

  // 2. Solid obstacle colliders push-out
  for (let i = 0; i < WORLD_OBSTACLES.length; i++) {
    const obs = WORLD_OBSTACLES[i];

    if (obs.type === "box") {
      // Box (AABB) Collider push-out
      const halfW = obs.width * 0.5 + entityRadius;
      const halfD = obs.depth * 0.5 + entityRadius;
      const dx = pos.x - obs.x;
      const dz = pos.z - obs.z;

      if (Math.abs(dx) < halfW && Math.abs(dz) < halfD) {
        const overlapX = halfW - Math.abs(dx);
        const overlapZ = halfD - Math.abs(dz);

        if (overlapX < overlapZ) {
          pos.x += Math.sign(dx) * overlapX;
        } else {
          pos.z += Math.sign(dz) * overlapZ;
        }
      }
    } else {
      // Cylinder (Circle 2D) Collider push-out
      const dx = pos.x - obs.x;
      const dz = pos.z - obs.z;
      const dSq = dx * dx + dz * dz;
      const minD = obs.radius + entityRadius;

      if (dSq < minD * minD && dSq > 0.0001) {
        const d = Math.sqrt(dSq);
        const push = (minD - d) / d;
        pos.x += dx * push;
        pos.z += dz * push;
      }
    }
  }
}
