/**
 * Định nghĩa gói tin giao thức cho Server-Authoritative Realtime Encounter
 * Chuẩn Protocol Version 1.0 (20 Hz Fixed Tick)
 */

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface PlayerInputButtons {
  forward?: boolean;
  back?: boolean;
  left?: boolean;
  right?: boolean;
  jump?: boolean;
  attack?: boolean;
  skill1?: boolean;
  skill2?: boolean;
  skill3?: boolean;
  interact?: boolean;
}

export interface PlayerInputPacket {
  type: "input";
  encounterId: string;
  seq: number;
  clientTick?: number;
  buttons: PlayerInputButtons;
  aim?: {
    yaw: number;
  };
}

export interface PlayerCombatState {
  position: [number, number, number];
  velocity: [number, number, number];
  hp: number;
  maxHp: number;
  facing: number;
  cooldowns: Record<string, number>;
  isAlive: boolean;
}

export interface EnemyCombatState {
  id: string;
  monsterId: string;
  name: string;
  hp: number;
  maxHp: number;
  position: [number, number, number];
  state: "patrol" | "chase" | "windup" | "attack" | "cooldown" | "hurt" | "dead";
  isAlive: boolean;
}

export interface EncounterSnapshotPacket {
  type: "snapshot";
  encounterId: string;
  serverTick: number;
  ackInputSeq: number;
  serverTime: string;
  state: {
    player: PlayerCombatState;
    enemies: EnemyCombatState[];
  };
}

export interface EncounterEventPacket {
  type: "event";
  eventId: string;
  serverTick: number;
  name:
    | "attack.started"
    | "attack.hit"
    | "skill.used"
    | "enemy.windup"
    | "enemy.hit"
    | "enemy.defeated"
    | "player.defeated"
    | "encounter.completed"
    | "encounter.aborted";
  data: Record<string, any>;
}

export interface EncounterTerminalResultPacket {
  type: "encounter.result";
  encounterId: string;
  status: "victory" | "defeat" | "aborted" | "expired";
  resultVersion: number;
  serverTick: number;
  reward: {
    exp: number;
    gold: number;
    items: any[];
  };
  character: {
    level: number;
    experience: number;
    gold: number;
    hp: number;
    maxHp: number;
    kills: number;
  };
  logId?: number | null;
}
