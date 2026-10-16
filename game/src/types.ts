// ==============================================================================
// Chiến Long Bá — Bonfire 2.5D Game Engine Type Definitions
// ==============================================================================

export type AIState = 'patrol' | 'alert' | 'chase' | 'attack' | 'hurt' | 'stagger' | 'die';

export interface KnightState {
  x: number;
  y: number;
  facing: 1 | -1;
  currentAnim: string;
  frameIndex: number;
  animTimer: number;
  isAttacking: boolean;
  speed: number;
  vx_force: number;
  maxHp: number;
  hp: number;
  lagHp: number;
  isInvincible: boolean;
  invincibleTimer: number;
  dodgeTimer: number;
  energy: number;
  maxEnergy: number;
  vfxSpawnedThisAttack: boolean;
}

export interface SlimeBossState {
  x: number;
  spawnX: number;
  y: number;
  facing: 1 | -1;
  currentAnim: string;
  frameIndex: number;
  animTimer: number;
  maxHp: number;
  hp: number;
  lagHp: number;
  isDead: boolean;
  vx_force: number;
  speedPatrol: number;
  speedChase: number;

  // Bonfire AI & Vision
  aiState: AIState;
  visionRadius: number;
  attackRadius: number;
  attackCooldown: number;
  attackCooldownTimer: number;
  patrolTimer: number;
  patrolDirection: 1 | -1;
  isWindingUp: boolean;
  windupTimer: number;

  // Stagger Poise System
  poise: number;
  maxPoise: number;
  isStaggered: boolean;
  staggerTimer: number;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  distanceTraveled: number;
  maxDistance: number;
  damage: number;
  radius: number;
  life: number;
  particles: Array<{ x: number; y: number; size: number; alpha: number }>;
}

export interface VFXEntity {
  x: number;
  y: number;
  facing: 1 | -1;
  anim: string;
  frameIndex: number;
  animTimer: number;
  fps: number;
  totalFrames: number;
}

export interface DamageText {
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  alpha: number;
  vy: number;
}

export interface Torch {
  x: number;
  y: number;
  baseRadius: number;
}

export interface CombatEvent {
  id: string;
  time: string;
  text: string;
  type: 'damage' | 'crit' | 'skill' | 'dodge' | 'boss_rage' | 'stagger' | 'exp';
}

export interface GameStats {
  comboCount: number;
  comboTimer: number;
  comboMultiplier: number;
  totalDamage: number;
  kills: number;
}

export interface SkillCooldowns {
  skillK: number;     // Anime VFX
  skillL: number;     // FlyingAttack
  dodgeSpace: number; // Dash / Dodge
}

