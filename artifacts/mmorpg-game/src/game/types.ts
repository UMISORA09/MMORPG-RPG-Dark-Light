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
  skillCooldowns: { [skillKey: string]: number };
  isOnGround: boolean;
  facingDirection: number;
  isInvincible: boolean;
  invincibleTimer: number;
  name: string;
  colorHex: string;
  classId: string;
  className: string;

  // Progression & Stats
  level: number;
  exp: number;
  expToNext: number;
  gold: number;
  kills: number;
  deaths: number;
  statPoints: number;
  skillPoints: number;
  allocatedStats: AllocatedStats;
  equipment: Equipment;
  inventory: string[];
  learnedSkills: string[];
}

export interface EnemyState {
  id: number;
  monsterId: string; // "slime" | "goblin" | "orc" | "wolf" | "skeleton" | "dragon"
  name: string;
  level: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  spawnPosition: THREE.Vector3;
  health: number;
  maxHealth: number;
  atk: number;
  def: number;
  isAlive: boolean;
  respawnTimer: number;
  alertRadius: number;
  attackRadius: number;
  attackCooldown: number;
  state: "patrol" | "chase" | "attack";
  patrolDirection: number;
  patrolTimer: number;
  type: string;
  isBoss: boolean;
  emoji: string;
}

export interface BulletState {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  fromPlayer: boolean;
  damage: number;
  lifetime: number;
  color?: string;
}

export interface FloatingDamage {
  id: number;
  position: THREE.Vector3;
  text: string;
  color: string;
  lifetime: number;
  maxLifetime: number;
}

export type ZoneType = "village" | "wilderness" | "boss_raid";

export interface GameState {
  phase: "playing" | "village" | "gameover" | "menu" | "win";
  currentZone: ZoneType;
  zoneNotification: string | null;
  zoneNotificationTimer: number;
  bossHealth: number;
  bossMaxHealth: number;
  bossName: string;
  bossActive: boolean;
  menuOpen: boolean;
  activeModal: "inventory" | "shop" | "leaderboard" | "battle_logs" | null;
  nearPortal?: boolean;
  score?: number;
  wave?: number;
}

export interface RemotePlayer {
  id: string;
  name: string;
  colorHex: string;
  position: THREE.Vector3;
  facingDirection: number;
  isOnline: boolean;
}
