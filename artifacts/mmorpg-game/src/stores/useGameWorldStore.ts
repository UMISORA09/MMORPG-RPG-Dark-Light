import { create } from "zustand";
import * as THREE from "three";
import { getCharacterBlueprint, type SkillVFXConfig, type SkillBlueprint, type CombatSkillSpec } from "@/skills";
import { playCombatSFX } from "@/audio/CombatSoundSynth";
import type { DroppedItem } from "@/canvas/loot/loot.types";

export type WorldZone = "SAFE_VILLAGE" | "WILDERNESS" | "BOSS_ALTAR";

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

export interface GameWorldState {
  // --- Player State ---
  playerPosition: THREE.Vector3;
  playerVelocity: THREE.Vector3;
  playerFacingLeft: boolean;
  playerHealth: number;
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
  playerMaxHealth: number;
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

  // --- Combat Combo & Passive States ---
  comboIndex: 0 | 1 | 2;
  comboTimer: number;
  passiveCounter: number;
  passiveActive: boolean;
  passiveFuryPercent: number;
  cameraShakeIntensity: number;

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

  // --- Overlay Modals ---
  activeModal: "inventory" | "shop" | "leaderboard" | "battleLog" | null;

  // --- Callbacks for Database Sync ---
  onDefeatMonsterCallback: ((monsterId: string) => void) | null;
  onPlayerDefeatedCallback: (() => void) | null;
  onItemAcquiredCallback: ((itemId: string) => void) | null;

  // --- Actions ---
  registerCombatCallbacks: (
    onDefeat: (monsterId: string) => void,
    onPlayerDefeated: () => void,
    onItemAcquired?: (itemId: string) => void
  ) => void;
  spawnLoot: (items: DroppedItem[]) => void;
  removeLoot: (id: string) => void;
  pickUpLoot: (item: DroppedItem) => void;
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
  toggleCharacterRenderMode: () => void;
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
let nextVFXId = 5000;
let nextBulletId = 1000;
let nextSlashId = 2000;

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
  playerClassName: "Chiến Binh",
  playerGender: "male",
  playerColorHex: "#f97316",
  isInvincible: false,
  invincibleTimer: 0,
  characterRenderMode: "2.5d_sprite",

  // Combat Combo & Passive States
  comboIndex: 0,
  comboTimer: 0,
  passiveCounter: 0,
  passiveActive: false,
  passiveFuryPercent: 0,
  cameraShakeIntensity: 0,

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

  // Modals
  activeModal: null,

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
      s.addFloatingText(`+${item.value} Vàng`, s.playerPosition.clone().add(new THREE.Vector3(0, 2.2, 0)), "#fbbf24");
    } else if (item.type === "potion") {
      const healAmt = item.value || 120;
      set((state) => ({
        playerHealth: Math.min(state.playerMaxHealth, state.playerHealth + healAmt),
      }));
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

      s.addFloatingText(`✨ [${item.rarity.toUpperCase()}] ${item.name}`, s.playerPosition.clone().add(new THREE.Vector3(0, 2.6, 0)), item.color);

      // Trigger backend database sync if callback registered
      if (s.onItemAcquiredCallback) {
        s.onItemAcquiredCallback(item.itemId);
      }
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
      });
    }
  },

  healPlayer: (amount) => {
    set((s) => ({
      playerHealth: Math.min(s.playerMaxHealth, s.playerHealth + amount),
    }));
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

    // Update state
    set({
      playerPosition: newPos,
      playerAnimState: "attack",
      skillCooldowns: updatedCds,
      isInvincible: invin,
      invincibleTimer: invinTimer,
      cameraShakeIntensity: shake,
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
      const defaultNotif =
        zone === "SAFE_VILLAGE"
          ? "🛡️ Làng Long Tộc — Khu Vực An Toàn (Tự động hồi phục)"
          : zone === "BOSS_ALTAR"
          ? "🔥 Cấm Địa Săn Boss — Rồng Lửa Cổ Đại Thức Tỉnh!"
          : "⚔️ Đấu Trường Hoang Dã — Quái vật lang thang (PvE)";

      set({
        currentZone: zone,
        zoneNotification: notification !== undefined ? notification : defaultNotif,
        zoneNotificationTimer: 4.0,
      });
    }
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

    // 9. Safe Village Auto-regen 5% Max HP/s
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
      comboIndex: nextCombo,
      comboTimer: nextComboTimer,
      cameraShakeIntensity: nextShake,
      passiveFuryPercent: fury,
      floatingTexts: updatedTexts,
      slashEffects: updatedSlashes,
      playerHealth: currentHp,
    });
  },
}));
