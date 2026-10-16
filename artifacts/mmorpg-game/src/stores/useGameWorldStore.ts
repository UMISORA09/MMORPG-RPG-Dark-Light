import { create } from "zustand";
import * as THREE from "three";
import { getCharacterBlueprint, type SkillVFXConfig, type SkillBlueprint, type CombatSkillSpec } from "@/skills";
import { playCombatSFX, setAudioMuted, isAudioMuted } from "@/audio/CombatSoundSynth";
import type { DroppedItem } from "@/canvas/loot/loot.types";

export interface BattleReportData {
  victory: boolean;
  monsterName: string;
  monsterLevel: number;
  isBoss?: boolean;
  totalDamageDealt: number;
  critHits: number;
  durationSeconds: number;
  expGained: number;
  goldGained: number;
  drops: DroppedItem[];
  highestRarity?: "common" | "uncommon" | "rare" | "epic" | "legendary" | null;
  timestamp?: number;
}

export type WorldZone = "SAFE_VILLAGE" | "WILDERNESS" | "DEAD_MARSH" | "BOSS_ALTAR" | "DUNGEON";
export type WorldWeather = "SUNNY" | "RAIN" | "DARK_FOG" | "BLOOD_MOON";

let combatToastTimer: ReturnType<typeof setTimeout> | null = null;

export interface CharacterInventoryItem {
  id: string;
  itemId: string;
  name: string;
  type: string;
  rarity: string;
  equipped: boolean;
  hpBoost: number;
  atkBoost: number;
  defBoost: number;
  spdBoost: number;
  icon: string;
  color: string;
}

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

export interface ActiveVFXInstance {
  id: number;
  config: SkillVFXConfig;
  position: THREE.Vector3;
  direction: number;
}

export type PlayerDebuffType = "SLOW" | "BLEED" | "POISON" | "STUN";

export interface ActiveDebuff {
  id: string;
  type: PlayerDebuffType;
  name: string;
  icon: string;
  duration: number;
  maxDuration: number;
  magnitude?: number; // e.g. 0.40 for 40% slow
  tickInterval?: number;
  tickDamage?: number;
  tickTimer?: number;
}

export interface GameWorldState {
  // --- Player State ---
  playerPosition: THREE.Vector3;
  playerVelocity: THREE.Vector3;
  playerFacingLeft: boolean;
  playerAnimState:
    | "idle"
    | "walk"
    | "run"
    | "jump"
    | "fall"
    | "attack"
    | "attack1"
    | "attack2"
    | "attack3"
    | "attack4"
    | "air_attack"
    | "hurt"
    | "death";
  playerHealth: number;
  playerMaxHealth: number;
  playerPp: number;
  playerMaxPp: number;
  playerLevel: number;
  playerExp: number;
  playerExpToNext: number;
  playerGold: number;
  playerKills: number;
  playerName: string;
  playerClassId: string;
  playerClassName: string;
  playerGender: "male" | "female";
  playerColorHex: string;
  isInvincible: boolean;
  invincibleTimer: number;
  characterRenderMode: "2.5d_sprite" | "3d_model";
  hitFlashTimer: number; // 120ms hit flash reaction

  // --- Active Debuffs & Status Effects ---
  playerDebuffs: ActiveDebuff[];
  isStunned: boolean;
  slowSpeedMultiplier: number;

  // --- Combat Combo & Passive States ---
  comboIndex: 0 | 1 | 2;
  comboTimer: number;
  passiveCounter: number;
  passiveActive: boolean;
  passiveFuryPercent: number;
  cameraShakeIntensity: number;

  // --- Skills & Cooldowns ---
  skillCooldowns: Record<string, number>; // { skill1: 0, skill2: 3.5, skill3: 0 }

  // --- World, Zone & Weather ---
  currentZone: WorldZone;
  weather: WorldWeather;
  weatherTimer: number;
  hpRegenAcc: number;
  mpRegenAcc: number;
  zoneNotification: string | null;
  zoneNotificationTimer: number;
  isLevelSuppressed: boolean;
  zoneWarningBanner: string | null;
  zoneWarningTimer: number;
  dungeonModalOpen: boolean;
  dungeonDifficulty: "normal" | "hard" | "nightmare";

  // --- Boss Raid ---
  bossName: string;
  bossHealth: number;
  bossMaxHealth: number;
  bossActive: boolean;
  bossPhase: 1 | 2;
  bossStagger: number; // 0 to 100%
  bossIsStaggered: boolean;
  bossCastingSpell: string | null;
  bossCastingTimer: number;

  // --- Combat Objects & Shader VFX ---
  floatingTexts: FloatingTextItem[];
  bullets: BulletProjectile[];
  slashEffects: SlashEffect[];
  activeVFXList: ActiveVFXInstance[];
  droppedLoot: DroppedItem[];
  inventoryItems: CharacterInventoryItem[];
  monsterMarkers: { id: number; x: number; z: number; isBoss: boolean; name: string }[];
  nearbyTargetEnemies: { id: number; name: string; hp: number; maxHp: number; dist: number; color: string }[];

  // --- Overlay Modals ---
  activeModal: "inventory" | "shop" | "leaderboard" | "battleLog" | "settings" | "quests" | "blacksmith" | "party" | "rewards" | "attributes" | "pvpArena" | "gmAdmin" | "achievements" | "dailyRewards" | null;
  blacksmithTab: "enhance" | "dismantle" | "craft";
  setBlacksmithTab: (tab: "enhance" | "dismantle" | "craft") => void;

  // --- Quests & Waypoints ---
  trackedQuest: any | null;
  setTrackedQuest: (quest: any | null) => void;
  progressQuest: (objectiveType: string, targetId?: string, count?: number) => void;

  // --- Real-time Multiplayer & Party ---
  remotePlayers: any[];
  setRemotePlayers: (players: any[]) => void;
  overheadChatBubble: string | null;
  overheadChatTimer: number;
  triggerOverheadChat: (msg: string) => void;
  party: any | null;
  setParty: (party: any | null) => void;

  // --- Weapon Enhancement Aura Level ---
  highestEnhanceLevel: number;
  setHighestEnhanceLevel: (lvl: number) => void;

  // --- Mount System ---
  isMounted: boolean;
  activeMountId: "shadow_steed" | "frost_wolf" | "dragon_beast";
  mountSpeedMultiplier: number; // 1.7 when mounted
  toggleMount: () => void;
  dismount: () => void;
  setActiveMountId: (id: "shadow_steed" | "frost_wolf" | "dragon_beast") => void;

  // --- Pet Companion Auto-Magnet System ---
  petActive: boolean;
  petType: "fairy_spirit" | "baby_dragon" | "cyber_bot";
  petPosition: THREE.Vector3;
  togglePet: () => void;
  setPetPosition: (pos: THREE.Vector3) => void;

  // --- Stat Points Allocation System ---
  unallocatedStatPoints: number;
  playerStr: number;
  playerDex: number;
  playerIntel: number;
  playerLuk: number;
  playerVit: number;
  setUnallocatedStatPoints: (val: number) => void;
  updateBaseStats: (stats: { str?: number; dex?: number; intel?: number; luk?: number; vit?: number; unallocatedStatPoints?: number }) => void;

  // --- Ranked PvP Arena 1v1 ---
  pvpArenaActive: boolean;
  pvpOpponent: any | null;
  pvpTimer: number;
  pvpOpponentHp: number;
  pvpOpponentMaxHp: number;
  pvpResult: "VICTORY" | "DEFEAT" | null;
  honorPoints: number;
  arenaRank: string;
  startPvPArena: (opponent: any) => void;
  closePvPArena: () => void;
  dealPvPDamageToOpponent: (dmg: number) => void;
  dealPvPDamageToPlayer: (dmg: number) => void;

  // --- GM Admin Panel & God Mode ---
  godMode: boolean;
  toggleGodMode: () => void;
  isGMAdminOpen: boolean;
  toggleGMAdmin: () => void;

  // --- Callbacks for Database Sync ---
  onDefeatMonsterCallback: ((monsterId: string) => void) | null;
  onPlayerDefeatedCallback: (() => void) | null;
  onItemAcquiredCallback: ((itemId: string) => void) | null;

  // --- Fever / Fury & Quick Items ---
  feverGauge: number; // 0 to 100
  feverActive: boolean;
  feverTimer: number;
  shieldAmount: number;
  shieldTimer: number;
  atkBuffTimer: number;
  potionCountHp: number;
  potionCountMp: number;
  buffScrollAtkCount: number;
  teleportCompassCount: number;
  shieldScrollCount: number;
  foodMeatCount: number;
  foodSoupCount: number;
  speedPotionCount: number;

  useQuickPotionHp: () => void;
  useQuickPotionMp: () => void;
  useQuickAtkBuff: () => void;
  useQuickTeleport: () => void;
  useQuickShield: () => void;
  useQuickFood: (type: "meat" | "soup" | "speed") => void;
  addFever: (amt: number) => void;
  activateFever: () => void;

  // --- Actions ---
  registerCombatCallbacks: (
    onDefeat: (monsterId: string) => void,
    onPlayerDefeated: () => void,
    onItemAcquired?: (itemId: string) => void
  ) => void;
  spawnLoot: (items: DroppedItem[]) => void;
  removeLoot: (id: string) => void;
  pickUpLoot: (item: DroppedItem) => void;
  pickUpNearbyLoot: (radius?: number) => void;
  equipItem: (id: string) => void;
  updatePlayerPosition: (
    pos: THREE.Vector3,
    facingLeft: boolean,
    animState:
      | "idle"
      | "walk"
      | "run"
      | "jump"
      | "fall"
      | "attack"
      | "attack1"
      | "attack2"
      | "attack3"
      | "attack4"
      | "air_attack"
      | "hurt"
      | "death"
  ) => void;
  damagePlayer: (amount: number, fromDir?: THREE.Vector3) => void;
  healPlayer: (amount: number) => void;
  triggerComboAttack: () => void;
  triggerSkill: (skillIndex: number) => void;
  spawnVFX: (config: SkillVFXConfig, position: THREE.Vector3, direction?: number) => void;
  removeVFX: (id: number) => void;
  addBullet: (bullet: BulletProjectile) => void;
  removeBullet: (id: number) => void;
  addSlashEffect: (effect: SlashEffect) => void;
  addFloatingText: (text: string, pos: THREE.Vector3, color?: string) => void;
  setBossHealth: (hp: number, maxHp?: number) => void;
  setBossRaidState: (data: {
    health?: number;
    maxHealth?: number;
    stagger?: number;
    isStaggered?: boolean;
    phase?: 1 | 2;
    castingSpell?: string | null;
    castingTimer?: number;
  }) => void;
  setZone: (zone: WorldZone, notification?: string) => void;
  setWeather: (weather: WorldWeather) => void;
  setIsLevelSuppressed: (suppressed: boolean) => void;
  triggerZoneWarning: (text: string) => void;
  openDungeonModal: () => void;
  closeDungeonModal: () => void;
  enterDungeon: (difficulty: "normal" | "hard" | "nightmare") => void;
  leaveDungeon: () => void;
  toggleCharacterRenderMode: () => void;
  setActiveModal: (modal: "inventory" | "shop" | "leaderboard" | "battleLog" | "settings" | "quests" | "blacksmith" | "party" | "rewards" | "attributes" | "pvpArena" | "gmAdmin" | "achievements" | "dailyRewards" | null) => void;
  closeActiveModal: () => void;
  updateMonsterMarkers: (markers: { id: number; x: number; z: number; isBoss: boolean; name: string }[]) => void;
  syncFromBackendCharacter: (char: any) => void;
  updateNearbyTargetEnemies: (
    enemies: { id: number; name: string; hp: number; maxHp: number; dist: number; color: string }[]
  ) => void;
  updateAfterBattle: (rewards: {
    exp: number;
    gold: number;
    level: number;
    hp?: number;
    maxHp?: number;
  }) => void;
  addGold: (amount: number) => void;
  applyPlayerDebuff: (debuff: {
    type: PlayerDebuffType;
    name: string;
    icon: string;
    duration: number;
    magnitude?: number;
    tickInterval?: number;
    tickDamage?: number;
  }) => void;
  removePlayerDebuff: (type: PlayerDebuffType) => void;
  clearPlayerDebuffs: () => void;

  // --- Battle Reports & Audio Control ---
  battleReport: BattleReportData | null;
  battleReportOpen: boolean;
  combatKillToast: BattleReportData | null;
  openBattleReport: (data: BattleReportData) => void;
  closeBattleReport: () => void;
  showCombatKillToast: (data: BattleReportData) => void;
  clearCombatKillToast: () => void;
  currentFightDamageDealt: number;
  currentFightCritHits: number;
  currentFightStartTime: number;
  recordCombatHit: (damage: number, isCrit?: boolean) => void;
  resetCombatMetrics: () => void;
  soundMuted: boolean;
  toggleSoundMute: () => boolean;
  setSoundMuted: (muted: boolean) => void;

  // --- Zone Transition Loading Screen ---
  isTransitionLoading: boolean;
  transitionTargetZone: string;
  transitionProgress: number;
  transitionTip: string;
  triggerZoneTransition: (targetZoneName: string, onExecute: () => void) => void;
  claimRewardBonus: (exp: number, gold: number, notification?: string) => void;

  tickWorld: (dt: number) => void;
}

let nextTextId = 1;
let nextVFXId = 5000;
let nextBulletId = 1000;
let nextSlashId = 2000;

export const GAMEPLAY_TIPS = [
  "Mẹo: Kích hoạt combo 3 đòn liên tiếp để tối ưu hóa sát thương và phá vỡ giáp quái vật.",
  "Mẹo: Khi Boss phát quang đỏ, hãy nhanh chóng né tránh ra khỏi vòng cảnh báo mặt đất.",
  "Mẹo: Cường hóa trang bị lên +7 trở lên sẽ kích hoạt vầng hào quang rực rỡ và tăng vọt công thủ.",
  "Mẹo: Quái vật bầy đàn (Sói, Yêu Tinh) có cơ chế gọi bầy khi bị tấn công, hãy cẩn thận!",
  "Mẹo: Ghé thăm Thợ Rèn Hắc Thiết tại Làng Tân Thủ để phân giải trang bị thừa lấy nguyên liệu rèn.",
  "Mẹo: Điểm danh đăng nhập đủ 7 ngày để sở hữu Rương Trang Bị Huyền Thoại giá trị cực cao.",
  "Mẹo: Trời mưa giông làm giảm tầm nhìn của quái vật 20% và tăng 25% sát thương kỹ năng người chơi.",
  "Mẹo: Bấm phím Z hoặc M để leo lên Thú Cưỡi và tăng 70% tốc độ di chuyển trên đại lục."
];

export const useGameWorldStore = create<GameWorldState>((set, get) => ({
  // Transition Loading Screen
  isTransitionLoading: false,
  transitionTargetZone: "LÀNG LONG TỘC",
  transitionProgress: 0,
  transitionTip: GAMEPLAY_TIPS[0],

  // Player initial
  playerPosition: new THREE.Vector3(0, 0, 0),
  playerVelocity: new THREE.Vector3(0, 0, 0),
  playerFacingLeft: false,
  playerAnimState: "idle",
  playerHealth: 260,
  playerMaxHealth: 260,
  playerPp: 110,
  playerMaxPp: 110,
  playerLevel: 1,
  playerExp: 0,
  playerExpToNext: 100,
  playerGold: 100,
  playerKills: 0,
  playerName: "Hiệp Sĩ",
  playerClassId: "fighter",
  playerClassName: "Chiến Binh",
  playerGender: "male",
  playerColorHex: "#f97316",
  isInvincible: false,
  invincibleTimer: 0,
  characterRenderMode: "2.5d_sprite",
  hitFlashTimer: 0,

  // Active Debuffs & Status Effects
  playerDebuffs: [],
  isStunned: false,
  slowSpeedMultiplier: 1.0,

  // Combat Combo & Passive States
  comboIndex: 0,
  comboTimer: 0,
  passiveCounter: 0,
  passiveActive: false,
  passiveFuryPercent: 0,
  cameraShakeIntensity: 0,

  // Fever / Fury & Quick Items State
  feverGauge: 35,
  feverActive: false,
  feverTimer: 0,
  shieldAmount: 0,
  shieldTimer: 0,
  atkBuffTimer: 0,
  potionCountHp: 24,
  potionCountMp: 18,
  buffScrollAtkCount: 8,
  teleportCompassCount: 5,
  shieldScrollCount: 6,
  foodMeatCount: 15,
  foodSoupCount: 12,
  speedPotionCount: 9,

  skillCooldowns: {
    skill1: 0,
    skill2: 0,
    skill3: 0,
  },

  // World Zone, Weather & Dungeon State
  currentZone: "SAFE_VILLAGE",
  weather: "SUNNY",
  weatherTimer: 0,
  hpRegenAcc: 0,
  mpRegenAcc: 0,
  zoneNotification: "🛡️ Làng Long Tộc — Khu Vực An Toàn (Tự động hồi máu)",
  zoneNotificationTimer: 4.0,
  isLevelSuppressed: false,
  zoneWarningBanner: null,
  zoneWarningTimer: 0,
  dungeonModalOpen: false,
  dungeonDifficulty: "normal",

  // Boss
  bossName: "Rồng Lửa Cổ Đại (Boss Cấp 20)",
  bossHealth: 1500,
  bossMaxHealth: 1500,
  bossActive: false,
  bossPhase: 1,
  bossStagger: 0,
  bossIsStaggered: false,
  bossCastingSpell: null,
  bossCastingTimer: 0,

  // Combat objects
  floatingTexts: [],
  bullets: [],
  slashEffects: [],
  activeVFXList: [],
  droppedLoot: [],
  inventoryItems: [
    {
      id: "inv-init-1",
      itemId: "iron_sword",
      name: "Kiếm Sắt Khởi Đầu",
      type: "weapon",
      rarity: "common",
      equipped: true,
      hpBoost: 0,
      atkBoost: 12,
      defBoost: 2,
      spdBoost: 0,
      icon: "⚔️",
      color: "#94a3b8",
    },
  ],

  monsterMarkers: [],
  updateMonsterMarkers: (markers) => set({ monsterMarkers: markers }),

  nearbyTargetEnemies: [],
  updateNearbyTargetEnemies: (enemies) => set({ nearbyTargetEnemies: enemies }),

  // Modals
  activeModal: null,
  blacksmithTab: "enhance",
  setBlacksmithTab: (tab) => set({ blacksmithTab: tab }),

  // Quests & Waypoints
  trackedQuest: {
    id: "q1_tan_thu",
    title: "Q1: Nhận Vũ Khí Tân Thủ",
    type: "MAIN",
    npcId: "npc_truong_lang",
    npcName: "Trưởng Làng Huyền Vũ",
    description: "Gặp Trưởng Làng Huyền Vũ tại đài phun nước thần thánh Làng Tân Thủ để nhận trang bị sơ cấp.",
    objectiveType: "TALK_NPC",
    targetId: "npc_truong_lang",
    targetName: "Trưởng Làng Huyền Vũ",
    requiredCount: 1,
    progress: 0,
    status: "IN_PROGRESS",
    rewardExp: 150,
    rewardGold: 100,
    targetPosX: 0,
    targetPosZ: -4,
    targetZone: "SAFE_VILLAGE",
  },
  setTrackedQuest: (quest) => set({ trackedQuest: quest }),
  progressQuest: (objectiveType, targetId, count = 1) => {
    const s = get();
    if (!s.trackedQuest || s.trackedQuest.status !== "IN_PROGRESS") return;

    let isMatch = false;
    if (s.trackedQuest.objectiveType === objectiveType) {
      if (s.trackedQuest.targetId === "any_equipment" || s.trackedQuest.targetId === "rare_gear") {
        isMatch = true;
      } else if (!targetId || s.trackedQuest.targetId === targetId || s.trackedQuest.targetId.includes(targetId)) {
        isMatch = true;
      }
    }

    if (isMatch) {
      const nextProgress = Math.min(s.trackedQuest.requiredCount, (s.trackedQuest.progress || 0) + count);
      const isComplete = nextProgress >= s.trackedQuest.requiredCount;
      const nextStatus = isComplete ? "READY_TO_CLAIM" : "IN_PROGRESS";

      const updated = {
        ...s.trackedQuest,
        progress: nextProgress,
        status: nextStatus,
      };

      set({ trackedQuest: updated });

      if (isComplete) {
        playCombatSFX("holy_bell", 0.6);
        playCombatSFX("level_up_fanfare", 0.6);
        s.addFloatingText(`🎉 HOÀN THÀNH: ${s.trackedQuest.title}!`, s.playerPosition.clone().add(new THREE.Vector3(0, 2.8, 0)), "#fbbf24");
        set({
          zoneNotification: `🎉 HOÀN THÀNH NHIỆM VỤ: ${s.trackedQuest.title}! Hãy quay về gặp NPC nhận thưởng!`,
          zoneNotificationTimer: 6.0,
        });
      } else {
        s.addFloatingText(`📜 ${s.trackedQuest.targetName || "Tiến độ"}: ${nextProgress}/${s.trackedQuest.requiredCount}`, s.playerPosition.clone().add(new THREE.Vector3(0, 2.4, 0)), "#38bdf8");
      }

      // Sync backend
      fetch("/api/characters/1/quests/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectiveType, targetId, count }),
      }).catch(() => {});
    }
  },

  // Real-time Multiplayer & Party
  remotePlayers: [],
  setRemotePlayers: (players) => set({ remotePlayers: players }),
  overheadChatBubble: null,
  overheadChatTimer: 0,
  triggerOverheadChat: (msg) => set({ overheadChatBubble: msg, overheadChatTimer: 5.0 }),
  party: null,
  setParty: (party) => set({ party }),

  // Weapon Enhancement Aura Level
  highestEnhanceLevel: 0,
  setHighestEnhanceLevel: (lvl) => set({ highestEnhanceLevel: lvl }),

  // Mount System
  isMounted: false,
  activeMountId: "shadow_steed",
  mountSpeedMultiplier: 1.0,
  toggleMount: () => {
    const s = get();
    if (s.isMounted) {
      set({ isMounted: false, mountSpeedMultiplier: 1.0 });
      s.addFloatingText("🏇 Đã Xuống Ngựa", s.playerPosition.clone().add(new THREE.Vector3(0, 2.2, 0)), "#94a3b8");
    } else {
      set({ isMounted: true, mountSpeedMultiplier: 1.7 });
      s.addFloatingText("🐎 Lên Thú Cưỡi (+70% Tốc Độ)!", s.playerPosition.clone().add(new THREE.Vector3(0, 2.5, 0)), "#38bdf8");
      playCombatSFX("holy_bell", 0.4);
    }
  },
  dismount: () => {
    if (get().isMounted) {
      set({ isMounted: false, mountSpeedMultiplier: 1.0 });
    }
  },
  setActiveMountId: (id) => set({ activeMountId: id }),

  // Pet Companion Auto-Magnet System
  petActive: true,
  petType: "fairy_spirit",
  petPosition: new THREE.Vector3(0, 1.5, 0),
  togglePet: () => set((s) => ({ petActive: !s.petActive })),
  setPetPosition: (pos) => set({ petPosition: pos }),

  // Stat Points Allocation System
  unallocatedStatPoints: 5,
  playerStr: 15,
  playerDex: 15,
  playerIntel: 15,
  playerLuk: 10,
  playerVit: 15,
  setUnallocatedStatPoints: (val) => set({ unallocatedStatPoints: val }),
  updateBaseStats: (stats) => set((s) => ({
    playerStr: stats.str !== undefined ? stats.str : s.playerStr,
    playerDex: stats.dex !== undefined ? stats.dex : s.playerDex,
    playerIntel: stats.intel !== undefined ? stats.intel : s.playerIntel,
    playerLuk: stats.luk !== undefined ? stats.luk : s.playerLuk,
    playerVit: stats.vit !== undefined ? stats.vit : s.playerVit,
    unallocatedStatPoints: stats.unallocatedStatPoints !== undefined ? stats.unallocatedStatPoints : s.unallocatedStatPoints,
  })),

  // Ranked PvP Arena 1v1
  pvpArenaActive: false,
  pvpOpponent: null,
  pvpTimer: 90,
  pvpOpponentHp: 1000,
  pvpOpponentMaxHp: 1000,
  pvpResult: null,
  honorPoints: 120,
  arenaRank: "Đồng I",
  startPvPArena: (opponent) => {
    set({
      pvpArenaActive: true,
      pvpOpponent: opponent,
      pvpTimer: 90,
      pvpOpponentHp: opponent.hp || 1200,
      pvpOpponentMaxHp: opponent.hp || 1200,
      pvpResult: null,
      activeModal: "pvpArena",
    });
  },
  closePvPArena: () => {
    set({
      pvpArenaActive: false,
      pvpOpponent: null,
      pvpResult: null,
      activeModal: null,
    });
  },
  dealPvPDamageToOpponent: (dmg) => {
    const s = get();
    if (!s.pvpArenaActive || s.pvpResult) return;
    const nextHp = Math.max(0, s.pvpOpponentHp - dmg);
    if (nextHp <= 0) {
      set({ pvpOpponentHp: 0, pvpResult: "VICTORY" });
      s.addFloatingText("🏆 CHIẾN THẮNG ĐẤU TRƯỜNG!", s.playerPosition.clone().add(new THREE.Vector3(0, 2.5, 0)), "#f59e0b");
      playCombatSFX("level_up_fanfare", 0.6);
    } else {
      set({ pvpOpponentHp: nextHp });
    }
  },
  dealPvPDamageToPlayer: (dmg) => {
    const s = get();
    if (!s.pvpArenaActive || s.pvpResult || s.godMode) return;
    const nextHp = Math.max(0, s.playerHealth - dmg);
    if (nextHp <= 0) {
      set({ playerHealth: 0, pvpResult: "DEFEAT" });
      s.addFloatingText("☠️ THẤT BẠI ĐẤU TRƯỜNG!", s.playerPosition.clone().add(new THREE.Vector3(0, 2.5, 0)), "#ef4444");
    } else {
      set({ playerHealth: nextHp });
    }
  },

  // GM Admin Panel & God Mode
  godMode: false,
  toggleGodMode: () => {
    const s = get();
    const next = !s.godMode;
    set({ godMode: next });
    s.addFloatingText(next ? "🛡️ GOD MODE: BẬT (BẤT TỬ)" : "🛡️ GOD MODE: TẮT", s.playerPosition.clone().add(new THREE.Vector3(0, 2.5, 0)), next ? "#00ff88" : "#94a3b8");
  },
  isGMAdminOpen: false,
  toggleGMAdmin: () => {
    set((s) => ({ isGMAdminOpen: !s.isGMAdminOpen }));
  },

  // Callbacks
  onDefeatMonsterCallback: null,
  onPlayerDefeatedCallback: null,
  onItemAcquiredCallback: null,

  registerCombatCallbacks: (onDefeat, onPlayerDefeated, onItemAcquired) => {
    set({
      onDefeatMonsterCallback: onDefeat,
      onPlayerDefeatedCallback: onPlayerDefeated,
      onItemAcquiredCallback: onItemAcquired || null,
    });
  },

  // Battle Reports & Audio Control
  battleReport: null,
  battleReportOpen: false,
  combatKillToast: null,
  currentFightDamageDealt: 0,
  currentFightCritHits: 0,
  currentFightStartTime: Date.now(),
  soundMuted: typeof window !== "undefined" ? isAudioMuted() : false,

  openBattleReport: (data: BattleReportData) => {
    set({
      battleReport: { ...data, timestamp: data.timestamp || Date.now() },
      battleReportOpen: true,
      activeModal: "battleLog",
    });
  },
  closeBattleReport: () => {
    set({
      battleReportOpen: false,
      activeModal: null,
    });
  },
  showCombatKillToast: (data: BattleReportData) => {
    // Record into battle report for history, but DO NOT open blocking full modal!
    set({
      battleReport: { ...data, timestamp: data.timestamp || Date.now() },
      combatKillToast: { ...data, timestamp: data.timestamp || Date.now() },
    });
    // Auto dismiss quickly after 2.6 seconds so it never blocks gameplay
    if (combatToastTimer) clearTimeout(combatToastTimer);
    combatToastTimer = setTimeout(() => {
      set({ combatKillToast: null });
    }, 2600);
  },
  clearCombatKillToast: () => {
    if (combatToastTimer) clearTimeout(combatToastTimer);
    set({ combatKillToast: null });
  },
  recordCombatHit: (damage: number, isCrit = false) => {
    const s = get();
    const now = Date.now();
    const startTime = s.currentFightStartTime > 0 && now - s.currentFightStartTime < 60000
      ? s.currentFightStartTime
      : now;
    set({
      currentFightDamageDealt: s.currentFightDamageDealt + damage,
      currentFightCritHits: s.currentFightCritHits + (isCrit ? 1 : 0),
      currentFightStartTime: startTime,
    });
  },
  resetCombatMetrics: () => {
    set({
      currentFightDamageDealt: 0,
      currentFightCritHits: 0,
      currentFightStartTime: Date.now(),
    });
  },
  toggleSoundMute: () => {
    const next = !get().soundMuted;
    set({ soundMuted: next });
    setAudioMuted(next);
    return next;
  },
  setSoundMuted: (muted: boolean) => {
    set({ soundMuted: muted });
    setAudioMuted(muted);
  },

  spawnLoot: (items) => {
    set((s) => ({
      droppedLoot: [...s.droppedLoot, ...items],
    }));
  },

  removeLoot: (id) => {
    set((s) => ({
      droppedLoot: s.droppedLoot.filter((item) => item.id !== id),
    }));
  },

  pickUpLoot: (item) => {
    const s = get();
    // 1. Remove from ground
    set((state) => ({
      droppedLoot: state.droppedLoot.filter((x) => x.id !== item.id),
    }));

    // 2. Handle Pickup by Type
    if (item.type === "gold") {
      set((state) => ({
        playerGold: state.playerGold + item.value,
      }));
      playCombatSFX("coin_chime", 0.55);
      s.addFloatingText(`+${item.value} Vàng`, s.playerPosition.clone().add(new THREE.Vector3(0, 2.2, 0)), "#fbbf24");
    } else if (item.type === "potion") {
      const healAmt = item.value || 120;
      set((state) => ({
        playerHealth: Math.min(state.playerMaxHealth, state.playerHealth + healAmt),
      }));
      playCombatSFX("loot_drop", 0.45);
      s.addFloatingText(`+${healAmt} HP`, s.playerPosition.clone().add(new THREE.Vector3(0, 2.2, 0)), "#22c55e");
    } else {
      // Equipment item (Weapon, Armor, Accessory)
      const newInvItem: CharacterInventoryItem = {
        id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        itemId: item.itemId,
        name: item.name,
        type: item.type,
        rarity: item.rarity,
        equipped: false,
        hpBoost: item.type === "armor" ? item.value * 2 : 0,
        atkBoost: item.type === "weapon" ? item.value : 0,
        defBoost: item.type === "armor" ? Math.round(item.value * 0.4) : 0,
        spdBoost: item.type === "accessory" ? 0.4 : 0,
        icon: item.icon,
        color: item.color,
      };

      set((state) => ({
        inventoryItems: [newInvItem, ...state.inventoryItems],
      }));

      const isRareOrAbove = item.rarity === "epic" || item.rarity === "legendary";
      if (isRareOrAbove) {
        playCombatSFX("rarity_chime", 0.8);
        playCombatSFX("holy_bell", 0.7);
        playCombatSFX("level_up_fanfare", 0.65);
        set({
          zoneNotification: `✨ [RƠI ĐỒ QUÝ HIẾM] Bạn vừa nhận được ${item.rarity === "legendary" ? "Huyền Thoại (LEGENDARY)" : "Sử Thi (EPIC)"}: ${item.name}!`,
          zoneNotificationTimer: 6.0,
        });
      } else {
        playCombatSFX("loot_drop", 0.5);
      }

      s.addFloatingText(`✨ [${item.rarity.toUpperCase()}] ${item.name}`, s.playerPosition.clone().add(new THREE.Vector3(0, 2.6, 0)), item.color);

      // Quest Progress: Item Collection
      s.progressQuest("COLLECT_ITEM", item.itemId, 1);

      // Trigger backend database sync if callback registered
      if (s.onItemAcquiredCallback) {
        s.onItemAcquiredCallback(item.itemId);
      }
    }
  },

  pickUpNearbyLoot: (radius = 3.8) => {
    const s = get();
    const p = s.playerPosition;
    const nearby = s.droppedLoot.find((item) => {
      const d = Math.hypot(item.position[0] - p.x, item.position[2] - p.z);
      return d <= radius;
    });
    if (nearby) {
      s.pickUpLoot(nearby);
    }
  },

  equipItem: (id) => {
    const s = get();
    const target = s.inventoryItems.find((x) => x.id === id);
    if (!target) return;

    const willEquip = !target.equipped;

    // Toggle equipment and adjust stats
    set((state) => {
      const updated = state.inventoryItems.map((it) => {
        // Unequip any other item of same type if equipping
        if (willEquip && it.type === target.type && it.id !== id) {
          return { ...it, equipped: false };
        }
        if (it.id === id) {
          return { ...it, equipped: willEquip };
        }
        return it;
      });

      // Recalculate bonuses from all equipped items
      let bonusHp = 0;
      let bonusDef = 0;
      updated.filter((x) => x.equipped).forEach((x) => {
        bonusHp += x.hpBoost;
        bonusDef += x.defBoost;
      });

      const baseHp = 500;
      const newMaxHp = baseHp + bonusHp;

      return {
        inventoryItems: updated,
        playerMaxHealth: newMaxHp,
        playerHealth: Math.min(newMaxHp, state.playerHealth),
      };
    });

    s.addFloatingText(willEquip ? `Đã trang bị: ${target.name}` : `Đã tháo: ${target.name}`, s.playerPosition.clone().add(new THREE.Vector3(0, 2.2, 0)), willEquip ? "#38bdf8" : "#94a3b8");
    playCombatSFX("blade_slash", 0.35);
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

    // Tank Passive: Retaliation & Damage reduction
    let damageTaken = amount;
    if (s.playerClassId === "tank") {
      damageTaken = Math.max(1, Math.round(amount * 0.7)); // 30% reduction
      // Retaliate holy shockwave
      s.addSlashEffect({
        id: nextSlashId++,
        position: s.playerPosition.clone(),
        radius: 3.0,
        color: "#ffd700",
        lifetime: 0.3,
        maxLifetime: 0.3,
      });
      playCombatSFX("holy_bell", 0.3);
    }

    const newHp = Math.max(0, s.playerHealth - damageTaken);
    const newPos = s.playerPosition.clone();
    if (fromDir) {
      newPos.addScaledVector(fromDir, 0.4);
    }

    // Add floating damage text
    s.addFloatingText(`-${damageTaken}`, s.playerPosition.clone().add(new THREE.Vector3(0, 2.2, 0)), "#ff3333");

    if (newHp <= 0) {
      // Player died: respawn at village center
      set({
        playerHealth: s.playerMaxHealth,
        playerPosition: new THREE.Vector3(0, 0, 0),
        isInvincible: true,
        invincibleTimer: 2.5,
        zoneNotification: "💀 Bạn đã hồi sinh an toàn tại Làng Long Tộc!",
        zoneNotificationTimer: 4.0,
        cameraShakeIntensity: 0.5,
        hitFlashTimer: 0.12,
        playerDebuffs: [],
        isStunned: false,
        slowSpeedMultiplier: 1.0,
      });

      // Show Defeat Card
      get().openBattleReport({
        victory: false,
        monsterName: "Quái Vật Đại Lục / Boss",
        monsterLevel: s.playerLevel,
        isBoss: false,
        totalDamageDealt: s.currentFightDamageDealt,
        critHits: s.currentFightCritHits,
        durationSeconds: Math.max(1, Math.round((Date.now() - s.currentFightStartTime) / 1000)),
        expGained: 0,
        goldGained: 0,
        drops: [],
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
        cameraShakeIntensity: 0.25,
        hitFlashTimer: 0.12,
      });
    }
  },

  healPlayer: (amount) => {
    set((s) => ({
      playerHealth: Math.min(s.playerMaxHealth, s.playerHealth + amount),
    }));
  },

  useQuickPotionHp: () => {
    const s = get();
    if (s.potionCountHp <= 0) {
      s.addFloatingText("Hết Bình Máu!", s.playerPosition.clone().add(new THREE.Vector3(0, 2.2, 0)), "#ef4444");
      return;
    }
    const healAmt = Math.round(s.playerMaxHealth * 0.35);
    set((state) => ({
      playerHealth: Math.min(state.playerMaxHealth, state.playerHealth + healAmt),
      potionCountHp: state.potionCountHp - 1,
    }));
    s.addFloatingText(`+${healAmt} HP (Bình Máu)`, s.playerPosition.clone().add(new THREE.Vector3(0, 2.2, 0)), "#22c55e");
    playCombatSFX("holy_bell", 0.4);
  },

  useQuickPotionMp: () => {
    const s = get();
    if (s.potionCountMp <= 0) {
      s.addFloatingText("Hết Bình Mana!", s.playerPosition.clone().add(new THREE.Vector3(0, 2.2, 0)), "#ef4444");
      return;
    }
    const manaAmt = Math.round(s.playerMaxPp * 0.4);
    set((state) => ({
      playerPp: Math.min(state.playerMaxPp, state.playerPp + manaAmt),
      potionCountMp: state.potionCountMp - 1,
    }));
    s.addFloatingText(`+${manaAmt} MP (Bình Năng Lượng)`, s.playerPosition.clone().add(new THREE.Vector3(0, 2.2, 0)), "#00b4ff");
    playCombatSFX("holy_bell", 0.4);
  },

  useQuickAtkBuff: () => {
    const s = get();
    if (s.buffScrollAtkCount <= 0) {
      s.addFloatingText("Hết Cuộn Tăng Công!", s.playerPosition.clone().add(new THREE.Vector3(0, 2.2, 0)), "#ef4444");
      return;
    }
    set((state) => ({
      atkBuffTimer: 15.0,
      buffScrollAtkCount: state.buffScrollAtkCount - 1,
    }));
    s.addFloatingText("⚔️ +25% Sát Thương (15s)!", s.playerPosition.clone().add(new THREE.Vector3(0, 2.2, 0)), "#f59e0b");
    playCombatSFX("holy_bell", 0.4);
  },

  useQuickTeleport: () => {
    const s = get();
    if (s.teleportCompassCount <= 0) {
      s.addFloatingText("Hết La Bàn Dịch Chuyển!", s.playerPosition.clone().add(new THREE.Vector3(0, 2.2, 0)), "#ef4444");
      return;
    }
    set((state) => ({
      playerPosition: new THREE.Vector3(0, 0, 0),
      currentZone: "SAFE_VILLAGE",
      zoneNotification: "🛡️ Đã dịch chuyển về Làng Long Tộc!",
      zoneNotificationTimer: 4.0,
      teleportCompassCount: state.teleportCompassCount - 1,
    }));
    s.addFloatingText("✨ Dịch Chuyển Về Làng!", s.playerPosition.clone().add(new THREE.Vector3(0, 2.2, 0)), "#00ff88");
    playCombatSFX("holy_bell", 0.5);
  },

  useQuickShield: () => {
    const s = get();
    if (s.shieldScrollCount <= 0) {
      s.addFloatingText("Hết Cuộn Khiên Thánh!", s.playerPosition.clone().add(new THREE.Vector3(0, 2.2, 0)), "#ef4444");
      return;
    }
    const shieldAmt = Math.round(s.playerMaxHealth * 0.35);
    set((state) => ({
      shieldAmount: shieldAmt,
      shieldTimer: 5.0,
      shieldScrollCount: state.shieldScrollCount - 1,
    }));
    s.addFloatingText(`🛡️ Khiên Thánh (${shieldAmt}) 5s!`, s.playerPosition.clone().add(new THREE.Vector3(0, 2.2, 0)), "#38bdf8");
    playCombatSFX("holy_bell", 0.4);
  },

  useQuickFood: (type) => {
    const s = get();
    if (type === "meat") {
      if (s.foodMeatCount <= 0) return;
      const healAmt = Math.round(s.playerMaxHealth * 0.2);
      set((state) => ({
        playerHealth: Math.min(state.playerMaxHealth, state.playerHealth + healAmt),
        foodMeatCount: state.foodMeatCount - 1,
      }));
      s.addFloatingText(`🍖 Ăn Thịt (+${healAmt} HP)`, s.playerPosition.clone().add(new THREE.Vector3(0, 2.2, 0)), "#fbbf24");
    } else if (type === "soup") {
      if (s.foodSoupCount <= 0) return;
      const mpAmt = Math.round(s.playerMaxPp * 0.25);
      set((state) => ({
        playerPp: Math.min(state.playerMaxPp, state.playerPp + mpAmt),
        foodSoupCount: state.foodSoupCount - 1,
      }));
      s.addFloatingText(`🍲 Súp Hầm (+${mpAmt} MP)`, s.playerPosition.clone().add(new THREE.Vector3(0, 2.2, 0)), "#38bdf8");
    } else {
      if (s.speedPotionCount <= 0) return;
      set((state) => ({
        speedPotionCount: state.speedPotionCount - 1,
      }));
      s.addFloatingText("⚡ Tốc Độ +30% (10s)", s.playerPosition.clone().add(new THREE.Vector3(0, 2.2, 0)), "#a855f7");
    }
    playCombatSFX("holy_bell", 0.3);
  },

  addFever: (amt) => {
    const s = get();
    if (s.feverActive) return;
    const nextVal = Math.min(100, s.feverGauge + amt);
    if (nextVal >= 100) {
      set({
        feverGauge: 100,
        feverActive: true,
        feverTimer: 12.0,
      });
      s.addFloatingText("🔥 CUỒNG NỘ CHIẾN THẦN (+35% Sát Thương)!", s.playerPosition.clone().add(new THREE.Vector3(0, 2.5, 0)), "#00ff88");
      playCombatSFX("dragon_roar", 0.5);
    } else {
      set({ feverGauge: nextVal });
    }
  },

  activateFever: () => {
    const s = get();
    if (s.feverGauge >= 100 && !s.feverActive) {
      set({
        feverActive: true,
        feverTimer: 12.0,
      });
      s.addFloatingText("🔥 CUỒNG NỘ CHIẾN THẦN (12s)!", s.playerPosition.clone().add(new THREE.Vector3(0, 2.5, 0)), "#00ff88");
      playCombatSFX("dragon_roar", 0.5);
    }
  },

  // ── 3-Hit Combo System with Realistic Physics & Game Feel ─────────────────
  triggerComboAttack: () => {
    const s = get();
    const blueprint = getCharacterBlueprint(s.playerClassId);
    const currentStep = s.comboIndex; // 0, 1, or 2
    const attackSpec: CombatSkillSpec = blueprint.comboAttacks[currentStep] || blueprint.comboAttacks[0];

    const forwardDir = s.playerFacingLeft ? -1 : 1;
    const forwardVec = new THREE.Vector3(forwardDir, 0, 0);
    const facingAngle = s.playerFacingLeft ? Math.PI : 0;

    // Advance combo step & reset window timer
    const nextStep = ((currentStep + 1) % 3) as 0 | 1 | 2;
    const nextPassiveCounter = (s.passiveCounter + 1) % 4; // 0, 1, 2, 3 (4th hit is index 3)
    const isGunnerCrit = s.playerClassId === "gunner" && nextPassiveCounter === 0;

    // Movement Physics
    const newPos = s.playerPosition.clone();
    if (attackSpec.movementPhysics.selfMovement === "STEP_FORWARD") {
      newPos.addScaledVector(forwardVec, attackSpec.movementPhysics.moveDistance);
    }

    // Play Synthesized Combat Audio
    playCombatSFX(attackSpec.gameFeel.sfxSynthPreset, 0.4);

    // Camera Shake
    const shake = Math.max(s.cameraShakeIntensity, attackSpec.gameFeel.cameraShake);

    // Projectile or Melee Visuals
    if (attackSpec.targetImpact.hitShape === "PROJECTILE_SINGLE" || attackSpec.targetImpact.hitShape === "LINE_PIERCE") {
      s.addBullet({
        id: nextBulletId++,
        position: newPos.clone().add(new THREE.Vector3(forwardDir * 0.8, 1.2, 0)),
        velocity: new THREE.Vector3(forwardDir * 20, 0, 0),
        damage: Math.round(blueprint.baseStats.atk * attackSpec.targetImpact.damageMultiplier * (isGunnerCrit ? 2.0 : 1.0)),
        lifetime: 1.8,
        color: isGunnerCrit ? "#f43f5e" : attackSpec.vfx.primaryColor,
      });
    } else {
      s.addSlashEffect({
        id: nextSlashId++,
        position: newPos.clone().add(new THREE.Vector3(forwardDir * 1.2, 1.0, 0)),
        radius: attackSpec.targetImpact.aoeRadius,
        color: attackSpec.vfx.primaryColor,
        lifetime: attackSpec.vfx.duration,
        maxLifetime: attackSpec.vfx.duration,
      });
    }

    // Spawn 3D Shader VFX
    const vfxSpawnPos = newPos.clone().add(new THREE.Vector3(forwardDir * 1.0, 0.8, 0));
    s.spawnVFX(attackSpec.vfx, vfxSpawnPos, facingAngle);

    set({
      playerPosition: newPos,
      playerAnimState: "attack",
      comboIndex: nextStep,
      comboTimer: 0.85, // 850ms window to link combo
      passiveCounter: nextPassiveCounter,
      passiveActive: isGunnerCrit,
      cameraShakeIntensity: shake,
    });
  },

  // ── Realistic Skill Trigger with Movement Physics & I-Frames ──────────────
  triggerSkill: (skillIndex) => {
    const s = get();
    const blueprint = getCharacterBlueprint(s.playerClassId);

    // If skillIndex is 0, trigger combo attack
    if (skillIndex === 0) {
      s.triggerComboAttack();
      return;
    }

    const skill: CombatSkillSpec | undefined = blueprint.skills[skillIndex - 1];
    if (!skill) return;

    const cdKey = `skill${skillIndex}`;
    if ((s.skillCooldowns[cdKey] || 0) > 0) return; // Still cooling down

    const forwardDir = s.playerFacingLeft ? -1 : 1;
    const forwardVec = new THREE.Vector3(forwardDir, 0, 0);
    const facingAngle = s.playerFacingLeft ? Math.PI : 0;

    // 1. Set Cooldown
    const updatedCds = { ...s.skillCooldowns, [cdKey]: skill.cooldown };

    // 2. Movement Physics
    const newPos = s.playerPosition.clone();
    const moveType = skill.movementPhysics.selfMovement;
    const moveDist = skill.movementPhysics.moveDistance;

    if (moveType === "DASH_THROUGH_TARGET" || moveType === "STEP_FORWARD") {
      newPos.addScaledVector(forwardVec, moveDist);
    } else if (moveType === "BACKFLIP_EVADE") {
      newPos.addScaledVector(forwardVec, -moveDist);
    } else if (moveType === "LEAP_TO_TARGET") {
      newPos.addScaledVector(forwardVec, moveDist * 0.8);
      newPos.y += 0.5; // slight arc leap
    }

    // 3. Invulnerability (I-Frame)
    let invin = s.isInvincible;
    let invinTimer = s.invincibleTimer;
    if (skill.movementPhysics.grantInvulnerabilityMs) {
      invin = true;
      invinTimer = skill.movementPhysics.grantInvulnerabilityMs / 1000;
    }

    // 4. Play Synthesizer Audio & Camera Shake
    playCombatSFX(skill.gameFeel.sfxSynthPreset, 0.5);
    const shake = Math.max(s.cameraShakeIntensity, skill.gameFeel.cameraShake);

    // 5. Spawn Custom Shader VFX
    const vfxSpawnPos = newPos.clone().add(new THREE.Vector3(forwardDir * 1.0, 0.8, 0));
    s.spawnVFX(skill.vfx, vfxSpawnPos, facingAngle);

    // 6. Projectile or Slash for skills
    if (skill.targetImpact.hitShape === "PROJECTILE_SINGLE" || skill.targetImpact.hitShape === "LINE_PIERCE") {
      s.addBullet({
        id: nextBulletId++,
        position: newPos.clone().add(new THREE.Vector3(forwardDir * 0.8, 1.2, 0)),
        velocity: new THREE.Vector3(forwardDir * 24, 0, 0),
        damage: Math.round(blueprint.baseStats.atk * skill.targetImpact.damageMultiplier),
        lifetime: 2.0,
        color: skill.vfx.primaryColor,
      });
    } else {
      s.addSlashEffect({
        id: nextSlashId++,
        position: newPos.clone().add(new THREE.Vector3(forwardDir * 1.5, 0.9, 0)),
        radius: skill.targetImpact.aoeRadius,
        color: skill.vfx.primaryColor,
        lifetime: skill.vfx.duration,
        maxLifetime: skill.vfx.duration,
      });
    }

    // 7. Class-Specific Skill Mechanics & Combat Effects
    let extraShield = s.shieldAmount;
    let extraShieldTimer = s.shieldTimer;
    let extraHp = s.playerHealth;

    if (skill.id === "tank_aegis_sanctuary") {
      const shieldVal = Math.round(s.playerMaxHealth * 0.5);
      const healVal = Math.round(s.playerMaxHealth * 0.15);
      extraShield = (s.shieldAmount || 0) + shieldVal;
      extraShieldTimer = 5.0;
      extraHp = Math.min(s.playerMaxHealth, s.playerHealth + healVal);
      s.addFloatingText(`🛡️ KHIÊN THÁNH BẤT HOẠI (+${shieldVal} Shield, +${healVal} HP)!`, newPos.clone().add(new THREE.Vector3(0, 2.4, 0)), "#ffd700");
    } else if (skill.id === "gunner_tactical_backflip") {
      // Drop EMP shockwave mine at previous spot
      s.addSlashEffect({
        id: nextSlashId++,
        position: s.playerPosition.clone(),
        radius: 3.5,
        color: "#00f2ff",
        lifetime: 0.8,
        maxLifetime: 0.8,
      });
      s.addFloatingText("⚡ MÌN TỪ TRƯỜNG KÍCH HOẠT!", s.playerPosition.clone().add(new THREE.Vector3(0, 2.2, 0)), "#00f2ff");
    } else if (skill.id === "fighter_dragon_cataclysm") {
      s.addFloatingText("☄️ HỎA LONG DIỆT THẾ!", newPos.clone().add(new THREE.Vector3(0, 2.4, 0)), "#f97316");
    } else if (skill.id === "assassin_phantom_lotus_execution") {
      s.addFloatingText("🩸 THẬP TỰ TUYỆT SÁT!", newPos.clone().add(new THREE.Vector3(0, 2.4, 0)), "#f43f5e");
    }

    // Update state
    set({
      playerPosition: newPos,
      playerAnimState: "attack",
      skillCooldowns: updatedCds,
      isInvincible: invin,
      invincibleTimer: invinTimer,
      cameraShakeIntensity: shake,
      shieldAmount: extraShield,
      shieldTimer: extraShieldTimer,
      playerHealth: extraHp,
    });
  },

  spawnVFX: (config, position, direction = 0) => {
    set((state) => ({
      activeVFXList: [
        ...state.activeVFXList,
        {
          id: nextVFXId++,
          config,
          position: position.clone(),
          direction,
        },
      ],
    }));
  },

  removeVFX: (id) => {
    set((state) => ({
      activeVFXList: state.activeVFXList.filter((item) => item.id !== id),
    }));
  },

  addBullet: (bullet) => {
    set((s) => ({ bullets: [...s.bullets, bullet] }));
  },

  removeBullet: (id) => {
    set((s) => ({ bullets: s.bullets.filter((b) => b.id !== id) }));
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

  setBossRaidState: (data) => {
    set((s) => ({
      bossHealth: data.health !== undefined ? Math.max(0, data.health) : s.bossHealth,
      bossMaxHealth: data.maxHealth ?? s.bossMaxHealth,
      bossStagger: data.stagger !== undefined ? Math.max(0, Math.min(100, data.stagger)) : s.bossStagger,
      bossIsStaggered: data.isStaggered !== undefined ? data.isStaggered : s.bossIsStaggered,
      bossPhase: data.phase ?? s.bossPhase,
      bossCastingSpell: data.castingSpell !== undefined ? data.castingSpell : s.bossCastingSpell,
      bossCastingTimer: data.castingTimer !== undefined ? data.castingTimer : s.bossCastingTimer,
    }));
  },

  setZone: (zone, notification) => {
    const current = get().currentZone;
    if (current !== zone) {
      let defaultNotif = "⚔️ Đấu Trường Hoang Dã — Quái vật lang thang (Lv.1 - Lv.5)";
      if (zone === "SAFE_VILLAGE") {
        defaultNotif = "🛡️ Làng Long Tộc — Khu Vực An Toàn (Tự động hồi 5% HP/MP mỗi giây)";
      } else if (zone === "DEAD_MARSH") {
        defaultNotif = "☠️ Vùng Đất Chết & Đầm Lầy Hoang Dã (Lv.6 - Lv.10) — Nguy Hiểm Cực Độ!";
      } else if (zone === "BOSS_ALTAR") {
        defaultNotif = "🔥 Cấm Địa Săn Boss — Rồng Lửa Cổ Đại Thức Tỉnh (Boss Lv.20)!";
      } else if (zone === "DUNGEON") {
        defaultNotif = "🏰 Hang Động Phó Bản — Quái Vật Tinh Anh & Phần Thưởng Hậu Hĩnh!";
      }

      set({
        currentZone: zone,
        zoneNotification: notification !== undefined ? notification : defaultNotif,
        zoneNotificationTimer: 4.0,
      });
    }
  },

  setWeather: (weather) => set({ weather }),
  setIsLevelSuppressed: (isLevelSuppressed) => set({ isLevelSuppressed }),
  triggerZoneWarning: (text) => set({ zoneWarningBanner: text, zoneWarningTimer: 4.5 }),
  openDungeonModal: () => set({ dungeonModalOpen: true }),
  closeDungeonModal: () => set({ dungeonModalOpen: false }),
  triggerZoneTransition: (targetZoneName: string, onExecute: () => void) => {
    const randomTip = GAMEPLAY_TIPS[Math.floor(Math.random() * GAMEPLAY_TIPS.length)];
    set({
      isTransitionLoading: true,
      transitionProgress: 0,
      transitionTargetZone: targetZoneName,
      transitionTip: randomTip,
    });

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 20;
      if (currentProgress === 60) {
        onExecute();
      }
      if (currentProgress >= 100) {
        clearInterval(interval);
        set({ transitionProgress: 100 });
        setTimeout(() => {
          set({ isTransitionLoading: false, transitionProgress: 0 });
        }, 350);
      } else {
        set({ transitionProgress: currentProgress });
      }
    }, 150);
  },

  claimRewardBonus: (exp: number, gold: number, notification?: string) => {
    const s = get();
    const newGold = s.playerGold + gold;
    const newExp = s.playerExp + exp;
    let newLevel = s.playerLevel;
    let expToNext = s.playerExpToNext;

    while (newExp >= expToNext) {
      newLevel += 1;
      expToNext = Math.round(expToNext * 1.5);
    }

    set({
      playerGold: newGold,
      playerExp: newExp,
      playerLevel: newLevel,
      playerExpToNext: expToNext,
      zoneNotification: notification || `🎁 NHẬN THƯỞNG: +${exp} EXP, +${gold} Vàng!`,
      zoneNotificationTimer: 4.5,
    });

    s.addFloatingText(`+${gold} Vàng`, s.playerPosition.clone().add(new THREE.Vector3(0, 2.4, 0)), "#fbbf24");
    s.addFloatingText(`+${exp} EXP`, s.playerPosition.clone().add(new THREE.Vector3(0, 2.8, 0)), "#38bdf8");
  },

  enterDungeon: (difficulty) => {
    get().triggerZoneTransition(`HANG ĐỘNG PHÓ BẢN (${difficulty.toUpperCase()})`, () => {
      set({
        dungeonDifficulty: difficulty,
        dungeonModalOpen: false,
        currentZone: "DUNGEON",
        weather: "BLOOD_MOON",
        playerPosition: new THREE.Vector3(0, 0, -68),
        zoneNotification: `⚔️ BƯỚC VÀO HANG ĐỘNG PHÓ BẢN (${difficulty.toUpperCase()})!`,
        zoneNotificationTimer: 4.5,
      });
    });
  },

  leaveDungeon: () => {
    get().triggerZoneTransition("LÀNG LONG TỘC (KHU VỰC AN TOÀN)", () => {
      set({
        currentZone: "SAFE_VILLAGE",
        weather: "SUNNY",
        playerPosition: new THREE.Vector3(0, 0, 0),
        zoneNotification: "🛡️ RỜI PHÓ BẢN TRỞ VỀ LÀNG AN TOÀN",
        zoneNotificationTimer: 4.0,
      });
    });
  },

  toggleCharacterRenderMode: () => {
    set((s) => ({
      characterRenderMode: s.characterRenderMode === "2.5d_sprite" ? "3d_model" : "2.5d_sprite",
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
    const blueprint = getCharacterBlueprint(char.classId);

    set((s) => {
      const maxHp = char.maxHp || s.playerMaxHealth;
      const hp = Math.min(char.hp || s.playerHealth, maxHp);

      return {
        playerName: char.name || s.playerName,
        playerClassId: char.classId || s.playerClassId,
        playerClassName: char.className || blueprint.className || s.playerClassName,
        playerGender: char.gender || (typeof window !== "undefined" ? localStorage.getItem(`character_gender_${char.id}`) : null) || s.playerGender || "male",
        playerColorHex: blueprint.color || s.playerColorHex,
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

  addGold: (amount) => {
    set((s) => ({ playerGold: Math.max(0, s.playerGold + amount) }));
  },

  applyPlayerDebuff: (debuff) => {
    const s = get();
    if (s.isInvincible || s.currentZone === "SAFE_VILLAGE") return;

    // Refresh existing debuff or add new
    const existingIndex = s.playerDebuffs.findIndex((d) => d.type === debuff.type);
    const updated = [...s.playerDebuffs];
    const newEntry: ActiveDebuff = {
      id: `debuff_${debuff.type}_${Date.now()}`,
      type: debuff.type,
      name: debuff.name,
      icon: debuff.icon,
      duration: debuff.duration,
      maxDuration: debuff.duration,
      magnitude: debuff.magnitude ?? 0.35,
      tickInterval: debuff.tickInterval ?? 0.5,
      tickDamage: debuff.tickDamage ?? 12,
      tickTimer: 0,
    };

    if (existingIndex >= 0) {
      updated[existingIndex] = newEntry;
    } else {
      updated.push(newEntry);
    }

    s.addFloatingText(`${debuff.icon} ${debuff.name}!`, s.playerPosition.clone().add(new THREE.Vector3(0, 2.6, 0)), "#ef4444");

    const isStunned = updated.some((d) => d.type === "STUN");
    const slowDebuff = updated.find((d) => d.type === "SLOW");
    const slowSpeedMultiplier = slowDebuff ? Math.max(0.2, 1.0 - (slowDebuff.magnitude ?? 0.35)) : 1.0;

    set({
      playerDebuffs: updated,
      isStunned,
      slowSpeedMultiplier,
    });
  },

  removePlayerDebuff: (type) => {
    const s = get();
    const updated = s.playerDebuffs.filter((d) => d.type !== type);
    const isStunned = updated.some((d) => d.type === "STUN");
    const slowDebuff = updated.find((d) => d.type === "SLOW");
    const slowSpeedMultiplier = slowDebuff ? Math.max(0.2, 1.0 - (slowDebuff.magnitude ?? 0.35)) : 1.0;

    set({
      playerDebuffs: updated,
      isStunned,
      slowSpeedMultiplier,
    });
  },

  clearPlayerDebuffs: () => {
    set({
      playerDebuffs: [],
      isStunned: false,
      slowSpeedMultiplier: 1.0,
    });
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

    // 1.5 Hit flash reaction decay (120ms)
    const newHitFlash = Math.max(0, s.hitFlashTimer - dt);

    // 1.8 Player Debuffs Ticking & DoT Damage
    let currentHp = s.playerHealth;
    const remainingDebuffs: ActiveDebuff[] = [];

    for (const d of s.playerDebuffs) {
      d.duration -= dt;
      if (d.duration <= 0) continue;

      if (d.type === "BLEED" || d.type === "POISON") {
        d.tickTimer = (d.tickTimer || 0) + dt;
        const interval = d.tickInterval || 0.5;
        if (d.tickTimer >= interval) {
          d.tickTimer -= interval;
          const dmg = d.tickDamage || 12;
          currentHp = Math.max(1, currentHp - dmg);
          s.addFloatingText(
            `-${dmg} ${d.icon}`,
            s.playerPosition.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.8, 2.2, (Math.random() - 0.5) * 0.8)),
            d.type === "BLEED" ? "#dc2626" : "#10b981"
          );
        }
      }
      remainingDebuffs.push(d);
    }

    const isStunned = remainingDebuffs.some((d) => d.type === "STUN");
    const slowDebuff = remainingDebuffs.find((d) => d.type === "SLOW");
    const slowSpeedMultiplier = slowDebuff ? Math.max(0.2, 1.0 - (slowDebuff.magnitude ?? 0.35)) : 1.0;

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

    // 4. Combo window timer
    let nextCombo = s.comboIndex;
    let nextComboTimer = s.comboTimer;
    if (nextComboTimer > 0) {
      nextComboTimer -= dt;
      if (nextComboTimer <= 0) {
        nextCombo = 0; // reset combo chain to hit 1
        nextComboTimer = 0;
      }
    }

    // 5. Camera Shake decay
    const nextShake = Math.max(0, s.cameraShakeIntensity - dt * 2.5);

    // 6. Update Fighter Fury passive
    const fury = Math.max(0, Math.min(100, ((s.playerMaxHealth - s.playerHealth) / s.playerMaxHealth) * 100));

    // 7. Update Floating Texts
    const updatedTexts = s.floatingTexts
      .map((t) => {
        t.position.y += 1.2 * dt;
        t.lifetime -= dt;
        return t;
      })
      .filter((t) => t.lifetime > 0);

    // 8. Update Slash Effects
    const updatedSlashes = s.slashEffects
      .map((sl) => {
        sl.lifetime -= dt;
        return sl;
      })
      .filter((sl) => sl.lifetime > 0);

    // 8.5 Update & Despawn Bullets
    const updatedBullets = s.bullets
      .map((b) => {
        b.position.addScaledVector(b.velocity, dt);
        b.lifetime -= dt;
        return b;
      })
      .filter((b) => b.lifetime > 0);

    // 9. Safe Village Auto-regen 5% Max HP/s & MP Regen (15 MP/s in Safe Village, 6 MP/s elsewhere)
    let hpAcc = s.hpRegenAcc || 0;
    let mpAcc = s.mpRegenAcc || 0;
    if (s.currentZone === "SAFE_VILLAGE" && currentHp < s.playerMaxHealth) {
      hpAcc += s.playerMaxHealth * 0.05 * dt;
      if (hpAcc >= 1) {
        const addHp = Math.floor(hpAcc);
        currentHp = Math.min(s.playerMaxHealth, currentHp + addHp);
        hpAcc -= addHp;
      }
    } else {
      hpAcc = 0;
    }

    let currentPp = s.playerPp;
    const mpRegenRate = s.currentZone === "SAFE_VILLAGE" ? 15 : 6;
    if (currentPp < s.playerMaxPp) {
      mpAcc += mpRegenRate * dt;
      if (mpAcc >= 1) {
        const addMp = Math.floor(mpAcc);
        currentPp = Math.min(s.playerMaxPp, currentPp + addMp);
        mpAcc -= addMp;
      }
    }

    // 9.5 Weather Auto-Cycle (every 75s when in open biomes)
    let weatherTimer = (s.weatherTimer || 0) + dt;
    let weather = s.weather;
    if (weatherTimer >= 75 && (s.currentZone === "WILDERNESS" || s.currentZone === "DEAD_MARSH")) {
      weatherTimer = 0;
      const weathers: WorldWeather[] = ["SUNNY", "RAIN", "DARK_FOG"];
      const nextIdx = (weathers.indexOf(weather) + 1) % weathers.length;
      weather = weathers[nextIdx] || "SUNNY";
    }

    // 10. Fever & Buff timers decay
    let feverActive = s.feverActive;
    let feverTimer = s.feverTimer;
    let feverGauge = s.feverGauge;
    if (feverActive) {
      feverTimer -= dt;
      if (feverTimer <= 0) {
        feverActive = false;
        feverTimer = 0;
        feverGauge = 0;
      }
    }

    const atkBuffTimer = Math.max(0, s.atkBuffTimer - dt);
    const shieldTimer = Math.max(0, s.shieldTimer - dt);
    const shieldAmount = shieldTimer <= 0 ? 0 : s.shieldAmount;

    let warningBanner = s.zoneWarningBanner;
    let warningTimer = s.zoneWarningTimer;
    if (warningTimer > 0) {
      warningTimer -= dt;
      if (warningTimer <= 0) {
        warningBanner = null;
        warningTimer = 0;
      }
    }

    let pvpTimer = s.pvpTimer;
    let pvpResult = s.pvpResult;
    if (s.pvpArenaActive && !pvpResult) {
      pvpTimer -= dt;
      if (pvpTimer <= 0) {
        pvpTimer = 0;
        pvpResult = s.playerHealth >= s.pvpOpponentHp ? "VICTORY" : "DEFEAT";
        if (pvpResult === "VICTORY") {
          s.addFloatingText("🏆 HẾT GIỜ — BẠN ĐÃ CHIẾN THẮNG!", s.playerPosition.clone().add(new THREE.Vector3(0, 2.5, 0)), "#f59e0b");
          playCombatSFX("level_up_fanfare", 0.6);
        } else {
          s.addFloatingText("☠️ HẾT GIỜ — ĐỐI THỦ NHIỀU MÁU HƠN!", s.playerPosition.clone().add(new THREE.Vector3(0, 2.5, 0)), "#ef4444");
        }
      }
    }

    let overheadChatTimer = s.overheadChatTimer;
    let overheadChatBubble = s.overheadChatBubble;
    if (overheadChatTimer > 0) {
      overheadChatTimer -= dt;
      if (overheadChatTimer <= 0) {
        overheadChatTimer = 0;
        overheadChatBubble = null;
      }
    }

    set({
      isInvincible: newInvincible,
      invincibleTimer: newInvTimer,
      hitFlashTimer: newHitFlash,
      playerDebuffs: remainingDebuffs,
      isStunned,
      slowSpeedMultiplier,
      zoneNotification: notif,
      zoneNotificationTimer: notifTimer,
      zoneWarningBanner: warningBanner,
      zoneWarningTimer: warningTimer,
      skillCooldowns: updatedCds,
      comboIndex: nextCombo,
      comboTimer: nextComboTimer,
      cameraShakeIntensity: nextShake,
      passiveFuryPercent: fury,
      floatingTexts: updatedTexts,
      slashEffects: updatedSlashes,
      bullets: updatedBullets,
      playerHealth: currentHp,
      playerPp: currentPp,
      feverActive,
      feverTimer,
      feverGauge,
      atkBuffTimer,
      shieldTimer,
      shieldAmount,
      pvpTimer,
      pvpResult,
      overheadChatTimer,
      overheadChatBubble,
      hpRegenAcc: hpAcc,
      mpRegenAcc: mpAcc,
      weatherTimer,
      weather,
    });
  },
}));
