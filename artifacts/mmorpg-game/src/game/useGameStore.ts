import { create } from "zustand";
import * as THREE from "three";
import type { PlayerState, EnemyState, BulletState, GameState, AllocatedStats, Equipment } from "./types";
import { ITEM_MAP } from "./data/items";
import { SKILL_MAP } from "./data/skills";
import {
  PLAYER_MAX_HEALTH,
  PLAYER_SPEED,
  PLAYER_JUMP_FORCE,
  GRAVITY,
  GROUND_Y,
  PLAYER_ATTACK_COOLDOWN,
  PLAYER_ATTACK_RANGE,
  PLAYER_ATTACK_DAMAGE,
  PLAYER_INVINCIBLE_TIME,
  ENEMY_SPEED,
  ENEMY_ALERT_RADIUS,
  ENEMY_ATTACK_RADIUS,
  ENEMY_ATTACK_COOLDOWN,
  ENEMY_DAMAGE,
  ARENA_SIZE,
  VILLAGE_SIZE,
  VILLAGE_SPAWN,
  PORTAL_POSITION,
  PORTAL_ENTER_RADIUS,
  BULLET_SPEED,
  BULLET_LIFETIME,
  BULLET_DAMAGE,
} from "./constants";

// ── Computed stat bonuses from equipment + skills + allocated points ──────────
export function computeBonus(player: PlayerState) {
  const a = player.allocatedStats;
  let hp    = a.hp    * 20;
  let atk   = a.atk   * 5;
  let def   = a.def   * 3;
  let spd   = a.spd   * 0.3;
  let magic = a.magic * 5;

  for (const itemId of Object.values(player.equipment)) {
    const item = itemId ? ITEM_MAP[itemId] : null;
    if (!item) continue;
    hp    += item.stats.hp    ?? 0;
    atk   += item.stats.atk  ?? 0;
    def   += item.stats.def  ?? 0;
    spd   += item.stats.spd  ?? 0;
    magic += item.stats.magic ?? 0;
  }

  if (player.learnedSkills.includes("iron_body"))  def  += 20;
  if (player.learnedSkills.includes("swift_foot"))  spd  += 1.5;

  return { hp, atk, def, spd, magic };
}

interface GameStore {
  player: PlayerState;
  enemies: EnemyState[];
  bullets: BulletState[];
  game: GameState;
  nextEnemyId: number;
  nextBulletId: number;

  // navigation
  enterVillage: () => void;
  enterBattle: () => void;
  startGame: () => void;
  restartGame: () => void;

  // loops
  updateGame:    (delta: number, controls: Record<string, boolean | number>) => void;
  updateVillage: (delta: number, controls: Record<string, boolean | number>) => void;
  spawnWave: (wave: number) => void;

  // character progression
  allocateStat:  (stat: keyof AllocatedStats) => void;
  learnSkill:    (skillId: string) => void;
  equipItem:     (itemId: string) => void;
  unequipItem:   (slot: keyof Equipment) => void;
  buyItem:       (itemId: string) => void;
  sellItem:      (itemId: string) => void;
  buyPotion:     () => void;
  toggleMenu:    () => void;
  setMenuOpen:   (open: boolean) => void;
  syncFromCharacter: (char: any) => void;
}

const ENEMY_TYPES: Array<"goblin" | "orc" | "skeleton"> = ["goblin", "orc", "skeleton"];

function makeEnemy(id: number, wave: number): EnemyState {
  const angle = Math.random() * Math.PI * 2;
  const radius = 12 + Math.random() * 8;
  const type = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
  const healthBonus = (wave - 1) * 10;
  return {
    id,
    position: new THREE.Vector3(Math.cos(angle) * radius, GROUND_Y, Math.sin(angle) * radius),
    velocity: new THREE.Vector3(),
    health: 50 + healthBonus,
    maxHealth: 50 + healthBonus,
    isAlive: true,
    alertRadius: ENEMY_ALERT_RADIUS,
    attackRadius: ENEMY_ATTACK_RADIUS,
    attackCooldown: 0,
    state: "patrol",
    patrolDirection: Math.random() * Math.PI * 2,
    patrolTimer: 2 + Math.random() * 2,
    type,
  };
}

const ZERO_STATS: AllocatedStats = { hp: 0, atk: 0, def: 0, spd: 0, magic: 0 };
const ZERO_EQ: Equipment = { weapon: null, armor: null, helmet: null, accessory: null };

function expToNext(level: number) {
  return Math.floor(100 * Math.pow(level, 1.4));
}

function makeInitialPlayer(inVillage = false): PlayerState {
  return {
    position: new THREE.Vector3(
      inVillage ? VILLAGE_SPAWN.x : 0,
      GROUND_Y,
      inVillage ? VILLAGE_SPAWN.z : 0,
    ),
    velocity: new THREE.Vector3(),
    health: PLAYER_MAX_HEALTH,
    maxHealth: PLAYER_MAX_HEALTH,
    score: 0,
    isAttacking: false,
    attackCooldown: 0,
    isOnGround: true,
    facingDirection: Math.PI,
    isInvincible: false,
    invincibleTimer: 0,
    name: "Dragon Hero",
    colorHex: "#e74c3c",

    level: 1,
    exp: 0,
    expToNext: expToNext(1),
    gold: 120,
    statPoints: 5,
    skillPoints: 1,
    allocatedStats: { ...ZERO_STATS },
    equipment: { ...ZERO_EQ },
    inventory: [],
    learnedSkills: [],
  };
}

// ── Camera-relative movement (shared by village + battle) ─────────────────────
function applyMovement(
  player: PlayerState,
  controls: Record<string, boolean | number>,
  delta: number,
  bounds: number,
  speedOverride?: number,
) {
  const cameraYaw = typeof controls["cameraYaw"] === "number" ? controls["cameraYaw"] : 0;
  const camForwardX =  Math.sin(cameraYaw);
  const camForwardZ =  Math.cos(cameraYaw);
  const camRightX   =  Math.cos(cameraYaw);
  const camRightZ   = -Math.sin(cameraYaw);

  const jx = typeof controls["joystickX"] === "number" ? controls["joystickX"] : 0;
  const jy = typeof controls["joystickY"] === "number" ? controls["joystickY"] : 0;
  const jMag = Math.sqrt(jx * jx + jy * jy);

  let localX = 0;
  let localZ = 0;
  if (jMag > 0.15) {
    localX = jx; localZ = jy;
  } else {
    if (controls["forward"]) localZ -= 1;
    if (controls["back"])    localZ += 1;
    if (controls["left"])    localX -= 1;
    if (controls["right"])   localX += 1;
  }
  const len = Math.sqrt(localX * localX + localZ * localZ);
  if (len > 1) { localX /= len; localZ /= len; }

  const worldX = localX * camRightX + localZ * camForwardX;
  const worldZ = localX * camRightZ + localZ * camForwardZ;

  const bonus = computeBonus(player);
  const speed = speedOverride ?? (PLAYER_SPEED + bonus.spd);

  player.velocity.x = worldX * speed;
  player.velocity.z = worldZ * speed;

  if (worldX !== 0 || worldZ !== 0) {
    player.facingDirection = Math.atan2(worldX, worldZ);
  }

  if (controls["jump"] && player.isOnGround) {
    player.velocity.y = PLAYER_JUMP_FORCE;
    player.isOnGround = false;
  }

  player.velocity.y += GRAVITY * delta;
  player.position.x += player.velocity.x * delta;
  player.position.y += player.velocity.y * delta;
  player.position.z += player.velocity.z * delta;

  if (player.position.y <= GROUND_Y) {
    player.position.y = GROUND_Y;
    player.velocity.y = 0;
    player.isOnGround = true;
  }

  const half = bounds / 2;
  player.position.x = Math.max(-half, Math.min(half, player.position.x));
  player.position.z = Math.max(-half, Math.min(half, player.position.z));
}

export const useGameStore = create<GameStore>((set, get) => ({
  player: makeInitialPlayer(false),
  enemies: [],
  bullets: [],
  game: { phase: "menu", wave: 1, score: 0, nearPortal: false, menuOpen: false },
  nextEnemyId: 1,
  nextBulletId: 1,

  // ── Enter village ────────────────────────────────────────────────────────
  enterVillage: () => {
    set({
      player: makeInitialPlayer(true),
      enemies: [],
      bullets: [],
      nextEnemyId: 1,
      nextBulletId: 1,
      game: { phase: "village", wave: 1, score: 0, nearPortal: false, menuOpen: false },
    });
  },

  syncFromCharacter: (char: any) => {
    if (!char) return;
    const classColors: Record<string, string> = {
      gunner: "#3b82f6",
      assassin: "#a855f7",
      fighter: "#ef4444",
      tank: "#10b981",
    };
    set((state) => ({
      player: {
        ...state.player,
        name: char.name || state.player.name,
        colorHex: classColors[char.classId] || state.player.colorHex,
        level: char.level || state.player.level,
        health: char.hp || state.player.health,
        maxHealth: char.maxHp || state.player.maxHealth,
        gold: char.gold !== undefined ? char.gold : state.player.gold,
        allocatedStats: {
          hp: Math.max(0, Math.floor(((char.maxHp || 100) - 100) / 20)),
          atk: Math.max(0, Math.floor(((char.atk || 20) - 20) / 5)),
          def: Math.max(0, Math.floor(((char.def || 10) - 10) / 3)),
          spd: Math.max(0, Math.floor(((char.spd || 5) - 5) / 0.3)),
          magic: 5,
        },
      },
    }));
  },

  // ── Village → battle ─────────────────────────────────────────────────────
  enterBattle: () => {
    const state = get();
    if (state.game.phase !== "village") return;
    const wave = 1;
    const enemies = Array.from({ length: 3 + wave }, (_, i) => makeEnemy(i + 1, wave));
    const bonus = computeBonus(state.player);
    const battlePlayer: PlayerState = {
      ...state.player,
      position: new THREE.Vector3(0, GROUND_Y, 0),
      velocity: new THREE.Vector3(),
      health: PLAYER_MAX_HEALTH + bonus.hp,
      maxHealth: PLAYER_MAX_HEALTH + bonus.hp,
      isOnGround: true,
      isAttacking: false,
      attackCooldown: 0,
      isInvincible: false,
      invincibleTimer: 0,
    };
    set({
      player: battlePlayer,
      enemies,
      bullets: [],
      nextEnemyId: enemies.length + 1,
      nextBulletId: 1,
      game: { phase: "playing", wave, score: state.player.score, nearPortal: false, menuOpen: false },
    });
  },

  startGame: () => { get().enterVillage(); },

  // ── Restart: giữ lại toàn bộ nhân vật, chỉ hồi máu và về làng ───────────
  restartGame: () => {
    const state = get();
    const p = state.player;
    const bonus = computeBonus(p);
    const newMaxHP = PLAYER_MAX_HEALTH + bonus.hp;
    set({
      player: {
        ...p,
        position: new THREE.Vector3(VILLAGE_SPAWN.x, GROUND_Y, VILLAGE_SPAWN.z),
        velocity: new THREE.Vector3(),
        health: newMaxHP,
        maxHealth: newMaxHP,
        isOnGround: true,
        isAttacking: false,
        attackCooldown: 0,
        isInvincible: false,
        invincibleTimer: 0,
      },
      enemies: [],
      bullets: [],
      nextEnemyId: 1,
      nextBulletId: 1,
      game: { phase: "village", wave: 1, score: p.score, nearPortal: false, menuOpen: false },
    });
  },

  spawnWave: (wave: number) => {
    const state = get();
    const count = 3 + wave;
    let id = state.nextEnemyId;
    const newEnemies = Array.from({ length: count }, () => { const e = makeEnemy(id, wave); id++; return e; });
    set((s) => ({ enemies: newEnemies, nextEnemyId: id, game: { ...s.game, wave } }));
  },

  // ── Character menu ────────────────────────────────────────────────────────
  toggleMenu: () => {
    set((s) => ({ game: { ...s.game, menuOpen: !s.game.menuOpen } }));
  },
  setMenuOpen: (open: boolean) => {
    set((s) => ({ game: { ...s.game, menuOpen: open } }));
  },

  // ── Allocate stat point ───────────────────────────────────────────────────
  allocateStat: (stat: keyof AllocatedStats) => {
    const state = get();
    if (state.player.statPoints <= 0) return;
    const newStats = { ...state.player.allocatedStats, [stat]: state.player.allocatedStats[stat] + 1 };
    const bonus = computeBonus({ ...state.player, allocatedStats: newStats });
    const newMaxHealth = PLAYER_MAX_HEALTH + bonus.hp;
    set({
      player: {
        ...state.player,
        statPoints: state.player.statPoints - 1,
        allocatedStats: newStats,
        maxHealth: newMaxHealth,
        health: Math.min(state.player.health + 20, newMaxHealth),
      },
    });
  },

  // ── Learn skill ───────────────────────────────────────────────────────────
  learnSkill: (skillId: string) => {
    const state = get();
    const skill = SKILL_MAP[skillId];
    if (!skill) return;
    if (state.player.learnedSkills.includes(skillId)) return;
    if (state.player.skillPoints < skill.cost) return;
    if (skill.requires && !state.player.learnedSkills.includes(skill.requires)) return;

    const newSkills = [...state.player.learnedSkills, skillId];
    const newPlayer = {
      ...state.player,
      skillPoints: state.player.skillPoints - skill.cost,
      learnedSkills: newSkills,
    };
    // Recalculate bonuses after learning passive skills
    const bonus = computeBonus(newPlayer);
    const newMaxHealth = PLAYER_MAX_HEALTH + bonus.hp;
    set({
      player: {
        ...newPlayer,
        maxHealth: newMaxHealth,
        health: Math.min(newPlayer.health, newMaxHealth),
      },
    });
  },

  // ── Equip item from inventory ─────────────────────────────────────────────
  equipItem: (itemId: string) => {
    const state = get();
    const item = ITEM_MAP[itemId];
    if (!item || !state.player.inventory.includes(itemId)) return;
    const newEquip = { ...state.player.equipment, [item.slot]: itemId };
    const newPlayer = { ...state.player, equipment: newEquip };
    const bonus = computeBonus(newPlayer);
    const newMaxHealth = PLAYER_MAX_HEALTH + bonus.hp;
    set({
      player: {
        ...newPlayer,
        maxHealth: newMaxHealth,
        health: Math.min(newPlayer.health, newMaxHealth),
      },
    });
  },

  // ── Unequip item back to inventory ───────────────────────────────────────
  unequipItem: (slot: keyof Equipment) => {
    const state = get();
    if (!state.player.equipment[slot]) return;
    const newEquip = { ...state.player.equipment, [slot]: null };
    const newPlayer = { ...state.player, equipment: newEquip };
    const bonus = computeBonus(newPlayer);
    const newMaxHealth = PLAYER_MAX_HEALTH + bonus.hp;
    set({
      player: {
        ...newPlayer,
        maxHealth: newMaxHealth,
        health: Math.min(newPlayer.health, newMaxHealth),
      },
    });
  },

  // ── Buy item (village shop) ───────────────────────────────────────────────
  buyItem: (itemId: string) => {
    const state = get();
    const item = ITEM_MAP[itemId];
    if (!item) return;
    if (state.player.gold < item.price) return;
    if (state.player.inventory.includes(itemId)) return;
    set({
      player: {
        ...state.player,
        gold: state.player.gold - item.price,
        inventory: [...state.player.inventory, itemId],
      },
    });
  },

  // ── Sell item (50% price) ─────────────────────────────────────────────────
  sellItem: (itemId: string) => {
    const state = get();
    const item = ITEM_MAP[itemId];
    if (!item || !state.player.inventory.includes(itemId)) return;
    // Auto-unequip first
    const newEquip = { ...state.player.equipment };
    if (newEquip[item.slot] === itemId) newEquip[item.slot] = null;
    const newInventory = state.player.inventory.filter((id) => id !== itemId);
    const newPlayer = {
      ...state.player,
      gold: state.player.gold + Math.floor(item.price / 2),
      inventory: newInventory,
      equipment: newEquip,
    };
    const bonus = computeBonus(newPlayer);
    const newMaxHealth = PLAYER_MAX_HEALTH + bonus.hp;
    set({
      player: {
        ...newPlayer,
        maxHealth: newMaxHealth,
        health: Math.min(newPlayer.health, newMaxHealth),
      },
    });
  },

  // ── Buy HP potion ─────────────────────────────────────────────────────────
  buyPotion: () => {
    const state = get();
    const POTION_COST = 30;
    const POTION_HEAL = 50;
    if (state.player.gold < POTION_COST) return;
    const newHealth = Math.min(state.player.health + POTION_HEAL, state.player.maxHealth);
    set({
      player: {
        ...state.player,
        gold: state.player.gold - POTION_COST,
        health: newHealth,
      },
    });
  },

  // ── Village update ────────────────────────────────────────────────────────
  updateVillage: (delta: number, controls: Record<string, boolean | number>) => {
    const state = get();
    if (state.game.phase !== "village") return;
    if (state.game.menuOpen) return;

    const player = { ...state.player, position: state.player.position.clone(), velocity: state.player.velocity.clone() };
    applyMovement(player, controls, delta, VILLAGE_SIZE - 8);

    if (player.attackCooldown > 0) player.attackCooldown -= delta;
    if (player.isAttacking) player.isAttacking = false;

    const dx = player.position.x - PORTAL_POSITION.x;
    const dz = player.position.z - PORTAL_POSITION.z;
    const nearPortal = Math.sqrt(dx * dx + dz * dz) < PORTAL_ENTER_RADIUS;

    if (nearPortal && controls["interact"]) {
      get().enterBattle();
      return;
    }

    set({ player, game: { ...state.game, nearPortal } });
  },

  // ── Battle update ─────────────────────────────────────────────────────────
  updateGame: (delta: number, controls: Record<string, boolean | number>) => {
    const state = get();
    if (state.game.phase !== "playing") return;
    if (state.game.menuOpen) return;

    const player = { ...state.player, position: state.player.position.clone(), velocity: state.player.velocity.clone() };
    let enemies = state.enemies.map((e) => ({ ...e, position: e.position.clone(), velocity: e.velocity.clone() }));
    let bullets = state.bullets.map((b) => ({ ...b, position: b.position.clone(), velocity: b.velocity.clone() }));
    const newBullets: BulletState[] = [];
    let nextBulletId = state.nextBulletId;
    const half = ARENA_SIZE / 2;

    const bonus = computeBonus(player);
    const attackDamage = PLAYER_ATTACK_DAMAGE + bonus.atk;
    const magicDamage  = BULLET_DAMAGE + bonus.magic;
    const defReduction = Math.min(50, bonus.def); // % damage reduction
    const barrierBonus = player.learnedSkills.includes("magic_barrier") ? 0.25 : 0;

    applyMovement(player, controls, delta, ARENA_SIZE);

    if (player.attackCooldown > 0) player.attackCooldown -= delta;
    if (player.isAttacking) player.isAttacking = false;

    if (controls["attack"] && player.attackCooldown <= 0) {
      player.isAttacking = true;
      player.attackCooldown = PLAYER_ATTACK_COOLDOWN;

      const isTriple = player.learnedSkills.includes("triple_strike");
      const isDragonFury = player.learnedSkills.includes("dragon_fury");

      enemies = enemies.map((e) => {
        if (!e.isAlive) return e;
        const dist = e.position.distanceTo(player.position);
        const range = isDragonFury ? 3.5 : PLAYER_ATTACK_RANGE;
        if (dist <= range) {
          const ne = { ...e };
          const mult = isTriple ? 1.5 : 1;
          ne.health -= attackDamage * mult;
          if (ne.health <= 0) {
            ne.isAlive = false;
            const goldDrop = ne.type === "orc" ? 20 : ne.type === "skeleton" ? 15 : 10;
            const expDrop  = ne.type === "orc" ? 30 : ne.type === "skeleton" ? 25 : 20;
            player.score += ne.type === "orc" ? 30 : ne.type === "skeleton" ? 25 : 20;
            player.gold  += goldDrop;
            player.exp   += expDrop;
          }
          return ne;
        }
        return e;
      });
    }

    if (controls["shoot"] && player.attackCooldown <= 0) {
      player.attackCooldown = PLAYER_ATTACK_COOLDOWN;
      const isInferno = player.learnedSkills.includes("inferno");
      const dir = new THREE.Vector3(Math.sin(player.facingDirection), 0, Math.cos(player.facingDirection)).normalize();
      newBullets.push({
        id: nextBulletId++,
        position: player.position.clone().add(new THREE.Vector3(0, 0.5, 0)),
        velocity: dir.multiplyScalar(isInferno ? BULLET_SPEED * 0.7 : BULLET_SPEED),
        fromPlayer: true,
        damage: isInferno ? magicDamage * 3 : magicDamage,
        lifetime: BULLET_LIFETIME,
      });
    }

    if (player.isInvincible) {
      player.invincibleTimer -= delta;
      if (player.invincibleTimer <= 0) { player.isInvincible = false; player.invincibleTimer = 0; }
    }

    // Bullet update
    const updatedBullets: BulletState[] = [...bullets, ...newBullets]
      .map((b) => {
        const nb = { ...b };
        nb.position = b.position.clone().add(b.velocity.clone().multiplyScalar(delta));
        nb.lifetime -= delta;
        return nb;
      })
      .filter((b) => b.lifetime > 0);

    const finalBullets: BulletState[] = [];
    for (const bullet of updatedBullets) {
      if (!bullet.fromPlayer) { finalBullets.push(bullet); continue; }
      let hit = false;
      enemies = enemies.map((e) => {
        if (!e.isAlive || hit) return e;
        if (bullet.position.distanceTo(e.position) < 1.0) {
          hit = true;
          const ne = { ...e };
          ne.health -= bullet.damage;
          if (ne.health <= 0) {
            ne.isAlive = false;
            const goldDrop = ne.type === "orc" ? 20 : ne.type === "skeleton" ? 15 : 10;
            const expDrop  = ne.type === "orc" ? 30 : ne.type === "skeleton" ? 25 : 20;
            player.score += ne.type === "orc" ? 30 : ne.type === "skeleton" ? 25 : 20;
            player.gold  += goldDrop;
            player.exp   += expDrop;
          }
          return ne;
        }
        return e;
      });
      if (!hit) finalBullets.push(bullet);
    }

    // Level up
    while (player.exp >= player.expToNext) {
      player.exp -= player.expToNext;
      player.level += 1;
      player.expToNext = expToNext(player.level);
      player.statPoints  += 2;
      player.skillPoints += 1;
    }

    // Enemy AI
    enemies = enemies.map((e) => {
      if (!e.isAlive) return e;
      const ne = { ...e };
      ne.attackCooldown = Math.max(0, ne.attackCooldown - delta);
      ne.patrolTimer = Math.max(0, ne.patrolTimer - delta);
      const distToPlayer = ne.position.distanceTo(player.position);

      if (distToPlayer < ne.alertRadius) {
        if (distToPlayer < ne.attackRadius) {
          ne.state = "attack";
          ne.velocity.set(0, 0, 0);
          if (ne.attackCooldown <= 0 && !player.isInvincible) {
            ne.attackCooldown = ENEMY_ATTACK_COOLDOWN;
            const rawDmg  = ENEMY_DAMAGE;
            const reduced = rawDmg * (1 - defReduction / 100) * (1 - barrierBonus);
            player.health -= Math.max(1, Math.round(reduced));
            player.isInvincible = true;
            player.invincibleTimer = PLAYER_INVINCIBLE_TIME;
          }
        } else {
          ne.state = "chase";
          const dir = player.position.clone().sub(ne.position).normalize();
          ne.velocity.set(dir.x * ENEMY_SPEED, 0, dir.z * ENEMY_SPEED);
        }
      } else {
        ne.state = "patrol";
        if (ne.patrolTimer <= 0) { ne.patrolDirection = Math.random() * Math.PI * 2; ne.patrolTimer = 2 + Math.random() * 2; }
        ne.velocity.set(Math.sin(ne.patrolDirection) * ENEMY_SPEED * 0.4, 0, Math.cos(ne.patrolDirection) * ENEMY_SPEED * 0.4);
      }

      ne.position.x += ne.velocity.x * delta;
      ne.position.z += ne.velocity.z * delta;
      ne.position.x = Math.max(-half, Math.min(half, ne.position.x));
      ne.position.z = Math.max(-half, Math.min(half, ne.position.z));
      return ne;
    });

    if (player.health <= 0) {
      player.health = 0;
      set({ player, enemies, bullets: finalBullets, nextBulletId, game: { ...state.game, phase: "gameover", score: player.score } });
      return;
    }

    const aliveEnemies = enemies.filter((e) => e.isAlive);
    let game = { ...state.game, score: player.score };
    if (aliveEnemies.length === 0) {
      const nextWave = game.wave + 1;
      if (nextWave > 5) {
        set({ player, enemies, bullets: finalBullets, nextBulletId, game: { ...game, phase: "win" } });
        return;
      } else {
        game = { ...game, wave: nextWave };
        const count = 3 + nextWave;
        let id = state.nextEnemyId;
        const newWaveEnemies = Array.from({ length: count }, () => { const e = makeEnemy(id, nextWave); id++; return e; });
        set({ player, enemies: newWaveEnemies, bullets: finalBullets, nextBulletId, nextEnemyId: id, game });
        return;
      }
    }

    set({ player, enemies, bullets: finalBullets, nextBulletId, game });
  },
}));
