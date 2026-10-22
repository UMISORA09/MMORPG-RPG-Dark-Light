import { usePersistenceStore } from "@/persistence/PersistenceManager";
import { useEffect, useRef, useState, useCallback } from "react";
import { useGameWorldStore } from "@/stores/useGameWorldStore";

export interface AutoSavePayload {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  level: number;
  experience: number;
  gold: number;
  kills: number;
  posX: number;
  posZ: number;
  zoneId: string;
  str: number;
  dex: number;
  intel: number;
  luk: number;
  vit: number;
  unlockedSlots: number;
}

// Global dispatcher for immediate save events across components
export function triggerGlobalAutoSave(reason = "event") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("clb:autosave", { detail: { reason } }));
  }
}

export function useCharacterAutoSave(characterIdOverride?: number) {
  const [showIndicator, setShowIndicator] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const indicatorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSnapshotRef = useRef<string>("");
  const isSavingRef = useRef(false);

  const getPayload = useCallback((): { characterId: number; payload: AutoSavePayload } | null => {
    const s = useGameWorldStore.getState();
    const resolvedCharId =
      characterIdOverride ||
      s.activeCharacterId ||
      (typeof window !== "undefined" ? Number(localStorage.getItem("selectedCharacterId")) : 0);

    if (!resolvedCharId || isNaN(resolvedCharId) || resolvedCharId <= 0) {
      return null;
    }

    const payload: AutoSavePayload = {
      hp: Math.max(0, Math.round(s.playerHealth)),
      maxHp: Math.max(1, Math.round(s.playerMaxHealth)),
      mp: Math.max(0, Math.round(s.playerPp)),
      maxMp: Math.max(1, Math.round(s.playerMaxPp)),
      level: Math.max(1, Math.round(s.playerLevel)),
      experience: Math.max(0, Math.round(s.playerExp)),
      gold: Math.max(0, Math.round(s.playerGold)),
      kills: Math.max(0, Math.round(s.playerKills)),
      posX: Math.round(s.playerPosition.x),
      posZ: Math.round(s.playerPosition.z),
      zoneId: s.currentZone || "SAFE_VILLAGE",
      str: Math.round(s.playerStr || 15),
      dex: Math.round(s.playerDex || 15),
      intel: Math.round(s.playerIntel || 15),
      luk: Math.round(s.playerLuk || 10),
      vit: Math.round(s.playerVit || 15),
      unlockedSlots: Math.min(30, Math.max(15, Math.round(s.unlockedSlots || 15))),
    };

    return { characterId: resolvedCharId, payload };
  }, [characterIdOverride]);

  const executeSave = useCallback(
    async (isBeaconOrUnload = false) => {
      const target = getPayload();
      if (!target) return;
      const { characterId, payload } = target;
      const snapshot = JSON.stringify(payload);

      // Avoid redundant network calls if unchanged
      if (!isBeaconOrUnload && snapshot === lastSnapshotRef.current) {
        return;
      }

      // Synchronously update local storage for bulletproof client-side preservation
      if (typeof window !== "undefined") {
        try {
          const cachedStr = localStorage.getItem("clb_selected_character");
          if (cachedStr) {
            const cached = JSON.parse(cachedStr);
            const merged = { ...cached, ...payload };
            localStorage.setItem("clb_selected_character", JSON.stringify(merged));
          }
          const listStr = localStorage.getItem("clb_client_characters");
          if (listStr) {
            const list = JSON.parse(listStr);
            const idx = list.findIndex((c: any) => c.id === characterId);
            if (idx >= 0) {
              list[idx] = { ...list[idx], ...payload };
              localStorage.setItem("clb_client_characters", JSON.stringify(list));
            }
          }
        } catch {}
      }

      const url = `/api/characters/${characterId}/autosave`;

      if (isBeaconOrUnload) {
        // High priority unload save via keepalive fetch or sendBeacon
        const token = typeof window !== "undefined" ? (localStorage.getItem("clb_token") || localStorage.getItem("token")) : null;
        const authHeaders = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        try {
          if (typeof navigator !== "undefined" && navigator.sendBeacon) {
            const blob = new Blob([snapshot], { type: "application/json" });
            navigator.sendBeacon(url, blob);
          } else {
            fetch(url, {
              method: "POST",
              headers: authHeaders,
              body: snapshot,
              keepalive: true,
              credentials: "include",
            }).catch(() => {});
          }
        } catch (e) {
          try {
            fetch(url, {
              method: "POST",
              headers: authHeaders,
              body: snapshot,
              keepalive: true,
              credentials: "include",
            }).catch(() => {});
          } catch {}
        }
        return;
      }

      if (isSavingRef.current) return;
      isSavingRef.current = true;

      const token = typeof window !== "undefined" ? (localStorage.getItem("clb_token") || localStorage.getItem("token")) : null;

      try {
        const res = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: snapshot,
          credentials: "include",
        });

        if (res.ok) {
          lastSnapshotRef.current = snapshot;
          const nowStr = new Date().toLocaleTimeString("vi-VN", { hour12: false });
          setLastSavedTime(nowStr);
          setShowIndicator(true);

          if (indicatorTimerRef.current) clearTimeout(indicatorTimerRef.current);
          indicatorTimerRef.current = setTimeout(() => {
            setShowIndicator(false);
          }, 2200);
        } else {
          console.warn("[AutoSave] Máy chủ từ chối lưu tự động:", res.status);
          setShowIndicator(false);
          usePersistenceStore.getState().setStatus("error", undefined, "autosave_failed", `Lưu thất bại (${res.status})`);
        }
      } catch (err: any) {
        console.warn("[AutoSave] Lỗi mạng khi lưu tự động:", err?.message);
        setShowIndicator(false);
        usePersistenceStore.getState().setStatus("error", undefined, "autosave_network_error", "Lỗi kết nối máy chủ");
      } finally {
        isSavingRef.current = false;
      }
    },
    [getPayload]
  );

  // 1. Heartbeat interval: Every 10 seconds if dirty
  useEffect(() => {
    const timer = setInterval(() => {
      executeSave(false);
    }, 10000);

    return () => clearInterval(timer);
  }, [executeSave]);

  // 2. Immediate event triggers (custom event)
  useEffect(() => {
    const onAutoSaveEvent = () => {
      executeSave(false);
    };

    window.addEventListener("clb:autosave", onAutoSaveEvent);
    return () => window.removeEventListener("clb:autosave", onAutoSaveEvent);
  }, [executeSave]);

  // 3. Beforeunload & Visibilitychange (Exit/Refresh save)
  useEffect(() => {
    const handleBeforeUnload = () => {
      executeSave(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        executeSave(true);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (indicatorTimerRef.current) clearTimeout(indicatorTimerRef.current);
    };
  }, [executeSave]);

  return {
    showIndicator,
    lastSavedTime,
    triggerImmediateSave: () => executeSave(false),
  };
}
