// ==============================================================================
// Monster & Boss Combat AI Types
// State Machine, Ground Telegraph Zones, Stagger Gauge & Multi-Phase Bosses
// ==============================================================================

export type AIState =
  | "IDLE"
  | "PATROL"
  | "AGGRO_CHASE"
  | "TELEGRAPH_WINDUP"
  | "EXECUTE_ATTACK"
  | "COOLDOWN_RECOVERY"
  | "STAGGERED"
  | "RETURNING_HOME"
  | "DEAD";

export type TelegraphShape = "CIRCLE" | "CONE" | "LINE_BOX" | "DONUT_RING";

export interface MonsterAttackPattern {
  id: string;
  name: string;
  shape: TelegraphShape;
  range: number; // Cast trigger range in meters
  radiusOrWidth: number; // Radius for Circle/Donut, width for LineBox, radius for Cone
  length?: number; // Distance for LineBox (e.g. 8m dash/laser)
  angleDeg?: number; // Arc spread angle for Cone (e.g. 90deg, 120deg)
  innerSafeRadius?: number; // Safe donut core for DonutRing (e.g. 4m under boss)
  telegraphDurationMs: number; // Time the ground is marked before damage detonation (e.g. 1000ms)
  damageMultiplier: number;
  knockbackForce: number;
  vfxPreset: string;
  sfxPreset: "laser_pew" | "blade_slash" | "heavy_slam" | "dragon_roar" | "holy_bell";
}

export type MonsterArchetype =
  | "MELEE_RUSHER"
  | "RANGED_CASTER"
  | "ELITE_CHARGER"
  | "WORLD_BOSS";

export interface MonsterBlueprint {
  id: string;
  name: string;
  archetype: MonsterArchetype;
  aggroRadius: number; // Detection range in meters
  leashRadius: number; // Max pursuit distance before resetting to spawn
  moveSpeed: number; // Movement speed in m/s
  staggerThreshold: number; // Stagger HP bar needed to stagger/break posture
  attackCooldown: number; // Base recovery seconds between attack patterns
  attackPatterns: MonsterAttackPattern[];
  phase2Patterns?: MonsterAttackPattern[]; // Unlocked during Boss Phase 2 (Enrage HP <= 50%)
}

export interface ActiveTelegraphZone {
  id: number;
  monsterInstanceId: number;
  pattern: MonsterAttackPattern;
  position: [number, number, number];
  direction: number; // Yaw angle in radians
  elapsedMs: number;
  durationMs: number;
  triggered: boolean;
}
