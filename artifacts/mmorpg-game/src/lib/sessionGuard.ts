import { create } from "zustand";

export interface SessionClaimData {
  characterId: number;
  userId?: number;
  sessionId: string;
  timestamp: number;
}

interface SessionDisplacementState {
  isDisplaced: boolean;
  displacementReason: string;
  countdown: number;
  triggerDisplacement: (reason: string) => void;
  reset: () => void;
}

export const useSessionDisplacementStore = create<SessionDisplacementState>((set) => ({
  isDisplaced: false,
  displacementReason: "",
  countdown: 5,
  triggerDisplacement: (reason: string) => {
    // Prevent duplicate triggers
    set((state) => {
      if (state.isDisplaced) return state;

      console.warn("[SessionGuard] PHIÊN BỊ NGẮT KẾT NỐI:", reason);

      // Clean credentials immediately to prevent further background writes
      try {
        localStorage.removeItem("clb_token");
        localStorage.removeItem("token");
      } catch {}

      // Fire custom event
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("clb:session_displaced", { detail: { reason } })
        );
      }

      return {
        isDisplaced: true,
        displacementReason:
          reason ||
          "Tài khoản hoặc nhân vật của bạn vừa được đăng nhập/mở trên một tab hoặc thiết bị khác.",
        countdown: 5,
      };
    });
  },
  reset: () => set({ isDisplaced: false, displacementReason: "", countdown: 5 }),
}));

/**
 * Returns a persistent, unique identifier for this browser tab instance.
 * `sessionStorage` guarantees uniqueness across independent browser tabs.
 */
export function getTabSessionId(): string {
  if (typeof window === "undefined") return "server_session";
  try {
    let id = sessionStorage.getItem("clb_tab_session_id");
    if (!id) {
      id = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem("clb_tab_session_id", id);
    }
    return id;
  } catch {
    return `tab_${Date.now()}_fallback`;
  }
}

/**
 * Claims single-character gameplay authority for this tab.
 * Broadcasts across same-origin tabs (0.00001s transmission) and updates localStorage to fire storage events.
 */
export function claimActiveTabSession(characterId: number, userId?: number): void {
  if (typeof window === "undefined" || !characterId) return;

  const sessionId = getTabSessionId();
  const payload: SessionClaimData = {
    characterId,
    userId,
    sessionId,
    timestamp: Date.now(),
  };

  // 1. BroadcastChannel: Instant delivery to duplicate tabs
  try {
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel("clb_session_channel");
      channel.postMessage({ type: "SESSION_CLAIM", claim: payload });
      setTimeout(() => channel.close(), 100);

      const mpChannel = new BroadcastChannel("clb_multiplayer_instant");
      mpChannel.postMessage({ type: "SESSION_TAKEOVER", characterId, userId, sessionId });
      setTimeout(() => mpChannel.close(), 100);
    }
  } catch {}

  // 2. localStorage Event: Cross-tab delivery when opened without BroadcastChannel support
  try {
    localStorage.setItem("clb_active_session_claim", JSON.stringify(payload));
  } catch {}

  // 3. Server-side registration for cross-device enforcement
  const token = localStorage.getItem("clb_token") || localStorage.getItem("token");
  fetch("/api/session/claim", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "x-session-id": sessionId,
    },
    body: JSON.stringify({ characterId, sessionId }),
  }).catch(() => {});
}

/**
 * Sets up listeners for session displacement across tabs and cross-device sync.
 */
export function setupSessionGuardListeners(
  characterId: number,
  userId?: number,
  onDisplaced?: (reason: string) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const mySessionId = getTabSessionId();
  let channel: BroadcastChannel | null = null;
  let mpChannel: BroadcastChannel | null = null;

  const handleIncomingDisplacement = (claimed: { characterId?: number; userId?: number; sessionId?: string }) => {
    if (!claimed || !claimed.sessionId) return;
    if (claimed.sessionId === mySessionId) return; // Ignore own claim

    const matchChar = characterId && claimed.characterId && Number(claimed.characterId) === Number(characterId);
    const matchUser = userId && claimed.userId && Number(claimed.userId) === Number(userId);

    if (matchChar || matchUser) {
      const reason = matchChar
        ? "Nhân vật này vừa được mở trên một cửa sổ hoặc thiết bị khác."
        : "Tài khoản của bạn vừa đăng nhập trên một thiết bị khác.";
      useSessionDisplacementStore.getState().triggerDisplacement(reason);
      if (onDisplaced) onDisplaced(reason);
    }
  };

  // 1. Listen via BroadcastChannel
  try {
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel("clb_session_channel");
      channel.onmessage = (event) => {
        if (event.data?.type === "SESSION_CLAIM") {
          handleIncomingDisplacement(event.data.claim);
        }
      };

      mpChannel = new BroadcastChannel("clb_multiplayer_instant");
      mpChannel.onmessage = (event) => {
        if (event.data?.type === "SESSION_TAKEOVER") {
          handleIncomingDisplacement({
            characterId: event.data.characterId,
            userId: event.data.userId,
            sessionId: event.data.sessionId,
          });
        }
      };
    }
  } catch {}

  // 2. Listen via Storage Event
  const handleStorage = (event: StorageEvent) => {
    if (event.key === "clb_active_session_claim" && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        handleIncomingDisplacement(parsed);
      } catch {}
    }
  };
  window.addEventListener("storage", handleStorage);

  return () => {
    if (channel) {
      channel.close();
      channel = null;
    }
    if (mpChannel) {
      mpChannel.close();
      mpChannel = null;
    }
    window.removeEventListener("storage", handleStorage);
  };
}
