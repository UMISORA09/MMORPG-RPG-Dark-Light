import { create } from "zustand";
import * as THREE from "three";

export type WorldZone = "SAFE_VILLAGE" | "WILDERNESS" | "BOSS_ALTAR";

export interface FloatingTextItem {
  id: number;
  text: string;
  position: THREE.Vector3;
  color: string;
  lifetime: number;
  maxLifetime: number;
}

export interface BulletProjectile {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  damage: number;
  lifetime: number;
  color: string;
}

export interface SlashEffect {
  id: number;
  position: THREE.Vector3;
  radius: number;
  color: string;
  lifetime: number;
  maxLifetime: number;
}

export interface GameWorldState {
  // --- Player State ---
  playerPosition: THREE.Vector3;
  playerVelocity: THREE.Vector3;
  playerFacingLeft: boolean;
  playerAnimState: "idle" | "run" | "attack" | "hurt";
  playerHealth: number;
  playerMaxHealth: number;
  playerLevel: number;
  playerExp: number;
  playerExpToNext: number;
  playerGold: number;
  playerKills: number;
  playerName: string;
  playerClassId: string;
  playerClassName: string;
  playerColorHex: string;
  isInvincible: boolean;
  invincibleTimer: number;

  // --- Skills & Cooldowns ---
  skillCooldowns: Record<string, number>; // { skill1: 0, skill2: 3.5, skill3: 0 }

  // --- World & Zone ---
  currentZone: WorldZone;
  zoneNotification: string | null;
  zoneNotificationTimer: number;

  // --- Boss Raid ---
  bossName: string;
  bossHealth: number;
  bossMaxHealth: number;
  bossActive: boolean;

  // --- Combat Objects ---
  floatingTexts: FloatingTextItem[];
  bullets: BulletProjectile[];
  slashEffects: SlashEffect[];

  // --- Overlay Modals ---
  activeModal: "inventory" | "shop" | "leaderboard" | "battleLog" | null;

  // --- Callbacks for Database Sync ---
  onDefeatMonsterCallback: ((monsterId: string) => void) | null;
  onPlayerDefeatedCallback: (() => void) | null;

  // --- Actions ---
  registerCombatCallbacks: (
    onDefeat: (monsterId: string) => void,
    onPlayerDefeated: () => void
  ) => void;
  updatePlayerPosition: (
    pos: THREE.Vector3,
    facingLeft: boolean,
    animState: "idle" | "run" | "attack" | "hurt"
  ) => void;
  damagePlayer: (amount: number, fromDir?: THREE.Vector3) => void;
  healPlayer: (amount: number) => void;
  triggerSkill: (skillIndex: number) => void;
  addBullet: (bullet: BulletProjectile) => void;
  addSlashEffect: (effect: SlashEffect) => void;
  addFloatingText: (text: string, pos: THREE.Vector3, color?: string) => void;
  setBossHealth: (hp: number, maxHp?: number) => void;
  setActiveModal: (modal: "inventory" | "shop" | "leaderboard" | "battleLog" | null) => void;
  closeActiveModal: () => void;
  syncFromBackendCharacter: (char: any) => void;
  updateAfterBattle: (rewards: {
    exp: number;
    gold: number;
    level: number;
    hp?: number;
    maxHp?: number;
  }) => void;
  tickWorld: (dt: number) => void;
}

let nextTextId = 1;

export const useGameWorldStore = create<GameWorldState>((set, get) => ({
  // Player initial
  playerPosition: new THREE.Vector3(0, 0, 0),
  playerVelocity: new THREE.Vector3(0, 0, 0),
  playerFacingLeft: false,
  playerAnimState: "idle",
  playerHealth: 500,
  playerMaxHealth: 500,
  playerLevel: 1,
  playerExp: 0,
  playerExpToNext: 100,
  playerGold: 100,
  playerKills: 0,
  playerName: "Hiệp Sĩ",
  playerClassId: "fighter",
  playerClassName: "Đấu Sĩ",
  playerColorHex: "#e74c3c",
  isInvincible: false,
  invincibleTimer: 0,

  skillCooldowns: {
    skill1: 0,
    skill2: 0,
    skill3: 0,
  },

  // World Zone
  currentZone: "SAFE_VILLAGE",
  zoneNotification: "🛡️ Làng Long Tộc — Khu Vực An Toàn (Tự động hồi máu)",
  zoneNotificationTimer: 4.0,

  // Boss
  bossName: "Rồng Lửa Cổ Đại (Boss Cấp 20)",
  bossHealth: 1500,
  bossMaxHealth: 1500,
  bossActive: false,

  // Combat objects
  floatingTexts: [],
  bullets: [],
  slashEffects: [],

  // Modals
  activeModal: null,

  // Callbacks
  onDefeatMonsterCallback: null,
  onPlayerDefeatedCallback: null,

  registerCombatCallbacks: (onDefeat, onPlayerDefeated) => {
    set({
      onDefeatMonsterCallback: onDefeat,
      onPlayerDefeatedCallback: onPlayerDefeated,
    });
  },

  updatePlayerPosition: (pos, facingLeft, animState) => {
    const state = get();
    // Determine Zone based on position
    const distFromOrigin = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
    let newZone: WorldZone = state.currentZone;
    let notif = state.zoneNotification;
    let notifTimer = state.zoneNotificationTimer;

    if (pos.z < -50) {
      if (newZone !== "BOSS_ALTAR") {
        newZone = "BOSS_ALTAR";
        notif = "🔥 CẤM ĐỊA SĂN BOSS — RỒNG LỬA CỔ ĐẠI THỨC TỈNH!";
        notifTimer = 5.0;
      }
    } else if (distFromOrigin >= 18) {
      if (newZone !== "WILDERNESS") {
        newZone = "WILDERNESS";
        notif = "⚔️ Đấu Trường Hoang Dã — Quái vật nguy hiểm xuất hiện!";
        notifTimer = 4.0;
      }
    } else {
      if (newZone !== "SAFE_VILLAGE") {
        newZone = "SAFE_VILLAGE";
        notif = "🛡️ Làng Long Tộc — Khu Vực An Toàn (Hồi Máu)";
        notifTimer = 4.0;
      }
    }

    set({
      playerPosition: pos.clone(),
      playerFacingLeft: facingLeft,
      playerAnimState: animState,
      currentZone: newZone,
      zoneNotification: notif,
      zoneNotificationTimer: notifTimer,
      bossActive: newZone === "BOSS_ALTAR",
    });
  },

  damagePlayer: (amount, fromDir) => {
    const s = get();
    if (s.isInvincible || s.currentZone === "SAFE_VILLAGE") return;

    const newHp = Math.max(0, s.playerHealth - amount);
    const newPos = s.playerPosition.clone();
    if (fromDir) {
      newPos.addScaledVector(fromDir, 0.4);
    }

    // Add floating damage text
    s.addFloatingText(`-${amount}`, s.playerPosition.clone().add(new THREE.Vector3(0, 2.2, 0)), "#ff3333");

    if (newHp <= 0) {
      // Player died: respawn at village center
      set({
        playerHealth: s.playerMaxHealth,
        playerPosition: new THREE.Vector3(0, 0, 0),
        isInvincible: true,
        invincibleTimer: 2.5,
        zoneNotification: "💀 Bạn đã hồi sinh an toàn tại Làng Long Tộc!",
        zoneNotificationTimer: 4.0,
      });

      if (s.onPlayerDefeatedCallback) {
        s.onPlayerDefeatedCallback();
      }
    } else {
      set({
        playerHealth: newHp,
        playerPosition: newPos,
        isInvincible: true,
        invincibleTimer: 0.8,
        playerAnimState: "hurt",
      });
    }
  },

  healPlayer: (amount) => {
    set((s) => ({
      playerHealth: Math.min(s.playerMaxHealth, s.playerHealth + amount),
    }));
  },

  triggerSkill: (skillIndex) => {
    const s = get();
    const key = `skill${skillIndex}`;
    if ((s.skillCooldowns[key] || 0) > 0) return; // on cooldown

    const cooldowns = [0, 3.5, 6.0, 12.0];
    const cd = cooldowns[skillIndex] || 4.0;

    set((state) => ({
      skillCooldowns: {
        ...state.skillCooldowns,
        [key]: cd,
      },
      playerAnimState: "attack",
    }));
  },

  addBullet: (bullet) => {
    set((s) => ({ bullets: [...s.bullets, bullet] }));
  },

  addSlashEffect: (effect) => {
    set((s) => ({ slashEffects: [...s.slashEffects, effect] }));
  },

  addFloatingText: (text, pos, color = "#ffd700") => {
    set((s) => ({
      floatingTexts: [
        ...s.floatingTexts,
        {
          id: nextTextId++,
          text,
          position: pos.clone(),
          color,
          lifetime: 1.6,
          maxLifetime: 1.6,
        },
      ],
    }));
  },

  setBossHealth: (hp, maxHp) => {
    set((s) => ({
      bossHealth: Math.max(0, hp),
      bossMaxHealth: maxHp ?? s.bossMaxHealth,
    }));
  },

  setActiveModal: (modal) => {
    set({ activeModal: modal });
  },

  closeActiveModal: () => {
    set({ activeModal: null });
  },

  syncFromBackendCharacter: (char) => {
    if (!char) return;
    const classColors: Record<string, string> = {
      gunner: "#00b4ff",
      assassin: "#9b59b6",
      fighter: "#e74c3c",
      tank: "#f39c12",
    };

    set((s) => {
      const maxHp = char.maxHp || s.playerMaxHealth;
      const hp = Math.min(char.hp || s.playerHealth, maxHp);

      return {
        playerName: char.name || s.playerName,
        playerClassId: char.classId || s.playerClassId,
        playerClassName: char.className || s.playerClassName,
        playerColorHex: classColors[char.classId] || s.playerColorHex,
        playerLevel: char.level || s.playerLevel,
        playerExp: char.experience || s.playerExp,
        playerExpToNext: char.experienceToNextLevel || 100,
        playerHealth: hp > 0 ? hp : maxHp,
        playerMaxHealth: maxHp,
        playerGold: char.gold !== undefined ? char.gold : s.playerGold,
        playerKills: char.kills !== undefined ? char.kills : s.playerKills,
      };
    });
  },

  updateAfterBattle: (rewards) => {
    set((s) => ({
      playerExp: rewards.exp,
      playerGold: rewards.gold,
      playerLevel: rewards.level,
      playerKills: s.playerKills + 1,
      playerHealth: rewards.hp !== undefined ? rewards.hp : s.playerHealth,
      playerMaxHealth: rewards.maxHp !== undefined ? rewards.maxHp : s.playerMaxHealth,
    }));
  },

  tickWorld: (dt) => {
    const s = get();

    // 1. Invincibility timer
    let newInvincible = s.isInvincible;
    let newInvTimer = s.invincibleTimer;
    if (newInvincible) {
      newInvTimer -= dt;
      if (newInvTimer <= 0) {
        newInvincible = false;
        newInvTimer = 0;
      }
    }

    // 2. Zone Notification timer
    let notif = s.zoneNotification;
    let notifTimer = s.zoneNotificationTimer;
    if (notifTimer > 0) {
      notifTimer -= dt;
      if (notifTimer <= 0) {
        notif = null;
      }
    }

    // 3. Cooldown timers
    const updatedCds: Record<string, number> = {};
    for (const [k, v] of Object.entries(s.skillCooldowns)) {
      updatedCds[k] = Math.max(0, v - dt);
    }

    // 4. Update Floating Texts (move up and fade)
    const updatedTexts = s.floatingTexts
      .map((t) => {
        t.position.y += 1.2 * dt;
        t.lifetime -= dt;
        return t;
      })
      .filter((t) => t.lifetime > 0);

    // 5. Update Slash Effects
    const updatedSlashes = s.slashEffects
      .map((sl) => {
        sl.lifetime -= dt;
        return sl;
      })
      .filter((sl) => sl.lifetime > 0);

    // 6. Safe Village Auto-regen 5% Max HP/s
    let currentHp = s.playerHealth;
    if (s.currentZone === "SAFE_VILLAGE" && currentHp < s.playerMaxHealth) {
      const regenAmount = Math.max(1, Math.floor(s.playerMaxHealth * 0.05 * dt));
      currentHp = Math.min(s.playerMaxHealth, currentHp + regenAmount);
    }

    set({
      isInvincible: newInvincible,
      invincibleTimer: newInvTimer,
      zoneNotification: notif,
      zoneNotificationTimer: notifTimer,
      skillCooldowns: updatedCds,
      floatingTexts: updatedTexts,
      slashEffects: updatedSlashes,
      playerHealth: currentHp,
    });
  },
}));
