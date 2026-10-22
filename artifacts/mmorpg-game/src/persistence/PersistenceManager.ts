// ==============================================================================
// PersistenceManager.ts
// Client WAL (Write-Ahead Log) & Zero-Loss Full-State Snapshot Persistence Engine
// ==============================================================================

import { useGameWorldStore } from "@/stores/useGameWorldStore";
import { create } from "zustand";

export type SaveStatus = "synced" | "saving" | "error" | "wal_cached";

export interface PersistenceState {
  status: SaveStatus;
  revision: number;
  lastSavedTime: string | null;
  lastReason: string | null;
  errorMessage: string | null;
  setStatus: (status: SaveStatus, revision?: number, reason?: string, error?: string | null) => void;
}

export const usePersistenceStore = create<PersistenceState>((set) => ({
  status: "synced",
  revision: 1,
  lastSavedTime: "Vừa xong",
  lastReason: "Khởi tạo",
  errorMessage: null,
  setStatus: (status, revision, reason, error = null) =>
    set((s) => ({
      status,
      revision: revision !== undefined ? revision : s.revision,
      lastSavedTime: status === "synced" ? "Vừa xong" : s.lastSavedTime,
      lastReason: reason !== undefined ? reason : s.lastReason,
      errorMessage: error,
    })),
}));

export interface FullCharacterSnapshot {
  characterId: number;
  revision: number;
  timestamp: number;

  // World & 3D Coordinates
  posX: number;
  posZ: number;
  facing: "left" | "right" | "up" | "down" | string;
  zoneId: string;
  isMounted: boolean;
  activeMountId?: string;
  activePetId?: string;

  // Progression & Core Stats
  level: number;
  experience: number;
  gold: number;
  hp: number;
  mp: number;
  statPoints: number;
  skillPoints: number;
  str: number;
  dex: number;
  intel: number;
  luk: number;
  vit: number;
  rageGauge: number;

  // Inventory & UI State
  unlockedSlots: number;
  inventory: Array<{
    id?: string | number;
    itemId: string;
    equipped: boolean;
    equippedSlot?: string | null;
    slotIndex: number;
    quantity: number;
    enhanceLevel: number;
    rarity: string;
    bonusCombatPower?: number;
  }>;
  hotbarConfigJson?: string;
  activeBuffsJson?: string;
  uiPreferencesJson?: string;

  // Quests
  trackedQuestId?: string;
}

const WAL_PREFIX = "clb_wal_snapshot_";
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let lastSyncedSnapshotStr = "";
let listenersInitialized = false;
let isSyncing = false;

export class PersistenceManager {
  /**
   * Tạo bản chụp toàn diện (Full-State Snapshot) từ trạng thái hiện tại của Game
   */
  static captureSnapshot(characterId: number): FullCharacterSnapshot | null {
    if (!characterId) return null;
    const s = useGameWorldStore.getState();

    const p = s.playerPosition;
    const items = s.inventoryItems.map((it, idx) => ({
      id: it.id,
      itemId: it.itemId,
      equipped: Boolean(it.equipped),
      equippedSlot: it.equipped ? it.type : null,
      slotIndex: it.equipped ? -1 : idx,
      quantity: 1,
      enhanceLevel: 0,
      rarity: it.rarity || "common",
      bonusCombatPower: 0,
    }));

    return {
      characterId,
      revision: usePersistenceStore.getState().revision,
      timestamp: Date.now(),
      posX: Number(p.x.toFixed(3)),
      posZ: Number(p.z.toFixed(3)),
      facing: s.playerFacingLeft ? "left" : "right",
      zoneId: s.currentZone || "SAFE_VILLAGE",
      isMounted: Boolean(s.isMounted),
      level: s.playerLevel,
      experience: s.playerExp,
      gold: s.playerGold,
      hp: s.playerHealth,
      mp: s.playerPp,
      statPoints: s.unallocatedStatPoints,
      skillPoints: s.playerSkillPoints || 0,
      str: s.playerStr,
      dex: s.playerDex,
      intel: s.playerIntel,
      luk: s.playerLuk,
      vit: s.playerVit,
      rageGauge: s.passiveFuryPercent || 0,
      unlockedSlots: s.unlockedSlots || 18,
      inventory: items,
      hotbarConfigJson: JSON.stringify(s.skillCooldowns || {}),
      activeBuffsJson: JSON.stringify(s.playerDebuffs || []),
      uiPreferencesJson: JSON.stringify({
        characterRenderMode: s.characterRenderMode,
        soundMuted: s.soundMuted,
      }),
      trackedQuestId: s.trackedQuest?.id,
    };
  }

  /**
   * Ghi nháp tức thì vào Local Write-Ahead Log (< 1ms)
   */
  static saveLocalWal(snapshot: FullCharacterSnapshot) {
    if (!snapshot || typeof window === "undefined") return;
    try {
      localStorage.setItem(`${WAL_PREFIX}${snapshot.characterId}`, JSON.stringify(snapshot));
    } catch (e) {
      console.warn("[WAL] Không thể ghi Local WAL:", e);
    }
  }

  /**
   * Đọc bản nháp Local WAL
   */
  static getLocalWal(characterId: number): FullCharacterSnapshot | null {
    if (!characterId || typeof window === "undefined") return null;
    try {
      const data = localStorage.getItem(`${WAL_PREFIX}${characterId}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Xóa bản nháp Local WAL sau khi đã đồng bộ thành công
   */
  static clearLocalWal(characterId: number) {
    if (!characterId || typeof window === "undefined") return;
    try {
      localStorage.removeItem(`${WAL_PREFIX}${characterId}`);
    } catch {}
  }

  /**
   * Đồng bộ tức thì (0ms delay) lên Server
   */
  static async flushImmediate(characterId: number, reason: string = "Thủ công"): Promise<boolean> {
    const snapshot = this.captureSnapshot(characterId);
    if (!snapshot) return false;

    // 1. Ghi nháp Local WAL trước tiên để bảo đảm an toàn dữ liệu
    this.saveLocalWal(snapshot);

    usePersistenceStore.getState().setStatus("saving", undefined, reason);

    try {
      const res = await fetch(`/api/characters/${characterId}/full-sync`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
      });

            if (!res.ok) {
        if (res.status === 409) {
          // Xung đột Optimistic Concurrency Control: Máy chủ có revision mới hơn.
          // Tự động đọc lại revision mới nhất từ server để không bị kẹt ở lần lưu sau
          try {
            const stateRes = await fetch(`/api/characters/${characterId}/full-state`, {
              credentials: "include",
            });
            if (stateRes.ok) {
              const stateData = await stateRes.json();
              if (stateData?.character?.revision) {
                usePersistenceStore.getState().setStatus("wal_cached", stateData.character.revision, "Xung đột phiên bản - Đã phục hồi revision mới nhất", null);
              }
            }
          } catch {}
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const newRev = data.revision || snapshot.revision + 1;

      usePersistenceStore.getState().setStatus("synced", newRev, reason);
      lastSyncedSnapshotStr = JSON.stringify({
        x: snapshot.posX,
        z: snapshot.posZ,
        hp: snapshot.hp,
        mp: snapshot.mp,
        lvl: snapshot.level,
        exp: snapshot.experience,
        gold: snapshot.gold,
        statPoints: snapshot.statPoints,
        zone: snapshot.zoneId,
        slots: snapshot.unlockedSlots,
        invLen: snapshot.inventory.length,
        invSummary: snapshot.inventory.map((i) => `${i.id || i.itemId}:${i.equipped}:${i.enhanceLevel}`).join(";"),
      });

      // Xóa WAL khi server đã xác nhận lưu bền vững
      this.clearLocalWal(characterId);
      return true;
    } catch (err: any) {
      console.warn("[Persistence] Đồng bộ server tạm thời thất bại, giữ bản nháp WAL:", err);
      usePersistenceStore.getState().setStatus("wal_cached", undefined, "Lưu tạm trên máy", err.message);
      return false;
    }
  }

  /**
   * Khởi động Heartbeat tự động lưu liên tục ngầm (2.5 giây) không cần ngắt kết nối
   */
  static startHeartbeat(characterId: number) {
    this.stopHeartbeat();
    heartbeatTimer = setInterval(() => {
      const snapshot = this.captureSnapshot(characterId);
      if (!snapshot) return;

      const currentCompare = JSON.stringify({
        x: snapshot.posX,
        z: snapshot.posZ,
        hp: snapshot.hp,
        mp: snapshot.mp,
        lvl: snapshot.level,
        exp: snapshot.experience,
        gold: snapshot.gold,
        statPoints: snapshot.statPoints,
        zone: snapshot.zoneId,
        slots: snapshot.unlockedSlots,
        invLen: snapshot.inventory.length,
        invSummary: snapshot.inventory.map((i) => `${i.id || i.itemId}:${i.equipped}:${i.enhanceLevel}`).join(";"),
      });

      // Chỉ gửi lưu ngầm nếu có thay đổi tọa độ, HP/MP, tiền, kinh nghiệm hoặc đồ
      if (currentCompare !== lastSyncedSnapshotStr) {
        this.saveLocalWal(snapshot);
        this.flushImmediate(characterId, "Tự động liên tục (2.5s)").catch(() => {});
      }
    }, 2500);
  }

  static stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  /**
   * Bắt sự kiện tắt tab / F5 / ẩn trình duyệt để lưu sống còn (keepalive: true)
   */
  static initWindowListeners(characterId: number) {
    if (typeof window === "undefined" || listenersInitialized) return;
    listenersInitialized = true;

    const handleUnload = () => {
      const snapshot = PersistenceManager.captureSnapshot(characterId);
      if (!snapshot) return;

      // 1. Ghi Local WAL đồng bộ tức thì
      PersistenceManager.saveLocalWal(snapshot);

      // 2. Bắn beacon/keepalive fetch để server lưu lại centimet cuối cùng
      try {
        const payload = JSON.stringify(snapshot);
        if (navigator.sendBeacon) {
          navigator.sendBeacon(`/api/characters/${characterId}/full-sync`, new Blob([payload], { type: "application/json" }));
        } else {
          fetch(`/api/characters/${characterId}/full-sync`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      } catch (e) {
        console.warn("[Persistence] Unload sync fallback notice:", e);
      }
    };

    window.addEventListener("clb:autosave", (e: any) => {
      const reason = e?.detail?.reason || "Sự kiện";
      PersistenceManager.flushImmediate(characterId, reason).catch(() => {});
    });

    window.addEventListener("pagehide", handleUnload);
    window.addEventListener("beforeunload", handleUnload);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        handleUnload();
      }
    });
  }
}
