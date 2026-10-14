import { create } from "zustand";
import * as THREE from "three";
import type {
  PlayerState,
  EnemyState,
  BulletState,
  FloatingDamage,
  GameState,
  AllocatedStats,
  Equipment,
  ZoneType,
} from "./types";
import { ITEM_MAP } from "./data/items";
import {
  PLAYER_SPEED,
  PLAYER_JUMP_FORCE,
  GRAVITY,
  GROUND_Y,
  PLAYER_ATTACK_RANGE,
  SAFE_ZONE_RADIUS,
  BOSS_ZONE_Z,
  VILLAGE_SPAWN,
  BOSS_SPAWN,
  BULLET_SPEED,
  BULLET_LIFETIME,
  BULLET_DAMAGE,
} from "./constants";

// ── Computed stat bonuses from equipment + skills + allocated points ──────────
export function computeBonus(player: PlayerState) {
  const a = player.allocatedStats;
  let hp    = (a?.hp ?? 0)    * 20;
  let atk   = (a?.atk ?? 0)   * 5;
  let def   = (a?.def ?? 0)   * 3;
  let spd   = (a?.spd ?? 0)   * 0.3;
  let magic = (a?.magic ?? 0) * 5;

  if (player.equipment) {
    for (const itemId of Object.values(player.equipment)) {
      const item = itemId ? ITEM_MAP[itemId] : null;
      if (!item) continue;
      hp    += item.stats.hp    ?? 0;
      atk   += item.stats.atk  ?? 0;
      def   += item.stats.def  ?? 0;
      spd   += item.stats.spd  ?? 0;
      magic += item.stats.magic ?? 0;
    }
  }

  if (player.learnedSkills?.includes("iron_body"))  def  += 20;
  if (player.learnedSkills?.includes("swift_foot"))  spd  += 1.5;

  return { hp, atk, def, spd, magic };
}

interface GameStore {
  player: PlayerState;
  enemies: EnemyState[];
  bullets: BulletState[];
  floatingDamages: FloatingDamage[];
  game: GameState;
  nextBulletId: number;
  nextDamageId: number;
  regenTimer: number;

  // Callback to sync with backend when a monster is defeated
  onDefeatMonsterCallback: ((monsterId: string) => void) | null;
  onPlayerDefeatedCallback: (() => void) | null;
  registerCombatCallbacks: (onDefeat: (monsterId: string) => void, onPlayerDefeated: () => void) => void;

  // Single Unified Real-Time Game Loop
  updateWorld: (delta: number, controls: Record<string, boolean | number>) => void;

  // Modals & Overlay Windows
  setActiveModal: (modal: GameState["activeModal"]) => void;
  closeActiveModal: () => void;

  // Trigger Skills
  triggerSkill: (skillIndex: number) => void;

  // Sync data from API Backend
  syncFromCharacter: (char: any) => void;
  updatePlayerStatsAfterBattle: (rewards: { exp: number; gold: number; level: number; hp?: number; maxHp?: number }) => void;

  // Compatibility helpers
  setMenuOpen: (open: boolean) => void;
  toggleMenu: () => void;
  enterVillage: () => void;
  enterBattle: () => void;
  buyPotion: (type?: string) => void;
  allocateStat: (stat: any) => void;
  equipItem: (slot: any, id?: any) => void;
  unequipItem: (slot: any) => void;
  buyItem: (id: any) => void;
  sellItem: (id: any) => void;
  learnSkill: (id: any) => void;
}

// ── Monster Seed Definitions for the 3 Zones ──────────────────────────────────
const INITIAL_MONSTERS: Array<{
  id: number;
  monsterId: string;
  name: string;
  level: number;
  type: string;
  pos: [number, number];
  health: number;
  atk: number;
  def: number;
  isBoss?: boolean;
  emoji: string;
}> = [
  // Wilderness: Slimes (Near Village Exit)
  { id: 1, monsterId: "slime", name: "Ma Nhầy Xanh", level: 1, type: "slime", pos: [14, 14], health: 80, atk: 15, def: 5, emoji: "🟢" },
  { id: 2, monsterId: "slime", name: "Ma Nhầy Xanh", level: 1, type: "slime", pos: [-14, 15], health: 80, atk: 15, def: 5, emoji: "🟢" },

  // Wilderness: Goblins
  { id: 3, monsterId: "goblin", name: "Yêu Tinh Rừng", level: 3, type: "goblin", pos: [22, -6], health: 150, atk: 30, def: 15, emoji: "👺" },
  { id: 4, monsterId: "goblin", name: "Yêu Tinh Rừng", level: 3, type: "goblin", pos: [-22, -8], health: 150, atk: 30, def: 15, emoji: "👺" },

  // Wilderness: Orcs
  { id: 5, monsterId: "orc", name: "Người Orc Chiến Binh", level: 5, type: "orc", pos: [26, -24], health: 300, atk: 55, def: 30, emoji: "🗿" },
  { id: 6, monsterId: "orc", name: "Người Orc Chiến Binh", level: 5, type: "orc", pos: [-26, -26], health: 300, atk: 55, def: 30, emoji: "🗿" },

  // Wilderness: Wolves
  { id: 7, monsterId: "wolf", name: "Sói Ma Băng Giá", level: 7, type: "wolf", pos: [12, -36], health: 400, atk: 75, def: 40, emoji: "🐺" },
  { id: 8, monsterId: "wolf", name: "Sói Ma Băng Giá", level: 7, type: "wolf", pos: [-14, -38], health: 400, atk: 75, def: 40, emoji: "🐺" },

  // Wilderness: Skeletons (Guardians at entrance of Boss Zone)
  { id: 9, monsterId: "skeleton", name: "Xương Sống Lính Chết", level: 10, type: "skeleton", pos: [10, -44], health: 500, atk: 90, def: 55, emoji: "💀" },
  { id: 10, monsterId: "skeleton", name: "Xương Sống Lính Chết", level: 10, type: "skeleton", pos: [-10, -44], health: 500, atk: 90, def: 55, emoji: "💀" },

  // Boss Raid Zone: Ancient Flame Dragon (Boss Altar)
  { id: 11, monsterId: "dragon", name: "Rồng Lửa Cổ Đại", level: 20, type: "dragon", pos: [BOSS_SPAWN.x, BOSS_SPAWN.z], health: 1200, atk: 180, def: 100, isBoss: true, emoji: "🐉" },
];

function createInitialEnemies(): EnemyState[] {
  return INITIAL_MONSTERS.map((m) => ({
    id: m.id,
    monsterId: m.monsterId,
    name: m.name,
    level: m.level,
    position: new THREE.Vector3(m.pos[0], GROUND_Y, m.pos[1]),
    spawnPosition: new THREE.Vector3(m.pos[0], GROUND_Y, m.pos[1]),
    velocity: new THREE.Vector3(),
    health: m.health,
    maxHealth: m.health,
    atk: m.atk,
    def: m.def,
    isAlive: true,
    respawnTimer: 0,
    alertRadius: m.isBoss ? 16 : 8.5,
    attackRadius: m.isBoss ? 4.5 : 2.0,
    attackCooldown: 0,
    state: "patrol",
    patrolDirection: Math.random() * Math.PI * 2,
    patrolTimer: 2 + Math.random() * 2,
    type: m.type,
    isBoss: !!m.isBoss,
    emoji: m.emoji,
  }));
}

const ZERO_STATS: AllocatedStats = { hp: 0, atk: 0, def: 0, spd: 0, magic: 0 };
const ZERO_EQ: Equipment = { weapon: null, armor: null, helmet: null, accessory: null };

function makeInitialPlayer(): PlayerState {
  return {
    position: new THREE.Vector3(VILLAGE_SPAWN.x, GROUND_Y, VILLAGE_SPAWN.z),
    velocity: new THREE.Vector3(),
    health: 600,
    maxHealth: 600,
    score: 0,
    isAttacking: false,
    attackCooldown: 0,
    skillCooldowns: { skill1: 0, skill2: 0, skill3: 0 },
    isOnGround: true,
    facingDirection: Math.PI,
    isInvincible: false,
    invincibleTimer: 0,
    name: "Chiến Binh Long Tộc",
    colorHex: "#e74c3c",
    classId: "fighter",
    className: "Đấu Sĩ",

    level: 1,
    exp: 0,
    expToNext: 100,
    gold: 100,
    kills: 0,
    deaths: 0,
    statPoints: 0,
    skillPoints: 0,
    allocatedStats: { ...ZERO_STATS },
    equipment: { ...ZERO_EQ },
    inventory: [],
    learnedSkills: [],
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  player: makeInitialPlayer(),
  enemies: createInitialEnemies(),
  bullets: [],
  floatingDamages: [],
  game: {
    phase: "playing",
    currentZone: "village",
    zoneNotification: "🛡️ Làng Long Tộc — Khu Vực An Toàn (Hồi Máu)",
    zoneNotificationTimer: 4.0,
    bossHealth: 1200,
    bossMaxHealth: 1200,
    bossName: "Rồng Lửa Cổ Đại",
    bossActive: false,
    menuOpen: false,
    activeModal: null,
  },
  nextBulletId: 1,
  nextDamageId: 1,
  regenTimer: 0,
  onDefeatMonsterCallback: null,
  onPlayerDefeatedCallback: null,

  registerCombatCallbacks: (onDefeat, onPlayerDefeated) => {
    set({ onDefeatMonsterCallback: onDefeat, onPlayerDefeatedCallback: onPlayerDefeated });
  },

  setActiveModal: (modal) => {
    set((state) => ({
      game: {
        ...state.game,
        activeModal: modal,
        menuOpen: modal !== null,
      },
    }));
  },

  closeActiveModal: () => {
    set((state) => ({
      game: {
        ...state.game,
        activeModal: null,
        menuOpen: false,
      },
    }));
  },

  setMenuOpen: (open) => {
    set((state) => ({
      game: {
        ...state.game,
        menuOpen: open,
        activeModal: open ? (state.game.activeModal || "inventory") : null,
      },
    }));
  },

  toggleMenu: () => {
    set((state) => {
      const next = !state.game.menuOpen;
      return {
        game: {
          ...state.game,
          menuOpen: next,
          activeModal: next ? (state.game.activeModal || "inventory") : null,
        },
      };
    });
  },

  enterVillage: () => {
    set((state) => ({
      game: {
        ...state.game,
        currentZone: "village",
        phase: "playing",
      },
    }));
  },

  enterBattle: () => {
    set((state) => ({
      game: {
        ...state.game,
        currentZone: "wilderness",
        phase: "playing",
      },
    }));
  },

  buyPotion: () => {},
  allocateStat: () => {},
  equipItem: () => {},
  unequipItem: () => {},
  buyItem: () => {},
  sellItem: () => {},
  learnSkill: () => {},

  syncFromCharacter: (char: any) => {
    if (!char) return;
    const classColors: Record<string, string> = {
      gunner: "#00b4ff",
      assassin: "#9b59b6",
      fighter: "#e74c3c",
      tank: "#f39c12",
    };

    set((state) => {
      const maxHp = char.maxHp || state.player.maxHealth;
      const currentHp = Math.min(char.hp || state.player.health, maxHp);

      return {
        player: {
          ...state.player,
          name: char.name || state.player.name,
          classId: char.classId || state.player.classId,
          className: char.className || state.player.className,
          colorHex: classColors[char.classId] || state.player.colorHex,
          level: char.level || state.player.level,
          exp: char.experience || state.player.exp,
          expToNext: char.experienceToNextLevel || 100,
          health: currentHp > 0 ? currentHp : maxHp,
          maxHealth: maxHp,
          gold: char.gold !== undefined ? char.gold : state.player.gold,
          kills: char.kills !== undefined ? char.kills : state.player.kills,
          deaths: char.deaths !== undefined ? char.deaths : state.player.deaths,
          allocatedStats: {
            hp: Math.max(0, Math.floor((maxHp - 500) / 20)),
            atk: Math.max(0, Math.floor(((char.atk || 50) - 50) / 5)),
            def: Math.max(0, Math.floor(((char.def || 20) - 20) / 3)),
            spd: Math.max(0, Math.floor(((char.spd || 5) - 5) / 0.3)),
            magic: 5,
          },
        },
      };
    });
  },

  updatePlayerStatsAfterBattle: (rewards) => {
    set((state) => ({
      player: {
        ...state.player,
        exp: rewards.exp,
        gold: rewards.gold,
        level: rewards.level,
        kills: state.player.kills + 1,
        health: rewards.hp !== undefined ? rewards.hp : state.player.health,
        maxHealth: rewards.maxHp !== undefined ? rewards.maxHp : state.player.maxHealth,
      },
    }));
  },

  triggerSkill: (skillIndex: number) => {
    const state = get();
    const p = state.player;
    const skillKey = `skill${skillIndex}`;
    const cd = p.skillCooldowns[skillKey] || 0;
    if (cd > 0) return; // Still cooling down

    const skillDamage = skillIndex === 1 ? 70 : skillIndex === 2 ? 120 : 250;
    const cooldownTime = skillIndex === 1 ? 3 : skillIndex === 2 ? 6 : 12;

    // Apply skill cooldown
    set((s) => ({
      player: {
        ...s.player,
        skillCooldowns: {
          ...s.player.skillCooldowns,
          [skillKey]: cooldownTime,
        },
      },
    }));

    // Spawn skill projectile or area effect
    if (p.classId === "gunner" || skillIndex === 2) {
      // Multishot / Beam
      const angle = p.facingDirection;
      const count = skillIndex === 2 ? 5 : 3;
      const newBullets: BulletState[] = [];
      for (let i = 0; i < count; i++) {
        const spread = (i - (count - 1) / 2) * 0.18;
        const curAngle = angle + spread;
        newBullets.push({
          id: s_nextBulletId++,
          position: p.position.clone().add(new THREE.Vector3(0, 1.2, 0)),
          velocity: new THREE.Vector3(Math.sin(curAngle) * BULLET_SPEED, 0, Math.cos(curAngle) * BULLET_SPEED),
          fromPlayer: true,
          damage: skillDamage,
          color: skillIndex === 3 ? "#ffaa00" : "#00f2ff",
          lifetime: BULLET_LIFETIME,
        });
      }
      set((s) => ({ bullets: [...s.bullets, ...newBullets] }));
    } else {
      // Area / Burst strike
      const hitRadius = skillIndex === 3 ? 6.5 : 4.0;
      const hitEnemies: number[] = [];

      state.enemies.forEach((enemy) => {
        if (!enemy.isAlive) return;
        const dist = enemy.position.distanceTo(p.position);
        if (dist <= hitRadius) {
          hitEnemies.push(enemy.id);
        }
      });

      if (hitEnemies.length > 0) {
        set((s) => {
          const updated = s.enemies.map((e) => {
            if (!hitEnemies.includes(e.id)) return e;
            const newHp = Math.max(0, e.health - skillDamage);
            return { ...e, health: newHp };
          });
          return { enemies: updated };
        });

        hitEnemies.forEach((eid) => {
          const target = state.enemies.find((e) => e.id === eid);
          if (target) {
            get().floatingDamages.push({
              id: s_nextDamageId++,
              position: target.position.clone().add(new THREE.Vector3(0, 2.2, 0)),
              text: `-${skillDamage} CRIT!`,
              color: "#ff3366",
              lifetime: 1.2,
              maxLifetime: 1.2,
            });
          }
        });
      }
    }
  },

  // ==============================================================================
  // Unified 3-Zone Real-Time World Loop (60 FPS Optimized)
  // ==============================================================================
  updateWorld: (delta: number, controls: Record<string, boolean | number>) => {
    const dt = Math.min(delta, 0.05);
    const state = get();
    const p = state.player;
    const bonus = computeBonus(p);

    // ── 1. Calculate Player Movement ──────────────────────────────────────────
    const effectiveSpeed = (PLAYER_SPEED + bonus.spd);
    let mx = 0;
    let mz = 0;

    const jx = (controls.joystickX as number) || 0;
    const jy = (controls.joystickY as number) || 0;

    if (controls.forward) mz -= 1;
    if (controls.back)    mz += 1;
    if (controls.left)    mx -= 1;
    if (controls.right)   mx += 1;

    // Mobile joystick override if active
    if (Math.abs(jx) > 0.1 || Math.abs(jy) > 0.1) {
      mx = jx;
      mz = jy;
    }

    const inputLen = Math.sqrt(mx * mx + mz * mz);
    if (inputLen > 0.05) {
      const normX = mx / Math.max(1, inputLen);
      const normZ = mz / Math.max(1, inputLen);
      p.velocity.x = normX * effectiveSpeed;
      p.velocity.z = normZ * effectiveSpeed;
      p.facingDirection = Math.atan2(normX, normZ);
    } else {
      p.velocity.x = 0;
      p.velocity.z = 0;
    }

    // Jump
    if (controls.jump && p.isOnGround) {
      p.velocity.y = PLAYER_JUMP_FORCE;
      p.isOnGround = false;
    }

    // Gravity & Position integrate
    p.velocity.y += GRAVITY * dt;
    p.position.x += p.velocity.x * dt;
    p.position.y += p.velocity.y * dt;
    p.position.z += p.velocity.z * dt;

    if (p.position.y <= GROUND_Y) {
      p.position.y = GROUND_Y;
      p.velocity.y = 0;
      p.isOnGround = true;
    }

    // Map Boundaries: x from -55 to 55, z from -90 to 45
    p.position.x = Math.max(-55, Math.min(55, p.position.x));
    p.position.z = Math.max(-90, Math.min(45, p.position.z));

    // ── 2. Determine Current Zone & Transition Banner ────────────────────────
    const distFromOrigin = Math.sqrt(p.position.x * p.position.x + p.position.z * p.position.z);
    let zone: ZoneType = "wilderness";
    let zoneName = "⚔️ Đấu Trường Hoang Dã — Quái Cấp 1-10";

    if (p.position.z < BOSS_ZONE_Z) {
      zone = "boss_raid";
      zoneName = "🔥 Cấm Địa Săn Boss — Rồng Lửa Cổ Đại (Cực Nguy Hiểm)";
    } else if (distFromOrigin < SAFE_ZONE_RADIUS) {
      zone = "village";
      zoneName = "🛡️ Làng Long Tộc — Khu Vực An Toàn (Hồi Máu)";
    }

    const zoneChanged = state.game.currentZone !== zone;
    let newNotification = state.game.zoneNotification;
    let newNotifTimer = state.game.zoneNotificationTimer - dt;

    if (zoneChanged) {
      newNotification = zoneName;
      newNotifTimer = 3.5;
    } else if (newNotifTimer <= 0) {
      newNotification = null;
    }

    // ── 3. Safe Zone Health Regeneration (5% per second) ─────────────────────
    let newRegenTimer = state.regenTimer + dt;
    if (zone === "village" && p.health < p.maxHealth) {
      if (newRegenTimer >= 1.0) {
        newRegenTimer = 0;
        const healAmount = Math.max(15, Math.round(p.maxHealth * 0.05));
        p.health = Math.min(p.maxHealth, p.health + healAmount);
        state.floatingDamages.push({
          id: s_nextDamageId++,
          position: p.position.clone().add(new THREE.Vector3(0, 2.0, 0)),
          text: `+${healAmount} HP`,
          color: "#00ff88",
          lifetime: 1.0,
          maxLifetime: 1.0,
        });
      }
    }

    // ── 4. Cooldowns & Timers ────────────────────────────────────────────────
    if (p.invincibleTimer > 0) {
      p.invincibleTimer -= dt;
      if (p.invincibleTimer <= 0) p.isInvincible = false;
    }

    if (p.attackCooldown > 0) p.attackCooldown -= dt;

    for (const key of Object.keys(p.skillCooldowns)) {
      if (p.skillCooldowns[key] > 0) {
        p.skillCooldowns[key] = Math.max(0, p.skillCooldowns[key] - dt);
      }
    }

    // ── 5. Player Attacks (Melee / Normal Attack) ─────────────────────────────
    if (controls.attack && p.attackCooldown <= 0) {
      p.isAttacking = true;
      p.attackCooldown = 0.35;
      const baseAtk = (p.allocatedStats.atk * 5 + 35) + bonus.atk;

      // Check hit against alive enemies within attack range & front arc
      state.enemies.forEach((enemy) => {
        if (!enemy.isAlive) return;
        const dist = enemy.position.distanceTo(p.position);
        if (dist <= PLAYER_ATTACK_RANGE) {
          const dmg = Math.max(10, baseAtk - Math.floor(enemy.def * 0.35));
          enemy.health = Math.max(0, enemy.health - dmg);

          state.floatingDamages.push({
            id: s_nextDamageId++,
            position: enemy.position.clone().add(new THREE.Vector3(0, 2.0, 0)),
            text: `-${dmg}`,
            color: "#ffcc00",
            lifetime: 1.0,
            maxLifetime: 1.0,
          });

          // Knockback enemy slightly away from player
          const knockDir = enemy.position.clone().sub(p.position).normalize();
          enemy.position.addScaledVector(knockDir, 0.4);
        }
      });
    } else {
      p.isAttacking = false;
    }

    // ── 6. Player Shoot (Ranged Energy Blast) ─────────────────────────────────
    if (controls.shoot && p.attackCooldown <= 0) {
      p.attackCooldown = 0.45;
      const baseAtk = (p.allocatedStats.atk * 5 + 30) + bonus.atk;
      const bulletVel = new THREE.Vector3(
        Math.sin(p.facingDirection) * BULLET_SPEED,
        0,
        Math.cos(p.facingDirection) * BULLET_SPEED
      );

      state.bullets.push({
        id: s_nextBulletId++,
        position: p.position.clone().add(new THREE.Vector3(0, 1.2, 0)),
        velocity: bulletVel,
        fromPlayer: true,
        damage: baseAtk,
        color: p.classId === "gunner" ? "#00f2ff" : "#ff3366",
        lifetime: BULLET_LIFETIME,
      });
    }

    // ── 7. Bullets Movement & Collision ──────────────────────────────────────
    const updatedBullets: BulletState[] = [];
    state.bullets.forEach((b) => {
      b.lifetime -= dt;
      if (b.lifetime <= 0) return;

      b.position.addScaledVector(b.velocity, dt);

      // Check collision with alive enemies
      let hit = false;
      for (const enemy of state.enemies) {
        if (!enemy.isAlive) continue;
        const dist = b.position.distanceTo(enemy.position);
        const hitRadius = enemy.isBoss ? 2.8 : 1.2;
        if (dist <= hitRadius) {
          enemy.health = Math.max(0, enemy.health - b.damage);
          hit = true;

          state.floatingDamages.push({
            id: s_nextDamageId++,
            position: enemy.position.clone().add(new THREE.Vector3(0, 2.2, 0)),
            text: `-${b.damage}`,
            color: "#00f2ff",
            lifetime: 1.0,
            maxLifetime: 1.0,
          });
          break;
        }
      }

      if (!hit) updatedBullets.push(b);
    });

    // ── 8. Floating Damage Numbers Update ────────────────────────────────────
    const updatedFloating: FloatingDamage[] = [];
    state.floatingDamages.forEach((fd) => {
      fd.lifetime -= dt;
      fd.position.y += dt * 1.5; // Float upwards
      if (fd.lifetime > 0) updatedFloating.push(fd);
    });

    // ── 9. Enemies AI & Collision with Player ────────────────────────────────
    let bossHp = state.game.bossHealth;
    let bossMaxHp = state.game.bossMaxHealth;
    let bossIsActive = false;

    state.enemies.forEach((enemy) => {
      if (enemy.isBoss) {
        bossHp = enemy.health;
        bossMaxHp = enemy.maxHealth;
        bossIsActive = enemy.isAlive && zone === "boss_raid";
      }

      // ── Respawn dead enemies ──
      if (!enemy.isAlive) {
        enemy.respawnTimer -= dt;
        if (enemy.respawnTimer <= 0) {
          enemy.isAlive = true;
          enemy.health = enemy.maxHealth;
          enemy.position.copy(enemy.spawnPosition);
          enemy.state = "patrol";
        }
        return;
      }

      // ── Check if enemy was defeated this frame ──
      if (enemy.health <= 0) {
        enemy.isAlive = false;
        enemy.respawnTimer = enemy.isBoss ? 12 : 7;

        state.floatingDamages.push({
          id: s_nextDamageId++,
          position: enemy.position.clone().add(new THREE.Vector3(0, 2.5, 0)),
          text: `+EXP +VÀNG!`,
          color: "#ffd700",
          lifetime: 1.8,
          maxLifetime: 1.8,
        });

        // Trigger database sync via backend mutation!
        if (state.onDefeatMonsterCallback) {
          state.onDefeatMonsterCallback(enemy.monsterId);
        }
        return;
      }

      // ── AI Behaviors ──
      if (enemy.attackCooldown > 0) enemy.attackCooldown -= dt;

      const distToPlayer = enemy.position.distanceTo(p.position);
      const isPlayerInSafeZone = distFromOrigin < SAFE_ZONE_RADIUS;

      // If player is inside Safe Zone, enemies never chase or attack
      if (isPlayerInSafeZone) {
        enemy.state = "patrol";
      } else if (distToPlayer <= enemy.attackRadius) {
        enemy.state = "attack";
      } else if (distToPlayer <= enemy.alertRadius) {
        enemy.state = "chase";
      } else {
        enemy.state = "patrol";
      }

      // Chase movement
      if (enemy.state === "chase") {
        const dir = p.position.clone().sub(enemy.position).normalize();
        enemy.position.x += dir.x * (enemy.isBoss ? 3.0 : 3.2) * dt;
        enemy.position.z += dir.z * (enemy.isBoss ? 3.0 : 3.2) * dt;
      } else if (enemy.state === "attack") {
        // Attack player if off cooldown and player not in safe zone
        if (enemy.attackCooldown <= 0 && !p.isInvincible && !isPlayerInSafeZone) {
          enemy.attackCooldown = 1.4;
          const playerDef = (p.allocatedStats.def * 3 + 10) + bonus.def;
          const enemyDamage = Math.max(8, enemy.atk - Math.floor(playerDef * 0.4));

          p.health = Math.max(0, p.health - enemyDamage);
          p.isInvincible = true;
          p.invincibleTimer = 0.8;

          state.floatingDamages.push({
            id: s_nextDamageId++,
            position: p.position.clone().add(new THREE.Vector3(0, 2.0, 0)),
            text: `-${enemyDamage}`,
            color: "#ff3333",
            lifetime: 1.0,
            maxLifetime: 1.0,
          });

          // Knockback player slightly
          const kb = p.position.clone().sub(enemy.position).normalize();
          p.position.addScaledVector(kb, 0.5);
        }
      } else {
        // Patrol around spawn
        enemy.patrolTimer -= dt;
        if (enemy.patrolTimer <= 0) {
          enemy.patrolDirection = Math.random() * Math.PI * 2;
          enemy.patrolTimer = 2.5 + Math.random() * 2;
        }
        // Keep within 6m of spawn position
        const distFromSpawn = enemy.position.distanceTo(enemy.spawnPosition);
        if (distFromSpawn > 6) {
          const returnDir = enemy.spawnPosition.clone().sub(enemy.position).normalize();
          enemy.position.addScaledVector(returnDir, 1.5 * dt);
        } else {
          enemy.position.x += Math.cos(enemy.patrolDirection) * 1.2 * dt;
          enemy.position.z += Math.sin(enemy.patrolDirection) * 1.2 * dt;
        }
      }
    });

    // ── 10. Player Defeated Handling (Respawn at Safe Zone) ───────────────────
    if (p.health <= 0) {
      p.health = p.maxHealth;
      p.position.set(VILLAGE_SPAWN.x, GROUND_Y, VILLAGE_SPAWN.z);
      p.velocity.set(0, 0, 0);
      p.deaths += 1;
      p.isInvincible = true;
      p.invincibleTimer = 2.0;

      newNotification = "💀 Bạn đã hồi sinh tại Làng Long Tộc!";
      newNotifTimer = 4.0;

      if (state.onPlayerDefeatedCallback) {
        state.onPlayerDefeatedCallback();
      }
    }

    // ── Commit State Updates ─────────────────────────────────────────────────
    set({
      bullets: updatedBullets,
      floatingDamages: updatedFloating,
      regenTimer: newRegenTimer,
      game: {
        ...state.game,
        currentZone: zone,
        zoneNotification: newNotification,
        zoneNotificationTimer: newNotifTimer,
        bossHealth: bossHp,
        bossMaxHealth: bossMaxHp,
        bossActive: bossIsActive,
      },
    });
  },
}));

let s_nextBulletId = 100;
let s_nextDamageId = 1000;
