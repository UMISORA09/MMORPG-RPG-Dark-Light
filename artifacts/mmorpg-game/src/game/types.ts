import * as THREE from "three";

export interface AllocatedStats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
  magic: number;
}

export interface Equipment {
  weapon: string | null;
  armor: string | null;
  helmet: string | null;
  accessory: string | null;
}

export interface PlayerState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  health: number;
  maxHealth: number;
  score: number;
  isAttacking: boolean;
  attackCooldown: number;
  isOnGround: boolean;
  facingDirection: number;
  isInvincible: boolean;
  invincibleTimer: number;
  name: string;
  colorHex: string;

  // Progression
  level: number;
  exp: number;
  expToNext: number;
  gold: number;
  statPoints: number;
  skillPoints: number;
  allocatedStats: AllocatedStats;
  equipment: Equipment;
  inventory: string[];      // item IDs owned
  learnedSkills: string[];  // skill IDs learned
}

export interface EnemyState {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  health: number;
  maxHealth: number;
  isAlive: boolean;
  alertRadius: number;
  attackRadius: number;
  attackCooldown: number;
  state: "patrol" | "chase" | "attack";
  patrolDirection: number;
  patrolTimer: number;
  type: "goblin" | "orc" | "skeleton";
}

export interface BulletState {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  fromPlayer: boolean;
  damage: number;
  lifetime: number;
}

export interface GameState {
  phase: "menu" | "village" | "playing" | "gameover" | "win";
  wave: number;
  score: number;
  nearPortal: boolean;
  menuOpen: boolean;
}

export interface RemotePlayer {
  id: string;
  name: string;
  colorHex: string;
  position: THREE.Vector3;
  facingDirection: number;
  isOnline: boolean;
}
